# Architecture Sprint 4.4：Graduation Transition Resolver Contract

## Purpose

本 Sprint 在 Architecture Sprint 4.3 的唯讀成年職涯網路契約上，建立一個單一、純函式且可測試的高中畢業入口解析器。它只回答「目前合法的高中畢業結果，對應到哪個既有成年職涯入口」，不推進遊戲。

> Architecture Sprint 4.4 does not perform the runtime adult-career transition.

> It resolves which transition would be legal.

## Authoritative Input

權威輸入是現有 `CareerSpineContract.getCareerNetworkSnapshot(state)` 能辨識的 `high-school-career-exit` 狀態：

- `chapter` 必須是「青棒生涯出口」。
- `age` 必須是 18。
- `criticalYearStep` 必須是 8。
- `criticalYearResult` 與 `criticalYearDetail` 必須存在。
- `careerExit` 必須由現有 Contract 認可。
- `completed` 不可錯置。
- 交接時不可殘留 `forcedEventId`。

高中出口的 Gameplay 寫入仍由 `script.js:evaluateCriticalYear()` 負責；本 Sprint 沒有改寫該流程。

## Resolver Contract

檔案：`career-transition-resolver.js`

API：

```javascript
GraduationTransitionResolver.resolveGraduationTransition(graduationState)
```

Resolver 先使用 4.3 Snapshot 驗證畢業狀態，再從 `getCareerNetwork().initialRoutes` 找出唯一對應路線，並透過 Snapshot 的 `actualNextNodeIds` 驗證成年入口節點。Resolver 沒有自己的成年路線清單。

## Legal Outputs

成功結果：

```javascript
{
  status: "resolved",
  resolved: true,
  source: {
    nodeId,
    chapter,
    age,
    careerExit
  },
  target: {
    nodeId,
    chapter,
    routeKey,
    entryEventId
  },
  issues: []
}
```

目前合法輸出全部導向 4.3 Contract 的 `career-transition` 節點，再由該 Contract 提供的 route 與第一個專屬事件區分高卒、大學、業餘／社會人與復健入口。兩種高卒出口共用同一個正式成年入口。

## Invalid / Unresolved Behavior

以下狀態會回傳 `status: "unresolved"`、`resolved: false`、`target: null` 與明確 issue：

- 輸入缺失或不是物件。
- chapter、年齡、step、結果欄位或 `careerExit` 不合法。
- 畢業結果與目前 chapter 互相矛盾。
- `careerExit` 找不到唯一 Contract route。
- 成年下一節點不存在或不具備入口職能。
- 路線沒有第一個專屬入口事件。
- 畢業交接點仍殘留 `forcedEventId`。

Resolver 不會把任何非法狀態默認為 draft、college、amateur 或 rehab。

## Readonly Guarantee

Resolver：

- 不修改輸入 snapshot。
- 不修改全域 `player`。
- 不修改 `CareerSpineContract` 或其回傳網路。
- 不寫入 Save 或 Storage。
- 不呼叫 UI、Effects、路由或時間推進。
- 不使用 RNG 或系統時間。

成功與失敗輸出皆經深層凍結，供呼叫端以唯讀結果使用。

## Mutation Boundary

本 Sprint 的 mutation boundary 停在 Resolver 外。解析結果只描述合法目標，不會：

- 寫入 `player.chapter`、`careerExit` 或任何目前路線欄位。
- 清除 `forcedEventId`。
- 觸發 `showStory()` 或 `showCurrentEvent()`。
- 建立新 Save Schema 或 migration。
- 執行成年入口事件。

未來若要真正進入成年路線，必須由另一個經授權的 runtime transition flow 接收 resolved result 並負責寫入；不得把 mutation 偷放回 Resolver。

## Deferred Runtime Integration

本 Sprint 延後：

- 將 Resolver 接入 `choose()` 或任何故事路由。
- 新增目前成年路線欄位與 Save migration。
- 建立 22 歲後正式節點。
- 擴寫成年劇情、大學四年、職棒球季、業餘聯盟或復健內容。
- 建立成年路線重新交會。

上述事項必須另立 Sprint，先確定 mutation ownership 與 Save 相容策略。

## Test Coverage

`tests/career-transition-resolver-test.js` 驗證：

- 五種合法高中出口都得到唯一合法成年入口。
- resolved target、route 與 entry event 均來自 4.3 Contract。
- 缺失、未知、矛盾、格式錯誤與未穩定狀態均明確 unresolved。
- 相同輸入得到相同輸出。
- 輸入、全域 Player 與成年 Contract 在解析前後完全相同。
- Resolver 沒有 RNG、時間、UI、Storage、Save 或 Gameplay 路由依賴。
- 4.3 Contract、Gameplay、Save 與 UI 檔案不因本 Sprint 改動。

原有 `tests/career-network-contract-test.js` 必須持續通過，確保 Resolver 沒有改變 Architecture Sprint 4.3 的 readonly guarantee。
