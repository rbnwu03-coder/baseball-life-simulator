# 《棒球人生》SS Decision & Resolution Public Presentation Contract v0.2 — Foundation

日期：2026-10-16（Asia/Taipei）  
實際 branch：main；HEAD：`ab3117653945de0b7013636187c446276a96e634`，包含既有 WIP。  
證據：[本輪 evidence](ss-decision-resolution-public-presentation-contract-v0.2-evidence.json)

**獨立候選 Foundation 已建立，相關隔離契約測試首次執行25/25通過。** 本版只投影已公開的 Decision 資料與既有已結算的 SS 6-3 歷史結果；沒有接入 Production UI、修改 v0.1 或 Prototype。`ballPaceCueText`、`decisionFeedbackText`、`executionFeedbackText`均為null。

本輪新增且僅新增以下四檔；開工逐一確認不存在，未覆寫既有檔案：

| 檔案 | 用途 |
|---|---|
| [contract／validator](../contracts/ss-decision-resolution-public-presentation-v0.2.cjs) | `match-ui-slice/0.2` schema、嚴格白名單投影、來源／phase一致性驗證、deep-freeze與只讀Replay cache |
| [隔離契約測試](../tests/ss-decision-resolution-public-presentation-contract-v0.2.test.cjs) | 25項測試，僅載入新contract與既有JSON；未載入Production模組 |
| 本報告 | 欄位／owner／reveal／fallback、範例、限制與整合建議 |
| [evidence](ss-decision-resolution-public-presentation-contract-v0.2-evidence.json) | schema、兩個DTO範例、確認資料來源、完整測試stdout／stderr、hash與Git／protected完整性 |

## 1. 前置查證與授權邊界

開工先查閱[前輪audit](match-decision-observability-consequence-feedback-audit-v0.1.md)及其[evidence](match-decision-observability-consequence-feedback-audit-v0.1-evidence.json)，以及[v0.1契約](match-ui-slice-data-contract-v0.1.md)與[evidence](match-ui-slice-data-contract-v0.1-evidence.json)。逐項比較前輪sourceEvidence、documentEvidence與audit報告hash，均與當前工作樹相符；另以1909個既有可讀檔案建立本輪基線，前輪1907筆manifest沒有差異。沒有因文件名稱推定API或欄位已存在。

精確文字讀取allowlist為上述四檔、`docs/ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-findings-evidence.json`及`script.js`。新增的contract／test屬本輪施工與驗證範圍。附件為本輪任務來源；其餘既有檔案只依exact manifest做hash保護，12個protected paths只做metadata核對。

沿用`codebase-memory` skill的Tier 2流程，限定script owner查詢、trace、snippet及exact-path coverage。graph generation仍為`2026-10-15T01:30:19Z`；script為metadata_changed，文件及新增檔為not_tracked，故使用目前source精確區段補查，沒有宣稱最新完整graph coverage PASS、沒有重建索引或全域source搜尋。

現行owner再確認：

- `script.js:8584` 的公開infield分支確實產生方向、跑者語意及粗窗口；SS的pace是球種／守區label，不是粗速度。
- `script.js:11199` 在Decision前取得presentationText並保存到lifecycle，admit／present後才供決策。
- `script.js:12344` 保存結果Moment，`:12378`附路線、runnerChanges與敘事；`:12208`處理settled／closed，`:12436`在結算流程中呼叫關閉。
- 既有findings的`execution.settlement.settlementApplied=true`，`publicDecision.after.phase=moment_2_resolved`，有同球completedMoment及原始前後快照。

**正式owner存在，不等於已有Production安全exporter。** 本Foundation的輸入是先前經來源稽核的v0.1提案範例與精簡確認資料；不呼叫舊owner getter、prepare、resolver、settlement或品質評估。未建立正式命令receipt、live owner adapter、UI cursor橋接或Save恢復。

## 2. API、schema與來源信任邊界

新模組為純CommonJS，沒有任何`require`、IO、timer、RNG、Production imports或simulation callback。公開API：

```javascript
createDecisionView(v01PublicDecision, decisionConfirmation)
validateDecisionView(view, v01PublicDecision, decisionConfirmation)
createResolutionView(issuedDecision, v01PublicResolution, resultConfirmation)
validateResolutionView(view, issuedDecision, v01PublicResolution, resultConfirmation)
validateSchema(view)
validateRoutePair({ selectedRouteId, actualRouteId }, decision)
createReplayCache(issuedDecision, issuedResolution)
```

