# Architecture Sprint 4.6：Adult Transition Runtime Routing Boundary

## Purpose

本 Sprint 建立「生涯轉換期」唯一的唯讀 Runtime route／event 解析邊界。它不新增成年內容、不推進回合，也不修改 Player；只根據現有 Player 狀態與 Architecture Sprint 4.3 的成年職涯網路契約，回答玩家目前位於哪條成年入口路線與哪一幕事件。

> Architecture Sprint 4.6 makes the Adult Career Network Contract the authoritative source for runtime transition route and event resolution.

> Runtime invalid states are unresolved rather than silently reassigned to draft or rehab.

## Authoritative Routing Source

唯一 topology 來源是：

```javascript
CareerSpineContract.getCareerNetwork()
```

Runtime Resolver 讀取 `adultNodes` 中的生涯轉換節點，以及 `initialRoutes` 提供的：

- `careerExits`
- `routeKey`
- `exclusiveEventIds`
- `sharedEventIds`

Resolver 本身沒有複製 draft、college、amateur、rehab 的事件陣列，也沒有另建 careerExit mapping。

## Runtime Resolver Contract

檔案：`career-transition-runtime-resolver.js`

正式 API：

```javascript
CareerTransitionRuntimeResolver.resolveTransitionRuntime(playerState)
```

成功輸出：

```javascript
{
  status: "resolved",
  resolved: true,
  nodeId,
  routeKey,
  transitionStep,
  eventId,
  issues: []
}
```

失敗輸出：

```javascript
{
  status: "unresolved",
  resolved: false,
  nodeId: null,
  routeKey: null,
  transitionStep: null,
  eventId: null,
  issues: [...]
}
```

成功與失敗結果皆深層凍結。

## Route Identity

`careerExit` 必須精確出現在 Contract 某一條 `initialRoutes[].careerExits`，且只能匹配一條 route。兩種高卒出口都由 Contract 指向 draft；大學、業餘／社會人、復健與生涯暫停則分別指向 college、amateur、rehab。

缺失、空白、未知、物件或陣列型態的 `careerExit` 都不會被重新指派至任何路線。

## Event Resolution

目前 route 的完整五幕 sequence 由：

```text
exclusiveEventIds + sharedEventIds
```

組成。Resolver 使用 `transitionStep` 直接索引該 Contract sequence，不使用自己的事件清單，也不以第一幕或結算事件作為 fallback。

## Chapter Eligibility

Runtime Resolver 只接受 Contract 所辨識的「生涯轉換期」chapter。青棒生涯出口、生涯轉換期小結、發展期、二十二歲小結與其他 chapter 都回傳 unresolved。

## Transition Step Validation

合法 `transitionStep` 必須：

- 為 integer。
- 大於等於 0。
- 小於目前 Contract route 的事件數量。

負數、越界、浮點數、字串、`null`、`undefined` 與 `NaN` 均 unresolved；Resolver 不 clamp、不轉型、不採用預設 step。

## No-Silent-Fallback Rule

Live Runtime 不再把非法 `careerExit` 默認成 draft 或 rehab。`story.js#getCurrentEventId()` 在生涯轉換期收到 unresolved 結果時回傳 `null`，並沿用既有 `showStory()` 的「找不到下一個事件」安全呈現，不新增 Error UI。

Architecture Sprint 4.3 的 Snapshot 可繼續回報既有 compatibility expectation 與 inconsistency；4.6 的 live runtime routing 採用更嚴格的 explicit unresolved 契約。

## Runtime Integration

`story.js#getCurrentEventId()` 保留既有最高優先順序：

```text
completed
→ forcedEventId
→ chapter routing
```

只有真正進入「生涯轉換期」chapter branch 時，才呼叫 Runtime Resolver。原本位於 `story.js` 的四條成年 sequence 已移除。

## Narrative Route Invariant

`script.js#enterCareerTransition()` 在 4.5 Commit 成功後，使用 Runtime Resolver 的 `routeKey` 初始化 `adultNarrativeChains`。`getAdultRouteKey()` 在生涯轉換期也改由 Runtime Resolver 提供 route identity；發展期與二十二歲既有判定暫時保留。

本 Sprint 建立下列 invariant：

```text
CareerSpineContract route
= Runtime Resolver route
= Narrative route
= getCurrentEventId() event route
```

## Forced Event Precedence

`forcedEventId` 仍由 `getCurrentEventId()` 在 chapter routing 前處理。Runtime Resolver 不讀取、清除或管理 forced event；測試會同時確認底層 transition event 仍可解析，以及畫面仍優先顯示 forced event。

`completed=true` 仍維持最高優先並回傳 `slice_complete`。

## Mutation Boundary

Runtime Resolver 不修改：

- `player`
- `chapter`
- `careerExit`
- `transitionStep`
- `forcedEventId`
- Career Spine Contract
- Narrative State
- UI 或 DOM

它不使用 RNG、系統時間、Storage、Save、Effects 或 Render。

## Save Boundary

本 Sprint 不修改 Player Schema、Save Schema、`SAVE_VERSION`、localStorage key、normalize 或 migration，也不新增 persistent adult route 欄位。成年 route 繼續由既有 Player snapshot 加 Contract 衍生。

## Deferred Progression Ownership

以下事項不屬於 4.6：

- `transitionStep += 1` 的 mutation ownership。
- `advanceAfterAction()`、`choose()` 與 Outcome progression 重構。
- 發展期與二十二歲 route 判定重構。
- 成年路線重新交會。
- 新成年事件、內容或 Save migration。

## Test Matrix

`tests/career-transition-runtime-resolver-test.js` 驗證：

- 五個畢業出口乘五個合法 step，共 25 個 legal matrix cases。
- routeKey、transitionStep、eventId 與 Contract 完全一致。
- invalid careerExit、invalid step 與 wrong chapter 全部 unresolved。
- Player 與 Contract zero mutation。
- resolved／unresolved 結果深層 readonly。
- Contract、Runtime Resolver、Narrative 與 `getCurrentEventId()` 的完整矩陣 invariant。
- forced event 與 completed precedence。
- `story.js` 不再保存 duplicated adult transition topology。
- Player、Save、4.3 Contract、4.4 Resolver、4.5 Commit 與 progression ownership 保持不變。
