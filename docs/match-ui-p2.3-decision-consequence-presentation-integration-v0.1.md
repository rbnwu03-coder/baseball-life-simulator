# 《棒球人生》UI-P2.3 — Decision & Consequence Presentation Integration v0.1

日期：2026-10-16（Asia/Taipei）  
Branch：main；HEAD：`ab3117653945de0b7013636187c446276a96e634`，保留既有 WIP。

**已完成 PC 離線 Prototype 的 v0.2 Decision／Resolution 整合。** 基線 126/126 PASS（Prototype 101、v0.2 隔離契約 25）；修改後相關 Prototype 測試 120/120 PASS（原 101、新增 19）。Browser **NOT RUN**；人工畫面、原生鍵盤、200% Zoom 與閱讀節奏驗收 **PENDING**。

入口：[離線原型](../prototype/match-ui-p1/index.html)。完整記錄：[本輪 evidence](match-ui-p2.3-decision-consequence-presentation-integration-v0.1-evidence.json)。

## 1. 檔案與開工檢查

修改前列出 exact-path allowlist，確認五個新增目標均不存在後施工。沒有覆寫原 v0.1 fixture、歷史報告或 evidence。

| 檔案 | 本輪用途 |
|---|---|
| `prototype/match-ui-p1/app.js` | 明確版本路由；現有 Controller 的公開 view 邊界；Resolution renderer；v0.2 Skip 停在最後確認 |
| `prototype/match-ui-p1/index.html` | 加入本地資料 script；同欄觀察與選擇；結算摘要與原敘事 details |
| `prototype/match-ui-p1/style.css` | 路線／目標／風險層級、文字與小視窗換行 |
| `prototype/match-ui-p1/tests/prototype.test.cjs` | 更新既有 classic-script 啟動測試與載入清單，補足 VM 時鐘；保留原 Controller 回歸斷言 |
| [generate-presentation-v02.cjs](../prototype/match-ui-p1/generate-presentation-v02.cjs)（新增） | 離線產生、來源驗證、hash 與 deterministic check |
| [presentation-v02.generated.js](../prototype/match-ui-p1/presentation-v02.generated.js)（新增） | 真正由原 contract 建立的兩個 DTO、來源紀錄、最小 CommonJS 包裝及版本／stream join |
| [decision-consequence.test.cjs](../prototype/match-ui-p1/tests/decision-consequence.test.cjs)（新增） | 19 項整合／DOM／離線 VM 測試 |
| 本報告與本輪 evidence（新增） | 交付與完整性記錄 |

前輪 Foundation 三個 artifact hash、相關來源 hash 及全部 1,913 個既有可讀檔案均與前輪紀錄相符。開工無新增目標衝突。13 個既有 tracked WIP status 保留，沒有清理工作樹。

結構查詢使用 codebase-memory Tier 2；精確 Prototype 符號查詢沒有 graph 節點，18 個既有依據路徑及 3 個新程式路徑 coverage 為 `not_tracked`。採當前 exact-path source 讀取／測試補查，未把無節點當成不存在或完整 coverage 證明，未重建索引。Generation 仍為 `2026-10-15T01:30:19Z`。

## 2. v0.2 如何進入離線原型

原入口使用 defer classic scripts，沒有 ES module loader。v0.2 Foundation 是純 CommonJS，不能直接當成普通瀏覽器 script 執行。本輪採用新增的離線產生器，沒有修改原契約或引入 bundler。

產生流程：

1. 驗證原 contract、v0.1 evidence、歷史 findings、原 fixture 的 SHA-256 與 Foundation 紀錄相符；fixture 內容必須等於原 v0.1 examples。
2. 從原 fixture 取得公開 Decision／Resolution；從既有 findings 的 admission、lifecycle、applied settlement、completedMoment 及前後跑者快照組成離線 confirmation。
3. 呼叫原契約的 `createDecisionView`、`validateDecisionView`、`createResolutionView`、`validateResolutionView`；建立原 `createReplayCache` 核對同一凍結結果。
4. 序列化真正建立且來源驗證通過的 DTO。產物附 generator、contract、fixture、v0.1 evidence、findings、Foundation evidence 的 source hashes。
5. 將原 CommonJS source body **原封不動**包入私有 module wrapper。瀏覽器僅呼叫同一份原契約的 `validateSchema`，再凍結已產生資料；沒有另外抄寫 v0.2 validator。wrapper 不公開建構或結算 API，不攜帶 confirmation 輸入。
6. 入口明確選用 `match-ui-slice/0.2`。adapter 只做版本及同球 stream join；Decision／Resolution 全部取自 v0.2，七個 Playback events 仍明確使用原 `match-ui-slice/0.1`。v0.2 Foundation 沒有 Playback API，沒有把舊 events 改標為 v0.2。

產生與檢查：

