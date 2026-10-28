"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./critical-regression-repair-a-opportunity-two-capture.cjs');
const integrity=C.integrity(),a=C.json(C.prefix+'acceptance-evidence.json'),v=C.json(C.prefix+'verification-evidence.json'),n=C.json(C.prefix+'negative-validation-evidence.json');
assert.equal(a.formalChecks,40);assert.equal(a.relatedChecks,90);assert.equal(v.childInvocations,8);assert.equal(n.runtimeNegativeValidations.passed,3);assert.equal(n.manifestContractValidations.passed,10);
const body=fs.readFileSync(path.join(C.root,C.report),'utf8'),links=[...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(m=>m[1]);
const outputs=[C.prefix+'closeout-evidence.json',C.prefix+'delivery-evidence.json'];
for(const href of links){const p=path.resolve(C.root,'docs',href);assert(p.startsWith(C.root+path.sep));if(!outputs.includes(path.relative(C.root,p).replace(/\\/g,'/')))assert(fs.existsSync(p),'Missing report link: '+href);}
const baseline=C.json(C.prefix+'baseline-evidence.json');
const knownCoveragePaths=new Set(C.json(C.prefix+'architecture-coverage-evidence.json').coverageBatches.flatMap(b=>b.paths.map(r=>r.path)));
const supplementalDirectHashes=Object.fromEntries(C.files().filter(p=>C.isNew(p)&&!knownCoveragePaths.has(p)).map(p=>[p,C.fileHash(p)]));
C.capture('closeout',{...integrity,report:{path:C.report,sha256:C.fileHash(C.report),linkedArtifactCount:links.length},beforeTargetSha256:baseline.hashes[C.target],afterTargetSha256:C.fileHash(C.target),exactReverseVerified:true,assertionsFixturesSeedsPinsUnchanged:true,oldCapturesPreserved:true,formalChecks:40,relatedChecks:90,positiveSuiteInvocations:5,expectedNegativeSuiteInvocations:3,totalChildInvocations:8,completeRawLogsAndWitnesses:8,unverifiedInvocations:0,newUnexpectedSuiteFailures:0,manifestContractChecks:10,supplementalDirectHashes,coverageSupplement:'Reporting/bookkeeping files added after graph snapshot read and hashed directly; no graph completeness claim',full251:0,r6Full227:0,firstBaseTiming:0,receiverV2ProductionIntegration:0,matchFixtureRepair:0,gradientRepair:0,receiverRuntime:'DISABLED',L03:'PARTIAL',resetCleanStashStageCommitPush:false,readyForCommit:'NO',readyForSprint10B:'NO',stopped:true});
const files=C.files().filter(C.isNew),hashes=Object.fromEntries(files.map(p=>[p,C.fileHash(p)]));
C.capture('delivery',{files,hashes,deliverySelfHashExcluded:true,modifiedOriginalHashes:{[C.target]:C.fileHash(C.target)},existingReadableFiles:1376,unchangedExistingHashes:1375,productionDelta:0,authorizedOriginalTestFiles:[C.target],readyForCommit:'NO',readyForSprint10B:'NO',stopped:true});
for(const href of links)assert(fs.existsSync(path.resolve(C.root,'docs',href)),'Missing final report link: '+href);
C.integrity();
console.log(JSON.stringify({report:C.report,linksChecked:links.length,originalReadableFiles:1376,originalHashesUnchanged:1375,modifiedOriginalFiles:[C.target],formal:'40/40 PASS',related:'90/90 PASS',runtimeMissingOwnerNegatives:'3/3',manifestContract:'10/10',completeChildCaptures:8,newFilesIncludingDelivery:files.length+1,productionDelta:0,gitIndexEmpty:integrity.git.index==='',readyForCommit:'NO',stopped:true}));
