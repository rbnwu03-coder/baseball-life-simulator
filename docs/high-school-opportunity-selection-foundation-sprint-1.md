# High School Opportunity Selection Foundation Sprint 1

日期：2026-09-17。狀態：**PASS**；完整回歸與 1,400 場 audit 全部通過。

## Baseline 與範圍

開始時 main / origin/main / HEAD 均為 `1f3cc7e feat: produce high school training camp opportunities`，ahead/behind 0/0，working tree clean。

本輪修改 9 檔：

1. `high-school-opportunity-selection.js`：新增 deterministic selection authority。
2. `script.js`：新增 derive/materialize production API，既有 Y1 followup 改經 selection。
3. `index.html`：載入新 module。
4. `package.json`：明確 CommonJS package boundary，private=true。
5. `tests/high-school-opportunity-selection-foundation-test.js`：41 項。
6. `tests/high-school-opportunity-selection-production-integration-test.js`：28 項。
7. `tests/high-school-opportunity-selection-test-context.cjs`：production/frequency fixture。
8. 本報告。
9. `docs/high-school-opportunity-selection-validation.json`：完整逐檔與 audit 證據。

上游 Friendly／Camp／Exchange／Candidate Generation、Schedule、Match Context、GameRecord、save/player schema、CompetitionEvidence、county/national/representative selection、team strength 與 match rules 均未修改。既有測試檔未修改。

## Runtime 邊界與開發驗證紀錄

本輪首次測試啟動時，工作區外 `E:\package.json` 的 `type=module` 被 Node 沿父目錄繼承，使本專案既有 CommonJS `require` 在 assertion 前失敗。未修改的 Training Camp foundation 同樣可重現。新增本地 `package.json` 的 `type=commonjs` 隔離外部 package scope；未修改外部檔案、測試 assertion、seed 或 production domain contract。這是測試載入環境問題，不是 producer assertion regression。

開發期間頻率 smoke 曾發現新增 Y1 接線少了 selection 變數宣告（CRLF 文字替換未命中）；在開始指定／完整回歸之前修正。

新增 integration 的 reload 與 Y3 fixture 初版曾誤把「已渲染並啟動 legacy match 的狀態」當成尚未啟動。正式 `loadGame`／choose 會渲染 match page：因此 reload 後可多出 existingLifecycleMatches / blockedByExistingSchedule，但同窗已拒絕 Opportunity、預算與空 selected set 不變。測試改為檢查這些正式 invariant，沒有清除 declined history。Y3 已啟動測 mandatoryFacts 保留；materialization 的獨立案例沿用既有 generator fixture 的 pre-launch staging，測 budget=0 仍可 materialize official。全量回歸開始前新增兩組測試均已通過。

## Existing frequency audit

透過同一 production fixture，分別讀取 `git show 1f3cc7e:script.js` / `index.html` 的 baseline 內容及目前內容，在記憶體中啟動獨立 VM，各完成五場真實比賽。沒有 checkout、stash、修改 baseline 檔案或改 seed。每個入口重入兩次必須回傳同一 match object，完成後再進下一階段。

| Year | Phase / slot | Before expected matches / new managed Opportunities / Entries | After | Changed? |
|---|---|---|---|---|
| Y1 | autumn-exhibition / 1 | 1 / 0 / 0（legacy exhibition） | 1 / 0 / 0 | no |
| Y1 | post-autumn-evaluation / 2 | 1 / 1 / 1（required development evaluation） | 1 / 1 / 1 | no |
| Y2 | year-two-spring-evaluation / 1 | 1 / 0 / 0（legacy spring evaluation） | 1 / 0 / 0 | no |
| Y2 | year-two-autumn-evaluation / 2 | 1 / 0 / 0（legacy autumn evaluation） | 1 / 0 / 0 | no |
| Y3 | final-competition / 1 | 1 / 0 / 0（existing official lifecycle） | 1 / 0 / 0 | no |

Y1=2 場、Y2=2 場、Y3=1 場。Managed Opportunity 與原 playing-time decision 是不同 domain，表中只計前者。沒有新增事件、calendar slot 或自動比賽。Optional selection API 是新 canonical 入口；不把 legacy direct match 全面改成 Opportunity 流程。

## Context、window 與 result

Browser API：`HighSchoolOpportunitySelection`。Node require `high-school-opportunity-selection.js`。

API：deriveSelectionContext、selectOpportunityCandidates、resolveCandidateConflicts、applyOpportunityBudget、materializeSelectedCandidates、auditSelection／auditOpportunitySelection。

Production API：deriveHighSchoolOpportunitySelection(options)、materializeHighSchoolSelectedOpportunities(selection, options)，兩者保留原 capability admission。既有 materializeHighSchoolMatchOpportunityCandidate 與 legacy direct compatibility 保留。

