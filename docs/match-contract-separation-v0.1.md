# 《棒球人生》Match Contract Separation v0.1

## Acceptance Design & Isolated Proof

日期：2026-10-15（Asia/Taipei）  
正式 Git 基線：`ab3117653945de0b7013636187c446276a96e634`  
授權：採用方案 A，建立獨立驗收規格與隔離證據；不修改 Production、既有正式 tests、fixtures、seeds 或 pins。

**本輪驗收設計與有界證據交付完成。方案 A 已採用；正式 assertions 尚未修訂或標記為已替代。Synthetic Moment1 有合法 source-flow 證據；固定 Moment3 仍 UNVERIFIED。Canonical 第六局替補的場內結構、結算、Record、Save memory 與 Career identity 檢查通過，但 snapshot 的時間局勢語義仍有明確缺口。原 #36 combined 仍 false；#37 seed88222、#38 commentary 本輪均未執行。**

僅新增 **1 次 standalone Entry-Safe diagnostic child／1 場 seed88221 Match**，同一次執行供 S1 與 Canonical 契約分別取證，不重算成兩場或兩套正式 suite。沒有另外造出供 Moment3 使用的 phase、lineup、completed Moment 或出局數。**1477 個既有可讀檔案 hashes 全部不變。Ready for Phase B2／Commit／Sprint10B 均為 NO。**

## 1. Git／WIP Integrity 與執行邊界

開工核對 branch=`main`、HEAD／main／origin/main tracking ref 均為指定基線，Git index 空；未 fetch，未重新查遠端 server。核對前輪 Match Admission baseline 的 1460 個 hashes、delivery 的 16 個 entries 及 delivery 檔案，建立本輪 **1477 個既有可讀檔案 SHA-256** 清單。這也保護 Triage、Entry-Safe、Repair A、B1、Admission Audit 與原 WIP 的前置交付。[Baseline](match-contract-separation-v0.1-baseline-evidence.json)

前輪 closeout 的 Git snapshot 早於其 closeout／delivery 自身寫入；本輪從一開始便把這兩個可核對的 final artifacts 明列，沒有忽略非預期差異。12 個 protected paths 僅核對 Git status、size／mtime，沒有讀取、hash、執行或修改內容；metadata 保護不是內容 hash 證明。全部新 captures 使用獨立名稱與 exclusive-create，沒有覆寫舊 captures。

本輪 Production／正式 tests／既有 fixtures／seeds／pins delta＝0。沒有 Reset／Clean／Stash／Stage／Commit／Push；Full251／R6Full227／First-base timing／Receiver v2 Integration／Browser suite invocations 皆0。Receiver v2 仍 DISABLED、L03 仍 PARTIAL。[Closeout](match-contract-separation-v0.1-closeout-evidence.json)、[Delivery](match-contract-separation-v0.1-delivery-evidence.json)

Source 查證使用 codebase-memory Tier2：graph discovery、雙向 depth1 traces、23 份新 exact snippets，另將前輪61份 exact snippets 重新逐行比對 current source；raw file SHA-256 同時保留。1477 個既有 paths 分13批 coverage 完整返回，唯一 reported partial 為舊 audit lines48–56，已直接讀取。Graph metadata_changed／not_tracked 不是 freshness 或完整性證明。新 reporting artifacts 另做 coverage、direct read／hash 與語法／連結核對。[Architecture／Coverage](match-contract-separation-v0.1-architecture-coverage-evidence.json)、[Source](match-contract-separation-v0.1-source-evidence.json)、[Verification](match-contract-separation-v0.1-verification-evidence.json)

## 2. 驗收責任與證據標示

