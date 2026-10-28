# Source Freeze Contract Reconciliation v0.1 — Phase B Bounded Contract Reconciliation

專案：Baseball Life Simulation（棒球人生）  
日期：2026-10-14（Asia/Taipei）  
正式基線：`ab3117653945de0b7013636187c446276a96e634`

**本次授權的七個 comparison branches reconciliation PASS。五套真正 standalone 完整執行，57/57 PASS；Index／caller 專用驗證80/80，既有Save v1驗證23/23。有界Save／Guard89/89、Legacy25/25 pairs＋3個Historical cases亦PASS。** 本輪Production delta＝0；只在五個原tests新增七行。Ready for Commit＝NO，Ready for Sprint10B＝NO。Receiver v2仍DISABLED，L03仍PARTIAL。

## A. 授權與Baseline

本次人工指令正式批准五個Save分支、兩個Index分支、新Index checker、隔離負向測試及必要執行入口。Phase A的AUTHORIZED CANDIDATE在本輪才取得修訂授權；舊Phase A、R5／R6與Audit verdict均保留。

main／HEAD／origin/main tracking ref相同，index空；沒有fetch，不代表重新核對遠端server。核對Phase A、Entry-Safe及R6 delivery，保存**1269個既有可讀檔案SHA-256**及五套原始完整source。[Baseline evidence](source-freeze-contract-reconciliation-v0.1-phase-b-baseline-evidence.json)

12個protected paths只核對status、size／mtime，不讀取、hash、執行或修改內容；metadata一致不是protected content hash證明。既有WIP、fixtures、seeds、pinned references及舊captures保留。所有正式新capture先拒絕existing target，再exclusive-create。

## B. 七個精確修訂

| 原Suite | 原Guard／原Git show authority | 本輪唯一修改 | 完整結果 |
|---|---|---|---|
| Tactical Decision | Test8／`ac53bf61964bde4b40501c77e15269bae99b55cc` | Save專用else-if，新增1行 | 12/12 PASS |
| Tactical Interpretation | Test8／`98bcd1db941f63d17bacd2cbf75d8c4b8e717ac7` | 同上，新增1行 | 10/10 PASS |
| Decision Production Adapter integration | Test8／`9b9546f94a7286afef474be634fd93c57eb455db` | 同上，新增1行 | 11/11 PASS |
| Tactical Intent Evidence integration | Test10／`2a4b44a034b714b8de3c8a6897507995ab0f8ccd` | Save＋Index專用else-if，新增2行 | 10/10 PASS |
| Tactical Signal Projection | Test14／`674e49115a9ed7d67c69a3023b5a594d41fe584c` | 同上，新增2行 | 14/14 PASS |

Save分支調用未改的`assertReceiverSourceSaveAuthorizedDelta(current, baseline, actualAdapterText)`；Index分支調用新checker。`baseline`始終來自**每套原Git show ref**，沒有換成WIP或修改Commit literal。Adapter suite仍從原helper取得BASELINE。

Save v1回傳的canonical ref是`a0e512b…`，與caller原ref分開記錄；共同原Save normalized SHA-256仍為`d093c730…`。授權契約、exact分支及預定after hashes在修改正式tests前已固定。[Authorized contract](source-freeze-contract-reconciliation-v0.1-phase-b-authorized-contract-evidence.json)

全部behavior assertions、source loop成員、其餘comparison分支、fixtures、seeds、入口及pins未改。移除七個新增行後，五套各自完整**raw bytes**回到開工source；另用不依賴expected-source builder的逐行移除算法再次驗證。Git numstat為7行新增、0行移除。[Reverse／execution lock](source-freeze-contract-reconciliation-v0.1-phase-b-authorized-revisions-evidence.json)、[independent verification](source-freeze-contract-reconciliation-v0.1-phase-b-verification-supplement-evidence.json)

## C. Exact Index與Save責任

新契約`receiver-source-index-wiring-delta-v1`先核對原pinned index normalized hash `01a12673…`及unique adjacent anchor，**從原pinned全文**插入唯一授權行，再要求current normalized全文與expected完全相同：

```html
    <script src="batted-ball-tag-up-execution.js"></script>
    <script src="receiver-source-snapshot.js"></script>
    <script src="match-situation-lifecycle.js"></script>
```

原92個script tags的完整文字、attributes及順序保留；current為93個，Source tag唯一且位置固定。其他DOM、style、handler及文字仍凍結；沿用原CRLF／CR→LF normalization。沒有使用current index hash whitelist。[Index checker](../tests/receiver-source-index-authorized-wiring.cjs)

Adapter權威直接重用Save v1的`assertAdapterBoundary`：reviewed metadata-only adapter完整hash凍結、syntax與Storage／RNG／candidate tokens拒絕，runtimeEnabled=false。Token scan不是通用purity proof，exact freeze防止未審核變動。

Save v1完整source未改，仍只准三項原owner責任：Source pre-write detached serialization、normalizeSave在first defaults／merge前的raw guard、已驗證Source16版本保留。**Ordinary branch仍在原literal JSON writer之前validateRawSave(player)**；沒有新增writer、Storage／Admission authority，也沒有修改Save／Load契約或Production index。

