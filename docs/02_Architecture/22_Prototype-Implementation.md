# Prototype Implementation

**Version:** 1.0  
**Status:** Architecture Mapping Completed

## Purpose

本文件是目前《棒球人生》可玩版本與既有 Architecture System 規格之間的實作對照。它記錄現況、資料所有權、跨系統耦合、可保留資產與漸進式重構順序；不是新的架構規格，也不取代 `Architecture-Bible.md`、Prototype Data Contract 或 Day Loop。

本次只做靜態 Architecture Mapping。沒有修改任何 JavaScript、HTML、CSS、事件、數值、UI 或流程。

## Analysis Scope

### Architecture 文件

- `docs/02_Architecture/00_README.md`
- `docs/02_Architecture/Architecture-Bible.md`
- `docs/02_Architecture/17_Prototype-Specification.md`
- `docs/02_Architecture/18_Prototype-Data-Contract.md`
- `docs/02_Architecture/19_Prototype-Day-Loop.md`
- `docs/02_Architecture/20_Architecture-Review-v1.1.md`
- `docs/02_Architecture/21_Architecture-Roadmap.md`

### Runtime 程式與介面

- `player.js`
- `script.js`
- `story.js`
- `save.js`
- `coach.js`
- `npc.js`
- `rival.js`
- `event.js`
- `injury.js`
- `time.js`
- `index.html`
- `style.css`

### 測試與稽核

- `tests/adult-route-chain-test.js`
- `tests/aspiration-narrative-test.js`
- `tests/azhe-storyboard-test.js`
- `tests/callbackTest.js`
- `tests/career-arc-test.js`
- `tests/career-transition-role-test.js`
- `tests/career-transition-route-difference-test.js`
- `tests/content-flow-audit.js`
- `tests/emotional-payoff-test.js`
- `tests/goal-balance-test.js`
- `tests/narrative-continuity-test.js`
- `tests/npc-role-refactor-test.js`
- `tests/player-archetype-test.js`
- `tests/relationship-payoff-test.js`
- `tests/scene-depth-test.js`
- `tests/takahashi-storyboard-test.js`
- `tests/vertical-slice-smoke.js`

### 分析方法與限制

- 以實際 `<script>` 載入順序、函式呼叫、全域變數與直接賦值判斷現況，不以檔名推測責任。
- 以 Architecture 文件作為未來邊界目標；程式現況與目標衝突時，記錄衝突而不修改。
- 本文件中的「Owner」指目前實際能寫入資料的程式，不代表 Architecture 指定的理想 Owner。
- 動態執行時才可能出現的所有呼叫路徑無法由靜態閱讀完全證明；無法確認處標示 `Cannot Confirm`。

## Executive Summary

- **整體結構：** 目前是依載入順序共享全域命名空間的 Vanilla JavaScript 應用。`player.js` 建立單一大型 `player` 狀態，`story.js` 提供事件資料與事件路由，`script.js` 同時處理流程、規則、資料修改與 DOM 呈現，`save.js` 保存並重建整個 `player`。實際載入順序見 `index.html:104-110`。
- **隱性 Application Controller：** 已存在，但沒有獨立邊界。核心集中在 `script.js` 的 `createPlayer()`、`choose()`、章節入口函式、`advanceAfterAction()`、`showCurrentEvent()` 與 `showStory()`（`script.js:381-421`, `1060-1164`, `1166-1275`, `2444-2499`, `2914-2958`）。`save.js` 的 `loadGame()`、`deleteSave()` 也直接控制畫面與流程（`save.js:75-96`）。
- **最大耦合問題：** `choose()` 在一次呼叫中直接修改 Player、Identity、Current State、Decision、Progression、Relationship、Match、Injury、Career、Narrative、Time 等資料，並在最後觸發 UI。`showStory()` 與 `updateStatus()` 也不是純 render；前者會排入事件、推進目標與準備比賽狀態，後者會更新印象、目標、先發競爭與市場評價（`script.js:1092-1158`, `2917-2956`, `3251-3268`）。
- **最值得保留：** `story.js` 的事件集合與 `C()` payload、`createInitialPlayer()` 的完整預設 Snapshot、`normalizeSave()` 的舊存檔補值、位置／進攻／生涯評分函式、Narrative Callback 與 Relationship Payoff 邏輯、現有 17 個回歸與稽核測試。
- **第一個重構切入點：** 先建立不改變行為的 Application Controller façade，包裝現有 `createPlayer()`、`choose()`、`showCurrentEvent()`、`saveGame()`、`loadGame()`，並以 golden-flow 測試鎖住現況。第一步不搬移 domain 函式、不拆 `player`、不改事件格式。

## File-to-System Mapping

| File | Current Responsibilities | Architecture System | Compliance | Risk | Recommended Action |
|------|--------------------------|---------------------|------------|------|--------------------|
| `index.html` | 建立創角、書籤、故事、狀態與存檔 UI；以 inline `onclick` 呼叫全域函式；決定 script 載入順序（`index.html:16-18`, `22-55`, `59-110`） | UI Layer / Application Controller entry | Partially Aligned | Medium | Keep and Wrap |
| `style.css` | 呈現創角、目標、事件、比賽 HUD、狀態、關係與生涯卡片（`style.css:154-286`, `291-474`, `481-740`） | UI Layer | Aligned | Low | Keep |
| `player.js` | 建立 `player` 全量 Snapshot、所有跨系統預設資料與顯示 label（`player.js:3-223`） | Player / Identity / Current State / Progression / Relationship / Narrative / Time / Match / Injury / Career | Not Aligned | High | Keep and Wrap |
| `script.js` | 控制創角、決策、事件副作用、章節路由、時間、所有評估、敘事、關係、生涯、比賽與 DOM render（`script.js:381-3294`） | Application Controller + 幾乎所有 Gameplay Systems + UI Layer | Not Aligned | High | Split Later |
| `story.js` | 定義 `C()`、十個事件集合、條件文本、事件順序與 `getCurrentEventId()`／`getEvent()`（`story.js:1-1471`） | Event / Narrative / Decision / Time routing | Partially Aligned | High | Keep and Wrap |
| `save.js` | 儲存整個 `player`、補齊舊 Snapshot、重設全域 `player`、控制讀檔／刪檔 UI（`save.js:1-96`） | Save + Application Controller + UI Layer | Partially Aligned | High | Keep and Wrap |
| `coach.js` | 提供全域 `coach` 相容物件；`trust` 會被 `syncNpcRelationships()` 覆寫（`coach.js:1-9`, `script.js:589-593`） | Coach / Relationship | Partially Aligned | Medium | Needs Further Review |
| `npc.js` | 提供全域 `teammates` 相容資料；第一人的 `friendship` 會被鏡像更新（`npc.js:1-25`, `script.js:589-593`） | Relationship / Organization | Partially Aligned | Medium | Needs Further Review |
| `rival.js` | 提供全域 `rival` 的姓名、能力與關係；被先發評分與顯示讀取（`rival.js:1-15`, `script.js:585-625`） | Relationship / Organization | Partially Aligned | Medium | Keep and Wrap |
| `event.js` | 舊式隨機事件直接寫入已不存在的 `player.contact/mental/fielding/speed`（`event.js:1-49`）；未由 `index.html` 載入 | Event / Progression（legacy） | Not Aligned | Medium | Replace Later |
| `injury.js` | 舊式 `checkInjury()` 讀寫 `player.stamina/injury` 並呼叫 `alert()`（`injury.js:1-17`）；未由 `index.html` 載入 | Injury（legacy） | Not Aligned | Medium | Replace Later |
| `time.js` | 舊式 `nextDay()` 直接改 `day/month/year/age` 並呼叫 `alert()`（`time.js:1-24`）；未由 `index.html` 載入 | Time（legacy） | Not Aligned | Medium | Replace Later |
| `tests/vertical-slice-smoke.js` | VM 載入四核心檔，驗證創角至 22 歲與存檔（`tests/vertical-slice-smoke.js:6-92`） | Application Controller / Save / 整合測試 | Partially Aligned | Low | Keep |
| `tests/goal-balance-test.js` | 模擬八種路線、檢查目標、負荷、位置與技能來源（`tests/goal-balance-test.js:6-177`） | Progression / Decision / Current State | Partially Aligned | Low | Keep |
| `tests/content-flow-audit.js` | 稽核事件 payload、flags 回收與成本（`tests/content-flow-audit.js:6-66`） | Event / Decision / Narrative | Partially Aligned | Low | Keep |
| `tests/callbackTest.js` | 驗證 Callback、Consequence 與跨章回收（`tests/callbackTest.js:25-64`） | Narrative / Event | Partially Aligned | Low | Keep |
| `tests/career-arc-test.js` | 驗證取得角色、失去角色、再定義角色（`tests/career-arc-test.js:6-108`） | Career | Partially Aligned | Low | Keep |
| `tests/career-transition-role-test.js` | 驗證轉換旗標不會錯誤強制角色（`tests/career-transition-role-test.js:13-61`） | Career / Decision | Partially Aligned | Low | Keep |
| `tests/career-transition-route-difference-test.js` | 驗證四條成年入口的路由差異（`tests/career-transition-route-difference-test.js:13-51`） | Career / Narrative | Partially Aligned | Low | Keep |
| `tests/player-archetype-test.js` | 驗證球員型態推論（`tests/player-archetype-test.js:12-52`） | Career / Identity | Partially Aligned | Low | Keep |
| `tests/adult-route-chain-test.js` | 驗證成年事件鏈與 beat 推進（`tests/adult-route-chain-test.js:13-42`） | Narrative / Career | Partially Aligned | Low | Keep |
| `tests/aspiration-narrative-test.js` | 驗證 aspiration 與跨章敘事（`tests/aspiration-narrative-test.js:13-57`） | Narrative / Identity | Partially Aligned | Low | Keep |
| `tests/narrative-continuity-test.js` | 驗證 `narrativeThread` 與標題／內容稽核（`tests/narrative-continuity-test.js:13-41`） | Narrative | Partially Aligned | Low | Keep |
| `tests/relationship-payoff-test.js` | 驗證關係兌現會改變資訊、選項或機會（`tests/relationship-payoff-test.js:13-77`） | Relationship / Narrative | Partially Aligned | Low | Keep |
| `tests/emotional-payoff-test.js` | 驗證人生事件、高潮、低谷、章末與回憶（`tests/emotional-payoff-test.js:23-67`） | Narrative | Partially Aligned | Low | Keep |
| `tests/scene-depth-test.js` | 驗證代表場景、物件與沉默演出（`tests/scene-depth-test.js:18-55`） | Narrative | Partially Aligned | Low | Keep |
| `tests/azhe-storyboard-test.js` | 驗證阿哲事件、人物弧線、物件與成年回響（`tests/azhe-storyboard-test.js:39-124`） | Relationship / Narrative | Partially Aligned | Low | Keep |
| `tests/takahashi-storyboard-test.js` | 驗證高橋四幕事件與跨章物件（`tests/takahashi-storyboard-test.js:41-86`） | Relationship / Narrative | Partially Aligned | Low | Keep |
| `tests/npc-role-refactor-test.js` | 驗證 NPC 在不同人生階段的職權邊界（`tests/npc-role-refactor-test.js:12-44`） | Coach / Relationship / Organization | Partially Aligned | Low | Keep |

## Detailed File Analysis

### `script.js`

- **Current Role：** 目前真正的主程式、隱性 Application Controller、domain service 集合與 UI renderer。
- **Main Functions：**
  - 創角與 debug：`selectOrigin()`、`selectIdealSelf()`、`loadTestBookmark()`、`createPlayer()`、`resetGame()`（`script.js:136-434`）。
  - 目標與延遲事件：`setGoal()` 至 `tickPendingEvents()`（`script.js:469-583`）。
  - 決策總入口：`choose()`（`script.js:1060-1164`）。
  - 章節入口與時間：`enterChapterTwo()` 至 `enterDevelopmentYears()`、`advanceAfterAction()`、`advanceFromNight()`（`script.js:1166-1275`, `2444-2499`）。
  - 跨系統 mutation：`applyEffects()`、`addPersonalityEffects()`、`addImpressionEffects()`、`applySkillEffects()`、`applyNestedEffects()`、`applyMatchEffects()`、`applyBodyEffects()`、`applyCareerEffects()`（`script.js:789-900`, `1277-1331`）。
  - Career：`evaluateMarket()`、`updateCareerValue()`、`changeRoleIdentity()`、`inferRoleIdentity()`、`processCareerArcEvent()`（`script.js:1333-1553`）。
  - Narrative／Relationship：Callback、Consequence、Life Event、Signature Scene、Aspiration、Narrative Thread、Relationship Payoff 系列（`script.js:916-1025`, `1580-2436`）。
  - UI：`showStatChanges()`、`showNotice()`、`showStory()`、`renderMatchHud()`、`updateStatus()`（`script.js:1041-1058`, `2916-3294`）。
- **Data Read：** 幾乎讀取整個全域 `player`；另讀 `coach`、`teammates`、`rival`、`statLabels`、`skillLabels`、事件資料、DOM 輸入與 debug `<details>` 狀態（例如 `script.js:382-403`, `585-625`, `2922-2952`, `3270-3293`）。
- **Data Written：** 直接寫入 `player` 中所有主要 domain；也寫 `coach.trust`、`teammates[0].friendship`、`rival.relationship`（`script.js:589-593`）及多個 DOM container。
- **External Calls：** 呼叫 `createInitialPlayer()`、`getEvent()`、`getCurrentEventId()`、`save.js` 提供的存檔入口（由 UI 觸發）；使用 `window.setTimeout()` 延遲下一幕（`script.js:1140-1163`）。
- **DOM Operations：** `getElementById()`、`querySelector(All)()`、`classList.toggle()`、`innerHTML`、`textContent`、`focus()` 廣泛存在於創角與 render 流程（`script.js:136-162`, `381-433`, `2916-2956`, `3251-3294`）。
- **Architecture Mapping：** Application Controller、Decision、Event resolution、Progression、Relationship、Coach、Organization、Narrative、Time、Match、Injury/Current State、Career、UI 混合。
- **Boundary Violations：**
  1. `choose()` 不是路由器，而是跨十多個 System 的總寫入器（`script.js:1092-1134`）。
  2. `showStory()` 在 render 前排入成人回響、補關係選項、建立敘事主軸、準備比賽、更新目標及競爭狀態（`script.js:2917-2934`）。
  3. `updateStatus()` 在 render 時呼叫 `updateImpression()`、`updateGoals()`、`refreshStartingCompetition()`、`refreshPlayerArchetype()` 與 `evaluateMarket()`，使 UI render 具有 gameplay side effects（`script.js:3251-3268`）。
  4. `ensureRelationshipPayoffChoices()` 直接 `push()` 到 `story.js` 事件的 `choices` 陣列，讓共享事件資料在 runtime 被修改（`script.js:2359-2364`）。
- **Reusable Parts：**
  - 可先包裝的入口：`createPlayer()`、`choose()`、`showCurrentEvent()`、`advanceAfterAction()`。
  - 可逐步抽為純計算：`getPlayerSnapshot()`、`inferTrainingFocus()`、`calculateStartingCompetition()`、`inferRoleIdentity()`、`inferPlayerArchetype()`、`calculatePositionRatings()`、`calculateOffensiveRating()`。
  - 可搬入 UI adapter：`escapeHtml()`、`renderBar()`、`renderMatchHud()`、`renderPositionPanel()`。
  - 現有 audit 函式可作重構驗收。
- **Future Refactor Notes：** 先由 façade 包住入口，再把 `choose()` 拆成 `DecisionRequest → DecisionResult → System Requests`。在建立測試前不應直接搬動 1500 行後的 Narrative/Career 邏輯。

### `player.js`

- **Current Role：** 建立整個遊戲的預設 Snapshot 與全域 `player`。
- **Main Functions：** `createInitialPlayer(name)`；另定義 `SAVE_VERSION`、`statLabels`、`skillLabels`、`phaseLabels`（`player.js:1-223`）。
- **Data Read：** 建立預設值時不讀其他 runtime domain；`name` 由呼叫端傳入。
- **Data Written：** 宣告全域 `player = createInitialPlayer()`（`player.js:192`）。
- **External Calls：** 無。
- **DOM Operations：** 無。
- **Architecture Mapping：** 名稱雖為 Player，內容實際包含 Identity、Current State、Time、Progression、Relationship、Narrative、Match、Injury、Career、Goal、Organization 等資料。
- **Boundary Violations：** `player` 是單一全域容器，但沒有每個 System 的 owner-only write 邊界。例：`narrativeThread`（`player.js:39`）、`relationshipPayoffs`（`player.js:41`）、`body`（`player.js:138-145`）、`matchState`（`player.js:179-186`）都由 `script.js` 直接修改。
- **Reusable Parts：** `createInitialPlayer()` 是完整、可測、對舊存檔有價值的預設 Snapshot factory；`SAVE_VERSION` 與 labels 可保留。
- **Future Refactor Notes：** 不先拆物件形狀。先建立 read/write accessor 或 subsystem façade，再逐步將 owner 移出；確保存檔仍能輸出相同 Snapshot。

### `story.js`

- **Current Role：** 資料化事件庫、條件文本、選項 payload schema、事件路由。
- **Main Functions：**
  - `C()` 建立 choice record（`story.js:1`）。
  - 十個事件集合從 `chapterOneEvents` 到 `pacingEvents`／`developmentEvents`（`story.js:3-1374`）。
  - `getNightEvent()`、`getCurrentEventId()`、`getEvent()`（`story.js:1376-1471`）。
- **Data Read：** 文本與路由大量讀取 `player`、`hasFlag()`、Character Arc、Impression、Relationship、章節 step、`careerExit` 等；例如晚間回顧讀 flags（`story.js:1376-1389`），章節路由讀各 step（`story.js:1393-1466`）。
- **Data Written：** 靜態事件文本本身未找到直接寫入 `player` 的賦值；實際副作用由 choice payload 交給 `script.js`。但事件物件會被 `ensureRelationshipPayoffChoices()` 在別檔修改。
- **External Calls：** 呼叫 `hasFlag()`、部分 Narrative/Relationship helper；`getEvent()` 被 `script.js` 與測試呼叫。
- **DOM Operations：** 無。
- **Architecture Mapping：** Event + Narrative + Decision definition；`getCurrentEventId()` 同時承擔 Time/Application routing。
- **Boundary Violations：**
  - Choice payload 同時包含 `skillEffects`、`relationshipEffects`、`bodyEffects`、`careerEffects`、`matchEffects` 等跨 System 指令；解析集中在 `choose()`。
  - `getCurrentEventId()` 依所有章節 step 與 Current State 直接決定流程（`story.js:1393-1466`），超出純事件資料責任。
  - 文本函式直接依賴全域 `player`，不是接收 Narrative Context。
- **Reusable Parts：** 事件內容、`C()` 形狀、事件 ID、`getEvent()` lookup、既有事件順序全部應保留。
- **Future Refactor Notes：** 先用 adapter 提供只讀 Context，不重寫事件；中期將 `getCurrentEventId()` 的流程判定包入 Controller/Time flow；Choice payload 可逐步轉成 typed Requests。

### `save.js`

- **Current Role：** LocalStorage persistence、Snapshot migration、讀檔後流程恢復與刪檔 UI。
- **Main Functions：** `saveGame()`、`normalizeSave()`、`loadGame()`、`deleteSave()`（`save.js:3-96`）。
- **Data Read：** 全域 `player`、`SAVE_KEY`、LocalStorage、`createInitialPlayer()`。
- **Data Written：** LocalStorage；重新賦值全域 `player`；`loadGame()` 與 `deleteSave()` 也修改 DOM（`save.js:75-96`）。
- **External Calls：** `showNotice()`、`showCurrentEvent()`、`updateStatus()`；因此 Save 依賴 Controller/UI。
- **DOM Operations：** 隱藏／顯示 `characterCreation`、清空 `story`／`choices`（`save.js:80`, `92-94`）。
- **Architecture Mapping：** Save System + Application Controller + UI。
- **Boundary Violations：**
  - `normalizeSave()` 必須知道每個 nested domain 形狀（`save.js:12-67`）。
  - Save layer 直接決定讀檔後 render 與刪檔後重設流程（`save.js:75-96`）。
- **Reusable Parts：** `SAVE_KEY`、JSON Snapshot、`normalizeSave()` 的向後補值策略與錯誤處理。
- **Future Refactor Notes：** 先包成 `createSnapshot()`／`restoreSnapshot()` adapter；保留同一 LocalStorage key 與相同 JSON 形狀。等各 System 提供 restore 後，再縮小 `normalizeSave()` 的跨系統知識。

### `index.html`

- **Current Role：** 單頁應用外殼、創角 input、測試書籤、故事與狀態 mount points、script boot order。
- **Main Functions：** 無自定函式；透過 inline handler 呼叫 `saveGame()`、`loadGame()`、`deleteSave()`、`loadTestBookmark()`、`selectOrigin()`、`selectIdealSelf()`、`createPlayer()`（`index.html:16-18`, `26-55`, `64-89`）。
- **Data Read：** 使用者輸入與 DOM attributes。
- **Data Written：** 由瀏覽器產生 DOM；實際狀態由被呼叫的全域函式修改。
- **External Calls：** 所有 inline handler 都是全域函式契約。
- **DOM Operations：** 定義 `#characterCreation`、`#time`、`#story`、`#changeLog`、`#choices`、`#status`、`#player-info`（`index.html:59-102`）。
- **Architecture Mapping：** UI Layer + bootstrap。
- **Boundary Violations：** UI 直接知道 domain command 名稱與 event ID／bookmark 名稱；缺乏 Controller event adapter。
- **Reusable Parts：** 所有 DOM 容器與創角 markup 可保留。
- **Future Refactor Notes：** Application Controller façade 建立後，把 inline handler 漸進改為 façade 呼叫；不需先重做 HTML。

### `style.css`

- **Current Role：** 全部 presentation style。
- **Main Functions：** 不適用。
- **Data Read / Written：** 不讀寫 gameplay data。
- **External Calls：** 無。
- **DOM Operations：** 透過 selector 呈現；不執行 DOM mutation。
- **Architecture Mapping：** UI Layer。
- **Boundary Violations：** 未發現 gameplay boundary violation。
- **Reusable Parts：** 創角、事件卡、Match HUD、狀態卡、關係／生涯卡及 responsive layout（`style.css:154-740`）。
- **Future Refactor Notes：** Controller 重構期間應凍結 selector 與 DOM contract，避免同時改 UI 造成回歸難以定位。

