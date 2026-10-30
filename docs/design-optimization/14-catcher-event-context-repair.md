# 捕手情境來源矛盾修補（2026-10-30）

程式修補與定向回歸已完成。**頁面限定驗收仍未完成，待修補後人工續驗**；本文件沒有把 Node/VM 結果列為瀏覽器驗收通過。

分支：`fix/catcher-event-consistency-2026-10-30`，從現有 `integration/y1-health-opportunity-2026-10-29` 的 `f239a8daad60fa3a474cdac838aee783ede80333` 建立獨立 worktree：`C:/Users/User/AppData/Local/Temp/baseball-catcher-event-repair-2026-10-30`。沒有合併回 integration。

## 現場保存與取證界線

[現場記錄](catcher-event-repair-v1/scene-before.json) 保存人工回報：高一秋季交流賽、3 局上、0 出局、捕手、空壘；任務稱跑者離壘、觀察稱短打往二壘手、選項要求擋球。本輪 `cua.getState()` 回報 `The browser access host is unavailable`，沒有點擊、刷新、讀寫正式存檔或修改 Player/RNG；未取得人工現場的 live matchId、PA、存檔或截圖。

因此，下述同場同打席追查是明確標記的受控 Node/VM 重現，不冒充人工現場。重現使用正式 `index.html` 的腳本順序和既有測試 helper，沒有替換 production resolver；以 `role=rotation`、捕手、3 局上、0 出局重現相同矛盾。保存[修補前完整資料](catcher-event-repair-v1/reproduction-before.json)與[修補後完整資料](catcher-event-repair-v1/reproduction-after.json)，包含正式 runners、來源 pitch、PA identity、handoff、activeSituation、ballContext、currentAssignment 與合法選項。

[保存檢查](catcher-event-repair-v1/preservation-after.json)：原工作區 4,100 個既有檔案雜湊均未改變，checkpoint 的 HEAD／分支／dirty status 保留，原 integration 仍乾淨、HEAD／script 雜湊未變。完整初始檔案 manifest 留在 scene 記錄所指的外部 evidence 目錄，沒有塞入此修補的程式 diff。

## 第一個來源失配

同場 `hs-y1-autumn-exhibition`、同 PA `hs-y1-autumn-exhibition|3|上|away|regional-power-school-player-08|0|0|falsefalsefalse`：

| 核對項 | 修補前實際資料 |
|---|---|
| 正式壘況 | `runners=[null,null,null]`，`outs=0` |
| 球事件 authority | `offensiveBuntPAState.pitchHistory`：`fairContact / groundBunt / hard / secondBaseSide` |
| 第一個失配 | `ensureHighSchoolBuntBallInPlayHandoff` 對捕手呼叫內野守位推導；`getHighSchoolInfieldAssignmentPosition` 把 rotation fallback 為二壘手 |
| handoff | 以二壘手獲得 `supported=true / favored`，但 match.position 仍是捕手 |
| activeSituation | `null`；沒有另一個正式擋球 situation 可以支持捕手敘事 |
| ballContext | `sourceFamily=bunt`，偏強短打、往二壘手一側 |
| currentAssignment | 「壘上無人，投手的變化球提前落地，跑者同時離壘」 |
| 合法選項 | `secureAndHold / secureAndReset / blockAndControl`，只按捕手守位產生 |

因此錯誤早於文字投影：短打被錯誤准入成玩家二壘手事件，再由捕手分支產生另一種事件的任務與選項。另外，原本一般捕手擋球情境使用 `highChop / groundBall` 當觀察球況，本身也與落地投球不同。

## 最小修改

[程式與測試 diff](catcher-event-repair-v1/minimal.diff) 僅包含三個檔案；production `script.js` 為 **+26/-8**：

- 短打 handoff 保留捕手守位；同 identity 的快取也須符合守位，重建僅使用同 PA 的既有 physical truth，不重抽球事件。
- 捕手短打沿用既有 unsupported fallback，保留短打、落點及正式壘況；不建立假的捕手擋球決策。fallback 的 currentAssignment／播放文字與 ballContext 使用同一來源。本輪沒有新增捕手處理短打的守備能力。
- 一般捕手擋球使用明確 `blockedPitch / pitch` 球況；任務、觀察線索及選項都依此事件。只有正式 runners 有人時才提跑者動向；空壘不顯示抓跑者選項，也不宣稱打者已成跑者。
- 非 `blockedPitch` 不提供捕手擋球 route；既有合法選項檢查在 RNG 前拒絕它。既有 activeSituation 的優先權與阻止重新 prepare 的保護維持。
- 舊捕手 outcome 測試只將 fixture 的 `highChop` 改成 `blockedPitch`；新增一支定向回歸。不調整健康公式或 UI 結構。

若舊存檔已停在矛盾的 catcher decision，本輪會保留其短打線索並拒絕擋球 route；沒有偷偷改寫或自動結算已暫停的存檔。人工續驗應從修補版本的合法入口重現，另行記錄舊現場的續行需求。

## 實際驗證

[原始執行結果與 source hashes](catcher-event-repair-v1/verification.json)，Node `v24.19.0`：

| 測試 | 本輪實際結果 |
|---|---|
| 新增 catcher event context consistency | **21/21 PASS** |
| catcher choice outcome integrity v1 | **20/20 PASS** |
| B2 defensive handoff | **26/26 PASS** |
| B1.0.1 production tactical action | **21/21 PASS** |
| match situation lifecycle | **23/23 PASS** |
| high-school integration 1.2 | 前 7 項 PASS，第 8 項 FAIL；exit 1 |

最後一組在未改的 integration 上也以相同測試 source hash、相同前 7 項通過、相同第 8 項「Moment 1 成功與失敗都離開首段並形成不同教練 context」失敗；[基線比對](catcher-event-repair-v1/baseline-comparison.json)及兩份原始 log 已保存。此組不能列為全數通過，也未為此缺陷擴大修復範圍。

新增回歸涵蓋空壘／有人、短打／擋球類型一致、錯誤快取守位、舊矛盾視圖拒絕擋球、同 PA physical truth／正式壘況／出局／打序／seed／RNG cursor 保留、getter 唯讀、save/load 及 pending activeSituation 保護。修補前同一重現先通過 physical truth 核對，再於「catcher never admitted as second baseman」斷言失敗。

`node --check script.js` 與 `git diff --check` 通過。`verify.cjs` 保留高中整合 suite 的真實失敗 exit code，不用基線相同掩蓋失敗。

沿用原 [7／15／16／12 驗收證據清單](y1-health-integration-acceptance-v1/historical-evidence.json)，本輪核對五份引用檔案 hash 全部相符，均標記 `rerunThisTurn=false`。沒有重跑全專案，沒有把歷史 PASS 宣稱為新程式的全範圍驗證。AGENTS.md 指定的 codebase-memory skill 已讀取；此 session 沒有 graph 工具，來源與呼叫點以精準 source read／rg 核對。

## 頁面續驗：未完成

沿用[既有人工交接](y1-health-page-acceptance-retry-v1/manual-acceptance.md)與原健康機會驗收資料。待修補後實際核對捕手空壘／有人：任務、可見球況、可用選項和同 PA 球事件一致，短打不顯示擋球 route；重繪／Save/Load 不重抽正式球事件或壘況。這些人工項目本輪尚未執行，頁面限定驗收不升格為 PASS。
