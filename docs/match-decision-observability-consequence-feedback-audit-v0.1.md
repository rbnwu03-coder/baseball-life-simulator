# 《棒球人生》Match Decision Observability & Consequence Feedback — Read-Only Design Audit v0.1

日期：2026-10-16（Asia/Taipei）  
實際工作樹 HEAD：`ab3117653945de0b7013636187c446276a96e634`（main，包含既有 WIP）  
交付：[本輪 evidence](match-decision-observability-consequence-feedback-audit-v0.1-evidence.json)

## 1. Executive Summary

**現行 Match 已有支持策略選擇與單球後果理解的來源，但尚未形成完整、安全且一致的前端消費契約。** 最小下一步是整理既有公開觀察、正式選項目標與同球結果差異；不需要先增加模擬數值或動畫。

- Decision 並非沒有資訊。正式敘事已提供來球方向、SS 處理責任、跑者移動，以及一壘／二壘的粗窗口；`observations` 四個子欄位為 null，只表示 v0.1 範例未另行摘錄。不能用它否定原公開敘事。
- 本例的 pace **沒有公開快慢**：`adaptInfieldInformation().pace` 實際是「進入游擊守區的滾地球」。內部 `firm` 與 Playback 的 `firm` 不可倒灌成 Decision 提示。可另案由正式 Presentation owner 建立粗速度文字，無須改物理模擬。
- 6-3、6-4、6-4-3 的目標與風險標籤不同，足以讓玩家選擇優先處理誰、是否承擔接續轉傳。**現有線索不足以證明 6-3 比其他路線更容易成功或期望價值更高。** 本球兩個公開窗口同樣很緊，不能替玩家宣布唯一正解。
- Resolution 可確定：選擇及實際路線皆為 `secureFirstBaseOut`；打者出局，原一壘跑者推進二壘；1→2 出局，主0客1不變。它與後來終場主1客7分屬不同時點。
- Decision quality、Execution quality、Outcome 與 Experience／Evaluation evidence 分層存在；但評價是現行啟發式分類，並非已驗證的最佳策略評估。新增 `decisionFeedbackText`／`executionFeedbackText` 適合作為 **DTO v0.2 候選**，必須由正式敘事 owner 輸出，先審查保證語氣與原因證據。
- 另三路線已證實合法，正式執行分支存在；本受控情境未選取、未結算它們，不能交付其 Playback 成功證明。

本輪僅新增此報告與 evidence；沒有改 Production、Prototype、v0.1 契約、Save、fixture 或既有測試／證據，沒有載入執行遊戲程式。所有建議均為設計提案。

## 2. 範圍、allowlist 與證據等級

優先讀取六個文件／資料：

1. [UI Slice Data Contract v0.1](match-ui-slice-data-contract-v0.1.md) 及其 [evidence](match-ui-slice-data-contract-v0.1-evidence.json)。
2. [SS Strategic Scenario Fixture & PA Ledger Integration](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1.md) 及其 [findings](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-findings-evidence.json)。
3. [Spatial Focus Layout v0.1](match-ui-p2.2-spatial-focus-layout-v0.1.md) 及其 [integrity evidence](match-ui-p2.2-spatial-focus-layout-v0.1-evidence.json)。

文字 source allowlist 在程式來源讀取前明列，再按已查出的直接 owner 相依逐檔擴充，最終只有：`script.js`、`match-experience-development.js`、`high-school-competition-reassessment.js`、`defensive-decision-throw-foundation.js`、`defensive-runner-throw-settlement-foundation.js`、`batted-ball-ground-defense.js`、`offensive-bunt-defensive-handoff.js`。擴充最後兩檔是為追查窗口及跑者 cue 的建立時點，不擴大為棒球規則稽核。完整 allowlist、實讀區段、hash 與探查限制在 evidence。

其他既有檔案只依前輪 exact manifest 做 hash 保護，不作文字搜尋來源。未讀任何 Prototype source；UI-P2.2 的現況引用其原報告，101/101、Browser NOT RUN／人工視覺 PENDING 都是歷史記錄，非本輪驗收。

採 codebase-memory Tier 2：index status、限定檔案 search、trace、snippet 與所有13個實質證據檔案的 coverage 查詢成功。generation 仍為 `2026-10-15T01:30:19Z`；7個程式檔均 `metadata_changed`，6個未追蹤文件均 `not_tracked`。因此 **Graph 僅作定位，沒有最新完整 graph coverage PASS**；實質結論依目前 allowlist 的 source 區段及 SHA-256 查證。跨模組呼叫在 graph trace 中可能漏列，例如 shared timing；已直接讀 import 與呼叫位置補足。未重建索引、未作全域架構／不存在性宣告。

證據分三層：現行 source 可證明欄位、分支、公開使用與建立順序；既有 findings 可證明這個受控 SS 6-3 的實際執行；本輪靜態比對可證明兩者 mapping 與同球資料一致。三者都不等於本輪重跑、自然 Production proof、Browser 可讀性驗收或正式 DTO API 已交付。v0.1 本身是提案與離線例子，尚非 Production exporter。

