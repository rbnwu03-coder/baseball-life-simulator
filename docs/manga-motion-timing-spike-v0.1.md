# 《棒球人生》UI-P2.4 — Continuous Motion Slow-Mo Pass v0.1

日期：2026-10-16（Asia/Taipei）  
Branch：main；HEAD：`ab3117653945de0b7013636187c446276a96e634`。

**結論：STOP AT FEASIBILITY GATE。Continuous Motion／同步 Slow-Mo 尚未實作。** 目前共享 Controller 將每段 motion 與 readingHold 串行，renderer 在 readingHold 明確把動畫設為段末並暫停。獨立入口沒有正式的連續時間／motion renderer 接口，無法在保留原 Controller、DOM renderer 與互動權限的條件下安全分離。依本輪附件第三、八、十三節停止，不修改共享檔案、不以另一套時鐘繞過。

本輪只新增本報告與 [evidence](manga-motion-timing-spike-v0.1-evidence.json)。未建立 `prototype/manga-motion-spike/`、入口、motion 模組、樣式或新功能測試；不宣告實驗切片完成。既有 UI-P2.3 **120/120 PASS**，Manga Spike **8/8 PASS**，合計 **128/128 PASS**。這些是舊版基線，不能視為 UI-P2.4 的連續動態驗收。

## 1. 開工、範圍與依賴

已讀附件、前輪 Manga／UI-P2.3 報告與 evidence、目前 app／presentation／fixture、正式 v0.2 Contract 與 generated adapter，並核對入口依賴及相關隔離測試。

開工時間為 2026-10-16T09:08:21.050Z。前輪 baseline manifest 加其五個 artifacts 及 evidence 自身，共 **1,924 個既有可讀檔案** hash 相符。既有 13 個 tracked、1,186 個 untracked WIP 保留；12 個 protected paths 僅檢查 stat／status metadata，不讀內容、不 hash、不執行。

預檢六個候選新路徑均不存在：`prototype/manga-motion-spike/index.html`、`motion.js`、`motion.css`、`tests/motion.test.cjs`、本報告及本 evidence；目錄也不存在。**實際寫入白名單僅下列兩檔，既有修改白名單為空：**

- `docs/manga-motion-timing-spike-v0.1.md`
- `docs/manga-motion-timing-spike-v0.1-evidence.json`

UI-P2.3 入口依序載入同目錄 fixture.js、presentation-v02.generated.js、presentation.js、app.js；Manga 入口共用同四個 scripts、style.css，再載入自身 manga.css／manga.js。均為本地 classic defer，CSP connect-src none。Manga observer 僅做當前 phase／stage → 畫框映射，沒有 Controller handle 或 motion ownership。

結構探索使用已讀 codebase-memory skill，Tier 2。Graph generation 2026-10-15T01:30:19Z，精確符號查詢無節點，22 個依據路徑 coverage 均 not_tracked；改讀目前 exact-path source 及測試，不把無節點解讀為函式不存在，也不宣稱索引完整／即時。未 reindex。廣泛 manifest 僅 hash，不作全域 source 搜尋。

## 2. 為何現有演出會凍結

下列是目前實際 source，並非只引用前輪報告：

