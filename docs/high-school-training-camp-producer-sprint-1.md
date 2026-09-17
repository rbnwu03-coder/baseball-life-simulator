# High School Training Camp Producer Sprint 1

日期：2026-09-17。狀態：**PASS**；完整回歸與 1,400 場 audit 全部通過。

## Baseline 與修改範圍

開始時 `main` / `origin/main` / HEAD = `e4022d5 feat: produce evidence-driven high school friendly invitations`，ahead/behind = 0/0，working tree clean。

本輪共 7 檔：

- `high-school-training-camp-producer.js`：新增純查詢 camp、participant、match source producer。
- `high-school-match-opportunity-generation.js`：接入 camp producer，統一既有 explicit hook。
- `index.html`：加入模組載入順序。
- `tests/high-school-training-camp-producer-foundation-test.js`：42 項 foundation 驗證。
- `tests/high-school-training-camp-producer-production-integration-test.js`：25 項實際 production 驗證。
- 本報告。
- `docs/high-school-training-camp-producer-validation.json`：逐檔驗證及 audit 原始結果。

Friendly producer、relationship ledger、player/save、Schedule、Match Context、GameRecord、competition/selection、script.js 與所有比賽 settlement 模組均未修改。既有測試檔未修改。

## Existing hook audit

原 generator 允許 `opportunityType=trainingCampOpportunity`、`source.type=trainingCampPlan` 且 `explicit=true` 或 `sourceAuthority=existing` 的輸入。它直接展開對手 pool，再由既有 Schedule 建立 offered Opportunity。`plannedContext.campId` 是既有支援欄位。

現在同一輸入先轉為 `explicitCampPlan` source，經 participant → match source adapter 回到同一 generator。沒有第二套 candidate engine 或 materializer；舊 explicit campId 保留。沒有指定 opponent/participant set 的既有 plan，使用該 execution context 中有效的 school pool，維持原 hook 可對 pool 產 candidate 的能力。

## Canonical contracts

Browser API：`HighSchoolTrainingCampSource`；Node 可 require 新模組。

API：deriveTrainingCampSources、deriveCampParticipants、deriveCampMatchSources、validateCampSource、validateCampParticipant、adaptCampMatchSourceToCandidateInput、auditCampSources／auditTrainingCampSources。

總 query 回傳 `{version,sources,participants,matchSources,eligible,diagnostics}`。其中 `eligible` 是可送 candidate 的 match sources；`matchSources` 保留已消費或被較高 authority 抑制的事實和 exclusionReasons。Source 是安排來源，並非 accepted camp 或已排定比賽。查詢不修改輸入，不創建 Opportunity 或 Schedule Entry。

Source 欄位：version、campSourceId、semanticCampKey、careerId、careerYear、seasonPhase、sequence、playerSchoolId、hostSchoolId、hostContext、sourceType、sourceAuthority、evidenceRefs、participantSchoolIds、venueIntent、reasonCode、provenance、plannedContext、eligibilityState。

Participant 欄位：participantRef、campSourceId、schoolId、role、hostStatus、sourceEvidenceRefs。Role 為 host／guest／neutralParticipant。Player school 只能一次；其餘每校也只能一次，按 school ID 排序。至少 player + 一個有效對手；host 若指定，必須也在 participant set。所有 IDs 都從現有有效 school/team pool 解析，不能自動建校。

Match source 欄位：campMatchSourceId、campSourceId、career/phase/sequence、player/opponent、hostContext、venueIntent、evidenceRefs、participantRefs、sourceType、producerType、reasonCode、provenance、plannedContext、eligible、exclusionReasons。N 個 participant 只產 N−1 個 player-related possible match source，不生成對手之間的比賽，也不排多日 itinerary。

## Identity、precedence 與 lifecycle

所有 ID 使用 JSON stable tuple + encodeURIComponent，沒有 hash collision、時間或 RNG 輸入。`ID(prefix, tuple)` 表示 `prefix + ':' + encodeURIComponent(JSON.stringify(stable(tuple)))`。

- scope = ID(hs-camp-scope, [version, careerId, year, phase, sequence, playerSchoolId, hostSchoolId|null, sortedParticipantSet, explicit campId|null])。
- campSourceId = ID(hs-camp-source, [scope, winningSourceType, sortedEvidenceRefs, sortedAuthoritySourceRefs])。
- participantRef = ID(hs-camp-participant, [campSourceId, schoolId])。
- campMatchSourceId = ID(hs-camp-match-source, [campSourceId, opponentSchoolId, sequence])。
- matchId 仍屬既有比賽入口，絕不使用 campSourceId 代替。

同 semantic scope 合併 supporting refs；authority precedence 固定：

`explicitCampPlan > sharedTrainingContextCamp > coachNetworkCamp > schoolRelationshipCamp`。