## 3. Audit A／B：Decision cue source matrix

分類針對「這個 cue 在 Decision 的這種表達」：**A**＝已有公開 Presentation，可按白名單使用；**B**＝內部有資料，尚缺合法公開投影；**C**＝目前限定來源沒有可靠證據，不能顯示；**D**＝若要支援該能力，需要新設計／模擬機制。A 不表示可以轉送整個 owner 物件。

主要定位：`script.js:2584` 公開任務敘事、`:2522` 場上線索 renderer、`:5914` observation、`:6274` 可見局勢、`:8584` infield 公開文字、`:8698` situation 組句、`:8770` lifecycle 凍結敘事、`:8830` 合法選項。內部來源：`batted-ball-ground-defense.js:146/276/299/320`，shared timing 在 `offensive-bunt-defensive-handoff.js:162`。

| Cue／分類 | Source、目前實際內容與邊界 | 策略辨識／是否重複 | SVG／短文與複雜度 | 提前洩漏與 DTO 需求 |
|---|---|---|---|---|
| 來球方向 **A** | `adaptInfieldInformation.direction`；本例「往你的左側移動」，原 situationText 已含 | 說明接球責任與身體處理方向；不能單靠它排名傳球路線 | 一個示意方向或短句即可，低複雜度；不是精確軌跡 | 只用公開字串，不取結果球路；v0.1 directionText／situationText 已可容納 |
| 來球球種／守區 **A**；粗速度 **B** | `.pace` 本例其實為 ballContext.label「進入游擊守區的滾地球」；內部 physicalTruth.pace=`firm`，公開 label 未保留快慢 | 球種／守區有用但部分重複責任；真正快慢可能影響處理理解，現時不能顯示為已知 | 原 label 短文即可；不得以快速 SVG 運動暗示已公開 firm | v0.1 paceText 可承載未來 owner 文案，不必為一個字串新增欄位；目前保持 null／原 label。結構化粗速度需 v0.2 投影；不能讀 Playback 回填 |
| 玩家守位與處理責任 **A**；全員精確位置 **C** | 公開「目前守位」、infield.position、敘事「進入游擊守區」；lifecycle.actor 保存 player／initiator／游擊手。合法路線也表達1B／2B接續責任。沒有可公開的逐球全員 XY 契約 | 能解釋為何是玩家收球；不應再加角色代碼 | 示意 SS 守區／玩家符號，低至中複雜度。SVG座標是版面，不是模擬位置 | v0.1 player.position 足夠；完整 responsibility object 屬內部。若要求真實連續站位與移動，為 **D**，非本切片必要 |
| 跑者占壘 **A** | 可見 Presentation currentSituation／bases；對照 lifecycle.createdAt 與 v0.1 state。本例一壘有人 | 是所有目標的前提；已有記分板時勿重複多份壘況文字 | 壘況＋單一句即可；沿用既有中性壘包，不要求恢復一壘綠點 | 不讀 raw Match 的後續局勢；v0.1 已有，無新增欄位 |
| 跑者移動方向 **A** | `.runnerCue`／原 situationText：「一壘跑者受迫往二壘，打者跑者正衝向一壘」 | 直接區分6-4的目標與6-3的目標；不是單純重複占壘 | 可用短句；未有結構化來源時不要從字串解析 runnerId 畫具名移動 | v0.1 runnerCue 可容納原句；具名動態陣列需 v0.2 公開投影 |
| 跑者是否已啟動 **A**（粗語意）；起跑品質／進度 **B** | 上述「正衝向」「受迫往」已有公開語意；internal startQuality、timingProfile、advancementProgress 有值，但 SS groundBall 公開分支不輸出它們。本例 startQuality 為 normalStart，不能叫偷跑或提前起跑 | 已啟動有用；精細品質目前無安全必要性 | 一句合併方向與啟動，避免第三張提示卡 | v0.1 原 runnerCue 可用。其他 generic 分支的「已提早啟動」不可套用這個 SS 分支；進度／品質另候選，缺失隱藏 |
| 一壘／二壘粗緊迫度 **A** | `.readCue` 由 leadRunnerForceWindow／batterRunnerFirstBaseWindow 的 state 轉字；本例兩者皆「窗口很緊」 | 是少數直接影響策略推理的 cue，但本例兩者相同，不能推出哪條比較安全 | 合併一行「二壘封殺窗口很緊；一壘出局窗口很緊」，無倒數條 | 形成於 Decision 前；不是 completed timing。v0.1 readCue／situationText 足夠，結構化分壘壓力為 v0.2。未知用「仍需判斷」或省略，不能補 normal |
| 可用傳球路線 **A** | `generateInfieldLegalChoices` → lifecycle.legalRoutes → public choices，6-3／6-4／6-4-3／持球 | 直接決定可行動集合；必須保留所有正式合法選擇 | 以選項呈現，需時才畫選中／聚焦的示意線，避免三條交錯線 | route 是計畫，非成功預演；v0.1 choices 已足夠。不得將 post-secure opportunity 當新 Decision 建議 |
| 各路線正式目標／粗風險 **A** | `getInfieldChoiceTradeoff/Commitment`（`:7588/7606`）及契約白名單 objectiveText／risk／routeLabel | 辨識力高；low／medium／high 是設計風險標籤，不是機率，也不保證產生出局 | 每項「目標＋風險」即可；不額外顯示內部分數 | v0.1 已可容納；不得加入 advisable／readiness／successChanceHint 或隱藏評價 |
| 跑者／打者粗腳程 **A，有條件** | observation.batter.speed、runners[].speed；`formatHighSchoolMatchSpeed` (`:4518`) 已轉粗字，`:2522` renderer 已使用 | 可解釋窗口緊；有readCue時是次要資訊，預設不需再一張表 | 詳細資訊一行，避免數字能力值；renderer 有預設值，缺實體不應聲稱確認其腳程 | 現行公開能力不等於 v0.1 DTO 有欄位；獨立展示需 v0.2 optional speedCue，或省略。未擷取本球實際 observation 回傳，不宣稱此次已驗其畫面文字 |
| 打者姓名／慣用打側 **A，有條件** | observation.batter 的 name／handedness 已由現有 renderer 消費 | 辨識對象有用；本 SS 三路選擇沒有已證實的額外策略增益 | 次要資訊，不納入最小集合 | v0.1 未獨立承載；若擴充須另欄位與身份核對，缺失省略 |
| 教練指示 **A，有條件** | `getHighSchoolCurrentCoachTacticalDirection/formatHighSchoolCoachTacticalDirection` (`:6018/6026`) → coachLine；`:2513` 已顯示；lifecycle.recommendation 也有凍結位置 | 提供目標背景，與玩家自己的選擇有別；泛用口號可能重複目標 | 最多一行、非最優答案標記；不顯示 trust／riskPreference 等內部依據 | v0.1 無獨立欄位，需 optional v0.2。須 pin 同 Decision，不用後來 coachReaction 回填；本 findings 未證實本球實際教練句，故不填例子 |
| 其他戰術公開 cue **A（介面存在），本球具體內容 C** | `getHighSchoolOpponentObservableCues` (`:5895`) 可接既有 observable tactical formatter，另有泛用「隨投球準備啟動／先讀速度與落點」 | 泛用句辨識力低；本輪沒有沿 tactical 模組擴查、也無本球戰術事件證據 | 只在確有同球公開事件時選一條；不把準備啟動覆蓋為當下尚未起跑 | 不臆造偷點／盜壘；新增事件式 cues 需另案 owner 審查，不將泛用敘事當逐球證明 |

