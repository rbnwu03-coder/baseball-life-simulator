# 《棒球人生》Sprint UI-P2 — Match Moment Visual Hierarchy & Variable-Pace Playback v0.1

日期：2026-10-16（Asia/Taipei）  
參考 HEAD：`ab3117653945de0b7013636187c446276a96e634`

**已更新可操作的 [離線原型 index.html](../prototype/match-ui-p1/index.html)。** 本輪實際加入分層 SVG 演出、四種戰術意圖預覽、Incoming Ball／Fielding Focus、不同節奏及可切換文字模式；原 Controller 仍是唯一狀態與時間權威。最終隔離測試 **50/50 PASS**，原 UI-P1 的28項全部保留通過。Chrome 工具不可用，真實瀏覽器／人工視覺驗收仍待完成。

## 1. 修改與新增檔案

| 檔案 | 變更 |
|---|---|
| [index.html](../prototype/match-ui-p1/index.html) | 修改：五個 SVG layers、四個角色、近景 viewport、文字模式控制、UI-P2標示 |
| [style.css](../prototype/match-ui-p1/style.css) | 修改：phase 主次、低對比 environment、焦點畫框、角色形狀／顏色、路線樣式、響應式與 reduced-motion |
| [app.js](../prototype/match-ui-p1/app.js) | 修改：集中節奏、剩餘時間續播、Decision substate、意圖預覽、文字模式；將已揭露 view 單向投影至 SVG |
| [tests/prototype.test.cjs](../prototype/match-ui-p1/tests/prototype.test.cjs) | 修改：保留原28項；適配新增的本地 presentation script／fake clock，新增 hover／focus、SVG reveal、模式與動畫控制驗證 |
| [presentation.js](../prototype/match-ui-p1/presentation.js) | 新增：無狀態純投影、routeId意圖表、UI timing profile、示意座標；沒有 timer 或 simulation import |
| [tests/presentation.test.cjs](../prototype/match-ui-p1/tests/presentation.test.cjs) | 新增：profile、純投影、近景、身份、reveal gate、模式與 Controller 計時互動測試 |
| [49項階段性測試證據](../prototype/match-ui-p1/tests/ui-p2-test-results.json) | 新增：保留加入近景裁切前的完整 TAP／stderr／來源 hashes |
| [50項最終測試證據](../prototype/match-ui-p1/tests/ui-p2-test-results-final.json) | 新增：完整最終結果、原28項名稱、來源 freshness與 Browser 限制 |
| 本文件及 [UI-P2 integrity evidence](match-ui-p2-visual-hierarchy-variable-pace-v0.1-evidence.json) | 新增：交付、完整性與停止 gates |

共修改4個授權檔案、新增6個檔案。開啟方式不變：瀏覽器直接開啟／重新載入 `prototype/match-ui-p1/index.html`。五個 runtime assets 為 index.html、style.css、fixture.js、presentation.js、app.js；無安裝、fetch、CDN或伺服器需求。

UI-P1 README、原報告與所有歷史 evidence 原樣保留，其中 UI-P1 的2.8秒描述屬歷史版本；目前操作與節奏以本 UI-P2 文件為準。既有契約文件與 DTO evidence 沒有修改。

## 2. 單向演出架構

`Fixed DTO → Existing Controller → presentation.project(view) → SVG／DOM`

Controller 提供當前 phase、Decision 公開資料、已揭露 beats、可顯示的 Resolution 與 presentation metadata。純投影函式不接收完整 Fixture，也不在 Decision 讀取 Playback history／未來 result。SVG 只消費投影；Web Animations API 不設 finish／animationend 回呼，不可呼叫 Controller.next、Resolver 或 Settlement。

只有 Controller 的一個計時器槽與 epoch guard 推進 presentation；Loading 的既有零延遲初始化不是另一套 playback timer。改變 phase、Next、Skip、Replay、Restart或取消進場都使舊回呼失效。沒有新 DTO phase、第二套狀態機、Production API或新的棒球結果。

## 3. SVG layers 的實際行為

| Layer | 實作與揭露邊界 |
|---|---|
| A. Field | 場地、三壘包、本壘、占壘圓點；正式 occupancy 永遠來自 Controller.scoreState。Playback 不因角色位移改壘包 |
| B. Actors | SS圓形、1B方形、原一壘跑者R1金棕色六角形、打者跑者BR藍色三角形；文字圖例一直可辨識 |
| C. Ball／Route | 球的示意位移、來球虛線、已揭露傳球實線、打者跑者競速提示；沒有模擬速度、距離或判決計算 |
| D. Focus | SS側與一壘側的粗框、背景弱化、速度線及近景裁切；近景使用既有 layer 的內部 SVG引用，不建立另一份角色 state |
| E. Result | 第七個正式 result beat 才顯示原 resultCode 的文字；Resolution 才更新正式占壘與出局摘要。重播與重新開始清空舊結果文字 |

