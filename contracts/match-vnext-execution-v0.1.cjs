(function(root,factory) {
  const decision = root.DefensiveDecisionThrowFoundation || (typeof module === "object" && module.exports ? require("../defensive-decision-throw-foundation.js") : null);
  const api = factory(decision);
  root.MatchVNextExecutionContract = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(Decision) {
  "use strict";
  const VERSION = "match-vnext-execution-v0.1";
  const OUT_ONLY_POLICY = "s1-out-only", SAFE_FIRST_POLICY = "s2-safe-first-v1", RECOVERY_POLICY = "s2-recovery-facts-v1";
  function coveragePolicy(value) {
    check(value === undefined || value === OUT_ONLY_POLICY || value === SAFE_FIRST_POLICY || value === RECOVERY_POLICY, "COVERAGE_POLICY");
    return value === undefined ? OUT_ONLY_POLICY : value;
  }
  function check(ok, reason) { if (!ok) throw new Error("SAME_BALL_CONTRACT:" + reason); }
  function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  function canonical(value) { return JSON.stringify(value, function(key, item) { return item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item; }); }
  const same = (a,b) => canonical(a) === canonical(b);
  const copy = value => JSON.parse(JSON.stringify(value));
  function validateContext(context) {
    check(context?.version === VERSION, "VERSION");
    const policy = coveragePolicy(context.coveragePolicy);
    if (policy === SAFE_FIRST_POLICY || policy === RECOVERY_POLICY) check(context.admission?.authority === "originalPlayerDetailedPA"
      && context.admission.lockedAt === "beforeFirstPitch" && context.admission.coveragePolicy === policy
      && context.admission.matchId === context.matchId && context.admission.paId === context.paId
      && context.admission.batterId === context.batterId, "POLICY_ADMISSION");
    for (const key of ["matchId","paId","pitchId","batterId","offenseTeam","defenseTeam","situationId"])
      check(typeof context[key] === "string" && context[key].length > 0, "MISSING_" + key);
    check(context.batterId === "player" && context.offenseTeam !== context.defenseTeam, "BATTER_TEAM");
    check(Number.isInteger(context.battingSlot) && context.battingSlot >= 0 && context.battingSlot < 9, "BATTING_SLOT");
    check(Number.isInteger(context.before?.outs) && context.before.outs >= 0 && context.before.outs < 3
      && context.before.runners?.length === 3 && !context.before.runners.some(Boolean), "BEFORE_SCOPE");
    check(["home","away"].every(s => Number.isFinite(context.before.scores?.[s])), "SCORES");
    const caps = context.capabilities, actors = caps?.actors;
    check(actors && actors.batterId === "player" && new Set(["player",actors.pitcherId,actors.shortstopId,actors.receiverId]).size === 4, "ACTOR_BINDING");
    check([actors.pitcherId,actors.shortstopId,actors.receiverId].every(id => typeof id === "string" && id.length && !/^(opponent-pitcher|batter-runner)$/.test(id)), "PLACEHOLDER_ACTOR");
    for (const key of ["pitcher","batter","shortstop","receiver"]) {
      check(caps[key]?.fallback === false && typeof caps[key].source === "string" && caps[key].source.length, "CAPABILITY_PROVENANCE");
      check(caps[key].raw !== undefined && caps[key].consumed !== undefined, "CAPABILITY_VALUES");
    }
    check(caps.pitcher.actorId === actors.pitcherId && caps.shortstop.actorId === actors.shortstopId
      && caps.receiver.actorId === actors.receiverId && caps.batter.actorId === "player", "CAPABILITY_ACTOR");
    check(Number.isFinite(caps.pitcher.raw) && Number.isFinite(caps.pitcher.consumed)
      && caps.pitcher.scale === "roster1..10_x2_clamp1..20", "PITCHER_CONTROL_SOURCE");
    for (const key of ["shortstop","receiver"]) for (const skill of ["reaction","range","fielding","catching","arm","throwing","mobility"])
      check(Number.isFinite(caps[key].consumed[skill]), "MISSING_" + key + "_" + skill);
    for (const skill of ["batting","observe","ballSense","baseballIQ","power","speed"])
      check(Number.isFinite(caps.batter.consumed[skill]), "MISSING_BATTER_" + skill);
    check(caps.assignment?.length === 9 && new Set(caps.assignment.map(a=>a.id)).size === 9, "ASSIGNMENT");
    for (const [position,key] of [["P","pitcherId"],["SS","shortstopId"],["1B","receiverId"]])
      check(caps.assignment.filter(a=>a.position===position && a.id===actors[key]).length===1, "POSITION_BINDING");
    if (policy === RECOVERY_POLICY) {
      validateRecoverySampling(context.admission.recoverySamples);
      check(same(context.admission.capabilities,caps), "RECOVERY_LOCKED_CAPABILITIES");
    }
    return true;
  }
  function validateRecoverySampling(samples) {
    const order = ["direction","displacement","contact","approach","acquire"];
    check(samples?.version === "s2-recovery-samples-v1" && samples.authority === "preAdmissionControlledRecoverySamples"
      && same(samples.order,order) && Object.keys(samples).sort().join() === "authority,order,values,version"
      && Object.keys(samples.values || {}).sort().join() === [...order].sort().join()
      && order.every(k => typeof samples.values[k] === "number" && Number.isFinite(samples.values[k]) && samples.values[k] >= 0 && samples.values[k] < 1), "RECOVERY_SAMPLING");
    return true;
  }
  function validatePhysical(context, truth) {
    validateContext(context);
    check(truth?.identity === context.physicalId && truth.ballType === "groundBall", "PHYSICAL_ID");
    check(truth.executionEvidence?.actualPitch?.pitchId === context.pitchId
      && truth.executionEvidence.actualPitch.pitcherId === context.capabilities.actors.pitcherId, "PITCH_ID");
    return true;
  }
  function validateBefore(context, current) {
    validateContext(context);
    for (const key of ["matchId","paId","batterId","battingSlot","offenseTeam","defenseTeam","inning","half","coveragePolicy","admission"])
      check(same(context[key],current[key]), "STALE_" + key);
    check(same(context.before,current.before), "STALE_BEFORE");
    check(same(context.capabilities,current.capabilities), "STALE_CAPABILITY_OR_ASSIGNMENT");
    return true;
  }
  function validateCandidate(candidate, context, truth) {
    validatePhysical(context,truth);
    const safe = candidate?.result === "single" && context.coveragePolicy === SAFE_FIRST_POLICY;
    check(candidate?.version === VERSION && candidate.closed === true && (candidate.result === "out" || safe), "UNCLOSED_CANDIDATE");
    check(same(candidate.context,context) && candidate.physicalId === truth.identity, "CANDIDATE_IDENTITY");
    const { reach, secure, thrown, received, timing, firstLeg, force, settlement, actionFacts, scorerFacts, defensiveAttribution } = candidate;
    const actors=context.capabilities.actors;
    check(reach?.physicalIdentity === truth.identity && reach.defenderId === actors.shortstopId && reach.reached
      && secure?.physicalIdentity === truth.identity && secure.defenderId === actors.shortstopId && secure.secured, "FIELD_FACTS");
    check(thrown?.throwerId === actors.shortstopId && thrown.receiverId === actors.receiverId && thrown.targetRunnerId === "player"
      && thrown.targetBase === "first" && thrown.throwAttempted && thrown.throwQuality !== "offline", "THROW_FACTS");
    check(received?.throwIdentity === thrown.identity && received.physicalIdentity === truth.identity
      && received.receiverId === actors.receiverId && received.ready && received.secured && received.status === "completed", "RECEIVE_FACTS");
    check(timing?.throwIdentity === thrown.identity && timing.targetRunnerId === "player" && timing.contestAvailable
      && (safe ? timing.timingMargin < 0 : timing.timingMargin > 0) && timing.receiverCompletion?.atBase === true, "TIMING_FACTS");
    check(firstLeg?.outRecorded === !safe && firstLeg.runnerResult === (safe ? "safe" : "out")
      && !firstLeg.continuation.pendingRunners?.length && !firstLeg.continuation.inTransitRunners?.length
      && !/Pending|Recovery|heldBall/.test(firstLeg.continuation.status), "UNRESOLVED_FIRST_LEG");
    check(safe ? force?.outsCreated === 0 && same(force.outRunnerIds,[]) && same(force.retirements,[])
      && same(force.runnersAfter,[context.batterId,null,null]) && same(force.runnersAfter,firstLeg.baseChanges)
      && force.runnerChanges?.length === 1 && force.runnerChanges[0].runnerId === context.batterId
      && force.runnerChanges[0].from === "batter" && force.runnerChanges[0].to === 1
      : force?.outsCreated === 1 && force.outRunnerIds?.length === 1 && force.outRunnerIds[0] === "player"
      && force.retirements?.length === 1 && force.retirements[0].outType === "batterRunnerBeforeFirst"
      && force.retirements[0].targetBase === "first" && force.retirements[0].sequence === 1, "FORCE_RETIREMENT");
    check(settlement?.settlementApplied === false && same(settlement.before,context.before)
      && settlement.outsBefore === context.before.outs && settlement.outsAfter === context.before.outs + (safe ? 0 : 1)
      && settlement.thirdOut?.settlementReady && (safe ? same(settlement.baseChanges,[context.batterId,null,null]) : !settlement.baseChanges.some(Boolean)) && !settlement.runChanges.length
      && same(settlement.thirdOut.basesAfter,settlement.baseChanges), "SETTLEMENT_FACTS");
    check(actionFacts?.physicalIdentity === truth.identity && actionFacts.actions.length === 4
      && same(actionFacts.actions.map(a=>a.type),["field","throw","receive","baseTouch"])
      && actionFacts.actions.every(a=>a.status==="completed"), "ACTION_CLOSURE");
    check(scorerFacts?.physicalIdentity === truth.identity && !scorerFacts.contests.length && !scorerFacts.decisions.length, "SCORER_FACTS");
    check(same(scorerFacts,Decision.resolveScorerEligibility({actionFacts,retirements:force.retirements,contests:[]})), "SCORER_PROJECTION");
    check(same(defensiveAttribution,Decision.projectDefensiveAttribution(actionFacts,force.retirements,scorerFacts)), "ACTOR_ATTRIBUTION");
    if (safe) {
      const classification = Decision.resolveBatterReachClassification({ ...candidate, physicalTruth:truth });
      check(classification.status === "supported" && same(candidate.batterReachClassification,classification), "BATTER_REACH_SCORER_PROOF");
      check(defensiveAttribution.actors.every(a=>a.PO===0 && a.A===0 && a.E===0), "SAFE_DEFENSE_CREDIT");
    } else check(!candidate.batterReachClassification, "OUT_WITH_REACH_CLASSIFICATION");
    return true;
  }
  function validateRecoveryFacts(facts, context, truth, resolveThirdOut) {
    validatePhysical(context,truth);
    check(Object.keys(facts || {}).every(k => ["version","closed","reason","physicalId","ballInput","ballState","recoveryInput","recoveryAction","timingArgs","timing","runnerContinuation"].includes(k)), "RECOVERY_UNDECLARED_OUTPUT");
    check(context.coveragePolicy === RECOVERY_POLICY && facts?.version === VERSION && facts.physicalId === truth.identity && facts.closed === false && facts.result === undefined, "RECOVERY_UNCOMMITTED_ONLY");
    const Reach = globalThis.DefensiveReachSecureFoundation || (typeof require === "function" ? require("../defensive-reach-secure-foundation.js") : null);
    const Runner = globalThis.DefensiveRunnerThrowSettlementFoundation || (typeof require === "function" ? require("../defensive-runner-throw-settlement-foundation.js") : null);
    check(same(facts.ballInput.context,context) && same(facts.ballInput.physicalTruth,truth), "RECOVERY_IDENTITY");
    check(facts.ballState.status === "supported" && same(Decision.resolvePostDeliveryBallState(facts.ballInput),facts.ballState), "RECOVERY_BALL_FACTS");
    check(same(facts.recoveryInput.ballInput,facts.ballInput) && same(facts.recoveryInput.ballState,facts.ballState)
      && same(Reach.resolveRecoveryAction(facts.recoveryInput),facts.recoveryAction), "RECOVERY_ACTION_FACTS");
    const continuation = Runner.resolveRecoveryContinuation({ ballInput:facts.ballInput, ballState:facts.ballState,
      recoveryInput:facts.recoveryInput, recoveryAction:facts.recoveryAction, timingArgs:facts.timingArgs, timing:facts.timing, resolveThirdOut });
    check(["closed","pending"].includes(continuation.status) && same(continuation,facts.runnerContinuation), "RECOVERY_RUNNER_FACTS");
    check(facts.reason === (continuation.closed ? "RECOVERY_SCORER_CLASSIFICATION_REQUIRED" : continuation.reason), "RECOVERY_REASON");
    return true;
  }
  return freeze({ VERSION, OUT_ONLY_POLICY, SAFE_FIRST_POLICY, RECOVERY_POLICY, coveragePolicy, check, freeze, same, copy, validateContext, validatePhysical, validateBefore, validateCandidate, validateRecoverySampling, validateRecoveryFacts });
});

