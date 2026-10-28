"use strict";
// Read immutable evidence and source only. Never require discovered tests/runners.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const C=require('./current-test-baseline-verification-v0.1-capture.cjs');
const auditPath='docs/test-reliability-audit-v0.1-inventory-final-evidence.json',audit=C.json(auditPath),oldBaseline=C.json('docs/test-reliability-audit-v0.1-baseline-evidence.json');
const paths=cp.execFileSync('rg',['--files','tests'],{cwd:C.root,encoding:'utf8'}).split(/\r?\n/).filter(Boolean).map(p=>p.replace(/\\/g,'/')).sort();
const special=['tests/callbackTest.js','tests/receiver-execution-v2-sprint-9-legacy-comparison.cjs','tests/receiver-execution-v2-sprint-10a3b-legacy-comparison.cjs'];
const suitePaths=paths.filter(p=>/-test\.(js|cjs)$/.test(p)||p==='tests/vertical-slice-smoke.js'||special.includes(p));
const fullPath='docs/infield-legacy-receiver-model-sprint-6-validation-final.json',full=C.json(fullPath);
assert.equal(full.files.length,227);assert.equal(C.hash(JSON.stringify(full.files)),'871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96');
const R=require('../tests/entry-safe-runner.cjs'),registry=Object.entries(R.registry).map(([name,spec])=>({name,...spec}));
const hashCache=new Map();function currentHash(p){p=path.posix.normalize(p);if(C.protectedPaths.has(p))return null;if(!hashCache.has(p))hashCache.set(p,C.fileHash(p));return hashCache.get(p);}
const changedSinceAudit=Object.keys(oldBaseline.hashes).filter(p=>currentHash(p)!==oldBaseline.hashes[p]);
const accepted=[];
function evidence(file,origin){
 const e=C.json(file);assert(['PASS','FAIL'].includes(e.status),file);assert(e.entryVerified&&e.sourceStable,file);assert.equal(e.relevantSourceHashesBefore[e.file],e.relevantSourceHashesAfter[e.file]);
 const witness=e.assertionEvidence;assert(witness.entryStarted);assert(witness.entryMode===e.entryMode);if(e.entryMode==='standalone')assert(witness.standaloneMainMatches);
 if(e.status==='PASS'){assert.equal(e.exitCode,0);assert(witness.assertions.passed>0||e.customCheckerInvocations>0);}
 else assert.notEqual(e.exitCode,0);
 const drift=Object.entries(e.relevantSourceHashesAfter).filter(([p,h])=>currentHash(p)!==h).map(([p])=>p);
 assert(drift.every(p=>changedSinceAudit.includes(p)),file+' unexpected historical source drift: '+drift.join(','));
 const row={file:e.file,status:e.status,origin,evidence:file,evidenceSha256:currentHash(file),startedAt:e.startedAt,actualCommand:e.actualCommand,
  entryMode:e.entryMode,entryVerified:true,sourceStableDuringExecution:true,exitCode:e.exitCode,elapsedMs:e.elapsedMs,
  successfulNodeAssertions:e.successfulAssertions,customCheckerCalls:e.customCheckerInvocations,summary:witness.summary||null,
  targetSourceHash:e.relevantSourceHashesAfter[e.file],targetSourceMatchesCurrent:currentHash(e.file)===e.relevantSourceHashesAfter[e.file],
  declaredRelevantHashDrift:drift,primaryFailure:e.status==='FAIL'?(witness.unhandledError?.message||e.stderr.split(/\r?\n/).find(l=>l.includes('AssertionError'))):null,
  rawStdoutSha256:C.hash(e.stdout),rawStderrSha256:C.hash(e.stderr),policy:e.policy,witness:e.witnessPath};accepted.push(row);return row;
}
const selected=[
 ['docs/test-infrastructure-sprint-0.1-contextual-status-panel-accepted-evidence.json','Entry-Safe accepted historical'],
 ['docs/test-infrastructure-sprint-0.1-outcome-transition-hierarchy-accepted-evidence.json','Entry-Safe accepted historical'],
 ['docs/test-infrastructure-sprint-0.1-pitch-tactical-decision-production-adapter-accepted-evidence.json','Entry-Safe accepted historical'],
 ...['decision','interpretation','adapter-integration','intent-evidence','signal-projection','index-caller','save-v1','save-boundary','r1-save','r3-guard','legacy-historical'].map(n=>['docs/test-infrastructure-sprint-0.1-phase-b-'+n+'-evidence.json','Phase B historical accepted formal']),
 ...['formal','ss-defense-63','ground-lifecycle','runner-throw-settlement','force-settlement-production'].map(n=>['docs/test-infrastructure-sprint-0.1-repair-a-opportunity-two-'+n+'-evidence.json','Repair A historical accepted formal']),
 ...['canonical','routine','match-game-record','ground-settlement'].map(n=>['docs/test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-'+n+'-evidence.json','Sprint 1 historical accepted formal']),
 ...['match','gradient'].map(n=>['docs/test-infrastructure-sprint-0.1-critical-triage-'+n+'-original-evidence.json','Triage historical original formal FAIL']),
 ...C.json(C.prefix+'targeted-execution-evidence.json').results.map(r=>[r.raw,'THIS TURN targeted standalone'])
];
for(const [p,origin]of selected)evidence(p,origin);
const rows=suitePaths.map(file=>{
 const old=audit.rows.find(r=>r.file===file),protectedPath=C.protectedPaths.has(file);
 const source=protectedPath?null:fs.readFileSync(path.join(C.root,file),'utf8');
 const dependencies=[...new Set((old?.staticDependencyPaths||[]).map(p=>path.posix.normalize(p)))];
 const drift=[file,...dependencies].filter(p=>oldBaseline.hashes[p]&&currentHash(p)!==oldBaseline.hashes[p]);
 const ownEvidence=accepted.filter(r=>r.file===file),valid=ownEvidence.filter(r=>r.targetSourceMatchesCurrent),latest=valid.at(-1);
 const history=[...(old?[{origin:'Original Reliability Audit',status:old.status,evidence:old.confirmedEvidence?.evidence||null,sourceHash:old.sha256||null,observedCommand:old.observedCommand||null}]:[]),...ownEvidence];
 let status=old?.status||'UNVERIFIED',reason=old?.status==='PASS'?'Historical audit accepted execution; source and reviewed dependency candidates preserved':'No accepted current-source assertion execution';
 let chosen=old?.confirmedEvidence?{origin:'Original Reliability Audit accepted evidence',...old.confirmedEvidence}:null;
 if(protectedPath){status='BLOCKED';reason='Protected path: reading and execution prohibited; metadata only, historical audit UNVERIFIED';chosen=null;}
 else if(latest){status=latest.status;reason='Accepted '+latest.origin+'; target source matches current';chosen=latest;}
 else if(drift.length){status='UNVERIFIED';reason='Historical dependency/source changed; no matching accepted replacement execution';chosen=null;}
 const newSuite=!old;
 if(file==='tests/entry-safe-runner-test.cjs'){
  const p='docs/test-infrastructure-sprint-0.1-accepted-focused-driver-evidence.json',focused='docs/test-infrastructure-sprint-0.1-accepted-focused-evidence.json',raw=C.json(p),f=C.json(focused);
  assert.equal(raw.exitCode,0);assert.equal(f.summary.passed,25);assert.equal(f.summary.failed,0);
  const delivery=C.json('docs/test-infrastructure-sprint-0.1-delivery-evidence.json');assert.equal(currentHash(file),delivery.hashes[file]);
  history.push({origin:'Entry-Safe historical parent and 25 validator cases',status:'PASS',checks:25,evidence:p,validatorEvidence:focused,actualCommand:raw.actualCommand,currentSourceMatchesAcceptedDelivery:true});
  status='BLOCKED';chosen=null;reason='Default label development-1 reuses existing child capture paths (its focused parent capture is absent). A new label still invokes immutable old 966-file/WIP integrity guard, which rejects the six authorized later test edits. No safe current rerun under unchanged suite; NOT EXECUTED here.';
 }
 const verifiedEntry=latest?{status:'VERIFIED with recorded Entry-Safe profile',mode:latest.entryMode,origin:latest.origin}:protectedPath?{status:'BLOCKED protected; source not inspected'}:
  file==='tests/entry-safe-runner-test.cjs'?{status:'BLOCKED side-effectful old capture/WIP guard; historical direct standalone only'}:
  {status:'UNVERIFIED Entry-Safe adoption; historical/proposed entry kept separately',mode:old?.observedExecutionKind?.startsWith('R6 in-process')?'historical exported run (not reconstructed shell command)':'standalone candidate'};
 const reused=chosen&&chosen.origin!=='THIS TURN targeted standalone';
 return{stableId:'suite:'+file,legacyStableIdentity:old?.file||null,file,newSuite,protected:protectedPath,sourceReadOrHashed:!protectedPath,
  sha256:protectedPath?null:currentHash(file),historicalAuditStatus:old?.status||null,status,reason,selectedEvidence:chosen,history,
  evidenceAge:chosen?(reused?'HISTORICAL REUSED / not executed this turn':'THIS TURN NEW EXECUTION'):status==='BLOCKED'?'BLOCKED / NOT EXECUTED':'NO ACCEPTED CURRENT PROOF',
  legacyEntryGuard:old?.entryGuard??null,mainGuard:source?/require\.main\s*===\s*module/.test(source):null,
  entrySafe:verifiedEntry,cliRegistryNames:registry.filter(r=>r.file===file).map(r=>r.name),inFixedR6Full227:full.files.includes(file),
  defaultStandaloneCommand:protectedPath?null:[process.execPath,file],commandIsProposedOnly:!latest,
  staticDependencyPaths:dependencies,dependencyChangesSinceAudit:drift,
  historicalInputFreshness:{ownSource:old&&!protectedPath?old.sha256===currentHash(file):null,knownClosureUnchanged:drift.length===0,
   caveat:'Literal/index-derived candidates from reviewed audit; dynamic aliases and option-selected paths are not exhaustively traced. Selected raw evidence may declare a wider hash superset; unrelated historical drift is retained, not silently discarded.'},
  primaryType:old?.primaryType||(/contract|entry-safe-runner/.test(file)?'Contract':'Integration')};
});
assert.equal(rows.length,255);assert.equal(new Set(rows.map(r=>r.stableId)).size,rows.length);assert(audit.rows.every(r=>suitePaths.includes(r.file)));
for(const r of rows.filter(r=>r.status==='PASS'&&!r.selectedEvidence?.entryVerified))assert.equal(r.dependencyChangesSinceAudit.length,0,r.file);
const count=list=>list.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{PASS:0,FAIL:0,UNVERIFIED:0,BLOCKED:0});
const counters={allTestDirectoryFiles:paths.length,jsCjsFiles:paths.filter(p=>/\.(js|cjs)$/.test(p)).length,browserFixtures:paths.filter(p=>p.endsWith('.html')).length,
 oldSuiteEntries:251,newSuiteEntries:rows.filter(r=>r.newSuite).length,currentSuiteEntries:rows.length,standardNamedSuites:suitePaths.filter(p=>/-test\.(js|cjs)$/.test(p)).length,
 nonstandardSuiteEntries:4,helpersRunnersProbes:paths.filter(p=>/\.(js|cjs)$/.test(p)&&!suitePaths.includes(p)).length,
 status:count(rows),oldSuiteStatus:count(rows.filter(r=>!r.newSuite)),newSuiteStatus:count(rows.filter(r=>r.newSuite)),
 evidenceAge:{newlyExecuted:rows.filter(r=>r.evidenceAge==='THIS TURN NEW EXECUTION').length,historicalReused:rows.filter(r=>r.evidenceAge.startsWith('HISTORICAL')).length},
 entrySafeVerifiedProfiles:rows.filter(r=>r.entrySafe.status.startsWith('VERIFIED')).length,entrySafeCliRegistered:registry.length,fixedR6Full227:227};