| 責任 | 應證明的行為 | 不能用來替代 |
|---|---|---|
| Synthetic Moment Contract | 特定固定槽位的 producer、合法前置 phase、實際 actor、合法 choices、一次完成與回到原流程 | Canonical 合法入學／先發 admission；沒有到達的 Moment3；整場一定有兩個進攻 Moment |
| Canonical Full-Match Contract | 正式 entry → Opportunity → roster／lineup → 真實參與 → 全場結束 → Record／Save／Career，以及公開入口不重複生效 | 固定 Moment1／3 必定出現；合法替補冒充先發；零防守 Moment 冒充非零守備 coverage |
| Original Protection Matrix | 每個原 predicate 的責任、證據、缺口與正式轉移範圍 | 只有新增 diagnostic PASS 就視為原 #36–#38 已全部替代 |
| Snapshot Semantics | 決策前局勢、結果後局勢、終場摘要分別可追溯，consumer 用對語義 | Current completedMoment 混合資料已天然具備不可變 decision snapshot |

下文 CONFIRMED／PASS 均附適用 case。UNVERIFIED 是所需證據仍缺，不會因 diagnostic 預期觀測到缺口而變成該契約 PASS。**Entry-Safe child 的 PASS 是診斷 assertions 正確執行，不代表 S3／原 #36／#37／#38 PASS。**

## 3. Synthetic Moment Contract 驗收規格與隔離證據

### S1 — 固定 Moment1

Source chain：`advanceHighSchoolMatchPlaybackStep` 的 firstOffense route（或已合法呈現的 agency manual firstOffense route）→ `shouldCreateHighSchoolFirstOffensiveMoment` → `prepareHighSchoolFirstOffensiveMomentFromSimulation` → public resolve → `advanceHighSchoolYearOneAfterMomentOne` → `resolveHighSchoolOffensiveDecision`／正式 PA owner → `recordHighSchoolYearOneMoment`。[原函式與 current 行號](match-contract-separation-v0.1-source-evidence.json)

| 驗收點 | 必要證據 | 本輪 |
|---|---|---|
| S1.1 admission／phase | producer 前是 source 建立的 firstOffense 路由；momentIndex0／current ID1；玩家 active、正確進攻側、當前 runtime batter 確實 player | **CONFIRMED**：完整 fixture 起跑，owner 在第六局換入後才產生槽位；沒有直接呼叫 producer 或修改 phase |
| S1.2 建立 | ID=`hs_y1_match_moment_1`、domain=offense、phase=moment_1_ready；pending opportunity.kind=scripted、resumePhase=moment_1_resolved | **CONFIRMED**：playerEntry seq85 先於 meaningfulMomentReached seq86 |
| S1.3 choices | 正式 choices 非空，每個被採用的 choice 由原 legal-choice owner 產生，matchMomentId 與當前槽位一致 | **CONFIRMED**：原 secure／zone／first-legal policy 選 zone，sample0.72；完整 choices 存於 raw |
| S1.4 完成 | 正式 PA 已完成且未 resultApplied；一次 public resolve 只新增一筆真實 player PA、一個 resolved event、一個完成 Moment；續回指定 phase | **CONFIRMED**：PA seq87、resolved seq88、completed ID1，回 moment_1_resolved |
| S1.5 不重複 | 相同 decision／expected ID 再呼叫 public resolve，不能再加 PA／Moment／contribution | **CONFIRMED**：回 false，完整 player 內容不變 |

固定 producer 的 choices 使用 `buildOffensiveDecisionChoices`＋`isOffensiveDecisionChoiceLegal`；public resolve 驗 phase／identity／choice，PA owner 驗完整結果與 resultApplied。Current first producer 仍有 forceScripted，且不在函式末端用 density.allowed／零 choices 作統一拒絕。本規格要求實際觀測合法 choices；本輪有 choices，**沒有據此證明所有零 choices 情境的行為**。

S1 是固定槽位的最小合法 source-flow 證明，取自同場 Canonical trace 的局部；沒有為了「Synthetic」標籤另造人工完成紀錄，也沒有宣稱可覆蓋所有入場配置。

### S3 — 固定 Moment3

