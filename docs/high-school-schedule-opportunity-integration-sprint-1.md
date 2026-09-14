# High School Schedule / Opportunity Integration Sprint 1

本輪 PASS：建立單場 Match Opportunity → Schedule Entry → Match Context → Match 的正式路徑。狀態與來源可持久化，沿用既有比賽、名冊、GameRecord 與選拔權威。完整回歸 178/178、全 JS/CJS 語法 268/268、1400 場 audit 全數通過。詳細結果收於 `high-school-schedule-opportunity-validation.json`。

## 1. Baseline

施工前 `main`／HEAD／origin/main 均為 `9824df5 feat: establish canonical match context and home-away assignment`，ahead/behind = 0/0，工作目錄乾淨。保留此前已提交的各項 Foundation。

## 2. Changed files

新增 `high-school-schedule-opportunity.js`、兩支指定測試、本文件與驗證 JSON。修改 `index.html`（載入）、`player.js`（空狀態）、`save.js`（正規化與 active link 驗證）、`script.js`（單一生涯入口及來源／完賽接點）。沒有修改既有測試。

## 3. Career / time authorities

年度讀取 `highSchoolYearTransitionState.currentHighSchoolYear`，既有高一相容路徑使用 1。階段從 `getCurrentEventId()` 的既有事件或 `highSchoolNextOpportunity.phase` 取得；不改 `time.js`、年度推進或 Gregorian calendar。careerId 使用已持久化的 `schoolInvitationState.generationSeed`；新 ID 不读取顯示名稱或重新產生 seed。

## 4. Competition authority / input audit

CompetitionDefinition／Edition／Entry 保留在 `HighSchoolCompetitionFoundation`。其 entry 是參賽身分，並非逐場時間表；County／National stage 是選拔階段，並非比賽時段。現有高三 `prepareHighSchoolYearThreeMatch()` 的 `hs-y3-final-competition-1`／`final-competition` 是可讀取的 mandatory career stage。新層以該原始 match ID 作 reservation reference，不建立另一份 tournament bracket。

| Input | Class | Audit conclusion / use |
| --- | --- | --- |
| 年度、既有 phase、PlayingTime opportunity 的 matchId | A：現有可用 | 只作時間／既有比賽 identity；不複製球員出場安排 |
| selectedSchoolId、持久化 generationSeed、學校 roster teamId | A | 校隊／生涯 identity；對手使用已知 roster ID 或正式 school team registry |
| CompetitionEdition／Entry／Team | A | 純 ID reference，啟動前驗證 entry、edition、team 一致 |
| `highSchoolNextOpportunity` 與 followup evaluation | A | 已存在的生涯開賽意圖；接入本輪 production path |
| match history、competition reassessment evidence | A | 可用真實 ID 作 provenance hook；不自動推算邀請率 |
| `relationships.coachTrust`、現任教練 profile | B：存在但不適用 | 信任／個人互動及戰術來源，不是教練校際 network score |
| `schoolInvitationState.invitations` | B | 學生入學邀請；只取 canonical school identity，不轉成校際 Match Invitation |
| team strength、position competition、readiness | B | 既有比賽／球員使用权威，不用來建立新的 reputation/form 模型 |
| rival／敘事人物關係 | B | 不視為 canonical school-to-school relationship graph |
| coachNetwork、schoolRelationship、trainingCampPlan | C：明確 hook | source.type/sourceId；需要外部正式 producer 或明示 fixture，不假裝已有生成系統 |

## 5. Opportunity contract

`opportunityId, careerId, careerYear, seasonPhase, sequence, opportunityType, source, playerSchoolId, opponentSchoolId, matchOrigin, plannedContext, status, provenance, competitionRefs`。`createOpportunity` 驗證型別、身分、Y1–Y3、自我對手、序位、source、狀態與 context intent。`offerOpportunity` 在同一 ID 的不可變 facts 改變時拒絕。

## 6. Opportunity vocabulary

六種公開型別見下方映射；沒有新增球員能力、教練名聲、校際好感或機率欄位。

## 7. Schedule Entry contract

`scheduleEntryId, opportunityId, careerYear, seasonPhase, sequence, opponentSchoolId, matchOrigin, plannedContext, status, matchId`。完賽可加 `historyMatchId`、`gameRecordId`，不保存分數或球員統計。

## 8. Opportunity status

`offered → accepted / declined / expired`；accepted 可安排成 scheduled，或在尚未安排時 declined／expired。offered 不自動開賽。完賽後 opportunity 維持 scheduled，完成狀態由 entry 表達。

## 9. Schedule status

scheduled → inProgress → completed；cancelled 可表達取消且不可啟動。重複 schedule 呼叫回傳原 entry，包含其終止狀態，不能藉此重新安排或復活。

