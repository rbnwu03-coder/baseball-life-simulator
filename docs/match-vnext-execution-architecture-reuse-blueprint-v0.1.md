# 《棒球人生》Match vNext Execution Architecture & Reuse Blueprint v0.1

## 1. Executive Architecture Decision

**採用已核准方向 2：保留 `player.highSchoolMatch`、Lifecycle、Canonical Settlement、Game Record 及 Career owners，漸進組裝 Gameplay Execution。第一優先是玩家詳細打席產生的同一球，交由對方實際 SS／1B 與跑者 resolver 執行，再回到原玩家 PA owner 提交。** 不建立第二份比分、壘況、打序、紀錄或成長 authority。[S:B01–B10；I:A01]

Same-Ball Handoff 有可施工的最小設計，但**不建議現在無條件批准 Sprint 1**。先完成 source-freeze 契約裁定，並在施工授權中明列 callback／pending-BIP、NPC actor binding、PA 唯一提交及 Save 相容性驗收範圍。這些是下一輪 gate；本輪沒有施工，也沒有把設計當成已驗證實作。[I:A02–A08]

證據標記：**[S]** 目前精確來源；**[T]** 既有測試與已保存執行；**[G]** Graph discovery；**[D]** 文件；**[I]** 待施工驗證的設計。B01–B16 是本輪來源索引，A01–A12 是設計決策，完整 caller／callee、SHA256、限制見配套 Evidence。API 前綴 `Proposed.`、本文大寫四種模式及 receipt schema 均為設計名稱，**不是現有 production API**。

Preflight：2026-10-17 Asia/Taipei；HEAD／local origin/main 均為 `ab3117653945de0b7013636187c446276a96e634`，branch `main`；13 tracked WIP、1,207 untracked、staged 空；index SHA256 `6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d`。兩目標新增前均不存在。前輪 1,944 個可比較既存 artifact／baseline hashes 無差異；本輪保存 1,945 個可讀既存檔 hash。12 個 protected paths 僅 stat/status，未讀內容、hash 或執行；不宣稱其內容相同。未 fetch，origin/main 只代表 local tracking ref。[S:preflight]

已核對 Gameplay Audit／Evidence、Readiness Audit／Evidence、UI-P2.4B 報告／Evidence，並深入閱讀 freeze reconciliation 與 snapshot repair。歷史 Readiness 71/71、UI 162/162、Gameplay 九組 266 checks 不作本輪 fresh PASS。Gameplay T10 只有 1–7 通過，8 失敗，9–12 **NOT EXECUTED**。本輪不新增或重跑玩法測試。Graph generation 2026-10-15，多數 source metadata_changed、文件 not_tracked；coverage 只提供 best-effort signal。所有設計關鍵邊界以目前 source 核對，未 reindex、未取得完整 call graph。[D/T:H01–H04；G:coverage]

## 2. Source-Grounded Current Ownership Map

| 層 | 目前 owner／caller → callee | 輸入、輸出與允許副作用 |
|---|---|---|
| Match／PA 排程 | `advanceHighSchoolMatchPlaybackStep` → lineup／admission／`resolveSimulatedHighSchoolPlateAppearance`／defensive producer | 讀同一 Match、先處理 pending settlement／public cursor，再選事件；唯一排程，不由 UI 另推進。[B01] |
| 玩家打擊策略／逐球 | public choose → `prepareHighSchoolPlateDecision` → `PlateDecisionFoundation.prepare/resolve` → `OffensivePlateApproach.resolveNextPitch` | Match 保存 PA／Situation；Foundation 回傳當球 count／execution facts。當球 lifecycle closed 不代表整個 PA committed。[B02] |
| 正式投捕策略 | OPA `generatePitchOpportunity` → `PitcherCatcherTacticalIntegration.createTacticalPitchDecision` → `PitchSequencing` | 既有 AI selector 與控球；OPA 回饋 pitch，Match sync runtime/history。新 Observation→Decision 鏈仍僅候選／projection，不共掌同球 intent。[B03；D:H01/C07] |
| 打擊／物理 | OPA `resolveFairContactBallInPlay` → `BattedBallPhysical.resolveBattedBallPhysicalTruth` → callback／`BattedBallOutcomeMapping.resolveOfficialBallInPlayOutcome` | 實際同球 identity、粗粒度 physical facts；無 Match 結算權。[B04] |
| 現有守備 producer | `prepareHighSchoolDefensiveMomentFromSimulation` → `ensureHighSchoolOrdinaryGroundBallInPlayHandoff` | 另外產生 ordinary OPA；有 hitterPitch／recognition／contact override。**不能拿它重新生成玩家已擊出的球。**[B05] |
| 責任／取得球 | `getHighSchoolDefensiveOpportunity` → Opportunity；`getHighSchoolReachAccess` → Reach；`resolveHighSchoolCanonicalSecure` → Secure | actual active roster 與能力，pure facts。玩家專用 context 不等於通用 NPC execution。[B06] |
| 接傳／跑者 | `buildHighSchoolShortstopExecution` → DecisionThrow、RunnerThrowSettlement、ForceAdvancement | 高階 wrapper 綁定 SS=`player`；底層 foundations 可接真實 actor。跑者／退場順序不能由結果 token 反推。[B07] |
| 正式 PA／守備提交 | 玩家打擊 `resolveHighSchoolOffensiveDecision`；玩家守備 `applyInfieldResolutionToHighSchoolMatch`；兩者使用既有底層 Match 寫入函式 | 後者同時更新 player defensive contribution、Moment、opponent order，不能在玩家攻方時直接調用。重用 canonical fact application，保留原攻方 PA owner。[B08/B09] |
| Game Record | `recordHighSchoolMatchSimulationEvent` → `MatchGameRecord.recordEvent` | 按 eventId 去重；PA 擁有 BF／batting／整個 out delta；defensive action attribution 擁有各 actor PO/A/E。Record 不保存完整 execution trace。[B10] |
| 成長／生涯 | `settleHighSchoolYearOneMatch` → finalize record/exposure → `settleMatchExperienceDevelopment` → `applyDevelopmentResult` → competition reassessment／next opportunity | 僅正式 match end 更新永久能力與生涯；PA 不可提早執行。[B11] |
| Save／公開呈現 | `save.js` normalization；production presented cursor／snapshot → presentation | 儲存 owner 與公開 prefix owner 沿用；UI-P2.4B 現為離線 consumer，不作 live engine authority。[B12；D:H02/H03] |

附件中的「OffensivePlateAppearance」實際對應 `offensive-plate-approach.js` 的 **OffensivePlateApproach**。現有 `PlateDecisionFoundation` 透過 JSON clone executionOptions，會移除函式型 `physicalOutcomeResolver`；目前不能只從 handler 塞 callback 就宣稱同球接線成功。[S:B02/B04]

### 2.1 目前來源定位索引

所有行號已以本輪目前檔案定位，完整SHA見Evidence.sources；不是沿用舊行號而不核對。[S]

