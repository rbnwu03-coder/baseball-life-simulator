# Friendly Invitation & Return-Visit Producer Sprint 1

日期：2026-09-17。狀態：**PASS**。完整回歸與 1,400 場 audit 全部通過。

## Baseline 與範圍

開始時 main / HEAD / origin/main = `6aa2a2c feat: establish school exchange and coach network evidence`，ahead/behind 0/0、working tree clean、diff check PASS。

新增 ephemeral invitation source producer，取代 generator 內直接掃描 evidence 的簡易 adapter。沒有新增 persistent source state、修改 evidence ledger、schedule/Match Context authority、GameRecord、ground-ball、force、third-out、scoreboard、AI PA 或 BIP mapper。沒有 UI、機率、評分、strength eligibility、reputation、geography、camp planner 或自動接受／排程。

## Canonical source contract 與 API

`high-school-friendly-invitation-producer.js` 的瀏覽器 API 為 `HighSchoolFriendlyInvitationSource`，Node 可 require 同檔。

每個 source 包含 version、sourceId、sourceType、producerType、careerId、careerYear、seasonPhase、sequence、playerSchoolId、opponentSchoolId、direction、opportunityType、evidenceRefs、reasonCode、eligibilityState、exclusionReasons、provenance。Provenance 只有 originCareerYears 與 evidenceSourceRefs，沒有 match result 或 evidence object 複本。

`sourceId = "hs-friendly-invitation-source:" + encodeURIComponent(JSON.stringify(stable(tuple)))`，tuple 依序為 version、producerType、careerId、current careerYear、seasonPhase、sequence、playerSchoolId、opponentSchoolId、direction、evidenceRefs。每個 fact 由一個 canonical evidence 支援；不同 evidence/producer 保持獨立，沒有過早合成分數。Return evidence 的 parent chain 由原 ledger normalization 驗證。

API：deriveFriendlyInvitationSources / deriveAllFriendlyInvitationSources、deriveReturnVisitSources、deriveCoachNetworkSources、deriveSchoolRelationshipSources、deriveInvitationSourcesForOpponent、getInvitationSourceDiagnostics、validateInvitationSource、materializeInvitationSourceToCandidateInput、isSourceAlreadyConsumed、compareSourcePrecedence、auditInvitationSources。

總 query 回傳 sources、eligible、rejected、diagnostics。單一 producer/opponent query 保留含 ineligible/consumed 的 source facts 供診斷；只有 eligibilityState=eligible 代表目前合法來源。Malformed ledger（含 orphan return、自校 evidence）fail closed 並回傳 invalidEvidenceLedger；未知學校、future evidence、畢業或非 match phase 也有明確拒絕原因。Validation 重新推導並逐結構比較 source，不能藉更換 evidenceRefs 或 eligibility flags 偽造來源。

## Direction 與來源政策

既有 Schedule ORIGIN_MAP 是 authority：

- outgoingFriendlyInvitation → homeInvitationFriendly → player host / homeGround。
- incomingFriendlyInvitation → awayInvitationFriendly → opponent host / awayGround。

名稱採玩家學校的邀請意圖，不等同「對方已接受」。Producer 不自己配置主客場；它提供對應 type，交由現有 Opportunity → Schedule → Match Context 決定。

Return：prior awayVisit → opponentVisitsPlayer / outgoing；prior homeVisit → playerVisitsOpponent / incoming。Reason 為 returnVisitFromPriorAwayVisit / returnVisitFromPriorHomeVisit。來源只是 eligibility，沒有 future completion 或 acceptance guarantee。

Coach：必須有 canonical coachSchoolConnection，且 coachId 等於目前 selected school 的 currentCoachId，schoolA 符合當前 affiliation、對手存在有效 pool、source 通過原 ledger contract。initiatedContact 表達玩家教練的主動聯繫，產 outgoing contact eligibility；knownCounterpart / previousAffiliation / invitationCoachRef 只證明既有聯繫，容許兩個方向的 possibility，並不宣稱已收到或接受邀請。Source reasonCode 保留 coachConnectionToOpponentSchool，refs 可追溯原 contact 類型。

