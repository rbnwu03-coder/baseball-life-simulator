(function (root, factory) {
  const interpretation = root.PitchTacticalInterpretationFoundation || (typeof module === "object" && module.exports ? require("./pitch-tactical-interpretation-foundation.js") : null);
  const tactical = root.PitcherCatcherTacticalIntegration || (typeof module === "object" && module.exports ? require("./pitcher-catcher-tactical-integration.js") : null);
  const api = factory(interpretation, tactical);
  root.PitchTacticalDecisionFoundation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Interpretation, Tactical) {
  "use strict";

  const VERSION = "pitch-tactical-decision-v0.1";
  const SOURCE = "pitchTacticalDecisionV1";
  // Reuse the production owner's four intent names. resetNeutral is an inert
  // foundation fallback, not a new production intent or recommendation mapping.
  const INTENT_PRIORITY = Object.freeze(["changeLook", "repeatSuccess", "expand", "challenge", "resetNeutral"]);
  const vocabulary = Tactical ? Tactical.TACTICAL_INTENTS : null;
  const vocabularyValid = Array.isArray(vocabulary) && INTENT_PRIORITY.slice(0, 4).every(intent => vocabulary.includes(intent));
  const ATTACK = Object.freeze(["TAKE_PATTERN_PRESENT", "TAKE_PATTERN_STRONG", "CALLED_STRIKE_PATTERN_PRESENT"]);
  const EXPAND = Object.freeze(["CHASE_PATTERN_PRESENT", "SWING_MISS_PATTERN_PRESENT"]);

  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  function unsupported(reason) { return freeze({ supported: false, version: VERSION, reason, candidates: [] }); }

  function decide(input) {
    if (!Interpretation || !Tactical) return unsupported("DEPENDENCIES_UNAVAILABLE");
    if (!vocabularyValid) return unsupported("TACTICAL_INTENT_AUTHORITY_CONFLICT");
    if (!input || input.supported !== true) return unsupported("UNSUPPORTED_INTERPRETATION");
    if (input.version !== Interpretation.VERSION) return unsupported("INTERPRETATION_VERSION_MISMATCH");
    const identity = typeof input.paIdentity === "string" ? input.paIdentity.split("|") : [];
    if (identity.length !== 5 || identity[2] !== "player" || identity.some(part => !part.length)
      || !Number.isSafeInteger(input.pitchCount) || input.pitchCount < 0 || !Array.isArray(input.interpretations)
      || (!input.pitchCount && input.interpretations.length)) return unsupported("INVALID_INTERPRETATION_WRAPPER");
    const types = new Set();
    for (const item of input.interpretations) {
      if (!item || !Interpretation.INTERPRETATION_TYPES.includes(item.type)) return unsupported("UNKNOWN_INTERPRETATION_TYPE");
      if (item.scope !== "CURRENT_PA" || item.source !== Interpretation.SOURCE
        || typeof item.reasonCode !== "string" || !item.reasonCode.length) return unsupported("INVALID_INTERPRETATION_ITEM");
      if (types.has(item.type)) return unsupported("DUPLICATE_INTERPRETATION_TYPE");
      types.add(item.type);
    }
    // Read type metadata only. Numeric evidence and all upstream facts remain
    // with Interpretation; this layer never re-evaluates a pattern threshold.
    const candidates = [];
    const add = (intent, triggers, reason) => {
      const interpretationTypes = Interpretation.INTERPRETATION_TYPES.filter(type => triggers.includes(type) && types.has(type));
      if (interpretationTypes.length) candidates.push({ intent, reasonCodes: [reason], interpretationTypes });
    };
    add("changeLook", ["LOCATION_MISS_PUNISHED"], "LOCATION_MISS_PUNISHED_SUPPORTS_CHANGE_LOOK");
    add("expand", EXPAND, "RESPONSE_PATTERN_SUPPORTS_EXPANSION");
    add("challenge", ATTACK, "TAKEN_PITCH_PATTERN_SUPPORTS_CHALLENGE");
    // Canonical production repeatSuccess requires a chase/whiff response;
    // target hits alone or target hits plus called strikes do not establish it.
    if (types.has("REPEATED_TARGET_HITS") && EXPAND.some(type => types.has(type))) {
      add("repeatSuccess", ["REPEATED_TARGET_HITS", ...EXPAND], "TARGET_HITS_WITH_CHASE_OR_WHIFF_SUPPORT_REPEAT");
    }
    if (!candidates.length) candidates.push({ intent: "resetNeutral", reasonCodes: ["NO_ACTIONABLE_INTERPRETATION"], interpretationTypes: [] });
    candidates.sort((a, b) => INTENT_PRIORITY.indexOf(a.intent) - INTENT_PRIORITY.indexOf(b.intent));
    return freeze({ supported: true, version: VERSION, paIdentity: input.paIdentity, pitchCount: input.pitchCount,
      selectedIntent: candidates[0].intent, candidates, source: SOURCE });
  }

  return freeze({ VERSION, SOURCE, INTENT_PRIORITY, decide });
});
