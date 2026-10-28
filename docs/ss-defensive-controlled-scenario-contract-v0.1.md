# 《棒球人生》SS Defensive Controlled Scenario Contract v0.1

任務：Bounded Scenario Design & Isolated Vertical Proof  
日期：2026-10-15（Asia/Taipei）  
Git參考基線：`ab3117653945de0b7013636187c446276a96e634`

**唯一事前固定Scenario及必要replay完成，兩次diagnostic均PASS。受控滾地球已進入正式Match，Physical producer產生真實輸出，Defensive Opportunity正式綁定玩家SS；詳細守備handoff卻為unsupported，沿ordinary PA fallback判定single，沒有建立玩家守備Moment。沒有修改條件取得meaningful。**

本輪取得 **Controlled Component Proof（Physical／Responsibility限定部分）**，以及受控輸入進入正式Match、fallback後自然完賽的有界證據；**完整Controlled SS Match Integration Proof仍UNVERIFIED**，尚無Secure／玩家守備choice／Throw／Runner Timing／SS Settlement。這不是整個守備系統FAIL，也不是Natural Production Proof。

既有SS Integration與Ground Settlement Lifecycle本輪各 **26/26 PASS**，不能替代本Scenario缺少的gate。**SS Match UI Slice資料契約前置條件＝NO；Ready for Commit／Sprint10B＝NO；Receiver v2＝DISABLED。完成即停止。**

## 1. Scenario規格與資料來源

任何gameplay之前已保存 [Plan](ss-defensive-controlled-scenario-contract-v0.1-plan-evidence.json)、[Fixture input](ss-defensive-controlled-scenario-contract-v0.1-fixture-input-evidence.json) 及source hashes。最多一個Scenario、首次及一次必要replay；執行後未改adapter、program、seed或assertions。

| 輸入 | 事前固定規格／provenance |
|---|---|
| Scenario ID | `ss-controlled-ground-v0.1` |
| 玩家／入學 | 原樣重用前輪已審查pre-Match checkpoint，正式normalizeSave還原；高中入學validation有效、age16、原能力、正式SS、原default invitation index0與學校 |
| 故事起點 | checkpoint既有highSchoolStep5，正式Event為high_school_showcase；不新增故事進度，不宣稱重新走完入學後五個事件 |
| Match identity | `prepareCurrentHighSchoolYearOneMatch()`無自訂identity或supplied Opportunity；owner給`hs-y1-autumn-exhibition` |
| Roster／admission | 正式PlayingTime score44、lateGameAppearance／entry6；initial canonical member＋bench，未先發；由正式替補owner換入第8棒／SS |
| 守備起點 | 第一個入場後、對手進攻的正式ordinary fair contact；前輪runtime已追溯為 **7局上、0出局、空壘、home1／away4**。本輪在該邊界再次驗合法性，未直接寫outs／runners／lineup |
| 擊球輸入 | 僅Physical producer的rolls：contactQuality0.65、ballType0.1、pace0.68、direction0.05、depth0；與既有SS integration明示fixture相同的physical rolls |
| Seed | **2884315748**，沿用前輪actual數值；既有pending test hook → 正式seed owner消費並清0，未挑新seed |
| 玩家政策 | secure／zone／first legal，randomSource0.72、safety1400；不指定傳一壘、二壘或雙殺，也不指定結果／評價 |
| Replay | 相同checkpoint、入口、numeric seed及authority、adapter與program；只有一次 |

沒有採用偏好的「1出局、一壘有人」：本輪讀取的Match prepare body固定從1局上、0出局、空壘開始，沒有接收該局勢的Scenario參數；public playback也沒有提供Physical options。沿用正式playback實際到達的合法起點，避免建立第二個局勢authority。這是對明列入口的查證，不是全repository不存在其他入口的宣告。[21份current source regions](ss-defensive-controlled-scenario-contract-v0.1-source-evidence.json)

## 2. Controlled adapter邊界與Current authority

