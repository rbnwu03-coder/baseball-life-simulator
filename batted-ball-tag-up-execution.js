(function (root, factory) {
  const api = factory();
  root.BattedBallTagUpExecution = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "bbp-b2b2-tag-up-execution-v1";
  const ROUTES = Object.freeze({ sendHome: "tagUpSendHome", holdThird: "tagUpHoldThird" });
  const RNG_NAMESPACES = Object.freeze({
    runnerAdvance: "tag-up-runner-advance-v1",
    throwExecution: "tag-up-throw-execution-v1",
    receivingExecution: "tag-up-receiving-execution-v1"
  });

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  function clamp(value, minimum = 0, maximum = 20, fallback = 5) {
    const number = Number(value);
    return Math.max(minimum, Math.min(maximum, Number.isFinite(number) ? number : fallback));
  }
  function stableUnit(identity, namespace) {
    const text = `${identity}|${namespace}`;
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 4294967296;
  }
  function getRoll(options, key, identity, namespace) {
    const value = Number(options?.rolls?.[key] ?? options?.[key]);
    return Number.isFinite(value) ? clamp(value, 0, 0.999999, 0.5) : stableUnit(identity, namespace);
  }
  function resolveTagUpExecution(input = {}, options = {}) {
    const route = String(input.selectedRoute || "");
    const situationId = String(input.situationId || "tag-up");
    const executionIdentity = String(input.executionIdentity || `${situationId}|execution|${route}`);
    if (!Object.values(ROUTES).includes(route)) return null;
    if (route === ROUTES.holdThird) return deepFreeze({
      version: VERSION, executionIdentity, selectedRoute: route,
      runnerAdvanceChallenge: { attempted: false, reason: "runnerHeldAtThird" },
      throwChallenge: { attempted: false, reason: "noAdvanceAttempt" },
      receivingChallenge: { attempted: false, reason: "noAdvanceAttempt" },
      timingMargin: null,
      physicalOutcome: { code: "heldThird", runnerResult: "heldThird", outsDelta: 0, runsDelta: 0, originBase: "third", targetBase: "home" },
      physicalConsequenceApplied: false
    });
    const context = input.contextSnapshot || {};
    const runner = context.runnerContext || {};
    const defense = context.defensiveContext || {};
    const ball = defense.catchContext || {};
    const runnerRoll = getRoll(options, "runnerRoll", executionIdentity, RNG_NAMESPACES.runnerAdvance);
    const throwRoll = getRoll(options, "throwRoll", executionIdentity, RNG_NAMESPACES.throwExecution);
    const receivingRoll = getRoll(options, "receivingRoll", executionIdentity, RNG_NAMESPACES.receivingExecution);
    const speed = clamp(runner.speed);
    const readAdjustment = runner.readQuality === "strong" ? 1.2 : runner.readQuality === "lateRecognition" ? -1.2 : 0;
    const startAdjustment = runner.responseTiming === "early" ? 0.8 : runner.responseTiming === "late" ? -0.8 : 0;
    const depthAdjustment = ball.depth === "deep" ? 1.3 : ball.depth === "medium" ? 0.4 : 0;
    const runnerScore = speed * 0.72 + readAdjustment + startAdjustment + depthAdjustment + (0.5 - runnerRoll) * 8;
    const arm = clamp(defense.catchDefender?.arm);
    const throwing = clamp(defense.catchDefender?.throwing);
    const transferAdjustment = ball.pace === "hard" ? -0.3 : 0.25;
    const throwScore = arm * 0.34 + throwing * 0.42 + transferAdjustment + (0.5 - throwRoll) * 8;
    const receiving = clamp(defense.receivingTarget?.receiving ?? defense.receivingTarget?.fielding);
    const reaction = clamp(defense.receivingTarget?.reaction);
    const receivingScore = receiving * 0.48 + reaction * 0.24 + (0.5 - receivingRoll) * 6;
    const defenseScore = throwScore * 0.7 + receivingScore * 0.3;
    const timingMargin = Math.round((runnerScore - defenseScore) * 1000) / 1000;
    const safe = timingMargin >= 0;
    return deepFreeze({
      version: VERSION, executionIdentity, selectedRoute: route,
      runnerAdvanceChallenge: { attempted: true, speed, readAdjustment, startAdjustment, depthAdjustment, roll: runnerRoll, score: Math.round(runnerScore * 1000) / 1000, rngNamespace: RNG_NAMESPACES.runnerAdvance },
      throwChallenge: { attempted: true, defenderId: defense.catchDefender?.defenderId || "", arm, throwing, transferAdjustment, roll: throwRoll, score: Math.round(throwScore * 1000) / 1000, rngNamespace: RNG_NAMESPACES.throwExecution },
      receivingChallenge: { attempted: true, receiverId: defense.receivingTarget?.receiverId || "", receiving, reaction, roll: receivingRoll, score: Math.round(receivingScore * 1000) / 1000, rngNamespace: RNG_NAMESPACES.receivingExecution },
      timingMargin,
      physicalOutcome: { code: safe ? "safeHome" : "taggedOutAtHome", runnerResult: safe ? "safe" : "out", outsDelta: safe ? 0 : 1, runsDelta: safe ? 1 : 0, originBase: "third", targetBase: "home" },
      physicalConsequenceApplied: false
    });
  }
  function normalizeExecutionState(saved) {
    return saved && typeof saved === "object" && saved.version === VERSION ? deepFreeze(clone(saved)) : null;
  }

  return deepFreeze({ VERSION, ROUTES, RNG_NAMESPACES, resolveTagUpExecution, normalizeExecutionState });
});
