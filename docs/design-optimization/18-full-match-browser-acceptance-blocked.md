# 完整比賽瀏覽器驗收：BLOCKED（2026-10-31）

本輪未達完整驗收門檻。最終程式的捕手首場在 2 局上停止，捕手第二場與完整內野場未完成；短打 17 種來源中仍有 16 種缺少可完成 PA 的 owner。沒有把投手延期的兩場、錯派守位的完整場或 Node PASS 合併成捕手主線通過。

分支為 `test/full-match-browser-2026-10-31`，由乾淨的最新修補 HEAD `bb0240278d61cd85ab1deaceddc640ac41aa8b46` 建立。第 16／17 號報告與其後現有短打提交均已讀取；沒有退回舊版本。main、checkpoint、integration 與原修補分支不更新。開工狀態與關鍵 hash 見 [baseline.json](full-match-browser-2026-10-31/baseline.json)，最終來源／保全見 [preservation.json](full-match-browser-2026-10-31/preservation.json)。最終提交完整 SHA 由交付訊息提供。

正式專案沒有獨立 package application version；以 HEAD、dirty diff、實際載入來源 SHA-256 識別版本，Save schema 為 15。`version.json` 是當時伺服器工作樹 manifest；較早已開啟的頁面可能仍載入前一輪程式。另以唯讀 `Debugger.getScriptSource` 取得 [實際載入版本](full-match-browser-2026-10-31/loaded-versions/)。最終捕手與真正 LF 的 `script.js` 均為 `8efd15a1c20f12e20b46654003770c86a4593e569a682fc34d2f61102b6c7083`，Save 為 `2ee201a47522136132de863d449c180afef2de230f0a036240075500547ad17f`。中途版本的局部通過各自保留，不充作最終版全流程通過。

