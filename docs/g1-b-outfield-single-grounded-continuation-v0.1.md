# G1-B — Outfield Single & Grounded Continuation v0.1

結果：**G1_B_PASS**。明確 opt-in、空壘、NPC 外野 grounded single 完成；先驗收 CF O0，再擴充 LF／CF／RF × O0／O1／O2。43 組專項與 21 套相關正式 CLI 全部通過。自然模式不變；本輪未 Stage／Commit／Push。

## 1. Reproducible Safety Baseline

本輪重新核對磁碟來源：HEAD `bd657b5f18462be2c365abdec1ca14497725557e`、branch `accepted-gameplay-baseline-v0.1`、tree `c99ee839b7bb115179c473f5020e6291d38357a6`。main／local origin/main 維持 `ab3117653945de0b7013636187c446276a96e634`；index SHA256 `b5d3570c2111908bdf308826e527e289003b24c262a549a296d1f2c2cfd52712`，staged 空。附件的 main／ab311 是歷史參考，不回退來源。

1 tracked WIP、1,218 untracked 全部與上一輪路徑狀態一致；1,966 個可讀檔案 SHA 均相符。12 個 Protected 僅核對 size／mtime，未讀內容。G1-A 八份來源／測試與 Markdown SHA 全部吻合最新 Evidence；95 個 Runtime 路徑皆存在。本輪開工資格為 REPRODUCIBLE_WORKTREE_BASELINE；此前正式提交／推送為獨立已完成授權，本輪沒有 Git 寫入。

已讀 codebase-memory skill；圖譜工具未提供，無 graph／index／coverage 宣稱。採確切 source、caller、classic-script 依賴及正式 CLI 驗證。

## 2. G1-A Regression

本輪四套原 CLI 全部 exit 0：G1-A（29 組）、Match vNext execution contract、Match vNext production、Fly Ball production（15/15）。完整時間、stdout SHA 與摘要記於同名 Evidence。

## 3. Exact Owner Plan — 核心修改前鎖定

| Exact owner | 現有 API 缺口 | 本輪最小追加 | 行為／拒絕 |
|---|---|---|---|
| batted-ball-fly-ball-defense.js | 原 access unsupported 走 mapper；沒有正常未到球的落地狀態 | 純函式驗證事前 admission、同一 Physical／canonical primary Reach，投影 grounded live ball | 只限 deep firm/hard fly、empty bases、actual NPC；最佳 reach 仍不可及才證明 ordinary-effort no-catch；可接卻漏接／資料缺失拒絕 |
| defensive-reach-secure-foundation.js | resolveRecoveryAction 限 failed delivery／1B station，不能冒充落地外野 | additive resolveOutfieldRetrieval；沿用原 Recovery 的反應／移動／acquire 係數與能力尺度 | 真 primary NPC、已落地球、鎖定 approach/acquire samples；失敗保留 loose，不能指定持球 |
| defensive-runner-throw-settlement-foundation.js | 舊 resolveRecoveryContinuation 綁定 failed delivery；無外野 hold 終局 | additive resolveOutfieldContinuation，直接呼叫既有 deriveRunnerArrival／Force／ThirdOut | 原 BR speed，獨立一、二壘腿；first 到壘必早於 possession；額外進壘窗口存在則 pending，不強停一壘 |
| defensive-decision-throw-foundation.js | 現有 resolveBatterReachClassification 僅 SS clean infieldHit | additive resolveOutfieldSingleClassification；原 S2-A 與 Error eligibility 不動 | 重算 Ball／Retrieval／Runner 完整事實後，才回 compatible single；missing／stale／unclosed/error evidence 拒絕 |
| script.js | 舊 ordinary PA 在 pitch 前只鎖 compressed；unsupported OF 可能 mapper 結算 | 原 handoff 增 opt-in admission、保存既有 flyBallCatchState 的 extension；原 prepare 接點轉交有界 handler | 一個 Physical、原 PA applier／Record／batting-order；失敗不回 compressed，無第二套 PA／Record |
| 必要 contract tests | 舊 additive-only source 檢查尚不認識此次新增區塊 | 新增精確 extension block／export guard，反轉後仍逐字核對原 pins；增加 mutation negatives | 不刪舊斷言、不改 pins、不豁免任意 body；原 Scorer／Runner／Recovery 必須保持原 bytes |

### 施工前模型契約

