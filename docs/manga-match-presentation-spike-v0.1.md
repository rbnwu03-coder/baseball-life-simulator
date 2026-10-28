# 《棒球人生》Manga Match Presentation Spike v0.1 — SS 6-3

日期：2026-10-16（Asia/Taipei）  
Branch：main；HEAD：`ab3117653945de0b7013636187c446276a96e634`，保留既有 WIP。

**獨立漫畫式實驗切片已建立，共用 UI-P2.3 的資料、Controller、renderer 與球場動作，沒有修改任何既有檔案。** UI-P2.3 基線 **120/120 PASS**；新增最少必要的 8 項隔離測試，最終 **8/8 PASS**。Browser **NOT RUN**，人工比較 **PENDING**。尚不能判定哪版較容易理解或更有投入感。

- [開啟漫畫 Spike](../prototype/manga-match-spike/index.html)
- [開啟 UI-P2.3 基準](../prototype/match-ui-p1/index.html)
- [本輪 evidence](manga-match-presentation-spike-v0.1-evidence.json)

## 1. 定位、開工與檔案範圍

本輪是單一已驗證 SS 6-3 歷史事件的 PC 離線呈現實驗；不是正式 UI-P3，不是通用漫畫引擎。四個原合法選項、三個 Unsupported、所有 formal reveal gates 及已驗證事實保留。

開工對照 UI-P2.3 evidence，1,918 個既有可讀檔案 hash 全相符；前輪 artifacts 無差異，12 個 protected paths 的 metadata 相符。原 13 個 tracked WIP status 保留，未清理 WIP。下列六個新增目標在施工前均不存在；既有檔案修改 allowlist 為空。

| 新增檔案 | 用途 |
|---|---|
| `prototype/manga-match-spike/index.html` | 獨立入口、相同 HTML/SVG 舞台、畫框章節標題、另開基準版連結 |
| `prototype/manga-match-spike/manga.css` | 僅此入口採用的分格、留白、文字層級與當前單位強調 |
| `prototype/manga-match-spike/manga.js` | 目前已呈現 phase／stage → 敘事單位的只讀映射與 DOM observer |
| `prototype/manga-match-spike/tests/manga.test.cjs` | 8 項隔離整合、DOM／VM 與資料保護測試 |
| 本報告 | 實驗對照、規則、限制與人工比較方法 |
| 本輪 evidence | 執行紀錄、hash、Git／WIP／protected 與來源紀錄 |

使用 codebase-memory 技能的 Tier 2。精確 Prototype 符號查詢未找到已索引節點，相關 exact-path coverage 為 `not_tracked`；採用目前 source 讀取及實際隔離測試補查，不作不存在／全域完整性結論。Graph generation 為 `2026-10-15T01:30:19Z`，未 reindex。初次技能檔 sandbox 讀取 denied，隨後 exact-path read-only escalation 成功。

## 2. 共享來源與離線載入

兩個入口直接載入同一批檔案：

| 資源 | 共享責任 |
|---|---|
| `../match-ui-p1/style.css` | UI-P2.3 基礎樣式、可及性與顏色 |
| `../match-ui-p1/fixture.js` | 原 v0.1 七段 Playback，原 fixture 完全不變 |
| `../match-ui-p1/presentation-v02.generated.js` | 同一份已產生、驗證、凍結的 v0.2 Decision／Resolution 與 provenance |
| `../match-ui-p1/presentation.js` | 同一 SVG scene、身份、示意跑位、時間與閱讀設定 |
| `../match-ui-p1/app.js` | 同一 Controller、renderer、版本路由、互動及揭露權 |

其後只載入本入口的 `manga.js`。共享 app 仍自行 boot 與 mount；漫畫模組不 mount app、不建立 Controller、不 connect DTO、不讀 fixture／未來 Playback／Resolution，也不持有 controller handle。它只觀察已由原 renderer 寫入的 `data-phase`、`data-stage`、`data-text-mode`、`data-playback-stage`，以及 Reduced Motion preference。

一個 MutationObserver 在原 DOM render 之後更新自己的章節標題與 `data-manga-unit`。只觀察上述四個屬性，排除自己的輸出，避免循環；pagehide 解除 observer 與 preference listener。這不是第二套 playback 或 reveal gate；即使章節標記缺失，正式結果仍由原 app 控制。

HTML shell 為獨立呈現版本，保留共享 app 所需的 IDs。整個 field SVG 區塊與基準逐 byte 相同，並有測試防止兩入口舞台 drift。沒有複製 JavaScript Controller、模擬或結算實作，也沒有複製出另一份 fixture／DTO／generated asset。