## 10. Single origin mapping

| Opportunity | Match origin | Default intent, from MatchContext authority |
| --- | --- | --- |
| officialCompetitionOpportunity | officialCompetition | neutralVenue；正式明示 assignment 或 deterministic fallback |
| incomingFriendlyInvitation | awayInvitationFriendly | 對手主辦、awayGround、玩家客場 |
| outgoingFriendlyInvitation | homeInvitationFriendly | 本校主辦、homeGround、玩家主場 |
| trainingCampOpportunity | trainingCamp | trainingVenue；可帶 host 或 neutral intent |
| developmentMatchOpportunity | developmentMatch | neutralVenue；允許既有 explicit assignment |
| neutralExchangeOpportunity | neutralFriendly | neutralVenue；deterministic assignment |

映射只定義於 `ORIGIN_MAP`。host／venue 預設與 home/away 選擇交給原 `MatchContextFoundation`，不重寫 hash 或分配演算法。

## 11. Phase

沿用 autumn-exhibition、post-autumn-evaluation、year-two-spring-evaluation、year-two-autumn-evaluation、final-competition。純模組接受 caller 的 canonical phase；eligibility 要求與 execution context 完全一致。單元 fixture 另驗 Y1 spring optional slot。

## 12. Year identity

careerYear 僅接受整數 1／2／3。機會 ID 包含年度；年度轉換不修改過去 entry。真實 Y1→Y2 transition 測試確認保留原 facts 且不能當作 Y2 可用機會。

## 13. Source / provenance

source 至少包含 type/sourceId，可保留真實 coachId 或 triggerEvidenceRefs。provenance 保留 reason；competitionRefs 保存既有 edition／entry 等 ID。來源資料由 producer 或明示 fixture 提供，不自行生成履歷證據。

## 14. School Entry Invitation separation

入學邀請仍由既有 `schoolInvitationState` 擁有；新 `highSchoolSchedule.opportunities` 使用獨立 opportunityId，表示校際比賽。PlayingTimeGameExposure 的 opportunityDecision 亦保持原域。

## 15. Coach network hook

`source.type = coachNetwork`，sourceId 指向聯繫／事件來源。Production fixture 明示 `fixture-coach-contact`，未宣稱是遊戲內自動生成的 network。

## 16. School relationship hook

`schoolRelationship` 僅為來源 vocabulary。沒有關係分數、學校距離、交通成本或新 rival graph。

## 17. Recent performance hook

既有 match/evaluation ID 可傳入 source/provenance；本輪沒有「近期表現 → invitation probability」或新的 recentForm 算式。

## 18. Official priority

既有 mandatory stage reservation 在 optional entry 建立前即可阻擋同 slot。已有 official entry 也鎖住 slot。official 不會被 optional 覆寫；未提供時間權威的 competition registration 不被冒充為已排定的一場比賽。

## 19. Conflict policy

同 careerYear + seasonPhase + sequence 且未 cancelled 即占用；所有衝突拒絕，無默默取代。沒有排程最佳化或 optional→official 自動移位。純模組可消費外部 canonical mandatorySlots；本輪 runtime 只橋接已確認的高三 mandatory stage。

## 20–24. Incoming / outgoing / camp / neutral / development

Incoming 產生玩家客場、上半局進攻；outgoing 產生玩家主場、下半局進攻。兩者均走真正 Match Engine 決策。campId 與 matchId 分離，一個 opportunity 一場比賽；neutral 使用原 deterministic assignment。Development production slice 為高一第二次評估賽，以明示既有主客 assignment 保留原生涯行為。

## 25. Entry → context adapter

`deriveMatchContextInput` 是單一 adapter。schedule 層提供參賽者 ID、origin、host/venue intent、season identity、scheduleEntryId 與 provenance。`launchHighSchoolScheduleEntry` 先驗證 eligibility、active match 與既有 match identity，再呼叫原 prepare 函式。

## 26. Provenance chain

opportunityId → entry.opportunityId → MatchContext.provenance.opportunityId / scheduleEntryId → match.id / match.matchContext → GameRecord.gameId。完賽 entry.gameRecordId/historyMatchId 連回同一比賽。GameRecord 不新增結果副本。

## 27–28. Home / away integration

沿用原 context validation、roster swapping、Top=away、Bottom=home。新測試走 admitted career、capability settlement、正式 roster 與實際 offensive decision；不跳過 admission。

## 29. Completion

在原 `settleHighSchoolYearOneMatch` 完成 GameRecord 與 match history 後，`markScheduleCompleted` 更新已管理的 entry。反覆完賽回写為 idempotent；entry 已 completed 便不能 relaunch。

