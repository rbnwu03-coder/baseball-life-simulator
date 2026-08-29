# Defensive Outcome Cause Explainability Foundation v1

## 1. Problem Statement

既有二壘手垂直切片已能產生合法路線、執行結果、跑者變化、`primaryCause`、`secondaryCause` 與 `responsibleActor`，但玩家畫面主要顯示選擇、泛用執行句、結果與長原因句，缺少明確的「判斷／執行／結果／主因」責任分層。教練回饋也只處理少數 generic branch，無法穩定區分玩家失誤、隊友失誤、時間窗與合理重判。

本 Foundation 新增純讀取的 `defensiveOutcomeExplanation`。它不建立第二套 safe/out/run truth，不重算 runner、score、outs、force、readiness、development 或 evaluation。

## 2. Scope

只涵蓋既有 2B canonical routes：

- `secureFirstBaseOut`
- `initiate463`
- `coverSecondFor643`
- `attackLeadRunnerThird`
- `preventRunHome`
- `homeForceOut`

其他守位與 catcher route 未納入本輪 explainability 擴張；其既有行為只做 regression。

## 3. Causality Pipeline / Ownership

| 層 | 正式 owner |
| --- | --- |
| Situation | `buildInfieldMeaningfulMoment()`；`match.defensiveSituation` |
| Role | `resolveDefensivePlayResponsibility()`；`situation.responsibility.playerRole` |
| Legal routes | `generateInfieldLegalChoices()`；`SECOND_BASE_ROUTE_DEFINITIONS` |
| Availability | `deriveSecondBaseExecutionWindows()`、`evaluateDefensiveRouteAvailability()`；`choice.availability` |
| Readiness | `evaluateExecutionReadiness()`；`choice.readiness` |
| Selected route | `getInfieldDecisionChoice()`、`chooseHighSchoolYearOneMatchMoment()` |
| Execution | `resolveInfieldDecision()` → `resolveSecondBaseInitiatedRoute()` / `resolveSecondBaseCoverage643()`；`playerLeg`、`teammateLeg`、`timingResolution` |
| Reassessment | `reassessDefensiveRoutesAfterExecutionChange()`；`resolution.reassessment`、`initialRoute`、`activeRoute`、`fallbackRoute` |
| Outcome | `buildInfieldRunnerFacts()`、`finalizeHighSchoolDefensiveThirdOut()`、`applyInfieldResolutionToHighSchoolMatch()` |
| Attribution | resolver 的 `primaryCause` / `secondaryCause` / `responsibleActor`；`createDefensiveOutcomeExplanation()` 只做可讀分類 |
| Presentation | `presentInfieldDecision()`、`renderYouthSeasonOutcome()` |
| Coach feedback | `getDefensiveCoachFeedback()` → `completedMoment.coachFeedback` / `match.coachReaction` |

`sourceEvidenceIds` 保存等價 evidence pointer，讓說明可追溯至 choice / resolution，而不是成為新的結果 owner。

## 4. Decision Quality Contract

正式 invariant：

```text
Decision Quality != Execution Quality != Outcome
Availability != Decision Quality
Readiness != Decision Quality
```

本輪沿用 production 已有分類：`strong`、`reasonable`、`aggressive`、`conservative`、`routine`。Explainability 從 `choice.advisable` / `resolution.decisionQuality` 讀取判斷品質，不讀 `resultCode`、`outsCreated` 或比分，因此 safe/out 無法反向改寫判斷。`poor` 尚無既有 producer，本輪不偽造 production route。

## 5. Execution Stage Model

| Route | 玩家角色與實際 evidence chain |
| --- | --- |
| secureFirstBaseOut | primary fielder：reach → control → transfer → firstThrow → receiver → route timing |
| initiate463 | initiator：reach → control → transfer → firstThrow → SS receive/pivot/second throw → 1B receive → second-out timing |
| coverSecondFor643 | coverPivot：coverage → receive → force → pivot → secondThrow；SS upstream throw、1B receive 為 teammate leg |
| attackLeadRunnerThird | initiator：reach → control → transfer → throw third → 3B receiver → lead-runner timing |
| preventRunHome | initiator：reach → control → transfer → throw home → catcher tag → runner timing |
| homeForceOut | initiator：reach → control → transfer → throw home → catcher force receive → force timing |

不同 route 沿用自己的 stage，不用一個假的共通 success flag 取代 canonical evidence。

## 6. Cause Taxonomy and Actors

Explainability v1 的最小 cause taxonomy：

```text
fieldingControl
transfer
throwAccuracy
releaseTiming
receiverExecution
runnerTiming
windowExpired
routeTradeoff
forceState
sharedExecution
unknown
```

`primaryCause` 必填；`secondaryCause` 無獨立證據或與 primary 重複時為 `null`。來源的細節 cause 仍保存於 `sourcePrimaryCause` / `sourceSecondaryCause`。

Actor taxonomy：

```text
player
teammate
runner
systemTiming
shared
unknown
```

`timingWindow` 轉成 `systemTiming`；成功且包含隊友鏈的完整執行標為 `shared`；未知來源使用 no-evidence guard，不猜測玩家責任。

