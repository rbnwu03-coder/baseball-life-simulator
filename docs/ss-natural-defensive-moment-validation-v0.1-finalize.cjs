"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const C=require('./ss-natural-defensive-moment-validation-v0.1-capture.cjs');
const phase=process.argv[2];
if(phase==='verify'){
 const integrity=C.integrity(),own=C.files().filter(C.isNew);
 const syntax=[...own.filter(file=>file.endsWith('.cjs')),'tests/ss-defensive-production-integration-test.js','tests/ground-ball-defensive-settlement-lifecycle-regression-test.js','tests/helpers/canonical-match-contract-context.cjs'].map(file=>{
  const r=cp.spawnSync(process.execPath,['--check',path.join(C.root,file)],{encoding:'utf8',windowsHide:true,timeout:120000});assert.equal(r.status,0,file+': '+r.stderr);return{file,command:[process.execPath,'--check',path.join(C.root,file)],exit:r.status,stdout:r.stdout,stderr:r.stderr,sha256:C.fileHash(file)};
 });
 const parsed=own.filter(file=>file.endsWith('.json')).map(file=>{C.json(file);return{file,sha256:C.fileHash(file)};});
 const future=new Set(['verification','closeout','delivery'].map(label=>C.prefix+label+'-evidence.json'));
 const text=fs.readFileSync(path.join(C.root,C.report),'utf8'),links=[...text.matchAll(/\]\(([^)]+)\)/g)].map(row=>row[1]).filter(p=>!p.includes('://')).map(link=>{
  const file=path.relative(C.root,path.resolve(C.root,'docs',link.split('#')[0])).replace(/\\/g,'/');assert(!C.protectedPaths.has(file));assert(fs.existsSync(path.join(C.root,file))||future.has(file),file);return{file,present:fs.existsSync(path.join(C.root,file)),planned:future.has(file)};
 });
 const source=C.json(C.prefix+'source-evidence.json');for(const row of [...source.files,...source.snippets])assert.equal(C.fileHash(row.file),row.sha256||row.fileSha256);
 const executions=['candidate-first','candidate-replay','ss-regression','ground-regression'].map(label=>{
  const file=C.childPrefix+label+'-evidence.json',row=C.json(file);const candidate=label.startsWith('candidate-');
  assert.equal(row.status,candidate?'FAIL':'PASS');assert.equal(row.exitCode,candidate?1:0);assert(row.entryVerified&&row.sourceStable);assert.equal(row.policy.timeoutMs,120000);assert.equal(row.policy.outputMaxBuffer,16000000);assert.equal(row.policy.implicitGitShowMaxBuffer,30000000);
  assert.equal(row.stdout.split('\n').filter(line=>line.startsWith('PASS ')).length,candidate?5:26);
  if(!candidate)assert.equal(row.stderr,'');
  return{label,file,actualCommand:row.actualCommand,policy:row.policy,exit:row.exitCode,signal:row.signal,status:row.status,elapsedMs:row.elapsedMs,successfulNodeAssertions:row.successfulAssertions,entryVerified:row.entryVerified,sourceStable:row.sourceStable,witness:row.witnessPath,stdoutBytes:Buffer.byteLength(row.stdout),stderrBytes:Buffer.byteLength(row.stderr),sha256:C.fileHash(file)};
 });
 C.capture('verification',{syntax,parsed,links,executions,formalSuites:2,formalNamedChecks:52,formalSuccessfulNodeAssertions:709,isolatedCandidateScenarios:1,isolatedCandidateRuns:2,finishedCandidateMatches:0,diagnosticFAILPreserved:true,originalTestsModified:false,entryProfile:C.prefix+'entry-profile-evidence.json',noUnscopedGitDiffCommandsExecuted:true,protectedBoundaryException:C.prefix+'boundary-accounting-evidence.json',postProcessingNote:'One read-only inline summary attempt had a PowerShell non-ASCII regex encoding SyntaxError before data access; repeated as ASCII only. No gameplay or formal suite was rerun.',integrity,afterIntegrity:C.integrity(),remoteServerRechecked:false});
 console.log(JSON.stringify({syntax:syntax.length,json:parsed.length,links:links.length,formalSuites:2,diagnosticFailures:2,integrity:'preserved with recorded protected-search deviation'}));
}else if(phase==='close'){
 const integrity=C.integrity(),b=C.json(C.prefix+'baseline-evidence.json');
 C.capture('closeout',{git:integrity.git,hashes:Object.fromEntries(Object.keys(b.hashes).map(file=>[file,C.fileHash(file)])),preservedExistingHashes:integrity.preservedExistingHashes,existingDelta:0,previousFourSnapshotChangesPreserved:true,protectedMetadata:C.metadata(),protectedBoundaryException:C.prefix+'boundary-accounting-evidence.json',noUnscopedGitDiffCommandsExecuted:true,remoteServerRechecked:false,formalSuiteInvocations:2,diagnosticAttempts:2,completedCandidateMatches:0,full255Invocations:0,r6Full227Invocations:0,firstBaseTimingInvocations:0,receiverIntegrationInvocations:0,browserFullInvocations:0,readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED',SS63MatchUISliceReady:false,finalArtifactTiming:'Closeout Git snapshot precedes creation of closeout and delivery; exact final artifact inventory/hashes follow in delivery.'});
 const files=C.files().filter(C.isNew);assert(!files.includes(C.prefix+'delivery-evidence.json'));
 C.capture('delivery',{files,hashes:Object.fromEntries(files.map(file=>[file,C.fileHash(file)])),report:C.report,existingFilesModified:false,baseline:C.prefix+'baseline-evidence.json',closeout:C.prefix+'closeout-evidence.json',SSNaturalEndToEnd:'UNVERIFIED',readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED'});
 const d=C.json(C.prefix+'delivery-evidence.json');for(const [file,hash]of Object.entries(d.hashes))assert.equal(C.fileHash(file),hash);
 for(const row of C.json(C.prefix+'verification-evidence.json').links)assert(fs.existsSync(path.join(C.root,row.file)),row.file);
 C.integrity();console.log(JSON.stringify({existingHashesPreserved:integrity.preservedExistingHashes,newDeliveryEntries:files.length,indexEmpty:integrity.git.index==='',allLinksResolved:true,SSNaturalEndToEnd:'UNVERIFIED',stopped:true}));
}else assert.fail('Use verify or close');
