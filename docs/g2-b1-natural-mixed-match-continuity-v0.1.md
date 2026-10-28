# G2-B1 — Natural Mixed Match Continuity v0.1

**G2_B1_PASS**

正常 Career Match 已實際包含原 Player OPA／Plate Decision 逐球執行與明確的 AI Compressed PA，且兩種交接均自然發生。Public／Save／Record／Career 連續性通過，沒有需要修改 Production 的阻斷缺口。這不代表自然 S1／S2 same-ball BIP 或完整 Detailed Outcome 已開放。

## Baseline 與方法

- Branch：accepted-gameplay-g2-a-v0.1
- HEAD：285c4da83a51334dc2e867492c84c9b9d879e3d8
- Parent：9c829c32663c808686b187ce15807b297663ed4f
- Tree：670bc8f31fb90afa17ee8a9cc6c6f20b29e5753f
- Upstream：origin/accepted-gameplay-g2-a-v0.1；Ahead／Behind 0／0。
- 開始為 1 tracked WIP、1,224 untracked、staged 空，12 Protected metadata 相符。Index SHA256：eedf95ad5b748acecda05f1f0ec719b85518dedb4e0d6faa914e22d5088466bc。

已讀有效使用者 AGENTS、codebase-memory SKILL.md 及正式 G1-C／G2-A Report/Evidence，SHA 符合已驗收值。skill 正常提權讀取成功；list_projects／index_status／check_index_coverage 等圖工具不可用，因此使用已知入口的精確來源、caller 與原 runtime 觀察，不宣稱 graph/index coverage。未進行全庫掃描或 Monte Carlo。

## Natural Source Owner／Mode Matrix

| 模式 | 正式入口 | 原結果 Owner | Public Bridge | 本輪結果 |
|---|---|---|---|---|
| Player Detailed | chooseHighSchoolYearOneMatchMoment → prepareHighSchoolPlateDecision／resolveHighSchoolPlateDecisionPitch | PlateDecisionFoundation.resolve → OffensivePlateApproach.resolveNextPitch → resolveHighSchoolOffensiveDecision → 原 PA／Record；K 另有原 C 接捕 | 只讀已執行 pitch／已呈現 lifecycle／Record 前綴 | 真正逐球執行，非僅以玩家按鍵判定 |
| Ordinary Compressed | advanceHighSchoolMatchPlaybackStep → resolveSimulatedHighSchoolPlateAppearance | AIPlateAppearanceOutcome.resolveCompressedPlateAppearanceOutcome → 原 apply／record／打序 | 讀 resolutionMode、authority 與原可見 journal | 明確 compressed trace，未將其他 ordinary PA 冒稱 compressed |
| Mode Handoff | 原 Playback／原 offensive opportunity 或 agencyManual → 原 PlateDecision → resultApplied → 原 Playback | 原 pendingOffensiveOpportunity／simulationPhase／lifecycle／Record | 無 submit、無 simulation 權限 | C→D、D→C 均有原序列與 identity 證據 |

主要來源：script.js:3573／3636（原 agency／提交）、6684（原換人）、6929（原 PA）、7183（Compressed）、7229（換半局）、10769（controlled same-ball opt-in）、11095／11135／11449（Detailed admission／pitch／settlement）、13579（終場唯一結算）、14061（Playback）；plate-decision-foundation.js:39／85、match-game-record.js:389／461、live-public-match-bridge.js:83／343、save.js:397／435。

原 Player Detailed 在第一球執行前已建立 PA identity 與實際 pending pitch，並經原 Situation admission／presented 狀態提供 routes。沒有注入 sameBallExecution.enabled，沒有把 controlled S1／S2 的 beforeFirstPitch admission 冒稱為自然模式。本輪 Detailed 的判據是實際原逐球 owner 呼叫、pitchHistory、closed lifecycle、resultApplied 與唯一正式 PA；不是「玩家決策 + NPC 模擬」的推論。

## 正常完整比賽

三次獨立原 VM 執行，均直接重用 G2-A 的 makeContext → careerFixture（二壘手、starter、seed 77001）→ choose(critical_offseason,1)；接著只用原 public choices／chooseHighSchoolYearOneMatchMoment 與原 Playback。沿用原 choice sampler .62，不指定投球／擊球／NPC／物理結果，不搜尋 seed 或改 admission。第二次是相同策略的存讀對照，第三次改選原合法 contactSwing；不能把三次當成多種子頻率證明。