School relationship：有 direction 的 exchange/homeVisit/awayVisit 保留 priorHomeVisit/priorAwayVisit 與反向交流意圖；neutral exchange 可支持雙方向。Development → priorDevelopmentExchange；shared training → sharedTrainingContact，均只形成 friendly/contact source，不冒充 returnVisit 或 trainingCampOpportunity。Competition encounter 單獨只產 competitionEncounterNotFriendlyRelationship diagnostic。

## Dedup、precedence 與 consumption

Source facts 的 identity 相同只保留一份。不同 producerType 或 evidence identity 可保留多份事實。Candidate semantic key 為 opportunity type / opponent / sequence（處於同一 career-year/phase context）。優先序固定：

`returnVisitProducer > coachNetworkProducer > schoolRelationshipProducer > foundationFallback`

同 producer 以 sourceId ASCII 升冪打破平手；不是機率、強度或 freshness 評分。Ineligible source 不可壓過合法來源。較低優先 source 的 candidate 保留 supersededByHigherPriorityProducer diagnostic；fallback 被 supersededByCanonicalSource 拒絕。

Consumption scope 為 career、current year、phase、sequence、player school、opponent 與 invitation type。由既有 Opportunity（包含 offered/declined 等歷史）及相同 slot 的 schedule entry 判定；evidence 不写 used flag、不刪除。下一 slot/phase/year 可以重新推導不同 source ID，沒有虛構「必須隔一年」限制。

若 fallback 已 materialize，之後的 producer source 診斷 existingOpportunityPreserved，不替換既有 history。Generator 對所有 incoming/outgoing candidates 施加 existingOpportunity semantic guard，因此即使 current coach 改變、原 producer source 不再 eligible，也不能用 fallback 重建第二份機會。

Producer 讀取 schedule/opportunity history 判斷 consumption，但不重做完整 collision engine。其他對手佔用 slot、正式賽 reservation 等仍由既有 Schedule eligibility 決定。

## Integration 與 persistence

Generator 自動呼叫 producer，不需要 caller 手動塞 relationshipEvidenceRef。Source adapter 使用 `sourceAuthority=canonicalRelationshipProducer`；Candidate/Opportunity provenance 保存 invitationSourceId、producerType、evidenceRefs、reasonCode，並保留舊 networkEvidenceRef/relationshipEvidenceRef 等輕量 refs。

仍只使用 materializeOpportunityCandidate，結果是 optional offered Opportunity。Query/adapter 不建立 Opportunity，不 accept，不 schedule。Sources 只在查詢時推導，不存入 player/save。Y1 evidence 在 Y2 可重新推導新 ID、保留原 refs；reload 重新推導的 ID、排序、原因、precedence 相同。

既有 Exchange integration Test 16 的 own-key 清單加入新正式 provenance keys；原 string equality 與遞迴禁止 evidence payload 的 assertions 保留，沒有放寬 object-copy contract。

## Validation matrix

本表採 foundation fixture 的 A=player school、B=opponent；真實 production tests 另使用 canonical invitation school 與 regional-power-school。Y2/S 為 year-two-spring-evaluation / sequence 1。ID 欄是完整 deterministic tuple 的可讀別名，並非存入世界的新 ID 格式。