## 30. Result authority

唯一活動比賽仍是 `player.highSchoolMatch`。entry 只存 ID／狀態，無第二份 scores、hits 或 player stats。結果保持 GameRecord 與既有 history 權威。

## 31. CompetitionEvidence

明示競賽 references 必須對應現有 entered entry／edition／player school。啟動時只傳遞其 ID 給既有 match fields，使原 settlement 可產生 evidence。真實完整比賽測試驗證 canonical source ID 與 GameRecord entry ID；不改權重、可靠度或統計語意。

## 32. Selection

沒有修改 county／national selection、threshold 或 roster policy。相關既有測試列入 regression。

## 33. Save / load

`createInitialPlayer` 新增空狀態，`normalizeSave` 正規化並驗證 opportunity／entry identity、status、slot 唯一性、對應 facts 與 active match context。accepted／scheduled／inProgress／completed 全部有 persistence 驗證。進行中的 entry 不能回到 scheduled 或換 match。外層 save version 不變。

## 34. Legacy compatibility

舊存檔沒有新欄位時恢復空 lists，不捏造歷史行程。既有 direct match caller 保留；未载入新模組的舊嵌入式測試 runtime 沿用 direct path。外部先前 MatchContext 的 scheduleEntryId 若非本模組管理，不自動生成 entry。

## 35. Idempotency

Opportunity ID 由 career seed、年、phase、sequence、type、source type/sourceId、兩校 ID 的 encoded tuple 組成。Entry ID 由 opportunityId 的 encoded tuple 組成，無 hash 碰撞或時鐘。重複 offer 比對 immutable facts，重複安排回傳同 entry；重複 start 只在 active link 完整時回傳同一比賽。

## 36–38. Determinism / RNG / instrumentation

新模組沒有 Date.now、Math.random 或 gameplay RNG 呼叫。same facts 產生同一 context／entry；新 production fixture 比較相同 seed、roster context 與 simulationCursor=0。既有 1400 場 audit 驗證 match deterministic 與 instrumentation neutrality；它使用原 audit 生涯樣本，新 schedule vertical slice 由專用測試補足。

## 39–42. Validation

- 新測試：foundation 33/33；production integration 19/19，共 52/52 PASS。
- 39. Selected regression：103/103 PASS，包括 Match Context、主客場、scoreboard、GameRecord、force、third-out、tag-up、ground-ball、AI PA、BIP、高中各年度、生涯、存檔、competition evidence、county/national selection 與 representative contract。
- 40. Full regression：178/178 PASS，0 FAIL，無 allowlist 或 skip。包含所有 `tests/*-test.js` 與既有 callbackTest、content-flow-audit、vertical-slice-smoke、1400-game audit 四個額外入口。
- 41. 全 JS/CJS syntax：268/268 PASS。
- 42. 既有 1400-game audit：bench 1000 + starter 400，1400/1400 completed；orphan=0、noProgress=0、match-state integrity issues=0、GameRecord integrity issues=0；deterministic=true、instrumentationNeutral=true。

另外比對 baseline 的 8 個核心規則函式，全部相同：`isHighSchoolMatchWalkOff`、`shouldEndHighSchoolMatchAfterHalf`、`advanceHighSchoolMatchAfterHalfInning`、`resolveHighSchoolThirdOutIntegrity`、`classifyHighSchoolOrderedThirdOut`、`applyHighSchoolSimulatedPlateAppearance`、`resolveSimulatedHighSchoolPlateAppearance`、`applyHighSchoolDefensiveSettlementFacts`。

## 43. Blocking issues

無 blocking issue。開發中的新測試曾發現 terminal entry 的 error precedence 不明確，已在 launch 入口先拒絕 completed/cancelled；未改舊有 gameplay contract。

驗證執行器第一次啟動後，檢查發現四個額外入口少了 `tests/` 前綴，在尚未發生測試 failure 時中止。修正並先檢查所有路徑存在後，完整重新執行一次，結果為上述 178/178；沒有將執行失敗排除或忽略。

## 44–45. Deferred work

邀請機率、coach network reputation、school relationship scoring、整年行程生成、排名、旅程成本與多日集訓均未實作。campId 獨立，可供未來多筆 entry 共享，但現在沒有 many-match generation。

## 46. Next Sprint recommendation

僅在本輪驗收後，可評估 Opportunity Generation / Camp & Friendly Generation；先建立正式來源 producer、學校候選池與時間供給契約。本輪不開始下一 Sprint。

## 47–49. Repository checks / stop conditions

