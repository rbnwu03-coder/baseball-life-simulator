"use strict";
const assert=require('node:assert/strict');
const C=require('./ss-defensive-controlled-scenario-contract-v0.1-capture.cjs');
const a=C.json(C.prefix+'candidate-first-facts-evidence.json'),b=C.json(C.prefix+'candidate-replay-facts-evidence.json');
assert.deepEqual(a.hashes,b.hashes);assert.deepEqual(a.adapter,b.adapter);assert.deepEqual(a.decisions,b.decisions);assert.equal(a.programHash,b.programHash);
const historical=['canonical','game-record'].map(name=>{
 const file='docs/test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-'+name+'-evidence.json',r=C.json(file);
 const dependencies=Object.entries(r.relevantSourceHashesBefore).filter(([file])=>!file.startsWith('docs/')).map(([file,expected])=>{const actual=C.fileHash(file);assert.equal(actual,expected,file);assert.equal(r.relevantSourceHashesAfter[file],expected,file);return{file,expected,actual};});
 assert.equal(r.status,'PASS');return{file,sha256:C.fileHash(file),status:r.status,entryVerified:r.entryVerified,sourceStable:r.sourceStable,dependencies,executedThisTurn:false};
});
const executions=['candidate-first','candidate-replay','ss-regression','ground-regression'].map(label=>{const file=C.childPrefix+label+'-evidence.json',r=C.json(file);assert.equal(r.status,'PASS');assert(r.entryVerified&&r.sourceStable);assert.equal(r.exitCode,0);assert.equal(r.stderr,'');return{label,file,sha256:C.fileHash(file),status:r.status,elapsedMs:r.elapsedMs,successfulAssertions:r.successfulAssertions,namedChecks:r.stdout.split('\n').filter(l=>l.startsWith('PASS ')).length,actualCommand:r.actualCommand,witness:r.witnessPath,policy:r.policy,node:r.nodeVersion};});
const w=a.adapter.witnesses[0],physical=a.physicalWitnesses[0].physical,g=physical.ground,pa=physical.ordinaryPA;
const matrix=[
 ['A1','current Match identity','CONFIRMED','same reference / event / Opportunity throughout'],
 ['A2','legal admission','CONFIRMED','unchanged admitted checkpoint; formal late6 substitution'],
 ['A3','actual SS','CONFIRMED','active roster binds player at SS'],
 ['A4','opponent offense','CONFIRMED','away offense / home player defense'],
 ['A5','out and base legality','CONFIRMED','owner playback reached 7/top/0/empty; native integrity empty'],
 ['A6','formal Physical flow','CONFIRMED','original producer computes truth from controlled input.rolls once'],
 ['A7','primary responsibility','CONFIRMED','official bound SS / player, not asserted from direction alone'],
 ['B1','ground truth','CONFIRMED','solid / groundBall / firm / leftSide / depth null'],
 ['B2','Reach result detail','UNVERIFIED','source shows canonical Reach/access path; raw margin / variation not retained in unsupported handoff; no second evaluation'],
 ['B3','Secure execution','UNVERIFIED','unsupported detailed handoff; no player execution'],
 ['B4','observed classification','CONFIRMED','ordinaryPlay fallback; not playerRoutinePlay or meaningful'],
 ['B5','meaningful density admission','UNVERIFIED','classification/density gate not reached; count 0 is not a suppression result'],
 ['C','legal defensive player choices / quality / duplicates','UNVERIFIED','no defensive Moment; conditional diagnostic check had zero iterations'],
 ['D','Throw / Receiver / Force or Tag / Timing / SS Settlement','UNVERIFIED','no detailed SS decision or execution; ordinary official single is not SS throw evidence'],
 ['E1','full Match and Record','CONFIRMED','115 ticks, final 1:4, 121 unique refs; original owners'],
 ['E2','Career / exposure / Save memory','CONFIRMED','participation and current match identity only; no meaningful SS credit'],
 ['E3','defensive decision conservation','CONFIRMED','0=0, nonzero coverage remains unverified'],
 ['E4','SS decision / resolution snapshot','UNVERIFIED','no SS decision or resolution snapshot; ordinary PA has before/after event'],
 ['E5','same-condition replay','CONFIRMED','Record / Log / decisions / final player / adapter deep equal'],
 ['LEVEL1','Controlled Component Proof','CONFIRMED','Physical + Responsibility only, not complete Reach/Secure/Throw chain'],
 ['LEVEL2','Controlled Match Integration Proof','UNVERIFIED','controlled input entered real Match and fallback finalized; full SS decision/execution chain not achieved'],
 ['LEVEL3','Natural Production Proof','UNVERIFIED','controlled injection used; not requested this turn']
].map(([id,responsibility,status,evidence])=>({id,responsibility,status,evidence,formallyReplacesOriginalAssertions:false}));
const prior=C.json('docs/ss-match-identity-public-resolver-contract-v0.1-candidate-first-facts-evidence.json');
const event=a.finalMatch.simulationLog.find(e=>e.type==='plateAppearance'&&e.physicalTruth?.identity===w.truth.identity);
assert(event);assert.equal(event.result,'single');assert.deepEqual(a.finalMatch.gameRecord,b.finalMatch.gameRecord);
const snapshots=a.decisions.map(d=>({domain:d.before.domain,decisionBefore:d.before,resolutionAfter:d.after,completed:d.newCompleted,finalCompleted:d.newCompleted.map(x=>a.finalMatch.completedMoments.find(y=>y.id===x.id))}));
C.capture('findings',{matrix,executions,historicalReused:historical,scenario:{input:C.prefix+'plan-evidence.json',boundary:w.before,truth:w.truth,opportunity:g.defensiveOpportunity,unsupportedHandoff:g,officialOutcome:pa.officialBallInPlayOutcome,event,observedClassification:physical.classification,meaningfulGate:physical.gate,density:physical.density,reachEvidenceLimitation:'Runtime handoff omits its failed access details. Source-supported inference is not direct reach margin evidence; never assert successful acquisition.',sourceInference:'Given official SS/player binding and legal ground input, getHighSchoolPhysicalDefensePlayerContext invokes canonical Reach; projectAccess only supports reached=true, otherwise ordinary outcome. No numeric margin or cause claimed from missing fields.'},runs:[a,b].map((f,i)=>({label:i?'replay':'first',stop:f.stop,seed:f.inputSeed,programHash:f.programHash,hashes:f.hashes,ticks:f.ticks,currentIdentity:f.gateA,initialOpportunity:f.opportunity,entry:f.finalMatch.simulationLog.find(e=>e.type==='playerEntry'),states:f.steps.length*2,defenseCreated:f.finalMatch.matchDecisionDensityState.defensiveMeaningfulDecisionCount,defenseCompleted:f.finalMatch.completedMoments.filter(x=>x.domain==='defense').length,playerRoutine:f.finalMatch.simulationLog.filter(x=>x.type==='playerRoutinePlay').length,score:f.finalMatch.scores,recordStatus:f.finalMatch.gameRecord.status,recordTotals:f.finalMatch.gameRecord.totals,eventRefs:f.finalMatch.gameRecord.eventRefs.length,logEvents:f.finalMatch.simulationLog.length,exposure:f.exposure,coachReaction:f.finalMatch.coachReaction,evaluation:f.finalPlayer.highSchoolCompetitionEvaluation,experience:f.finalMatch.matchExperience.evidenceSummary,duplicates:f.duplicates,repeats:f.repeats,snapshots:i?undefined:snapshots})),ordinaryPAViews:{before:event.before,after:event.after,final:{inning:a.finalMatch.inning,half:a.finalMatch.half,outs:a.finalMatch.outs,scores:a.finalMatch.scores,runners:a.finalMatch.runners}},priorComparison:{priorFile:'docs/ss-match-identity-public-resolver-contract-v0.1-candidate-first-facts-evidence.json',priorPhysical:'lineDrive / middle / medium',currentPhysical:'groundBall / leftSide / firm',sameRecordHash:prior.hashes.record===a.hashes.record,sameLogHash:prior.hashes.log===a.hashes.log,sameInitial:prior.hashes.initial===a.hashes.initial,meaning:'Same official single and aggregate Record do not prove physical input unchanged; log hash differs.'},rawLabelCaveat:'Raw SS_CONTROLLED_SCENARIO_SUMMARY gateA/gateB are inherited Current-identity/public-decision diagnostics, not this task Gate B Reach/Secure. This matrix controls task verdicts.',counts:{diagnosticChildren:2,formalChildren:2,scenarioCandidates:1,scenarioCompletedGames:2,diagnosticNamedChecks:27,diagnosticNodeAssertions:3245,formalNamedChecks:52,formalNodeAssertions:709,allSuccessfulNodeAssertions:3954},regressionSourceWhitelistLimitation:C.prefix+'regression-dependency-accounting-evidence.json',readyForSSMatchUISlice:false,readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED',integrity:C.integrity()});
console.log(JSON.stringify({matrixRows:matrix.length,controlledComponent:'Physical+Responsibility CONFIRMED',completeControlledSSIntegration:'UNVERIFIED',candidateGames:2,formalChecks:52,existingDelta:0}));
