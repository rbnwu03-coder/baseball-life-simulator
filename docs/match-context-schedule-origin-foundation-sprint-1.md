# Match Context & Schedule Origin Foundation — Sprint 1

Canonical Match Origin / Venue / Home-Away Context。施工與完整驗證完成：**Sprint PASS**。Full regression **176/176**、syntax **265/265**、1,400 場 audit 全綠；未 commit、未 push，保留 working tree 供人工驗收。

## Closeout

1. **Baseline**：`main`；HEAD / origin/main `7b3779b`，`fix: align live scoreboard with presentation cursor`；ahead / behind 0 / 0，施工前 working tree clean。
2. **Changed files**：新增 production `match-context-foundation.js`；修改 `script.js`、`save.js`，`index.html` 僅增加 module 載入。新增兩套測試 `tests/match-context-schedule-origin-foundation-test.js`、`tests/match-context-production-integration-test.js`，本文件與 `docs/match-context-schedule-origin-validation.json`。歷史測試、既有 Sprint 文件未修改。
3. **Previous implicit home assumptions**：creation 固定將玩家放 home roster；substitution incumbent、首次／後續 batting gate、offensive apply / batting order 固定 home；defensive gate / teammates / opponent pitcher / allowed runs 固定另一側；actualExposure 將上半局當成玩家守備；history / result / feed / scoreboard names 把 home 當玩家。下方 audit 區分這些真實耦合與正常棒球方位。
4. **Canonical Match Context**：`match.matchContext`，version `match-context-v1`；包含 matchId、matchOrigin、playerTeamId、opponentTeamId、homeTeamId、awayTeamId、hostContext、venueContext、assignmentSource、assignmentReason、provenance。factory / normalization 回傳 frozen context，不另存 playerIsHome。
5. **Origin vocabulary**：`officialCompetition`、`homeInvitationFriendly`、`awayInvitationFriendly`、`trainingCamp`、`neutralFriendly`、`developmentMatch`。未知 origin 拒絕。
6. **Provenance**：結構化 source / sourceId / reasonCode 可由呼叫者提供；缺省 source 依 origin 產生，主客分配另保留 assignmentSource / assignmentReason。比賽邀請使用 matchInvitation／coachInvitation 的來源，不混入入學 School Invitation domain。
7. **Venue context**：支援 homeGround、awayGround、neutralVenue、trainingVenue；可帶 hostTeamId。homeGround／awayGround 的 owner 依玩家／對手身分驗證。未增加球場、縣市、距離或住宿資料庫。
8. **Home-away authority**：match creation boundary 在既有名單產生後、match 建立與首筆事件之前建立 context。優先明確 IDs；其次 legacy compatibility、符合來源的 host assignment；否則 deterministic identity fallback。只交換已生成隊伍所在 slot，不重新生成球員或實力。
9. **Player/opponent identity**：`getHighSchoolPlayerTeamSide` 與 opponent query 由 context IDs 衍生。建立時 context 的 match / player / opponent IDs 必須與當場 roster identity 相符；host 不必是 home，也允許第三方場地主辦者。
10. **Top/bottom contract**：上半局永遠 away 進攻，下半局永遠 home 進攻。既有 half transition 不改；`deriveBattingSide` 提供 battingTeamId / fieldingTeamId 與對應 slot，currentSituation 使用可見 snapshot 的 half 衍生這些 IDs。
11. **Player-home routing**：既有 home 路徑保留；新 production fixture 驗完整比賽、下半局打擊 decision 及終場 scoreboard / GameRecord 對帳。
12. **Player-away routing**：新 fixture 驗上半局打擊、下半局守備 decision、完整比賽、away 替補 incumbent / lineup admission；沒有重寫 playback phase machine。
13. **Scoreboard integration**：R/H/E、inning lines、reveal boundary 原實作保留；只修兩列名稱的玩家／對手關係。player away 的 single 與後續合法保送推進得分只更新 away H/R/inning cell，home 不變；future PA 仍由既有 cursor 隱藏。
14. **GameRecord integration**：建立與載入時傳 context 的 home/away IDs；player entry ingestion 傳 derived player side。GameRecord module / schema / official scoring 未修改，既有 winner identity 已依正式 IDs 決定。
15. **Match result / winner**：玩家視角的勝負及終場文案使用玩家／對手 slot；player-away wins 與 player-home loses 均驗正確 winnerTeamId。再見比賽仍只有 home 能在下半局勝出，feed 的我方／對手稱呼依身分修正。
16. **Official competition handling**：既有 competition foundation 有 edition / entry / team identity，沒有正式 match home-away ordering producer，不能假稱有賽程順位。creation hook 接受 `options.matchContext` 的正式 IDs / source / scheduleEntryId 並保留。新 official context 未給 assignment 時明確標 fallback。既有 `final-competition` 建立路徑標 officialCompetition；未提供新 context 的既有 caller 維持明確 legacyFallback home，未隨機翻轉歷史場次。
17. **Home invitation handling**：inviter 預設 player school，hostAssignment 預設 home；明確 assignment 可以覆蓋預設，不把 inviter=home 當全球棒球規則。
18. **Away invitation handling**：inviter / host 預設 opponent，玩家預設 away；保留 awayGround 與 invitation provenance，可供未來敘事查詢。
19. **Training camp handling**：單場 context 可選帶 caller 提供的 campId；非中立場地且 host 是參賽隊伍時可優先 home，第三方 host 使用 deterministic fallback。只處理單場，沒有多日 itinerary 或 scheduler。
20. **Neutral venue handling**：中立 training camp 即使帶 host 也使用 deterministic fallback；host ownership 不等同 home assignment。neutralFriendly 使用相同獨立 namespace。
21. **Deterministic fallback**：固定 hash namespace 包含 version、assignment、matchId、seasonId、playerTeamId、opponentTeamId、assignmentSeed。相同輸入相同輸出，不同 match identity 可以分配不同 side；沒有 Math.random、Date.now 或 DOM。
22. **RNG neutrality**：context hash 不讀取 gameplay RNG。production fixture 對照 home／away 建立前後，simulationSeed / simulationCursor 相同，兩隊整份 roster 與 strength profile 只是交換 slot，沒有 home advantage 或 travel modifier。
23. **Legacy fallback**：沒有 explicit context 的舊 caller / isolated harness 保留 player-home。舊 save 沒有 context 時依已保存 GameRecord／roster IDs 建立 legacyFallback；若舊物件已有 explicit team IDs，保留它們並標 explicitAssignment，不能被 legacy rule 蓋掉。
24. **Save/load**：player-away 真實 saveGame / loadGame 保留 origin、venue、source、IDs、cursor 及可見 scoreboard；另驗無 context 但有 explicit away IDs 的舊資料遷移。無 save version bump。
25. **Normalization/idempotency**：六種 origin 重複 normalize 相同；同一 match 已建立後，重複 creation 保留整場資料及 RNG，衝突 context 拒絕，不重新分配。saved context 的 matchId 與比賽不符時拒絕。
26. **Decision routing**：首次打擊、後續打擊、late-player-offense relevance、替補與守備 gate 改查玩家／對手 side；決策選項、force、third-out、settlement、phase transitions 都沿用。最後半局的 player offensive pressure 不再限玩家下半局；實際 finalInningBottom / walk-off 棒球判定保留。
27. **CompetitionEvidence regression**：evidence ingestion / weight / reliability / evaluation module 未改；actualExposure 的守備半局改按玩家身分選取，仍計正式 halfInningEnd，沒有新增或降低樣本規則。history 的 opponent roster / strength 取對手 side，歷史欄名保留相容。
28. **Selection regression**：county、national、representative team 與 competition tests 已納入選定集合；沒有改 selection policy / U18 / roster rules。
29. **Match integrity regression**：force / multi-runner、third-out / attribution、tag-up、ground-ball、AI PA、BIP 等選定測試通過；棒球規則 modules 無 diff。
30. **Scoreboard regression**：上一 Sprint 兩套測試及歷史 cursor / presentation tests 通過；未新增 scoreboard truth、cursor 或 render mutation。
31. **Selected tests**：85/85 PASS；新 foundation 26/26、新 production integration 16/16。所有既有 test assertions 保留，未 skip / allowlist，未將舊 fixtures 改成 50/50。
32. **Full regression**：**176/176 PASS、0 FAIL**，含既有 1,400 場 audit，完整執行 502 秒。
33. **Syntax**：265/265 JS/CJS PASS。
34. **1,400-game audit**：**1,400/1,400 完成**（Bench 1,000、Starter 400）；orphan=0、noProgress=0、match-state integrity issues=0、GameRecord integrity issues=0。Audit 約 180 秒，已計入上述 176 suites。沿用既有 legacy-home seed corpus；新 player-away 路徑由本輪 production fixtures 覆蓋。
35. **Determinism**：新 context fixture 同輸入一致、reload 不翻轉；完整比賽 audit deterministic=true。
36. **Instrumentation neutrality**：unit trace on/off 不影響 context；完整 audit instrumentationNeutral=true。
37. **Remaining implicit assumptions**：舊 generator 的 home/away 變數名仍是玩家／對手的預分配 template，creation 依 context 排入實際 slot；legacy saved history 的 homeRosterIdentity / homeStrength 欄名維持「本校」歷史含義。非 highSchoolMatch 的童年 matchState / prototype score aliases 未納入本輪。這些不決定新 explicit match 的主客場。
38. **Deferred High School Schedule / Opportunity layer**：未做機率、coach network、school relations、賽程生成或地理 travel。未來 trip/camp opportunity → multiple schedule entries → 每場 Match Context；本輪僅保留單場輸入 hook。
39. **Next Sprint recommendation**：通過完整驗證後先人工驗收；下一個獨立範圍才研究 High School Schedule / Opportunity Integration，未提前啟動。
40. **git diff --check**：**PASS**；tracked diff 與新增檔案 whitespace check 均通過。
41. **git status**：`main` / HEAD / origin/main 仍為 `7b3779b`，ahead / behind 0 / 0。3 個 tracked modified（index.html、save.js、script.js）與 5 個 untracked（module、兩套 tests、兩份 docs），合計 8 個檔案；沒有其他變更。未 commit、未 push。
42. **Stop Conditions**：**A–J 均未觸發**。沒有需要 lifecycle / rule engine / team strength / evidence semantics 重寫的 blocker；full regression 0 failure。所有本輪 PASS Gate 完成。

