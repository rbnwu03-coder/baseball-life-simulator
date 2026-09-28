# Match Authority & Coverage Baseline — M0 Resume After R2

本報告只稽核現有 production；不實作 M1、不修改玩法。正式結果與 93 項 closeout 見下方結果章節及同名 validation JSON。歷史 M0、R1、R2 報告保持原樣。

## 基準與抽樣定義

基準為 `4b60ac35a324bef94fbed7400a4733052c659f03`，main、HEAD = origin/main、ahead/behind 0/0；開始時工作樹乾淨。R1 seed 22430002 的 15 項、R2 seed 22430361 的 21 項確認測試均通過。R2 的既有全回歸結果是歷史證據，本輪沒有重跑或將它冒充新的 full regression。

舊 requested Bench 並非入場權威：舊 harness 使用 `highSchoolFullMatch` 直接入學，`createPlayer → applyHighSchoolDirectStartHistory → enterHighSchool → prepareHighSchoolYearOneMatch` 建立 direct-start flag。`PlayingTimeGameExposure.resolveStartingOpportunity` 對合法非投手的 direct-start 首場設 `appearanceType=start`，所以舊 Bench 標籤被 production 合理覆蓋。參照 script.js:459、1049、9303、9345、9366 與 playing-time-game-exposure.js:221、284。

本輪走正常完整養成：character genesis、合法配點、青少棒敘事選項、capability settlement、學校邀請選擇、canonical roster、角色評估、機會解析、正式入場。沒有直接寫入角色、能力、名冊或 admission。`resolveHighSchoolProvisionalRole` 的 readiness/trust/proof 與 opportunity 的能力、競爭、環境、教練、健康、穩定變異共同影響上場安排；最終 `playerLineupStatus` 在首場入場時決定樣本資格。Bench 後來替補出場仍屬 Bench cohort；整場未上場也不改標為 Starter。

候選範圍上限 440000–445299。依序保留 440000–440099 的 youthChoiceIndex=0 與輪替學校／青棒選項、440100–440299 的選項探索，再由 440300 起以 youthChoiceIndex=2、schoolIndex=(seed-440300)%4、choiceIndex=floor((seed-440300)/4)%3 搜尋。每筆 setup 均保存在 admission evidence。前 1000 個 actual Bench 與前 400 個 actual Starter 入選，無失敗種子替換。這是條件選樣，不是所有角色、守位、選項的無偏人口估計。

Math.random 在建立角色前給定 LCG seed，之後循正式程式消耗；沒有 .82 等固定執行結果、機率覆蓋或修改 production contact 分布。Production 普通守備 handoff 自己產生的 forced-contact sample 是既有模型設計，不能稱為完整 NPC 逐球投打模擬。Observer 僅複製正式事件與呼叫前後狀態，不抽 RNG、不回寫遊戲。

Discovery 曾因工作階段中斷而重建未落盤部分，沿用同一批種子及選項；中斷不是已完成 discovery，也沒有換掉失敗樣本。正式 cohort 只執行一次。

## Authority matrix

