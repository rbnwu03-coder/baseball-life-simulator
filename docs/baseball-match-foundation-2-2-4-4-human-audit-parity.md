# Baseball Match Foundation 2.2.4.4 — Human / Audit Opportunity Parity Validation

## 結論

本輪只加入 read-only opportunity trace、debug export、deterministic replay／comparison helpers 與測試 fixture，沒有更改 Entry、Decision Gate、route、RNG、PA outcome、timer、choice order 或任何 Match Opportunity gameplay。

目前 production Browser playback 與 2.2.4.3 direct audit replay 使用相同 Opportunity logic。固定 `22424201`–`22424220` 的 20 場完整比賽，match identity、entry、玩家 PA、offensive／defensive opportunity signature、Decision lifecycle 與 final match truth 全部一致，沒有 first divergence。

Runtime signature 為：

```text
bmf-2.2.4.4-opportunity-parity-v1
```

## Trace architecture

Trace 只在 `?matchDebug=1` 或測試顯式開啟時掛到當場 `highSchoolMatch.opportunityDebugTrace`。一般遊玩預設不建立 trace，也不顯示 debug UI。

每場 payload 包含：

- `header`：match id、seed、初始 RNG cursor、Direct Start mode、role、canonical position、完整 ability shape、opponent、lineup、entry rule、runtime signature。
- `opportunities`：每個玩家 offensive PA 與每個玩家在場時的 away defensive PA。
- `lifecycle`：以唯一 `decisionId` 記錄 `created → presented → choiceReceived → resolved → outcomePresented → continue`。
- `checkpoints`：match initialization、entry、各 moment resolution、save/reload 後的 one-shot state。
- `summary`、`canonicalOpportunitySignatures`、`finalMatchTruth`。

Defensive opportunity 逐筆保留 inning／half、outs、bases、score、batter、entry／position、ball context、responsibility、player roles、legal／viable routes、route windows、Decision window、one-shot consumed state、candidate／created／presented／resolved 與 rejection reason。Offensive opportunity保留 PA number、scripted／emergent candidate、objective／approach、first-offense one-shot state與 lifecycle。

## One-shot state

Repository 沒有第二套獨立 `defensiveDecisionUsed` boolean。正式 truth 是既有：

```text
match.momentIndex
match.simulationPhase
match.completedMoments
```

衍生規則：

- Match 初始化：`full_match_flow`、`momentIndex = 0`、`completedMoments = []`。
- 第一次 offense resolve：`moment_1_resolved`，defensive window 開啟。
- Defense resolve：`moment_2_resolved`，defensive one-shot 視為 consumed，後續 defensive PA 記為 `decision-window-already-consumed`。
- 最後 offense resolve：`moment_3_resolved`。
- 新比賽由 `prepareHighSchoolYearOneMatch()` 建立新 state；save/load 保留上述 canonical fields，不會重設或提前消耗 window。

## Paths

Browser Direct Start 正式路徑：

```text
selectDevelopmentEntry("highSchoolFullMatch")
→ selectDevelopmentTestPosition("二壘手")
→ createPlayer()
→ enterHighSchool()
→ prepareHighSchoolYearOneMatch()
→ resumeHighSchoolMatchPlayback()
```

Audit replay 使用同一 Character Genesis、role／position override、seed 與 match constructor，只把 production timer callback 改為同步呼叫既有 `advanceHighSchoolMatchPlaybackStep()`；沒有另外建立 opportunity 邏輯。

Normal Narrative smoke 的正式高中事件路徑：

```text
high_school_intro
→ high_school_load
→ high_school_life
→ high_school_role
→ high_school_long_bench
→ high_school_showcase
```

5/5 synthesized pre-HS fixtures 都完成終場。Narrative path 因正式事件 effects 累積，ability 與 raw responsibility／route exposure 可以不同；但 5/5 都維持正確 one-shot lifecycle，沒有 entry 前 consumed、presentation suppression 或 orphan Decision。

## Controlled results

| 驗證 | 結果 |
|---|---:|
| Browser production vs direct audit | 20/20 parity |
| Fresh vs first Decision 後 save/reload | 20/20 parity |
| Normal Narrative full match | 5/5 completed |
| Instrumentation on/off | canonical final truth 完全相同 |
| Seed 22424201 defensive Decision | created 1／presented 1／resolved 1 |