| 正常執行 | 步數 | 原 Decision／逐球 Decision | Detailed PA | 明確 Compressed PA | 其他原 PA | C→D | D→C | 主：客 | Public Events |
|---|---|---|---|---|---|---|---|---|---|
| original G2-A take policy | 146 | 11／8 | 2 | 77 | 6 | 2 | 2 | 5：3 | 272 |
| same Career with six real save/load boundaries | 146 | 11／8 | 2 | 77 | 6 | 2 | 2 | 5：3 | 272 |
| same Career legal contactSwing policy | 178 | 18／13 | 3 | 89 | 7 | 3 | 1 | 6：8 | 333 |

基準場恰與 G2-A 同 seed／策略，因此 5：3 是實測重現；contactSwing 場為 6：8，沒有固定預設比分。第一個已準備 pitch 的 identity 相同，但 take／swing 的原執行 facts 不同，證明合法決策實際進入原 Detailed execution。

基準場另有 6 個原 PA：3 個 offensiveBuntPAState.countResult、2 個 existingOrdinaryPhysicalOutcome、1 個 playerRoutinePlay／physicalOutcomeMappingV1。這些保持原 authority，不硬算入 77 個明確 Compressed 或 2 個 Player Detailed PA。全部 PA 仍納入原 Record 完整性驗證。

## 實際自然交接與 identity

基準 Match：hs-y3-final-competition-1。

| 交接 | 原序列 | Actual Detailed PA identity |
|---|---|---|
| C→D 1 | compressed PA 90 → 原 playerEntry 91／moment 92 → Detailed PA 93 | hs-y3-final-competition-1&#124;hs_y1_match_moment_1&#124;player&#124;6&#124;下 |
| D→C 1 | Detailed PA 93 → compressed PA 95 | 同上，完成後原打序接 school-powerhouse-409d352a-player-16 |
| C→D 2 | compressed PA 139 → 原 agencyManual／moment → Detailed PA 142 | hs-y3-final-competition-1&#124;hs_y1_match_moment_3&#124;player&#124;8&#124;下 |
| D→C 2 | Detailed PA 142 → compressed PA 144 | 同上，原下一棒，沒有重新執行舊 PA |

兩個 PA 各 4 個真實 pitch、各一個 K／原第三好球接捕完成、各一筆正式 PA。Compressed trace identity 不重複；每步已完成 PA 原事件保持相同，未重抽或改寫。Player Entry 合法將原預告的第 5 棒 NPC 替換為 player；打序核對依原換人事件，而不是忽略替補。

三次均未出現相鄰不同 PA 的 Player Detailed→Detailed，列為未覆蓋；同 PA 連續球不算交接，也未為此調機率或注入新 PA。其他未分類的原執行不被冒稱此路徑。

## Gameplay／Presentation／Consumer 分權

每個原執行步驟前後核對實際 phase、PA／pitch／situation identity、cursor、log 長度、打者、seed、比分與出局。原步驟只會是 Gameplay 進展、既有 cursor 揭露、合法決策／outcome 等待或完成；超過 600 步會拋出含最後邊界的失敗，絕不以到達上限當 PASS。

Bridge 的 project／projectSnapshot／projectTimeline／readCurrent 與 Consumer 每步反覆讀取：Math.random 被設成一旦讀取即失敗，原 player JSON 與所有觀察到的 Gameplay／cursor owner call counts 必須不變。Consumer 只消費已公開 event IDs，跨反覆讀取與 Reload 不重播；事件順序與原已揭露來源一致。

Snapshot 的局數、outs、bases、攻守來自原可見 presentationSnapshot；Scoreboard 經原 MatchGameRecord 對可見前綴 query。所有有 eventRef 的 Public Event 必須屬原 cursor 前綴；尚未有 PA identity 時保持 unavailable；unsupported 決策仍顯示等待。已關閉且原始 retained lifecycle 的 DECISION_ACCEPTED 也有原來源，不把它誤判成未來 PA 結果。未揭露結算不顯示為 PA_SETTLED。終場無新可提交決策。

## Save／Reload 與 Career

實際六次 saveGame／loadGame：合法決策等待、C→D admission、Detailed PA 兩球之間、Detailed 正式結算後、D→C 原下一 PA、終場。其中等待與 C→D 共用同一自然入口，因此為六次存讀、五種不同 source state。Snapshot／保留的 Timeline、Record／seed／打序／能力與後續整場結果全等，沒有執行 owner 呼叫或重結算。未修改 Save schema。