| 範圍 | Producer / canonical state owner | Consumer / settlement | Fallback / unsupported / presentation |
|---|---|---|---|
| PA creation | current batter + batting order；ensureHighSchoolOffensivePlateAppearanceState 或普通守備 PA state | OffensivePlateApproach / AIPlateAppearanceOutcome | NPC compressed 無逐球真實事件；不能補造 pitch facts |
| Pitch sequence | OffensivePlateApproach.prepare/resolve；PA pitchHistory、pendingPitch | PlateDecisionFoundation、tactical feedback、recognition/swing execution | 普通守備接觸樣本非完整 pitch sequence |
| Terminal PA | Detailed PA count/contact truth 或 AIPlateAppearanceOutcome.resolveCompressedPlateAppearanceOutcome | applyHighSchoolSimulatedPlateAppearance / canonical defensive settlement | generic BattedBallOutcomeMapping；壓縮結果有正式 PA 但不代表 BBP 物理事實 |
| PA recording / batting PA / pitcher BF | recordHighSchoolMatchSimulationEvent → MatchGameRecord.recordEvent → recordPlateAppearance | GameRecord.playerLines、eventRefs | 展示不得另加 PA；recordEvent identity 去重 |
| Batting order / current batter | advanceHighSchoolMatchBattingOrder；match.battingOrderIndex/currentBatter | 下一 PA producer | compressed 與 detailed 各自完成單次 handoff；R2 禁止 owned ground 再 compressed |
| BBP physical truth | BattedBallPhysical；ordinaryDefensivePlateAppearanceState / offensivePlateAppearanceState | ground/line/fly handoff 或 generic outcome mapper | bunt 使用獨立 fairBallType/placement/pace；不冒充普通 BBP schema |
| Ground route | BattedBallGroundDefense + runner throw timing；groundBallInPlayState / activeSituation | applyInfieldResolutionToHighSchoolMatch、applyRoutineDefensiveResolutionToHighSchoolMatch | 右側 active 2B + access 才有詳細路徑；其餘既有相容 fallback |
| Line route | BattedBallLineDriveDefense catch opportunity/state | applyHighSchoolLineDriveCatchResolution | 淺右側 active 2B + catch window；其餘 fallback |
| Fly route | BattedBallFlyBallDefense assignment/access/catch state | applyHighSchoolFlyBallCatchResolution | 中/右側 medium/deep CF/RF + window；其餘 fallback |
| Fielder | 實際 defender assignment、defensive resolution | defensive event → MatchGameRecord.recordDefensivePlay | legacy player attribution 不等於完整物理野手追蹤；fallback 不虛構 fielder |
| Force / multi-runner | ForceAdvancement；DefensiveRunnerThrowSettlementFoundation | applyHighSchoolDefensiveSettlementFacts 驗證 before 再原子套用 | compressed PA 另有既有 base movement；3B 非強迫跑者不得自動得分 |
| Non-force / DP | runner timing / commitment / ordered retirements | third-out legality → defensive settlement | DP 為同 PA 多個合法出局；FC 相容 result 不等於完整官方 FC 記錄模型 |
| Tag-up | RunnerTagUpDecision / catch context | settleAndCloseHighSchoolRunnerTagUpSituation | 獨立 runner event，不再產生 PA |
| Third out / run | resolveHighSchoolThirdOutIntegrity；ordered retirements、scoring attempts | legalScoringRunnerIds/basesAfter → scoreHighSchoolMatchRunner | unresolved timing 不可 commit；球賽完成不能取代逐事件 legality check |
| Inning / outs / bases / score | match state；apply settlement / advanceHighSchoolMatchAfterHalfInning | playback/simulation state machine、GameRecord | 顯示不是第二個 owner |
| GameRecord / batting / pitching | MatchGameRecord.recordEvent；finalizeHighSchoolGameRecord | ledger totals、playerLines、inningLines、eventRefs | PA owns settled out delta；獨立 runner/catcher event owns後續出局 |
| Scoreboard | GameRecord 為全場記錄；getHighSchoolVisibleScoreboardProjection 由 simulationLog 可見 prefix 重建 | getHighSchoolMatchPresentation、renderHighSchoolLineScore | presentation cursor projection，不能以全場未揭露 totals 冒充 live score |

主要 dispatch 證據：script.js:4343、5055、5296、5407、6087、6495、6559、6646、6706、6792、6835、10332、10368、11047、11328、11645、12306、12435；match-game-record.js: recordPlateAppearance、recordRun、recordDefensivePlay、attributePitcherOuts、recordEvent、getIntegrityIssues。

## Lifecycle 定義與觀測方法

| Lifecycle | 結構 / player、NPC | Transition / settlement owner | Closure / fallback |
|---|---|---|---|
| plateDecision | player 詳細打席每球；NPC compressed 不冒充此類 | prepareHighSchoolPlateDecision → resolveHighSchoolPlateDecisionPitch → PlateDecisionFoundation | 每球 closed summary；未完 PA 立即建立下一球；PA terminal 才正式記帳 |
| groundBallDefensiveDecision | 玩家呈現決策或 automatic ground；打者通常 NPC | create/begin/recordGroundBallSituationResolution | settleAndCloseGroundBallSituation；resolved/unapplied 必須先恢復合法 settlement，禁止 compressed 搶結算 |
| runnerTagUpDecision | catch 後合法 runner 決策 | create/begin/settleAndCloseHighSchoolRunnerTagUpSituation | 單次 runner settlement/closure，不再記 PA |
| automatic ground | 同 canonical ground lifecycle、未 admit 玩家選擇 | beginAutomaticGroundBallSituationExecution | resolved → applied → closed；density suppression 不改 ownership |
| presentation | activeSituation presented + presentedEventCursor | 正式 choice dispatcher / playback | 畫面推進與 simulation cursor 分開 |
| compressed PA | 是 production route，非虛構 MatchSituation 類型 | resolveSimulatedHighSchoolPlateAppearance | 單次結果、PA record、batting-order advance |

數量以 `(situationId, lifecycleState, groundApplied)` 去重；函式呼叫另計，兩者不可相加當獨立 plays。before/after observer 看不到函式內瞬時狀態時，不宣稱該狀態不存在；成功 closure 呼叫補充直接邊界證據。`groundApplied` 對非 ground 類型不是該類 settlement 狀態。同一打席公開 momentID 可跨球沿用，pitch lifecycle ID 才逐球更新，不能把合法下一球操作誤判為 stale duplicate。

