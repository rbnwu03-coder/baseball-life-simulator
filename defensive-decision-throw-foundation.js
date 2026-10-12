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
      const validReceiver = !receiverPosition || Boolean(receiver && (receiver.id !== secure.defenderId || action === "baseTouch"));
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
    if (secure.position === "1B") {
      route("selfCoverFirst", "baseTouch", "first", ctx.batterRunnerId, "batterRunner", "1B", Boolean(ctx.batterRunnerId));
      route("pitcherCoverFirst", "throwFirst", "first", ctx.batterRunnerId, "batterRunner", "P", Boolean(ctx.batterRunnerId));
    }
    const second = target("second");
    const middleReceiver = ["2B", "1B"].includes(secure.position) ? "SS" : "2B";
    route("forceSecond", "throwSecond", "second", second?.runnerId || null, forced("second") ? "force" : "tag", middleReceiver, Boolean(second));
    const third = target("third");
    route("attackLeadRunnerThird", "throwThird", "third", third?.runnerId || null, forced("third") ? "force" : "tag", "3B", Boolean(third));
    if (secure.position === "3B") route("stepThird", "baseTouch", "third", forced("third")?.runnerId || null,
      "force", "3B", Boolean(forced("third")));
    const home = target("home");
    route(forced("home") ? "homeForceOut" : "preventRunHome", "throwHome", "home", home?.runnerId || null,
      forced("home") ? "force" : "tag", "C", hasHomePlay({ forceHome: Boolean(forced("home")), runner: movement("home") }));
    // Reuse the validated 2B ID only for its 4-6-3 topology, not as a synonym for every double play.
    const dpId = secure.position === "1B" ? "initiate363" : secure.position === "2B" ? "initiate463" : secure.position === "3B" ? "initiate543" : "startDoublePlaySecond";
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
    if (selection.route.action === "baseTouch") fail("base touch cannot resolve a throw");
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
  function resolveBaseTouch({ input, opportunity, selection } = {}) {
    validateSelection(selection, opportunity, input);
    const target = selection.position === "1B" ? "first" : "third";
    if (!["3B", "1B"].includes(selection.position) || selection.route.action !== "baseTouch" || selection.route.targetBase !== target
      || selection.route.receiverId !== selection.defenderId) fail("invalid base-touch action");
    const movement = Force.getForcedMovement(opportunity.context.forceChain, selection.route.targetRunnerId);
    if (!movement || movement.targetBase !== target) fail("base touch requires a live force");
    const capabilities = input.capabilities;
    if (capabilities?.defenderId !== selection.defenderId) fail("base-touch capability mismatch");
    const reaction = Number(capabilities.reaction), mobility = Number(capabilities.mobility);
    if (!Number.isFinite(reaction) || !Number.isFinite(mobility)) fail("missing base-touch arrival abilities");
    const baseProximity = input.physicalTruth.depth === "deep" ? 2
      : selection.position === "1B" && input.physicalTruth.pace === "weak" ? 2.5 : 0.5;
    const controlDelay = input.secureResult.secureQuality === "bobbleButControlled" ? 1 : 0;
    const relativeCompletion = 4 + baseProximity + controlDelay + Math.max(0, 5 - reaction) * 0.15 + Math.max(0, 5 - mobility) * 0.1;
    return freeze({ version: VERSION, identity: `${selection.identity}|base-touch-v1`, decisionIdentity: selection.identity,
      actorId: selection.defenderId, actorPosition: selection.position, targetBase: target, targetRunnerId: selection.route.targetRunnerId,
      possession: controlled(input.secureResult), attemptAvailable: controlled(input.secureResult), relativeCompletion,
      demand: { baseProximity, controlDelay, reaction, mobility, units: "coarseRelativeArrival" },
      authority: "securedPossession+coarseBaseProximity+footwork", variationEvidence: { consumed: false } });
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
  // Consume a real upstream throw before retirement. No random source or Match State.
  function resolveIncomingReceive({ playIdentity, physicalIdentity, throwResolution: thrown, receiver,
    capabilities, sample, returnReady = true, receiveDelay = 0 } = {}) {
    if (!playIdentity || !physicalIdentity || !thrown?.identity || !thrown.throwerId || !thrown.targetRunnerId
      || !receiver?.id || thrown.receiverId !== receiver.id || thrown.receiverPosition !== receiver.position
      || thrown.throwerId === receiver.id || !["onTarget", "challengingReceive", "lateWeakThrow", "offline", "notAttempted"].includes(thrown.throwQuality)
      || !["first", "second", "third", "home"].includes(thrown.targetBase)
      || !Number.isFinite(sample) || sample < 0 || sample >= 1 || !Number.isFinite(receiveDelay) || receiveDelay < 0) fail("invalid incoming throw continuation");
    const swing = (sample - .5) * 4;
    const fielding = Number(capabilities?.fielding), catching = Number(capabilities?.catching ?? fielding);
    const reaction = Number(capabilities?.reaction), range = Number(capabilities?.range);
    if (![fielding, catching, reaction, range].every(Number.isFinite)) fail("missing receiver capability snapshot");
    const delivery = thrown.throwAttempted === true && !["offline", "notAttempted"].includes(thrown.throwQuality);
    const readinessMargin = reaction * .6 + range * .4 + swing - 3.2;
    const ready = delivery && returnReady && readinessMargin >= 0;
    const secureDemand = 3.2 + (thrown.throwQuality === "challengingReceive" ? 1 : 0);
    const secureMargin = fielding * .75 + catching * .25 + swing - secureDemand;
    const secured = ready && secureMargin >= 0;
    const status = !thrown.throwAttempted ? "notAttempted" : thrown.throwQuality === "offline" ? "outsideReceiverReach"
      : !ready ? "unavailable" : !secured ? "failed" : "completed";
    return freeze({ version: "infield-incoming-receive-v1", identity: `${thrown.identity}|receive|${receiver.id}`,
      playIdentity, physicalIdentity, throwIdentity: thrown.identity, throwerId: thrown.throwerId,
      receiverId: receiver.id, receiverPosition: receiver.position, targetBase: thrown.targetBase,
      targetRunnerId: thrown.targetRunnerId, throwQuality: thrown.throwQuality, delivery, ready, secured, status,
      readinessMargin, secureMargin, secureDemand, receiveDelay,
      errorCharged: status === "failed" && thrown.throwQuality === "onTarget",
      provenance: { authority: "resolvedThrow+originalExecutionSample+receiverCapabilitySnapshot", sample,
        consumedRng: false, capabilities: clone(capabilities), returnReady } });
  }
  // Facts only: this contract neither resolves an action nor applies a retirement.
  // Dependencies describe the actual ball path, so a base touch cannot invent an assist.
  const ACTION_TYPES = Object.freeze(["field", "throw", "receive", "baseTouch", "tag", "pivot"]);
  function createActionFacts({ playIdentity, physicalIdentity = null, sourceAuthority = "declaredActionFacts", actions = [] } = {}) {
    if (!playIdentity || !Array.isArray(actions)) fail("invalid action context");
    const seen = new Set();
    const normalized = actions.map((action, index) => {
      if (!action.actorId || !action.actorPosition || !ACTION_TYPES.includes(action.type)
        || !["completed", "failed", "late", "notAttempted", "unavailable"].includes(action.status)) fail("invalid action facts");
      const identity = `${playIdentity}|action|${index + 1}`;
      const dependsOn = (action.dependsOn || []).slice();
      if (dependsOn.some(id => !seen.has(id))) fail("invalid action dependency");
      seen.add(identity);
      return { ...clone(action), identity, playIdentity, physicalIdentity, sequence: index + 1,
        receiverId: action.receiverId || null, targetBase: action.targetBase || null,
        runnerId: action.runnerId || null, dependsOn, responsibleActor: action.responsibleActor || action.actorId,
        provenance: clone(action.provenance || { authority: sourceAuthority }), factType: "execution" };
    });
    return freeze({ version: VERSION, identity: `${playIdentity}|actions-v1`, playIdentity, physicalIdentity,
      sourceAuthority, factType: "execution", actions: normalized });
  }
  // Official scoring interprets already-owned execution facts. It never changes
  // an action, samples a result, or proposes a retirement.
  function resolveScorerEligibility({ actionFacts: facts, retirements = [], contests = [] } = {}) {
    if (!facts || !same(facts, createActionFacts(facts)) || !Array.isArray(contests)) fail("invalid scorer action context");
    const byId = new Map(facts.actions.map(a => [a.identity, a])), seen = new Set();
    function dependsOn(action, ancestorId) {
      return action.dependsOn.some(id => id === ancestorId || dependsOn(byId.get(id), ancestorId));
    }
    const decisions = contests.map(contest => {
      const action = byId.get(contest.failedActionId);
      if (!action || action.status !== "failed" || !["field", "throw", "receive"].includes(action.type)
        || seen.has(action.identity) || !contest.runnerId || !["first", "second", "third", "home"].includes(contest.targetBase)
        || action.targetBase && action.targetBase !== contest.targetBase
        || action.runnerId && action.runnerId !== contest.runnerId
        || !facts.actions.some(a => ["baseTouch", "tag"].includes(a.type) && a.runnerId === contest.runnerId
          && a.targetBase === contest.targetBase && (action.type === "field" || dependsOn(a, action.identity)))) fail("invalid scorer contest identity");
      seen.add(action.identity);
      const effort = contest.ordinaryEffort, potential = contest.potentialOut;
      if (!["eligible", "ineligible", "insufficient"].includes(effort?.status) || !effort.source
        || !["feasible", "alreadySafe", "insufficient"].includes(potential?.status) || !potential.source) fail("missing scorer provenance");
      if (Number.isFinite(potential.cleanCompletion) && Number.isFinite(potential.runnerArrival)
        && potential.status !== (potential.cleanCompletion < potential.runnerArrival ? "feasible" : "alreadySafe")) fail("inconsistent scorer arrival proof");
      const advancement = contest.attributableAdvancement || [];
      const order = { batter: 0, first: 1, second: 2, third: 3, home: 4 };
      if (!Array.isArray(advancement) || advancement.some(a => !a.runnerId || !a.source || a.sourceActionId !== action.identity
        || !Number.isFinite(order[a.expectedBase]) || !Number.isFinite(order[a.actualBase]) || order[a.actualBase] <= order[a.expectedBase])) fail("invalid attributable advancement");
      const actualOut = retirements.some(r => r.runnerId === contest.runnerId && r.targetBase === contest.targetBase);
      const dpCompletionThrow = action.type === "throw" && contest.dpLeg === 2
        && retirements.some(r => r.runnerId === contest.firstRetirementId && r.outType === "force");
      const charged = effort.status === "eligible" && (advancement.length > 0
        || !actualOut && potential.status === "feasible" && !dpCompletionThrow);
      const reason = charged ? advancement.length ? "attributableExtraAdvancement" : "ordinaryEffortPutoutPrevented"
        : effort.status === "insufficient" || potential.status === "insufficient" ? "insufficientScorerFacts"
          : actualOut ? "runnerRetiredDespiteMisplay" : dpCompletionThrow ? "doublePlayCompletionWildThrowException"
            : effort.status !== "eligible" ? "notOrdinaryEffort" : "cleanExecutionAlreadySafe";
      return { failedActionId: action.identity, actorId: action.actorId, runnerId: contest.runnerId,
        targetBase: contest.targetBase, charged, reason, potentialOut: potential.status,
        extraAdvancement: advancement.length > 0, batterReachedOnError: charged && !actualOut
          && potential.status === "feasible" && contest.targetBase === "first" };
    });
    const wouldBeAssists = [];
    decisions.filter(d => d.charged && d.potentialOut === "feasible" && byId.get(d.failedActionId).type === "receive").forEach(d => {
      const chain = new Map();
      function visit(action) { if (!action || chain.has(action.identity)) return; chain.set(action.identity, action); action.dependsOn.forEach(id => visit(byId.get(id))); }
      byId.get(d.failedActionId).dependsOn.forEach(id => visit(byId.get(id)));
      if ([...chain.values()].some(a => a.status !== "completed")) fail("would-be assist uses incomplete upstream action");
      [...chain.values()].filter(a => a.type === "throw" && a.actorId !== d.actorId).forEach(a => {
        if (!wouldBeAssists.some(prior => prior.actorId === a.actorId)) wouldBeAssists.push({ actorId: a.actorId,
          actionId: a.identity, subsequentErrorActionId: d.failedActionId, runnerId: d.runnerId, targetBase: d.targetBase });
      });
    });
    return freeze({ version: "infield-scorer-eligibility-v1", identity: `${facts.playIdentity}|scorer-v1`,
      playIdentity: facts.playIdentity, physicalIdentity: facts.physicalIdentity, factType: "scorerInterpretation",
      contests: clone(contests), decisions, wouldBeAssists, batterReachedOnError: decisions.some(d => d.batterReachedOnError),
      authority: "sameBallExecution+ordinaryEffort+potentialOut+attributableAdvancement", consumedRng: false });
  }
  function projectDefensiveAttribution(facts, retirements = [], scorerFacts = null) {
    if (!facts || !same(facts, createActionFacts(facts))) fail("invalid action contract");
    if (scorerFacts && !same(scorerFacts, resolveScorerEligibility({ actionFacts: facts, retirements, contests: scorerFacts.contests }))) fail("invalid scorer interpretation");
    const actors = new Map(), byId = new Map(facts.actions.map(a => [a.identity, a]));
    function actor(action) {
      if (!actors.has(action.actorId)) actors.set(action.actorId, { actorId: action.actorId, actorPosition: action.actorPosition,
        PO: 0, A: 0, E: 0, DP: 0, actionIds: [], retirementSequences: [] });
      const result = actors.get(action.actorId);
      if (!result.actionIds.includes(action.identity)) result.actionIds.push(action.identity);
      return result;
    }
    facts.actions.forEach(a => { actor(a); if (!scorerFacts && a.errorCharged === true && a.status === "failed") actor(a).E = 1; });
    if (scorerFacts) scorerFacts.decisions.filter(d => d.charged).forEach(d => { actors.get(d.actorId).E = 1; });
    const ledger = retirements.map(retirement => {
      const terminal = facts.actions.find(a => ["baseTouch", "tag"].includes(a.type) && a.status === "completed"
        && a.runnerId === retirement.runnerId && a.targetBase === retirement.targetBase);
      if (!terminal) fail("retirement lacks completed actor action");
      const chain = new Map();
      function visit(action) { if (chain.has(action.identity)) return; chain.set(action.identity, action);
        action.dependsOn.forEach(id => visit(byId.get(id))); }
      visit(terminal);
      if ([...chain.values()].some(a => a.status !== "completed")) fail("retirement uses incomplete action");
      const assists = [...new Set([...chain.values()].filter(a => a.type === "throw" && a.actorId !== terminal.actorId).map(a => a.actorId))];
      actor(terminal).PO += 1;
      assists.forEach(id => { actors.get(id).A = 1; });
      const participants = [...new Set([terminal.actorId, ...assists])];
      participants.forEach(id => actors.get(id).retirementSequences.push(retirement.sequence));
      return { ...clone(retirement), putoutActorId: terminal.actorId, assistActorIds: assists,
        participantActorIds: participants, terminalActionId: terminal.identity };
    });
    if (ledger.length >= 2) ledger.forEach(r => r.participantActorIds.forEach(id => { actors.get(id).DP = 1; }));
    if (scorerFacts) scorerFacts.wouldBeAssists.forEach(a => { actors.get(a.actorId).A = 1; });
    return freeze({ version: VERSION, identity: `${facts.playIdentity}|attribution-v1`, playIdentity: facts.playIdentity,
      physicalIdentity: facts.physicalIdentity, factType: "settlement", retirements: ledger, actors: [...actors.values()],
      authority: scorerFacts ? "completedActionDependencies+orderedActualRetirements+legalScorerExceptions" : "completedActionDependencies+orderedActualRetirements" });
  }
  return freeze({ VERSION, RNG_NAMESPACES, isAdvancingTo, hasHomePlay, controlled, buildDecisionOpportunity,
    selectDefensiveRoute, validateOpportunity, validateSelection, resolveThrow, resolveBaseTouch, projectExistingThrow, throwDemand, validateStoredStage,
    resolveIncomingReceive, ACTION_TYPES, createActionFacts, resolveScorerEligibility, projectDefensiveAttribution });
});
