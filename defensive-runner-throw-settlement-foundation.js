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
    if(!Number.isFinite(current.speed)||!["preparedStart","normalStart","lateStart","brokenStart"].includes(current.startQuality))fail("missing runner arrival inputs");
    const profile=Runner.deriveArrivalProfile(current.speed,current.startQuality);
    const start={preparedStart:-1,normalStart:0,lateStart:1,brokenStart:2}[current.startQuality];
    const progress={early:0,midway:1.5,late:3,nearArrival:4}[current.advancementProgress||"early"];
    if(progress===undefined)fail("unknown runner progress");
    const runnerArrival={...clone(current),profile,relativeArrival:10-Math.max(0,Math.min(20,current.speed))*0.45+start-progress};
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
  function completeSettlement({identity,timing,routeId,targetRunnerId,targetBase,playType,runnerResult,before,
    runnersAfter,outIds,scoringAttempts,runnerMovement,forceBefore,continuation,resolveThirdOut,scope="genericFirstLeg"}){
    if(typeof resolveThirdOut!=="function")fail("canonical third-out authority required");
    const thirdOutType=outIds.length?(playType==="batterRunner"?"batterRunnerBeforeFirst":playType==="force"?"force":"nonForceTag"):"none";
    const thirdOut=resolveThirdOut({outsBefore:before.outs,outsCreated:outIds.length,runnersBefore:before.runners,
      proposedRunnersAfter:runnersAfter,scoringAttempts,thirdOutType});
    return freeze({version:VERSION,identity,timingIdentity:timing.identity,routeId,targetRunnerId,targetBase,playType,runnerResult,
      outRecorded:outIds.includes(targetRunnerId),outRunnerIds:outIds,outsBefore:before.outs,outsAfter:thirdOut.outsAfter,
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
      authority:"existingDetailedSettlement+canonicalThirdOutIntegrity"});
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
  return freeze({VERSION,resolveTiming,deriveSettlement,projectExistingTiming,projectExistingSettlement,projectTagUpTiming,projectTagUpSettlement,validateBefore,validateProjectedTiming});
});