Source chain：playback target=finalOffense（phase=moment_2_resolved），且 `shouldReachHighSchoolFinalOffensiveMoment` 成立 → final producer；或合法 late-game agency 的 routeTarget=finalOffense 選 manual → 同一 final producer。`prepareHighSchoolFinalOffensiveMomentFromSimulation` → meaningful producer 的 `legacyFinal:true` 指定 ID3。一般 classified `hs_y1_match_offense_N` **不等價於固定 ID3**。

| 驗收點 | 所需條件／預期 | 本輪狀態 |
|---|---|---|
| S3.1 合法到達 | 玩家已實際上場，正確進攻側、當前 batter=player；inning≥max(5, entryWindow+1)；前置 route／phase 由 source 流程走到 | **UNVERIFIED**：固定 case 的 entryWindow6 → threshold7；finalGate true ticks=0，finalOffense playback ticks=0 |
| S3.2 固定建立 | producer 設 momentIndex2／ID3／offense／moment_3_ready；pending kind=legacyFinal、resumePhase=moment_3_resolved；choices 由正式 owner 產生且可選 | **Source CONFIRMED；runtime UNVERIFIED**：本輪沒有呼叫該 producer |
| S3.3 正式完成 | public resolve → `resolveHighSchoolYearOneFinalMoment` → 同一正式 offensive PA resolver；一次真實 PA、完成 ID3、resumePhase，非直接結束整場 | **Source CONFIRMED；runtime UNVERIFIED** |
| S3.4 重複保護 | 相同 ID／決策重呼不再計數，後續全場自然推進 | **UNVERIFIED**：沒有用 S1 的 no-op 證據代替 ID3 的實測 |

本場 phase trace 只出現 `full_match_flow → moment_1_ready → moment_1_resolved → complete`；整場 player PA只有1次，未走到 moment_2_resolved／finalOffense，七局結束前沒有再次輪到合法 player PA。這是**固定 case 的具體阻礙**，不是所有合法 career 都無法到達 Moment3 的不可能證明。Routine 防守在某些流程也能推進至 moment_2_resolved；不要求一定先完成防守 Moment，但本輪沒有該 source flow。

本輪沒有直接把 Match 改成 moment_2_resolved／moment_3_ready、直接呼叫 final producer 當作 admission 證明、補 completedMoments、捏造打席／出局或搜尋 seed／學校。**S3 未達成，原 ID3 保護仍保留。**

## 4. Canonical Full-Match Contract 驗收規格與隔離證據

固定 fixture 完整重用 B1 normal-entry 的 exact entry program：原能力、正式具體 SS position API、default invitation index0、正式選校／completeEntry（age16）、career role starter。Match 由正式 prepare 建立，無 supplied Opportunity，pending simulationSeed88221；全程原 policy、sample0.72、safety1400。92 個 current-index modules 依順序載入 browser-global VM，排除 application-controller，沿用既有 memory DOM／storage／timers；沒有操作 browser。

