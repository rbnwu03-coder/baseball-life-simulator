# G2-B2 — Playable Match Decision & Browser Integration v0.1

**G2_B2_PARTIAL**

真實 Chrome 與功能回歸通過；Protected 的禁止內容讀取程序限制未全程遵守，因此不宣告 G2_B2_PASS。程式與證據均保留供審查，未 Stage／Commit／Push。

## 基線與施工邊界

- Branch：accepted-gameplay-g2-b1-v0.1
- HEAD：630eb43efe65745ac0e6a05f2d204365bcfe8705
- Parent：285c4da83a51334dc2e867492c84c9b9d879e3d8
- Tree：72360cefe68db18034988ea87aaefedaf04efc9f
- Upstream：origin/accepted-gameplay-g2-b1-v0.1；Ahead／Behind 0／0。

開始時及最後的安全狀態核對均符合。原 script.js、ApplicationController、Match、Save、Scorer、PlateDecision 與 Public Bridge 來源未修改；未新增 Detailed Admission、S1／S2／Recovery 或模擬器。

## 原入口與 UI 責任

| Source | Responsibility |
|---|---|
| index.html / ApplicationController.startGame | 原角色建立與完整比賽開發入口 |
| script.js:createPlayer / prepareHighSchoolYearOneMatch | 原 Career Match 建立及原播放排程 |
| renderHighSchoolYearOneMatch | 原 #story／#choices；Approach／Agency／守備選項保留 |
| getHighSchoolYearOneMatchMomentChoices | 原 plateDecisionRoute → matchDecision／matchMomentId 對應 |
| chooseHighSchoolYearOneMatchMoment | 唯一逐球 Match 公開提交 Authority |
| showCurrentEvent / Save / Reload | 原畫面重繪與生命週期 |
| LivePublicMatchBridge.readCurrent | 唯讀 Public Snapshot／Timeline 與揭露界線 |

遵循使用者 AGENTS 的 codebase-memory 技能；本輪圖譜工具未提供可呼叫介面，以指定檔案精確讀取及 bounded rg 呼叫點查核補足，不作完整圖譜／覆蓋率主張。

## 變更與操作契約

| Status | Path | Purpose |
|---|---|
| M | index.html | 精確新增 UI JS 與 CSS 載入 |
| A | match-pitch-decision-ui.js | 小型 View／單用途 Decision Adapter |
| A | match-pitch-decision-ui.css | PC 操作區與鍵盤焦點樣式 |
| A | tests/g2-b2-source-delta.cjs | 精確 loader／scope／原測試反向驗證 |
| A | tests/g2-b2-playable-match-decision-test.cjs | Adapter、identity、原 PA、Source Guard 專項 |
| M | tests/g2-a-live-public-match-bridge-test.cjs | 兩處精確反向處理，原 assertions 全數保留 |
| M | tests/pitch-production-source-scope.cjs | 一行精確新 loader reversal，原 pins 不變 |
| A | docs/g2-b2-playable-match-decision-v0.1.md | 本報告 |
| A | docs/g2-b2-playable-match-decision-v0.1-evidence.json | 精簡可核對 Evidence |

View 位於原 #story 之前，透過觀察原 #story／#choices 根節點重繪更新；不另建遊戲頁面、不替換 Match。比分、局數、出局、壘包、打者、投手、球數與結果只讀 Public Bridge，尚未公開的欄位顯示「—」。只在 available 時呈現原 legalRoutes／中文標籤；Original UI Supported、New Pitch View、Pending、Unsupported Presentation Route 分開分類。

每次提交重新讀取 Bridge，核對 matchId、paId、pitchId、situationId、routeId、expectedMomentId、原 presented／admission、精確原 choice 對應，再呼叫原 chooseHighSchoolYearOneMatchMoment。UI epoch 與 Match object 邊界排除重繪／Reload 舊 callback，inFlight 防重入；native click.detail > 1 阻止第二下雙擊誤送下一球，keydown.repeat 防長按重送。去重不只使用 momentId。

不另行抽球、判定結果或重算球數。原 Match Playback 與原 outcome「繼續」流程保留；View 不使用 setTimeout 推進 Gameplay，也不把 Consumer.advancePresentation 當成 Match 進度。Public Reveal 前不展示尚未公開投球。

Source Guard：兩個新增 loader 精確移除後，index 回到 G2-A canonical SHA 67c117f897cf86e2a55ee3ed26ddf1c5eaf8a4f73a3017ede1436220d278cf30；scope 新一行反向處理後回到 cc98ef0fd98f4ad128e5a714b1823c3a294bef1b6c01d06bfc7391f049046644；G2-A 測試兩處反向處理後回到原 SHA 8ed2c64b539c0d78e4207927f298fde7a5c787791c04296f36fe778edd626b3e。原 assertions 與歷史 pins 完整保留。

## 真實 Chrome 操作證據