```powershell
# 初次產生（exclusive-create，既有產物不會被靜默覆寫）
node prototype/match-ui-p1/generate-presentation-v02.cjs

# 以目前來源再次投影／驗證，確認產物逐 byte 相同
node prototype/match-ui-p1/generate-presentation-v02.cjs --check
```

本輪初次產生、兩輪整合測試內 deterministic regeneration、最後 `--check` 共四次離線投影流程，均未呼叫 Production owner、遊戲 builder、resolver 或重新結算。不是新的比賽結果，也沒有啟動其他路線。

離線 confirmation 仍是依既有歷史事實形成的宣告，不是正式 Production receipt。瀏覽器 schema 檢查不認證 owner；來源感知驗證在產生階段完成，原型沿用單一 Controller 控制呈現時點。靜態示範的 UI reveal gate 不宣稱能對查看檔案或開發工具的使用者隱藏已收錄資料。

## 3. Decision：局勢 → 觀察 → 選擇

記分板保留四局上、主 0 客 1、一出局、一壘有人及 SS 守位。觀察敘事從球場下方移到選項前方同一閱讀欄，避免跨欄回讀；球場保留。

本球 v0.2 observations 全部為 null，因此完整保留唯一公開 `situationText`，沒有切詞、抽取新結構化位置或改寫棒球結論。原字串的標點也保留。玩家仍能讀到游擊守區、往左側來球、受迫往二壘的原一壘跑者、衝向一壘的打者，以及兩個很緊的窗口。null observations 不建立重複提示卡。

選項為原四個 native buttons，以路線、原戰術目標、原粗風險作為主層級，原 label 為次層文字：

| 路線 | 目標 | 風險 |
|---|---|---|
| 6-3 | 優先爭取打者出局 | 低 |
| 6-4 | 優先處理前位跑者 | 中 |
| 6-4-3 | 嘗試完成雙殺 | 高 |
| 持球 | 控制球與跑者 | 低 |

風險只翻譯 low／medium／high；沒有球速、成功率、最佳解或品質分數。focus／hover 仍只顯示原戰術意圖虛線，不提前播放已完成的傳球。

## 4. Resolution：本球局勢與策略回顧

Playback、contest、result 的既有判決與節奏保留。v0.2 資訊只在最後確認後的 Resolution 寫入 DOM：

- 使用 `stateChange` 顯示「出局數 1 → 2」及「比分 主 0 · 客 1（不變）」。
- 使用 `selectedObjective.objectiveText` 顯示「原本目標：優先爭取打者出局。」
- 對齊 `achievedOutcome` 的 out／advanced runner IDs 與 `runnerChanges` 原點，顯示「實際結果：打者出局，原一壘跑者推進二壘。」
- 記分板此時才更新為二出局、二壘有人；同球比分仍主 0 客 1。
- 原 `outcomeText`、`feedbackText`、非 null `verifiedTradeoffText` 完整保留在預設關閉的 native details，避免在主畫面重複長敘事。

打者 ID `regional-power-school-player-09` 對應打者出局；原一壘跑者 ID `regional-power-school-player-04` 對應一壘至二壘。renderer／球場 source ID 與這兩個角色分開核對，不以陣列順序混認。沒有產生未選路線結果或「本來可以雙殺」等評語。`decisionFeedbackText`、`executionFeedbackText` 維持 null。

此結果呈現只服務已驗證的歷史 6-3 靜態配對；不是新增通用路線或完整比賽結算器。沒有新增動畫、接球近景或重播守備動作。

## 5. Controller 與 reveal gate

仍是原本的 `createDemo`、一個 timer、epoch 防舊 callback、150ms 快速 Next 防護及原 reading policy。沒有第二套 controller／timer。

| 階段 | 正式局勢 | v0.2 Resolution |
|---|---|---|
| Loading／DataError | 不顯示 | 不顯示 |
| Decision／Submitting／Unsupported | v0.2 Decision state | null，結果 DOM 清空 |
| Playback 前六段 | Decision state | null |
| 最後 result／awaitingConfirmation | Decision state；原既有判決可見 | null |
| 使用者確認後 Resolution | v0.2 Resolution state | 顯示局勢差異及策略回顧 |
| Replay | 重設為 Decision state，重用原七個 beats | 結果 DOM、details open 及 announcement 清空，確認前仍 null |

原 v0.1 API 行為保留供既有離線消費者明確使用；預設瀏覽器入口固定 v0.2，缺少 v0.2 adapter 時顯示 DataError，不靜默退回 v0.1。

**v0.2 Skip** 取消既有 timer、略過動作至原 result 的 awaitingConfirmation，快速重複 Skip 不再推進；必須使用原「查看正式結算」按鈕確認。這修正了舊 v0.1 Skip 直接進入 Resolution 的行為。沒有新增確認頁。