| 索引 | 關鍵目前來源位置 |
|---|---|
| B01 | script.js:6624–6677、7036–7081、9667–9882、13567–13694 |
| B02 | plate-decision-foundation.js:17、39–124；script.js:10711–10776、13720–13740 |
| B03 | offensive-plate-approach.js:247–303、627–638；pitcher-catcher-tactical-integration.js:294–343；pitch-sequencing.js:157–215 |
| B04 | offensive-plate-approach.js:198–231、322–325、444–474、507–658；batted-ball-physical.js:57–130；batted-ball-outcome-mapping.js:35–77 |
| B05 | script.js:5003–5022、5160–5379、13256–13310 |
| B06 | defensive-opportunity-foundation.js:58–147；defensive-reach-secure-foundation.js:30–114；script.js:4954–4994；batted-ball-ground-defense.js:235–366 |
| B07 | script.js:11938–12041；defensive-decision-throw-foundation.js:29–165、219–359；defensive-runner-throw-settlement-foundation.js:15–132、160–185；force-advancement.js:35–69、103–184 |
| B08 | script.js:6730–6788、6907–6991、11005–11139 |
| B09 | script.js:6847–6904、11154–11176、12256–12443 |
| B10 | script.js:4343–4374；match-game-record.js:137–200、226–274、294–340 |
| B11 | script.js:12946–13040、13093–13181；match-experience-development.js:170–204、345–431、465–474、581–622；player.js:275–386 |
| B12 | save.js:173–240、375–406、419–438；script.js:4406–4465 |
| B13 | script.js:6525–6568、10483–10510、10634–10695；team-roster-foundation.js:119–134；offensive-plate-approach.js:150–190；ai-plate-appearance-outcome.js:33–60 |
| B14 | tests/pitch-production-source-scope.cjs:6–81、180–222；tests/pitch-tactical-decision-production-integration-test.js:162–201 |
| B15 | docs/match-moment-snapshot-integrity-repair-v0.1.md:11–30；同名production-delta-evidence.json的/edits/0、/files；current script.js:13093–13181 |
| B16 | docs/source-freeze-contract-reconciliation-v0.1-phase-b.md:1–45；同名authorization-review.md:34–57；目前T10:162–170 |


## 3. Match vNext Execution Contract

### 3.1 Context：來源與缺口

[I:A02] `Proposed.captureExecutionContext(match, currentPA)` 只讀取／freeze 現有 owner 的事實，回傳本次 execution 輸入；不產生另一份可回寫 Match。當前能力 snapshot 必須在實際消費時計錄，不能用後來 roster 回填歷史。

| 契約欄位 | 現有正式來源 | Adapter／缺口 | 私有／公開界線 |
|---|---|---|---|
| matchId、competition IDs | Match.id、matchContext、competitionEntry/Edition | 直接沿用；不可由畫面 label 建 ID。[B01/B10] | ID 只在允許公開的 envelope 出現 |
| paId／batterId | OPA.paIdentity；`createHighSchoolOffensivePlateAppearanceIdentity`、currentBatter | 驗證 batter=`player` 且 current lineup slot 一致；legacy momentId 不代替 generic PA receipt。[B02/B08] | canonical actor reference 可公開，內部 key 可遮蔽 |
| pitchId／physicalId／playId | pendingPitch.pitchId、truth.identity=`paIdentity\|pitch-N`；Opportunity／Throw 各有衍生 identity | physicalId **原值不變**；playId 可有版本化 suffix，但必須另存原 physicalId。[B04/B06/B07] | 未公開的 pitch／physical truth 私有 |
| situationId、decision owner、legal routes | activeSituation、PlateDecision／MatchSituationLifecycle admission | 只在正確 side、actor、pending Situation 成立時允許玩家提交；BIP continuation 不是再開一個打擊決策。[B02/B05] | 玩家僅得合法 route 與當下 perception |
| inning／half／sides／outs／scores／runner IDs | 同一 Match before snapshot、offenseTeam／defenseTeam | 來源是當球 before；不得以 final state 補過去。三個 base slot 保留 null 與 runner ID。[B08/B09] | 當前已揭露 before 可公開 |
| batting slot／current batter／next slot | battingOrderIndex、lineup／next／advance helpers | capture expected slot；commit 前再次驗證，advance 一次。[B01/B08] | 依公開 prefix |
| active pitcher／runtimeId | TeamRoster actual defense P、Match.pitcherRuntimeState | 現在 context.pitcherId 缺漏，runtime merge 可保留舊值；必須修 actor binding。[B03/B13] | 原始 mental/process、distribution 私有 |
| active defense、receiver／runner actors | Match.rosters[defenseTeam]、current assignment；runner IDs 反查 entities | 不複製玩家守備角色給對方 SS；actor／assignment fingerprint 作 stale guard，現無通用 rosterRevision。[B06/B07] | 能力精確值不自動公開 |
| consumed capability inputs | live Player abilities、roster simulation capabilities／pitchingProfile | 記 source path、原值、尺度、adapter version、fallback reason、actual consumed keys；目前沒有統一 provenance contract。[B13] | 原值及 rolls 私有 |
| RNG／simulation identity | Match.simulationSeed／既有 RNG、OPA／Physical／Throw namespaces | capture draw counter／namespace；每階段 memoized facts。不可引入 UI RNG；identity deterministic 不等於從未重算。[B01/B04/B07] | roll、未揭露策略私有 |
| executionMode／producerVersion | 各 producer 的既有 result／resolutionMode、authority | 四類模式為新 design tag；舊資料無 tag 留 unknown／legacy，不臆測。[B01/B04] | 只公開被證據支持的 mode |
| committed refs／visibility | resultApplied、eventRefs、simulationLog、presentationSnapshot／cursor | 缺 PA-wide durable receipt；需補 identity cross-check，不把 cursor 當 settlement。[B08/B10/B12] | public allowlist 與 reveal state |

### 3.2 結果：facts、candidate、committed、public

[I:A03] 建議新結果介面 `Proposed.ExecutionResultV1`，只作組裝契約：

- **executedFacts**：producerKind/version、mode、contextRef、consumedInputs[]、decisionRef、pitchIntent/actual、perception/route/swing facts、physicalTruth/physicalId、defense/runner stage refs、RNG namespace／sample provenance。未執行欄位為 absent 或明示 unsupported，不能填猜測值。
- **settlementCandidate**：candidateId、paId/playId/physicalId、expectedBefore（局／半局／sides／score／outs／runner IDs／slot／pitcher／roster bindings）、ordered actual retirements、movement intents、第三出局裁定、合法 scoringRunnerIds、scorer/action refs、proposed PA result、fallback。此時 `committed=false`，不寫 Game Record 或成長。
- **committedReference**：只由既有 PA owner 成功提交後回傳，含 PA eventId、defensive eventId（若有）、settlementId、before/after refs、order transition、resultApplied；不能由 producer 自稱 committed。
- **publicProjection**：未來 F1 從 committedReference＋正式 reveal prefix 映射；只公開當下可見事實。candidate、true tactical distribution、rolls、private mental state／能力 snapshot 都不直接送 UI。

目前 OPA callback 對非 Pending result 會自動套 `settled:true` 給 mapper，這只是既有 mapper 的局部 defense 訊號，**不代表 Match／PA 已提交**。新 adapter 在 held BIP 用 Pending candidate，canonical Match commit 另行完成，不能混用兩種 settled 語義。[S:B04；I:A03]

### 3.3 每層副作用限制

Decision／Execution／candidate builder 不得改 outs、bases、scores、order、GameRecord 或 player skills。Match handler 可沿用現在的 PA／Situation/runtime 工作狀態，但 canonical mutations 只進既有 owner。record/evaluation projections 不再呼叫 execution。Presentation 的 Replay／Skip／Confirm 只讀已提交 facts；F2 將來只能要求 production owner 繼續，不重送當球決策、不補產 evidence。[B08–B12；I:A03/A09]

## 4. Four Execution Modes

下表是設計分類，保留來源自己的 `compressedPlateAppearance`、authority 與 historical fields，不要求改舊名稱。[I:A02/A03]