同 authority 用穩定結構字串排序作 tie-break，沒有評分或機率。合併產 duplicateCampSource diagnostic，輸出不含重複 camp ID。不同 explicit campId 可表達不同計畫；無 campId 且同 host/participants/slot 的 plans 合併為同安排来源。

若不同 camp source 同時指向相同 opponent/sequence，保留其來源事實，但僅最高 precedence match source eligible，其他標 duplicateMatchSource。跨年／phase／sequence 的 scope 不同，可再形成 source。加入新 evidence 可改變 source ID 和 provenance；既有 history 不因此被取代。

消費判斷讀取既有 Opportunity 與 Entry：同 year/phase/sequence、opponent、trainingCamp 類型已存在時，標 existingOpportunityPreserved、alreadyScheduled 或 alreadyCompleted。即使新 completion evidence 形成新 source ID，仍不能繞過這個 semantic guard。Cancelled Entry 或 declined/expired Opportunity 也保留同 slot 的歷史；後續 slot 可重新推導。完整 schedule conflict／mandatory reservation 仍交 Schedule 判定。

## Source policy 與 host semantics

- explicitCampPlan：保留明確 plan authority，可提供 participantSchoolIds、hostSchoolId、plannedContext。reason = eligibleExplicitPlan。
- sharedTrainingContextCamp：canonical completed training evidence，reason = eligibleSharedTrainingContext。
- coachNetworkCamp：同 career、player school、currentCoachId 的 canonical knownCounterpart／previousAffiliation 聯繫，reason = eligibleCoachNetwork。這两種已建立的聯繫在本 Sprint 定義為 camp-compatible eligibility；不等同收到邀請或接受。initiatedContact／invitationCoachRef 不足，標 coachContactNotCampCompatible；單純 coach metadata 完全不產來源。
- schoolRelationshipCamp：canonical schoolExchangeMatch／developmentExchange，reason = eligibleSchoolRelationship。
- competitionEncounter 單獨不成立，標 competitionEncounterNotCampRelationship。
- returnVisitEligible 本身不成立，標 returnVisitAloneNotCampRelationship；homeVisit／awayVisit 也不單獨代替 camp relationship。真實友誼賽同時具有 schoolExchangeMatch 時，該獨立證據仍可支援 camp。

Evidence-only source 採 neutral host intent，因為過去在哪裡打球不保證未來仍由同校主辦。只有 explicit future plan 指定 host。預設 venueIntent=trainingVenue，保留合法既有 explicit venue intent。

既有 `MatchContextFoundation.createMatchContext` 的正式 contract 是：explicit homeTeamId/awayTeamId 優先；否則 trainingCamp 在非 neutralVenue 且 host 是場上球隊時，預設 host home；其餘使用既有 deterministic assignment。Producer 不自行指定 home/away，因此 camp host 不等於永遠 home。Production 已實際驗證 player-host/home、player-guest/away，以及 player-host 但 explicit assignment 為 away 三條路徑。

## Integration、provenance 與 feedback

Adapter 輸出 source.type=trainingCampPlan、sourceAuthority=canonicalTrainingCampProducer，candidate type=trainingCampOpportunity。Generator 自動讀 canonical ledger；不需要 caller 手動塞 plan 才有 evidence-derived camp。

Candidate/Opportunity provenance 只保存 campSourceId、campMatchSourceId、participantRefs、evidenceRefs、producerType、reasonCode、sourceRefs，外加既有 candidateRef。Schedule 與 Match Context 沿用既有 Opportunity ref chain。沒有完整 camp/participant/evidence payload 複本，也沒有新 persistent camp state。Derived source 在 reload 後重算；外部 explicit plan 仍由原 caller 提供，並未新增 plan persistence。

Completion → sharedTrainingContext 沿用原 `recordHighSchoolExchangeCompletion` 與 canonical appendEvidence。Producer 完全不寫 evidence。實際比賽結束後重複呼叫 ingestion，仍只有一筆同 match sharedTrainingContext。該 evidence 可支援後續 camp/friendly source；目前 slot 的 completed history 阻止 feedback 無限自複製。

## Validation matrix

下表 A 為 player school，B/C 為 fixture school IDs；production 測試另使用 invitation pool 真實學校與既有 regional-power-school。S=year-two-spring-evaluation，sequence=1。C(scope,type,refs) 與 M(C,opponent) 是上述完整 deterministic ID 公式的可讀別名，不是 production ID 新格式。