`SCHEMA`為可序列化的JSON Schema draft 2020-12，含DecisionView／ResolutionView兩個嚴格object，並隨模組deep-freeze；完整schema另存evidence。內建validator實作本schema實際使用的type／const／enum／oneOf／required／additionalProperties／array長度／整數範圍／文字長度，另檢查非空白字串及資料深度／大小。不是通用JSON Schema引擎，也沒有在本輪安裝依賴或宣稱外部validator兼容測試已執行。

分三層驗證：

1. **`validateSchema`只驗形狀與基本合法選項mapping。** 它不能認證某個字串真的出自owner、某個route曾被執行，或宣稱phase已由正式系統揭露。
2. **來源感知投影／validator**檢查v0.1白名單來源、confirmation、同球身份、前後快照及derived欄位。呼叫者不得把任意raw Match／completedMoment直接傳入；帶多餘欄位也拒絕，而不是悄悄轉送。
3. **正式來源與時點的可信取得**仍是未來正式adapter的責任。離線confirmation是可查證的資料宣告，不是簽章／權限token，也不是已交付的Production receipt。惡意呼叫者若同時捏造所有合法形狀輸入，本離線模組無法查證真實Match；不能把這層信任限制寫成完整runtime防洩漏PASS。

constructor輸出全為深複本並deep-freeze，不改寫或freeze呼叫者輸入。只有本模組當次建立的Decision才能用於結果投影；只有同一配對的issued views可以建立Replay cache。序列化後的任意JSON不冒充已發出物件；cold reload／跨process恢復不在本版範圍。

## 3. DecisionView v0.2欄位與fallback

下列欄位全部只在同一個admitted、presented Decision使用。所有未知欄位均明示null；必要身份／狀態／選項缺失則拒絕，不能用0、false或normal補值。

| 欄位／型別 | Owner／source | Reveal／必要性 | 缺值處理 |
|---|---|---|---|
| `schemaVersion` | 候選契約常數`match-ui-slice/0.2` | Decision必填 | 其他版本拒絕 |
| `matchId/momentId/presentationId:string` | 原v0.1 public source；核對同球confirmation | Decision必填 | 缺失／不符拒絕；presentationId沿用既有提案metadata，不假稱native owner id |
| `inning:number/half:top\|bottom/presentationSequence:number` | 原Decision可見快照與排序metadata | Decision必填 | 未知拒絕；不用終場或後續Match補值 |
| `kind=decision` | 契約種類 | Decision必填 | Playback／Resolution輸入拒絕 |
| `player.id/position=SS` | 原公開玩家身份與守位 | Decision必填 | 缺失／其他守位拒絕 |
| `player.responsibilityText:null` | 未建立獨立公開責任欄位；原situationText已有「進入游擊守區」 | Decision必填null | 使用原situationText；不輸出內部responsibility／initiator物件 |
| `state.outs/scores.home/scores.away/bases[3]` | 原Decision state；確認資料核對正式before | Decision必填 | 缺失／非整數／非布林／長度不符拒絕 |
| `situationText:string` | 原公開敘事與lifecycle.contextSnapshot.presentationText的已稽核mapping | Decision必填 | 空或缺失拒絕；逐字保留，不清理標點、不重新寫敘事 |
| `observations.ballDirectionText:string\|null` | 原公開`observations.directionText` | Decision必填nullable | 缺失／null→null，繼續顯示situationText |
| `observations.ballTerritoryText:null` | 本例無獨立欄位來源；球種／守區保留於原敘事 | Decision必填null | 使用situationText；不解析它製造球種enum或守區物件 |
| `observations.ballPaceCueText:null` | 尚未批准SS粗球速公開政策 | Decision必填null | 固定null；來源paceText若非null則拒絕，不接受firm／Playback pace |
| `observations.runnerMovementText:string\|null` | 原公開`observations.runnerCue` | Decision必填nullable | 缺失／null→null，沿用situationText中的跑者語意 |
| `observations.pressureText:string\|null` | 原公開`observations.readCue`，可為包含兩個壘包的原句 | Decision必填nullable | 缺失／null→null，沿用situationText |
| `observations.firstBasePressureText/secondBasePressureText:null` | 無獨立分壘文字欄位來源 | Decision各必填null | 不拆句、不讀內部timingWindows轉enum；原敘事仍保留兩壘粗窗口 |
| `choices[4]` | 原合法public choices逐項深複製 | Decision必填全部四項 | 少一項、重複route、命令／risk／routeLabel錯置、Moment不符皆拒絕 |
| `choices[].routeId/matchDecision/matchMomentId/label/routeLabel/objectiveText/risk` | 原legal-choice owner與v0.1白名單；risk為low／medium／high設計標籤 | Decision必填 | 不以advisable／readiness或quality補值；不是成功率 |