### `coach.js`

- **Current Role：** 宣告全域 `coach` compatibility object。
- **Main Functions：** 無。
- **Data Read：** 無。
- **Data Written：** 初始 `coach.trust = 50`；之後 `syncNpcRelationships()` 以 `player.relationships.coachTrust` 覆寫（`coach.js:1-9`, `script.js:589-593`）。
- **External Calls / DOM Operations：** 無。
- **Architecture Mapping：** Coach / Relationship legacy view。
- **Boundary Violations：** `coach.trust` 與 `player.relationships.coachTrust` 是重複狀態；目前有效 owner 實際是 `player`，但沒有正式宣告。
- **Reusable Parts：** 姓名與 strictness 可作 NPC definition。
- **Future Refactor Notes：** 先確認是否仍有事件直接讀 `coach.strictness/trust`；在移除鏡像前需全專案搜尋與回歸測試。

### `npc.js`

- **Current Role：** 宣告兩名全域 `teammates` 舊資料。
- **Main Functions：** 無。
- **Data Read：** 無。
- **Data Written：** 初始 friendship/contact/power；`syncNpcRelationships()` 只同步第一人的 friendship（`npc.js:1-25`, `script.js:589-593`）。
- **External Calls / DOM Operations：** 無。
- **Architecture Mapping：** Relationship / Organization legacy data。
- **Boundary Violations：** `teammates[0].friendship` 與 `player.relationships.teammateBond` 重複；contact/power 不屬於目前 `baseballSkills` schema。
- **Reusable Parts：** NPC name/position 可作靜態 definition。
- **Future Refactor Notes：** `Cannot Confirm` 兩位 NPC 是否仍有所有預期 runtime consumers；移動前先以搜尋與測試確認。

### `rival.js`

- **Current Role：** 宣告全域 rival definition 與相容關係值。
- **Main Functions：** 無。
- **Data Read：** 無。
- **Data Written：** 初始值；`syncNpcRelationships()` 更新 `relationship`（`rival.js:1-15`, `script.js:589-593`）。
- **External Calls / DOM Operations：** 無。
- **Architecture Mapping：** Relationship / Organization。
- **Boundary Violations：** `relationship` 與 `player.relationships.rivalRespect/rivalCompetition` 重複，但 `skill` 又被 `getStartingCompetitionBreakdown()` 當計算輸入（`script.js:622-625`），definition 與 mutable state 混在同一物件。
- **Reusable Parts：** `name`、`position`、`skill` 可保留為 NPC definition。
- **Future Refactor Notes：** 將 immutable NPC profile 與 Relationship state 分開前，先由 getter 包裝。

### `event.js`

- **Current Role：** 未載入的舊 `randomEvents` 陣列。
- **Main Functions：** 四個匿名 `effect()`（`event.js:3-47`）。
- **Data Read / Written：** 直接修改 `player.contact`、`mental`、`fielding`、`speed`（`event.js:8-43`）；這些欄位不在 `createInitialPlayer()`。
- **External Calls / DOM Operations：** 無。
- **Architecture Mapping：** Legacy Event / Progression。
- **Boundary Violations：** Event 自己直接寫 Player，且資料 schema 已與現況分離。
- **Reusable Parts：** 四個事件概念可人工轉寫；匿名 effect 不應直接接回主流程。
- **Future Refactor Notes：** 目前 `index.html:104-110` 未載入本檔。正式處置前確認沒有其他部署入口；現況建議標示 legacy，而非立即刪除。

### `injury.js`

- **Current Role：** 未載入的舊傷病檢查。
- **Main Functions：** `checkInjury()`（`injury.js:1-17`）。
- **Data Read / Written：** 讀 `player.stamina`、寫 `player.injury`；目前有效 schema 是 `player.body.stamina/injuryRisk/pain`（`player.js:138-145`）。
- **External Calls：** `Math.random()`、`alert()`。
- **DOM Operations：** 無直接 DOM，但 `alert()` 是 UI side effect。
- **Architecture Mapping：** Legacy Injury。
- **Boundary Violations：** Injury 邏輯直接寫 Player 並直接呈現 UI。
- **Reusable Parts：** 「低體力提高受傷機率」概念可保留；實作不相容。
- **Future Refactor Notes：** 目前未載入。未來 Injury System 應輸出 Result，由 Current State owner 套用、UI 顯示。

### `time.js`

- **Current Role：** 未載入的舊日曆推進。
- **Main Functions：** `nextDay()`（`time.js:1-24`）。
- **Data Read / Written：** 直接修改 `player.day/month/year/age`；目前 `createInitialPlayer()` 沒有 month/year（`player.js:3-189`）。
- **External Calls：** `alert()`。
- **DOM Operations：** 無直接 DOM。
- **Architecture Mapping：** Legacy Time。
- **Boundary Violations：** Time 直接修改 Player Identity（age）並直接顯示通知。
- **Reusable Parts：** rollover 概念；目前實作不可直接使用。
- **Future Refactor Notes：** 現行有效時間流程是 `advanceAfterAction()`、`advanceFromNight()` 與 `story.js:getCurrentEventId()`，因此本檔不能被視為現行 Time owner。

### `tests/*.js`

- **Current Role：** 以 Node `vm` 建立瀏覽器替身，載入 `player.js`、`story.js`、`save.js`、`script.js`，做流程、平衡、敘事、人物、Save 與 Career 回歸。
- **Main Functions：** 各測試自行建立 context、模擬 choice、檢查 state；沒有共用 test harness。
- **Data Read：** 原始程式文字與 VM 中的全域 `player`。
- **Data Written：** 測試 VM 內狀態；部分測試使用假的 LocalStorage。
- **External Calls：** Node `fs`、`path`、`vm`。
- **DOM Operations：** 多數使用 stubbed `document`，不是真實 browser layout。
- **Architecture Mapping：** 跨 System regression safety net。
- **Boundary Violations：** 測試直接呼叫內部全域函式與修改全域 `player`，反映現行架構但會增加拆分成本。
- **Reusable Parts：** 路線資料、期望結果與現有 17 組 regression scenarios。
- **Future Refactor Notes：** 先保留現有 VM 測試作 characterization tests；新增 Controller contract 測試後，再逐步改為透過 public API 操作。真實 DOM／Console 仍需 browser smoke 補足。

## System Coverage Matrix

| Architecture System | Existing Implementation | Main File(s) | Completeness | Notes |
|---------------------|-------------------------|--------------|--------------|-------|
| Application Controller | `createPlayer()`、`choose()`、章節入口、`showCurrentEvent()`、Save load flow | `script.js`, `save.js`, `index.html` | Mixed Across Files | 已有行為，沒有獨立 façade 或 route-only boundary。 |
| Player System | 全域 `player` 與 core stats | `player.js`, `script.js` | Mixed Across Files | Snapshot 在 `player.js`，所有寫入規則在 `script.js`。 |
| Identity System | `name`、`origin`、`idealSelf`、route、role/archetype | `player.js`, `script.js` | Mixed Across Files | Ideal Self 已有 UI；Identity 與 Career 推論仍直接寫同一物件。 |
| Current State System | body、pressure、motivation、burnout、match/current chapter state | `player.js`, `script.js` | Mixed Across Files | 無 owner-only writes；render 也會更新部分狀態。 |
| Decision System | `C()` choice payload、`choose()` resolution | `story.js`, `script.js` | Partial | 有資料化 choice，但無 DecisionRequest/DecisionResult 契約。 |
| Event System | 事件集合、pending/forced event、event lookup | `story.js`, `script.js` | Mixed Across Files | `event.js` 是未載入 legacy；現行 event resolution 在 `script.js`。 |
| Progression System | core/skill/position effects、目標、章節評估 | `script.js`, `player.js` | Mixed Across Files | 功能完整度高，邊界低。 |
| Relationship System | relationships、impression、characterArc、payoffs | `player.js`, `script.js`, `story.js` | Mixed Across Files | 另有 coach/teammate/rival 鏡像資料。 |
| Coach System | 山本角色規則、印象、推薦與評語 | `script.js`, `story.js`, `coach.js` | Mixed Across Files | `coach.js` 不是實際 owner。 |
| Organization System | 球隊角色、先發競爭、NPC 階段職能、名單／市場入口 | `script.js`, `story.js`, `rival.js`, `npc.js` | Partial | 有結果與敘事，沒有明確 Organization state owner。 |
| Narrative System | callback、consequence、life events、scenes、aspiration、thread、continuity | `script.js`, `story.js` | Mixed Across Files | 功能廣，但與 Controller/UI 同檔。 |
| Time System | chapter step、day/phase、事件序列 | `script.js`, `story.js` | Mixed Across Files | `time.js` 未載入且已不相容。 |
| Save System | JSON snapshot、migration、load/delete | `save.js`, `player.js` | Existing | persistence 可用，但直接操作 Controller/UI。 |
| Match System | `matchState`、choice match effects、HUD | `player.js`, `script.js`, `story.js` | Mixed Across Files | 比賽資料、規則與 view 混合。 |
| Injury System | `body`、疲勞／風險／疼痛 effects、長期 consequence | `player.js`, `script.js`, `story.js` | Partial | 現行沒有獨立 injury resolution；`injury.js` 是 inactive legacy。 |
| Career System | 市場、價值、角色、轉折、出口與成年事件鏈 | `script.js`, `story.js`, `player.js` | Mixed Across Files | 行為豐富但與 Narrative/Progression 緊密耦合。 |
| UI Layer | HTML mount points、CSS、render helpers | `index.html`, `style.css`, `script.js`, `save.js` | Mixed Across Files | markup/style 可用；render 具有 gameplay mutation。 |

## Application Controller Assessment

### 1. 目前誰控制主要流程

主要控制者是 `script.js`：

- 開局：`createPlayer()`（`script.js:381-421`）
- 玩家決策：`choose()`（`script.js:1060-1164`）
- 章節轉換：`enterChapterTwo()` 至 `enterDevelopmentYears()`（`script.js:1166-1275`）
- 時間／step：`advanceAfterAction()`、`advanceFromNight()`（`script.js:2444-2499`）
- 事件呈現：`showCurrentEvent()`、`showStory()`（`script.js:2914-2958`）

`save.js` 是第二個流程控制者：`loadGame()` 在還原後直接 `showCurrentEvent()`，`deleteSave()` 直接重設 player、DOM 與 status（`save.js:75-96`）。

### 2. 現行流程責任

| Flow Step | Current Controller | Evidence |
|---|---|---|
| Start Game | HTML inline handler → `script.js:createPlayer()` | `index.html:89`, `script.js:381-421` |
| Start Day / Resume | `script.js:showCurrentEvent()` → `story.js:getCurrentEventId()` | `script.js:2914`, `story.js:1393-1466` |
| Decision | HTML generated inline handler → `script.js:choose()` | `script.js:2952`, `1060-1164` |
| Event Lookup | `story.js:getEvent()` | `story.js:1469-1471` |
| State Update | `script.js:choose()` 與多個 `apply*` / `process*` | `script.js:1092-1134` |
| Progression | `updateGoalProgressForChoice()`、章節 evaluate 函式 | `script.js:774-787`, `2537-2912` |
| Relationship / World Response | `updateImpression()`、`processRelationshipPayoffs()` | `script.js:847-880`, `2306-2357` |
| Save | `save.js:saveGame()` | `save.js:3-7` |
| Advance Time | `advanceAfterAction()`／`advanceFromNight()` | `script.js:2444-2499` |
| Render | `showStory()`／`updateStatus()` | `script.js:2916-2958`, `3251-3294` |

### 3. 目前實際流程圖

#### 新遊戲

```text
index.html onclick="createPlayer()"
↓
script.js createPlayer()
↓
createInitialPlayer() + applyEffects() + addPersonalityEffects() + addFlags()
↓
直接寫入全域 player 與創角 DOM
↓
showCurrentEvent()
↓
story.js getCurrentEventId() / getEvent()
↓
script.js showStory() / updateStatus()
```

#### 一般選擇

```text
showStory() 產生 onclick="choose(eventId, index)"
↓
script.js choose()
↓
story.js getEvent()
↓
applyEffects / applySkillEffects / applyBodyEffects / applyMatchEffects / ...
↓
Career + Emotional + Relationship + Aspiration + Narrative Thread processors
↓
advanceAfterAction() + tickPendingEvents()
↓
showCurrentEvent()
↓
showStory() + updateStatus()
```

#### 讀檔

```text
index.html onclick="loadGame()"
↓
save.js loadGame()
↓
localStorage → normalizeSave() → 重新賦值全域 player
↓
直接隱藏創角 DOM
↓
script.js showCurrentEvent()
```

### 4. 多控制者與直接 state mutation

- `index.html` 直接綁全域 commands（`index.html:16-18`, `26-55`, `64-89`）。
- `choose()` 同時是 command handler、resolver、state writer、time controller（`script.js:1060-1164`）。
- `showStory()` 與 `updateStatus()` 在 render 時修改狀態（`script.js:2917-2934`, `3251-3268`）。
- `loadGame()`／`deleteSave()` 直接重設 player 並操作 DOM（`save.js:75-96`）。

### 5. 未來可由 Controller 包裝的既有函式

- `createPlayer()`：先作 `startGame()` adapter，不改內部行為。
- `choose(eventId, index)`：先作 `submitDecision()` adapter。
- `showCurrentEvent()`：先作 `presentCurrentScene()` adapter。
- `advanceAfterAction()`／`advanceFromNight()`：先作 `completeTurn()` adapter。
- `saveGame()`／`loadGame()`：先作 `saveSession()`／`resumeSession()` adapter。

### 6. 不應在第一階段直接搬動的函式

- `processCareerArcEvent()`、`processEmotionalEvent()`、`processRelationshipPayoffs()`、`processAspirationEvent()`：互相依賴 flags、player schema 與事件 ID。
- `evaluateChapter2Result()` 至 `evaluateDevelopmentYears()`：與章節流程和測試高度綁定。
- `getCurrentEventId()`：雖有 Controller 責任，但牽涉所有現有路由。
- `normalizeSave()`：牽涉舊存檔相容性。

## Data Ownership Assessment

| Data | Current Owner | Readers | Writers | Architecture Owner | Conflict |
|------|---------------|---------|---------|--------------------|----------|
| Player core stats (`ballSense` 等) | 全域 `player` in `player.js` | `script.js`, `story.js`, tests | `script.js:applyEffects()`, `clampStats()`, `save.js:load/delete` | Player / Progression | 多檔案可重設整個 player；無 owner-only write。 |
| Identity (`name`, `origin`, `idealSelf`, `route`) | `player.js` default + `script.js` | UI、Narrative、Career | `createPlayer()`, `updateRoute()`, Save restore | Identity | Identity 建立、成長解讀與 Save restore 未分界。 |
| Current State (`pressure`, `body`, motivation/burnout) | `player` | Decision、Narrative、Career、UI | `applyEffects()`, `applyBodyEffects()`, relationship payoff、evaluators | Current State | Progression、Relationship、Career 均可直接寫。 |
| Time (`chapter`, `day`, `phase`, 各 step) | `player` | `story.js:getCurrentEventId()`, UI | `enter*()`, `advanceAfterAction()`, `advanceFromNight()`, Save | Time | 路由與時間分散在 `script.js`／`story.js`；legacy `time.js` 不生效。 |
| Relationship (`relationships`, `impression`, `characterArc`) | `player`；另有 `coach/teammates/rival` 鏡像 | Story、Career、UI | `script.js` relationship processors、`syncNpcRelationships()`、Save | Relationship / Coach | 同一關係存在兩份；legacy globals 是 window 層級。 |
| Narrative (`flags`, callbacks, memories, life events, thread 等) | `player` | Story、UI、tests | `script.js` 多個 Narrative processors、Save | Narrative | Controller、render 與 Narrative owner 混在同檔。 |
| Save Snapshot | LocalStorage whole `player` | `save.js` | `saveGame()`、`loadGame()`、`deleteSave()` | Save | Snapshot 保存可用，但 migration 知道所有 domain；load 直接控制 UI。 |
| Match (`matchState`, performance/errors) | `player` | Story/UI/Competition/Career | `applyMatchEffects()`, `prepareMatchStateForEvent()` | Match | `prepareMatchStateForEvent()` 在 render path 寫 state。 |
| Injury / Body | `player.body` | Story/Career/UI | `applyBodyEffects()`、Consequence、Relationship payoff | Injury / Current State | Injury resolution 未獨立；legacy `injury.js` 使用另一 schema。 |
| Career (`careerValue`, roleIdentity, marketEvaluation 等) | `player` | Narrative/UI/tests | `script.js` Career functions、chapter evaluators | Career | Career functions同時寫 Current State、Narrative turning points、Relationship-derived機會。 |
| DOM UI state | Browser DOM | `script.js`, `save.js` | `script.js`, `save.js` | UI Layer | DOM 不是主要 gameplay source；但 name input 與 bookmark name 由 DOM 讀入，`debug-bookmarks.open` 決定 debug view（`script.js:165`, `3270`）。 |

### 特別標示

- **多檔案寫同一資料：** `player` 可被 `script.js` 欄位級修改，也可被 `save.js` 整體重新賦值。
- **全域變數：** `player`、`coach`、`teammates`、`rival`、事件集合、所有函式都在 window/global scope。
- **window 層級資料：** 非 ES module；載入順序是隱性 dependency contract（`index.html:104-110`）。
- **DOM 當狀態來源：** gameplay 主要狀態不在 DOM；創角 name 與 debug open state 例外。選取的 Ideal Self 由 `selectedIdealSelf` 保存，不靠 class 反查（`script.js:143-160`）。
- **Save / Load 還原：** `normalizeSave()` 已覆蓋目前多數 nested objects（`save.js:12-67`），但任何未來新增 nested structure 都需要手動加入；完整性會隨 schema 擴張而變脆弱。
- **不同 System 直接修改：** `processRelationshipPayoffs()` 可直接寫 burnout、pressure、exposure、scoutEvaluation、reputation（`script.js:2314-2355`），是明確跨 owner mutation。

## Cross-System Coupling

### Coupling-001

- **Source File：** `script.js`
- **Target File or Data：** 整個 `player`
- **Current Behavior：** `choose()` 依序套用核心能力、人格、印象、人物弧線、技能、守位、關係、身體、課業、高中、生涯、經濟、比賽、Callback、Consequence、Narrative 等副作用（`script.js:1092-1134`）。
- **Architecture Conflict：** Controller 應路由 Result/Request，不應直接成為所有 System writer。
- **Severity：** High
- **Future Resolution：** 先包 `choose()`，再逐類 effect 改成 typed Requests；每次只移出一個 System。

### Coupling-002

- **Source File：** `script.js`
- **Target File or Data：** UI render 與 gameplay state
- **Current Behavior：** `showStory()` 與 `updateStatus()` 在呈現時排事件、補 choices、更新目標／市場／競爭（`script.js:2917-2934`, `3251-3268`）。
- **Architecture Conflict：** Presentation 不應改變 gameplay truth。
- **Severity：** High
- **Future Resolution：** 先在 render 前由 Controller 呼叫 preparation pipeline；render 函式只接 View Model。

### Coupling-003

- **Source File：** `story.js`
- **Target File or Data：** `player` 與 `script.js` globals
- **Current Behavior：** Event text 直接讀 global player/flags；`getCurrentEventId()` 讀所有章節 step（`story.js:1376-1466`）。
- **Architecture Conflict：** Narrative/Event 應接收 Context，Time/Controller 應決定流程。
- **Severity：** High
- **Future Resolution：** 先建立 read-only Context adapter；保留現有 event function signatures 的相容 wrapper。

### Coupling-004

- **Source File：** `script.js`
- **Target File or Data：** `story.js` event definitions
- **Current Behavior：** `ensureRelationshipPayoffChoices()` 在 runtime 直接 `event.choices.push(...)`（`script.js:2359-2364`）。
- **Architecture Conflict：** 靜態 Event definition 被 UI/Relationship pipeline 改寫，重複 render 需要額外去重。
- **Severity：** Medium
- **Future Resolution：** 建立 derived choices，不修改原 event object。

### Coupling-005

- **Source File：** `save.js`
- **Target File or Data：** 全域 player、Application flow、DOM
- **Current Behavior：** `loadGame()`／`deleteSave()` 同時 persistence、state restore、畫面切換與 render（`save.js:75-96`）。
- **Architecture Conflict：** Save 應只建立／還原 Snapshot，不控制 UI。
- **Severity：** High
- **Future Resolution：** Save 回傳 Result，由 Controller 決定 replace state 與 render。

### Coupling-006

- **Source File：** `script.js`
- **Target File or Data：** `coach`, `teammates`, `rival`
- **Current Behavior：** `syncNpcRelationships()` 把 player 關係鏡像到三個 legacy globals（`script.js:589-593`）。
- **Architecture Conflict：** 同一關係存在多個 mutable source。
- **Severity：** Medium
- **Future Resolution：** 宣告 `player.relationships` 為暫時唯一 truth，legacy objects 只保留 immutable profile。

### Coupling-007

- **Source File：** `story.js`
- **Target File or Data：** Decision / Progression / Relationship / Match / Injury / Career
- **Current Behavior：** `C()` payload 同時攜帶多類 effects；現有事件中 `relationshipEffects`、`skillEffects`、`bodyEffects`、`careerEffects` 等大量混用（例如 `story.js:1370-1371`）。
- **Architecture Conflict：** Choice definition 與跨系統 mutation schema 混合，尚無 Result/Request 邊界。
- **Severity：** High
- **Future Resolution：** 保留 payload，先由 Decision adapter 轉譯成 Requests，不需一次重寫事件。

### Coupling-008

- **Source File：** `script.js`
- **Target File or Data：** Relationship → Career / Current State / Progression
- **Current Behavior：** `processRelationshipPayoffs()` 直接改 burnout、pressure、exposure、scoutEvaluation、reputation 並新增 flags（`script.js:2314-2355`）。
- **Architecture Conflict：** Relationship 應輸出 Payoff Result，相關 owner 再套用。
- **Severity：** High
- **Future Resolution：** 回傳 `RelationshipPayoffResult.requests`，由 Controller 分派。

### Coupling-009

