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
  const HOME_WINDOW_STATES = Object.freeze(["expired", "narrow", "normal", "wide"]);
  const RNG_NAMESPACES = Object.freeze({ runner3BDecision: "ground-ball-runner3b-decision-v1" });

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
  function buildRunner3BAdvanceOpportunity(input = {}) {
    const truth = input.physicalTruth || {};
    const runner = input.runner || {};
    const access = input.defensiveAccess || {};
    const supportedContext = truth.ballType === "groundBall"
      && truth.direction === "rightSide"
      && input.playerPosition === "二壘手"
      && Number(runner.originBase) === 3
      && input.isForced !== true
      && Number(input.outs) < 2;
    const paceScore = { weak: 2, moderate: 1, firm: 0, hard: -1 }[truth.pace] ?? 0;
    const accessScore = { poor: 1, possible: 0.5, favored: 0, unsupported: -2 }[access.level] ?? -2;
    const opportunityScore = paceScore + accessScore;
    const opportunityLevel = opportunityScore >= 2 ? "high" : opportunityScore >= 0 ? "medium" : "low";
    return deepFreeze({
      version: "ground-ball-runner3b-advance-opportunity-v1",
      authority: "battedBallPhysicalTruth+baseState+outs",
      runnerId: String(runner.runnerId || ""),
      originBase: 3,
      targetBase: "home",
      movementType: "voluntary",
      available: supportedContext,
      opportunityLevel: supportedContext ? opportunityLevel : "none",
      opportunityScore: supportedContext ? opportunityScore : null,
      ballContext: {
        physicalIdentity: String(truth.identity || ""),
        ballType: truth.ballType || "",
        pace: truth.pace || "",
        direction: truth.direction || "",
        defensiveAccessLevel: access.level || ""
      },
      outs: Number(input.outs) || 0,
      scoreContext: input.scoreContext && typeof input.scoreContext === "object" ? clone(input.scoreContext) : null,
      reason: supportedContext ? `${truth.pace || "moderate"}GroundBallAgainst${access.level || "unknown"}Access`
        : Number(input.outs) >= 2 ? "twoOutRunnerDecisionDeferred"
          : input.isForced ? "forcedAdvanceOwnedByForceChain" : "unsupportedGroundBallRunner3BContext",
      reasons: [supportedContext ? "ordinaryGroundBallAdvanceWindow" : "advanceOpportunityUnavailable"],
      evidence: {
        physicalIdentity: String(truth.identity || ""),
        ballType: truth.ballType || "",
        pace: truth.pace || "",
        direction: truth.direction || "",
        defensiveAccessLevel: access.level || "",
        outs: Number(input.outs) || 0,
        isForced: input.isForced === true
      }
    });
  }
  function resolveRunner3BAdvanceDecision(opportunity, runner = {}, options = {}) {
    if (!opportunity?.available) return deepFreeze({
      version: "ground-ball-runner3b-advance-decision-v1",
      authority: "runnerAdvanceOpportunity",
      runnerId: String(runner.runnerId || opportunity?.runnerId || ""),
      decision: "holdBase",
      decisionBasis: opportunity?.reason || "noAdvanceOpportunity",
      opportunityLevel: opportunity?.opportunityLevel || "none",
      runnerReadQuality: "notEvaluated",
      rngNamespace: RNG_NAMESPACES.runner3BDecision,
      deterministicRoll: null
    });
    const reaction = clamp(runner.reaction, 0, 20, 5);
    const baseballIQ = clamp(runner.baseballIQ, 0, 20, 5);
    const runnerReadQuality = reaction + baseballIQ >= 16 ? "strong"
      : reaction + baseballIQ <= 7 ? "poor" : "ordinary";
    const identity = [options.identity || "ordinary-ground-ball", opportunity.runnerId,
      opportunity.evidence?.physicalIdentity || "physical-ball"].join("|");
    const rawRoll = Number(options.decisionRoll);
    const roll = Number.isFinite(rawRoll) ? clamp(rawRoll, 0, 0.999999, 0.5)
      : deterministicUnit(RNG_NAMESPACES.runner3BDecision, identity);
    const readModifier = (reaction - 5) * 0.025 + (baseballIQ - 5) * 0.025;
    const baseThreshold = { high: 0.78, medium: 0.48, low: 0.14 }[opportunity.opportunityLevel] || 0;
    const prudenceAdjustment = opportunity.opportunityLevel === "low" ? Math.max(0, baseballIQ - 5) * -0.02 : 0;
    const commitThreshold = clamp(baseThreshold + readModifier + prudenceAdjustment, 0.05, 0.9, 0.05);
    const decision = roll < commitThreshold ? "commitAdvance" : "holdBase";
    return deepFreeze({
      version: "ground-ball-runner3b-advance-decision-v1",
      authority: "runnerAdvanceOpportunity+runnerRead+deterministicVariation",
      runnerId: String(runner.runnerId || opportunity.runnerId || ""),
      decision,
      decisionBasis: decision === "commitAdvance" ? "runnerAcceptedAdvanceOpportunity" : "runnerRejectedAdvanceOpportunity",
      opportunityLevel: opportunity.opportunityLevel,
      runnerReadQuality,
      rngNamespace: RNG_NAMESPACES.runner3BDecision,
      deterministicIdentity: identity,
      deterministicRoll: Math.round(roll * 1000000) / 1000000,
      commitThreshold: Math.round(commitThreshold * 1000000) / 1000000,
      abilityEvidence: { reaction, baseballIQ }
    });
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
      const observed = preContact[runner.runnerId] || {};
      const nextTarget = ["", "second", "third", "home"][originBase] || "";
      const hasObservedDecision = ["commitAdvance", "holdBase"].includes(observed.movementDecision);
      const opportunity = originBase === 3 && !forced ? buildRunner3BAdvanceOpportunity({
        physicalTruth: truth,
        runner,
        defensiveAccess: input.defensiveAccess,
        playerPosition: input.defenderContext?.playerPosition,
        outs: input.outs,
        isForced: false
      }) : null;
      const advanceDecision = opportunity ? resolveRunner3BAdvanceDecision(opportunity, runner, { identity: input.identity }) : null;
      const observedAdvance = observed.movementDecision === "commitAdvance"
        && (!observed.targetBase || observed.targetBase === nextTarget);
      const movementDecision = forced ? "commitAdvance"
        : hasObservedDecision ? (observedAdvance ? "commitAdvance" : "holdBase")
          : advanceDecision?.decision || "holdBase";
      const naturalStartQuality = Number(runner.reaction) >= 8 ? "preparedStart"
        : Number(runner.reaction) <= 3 ? "lateStart" : "normalStart";
      const state = createRunnerState({
        runnerId: runner.runnerId,
        originBase,
        targetBase: forcedMovement?.targetBase || (movementDecision === "commitAdvance" ? nextTarget : ["", "first", "second", "third"][originBase]),
        movementDecision,
        startQuality: observed.startQuality || naturalStartQuality,
        speed: runner.speed
      });
      return deepFreeze({
        ...state,
        movementState: observed.movementState === "committed" && movementDecision === "commitAdvance" ? "committed" : state.movementState,
        advancementProgress: ["early", "midway", "late"].includes(observed.advancementProgress) ? observed.advancementProgress
          : movementDecision === "commitAdvance" && Number(runner.speed) >= 8 ? "midway" : "early",
        isForced: forced,
        forcedMovementTarget: forcedMovement?.targetBase || (forced ? state.targetBase : null),
        forceReason: forcedMovement?.forceReason || "",
        chainDepth: forcedMovement?.chainDepth ?? null,
        advanceOpportunity: opportunity,
        advanceDecision: opportunity ? (hasObservedDecision ? {
          ...clone(advanceDecision),
          authority: "explicitPreContactRunnerState",
          decision: movementDecision,
          decisionBasis: "explicitPreContactRunnerState"
        } : advanceDecision) : null
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
      runnerAdvanceOpportunities: existingRunners.map(state => state.advanceOpportunity).filter(Boolean),
      runnerAdvanceDecisions: existingRunners.map(state => state.advanceDecision).filter(Boolean),
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
    const shared = SharedRunnerPhysical.buildTimingWindows({ ballContext, runnerReassessment: runnerRealization });
    const homeRunner = (runnerRealization?.existingRunners || []).find(state => state.originBase === 3
      && state.targetBase === "home" && ["advancing", "committed"].includes(state.movementState));
    const accessScore = { favored: 3, possible: 2, poor: 1, unsupported: -2 }[ballContext?.defensiveAccess?.level] ?? -2;
    const arrivalAdjustment = { early: -2, normal: -1, late: 0, veryLate: 1 }[homeRunner?.timingProfile] ?? -1;
    const progressPenalty = { early: 0, midway: 1, late: 2 }[homeRunner?.advancementProgress] || 0;
    const score = homeRunner ? accessScore + arrivalAdjustment - progressPenalty : -10;
    const state = score >= 3 ? "wide" : score >= 2 ? "normal" : score >= 1 ? "narrow" : "expired";
    return deepFreeze({
      ...clone(shared),
      homeOutWindow: {
        state,
        targetBase: "home",
        runnerId: homeRunner?.runnerId || "",
        evaluated: Boolean(homeRunner),
        authority: "runnerPhysicalState+ballAcquisitionTiming"
      }
    });
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
    const defensiveAccess = resolveGroundBallDefensiveAccess(input);
    const ballContext = projectGroundBallCompatibilityContext(physicalTruth, defensiveAccess);
    const runnerRealization = buildGroundBallRunnerRealization({ ...input, forceChain, forceState, defensiveAccess, ballContext });
    if (!runnerRealization) return null;
    const timingWindows = buildGroundBallTimingWindows({ ballContext, runnerRealization });
    const homeRunner = runnerRealization.existingRunners.find(state => state.originBase === 3
      && state.targetBase === "home" && ["advancing", "committed"].includes(state.movementState));
    const choices = defensiveAccess.supported ? ["secureFirstBaseOut"] : [];
    if (defensiveAccess.supported && forceState.forceAtSecond && Number(input.outs) < 2) choices.push("initiate463");
    if (defensiveAccess.supported && forceState.forceAtHome && timingWindows.homeOutWindow.state !== "expired") choices.push("homeForceOut");
    else if (defensiveAccess.supported && homeRunner && timingWindows.homeOutWindow.state !== "expired") choices.push("preventRunHome");
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
    const homeChange = changes.find(change => Number(change.from) === 3) || null;
    return deepFreeze({
      version: "bbp-b1-ground-ball-physical-outcome-v1",
      authority: "defensiveExecution+runnerTiming",
      batterRunner: { runnerId: handoff.runnerRealization.batterRunner.runnerId, result: batterChange?.to === "out" ? "out" : "safe", targetBase: "first" },
      leadRunner: leadChange ? { runnerId: leadChange.runnerId, result: leadChange.to === "out" ? "out" : "safe", targetBase: "second" } : null,
      homeRunner: homeChange ? { runnerId: homeChange.runnerId, result: homeChange.to === "out" ? "out" : homeChange.to === "home" ? "scored" : "held", targetBase: "home" } : null,
      homeTagLeg: resolution.homeTagLeg ? clone(resolution.homeTagLeg) : null,
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
    VERSION, RNG_NAMESPACES, ACCESS_LEVELS, HOME_WINDOW_STATES, stableHash, deterministicUnit,
    buildRunner3BAdvanceOpportunity, resolveRunner3BAdvanceDecision,
    deriveForceState, buildGroundBallRunnerRealization,
    resolveGroundBallDefensiveAccess, projectGroundBallCompatibilityContext,
    buildGroundBallTimingWindows, buildGroundBallDefensiveOpportunity,
    settleGroundBallPhysicalOutcome, derivePACompatibilityResult,
    projectCanonicalRunnerMovement, normalizeHandoff
  });
});