[adapter.cjs](ss-defensive-controlled-scenario-contract-v0.1-adapter.cjs) 只存在docs測試環境。因Physical API已freeze、OffensivePlateApproach在載入時捕捉該API，隔離loader在Physical module載入後、其consumer載入前，安裝一個唯獨`resolveBattedBallPhysicalTruth`不同的API facade。其餘17個exports逐項為原reference。

該方法僅在本場玩家已正式入場、actual SS=player、對手進攻、第一個ordinary contact時，複製input並補入上述五個rolls，然後呼叫**原Physical producer**，直接回傳原truth；只用一次，其餘呼叫原樣pass-through。原identity、pitch、recognition、能力、handedness、action全部保留。輸入邊界前後完整player JSON不變，結果通過原Physical normalizer。depth對groundBall不消耗，實際truth記為null。

loader由Canonical helper原文做一處明列的memory replacement；正式helper、Production modules及其磁碟bytes不變。這不是未改helper逐byte執行，也不是新Production路由。[Plan內exact replacement／hash](ss-defensive-controlled-scenario-contract-v0.1-plan-evidence.json)

沒有替代Reach／Secure／Throw／Receiver／Runner／Settlement owner，沒有傳入capability override、outcomeRoll、tacticalActionOverride、meaningful旗標、primary defender、結果或教練評價。原pipeline自帶的`deterministicFixtureOverride` pitch標籤仍在raw；該pitch不是本輪adapter新增輸入。不能將本輪稱為自然生成或完全沒有既有fixture假設。

Current Event→prepareCurrent→public resolve→playback全程同一reference／id；每run230份before／after state觀測均無native integrity issues、active defense有效。正式第六局下2outs、三壘有人時playerEntry seq89，換下原SS incumbent；七局上球發生前actual SS確為player。沒有手工starter flags或finalized lineup安裝。[首次facts](ss-defensive-controlled-scenario-contract-v0.1-candidate-first-facts-evidence.json)、[replay facts](ss-defensive-controlled-scenario-contract-v0.1-candidate-replay-facts-evidence.json)

## 3. Physical／Responsibility／Reach／Secure

| 本場正式輸出 | 結果與證據界線 |
|---|---|
| Physical truth | solid、groundBall、firm、leftSide、depth=null；continuousContactScore0.6433、paceScore0.5637；原producer計算，沒有直接寫truth |
| Identity | 正式PA `hs-y1-autumn-exhibition\|7\|上\|away\|regional-power-school-player-04\|0\|0\|falsefalsefalse\|ordinary-contact\|pitch-1`；同identity傳至handoff、Opportunity與PA event |
| Defensive Opportunity | supported=true、bindingStatus=bound、primaryPosition=SS、primaryDefenderId=player；secondary為實際NPC 3B。這是owner輸出，未因方向而直接指定 |
| Detailed ground handoff | **supported=false**，sourceAuthority=`unsupportedOrdinaryContactLegacyFallback`；不是可執行SS lifecycle |
| Official PA outcome | `single`，authority=`physicalOutcomeMappingV1`、compressedOfficialClassification、defenseConsumed=false；原Match apply記ordinaryPlay並推進打序 |
| 玩家分類 | **ordinaryPlay**；playerRoutinePlay0、meaningful created0／completed0。不是routine自動守備PASS，也不是density拒絕的證明 |
| Secure／fielding execution | 沒有本球的玩家Secure execution或closed SS situation，維持 **UNVERIFIED** |

Source chain為 `ensureHighSchoolOrdinaryGroundBallInPlayHandoff` → Physical → `getHighSchoolPhysicalDefensePlayerContext` → 正式Opportunity／`getHighSchoolReachAccess` → `DefensiveReachSecureFoundation.resolveReach`／projectAccess → Ground access。`projectAccess`僅在reached=true時支援詳細守備，否則可回到ordinary physical outcome。

