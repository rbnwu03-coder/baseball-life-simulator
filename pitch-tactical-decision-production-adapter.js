(function (root, factory) {
  const decision = root.PitchTacticalDecisionFoundation || (typeof module === "object" && module.exports ? require("./pitch-tactical-decision-foundation.js") : null);
  const tactical = root.PitcherCatcherTacticalIntegration || (typeof module === "object" && module.exports ? require("./pitcher-catcher-tactical-integration.js") : null);
  const api = factory(decision, tactical);
  root.PitchTacticalDecisionProductionAdapter = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Decision, Tactical) {
  "use strict";

  const VERSION = "pitch-tactical-decision-production-adapter-v0.1";
  // The production owner supplies the vocabulary; neutral stays foundation-only.
  const vocabulary = Tactical ? Tactical.TACTICAL_INTENTS : null;

  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  function unsupported(reason) {
    return freeze({ supported: false, version: VERSION, reason, status: "abstain", candidateIntent: null, reasonCodes: [reason] });
  }
  function validIdentity(value) {
    const parts = typeof value === "string" ? value.split("|") : [];
    return parts.length === 5 && parts[2] === "player" && parts.every(part => part.length);
  }
  function validCount(value) { return Number.isSafeInteger(value) && value >= 0; }

  function adapt(decisionResult, productionBoundary) {
    if (!Decision || !Tactical || typeof Tactical.getRepeatSuccessEligibility !== "function") return unsupported("DEPENDENCIES_UNAVAILABLE");
    if (!Array.isArray(vocabulary) || !vocabulary.length) return unsupported("TACTICAL_INTENT_AUTHORITY_CONFLICT");
    if (!decisionResult || decisionResult.supported !== true) return unsupported("UNSUPPORTED_DECISION");
    if (decisionResult.version !== Decision.VERSION) return unsupported("DECISION_VERSION_MISMATCH");
    // Consume only the selected Decision projection. Candidate ranking and all
    // upstream pattern evidence remain with their owners, even on abstention.
    if (decisionResult.source !== Decision.SOURCE || !validIdentity(decisionResult.paIdentity)
      || !validCount(decisionResult.pitchCount)) return unsupported("INVALID_DECISION_WRAPPER");
    const intent = decisionResult.selectedIntent;
    if (!Decision.INTENT_PRIORITY.includes(intent) || (intent !== "resetNeutral" && !vocabulary.includes(intent))) {
      return unsupported("UNKNOWN_PRODUCTION_INTENT");
    }
    if (!decisionResult.pitchCount && intent !== "resetNeutral") return unsupported("INVALID_DECISION_WRAPPER");
    const boundary = productionBoundary;
    const context = boundary?.tacticalContext;
    if (!boundary || !validIdentity(boundary.paIdentity) || !validCount(boundary.pitchCount)
      || !context || context.version !== Tactical.VERSION || !validIdentity(context.paIdentity)
      || !Number.isSafeInteger(context.pitchIndex) || context.pitchIndex < 1) return unsupported("INVALID_PRODUCTION_BOUNDARY");
    if (boundary.paIdentity !== decisionResult.paIdentity || context.paIdentity !== boundary.paIdentity) return unsupported("PA_IDENTITY_MISMATCH");
    // N is the completed detailed-pitch count. This context selects pitch N+1.
    if (boundary.pitchCount !== decisionResult.pitchCount || context.pitchIndex - 1 !== boundary.pitchCount) {
      return unsupported("PITCH_BOUNDARY_MISMATCH");
    }
    let reason = "CANONICAL_PRODUCTION_CANDIDATE", candidateIntent = intent;
    if (intent === "resetNeutral") {
      candidateIntent = null; reason = "NEUTRAL_DECISION_ABSTENTION";
    } else if (intent === "repeatSuccess" && !Tactical.getRepeatSuccessEligibility(context).repeatEligible) {
      candidateIntent = null; reason = "REPEAT_SUCCESS_NOT_PRODUCTION_ELIGIBLE";
    }
    return freeze({ supported: true, version: VERSION, paIdentity: decisionResult.paIdentity, pitchCount: decisionResult.pitchCount,
      status: candidateIntent === null ? "abstain" : "candidate", candidateIntent, decisionIntent: intent, reasonCodes: [reason],
      provenance: { decisionVersion: decisionResult.version, decisionIntent: intent } });
  }

  return freeze({ VERSION, adapt });
});