Context 包含 careerId、careerYear、seasonPhase、sequence、playerSchoolId、existingOpportunities、existingScheduleEntries、existingLifecycleMatches、mandatoryReservations、candidateSet、selectionPolicyVersion、maxOptionalPerSelectionWindow。

Window identity：`hs-opportunity-selection-window:` + encodeURIComponent(stable JSON [policyVersion, careerId, careerYear, phase, sequence, playerSchoolId])。以既有 slot 為單位，不建立真實日期。不同 year／phase／sequence 是不同 window。

Result 包含 policyVersion、selectionWindowId、context、selectedCandidateIds、selectedCandidates、mandatorySelections、optionalSelections、mandatoryFacts、selectionReasons、rejectedCandidates、diagnostics、budget。每個 candidate 有 classification、reasons、原始 upstreamReasons、semanticKey、campSourceId。未選中者不消失。

Policy version：`high-school-opportunity-selection-v1`。所有 context/result 都為 ephemeral；無 selection cache、save field 或 random run ID。

## Mandatory、type policy 與 budget

只有 mandatory／optional 兩種 classification。Mandatory 包含 officialCompetition，以及精確識別的既有 Y1 必經 development evaluation：year=1、post-autumn-evaluation、sequence=2、existing developmentSchedule、sourceId=hs-y1-followup-evaluation-2、foundationSelection=existingDevelopmentStage。一般 development 不因名字被提升。

可合法選擇的 mandatory 與既有 official reservations 阻止同窗 optional（blockedByMandatorySelection），且不使用 optional budget。上游已判 invalid/active/completed 的 mandatory 不會被「救回」重複生成；保留在 mandatoryFacts 並解釋既有 authority 的阻擋，原正式賽仍留在 legacy/schedule authority。

Optional collision policy：trainingCamp > friendly invitation > optional development > neutral exchange。Incoming/outgoing friendly 視為相同 type priority，靠 source precedence、opponent ID、candidate ID 作穩定 tie-break。這是碰撞政策，不是價值評分。

預算固定預設 1；允許明確 0，v1 拒絕 >1，因為一個 window 是一個可打比賽的 slot。每窗最多一個 optional、同 opponent 自然最多一個；budget>1 diversity 與 camp itinerary 留待後續，不引入 diversity score。不同合法 slot 可獨立選擇，production 沒有自動建立更多 slot。

Existing optional Opportunity 的所有 status（offered/accepted/scheduled/declined/expired）消耗原 window 呈現名額。Mandatory 不消耗 optional budget，但仍佔 slot。Existing Entry 與已知 legacy active/completed match 均阻止同 slot 新建立。Cancelled 也不自動補位；declined/expired 不 reroll。

## Dedup、ordering 與來源 authority

Semantic key = careerId + year + phase + sequence + playerSchoolId + opponentSchoolId + opportunityType + effective match origin。不同 source 但同 semantics 不會 materialize 多份。跨 type 使用 typeConflict，不假裝是同一語意。

候選仍全部由原 Generation module 產生；選擇層不掃 evidence、驗教練或重做 camp truth。只選 eligible=true 且無 upstream exclusionReasons 的候選。Friendly 的既有 PRECEDENCE 常數直接重用；Camp 的上游 source dedup/precedence 結果保留，已 superseded 的候選永不復活，標 supersededByHigherPrecedenceSource。

排序使用 code-point 比較，不用 localeCompare、insertion order、RNG、score、teamStrength、schoolStandard 或 participant count。每次重排相同輸入仍有相同選擇、順序與理由。

理由包括 selectedMandatory、selectedOptional、protectedExistingLifecycle、blockedByMandatorySelection、blockedByExistingOpportunity、blockedByExistingSchedule、semanticDuplicate、supersededByHigherPrecedenceSource、budgetExceeded、budgetExceededAfterStableOrder、typeConflict、sameOpponentOptional、alreadyCompleted、invalidCandidate、outsideSelectionWindow；不合法的多 mandatory 同 slot 亦可有 mandatorySlotConflict。

## Materialization 與 authority preservation

Runner 重新呼叫上游 derive，再以當下 selection 驗證選中 IDs 與完整 candidate facts。過期、偽造或 policy/window 不符時回報 staleAtMaterialization，不強行建立。整批先在複本經過既有 Generation.materializeOpportunityCandidate preflight，通過才在實際 state 呼叫同一 materializer。

已存在 candidateRef 對應 Opportunity 直接保留原物件，不改 status/provenance；只為新建立者增加 selectionPolicyVersion、selectionWindowId、selectionReason 三個字串。沒有完整 selection result 複本。Optional 初始 offered，不 accept、不 schedule；Y1 必經評估仍由原入口執行既有 accept/schedule。Official 接受流程未改。

