# 《棒球人生》Connected Match Gameplay Dependency Audit v0.1

2026-10-17（Asia/Taipei）｜Batting / Pitching / Capability / Evaluation Runtime Verification\
範圍：唯讀分析與指定兩份新文件。Evidence：同名 `-evidence.json`。

## 1. 架構結論與證據界線

**現有正式 Match 的完整因果鏈判定為 PARTIAL。建議首選方案 2：保留 Match State／Lifecycle／Settlement／Game Record 與 Career 成長 owner，分階段重新組裝 Gameplay Execution。** 這是架構審查建議，沒有開始施工。[C01–C23]

正式玩法已能沿用同一 Match、選出下一棒、執行玩家逐球打擊或 SS 接傳、合法結算、寫入紀錄及實戰成長。缺口集中在不同 producer 的模擬深度與能力來源不一致，以及部分新策略 foundation 尚未成為正式 outcome 輸入。不能將「逐球模組存在」推廣成「每個正式 PA 都逐球執行」，也不能將正常 SS 完賽見證推廣成自然投球到 SS 擊球的完整對抗。

主要發現：

- 一般 Compressed PA 使用打者 contact／power／discipline、當前投手 pitching／decision／control 計算結果；**繞過逐球策略、辨識與接觸執行**。[C02/C03]
- 玩家詳細 PA 執行 approach、Take／Contact Swing／Power Swing、既有 AI 投捕策略與控球；但球種／球速／變化主要由通用 identity profile 產生，未證實使用投手 repertoire／stuff／pitchStamina。[C04–C06/C09]
- SS ordinary defensive source 雖呼叫 OPA，正式預設仍提供一顆 hitterPitch，並固定 recognitionRoll=0、decisionRoll=0、contactRoll=0、foulRoll=1；這是受限 contact producer。[C10]
- 新 Observation → Sequence → Interpretation → Decision → Adapter 鏈，**NOT ON VERIFIED PATH** 作為正式 outcome 消費來源；既有 AI Tactical Integration 的 selector 確實運作，兩者必須分開。[C06/C07]
- Match Experience 會呼叫正式 development processor；角色再評估與後續 opportunity 也有接線，但「本場證據導致下一場實際上場不同」尚無本輪因果對照見證。[C17–C20]

[S] 目前工作樹 exact-source；[T] 本輪既有測試；[G] graph discovery，需來源核對；[D] 歷史基線；[I] 架構推論。C01–C23 的來源檔、目前行號、SHA-256、測試及限制在 Evidence `claims`。本報告所有 VERIFIED 均限定列出的路徑與條件；純單元測試不會單獨被提升為正式整合證據。

## 2. Preflight、保護範圍與 Graph

開工 HEAD／本機 origin/main 均為 `ab3117653945de0b7013636187c446276a96e634`，branch `main`；未 fetch，origin 只代表本機 tracking ref。13 個 tracked WIP、1,205 個 untracked；staged 空。兩個目標文件在寫入前不存在。Git index SHA-256 為 `6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d`。

重新比對前輪 readable manifest 的 **1,941 個檔案，差異 0**；本輪另納入前輪兩份交付，建立 **1,943 個既有 readable 檔案**的開工 hash manifest。沒有假定工作樹與昨日相同。12 個 protected paths 沿用前輪清單，僅 stat/status metadata，未讀內容、hash 或執行；完整清單在 Evidence preflight。

已閱讀 Readiness Audit／Evidence 與 UI-P2.4B 報告／Evidence。前輪 71/71 與 UI-P2.4B 162/162 屬歷史結果；本輪未重跑 UI、未作 Browser 驗收。前輪記載的使用者觀看接受，與原始 Browser PENDING 記錄分別保留。

使用已安裝 codebase-memory skill，Tier 2。index_status、search_graph、trace_path、get_code_snippet 與 exact-path coverage 均可用；generation 為 2026-10-15T01:30:19Z。多數相關路徑 freshness=`metadata_changed`；例如 graph 對 step 的舊行號與目前來源不同，且 trace 未完整解析物件方法呼叫。故 graph 僅定位，實質結論用目前來源與測試；**未 reindex，未宣稱完整 Call Graph、全域無 caller 或 index completeness**。所有引用的 code paths 已查 coverage，相關 caller scopes 亦查詢；回傳 no_recorded_issue 不等於完整。

## 3. 四種正式執行路徑

### P1：詳細逐球玩家打擊

`advanceHighSchoolMatchPlaybackStep`（script.js:13625–13672）\
→ 已上場且輪到 player 的 first/final/classified opportunity，或末局 agency 選 manual\
→ PA approach choice → `chooseHighSchoolYearOneMatchMoment`（3676）\
→ `prepareHighSchoolPlateDecision`（10711）\
→ `PlateDecisionFoundation.prepare`（plate-decision-foundation.js:39）\
→ OPA.prepareNextPitch → generatePitchOpportunity\
→ 既有 AI Tactical Integration → PitchSequencing.createPitchDecision → resolvePitchControl\
→ perceived pitch／三條玩家 route\
→ public handler → `resolveHighSchoolPlateDecisionPitch`（10747）\
→ PlateDecisionFoundation.resolve → OPA.resolveNextPitch\
→ count 或 BattedBallPhysical → BattedBallOutcomeMapping\
→ PA terminal 後 `resolveHighSchoolOffensiveDecision`（11005）\
→ applyHighSchoolSimulatedPlateAppearance → recordHighSchoolMeaningfulPlateAppearance → order advancement。