- 47. `git diff --check` PASS；新增檔案也逐一通過 whitespace check。
- 48. Branch/HEAD 保持 main／9824df5，ahead/behind 0/0。四個 tracked modified files：index.html、player.js、save.js、script.js。五個 untracked files：新模組、兩支新測試、此報告、驗證 JSON。共九個檔案，全部未提交。
- 49. Stop Conditions A–K 均未觸發。沒有年度架構重寫、第二套 competition schedule、破壞性 migration、RNG 需求、主客場／scoreboard／GameRecord regression 或選拔語意修改；full regression 無失敗。

未 commit、未 push、未開始下一 Sprint。可建議本 Sprint 正式 PASS。

## Architecture classification

| ID | Contract | Implementation |
| --- | --- | --- |
| HS-SCHEDULE-001 | Opportunity | createOpportunity / offerOpportunity；六型別、純 facts |
| HS-SCHEDULE-002 | Schedule entry | scheduleOpportunity；單場、ID references |
| HS-SCHEDULE-003 | Mapping | ORIGIN_MAP + MatchContext authority |
| HS-SCHEDULE-004 | Official priority | mandatorySlots + occupied slot guard |
| HS-SCHEDULE-005 | Optional conflicts | deterministic rejection，零覆寫 |
| HS-SCHEDULE-006 | Opportunity provenance | structured source、provenance、competitionRefs |
| HS-SCHEDULE-007 | Schedule/context provenance | 單一 deriveMatchContextInput adapter |
| HS-SCHEDULE-008 | Completion lifecycle | markScheduleStarted / markScheduleCompleted |
| HS-SCHEDULE-009 | Persistence | normalizeState + assertActiveMatchLink |
| HS-SCHEDULE-010 | Deduplication | encoded tuple ID、facts comparison、terminal guard |

## Validation matrix

下表區分 fixture contract 與實際生涯 integration；不是宣稱已存在自動邀請 generator。

| Scenario | Career year | Season phase | Opportunity type | Source | Opponent | Opportunity status | Schedule status | Match origin | Venue intent | Player side | Conflict result | Save/reload | Final status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Incoming actual flow | Y3 | final-competition / sequence 2 | incomingFriendlyInvitation | coachNetwork fixture | hs-y3-final-regional-opponent | scheduled | completed | awayInvitationFriendly | awayGround | away | free slot | accepted→scheduled→active→completed tested | PASS |
| Outgoing actual flow | Y3 | final-competition / sequence 2 | outgoingFriendlyInvitation | coachNetwork fixture | hs-y3-final-regional-opponent | scheduled | inProgress | homeInvitationFriendly | homeGround | home | free slot | generic state normalization | PASS |
| Camp contract | Y1 | spring / sequence 1 | trainingCampOpportunity | explicit fixture | school-B | scheduled | scheduled | trainingCamp | trainingVenue | MatchContext deterministic | free slot | shared normalizer | PASS |
| Neutral contract | Y1 | spring / sequence 1 | neutralExchangeOpportunity | explicit fixture | school-B | scheduled | scheduled | neutralFriendly | neutralVenue | MatchContext deterministic | free slot | shared normalizer | PASS |
| Development actual lifecycle | Y1 | post-autumn-evaluation / sequence 2 | developmentMatchOpportunity | developmentSchedule | regional-power-school | scheduled | completed | developmentMatch | neutralVenue / explicit assignment | home | free slot | preserved across Y1→Y2 | PASS |
| Official actual full game | Y3 | final-competition / sequence 1 | officialCompetitionOpportunity | competitionCalendar / existing stage ID | hs-y3-final-regional-opponent | scheduled | completed | officialCompetition | neutralVenue | MatchContext deterministic | matching official reservation | canonical refs preserved | PASS |
| Official + friendly | Y1/Y3 | same phase / sequence | official + incoming | canonical entry / stage fixture | school-B / regional opponent | friendly accepted | no friendly entry | official retained | unchanged | unchanged | friendly rejected | no mutation | PASS |
| Declined | Y1 | spring | incomingFriendlyInvitation | coachNetwork fixture | school-B | declined | none | no match | intent only | none | not accepted | shared normalizer | PASS |
| Duplicate schedule | Y1/Y3 | original phase / sequence | incomingFriendlyInvitation | same source ID | same opponent | scheduled | original entry | unchanged | unchanged | unchanged | same entry returned | no duplicates after reload | PASS |
| Completed entry | Y3 | final-competition / sequence 2 | incomingFriendlyInvitation | coachNetwork fixture | regional opponent | scheduled | completed | unchanged | unchanged | away | relaunch rejected | completed preserved | PASS |
| Legacy direct | Y3 | final-competition | none | legacyFallback | regional opponent | none | none | existing origin | existing context | existing assignment | legacy path | empty lists, no backfill | PASS |
