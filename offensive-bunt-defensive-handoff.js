(function (root, factory) {
  const api = factory();
  root.OffensiveBuntDefensiveHandoff = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "offensive-bunt-defensive-handoff-v1";
  const BASE_NAMES = Object.freeze(["first", "second", "third", "home"]);
  const ARRIVAL_PROFILES = Object.freeze(["early", "normal", "late", "veryLate"]);
  const WINDOW_STATES = Object.freeze(["expired", "narrow", "normal", "wide"]);

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  function clampIndex(value, maximum) { return Math.max(0, Math.min(maximum, Math.floor(Number(value) || 0))); }
  function baseName(base) { return BASE_NAMES[clampIndex(Number(base) - 1, BASE_NAMES.length - 1)]; }
  function deriveArrivalProfile(speed, startQuality) {
    const speedValue = Number(speed) || 5;
    const startAdjustment = { preparedStart: -1, normalStart: 0, lateStart: 1, brokenStart: 2 }[startQuality] || 0;
    const speedAdjustment = speedValue >= 8 ? -1 : speedValue <= 3 ? 1 : 0;
    return ARRIVAL_PROFILES[clampIndex(1 + startAdjustment + speedAdjustment, ARRIVAL_PROFILES.length - 1)];
  }
  function deriveStartQuality({ priorRunnerCommitment = "", reaction = 5, fairBallType = "groundBunt", preparationState = "" } = {}) {
    if (fairBallType === "popBunt") return "brokenStart";
    if (priorRunnerCommitment === "conditionalAdvance" && Number(reaction) >= 5) return "preparedStart";
    if (["rushed", "broken"].includes(preparationState)) return "lateStart";
    return "normalStart";
  }
  function createRunnerPhysicalState({ runnerId, originBase, targetBase, movementDecision, startQuality, speed } = {}) {
    const movementState = movementDecision === "commitAdvance" ? "advancing"
      : movementDecision === "retreat" ? "retreating" : "holding";
    return deepFreeze({
      runnerId: String(runnerId || ""),
      originBase,
      targetBase,
      movementDecision,
      startQuality,
      movementState,
      timingProfile: deriveArrivalProfile(speed, startQuality),
      speed: Number(speed) || 5
    });
  }
  function reassessRunners(input = {}) {
    const truth = input.physicalTruth || {};
    const existing = Array.isArray(input.existingRunners) ? input.existingRunners : [];
    const isFair = truth.contactResult === "fairContact";
    const isGround = isFair && truth.fairBallType === "groundBunt";
    const isPop = isFair && truth.fairBallType === "popBunt";
    const forceState = input.forceState || {};
    const states = existing.filter(runner => runner?.runnerId).map(runner => {
      const originBase = Number(runner.originBase) || 1;
      const forced = originBase === 1 ? forceState.forceAtSecond === true
        : originBase === 2 ? forceState.forceAtThird === true
          : originBase === 3 ? forceState.forceAtHome === true : false;
      const movementDecision = isPop ? "retreat" : isGround && forced ? "commitAdvance" : "holdBase";
      const startQuality = deriveStartQuality({
        priorRunnerCommitment: input.priorRunnerCommitment,
        reaction: runner.reaction,
        fairBallType: truth.fairBallType,
        preparationState: truth.preparationState
      });
      return createRunnerPhysicalState({
        runnerId: runner.runnerId,
        originBase,
        targetBase: movementDecision === "commitAdvance" ? baseName(originBase + 1) : baseName(originBase),
        movementDecision,
        startQuality,
        speed: runner.speed
      });
    });
    const batterRunner = isFair ? createRunnerPhysicalState({
      runnerId: input.batterRunner?.runnerId || "batter-runner",
      originBase: "batter",
      targetBase: "first",
      movementDecision: isGround ? "commitAdvance" : "holdBase",
      startQuality: isGround ? (truth.preparationState === "set" ? "preparedStart" : "normalStart") : "normalStart",
      speed: input.batterRunner?.speed
    }) : null;
    return deepFreeze({
      version: "runner-reassessment-v1",
      authority: "physicalBallAndRunnerReassessment",
      status: !isFair ? "noPhysicalAdvance" : isPop ? "popBuntReturnPending" : "groundBuntRealized",
      existingRunners: states,
      batterRunner,
      downstreamSupport: isGround ? "groundBunt" : isPop ? "unsupportedPopBuntDefense" : "none"
    });
  }
  function projectCanonicalRunnerMovement(reassessment) {
    const runnerMovementProgress = {};
    const runnerTargets = {};
    (reassessment?.existingRunners || []).forEach(state => {
      const index = Number(state.originBase) - 1;
      if (index < 0 || index > 2) return;
      runnerMovementProgress[index] = state.movementState;
      runnerTargets[index] = state.targetBase;
    });
    return deepFreeze({ runnerMovementProgress, runnerTargets, authority: "runnerPhysicalStateProjection" });
  }
  function buildDefensiveBallContext(physicalTruth = {}, defenderContext = {}) {
    const ground = physicalTruth.contactResult === "fairContact" && physicalTruth.fairBallType === "groundBunt";
    const placement = physicalTruth.placement || "";
    const pace = physicalTruth.pace || "";
    const supported = ground && placement === "secondBaseSide" && defenderContext.playerPosition === "二壘手";
    const direction = { firstBaseSide: "leftSide", pitcherArea: "straightAtPlayer", secondBaseSide: "rightSide", thirdBaseSide: "leftSide" }[placement] || "straightAtPlayer";
    const type = pace === "hard" ? "hardGrounder" : "slowGrounder";
    const paceLabel = { dead: "幾乎停住的短打", soft: "很緩的短打", controlled: "受控滾動的短打", hard: "偏強的短打" }[pace] || "短打";
    const accessLevel = !ground ? "unsupported" : supported && pace === "hard" ? "favored" : supported ? "possible" : "unsupported";
    return deepFreeze({
      version: "bunt-defensive-ball-context-v1",
      sourceFamily: "bunt",
      type,
      family: "groundBall",
      pace: pace === "hard" ? "hard" : "slow",
      label: paceLabel,
      detail: placement === "secondBaseSide" ? "球往二壘手一側滾動。" : "此落點的完整守備位置尚未納入本階段。",
      timeWindow: pace === "hard" ? "reaction" : "charge",
      ballDirection: direction,
      ballDepth: "shallow",
      physicalTruth: { fairBallType: physicalTruth.fairBallType || null, pace: pace || null, placement: placement || null },
      defensiveAccess: {
        playerPosition: defenderContext.playerPosition || "",
        level: accessLevel,
        supported,
        auditScope: "v1SecondBaseDefensiveVertical"
      },
      downstreamSupport: supported ? "supported2BVertical" : ground ? "unsupportedPlacementFallback" : "unsupportedPopBuntFallback"
    });
  }
  function windowFromScore(score) {
    return score >= 3 ? "wide" : score >= 2 ? "normal" : score >= 1 ? "narrow" : "expired";
  }
  function buildTimingWindows({ ballContext, runnerReassessment } = {}) {
    const leadRunner = (runnerReassessment?.existingRunners || []).find(state => state.originBase === 1 && state.movementState === "advancing");
    const batterRunner = runnerReassessment?.batterRunner || null;
    const accessScore = { favored: 3, possible: 2, poor: 1, unsupported: -2 }[ballContext?.defensiveAccess?.level] ?? -2;
    const arrivalAdjustment = { early: -2, normal: -1, late: 0, veryLate: 1 };
    const leadState = leadRunner ? windowFromScore(accessScore + (arrivalAdjustment[leadRunner.timingProfile] ?? -1)) : "expired";
    const firstState = batterRunner ? windowFromScore(accessScore + (arrivalAdjustment[batterRunner.timingProfile] ?? -1)) : "expired";
    const continuationState = { wide: "normal", normal: "normal", narrow: "expired", expired: "expired" }[firstState] || "expired";
    return deepFreeze({
      leadRunnerForceWindow: { state: leadState, targetBase: "second", runnerId: leadRunner?.runnerId || "" },
      batterRunnerFirstBaseWindow: { state: firstState, targetBase: "first", runnerId: batterRunner?.runnerId || "" },
      relayToFirstWindow: { state: continuationState, derivedAfter: "leadRunnerForceExecution" }
    });
  }
  function createHandoff(input = {}) {
    const runnerReassessment = reassessRunners(input);
    const ballContext = buildDefensiveBallContext(input.physicalTruth, input.defenderContext);
    const timingWindows = buildTimingWindows({ ballContext, runnerReassessment });
    return deepFreeze({
      version: VERSION,
      identity: String(input.identity || "bunt-ball-in-play"),
      sourceAuthority: "offensiveBuntPAState.pitchHistory",
      runnerReassessment,
      runnerPhysicalStates: [...runnerReassessment.existingRunners, ...(runnerReassessment.batterRunner ? [runnerReassessment.batterRunner] : [])],
      ballContext,
      defensiveAccess: ballContext.defensiveAccess,
      timingWindows,
      firstLegState: { status: "pending", targetBase: "second" },
      continuationState: { status: "pendingReassessment", window: timingWindows.relayToFirstWindow.state },
      supported: ballContext.defensiveAccess.supported === true
    });
  }
  function normalizeHandoff(saved) {
    return saved && typeof saved === "object" ? deepFreeze(clone(saved)) : null;
  }

  return deepFreeze({
    VERSION, ARRIVAL_PROFILES, WINDOW_STATES, deriveArrivalProfile, deriveStartQuality,
    createRunnerPhysicalState, reassessRunners, projectCanonicalRunnerMovement,
    buildDefensiveBallContext, buildTimingWindows, createHandoff, normalizeHandoff
  });
});
