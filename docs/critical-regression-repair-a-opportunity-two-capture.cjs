"use strict";
// Only one authorized existing path can change. All evidence uses exclusive create.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const T=require('./critical-regression-triage-v0.1-capture.cjs'),E=require('../tests/entry-safe-runner.cjs');
const prefix='docs/critical-regression-repair-a-opportunity-two-',report='docs/critical-regression-repair-a-opportunity-two.md';
const childPrefix='docs/test-infrastructure-sprint-0.1-repair-a-opportunity-two-';
const target='tests/high-school-year-one-opportunity-two-integration-test.js';
const owners=['defensive-opportunity-foundation.js','defensive-reach-secure-foundation.js','defensive-decision-throw-foundation.js'];
const edits=[
 {before:'"batted-ball-outcome-mapping.js", "offensive-plate-approach.js"',after:'"batted-ball-outcome-mapping.js", "defensive-opportunity-foundation.js", "defensive-reach-secure-foundation.js", "offensive-plate-approach.js"'},
 {before:'"force-advancement.js", "offensive-bunt-defensive-handoff.js"',after:'"force-advancement.js", "defensive-decision-throw-foundation.js", "offensive-bunt-defensive-handoff.js"'}
];
const isNew=p=>p.startsWith(prefix)||p.startsWith(childPrefix)||p===report;
function capture(label,data){assert(/^[a-z0-9-]+$/.test(label));const p=prefix+label+'-evidence.json';assert(!fs.existsSync(path.join(T.root,p)));fs.writeFileSync(path.join(T.root,p),JSON.stringify({task:'Critical Regression Repair A — Opportunity-two Manifest Correction',createdAt:new Date().toISOString(),...data},null,2)+'\n',{flag:'wx'});return p;}
function manifest(source){const match=source.match(/const runtimeFiles = \[([\s\S]*?)\];/);assert(match);return JSON.parse('['+match[1]+']');}
function indexManifest(){return [...fs.readFileSync(path.join(T.root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);}
function validateManifest(list){
 assert(Array.isArray(list));for(const owner of owners)assert.equal(list.filter(p=>p===owner).length,1,'Necessary module missing/duplicate: '+owner);
 const order=[['batted-ball-physical.js',owners[0]],[owners[0],owners[1]],['team-roster-foundation.js',owners[1]],[owners[1],owners[2]],['force-advancement.js',owners[2]],[owners[2],'offensive-bunt-defensive-handoff.js'],[owners[2],'batted-ball-ground-defense.js'],[owners[2],'defensive-runner-throw-settlement-foundation.js'],[owners[2],'script.js']];
 const index=indexManifest();for(const [before,after] of order){assert(list.includes(before)&&list.includes(after));assert(list.indexOf(before)<list.indexOf(after),'Dependency order: '+before+' → '+after);assert(index.indexOf(before)<index.indexOf(after),'Current index dependency order differs');}
 return {requiredOwners:owners,edges:order.map(([before,after])=>({before,after,manifestBefore:list.indexOf(before),manifestAfter:list.indexOf(after),indexBefore:index.indexOf(before),indexAfter:index.indexOf(after)}))};
}
function expected(raw){let text=raw;for(const edit of edits){assert.equal(text.split(edit.before).length-1,1);text=text.replace(edit.before,edit.after);}return text;}
function reverse(text){for(const edit of [...edits].reverse()){assert.equal(text.split(edit.after).length-1,1);text=text.replace(edit.after,edit.before);}return text;}
function baseline(){
 assert(!fs.existsSync(path.join(T.root,prefix+'baseline-evidence.json')));
 const b=T.json(T.prefix+'baseline-evidence.json'),d=T.json(T.prefix+'delivery-evidence.json');
 for(const [p,h] of Object.entries(b.hashes))assert.equal(T.fileHash(p),h,p);
 for(const [p,h] of Object.entries(d.hashes))assert.equal(T.fileHash(p),h,p);
 assert.deepEqual(T.metadata(),b.protectedMetadata);
 const git=T.gitState();for(const k of ['branch','head','main','originMain','index'])assert.equal(git[k],b.git[k]);
 const status=s=>s.split(/\r?\n/).filter(l=>l&&!isNew(l.slice(3))&&!T.isNew(l.slice(3))).sort();assert.deepEqual(status(git.status),status(b.git.status));
 const files=T.files().filter(p=>!isNew(p)),allowed=new Set([...Object.keys(b.hashes),...d.files,T.prefix+'delivery-evidence.json']);assert.deepEqual(files.filter(p=>!allowed.has(p)),[]);
 const hashes=Object.fromEntries(files.map(p=>[p,T.fileHash(p)])),source=fs.readFileSync(path.join(T.root,target),'utf8'),after=expected(source);
 assert.equal(reverse(after),source);const beforeManifest=manifest(source),afterManifest=manifest(after);assert.equal(beforeManifest.length,59);assert.equal(afterManifest.length,62);assert.deepEqual(afterManifest.filter(p=>!owners.includes(p)),beforeManifest);
 const dependencyOrder=validateManifest(afterManifest);
 capture('baseline',{git,hashes,originalTargetSource:source,originalTargetHash:hashes[target],protectedMetadata:T.metadata(),protectedContentReadOrHashed:false,priorTriageDelivery:{path:T.prefix+'delivery-evidence.json',sha256:T.fileHash(T.prefix+'delivery-evidence.json'),entries:Object.keys(d.hashes).length},remoteServerRechecked:false});
 capture('authorized-contract',{target,edits,beforeRawSha256:hashes[target],expectedAfterRawSha256:T.hash(after),beforeManifest,afterManifest,dependencyOrder,exactReverseToOpeningRawBytes:true,otherOriginalTestBytesMustRemainEqual:true,assertionLines:source.split(/\r?\n/).filter(l=>l.startsWith('verify(')),expectedAssertions:40,productionEdits:false});
 console.log(JSON.stringify({baseline:'VERIFIED',existingReadableFiles:files.length,protectedPaths:T.protectedPaths.size,beforeModules:59,afterModules:62,authorizedTarget:target}));
}
function integrity(repaired=true){
 const b=T.json(prefix+'baseline-evidence.json'),changed=[];
 for(const [p,h] of Object.entries(b.hashes)){const actual=T.fileHash(p);if(actual===h)continue;assert(repaired&&p===target,'Non-authorized change: '+p);assert.equal(fs.readFileSync(path.join(T.root,p),'utf8'),expected(b.originalTargetSource));changed.push(p);}
 if(repaired)assert.deepEqual(changed,[target]);else assert.deepEqual(changed,[]);
 assert.deepEqual(T.metadata(),b.protectedMetadata);const git=T.gitState();for(const k of ['branch','head','main','originMain','index'])assert.equal(git[k],b.git[k]);
 const status=s=>s.split(/\r?\n/).filter(l=>l&&!isNew(l.slice(3))&&l.slice(3)!==target).sort();assert.deepEqual(status(git.status),status(b.git.status));
 assert.deepEqual(T.files().filter(p=>!(p in b.hashes)&&!isNew(p)),[]);
 return {preservedExistingHashes:Object.keys(b.hashes).length-changed.length,existingReadableFiles:Object.keys(b.hashes).length,changedExistingPaths:changed,productionDelta:0,formalTestChangedPaths:changed,protectedMetadataUnchanged:true,protectedContentReadOrHashed:false,git};
}
function repair(){integrity(false);const b=T.json(prefix+'baseline-evidence.json'),after=expected(b.originalTargetSource),contract=T.json(prefix+'authorized-contract-evidence.json');assert.equal(T.hash(after),contract.expectedAfterRawSha256);fs.writeFileSync(path.join(T.root,target),after);integrity();assert.equal(reverse(fs.readFileSync(path.join(T.root,target),'utf8')),b.originalTargetSource);capture('authorized-change',{file:target,beforeSha256:b.hashes[target],afterSha256:T.fileHash(target),exactReverseSha256:T.hash(reverse(after)),dependencyOrder:validateManifest(manifest(after)),rawByteChangesOnlyTwoManifestInsertions:true,assertionsFixturesSeedsAndOtherSourceBytesUnchanged:true,diff:T.git('diff','--',target)});console.log(JSON.stringify({repaired:target,sha256:T.fileHash(target),exactReverse:true}));}
function run(label,file){
 integrity();assert(/^[a-z0-9-]+$/.test(label));const b=T.json(prefix+'baseline-evidence.json');const relevant=Object.keys(b.hashes).filter(p=>!p.startsWith('docs/')&&/\.(js|cjs|json|html)$/.test(p));
 const evidencePath=childPrefix+label+'-evidence.json',row=E.runSuite({suiteName:label,file,entryMode:'standalone',evidencePath,relevantPaths:[...relevant,prefix+'capture.cjs']});
 integrity();console.log(JSON.stringify({label,status:row.status,exitCode:row.exitCode,elapsedMs:row.elapsedMs,entryVerified:row.entryVerified,sourceStable:row.sourceStable,stdoutTail:row.stdout.slice(-1600),stderr:row.stderr,evidencePath}));return row;
}
module.exports={...T,prefix,childPrefix,report,target,owners,edits,isNew,capture,manifest,indexManifest,validateManifest,expected,reverse,integrity,run};
if(require.main===module){const action=process.argv[2];if(action==='baseline')baseline();else if(action==='repair')repair();else if(action==='paths')console.log(JSON.stringify(T.files()));else throw Error('Explicit baseline/repair/paths action required');}
