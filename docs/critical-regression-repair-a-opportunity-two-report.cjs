"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./critical-regression-repair-a-opportunity-two-capture.cjs');
C.integrity();const b=C.json(C.prefix+'baseline-evidence.json'),a=C.json(C.prefix+'acceptance-evidence.json'),v=C.json(C.prefix+'verification-evidence.json'),n=C.json(C.prefix+'negative-validation-evidence.json'),g=C.json(C.prefix+'architecture-coverage-evidence.json');
assert.equal(a.results.reduce((sum,r)=>sum+r.checks,0),130);
const table=a.results.map(r=>`| ${r.label} | ${r.checks}/${r.checks} PASS | ${r.successfulNodeAssertions} | ${r.elapsedMs.toFixed(2)}ms | [raw](${path.basename(r.evidence)}) |`).join('\n');
const negativeTable=n.runtimeNegativeResults.map((r,i)=>`| ${r.omitted} | 原37項通過，第38項runtime FAIL；exit1 | [raw](${path.basename(r.rawEvidence)}) |`).join('\n');
const body=`# Critical Regression Repair A — Opportunity-two Manifest Correction

專案：Baseball Life Simulation（棒球人生）  
日期：2026-10-15（Asia/Taipei）  
正式 Git 基線：\`ab3117653945de0b7013636187c446276a96e634\`

**本輪授權修復與有界驗收 PASS：正式 Opportunity-two 40/40；SS／6-3、Ground Lifecycle、Runner Throw Settlement、Force Settlement 四套合計90/90。缺模組runtime負向3/3正確失敗；manifest契約10/10。Production delta＝0，唯一既有檔案修改為 Opportunity-two runtimeFiles 的三個module names。Ready for Commit／Sprint10B＝NO。**

## 1. Baseline 與現有 WIP

開工核對branch=main，HEAD／main／origin/main tracking ref均為指定基線，Git index空。未fetch；這不是遠端server重新查證。核對Triage baseline的1314個既有hash、Triage delivery的61個hash與delivery檔案，建立本輪 **1376個既有可讀檔案SHA-256**。

保留原Phase B七行test reconciliation、全部WIP、fixtures、seeds、pins、Triage／Phase B／Entry-Safe／Audit舊captures。12個protected paths只核對status、size／mtime；沒有讀、hash、執行或修改其內容，metadata相同不是content hash證明。[Baseline](critical-regression-repair-a-opportunity-two-baseline-evidence.json)

结案1376個舊檔案中 **1375個hash不變**，唯一變動為本輪授權test；exact reverse恢復原完整raw bytes。Production、Save、Receiver v2、Match、能力模型與所有其他原tests均不變。[Closeout](critical-regression-repair-a-opportunity-two-closeout-evidence.json)、[Delivery hashes](critical-regression-repair-a-opportunity-two-delivery-evidence.json)

## 2. 唯一正式修改與原契約保存

修改：[high-school-year-one-opportunity-two-integration-test.js](../tests/high-school-year-one-opportunity-two-integration-test.js)。只在原runtimeFiles的兩處相鄰anchor插入：

\`\`\`text
batted-ball-physical.js
→ batted-ball-outcome-mapping.js
→ defensive-opportunity-foundation.js       [新增]
→ defensive-reach-secure-foundation.js      [新增]
→ offensive-plate-approach.js

offensive-bunt-execution.js
→ force-advancement.js
→ defensive-decision-throw-foundation.js    [新增]
→ offensive-bunt-defensive-handoff.js
\`\`\`

三個owner的相對次序與正式index依賴一致：Physical／Roster先於Opportunity；Opportunity先於ReachSecure；ReachSecure／Force先於DecisionThrow；DecisionThrow先於下游handoff／ground／runner settlement與script。原manifest的59項完整文字及相互順序保留，current為62項。**原59項整體載入次序沒有重排；本輪只校正新增owners與必要dependencies的次序**，不宣稱原manifest與index的全部modules順序完全相同。

授權expected-after hash在寫正式test前固定，修改後全文等於expected，兩處插入撤回後精確還原開工bytes。原40條verify呼叫整行相同；fixtures、seeds、helper functions、reassessment sampleCount>=3、exactly-once、pending／completed reload、no-appearance與bounded history均保持。[Authorized contract](critical-regression-repair-a-opportunity-two-authorized-contract-evidence.json)、[actual diff](critical-regression-repair-a-opportunity-two-authorized-change-evidence.json)、[verification](critical-regression-repair-a-opportunity-two-verification-evidence.json)

| Raw SHA-256 | 值 |
|---|---|
| Before／exact reverse | ${v.originalTargetSha256} |
| After | ${v.afterTargetSha256} |

Git numstat為 **2行新增／2行移除**，是兩條原清單行的literal插入，沒有其他source修改；target diff --check通過。

## 3. 隔離負向驗證

新增三份docs副本，每份只從修復後manifest省略一個必要owner，再插入只讀globals觀測。副本沿用原fixtures／seeds／40 assertions，root與原test同樣位於repository下一層。沒有fake owner、mock正式守備owner或optional改寫。

| 省略owner | 實際結果 | Evidence |
|---|---|---|
${negativeTable}

各副本missing-global witness均確認該owner為undefined；完整standalone入口有效、source穩定、沒有timeout／spawn／buffer問題、未到40/40 summary。缺Opportunity／ReachSecure均得到controlled input=null後的activeRoster錯誤；缺DecisionThrow得到原ReferenceError。**三份套件status維持FAIL；3/3是預期負向驗證成功，不是把原FAIL列成套件PASS。**

另有10個隔離manifest契約檢查：完整reviewed清單1個正向，加上每個owner的missing／duplicate／移至dependencies前共9個negative，全部符合預期。這些只操作memory arrays，不改正式test或fixtures。[Negative contract](critical-regression-repair-a-opportunity-two-negative-contract-evidence.json)、[validation](critical-regression-repair-a-opportunity-two-negative-validation-evidence.json)

三個副本撤回observer、於原offset補回省略literal後，皆精確等於修復後正式全文。Runtime負向3與manifest checks10分開列，不與正式suite checks相加。

## 4. Entry-Safe正式測試與最小相關回歸

全部使用**未改的Entry-Safe Runner／preload**，實際command為：

\`\`\`text
<actual Node executable> --require <absolute tests/entry-safe-preload.cjs> <absolute suite>
\`\`\`

Witness核對standalone require.main對應該suite、同步assertion實際成功、exit0、完整final summary、declared check數與完整退出；不只以exit0／非空stdout判PASS。Limits沿用120000ms／16000000-byte output buffer，implicit Git show相容保持30000000 bytes。沒有舊require wrapper、沒有提高limits。

| Suite | 完整結果 | Node assertions成功（觀測次數） | Elapsed | Evidence |
|---|---|---:|---:|---|
${table}

正式Opportunity-two第38項實際Match Engine已完成；第39／40項均到達並通過。正式suite目前是本輪 **40/40 PASS**；Triage的原missing-owner FAIL capture與hash保留為修復前歷史證據，没有覆寫。

四套相關suite各有獨立必要範圍：

- **SS defensive／6-3（26）**：SS-01直接處理一壘出局、官方Match／GameRecord／lifecycle，receiver失敗責任，6-4-3 first／second leg、force third-out、duplicate與public-handler save/reload。SS-01實際source assertions保存在verification，並非只根據suite名稱判定6-3覆蓋。
- **Ground Lifecycle（26）**：原seed495886132的home／away paths、resolved-before-apply、playback delivery、reload recovery、exactly-once、stale context拒絕、无orphan與instrumentation neutrality。
- **Runner Throw Settlement（22）**：runner／receiver timing，secureFirstBaseOut、force／tag、slow／fast runner、live recovery、hold、DP continuation、third-out、stale facts與無RNG重播。
- **Force Settlement Production（16）**：canonical force chain、所有actors與survivors、第三出局取消得分、GameRecord／event parity、duplicate application、pending／completed reload、render不得重複settle。

合計相關90/90，連同正式40項為130個suite checks；Node assertion calls不作suite check總數。[Acceptance](critical-regression-repair-a-opportunity-two-acceptance-evidence.json)

新orchestrator最初誤填Runner Throw Settlement預期16項；原suite實際完整 **22/22 PASS**，因此parent只在summary核對時停止。完整raw child已保存且source穩定。修正**新utility**為22後，重新核對前四份captures與目前source，沒有重跑已通過suite，只執行尚未跑的Force Settlement。這不是正式assertion或Production failure；原utilities／captures未改。[Bookkeeping recovery](critical-regression-repair-a-opportunity-two-bookkeeping-recovery-evidence.json)

本輪共 **8個child invocations：5個positive suites＋3個missing-owner negative copies**。八份完整stdout／stderr、exit、elapsed、actual command、Git refs、limits、source hashes與main／assertion witnesses均取得並重新核對，沒有UNVERIFIED child。

## 5. Coverage、殘留風險與Git狀態

Codebase-memory Tier2使用symbol search、雙向depth1 trace、exact snippets；1398個當時snapshot paths分11批coverage均有效返回。Metadata結果為1234 changed、78 not_tracked、68 match、18 missing，不是磁碟檔案缺失或完整性保證。唯一partial為舊audit lines48–56，已直接讀取。三個關鍵script snippets與current逐行比對一致，material modules／test source另以直接讀取及hash補證；graph未完整解析動態VM globals，結論以actual execution為依據。[Architecture／coverage](critical-regression-repair-a-opportunity-two-architecture-coverage-evidence.json)

本次source freeze／差異保護證明只有manifest被修正，不代表whole-WIP acceptance。SS回歸包含explicit production fixtures，不能推定任意自然6-3球或browser網路／loading lifecycle已驗收。Match Fixture與Gradient的既有問題仍未修復；舊triage verdict保留。原Full／First-base歷史判定亦保持。

結案branch=main，HEAD／origin/main tracking ref仍為指定基線，index空。原WIP狀態保留，新增tracked modification只有本輪授權Opportunity-two test；另有本輪docs artifacts為untracked。Git status完整原文見closeout。没有Reset／Clean／Stash／Stage／Commit／Push。

## 6. 最終Gate與停止

| Gate | 結果 |
|---|---|
| 三個正式owners／新增依賴次序 | PASS，僅manifest correction |
| 原59 members／40 assertions／fixtures／seeds | 完整保留，raw exact reverse PASS |
| 缺任一owner不得假PASS | runtime3/3；原negative suites皆FAIL |
| 隔離manifest contract | 10/10（1正向＋9正確拒絕） |
| 完整正式Opportunity-two | 40/40 PASS |
| SS／6-3、Ground Lifecycle、Settlement | 90/90 PASS，四套有界回歸 |
| 既有WIP／Production保護 | 1375原hash不變，唯一1個授權test改動；Production delta0 |
| 非預期正式suite failure | 0 observed |
| Full251／R6Full227／First-base timing | NOT RUN，0 invocations |
| Match Fixture／Gradient Repair | NOT STARTED |
| Receiver v2／L03 | DISABLED／PARTIAL |
| Ready for Sprint10B／Commit | NO／NO |

新增檔案限docs內report、capture／runner／verification utilities、isolated missing-owner copies與獨立evidence／witnesses。所有capture拒絕existing target並exclusive-create；原reports／captures完整保留。

**本輪完成即停，等待人工審查。** 沒有啟動Receiver v2、開始Match Fixture／Gradient修復、進入Sprint10B或Commit／Push。
`;
const out=path.join(C.root,C.report);assert(!fs.existsSync(out));fs.writeFileSync(out,body,{flag:'wx'});console.log(JSON.stringify({report:C.report,sha256:C.fileHash(C.report),formalChecks:40,relatedChecks:90,stoppedAfterCloseout:true}));
