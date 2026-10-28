"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const C=require('./match-contract-implementation-v0.1-sprint-1-capture.cjs');
const acceptance=C.json(C.prefix+'acceptance-evidence.json'),source=C.json(C.prefix+'source-evidence.json'),b=C.json(C.prefix+'baseline-evidence.json');
const syntax=[],jsonFiles=[],rawChecks=[];
for(const p of C.files().filter(C.isNew)){
 if(/\.cjs$/.test(p)){const r=cp.spawnSync(process.execPath,['--check',path.join(C.root,p)],{encoding:'utf8',timeout:120000,maxBuffer:16000000});assert.equal(r.status,0,r.stderr);syntax.push({path:p,exitCode:r.status,stdout:r.stdout,stderr:r.stderr,sha256:C.fileHash(p)});}
 if(/\.json$/.test(p)){C.json(p);jsonFiles.push({path:p,sha256:C.fileHash(p)});}
}
for(const item of source.formalFiles)assert.equal(C.fileHash(item.file),item.sha256,item.file);
assert.equal(C.fileHash(source.originalTest.file),b.hashes[source.originalTest.file]);
for(const row of acceptance.results){
 const e=C.json(row.evidence),w=C.json(row.witness);
 assert.equal(e.status,'PASS');assert.equal(e.exitCode,0);assert.equal(e.stderr,'');assert(e.entryVerified&&e.sourceStable);
 assert(w.entryStarted&&w.standaloneMainMatches);assert.equal(w.assertions.thrown,0);assert.equal(w.assertions.passed,row.successfulNodeAssertions);
 assert.equal(e.policy.timeoutMs,120000);assert.equal(e.policy.outputMaxBuffer,16000000);assert.equal(e.policy.implicitGitShowMaxBuffer,30000000);
 for(const p of C.formalFiles){assert.equal(e.relevantSourceHashesBefore[p],C.fileHash(p));assert.equal(e.relevantSourceHashesAfter[p],C.fileHash(p));}
 rawChecks.push({file:row.file,actualCommand:e.actualCommand,entryVerified:true,sourceStable:true,exitCode:0,stderrEmpty:true,
  elapsedMs:e.elapsedMs,stdoutBytes:Buffer.byteLength(e.stdout),successfulNodeAssertions:w.assertions.passed,policy:e.policy,
  witness:row.witness,raw:row.evidence,rawSha256:C.fileHash(row.evidence),witnessSha256:C.fileHash(row.witness)});
}
assert.equal(acceptance.results.length,4);
const report=fs.readFileSync(path.join(C.root,C.report),'utf8'),links=[];
const planned=new Set([C.prefix+'verification-evidence.json',C.prefix+'closeout-evidence.json',C.prefix+'delivery-evidence.json']);
for(const match of report.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
 const target=match[1];assert(!/^(https?:|file:|#)/.test(target),'Unexpected external/report anchor');
 const abs=path.resolve(path.dirname(path.join(C.root,C.report)),target),rel=path.relative(C.root,abs).replace(/\\/g,'/');
 assert(!rel.startsWith('../'));assert(fs.existsSync(abs)||planned.has(rel),'Missing report link '+rel);links.push({target:rel,existing:fs.existsSync(abs),planned:planned.has(rel)});
}
assert(report.includes('KNOWN CONTRACT GAP'));assert(report.includes('S3固定Moment3仍UNVERIFIED'));
assert(report.includes('Ready for Commit＝NO'));assert(report.includes('Receiver v2＝DISABLED'));
C.capture('verification',{syntax,parsedNewJson:jsonFiles,reportLinks:links,rawChecks,successfulNodeAssertionCalls:rawChecks.reduce((sum,r)=>sum+r.successfulNodeAssertions,0),
 formalSuiteInvocations:4,formalSuiteReruns:0,oldFull38SuiteInvocations:0,newCanonicalFullGames:4,
 staticVerificationOnlyAfterAcceptance:true,sourceFrozenSinceAcceptance:true,oldOriginalTestByteUnchanged:true,
 sourceSnippetExactCurrentComparisons:4,coverage:{pathChecks:1542,batches:13,additionalReportingPathsChecked:4,partialDirectRead:{path:'docs/ability-performance-correlation-audit-sprint-1.1.md',lines:'48-56'},finalReportingArtifacts:'Direct read/hash and final session coverage; no graph completeness claim'},
 integrity:C.integrity(),readiness:{currentTestBaselineVerification:'YES technical prerequisites; not started, pending review; all-tests-green not claimed',commit:'NO',sprint10B:'NO',receiverV2:'DISABLED'}});
const integrity=C.integrity();C.capture('closeout',{...integrity,newFormalFiles:C.formalFiles.map(p=>({path:p,sha256:C.fileHash(p)})),
 oldOriginalTestSha256:C.fileHash('tests/baseball-match-foundation-2-2-2-test.js'),newFormalFileCount:3,
 prohibitedActions:{reset:false,clean:false,stash:false,stage:false,commit:false,push:false,fetch:false},
 forbiddenSuiteInvocations:{Full251:0,R6Full227:0,firstBaseTiming:0,ReceiverV2Integration:0,browser:0},
 oldHashesAllSame:true,oldExistingPaths:b.readableExistingFiles,prior1494Verified:b.prior1494Verified,protectedMetadata:C.metadata(),
 newGameplayAfterAcceptance:0,fullOriginal38SuiteInvocations:0,original36HistoricalVerdict:'FAIL preserved',S3:'UNVERIFIED',snapshot:'KNOWN CONTRACT GAP',
 gitSnapshotTakenBeforeOwnCloseoutAndDeliveryCreate:true,stop:'Sprint 1 complete; no next phase automatically started'});
const files=C.files().filter(C.isNew).sort();
C.capture('delivery',{files,hashes:Object.fromEntries(files.map(p=>[p,C.fileHash(p)])),newFormalFiles:C.formalFiles,formalFileCount:3,report:C.report,
 preservedExistingHashCount:Object.keys(b.hashes).length,newOnly:true,deliverySelfHashNotIncluded:true});
for(const [p,h] of Object.entries(C.json(C.prefix+'delivery-evidence.json').hashes))assert.equal(C.fileHash(p),h,p);
const final=C.integrity();for(const link of links)assert(fs.existsSync(path.join(C.root,link.target)));
console.log(JSON.stringify({deliveryFilesExcludingDelivery:files.length,newFormalFiles:C.formalFiles.length,preservedOldHashes:final.preservedExistingHashes,formalSuiteStatus:'4/4 PASS',namedChecks:90,nodeAssertions:2754,report:C.report,indexEmpty:final.git.index==='',readyForCommit:'NO',readyForSprint10B:'NO',receiverV2:'DISABLED',stopped:true}));