四個合法選項如下，不刪除未驗證路線：

| routeId | matchDecision | routeLabel | 原objectiveText | risk |
|---|---|---|---|---|
| secureFirstBaseOut | secure | 6-3 | 優先爭取打者出局 | low |
| forceSecond | forceSecond | 6-4 | 優先處理前位跑者 | medium |
| startDoublePlaySecond | challenge | 6-4-3 | 嘗試完成雙殺 | high |
| holdBall | contain | 持球 | 控制球與跑者 | low |

**本例的所有observations子欄位均為null，仍有公開資訊。** situationText原本已含來球往左、SS守區、一壘跑者往二壘、打者往一壘，以及兩個窗口都很緊。這個Foundation刻意不把原句解析成新的結構化事實；第一個consumer必須保留原敘事，不能只畫nullable slots就宣稱資訊不存在。

來源`observations`整包為null、缺失，或其可選子欄位缺失時，投影一律保留原situationText，對應slots明示null。原source的paceText僅允許null；.pace的「進入游擊守區的滾地球」不能改稱快球。沒有導出relay窗口、receiver readiness、reach／secure結果、RNG或任何內部quality。

## 4. ResolutionView v0.2欄位與fallback

Resolution必須有原issued Decision、已完成且status=settled的public resolution與同球confirmation。Foundation只支援實際路線`secureFirstBaseOut`的離線結果；其他actualRoute回`ContractError(code=UnsupportedRoute)`，不回正常DTO。

| 欄位／型別 | Owner／source | Reveal／驗證 | 缺值處理 |
|---|---|---|---|
| `schemaVersion`、三個身份、inning／half／sequence、kind／status | v0.2常數＋原同球v0.1 Resolution | Resolution；match／moment／presentation三者一致；sequence在Decision之後 | 缺失／不符拒絕。本版不支援跨半局快照轉換 |
| `selectedRouteId` | completedMoment.initialRoute對照原提交choice，經confirmation傳入 | Resolution；與確認資料一致，須是原合法route | 未知／不符拒絕；不能以actualRoute補selected |
| `actualRouteId` | completedMoment.activeRoute與已完成執行來源的既有mapping | Resolution；獨立於selectedRoute | 本版非secureFirstBaseOut走Unsupported，不套6-3結果 |
| `resultCode/batterResult` | 原正式結果／PA outcome的public白名單 | Resolution；保留原代碼，與retirement及outs核對 | 缺失／未知代碼／矛盾拒絕；不由動畫判決 |
| `runnerChanges[].runnerId/from/to` | 原completedMoment.runnerChanges的v0.1白名單副本 | Resolution；逐人與before／after runnerIds及occupancy核對 | 必填，可空僅在確認事實支持時；缺失不當空陣列 |
| `state` | 本球完成瞬間的outs／scores／occupancy | Resolution；與confirmation.afterState一致 | 缺失／矛盾拒絕，不取終場 |
| `outcomeText:string` | 原completedMoment.outcome | Resolution；完整原文 | 空／缺失拒絕，不為新欄位改寫 |
| `feedbackText:string\|null` | 原completedMoment.causeExplanation | Resolution；完整原文 | 原來源缺失或null→null，不從quality補字 |
| `selectedObjective:{routeId,matchDecision,routeLabel,objectiveText,risk}` | 原issued Decision內與selectedRoute相符的凍結legal choice | Resolution；只回顧原始選擇目標 | 原choice／目標是本Foundation的必要來源，缺失則拒絕；不猜心理意圖 |
| `stateChange.before/after` | 凍結Decision state與確認本球Resolution state各自深複本 | Resolution；兩端與confirmation一致 | 缺任一端拒絕，不拿目前Match替代 |
| `stateChange.outsDelta/scoreDelta` | 已確認after減before；只作顯示差異 | Resolution；與outsCreated、outRunnerIds及scoringRunnerIds核對 | 矛盾拒絕，不能重算baseball settlement「修正」來源 |
| `achievedOutcome` | 原resultCode、batterResult及已確認runnerChanges | Resolution；列出outRunnerIds／advancedRunnerIds／scoringRunnerIds | 必要movement來源缺失拒絕；不是選擇品質評分 |
| `verifiedTradeoffText:string\|null` | 本輪有限事實模板，僅在完整條件支持本例獲得／留下局勢時輸出 | Resolution；不是未選路線預測 | 條件不滿足則null，仍保留原結果事實；資料本身矛盾則整筆拒絕 |
| `decisionFeedbackText?:null` | 尚無批准的新公開判斷政策 | Resolution，可省略／nullable | constructor輸出null；validator允許省略；任何非null值拒絕 |
| `executionFeedbackText?:null` | 尚無經stage evidence審查的新文字政策 | Resolution，可省略／nullable | constructor輸出null；validator允許省略；任何非null值拒絕 |