| Contract | 驗收規格 | 本輪結果與邊界 |
|---|---|---|
| C1 Opportunity／初始名單 | 合法 entry；plan、assignedPosition、canonical membership、initial lineup／bench 與 entry flags 一致 | **CONFIRMED 本場**：score44、lateGameAppearance、entryInning6；initial bench有player、lineup無player、slot=-1、entry=false；career role starter未直接授予先發 |
| C2 真實上場／Moment | 只有實際參與才有玩家決策；owner 換入 incumbent，打序／SS assignment同步，entry event先於玩家Moment | **CONFIRMED 本場**：第六局下1 out、seq85、第8棒；actual SS變為player；上場前0個Moment，唯一決策時actual batter／currentBatter均player |
| C3 自然終局與界限 | 不塞出局或結果；原policy下自然完成、safety<1400 | **CONFIRMED 本場**：110 ticks，7局終、3 outs、home1／away6，settled／completed=true |
| C4 決策守恆 | 每個建立的玩家決策有對應合法 choice、正式結果與一次完成；終局不得留未完成決策；defense completed＝created meaningful | **CONFIRMED 本場的一個進攻決策**：created1／resolved1／completed1／playerPA1，gameEnd1；defense0＝0。**非零防守證明仍缺** |
| C5 Match／Game Record | 狀態轉移前後 integrity、比分與Record totals一致、event references不重複、record final／integrity有效 | **CONFIRMED 本場**：110 ticks前後共220份state觀測皆無issues；119 log events／119 unique record refs；final record與Match比分相同 |
| C6 Save memory | normalizeSave後必要Match狀態、record、completedMoments、evaluation、matchExperience保留，原player不變 | **CONFIRMED 本場**：上述物件／欄位比較通過；不是browser storage reload驗收 |
| C7 Career／History | 真實exposure回饋、evaluation match identity一次、experience settled、history一次，Record摘要對應該場 | **CONFIRMED 結構與identity**：PA1、守備局數1、evaluation sampleCount1／appliedMatchIdentities只含本場、experience settled=true、history1。時間局勢語義見第7節，**不宣稱所有Career語義已一致** |
| C8 公開冪等 | 同決策重複resolve、completed後settle／finish不再生效 | **CONFIRMED 本場**：重複resolve=false；settle兩次＋finish一次皆false，完整player內容不變。不是低階append任意重呼保證 |
| C9 決策情境與consumer語義 | 決策局勢不可被終局摘要冒名，Career／敘事依明確語義讀取 | **GAP／尚未驗收**：最後completedMoment被改成混合時間資料，現行consumer實際讀到；本輪只交付契約建議，不修source |
| C88222 獨立seed | 同原policy與1400，獨立完成seed88222、state／Record驗證 | **UNVERIFIED／NOT RUN**；保留#37獨立要求，不拿88221代替 |

本輪 canonical 證據是**合法替補**；不表示SS先發，也不補出不存在的第二次進攻或非零守備Moment。完整Canonical驗收仍為 **PARTIALLY PROVEN**：已通過本場有界結構檢查，C9、C88222及非零守備／其他participation配置仍缺。

### 實際執行與可重播範圍

| 項目 | 實際值 |
|---|---|
| Standalone child | [proof.cjs](match-contract-separation-v0.1-proof.cjs)，由未改 Entry-Safe runner／preload 執行 |
| Raw／witness | [完整raw](test-infrastructure-sprint-0.1-match-contract-separation-v0.1-proof-evidence.json)、[assertion witness](test-infrastructure-sprint-0.1-match-contract-separation-v0.1-proof-evidence-assertions.json) |
| Exit／elapsed | exit0、stderr空、406.0677ms、entryVerified／sourceStable=true |
| 原policy | timeout120000ms／outputMaxBuffer16000000 bytes／implicit Git show30000000 bytes；未增限額 |
| Assertion witness | 79個成功Node assertion calls；不是79項正式suite checks，也不把UNVERIFIED子契約變成PASS |
| Replay parity | 與B1 fixture／initial Match／完整record／log hashes逐一相同 |
| Game Record SHA-256 | `abb6ee6487c8f39a3e3de3afe945f2494a374d9b78d6c6a6a358c9808dd6cf92` |
| 原suite invocations | 0；#36未執行，該場原operands combined仍false |

Raw保存actual command／入口、完整stdout／stderr、exit／elapsed／limits、Git refs、relevant source hashes及witness；[Findings](match-contract-separation-v0.1-findings-evidence.json)提供聚合facts、protection matrix與lineage。[Source](match-contract-separation-v0.1-source-evidence.json)保存driver exact source、原正式test全文及未改assertions。沿用B1既有owner wrappers，只新增逐步讀取與公開duplicate calls；沒有新owner wrapper或額外RNG call。Hash parity不是observer-free neutrality proof，該對照仍UNVERIFIED。

## 5. Original #36／#37／#38 Protection Matrix