| Scenario | Year | Phase | Source type | Evidence refs | Host | Participants | Opponent | Camp source ID | Match source ID | Eligible? | Reason | Candidate type | Opportunity created? | Auto scheduled? | Expected origin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Explicit plan | 2 | S | explicitCampPlan | plan sourceRef | neutral | A,B | B | C(S,explicit,plan) | M(C,B) | yes | eligibleExplicitPlan | trainingCampOpportunity | explicit materialize | no | trainingCamp |
| Shared training | 2 | S | sharedTrainingContextCamp | Y1 training evidence | neutral | A,B | B | C(S,shared,ref) | M(C,B) | yes | eligibleSharedTrainingContext | trainingCampOpportunity | explicit only | no | trainingCamp |
| Coach network | 2 | S | coachNetworkCamp | knownCounterpart evidence | neutral | A,B | B | C(S,coach,ref) | M(C,B) | yes | eligibleCoachNetwork | trainingCampOpportunity | explicit only | no | trainingCamp |
| School relationship | 2 | S | schoolRelationshipCamp | exchange/development ref | neutral | A,B | B | C(S,school,ref) | M(C,B) | yes | eligibleSchoolRelationship | trainingCampOpportunity | explicit only | no | trainingCamp |
| Competition only | 2 | S | none | competitionEncounter | none | none | none | none | none | no | competitionEncounterNotCampRelationship | none | no | no | none |
| Return visit alone | 2 | S | none | return + parent visit | none | none | none | none | none | no | returnVisitAloneNotCampRelationship | none | no | no | none |
| Multi-school | 2 | S | explicitCampPlan | plan sourceRef | neutral | A,B,C | B,C | one C(S,explicit,plan) | M(C,B),M(C,C) | two possibilities | eligibleExplicitPlan | trainingCampOpportunity | explicit only | no | trainingCamp |
| Player host | 2 | S | explicitCampPlan | plan sourceRef | A | A host,B guest | B | C(S,hostA,plan) | M(C,B) | yes | eligibleExplicitPlan | trainingCampOpportunity | actual offered→accepted | no | trainingCamp, home default |
| Player guest | 2 | S | explicitCampPlan | plan sourceRef | B | A guest,B host | B | C(S,hostB,plan) | M(C,B) | yes | eligibleExplicitPlan | trainingCampOpportunity | actual offered→accepted | no | trainingCamp, away default |
| Completed duplicate | 2 | S | plan + completion source | plan + new shared ref | source-specific | A,B | B | may change with new evidence | source-specific M(C,B) | no | alreadyCompleted | rejected | no second Opportunity | no | existing trainingCamp |
| Cross-year | 1→2 | prior→S | sharedTrainingContextCamp | same Y1 evidence | neutral | A,B | B | C(Y1) != C(Y2) | M(Y1) != M(Y2) | current phase yes | eligibleSharedTrainingContext | trainingCampOpportunity | explicit only | no | trainingCamp |

測試中的 accept/schedule/launch 均為明確測試操作，不是 producer side effect。

## Source coverage matrix

| Source domain | Canonical authority | Camp support | Participant support | Limit |
|---|---|---|---|---|
| explicitCampPlan | existing caller hook | explicit source | explicit set or original valid pool | no new persistence/acceptance |
| sharedTrainingContext | completed managed match ledger | sharedTrainingContextCamp | player + evidence school | no permanent camp guarantee |
| coachSchoolConnection | ledger + current coach affiliation | established contacts only | player + connected school | no metadata-only or first-contact inference |
| schoolExchangeMatch | canonical completed exchange ledger | schoolRelationshipCamp | evidence pair | does not promise future host |
| developmentExchange | canonical completed development ledger | schoolRelationshipCamp | evidence pair | no growth/training reward |
| returnVisitEligible | canonical parent chain | insufficient alone | none independently | friendly return semantics retained |
| competitionEncounter | canonical official encounter | diagnostic only | none independently | no competition pollution |
| school/team pool | existing execution input records | identity validation | school type + valid roster + sourceRef | no invented production IDs |

## Architecture classification

| ID | Result |
|---|---|
| HS-CAMP-001 | versioned ephemeral camp source with authority and evidence refs |
| HS-CAMP-002 | canonical unique participant facts and roles |
| HS-CAMP-003 | separate camp match source identity, N−1 player matchups |
| HS-CAMP-004 | existing explicit hook and evidence sources share generator adapter |
| HS-CAMP-005 | explicit host intent; home-away remains Match Context authority |
| HS-CAMP-006 | semantic scope merge + stable authority precedence |
| HS-CAMP-007 | camp/opponent identity + opponent/slot candidate dedup |
| HS-CAMP-008 | existing completion evidence writer + history-aware loop prevention |
| HS-CAMP-009 | sources not persisted; reload re-derivation deterministic |
| HS-CAMP-010 | friendly module and original tests unchanged |

## Validation results

