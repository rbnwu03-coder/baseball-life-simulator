# Defensive Play Foundation 1.2 — Defensive Decision & Throw Resolution

## 基線與範圍

施工前 `main` / HEAD / origin/main：`54b4886e1ec046fc7753f8a8afd492e8f2673174`，ahead / behind 0 / 0、working tree clean。
不 commit、不 push；未開始 1.3、SS Vertical Slice、polished UI。

本輪接在 Physical → Opportunity → active defender → Reach → Secure 之後。
新 foundation 停在 Decision / Throw physical facts，不產生 runner safe/out、run、error、fielder's choice 或 evaluator grade。

## 既有邏輯與遷移邊界

- `SECOND_BASE_ROUTE_DEFINITIONS`、`generateInfieldLegalChoices`、`evaluateDefensiveRouteAvailability` 已有二壘 route、window、legal/viable、receiver chain。
- `resolveSecondBaseInitiatedRoute` 已有 control、transfer、firstThrow、fallbackRelease 與後續隊友結果；1.1 已保存 control / Secure。
- 既有玩家選擇發生在 control 解析前。因此保留為 pre-control intent，**不是宣稱那個時點已持有球**。控球成功後才 admission 為新 controlled selection；控球失敗只有 `noControlledDecision`，沒有新 throw。
- ordinary 2B 第一傳使用 compatibility projection，不追加 generic Throw RNG，不更改 control / transfer / throw 公式。
- bobble reassessment 保存最初 selection、實際 activeSelection，投影實際 `fallbackRelease`，不把原第一傳失敗誤記成 fallback 沒有出手。
- 既有 composite throw 不能誠實拆成臂力與準度，因此 projection 的 `strengthMargin` / `accuracyMargin` 為 null，quality 為 `legacyUsableDelivery` / `legacyDeliveryIncomplete`，不假造 onTarget 或 receiver 成功。
- generic Throw 已有分離的 strength / accuracy model，供後續非 legacy-first-throw 路徑使用；本輪不把它覆蓋到已驗證二壘結果。

## 新模組與契約

`defensive-decision-throw-foundation.js` 提供：

- `buildDecisionOpportunity(input)`：驗證 Reach / Secure、actual active defense、base/runner/force context，建立 route opportunity。
- `selectDefensiveRoute(opportunity, routeId, currentInput)`：明確選擇與 stale admission。
- `resolveThrow({input, opportunity, selection, capabilities, rolls, transferState})`：generic physical throw。
- `projectExistingThrow(...)`：既有二壘 firstThrow / fallbackRelease 事實投影。
- `validateStoredStage(...)`：讀檔及既有 lifecycle 執行邊界驗證。
- `hasHomePlay(...)`：production legacy UI 與新 foundation 共用的本壘情境規則。

Opportunity 保存 physical / opportunity / secure identities、defender identity、唯讀情境證據、routeAssessments 及 availableRoutes。
每條 route 分開 legality、contextualAvailability、viability、window、reason；expired window 可表示 legal 但 poor，不由 generic 層代替 evaluator 選路。
選擇與執行是不同物件，選擇不含執行結果或好壞評分。

## 路線與 receiver

| Route ID | Action | Actor / continuation |
|---|---|---|
| holdBall | holdBall | 無 receiver、無 Throw RNG |
| secureFirstBaseOut | throwFirst | 目前 batter-runner → active 1B |
| forceSecond | throwSecond | 實際 force 或 advance runner → middle infielder |
| attackLeadRunnerThird | throwThird | 實際 force 或 advance runner → active 3B |
| homeForceOut | throwHome | canonical force-home runner → active C |
| preventRunHome | throwHome | 實際 committed / advancing home runner → active C |
| initiate463 / startDoublePlaySecond | initiateDoublePlay | 第一傳二壘，continuation = pendingExistingOrFutureSecondLeg |

二壘或一壘 origin 傳二壘由 active SS 接手，其餘由 active 2B 接手；這只是結構 receiver assignment，不是補位 / pivot execution。
沿用 existing IDs；`initiate463` 只代表原 4-6-3 topology，不將 463 名稱泛用成所有雙殺。
不存在的 active receiver、receiver 就是 thrower 等情況不生成該 controlled throw route；self-cover 不是傳球給自己，仍留在既有垂直路徑。

## Force / runner authority 與本壘修正