## Assumption audit

| 類型 | 受影響入口 | 判定／處理 |
| --- | --- | --- |
| 真實 production 耦合 | prepareHighSchoolYearOneMatch | context creation + 已有 rosters 依 IDs 排入 slots |
| 真實 production 耦合 | insertPlayerIntoHighSchoolMatchLineup / shouldEnterHighSchoolMatchPlayer | 玩家 roster / incumbent / batting order 依 player side；admission validation 保留 |
| 真實 production 耦合 | shouldCreateHighSchoolFirstOffensiveMoment / shouldReachHighSchoolFinalOffensiveMoment / resolveHighSchoolOffensiveDecision | 玩家 offense side 與 PA apply / RBI / batting order 解耦 |
| 真實 production 耦合 | shouldReachHighSchoolDefensiveMoment / getInfieldTeammateForPosition / buildInfieldTeammateContext / prepareHighSchoolPlateDecision | 玩家 teammate 與對手 pitcher 依 IDs，不交換棒球規則 |
| 真實 production 耦合 | applyInfieldResolutionToHighSchoolMatch / applyRoutineDefensiveResolutionToHighSchoolMatch / applyCatcherResolutionToHighSchoolMatch | 既有結果交正確 batting side；不改出局／得分合法性 |
| 真實 production 耦合 | deriveHighSchoolMatchActualExposure / recordHighSchoolYearOneMatchHistory / settleHighSchoolYearOneMatch | 實際守備半局、對手 roster、玩家勝負依身分 |
| 真實 presentation 耦合 | scoreboard names / scoring context / half-end / walk-off feed | 我方／對手名稱查 context；不更換 feed formatter 或 UI |
| 正常棒球 invariant | half transition、isHighSchoolMatchWalkOff、shouldEndHighSchoolMatchAfterHalf、GameRecord | 上=away、下=home；home 下半局再見勝保留，不以玩家 side 反轉 |
| Fixture convenience / compatibility | 舊測試與 isolated VM、預分配 roster generator、legacy history 欄名 | 保留；explicit context 的新測試覆蓋另一側，不重寫舊 fixtures |
| 非本輪 domain | 童年 matchState.homeScore / awayScore、舊 prototype UI | 不動，不用它們建立 highSchoolMatch context |