## D. RED／UNVERIFIED與Negative Validation

開工核對兩套原可信RED：Decision與Adapter integration在Save freeze失敗。Interpretation／Intent／Signal原完整結果仍UNVERIFIED，沒有把static conflict當作三套runtime FAIL。本輪沒有額外重跑原RED版本；原capture與其hash均保留。

依授權順序，先重跑既有Save checker，再建立Index／caller驗證，通過後才接入七個分支：

| 驗證 | 本輪結果 | Evidence |
|---|---|---|
| 既有R6 Save exact checker | 23/23；其中21個negative正確拒絕 | [Save v1](source-freeze-contract-reconciliation-v0.1-phase-b-save-v1-validation-evidence.json) |
| 新Index／五套caller契約 | 80/80；其中72個negative正確拒絕 | [Index／caller](source-freeze-contract-reconciliation-v0.1-phase-b-index-caller-validation-evidence.json) |

新negative包含：Source tag missing／duplicate／moved，原tag reorder／delete／duplicate／attribute變更，async／defer／type／src／query，其他module、DOM／style／inline-handler／文字變更，wrong pinned Index，以及adapter Storage／RNG／candidate／未review版本。

每個caller另驗證raw guard、ordinary guard、serializer／writer、version或pinned Save變動拒絕；原full-source與script protected-function mismatch仍拒絕。Wrong caller ref、extra comparison branch／hook由exact source contract拒絕。Five原guard callbacks在isolated VM執行全部**48個source comparisons**；這48是80項內正向caller案例的nested comparisons，不額外增加suite或check總數。

Mutation只在記憶體source copies執行，先确认變動存在，JS mutation保持合法syntax。沒有寫Production或正式fixtures，也沒有調用原suite main來充當negative單元。[Dedicated mutation tests](../tests/source-freeze-reconciliation-exact-contract-test.cjs)

## E. Entry-Safe五套完整驗收

新增獨立Phase B orchestrator，明列五個standalone specs；**原Entry-Safe runner／preload／registry完整不變**。實際command為`node --require entry-safe-preload.cjs absoluteSuite`，require.main真正對應該suite。五套沿用原full個別180000ms／30000000-byte output buffer，原explicit Git show 8MiB保持；沒有全域提高政策。

PASS共同要求：main witness有效、實際同步assertion成功、完整退出、relevant source穩定，並到達原suite最終summary且passed與原宣告checks一致。以下Node calls是觀測次數，**不等於suite check總數**。

| Suite | 結果 | Node assertions成功 | Elapsed | 完整raw capture |
|---|---|---:|---:|---|
| Decision | 12/12 PASS | 6292 | 5380.91ms | [raw](test-infrastructure-sprint-0.1-phase-b-decision-evidence.json) |
| Interpretation | 10/10 PASS | 5968 | 5885.74ms | [raw](test-infrastructure-sprint-0.1-phase-b-interpretation-evidence.json) |
| Adapter integration | 11/11 PASS | 7793 | 19500.76ms | [raw](test-infrastructure-sprint-0.1-phase-b-adapter-integration-evidence.json) |
| Intent Evidence | 10/10 PASS | 6663 | 8402.54ms | [raw](test-infrastructure-sprint-0.1-phase-b-intent-evidence-evidence.json) |
| Signal Projection | 14/14 PASS | 7740 | 14021.99ms | [raw](test-infrastructure-sprint-0.1-phase-b-signal-projection-evidence.json) |

五套合計57/57。每套raw evidence保存actual command、Git refs、exit、elapsed、limits、完整stdout／stderr、assertion witness及412個declared relevant paths前後hash。完整main與最終summary證據共同使用，沒有只依exit0或非空stdout判PASS。[Five-suite gate](source-freeze-contract-reconciliation-v0.1-phase-b-suites-evidence.json)

原Sequence ON/OFF、incremental／rebuild、RNG／source／GameRecord parity、reload、terminal PA隔離、Production selection ownership及其他source guards全部保留並完成各suite原驗證。此結果是本輪五套，不是Full Repository verdict。

## F. Save／Historical／Legacy有界回歸

五套全部通過後，使用同一份鎖定source與Entry-Safe standalone依序重跑，保留原targeted120000ms／16MB：

| 原套件 | 本輪結果 | Raw evidence |
|---|---|---|
| R6 Source Save boundary | 30/30 PASS，包含direct／load／pre-write與3個Historical phases | [Save boundary](test-infrastructure-sprint-0.1-phase-b-save-boundary-evidence.json) |
| R1 Save focused | 19/19 PASS，duplicate／cold／拒寫與raw-before-default | [R1 Save](test-infrastructure-sprint-0.1-phase-b-r1-save-evidence.json) |
| R3 metadata guard | 40/40 PASS，同play tamper、cross-play archive及early return | [R3 Guard](test-infrastructure-sprint-0.1-phase-b-r3-guard-evidence.json) |
| Legacy comparison | 25/25 pairs＋3個genuine Historical cases PASS | [Legacy](test-infrastructure-sprint-0.1-phase-b-legacy-historical-evidence.json) |

