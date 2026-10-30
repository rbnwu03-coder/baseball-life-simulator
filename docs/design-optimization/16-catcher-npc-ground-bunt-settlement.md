# 捕手視角 NPC 地面短打結算（2026-10-30）

承接 [15 號報告](15-catcher-bunt-fallback-continuation.md)，基線為 `009037725fbbdc0ce8603105fc6682bca6c4da4f`，只提交 `fix/catcher-event-consistency-2026-10-30`。NPC owner 與限定頁面證據完成後，仍不能據此宣稱高一健康切片完整驗收；原定兩場、電話、N+1 與年末流程仍待完成。

## 實作邊界

- 只接捕手視角的 `fairContact / groundBunt / hard / secondBaseSide`。落點責任由原 physical truth 判定為 2B，從防守方正式 active roster 取得真正二壘手及一壘接球者，並讀取各自的能力。沒有修改捕手守位或借用玩家能力。
- 原 `offensiveBuntPAState.pitchHistory`、PA／pitch identity、觸球與落點保持原樣。原 handoff 的 runner reassessment、force chain 與正式 runners 進入同一球的後續守備。
- NPC 先抓一壘打者出局，沿用既有自動守備的保守路線；共用內野能力窗口、第一下控球／轉傳／出手門檻及正式接球者判定。僅後續執行取樣一次 `nextHighSchoolMatchSimulationRandom`；未重抽短打或壓縮 PA。
- 成功與未完成出局都由實際執行事實產生，並經既有 `ForceAdvancement`、第三出局及 `DefensiveRunnerThrowSettlementFoundation` 結算。沒有硬填預定 out/single、追加新失誤率或假造普通努力證據。
- 正式 mutation 在獨立 transaction 副本完成並驗證後才寫回。PA 與 defensivePlay 各一份正式 event ref，打序前進一次；A／PO 由真正 actor 的 action dependencies 歸屬。玩家貢獻、操作 moment 與守位不因 NPC 處理而增加。
- handoff 與 defensivePlay 事件都保存 committed receipt；後續 PA 清除暫存 handoff 時，事件 receipt 仍保留。重複接手、缺失／損壞 receipt、舊壘況或比分、pending activeSituation 都有定向測試，失敗不留下 RNG／正式紀錄的部分 mutation。
- 小飛球、其他落點與其他球速仍保留 `BUNT_FALLBACK_SETTLEMENT_OWNER_MISSING` 明確邊界。未擴充其他守位或 NPC 短打類型。

頁面首次取證發現 NPC defensivePlay 已正式結算，但既有 feed formatter 沒有投影該事件。因此只補本 owner 的播報：列出 NPC 實際處理、最終壘況及「這個短打打席已結束，輪到下一棒」，不改 UI 結構。

## 實際測試

[完整執行結果、來源雜湊及 exit code](catcher-event-repair-v3/verification.json)；[四案逐步證據](catcher-event-repair-v3/continuation-after.json)。原 4 案在開工時皆因 owner 缺口失敗，本輪皆由正式 playback 轉綠：空壘／一壘有人，以及兩者 fallback 後正式 Save/Load。每案同一短打來源、正式 PA +1、PA ref 一次、打序 +1 並輪到下一棒，沒有 compressed outcome 代替。

| 本輪重跑 | 結果 |
|---|---|
| catcher context／continuation／NPC receipt | 40 PASS，0 FAIL |
| catcher choice outcome integrity | 20/20 PASS |
| B2 defensive handoff／runner realization | 26/26、22/22 PASS |
| B1.0.1 tactical action／compressed AI integration | 21/21、19/19 PASS |
| third-out runner integrity | 16/16 PASS |
| force multi-runner production integration | 16/16 PASS |
| defensive runner throw settlement | 22/22 PASS |
| shared infield 2B production integration | 17/17 PASS |
| match full game record | FAIL：非捕手完整生涯路徑遇既有未支援短打邊界 |

最後一項以完整基線 Git blobs、原 index 順序、原 career helper 與未修改測試重現相同 blocker／exit 1；[基線比較](catcher-event-repair-v3/record-baseline-comparison.json)、[基線 log](catcher-event-repair-v3/match-full-game-record-baseline.log)、[修補 log](catcher-event-repair-v3/match-full-game-record-test.js.txt)保存。不能列為全套通過，也未擴修該其他路徑。合計 10 套 exit 0、1 套基線相同失敗；未重跑全專案或健康效果校準。語法與 diff whitespace 檢查通過。

## Playwright MCP 實際頁面