同步 resolve 呼叫內部及 Live Ball／Recovery 不是本輪自然可儲存 checkpoint；只驗證原允許的 pitch 間等待點，未改 Save 契約或注入中斷。

三場原 Match／Record integrity 均空，Record finalScore 與公開比分一致；每場 Career match settlement 實際由未結算轉為結算恰一次。既有 per-skill development IDs 各自唯一，不能把不同技能的兩個合法 settlement ID 誤認為 Career 重複結算。完成 PA 的舊決策、終場 playback／decision／settle 重送均不改 Record／RNG／永久能力。

## 正式測試與變更

新專項 9/9 PASS，另 12 套直接相關原 CLI 全部 PASS（共 13 套、exit 全 0）：

| CLI | 結果 |
|---|---|
| tests/g2-b1-natural-mixed-match-continuity-test.cjs | PASS 9 |
| tests/g2-a-live-public-match-bridge-test.cjs | PASS 34 |
| tests/g1-c-nine-position-npc-minimum-closure-test.cjs | PASS 55 |
| tests/g1-b-outfield-single-grounded-continuation-test.cjs | PASS 43 |
| tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs | PASS 29 |
| tests/match-vnext-same-ball-execution-contract-test.cjs | PASS |
| tests/match-vnext-same-ball-production-integration-test.cjs | PASS |
| tests/scoreboard-presentation-integrity-test.js | PASS |
| tests/scoreboard-presentation-production-integration-test.js | PASS |
| tests/match-situation-lifecycle-test.js | PASS |
| tests/plate-decision-production-integration-test.js | PASS |
| tests/pitch-production-source-scope-test.js | PASS 7 |
| tests/pitch-sequence-state-production-integration-test.js | PASS 8 |

Match vNext 保留原 94 source checks／5 歷史 pins、controlled fail-closed／Recovery 拒絕；Pitch Source Scope 保留 95 函式／25 globals／131 mutation rejection，原 G2-A 的 5 個 loader mutation rejection 亦保留。沒有修改原正式測試或 source guard。新專項初稿對 closed lifecycle、legacy PA identity、halfInningEnd 欄位與原合法替補的假設經來源查明後校正；失敗 logs 保留，沒有以修改 Production 或弱化原回歸來通過。

**Production 修補：0。** 僅新增專項測試與這兩份指定文件；來源／Save／Match／Scorer／Bridge／公式／admission policy 均不變。新測試 SHA256：47178ffde9f2bd5d6b63019c498f7162c200b9c0ccdc54fa2f409fc3d7b87e91。三檔最終 Manifest（含兩報告 SHA，避免自我引用）另保存在 C:\Users\User\AppData\Local\Temp\g2-b1-continuity-e09wP1/changed-files-manifest.json。

## 完整性與未覆蓋項目

完工核對全部 PASS：原 1 tracked Protected WIP、1,224 個原 untracked 路徑／狀態與允許核對的內容 SHA 全部保留；12 Protected 只 stat size／mtime，未讀內容、雜湊或執行。完成後為 1 tracked WIP、1,227 untracked（只新增本輪 3 檔），staged 空。HEAD／Parent／Tree／index／upstream／正式本機與遠端 refs 均未變，本輪未做 Git 寫入。

未覆蓋：相鄰 Player Detailed PA、自然 S1／S2 same-ball BIP／Recovery、未捕第三好球跑壘、外野新長打／error／relay、未保留的歷史瞬間事件。Live Ball／Pending Recovery 不能改用 Compressed 重擲；原守門與原拒絕回歸保留，本輪未靠此類 fallback 完成自然場次。

G2-B2 可另行授權接線既有 supported PlateDecision routes，並依原 situationId／pitchId 鎖定與去重；原 momentId 會跨同 PA 多球，不能當成網路 retry 的逐球 idempotency token。高階 approach／agency／守備等未接入的 Public routes 仍 unsupported，走原入口／UI。這不等於 G2-B2 PASS，亦不表示全自然 Detailed、G3、Phaser 或 Public Alpha Ready。

完成後停止；未 Stage／Commit／Push／切分支／Reset／Restore／Clean／Stash／Merge／Rebase，未開始 G2-B2／G3／Phaser 或正式 Match UI。