原正式檔為 [baseball-match-foundation-2-2-2-test.js](../tests/baseball-match-foundation-2-2-2-test.js)，#36／#37／#38分別在current lines153／154／155。完整assertions原文、原33-module manifest及hash均存source evidence。原#36仍同時要求 completed、Moment1、Moment3、defense equality、safety；本輪沒有刪除、修改、弱化或強迫其PASS。

| 原predicate | 原始目的 → 新責任 | 已有證據 | 尚缺證據／不得標記已替代 |
|---|---|---|---|
| #36.1 `x.match.completed` | 完整自然比賽 → C3 | 本輪固定88221合法替補自然完成，與B1重播一致 | 不證明原starter前提；整個#36仍未替代 |
| #36.2 `ids.includes(ids[0])` | 固定Moment1真實出現／完成 → S1 | 本輪正式entry、producer、合法choice、真實PA與完成鏈均確認 | 其他起始配置未驗；單項證據不替代整個conjunction |
| #36.3 `ids.includes(ids[2])` | 固定Moment3真實出現／完成 → S3 | producer／前置route／choices與completion source已核對 | **UNVERIFIED**；需要不改phase／lineup／completedMoments的合法到達與完成proof |
| #36.4 defense completed＝defensiveMeaningfulDecisionCount | 只計真實決策，建立與完成守恆 → C4＋正向守備case | 本場0＝0成立；前置Repair A bounded證據保留 | 非零自然玩家防守、每次lifecycle完成仍缺；不能用0＝0宣稱守備已覆蓋 |
| #36.5 `x.safety < 1400` | 原policy下有界推進 → C3 | seed88221為110<1400，未加timeout／塞outs | seed88222及合法先發無此證明 |
| #37.1 `x.match.completed`（88222） | 第二固定seed獨立closure → C88222 | 本輪只有88221的closure證據 | **UNVERIFIED／NOT RUN**；原seed88222必須獨立執行 |
| #37.2 `get...IntegrityIssues(...).length===0`（88222） | 第二seed終局state正確 → C88222；另加逐轉移檢查候選 | 本輪88221前後220份state觀測無issues | **UNVERIFIED／NOT RUN**；不能跨seed替代。原顯式predicate只查final，標題「全程」不等於已逐tick驗證 |
| #38.1 不含 `hardGrounder` | routine文字隱藏raw球種 → S38 | 原source保留；presentation owner存在 | 本輪沒有產生／格式化適用的真實routine event，**UNVERIFIED** |
| #38.2 不含 `straightAtPlayer` | 隱藏raw方向 → S38 | 同上 | **UNVERIFIED** |
| #38.3 不含 `playerRoutinePlay` | 隱藏raw分類 → S38 | 同上 | **UNVERIFIED** |
| #38.4 不含 `selfCoverFirst` | 隱藏raw路由 → S38 | 同上 | **UNVERIFIED** |
| #38.5 不含 `decisionTension` | 隱藏raw欄位名 → S38 | 同上 | **UNVERIFIED** |

`ids[0]／ids[2]`在上表是原`highSchoolYearOneMomentIds`的縮寫，沒有重定義原assertion。#38實際是一個否定some的combined predicate，為避免漏掉任何保護字串，拆成五列責任；machine matrix保存每個字串，**不是新增五個正式assertions**。

原#38使用`__candidate2222()`自己的synthetic fixture，不讀#36的full-match結果；但原檔順序中#36 fail會阻斷#37／#38。沒有使用原helper內人工completed Moment來取得本輪S38 PASS，也沒有拿一般PA commentary當routine commentary的等價證據。

**12列原predicate責任均標記 `formallyReplaced:false`。** 有些已具備本場operands證據；Moment3、88222、routine commentary與非零守備尚缺。方案A的設計已採用，不等於這些證據已取得或原assertions已移除。

最小正式修改範圍：#36／#37只限該檔full-match callsites與必要獨立helper／contract suite；#1–35／#38原source保留。#38若需隔離補驗，可新增小型synthetic proof，原raw-token array與formatter保護不變。具體清單與施工前置見第8節。