Owner：Match 保存 PA／pending pitch／situation；Foundation 回傳 execution facts；正式 Match settlement 才改壘況比分。逐球 lifecycle 的 settled/closed 只表示當球 count resolution 完成，不等於整個 PA 已寫入 ledger。未終止 PA 產生新 pitch identity；terminal PA 的 resultApplied 阻止重套。[C04/C05/C16；T06、T10前七項]

玩家打擊不保證每次都呈現：必須是 active player、正確攻方／打序、live game；受 first/final gate、classification、density、末局 agency 控制。末局 agency 的 simulate、未准入 meaningful 的 player PA 可走 P2。完整逐球僅指這些 detailed PA 的逐球 count，**並非整場比賽每 PA 都使用此路徑**。OPA 第15球 safety cap 會強制 BIP，來源有 safetyFallbackUsed，須單獨標示。

詳細玩家 BIP 在沒有 settled defense 時走 `compressedOfficialClassification`；一般安打的跑者進壘仍用 token 規則。因此 detailed pitch sequence 不能自動宣稱「已逐一模擬每個守備員與跑者」。

### P2：Compressed PA

step（13678）\
→ `resolveSimulatedHighSchoolPlateAppearance`（6993）\
→ 當前 lineup batter／active pitcher → capability adapters\
→ 一次 native simulation sample（或既有測試注入 sample）\
→ `AIPlateAppearanceOutcome.resolveCompressedPlateAppearanceOutcome`（ai-plate-appearance-outcome.js:33）\
→ `applyHighSchoolSimulatedPlateAppearance`（script.js:6907）\
→ third-out integrity／runner identity／legal score\
→ performanceEvidence、simulationLog、MatchGameRecord.recordEvent\
→ battingOrderIndex +1。[C01–C03/C16]

事件保存 `outcomeAuthority=compressedAIPlateAppearanceOutcomeV1`、`resolutionMode=compressedPlateAppearance`、compressedOutcomeTrace；沒有實際 pitchHistory／pitchCount。strikeout 是 plain-out candidate 的 identity-derived subclass，並非實際三個好球。不能補造投球軌跡、打者判讀、球種或配球理由。

### P3：玩家 SS 守備決策

step → responsibility gate → `prepareHighSchoolDefensiveMomentFromSimulation`（13256）\
→ OffensiveTacticalOpportunity／Decision／Action（standardAttack 或另有 bunt）\
→ ordinary standardAttack：`ensureHighSchoolOrdinaryGroundBallInPlayHandoff`（5160）\
→ 受限 OPA contact → physical responsibility／reach／runner realization\
→ legal routes／density → create/admit/present Ground Situation\
→ public choice → `resolveHighSchoolYearOneMatch`（13760）\
→ `resolveHighSchoolDefensivePlay` → infield resolver → `buildHighSchoolShortstopExecution`（11938）\
→ canonical secure、route intent、throw、receiver、runnerTiming、force movement\
→ `applyInfieldResolutionToHighSchoolMatch`（12280）\
→ canonical settlement／third-out、PA、Game Record、closed lifecycle、resume。[C10–C12/C16]

T02 的 controlled fixtures 證實一壘／封殺／完整與部分雙殺／失誤／第三出局／duplicate／reload／隊友責任；固定 seed77001 的既有 career fixture 正常流程見證 meaningful=1、routine=3、Match/Record integrity 空。此「正常流程」指 fixture 建立後未再注入球／能力／結果，**仍使用正式 producer 內建的受限 contact 預設**。

### P4：Routine Defense

同一 defensive source → classification=playerRoutinePlay 或 meaningful density suppression\
→ `resolveRoutineDefensivePlay`（10410）自動選合法 route\
→ 同一 infield execution foundation\
→ `applyRoutineDefensiveResolutionToHighSchoolMatch`（12446）\
→ official PA／playerRoutinePlay event、order、lifecycle close。[C10–C12/C16/C17；T02]

Routine 是自動責任處理，仍有接傳能力、timing、結果與學習證據；沒有玩家策略選擇，不得把自動 route 寫成玩家主動判斷。Compressed ordinary PA 也不能僅因 ordinaryPlay 標籤就算做這種 Routine Defense。line-drive／fly-ball catch、bunt、unsupported physical fallback 是另外的 subpath，本輪不宣稱全面驗證。

## 4. Audit A：打擊的四層因果

| 層次 | P1 詳細 PA | P2 Compressed PA | P3/P4 守備 contact 來源 |
|---|---|---|---|
| 打擊策略 | approach→selectionProfile/swingIntent；玩家 Take/Contact/Power；兩好球 protect | 無逐球策略；discipline 是 scalar 能力，不能當成已執行選球 | provisional OffensiveTacticalDecision 可選 standardAttack/bunt；ordinary 固定 balancedAttack |
| 執行品質 | perception、timingWindow/batToBallWindow、contact/foul、decisionQuality/executionQuality | 直接公式取終局 token；未獨立解析 timing、whiff/contact quality | first-pitch contact 的多個 rolls 由正式預設固定；守備後段另有真實能力計算 |
| 擊球品質 | batting/power、attackability、recognition、intent、physical rolls→contact/type/pace/direction/depth | 沒有 canonical BattedBallPhysical；quality 是 matchup aggregate | BattedBallPhysical 確實運作，但上游不是完整投打對抗 |
| 正式結果 | physical mapper 或 count terminal→Match owner→ledger | compressed token→相同 coarse base/third-out owner→ledger | physical handoff→SS/routine execution→canonical defense settlement→ledger |