**不納入 Decision 的 B／C／D 邊界：** relayToFirstWindow、各路線 routeAssessments、raw timing、receiver readiness、reach／secure 成功、quality、RNG、physicalTruth、未選路線結果均不可直接公開。relay 窗口雖在內部已存在，現有 readCue 未公開它；不能因它是 expired 就提示「雙殺一定失敗」。精確秒數、距離、全員移動座標與可靠成功率在本限定公開來源無證明（C）；若產品要求真實時間賽跑、完整連續守備幾何、機率／反事實策略比較，需新設計、校準與可能的新模擬（D）。本輪不需要它們。

粗窗口來源在 `buildGroundBallDefensiveOpportunity` 的 settlementApplied=false 階段建立，經 `createGroundBallMatchSituation` (`script.js:11179`) 凍結 presentationText，再 admit／present；不是由最終 timingMargin 或 resultCode 反推。A 類只允許沿用這條既有公開文字鏈，並不授權前端再映射內部 state。

## 4. Minimum Decision Information Set v0.1

最小集合為四組，沿用 v0.1 能容納的資訊：

1. **當下局勢**：4局上、1出局、一壘有人、主0客1；玩家為SS，處理進入游擊守區的球。可見 cursor、Match／Moment 與 frozen Decision snapshot 必須一致。
2. **當下觀察**：來球往左；一壘跑者受迫往二壘，打者往一壘；一壘出局與二壘封殺窗口都很緊。以原 situationText 作唯一文字來源即可，不需要把同一段話再拆成四張卡。
3. **可選行動及目標**：6-3優先處理打者／low；6-4優先處理原一壘跑者／medium；6-4-3嘗試雙殺／high；持球控制球與跑者／low。標籤是正式目標與粗風險，不是預測。
4. **不確定性語義**：所有路線都是嘗試。資訊不夠時不補快慢、接球成功、隊友準備程度或未選路線結果。

**玩家為何可能選6-3？** 玩家可能優先爭取打者出局，接受原一壘跑者仍可能推進的代價；其正式目標、low風險標籤及只送往一壘的路線，與優先處理前位跑者的6-4、追求兩個出局且含隊友轉傳的6-4-3不同。這是目標與路線承諾的差異，不是本球成功保證。原選項不表示玩家主觀上願意讓跑者推進；只能說路線沒有以該跑者為主要出局目標。