既有 Schedule 處理排程合法性；Match Context 處理 origin 與主客場。Production 已跑 selected friendly home、friendly away、trainingCamp 實際比賽並通過 GameRecord integrity。Selection query 對整份 player snapshot 無 mutation。

## Validation matrix

S=year-two-spring-evaluation／sequence 1；A=player、B/C=fixture opponent；W 是上述完整 window tuple 的可讀別名，C(type,opponent,source) 是原 generator candidate ID 的可讀別名，並非新存檔 ID 格式。

| Scenario | Year | Phase | Window | Candidates | Mandatory | Optional budget | Selected IDs | Rejected IDs | Reasons | Existing Opportunity? | Schedule conflict? | Materialized count | Reload result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Mandatory + optional | 2 | S | W(Y2,S,1) | official + friendly + camp | official | 0 | C(official,B) | all optional | selectedMandatory / blockedByMandatorySelection | no | reservation | 1 | existing mandatory retained |
| Friendly + camp | 2 | S | W(Y2,S,1) | friendly + camp | no | 1 | C(camp,B) | C(friendly,B) | selectedOptional / typeConflict | no | candidate collision | 1 | no second set |
| Same opponent multi-source | 2 | S | W(Y2,S,1) | return + coach + school friendly | no | 1 | canonical return candidate | lower provenance candidates | supersededByHigherPrecedenceSource | no | same semantics | 1 | refs unchanged |
| Budget overflow | 2 | S | W(Y2,S,1) | optional B/C | no | 1 | stable first ID | remaining IDs | budgetExceededAfterStableOrder | no | one slot | 1 | budget remains consumed |
| Existing Opportunity | 2 | S | W(Y2,S,1) | newly eligible optional set | no | 1 used | none | all same-window IDs | blockedByExistingOpportunity | offered | existing slot claim | 0 | unchanged |
| Declined no-reroll | 2 | S | W(Y2,S,1) | optional set | no | 1 used | none | all | blockedByExistingOpportunity | declined | existing presentation | 0 | empty selected set, same budget and history |
| Expired no-reroll | 2 | S | W(Y2,S,1) | optional set | no | 1 used | none | all | blockedByExistingOpportunity | expired | existing presentation | 0 | no replacement |
| Camp multi-opponent | 2 | S | W(Y2,S,1) | camp B/C, shared campSourceId | no | 1 | stable first camp match ID | other camp match IDs | budgetExceeded | no | one slot | 1 | original group/history retained |
| Cross-phase | 2 | autumn | W(Y2,autumn,2) | current phase sources | no | fresh 1 | current candidate | remainder | selectedOptional | prior phase only | no | 1 allowed | independent window |
| Cross-year | 3 | final | W(Y3,final,1) | official + optional | official | fresh 1 | official before launch | optional | selectedMandatory | Y2 history only | official reservation | 1 allowed | started official preserved as mandatory fact |

Production reload can render the existing match page and add an active legacy fact. This may add a diagnostic; it does not change the declined Opportunity, budget, or no-reroll outcome. Pure same-state JSON roundtrip and input ordering tests require full result equality.

## Architecture classification

| ID | Result |
|---|---|
| HS-OPPSEL-001 | canonical context from current candidate and persistent facts |
| HS-OPPSEL-002 | policy/career/year/phase/sequence/player window tuple |
| HS-OPPSEL-003 | official + audited Y1 lifecycle mandatory preservation |
| HS-OPPSEL-004 | fixed optional budget 1, explicit 0; no dynamic formula |
| HS-OPPSEL-005 | effective-origin-aware semantic duplicate key |
| HS-OPPSEL-006 | deterministic type conflict and ASCII tie-break |
| HS-OPPSEL-007 | existing Opportunity/status/provenance immutable |
| HS-OPPSEL-008 | declined/expired/cancelled same-window no replacement |
| HS-OPPSEL-009 | preflight and actual creation use existing materializer |
| HS-OPPSEL-010 | ephemeral result, persistent Opportunity/Entry authority |

## Validation results

- Foundation：41/41 PASS。
- Production integration：28/28 PASS。
- Baseline/current real frequency comparison：5/5 phase rows identical，Y1 2、Y2 2、Y3 1。
- Selected regression：61/61 files PASS。
- Friendly：37/37 + 25/25 PASS；Camp：42/42 + 25/25 PASS。
- Exchange：40/40 + 24/24 PASS；Generation：40/40 + 21/21 PASS。
- Ground-ball blocker：26/26 PASS。
- Full JS/CJS syntax：285/285 PASS。
- Full regression：189/189 files PASS。
- 1,400-game audit：1,000 bench + 400 starter completed；orphan / noProgress / match-state / GameRecord issues 全為 0；deterministic=true、instrumentationNeutral=true。