## Structural coverage 與 fallback 解讀

普通 BBP 矩陣共有 21 格：ground 3 directions（depth 不適用）、line/fly 各 3 directions × 3 depths。其中只有 6 格具詳細路徑可能性：ground rightSide、line rightSide/shallow、fly middle/rightSide × medium/deep。仍須滿足守位、access、catch window，不能視為保證 canonical。

其餘 15 格不支援現有詳細守備路徑，但可由既有相容 fallback 完成；`UNSUPPORTED=0` 的 terminal 分類僅代表沒有懸空未處理 BBP，絕不代表全方向詳細守備都已實作。表中每個零觀測格仍保留，零不等於結構不可能。

Fallback census 保留 type + 實際可觀測 reason + source route。`existingSyntheticDefensiveContext` 等是正式儲存的 fallback authority，不將缺失的細部 access 原因自行猜成特定原因。Player 詳細打席使用 generic mapper 的路徑明列 `playerDetailedPAUsesGenericBBPMapper`。這些 fallback 是現有相容設計；詳細物理野手擴充屬 M4 候選而非本轮修復。Bunt 單獨列 groundBunt/popBunt。

## Pitch / catcher / fatigue / evaluation

Pitch type、velocity、movement、location 的正式 physical profile 接入 recognition 與 swing timing（offensive-plate-approach.js:89、251、319），屬 production connected。Tactical recommendation 經 actualPitchClass 影響選球分布與 quality/control realization，但 target 幾何座標並未成為完整 location realization；屬 partially connected。Sequence feedback 記錄 actual class/location、batter response、late-swing observable，影響後續意圖；不可稱完全沒有 physical sequence，也不可稱完整物理投球歷史模型。

捕手能力在 script.js:9813 的 controlScore/throwScore 影響既有 hold、block、throw route，透過 applyCatcherResolutionToHighSchoolMatch 正式結算。故捕手整體是 partially connected，非只有 schema；但 tactical catcher recommendation 並未證明接入個別捕手能力，framing/PB prevention 亦未證明。場內 pitch count/fatigue 未見接入 audited pitch/PA resolution；career body fatigue 的 readiness 影響不等於投手場內疲勞。本輪將場內疲勞列 not proven，不以 BF 欄位存在冒充 fatigue 模型。

結算將 actual participation、GameExposure、MatchExperienceDevelopment、competition evidence 送入角色／機會重評；參與才更新 season/recent performance、exposure、scoutEvaluation。script.js:11707、11854、11923 證明 production connected 的彙整證據鏈；不是完整逐球投捕表現評分。coach/scout/role 的 per-pitch 細節僅 partially connected。

SB/CS 在 MatchGameRecord 有正式 ingestion schema，audited production dispatcher 未找到對應生成器，分類 schema only；pickoff/WP/PB 沒有證明 generator + canonical settlement，保守列 unknown / not yet proven。Error 有生成與記錄；FC 有守備 runner-out/相容 PA 路徑但官方獨立分類不完整。零觀測不作不存在證據。

## Save/reload 與中立性

16 項 focused audit tests 通過。440000（Starter）、440201（Bench）比較 observer OFF/ON、ON repeat、反向執行順序，整個 final match 深比較一致，包含 GameRecord、lines、scores、lifecycle、simulation/presentation cursors。Observer 不消耗 RNG 的結論也由 observer source review 支持；不宣稱所有種子都做成對重跑。

正式存讀檔測試涵蓋 presented plateDecision、自然捕獲的 ground resolved/unapplied，以及已完成 ground play：match/lifecycle identity、batter、outs、score、runners、pending decision、GameRecord 一致。重載後 pending ground 恰好增加一個 PA，重送同 execution/recovery 不改 match。此 targeted save fixture 只重載自然捕獲狀態，沒有用來取得 cohort admission。沒有把未測的每一種 lifecycle save boundary 宣稱全覆蓋。

## 執行與證據

新增 harness：`tests/match-m0-after-r2-admission-context.cjs`、`match-m0-after-r2-cohort.cjs`、`match-m0-after-r2-coverage.cjs`、`match-m0-after-r2-census.cjs`、`match-m0-after-r2-audit-test.js`。

命令依序為 admission discovery、focused audit tests/pilot、formal cohort、read-only census。Cohort 拒絕覆寫既有 raw evidence，遇到首個失敗立即停下，不替換種子。原始資料位於 `%TEMP%/m0-after-r2-4b60ac3/`，validation JSON 記錄 digest、每筆 admission 與每場結果的證據位置。原始資料不可當作長期 Git 歷史保存的替代品；本輪沒有 commit。