所有座標都是固定構圖用的 SVG 示意值，不是 simulation XY。球的位移與跑者位置不作棒球判定。

## 4. 四條路線的意圖預覽

hover、鍵盤 focus、以及選取後的 Submitting／Unsupported 使用同一份明確 routeId 對照表；不解析 routeLabel 猜路線。每次預覽都顯示 **「戰術意圖示意，非實際執行結果」**。

| routeId | 預覽 |
|---|---|
| secureFirstBaseOut | SS → 一壘，單段虛線 |
| forceSecond | SS → 二壘，單段虛線 |
| startDoublePlaySecond | SS → 二壘 → 一壘，兩段虛線 |
| holdBall | SS周圍的意圖圈，文字說明先控制球；不畫傳球線、不宣稱已接穩 |

四個選項的順序、label、objectiveText、risk、routeLabel與命令 identity均保留。滑鼠離開但鍵盤焦點仍在選項時保留其預覽；焦點移到下一個選項即同步切換。其餘三條 route 仍只進 Unsupported，沒有6-4／雙殺／持球結果推演。

## 5. Incoming Ball／Fielding Focus

進入 Decision 的 presentation substate 先是 Incoming Ball，使用既有 situationText 已公開的「游擊守區」資訊，約450ms建立來球方向，再停在 Fielding Focus。球停在接近SS的示意位置，沒有已成功 Secure 的姿態或文字。

策略選項不需等待動畫才能操作；hover／focus 可直接取消進場 timer，進入靜態 Fielding Focus 並顯示戰術意圖。這不提交 decision、不新增 Playback，也不改正式 DTO phase。Reduced Motion／文字模式直接進靜態 Fielding Focus。

Decision 的球路不讀取未揭露的 Playback ballType／pace／depth，不輸出精確球速、物理軌跡、接球成功或結果。純投影測試會讓未來資料 getter 拋錯，確認 Decision 不讀它們。

## 6. Variable-Pace timing profile

初始設計值集中於 presentation.TIMING，正常 SVG 模式使用：

| Beat | 演出時間 | 演出重點 |
|---|---:|---|
| ballInPlay | 450ms | 快速建立方向 |
| approach | 1100ms | SS進入焦點、背景弱化 |
| control | 850ms | 接球狀態短暫停頓 |
| throw | 450ms | 明確傳球方向 |
| receive | 600ms | 球焦點到接球端 |
| contest | 1100ms | 判決前張力，不顯示Out |
| result | 900ms | 正式結果強調 |

正常七段合計5450ms，另有獨立的420ms Submitting。這些都是 **UI演出毫秒**，不代表棒球物理時間或能力窗口。測試可注入固定 beatMs／clock 保留原 UI-P1 計時案例；正式頁面不使用該測試 override。

Reduced Motion／文字模式預設暫停，使用者明確選自動播放時，每段至少1400ms以避免快速換段；正常模式仍維持非等速 profile。

## 7. 漫畫式焦點與近景裁切

approach／control將框線移到SS側，球場背景降低對比、SS輪廓加重；receive／contest聚焦一壘側。局部速度線與粗框提供事件方向感。

approach、control、receive、contest在一般 SVG 模式另顯示小型近景 viewport，依當前 focus box 裁切現有場地、球路、角色和球。它只是同份已揭露畫面的放大引用，不從未來DTO補細節。Reduced Motion隱藏近景與速度線，文字模式隱藏整個動態 SVG，保留所有事件文字。

## 8. Decision／Playback／Resolution 與 runner identity

Decision優先顯示四個選項，球場作低對比環境與意圖提示；Playback改為較大的球場主框與較安靜的事件文字區，選項不與演出同時競爭。Resolution再次把正式結果文字提高權重。

七段球場分別呈現來球、SS接近、依status控制、已執行傳球、接球端、競速與結果。控制／傳球遇到failed／notAttempted時不畫成成功接傳；contest不把comparison改寫為Out。

**Playback全程（含result）仍是1出局、一壘有人、主0客1。** 畫面明示「跑者位置是移動示意；壘包圓點與記分板仍為決策時正式局勢」。第七段才出現結果文字，Resolution才一次更新2出局、二壘有人、主0客1，並保留原 outcomeText／feedbackText、selectedRouteId／actualRouteId。

Decision DTO沒有兩名跑者的正式球員id，因此以不同的穩定 presentation alias識別R1與BR，不偽造球員id。正式id在已揭露的contest／Resolution runnerChanges中可用時才附上source id；Resolution依原from／to資料顯示原一壘跑者在二壘、打者跑者出局。兩個alias、文字、形狀及顏色始終分開，沒有以SVG位置推算進壘。

