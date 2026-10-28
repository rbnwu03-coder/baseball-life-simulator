# 《棒球人生》Sprint UI-P1 — Decision / Resolution Offline Prototype v0.1

日期：2026-10-16（Asia/Taipei）  
參考 HEAD：`ab3117653945de0b7013636187c446276a96e634`

**已實際建立可操作的 [prototype/match-ui-p1/index.html](../prototype/match-ui-p1/index.html)。** 這次交付包含 HTML、CSS、JavaScript、固定 Fixture 與隔離測試，未重新產生或修改既有資料契約。實作完成；瀏覽器／人工視覺驗收待確認。

## 1. 新增檔案與開啟方式

所有目標在開工時均不存在，未遇到目標衝突；本輪只建立以下10個檔案：

| 檔案 | 責任 |
|---|---|
| [index.html](../prototype/match-ui-p1/index.html) | 可直接開啟的離線頁面、靜態 SVG、原生 controls、各 phase 的語意區塊 |
| [style.css](../prototype/match-ui-p1/style.css) | 原型專用紙感版面、PC-first 響應式、focus-visible、reduced-motion |
| [app.js](../prototype/match-ui-p1/app.js) | 獨立 state machine、計時器、提交鎖、嚴格資料檢查、文字／DOM 投影 |
| [fixture.js](../prototype/match-ui-p1/fixture.js) | 原 evidence.examples 的精確、遞迴 frozen 複本；沒有其他路線結果 |
| [README.md](../prototype/match-ui-p1/README.md) | 開啟方式、操作、測試命令與限制 |
| [tests/prototype.test.cjs](../prototype/match-ui-p1/tests/prototype.test.cjs) | 僅載入原型自身程式的隔離測試 |
| [tests/prototype-test-results.json](../prototype/match-ui-p1/tests/prototype-test-results.json) | 先前27項通過的完整 TAP／stderr／hashes；保留首次測試 helper 修正說明 |
| [tests/prototype-test-results-final.json](../prototype/match-ui-p1/tests/prototype-test-results-final.json) | 最終28項測試的完整執行證據與瀏覽器工具限制 |
| 本文件 | 實際交付報告 |
| [offline-prototype evidence](match-ui-p1-offline-prototype-v0.1-evidence.json) | 開工／結案 hash、protected metadata、檔案清單、測試與 gates |

在檔案總管雙擊 `prototype/match-ui-p1/index.html`，或將它拖入瀏覽器。保持四個 runtime assets 同資料夾即可；不需安裝套件、網路、CDN、fetch 或本地伺服器。

頁面頂部固定標示：`OFFLINE DEMO — NOT CONNECTED TO MATCH SIMULATION`。CSP 禁止 connect，程式沒有呼叫 Production resolver、Save、Phaser 或其他正式 modules。

## 2. 唯一固定來源與畫面

資料只來自既有 [contract evidence](match-ui-slice-data-contract-v0.1-evidence.json) 的 `examples.decision`、`examples.playback`、`examples.resolution`。沒有讀取或執行前輪 scenario／observer／adapter 來補資料，也沒有從結果回推能力。

fixture.js 的整個物件與 evidence.examples deep-equal；全部四個 choices 的原順序、routeId／matchDecision／matchMomentId、所有原始文字、七個 eventId／presentationSequence 與 Resolution 均保留。原始 situationText 既有的重複標點也保持原文。

Decision 優先顯示四局上、一出局、主0客1、一壘有人、玩家 SS，再呈現球場示意、原 situationText 與四張選項卡。每張卡顯示 label、objectiveText、risk 及 routeLabel；未新增 meaningful／executionOnly 分類。四個 observations 都是 null，因此沒有空白觀察欄。

紙感色系參照根目錄 style.css 中有限的 `.match-mode` 規則（例如 `#f7f0e4`／`#eee4d5`、細框與低陰影），實際全部樣式放在原型資料夾，未修改根 stylesheet。視覺以大字級局勢、文字選項、漫畫畫框與留白為主；未引入字型服務或外部素材。SVG 只表示壘包、occupancy 與 SS，沒有物理計算。

## 3. 四條選項的實際行為

