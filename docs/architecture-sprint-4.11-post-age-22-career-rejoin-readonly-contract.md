# Architecture Sprint 4.11：Post-Age-22 Career Rejoin Readonly Contract

## Purpose

Architecture Sprint 4.11 建立一份只讀、可稽核的二十二歲後生涯重新交會拓樸。它回答的是「現行契約已經允許我們描述哪些未來方向」，不是「玩家現在可以去哪裡」。

本 Sprint 不新增 Runtime、Gameplay、事件、章節、Save 狀態或 Player 欄位，也不讓二十二歲後內容成為可玩狀態。

## Existing 4.3 Candidate Source

唯一來源是 `CareerSpineContract`：

- `getCareerNetwork().initialRoutes` 提供現行四個成年入口身分。
- `getCandidateTransitions()` 提供 Architecture Sprint 4.3 已登錄的八條候選轉換。
- `getCareerNetwork().currentEndpoint` 提供目前二十二歲結果與 Prototype terminal gate。

`CareerRejoinContract` 不保存第二份固定候選邊清單，也不保存固定的七個身分清單。身分集合由初始路線 `routeKey`、候選邊 `sourceRoute` 與 `targetRoute` 的聯集衍生。

Architecture Sprint 4.11 does not create a second candidate-transition registry. It derives the post-age-22 topology from the candidates already established by CareerSpineContract.

## Why 4.11 Does Not Rename Candidate Vocabulary

4.11 保留 4.3 使用的 `draft`、`college`、`amateur`、`rehab`、`professional`、`baseball-industry` 與 `player-competition`。這些字彙目前同時包含「現行初始路線」與「未來候選 domain」兩種層次，4.11 只透過 metadata 區分，不擅自重新命名、合併或建立 alias。名稱語意若要調整，必須由後續產品決策與 Runtime 契約共同處理。

## Current Age-22 Gate

現行內容閘門保持：

```text
age-22-career-result
→ vertical-slice-complete
→ playableAfterTerminal = false
```

`currentGate` 直接複製 `CareerSpineContract.getCareerNetwork().currentEndpoint` 的三個欄位：

- `resultNodeId`
- `terminalNodeId`
- `playableAfterTerminal`

候選圖與 current gate 並列呈現。4.11 不建立從 `age-22-career-result` 或 `vertical-slice-complete` 指向任何 future identity 的 actual edge 或 candidate edge。

## Identity Derivation

身分衍生順序是：

1. 依現行 `initialRoutes` 順序加入 `routeKey`。
2. 依候選邊順序加入 `sourceRoute`。
3. 依候選邊順序加入 `targetRoute`。
4. 保留首次出現順序並去除重複。

因此輸出具 deterministic 性質，但 Production 不以固定七項陣列作為資料來源。每個 identity 的 incoming／outgoing candidate edge ID 皆由候選邊即時計算。

## Seven Derived Identities

現行 Contract 可衍生七個 identity：

| Identity | 現行初始路線 | Future-only | 候選來源 | 候選目標 | 4.11 Runtime 可玩 |
|---|---:|---:|---:|---:|---:|
| `draft` | 是 | 否 | 否 | 否 | 否 |
| `college` | 是 | 否 | 是 | 否 | 否 |
| `amateur` | 是 | 否 | 是 | 是 | 否 |
| `rehab` | 是 | 否 | 是 | 否 | 否 |
| `professional` | 否 | 是 | 是 | 是 | 否 |
| `baseball-industry` | 否 | 是 | 否 | 是 | 否 |
| `player-competition` | 否 | 是 | 否 | 是 | 否 |

`initialRouteIdentity` 與 `futureOnly` 只描述拓樸來源，不代表 chapter、Player 狀態、Save 狀態或 Runtime route。

Future rejoin identities are not current playable CareerSpine nodes and are not admissible Save states.

## Initial Route vs Future-only Identity

`draft`、`college`、`amateur`、`rehab` 的 `initialRouteIdentity=true`，表示它們已存在於 18–22 歲入口資料；不表示 4.11 新增了 22 歲後入口。`professional`、`baseball-industry`、`player-competition` 的 `futureOnly=true`，只表示它們目前僅由候選端點導出。

## Candidate Source / Target Roles

`candidateSource`、`candidateTarget` 與 incoming／outgoing edge IDs 只描述候選圖的方向。它們不代表 eligibility、玩家決策、Runtime route、事件可達性或 Save admission。

