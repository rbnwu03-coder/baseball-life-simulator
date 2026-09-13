# Scoreboard Presentation Integrity — Sprint 1

Cursor-Consistent Live Scoreboard Projection。施工與完整驗證完成：**PASS**。Full regression **174/174**，syntax **262/262**，1,400 場 audit 全綠。未 commit、未 push，working tree 保留供人工驗收。

## Closeout

1. **Baseline**：`main`，HEAD / origin/main `6d2336c`，`feat: enforce third-out scoring and pitcher out attribution`；施工前 ahead / behind = 0 / 0、working tree clean。既有規則稽核、force 與 third-out 文件保留。
2. **Changed files**：production：`script.js`、`match-game-record.js`。四個歷史 harness：`tests/baseball-match-foundation-2-1-1-test.js`、`tests/baseball-match-foundation-2-1-1-1-test.js`、`tests/high-school-integration-1-2-2-test.js`、`tests/high-school-integration-1-2-2-2-test.js`。新增 `tests/scoreboard-presentation-integrity-test.js`、`tests/scoreboard-presentation-production-integration-test.js`、本文件及 `docs/scoreboard-presentation-validation.json`。無 HTML/CSS 檔案改動。
3. **Existing presentation architecture**：simulationLog 記錄正式 PA、run、halfInningEnd、sideChange、gameEnd 與各事件的 presentationSnapshot。simulation 可以領先畫面；feed 和快照已有事件前綴介面。
4. **Existing cursor authority**：唯一可見性邊界是既有 `presentedEventCursor`。其值是「下一個尚未揭露事件」的索引，因此 prefix 是 `simulationLog.slice(0, cursor)`，包含索引 `< cursor` 的事件。未新增游標。舊 `scoreboardRevealHalfIndex` 保留既有 playback / save bookkeeping，但不再控制 scoreboard projection。
5. **Root cause of H delay**：renderer 使用 `model.completed ? team.hits : "—"`，已揭露安打也被終場遮罩隱藏；同時 model 讀取完整 GameRecord，不能直接解除遮罩。
6. **Root cause of inning-run delay**：舊 cell 以半局 reveal index 將進行中半局固定顯示省略號，總 R 卻可能取快照或終場比分，形成延遲與不一致。
7. **Visible event prefix**：projection、snapshot backward search、feed 都限定同一 cursor。移除 snapshot 查不到可見事件時向後方 hidden event 取快照的 fallback。cursor 0 的比分、壘況、出局數均為未播放狀態；靜態入場守位 assignment 繼續可顯示。
8. **Projection authority**：`getHighSchoolVisibleScoreboardProjection` 呼叫 `MatchGameRecord.getScoreboardFromEvents`。查詢重用原有 `getEventId`、`ensureInningLine`、`recordPlateAppearance`、`recordRun`；沒有在 script 自行分類 hit / FC / error。GameRecord 僅新增 immutable query / export，原計分、完整 ledger validation、finalization 一行未改。
9. **No parallel mutable scoreboard proof**：每次呼叫建立短生命週期的 replay object；查詢回傳深度 frozen 的 R/H/E 與 inning lines。view 的 cells / states / totals / trace 亦 frozen。無 cache、無 match 寫入、無 save 欄位。這不是儲存的第三份比分 truth。
10. **H visibility rule**：只有 prefix 內正式 PA 經原 official classifier 計算。安打 PA 揭露當步 H 增加；hidden future PA 不計。E 使用同一原有 error 統計邏輯並解除同款終場遮罩，未擴建 error scoring。
11. **Run visibility rule**：僅 prefix 內正式 run event 經原 `recordRun` 形成 total R 與 inning R。currentSituation.score 也讀同一 projection，不再混用 simulation scores。
12. **Inning-cell state contract**：`notStarted`、`live`、`completed` 為衍生狀態；已揭露半局事件建立 live，halfInningEnd 或已揭露後續半局關閉先前可見半局，gameEnd 關閉已開始半局。未開始者不因終場而補成已打。
13. **Meaning of ellipsis**：沿用既有 `…` 字形，僅表示尚未播放／未開始半局。live 最少顯示 0，completed 保留數字。renderer 的 aria-label 改為「本半局尚未播放」；沿用既有 class / 表格外觀。
14. **Atomic update behavior**：既有 cursor advancement 同步跨過 hidden run / PA metadata，停於正式可見結果。該 render 的 H、total R、inning R 與同 prefix 最新 snapshot 的 bases / outs、feed 一起呈現，沒有新 timer 或第二次 render 才補分的狀態。
15. **Future-event leakage protection**：projection 不讀 full scores、lineScore、GameRecord totals 或 match.completed。只使用固定 game/team identity 與 regulation 配置；完成旗標來自可見 gameEnd，延長欄數來自 prefix 已揭露局數。
16. **Same-half leakage fixture**：E1 single、E2 HR、E3 out、E4 double；E1 僅 H1/R0，E2 僅 H2/R2，即使 E4 已在 canonical log 中亦不外洩。
17. **Top/bottom attribution**：R/H/E 經 GameRecord 原有 team / offenseTeam / half 判定；cells 對應 away 上、home 下。新測試含雙方安打與得分。
18. **Completed half behavior**：第三出局與 halfInningEnd 保留 3 OUT 快照及完成局分；推進下一半局後不退回省略號。
19. **New half behavior**：sideChange 揭露時新半局為 0，未來局仍為省略號。正常 7 局保留；第 8 / 10 局僅在可見事件抵達後擴欄。
20. **Full-match equality with GameRecord**：真實完整 career match cursor 追上後，逐隊 R/H/E、每筆 canonical inning line 相等。另驗再見全壘打先揭露 PA 才更新 winning run，以及 7 局上結束、免打 7 局下時保持未開始 cell；未修改 lifecycle，未新增 mercy rule。
21. **Save/load**：真實 saveGame / loadGame 與 normalizeSave 均驗證 mid-half、仍有 future PA 時 projection 完全一致。原 cursor / snapshots 已持久化，不需 schema bump。
22. **Render purity**：重複 renderer / model / projection，整個 match 序列化值、cursor、simulation RNG state 不變；另以 Math.random 拋錯驗證不呼叫 RNG。
23. **Interactive decision path**：真實完整比賽在 decision-ready 先驗 render 不提交結果；正式 choose / settlement 後，對照可見 prefix 的 H/R；未修改 decision / settlement。
24. **AI compressed reveal path**：使用真實 `resolveSimulatedHighSchoolPlateAppearance` 與可重現 sample，保留 AI outcome 和 apply / record 流程。HR 的 hidden run 事件隨同一 PA 邊界提交，不預洩後方 double。
25. **Feed consistency**：保留 formatter 文案與事件選取優先序；移除 model 的舊半局合成 feed 分支，統一呼叫既有 prefix feed。新測試同時確認 HR feed、空壘、H/R/inning；歷史 single scoring feed 的 2：1 驗證保留。
26. **Existing outs/bases regression**：兩套歷史 cursor / snapshot 測試的全部 36 + 20 項保留；守備、tag-up、ground-ball、third-out 與 force 選定回歸通過。沒有把 outs/bases 改回 simulation truth。
27. **Known bug H fixture**：`BUG-SCOREBOARD-H-DELAY-001`；live 半局 single 揭露立即 H0→H1，DOM 的 H 欄也是數字。
28. **Known bug inning-run fixture**：`BUG-SCOREBOARD-INNING-RUN-DELAY-001`；live HR 同步 R0→R2、inning 0→2，另 DOM 單發 HR 驗證 inning 0→1，均不等半局完成。
29. **Future-leak fixture**：`BUG-SCOREBOARD-FUTURE-LEAK-001` 驗 E1/E2；另 isolated official ledger fixture 精確驗 canonical 3：1/H7、prefix 1：0/H3。completed simulation 和 future extra inning 亦不能越過 cursor。
30. **Determinism**：相同 prefix / identity / cursor 得到相同 frozen projection；重複 render 與 save/reload equality 通過。
31. **Instrumentation neutrality**：額外 debug trace on/off 不影響 projection；RNG、canonical match、GameRecord 原始值不變。1,400 場 audit 的 instrumentationNeutral=true、deterministic=true。
32. **Selected tests**：主選定集合 71/71 通過，涵蓋 scoreboard、presentation、GameRecord、competition/evidence、force、third-out、tag-up、ground-ball、player decision、AI/BIP、save。另核對歷史 high-school integration 與 generic infield admission；新增兩套測試最終為 22/22、14/14 通過。機器結果見 validation JSON。
33. **Full regression**：**174/174 PASS、0 FAIL**，含末尾既有 1,400 場 audit；完整執行 522 秒。
34. **Syntax**：262/262 JS/CJS 通過。
35. **1,400-game audit**：**1,400/1,400 完成**（Bench 1,000、Starter 400）；orphan=0、noProgress=0、match-state integrity issues=0、GameRecord integrity issues=0；deterministic=true、instrumentationNeutral=true。Audit 約 202 秒，已包含在 full regression 174 組內，未重複計為額外 suite。
36. **Remaining blockers**：無本 Sprint blocker；所有 PASS Gate 驗證完成。歷史 FC / 未擴建規則保持原範圍。
37. **Next Sprint recommendation**：本輪先等待人工驗收；FC official scoring 等歷史 gap 維持原狀，後續需獨立定義範圍，未開始。
38. **git diff --check**：**PASS**；tracked diff 及四個新增檔案的 whitespace check 均通過。
39. **git status**：`main` 仍為 `6d2336c`，與 origin/main ahead/behind 0/0。6 個 tracked modified + 4 個 untracked：2 production、6 tests、2 docs，詳第 2 項；沒有其他變更。未 commit、未 push。
40. **Stop Conditions**：**A–L 均未觸發**；full regression 0 failure。沒有新增 cursor、RNG、長期 mutable scoreboard，沒有修改 scoring / lifecycle / save contract。