來源：[C02–C05/C10–C12]。OPA `damageCeiling` 是 execution profile 輸出，不能僅看欄位就宣稱它另外乘進 physical outcome；實際公式依列出的 consumers。SEAGER／HPT／ST 設計名詞不作任何 runtime integration 證據。

Pitch Observation／Sequence 並非 P1 的必要執行環節：原有 pitchHistory／Tactical feedback 已供既有 selector 使用；新 projection chain 的存在與能從真實 history 重建，是另一件事。

## 5. Audit B：投捕策略與投手狀態

| 系統 | 實際 caller → callee | 目前使用程度／限制 |
|---|---|---|
| Pitch Sequencing | OPA.generatePitchOpportunity → Tactical.createTacticalPitchDecision → PitchSequencing.createPitchDecision → resolvePitchControl | P1 正式詳細路徑；P2 與 audited ordinary defensive first contact 繞過。[C03/C06/C10] |
| 投捕 Tactical Integration | OPA → buildTacticalContext → chooseTacticalIntent → buildCatcherRecommendation → createAutomaticPitcherResponse → accepted intended class | AI recommendation/acceptance；尚非玩家捕手或投手手動叫球。[C06/C15] |
| repeatSuccess/changeLook | OPA.recordPitchTacticalFeedback → bounded history → 下一球 context → selector | 真實 chase/whiff/command/hard-contact feedback 可改 intent；具 eligibility 並可撤銷；T05 controlled integration、T06正式 feedback continuity。沒有證實某次自然 repeat 必然改變最後安打率。[C06] |
| 新 Observation/Sequence/Interpretation/Decision | T10 的 test-only resolveHighSchoolPlateDecisionPitch wrapper → observePitch → append/build → interpret → decide | 可以解析真實詳細 pitch history；ON/OFF 完整 Match/Record/RNG 等價。正式 consumer **NOT ON VERIFIED PATH**；非已接上新策略 outcome。[C07] |
| 新 Production Adapter | adapt(decision,boundary) → candidateIntent/abstain | candidate-only；graph inbound 所見為 tests；目前 audited producer 無消費此候選。不能因名稱有 Production 就當成正式叫球。[C07] |
| 控球與心理 | roster control×2 clamp1..20 → cached pitcherRuntime；PA result stimulus → Mental transition → Process → 下一 detailed PA/球 | 控球、rhythm、precisionIntent、tempo 真進 realization；初始化採 simplifyReset 與預設心理值，並非全部從 NPC 個性推導。[C06/C09] |
| 球種品質／球速／變化 | OPA.getPitchPhysicalProfile → type roll、89/82/80/76 mph baseline＋identity variation | 有 actual pitch facts，可影響 recognition 與 timing；不是已證實 roster stuff/repertoire 影響球種品質。[C09] |
| 打者預判 | ensureBatterAnticipation → observable/public context → subject distribution/readiness → PA snapshot/畫面 | 會產生資訊與評價 pressure provenance；未找到 readiness 進入 recognition/contact/physical 的數值 consumer。人類因此改選擇的效果未測。[C08] |
| 體力與疲勞 | health→competition evaluation／部分 opportunity；投球算式沒有該輸入 | per-pitch pitchStamina/fatigue depletion **NOT ON VERIFIED PATH**。[C14] |

投手本人：PlayingTimeGameExposure.resolveLegalPosition 明記 pitcherExposureDeferred=true，resolveStartingOpportunity 強制 noAppearance，entry guard 亦檢查。legacy 投手 defensive context 是短打撿球傳壘，不能冒充玩家投球操作。捕手有 block/control、看跑者／傳壘與 return-to-pitcher 路線，`resolveHighSchoolCatcherDecision` 使用 blocking/gameCalling/throwing 等衍生能力，但不構成 human pitch-calling。這些守位本輪僅源碼查證。[C15]

額外來源風險：detailed `ensureHighSchoolPitcherRuntimeState` 用現有 runtime 覆蓋新 fallback；尚未證實換投會按新 active pitcher 重建 control/runtimeId。PA context 沒有總是填入實際 pitcherId，pitch truth 可落回 `opponent-pitcher`。新 provenance 不能擅自把它補成已驗證的同一 actor。[C09]

## 6. Audit C：能力進入哪裡

以下「後續」分別指同 Match 後續事件、下一 Match；不以欄位存在替代算式。

