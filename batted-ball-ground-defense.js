(function (root, factory) {
  const sharedRunner = root.OffensiveBuntDefensiveHandoff
    || (typeof module === "object" && module.exports && typeof require === "function" ? require("./offensive-bunt-defensive-handoff.js") : null);
  const forceAdvancement = root.ForceAdvancement
    || (typeof module === "object" && module.exports && typeof require === "function" ? require("./force-advancement.js") : null);
  const api = factory(sharedRunner, forceAdvancement);
  root.BattedBallGroundDefense = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (SharedRunnerPhysical, ForceAdvancement) {
  "use strict";

  const VERSION = "bbp-b1-ground-ball-defense-v1";
  const ACCESS_LEVELS = Object.freeze(["favored", "possible", "poor", "unsupported"]);

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
  function deriveForceState({ runners = [], outs = 0 } = {}) {
    if (ForceAdvancement) {
      const chain = ForceAdvancement.buildInitialLiveBallForceChain({ runners, batterRunnerId: "batter-runner" });
      return ForceAdvancement.deriveCompatibilityForceState(chain, { outs });
    }
    const occupied = [0, 1, 2].map(index => Boolean(runners[index]));
    return deepFreeze({
      first: occupied[0], second: occupied[1], third: occupied[2],
      forceAtSecond: occupied[0],
      forceAtThird: occupied[0] && occupied[1],
      forceAtHome: occupied[0] && occupied[1] && occupied[2],
      doublePlayEligible: occupied[0] && Number(outs) < 2,
      authority: "baseState+batterRunner+outs"
    });
  }
  function createRunnerState(input) {
    if (!SharedRunnerPhysical?.createRunnerPhysicalState) throw new Error("shared runner physical primitive unavailable");
    return SharedRunnerPhysical.createRunnerPhysicalState(input);
  }
  function buildGroundBallRunnerRealization(input = {}) {
    const truth = input.physicalTruth || {};
    if (truth.ballType !== "groundBall") return null;
    const forceChain = input.forceChain || (ForceAdvancement ? ForceAdvancement.buildInitialLiveBallForceChain({
      runners: input.runners,
      batterRunnerId: input.batterRunner?.runnerId || "batter-runner"
    }) : null);
    const forceState = forceChain && ForceAdvancement
      ? ForceAdvancement.deriveCompatibilityForceState(forceChain, { outs: input.outs })
      : input.forceState || deriveForceState({ runners: input.runners, outs: input.outs });
    const entities = Array.isArray(input.runnerEntities) ? input.runnerEntities : [];
    const preContact = input.preContactRunnerStates || {};
    const existingRunners = entities.filter(runner => runner?.runnerId).map(runner => {
      const originBase = Number(runner.originBase);
      const forcedMovement = forceChain && ForceAdvancement ? ForceAdvancement.getForcedMovement(forceChain, runner.runnerId) : null;
      const forced = forcedMovement ? true : originBase === 1 ? forceState.forceAtSecond
        : originBase === 2 ? forceState.forceAtThird : originBase === 3 ? forceState.forceAtHome : false;
      const movementDecision = forced ? "commitAdvance" : "holdBase";
      const state = createRunnerState({
        runnerId: runner.runnerId,
        originBase,
        targetBase: forcedMovement?.targetBase || (forced ? ["", "second", "third", "home"][originBase] : ["", "first", "second", "third"][originBase]),
        movementDecision,
        startQuality: preContact[runner.runnerId]?.startQuality || "normalStart",
        speed: runner.speed
      });
      return deepFreeze({
        ...state,
        isForced: forced,
        forcedMovementTarget: forcedMovement?.targetBase || (forced ? state.targetBase : null),
        forceReason: forcedMovement?.forceReason || "",
        chainDepth: forcedMovement?.chainDepth ?? null
      });
    });
    const batterState = createRunnerState({
      runnerId: input.batterRunner?.runnerId || "batter-runner",
      originBase: "batter",
      targetBase: "first",
      movementDecision: "commitAdvance",
      startQuality: input.batterRunner?.startQuality || "normalStart",
      speed: input.batterRunner?.speed
    });
    const batterRunner = deepFreeze({
      ...batterState,
      isForced: true,
      forcedMovementTarget: "first",
      forceReason: forceChain?.batterRunner?.forceReason || "batterRunnerRequiredToFirst",
      chainDepth: 0
    });
    return deepFreeze({
      version: "ground-ball-runner-realization-v1",
      authority: "bbpPhysicalTruth+baseForceState",
      forceChain,
      forceState,
      existingRunners,
      batterRunner,
      runnerPhysicalStates: [...existingRunners, batterRunner]
    });
  }
  function resolveGroundBallDefensiveAccess(input = {}) {
    const truth = input.physicalTruth || {};
    const defender = input.defenderContext || {};
    const directionSupported = truth.direction === "rightSide";
    const positionSupported = defender.playerPosition === "二壘手";
    if (truth.ballType !== "groundBall" || !directionSupported || !positionSupported) {
      return deepFreeze({ playerPosition: defender.playerPosition || "", level: "unsupported", supported: false, score: 0, reason: truth.direction === "leftSide" ? "leftSideNoPlayerBallMagnet" : "unsupportedScope" });
    }
    const reaction = clamp(defender.reaction, 0, 20, 5);
    const range = clamp(defender.range, 0, 20, 5);
    const paceAdjustment = truth.pace === "hard" ? (reaction - 5) * 0.1
      : truth.pace === "weak" ? (range - 5) * 0.1 - 0.2
        : truth.pace === "firm" ? 0.25 : 0;
    const score = clamp(2.2 + (reaction - 5) * 0.08 + (range - 5) * 0.08 + paceAdjustment, 0, 4, 0);
    const level = score >= 3 ? "favored" : score >= 2 ? "possible" : score >= 1 ? "poor" : "unsupported";
    return deepFreeze({
      playerPosition: defender.playerPosition,
      level,
      supported: level !== "unsupported",
      score: Math.round(score * 1000) / 1000,
      reason: level === "favored" ? "physicalAccessFavored" : level === "possible" ? "physicalAccessPossible" : "physicalAccessDifficult",
      inputs: { direction: truth.direction, pace: truth.pace, reaction, range }
    });
  }
  function projectGroundBallCompatibilityContext(physicalTruth, defensiveAccess) {
    const pace = physicalTruth?.pace || "moderate";
    const type = pace === "hard" ? "hardGrounder" : pace === "weak" ? "slowGrounder" : "normalGrounder";
    const acquisitionProfile = pace === "weak" ? "chargeDelayed" : pace === "hard" ? "earlyArrivalReactionPressure" : pace === "firm" ? "quickAcquisition" : "standardAcquisition";
    return deepFreeze({
      version: "bbp-ground-context-projection-v1",
      sourceFamily: "ordinaryBattedBall",
      type,
      family: "groundBall",
      pace,
      label: pace === "hard" ? "強勁的右半邊滾地球" : pace === "weak" ? "需要前壓的緩慢滾地球" : "往右半邊滾動的滾地球",
      detail: pace === "hard" ? "球較早進入守區，但第一步反應壓力較高。" : pace === "weak" ? "球速偏慢，需要前壓並壓縮後續轉傳時間。" : "球進入二壘手一側的合理處理範圍。",
      timeWindow: pace === "hard" ? "reaction" : pace === "weak" ? "charge" : "balanced",
      ballDirection: physicalTruth?.direction || "",
      ballDepth: null,
      acquisitionProfile,
      chargeRequirement: pace === "weak" ? "high" : "normal",
      reactionPressure: pace === "hard" ? "high" : "normal",
      physicalTruth: clone(physicalTruth),
      defensiveAccess: clone(defensiveAccess),
      downstreamSupport: defensiveAccess?.supported ? "supported2BOrdinaryGroundBall" : "legacyFallback"
    });
  }
  function buildGroundBallTimingWindows({ ballContext, runnerRealization } = {}) {
    if (!SharedRunnerPhysical?.buildTimingWindows) throw new Error("shared defensive timing primitive unavailable");
    return SharedRunnerPhysical.buildTimingWindows({ ballContext, runnerReassessment: runnerRealization });
  }
  function buildGroundBallDefensiveOpportunity(input = {}) {
    const physicalTruth = input.physicalTruth || {};
    const forceChain = input.forceChain || (ForceAdvancement ? ForceAdvancement.buildInitialLiveBallForceChain({
      runners: input.runners,
      batterRunnerId: input.batterRunner?.runnerId || "batter-runner"
    }) : null);
    const forceState = forceChain && ForceAdvancement
      ? ForceAdvancement.deriveCompatibilityForceState(forceChain, { outs: input.outs })
      : input.forceState || deriveForceState({ runners: input.runners, outs: input.outs });
    const runnerRealization = buildGroundBallRunnerRealization({ ...input, forceChain, forceState });
    if (!runnerRealization) return null;
    const defensiveAccess = resolveGroundBallDefensiveAccess(input);
    const ballContext = projectGroundBallCompatibilityContext(physicalTruth, defensiveAccess);
    const timingWindows = buildGroundBallTimingWindows({ ballContext, runnerRealization });
    const choices = defensiveAccess.supported
      ? forceState.forceAtSecond && Number(input.outs) < 2
        ? ["secureFirstBaseOut", "initiate463"] : ["secureFirstBaseOut"]
      : [];
    return deepFreeze({
      version: VERSION,
      identity: String(input.identity || "ordinary-ground-ball"),
      sourceAuthority: "BattedBallPhysicalTruth",
      physicalTruth: clone(physicalTruth),
      forceChain,
      forceState,
      runnerRealization,
      runnerPhysicalStates: runnerRealization.runnerPhysicalStates,
      defensiveAccess,
      ballContext,
      timingWindows,
      availableDecisionIds: choices,
      firstLegState: { status: "pending", targetBase: forceState.forceAtSecond ? "second" : "first" },
      continuationState: { status: "pendingReassessment", window: timingWindows.relayToFirstWindow.state, targetBase: "first" },
      supported: defensiveAccess.supported,
      settlementApplied: false
    });
  }
  function settleGroundBallPhysicalOutcome(handoff, resolution = {}) {
    if (!handoff?.supported) return null;
    const changes = Array.isArray(resolution.runnerChanges) ? resolution.runnerChanges.map(clone) : [];
    const batterChange = changes.find(change => change.from === "batter") || null;
    const leadChange = changes.find(change => Number(change.from) === 1) || null;
    return deepFreeze({
      version: "bbp-b1-ground-ball-physical-outcome-v1",
      authority: "defensiveExecution+runnerTiming",
      batterRunner: { runnerId: handoff.runnerRealization.batterRunner.runnerId, result: batterChange?.to === "out" ? "out" : "safe", targetBase: "first" },
      leadRunner: leadChange ? { runnerId: leadChange.runnerId, result: leadChange.to === "out" ? "out" : "safe", targetBase: "second" } : null,
      outsAdded: Math.max(0, Number(resolution.outsCreated) || 0),
      baseOccupancy: Array.isArray(resolution.runnersAfter) ? resolution.runnersAfter.slice(0, 3) : [],
      runnerChanges: changes,
      firstLegState: clone(resolution.firstLegState || handoff.firstLegState),
      continuationState: clone(resolution.continuationState || handoff.continuationState),
      primaryCause: resolution.primaryCause || "",
      secondaryCause: resolution.secondaryCause || "",
      responsibleActor: resolution.responsibleActor || "",
      officialScoring: "deferred"
    });
  }
  function derivePACompatibilityResult(physicalOutcome) {
    if (!physicalOutcome) return null;
    return deepFreeze({
      result: physicalOutcome.batterRunner.result === "out" ? "out" : "single",
      authority: "physicalOutcomeToLegacyPACompatibility",
      officialScoring: "deferred"
    });
  }
  function projectCanonicalRunnerMovement(handoff) {
    return SharedRunnerPhysical.projectCanonicalRunnerMovement(handoff?.runnerRealization);
  }
  function normalizeHandoff(saved) { return saved && typeof saved === "object" ? deepFreeze(clone(saved)) : null; }

  return deepFreeze({
    VERSION, ACCESS_LEVELS, deriveForceState, buildGroundBallRunnerRealization,
    resolveGroundBallDefensiveAccess, projectGroundBallCompatibilityContext,
    buildGroundBallTimingWindows, buildGroundBallDefensiveOpportunity,
    settleGroundBallPhysicalOutcome, derivePACompatibilityResult,
    projectCanonicalRunnerMovement, normalizeHandoff
  });
});