| 模式 | 決策／逐球／物理 | 能力與 execution | 結算與允許 evidence／禁止宣稱 |
|---|---|---|---|
| DETAILED_PLAYER_PA | 已准入玩家選 take/contactSwing/powerSwing；actual pitchHistory；fair contact 可產 truth | live batting／observe／ballSense／IQ／power；真 active P control；既有 AI selector。Stuff/repertoire 不冒充已參與 | 原 offense PA owner；S1 eligible ball 改用 defensive facts，其他保留原 mapper。允許 batting decision/execution／meaningful PA；不可宣稱所有 BIP 都詳細守備。[B02–B04/B08/B13] |
| COMPRESSED_PA | AI compressed terminal producer，無逐球 history／count；不生成詳細 BIP | actual adapted contact/power/discipline、active pitcher pitching/decision/control＋context 進算式；保留 AIOutcome trace | 現有 token settlement、routine PA writer／order；允許 PA stats/exposure／有限 performance，不能造 pitch sequence、投捕策略、接傳或玩家決策。[B01/B13；H01:C02/C03/T03/T10] |
| PLAYER_DEFENSIVE_DECISION | 正式 supported responsibility＋reach/control＋admission 才給玩家 route；不是玩家 batting PA 再讓其控制敵隊 | 現有 SS 能力／secure／throw／runner timing；ordinary source 的受控 contact 並非自然完整投捕鏈 | 原 infield owner／lifecycle；meaningful defense evidence。可保留來源 Pending BIP；不可宣稱該球跑過 detailed AI pitching。[B05–B09] |
| ROUTINE_DEFENSIVE_EXECUTION | 原 routine player defense 自動合法 route；S1 新增同球 opponent-NPC single-route policy 是其設計擴充 | 仍須實際 roster／reach/secure/throw/receive/timing；同球 NPC 與 legacy player routine 分開標 producer | 沿既有 PA owner 提交。NPC 用 defensivePlay＋actor attribution；**不得發 playerRoutinePlay 或 player defensive learning**。原玩家 routine 保留 shortstopRoutine evidence。[B07/B10/B11] |

Compressed PA 不展開成逐球；也不降低為無視能力的 RNG。新 Observation／Sequence／Interpretation／Decision 仍可作無副作用 projection；切換 selector authority 須另立互斥政策與對照驗收，S1 不消費其 candidate intent。[B03；H01:C07/T10；I:A05]

詳細 OPA 另有第15球 safety fallback；必須保留 `safetyFallbackUsed` 與結果來源，不能把強制BIP當一般自然contact見證。S1受控成功情境應在此上限前走真合法打擊決策；到達fallback仍須照來源標示，不能刪除旗標通關。[B04；I:A10]

## 5. Same-Ball Batting → Defense Handoff（第一優先）

### 5.1 可重用 facts 與尺度

`BattedBallPhysical` 真正提供 identity、contactQuality、ballType、pace（weak/moderate/firm/hard）、direction（leftSide/middle/rightSide）、airborne depth、continuousContactScore、paceScore、depthScore，以及原 direction roll／pitch／recognition／swing evidence。**沒有公尺座標、落點向量、飛行秒數或完整 trajectory**。[B04]

既有 Opportunity 是粗 nominal lane；3B／1B 邊界還使用既有 truth.executionEvidence.rolls.direction，不能重新抽方向。Ground compatibility 把 pace 映射為 normal／hard／slowGrounder、access 類別及 route windows；Reach／Throw demand 與 runner arrival 都是 **coarse relative units**，不是同一條公尺／秒運動學模型。[B06/B07]

[I:A04] Adapter 只轉既有 vocabulary、active actors 與 arrival／force inputs；保留 topologyVersion、units、physicalIdentity。動畫座標不得回寫物理；不捏造落點或把 coarse arrival 換算成真實秒數。只需要相對需求的 S1 不必新建 trajectory；未來若某 resolver 必須真實 flightTime／coordinates，屬缺少正式來源的 extension gate。

### 5.2 精確接點與提案 API

以下皆 **PROPOSED**，名稱可於授權施工時調整，沒有新增程式：

1. **在第一球生成前綁定 actor。** 原 `ensureHighSchoolOffensivePlateAppearanceState` 讀 actual defense P，context.pitcherId、runtimeId、control、PA／batter／roster snapshot 同源。模式只在 fresh、合法 detailed player PA 啟用，不能把已生成 legacy pending pitch 改名冒充新執行。[B02/B03/B13]
2. **傳遞可信任的 BIP hook。** Match handler 提供 `Proposed.resolveSameBallDefense(context, physicalTruth, stageInputs)`。PlateDecision 新增獨立的 trusted resolver 參數，於 clone data options **之後**明確交給 OPA；不序列化函式、不讓 UI 傳任意 callback、不從 Save 反序列化程式。auto detailed PA 也走相同注入規則；off-mode 完全沿既有流程。[B02/B04]
3. **BIP commit boundary。** OPA 原 resolveFairContactBallInPlay 在 contact 已確立、truth 已產生後，先依 immutable facts 判斷 eligible。eligible 時回 `groundBallDefensePending`＋candidate ref；不得先跑 compressed hit mapper／token base awards 再覆蓋。暫停只存在同一同步 handler 工作內，無 timer／UI await。[B04；I:A04]
4. **阻止再投球。** 目前 OPA.resolveNextPitch／simulate 已擋 awaitingDefense，但 OPA.prepareNextPitch、PlateDecision.prepare 與 script10770 尚會準備下一球。必須以 explicit awaitingDefense 分支返回 handler 的 continuation，不進 prepare。現有 pitch Situation 可以按當球事實 close，整個 PA 仍 uncommitted；不可借「pitch settled」跳過防守。[B02/B04]
5. **Pure defense 組裝。** actual opposing roster → Opportunity.resolve → Reach.resolveReach → Ground.buildGroundBallDefensiveOpportunity → Secure.resolveSecure → DecisionThrow.buildDecisionOpportunity/selectDefensiveRoute → resolveThrow → resolveIncomingReceive → RunnerThrowSettlement.resolveTiming/deriveSettlement → ForceAdvancement → canonical third-out。所有 actor IDs 來自 actual assignment，不把 NPC SS 改成 player。[B06/B07]
6. **完成 held BIP。** `Proposed.completeHeldBallInPlay(paState, candidate)` 在原 OPA module 驗證 paId／physicalId／最後 pitch event 相同，讓既有 BattedBallOutcomeMapping 消費已閉合、同球的 defense classification，將 Pending 轉成已完成 execution result，保留原 pitchHistory 與 physicalTruth；**不重跑 resolveNextPitch／Physical／tactical feedback**。mapper 的 local settled 僅表示守備裁定可用，PA.resultApplied 仍 false，等待原 offense owner。[I:A04；B04/B08]
7. **原 offense PA owner 唯一提交。** `resolveHighSchoolOffensiveDecision` 的 opt-in candidate 分支，以既有 `applyHighSchoolDefensiveSettlementFacts` 取代這一 PA 的 `applyHighSchoolSimulatedPlateAppearance`，再沿原 meaningful PA／Moment／markResultApplied／order 流程；不得兩者都套。NPC defensivePlay 事件只記真實守方 actor。原 `applyInfieldResolutionToHighSchoolMatch` 不呼叫、不改其玩家責任。[B08–B10；I:A06]
8. **沿原 production step 下一棒／半局。** commit 後 expectedAfter 接下一事件 before；若第三出局，保留 pendingHalfInningTermination 交 `endHighSchoolMatchHalfInning`，不可自行清壘／重開 Match。[B01/B09]

### 5.3 S1 的 NPC 守備與跑者範圍

[I:A04/A06] 首個可驗收情境：**合法已准入玩家詳細打席，壘上無人、outs=0/1/2，actual opponent SS 為合法 primary、1B 為不同且有效 receiver，玩家不在守方；一個 secureFirstBaseOut route、一次接傳 contest。** 對方 policy 在合法 opportunity 中固定選該 route；這不是新增完整 AI Director。

不可直接重用 player-hardcoded `buildHighSchoolShortstopExecution`、`getHighSchoolPhysicalDefensePlayerContext` 或整段 `applyInfieldResolutionToHighSchoolMatch`。新 adapter **組合既有 pure foundations**，不複製 margin／timing／force 公式。可直接使用 `resolveIncomingReceive`：接真 throw、actual NPC 1B capabilities、同一次 declared execution sample；其已有 readinessMargin／secureMargin，與 Receiver v2 無關。[B05–B07]