| case | 入口／seed | 預期與契約 | 實際 | 狀態／證據 |
|---|---|---|---|---|
| 捕手正式主線首場 | 創角 → 正式高一書籤，Direct Start=false；182506 | 名單確認後同場從進場至終場 | 2 上、0 出局、空壘；原 `groundBunt/soft/pitcherArea` 待守備結算，未新增 PA | **BLOCKED**；[最終現場、trace、截圖](full-match-browser-2026-10-31/catcher-final-version/) |
| 捕手首場決策前 Save/Load | 同一正常入口、182506 | fresh DOM → 儲存成功 → 重整 → 讀取；identity／seed／cursor／opportunity／紀錄保持 | 已在實際頁面操作，核心事實相同 | 局部 **PASS**（當時來源版本）；[前後狀態](full-match-browser-2026-10-31/catcher-canonical-final/) |
| 捕手同球停止後 Save/Load | 最終來源，182506 | 原 source／receipt／record／seed 不重算，停止狀態保持 | 核心狀態完全相同，畫面不再宣稱正常播放 | 局部 **PASS**；[前後狀態](full-match-browser-2026-10-31/catcher-final-version/blocked-save-load.json) |
| 捕手第二場、電話至年末 | 依賴捕手首場 | 正常主線完成第二場與年末 | 首場未完成，沒有偽造第二場 | **NOT_RUN**（前置 BLOCKED） |
| 真正外野代表完整場 | 獨立合法 factory fixture，LF；49186 | active actor 與正式紀錄為 LF，全場由原頁面續行與決策 | 已完成七局；守位、R/H/E、PA/BF 與紀錄由獨立 checker 核對 | 流程／保留事實局部 **PASS**；[正式紀錄與截圖](full-match-browser-2026-10-31/outfield-lf-roster-fixed-final/)；不代表所有外野守備情境通過 |
| LF 終場後 Save/Load／被動等待 | 49186，同一已完成場 | 停止 mutation，正式紀錄與成長不重發 | record／growth／被動等待相同 | 局部 **PASS**；[完整比較](full-match-browser-2026-10-31/outfield-lf-roster-fixed-final/terminal-save-load.json) |
| 游擊手替補／完整內野嘗試 | 正式 opportunity owner，developmental／rotation；3041234481 | 5 局後合法換同守位 incumbent，不在入場前使用玩家 | 5 下、1 出局、第 6 棒正式替補；SS actor／正式紀錄一致；6 上遇 popBunt 阻塞 | 替補局部 **PASS**，完整場 **BLOCKED**；[entry、原始紀錄、現場](full-match-browser-2026-10-31/substitution-ss-final/)；來源版本另列 |
| 其他守位 | 1B、2B、SS、3B、LF、CF、RF；固定49186 | 合法初始名單、無重複守位、畫面可呈現 | 各自已操作 setup；有些安排為板凳，沒有強制入場 | 初始範圍取證；守備結算 **NOT_RUN**；[逐守位結果](full-match-browser-2026-10-31/position-entries/results.json) |
| 投手延期／未出賽 | 合法 fixture；49186、1175259511 | 玩家零 PA／BF／投球與守備曝光；NPC 正常完成比賽 | 兩場七局，2:9／2:10；電話、角色回饋、年末均已到達 | 局部 **PASS**，不同中途載入版本不列最終完整驗收；[首場](full-match-browser-2026-10-31/pitcher-canonical-01-final/)、[次場](full-match-browser-2026-10-31/pitcher-canonical-02-final/)、[年末](full-match-browser-2026-10-31/pitcher-canonical-year-end/) |
| 電話前／N+1 Save/Load | 上述未出賽案例；同正式存檔 | 收益一次、同 identity／opportunity／seed，讀取能續行 | 找到並修復第二場讀取不排程；同 seed/cursor 恢復後正式播放前進 | 局部 **PASS**；[電話與存檔](full-match-browser-2026-10-31/pitcher-canonical-phone/)、[修補前](full-match-browser-2026-10-31/n-plus-one-load-before-fix/)、[修補後](full-match-browser-2026-10-31/n-plus-one-load-after-fix/) |
| 17 種短打 | 4 pace × 4 placement + popBunt；預先登記、49186 | 同一原 PA／pitch，不能重抽壓縮 PA | hard/secondBaseSide 有 receipt；其餘 16 種停止且保留來源 | 完整覆蓋 **BLOCKED**；[v2 四組矩陣](full-match-browser-2026-10-31/bunt-matrix/) |
| NPC 短打結算後 Save/Load | v2 hard/secondBaseSide fixture | 原 receipt、正式 PA／defense refs 各一次 | 實際頁面儲存成功、重整、讀取後保留 | 局部 **PASS**（矩陣版本）；[完整存讀前後](full-match-browser-2026-10-31/bunt-v2-3-2/post-settlement-save-load.json) |
| 最後下半局省略、再見、延長、時間性第三出局、未捕第三好球、各種界外 | 固定邊界尚未建立／執行 | 每一類需真正頁面分支證據 | 本輪沒有合法頁面通過證據，不能用 source 或 Node 補成 PASS | **NOT_RUN**；詳見 [契約與缺口](full-match-browser-2026-10-31/contracts-and-gaps.md) |

本輪實際修補六個共同根因，皆不調整能力、健康公式、機率係數或 UI 結構：

1. 播放 callback 例外保存失敗位置、停止排程並呈現停止；讀取後不把未結算球自動重試為新 PA。
2. 逐球面板不再把已落後於公開游標的舊 PA 回饋當作新打者的目前結果；操作通知也綁定原 PA／pitch，避免把上一球「已處理」帶到仍待守備的短打。
3. 正式高一書籤透過既有 invitation／selection owner 確認普通高中，讓 N+1 排程取得合法 school identity。既有已開打的 legacy 存檔不重派學校。
4. Load 的播放恢復由既有正式比賽事件判定，涵蓋 N+1，沿用所有准入與 decision／outcome 停等保護。
5. 具體守位面板使用同一玩家既有家族評估，避免 `null.rating` 讓呈現中斷；只改顯示 adapter。
6. 邀請時候選守位只能在同一守位家族內協助 generic assignment；保留已指定 LF／CF／RF，避免外野名單被覆蓋成 2B。

