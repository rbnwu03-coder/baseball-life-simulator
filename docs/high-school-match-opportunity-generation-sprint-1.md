# High School Match Opportunity Generation — Sprint 1

本 Sprint PASS。候選為即時計算資料；只有正式 Opportunity 與 Schedule Entry 持久化。新測試 61/61、依賴回歸 109/109、完整回歸 180/180、JS/CJS 語法 271/271 全數通過；1400 場 audit 全部完賽且完整性問題為 0。原始結果與 12 個情境的實際 candidate/Opportunity ID 見 companion validation JSON。

## Closeout（57 項）

| # | 項目 | 實作／判定 |
| --- | --- | --- |
| 1 | Baseline | main／HEAD／origin/main = `007aedd feat: integrate high school match opportunities and schedule entries`；施工前 clean，ahead/behind 0/0；已檢查最近三筆 commit。 |
| 2 | Changed files | 新增 generator、foundation test、production integration test、此文件與 validation JSON；修改 index.html、script.js、high-school-schedule-opportunity.js。沒有修改舊測試、player.js 或 save.js。 |
| 3 | Existing source audit | 下方 Source Coverage Matrix 區分 AVAILABLE_CANONICAL、AVAILABLE_BUT_OUT_OF_SCOPE、NOT_AVAILABLE。 |
| 4 | Eligibility context | `deriveEligibilityContext`：careerId、careerYear、seasonPhase、sequence、playerSchoolId、graduated、mandatorySlots；由現有生涯／事件／schedule execution context 讀取，無新時鐘。 |
| 5 | Opponent pool | `deriveOpponentCandidatePool` 讀 canonical school/team records；校隊 ID 去重、排除自身、無 ID、錯誤 teamType、無來源及無效 roster record。 |
| 6 | Candidate contract | candidateId、career/year/phase/sequence、type、player/opponent ID、structured source、sourceAuthority、priority、plannedContext、origin/host/venue intent、eligibility/exclusion reasons、provenance、可選的 quality/coach references。 |
| 7 | Candidate vs Opportunity | 推導可產生 0..N 候選，無 state mutation；materialize 才建立 Opportunity，並不建立 Schedule Entry。 |
| 8 | Candidate identity | `VERSION + careerId + year + phase + sequence + type + source.type/sourceId + playerSchoolId + opponentSchoolId` 的 encoded canonical tuple；無 displayName、Date.now、UUID 或 RNG。 |
| 9 | Ordering | source facts canonical JSON 排序；candidate 依 mandatory/optional、type、opponent ID、candidate ID 排序；不用環境 locale、Object iteration 或隨機順序。 |
| 10 | Type eligibility | 六種既有 type；incoming/outgoing 可有明示 foundation fallback，development 需要既有來源，camp/neutral 需要明確來源，official 需要競賽權威。 |
| 11 | Season phase | 沿用五種現有 match phase；其他真實事件（例如 critical_offseason）保留其 event ID，產生 phaseNotMatchEligible 診斷，不借用下一場 phase 假裝現在可開賽。 |
| 12 | Career year | 整數 Y1/Y2/Y3，無 Y1=友誼賽、Y3=正式賽的內容限制；非高中章節不能有 eligible candidate。沒有新增年齡門檻或真實月份。 |
| 13 | Official projection | `deriveOfficialCompetitionCandidates` 是相同 generator 的 mandatory projection。來源為既有 stage reservation，或 canonical Edition/Entry 與明示 match reference。未建立 edition、entry、stage 或 roster policy。 |
| 14 | Mandatory priority | mandatory 排在前方且不受 optional limit 淘汰；被原比賽消費後保留 rejected diagnostic，避免重新開賽。 |
| 15 | Optional conflicts | 同 year/phase/sequence 的 mandatory reservation 或現有 official entry 產生 blockedByMandatoryCompetition；其他既有 entry 產生 scheduleSlotOccupied。未安排前可同時保留多個 optional candidates。 |
| 16 | School/team source | 讀 schoolInvitationState 的已存在校隊/名冊、competitionFoundation.teams，以及上一 Sprint schedule context 已宣告的 legacy match entry-point IDs；沒有增加 production school ID 清單。 |
| 17 | Strength handling | 只存 schoolStandard 與 schoolYearRosterIdentity reference；沒有重新生成名冊、重抽強度、copy capability 或強弱門檻。這是來源名冊的參照，不冒充該校當前全年狀態。 |
| 18 | Coach source | 保留既有 coachId metadata；只有輸入真實 networkEvidenceRef 時才允許 coachNetwork source。預設 production 沒有該 producer。 |
| 19 | School relationship | 需 relationshipEvidenceRef 才接受 schoolRelationship source；不存在時 relationshipEvidence=null，不造分數。 |
| 20 | Recent history | 讀三年度 match histories 的 matchId、highSchoolYear、opponentRosterIdentity；已完成的同 source match 不再 eligible。已知同對手的 match refs 進 provenance；不建立 cooldown days。 |
| 21 | Rival | 現有 highSchoolRivalContext 是球員敘事，不是 canonical rival-school graph；未用來提高候選權重。純 pool 支援明示 rivalRef hook。 |
| 22 | Camp source | 無現有 production camp plan producer；保留 trainingCampPlan + explicit source fixture。 |
| 23 | Geography | 無可用距離/交通/對手 availability calendar；校名文字不推算地理事實。 |
| 24 | Incoming | fallback/systemEligibility 僅表示具備成立資格；不是對手已主動邀請。測試明確 materialize、accept，產生 awayInvitationFriendly。 |
| 25 | Outgoing | 表示本校可考慮邀請；不是對方必然接受。測試明確 acceptance，產生 homeInvitationFriendly。 |
| 26 | Development | 真實高一第二次評估入口由 existing development source → candidate → Opportunity → 原 acceptance/scheduling path。foundationSelection 標示 existingDevelopmentStage。 |
| 27 | Camp candidate | trainingCampPlan existing source 或明確 fixture 才可成立；campId 保留在原 plannedContext。沒有自動產生三日集訓。 |
| 28 | Neutral candidate | 必須 explicit source/event facts，否則 missingNeutralSource；沒有預設生成中立邀請。 |
| 29 | Provenance | Opportunity.provenance.candidateRef 保留 candidateId、generationVersion、來源 refs、priorMatchRefs、eligibilityReasons、可用的 strength/coach/network/relationship refs。不是保存整份 candidate snapshot。 |
| 30 | Explainability | phase/type/source/identity/slot eligibility 與 rejection reason codes；fallback 有 foundationEligibilityOnly。詳見 diagnostics 與矩陣。 |
| 31 | Candidate dedup | 同 canonical tuple 一筆；重複輸入留下 duplicateCandidate 診斷。不同 source/type/phase/year 可產生不同候選。 |
| 32 | Existing Opportunity dedup | 相同 canonical Opportunity ID 或 provenance.candidateRef 存在即標 existingOpportunity；offered、accepted、scheduled、completed 對應資料均不重複建立。 |
| 33 | Materialization | `materializeOpportunityCandidate` 重新 derive 當下候選，拒絕 stale/blocked；呼叫上一 Sprint createOpportunity/offerOpportunity，重複 materialization 回傳原 Opportunity。 |
| 34 | Lifecycle | 新 materialization 一律 offered，包括 official projection；正式賽與既有 development caller 可依其現有權威明確 accept。generator 不 auto-accept，friendly 不 auto-schedule。 |
| 35 | Schedule authority | eligibility 與 collision reuse HighSchoolScheduleOpportunity；generator 沒有新的 schedule state machine。 |
| 36 | Context authority | origin/host/venue 由原 createOpportunity → MatchContext normalization 推導；沒有修改 match-context-foundation.js。 |
| 37 | Home slice | outgoing candidate → offered → explicit accept → entry → real home match，驗证下半局 offensive decision。 |
| 38 | Away slice | incoming candidate → offered → explicit accept → entry → real away match，驗证上半局 offensive decision。 |
| 39 | Official slice | 真實 admitted career + canonical CompetitionEdition/Entry fixture → official candidate → schedule → MatchContext → 完整比賽 → 既有 CompetitionEvidence；另驗現有 Y3 stage projection。 |
| 40 | Save/load | candidates 不存檔；真實 save/load 前後完整 derivation 相同。既有 Opportunity 的 candidateRef 隨原 provenance 保存，不 bump save version。 |
| 41 | Year transition | 真實 Y1→Y2 轉換後，舊 candidate materialize 被拒絕；Y2 正式春季 phase 可重新產生候選，Y1 已完成行程不阻擋全部 Y2 候選。 |
| 42 | RNG | 新 generator 無 Math.random、Date.now 或 roster-generation 呼叫；推導前後整份 player 相同。 |
| 43 | Determinism | 相同 state、序列化 round trip、調換 pool/source order 的 IDs/order/reasons 相同；不以 team strength 作選擇分數。 |
| 44 | Instrumentation | trace on/off 的 candidate output 相同；既有 1400-game audit 另驗 match instrumentation neutrality。 |
| 45 | Selected tests | 109/109 PASS，包含 schedule/opportunity、Match Context、主客場、scoreboard、GameRecord、Y1/Y2/Y3、生涯／年度轉換、competition/evidence、county/national selection、team strength、roster 及比賽規則。 |
| 46 | Full regression | 180/180 PASS，0 FAIL；所有 tests/*-test.js 加 callbackTest、content-flow-audit、vertical-slice-smoke 與 1400-game audit 四個既有入口，無 skip 或 allowlist。中斷續跑紀錄見下方。 |
| 47 | Syntax | 最終版本全量 271/271 JS/CJS PASS。 |
| 48 | 1400-game audit | Bench 1000 + Starter 400，1400/1400 completed；orphan=0、noProgress=0、match-state integrity=0、GameRecord integrity=0；deterministic=true、instrumentationNeutral=true。 |
| 49 | Candidate matrix | 見下方與 validation JSON。 |
| 50 | Source matrix | 見下方。 |
| 51 | Blockers | 無剩餘 blocker；沒有缺失權威迫使建立假資料或新 database。 |
| 52 | Probability deferred | 無 candidateScore、selectionWeight、probability、rarity、weighted lottery 或 RNG。 |
| 53 | Camp generation deferred | 僅 single-match plan hook；無 multi-day/multi-match itinerary。 |
| 54 | Next Sprint | 人工驗收後，優先補 Coach/School Relationship 或 Training Camp/Friendly Producer 的正式來源，再決定 probability。此輪不自動開始。 |
| 55 | Diff check | git diff --check PASS；新增檔案也逐一通過 whitespace check。 |
| 56 | Git status | main／007aedd，ahead/behind 0/0；三個 tracked modified（high-school-schedule-opportunity.js、index.html、script.js）+ 五個新增檔案（generator、兩支新測試、文件、JSON），共八個檔案，全部未提交。 |
| 57 | Stop Conditions | A–N 均未觸發；完整回歸無測試失敗。未 commit、未 push、未開始下一 Sprint。可建議本 Sprint 正式 PASS，等待人工驗收。 |

## Source coverage matrix

| Source domain | Exists / classification | Canonical authority | Used this Sprint? | Future hook? |
| --- | --- | --- | --- | --- |
| Competition calendar | 有現有 mandatory stage；AVAILABLE_CANONICAL | getHighSchoolScheduleExecutionContext.mandatorySlots / prepareHighSchoolYearThreeMatch；CompetitionDefinition/Edition/Entry | 是，只投影 ID；Entry 本身不冒充逐場 calendar | 其他正式 match producer 可提供 match reference、slot、entry refs |
| School/team pool | AVAILABLE_CANONICAL | schoolInvitationState.invitations/baseRoster；competitionFoundation.teams；既有 schedule schoolIds | 是；已建立的 4 校來源 + 既有對手模板 IDs，非全世界資料庫 | 可擴 canonical pool adapter |
| Coach | coachId/style 有；AVAILABLE_CANONICAL（metadata），network NOT_AVAILABLE | invitation.coachProfile；既有 coach player relationship | 只讀 coachRef，不把球員信任當校際 network | networkEvidenceRef |
| School relationship | NOT_AVAILABLE | 無 school-to-school graph | 否 | relationshipEvidenceRef |
| Team strength / school standard | AVAILABLE_CANONICAL | schoolYearRosterIdentity、teamStrengthProfile、schoolStandard | 只引用 identity/standard，不計算邀請率 | 後續 producer 可讀原 authority |
| Recent match history | AVAILABLE_CANONICAL | highSchoolYearOne/Two/ThreeMatchHistory | 同 source consumption／priorMatchRefs，無新時間模型 | 回訪的真實來源 refs |
| Player evaluation | AVAILABLE_BUT_OUT_OF_SCOPE | HighSchoolCompetitionReassessment / PlayingTimeGameExposure | 不影響 candidate 資格或挑選，不保證先發 | 可引用既有 evidence ID，未生成新評分 |
| Team evaluation | AVAILABLE_BUT_OUT_OF_SCOPE | TeamStrengthModel / selectedTeamStrengthProfile | 無新 team reputation model | 之後獨立設計 |
| Rival | AVAILABLE_BUT_OUT_OF_SCOPE | highSchoolRivalContext / 敘事球員關係 | 非 canonical rival school，未自動使用 | 明示 rivalRef |
| Training camp plan | NOT_AVAILABLE | 無 production plan producer | explicit fixture only | trainingCampPlan、campId、host/venue |
| Geography / availability | NOT_AVAILABLE | 校名不等於地理；無 travel/availability authority | 否 | 後續需正式來源 |

注意：`rosterValid` 是 pool adapter 的 admission 結果。已存在 school invitation 的名冊由 `TeamRosterFoundation.validateRoster` 驗證；Competition school team record 驗證其 type/organization；legacy entry-point 對手則引用前一 Sprint 已宣告的 template ID。候選推導不 materialize 任一對手名冊。

## Diagnostics observations

同一真實 Y3 career fixture、尚未開賽：

| Requested optional slot | Input school records | Valid opponents | Eligible candidates | Rejected candidates | Reason histogram |
| --- | --- | --- | --- | --- | --- |
| final-competition / sequence 1 | 9 | 7 | 1 mandatory | 14 optional | blockedByMandatoryCompetition=14；selfOpponent=2 |
| final-competition / sequence 2 | 9 | 7 | 15（含原 sequence 1 的 mandatory projection） | 0 | selfOpponent=2 |

同一 slot 可有數筆未安排的 optional candidates；沒有在此階段選到只剩一個。Self/duplicate school diagnostics 屬 pool input 層，與 rejected candidate count 分開統計。以上是來源/資格 audit，不是 balance metric。

## Candidate validation matrix

Opportunity ID 使用完整 encoded tuple，詳細值可由 candidate → canonical createOpportunity 得到；JSON 保存實際 materialization 範例，不以 display name 截短作 identity。

| Scenario | Career year | Season phase | Source | Candidate type | Opponent | Eligible? | Reason | Priority | Existing schedule conflict | Materialized? | Opportunity ID | Expected Match Origin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Official canonical entry | Y1 fixture / Y3 career | existing match phase | competitionCalendar / existing entry or stage | officialCompetitionOpportunity | canonical school B / existing Y3 opponent | yes | seasonPhaseAllowed, opponentValid, slotAvailable | mandatory | matching reservation | yes, then explicit accept | canonical tuple / JSON | officialCompetition |
| Incoming eligibility | Y3 | final-competition seq 2 | systemEligibility / fallback | incomingFriendlyInvitation | existing school/template ID | yes | foundationEligibilityOnly | optional | none | explicit test materialization | canonical tuple / JSON | awayInvitationFriendly |
| Outgoing eligibility | Y3 | final-competition seq 2 | systemEligibility / fallback | outgoingFriendlyInvitation | existing school/template ID | yes | foundationEligibilityOnly | optional | none | explicit test materialization | canonical tuple / JSON | homeInvitationFriendly |
| Development actual lifecycle | Y1 | post-autumn-evaluation seq 2 | developmentSchedule / existing | developmentMatchOpportunity | regional-power-school | yes | existing-followup-evaluation provenance | optional | none | yes, existing career caller | canonical tuple / JSON | developmentMatch |
| Training camp explicit | Y1 fixture | autumn-exhibition | trainingCampPlan / explicit fixture | trainingCampOpportunity | school B fixture | yes | plan present / phaseAllowed | optional | none | yes | canonical tuple / JSON | trainingCamp |
| Neutral explicit | Y1 fixture | autumn-exhibition | explicit source fixture | neutralExchangeOpportunity | school B fixture | yes | explicit neutral source | optional | none | adapter fixture | canonical tuple / JSON | neutralFriendly |
| Self opponent | Y1/Y3 | current match phase | school pool | none | own school | no | selfOpponent | n/a | n/a | no | none | none |
| Duplicate input | Y1 fixture | autumn-exhibition | duplicate school/source | canonical type retained once | school B fixture | one only | duplicateSchoolIdentity / duplicateCandidate | original | none | at most once | original tuple | original origin |
| Mandatory conflict | Y3 | final-competition seq 1 | systemEligibility | incoming/outgoing optional | any valid opponent | no | blockedByMandatoryCompetition | optional | official reservation | no | none | intent only |
| Scheduled duplicate | Y1/Y3 | original slot | same source | original candidate | same opponent | no | existingOpportunity / occupied slot | original | original entry | original only | original tuple | unchanged |
| Completed duplicate | Y1/Y3 | original slot | same source | original candidate | same opponent | no | existingOpportunity / completedSourceMatch | original | completed entry/history | original only | original tuple | unchanged |
| Y1→Y2 | Y1 then Y2 | post-autumn → Y2 spring | lifecycle / fallback | candidate IDs differ | same canonical school allowed | Y2 yes, stale Y1 no | stale candidate / new year slotAvailable | original | Y1 entry not Y2 slot | Y2 only if explicit | distinct year tuple | type mapping unchanged |

## Architecture classification

| ID | Contract | Implementation |
| --- | --- | --- |
| HS-OPPGEN-001 | Canonical eligibility context | deriveEligibilityContext + read-only career bridge |
| HS-OPPGEN-002 | Opponent pool | canonical-source validation + ID dedup |
| HS-OPPGEN-003 | Deterministic generation | stable source/type/opponent/ID order；no RNG |
| HS-OPPGEN-004 | Provenance | candidateRef、source authority、source/history/quality refs |
| HS-OPPGEN-005 | Explainability | eligibilityReasons、exclusionReasons、auditCandidates |
| HS-OPPGEN-006 | Mandatory preservation | official projection remains present; consumed source rejected, never duplicated |
| HS-OPPGEN-007 | Optional conflicts | existing Schedule eligibility + official reason classification |
| HS-OPPGEN-008 | Materialization | re-derive + createOpportunity/offerOpportunity |
| HS-OPPGEN-009 | Deduplication | tuple ID、existing Opportunity check、idempotent materialization |
| HS-OPPGEN-010 | Reload determinism | no candidate persistence/cache；real save/load equality test |

## Validation notes

新增 foundation test 40 項、production integration test 21 項。後者含真實高一 development 入口、高二年度轉換、Y3 主客場實際進攻、正式競賽 evidence 與 GameRecord、存讀檔與 phase diagnostics。Camp/neutral 為明示 fixture hook，並非已上線的 story producer。

另以 007aedd 比對 8 個核心規則函式，內容全部不變：isHighSchoolMatchWalkOff、shouldEndHighSchoolMatchAfterHalf、advanceHighSchoolMatchAfterHalfInning、resolveHighSchoolThirdOutIntegrity、classifyHighSchoolOrderedThirdOut、applyHighSchoolSimulatedPlateAppearance、resolveSimulatedHighSchoolPlateAppearance、applyHighSchoolDefensiveSettlementFacts。

既有 1400 場 audit 使用其原樣本/執行器；新 generator 路徑由上述專用測試覆蓋。沒有要求所有 legacy direct callers 立刻遷移。

完整回歸的報告寫入曾在保存 100 項 PASS 後遇到 Windows `UNKNOWN/open`。當時沒有測試斷言失敗；驗證 checkpoint 的檔名、順序與成功狀態後，從第 101 項續跑，沒有修改 production code。改為完成時以暫存檔一次寫入並替換報告。這項執行器 I/O 中斷與 regression failure 分開記錄，沒有跳過任何測試。
