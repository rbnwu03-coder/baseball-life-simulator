# 《棒球人生》
## Sprint UI-P2.4B — Continuous Motion & Time Remapping v0.1

已完成 SS 6-3 獨立離線演出切片與隔離回歸：開工原九檔 **143／143 PASS**；結案原九檔加新 Motion 測試共 **162／162 PASS**（新增 19 項），exit 0，無 cancelled／skipped／todo。**真實 Browser 驗收未完成，人工動態驗收 PENDING；不能宣稱已通過視覺驗收。**

入口：[同步慢動作](../prototype/manga-motion-spike/index.html)；[原速比較](../prototype/manga-motion-spike/index.html?speed=normal)。PC Chrome 可手動開啟本機檔案 `file:///E:/meng/baseball_life_sim_semirefactor/prototype/manga-motion-spike/index.html`。入口本地共用原 fixture、v0.2 asset、Presentation、Controller 與 Manga 五單位 observer／CSS；SVG 內容與原兩入口一致。沒有 server、CDN、fetch、Phaser、外部安裝或第二次自動 mount。

### 施工範圍與開工

HEAD 實查 `ab3117653945de0b7013636187c446276a96e634`，分支 `main`。前輪已確認的 1,933 個 readable exact-path 檔案在開工均吻合；13 個 tracked WIP、1,195 個 untracked 檔案保留。12 個 protected 路徑僅 stat／status metadata，不讀內容、不 hash、不執行。八個新增路徑在開工均不存在。

既有修改僅三檔：

- `prototype/match-ui-p1/app.js`：同一 createDemo 裡的進階 Continuous Clock／閱讀／motion reveal 協調及原 SVG writer。
- `prototype/manga-motion-spike/clock-contract.js`：加上明確選用的 withRemapping；原 Foundation 契約仍維持原行為。
- `prototype/manga-motion-spike/tracks.js`：保留 0.1 inventory API，新增 0.2 建構／驗證與發行 gate。

新增 `prototype/manga-motion-spike/` 下的 `index.html`、`timing.js`、`sampler.js`、`motion.js`、`motion.css`、`tests/motion.test.cjs`，以及本報告和 evidence。完整 before／after hashes 與 scoped patch 位於 evidence。沒有修改 presentation.js、原兩 HTML／CSS、任何既有測試、原 fixture、正式 v0.2 Contract、generated asset、歷史報告／Evidence、Production／Save／Match Engine。

### 單一 Clock 與閱讀分離

資料流為「既有 Controller active wall interval → 純 Time Remapping → 同一 playTime → 純 Track Sampler → 既有 app SVG writer」。可變 playTime、anchor、readElapsed、epoch、單一 Controller timer 仍只在原 createDemo closure。RAF 不積分、不排程語意，也不持有自己的時間座標。每次 getView 使用一個取樣值，同幀角色與 motion publication 共用該座標。

新入口明確傳入 continuous 與 withRemapping 契約，先設 autoMount=false，再呼叫公開 mount 一次。原兩入口沒有選用；預設仍 Legacy。Foundation 原 contract 保留安全 semantic waiting，進階契約才啟用獨立 motion milestone 政策；原 15 項 Foundation 測試一字未改且全過。

進階播放時，閱讀索引只管理原七段文字及閱讀政策。prepareBeat 不再因文字換段重設 motion cursor。前五段閱讀完成即可換句，motion 不會停在各句末；contest 到 result 仍等待 motionEnd，防止動作完成前顯示判決。若讀者先按 Next，seek 至當前合法段末並取 max(current, target)，不倒退。Skip 前往 result／awaitingConfirmation；確認後才進 Resolution。

動作公開與文字公開不同：view 的 motionBeat／motionRevealedBeats 只包含同一 cursor 已到達的 ballInPlay 至 contest milestones，不含 result；Decision／Unsupported 沒有這些動作資料。Runtime projector 只收到凍結 Clock、目前合法動作 beat、phase 與顯示模式，不收到完整 fixture、Decision、Resolution 或 Controller／DOM。離線 manifest builder 可查證原 frozen 歷史資料；不把隱藏的正式 Resolution DTO 傳給尚未確認的場景。