6-4可能符合「先處理前位跑者」的偏好；6-4-3可能符合「嘗試更多出局」的偏好。**無法從目前兩個同樣很緊的 cue 推論6-4會失敗，亦無法宣稱6-4-3能結束半局。** 不能從本球6-3最後成功，回頭稱它一定正確。若產品目標是讓玩家計算哪條最優，現行公開資訊與評估依據不足；若目標是讓玩家理解目標差異並做選擇，最小集合已足夠支援有限的有意義推理，仍待人工體驗驗收。

## 5. Audit C：Consequence feedback source matrix

唯一實例：Match `hs-y1-autumn-exhibition`、Moment `hs_y1_match_moment_2`，打者 `regional-power-school-player-09`、原一壘跑者 `regional-power-school-player-04`。以下「可公開」均指正式 settlement 確認且 Resolution gate 開放後。已完成 facts 可以支援演出，不表示 Decision 可先讀取。

| 回饋項目／種類 | 正式 source／本球事實 | 可說與不可推論 | v0.1 能力 |
|---|---|---|---|
| 選擇了什麼／結果事實 | submitted public choice、completedMoment.initialRoute=`secureFirstBaseOut`；decision=`secure` | 「選擇6-3／傳一壘」；routeId 與命令字不同 | selectedRouteId 已有；選項原文由固定 Decision cache 查回 |
| 實際做什麼／結果事實 | activeRoute，同球 execution.selection／throw、actionFacts | 本球實際也是6-3；不能永遠假定 selected=actual | actualRouteId 已有；內部 actionFacts 需去 provenance，不能整包傳 UI |
| 有無出局／結果事實 | resultCode=oneOut、outsCreated=1；PA result=out；runnerChanges 指定打者→out | 「打者在一壘前出局」；不能從 oneOut 通用推定是打者 | resultCode、batterResult、runnerChanges 已有 |
| 出局數改變／結果事實 | frozen Decision state.outs=1、completedMoment.outs=2；`:10440` 保存 result-time snapshot | 「1→2出局」；不是再由前端套規則結算 | 前後兩份 state 已有，可做顯示差異 |
| 哪位推進／結果事實 | runnerChanges：player-04，1→2；runners=[null,player-04,null] | 「原一壘跑者推進二壘」；非打者上二壘 | runnerChanges 已有，不必新增規則或姓名推測 |
| 哪位出局／結果事實 | player-09，batter→out，對照 official PA 與实际 retirements | 本球打者出局；未出局的跑者不等於失誤 | v0.1 已有足夠同球身分 |
| 比分改變／結果事實 | Decision／Resolution scores 均 home0／away1，scoringRunnerIds空、runsAllowed=0 | 「本球沒有失分／主0客1不變」；不可帶入終場1：7 | 兩份 state 已有；不是讀全場 totals |
| 原始戰術目標／策略目標 | 原 legal choice.objective=secureOut，契約objectiveText「優先爭取打者出局」 | 可以回顧選項承諾；不能說玩家內心是為保護某隊友 | v0.1 choices 可回查；Resolution 獨立攜帶目標是 v0.2 候選 |
| 目標是否達成／結果與目標比對 | secureOut目標＋打者明確out、route相符 | 本球可說「打者出局的目標已達成」。這是事實比對，不是decision quality評分 | v0.1可並列「目標」和「實際」；專屬判定文字需正式owner／v0.2，不由UI自由評分 |
| 實際策略取捨／有來源的描述 | 原目標不以player-04為出局目標；其實際1→2，原比分不變 | 「取得打者出局；原一壘跑者仍推進二壘」。描述獲得與代價，不說刻意放棄封殺、不說另一條本可雙殺 | 用v0.1事實並列即可；專用tradeoffText須v0.2 owner規則 |
| 場上仍留什麼／結果事實與有限解讀 | 2出局、二壘有人，第三出局尚未發生；比分仍落後1分 | 「二壘仍有跑者，半局尚未結束」。不能推算失分率、下一棒會怎樣，或拿終場當此決策代價 | v0.1 state已有；風險值、得分機率沒有安全來源 |
| 執行與原因／owner敘事 | completedMoment.outcome、executionText、causeExplanation、defensiveOutcomeExplanation | 本球原feedback：「主要原因：各段守備都在有效窗口內完成。」；可以保留既有原文，不外推未選路線 | v0.1 outcomeText／feedbackText已有；分離回饋見下一節 |
| 未選路線的假設結果／禁止生成 | 本球沒有另三條路線的 committed execution 或 settlement | 不產生「改傳二壘就能／不能出局」「不選雙殺因此多丟分」 | 不新增、不補值、不進DTO |

結果快照由 `applyInfieldResolutionToHighSchoolMatch` (`script.js:12280`) 經正式settlement／third-out／PA owners更新後，交 `recordHighSchoolYearOneMoment` (`:10440`) 保存，再附 route、runnerChanges、quality與敘事。這是owner鏈的靜態查證，沒有重新呼叫它們。

歷史 public call 的 PA seq48、meaningfulMomentResolved49、defensiveResolution50，共同指向本球；不是三次玩家結算。evidence逐項比對Moment、physical／decision／action身份、選中route、snapshot與v0.1 mapping。lifecycle 的sourcePhysicalStateRef／createdAt.paIdentity可能是ground-defense identity，不能要求它與pitch-physical identity字串相等；須按owner關係核對，不剝字串重造身分。