**原unsupported handoff沒有保留這次失敗access的完整reachResolution／margin／variation witness。** 本輪只保存Physical邊界與正式呼叫前後資料，沒有包裝Reach owner，也沒有另行重算它。因此只能把上述Reach拒絕路徑列為source支持的推論；不能捏造margin、把primary binding當成功到位，或列完整Reach runtime proof為PASS。沒有為了補這個觀測缺口增加第三次gameplay。[Source](ss-defensive-controlled-scenario-contract-v0.1-source-evidence.json)、[Focused graph](ss-defensive-controlled-scenario-contract-v0.1-focused-graph-evidence.json)、[完整handoff／PA／矩陣](ss-defensive-controlled-scenario-contract-v0.1-findings-evidence.json)

## 4. Meaningful／合法選項／Throw／Runner／Settlement

本球未到`buildInfieldMeaningfulMoment`後的玩家classification／density／lifecycle admission。decisionGate=null、defensiveMeaningfulDecisionCount=0；沒有兩條合法防守路線可比較，也沒有單一路線可驗。不新增按鈕、不直接寫meaningful=true，不以「未形成Moment」判定整個系統FAIL。

| Gate | 本Scenario判定 |
|---|---|
| Legal defensive choices、decision identity、不同戰術取捨 | **UNVERIFIED**：沒有玩家守備決策 |
| Defense Decision quality／Execution quality分離 | **UNVERIFIED**；不能拿本場唯一進攻Moment代替 |
| Defense duplicate public submission／exactly-once | **UNVERIFIED**；沒有可重送的守備decision |
| Throw route／receiver assignment／runner timing | **UNVERIFIED**；沒有詳細SS execution |
| Force／Tag／Out／Safe／Error與SS settlement | **UNVERIFIED**；official single不是某條SS傳球失敗、Safe或Error的詳細判決 |
| 普通PA入壘／比分／event identity | **CONFIRMED本球**：outs維持0、batter進一壘、比分1：4；seq95與Record ref對應 |

本場仍有六局下的唯一進攻ID1／zone，public resolve及duplicate no-op通過；該保護只證明Current public入口，不補上守備gate。Diagnostic中「meaningful defensive decisions … when created」的條件式check有0次defense iterations，具名PASS不能視為C／D通過。Raw summary沿用前輪identity工具的`gateA／gateB`名稱，後者是public入口標籤；**本任務的Reach／Secure Gate B以本報告矩陣為準，未全通過**。

## 5. Match／Record／Career／Save／Replay與時間語義

兩次均115ticks自然完賽，7局終、3outs、空壘、home1／away4，completed／settled=true。這是整場真正完成，並非僅以一個play冒稱Final Record。

| 責任 | 本場限定證據 |
|---|---|
| State／Current | 每run230份before／after無issues；current Match reference、id與Event一致 |
| Game Record | final、assertIntegrity=true；home1run／7hits／0errors，away4runs／14hits／0errors；totals與Match／result.finalScore相同 |
| Log／event refs | 121 events／121 unique refs；sequence／type／inning／half逐筆相同；受控球為seq95 |
| 防守守恆 | created0＝completed0；**沒有非零守備coverage** |
| Actual exposure | participated=true、started=false、lateGameAppearance、entry6／exit7、PA1、defensiveInnings1；守備局數不等於守備Moment |
| Coach／Career | 原coachReaction為混合評語；evaluation sampleCount1、本場identity一次、history1，recentTrend=neutral、trendScore=-0.26；未要求正面評價 |
| Experience | settled=true；本場evidenceSummary為5筆（exposure3／active2），active來自進攻；不是SS meaningful credit |
| Save memory | normalizeSave round-trip保留Record、log、completedMoments、rosters、exposure、Experience與evaluation等已驗欄位；非browser storage lifecycle |
| 公開冪等 | 唯一進攻decision重送false、完整player不變；終局settle兩次＋finish一次皆false、完整player不變；不冒稱守備decision重送已測 |
| Replay | adapter witness、完整Record／Log／decisions／final player相同，另deep equality；不是observer-free neutrality證明 |

本球的普通PA event保存 **7上0outs、空壘、1：4 → 7上0outs、一壘有人、1：4**；Final Summary另為7終3outs、空壘、1：4。**本球沒有玩家守備Decision Context或completedMoment Resolution Snapshot**，不能把普通PA三時點改稱SS決策三時點。