const otherFiles=paths.filter(p=>!suitePaths.includes(p)).map(file=>({stableId:(file.endsWith('.html')?'browser:':'support:')+file,file,
 role:file.endsWith('.html')?'Browser fixture':/runner|closeout|probe|calibration|independent-review/.test(file)?'Runner/probe/evidence utility':'Helper/support module',
 status:file.endsWith('.html')?'UNVERIFIED':'NOT A SUITE',reason:file.endsWith('.html')?'No browser execution accepted; browser full forbidden this turn':'No independent assertion-bearing suite identity under reviewed inventory definition'}));
const output={definition:'One assertion-bearing entry FILE = one suite. A suite may contain many assertions. Original 251 plus four new files, no duplicate runs/cases/diagnostics/helpers.',counters,
 originalAudit:{file:auditPath,sha256:currentHash(auditPath),status:audit.counters.status},changedSinceAudit,registrySources:{packageJson:'package.json',scripts:C.json('package.json').scripts,
 entrySafe:{path:'tests/entry-safe-runner.cjs',registry,explicitApiBeyondCli:true,newSuitesAutoRegistered:false},fixedR6:{runner:'tests/receiver-execution-v2-sprint-10a3b-r6-runner.cjs',manifest:fullPath,manifestSha256:C.hash(JSON.stringify(full.files)),count:227,newSuitesIncluded:rows.filter(r=>r.newSuite&&r.inFixedR6Full227).map(r=>r.file)},
 protectedUmbrella:{path:'tests/fast-check-smoke-test.cjs',contentRead:false,registrationContents:'NOT INSPECTED; do not assume new suites joined umbrella'}},
 rows,otherFiles,acceptedRawEvidence:accepted,statusDefinitions:{PASS:'Accepted actual entry/complete assertion execution with current tested source and bounded reviewed inputs; evidence age explicit',FAIL:'Actual original formal suite failed; accepted unchanged-input historical failure can be carried forward, not a new invocation',UNVERIFIED:'No accepted current-source execution; includes untouched unknowns, never inferred from diagnostics',BLOCKED:'Concrete protected access or capture/WIP guard prevents safe unchanged entry; no new runtime FAIL claimed'},
 formalSuiteExecutionsThisTurn:2,diagnosticExecutionsThisTurn:0,allTestsGreen:false,wholeRepositoryRun:false};
