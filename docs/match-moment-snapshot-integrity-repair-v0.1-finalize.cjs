"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const C=require('./match-moment-snapshot-integrity-repair-v0.1-capture.cjs');
const phase=process.argv[2];
if(phase==='verify'){
  if(fs.existsSync(path.join(C.root,C.prefix+'boundary-accounting-evidence.json'))) assert.equal(C.json(C.prefix+'boundary-accounting-evidence.json').metadataOnlyBoundaryDeviation,true);
  else C.capture('boundary-accounting',{command:'git diff --stat',scope:'Unrestricted tracked worktree',protectedPathAffected:'tests/fast-check-smoke-test.cjs',output:'10 added lines statistic; no source text emitted',metadataOnlyBoundaryDeviation:true,protectedContentNotReadByOwnHashLoop:true,gitInternallyComputedDiff:true,protectedContentHashProof:false,protectedFileExecutedOrModified:false,correction:'Record exception explicitly; do not claim whole-session metadata-only access. No more unrestricted diff commands.'});
  const beforeIntegrity=C.integrity('fixed');
  const own=C.files().filter(C.isNew);
  const syntax=[...C.allowed,...own.filter(file=>file.endsWith('.cjs'))].map(file=>{
    const row=cp.spawnSync(process.execPath,['--check',path.join(C.root,file)],{encoding:'utf8',timeout:120000,windowsHide:true});
    assert.equal(row.status,0,file+': '+row.stderr);return{file,command:[process.execPath,'--check',path.join(C.root,file)],exitCode:row.status,stdout:row.stdout,stderr:row.stderr,sha256:C.fileHash(file)};
  });
  const parsed=own.filter(file=>file.endsWith('.json')).map(file=>{C.json(file);return{file,sha256:C.fileHash(file)};});
  const future=new Set(['verification','closeout','delivery'].map(name=>C.prefix+name+'-evidence.json'));
  const report=fs.readFileSync(path.join(C.root,C.report),'utf8');
  const links=[...report.matchAll(/\]\(([^)]+)\)/g)].map(match=>match[1]).filter(link=>!link.includes('://')).map(link=>{
    const file=path.relative(C.root,path.resolve(C.root,'docs',link.split('#')[0])).replace(/\\/g,'/');
    assert(!C.protectedPaths.has(file));assert(fs.existsSync(path.join(C.root,file))||future.has(file),file);return{file,present:fs.existsSync(path.join(C.root,file)),planned:future.has(file)};
  });
  const source=C.json(C.prefix+'source-evidence.json');for(const row of source.files)assert.equal(row.afterHash,C.fileHash(row.file));
  const executions=['before-red','canonical','game-record','experience','presentation'].map(label=>{
    const file=C.childPrefix+label+'-evidence.json',row=C.json(file);
    assert(row.entryVerified&&row.sourceStable);assert.equal(row.exitCode,label==='before-red'?1:0);assert.equal(row.status,label==='before-red'?'FAIL':'PASS');
    assert.equal(row.policy.timeoutMs,120000);assert.equal(row.policy.outputMaxBuffer,16000000);assert.equal(row.policy.implicitGitShowMaxBuffer,30000000);
    if(label!=='before-red')assert.equal(row.stderr,'');
    return{label,file,actualCommand:row.actualCommand,policy:row.policy,exitCode:row.exitCode,signal:row.signal,entryVerified:row.entryVerified,sourceStable:row.sourceStable,successfulAssertions:row.successfulAssertions,elapsedMs:row.elapsedMs,stdoutBytes:Buffer.byteLength(row.stdout),stderrBytes:Buffer.byteLength(row.stderr),sha256:C.fileHash(file),witness:row.witnessPath};
  });
  C.capture('verification',{syntax,parsed,links,executions,expectedRedChildren:1,greenChildren:4,greenNamedChecks:144,greenSuccessfulNodeAssertions:2866,newCanonicalGames:{red:1,green:4},snapshots:'New events corrected; missing/stale legacy before UNVERIFIED',protectedBoundaryException:C.prefix+'boundary-accounting-evidence.json',reportingUtilityRecovery:{firstAttempt:'TypeError: C.protectedPaths.includes is not a function',cause:'Inherited protectedPaths is a Set',fix:'Only new docs finalize utility now uses has; existing boundary capture read and retained',formalSuiteReruns:0,productionChanges:0},beforeIntegrity,afterIntegrity:C.integrity('fixed'),evidenceCreateMode:'New captures exclusively created with wx; original captures unchanged',remoteServerRechecked:false});
  console.log(JSON.stringify({syntax:syntax.length,json:parsed.length,links:links.length,executions:executions.length,integrity:'VERIFIED with declared protected metadata-only deviation'}));
}else if(phase==='close'){
  const integrity=C.integrity('fixed'),b=C.json(C.prefix+'baseline-evidence.json');
  const hashes=Object.fromEntries(Object.keys(b.hashes).map(file=>[file,C.fileHash(file)]));
  const authorizedDelta=integrity.changedExistingPaths.map(file=>({file,before:b.hashes[file],after:hashes[file]}));
  assert.equal(authorizedDelta.length,4);
  C.capture('closeout',{git:integrity.git,hashes,openingExistingReadableFiles:Object.keys(b.hashes).length,preservedExistingHashes:integrity.preservedExistingHashes,authorizedDelta,authorizedDeltaContract:C.prefix+'source-evidence.json',protectedMetadata:C.metadata(),protectedBoundaryException:C.prefix+'boundary-accounting-evidence.json',indexEmpty:true,remoteServerRechecked:false,full255Invocations:0,r6Full227Invocations:0,firstBaseTimingInvocations:0,browserFullInvocations:0,receiverIntegrationInvocations:0,readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED',finalArtifactTiming:'Git snapshot precedes closeout/delivery creation; those exact new paths and hashes are declared in delivery.'});
  const files=C.files().filter(C.isNew);assert(!files.includes(C.prefix+'delivery-evidence.json'));
  C.capture('delivery',{files,hashes:Object.fromEntries(files.map(file=>[file,C.fileHash(file)])),authorizedExistingAfterHashes:Object.fromEntries(authorizedDelta.map(row=>[row.file,row.after])),openingBaseline:C.prefix+'baseline-evidence.json',closeout:C.prefix+'closeout-evidence.json',report:C.report,readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED'});
  const d=C.json(C.prefix+'delivery-evidence.json');for(const [file,hash]of Object.entries(d.hashes))assert.equal(C.fileHash(file),hash);
  for(const row of C.json(C.prefix+'verification-evidence.json').links)assert(fs.existsSync(path.join(C.root,row.file)),row.file);
  C.integrity('fixed');
  console.log(JSON.stringify({existingFiles:Object.keys(hashes).length,preserved:integrity.preservedExistingHashes,authorizedDelta:authorizedDelta.map(row=>row.file),deliveryEntries:files.length,allLinksResolved:true,indexEmpty:true,readyForCommit:false}));
}else assert.fail('Use verify or close');
