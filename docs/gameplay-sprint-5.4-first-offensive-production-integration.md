# Gameplay Sprint 5.4：First Offensive Production Integration

## 1. 基線與目的

- 起始基線：`3b50316 feat: expand offensive gameplay base states`
- 測試級別：Gameplay Test Level C — First Production Offensive Mutation Integration
- 唯一正式接入事件：`high_school_year_two_spring_game`

Sprint 5.3 先在隔離式 Core 內補齊 `one-out-runner-on-second`，是為了先確認二壘跑者的滾地球、安打、長打、失誤與觸擊推進都具有獨立且可測的壘況結果。Sprint 5.4 才把這個已穩定的 Base State 接入正式事件，避免同時修改模型與 Production Runtime。

## 2. 正式進攻流程

```text
Story Situation
→ At-Bat Approach
→ BaseballGameplayIntegration
→ BaseballOffensePrototype
→ readonly Machine Result
→ script.js 單次 Player／Match State mutation
→ Outcome Hold
→ Continue 回到原高中 Career Spine
```

`story.js` 只擁有情境、可見線索、四種策略及少量非結果性成長；它不再宣告安打、出局、得分或跑者推進。

## 3. Situation Fact Ownership

`baseball-gameplay-integration.js` 的事件 Registry 是本 Pilot 的 machine fact 唯一來源：

| Fact | 值 | 來源 |
|---|---|---|
| Base State | `one-out-runner-on-second` | 正式事件登錄 |
| Score State | `tied` | 正式 `matchState` 衍生並驗證 |
| Runner Speed | `average` | Event Fact；目前沒有跑者個人 metadata |
| Pitcher Tendency | `outside` | Event Fact；事件正文同步提供外角攻擊線索 |
| Pitch Difficulty | `normal` | Event Fact |
| Next Batter Reliability | `medium` | Event Fact；未新增打序系統 |
| Defense Quality | `average` | Event Fact；未新增九守位防守模型 |

Base State 不解析中文文案。正式畫面會讓玩家看見第五局、平手、一出局、二壘有人、跑者腳程及投手外角傾向。

## 4. Skill 與 Body Adapter

正式 Player 沒有 `power`、`contact`、`bunt` 永久欄位，因此沒有修改 Player Schema。三者只在 Integration Boundary 內衍生，並共用既有 `mapNumericSkillTier()`：

- Power：直接使用既有 `baseballSkills.batting`。
- Contact：`batting`、`ballSense`、`discipline` 的平均值。
- Bunt：`baseballIQ`、`baseRunning`、`discipline` 的平均值。
- Body：沿用 Defense Integration 的 `deriveBodyState()`，維持 `normal／fatigued／minor-injury` 同一套門檻。

Integration 只把 Core 所需的精確資料送入 `BaseballOffensePrototype.resolveAtBat()`，不把完整 Player 傳給 Core。

## 5. RNG Ownership

Core 仍不呼叫 `Math.random()`。正式 Runtime 的 `script.js` 在玩家點選策略後，以 `createOffensiveGameplayRolls()` 一次建立：

- `execution`
- `battedBall`
- `defense`
- `result`
- `runnerAdvance`

同一組 Player facts、approach 與 rolls 會得到相同結果。重新 Render、Outcome 顯示與 Continue 都不會重新抽取。

## 6. stateDelta 與正式 Mutation

Integration 保留 Core readonly，`script.js` 是唯一正式 mutation owner：

- `outsAdded` 更新 `player.matchState.outs`。
- `runsScored` 更新玩家隊伍使用的 `player.matchState.homeScore`。
- `runnersAfter` 直接更新 `player.matchState.runners`，是跨 Base State 的唯一壘況 truth。
- `batterBase` 與相容 alias 不會再次套用。
- 集中式結果表決定小幅 `seasonPerformance` 變化，不由 Story choice 決定。

本 Sprint 不建立新的局數模擬器，也不改變 Competition Presentation 的比分擁有權。

## 7. Approach 與 Result 分離

正式策略旗標：

- `hs_y2_spring_pull`
- `hs_y2_spring_opposite`
- `hs_y2_spring_shorten`
- `hs_y2_spring_sac_bunt`

實際結果另以 `hs_y2_spring_*` result flags 集中寫入，涵蓋三振、滾地停留／推進、安打停三壘／得分、長打得分、內野安打、守備失誤及四種觸擊結果。

策略旗標不被當成命中、推進或得分的證明。高二結算優先讀取實際結果旗標；舊存檔既有的三個 `year_two_spring_*` 旗標只保留相容讀取。

## 8. Exactly Once 與 Stale Guard

正式 Pending 沿用共用的 `pendingBaseballGameplay`：

```text
idle
→ resolving-at-bat
→ committing
→ null
```

點擊後立即鎖定互動、建立 pending、產生一次 rolls 並 resolve 一次。Commit 前會重新比對高二步驟、進攻能力、身體與比賽狀態的 snapshot key。若狀態已變更，流程 fail closed，不套用比分、壘況、能力、旗標或進度。

## 9. Save 與 Outcome Hold

- 打席仍在 pending 時，沿用既有 Save guard，手動存檔會被拒絕。
- Commit 完成後先清除 pending，再顯示 Outcome，因此結果畫面可以正常存檔。
- Pending 不進入 Save Schema；Load、刪除存檔與重開流程沿用既有 cleanup。
- `SAVE_VERSION` 維持 `14`。
- `SAVE_KEY` 維持 `baseballLifeRpgSave`。
- Mid-at-bat Save／Resume 仍延後。

Outcome 只顯示實際棒球結果與世界回應，不顯示 Decision Quality、raw score、roll 或 distribution。Continue 仍回到原本的 `high_school_year_two_depth_chart`，沒有新增 Career branch。

## 10. Defense 與 Sandbox 回歸

5.2 的 `youth_match_grounder` Stage A／Stage B、防守結果、共用 pending 與 Outcome 流程未重構。正式頁仍載入 Core 與 Integration，但不載入 Sandbox controller 或 Prototype CSS。

`gameplay-prototype.html` 仍可獨立使用一壘／二壘 Base State、Run 10 與 Debug trace；Core 仍不依賴 Player、Story、Save、DOM 或 Storage。這使同一個 Offensive Core 同時服務隔離驗證與正式事件，而不混合兩邊的狀態責任。

## 11. 延後項目

本 Sprint 未處理其他進攻事件、更多 Base State、逐球好壞球、保送、觸身球、全壘打專屬模型、盜壘、打帶跑、追加守位 Gameplay、長期 Decision Memory、對手適應、Challenge Mode、Architecture 4.13 或 Gameplay Sprint 5.5。