| 原順序／routeId | matchDecision／routeLabel | 操作結果 |
|---|---|---|
| secureFirstBaseOut | secure／6-3 | Decision → Submitting → Playback；立即鎖住本次選擇，約420ms後開始固定演出 |
| forceSecond | forceSecond／6-4 | Decision → Unsupported；顯示所選原 label，提供「返回選擇」 |
| startDoublePlaySecond | challenge／6-4-3 | 同上；不套用6-3結果 |
| holdBall | contain／持球 | 同上；不生成持球結果 |

Unsupported 返回時恢復原選項焦點。這些行為都是離線狀態切換；沒有呼叫 `resolveHighSchoolYearOneMatch`，也沒有生成任何新 Match result。

## 4. Playback／Resolution／Continue

Playback 依原 DTO 次序顯示 ballInPlay → approach → control → throw → receive → contest → result。畫面只建立已揭露的歷史階段，資料識別展開區顯示當前 eventId、presentationSequence、type。

前六段不顯示 result beat，也不填寫 outcomeText／feedbackText／路線結果 DOM。contest 僅描述正在比較到壘時序，不提前顯示成功出局；第七段才依正式 result payload 顯示本球新增出局與 error flag。這些是固定 DTO 的中文演出說明，不創作另一條路線的結果。

**全部 Playback（含第七段）的記分板仍保持 Decision：一出局、一壘有人、主0客1。** 七段讀完或玩家略過演出後才進 Resolution，更新為四局上、二出局、二壘有人、主0客1，呈現原 outcomeText／feedbackText、selectedRouteId／actualRouteId。打者出局、原一壘跑者進二壘由原 Resolution 敘事提供；不顯示終場1：7或 quality 評分。

控制包含暫停、繼續、自動播放、下一段、略過及結果後重播。每段自動展示約2.8秒，這是演出節奏，不是棒球時間窗。prefers-reduced-motion 下預設暫停供逐段閱讀；使用者仍可明確開啟自動播放。

完整實作 Loading → Decision → Submitting → Playback → Resolution → Continue，以及 Unsupported、DataError。固定資料缺少必要欄位、未知 schema、錯 identity／順序／依賴時進入可閱讀 DataError，不補假值。

- 同一示範回合只接受一次6-3提交；同步鎖定，重複點擊不建立第二個 Playback。
- Replay 重用原 DTO／eventId，清除上一輪 outcome DOM 與 aria-live 文字，記分板回到 Decision 的演出起點；不重新提交。
- Skip 僅切換到同一 Resolution，取消舊 timer；重複 Skip 為 no-op。
- Continue 只結束示範；重複 Continue 為 no-op，不推進比賽、不重新 settle。
- Continue 後可明確「重新開始示範」，建立新的 UI session。舊回呼帶有 epoch guard，不能改動新 session。
- Fixture 的物件／陣列遞迴 freeze；UI phase、提交狀態、計時器與重播次數都存在分離的 Controller 中。

## 5. 自動測試與瀏覽器結果

唯一測試命令：

```powershell
node --test --test-reporter=tap prototype/match-ui-p1/tests/prototype.test.cjs
```

最終 **28/28 PASS**，exit0、stderr 空、來源 hashes 執行前後一致。測試只使用 Node 內建模組與本原型程式，沒有 Production imports、正式 regression、scenario execution 或網路依賴。

| 驗證 | 結果／界限 |
|---|---|
| DTO identities、choices順序、七段排序與原文 | PASS；精確對照既有 evidence.examples，並核對來源 SHA-256 |
| Decision 無結果欄、前六段無 result、Playback 記分板不變 | PASS；Controller 與 renderer adapter 都檢查 |
| 三條 Unsupported 不進6-3結果 | PASS；逐一驗證 |
| Resolution 更新、無終場混入 | PASS；二出局／二壘／主0客1，原 outcome／feedback |
| 提交防重、pause／resume／next timer、Replay／Skip／Continue | PASS；含 stale callback／重新開始隔離 |
| Fixture 不變、無 Production／Phaser／CDN／fetch | PASS；全部互動後仍 byte-equivalent；runtime資源均為相對本地檔案 |
| 一般 script 標籤啟動路徑 | PASS（VM adapter）；模擬 DOMContentLoaded，執行 fixture.js／app.js 的非 CommonJS 分支 |
| Native buttons／focus／null observations／結果 aria-live | PASS（靜態與小型 DOM adapter）；不等於真正的鍵盤或讀屏 smoke |
| 實際 Browser smoke／視覺版面 | **NOT RUN**；工具 inventory 無可用 browser，IAB 回 `Browser is not available: iab`，Chrome 回 `Browser is not available: chrome` |

