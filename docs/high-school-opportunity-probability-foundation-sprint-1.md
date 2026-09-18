# High School Opportunity Probability Foundation — Sprint 1

狀態：**PASS**。尚未 commit、push 或開始下一 Sprint。

## Baseline 與範圍

起始 branch `main`，HEAD / origin/main `e4611d9`（`feat: establish deterministic high school opportunity selection`），ahead/behind 0/0，working tree clean。只新增 optional source weighting；mandatory、slot、budget、schedule、match、evidence 與 roster authority 沿用原實作。

修改 4 個既有檔案：`high-school-opportunity-selection.js`、`script.js`、`index.html`、`tests/high-school-opportunity-selection-test-context.cjs`。

新增 5 個檔案：`high-school-opportunity-probability.js`、兩個 `tests/high-school-opportunity-probability-*-test.js`、本文件及 `high-school-opportunity-probability-validation.json`。

## Contract 與執行順序

Generation 先驗 source / roster / eligibility；Selection 沿用 window、mandatory reservation、existing Opportunity / schedule / lifecycle、semantic dedup、source precedence、type conflict 與 budget 判定。只有通過全部限制、屬於同一 winning type priority 的 optional candidates 才交給 Probability。Mandatory（包含精確的 Y1 required development slot）永遠不產生 weight，也不進 draw。

原 type policy 維持 camp > friendly > ordinary development > neutral；incoming/outgoing friendly 同級。本 Sprint 不增添 type weight。真實 returnVisit / coach / camp 同時出現時，camp priority 先排除 friendly，不能靠較高 friendly weight 越過原 conflict authority。

`HighSchoolOpportunityProbability` 提供 `deriveProbabilityProfile`、`deriveCandidateWeights`、`deriveCandidatePoolIdentity`、`drawWeightedCandidate`、`deriveProbabilityResult`、`auditProbability` / `auditOpportunityProbability`。

Profile 包含 candidateId、selectionWindowId、sourceType、producerType、weightClass、baseWeight、weightFactors、finalWeight、probabilityVersion、provenance、diagnostics；derived normalizedProbability 只供解釋。Result 包含 window、pool identity、weights、selected IDs、drawValue / drawRange、draws、reason、diagnostics。未選到的合法候選有 `notSelectedByWeightedDraw`，被前置 authority 阻擋者仍保留 Selection reasons。

## Source weight matrix — NOT FINAL BALANCE

| Source class | Base weight | Current authority / reason | Future tuning |
| --- | ---: | --- | --- |
| explicitReturnVisit | 3 | canonical returnVisitProducer；已有具體回訪來源 | telemetry 後評估 |
| explicitCampPlan | 3 | camp eligibleExplicitPlan；已存在明確計畫 | telemetry 後評估 |
| coachNetwork | 2 | coachNetworkProducer / camp eligibleCoachNetwork | 不依 contact count 加權 |
| schoolRelationship | 2 | schoolRelationshipProducer / camp eligibleSchoolRelationship | 不依 exchange count 加權 |
| sharedTrainingContext | 2 | camp eligibleSharedTrainingContext | 不依 participant count 加權 |
| foundationFallback | 1 | sourceAuthority=fallback | 保持可選，不永久消失 |
| unknownSource | 1 | 已被 Selection 接納，但沒有已知 weight class | unknownSourceWeightFallback diagnostic |

常數集中在 frozen `WEIGHTS`，版本 `high-school-opportunity-probability-v1`。Weight 是相對權重，不是固定成功率。只在同一 admitted pool 內計算 share = finalWeight / totalWeight；不持久保存 share。

同 campSourceId 的 group total = 該 group 的最大 baseWeight，再平均分配到合法 opponent candidates。同一 canonical camp 的 source class 一致；2 校與 4 校 camp 的總權重相同。Friendly 在 draw 前 semantic dedup，同 opponent 的重複 source 不增加抽選票數。Strength、school standard、capability、performance、reputation、recency、relationship count、participant count 均不是加權因子。

## Determinism、RNG 與持久化

Pool identity 為排序去重 candidate IDs 的 encoded JSON。RNG seed tuple 為 `[namespace, version, careerId, careerYear, seasonPhase, selectionWindowId, candidatePoolIdentity, drawIndex]`；namespace=`high-school-opportunity-probability`。重用 `TeamRosterFoundation.createSeededRandom`，每次建立獨立 instance，不消耗 gameplay / pitch / BIP RNG，也不呼叫 Math.random 或 Date.now。

Optional production budget 仍只允許 0/1。獨立 Probability API 預留 weighted sampling without replacement：每次移除已選 candidate，drawIndex 穩定，initial pool identity 不隨 call count 變化。這不開放 production budget >1。

非有限或 <=0 權重不參與 draw，保留 `excludedByZeroWeight` diagnostic。現行 canonical source classes 都是正權重；zero-weight contract 在低層 draw API 測試。