policy `g1-b-clean-outfield-single-v1` 僅由 explicit options 在第一球前鎖定。外生 samples 為 `{approach, acquire}`，各為有限 `[0,1)`；只消費一次，無新 RNG。admission 保存原 game／PA／batter／inning／half／teams／outs／runners／scores、active roster、實際 NPC raw／consumed capability 與原 batter speed。

第一種球採原 Physical deep fly、firm/hard。原 Reach 在 roll=0（既有最大 +1 execution adjustment）仍 notReached，才建立 untouched fair landing；secure 不可嘗試，沒有 completed catch 或由漏接推定失誤。這是現有 nominal-primary coarse responsibility 模型內的證據，不宣稱精密座標或全員追球覆蓋。

球位投影：沿原 direction/depth sector；距離 `8 + 4 * original depthScore` meters，landing `firm:5 / hard:4` CRT。這是有界暫定遊戲係數，不是實測秒數或第二套 Physical；不產生新的球型／方向／深度。拾球從 landing 開始，沿既有 Recovery 係數：reaction `1/(1+.25*reaction)`、movement speed `1+.25*mobility`、acquire `1/(1+.25*fielding)`；approach／pickup margins 亦沿原有 clean untouched recovery 係數，全部保存來源與共同 CRT 時基。

Runner 直接使用原 deriveRunnerArrival，時基為 contact=0；first 到壘早於實際 possession 才證明無持球可在 first 到壘前製造 contest。到壘時依已知 grounded location 與 admitted capability 的 possession forecast 比較第二腿；若 forecast 晚於第二壘到達則 attemptSecond/pending，否則明確 holdFirst。成功 pickup 且已到一壘、沒有進行中的額外腿時，以持球控制＋跑者停止作終局，不虛構回傳、baseTouch、PO 或 Assist。

只有三層事實重算一致並閉合，Scorer 才回 single；再由原 applyHighSchoolSimulatedPlateAppearance、recordHighSchoolRoutinePlateAppearance、advanceHighSchoolMatchBattingOrder 提交。Record／Save schema、Career formulas、自然 admission、S2 Recovery rollout 不改。

## 4. G1-B1 One-Outfielder Vertical Slice

先由 CF O0 經原 `prepareHighSchoolDefensiveMomentFromSimulation` → ordinary OPA 的實際 pitch／recognition／swing／fair contact → 原 Physical → 新四層事實 → 原 PA／Record／打序，完整通過後才開始三守位矩陣。打者是實際 `player`，防守為 away active NPC；未以純 API 或單一 result token 代替 Production。

九例使用預先宣告的受控能力：active NPC OF defense=2、speed=7；玩家 batting=16、baseRunning=8、fitness=8。這些數值在 admission 前設定，並非未修改的自然 roster 能力，也不代表自然 single 頻率。原 Physical 樣本固定 contactQuality=.65、ballType=.95、pace=.5、depth=.95；方向 LF=.05／CF=.5／RF=.95，pickup 樣本 approach=.99／acquire=.75。沒有事後挑 seed、改球或指定終壘。

CF 一球：firm/deep、原 depthScore=.6773、落地 5 CRT；best canonical reach margin=-.300，因此無合法接球機會。落地 loose holder=null，真正 CF 拾球於 10.228 CRT 完成。原 Runner 一壘到達 6.400 CRT，二壘若挑戰為 12.800；已知 possession forecast=10.228，因此選擇 holdFirst。實際 control 與已到一壘兩項成立後才可正式分類及提交。

## 5. LF／CF／RF Shared Execution

三個位置共用同一套落地／Retrieval／Runner／Scorer 與原 Match settlement。真正 actor 分別為 `hs-y3-final-regional-opponent-player-07`（LF）、`-08`（CF）、`-09`（RF）；不是玩家外野守備。三者皆由原 Opportunity 與 active roster 綁定，完整 raw／consumed capability、source、identity 在 Evidence 每例保留。

## 6. Physical／Ball／Retrieval Provenance

同一 Physical identity 貫穿 Opportunity、best-effort Reach、grounded state、retrieval、runner、scorer 與原 PA reference。球的方向／深度未被後續 outcome 改寫；grounded holder=null，pickup 完成後 holder 才成為原 active outfielder。沒有使用歷史接傳失敗或舊 Secure 假冒外野球權。

