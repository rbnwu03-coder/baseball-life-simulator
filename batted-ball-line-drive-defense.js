(function (root, factory) {
  const api = factory();
  root.BattedBallLineDriveDefense = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "bbp-b2a-line-drive-defense-v1";
  const RNG_NAMESPACES = Object.freeze({ catchExecution: "line-drive-catch-execution-v1" });
  const WINDOW_STATES = Object.freeze(["expired", "narrow", "normal", "wide"]);

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  function clamp(value, minimum, maximum, fallback = minimum) {
    const number = Number(value);
    return Math.max(minimum, Math.min(maximum, Number.isFinite(number) ? number : fallback));
  }
  function stableHash(value) {
    let hash = 2166136261;
    for (const character of String(value)) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function deterministicUnit(namespace, identity) { return stableHash(`${namespace}|${identity}`) / 4294967296; }
  function baseName(base) { return ["first", "second", "third"][Number(base) - 1] || ""; }

  function buildAirborneBallContext(physicalTruth = {}) {
    if (physicalTruth.ballType !== "lineDrive") return null;
    return deepFreeze({
      version: "airborne-ball-context-v1",
      sourceAuthority: "BattedBallPhysicalTruth",
      physicalIdentity: String(physicalTruth.identity || ""),
      ballType: physicalTruth.ballType,
      pace: physicalTruth.pace,
      direction: physicalTruth.direction,
      depth: physicalTruth.depth
    });
  }

  function buildRunnerInitialReadStates(input = {}) {
    const airborneContext = input.airborneContext || buildAirborneBallContext(input.physicalTruth);
    if (!airborneContext) return [];
    const preContact = input.preContactRunnerStates || {};
    return deepFreeze((input.runnerEntities || []).filter(runner => runner?.runnerId).map(runner => {
      const prior = preContact[runner.runnerId] || {};
      const wasAdvancing = ["advancing", "committed"].includes(prior.movementState) || prior.movementDecision === "commitAdvance";
      const reaction = clamp(runner.reaction, 0, 20, 5);
      const baseballIQ = clamp(runner.baseballIQ, 0, 20, 5);
      return {
        runnerId: runner.runnerId,
        originBase: Number(runner.originBase),
        outsAtContact: Math.max(0, Math.min(2, Number(input.outs) || 0)),
        originBaseOccupiedAtContact: Boolean((input.runners || [])[Number(runner.originBase) - 1]),
        preContactMovementState: prior.movementState || "stationary",
        readAction: wasAdvancing ? "brakeAndRetreat" : "freezeRead",
        movementState: wasAdvancing ? "retreating" : "holding",
        targetBase: baseName(runner.originBase),
        responseTiming: reaction >= 9 ? "early" : reaction >= 5 ? "normal" : "late",
        readQuality: baseballIQ >= 9 ? "strong" : baseballIQ >= 5 ? "ordinary" : "lateRecognition",
        speed: Number(runner.speed) || 5,
        finalBaseOutcome: "unresolved",
        authority: "airborneContext+preContactRunnerState"
      };
    }));
  }

  function resolveCatchAccess(input = {}) {
    const context = input.airborneContext || buildAirborneBallContext(input.physicalTruth) || {};
    const defender = input.defenderContext || {};
    const structuralSupport = context.ballType === "lineDrive" && context.depth === "shallow"
      && context.direction === "rightSide" && defender.playerPosition === "二壘手";
    if (!structuralSupport) {
      const reason = context.direction === "leftSide" ? "leftSideNoPlayerBallMagnet"
        : context.depth !== "shallow" ? "unsupportedLineDriveDepth" : "unsupportedScope";
      return deepFreeze({ playerPosition: defender.playerPosition || "", level: "unsupported", supported: false, score: 0, reason });
    }
    const reaction = clamp(defender.reaction, 0, 20, 5);
    const range = clamp(defender.range, 0, 20, 5);
    const catching = clamp(defender.catching ?? defender.fielding, 0, 20, 5);
    const pacePressure = context.pace === "hard" ? -0.25 : context.pace === "weak" ? -0.1 : 0;
    const score = clamp(2.15 + (reaction - 5) * 0.1 + (range - 5) * 0.055 + (catching - 5) * 0.035 + pacePressure, 0, 4, 0);
    const level = score >= 3 ? "favored" : score >= 2 ? "possible" : score >= 1 ? "poor" : "unsupported";
    return deepFreeze({
      playerPosition: defender.playerPosition,
      level,
      supported: level !== "unsupported",
      score: Math.round(score * 1000) / 1000,
      reason: level === "favored" ? "physicalCatchAccessFavored" : level === "possible" ? "physicalCatchAccessPossible" : "physicalCatchAccessDifficult",
      inputs: { reaction, range, catching, pace: context.pace, direction: context.direction, depth: context.depth }
    });
  }

  function buildCatchTimingWindow({ airborneContext = {}, defensiveAccess = {} } = {}) {
    const accessScore = { favored: 3, possible: 2, poor: 1, unsupported: -2 }[defensiveAccess.level] ?? -2;
    const paceAdjustment = airborneContext.pace === "hard" ? -1 : airborneContext.pace === "weak" ? -0.5 : airborneContext.pace === "firm" ? -0.5 : 0;
    const score = accessScore + paceAdjustment;
    const state = score >= 3 ? "wide" : score >= 2 ? "normal" : score >= 1 ? "narrow" : "expired";
    return deepFreeze({ version: "line-drive-catch-window-v1", state, score, taxonomy: "canonicalDefensiveWindow", authority: "catchAccess+airbornePace" });
  }

  function buildCatchOpportunity(input = {}) {
    const physicalTruth = input.physicalTruth || {};
    const airborneContext = buildAirborneBallContext(physicalTruth);
    if (!airborneContext) return null;
    const runnerInitialReadStates = buildRunnerInitialReadStates({ ...input, airborneContext });
    const defensiveAccess = resolveCatchAccess({ ...input, airborneContext });
    const catchWindow = buildCatchTimingWindow({ airborneContext, defensiveAccess });
    const supported = defensiveAccess.supported && catchWindow.state !== "expired";
    return deepFreeze({
      version: VERSION,
      identity: String(input.identity || `${physicalTruth.identity || "line-drive"}|catch`),
      sourceAuthority: "BattedBallPhysicalTruth",
      physicalTruth: clone(physicalTruth),
      airborneContext,
      runnerInitialReadStates,
      defensiveAccess,
      catchWindow,
      supported,
      fallbackAuthority: supported ? "" : "existingLegacyOutcomeAdapter",
      catchResult: null,
      retouchRequirements: [],
      liveBallContinuation: null,
      settlementApplied: false
    });
  }

  function buildRetouchRequirements(opportunity) {
    return deepFreeze((opportunity?.runnerInitialReadStates || []).map(state => ({
      runnerId: state.runnerId,
      originBase: state.originBase,
      targetBase: baseName(state.originBase),
      required: true,
      reason: "caughtAirBall",
      satisfiedAtCatch: state.movementState === "holding",
      runnerOut: false
    })));
  }

  function resolveCatchExecution(opportunity, defenderContext = {}, options = {}) {
    if (!opportunity?.supported) return null;
    const catching = clamp(defenderContext.catching ?? defenderContext.fielding, 0, 20, 5);
    const reaction = clamp(defenderContext.reaction, 0, 20, 5);
    const range = clamp(defenderContext.range, 0, 20, 5);
    const rawRoll = Number(options.executionRoll);
    const roll = Number.isFinite(rawRoll) ? clamp(rawRoll, 0, 0.999999, 0.5)
      : deterministicUnit(RNG_NAMESPACES.catchExecution, opportunity.identity);
    const windowModifier = { wide: 1.2, normal: 0.4, narrow: -0.8, expired: -4 }[opportunity.catchWindow.state] ?? -4;
    const executionScore = catching * 0.45 + reaction * 0.35 + range * 0.2 + windowModifier + (0.5 - roll) * 8;
    const caught = executionScore >= 6.5;
    return deepFreeze({
      version: "line-drive-catch-result-v1",
      authority: "catchOpportunity+existingDefensiveCapabilities+deterministicVariation",
      result: caught ? "caught" : "notCaught",
      caught,
      ballState: caught ? "securedBeforeGround" : "liveAfterGroundContact",
      batterRunner: { result: caught ? "out" : "active", finalBaseOutcome: caught ? "out" : "unresolved" },
      retouchRequirements: caught ? buildRetouchRequirements(opportunity) : [],
      liveBallContinuation: caught ? null : {
        required: true,
        status: "transitionalLegacyContinuation",
        ballRemainsLive: true,
        batterAutomaticallySafe: false,
        automaticHit: false,
        authority: "catchFailurePhysicalResult"
      },
      executionEvidence: {
        catching, reaction, range, windowState: opportunity.catchWindow.state,
        executionScore: Math.round(executionScore * 1000) / 1000,
        roll,
        rngNamespace: RNG_NAMESPACES.catchExecution
      },
      officialScoring: "deferred"
    });
  }

  function applyCatchResult(opportunity, catchResult, extra = {}) {
    return normalizeCatchState({
      ...clone(opportunity),
      catchResult: clone(catchResult),
      retouchRequirements: clone(catchResult?.retouchRequirements || []),
      liveBallContinuation: clone(catchResult?.liveBallContinuation || null),
      paCompatibilityResult: clone(extra.paCompatibilityResult || null),
      settlementFacts: clone(extra.settlementFacts || null),
      settlementApplied: extra.settlementApplied === true
    });
  }
  function normalizeCatchState(saved) { return saved && typeof saved === "object" ? deepFreeze(clone(saved)) : null; }

  return deepFreeze({
    VERSION, RNG_NAMESPACES, WINDOW_STATES, stableHash, deterministicUnit,
    buildAirborneBallContext, buildRunnerInitialReadStates, resolveCatchAccess,
    buildCatchTimingWindow, buildCatchOpportunity, buildRetouchRequirements,
    resolveCatchExecution, applyCatchResult, normalizeCatchState
  });
});