- **Source File：** `script.js`
- **Target File or Data：** Match state
- **Current Behavior：** `prepareMatchStateForEvent()` 在 `showStory()` 期間直接改 inning/outs/runners（`script.js:2931`, `2960-2968`）。
- **Architecture Conflict：** UI presentation 造成 Match state mutation。
- **Severity：** High
- **Future Resolution：** 事件進場時由 Match System 建立 Match Context，render 只讀。

### Coupling-010

- **Source File：** `time.js`, `injury.js`, `event.js`
- **Target File or Data：** 過期 player schema
- **Current Behavior：** 使用 `month/year/stamina/injury/contact/mental` 等現行 Snapshot 不含的欄位，且三檔未由 `index.html` 載入。
- **Architecture Conflict：** 檔名看似對應 System，但不是現行 implementation。
- **Severity：** Medium
- **Future Resolution：** 保持 inactive；建立新 owner 後人工搬取概念，最後才移除 legacy。

### Coupling-011

- **Source File：** `index.html`
- **Target File or Data：** 所有 global commands
- **Current Behavior：** inline `onclick` 直接呼叫 Save、debug、創角與 Decision 函式（`index.html:16-18`, `26-55`, `64-89`）。
- **Architecture Conflict：** UI command 沒有通過單一 Controller API。
- **Severity：** Medium
- **Future Resolution：** façade 建立後逐一改綁 Controller，不先改 DOM 結構。

### Coupling-012

- **Source File：** tests
- **Target File or Data：** 內部 globals
- **Current Behavior：** 測試直接重設 `player`、呼叫 `choose()`／internal processors，並以固定四檔載入建立 context（例如 `tests/vertical-slice-smoke.js:6-92`）。
- **Architecture Conflict：** 測試依賴實作細節，不是 public System contracts。
- **Severity：** Medium
- **Future Resolution：** 現有測試先保留為 characterization suite；Controller API 穩定後新增 contract tests，再漸進移轉。

## Reusable Components

### 資料結構

- `createInitialPlayer()` 與 `SAVE_VERSION`：可作 transition-era Snapshot factory（`player.js:1-190`）。
- `player.body`、`matchState`、`careerValue`、`roleIdentity`、`narrativeThread` 等 nested shapes：雖 owner 未分離，資料契約已具體。
- `C()` choice payload：現有內容量大，適合由 adapter 轉譯而非重寫（`story.js:1`）。

### 純函式或接近純函式

- `getPlayerSnapshot()`（只讀 player 組 Snapshot，`script.js:726-730`）。
- `inferTrainingFocus()`（以 choice 推論 focus，`script.js:733-745`）。
- `getStartingCompetitionBreakdown()`、`calculateStartingCompetition()`（大部分為計算，仍讀 globals，`script.js:612-630`）。
- `calculateCareerValue()`、`inferRoleIdentity()`、`inferPlayerArchetype()`（可改成參數化 calculator，`script.js:1353-1360`, `1408-1469`）。
- `progressPercent()`、`calculatePositionRatings()`、`calculateOffensiveRating()`（可保留計算規則，`script.js:3004-3079`）。

### UI render

- `escapeHtml()`、`renderBar()`、`renderMatchHud()`、`renderPositionPanel()` 可移入 UI adapter，不需改視覺。
- 現有 HTML mount points 與 CSS selector contract 可保持。

### Save / Load

- `normalizeSave()` 的 fresh-default + nested merge 策略可保留。
- `SAVE_KEY` 與 whole-snapshot JSON 應在早期重構保持不變。

### 時間與路由

- `advanceAfterAction()` 的章節步數規則與 `getCurrentEventId()` 的序列可先完整包裝；不應在 Controller Skeleton 階段重寫。

### 事件、NPC 與劇情

- `story.js` 所有現有事件 ID、事件文本、choice payload 與短事件鏈。
- `npcRoleMap`、Relationship Payoff、Callback、Signature Scene、Aspiration、Narrative Thread 資料與稽核。
- `rival.js` profile 值；`coach.js`／`npc.js` 名稱與位置資料在去除 duplicate mutable state 後可保留。

### 測試

- 17 個現有 VM 測試提供重要 characterization coverage，尤其：
  - `vertical-slice-smoke.js`：全流程。
  - `goal-balance-test.js`：平衡與負荷。
  - `career-transition-role-test.js`：角色推論回歸。
  - `narrative-continuity-test.js`／`relationship-payoff-test.js`：敘事與關係。

## Refactor Risk Register

| Risk ID | Description | Impact | Probability | Suggested Mitigation |
|---------|-------------|--------|-------------|----------------------|
| Risk-001 | Save schema 與所有 System 共用同一大型 Snapshot，拆分 owner 時容易漏欄位 | High | High | 凍結 `SAVE_KEY` 與輸出形狀；以 `normalizeSave()` 和 round-trip 測試作 compatibility gate。 |
| Risk-002 | 舊存檔缺少新 nested fields 時可能還原不完整 | High | Medium | 每次新增 owner 前加入 versioned fixture；保留 fresh-default merge。 |
| Risk-003 | 全域 `player` 與全域函式讓任何檔案都能越界寫入 | High | High | 先建立 façade 和 accessor，不立即改成 modules；以搜尋列出 writer。 |
| Risk-004 | DOM 與狀態耦合，render 函式具有 gameplay side effects | High | High | 先寫 render-idempotence 測試；將 preparation 移至 Controller，再建立 View Model。 |
| Risk-005 | 函式呼叫循環或隱性循環可能藏在 `showStory → updateStatus → updateGoals/getCurrentEventId` | High | Medium | 建立 call trace／spies；一次只移一個 side effect，不整段搬動。 |
| Risk-006 | 有效時間推進分散於 `advanceAfterAction()`、`advanceFromNight()`、章節入口與 `getCurrentEventId()` | High | High | 先將現行 flow 包成 `completeTurn()`；用每章 step golden tests 鎖定。 |
| Risk-007 | 一次 choice 觸發大量 System 更新，調整順序會改變結果 | High | High | Characterization test 記錄 before/after Snapshot；保留既有更新順序直到 Requests 建立。 |
| Risk-008 | 事件結果直接改資料或事件 choice 被 runtime 修改 | High | High | Decision adapter 產生 Results；derived choices 不寫回 event definition。 |
| Risk-009 | 劇情文本與系統邏輯混合，抽離 Context 可能改變分支文字 | High | High | 建立每個關鍵 event 的 text fixture；先注入相同只讀 Context。 |
| Risk-010 | `coach`、`teammates`、`rival` 與 player relationship 是重複 truth | Medium | High | 暫定 player 為 source；先把 legacy objects 變 read-only projection。 |
| Risk-011 | `event.js`、`injury.js`、`time.js` 看似可用但 schema 已過期 | Medium | Medium | 明確標示 inactive legacy；禁止直接加入 `index.html`。 |
| Risk-012 | 現有 VM 測試直接依賴 globals，模組化可能一次破壞全部測試 | High | High | 先保留 global compatibility export；新增 Controller contract tests 後逐步移轉。 |
| Risk-013 | `window.setTimeout(420)` 造成測試與流程 transition state 競態 | Medium | Medium | Controller façade 提供可注入 scheduler；第一階段仍使用現有 timer。 |
| Risk-014 | `showStory()` 重複呼叫可能重複觸發 preparation 或資料衍生 | Medium | Medium | 加入 render-twice Snapshot 不變測試，再移除 render side effects。 |

## Recommended Implementation Order

### Phase 1：Application Controller Skeleton

- **目標：** 建立單一 public façade，先包裝目前可用入口，不搬 domain 邏輯。
- **涉及檔案：** 未來新增 `application-controller.js`、更新 `index.html` 載入與 handler、增加 Controller smoke test；必要時只在 `script.js` 暴露現有 adapter。
- **允許修改：** 新增 route-only methods，例如 `startGame`、`submitDecision`、`presentCurrentScene`、`saveSession`、`resumeSession`；內部仍委派舊函式。
- **禁止修改：** `choose()` 更新順序、事件 payload、章節路由、player schema、Save key、UI layout、數值。
- **完成條件：** UI 的主要 command 可經 façade 進入；舊 global functions 仍相容；新舊入口產生相同 Snapshot。
- **測試方式：** 現有 17 組回歸、Controller golden-flow、創角／選擇／存讀／下一事件 Snapshot 對比。

### Phase 2：Player / Identity Boundary

- **目標：** 把 Player core 與 Identity 的讀寫入口明文化，仍保持相同 `player` Snapshot。
- **涉及檔案：** `player.js`、Application Controller、Identity contract tests、少量 `script.js` adapters。
- **允許修改：** 新增 getters/commands；建立 name/origin/idealSelf/route 的 owner API。
- **禁止修改：** 初始值、Ideal Self 效果、能力公式、事件文字、Save shape。
- **完成條件：** 創角不再由 UI/Controller 逐欄任意寫 Identity；舊存檔 round-trip 相同。
- **測試方式：** 創角五種 Ideal Self、三種 origin、舊存檔 fixture、vertical slice smoke。

### Phase 3：Current State Boundary

- **目標：** 收回 pressure/body/motivation/burnout/match-now 等當下狀態寫入。
- **涉及檔案：** `player.js` 或新 Current State adapter、`script.js` effect wrappers、測試。
- **允許修改：** `applyEffects()`／`applyBodyEffects()` 改委派 owner；建立 clamp/result contract。
- **禁止修改：** 數值上限、疲勞與 consequence 規則、事件 effects。
- **完成條件：** Current State 只有 owner API 可更新；UI render 不再更新 Current State。
- **測試方式：** before/after Snapshot、過度訓練、疼痛、疲勞、render-twice idempotence。

### Phase 4：Decision / Event Request Flow

- **目標：** 將 `choose()` 的 payload 解析改為 `DecisionResult` 與跨 System Requests。
- **涉及檔案：** `script.js`、`story.js` adapter、新 Decision/Event modules 或 wrappers、測試。
- **允許修改：** 建立 payload translator；每次抽一種 effect。
- **禁止修改：** 事件 ID、文字、選項文字、效果數值與處理順序。
- **完成條件：** `choose()` 只協調 request dispatch；至少 core/skill/body/relationship effects 有明確 owner。
- **測試方式：** 所有事件 choice Snapshot regression、content-flow-audit、goal-balance-test。

### Phase 5：Time / Save Day Completion

- **目標：** 建立單一 Turn/Day completion flow，Save 只處理 Snapshot。
- **涉及檔案：** `script.js`、`save.js`、`story.js` routing adapter、Controller、測試。
- **允許修改：** 包裝 `advanceAfterAction()`、`advanceFromNight()`、load restore result；Controller 決定 render。
- **禁止修改：** 章節長度、sequence、Save key、舊存檔資料。
- **完成條件：** 每次決策只推進一次；Save/Load 不直接操作 gameplay UI；所有章節可續玩。
- **測試方式：** 每章 step boundary、save-at-each-chapter fixtures、reload 後 event ID 一致。

### Phase 6：World Response Systems

- **目標：** 將 Progression、Relationship、Coach、Organization、Narrative、Match、Injury、Career 依 owner-only write 原則逐一收回。
- **涉及檔案：** `script.js` 中相應函式、`story.js` Context adapter、各 System module、既有 tests。
- **允許修改：** 每次只抽一個 System；Result 以 Requests 交回 Controller。
- **禁止修改：** 同一批同時搬多個 System；不可在架構抽離時順便改平衡或劇情。
- **完成條件：** UI 只讀 View Model；Narrative/Relationship/Career 不直接互寫；legacy NPC 鏡像可移除或固定為 projection。
- **測試方式：** 系統 contract tests + 17 組現有回歸 + 真實 browser page/Console smoke。

## First Implementation Recommendation

- **任務名稱：** Application Controller Compatibility Façade
- **為什麼先做：** 現行可玩流程已集中於 `script.js`，但 UI、Save 與決策直接呼叫不同 global functions。先加 façade 能建立單一入口，又不需要碰高風險的 `choose()`、事件資料或 player schema。
- **預計新增或修改哪些檔案：**
  - 新增 `application-controller.js`
  - 修改 `index.html`：在既有 runtime 檔後載入 façade，將主要 command 綁到 façade
  - 新增 `tests/application-controller-test.js`
  - `script.js` 原則上不改；若 façade 無法安全取用，僅增加相容 export，不搬函式
- **哪些舊功能必須保持不變：**
  - 創角、Origin、Ideal Self
  - `choose()` 的副作用順序與 420ms transition
  - 所有事件 ID、章節路由與文案
  - Save key、Snapshot 形狀、舊存檔
  - debug 書籤、UI 結構、CSS
  - 17 組現有回歸測試
- **最小完成條件：**
  1. façade 暴露 `startGame()`、`submitDecision(eventId,index)`、`presentCurrentScene()`、`saveSession()`、`resumeSession()`、`deleteSession()`。
  2. 每個方法只委派既有函式，不自行寫 `player`。
  3. 透過 façade 與舊入口完成同一組操作時，關鍵 Snapshot 與下一事件 ID 完全相同。
- **測試清單：**
  - 空名字／未選 Ideal Self
  - 正常創角
  - 一個上午選擇與夜間推進
  - pending event
  - 章節入口
  - save/load/delete
  - `vertical-slice-smoke.js`
  - 全部既有 tests
  - 瀏覽器 Console 0 error
- **回退方式：** 移除 `application-controller.js` 的 `<script>` 與 handler adapter，恢復原 inline global 呼叫；因未更動 player、事件與 Save schema，不需資料 migration。

> 本節保留 Phase 1 實作前的原始建議；實際執行結果記錄於下方 Implementation Progress。

## Implementation Progress

### Phase 1：Application Controller Compatibility Façade

**Status：Completed**

#### 新增檔案

- `application-controller.js`
  - 建立全域 `ApplicationController`。
  - 以 `invokeLegacy()` 在呼叫當下解析並委派既有全域函式。
  - 只做必要參數驗證、統一 Result 與可追蹤錯誤處理。
  - 不讀寫 `player`、DOM、LocalStorage、事件、時間或任何 System 資料。
- `tests/application-controller-test.js`
  - 驗證 façade 存在、public methods、委派函式與參數順序。
  - 驗證缺少依賴時的錯誤 Result。
  - 驗證 Controller 本身不直接修改狀態、不額外 render、不推進 step。
  - 建立 Legacy Entry 與 Controller Entry 的 Golden Flow Snapshot 對照。
  - 驗證動態 Decision handler 仍保留 legacy `choose()`。

#### 修改檔案

- `index.html`
  - 在既有 `script.js` 之後載入 `application-controller.js`。
  - 不改 HTML 結構、CSS class、按鈕文字或 DOM id。
  - 將主要靜態 UI command 改由 `ApplicationController` 委派。
- `docs/02_Architecture/22_Prototype-Implementation.md`
  - 只新增本節 Phase 1 實作進度；原 Architecture Mapping 結論保持不變。

#### Façade Public Methods

必要方法：

- `ApplicationController.startGame()` → `createPlayer()`
- `ApplicationController.submitDecision(eventId, choiceIndex)` → `choose(eventId, choiceIndex)`
- `ApplicationController.presentCurrentScene()` → `showCurrentEvent()`
- `ApplicationController.saveSession()` → `saveGame()`
- `ApplicationController.resumeSession()` → `loadGame()`
- `ApplicationController.deleteSession()` → `deleteSave()`

相容 UI 方法：

- `ApplicationController.selectOrigin(origin)` → `selectOrigin(origin)`
- `ApplicationController.selectIdealSelf(idealSelf)` → `selectIdealSelf(idealSelf)`
- `ApplicationController.loadTestBookmark(bookmark)` → `loadTestBookmark(bookmark)`

上述方法都在委派後回傳 `{ ok: true }` 或 `{ ok: true, value }`；參數無效或依賴不存在時回傳 `{ ok: false, error }`。既有函式拋出的 error 會保留在 `cause` 並輸出可追蹤的 Console error。

#### 已改走 Controller 的 UI Command

- 建立角色
- 儲存
- 讀取
- 刪除存檔
- 三個 Origin 選擇
- 五個 Ideal Self 選擇
- 全部暫時測試書籤

#### 暫時保留的 Legacy Entry

以下既有全域函式完全保留，未刪除、改名或改寫：

- `createPlayer`
- `choose`
- `showCurrentEvent`
- `saveGame`
- `loadGame`
- `deleteSave`
- `selectOrigin`
- `selectIdealSelf`
- `loadTestBookmark`

#### Deferred Compatibility Items

- `showStory()` 動態產生的事件按鈕仍直接呼叫 `choose(eventId, index)`。
- 原因：Phase 1 不修改 `showStory()`、escaping、420ms transition 或現有 Decision runtime。
- `ApplicationController.submitDecision()` 已可供未來入口使用，待 Phase 4 Decision / Event Request Flow 再評估全面接管。
- `script.js`、`save.js` 內部仍可直接互相呼叫 legacy globals；Phase 1 只統一主要靜態 UI command。

#### 測試結果

- JavaScript 語法檢查：`29／29` 通過。
- `tests/application-controller-test.js`：通過。
  - ApplicationController public methods：`9／9`。
  - Legacy delegation：`9／9`。
  - Golden Flow：Legacy Entry 與 Controller Entry 的 event ID、chapter、day、phase、step、flags、relationships、stats 相同。
  - Controller 不額外 render、不額外推進 step。
- 全專案測試：`18／18` 通過（原有 17 組 + 新增 Controller 測試）。
- 瀏覽器實測：
  - Origin 與 Ideal Self 靜態 UI command 正常。
  - 可透過 Controller 建立角色。
  - 動態 Decision handler 仍可正常從上午推進至下午。
  - 儲存後推進，再讀檔可回到儲存時的上午狀態。
  - 刪除存檔後創角區正常恢復。
  - Browser Console：`0` 個 error。

#### 已知限制

- façade 不改寫 legacy 函式的內部回傳契約。若 legacy 函式以 UI 訊息阻止操作但沒有 throw 或明確回傳值，Controller 只能確認「委派完成」，不能判斷 domain operation 是否成立。
- `showStory()`、`updateStatus()` 的 render side effects 仍存在，依 Phase 1 限制未處理。
- `choose()` 仍是跨 System mutation 入口，依 Phase 1 限制未拆分。
- `ApplicationController` 目前是 classic script 全域，不是 ES Module。

#### 回退方式

1. 將 `index.html` 的靜態 `onclick` 恢復為原 legacy global 呼叫。
2. 移除 `<script src="application-controller.js"></script>`。
3. 移除 `application-controller.js` 與 `tests/application-controller-test.js`。
4. 移除本 Implementation Progress 節。

因 Phase 1 未修改 `player` schema、`SAVE_VERSION`、`SAVE_KEY`、`normalizeSave()`、事件資料或數值，回退不需要 Save migration。

### Phase 2：Player Data Ownership Boundary

**Status：Completed**

#### 實作位置與修改檔案

- `player.js`
  - 新增全域唯讀 `PlayerIdentityOptions`，作為 Origin 與 Ideal Self 的唯一 runtime 合法值契約。
  - 新增全域 `PlayerDataBoundary`。
  - 保留 `createInitialPlayer()` 為唯一完整初始值來源；Boundary 沒有複製 Player default object。
  - 保留完整 `player` Snapshot 與 `window.player` 相容入口，沒有拆分 schema。
- `script.js`
  - `createPlayer()` 改由 `PlayerDataBoundary.createInitialSnapshot()` 建立完整 Snapshot。
  - `createPlayer()` 改由 `PlayerDataBoundary.initializeIdentity()` 原子寫入 `name`、`origin`、`idealSelf`。
  - Ideal Self 說明與 Origin 效果表改由 `PlayerIdentityOptions` 的值建立 key。
  - Origin 效果、人格效果、flag、memory、印象更新與 render 順序維持在原本創角流程。
- `tests/player-data-boundary-test.js`
  - 新增 Boundary contract、原子性、隔離性、Source Guard、Golden Character Creation Matrix、Save/Load、legacy fixture、Controller 與載入順序測試。
- `docs/02_Architecture/22_Prototype-Implementation.md`
  - 只新增本 Phase 2 實作紀錄；Phase 1 實作進度與原 Architecture Mapping 保留。

本次沒有新增獨立 `player-data-boundary.js`。Boundary 放在 `player.js`，因為 `createInitialPlayer()` 與唯一完整 Player Snapshot 已由該檔案定義；放在同一 owner 檔案可避免新增 runtime／VM 載入順序與擴大既有測試修改面。

#### PlayerDataBoundary Public Methods

- `createInitialSnapshot()`
  - 直接委派 `createInitialPlayer()`，每次回傳新的完整 Snapshot。
- `getSnapshot()`
  - 回傳目前 `player` 的 JSON 深層複製，外部修改不會影響正式 Snapshot。
- `getIdentity()`
  - 只回傳 `{ name, origin, idealSelf }`。
- `validateIdentityInput(identityInput)`
  - 驗證非空白姓名、合法 Origin 與合法 Ideal Self；不修改任何資料。
- `initializeIdentity(identityInput)`
  - 驗證全部成功後，一次寫入三個 Identity 欄位並回傳明確 Result。
  - 驗證失敗不會留下部分寫入。
- `restoreSnapshot(snapshot)`
  - 提供完整 Snapshot replacement 的相容包裝與深層複製。
  - 本 Phase 不接管 `loadGame()`，不繞過 `normalizeSave()`。
- `isIdentityInitialized()`
  - 以相同合法值契約判斷目前 Identity 是否完整。

#### 合法值 Runtime Source

唯一驗證來源為 `player.js` 的唯讀 `PlayerIdentityOptions`：

- Origin：`prove`、`understand`、`belong`
- Ideal Self：`全能型`、`技術鑽研型`、`直覺天賦型`、`關鍵時刻型`、`團隊核心型`

`script.js` 的 Ideal Self 說明與 Origin 效果表以這份契約建立 key。`index.html` 保留相同 `data-*` 值作為既有 UI projection；事件中的 Origin 比較仍屬現有敘事分支，不另建立第二份合法值清單。

#### Identity Write Inventory

1. **Creation Write**
   - 原 `createInitialPlayer(name)`、`player.origin = selectedOrigin`、`player.idealSelf = selectedIdealSelf` 已由 `createInitialSnapshot()` 與 `initializeIdentity()` 接管。
   - `createPlayer()` 函式內不再存在 `player.name =`、`player.origin =`、`player.idealSelf =`。