## Eight Locked Candidate Edges

以下八條邊完全沿用 Architecture Sprint 4.3 的候選語意：

| Candidate edge | Source | Target | Status |
|---|---|---|---|
| `college-to-professional` | `college` | `professional` | candidate-only |
| `college-to-amateur` | `college` | `amateur` | candidate-only |
| `amateur-to-professional` | `amateur` | `professional` | candidate-only |
| `professional-to-amateur` | `professional` | `amateur` | candidate-only |
| `professional-to-baseball-industry` | `professional` | `baseball-industry` | candidate-only |
| `college-to-baseball-industry` | `college` | `baseball-industry` | candidate-only |
| `amateur-to-baseball-industry` | `amateur` | `baseball-industry` | candidate-only |
| `rehab-to-player-reentry` | `rehab` | `player-competition` | candidate-only |

每條邊都必須維持：

```text
implemented = false
eventIds = []
contractStatus = candidate-only
```

The absence of a draft-to-professional candidate edge is preserved intentionally; Architecture Sprint 4.11 does not infer an alias or transition that the existing contract does not define.

同樣地，4.11 不替 `player-competition` 建立出邊、不把 `career-pause` 或 `career-exit` 加入身分集合，也不細分教練、球探、分析、行政等棒球產業子類型。

## Professional Rejoin Hub

`professional` 目前是 future-only 候選 hub：可由 `college` 與 `amateur` 進入，也可候選轉往 `amateur` 或 `baseball-industry`。這只描述既有邊，沒有 professional chapter 或 Runtime node。

## Amateur Rejoin Role

`amateur` 同時是現行初始路線、候選來源與候選目標。4.11 不把這個拓樸角色解讀為必然轉隊、測試成功或職業回流。

## Rehab → Player Competition Boundary

`rehab-to-player-reentry` 只到達 `player-competition`。4.11 刻意停在「重新競爭」邊界，不推論競爭成功後進入 professional 或 amateur。

## Draft Semantic Gap

`draft` 是現行初始路線身分，而 `professional` 是候選圖的 future domain。既有 4.3 契約沒有兩者間的 edge 或 alias，因此 4.11 保留此語意缺口。

## Candidate-only Rule

所有八條候選邊必須維持 `implemented=false`、`eventIds=[]`、`contractStatus="candidate-only"`。Audit 只回報違規，不進行修正。

## No Actual Edge Rule

4.11 不修改 `CareerSpineContract.getActualEdges()` 或任何 `nextChapters`，也不把候選邊加入現行 Career Spine。

## No Gameplay Event Rule

4.11 不建立 Gameplay event ID。候選邊的 `eventIds` 必須保持空陣列。

## Readonly API

`CareerRejoinContract` 只公開：

```javascript
CareerRejoinContract.getPostAge22Network()
CareerRejoinContract.auditPostAge22Network()
```

沒有 commit、apply、advance、progression、resolve route 或 mutation API。

### getPostAge22Network()

回傳 deep-frozen 衍生資料：

```javascript
{
  currentGate: {
    resultNodeId: "age-22-career-result",
    terminalNodeId: "vertical-slice-complete",
    playableAfterTerminal: false
  },
  identities: [
    {
      identityId: "...",
      initialRouteIdentity: false,
      futureOnly: true,
      candidateSource: false,
      candidateTarget: true,
      outgoingCandidateEdgeIds: [],
      incomingCandidateEdgeIds: [],
      postAge22RuntimePlayable: false
    }
  ],
  candidateEdges: [],
  postAge22RuntimePlayable: false
}
```

候選邊是深層複製，不與 `CareerSpineContract` 回傳物件共享參照。

### auditPostAge22Network()

回傳 deep-frozen 稽核結果：

```javascript
{
  status: "valid" | "error",
  identityCount: 7,
  candidateEdgeCount: 8,
  issues: []
}
```

缺少 Contract API、Contract 讀取失敗或資料不符合候選契約時，Audit 以 `status: "error"` 回報，不把例外拋給 caller。

## Audit Rules

Audit 至少檢查：