## Validation matrix

Unit rows：A=`school-a`，B=`school-b`；matchId=`game-1`、seasonId=`2026`、assignmentSeed=17。
Production rows：P=`school-powerhouse-409d352a`，O=`hs-y3-final-regional-opponent`。主客完整比賽與讀檔皆走現有 career VM / production functions。

| Scenario | Origin | Player team | Home team | Away team | Venue | Assignment source | Top offense | Bottom offense | Save/reload | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home invitation friendly | homeInvitationFriendly | A | A | B | homeGround / A | hostAssignment | B | A | normalize equality | PASS |
| Away invitation friendly | awayInvitationFriendly | A | B | A | awayGround / B | hostAssignment | A | B | normalize equality | PASS |
| Training camp neutral | trainingCamp | A | A | B | neutralVenue | fallback | B | A | normalize equality | PASS |
| Official competition | officialCompetition | A | B | A | neutralVenue | competitionSchedule | A | B | normalize equality | PASS |
| Legacy fallback | developmentMatch | A | A | B | neutralVenue | legacyFallback | B | A | normalize equality | PASS |
| Player-home production | homeInvitationFriendly | P | P | O | homeGround / P | hostAssignment | O | P | existing home save regression | PASS |
| Player-away production | awayInvitationFriendly | P | O | P | awayGround / O | hostAssignment | P | O | real save/load equality | PASS |
| Official production | officialCompetition | P | O | P | neutralVenue | competitionSchedule | P | O | normalize/reuse equality | PASS |

