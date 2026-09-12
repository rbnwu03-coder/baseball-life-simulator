# Force & Multi-Runner Settlement Integration Foundation — Sprint 1

本報告記錄 Canonical Force Chain Production Integration。歷史 audit 保持原樣；本輪結果與可重現矩陣另存於 `force-multi-runner-settlement-validation.json`。

## 施工與邊界

1. **Baseline**：main，HEAD / origin/main 均為 `107b6a17bb19f2463666c788c568ad3c58ffdadc`；ahead / behind 0 / 0；施工前 working tree clean。
2. **Changed files**：production 僅 `force-advancement.js`、`defensive-runner-throw-settlement-foundation.js`、`script.js`。新增兩個 force-multi-runner 測試及本報告、validation JSON。94 個既有測試檔只補 VM loader 依賴，未修改既有 assertion、預期值、skip 或 allowlist。完整清單見下方。
3. **Previous authority fragmentation**：builder 只存 physical override chain，legacy situation 可為 null；`applyDefensiveRunnerOutcome` 用局部壘包表，成功 DP 把 R2 / R3 留在原壘；只有 DP / secureFirst 的部分分支消費 Force helper。
4. **Canonical force authority**：沿用 `buildInitialLiveBallForceChain`、`deriveForceChainAfterRetirements`、`settleForceAdvancement`。未新增第二套 force engine。
5. **Initial force chain integration**：`buildInfieldMeaningfulMoment` 在產生 legal choices 前建立 chain 與 movement intents。physical override 沿用上游 chain；legacy/no physicalOverrides 也有 chain。舊 situation 欠缺 chain / intents 時不能直接走 cache return。
6. **Runner identity**：以 runnerId / originBase / targetBase 識別 BR 與每名既有跑者。settlement 檢查每個 actor 恰有一份 intent，拒絕未知 identity、重複 retirement、失序事件與目的壘碰撞，不靜默丟失跑者。
7. **Movement intent**：先存 forced、movementRequired、committed；初始 forced runner 在 conventional ground-ball settlement 中承諾往下一壘。未受迫跑者預設停留，只有既有 runnerContext 明確 advancing / committed 才移動。初始 intent 不含 safe / out；執行後 retirement 優先，其他 movement 才形成 provisional safe / home facts。
8. **Ordered retirements**：DP 的第一段 R1 / second / force / 1，第二段 BR / first / batterRunnerBeforeFirst / 2。是否完成仍由既有接球、轉傳、傳球與時間窗口決定。每次 retirement 保留 forceTargetsAfter。
9. **Force removal**：每次合法 retirement 呼叫既有 `deriveForceChainAfterRetirements`。BR 先出局會移除 R1 force；`classifyContinuationTarget` 回傳 tagRequired / noForceOut。若後续只提供踩二壘 force 事件，不增加 out。完整再傳觸殺執行不在本 Sprint。
10. **Survivor settlement**：處理所有初始 actor；退休覆蓋 movement，force 解除不抹掉已建立的 committed advancement；最後才重建一份 occupancy。`runnerSettlement` 保存 immutable evidence，不新增另一份可變、永久壘包 authority。
11. **Loaded DP**：`BUG-PLAYTEST-LOADED-DP-001` 直接走 real roster → builder → 二壘手 initiate463 execution → actual apply。0 out 滿壘成功 DP：R1 / BR 出局，R2 到三壘，R3 得 1 分，final outs 2。沒有 basesLoaded 分支。
12. **R1+R2 DP**：R2 到三壘；R1-only DP 清空壘包。均有 production apply assertion。
13. **Non-contiguous runners**：R2-only、R3-only 沒有因 BR 產生額外 force；R1+R3 只有 R1 受迫。矩陣另涵蓋全數初始 topology。
14. **3B invariant**：R3-alone secure-first、R1+R3 DP 保留原 R3，不自動 score；明確 committed home 的 pure settlement 另有正向測試。
15. **Run settlement**：survivor home 是 scoring candidate，交既有 third-out integrity 決定 legal IDs；透過 `applyHighSchoolDefensiveSettlementFacts` → `scoreHighSchoolMatchRunner` 套用。decision / routine infield 都使用此 mutation boundary。
16. **Third-out boundary**：未修改 `resolveHighSchoolThirdOutIntegrity`。adapter 優先讀 ordered retirement 的 outType，缺乏新 facts 的其他 defensive families 沿用原邏輯。loaded 1-out successful DP 仍取消本球得分並清空壘包。本輪未新增 timing-play 時間排序、appeal 或 fourth-out adjudication。
17. **Idempotency**：以現有 situation ID、simulation cursor、inning / half、batter identity 組合 play identity，保存在 situation 與既有 lastDefensiveResolution。相同已套用 identity 直接返回；不同現場 identity 的舊 execution 被拒絕。bases / outs / score 的 mutation 只在 apply boundary。
18. **Save/load**：未 bump save version。pending situation 經正式 normalizeSave 後保留 intents 並產生相同 execution；completed play reload 再 apply 不變。重複 apply 比較完整 match JSON；render rerun 比較 bases、outs、score 與 event log。
19. **GameRecord**：沿用原 run event 與 PA ingestion；known-bug production fixture 與額外 probe 確認恰好 1 個 run event，GameRecord 球隊總分、該局得分與 R3 batting.R 各增加 1。未修改 schema、PA official scoring classifier 或 independent runner-out pitcher attribution。
20. **CompetitionEvidence regression**：full-game competition evidence / player-line / MatchGameRecord 相關測試通過；evidence module 本身未修改。
21. **Selected tests**：新 pure/integration 19/19；新 production 16/16。Force、decision throw、runner throw settlement、ground-ball、infield admission、runner advancement、third-out、tag-up、catcher choice、GameRecord、gameplay、full-game、AI PA、BIP mapping、高中整合與 roster tests 均通過。physical fixture 實際第二段窗口 expired，只產生 1 out，並驗證 BR 存活及 R2 / R3 結算；未修改 timing 來製造 DP。
22. **Full regression**：170 / 170 FULL GREEN（含新增兩套與最後 1,400-game audit）。
23. **Syntax**：258 / 258 JS/CJS 語法檢查通過。
24. **1,400-game audit**：bench 1,000 + starter 400，共 1,400 / 1,400 completed；orphan 0、noProgress 0、match-state integrity issue 0、GameRecord integrity issue 0；audit runtime 250.272 秒。
25. **Determinism**：同樣 immutable chain / timing input 結果相同；pending save/reload resolver 結果相同。全場 audit 亦通過。
26. **Instrumentation neutrality**：本輪未新增 RNG。production fixture 的既有 resolver 消耗 1 次 sample；trace 由已存在 facts 組成。全場 audit 亦通過。
27. **Historical audit preservation**：原 `baseball-rules-integrity-audit-sprint-1.md` 與 `baseball-rules-integrity-audit-results.json` 不修改；已逐份與 baseline 正規化換行後比較，內容完全一致。
28. **Reclassified rules**：見下表。本輪分類只涵蓋指定 canonical infield settlement 與 force-removal legal classification；不宣稱已完成所有 baseball timing / tag continuation。
29. **Remaining blockers**：完整第二段 tag execution、完整 third-out timing / run / out attribution、FC official scoring、獨立跑者出局的 pitcher attribution、infield fly / appeal / LOB、scoreboard H delay 與 current-half ellipsis 維持原 scope 外項目。
30. **Next Sprint recommendation**：Third-Out / Run / Out Attribution Integrity，使用本輪 ordered facts；僅建議，未開始。
31. **git diff --check**：PASS，已檢查 tracked 與 untracked 新增檔案。
32. **git status**：main，97 modified + 4 untracked；ahead / behind 0 / 0。修改留在 working tree 待人工驗收；未 commit、未 push。
33. **Stop Conditions**：未觸發；本 Sprint PASS。沒有為修 0-out loaded DP 改 scoring law、GameRecord schema、BIP / AI / selection，也未增加 basesLoaded 特例。

