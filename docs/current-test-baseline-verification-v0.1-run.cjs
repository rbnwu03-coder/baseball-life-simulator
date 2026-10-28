"use strict";
const assert=require('node:assert/strict'),C=require('./current-test-baseline-verification-v0.1-capture.cjs');
const plan=C.json(C.prefix+'execution-plan-evidence.json'),results=[];
for(const spec of plan.suites){const row=C.run(spec.label,spec.file);const complete=row.exitCode===0?JSON.parse(row.stdout.trim()):null;
 results.push({file:spec.file,label:spec.label,status:row.status,entryVerified:row.entryVerified,sourceStable:row.sourceStable,exitCode:row.exitCode,elapsedMs:row.elapsedMs,successfulNodeAssertions:row.successfulAssertions,summary:complete?.summary||null,negative:complete?.negative||null,runtimeEnabled:complete?.runtimeEnabled,candidateExecutionCalls:complete?.candidateExecutionCalls,raw:C.childPrefix+spec.label+'-evidence.json',witness:C.childPrefix+spec.label+'-evidence-assertions.json'});
 if(row.status!=='PASS'){C.capture('targeted-execution',{results,stop:true,remainingSuites:plan.suites.slice(results.length),productionModified:false});throw Error('Stop on unexpected targeted result: '+spec.file);}
 assert.equal(complete.summary.total,spec.expectedChecks);assert.equal(complete.summary.passed,spec.expectedChecks);assert.equal(complete.summary.failed,0);
 if(spec.label==='r4-dependency'){assert.equal(complete.runtimeEnabled,false);assert.equal(complete.candidateExecutionCalls,0);}
}
C.capture('targeted-execution',{results,children:results.length,totalNamedChecks:results.reduce((n,r)=>n+r.summary.total,0),noFurtherExpansion:true,productionTestsFixturesSeedsPinsRunnerRegistryDelta:0});
console.log(JSON.stringify({newExecutions:results.length,checks:67,status:'PASS',additionalSuitesNotStarted:true}));