| 能力／模型 | 欄位、傳入與真正計算 | 能力變化影響後續的證據 |
|---|---|---|
| 打者（P2） | NPC contact/power/speed→discipline=round((contact+speed)/2)；player 從 batting/ballSense/observe/fitness/instinct/IQ 衍生。AI quality=.025contact+.012power+.008discipline，投手 pressure=((pitchingQuality||5)×2+decision)×.004；加跑者/落後情境、扣兩出局；control 只改 walk lower boundary±.03；K probability=clamp(.18+.018(pitchingQuality-contact),.04,.45) | T03 對照公式、control/discipline/K 邊界；正式 P2 caller 已確認。未新建 production sensitivity fixture。[C02] |
| 打者（P1） | observe/IQ/ballSense→recognition；batting/ballSense→contact；明確 route 使用 reaction（未傳時退回 ballSense）、batting、power→timing/bat windows；batting/power 進 physical quality/type/pace/depth | T06 實際 take/contact/power execution；同種 seed/只改能力的 end-to-end production 對照未新跑。[C04/C05] |
| 投手 | P2 active actor pitching、衍生decision、pitchingProfile.control；P1 control→realizationStability=.12+.72control/20+.18rhythm/100−.28targetDifficulty−.12abs(tempo-rhythm)/100 | T03/T04 pure resolver 能力影響；T06詳細執行。stuff／pitchStamina／疲勞不在已驗證投球算式。[C02/C09/C14] |
| SS | canonical player catching/reaction/range/throwing/armStrength、fitness/observe→防守 adapter；reach 用 reaction、.75range+.25mobility；secure=.75fielding+.25catching−demand＋variation；throw strength/accuracy 分讀 arm/throwing | T02 weak fielding/throw/pivot/receiver 對照造成不同 execution/out；同一 physical identity 不容重抽。[C11] |
| 跑者 | player baseRunning→speed=round((2baseRunning+fitness)/3)；runner speed/start/progress→relativeArrival=10−.45speed+start−progress；relay 亦扣 batterSpeed | T02 fast runner/weak throw、force movement；compressed/玩家一般打擊 base awards 只用 result token、壘況和third-out，不逐跑者計速度。[C12] |
| 球隊／名單 | TeamRosterFoundation 生成/合法assignment、active defender、lineup order、bench entry 影響實際 actor；TeamStrengthModel 計算團隊摘要並保存 | PA 直接讀 actor，未見 team overallSummary/startingPitchingQuality 再乘入此 PA。不能雙重加成或宣稱 summary 已影響 execution。[C13] |
| 疲勞／當前狀態 | fitness 進部分能力，心理 Process 進P1控球；body fatigue/pain/injuryRisk 進競爭評價及 includeDynamicReadiness 時 opportunity | 沒有證實每球體力耗損→下球能力下降；generic condition/stamina 欄位不算接線。[C14] |
| 成長後能力 | player.applyDevelopmentResult 改 baseballSkills／skillProgress；後續 getOffensiveSimulationCapability/player defensive adapter 讀 live player；新 roster 可重投影 | 源碼鏈存在；尚未新驗證「正式學習剛跨threshold→下一場PA/出場不同」；NPC roster 是快照，不會因 player 成長自動更新。[C13/C18/C19] |

Canonical roster 的另一個缺口：createHighSchoolRosterPlayerActor 只給 simulationCapability.offense/defense；TeamRosterFoundation.createPlayerActor 的 top-level pitching/control/stuff 沒收到對應值時預設1。player batting lookup 有 live-player 替換，投手 profile 並無因此自動修復。因正式 pitcher exposure deferred，本輪不把這段當已發生的玩家投球事故；它是啟用投手前必查的 adapter 斷點。[C13/C15]

## 7. Audit D：統計、學習、解讀、成長與機會

| 層次 | 正式 caller／owner | 已接線與不能推論之處 |
|---|---|---|
| 1 Game Record | recordHighSchoolMatchSimulationEvent → MatchGameRecord.recordEvent → recordPlateAppearance/defense/runner/pitcher | PA/AB/H/BB/SO、BF、出局與責任；eventId 去重、final lock。統計不是策略執行紀錄。[C16] |
| 2 表現證據 | Match settlement → MatchExperienceDevelopment.deriveMatchExperienceEvidence | exposure+routine logs+completed moments；分 decision/execution/outcome；不從安打結果捏造好判斷。[C17] |
| 3 教練／球探解讀 | defense coachFeedback、PA coachFeedback；settlement overallTier→coachReaction/scoutEvaluation；CompetitionEvidence／CareerEvaluation 分層 | 教練文字不等於 coachTrust 增量；scoutEvaluation 是混合外部認知，非正式能力。T07只驗證 trust boundary；未證實它由本場 execution 自動更新。[C20] |
| 4 正式能力成長 | settleHighSchoolYearOneMatch → settleMatchExperienceDevelopment → aggregate/select最多3contexts → player.applyDevelopmentResult | skillProgress 真結算，跨threshold才升 baseballSkills，settlement IDs去重。T09驗證正式完賽→成長畫面與reload duplicate；不保證每球/每技能都成長。[C18] |
| 5 未來機會／角色 | settlement → collectCompetitionEvidence → updateCompetitionEvaluation → reassessRole/applyRoleResult → readiness/roster刷新→後續opportunity | source接線及T08門檻對照；promotion需多樣本／相對gap。Y1首場後可建followup，其他年份/賽程序列另有owner。尚無本輪跨場因果見證。[C19] |

五個指定 family 的來源：

| family | 真正來源 | 目標與限制 |
|---|---|---|
| defensiveInningsExposure | finalized defensive innings | exposure→baseballIQ；無chance不造active execution |
| plateAppearanceExposure | player實際PA數 | exposure→batting/IQ；含compressed player PA但不能造逐球判斷 |
| shortstopRoutine | simulationLog.playerRoutinePlay | reaction/catching/throwing/range等stage；不給假玩家decision |
| shortstopMeaningful | completedMoments.domain=defense且SS | 同一play的decision／execution／outcome與責任分開 |
| meaningfulPlateAppearance | completedMoments.domain=offense | batting execution、IQ decision，保留result、approach；依既有summary映射 |