本場已有的進攻三時點仍分開保存：選擇前6下2outs／三壘有人；結果後completedMoment為6下3outs／空壘；final為7終3outs。結果後Moment完整物件在finalization後deep equal，前輪Snapshot修復保留，沒有Production或Save schema修改。

| 首次／replay共同SHA-256 | 值 |
|---|---|
| Record | `98f6361db48929e18233404e1d48a426e25e30e5027c2faaafda362accbb06ca` |
| Log | `9e89d322b6d1cac569397eecf13e8f017442743b25322804b560e6c5b37cfdcf` |
| Decision sequence | `3abb5204e7aa101716892bd523c1a55146d2f04e0c23fa50ab737c4a1e962428` |
| Final player | `069139ba0cfc08a2b81e8ebab8653067238c90ad63a700929477f31705861b89` |

與前輪未注入的identity候選相比，initial Match及Record hash相同、Log不同；前輪lineDrive與本輪groundBall恰好都由正式outcome映射成single。**Record parity不代表Physical未改或adapter沒有作用。** 全部比較與原始event見 [Findings](ss-defensive-controlled-scenario-contract-v0.1-findings-evidence.json)。

## 6. 必要執行與正式回歸

| 本輪standalone | 結果 | elapsed | 成功Node assertion calls | Evidence |
|---|---|---:|---:|---|
| Scenario first | **PASS，13個diagnostic checks** | 383.7656ms | 1618 | [raw](test-infrastructure-sprint-0.1-ss-defensive-controlled-scenario-contract-v0.1-candidate-first-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-defensive-controlled-scenario-contract-v0.1-candidate-first-evidence-assertions.json) |
| 同Scenario replay | **PASS，14個diagnostic checks** | 387.6605ms | 1627 | [raw](test-infrastructure-sprint-0.1-ss-defensive-controlled-scenario-contract-v0.1-candidate-replay-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-defensive-controlled-scenario-contract-v0.1-candidate-replay-evidence-assertions.json) |
| 既有SS Integration | **26/26 PASS** | 4488.5793ms | 649 | [raw](test-infrastructure-sprint-0.1-ss-defensive-controlled-scenario-contract-v0.1-ss-regression-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-defensive-controlled-scenario-contract-v0.1-ss-regression-evidence-assertions.json) |
| 既有Ground Settlement Lifecycle | **26/26 PASS** | 2082.4668ms | 60 | [raw](test-infrastructure-sprint-0.1-ss-defensive-controlled-scenario-contract-v0.1-ground-regression-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-defensive-controlled-scenario-contract-v0.1-ground-regression-evidence-assertions.json) |

共2個diagnostic children、27個具名diagnostic checks／3245個成功assertion calls；另2個正式children、52個具名checks／709個成功assertion calls。共3954個成功Node assertion calls，這些計數不互換。唯一新Controlled Scenario共2場；既有正式套件的明示fixtures另計，不算第二個受控候選或自然proof。

SS Suite原有skills12／高三seed77001等人工fixture，Ground Suite也有其宣告的局勢／identity與reload案例，原文照跑，未為本輪改能力或結果；其PASS驗證既有SS公開handler與lifecycle能力，**不能代替本Scenario原能力下未到達的Reach／Secure／Throw**。

四次均exit0、stderr空、entryVerified／sourceStable=true，Node v24.19.0；raw保存actual command、env、source before／after hashes、完整stdout／stderr、exit／limits／witness。使用原Entry-Safe preload；docs runner profile僅保留前輪已審查的cached-diff→porcelain index metadata替換，正式runner bytes未改。Timeout120000ms、stdout buffer16000000 bytes、implicit Git show30000000 bytes未增限。[Entry profile](ss-defensive-controlled-scenario-contract-v0.1-entry-profile-evidence.json)、[Verification](ss-defensive-controlled-scenario-contract-v0.1-verification-evidence.json)

