"use strict";
// Read-only audit bookkeeping. New artifacts are exclusively created.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const B=require('./critical-regression-repair-b1-canonical-match-fixture-contract-capture.cjs');
const E=require('../tests/entry-safe-runner.cjs');
const prefix='docs/match-admission-moment-eligibility-contract-v0.1-',report='docs/match-admission-moment-eligibility-contract-v0.1.md';
const childPrefix='docs/test-infrastructure-sprint-0.1-admission-moment-contract-v0.1-';
const isNew=p=>p===report||p.startsWith(prefix)||p.startsWith(childPrefix);
function capture(label,data){assert(/^[a-z0-9-]+$/.test(label));const p=prefix+label+'-evidence.json';assert(!fs.existsSync(path.join(B.root,p)),p);fs.writeFileSync(path.join(B.root,p),JSON.stringify({task:'Match Admission & Moment Eligibility Contract v0.1',createdAt:new Date().toISOString(),...data},null,2)+'\n',{flag:'wx'});return p;}
function baseline(){
 const b=B.json(B.prefix+'baseline-evidence.json'),d=B.json(B.prefix+'delivery-evidence.json'),c=B.json(B.prefix+'closeout-evidence.json');
 for(const [p,h] of Object.entries(b.hashes))assert.equal(B.fileHash(p),h,p);
 for(const [p,h] of Object.entries(d.hashes))assert.equal(B.fileHash(p),h,p);
 assert.deepEqual(B.metadata(),b.protectedMetadata);
 const git=B.gitState();for(const k of ['branch','head','main','originMain','index'])assert.equal(git[k],c.git[k],k);
 const finalArtifacts=new Set([B.prefix+'closeout-evidence.json',B.prefix+'delivery-evidence.json']);
 const status=s=>s.split(/\r?\n/).filter(l=>l&&!isNew(l.slice(3))&&!finalArtifacts.has(l.slice(3))).sort();assert.deepEqual(status(git.status),status(c.git.status));
 const files=B.files().filter(p=>!isNew(p)),allowed=new Set([...Object.keys(b.hashes),...d.files,B.prefix+'delivery-evidence.json']);assert.deepEqual(files.filter(p=>!allowed.has(p)),[]);
 const hashes=Object.fromEntries(files.map(p=>[p,B.fileHash(p)]));
 capture('baseline',{git,hashes,readableExistingFiles:files.length,priorBaselineVerified:Object.keys(b.hashes).length,priorDeliveryVerified:Object.keys(d.hashes).length,priorDelivery:{path:B.prefix+'delivery-evidence.json',sha256:B.fileHash(B.prefix+'delivery-evidence.json')},protectedMetadata:B.metadata(),protectedContentReadOrHashed:false,remoteServerRechecked:false,productionEditsAuthorized:false,formalTestOrFixtureEditsAuthorized:false,preflightBookkeepingCorrection:{reason:'B1 closeout Git snapshot precedes its own closeout/delivery files. Both final artifacts are explicitly accounted for by the verified delivery and current inventory; only new audit utility corrected.',unexpectedExistingChanges:[],suiteInvocationsBeforeCorrection:0,initialInteractiveStderrComplete:false}});
 console.log(JSON.stringify({baseline:'VERIFIED',readableExistingFiles:files.length,protectedPaths:B.protectedPaths.size,indexEmpty:true}));
}
function integrity(){const b=B.json(prefix+'baseline-evidence.json');for(const [p,h] of Object.entries(b.hashes))assert.equal(B.fileHash(p),h,p);assert.deepEqual(B.metadata(),b.protectedMetadata);const git=B.gitState();for(const k of ['branch','head','main','originMain','index'])assert.equal(git[k],b.git[k]);const status=s=>s.split(/\r?\n/).filter(l=>l&&!isNew(l.slice(3))).sort();assert.deepEqual(status(git.status),status(b.git.status));assert.deepEqual(B.files().filter(p=>!(p in b.hashes)&&!isNew(p)),[]);return{preservedExistingHashes:Object.keys(b.hashes).length,changedExistingPaths:[],productionDelta:0,formalTestDelta:0,existingFixtureDelta:0,protectedMetadataUnchanged:true,protectedContentReadOrHashed:false,git};}
function run(label,file,extra=[]){integrity();const b=B.json(prefix+'baseline-evidence.json'),relevant=Object.keys(b.hashes).filter(p=>!p.startsWith('docs/')&&/\.(js|cjs|json|html)$/.test(p));const evidencePath=childPrefix+label+'-evidence.json',row=E.runSuite({suiteName:label,file,entryMode:'standalone',evidencePath,relevantPaths:[...relevant,prefix+'capture.cjs',...extra]});integrity();console.log(JSON.stringify({label,status:row.status,exitCode:row.exitCode,elapsedMs:row.elapsedMs,entryVerified:row.entryVerified,sourceStable:row.sourceStable,stdoutTail:row.stdout.slice(-2000),stderr:row.stderr,evidencePath}));return row;}
module.exports={...B,prefix,childPrefix,report,isNew,capture,integrity,run};
if(require.main===module){if(process.argv[2]==='baseline')baseline();else if(process.argv[2]==='integrity')console.log(JSON.stringify(integrity()));else throw Error('Explicit action required');}
