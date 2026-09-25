# Match Integrity Repair — Sprint R1

Final status after R1.1: **PASS WITH WARNINGS**. Fresh full regression: **206/206 PASS**. The initial R1 Stop L and its failed run are preserved below as historical evidence.

## Baseline and scope

main / origin/main: 156218b, ahead/behind 0/0. Initial working tree contained exactly the four untracked M0 files. All four remain unchanged, including the historical stop report and original diagnostic. Both existing stashes are preserved. R1 does not resume M0 or start M1.

## Confirmed defect

Before editing, the unchanged diagnostic reproduced seed 22430002 at the fourth inning top, one out, two runners on base. Current identity was hs_y1_match_defense_2; secure, challenge and lead all carried hs_y1_match_moment_2 and were rejected.

prepareHighSchoolDefensiveMomentFromSimulation assigns currentMomentId and currentDomain before generating choices. generateInfieldLegalChoices calls getHighSchoolYearOneMomentId while presentation phase is not yet moment_2_ready. The old helper then returns a static ID. createGroundBallMatchSituation freezes those routes before the phase changes. After presentation, the same helper returns the dynamic ID and the strict click guard rejects the frozen stale identities.

## Repair

Only script.js, getHighSchoolYearOneMomentId, changes in production. A defensive domain with an existing valid dynamic defensive currentMomentId now exposes that identity independently of presentation readiness. The existing producer remains the sole ID creator. No new ID formula, persistent field, phase mutation, UI rewrite, or post-click regeneration is introduced.

chooseHighSchoolYearOneMatchMoment and expectedMomentId validation are unchanged. The existing completed-match and offense/static branches are unchanged. No tactical action, legal route semantics, labels, probabilities, BBP, runner, force, third-out, GameRecord, save or scoreboard code changes.

## Tests and evidence

The dedicated repair suite exercises current identity, repeated decisions, secure/challenge/lead in separate full-game branches, stale previous choices, duplicate-click rejection, original-versus-repaired route objects excluding identity, non-defensive identities, and presented-state save/reload.

For route comparison, a disposable test VM restores only the original baseline identity helper from git show 156218b:script.js. It reproduces the stale routes; all remaining route fields and choice counts compare exactly with the repaired route objects. This never changes working-tree production code or bypasses the real click guard.

The save test uses a player snapshot obtained at a real presented decision, then the production saveGame/loadGame path. It checks the same current ID and exact choices, one accepted resolution, no duplicate ledger change, and a subsequent save/reload preserving GameRecord.

Current-browser production sweep uses all index.html scripts except the application UI controller, matching the repository integration convention. It separates this current-production sample from the historical 1,400 audit. Seeds 22430000–22430019 plus 22430119 are retained in the dedicated suite. Seed 22430119 was found by a bounded natural seed search and supplies two groundBallDefensiveDecision lifecycles in one game (defense_1 then defense_2). Other seeds exercise defense_3. No unsupported position was manufactured.

The original M0 diagnostic now reports reproduced=false, completed=true without any modification. Mandatory seed 22430002 completes at home 0 / away 3, 64 PA = 64 batting PA = 64 pitcher BF, 42 pitcher outs, final GameRecord, winning away team regional-power-school. Observer OFF/ON entire match objects compare equal; repeated runs and decision identities compare equal.

## Initial R1 validation and closeout (historical)

Selected regression: **67/67 PASS**. Full JS/CJS syntax: **314/314 PASS**. Historical 1,400 integrity audit: **PASS**, Bench 1000 + Starter 400, all four issue counters zero, deterministic and instrumentationNeutral true. Current-production sweep: **21/21 complete**, 30 defensive decisions (5 formal ground lifecycles), zero displayed ID mismatches or current-choice rejection, 14/14 stale-choice attempts rejected.

Full regression stopped with **146 PASS / 1 FAIL**, 147 of 205 files executed, 58 not run. The full run reuses 67 selected results from this same repair version; no historical results were reused. Failure: tests/high-school-relationship-recency-reputation-feasibility-production-integration-test.js:53, assertion that every prior production JS must equal commit 758e963. It rejects the authorized script.js change. This is a historical source-freeze expectation conflict, not evidence of a failed defensive outcome assertion. It still triggers the user's unconditional **Stop L**. The old test was not edited, skipped or allowlisted.

Resolve that test's historical scope in an explicitly authorized follow-up before rerunning the full gate. R1 cannot recommend immediate M0 resumption while this gate is red. No M0/M1 work, commit, push or stash removal occurred.


## Initial R1 requested closeout (historical)