Canonical 50/50與Game Record13/13採Snapshot Repair歷史正式capture，其全部非docs dependency hashes與current逐一相同；本輪未重跑這兩套。沒有全套、額外seed／能力搜索、第三次Scenario、First-base timing、Receiver Integration或browser全套。

## 7. Git／WIP／protected integrity與限制

開工與結案branch=main，HEAD／main／origin/main tracking ref均為指定基線，index空；未fetch或重查遠端server。核對前輪1653個hash、31個delivery entries及delivery自身，建立 **1685個既有可讀檔案SHA-256**；結案全部相同。Production、正式tests／helpers、既有fixtures／seeds／pins、runner／registry與全部原WIP／captures delta＝0，前輪四個Snapshot修復完整保留。[Baseline](ss-defensive-controlled-scenario-contract-v0.1-baseline-evidence.json)、[Closeout](ss-defensive-controlled-scenario-contract-v0.1-closeout-evidence.json)、[Delivery](ss-defensive-controlled-scenario-contract-v0.1-delivery-evidence.json)

12個protected paths只核對status及size／mtime，沒有直接read／hash／執行／修改；metadata一致不是content hash證明。Source定位限明確檔案；沒有glob全文搜尋、git grep或git diff（含cached／stat）。新captures獨立命名、拒絕existing target、exclusive-create。沒有Reset／Clean／Stash／Stage／Commit／Push。

**白名單記帳限制：** 兩套既有正式regression入口與production index manifest均先明列，但其共同require的`tests/high-school-career-test-context.js`未在最初sourcePaths中另外列出，已由原套件執行時載入；結案才獨立明列並直接核對其內容。不能宣稱所有nested regression source都在執行前逐檔列入sourcePaths。該helper只載入同一index modules，沒有protected內容載入；受控Scenario的loader／runtime白名單則在執行前固定。[記帳紀錄](ss-defensive-controlled-scenario-contract-v0.1-regression-dependency-accounting-evidence.json)

採codebase-memory Tier2作必要結構查證，graph舊座標以current direct source／hash補證；focused coverage只涵蓋runtime、入口／helper、引用capture及本輪artifacts。Graph metadata／not_tracked不是完整性或freshness證明，未做新的全面Architecture Audit。[Source](ss-defensive-controlled-scenario-contract-v0.1-source-evidence.json)、[Coverage](ss-defensive-controlled-scenario-contract-v0.1-coverage-evidence.json)

## 8. 分級、UI前置條件與停止

| Gate／分級 | 結案 |
|---|---|
| 本輪單一受控情境設計與有界交付 | **COMPLETE**；首次＋replay完成後停止 |
| Controlled Component Proof | **CONFIRMED限定Physical／Responsibility**；不是完整守備component chain |
| Controlled input正式Match相容性 | **CONFIRMED**；同Current identity、正式owner接受、ordinary fallback後自然完賽 |
| 完整Controlled SS Match Integration Proof | **UNVERIFIED**；未形成可執行SS decision／Secure／Throw／Timing／SS Settlement |
| Natural Production Proof | **UNVERIFIED／本輪不要求**；受控結果不升格自然證據 |
| SS Match UI Slice資料契約前置條件 | **NO**；尚無同play的完整守備決策與執行資料 |
| 原#36／Gradient／S3 | 歷史FAIL／FAIL／UNVERIFIED保留；原suite與assertions未改 |
| Phase B2／Match UI施工 | **NOT STARTED／NOT STARTED** |
| Ready for Commit／Sprint10B／Receiver v2 | **NO／NO／DISABLED** |

下一步最小建議是人工審查本次Physical→Reach access的取證缺口；若另案授權，先在**同一輸入**補完整Reach唯讀witness與拒絕原因，不能換更容易的球、能力或seed來補PASS。現有證據不足以要求Production修補，也未授權修改守備規則。原「1出局、一壘有人」情境若仍必要，應另定正式owner可接受的建立契約，不能在本輪事後改局勢。

本輪沒有新增第二個候選、修改既有正式tests／Production或啟動UI。完成後立即停止，等待人工審查。
