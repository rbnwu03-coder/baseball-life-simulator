(function(root,factory) {
  const dep=(name,path)=>root[name]||(typeof module==="object"&&module.exports?require(path):null);
  const api=factory(dep("MatchVNextExecutionContract","./contracts/match-vnext-execution-v0.1.cjs"),
    dep("DefensiveOpportunityFoundation","./defensive-opportunity-foundation.js"),dep("DefensiveReachSecureFoundation","./defensive-reach-secure-foundation.js"),
    dep("BattedBallGroundDefense","./batted-ball-ground-defense.js"),dep("DefensiveDecisionThrowFoundation","./defensive-decision-throw-foundation.js"),
    dep("DefensiveRunnerThrowSettlementFoundation","./defensive-runner-throw-settlement-foundation.js"),dep("ForceAdvancement","./force-advancement.js"));
  root.MatchVNextSameBallExecutionAdapter=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(C,Opportunity,Reach,Ground,Decision,Runner,Force) {
  "use strict";
  function execute({context,physicalTruth,samples,resolveThirdOut}={}) {
    C.validatePhysical(context,physicalTruth);
    C.check(typeof resolveThirdOut==="function","CANONICAL_THIRD_OUT_REQUIRED");
    for(const key of ["reach","secure","strength","accuracy","receive"])
      C.check(typeof samples?.[key]==="number"&&samples[key]>=0&&samples[key]<1,"DECLARED_SAMPLE_"+key);
    const inputSnapshot=C.canonical?C.canonical(context):JSON.stringify(context);
    const caps=context.capabilities,activeRoster=context.activeRoster;
    const opportunity=Opportunity.resolveDefensiveOpportunity({physicalTruth,activeRoster,topologyVersion:Opportunity.FIRST_BASE_GROUND_TOPOLOGY_VERSION});
    C.check(opportunity.supported&&opportunity.primaryPosition==="SS"&&opportunity.primaryDefenderId===caps.actors.shortstopId,"SS_RESPONSIBILITY");
    const base={physicalTruth,opportunity,activeRoster,capabilities:caps.shortstop.consumed};
    const reach=Reach.resolveReach({...base,roll:samples.reach});
    const secure=Reach.resolveSecure({...base,reachResult:reach,roll:samples.secure});
    if(!reach.reached||!secure.secured)return C.freeze({closed:false,reason:"FIELD_RECOVERY_REQUIRED",physicalId:physicalTruth.identity,reach,secure});
    const ground=Ground.buildGroundBallDefensiveOpportunity({identity:physicalTruth.identity,physicalTruth,
      runners:context.before.runners,outs:context.before.outs,batterRunner:{runnerId:"player",speed:caps.batter.consumed.speed,startQuality:"normalStart"},
      defenderContext:{playerPosition:"游擊手",defensiveOpportunity:opportunity,reachAccess:Reach.projectAccess(reach)}});
    C.check(ground?.supported,"GROUND_HANDOFF");
    const input={...base,reachResult:reach,secureResult:secure,runners:context.before.runners,outs:context.before.outs,
      inning:context.inning,half:context.half,scores:context.before.scores,batterRunnerId:"player",
      forceChain:ground.forceChain,runnerStates:[],runnerPhysicalStates:ground.runnerPhysicalStates};
    const decision=Decision.buildDecisionOpportunity(input);
    const selection=Decision.selectDefensiveRoute(decision,"secureFirstBaseOut",input);
    const thrown=Decision.resolveThrow({input,opportunity:decision,selection,capabilities:caps.shortstop.consumed,
      rolls:{strength:samples.strength,accuracy:samples.accuracy},transferState:"ready"});
    const received=Decision.resolveIncomingReceive({playIdentity:physicalTruth.identity,physicalIdentity:physicalTruth.identity,
      throwResolution:thrown,receiver:{id:caps.actors.receiverId,position:"1B"},capabilities:caps.receiver.consumed,sample:samples.receive});
    if(!received.ready||!received.secured) {
      if(context.coveragePolicy!==C.RECOVERY_POLICY)return C.freeze({closed:false,reason:"RECEIVER_RECOVERY_REQUIRED",physicalId:physicalTruth.identity,reach,secure,thrown,received});
      const timeBase={version:"s2-recovery-clock-v1",origin:"samePlayLaunch",unit:"coarseRelativeTime",matchId:context.matchId,paId:context.paId,pitchId:context.pitchId,physicalId:physicalTruth.identity};
      const ballInput={context,physicalTruth,input,decision,selection,thrown,received,originalSamples:samples,timeBase};
      const ballState=Decision.resolvePostDeliveryBallState(ballInput);
      if(ballState.status!=="supported")return C.freeze({closed:false,reason:"RECOVERY_BALL_"+ballState.reason,ballInput,ballState});
      const recoveryInput={ballInput,ballState,activeRoster,capabilities:caps.receiver.consumed,
        access:{actorId:received.receiverId,position:"1B",station:"firstReceiverTarget",sourceReceiveId:received.identity},timeBase};
      const recoveryAction=Reach.resolveRecoveryAction(recoveryInput);
      if(!["completed","failed"].includes(recoveryAction.status))return C.freeze({closed:false,reason:"RECOVERY_ACTION_"+recoveryAction.reason,ballInput,ballState,recoveryInput,recoveryAction});
      const receiverState={receiverId:received.receiverId,ready:received.ready&&received.secured,atBase:true,receiveDelay:received.receiveDelay,
        physicalIdentity:received.physicalIdentity,receiveIdentity:received.identity};
      const timingArgs={input:{...input,receiverState},opportunity:decision,selection,throwResolution:thrown,
        runnerState:ground.runnerPhysicalStates.find(r=>r.runnerId==="player"),receiverState};
      const timing=Runner.resolveTiming(timingArgs);
      const runnerContinuation=Runner.resolveRecoveryContinuation({ballInput,ballState,recoveryInput,recoveryAction,timingArgs,timing,resolveThirdOut});
      const facts={version:C.VERSION,closed:false,reason:runnerContinuation.closed?"RECOVERY_SCORER_CLASSIFICATION_REQUIRED":runnerContinuation.reason,
        physicalId:physicalTruth.identity,ballInput,ballState,recoveryInput,recoveryAction,timingArgs,timing,runnerContinuation};
      if(["closed","pending"].includes(runnerContinuation.status))C.validateRecoveryFacts(facts,context,physicalTruth,resolveThirdOut);
      C.check(JSON.stringify(context)===inputSnapshot,"INPUT_MUTATION");
      return C.freeze(facts);
    }
    const receiverState={receiverId:received.receiverId,ready:received.ready&&received.secured,atBase:true,receiveDelay:received.receiveDelay,
      physicalIdentity:received.physicalIdentity,receiveIdentity:received.identity};
    input.receiverState=receiverState;
    const args={input,opportunity:decision,selection,throwResolution:thrown,runnerState:ground.runnerPhysicalStates.find(r=>r.runnerId==="player"),
      receiverState,resolveThirdOut};
    const timing=Runner.resolveTiming(args),firstLeg=Runner.deriveSettlement({...args,timing});
    const safeFirst=context.coveragePolicy===C.SAFE_FIRST_POLICY&&firstLeg.runnerResult==="safe";
    if((!firstLeg.outRecorded&&!safeFirst)||firstLeg.continuation.pendingRunners?.length||firstLeg.continuation.inTransitRunners?.length
      ||firstLeg.continuation.status==="liveBallRecoveryRequired")return C.freeze({closed:false,reason:"LIVE_BALL_CLOSURE_REQUIRED",physicalId:physicalTruth.identity,reach,secure,thrown,received,timing,firstLeg});
    const force=Force.settleForceAdvancement({forceChain:ground.forceChain,movementIntents:Force.buildMovementIntents(ground.forceChain),
      retirements:firstLeg.orderedRetirements});
    const thirdOut=resolveThirdOut({outsBefore:context.before.outs,outsCreated:force.outsCreated,runnersBefore:context.before.runners,
      proposedRunnersAfter:force.runnersAfter,scoringAttempts:[],orderedRetirements:force.retirements});
    const resolution={outsCreated:force.outsCreated,runnersAfter:force.runnersAfter,scoringRunnerIds:force.scoringRunnerIds,
      runnerChanges:force.runnerChanges,runnerSettlement:force};
    const settlement=Runner.projectInfieldSettlement({identity:physicalTruth.identity,before:context.before,resolution,thirdOut});
    const actionId=n=>physicalTruth.identity+"|action|"+n;
    const actionFacts=Decision.createActionFacts({playIdentity:physicalTruth.identity,physicalIdentity:physicalTruth.identity,
      sourceAuthority:"sameBallActualNPCExecution",actions:[
        {type:"field",actorId:caps.actors.shortstopId,actorPosition:"SS",status:"completed",runnerId:"player",targetBase:"first",provenance:{reachId:reach.identity,secureId:secure.identity}},
        {type:"throw",actorId:caps.actors.shortstopId,actorPosition:"SS",status:"completed",receiverId:caps.actors.receiverId,targetBase:"first",runnerId:"player",dependsOn:[actionId(1)],provenance:{throwId:thrown.identity}},
        {type:"receive",actorId:caps.actors.receiverId,actorPosition:"1B",status:"completed",runnerId:"player",targetBase:"first",dependsOn:[actionId(2)],provenance:{receiveId:received.identity}},
        {type:"baseTouch",actorId:caps.actors.receiverId,actorPosition:"1B",status:"completed",runnerId:"player",targetBase:"first",dependsOn:[actionId(3)],provenance:{timingId:timing.identity}}
      ]});
    const scorerFacts=Decision.resolveScorerEligibility({actionFacts,retirements:force.retirements,contests:[]});
    const defensiveAttribution=Decision.projectDefensiveAttribution(actionFacts,force.retirements,scorerFacts);
    const batterReachClassification=safeFirst?Decision.resolveBatterReachClassification({context,physicalTruth,opportunity,reach,secure,ground,
      decision,selection,thrown,received,timing,firstLeg,actionFacts,scorerFacts}):null;
    if(safeFirst&&batterReachClassification.status!=="supported")return C.freeze({closed:false,reason:"SCORER_"+batterReachClassification.reason,
      physicalId:physicalTruth.identity,reach,secure,thrown,received,timing,firstLeg,batterReachClassification});
    const candidate={version:C.VERSION,authority:"matchVNextSameBallExecution",closed:true,result:safeFirst?batterReachClassification.compatibleOffensiveResult:"out",physicalId:physicalTruth.identity,
      context:C.copy(context),samples:C.copy(samples),opportunity,reach,secure,ground,decision,selection,thrown,received,timing,firstLeg,force,
      settlement,actionFacts,scorerFacts,defensiveAttribution,...(safeFirst?{batterReachClassification}:{})};
    C.check(JSON.stringify(context)===inputSnapshot,"INPUT_MUTATION");
    C.validateCandidate(candidate,context,physicalTruth);
    return C.freeze(candidate);
  }
  return C.freeze({VERSION:C.VERSION,execute});
});