Pause／Resume 保留 readingHold 剩餘時間；reduced motion／文字模式仍預設暫停。Replay 重用同一對凍結 DTO 和原 Playback references，不重新 connect、不投影、不呼叫 v0.2 結算。Continue／restart 仍沿用原流程。

## 6. Unsupported 與視覺保留

三條未收錄路線仍可選擇、預覽意圖及返回；進入 Unsupported 時不建立 Playback、不借用 6-3 outcome、不產生 Resolution。沒有執行這三條路線的 Gameplay。

整個 field SVG 區塊逐 byte 相同；`presentation.js` 也逐 byte 相同。因此 SVG 幾何、示意跑位、TIMING／READING、SS 左／2B 右規則與一壘手移向壘包接傳沒有更改。既有六套回歸同時通過：

- 球員同形同大小；攻守沿用顏色。
- SS 近景仍在左，2B 右側僅保留設定，無新增情境。
- 一壘無綠色占壘點／綠邊。
- 接傳仍共用一壘落點；沒有接球端獨立近景。
- 無黑色焦點裝飾框、金色放射線或新增場上技術標示。

## 7. 測試及離線狀態

修改前：六套 Prototype 101 項 + v0.2 isolated contract 25 項，**126/126 PASS**。

修改後命令：

```powershell
node --test --test-reporter=tap prototype/match-ui-p1/tests/prototype.test.cjs prototype/match-ui-p1/tests/presentation.test.cjs prototype/match-ui-p1/tests/reading-pace.test.cjs prototype/match-ui-p1/tests/markers.test.cjs prototype/match-ui-p1/tests/fielding-receive.test.cjs prototype/match-ui-p1/tests/spatial-focus.test.cjs prototype/match-ui-p1/tests/decision-consequence.test.cjs
```

最終 **120/120 PASS**，stderr 空，測試前後相關來源 hash 穩定。新增 19 項涵蓋來源產生、明確版本、null 敘事、選項／風險、無假提示、逐段揭露、readingHold、Skip 確認、局勢差異、跑者身份、完整原文、三條 Unsupported、Pause／快速連點、Replay 不投影、既有資料保護、classic-script 啟動與視覺回歸。

首輪修改後 116 PASS／4 FAIL：新 DOM adapter 的 focus 重複觸發同一元素，以及既有 VM bootstrap 缺少 performance 時鐘。修正測試 adapter 使其符合原有 focus 語意並加入 fake clock 後全數通過；沒有放寬功能斷言，兩輪 stdout／stderr 均保留在 evidence。

v0.2 原契約未改，隔離測試基線已 PASS。修改後只重跑受影響 Prototype suites；沒有重跑其固定「前輪 Prototype hash」保護斷言，也沒有改寫該歷史測試預期。原契約及隔離測試本身 hash 不變。

產生器 `--check`、五個受影響／新增 JS/CJS 語法檢查及 scoped `git diff --check` 通過。沒有執行 Production regression 或遊戲模擬。

入口仍是本地 defer classic scripts。CSP `connect-src 'none'` 保留，無 fetch、CDN、ES import、安裝依賴、server、Phaser、動態 eval。schema 內原有 JSON Schema URI 僅是資料標籤，不發出網路請求。VM 以實際 HTML script 順序啟動通過；這是檔案／DOM adapter 的離線載入驗證，**不等同真實 file:// Browser PASS**。

## 8. 完整性與人工驗收

1,913 個開工可讀檔案中，只有上述 4 個授權檔案改動，其餘 **1,909 個** hash 不變。原 v0.1 fixture、Foundation contract／test／docs、Production WIP 與歷史 evidence 均保留。12 個 protected paths 只檢查 stat/status metadata，不讀取、hash 或執行內容。

branch、HEAD、refs、Git index bytes 及原 tracked WIP status 均與開工一致。未 reset／clean／stash／stage／commit／push。

CUA inventory 回傳 `apps: []`、`browsers: []`。**Browser NOT RUN，人工驗收 PENDING**；未為此安裝工具。請人工雙擊入口，以 PC Chrome 確認：

1. 局勢、敘事、四個選項的閱讀順序與密度；200% Zoom 時的換行及可捲動性。
2. Tab／Enter／Space 的 native button、details 操作與焦點返回。
3. 自動播放的閱讀時間、Pause／Resume、最後判決等待確認。
4. Skip 仍停在判決、確認後才更新記分板與回顧；Replay 清除舊結果。
5. SS 左側近景、一壘無綠點及一壘手接傳仍符合前輪視覺規則。

本輪完成後停止。等待人工畫面驗收；UI-P3、Sprint10B、Receiver v2、Production Adapter 均未啟動。

Ready for Commit＝**NO**。  
Ready for Sprint10B＝**NO**。  
Receiver v2＝**DISABLED**。

