(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CompetitionRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";

  const VERSION = 1;
  const RULE_SET_IDS = Object.freeze({
    HIGH_SCHOOL_FULL_GAME: "highSchoolFullGameV1",
    HIGH_SCHOOL_TRAINING_GAME: "highSchoolTrainingGameV1",
    HIGH_SCHOOL_LEGACY_FALLBACK: "highSchoolLegacyFallbackV1"
  });
  const FULL_GAME_ORIGINS = Object.freeze([
    "officialCompetition",
    "homeInvitationFriendly",
    "awayInvitationFriendly",
    "neutralFriendly",
    "developmentMatch"
  ]);
  const WARNINGS = Object.freeze({
    CONTEXT_FALLBACK: "RULESET_CONTEXT_FALLBACK",
    LEGACY_CONTEXT_LIMITED: "LEGACY_RULESET_CONTEXT_LIMITED"
  });
  const freeze = value => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  const copy = value => JSON.parse(JSON.stringify(value));
  const check = (ok, message) => { if (!ok) throw new Error(`Competition rules: ${message}`); };

  function createRules(enabled, regulationInnings = 7) {
    const innings = Math.max(1, Math.floor(Number(regulationInnings) || 7));
    return freeze({
      version: VERSION,
      regulationInnings: innings,
      extraInningTiebreak: {
        enabled,
        startInning: enabled ? innings + 1 : null,
        runnerBase: enabled ? 2 : null,
        runnerSource: enabled ? "previousLineupSlot" : null
      }
    });
  }

  const RULE_SETS = freeze({
    [RULE_SET_IDS.HIGH_SCHOOL_FULL_GAME]: createRules(true),
    [RULE_SET_IDS.HIGH_SCHOOL_TRAINING_GAME]: createRules(false),
    [RULE_SET_IDS.HIGH_SCHOOL_LEGACY_FALLBACK]: createRules(false)
  });

  function snapshot(ruleSetId, rules, warning = "") {
    return freeze({ ruleSetId, rules: freeze(copy(rules)), warning });
  }

  function resolveMatchCompetitionRules(matchContext) {
    const origin = typeof matchContext?.matchOrigin === "string" ? matchContext.matchOrigin : "";
    if (FULL_GAME_ORIGINS.includes(origin)) {
      return snapshot(RULE_SET_IDS.HIGH_SCHOOL_FULL_GAME, RULE_SETS[RULE_SET_IDS.HIGH_SCHOOL_FULL_GAME]);
    }
    if (origin === "trainingCamp") {
      return snapshot(RULE_SET_IDS.HIGH_SCHOOL_TRAINING_GAME, RULE_SETS[RULE_SET_IDS.HIGH_SCHOOL_TRAINING_GAME]);
    }
    return snapshot(
      RULE_SET_IDS.HIGH_SCHOOL_LEGACY_FALLBACK,
      RULE_SETS[RULE_SET_IDS.HIGH_SCHOOL_LEGACY_FALLBACK],
      WARNINGS.CONTEXT_FALLBACK
    );
  }

  function normalizeCapturedRules(ruleSetId, rules) {
    check(Object.values(RULE_SET_IDS).includes(ruleSetId), "unsupported rule set identity");
    check(rules && rules.version === VERSION, "unsupported rules version");
    check(Number.isInteger(rules.regulationInnings) && rules.regulationInnings > 0, "invalid regulation innings");
    const tiebreak = rules.extraInningTiebreak;
    check(tiebreak && typeof tiebreak.enabled === "boolean", "invalid tiebreak contract");
    if (tiebreak.enabled) {
      check(Number.isInteger(tiebreak.startInning) && tiebreak.startInning > rules.regulationInnings, "invalid tiebreak start inning");
      check(tiebreak.runnerBase === 2, "unsupported tiebreak runner base");
      check(tiebreak.runnerSource === "previousLineupSlot", "unsupported tiebreak runner source");
    }
    return snapshot(ruleSetId, rules);
  }

  function normalizeMatchRulesSnapshot(captured, matchContext, options = {}) {
    if (captured?.ruleSetId && captured?.rules) {
      const normalized = normalizeCapturedRules(captured.ruleSetId, captured.rules);
      return captured.warning ? snapshot(normalized.ruleSetId, normalized.rules, String(captured.warning)) : normalized;
    }
    if (matchContext?.matchOrigin) return resolveMatchCompetitionRules(matchContext);
    const regulationInnings = Math.max(1, Math.floor(Number(options.legacyRegulationInnings) || 7));
    return snapshot(
      RULE_SET_IDS.HIGH_SCHOOL_LEGACY_FALLBACK,
      createRules(false, regulationInnings),
      WARNINGS.LEGACY_CONTEXT_LIMITED
    );
  }

  return Object.freeze({
    VERSION,
    RULE_SET_IDS,
    FULL_GAME_ORIGINS,
    WARNINGS,
    resolveMatchCompetitionRules,
    normalizeMatchRulesSnapshot
  });
});