| 位置 | 目前行為 | 對連續 motion 的影響 |
|---|---|---|
| [app.js:121](../prototype/match-ui-p1/app.js#L121) | prepareBeat 重設 fullDuration、remaining，stage=animation | 時間游標屬於當前 beat |
| [app.js:136](../prototype/match-ui-p1/app.js#L136) | animation 完成後轉 readingHold；讀完後才 advanceBeat | Motion 與 Reading 串行，非同時進行 |
| [app.js:152](../prototype/match-ui-p1/app.js#L152) | readingHold 的 beatRemaining=0，beatElapsed=fullDuration | 等待閱讀期間沒有往後的 motion cursor |
| [app.js:318](../prototype/match-ui-p1/app.js#L318) | motionKey 換 beat，取消舊 WA，再建立 ease-out 動畫 | 每段重新啟動局部動畫；各 WA 自行播放 |
| [app.js:332](../prototype/match-ui-p1/app.js#L332) | 非 animation 時 currentTime=duration 並 pause | readingHold 明確凍結全部當段動畫 |
| [presentation.js:61](../prototype/match-ui-p1/presentation.js#L61) | 跑者為七組示意端點，movements 連接前段與當段端點 | 部分位置連續，但速度每段 ease-out 歸零；閱讀時停留 |
| [manga.js:43](../prototype/manga-match-spike/manga.js#L43) | observer 讀已渲染 phase／stage／mode，寫章節提示 | 畫框沒有全 Play 時間座標，也不應取得推進權 |

舊 reading-pace 測試第 61、88 行及 prototype 測試第 240 行，原本就保護「段末動作完成、閱讀時靜止、Resume 不重播」的行為；這符合舊版設計，與本輪的新驗收目標不同，不能直接刪除斷言。

### 本輪唯讀重現

重用 Manga 測試既有 Clock／Document／Web Animations adapter、實際 app.mount、同一 fixture 與 v0.2 adapter；沒有新建遊戲 fixture 或模擬。逐段推進 animation → readingHold，於 hold 起點與中點採樣，驗證 renderer 的 WA currentTime／playState。完整 23 筆樣本與 profile 存於 evidence.feasibilityProbe。

| 採樣 | adapter wall time | beatElapsed | reading 剩餘 | R1／BR／SS 動畫 |
|---|---:|---:|---:|---|
| approach 開始 | 1720ms | 0ms | animation 1100ms | running，currentTime=0 |
| approach hold 起點 | 2820ms | 1100ms | 650ms | paused，currentTime=1100 |
| approach hold 中點 | 3145ms | 1100ms | 325ms | paused，currentTime=1100 |

七段均確認 R1／BR 動畫在 hold 被 clamp 到段末；畫框切換沒有修正這個時序。這是 DOM／WA adapter 對實際 renderer 命令的重現，**不是原生 WA 像素採樣或實際跑速證據**。scene.actors 是目標 pose，不能把它當動畫中途的即時座標。

## 3. 單獨 Spike 邊界為何不足

目前 createDemo 可注入 now／schedule，並公開 getView／subscribe；這些能力確實存在。但 mount 只轉交 environment 的計時函式與 Reduced Motion，沒有 motion profile、projector、內建 WA 停用選項。瀏覽器自動 boot 會自行 mount，回傳 Controller 未對外保留（app.js:9、245、431）。renderScene、visualAnimations、deadline／remaining 都在 closure 內。

因此「只加一個公開 Controller handle」不足以解決：
 
1. 原 Controller 仍必然依 animation → readingHold → 下一 beat 推進；公開 view 的 motion elapsed 在 hold 固定。
2. 原 renderer 仍會在任何重繪覆寫 SVG transform、取消／重建動畫，並在 hold pause。
3. 另一個 RAF／WA 層若自己積分時間、追蹤 Pause／Skip／Replay／mode，再寫同一 SVG，就必須另行維護 motion cursor、取消 epoch 與互動狀態，並與共享 renderer 爭寫；目前沒有正式交接點保證只有一個權限。

本輪未採用 monkey-patch Element.animate／全域 performance／setTimeout、偽造 reducedMotion 以停用舊 renderer、script source 改寫、攔截按鈕、或另 mount 一個 Controller。這些都不能證明符合使用者要求的共享／單一時間權限。把 hold 縮到零會移除原閱讀政策；增加 hold／拉長單一 actor duration 則仍不符合 Motion／Reading 分離。

結論限於**本輪指定且目前公開的共用邊界**，不是聲稱 JavaScript 技術上無法製作連續動畫。需要先授權共享 app 的 opt-in 時間／renderer 接口，才可安全施工。

## 4. 來源分類與各 actor 缺口

正式資料與示意座標必須分開。v0.1 七段只有語意、status、targetBase、comparison 等資料；v0.2 Contract 的 Decision／Resolution schema 沒有 motion tracks、物理時間或速度。contest.comparison=`defenseClearlyAhead` 是公開分類，**沒有數值到壘時差**；不得換算成虛構的毫秒優勢。

| Actor | 正式依據 | 目前示意座標／區間 | 可沿用與缺口 |
|---|---|---|---|
| Ball | leftSide groundBall；control completed；throw／receive completed、target first | home[170,244]→incoming[137,132]（ballInPlay）；control 直接到 fielding[128,123]；throw→first[268,154] | 已有兩條移動線；incoming→fielding 沒有現成 movement segment，需明列示意銜接政策；不能推導飛行速度 |
| SS | approach／control actorId=player、completed；throw actorId=player | ss[115,101]→fielding[128,123] 只在 approach；之後原地控傳 | 可沿用接近線與自然原地處理；沒有身體接球／出手軌跡，不新增角色動作數值 |
| 1B | receiverId／receive.actorId 同為 school-development-29d536a2-player-03 | receiver[280,141]→first[268,154] 在 throw，同球終點 | 已有接傳示意線；throw 後到位靜止有既有依據，不延長成假競速 |
| R1 | Decision 敘事受迫往二壘；Resolution regional-power-school-player-04，1→2 | [253,137]→[244,129]→[233,119]→[222,109]→[212,99]→[202,91]→[202,91] | Playback 各相鄰端點有來源；result 尚非二壘，Resolution 才到[170,56]。缺少已定義的連續完成段與公開時點 |
| BR | contest regional-power-school-player-09、target first；Resolution batter→out | [182,237]→[193,224]→[207,210]→[227,191]→[242,177]→[255,164]→[255,164]；Resolution [294,215] | Playback 沒有「跑到一壘→出局後離場」完整 track；[294,215]是結果擺位，不是到壘時間／離場路徑證據 |

示意座標來自 presentation.js:12、59–95，並非 DTO 物理數據。既有 SVG 的同一 actor 與近景引用可繼續共用；SS 左／2B 右、攻守顏色、球員造型、一壘無綠點與無接球端近景均不需改動。

目前允許沿用已有相鄰示意線的 normalized interpolation；**沒有在本輪核准或實作新的尾段與到壘同步點**。幾何端點存在不等於已擁有連續運動／時點證據，也不表示所有路徑完全缺資料。不能由已知出局結果反推球與 BR 的競速差。

可行替代是下一輪建立有來源標記的 bounded Presentation Track Manifest：列出現有線段、自然停止區間、缺失尾段、可公開階段與純示意 normalized 時間。R1 尾段與 BR 到壘／退場安排須先確認；不需要為此修改正式 v0.2 DTO 或 Match Engine，也不要求補造物理時間。若不批准尾段，只能保留舊靜態結果佈置，不能聲稱全 Play 無跳位。

## 5. 七段映射、節奏與連續性

以下是**現有** profile，讀取實際 describeBeat 文字所得 hold 與下限相同；不是新 slow-mo profile：

| Beat | Manga 單位 | 舊 animation | 舊 readingHold | 後續 remapping 提案（未實作） |
|---|---|---:|---:|---|
| ballInPlay | Wide Field | 450ms | 850ms | 1.0× 建立動作 |
| approach | Fielding Focus | 1100ms | 650ms | 平滑 1.0→0.5× |
| control | Fielding Focus | 850ms | 1400ms | 0.5×，其他仍移動 actor 同步 |
| throw | Action Sequence | 450ms | 850ms | 平滑 0.5→1.0× |
| receive | Action Sequence | 600ms | 850ms | 共同減至0.5× |
| contest | Action Sequence | 1100ms | 1700ms | 0.5×，不凍結BR等待球 |
| result | Impact Frame | 900ms | 1200ms＋最後確認 | 全部相關 motion 完成才顯示正式判決 |
| Resolution | Consequence Frame | 不適用 | 原使用者確認 | 正式局勢與策略回顧 |

舊動畫總長 5450ms，hold 總長 7500ms；自動播放由 Playback 開始到 final awaitingConfirmation 為 12950ms，最後確認等待另計。7500ms 是原閱讀停留，不能算成已完成慢動作；長文字／可及模式可增加 hold。

### 目前連續性實證

- approach 至 contest 的 R1／BR movement.from 等於前一段示意終點；幾何相接，時間不連續，每段後都有 hold。
- contest→result 兩名跑者端點相同；沒有新增跑到壘包的 movement。
- result→Resolution：R1 [202,91]→[170,56]，差[-32,-35]；BR [255,164]→[294,215]，差[39,51]。probe 確認是結果 phase 換 pose，沒有動態尾段。這是示意座標差，不是場上距離。
- 球由 approach [137,132] 到 control [128,123] 直接換 pose，缺少既有 movement。只改時間倍率不能消除這個銜接。
- 新時鐘的跨 beat、倍率轉折、Pause 位移連續性、所有 actor 同時採樣：**NOT IMPLEMENTED／NOT RUN**。

舊 baseline PASS 保護舊行為；不代表本輪「無跳位」驗收通過。

## 6. 最小共用介面提案（僅設計，需後續授權）

建議先定義範圍有限的 Presentation Clock Contract，再動 app.js。正式棒球 Contract、fixture、DTO、舊入口維持原始來源；舊模式保留預設行為。不是啟動 Manga Director 或 UI-P3。

所需共享改動集中在 app.js 三個邊界，無須先改 presentation.js：

1. **可選啟動／mount 接口**：讓新入口明確選 opt-in motion policy 並取得同一 controller；防止原自動 boot 再 mount。保留舊入口預設。選項必須可傳遞至 createDemo，不靠環境函式攔截。
2. **同一 Controller 的時間協調**：新增整 Play 的唯讀 motion cursor 與 reading 狀態，分別計量、同一 owner 管理。游標包含 session／playbackRun／epoch、playTime、paused／mode、當前已公開 semantic beat、motionComplete。Reading 累計不在每段把 motion 強制設完成；下一語意／判決公開點須與 motion milestones 協調。若閱讀尚未完成但 motion 還在進行，保留已公開文字與 history 供讀取，不能借用未來結果。是否在同區間需明確確認的長文字情境暫停全體，需一併定義，不能只讓跑者繼續而 phase 越界。
3. **renderer motion ownership**：opt-in 時停用舊 per-beat WA 建立／clamp；由注入的純 sampler 與可取消 render loop 渲染相同 SVG。原 app 繼續獨佔 phase、選項、scoreboard、正式 reveal 與按鈕。sampler 只收當前合法輸入，不讀未來 DTO。舊 project 保留作 legacy；新 bounded tracks／profile 可以在 Spike 目錄，新增 projector hook，避免複製原 renderer／Controller。

不能只增加 callback 然後讓 callback 自行維護另一個 playback controller。RAF 可用作刷新排程，**不是另一個獨立累計時間 owner**。單一 owner 計算：

`playTime(w) = integral rate(activeWallTime) dw`；`actorPose = sample(track, playTime)`。

所有 moving actors 及 SS 近景共用同一 playTime；靜止是 track 的明確區間。倍率 profile 集中一份，轉折可用 `s(u)=3u²−2u³` 在 1.0 與0.5間插值；此曲線僅建議、未量測／調參，不是物理模型。必須對同一 playTime 採樣後再原子寫入整組 actor pose，不能逐 actor 改 duration。

| 操作 | 建議 contract 不變量 |
|---|---|
| Pause／Resume | 同一 cursor 停止／從同值恢復，reading 剩餘與 motion 狀態分別保存 |
| Next | 定義為移至合法 semantic boundary 的受控 seek，所有 actor 同步；不能讓仍跑在舊 beat 的動作落後結果。沿用 eventId／快速連點 guard |
| Skip | 原子取消剩餘動態、epoch 作廢，停原 result／awaitingConfirmation，Resolution null |
| Replay | 重設 presentation cursor／epoch、清除舊動畫；重用同一凍結資料與 Decision scoreboard，不新增 Decision 選擇／重新提交 |
| Reduced Motion／Text | 靜態合法節點、原完整文字及 controls；安全取消全體 motion，不借用動畫完成 callback 揭露 |
| result／Resolution | result 僅在合法公開節點且相關動作完成（或 Skip）後；Resolution 仍需原最後明確確認 |

影響範圍：app.js 的 createDemo／mount／renderScene 及相應 opt-in 測試；舊 UI-P2.3／Manga 測試需全保留，新增 clock／sampling／取消邊界測試。新接口具行為風險，必須驗證舊 default 的時間、Next、焦點與 reveals 完全不變。正式 v0.2 Contract、Production、Save、Match Engine 不需修改。本輪沒有執行此提案。

## 7. 測試、Browser 與驗收狀態

2026-10-16T09:08:54.848Z 至 09:08:55.054Z，Node v24.19.0：

```powershell
node --test --test-reporter=tap prototype/match-ui-p1/tests/prototype.test.cjs prototype/match-ui-p1/tests/presentation.test.cjs prototype/match-ui-p1/tests/reading-pace.test.cjs prototype/match-ui-p1/tests/markers.test.cjs prototype/match-ui-p1/tests/fielding-receive.test.cjs prototype/match-ui-p1/tests/spatial-focus.test.cjs prototype/match-ui-p1/tests/decision-consequence.test.cjs prototype/manga-match-spike/tests/manga.test.cjs
```

**128 PASS／0 FAIL／0 SKIP**，stderr 空。另一次 inline feasibility probe 重用現有測試 helper，確認七段 hold clamp、最後 reveal、Pause elapsed、Skip guard、Replay references／一次 submission；不是新功能 suite，也沒有寫入測試檔。

| 要求 | 本輪結果 |
|---|---|
| 舊兩入口、資料／七段／身份／Unsupported／reveals | 基線 PASS；所有既有檔案 hash 保護 |
| 舊 Pause／Resume／Next／Skip／Replay／RM／Text | 基線 PASS；probe 再查部分操作 |
| 新入口離線、共享單一 clock、慢動作跑者、整組 pose 同步 | NOT IMPLEMENTED／NOT RUN |
| 新跨 beat／倍率／Pause 位置連續、新 callback 清除 | NOT IMPLEMENTED／NOT RUN |
| 新 Motion／Reading 分離 | 未達成；停 gate |
| PC Chrome／file://／原生鍵盤／200% Zoom／截圖 | NOT RUN |
| 人工動態／比較驗收 | PENDING；沒有新入口可驗收 |

本輪 CUA inventory 回傳 apps=[]、browsers=[]，沒有可操作真實瀏覽器；未安裝工具。沒有以 DOM／VM PASS 代替視覺驗收。沒有 Production regression、Match simulation 或其他路線 Gameplay。既有 deterministic asset test 會作一次純離線投影檢查，未重寫 generated asset，非新增模擬結果。

## 8. 後續比較方法與停止

本輪沒有可供比較的新動態版本，不能判定比 Manga v0.1 更好。後續若另行授權並完成時鐘接口與 track gaps，應以同一歷史球、viewport、Zoom、模式及操作方式比較 Manga v0.1／連續動態版，交錯先看順序。記錄來球與跑者漏看、動作焦點、感知停頓／跳位、判決清晰度與張力（分開評分）、Resolution 身份理解、捲動／閱讀負擔；不能用新動畫／測試數目判勝。

下一步首先是有限的 **Presentation Clock Contract + Track Manifest** 授權與來源確認；目前證據不足以直接建立正式 Director。先解決 Motion／Reading 協調與 renderer 單一寫入，再討論多場景泛化。

結案核對全部 1,924 個既有可讀檔案、12 個 protected metadata、Git branch／HEAD／refs／index 與 WIP；實際結果詳列 evidence.finalVerification。沒有修改既有檔案、入口、fixture、v0.2 Contract、Production／Save／Match Engine；沒有新結果、DTO、路線、依賴、Phaser 或第二個時鐘。未 reset／clean／stash／stage／commit／push。

**已依使用者明定條件停在 feasibility gate。** 待後續授權共享介面與缺失 track 政策；本輪不繼續施工，也不把等待人工動態驗收標為通過。

Ready for Commit＝**NO**。  
Ready for Sprint10B＝**NO**。  
Receiver v2＝**DISABLED**。

