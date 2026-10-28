# 《棒球人生》Match Contract Evidence Closure v0.1

任務：Focused Evidence Completion  
日期：2026-10-15（Asia/Taipei）  
正式 Git 基線：`ab3117653945de0b7013636187c446276a96e634`

**三項有界驗證完成並停止：A — Canonical seed88222 的終局、state、Record與同條件replay CONFIRMED；B — 原#38相同synthetic輸入與原斷言的隔離執行 CONFIRMED；C — 唯一事前固定候選未到達合法固定Moment3，仍UNVERIFIED。**

本輪執行3個standalone Entry-Safe diagnostic children：seed88222正式入口全場2次（首次＋必要replay），原#38 synthetic routine案例1次。**不是3套正式suite，也不是正式38/38 PASS。** 沒有seed88221全場、第二個Moment3候選或新的全面Architecture Audit；沒有重新分析Moment1。原#36歷史FAIL及固定ID3缺證保留。

**1494個既有可讀檔案hashes全不變；Production／正式tests／既有fixtures／seeds／pins delta＝0。Ready for Phase B2／Commit／Sprint10B＝NO；Receiver v2＝DISABLED。**

## 1. Git／WIP Integrity與範圍

開工核對branch=`main`，HEAD／main／origin/main tracking ref均為指定基線，Git index空。核對前輪Separation baseline的1477個hash、delivery的16個entries及delivery本身，建立本輪1494個既有可讀檔案SHA-256清單，涵蓋全部前置WIP與既有交付。未fetch，沒有重新核對遠端server。[Baseline](match-contract-evidence-closure-v0.1-baseline-evidence.json)

12個protected paths只核對Git status、size／mtime，沒有讀取、hash、執行或修改內容；metadata相同不是content hash證明。新captures使用獨立名稱、寫入前拒絕existing target並exclusive-create，舊captures不覆寫。結案1494個hash全相同，原WIP／Git index與protected metadata保持。[Closeout](match-contract-evidence-closure-v0.1-closeout-evidence.json)、[Delivery](match-contract-evidence-closure-v0.1-delivery-evidence.json)

本輪只對Moment3的phase／route／resolve與#38 formatter做codebase-memory Tier2 targeted查證：10份exact snippets直接比對current source，附必要雙向depth1 traces；沒有重做前輪61份廣泛架構核對。Coverage限定實際載入的runtime modules、相關helpers、正式test與本輪證據，配合direct read／hash；不是全repository架構完整性宣告。Graph的not_tracked／metadata_changed不是source freshness證明。[Focused graph](match-contract-evidence-closure-v0.1-focused-source-graph-evidence.json)、[Source](match-contract-evidence-closure-v0.1-source-evidence.json)、[Coverage](match-contract-evidence-closure-v0.1-coverage-evidence.json)

未修改Production、正式tests、既有fixture／seed／pin、Receiver wiring或runner。沒有Reset／Clean／Stash／Stage／Commit／Push；Full251／R6Full227／First-base timing／Receiver v2 Integration／Browser suites invocations皆0。

## 2. 事前固定計畫與實際執行

在任何本輪gameplay執行之前，exclusive-create [Plan](match-contract-evidence-closure-v0.1-plan-evidence.json)，固定：

- Task A：重用B1正常高中入學fixture。只在新隔離entry program把既有pending test hook輸入由88221換成**指定的88222**；原能力、SS API、default invitation index0、正常選校／completeEntry、career role與正式PlayingTime／roster／substitution owners均保持。
- Task A replay：全新context，以**完全相同的standalone source與輸入**再跑一次，驗record／log／decision sequence。
- Task B：原正式test的manifest／makeContext／`__candidate2222`／`verify`完整prefix及#38整行斷言原文保留，只隔離執行#38。沒有改fixture或字串檢查來取得PASS。
- Task C：**唯一候選就是Task A第一次的正常seed88222流程**；replay是同候選重現，不是新候選。依原政策走完，未到ID3即停止，不再換seed／學校／能力／career配置。

兩場canonical維持secure／zone／first-legal policy、randomSource0.72、safety1400。沒有supplied Opportunity、fake direct-start flag或identity改寫；不直接修改phase、lineup、completedMoments、PA或outs來製造Moment3。

| Entry-Safe diagnostic | 實際結果 | elapsed | Raw／witness |
|---|---|---:|---|
| canonical-88222 | PASS（診斷），exit0，stderr空 | 557.0427ms | [raw](test-infrastructure-sprint-0.1-match-contract-evidence-closure-v0.1-canonical-88222-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-contract-evidence-closure-v0.1-canonical-88222-evidence-assertions.json) |
| canonical-88222-replay | PASS（診斷），exit0，stderr空 | 276.2564ms | [raw](test-infrastructure-sprint-0.1-match-contract-evidence-closure-v0.1-canonical-88222-replay-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-contract-evidence-closure-v0.1-canonical-88222-replay-evidence-assertions.json) |
| routine-38 | PASS（診斷），原#38斷言1次通過，exit0，stderr空 | 88.9075ms | [raw](test-infrastructure-sprint-0.1-match-contract-evidence-closure-v0.1-routine-38-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-contract-evidence-closure-v0.1-routine-38-evidence-assertions.json) |