## 規則重新分類

| Rule | Historical | 本 Sprint 判定 | 證據與限制 |
| --- | --- | --- | --- |
| RUN-FORCE-002 | PARTIAL | IMPLEMENTED | eligible infield builder 早期 chain + intents，R1 到二壘 obligation |
| RUN-FORCE-003 | CONFLICT | IMPLEMENTED | contiguous force chain 被所有 infield runner settlement 消費 |
| RUN-FORCE-005 | PARTIAL | IMPLEMENTED（legal classification） | ordered retirement 更新 force；BR-first 後踩壘不記 force out，完整 tag execution 待後續 |
| RUN-MULTI-001 | CONFLICT | IMPLEMENTED（本 Sprint infield scope） | 每個 actor 結算，再投影 occupancy；未宣稱 generic first-leg helper 已支持任意多次傳球 |
| RUN-MULTI-002 | PARTIAL | IMPLEMENTED（本 Sprint infield scope） | identity、intent、retired / safe / provisional scored evidence 與完整性檢查 |
| OUT-DP-001 | PARTIAL | IMPLEMENTED | ordered runnerId / targetBase / outType / sequence，不再只存 aggregate outs |
| OUT-DP-002 | CONFLICT | IMPLEMENTED | R1、R1+R2、loaded、R1+R3 real production cases |

