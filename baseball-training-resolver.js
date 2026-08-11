const BaseballTrainingResolver = (() => {
  "use strict";

  const TRAINING_DEFINITIONS = deepFreeze({
    "power-hitting": {
      code: "power-hitting",
      skillEffects: { batting: 1 },
      bodyEffects: { fatigue: 2 }
    },
    "contact-control": {
      code: "contact-control",
      skillEffects: { ballSense: 1, discipline: 1 },
      bodyEffects: { fatigue: 1 }
    },
    "defensive-footwork": {
      code: "defensive-footwork",
      skillEffects: { reaction: 1, range: 1 },
      bodyEffects: { fatigue: 1 }
    },
    "throwing-basics": {
      code: "throwing-basics",
      skillEffects: { throwing: 1 },
      bodyEffects: { fatigue: 1 }
    },
    recovery: {
      code: "recovery",
      skillEffects: {},
      bodyEffects: { fatigue: -2 }
    }
  });

  const TOP_LEVEL_SKILLS = new Set(["ballSense", "discipline"]);

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
      skillDeltas: {},
      bodyDeltas: {},
      before: {},
      after: {},
      changes: [],
      issues: issues.slice()
    });
  }

  function readSkill(snapshot, key) {
    return TOP_LEVEL_SKILLS.has(key)
      ? snapshot?.[key]
      : snapshot?.baseballSkills?.[key];
  }

  function resolveTraining(playerSnapshot, trainingCode) {
    const definition = TRAINING_DEFINITIONS[trainingCode];
    if (!definition) return unresolved(trainingCode, ["unknown-training-code"]);
    if (!playerSnapshot || typeof playerSnapshot !== "object") {
      return unresolved(trainingCode, ["invalid-player-snapshot"]);
    }

    const skillKeys = Object.keys(definition.skillEffects);
    const missingSkills = skillKeys.filter(key => !Number.isFinite(readSkill(playerSnapshot, key)));
    const fatigue = playerSnapshot?.body?.fatigue;
    const issues = missingSkills.map(key => `invalid-skill:${key}`);
    if (!Number.isFinite(fatigue)) issues.push("invalid-body:fatigue");
    if (issues.length) return unresolved(trainingCode, issues);

    const before = { skills: {}, body: { fatigue } };
    const after = { skills: {}, body: {} };
    const skillDeltas = {};
    const bodyDeltas = {};
    const changes = [];

    skillKeys.forEach(key => {
      const previous = readSkill(playerSnapshot, key);
      const next = clamp(previous + definition.skillEffects[key]);
      before.skills[key] = previous;
      after.skills[key] = next;
      skillDeltas[key] = next - previous;
      changes.push({ family: "skill", key, before: previous, after: next, delta: next - previous });
    });

    const nextFatigue = clamp(fatigue + definition.bodyEffects.fatigue);
    after.body.fatigue = nextFatigue;
    bodyDeltas.fatigue = nextFatigue - fatigue;
    changes.push({ family: "body", key: "fatigue", before: fatigue, after: nextFatigue, delta: nextFatigue - fatigue });

    return deepFreeze({
      status: "resolved",
      code: definition.code,
      skillDeltas,
      bodyDeltas,
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
