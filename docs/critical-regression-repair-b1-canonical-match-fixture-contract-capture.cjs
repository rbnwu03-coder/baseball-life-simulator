"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const A=require('./critical-regression-repair-a-opportunity-two-capture.cjs'),E=require('../tests/entry-safe-runner.cjs');
const prefix='docs/critical-regression-repair-b1-canonical-match-fixture-contract-',report='docs/critical-regression-repair-b1-canonical-match-fixture-contract.md',childPrefix='docs/test-infrastructure-sprint-0.1-repair-b1-canonical-fixture-';
const isNew=p=>p.startsWith(prefix)||p.startsWith(childPrefix)||p===report;
function capture(label,data){assert(/^[a-z0-9-]+$/.test(label));const file=prefix+label+'-evidence.json';assert(!fs.existsSync(path.join(A.root,file)));fs.writeFileSync(path.join(A.root,file),JSON.stringify({task:'Critical Regression Repair B1 — Canonical Match Fixture Contract Validation v0.1',createdAt:new Date().toISOString(),...data},null,2)+'\n',{flag:'wx'});return file;}
function baseline(){
 assert(!fs.existsSync(path.join(A.root,prefix+'baseline-evidence.json')));
 const old=A.json(A.prefix+'baseline-evidence.json'),delivery=A.json(A.prefix+'delivery-evidence.json'),closeout=A.json(A.prefix+'closeout-evidence.json');
 for(const [p,h] of Object.entries(old.hashes))assert.equal(A.fileHash(p),delivery.modifiedOriginalHashes[p]||h,p);
 for(const [p,h] of Object.entries(delivery.hashes))assert.equal(A.fileHash(p),h,p);
 assert.deepEqual(A.metadata(),old.protectedMetadata);
 const git=A.gitState();for(const k of ['branch','head','main','originMain','index'])assert.equal(git[k],old.git[k]);
 const status=s=>s.split(/\r?\n/).filter(l=>l&&!isNew(l.slice(3))&&!A.isNew(l.slice(3))).sort();assert.deepEqual(status(git.status),status(closeout.git.status));
 const files=A.files().filter(p=>!isNew(p)),allowed=new Set([...Object.keys(old.hashes),...delivery.files,A.prefix+'delivery-evidence.json']);assert.deepEqual(files.filter(p=>!allowed.has(p)),[]);
 const hashes=Object.fromEntries(files.map(p=>[p,A.fileHash(p)]));
 capture('baseline',{git,hashes,readableExistingFiles:files.length,priorRepairADelivery:{path:A.prefix+'delivery-evidence.json',sha256:A.fileHash(A.prefix+'delivery-evidence.json'),verifiedEntries:Object.keys(delivery.hashes).length},protectedMetadata:A.metadata(),protectedContentReadOrHashed:false,remoteServerRechecked:false,productionEditsAuthorized:false,formalTestOrFixtureEditsAuthorized:false});
 console.log(JSON.stringify({baseline:'VERIFIED',readableExistingFiles:files.length,protectedPaths:A.protectedPaths.size,indexEmpty:true}));
}
function integrity(){const b=A.json(prefix+'baseline-evidence.json');for(const [p,h] of Object.entries(b.hashes))assert.equal(A.fileHash(p),h,'Unexpected existing change: '+p);assert.deepEqual(A.metadata(),b.protectedMetadata);const git=A.gitState();for(const k of ['branch','head','main','originMain','index'])assert.equal(git[k],b.git[k]);const status=s=>s.split(/\r?\n/).filter(l=>l&&!isNew(l.slice(3))).sort();assert.deepEqual(status(git.status),status(b.git.status));assert.deepEqual(A.files().filter(p=>!(p in b.hashes)&&!isNew(p)),[]);return{preservedExistingHashes:Object.keys(b.hashes).length,changedExistingPaths:[],productionDelta:0,formalTestDelta:0,fixtureDelta:0,protectedMetadataUnchanged:true,protectedContentReadOrHashed:false,git};}
function run(label,file,extra=[]){integrity();assert(/^[a-z0-9-]+$/.test(label));const b=A.json(prefix+'baseline-evidence.json'),relevant=Object.keys(b.hashes).filter(p=>!p.startsWith('docs/')&&/\.(js|cjs|json|html)$/.test(p));const evidencePath=childPrefix+label+'-evidence.json',row=E.runSuite({suiteName:label,file,entryMode:'standalone',evidencePath,relevantPaths:[...relevant,prefix+'capture.cjs',...extra]});integrity();console.log(JSON.stringify({label,status:row.status,exitCode:row.exitCode,elapsedMs:row.elapsedMs,mainVerified:row.entryVerified,sourceStable:row.sourceStable,stdoutTail:row.stdout.slice(-1800),stderr:row.stderr,evidencePath}));return row;}
module.exports={...A,prefix,report,childPrefix,isNew,capture,integrity,run};
if(require.main===module){if(process.argv[2]==='baseline')baseline();else if(process.argv[2]==='paths')console.log(JSON.stringify(A.files()));else throw Error('Explicit baseline/paths action required');}