順序：沿同一 before 建 force chain（含 player BR）→保存 committed movement→secure/route/throw/receive→timing 得 actual retirement 或 safe contest→ForceAdvancement 產完整 actor movement→canonical third-out 檢查 ordered retirements／scoring→project settlement→validateBefore→commit。RunnerThrowSettlement.deriveSettlement 是 first-leg，可能回 liveBallRecoveryRequired／pendingRunners，**不能把 first-leg candidate 當整個 live ball 已完成**。無人壘單次 contest 可用既有 Force owner完成 BR；R1 force／DP／R3 timing play 移到下一擴展，不能因結果是 out 就略過跑者。[B07/B09]

S1 成功退休可用現有 action contract 的 field→throw→receive→baseTouch 依賴鏈，投手 out delta 由 PA 記一次。safe／error 不能一律當 single；必須有同球 scorer facts 才可判 error／hit／FC。接球失敗、無可控球、offline throw、receiver unavailable、合法延續未完成等若缺 recovery／scorer 來源，**該 opt-in case 停在未提交，列驗收失敗**，不得改 seed、重投、強制 clean out、重抽 mapper 或默認 single。這限定 S1 為受控垂直驗收，尚不適合全自然分布 rollout；要擴大覆蓋，先批准並完成同球失敗／延續契約。[B07/B10；I:A04/A06]

### 5.4 分支路由（不能全變成 SS）

| 實際事件 | S1／後續處理 | 結算規則 |
|---|---|---|
| SS eligible ground、無人壘、完整單一 contest | opt-in same-ball routine NPC execution | 同球 candidate；只有完整 legal closure 才交原 offense owner |
| ground 不屬 SS，或有其他 runner/route | S1 DEFER；未進同球 execution 前選原 mapper，標 legacy/compressed classification | 不更改 direction／primary，不把 2B/3B/1B 偽造成 SS |
| line drive／fly ball | S1 保留原 airborne mapping；詳細 catch/tag-up ADAPT 後續另驗 | 不能先給 hit／out 又重跑 catch；已有 airborne modules 不表示同球橋已驗 |
| foul／take／whiff／walk／K | 原 PlateDecision/OPA count／terminal path | foul 不建立 fair physical handoff；不因等待 defense 新增一球 |
| homeRun／合法無接傳結果 | 由原有 airborne mapper／terminal owner 決定，保留 coarse mapping provenance | 不捏造 SS throw；ground ball 不可 HR |
| malformed truth／missing actor／identity mismatch | opt-in fail-closed；無完整 execution 前拒絕進入 | 不能隱藏失敗而重抽 physical；非同球路徑只准明列的原流程降級 |
| 已進 eligible execution 後失敗／未完成 recovery | S1 BLOCKER case、停止提交；不能事後切舊 producer 改結果 | 保留原同球 facts 供診斷；安全復原另驗收 |
| 第三出局 | canonical third-out owner，禁止強行下一棒同半局 | 合法 runs、basesAfter、half termination 先完成，再由原 half owner 續行 |

eligibility 基於 physical／actor／context 支援條件，不能以「抽到好守備結果」選模式。測試控制值須事先聲明，不以 seed 搜尋挑成功球。[I:A04/A10]

## 6. Pitching／Capability Provenance

### 6.1 Active pitcher identity 與更新

[S:B13] 現況：`ensureHighSchoolPitcherRuntimeState` 取 opponent actual P、control×2 clamp1..20，缺值 fallback8；runtimeId 為 matchId|pitcherId。`PitchSequencing.normalizePitcherRuntimeState` 卻是 fallback 後覆 saved，可能保留舊投手 control／ID。PA context 目前未放 pitcherId，`completePitchTruth` 可使用 `opponent-pitcher` placeholder。GameRecord 則由當時 defense roster 取 P。三者需要對齊。

[I:A05] S1 mandatory binding：

- pitcherActorId＝actual defense P.id；runtimeId＝既有 matchId|pitcherActorId；PA context.pitcherId、每個 actual pitch.pitcherId 與記錄所用 pitcher 一致。不可改 identity 來重抽已生成 pitch。
- 先驗證 actual actor／finite control／source；新 opt-in 缺真實來源即拒絕，不能 fallback8 或 roster default1 冒充能力接線。legacy mode 保留原預設但 provenance 明記 fallback。
- fresh PA／下一個尚未生成 pitch 的合法換投邊界，若 runtime actor 不同，用既有 createPitcherRuntimeState 對新 actor 初始化；不把前投手 mental/recent sequence 合併給新投手。相同 actor 保留 process history，但 control snapshot 按明確能力版本規則刷新，不能讓 saved 舊值蓋過當次合法 input。
- S1 不新增換投 UI／規則，不在 pending pitch 或 uncommitted BIP 中換人。actor變動後舊 candidate 拒絕；下輪擴展才處理多投手 runtime bank、mid-PA substitution／投手責任分配。缺 per-pitch consumption snapshot 的舊 PA，不能由現在 roster 補寫歷史。[B03/B10/B12/B13]

### 6.2 真正進算式的能力

| 能力 | 原始來源／adapter／尺度 | 真正 consumer／可驗證中間量 | S1 要求 |
|---|---|---|---|
| 玩家 batting、observe、ballSense、IQ | live player.baseballSkills.batting、observe、ballSense、baseballIQ；OPA abilities；power 由現有 offense adapter | OPA recognition／decision／contact；Physical continuousContactScore、paceScore；能力通常按0..20正規化 | 記原值與 consumed keys；不套 roster default offense。[B02/B04/B13] |
| 詳細投手 control | active roster.pitchingProfile.control，現有×2→1..20 | PitchSequencing.resolveControlRealization：control／targetDifficulty／realizationStability／actualDistribution；再到 actual location | 真 actor、尺度與 fallback flags mandatory；中間量對照，不要求每次 hit/out 改變。[B03/B13] |
| compressed 打投能力 | contact/power/discipline；P pitchingQuality/decision/control；context | AIOutcome quality、pitcherPressure、adjusted、walkAdjustment、strikeoutProbability | 原路徑保留，無 TeamStrength 再加成；單元證據不冒充新 detailed consumer。[H01:C02/T03] |
| SS reaction/range/mobility/fielding/catching | actual roster defender；目前 NPC defense adapter＋offense.speed；canonical Player 只在實際是玩家時讀 live | Reach weighted margin；Secure margin／arrival penalty | actorId matching；缺 finite 真 input 不給整合通關。[B06/B13] |
| SS arm/throwing、1B fielding/catching/reaction/range | NPC arm/defense adapter；接球能力可依既有 fielding alias，需記 alias | Throw strength/accuracy margins；IncomingReceive readiness/secureMargin | 既有 pure resolver，真 receiver；不啟 Receiver v2。[B07] |
| runner speed／start／progress | player baseRunning/fitness→speed；原 runner ID 反查 NPC；observed start/progress 如存在 | Ground runner states；RunnerThrow relativeArrival＝10−speed×0.45＋start−progress | BR 使用玩家 live adapted speed；normalStart 是明示模型預設，不宣稱跑壘自主策略。[B07/B13] |
| stuff／repertoire／球速品質 | roster 雖有欄位，OPA physical pitch type/velocity 目前為 identity-derived generic profile | 真 stuff/repertoire→detailed physical 未證實 | DEFER；必須標 generic pitch physical profile，不能說完整真投手球種模型。[B03/B13] |
| stamina／疲勞／球數負荷 | health/readiness／opportunity 與 static fitness 可用；逐球 stamina 尚未證實 | live fatigue→pitch/contact 未接實證 | DEFER，不創造掉體力公式；保留既有心理／rhythm consumer。[H01:C14] |