- `CareerSpineContract.getCareerNetwork()` 與 `getCandidateTransitions()` 可用。
- `initialRoutes` 與 candidate transitions 是陣列。
- 初始 route identity 不重複。
- 衍生 identity 不重複。
- candidate edge ID 不重複。
- `currentEndpoint` 存在，result／terminal ID 有效且登錄於成年節點。
- `playableAfterTerminal` 必須是 `false`。
- candidate source／target 必須是非空字串。
- candidate `implemented` 必須是 `false`。
- candidate `eventIds` 必須是空陣列。
- candidate `contractStatus` 必須是 `candidate-only`。
- candidate edge ID 不得與 actual edge ID 碰撞。
- 所有衍生 identity 與整體 Contract 的 `postAge22RuntimePlayable` 必須是 `false`。

## Future Contract vs Current Runtime Contract

4.11 模組不載入 `index.html`，也不由以下 Runtime 消費：

- `player.js`
- `save.js`
- `story.js`
- `script.js`
- `career-save-admission.js`
- Transition／Development Resolver 與 Progression Boundary

它不呼叫 `getCurrentEventId()`、不渲染 UI、不套用 Effects、不推進時間、不讀寫 DOM 或 Storage，也不使用時間與隨機來源。

## Save Admission Boundary

Architecture Sprint 4.10 的 Admission 規則保持不變。下列 future synthetic chapter 仍是 unknown／rejected：

- 職業生涯
- 棒球產業
- 球員再競爭

4.11 不提供 migration、不新增 localStorage key、不改 Save version，也不允許 future identity 被儲存為合法 CareerSpine node。

## Readonly / Determinism Guarantees

兩個查詢 API 都不得：

- 修改 `CareerSpineContract` 回傳內容。
- 修改或替換 Player。
- 清除 forced event 或 pending state。
- 讀寫 Storage。
- 觸發 Save、Render、Effects 或路由推進。

相同 Contract 輸入必須產生相同輸出，且回傳結果所有巢狀物件與陣列皆 frozen。

## Deferred Eligibility Resolver

4.11 不定義何時具備重新交會資格，也不評估能力、健康、市場、關係或玩家選擇。Eligibility Resolver 延後設計。

## Deferred Current Route State

4.11 不新增 `currentCareerRoute`、transition history 或任何等價 Player／Save 欄位。未來若需要保存當前身分，必須另行處理 Schema 與 migration。

## Deferred Career Pause / Exit

`career-pause` 與 `career-exit` 不在既有 4.3 候選來源中，因此不由 4.11 補入。是否需要永久離開、暫停或再進入棒球，留待後續產品設計。

## Deferred Decisions

本 Sprint 明確延後：

- 哪一個二十二歲後事件會首次打開重新交會入口。
- `draft` 是否在未來等同於 `professional`，或應保留為只描述初次選秀來源的歷史身分。
- `player-competition` 成功後如何形成新的正式球員身分。
- 棒球產業是否需要教練、球探、分析、行政等子路線。
- 二十二歲後 chapter、progress、age、Save migration 與 Runtime Resolver。
- 候選邊的條件、事件、Gameplay 代價與結算。

## Test Strategy

Architecture Test Level B 覆蓋：

- 4 個初始路線與 8 條候選邊來源。
- 7 個身分的聯集衍生與角色語意。
- 八條候選邊精確複製但不共享參照。
- draft 缺少出邊與 player-competition 缺少後續的刻意保留。
- current gate 與 future graph 隔離。
- deterministic 與 deep-freeze。
- Contract 與 Player zero mutation。
- Contract API 缺失與讀取錯誤 fail-safe Audit。
- 重複 identity／edge、候選狀態、event IDs、endpoint 與 actual-edge collision 的負向稽核。
- 4.10 Admission 對 future synthetic chapter 的持續拒絕。
- Browser Runtime、Save、Player、DOM、Storage、Resolver、時間與隨機的 source guard。

## Non-Goals

Architecture Sprint 4.11 不實作：

- 22 歲後 Runtime routing。
- Rejoin progression 或 commit boundary。
- 新 CareerSpine node。
- 新 chapter、event ID、選項、Effects、Flag 或 Player Schema。
- Save Schema、Save version 或 Admission 擴充。
- UI、Debug 書籤或 Browser integration。
- Gameplay 的職業、大學、業餘、復健或棒球產業內容。

## Next Sprint Boundary

4.11 完成後只能確認「候選拓樸可被單一來源衍生、稽核且不影響 Runtime」。任何 4.12 規劃都必須等 4.11 技術驗收、人工審查與結案後重新決定；本文件不預先承諾下一個 Sprint 的 Runtime 方向。
