"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./critical-regression-triage-v0.1-capture.cjs');
C.integrity();
const report=C.prefix+'root-cause.md',body=fs.readFileSync(path.join(C.root,report),'utf8');
const links=[...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(m=>m[1]);
const generatedHere=new Set(['critical-regression-triage-v0.1-closeout-evidence.json','critical-regression-triage-v0.1-delivery-evidence.json']);
for(const href of links){const file=path.resolve(C.root,'docs',href);assert(file.startsWith(C.root+path.sep));if(!generatedHere.has(href))assert(fs.existsSync(file),'Missing report link '+href);}
const reverse=[];
for(const p of ['isolation-contract','followup-isolation-contract','rng-isolation-contract']) {
 const contract=C.json(C.prefix+p+'-evidence.json');
 for(const row of contract.rows||[contract.row]) {
  let text=fs.readFileSync(path.join(C.root,row.file),'utf8');assert.equal(C.fileHash(row.file),row.derivedSha256);
  for(const e of [...row.edits].reverse()){assert.equal(text.split(e.after).length-1,1);text=text.replace(e.after,e.before);}
  assert.equal(text,fs.readFileSync(path.join(C.root,row.original),'utf8'));
  reverse.push({file:row.file,original:row.original,exactReverseToUnchangedOriginal:true});
 }
}
const execution=C.json(C.prefix+'execution-summary-evidence.json');
assert.equal(execution.invocations,11);assert.deepEqual(execution.statusCounts,{FAIL:9,UNVERIFIED:1,PASS:1});
for(const row of execution.runs){assert(row.sourceStable);if(row.status!=='UNVERIFIED')assert(row.entryVerified);}
for(const label of ['opportunity-original','match-original','gradient-original'])assert.equal(execution.runs.find(r=>r.label===label).status,'FAIL');
assert.equal(execution.runs.find(r=>r.label==='opportunity-dependencies-isolated').status,'PASS');
const supplementalPaths=[...C.files().filter(p=>C.isNew(p)&&!C.json(C.prefix+'architecture-coverage-evidence.json').coverageBatches.some(b=>b.paths.some(row=>row.path===p)))];
const supplementalDirectHashes=Object.fromEntries(supplementalPaths.map(p=>[p,C.fileHash(p)]));
C.capture('closeout',{...C.integrity(),report:{path:report,sha256:C.fileHash(report),linksCheckedBeforeCloseout:links.length-generatedHere.size,generatedLinkedOutputs:[...generatedHere]},reverse,supplementalDirectHashes,graphSupplementalNote:'New reporting/bookkeeping artifacts added after graph snapshot verified directly; no structural graph conclusion inferred from absent metadata',finalizationRecovery:{reason:'Initial link check attempted to verify the closeout/delivery files before this utility creates them; corrected order and verify all links after exclusive creation',additionalChildInvocations:0,initialFailureFullInteractiveStderrAvailable:true},childInvocations:11,originalOfficialFailCount:3,rawLogCompleteness:{completeChildCaptures:10,incompleteUnverifiedChildCapture:C.childPrefix+'gradient-isolated-evidence.json',reason:'Original 16MB buffer preserved; ENOBUFS output interruption retained, corrected compact observation has complete logs'},newConfirmedProductionRegressions:0,full251:0,r6Full227:0,firstBase400:0,receiverV2Integration:0,browserFullSuite:0,productionRepairStarted:false,formalTestRepairStarted:false,stageCommitPush:false,receiverRuntime:'DISABLED',L03:'PARTIAL',readyForCommit:'NO',readyForSprint10B:'NO',stopped:true});
const files=C.files().filter(C.isNew);
const hashes=Object.fromEntries(files.map(p=>[p,C.fileHash(p)]));
C.capture('delivery',{files,hashes,deliverySelfHashExcluded:true,existingReadablePreserved:1314,productionDelta:0,formalTestDelta:0,protectedMetadataUnchanged:true,readyForCommit:'NO',readyForSprint10B:'NO',stopped:true});
for(const href of links)assert(fs.existsSync(path.resolve(C.root,'docs',href)),'Missing final report link '+href);
const integrity=C.integrity();
console.log(JSON.stringify({report,reportSha256:C.fileHash(report),linksChecked:links.length,exactReverseCopies:reverse.length,existingHashesPreserved:integrity.preservedExistingHashes,changedExistingPaths:integrity.changedExistingPaths,newFilesIncludingDelivery:files.length+1,invocations:11,originals:'3 FAIL retained',productionDelta:0,formalTestDelta:0,readyForCommit:'NO',stopped:true}));
