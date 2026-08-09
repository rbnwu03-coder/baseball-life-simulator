# 《棒球人生》Architecture Sprint 4.9

## Development Years Progression Boundary

## 1. Purpose

Architecture Sprint 4.9 建立發展期唯一的正常 Gameplay 寫入邊界，讓 Architecture Sprint 4.8 的只讀事件解析與 `developmentStep` 推進形成對稱契約。

Architecture Sprint 4.9 makes CareerDevelopmentProgression the sole normal-gameplay owner of developmentStep advancement.

本階段不新增成年事件、不改寫路線、不改變市場結算，也不建立跨章節通用推進控制器。

## 2. Progression Mutation Owner

正式 API：

```javascript
CareerDevelopmentProgression.advanceDevelopment(playerState, completedEventId)
```

正常 Gameplay 中，發展期由 step 0 前進到 step 7 的唯一正式寫入者是 `CareerDevelopmentProgression`。`script.js` 不再直接執行 `player.developmentStep += 1`。

`enterDevelopmentYears()` 將 `developmentStep` 初始化為 0，以及 Debug／測試建立指定狀態，不屬於正常 Gameplay 的加一責任。

## 3. Current Event Authority

Progression Boundary 第一個路由判斷必須呼叫：

```javascript
CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(playerState)
```

只有 Resolver 回傳 `status: "resolved"` 且 `resolved: true`，才可能前進。

A Development event may advance progression only when it matches the current event resolved by Architecture Sprint 4.8.

Boundary 不自行解析 `careerExit`，也不保存第二份發展期事件表。

## 4. completedEventId Authorization

`completedEventId` 必須是非空字串，且精確等於 Resolver 回傳的 `eventId`。前一幕、下一幕、生涯轉換事件、未知事件與缺少事件 ID 全部 rejected。

合法完成後 Resolver 會改為解析下一幕，因此重送舊事件自然被拒絕，不新增 nonce、token 或 last-event Player 欄位。

## 5. Choice Preflight

`choose(eventId, index)` 在「生涯轉換期」既有保護之外，新增「發展期」的 current-event authorization。

執行順序保持：

1. `isTransitioning` guard。
2. `getCurrentEventId()` 與 requested event 比對。
3. event／choice lookup。
4. Gameplay effects、flags、relationships、memories、Narrative 與 continuity。
5. `advanceAfterAction(decisionContext, completedEventId)`。

因此 stale、wrong 或被 forced event 覆蓋的底層發展期事件，在任何 Player Gameplay mutation 前就會被拒絕。

## 6. Authorized Mutation

Boundary 唯一允許修改：

```text
developmentStep: previousStep → previousStep + 1
```

它不修改 chapter、age、careerExit、organizationRole、marketOutcome、developmentResult、developmentDetail、roleIdentity、careerArc、narrativeThread、flags、relationships、memories、abilities、body 或 careerValue。

## 7. Writable Safety

寫入前必須確認 `developmentStep` 是 Player 的 own data property，且 descriptor 的 `writable` 為 `true`。

以下狀態全部 rejected：

- 欄位不存在。
- non-writable data property。
- accessor property。
- descriptor 讀取失敗。
- 寫入意外失敗。

Accessor setter 不會被呼叫。失敗不 throw 到 Gameplay caller，並維持 zero mutation。

## 8. Wrong Event Behavior

缺少、未知、前一幕、下一幕、生涯轉換事件或任何不等於 Resolver current event 的 ID 均回傳 deeply frozen rejected result：

```javascript
{
  status: "rejected",
  advanced: false,
  routeKey: null,
  completedEventId,
  previousStep: null,
  nextStep: null,
  settlementRequired: false,
  issues: []
}
```

Rejected path 不修改 Player。

## 9. Repeat Event Behavior

第一次合法事件只前進一格。再次送出相同事件時，4.8 Resolver 已指向下一個 event，因此 equality authorization 失敗，不會重複套用 effects、Narrative 或 progression。

## 10. Forced Event Behavior

當 `player.forcedEventId` active 時，Boundary 拒絕底層發展期 progression。

`getCurrentEventId()` 仍維持既有 precedence：

1. completed；
2. forcedEventId；
3. chapter route。

合法 forced event 仍使用既有 `resumeAfterPending` 回到底層事件，forced event 本身不推進 `developmentStep`。

## 11. Contract-derived Terminal Detection

Terminal 判定來自：

```text
CareerSpineContract.getCareerNetwork()
  .sharedDevelopment.eventIds
```

Boundary 同時驗證：

- 唯一 shared-development node。
- Resolver node 與 Contract node 相同。
- progress field 是 `developmentStep`。
- progress min／max 為合法整數範圍。
- shared event count 與 progress 範圍相等。

程式不以 magic number 7 作為 Architecture 判定。現行 Contract 的結果仍是 step 6 完成後寫入 step 7，並回傳 `settlementRequired: true`。

## 12. Settlement Boundary

evaluateDevelopmentYears remains outside the Progression Boundary.

Boundary 只回報是否需要結算；`script.js#advanceAfterAction()` 只在 `advanced: true` 且 `settlementRequired: true` 時呼叫既有 `evaluateDevelopmentYears()`。

既有結算仍負責：

- 市場分數與市場出口。
- `developmentResult` 與 `developmentDetail`。
- `age = 22`。
- `chapter = "二十二歲職涯小結"`。

最後事件重送不會再次結算。

## 13. Zero-Mutation Guarantee

Wrong event、repeat event、forced state、unresolved runtime、invalid chapter／age／careerExit／step、Contract inconsistency、non-writable、accessor 與 write failure 均 rejected、no throw，且 Player zero mutation。

成功與失敗結果及其 `issues` 均 deep frozen。

## 14. Runtime Integration

瀏覽器依賴順序：

```text
CareerSpineContract
→ CareerDevelopmentRuntimeResolver
→ CareerDevelopmentProgression
→ story.js
→ script.js
```

`advanceAfterAction(decisionContext, completedEventId)` 沿用既有第二個參數，不新增 progression token 或其他 Player 狀態。

## 15. Save Boundary

本 Sprint 不修改：

- Player Schema。
- Save Schema。
- `SAVE_VERSION`。
- migration。
- localStorage key。

既有整體 Player 存檔自然保存原有 `developmentStep`。

## 16. 22-Year Boundary

本 Sprint 只保證最後合法 Development event 可安全到達既有「二十二歲職涯小結」與 `development_result`。

22 歲結果頁的 route identity、`getAdultRouteKey()` 非 Development fallback 與 22 歲後內容均不在本階段重構。

## 17. Deferred Route Identity

延後處理：

- 22 歲 Career Routing。
- Adult Career Rejoin。
- 非 Development 的舊 `getAdultRouteKey()` fuzzy fallback。
- Save／Load State Integrity 專項重構。
- 其他章節的 progression ownership。

## 18. Test Strategy

專項測試覆蓋：

- 5 個 careerExit × 7 個 Development steps，共 35 個合法 progression cases。
- 四條 route 的 wrong、repeat 與 forced event。
- invalid chapter、age、careerExit 與 step。
- non-writable、accessor、setter 與意外 write failure。
- deterministic、deep-frozen 與 zero-mutation 契約。
- stale／wrong Runtime choice 在 effects 前拒絕。
- forced event 完成後回到底層且不耗 Development step。
- draft、college、amateur、rehab terminal settlement exactly once。
- Browser module load order。
- Player／Save schema 與 Contract／Resolver topology 不變。