v0.2 資料仍由 UI-P2.3 原產生器及正式 contract 流程來源驗證；本輪直接重用該產物，沒有建立第二個 exporter 或重新產生資產。基線既有測試中的 deterministic check 會作一次離線契約投影／驗證，沒有遊戲執行或新比賽結果；Spike runtime 與 Replay 均不做投影。

所有 scripts 與 CSS 都是相對本地路徑、classic defer；CSP `connect-src 'none'` 保留，沒有 server、CDN、fetch、安裝依賴、bundler、Phaser、iframe、eval 或新增插畫。瀏覽器直接雙擊使用的資源配置已完成，實際 file:// Chrome 載入仍待人工驗收，不能用 VM PASS 替代。

## 3. 五個敘事單位映射

這是同一舞台中的五種閱讀強調，不是五頁，也不增加一輪操作。

| 敘事單位 | 原 phase／beat | 畫框與觀看目的 | 揭露限制 |
|---|---|---|---|
| 01 Wide Field | Decision（含 incomingBall／fieldingFocus）、Submitting；Playback ballInPlay | 完整球場與跑者，建立局勢；同欄原敘事、原四個選項 | Decision 不查未來事件；observations null 時保留 situationText |
| 02 Fielding Focus | Playback approach、control | 原左側 SS 接球近景，加章節提示；主場跑者仍在 | 不顯示傳球完成或結果；Reduced Motion／文字模式改用文字提示 |
| 03 Action Sequence | Playback throw、receive、contest | 主球場跟讀傳球、接傳點與跑者；只改畫框頂邊強調及當前觀看提示 | 不新增接球端近景，不改動作、身份或目的地 |
| 04 Impact Frame | Playback result，涵蓋 animation／readingHold／awaitingConfirmation | 判決文字字級與框線加重，既有 hold 保留 | 正式局勢仍為 Decision state，v0.2 Resolution 尚未寫入 DOM |
| 05 Consequence Frame | Resolution 且已呈現 stage=resolution | 正式局勢差異與策略回顧置於清楚的結果畫框 | 只能由原最後確認進入；不加策略評語 |

Unsupported 只保留 Wide 的選擇上下文與「尚未收錄／返回」提示，不對應 Impact 或 Consequence。Loading、DataError、Continue 及未知／不相容的 phase-stage 組合沒有漫畫單位。Decision 即使收到 stage=result／resolution，映射仍只會是 Wide，不借用結果。

## 4. 畫框與視覺規則

球場是主舞台：相較基準將主球場欄稍加寬，完整保留 viewBox、球員、壘包、傳球終點與兩名跑者。章節編號、標題與觀看提示放在 SVG **外側上方**；不在球場內疊卡片或遮罩。

| 單位 | 有目的的框線差異 |
|---|---|
| Wide | 完整主球場框與基本資訊欄建立閱讀範圍 |
| Fielding | 上緣改為守方藍，呼應原左側玩家近景 |
| Action | 上緣以暖色區分動作閱讀，提示沿傳球方向並兼看跑者 |
| Impact | 主球場邊框與判決資訊框用深綠強調，標題加大；沒有額外閃光或畫面震動 |
| Consequence | 原結果摘要加淺底與框線，讀出局數、比分及原目標／實際結果 |

不恢復舊的黑色焦點裝飾框或金色放射線；沒有新增速度線。敘事框是含明確標題的外部閱讀區，不是玩家身上多出的黑色矩形。原左側玩家近景不增加邊框、不換座標；2B 右側規則來自共享 presentation，只保留規則、不新增場景。接球端仍沒有獨立近景，一壘仍沒有綠色占壘點／綠邊。

沒有改動 SVG 幾何、裁切參數、跑位、球／一壘手共同接傳終點、圖示大小形狀或攻守顏色。漫畫 CSS 不使用 absolute／fixed、overflow:hidden、clip-path 或新增 animation；所有新增標題及框線在正常文流中，避免覆蓋比分與球場。靜態規則與 DOM 測試不能認證實際視窗下沒有遮擋或捲動負擔，這部分仍待 Browser／人工檢查。

小視窗在 700 CSS px 以下改為單欄；不鎖住頁面高度或滾動。文字模式保留全部原文字與控制，Reduced Motion 保留同一閱讀順序、原預設暫停與文字替代提示。

## 5. 原 UI-P2.3 與漫畫版對照

