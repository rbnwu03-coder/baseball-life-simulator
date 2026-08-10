# Architecture Sprint 4.12：Age-22 Career Outcome Classification Boundary

## Purpose

Architecture Sprint 4.12 將現行二十二歲八種職涯結算轉為穩定、可儲存、可驗證的 machine-readable outcome code。它不新增第九種結果，不改市場分數公式，也不決定二十二歲後重新交會資格。

## Existing Eight Outcomes

| 初始路線 | 條件 | outcome code | current identity | 既有顯示結果 |
|---|---|---|---|---|
| `draft` | `marketScore >= 12` | `professional-competitive` | `professional` | 一軍短期升格／正式名單競爭 |
| `draft` | `marketScore < 12` | `professional-roster-risk` | `professional` | 二軍續留邊緣／球團耐心下降 |
| `college` | `marketScore >= 11` | `college-draft-window` | `college` | 大卒選秀追蹤名單 |
| `college` | `marketScore < 11` | `college-uncertain` | `college` | 大學主力／落選風險並存 |
| `amateur` | `marketScore >= 10` | `amateur-professional-window` | `amateur` | 晚成選秀／職業測試邀請 |
| `amateur` | `marketScore < 10` | `amateur-stable` | `amateur` | 業餘主力與穩定工作 |
| `rehab` | `injuryRisk <= 4` | `rehab-player-reentry` | `rehab` | 復出測試／業餘隊邀請 |
| `rehab` | `injuryRisk > 4` | `rehab-second-career` | `rehab` | 持續復健／轉向第二角色 |

八組 `marketOutcome`、`developmentResult` 與 `developmentDetail` 均保持 4.11 基線文字，不進行文案修改。

## Machine-Readable Outcome Codes

`CareerAge22OutcomeResolver` 是 outcome code、current identity、分類門檻與既有結果文字的唯一 production source。公開 API 為：

```javascript
CareerAge22OutcomeResolver.resolve({ careerExit, marketScore, injuryRisk })
CareerAge22OutcomeResolver.resolveLegacyOutcome({ careerExit, marketOutcome })
CareerAge22OutcomeResolver.validatePersistedOutcome(candidate)
```

所有成功與失敗結果均 deterministic、deep frozen；無效輸入回傳 `status: "unresolved"`，不向 Gameplay caller throw。

## Current Identity Semantics

`currentIdentity` 描述二十二歲結算當下的職涯身分。它是 Resolver result 的衍生資料，不是新的 Player 欄位。

> `age22OutcomeCode` is persistent; `currentIdentity` is derived and is not duplicated into Player state.

Mapping 固定為：

- 兩個高卒出口：`professional`
- 大學棒球：`college`
- 業餘／社會人棒球：`amateur`
- 復健與生涯暫停：`rehab`

## Initial Route vs Current Identity

CareerSpineContract 的 `draft` 是十八歲初始入口身分；二十二歲時兩個高卒出口的當前身分是 `professional`。這兩者不是重複欄位，而是不同時間點的語意。

## Draft → Professional Semantic Binding

> `draft` is the age-18 initial route identity; `professional` is the age-22 current identity for both high-school draft exits. Architecture Sprint 4.12 does not fabricate a draft-to-professional candidate or actual edge.

這項語意綁定只存在於二十二歲分類結果，不修改 4.3 actual／candidate edge，也不修改 4.11 future topology。

## CareerSpineContract Route Authority

Resolver 不使用 `startsWith("高卒")`，也不保存第二份 careerExit registry。它從：

```javascript
CareerSpineContract.getCareerNetwork().initialRoutes
```

取得 `routeKey` 與 `careerExits`，使用 exact membership mapping。空白、物件、陣列、未知或多重對應均 unresolved。

## Market Score Ownership

市場分數仍由 `script.js` 的 `evaluateDevelopmentYears()` 使用既有公式計算：

```javascript
scoutEvaluation
+ recentPerformance
+ reputation
+ Math.floor(exposure / 2)
+ Math.max(getPositionCareerValue(), getOffensiveCareerValue())
- body.injuryRisk
```

Resolver 只接收已算好的 `marketScore`，不複製守位或打擊價值公式。

## Classification Threshold Ownership

`draft 12`、`college 11`、`amateur 10` 與 `rehab injuryRisk 4` 的 production 分類門檻只存在於 `career-age22-outcome-resolver.js`。`script.js` 不再保存八分支門檻。

復健路線維持既有 Gameplay semantics：結果只依 `injuryRisk` 分類，`marketScore` 不改寫復健結果。

## Outcome Text Ownership

Resolver 同時產生 outcome code 與三個既有顯示欄位，避免機器結果與玩家看到的結果分離。Runtime classification 不解析中文文字；中文 canonical mapping 只允許在 v13→v14 migration-only API 使用。

> Runtime age-22 classification never parses localized result text. Canonical text matching exists only for v13→v14 migration.

## Resolver Result Contract

成功結果包含：

