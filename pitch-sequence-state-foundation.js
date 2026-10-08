(function (root, factory) {
  const observation = root.PitchObservationFoundation || (typeof module === "object" && module.exports ? require("./pitch-observation-foundation.js") : null);
  const api = factory(observation);
  root.PitchSequenceStateFoundation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Observation) {
  "use strict";

  const VERSION = "pitch-sequence-state-foundation-v0.1";
  const RECENT_WINDOW = 3;
  const LOCATION = Object.freeze({ targetHits: "TARGET_HIT", missHigh: "MISS_HIGH", missLow: "MISS_LOW", largeMisses: "LARGE_LOCATION_MISS" });
  const RESPONSE = Object.freeze({ tookStrike: "BATTER_TOOK_STRIKE", tookBall: "BATTER_TOOK_BALL", chased: "BATTER_CHASED", swungInZone: "BATTER_SWUNG_IN_ZONE", swingMiss: "SWING_MISS", foul: "FOUL", hardContact: "HARD_CONTACT" });
  const CONTACT = Object.freeze({ swingMisses: "SWING_MISS", fouls: "FOUL", hardContacts: "HARD_CONTACT", hardContactsOnLocationMiss: "HARD_CONTACT_ON_LOCATION_MISS" });
  const VELOCITY = Object.freeze({ goodVelocityCount: "GOOD_VELOCITY", velocityDownCount: "VELOCITY_DOWN" });
  const SWINGS = Object.freeze(["BATTER_CHASED", "BATTER_SWUNG_IN_ZONE", "SWING_MISS", "FOUL", "HARD_CONTACT", "HARD_CONTACT_ON_LOCATION_MISS"]);
  const STREAKS = Object.freeze({ consecutiveTakes: "take", consecutiveSwings: "swing", consecutiveChases: "BATTER_CHASED",
    consecutiveCalledStrikes: "BATTER_TOOK_STRIKE", consecutiveTargetHits: "TARGET_HIT",
    consecutiveSwingMisses: "SWING_MISS", consecutiveVelocityDown: "VELOCITY_DOWN" });
  const GROUP_KEYS = Object.freeze({
    location: [...Object.keys(LOCATION), "measuredPitches", "unobservedPitches"],
    batterResponse: ["totalTakes", "totalSwings", "unobservedResponses", ...Object.keys(RESPONSE)],
    contact: Object.keys(CONTACT), velocity: [...Object.keys(VELOCITY), "unobservedPitches"], sequence: Object.keys(STREAKS)
  });

  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  function unsupported(reason) { return freeze({ supported: false, version: VERSION, reason }); }
  function playerPA(id) { return typeof id === "string" && id.split("|").length === 5 && id.split("|")[2] === "player"; }
  function countValid(count, terminal = false) {
    return count && Number.isInteger(count.balls) && count.balls >= 0 && count.balls <= (terminal ? 4 : 3)
      && Number.isInteger(count.strikes) && count.strikes >= 0 && count.strikes <= (terminal ? 3 : 2);
  }
  function sameCount(a, b) { return a.balls === b.balls && a.strikes === b.strikes; }
  function copyCount(count) { return { balls: count.balls, strikes: count.strikes }; }
  function copyPitch(pitch) { return { pitchId: pitch.pitchId, pitchNumber: pitch.pitchNumber, observationTypes: [...pitch.observationTypes] }; }

  function createInitialSequenceState(paIdentity) {
    if (!Observation) return unsupported("DEPENDENCIES_UNAVAILABLE");
    if (!playerPA(paIdentity)) return unsupported("INVALID_PLAYER_PA_IDENTITY");
    const state = { supported: true, version: VERSION, paIdentity, pitchCount: 0,
      lastPitchId: null, lastPitchNumber: null, currentCount: { balls: 0, strikes: 0 }, lastPitch: null, recentPitches: [] };
    for (const [group, keys] of Object.entries(GROUP_KEYS)) state[group] = Object.fromEntries(keys.map(key => [key, 0]));
    return freeze(state);
  }

  // Only wrapper metadata and observation identities/types are consumed. Evidence
  // belongs to the observation owner and is neither reparsed nor retained here.
  function validatePitch(pitch) {
    if (!Observation) return "DEPENDENCIES_UNAVAILABLE";
    if (!pitch || pitch.supported !== true) return "UNSUPPORTED_OBSERVED_PITCH";
    if (pitch.version !== Observation.VERSION || !playerPA(pitch.paIdentity)
      || !Number.isInteger(pitch.pitchNumber) || pitch.pitchNumber < 1
      || pitch.pitchId !== `${pitch.paIdentity}|pitch-${pitch.pitchNumber}`
      || !countValid(pitch.countBefore) || !countValid(pitch.countAfter, true) || !Array.isArray(pitch.observations)) return "INVALID_OBSERVED_PITCH";
    const types = new Set();
    for (const observation of pitch.observations) {
      if (!observation || !Observation.OBSERVATION_TYPES.includes(observation.type)) return "UNKNOWN_OBSERVATION_TYPE";
      if (observation.source !== Observation.SOURCE || observation.pitchId !== pitch.pitchId
        || observation.paIdentity !== pitch.paIdentity || observation.pitchNumber !== pitch.pitchNumber
        || !observation.evidence || typeof observation.evidence !== "object" || Array.isArray(observation.evidence)) return "INVALID_OBSERVATION_IDENTITY";
      if (types.has(observation.type)) return "DUPLICATE_OBSERVATION_TYPE";
      types.add(observation.type);
    }
    const has = type => types.has(type);
    const take = has("BATTER_TOOK_STRIKE") || has("BATTER_TOOK_BALL");
    if ((has("BATTER_TOOK_STRIKE") && has("BATTER_TOOK_BALL")) || (take && SWINGS.some(has))
      || (has("MISS_HIGH") && has("MISS_LOW"))
      || (has("TARGET_HIT") && ["MISS_HIGH", "MISS_LOW", "LARGE_LOCATION_MISS", "HARD_CONTACT_ON_LOCATION_MISS"].some(has))
      || (has("BATTER_CHASED") && has("BATTER_SWUNG_IN_ZONE"))
      || (has("GOOD_VELOCITY") && has("VELOCITY_DOWN"))
      || (has("SWING_MISS") && ["FOUL", "HARD_CONTACT"].some(has))
      || (has("FOUL") && has("HARD_CONTACT"))
      || (has("HARD_CONTACT_ON_LOCATION_MISS") && !has("HARD_CONTACT"))) return "CONFLICTING_OBSERVATIONS";
    return null;
  }

  function validState(state) {
    if (!state || state.supported !== true || state.version !== VERSION || !playerPA(state.paIdentity)
      || !Number.isInteger(state.pitchCount) || state.pitchCount < 0 || !countValid(state.currentCount, true)
      || !Array.isArray(state.recentPitches) || state.recentPitches.length !== Math.min(state.pitchCount, RECENT_WINDOW)) return false;
    for (const [group, keys] of Object.entries(GROUP_KEYS)) {
      if (!state[group] || keys.some(key => !Number.isInteger(state[group][key]) || state[group][key] < 0 || state[group][key] > state.pitchCount)) return false;
    }
    if (!state.pitchCount) return state.lastPitch === null && state.lastPitchId === null && state.lastPitchNumber === null
      && sameCount(state.currentCount, { balls: 0, strikes: 0 });
    const expectedId = `${state.paIdentity}|pitch-${state.pitchCount}`;
    if (state.lastPitchId !== expectedId || state.lastPitchNumber !== state.pitchCount || !state.lastPitch
      || state.lastPitch.pitchId !== expectedId || state.lastPitch.pitchNumber !== state.pitchCount) return false;
    return state.recentPitches.every((pitch, index) => {
      const number = state.pitchCount - state.recentPitches.length + index + 1;
      return pitch && pitch.pitchNumber === number && pitch.pitchId === `${state.paIdentity}|pitch-${number}`
        && Array.isArray(pitch.observationTypes) && new Set(pitch.observationTypes).size === pitch.observationTypes.length
        && pitch.observationTypes.every(type => Observation.OBSERVATION_TYPES.includes(type));
    }) && Array.isArray(state.lastPitch.observationTypes)
      && state.lastPitch.observationTypes.length === state.recentPitches.at(-1).observationTypes.length
      && state.lastPitch.observationTypes.every((type, index) => type === state.recentPitches.at(-1).observationTypes[index]);
  }

  function appendPitchObservation(previous, pitch) {
    const error = validatePitch(pitch);
    if (error) return unsupported(error);
    if (!validState(previous)) return unsupported("INVALID_PREVIOUS_STATE");
    if (pitch.paIdentity !== previous.paIdentity) return unsupported("PA_IDENTITY_MISMATCH");
    // Canonical identity includes the pitch number, so all earlier duplicates
    // can be rejected without retaining an unbounded seen-ID history.
    if (pitch.pitchNumber <= previous.pitchCount) return unsupported("DUPLICATE_PITCH");
    if (pitch.pitchNumber !== previous.pitchCount + 1) return unsupported("PITCH_ORDER_DISCONTINUITY");
    if (previous.currentCount.balls === 4 || previous.currentCount.strikes === 3) return unsupported("COUNT_ALREADY_TERMINAL");
    if (!sameCount(previous.currentCount, pitch.countBefore)) return unsupported("COUNT_DISCONTINUITY");

    const types = new Set(pitch.observations.map(observation => observation.type));
    const has = type => types.has(type);
    const take = has("BATTER_TOOK_STRIKE") || has("BATTER_TOOK_BALL");
    const swing = SWINGS.some(has);
    const lastPitch = { pitchId: pitch.pitchId, pitchNumber: pitch.pitchNumber,
      observationTypes: Observation.OBSERVATION_TYPES.filter(has) };
    const state = { supported: true, version: VERSION, paIdentity: previous.paIdentity, pitchCount: previous.pitchCount + 1,
      lastPitchId: pitch.pitchId, lastPitchNumber: pitch.pitchNumber, currentCount: copyCount(pitch.countAfter),
      lastPitch, recentPitches: [...previous.recentPitches.map(copyPitch), copyPitch(lastPitch)].slice(-RECENT_WINDOW) };
    for (const [group, keys] of Object.entries(GROUP_KEYS)) state[group] = Object.fromEntries(keys.map(key => [key, previous[group][key]]));
    for (const [group, mapping] of [["location", LOCATION], ["batterResponse", RESPONSE], ["contact", CONTACT], ["velocity", VELOCITY]]) {
      for (const [key, type] of Object.entries(mapping)) state[group][key] += Number(has(type));
    }
    const locationObserved = Object.values(LOCATION).some(has);
    state.location.measuredPitches += Number(locationObserved);
    state.location.unobservedPitches += Number(!locationObserved);
    state.batterResponse.totalTakes += Number(take);
    state.batterResponse.totalSwings += Number(swing);
    state.batterResponse.unobservedResponses += Number(!take && !swing);
    state.velocity.unobservedPitches += Number(!Object.values(VELOCITY).some(has));
    for (const [key, type] of Object.entries(STREAKS)) {
      const present = type === "take" ? take : type === "swing" ? swing : has(type);
      state.sequence[key] = present ? previous.sequence[key] + 1 : 0;
    }
    return freeze(state);
  }

  function build(observedPitches) {
    if (!Array.isArray(observedPitches) || !observedPitches.length) return unsupported("EMPTY_OR_INVALID_SEQUENCE");
    const error = validatePitch(observedPitches[0]);
    if (error) return unsupported(error);
    let state = createInitialSequenceState(observedPitches[0].paIdentity);
    for (const pitch of observedPitches) {
      state = appendPitchObservation(state, pitch);
      if (!state.supported) return state;
    }
    return state;
  }

  return freeze({ VERSION, RECENT_WINDOW, createInitialSequenceState, appendPitchObservation, build });
});