新回饋欄位本輪刻意採比一般nullable string更窄的**null-only**政策，保留未來升級空間。沒有把reasonable、complete、advisable、readiness或raw margin翻成玩家評語；沒有把原judgment中的「確定出局」搬入新欄位。原outcomeText／feedbackText仍原樣保留。

## 5. Confirmation資料、同球驗證與失敗處理

confirmation只供離線contract邊界核對，不屬公開view。精確形狀如下；完整實例及每欄來源在evidence。

| 確認資料 | Source／限制 |
|---|---|
| Decision的三個身份、phase=decision、admitted=true、lifecycleState=presented | 身份取原範例及historical current Match／Moment；admission／lifecycle取findings.lifecycleBefore；不呼叫prepare取得新狀態 |
| Resolution的三個身份、phase=resolution、status=settled、settlementApplied=true、completedMomentId | 同一舊public call的已完成結果；settlementApplied直接取findings.execution.settlement；Moment取newCompleted.id |
| selectedRouteId／actualRouteId | 同球completedMoment.initialRoute／activeRoute，不能互相fallback |
| beforeState／afterState、beforeRunners／afterRunners | findings.threeTimes.decisionBefore與同球newCompleted；base occupancy只由已確認runnerIds映射布林，非重新決定進壘 |
| batterRunnerId／outsCreated／scoringRunnerIds | 同球Decision currentBatter及completedMoment正式欄位；不由oneOut猜出局者 |

runnerChanges核對包含：原壘包身份、打者身份、所有已知actor、after runner不能無中生有、同人不能重複change、安全到壘者須在指定after壘位、out／home者不得仍在壘、離開原位置者必須有change、出局增量與退休名單一致、得分增量與已確認scorer一致，以及batterResult與打者是否out相符。這些都是**已完成資料的一致性檢查**，沒有force、tag、時間競速或進壘模擬。

缺必要欄位、身份不符、快照矛盾、未settled、錯誤phase、非法選項或私有欄位一律throw `ContractError`，不產生部分正常DTO。外部consumer未來可映射DataError／Unsupported；本輪沒有UI error flow、重送或自動恢復。原始situationText缺失屬必要來源缺失，不用空字串維持畫面。

## 6. 有限策略回饋與selected／actual語義

三種內容分開保存：

1. **Selected Objective**：`selectedObjective`只從原凍結legal choice取值。
2. **Achieved Outcome**：`achievedOutcome`與原結果state／runnerChanges只描述已發生事實。
3. **Verified Tradeoff**：只在本例確切條件成立時產生中性模板。

本例模板的條件包括：selected與actual皆為secureFirstBaseOut、正式oneOut且batterResult=out、1→2出局、原一壘runner真實1→2、打者確實out、前後base occupancy相符，以及比分沒有改變。允許輸出：

> 優先爭取打者出局；實際完成打者出局，原一壘跑者推進二壘。

不產生「放棄雙殺」「改傳二壘會失敗」「6-3最佳」「確定拿到出局」。不根據終場分數或internal quality判定玩家對錯。

**契約沒有selectedRouteId===actualRouteId的通用限制。** `validateRoutePair`允許兩個不同的原合法route；本輪只用不帶結果的route-pair結構測試這件事，沒有為reassessment或未選路線創造completedMoment。結果投影則分別核對兩欄與confirmation；若將來有真實改線資料，也不能沿用原選擇目標當作實際路線。不同路線的執行／重判coverage仍未驗證；本輪沒有新增此類Gameplay fixture。

## 7. SS 6-3歷史範例