能力敏感性驗收固定合法 context、decision、同 identity 與明列外生 rolls／samples，只改單一來源能力；檢查預期 margin／distribution／contactScore 方向或差異。固定所有外生條件時，actorId 換人會改 deterministic namespace，因此測 actor attribution 與測 ability sensitivity 應分兩個情境；後者固定 actorId。不得只看最終安打數。[I:A05/A10]

新 tactical chain 可讀 observation，卻不能與現有 selector 疊加 intent。Batter anticipation 的 readiness 目前偏資訊／持久化，數值 bonus 到 execution 未證實；S1 保留但不宣稱其改變命中率。TeamStrength summary 只作已存在 context／分析，不再額外加 PA bonus。[H01:C07/C08/C13]

## 7. Canonical Settlement Boundary 與 Exactly-Once

### 7.1 現有保證與缺口

| 職責 | 現有 owner／實際保護 | 缺口與 proposed contract |
|---|---|---|
| PA 完成／套用 | OPA.completed/resultApplied；offense handler／markResultApplied | Pending 不是 terminal；沒有跨全部 producer 的 PA receipt。[B02/B08] |
| 防守／跑者裁定 | RunnerThrowSettlement、ForceAdvancement；Match.applyHighSchoolDefensiveSettlementFacts | validateBefore 比較 bases/outs/scores，不比較 matchId/PA/roster/order；補外層身份檢查，不能放寬內層。[B07/B09] |
| 第三出局 | `resolveHighSchoolThirdOutIntegrity` 與 pendingHalfInningTermination | timing unresolved 必須拒絕；ordered force／BR-before-first／nonForceTag 的 scoring 語義保留。[B09] |
| order／half | 原 advance／endHalf helpers | player-defense wrapper 固定 opponent side；S1 必須由原 offense owner advance player side 一次。[B01/B08] |
| Game Record | eventId duplicate；defensivePlayIdentity 去重 actor stats；final status lock | 不替 Match mutation 去重；PA writer 先增 performanceEvidence、再 record，重叫仍會重增 evidence。[B10/B08] |
| 終場成長 | match.settled/completed、matchExperience.settled／development settlement IDs | 不等於每個 live ball 有交易原子性。遇錯誤不能由 UI 重送 settle補救。[B11] |
| reload | Save restores PA/resultApplied、log、Moment、activeSituation／handoff | 新 generic continuation receipt 未有正式契約；JSON copy 可保存物件不等於安全復原已證實。[B12] |

### 7.2 唯一提交契約（PROPOSED）

[I:A06] 沿**原 offense owner**新增 opt-in candidate 分支，不建立獨立 commit service：

1. 在任何 Match mutation 前驗證 candidate version、match/PA/pitch/physical/decision IDs、batter與slot、offense/defense、active pitcher／SS／1B bindings、before state，以及全部 action/scorer／third-out facts。
2. 若相同 PA 已有 resultApplied＋matching committed refs，回傳既有 receipt；不得重抽樣、重增 performanceEvidence、重記PA或再 advance。不同 candidate／相同 PA 或既存 refs 不一致，明確 reject。PA state 已被下一個 PA 替換時，以 durable committed event／Moment cross-reference 查重，不能只看目前 state。
3. 未有提交才呼叫 canonical fact application；**不再呼叫 token base award**。記一次 PA／一份同 play defensive attribution，runner runs 由原 score owner寫入。PA event 擁有整個 out delta；defensivePlay 不再另加 pitcher outs。
4. 候選 metadata 必須在呼叫 GameRecord.recordEvent **之前**組好：eventId、actionFacts、defensiveAttribution、scorerErrorOwner、pa/play/physical refs。目前 event 後加 Object.assign 只會補 simulationLog，GameRecord 已執行，不能靠晚加欄位修正記分。[B08/B10]
5. order 一次、PA.resultApplied 一次、Moment／pending agency 一次；receipt 綁 eventId／settlementId／before-after-order。record writer 仍是原 writer，只允許 opt-in identity metadata 與防重入口，不能自立另一份 ledger。
6. 同步 handler 中無 await／Save／UI publish。候選先完整驗證，commit 後再公開。JS 同步呼叫**不保證遇 exception 的 rollback 或 crash recovery**；驗收須涵蓋重入、注入失敗與部分 ledger mismatch。若需要新的持久 transaction journal／Save schema 或改 canonical authority 才能成立，立即升級授權，不偷偷加入 S1。

新增 optional identity/provenance 在既有 log／Moment／PA.context／officialBallInPlayOutcome 內的保存方案須 review；不能假設 normalize 保留所有頂層欄位（OPA 會重建 allowlist）。Receipt 是對既有 authority 結果的索引，不得帶可獨立覆寫 Match 的另一份 after state。[B04/B12；I:A06/A08]

## 8. Evaluation／Development Boundary

| 層 | 原 owner／來源 | S1 保留／後續驗證 |
|---|---|---|
| 1 統計 | MatchGameRecord：PA、BF、outs、runs、action PO/A/E | PA與defense events同球、actors正確、一次；不要把安打/出局當 decisionQuality。[B10] |
| 2 執行／決策證據 | Match performanceEvidence／simulationLog／completedMoments；MatchExperience derives exposure與active evidence | 原 offense Moment 保存真 decision/execution／outcome與same physical refs。五類仍分開：defensiveInningsExposure、plateAppearanceExposure、shortstopRoutine、shortstopMeaningful、meaningfulPlateAppearance。對方NPC守備不能增加玩家SS三類證據。[B11] |
| 3 教練／球探／Position解讀 | coach text、match scout scalar、CompetitionEvidence／Reassessment、position readiness／career aggregate | 來源不同；公開coach text不等於永久能力成長，Position readiness不等於本球守備結果。[B11；H01:C20] |
| 4 永久成長 | match end → MatchExperienceDevelopment → applyDevelopmentResult → skillProgress／thresholded baseballSkills | S1 PA結束 skills/progress/experience settled IDs不變；只在原 match-end owner執行。pressure沿同PA已存publicContext，不拿終場state補。[B11] |
| 5 未來角色／機會 | competition reassessRole/applyRoleResult；條件式Y1 first opportunity→followup | 下一場snapshot讀新能力、role/opportunity是否改變，留受控跨場見證；不要求每次升級、變先發或一定再遇SS。[B11/B13] |

`deriveMatchExperienceEvidence` 從 playerRoutinePlay、defense Moment、offense Moment 分類；新 NPC event 應用 `defensivePlay`＋actor attribution，不偽造成 playerRoutinePlay。S1 不必修改 development 公式；先驗證原 offense evidence 能回溯本次 truth／decision refs。若要求每筆 normalized learning record額外保留physicalId，需要獨立 source-mapping delta，不能暗改 evidence schema或套新成長權重。[B10/B11；I:A07]

## 9. REUSE／ADAPT／REPLACE／DEFER Matrix