三時點嚴格分開：Decision為4上1出局一壘有人0：1；Resolution為4上2出局二壘有人0：1；歷史Final為7終3出局空壘1：7。findings.threeTimes.snapshotPreserved=true，且本輪直接深比對其Resolution與newCompleted副本。終場不是本球回饋的fallback。

## 6. Audit D：Decision／Execution 品質資訊界線

| 層次 | 實際保存位置／產生時點 | 本輪判讀與公開界線 |
|---|---|---|
| Decision quality | `buildHighSchoolShortstopExecution` (`script.js:11999`) 將choice.advisable分類複製到resolution；`:12385` 保存completedMoment；`:7580` 啟發式產生advisable | 本球reasonable；不是因最後out推導。但雙殺可能被標strong，並未完整整合兩個緊窗口／relay狀態，不能稱最佳策略oracle |
| Execution quality | `script.js:12000` 根據firstOut／secondOut／error／hold分類；playerLeg／teammateLeg／timingResolution另保存動作證據；`:12386/12403` 入Moment | 本球complete；該總類別部分依結果分類，**不是完全獨立於Outcome的技能量測**。應優先以實際動作描述，不能只翻譯complete成完美操作 |
| Outcome | resultCode、outsCreated、runnerChanges、scores／runners、PA compatibility及owner outcome | 本球oneOut、打者out、跑者推進；tier=mixed與executionQuality=complete屬不同分類，不宜翻成「決策失敗但執行成功」 |
| Experience evidence | `match-experience-development.js:108/345/465/581`；Decision／Execution／Outcome evidence分欄，completed match才正式settle | 保留分層、技能stage與來源，但有normalization／fallback與aggregation，不能把經驗分數反推本球策略建議；不在單球Resolution觸發全場結算 |
| Evaluation／history | `high-school-competition-reassessment.js:71/77` 合併moment quality與全場evidence；`script.js:12946/13061` 保存評估／decisionExecutionSummary | 評估為全場／生涯層級。歷史有sampleCount與experience settled證據，不因此可把raw quality、trend或成長數字公開至本切片 |

**已存在適合審查的公開文字owner，不必從零設計quality展示：** `createDefensiveOutcomeExplanation` (`script.js:8127`) 組裝judgment、executionSummary、outcome、causeText、coachFeedback；`:12406` 保存到Moment。但本輪不直接導出整包explanation，也不直接公開quality／readiness／sourceEvidenceIds。

### DTO v0.2 文字候選的具體判定

| 候選 | 正式source／產生時點／公開時點 | 與feedbackText一致性 | 缺資料與事後合理化風險 |
|---|---|---|---|
| decisionFeedbackText | 正式守備explainability owner的judgment，依凍結原choice／initialRoute與原decision context建立；可在執行後組成，但評判依據必須pin在選擇當下。保存completedMoment後，**只在Resolution**公開 | v0.1 feedbackText維持causeExplanation的原因角色；新欄位談原選擇目標，不能把原原因改寫成「你選對了」 | 原judgment已含「先抓一壘的確定出局。判斷合理。」；應先由owner審查並改成非保證的目標／可證實依據，再納入v0.2。缺原choice/context或出現矛盾時null，仍顯示目標和結果。禁止前端從out推導正確，禁止以終場分數證明決策 |
| executionFeedbackText | 正式explainability owner的executionSummary／已存executionText；以同球playerLeg、teammateLeg、action與cause evidence生成，執行完成／settlement確認後保存；**Resolution**公開 | 與同一份causeText／feedbackText並列：前者描述完成哪些動作，後者說明可證實原因；不得互相歸責矛盾 | 現行`getDefensiveExecutionExplanation` (`:8063`) 在oneOut時有通用成功句，未必逐stage證明。新欄位需證據檢查，不能只翻譯executionQuality/resultCode。缺stage或無法歸責時null／owner的「紀錄不足」句，不補成功動作 |

本例已有judgment與executionSummary的**歷史原文證據**，但「已有owner文字」不等於「原句適合無條件升級為v0.2」。尤其「確定出局」、partial雙殺的泛用合理判斷文案（`:12311`）、cause／coach的結果條件分支，都可能形成過度肯定。未來應由同一owner依同球證據產生三種互相一致的公開文字，不由UI拼接品質等級。

驗收須覆蓋「相同選擇目標、不同執行結果時，不自動翻轉決策評語」、「相同oneOut但實際出局跑者不同」、「隊友接續失敗不冒充玩家傳球失敗」、「缺stage不歸責」、「原目標與activeRoute不同」。這些是下一階段待授權測試規格，本輪未造fixture、未執行案例。

## 7. Audit E：其他三條守備路線 coverage

