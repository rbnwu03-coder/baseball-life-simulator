# Third-Out / Run / Out Attribution Integrity — Sprint 1

Canonical Third-Out Scoring & Pitcher Out Attribution。驗證原始結果與矩陣存於 `third-out-run-out-attribution-validation.json`。歷史 audit、上一 Sprint 報告與歷史 third-out 測試均保持原樣。

## Closeout

1. **Baseline**：main，HEAD / origin/main `6c39a19`，ahead / behind 0 / 0，施工前 working tree clean。
2. **Changed files**：`script.js`、`match-game-record.js`；`force-advancement.js` 只增加 retirement 當下 force 與 BR 身分證據；`defensive-runner-throw-settlement-foundation.js` 只暴露既有 first-leg / tag-up retirement facts。新增兩套測試與兩份文件。既有測試未改 assertion、未刪除、未 skip。
3. **Existing third-out authority**：延伸既有 `resolveHighSchoolThirdOutIntegrity`、`finalizeHighSchoolDefensiveThirdOut`，不另建 run / third-out engine。
4. **Ordered retirement consumption**：`classifyHighSchoolOrderedThirdOut` 選取 `3 - outsBefore` 對應的 retirement，檢查序號與類型；不一律取最後一筆。暴露實際成立至第三出局的 retirement prefix。Force producer、通用 first-leg、tag-up、捕手抓跑者與 PA / caught-ball producers 提供對應 facts。
5. **Third-out vocabulary**：保留既有 `force`、`batterRunnerBeforeFirst`、`nonForceTag`，增加有正式 producer 的 `caughtBallOut`、`strikeout`。保留 `none` 表示尚未第三出局。沒有 appeal、interference 或 infield-fly 類型。舊純函式顯式 thirdOutType 介面仍可使用，歷史相容性不改寫為虛構 ordered ledger。
6. **Force third out**：必須在 `forceStateAtRetirement.forceTargets[runnerId]` 有對應 target，否則拒絕。不能以 second / third 目標壘或起始壘推測 force。
7. **BR-before-first**：retirement 要有 isBatterRunner / beforeFirst 證據。滿壘 1 out DP 的第三出局分類為 batterRunnerBeforeFirst，先到本壘的候選也不計分。
8. **Timing play**：接受既有明確 beforeThirdOut / afterThirdOut 關係；若提供共同 ordering 的 `attempt.order` 與 `retirement.order`，才比較先後。unit fixtures 明確注入 ordinal 10 / 20 / 30 作為 contract 驗證，未宣稱 production 已產生通用多人 crossing timeline。
9. **Unresolved timing behavior**：沒有順序的 non-force scoring candidate 保留 `TIMING_PLAY_UNRESOLVED`、unresolvedScoringRunnerIds、settlementReady=false；不列入 legal，也不冒稱 invalid。`applyHighSchoolDefensiveSettlementFacts` 在任何 outs / bases / runs mutation 前拒絕提交。這是允許的 deferred timing boundary，不補造時間。
10. **Provisional scoring**：defensive finalizer 不再一律將 scoringRunnerIds 標成 beforeThirdOut。無明確順序時只傳 timingUnresolved；沒有第三出局時候選仍可合法提交。
11. **Legal scoring commit**：既有 authority 先產出 legalScoringRunnerIds，再由既有 scoreHighSchoolMatchRunner / GameRecord 流程記分；沒有 score-then-rollback。
12. **Invalid scoring prevention**：production 1-out loaded DP 直接驗證沒有 run event、GameRecord away runs 不增加；0-out DP 反向驗證恰有一次 run 與 R3 個人得分。
13. **Pitcher out attribution**：`MatchGameRecord.attributePitcherOuts` 統一 ingestion。PA 擁有本 PA before / after 的整體 out delta；獨立事件僅擁有其後發生的 out delta。差值被限制在半局 0–3，planned DP 不可加出第四個 out。
14. **Runner-only out**：正式 runnerTagUpResolution、catcher defensiveResolution 與明確 runnerOut / caughtStealing / stealCaught ingestion 可記獨立 out。正式 tag-up producer 的 catch PA 與後續 runner out 分別驗證，沒有重寫 tag-up execution。
15. **DP attribution**：PA 一次記 +2；infield defensiveResolution、其他呈現摘要不再加一次。FC 若目前仍映 single，out delta 照樣歸投手；未修改 FC official scoring。
16. **BF protection**：只有 PA ingestion 增 BF。新投手可在尚未完成對一位打者的 PA 前抓掉承接跑者，合法出現 BF=0 / outsRecorded=1；因此舊 `BF * 3 >= outsRecorded` 不是普遍正確的不變式。本輪改查 event attribution evidence 與 pitcher line 的一致性下界，沒有使用 BF 猜 out。
17. **Batter line protection**：runner-only event 不進 recordPlateAppearance，不改 batter PA / AB / H / SO / BB。production 測試比較整份打者 batting line。
18. **Active pitcher identity**：讀當下 defense-side roster.lineup 中的 P；移除 pitchingStaff.starter fallback。沒有 generic pitcher、player object 或 last-known fallback。unit substitution-boundary fixture 更換 active lineup pitcher 後，out 只歸新投手，BF 維持 0；不擴充換投 gameplay。
19. **Inning finalization**：先以保留的 runner candidates / retirement facts 裁分，再套用 legal runs / out delta；第三出局後沿用既有 pendingHalfInningTermination 與 swap boundary。production 驗證 truth 深存、清壘、歸零出局、換邊一次。官方 LOB ledger 仍未新增。
20. **GameRecord**：沿用同一 schema version 與 player line authority。eventRefs 增加可選 pitcherOuts `{pitcherId, outs}` 作為既有事件的歸屬證據，normalizeSave 保留；沒有第二份 mutable pitcher tracker。舊 save 缺此欄位仍可讀取，不追補或猜算歷史漏記。
21. **CompetitionEvidence**：正式 tag-up 修正後的 GameRecord 經 finalize 與 integrateMatchEvidence，pitching evidence outsRecorded=2、BF=1、sample.count=1。未修改 evidence、reliability、sample weighting 或 selection。
22. **Save/load**：DP third-out 與 tag-up third-out 經正式 normalizeSave；不重開半局、不重複 out / run / pitcher out。eventRefs 的 attribution facts 也被保存。未 bump save version。
23. **Idempotency**：沿用 GameRecord event identity dedup、infield settlement identity、tag-up lifecycle。補捕手 resolution identity guard，防止同一次 catcher apply 重複記錄。新測試重放完整 apply、GameRecord PA event 與 settled tag-up。
24. **0-out loaded DP**：PASS；2 outs、R2 在三壘、R3 得 1 分、投手 +2 outs / +1 BF。
25. **1-out loaded DP**：PASS；out #2 R1 force，out #3 BR-before-first，0 run、投手 +2 outs / +1 BF。
26. **2-out force play**：PASS；第一筆退休就是第三出局；R3 即使先過本壘也不計分。另測 planned DP 在已有 2 outs 時只保留第一筆成立的 retirement。
27. **Tag-up regression**：既有 legality / execution 測試全過。新增正式 runner-only out、third-out tag、caught-ball third-out fixture；catch 第三出局不再開 tag-up。
28. **Selected tests**：47 / 47 套通過。含新 foundation 25 / 25、production 14 / 14，以及 force / multi-runner、third-out、runner advancement、defensive throw、ground-ball、tag-up、catcher、GameRecord、full-game、AI PA、BIP mapping、CompetitionEvidence 與高中 competition loops。
29. **Full regression**：172 / 172 FULL GREEN（含最後 1,400-game audit）。
30. **Syntax**：260 / 260 JS/CJS PASS。
31. **1,400-game audit**：bench 1,000 + starter 400，共 1,400 completed；orphan 0、noProgress 0、match-state integrity issue 0、GameRecord issue 0；audit runtime 232.799 秒。
32. **Determinism**：新增 classifier / attribution 不消耗 RNG，順序與出局差值完全由事件 facts 決定；全場結果 PASS。
33. **Instrumentation neutrality**：新 eventRefs 僅保存既有歸屬 facts；全場結果 PASS。
34. **Rule reclassification**：見下表；沒有回寫歷史 audit。
35. **Remaining blockers**：通用多人 crossing timeline producer 未完成，缺資料時保持 unresolved；完整 timing play、appeal / fourth out、infield fly、FC scorer、官方 LOB 與 scoreboard H / ellipsis 均未擴入。本輪不修舊 save 中已漏記的投手 outs。
36. **Next Sprint recommendation**：Scoreboard Presentation Integrity 可獨立處理 H delay / current-half ellipsis；完整多人 timing producer 應另列明確契約。僅建議，未開始。
37. **git diff --check**：PASS，tracked / untracked 均已檢查。
38. **git status**：修改保留 working tree，未 commit、未 push；main，4 modified + 4 untracked，ahead / behind 0 / 0。
39. **Stop Conditions**：未觸發；本 Sprint 指定範圍 PASS，通用多人 timing producer 維持 PARTIAL。無需 force 重設計、parallel GameRecord、假造 timing、Appeal、IFF 或 AI / BIP / selection 修改。