Playback 的 R1／BR 持續移動至判決前的安全尾點；只有演出走完、玩家 Pause、合法靜態模式或等待明確判決確認時停下。這不再是逐句 readingHold 的全場凍結。確認後，同一 Clock 從 4550 延伸到 5450 完成後續視覺銜接；此時占壘與比分已由正式 Resolution 公開，動畫位置仍是獨立的示意資料。

### Timing Profile 與比較

前六段示意座標沿用原 duration：0、450、1550、2400、2850、3450、4550。候選倍率為 1、0.65、0.5、1、0.65、0.5。各倍率邊界前後 80 個示意時間單位以 smoothstep 銜接；集中不可變積分表與反函式將 active wall interval 映到 playTime。倍率影響整個 Play，沒有角色各自 duration 或動畫 timer。

固定原速／慢動作取樣的路徑終點完全相同；運動座標 4550 的 wall interval 原速 4550ms、慢動作約 7386.30ms。以下不含選擇後原有 420ms 提交階段，且不是物理比賽時間：

| active wall ms | 原速 playTime | 慢動作 playTime |
| --- | --- | --- |
| 1000 | 1000.00 | 810.59 |
| 2000 | 2000.00 | 1460.59 |
| 4000 | 4000.00 | 2579.04 |
| 6000 | 4550.00 | 3856.60 |

兩個模式可由頁首另開比較；Replay 維持同一頁選用的 profile、frozen DTO、七段結果與單一 submission，沒有再抽樣比賽。result 保留原閱讀與明確確認，不增加新的慢動作判決凍結段。

### 新舊 Manifest 與三個 Gap

0.1 仍是 `ss63-bounded-tracks/0.1` inventory-only，三個 gap 的舊紀錄繼續 authorized=false、assertPlayable 拒絕啟用。新 `ss63-bounded-tracks/0.2` 內保留完整 legacyInventory；每段新增插值記錄 fixture／Presentation endpoint 來源、相鄰 checkpoint 來源與本輪附件第 6–8 節授權。sourceKind 為 SVG illustrative coordinates。

0.2 必須由本地 builder 查證既有 secureFirstBaseOut、groundBall／leftSide、完成的 approach／control／throw／receive、first-base target、原 runner identity、oneOut／R1→2／BR→out／比分不變後發行。僅改旗標或複製 manifest 不足以啟用；requirePlayable 檢查發行資格、版本、路線、來源、各段有限 endpoint、首尾相接與 phase/reveal policy。其他三條 Unsupported 路線不建立播放／submission 結果。

| Gap | 本輪處理 | 揭露邊界 |
| --- | --- | --- |
| A BALL_APPROACH_CONTROL | 球在 approach 座標 450–1550，從 [137,132] 連續銜接 [128,123]；其後沿原 throw 線至 [268,154] | 動作 milestone 公開；不新增 bounce、error 或 catch quality |
| B R1_RESULT_SECOND | 重用原 [253,137]→…→[202,91] checkpoint，將連續跑動延伸至判決前 [184,71]；確認後 900 示意單位銜接 [170,56] | 正式二壘到達與占壘結論只在 Resolution-confirmed 後公開；[184,71] 是新示意 checkpoint |
| C BR_ARRIVAL_RETIREMENT | 衝刺重用 [182,237]→…→[255,164]，接至壘前 [258,164]；確認後另段至 [294,215] 退場擺位 | 衝刺不以 Resolution 擺位作終點；不畫成安全站上一壘，不生成接球／踩壘毫秒差 |

上述是可追溯的 presentation interpolation／retiming，不是新增物理跑壘、正式到壘時間或競速判定。判決前安全尾點到達後，等待確認的靜止是資訊揭露邊界，不代表重新以 readingHold 控制全場。

### 漫畫單位、身份與結果

| 合法視覺 beat | 漫畫單位 |
| --- | --- |
| ballInPlay；Decision／Unsupported | Wide Field |
| approach／control | Fielding Focus |
| throw／receive／contest | Action Sequence |
| result | Impact Frame |
| Resolution | Consequence Frame |

漫畫 observer 只看已渲染 phase／stage，不持有 Clock。SS 左近景直接透過原 SVG use 引用主場 actor-ss 與 ball-marker，同一位置更新；R1／BR 留在主場持續移動。沒有 receiver 獨立近景、角色幾何／攻守顏色修改、速度線、閃光、震動或新黑框。