## 9. Pause／Resume／Next／Skip／Replay

- Pause保存當段剩餘時間並暫停可見動畫；Resume從剩餘時間續播，不重啟完整當段。
- Next取消舊timer，依新beat類型配置時間；暫停時按Next仍保持暫停。
- Skip只切至同一份Resolution，取消timer及動作；重複Skip不再推進。
- Replay清除SVG／DOM舊結果，重用原eventId、DTO與profile；submissionCount不增加。
- Continue只結束示範；Restart明確開新UI session，舊epoch callback不能干預。
- 切換文字模式或動態偏好時暫停；當段按新模式配置完整閱讀時間，由使用者決定何時續播。這只是同一beat的閱讀／演出設定，不是重新提交或執行。

## 10. Reduced Motion／Text Mode／Keyboard

新增原生「使用文字模式／返回SVG演出」按鈕及aria-pressed狀態。系統Reduced Motion變更也會同步：取消位移、停用近景與速度線，並暫停於可讀的事件文字。文字模式可逐段閱讀、略過、重播；SVG不作唯一資訊入口。

保留Tab、Enter／Space原生button行為、focus-visible、Submitting disabled／aria-busy、畫面切換標題焦點、Unsupported返回焦點、播放控制焦點穩定及aria-live結果宣告。每個選項的focus與pointerenter都走同一個Controller.preview命令，不新增鍵盤陷阱。

## 11. 隔離測試與 Browser／人工待驗

```powershell
node --test --test-reporter=tap prototype/match-ui-p1/tests/prototype.test.cjs prototype/match-ui-p1/tests/presentation.test.cjs
```

最終 **50/50 PASS、exit0、stderr空、來源hashes執行前後一致**。原UI-P1的28個具名checks均在最終TAP中再次通過，新增22項。先前49/49的階段性capture保留；補上近景裁切及對應測試後再執行一次，沒有覆寫UI-P1歷史證據。

涵蓋四路預覽映射／hover-focus一致、Decision不讀未來DTO、七段SVG投影、result gate、正式scoreboard、runner身份、profile非等速與精確期限、暫停剩餘時間、single timer／epoch、skip／replay、reduced／文字模式、近景關閉、Fixture bytes、原生控制與只含本地資源。

測試使用Controller fake clock、純投影、小型DOM／VM及Web Animations adapter；**不是實際瀏覽器或視覺驗收**。本輪工具inventory為apps0／browsers0，嘗試Chrome回 `Browser is not available: chrome`，因此Browser smoke＝**NOT RUN**。

人工待驗：file URL下的資源／CSP、SVG use近景裁切、WAAPI位移與暫停同步、450ms快段可讀性、PC／手機與200%縮放、純Tab／Enter／Space流程、focus環、讀屏宣告及系統Reduced Motion切換。未聲稱以上項目已Browser PASS。

## 12. WIP／Fixture／protected integrity

開工核對前輪1885個既有可讀檔案全部hash相符；允許改動只限前列4檔。結案須確認另外1881檔原bytes不變，包括fixture.js、原UI-P1報告／README／captures、兩份契約與Production／Save／正式index／style／script、Snapshot及既有tests／runner／registry。完整核對見 [evidence](match-ui-p2-visual-hierarchy-variable-pace-v0.1-evidence.json)。

Fixture SHA-256持續為 `858857c5858de497d69c123ba3ad4f09c585a21d21d28df467d7c47ac8117878`；所有正式identities、choice順序、七個beats與Resolution仍與既有evidence.examples相同。

12個protected paths只核對status／size／mtime，未讀取、hash、執行或修改內容。branch／HEAD／main／origin/main tracking ref、index與原tracked WIP不變；沒有全域搜尋、unscoped git diff、Graph完整稽核或遠端fetch。Source文字讀取限明列原型、既有契約／UI-P1文件與JSON evidence；其他既有檔案只做hash保護。

## 13. 下一輪最小建議與停止

先人工驗收目前離線HTML的視覺主次、四路意圖、近景與播放快慢、keyboard／Reduced Motion。必要的UI調整仍只在prototype中進行；安全Production Adapter與正式cursor整合須另行授權，不由本輪自動開始。

| Gate | 判定 |
|---|---|
| 現有離線HTML／UI-P2演出實作 | **存在／COMPLETE（原型範圍）** |
| 隔離測試 | **50/50 PASS；原28項保留** |
| Browser／人工視覺驗收 | **NOT RUN／PENDING** |
| Production Adapter／Phaser／新模擬 | **NOT STARTED／NOT INTRODUCED／NONE** |
| Ready for Commit | **NO** |
| Ready for Sprint10B | **NO** |
| Receiver v2 | **DISABLED** |

完成原型與隔離測試後停止；未Reset、Clean、Stash、Stage、Commit、Push，等待人工審查。
