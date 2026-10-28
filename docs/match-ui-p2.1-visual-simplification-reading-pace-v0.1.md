# 《棒球人生》Sprint UI-P2.1 — Visual Simplification & Reading Pace Pass v0.1

日期：2026-10-16（Asia/Taipei）  
參考 HEAD：`ab3117653945de0b7013636187c446276a96e634`

**已在既有 [prototype/match-ui-p1/index.html](../prototype/match-ui-p1/index.html) 完成限縮修改。** 玩家以守方藍色加金色外環辨識，場上移除角色代碼與常駐工程圖例；播放改為動畫完成後保留閱讀時間，第七段結果等待確認。隔離測試 **75/75 PASS**。Browser **NOT RUN**，人工體驗驗收 **PENDING**。

## 1. 開工檢查與實際檔案

以實際工作樹核對 UI-P2 交付報告、evidence、runtime assets 與隔離測試，確認 UI-P2 已交付，未假設它已 Commit。先跑既有兩個 Prototype suites，修改前 **50/50 PASS**、exit 0。沿用 UI-P2 保存的 manifest，1891 個既有可讀檔案於開工時全部 hash 相符，12 個 protected paths metadata 相符；本輪新增目標當時皆不存在。

| 修改檔案 | 本輪責任 |
|---|---|
| [index.html](../prototype/match-ui-p1/index.html) | 移除 SVG 角色代碼及常駐圖例；玩家外環／底部指示；可展開說明、經過與預設關閉的開發資訊 |
| [style.css](../prototype/match-ui-p1/style.css) | 同隊同色、玩家決策對比；沿用紙感與漫畫框，精簡下方資訊樣式 |
| [app.js](../prototype/match-ui-p1/app.js) | 動畫／閱讀／確認子階段、單一計時器、下一段防重、Debug 顯示與焦點策略 |
| [presentation.js](../prototype/match-ui-p1/presentation.js) | 集中閱讀參數、自然語言角色標籤、team／isPlayer 投影；保留原演出 profile |
| [tests/prototype.test.cjs](../prototype/match-ui-p1/tests/prototype.test.cjs) | 保留原測試責任，更新閱讀與中文顯示預期；增加 renderer／焦點／Debug 檢查 |
| [tests/presentation.test.cjs](../prototype/match-ui-p1/tests/presentation.test.cjs) | 保留 UI-P2 演出、路線、identity 與 reveal gate 回歸，更新兩階段時間預期 |

新增四檔：

- [tests/reading-pace.test.cjs](../prototype/match-ui-p1/tests/reading-pace.test.cjs)：本輪閱讀、角色與 timer race 隔離測試。
- [tests/ui-p2.1-test-results.json](../prototype/match-ui-p1/tests/ui-p2.1-test-results.json)：修改前 50 項 baseline、途中 69／75 項與最終 75 項完整 TAP、stderr、runtime hashes、Browser 限制。
- 本報告。
- [本輪 evidence](match-ui-p2.1-visual-simplification-reading-pace-v0.1-evidence.json)：前後 hashes、protected metadata、Git metadata 與停止 gates。

仍可雙擊 `prototype/match-ui-p1/index.html` 離線開啟；所有 runtime assets 保持同資料夾。不需安裝、伺服器、CDN 或 fetch。頂部保留 `OFFLINE DEMO — NOT CONNECTED TO MATCH SIMULATION`。

## 2. 玩家／守方／攻方辨識

優先沿用 UI-P2 已有的藍色 `#3d668d` 與金色 `#b28b3c`，僅統一角色配色並引入低飽和暖橘 `#b87b4c`。紙色、球場、漫畫框與路線的整體風格保留。

| 角色 | 視覺 | 身分與非顏色線索 |
|---|---|---|
| 玩家守備員 | 守方藍色，獨有金色外環與底部方向指示；Decision 外環加深、加粗 | 保留 `actor-ss`、穩定 actor key 與 `player` source identity；圓形、游擊區位置、接近動作 |
| 守備隊友 | 相同守方藍色，沒有外環 | 保留接傳者的獨立物件與 DTO receiver／actor 關聯；方形、壘旁位置、接傳動作 |
| 原一壘跑者 | 暖橘色 | 原獨立六角形物件、actor key 與移動狀態保留；正式 runner identity 依既有揭露時點綁定 |
| 打者跑者 | 相同暖橘色 | 原獨立三角形物件、actor key 與移動狀態保留；與前位跑者不合併，保留 contest／Resolution 關聯 |

顏色沒有取代底層 identity。SVG `<title>`／`<desc>`、自然語言角色名稱、文字占壘與隱藏式替代文字仍保留；例如「你的守備員」「原一壘跑者」「打者跑者」。Resolution 中仍分別指出二壘跑者與已出局的打者跑者。

## 3. 畫面精簡