原四個 Decision 選項、原策略目標與 verified tradeoff 均保留。前六段不公開 result／Resolution；result 後仍待確認，正式結算才顯示出局 1→2、主0客1不變、BR 出局、R1 一壘→二壘。正式 scoreState／base occupancy 只沿用原 DTO。Pause／Resume 保持所有取樣座標與閱讀餘量；Next／Skip／Replay／Restart／pagehide 以原 epoch、run、render generation 淘汰舊 callback；Reduced Motion／Text Mode 有完整合法文字與靜態替代。確認後短銜接亦可暫停。

### 測試、瀏覽器與限制

原九檔 143 項保留全過；新增 19 項驗證三入口隔離、真實 classic-script 接線（VM adapter）、單一 timer／RAF、固定取樣、平滑倍率／端點、跨 beat／confirmation continuity、Gap A/B/C reveal、閱讀中兩跑者推進、SS 近景 use、Pause／Resume／Next／Skip／Replay、舊 callback、合法靜態模式、Unsupported 與 malformed manifest／source／timing fail-closed。合併實際 **162 PASS、0 FAIL、0 skipped、0 todo**，完整 TAP 收錄 evidence。

受影響七個 JS／CJS 檔 node --check 均 PASS。三個既有修改以開工精確副本做 scoped no-index diff／check；exit 1 是有差異，stdout／stderr 無 whitespace diagnostic；沒有將其說成 exit 0。新檔逐行亦無 trailing whitespace／conflict markers。未執行 Production 全套 regression 或 Match simulation。

使用 codebase-memory skill；index_status、symbol search、coverage 均 Transport closed，採精確來源／隔離測試 fallback，未宣稱 graph 完整，未 reindex。

使用 computer-use skill 嘗試真實 Chrome：Browser surface inventory 為空；Windows helper 列出 Chrome，曾遇 approval timeout，重試回報視窗最小化；啟用視窗後工具因「無法可靠判定目前 browser URL 以執行政策」中止 Computer Use。本輪即停止所有 app input，沒有繞過。**PC Chrome／file:// 動畫／原生鍵盤／100%／200% Zoom／Reduced Motion／Text Mode 的 native 驗收均 NOT COMPLETED。** VM、fake DOM／RAF 的 PASS 不能替代這些項目。

### 人工驗收入口與觀察方法

1. 在 PC Chrome 以 file:// 開啟上列 index.html，100% Zoom 選「6-3」。頁首另開原速比較。確認慢動作中球與仍在運動的跑者同步減速，換文字與漫畫單位不重開角色動畫。
2. 接近／控制球時看左近景：SS、球與主球場同步；主場兩跑者持續前進。觀察球 [137,132] 至接球點無瞬移；一壘手沿原路線接傳，沒有新 receiver 近景。
3. 播放中 Pause，等數秒再 Resume；所有仍在動的角色同停同起。用 Tab／Enter／Space 操作，測快速 Next、Skip。Skip 應停 result／awaitingConfirmation，記分仍一出局／原占壘。
4. 確認後觀察 R1 連續到二壘、BR 另段退場；比分不變、出局變二。按 Replay 重看同一球，應無舊動畫殘影。可暫停確認後的短銜接。
5. 200% Zoom 重做操作並檢查文字／四選項／控制可達。選文字模式逐段完成；在 OS 減少動態偏好下重新開啟，應預設暫停且可逐段閱讀，無必看動畫。
6. 三個其他選項都只顯示 Unsupported；返回選擇後仍可選 6-3，沒有借用其他路線結果。

以上保留人工動態驗收 PENDING。待此演出通過人工比較後，才值得評估下一輪 Connected Match Slice；本輪沒有連上正式 Match、沒有授權或啟動 UI-P3／Sprint10B／Receiver v2／正式 Manga Director。

### 結案

最終前後 hash／Git 核對僅三個授權既有檔變更，其他 1,930 個既有 readable 檔不變，原 tracked／untracked WIP 與 HEAD／refs／index 保留；新增僅八個白名單路徑。protected metadata 保留，不將 metadata 當作內容驗證。

Ready for Commit＝**NO**；Ready for Sprint10B＝**NO**；Receiver v2＝**DISABLED**。未 stage／commit／push／reset／clean／stash，未安裝依賴，未使用 subagents。完成實驗與報告後停止，等待人工動態驗收。
