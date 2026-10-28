"use strict";
// Diagnostic bookkeeping only. Existing sources and captures are never written.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const A = require('./source-freeze-contract-reconciliation-v0.1-phase-b-capture.cjs');
const E = require('../tests/entry-safe-runner.cjs');
const prefix = 'docs/critical-regression-triage-v0.1-';
const childPrefix = 'docs/test-infrastructure-sprint-0.1-critical-triage-';
const isNew = p => p.startsWith(prefix) || p.startsWith(childPrefix);
function capture(label, data) {
  const p = prefix + label + '-evidence.json';
  assert(!fs.existsSync(path.join(A.root,p)), 'Existing target: '+p);
  fs.writeFileSync(path.join(A.root,p), JSON.stringify({task:'Critical Regression Triage v0.1',createdAt:new Date().toISOString(),...data},null,2)+'\n',{flag:'wx'});
  return p;
}
function baseline() {
  assert(!fs.existsSync(path.join(A.root,prefix+'baseline-evidence.json')));
  const git=A.gitState(); assert.equal(git.branch,'main'); assert.equal(git.index,'');
  for(const k of ['head','main','originMain']) assert.equal(git[k],E.formalBaseline);
  const b=A.json(A.prefix+'baseline-evidence.json'), d=A.json(A.prefix+'delivery-evidence.json');
  const checked=[];
  for(const [p,h] of Object.entries(b.hashes)) assert.equal(A.fileHash(p),d.modifiedOriginalHashes[p]||h,p);
  for(const name of ['source-freeze-contract-reconciliation-v0.1-phase-b','test-infrastructure-sprint-0.1','test-reliability-audit-v0.1']) {
    const p='docs/'+name+'-delivery-evidence.json', delivery=A.json(p);
    for(const [file,h] of Object.entries(delivery.hashes)) assert.equal(A.fileHash(file),h,file);
    checked.push({path:p,sha256:A.fileHash(p),entries:Object.keys(delivery.hashes).length});
  }
  assert.deepEqual(A.metadata(),b.protectedMetadata);
  const reverse=A.reverseVerify();
  const files=A.files().filter(p=>!isNew(p));
  const allowed=new Set([...Object.keys(b.hashes),...d.files,A.prefix+'delivery-evidence.json']);
  assert.deepEqual(files.filter(p=>!allowed.has(p)),[],'Unexplained files since Phase B');
  const oldStatus=s=>s.split(/\r?\n/).filter(l=>l&&!isNew(l.slice(3))&&!l.slice(3).startsWith(A.prefix)&&!l.slice(3).startsWith(A.childPrefix)&&!A.newTests.has(l.slice(3))&&l.slice(3)!==A.report&&!(l.slice(3) in d.modifiedOriginalHashes)).sort();
  assert.deepEqual(oldStatus(git.status),oldStatus(b.git.status),'Original WIP status mismatch');
  const hashes=Object.fromEntries(files.map(p=>[p,A.fileHash(p)]));
  capture('baseline',{git,hashes,readableFiles:files.length,priorDeliveries:checked,phaseBReverse:reverse,protectedMetadata:A.metadata(),protectedContentReadOrHashed:false,remoteServerRechecked:false,preflightRecovery:{suiteInvocationsBeforeRecovery:0,reason:'Initial new bookkeeping compared pre-Phase-B status without excluding the five hash-verified authorized Phase B test changes; only new utility corrected',initialInteractiveStderrComplete:false,initialInteractiveStderrStatus:'UNVERIFIED; not suite evidence'}});
  console.log(JSON.stringify({baseline:'VERIFIED',readableFiles:files.length,priorDeliveries:checked,protectedPaths:A.protectedPaths.size}));
}
function integrity() {
  const b=A.json(prefix+'baseline-evidence.json');
  for(const [p,h] of Object.entries(b.hashes)) assert.equal(A.fileHash(p),h,'Unexpected existing change: '+p);
  assert.deepEqual(A.metadata(),b.protectedMetadata);
  const git=A.gitState();for(const k of ['branch','head','main','originMain','index']) assert.equal(git[k],b.git[k]);
  const status=s=>s.split(/\r?\n/).filter(l=>l&&!isNew(l.slice(3))).sort();
  assert.deepEqual(status(git.status),status(b.git.status));
  assert.deepEqual(A.files().filter(p=>!(p in b.hashes)&&!isNew(p)),[]);
  return {preservedExistingHashes:Object.keys(b.hashes).length,changedExistingPaths:[],protectedMetadataUnchanged:true,protectedContentReadOrHashed:false,productionDelta:0,formalTestDelta:0,git};
}
function run(label,file,extra=[]) {
  integrity();
  const b=A.json(prefix+'baseline-evidence.json');
  const relevant=Object.keys(b.hashes).filter(p=>!p.startsWith('docs/')&&/\.(js|cjs|json|html)$/.test(p));
  const evidencePath=childPrefix+label+'-evidence.json';
  const row=E.runSuite({suiteName:label,file,entryMode:'standalone',evidencePath,relevantPaths:[...relevant,...extra]});
  integrity();
  console.log(JSON.stringify({label,status:row.status,elapsedMs:row.elapsedMs,exitCode:row.exitCode,sourceStable:row.sourceStable,entryVerified:row.entryVerified,stdout:row.stdout.slice(-1300),stderr:row.stderr.slice(-2600),evidencePath}));
  return row;
}
module.exports={...A,prefix,childPrefix,isNew,capture,integrity,run};
if(require.main===module) {
  const mode=process.argv[2];
  if(mode==='baseline') baseline();
  else if(mode==='originals') {
    run('opportunity-original','tests/high-school-year-one-opportunity-two-integration-test.js');
    run('match-original','tests/baseball-match-foundation-2-2-2-test.js');
    run('gradient-original','tests/ability-performance-gradient-test.js');
  } else if(mode==='closeout') console.log(JSON.stringify(integrity()));
  else if(mode==='paths') console.log(JSON.stringify(A.files()));
  else if(mode==='tool-evidence') console.log(capture(process.argv[3],JSON.parse(Buffer.from(process.argv[4],'base64').toString('utf8'))));
  else throw Error('Explicit diagnostic action required');
}