移除常駐 SS／1B／R1／BR 圖中文字、四角色長圖例、示意座標／物理判決工程說明與技術 footer。玩家守位改為「游擊」。內部 beat type 不再作主標題，phase 與事件使用中文；risk 顯示低／中／高，原 risk 值保留於資料。

工程 identity、原 route receipts 與角色技術說明只在明確點擊「開發資訊」後顯示，預設關閉。關閉時清空技術文字 DOM；開啟也只顯示目前已揭露的資料，不繞過 phase gate。必要的 actor key／source ID 留在資料與 DOM attributes，沒有當作畫面標籤。

操作教學改為預設收合的「操作說明」，已揭露的經過改為可展開回看。戰術意圖只在選項 hover／focus 時顯示短提示及路線；取消重複的預覽標題。Decision 原 situationText 完整保留，播放與結果期間收起該情境區，讓當前事件／結算成為主要閱讀內容。局數、比分、出局、占壘、四個原選項及正式結果均保留。

## 4. 動畫與閱讀控制

Controller 在既有 Playback phase 內使用三個子階段：

1. `animation`：依 UI-P2 原 Variable-Pace profile 演出。
2. `readingHold`：動畫定格在終點，事件文字完整保留，另行計算最低閱讀停留。
3. `awaitingConfirmation`：結果或超長事件文字停止自動推進，等待「下一段／查看正式結算」或略過。

動畫與閱讀使用不同 duration／remaining 狀態，依序共用一個可取消的 Controller timer。Web Animations 只表現位置，沒有完成回呼或推進比賽的權限。進入閱讀停留後強制停在動畫最後一格；Resume 閱讀不會重播剛完成的動畫。

原七段 DTO、eventId、presentationSequence、actor 綁定均未更動。保留球路、守備員接近、焦點切換、傳球路線、跑者競速、漫畫畫框、近景、Variable-Pace 及四條戰術意圖預覽。

## 5. 各階段停留策略

以下全部是 **UI 演出／閱讀的暫定參數**，不是棒球時間窗，也不代表最終玩家閱讀速度。參數集中於 `presentation.TIMING` 與 `presentation.READING`，不顯示在一般遊戲畫面。

| DTO 階段 | 原動畫 ms（保留） | 基礎額外閱讀 ms | 推進策略 |
|---|---:|---:|---|
| ballInPlay | 450 | 850 | 短句，閱讀後自動 |
| approach | 1100 | 650 | 短句，閱讀後自動 |
| control | 850 | 1400 | 較長停留，閱讀後自動 |
| throw | 450 | 850 | 短句，閱讀後自動 |
| receive | 600 | 850 | 短句，閱讀後自動 |
| contest | 1100 | 1700 | 較長停留，不提前判決，閱讀後自動 |
| result | 900 | 1200 | 揭露本球 result beat 後保持，等待確認 |

實際閱讀停留取「基礎值」與「字數 × 40ms」較大者；文字超過 100 個 Unicode 字元則等待確認。Reduced Motion／文字模式的閱讀停留至少 1400ms，原動畫 profile 不因此拉長；這兩種模式預設暫停，仍可手動逐段或明確開啟自動播放。

Playback 使用簡短的 DTO 演出文字；正式 outcomeText／feedbackText 在 Resolution 原文完整顯示，不裁切、無自動離開計時器。使用者可主動按下一段或略過，無需等最低停留結束。

## 6. 控制與資料邊界

- Pause 保存當前動畫或閱讀停留的剩餘時間並取消 timer；Resume 接續該子階段。等待確認時不建立自動推進 timer。
- 下一段同步取消 timer，重設下一段閱讀狀態；150ms UI 防重與可選 expected event identity 防止重複操作／邊界競態一次跨兩段。這不是棒球 timing number。
- Skip 取消未執行的動畫／閱讀 timer，只顯示同一份 Resolution；重複 Skip 不再作用。
- Replay 清除舊閱讀狀態與結果，重用原七段 DTO；epoch guard 讓舊回呼失效，不重新提交或模擬。
- Continue 僅結束 Demo，重複操作無效；重新開始建立新的 UI session。同一 session 的6-3選擇仍只接受一次提交。
- 三條未驗證路線仍進 Unsupported，可返回選擇，不產生6-3或其他路線結果。
- Decision 不讀未揭露的結果；前六段不顯示 result。全部 Playback，包括結果等待確認期間，記分板仍為四局上、一出局、一壘有人、主0客1。
- 只有 Resolution 更新為四局上、二出局、二壘有人、主0客1；原 outcomeText／feedbackText 完整保留。不引入終場1：7、不計算 Out／Safe／進壘、不公開 RNG／quality／margin／棒球 timing numbers。

## 7. 隔離測試、鍵盤與 Browser 狀態

最終命令：

```powershell
node --test --test-reporter=tap prototype/match-ui-p1/tests/prototype.test.cjs prototype/match-ui-p1/tests/presentation.test.cjs prototype/match-ui-p1/tests/reading-pace.test.cjs
```