三份預宣告 mobility=6／7／8 對照使用同球與相同 samples；實際 retrieval completion 分別 10.618／10.228／9.904 CRT，全部成功，證明能力影響時間。另有 failed approach／pickup 正式 pending 負例。

V8 precise coverage 於 fixture 設定後開始：`resolveBattedBallPhysicalTruth`、`simulatePlateAppearance`、原 PA applier、原 routine Record producer、原 batting-order advance 各 1 次，包含重複 callback 仍為 1。四個新純 API 因驗證重算為 16／8／4／2 次；它們核對同一份 samples 與 facts，沒有第二個邏輯拾球或 RNG 重抽。

## 7. Runner Timing／Final Base

一、二壘腿直接呼叫既有 `deriveRunnerArrival`，未複製 Runner formula。runner 到壘時依已知 grounded ball／capability forecast 決定是否冒額外風險；不是看到 pickup 成功才倒推選擇。只有 first arrival 早於實際 possession、明確 holdFirst 且真實球權受控，才由既有 Force 取得唯一 BR 一壘終局，再交原 applier 的 ThirdOut authority。

終局規則明示為「唯一跑者停止額外推進＋實際外野手控制球」。此有界模型不需要虛構回傳、踩壘或助殺。慢 BR 尚未先到一壘、存在明確二壘窗口、approach／pickup 失敗時均保持 pending、finalBase=null；原 PA 與播放推進被阻擋，沒有 compressed fallback。

## 8. Official Scorer Classification

既有 Scorer Owner 追加 `resolveOutfieldSingleClassification`。只有 fair grounded、best-effort no-reach、untouched before ground、真 pickup、原 Runner first attainment／hold／control 全鏈重算相符時，才回 `cleanOutfieldSingle`／compatible `single`，並記錄正式理由與完整 source references。

未因 notCaught、safe 或單純無 E 就判安打。原 `resolveBatterReachClassification` 的 SS infieldHit body、`resolveScorerEligibility` 及 Error rules 未修改。可接卻漏接、未知 error eligibility 或未閉合 terminal 均不能使用本分類。

## 9. Match／Game Record Before／After

九例各為原 batter PA／AB／H +1，原 pitcher BF／H +1，team H +1，outs／scores 不變，原 `player` 佔一壘，原 batting order 前進一次。所有守備員 PO／A／E／chance 增量為 0，NPC pickup 沒有變成玩家守備機會或永久能力增量。每例 Match 與 Record integrity lists 均空，並完成下一個原 PA。

未修改 Game Record、Save、Career schema／formula 或原 canonical applier；新增 resolution event 純保存執行證據，H／PA／BF 仍由原 plateAppearance event 入帳一次。

## 10. O0／O1／O2

| 位置 | O0 | O1 | O2 |
|---|---|---|---|
| CF | 0→0，single，next PA | 1→1，single，next PA | 2→2，single，next PA |
| LF | 0→0，single，next PA | 1→1，single，next PA | 2→2，single，next PA |
| RF | 0→0，single，next PA | 1→1，single，next PA | 2→2，single，next PA |

LF／RF best reach margin=-.510，CF=-.300；原責任模型的 sharedEdge／clear 差異保留。O2 single 不誤造第三出局或換邊。

## 11. Save／Reload／Duplicate

真正呼叫 `saveGame/loadGame`，分別驗證 CF O2 的 pending、executed、settled 三個 checkpoint；使用既有 flyBallCatchState normalization 保存 extension，不改 Save schema。每例重載後 PA／AB／H／BF 各只增加一次，原 BR 仍在一壘、outs=2，再次 resolve／apply 或舊 Fly callback 均無副作用。

九例另各驗證重複 callback 不變 PA／Record／outs／打序；fake、stale 或 conflicting facts 在原 PA 寫入前拒絕。

## 12. Negative／Fail-Closed

21 組 Production corruption：錯誤 actor／assignment、缺 Physical、stale Physical／PA／batter／outs／打序、偽造落地、catch 同時記 H、pickup 未 secured、缺 timing、未證明 first、額外進壘未閉合、不支援 contact／direction、僅憑 no-error 分類、unknown error eligibility、矛盾 pickup time、晚切 compressed、admission 後改 samples，全部拒絕且 PA／Record 未變。

另四組真實執行 pending：failed pickup、failed approach、clear extra-base window、first 尚待 contest；finalBase 均 null，不能套用 single 或透過下一個 compressed PA／playback 跳過。純 Scorer 五個缺失／強制結果輸入亦拒絕，輸入 bytes 不變。可接的普通 OF 球被新 policy 拒絕；G1-A 原成功 catch／missed-catch policy 全部維持。