Save／Guard合計89/89；Legacy pairs與Historical另列。原sample、callback count／order／value、Match RNG、Out／GameRecord／Evaluation、cold／duplicate與no-backfill驗證保留；candidate execution calls＝0。這是原owner的bounded fixtures，不代表任意game或Receiver v2實際execution驗收。[Bounded gate](source-freeze-contract-reconciliation-v0.1-phase-b-bounded-evidence.json)

本輪共**11個suite child invocations**：Save v1、Index／caller、五套正式suite及四套bounded。全部取得有效PASS；沒有Full251、R6 Full227、First-base或新performance invocation。[Acceptance](source-freeze-contract-reconciliation-v0.1-phase-b-acceptance-evidence.json)

## G. 檔案與Integrity

新增code僅四個：Index checker、專用mutation tests、[Phase B capture utility](source-freeze-contract-reconciliation-v0.1-phase-b-capture.cjs)、[explicit orchestrator](source-freeze-contract-reconciliation-v0.1-phase-b-runner.cjs)。其他新增檔案為本報告與獨立captures／witnesses／coverage輸入資料；完整列表及hash見delivery。

1269個舊檔案中**1264個hash不變**；唯一五個變動為B節核准tests，exact reverse均通過。Production、Save v1、舊runner／helpers、其他正式tests、fixtures／seeds／pins及所有舊evidence保持。Protected metadata與Git index亦相同。[Closeout](source-freeze-contract-reconciliation-v0.1-phase-b-closeout-evidence.json)、[Delivery hashes](source-freeze-contract-reconciliation-v0.1-phase-b-delivery-evidence.json)

初始新bookkeeping有三次preflight失敗：Phase A開工status未計其後交付、整檔hash的buffer allocation，以及同prefix的原Phase A plan被誤排除。只修正新utility，改分塊hash並核對完整1269項；當時suite invocations＝0。[Preflight recovery](source-freeze-contract-reconciliation-v0.1-phase-b-preflight-recovery-evidence.json)。第一次互動status錯誤輸出截短，完整原stderr為UNVERIFIED；不充當測試證據。最後11個child原始日誌均完整。

大型coverage資料傳送亦遇到工具size／Node runtime限制，最後改用分段保存。第一版PowerShell管道對非ASCII path失真，舊檔保留，**corrected evidence才是可採信原始graph結果**；沒有覆寫任何capture。

## H. Coverage與未解決限制

Codebase-memory Tier2使用search、雙向depth1 trace及exact snippets，再核對current全文、hash、reverse及actual witnesses。1305個snapshot paths分11個有效批次全部返回；初始超過128-path上限的4個requests無有效結果，不列入coverage。[Corrected architecture／coverage](source-freeze-contract-reconciliation-v0.1-phase-b-architecture-coverage-corrected-evidence.json)

18個metadata missing、4個not_tracked並非磁碟檔案缺失，已直接核對完整bytes hash；另讀取一份非關鍵舊audit的reported partial lines48–56。動態adapter calls與匿名comparison branches未由graph完整解析，以當前全文及實際執行查證。Metadata訊號不當freshness或完整性保證。[Fallback verification](source-freeze-contract-reconciliation-v0.1-phase-b-verification-supplement-evidence.json)

仍保留原自然情境gaps：Adapter的changeLook未自然觀測；Intent的terminal location-miss、high cognitive load、major drift、failed repeat；Signal的terminal BIP ready-pattern與deferred location-miss。原suite PASS不代表這些自然coverage gaps已關閉。實際browser網路／loading lifecycle仍UNVERIFIED。

Match #36、Gradient、Opportunity-two必要module load、First-base formal timing discrepancy及其餘current inventory未知結果均未處理或重跑；不得由57 checks推定whole-WIP acceptance。原Full／First-base歷史verdict保持。

## I. Final Gate與停止

| Gate | 本輪結果 |
|---|---|
| 五Save／兩Index授權契約 | PASS，限七個branches |
| Exact Index／Save protections | PASS；新80/80與既有23/23 |
| Negative拒絕 | 新72/72＋既有21/21，皆為各自focused subset |
| 五套完整Pitch Tactical | PASS，57/57 |
| Save／Guard／Historical／Legacy | PASS，89/89；25/25 pairs＋3個Historical，units分開 |
| Production／原WIP／舊captures integrity | PASS，Production delta0；只有授權七行test delta |
| 新非預期suite failure | 0 observed；不推論未跑集合 |
| Full／First-base | NOT RUN，0 invocations |
| Critical Regression Triage條件 | **YES，具備可靠的有限子基線；後續須獨立界定scope及授權** |
| Receiver v2／L03 | DISABLED／PARTIAL |
| Ready for Sprint10B／Commit | NO／NO |

本輪完成即停，等待人工審查。沒有Reset／Clean／Stash／Stage／Commit／Push，沒有啟用Receiver v2或開始Critical Regression Triage、Sprint10B及其他修復工作。