首次隔離執行為26/27：缺失 fixture 測試中的 helper 預設參數誤把 undefined 換回正常 Fixture。修正測試直接將缺失資料交給實際 validator 後27/27通過；之後補上 classic-script 啟動測試並修正 reduced-motion 說明文字，最終28/28。先前成功 run 的完整 capture 保留，沒有將中途失敗改稱 PASS。

## 6. 鍵盤與可讀性

所有操作使用原生 button，不自訂 keydown／preventDefault，因此保留瀏覽器 Tab、Enter／Space 行為。明確 focus-visible、Submitting disabled／aria-busy、畫面切換焦點、Unsupported 返回焦點、播放控制焦點保留、Resolution 標題焦點與 aria-live 均已實作；文字安全地以 textContent 填寫。

占壘同時有圓點與文字，SVG有title／desc，Canvas不是資訊入口；無JS時提供 noscript 說明，所有狀態都有文字。

**人工待驗：** 真正瀏覽器中完整 Tab／Enter／Space 流程、焦點環可見性、讀屏宣告次數、不同螢幕寬度、縮放200%、本地 file URL 的 script／CSP 行為。Node 的小型 DOM／VM adapter 沒有排版引擎或原生鍵盤行為，未宣稱 Browser PASS／完整 accessibility audit。

## 7. 已知限制與 UI-P2 建議

本原型為固定6-3互動示範，完整離線資料可在原始碼或開發者工具中檢視；phase gate 只控制畫面，不是敏感資料存取隔離。沒有 Production Adapter、Save、cold reload receipt、實際模擬、Phaser 或其他選項的 execution。

UI-P2 最小建議先人工驗收本地瀏覽器與鍵盤／讀屏，確認資訊層級及節奏，再另行決定是否製作安全 DTO adapter、正式提交 receipt 與既有 cursor 整合。其他路線的實際結果必須來自正式 owner，不能由這份固定 Fixture 延伸猜測。本輪不開始上述工作。

## 8. WIP／protected integrity 與停止

開工先確認所有目標不存在。沿用前輪1873檔 hash manifest，再保護兩份既有契約檔，共1875個原有可讀檔案；開工及結案全部 hash 一致。12個 protected paths 只觀察 Git status／size／mtime，不讀取、hash、執行或修改內容。

branch／HEAD／main／origin/main tracking ref／index／原 tracked WIP 均不變；沒有 staged changes，也未 fetch 或重查遠端。既有根 index.html、style.css、script.js、save.js、Match modules、tests、fixtures、runner、registry、原 captures與契約均未改動。正式 Snapshot 四檔原 hash 保留。

Source 文字讀取限既有契約／JSON、hash manifest 的資料欄位、根 stylesheet 的 `.match-mode` 樣式及本原型自身檔案；其他既有檔案只依1873清單做 byte hash。沒有全域搜尋、unscoped git diff 或 Graph 稽核。工具技能文件的讀取僅供 Browser 工具操作，不作遊戲資料來源。

結案詳見 [evidence](match-ui-p1-offline-prototype-v0.1-evidence.json)。新增 scope 僅為前列10檔；未 Commit／Push。

| Gate | 判定 |
|---|---|
| `prototype/match-ui-p1/index.html` 真正存在 | **YES** |
| Offline Prototype 實作／隔離測試 | **COMPLETE／28 PASS** |
| Browser smoke／人工驗收 | **NOT RUN／PENDING** |
| Production Adapter／Phaser | **NOT STARTED／NOT INTRODUCED** |
| Ready for Commit | **NO** |
| Ready for Sprint10B | **NO** |
| Receiver v2 | **DISABLED** |

完成原型與必要隔離測試後停止，等待人工驗收。
