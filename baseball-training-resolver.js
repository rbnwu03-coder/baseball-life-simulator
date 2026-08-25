const BaseballTrainingResolver = (() => {
  "use strict";

  const TRAINING_DEFINITIONS = deepFreeze({
    "power-hitting": {
      code: "power-hitting",
      topLevelEffects: {},
      developmentContext: {
        targetSkill: "batting",
        activityType: "technical",
        difficulty: "challenging",
        quality: "standard",
        developmentBias: "ideal-self"
      },
      bodyEffects: { fatigue: 2 }
    },
    "contact-control": {
      code: "contact-control",
      topLevelEffects: { ballSense: 1, discipline: 1 },
      developmentContext: {
        targetSkill: "batting",
        activityType: "technical",
        difficulty: "appropriate",
        quality: "standard",
        developmentBias: "ideal-self"
      },
      bodyEffects: { fatigue: 1 }
    },
    "defensive-footwork": {
      code: "defensive-footwork",
      topLevelEffects: {},
      developmentContext: {
        targetSkill: "reaction",
        activityType: "recognition",
        difficulty: "appropriate",
        quality: "standard",
        developmentBias: "ideal-self"
      },
      bodyEffects: { fatigue: 1 }
    },
    "throwing-basics": {
      code: "throwing-basics",
      topLevelEffects: {},
      developmentContext: {
        targetSkill: "throwing",
        activityType: "repetition",
        difficulty: "appropriate",
        quality: "standard",
        developmentBias: "ideal-self"
      },
      bodyEffects: { fatigue: 1 }
    },
    recovery: {
      code: "recovery",
      topLevelEffects: {},
      developmentContext: null,
      bodyEffects: { fatigue: -2 }
    }
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function clamp(value, min = 0, max = 20) {
    return Math.max(min, Math.min(max, value));
  }

  function unresolved(code, issues) {
    return deepFreeze({
      status: "unresolved",
      code: typeof code === "string" ? code : "",
      topLevelDeltas: {},
      bodyDeltas: {},
      developmentContext: null,
      before: {},
      after: {},
      changes: [],
      issues: issues.slice()
    });
  }

  function resolveTraining(playerSnapshot, trainingCode) {
    const definition = TRAINING_DEFINITIONS[trainingCode];
    if (!definition) return unresolved(trainingCode, ["unknown-training-code"]);
    if (!playerSnapshot || typeof playerSnapshot !== "object") {
      return unresolved(trainingCode, ["invalid-player-snapshot"]);
    }

    const topLevelKeys = Object.keys(definition.topLevelEffects);
    const missingSkills = topLevelKeys.filter(key => !Number.isFinite(playerSnapshot?.[key]));
    const fatigue = playerSnapshot?.body?.fatigue;
    const issues = missingSkills.map(key => `invalid-skill:${key}`);
    if (!Number.isFinite(fatigue)) issues.push("invalid-body:fatigue");
    if (issues.length) return unresolved(trainingCode, issues);

    const before = { traits: {}, body: { fatigue } };
    const after = { traits: {}, body: {} };
    const topLevelDeltas = {};
    const bodyDeltas = {};
    const changes = [];

    topLevelKeys.forEach(key => {
      const previous = playerSnapshot[key];
      const next = clamp(previous + definition.topLevelEffects[key]);
      before.traits[key] = previous;
      after.traits[key] = next;
      topLevelDeltas[key] = next - previous;
      changes.push({ family: "trait", key, before: previous, after: next, delta: next - previous });
    });

    const nextFatigue = clamp(fatigue + definition.bodyEffects.fatigue);
    after.body.fatigue = nextFatigue;
    bodyDeltas.fatigue = nextFatigue - fatigue;
    changes.push({ family: "body", key: "fatigue", before: fatigue, after: nextFatigue, delta: nextFatigue - fatigue });

    return deepFreeze({
      status: "resolved",
      code: definition.code,
      topLevelDeltas,
      bodyDeltas,
      developmentContext: definition.developmentContext ? { ...definition.developmentContext } : null,
      before,
      after,
      changes,
      issues: []
    });
  }

  function getTrainingDefinition(trainingCode) {
    return TRAINING_DEFINITIONS[trainingCode] || null;
  }

  return Object.freeze({
    TRAINING_CODES: Object.freeze(Object.keys(TRAINING_DEFINITIONS)),
    getTrainingDefinition,
    resolveTraining
  });
})();