2. **Save Restore Write**
   - `save.js` 的 `player = normalizeSave(...)` 暫時保留，確保現有 migration 與 UI 流程完全不變。
   - `restoreSnapshot()` 已建立並測試，但尚未接管 `loadGame()`。
3. **Debug/Test Write**
   - Debug bookmark、reset 與既有 VM tests 的 `player = createInitialPlayer(...)` 暫時保留；它們是相容測試與開發入口，不是本 Phase 強制遷移範圍。
4. **Runtime Identity Evolution**
   - 現行 runtime 沒有在創角後重新寫入 `name`、`origin`、`idealSelf`。
   - `route`、`roleIdentity`、Career 類欄位依限制只盤點、不收回。
5. **Unknown**
   - 沒有發現未分類的正式 Identity writer。

Boundary 本身是三個欄位的正式 owner，因此其內部三次欄位賦值刻意保留；`createInitialPlayer()` 仍刻意保留初始欄位定義，作為唯一 default source。

#### Golden Character Creation Matrix

- Runtime 組合：`3 Origin × 5 Ideal Self = 15` 組。
- 每組皆比較 Phase 2 Boundary 流程與 Phase 2 前創角 orchestration 的：
  - `name`
  - `origin`
  - `idealSelf`
  - `aspirationState`
  - 核心 stats
  - personality
  - flags
  - relationships
  - chapter／day／phase
  - 各章 step
  - current event ID
- 結果：`15／15` 完全一致。

#### Save、Legacy 與相容性結果

- Save → Load whole Snapshot round-trip：一致。
- Identity `name`、`origin`、`idealSelf`：完整保留。
- 舊存檔 fixture 缺少 `origin`／`idealSelf` 時：
  - 沿用 `normalizeSave()` 的既有 default merge。
  - `origin` 回復為 `prove`。
  - `idealSelf` 回復為空字串，UI 顯示「理想球員：尚未形成」。
- `ApplicationController.startGame()` 仍只委派 `createPlayer()`；public API 未改。
- Legacy `createPlayer()` 與 Controller entry 的 Golden Snapshot 一致。

#### 測試結果

- JavaScript 語法檢查：`30／30` 通過。
- `tests/player-data-boundary-test.js`：
  - `93` 項 contract／Source Guard／相容驗證通過。
  - Golden Character Creation Matrix：`15／15`。
- `tests/application-controller-test.js`：通過；Phase 1 Golden Flow 不變。
- 全專案測試：`19／19` 通過。
- 瀏覽器人工測試：
  - 空姓名與未選 Ideal Self 的既有提示不變。
  - Origin UI 既有設計預設選中 `prove`，因此沒有可由正常 UI 形成的「未選 Origin」狀態；確認預設 Origin 行為不變。
  - 三種 Origin、五種 Ideal Self、正常創角、第一個選項、Save／Reload／Load、Delete 與 Debug bookmark 正常。
  - Browser Console：`0` 個 error。

#### 已知限制

- `getSnapshot()` 與 `restoreSnapshot()` 使用 JSON 深層複製，只支援目前既有的 JSON-serializable Player Snapshot。現行 Snapshot 全部符合；未來若加入函式、Date、Map、Set 或循環 reference，必須更換 clone 策略。
- `restoreSnapshot()` 尚未接入 `loadGame()`；Save migration 仍由既有 `normalizeSave()` 負責，這是刻意的 Phase 2 相容決策。
- `PlayerDataBoundary` 只收回創角 Identity。其他 Player 欄位仍存在 legacy direct writes。
- `index.html` 的 Origin 預設為 `prove`，沒有「未選 Origin」的既有錯誤提示可維持或人工觸發。本 Phase 不改 UI 規格。

#### Deferred Items

- `route`、`roleIdentity` 與 Career Identity 的 owner。
- Save restore 是否在未來經 `PlayerDataBoundary.restoreSnapshot()` 統一 replacement。
- Debug bookmark 與既有 tests 的直接 Player replacement。
- stats、body、Current State、relationship、time、match 與 Career 的 owner-only write。
- 動態 Decision handler、`choose()`、render side effects 與 Phase 3 以後範圍。

#### 回退方式

1. 將 `createPlayer()` 恢復為 `createInitialPlayer(name)` 與兩個 Identity direct writes。
2. 將 Ideal Self／Origin 表的 computed keys 恢復為原 literal keys。
3. 移除 `PlayerIdentityOptions`、`PlayerDataBoundary` 與 `window.player` 相容 accessor。
4. 移除 `tests/player-data-boundary-test.js` 與本 Phase 2 紀錄。

因本 Phase 未修改 Snapshot shape、`SAVE_VERSION`、`SAVE_KEY`、`normalizeSave()`、事件、數值或效果，回退不需要 Save migration。

#### 是否建議進入 Phase 3

工程閘門已通過，可以規劃 Phase 3；但不應自動開始。進入前應先由人工實測確認創角、第一個事件與存讀檔手感沒有非預期差異，再以獨立任務處理 Current State Boundary。

### Phase 3：Current State Ownership Boundary

**Status：Completed**

#### 新增與修改檔案

- 新增 `current-state-boundary.js`
  - 建立獨立於 Player Identity 的 `window.CurrentStateBoundary`。
  - 建立 Current State Snapshot、最小 State Change Request、原子驗證、有限套用與還原 API。
- 修改 `script.js`
  - `showStory()` 原本的 `player.lastEventTitle = event.title` 改經 `CurrentStateBoundary.applyStateChangeRequest()`。
  - 寫入仍位於原 render 流程中的相同位置與順序；本 Phase 沒有藉此修正 render side effect。
- 修改 `index.html`
  - 載入順序改為 `player.js` → `current-state-boundary.js` → NPC／story／save／script → `application-controller.js`。
- 修改全部 VM test harness
  - 所有會載入 `script.js` 的測試都在 `player.js` 後載入 `current-state-boundary.js`。
- 新增 `tests/current-state-boundary-test.js`
  - 提供 83 項 Boundary、原子性、隔離性、Source Guard、Golden Flow、Save/Load 與 debug 相容驗證。

#### Current State 欄位盤點與分類

1. **Persistent Current State**
   - `chapter`：目前人生／章節位置。
   - `completed`：目前垂直切片是否完成。
   - `lastEventTitle`：最近正式呈現的事件標題。
2. **Runtime-only UI State**
   - `isTransitioning`：`script.js` lexical runtime lock，只避免 420ms 內重複操作；不在 `player`、不寫入 Save，也不屬於 Current State Snapshot。
3. **Narrative Progress State**
   - 本 Phase 只批准 `chapter2Step` 為最小可寫 progress field，用來驗證單一章節進度定位 API。
   - `seasonStep`、`competitionStep`、`juniorStep`、`juniorSeasonStep`、`highSchoolStep`、`criticalYearStep`、`transitionStep`、`developmentStep` 仍由 legacy progression 寫入，未宣告 Boundary ownership。
   - `forcedEventId` 是會暫時覆蓋路由的 **Transitional Dependency**；本 Phase 不將 flags、pending events 或全部 routing dependency 收進 Snapshot。
   - `chapter2Phase`、`chapter2Day` 是現有少棒入門相容／顯示資料，未列入批准的 progress write whitelist。
4. **Time State**
   - `day`、`phase`：同時構成目前事件位置，因此可由 Boundary Snapshot 讀取及以最小 Request 更新；時間推進 ownership 仍留待後續 Phase。
5. **不屬於 Current State**
   - Identity：`name`、`origin`、`idealSelf`。
   - 能力／人格：核心 stats、`baseballSkills`、`personality`。
   - 關係／印象：`relationships`、`impression`、`characterArc`。
   - 身體／傷病：`body`、`injury`、`injuryDays`。
   - 比賽：`matchState`、比賽紀錄與結果。
   - Career／財務／市場：`careerValue`、`roleIdentity`、`careerArc`、`finances` 等。
   - Narrative content：完整 `flags`、`memories`、callbacks、life events 等。
   - 這些欄位可能影響事件選擇或路由，但不是「現在位於哪裡」本身，不應因同在 `player` 而被納入 Current State。

`currentEventId` 是由 `story.js` 的既有 `getCurrentEventId()` 即時計算的衍生讀值。它會出現在 Snapshot 以便比對目前事件，但不是可寫欄位，也沒有建立第二份 event ID state。

#### CurrentStateBoundary Public Methods

- `getSnapshot()`
  - 回傳 `{ chapter, day, phase, completed, lastEventTitle, progressPosition, currentEventId }` 的 JSON 深層複製。
  - 不暴露 mutable `player` reference。
- `getProgressPosition()`
  - 本 Phase 只回傳 `{ chapter2Step }`。
- `getCurrentEventId()`
  - 委派既有唯讀 `getCurrentEventId()`；沒有新路由規則。
- `isCompleted()`
  - 只讀判斷 `player.completed === true`。
- `validateStateChangeRequest(request)`
  - 完整驗證後回傳 Result，不修改資料。
- `applyStateChangeRequest(request)`
  - 驗證全部通過後才套用白名單絕對值，回傳 `{ ok: true, state }`。
  - 無效時回傳 `{ ok: false, error }`，不留下部分寫入。
- `restoreCurrentState(snapshot)`
  - 將合法 Current State Snapshot 轉為內部 Request 還原。
  - `currentEventId` 僅為衍生值，不回寫。

#### State Change Request 最小格式

```js
{
  source: "legacy",
  changes: {
    chapter: "少棒入門",
    day: 1,
    phase: "morning",
    completed: false,
    lastEventTitle: "少棒隊的第一天",
    progressPosition: {
      chapter2Step: 0
    }
  }
}
```

- `source` 必須是非空字串。
- `changes` 必須是非空物件且只能使用白名單欄位。
- `day` 必須是 `1` 到 `36500` 的整數。
- `chapter`、`phase` 必須是非空字串；`lastEventTitle` 必須是字串。
- `completed` 必須是 boolean。
- `progressPosition` 目前只批准 `chapter2Step`，且必須是 `0` 到 `10000` 的整數。
- Request、changes 或 progressPosition 中的 `__proto__`、`constructor`、`prototype` 都會被拒絕。

#### 本次實際接管的 Runtime Write Path

- 分類：Narrative Rendering。
- 路徑：`showCurrentEvent()` → `showStory(eventId)` → 更新最近事件標題。
- 修改前：`player.lastEventTitle = event.title`。
- 修改後：以 `{ source: "showStory", changes: { lastEventTitle: event.title } }` 呼叫 Boundary。
- 此欄位目前是 **Boundary-owned write**；`showStory()` 已有 Source Guard，不能再直接賦值。
- 原本的呼叫時點、事件內容解析、render、目標更新、比賽準備與後續呼叫順序均未改變。

#### 仍存在的 Legacy Direct Writes

- **Decision Resolution**
  - `choose()` 的完成選項仍直接寫 `completed` 與 `chapter`。
- **Chapter Transition / Evaluation**
  - `enterChapterTwo()` 至 `enterDevelopmentYears()` 與各章結算函式仍直接寫 `chapter`、`phase` 及對應 step。
- **Time Advance**
  - `advanceAfterAction()`、`advanceFromNight()` 仍直接推進 step、`day`、`phase`。
- **Save Restore**
  - `loadGame()` 仍使用 `player = normalizeSave(...)`；沒有繞過既有 migration。
- **Debug Bookmark**
  - `loadTestBookmark()` 仍以 `Object.assign(player, ...)` 設定測試位置。
- **Reset / Character Creation**
  - `createInitialPlayer()`、reset 與 Player Boundary 仍可建立或替換完整 Snapshot。
- **Test Setup**
  - 現有 VM tests 仍可直接建立 fixture。

上述均為 Legacy compatibility write、Save restore write、Debug/test write 或 Deferred violation；Phase 3 沒有宣稱 Current State 已完全封裝。

#### Save / Load 相容性

- `SAVE_KEY`、`SAVE_VERSION`、`normalizeSave()`、Snapshot schema 與舊存檔 migration：完全未修改。
- `restoreCurrentState()` 已建立並測試，但沒有接管 `loadGame()`。
- 實測與 VM 測試皆確認：先儲存 Current State、再推進、再讀取後，chapter、day、phase、completed、lastEventTitle、chapter2Step 與衍生 current event ID 都回到儲存時狀態。

#### Golden Flow 結果

流程：

```text
創角
→ 顯示 day1_morning
→ 選擇第一個選項
→ 顯示 day1_afternoon
```

基準版本只把現行 `showStory()` 的 Boundary 呼叫還原為舊 `player.lastEventTitle = event.title`；其他程式完全相同。比較結果：

- `chapter`、`day`、`phase`
- 九個現行章節 step
- `completed`
- `lastEventTitle`
- current event ID
- flags
- stats
- relationships
- time
- render 次數
- transition 次數

全部一致。修改後流程為 `2` 次 render、`1` 次 progression transition、`1` 次既有 timeout；沒有雙重 step、chapter、time 或 render 更新。

#### 測試結果

- JavaScript 語法檢查：全部通過。
- `tests/current-state-boundary-test.js`：`83` 項驗證通過。
- `tests/application-controller-test.js`：通過，Phase 1 public API 與 Golden Flow 不變。
- `tests/player-data-boundary-test.js`：`93` 項通過，Phase 2 Identity Boundary 與 15 組創角矩陣不變。
- 全專案測試：`20／20` 通過。
- Source Guard：
  - Boundary 不含 DOM、LocalStorage、render、save、time advance、decision、stats、relationships、body、matchState 操作。
  - `showStory()` 不再直接寫 `player.lastEventTitle`。
- 瀏覽器人工測試：
  - 創角與 Ideal Self：正常。
  - 第一事件：`day1_morning` 正常顯示。
  - 第一個選項後：正常進入第 1 天下午。
  - 日期與章節顯示：正常。
  - 儲存後再選一次、讀取：回到儲存時第 1 天下午，故事與玩家資訊一致。
  - 少棒入門 debug bookmark：正常。
  - 刪除存檔：創角區恢復、故事與選項清空。
  - Browser Console：`0` 個 JavaScript error。
- `/favicon.ico`：仍回傳 `404`，是既有非功能性資源缺失；本 Phase 依限制未處理，也不列為 JavaScript error。

#### 已知限制與 Deferred Items

- 只有 `lastEventTitle` 的真實 runtime write 已接管；Boundary 是可驗證起點，不是完整 ownership 宣告。
- `chapter2Step` 只建立 API 與測試，既有 progression 尚未改經 Boundary。
- 其他章節 step、forced event、pending event、ending/result 路由仍由 legacy systems 共同決定。
- `day`／`phase` 雖可安全 request，正式 Time orchestration 尚未接管。
- Save restore 仍直接替換完整 `player`。
- Dynamic Decision handler、`choose()`、render side effects、Event System 與正式 orchestration 留待未來獨立 Phase。
- ApplicationController public API 本 Phase 未增加 `getCurrentState()`，因目前沒有 UI 或 Controller 測試需要；避免擴大 API。

#### 回退方式

1. 將 `showStory()` 的 Boundary request 恢復為 `player.lastEventTitle = event.title`。
2. 從 `index.html` 與所有 VM harness 移除 `current-state-boundary.js` 載入。
3. 移除 `current-state-boundary.js` 與 `tests/current-state-boundary-test.js`。
4. 移除本 Phase 3 紀錄。

本 Phase 沒有改 Snapshot schema、Save key/version、事件、數值、選項或路由，因此回退不需要 Save migration。

#### 是否建議進入 Phase 4

工程閘門已通過，可以規劃 Phase 4，但不應自動開始。Phase 4 應以獨立任務明確定義 Decision／Event Request orchestration；在此之前保留現有 legacy direct writes，避免把 Current State Boundary 誤當成已完成的全面封裝。

### Phase 4：Decision / Event Request Flow

**Status：Completed**

#### 新增與修改檔案

- 新增 `decision-flow.js`
  - 建立最小 `window.DecisionFlow`。
  - 只負責一條已批准的 `chapter2Step` Decision 子流程。
  - 不持有 `player`、不操作 DOM、不 render、不推進時間、不存檔。
- 修改 `script.js`
  - `choose()` 只在 `chapter2_intro` 選項索引 `0` 建立 Decision Context。
  - `advanceAfterAction()` 在原本少棒入門 step 更新位置，將該選項的 `chapter2Step` 寫入改經 Decision Result、State Change Request 與 `CurrentStateBoundary`。
  - 同事件其他選項與其他章節仍保留原本 legacy progression writes。
- 修改 `index.html`
  - 載入順序加入 `player.js → current-state-boundary.js → decision-flow.js → … → script.js → application-controller.js`。
- 修改既有 VM test harness
  - 在 `script.js` 之前載入 `decision-flow.js`，維持瀏覽器實際依賴順序。
- 新增 `tests/decision-flow-test.js`
  - 驗證 Decision Context／Result／Request、隔離性、Golden Flow、Save／Load、Debug bookmark、Source Guard 與 Controller 相容性。
- 更新 `tests/current-state-boundary-test.js`
  - 驗證 `decision-flow.js` 的載入位置及 Phase 3 與 Phase 4 元件可同時運作。

#### Decision Execution Order Inventory

以下為目前 `choose(eventId, index)` 的實際執行順序，不是依 Architecture 推測：

1. **transition lock**：`choose()` 先以 `isTransitioning` 阻擋重複輸入（`script.js:1073-1074`）。
2. **event lookup**：呼叫 `getEvent(eventId)`（`script.js:1075`）。
3. **choice lookup**：讀取 `event?.choices?.[index]` 並拒絕不存在的選項（`script.js:1076-1077`）。
4. **choice effects**：一般選項先執行 `applyConsequenceAtEvent()`、`applyEffects()`，再處理各類 effect helper（`script.js:1111-1130`）。
5. **random result**：`choose()` 本身沒有通用亂數步驟；本次接管的 `chapter2_intro:0` 也沒有隨機性。若事件 helper 內含特定機率，仍屬 legacy event logic，本 Phase 不改動。
6. **stat update**：`applyEffects()`、`applySkillEffects()`、`applyPositionSkillEffects()`、`applyAcademicEffects()`、`applyCareerEffects()`、`applyFinanceEffects()` 與 `applyMatchEffects()`（`script.js:1112`, `1116`, `1122`, `1126-1130`）。
7. **personality update**：`addPersonalityEffects()`（`script.js:1113`）。
8. **relationship update**：`addImpressionEffects()`、`applyCharacterArcEffects()`、`applyNestedEffects("relationships", …)` 與後段 relationship processors（`script.js:1114-1115`, `1123`, `1144-1149`）。
9. **flag update**：`addFlags()`、callback unlock／resolve、consequence 與 life theme（`script.js:1117-1119`, `1131-1136`）。
10. **memory update**：若 choice 有 memory，寫入並保留最後 20 筆（`script.js:1139-1142`）；其他 life／emotional processors 仍由 legacy flow 執行。
11. **chapter / step update**：先處理 early chapter routes；一般路徑最後呼叫 `finishChapterOne()` 或 `advanceAfterAction()`（`script.js:1085-1105`, `1175-1176`）。本次接管的 `chapter2Step` 位於 `advanceAfterAction()` 原位置（`script.js:2504-2525`）。
12. **day / phase update**：第一章一般行動由 `advanceAfterAction()` 改 phase，夜晚由 `advanceFromNight()` 改 day／phase（`script.js:2528-2535`）；少棒入門目標路徑不改 day／phase。
13. **event routing**：step／phase 更新後，由延遲 callback 中的 `showCurrentEvent()` 再呼叫 `getCurrentEventId()` 決定下一事件；forced event 特例保留原路徑（`script.js:1155-1173`, `1179-1181`）。
14. **render**：選擇效果先以 `showStatChanges()` 顯示差異，下一事件由 `showCurrentEvent()`／`showStory()` render（`script.js:1153`, `1179-1181`）。
15. **save 或 autosave**：`choose()` 沒有呼叫 `saveGame()`，目前沒有選項後 autosave。
16. **setTimeout / transition**：一般路徑以 `window.setTimeout(..., 420)` 解鎖並 render 下一事件；先發競爭、pending resume 與高橋分鏡保留各自原有 transition 分支（`script.js:1155-1173`, `1179-1181`）。

#### DecisionFlow Public Methods

- `createDecisionContext(eventId, choiceIndex)`
  - 建立只含事件識別資訊的不可變 Context。
- `validateDecisionContext(context)`
  - 驗證 event ID、choice index、事件與選項存在性、允許欄位及 prototype pollution／循環資料。
- `createDecisionResult(context, legacyOutcome)`
  - 只接受本 Phase 核准路徑及 `{ chapter2Step }` legacy outcome。
- `createStateChangeRequest(decisionResult)`
  - 將已驗證 Result 轉成 `CurrentStateBoundary` 可接受的 Request。
- `applyDecisionStateChange(decisionResult)`
  - 僅驗證／轉換，再委派 `CurrentStateBoundary.applyStateChangeRequest()`；不做其他 gameplay 工作。

#### Decision Context 格式

```js
{
  eventId: "chapter2_intro",
  choiceIndex: 0
}
```

- 不包含 `event`、`choice` 或 mutable `player` reference。
- 建立後以 frozen clone 回傳。
- 驗證失敗回傳 `{ ok: false, error }`，不修改遊戲狀態。

#### Decision Result 格式

```js
{
  source: {
    type: "decision",
    eventId: "chapter2_intro",
    choiceIndex: 0
  },
  currentStateEffects: {
    progressPosition: {
      chapter2Step: 1
    }
  }
}
```

- 只允許 `source` 與 `currentStateEffects`。
- 只允許已批准的 `progressPosition.chapter2Step`。
- 不納入 stats、personality、relationships、flags、memories、body、injury、match、career 或 Save 資料。

#### State Change Request 格式

```js
{
  source: "decision:chapter2_intro:0",
  changes: {
    progressPosition: {
      chapter2Step: 1
    }
  }
}
```

Request 由 `createStateChangeRequest()` 產生，最後只有 `CurrentStateBoundary.applyStateChangeRequest()` 可以套用。

#### 本次接管的 Runtime Path

- **Event：** `chapter2_intro`
- **Choice：** 索引 `0`，既有文字「認真照基本動作做」
- **欄位：** `chapter2Step`
- **選擇理由：**
  - 沒有隨機結果。
  - 不依賴 stats、relationships 或多層 flags。
  - 不跨章、不結算、不修改 day／phase。
  - 原值 `0` 固定更新為 `1`，下一事件固定為 `chapter2_day1_training`。

