var BaseballGameplayPrototypeUtils = (() => {
  "use strict";

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function isEnum(value, allowed) {
    return allowed.includes(value);
  }

  function isRoll(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 1;
  }

  function validateRolls(rolls, keys) {
    return isPlainObject(rolls) && keys.every(key => isRoll(rolls[key]));
  }

  function varianceFromRoll(roll) {
    if (roll < 0.2) return -1;
    if (roll < 0.8) return 0;
    return 1;
  }

  function qualityFromScore(score) {
    if (score >= 2) return "excellent";
    if (score === 1) return "good";
    if (score === 0) return "neutral";
    if (score === -1) return "poor";
    return "bad";
  }

  function qualityModifier(quality) {
    return { excellent: 1, good: 0, neutral: 0, poor: -1, bad: -1 }[quality];
  }

  function normalizeWeights(weights) {
    const entries = Object.entries(weights).map(([key, value]) => [key, Math.max(0, Number(value) || 0)]);
    const total = entries.reduce((sum, entry) => sum + entry[1], 0);
    if (total <= 0) return null;
    const normalized = {};
    entries.forEach(([key, value]) => {
      normalized[key] = (value / total) * 100;
    });
    return normalized;
  }

  function sampleDistribution(distribution, roll) {
    let cursor = 0;
    const entries = Object.entries(distribution);
    for (let index = 0; index < entries.length; index += 1) {
      cursor += entries[index][1] / 100;
      if (roll < cursor || index === entries.length - 1) return entries[index][0];
    }
    return entries[entries.length - 1][0];
  }

  function unresolved(input, code, message) {
    return deepFreeze({
      status: "unresolved",
      input: clone(input),
      issues: [{ code, message }],
      trace: []
    });
  }

  return deepFreeze({
    clone,
    deepFreeze,
    isPlainObject,
    isEnum,
    isRoll,
    validateRolls,
    varianceFromRoll,
    qualityFromScore,
    qualityModifier,
    normalizeWeights,
    sampleDistribution,
    unresolved
  });
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = BaseballGameplayPrototypeUtils;
}