## 正式結果：PASS_WITH_WARNINGS

1,400/1,400 完成（actual Bench 1,000、Starter 400），0 exception、0 correctness failure。PA = batting PA = pitcher BF = 101,105。BBP 2,934 = canonical 478 + fallback 2,456。

### BBP / structural census

| Type | Total | Canonical | Fallback | Unsettled unsupported |
| --- | --- | --- | --- | --- |
| flyBall | 537 | 285 | 252 | 0 |
| groundBall | 520 | 83 | 437 | 0 |
| lineDrive | 594 | 21 | 573 | 0 |
| groundBunt | 972 | 89 | 883 | 0 |
| popBunt | 311 | 0 | 311 | 0 |

| Type | Direction | Depth | Detailed potential | Observed | Canonical | Fallback |
| --- | --- | --- | --- | --- | --- | --- |
| groundBall | leftSide | N/A | No | 175 | 0 | 175 |
| groundBall | middle | N/A | No | 152 | 0 | 152 |
| groundBall | rightSide | N/A | Conditional | 193 | 83 | 110 |
| lineDrive | leftSide | shallow | No | 46 | 0 | 46 |
| lineDrive | leftSide | medium | No | 160 | 0 | 160 |
| lineDrive | leftSide | deep | No | 0 | 0 | 0 |
| lineDrive | middle | shallow | No | 55 | 0 | 55 |
| lineDrive | middle | medium | No | 133 | 0 | 133 |
| lineDrive | middle | deep | No | 3 | 0 | 3 |
| lineDrive | rightSide | shallow | Conditional | 34 | 21 | 13 |
| lineDrive | rightSide | medium | No | 161 | 0 | 161 |
| lineDrive | rightSide | deep | No | 2 | 0 | 2 |
| flyBall | leftSide | shallow | No | 45 | 0 | 45 |
| flyBall | leftSide | medium | No | 111 | 0 | 111 |
| flyBall | leftSide | deep | No | 0 | 0 | 0 |
| flyBall | middle | shallow | No | 56 | 0 | 56 |
| flyBall | middle | medium | Conditional | 163 | 163 | 0 |
| flyBall | middle | deep | Conditional | 0 | 0 | 0 |
| flyBall | rightSide | shallow | No | 40 | 0 | 40 |
| flyBall | rightSide | medium | Conditional | 120 | 120 | 0 |
| flyBall | rightSide | deep | Conditional | 2 | 2 | 0 |

### Fallback census

下表逐 source route 列出全部 fallback。ordinary 指普通守備 PA physical truth，bunt 指 bunt pitchHistory physical truth。保留原欄位值；`canonicalReachArrival` 與 `supported2BVertical` 是 access/support 標記，不能直接稱為 fallback 原因，故另列已觀測的實際路徑說明。