#### 修改前與修改後的資料流

修改前：

```text
choose("chapter2_intro", 0)
→ advanceAfterAction()
→ player.chapter2Step = nextChapter2Step
→ 更新 chapter2Phase / chapter2Day
→ 原 setTimeout
→ showCurrentEvent()
```

修改後：

```text
choose("chapter2_intro", 0)
→ DecisionFlow.createDecisionContext()
→ 原 choice effects 與 processors
→ advanceAfterAction(context)
→ legacyOutcome { chapter2Step: nextChapter2Step }
→ DecisionFlow.createDecisionResult()
→ DecisionFlow.createStateChangeRequest()
→ CurrentStateBoundary.applyStateChangeRequest()
→ 更新既有衍生 chapter2Phase / chapter2Day
→ 原 setTimeout
→ showCurrentEvent()
```

Decision Result 沒有更動原本執行位置、效果順序、路由、render 或 transition 時機。

#### 仍保留的 Legacy Decision Writes

- `chapter2_intro` 索引 `1`、`2` 與少棒入門後續選項的 `chapter2Step` 仍由 `advanceAfterAction()` 直接寫入。
- `completed`、`chapter`、其他章節 step、`day`、`phase`、`forcedEventId` 仍保留現有寫法。
- stats、skills、personality、relationships、impressions、character arc、flags、memories、body、match、career、callbacks、consequences 與 narrative processors 仍由 legacy `choose()` orchestration 處理。
- `enterChapterTwo()` 的初始 `chapter2Step = 0` 是章節入口初始化，不是本次接管的 Decision write。
- `showStory()` 的 `lastEventTitle` 仍維持 Phase 3 Boundary flow，未重複放入 Decision Result。
- `ApplicationController.submitDecision()` 與動態 Decision handler 仍委派 `choose()`。

#### Golden Decision Flow

固定案例：

```text
Debug bookmark「少棒入門」
→ chapter2_intro
→ 選項索引 0
→ chapter2_day1_training
```

測試會由目前 `script.js` 產生移除 Phase 4 adapter 的修改前 baseline，再與實際 Phase 4 runtime 比較。以下完全一致：

- eventId 與 choiceIndex
- chapter、day、phase
- 全部 chapter／season／competition／junior／high school／transition／development steps
- completed、lastEventTitle、currentEventId
- 完整 player Snapshot，包括 stats、personality、flags、memories、relationships、body、injury、matchState 與 career 資料
- story、choices、change log、status 與 player info render
- render 次數、transition 次數及 timeout 次數

結果確認：`chapter2Step` 只由 `0` 更新為 `1` 一次，沒有跳過 `chapter2_day1_training`，沒有額外 render 或額外 timeout。

#### Save / Load 與 Debug 結果

- 在目標 Decision 後存檔、繼續下一個選項再讀檔，可回到 `chapter2Step = 1` 與 `chapter2_day1_training`。
- `SAVE_KEY`、`SAVE_VERSION`、Snapshot schema、`normalizeSave()` 均未修改。
- 「少棒入門」Debug bookmark 仍正確進入 `chapter2_intro`，目標 Decision 後正常前往下一事件。

#### 測試結果

- JavaScript 語法檢查：通過。
- `tests/decision-flow-test.js`：`86` 項驗證通過。
- Golden Decision Flow：完全一致。
- Phase 1 `tests/application-controller-test.js`：通過。
- Phase 2 `tests/player-data-boundary-test.js`：`93` 項與 `15／15` 創角矩陣通過。
- Phase 3 `tests/current-state-boundary-test.js`：`83` 項通過。
- `tests/vertical-slice-smoke.js`：通過。
- 全專案既有測試：通過。
- 瀏覽器人工流程：創角、第一事件、目標 Decision、下一事件、Save／Load、Debug bookmark、刪除存檔均正常。
- Browser Console：沒有新增 JavaScript error。
- `/favicon.ico` 仍為 `404`；依本 Phase 限制只獨立記錄，未處理。

#### 已知限制

- DecisionFlow 目前故意只接受一個 event／choice／field，不是 production-ready 通用 Decision System。
- `validateDecisionContext()` 仍透過既有全域 `getEvent()` 查詢事件；Event ownership 尚未拆分。
- Result schema 尚未涵蓋多 System effects，也沒有取代 legacy choice payload。
- `advanceAfterAction()` 仍是 progression orchestration owner，並仍直接更新大量其他 step。
- `choose()`、`showStory()` 與 `updateStatus()` 的既有跨系統 side effects 未處理。
- 同一 Result 重複呼叫 Boundary 會寫入相同 step 值；真實 runtime 由 transition lock 與單一路徑確保只呼叫一次，本 Phase 未新增全域 Decision ID／去重儲存。

#### Deferred Items

- 將更多單純 Current State 寫入逐條轉為 Result／Request。
- 定義可跨多 System 的 typed Decision Result，但須由各 owner 分別套用。
- 將 Event lookup 改為明確 Context provider。
- 從 `choose()` 分離 Decision resolution、progression、time 與 render orchestration。
- 建立正式 Decision ID、重送與冪等策略。
- 處理其他 progression fields、`completed`、`day`、`phase`、forced/pending event 的 ownership。
- 由後續獨立 Phase 處理 Save orchestration、dynamic handler 與 Application Controller 的更完整路由。

#### 回退方式

1. 移除 `script.js` 中目標路徑的 Decision Context 建立。
2. 將 `advanceAfterAction(decisionContext)` 還原為 `advanceAfterAction()`。
3. 將少棒入門 branch 還原為單一 `player.chapter2Step = nextChapter2Step`。
4. 從 `index.html` 與 test harness 移除 `decision-flow.js` 載入。
5. 刪除 `decision-flow.js`、`tests/decision-flow-test.js` 與本 Phase 4 紀錄。

此回退不需要修改事件資料、Save schema、能力平衡或 Phase 1～3 元件。

#### 是否建議進入 Phase 5

工程閘門已通過，可以規劃 Phase 5，但不應自動開始。建議先人工確認少棒入門目標選項的手感、存讀檔及 Debug bookmark 都與修改前一致，再以獨立任務明確定義 Phase 5 範圍；目前仍保留大量 legacy Decision writes，不應把 Phase 4 解讀為完整 Decision System 已完成。

### Phase 5：Time / Save Day Completion Flow

**Status：Completed**

#### 新增與修改檔案

- 新增 `time-boundary.js`：Time Snapshot、Time Advance Request 驗證與 Current State 委派。
- 新增 `day-completion-flow.js`：固定夜晚選擇的 Day Completion Context 與完成流程。
- 新增 `tests/time-boundary-test.js`、`tests/day-completion-flow-test.js`。
- 修改 `index.html:104-115`：依序載入 `player.js`、`current-state-boundary.js`、`time-boundary.js`、`day-completion-flow.js`、`decision-flow.js`，最後才載入既有 runtime 與 `application-controller.js`。
- 修改 `script.js:1102-1125`：只接管第一章第 1 天晚上 `night:0`；其他 sleep 路徑仍走 legacy。
- 修改既有 test harness 的 runtime 載入清單，使 Phase 1～4 與全專案回歸均使用正式載入順序。
- 未修改 `time.js`、Save schema、`saveGame()`、`loadGame()`、事件資料、選項文字或 gameplay effects。

#### Time and Day Completion Inventory

1. **`player.day` 的 runtime writes**
   - 初始值由 `createInitialPlayer()` 建立為 `1`（`player.js:10-19`）。
   - 正式舊夜晚推進由 `advanceFromNight()` 執行 `player.day += 1`（`script.js:2551-2553`）。
   - Phase 5 目標路徑由 `TimeBoundary.applyTimeAdvanceRequest()` 轉交 `CurrentStateBoundary.applyStateChangeRequest()`；實際欄位套用集中在 `current-state-boundary.js:186-210`。
   - Debug bookmark 會先建立 fresh player，再於 `loadTestBookmark()` 的 bookmark setup 中直接 `Object.assign()` day／phase（`script.js:164-373`）；這是明示的測試狀態注入。
   - Load 會用 `player = normalizeSave(...)` 還原完整 Snapshot（`save.js:75-81`）。
   - 未載入的 legacy `time.js` 另有 `player.day = 1`（`time.js:7`），不屬於現行 runtime。
2. **`player.phase` 的 runtime writes**
   - 初始值為 `morning`（`player.js:19`）。
   - `enterChapterTwo()`、`enterYouthSeason()` 會初始化為 `morning`（`script.js:1204-1228`）。
   - `advanceAfterAction()` 仍處理 `morning → afternoon → night`（`script.js:2482-2548`）。
   - legacy `advanceFromNight()` 仍處理 `night → morning`（`script.js:2551-2553`）。
   - `finishChapterOne()` 會設為 `ending`（`script.js:2556-2558`）。
   - Phase 5 目標路徑與 Save／Load、Debug bookmark 的寫入方式同上。
3. **`advanceFromNight()` caller**
   - 現行正式 caller 只有 `choose()` 的非目標 sleep fallback（`script.js:1120-1122`）。
   - Phase 5 前，`choice.sleep` 一律直接呼叫此函式；Phase 5 後，只有第 1 天 `night:0` 不再直接呼叫。
4. **`choice.sleep` 實際路徑**
   - 唯一正式 sleep choice 由 `getNightEvent()` 動態建立，索引 `0`、文字「睡覺，進入明天」（`story.js:1376-1390`）。
   - `choose()` 在一般 effects、transition lock 與 timeout 前先處理 sleep，完成後立即 render 並 return（`script.js:1102-1125`）。
5. **夜晚後 render**
   - `showCurrentEvent()` 保留在同一個 sleep branch、時間推進之後呼叫（`script.js:1123`）；沒有新增 render 或 timeout。
6. **結束一天時的額外 gameplay writes**
   - 目標 sleep branch 在 `applyEffects()`、personality、impression、skills、relationship、body、flags、memories 與其他 processors 之前 return，因此不額外改 stats、fatigue、body、relationship、flags 或 memories。
7. **Save 行為**
   - Day completion path 沒有呼叫 `saveGame()`；正式 UI 仍由玩家手動儲存。
   - `saveGame()` 只把完整 player 寫入既有 `SAVE_KEY`（`save.js:1-5`）。
8. **`time.js`**
   - `index.html` 沒有載入它；其 `nextDay()` 使用已淘汰的 `day/month/year/age` 月曆 schema、30 日月份與 `alert()`，不符合現行 `chapter/day/phase` 事件路由，因此仍維持 inactive legacy。
9. **Debug bookmark 與測試**
   - `loadTestBookmark()` 直接建立已知狀態以快速進入章節（`script.js:164-373`）。
   - 單元與 Golden tests 也會直接設定 day／phase，這些屬於隔離 fixture，不是玩家 runtime path。
10. **Save → Load**
   - Save 儲存完整 player；Load 經 `normalizeSave()` 後整體還原，再呼叫 `showCurrentEvent()`（`save.js:3-81`），因此 day／phase 會以存檔 Snapshot 為準。

#### TimeBoundary Public Methods

- `getSnapshot()`（`time-boundary.js:34`）：只回傳 clone 後的 `{ day, phase }`。
- `isNight()`（`time-boundary.js:41`）。
- `canAdvanceToNextDay()`（`time-boundary.js:45`）。
- `validateTimeAdvanceRequest(request)`（`time-boundary.js:72`）。
- `createNextDayRequest(source)`（`time-boundary.js:151`）。
- `applyTimeAdvanceRequest(request)`（`time-boundary.js:170`）：只驗證、轉換並委派 `CurrentStateBoundary.applyStateChangeRequest()`。

驗證拒絕非安全物件、空 source、錯誤 operation、非法 day／phase、不連續 next day、expected 與目前狀態不一致、未知欄位、prototype pollution key 與循環資料；失敗時不套用狀態。

#### DayCompletionFlow Public Methods

- `createDayCompletionContext(eventId, choiceIndex)`（`day-completion-flow.js:100`）。
- `validateDayCompletionContext(context)`（`day-completion-flow.js:35`）。
- `createTimeAdvanceRequest(context)`（`day-completion-flow.js:110`）。
- `createStableDayCompletionSnapshot()`（`day-completion-flow.js:119`）。
- `completeDay(context)`（`day-completion-flow.js:123`）。

DayCompletionFlow 不 render、不存檔、不操作 DOM、不執行 choice effects，也不直接寫 player。

#### Time Advance Request

```js
{
  source: "night-decision:night:0",
  operation: "advance-to-next-day",
  expected: {
    day: 1,
    phase: "night"
  },
  next: {
    day: 2,
    phase: "morning"
  }
}
```

#### 本次接管的 Event／Choice

- **Event：** 動態 `night`
- **Choice：** 索引 `0`，既有文字「睡覺，進入明天」
- **實際接管條件：** 第一章第 `1` 天、`phase === "night"`
- **選擇理由：**
  - 固定存在且無亂數。
  - 不跨章、不結算。
  - 沒有 choice effects 或 gameplay writes。
  - 下一事件固定為 `day2_morning`「球場、電視或公園」。
  - 可建立完全可比較的 Golden Flow。

#### 修改前與修改後資料流

修改前：

```text
choose("night", 0)
→ advanceFromNight()
→ player.day += 1
→ player.phase = "morning"
→ showCurrentEvent()
→ return
```

修改後：

```text
choose("night", 0)
→ DayCompletionFlow.createDayCompletionContext()
→ DayCompletionFlow.completeDay()
→ TimeBoundary.createNextDayRequest()
→ TimeBoundary.applyTimeAdvanceRequest()
→ CurrentStateBoundary.applyStateChangeRequest()
→ Stable Next-Day State
→ showCurrentEvent()
→ return
```

原本的 render 位置、立即 return、沒有 transition timeout、沒有 choice effects 與沒有 autosave 的行為均維持不變。

#### Autosave、Stable Snapshot 與手動 Save／Load

- **Autosave：** 未新增；Day Completion 前後 localStorage write 次數皆為 `0`。
- **Stable Snapshot：** `completeDay()` 套用 Current State 後才建立，結果固定為 `day N+1 / morning`，不是舊的 `day N / night`。
- **手動 Save／Load：** 完成第 1 天後儲存第 2 天上午，繼續到第 2 天下午再讀取，可正確回到第 2 天上午與 `day2_morning`。
- `SAVE_KEY`、`SAVE_VERSION`、Save schema 與 `normalizeSave()` 均未修改。

#### 仍保留的 Legacy Time Writes

- `advanceAfterAction()` 的 `morning → afternoon → night`。
- 第 2～6 天的 `night → next morning` 仍由 `advanceFromNight()` 直接寫入。
- 章節入口的 `phase = "morning"` 與第一章結束的 `phase = "ending"`。
- Debug bookmark／test fixture 的直接狀態注入。
- Save／Load 的完整 player Snapshot 還原。
- 未載入 `time.js` 內的舊寫入未移除，因為本 Phase 禁止修改該檔。

#### Golden Day Completion Flow

固定流程：

```text
第 1 天晚上「第 1 天晚上」
→ 選項 0「睡覺，進入明天」
→ 第 2 天上午「球場、電視或公園」
```

測試以目前 `script.js` 產生還原舊 sleep branch 的 baseline，與 Phase 5 runtime 比較。以下完全一致：

- eventId、choiceIndex、day、phase、chapter
- 全部相關 chapter／season／competition／junior／high school／transition／development steps
- completed、lastEventTitle、currentEventId
- stats、personality、flags、memories、relationships、body、matchState
- story、choices、status、player info、change log
- render、transition、timeout 與 localStorage write 次數

結果：day 只增加 `1`、phase 為 `morning`、沒有跳過早晨事件、沒有多 render、沒有 timeout、沒有 autosave、沒有額外 effects。

#### 測試結果

- JavaScript 語法檢查：`38／38` 通過。
- `tests/time-boundary-test.js`：`54` 項驗證通過。
- `tests/day-completion-flow-test.js`：`58` 項驗證通過。
- Phase 1 `tests/application-controller-test.js`：通過。
- Phase 2 `tests/player-data-boundary-test.js`：`93` 項與 `15／15` Golden Character Creation Matrix 通過。
- Phase 3 `tests/current-state-boundary-test.js`：通過。
- Phase 4 `tests/decision-flow-test.js`：通過。
- `tests/vertical-slice-smoke.js`：通過。
- 全專案 `23／23` test scripts：通過。
- Source Guard：TimeBoundary 與 DayCompletionFlow 均通過。
- 瀏覽器人工流程：創角、第 1 天上午／下午／夜晚、次日早晨、手動 Save／Load、Debug bookmark、刪除存檔全部正常。
- Browser Console：`0` 個 JavaScript error。
- `/favicon.ico`：HTTP `404` 仍存在；依本 Phase 限制只記錄、不處理。

#### 已知限制

- Phase 5 故意只接管第一章第 1 天 `night:0`，不是完整 Time System。
- 同一個動態 `night:0` 在後續日仍由 legacy `advanceFromNight()` 處理。
- TimeBoundary 目前只有 next-day operation，沒有月曆、年齡、章節或跨日 effects。
- `advanceAfterAction()`、章節入口、章節結算、Debug fixture 與 Load 仍可直接影響 day／phase。
- Stable Snapshot 只證明可安全交給現有手動 Save，不代表已建立 Save orchestration。

#### Deferred Items

- 逐條接管其餘單純 night completion paths。
- 定義 Time 與章節 transition、pending/forced events 的清楚 ownership。
- 將 `advanceAfterAction()` 的 phase writes 納入獨立 Request flow。
- 在不改變玩家行為的前提下，建立 Save orchestration 邊界。
- 評估 legacy `time.js` 的刪除或正式替代方式；不得直接重新啟用。
- 建立 Time Request 的冪等／重送策略。

#### 回退方式

1. 將 `script.js` 的目標 sleep branch 還原為 `advanceFromNight(); showCurrentEvent(); return;`。
2. 從 `index.html` 與 test harness 移除 `time-boundary.js`、`day-completion-flow.js`。
3. 刪除兩個 Boundary 檔案與兩個 Phase 5 tests。
4. 移除此 Phase 5 實作紀錄。

回退不需要修改事件資料、Save schema、能力平衡、Phase 1～4 元件或 legacy `time.js`。

#### 是否建議進入 Phase 6

Phase 5 工程閘門已通過，可以規劃 Phase 6，但不應自動開始。建議 Phase 6 仍採單一路徑、Golden Flow 與 Source Guard 的漸進方式；目前尚有多個 legacy time writes，不能把 Phase 5 解讀為完整 Time／Save ownership 已完成。

### Phase 6：Relationship Result Ownership Boundary

**Status：Completed**

#### 新增與修改檔案

- 新增 `relationship-boundary.js`：提供 Relationship Snapshot、單一 Relationship Change Request 驗證、原子套用與 Snapshot 還原。
- 新增 `relationship-flow.js`：將一條固定 Decision Context 轉成單一 Relationship Result，再轉成 Change Request 並委派 Boundary。
- 修改 `script.js`：只遷移 `youth_season_intro` 選項 `0` 的 `coachTrust +1`；同一事件其他選項與全專案其他 `relationshipEffects` 仍走 legacy `applyNestedEffects()`。
- 修改 `index.html` 與既有 test harness：正式載入順序改為 `player.js → current-state-boundary.js → time-boundary.js → relationship-boundary.js → decision-flow.js → day-completion-flow.js → relationship-flow.js → story.js / save.js / script.js → application-controller.js`。
- 新增 `tests/relationship-boundary-test.js`、`tests/relationship-flow-test.js`。
- 未修改 player relationship schema、事件文案、效果值、NPC 資料、Save key／version／normalize、Time flow、章節路由或能力平衡。

#### Relationship Ownership Inventory

1. **Persistent Relationship Data**
   - 現行唯一持久關係真值是 `player.relationships`（`player.js:120-125`）。
   - schema 為平面數字物件：`coachTrust`、`teammateBond`、`rivalRespect`、`rivalCompetition`，既有合法範圍為 `0～20`。
   - 正式事件以 choice 的 `relationshipEffects` 描述變化；legacy runtime 由 `applyNestedEffects("relationships", ...)` 套用並 clamp（`script.js:1342-1348`）。
   - `saveGame()` 儲存完整 player；`normalizeSave()` 以初始四欄和舊存檔 `saved.relationships` 合併（`save.js:3-13`）。
2. **Derived Relationship View**
   - `coach.trust`、`teammates[0].friendship`、`rival.relationship` 由 `syncNpcRelationships()` 依 `player.relationships` 投影（`script.js:602-605`），不是第二份正式 owner。
   - 右側正式 UI 顯示自然語言關係狀態；只有 debug mode 顯示四個原始值（`script.js:3369`）。
   - 位置競爭、角色評估、市場與情緒總結等函式是 relationship readers，不擁有寫入權（例如 `script.js:621-637`, `1412`, `1480`, `2658-2726`）。
3. **Narrative Relationship Flag**
   - 關係語意的 `player.flags`、`impression`、`characterArc`、`relationshipPayoffs` 是獨立敘事／印象／弧線／兌現資料，不等同四個 numeric relationship values。
   - Phase 6 Boundary 不會寫入或推導這些資料；它們仍由既有 choice processors 與 narrative processors 管理。
4. **Runtime-only Reaction State**
   - `changeLog` 的事件記憶文字、關係兌現提示、render 中產生的關係描述與 transition lock 是執行期反應，不屬於 Relationship Snapshot。
   - `syncNpcRelationships()` 產生的 legacy NPC mirrors 也是 projection；Phase 6 Boundary 不直接更新它們，由既有 orchestration 在 Boundary 成功後同步。
5. **不是 Relationship System**
   - NPC 名稱／職能／傳記、stats、skills、personality、body、injury、matchState、career、chapter、day、phase、flags、memories 與 DOM 都不是本 Boundary 的資料。
   - `coach.js`、`npc.js`、`rival.js` 的物件仍是相容 NPC 資料；本次沒有把它們重構成 Repository。

#### Runtime Writes、讀取者、Debug 與 Save

