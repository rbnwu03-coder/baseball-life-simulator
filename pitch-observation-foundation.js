(function (root, factory) {
  const plate = root.OffensivePlateApproach || (typeof module === "object" && module.exports ? require("./offensive-plate-approach.js") : null);
  const physical = root.BattedBallPhysical || (typeof module === "object" && module.exports ? require("./batted-ball-physical.js") : null);
  const api = factory(plate, physical);
  root.PitchObservationFoundation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Plate, Physical) {
  "use strict";

  const VERSION = "pitch-observation-foundation-v0.1";
  const SOURCE = "pitchObservationV1";
  // Contract order, independent of input property order.
  const OBSERVATION_TYPES = Object.freeze([
    "TARGET_HIT", "MISS_HIGH", "MISS_LOW", "LARGE_LOCATION_MISS",
    "GOOD_VELOCITY", "VELOCITY_DOWN",
    "BATTER_CHASED", "BATTER_TOOK_STRIKE", "BATTER_TOOK_BALL", "BATTER_SWUNG_IN_ZONE",
    "SWING_MISS", "FOUL", "HARD_CONTACT", "HARD_CONTACT_ON_LOCATION_MISS"
  ]);
  const PITCH_RESULTS = Object.freeze(["ball", "calledStrike", "swingingStrike", "foul", "ballInPlay"]);
  const VERTICAL_ORDER = Object.freeze(["low", "middle", "high"]);

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  function unsupported(reason) { return freeze({ supported: false, reason, observations: [] }); }
  function validCount(count, ballsMax, strikesMax) {
    return count && Number.isInteger(count.balls) && count.balls >= 0 && count.balls <= ballsMax
      && Number.isInteger(count.strikes) && count.strikes >= 0 && count.strikes <= strikesMax;
  }

  // Call only with an event from the detailed player pitchHistory authority.
  // Structural validation cannot authenticate caller provenance.
  function observePitch(event) {
    if (!Plate || !Physical) return unsupported("DEPENDENCIES_UNAVAILABLE");
    if (!event || typeof event !== "object" || event.resolutionMode === "compressedPlateAppearance"
      || event.outcomeAuthority === "compressedAIPlateAppearanceOutcomeV1"
      || event.authority === "compressedAIPlateAppearanceOutcomeV1" || !event.pitch) {
      return unsupported("NO_DETAILED_PITCH_HISTORY");
    }
    const pitch = event.pitch;
    const paIdentity = pitch.paIdentity;
    const pitchNumber = event.pitchNumber;
    if (typeof paIdentity !== "string" || paIdentity.split("|")[2] !== "player") {
      return unsupported("NOT_DETAILED_PLAYER_PITCH");
    }
    if (!Number.isInteger(pitchNumber) || pitchNumber < 1 || pitchNumber > Plate.ABSOLUTE_PITCH_SAFETY_CAP
      || pitch.pitchId !== `${paIdentity}|pitch-${pitchNumber}` || typeof pitch.pitchType !== "string" || !pitch.pitchType
      || !PITCH_RESULTS.includes(event.pitchResult) || !["take", "swing"].includes(event.action)
      || !validCount(event.countBefore, 3, 2) || !validCount(event.countAfter, 4, 3)) {
      return unsupported("INVALID_DETAILED_PITCH_EVENT");
    }
    let region = null;
    try {
      if (typeof pitch.location === "string") region = Plate.decodePitchLocation(pitch.location);
    } catch (_) { return unsupported("INVALID_ACTUAL_ZONE_FACTS"); }
    if (!region || region.pitchLocationClass !== pitch.pitchLocationClass || region.strike !== pitch.strike
      || pitch.zone !== (region.strike ? "inZone" : "outOfZone")
      || (event.action === "take" && event.pitchResult !== (region.strike ? "calledStrike" : "ball"))) {
      return unsupported("INVALID_ACTUAL_ZONE_FACTS");
    }
    try { Plate.assertPitchResultIntegrity(event); }
    catch (_) { return unsupported("INVALID_PITCH_RESPONSE_FACTS"); }

    const target = pitch.targetIntent == null ? null
      : Plate.normalizeTargetIntent(pitch.targetIntent, pitch.intendedPitchClass, pitch.targetIntent.source);
    if (pitch.targetIntent != null && !target) return unsupported("INVALID_TARGET_INTENT");
    const execution = pitch.locationRealization || {};
    const error = execution.targetError;
    const classification = execution.executionClassification;
    const measured = target !== null && Number.isInteger(error) && error >= 0;
    if (measured && classification && classification !== (error === 0 ? "hitTarget" : error === 1 ? "nearTarget" : "missedTarget")) {
      return unsupported("INVALID_LOCATION_EXECUTION_FACTS");
    }

    const facts = new Map();
    const add = (type, evidence) => facts.set(type, evidence);
    const locationEvidence = measured ? {
      targetIntent: clone(target), actualLocation: pitch.location,
      actualRegion: clone(region), targetError: error,
      executionClassification: classification || null
    } : null;
    if (measured) {
      if (classification === "hitTarget" || error === 0) add("TARGET_HIT", locationEvidence);
      const verticalDelta = VERTICAL_ORDER.indexOf(region.vertical) - VERTICAL_ORDER.indexOf(target.vertical);
      if (verticalDelta > 0) add("MISS_HIGH", locationEvidence);
      if (verticalDelta < 0) add("MISS_LOW", locationEvidence);
      if (classification === "missedTarget" || error >= 2) add("LARGE_LOCATION_MISS", locationEvidence);
    }

    const baseline = Plate.getPitchVelocityBaseline(pitch.pitchType);
    if (baseline !== null && Number.isFinite(pitch.velocity)) {
      add(pitch.velocity >= baseline ? "GOOD_VELOCITY" : "VELOCITY_DOWN", {
        pitchType: pitch.pitchType, velocity: pitch.velocity, baseline,
        baselineOwner: "OffensivePlateApproach.getPitchVelocityBaseline",
        comparison: "existingPitchTypeBaseline"
      });
    }

    const responseEvidence = {
      action: event.action, plateDecision: event.plateDecision || null,
      actualLocation: pitch.location, actualPitchClass: pitch.pitchLocationClass,
      strike: region.strike, zone: pitch.zone
    };
    if (event.action === "swing") {
      if (region.strike) add("BATTER_SWUNG_IN_ZONE", responseEvidence);
      const savedChase = event.tacticalFeedback?.observableBatterResponse?.chased;
      // Respect the existing saved boolean; derive only when it is absent.
      const chased = typeof savedChase === "boolean" ? savedChase : !region.strike;
      if (chased) add("BATTER_CHASED", { ...responseEvidence, chased,
        basis: typeof savedChase === "boolean" ? "tacticalFeedback.observableBatterResponse.chased" : "actualZone+action" });
      if (event.pitchResult === "swingingStrike") add("SWING_MISS", { pitchResult: event.pitchResult, action: event.action, contact: event.contact });
      if (event.pitchResult === "foul") add("FOUL", { pitchResult: event.pitchResult, action: event.action, contact: event.contact });
    } else add(region.strike ? "BATTER_TOOK_STRIKE" : "BATTER_TOOK_BALL", responseEvidence);

    if (event.pitchResult === "ballInPlay" && event.contact === true && event.battedBallPhysicalTruth != null) {
      const truth = Physical.normalizeBattedBallPhysicalTruth(event.battedBallPhysicalTruth);
      const score = truth?.executionEvidence?.continuousContactScore;
      if (!truth || truth.version !== Physical.VERSION || truth.identity !== pitch.pitchId
        || truth.executionEvidence?.actualPitch?.pitchId !== pitch.pitchId
        || !Number.isFinite(score) || score < 0 || score > 1) {
        return unsupported("INVALID_FAIR_CONTACT_AUTHORITY");
      }
      // Same threshold as existing tactical feedback. Foul/whiff quality is never inferred.
      if (score >= 0.72) {
        const contactEvidence = {
          pitchResult: event.pitchResult, contact: true, physicalIdentity: truth.identity,
          contactQuality: truth.contactQuality, contactScore: score,
          scoreSource: "battedBallPhysicalTruth.executionEvidence.continuousContactScore"
        };
        add("HARD_CONTACT", contactEvidence);
        if (measured && error > 0) add("HARD_CONTACT_ON_LOCATION_MISS", { ...contactEvidence, ...locationEvidence });
      }
    }

    const identity = { pitchId: pitch.pitchId, paIdentity, pitchNumber };
    const observations = OBSERVATION_TYPES.filter(type => facts.has(type)).map(type => ({
      type, ...identity, source: SOURCE, evidence: clone(facts.get(type))
    }));
    // Copies only: freezing the projection never freezes any caller-owned object.
    return freeze({ supported: true, version: VERSION, ...identity,
      countBefore: clone(event.countBefore), countAfter: clone(event.countAfter), observations });
  }

  return freeze({ VERSION, SOURCE, OBSERVATION_TYPES, observePitch });
});