| Type | Observed field | Reason | Count | Source / route | Intent / canonical support |
| --- | --- | --- | --- | --- | --- |
| groundBall | existingSyntheticDefensiveContext | existingSyntheticDefensiveContext | 255 | ordinary / resolveSimulatedHighSchoolPlateAppearance | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | leftSideNoPlayerBallMagnet | leftSideNoPlayerBallMagnet | 103 | ordinary / resolveSimulatedHighSchoolPlateAppearance | existing explicit compatibility fallback; conditional subset; see structural matrix |
| groundBunt | unsupportedPlacementFallback | unsupportedPlacementFallback | 768 | bunt / resolveSimulatedHighSchoolPlateAppearance | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | unsupportedLineDriveDepth | unsupportedLineDriveDepth | 150 | ordinary / resolveSimulatedHighSchoolPlateAppearance | existing explicit compatibility fallback; conditional subset; see structural matrix |
| flyBall | unsupportedLeftSideAssignment | unsupportedLeftSideAssignment | 77 | ordinary / resolveSimulatedHighSchoolPlateAppearance | existing explicit compatibility fallback; conditional subset; see structural matrix |
| popBunt | unsupportedPopBuntFallback | unsupportedPopBuntFallback | 311 | bunt / resolveSimulatedHighSchoolPlateAppearance | existing explicit compatibility fallback; no detailed pop-bunt route |
| groundBunt | supported2BVertical | supportedBuntHandoffNotConsumedByDetailedPASettlement | 115 | bunt / resolveSimulatedHighSchoolPlateAppearance | existing compatibility dispatch observed; finer reason not persisted; conditional subset; see structural matrix |
| flyBall | unsupportedFlyBallDepth | unsupportedFlyBallDepth | 56 | ordinary / resolveSimulatedHighSchoolPlateAppearance | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | unsupportedScope | unsupportedScope | 41 | ordinary / resolveSimulatedHighSchoolPlateAppearance | existing explicit compatibility fallback; conditional subset; see structural matrix |
| groundBall | existingSyntheticDefensiveContext | existingSyntheticDefensiveContext | 114 | ordinary / applyRoutineDefensiveResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | unsupportedLineDriveDepth | unsupportedLineDriveDepth | 101 | ordinary / applyRoutineDefensiveResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | leftSideNoPlayerBallMagnet | leftSideNoPlayerBallMagnet | 74 | ordinary / applyRoutineDefensiveResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| flyBall | unsupportedFlyBallDepth | unsupportedFlyBallDepth | 26 | ordinary / applyRoutineDefensiveResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| groundBall | existingSyntheticDefensiveContext | existingSyntheticDefensiveContext | 42 | ordinary / applyInfieldResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | unsupportedLineDriveDepth | unsupportedLineDriveDepth | 31 | ordinary / applyInfieldResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| flyBall | unsupportedLeftSideAssignment | unsupportedLeftSideAssignment | 49 | ordinary / applyRoutineDefensiveResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | unsupportedScope | unsupportedScope | 4 | ordinary / applyInfieldResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | leftSideNoPlayerBallMagnet | leftSideNoPlayerBallMagnet | 21 | ordinary / applyInfieldResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | unsupportedScope | unsupportedScope | 22 | ordinary / applyRoutineDefensiveResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| flyBall | unsupportedLeftSideAssignment | unsupportedLeftSideAssignment | 14 | ordinary / applyInfieldResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| flyBall | unsupportedFlyBallDepth | unsupportedFlyBallDepth | 4 | ordinary / applyInfieldResolutionToHighSchoolMatch | existing explicit compatibility fallback; conditional subset; see structural matrix |
| flyBall | unsupportedFlyBallDepth | unsupportedFlyBallDepth | 10 | ordinary / advanceHighSchoolYearOneAfterMomentTwo legacy branch (script.js:11576) | existing explicit compatibility fallback; conditional subset; see structural matrix |
| groundBall | canonicalReachArrival | legacyPositionDecisionSelectedWithoutGroundLifecycle | 12 | ordinary / advanceHighSchoolYearOneAfterMomentTwo legacy branch (script.js:11576) | existing compatibility dispatch observed; finer reason not persisted; conditional subset; see structural matrix |
| groundBall | existingSyntheticDefensiveContext | existingSyntheticDefensiveContext | 14 | ordinary / advanceHighSchoolYearOneAfterMomentTwo legacy branch (script.js:11576) | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | unsupportedLineDriveDepth | unsupportedLineDriveDepth | 17 | ordinary / advanceHighSchoolYearOneAfterMomentTwo legacy branch (script.js:11576) | existing explicit compatibility fallback; conditional subset; see structural matrix |
| flyBall | unsupportedLeftSideAssignment | unsupportedLeftSideAssignment | 16 | ordinary / advanceHighSchoolYearOneAfterMomentTwo legacy branch (script.js:11576) | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | leftSideNoPlayerBallMagnet | leftSideNoPlayerBallMagnet | 8 | ordinary / advanceHighSchoolYearOneAfterMomentTwo legacy branch (script.js:11576) | existing explicit compatibility fallback; conditional subset; see structural matrix |
| lineDrive | unsupportedScope | unsupportedScope | 1 | ordinary / advanceHighSchoolYearOneAfterMomentTwo legacy branch (script.js:11576) | existing explicit compatibility fallback; conditional subset; see structural matrix |

每列均為擴充或 admission/dispatch 分析候選；不是本輪 production repair。

### Lifecycle counts

| Observed state | Count |
| --- | --- |
| plateDecision\|presented\|groundNotApplied | 8102 |
| groundBallDefensiveDecision\|admitted\|groundNotApplied | 68 |
| automaticGroundAdmission | 68 |
| groundBallDefensiveDecision\|executing\|groundNotApplied | 83 |
| groundBallDefensiveDecision\|resolved\|groundNotApplied | 83 |
| groundBallDefensiveDecision\|resolved\|groundApplied | 83 |
| plateDecision\|presented\|groundApplied | 67 |
| groundBallDefensiveDecision\|presented\|groundNotApplied | 15 |