## 13. Legacy Regression

21 個有效正式入口均 exit 0，確切命令／時間／stdout digest 在 Evidence.tests：G1-B 43 組；G1-A 29 組；vNext Contract／Production；Fly production／legality；Game Record；Situation Lifecycle；Opportunity production；Reach/Secure production／foundation；Decision/Throw production／foundation；Runner/Throw foundation；Force advancement foundation；Canonical；Pitch source scope；Tag-up；Line Drive；Active Assignment；Ground settlement lifecycle。

包含原 G1-A 全部 16 套指定回歸；Canonical 50/50（四場固定 seed）通過。另正常 mode-off Career 場 146 ticks、5:3 終場，原 Record final score 與 development.settled 均正確。

Source guard 新增固定 extension／export SHA 與 24 項 mutation rejection；反轉後四個 core 與正式 baseline 完全相同，script 僅六個既有函式修改＋五個新 helper，其他字元完全相同（換行正規化）。原 95 個 protected functions／25 globals／131 negative mutations 全通過。原 Contract 只增加新 guard import，並在兩個讀取點反轉精確新區塊，再執行所有舊 pin／S2-A／Recovery assertions；不是刪除斷言或改 pins。

開發期間新測試 observer 曾用錯 team H 欄位及 final/development property，已改讀既有 hits／status／matchExperience；slow-runner draft fixture 曾越過可接球邊界，改以事前宣告 fitness=0／hard fly 驗證；mobility 三例的合法結果皆成功，驗收明確使用其時間差。這些新測試編寫修正未改舊 Gameplay 預期。一次回歸命令誤寫不存在的 force-advancement-test.js（exit 1）完整保留；其後以真正既有 force-advancement-foundation-test.js 22/22 通過，不將不存在入口冒稱 PASS。

## 14. WIP／Protected／Git Integrity

本輪恰 10 個路徑：五份 Production、原 Contract test、一份新專項 test、一份精確 source guard、兩份報告。六個既存來源／測試的前後 SHA 及四個新檔記於 Evidence；allowlist 之外 1,960 份原可讀內容 SHA 全部未變，原 1 tracked WIP 與 1,218 untracked paths 全保留。範圍為 Git tracked＋nonignored untracked 路徑，不宣稱忽略檔及 .git internals 的全檔案內容稽核。

最終 7 tracked modified（原 Protected WIP 1＋本輪6）、1,222 untracked（原1,218＋本輪4）。12 個 Protected size／mtime 全同，未讀內容／explicit hash／執行。HEAD／branch／main／local origin/main／remote tracking baseline／index／staged 與開工一致；本輪完整 refs 比對亦一致。限定六個 changed tracked paths 的 diff --check exit 0；新檔無 trailing whitespace。Git LF→CRLF 提示為既有 autocrlf 行為，未做 EOF 清理。

本輪未 Stage／Commit／Push／Reset／Restore／Clean／Stash；舊 G1-A／F01／Readiness 文件未改寫。Evidence JSON 不宣稱自身最終 SHA。

## 15. G1-B Status

**G1_B_PASS**：限定受控 empty-base NPC LF／CF／RF deep-fly no-reach → 真拾球 → 原 Runner hold-first terminal → 正式 clean single → 原 PA／Record／下一打席閉合，九個 O0／O1／O2、存讀防重、負向拒絕、原指定回歸與完整性檢查均通過。

這是本輪未提交的工作樹成果。既有遠端 Baseline 仍是先前 bd657 commit，不包含本輪修改。完成後停止，不開始 G1-C／G2／G3。

## 16. Remaining Coverage Gaps

occupied bases、外野 extra-base／error／relay、玩家外野主動決策、G1-C 九守位最低責任、S2 自然 rollout 與 Phaser Alpha 均不在本輪放行範圍。

本模型只有既有 nominal-primary coarse zone：沒有次守備員跨區追球或精密全場幾何。普通可接球的未接殺仍保留原錯誤／未閉合邊界；本輪沒有補 OF error classification。自然模式未新增 opt-in，不宣告 G1_COMPLETE、NATURAL_MATCH_READY 或 ALPHA_READY。VM 與正式 CLI 證據不等同瀏覽器人工遊玩驗收。