Materializer 仍重新 derive 及 preflight；只在新 optional Opportunity 記錄 probabilityVersion、candidatePoolIdentity、selectedWeightClass、drawRef，沿用既有 selectionWindowId。沒有 weight table、generator object、raw RNG state 或 roll cache。Offer 後仍由既有 acceptance / schedule API 決定是否排賽。

Existing offered / accepted / declined / expired Opportunity，以及既有 cancelled schedule entry，都佔用同一 selection window，不再 derive weights 或 draw。真實 source / pool / year / phase 改變可產生新 deterministic result，但不能跨越已佔用 window。跨年度 Y3 official 仍是 mandatory bypass，不為了示範 new draw 而改成 optional。

Save/load 測試分兩層：pre-materialization 測試使用正式 saveGame/loadGame，只暫停頁面 rendering，以保持同一 persistent world state；否則現有頁面會啟動 legacy match，新增合法 occupied-slot fact。Decline 後則走未攔截 rendering 的完整 loadGame，驗證原 Opportunity、provenance、consumed budget 不變且沒有新 draw。

Production wrapper 預設 enabled；低層 Selection API 保持 opt-in，缺省或 explicit disabled 走原 stable-order path。8 組真實 state 的 disabled result 已與 `git show e4611d9:high-school-opportunity-selection.js` 在記憶體載入的舊模組逐項 deep equality。舊測試 helper 明確選 disabled，以保留舊 regression 的意思；新 integration helper 選 enabled。

## 驗證與限制

Foundation 41/41，production integration 37/37。新 integration fixture 最初嘗試把 explicit-source candidate 透過沒有 sources options 的 helper 再次 materialize，被原 stale candidate validation 正確拒絕；改為 accept / launch 已經正式 materialized 的 Opportunity，未修改 production contract。

Deterministic batch 使用 1,200 個 career identities，3:1 source weights 選中 898:302（74.83% / 25.17%）；同 candidate 從 weight 1 升到 3，選中數從 610 到 898。2 校與 4 校 camp 分別選中 901 / 898，沒有因 opponent 數量成倍增加的 group bias。這些是寬閾值 sanity checks，並非 balance calibration。

Baseline/current 實際五場 route 完全相同：

| Year / phase | Match count | New Opportunity | Scheduled entry |
| --- | ---: | ---: | ---: |
| Y1 autumn-exhibition | 1 | 0 | 0 |
| Y1 post-autumn-evaluation | 1 | 1 | 1 |
| Y2 spring evaluation | 1 | 0 | 0 |
| Y2 autumn evaluation | 1 | 0 | 0 |
| Y3 final competition | 1 | 0 | 0 |

Selected regression 63/63；syntax 288/288 JS/CJS。Full regression **191/191 PASS**（含 1,400-game audit）。Bench **1,000/1,000**、Starter **400/400** 全數完成；orphan、noProgress、match-state issue、GameRecord issue 均為 **0**，deterministic=true、instrumentationNeutral=true。

首次執行工作階段結束時已保存 190 個通過結果，最後 audit 沒有保留完成結果；續作僅重跑未完成 audit。沒有 full-regression assertion failure，也未為續作更動 production / test 邏輯。

JSON 保存逐檔結果、baseline comparison、before/after frequency、統計數字、audit 與 13 列 validation matrix。Matrix 明確標出 isolated admitted-candidate fixture 或 production selection；single / two weighted / return+fallback / coach+relationship / unknown 用 isolated API 比較來源，其他列使用真實 career。每列包含 year、phase、window、IDs、classes、weights、shares、pool、draw、budget、materialization、reload 與 anti-reroll 狀態；未執行的欄位明確標示，不當成 PASS。

## Architecture classification

| ID | Scope | Evidence |
| --- | --- | --- |
| HS-OPPPROB-001 | Canonical probability profile | foundation profile / result contract |
| HS-OPPPROB-002 | Source-aware mapping | centralized 3/2/1 + unknown diagnostic |
| HS-OPPPROB-003 | Stable candidate pool | sorted candidate IDs; reversal equality |
| HS-OPPPROB-004 | Weighted draw | seeded cumulative draw; without replacement |
| HS-OPPPROB-005 | Mandatory bypass | official / Y1 required development no weight |
| HS-OPPPROB-006 | Budget preservation | 0/1 policy unchanged; five-match route |
| HS-OPPPROB-007 | Anti-reroll | offered/declined/expired/cancelled window tests |
| HS-OPPPROB-008 | Save/reload | actual serializer/admission; fixed-world draw equality |
| HS-OPPPROB-009 | Gameplay RNG isolation | actual match cursor/sequence comparison |
| HS-OPPPROB-010 | Group bias protection | camp total invariant; 1,200-identity batch |

## Closeout（66 項）