| Scenario | Year | Phase | Evidence | Producer | Direction | Opponent | Source ID alias | Eligible? | Reason | Candidate type | Precedence | Opportunity created? | Auto scheduled? | Expected origin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Prior away return | 2 | S | returnVisitEligible | returnVisit | opponent visits A | B | ID(return,Y2,S,host,awayRef) | yes | returnVisitFromPriorAwayVisit | outgoing | 1 | explicit materialize | no | homeInvitationFriendly |
| Prior home return | 2 | S | returnVisitEligible | returnVisit | A visits opponent | B | ID(return,Y2,S,visit,homeRef) | yes | returnVisitFromPriorHomeVisit | incoming | 1 | explicit materialize | no | awayInvitationFriendly |
| Coach contact | 2 | S | coachSchoolConnection | coachNetwork | opponent visits A | B | ID(coach,Y2,S,host,contactRef) | yes | coachConnectionToOpponentSchool | outgoing | 2 | offered | no | homeInvitationFriendly |
| Development | 2 | S | developmentExchange | schoolRelationship | both possibilities | B | ID(school,Y2,S,direction,devRef) | yes | priorDevelopmentExchange | incoming/outgoing | 3 | query alone: no | no | away/home friendly |
| Shared training | 2 | S | sharedTrainingContext | schoolRelationship | both possibilities | B | ID(school,Y2,S,direction,campRef) | yes | sharedTrainingContact | incoming/outgoing | 3 | query alone: no | no | away/home friendly |
| Competition-only | 2 | S | competitionEncounter | none | none | B | none | no | competitionEncounterNotFriendlyRelationship | no real friendly | none | no | no | none |
| Combined sources | 2 | S | return + coach + awayVisit | all three | opponent visits A | B | three producer-specific IDs | winner eligible | source-specific | outgoing winner | return wins | explicit only | no | homeInvitationFriendly |
| Fallback superseded | 2 | S | real return | return vs fallback | opponent visits A | B | return ID vs foundation ID | fallback no | supersededByCanonicalSource | outgoing | real wins | no duplicate | no | homeInvitationFriendly |
| Existing Opportunity | 2 | S | later coach evidence | coachNetwork | opponent visits A | B | new source ID diagnostic | consumed | existingOpportunityPreserved | excluded | old history retained | existing only | no | existing context retained |
| Cross-year derive | 1→2 | prior phase→S | same Y1 refs | return/school | evidence-derived | B | ID(Y1) != ID(Y2) | current phase yes | original reason retained | year-specific | stable | explicit only | no | direction-derived |

Production tests explicitly accept and schedule both return directions, launch real Y2 matches and play to completion with GameRecord integrity. That scheduling is test action, not a producer side effect.

## Evidence source coverage matrix

| Evidence domain | Canonical authority | Producer support | Direction support | Limit |
|---|---|---|---|---|
| returnVisitEligible | HighSchoolExchangeNetwork parent chain | returnVisitProducer | reversed host/visitor | eligibility only; no guarantee |
| coachSchoolConnection | ledger + current invitation coach ID | coachNetworkProducer | initiated outreach / bilateral contact possibilities | no coach-only source |
| schoolExchangeMatch | completed managed match evidence | schoolRelationshipProducer | explicit visit or neutral bilateral | no raw history scan |
| homeVisit | ledger hostedOpponent fact | schoolRelationshipProducer | player may visit opponent | independent from return producer |
| awayVisit | ledger visitedOpponent fact | schoolRelationshipProducer | opponent may visit player | independent from return producer |
| developmentExchange | ledger completed development fact | schoolRelationshipProducer | bilateral contact | not returnVisit by itself |
| sharedTrainingContext | ledger completed training fact | schoolRelationshipProducer | bilateral contact | no camp planner/opportunity |
| competitionEncounter | ledger official encounter | diagnostic only | no friendly direction | requires separate real relationship evidence |

## Architecture classification

| ID | Result |
|---|---|
| HS-INVPROD-001 | canonical ephemeral invitation source contract |
| HS-INVPROD-002 | return-visit producer with origin/current-year separation |
| HS-INVPROD-003 | explicit coach-network source with affiliation checks |
| HS-INVPROD-004 | reason-preserving school/development/training contacts |
| HS-INVPROD-005 | direction maps through existing Schedule/Match Context |
| HS-INVPROD-006 | stable tuple identity + scoped consumption |
| HS-INVPROD-007 | return > coach > school > fallback; ASCII tie-break |
| HS-INVPROD-008 | generator auto-consumes producer output through adapter |
| HS-INVPROD-009 | fallback supersession and existing-history preservation |
| HS-INVPROD-010 | no source persistence; deterministic reload derivation |

## Validation results

- New foundation：37/37 PASS。
- New production integration：25/25 PASS。
- Ground-ball blocker：26/26 PASS。
- Existing Exchange：foundation 40/40、production 24/24 PASS。
- Existing generation：foundation 40/40、production 21/21 PASS。
- Selected regression：57/57 files PASS。
- Full JS/CJS syntax：278/278 PASS。
- Full regression：185/185 files PASS。
- 1,400-game audit：1,000 bench + 400 starter completed；orphan / noProgress / match-state / GameRecord issues 全為 0；deterministic=true、instrumentationNeutral=true。

Foundational precedence 測試曾發現 fallback 以未綁定 opponent 的原 source 查 winner；修正為使用已展開的 candidate semantic key 後通過。沒有更換測試 seed、skip/allowlist 或放寬 authority。完整回歸開始前此缺陷已修復。