- 一般 choice 的 numeric relationship runtime writes 集中在 `applyNestedEffects()`；`trust_deficit` 仍只在 legacy teammateBond path 調整增量，Phase 6 目標不涉及此 consequence。
- Debug bookmark 會先建立 fresh player，再以 `Object.assign(player.relationships, ...)` 注入測試狀態（`script.js:310-358`）；這是明示 fixture，不屬於正常 Decision path。
- 多個評估器直接讀 `player.relationships`；本次保留所有 reader 與讀取時機。
- Save → Load 仍以完整 player Snapshot 還原，沒有新增 relationship 專用 localStorage、migration 或 load orchestration。
- `restoreRelationshipSnapshot()` 可供測試與未來邊界使用，但本次沒有接入 `loadGame()`，避免改動現有 Save schema 與流程。

#### RelationshipBoundary Public Methods

- `getSnapshot()`：回傳四欄 relationship 深拷貝，不暴露 mutable player reference。
- `getRelationship(targetId)`：只讀既有四個 target；未知 target 回傳 `null`。
- `hasRelationship(targetId)`：確認 target 同時在 whitelist 與現行 store 中。
- `validateRelationshipChangeRequest(request)`：檢查 exact keys、非空 source、既有 target、唯一 `add` operation、有限且在 `-20～20` 的 amount、expected current value、未知欄位、prototype pollution 與循環參照。
- `applyRelationshipChangeRequest(request)`：完整驗證後只寫一個 target，沿用 `0～20` clamp，回傳 previous／amount／next。
- `restoreRelationshipSnapshot(snapshot)`：先完整驗證四欄後才原子還原；錯誤 Snapshot 不會部分寫入。

Boundary 不處理 DOM、render、Save、localStorage、timeout、NPC 敘事反應，也不修改 identity、stats、personality、flags、memories、body、match、career、chapter、day 或 phase。

#### Relationship Change Request

```js
{
  source: "decision:youth_season_intro:0",
  targetId: "coachTrust",
  operation: "add",
  amount: 1,
  expected: {
    currentValue: 6
  }
}
```

目前 relationship schema 是平面四欄，因此 `targetId` 就是既有欄位 ID，不新增 `field` 或 NPC Repository 層。

#### RelationshipFlow Public Methods

- `createRelationshipContext(eventId, choiceIndex)`：只接受固定 `youth_season_intro:0`，回傳 `{ eventId, choiceIndex }` 的 frozen clone。
- `validateRelationshipContext(context)`：重新解析實際事件與選項，確認存在且只有固定 `coachTrust +1`。
- `createRelationshipResult(context, legacyOutcome)`：將原本 choice 的確定結果轉為一項 approved relationship change。
- `createRelationshipChangeRequest(result)`：加入目前 expected value，建立 Boundary Request。
- `applyRelationshipResult(result)`：只委派 `RelationshipBoundary.applyRelationshipChangeRequest()` 一次。

#### Relationship Result

```js
{
  source: {
    type: "decision",
    eventId: "youth_season_intro",
    choiceIndex: 0
  },
  relationshipChanges: [
    {
      targetId: "coachTrust",
      operation: "add",
      amount: 1
    }
  ]
}
```

Result 只能包含一項 numeric relationship change，不包含 stats、personality、flags、memories、current state、time、body、injury、match、career 或 narrative reaction。

#### 遷移事件與選擇

- **Event：** `youth_season_intro`
- **Choice index：** `0`
- **Choice：** 「點頭接受球隊安排」
- **固定 relationship effect：** `coachTrust +1`
- **選擇理由：**
  - 單一 numeric target。
  - 沒有 random result。
  - 不觸發新的 NPC、Coach、Organization 或 Narrative 系統。
  - 不改章節、day、phase 或路由。
  - 原本同時存在的 resilience／discipline、flag、memory 與正常 `seasonStep` 推進可完整保留。
- 同一事件選項 `1～2` 與其他所有事件仍走 legacy relationship path；選項 `3` 沒有 relationship effect。

#### 修改前後 Runtime Path

修改前：

```text
choose("youth_season_intro", 0)
→ choice processors
→ applyNestedEffects("relationships", { coachTrust: 1 })
→ player.relationships.coachTrust clamp
→ syncNpcRelationships()
→ flags / memory / narrative processors
→ advanceAfterAction()
→ showCurrentEvent()
```

修改後：

```text
choose("youth_season_intro", 0)
→ RelationshipFlow.createRelationshipContext()
→ choice processors
→ RelationshipFlow.createRelationshipResult()
→ RelationshipFlow.createRelationshipChangeRequest()
→ RelationshipBoundary.applyRelationshipChangeRequest()
→ syncNpcRelationships()（legacy projection compatibility）
→ flags / memory / narrative processors
→ advanceAfterAction()
→ showCurrentEvent()
```

Relationship change 仍位於原先 `applyNestedEffects("relationships", ...)` 的順序位置；effect message、NPC mirror 更新、後續 processor、render 與 transition 節奏不變。遷移分支不再直接寫 `player.relationships`，也不呼叫 legacy relationship processor。

#### Golden Relationship Flow

測試 fixture 將少棒第一季開場的 `coachTrust` 設為 `6`，選擇 `youth_season_intro:0`。以還原 legacy relationship branch 的 baseline 與 Phase 6 runtime 比較，下列項目完全一致：

- eventId、choiceIndex、targetId、previous value `6`、amount `+1`、next value `7`
- 完整 relationships Snapshot
- chapter、day、phase、seasonStep、currentEventId
- stats、skills、personality、flags、memories、body、matchState
- story、choices、changeLog effect message
- render、transition、timeout 與 localStorage write 次數
- 下一事件均為 `youth_position_trial`

RelationshipBoundary 只收到一個 Request，關係只增加一次；選擇後沒有 autosave。

#### Save／Load、Controller、Debug 與 Source Guard

- `ApplicationController.submitDecision()` 維持原樣委派 `choose()`；Controller 不直接依賴 RelationshipFlow。
- 手動 `saveGame()` 後改動 runtime relation，再執行 `loadGame()`，`coachTrust = 7` 與 `seasonStep = 1` 均正確還原。
- Debug bookmark 的 relationship fixture 行為不變，沒有強制經過 Boundary。
- Source Guard 確認 Boundary／Flow 不包含 DOM、render、Save、localStorage、timeout 與其他 player domain writes。
- 遷移分支 Source Guard 確認沒有 direct relationship write，也沒有 `applyNestedEffects("relationships", ...)`。
- legacy helper 仍存在，因為 Phase 6 只允許一條 path；其餘直接／fixture writes 列為 deferred，不在本次偷偷移除。

#### 測試結果

- JavaScript 語法檢查：通過。
- `tests/relationship-boundary-test.js`：77 項驗證通過。
- `tests/relationship-flow-test.js`：61 項驗證通過。
- Phase 1 `tests/application-controller-test.js`：通過。
- Phase 2 `tests/player-data-boundary-test.js`：93 項與 15／15 matrix 通過。
- Phase 3 `tests/current-state-boundary-test.js`：83 項通過。
- Phase 4 `tests/decision-flow-test.js`：86 項通過。
- Phase 5 `tests/time-boundary-test.js`：54 項通過。
- Phase 5 `tests/day-completion-flow-test.js`：58 項通過。
- `tests/vertical-slice-smoke.js`：通過。
- 全專案 25 個 test scripts：通過。

#### 已知限制

- Phase 6 故意只接管一個 `coachTrust +1` 選項，不是完整 Relationship System。
- 其他 `relationshipEffects` 仍由 `applyNestedEffects()` 寫入。
- Debug bookmark 與測試 fixture 仍可直接注入 relationship state。
- `syncNpcRelationships()` 的三個 legacy mirrors 仍存在；它們是 projection，但尚未改成正式只讀 View Model。
- RelationshipBoundary 目前只支援現有平面四欄與 `add`；沒有 affection、familiarity、hostility、stage 或 NPC Repository。
- `impression`、`characterArc`、relationship flags 與 relationship payoffs 仍屬各自既有 processors，未納入 numeric Boundary。

#### Deferred Items

- 逐條接管其他單一、固定、無 consequence 的 `relationshipEffects`。
- 為含多 target、`trust_deficit`、NPC reaction 或 narrative payoff 的選項分別設計 Result contract，不可直接擴大目前 Result。
- 將 legacy NPC mirrors 固定為只讀 projection，並避免 UI 或計算器誤把它們當 owner。
- 盤點與逐步移除正常 gameplay 的 legacy relationship writes；Debug／fixture injection 需保留獨立入口。
- 未來若建立 Relationship View Model，再讓正式 UI 只依 Boundary snapshot／projection 讀取。

#### 回退方式

1. 將 `script.js` 的目標 relationship branch 還原為 `applyNestedEffects("relationships", choice.relationshipEffects);`。
2. 從 `index.html` 與 test harness 移除 `relationship-boundary.js`、`relationship-flow.js`。
3. 刪除兩個 Phase 6 模組與兩個 Phase 6 tests。
4. 移除此 Phase 6 實作紀錄。

回退不需要修改事件資料、player relationship schema、Save schema、數值平衡、Phase 1～5 元件或 NPC 檔案。

#### 是否建議進入 Phase 7

Phase 6 工程閘門已通過，但不應自動開始 Phase 7。建議先人工確認少棒第一季開場的選擇文字、教練信任、下一事件、手動存讀檔與 Debug bookmark 均與修改前一致，再以獨立任務決定下一個單一路徑；目前大量 legacy relationship writes 與 NPC projection 仍存在，不能把本階段解讀為完整 Relationship ownership 已完成。

### Phase 7：Coach Response Ownership Boundary

**Status：Completed**

#### 本次範圍

Phase 7 只接管一條既有、固定、低風險的教練回應：

- Event：`youth_match_entry`（`story.js:291`）
- Event title：`教練叫到你的名字`
- Trigger：事件正文 render，並非 choice
- Choice index：`null`
- Formal input：`player.relationships.coachTrust`
- Existing threshold：`coachTrust >= 3`
- Existing response hook ID：`youth_match_entry`
- Existing categories：高信任版本 `supportive`、低信任版本 `standard`
- Existing next event：依既有守位進入 `youth_match_grounder`、`youth_match_outfield`、`youth_match_catcher` 或 `youth_match_pitcher`

本階段沒有新增或改寫教練台詞、事件選項、效果、信任門檻、下一事件、章節、能力、人格、NPC 印象、人物弧線、存檔格式或 ApplicationController API。

#### 新增與修改檔案

新增：

- `coach-evaluation-boundary.js`
- `coach-response-flow.js`
- `tests/coach-evaluation-boundary-test.js`
- `tests/coach-response-flow-test.js`

修改：

- `index.html`：在 `relationship-boundary.js` 後載入 `coach-evaluation-boundary.js`，並在 `relationship-flow.js` 後載入 `coach-response-flow.js`。
- `story.js`：`youth_match_entry.text()` 改由 Coach Response Flow 取得既有高／低信任回應分類。
- 既有 Node test harness：補上 Phase 7 模組載入順序，未改測試情境與既有 assertion。
- `docs/02_Architecture/22_Prototype-Implementation.md`：新增本節實作紀錄。

#### Coach Response Ownership Inventory

1. **Formal Coach Relationship**
   - 正式且可持久化的教練關係值是 `player.relationships.coachTrust`（`player.js:121`），範圍為 `0～20`。
   - 一般選項仍由既有 Relationship Flow／Relationship Boundary 處理 numeric relationship change。
   - Phase 7 只讀正式值，不寫入任何 relationship。

2. **Legacy Coach Mirror**
   - `coach.js:1-6` 的 `coach.trust` 是 legacy NPC mirror，初始值為 `50`。
   - `syncNpcRelationships()`（`script.js:602-605`）會把正式 `coachTrust` 投影到 `coach.trust`。
   - `coach.trust` 不獨立存檔，也不是 Phase 7 evaluation input。
   - 為保持相容，本階段沒有移除或改寫 mirror；測試刻意讓 mirror 與正式值不一致，確認結果只依正式值。

3. **Impression**
   - `player.impression.coach` 由 `updateImpression()`（`script.js:860`）及既有事件效果更新。
   - `dependable`、`competitive`、`immature`、`leader` 是 NPC 對玩家的印象，不等於 `coachTrust`。
   - 本次目標回應原本只依 `coachTrust >= 3`，因此 evaluation 不讀 impression。

4. **Character Arc**
   - `player.characterArc.yamamoto` 由 `updateCharacterArcs()`（`script.js:881`）與既有 arc effects 管理。
   - `mentor`、`trusted`、`strict`、`disappointed` 等是敘事弧線狀態，不是本次回應門檻。
   - Phase 7 不讀寫人物弧線。

5. **Relationship Flags／Payoffs**
   - 教練相關 flags、`relationshipPayoffs`、`processRelationshipPayoffs()`（`script.js:2371`）仍由既有人物與敘事系統處理。
   - 本次 evaluation 不建立 flag、callback、payoff 或 consequence。

6. **Runtime-only Reaction State**
   - `changeLog`、DOM、render 次數、transition lock、timeout、notice 等皆為 runtime 表現狀態。
   - CoachEvaluationBoundary 與 CoachResponseFlow 都不直接存取 DOM、render、storage、save、timer。
   - `showStory()` 與 `showCurrentEvent()` 仍由既有 runtime orchestration 負責。

7. **不是 Coach Response System 的資料**
   - stats、skills、personality、body、injury、fatigue、matchState、career、chapter、day、phase、flags、memories、NPC role map、save schema 都不屬於本次 evaluation ownership。

#### 既有 Coach Response Readers 與 Runtime Path

本次接管前，`youth_match_entry.text()` 直接執行：

```text
player.relationships.coachTrust
→ coachTrust >= 3
→ 選擇既有高／低信任 call 文字
→ showStory()
```

本次接管後：

```text
youth_match_entry.text()
→ CoachResponseFlow.createCoachResponseContext()
→ CoachResponseFlow.createCoachEvaluationRequest()
→ CoachEvaluationBoundary.getInputSnapshot()
→ RelationshipBoundary.getRelationship("coachTrust")
→ CoachEvaluationBoundary.validateCoachEvaluationRequest()
→ CoachEvaluationBoundary.evaluateCoachResponse()
→ CoachResponseFlow.applyCoachResponse()
→ 既有高／低信任 call 文字
→ showStory()
```

仍未接管、列為 deferred 的 coach response／coach evaluation readers 包括：

- `story.js:563`：位置競爭小結顯示正式關係數字。
- `story.js:759`：青少棒大賽角色判定。
- `story.js:876`：高中展示賽機會文字。
- `story.js:1453`：章末 coach echo 路由。
- `script.js:629`：位置競爭準備評分。
- `script.js:1412`：領導市場評估。
- `script.js:1790`：重要 NPC 判定。
- `script.js:2293`、`2377`：聯合關係與 payoff 判定。
- `script.js:2658`、`2697`：少棒球季與位置競爭評估。
- `script.js:2844`、`2883-2887`：高中／生涯轉換條件。
- `script.js:3369`：Debug 關係數字顯示。

這些路徑大多同時依賴技能、健康、印象、flags、life themes 或路由結果，並非本階段允許的固定單條教練回應，因此沒有偷偷遷移。

#### CoachEvaluationBoundary Public Methods

- `getInputSnapshot()`：只回傳 frozen clone：

```js
{
  relationships: {
    coachTrust
  }
}
```

- `validateCoachEvaluationRequest(request)`：驗證 exact keys、安全純物件、既有 evaluation ID、目標 event、`choiceIndex: null`、正式信任值及 `expected` 一致性。
- `evaluateCoachResponse(request)`：純函式式評估，只回傳既有 response 分類及命中條件。
- `getSupportedEvaluationIds()`：回傳目前唯一支援的 evaluation ID。
- `getCoachTrust()`／`isSupportedEvaluation()`：供 Flow 取得正式 relationship projection 及驗證 whitelist。

Boundary 不寫入 player，不讀 `coach.trust` mirror，不讀 DOM、storage、save、random、timer 或其他 gameplay domain。

#### Coach Evaluation Request

```js
{
  source: "event:youth_match_entry",
  evaluationId: "coach-trust-response:youth_match_entry",
  context: {
    eventId: "youth_match_entry",
    choiceIndex: null
  },
  expected: {
    coachTrust: 7
  }
}
```

`expected.coachTrust` 必須與 `RelationshipBoundary.getRelationship("coachTrust")` 當下正式值完全相同，並介於 `0～20`；過期、非有限數字、未知欄位、不安全 prototype 或錯誤 event 均拒絕。

#### Coach Evaluation Result

高信任：

```js
{
  ok: true,
  response: {
    evaluationId: "coach-trust-response:youth_match_entry",
    category: "supportive",
    responseId: "youth_match_entry",
    routeType: "existing-narrative",
    matchedCondition: {
      field: "coachTrust",
      operator: ">=",
      value: 3
    }
  }
}
```

低信任只把 `category` 改為 `standard`、`operator` 改為 `<`；response ID、route type 與原門檻不變。

#### CoachResponseFlow Public Methods

- `createCoachResponseContext(eventId, choiceIndex)`：只接受 `youth_match_entry` 與 `null` choice。
- `validateCoachResponseContext(context)`：確認既有 event、text renderer 與受支援 evaluation 均存在。
- `createCoachEvaluationRequest(context)`：從正式 snapshot 建立並先驗證 request。
- `resolveCoachResponse(context)`：只委派一次 `CoachEvaluationBoundary.evaluateCoachResponse()`。
- `applyCoachResponse(result)`：只驗證並投影既有 `responseId`、`category`、`routeType`；不寫入 state 或 render。

#### 回應文字與路由保持不變

既有高信任文字仍為：

> 山本教練沒有回頭，只朝你招手……他說得像是早就決定要給你機會。

既有低信任文字仍為：

> 教練看了板凳一圈，最後叫到你的名字……這個機會來得比你預期突然。

事件標題、守位任務文字、三個 choice、所有 effects 與既有守位分流均未修改。Phase 7 沒有新增隨機修正、個性修正、印象修正或特殊 route。

#### Save／Load、Debug Bookmark 與 Mirror 相容

- `saveGame()`（`save.js:3`）仍直接儲存整個 player。
- `normalizeSave()`（`save.js:9`）仍沿用既有 relationship normalization。
- `loadGame()`（`save.js:75`）還原正式 `player.relationships.coachTrust`；下一次 render 會重新經 Boundary 評估。
- 沒有新增 response cache，因此不存在讀檔後沿用過期教練回應的問題。
- `firstMatch` Debug bookmark（`script.js:207-210`）仍直接建立既有測試狀態，正式信任值由 bookmark base fixture 提供；bookmark 不經 evaluation 寫入，也不新增存檔。
- legacy `coach.trust` mirror 即使錯誤或尚未同步，也不能改變 Phase 7 評估。

#### Golden Coach Response Flow

Golden baseline 在測試中還原修改前的 `youth_match_entry` 直接讀值分支，分別以正式高信任與低信任執行完整 event render 及 choice path，再與 Phase 7 runtime 比較：

- 正式 `coachTrust = 7`、mirror `coach.trust = 1`：仍顯示既有高信任文字。
- 正式 `coachTrust = 2`、mirror `coach.trust = 20`：仍顯示既有低信任文字。
- 回應評估前後正式值與 mirror 均未被寫入。
- story、choices、player info、status、change log、current event、flags、memories、stats、skills、body、matchState、render、transition、timeout、storage writes 全部一致。
- Golden fixture 使用內野手；選擇 `youth_match_entry:1` 後仍進入 `youth_match_grounder`。

#### 測試結果

- `tests/coach-evaluation-boundary-test.js`：72 項驗證通過。
- `tests/coach-response-flow-test.js`：51 項驗證通過。
- 正式 relationship 值與錯誤 mirror 隔離：通過。
- 原 threshold `3`、原 response hook、原高低文字：通過。
- Boundary pure result、deep freeze、stale request、unknown field、unsafe prototype、範圍與 finite number guard：通過。
- Flow 單次委派、既有 event guard、result contract 與 source guard：通過。
- Save／Load 後重新評估：通過。
- `firstMatch` Debug bookmark：通過。
- Golden Coach Response Flow：通過。
- Phase 1～6 與既有 gameplay regression：全部通過。
- 全專案 27 個 test commands：27／27 通過。
- 實際頁面 `firstMatch` bookmark：顯示原高信任文字與三個原選項；該 fixture 為捕手，選擇後仍進入既有 `youth_match_catcher`。
- 實際頁面手動 Save → 切換 bookmark → Load：回到 `youth_match_entry`，並依還原的正式信任重新顯示原高信任文字。
- 正常創角與第一個故事事件：通過。
- Browser Console：`0` 個 error、`0` 個 warning。

#### Source Guard

`coach-evaluation-boundary.js` 與 `coach-response-flow.js` 均不得：

- 寫入 player、coach mirror 或其他 gameplay state。
- 呼叫 DOM、render、showStory、showCurrentEvent。
- 呼叫 save/load、localStorage、sessionStorage。
- 呼叫 random、setTimeout、setInterval。
- 修改 stats、skills、personality、body、match、career、current state、time 或 relationship。

正式 relationship input 必須透過 `RelationshipBoundary` 取得；Flow 只負責 context、request、result 與既有 narrative hook 的相容投影。

#### 保留的 Legacy 與限制

- `coach.trust` mirror 與 `syncNpcRelationships()` 保留，因為其他 legacy UI／NPC 路徑仍可能依賴 projection。
- `applyNestedEffects("relationships", ...)` 保留給尚未遷移的 choices。
- 其他 coachTrust readers、複合 impression／arc／payoff evaluations、Debug fixture writes 均列為 deferred。
- 本次只有一個 render-triggered coach response，不代表完整 Coach Response System 已完成。
- Boundary 目前只接受一個 evaluation ID 與一個 existing narrative response hook。

#### Rollback

1. 將 `story.js` 的 `youth_match_entry.text()` 還原為直接讀取 `player.relationships.coachTrust >= 3`。
2. 從 `index.html` 與既有 test harness 移除兩個 Phase 7 script。
3. 刪除 `coach-evaluation-boundary.js`、`coach-response-flow.js` 與兩個 Phase 7 tests。
4. 移除本 Phase 7 實作紀錄。

不需遷移 player schema、save schema、事件 ID、門檻、文字、choice、route 或 ApplicationController。

#### 是否建議進入 Phase 8

Phase 7 工程閘門已通過，但不應自動開始 Phase 8。建議先人工確認 `firstMatch` bookmark 的高／低信任文字、三個選項、下一顆滾地球、手動 Save／Load 與 legacy mirror 相容；確認產品行為沒有偏差後，再以獨立規格選擇下一條固定 coach response。現有大量複合判定仍不適合直接批次遷移。