| 路線 | Legal choice | 正式execution source | 本情境實選／結算 | 安全Playback DTO判定 | 尚缺資料／驗收 |
|---|---|---|---|---|---|
| forceSecond／forceSecond／6-4 | YES；findings.choices、lifecycle.legalRoutes與`:7775`，目標attackLeadRunner | YES，SS commitment指向2B；`DefensiveDecisionThrowFoundation:93/113/142` 選路／傳球，timing／settlement，SS builder接續runner settlement | **NO，本球未選**；不得推測跑者safe/out | **尚不能建立已驗證的本情境DTO**。有建立路線投影的source基礎，須使用其真實已選execution；不可複製6-3的打者contest／result | 實際2B actor、target runner、傳接狀態、out身份、PA結果、runnerChanges與snapshot；未知／失敗／未傳球fallback及identity測試 |
| startDoublePlaySecond／challenge／6-4-3 | YES；有一壘跑者、少於2outs的正式選項；目標attemptDoublePlay | YES，foundation `:102` 有DP first-leg／continuation；`script.js:11970` 接續relay／secondOut與player／teammate legs | **NO，本球未選**；內部relay window不是此路線的實際結算 | **NO，固定6-3七段不能宣稱支援雙殺**。需實際第一傳／踩壘／pivot／第二傳／接球及可能部分完成的event契約 | 兩段action dependency、actual actors、ordered retirements、部分成功／safe／error結果、第三出局與壘況一致性；不能將first-leg source等同完整DTO |
| holdBall／contain／持球 | YES；目標controlBall；本例baseballValue=executionOnly，非第4個策略meaningful | YES，foundation `:146` deliberateHold→throwAttempted=false；timing `:32` noContest；settlement `:127` 保留runner continuation；SS builder再處理正式跑者結算 | **NO，本球未選**；不推測壘況或是否另有失誤 | **NO，不能套必有throw／receive／contest成功的七段**。需route-specific事件／文字fallback；控球失敗亦須真實source | 實際control結果、no-throw/no-contest、所有跑者最終位置、outs／score；未知值不可當0、不畫成功傳球 |

歷史findings證明的實選始終是first-legal 6-3，另有同條件一次replay；其列出的SS／Ground／Record suites是前輪既有回歸結果。**沒有把suite名稱或總PASS數挪作本情境另三路線已執行的證據。** 本輪不另查整個repository是否曾有其他路線成功，亦不宣稱它們在所有歷史來源皆無證據。此處是指定scenario與allowlist的coverage界線。

Legal與execution分支可存在，仍須等待真正的已選資料與投影驗收，才能支援Playback。既有契約的正式文字流程／Unsupported是安全fallback；不能刪除合法選項、靜默換成6-3，或為演出補造結果。

## 8. Audit F：DTO v0.2 候選設計

以下全為候選，**不修改v0.1**。Owner指正式資料語意與公開文案owner；未來adapter只做白名單複製、身份／phase驗證與deep-freeze。D＝Decision；R＝Resolution；不轉送contextSnapshot、physicalTruth、RNG、raw margin、readiness、quality、hidden evaluation、未選路線outcomes。缺值不等於false／0／空陣列。

