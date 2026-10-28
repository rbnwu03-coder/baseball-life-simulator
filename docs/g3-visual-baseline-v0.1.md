# 《棒球人生》G3 Visual Baseline v0.1

狀態：**VISUAL_BASELINE_PARTIAL**。核心版面、正式資料整合與操作驗收通過；人物仍是中性 SVG 佔位，美術未完成，因此不宣告 `G3_VISUAL_BASELINE_READY`。本輪到此停止，未開始 G3-B 或完整 Phaser 動畫。

日期：2026-10-24（Asia/Taipei）。正式 HEAD：`0d3ed173952b9b8e5d5842a73761f649b50be594`。

參考圖：`E:\meng\references\match-visual-baseline-v0.1.png`。第一輪 preflight 時檔案及目錄不存在；使用者回覆已放妥後，已實際讀圖。本輪使用其構圖與暖色框架，未以整張圖片作為背景，未採用圖中的球隊、比分、球員、天氣或球速。

## 實際完成

- 上方賽事 Header、原 Match 完整逐局計分板、R/H/E、主客隊與目前局數。
- 左側比分、B/S/O、壘況、原 Match 最近事件及可展開的策略線索。
- 中央本壘後方鏡頭：球場、投手丘與投手、近景打者、捕手、K-Zone、公開結果文字，各自分層。
- 右側投手／打者正式公開姓名與守位、肖像 unavailable 佔位及當前局面。
- 下方固定決策區，保留原策略選項、逐球合法 routes、Tradeoff、結果回饋及所有原有提交 guard。

計分板直接搬移原 Match 已渲染的 DOM，保留原 reveal cursor 與公開逐局數據；不重建 Scorer。正式場次為 7 局，因此保留 7 局，沒有套用參考圖的 9 局內容。賽事與隊名取自原計分板的正式呈現；Bridge 未提供的姓名或欄位保持 unavailable，B/S 未公開時顯示「—」。

SVG 素材為本輪原創程式繪製，未使用第三方人物或肖像素材。人物採原生寬高比、`object-fit: contain`，人物及容器沒有 CSS transform。打者位於左前景，投手居中後景，捕手位於本壘前景；打者未遮擋投手與 K-Zone。人物為中性佔位，畫面已明確標示「美術未完成」。

K-Zone 僅為中性示意。沒有新增球路、落點或球種動畫。結果層只顯示當前 PA 已公開的結果；文字中的球種及球速僅讀取既有 `PITCH_RESOLVED.facts.observed`。

## Chrome 截圖與前後對照

使用已安裝的 Google Chrome 155.0.8059.85，獨立暫存 headless profile，原生 CDP mouse／Tab／Enter／Space 操作。不是靜態 mockup，未注入 Match fixture 或指定 RNG。前後對照使用同一個自然進場、正式 Save 的策略狀態；驗收確認公開 projection 與 before 快照一致。

| 情境 | 施工前 G3-A | 本輪結果 |
|---|---|---|
| 策略，1366×768 | [Before](g3-visual-baseline-v0.1/before-strategy-1366x768.png) | [After](g3-visual-baseline-v0.1/after-strategy-1366x768.png) |
| 完整 Match／逐球，1366×768 | [Before](g3-visual-baseline-v0.1/before-pitch-1366x768.png) | [After](g3-visual-baseline-v0.1/after-pitch-1366x768.png) |
| 一球正式結果 | — | [看球好球](g3-visual-baseline-v0.1/after-take-1366x768.png) |
| 合法揮棒與 PA | — | [揮棒](g3-visual-baseline-v0.1/after-swing-1366x768.png) · [PA](g3-visual-baseline-v0.1/after-pa-1366x768.png) |
| 完整頁面 Save／Reload | — | [Reload](g3-visual-baseline-v0.1/after-reload-1366x768.png) |
| 1600×900 | — | [完整 Match](g3-visual-baseline-v0.1/after-pitch-1600x900.png) |
| 1920×1080 | — | [完整 Match](g3-visual-baseline-v0.1/after-pitch-1920x1080.png) |

三尺寸均檢查：計分板唯一且可見、逐局及 R/H/E 與 Public Record 一致、舞台與決策區同時在 viewport、無水平溢出、人物等比例、打者未遮擋投手／K-Zone、右側球員卡未跨入決策區。策略切換至逐球時，主舞台、決策框、第一個操作與 scrollY 均維持位置。

## 必要測試

| Focused regression | 結果 |
|---|---:|
| `tests/g3-visual-baseline-test.cjs` | 3 PASS |
| `tests/g3-a-pc-match-shell-test.cjs` | 7 PASS |
| `tests/g2-b2-playable-match-decision-test.cjs` | 21 PASS |
| `tests/g2-a-live-public-match-bridge-test.cjs` | 34 PASS |
| `tests/g2-b1-natural-mixed-match-continuity-test.cjs` | 9 PASS |
| `tests/pitch-production-source-scope-test.js` | 7 PASS |
| 合計 | **81 PASS** |