| 模組／系統 | owner／目前 runtime | 決策 | Adapter需求／風險 |
|---|---|---|---|
| Match State／Context | player.highSchoolMatch；正式同Match continuity | REUSE | read-only capture與stale guard；高一致性風險，禁止第二state owner。[B01] |
| Lifecycle／Order／Half | MatchSituationLifecycle＋script helpers；正式執行 | REUSE | 新pending-BIP分支沿原guard，無新lifecycle schema；錯side/order雙推進風險。[B01/B02] |
| Canonical settlement／third-out | Match fact applier＋existing rules | REUSE | 候選進入前補identity，不改rules；generic first-leg未閉合不能commit。[B07–B09] |
| Game Record | MatchGameRecord＋event owner；正式stats/dedup | REUSE | 使用既有action contract，metadata在dispatch前備妥；E／outs重複風險。[B10] |
| PlateDecision／OPA | detailed runtime；JSON callback/pending guard缺口 | ADAPT | 明確trusted hook＋completeHeldBIP，preserve mode-off behavior；freeze衝突高。[B02/B04] |
| BattedBallPhysical | 真contact→coarse truth | REUSE | 不改physical演算法／identity；不能宣稱metrictrajectory。[B04] |
| OutcomeMapping | coarse或settled-defense classification | ADAPT | eligible前hold，terminal由same-ballfacts；其他分支不變；prematuresettled語義風險。[B04] |
| ordinary contact高階producer | 另生OPA且含controlledpitch | DEFER | 保留legacy守備；不拿來當same-balladapter，否則duplicatecontact。[B05] |
| Opportunity／Reach／Secure | actualroster、purecapability arithmetic | REUSE | 綁NPCactor、topology；不複製計算式。[B06] |
| SS高階wrapper／玩家防守commit | 硬綁player且寫defensecontribution | REUSE | 保留既有player路徑；新NPC不走此wrapper，避免污染玩家成績。[B07/B09] |
| Throw／Receive／runner timing／Force | purefoundations＋canonicalthird-out | REUSE | 小型actor/runneradapter，firstleg到完整play閉合需驗；不啟Receiver v2。[B07] |
| runner actor input | 真speed部分已接、precontactdefaults | ADAPT | BR live值／ID／start/progress provenance；多runner/DP/recovery後續。[B07/B13] |
| active pitcher／capability adapters | control已算、identity/cache斷裂 | ADAPT | S1提前最小binding/refresh；genericprofile如實標示。[B03/B13] |
| 既有AI tactical selector | detailed正式consumer | REUSE | 單一intentauthority，不疊加新candidate。[B03] |
| 新tactical Decision／Adapter consumer | projection/test wrapper | DEFER | 未來單一selector切換審查；不是S1必需新foundation。[H01:C07] |
| stuff／repertoire／stamina／manualcatchercall／playerpitcher | 部分欄位或deferred，不完整runtime | DEFER | 未有足夠真來源；不補假能力通關。[B13；H01:C14/C15] |
| Evaluation／Development source mapping | 正式matchend，PA evidence可用 | ADAPT | S1沿既有offenseMoment；先不改學習formula；跨場角色結果仍待驗。[B11] |
| UI-P2.4B／F1/F2 | 離線presentation，livepublicbridge尚缺 | DEFER | 等execution與receipt後才映射；不用動畫gate驅動玩法。[H02/H03] |
| 全新Match Engine／第二ledger | 無必要正式owner缺失證據 | DEFER | 沒有任何核心模組判為REPLACE；重建將增加Save/Career/state遷移成本。[I:A01] |

## 10. Source-Freeze Guard Review

**結論：STALE GUARD CANDIDATE（證據充分的候選），兼有待裁定的 ARCHITECTURE CONFLICT；不是已證實 VALID REGRESSION，也不是已核准放寬 guard。**[S:B14/B15；D:H04/H05；I:A11]

原 guard 保護 pitch generation/selection、readiness、dispatch、PA identity、persistence handoff、offensive presentation、shared settlement/record owners；`tests/pitch-production-source-scope.cjs` 的 PROTECTED_FUNCTIONS 明列 settleHighSchoolYearOneMatch，除幾個 exact additive projection外要求body一致，並保護外部 wiring。它的「新鏈不可接管runtime」invariant仍有效；不能把本次差異當成刪除整個guard的理由。[B14]

| 已查明事項 | 證據／裁定 |
|---|---|
| 原比較 | T10 case8對 `ac53bf61964bde4b40501c77e15269bae99b55cc:script.js`；function 96行，現89行。normalized function SHA old=`cdf18754723934a71b44867c3ccb744921549d263c86fb4f52347a9eb0271456`，current=`671bc0fb85c8a526631f56e9ebd90c05dcce05503854dd4be7dc2ee7c4d5693a`。[B14／freezeExact] |
| 差異來源 | 10/15 Snapshot Integrity Repair production-delta：刪除7行 finalMoment.scores/runners/outs/half 終場覆寫。**本輪靜態比較確認：對歷史function作這個精確刪除，恰等於目前function。** current script完整hash也等於該修復afterHash。[B15] |
| 為何設計較合理 | event Moment留當球after；gameEnd／finalRecord留終場狀態。match-end成長沿原owner，避免舊Moment被terminalrewrite；修復另以same-PApublicContext取pressure。[B11/B15；I:A11] |
| 歷史行為驗證 | 修復報告記144 green：50canonical＋13record＋46experience＋35presentation，且outside replacements unchanged；本輪只讀文件／hash，未重跑。不是用144掩蓋後來T10red。[H05] |
| 既有新授權契約 | 10/14 Phase B只改五套測試中的5 Save＋2 Index comparisons，productiondelta0；仍保留原script guard。它早於10/15修復，不能授權新的script例外。限定檔名搜尋未找到更後的同名reconciliation；不宣稱全庫沒有其他決策紀錄。[H04/B16] |
| 現行測試狀態 | Gameplay audit T10：cases1–7 passed；case8 failed `protected source changed: script.js#settleHighSchoolYearOneMatch`；9–12 **NOT EXECUTED**。本輪0 suite invocations，原test／pins／evidence未改。[H01] |

施工前應另授權一個**精確契約調和**：保留歷史pins與rawred，允許上述唯一7行刪除的可審查before→after關係；保護其餘function／wiring／Save／RNG、match-endgrowth不變；正向測Momentbefore/after與finalGameRecord各自保真，反向mutation須能抓回終場覆寫、重複成長、分數／打序／record等無關變動。不能用「接受現行全檔hash」或刪case8取代。[I:A11]

**兩個不同gate**：先裁定歷史7行repair與guard；再審核S1有意改動的OPA／PlateDecision／script protectedfunctions與wiring。即使第一gate過，第二gate仍須授權；既有Phase B不自動涵蓋新Gameplayconsumer。[B14；I:A11]

## 11. Sprint 1 Detailed Implementation Proposal

暫名：**Match vNext Sprint 1 — Same-Ball Gameplay Execution Vertical Slice**。以下是建議的下一輪精確施工範圍，本輪均未建立／修改。[I:A04–A08/A10]

| 建議路徑 | 允許責任（待批准） |
|---|---|
| 新 `contracts/match-vnext-execution-v0.1.cjs` | identity／facts／candidate validation，pure，無RNG／Match mutation；瀏覽器若需載入應提供classic-script兼容匯出，不建立第二runtimeauthority |
| 新 `match-vnext-same-ball-execution-adapter.js` | pure actor-bound same-ball組裝；呼叫既有Opportunity/Ground/Reach/Secure/Throw/Receive/Timing/Force；不複製公式、不得寫ledger |
| 現 `plate-decision-foundation.js` | trusted hook顯式轉交、pending-BIP prepare拒絕；保留舊take/swing/count/lifecycle語義 |
| 現 `offensive-plate-approach.js` | completeHeldBIP驗證與state轉換、awaitingDefense guard；**不改**physical/contact/mapper演算法或pitch RNG；off-mode原行為 |
| 現 `script.js` | activeP binding／runtime refresh、同球opt-in handler、原offenseowner候選分支、PA identity防重與pre-dispatchprovenance；精確函式見Evidence，禁止修改玩家SScommit與match-endgrowth |
| 現 `index.html` | 只有必要的新contract/adapter script載入與依賴順序；**需另核准現有Indexfreeze精確delta**，不能自動套Receiver例外 |
| 新 `tests/match-vnext-same-ball-execution-contract-test.cjs` | purecontract、identity／capability／actor／candidate negativecases |
| 新 `tests/match-vnext-same-ball-production-integration-test.cjs` | current-index VM／真production handlers，固定受控scenario與0/1/2outs；兩端reload、reentry、record/evidence／nextstep |
| 既有freeze test/helper | **不直接列入S1自動修改清單**；由前置契約調和另列精確檔與delta授權，保留pins、negativeguards |

