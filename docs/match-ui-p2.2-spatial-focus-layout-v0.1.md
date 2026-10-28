# 《棒球人生》UI-P2.2 補充修正 — Spatial Focus Layout Pass v0.1

日期：2026-10-16（Asia/Taipei）  
參考 HEAD：`ab3117653945de0b7013636187c446276a96e634`

**已修改 [離線原型 index.html](../prototype/match-ui-p1/index.html)：移除一壘綠色標示，SS 接球近景固定左側，2B 右側作為明確的版面設定。** 修改前 **94/94 PASS**，修改後 **101/101 PASS**。Browser **NOT RUN**，人工視覺驗收 **PENDING**。

## 1. 修改檔案

| 既有檔案 | 本輪內容 |
|---|---|
| [index.html](../prototype/match-ui-p1/index.html) | 移除一壘占壘綠點；玩家近景的初始位置改至左側 |
| [style.css](../prototype/match-ui-p1/style.css) | 一壘不再套用占壘綠色加粗描邊，壘包沿用中性外觀 |
| [presentation.js](../prototype/match-ui-p1/presentation.js) | 集中 `FOCUS_LAYOUT`，固定 SS 左／2B 右；scene 提供版面位置 |
| [app.js](../prototype/match-ui-p1/app.js) | renderer 依版面設定更新近景紙底與 viewport 位置 |
| [tests/prototype.test.cjs](../prototype/match-ui-p1/tests/prototype.test.cjs) | 新增左側實際 DOM 投影、Replay 與壘況／接傳回歸 |

新增 [tests/spatial-focus.test.cjs](../prototype/match-ui-p1/tests/spatial-focus.test.cjs)、[本輪測試證據](../prototype/match-ui-p1/tests/ui-p2.2-spatial-focus-test-results.json)、本報告與[完整性 evidence](match-ui-p2.2-spatial-focus-layout-v0.1-evidence.json)。所有新增目標在開工時不存在；歷史報告／證據未覆寫。

雙擊 `prototype/match-ui-p1/index.html` 可離線開啟，不需網路或伺服器。

## 2. 一壘標示移除

確認原綠色表現來自一壘壘包上的 `occupant` 圓點與 occupied 狀態的綠色加粗描邊。本輪刪除一壘圓點，並將該綠色描邊規則排除一壘。

一壘群組只剩原壘包 path 與「一壘」名稱，沒有加入替代的小符號、徽章、箭頭或技術文字。局數、比分、出局及「一壘有人」等文字壘況照原資料顯示；occupied class 仍反映正式局勢，只是不再以綠點或綠邊強調一壘。

一壘的重要性由既有一壘手移向壘包、球的傳球路徑、打者跑者接近，以及依時機揭露的判決呈現。接球者與球的共同終點仍為原展示座標 `[268,154]`，沒有更動跑位或判決。

## 3. 近景空間規則

原本在右側的 SS 接球近景已移到左側；採明確的守位版面設定，不跟隨傳球目標跳到另一側。以下為340寬球場 viewBox 的展示座標：

| 守位 | 固定側邊 | 紙底 x | 近景 viewport x |
|---|---|---:|---:|
| SS | 左側 | 6 | 10 |
| 2B | 右側 | 214 | 218 |

紙底仍為120 × 114，viewport仍為112 × 106，玩家裁切區仍為 `[91,85,78,78]`；本輪只調整放置側邊，沒有新增放大動畫或改變播放節奏。近景仍只在玩家 approach／control 顯示，使用原玩家與球的 SVG 引用；一壘接傳、contest、result不顯示近景。

**2B 此次只建立右側版面規則。** 當前固定Fixture仍是SS，沒有新增2B情境、接球資料、選項或結果。未設定的其他守位回傳空版面設定，未來擴充時須依正式角色位置明確指定靠近守區的一側；不猜測球員或比賽資料。

沒有恢復黑色焦點框、金色提示線，沒有新增場上技術標示。位置設定與 `data-side` 是原型內部資料，不顯示為角色代碼。

## 4. 測試與資料保護

開工先執行既有五個 Prototype suites：**94/94 PASS**。施工後：

```powershell
node --test --test-reporter=tap prototype/match-ui-p1/tests/prototype.test.cjs prototype/match-ui-p1/tests/presentation.test.cjs prototype/match-ui-p1/tests/reading-pace.test.cjs prototype/match-ui-p1/tests/markers.test.cjs prototype/match-ui-p1/tests/fielding-receive.test.cjs prototype/match-ui-p1/tests/spatial-focus.test.cjs
```

結果 **101/101 PASS**，exit0、stderr空，測試前後 runtime／fixture hashes 一致。原94項測試全部保留，新增7項驗證：無一壘額外符號、綠邊排除、SS左／2B右、版面尺寸與不可變設定、玩家近景側邊／接傳、無新增技術標示，以及實際 renderer 的左側／Replay回歸。

對照開工快照，validator、Controller與事件描述程式 byte-identical；`TIMING`、`READING`、`POINTS`、`INTENTS` 相同。10個既有scene（Decision、Unsupported、七段Playback、Resolution）只多出 `focus.layout`，其餘投影完全一致。

Fixture、DTO identities、Match Engine未修改。前六段無結果、全部Playback維持Decision記分板、第七段等待確認、Resolution才更新局勢及三條Unsupported的既有回歸均通過。沒有執行Production regression或遊戲模擬。

## 5. Browser、完整性與停止

本輪 CUA inventory 回 `apps: [] / browsers: []`，沒有可用瀏覽器。**Browser NOT RUN；人工視覺／原生鍵盤驗收 PENDING。** DOM adapter未被當作Browser PASS。人工可確認左側近景的空間感、遮擋與小視窗可讀性，以及一壘移除綠色標示後的整體閱讀效果。

開工1903個既有可讀檔案 hashes 全相符；結案只有上述5個授權檔案改動，其餘 **1898個**既有可讀檔案不變。12個protected paths僅metadata-only，未讀取、hash、執行或修改內容。原Production WIP、fixture、契約、歷史報告及測試證據保留。

Git index bytes／entries、branch、HEAD、main、origin/main tracking ref與原tracked WIP status均與開工一致，沒有staged changes。未reset、clean、stash、stage、commit、push；未全域搜尋、使用unscoped diff或重新Graph稽核。完整清單見本輪evidence。

完成補充修正後停止，等待人工體驗驗收。UI-P3／Production Adapter未啟動，Phaser未引入，Match Engine未修改。

Ready for Commit＝**NO**。Ready for Sprint10B＝**NO**。Receiver v2＝**DISABLED**。