## Validation matrix

| Scenario | Initial bases | Outs | Force chain | Retirements (in order) | Force after | Survivors | Final bases | Runs | Final outs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | ["R1",null,null] | 0 | {"BR":"first","R1":"second"} | — | {"BR":"first","R1":"second"} | BR → first; R1 → second | ["BR","R1",null] | 0 | 0 |
| R1+R2 | ["R1","R2",null] | 0 | {"BR":"first","R1":"second","R2":"third"} | — | {"BR":"first","R1":"second","R2":"third"} | BR → first; R1 → second; R2 → third | ["BR","R1","R2"] | 0 | 0 |
| R1+R3 | ["R1",null,"R3"] | 0 | {"BR":"first","R1":"second"} | — | {"BR":"first","R1":"second"} | BR → first; R1 → second; R3 → third | ["BR","R1","R3"] | 0 | 0 |
| R2 | [null,"R2",null] | 0 | {"BR":"first"} | — | {"BR":"first"} | BR → first; R2 → second | ["BR","R2",null] | 0 | 0 |
| R3 | [null,null,"R3"] | 0 | {"BR":"first"} | — | {"BR":"first"} | BR → first; R3 → third | ["BR",null,"R3"] | 0 | 0 |
| loaded | ["R1","R2","R3"] | 0 | {"BR":"first","R1":"second","R2":"third","R3":"home"} | — | {"BR":"first","R1":"second","R2":"third","R3":"home"} | BR → first; R1 → second; R2 → third; R3 → home | ["BR","R1","R2"] | 1 | 0 |
| R1 DP | ["R1",null,null] | 0 | {"BR":"first","R1":"second"} | 1: R1 @ second (force); 2: BR @ first (batterRunnerBeforeFirst) | {} |  | [null,null,null] | 0 | 2 |
| R1+R2 DP | ["R1","R2",null] | 0 | {"BR":"first","R1":"second","R2":"third"} | 1: R1 @ second (force); 2: BR @ first (batterRunnerBeforeFirst) | {} | R2 → third | [null,null,"R2"] | 0 | 2 |
| loaded DP | ["R1","R2","R3"] | 0 | {"BR":"first","R1":"second","R2":"third","R3":"home"} | 1: R1 @ second (force); 2: BR @ first (batterRunnerBeforeFirst) | {} | R2 → third; R3 → home | [null,null,"R2"] | 1 | 2 |
| loaded 1-out DP | ["R1","R2","R3"] | 1 | {"BR":"first","R1":"second","R2":"third","R3":"home"} | 1: R1 @ second (force); 2: BR @ first (batterRunnerBeforeFirst) | {} | R2 → third; R3 → home | [null,null,null] | 0 | 3 |
| BR-first force removal | ["R1",null,null] | 0 | {"BR":"first","R1":"second"} | 1: BR @ first (batterRunnerBeforeFirst) | {} | R1 → second | [null,"R1",null] | 0 | 1 |

第三出局發生時，survivors 欄是 scoring authority 接手前的 movement evidence；finalBases / scoringRunnerIds / runs / finalOuts 是既有 third-out authority 的結果。完整逐次 force 變化與 actor terminal flags 見 validation JSON。

## 修改檔案完整清單