[逐檔驗證與 audit JSON](friendly-invitation-return-visit-producer-validation.json)。

## Closeout（49 項）

| # | Item | Result |
|---|---|---|
| 1 | Baseline | 6aa2a2c，main/origin 0/0，開始 clean |
| 2 | Changed files | 下列 8 檔；未修改 script.js 或 ledger authority |
| 3 | Existing evidence audit | 上述 8 domains；只讀 ledger |
| 4 | Source contract | versioned ephemeral source facts |
| 5 | Identity | deterministic tuple，含 current year/phase/sequence/refs |
| 6 | Lifecycle | derived eligible/ineligible/consumed，不持久化 |
| 7 | Return producer | canonical returnVisitEligible input |
| 8 | Return direction | prior away → home；prior home → away |
| 9 | Coach producer | explicit contact → source |
| 10 | Coach validity | currentCoachId/affiliation/source/pool checks |
| 11 | School producer | exchange/home/away facts |
| 12 | Development producer | priorDevelopmentExchange reason |
| 13 | Shared training producer | friendly contact only |
| 14 | Competition negative | no friendly source；diagnostic retained |
| 15 | Provenance | invitationSourceId/producerType/evidenceRefs/reasonCode |
| 16 | Dedup | tuple identity + semantic consumption |
| 17 | Precedence | return > coach > school > fallback |
| 18 | Fallback | remains where no valid real source；otherwise superseded |
| 19 | Existing Opportunity | preserve history；no duplicate even after coach affiliation change |
| 20 | Candidate integration | automatic producer consumption，canonicalRelationshipProducer authority |
| 21 | Opportunity lifecycle | existing materializer → offered |
| 22 | Schedule authority | unchanged，explicit accept/schedule only |
| 23 | Match Context authority | unchanged，both real future directions PASS |
| 24 | Naming audit | outgoing=player-host intent；incoming=player-visitor intent |
| 25 | Cross-year | Y1 refs → fresh Y2 ID；same-year later scope allowed |
| 26 | Save/load | same IDs/order/reasons/precedence |
| 27 | Ledger immutability | deep state snapshot query tests PASS |
| 28 | Strength neutrality | not an eligibility input；metadata unchanged |
| 29 | RNG neutrality | Math.random throw guard PASS |
| 30 | Determinism | source/input-order tests PASS；1,400-game audit deterministic=true |
| 31 | Instrumentation | trace source/candidate equivalence PASS；1,400-game audit instrumentationNeutral=true |
| 32 | Blocker regression | 26/26 PASS |
| 33 | Exchange foundation | 40/40 PASS |
| 34 | Exchange production | 24/24 PASS |
| 35 | Opportunity regression | existing generation/schedule/context tests PASS |
| 36 | Selected | 57/57 PASS |
| 37 | Syntax | 278/278 PASS |
| 38 | Full | 185/185 files PASS |
| 39 | Audit | 1,000 bench + 400 starter completed；orphan / noProgress / match-state / GameRecord issues 全為 0；deterministic=true、instrumentationNeutral=true |
| 40 | Validation matrix | 10 scenarios above |
| 41 | Coverage matrix | 8 evidence domains above |
| 42 | Architecture | HS-INVPROD-001..010 |
| 43 | Blockers | None；所有驗證 gate 通過 |
| 44 | Probability | deferred |
| 45 | Camp producer | deferred |
| 46 | Next recommendation | source variation adequate for later selection; camp planning remains absent, prefer audit camp sources before choosing next Sprint. Nothing started |
| 47 | Diff check | PASS（含新增檔案空白檢查） |
| 48 | Status | 3 tracked modified + 5 untracked files；main/origin 0/0；no commit/push |
| 49 | Stop Conditions | A–M 均未觸發 |

Changed files：high-school-friendly-invitation-producer.js、high-school-match-opportunity-generation.js、index.html、tests/high-school-friendly-invitation-producer-foundation-test.js、tests/high-school-friendly-invitation-producer-production-integration-test.js、tests/high-school-exchange-network-production-integration-test.js、本文件、validation JSON。

沒有 commit、push 或開始下一 Sprint；工作目錄保留等待人工驗收。