- Foundation：42/42 PASS。
- Production integration：25/25 PASS。
- Selected regression：59/59 files PASS，包含 ground-ball blocker 26/26、Friendly 37/37 + 25/25、Exchange 40/40 + 24/24、Generation 40/40 + 21/21。
- Full JS/CJS syntax：281/281 PASS。
- Full regression：187/187 files PASS。
- 1,400-game audit：1,000 bench + 400 starter completed；orphan / noProgress / match-state / GameRecord issues 全為 0；deterministic=true、instrumentationNeutral=true。

新增 production Test 20 初次失敗是測試在真實比賽完成、頁面已離開 match phase 後，只改 phase 而未保留該 phase 的 canonical school pool，導致 orphanSchoolReference，並非 duplicate 或 production regression。修正 fixture 使用開始前正式 execution input 的 pool/context 與完成後 ledger/schedule，驗證相同 scope 的 completion guard；沒有放寬 admission 或補造學校。

## Closeout（56 項）

| # | Item | Result |
|---|---|---|
| 1 | Baseline | e4022d5，main/origin 0/0，開始 clean |
| 2 | Changed files | 上列 7 檔 |
| 3 | Existing camp hook | explicit trainingCampPlan 統一進 producer |
| 4 | Source contract | ephemeral camp arrangements with reasons/refs |
| 5 | Source identity | stable scope + authority + sorted refs |
| 6 | Participant contract | participantRef/school/role/hostStatus/evidenceRefs |
| 7 | Participant identity | canonical pool，unique sorted school IDs |
| 8 | Host semantics | explicit host/guest or neutral intent |
| 9 | Venue semantics | trainingVenue default；existing context intent |
| 10 | Camp vs Match identity | distinct campSourceId/campMatchSourceId/matchId |
| 11 | Explicit plan | old hook + campId preserved |
| 12 | Shared training | real completion evidence → source |
| 13 | Coach network | established contact + affiliation checks |
| 14 | School relationship | exchange/development → source |
| 15 | Competition negative | diagnostic only |
| 16 | Return negative | insufficient alone |
| 17 | Multi-school | N participants → N−1 player-related possibilities |
| 18 | Opponent-vs-opponent | never produced |
| 19 | Match source | separate scoped identity and consumption reasons |
| 20 | Candidate integration | automatic canonicalTrainingCampProducer adapter |
| 21 | Opportunity integration | existing materializer → offered |
| 22 | Schedule authority | unchanged；explicit actions only |
| 23 | Match Context authority | unchanged；three actual host/assignment routes PASS |
| 24 | Precedence | explicit > shared > coach > school |
| 25 | Source dedup | semantic scope grouping + merged refs |
| 26 | Match dedup | opponent/slot winner + persistent history guard |
| 27 | Completion feedback | actual completed camp emits shared evidence once |
| 28 | Loop prevention | newly derived IDs cannot bypass completed slot |
| 29 | Cross-year | fresh year/phase/sequence identity, original evidence refs |
| 30 | Save/load | same sources/participants/matches/diagnostics |
| 31 | Friendly isolation | module and existing tests unchanged；both PASS |
| 32 | Ledger immutability | complete input snapshots PASS |
| 33 | Strength neutrality | no strength/standard eligibility filter |
| 34 | RNG neutrality | throwing Math.random guard PASS |
| 35 | Determinism | query/order tests PASS；1,400 audit deterministic=true |
| 36 | Instrumentation | trace equivalence PASS；1,400 audit instrumentationNeutral=true |
| 37 | Ground-ball blocker | 26/26 PASS |
| 38 | Exchange | 40/40 + 24/24 PASS |
| 39 | Friendly | 37/37 + 25/25 PASS |
| 40 | Opportunity | Generation 40/40 + 21/21；Schedule/Context PASS |
| 41 | Selected | 59/59 PASS |
| 42 | Syntax | 281/281 PASS |
| 43 | Full | 187/187 files PASS |
| 44 | Audit | 1,000 bench + 400 starter completed；orphan / noProgress / match-state / GameRecord issues 全為 0；deterministic=true、instrumentationNeutral=true |
| 45 | Validation matrix | 11 required scenarios above |
| 46 | Coverage matrix | 8 source domains above |
| 47 | Architecture | HS-CAMP-001..010 |
| 48 | Remaining blockers | None；所有驗證 gate 通過 |
| 49 | Multi-day camp | deferred |
| 50 | Geography/travel | deferred |
| 51 | Fatigue/training effects | deferred |
| 52 | Probability | deferred |
| 53 | Next recommendation | evaluate deterministic Invitation/Opportunity Selection and opportunity budget first；not started |
| 54 | Diff check | PASS（包含新增檔案空白檢查） |
| 55 | Git status | 2 modified + 5 untracked files；main/origin 0/0；no commit/push |
| 56 | Stop Conditions | A–M 均未觸發 |

沒有 commit、push 或開始下一 Sprint。工作目錄保留，等待人工驗收。
