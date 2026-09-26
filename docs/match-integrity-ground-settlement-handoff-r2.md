# Match Integrity Repair R2

Status: **PASS — R2 repair complete; ready for M0 Resume**

## 1. Baseline

main; HEAD = origin/main = f1cc66b; ahead/behind 0/0. Initial tree contained only the six M0 audit files. Both stashes retained. All six M0 files are byte-preserved (SHA-256 in companion JSON).

## 2. Proven root cause

1. advanceHighSchoolMatchPlaybackStep
2. prepareHighSchoolDefensiveMomentFromSimulation
3. ensureHighSchoolOrdinaryGroundBallInPlayHandoff produces supported physical ground state
4. classifyHighSchoolMatchDefensiveOpportunity applies density suppression; createGroundBallMatchSituation admits automatic routine execution
5. beginAutomaticGroundBallSituationExecution
6. resolveRoutineDefensivePlay reclassifies the candidate as playerMeaningfulDecision despite densitySuppressed=true
7. recordGroundBallSituationResolution sets resolved / unapplied
8. applyRoutineDefensiveResolutionToHighSchoolMatch rejects mismatched execution label and returns null
9. prepareHighSchoolDefensiveMomentFromSimulation returns null
10. same playback invocation falls through to resolveSimulatedHighSchoolPlateAppearance
11. AIPlateAppearanceOutcome.resolveCompressedPlateAppearanceOutcome chooses outcome; applyHighSchoolSimulatedPlateAppearance mutates outs/runners/scores; recordHighSchoolMatchSimulationEvent records PA; advanceHighSchoolMatchBattingOrder changes batter
12. next playback invocation calls resumeResolvedHighSchoolGroundBallSettlement, which correctly rejects stale outs/batter

The compressed route settles the **same PA**, not a legitimate next PA. It first increments outs and advances the batting order. The ground owner remains resolved/unapplied. Physical identities agree; the recovery guard detects the resulting outs/batter mismatch.

## 3. Repair contract

Once ground lifecycle owns a PA, compressed simulation cannot independently advance it. Routine execution retains the already-admitted routine classification, including density-suppressed candidates. A compressed entry with resolved ground ownership delegates to existing canonical recovery before consuming RNG; non-resumable ground ownership blocks entry. No second truth model or schema is introduced. The entire stale guard function is unchanged and verified against baseline.

## 4. Production files

Only script.js changed: two functions, classification and settlement ownership admission. No probabilities, physical resolution, density policy, route availability, role admission or save schema changed.

## 5. Tests

- tests/ground-settlement-handoff-r2-context.cjs: passive trace and actual production-boundary capture; historical mode replays the two old functions from f1cc66b for evidence.
- tests/ground-settlement-handoff-r2-production-integration-test.js: 21/21 assertions. Includes actual seed completion, repeated lifecycle seed 22430119, one PA/record/order application, duplicate delivery invariance, stale negative witnesses and byte-identical recovery guard.

The six M0 files remain historical evidence. Their old blocker diagnostic intentionally expects the old exception; it is not a passing-game regression test on the repaired tree. R2 historical replay documents that defect without rewriting the original diagnostic.

## 6–8. Blocker results

Before repair, 22430361 reproduced Stale resolved ground-ball settlement context at 16 top (observer OFF/ON/OFF identical). After repair it completes in 235 steps: home 1, away 3; PA/BF 122. Previous seed 22430002 still completes at home 0, away 3; PA/BF 64; legal choices accepted and stale choices rejected. R1 focused 15/15 and 21-seed production sweep pass.

The first baseline/repaired event divergence is sequence 203 in inning 13: another occurrence of the same density-suppressed routine classification bug, on the supported bunt route. The repair consumes the existing physical routine result rather than discarding it and sampling compressed PA. Thus the repaired full game ends earlier, in inning 14. To avoid mistaking earlier completion for proof of the original ground repair, the test separately captures the genuine baseline inning-16 pre-execution boundary and verifies canonical settlement there exactly once.

## 9. Accounting

Repaired seed: PA events = batting PA = pitcher BF = 122. Previous seed: 64/64/64. Observed duplicate settlements: 0. Valid current-settlement stale rejections: 0. Two intentional stale witnesses reject without mutation. Targeted ground application adds one PA event, one GameRecord PA reference, one batting PA, one BF and one batting-order advance; one settlement-facts call and one closure. Repeated delivery leaves the entire match, including hits/errors/runners/outs/scores and record, unchanged. This does not claim complete BBP correctness.

## 10. Neighborhood

22430340..22430380: 41 attempted, 41 completed, 0 exceptions, 0 progression/accounting failures. Current-browser loader; no skipped/replaced seeds or gameplay/probability overrides. Not the formal M0 1400 cohort.

## 11. Determinism

Fresh full-match run with observation OFF equals the observed/traced run for 22430361. Canonical recovery from captured pending state needs no competing compressed RNG.

## 12–14. Validation

- Initial affected integration: 5/5 files PASS.
- Affected-domain regression: 67/67 files PASS; focused test strengthened from 16 to 21 assertions afterward and rerun successfully, with final full regression including the strengthened version.
- Syntax: 320/320 JS/CJS files PASS.
- Full regression: 207/207 PASS, 0 FAIL. Fresh execution of all 206 prior manifest tests plus R2; no prior results reused. Historical fixed-loader audit is distinct from the prohibited formal current-browser M0 cohort.

## 15. Repository hygiene

git diff --check PASS. One production file changed; two R2 tests and two R2 reports added. Original six M0 files retained. No commit, push or stash drop. Exact git status and stash IDs in JSON.

## 16. Remaining known issue

Requested Bench M0 cohort currently resolves to actual starter admissions; Bench coverage remains unproven and is deferred to M0 Resume work.

## 17. Final status

**PASS — R2 repair complete; ready for M0 Resume**

M0 Resume and M1 have not started. Await manual acceptance.