## Rule / architecture classification

| ID | Contract | Implementation / verification |
| --- | --- | --- |
| MATCH-CONTEXT-001 | Canonical match origin | closed origin vocabulary stored on match; foundation tests |
| MATCH-CONTEXT-002 | Explicit home / away identity | distinct participants validated before match creation; GameRecord gets same IDs |
| MATCH-CONTEXT-003 | Player-team independence from home | derived side, home/away full production fixtures |
| MATCH-CONTEXT-004 | Venue semantic context | four venue types, owner checks, third-party host / neutral camp fixtures |
| MATCH-CONTEXT-005 | Origin provenance | structured source / sourceId / reasonCode, assignment authority separately retained |
| MATCH-HALF-001 | Top = away offense | unchanged engine half assignment, explicit battingTeamId query |
| MATCH-HALF-002 | Bottom = home offense | unchanged engine half assignment, explicit fieldingTeamId query |
| MATCH-PERSIST-001 | Context persists across save/load | real away save/load + legacy migration + conflicting identity rejection |
| MATCH-DETERMINISM-001 | Fallback deterministic | namespaced identity hash, no gameplay RNG / clock / DOM |

上述九項 architecture classifications 均為 **PASS**；完整測試名單及最終計數記於 validation JSON。以上不代表已建立賽程、比賽邀請事件、移地集訓多日安排或主場能力加成。
