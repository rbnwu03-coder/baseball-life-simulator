"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const C=require('./current-test-baseline-verification-v0.1-capture.cjs'),inventory=C.json(C.prefix+'inventory-final-evidence.json'),execution=C.json(C.prefix+'targeted-execution-evidence.json'),b=C.json(C.prefix+'baseline-evidence.json');
assert.equal(inventory.rows.length,255);assert.equal(new Set(inventory.rows.map(r=>r.stableId)).size,255);
assert.deepEqual(inventory.counters.status,{PASS:203,FAIL:2,UNVERIFIED:48,BLOCKED:2});
assert.equal(inventory.rows.filter(r=>r.status==='PASS'&&r.evidenceAge.startsWith('HISTORICAL')).length,201);
assert.equal(inventory.rows.filter(r=>r.status==='FAIL'&&r.evidenceAge.startsWith('HISTORICAL')).length,2);
assert.equal(execution.results.length,2);assert.equal(execution.totalNamedChecks,67);
const syntax=[],jsonChecks=[],links=[];
const pending=new Set([C.prefix+'verification-evidence.json',C.prefix+'closeout-evidence.json',C.prefix+'delivery-evidence.json']);
for(const p of C.files().filter(C.isNew)){
 if(/\.cjs$/.test(p)){const r=cp.spawnSync(process.execPath,['--check',path.join(C.root,p)],{encoding:'utf8',timeout:120000,maxBuffer:16000000});assert.equal(r.status,0,r.stderr);syntax.push({file:p,exitCode:r.status,stdout:r.stdout,stderr:r.stderr,sha256:C.fileHash(p)});}
 if(/\.json$/.test(p)){C.json(p);jsonChecks.push({file:p,sha256:C.fileHash(p)});}
 if(/\.md$/.test(p))for(const m of fs.readFileSync(path.join(C.root,p),'utf8').matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
  const abs=path.resolve(path.dirname(path.join(C.root,p)),m[1]),rel=path.relative(C.root,abs).replace(/\\/g,'/');assert(!rel.startsWith('../'));
  assert(fs.existsSync(abs)||pending.has(rel),'Missing link '+p+' -> '+rel);links.push({from:p,target:rel,exists:fs.existsSync(abs),planned:pending.has(rel)});
 }
}
const rawChecks=execution.results.map(r=>{const e=C.json(r.raw),w=C.json(r.witness);assert.equal(e.status,'PASS');assert.equal(e.exitCode,0);assert.equal(e.stderr,'');assert(e.entryVerified&&e.sourceStable);
 assert(w.entryStarted&&w.standaloneMainMatches);assert.equal(w.assertions.passed,r.successfulNodeAssertions);
 assert.equal(e.policy.timeoutMs,120000);assert.equal(e.policy.outputMaxBuffer,16000000);assert.equal(e.policy.implicitGitShowMaxBuffer,30000000);
 for(const [p,h]of Object.entries(e.relevantSourceHashesAfter))assert.equal(C.fileHash(p),h,p);
 return{file:r.file,raw:r.raw,witness:r.witness,actualCommand:e.actualCommand,exitCode:e.exitCode,elapsedMs:e.elapsedMs,
  entryVerified:true,sourceStable:true,successfulNodeAssertions:w.assertions.passed,caughtExpectedThrows:w.assertions.thrown,
  stdoutBytes:Buffer.byteLength(e.stdout),stderrEmpty:true,policy:e.policy,rawSha256:C.fileHash(r.raw),witnessSha256:C.fileHash(r.witness)};});
assert.equal(rawChecks.reduce((n,r)=>n+r.successfulNodeAssertions,0),397);
const report=fs.readFileSync(path.join(C.root,C.report),'utf8');assert(report.includes('203 PASS、2 FAIL、48 UNVERIFIED、2 BLOCKED'));
assert(report.includes('Ready for Commit＝**NO**'));assert(report.includes('Receiver v2＝**DISABLED**'));
assert(!C.files().some(p=>p.startsWith('tests/')&&!(p in b.hashes)&&!C.protectedPaths.has(p)),'Unexpected new formal test');
C.capture('verification',{syntax,parsedJson:jsonChecks,reportAndInventoryLinks:links,rawChecks,
 inventoryCounters:inventory.counters,uniqueStableIdentities:255,newFormalSuiteExecutions:2,newNamedChecks:67,newSuccessfulNodeAssertions:397,
 expectedCaughtThrowsAreNotSuiteFailures:true,historicalPassReuse:201,historicalFailReuse:2,unknownSuiteExecutions:0,
 newGameplayDiagnostics:0,newFormalFiles:0,newFormalSuiteDefinitions:0,postAcceptanceSuiteReruns:0,
 sourceReuseReview:C.prefix+'source-review-evidence.json',provenance:C.prefix+'provenance-evidence.json',initialInventorySupersededByFinal:true,
 coverage:{paths:1576,batches:14,reportedPartialDirectRead:{path:'docs/ability-performance-correlation-audit-sprint-1.1.md',lines:'48-56'},newFinalArtifacts:'direct read/hash plus final session coverage; no graph completeness claim'},
 integrity:C.integrity(),offlineBookkeepingAndSourceComparisonsAreNotSuiteExecutions:true});
const integrity=C.integrity();C.capture('closeout',{...integrity,protectedMetadata:C.metadata(),
 beginningReadableFiles:b.readableExistingFiles,endingExistingHashesSame:integrity.preservedExistingHashes,priorDeliveryVerified:b.priorDeliveryVerified,
 newOnlyDocs:true,newFormalTestFiles:0,formalSuitesExecutedThisTurn:2,full251:0,r6Full227:0,firstBaseTiming:0,browserFull:0,
 originalMatchReruns:0,abilityGradientReruns:0,gameplayDiagnosticInvocations:0,
 actions:{reset:false,clean:false,stash:false,stage:false,commit:false,push:false,fetch:false,receiverV2Enabled:false},
 originalMatchHistoricalFailPreserved:true,gradientHistoricalFailPreserved:true,S3:'UNVERIFIED',snapshot:'KNOWN CONTRACT GAP',
 receiverV2:'DISABLED',readyForCommit:'NO',readyForSprint10B:'NO',
 gitSnapshotBeforeOwnCloseoutAndDeliveryCreate:true,stop:'Read-only baseline complete; no automatic repair or wider verification'});
const files=C.files().filter(C.isNew).sort();C.capture('delivery',{files,hashes:Object.fromEntries(files.map(p=>[p,C.fileHash(p)])),report:C.report,
 acceptedInventory:C.prefix+'inventory-final-evidence.json',inventoryMarkdown:C.prefix+'inventory-final.md',initialProvisionalInventoryRetained:true,
 preservedExistingHashes:1552,newFormalFiles:0,exclusiveNewArtifacts:true,deliverySelfHashNotIncluded:true});
const d=C.json(C.prefix+'delivery-evidence.json');for(const [p,h]of Object.entries(d.hashes))assert.equal(C.fileHash(p),h,p);
for(const link of links)assert(fs.existsSync(path.join(C.root,link.target)));
const end=C.integrity();console.log(JSON.stringify({statusCounts:inventory.counters.status,newChildren:2,namedChecks:67,oldHashesSame:end.preservedExistingHashes,
 newArtifactsExcludingDelivery:files.length,indexEmpty:end.git.index==='',productionTestsRunnerRegistryDelta:0,readyForCommit:'NO',readyForSprint10B:'NO',receiverV2:'DISABLED',stopped:true}));