```javascript
{
  status: "resolved",
  resolved: true,
  routeKey,
  currentIdentity,
  outcomeCode,
  marketOutcome,
  developmentResult,
  developmentDetail,
  definition,
  issues: []
}
```

失敗結果為 `resolved: false`，包含可稽核 issue，不猜測 draft／rehab 或任何低階結果。

## Readonly Guarantee

Resolver 不接收完整 Player，不修改輸入物件、不修改 CareerSpineContract，不讀寫 DOM、Storage 或 Save，不依賴 Runtime Resolver、Progression、RNG 或時間。

## Settlement Integration

`evaluateDevelopmentYears()` 仍是既有 settlement owner：

1. 使用原公式計算 `marketScore`。
2. 呼叫 `CareerAge22OutcomeResolver.resolve()`。
3. unresolved 時 fail closed，不製造結果。
4. resolved 後寫入 age、`age22OutcomeCode` 與既有結果欄位。
5. 維持 `evaluateMarket()`、`updateCareerValue()` 與 `二十二歲職涯小結`。

Resolver 不成為新的 Player mutation owner。

## Persistent age22OutcomeCode

Player 只新增：

```javascript
age22OutcomeCode: ""
```

結果尚未發生時保持空字串。二十二歲小結與完成頁必須具有符合 careerExit 與三個顯示欄位的合法 code。

## Why currentIdentity Is Not Persisted

`careerExit + age22OutcomeCode` 已足以導出 current identity。若另存 current identity，存檔可能出現 code 與 identity 矛盾，因此 4.12 不新增 `currentCareerIdentity`、`currentIdentity` 或 `adultCareerIdentity`。

## Save Version 14

- `SAVE_VERSION`：13 → 14
- `SAVE_KEY`：維持 `baseballLifeRpgSave`
- `saveGame()`：維持儲存完整 Player snapshot
- `deleteSave()`：不變

這是因 `age22OutcomeCode` 成為 persistent field 而產生的正式 schema version change。

## v13 → v14 Migration

Migration 只處理 v13→v14，不建立 generic framework。`normalizeSave()` 先保留來源版本，再建立 fresh candidate 與既有 nested defaults。

- v13、尚未二十二歲：`age22OutcomeCode = ""`。
- v13、合法二十二歲小結或完成頁：使用既有 `careerExit + marketOutcome` 進行一次 migration-only mapping。
- 無法唯一對應、路線矛盾或未知文字：不猜測，保留空 code，交由 Admission 拒絕。
- 不重算歷史 marketScore，不重跑 `evaluateMarket()` 或 `updateCareerValue()`。
- Load 不把 normalized snapshot 自動寫回 Storage。

## Legacy Text Mapping Is Migration-Only

八個 canonical `marketOutcome` 的中文 mapping 只存在 `resolveLegacyOutcome()`。它同時驗證 careerExit 所屬 route family，避免大學出口被錯誤映射為 professional code。

## Save Admission Consistency

`AdultCareerSaveAdmission` 在 candidate 成為 live Player 前執行：

- 非二十二歲結果節點若提前帶有 code：rejected。
- 二十二歲結果缺少或帶未知 code：rejected。
- careerExit 與 code family 矛盾：rejected。
- code 與三個既有顯示文字矛盾：rejected。
- 合法 v14 與合法遷移後 v13：admitted。

既有 `parse → normalize → admission → player assignment` 順序與 rejected load 的 zero-live-mutation／Storage unchanged 契約保持不變。

## No Eligibility Policy

> Age-22 outcome classification does not determine candidate-edge eligibility.

`college-draft-window`、`amateur-professional-window`、`professional-roster-risk` 或 `rehab-player-reentry` 不會因此解鎖候選邊。Resolver 不回傳 `eligibleEdges`、`nextRoutes` 或 `availableChoices`。

## Rehab Second-Career Topology Gap

`rehab-second-career` 保留「轉向第二角色」結果，但 4.11 graph 仍沒有 `rehab → baseball-industry`。4.12 只記錄此缺口，不新增 edge、chapter 或 event。

## Future Career Rejoin Boundary

CareerRejoinContract 保持不變。4.12 的 current identity 不是 Graph transition，也不讓 future identity 成為可玩節點或合法 Save chapter。

## Deferred Work

- Post-Age-22 Eligibility Resolver
- Career Rejoin Commit／Progression／Runtime
- rehab second-career topology reconciliation
- professional／amateur transition policy
- player-competition next destination
- 二十二歲後 chapter、event 與 actual edge
- generic migration framework 與 Save recovery

## Test Strategy

Architecture Test Level B+ 驗證：

- 八種結果與所有精確門檻。
- 五個 careerExit 與 Contract exact mapping。
- 既有三組顯示文字不變。
- current identity 衍生語意。
- invalid input、readonly、determinism 與 deep freeze。
- v13→v14 migration、路線矛盾與 unknown legacy text。
- v14 missing／unknown／route mismatch／text mismatch。
- 四路線實際 settlement 與 terminal progression。
- Admission、atomic load、Storage unchanged 與 Browser module order。
- CareerSpineContract、CareerRejoinContract、actual edge、事件與 UI 不變。
