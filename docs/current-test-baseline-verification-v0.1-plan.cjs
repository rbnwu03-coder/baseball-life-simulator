"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),C=require('./current-test-baseline-verification-v0.1-capture.cjs');
C.integrity();
const audit=C.json('docs/test-reliability-audit-v0.1-inventory-final-evidence.json'),b=C.json('docs/test-reliability-audit-v0.1-baseline-evidence.json');
const changed=Object.keys(b.hashes).filter(p=>C.fileHash(p)!==b.hashes[p]);
const suites=[{label:'r4-dependency',file:'tests/receiver-execution-v2-sprint-10a3b-r4-dependency-test.cjs',expectedChecks:44},{label:'r6-exact-checker',file:'tests/receiver-execution-v2-sprint-10a3b-r6-exact-checker-test.cjs',expectedChecks:23}];
const impacted=suites.map(s=>({...s,previousStatus:audit.rows.find(r=>r.file===s.file).status,changedStaticDependencies:audit.rows.find(r=>r.file===s.file).staticDependencyPaths.filter(p=>changed.includes(p.replace(/^\.\//,'')))}));
assert(impacted.every(s=>s.changedStaticDependencies.includes('tests/high-school-year-one-opportunity-two-integration-test.js')));
C.capture('execution-plan',{scope:'At most two explicitly listed standalone suites, not discovery-driven full execution',suites:impacted,
 reason:'Historical dependency candidates include the Opportunity-two source changed by Repair A. Refresh these two guards conservatively; normal metadata-only/Save checker scopes do not enable Receiver v2.',
 estimates:{children:2,expectedNamedChecks:67,eachTimeoutMs:120000,eachOutputMaxBuffer:16000000,expectedElapsedSeconds:'Historical suite runtimes indicate a few seconds; hard total cap 240 seconds'},
 reuse:'Phase B five full suite captures; Repair A formal40 and reviewed regressions; Sprint1 formal50/routine1/Record13/Ground26; original Match and Gradient standalone FAIL captures with unchanged inputs',
 noRerunNeededForUnchangedEvidence:true,remainingUnknownSuites:'Remain UNVERIFIED; no automatic expansion',
 additionalExpansion:'Must be separately proposed with concrete list and necessity; no further suites in this task',
 changedSinceAudit:changed,forbidden:{Full251:0,R6Full227:0,firstBaseTiming:0,browserFull:0,ReceiverV2Enabled:false},
 expectedFailurePolicy:'Record any unexpected result truthfully; do not repair Production or modify suite inputs'});
const md='# Current Test Baseline Verification v0.1 — 有界執行計畫\n\n此計畫在本輪任何suite child執行前exclusive-create。只重跑兩個靜態依賴涉及Repair A Opportunity-two修訂的既有guard；不重新跑已具備相同source可信證據的五套Phase B、Repair A、Sprint1、Match或Gradient。\n\n| Suite | 原具名checks | 必要性 |\n|---|---:|---|\n'+impacted.map(s=>'| '+s.file+' | '+s.expectedChecks+' | static closure含已修改Opportunity-two，保守補驗目前相容性 |').join('\n')+'\n\n預估2個standalone children、67個checks，歷史時間為數秒；每套原120000ms／16000000-byte限制，總hard cap240秒。候選執行不啟用Receiver v2，R4回傳runtimeEnabled=false／candidateExecutionCalls=0。\n\n其他無可信證據的項目維持UNVERIFIED。不得擴張為Full251／R6Full227／First-base／Browser全套，不增加seed／樣本、不改能力。完整inputs、理由及引用來源見[plan evidence](current-test-baseline-verification-v0.1-execution-plan-evidence.json)。\n';
fs.writeFileSync(path.join(C.root,C.prefix+'execution-plan.md'),md,{flag:'wx'});console.log(JSON.stringify({plannedChildren:2,expectedChecks:67,changedSinceAudit:changed.length}));
