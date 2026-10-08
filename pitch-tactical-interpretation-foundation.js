(function (root, factory) {
  const sequence = root.PitchSequenceStateFoundation || (typeof module === "object" && module.exports ? require("./pitch-sequence-state-foundation.js") : null);
  const api = factory(sequence);
  root.PitchTacticalInterpretationFoundation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Sequence) {
  "use strict";

  const VERSION = "pitch-tactical-interpretation-v0.1";
  const SOURCE = "pitchTacticalInterpretationV1";
  // Order is part of the contract: response, execution, velocity, contact.
  // Strong take supplements Present; these presence types carry no numeric score.
  const RULES = Object.freeze([
    ["TAKE_PATTERN_PRESENT", "sequence", "consecutiveTakes", 2, "CONSECUTIVE_TAKES_AT_LEAST_TWO"],
    ["TAKE_PATTERN_STRONG", "sequence", "consecutiveTakes", 3, "CONSECUTIVE_TAKES_AT_LEAST_THREE"],
    ["CALLED_STRIKE_PATTERN_PRESENT", "sequence", "consecutiveCalledStrikes", 2, "CONSECUTIVE_CALLED_STRIKES_AT_LEAST_TWO"],
    ["CHASE_PATTERN_PRESENT", "sequence", "consecutiveChases", 2, "CONSECUTIVE_CHASES_AT_LEAST_TWO"],
    ["SWING_MISS_PATTERN_PRESENT", "sequence", "consecutiveSwingMisses", 2, "CONSECUTIVE_SWING_MISSES_AT_LEAST_TWO"],
    ["REPEATED_TARGET_HITS", "sequence", "consecutiveTargetHits", 2, "CONSECUTIVE_TARGET_HITS_AT_LEAST_TWO"],
    ["VELOCITY_DOWN_PATTERN", "sequence", "consecutiveVelocityDown", 2, "CONSECUTIVE_VELOCITY_DOWN_AT_LEAST_TWO"],
    ["LOCATION_MISS_PUNISHED", "contact", "hardContactsOnLocationMiss", 1, "HARD_CONTACT_ON_LOCATION_MISS_IN_CURRENT_PA"]
  ].map(Object.freeze));
  const INTERPRETATION_TYPES = Object.freeze(RULES.map(rule => rule[0]));

  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  function unsupported(reason) { return freeze({ supported: false, version: VERSION, reason, interpretations: [] }); }
  function counter(value, pitchCount) { return Number.isSafeInteger(value) && value >= 0 && value <= pitchCount; }

  function interpret(state) {
    if (!Sequence) return unsupported("DEPENDENCIES_UNAVAILABLE");
    if (!state || state.supported !== true) return unsupported("UNSUPPORTED_SEQUENCE_STATE");
    if (state.version !== Sequence.VERSION) return unsupported("SEQUENCE_VERSION_MISMATCH");
    const identity = typeof state.paIdentity === "string" ? state.paIdentity.split("|") : [];
    if (identity.length !== 5 || identity[2] !== "player" || identity.some(part => !part.length)
      || !Number.isSafeInteger(state.pitchCount) || state.pitchCount < 0) return unsupported("INVALID_SEQUENCE_STATE");
    // Validate only the consumed Sequence projection. Never inspect recent pitch
    // types, raw events, Observation evidence, or invoke an upstream reducer.
    if (!state.sequence || !state.contact || RULES.some(([, group, key]) => !counter(state[group][key], state.pitchCount))) {
      return unsupported("INVALID_SEQUENCE_STATE");
    }
    const interpretations = [];
    for (const [type, group, key, minimum, reasonCode] of RULES) {
      const value = state[group][key];
      if (value >= minimum) interpretations.push({ type, scope: "CURRENT_PA", source: SOURCE, reasonCode, evidence: { [key]: value } });
    }
    return freeze({ supported: true, version: VERSION, paIdentity: state.paIdentity, pitchCount: state.pitchCount, interpretations });
  }

  return freeze({ VERSION, SOURCE, INTERPRETATION_TYPES, interpret });
});
