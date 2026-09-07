(function (root, factory) {
  const dep = (name, path) => root[name] || (typeof module === "object" && module.exports ? require(path) : null);
  const api = factory(dep("BattedBallPhysical", "./batted-ball-physical.js"), dep("TeamRosterFoundation", "./team-roster-foundation.js"),
    dep("ForceAdvancement", "./force-advancement.js"), dep("DefensiveReachSecureFoundation", "./defensive-reach-secure-foundation.js"));
  root.DefensiveDecisionThrowFoundation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Physical, Roster, Force, ReachSecure) {
  "use strict";
  const VERSION = "defensive-decision-throw-v1";
  const RNG_NAMESPACES = { strength: "defensive-throw-strength-v1", accuracy: "defensive-throw-accuracy-v1" };
  const clone = value => JSON.parse(JSON.stringify(value));
  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze); return Object.freeze(value);
  }
  function fail(reason) { throw new Error(`Defensive decision / throw integrity failed: ${reason}`); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function isAdvancingTo(runner, target) {
    return Boolean(runner && runner.targetBase === target && ["advancing", "committed", "commitAdvance", "attemptAdvance", "tagUp"]
      .includes(runner.movementState || runner.movementDecision || runner.movementProgress));
  }
  function hasHomePlay({ forceHome = false, runner = null } = {}) {
    return forceHome === true || isAdvancingTo(runner, "home");
  }
  function controlled(secure) {
    return secure?.attemptAvailable === true && secure.secured === true && secure.ballState === "secured"
      && ["cleanControl", "bobbleButControlled", "caughtBeforeGround"].includes(secure.secureQuality);
  }
  function context(input) {
    Roster.assertActiveDefense(input.activeRoster);
    ReachSecure.validateReach(input);
    const secure = input.secureResult, reach = input.reachResult;
    if (!secure || secure.version !== ReachSecure.VERSION || secure.identity !== `${reach.identity}|secure-v1`
      || secure.reachIdentity !== reach.identity || secure.defenderId !== reach.defenderId || secure.position !== reach.position
      || secure.physicalIdentity !== reach.physicalIdentity || secure.opportunityIdentity !== reach.opportunityIdentity
      || secure.attemptAvailable !== reach.reached) fail("incompatible Secure");
    const runners = input.runners;
    if (!Array.isArray(runners) || runners.length !== 3 || new Set(runners.filter(Boolean)).size !== runners.filter(Boolean).length
      || runners.some(id => id !== null && (typeof id !== "string" || !id))
      || !Number.isInteger(input.outs) || input.outs < 0 || input.outs > 3) fail("invalid base / outs context");
    const runnerStates = (input.runnerStates || []).map(state => {
      if (!state?.runnerId || !runners.includes(state.runnerId) || runners[Number(state.originBase) - 1] !== state.runnerId) fail("stale runner state");
      return { runnerId: state.runnerId, originBase: state.originBase, targetBase: state.targetBase || null,
        movementState: state.movementState || state.movementDecision || state.movementProgress || "holding" };
    });
    if (new Set(runnerStates.map(r => r.runnerId)).size !== runnerStates.length) fail("duplicate runner state");
    const airborne = input.physicalTruth.ballType !== "groundBall";
    if (controlled(secure) && (airborne ? secure.secureQuality !== "caughtBeforeGround"
      : !["cleanControl", "bobbleButControlled"].includes(secure.secureQuality))) fail("Secure trajectory mismatch");
    const batterRunnerId = airborne ? null : input.batterRunnerId || null;
    if (batterRunnerId && (typeof batterRunnerId !== "string" || runners.includes(batterRunnerId))) fail("invalid batter runner");
    const expectedForce = !airborne && batterRunnerId ? Force.buildInitialLiveBallForceChain({ runners, batterRunnerId }) : null;
    // This stage admits the first throw only. Do not reinterpret a partially settled force chain.
    if (input.forceChain && (!expectedForce || !same(input.forceChain, expectedForce))) fail("stale or post-settlement force chain");
    return { outs: input.outs, runners: runners.slice(), runnerStates, batterRunnerId, airborne,
      forceChain: expectedForce, inning: input.inning ?? null, half: input.half ?? null,
      routeWindows: input.routeWindows ? clone(input.routeWindows) : {},
      scores: input.scores ? clone(input.scores) : null, secure: clone(secure),
      assignments: Roster.POSITION_ORDER.map(position => ({ position, defenderId: Roster.getCurrentDefender(input.activeRoster, position).id })) };
  }
  function buildDecisionOpportunity(input = {}) {
    const ctx = context(input), secure = input.secureResult;
    const identity = `${secure.identity}|decision-opportunity|${Physical.stableHash(JSON.stringify(ctx))}`;
    const base = { version: VERSION, identity, physicalIdentity: secure.physicalIdentity, opportunityIdentity: secure.opportunityIdentity,
      secureIdentity: secure.identity, defenderId: secure.defenderId, position: secure.position,
      context: ctx, authority: "securedPossession+canonicalRunnerForceContext+activeAssignment" };
    if (!controlled(secure) || ctx.outs >= 3) return freeze({ ...base, status: "noControlledDecision", availableRoutes: [], routeAssessments: [] });
    const assessments = [];
    function route(routeId, action, targetBase, targetRunnerId, forceType, receiverPosition, contextualAvailability, continuation = null) {
      const receiver = receiverPosition ? Roster.getCurrentDefender(input.activeRoster, receiverPosition) : null;
      // A self-cover is not a throw to oneself; that execution vocabulary remains downstream.
      const validReceiver = !receiverPosition || Boolean(receiver && receiver.id !== secure.defenderId);
      const window = ctx.routeWindows[routeId] || "unmeasured";
      if (!["wide", "normal", "narrow", "expired", "unmeasured"].includes(window)) fail("invalid route window");
      assessments.push({ routeId, action, targetBase, targetRunnerId, forceType,
        receiverPosition, receiverId: receiver?.id || null, legality: "legal",
        contextualAvailability: Boolean(contextualAvailability && validReceiver),
        viability: window === "expired" ? "poor" : window === "unmeasured" ? "unmeasured" : "viable",
        window, reason: !contextualAvailability ? "noTargetRunnerContext" : !validReceiver ? "receiverUnavailableOrSelf"
          : window === "expired" ? "existingWindowExpired" : "contextSupportsRoute", continuation });
    }
    route("holdBall", "holdBall", null, null, "none", null, true);
    const movement = base => ctx.runnerStates.find(r => isAdvancingTo(r, base));
    const forced = base => (ctx.forceChain?.allRequiredMovements || []).find(r => r.targetBase === base);
    const target = base => forced(base) || movement(base);
    route("secureFirstBaseOut", "throwFirst", "first", ctx.batterRunnerId, "batterRunner", "1B", Boolean(ctx.batterRunnerId));
    const second = target("second");
    const middleReceiver = ["2B", "1B"].includes(secure.position) ? "SS" : "2B";
    route("forceSecond", "throwSecond", "second", second?.runnerId || null, forced("second") ? "force" : "tag", middleReceiver, Boolean(second));
    const third = target("third");
    route("attackLeadRunnerThird", "throwThird", "third", third?.runnerId || null, forced("third") ? "force" : "tag", "3B", Boolean(third));
    const home = target("home");
    route(forced("home") ? "homeForceOut" : "preventRunHome", "throwHome", "home", home?.runnerId || null,
      forced("home") ? "force" : "tag", "C", hasHomePlay({ forceHome: Boolean(forced("home")), runner: movement("home") }));
    // Reuse the validated 2B ID only for its 4-6-3 topology, not as a synonym for every double play.
    const dpId = secure.position === "2B" ? "initiate463" : "startDoublePlaySecond";
    route(dpId, "initiateDoublePlay", "second", forced("second")?.runnerId || null, "force", middleReceiver,
      Boolean(forced("second") && ctx.outs < 2), { targetBase: "first", status: "pendingExistingOrFutureSecondLeg" });
    return freeze({ ...base, status: "controlledDecision", routeAssessments: assessments,
      availableRoutes: assessments.filter(r => r.contextualAvailability) });
  }
  function validateOpportunity(opportunity, input) {
    const fresh = buildDecisionOpportunity(input);
    if (!same(opportunity, fresh)) fail("stale opportunity / runner / receiver context");
    return fresh;
  }
  function selectDefensiveRoute(opportunity, routeId, input) {
    validateOpportunity(opportunity, input);
    const route = opportunity.availableRoutes.find(r => r.routeId === routeId && r.legality === "legal" && r.contextualAvailability);
    if (!route) fail("illegal or contextless selected route");
    return freeze({ version: VERSION, identity: `${opportunity.identity}|select|${routeId}`, decisionOpportunityIdentity: opportunity.identity,
      secureIdentity: opportunity.secureIdentity, defenderId: opportunity.defenderId, position: opportunity.position,
      route: clone(route), authority: "explicitRouteSelection" });
  }
  function validateSelection(selection, opportunity, input) {
    const fresh = selectDefensiveRoute(opportunity, selection?.route?.routeId, input);
    if (!same(selection, fresh)) fail("stale selected decision");
  }
  function throwDemand(selection, secure) {
    const position = selection.position, target = selection.route.targetBase;
    const distanceClass = ["LF", "CF", "RF"].includes(position) || (position === "3B" && target === "first") ? "long"
      : (["1B", "2B", "SS"].includes(position) && target === "second") || (position === "3B" && target === "home") ? "short" : "medium";
    const arrivalPressure = secure.inputs?.arrivalQuality === "stretchedArrival" ? 1 : 0;
    const controlPressure = secure.secureQuality === "bobbleButControlled" ? 1 : 0;
    return { distanceClass, strength: { short: 3, medium: 5, long: 7 }[distanceClass] + arrivalPressure,
      accuracy: { short: 3, medium: 4, long: 5 }[distanceClass] + arrivalPressure + controlPressure,
      arrivalPressure, controlPressure, units: "coarseRelativeDemand" };
  }
  function throwBase(selection) {
    return { version: VERSION, identity: `${selection.identity}|throw-v1`, decisionIdentity: selection.identity,
      routeId: selection.route.routeId, throwerId: selection.defenderId, throwerPosition: selection.position,
      targetBase: selection.route.targetBase, targetRunnerId: selection.route.targetRunnerId,
      receiverId: selection.route.receiverId, receiverPosition: selection.route.receiverPosition,
      throwDemand: null, strengthMargin: null, accuracyMargin: null };
  }
  function resolveThrow({ input, opportunity, selection, capabilities, rolls, transferState } = {}) {
    validateSelection(selection, opportunity, input);
    const base = throwBase(selection);
    if (selection.route.action === "holdBall") return freeze({ ...base, throwAttempted: false, throwQuality: "notAttempted",
      releaseQuality: "held", ballArrivalState: "controlledByThrower", variationEvidence: { consumed: false }, authority: "deliberateHold" });
    if (!["ready", "completed", "delayed", "failed"].includes(transferState)) fail("unknown transfer readiness");
    if (transferState === "failed") return freeze({ ...base, throwAttempted: false, throwQuality: "notAttempted",
      releaseQuality: "transferUnavailable", ballArrivalState: "releaseUnavailable", variationEvidence: { consumed: false }, authority: "upstreamTransfer" });
    if (capabilities?.defenderId !== selection.defenderId || !Number.isFinite(capabilities.arm) || !Number.isFinite(capabilities.throwing)) fail("throw capability adapter mismatch");
    const demand = throwDemand(selection, input.secureResult);
    const sample = stage => { const explicit = rolls?.[stage]; const namespace = RNG_NAMESPACES[stage];
      const roll = Number.isFinite(explicit) ? Math.max(0, Math.min(1, explicit)) : Physical.deterministicUnit(namespace, base.identity, stage);
      return { namespace, roll, adjustment: (0.5 - roll) * 2 }; };
    const strengthVariation = sample("strength"), accuracyVariation = sample("accuracy");
    const arm = Math.max(0, Math.min(20, capabilities.arm)), throwing = Math.max(0, Math.min(20, capabilities.throwing));
    const strengthMargin = arm - demand.strength + strengthVariation.adjustment;
    const accuracyMargin = throwing - demand.accuracy + accuracyVariation.adjustment;
    const quality = accuracyMargin < -1 ? "offline" : strengthMargin < 0 ? "lateWeakThrow" : accuracyMargin < 1 ? "challengingReceive" : "onTarget";
    return freeze({ ...base, throwAttempted: true, throwDemand: demand, strengthMargin, accuracyMargin,
      throwQuality: quality, releaseQuality: transferState === "delayed" ? "delayedRelease" : "readyRelease",
      ballArrivalState: { offline: "outsideReceiverReach", lateWeakThrow: "insufficientDelivery", challengingReceive: "receiverChallenged", onTarget: "atReceiverTarget" }[quality],
      inputs: { arm, throwing, transferState, secureQuality: input.secureResult.secureQuality },
      variationEvidence: { consumed: true, strength: strengthVariation, accuracy: accuracyVariation }, authority: "throwCapabilities+coarseDemand+separateVariation" });
  }
  function projectExistingThrow({ input, opportunity, selection, playerLeg, evidence } = {}) {
    validateSelection(selection, opportunity, input);
    if (selection.position !== "2B" || selection.route.action === "holdBall") fail("unsupported legacy first-throw projection");
    if (!playerLeg || !["completed", "failed", "delayed"].includes(playerLeg.transfer)
      || !["completed", "notCompleted"].includes(playerLeg.firstThrow)) fail("missing existing first-throw facts");
    const fallback = playerLeg.reassessment === "completed" && ["completed", "late"].includes(playerLeg.fallbackRelease);
    const release = fallback ? playerLeg.fallbackRelease : playerLeg.transfer;
    const delivery = fallback ? playerLeg.fallbackRelease : playerLeg.firstThrow;
    const attempted = fallback || playerLeg.transfer === "completed";
    return freeze({ ...throwBase(selection), throwAttempted: attempted, throwDemand: throwDemand(selection, input.secureResult),
      strengthMargin: null, accuracyMargin: null, // Legacy composite cannot honestly separate these.
      throwQuality: !attempted ? "notAttempted" : delivery === "completed" ? "legacyUsableDelivery" : "legacyDeliveryIncomplete",
      releaseQuality: release, ballArrivalState: !attempted ? "releaseUnavailable" : delivery === "completed" ? "receiverAttemptAvailable" : "deliveryUnresolved",
      inputs: { transfer: playerLeg.transfer, firstThrow: playerLeg.firstThrow,
        sourceLeg: fallback ? "fallbackRelease" : "firstThrow", fallbackRelease: fallback ? playerLeg.fallbackRelease : null, evidence: clone(evidence || {}) },
      variationEvidence: { consumed: false, sourceAuthority: "existingSecondBaseExecution", sourceRoll: evidence?.sample ?? null },
      authority: "existingFirstThrowPhysicalFactProjection" });
  }
  function validateStoredStage(stage, input) {
    validateOpportunity(stage.opportunity, input);
    if (stage.opportunity.status === "noControlledDecision") {
      if (stage.selection || stage.activeSelection || stage.throwResolution) fail("invented controlled decision");
      return true;
    }
    validateSelection(stage.selection, stage.opportunity, input);
    validateSelection(stage.activeSelection || stage.selection, stage.opportunity, input);
    const expected = throwBase(stage.activeSelection || stage.selection), result = stage.throwResolution;
    const identityKeys = ["version", "identity", "decisionIdentity", "routeId", "throwerId", "throwerPosition", "targetBase", "targetRunnerId", "receiverId", "receiverPosition"];
    if (!result || identityKeys.some(key => !same(result[key], expected[key]))) fail("stale throw actor / target identity");
    return true;
  }
  return freeze({ VERSION, RNG_NAMESPACES, isAdvancingTo, hasHomePlay, controlled, buildDecisionOpportunity,
    selectDefensiveRoute, validateOpportunity, validateSelection, resolveThrow, projectExistingThrow, throwDemand, validateStoredStage });
});
