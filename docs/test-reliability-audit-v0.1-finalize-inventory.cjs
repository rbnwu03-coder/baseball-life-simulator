"use strict";
// Offline final inventory: merge immutable captures and explicitly qualify execution evidence.
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),A=require("./test-reliability-audit-v0.1-extract.cjs");
function finalize(){
 A.reserve("inventory-final");const markdown="docs/test-reliability-audit-v0.1-test-inventory.md";assert(!fs.existsSync(path.join(A.root,markdown)));
 const first=A.json(A.prefix+"inventory-evidence.json"),freeze=A.json(A.prefix+"source-freeze-review-evidence.json"),full=A.json("docs/receiver-execution-v2-sprint-10a3b-r6-full-repository-evidence.json"),rows=structuredClone(first.rows);
 const fixtureKinds=new Set(["fixture/helper source equality","fixture/helper source equality via harness"]),nonFreezeKinds=new Set(["working-tree scope guard","historical program behavior replay"]);
 for(const row of rows){if(row.protected)continue;
  row.staticDependencyPaths=[...new Set(row.staticDependencyPaths.map(p=>p.replace(/^\//,"")))].sort();row.sourceContractCatalogue=freeze.catalogue.filter(x=>x.file===row.file);
  row.tags.initialSourceFreezeLiteralCandidate=row.tags.sourceFreezeDirect;delete row.tags.sourceFreezeDirect;delete row.tags.sourceFreezePotentialTransitive;
  row.tags.programSourceFreeze=row.sourceContractCatalogue.some(x=>!fixtureKinds.has(x.kind)&&!nonFreezeKinds.has(x.kind));
  row.tags.fixtureSourceFreeze=row.sourceContractCatalogue.some(x=>fixtureKinds.has(x.kind));
  row.tags.workingTreeGuard=row.sourceContractCatalogue.some(x=>x.kind==="working-tree scope guard");
  row.tags.historicalProgramReplay=row.sourceContractCatalogue.some(x=>x.kind==="historical program behavior replay");
  row.tags.gitDirectLiteralCandidate=row.tags.gitDirect;if(row.file.includes("r2-runner-test")){row.tags.gitDirect=false;row.gitCaveat="Direct Git calls in source are wrapper mocks, not actual Git execution; imported runner has conditional Git dependencies.";}
  row.entryGuard=/require\.main\s*===\s*module/.test(A.read(row.file).toString());
  row.command=[process.execPath,row.file];row.commandBasis="Unchanged standalone node entry; assertion-bearing top-level body or require.main branch. Do not substitute require-only wrapper for a main-guard entry.";
  if(row.confirmedEvidence?.summary && row.observedCommand?.[1]==="-e")row.observedExecutionKind="R6 in-process exported run() capture; displayed -e command is a reconstruction, not a recorded shell invocation";
  else row.observedExecutionKind=row.confirmedEvidence?"Recorded child command":"UNVERIFIED; proposed original standalone entry only";
  const old=full.results.find(r=>r.file===row.file);
  if(old && row.entryGuard && old.command?.[1]==="-e" && !old.stdout.trim()){
   row.status="UNVERIFIED";row.executionState="R6 process exit0; suite main() skipped by require-only wrapper";row.wrapperEntryWitness={command:old.command,exitCode:old.exitCode,stdout:old.stdout,stderr:old.stderr,elapsedMs:old.elapsedMs};row.confirmedEvidence=null;
  }
 }
 const auditCaptures=[A.prefix+"known-failure-replays-evidence.json",A.prefix+"entry-buffer-replays-evidence.json"];
 for(const evidence of auditCaptures)for(const r of A.json(evidence).results){const row=rows.find(x=>x.file===r.file);assert(row&&!row.protected);assert.equal(row.sha256,r.sourceHash);row.auditRuns??=[];row.auditRuns.push({evidence,command:r.command,exitCode:r.exitCode,error:r.error,elapsedMs:r.elapsedMs,timeoutMs:r.timeoutMs,maxBuffer:r.maxBuffer,stdoutSha256:A.hash(r.stdout),stderrSha256:A.hash(r.stderr),primaryFailure:r.stderr.split(/\r?\n/).find(x=>/^AssertionError|^ReferenceError|Error: spawnSync git ENOBUFS/.test(x))||null});
  const success=r.exitCode===0&&!r.error;row.status=success?"PASS":"FAIL";row.executionState="Audit rerun using recorded unchanged entry/profile";row.observedCommand=r.command;row.executionProfile={timeoutMs:r.timeoutMs,maxBuffer:r.maxBuffer};row.observedExecutionKind="Recorded audit child command";row.confirmedEvidence={status:row.status,evidence,exitCode:r.exitCode,elapsedMs:r.elapsedMs,command:r.command,primaryFailure:row.auditRuns.at(-1).primaryFailure};
 }
 // Both UI direct profiles fail on nested Git buffer; their original wrapped controls pass.
 const statusCounts={},tagCounts={};for(const r of rows){statusCounts[r.status]=(statusCounts[r.status]||0)+1;for(const[k,v]of Object.entries(r.tags||{}))if(v)tagCounts[k]=(tagCounts[k]||0)+1;}
 const output={...first,counters:{...first.counters,status:statusCounts,tags:tagCounts},rows,initialLiteralCandidateCounts:first.counters.tags,statusDefinitions:{PASS:"Assertion suite executed with a verified usable profile, unchanged audited inputs and capture. Scope remains bounded.",FAIL:"Actual suite assertion or runtime failed in its declared usable entry. Known debt is still FAIL.",UNVERIFIED:"No validated current assertion execution; historical exit0, static comparison and an unexecuted main are insufficient.",NOT_RUN:"Per-run execution state, independent of verification status; R6 full notRun may have targeted evidence."},r6FullReliabilityQualification:{historicalDeclaredPass:174,assertionExecutedPass:173,skippedMainExit0:1,actualFailures:4,notRun:49,fullExecutedProcesses:178},suiteVerdictsFromStaticFreezeComparisons:false,auditRunCount:10,auditFullInvocations:0,safety:A.integrity()};
 A.capture("inventory-final",output);
 let md="# Test Reliability Audit v0.1 — 完整測試入口清單\n\n";
 md+="251個 suite entry：247個標準測試檔、vertical-slice smoke、callbackTest及兩個Legacy comparison。60個helper／runner／diagnostic與13個browser fixture另列。分類以檔名、VM／harness使用及契約入口作靜態主分類，不是既有正式registry。\n\n";
 md+="完整command、依賴closure、hash、evidence、R6 execution state與本輪每次profile見 [final inventory JSON](test-reliability-audit-v0.1-inventory-final-evidence.json)。依賴是literal require／root strings及index-derived候選；動態選項不是完整解析。UNVERIFIED的command是建議原入口，並非本輪已執行。\n\n";
 md+="PASS／FAIL／UNVERIFIED為套件驗證狀態；NOT RUN是特定run未執行狀態。兩個UI套件在原wrapper通過、direct Node因nested Git ENOBUFS失敗；兩個結果全部保留。R6 in-process run captures有structured check totals，沒有該套件專屬raw stdout／stderr；JSON中的重建CLI不可冒稱原實際command。\n\n";
 for(const status of["FAIL","UNVERIFIED","PASS"]){const list=rows.filter(x=>x.status===status);md+="## "+status+" — "+list.length+"\n\n| Suite | 主分類 | 原入口／採信profile | 依賴標記 | Evidence |\n|---|---|---|---|---|\n";
  for(const r of list){const flags=Object.entries(r.tags||{}).filter(([k,v])=>v&&["gitDirect","programSourceFreeze","fixtureSourceFreeze","workingTreeGuard","legacyRuntime","receiver","save","ss63","matchSettlement"].includes(k)).map(([k])=>k).join(", ");const proof=r.confirmedEvidence?.evidence;md+="| ["+r.file.replace("tests/","")+"](../"+r.file+") | "+r.primaryType+" | "+(r.protected?"禁止讀取／執行，command未查證":"`node "+r.file+"`"+(r.observedCommand?.[1]==="-e"&&!r.confirmedEvidence?.summary?"；採信原wrapper":"")+(r.observedExecutionKind?.startsWith("R6 in-process")?"；R6採信exported run()":""))+" | "+(flags||"—")+" | "+(proof?"[capture]("+path.posix.basename(proof)+")":"UNVERIFIED")+" |\n";}
  md+="\n";
 }
 md+="## 其他檔案與Browser Fixtures\n\n| File | Role／result |\n|---|---|\n";for(const r of first.otherFiles)md+="| ["+r.file+"](../"+r.file+") | "+r.role+(r.file.endsWith(".html")?"；UNVERIFIED，未操作browser":"；不列suite verdict")+" |\n";
 fs.writeFileSync(path.join(A.root,markdown),md,{flag:"wx"});console.log(JSON.stringify({statusCounts,tagCounts,entries:rows.length}));
}
if(require.main===module)finalize();