三次皆entryVerified／sourceStable=true，使用未改Entry-Safe standalone runner／preload。Timeout120000ms、outputMaxBuffer16000000 bytes、implicit Git show相容30000000 bytes，沒有增大限制。Raw保存actual command、入口／Node／env、完整stdout／stderr、exit／elapsed／limits、source hashes、Git refs與assertion witness。成功的Node assertion calls不是正式suite check總數。[驗證與語法／連結核對](match-contract-evidence-closure-v0.1-verification-evidence.json)

## 3. Task A — Canonical seed88222結果

本輪沒有執行原`__finish2222(88222)`；使用已審查的正常入學路徑，由正式owner建立完整Match。因此下述是**#37的Canonical責任證據**，不是宣稱原正式suite已到達或通過#37。

| 驗收項目 | 同次execution的實際證據 | 判定 |
|---|---|---|
| actual simulationSeed | 88222；正式prepare消費指定pending seed | **CONFIRMED** |
| 原能力／入學／選校／SS | 合法invitation validation、completeEntry、age16；入場準備能力快照不變；仍選default index0；school-development-29d536a2、SS | **CONFIRMED 本fixture** |
| 正常Opportunity | 由`createHighSchoolPlayingTimeOpportunity`／正式PlayingTime owner產生；exposureSource=opportunity-resolver、score44、assignedPosition=游擊手、lateGameAppearance／entryInning6 | **CONFIRMED**；未手寫plan |
| 初始上場狀態 | bench有player、initial lineup無player、entry=false；career starter未冒充當場先發 | **CONFIRMED** |
| 真實替補 | 第六局下0 out，playerEntry sequence77，第8棒，換下原SS incumbent；actual lineup／SS成為player，final status=substitute | **CONFIRMED**；非SS先發驗收 |
| 玩家PA／指定Moments | 真實player PA1次；completed IDs只有`hs_y1_match_moment_1`，沒有ID3或完成的防守Moment | **照實記錄**；未強迫追加 |
| 自然完賽 | 107 ticks，7局終／3 outs／空壘，home1／away3，completed／settled=true | **CONFIRMED**；107<1400 |
| 每步state integrity | 107個playback／decision ticks，前後共214份觀測issues皆空；final issues亦空 | **CONFIRMED**，不宣稱每個owner內部微步驟均獨立取樣 |
| Game Record | status=final、assertIntegrity=true；totals／result.finalScore與Match比分一致，113個unique eventRefs對應本場113個log events | **CONFIRMED** |
| 原#37 operands | 同場`completed=true`，`getHighSchoolMatchStateIntegrityIssues(...).length===0`，combined=true | **CONFIRMED Canonical責任**；原正式test未執行 |

### 同條件replay

Replay使用同一standalone檔案與相同source hash，全新VM、同一輸入；fixture、initial Match、完整record、log、decision sequence均一致，decision array另做deep equality。[Replay evidence](match-contract-evidence-closure-v0.1-replay-evidence.json)

| 比對物 | 首次／replay共同SHA-256 |
|---|---|
| Record | `6af67e71aba581ac84fc5b215d6af1d9758f14852f8a1282081023a26d2f1ebc` |
| Log | `96679cf657a33a5e840ce74d437ed657b95d2cc35867be2000fe9b82b82a0d4a` |
| Decision sequence | `8275a9f0f61d147cc217e85c689d38b6f5b55b1cfd191625773adff8c4c6f8a4` |

此處補齊了前輪缺少的88222獨立執行與重現性；沒有用88221結果代替。沿用B1既有owner witnesses，沒有新增canonical owner wrapper或額外RNG call；observer-free neutrality仍未驗證。

## 4. Task B — 原#38 Synthetic Routine Commentary

隔離副本保留原正式檔的完整33-module prefix、原CommonJS型VM globals、`__setup2222`／`__candidate2222`及`verify()`，只選取原#38整行執行；沒有先跑#1–37，也沒有因#36停止而漏掉本次檢查。[精確副本／生成證據](match-contract-evidence-closure-v0.1-routine-copy-evidence.json)、[副本](match-contract-evidence-closure-v0.1-routine.cjs)