## Rule reclassification

| Rule | 本輪判定 | 邊界 |
| --- | --- | --- |
| RUN-SCORE-001 | IMPLEMENTED（legal-first / unresolved boundary） | 候選先裁定再 commit；通用多人 timing producer 未完成 |
| RUN-SCORE-002 | IMPLEMENTED | ordered force-at-retirement evidence |
| RUN-SCORE-003 | IMPLEMENTED | BR-before-first 獨立分類與 production loaded DP |
| RUN-SCORE-004 | PARTIAL | 有明確順序才判；無順序不造假，停止提交 |
| INNING-001 | PARTIAL | 本輪 scoring / clear / swap 順序驗證通過；官方 LOB ledger 仍 deferred |
| RECORD-001 | IMPLEMENTED | canonical ingestion、事件去重與 attribution facts |
| RECORD-002 | PARTIAL（本輪 pitcher gap 已修） | PA / runner-only outs 正確歸屬；FC 等其他歷史規則缺口不在本輪 |
| Independent runner-out pitcher attribution gap | IMPLEMENTED | 真實 tag-up apply + GameRecord + CompetitionEvidence |

## Validation matrix

下表使用同一 third-out resolver 與 GameRecord ingestion 產生，完整 retirement / candidate 證據見 JSON。已另外以上述 real production tests 驗證 DP、catch / tag-up、save/reload 與 evidence。unresolved 列的 delta=0 表示尚未 commit，**不表示判定 run invalid**。

