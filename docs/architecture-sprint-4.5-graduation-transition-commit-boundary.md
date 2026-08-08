# Architecture Sprint 4.5：Graduation Transition Commit Boundary

## Purpose

本 Sprint 在 Architecture Sprint 4.4 的純解析器之外，建立高中畢業狀態進入既有成年生涯轉換期的唯一 runtime commit boundary。它只負責提交已被 Resolver 證明合法的最小狀態變更，不重新判斷職涯出口，也不建立新的成年路線資料。

> Architecture Sprint 4.5 authorizes the runtime graduation-to-adult career-state commit.

> It does not introduce a new persistent adult-route source of truth.

## Authorized Mutation

檔案：`career-transition-commit.js`

正式 API：

```javascript
CareerTransitionCommitBoundary.commitGraduationTransition(playerState)
```

此 API 先呼叫：

```javascript
GraduationTransitionResolver.resolveGraduationTransition(playerState)
```

只有 Resolver 回傳 `status: "resolved"`、`resolved: true` 且具有合法 `target.chapter` 時，才會一次套用：

```javascript
{
  chapter: resolution.target.chapter,
  transitionStep: 0
}
```

`chapter` 必須來自 4.4 Resolver 的 target；Commit Boundary 不寫死成年章節，也不複製成年 route registry。

## Preserved Historical State

成功提交不會改寫下列畢業歷史與 Player 狀態：

- `careerExit`
- `age`
- `criticalYearStep`
- `criticalYearResult`
- `criticalYearDetail`
- `completed`
- 能力、人格與技能
- NPC 關係、印象與人物弧線
- 身體、疲勞與傷病
- flags、memories、callbacks 與 consequences
- Save version、localStorage key 與其他持久欄位

本 Sprint 沒有新增 `careerRoute`、`currentCareerRoute`、`adultRoute`、`careerTransitionHistory` 或其他第二套路由來源。

## Rejection Behavior

以下狀態會回傳 `status: "rejected"`、`committed: false`、`target: null`，且 Player 在呼叫前後必須深層相同：

- 輸入不是可寫入物件。
- 4.4 Resolver 不可用或解析失敗。
- 畢業 chapter、年齡、step、結果或 `careerExit` 不合法。
- 畢業交接點殘留 `forcedEventId`。
- Resolver 沒有提供合法 target chapter。
- 相同畢業狀態已提交，因 chapter 已不再是高中生涯出口而再次呼叫。

Commit Boundary 不會清除 `forcedEventId`，也不會為失敗狀態套用 fallback route。

## Runtime Integration Order

`script.js:enterCareerTransition()` 的執行順序為：

1. 呼叫 `commitGraduationTransition(player)`。
2. 若 `committed !== true`，立即回傳，不執行任何既有入口副作用。
3. 提交成功後，才執行原有 `applyChapterBreather()`。
4. 依既有 `careerExit` 初始化成年 Narrative Thread。
5. 依既有規則建立初始 `roleIdentity` 與 `careerArc.stage`。
6. 更新既有 `careerValue`。
7. 顯示原有入口通知。
8. 呼叫 `showCurrentEvent()`。

因此，驗證失敗不再先改變壓力、疲勞、倦怠、人物角色、市場價值、敘事執行緒或畫面；成功流程則保留既有入口副作用與呈現順序。

## Runtime Routing Invariant

成功提交後，現行 `story.js:getCurrentEventId()` 必須與 Resolver target 一致：

```javascript
getCurrentEventId() === resolution.target.entryEventId
```

目前五種合法出口對應：

| 高中畢業出口 | Route | 成年入口事件 |
|---|---|---|
| 高卒選秀・中後段指名候選 | draft | `transition_draft_day` |
| 高卒選秀・落選／培訓測試 | draft | `transition_draft_day` |
| 大學棒球 | college | `transition_college_arrival` |
| 業餘／社會人棒球 | amateur | `transition_amateur_job` |
| 復健與生涯暫停 | rehab | `transition_rehab_plateau` |

這項整合沒有改寫 `getCurrentEventId()`、事件 ID、成年事件順序或重新交會位置。

## Save Compatibility

本 Sprint 沒有修改 Player Schema、Save Schema、`SAVE_VERSION`、localStorage key 或 migration。`chapter` 與 `transitionStep` 都是既有持久欄位，提交後仍由原本「儲存整個 Player snapshot」的方式自然保存。

舊存檔不會被自動重新提交。只有玩家位於合法的「青棒生涯出口」狀態，並在畫面上選擇進入十八歲生涯轉換期時，才會觸發 Commit Boundary。

## Test Coverage

`tests/career-transition-commit-test.js` 驗證：

- 五種合法出口都能提交且路由到正確第一個成年事件。
- 成功提交只修改 `chapter` 與 `transitionStep`。
- `careerExit`、年齡、高三結果與其他 Player 狀態保持不變。
- 非法、未解析與 forced-event 狀態為零 mutation。
- 連續提交兩次時，第二次被拒絕且不再修改狀態。
- Commit 結果為深層 readonly。
- `enterCareerTransition()` 只在提交成功後執行既有副作用。
- Commit Boundary 沒有 RNG、時間、Storage、Save、UI 或 Render 依賴。
- Player Schema、Save、4.3 Contract 與 4.4 Resolver 保持不變。
- 瀏覽器載入順序為 Contract → Resolver → Commit → Runtime。

既有 Resolver、Career Network、Career Spine、高中三年、成年事件鏈與垂直切片測試必須持續通過。

## Deferred Items

本 Sprint 明確延後：

- 22 歲後新章節與可玩節點。
- 大學轉職業、業餘轉職業、職業釋出與復健復出。
- 成年路線轉換歷史與目前路線新欄位。
- 大學四年、職棒球季、業餘聯盟、復健與棒球產業內容。
- 成年 route topology、事件內容、Effects、選項與數值平衡修改。
- Save migration 或新 Save version。

Architecture Sprint 4.5 完成後必須停止；Architecture Sprint 4.6 需在 4.5 結案後重新規劃。