- Browser：Chrome/155.0.8059.85，既有安裝；真實 headless Chrome 渲染及 Chrome DevTools Input 滑鼠／鍵盤事件。未安裝新框架。
- URL：http://127.0.0.1:61005/index.html；伺服器只允許正式已追蹤檔案及本輪新 UI 來源，禁止 Protected 路徑。
- 入口：原角色建立 → 技巧型 → 原能力配置 → 開發／試玩入口 → 完整比賽｜1局上 0：0 → 二壘手 → 開始。
- 原入場及 Match RNG 自然執行，未注入投球結果、NPC 能力或 Admission。原開發入口既有的測試能力規則沿用。

完整 PA：hs-y1-autumn-exhibition|hs_y1_match_moment_1|player|2|下。

| 原 pitch | 玩家輸入 | 原公開投球結果 | 正式結算 |
|---|---|---|---|
| pitch-1 | 滑鼠 take，含原生第二下雙擊 | calledStrike，0 壞 1 好 | 僅執行一次 |
| pitch-2 | Tab／Shift-Tab 聚焦 contactSwing，Space 提交 | ballInPlay | 原 Record sequence 31，out，2 球 |

同一 physicalIdentity 連結 pitch-2 與官方 PA event。原比賽繼續至終場：主隊 2、客隊 5；Match／Record integrity issues 都為空，eventRefs 皆唯一，Public Scoreboard 與原 Record／scores 一致。

Browser negative cases 全數通過：雙擊只執行一次、detached 舊 callback、Save／Reload 舊按鈕、重繪後過期 callback、長按 Enter、Unsupported 原 UI fallback（3 次）、終場無逐球按鈕、重複 UI read/render 不增加 Record、Console 無阻斷例外。Save／Reload 前後原 seed／Record／log／experience 及 Public Snapshot／Timeline 相同。

最終呈現修正後重新載入原頁，從原讀取 UI 載入先前測試存檔，再完成合法 PA；1366×768、1600×768、1920×768 均無橫向溢出。按鈕文字完整，原生 Tab／Space 可操作，送出結果後焦點維持在 feedback。

畫面與詳細步驟位於外部 C:\Users\User\AppData\Local\Temp\g2-b2-playable-zOYWcb：browser-decision-before.png、browser-after-take.png、browser-after-swing.png、browser-match-final.png、browser-final-source-pa.png；完整 identities／前後 Snapshot 見本 Evidence 與 browser-evidence.json。

## Focused Regression

| Suite | Final result |
|---|---|
| G2-B2 Adapter／Source migration | 21/21 PASS |
| G2-A Public Bridge | 34/34 PASS |
| G2-B1 Natural Mixed | 9/9 PASS |
| Pitch Production Source Scope | 7/7 PASS；95 functions、25 globals、131 mutation rejection |
| PlateDecision Production | 15/15 PASS |
| Situation Lifecycle | 23/23 PASS |
| Match vNext Contract | 94 source checks／5 pins PASS |
| Match vNext Production | 13 groups PASS |

八套正式 CLI 均有外部 --import 讀取監測，限制 runtime/source 依賴且阻止 Protected；觀察 117 個不同實體依賴，監測測試中的 Protected access 為 0。最後 View 分類／文案修正後僅重跑受影響的 G2-B2 與 G2-A，亦通過。沒有 source substitution 或 VM resolver／assertion 替換。

## 完整性與操作失誤

最終核對通過：原 tracked WIP 仍恰好 1 個 Modified，12 個 Protected size／mtime 未變；原 1,226 個 untracked 與所有舊報告保留。最終 tracked modified 4 = 原 WIP + 本輪 3 個 Modified，untracked 1,232 = 原 1,226 + 本輪 6 個 Added。完整路徑／狀態集合符合精確九檔施工清單。

HEAD／Parent／Tree／upstream 0/0、所有開始時 refs、遠端六個正式分支、.git/config 與 index 未變；staged 空。Index SHA256：1cc382c9087316cba18552e6e57d2f23d9ab4b373f2bad68deedf6604228938c。原核心來源、允許核對的其他內容及舊 Evidence SHA 均保持原值。

程序失誤：執行了一次未限縮路徑的 git --no-optional-locks diff --stat，Git 計算並回報 Protected 路徑 tests/fast-check-smoke-test.cjs 的變更統計（10 added lines）。沒有印出原始內容，也沒有修改該檔，但 Git 的內容衍生統計仍違反禁止讀取內容的限制。此事另保存於 protected-access-incident.json；不得把測試監測的 0 Protected access 延伸宣稱為整輪完全無內容存取。

因此整體結案為 G2_B2_PARTIAL，功能 Browser PASS 與回歸結果保留，Protected 程序限制不標為全程通過。

## G3 還缺什麼

不以本輪 PARTIAL 宣告 G3 正式開工基線。需先完成本輪正式驗收，再安排 HTML/CSS 視覺定稿與只消費 Public Timeline 的 Phaser 呈現接線；本輪未開始 G3／Phaser，也未擴充投捕或 SS／2B 守備 UI。

未執行 Stage／Commit／Push、branch switch、Reset／Restore／Clean／Stash、Merge／Rebase。完成後停止。
