# Defensive Play Foundation 1.3 — Runner / Throw Timing & Play Settlement

## 基線與範圍

修改前 main / origin/main：`9a413a9a3286c2177b76b1bd1b3a77411bedd2c4`，0 / 0，working tree clean。
本輪只建立 timing、settlement 與現有 production 的銜接；不 commit / push。

## 既有 authority

- `offensive-bunt-defensive-handoff.js`：runner physical state / arrival profile；ground-ball handoff 已重用。
- `defensive-decision-throw-foundation.js`：選定路線、target runner、active receiver、throw demand 與已解出的 throw quality。
- `script.js` 二壘 detailed route：既有窗口、傳球、SS pivot、接收與 home tag facts。這些是投影來源，不再抽樣。
- `ForceAdvancement`：初始封殺鏈；新增同一 authority 內的 retirement projection，保留原本 initial API。
- `resolveHighSchoolThirdOutIntegrity`：唯一第三出局與得分裁定；本輪未改寫。
- `BattedBallTagUpExecution`：既有 runner/throw/receiving 比較與 physical outcome；只投影，不重新計算執行。

## 分層契約

`resolveTiming` 是純函式，驗證 selection / throw / runner / receiver 的 identity 與當前狀態，產生不可變 timing。
包含 targetRunnerId、targetBase、decisionIdentity、throwIdentity、receiverId、runnerArrival、ballArrival、receiverCompletion、margin、classification；沒有 safe/out。

通用相對時間不是秒：runner = 10 − clamp(speed, 0, 20) × 0.45 + start delay − advancement progress。
start delay：prepared −1 / normal 0 / late 1 / broken 2；progress：early 0 / midway 1.5 / late 3 / nearArrival 4。
保留既有 `deriveArrivalProfile` 的讀取結果與原始 physical state，不建立新的 runner capability。
ball arrival = 4 + distance delay（short 0 / medium 1 / long 2）+ quality delay（onTarget 0 / challenging 1 / weak 3）+ delayed release 1。
receiver completion 另加非負 receive delay；tag completion 再加 tag delay（預設 1）。以上是新通用 seam 的粗粒度模型，**不替換已驗收二壘或 tag-up 的既有數值／結果**。

margin = runner arrival − receiver completion；±0.5 內為 closePlay，正值代表守方先完成，平手不證明先到。
offline / 無可用 receiver 是 noContest，保留 live-ball recovery，不直接判安全或推進。
沒有新增 RNG，沒有重抽 reach、secure、throw、runner start 或接收。

`deriveSettlement` 獨立檢查 baseball 意義：force / batter-first 需要 base possession；tag 需要 tag completion 先於 runner。
輸出 outs、baseChanges、runChanges、runnerMovement、forceStateBefore/After、ballRemainsLive、continuation 與 settlementApplied。
hold 不製造出局或推進。弱傳也可能刺殺慢跑者。其他已完成的 scoring attempts 必須由上游提供 actor 與 crossing timing，本層不猜測誰已跑回本壘。

## 第一段與 continuation

通用 DP 僅結算第一段；成功時 secondLegPending，安全時 reassessAfterSafeFirstLeg，不偽造第二個出局。
ForceAdvancement retirement projection 依退場 actor 的原 force-chain depth 解除其前方跑者的 force；例如一壘跑者在二壘出局，不解除 batter 到一壘的要求，但解除其前方跑者的強迫推進。
尚未完成的跑者保留在 pendingRunners；目標壘被迫讓位的 actor 放入 inTransitRunners，不推測抵達下一壘或得分。
後續階段必須先消費 continuation / 更新後 force state，不得把初始 force chain 當作第二段當前 truth。

## Production、lifecycle 與 save

二壘選擇 → 既有 execution → timing 投影 → settlement 投影 → `applyHighSchoolDefensiveSettlementFacts` 單一 mutation adapter → 既有 PA / evidence / lifecycle close。
二壘完整 DP 與 reassessment 仍由原 detailed authority 完成；本層保存其結果，不把 generic 第一段模型反套回去。
Legacy timing 沒有精確 arrival margin，明確保留 null，使用原窗口及 receiver facts，不由最後 safe/out 倒推 timing。

Tag-up timing 的 margin 反轉既有 runner-minus-defense 符號以統一方向；原 execution outcome 不變。
新 tag-up settlement 也經 canonical third-out helper 和單一 adapter，不重新處理接殺出局。
舊存檔沒有新 timing 時保留既有相容路徑；line-drive retouch 未改寫。

暫停的二壘 execution evidence 與 timing 保存在既有 activeSituation / handoff；save normalization 驗證 identity 和投影事實。
拒絕 stale bases / outs / runner / receiver / throw / timing 及替換過的 execution outcome；不從未來狀態修補已完成事實。
Tag-up 暫停保存 execution + timing，核對原 game context / receiver；結算結果保存在 execution evidence / event。
重複 application 由已 applied settlement 或 lifecycle guard no-op；拿未 applied 的舊事實再次改變已更新 match 則拒絕。
未新增 save architecture、歷史 RNG 或無界 ledger。

## 驗證範圍

新增 `tests/defensive-runner-throw-settlement-foundation-test.js`：22 個案例。
更新 decision/throw production integration：16 個案例（含新增 1.3 的 pending save、production resume 不抽樣、單次套用、stale facts）。
更新 tag-up integration：21 個案例（實際載入 1.3，保護 safe/out/hold、原抽樣與存讀檔）。
相關 regression 使用 33 個測試檔；涵蓋 0.9–1.2、BBP ground/airborne、2B、home、third-out、force、lifecycle、save、roster。
不自動執行 full global regression。

## Deferred

official error scoring、FC classification、universal receiver skill、通用 DP 第二段、cutoff/relay、OF direct-vs-relay、P/C special defense、bunt generalization、secondary takeover、collision、shifts、field geometry、evaluator/scout、background PA defensive sensitivity、polished UI、SS Vertical Slice 與 Foundation 1.4 均未施工。