| Function | Calls | Truthy return (not unique play count) |
| --- | --- | --- |
| prepareHighSchoolPlateDecision | 8169 | 8169 |
| resolveHighSchoolPlateDecisionPitch | 8169 | 8169 |
| createHighSchoolRunnerTagUpSituation | 285 | 56 |
| createGroundBallMatchSituation | 1549 | 83 |
| beginGroundBallSituationDecision | 1139 | 30 |
| recordGroundBallSituationResolution | 2199 | 166 |
| beginAutomaticGroundBallSituationExecution | 1084 | 136 |
| settleAndCloseGroundBallSituation | 674 | 83 |

Plate presented 總數為 8,169；ground admitted automatic 68、presented player 15，合計 83，均觀測 resolved/unapplied 與 applied。Tag-up 56 次建立後直接 deferred/closed（script.js:5520），未成為 active presented player situation；不可把 active-boundary 計數 0 說成從未建立過。

### Warnings / scope limits

- Conditional admission cohort, not a representative population estimate: 1000 Bench are catchers; Starter has 200 catchers, 112 infielders and 88 outfielders.
- First legal choice policy produced 8169 takes and no detailed player BBP; compressed player hits are not physical-contact coverage.
- 15 of 21 ordinary BBP cells lack detailed support; zero observations do not imply structural impossibility.
- 245 Bench games had no player entry; 755 became substitutes. Membership remains actual admission.
- 12 supported ground handoffs used the legacy position decision branch; 115 supported bunt handoffs were not consumed by detailed PA settlement. Finer admission reasons are not persisted; no accounting failure observed.
- 56 tag-up construction calls returned a deferred/closed candidate, but no active player tag-up settlement was observed; exact deferred reason split was not captured by the passive boundary observer.
- DP, error, official FC, SB/CS, pickoff, WP/PB were not observed. Structural/code evidence is reported separately.
- In-match pitcher fatigue, full catcher framing/PB prevention, complete geometric target realization and full physical sequence remain unproven/partial.
- Raw formal match/event evidence remains outside Git in the stated temporary directory. Complete admissions, aggregate census and per-game accounting are preserved in the new report artifacts.

### Required 93-item closeout

