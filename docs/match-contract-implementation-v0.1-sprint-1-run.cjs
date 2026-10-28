"use strict";
const assert=require('node:assert/strict'),C=require('./match-contract-implementation-v0.1-sprint-1-capture.cjs');
const plan=C.json(C.prefix+'plan-evidence.json'),results=[];
for(const spec of plan.suiteOrder){
 const row=C.run(spec.label,spec.file,[C.prefix+'run.cjs']);
 const result={label:spec.label,file:spec.file,status:row.status,exitCode:row.exitCode,elapsedMs:row.elapsedMs,entryVerified:row.entryVerified,sourceStable:row.sourceStable,successfulNodeAssertions:row.successfulAssertions,evidence:C.childPrefix+spec.label+'-evidence.json',witness:C.childPrefix+spec.label+'-evidence-assertions.json'};
 results.push(result);
 if(row.status!=='PASS'||!row.entryVerified||!row.sourceStable){C.capture('unexpected-failure',{results,stop:true,remainingSuitesNotExecuted:plan.suiteOrder.slice(results.length),productionModified:false});throw Error('STOP: unexpected formal failure in '+spec.file);}
 if(spec.label==='canonical')assert(row.stdout.includes('Canonical Match Regression: 50/50 passed.'));
 if(spec.label==='routine')assert(row.stdout.includes('Routine Commentary Contract: 1/1 original assertion passed.'));
 if(spec.label==='match-game-record')assert(row.stdout.includes('Match Full Game Record: 13/13 passed.'));
 if(spec.label==='ground-settlement')assert(row.stdout.includes('26/26 PASS'));
}
C.capture('acceptance',{results,standaloneChildren:results.length,newCanonicalFullGames:4,newCanonicalNamedChecks:50,newRoutineOriginalAssertionChecks:1,existingRecordNamedChecks:13,existingGroundSettlementNamedChecks:26,totalNamedChecks:90,originalFull38SuiteInvocations:0,original36Verdict:'Historical FAIL preserved; not executed',S3:'UNVERIFIED',snapshot:'KNOWN CONTRACT GAP',readyForCommit:'NO',readyForSprint10B:'NO',receiverV2:'DISABLED'});
console.log(JSON.stringify({formalAcceptance:'PASS',children:results.length,newCanonical:'50/50',routine:'1/1 original assertion',existing:'13/13 + 26/26',knownSnapshotGap:true}));