### Phase 8：Coach Response Expansion — High School Showcase

**Status：Completed**

#### 新增與修改檔案

新增：

- `tests/coach-response-expansion-test.js`

修改：

- `coach-evaluation-boundary.js`：將 Phase 7 單一 evaluation 常數改為 immutable evaluation specification，保留原 evaluation 並加入展示賽 evaluation。
- `coach-response-flow.js`：加入 immutable event mapping，讓既有 Flow 同時支援少棒首次上場與高中展示賽。
- `story.js`：只替換 `high_school_showcase.text()` 的 direct coachTrust 判斷；文字、選項、效果及路由未改。
- `tests/coach-evaluation-boundary-test.js`：更新 supported evaluations 與 public method 驗證。
- `tests/coach-response-flow-test.js`：更新 Phase 7 delegation fixture，使其符合 specification contract；Phase 7 Golden assertions 未改。
- `docs/02_Architecture/22_Prototype-Implementation.md`：新增本 Phase 實作紀錄。

本階段未修改 `player.js`、`relationship-boundary.js`、`relationship-flow.js`、`save.js`、`coach.js`、`npc.js`、`application-controller.js`、`index.html` 或任何 bookmark fixture。

#### High School Showcase Coach Response Inventory

1. **Event object**
   - Event ID：`high_school_showcase`
   - Event title：`球探第一次坐在看台上`
   - 實作位置：`story.js:873`
   - `text()` 原本直接執行 `player.relationships.coachTrust >= 8`。

2. **原本門檻與文字**
   - Threshold：`8`
   - 高信任：`教練在第五局讓你上場，並在名單旁寫下你的兩個守位。`
   - 低信任：`你直到第七局才被叫去熱身。看台上的球探已收起一部分資料，但還沒有離開。`
   - 固定正文仍為：

```text
秋季交流賽，看台後方坐著一名拿測速槍與筆記本的人。

<chance>

這可能只是普通觀察，也可能是你第一次被棒球市場看見。
```

3. **Choices 與 effects**
   - `完成球隊任務，不改變平常打法`：維持 `discipline +1`、`resilience +1`、`showcase_team_task`、`performance +2`、`exposure +1`、`scoutEvaluation +2`。
   - `主動展現守位最醒目的工具`：所有守位技能、壓力、疲勞、表現、失誤、曝光及球探評價維持原值。
   - `用站位與指揮展現理解力`：觀察、責任、棒球理解、守位技能、曝光及球探評價維持原值。

4. **前後事件與選出方式**
   - 前一事件：`high_school_long_bench`，標題 `一個月沒有正式上場`（`story.js:1284`）。
   - 下一事件：`high_school_scout_feedback`，標題 `球探沒有給你答案`（`story.js:899`）。
   - `getCurrentEventId()` 的青棒 sequence 以 `highSchoolStep` 選出事件：

```text
0 high_school_intro
1 high_school_load
2 high_school_life
3 high_school_call_home
4 high_school_role
5 high_school_long_bench
6 high_school_showcase
7 high_school_scout_feedback
```

5. **資料依賴**
   - `coachTrust >= 8` 只影響正文中的 `chance` 文字。
   - 判斷本身不讀 `highSchoolRoute`、`seasonPosition`、`secondaryPosition`、`exposure` 或 `scoutEvaluation`。
   - Event choices 仍由既有 choice processors 依守位套用 effects；Coach Response evaluation 不參與。
   - `highSchoolStep` 只負責在既有 sequence 中選出事件，Evaluation 不讀寫 step。
   - Event 顯示不修改 relationship、stats、skills、body、match、exposure 或 scout evaluation。

6. **Debug bookmark**
   - 已有 `highSchool` bookmark（`script.js:233`），建立合法的 `chapter: "青棒"`、`age: 16`、`highSchoolStep: 0` 與普通高中路線。
   - 從該 bookmark 可透過六個既有選擇穩定進入 `high_school_showcase`。
   - 因此沒有新增 bookmark，亦未修改 bookmark 名稱、fixture 或 route。

7. **Save／Load**
   - `saveGame()`（`save.js:3`）仍儲存整個 player。
   - `normalizeSave()`（`save.js:9`）與 `loadGame()`（`save.js:75`）未修改。
   - `highSchoolStep: 6` 與正式 `coachTrust` 由 player Save 還原；Derived Coach Response 不持久化，讀檔 render 時重新評估。

#### 為何選擇 high_school_showcase

此路徑符合 Phase 8 指定的低風險條件：

- 固定存在，無隨機性。
- 原判斷只讀正式 `coachTrust`。
- 使用明確 threshold `8`。
- 只決定兩段既有文字之一。
- 不決定 event route、choice availability 或 chapter result。
- 顯示事件時不寫入任何 gameplay state。
- 三個 choice 及 effects 完全位於判斷之後，可用 Golden baseline 穩定比較。

因此不需要擴大到 `junior_tournament`、chapter-end coach echo、位置競爭評分或其他複合判定。

#### Supported Evaluation IDs

Phase 8 完成後，`CoachEvaluationBoundary.getSupportedEvaluationIds()` 回傳：

```js
[
  "coach-trust-response:youth_match_entry",
  "coach-trust-response:high_school_showcase"
]
```

Phase 7 evaluation ID、門檻與 observable behavior 均保留。

#### Immutable Evaluation Specification

`coach-evaluation-boundary.js:5` 使用 frozen specification：

```js
{
  "coach-trust-response:youth_match_entry": {
    eventId: "youth_match_entry",
    threshold: 3,
    matchedCategory: "supportive",
    unmatchedCategory: "standard",
    responseId: "youth_match_entry",
    routeType: "existing-narrative"
  },
  "coach-trust-response:high_school_showcase": {
    eventId: "high_school_showcase",
    threshold: 8,
    matchedCategory: "early-opportunity",
    unmatchedCategory: "late-opportunity",
    responseId: "high_school_showcase",
    routeType: "existing-narrative"
  }
}
```

外層及每一個 specification 均 `Object.freeze()`。新增的 `getEvaluationSpecification()` 只回傳 deep-frozen clone；外部修改 clone 不會改變內部 threshold 或 mapping。

#### CoachResponseFlow Event Mapping

`coach-response-flow.js:2` 使用 immutable mapping：

```js
{
  youth_match_entry: "coach-trust-response:youth_match_entry",
  high_school_showcase:
    "coach-trust-response:high_school_showcase"
}
```

Flow 不含故事文字、callback 或 mutable event object。`getSupportedEventMap()` 只回傳 deep-frozen clone，用於測試與只讀檢查。

#### Coach Evaluation Request

```js
{
  source: "event:high_school_showcase",
  evaluationId: "coach-trust-response:high_school_showcase",
  context: {
    eventId: "high_school_showcase",
    choiceIndex: null
  },
  expected: {
    coachTrust: 8
  }
}
```

`validateCoachEvaluationRequest()` 現在依 specification 同時驗證：

- evaluation ID 已支援。
- `context.eventId` 與 specification event ID 一致。
- `source === "event:" + specification.eventId`。
- `choiceIndex === null`。
- 正式值為有限數字且位於 `0～20`。
- `expected.coachTrust` 與 `RelationshipBoundary` 正式值相同。
- exact keys、prototype pollution、循環資料及 stale request guard。

Phase 8 沒有放寬 Phase 7 的安全驗證。

#### Coach Response Result

正式 `coachTrust >= 8`：

```js
{
  ok: true,
  response: {
    evaluationId: "coach-trust-response:high_school_showcase",
    category: "early-opportunity",
    responseId: "high_school_showcase",
    routeType: "existing-narrative",
    matchedCondition: {
      field: "coachTrust",
      operator: ">=",
      value: 8
    }
  }
}
```

正式 `coachTrust < 8` 時，`category` 為 `late-opportunity`、operator 為 `<`；其他 identity 與 route 不變。

#### 修改前與修改後資料流

修改前：

```text
high_school_showcase.text()
→ 直接讀 player.relationships.coachTrust
→ coachTrust >= 8
→ 選擇既有 chance 文字
→ 回傳完整正文
```

修改後：

```text
high_school_showcase.text()
→ CoachResponseFlow.createCoachResponseContext()
→ CoachResponseFlow.createCoachEvaluationRequest()
→ CoachEvaluationBoundary.validateCoachEvaluationRequest()
→ RelationshipBoundary.getRelationship("coachTrust")
→ CoachEvaluationBoundary.evaluateCoachResponse()
→ CoachResponseFlow.applyCoachResponse()
→ story.js 依 category 選擇既有 chance 文字
→ 回傳原完整正文
```

Boundary 與 Flow 不含完整故事文本；`story.js` 仍負責原標題、正文、換行、選項與 effects。

#### Phase 7 相容性

- `youth_match_entry` evaluation ID 仍為 `coach-trust-response:youth_match_entry`。
- Threshold 仍為 `3`。
- Categories 仍為 `supportive`／`standard`。
- 原高低信任文字、守位任務文字與三個 choices 均未修改。
- 守位分流、Save／Load 重新評估及 mirror mismatch 行為均通過原 Phase 7 tests。
- `tests/coach-evaluation-boundary-test.js`：73 項通過。
- `tests/coach-response-flow-test.js`：51 項通過。

#### Coach Mirror Mismatch

- 正式 `coachTrust = 8`、legacy `coach.trust = 0`：得到 `early-opportunity`。
- 正式 `coachTrust = 7`、legacy `coach.trust = 20`：得到 `late-opportunity`。
- Evaluation 前後正式 relationship、mirror、player、flags、memories、stats、skills、personality、body、matchState、career、current state、time、DOM 與 storage 均一致。
- Evaluation 未呼叫 `syncNpcRelationships()`，也未修正 mirror。

#### Golden High School Showcase Flow

Golden baseline 在測試中把 `story.js` 的 Phase 8 區塊還原為原 direct-read 實作，再與目前 runtime 比較。

高信任：

```text
coachTrust 8 / mirror 0
→ high_school_showcase
→ 原第五局上場文字
→ 完成球隊任務，不改變平常打法
→ high_school_scout_feedback
```

低信任：

```text
coachTrust 7 / mirror 20
→ high_school_showcase
→ 原第七局熱身文字
→ 完成球隊任務，不改變平常打法
→ high_school_scout_feedback
```

兩條 Flow 的 event ID、title、完整正文、chance、choice、choice effects、下一事件、highSchoolStep、chapter、day、phase、relationships、mirror、stats、skills、personality、flags、memories、body、matchState、exposure、scoutEvaluation、render、transition、timeout 與 storage writes 均與 baseline 完全一致。

固定 choice 只套用一次：

- `seasonPerformance +2`
- `exposure +1`
- `scoutEvaluation +2`
- `discipline +1`
- `resilience +1`

沒有 autosave、重複正文、同時顯示高低文字或跳過事件。

#### Save／Load 後重新評估

測試及實際頁面流程：

1. 以正式 `coachTrust = 8` 進入展示賽，顯示第五局文字。
2. 手動 Save，只產生一次 storage write。
3. 切換到正式低信任狀態，顯示第七局文字。
4. Load 還原 `coachTrust = 8` 與 `highSchoolStep = 6`。
5. `high_school_showcase` 重新經 Boundary 評估並顯示第五局文字。

Save JSON 不含 `early-opportunity`、`late-opportunity` 或 `coach-trust-response:high_school_showcase`，證明 Derived Response 未持久化。

#### Debug Bookmark 與瀏覽器人工測試

- 沿用既有「青棒第一年」bookmark，未新增或修改 bookmark。
- 高信任實際路線顯示第五局文字及三個原選項。
- 低信任實際路線顯示第七局文字，未混入高信任文字。
- 點擊固定 choice 後正確進入 `球探沒有給你答案`。
- 手動 Save → 低信任路線 → Load：正確回到高信任展示賽文字。
- Phase 7「第一季正式比賽」bookmark 仍顯示原高信任文字與三個原選項。
- 刪除存檔及正常創角均通過。
- Browser Console：`0` error、`0` warning。
- 專案仍未提供 `favicon.ico`；若瀏覽器主動請求仍可能得到 404，本階段依限制未處理。

#### 測試結果

- `tests/coach-response-expansion-test.js`：125 項驗證通過。
- Phase 7 Boundary：73 項通過。
- Phase 7 Flow／Golden：51 項通過。
- Phase 8 高／低信任 Golden：通過。
- Immutable specification／event mapping：通過。
- Event／evaluation／source mismatch：通過。
- stale expected、unknown field、prototype pollution、cycle guard：通過。
- 正式 relationship 與 legacy mirror 隔離：通過。
- Boundary／Flow Source Guard：通過。
- Save／Load 重新評估與 Derived Response 不持久化：通過。
- Phase 1～7 及完整 gameplay regression：通過。
- 全專案 test commands：28／28 通過。

#### 已知限制與 Deferred Items

- Coach Response 架構目前只支援兩個固定、render-triggered、choiceIndex 為 `null` 的 narrative response。
- `junior_tournament`、chapter-end coach echo、位置競爭評分、高中年度結算及 coach payoff 等複合判定仍直接使用 legacy readers。
- `coach.trust` 與 `syncNpcRelationships()` 仍保留為 legacy projection。
- Flow 尚未處理 choice-triggered coach response、隨機判定、多輸入 evaluation、可用選項或路由分流。
- 不應將本階段解讀為完整 Coach System ownership 已完成。

#### 回退方式

1. 將 `high_school_showcase.text()` 還原為 `player.relationships.coachTrust >= 8` 的原 direct-read chance。
2. 從 `EVALUATION_SPECIFICATIONS` 移除 `coach-trust-response:high_school_showcase`，保留 Phase 7 specification。
3. 從 `EVENT_EVALUATION_IDS` 移除 `high_school_showcase` mapping，保留 Phase 7 mapping。
4. 刪除 `tests/coach-response-expansion-test.js`，並還原兩個 Phase 7 test fixture 的 supported-list 調整。
5. 移除本 Phase 8 文件紀錄。

不需回退 player、relationship schema、save schema、bookmark、event ID、文字、選項、效果、路由或 ApplicationController。

#### 是否建議進入 Phase 9

Phase 8 工程閘門及人工測試已通過，可以規劃 Phase 9，但不應自動開始。下一階段仍應以獨立規格選擇一條固定 response，或先處理 Coach Response API 的只讀觀測與文件；不建議直接批次遷移 `junior_tournament`、章末 echo、位置競爭或任何同時依賴技能、健康、印象與 flags 的複合路徑。

### Phase 9：Narrative Condition Evaluation Boundary

**Status：Completed**

#### 新增與修改檔案

新增：

- `narrative-condition-boundary.js`
- `narrative-condition-flow.js`
- `tests/narrative-condition-boundary-test.js`
- `tests/narrative-condition-flow-test.js`

修改：

- `index.html`：依既有 Boundary／Flow 順序載入兩個 Phase 9 檔案。
- `story.js`：只替換 `high_school_scout_feedback.text()` 的正式判斷來源。
- `tests/coach-response-expansion-test.js`：測試環境補載 Phase 9 Boundary／Flow。
- `tests/goal-balance-test.js`：測試環境補載 Phase 9 Boundary／Flow。
- `tests/vertical-slice-smoke.js`：垂直切片測試環境補載 Phase 9 Boundary／Flow。
- `docs/02_Architecture/22_Prototype-Implementation.md`：新增本 Phase 實作紀錄。

本階段未修改 `player.js`、`save.js`、`application-controller.js`、`relationship-boundary.js`、`relationship-flow.js`、`coach-evaluation-boundary.js`、`coach-response-flow.js`、任何 choice、bookmark fixture 或 gameplay schema。

#### 候選驗證

- Event ID：`high_school_scout_feedback`。
- 實際標題：`球探沒有給你答案`。
- 修改前 direct read：`player.scoutEvaluation >= 3`。
- 正式高評價文字：`球探透過教練留下一句話：『現在不是明星，但有可使用的位置價值。』`
- 正式低評價文字：`球探的筆記沒有留下明確評語。教練只說，沒被否定不等於已經被看見。`
- 固定正文：`你必須決定，下一年要用什麼方式提高自己的價值。`
- 原判斷只決定 `text()` 採用哪一段正文；不決定 choice availability、effects、next event、chapter step、day、phase、stats、relationships、flags、memories、body、injury、matchState 或 career。
- 既有 `highSchool` Debug bookmark 可穩定進入青棒第一年；依序完成七個既有事件後抵達本事件，不需新增 bookmark。
- Save 儲存正式 `player.scoutEvaluation`、`chapter` 與 `highSchoolStep`；Load 後由本 Boundary 即時重新評估，不持久化 Derived Result。

#### Narrative Condition Ownership Inventory

| 類型 | Event／函式 | 讀取欄位與門檻 | 影響範圍 | 程式位置 | 本次是否遷移 |
|---|---|---|---|---|---|
| Pure Narrative Condition | `high_school_scout_feedback.text()` | `scoutEvaluation >= 3` | 只選擇球探評語正文 | `story.js:899-915` | 是 |
| Pure Narrative Condition | `critical_game.text()` | `scoutEvaluation >= 4` | 只改看台球探描述 | `story.js:950-953` | 否；延後 |
| Pure Narrative Condition | `critical_decision.text()` | `scoutEvaluation >= 5` | 只改球團興趣描述 | `story.js:998-1002` | 否；延後 |
| Composite Condition | `high_school_load.text()` | `body.injuryRisk >= 5` 或疼痛 flags | 改身體警訊正文 | `story.js:834-839` | 否；跨 Body／Flag |
| Composite Condition | `critical_health.text()` | `body.injuryRisk >= 6` 或多個 flags | 改健康與風險正文 | `story.js:962-965` | 否 |
| Composite Condition | `getNightEvent()` | `memories`、`flags`、`day` | 回憶正文與日期標題 | `story.js:1415-1430` | 否 |
| Composite Condition | 阿哲／高橋人物事件 `text()` | `personality`、`impression`、`characterArc`、`relationships`、flags | 人物版本與跨章回響 | `story.js:267-270, 615-620, 1362-1386` | 否 |
| Route Condition | `getCurrentEventId()` | `chapter`、各章 step、`phase`、`forcedEventId` | 選擇正式事件 ID | `story.js:1433-1505` | 否 |
| Route Condition | `getCurrentEventId()` 位置競爭 echo | `impression`、`relationships` | 選擇人物回響事件 | `story.js:1472-1486` | 否 |
| Gameplay Result Condition | `resolveMatchAction()`／比賽結算 | `matchState`、skills、守位能力 | 比分、出局、跑者與表現 | `script.js:1252-1381` | 否 |
| Gameplay Result Condition | `determineEnding()`／章節 evaluators | stats、skills、flags、relationships、body | 章節結果、角色定位與後續狀態 | `script.js:2598-2879` | 否 |
| Gameplay Result Condition | `inferRoleIdentity()`／Career evaluators | skills、personality、relationships、career、守位 | 角色、市場與職涯結果 | `script.js:1399-1610` | 否 |
| Composite Condition | 關係兌現與人物回應 helpers | `relationshipPayoffs`、impression、characterArc、relationships、skills、body | 解鎖機會、資訊與人物文案 | `script.js:2291-2494` | 否 |
| Choice Availability Condition | 關係兌現 choice injection | payoff flags、人物印象與既有 choices | 加入符合條件的特殊選項 | `script.js:2426-2428` | 否 |
| Random Condition | `story.js`／`script.js` 載入路徑 | 無 `Math.random` 條件命中 | 無 | 全檔搜尋 | 無候選 |

Inventory 結論：現有 narrative readers 涵蓋 flags、memories、personality、skills、body、matchState、relationships、career、chapter／step、day／phase、NPC mirror、impression、characterArc 與 relationshipPayoffs；其中只有單一來源、固定門檻、只改正文的 `high_school_scout_feedback` 納入本階段。`player.stats` 並非目前正式容器，能力來源為 player 頂層欄位與 `player.baseballSkills`；NPC mirror 仍是 legacy projection，不是本 Evaluation 的正式來源。

#### Narrative 資料分類

1. **Persistent Source Data**：`player.scoutEvaluation`；由 Player System 擁有並由現有 Save 儲存。
2. **Narrative Evaluation Input**：`{ scoutEvaluation }` 的最小唯讀 Snapshot。
3. **Narrative Evaluation Specification**：evaluation ID、event ID、source field、operator、threshold、categories、response ID、route type。
4. **Narrative Condition Result**：`recognized` 或 `uncertain`，以及既有門檻的語意描述。
5. **Existing Narrative Content**：標題、高低評價文字、固定正文、換行、標點、choices 與 effects；仍由 `story.js` 擁有。
6. **Runtime UI State**：DOM、render、transition、change log 與 timeout；不進入 Snapshot、Request 或 Result。
7. **不屬於 Narrative Evaluation 的資料**：完整 player、完整 event、Save payload、callback、chapter routing、choice effects、gameplay state 與 NPC mirror。

#### 正式 Source Ownership

正式欄位仍是 `player.scoutEvaluation`，本階段沒有搬移或複製 schema。`NarrativeConditionBoundary` 委派 `PlayerDataBoundary.getSnapshot()` 取得正式 Player Snapshot，再只抽取 `scoutEvaluation`。`story.js` 與 `NarrativeConditionFlow` 均不接收完整 player，也不建立 scout mirror。

既有 `applyHighSchoolEffects()` 與 `applyCareerEffects()` 都把 `scoutEvaluation` 限制在 `0～20`，因此 Boundary 驗證沿用實際合法範圍 `0～20`，沒有修改 gameplay clamp 或欄位定義。

#### NarrativeConditionBoundary Public Methods

`window.NarrativeConditionBoundary` 提供：

- `getInputSnapshot(evaluationId)`
- `getSupportedEvaluationIds()`
- `isSupportedEvaluation(evaluationId)`
- `getEvaluationSpecification(evaluationId)`
- `validateNarrativeEvaluationRequest(request)`
- `evaluateNarrativeCondition(request)`

Public API、規格、Snapshot、已驗證 Request 與 Result 都是 frozen data。Boundary 拒絕未知欄位、不安全 prototype、循環資料、NaN、Infinity、越界數值、evaluation／event／source field mismatch 與 stale expected value。

#### Evaluation Specification

```js
{
  "narrative-condition:high_school_scout_feedback": {
    eventId: "high_school_scout_feedback",
    sourceField: "scoutEvaluation",
    operator: ">=",
    threshold: 3,
    matchedCategory: "recognized",
    unmatchedCategory: "uncertain",
    responseId: "high_school_scout_feedback",
    routeType: "existing-narrative"
  }
}
```