| # | Item | Result |
| --- | --- | --- |
| 1 | baseline | 4b60ac35a324bef94fbed7400a4733052c659f03; main; HEAD=origin/main; ahead/behind 0/0; clean at start |
| 2 | historical R1 confirmation | PASS: seed 22430002; 15/15 focused repair checks; PA=battingPA=BF=64 |
| 3 | historical R2 confirmation | PASS: seed 22430361; 21/21 focused repair checks; completed 235 steps; PA=battingPA=BF=122 |
| 4 | admission authority | Normal genesis → capability → selected-school roster/evaluation → PlayingTimeGameExposure → plannedUsage → actual playerLineupStatus; see authority section |
| 5 | admission discovery counts | 4306 candidates; Bench 1000; Starter 3306; other/unusable 0; failures 0 |
| 6 | actual Bench proof | 1000 independently admitted Bench, no post-hoc role writes |
| 7 | actual Starter proof | 3306 independently admitted Starter; first 400 selected |
| 8 | pilot results | 40/40 completed (20 actual Bench + 20 actual Starter); failures 0; observer/repeat witnesses PASS |
| 9 | formal cohort size | 1400 attempted / 1400 completed |
| 10 | actual role distribution | Admission Bench 1000 / Starter 400; final Bench 245 / substitute 755 / Starter 400 |
| 11 | candidate seed count | 4306; actual examined interval 440000–444305; bounded ceiling 445299 |
| 12 | completed / exception count | 1400 completed; 0 exceptions; 0 progression blockers |
| 13 | authority matrix | See Authority matrix above; actual production dispatch and owners distinguished from presentation |
| 14 | lifecycle matrix | See lifecycle table and measured lifecycle counts below; transient states and deferred tag-up not overstated |
| 15 | Player PA route | Detailed player PA 2221; compressed player PA 412; detailed contact/BBP 0 under take policy |
| 16 | NPC PA route | NPC compressed 97019; ordinary physical defense 969; bunt count terminal 395; bunt/synthetic defense 89 |
| 17 | PA totals | 101105 |
| 18 | Player/NPC counts | Player 2633 / NPC 98472 |
| 19 | non-BBP coverage | {"compressed":{"strikeout":8471,"walk":11054},"playerDetailed":{"strikeout":2221}} |
| 20 | BBP total | 2934 |
| 21 | Ground counts | {"total":520,"CANONICAL":83,"FALLBACK":437,"UNSUPPORTED":0} |
| 22 | Line counts | {"total":594,"CANONICAL":21,"FALLBACK":573,"UNSUPPORTED":0} |
| 23 | Fly counts | {"total":537,"CANONICAL":285,"FALLBACK":252,"UNSUPPORTED":0} |
| 24 | direction distribution | {"rightSide":552,"middle":562,"leftSide":537,"firstBaseSide":237,"pitcherArea":234,"thirdBaseSide":270,"NOT_APPLICABLE":311,"secondBaseSide":231} |
| 25 | depth distribution | {"medium":848,"NOT_APPLICABLE":1803,"shallow":276,"deep":7} |
| 26 | strength distribution | {"firm":689,"moderate":770,"hard":283,"soft":274,"weak":156,"dead":235,"controlled":216,"NOT_APPLICABLE":311} |
| 27 | structural BBP matrix | 21 cells, 6 conditional detailed-support cells; see matrix |
| 28 | observed BBP matrix | All 21 cells retained below, including zeros |
| 29 | Ground canonical/fallback/unsupported | {"total":520,"CANONICAL":83,"FALLBACK":437,"UNSUPPORTED":0} |
| 30 | Line canonical/fallback/unsupported | {"total":594,"CANONICAL":21,"FALLBACK":573,"UNSUPPORTED":0} |
| 31 | Fly canonical/fallback/unsupported | {"total":537,"CANONICAL":285,"FALLBACK":252,"UNSUPPORTED":0} |
| 32 | fallback reason census | 2456 fallbacks; every row includes observed reason/authority, normalized explanation, source route, intent qualification and support; see census |
| 33 | unsupported cells | 15 cells without detailed support explicitly flagged No in matrix; none left without terminal fallback |
| 34 | fielder attribution | Canonical ground+line player 104; supported bunt player 89; fly assigned defender 285; fallback 2456 has no physical fielder claim |
| 35 | runner settlement | 674 canonical defensive settlement observations; no detected duplicate identity, lost runner, impossible bases/outs or illegal scoring |
| 36 | force route | 138 force contexts with forced movement; compressed walk forced-advancement cases 1873 |
| 37 | multi-runner route | 34 multiple-existing-runner contexts; 24 moved more than one existing runner |
| 38 | DP | Implemented but unobserved: 0 PA with >=2 out delta; selected policy does not exercise challenge routes |
| 39 | tag-up | Implemented but active player settlement unobserved: 0; 285 construction attempts, 56 returned deferred/closed candidate |
| 40 | third-out integrity | 18793 PA third outs; no detected legality divergence; independent event copies are not added as extra outs |
| 41 | run legality | 15447 legal scoring IDs = recorded runs; invalidated runs 0; no illegal-scoring mismatch. Timing-play rare combinations remain unobserved |
| 42 | SB | schema only in audited production route; observed 0 |
| 43 | CS | schema only in audited production route; observed 0 |
| 44 | pickoff | unknown / not yet proven; observed 0 |
| 45 | WP | unknown / not yet proven; observed 0 |
| 46 | PB | unknown / not yet proven; observed 0 |
| 47 | errors | implemented but unobserved; team E=0, checks retain E reconciliation |
| 48 | FC | implemented but unobserved as explicit FC; runner-out support partial, no complete official FC category proven |
| 49 | hit attribution | 33493 hits; each completed record passed player-hit versus team-hit integrity |
| 50 | GameRecord settlement | 1400 completed GameRecords, score/inning/PA refs checked; no duplicate event IDs |
| 51 | batting-line attribution | Batting PA 101105; MatchGameRecord.recordPlateAppearance owns attribution |
| 52 | pitcher-line attribution | Pitcher BF 101105; PA/independent-runner out ownership traced; integrity checks PASS |
| 53 | scoreboard ownership | GameRecord full ledger; live scoreboard from visible simulationLog prefix; source-reviewed, no claim of full UI screenshot validation |
| 54 | save/reload | ["plateDecision presented","ground resolved unapplied","completed ground play"] |
| 55 | save idempotency | Presented pitch repeat reload and resolved ground duplicate delivery PASS; exact match/ledger equality |
| 56 | R1 identity integrity | Historical witness PASS; formal 15 presented ground choices all accepted, 0 identity mismatch |
| 57 | R2 settlement ownership integrity | Historical witness PASS; 83 observed ground resolved/unapplied → applied boundaries and 83 successful closures; no competing settlement detected |
| 58 | current choice rejection count | 0 |
| 59 | valid-current stale rejection count | 0 observed; no stale-current exception or rejection; historical stale-input rejection remains required |
| 60 | pitch truth | production connected: pitch type/location/velocity/movement/result; 8169 observed detailed player pitches |
| 61 | tactical target connection | partially connected: tactical target → intended/actual class; geometric target → realized location incomplete |
| 62 | pitch sequence | production connected detailed player + bunt count paths; NPC compressed has no fabricated pitch sequence |
| 63 | physical sequence | partially connected: physical recognition/timing and tactical observed-response feedback; complete physical-history model unproven |
| 64 | catcher ability | partially connected: actual legacy catcher control/throw capabilities; framing and individual tactical-catcher effect not proven |
| 65 | pitcher fatigue | not proven for in-match pitch/PA fatigue; career readiness fatigue is distinct |
| 66 | evaluation connection | production connected aggregate participation/evidence → coach/competition/role/opportunity/scout; per-pitch evaluation partial |
| 67 | schema-only capabilities | SB/CS record ingestion present without proven production generator; no schema-as-behavior claims |
| 68 | population distribution | {"bench\|捕手":1000,"starter\|內野手":112,"starter\|外野手":88,"starter\|捕手":200} |
| 69 | outcome baseline | {"outcomes":{"homeWin":1085,"awayWin":315},"innings":{"7":1303,"8":67,"9":20,"10":8,"11":2},"runs":15447,"hits":33493,"errors":0} |
| 70 | observer neutrality | PASS for 440000 and 440201: entire match OFF/ON deep equality |
| 71 | RNG neutrality | PASS: passive observer source contains no RNG draws; fixed creation RNG is shared by OFF/ON |
| 72 | repeat determinism | PASS: same-seed ON repeat |
| 73 | batch-order neutrality | PASS: reverse execution order and aggregate order comparisons |
| 74 | PA accounting | 101105 = batting PA 101105 = pitcher BF 101105; 0 per-game mismatches |
| 75 | BBP accounting | 2934 = ordinary 1651 + bunt 1283 = canonical 478 + fallback 2456 |
| 76 | fallback accounting | 2456 = summed reason counts = summed type fallbacks = detailed census rows |
| 77 | GameRecord accounting | All 1400 per-game ledger/state/PA-reference checks PASS |
| 78 | audit tests | 16/16 focused audit tests; formal census assertions PASS |
| 79 | syntax / audit source validation | 5 new JS/CJS files syntax PASS; source/whitespace validation PASS; no broad full-regression rerun |
| 80 | production diff | 0 tracked changes; gameplay production diff 0; historical R1/R2/M0 files unchanged |
| 81 | formal 1,400 status | PASS — 1400/1400 actual target-population games |
| 82 | warnings | See explicit warnings; no warning is an allowed correctness failure |
| 83 | failures | 0 production/accounting/progression/neutrality failures |
| 84 | M0 final status | PASS_WITH_WARNINGS |
| 85 | M1 readiness | M0 evidence supports scoping M1 target/location work after manual acceptance; M1 not started |
| 86 | M2 readiness | M2 needs respect for already-connected physical recognition/feedback; improve history only after separate scope approval |
| 87 | M3 readiness | M3 catcher/fatigue/per-pitch evaluation gaps characterized; no broad readiness/full-implementation claim |
| 88 | M4 expansion candidates | Census complete: prioritize unsupported groundBunt placements 768, line fallback 573, ground fallback 437, popBunt 311, fly fallback 252; audit supported-but-unused handoffs separately. Conditional counts are not population prevalence |
| 89 | git diff --check | PASS; untracked text whitespace separately checked |
| 90 | git status | Only 5 new audit sources + report MD + validation JSON + admissions JSON.GZ; no tracked modifications |
| 91 | stashes | ["0daf1e954f74ddb45efe620107970567dec6fffd","8cc34a930df052067d1bad3ea798fe0b9d2ae036"] |
| 92 | commit / push status | No commit, push, stash drop or M1 |
| 93 | stop-condition evaluation | A/B/C/D not triggered; manual acceptance pending |

### Evidence files

- `docs/match-authority-coverage-after-r2-validation.json`: full per-game accounting, aggregate census, exact selected seeds/setups, pilot and neutrality checks, evidence SHA-256.
- `docs/match-authority-coverage-after-r2-admissions.json.gz`: all 4,306 attempted admission rows, relevant capabilities/evaluation/roster/opportunity context.
- Raw observed full matches: `C:\Users\User\AppData\Local\Temp\m0-after-r2-4b60ac3\formal-games.jsonl.gz`; retained, not committed.

五個新 audit source 通過語法檢查；tracked git diff 為空，`git diff --check` 通過，新增文字另做 whitespace 檢查。工作樹只有本輪 8 個未追蹤檔案。兩筆 stash 未變更。未 commit、push、drop stash、開始 M1；等待人工驗收。

可重現性補充：正式 cohort 完成後，仅整理 discovery 的初始選項重建路徑，使暫存檔不存在時仍可从 440000 開始。與全部 4,306 筆已記錄 setup 比較，差異 0；不改 gameplay、observer 或正式樣本。validation 同時保留 formal-run source 指紋與最終 source 指紋。