T02固定既有正常流程見證同時包含全部五個 family。[C17] Growth 只選最多3技能，family出現不等於該family必定形成level-up。

Position Evaluation 的 getPositionAssessment 使用 positionConfigs/baseballSkills/ratings，並經 readiness provider 進機會評估；不等於每個守備result都直接改positionExperience。CompetitionEvidence 的 fullGameProduction 與 decision layers 分開；CareerEvaluation 明示 scout visibility 為 mixed-external-perception-not-performance，投手 formalPitchingEvidence=0/pitchingEvidenceUnavailable。[C19/C20]

## 8. Runtime Matrix

矩陣值只使用指定詞彙；證據與條件在下表，避免把條件混入格值。玩家守備／Routine 欄限定本輪 SS ordinary-ground slice，不代表所有守位或bunt/airborne分支。

| 系統 | 完整逐球 | Compressed PA | 玩家守備 | Routine Defense |
|---|---|---|---|---|
| 打擊策略 | VERIFIED EXECUTED | VERIFIED BYPASSED | CONDITIONAL | CONDITIONAL |
| 配球策略 | VERIFIED EXECUTED | VERIFIED BYPASSED | VERIFIED BYPASSED | VERIFIED BYPASSED |
| 球員能力 | CONDITIONAL | VERIFIED EXECUTED | VERIFIED EXECUTED | VERIFIED EXECUTED |
| 執行品質 | VERIFIED EXECUTED | VERIFIED BYPASSED | VERIFIED EXECUTED | VERIFIED EXECUTED |
| Game Record | VERIFIED EXECUTED | VERIFIED EXECUTED | VERIFIED EXECUTED | VERIFIED EXECUTED |
| 評價證據 | VERIFIED EXECUTED | CONDITIONAL | VERIFIED EXECUTED | VERIFIED EXECUTED |
| 能力成長 | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL |

| 系統 | 各格支持與精確含義（左至右） |
|---|---|
| 打擊策略 | P1:C04/C05,T06/T10；P2:C02/C03,T03/T10；P3/P4:C10,T02，provisional策略存在、ordinary attack固定 |
| 配球策略 | P1:C06/C09,T05/T06，既有AI selector；P2:C03,T10；P3/P4:C10,T02，受限contact first pitch override繞過 |
| 球員能力 | P1:C05/C09,T04/T06，打者/command已算、stuff/stamina未接；P2:C02,T03/T10；P3/P4:C11/C12,T02 |
| 執行品質 | P1:C05,T06；P2:C02/C03,T03，無獨立接觸/控球execution；P3/P4:C11,T02 |
| Game Record | P1/P2:C16,T10前七項完整Match/Record對照；P3/P4:C16,T02 |
| 評價證據 | P1/P3/P4:C17,T02；P2:C17,T02，player僅exposure、NPC無同等player active learning |
| 能力成長 | 全欄C18,T09；P2另C17。正式match-end執行已證實，但participation、聚合排序、最多3contexts、threshold決定是否有該路徑的實際gain |

T10整組並未通過；上列只引用其已完成的1–7項。矩陣沒有將第8項guard失敗或9–12項未執行隱藏成PASS。

## 9. 系統完整性：Match vNext 因果鏈

| 節點／連結 | 判定 | 證據與缺口 |
|---|---|---|
| Match Context → current actor/state | VERIFIED | 同Match、roster、order、before/after、half transition；C01/C13/T02/T10 |
| Player Capability →計算 | PARTIAL | 打者／SS／runner／部分投手control真算；stuff/stamina、player pitcher與snapshot橋未完整；C02/C09/C11–C15 |
| Tactical Decision → Execution | PARTIAL | P1既有投捕AI＋玩家打擊及SS route有效；P2/ordinary contact繞過若干策略；C03–C07/C10 |
| 新 Observation/Interpretation/Decision →正式selector | DISCONNECTED | test projection/候選可重建，正式outcome input NOT ON VERIFIED PATH；C07/T10已完成部分 |
| Baseball Execution → Play Settlement | PARTIAL | SS物理/能力到timing已證實；full batting BIP仍可壓縮分類、token running；C05/C10–C12 |
| Play Settlement → Game Record | VERIFIED | canonical guards、PA、eventId、active pitcher；限定本輪路徑；C11/C16/T02/T06/T10 |
| Game Record／實際事件 → Evaluation Evidence | PARTIAL | five families、fullGameProduction條件接線；非所有NPC/守位完整學習；C17/C20 |
| Evidence →正式Development | VERIFIED | match-end context→applyDevelopmentResult；永久skill增加有threshold條件；C18/T09 |
| Evaluation/Capability → Career Consequence | PARTIAL |角色/next-opportunity/成長讀取source存在；T08只是門檻單元，跨場實際影響NOT VERIFIED；C19/C20 |
| 各producer共用、可公開的execution provenance契約 | MISSING | 此為整合所需的統一契約：現有欄位分散、generic F1/F2仍缺。契約缺口的架構推論，並非聲稱所有基礎資料不存在；C21與前輪Readiness F1/F2 |

結論不是完全無效或已完整：bounded完整比賽與學習已執行；通用、每條路徑都一致的投打因果及career feedback尚未完成。