## 7. Reassessment Contract

`initialRoute` 永遠保留原選擇，`activeRoute` / `fallbackRoute` 記錄 execution change 後的有效路線。Explainability 只讀 `resolution.reassessment`，把合法 route change 說成「重新讀取壘況並改抓仍有效的出局」，不把 adaptation 標為原判斷錯誤。

## 8. Player-facing Presentation

Outcome card 支援四個明確責任層：

1. 你的判斷：路線、意圖、既有 decision quality 與 tradeoff。
2. 你的執行：只說 canonical stage evidence。
3. 發生的結果：沿用 `presentInfieldDecision()` 的 baseball result。
4. 主要原因：最短 truthful attribution。

本壘 route 明確區分 tag 與滿壘 force；`coverSecondFor643` 不會把玩家寫成 6-4-3 的 primary decision owner。玩家文字不顯示 route id、cause enum、能力數值、係數或百分比。

## 9. Coach Feedback Boundary

Coach feedback 只讀 decision / execution / cause / actor：

- 玩家執行：指出具證據的 control、transfer、throw 或 release 問題。
- 隊友失敗：確認玩家責任環節完成，不責怪玩家。
- timing / runner：說明窗口狹窄，不虛構壞傳球。
- risky success：保留 route 風險，不因出局自動改成 sound。
- reassessment：肯定合法適應，不產生 trust、lineup、playing time、substitution 或 development consequence。

## 10. Save / Reload / Determinism

`defensiveOutcomeExplanation` 隨既有 `lastDefensiveResolution` 與 `completedMoments` 深拷貝保存。Pending decision 仍由 canonical situation 重建相同 choice / availability / readiness。建模函式沒有 random source，也不讀寫 `simulationCursor`、`presentedEventCursor`、score、outs、runners 或 development。

## 11. Validation Plan

- Focused fixtures：至少 25 個 contract case，另含 UI settlement / render assertions。
- Structural audit：3,000 次完整 defensive decisions，六條 route 各 500 次。
- Integrity：cause、actor、decision/outcome contamination、teammate/timing blame、cause-stage pairing、duplicate evidence、RNG、cursor、freeze、NaN、raw enum、state mutation、route mismatch 全部要求 0。
- Regression：2B、runner state、third out、catcher、offensive、browser smoke 與 full suite。

Production 的單段傳壘 route 目前不會獨立生成「傳球準確但接球者漏接」分支；本輪以既有 4-6-3 / 6-4-3 canonical teammate evidence 驗證 actor 與 formatter contract，沒有為了測試新增 outcome branch 或改變 balance。

## 12. Deferred

- Defensive Decision Temporal Clustering
- Final Defensive Event Density
- In-Game Coach Reassessment / Substitution
- Whole-Game Coach Evidence Aggregation
- Defensive Evidence → Evaluator Lens
- Position Evaluation Integration
- Playing-Time consequence from evaluation
- Direct Start Capability Balance
- High School Population Balance
- Pitcher Sequencing
- Catcher gameCalling
- Pitch Arsenal Matchup
- Advanced Strike-Zone Geometry
- HBP
- Bunt
- Mid-PA Strategy Changes
- Skill Mastery / Peak Expression
- Youth Soft Branching
- Position-Specific Defensive Explainability Expansion

## 13. Game Position Admission Integrity

`Career Position Group` 與 `Actual Game Position` 是不同層級的 truth。玩家的 canonical career profile 可保留「內野手」，但正式比賽必須先經由 Playing-Time Game Assignment 解析成具體守位，才交給 roster、defensive responsibility、meaningful decision 與 presentation。

以下 generic infield → playable 2B 行為是 **TEMPORARY DEVELOPMENT CONTRACT / Temporary Development Fallback**，只為目前已完成的二壘手 vertical 提供可驗證的實際守位；它不是正式 Team Lineup / Position Assignment 規則。正式 Team Lineup / Position Assignment System 完成後必須移除或由正式 assignment 取代。

本次診斷確認：右投 generic「內野手」原先在 `resolveLegalPosition()` 被視為已經合法的 specific position，導致 `assignedPosition`、先發 roster 與比賽畫面仍是「內野手」；具體位置只在 `buildInfieldMeaningfulMoment()` 已發生後才由另一層 fallback 臨時決定。這是 Match Assignment Bug，不是 `resolveDefensivePlayResponsibility()` 或 route generator 的責任判定失效。

目前最小 development contract：

```text
career primaryPosition = 內野手
→ deterministic game assignment（source: match-assignment）
→ actual assignedPosition = 二壘手（reason: playable-2b-vertical）
→ playerFieldingAssignment / currentFieldingPosition / roster position
→ infield responsibility / legal routes / presentation
```

這個 assignment 不消耗 Match RNG、不改寫 `player.primaryPosition`，並隨 `gameExposureState.opportunitySnapshot` 保存 source / reason。國小後左投不會被強制分配二壘；既有 handedness guard 會改派一壘，但目前一壘尚未納入與二壘相同完整的 explainable playable vertical，後續留待 Position Assignment Expansion。