Seed `22424201` 的 summary：第 5 局下、0 out、空壘、lineup slot 3 進場；玩家 2 PA；scripted offense 1、emergent offense 1；defensive responsibility 6、至少一條 viable route 4、多 route 1、meaningful defense 1。防守 rejection 為 only-one-legal-route 1、only-one-viable-route 4、window consumed 後 6。

200-seed controlled sensitivity：

| Policy／sample | Zero defense | Later offense | Mean total Decisions |
|---|---:|---:|---:|
| First legal choice | 6/200（3.0%） | 185/200（92.5%） | 2.895 |
| Alternative legal choice | 6/200（3.0%） | 185/200（92.5%） | 2.895 |
| Execution 0.2 | 6/200（3.0%） | 185/200（92.5%） | 2.895 |
| Execution 0.5 | 6/200（3.0%） | 185/200（92.5%） | 2.895 |
| Execution 0.82 | 6/200（3.0%） | 185/200（92.5%） | 2.895 |

Recorded Human choice ids 也可回放並得到同一 canonical opportunity sequence。這些 controlled runs 顯示 choice policy 與 execution sample 會影響執行結果，但不足以解釋人工 5/5 zero defense 與幾乎沒有 later offense。

## Root classification

現版 Browser seed `22424201` 與 Audit 都產生並呈現一個防守 Decision，因此人工先前「完全沒有出現」不能在目前相同 build／path／seed 重現。20 seeds 也沒有 E（created but presentation suppressed）或 F（runtime divergence）。Fresh／reload 沒有 D（window 提前 consumed）。

目前最佳假設是 G：先前人工場次與目前 runner 不是同 runtime build、頁籤、服務目錄或 exact path；次要可能是尚未取得 trace 的不同 human state／route。Human debug export 現已把 repo path 可核對的頁面、seed、role、abilities、lineup 與 runtime signature 一次帶出，可用下一場真實人工 trace 直接分類 A–G，而不再憑體感推測。

## Final questions

1. **Q1：Human production 和 Audit 是否使用相同 Opportunity logic？** 現行 Browser production fixture 與 runner 是；20/20 canonical parity。
2. **Q2：Browser production 和 Node Audit 同 seed 是否 deterministic parity？** 是；20/20，且 `22424201` 明確通過。
3. **Q3：Direct Start 與 Normal Narrative 是否有 state 差異？** 有預期的 ability／event-history／exposure 差異；沒有 one-shot lifecycle 或 presentation integration 差異。
4. **Q4：人工 zero defense 最可能原因？** 目前最可能是 G（version／path mismatch），而非現行 probability；須用下一場 Human export 定案。
5. **Q5：Choice policy 足以解釋嗎？** 否；A／B 的 zero-defense 與 later-offense rate 相同。
6. **Q6：Execution sample 足以解釋嗎？** 否；0.2／0.5／0.82 的 opportunity rates 相同。
7. **Q7：Save/reload 會提前消耗 window 嗎？** 本輪 20/20 沒有；canonical fields 保留且 parity。
8. **Q8：Decision 可能建立但未呈現嗎？** architecture 分層可偵測，但本輪 20 seeds 與 Browser `22424201` 沒發生。
9. **Q9：2.2.4.3 的 1.5% 是否可信代表 Human gameplay？** 對目前固定 build、Bench 2B Direct Start fixture 的 distribution 仍可信；不能反向代表尚未確認 runtime signature／path 的舊人工五場。

## Human validation handoff

1. 用目前 repo 的服務網址加上 `?matchDebug=1`。
2. 正常建立一場 Bench 2B 高中完整比賽。
3. 正常選擇並按「繼續」，直到終場結果畫面。
4. 在離開終場結果前按「複製比賽追蹤」。
5. 直接把剪貼簿內容貼回任務；不需要開 DevTools。

## Deferred

本輪未處理：Entry model、defensive one-shot cap、scripted offensive moment、Decision 數量、Second Base route generation、route availability、coverage／SS foundation、自然機會 balance 與 Match Opportunity Foundation 後續產品設計。
