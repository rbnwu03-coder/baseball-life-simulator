# 《棒球人生》Sprint UI-P2.2 — Fielding Focus & First-Base Receive Correction Pass v0.1

日期：2026-10-16（Asia/Taipei）  
參考 HEAD：`ab3117653945de0b7013636187c446276a96e634`

**已修正既有 [離線原型 index.html](../prototype/match-ui-p1/index.html)。** 移除球場焦點黑框與金色提示線；恢復僅用於玩家接近／處理來球的無框近景；6-3傳球時一壘手移向壘包，球與接球者使用相同接傳終點。修改前 **82/82 PASS**，修改後 **94/94 PASS**。Browser **NOT RUN**，人工視覺驗收 **PENDING**。

本輪接續實際工作樹中的 Marker Unification 版本；先前報告與測試證據原樣保留。四個球員本體仍為同尺寸小圓形，守方藍色、攻方暖橘色、玩家金環均保留。

## 1. 修改與新增檔案

| 修改檔案 | 責任 |
|---|---|
| [index.html](../prototype/match-ui-p1/index.html) | 刪除黑色焦點框與金色線條；加入只引用原玩家／球物件的無框局部近景 |
| [style.css](../prototype/match-ui-p1/style.css) | 刪除舊框線與提示線樣式；近景紙底無描邊，背景弱化，Reduced Motion 隱藏近景 |
| [presentation.js](../prototype/match-ui-p1/presentation.js) | 限定玩家近景階段；新增一壘手往壘包的展示動作，讓球與接球者共用終點 |
| [app.js](../prototype/match-ui-p1/app.js) | 改為更新玩家近景 viewport；移除舊黑框尺寸的 DOM 操作，沿用現有動畫管理 |
| [tests/presentation.test.cjs](../prototype/match-ui-p1/tests/presentation.test.cjs) | 更新為玩家限定近景，維持接傳／結果無近景與可讀模式回歸 |
| [tests/markers.test.cjs](../prototype/match-ui-p1/tests/markers.test.cjs) | 保留圓形與尺寸回歸，更新玩家近景例外及固定玩家裁切區預期 |
| [tests/prototype.test.cjs](../prototype/match-ui-p1/tests/prototype.test.cjs) | 新增 renderer 中玩家近景、接球者／球同步動畫及取消動畫回歸 |

新增 [tests/fielding-receive.test.cjs](../prototype/match-ui-p1/tests/fielding-receive.test.cjs)、[本輪測試結果](../prototype/match-ui-p1/tests/ui-p2.2-fielding-receive-test-results.json)、本報告及[本輪 evidence](match-ui-p2.2-fielding-focus-first-base-receive-correction-v0.1-evidence.json)。新增目標於開工時皆不存在。

仍可雙擊 `prototype/match-ui-p1/index.html` 離線開啟；不需伺服器、套件或網路。沒有引入外部資源。

## 2. 焦點元素移除與玩家近景

已從 HTML、CSS 與 renderer 刪除 `focus-frame` 黑框、`speed-lines` 金色提示線及其相關規則。戰術意圖路線與玩家金環保留，沒有拿它們新增裝飾提示線。

`focus-layer` 現在只容納玩家局部近景：紙底 `stroke:none`，以局部 SVG viewport 呈現約1.36倍的輕微放大，弱化場地背景，保留球與玩家的相對位置。這個無框區域可作未來漫畫分鏡的保留位置，本輪沒有新增分鏡流程。

近景只在 Playback 的 `approach`、`control` 顯示；不在 Decision、Submitting、Unsupported、throw、receive、contest、result 或 Resolution 顯示。Reduced Motion／文字模式不顯示局部近景，仍可讀事件與操作控制。

近景直接 `<use>` 原場地、`actor-ss` 與 `ball-marker`；不建立另一份玩家 identity、不複製另一條模擬路徑，也不引用一壘手或跑者群組。玩家及球的主場位置／動畫沿用同一來源。可讀 SVG description 保留，局部視覺複本對讀屏隱藏，避免重複宣告。

## 3. 一壘手跑位與接傳終點

以下座標只屬於既有原型的示意展示，不是新增物理或 Match Engine 結算。

| 階段 | 一壘手展示 |
|---|---|
| Decision／來球／接近／控制球 | 保留原站位 `[280,141]` |
| throw | 對既有6-3、first、completed傳球，動畫由原站位移向壘包 `[268,154]` |
| throw 閱讀停留／receive | 已在壘包，球與接球者座標一致 |
| contest／result／Resolution | 維持壘包位置；沒有一壘接球近景 |
| Replay | 回到原站位，重用原DTO演出 |

傳球階段先決定接球者在壘包的展示位置，再用該位置建立傳球路線與球的動畫終點。新增 `actor-receiver` 的位移與球共用原450ms傳球段落、同一 easing，兩者在段落結束時到達同一位置。receive 不重跑位移：接球者留在壘包，球抵達接球者，打者跑者仍以獨立物件衝向一壘，之後依原順序進 contest。

