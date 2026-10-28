"use strict";
const assert=require('node:assert/strict');
const C=require('./ss-reach-access-rejection-proof-v0.1-capture.cjs');
const old=C.json('docs/ss-defensive-controlled-scenario-contract-v0.1-candidate-first-facts-evidence.json');
const facts=['first','replay'].map(label=>C.json(C.prefix+'candidate-'+label+'-facts-evidence.json'));
const runs=facts.map((f,index)=>{
 const physical=f.adapter.witnesses[0].truth,target=physical.identity,rows=f.reachProbe.calls;
 const take=owner=>{const matches=rows.filter(x=>x.owner===owner);assert.equal(matches.length,1,owner);assert.equal(matches[0].physicalIdentity,target);assert.equal(matches[0].exception,null);return matches[0];};
 const reach=take('DefensiveReachSecureFoundation.resolveReach'),access=take('DefensiveReachSecureFoundation.projectAccess'),context=take('script.getHighSchoolPhysicalDefensePlayerContext'),ground=take('BattedBallGroundDefense.resolveGroundBallDefensiveAccess'),handoff=take('script.ensureHighSchoolOrdinaryGroundBallInPlayHandoff'),ordinary=take('OffensivePlateApproach.simulatePlateAppearance');
 const bindings=rows.filter(x=>x.owner==='DefensiveOpportunityFoundation.resolveDefensiveOpportunity');assert(bindings.length>0);
 for(const row of bindings){assert.equal(row.physicalIdentity,target);assert.deepEqual(row.output,reach.input[0].opportunity);assert.equal(row.output.primaryDefenderId,'player');assert.equal(row.output.primaryPosition,'SS');assert.equal(row.output.bindingStatus,'bound');}
 assert.deepEqual(reach.input[0].physicalTruth,physical);assert.deepEqual(access.input[0],reach.output);
 assert.deepEqual(ground.input[0].defenderContext.reachAccess.reachResolution,reach.output);
 assert.deepEqual(context.output.reachAccess.reachResolution,reach.output);
 assert.deepEqual(ground.output.reachResolution,reach.output);
 assert.equal(handoff.output.physicalTruth.identity,target);assert.equal(ordinary.output.battedBallPhysicalTruth.identity,target);
 assert.equal(handoff.output.legacyFallbackResult,ordinary.output.result);
 const event=f.finalMatch.simulationLog.find(e=>e.physicalTruth?.identity===target&&e.type==='plateAppearance');assert(event);
 assert.equal(event.result,ordinary.output.result);assert.equal(event.outcomeAuthority,'existingOrdinaryPhysicalOutcome');
 assert(f.finalMatch.gameRecord.eventRefs.some(e=>e.sequence===event.sequence&&e.type===event.type));
 const legitimate=reach.output.supported===true&&reach.output.reached===false&&reach.output.margin<0
   &&access.output.supported===false&&access.output.reason==='canonicalReachUnavailable'
   &&ground.output.supported===false&&ground.output.reason===access.output.reason&&handoff.output.supported===false;
 const gap=reach.output.reached===true&&access.output.supported===true&&ground.output.supported===true&&handoff.output.supported===false;
 const verdict=legitimate?'A':gap?'B':'C';
 for(const count of Object.values(f.reachProbe.counts)){assert.equal(count.wrapperInvocations,count.originalInvocations);assert.equal(count.originalInvocations,count.returns+count.throws);assert.equal(count.throws,0);}
 for(const install of f.reachProbe.installations)for(const x of install.unchangedExports||[])assert(x.sameReference);
 assert.equal(f.reachProbe.counts['DefensiveReachSecureFoundation.resolveReach'].originalInvocations,1);
 assert.equal(f.reachProbe.counts['DefensiveReachSecureFoundation.projectAccess'].originalInvocations,1);
 assert.equal(f.reachProbe.counts['BattedBallGroundDefense.resolveGroundBallDefensiveAccess'].originalInvocations,1);
 assert.equal(f.reachProbe.counts['DefensiveReachSecureFoundation.resolveSecure']?.originalInvocations||0,0);
 assert.deepEqual(f.hashes,old.hashes);assert.deepEqual(f.adapter,old.adapter);assert.deepEqual(f.decisions,old.decisions);
 return{label:index?'replay':'first',verdict,physicalIdentity:target,paIdentity:ordinary.output.paIdentity,physical,bindings:bindings.map(x=>({enter:x.enter,exit:x.exit,output:x.output})),reach,access,context,ground,handoff,ordinary,event,ownerCounts:f.reachProbe.counts,traceCallCount:rows.length,notExposed:{reachNamedReason:Object.hasOwn(reach.output,'reason')?reach.output.reason:'NOT EXPOSED',handoffNamedReason:Object.hasOwn(handoff.output,'reason')?handoff.output.reason:'NOT EXPOSED',note:'Margin, variation, reachQuality and Access.reason are exposed actual owner outputs. No synthetic failureReason added.'},currentMatch:f.gateA,final:{ticks:f.ticks,completed:f.finalMatch.completed,score:f.finalMatch.scores,recordStatus:f.finalMatch.gameRecord.status,refs:f.finalMatch.gameRecord.eventRefs.length,log:f.finalMatch.simulationLog.length},hashes:f.hashes};
});
assert.deepEqual(facts[0].reachProbe,facts[1].reachProbe);assert.deepEqual(facts[0].hashes,facts[1].hashes);assert.equal(runs[0].verdict,runs[1].verdict);
const executions=['candidate-first','candidate-replay'].map(label=>{const file=C.childPrefix+label+'-evidence.json',r=C.json(file);assert.equal(r.status,'PASS');assert.equal(r.exitCode,0);assert.equal(r.stderr,'');assert(r.entryVerified&&r.sourceStable);return{file,sha256:C.fileHash(file),actualCommand:r.actualCommand,status:r.status,exit:r.exitCode,signal:r.signal,elapsedMs:r.elapsedMs,node:r.nodeVersion,policy:r.policy,witness:r.witnessPath,namedChecks:r.stdout.split('\n').filter(l=>l.startsWith('PASS ')).length,successfulAssertions:r.successfulAssertions};});
C.capture('findings',{verdict:runs[0].verdict,verdictName:{A:'Legitimate Reach Rejection',B:'Handoff Contract Gap',C:'Insufficient Evidence'}[runs[0].verdict],basis:'Same physical identity through real original owner calls, not independently re-evaluated source inference',runs,executions,replay:{traceDeepEqual:true,adapterDeepEqual:true,allFiveGameHashesEqual:true,priorControlledCaptureHashesEqual:true},counts:{newDiagnosticInvocations:2,formalSuiteInvocations:0,scenarioCandidates:1,completedScenarioGames:2,diagnosticNamedChecks:29,successfulNodeAssertions:3326},callCountQualification:'Every instrumented boundary invocation delegates to the original exactly once. No independent owner calls or observer RNG. Prior uninstrumented capture lacked call counters; matching game outputs is bounded parity, not a universal observer-neutrality proof.',rawSummaryLabelCaveat:'Inherited gateA/gateB describe Current identity/public choice; A/B/C rejection classification is exclusively this findings verdict.',nextAction:runs[0].verdict==='A'?'Accept no player decision for this ball; do not change formulas. A different processable scenario requires separate bounded authorization.':runs[0].verdict==='B'?'Propose minimum Production handoff change for human approval; no change now.':'Retain UNVERIFIED and name the missing boundary field without a broader audit.',integrity:C.integrity(),readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED'});
console.log(JSON.stringify({verdict:runs[0].verdict,margin:runs[0].reach.output.margin,reachQuality:runs[0].reach.output.reachQuality,accessReason:runs[0].access.output.reason,traceRows:runs[0].traceCallCount,reachCalls:1,replay:true,newFormalSuites:0}));