不可變 owner：player.highSchoolMatch identity、existing canonical third-out／Force rules／fact applier、MatchGameRecord統計與dedup核心、player-defensecommit、match-enddevelopment／rolethreshold、Save schema／normalizers、ReceiverSnapshot/execution、UI/CSS/HTML玩法畫面。建議不修改 `match-experience-development.js`、`player.js`、`save.js`、`match-game-record.js` 或守備foundation公式。若現有pureAPI不足，提出精確差距，不能在adapter複製一套較鬆的規則。[B07–B12]

**施工順序**：

1. Gate R1／R2通過，記freshbaseline／allowlist；先把proposedcontract與受控negativecases規格固定。
2. 最小activepitcherbinding與consumedcontrol先到位，依單一selector出真pitch；沒有這步不能進same-ball驗收。
3. 接trustedhook與pendingstop，先證明physical建立一次、尚無Matchcommit。
4. 組NPCsingle-contest，先純facts/timing/force/thirdout閉合與actorattribution，再將候選接原offenseowner；保留舊producer互斥分支。
5. 驗唯一PA/Record／nextbefore／兩端reload／failureinjection；再跑針對性既有plate、SS、compressed、record/lifecycle與freezechecks。執行前逐項檢查sideeffects；不直接用全庫或含seedsearch的suite替代。
6. 最後受控完賽驗match-endgrowth仍唯一，S1交付及停等擴展授權；不順勢接F1/F2或UI。

RNG規則：每個stage保留原namespace與identity，外生sample明列並存fact；NPC所需新executiondraw若必須消費Match stream，要在未呈現前由owner一次取樣並記counter，不能UI取樣。優先用既有foundationidentity-derivedroll，sample來源須在contract明列。off-mode／compressed RNG全等；on-mode因新增真正守備可能合法改後續draw，但需聲明預期drawschedule，Replay/query/reload不能再consume。Tacticalhistoryfeedback只一次，pending→completion不能再投球。[B03/B04/B07；I:A10]

Stop conditions：需要Save schema／新journal／新authority／protected file內容操作；actor或control來源為placeholder；genericfirstleg未閉合；safe/error無正式scorer依據；callback被clone丟失；candidate／after／ledger／order不一致；oldcompressed或SS回歸；failures靠reroll通關；freeze未批准或必要checks仍red；任何pendingBIP可被Save/timer觀測且無復原契約。遇到即停止相應施工、保留證據，不擴大scope。[I:A08/A10/A11]

## 12. Acceptance Matrix（未執行規格）

所有新測試都是下一輪提案。固定合法已准入fixture與明列roll，不新增seed搜尋／MonteCarlo；controlledsuccess不代表自然分布覆蓋。現有T編號僅歷史支撐原owner。[I:A10]

| ID／主題 | 必要輸入／觀察 | 通過條件／反向案例 | 現況 |
|---|---|---|---|
| V01 真能力 | 同actor/context/rolls，只改live batting或activeP control | contactScore／recognition/contact margin、control realizationStability或distribution有合理差異；真source snapshot匹配；缺值/actor mismatch拒絕 | 原公式有[S/T]；同球productioncounterfactual待驗 |
| V02 正式配球 | 真PA、單一existingAIselector；declaredrepeat/change-look context | selector invocation/intent引用唯一；actual pitch由同control realization；新shadowDecision不inject、不改RNG | 舊詳細鏈有證據；S1回歸待驗 |
| V03 玩家打擊 | 相同合法pitch情境take/contactSwing/powerSwing | 走真public handler；action／count／swing中間量可觀察差異；illegal/stale route拒絕 | T06/T10部分；新hook待驗 |
| V04 同一顆球 | 真OPA contact→truth→SS→candidate→PA | physicalId逐層相同、Physical呼叫一次、pitch/contact不重抽；異球candidate拒絕 | GAP／PENDING |
| V05 守備責任 | actualopponentSS/1B；SS邊界及非SS球 | roster/responsibility合法、NPC不冒player；換assignment使舊candidate拒絕 | 原purefoundation/T02；新NPC橋待驗 |
| V06 runner／third-out | 空壘0/1/2outs單contest；固定speed/start | sameBRID、timing/force/third-out相符；2outs→halfend且BR-before-first不算run；unresolvedrecovery拒絕 | 單contest提案；R1/DP/非force第三出局擴展DEFER |
| V07 唯一結果 | 同一decision/candidate重送、下一PA後再送、conflictingreceipt | outs/bases/score/order/PA/BF/evidence只變一次；無tokenaward＋candidate雙套；部分ref不一致fail | PA-wideexactly-once GAP |
| V08 Game Record | 同球field/throw/receive/baseTouchfacts、正式PA | 1PA/1BF，Pouts一次，SS A/1B PO真實；NPC E不可記到player，error需scorer | 原record可重用；mapping待驗 |
| V09 Match continuity | commit後productionstep與完整before/after | 同MatchID；after接nextbefore，slot一次；thirdout交原halfowner；不保證下一球SS | 原continuity已證實；新branch待驗 |
| V10 Evaluation | 保存原offenseMoment、provenance；受控完賽 | PA後永久skills/progress不動；NPC無玩家defenselearning；matchend原owner一次growth | 舊五family／growth有證據；sameballref待驗 |
| V11 Replay／Reload | pre-pitchpending、postcommit、post-nextPA reload；重入與注入錯誤 | 不抽第二球、不重記／成長；callbacks不存Save；pendingBIP不得成可儲存中間狀態；有partialcommit即block | Save compatibility **NOT VERIFIED** |
| V12 Compressed compatibility | off-mode及既有固定compressed／SS情境 | 既有AIOutcome能力trace、結果／state／record／RNG全等；無pitchhistory捏造；playerSS原證據不變 | 原T01–T09歷史green；S1後須有限重驗 |

## 13. Rollback／Compatibility Strategy

[I:A08] **預設維持原 producer；S1 用明確 opt-in、每PA只選一個 producer。** 先限current-index VM／記憶體受控垂直驗收，不開新UI或自然比賽rollout。舊playerdefense與compressed繼續原owner；same-ball eligibility外的BIP沿原mapper，清楚標示coarsefallback。

回退點在「新PA尚未生成第一球」：關閉opt-in後後續freshPA走原流程。已生成pitch／已commit PA不得靠回退reroll或改歷史record。已進同球execution卻未閉合，不允許切回舊producer再抽結果；診斷case停下，復原只用先前合法保存checkpoint，不在正式Match上reset／清除既有狀態。

**可否不改Save schema？有受限可行方案，尚未驗證。** `save.js` 目前保存log/Moment任意metadata、OPA.context／officialBallInPlayOutcome，並normalizePA、handoff與activeSituation；但OPA頂層只保留明列欄位。建議不加SaveVersion／migration／第二journal：opt-in／provenance作既有container內的可選版本化metadata，callback在runtime由owner重新建立，receipt由既有已提交refs索引。這是需審查的資料契約擴充，不是已保證的legacySave相容。[B12]

S1只允許 pre-pitch 或 post-commit 穩定邊界Save/reload；從BIP生成、NPC純計算到原ownercommit須同一同步handler結束，沒有await／timer／userconfirm。不能只加「不支援存檔」提示便算通過：必須證明autosave/loader不存在中途可見狀態、pendingpitchcontrolsource與identity在reload保持、對每個可能commit exception的行為有界。候選工作先驗證再寫state；若partialcommit／crash安全必須持久journal或修改Saveowner，**該保證列BLOCKER，另行升級授權**，不得宣稱已達任意指令中斷下交易原子性。[I:A06/A08]

