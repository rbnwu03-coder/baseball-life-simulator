# 《棒球人生》Sprint UI-P2.2 — Marker Unification & Focus Simplification Pass v0.1

日期：2026-10-16（Asia/Taipei）  
參考 HEAD：`ab3117653945de0b7013636187c446276a96e634`

**已完成既有 [離線原型 index.html](../prototype/match-ui-p1/index.html) 的圖示與近景小修正。** 四名球員本體統一為半徑8.5的圓形；玩家保留金色外環；獨立接球近景 SVG 已移除。Prototype baseline **75/75 PASS**，施工後 **82/82 PASS**。Browser **NOT RUN**，人工體驗驗收 **PENDING**。

## 1. 修改檔案與範圍

| 既有檔案 | 修改內容 |
|---|---|
| [index.html](../prototype/match-ui-p1/index.html) | 四個 actor-body 統一小圓形；縮小金環、移除玩家底部指示；刪除獨立近景層，更新說明與版本標示 |
| [style.css](../prototype/match-ui-p1/style.css) | 統一本體描邊、縮小金環描邊，刪除近景及底部指示樣式；攻守色碼保留 |
| [presentation.js](../prototype/match-ui-p1/presentation.js) | 關閉獨立近景；刪除接球者裁切座標，接傳／競速／結果階段不顯示接球者框或暗化主場 |
| [app.js](../prototype/match-ui-p1/app.js) | 移除近景 DOM 操作，將可讀替代資訊中的「不同形狀」改為位置／路線／動作 |
| [tests/presentation.test.cjs](../prototype/match-ui-p1/tests/presentation.test.cjs) | 更新近景移除預期，保留場上焦點、身份及 reveal 回歸 |
| [tests/reading-pace.test.cjs](../prototype/match-ui-p1/tests/reading-pace.test.cjs) | 更新金環規格與取消底部指示的預期 |
| [tests/prototype.test.cjs](../prototype/match-ui-p1/tests/prototype.test.cjs) | 新增實際 renderer 的接球無近景／閱讀階段／結果揭露回歸 |

新增 [tests/markers.test.cjs](../prototype/match-ui-p1/tests/markers.test.cjs)、[本輪測試證據](../prototype/match-ui-p1/tests/ui-p2.2-test-results.json)、本報告及[完整性 evidence](match-ui-p2.2-marker-unification-focus-simplification-v0.1-evidence.json)。沒有覆寫歷史報告或測試證據。

雙擊 `prototype/match-ui-p1/index.html` 即可離線開啟。無需伺服器、安裝或網路。

## 2. 統一前後規格

下列尺寸為 SVG 座標單位，不含描邊；顯示尺寸隨原球場 viewBox 等比例縮放。

| 角色 | UI-P2.1 本體 | UI-P2.2 本體 |
|---|---|---|
| 玩家守備員 | 圓形，r14／直徑28 | 圓形，r8.5／直徑17 |
| 守備隊友 | 方形，26 × 26 | 圓形，r8.5／直徑17 |
| 原一壘跑者 | 六角形，約22 × 24 | 圓形，r8.5／直徑17 |
| 打者跑者 | 三角形，28 × 25 | 圓形，r8.5／直徑17 |

以各角色原本最長邊比較，縮小約29%～39%（一般26～28尺寸約35%～39%）。全部本體共用1.6描邊，沒有任何角色專屬放大或縮放規則。

守方保持藍色 `#3d668d`，攻方保持暖橘色 `#b87b4c`。玩家的額外金環保留 `#b28b3c`，半徑由20改為12，一般描邊1.8；Decision 用較深金色及2.8描邊提高辨識。金環是玩家識別裝飾，四個本體尺寸完全一致；玩家原底部三角指示已刪除。其餘角色沒有額外造型差異。

角色的 DOM 物件、穩定 actor keys、原始 source identity、動畫物件與 runner 關聯均保留。原一壘跑者與打者跑者仍為兩個獨立移動物件。球、壘包、占壘圓點不屬於球員圖示，沒有因此改尺寸。

操作說明與 SVG accessible description 改以位置、路線、動作及玩家外環輔助辨識，不再宣稱使用不同角色形狀。自然語言角色名稱、文字占壘、結果焦點與 aria-live 保留。

## 3. 接球近景移除方式

直接刪除共用 `focus-inset-panel`、巢狀 `focus-inset` SVG、其 `<use>` 複本及近景 CSS／renderer 操作。這個層原本用於玩家接滾地球及一壘接傳的特寫；本輪全程不再產生獨立接球近景畫面。投影的相容欄位 `focus.inset` 固定為 false。