## 6. Seed Authority Boundary：現況、候選與建議

### 現行優先權

| 邊界 | Current source行為 | 本輪證據 |
|---|---|---|
| 已存在同id的completed／初始化完整Match | `prepare`的reuse分支先return；不進入下面的seed選擇 | **Source CONFIRMED**。不能對已開始Match補傳Opportunity就假設會重新seed；本輪未另動態重探 |
| 新Match、沒有supplied Opportunity | `createHighSchoolMatchSimulationSeed()`先消費正數pending seed並清0；沒有pending才讀其randomSource | **Source＋本場CONFIRMED**：原pending88221→actual88221，pending後為0；Opportunity由正式producer正常建立 |
| 新Match、有supplied Opportunity | 由`decisionId || matchId`經`createHighSchoolMatchSimulationSeedFromIdentity`計算；該分支不呼叫pending-seed consumer | **Source CONFIRMED**。本輪只對真實同一Opportunity做pure hash計算，未跑supplied分支全場 |
| identity／plan | supplied plan須維持既有match identity；hash分支不代表可任意修改decisionId以配合想要的seed | 本場snapshot identity前後相同，未用preserveDecisionId、換hash identity或fake direct-start flag |

同一個16歲正常fixture的正式Opportunity若在全新Match中被supplied，source計算的seed為 **105959684**，並非88221。本輪只計算既有輸入的hash，沒有建立或執行該不同seed的Match。B1 debug獨立start-plan探針的3144261226來自不同Opportunity，不能混成同場seed證明。

### 不修改正式owner的兩種測試方案

| 方案 | 測試方法與隔離方式 | 保護與限制 |
|---|---|---|
| Seed方案1：固定simulationSeed、owner正常產生Opportunity（推薦供Canonical／原#37） | 全新合法entry context，使用既有pending test hook88221或88222，首次prepare不傳supplied Opportunity。記錄實際seed、Opportunity snapshot、plan與initial roster，再走正常全場 | 不改seed source／identity／Production RNG；直接保留原兩個simulation seeds。Opportunity仍由owner決定，允許替補或不上場，不以role或手工plan逼成starter。本輪只驗88221；88222仍獨立待驗 |
| Seed方案2：固定正式Opportunity、驗identity衍生seed（獨立owner契約） | 事前固定、由正式producer產生且未改動的Opportunity；在尚未開始同id Match的全新合法context首次supplied。expectedSeed由該immutable identity算出，另查實際seed／plan被消費；不預放pending，以免未消費值污染下一場 | 使用owner現有優先權，不改其RNG或入口。可驗supplied Opportunity契約，**不能算成88221／88222等價測試，也不能補先發證明**。本輪只有pure計算，supplied全場未執行 |

建議兩者分別命名、分別報actual seed與Opportunity identity。原固定seed gates採方案1；方案2只負責supplied分支的獨立契約。若未來要求「指定supplied starter plan且同時強制simulationSeed88221」，現有這兩種入口沒有在本輪證明可同時滿足；保留阻礙，另交Match owner裁決。不得反向找identity hash、挑seed／學校或悄悄切到105959684來替代原要求。本輪不提出也不實作seed owner的變更。

## 7. Moment Snapshot Semantics：欄位、Consumers與建議

### 已確認的寫入與同場實際值

`settleHighSchoolYearOneMatch`在完成前只對最後一個completedMoment寫入這四個欄位：`scores={...match.scores}`、`runners=[null,null,null]`、`outs=3`、`half="終"`。**沒有同步更新該Moment的inning**，也沒有把所有completedMoments都改成終局。ID／decision／tier／resultCode／pitch history等資料保留。