**原synthetic輸入的缺陷沒有被修正或隱藏：** 副本會執行原`__setup2222`的age10 debug、人工phase／starter flags與一筆預置completedMoment，並採原一壘手、hardGrounder、straightAtPlayer、level8／sample0.99等設定。這些是Task B所保留的原輸入契約，**沒有用來證明合法entry、SS先發、Canonical完整比賽或Moment3**。Task A／C完全不使用這份synthetic setup。

原#38 predicate、五個字串與formatter都未改。新副本只加memory pass-through observer，將相同this／arguments交給原`formatMatchSimulationEvent`，回傳原result，額外複製實際輸入／輸出供取證；不調RNG。被呼叫的原formatter函式body已與current source逐行比對一致。[Source](match-contract-evidence-closure-v0.1-source-evidence.json)

實際synthetic seed=222201，event.type=playerRoutinePlay，execution route為原一壘自踩責任。玩家可見文字為：

> 1 出局｜一壘方向的強勁滾地球，你正面把球收住，踩上一壘完成出局。

| 原#38 raw identifier | 出現在本次玩家文字？ | 判定 |
|---|---|---|
| hardGrounder | false | **CONFIRMED** |
| straightAtPlayer | false | **CONFIRMED** |
| playerRoutinePlay | false | **CONFIRMED** |
| selfCoverFirst | false | **CONFIRMED** |
| decisionTension | false | **CONFIRMED** |

原`![...].some(raw=>t.includes(raw))`斷言以原文執行1次，結果通過。這補上**該固定routine案例、相同predicate的隔離證據**，不是正式38項suite PASS，也不證明所有routine error／fallback／其他位置的commentary。既有synthetic fixture的canonical缺陷仍保留，不能因formatter通過而升格其fixture合法性。

## 5. Task C — 固定Moment3合法source-flow

### Source前提核對

| 前提 | 正式source責任 | 本輪候選觀測 |
|---|---|---|
| moment_2_resolved的合法來源 | 防守producer在原moment_1_resolved、首個防守階段時可建立pending resume；routine／meaningful處理後由`restoreHighSchoolMatchAfterDefensiveDecision`消費。若active lifecycle不能resume則不前進；unsupported／fallback分支也可能恢復原flow | **未到達**moment_2_resolved；沒有用手改phase補上 |
| finalOffense route | playback依phase=moment_2_resolved選target=finalOffense；合法agency manual也可消費先前正式建立的finalOffense route | **未到達**；finalOffense playback ticks=0 |
| entryWindow／threshold | helper要求inning≥max(5, entryWindow+1) | entryWindow6，threshold7 |
| 正式lineup／SS | 實際runtime actor、entry與守位必須合法 | 已由正式替補進入第8棒／SS；不是缺player或手工SS assignment |
| 真正輪到玩家打擊 | 必須有live PA機會，不能只看queued battingOrder actor；playback在Moment routes之前先處理3 outs／終局 | 只有第六局下的真實player PA；七局下queued player被觀測到時已3 outs，不能新增打席 |
| 固定ID3／choices／public resolve | final producer→`legacyFinal:true`→ID3／moment_3_ready；由正式legal choices與public resolve／PA owner完成，再續回流程 | 沒有實際ID3，choices／PA／completion／ID3 exactly-once均維持**UNVERIFIED** |

相關函式原文與行號已限定查證：defensive producer、restore、final gate、final producer、public resolve與final PA completion path。沒有把source存在視為runtime已到達，也沒有宣告固定ID3全面過期。

### 唯一候選結果與具體阻礙

候選與Task A為同一場seed88222正常entry／SS替補；phase trace只有：

```text
full_match_flow → moment_1_ready → moment_1_resolved → complete
```

有兩份值得區分的terminal觀測：[完整gate witness](match-contract-evidence-closure-v0.1-findings-evidence.json)

| Tick | 局勢／打者 | Helper finalGate | 完整admission／後續 |
|---|---|---|---|
| 106 | 七局下、3 outs；lineup確有player、actual SS=player，queued actualBatter=player；phase仍moment_1_resolved、target=defense | true | 半局已結束；source先呈現halfInningEnd，沒有live玩家打席 |
| 107 | 同樣3 outs、相同queued player與非finalOffense phase | true | 正式gameEnd，沒有建立ID3 |

`shouldReachHighSchoolFinalOffensiveMoment`是局部helper，本身沒有包含完整terminal／phase gate。**2次helper=true不等於2次合法Moment3機會**；outs<3的live finalGate ticks=0，完整finalOffense ticks=0。正式playback的terminal處理在前，沒有產生fake PA。這不構成本輪新增Production guard的理由。

因此缺少的是：**合法source到達moment_2_resolved／finalOffense，以及threshold之後仍有效的玩家打席**。不是缺PlayingTime／roster／substitution owner，也不是player沒在lineup。本輪沒有再選第二個情境、改能力／學校／seed、直接呼叫final producer冒充admission，或注入phase／lineup／completedMoment／PA／out。

