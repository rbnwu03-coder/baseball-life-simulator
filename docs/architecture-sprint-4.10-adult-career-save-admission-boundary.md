# Architecture Sprint 4.10：Adult Career Save Admission Boundary

## Purpose

Architecture Sprint 4.10 validates a normalized candidate before it may replace the live Player.

本 Sprint 在既有 Save／Load 流程中加入單一 admission boundary，封住「不合法成年存檔先成為 live Player，之後才由 Runtime Resolver 發現錯誤」的缺口。核心順序固定為：

```text
Raw Save
→ JSON.parse
→ normalizeSave
→ AdultCareerSaveAdmission.evaluate(candidate)
→ admitted 才替換 live Player
→ 恢復目前事件
```

## Admission Scope

`AdultCareerSaveAdmission` 只回答 normalized candidate 是否可以成為 live Player。它不讀寫 Storage、不修改 candidate、不修改 UI、不執行 Save、不推進事件，也不修復任何欄位。

公開 API 只有：

```javascript
AdultCareerSaveAdmission.evaluate(candidateState)
```

## Normalize vs Admission Responsibility

normalizeSave remains responsible for compatibility defaults; AdultCareerSaveAdmission is responsible for career-state legitimacy.

- `normalizeSave()`：建立 fresh player、合併舊存檔、補 nested defaults、把 `saveVersion` 更新為目前版本。
- `AdultCareerSaveAdmission`：在 normalization 完成後，以現行 Career Contract 判斷人生節點與成年職涯狀態是否合法。

Admission 不負責 migration，也不把不合法狀態改成可接受狀態。

## Career Contract Authority

Admission 的主要權威是：

```javascript
CareerSpineContract.getCareerNetworkSnapshot(candidateState)
CareerSpineContract.getCareerNetwork()
```

章節辨識、年齡、progress 範圍、careerExit、result consistency 與 terminal consistency 均沿用 Contract。Admission 不保存第二份成年 chapter、careerExit、transition event 或 development event registry。

## Adult Node Detection

成年適用範圍由 snapshot 的 `careerStage` 與 Career Network 的 `adultNodes` 共同辨識。每個非 pre-adult snapshot 必須對應到唯一 adult node；無對應或多重對應一律拒絕。

## Pre-adult Bypass

4.10 不是 universal save validator。Contract 可以辨識且 `careerStage === "pre-adult"` 的 normalized candidate 回傳：

```javascript
{
  status: "bypassed",
  admitted: true
}
```

因此少棒、青少棒與高中既有 Save／Load 相容性不會被成年 admission 規則擴張驗證。

## Unknown Chapter Policy

Contract 回傳 `unknown` 時一律 rejected。Unknown chapter 不得被視為 pre-adult，也不得透過 fallback chapter mapping 或 route guessing 放行。

## Transition Resolver Integration

當 adult node 的 `networkRole` 為 `initial-route-and-shared-transition`，Admission 會額外要求：

```javascript
CareerTransitionRuntimeResolver.resolveTransitionRuntime(candidateState).resolved === true
```

Admission 不自行解析 careerExit 或 transitionStep。

## Development Resolver Integration

當 adult node 的 `networkRole` 為 `shared-development`，Admission 會額外要求：

```javascript
CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(candidateState).resolved === true
```

Admission 不自行保存 Development 事件拓樸或 step 規則。

## Result Node Policy

`生涯轉換期小結`、`二十二歲職涯小結` 與 `垂直切片完成` 不會錯套只負責 active runtime chapter 的 Resolver。結果欄位、step、年齡與 completed consistency 由 Career Contract snapshot 驗證。

## Forced Event Policy

`forcedEventId` 是事件覆蓋，不是 Career Spine 節點。Admission 驗證其底層職涯狀態，合法 forced event 不會單獨造成拒絕。Load 成功後仍由既有 Router 維持：

```text
completed
→ forcedEventId
→ chapter route
```

## Admission Result Contract

三種結果皆為 deep frozen、deterministic，且不包含完整 Player copy：

- `admitted`：成年 snapshot 合法，必要 Runtime Resolver 亦成功。
- `bypassed`：可辨識的 pre-adult snapshot，不適用成年驗證但允許讀取。
- `rejected`：unknown、成年 inconsistent、adult node 對應錯誤或必要 Resolver unresolved。

結果保留 `nodeId`、`careerStage`、`networkSegment` 與上游 Contract／Resolver issues。

## Atomic Load Boundary

`loadGame()` 先建立 candidate，再執行 Admission。只有 `admission.admitted === true` 才執行：

```javascript
player = candidate;
```

不採取「先替換再 rollback」。Admission module 缺失時 fail closed。

## Zero-Live-Mutation Guarantee

Rejected adult career saves do not mutate the live Player, main gameplay UI, or stored save.

拒絕時 live Player 的 object identity 與 JSON 內容均保持不變；不會執行 `showCurrentEvent()`。

## UI Side-Effect Boundary

Rejected load 不隱藏 `characterCreation`，不清空 `story` 或 `choices`，也不切換主要遊戲畫面。唯一允許的 UI side effect 是顯示 error notice。

## Storage Boundary

Load 是 read operation。Admission rejected、module unavailable 或 malformed JSON 都不會寫回、修復或刪除 `baseballLifeRpgSave`。`deleteSave()` 仍是唯一明確刪除存檔的使用者操作。

## Legacy Save Compatibility

合法舊存檔先經 `normalizeSave()` 補齊目前預設，再進入 Admission。Pre-adult 舊存檔沿用 bypass；成年舊存檔則必須在 normalization 後符合現行 Career Contract。

## Save Version Boundary

- `SAVE_VERSION`：維持 `13`
- `SAVE_KEY`：維持 `baseballLifeRpgSave`
- Player Schema：不變
- Save snapshot shape：不變
- `saveGame()`：不變
- `deleteSave()`：不變

本 Sprint 沒有 persistent schema migration。

## No-Auto-Repair Policy

Admission 不會：

- 將未知 careerExit 猜成 draft 或 rehab
- clamp transitionStep／developmentStep
- 改寫 age／chapter
- 補造 transition／development result
- 清除 forcedEventId
- 刪除壞存檔

不合法 candidate 只會 rejected。

## Deferred Save Recovery

以下不在 4.10 範圍：

- Save recovery／migration strategy
- 非 Adult 的完整 Save Integrity
- 22 歲 Career Routing 重構
- Adult Career Rejoin
- 22 歲後 playable content
- Resolver／Admission extreme-type defensive hardening

## Test Strategy

專項測試涵蓋：

- pre-adult bypass 與 unknown rejection
- 六個現行 adult nodes
- Transition／Development Runtime Resolver integration
- invalid careerExit、age、step、result 與 terminal consistency
- forced event persistence
- candidate／Contract zero mutation
- result deep freeze 與 determinism
- rejected load 的 Player、UI、Render 與 Storage atomicity
- valid Transition／Development／Result／Terminal load
- malformed JSON 與 admission module unavailable fail-closed
- legacy normalization
- browser script loading order
- Save version、key 與 Player schema guards

既有 Career Contract、Transition、Development、高中三年與垂直切片回歸測試必須維持通過。
