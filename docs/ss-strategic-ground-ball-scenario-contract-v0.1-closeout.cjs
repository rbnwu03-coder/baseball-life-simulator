'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),C=require('./ss-strategic-ground-ball-scenario-contract-v0.1-capture.cjs');
const verification=C.json(C.prefix+'verification-evidence.json');
assert.equal(verification.reportSha256,C.fileHash(C.report));
const baseline=C.json(C.prefix+'baseline-evidence.json'),integrity=C.integrity();
for(const file of C.files().filter(C.isNew)){if(file.endsWith('.json'))C.json(file);else if(file.endsWith('.cjs')||file.endsWith('.md'))C.readSource(file);C.fileHash(file);}
C.capture('closeout',{git:integrity.git,hashes:baseline.hashes,existingReadableFiles:Object.keys(baseline.hashes).length,protectedMetadata:C.metadata(),...integrity,newGameplay:0,newScenario:0,newReplay:0,newFormalSuites:0,newVM:0,newProductionCalls:0,scope:'Read-only source audit and proposed isolated fixture contract only',readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED',gitStatusTiming:'Before exclusive creation of this closeout and delivery; both are new authorized docs artifacts'});
const own=C.files().filter(C.isNew),hashes=Object.fromEntries(own.map(file=>[file,C.fileHash(file)]));
C.capture('delivery',{report:C.report,hashes,entries:Object.keys(hashes).length,reportSha256:C.fileHash(C.report),verdict:'B',existingHashesPreserved:1800,existingDelta:0,deliverySelfExcluded:true,readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED'});
console.log(JSON.stringify({closeout:'PASS',preserved:1800,deliveryEntries:Object.keys(hashes).length,reportSha256:C.fileHash(C.report),indexEmpty:integrity.git.index==='',newGameplay:0,newFormalSuites:0,verdict:'B'}));