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
  // S2-SCORER-001: interpret a completed clean play; never select or sample an outcome.
  function resolveBatterReachClassification(proof = {}) {
    const reject = (reason, status = "insufficient") => freeze({ version: "batter-reach-classification-v1",
      status, reason, authority: "existingInfieldScorer", consumedRng: false });
    try {
      const { context: ctx, physicalTruth: truth, opportunity, reach, secure, ground, decision, selection,
        thrown, received, timing, firstLeg, actionFacts, scorerFacts } = proof;
      if (ctx?.coveragePolicy !== "s2-safe-first-v1") return reject("UNSUPPORTED_COVERAGE_POLICY", "unsupported");
      const admission = ctx.admission, caps = ctx.capabilities, actors = caps?.actors, pitch = truth?.executionEvidence?.actualPitch;
      if (!admission || admission.authority !== "originalPlayerDetailedPA" || admission.lockedAt !== "beforeFirstPitch"
        || admission.coveragePolicy !== ctx.coveragePolicy || admission.matchId !== ctx.matchId
        || admission.paId !== ctx.paId || admission.batterId !== ctx.batterId
        || !same(admission.capabilities, caps)) return reject("PA_ADMISSION_PROVENANCE");
      if (![ctx.matchId, ctx.paId, ctx.pitchId, ctx.physicalId, ctx.situationId].every(id => typeof id === "string" && id.length)
        || ctx.batterId !== "player" || actors?.batterId !== ctx.batterId || ctx.offenseTeam === ctx.defenseTeam
        || ctx.version !== "match-vnext-execution-v0.1" || truth?.identity !== ctx.physicalId
        || pitch?.pitchId !== ctx.pitchId || pitch.paIdentity !== ctx.paId || pitch.pitcherId !== actors.pitcherId
        || pitch.pitchTacticalState?.context?.gameIdentity !== ctx.matchId) return reject("PLAY_IDENTITY");
      if (truth.ballType !== "groundBall" || ctx.before?.runners?.length !== 3 || ctx.before.runners.some(Boolean)
        || !Number.isInteger(ctx.before.outs) || ctx.before.outs < 0 || ctx.before.outs > 2) return reject("OUTSIDE_EMPTY_GROUND_SCOPE", "unsupported");
      const tactical = pitch.pitchTacticalState.context;
      if (tactical.paIdentity !== ctx.paId || tactical.pitchIdentity !== ctx.pitchId || tactical.outs !== ctx.before.outs
        || !same(tactical.bases, ctx.before.runners) || !same(tactical.score, ctx.before.scores)) return reject("STALE_PITCH_CONTEXT");
      Roster.assertActiveDefense(ctx.activeRoster);
      if (!actors || new Set([actors.batterId, actors.pitcherId, actors.shortstopId, actors.receiverId]).size !== 4
        || [actors.pitcherId, actors.shortstopId, actors.receiverId].some(id => !id || /^(player|opponent-pitcher|batter-runner)$/.test(id))) return reject("NPC_ACTOR_BINDING");
      if (!same(caps.assignment, Roster.POSITION_ORDER.map(position => ({ position, id: Roster.getCurrentDefender(ctx.activeRoster, position).id })))) return reject("STALE_ACTIVE_ASSIGNMENT");
      for (const [position, key, actorKey] of [["P", "pitcher", "pitcherId"], ["SS", "shortstop", "shortstopId"], ["1B", "receiver", "receiverId"]]) {
        const actor = Roster.getCurrentDefender(ctx.activeRoster, position), snapshot = caps[key];
        if (actor.id !== actors[actorKey] || snapshot?.actorId !== actor.id || snapshot.fallback !== false
          || !["simulation-roster", "team-roster-foundation"].includes(actor.source)
          || snapshot.source !== (key === "pitcher" ? "activeRoster.pitchingProfile.control" : "activeRoster.defense/arm/speed")) return reject("CAPABILITY_ACTOR_SOURCE");
        if (key === "pitcher") {
          if (snapshot.raw !== actor.pitchingProfile?.control || snapshot.consumed !== pitch.controlRealization?.control
            || !Number.isFinite(snapshot.consumed)) return reject("STALE_PITCHER_CAPABILITY");
        } else {
          if (!same(snapshot.raw, { defense: actor.defense, arm: actor.arm, speed: actor.speed })
            || snapshot.consumed?.defenderId !== actor.id) return reject("STALE_NPC_CAPABILITY");
          for (const [skill, source] of [["fielding", "defense"], ["reaction", "defense"], ["range", "defense"], ["catching", "defense"], ["arm", "arm"], ["throwing", "arm"], ["mobility", "speed"]])
            if (!Number.isFinite(snapshot.consumed[skill]) || snapshot.consumed[skill] !== snapshot.raw[source]) return reject("CAPABILITY_ALIAS_PROVENANCE");
        }
      }
      if (caps.batter?.actorId !== ctx.batterId || caps.batter.fallback !== false || caps.batter.source !== "livePlayer+existingOffensiveAdapter"
        || !Number.isFinite(caps.batter.raw?.baseRunning) || !Number.isFinite(caps.batter.consumed?.speed)) return reject("BATTER_CAPABILITY_PROVENANCE");
      const input = { physicalTruth: truth, opportunity, activeRoster: ctx.activeRoster, capabilities: caps.shortstop.consumed,
        reachResult: reach, secureResult: secure, runners: ctx.before.runners, outs: ctx.before.outs,
        inning: ctx.inning, half: ctx.half, scores: ctx.before.scores, batterRunnerId: ctx.batterId,
        forceChain: ground?.forceChain, runnerStates: [], runnerPhysicalStates: ground?.runnerPhysicalStates };
      ReachSecure.validateReach(input);
      if (opportunity.primaryPosition !== "SS" || opportunity.primaryDefenderId !== actors.shortstopId
        || reach.position !== "SS" || !reach.reached || reach.reachQuality !== "cleanArrival"
        || !secure?.secured || secure.secureQuality !== "cleanControl" || secure.ballState !== "secured") return reject("UNRESOLVED_OR_NONCLEAN_FIELD", "unsupported");
      if (!same(reach.inputs, { reaction: caps.shortstop.consumed.reaction, range: caps.shortstop.consumed.range, mobility: caps.shortstop.consumed.mobility })
        || secure.inputs?.fielding !== caps.shortstop.consumed.fielding || secure.inputs?.catching !== caps.shortstop.consumed.catching) return reject("FIELD_CAPABILITY_PROVENANCE");
      validateSelection(selection, decision, input);
      if (selection.route.routeId !== "secureFirstBaseOut" || selection.route.receiverId !== actors.receiverId
        || selection.route.targetRunnerId !== ctx.batterId || selection.route.targetBase !== "first") return reject("UNSUPPORTED_DEFENSIVE_CHOICE", "unsupported");
      if (thrown?.identity !== `${selection.identity}|throw-v1` || thrown.throwerId !== actors.shortstopId
        || thrown.receiverId !== actors.receiverId || thrown.targetRunnerId !== ctx.batterId || thrown.targetBase !== "first"
        || !thrown.throwAttempted || thrown.throwQuality !== "onTarget" || thrown.releaseQuality !== "readyRelease"
        || !(thrown.strengthMargin >= 0) || !(thrown.accuracyMargin >= 1)
        || thrown.inputs?.arm !== caps.shortstop.consumed.arm || thrown.inputs?.throwing !== caps.shortstop.consumed.throwing
        || thrown.inputs.transferState !== "ready" || !thrown.variationEvidence?.consumed) return reject("NONCLEAN_THROW", "unsupported");
      if (!received?.ready || !received.secured || received.status !== "completed" || received.throwQuality !== "onTarget"
        || received.physicalIdentity !== truth.identity || received.playIdentity !== truth.identity || received.errorCharged
        || !same(received.provenance?.capabilities, caps.receiver.consumed) || received.provenance.returnReady !== true
        || !Number.isFinite(received.provenance.sample)) return reject("UNRESOLVED_RECEIVE", "unsupported");
      // IncomingReceive consumes this saved explicit sample, not a random source.
      if (!same(received, resolveIncomingReceive({ playIdentity: truth.identity, physicalIdentity: truth.identity,
        throwResolution: thrown, receiver: { id: actors.receiverId, position: "1B" }, capabilities: caps.receiver.consumed,
        sample: received.provenance.sample, returnReady: true, receiveDelay: received.receiveDelay }))) return reject("RECEIVE_PROVENANCE");
      const runner = ground?.runnerPhysicalStates?.[0];
      const Ground = globalThis.BattedBallGroundDefense
        || (typeof require === "function" ? require("./batted-ball-ground-defense.js") : null);
      if (!Ground || !same(ground, Ground.buildGroundBallDefensiveOpportunity({ identity: truth.identity, physicalTruth: truth,
        runners: ctx.before.runners, outs: ctx.before.outs,
        batterRunner: { runnerId: ctx.batterId, speed: caps.batter.consumed.speed, startQuality: "normalStart" },
        defenderContext: { playerPosition: "游擊手", defensiveOpportunity: opportunity, reachAccess: ReachSecure.projectAccess(reach) } }))) return reject("GROUND_RUNNER_SOURCE");
      if (!ground?.supported || ground.identity !== truth.identity || !same(ground.physicalTruth, truth)
        || ground.runnerPhysicalStates.length !== 1 || runner.runnerId !== ctx.batterId || runner.originBase !== "batter"
        || runner.targetBase !== "first" || runner.speed !== caps.batter.consumed.speed || runner.startQuality !== "normalStart"
        || !same(ground.forceChain, Force.buildInitialLiveBallForceChain({ runners: ctx.before.runners, batterRunnerId: ctx.batterId }))) return reject("RUNNER_PHYSICAL_PROVENANCE");
      const receiverState = { receiverId: received.receiverId, ready: true, atBase: true, receiveDelay: received.receiveDelay,
        physicalIdentity: received.physicalIdentity, receiveIdentity: received.identity };
      input.receiverState = receiverState;
      // Loaded lazily after the existing Decision -> Runner dependency is initialized.
      // Revalidate saved timing with its owner; no second arrival formula or draw.
      const Runner = globalThis.DefensiveRunnerThrowSettlementFoundation
        || (typeof require === "function" ? require("./defensive-runner-throw-settlement-foundation.js") : null);
      if (!Runner || !same(timing, Runner.resolveTiming({ input, opportunity: decision, selection, throwResolution: thrown,
        runnerState: runner, receiverState }))) return reject("TIMING_PROVENANCE");
      if (!timing.contestAvailable || !(timing.timingMargin < 0)
        || !(timing.runnerArrival.relativeArrival < timing.receiverCompletion.relativeCompletion)) return reject("NOT_SAFE_BEFORE_COMPLETED_THROW", "unsupported");
      const bases = [ctx.batterId, null, null], third = firstLeg?.thirdOut;
      if (!firstLeg || firstLeg.identity !== `${timing.identity}|settlement-v1` || firstLeg.timingIdentity !== timing.identity || firstLeg.runnerResult !== "safe" || firstLeg.outRecorded !== false
        || firstLeg.targetRunnerId !== ctx.batterId || firstLeg.targetBase !== "first" || firstLeg.playType !== "batterRunner"
        || !same(firstLeg.before, ctx.before) || firstLeg.outsBefore !== ctx.before.outs || firstLeg.outsAfter !== ctx.before.outs
        || !same(firstLeg.baseChanges, bases) || !same(firstLeg.outRunnerIds, []) || !same(firstLeg.orderedRetirements, [])
        || !same(firstLeg.runChanges, []) || !same(firstLeg.runnerMovement, [{ runnerId: ctx.batterId, from: "batter", to: "first" }])
        || firstLeg.settlementApplied !== false || firstLeg.continuation?.status !== "liveBallContinuation"
        || firstLeg.continuation.targetBase !== null || firstLeg.ballRemainsLive !== true
        || !same(firstLeg.forceStateBefore, ground.forceChain) || !same(firstLeg.forceStateAfter, Force.deriveForceChainAfterRetirements(ground.forceChain, []))
        || !same(firstLeg.continuation.pendingRunners, []) || !same(firstLeg.continuation.inTransitRunners, [])
        || !third?.settlementReady || third.halfInningEnded || third.thirdOutType !== "none" || third.thirdRetirement !== null
        || third.outsBefore !== ctx.before.outs || third.outsAfter !== ctx.before.outs || !same(third.basesAfter, bases)
        || !same(third.basesBefore, ctx.before.runners) || third.timingStatus !== "resolved" || third.halfInningTransition !== "none"
        || !same(third.orderedRetirements, []) || !same(third.legalScoringRunnerIds, []) || !same(third.unresolvedScoringRunnerIds, [])) return reject("UNCLOSED_SAFE_FIRST");
      if (!actionFacts || !same(actionFacts, createActionFacts(actionFacts)) || actionFacts.playIdentity !== truth.identity
        || actionFacts.physicalIdentity !== truth.identity || actionFacts.sourceAuthority !== "sameBallActualNPCExecution"
        || !same(actionFacts.actions.map(a => a.type), ["field", "throw", "receive", "baseTouch"])) return reject("ACTION_PROVENANCE");
      const actions = actionFacts.actions, ids = actions.map(a => a.identity);
      for (let i = 0; i < 4; i++) if (actions[i].status !== "completed" || actions[i].errorCharged === true
        || actions[i].actorId !== (i < 2 ? actors.shortstopId : actors.receiverId)
        || actions[i].actorPosition !== (i < 2 ? "SS" : "1B") || actions[i].runnerId !== ctx.batterId
        || actions[i].targetBase !== "first" || !same(actions[i].dependsOn, i ? [ids[i - 1]] : [])) return reject("INCOMPLETE_OR_WRONG_ACTION");
      if (actions[0].provenance.reachId !== reach.identity || actions[0].provenance.secureId !== secure.identity
        || actions[1].provenance.throwId !== thrown.identity || actions[2].provenance.receiveId !== received.identity
        || actions[3].provenance.timingId !== timing.identity) return reject("ACTION_SOURCE_REFERENCES");
      if (!scorerFacts || !same(scorerFacts, resolveScorerEligibility({ actionFacts, retirements: [], contests: [] }))
        || scorerFacts.batterReachedOnError || scorerFacts.decisions.length || scorerFacts.contests.length) return reject("CONTRARY_OR_MISSING_SCORER_FACTS");
      return freeze({ version: "batter-reach-classification-v1", identity: `${truth.identity}|batter-reach-scorer-v1`,
        status: "supported", officialClassification: "infieldHit", compatibleOffensiveResult: "single",
        responsibleBatterId: ctx.batterId, physicalIdentity: truth.identity, matchId: ctx.matchId, paId: ctx.paId, pitchId: ctx.pitchId,
        explanation: "Normal completed SS-to-1B execution cannot retire the batter who actually reached first before the secured receive; no other runner choice or contrary scorer fact.",
        sourceReferences: { admission: clone(admission), actionIds: ids, reachId: reach.identity, secureId: secure.identity,
          throwId: thrown.identity, receiveId: received.identity, timingId: timing.identity, runnerSettlementId: firstLeg.identity,
          scorerId: scorerFacts.identity, capabilities: clone(caps) }, authority: "existingInfieldScorer", consumedRng: false });
    } catch (error) { return reject("INVALID_EXECUTION_PROVENANCE"); }
  }
  // S2-RECOVERY-001 additive API. Provisional station model; CRT is not seconds.
  function resolvePostDeliveryBallState(args = {}) {
    const reject = reason => freeze({ status:"unsupported", reason, modelVersion:"s2-recovery-model-v1" });
    const { context:ctx, physicalTruth, input, decision, selection, thrown, received, originalSamples, timeBase } = args;
    try {
      if (Object.keys(args).some(k => !["context","physicalTruth","input","decision","selection","thrown","received","originalSamples","timeBase"].includes(k))) return reject("UNDECLARED_BALL_INPUT");
      const a = ctx?.admission, caps = ctx?.capabilities;
      if (ctx?.coveragePolicy !== "s2-recovery-facts-v1" || a?.coveragePolicy !== ctx.coveragePolicy
        || a.authority !== "originalPlayerDetailedPA" || a.lockedAt !== "beforeFirstPitch"
        || a.matchId !== ctx.matchId || a.paId !== ctx.paId || a.batterId !== ctx.batterId
        || !same(a.capabilities,caps)) return reject("RECOVERY_ADMISSION");
      if (!ctx.matchId || !ctx.paId || !ctx.pitchId || ctx.batterId !== "player" || ctx.before.runners.some(Boolean)
        || !Number.isInteger(ctx.before.outs) || ctx.before.outs < 0 || ctx.before.outs > 2
        || ctx.physicalId !== physicalTruth?.identity || physicalTruth.ballType !== "groundBall"
        || physicalTruth.executionEvidence?.actualPitch?.pitchId !== ctx.pitchId
        || physicalTruth.executionEvidence.actualPitch.pitcherId !== caps.actors.pitcherId) return reject("SAME_BALL_IDENTITY");
      const clock = { version:"s2-recovery-clock-v1", origin:"samePlayLaunch", unit:"coarseRelativeTime", matchId:ctx.matchId, paId:ctx.paId, pitchId:ctx.pitchId, physicalId:ctx.physicalId };
      if (!same(timeBase,clock)) return reject("TIME_BASE");
      const samples = a.recoverySamples, order = ["direction","displacement","contact","approach","acquire"];
      if (samples?.version !== "s2-recovery-samples-v1" || samples.authority !== "preAdmissionControlledRecoverySamples"
        || !same(samples.order,order) || Object.keys(samples).sort().join() !== "authority,order,values,version"
        || Object.keys(samples.values || {}).sort().join() !== [...order].sort().join()
        || order.some(k => typeof samples.values[k] !== "number" || !Number.isFinite(samples.values[k]) || samples.values[k] < 0 || samples.values[k] >= 1)) return reject("MODEL_SAMPLES");
      if (!same(ctx.activeRoster,input?.activeRoster) || !same(input.physicalTruth,physicalTruth)
        || !same(input.capabilities,caps.shortstop.consumed) || !same(input.runners,ctx.before.runners) || input.outs !== ctx.before.outs) return reject("EXECUTION_CONTEXT");
      Roster.assertActiveDefense(ctx.activeRoster);
      for (const [position,key] of [["SS","shortstop"],["1B","receiver"]]) {
        const actor = ctx.activeRoster.lineup.find(p => p.id === caps[key].actorId && p.defensivePosition === position), c = caps[key].consumed;
        if (!actor || c.defenderId !== actor.id || caps[key].fallback !== false
          || caps[key].raw.defense !== actor.defense || caps[key].raw.arm !== actor.arm || caps[key].raw.speed !== actor.speed
          || ["fielding","catching","reaction","range"].some(k => c[k] !== actor.defense)
          || c.mobility !== actor.speed || c.arm !== actor.arm || c.throwing !== actor.arm
          || [actor.defense,actor.arm,actor.speed].some(v => !Number.isFinite(v) || v < 0 || v > 20)) return reject("ACTUAL_NPC_CAPABILITY");
      }
      if (caps.actors.shortstopId !== caps.shortstop.actorId || caps.actors.receiverId !== caps.receiver.actorId
        || caps.actors.shortstopId === caps.actors.receiverId || caps.actors.receiverId === "player") return reject("ACTOR_IDENTITY");
      for (const k of ["reach","secure","strength","accuracy","receive"]) if (typeof originalSamples?.[k] !== "number" || originalSamples[k] < 0 || originalSamples[k] >= 1) return reject("ORIGINAL_SAMPLES");
      const base = { physicalTruth, activeRoster:ctx.activeRoster, opportunity:input.opportunity, capabilities:caps.shortstop.consumed };
      const reach = ReachSecure.resolveReach({ ...base, roll:originalSamples.reach });
      const secure = ReachSecure.resolveSecure({ ...base, reachResult:reach, roll:originalSamples.secure });
      if (!same(input.reachResult,reach) || !same(input.secureResult,secure) || !secure.secured
        || !same(buildDecisionOpportunity(input),decision)) return reject("ORIGINAL_FIELD_EXECUTION");
      const Ground = globalThis.BattedBallGroundDefense || (typeof require === "function" ? require("./batted-ball-ground-defense.js") : null);
      const ground = Ground.buildGroundBallDefensiveOpportunity({ identity:physicalTruth.identity, physicalTruth, runners:ctx.before.runners, outs:ctx.before.outs,
        batterRunner:{ runnerId:"player", speed:caps.batter.consumed.speed, startQuality:"normalStart" },
        defenderContext:{ playerPosition:"\u6e38\u64ca\u624b", defensiveOpportunity:input.opportunity, reachAccess:ReachSecure.projectAccess(reach) } });
      if (!ground.supported || input.batterRunnerId !== "player" || !same(input.runnerPhysicalStates,ground.runnerPhysicalStates)
        || !same(input.forceChain,ground.forceChain)) return reject("ORIGINAL_RUNNER_MOVEMENT");
      validateSelection(selection,decision,input);
      if (selection.route.routeId !== "secureFirstBaseOut" || selection.position !== "SS" || selection.route.receiverPosition !== "1B"
        || selection.route.targetBase !== "first" || selection.route.targetRunnerId !== "player") return reject("DELIVERY_SCOPE");
      const freshThrow = resolveThrow({ input, opportunity:decision, selection, capabilities:caps.shortstop.consumed,
        rolls:{ strength:originalSamples.strength, accuracy:originalSamples.accuracy }, transferState:"ready" });
      if (!same(thrown,freshThrow)) return reject("THROW_EXECUTION");
      const freshReceive = resolveIncomingReceive({ playIdentity:ctx.physicalId, physicalIdentity:ctx.physicalId, throwResolution:thrown,
        receiver:{ id:caps.actors.receiverId, position:"1B" }, capabilities:caps.receiver.consumed, sample:originalSamples.receive });
      if (!same(received,freshReceive)) return reject("RECEIVE_EXECUTION");
      const nominal = { short:4, medium:5, long:6 }[thrown.throwDemand?.distanceClass], quality = thrown.throwQuality, s = samples.values;
      if (nominal === undefined || !["onTarget","challengingReceive","offline"].includes(quality)) return reject("DELIVERY_MODEL_SCOPE");
      const r = n => Math.round(n*1000)/1000;
      const occurredAt = r(nominal + (quality === "challengingReceive" ? 1 : quality === "offline" ? 1+s.displacement : 0) + received.receiveDelay);
      const held = received.ready && received.secured;
      const distanceMeters = held ? 0 : r(quality === "offline" ? 6+6*s.displacement : quality === "challengingReceive" ? 2+4*s.displacement : 1+3*s.displacement);
      const side = held ? "target" : s.direction < .5 ? "infield" : "foul";
      return freeze({ status:"supported", version:"s2-post-delivery-ball-v1", modelVersion:"s2-recovery-model-v1",
        identity:ctx.physicalId+"|post-delivery-v1", sameBall:{ matchId:ctx.matchId, paId:ctx.paId, pitchId:ctx.pitchId, physicalId:ctx.physicalId },
        phase:2, sourceRefs:{ throwId:thrown.identity, receiveId:received.identity, priorSecureId:secure.identity },
        possession:{ status:held ? "controlled" : "loose", holderId:held ? received.receiverId : null },
        location:{ station:"firstReceiverTarget", region:held ? "target" : (distanceMeters <= 4 ? "near" : "outer")+"-"+side,
          side, distanceMeters, boundsMeters:held ? [0,0] : distanceMeters <= 4 ? [0,4] : [4,12] },
        contact:held ? "securedReceive" : received.ready && received.status === "failed" && s.contact < .5 ? "gloveDeflection" : "untouched",
        occurredAt, timeBase:clone(timeBase), sampleProvenance:{ version:samples.version, authority:samples.authority,
          order:held ? [] : order.slice(0,3), values:held ? {} : { direction:s.direction, displacement:s.displacement, contact:s.contact }, stage:"postDelivery", consumedRng:false } });
    } catch (error) { return reject("INVALID_UPSTREAM:"+error.message); }
  }
  // End S2-RECOVERY-001 additive API.
  // G1-B bounded extension. Original infield classification and error rules are unchanged.
  function resolveOutfieldSingleClassification(args = {}) {
    const reject=reason=>freeze({status:"insufficient",reason});
    try {
      if(Object.keys(args).sort().join()!=="ballInput,ballState,retrieval,runnerContinuation")return reject("UNDECLARED_OUTFIELD_SCORER_INPUT");
      const Fly=globalThis.BattedBallFlyBallDefense||(typeof require==="function"?require("./batted-ball-fly-ball-defense.js"):null);
      const Runner=globalThis.DefensiveRunnerThrowSettlementFoundation||(typeof require==="function"?require("./defensive-runner-throw-settlement-foundation.js"):null);
      const ball=Fly.resolveGroundedOutfieldBall(args.ballInput);
      if(ball.status!=="supported"||!same(ball,args.ballState))return reject("UNVERIFIED_FAIR_LANDING_ORDINARY_EFFORT");
      const retrieval=ReachSecure.resolveOutfieldRetrieval({ballInput:args.ballInput,ballState:ball});
      const runner=Runner.resolveOutfieldContinuation({ballInput:args.ballInput,ballState:ball,retrieval});
      if(!same(retrieval,args.retrieval)||!same(runner,args.runnerContinuation)||retrieval.status!=="completed"
        ||!runner.closed||runner.status!=="closed"||runner.finalBase!=="first"
        ||runner.decision.type!=="holdFirst"||!runner.attainedBases.length
        ||ball.ordinaryEffort.errorEligibility!=="noReachOpportunityBeforeGround"
        ||ball.ordinaryEffort.reach.reached||ball.ordinaryEffort.catchAttempted||!retrieval.pickup.secured
        ||retrieval.afterPossession.holderId!==ball.defender.id)return reject("UNCLOSED_OR_CONTRARY_OUTFIELD_FACTS");
      return freeze({version:"g1-b-outfield-single-scorer-v1",status:"supported",identity:ball.physicalIdentity+"|official-single",
        physicalIdentity:ball.physicalIdentity,paIdentity:ball.paIdentity,responsibleBatterId:ball.batterId,
        officialClassification:"cleanOutfieldSingle",compatibleOffensiveResult:"single",authority:"existingOutfieldScorer",
        explanation:"Untouched fair landing beyond the canonical best primary reach; actual clean pickup, proven first arrival and declined extra-base attempt close the same play.",
        errorEligibility:{status:"resolved",charged:false,reason:"noOrdinaryReachOpportunityAndCleanGroundPickup"},
        sourceReferences:{ballId:ball.identity,reachId:ball.ordinaryEffort.reach.identity,retrievalId:retrieval.identity,runnerId:runner.identity},
        consumedRng:false});
    }catch(error){return reject("INVALID_OUTFIELD_SCORER_SOURCE:"+error.message);}
  }
  // End G1-B bounded extension.
  return freeze({ VERSION, RNG_NAMESPACES, isAdvancingTo, hasHomePlay, controlled, buildDecisionOpportunity,
    selectDefensiveRoute, validateOpportunity, validateSelection, resolveThrow, resolveBaseTouch, projectExistingThrow, throwDemand, validateStoredStage,
    resolveIncomingReceive, ACTION_TYPES, createActionFacts, resolveScorerEligibility, projectDefensiveAttribution, resolveBatterReachClassification, resolvePostDeliveryBallState, resolveOutfieldSingleClassification });
});
