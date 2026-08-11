# Gameplay Sprint 5.2 — Baseball Gameplay Integration Pilot

## 基線與範圍

- 起始基線：`8e58b51 feat: establish variable baseball situation prototype`
- 測試級別：Gameplay Test Level C — First Production Gameplay Mutation Integration
- 唯一正式整合事件：`youth_match_grounder`
- 唯一 readiness-only 事件：`high_school_year_two_spring_game`

本 Sprint 只驗證 5.1 deterministic Gameplay Core 能否安全接入一個既有正式事件，不進行全面比賽系統搬移，也不更名或移動 5.1 Core。

## 為何先選少棒滾地球

`youth_match_grounder` 已具備一出局、一壘有人與內野滾地球的正式場景，能直接對應 5.1 Defensive Core 的兩階段處理；後方也已有 `youth_match_mistake`、上一球回音與少棒結果停留流程。它因此能以最小範圍驗證從情境、決策、執行到結果的完整閉環。

## Integration Boundary

正式依賴順序為：

```text
Story Event
→ BaseballGameplayIntegration
→ BaseballDefensePrototype
→ readonly Integration Result
→ script.js authorized mutation
```

`baseball-gameplay-integration.js` 是 Production 與 5.1 Core 的唯一 adapter。它負責：

- 數字技能轉為 `low／average／high／elite`。
- 由 `catching／reaction／range` 平均形成內野守備能力。
- 由疲勞、疼痛與受傷風險形成身體狀態。
- 將正式比分轉為 Defensive Core 可接受的比分狀態。
- 組出精確 Core input。
- 將 Core `stateDelta` 集中轉為正式比賽 mutation 與結果文案。
- 保存 live／readiness-only 的極小 Registry。

Boundary 不接觸 DOM、Storage、Save、Story render、timer 或 `Math.random()`，也不修改 Player。

## RNG Ownership

Core 與 Integration Boundary 都不自行產生亂數。正式 Runtime 的 `script.js` 在 Stage A 點擊後一次產生四個 rolls，整球沿用同一組值；測試則直接提供固定 rolls。Render 不重新抽取，Stage B 也不再抽取。

## 兩階段流程

### Stage A — 接球方式

正式玩家只看到可用的具體接球方式。固定 routine／normal 滾地球不開放 `dive`。接球成功時，Runtime 只保存 memory-only pending state，不推進球季、不套用 Player 效果，也不進 Outcome Hold。

若 Core 回傳 `controlQuality = failed`，整球直接完成為 `ball-through` 或 `fielding-error`，不顯示 Stage B。

### Stage B — 傳球決策

接球成功後，玩家可選：

- 傳一壘。
- 封殺二壘跑者。
- 挑戰雙殺。

Stage B 使用 Stage A 真實 `controlQuality` 與同一組 rolls。正式 UI 不顯示 raw score、quality tier、distribution 或 rolls。

## Mutation Ownership 與 Exactly Once

Gameplay Core 與 Integration Boundary 保持 readonly。只有 `script.js` 的 `applyIntegratedBaseballPlayResult()` 可以把結果寫入：

- `player.matchState.outs`
- `player.matchState.runners`
- `player.seasonPerformance`
- `player.seasonErrors`

Runtime 在套用前先把 pending stage 切為 committing。完成後清除 pending，再使用既有 `pendingYouthSeasonOutcome` 顯示結果並等待玩家按「繼續」。舊按鈕或重複 Stage B 呼叫會被 stage、事件 ID 與 Player snapshot guard 拒絕，不能重抽或重複套用。

## Result Flags 與 Continuity Migration

接球方式與實際結果分開記錄：

- Approach：`youth_grounder_secure／attack／dive`
- Throw decision：`youth_grounder_throw_first／throw_force_second／turn_two`
- Result：`youth_grounder_double_play／force_second／batter_out／all_safe／fielding_error／throwing_error／ball_through`

`getYouthPreviousPlayEcho()` 只讀 Result flags 判斷上一球與瑕疵，不再把原本的 `match_safe_fielding／match_aggressive_fielding／match_read_fielding` 當成結果真相。

## Save 與 Transient State

`pendingBaseballGameplay` 只存在 Runtime memory，不進 Player schema，也不寫入 Save。Stage A 尚未完成時，`saveGame()` 會提示先完成場上處理並停止寫入。完成整球後可照常存檔；reset、成功 load、delete save 與重新進入少棒球季都會清除 pending。

Mid-play Save／Resume 延後處理。重新整理頁面會回到這個事件的 Stage A，這是本 Pilot 的明確限制。

`SAVE_VERSION` 維持 14，`SAVE_KEY` 維持 `baseballLifeRpgSave`，Player schema 不新增欄位。

## Production 與 Sandbox 分離

正式 `index.html` 只載入三個 5.1 Core 檔案與 Integration adapter。`baseball-gameplay-prototype-sandbox.js` 與 `gameplay-prototype.css` 不進 Production dependency graph；`gameplay-prototype.html` 仍不依賴 Player、Story 或 Save。

## Offensive Readiness

`high_school_year_two_spring_game` 明確維持 readiness-only。該事件是一出局、二壘有人，而 5.1 Offensive Core 只支援一出局、一壘有人，因此回傳：

```text
compatible: false
reason: runner-state-unsupported
requiredBaseState: one-out-runner-on-second
currentCoreBaseState: one-out-runner-on-first
```

這不是未知事件或缺少實作，而是已辨識的 Base State 契約不相容。Offensive runner-on-second、其他少棒守位與其他比賽事件整合均延後到後續另行規劃的 Sprint。