唯一來源是既有[SS findings](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-findings-evidence.json)，不是本輪新比賽。schema與完整兩DTO另見本輪evidence.examples。

| 項目 | v0.2範例 |
|---|---|
| Match／Moment／Presentation | hs-y1-autumn-exhibition／hs_y1_match_moment_2／example-ss-6-3-20261016 |
| Decision | 4上、1出局、一壘有人、主0客1、玩家SS；全部四個合法選項保留 |
| 公開敘事 | 原句逐字保留，包括往左、跑者動態及一二壘窗口都很緊；原句既有重複句點也沒有藉本輪改寫 |
| observations | 七個子欄位均null；player.responsibilityText也為null，責任語意仍在原敘事 |
| selected／actual | secureFirstBaseOut／secureFirstBaseOut |
| Resolution | oneOut、batterResult=out；4上2出局、二壘有人、主0客1 |
| 打者 | regional-power-school-player-09，batter→out |
| 原一壘跑者 | regional-power-school-player-04，1→2 |
| stateChange | before.outs=1、after.outs=2、outsDelta=1；scoreDelta.home=0、away=0；bases從[true,false,false]→[false,true,false] |
| selectedObjective | 6-3／優先爭取打者出局／low，保留原route與command |
| 原outcomeText | 你把球傳向一壘，球趕在打者跑者之前到達，一壘完成打者出局。 一壘跑者從一壘推進到二壘。 現在 2 出局、二壘有人。 |
| 原feedbackText | 主要原因：各段守備都在有效窗口內完成。 |
| 新品質回饋 | decisionFeedbackText=null；executionFeedbackText=null |

完整比賽後來主1客7的Final資料不進任何本球結果欄位。測試嘗試用Final比分替換本球state時會拒絕，未把Final當成本次選擇的策略代價。

## 8. v0.1相容策略與其他路線coverage

v0.2為新模組與新schema，沒有安裝成v0.1 exporter或替換Prototype fixture。`createDecisionView`／`createResolutionView`只消費白名單v0.1候選資料，不修改來源。保留三個身份、當下state、choices、selected／actual、resultCode、runnerChanges、outcomeText及feedbackText的既有語義；新增內容只在新物件上出現。

此模組不自動把v0.2送給v0.1 consumer，也沒有實作逆向降版API。若將來需要降版，必須另外明列欄位與版本路由，不能直接把多出欄位的v0.2物件當v0.1。v0.1資料及所有Prototype檔案已在測試與全工作樹完整性核對中保持原hash。

| 路線 | Decision legal | 本輪結果／Playback coverage |
|---|---|---|
| secureFirstBaseOut／6-3 | 保留 | 已有歷史實選結算；本輪只驗證其離線Decision／Resolution投影，未新增Playback或runtime橋接 |
| forceSecond／6-4 | 保留 | 歷史本情境未選；actualRoute為此值時結果投影Unsupported；仍缺同路線actual actor／target／runnerChanges／PA／snapshot驗收 |
| startDoublePlaySecond／6-4-3 | 保留 | 未選；Unsupported；缺兩段action dependency、actual actors、retirement順序、部分成功／失敗／third-out資料與投影驗收 |
| holdBall／持球 | 保留 | 未選；Unsupported；缺實際control、noThrow／noContest及完整跑者結算；不能套七段傳球演出 |

`SCHEMA`可表示四個route identity；這只保留語義空間，不證明每條結果已受支援。25項測試中的route-pair差異案例沒有結果；另三路線的負向測試只證明錯用6-3結果會被拒絕，不把其PASS當作那些路線的Gameplay成功證據。

## 9. 私有資料、deep-freeze與Replay

source、confirmation及DTO各有嚴格shape；未知欄位連同nested額外欄位一律拒絕。沒有object spread raw Match／contextSnapshot。source中的`physicalTruth`、RNG、quality、advisable、readiness、hidden evaluation、raw margin、Playback queue、provenance等不能進投影；正式output schema亦不允許它們。

投影前先查資料描述子，拒絕getter／setter、callback、custom prototype、symbol、non-JSON值、cycle、sparse array與超出大小／深度限制的資料；不為驗欄位而觸發getter。輸出深複本與所有nested object／array均freeze；caller可繼續持有自己的原輸入，不能藉修改它改變已發出的view。