| # | Item | Result |
| --- | --- | --- |
| 1 | Baseline | 156218b main/origin; 0/0; expected four untracked M0 files only. |
| 2 | M0 files preserved | 4/4 byte hashes preserved; diagnostic unchanged. |
| 3 | Changed files | script.js + 3 new test/helper files + 2 new R1 documents; original four M0 files retained. |
| 4 | Root cause confirmation | Reproduced before editing and re-read actual producer/choice/lifecycle/guard chain. |
| 5 | Original stale ID | hs_y1_match_moment_2 |
| 6 | Original canonical ID | hs_y1_match_defense_2 |
| 7 | Producer timing defect | Route freeze precedes ready phase; prior helper changed identity with phase. |
| 8 | Repair strategy | Remove presentation-phase dependency only from existing defensive identity projection. |
| 9 | Canonical identity owner | Existing producer currentMomentId; no second formula. |
| 10 | Lifecycle handoff | Routes receive existing canonical ID before freeze; phase ordering unchanged. |
| 11 | Admission guard | Strict expectedMomentId check unchanged. |
| 12 | First defensive moment | Validated initial/static and natural ground defense_1. |
| 13 | Second defensive moment | Known seed defense_2 accepted. |
| 14 | Repeated defensive moments | 22430119 has two ground lifecycles; sweep also reaches defense_3. |
| 15 | Secure route | Accepted, full branch completed. |
| 16 | Challenge route | Accepted, full branch completed. |
| 17 | Lead route | Accepted, full branch completed. |
| 18 | Stale choice rejection | All previous-moment attempts rejected without settlement mutation. |
| 19 | Current choice acceptance | All tested current choices accepted. |
| 20 | Seed completion | true; original diagnostic completes in 131 steps. |
| 21 | Full-match PA | 64 events = 64 batting PA. |
| 22 | Pitcher BF | 64 BF; 42 pitcher outs. |
| 23 | Match-state integrity | 0 issues. |
| 24 | GameRecord integrity | 0 issues; final; away wins 3:0. |
| 25 | NoProgress | 0 throughout sweep and historical audit. |
| 26 | Determinism | Entire match and decision observations deep-equal. |
| 27 | Observer neutrality | Entire match OFF/ON deep-equal. |
| 28 | RNG neutrality | No RNG call added; simulationCursor unchanged ON/OFF. |
| 29 | Save/reload | Presented save/load exact ID/routes; settle once; post-settlement reload stable. |
| 30 | Force neutrality | No changes; affected tests PASS. |
| 31 | Runner settlement neutrality | No changes; affected tests PASS. |
| 32 | Third-out neutrality | No changes; affected tests PASS. |
| 33 | Tag-up neutrality | Affected tests PASS. |
| 34 | Plate-decision neutrality | Affected tests PASS. |
| 35 | Other lifecycle neutrality | No new type or lifecycle transition changes. |
| 36 | Candidate route count | Pre/post exact count comparison PASS. |
| 37 | Route semantics | All fields except identity deep-equal at original blocker. |
| 38 | Choice labels | Unchanged; included in exact comparison. |
| 39 | Save schema | Unchanged. |
| 40 | GameRecord schema | Unchanged. |
| 41 | Current-production sweep | 21/21 complete; 30 defensive decisions, 5 ground lifecycles. |
| 42 | Identity mismatches | 0. |
| 43 | Current-choice rejection | 0. |
| 44 | Stale-choice rejection count | 14/14 rejected (100%). |
| 45 | Targeted tests | Repair suite 15/15; production integration PASS. |
| 46 | Selected regression | 67/67 PASS. |
| 47 | Syntax | 314/314 PASS. |
| 48 | Full regression | 146 PASS / 1 FAIL; 147/205 executed; 58 not run after Stop L. |
| 49 | 1,400 audit | 1000 Bench + 400 Starter PASS; all issue counters 0; deterministic/neutral true. |
| 50 | Production diff | script.js only, +3/-1. |
| 51 | git diff --check | PASS. |
| 52 | Warnings | Historical 1,400 loader is a regression gate, not full current-production coverage. Natural repeated ground lifecycle sample uses admitted 2B; no unsupported positions forced. 67 selected results are reused in the full gate from this same unchanged repair run, not from historical artifacts. |
| 53 | Failures | Historical feasibility source-freeze assertion rejects script.js change against 758e963. |
| 54 | Final status | STOP_L_FULL_REGRESSION_FAILURE |
| 55 | M0 resume readiness | Not yet; full-green gate unmet. M0 not resumed. |
| 56 | Stop Conditions | L; no further production or test repair after full regression failure. |


## R1.1 follow-up and final acceptance

The first run remains **146 PASS / 1 FAIL / 58 not run** in initialFullRegression. R1.1 repairs the historical feasibility scope, replacing the 89-root-JS freeze with an explicit eight-file opportunity/relationship/persistence manifest. The original 20 behavioral assertions remain unchanged, and v2/v1/3/2/1 have direct assertions. Eight mismatch and eight missing-source negative tests prove that protected sources still fail the gate. See [R1.1 rationale and manifest](regression-contract-repair-r1-1.md).

Fresh validation: original feasibility **22/22**, scope **20/20**, R1 repair **15/15**, selected **100/100**, syntax **316/316**, full regression **206/206**. Full regression was restarted from the first file; no R1 or selected results were reused. Its 1,400-game audit is green with all integrity counters zero. Current production sweep is again **21/21**, mismatches/rejected current choices **0**, stale rejection **14/14**. R1.1 adds **zero production changes** and leaves strict admission intact.