| Scenario | Initial outs | Bases | Ordered retirements | Third-out type | Candidates | Legal IDs | Score delta | Pitcher outs delta | BF delta | Final outs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0-out loaded DP | 0 | ["R1","R2","R3"] | 1:R1@second force; 2:BR@first batterRunnerBeforeFirst | none | [{"runnerId":"R3"}] | ["R3"] | 1 | 2 | 1 | 2 |
| 1-out loaded DP | 1 | ["R1","R2","R3"] | 1:R1@second force; 2:BR@first batterRunnerBeforeFirst | batterRunnerBeforeFirst | [{"runnerId":"R3"}] | [] | 0 | 2 | 1 | 3 |
| 2-out force play | 2 | ["R1",null,"R3"] | 1:R1@second force | force | [{"runnerId":"R3","timing":"beforeThirdOut"}] | [] | 0 | 1 | 1 | 3 |
| BR-before-first third out | 2 | [null,null,"R3"] | 1:BR@first batterRunnerBeforeFirst | batterRunnerBeforeFirst | [{"runnerId":"R3","timing":"beforeThirdOut"}] | [] | 0 | 1 | 1 | 3 |
| Timing tag home first | 2 | [null,"R2","R3"] | 1:R2@third nonForceTag | nonForceTag | [{"runnerId":"R3","order":10}] | ["R3"] | 1 | 1 | 0 | 3 |
| Timing tag tag first | 2 | [null,"R2","R3"] | 1:R2@third nonForceTag | nonForceTag | [{"runnerId":"R3","order":30}] | [] | 0 | 1 | 0 | 3 |
| Timing tag unresolved | 2 | [null,"R2","R3"] | 1:R2@third nonForceTag | nonForceTag | [{"runnerId":"R3"}] | [] | 0 | 0 | 0 | 2 |
| Runner-only out | 1 | [null,"R2",null] | 1:R2@third nonForceTag | none | [] | [] | 0 | 1 | 0 | 2 |
| Strikeout | 0 | [] | 1:BR@first strikeout | none | [] | [] | 0 | 1 | 1 | 1 |
| Caught fly third out | 2 | [null,null,"R3"] | 1:BR@caught caughtBallOut | caughtBallOut | [{"runnerId":"R3","order":10}] | [] | 0 | 1 | 1 | 3 |


## Source references

- [script.js:6660](E:/meng/baseball_life_sim_semirefactor/script.js:6660) — classifyHighSchoolOrderedThirdOut
- [script.js:6671](E:/meng/baseball_life_sim_semirefactor/script.js:6671) — resolveHighSchoolThirdOutIntegrity
- [script.js:10590](E:/meng/baseball_life_sim_semirefactor/script.js:10590) — finalizeHighSchoolDefensiveThirdOut
- [script.js:10862](E:/meng/baseball_life_sim_semirefactor/script.js:10862) — applyHighSchoolDefensiveSettlementFacts
- [match-game-record.js:262](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:262) — attributePitcherOuts
- [match-game-record.js:153](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:153) — getActivePitcher
- [force-advancement.js:139](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:139) — forceStateAtRetirement
- [defensive-runner-throw-settlement-foundation.js:57](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:57) — completeSettlement
