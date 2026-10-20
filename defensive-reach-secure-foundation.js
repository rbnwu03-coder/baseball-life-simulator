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
    const saved = input.opportunity;
    const fresh = Opportunity.resolveDefensiveOpportunity({ physicalTruth: input.physicalTruth, activeRoster: input.activeRoster,
      topologyVersion: input.topologyVersion || saved?.topologyVersion || Opportunity.TOPOLOGY_VERSION });
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
    const thirdBase = ball.ballType === "groundBall" && opportunity.primaryPosition === "3B";
    const reactionDemand = ball.ballType === "lineDrive" ? pace + ({ shallow: 2, medium: 0.5, deep: 0 }[ball.depth])
      : ball.ballType === "flyBall" ? pace * 0.5 : pace + (thirdBase && ball.pace === "hard" ? 1 : 0);
    // The near-line lane is closer to 3B; SS retains the greater nominal range.
    const groundMovement = thirdBase ? (ball.pace === "weak" ? 4 : 2) : (ball.pace === "weak" ? 4.5 : 3);
    const movementDemand = (airborne ? { shallow: 3, medium: 4, deep: 5 }[ball.depth]
      : groundMovement) + ambiguity + (thirdBase ? 0.5 : 0);
    const reactionWeight = ball.ballType === "flyBall" ? 0.3 : ball.ballType === "lineDrive" ? 0.6 : thirdBase ? 0.65 : 0.55;
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
    const variationIdentity = `${op.executionIdentity || op.identity}|${op.primaryDefenderId}|reach-v1`;
    const evidence = variation("reach", variationIdentity, input.roll);
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
    const variationIdentity = `${reach.variationEvidence?.identity || reach.identity}|secure-v1`;
    const evidence = variation("secure", variationIdentity, input.roll);
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
    const topologyVersion = state.defensiveOpportunity?.topologyVersion || state.defensiveAccess?.topologyVersion
      || Opportunity.TOPOLOGY_VERSION;
    const input = { physicalTruth: state.physicalTruth, activeRoster, topologyVersion,
      opportunity: Opportunity.resolveDefensiveOpportunity({ physicalTruth: state.physicalTruth, activeRoster, topologyVersion }),
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
  // S2-RECOVERY-001 additive API; existing batted-ball reach/secure is unchanged.
  function resolveRecoveryAction(args = {}) {
    const reject = reason => freeze({ status:"unsupported", reason, modelVersion:"s2-recovery-model-v1" });
    try {
      const { ballInput, ballState:ball, activeRoster, capabilities:c, access, timeBase } = args;
      if (Object.keys(args).some(k => !["ballInput","ballState","activeRoster","capabilities","access","timeBase"].includes(k))) return reject("UNDECLARED_RECOVERY_INPUT");
      // Lazy lookup avoids the original Decision -> Reach factory dependency cycle.
      const Decision = globalThis.DefensiveDecisionThrowFoundation || (typeof require === "function" ? require("./defensive-decision-throw-foundation.js") : null);
      const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
      const fresh = Decision.resolvePostDeliveryBallState(ballInput);
      if (fresh.status !== "supported" || !same(ball,fresh)) return reject("UNVERIFIED_BALL_STATE");
      const ctx = ballInput.context;
      if (ball.possession.status !== "loose" || ball.possession.holderId !== null || ball.phase !== 2) return reject("NOT_LOOSE_POST_DELIVERY");
      if (!same(timeBase,ball.timeBase) || !same(activeRoster,ctx.activeRoster)
        || !same(c,ctx.capabilities.receiver.consumed)) return reject("RECOVERY_CONTEXT");
      const actor = activeRoster.lineup.find(p => p.id === c.defenderId && p.defensivePosition === "1B");
      const expectedAccess = { actorId:ctx.capabilities.actors.receiverId, position:"1B", station:"firstReceiverTarget", sourceReceiveId:ball.sourceRefs.receiveId };
      if (!actor || actor.id === "player" || !same(access,expectedAccess) || ball.location.station !== access.station
        || !["near-infield","near-foul","outer-infield","outer-foul"].includes(ball.location.region)
        || !(ball.location.distanceMeters > 0 && ball.location.distanceMeters <= 12)) return reject("RECOVERY_ACCESS");
      const s = ctx.admission.recoverySamples.values, d = ball.location.distanceMeters;
      const reactionDuration = round(1/(1+.25*c.reaction)), movementSpeed = 1+.25*c.mobility;
      const movementDuration = round(d/movementSpeed), acquireDuration = round(1/(1+.25*c.fielding));
      const duration = round(reactionDuration+movementDuration+acquireDuration);
      const reachMargin = round(.6*c.range+.4*c.mobility+4*(s.approach-.5)-.5*d);
      const acquireMargin = round(.75*c.fielding+.25*c.catching+4*(s.acquire-.5)-(ball.contact === "gloveDeflection" ? 4 : 2));
      const reached = reachMargin >= 0, secured = reached && acquireMargin >= 0;
      return freeze({ status:secured ? "completed" : "failed", version:"s2-recovery-action-v1", modelVersion:ball.modelVersion,
        identity:ball.identity+"|recovery-v1", sameBall:copy(ball.sameBall), phase:3, dependsOn:[ball.identity], actorId:actor.id, actorPosition:"1B",
        selection:{ policy:"targetStationFirstBaseman-v1", access:copy(access), candidates:[actor.id],
          forecastDuration:duration, forecastPossessionAt:round(ball.occurredAt+duration), authority:"visibleBallLocation+admittedNPCCapabilitiesBeforeAcquireSamples" },
        capabilities:copy(c), startAt:ball.occurredAt, completedAt:round(ball.occurredAt+reactionDuration+movementDuration+(reached ? acquireDuration : 0)), timeBase:copy(timeBase),
        approach:{ reached, margin:reachMargin, reactionDuration, movementDuration, movementSpeed, distanceMeters:d },
        acquisition:{ attempted:reached, secured, margin:acquireMargin, duration:reached ? acquireDuration : 0 },
        beforePossession:copy(ball.possession), afterPossession:{ status:secured ? "controlled" : "loose", holderId:secured ? actor.id : null },
        sampleProvenance:{ version:ctx.admission.recoverySamples.version, authority:ctx.admission.recoverySamples.authority,
          stage:"recovery", order:["approach","acquire"], values:{ approach:s.approach, acquire:s.acquire }, consumedRng:false },
        reason:secured ? "ACTUAL_APPROACH_AND_ACQUISITION" : reached ? "ACQUISITION_FAILED" : "APPROACH_FAILED" });
    } catch (error) { return reject("INVALID_RECOVERY_SOURCE:"+error.message); }
  }
  // End S2-RECOVERY-001 additive API.
  // G1-B bounded extension. Grounded OF access is distinct from failed-delivery 1B recovery.
  function resolveOutfieldRetrieval(args = {}) {
    const reject=reason=>freeze({status:"unsupported",reason});
    try {
      if(Object.keys(args).sort().join()!=="ballInput,ballState")return reject("UNDECLARED_RETRIEVAL_INPUT");
      const Fly=globalThis.BattedBallFlyBallDefense||(typeof require==="function"?require("./batted-ball-fly-ball-defense.js"):null);
      const ball=Fly.resolveGroundedOutfieldBall(args.ballInput),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
      if(ball.status!=="supported"||!same(ball,args.ballState))return reject("UNVERIFIED_GROUNDED_BALL");
      const c=ball.defender.capabilities,s=args.ballInput.admission.control.samples,d=ball.location.distanceMeters;
      // Original Recovery reaction/movement/acquire coefficients and capability scale.
      const reactionDuration=round(1/(1+.25*c.reaction)),movementSpeed=1+.25*c.mobility;
      const movementDuration=round(d/movementSpeed),acquireDuration=round(1/(1+.25*c.fielding));
      const duration=round(reactionDuration+movementDuration+acquireDuration);
      const reachMargin=round(.6*c.range+.4*c.mobility+4*(s.approach-.5)-.5*d);
      const acquireMargin=round(.75*c.fielding+.25*c.catching+4*(s.acquire-.5)-2);
      const reached=reachMargin>=0,secured=reached&&acquireMargin>=0;
      return freeze({status:secured?"completed":"failed",version:"g1-b-outfield-retrieval-v1",
        identity:ball.identity+"|retrieve",physicalIdentity:ball.physicalIdentity,ballIdentity:ball.identity,
        actorId:ball.defender.id,position:ball.defender.position,capabilities:copy(c),location:copy(ball.location),
        timeBase:copy(ball.timeBase),startAt:ball.landedAt,
        selection:{policy:"actualPrimaryOutfielder",forecastPossessionAt:round(ball.landedAt+duration),
          authority:"visibleGroundedLocation+admittedCapabilityBeforePickupSamples"},
        approach:{reached,margin:reachMargin,reactionDuration,movementDuration,movementSpeed,distanceMeters:d},
        pickup:{attempted:reached,secured,margin:acquireMargin,duration:reached?acquireDuration:0},
        completedAt:round(ball.landedAt+reactionDuration+movementDuration+(reached?acquireDuration:0)),
        beforePossession:copy(ball.possession),afterPossession:{status:secured?"controlled":"loose",holderId:secured?ball.defender.id:null},
        provenance:{authority:"actualNPCApproachAndPickup",samplePolicy:args.ballInput.admission.control.policy,
          samples:copy(s),consumedRng:false,originalSecureReusedAsPossession:false},throwAttempted:false});
    }catch(error){return reject("INVALID_RETRIEVAL_SOURCE:"+error.message);}
  }
  // End G1-B bounded extension.
  // G1-C bounded third-strike catch. A pitch is never a batted ball or a throw.
  function resolveThirdStrikeCatch(input = {}) {
    const reject = reason => freeze({ status: "unsupported", caught: false, reason });
    const { paIdentity, batterId, pitcherId, pitchEvent: e, catcher: c, sample } = input;
    if (Object.keys(input).sort().join() !== "batterId,catcher,paIdentity,pitchEvent,pitcherId,sample"
      || !paIdentity || !batterId || !pitcherId || !e?.pitch || !c?.id || c.id === "player"
      || c.position !== "C" || !["simulation-roster", "team-roster-foundation"].includes(c.source)
      || c.id === pitcherId || c.id === batterId || ![c.raw?.defense, c.raw?.arm, c.raw?.speed].every(x => Number.isFinite(x) && x >= 0 && x <= 20)
      || JSON.stringify(c.capabilities) !== JSON.stringify({ fielding: c.raw.defense, catching: c.raw.defense, reaction: c.raw.defense })
      || !Number.isFinite(sample) || sample < 0 || sample >= 1) return reject("INVALID_ACTIVE_CATCHER_OR_CAPABILITY");
    const p = e.pitch;
    if (e.paResult !== "strikeout" || e.countBefore?.strikes !== 2 || e.countAfter?.strikes !== 3
      || !Number.isInteger(e.pitchNumber) || e.pitchNumber < 1 || p.paIdentity !== paIdentity
      || p.pitchId !== `${paIdentity}|pitch-${e.pitchNumber}` || p.pitcherId !== pitcherId
      || !["hitterPitch", "competitiveStrike", "edgeStrike", "chasePitch", "clearBall"].includes(p.pitchLocationClass)
      || p.bounced === true || p.touchedGround === true || p.uncaught === true || p.catchEligible === false
      || e.thirdStrikeUncaught === true || e.contact === true
      || !(e.pitchResult === "calledStrike" && e.action === "take" && p.strike === true
        || e.pitchResult === "swingingStrike" && e.action === "swing" && e.contact === false)) return reject("NOT_ORDINARY_AIRBORNE_THIRD_STRIKE");
    const margin = round(.8 * c.capabilities.catching + .2 * c.capabilities.fielding - 2.5 + (0.5 - sample) * 2);
    const caught = margin >= 0;
    return freeze({ version: "g1-c-third-strike-catch-v1", identity: `${p.pitchId}|${c.id}|third-strike-catch`,
      status: caught ? "completed" : "unclosed", caught, paIdentity, batterId, pitcherId, catcherId: c.id,
      pitchIdentity: p.pitchId, strikeType: e.pitchResult, possession: { status: caught ? "controlled" : "unresolved", holderId: caught ? c.id : null },
      catchBeforeGround: caught, margin, demand: 2.5, capabilities: copy(c.capabilities), sample,
      policy: "ordinaryAirbornePitchOnly", authority: "actualThirdStrike+activeNPCCatcher+secureCapability",
      consumedRng: false, throwAttempted: false });
  }
  // End G1-C bounded third-strike catch.
  return freeze({ VERSION, RNG_NAMESPACES, resolveReach, resolveSecure, validateReach, projectAccess, projectGroundControl, validatePendingState, resolveRecoveryAction, resolveOutfieldRetrieval, resolveThirdStrikeCatch });
});
