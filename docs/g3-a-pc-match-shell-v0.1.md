# G3-A — PC Match Shell & Stable Panel Flow v0.1

**G3_A_PARTIAL**。固定 Shell、真實 Chrome 可玩流程、三個 PC 尺寸、鍵盤、Save／Reload 與五套 focused regression 通過。唯一未閉合項目：B1 要求的實際賽事名稱與隊名文字不在既有 Public Bridge contract；目前明示「賽事名稱未提供」，隊伍顯示公開 ID。未讀取原 Match 私有名稱補值，也未擴張 Bridge。這個欄位缺口阻止宣告完整 G3_A_PASS。

基線維持 `accepted-gameplay-g2-b2-v0.1`，HEAD `0d3ed173952b9b8e5d5842a73761f649b50be594`，Tree `866b134fc720bbc93582d3172965e68c527b25ce`，upstream 與 ahead／behind 0／0 不變。

## 實際變更與 Shell

- 修改：`match-pitch-decision-ui.js`、`match-pitch-decision-ui.css`。
- 新增：`tests/g3-a-pc-match-shell-test.cjs` 與本文件、同名 evidence JSON。共 2 Modified、3 Added；index.html、style.css、原正式測試均未修改。
- Supporting header：`matchShellHeader` 只使用 Public Bridge 的比分、局數、出局、B／S、壘包及 teamId；unavailable 顯示破折號／未提供。
- Main Frame：`matchPresentationHost` 保留固定位置，使用投打空間層次與中性 K-Zone；明示未提供位置資訊，沒有虛構球路。
- Decision Frame：`matchDecisionFrame` 以同一 grid row 切換原 choices 與合法逐球 route，保留 tradeoff。原情境節點放在主框的「情境與策略線索」；完整 story 保留於 Supporting disclosure。
- Resolution：回饋只取同一公開 PA；尚未揭露時提示依原流程繼續。新決策出現後移除舊 PA 摘要。非 Match Career 保留 story → changeLog → choices 順序，另以真實 Chrome 的 day1_morning 入口驗證。

## Chrome 證據與正式 PA

使用已安裝 Google Chrome 的獨立暫存 headless profile，以原生 CDP mouse／Tab／Enter／Space 操作既有完整比賽入口，沒有注入 Match fixture、固定 RNG 或代替玩家選擇。Chrome 連接工具不可用後，改用本機測試 runner；沒有關閉 Chrome sandbox。

| 畫面 | 截圖 |
|---|---|
| 原版 1366×768／策略位置 | [Before](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/before-1366x768.png) · [Before 策略](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/before-strategy-1366x768.png) |
| 固定 Shell 策略／逐球 | [After 策略](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/after-strategy-1366x768.png) · [After 逐球](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/after-pitch-1366x768.png) |
| take／合法 swing／PA | [take](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/after-take-1366x768.png) · [swing](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/after-swing-1366x768.png) · [PA 結果待原揭露](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/after-pa-1366x768.png) |
| 整頁 Save／Reload | [Reload](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/after-reload-1366x768.png) |
| 1600×900／1920×1080 | [1600](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/after-pitch-1600x900.png) · [1920](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/after-pitch-1920x1080.png) |

策略 → 逐球的主框與操作框 viewport Y 均為 104；第一個按鈕 Y 均為 184；scrollY 均為 71。三尺寸主要畫框、當下所有操作均在 viewport 內，沒有水平溢出或第二組可提交逐球按鈕。

正式 PA：`hs-y1-autumn-exhibition|hs_y1_match_moment_1|player|2|下`。Enter 提交 take → calledStrike；Space 提交 contactSwing → ballInPlay，原正式結算為 `out`，共 2 球。Public Timeline 精確出現一次同 PA 的 PA_SETTLED，GameRecord refs 唯一，Match／Record integrity issues 均為空；繼續後交回原排程 Playback，未額外代選。已驗證同頁 Save／Reload、整頁 reload、stale callback、原生 double-click、held Enter rejection、讀取失敗時回復原 UI。

阻斷 console exception：0。favicon.ico 的 404 原樣列為非阻斷 network 記錄。Chrome 執行的 adapter SHA 與載入 index／CSS bytes 均與最終磁碟來源相符；完整操作、計數、公開結果與失敗迭代見 [Chrome evidence](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/browser-evidence.json)。

## 權限分離與回歸

G2-B2 的 createAdapter 與其前置宣告逐 byte 保持原值，由新增測試對正式 commit 驗證；四個 identity、expectedMomentId、exact mapping、in-flight／submit-once、stale rejection 完整保留。Shell 沒有 gameplay clock、simulation、resolver、Save 或結算權限。原逐球 group 在 Adapter 可用時 hidden + inert，按鈕 disabled；unsupported 與 read failure 恢復原 callback。MutationObserver 仍僅觀察原 story／choices 根節點，沒有接管 Playback。

| 測試 | 通過數 | 結果 |
|---|---:|---|
| `tests/g3-a-pc-match-shell-test.cjs` | 7 | PASS |
| `tests/g2-b2-playable-match-decision-test.cjs` | 21 | PASS |
| `tests/g2-a-live-public-match-bridge-test.cjs` | 34 | PASS |
| `tests/g2-b1-natural-mixed-match-continuity-test.cjs` | 9 | PASS |
| `tests/pitch-production-source-scope-test.js` | 7 | PASS |

合計 78 項 PASS；Source Guard 拒絕 131 個 mutation。依賴讀取 guard 攔截 Protected 路徑，最終 violations／Protected content access 均為 0。完整 stdout、stderr、讀取 trace 與正式結果位於 [regressions/results.json](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/regressions/results.json)。沒有全庫 regression。

## WIP／Protected／Git 完整性

Fresh Preflight 與 Postflight 全部 PASS。原 tracked WIP 仍只有 tests/fast-check-smoke-test.cjs 的既有修改；12 個 Protected 只核對路徑／狀態與 size／mtime，全部相符，未讀取、雜湊、比較、diff 或執行內容。原 1,228 個 untracked 路徑／狀態完整保留；最終 1,231，僅新增本輪 3 個檔案。

staged 空，index SHA256 維持 `57c4fd9aeaa8a4955adb8d7d18436c224a1f39ec3f058e83eea6f3a2fd818ea1`；config、正式 refs、HEAD／Tree、upstream 不變。index.html 原 bytes 與其餘未授權變更的 G2 已驗收檔案／兩份正式報告 SHA 均相符。工作樹內容 diff／numstat／check 只限本輪五個明確路徑。沒有 Stage、Commit、Push、清理、還原或 EOL／設定修改。

原始證據與截圖保留在 `C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU`；[Preflight](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/preflight.json)、[Postflight](C:/Users/User/AppData/Local/Temp/g3-a-shell-rN98kU/postflight.json) 及 [精簡 evidence](g3-a-pc-match-shell-v0.1-evidence.json) 包含完整性與 artifact SHA／bytes。codebase-memory 的圖譜工具未提供，已使用精確檔案來源後備查核，未宣稱圖譜覆蓋率。

## G3-B 可行範圍與停止點

未來可在固定 matchPresentationHost 內掛載只讀 Phaser 場景，以既有 Public Snapshot／Timeline 的事件 ID 更新呈現；合法按鈕、Gameplay、reveal cursor、Save 與 settlement 繼續由原 Owner 負責。沒有合法公開座標前，只能使用中性場景／事件示意。實際賽事／隊名需要另行授權的 public metadata contract；本輪未越權補接。

**本輪完成後停止；未開始 G3-B 或 Phaser。**