正式程式取證版本：`7cea5dba83e00a0dc5be11a621aaf74a5004f11c`。本機服務固定讀 Git blobs，`/__version` 與 script SHA-256 `3220ccface61a87a8132c2121a45c70d154977cefdd36151fc5f43f7d977d348` 已在瀏覽器核對。後續文件提交不改這份程式位元組。

全部推進使用 MCP 的實際頁面按鈕：創角 → 正式「開發測試書籤 → 青棒第一年」，`direct_start_history=false`。該書籤入口與賽前檢查點先在本分支 owner 修補版 `7e35fc0a2762842cfaf45e3fb61609eff6422886` 建立，最終程式版再經正式讀取該賽前檢查點入場；未載入外部 fixture。敘事選擇為：觀察訓練組 → 保留國中主守 → 團隊工作 → 用打擊增加入口 → 短量熱身。玩家首打席選縮小攻擊區，再逐球放掉並按繼續。沒有在頁面呼叫 choose／advance／prepare，也沒有改寫 Player、戰術、RNG 或球事件。

首場新建 seed 為隨機生成，故由隔離 origin 的賽前測試檢查點進行多次獨立進場；唯讀快照的離線預測只用來找路徑，沒有當作頁面通過。探索紀錄與最終頁面證據分開保存。初次儲存提案曾被自動審核拒絕；另行唯讀確認 localStorage 為空後，建立本輪暫時檢查點才獲准。沒有覆蓋使用者既有存檔。

最終版 seed `604606` 已實際產生同 PA 的偏強二壘手側地面短打：2 局上、1 出局、空壘，原打者 `regional-power-school-player-08`、打序 7。MCP 讀到短打待處理時的合法擋球選項為 0。正式 NPC 未能及時控制球，打者上一壘；PA 增加 1、打序 7→8，下一棒為 `regional-power-school-player-01`，PA／defense refs 各一次，RNG cursor 只增加 1，GameRecord integrity 無問題。

短打結算後畫面明確播報 NPC 結果與下一棒。後續其他 PA 的 blockedPitch 有自己的正式打者與壘況，不是把該短打換成擋球。首輪實際擋球畫面亦確認任務、球況與選項一致。截圖取得時已呈現結算，所以只作為結算畫面，pending 證據使用同步唯讀狀態，不把截圖誤列為 pending 畫面。

證據：[實際前後狀態與完整 receipt](catcher-event-repair-v3/browser/live-bunt-capture.json)、[事實核對](catcher-event-repair-v3/browser/acceptance-summary.json)、[NPC 結算截圖](catcher-event-repair-v3/browser/npc-ground-bunt-settled.png)、[第一輪擋球截圖](catcher-event-repair-v3/browser/blocked-pitch-first-browser-run.png)、[瀏覽器版本](catcher-event-repair-v3/browser/browser-version.json)。[探索摘要](catcher-event-repair-v3/browser/exploration-summary.json)記錄 41 次新建試驗與離線預測，只有實際操作到目標的案例列為頁面證據。這些未完成整場的探索不是 41 場比賽驗收。

額外嘗試結算後的瀏覽器 Save/Load 時，儲存按鈕 ref 已失效而未寫入，後續重整／讀取回到賽前檢查點。因此該嘗試**不列 PASS**；沒有把賽前讀取冒充結算後保留。正式 Save/Load 防重複目前以原四案及新增 receipt／下一 PA 清理測試的 Node/VM 證據為準。

[當頁 Console](catcher-event-repair-v3/browser/page-console.log)無訊息；[會話累積 Console](catcher-event-repair-v3/browser/session-console.log)只有先前診斷 INFO 與一筆 `favicon.ico` 404，沒有新增遊戲 JavaScript 例外。工具在 all-history 模式的總數表頭與明細不一致，以明細判讀。[必要資源紀錄](catcher-event-repair-v3/browser/resources.log)中 index、script、style 等載入成功。

[實作與測試 diff](catcher-event-repair-v3/minimal.diff)以指定基線比較；[保存核對](catcher-event-repair-v3/preservation.json)確認測試後 production 雜湊一致，integration ref 仍為 `f239a8daad60fa3a474cdac838aee783ede80333`。

## 保留的限制

本輪沒有完成原定兩場到年末的健康切片流程，也未解除其他短打球型／守位的既有阻擋。投打面板曾沿用前一打席的逐球回饋，另記為既有呈現問題，未在本輪重寫。Console／資源實際觀察與重整讀取結果見隨附頁面證據；工具參照失效不算遊戲錯誤或通過。