R1 + R1.1 are **PASS WITH WARNINGS**, ready for manual acceptance. Recommend resuming M0 only after acceptance; no M0 or M1 work was performed. No commit, push or stash drop.

## Final combined R1 + R1.1 closeout

| # | Item | Result |
| --- | --- | --- |
| 1 | Baseline | 156218b main/origin; 0/0; expected four untracked M0 files only. |
| 2 | M0 files preserved | 4/4 byte hashes preserved; diagnostic unchanged. |
| 3 | Changed files | R1 files retained; R1.1 changes feasibility integration test and adds scope helper, scope test and note. |
| 4 | Root cause confirmation | Reproduced before editing and re-read actual producer/choice/lifecycle/guard chain. |
| 5 | Original stale ID | hs_y1_match_moment_2 |
| 6 | Original canonical ID | hs_y1_match_defense_2 |
| 7 | Producer timing defect | Route freeze precedes ready phase; prior helper changed identity with phase. |
| 8 | Repair strategy | Remove presentation-phase dependency only from existing defensive identity projection. |
| 9 | Canonical identity owner | Existing producer currentMomentId; no second formula. |
| 10 | Lifecycle handoff | Routes receive existing canonical ID before freeze; phase ordering unchanged. |
| 11 | Admission guard | Strict expectedMomentId check unchanged. |
| 12 | First defensive moment | Validated initial/static and natural ground defense_1. |
| 13 | Second defensive moment | Known seed defense_2 accepted. |
| 14 | Repeated defensive moments | 22430119 has two ground lifecycles; sweep also reaches defense_3. |
| 15 | Secure route | Accepted, full branch completed. |
| 16 | Challenge route | Accepted, full branch completed. |
| 17 | Lead route | Accepted, full branch completed. |
| 18 | Stale choice rejection | All previous-moment attempts rejected without settlement mutation. |
| 19 | Current choice acceptance | All tested current choices accepted. |
| 20 | Seed completion | true; original diagnostic completes in 131 steps. |
| 21 | Full-match PA | 64 events = 64 batting PA. |
| 22 | Pitcher BF | 64 BF; 42 pitcher outs. |
| 23 | Match-state integrity | 0 issues. |
| 24 | GameRecord integrity | 0 issues; final; away wins 3:0. |
| 25 | NoProgress | 0 throughout sweep and historical audit. |
| 26 | Determinism | Entire match and decision observations deep-equal. |
| 27 | Observer neutrality | Entire match OFF/ON deep-equal. |
| 28 | RNG neutrality | No RNG call added; simulationCursor unchanged ON/OFF. |
| 29 | Save/reload | Presented save/load exact ID/routes; settle once; post-settlement reload stable. |
| 30 | Force neutrality | No changes; affected tests PASS. |
| 31 | Runner settlement neutrality | No changes; affected tests PASS. |
| 32 | Third-out neutrality | No changes; affected tests PASS. |
| 33 | Tag-up neutrality | Affected tests PASS. |
| 34 | Plate-decision neutrality | Affected tests PASS. |
| 35 | Other lifecycle neutrality | No new type or lifecycle transition changes. |
| 36 | Candidate route count | Pre/post exact count comparison PASS. |
| 37 | Route semantics | All fields except identity deep-equal at original blocker. |
| 38 | Choice labels | Unchanged; included in exact comparison. |
| 39 | Save schema | Unchanged. |
| 40 | GameRecord schema | Unchanged. |
| 41 | Current-production sweep | 21/21 complete; 30 defensive decisions, 5 ground lifecycles. |
| 42 | Identity mismatches | 0. |
| 43 | Current-choice rejection | 0. |
| 44 | Stale-choice rejection count | 14/14 rejected (100%). |
| 45 | Targeted tests | Repair suite 15/15; production integration PASS. |
| 46 | Selected regression | 100/100 PASS, freshly rerun. |
| 47 | Syntax | 316/316 PASS, freshly rerun. |
| 48 | Full regression | 206/206 PASS; all executed from start; zero reused results and skipped files. |
| 49 | 1,400 audit | 1000 Bench + 400 Starter PASS; all issue counters 0; deterministic/neutral true. |
| 50 | Production diff | script.js only, +3/-1. |
| 51 | git diff --check | PASS. |
| 52 | Warnings | Historical 1,400 loader is a regression gate, not full current-production coverage. Natural repeated ground lifecycle sample uses admitted 2B; no unsupported positions forced. Final full regression re-executed all files without result reuse. |
| 53 | Failures | None in final run; historical failure retained above. |
| 54 | Final status | PASS WITH WARNINGS |
| 55 | M0 resume readiness | Ready to recommend M0 after manual acceptance; M0 not resumed. |
| 56 | Stop Conditions | Initial Stop L resolved by explicitly authorized R1.1; no R1.1 stop triggered. |