- `defensive-runner-throw-settlement-foundation.js`
- `docs/force-multi-runner-settlement-integration-sprint-1.md`
- `docs/force-multi-runner-settlement-validation.json`
- `force-advancement.js`
- `script.js`
- `tests/adult-route-chain-test.js`
- `tests/application-controller-test.js`
- `tests/aspiration-narrative-test.js`
- `tests/azhe-storyboard-test.js`
- `tests/baseball-gameplay-integration-test.js`
- `tests/baseball-match-foundation-2-1-1-1-test.js`
- `tests/baseball-match-foundation-2-1-1-test.js`
- `tests/baseball-match-foundation-2-1-test.js`
- `tests/baseball-match-foundation-2-2-1-test.js`
- `tests/baseball-match-foundation-2-2-2-test.js`
- `tests/baseball-match-foundation-2-2-3-test.js`
- `tests/baseball-match-foundation-2-2-4-1-test.js`
- `tests/baseball-match-foundation-2-2-4-2-test.js`
- `tests/baseball-match-foundation-2-2-4-3-audit.js`
- `tests/baseball-match-foundation-2-2-4-4-test.js`
- `tests/baseball-match-foundation-2-2-4-5-test.js`
- `tests/baseball-match-foundation-2-2-4-test.js`
- `tests/baseball-match-foundation-2-2-test.js`
- `tests/baseball-offensive-production-integration-test.js`
- `tests/baseball-training-rhythm-test.js`
- `tests/batted-ball-physical-production-integration-test.js`
- `tests/bbp-b1-ground-ball-production-integration-test.js`
- `tests/bbp-b2a-line-drive-production-integration-test.js`
- `tests/bbp-b2b1-fly-ball-production-integration-test.js`
- `tests/callbackTest.js`
- `tests/career-age22-outcome-resolver-test.js`
- `tests/career-arc-test.js`
- `tests/career-development-progression-test.js`
- `tests/career-development-runtime-resolver-test.js`
- `tests/career-network-contract-test.js`
- `tests/career-rejoin-contract-test.js`
- `tests/career-transition-commit-test.js`
- `tests/career-transition-progression-test.js`
- `tests/career-transition-resolver-test.js`
- `tests/career-transition-role-test.js`
- `tests/career-transition-route-difference-test.js`
- `tests/career-transition-runtime-resolver-test.js`
- `tests/catcher-choice-outcome-integrity-v1-test.js`
- `tests/content-flow-audit.js`
- `tests/contextual-status-panel-test.js`
- `tests/defensive-outcome-cause-explainability-foundation-v1-test.js`
- `tests/development-match-position-test-fallback-v1-test.js`
- `tests/emotional-payoff-test.js`
- `tests/event-continuity-pass-test.js`
- `tests/first-offensive-moment-role-presentation-test.js`
- `tests/force-multi-runner-settlement-integration-test.js`
- `tests/force-multi-runner-settlement-production-integration-test.js`
- `tests/generic-infield-position-admission-diagnostic-test.js`
- `tests/goal-balance-test.js`
- `tests/ground-ball-home-route-production-integration-test.js`
- `tests/high-school-entry-roster-integration-test.js`
- `tests/high-school-integration-1-1-1-test.js`
- `tests/high-school-integration-1-1-test.js`
- `tests/high-school-integration-1-2-1-test.js`
- `tests/high-school-integration-1-2-2-1-test.js`
- `tests/high-school-integration-1-2-2-2-test.js`
- `tests/high-school-integration-1-2-2-test.js`
- `tests/high-school-integration-1-2-3-test.js`
- `tests/high-school-integration-1-2-test.js`
- `tests/high-school-three-year-spine-test.js`
- `tests/high-school-year-one-competition-loop-test.js`
- `tests/high-school-year-one-opportunity-two-integration-test.js`
- `tests/high-school-year-transition-continuity-test.js`
- `tests/high-school-year-two-competition-loop-test.js`
- `tests/invitation-presentation-school-choice-integration-v1-test.js`
- `tests/invitation-presentation-v1-0-1-legacy-route-conflict-test.js`
- `tests/match-development-settlement-presentation-v1-test.js`
- `tests/match-opportunity-structural-completion-v1-test.js`
- `tests/narrative-continuity-test.js`
- `tests/npc-role-refactor-test.js`
- `tests/offensive-plate-approach-foundation-v1-test.js`
- `tests/offensive-production-presentation-sprint-c-test.js`
- `tests/offensive-tactical-action-sprint-a-test.js`
- `tests/offensive-tactical-action-sprint-b1-0-1-test.js`
- `tests/offensive-tactical-action-sprint-b1-test.js`
- `tests/offensive-tactical-action-sprint-b2-defensive-handoff-test.js`
- `tests/outcome-transition-hierarchy-test.js`
- `tests/plate-decision-production-integration-test.js`
- `tests/player-archetype-test.js`
- `tests/player-capability-hierarchy-foundation-v1-0-1-test.js`
- `tests/player-capability-hierarchy-foundation-v1-test.js`
- `tests/player-data-boundary-test.js`
- `tests/playing-time-game-exposure-foundation-v1-test.js`
- `tests/presentation-interaction-clarity-test.js`
- `tests/relationship-payoff-test.js`
- `tests/responsive-accessibility-pass-test.js`
- `tests/scene-context-layer-test.js`
- `tests/scene-depth-test.js`
- `tests/sprint-c-human-ux-closeout-test.js`
- `tests/status-panel-disclosure-persistence-test.js`
- `tests/takahashi-storyboard-test.js`
- `tests/team-roster-match-integration-test.js`
- `tests/ten-year-narrative-architecture-test.js`
- `tests/third-out-runner-resolution-integrity-v1-test.js`
- `tests/vertical-slice-smoke.js`
- `tests/youth-season-content-pass-test.js`