主球場 viewBox 仍為 `0 0 340 285`。保留主場的來球、守備員接近、接球、傳球與跑者移動，以及玩家在主場的焦點提示。接傳／競速／結果階段取消接球者框及主場暗化；原有傳球路線高亮仍在主場顯示，沒有另加動畫或新的互動流程。

## 4. 隔離測試與資料邊界

修改前先執行原三個 Prototype suites：**75/75 PASS**。施工後命令：

```powershell
node --test --test-reporter=tap prototype/match-ui-p1/tests/prototype.test.cjs prototype/match-ui-p1/tests/presentation.test.cjs prototype/match-ui-p1/tests/reading-pace.test.cjs prototype/match-ui-p1/tests/markers.test.cjs
```

結果 **82/82 PASS**、exit 0、stderr 空；測試前後原型／fixture hashes 相同。保留原75項測試，更新本輪刻意變更的圖形與近景預期，新增7項尺寸、形狀、金環、配色、無近景及 renderer 檢查。只有 Prototype 測試，沒有正式 Match regression。

| 檢查 | 結果 |
|---|---|
| 四角色同為圓形、同r8.5、相同描邊，無專屬尺寸覆寫 | PASS |
| 唯一玩家金環、攻守同隊同色、自然語言替代資訊 | PASS |
| 獨立近景 DOM／CSS／renderer 引用已移除 | PASS |
| 接傳／競速／結果在動畫與閱讀停留階段均無接球框 | PASS（投影及 DOM adapter） |
| DTO identities、七段順序、獨立跑者綁定、Fixture bytes | PASS |
| 前六段不揭露結果，全部 Playback 記分板保持 Decision | PASS |
| 第七段等待確認，Resolution 才更新二出局／二壘有人／主0客1 | PASS |
| 三 Unsupported、防重提交、Pause／Resume／Next／Skip／Replay／Continue | PASS |
| Reduced Motion／文字模式、Debug 預設關閉、焦點／aria-live hooks | PASS（既有靜態及 DOM adapter 回歸） |
| 無 Production／Phaser／CDN／外部資源 | PASS |

額外對照開工快照：`app.js` 中 mount 之前的 validator、Controller 與事件描述程式保持 byte-identical；`TIMING`、`READING`、`POINTS`、`INTENTS` 完全一致。Decision、Unsupported、七個 Playback 與 Resolution 共10個 scene 投影，除 focus 欄位外全部相同。沒有變更 DTO、棒球結果、reveal gate、Unsupported 邏輯或播放／閱讀流程。

## 5. Browser 與人工驗收

本輪 CUA inventory 仍回 `apps: [] / browsers: []`，沒有可用瀏覽器。**Browser NOT RUN；真實鍵盤、讀屏與人工視覺驗收 PENDING。** Node 的 SVG／DOM adapter 不是瀏覽器驗收，沒有據此宣稱 Browser PASS。

人工可確認17單位圓形在桌面與窄螢幕是否足夠清楚、玩家金環辨識度、跑者在相近位置時是否容易追蹤，以及接球時主球場是否更清爽。未新增切換模式或操作步驟；實際版面、縮放與色辨仍需真人確認。

## 6. 完整性與停止

開工核對 UI-P2.1 保存的1895個既有可讀檔案，全部 hashes 相符。結案僅上述7個授權 Prototype 檔案改動，其餘 **1888個**既有可讀檔案不變；fixture.js、正式 DTO契約、Production WIP、歷史報告與歷史測試證據保留。12個 protected paths 僅比較 metadata，未讀取、hash、執行或修改內容。

本輪開工另保存 `.git/index` binary hash。結案 index bytes／entries、branch、HEAD、main、origin/main tracking ref、原 tracked WIP status 均與本輪開工一致，沒有 staged changes。未執行 reset、clean、stash、stage、commit、push、unscoped diff、全域搜尋或 Graph 稽核。詳細前後清單見本輪 evidence。

| Gate | 狀態 |
|---|---|
| `prototype/match-ui-p1/index.html` 真正存在 | **YES** |
| UI-P2.2／Prototype tests | **COMPLETE／82 PASS** |
| Browser／人工驗收 | **NOT RUN／PENDING** |
| UI-P3／Production Adapter／Phaser／Match Engine | **NOT STARTED／NOT INTRODUCED／UNCHANGED** |
| Ready for Commit | **NO** |
| Ready for Sprint10B | **NO** |
| Receiver v2 | **DISABLED** |

完成本輪小修正與 Prototype 測試後停止，等待人工體驗驗收。