## 10. 核心重用判定

| 系統 | 判定 | 既有owner／實際狀態 | 理由與改動風險 |
|---|---|---|---|
| 打擊 | ADAPT | OPA、PlateDecision、BattedBallPhysical/OutcomeMapping；P1有效、P2獨立 | 保留approach/count/physical；整理producer邊界及ordinary forced contact。風險：把legacy壓縮結果誤認成詳細execution；C02–C05/C10 |
| 配球 | ADAPT | PitchSequencing、Mental/Process、既有TacticalIntegration | 保留intent/control/feedback；決定新Decision projection是否正式消費、補active pitcher/repertoire來源。風險：雙selector/不同identity；C06–C09 |
| 守備 | REUSE | ReachSecure、DecisionThrow、RunnerThrowSettlement、infield owners | SS已驗證接傳與責任；先保留成熟slice。風險：上游producer換了，responsibility/admission與時間尺度也改；C10/C11 |
| 跑壘 | ADAPT | ForceAdvancement、GroundDefense runner realization、timing/third-out | 詳細force/身份可重用，token進壘仍粗；風險：重複推進、第三出局與timing判定不一致；C12 |
| 能力 | ADAPT | canonical player/baseballSkills、roster projections、capability adapters | 大量真計算存在，需明訂units/defaults、live/snapshot、pitcher欄位。風險：預設值假裝真能力、團隊summary二次加成；C02/C11–C15 |
| 評價／成長 | ADAPT | MatchExperience、applyDevelopmentResult、CompetitionReassessment/Evidence | 保留decision/execution/outcome與dedup；補能力/role後續見證、各mode學習邊界。風險：把統計、文字、信任、scout和永久成長混合；C17–C20 |
| Game Record | REUSE | MatchGameRecord＋recordHighSchoolMatchSimulationEvent | 已有正式統計與eventId/final lock。風險：event寫入後再補metadata，public mapping要依commit boundary；C16 |
| Match State | REUSE | player.highSchoolMatch、step scheduler、lifecycle、settlement/half/order owners | 已有完整完賽、reload與continuation證據。風險：新execution另建cursor或另算outs；C01/C11/C21 |

無證據支持整套REPLACE。玩家投手正式操作、完整捕手叫球、全球場精細running與體力模型等擴張先DEFER，直到第一個有因果驗收的slice成立。

## 11. 三種重建策略比較

以下成本為相對架構評估，不是工時估算。[I:C23]

| 比較面向 | 1 保持現有Match逐項補線 | 2 保留State/Settlement，組裝Execution（首選） | 3 全新Match Engine |
|---|---|---|---|
| 既有程式／測試 | 初期改動較少；容易累積分支例外與source-freeze衝突 | 保留owner和測試，另明訂producer contract，逐個vertical migration；中度改動 | 大量測試/fixture/契約須重寫或建立雙引擎對照；最大改動 |
| 保留打擊配球守備評價成果 | 可保留，但容易維持彼此不同的隱含假設 | 各foundation作execution組件，保留SS/record/development、明確標示compression | 可搬純foundation；正式owner整合價值容易流失 |
| 狀態一致性 | owner數維持；局部接線仍可能雙算與stale handoff | 單一state/settlement，execution只提交facts；需新舊模式身份互斥 | 新舊state/settlement並存與Save遷移風險最高 |
| 未來整合成本 | 每項持續擴大script分支與route特例 | 先付來源/模式/identity契約成本，後續新增組件較可控 | 可重新設計，但所有既有Career/UI/Save邊界需重建 |
| UI／Career／Save | 小改表面，但資料模式差異仍外溢 | downstream owner保留；公開mapping必須忠實反映execution mode，Save仍需正式版本審查 | 通常需要新adapter、migration、所有continuation/evaluation再驗證 |
| 施工／驗證成本 | 單點低、累積回歸成本不透明 | 中；先1PA→nextPA閉環，再擴大，具既有oracle | 高；先重證全部continuity/scoring/growth，未見必要性證據 |

首選2的依據是 C01/C11/C16/C18 已有可保留的正式owner與runtime見證，而 C03/C07/C09/C10 的斷點跨多個producer；只把線補到現有branch可能維持雙重策略來源。方案2應用方案1的**小步遷移方式**交付，先不替換state、不另建第二個game authority。若審查認定僅個別功能需要恢復，方案1可作較小範圍選擇；目前沒有足夠理由支付方案3的重證成本。

## 12. 不依賴精緻UI的最小正式PA驗收

這是後續提案，**本輪沒有建立fixture、test或runner**。