修改前 **50/50 PASS**；最終 **75/75 PASS**，exit 0、stderr 空，測試前後 runtime／fixture hashes 一致。原50項測試責任保留；依本輪要求更新自動播放、閱讀 hold、中文顯示與顏色預期，未刪除原回歸項目。新增25項測試涵蓋角色／Debug／renderer、分離時鐘、長文策略、等待確認、重複下一段、邊界競態、各子階段 Skip／Replay、mode 切換與身分保留。

| 檢查 | 結果／界限 |
|---|---|
| 原 DTO／選項順序／七段 identity／Fixture bytes | PASS；精確複本、freeze、既有 SHA 均保留 |
| 玩家外環、攻守一致配色、無可見 SS／R1／BR、圖例精簡 | PASS（靜態及 renderer adapter） |
| 獨立跑者物件／動作／正式 identity | PASS；逐段與 Resolution 綁定核對 |
| Debug 預設關閉、開關清空、不可讀未來結果 | PASS |
| 動畫與閱讀分離、長文字延長／等待、一般動作連續、結果保持 | PASS（假時鐘與 renderer adapter） |
| Pause／Resume／Next／Skip／Replay／Continue／stale callbacks | PASS；單一 timer、重複／邊界動作不多次推進 |
| Reduced Motion／文字模式 | PASS；可逐段或明確恢復自動播放 |
| Scoreboard／結果揭露 gate、三 Unsupported、防重提交 | PASS |
| 無 Production imports／Phaser／CDN／外部資源 | PASS；只執行本原型與 Node 內建工具 |
| Native buttons、focus-visible、結果焦點／aria-live | PASS（靜態及 DOM adapter），不等於原生鍵盤 smoke |
| 真實 Browser／鍵盤／讀屏／視覺驗收 | **NOT RUN／PENDING** |

所有操作仍用原生 button／details，不攔截 Tab／Enter／Space。一般段落切換保留播放控制焦點；若「暫停」恰好持有焦點而進入等待確認，焦點移至確認按鈕；Resolution 標題取得焦點並宣告原 outcomeText。Unsupported 返回原選項焦點，Debug 開關不改播放計時器。

本輪 Browser inventory 為 `apps: [] / browsers: []`；使用 CUA 嘗試以 Chrome 開啟本地 HTML，回 `Browser is not available: chrome`，未取得任何頁面／截圖。沒有以 Node DOM adapter 宣稱 Browser PASS。待人工驗證真實 Tab／Enter／Space、focus ring、讀屏宣告、色辨／縮放200%、PC與窄螢幕、file URL／CSP、實際動畫與閱讀節奏。

## 8. 完整性與停止

開工1891個可讀檔案全相符；結案僅上述6個允許修改的原型／測試檔案變動，其餘 **1885個**既有可讀檔案 hashes 不變。原 Production WIP、fixture.js、DTO契約、UI-P1／UI-P2歷史報告、README、全部舊測試證據均保留。12個 protected paths 僅比較 size／mtime 與 Git status metadata，不讀取、hash、執行或修改內容。

branch／HEAD／main／origin/main tracking ref／Git index entries／原 tracked WIP status 與本輪開工一致，沒有 staged changes。未操作 reset／clean／stash／stage／commit／push，未執行 unscoped diff、全域搜尋或重新 Graph 稽核。Source reads 限本原型、既有交付／契約 JSON 與報告及本輪自身檔案；manifest其他檔案僅做 byte hash。詳細清單與前後值見本輪 evidence。

索引證據界限：結案 `.git/index` SHA-256 為 `6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d`，與 UI-P2 歷史紀錄的 `66af8b71c8e6927d272db9dd2109a75466042915b1fb1e0929c737d90401cd75` 不同。本輪開工保存的是 `git ls-files --stage` 索引項目，而非 index binary hash，因此只證明本輪 entries／staged 狀態不變，不宣稱 binary bytes 不變；差異發生時間與原因未定位。結案 Git 查詢停用 optional locks，未為消除差異而寫入索引。

已知限制：閱讀參數尚未經玩家速度驗證；只有原6-3固定結果；視覺 phase gate 不隱藏原始碼中的離線資料；沒有真實 Browser／讀屏或色辨驗收。下一步先人工體驗外環辨識與各段閱讀節奏，再依回饋調整集中參數。本輪不擴大路線、不做 Production Adapter 或新接球後決策。

| Gate | 狀態 |
|---|---|
| 可操作 HTML 真正存在 | **YES** |
| UI-P2.1 實作／Prototype regression | **COMPLETE／75 PASS** |
| Browser smoke／人工體驗驗收 | **NOT RUN／PENDING** |
| Production Adapter／Phaser／Match Engine 修改 | **NOT STARTED／NOT INTRODUCED** |
| Ready for Commit | **NO** |
| Ready for Sprint10B | **NO** |
| Receiver v2 | **DISABLED** |

完成本輪限縮施工與隔離測試後停止，等待人工體驗驗收。