| 項目 | UI-P2.3 基準 | Manga Spike | 待驗證的取捨 |
|---|---|---|---|
| 局勢建立 | 球場與決策資訊並置 | 主球場較寬，外部章節標題指向當前閱讀目的 | 來球／跑者是否更易被注意；新增標題是否搶讀敘事 |
| 選項理解 | 路線／目標／風險的四個 buttons | 相同原文、順序與操作，未另開決策頁 | 漫畫框能否維持選項清晰，而非造成分心 |
| 接球焦點 | 左側 SS 近景 | 完全相同近景，章節 02 提醒看玩家與場上跑者 | 是否幫助視線移動；是否只是重複提示 |
| 傳球與競速 | 依原七 beats 自動／逐段播放 | 章節 03 跨 throw／receive／contest，提示依目前 beat 改變 | 同一連續動作是否更容易跟讀 |
| 判決瞬間 | result beat 的判決與原 reading hold | Impact 框與字級強調，停留／確認時間完全相同 | 張力是否提升；是否讓判決與正式結算更容易混淆 |
| 後果理解 | 原 stateChange／selectedObjective／achievedOutcome 摘要 | 同一摘要置於 Consequence 框 | 1→2 出局及兩名跑者身份是否更清楚 |
| 閱讀負擔 | 原版文字與資訊層 | 多一行章節名與觀看提示、主球場較大 | 200% Zoom 的頁面高度、跨欄視線與捲動成本可能增加 |

上述是設計差異與待驗證假設；**沒有受試者比較結果，不宣稱漫畫版勝出**。沒有以動畫數量、測試數量或畫面華麗度作為使用者理解的代理指標。

## 6. 演出節奏與互動保護

時間參數沒有差異，僅視覺分組不同。共享原設定如下（ms）：

| beat | 動作時間 | reading hold 下限 |
|---|---:|---:|
| ballInPlay | 450 | 850 |
| approach | 1100 | 650 |
| control | 850 | 1400 |
| throw | 450 | 850 |
| receive | 600 | 850 |
| contest | 1100 | 1700 |
| result | 900 | 1200 |

reading hold 仍依原文字長度每字 40ms 及 accessible minimum 1400ms 取較長值。result 原本就需要明確確認，本輪沒有新增 timer、延遲、點擊頁或自動推進權。沒有用長時間動畫換取張力。

漫畫單位在目前 beat／phase 改變時更新，animation → readingHold 時保持同一畫框；不替換按鈕、不移動焦點、不攔截鍵盤、不 scrollIntoView。DOM 測試確認同一 next-beat button 在七段之間保留 reference 與 focus。章節沒有 aria-live，保留原狀態／結果 announcement，避免多一層自動朗讀。

- Decision 保留四個可操作的原合法選項、原敘事與 null observations fallback；不引入品質、球速、成功率或最佳路線。
- Playback 前六段不顯示結果；Impact 只能顯示原 result 判決，記分板仍為一出局、一壘有人。
- 最後確認後才由原 app 寫入 v0.2 Resolution：出局數 1→2、主0客1不變、打者出局、原一壘跑者推進二壘。原目標、原文回饋、verified tradeoff 及 null-only 新評語政策保持。
- Skip 保留原 v0.2 行為：停在 result／awaitingConfirmation，不能直接到 Consequence；快速連點受原 guard 保護。
- Replay 清空結果文字並回到 Wide；重用相同凍結 DTO、原 Playback references，不重新 connect、模擬或結算。
- Pause／Resume 保留動作／reading hold 剩餘時間；Reduced Motion／文字模式仍預設暫停，可閱讀、逐段或繼續。

本輪仍是既有靜態已驗證資料的 UI 呈現。共享資產內包含已收錄資料，reveal gate 是畫面呈現邊界，不是對開發工具／檔案讀取的保密機制，也不是新增 Production owner receipt。

## 7. 技術驗證

修改前執行 UI-P2.3 七套相關 suites：**120/120 PASS**。所有既有 source／tests／入口完全保留。

新增測試命令：

```powershell
node --test --test-reporter=tap prototype/manga-match-spike/tests/manga.test.cjs
```

新增 8 項首次 **8/8 PASS**；之後只調整三句觀看提示，移除實作說明語氣，再執行同一 suite，最終仍 **8/8 PASS**，stderr 空，測試前後來源 hash 穩定。