| # | Item | Result |
| --- | --- | --- |
| 1 | Baseline | e4611d9, main/origin 0/0, initially clean |
| 2 | Changed files | 4 modified + 5 new，見上方清單 |
| 3 | Placement | legal/dedup/conflict/existing/mandatory/budget 全部先於 draw |
| 4 | Profile contract | canonical exported APIs + explainability fields |
| 5 | Policy version | high-school-opportunity-probability-v1 |
| 6 | Pool identity | sorted candidate IDs, insertion order independent |
| 7 | Vocabulary | seven named weight classes |
| 8 | Constants | centralized frozen WEIGHTS; 3/2/1 |
| 9 | Mapping | canonical producer/camp reason/sourceAuthority |
| 10 | Mandatory | weights=[], draws=[]; mandatory selected by Selection |
| 11 | Eligibility | rejected/illegal candidates never enter pool |
| 12 | Budget | unchanged 0/1; mandatory independent |
| 13 | Stable draw | same context/pool/version → exact result |
| 14 | Namespace | isolated high-school-opportunity-probability |
| 15 | Gameplay RNG | new instance; actual cursor and 20-number sequence equal |
| 16 | Save/reload | formal save/load exact probability result before materialization |
| 17 | Decline | no redraw; full reload retains Opportunity |
| 18 | Expired | no redraw |
| 19 | Cancelled | cancelled schedule consumes window |
| 20 | Existing Opportunity | untouched, no replacement, no new weights |
| 21 | Cross-phase | distinct window/drawRef; Y2 spring → autumn |
| 22 | Cross-year | distinct namespace; Y3 mandatory remains bypass |
| 23 | Semantic duplicate | upstream source precedence + Selection semantic keys |
| 24 | Source precedence | no change; precedence is separate from weights |
| 25 | Camp group bias | same group total; 2/4-school batch 901/898 |
| 26 | Friendly count bias | duplicate sources do not inflate pool |
| 27 | Unknown | positive 1 + diagnostic, only after legality admission |
| 28 | Zero | excludedByZeroWeight; zero/negative/nonfinite tests |
| 29 | Shares | derived only; sum=1 when nonempty |
| 30 | Materialization | existing adapter/preflight; offered only |
| 31 | Provenance | version/pool/class/draw reference; no weight table/RNG state |
| 32 | Disabled | 8 exact baseline comparisons; original tests retained |
| 33 | Y1 | 2 matches; baseline/current equal |
| 34 | Y2 | 2 matches; baseline/current equal |
| 35 | Y3 | 1 match; baseline/current equal |
| 36 | Friendly regression | selected foundation + production integration PASS |
| 37 | Camp regression | selected foundation + production integration PASS |
| 38 | Exchange regression | selected foundation + production integration PASS |
| 39 | Generation regression | selected foundation + production integration PASS |
| 40 | Selection regression | 41/41 + 28/28 PASS |
| 41 | Ground-ball blocker | selected lifecycle regression PASS |
| 42 | GameRecord | production module unchanged; actual home/away/camp games valid |
| 43 | CompetitionEvidence | module unchanged; dedicated regressions PASS |
| 44 | Representative/player | authority unchanged; dedicated regressions PASS |
| 45 | Team strength | never read for weight; model regression PASS |
| 46 | RNG neutrality | Math.random/Date.now guard; isolated seeded authority |
| 47 | Determinism | repeated, reversed, serialized input equality |
| 48 | Instrumentation | trace on/off result deep equality |
| 49 | Statistical sanity | 1,200 identities; 898:302 for 3:1 |
| 50 | Monotonic sanity | 610 → 898 selected with weight 1 → 3 |
| 51 | Selected regression | 63/63 PASS |
| 52 | Syntax | 288/288 PASS |
| 53 | Full regression | 191/191 files PASS（含 audit） |
| 54 | 1,400 audit | Bench 1000/1000、Starter 400/400；四項 integrity/liveness issue 全 0；deterministic / instrumentationNeutral=true |
| 55 | Validation matrix | 13 rows in JSON, layers and unexercised fields explicit |
| 56 | Probability matrix | above, NOT FINAL BALANCE |
| 57 | Architecture | HS-OPPPROB-001..010 above |
| 58 | Remaining blockers | 無；全部驗證 gates 通過 |
| 59 | Performance | deferred; not read |
| 60 | Reputation | deferred; no new state |
| 61 | Recency | deferred; no decay/multiplier |
| 62 | Calibration | deferred; sanity only |
| 63 | Next recommendation | Probability Calibration / Telemetry Audit; not started |
| 64 | git diff --check | PASS，含五個新增檔案的空白檢查 |
| 65 | git status | main/e4611d9；ahead/behind 0/0；4 modified + 5 untracked；無 commit/push |
| 66 | Stop Conditions | A–O 均未觸發；完整回歸與 audit 全部通過 |

後續先以大量 careers 觀察 source mix、exposure、camp/friendly 比例、opponent diversity、no-reroll，再考慮增加 performance/reputation/recency factors。本次不做 geography、travel、fatigue、home advantage、dynamic budget、UI、narrative、final balance/live ops、match-type evidence weighting、defensive completion、FC、Infield Fly、Appeal 或 LOB。