Source Guard 額外拒絕 131 個 mutation。所有執行均加上 dependency monitor，Protected 存取／越界 dependency 違規為 0。未執行完整全庫 regression。

G3-A 原測試與兩份報告保持原 bytes。原 G3-A 的 7 項 Node regression 原樣通過；其舊版「舞台與決策平行同列」的瀏覽器 geometry assertion，由本輪 `assertVisual` 的「舞台在上、決策在下」規格取代。沿用原 `inspectShell` 觀察 gameplay 與 guard，未修改舊 assertion 來假裝相容。

Chrome 13 項操作檢查通過：同一自然進場存檔、原 Unsupported 策略、公開讀取失敗還原原 UI／完整計分板／事件、refresh 不觸發 gameplay 或 RNG、策略至逐球固定位置、鍵盤 take、stale／double-click、Save／Reload 與舊 callback、held Enter、鍵盤 contactSwing、單一 PA 結算及下一合法狀態、整頁 reload、無阻擋性 console error。favicon 404 保留為非阻擋網路雜訊。

實際打席 `hs-y1-autumn-exhibition|hs_y1_match_moment_1|player|2|下`：第一球 take → calledStrike；第二球 contactSwing → ballInPlay；原引擎正式結果 out。兩球各只呼叫一次原 pitch resolver，公開 `PA_SETTLED` 僅一筆。整場不可重複結算另由 G2-B1 三場自然流程及 duplicate-final no-op 測試確認；沒有宣稱 Chrome 已打完整場。普通 Career `day1_morning` 的 story → changeLog → choices 排序及操作亦通過。

## 實際修改 Manifest

| 路徑 | 動作／用途 |
|---|---|
| `match-pitch-decision-ui.js` | 修改既有 G3-A：計分板／事件 DOM 整合、公開資訊、分層場景、固定區域；原 createAdapter prefix 不變 |
| `match-pitch-decision-ui.css` | 修改既有 G3-A：PC 構圖、尺寸與字級，人物等比例，Inactive Career 順序保留 |
| `assets/g3-match/field.svg` | 新增原創靜態場景 |
| `assets/g3-match/pitcher-neutral.svg` | 新增投手中性佔位 |
| `assets/g3-match/batter-neutral.svg` | 新增打者中性佔位 |
| `assets/g3-match/catcher-neutral.svg` | 新增捕手中性佔位 |
| `tests/g3-visual-baseline-test.cjs` | 新增 availability／purity regression 及 Chrome 觀察／斷言 |
| `docs/g3-visual-baseline-v0.1.md` | 新增本報告 |
| `docs/g3-visual-baseline-v0.1-evidence.json` | 新增機器可讀 evidence、逐檔 Manifest、尺寸與安全驗證 |
| `docs/g3-visual-baseline-v0.1/*.png` | 新增上述 10 張真實 Chrome 截圖 |

共 2 個既有 UI 檔修改、17 個新增檔。沒有修改 `script.js`、`style.css`、`index.html`、Bridge、Save、Match Engine、Scorer 或任何 Gameplay clock。

## Protected／WIP／Git

Fresh preflight 與 postflight 核對 HEAD、tree、branch、upstream、正式 refs、Index、Config、原 status set。12 個 Protected 路徑只核對 status／size／mtime，不讀取、hash、diff 或執行其內容。原 1,231 個 untracked 路徑保留，加上本輪 17 個新檔後為 1,248。原 tracked WIP `tests/fast-check-smoke-test.cjs` 保持原狀。

未執行未限縮範圍的內容型 Git diff／stat／hash；無 Stage、Commit、Push、reset、restore、clean、stash、EOL／Git config 變更。新增檔保持 untracked，staged 為空。安全明細及輸出存於 evidence 指向的本機暫存目錄。

依 `codebase-memory` skill 核查工具能力；本 session 沒有提供 graph 工具，使用 `script.js` 的正式 scoreboard renderer、公開 Bridge、UI 及相關 G2 測試的限縮原始碼讀取，未宣稱 graph coverage。

## 後續接入界線與待改善

`#matchPhaserMount` 與 `.match-scene` 共用相同 viewport rectangle；與 HTML 計分板、左右資料與決策框分開。`data-scene-layer` 分出 field、pitcher、batter、catcher、zone、published-result。人物高度、anchor 與原生比例可分別調整，三個目標尺寸的實測大小見 evidence。

未來 Phaser 只能接手此視覺 rectangle 與已公開事件呈現；提交、advance、reveal cursor、結算、Save 與時鐘仍由原 Owner 管理。本輪未載入 Phaser。

待改善：

1. 正式人物美術與站姿審校、投手／打者／捕手細節；目前中性 SVG 佔位不能視為人物美術驗收完成。
2. 球場透視、材質、觀眾與遠景細節仍是第一版 2D 結構；完整人物動作、運鏡與美術定稿未包含。
3. 沒有正式肖像及更多公開球員資訊時，繼續維持 unavailable，不補假資料。
4. K-Zone 與未來球路動畫需要可驗證公開座標 contract；目前不代表真實球路或落點。

**本輪完成後停止；不宣告視覺定稿，不開始 G3-B。**
