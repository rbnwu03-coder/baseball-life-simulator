# 《棒球人生》Architecture Sprint 4.8

## Development Years Runtime Routing Boundary

## 1. Purpose

Architecture Sprint 4.8 makes CareerSpineContract the authoritative source for Development Years runtime route identity and event topology.

本階段只收斂「發展期」的執行期讀取邊界。它不改寫成年內容、不接管回合推進，也不建立新的職涯路線。現行 Gameplay 仍負責玩家做出選擇、套用效果與完成章節；新的 Resolver 只回答目前 Player 狀態是否能安全對應到既有發展期事件。

## 2. Development Node Eligibility

可進入 Development Years Runtime Resolver 的狀態必須同時符合：

- `player.chapter === "發展期"`
- 年齡符合 Career Spine Contract 的 `development-years.age`
- `careerExit` 精確屬於 Career Network `initialRoutes[].careerExits`
- `developmentStep` 是 Contract 宣告範圍內的整數
- Career Network 只存在一個 `networkRole === "shared-development"` 的成年節點

任一條件不成立時，Resolver 回傳 unresolved，不修補 Player，也不猜測玩家應屬於哪一條路線。

## 3. Authoritative Route Source

成年初始路線只由 `CareerSpineContract.getCareerNetwork().initialRoutes` 判定。判定採精確比對：

- 兩種高卒出口共用 `draft`
- `大學棒球` 對應 `college`
- `業餘／社會人棒球` 對應 `amateur`
- 復健出口對應 `rehab`

空白、未知或同時符合多條路線的 `careerExit` 均為 unresolved。Resolver 不以 `includes()`、文字片段或預設 draft／rehab 代替正式契約。

## 4. Authoritative Event Source

發展期事件順序只由 Career Network 的 `sharedDevelopment.eventIds` 提供，並必須與 `development-years` 節點的 progress 範圍一致。

現行七個事件依序為：

1. `development_daily_life`
2. `development_competition`
3. `development_mentor`
4. `development_body_choice`
5. `development_opportunity`
6. `development_market`
7. `development_decision`

`script.js` 不再保存另一份 hard-coded Development Narrative topology；敘事主軸、連續性與稽核所需的事件清單，皆透過只讀 helper 取得 Contract 的 defensive copy。

## 5. Runtime Resolver Contract

`CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(playerState)`：

- 輸入：現行 Player 狀態物件
- 輸出：deep-frozen 的 resolved 或 unresolved 結果
- 只讀：不修改 Player、不寫入 Flag、不推進事件、不 Render、不 Save
- 決定性：相同 Player 與 Contract 必須得到相同結果

Resolved 結果至少提供：

- `resolved: true`
- `nodeId`
- `routeKey`
- `developmentStep`
- `eventId`

Unresolved 結果至少提供：

- `resolved: false`
- `reason`
- 可供測試與診斷的 Player 狀態摘要

## 6. Chapter, Age and Step Validation

Resolver 在查詢事件前依序驗證：

1. Player 物件存在。
2. Contract 與 Career Network 可用。
3. Shared Development node 唯一。
4. Chapter 與 Contract 相符。
5. Age 是合法整數且落在 20～21 歲範圍。
6. Career exit 能精確辨識唯一 route。
7. Progress field 仍為 `developmentStep`。
8. Step 是合法整數且落在 0～6。
9. Event topology 長度與 progress 範圍一致。

越界 step、錯誤年齡、錯誤 chapter、未知職涯出口或損壞的 Contract topology 都不得被視為合法狀態。

## 7. No Silent Fallback

Invalid Development Years states are unresolved rather than silently reassigned to draft or routed to the age-22 result.

因此：

- `story.js#getCurrentEventId()` 在非法發展期狀態回傳 `null`
- `script.js#getAdultRouteKey()` 在非法發展期狀態回傳 `null`
- 不再以 `development_result` 掩蓋越界 step
- 不再以 draft 或 rehab 掩蓋空白／未知 `careerExit`

這項行為是明確暴露資料錯誤，不是新增失敗結局。

## 8. Runtime Integration

Runtime 整合只有兩個入口：

- `story.js#getCurrentEventId()`：發展期事件 ID 由 Resolver 回傳
- `script.js#getAdultRouteKey()`：發展期 route identity 由 Resolver 回傳

`index.html` 在 `story.js` 與 `script.js` 前載入 Contract 與 Resolver。既有事件物件、選項、效果與顯示函式不依賴 Registry 重新路由。

## 9. Narrative Route Invariant

發展期四條成年入口雖共用同一組七個事件，但 Narrative route identity 必須維持來源路線：

- draft 玩家持續以 draft 文案與人物脈絡呈現
- college 玩家持續以 college 文案與人物脈絡呈現
- amateur 玩家持續以 amateur 文案與人物脈絡呈現
- rehab 玩家持續以 rehab 文案與人物脈絡呈現

Runtime event topology 共用，不代表路線身分被合併。

## 10. Shared Event Invariant

所有合法 route 在相同 `developmentStep` 必須取得相同 event ID；事件內部再依既有 route narrative、Player 狀態與人物關係呈現差異。不得為了路線差異另建平行 development step 或隱藏事件表。

## 11. Forced and Completed Precedence

本 Resolver 只辨識底層發展期節點，不接管全域事件優先順序。現行主路由仍維持：

1. `player.completed` 對應垂直切片完成頁
2. `player.forcedEventId` 暫時覆蓋底層事件
3. 底層 chapter 路由

Resolver 不清除或改寫 forced event，也不把人物回響事件登記成 Career Spine node。

## 12. Mutation Boundary

Architecture Sprint 4.8 does not own developmentStep mutation.

`developmentStep` 仍由既有 `advanceAfterAction()` 寫入；達到既有門檻後仍由 `evaluateDevelopmentYears()` 完成 22 歲結算。Resolver 僅讀取該值，不提供 advance、commit、repair 或 rollback API。

## 13. Save Boundary

本階段：

- 不修改 Player Schema
- 不修改 Save Schema 或版本
- 不修改 localStorage key
- 不新增 migration
- 不將 Resolver 結果寫入存檔

合法舊存檔若原本包含有效 chapter、age、careerExit 與 developmentStep，讀檔後維持原事件路由。缺少正式路線身分的非法舊狀態會被明確回報 unresolved，不再靜默分派。

## 14. Age-22 Result Boundary

`二十二歲職涯小結` 與 `development_result` 仍是獨立的既有結果節點。只有既有 `evaluateDevelopmentYears()` 完成七個發展期回合後，才會把 Player 推進到該結果章。

Resolver 不把 step 越界視為已完成，也不自行切換章節或年齡。

## 15. Deferred Development Progression

以下內容明確延後，不屬於 Sprint 4.8：

- 發展期回合寫入邊界
- `developmentStep` 的 commit／atomicity
- 22 歲後新節點
- 成年路線重新交會
- 新增職涯出口
- Save migration
- 成年事件內容或 Gameplay 平衡

## 16. Test Matrix

專項測試至少覆蓋：

- 五種合法 career exit × 七個合法 step
- 兩種高卒出口皆精確映射 draft
- 四條 route 共用 event topology，但保留 route identity
- chapter、age、careerExit、step 非法時 unresolved
- forced event 與 completed 優先順序不變
- 22 歲結果頁維持既有路由
- Resolver deep-freeze、determinism 與 zero mutation
- `story.js` Runtime Event 與 `script.js` Narrative Route 一致
- Contract defensive copy 不可反向修改 Registry
- Player Schema、Save version、localStorage key 與既有 Gameplay 不變
