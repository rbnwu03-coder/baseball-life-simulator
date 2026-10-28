# 版本、範圍與因果鏈稽核

日期：2026-10-28（Asia/Taipei）。版本與既有變更見 [baseline.json](baseline.json)。本文件依目前工作樹；不採舊報告中的 branch／commit 作為現況。

## 版本與既有意圖

| 項目 | 本輪確認 |
|---|---|
| Git | `accepted-gameplay-g2-b2-v0.1`；`0d3ed173952b9b8e5d5842a73761f649b50be594` |
| 近期提交 | G2-B2 可操作逐球 UI ← G2-B1 自然混合比賽連續性 ← G2-A 公開比賽 bridge ← G1-C 九守位 NPC 最小閉合 ← G1-B 外野安打接續 |
| 既有工作 | 3 個 tracked modifications：逐球 UI JS／CSS、fast-check smoke；大量既有 untracked docs／contracts／assets 等。沒有覆寫 |
| 執行入口 | `index.html` 有序載入正式模組；`application-controller.js` 管公開操作；`script.js` 管主線、實戰與敘事接線。`gameplay-prototype.html` 是另一入口，不當作完整生涯已完成證據 |
| 無畫面方式 | Node v24.19.0；沿用 `tests/high-school-career-test-context.js`，依目前 index 載入 scripts，排除 ApplicationController；簡化 DOM／timer 只供引擎驗證 |
| 測試入口 | package.json 只有兩個 opportunity audit npm scripts；其餘明列 Node 測試。沒有假設存在 `npm test` 或整庫一鍵驗收 |
| 指令 | 使用者提供的 AGENTS.md 是適用指令。工作樹 rg 沒找到額外 AGENTS.md。已讀 codebase-memory skill，但工具 catalog 無圖譜介面；依 source fallback 查證，無 index coverage PASS |
| 設計依據 | `story.js` 高一事件、`playing-time-game-exposure.js`、競爭重評／成長／保存程式；對照 G2-B2、Playing Time v1、Development v1、既有連續性與測試文件 |

舊 G2-B2 報告寫的是開工 G2-B1 分支與 PARTIAL 程序結論；目前 HEAD 已提交 G2-B2，這不會使舊程序聲明自動變成 PASS。本輪只報本輪執行。十年敘事文件、兩份 xlsx 排程及 UI／動畫 spike 不構成本輪功能完成證據，未對 xlsx 進行內容稽核。

## 可驗證範圍

**已執行驗證**：高中入學 fixture → 報到 → 守位形成 → 生活 → 暫定角色 → 名單準備 → 秋季交流賽 → 阿哲電話 → 第二次隊內實戰 → 角色回饋 → 高橋／高二方向 → 第一年小結。兩場都以正式比賽解算，沒有手填分數／結局。第二場是「不列入正式賽程的隊內評估」，不能稱為第二場官方聯賽。

**補充範圍**：高二五項自主訓練、Development 公式、關係與跨年既有測試。**尚待確認**：真人閱讀／操作體驗、全創角至高一所有路線、完整受傷診療與復健週期、成年人長期平衡。

**已由程式確認＋已執行驗證**：投手 `pitcherExposureDeferred=true` 會得到 `noAppearance`（`playing-time-game-exposure.js:93,288`）；本輪實跑零打席、零守備決策。對手投捕 AI 配球和玩家捕手處理球並不等於「玩家完整投手生涯已閉合」。`high-school-career-evaluation.js:79` 也明示正式投球證據尚未建立。

## 系統因果鏈

下表「保存」指相應 player 欄位／match 經現行 Save 保存；除註明已實測者外，不把欄位存在視為所有遷移版本都通過。