## Closeout（60 項）

| # | Item | Result |
|---|---|---|
| 1 | Baseline | 1f3cc7e，main/origin 0/0，開始 clean |
| 2 | Changed files | 上列 9 檔 |
| 3 | Frequency audit | baseline 與目前的實際五場 route 相同 |
| 4 | Selection context | candidateSet + existing opportunities/entries/lifecycle/reservations |
| 5 | Window | year/phase/sequence/player/career/policy tuple |
| 6 | Result | selected/rejected IDs、reasons、groups、budget、mandatory facts |
| 7 | Policy | high-school-opportunity-selection-v1 |
| 8 | Mandatory | official + precise required Y1 development source |
| 9 | Optional | friendly/camp/ordinary development/neutral |
| 10 | Budget | default 1，explicit 0，拒絕 >1 |
| 11 | Mandatory priority | ignores optional budget，blocks same-slot optional |
| 12 | Ordering | classification/type/source/opponent/candidate stable order |
| 13 | Semantic duplicate | career/year/phase/slot/player/opponent/type/origin |
| 14 | Source precedence | Friendly 常數重用；Camp upstream resolution 不改 |
| 15 | Type policy | camp > friendly > optional development > neutral |
| 16 | Same opponent | 每窗至多一個 optional |
| 17 | Camp grouping | 每個 outcome 保留 campSourceId |
| 18 | Existing Opportunity | 不刪除、不替換、不改 status/provenance |
| 19 | Schedule conflict | existing Entry blocks new same-window selection |
| 20 | Completed history | managed + known legacy completed slot blocks regeneration |
| 21 | Declined | consumes presentation budget；no reroll |
| 22 | Expired | same-window no replacement |
| 23 | Cancelled | same-window no automatic replacement |
| 24 | Cross-phase | independent window |
| 25 | Cross-year | Y1/Y2 history cannot consume next-year window |
| 26 | Purity | whole input/player snapshots unchanged |
| 27 | Materialization | existing generator adapter only |
| 28 | Stale handling | staleAtMaterialization，preflight before real mutation |
| 29 | Opportunity lifecycle | offered；selection does not accept |
| 30 | Schedule authority | unchanged；original Y1 acceptance path retained |
| 31 | Match Context | unchanged；home/away/camp actual routes PASS |
| 32 | Y1 frequency | 2 games；one managed followup Opportunity |
| 33 | Y2 frequency | 2 games；legacy path unchanged |
| 34 | Y3 frequency | 1 official game；legacy path unchanged |
| 35 | Friendly | 37/37 + 25/25 PASS |
| 36 | Camp | 42/42 + 25/25 PASS |
| 37 | Exchange | 40/40 + 24/24 PASS |
| 38 | Generation | 40/40 + 21/21 PASS |
| 39 | Ground-ball | 26/26 PASS |
| 40 | GameRecord | module unchanged；actual games integrity PASS |
| 41 | CompetitionEvidence | module unchanged；query snapshot PASS |
| 42 | Player/representative selection | no weighting or pipeline changes |
| 43 | Team strength | no selection ranking by strength/standard |
| 44 | RNG | throwing Math.random guard PASS |
| 45 | Determinism | same-state and ordering tests PASS；1,400 audit deterministic=true |
| 46 | Instrumentation | trace equivalence PASS；1,400 audit instrumentationNeutral=true |
| 47 | Selected regression | 61/61 PASS |
| 48 | Syntax | 285/285 PASS |
| 49 | Full regression | 189/189 files PASS |
| 50 | Audit | 1,000 bench + 400 starter completed；orphan / noProgress / match-state / GameRecord issues 全為 0；deterministic=true、instrumentationNeutral=true |
| 51 | Validation matrix | 10 required scenarios above |
| 52 | Frequency matrix | five real baseline/current phase rows above |
| 53 | Architecture | HS-OPPSEL-001..010 |
| 54 | Remaining blockers | None；所有驗證 gate 通過 |
| 55 | Probability | deferred |
| 56 | Dynamic budget | deferred |
| 57 | Next recommendation | evaluate optional opportunity appearance policy only after this deterministic foundation; no next Sprint started |
| 58 | Diff check | PASS（包含新增檔案空白檢查） |
| 59 | Git status | 2 modified + 7 untracked files；main/origin 0/0；no commit/push |
| 60 | Stop Conditions | A–N 均未觸發；完整回歸與 audit 無失敗 |

沒有 commit、push 或開始下一 Sprint；working tree 保留等待人工驗收。