外層與內層 specification 均凍結；getter 回傳 deep-frozen clone。Specification 不包含故事文字、event object、callback 或 mutable player reference。

#### Input Snapshot

```js
{
  scoutEvaluation: 3
}
```

Snapshot 是 safe clone、已 freeze，只含本 Evaluation 所需欄位，不含完整 player、event、DOM 或函式。

#### Evaluation Request

```js
{
  source: "event:high_school_scout_feedback",
  evaluationId: "narrative-condition:high_school_scout_feedback",
  context: {
    eventId: "high_school_scout_feedback"
  },
  expected: {
    scoutEvaluation: 3
  }
}
```

因判斷在 event `text()` render 時發生，Request 不加入無意義的 `choiceIndex`。

#### Narrative Condition Result

門檻相符：

```js
{
  ok: true,
  response: {
    evaluationId: "narrative-condition:high_school_scout_feedback",
    category: "recognized",
    responseId: "high_school_scout_feedback",
    routeType: "existing-narrative",
    matchedCondition: {
      field: "scoutEvaluation",
      operator: ">=",
      value: 3
    }
  }
}
```

未達門檻時 category 為 `uncertain`、operator 為 `<`，其餘 identity 與 route 不變。Result 只描述評估結果，不持有文字、不 render、不推進事件、不修改任何 state。

#### NarrativeConditionFlow Public Methods

`window.NarrativeConditionFlow` 提供：

- `createNarrativeContext(eventId)`
- `validateNarrativeContext(context)`
- `createNarrativeEvaluationRequest(context)`
- `resolveNarrativeCondition(context)`
- `applyNarrativeCondition(result)`
- `getSupportedEventMap()`

Context 固定為 `{ eventId: "high_school_scout_feedback" }`，已 freeze，不包含 player、event、DOM、callback、chapter、day 或 phase。Flow 驗證既有 event 與合法 `text()` renderer、Boundary specification 及 route type，再以最小 Request 委派 Boundary。

#### Event-to-Evaluation Mapping

```js
{
  high_school_scout_feedback:
    "narrative-condition:high_school_scout_feedback"
}
```

Mapping 已 freeze，只支援本次真正遷移的單一事件，不預先宣告其他條件。

#### 修改前與修改後資料流

修改前：

```text
high_school_scout_feedback.text()
→ 直接讀 player.scoutEvaluation
→ scoutEvaluation >= 3
→ 選擇既有高／低文字
→ 回傳完整正文
```

修改後：

```text
high_school_scout_feedback.text()
→ NarrativeConditionFlow.createNarrativeContext()
→ NarrativeConditionFlow.createNarrativeEvaluationRequest()
→ NarrativeConditionBoundary.getInputSnapshot()
→ PlayerDataBoundary.getSnapshot()
→ NarrativeConditionBoundary.validateNarrativeEvaluationRequest()
→ NarrativeConditionBoundary.evaluateNarrativeCondition()
→ NarrativeConditionFlow.applyNarrativeCondition()
→ story.js 依 category 選擇既有高／低文字
→ 回傳原完整正文
```

`story.js` 仍擁有標題、完整文字、原換行與標點、choices、effects 及既有 next-event behavior。

#### Choice 與 Effects 相容性

目標事件仍有三個原選項：

1. `繼續增加多位置與戰術價值`
   - `observe +1`、`responsibility +1`
   - flag：`high_school_commit_utility`
   - `baseballIQ +2`
   - `scoutEvaluation +1`
2. `集中打擊與身體能力，追求更高上限`
   - `confidence +2`、`pressure +1`
   - flag：`high_school_commit_upside`
   - `batting +2`
   - `fatigue +2`、`injuryRisk +1`
   - `exposure +1`
3. `先確保健康與課業，不追逐一次評價`
   - `discipline +1`、`responsibility +2`
   - flag：`high_school_commit_balance`
   - `injuryRisk -1`、`fatigue -1`
   - `academics +1`、`burnout -1`

三個 choice 的 text、memory、flag、effects、effect 套用次數、`highSchoolStep` 及下一事件均未修改。固定 Golden choice 使用第三項，因其不改 `scoutEvaluation`，可直接證明多次 render 與 Evaluation 不會提前或重複套用 effect；選擇後仍進入 `high_school_result`，chapter 為 `青棒第一年小結`。

#### Coach Boundary 責任隔離

- `CoachEvaluationBoundary.getSupportedEvaluationIds()` 仍只有：
  - `coach-trust-response:youth_match_entry`
  - `coach-trust-response:high_school_showcase`
- Coach specification、Boundary 與 Flow 均未加入 `scoutEvaluation`。
- Narrative Boundary 不讀 `coachTrust`。
- Narrative Flow 不依賴、也不呼叫 `CoachResponseFlow`。
- ApplicationController 維持原 Decision Flow 委派，不執行 threshold 或 category 判斷。
- Phase 7 少棒首次上場與 Phase 8 高中展示賽原門檻、文字、choices、effects 與 route 均通過回歸。

#### Golden 高／低評價結果

Golden baseline 在測試中將 `high_school_scout_feedback.text()` 還原為修改前 direct-read 版本，再與目前 runtime 逐項比較。

高評價：

```text
scoutEvaluation = 3
→ recognized
→ 只顯示原高評價文字
→ 選擇「先確保健康與課業，不追逐一次評價」
→ scoutEvaluation 仍為 3
→ highSchoolStep = 8
→ high_school_result
```

低評價：

```text
scoutEvaluation = 2
→ uncertain
→ 只顯示原低評價文字
→ 選擇相同 Golden choice
→ scoutEvaluation 仍為 2
→ highSchoolStep = 8
→ high_school_result
```

兩條 Flow 的 event ID、title、完整文字、換行、標點、choices、effects、player info、status、change log、flags、memories、stats、skills、personality、body、injury、matchState、career、current state、chapter、day、phase、render、transition、timeout 與 storage writes 均與修改前 baseline 一致。等於門檻為高分類，高於門檻仍為高分類，低於門檻為低分類。

#### Save／Load

1. `scoutEvaluation = 3`、`highSchoolStep = 7` 時顯示原高評價正文。
2. 手動 Save 只產生一次既有 storage write。
3. 切換為 `scoutEvaluation = 2` 時顯示原低評價正文。
4. Load 還原正式值與目標事件。
5. render 時重新取得 Snapshot 並再次顯示原高評價正文。

Save payload 不包含 evaluation ID、`recognized`、`uncertain` 或 `matchedCondition`。Load 與重新評估不新增 storage write，也不重複套用 choice effect。`SAVE_KEY`、`SAVE_VERSION`、save schema、`normalizeSave()`、migration、manual save behavior 與 autosave behavior 均未修改。

#### Debug Bookmark 與瀏覽器人工測試

- 沿用既有「青棒第一年」bookmark，沒有新增或修改 fixture。
- 由 bookmark 的既有事件鏈可抵達 `球探沒有給你答案`。
- `scoutEvaluation = 3` 顯示原高評價文字；`2` 顯示原低評價文字。
- 事件標題、固定正文及三個 choices 完整。
- Golden choice 後正確進入青棒第一年小結，沒有重複正文或提前 effect。
- 手動 Save 高評價事件、切換低評價路線、Load 後，恢復高評價事件與文字。
- Phase 7「第一季正式比賽」bookmark 顯示原事件與三個原選項。
- Phase 8 高中展示賽高信任文字與三個原選項正常，並可進入 Phase 9 事件。
- Debug bookmark 不寫入正式 Save；刪除存檔正常。
- 正常創角、Ideal Self 選擇與第一個故事事件正常。
- Browser Console：`0` error、`0` warning。
- 專案仍未提供 `favicon.ico`；瀏覽器若主動請求，獨立 `404` 仍可能存在，本階段依限制未處理。

#### 測試結果

- `tests/narrative-condition-boundary-test.js`：117 項驗證通過。
- `tests/narrative-condition-flow-test.js`：138 項驗證通過。
- Boundary method、supported ID、immutable specification、minimal frozen Snapshot：通過。
- Request exact-key、finite、range、stale、mismatch、prototype pollution 與 cycle guards：通過。
- `2／3／4` 門檻分類及 operator：通過。
- Boundary／Flow pure result、deep freeze 與 Source Guard：通過。
- 原標題、高低正文、固定正文、換行、標點與三個 choices：通過。
- 高／低 Golden Runtime Flow：通過。
- Save／Load 即時重新評估與 Derived Result 不持久化：通過。
- Coach Phase 7／8 隔離與回歸：通過。
- ApplicationController、Decision、Time、Relationship、Coach 及 gameplay regression：通過。
- 全專案 test commands：30／30 通過。
- JavaScript 語法檢查：通過。
- 實際頁面測試與 Browser Console：通過。

#### Source Guard

`narrative-condition-boundary.js` 與 `narrative-condition-flow.js` 均不得：

- 寫入 player、story、current state、relationship、stats、skills、personality、flags、memories、body、injury、matchState、career、chapter、day 或 phase。
- 操作 DOM、render、change log、storage、save/load、timer 或 random。
- 持有完整 player、event、故事文本、callback 或 mutable reference。
- 呼叫 Coach Boundary／Flow 或改變 Phase 7／8 evaluation。

Boundary 唯一正式資料入口是 `PlayerDataBoundary.getSnapshot()`；Flow 只處理最小 context、request、result 與既有 narrative hook。

#### 已知限制與 Deferred Items

- Phase 9 只支援一個固定、無隨機性、render-triggered 的 Pure Narrative Condition。
- `critical_game` 的 `scoutEvaluation >= 4` 與 `critical_decision` 的 `scoutEvaluation >= 5` 也是正文判斷，但未經本階段安全審查與 Golden 遷移，維持 deferred。
- flags、memories、personality、body、relationships、impression、characterArc 與 relationshipPayoffs 的多數文字判斷是複合條件，不能直接套用這個單欄位 Boundary。
- Route、choice availability、gameplay result、random 與 composite conditions 均未接管。
- 不建立 Narrative Repository、Rule Engine、result cache、scout mirror 或第二份持久化資料。
- favicon 仍缺少，獨立 404 不屬於本階段。

#### 回退方式

1. 將 `high_school_scout_feedback.text()` 還原為 `player.scoutEvaluation >= 3` 的原 direct-read 判斷。
2. 從 `index.html` 與既有 test harness 移除 Phase 9 Boundary／Flow scripts。
3. 刪除 `narrative-condition-boundary.js`、`narrative-condition-flow.js` 與兩個 Phase 9 tests。
4. 移除本 Phase 9 實作紀錄。

不需回退 player schema、save schema、event ID、標題、正文、門檻、choices、effects、route、bookmark、ApplicationController 或 Coach Phase 7／8。

#### 是否建議進入 Phase 10

Phase 9 的工程與人工驗收閘門已通過，可以另外規劃 Phase 10；但不應自動開始。下一階段必須有獨立規格，且不應把本次單欄位、純正文 Boundary 直接擴大成通用 Narrative／Rule Engine。若未先確認產品行為，建議仍保留 `critical_game`、`critical_decision` 及所有複合條件為 deferred。

### Phase 10：Evaluation Registry

#### Status

Completed。Phase 10 僅建立「評估身分、Owner 與事件來源」的集中登錄與查詢能力；沒有接管任何評估運算，也沒有開始 Phase 11。

#### Files

- 新增 `evaluation-registry.js`
- 新增 `evaluation-registry-bootstrap.js`
- 修改 `coach-evaluation-boundary.js`
- 修改 `narrative-condition-boundary.js`
- 修改 `index.html`
- 修改 `tests/vertical-slice-smoke.js`
- 新增 `tests/evaluation-registry-test.js`
- 新增 `tests/evaluation-registry-integration-test.js`
- 更新 `docs/02_Architecture/22_Prototype-Implementation.md`

#### Evaluation Ownership Inventory

| Evaluation ID | Owner | Owner Type | Event ID | Response ID | Route Type | 實際來源欄位 |
|---|---|---|---|---|---|---|
| `coach-trust-response:youth_match_entry` | `CoachEvaluationBoundary` | `coach-evaluation` | `youth_match_entry` | `youth_match_entry` | `existing-narrative` | Relationship snapshot 的 `coachTrust` |
| `coach-trust-response:high_school_showcase` | `CoachEvaluationBoundary` | `coach-evaluation` | `high_school_showcase` | `high_school_showcase` | `existing-narrative` | Relationship snapshot 的 `coachTrust` |
| `narrative-condition:high_school_scout_feedback` | `NarrativeConditionBoundary` | `narrative-condition` | `high_school_scout_feedback` | `high_school_scout_feedback` | `existing-narrative` | Player snapshot 的 `scoutEvaluation` |

盤點結果沒有 ID 或 Owner 衝突。規格清單提到 `player-data-boundary.js`，但目前專案沒有這個獨立檔案；`PlayerDataBoundary` 的實際實作位於 `player.js`。本階段沒有因此搬移或重構 Player Data Boundary。

#### Ownership Boundary

`EvaluationRegistry` 負責：

- 驗證最小 metadata contract。
- 以 `evaluationId` 登錄並防止重複。
- 提供穩定、唯讀、可查詢的 Evaluation 清單。
- 以 `eventId` 找到一或多個相關 Evaluation。

`EvaluationRegistry` 不負責：

- 讀取 player、relationship 或任何 gameplay state。
- 判斷 threshold、operator、category 或 matched condition。
- 呼叫 Coach／Narrative 的 evaluate 方法。
- 渲染 UI、改寫事件、儲存存檔、排程 timer 或產生隨機數。

`CoachEvaluationBoundary` 與 `NarrativeConditionBoundary` 仍各自擁有完整 specification、input snapshot、request validation 與 evaluation。Registry 只知道最小 metadata，不知道 Boundary 的內部規則。

#### Public API

`window.EvaluationRegistry` 提供：

- `registerEvaluation(metadata)`
- `getEvaluationIds()`
- `isSupportedEvaluation(evaluationId)`
- `findEvaluation(evaluationId)`
- `findByEvent(eventId)`
- `getRegisteredCount()`

API object、成功登錄的內部 metadata、所有公開回傳 clone 與 event query array 都是 frozen。呼叫者無法藉由修改查詢結果改寫 Registry。

#### Metadata Schema

每筆 metadata 僅允許下列六個欄位：

```js
{
  evaluationId: "",
  owner: "",
  ownerType: "",
  eventId: "",
  responseId: "",
  routeType: ""
}
```

所有欄位都必須是非空白字串；拒絕多餘欄位、陣列、日期、函式、DOM-like value、prototype pollution key、非 plain object 與循環結構。

Metadata 刻意不包含：

- `threshold`
- `operator`
- `category`
- `sourceField`

這些仍屬於各 Evaluation Boundary 的私有 specification，不得由 Registry 變成第二份規則來源。

#### Registration and Bootstrap

登錄採「Boundary 公開最小 metadata，獨立 bootstrap 統一登錄」：

1. `CoachEvaluationBoundary.getRegistryMetadata()` 回傳兩筆 deep-frozen metadata。
2. `NarrativeConditionBoundary.getRegistryMetadata()` 回傳一筆 deep-frozen metadata。
3. `EvaluationRegistryBootstrap.initialize()` 依固定順序登錄三筆資料。

此方式避免：

- Registry 直接依賴 Boundary 內部 specification。
- Boundary 直接依賴 Registry。
- 在 Registry 本身硬編碼 Owner 的 evaluation 清單。

`initialize()` 在同一 runtime 中具冪等性；重複呼叫不會重複登錄。若直接再次呼叫 `registerEvaluation()` 使用既有 ID，則明確拒絕，且 Registry 不發生部分 mutation。

#### Runtime Load Order

`index.html` 的相關載入順序為：

```text
player.js
→ current-state-boundary.js
→ time-boundary.js
→ relationship-boundary.js
→ evaluation-registry.js
→ coach-evaluation-boundary.js
→ narrative-condition-boundary.js
→ evaluation-registry-bootstrap.js
→ decision-flow.js
→ day-completion-flow.js
→ relationship-flow.js
→ coach-response-flow.js
→ narrative-condition-flow.js
→ npc.js / coach.js / rival.js / story.js / save.js / script.js
→ application-controller.js
```

Bootstrap 在兩個 Boundary 定義完成後、所有 Flow 與 gameplay runtime 啟動前執行。

#### Duplicate and Unknown Behavior

- 重複 `evaluationId`：回傳失敗，不覆寫、不合併、不增加 count。
- 不存在的 `evaluationId`：`findEvaluation()` 回傳 `null`。
- 不存在或不合法的 `eventId`：`findByEvent()` 回傳 frozen 空陣列。
- 一個 event 對多個 evaluation：允許，並維持固定登錄順序。

#### Boundary Compatibility

Phase 7 Coach 路徑維持：

```text
story.js
→ CoachResponseFlow
→ CoachEvaluationBoundary
→ RelationshipBoundary
→ 原有 response 文案與 route
```

Phase 9 Narrative 路徑維持：

```text
story.js
→ NarrativeConditionFlow
→ NarrativeConditionBoundary
→ PlayerDataBoundary
→ 原有 response 文案與 route
```

兩個 Boundary 都能在完全沒有載入 Registry 的隔離 context 中繼續完成 evaluation，證明 Registry 沒有成為新的執行依賴。Registry 本身也不會呼叫任何 evaluate method。

#### Golden Runtime Compatibility

- Phase 7：`youth_match_entry` 的教練信任高低版本、選項、效果與後續流程不變。
- Phase 8：`high_school_showcase` 的高信任版本仍在第五局給上場與雙守位標記；低信任版本仍到第七局才熱身。
- Phase 9：`high_school_scout_feedback` 在 `scoutEvaluation = 3` 時仍為 recognized 文案；`scoutEvaluation = 2` 時仍為 uncertain 文案。

#### Save / Load

Registry metadata 是 runtime static registration，不加入 player，不加入 save payload，也不新增 localStorage key。手動 Save／Load 仍只還原 gameplay state；讀檔後 Registry count 維持三筆，不會再次登錄或產生 duplicate error。

#### Source Guard

`evaluation-registry.js` 不得包含或依賴：

- player、coachTrust、scoutEvaluation。
- RelationshipBoundary、PlayerDataBoundary。
- Coach／Narrative evaluate methods。
- threshold、operator、category、sourceField。
- DOM、render、storage、save/load、timer、random 或 date。

`evaluation-registry-bootstrap.js` 只負責取得 metadata 與呼叫 register；不讀 gameplay state、不執行 evaluation、不渲染、不存檔。

#### Tests

- `tests/evaluation-registry-test.js`：112 項 Registry contract、immutability、invalid input、duplicate、unknown、one-to-many、deterministic order 與 Source Guard 驗證通過。
- `tests/evaluation-registry-integration-test.js`：57 項 Owner、事件 mapping、bootstrap、Boundary isolation、Phase 7～9 Golden 與載入順序驗證通過。
- 全部 JavaScript 語法檢查通過。
- 全專案測試 32／32 通過。

#### Browser Verification

- 正常創角可進入「球場邊的夏天」。
- `youth_match_entry` 顯示原本「教練叫到你的名字」與三個選項。
- `high_school_showcase` 高／低教練評價版本皆正確。
- `high_school_scout_feedback` recognized／uncertain 版本皆正確。
- 手動 Save 後切換狀態，再 Load 可還原原本高評價畫面。
- Delete Save 可回到建立角色。
- Browser Console：0 error、0 warning。
- 專案仍未提供 `favicon.ico`；這是既有非 gameplay 資產缺口，未納入 Phase 10。

#### Player-visible Behavior

Phase 10 沒有新增玩家可見功能，也沒有改變數值、事件、選項、文案、路由或結果。Registry 是後續架構查詢基礎；目前玩家行為應與 Phase 9 完全相同。

#### Deferred Items

- 不建立集中 Rule Engine。
- 不把 threshold/operator/category/sourceField 移入 Registry。
- 不讓 Registry 執行 evaluation。
- 不加入 runtime debug UI 或玩家可見清單。
- 不改 save schema。
- 不遷移其他舊 evaluation-like 判定。
- 不處理 `critical_game`、`critical_decision` 或新的 Evaluation。
- 不開始 Phase 11。

#### Rollback Boundary

若需回退 Phase 10，只需移除兩個 Registry 檔案、兩個 Boundary 的 `getRegistryMetadata()`、`index.html` 新增的兩個 Registry script tags、兩個 Registry tests 與 smoke loader 變更；Phase 7～9 的原有 runtime Flow 與 evaluation specification 不需回退。

#### Phase 11 Recommendation

可進入 Phase 11，但建議仍維持「Registry 只回答誰擁有哪個 Evaluation」的界線。任何後續 dispatcher 或 orchestration 都應依 `evaluationId` 導向既有 Owner，不能把 Boundary 私有 threshold 與 evaluation 邏輯搬進 Registry。

## Mapping Conclusion

1. **現有程式是否適合漸進式重構：** 適合。理由是已有單一可保存 Snapshot、資料化事件、明確 event ID、可玩的垂直流程與 17 組 characterization tests。這些足以支撐「包裝後抽離」。
2. **是否需要重寫：** 不需要整體重寫。`script.js` 的責任必須逐步拆分，但事件內容、Snapshot、Save migration、計算規則與 UI 都有高度可保留價值。
3. **第一個應建立的工程邊界：** Application Controller public façade。它先統一 `createPlayer()`、`choose()`、`showCurrentEvent()`、Save/Load 的入口，不先主張資料 owner 已完成。
4. **目前最大的技術風險：** `choose()`、`showStory()`、`updateStatus()` 的多重 side effects 與順序依賴。尤其 render 會改 gameplay state，使任何 UI 重繪都可能改變結果（`script.js:2917-2934`, `3251-3268`）。
5. **是否可以進入 Application Controller 實作：** 可以，但僅限 Compatibility Façade。現階段不適合直接搬動 `getCurrentEventId()`、章節 evaluators、Narrative/Career processors 或重塑 player schema。

整體判斷：目前程式不是缺少功能，而是功能已超過原本單檔邊界可以安全承載的程度。最佳策略不是重新生成，而是以現有測試保護可玩版本，先建立 Controller 包裝層，再依 Player/Identity、Current State、Decision/Event、Time/Save、World Response 的順序逐步收回資料所有權。