| 觀測責任 | inning／half／outs | scores home／away | 來源 |
|---|---|---|---|
| 玩家做選擇之前 | 6／下／1 | 1／5 | 本輪decisionBefore，只讀複製 |
| PA結果已套用的完成Moment | 6／下／2 | 1／5 | 正式PA／Moment owner之後、settlement之前的只讀複製 |
| 終局後的最後completedMoment | **6／終／3** | **1／6** | 正式settlement寫入；實際值改變half／outs／scores，runners被重寫但值仍全null |
| 真正全場終局摘要 | **7／終／3** | **1／6** | final Match／Game Record |

因此current completedMoment原先已是「結果套用後」局勢，**不是選擇之前的decision snapshot**；終局後又混合保留舊inning與新half／score等資料。不能只把該物件改稱immutable decision snapshot，或把它當正確全場結束局數。[三階段原始snapshot、real PA event與consumer輸出](match-contract-separation-v0.1-findings-evidence.json)

### Current consumers的可核對責任

| Consumer | 目前讀取／影響 | 證據等級 |
|---|---|---|
| `getHighSchoolCallHomePresentation` | 直接用lastMoment.inning／half描述親身片段；本輪實際輸出「**6局終**」 | **Source＋runtime CONFIRMED**，未操作browser |
| MatchExperienceDevelopment：deriveMatchExperienceEvidence → createBatterEvidence → buildSituation → derivePressure | 從完成Moment取inning／half／outs／runners／scores；settlement在覆寫之後才呼叫experience owner | **Source＋runtime CONFIRMED**：兩筆active evidence的situation均為6／終／3、scoreMargin=-5，pressure為lateGame／normal。不能當成原decision前或PA結果後的局勢 |
| `collectCompetitionEvidence`／getMomentQuality | 讀Moment數量、decisionQuality／executionQuality，與actual exposure／contribution／experience summary組evaluation | **Source CONFIRMED**；本輪evaluation／history／Save一致。這個直接quality計算未以四個覆寫欄位作score輸入；不擴張為所有career語義都不受影響 |
| `recordHighSchoolYearOneMatchHistory` | 保存decision quality摘要、actual exposure、Record摘要；不把lastMoment.inning／half作全場局數 | **Source CONFIRMED**；本輪history1，Record比分一致 |
| `renderHighSchoolPostMatchOutcome`、performanceSummary | 使用Moment outcome／consequence／execution／cause等敘事與個數；全場比分另用Match | **Source CONFIRMED**，未做browser渲染驗收 |
| `normalizeSave` | clone completedMoments及其scores／runners等資料，保留目前混合值；normalized GameRecord另存 | **Source＋memory round-trip CONFIRMED**；不會自行還原已被覆寫的原局勢 |
| GameRecord bridge／finalization | 從真實simulation events統計與記eventRefs，沒有completedMoments全文；原player PA仍保留其真實事件 | **Source＋本場Record CONFIRMED**；final119refs／score正確 |
| 其他本次literal範圍的readers | UI計數、previous tier、duplicate ID／one-shot checks等，不靠這四個欄位重建原decision時間 | Source evidence保存命中行；動態alias與間接consumer不宣稱全域窮盡 |

**C7的結構與identity通過，不等於C9已通過。** 已確認混合snapshot被experience與敘事消費；是否造成不符合設計的成長量，仍要先確認pressure應取決策前或結果後情境，不能只憑此觀測宣稱已證明能力成長計算錯誤。

### 建議的責任契約（僅驗收層，未改Save schema）

| 語義 | Authority／取證點 | 允許consumer與驗收 |
|---|---|---|
| Decision context | 玩家合法選擇呈現／執行前：actor、lineup、phase、inning／half／outs／bases／score、identity、legal choices | 決策合法性、選擇品質、壓力／難度若設計採決策當下則取此。驗收copy不可被後續settlement覆寫 |
| Resolution snapshot | 正式PA／Physical／Lifecycle套用結果後的event，保留before／after與outcome identity | 結果歸屬、base／score／outs變化、exactly once；不可把結果後outs誤當決策前outs |
| Match final summary | final Match＋final GameRecord；inning7、score1:6等 | 終場UI、Record與career全場摘要；不寫回來冒充前述任一事件局勢 |