C.capture('inventory-final',output);
let md='# Current Test Baseline Verification v0.1 — 完整套件入口清單\n\n255個stable suite identities；原251＋新4。Suite entry file、Suite內checks與Node assertion calls不互換。13個browser fixtures與65個support files另列。Machine inventory另存完整hash、原指令／evidence history、依賴候選及入口狀態。\n\n[完整JSON](current-test-baseline-verification-v0.1-inventory-final-evidence.json)\n\n';
for(const status of ['FAIL','BLOCKED','UNVERIFIED','PASS']){const list=rows.filter(r=>r.status===status);md+='## '+status+' — '+list.length+'\n\n| Stable identity／File | 新增？ | 採信證據時點 | 入口／限制 | Evidence |\n|---|---|---|---|---|\n';
 for(const r of list){const e=r.selectedEvidence?.evidence;md+='| '+r.stableId+' | '+(r.newSuite?'NEW':'原251')+' | '+r.evidenceAge+' | '+r.reason.replace(/\|/g,'／')+'；'+r.entrySafe.status+' | '+(e?'[capture]('+path.posix.basename(e)+')':r.history.at(-1)?.evidence?'[historical only]('+path.posix.basename(r.history.at(-1).evidence)+')':'—')+' |\n';}md+='\n';}
md+='## Browser與Support（不併入255）\n\n| Identity | Role | Status |\n|---|---|---|\n'+otherFiles.map(r=>'| '+r.stableId+' | '+r.role+' | '+r.status+' |').join('\n')+'\n';
fs.writeFileSync(path.join(C.root,C.prefix+'inventory-final.md'),md,{flag:'wx'});
console.log(JSON.stringify({counters,nonPass:rows.filter(r=>r.status==='FAIL'||r.status==='BLOCKED').map(r=>({file:r.file,status:r.status,reason:r.reason})),newSuites:rows.filter(r=>r.newSuite).map(r=>({file:r.file,status:r.status}))}));