| 驗收 | 現有證據 | 目前缺口／後續接受條件 |
|---|---|---|
| 打者與投手能力真影響 | P2公式/T03，P1打者/command、SS已真算 | 以同一正式admitted context、相同合法外生draw分別改一項能力；記錄輸入→中間量→結果，不能只要求每個case翻轉safe/out；不得用預設profile冒充真投手 |
| 投捕策略可觀察差異 | T05 intent/call/control；T06 feedback；P1既有selector | 正式PA boundary中對照challenge/expand/changeLook，證明intended/actual/response差異；新Decision鏈若啟用，證明只有一個selector消費 |
| 玩家打擊決策可觀察差異 | T06受控take/contact/power、count/contact/strikeout | 相同pending pitch/perception下比較合法routes，驗證window/intent/count/physical差異，不保證某route勝率較高 |
| 擊球→守備→跑壘→合法結算 | SS/Routine source→timing→force/third-out已驗證 | **主要斷鏈**：玩家詳細PA的真實contact尚未被本輪證明能直接交給相同詳細守備/runner owner；不得用第二次forced contact取代該球 |
| 正式Game Record | T02/T10前七項完賽integrity | 精確一PA、一份batter/pitcher/defense/runner記錄；settlement identity一致 |
| 評價證據來自實際執行 | five families/T02、match-end growth/T09 | 每份evidence回指該球decision/execution；routine無人工decision；不根據結果補寫execution |
| 下一PA沿用state | 現有step/order/before與full-match見證 | 同一Match，after=next-before，order只增一次；第三出局走既有half owner；不為下一decision保證再產SS |
| 發展與未來機會 | match-end processor已執行；角色門檻單元有效 | 保留match-end結算；duplicate/reload/replay不重領；跨threshold後下一Match讀新能力、必要多樣本才可改role。該因果見證尚未完成 |

第一個slice範圍建議：**同一已正式准入Match中，一個玩家詳細打席＋同一physical identity的SS範圍ground defense（自動守備）＋runner/third-out結算＋下一棒PA before確認**。玩家只擁有當下batter決策，不同時控制對方SS；SS receiver/runner仍用現有active roster。用預先聲明的合法受控測試輸入覆蓋ground/third-out，與固定正常流程見證分開，不搜尋seed來追求指定安打。需要場內meaningful SS玩家互動時，放在後續防守半局單獨驗證，避免同一人同時成為兩隊的decision owner。

片段本身不提前發成長：延續同一既有bounded game至正式match end，檢查該PA evidence→Development，然後read-only檢視後續readiness。若無法讓detailed batting contact使用該守備handoff，先標記缺口，不能用歷史SS63或另一顆接觸冒充已接通。

## 13. F1／F2必須保留的Provenance

以下是**映射需求，不是已實作DTO/schema**。[C21]

| 需求 | 目前可用來源／必要限制 |
|---|---|
| full pitch sequence | 只映射實際pitchHistory／count／pitch identity；標示15球safety fallback；不從GameRecord eventRefs重建 |
| compressed plate appearance | 原authority/resolutionMode/trace；明示no detailed pitch evidence，BB/SO不補造球數 |
| player-owned decision | situationId、actor/role、legal route、selected route、admission及decision owner；自動routine與AI catcher acceptance分開 |
| automatic/routine resolution | routine classification、executionRoute與actual source；普通compressed PA不偽裝成SS routine |
| genuine capability inputs | capability來源、adapter/units、實際consumed scalar/ref、預設/override標記；未保存的輸入只能標not recorded，不得從最後roster回填歷史真值 |
| actual execution evidence | intent／actual、controlRealization、recognition、contact physical identity、reach/secure/throw/timing、責任與unsupported/fallback標記；未執行的策略不宣稱 |
| formal settlement identity | PA／physical／situation／runnerSettlement／eventId、before/after、ordered retirements、third-out、official outcome authority；不得建立另一outs/score owner |
| evaluation provenance | evidenceId/playId/sourceSnapshot/family/component、attribution、development context/settlement IDs、progress vs level-up、competition evaluation identity；未public不提前暴露 |
| public visibility state | presentedEventCursor prefix、已公開presentationSnapshot、pending lifecycle/outcome；debug hidden intent、true distribution、RNG/ability raw資料不自動公開 |

現有個別PA event會在recordEvent後再補approach/execution metadata，GameRecord本身只存縮減eventRefs；F1必須定位完整的正式來源及其可見時刻，不能把recordRef當完整execution envelope。若歷史pitch使用`opponent-pitcher`或能力input未保存，保留unknown/default provenance，而不是虛構精確身份。

F2 應延用既有cursor／lifecycle／pending outcome authority。等待動畫只延遲presentation acknowledgement，不重新執行PA、抽樣、settlement、evidence aggregation或growth；Replay只讀已提交且已允許公開的資料。舊callback、double confirm、reload、skip、跨play和match-end都必須用同一execution/settlement身份拒絕重進。**新public confirmation receipt和exactly-once continuation尚未建立**；本輪沒有新增controller或clock。

## 14. 本輪測試、失敗與限制

| ID | 原封不動既有測試 | 結果 |
|---|---|---|
| T01 | match-situation-lifecycle-test.js | 23/23，exit0 |
| T02 | ss-defensive-production-integration-test.js | 26/26，exit0 |
| T03 | ai-plate-appearance-outcome-test.js | 17/17，exit0 |
| T04 | pitch-sequencing-core-sprint-a-test.js | 26/26，exit0 |
| T05 | pitcher-catcher-tactical-integration-test.js | 34/34，exit0 |
| T06 | plate-decision-production-integration-test.js | 15/15，exit0 |
| T07 | coach-evaluation-boundary-test.js | 73 validations，exit0 |
| T08 | high-school-competition-reassessment-test.js | 17/17，exit0 |
| T09 | match-development-settlement-presentation-v1-test.js | 35/35，exit0 |
| T10 | pitch-tactical-decision-production-integration-test.js | 1–7通過；8失敗；9–12未達，exit1 |