本輪在獨立evidence中已分開保存三者；沒有新增Production欄位或Save migration。**建議未來敘事／experience以明確命名的決策或結果觀測取情境，終場摘要獨立讀Match／Record。** 原completedMoments現有bytes與round-trip先作legacy保留契約；若後續正式owner／consumer必須改語義或資料結構，需另案授權並評估Save相容，不能混入本次test separation。

## 8. 後續正式測試修改的最小施工清單

此處是下一階段候選清單，**沒有建立任何tests／Production patch**。本輪「採用方案A」已授權驗收設計；下列正式施工仍在本輪禁止範圍。

| 候選檔案範圍 | 最小責任／保留條件 | 開始條件 |
|---|---|---|
| 新增小型 `tests/helpers/canonical-match-contract-context.cjs`（候選名稱） | 只載入formal owner／browser globals、組合法entry輸入並觀測；不改roster／phase／Moment結果，不建立第二個Match authority | 本報告人工審查通過；固定fixture與owner dependency明列 |
| 新增獨立Canonical contract suite（候選） | 固定88221／88222各自執行C1–C8／C88222；保留policy0.72／1400、state／Record／Save／career／public duplicates | 88222獨立證據必須補齊；C9語義缺口與case scope明列，不把整體列全PASS |
| 新增最小Synthetic slot／routine contract cases（候選） | S1與S3分開；S3只接受合法source-flow；S38保持原五個raw tokens的routine文字保護 | S3與S38未取得證據前保留UNVERIFIED；不得使用fake completed Moment建立前提 |
| 原 `tests/baseball-match-foundation-2-2-2-test.js` 的#36／#37 callsites／必要context切分 | 逐predicate核准責任轉移後才接到相應cases；#1–35／#38原source、原seeds／policy／重要assertions保留 | 目前#36.3、#37、#38與非零守備未等價，**不能現在刪除ID3或宣稱#36已替代** |
| Snapshot consumer或seed owner的任何Production改動 | **不在本清單的test修訂授權內** | 另案說明必要性／相容性並取得明確授權；不由helper偷偷修正 |

正式驗收需要讓原38項真正完整到達並分開報結果；沒有完整execution證據時，不以分離後的diagnostic綠燈回填38/38。本輪沒有改runner、正式manifest、receiver模式或pin比較。

## 9. 未驗證項目與明確停止條件

| 項目 | 停止時狀態 |
|---|---|
| 驗收設計／原保護逐項對照 | **COMPLETE**，方案A已採用，正式轉移尚未實施 |
| S1固定Moment1 | **CONFIRMED（本場最小合法source-flow）** |
| S3固定Moment3 | **UNVERIFIED**；沒有合法到達／完成case，不找seed直到PASS |
| Canonical88221替補 | **有界結構檢查CONFIRMED**；不等於先發或全參與配置驗收 |
| C9 snapshot時間語義 | **GAP／待審查契約**；consumer影響已有source與runtime證據，未修Production |
| #36原combined | 同場觀測 **false**；原正式test未執行、未強迫PASS |
| #37 seed88222 | **UNVERIFIED／NOT RUN**，保留獨立要求 |
| #38 routine commentary | **UNVERIFIED／NOT RUN**，五個raw tokens保護保留 |
| 非零自然玩家防守、合法先發／noAppearance全場 | **UNVERIFIED**，不以0＝0／替補／age10 debug case代替 |
| supplied Opportunity全場／observer-free control／browser lifecycle | **UNVERIFIED**；pure seed hash不是這些驗收 |
| 1477既有檔案／Git index | hashes全不變／index空 |
| Ready for Phase B2 | **NO** |
| Ready for Commit | **NO** |
| Ready for Sprint10B | **NO** |

本輪交付完成後立即停止，等待人工審查。任何未取得等價證據的原斷言都未標記為已替代；不自動開始Phase B2、Receiver v2、Sprint10B、正式test修訂或任何Production修復。