| 候選欄位 | Owner與source | Reveal phase | 已可實作？ | 缺失fallback | Simulation修改？ | 驗收方式 |
|---|---|---|---|---|---|---|
| D.ballCueText（或沿用observations.directionText） | Infield Presentation，已公開direction＋ball label | admitted／presented D，pin同球 | 原公開文字可投影；新欄位僅整理，不是新知識 | 原situationText；未知不畫方向 | 否 | 與原公開字串一致、無firm／後果注入、同Moment |
| D.ballPaceCueText | Infield Presentation新增安全粗速度投影；只在owner政策明定可觀察時由既有pace形成短文 | D，建立於提交前 | **待owner政策／文案**；本SS目前未公開快慢 | null，保留「滾地球」 | 否，沿用現有球況；若要求速度數值才另案 | firm等內部值不直接穿透；不同pace文字、缺值、phase與禁止結果來源檢查 |
| D.runnerMovementCues[]（runnerRef／from／toward／movementText） | Runner公開投影＋Infield Presentation；以既有runnerCue語義及同球runnerRealization建立最小陣列 | D | 原句可用；具名結構需新公開投影 | 只顯示原runnerCue；沒有可靠身分不畫具名移動 | 否 | 方向／啟動與owner一致，不含startQuality／progress／timingProfile；不把預定移動當已到壘 |
| D.pressureCues[]（targetBase／text） | Infield Presentation的既有readCue；從公開窗口文字建立正式分壘投影 | D | 原句可用；結構化需owner exporter | null或既有「仍需判斷」，不補normal | 否 | 本例兩者很緊；與已公開文字相同，不含raw timing或relay結果；未知窗口處理 |
| D.choices[].feasibilityText | Legal-choice／Presentation owner，只說目標／封殺關係／接續責任；來源是原合法choices、公開runner cue | D | 目標／拓樸可實作；**路線成功把握比較未具備安全來源** | 原label／objectiveText；無資訊不填「可穩定完成」 | 否；若要求校準成功率／最優排序，需另案設計與可能模擬 | legal≠success；SS default availability.normal不顯示為窗口；禁止advisable／post-secure assessment |
| D.speedCueText／coachCueText（選配，非最小必需） | 現有observation粗腳程、coachLine；對照D actor及凍結recommendation | D | 有來源可審查投影，本scenario未擷取其實際回傳 | null；不利用entity缺失預設字冒充確認資訊 | 否 | 原公開owner文字、同時點、無raw rating／trust，無後來coachReaction |
| R.selectedObjectiveText | Legal-choice owner：凍結Decision choices中與initialRoute相符的objectiveText | R | 是，來源足夠；新欄位需契約 | cache可回查；缺原choice則null，不由outcome猜意圖 | 否 | route identity、selected/actual差異、保留原目標、不含心理意圖 |
| R.achievedResultText | Result／explainability owner：completedMoment.outcome、resultCode及runnerChanges | R | 既有outcomeText已可用；新欄位可避免重複 | 既有outcomeText；必要snapshot缺失DataError | 否 | 指定runner與PA一致；oneOut不直接等於打者out；不用final score |
| R.stateChangeSummary（outs／score／base文字差異） | Presentation owner比較凍結D state與同球completedMoment R state | R | 是，顯示差異即可，非再次settlement | 保留前後state；缺任一端則不算差值 | 否 | 本例1→2、1B→2B、主0客1不變；identity不符拒絕，零分與未知分開 |
| R.goalResultText／goalStatus（met／notMet／unknown） | 正式策略回饋owner，以selectedObjective與確認retirements／結果做有限規則比對 | R | 本例打者out的事實比對足夠；多路線／partial／reassess通用規則待設計 | unknown／null，並列目標與實際即可 | 不改競技模擬，但需新Presentation語意規則 | 不以outsCreated通用推定目標達成；route改變、部分成功、缺原目標須保守 |
| R.tradeoffText／remainingSituationText | 正式策略回饋owner；原選項目標＋runnerChanges＋R state，只描述本球獲得與留下的局勢 | R | 可做有限事實模板；尚無通用公開tradeoff owner輸出，需新規則 | 顯示runnerChanges與state，無推測句 | 否；預測失分率／反事實比較另案 | 「打者出局；原跑者推進二壘」；不宣稱故意放掉、不輸出未選outcomes |
| R.decisionFeedbackText | 正式守備explainability owner；審查後的judgment＋原選擇依據，詳第6節 | R | 候選，**需先修訂owner公開文案政策**，不能直接把raw quality翻字 | null，維持目標／事實回饋 | 否；若要求全面最佳策略評價則另案 | 決策評語不隨out自動翻轉，無「確定成功」；與feedbackText同源一致 |
| R.executionFeedbackText | 同一explainability owner，executionSummary／executionText＋實際stage證據，詳第6節 | R | 本例有原文；泛用欄位需stage證據門檻 | null或owner「紀錄不足」句；不以complete補動作 | 否 | 與action／cause／責任一致，oneOut仍需辨識誰出局、哪些環節完成 |

R內新增文字若與既有feedbackText互斥，未來owner應回unknown／null並保留可確認結果，不讓adapter自選看似合理的句子。既有v0.1原資料在本輪不改寫。由同一份同球結果產生後凍結，Replay只重顯示，不重新評分或呼叫owner結算。

## 9. Audit G：不超過三種UI資訊配置

以下是單一SS 6-3的文字設計，未施工SVG／HTML，未新增fixture。任何「立即」都指既有v0.1資料足以表達，並非Production adapter已存在或本輪已授權施工。

| 配置 | Decision | Resolution | 立即可用v0.1／等待v0.2 |
|---|---|---|---|
| 1. 文字優先的最小配置（建議） | 記分板＋原situationText；四個選項各顯示路線、目標與粗風險。原敘事一次呈現，避免重複觀察卡 | 首行打者出局；次行1→2出局、原一壘跑者→二壘、主0客1不變；回顧選擇目標；原outcomeText／feedbackText可展開 | 全部事實及原選項可用v0.1；獨立策略評語與tradeoffText等待v0.2，不能前端自由創作 |
| 2. 球場與一行觀察 | 球場顯示占壘／玩家守區，短句保留「往左、兩跑者移動、兩窗口很緊」；選項聚焦時的路線僅表示計畫，不預演成功。示意座標不當實際距離 | 判決後更新本球壘況；文字保留誰出局／誰推進，球場不能取代敘事 | v0.1可先用原文字、state與選項。SS左側近景／2B右側只是既有版面規則，不能推論有2B情境；結構化動態／壓力／pace需v0.2，未知時不畫 |
| 3. 選項目標為中心 | 球場退居次要；選項一行「6-3／優先打者／low」、一行「6-4／前位跑者／medium」、一行「6-4-3／嘗試雙殺／high」，保留持球；上方只有局勢和原觀察 | 並列「選擇目標」與「實際結果」，下方以原句顯示原因；可回看原Decision資訊，不能更新成事後提示 | 目標與實際事實並列可用v0.1；明確目標達成狀態、分離決策／執行回饋與公開策略取捨等待v0.2 |

三方案皆不預設球速動畫、不加成功率燈號、不把合法路線塗成正解／錯解。不以額外綠點補強一壘。可讀性、遮擋、小視窗與原生鍵盤體驗仍需人工體驗；本輪沒有Browser驗收。

