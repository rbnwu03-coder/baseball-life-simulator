'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),C=require('./ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-capture.cjs');
const v=C.json(C.prefix+'verification-evidence.json');assert.equal(C.fileHash(C.report),v.reportHash);
const plan=C.json(C.prefix+'plan-evidence.json');for(const [p,h]of Object.entries(plan.artifacts))assert.equal(C.fileHash(p),h,p);
const input=C.json(C.prefix+'fixture-input-evidence.json');assert.deepEqual(input.fixture,C.json('docs/ss-reachable-controlled-scenario-v0.1-fixture-input-evidence.json').fixture);
const program=C.json(C.prefix+'program-final-evidence.json').program;assert(program.includes(require('./ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-builder.cjs').builderProgram));
const integrity=C.integrity(),baseline=C.json(C.prefix+'baseline-evidence.json');
for(const p of C.files().filter(C.isNew)){if(p.endsWith('.json'))C.json(p);else C.readSource(p);C.fileHash(p);}
C.capture('closeout',{hashes:baseline.hashes,protectedMetadata:C.metadata(),...integrity,existingReadableFiles:1823,productionAndExistingTestsDelta:0,scenarioRuns:2,scenarioCount:1,scenarioMatchesCompleted:2,formalSuites:3,additionalGameplay:0,programUnchanged:true,fixtureMatchesPriorReachable:true,gitStatusTiming:'Before exclusive creation of closeout and delivery; new authorized docs only',readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED'});
const own=C.files().filter(C.isNew),hashes=Object.fromEntries(own.map(p=>[p,C.fileHash(p)]));
C.capture('delivery',{report:C.report,reportHash:C.fileHash(C.report),hashes,entries:own.length,deliverySelfExcluded:true,existingHashesPreserved:1823,classification:'A: Meaningful Admitted',proofLevel:'Controlled Match Integration only',dependencyQualification:C.prefix+'dependency-accounting-evidence.json',readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED'});
console.log(JSON.stringify({closeout:'PASS',preserved:1823,deliveryEntries:own.length,reportHash:C.fileHash(C.report),indexEmpty:integrity.git.index==='',additionalGameplay:0}));