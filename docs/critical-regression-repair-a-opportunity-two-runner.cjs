"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./critical-regression-repair-a-opportunity-two-capture.cjs');
const specs=[
 {label:'formal',file:C.target,checks:40,summary:/High School Year One Opportunity Two Integration: 40\/40 passed\./},
 {label:'ss-defense-63',file:'tests/ss-defensive-production-integration-test.js',checks:26,summary:/\{"suite":"ss-defensive-production-integration","passed":26,"failed":0/},
 {label:'ground-lifecycle',file:'tests/ground-ball-defensive-settlement-lifecycle-regression-test.js',checks:26,summary:/26\/26 PASS/},
 {label:'runner-throw-settlement',file:'tests/defensive-runner-throw-settlement-foundation-test.js',checks:22,summary:/Final: 22\/22 PASS/},
 {label:'force-settlement-production',file:'tests/force-multi-runner-settlement-production-integration-test.js',checks:16,summary:/Force multi-runner production integration: 16\/16 PASS/}
];
function buildNegatives(){
 C.integrity();const source=fs.readFileSync(path.join(C.root,C.target),'utf8'),rows=[];
 for(const [i,omitted] of C.owners.entries()){
  const literal='"'+omitted+'", ';assert.equal(source.split(literal).length-1,1);
  const mutant=source.replace(literal,'');const anchor='const evaluate = expression => vm.runInContext(expression, context);';
  const observation='console.log("MISSING_OWNER_WITNESS "+JSON.stringify({omitted:'+JSON.stringify(omitted)+',globals:vm.runInContext("({DefensiveOpportunityFoundation:typeof DefensiveOpportunityFoundation,DefensiveReachSecureFoundation:typeof DefensiveReachSecureFoundation,DefensiveDecisionThrowFoundation:typeof DefensiveDecisionThrowFoundation})",context)}));\n';
  const text=mutant.replace(anchor,observation+anchor),file=C.prefix+'missing-owner-'+(i+1)+'-isolated.cjs';
  assert.equal(mutant.split(omitted).length-1,0);assert.deepEqual(C.manifest(mutant),C.manifest(source).filter(p=>p!==omitted));
  assert.equal(text.replace(observation,''),mutant);
  assert(!fs.existsSync(path.join(C.root,file)));fs.writeFileSync(path.join(C.root,file),text,{flag:'wx'});
  rows.push({omitted,file,originalRepairedSha256:C.fileHash(C.target),isolatedSha256:C.fileHash(file),removal:{literal,offset:source.indexOf(literal)},observation,allOtherOriginalSourceBytesUnchanged:true,actualOwnersOnly:true});
 }
 C.capture('negative-contract',{rows,requiredOwners:C.owners,policy:'Each standalone original-suite copy omits exactly one real module; original fixtures/seeds/40 assertions remain. Expected runtime failure must be observed, never reclassified as a suite PASS.'});
 console.log(JSON.stringify({isolatedMissingOwnerCopies:rows.length}));
}
function runNegatives(){
 const rows=C.json(C.prefix+'negative-contract-evidence.json').rows,results=[];
 for(const [i,row] of rows.entries()){
  const result=C.run('missing-owner-'+(i+1),row.file);
  const witnessLine=result.stdout.split('\n').find(l=>l.startsWith('MISSING_OWNER_WITNESS '));assert(witnessLine);
  const witness=JSON.parse(witnessLine.slice('MISSING_OWNER_WITNESS '.length)),key=row.omitted==='defensive-opportunity-foundation.js'?'DefensiveOpportunityFoundation':row.omitted==='defensive-reach-secure-foundation.js'?'DefensiveReachSecureFoundation':'DefensiveDecisionThrowFoundation';
  assert.equal(witness.globals[key],'undefined');assert.equal(result.status,'FAIL','Missing owner must never produce a suite PASS');assert.equal(result.exitCode,1);assert(result.entryVerified&&result.sourceStable);assert(!result.spawnError&&result.signal===null);
  assert.equal(result.assertionEvidence.assertions.passed,37,'Expected original check 38 runtime boundary');assert.equal(result.assertionEvidence.assertions.thrown,0);assert(!result.stdout.includes('40/40 passed.'));
  assert(/buildHighSchoolShortstopExecution|resolveHighSchoolCanonicalSecure|resolveHighSchoolCanonicalReach/.test(result.stderr),'Unexpected missing-owner error boundary');
  results.push({omitted:row.omitted,suiteStatus:result.status,negativeValidation:'PASS',exitCode:result.exitCode,successfulOriginalChecks:37,missingGlobalWitness:witness,actualRuntimeError:result.assertionEvidence.unhandledError,rawEvidence:C.childPrefix+'missing-owner-'+(i+1)+'-evidence.json'});
 }
 const good=C.manifest(fs.readFileSync(path.join(C.root,C.target),'utf8')),contractCases=[];
 C.validateManifest(good);contractCases.push({case:'reviewed-manifest',expected:'ACCEPT',passed:true});
 for(const owner of C.owners){
  for(const [kind,mutate] of [
   ['missing',list=>list.filter(p=>p!==owner)],
   ['duplicate',list=>[...list,owner]],
   ['moved-before-dependencies',list=>[owner,...list.filter(p=>p!==owner)]]
  ]){const list=mutate(good);assert.notDeepEqual(list,good);assert.throws(()=>C.validateManifest(list));contractCases.push({case:kind,owner,expected:'REJECT',passed:true});}
 }
 C.capture('negative-validation',{runtimeNegativeResults:results,runtimeNegativeValidations:{passed:3,total:3},manifestContractCases:contractCases,manifestContractValidations:{passed:10,total:10},copiesRetainOfficialFailStatus:true});
 console.log(JSON.stringify({runtimeMissingOwnerRejections:'3/3',manifestChecks:'10/10'}));
}
function acceptance(){
 C.integrity();const results=[];
 for(const spec of specs){
  const evidence=C.childPrefix+spec.label+'-evidence.json',alreadyCaptured=fs.existsSync(path.join(C.root,evidence));
  const row=alreadyCaptured?C.json(evidence):C.run(spec.label,spec.file);
  if(alreadyCaptured){C.integrity();assert.equal(row.file,spec.file);for(const [p,h] of Object.entries(row.relevantSourceHashesAfter))assert.equal(C.fileHash(p),h,'Captured relevant source changed: '+p);assert.deepEqual(row.relevantSourceHashesBefore,row.relevantSourceHashesAfter);}
  assert.equal(row.status,'PASS','Stop: newly failing '+spec.file);assert(row.entryVerified&&row.sourceStable);assert(spec.summary.test(row.stdout),'Missing exact complete final summary');const passedLines=row.stdout.split('\n').filter(l=>spec.label==='formal'?l.startsWith('✓ '):l.startsWith('PASS '));assert.equal(passedLines.length,spec.checks,'Declared suite checks differ');results.push({file:spec.file,label:spec.label,checks:spec.checks,status:row.status,exitCode:row.exitCode,elapsedMs:row.elapsedMs,successfulNodeAssertions:row.successfulAssertions,mainMatches:row.assertionEvidence.standaloneMainMatches,finalSummaryVerified:true,sourceStable:true,evidence,alreadyCapturedRevalidatedWithoutRerun:alreadyCaptured});
 }
 C.capture('acceptance',{results,formalChecks:40,relatedChecks:90,suiteInvocations:5,runtimeNegativeInvocations:3,totalChildInvocations:8,manifestOnlyRepair:true,productionDelta:0,full251:0,r6Full227:0,firstBaseTiming:0,receiverV2Integration:0,matchFixtureRepair:0,gradientRepair:0,readyForCommit:'NO'});
 console.log(JSON.stringify({formal:'40/40 PASS',related:'90/90 PASS',suiteInvocations:5,totalChildInvocations:8}));
}
module.exports={specs};
if(require.main===module){const action=process.argv[2];if(action==='build-negatives')buildNegatives();else if(action==='negatives')runNegatives();else if(action==='acceptance')acceptance();else throw Error('Explicit action required');}
