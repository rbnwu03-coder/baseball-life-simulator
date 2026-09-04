(function (root, factory) {
  const airborneDefense = root.BattedBallLineDriveDefense
    || (typeof module === "object" && module.exports && typeof require === "function" ? require("./batted-ball-line-drive-defense.js") : null);
  const api = factory(airborneDefense);
  root.BattedBallFlyBallDefense = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (AirborneDefense) {
  "use strict";

  const VERSION = "bbp-b2b1-fly-ball-defense-v1";
  const RNG_NAMESPACES = Object.freeze({ catchExecution: "fly-ball-catch-execution-v1" });
  // v1 uses catch confirmation as a proxy; exact first-touch timing is deferred.
  const TIMING_ABSTRACTION = "catchConfirmationProxyForFirstTouch";
  const ACCESS_LEVELS = Object.freeze(["favored", "possible", "poor", "unsupported"]);
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
  function targetBase(originBase) { return ["second", "third", "home"][Number(originBase) - 1] || ""; }

  function buildFlyBallRunnerInitialReadStates(input = {}) {
    const context = input.airborneContext || AirborneDefense?.buildAirborneBallContext(input.physicalTruth);
    if (context?.ballType !== "flyBall") return [];
    const preContact = input.preContactRunnerStates || {};
    return deepFreeze((input.runnerEntities || []).filter(runner => runner?.runnerId).map(runner => {
      const prior = preContact[runner.runnerId] || {};
      const movementState = prior.movementState || "stationary";
      const explicitlyTouching = typeof prior.touchingOriginBase === "boolean" ? prior.touchingOriginBase : null;
      const offBase = ["advancing", "committed", "retreating", "offBase", "controlledLead"].includes(movementState);
      const touchingOriginAtContact = explicitlyTouching === null ? !offBase : explicitlyTouching;
      const originBase = Number(runner.originBase);
      const outsAtContact = Math.max(0, Math.min(2, Number(input.outs) || 0));
      const meaningfulThirdBaseTag = originBase === 3 && outsAtContact <= 1 && ["medium", "deep"].includes(context.depth);
      const readAction = !touchingOriginAtContact ? "retreatToRetouch"
        : meaningfulThirdBaseTag ? "prepareToTag" : movementState === "controlledLead" ? "controlledLead" : "holdForCatch";
      return {
        runnerId: runner.runnerId,
        originBase,
        outsAtContact,
        originBaseOccupiedAtContact: Boolean((input.runners || [])[originBase - 1]),
        preContactMovementState: movementState,
        touchingOriginAtContact,
        readAction,
        movementState: touchingOriginAtContact ? "holding" : "retreating",
        responseTiming: clamp(runner.reaction, 0, 20, 5) >= 9 ? "early" : clamp(runner.reaction, 0, 20, 5) >= 5 ? "normal" : "late",
        readQuality: clamp(runner.baseballIQ, 0, 20, 5) >= 9 ? "strong" : clamp(runner.baseballIQ, 0, 20, 5) >= 5 ? "ordinary" : "lateRecognition",
        speed: Number(runner.speed) || 5,
        finalMovementDecision: "unresolved",
        finalOutcome: "unresolved",
        authority: "flyBallContext+preContactRunnerState"
      };
    }));
  }

  function resolveFlyBallCatchAccess(input = {}) {
    const context = input.airborneContext || AirborneDefense?.buildAirborneBallContext(input.physicalTruth) || {};
    const defender = input.defenderContext || {};
    const expectedPosition = context.direction === "rightSide" ? "右外野手" : context.direction === "middle" ? "中外野手" : "";
    const structuralSupport = context.ballType === "flyBall" && ["medium", "deep"].includes(context.depth)
      && ["rightSide", "middle"].includes(context.direction) && Boolean(defender.defenderId) && defender.position === expectedPosition;
    if (!structuralSupport) {
      const reason = context.direction === "leftSide" ? "unsupportedLeftSideAssignment"
        : !["medium", "deep"].includes(context.depth) ? "unsupportedFlyBallDepth"
          : !expectedPosition ? "unsupportedFlyBallDirection" : "defenderAssignmentUnavailable";
      return deepFreeze({ defenderId: defender.defenderId || "", defenderPosition: defender.position || "", level: "unsupported", supported: false, score: 0, reason });
    }
    const reaction = clamp(defender.reaction, 0, 20, 5);
    const range = clamp(defender.range, 0, 20, 5);
    const catching = clamp(defender.catching ?? defender.fielding, 0, 20, 5);
    const depthPressure = context.depth === "deep" ? -0.35 : 0;
    const score = clamp(2.1 + (range - 5) * 0.09 + (reaction - 5) * 0.05 + (catching - 5) * 0.045 + depthPressure, 0, 4, 0);
    const level = score >= 3 ? "favored" : score >= 2 ? "possible" : score >= 1 ? "poor" : "unsupported";
    return deepFreeze({
      defenderId: defender.defenderId || "",
      defenderPosition: defender.position,
      level,
      supported: level !== "unsupported",
      score: Math.round(score * 1000) / 1000,
      reason: level === "favored" ? "flyBallCatchAccessFavored" : level === "possible" ? "flyBallCatchAccessPossible" : "flyBallCatchAccessDifficult",
      inputs: { catching, reaction, range, pace: context.pace, direction: context.direction, depth: context.depth }
    });
  }

  function buildFlyBallCatchTimingWindow({ airborneContext = {}, defensiveAccess = {} } = {}) {
    const accessScore = { favored: 3, possible: 2, poor: 1, unsupported: -2 }[defensiveAccess.level] ?? -2;
    const depthAdjustment = airborneContext.depth === "deep" ? -0.5 : 0;
    const paceAdjustment = airborneContext.pace === "hard" ? -0.25 : airborneContext.pace === "weak" ? 0.25 : 0;
    const score = accessScore + depthAdjustment + paceAdjustment;
    const state = score >= 3 ? "wide" : score >= 2 ? "normal" : score >= 1 ? "narrow" : "expired";
    return deepFreeze({ version: "fly-ball-catch-window-v1", state, score, taxonomy: "canonicalDefensiveWindow", authority: "flyBallCatchAccess+depth+pace" });
  }

  function buildFlyBallCatchOpportunity(input = {}) {
    if (!AirborneDefense) throw new Error("airborne defense foundation unavailable");
    const physicalTruth = input.physicalTruth || {};
    const airborneContext = AirborneDefense.buildAirborneBallContext(physicalTruth);
    if (airborneContext?.ballType !== "flyBall") return null;
    const runnerInitialReadStates = buildFlyBallRunnerInitialReadStates({ ...input, airborneContext });
    const defensiveAccess = resolveFlyBallCatchAccess({ ...input, airborneContext });
    const catchWindow = buildFlyBallCatchTimingWindow({ airborneContext, defensiveAccess });
    const supported = defensiveAccess.supported && catchWindow.state !== "expired";
    return deepFreeze({
      version: VERSION,
      identity: String(input.identity || `${physicalTruth.identity || "fly-ball"}|catch`),
      sourceAuthority: "BattedBallPhysicalTruth",
      physicalTruth: clone(physicalTruth),
      airborneContext,
      defenderContext: clone(input.defenderContext || {}),
      runnerInitialReadStates,
      defensiveAccess,
      catchWindow,
      outsBeforeCatch: Math.max(0, Math.min(2, Number(input.outs) || 0)),
      supported,
      fallbackAuthority: supported ? "" : "existingLegacyOutcomeAdapter",
      catchResult: null,
      outsAfterCatch: null,
      postCatchRunnerStates: [],
      pendingTagUpHandoff: null,
      liveBallContinuation: null,
      settlementApplied: false
    });
  }

  function resolveFlyBallCatchExecution(opportunity, options = {}) {
    if (!opportunity?.supported || !AirborneDefense) return null;
    const result = AirborneDefense.resolveCatchExecution(opportunity, opportunity.defenderContext || {}, {
      executionRoll: options.executionRoll,
      rngNamespace: RNG_NAMESPACES.catchExecution
    });
    return result ? deepFreeze({ ...clone(result), retouchRequirements: [] }) : null;
  }

  function buildRetouchState(readState, catchResult, outsAfterCatch) {
    if (!catchResult?.caught) return deepFreeze({
      runnerId: readState.runnerId, originBase: readState.originBase,
      touchingOriginAtCatch: false, retouchRequired: false, retouchSatisfied: false,
      status: "notApplicableLiveBall", reason: "ballNotCaught"
    });
    if (Number(outsAfterCatch) >= 3) return deepFreeze({
      runnerId: readState.runnerId, originBase: readState.originBase,
      touchingOriginAtCatch: readState.touchingOriginAtContact === true,
      retouchRequired: false, retouchSatisfied: readState.touchingOriginAtContact === true,
      status: "notApplicableHalfInningEnded", reason: "thirdOutCatch"
    });
    const touchingOriginAtCatch = readState.touchingOriginAtContact === true;
    return deepFreeze({
      runnerId: readState.runnerId,
      originBase: readState.originBase,
      touchingOriginAtCatch,
      retouchRequired: !touchingOriginAtCatch,
      retouchSatisfied: touchingOriginAtCatch,
      status: touchingOriginAtCatch ? "satisfiedAtCatch" : readState.movementState === "retreating" ? "retreatUnresolved" : "requiredUnsatisfied",
      reason: touchingOriginAtCatch ? "runnerTouchingOriginAtCatch" : "caughtAirBallRetouchRequired"
    });
  }

  function buildTagUpLegality(readState, retouchState, catchResult, outsAfterCatch) {
    const base = {
      runnerId: readState.runnerId,
      originBase: readState.originBase,
      catchConfirmed: catchResult?.caught === true,
      outsAfterCatch: Number(outsAfterCatch),
      retouchSatisfied: retouchState.retouchSatisfied === true,
      targetBase: targetBase(readState.originBase),
      timingAbstraction: TIMING_ABSTRACTION
    };
    if (!catchResult?.caught) return deepFreeze({ ...base, status: "notApplicable", advancementLegal: false, reason: "ballNotCaught" });
    if (Number(outsAfterCatch) >= 3) return deepFreeze({ ...base, status: "notActionable", advancementLegal: false, reason: "thirdOutCatch" });
    if (!retouchState.retouchSatisfied) return deepFreeze({ ...base, status: "blocked", advancementLegal: false, reason: "retouchNotSatisfied" });
    return deepFreeze({ ...base, status: "legal", advancementLegal: true, reason: "catchConfirmedAndLegalOriginEstablished" });
  }

  function buildPostCatchRunnerStates(opportunity, catchResult, outsAfterCatch) {
    return deepFreeze((opportunity?.runnerInitialReadStates || []).map(readState => {
      const retouchState = buildRetouchState(readState, catchResult, outsAfterCatch);
      const tagUpLegality = buildTagUpLegality(readState, retouchState, catchResult, outsAfterCatch);
      return {
        runnerId: readState.runnerId,
        originBase: readState.originBase,
        readState: clone(readState),
        retouchState,
        tagUpLegality,
        liveBallContinuation: catchResult?.caught ? null : { required: true, status: "pending", ballRemainsLive: true },
        finalMovementDecision: "unresolved",
        finalOutcome: "unresolved"
      };
    }));
  }

  function applyFlyBallCatchResult(opportunity, catchResult, options = {}) {
    const outsAfterCatch = catchResult?.caught ? Math.min(3, opportunity.outsBeforeCatch + 1) : opportunity.outsBeforeCatch;
    const postCatchRunnerStates = buildPostCatchRunnerStates(opportunity, catchResult, outsAfterCatch);
    const legalCandidates = postCatchRunnerStates.filter(state => state.tagUpLegality.advancementLegal);
    const pendingTagUpHandoff = catchResult?.caught && outsAfterCatch < 3 && legalCandidates.length
      ? deepFreeze({ status: "available", decisionMade: false, runnerCandidates: legalCandidates.map(state => state.runnerId), authority: "tagUpLegalityOnly" })
      : deepFreeze({ status: "notApplicable", decisionMade: false, runnerCandidates: [], reason: !catchResult?.caught ? "ballNotCaught" : outsAfterCatch >= 3 ? "thirdOutCatch" : "noLegalRunner" });
    return normalizeFlyBallCatchState({
      ...clone(opportunity),
      catchResult: clone(catchResult),
      outsAfterCatch,
      postCatchRunnerStates: clone(postCatchRunnerStates),
      pendingTagUpHandoff: clone(pendingTagUpHandoff),
      liveBallContinuation: clone(catchResult?.liveBallContinuation || null),
      paCompatibilityResult: clone(options.paCompatibilityResult || null),
      settlementFacts: clone(options.settlementFacts || null),
      settlementApplied: options.settlementApplied === true
    });
  }

  function normalizeFlyBallCatchState(saved) { return saved && typeof saved === "object" ? deepFreeze(clone(saved)) : null; }

  return deepFreeze({
    VERSION, RNG_NAMESPACES, TIMING_ABSTRACTION, ACCESS_LEVELS, WINDOW_STATES,
    buildFlyBallRunnerInitialReadStates, resolveFlyBallCatchAccess, buildFlyBallCatchTimingWindow,
    buildFlyBallCatchOpportunity, resolveFlyBallCatchExecution, buildRetouchState,
    buildTagUpLegality, buildPostCatchRunnerStates, applyFlyBallCatchResult, normalizeFlyBallCatchState
  });
});