## Historical test reconciliation

先增加新的 canonical prefix / immediate-update 測試，再調整以下已確認問題。沒有刪除測試、減少 assertion、skip 或 allowlist。

| 歷史檔案 | 原問題 | 最小調整 |
| --- | --- | --- |
| baseball-match-foundation-2-1-1-test.js | VM 未載入 GameRecord，fixture 只手填 1：1，沒有 run ledger | 補官方 module 與先前兩筆 run；原 2：1、feed、outs/bases assertions 原樣保留 |
| baseball-match-foundation-2-1-1-1-test.js | 同上；fixture 重置 log 卻欠缺對應 record | 重建 fixture record，先記 1：1 run history 再開始 queue；20 項 assertions 原樣保留 |
| high-school-integration-1-2-2-test.js | snapshot fixture 只手填 3：2 | 補 module 及五筆既有得分 facts，原 snapshot / score assertions 保留 |
| high-school-integration-1-2-2-2-test.js | #2/#5/#10 把 live 定義為省略號、future 為 null；#4 以另一半局 index 控制比分；#11 把未打半局改為破折號 | 補 module；保留每個案例，依新正式 contract 驗 notStarted ellipsis、live 數字、cursor 唯一 authority、終場未打半局。原 timer / playback / save 案例未改 |

Generic infield admission 的開場守位 assertion 未改；移除未揭露 snapshot fallback 後，改從原本入場 `playerFieldingAssignment` 顯示靜態守位。此欄位不參與 R/H/E 或壘況邊界。

## Authority preservation

`docs/baseball-rules-integrity-audit-sprint-1.md`、其 results JSON、force 與 third-out Sprint 文件保持原樣。`getScoreboard`、`recordEvent`、`recordPlateAppearance`、`recordRun`、finalize / restore / assertIntegrity 既有實作未改。

新 immutable query 不呼叫完整 recordEvent 去重演 pitcher / defensive ledger，因為可見前綴可能暫停在互補事件之前；它只重用原有 scoreboard writers。這沒有改變完整 GameRecord 的 validation，也不把部分 ledger 宣告為正式完整記錄。

Projection 每次從 prefix 重建，成本隨已揭露事件數增加；本輪正確性優先，未引入長期 cache。