接球者原 source identity 在 throw 綁定 `receiverId`，receive 延續原 `actorId`；穩定 actor key、原一壘跑者及打者跑者的資料關聯均保留。失敗／未嘗試的傳球不套用這段成功6-3跑位。三條 Unsupported 不借用未揭露的傳球或結果。

位置與動畫只表達固定DTO的經過，不判定 Out／Safe。前六段不顯示結果；整個 Playback 記分板仍為一出局、一壘有人、主0客1。第七段等待確認，Resolution 才依原DTO一次更新為二出局、二壘有人、主0客1。

## 4. 測試與流程保護

修改前執行原四個 Prototype suites：**82/82 PASS**。修改後命令：

```powershell
node --test --test-reporter=tap prototype/match-ui-p1/tests/prototype.test.cjs prototype/match-ui-p1/tests/presentation.test.cjs prototype/match-ui-p1/tests/reading-pace.test.cjs prototype/match-ui-p1/tests/markers.test.cjs prototype/match-ui-p1/tests/fielding-receive.test.cjs
```

結果 **94/94 PASS**、exit 0、stderr 空；測試前後 runtime／fixture hashes 相同。原82項保留，依本輪要求更新近景預期，新增12項專項與 renderer 回歸。沒有執行正式 Match regression。

| 驗證 | 結果 |
|---|---|
| 黑框與金線 DOM／CSS／renderer 引用移除 | PASS |
| 玩家局部近景保留、僅 approach／control、無一壘／結果近景 | PASS |
| 近景只引用原玩家／球，背景弱化、無描邊 | PASS（靜態／投影） |
| 一壘手原站位→throw 壘包終點→receive／contest 維持 | PASS |
| 球、傳球路線、一壘手動畫終點一致 | PASS |
| 接球者與球相同動畫 duration／easing；閱讀停留定格 | PASS（DOM／Web Animations adapter） |
| Pause／Resume／Skip取消／Replay重設；無動畫完成回呼推進流程 | PASS |
| 角色尺寸／圓形／金環／攻守顏色／獨立 identity | PASS（既有回歸） |
| 原DTO、七段順序、結果與Scoreboard reveal gate、三Unsupported | PASS |
| Reduced Motion／文字模式與既有鍵盤／焦點 hooks | PASS（靜態及 DOM adapter） |

對照本輪開工快照，app.js 的 validator、Controller 與事件描述程式完全 byte-identical；`TIMING`、`READING`、`POINTS`、`INTENTS` 相同。Decision、Unsupported、七個Playback與Resolution共10個scene，排除本輪允許改動的 focus、接球者位置及新增接球者位移後，其他投影完全一致。因此沒有變更互動流程、閱讀策略、正式結果或揭露時機。

## 5. Browser／人工驗收

本輪 CUA inventory 為 `apps: [] / browsers: []`，沒有可用瀏覽器。**Browser NOT RUN；人工視覺／真實鍵盤／讀屏驗收 PENDING。** Node DOM／Web Animations adapter 不等於真正瀏覽器。

人工待驗：玩家無框近景是否清楚、局部放大與背景弱化是否合適、實際瀏覽器中 SVG `<use>` 是否跟隨原玩家／球動畫、一壘手與球的接傳是否自然、不同視窗及縮放下有無遮擋。本輪沒有取得真實頁面截圖，也不宣稱上述視覺已通過。

## 6. 完整性與停止

開工1899個既有可讀檔案 hashes 全相符；結案只有上述7個授權Prototype檔案變動，其餘 **1892個**既有可讀檔案不變。fixture.js、正式DTO契約、Production WIP、前輪報告與歷史測試證據均未改動。12個 protected paths 僅 metadata-only，未讀取、hash、執行或修改內容。

本輪 Git index bytes／entries、branch、HEAD、main、origin/main tracking ref、原 tracked WIP status 均與開工一致，沒有 staged changes；未 reset、clean、stash、stage、commit、push，未使用 unscoped diff、全域搜尋或重新 Graph 稽核。詳見本輪 evidence。

| Gate | 狀態 |
|---|---|
| `prototype/match-ui-p1/index.html` 真正存在 | **YES** |
| 本輪修正／Prototype tests | **COMPLETE／94 PASS** |
| Browser／人工驗收 | **NOT RUN／PENDING** |
| UI-P3／Production Adapter／Phaser／Match Engine 修改 | **NOT STARTED／NOT INTRODUCED／UNCHANGED** |
| Ready for Commit | **NO** |
| Ready for Sprint10B | **NO** |
| Receiver v2 | **DISABLED** |

完成本輪小修正與 Prototype 測試後停止，等待人工體驗驗收。
