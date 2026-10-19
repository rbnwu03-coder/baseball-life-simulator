(function(root,factory){
  const dep=(name,path)=>root[name]||(typeof module==="object"&&module.exports&&typeof require==="function"?require(path):null);
  const api=factory(dep("DefensiveDecisionThrowFoundation","./defensive-decision-throw-foundation.js"),
    dep("ForceAdvancement","./force-advancement.js"),dep("OffensiveBuntDefensiveHandoff","./offensive-bunt-defensive-handoff.js"));
  root.DefensiveRunnerThrowSettlementFoundation=api;if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Decision,Force,Runner){
  "use strict";
  const VERSION="defensive-runner-throw-settlement-v1";
  const clone=value=>JSON.parse(JSON.stringify(value));
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function freeze(value){if(!value||typeof value!=="object"||Object.isFrozen(value))return value;Object.values(value).forEach(freeze);return Object.freeze(value);}
  function fail(reason){throw new Error(`Defensive timing / settlement integrity failed: ${reason}`);}
  const classify=margin=>margin>0.5?"defenseClearlyAhead":margin< -0.5?"runnerClearlyAhead":"closePlay";
  // One coarse runner-arrival contract for throws, self touches, and relay legs.
  function deriveRunnerArrival(current){
    if(!current||!Number.isFinite(current.speed)||!["preparedStart","normalStart","lateStart","brokenStart"].includes(current.startQuality))fail("missing runner arrival inputs");
    const start={preparedStart:-1,normalStart:0,lateStart:1,brokenStart:2}[current.startQuality];
    const progress={early:0,midway:1.5,late:3,nearArrival:4}[current.advancementProgress||"early"];
    if(progress===undefined)fail("unknown runner progress");
    return freeze({...clone(current),profile:Runner.deriveArrivalProfile(current.speed,current.startQuality),
      relativeArrival:10-Math.max(0,Math.min(20,current.speed))*0.45+start-progress});
  }
  function resolveTiming(args){
    const {input,opportunity,selection,throwResolution:thrown,runnerState,receiverState}=args;
    Decision.validateSelection(selection,opportunity,input);
    if(!thrown||thrown.identity!==`${selection.identity}|throw-v1`||thrown.decisionIdentity!==selection.identity
      ||thrown.throwerId!==selection.defenderId||thrown.throwerPosition!==selection.position
      ||["routeId","targetRunnerId","targetBase","receiverId","receiverPosition"].some(key=>thrown[key]!==selection.route[key]))fail("stale throw / receiver / target");
    const base={version:VERSION,identity:`${thrown.identity}|timing-v1`,decisionIdentity:selection.identity,throwIdentity:thrown.identity,
      targetRunnerId:thrown.targetRunnerId,targetBase:thrown.targetBase,receiverId:thrown.receiverId,
      authority:"resolvedThrow+existingRunnerPhysicalState+receiverReadiness",variationEvidence:{consumed:false}};
    if(selection.route.action==="holdBall"){
      if(thrown.throwAttempted!==false)fail("hold includes throw");
      return freeze({...base,contestAvailable:false,timingClassification:"noContest",timingMargin:null,
        runnerArrival:null,ballArrival:null,receiverCompletion:null,reason:"heldBall"});
    }
    const current=(input.runnerPhysicalStates||[]).find(r=>r.runnerId===thrown.targetRunnerId);
    if(!current||!same(current,runnerState)||current.targetBase!==thrown.targetBase
      ||(current.originBase==="batter"?input.batterRunnerId!==current.runnerId:input.runners[Number(current.originBase)-1]!==current.runnerId))fail("stale runner physical state");
    const forced=Force.getForcedMovement(opportunity.context.forceChain,current.runnerId);
    if(!forced&&!Decision.isAdvancingTo(current,thrown.targetBase))fail("runner not in contest");
    if(!receiverState||receiverState.receiverId!==thrown.receiverId||!same(receiverState,input.receiverState))fail("stale receiver completion");
    const runnerArrival=deriveRunnerArrival(current);
    const noContest=!thrown.throwAttempted||thrown.throwQuality==="offline"||receiverState.ready!==true;
    const receiveDelay=Number(receiverState.receiveDelay??0),tagDelay=Number(receiverState.tagDelay??1);
    if(!Number.isFinite(receiveDelay)||receiveDelay<0||!Number.isFinite(tagDelay)||tagDelay<0)fail("invalid receiver delay");
    if(noContest)return freeze({...base,contestAvailable:false,timingClassification:"noContest",timingMargin:null,
      runnerArrival,ballArrival:{quality:thrown.throwQuality},receiverCompletion:{...clone(receiverState),status:"unavailableReceive"},reason:"unusableThrowOrReceiver"});
    const qualityDelay={onTarget:0,challengingReceive:1,lateWeakThrow:3}[thrown.throwQuality];
    if(qualityDelay===undefined)fail("generic timing cannot reinterpret legacy composite throw");
    const distanceDelay={short:0,medium:1,long:2}[thrown.throwDemand?.distanceClass];
    if(distanceDelay===undefined)fail("missing throw distance");
    const ballTime=4+distanceDelay+qualityDelay+(thrown.releaseQuality==="delayedRelease"?1:0);
    const completionTime=ballTime+receiveDelay;
    const margin=Math.round((runnerArrival.relativeArrival-completionTime)*1000)/1000;
    return freeze({...base,contestAvailable:true,timingClassification:classify(margin),timingMargin:margin,runnerArrival,
      ballArrival:{relativeArrival:ballTime,quality:thrown.throwQuality,releaseQuality:thrown.releaseQuality,distanceClass:thrown.throwDemand.distanceClass},
      receiverCompletion:{...clone(receiverState),status:thrown.throwQuality==="challengingReceive"?"challengedReceive":"readyReceive",
        relativeCompletion:completionTime,tagCompletion:completionTime+tagDelay},reason:"physicalArrivalComparison"});
  }
  function resolveBaseTouchTiming({input,opportunity,selection,baseTouchResolution,runnerState}){
    const touch=Decision.resolveBaseTouch({input,opportunity,selection});
    if(!same(touch,baseTouchResolution))fail("stale base-touch execution");
    const current=(input.runnerPhysicalStates||[]).find(r=>r.runnerId===selection.route.targetRunnerId);
    if(!current||!same(current,runnerState)||current.targetBase!==touch.targetBase
      ||(current.originBase==="batter"?input.batterRunnerId!==current.runnerId:input.runners[Number(current.originBase)-1]!==current.runnerId))fail("stale base-touch runner");
    const forced=Force.getForcedMovement(opportunity.context.forceChain,current.runnerId);
    if(!forced||forced.targetBase!==touch.targetBase)fail("non-force base touch");
    const runnerArrival=deriveRunnerArrival(current);
    const margin=Math.round((runnerArrival.relativeArrival-touch.relativeCompletion)*1000)/1000;
    return freeze({version:VERSION,identity:`${touch.identity}|timing-v1`,decisionIdentity:selection.identity,
      baseTouchIdentity:touch.identity,throwIdentity:null,targetRunnerId:current.runnerId,targetBase:touch.targetBase,receiverId:touch.actorId,
      contestAvailable:touch.possession,timingClassification:classify(margin),timingMargin:margin,
      runnerArrival,
      ballArrival:null,receiverCompletion:{receiverId:touch.actorId,atBase:true,status:"baseTouch",relativeCompletion:touch.relativeCompletion},
      reason:"possessionAndBaseTouchArrivalComparison",authority:"baseTouch+existingRunnerPhysicalState",variationEvidence:{consumed:false}});
  }
  function completeSettlement({identity,timing,routeId,targetRunnerId,targetBase,playType,runnerResult,before,
    runnersAfter,outIds,scoringAttempts,runnerMovement,forceBefore,continuation,resolveThirdOut,scope="genericFirstLeg"}){
    if(typeof resolveThirdOut!=="function")fail("canonical third-out authority required");
    const thirdOutType=outIds.length?(playType==="batterRunner"?"batterRunnerBeforeFirst":playType==="force"?"force":"nonForceTag"):"none";
    const orderedRetirements=outIds.map((runnerId,index)=>({runnerId,targetBase,outType:thirdOutType,sequence:index+1,
      forceStateAtRetirement:{forceTargets:clone(forceBefore?.forceTargets||{})},
      isBatterRunner:playType==="batterRunner",beforeFirst:playType==="batterRunner"}));
    const thirdOut=resolveThirdOut({outsBefore:before.outs,outsCreated:outIds.length,runnersBefore:before.runners,
      proposedRunnersAfter:runnersAfter,scoringAttempts,thirdOutType,orderedRetirements});
    return freeze({version:VERSION,identity,timingIdentity:timing.identity,routeId,targetRunnerId,targetBase,playType,runnerResult,
      outRecorded:outIds.includes(targetRunnerId),outRunnerIds:outIds,orderedRetirements,outsBefore:before.outs,outsAfter:thirdOut.outsAfter,
      before:clone(before),baseChanges:clone(thirdOut.basesAfter),runChanges:clone(thirdOut.legalScoringRunnerIds),runnerMovement,
      forceStateBefore:forceBefore?clone(forceBefore):null,forceStateAfter:Force.deriveForceChainAfterRetirements(forceBefore,outIds),
      ballRemainsLive:!thirdOut.halfInningEnded,continuation:thirdOut.halfInningEnded?{status:"inningEnded"}:continuation,
      thirdOut:clone(thirdOut),settlementApplied:false,scope,authority:"baseballRules+canonicalThirdOutIntegrity"});
  }
  function deriveSettlement(args){
    const {timing,input,opportunity,selection,resolveThirdOut}=args;
    if(!same(timing,resolveTiming(args)))fail("stale timing facts");
    const route=selection.route,hold=route.action==="holdBall",runner=timing.runnerArrival;
    const force=Force.getForcedMovement(opportunity.context.forceChain,route.targetRunnerId);
    const forced=Boolean(force&&force.targetBase===route.targetBase);
    if(!hold&&((route.forceType==="force"||route.forceType==="batterRunner")!==forced))fail("stale force semantics");
    const playType=hold?"hold":route.forceType==="batterRunner"?"batterRunner":forced?"force":"tag";
    const receiver=timing.receiverCompletion;
    const ahead=timing.contestAvailable&&timing.timingMargin>0; // Ties do not establish defense before arrival.
    const out=Boolean(ahead&&(playType==="tag"?receiver.tagAvailable===true&&receiver.tagCompletion<runner.relativeArrival:receiver.atBase===true));
    const runnersAfter=input.runners.slice(),movements=[],outIds=out?[route.targetRunnerId]:[],inTransit=[];
    const attempts=clone(args.scoringAttempts||[]);
    const known=new Set([...input.runners.filter(Boolean),input.batterRunnerId].filter(Boolean));
    if(new Set(attempts.map(a=>a.runnerId)).size!==attempts.length||attempts.some(a=>!known.has(a.runnerId)||a.runnerId===route.targetRunnerId))fail("invalid other scoring attempt");
    const contest=timing.contestAvailable&&!hold;
    if(contest){
      const origin=runnersAfter.indexOf(route.targetRunnerId);if(origin>=0)runnersAfter[origin]=null;
      if(!out&&route.targetBase==="home")attempts.push({runnerId:route.targetRunnerId,timing:"beforeThirdOut"});
      else if(!out){
        const index=["first","second","third"].indexOf(route.targetBase),occupant=runnersAfter[index];
        if(index<0)fail("invalid destination");
        if(occupant){
          const moving=Force.getForcedMovement(opportunity.context.forceChain,occupant);
          if(!moving)fail("destination occupied by a non-forced runner");
          inTransit.push(clone(moving));
        }
        runnersAfter[index]=route.targetRunnerId;
      }
      movements.push({runnerId:route.targetRunnerId,from:runner.originBase,to:out?"out":route.targetBase});
    }
    for(const attempt of attempts){const index=runnersAfter.indexOf(attempt.runnerId);if(index>=0)runnersAfter[index]=null;}
    const dp=route.action==="initiateDoublePlay";
    const continuation={status:hold?"heldBallAwaitRunnerContinuation":!contest?"liveBallRecoveryRequired":dp&&out?"secondLegPending":dp?"reassessAfterSafeFirstLeg":"liveBallContinuation",
      targetBase:dp&&out?"first":null,inTransitRunners:inTransit,
      pendingRunners:(input.runnerPhysicalStates||[]).filter(r=>r.runnerId!==route.targetRunnerId||!contest).map(clone)};
    return completeSettlement({identity:`${timing.identity}|settlement-v1`,timing,routeId:route.routeId,targetRunnerId:route.targetRunnerId,targetBase:route.targetBase,
      playType,runnerResult:hold?"held":!contest?"unresolved":out?"out":"safe",before:{outs:input.outs,runners:input.runners,scores:input.scores||null},
      runnersAfter,outIds,scoringAttempts:attempts,runnerMovement:movements,forceBefore:opportunity.context.forceChain,continuation,resolveThirdOut});
  }
  function projectExistingTiming({stage,runnerState,windowState,receiverFact,tagFact=null}){
    const selected=stage.activeSelection||stage.selection,thrown=stage.throwResolution;
    const available=Boolean(thrown?.throwAttempted&&thrown.throwQuality==="legacyUsableDelivery"&&receiverFact==="completed");
    return freeze({version:VERSION,identity:`${selected?.identity||stage.opportunity.identity}|legacy-timing-v1`,
      decisionIdentity:selected?.identity||null,throwIdentity:thrown?.identity||null,targetRunnerId:selected?.route.targetRunnerId||null,
      targetBase:selected?.route.targetBase||null,receiverId:selected?.route.receiverId||null,runnerArrival:runnerState?clone(runnerState):null,
      ballArrival:{windowState},receiverCompletion:{fact:receiverFact,tagFact},timingMargin:null,contestAvailable:available,
      timingClassification:!available?"noContest":windowState==="expired"?"runnerClearlyAhead":windowState==="narrow"?"closePlay":"defenseClearlyAhead",
      authority:"existingDetailedWindowAndReceiverProjection",variationEvidence:{consumed:false}});
  }
  function projectExistingSettlement({timing,stage,before,resolution,thirdOut}){
    const selection=stage.activeSelection||stage.selection,target=selection?.route.targetRunnerId||null;
    const movement=(resolution.runnerChanges||[]).find(r=>r.runnerId===target);
    const outs=(resolution.runnerChanges||[]).filter(r=>r.to==="out").map(r=>r.runnerId);
    const force=stage.opportunity.context.forceChain;
    return freeze({version:VERSION,identity:`${timing.identity}|settlement-v1`,timingIdentity:timing.identity,
      routeId:selection?.route.routeId||stage.preControlIntent,targetRunnerId:target,targetBase:selection?.route.targetBase||null,
      playType:selection?.route.forceType||"uncontrolled",runnerResult:movement?.to==="out"?"out":movement?"safe":"unresolved",
      outRecorded:outs.includes(target),outRunnerIds:outs,outsBefore:before.outs,outsAfter:thirdOut.outsAfter,before:clone(before),
      baseChanges:clone(thirdOut.basesAfter),runChanges:clone(thirdOut.legalScoringRunnerIds),runnerMovement:clone(resolution.runnerChanges||[]),
      forceStateBefore:clone(force),forceStateAfter:Force.deriveForceChainAfterRetirements(force,outs),
      continuation:thirdOut.halfInningEnded?{status:"inningEnded"}:clone(resolution.continuationState||{status:"existingVerticalComplete"}),
      ballRemainsLive:!thirdOut.halfInningEnded,thirdOut:clone(thirdOut),settlementApplied:false,scope:"existingDetailedVertical",
      runnerSettlement:clone(resolution.runnerSettlement||null),
      authority:"existingDetailedSettlement+canonicalThirdOutIntegrity"});
  }
  function projectInfieldSettlement({identity,before,resolution,thirdOut}){
    const facts=resolution.runnerSettlement;
    if(!facts||facts.outsCreated!==resolution.outsCreated)fail("missing canonical infield settlement");
    if(!same(facts.initialForceChain.sourceBaseState,before.runners)
      ||!same(facts.runnersAfter,resolution.runnersAfter)||!same(facts.scoringRunnerIds,resolution.scoringRunnerIds))fail("stale infield settlement facts");
    return freeze({version:VERSION,identity:`${identity}|settlement-v1`,before:clone(before),
      outsBefore:before.outs,outsAfter:thirdOut.outsAfter,outRunnerIds:clone(facts.outRunnerIds),
      baseChanges:clone(thirdOut.basesAfter),runChanges:clone(thirdOut.legalScoringRunnerIds),
      runnerMovement:clone(resolution.runnerChanges),runnerSettlement:clone(facts),
      forceStateBefore:clone(facts.initialForceChain),forceStateAfter:clone(facts.forceChainAfterRetirements),
      continuation:thirdOut.halfInningEnded?{status:"inningEnded"}:{status:"existingVerticalComplete",classifications:clone(facts.continuationClassifications)},
      thirdOut:clone(thirdOut),settlementApplied:false,authority:"canonicalForceSettlement+canonicalThirdOutIntegrity"});
  }
  function projectTagUpTiming(execution,context){
    const attempted=execution.runnerAdvanceChallenge.attempted;
    const margin=attempted?-execution.timingMargin:null;
    return freeze({version:VERSION,identity:`${execution.executionIdentity}|timing-v1`,decisionIdentity:execution.executionIdentity,
      throwIdentity:execution.executionIdentity,targetRunnerId:context.runnerContext.runnerId,targetBase:"home",
      receiverId:context.defensiveContext.receivingTarget.receiverId,runnerArrival:clone(execution.runnerAdvanceChallenge),
      ballArrival:clone(execution.throwChallenge),receiverCompletion:clone(execution.receivingChallenge),timingMargin:margin,
      contestAvailable:attempted,timingClassification:attempted?classify(margin):"noContest",
      authority:"existingTagUpExecutionProjection",variationEvidence:{consumed:false}});
  }
  function validateBefore(settlement,match){
    if(!settlement||settlement.version!==VERSION||!same(settlement.before.runners,match.runners)||settlement.outsBefore!==match.outs
      ||(settlement.before.scores&&!same(settlement.before.scores,match.scores)))fail("stale settlement base / outs / score");
  }
  function projectTagUpSettlement(execution,context,resolveThirdOut){
    const timing=projectTagUpTiming(execution,context);
    if(!same(execution.runnerThrowTiming,timing))fail("stale tag-up timing");
    const code=execution.physicalOutcome.code,runnerId=context.runnerContext.runnerId;
    if(!["heldThird","safeHome","taggedOutAtHome"].includes(code))fail("unsupported tag-up settlement");
    const runners=context.gameContext.bases.slice();
    if(runners[2]!==runnerId)fail("stale tag-up runner");
    if(code!=="heldThird")runners[2]=null;
    return completeSettlement({identity:`${timing.identity}|settlement-v1`,timing,routeId:execution.selectedRoute,
      targetRunnerId:runnerId,targetBase:"home",playType:"tag",runnerResult:code==="heldThird"?"held":code==="safeHome"?"safe":"out",
      before:{outs:context.gameContext.outsAfterCatch,runners:context.gameContext.bases,scores:context.gameContext.score},
      runnersAfter:runners,outIds:code==="taggedOutAtHome"?[runnerId]:[],scoringAttempts:code==="safeHome"?[{runnerId,timing:"beforeThirdOut"}]:[],
      runnerMovement:code==="heldThird"?[]:[{runnerId,from:3,to:code==="safeHome"?"home":"out"}],forceBefore:null,
      continuation:{status:"existingVerticalComplete"},resolveThirdOut,scope:"existingTagUpVertical"});
  }
  function validateProjectedTiming(timing,stage,runnerStates,resolution=null){
    const selection=stage.activeSelection||stage.selection,thrown=stage.throwResolution;
    if(timing.version!==VERSION||timing.identity!==`${selection?.identity||stage.opportunity.identity}|legacy-timing-v1`
      ||timing.decisionIdentity!==(selection?.identity||null)||timing.throwIdentity!==(thrown?.identity||null)
      ||timing.targetRunnerId!==(selection?.route.targetRunnerId||null)||timing.targetBase!==(selection?.route.targetBase||null)
      ||timing.receiverId!==(selection?.route.receiverId||null)
      ||!same(timing.runnerArrival,(runnerStates||[]).find(r=>r.runnerId===timing.targetRunnerId)||null))fail("stale projected timing");
    if(resolution){
      const route=selection?.route;
      const receiverFact=route?.routeId==="initiate463"?resolution.teammateLeg?.shortstopReceive
        :route?.routeId==="preventRunHome"&&!resolution.reassessed?resolution.teammateLeg?.catcherReceive:resolution.teammateLeg?.receiver;
      const expected=projectExistingTiming({stage,runnerState:timing.runnerArrival,windowState:resolution.firstLegTimingWindow?.state||"expired",
        receiverFact:receiverFact||"unavailable",tagFact:resolution.homeTagLeg?.arrivalComparison||null});
      if(!same(timing,expected))fail("stale projected timing facts");
    }
  }
  // S2-RECOVERY-001 additive API. Runner decisions are independent of H/E tokens.
  function resolveRecoveryContinuation(args = {}) {
    const reject=reason=>freeze({status:"unsupported",closed:false,reason});
    try {
      const {ballInput,ballState:ball,recoveryInput,recoveryAction:recovery,timingArgs,timing,resolveThirdOut}=args;
      if(Object.keys(args).some(k=>!["ballInput","ballState","recoveryInput","recoveryAction","timingArgs","timing","resolveThirdOut"].includes(k)))return reject("UNDECLARED_CONTINUATION_INPUT");
      const Reach=globalThis.DefensiveReachSecureFoundation||(typeof require==="function"?require("./defensive-reach-secure-foundation.js"):null);
      const freshBall=Decision.resolvePostDeliveryBallState(ballInput),freshRecovery=Reach.resolveRecoveryAction(recoveryInput);
      if(freshBall.status!=="supported"||!same(ball,freshBall)||!same(recoveryInput.ballInput,ballInput)
        ||!same(recoveryInput.ballState,ball)||!same(recovery,freshRecovery)||!["completed","failed"].includes(recovery.status))return reject("UNVERIFIED_RECOVERY_CHAIN");
      if(!same(ball.timeBase,recovery.timeBase)||recovery.startAt!==ball.occurredAt||recovery.completedAt<recovery.startAt)return reject("RECOVERY_TIME");
      const ctx=ballInput.context,current=timingArgs?.runnerState;
      if(Object.keys(timingArgs||{}).some(k=>!["input","opportunity","selection","throwResolution","runnerState","receiverState"].includes(k)))return reject("UNDECLARED_TIMING_INPUT");
      const receiverState={receiverId:ballInput.received.receiverId,ready:ballInput.received.ready&&ballInput.received.secured,atBase:true,receiveDelay:ballInput.received.receiveDelay,
        physicalIdentity:ballInput.received.physicalIdentity,receiveIdentity:ballInput.received.identity};
      if(!same(timingArgs.input,{...ballInput.input,receiverState})||!same(timingArgs.opportunity,ballInput.decision)
        ||!same(timingArgs.selection,ballInput.selection)||!same(timingArgs.throwResolution,ballInput.thrown)||!same(timingArgs.receiverState,receiverState)
        ||current?.runnerId!=="player"||current.originBase!=="batter"||current.targetBase!=="first"||current.startQuality!=="normalStart"
        ||current.speed!==ctx.capabilities.batter.consumed.speed||!Number.isFinite(current.speed)||current.speed<0||current.speed>20
        ||!same(timing,resolveTiming(timingArgs)))return reject("ORIGINAL_RUNNER_TIMING");
      const first=deriveRunnerArrival(current),second=deriveRunnerArrival({...current,originBase:"first",targetBase:"second",startQuality:"normalStart",advancementProgress:"early"});
      const r=n=>Math.round(n*1000)/1000,decisionAt=r(Math.max(first.relativeArrival,ball.occurredAt));
      const secondArrival=r(decisionAt+second.relativeArrival),attemptSecond=recovery.selection.forecastPossessionAt>secondArrival;
      const decision={policy:"clearLooseBallWindow-v1",at:decisionAt,status:decisionAt<=recovery.completedAt?"executed":"notReached",
        type:decisionAt>recovery.completedAt?null:attemptSecond?"attemptSecond":"holdFirst",observedBallId:ball.identity,
        forecastPossessionAt:recovery.selection.forecastPossessionAt,secondLegDuration:second.relativeArrival,secondArrivalIfAttempted:secondArrival,
        source:"originalRunnerArrivalPrimitive+prelockedConservativePolicy+visibleAccessForecast"};
      const attained=first.relativeArrival<=recovery.completedAt?[{runnerId:"player",base:"first",at:first.relativeArrival,sourceTimingId:timing.identity,reason:"unopposedOriginalFirstMovement"}]:[];
      const base={version:"s2-recovery-continuation-v1",identity:recovery.identity+"|runner-v1",sameBall:clone(ball.sameBall),phase:4,
        dependsOn:[ball.identity,recovery.identity,timing.identity],timeBase:clone(ball.timeBase),elapsed:recovery.completedAt,runnerId:"player",
        originalArrival:clone(first),attainedBases:attained,decision,
        progression:{originBase:attemptSecond?"first":"batter",targetBase:attemptSecond?"second":"first",elapsed:r(Math.max(0,recovery.completedAt-(attemptSecond?decisionAt:0))),
          duration:attemptSecond?second.relativeArrival:first.relativeArrival,completionFraction:r(Math.max(0,Math.min(1,(recovery.completedAt-(attemptSecond?decisionAt:0))/(attemptSecond?second.relativeArrival:first.relativeArrival))))},
        orderedRetirements:[],outsCreated:0,finalBase:null,finalBases:null,closed:false};
      if(recovery.status!=="completed")return freeze({...base,status:"pending",reason:"RECOVERY_FAILED"});
      if(attemptSecond)return freeze({...base,status:"pending",reason:"SECOND_ATTEMPT_REQUIRES_TERMINAL_EXECUTION"});
      if(!attained.length)return freeze({...base,status:"pending",reason:"FIRST_CONTEST_REQUIRES_TERMINAL_EXECUTION"});
      if(typeof resolveThirdOut!=="function")return reject("CANONICAL_CALLBACK_REQUIRED");
      const force=Force.settleForceAdvancement({forceChain:ballInput.input.forceChain,movementIntents:Force.buildMovementIntents(ballInput.input.forceChain),retirements:[]});
      const thirdOut=resolveThirdOut({outsBefore:ctx.before.outs,outsCreated:force.outsCreated,runnersBefore:ctx.before.runners,
        proposedRunnersAfter:force.runnersAfter,scoringAttempts:[],orderedRetirements:force.retirements});
      if(force.outsCreated!==0||!same(force.runnersAfter,["player",null,null])||!thirdOut.settlementReady)return reject("FORCE_CANONICAL_CLOSURE");
      return freeze({...base,status:"closed",closed:true,reason:"ATTAINED_FIRST_AND_DECLINED_EXTRA_RISK",finalBase:"first",finalBases:clone(force.runnersAfter),
        finalOuts:ctx.before.outs,force,thirdOut});
    } catch(error){return reject("INVALID_RUNNER_SOURCE:"+error.message);}
  }
  // End S2-RECOVERY-001 additive API.
  return freeze({VERSION,deriveRunnerArrival,resolveTiming,resolveBaseTouchTiming,deriveSettlement,projectExistingTiming,projectExistingSettlement,projectInfieldSettlement,projectTagUpTiming,projectTagUpSettlement,validateBefore,validateProjectedTiming,resolveRecoveryContinuation});
});