| 因果段 | 輸入 → 輸出／owner | 下一個系統的實際消費 | 玩家理解途徑 | 保存與缺口 |
|---|---|---|---|---|
| 1. 高一準備與生活 | `story.js:1070–1125,1721–1745` choices → 特質、baseballSkills、body、關係、旗標；`script.js:3879,1571,14718` 套用 | 守位評估、暫定角色、實戰能力、人物分支讀取；非每個旗標都有專屬後續 | 選項文字、stat feedback、狀態摘要、教練評語 | player skills/body/flags 保存；高一普通選擇 fresh load 的數值／記憶／步驟一致【已執行驗證】 |
| 2. 能力與身體 | 技術＋特質 → offense／defense capability；`script.js:6714,6728`；body 另存 | 正式 PA／守備使用 capability；高一暫定角色讀 pain/risk；賽後 evaluation 讀三項健康值 | 能力摘要、疲勞／疼痛／風險、評價原因；缺少明確說明健康在哪一步作用 | body 保存；同角色嚴重負荷與健康比賽紀錄 16/16 相同。不可說整個遊戲完全不使用健康 |
| 3. 守位形成與角色 | 過往守位、能力適配、理想、隊內缺口、選擇旗標 → primary/secondary/evaluation；`script.js:4159,4225` | Roster materialization、readiness 與出場安排讀主守位；secondary 有合法性與用途條件 | 教練形成理由、角色證據、第一份實戰名單 | role／position／selected roster 由 Save 保留；既有28／40項高一測試及44項跨年測試通過 |
| 4. 角色 → 機會 | readiness、actualRole、學校環境／競爭、用途、穩定 hash → plannedUsage；`script.js:9550,9860` → `PlayingTimeGameExposure.resolveStartingOpportunity` | 正式 lineup、替補進場、曝光記錄消費 plannedUsage；starter 不等於每個 role 都必須同等出賽 | 現有 assignment／role context；需區分角色、預計用途與實際上場 | opportunity snapshot、decisionId、history 保存。高一兩次機會未設 includeDynamicReadiness；高三另有健康不可出賽 gate |
| 5. 比賽決策 → 表現 | approach／manual-or-simulate／逐球 take/contact/power；守備合法 route；`script.js:3636,9501,11136,12766,13053` | 正式 PA／守備解算 → gameRecord／contribution／completedMoments／exposure；同球 lifecycle 與去重保留 | 原 Match 當下局勢、觀察、風險與執行／決策品質；新 pitch view 只支援公開 plate routes | active situation、seed、pitch/PA identity 保存；決策前 save/reload 的最終 record／重評／下一機會一致【已執行驗證，外部 RNG 明列還原】 |
| 6. 個人表現 → 評價 | contribution、moments 品質、真實曝光、訓練 readiness、trust、health → evidence/sampleScore；`script.js:13432` → `high-school-competition-reassessment.js:75` | 累積趨勢、競爭 gap、樣本門檻決定角色；比賽成長另經 MatchExperienceDevelopment | completed moment feedback、角色重評原因、成長與未出賽說明 | evaluation／development／applied IDs 保存；重複 settle、重複重評不加效果【已執行驗證】 |
| 7. 表現 → 人物反應 | overallTier → coachReaction／consequence；role → 高橋 entryType；bond/印象/共同證據/能力 → 阿哲三分支；`script.js:13579,14266,14305` | coachReaction／consequence 本身是字串，不是新增任務命令；真正角色由重評 owner 改。阿哲 echo／高橋 pressure 被年末摘要消費 | 教練逐球與賽後回應、電話、年末回收 | echo/context 保存【阿哲三分支 fresh load 已驗證】；高橋只依角色，教練主要依 tier，缺少具體行為記憶；未出賽仍有虛構動作回饋 |
| 8. 評價／反應 → 下一次機會 | first match evaluation trend、actual exposure、canonical role → followup opportunity；`script.js:13500`；第二場 → history／年末／跨年 | 第二場使用既有 opportunityDecision；跨年帶角色、競爭、名單與健康；阿哲／高橋字串沒有被直接加入出場權重 | 第二次安排與實際曝光、角色維持／升降原因、年末下一階段要求 | two match history、next opportunity、transition state 保存。輪替升先發要≥3樣本，高一只有2次：是跨年累積取捨，不是保證一年升先發 |

## 三種斷鏈檢查

- **有數值但這條路未使用【已由程式確認／已執行驗證】**：高一機會未傳動態健康；full-match capability 不讀 body。較舊 `baseball-gameplay-integration.js:191` 確有健康分類，不能把那段功能存在當成目前逐球 full-match 已使用的證據。
- **有文字但沒有對應後果【已由程式確認】**：「下一場名單保留」「下一輪先練接球」為結算字串；實際安排仍依重評與機會 owner。高橋的高二壓力只寫 context／旗標與摘要，沒有查到該旗標直接解鎖不同高二訓練或邀請。bounded 查核涵蓋 script/story/player/save，不宣稱整個未來不存在任何延伸。
- **有後果但原因不足【已執行驗證】**：健康組與負荷組表現相同，後者重評平均低0.896；畫面若只寫「評估承壓」，會讓玩家以為相同比賽被任意扣分。需說明是身體可用性證據，不應把它包成技術判斷失敗。

`npc.js`、`coach.js`、`rival.js` 是簡單舊物件；index 未載入它們。`script.js:1273` 只在全域存在時同步。正式人物狀態主要在 player.relationships／impression／characterArc。這是已確認的入口區別，不是建議移除或重寫 NPC framework。

## 文件與實作差異／保留界線

1. 高一故事仍有 legacy skillEffects 的直接成長；高二自主訓練已改 progress-first。兩者時間尺度不同，本輪沒有把它直接判為成長 bug，也沒有遷移舊主線。
2. Match 新 pitch view 已接正式逐球提交與能力影響，但其他決策仍走原 UI；投捕 AI 存在不代表新 view 可由玩家手動配球。
3. 阿哲文字把「下一個週末／幾天後」連續後果寫進同一次結算；資料上是持久摘要，沒有獨立等待中的事件／冷卻計時。後續事件排程是提案。
4. 目前以樣本與gap累積角色的設計，能容許輸球仍獲正評、贏球仍受負評，已獲自然比賽實例。沒有把球隊勝率要求設為所有策略相等。