第一次外野入口雖跑到終場，正式 actor 卻為 2B。該場明列 **FAIL**，不計入外野或內野代表路線；[完整反例](full-match-browser-2026-10-31/outfield-lf-after-render-fix-03/)及 checker 的拒絕見 [獨立事實檢查](full-match-browser-2026-10-31/independent-facts.json)。替補檢查器初版錯用最終打序判斷換人前 PA，已改為依 playerEntry 逐事件重建打序；[初版結果](full-match-browser-2026-10-31/independent-facts-initial-substitution-check.json)保留，沒有改遊戲事件迎合 checker。

checker 不載入 production integrity。它直接檢查攻守 actor ID、打序、換人時間、跑者來源與唯一性、前後出局／得分、第三出局、逐局與個人 R/H、PA/BF/SO、正式 event refs 唯一性，以及存讀後同球 receipt。這只證明已保留事實的相容性；壓縮打席缺少 catch／touch／普通努力證據時，不宣稱已完成其棒球裁決驗收。

首場觀察器最初把 opportunity／plannedUsage 讀成不存在的頂層欄位，已修正未來 runner。既有首場證據沒有用兩個 undefined 當相等：即時 identity／seed／cursor／世界／record 用前後快照核對；locked opportunity／plannedUsage 另由真實已儲存 Player 與讀取後續行的正式 Match 比對，涵蓋 Load 與後續播放，不能冒稱另存了一份當下未捕獲的完整 exposure snapshot。

LF 完整場在最後一個「操作通知綁定原 pitch」UI 補強前完成；[入場時真正載入 hash](full-match-browser-2026-10-31/outfield-lf-roster-fixed/loaded-sources.json)與[最後讀回終場時 hash](full-match-browser-2026-10-31/loaded-versions/tab-5.json)分別保存。主 `script.js` 與 Save 相同，但不把 UI 不同的兩段直接合併成「最終版完整外野驗收」。機器總表區分 observed completed 與 final gate admitted。

最終程式執行五套直接相關 Node 回歸，全部 exit 0：定向 6 組、UI 7、捕手 40、lifecycle 23、Save admission 45；另通過語法與 diff whitespace。健康刷新、安排鎖定、電話 post-build 失敗復原兩次與一次成功、N+1 讀取恢復皆包含在定向組。[原始 logs、測試 hash、exit code](full-match-browser-2026-10-31/node-verification.json)。沒有重跑無關全專案套件。

現有 HTML 全量 inventory 共 18 頁，包含主頁、13 個舊 browser fixture、4 個原型，已逐頁實際開啟，避免漏掉原先提及但未在 16／17 報告具名的 15 項。四個 fixture 出現缺少 `ForceAdvancement`／`AIPlateAppearanceOutcome`；其餘僅載入，內含直接解決／快速完成／手填結果的按鈕不能用作本輪合法完整比賽證據。原型另分類。每頁 console error、必要資源失敗、可見按鈕與限定理由都在 [逐頁結果](full-match-browser-2026-10-31/html-inventory/browser-results.json)，沒有以 Node 代填瀏覽器 PASS。

首個現場均先保存才修補；自然流程、fixture、無效 harness 試作與中途版本分開保存。初版短打測試頁把來源放在尚未准入詳細守備的 1 上，因此後來看到另一球；`bunt-0-0` 等初版資料不計覆蓋。v2 從獨立 2 上防守前置局面開始，原球完全由正式 owner 生成，17 案均核對 `sourceSame=true`。沒有用那個 harness 錯誤冒充 production 缺陷，也未搜尋 seed。

本輪完整比賽瀏覽器驗收維持 **BLOCKED**。後續先補短打同球 owner 契約，再從保留的正式存檔重驗捕手主線與完整內野場，並補齊罕見邊界；不得把本報告局部 PASS 直接合併成最終版全項通過。