| 測試 | 覆蓋 |
|---|---|
| 1 | 五單位對應合法 phase／七 beats；未知組合不標單位；Decision／Unsupported 不採用未來 stage |
| 2 | 真正 HTML script 順序在 VM 啟動、同一 v0.2 pair／v0.1 fixture、無新增 timer／網路／mount／connect |
| 3 | 實際共享 Controller 驅動畫框；四選項、敘事、focus、每段 reveal、結算與跑者身份 |
| 4 | animation／readingHold、Pause 剩餘時間、Skip 確認、快速連點、Replay 同一結果與一次 submission |
| 5 | 三條 Unsupported 無 Playback／結果；改動 cosmetic stage 也不產生結算 |
| 6 | Reduced Motion、文字模式及動態 preference 切換仍可完整操作；observer 可解除 |
| 7 | field SVG 相同、無遮罩規則、SS左／2B右、接球近景與一壘手／跑者原動作 |
| 8 | 原 UI-P2.3 入口、共享 sources、fixture、contract、原 evidence／報告 artifact hashes 相同 |

JS 與 test 的 Node 語法檢查通過。scoped git diff --check 沒有錯誤；本輪都是新增未追蹤檔，該命令不被當作新增檔內容驗證，另有實際 source、語法與測試檢查。

**DOM／VM adapter：PASS。Browser：NOT RUN。** 本輪 computer-use inventory 為 `apps: []`、`browsers: []`，未安裝其他工具，沒有 PC Chrome、原生鍵盤、200% Zoom、真實 file:// 或截圖驗收。未執行 Production regression、Match simulation、其他路線 Gameplay。

## 8. 人工 A/B 比較方法與 Director 評估

兩入口可並排或另開。請以同一視窗大小／Zoom，使用相同顯示模式與自動／逐段方式比較；不同受試者交錯先看基準或先看漫畫版，避免第二次已知判決的熟悉度被算成版面改善。只有同一球，不能據此推論其他守位／路線的表現。

| 驗證問題 | 建議觀察任務 | 基準／漫畫結果 |
|---|---|---|
| 哪版較易注意來球與跑者？ | Decision 時說出來球方向與兩名跑者的移動；記錄漏看內容與需重讀處 | PENDING／PENDING |
| 哪版較易理解四個選擇？ | 說明每條路線的戰術目標與粗風險，不問「最佳解」 | PENDING／PENDING |
| 動作中知道該看哪裡？ | 在接球、傳球及 contest 口述當下看的位置；記錄視線迷失 | PENDING／PENDING |
| 判決張力提升？ | 各自記錄張力與判決清晰度 1–5 分及原因，兩者分開評估 | PENDING／PENDING |
| Resolution 較易理解？ | 說出前後出局數、比分、誰出局及誰推進，以及原本目標 | PENDING／PENDING |
| 框線增加負擔／遮擋？ | 100%／200% Zoom 下逐段操作；記錄遮擋、捲動、重讀與焦點可見性 | PENDING／PENDING |

原生鍵盤驗收須確認 Tab／Shift+Tab／Enter／Space、details 展開、Unsupported 返回焦點、播放中焦點不遺失、最後確認與 Replay 清除舊結果。另檢查 SS 左近景、一壘接傳終點、兩名跑者與記分板始終可辨識。

**目前值得保留 Spike 作人工比較，尚不足以啟動正式 Manga Presentation Director。** 本輪顯示以少量呈現層即可接入同一條守備 Play，工程隔離可行；但理解、張力、遮擋與閱讀成本仍無真實比較證據。若人工比較顯示視線引導／後果理解有穩定改善且負擔可接受，下一步應先定義少量可重用的敘事決策與可及性規則，再另行授權 Director 設計；不要直接把這個 DOM observer 擴寫成正式產品層。單一 SS 6-3 也無法證明多路線／多守位覆蓋。

## 9. 完整性與停止

結案核對：全部 **1,918 個既有可讀檔案 hash 不變**，既有檔案修改數為零。12 個 protected paths 只做 stat/status metadata 檢查，未讀取內容、hash 或執行；metadata 不變。Git branch、HEAD、refs、index bytes、原 tracked／untracked WIP status 均保留，只有預先宣告的六個新檔加入。

沒有改動 Production、Save、Match Engine、原 v0.1 fixture、正式 v0.2 Contract 或 UI-P2.3 入口。沒有新比賽結果、其他路線結果、大量角色插畫或新依賴。未 reset／clean／stash／stage／commit／push；未啟動正式 UI-P3、Sprint10B 或 Receiver v2。

完成實驗切片與測試後停止，等待人工比較驗收。

Ready for Commit＝**NO**。  
Ready for Sprint10B＝**NO**。  
Receiver v2＝**DISABLED**。

