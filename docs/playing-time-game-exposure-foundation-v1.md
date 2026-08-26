# Playing Time / Game Exposure Foundation v1

## 1. Opportunity 與 Exposure

本層只回答球員在某一場比賽「有沒有機會進場、預計如何使用」。它不計算成長，也不直接給能力、進度或 Development bonus。

正式因果鏈為：

```text
School / Team Context
+ Opportunity Readiness Snapshot
+ Actual Role
+ Competition / Position Need
+ Coach Usage Lens
+ Game Context
→ Playing-Time Opportunity
→ Planned Usage
→ canonical Match Participation
→ Actual Game Exposure
→ Match Experience
→ Development
```

Opportunity 是教練的賽前／臨場使用意願；Exposure 是比賽真的產生的守備局數、打席、入退場局數與 appearance type。兩者由不同 versioned contract 保存。

## 2. School `playingTimeOpportunity` 語意

`low / medium / mediumHigh / high` 是學校提供實際上場窗口的環境傾向。它是有界 modifier，不是 starter probability，也不是命令。高環境仍可能沒有先發；低環境中的強球員仍可贏得先發。

本 Sprint 不啟用 `trainingQuality`，也不以 opponent 標籤推導 Team Strength。

## 3. Capability、Role 與 Competition Inputs

`system-derived-provisional` Producer 暫時使用現有守位模擬能力中的 fielding、reaction、decision，以及 position fit 與 primary／secondary position experience，建立 `opportunity-readiness-v1`。Resolver 只消費這個 Snapshot，不直接讀 Player Truth、raw skills 或 Position Capability helper；它不建立 overall rating，也不加總全套 raw skills。

正式 `starter / rotation / bench` 是 usage priority 的最主要先驗，但不是固定局數。招生時 `projectedRole` 只保留為有限 prior；已有正式高中角色時一律由 actual role 勝出。

Competition 使用既有 `competitionDepth`；Position Need 使用入選學校 invitation 的 `schoolInterest.positionNeed`。兩者只調整機會，不改寫正式角色。

## 4. Coach Usage Lens

沿用 School Invitation 的 `coachProfile.coachStyle`，映射為四個最小 usage lens：

- `fundamentals → conservative`：較穩定保留既有 starter，替補窗口較少。
- `analysis → balanced`：維持角色、能力與局勢的中性權衡。
- `development → developmental`：對 rotation／bench 提供稍多低壓替補窗口。
- `competition → performanceFirst`：較重視當前守位能力，但不凌駕 actual role。

這不是新的平行 Coach System，也不包含完整換人 AI。

## 5. Planned 與 Actual Exposure

`resolveStartingOpportunity()` 是純函式，輸出 `startingDecision`、`appearancePlan`、`substitutionOpportunity` 與 reasons；roster admission 才消費結果。

`gameExposureState` 保存：

```js
{
  version: "game-exposure-v1",
  matchId,
  opportunitySnapshot,
  plannedUsage,
  actualUsage,
  entryInning,
  exitInning,
  defensiveInnings,
  plateAppearances,
  appearanceType,
  exposureSource,
  pitcherExposureDeferred,
  finalized,
  finalizationId
}
```

賽前 state 的 actual values 固定為 0。只有 Match End 才從 simulation log、lineup status 與 player entry truth exactly-once finalize。planned late substitution 可以因比賽持續緊張而成為 actual no appearance；pinch hit 若未留守則是 1 個實際 PA、0 守備局。

## 6. Determinism 與 RNG Isolation

Opportunity identity 包含 version、player identity、match identity、actual/projected role、school environment、competition、position need、coach lens、守位能力／適配／經驗、合法守位與 game context。stable hash 不呼叫 `Math.random()`，也不讀寫 `simulationCursor`。

賽前 plan 隨 `gameExposureState` 存檔；reload 只 normalize 原 state，不重抽 usage。Match debug 或再次讀取 Opportunity 不會推進 Match RNG stream。

## 7. Match Experience Bridge