**S3＝UNVERIFIED。** 唯一候選的ID3存在值為false，不等同證明所有合法情境不可能；原#36固定ID3責任仍未取得等價證據，完成本候選後即停止。

## 6. Acceptance Matrix與原責任對照

| 責任 | 判定 | 本輪證據 | 不能據此宣稱 |
|---|---|---|---|
| #37 seed88222 completed | **CONFIRMED** | 正常entry、107 ticks自然終局，原completed operand=true | 原legacy `__finish2222`已修復或原suite已PASS |
| #37 seed88222 final integrity／每步state | **CONFIRMED** | final issues=[]；214份before／after state observations皆空；Record final／score／totals一致 | 所有其他career／browser／seed也已驗收 |
| 88222 replay | **CONFIRMED** | record／log／decision sequence hashes及decision array相同 | observer-free neutrality或跨seed等價 |
| #38五個raw identifiers | **CONFIRMED（各字串）** | 原同字句predicate隔離通過，actual routine text逐字串檢查均false | 全38項suite PASS、synthetic fixture變成canonical合法 |
| #36固定ID3／S3 | **UNVERIFIED** | 唯一候選沒有finalOffense或live threshold後PA；未建立ID3 | 已替代／可刪除原Moment3 assertion |
| 原#36歷史combined | **FAIL（既有verdict保留）** | 本輪未重跑原#36；新88222觀測其同型operands仍false | 本輪執行了原suite、或有新的正式#36 FAIL capture |
| C9 snapshot語義 | **CONTRACT GAP（前輪carry-forward）** | 前輪已確認，這輪未重做該調查或修復 | 已因A／B通過而消失 |

Machine matrix將#38五個token逐列保存，共12列結果；全部`formallyReplaced:false`。[Findings／完整matrix](match-contract-evidence-closure-v0.1-findings-evidence.json)

本輪新增的CONFIRMED證據可供後續正式契約修訂審查，但不是已修改、正式轉移或接受原所有assertions。三個diagnostic PASS只表示其限定觀測／assertions完成；S3仍缺證，不能用diagnostic的exit0回填成S3或#36 PASS。

## 7. 未解決項目、限制與最小正式測試修訂建議

| 項目 | 最小後續範圍／需要的人工裁決 |
|---|---|
| #37 Canonical責任已有88222證據 | 後續若授權，可使用獨立canonical context／suite接入原#37責任；保留88222、原policy／0.72／1400與state／Record checks。正式原檔仍未修改 |
| #38限定formatter責任已有隔離證據 | 後續可獨立執行原#38同predicate，保留五個tokens與原formatter；原#1–35／#38 bytes不因canonical修訂被改動。若要改synthetic fixture合法性，另列scope，不能以本次formatter PASS批准 |
| #36固定ID3／S3未解 | 人工決定fixed slot是否保留為特定合法情境的必要結果，以及要接受哪個可追溯前置流程。若堅持原ID3要求，需要另案明確限定合法fixture；本輪不再搜尋，也不先刪assertion |
| C9／seed authority等前輪契約 | 仍需人工接受決策／結果snapshot與終場摘要分工；supplied Opportunity與原simulation seed的邊界未在本輪修改或重探。不要把這些Production／Save／RNG改動藏入test helper |
| 原38項完整execution | 尚未完成；原#36阻擋與原legacy full-match問題保持。隔離#38通過不表示原檔順序執行已到#38 |
| 自然非零SS守備、合法先發、observer-free、browser | 本輪沒有補齊；兩場皆合法替補，守備完成Moment為0；不以0＝0、固定routine renderer或replay替代 |

建議後續正式修改仍限於新小型canonical helper／獨立contract suite與原#36／#37必要callsites的明確責任對照；#1–35／#38原保護保留。**可以提出只處理A／B的有限test修訂授權，但必須明列#36／S3仍未關閉，不宣稱整體B2已完成。** 本輪沒有寫任何正式test或Production patch，也沒有自動啟動該修訂。

## 8. Phase B2條件與停止

| Gate | 結案 |
|---|---|
| 本輪三項Focused Evidence Completion | **COMPLETE，已在預定次數停止** |
| A／B限定責任 | **CONFIRMED**，有完整raw／witness／source／replay |
| 唯一S3候選 | **UNVERIFIED**，不追加候選或無限期調查 |
| 原#36／固定ID3、前輪snapshot契約 | **未關閉，待人工裁決** |
| Ready for Phase B2（完整原契約修訂） | **NO** |
| Ready for Commit | **NO** |
| Ready for Sprint10B | **NO** |
| Receiver v2 | **DISABLED** |
| 原1494個hash／Production／正式tests | **全相同／delta0／delta0** |

停止交付，等待人工審查。沒有Commit／Push或任何後續自動修復、Sprint／Receiver啟用。