不建立新adapter的部分：直接呼叫既有Physical／Opportunity／Reach／Secure／Throw／Receive／Timing／Force與recordstat functions。值得新增的只有跨owner的identity/provenance驗證與NPC actor組裝。成本不值得的部分：通用全守位Director、全新物理世界、代替所有legacyresolver的巨型adapter、把pureprojection升格成第二selector；均DEFER。[I:A01/A04]

## 14. Dependency-Based Sprint Roadmap

| 階段 | 入口gate | 完成定義 | stop／影響面與風險 |
|---|---|---|---|
| R0 前置契約審查 | 本Blueprint、歷史repair/freeze來源 | 架構review、歷史guard調和決定、S1精確allowlist與資料契約批准 | 未決freeze或Save/receiptauthority即不開工；無Gameplay修改 |
| S1 Same-Ball Execution＋最小真投手來源 | R0＋freshpreflight；V01投手actor/control已可證 | 一個合法detailedplayerPA→同球NPCSSsinglecontest→canonicalPA/record→next/half；V01–V12 boundedscenario過 | callback/pending/NPC/receipt/save任一缺口停；影響OPA/PlateDecision/script，風險高 |
| S2 Capability／Pitching Consistency＋同球覆蓋擴展 | S1closure、身份/投手control不可延後 | 新換投邊界runtime一致、actorprofile/lifecycle；R1force／singlelegsafe/error/recovery先閉合，再視核准scope加其他守位/airborne | repertoire/stamina需要新真來源才做；不一次建立完整球種或manualcatcher；identity/scoring風險高 |
| S3 Connected Match Loop | 多種支援case都具receipt與recovery、Savegate過 | 多PA、不同壘況/局/打序、第三出局與投手runtime串接；同Matchbefore/after一致 | 並行progression／stalecontext／重算即停；仍不讓UI掌結算 |
| S4 Evaluation／Career Evidence | S3＋真完賽/exposure；原growthowner不變 | 受控跨場：actualevidence→thresholdedprogress/skill→下場adapter讀新值→role/opportunity門檻因果；允許無升級 | 不能用scouttext替代永久成長、不能回填歷史capability；Save/Career影響須另授權 |
| S5 Public Mapping／Presentation | mode/receipt/evaluationprovenance穩定，RNG/reload過 | 重審F1/F2：source mapping只公開已執行事實，confirm/skip/replay不settle；再接UI-P2.4B | UI-P3/Director另案；未揭露future/privatefacts或UIresample即停 |

S2不是把S1必需的真activeP／control推遲；只有更廣的換投、能力profile、recovery／branchcoverage延後。新tacticalselectorconsumer需獨立authority切換gate，並非S2自動工作。[I:A05/A12]

## 15. Open Risks／Explicit Non-Goals

| 最大三項風險 | 驗證方法／仍未證實 |
|---|---|
| **同球identity與actor responsibility斷裂**：callback被JSONclone移除、pending後多投一球、NPC走playerwrapper | V03–V05：真publichandlerinstrumentation，Physical一次、同球refs、非SS／換rosternegativecases。新productionhandoff尚未實作。[B02/B05–B07] |
| **PA／GameRecord／Save非交易式重複或不完整**：firstleg未閉合、token再套、E/out重記、exception後重送 | V06–V11：候選validate-before、重入/衝突receipt、兩端reload、partialwritefailureinjection，SS/1B/Pstats對賬；若需schema/journal即升級。不能以單層dedup證完整exactly-once。[B08–B12] |
| **能力與歷史契約失真**：stalepitchercontrol、placeholder、genericstuff冒真能力、freeze放寬掩蓋regression | V01/V02＋R1/R2：同actor單能力counterfactual、runtimeactorrefresh、genericprofile標記、精確delta＋negativeguards。T10仍red，跨場growth→opportunity仍未驗。[B13–B16] |

明確不做：任何Production/Gameplay程式、Fixture/Test/helper、SaveMigration、新物理世界、新MatchEngine、新selectorconsumer、玩家投手完整路由、手動捕手叫球、stamina、Receiver v2、F1/F2、Connected Slice、UI-P3、Match Director、Sprint10B。原UI-P2.4B與歷史Evidence完全保留；本輪沒有Browser／動態驗收。Blueprint中的新檔與API僅提案。

## 16. Architecture Review Gates 與交付

| Gate | 狀態 | 架構審查應決定的具體事項 |
|---|---|---|
| R1 歷史source-freeze調和 | **BLOCKER／PENDING** | 是否核准7行snapshotrepair的精確例外與行為/negativeguard；T10未通過不得抹平 |
| R2 新Gameplay consumer契約 | **BLOCKER／PENDING** | 明列OPA/PlateDecision/script/index的新差異，與新tacticalshadow/Savefreeze邊界分開；批准singleauthority與精確檔scope |
| R3 NPC single-contest與scoring／recovery範圍 | **BLOCKER／PENDING** | 接受S1空壘SS受控vertical範圍及failurestop；若要全面自然事件，要先補同球safe/error/recovery契約 |
| R4 PA receipt／Save compatibility | **VALIDATION BLOCKER** | 批准metadata來源與穩定存檔邊界；V07/V11未過不得rollout；需要schema/journal另授權 |
| R5 能力／單一selector／evidence | **VALIDATION REQUIRED** | S1必含真activePcontrol、livebatter、actualNPC/BR能力，選擇/執行/結果分開，成長留matchend |
| R6 Sprint 1施工授權 | **NOT AUTHORIZED** | 審核R1–R3設計與精確allowlist後，才可另授權boundedimplementation；R4/R5列必須通過的完成gate |

對八個收尾問題的明確回答：

1. **可以保留現有Match State／Settlement**；已有正式owner與continuity，沒有證據要求換引擎。[B01/B08–B11]
2. **有可施工的最小Same-Ball設計**；須修trustedhook／pendingguard並組NPCfoundation，不可直接套playerwrapper。[B02/B04–B07；A04]
3. **S1必重用**：PlateDecision／OPA／既有AIselector／PitchSequencing／Physical／Opportunity／ReachSecure／DecisionThrow/IncomingReceive／Ground／RunnerTiming／Force／thirdout／原offensecommit／GameRecord。[A04–A06]
4. **仍缺**：統一consumed-inputprovenance、PA-widecommitreceipt、actor-boundNPCglue、held-BIP完成邊界；metrictrajectory/stuff/repertoire/stamina無已驗完整來源，後者DEFER。[A02–A08]
5. **Source-freeze阻礙施工**；先精確調和歷史repair，再另審S1有意delta；不能更新全檔baseline通關。[A11]
6. **可提出不改Save schema、保留Career owner的bounded第一slice**；相容性及exception安全尚未驗證，通過V07/V11前不能宣稱無破壞。[A06/A08]
7. **先契約→真投手binding→同球hook→NPC/timing→原owner唯一commit→record/continuity/reload→完賽evidence→擴展→public/UI**。[A12]
8. **建議先處理R1–R3再授權S1**；R4/R5是S1完成與rollout前必過gate，不是本輪自行補程式。[A10/A11]

本輪只新增本Markdown與配套Evidence，完成後停止等待架構審查。結案驗證的逐檔hash差異、Gitstatus／index／refs、protectedmetadata與報告hash見Evidence.integrity。

**Architecture Blueprint＝AUTHORIZED；Architecture Review＝PENDING；Match vNext Sprint 1＝NOT AUTHORIZED；F1／F2＝NOT AUTHORIZED；Connected Match Slice＝NOT AUTHORIZED；UI-P3／Match Director＝NOT STARTED；Sprint10B＝NO；Receiver v2＝DISABLED；Ready for Commit＝NO。**