Match End 先用 canonical match truth finalize Actual Exposure，再將 finalized `defensiveInnings` 與 `plateAppearances` 傳給既有 Match Experience settlement。Playing-Time 層本身不呼叫 `applyDevelopmentResult()`、不修改 `baseballSkills`、也不建立另一條 settlement。

No appearance 會得到 0 innings、0 PA、0 Match Experience Development Context。更多 actual exposure 只代表更多 Experience opportunity；Active Evidence 品質仍可能讓最後 Development 不呈單調排序。

## 8. Direct Start Bypass

正式正常高中 route 使用 Opportunity resolver。帶有既有 `direct_start_history` 的 High School Direct Start 則強制 `start`，並保存：

```text
exposureSource: direct-start-forced
```

這項 bypass 只維持 Match vertical 測試可用性，不改寫學校環境、能力或正式高中角色。

## 9. Pitcher Deferred

v1 vertical 限定 Position Player Game Exposure，完整驗證二壘手與一般打擊參賽。投手回傳 `pitcherExposureDeferred: true`，不套用野手 innings／替補 resolver；先發投手、球數、牛棚與後援輪替留待後續。

左投球員在國小後若被要求正式守 2B／SS／3B／C，game-level assignment 會改用合法 secondary position，沒有合法 secondary 時落到 1B；不改寫玩家 canonical primary position。

## 10. Future Role Evolution

本層保存 actual role、opportunity reasons 與 actual exposure，供未來 Role Evolution 讀取；本 Sprint 不把單場表現直接永久升降 `bench / rotation / starter`，也不實作連續表現自動先發。

## 11. Opportunity Evaluation Boundary v1.0.1

正式 consumer contract 為：

```text
Provisional Capability Producer
→ Opportunity Readiness Snapshot
→ Playing-Time Opportunity Resolver
```

`opportunity-readiness-v1` 是針對特定 `player + position` 的 compact、versioned 使用判斷輸入，包含 readiness band、守備／反應／判斷／守位經驗 readiness、position fit、合法守位結果、confidence、reasons 與 provenance。現階段 source 明確標示為 `system-derived-provisional`；Producer deterministic、不讀 Match identity、不消耗 Match RNG，也不加入場次能力雜訊。

Opportunity Readiness Snapshot 不等於 Player Capability Truth、不等於 Coach Evaluation，也不等於 recommendation。高 readiness 只增加競爭力，仍須與 Actual Role、Competition、School Opportunity Environment、Position Need、Coach Usage Lens 與 Game Context 共同決定 Opportunity，因此不保證先發。

Snapshot 只保存 Opportunity 所需的 derived readiness，不複製完整 baseball skill table，不建立 overall／player rating，也不成為第二套技能 truth。`gameExposureState.opportunitySnapshot` 仍代表 Playing-Time 決策結果；其中另存 compact `readinessSnapshot`，兩者不混用。這次切割不修改任何 Opportunity 權重、先發率、替補率或其他 balance。

未來正式接口概念為：

```js
createOpportunityReadinessSnapshotFromEvaluation({
  evaluation,
  position,
  teamContext
})
```

未來因果鏈可替換為 `Observed Evidence → Evaluator Lens → Subjective Evaluation → Opportunity Readiness Snapshot → Resolver`；屆時只替換 Producer，不重寫 Playing-Time consumer。本版不實作 Evaluator Lens、Observed Evidence、Coach／Scout 主觀評價或 Evaluation explainability。

## 12. Population Balance Deferred

目前 distribution fixture 只驗證方向與結構：School environment、Position Capability、Competition、Actual Role 與 Coach lens 都會影響結果，且分布具 overlap。Bench／Rotation 有非零 appearance，Starter 不固定 7 局，高環境不保證先發。

先發率、替補率、平均 innings／PA 的目標值，以及學校與年級 population calibration，留待 High School Population & Capability Balance v1。

> This is structural validation, not population balance.

同時 deferred：完整 substitution AI、Team Strength、School `trainingQuality`、Pitcher Usage、Role Evolution，以及 Match Meaningful Decision 的 one-shot caps。