Force 一律呼叫 `ForceAdvancement.buildInitialLiveBallForceChain` / 使用相符的既有 chain，不在此模組重寫 force 推導。
提供的 chain 必須與該 initial-live-ball frame 的 occupancy / batter-runner 相符；改變 runner、移除 batter 或帶入舊 / post-settlement chain 時拒絕 stale state。
本輪只建立第一傳；不假稱 initial-chain helper 已支援任意中途 force-break settlement。後續出局後的第二段 runner/force timing 留在既有二壘 downstream 或 1.3。

SS holding-third bug 已透過共用 `hasHomePlay` 修正，非 SS 特判。
只站在三壘不足以提供 tag-home route；必須有 force-home 或明確往 home 推進的 runner。兩出局本身不是禁止本壘路線的理由。
更新原二壘「兩出局必須隱藏本壘」測試，現在驗證 committed runner + 可用 window 仍可選。
本輪除這個已確認的 legality bug 外，不更動既有預期棒球結算公式。

## Generic throw 能力、需求與 variation

production projection 的 arm / throwing 沿用既有 defensive capability adapter，generic resolver 接受相同欄位。
玩家既有 arm 與 throwing 可分離；NPC adapter 原本都來自 coarse arm，保留此精度限制，不新增永久能力。

Throw 起點選擇「已有 possession 且有 explicit transfer readiness」。throwing route 必須提供 ready / completed / delayed / failed；failed 不擲骰，hold 不要求 transfer 或 receiver。
不再判定 transfer；delayed 僅保存 releaseQuality，尚未換算跑者競速。

- Short：1B / 2B / SS → second，3B → home。strength demand 3、accuracy demand 3。
- Long：3B → first 或 outfield origin。strength 7、accuracy 5。
- 其他目前路線 medium：strength 5、accuracy 4。
- stretched arrival 各加 1 demand；bobble-but-controlled 對 accuracy 加 1。
- strengthMargin = arm − strength demand + strength variation。
- accuracyMargin = throwing − accuracy demand + accuracy variation。
- 任一 variation = (0.5 − roll) × 2，使用既有 BBP deterministicUnit。
- RNG namespaces：`defensive-throw-strength-v1`、`defensive-throw-accuracy-v1`，不沿用 Reach / Secure RNG，無 Math.random。

Quality 分成 onTarget、challengingReceive、offline、lateWeakThrow，並保留兩種 margin；onTarget 不代表 runner out，也不代表 receiver 一定接到。
Hold / failed transfer 則 throwAttempted=false。無 runner race / receiving roll / scoring side effect。

## Production / lifecycle / save

`getHighSchoolControlledDefensiveRoutes` 提供可供後續表面使用的 canonical routes，含 hold；本輪沒有新增 polished UI 或 hold 按鈕。
既有 pre-control pause 的 intent / legal routes 繼續由 MatchSituation 保存；讀檔不預先發明 Secure 或 Throw。
控球後在既有 handoff 的 `decisionThrowState` 保存 opportunity 證據、selection、activeSelection 及投影的 first throw。
context 是用來驗證與解釋原選擇的 readonly snapshot，不作新 base-state authority；現在狀態永遠從 match / existing physical runner state 讀取，比對不符則拒絕，不能由 snapshot 回寫壘況。
沒有新 player 頂層 state、Save Version、runner/base mutation 或新 lifecycle pause。
已完成結果讀檔保留、不重擲；未結算結果驗證 runner、Secure、active receiver、route / target identities。已結算歷史不重新綁定下一球 actor。

## Airborne boundary

Generic caught-airborne frame 不建立 ground force chain，也不因滿壘就生出 homeForceOut。
Runners holding 可 hold；明確 committed / tag-up advance 可提供相應 base/home route。三出局沒有 controlled decision。
現有 line-drive retouch、fly catch、tag-up execution / third-out 流程不變。
Retreat / retouch 本身不在本輪泛化成 appeal 或 doubled-off route；不新增 OF direct-vs-relay 決策網。

## 測試與 Deferred

新增 foundation：24/24 cases；production：12/12 cases。
Targeted regression 共 32 個測試檔 PASS，包含新測試、0.9、1.0、1.1、BBP、二壘、home、force、third-out、tag-up、lifecycle、save、Y3。
因修改共用 infield choice gate，另涵蓋 infield foundation、decision integrity、explainability、generic position admission、development position fallback；不執行 full repository regression。
index.html 載入 production JS 語法檢查：68/68 PASS。

保持 Deferred：generic runner/throw race、receiver execution、universal force/tag settlement、DP second leg、official error / FC scoring、cutoff/relay、OF direct-vs-relay、P/C 特殊守備、bunt 泛化、secondary takeover、collision/communication、shifts/geometry、background PA defense sensitivity、evaluator、SS Vertical Slice、polished UI。
