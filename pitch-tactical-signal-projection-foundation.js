(function (root, factory) {
  const interpretation = root.PitchTacticalInterpretationFoundation || (typeof module === "object" && module.exports ? require("./pitch-tactical-interpretation-foundation.js") : null);
  const api = factory(interpretation);
  root.PitchTacticalSignalProjectionFoundation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Interpretation) {
  "use strict";

  const VERSION = "pitch-tactical-signal-projection-v0.1";
  const SOURCE = "pitchTacticalSignalProjectionV1";
  // Serialization order only: these are parallel facts, never a priority list.
  const MAPPINGS = Object.freeze([
    ["takePattern", ["TAKE_PATTERN_PRESENT", "TAKE_PATTERN_STRONG"]],
    ["calledStrikePattern", ["CALLED_STRIKE_PATTERN_PRESENT"]],
    ["chasePattern", ["CHASE_PATTERN_PRESENT"]],
    ["swingMissPattern", ["SWING_MISS_PATTERN_PRESENT"]]
  ].map(([type, sources]) => Object.freeze([type, Object.freeze(sources)])));
  const SIGNAL_TYPES = Object.freeze(MAPPINGS.map(([type]) => type));
  const DEFERRED_INTERPRETATIONS = Object.freeze(["REPEATED_TARGET_HITS", "VELOCITY_DOWN_PATTERN", "LOCATION_MISS_PUNISHED"]);

  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  function unavailable(reason) { return freeze({ supported: false, version: VERSION, status: "unavailable", reason, signals: [] }); }
  function identity(value) {
    const parts = typeof value === "string" ? value.split("|") : [];
    return parts.length === 5 && parts[2] === "player" && parts.every(part => part.length);
  }
  function count(value) { return Number.isSafeInteger(value) && value >= 0; }
  function terminalCount(value, maximum) { return Number.isInteger(value) && value >= 0 && value <= maximum; }

  function project(input, liveBoundary) {
    if (!Interpretation || typeof Interpretation.VERSION !== "string" || typeof Interpretation.SOURCE !== "string"
      || !Array.isArray(Interpretation.INTERPRETATION_TYPES)) return unavailable("DEPENDENCIES_UNAVAILABLE");
    if (!input || input.supported !== true) return unavailable("UNSUPPORTED_INTERPRETATION");
    if (input.version !== Interpretation.VERSION) return unavailable("INTERPRETATION_VERSION_MISMATCH");
    if (!identity(input.paIdentity) || !count(input.pitchCount) || !Array.isArray(input.interpretations)
      || (input.pitchCount === 0 && input.interpretations.length)) return unavailable("INVALID_INTERPRETATION_WRAPPER");

    // Interpretation owns thresholds/evidence. Consume type metadata only;
    // never read numeric evidence, raw truth, upstream counters or Decision.
    const types = new Set();
    for (const item of input.interpretations) {
      if (!item || !Interpretation.INTERPRETATION_TYPES.includes(item.type)) return unavailable("UNKNOWN_INTERPRETATION_TYPE");
      if (item.scope !== "CURRENT_PA" || item.source !== Interpretation.SOURCE
        || typeof item.reasonCode !== "string" || !item.reasonCode.length) return unavailable("INVALID_INTERPRETATION_ITEM");
      if (types.has(item.type)) return unavailable("DUPLICATE_INTERPRETATION_TYPE");
      types.add(item.type);
    }
    // Strong supplements Present in the existing Interpretation contract.
    if (types.has("TAKE_PATTERN_STRONG") && !types.has("TAKE_PATTERN_PRESENT")) return unavailable("INCONSISTENT_TAKE_PATTERN");

    // Caller supplies a trusted projection of the existing PA lifecycle owner.
    // Structural validation does not authenticate provenance or derive history.
    const boundary = liveBoundary;
    if (!boundary || !identity(boundary.paIdentity) || !count(boundary.completedPitchCount) || !count(boundary.pitchNumber)
      || boundary.completedPitchCount >= Number.MAX_SAFE_INTEGER
      || typeof boundary.completed !== "boolean" || typeof boundary.awaitingDefense !== "boolean"
      || typeof boundary.result !== "string" || !terminalCount(boundary.balls, 4) || !terminalCount(boundary.strikes, 3)) {
      return unavailable("INVALID_LIVE_BOUNDARY");
    }
    if (input.paIdentity !== boundary.paIdentity) return unavailable("PA_IDENTITY_MISMATCH");
    if (input.pitchCount !== boundary.completedPitchCount || boundary.completedPitchCount !== boundary.pitchNumber) {
      return unavailable("PITCH_BOUNDARY_MISMATCH");
    }
    const postPa = boundary.completed || boundary.awaitingDefense || boundary.result.length > 0 || boundary.balls === 4 || boundary.strikes === 3;
    const signals = [];
    if (!postPa) for (const [type, sources] of MAPPINGS) {
      const sourceInterpretations = sources.filter(source => types.has(source));
      if (!sourceInterpretations.length) continue;
      const signal = { type, scope: "CURRENT_PA_NEXT_PITCH_SIGNAL", sourceInterpretations };
      if (type === "takePattern") signal.strength = types.has("TAKE_PATTERN_STRONG") ? "strong" : "present";
      signals.push(signal);
    }
    return freeze({ supported: true, version: VERSION, paIdentity: input.paIdentity, completedPitchCount: input.pitchCount,
      nextPitchNumber: postPa ? null : input.pitchCount + 1, status: postPa ? "postPa" : "live", signals,
      deferredInterpretations: DEFERRED_INTERPRETATIONS.filter(type => types.has(type)), source: SOURCE });
  }

  return freeze({ VERSION, SOURCE, SIGNAL_TYPES, DEFERRED_INTERPRETATIONS, project });
});
