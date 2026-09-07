(function (root, factory) {
  const dependency = (name, path) => root[name] || (typeof module === "object" && module.exports ? require(path) : null);
  const api = factory(dependency("BattedBallPhysical", "./batted-ball-physical.js"),
    dependency("DefensiveOpportunityFoundation", "./defensive-opportunity-foundation.js"));
  root.DefensiveReachSecureFoundation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Physical, Opportunity) {
  "use strict";
  const VERSION = "defensive-reach-secure-v1";
  const RNG_NAMESPACES = { reach: "defensive-reach-v1", secure: "defensive-secure-v1" };
  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze);
    return Object.freeze(value);
  }
  const copy = value => JSON.parse(JSON.stringify(value));
  const ability = value => Math.max(0, Math.min(20, Number.isFinite(Number(value)) ? Number(value) : 5));
  const round = value => Math.round(value * 1000) / 1000;
  function binding(input) {
    const fresh = Opportunity.resolveDefensiveOpportunity(input);
    const saved = input.opportunity;
    if (!fresh.supported || !saved || JSON.stringify(fresh) !== JSON.stringify(saved)
      || input.capabilities?.defenderId !== fresh.primaryDefenderId) {
      throw new Error("Reach / Secure integrity failed: invalid or stale opportunity / active defender");
    }
    return fresh;
  }
  function demand(opportunity) {
    const ball = opportunity.ballContext;
    const ambiguity = { clear: 0, sharedEdge: 0.3, coarseAmbiguity: 0.6 }[opportunity.responsibilityClassification];
    const pace = { weak: 2.5, moderate: 3.5, firm: 4.5, hard: 6 }[ball.pace];
    const airborne = ball.ballType !== "groundBall";
    const reactionDemand = ball.ballType === "lineDrive" ? pace + ({ shallow: 2, medium: 0.5, deep: 0 }[ball.depth])
      : ball.ballType === "flyBall" ? pace * 0.5 : pace;
    const movementDemand = (airborne ? { shallow: 3, medium: 4, deep: 5 }[ball.depth]
      : ball.pace === "weak" ? 4.5 : 3) + ambiguity;
    const reactionWeight = ball.ballType === "flyBall" ? 0.3 : ball.ballType === "lineDrive" ? 0.6 : 0.55;
    return { ...copy(ball), responsibilityClassification: opportunity.responsibilityClassification,
      ambiguity, reactionDemand, movementDemand, reactionWeight,
      reachDemand: round(reactionDemand * reactionWeight + movementDemand * (1 - reactionWeight)),
      units: "coarseRelativeDemand" };
  }
  function variation(stage, identity, explicitRoll) {
    const namespace = RNG_NAMESPACES[stage];
    const roll = Number.isFinite(explicitRoll) ? Math.max(0, Math.min(1, explicitRoll))
      : Physical.deterministicUnit(namespace, identity, stage);
    return { namespace, identity, roll, adjustment: round((0.5 - roll) * 2), consumed: true };
  }
  function resolveReach(input = {}) {
    const op = binding(input);
    const identity = `${op.identity}|${op.primaryDefenderId}|reach-v1`;
    const ballDemand = demand(op);
    const caps = input.capabilities;
    const inputs = { reaction: ability(caps.reaction), range: ability(caps.range), mobility: ability(caps.mobility ?? caps.range) };
    const movement = inputs.range * 0.75 + inputs.mobility * 0.25;
    const evidence = variation("reach", identity, input.roll);
    const margin = round(inputs.reaction * ballDemand.reactionWeight + movement * (1 - ballDemand.reactionWeight)
      - ballDemand.reachDemand + evidence.adjustment);
    return freeze({ version: VERSION, identity, opportunityIdentity: op.identity, physicalIdentity: op.physicalIdentity,
      defenderId: op.primaryDefenderId, position: op.primaryPosition, supported: true,
      authority: "physicalOpportunity+activeDefender+reachCapabilities",
      reachDemand: ballDemand.reachDemand, reactionDemand: ballDemand.reactionDemand, movementDemand: ballDemand.movementDemand,
      responsibilityClassification: op.responsibilityClassification, ballDemand, inputs, margin,
      reached: margin >= 0, reachQuality: margin >= 1.25 ? "cleanArrival" : margin >= 0 ? "stretchedArrival" : "notReached",
      variationEvidence: evidence });
  }
  function validateReach(input) {
    const op = binding(input);
    const reach = input.reachResult;
    if (!reach || reach.version !== VERSION || reach.opportunityIdentity !== op.identity
      || reach.physicalIdentity !== op.physicalIdentity || reach.defenderId !== op.primaryDefenderId
      || reach.position !== op.primaryPosition || reach.identity !== `${op.identity}|${op.primaryDefenderId}|reach-v1`
      || JSON.stringify(reach.ballDemand) !== JSON.stringify(demand(op))
      || !reach.supported || !["cleanArrival", "stretchedArrival", "notReached"].includes(reach.reachQuality)
      || reach.reached !== (reach.reachQuality !== "notReached")) {
      throw new Error("Reach / Secure integrity failed: incompatible reach result");
    }
    return reach;
  }
  function secureBase(reach) {
    return { version: VERSION, identity: `${reach.identity}|secure-v1`, reachIdentity: reach.identity,
      opportunityIdentity: reach.opportunityIdentity, physicalIdentity: reach.physicalIdentity,
      defenderId: reach.defenderId, position: reach.position, attemptAvailable: reach.reached,
      authority: "arrival+hands+physicalPressure", inputs: { arrivalQuality: reach.reachQuality } };
  }
  function resolveSecure(input = {}) {
    const reach = validateReach(input);
    const base = secureBase(reach);
    if (!reach.reached) return freeze({ ...base, secureDemand: null, secureQuality: "notAttempted", secured: false,
      ballState: "notReached", variationEvidence: { namespace: RNG_NAMESPACES.secure, consumed: false, roll: null } });
    const ball = input.opportunity.ballContext;
    const fielding = ability(input.capabilities.fielding ?? input.capabilities.catching);
    const catching = ability(input.capabilities.catching ?? input.capabilities.fielding);
    const ground = ball.ballType === "groundBall";
    const pressure = { weak: 2.5, moderate: 3.5, firm: 4.5, hard: 6 }[ball.pace]
      + (ball.ballType === "lineDrive" ? 1 : ball.ballType === "flyBall" ? -1 : 0);
    const arrivalPenalty = reach.reachQuality === "stretchedArrival" ? 2 : 0;
    const secureDemand = pressure + arrivalPenalty;
    const evidence = variation("secure", base.identity, input.roll);
    const margin = round((ground ? fielding * 0.75 + catching * 0.25 : catching * 0.8 + fielding * 0.2)
      - secureDemand + evidence.adjustment);
    const secured = margin >= 0;
    return freeze({ ...base, secureDemand, margin, secured,
      secureQuality: ground ? (margin >= 1.5 ? "cleanControl" : secured ? "bobbleButControlled" : "notControlled")
        : secured ? "caughtBeforeGround" : "notCaught",
      ballState: secured ? "secured" : ground ? "looseLiveBall" : "groundContactLive",
      inputs: { ...base.inputs, fielding, catching, ballType: ball.ballType, pace: ball.pace, pressure, arrivalPenalty },
      variationEvidence: evidence });
  }
  // Existing 2B control remains the sole control authority for that validated vertical.
  // This adapter records its physical fact; it never rolls or interprets outs/throws.
  function projectGroundControl(reach, control, evidence = {}) {
    if (!reach?.reached || !["completed", "recovered", "failed"].includes(control)) {
      throw new Error("Reach / Secure integrity failed: unavailable ground control fact");
    }
    return freeze({ ...secureBase(reach), authority: "existingSecondBaseControlAdapter", secureDemand: evidence.controlThreshold ?? null,
      secureQuality: control === "completed" ? "cleanControl" : control === "recovered" ? "bobbleButControlled" : "notControlled",
      secured: control !== "failed", ballState: control === "failed" ? "looseLiveBall" : "secured",
      inputs: { arrivalQuality: reach.reachQuality, control, ...copy(evidence) },
      variationEvidence: { namespace: "existingSecondBaseExecution", consumed: false, roll: null,
        sourceRoll: evidence.sample ?? null, sourceAdjustment: evidence.swing ?? null } });
  }
  function projectAccess(reach) {
    const supported = reach?.supported === true && reach.reached === true;
    const level = !supported ? "unsupported" : reach.reachQuality === "cleanArrival" ? "favored" : "possible";
    return freeze({ supported, level, score: level === "favored" ? 3 : supported ? 2 : 0,
      reason: supported ? "canonicalReachArrival" : "canonicalReachUnavailable", reachIdentity: reach?.identity || "",
      reachResolution: reach ? copy(reach) : null });
  }
  function validatePendingState(state, activeRoster) {
    const reachResult = state?.defensiveAccess?.reachResolution;
    if (!reachResult || !state.supported || state.settlementApplied) return true; // No live detailed stage, or historical actor already settled.
    const input = { physicalTruth: state.physicalTruth, activeRoster,
      opportunity: Opportunity.resolveDefensiveOpportunity({ physicalTruth: state.physicalTruth, activeRoster }),
      capabilities: state.defensiveAccess.secureCapabilities, reachResult };
    validateReach(input);
    if (!reachResult.reached || state.defensiveAccess.level !== projectAccess(reachResult).level) {
      throw new Error("Reach / Secure integrity failed: unsupported detailed arrival");
    }
    const secure = state.secureResolution || state.catchResult?.secureResolution;
    if (secure && (secure.version !== VERSION || secure.reachIdentity !== reachResult.identity
      || secure.defenderId !== reachResult.defenderId || secure.position !== reachResult.position
      || secure.physicalIdentity !== reachResult.physicalIdentity
      || secure.opportunityIdentity !== reachResult.opportunityIdentity
      || secure.attemptAvailable !== reachResult.reached
      || secure.secured !== ["cleanControl", "bobbleButControlled", "caughtBeforeGround"].includes(secure.secureQuality)
      || !["cleanControl", "bobbleButControlled", "notControlled", "caughtBeforeGround", "notCaught"].includes(secure.secureQuality)
      || secure.ballState !== (secure.secured ? "secured" : state.physicalTruth.ballType === "groundBall" ? "looseLiveBall" : "groundContactLive"))) {
      throw new Error("Reach / Secure integrity failed: stale persisted secure result");
    }
    return true;
  }
  return freeze({ VERSION, RNG_NAMESPACES, resolveReach, resolveSecure, validateReach, projectAccess, projectGroundControl, validatePendingState });
});