合計10命令，9 exit0、1 exit1；完整九組266 checks，加中止套件7項已完成，**273 recorded passes、1 observed failure**。這是不同既有custom counters的加總，不是完整273/274 suite或Node TAP數，也不代表全庫green。

T10失敗：`protected source changed: script.js#settleHighSchoolYearOneMatch`，比較基準 `ac53bf61964bde4b40501c77e15269bae99b55cc`。歷史function96行，目前89行；差異是目前已移除終場覆寫finalMoment scores/runners/outs/half的block。開工script SHA與前輪1,941-file manifest完全吻合，故本輪前已存在這個不相容。**不放寬guard、不改test或正式source、不把失敗改列PASS**。本輪僅定位此freeze不相容，未裁定歷史修正與guard的正式授權關係。[C22]

執行前審查測試loader、require、loops與寫入／process呼叫。VM DOM、timers、localStorage為記憶體；T10使用既有固定seed440000的5次ON/OFF/reload/policy執行，包含一般生涯建立路徑，不是新增seed搜尋。T02沿用5次既有bounded完賽，T09沿用1次direct-start完賽，T06沿用controlled單球/PA fixtures。未改任何測試、seed、fixture或runtime檔案。純foundation的固定scalar/roll列舉保留原樣，未作新增Monte Carlo。

未執行AI outcome production integration（內含逐result identity/sample搜尋與額外比賽）、Match Experience foundation的1000 player-match distribution、Batter Anticipation分布/候選搜尋、adapter多seed擴展、UI-P2.4B/full-repo regression。T10第8項失敗後不繞過該項重跑9–12。沒有新模擬runner、測試、Browser UX或實際Save寫入。所有T結果及stdout/stderr時間戳保存於Evidence。

尚未驗證：換投後runtime identity/control刷新、pitcher specialist→真實pitch實作、human catcher/pitcher路由、fatigue/stamina逐球回饋、全守位空中球/bunt範圍、新Decision正式消費、anticipated readiness數值效果、詳細打擊到同球詳細守跑接線、跨場能力/role因果，以及新Connected consumer。不能用本輪少量測試推算聯盟機率或平衡。

交付檢查：1,943 個既有 readable 檔案 hash 差異0，protected 路徑的已記錄 existence/size metadata 未變，HEAD／branch／index不變，staged空；status僅新增本輪兩份文件。JSON解析、99筆來源hash/行號、28個引用code paths的coverage、Runtime Matrix詞彙與report hash均已核對。protected內容未讀取，因此不宣稱其內容hash相等。

## 15. 施工前決策與停止

1. **建議架構**：方案2，既有Match作單一state/settlement authority；Gameplay Execution以明確producer模式與身份組裝，按方案1的小步方式遷移。
2. **不可缺少核心**：合法context/active actors、真能力adapter、單一tactical selector、player pitch decision、physical contact、責任/接傳、runner/force/third-out、唯一settlement、PA/Game Record、分層evaluation、去重development、nextPA/half owner。
3. **可重用**：Match/lifecycle/order/half/record；OPA/PlateDecision與BattedBallPhysical；PitchSequencing/Mental/Process/既有TacticalIntegration；SS ReachSecure/Throw/Timing/Force；MatchExperience與applyDevelopmentResult、CompetitionReassessment。
4. **先修斷鏈**：先釐清freeze guard與歷史snapshot修正的契約；確認canonical pitcher capability/identity與模式邊界；移除「詳細打擊產生一球，守備另生成一球」的接線需求障礙；決定新projection chain的正式消費範圍。上述均待審查後另行授權。
5. **第一Vertical Slice**：第12節的1個正式玩家詳細PA→同physical SS自動守備/跑壘/settlement/record→nextPA；match end才檢查evidence/development，使用簡單trace或文字即可。
6. **後續最小順序**：契約/guard審查→單球真能力/策略因果對照→同球守跑handoff→唯一settlement/record/nextPA→match-end evaluation/growth及後續readiness→再審F1/F2最小public mapping/handoff。不要先用UI串接掩蓋execution缺口。
7. **延後**：Connected Match、UI-P3、Match Director、Sprint10B、Receiver v2、全新引擎與全守位精細化；UI-P2.4B維持原樣。

最大三項架構風險與驗證：

| 風險 | 後續驗證方法 |
|---|---|
| 假能力／策略參與：profile預設、projection影子計算、受限contact被標成自然對抗 | 相同admitted source/draw的能力與策略對照；trace列actual consumed inputs/defaults，核對真caller；新selector ON/OFF應在有意接線後呈現可解釋差異 |
| 多owner／雙結算／時間來源分裂：新producer、動畫、Replay、reload、換投共享stale identity | 同play identity核對after=next-before、單次order/event/evidence/growth；duplicate/old callback/reload/third-out與換投測試；presentation不得抽樣 |
| 評價與Career失真／freeze契約衝突：把統計當決策、把文字當角色、舊guard阻止合法snapshot修正 | 先正式審查guard失敗；五層provenance逐層對照，跨threshold再到下一Match；多樣本role門檻與下一實際上場做bounded見證 |

Ready for Commit＝**NO**。F1／F2 Implementation＝**NOT AUTHORIZED**。Connected Match Implementation＝**NOT AUTHORIZED**。Sprint10B＝**NO**。Receiver v2＝**DISABLED**。UI-P3／Match Director＝**NOT STARTED**。僅交付原指定兩份Audit文件；完成後停止，等待架構審查。