## 10. 可立即執行／需新契約／需新模擬的區分

| 範圍 | 判定 |
|---|---|
| 既有v0.1可表達 | 原Decision敘事、局勢、四合法路線及目標／風險；同球selected／actual、打者out、跑者推進、比分不變、原outcome／feedback。足以先做文字設計與人工審查，無新模擬 |
| 需要正式投影／契約 | structured ball／runner／pressure cues、粗速度公開政策、speed／coach選配、R目標／差異／有限tradeoff、分離回饋、route-specific playback。先定owner與揭露規則，不直接改v0.1 |
| 需要Presentation設計機制，無須先改Simulation | 將原合法目標與實際結果做有限一致性判定；修正「確定出局」語氣；建立缺資料／矛盾的公開文字門檻 |
| 若要求才需新模擬／校準設計 | 精確秒數／距離／全員連續動作、可靠成功機率／expected value、未選路線反事實比較、獨立且全面的策略優劣評估。這些都不在本輪／最小下一Sprint的必要範圍 |

## 11. 風險、缺口與最小下一Sprint建議

主要缺口是公開資訊的整理與語意一致性，不是資料全空：pace名稱與實際內容不同；SS default availability.normal與真正的narrow窗口不是同一語意；advisable對DP的strong可與公開緊窗口並存；現有judgment／coach含保證或事後肯定語氣；executionSummary可能僅靠resultCode套泛句。公開策略推理不應比正式source更肯定。

**最小下一Sprint建議（等待人工審查，非啟動指令）：** 先做「SS Decision／Resolution公開文字契約收斂」。將現有situationText、readCue、原選項目標及結果差異列成可審核mapping；維持pace未知，或先批准owner粗速度文字政策。對本球先採配置1，並列原目標與確認結果，不加入最佳策略判定。

第二步才審查v0.2兩個回饋欄位：owner產生中性目標文字與有stage依據的執行文字；制定unknown／null及互斥處理、pin Decision依據、route改變／部分成功的規則。先以既有證據與靜態契約驗收來源、phase及無洩漏；新增測試／路線實執需另行授權。不要為證明介面有策略性而增加raw數值或強迫雙殺成功。

另三路線的Playback coverage獨立規劃。不得以本報告授權新情境、Production Adapter、UI-P3、Receiver v2或Sprint10B；資料／人工審查未完成前，不把文字提案視為Production-ready切片。

## 12. 最小驗證、完整性與停止紀錄

本輪只做：精確source區段／欄位存在性、owner與建立／公開順序、既有JSON mapping、同球identity關係、前後局勢／runnerChanges、禁洩漏欄位、未選路線證據邊界，以及Git／既有檔案完整性靜態比對。**31項來源／JSON靜態比對最終31/31通過**；evidence列出每項布林檢查與資格限制，它們不是Production測試suite的PASS數。

開工hash基線來自前輪完整清單、其新增artifacts與該evidence自身，共**1907個既有可讀檔案**；與Git檔名metadata盤點的1919個既有路徑完全對應：1907可讀＋12 protected。開工前輪manifest hash全符；本輪基線以實際工作樹記錄，沒有還原WIP。結案逐檔重新hash，全部1907個不變；原Production WIP、Prototype、正式契約、Save及測試證據原樣保留。新增僅本報告與指定evidence。

12個protected paths只做exact stat／Git status metadata核對（size、mtime、status），未讀取、hash、執行或改寫內容。metadata不變不是其內容hash證明。開工與結案清單、數值及比較結果在evidence.integrity。

branch、HEAD、main、origin/main tracking ref、Git index bytes／entries與原tracked WIP status相同；無staged changes，未fetch或查遠端server。Git inventory只列檔名，用於完整性覆蓋核對，未作repository全域source搜尋或unscoped diff。未Reset、Clean、Stash、Stage、Commit、Push。

工具限制如實記錄：首次讀skill受sandbox拒絕，之後以唯讀核准成功；Python不在PATH、PowerShell首次文字解碼不正確、一次將manifest物件誤當陣列的讀取腳本失敗，均改用Node／明確UTF-8。起初直接輸出大JSON造成工具輸出截斷，後改以精確JSON paths與source區段查證；不將截斷部分當完整證據。靜態查證首輪有3項中文字面值經stdin變問號、1項誤假定throw直接含physicalIdentity；修正為Unicode escape及正式selection→opportunity身份關係後，僅重查這4項，其餘27項保留。這是稽核工具假定修正，不是遊戲缺陷或修復。無遊戲程式因這些工具失敗而執行，無既有檔案被改寫。

未執行新比賽情境、simulation、gameplay replay、Production regression、Prototype tests或Browser tests；沒有測試數值被冒稱為本輪新PASS。沒有引入Phaser、正式升級DTO、修改Match Engine／Production Adapter／Prototype／Save，也沒有啟動UI-P3。

**停止：** 完成兩份稽核交付及最小靜態驗證後停止，等待人工審查。

Ready for Commit＝**NO**。Ready for Sprint10B＝**NO**。Receiver v2＝**DISABLED**。