`createReplayCache`只接受同一模組發出的原Decision／Resolution配對；`replay()`直接回傳原凍結Resolution reference。它不重新投影、不讀confirmation、不重算quality、不結算，也沒有simulation callback入口。這是只讀結果回看，**沒有七段Playback重播、沒有Production命令冪等性或跨reload恢復的驗收宣告**。

## 10. 測試與最小驗證

先執行兩個新檔的`node --check`，exit0。唯一測試命令：

```powershell
node --test --test-reporter=tap tests/ss-decision-resolution-public-presentation-contract-v0.2.test.cjs
```

Node v24.19.0；首次執行 **25 tests／25 PASS／0 FAIL／0 skipped／0 cancelled**，exit0、stderr空。測試前後新contract／test的hash相同；本輪沒有關鍵assertion失敗、沒有修改測試以掩蓋缺口，也沒有擴大執行Production／Prototype suites。

| 要求 | 測試涵蓋 |
|---|---|
| schema／必要欄位／身份 | v0.2獨立schema、required、三個身份、completedMoment及sequence／phase拒絕 |
| 全部合法選項／公開cue | 四route／command／risk／routeLabel保留；原敘事逐字一致；null不否定線索；firm拒絕 |
| unknown／必要資料缺失 | missing／null／partial observations與feedback null fallback；必要狀態缺失拒絕，不補0／false |
| 未來結果／私有資料 | Decision結果物件、nested raw欄位、quality、raw margin、callback／getter／cycle等拒絕 |
| 6-3局勢／runnerChanges | 1→2outs、一壘→二壘、主0客1；未知／重複／漏跑者、錯origin／destination／outs／snapshot拒絕 |
| selected／actual與未選路線 | route-pair結構允許不同；confirmation錯路拒絕；另三actualRoute不套6-3，無Playback API |
| 策略／品質文字 | 只輸出本例事實模板；最佳答案等篡改被來源感知validator拒絕；兩個新回饋null／optional，不升級保證句 |
| Replay／freeze | 同一凍結reference、confirmation getter不被重讀；原始JSON不能冒充issued pair；caller輸入不變 |
| v0.1／Prototype | 精確hash-only核對既有契約與全部既有match-ui-p1 Prototype檔案；沒有修改原fixtures |

測試輸入只重用已存在的歷史JSON。負向資料是局部故意破壞的contract輸入，不是新正式結果、Gameplay fixture或新Match情境。沒有執行historical builder／observer、VM或Production imports。完整stdout、stderr、source hashes及15項要求對應見evidence。

## 11. Source integrity、Git／WIP與停止

baseline以當前工作樹為準：**1909個既有可讀檔案＋12個protected paths＝1921個Git metadata盤點的既有路徑**。前輪來源／契約hash全符後才施工。結案重查全部1909個既有hash均相同；Production WIP、Save、Prototype、fixtures、所有既有測試與歷史報告／evidence不變。

12個protected paths僅使用exact stat與Git status metadata比較size／mtime／status，未讀取、hash、執行或修改內容；metadata不變不宣稱content hash已驗證。完整清單與數值在evidence.integrity。

branch／HEAD／main／origin/main tracking ref、Git index bytes／entries與原tracked WIP status均保留。新增僅開工宣告的四檔；沒有staged changes、沒有fetch或遠端server查詢，未reset、clean、stash、stage、commit、push。Git檔名inventory只用於manifest完整性覆蓋，不作全域source掃描；未作unscoped diff。

## 12. 後續Prototype integration建議與停止

**Foundation可交人工審查，尚未授權進入Prototype integration。** 審查可先確認：原敘事fallback是否符合可讀性、null-only球速／品質政策、有限tradeoff模板、confirmation的正式owner取得方式，以及其他合法路線的Unsupported／原文字流程安排。

若人工批准下一輪獨立Prototype integration，可讓新consumer明確選用v0.2與本球資料，保留v0.1，並先驗版本、phase、fallback與未支援路線流程。不得因schema或本輪25 PASS就直接接正式UI、擴充未選路線結果、啟動UI-P3／Phaser或替換既有fixture。真實改線、半局轉換、live receipt、timer／cursor整合與cold reload仍需獨立來源及驗收。

本輪完成Contract Foundation、報告與evidence後停止。未修改Match Engine／Production Adapter／Prototype／Save，未直接替換v0.1，未執行新比賽情境、Browser或大量模擬。

Ready for Commit＝**NO**。Ready for Sprint10B＝**NO**。Receiver v2＝**DISABLED**。等待人工審查與下一階段授權。
