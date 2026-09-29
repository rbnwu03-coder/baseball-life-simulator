# M1 — Pitch Target / Location Realization Foundation

## Status

**STOP_REGRESSION_FAILURE** — M1 implementation is retained but NOT accepted or complete. Full regression stopped at the first failure: 88 PASS / 1 FAIL / 121 NOT RUN (210 planned).

## Authority and minimal change

Pre-implementation trace: [M1-A authority](pitch-target-location-m1-authority.md). Baseline main / f916faf955b3d07f213d90dfd59ef16ac0638f6c = origin/main, 0/0, initially clean. No historical M0/R1/R2 report is edited.

The gap was a fixed class-to-location map in OffensivePlateApproach.getPitchPhysicalProfile. Tactical pitcherResponse.targetLocation already existed but did not determine physical side/height. M1 admits that accepted target, applies the existing command realization, and writes one canonical physical pitch.location through completePitchTruth. There is no new pitching engine or control rating.

Production scope:

- offensive-plate-approach.js: target admission, categorical location codec/resolver, physical truth integration, actual-region recognition data, compact read-only trace.
- pitcher-catcher-tactical-integration.js: existing feedback gains pitchIntent, targetIntent and derived locationExecution. Tactical recommendation/acceptance algorithms and catcher ability are unchanged.
- script.js: pass batter handedness into the existing detailed PA context.

## Semantic contract

TargetIntent has version, horizontal (inside/middle/away), vertical (high/middle/low), zoneIntent (strike/edge/chase), frame=batterRelative and source. Existing labels middle/inner/outer/low/high/outerLow/innerLow are adapters, not new strategy. Zone intent is coherent with the existing intended pitch class: hitterPitch/competitiveStrike → strike, edgeStrike → edge, chasePitch/clearBall → chase. Conflicting explicit class/zone data uses observable invalidOrConflictingTargetIntent fallback; it is never silently treated as a tactical call.

Target source tacticalTarget uses the accepted existing target. Missing/invalid target or missing control evidence uses legacyLocationFallback with targetAbsent, invalidOrConflictingTargetIntent or controlRealizationUnavailable. Existing targetless fixtures/ordinary synthetic contact keep their legacy location behavior; no sophisticated fallback selector is introduced.

Physical location remains a string category. Existing middle-middle, outer-middle, outer-low, outer-below and well-outside categories remain valid aliases. Additional side/height/band categories use inner|middle|outer + high|middle|low + core|strike|edge|chase|ball. The fixed physical frame uses the RHB reference: inner denotes the plate side inside to a right-handed batter; a left-handed inside target resolves to outer. These are plate sides, not screen coordinates. decodePitchLocation is a deterministic adapter of the one location value, not another state owner. Future UI can project these categories without changing simulation.

TARGET_GEOMETRY_LIMITED: bands have no centimeter distance, exact edge geometry, tunnel path or backdoor trajectory. The contract can express repeated types/targets and changed eye level, but does not implement any new sequencing strategy or claim a full geometric ball-strike model. Existing physical class/strike profiles remain the zone authority, consistently encoded in realized location. Higher command does not guarantee the target.

## Execution and RNG

PitchSequencing.resolvePitchControl remains the only command authority: active roster pitchingProfile.control × 2 (bounded 1–20 in script runtime), existing precisionIntent, rhythm, tempo and class targetDifficulty. No pitch-type command tuning table, fatigue term or catcher rating is added.

The existing control draw first chooses actualPitchClass from actualDistribution. Given selected class interval [lower, lower+mass), its conditional residual (realizationRoll-lower)/mass supplies within-class side/height variation. Existing realizationStability is the adherence threshold; drift moves one adjacent categorical side or height band. This is an extension of the existing command outcome, not a second control rating. Existing stored roll/distribution rounding is retained; this is a categorical structural model, not spatial precision.

Old draw order: existing tactical intent/class/control identity draws, type/velocity identity draws, recognition and swing/contact identity draws. New draw order: unchanged. The location codec, target adapter, observer and feedback consume zero additional gameplay draws. No new RNG namespace is needed. Location/perceived-region/feedback snapshots intentionally change; exact numeric pitch/PA outcome changes are not a success criterion. Actual pitch-class probabilities, velocity/movement models and swing coefficients are unchanged.

Semantic error = categorical side adjacency distance + height adjacency distance + existing pitch-class topology distance. Each neighboring category costs one; exact 0, near 1, miss >=2. This does not manufacture continuous coordinates. Feedback execution classification is derived from intent versus actual; no second location is stored in the execution trace.

## Batter and feedback boundary

Recognition reads realized location via decodePitchLocation and supplies region only when the existing recognition result is accurate. Existing player-facing text and UI rendering are unchanged. Recognition/swing/take never read targetIntent; the existing physical class/strike/velocity/movement/quality continue to govern response. Two identical physical pitches with altered hidden target metadata produce identical recognition and take outcomes; identical targets with different realized regions/classes can produce different perceived inputs.

The event feedback retains target versus actual location and observable batter response. It does not rewrite the pitch. getPitchExecutionTrace is a pure, frozen diagnostic projection of pitch intent, target/source, command, actual class/location, error/classification, recognition and response. No long-lived career/save schema is added: pending pitch/history remain inside the existing match state and existing serialization boundary.

NPC compressed PA remains aggregate: no targetIntent, actualPitchLocation, pitchHistory or sequenceIntent is added to compressed events. The ordinary defensive contact fallback is explicitly separate from a full NPC pitch sequence.

## Validation design

Foundation tests cover target labels/fallbacks, handedness, deterministic execution, variance, target influence, hidden-intent negative proof, strike miss, chase leak, zone coherence and feedback immutability. Production tests enter through normal genesis/youth/school/admission using the committed M0 browser loader, then choose legal take/contactSwing routes without changing gameplay state, contact rolls or probabilities. Seeds 440000 (actual Starter) and 440201 (actual Bench) are each run take/swing with OFF/ON/repeat. Bench 440201 does not enter the game; it remains a legitimate Bench accounting witness, not fake detailed-pitch coverage.

Controlled structural audit: 3 command tiers × 3 semantic targets × 3 intended pitch classes × 2 existing pitch types × 256 deterministic identities = 13,824 detailed physical preparations. Paired inputs isolate command/target; no balance claim. Both pitch types use the same existing general control authority, so no invented type-specific difficulty is inferred from duplicated tier metrics. Row-level exact/near/miss and location distributions are preserved in validation JSON.

Reachable save boundary: presented plateDecision, after target admission and physical realization but before pitch result. Selection/realization is synchronous, so no fabricated separate save point is claimed between them. Save/reload preserves pending target/location, pitch/situation identity, GameRecord and creation RNG state; continuation preserves pitch history and ledger; duplicate prepare does not realize another pitch.

Full regression uses the prior 207-file regression manifest plus the committed M0 audit test and two M1 test files (210 total), retaining historical smoke/audit filenames that do not end in -test.js. The existing legacy Foundation 2.2.4.3 test is part of that suite; the M0 actual-admission formal 1,400 cohort is not rerun. The structural M1 audit is separate. No unrelated test is skipped or allowlisted.

## Controlled results

| Command | Attempts | Exact | Near | Miss | Mean semantic error |
| --- | --- | --- | --- | --- | --- |
| 2 | 4608 | 408 | 2802 | 1398 | 1.255208 |
| 10 | 4608 | 1584 | 2736 | 288 | 0.720052 |
| 18 | 4608 | 3006 | 1584 | 18 | 0.351563 |

Every paired target/class/type cell has high error < medium error < low error; high command retains misses. These are structural controlled samples, not player balance.

Example target influence (slider, edgeStrike, command 10, 256 paired identities per target): inside-low yields inner-middle-edge 79 / inner-low-edge 78 / middle-low-edge 66; away-high yields outer-middle-edge 79 / outer-high-edge 78 / middle-high-edge 66. Their mean error is equal under symmetric semantics while physical distributions differ.

## Stop evidence

> E:\meng\baseball_life_sim_semirefactor\tests\goal-balance-test.js:91
> Error: 未完成流程：Boolean(player.highSchoolResult)，停在 high_school_scout_feedback
> at playUntil (E:\meng\baseball_life_sim_semirefactor\tests\goal-balance-test.js:91:48)
> at simulate (E:\meng\baseball_life_sim_semirefactor\tests\goal-balance-test.js:132:3)
> at Object.<anonymous> (E:\meng\baseball_life_sim_semirefactor\tests\goal-balance-test.js:141:82)

The failing harness has an 18-turn high-school progression bound (simulate, line 132) and throws at playUntil line 91 when highSchoolResult is absent. This identifies the failed contract only, not its root cause. No clean-baseline replay, rerun-to-green, expectation weakening, skip, allowlist or unrelated production repair was performed. Stop Condition I ends this sprint attempt.

Focused/affected-domain results are retained as completed-stage evidence. The last completed integration run was 9/9; one later-added real-production fallback assertion is syntax-checked but not executed, because full regression stopped before the M1 integration test. Do not interpret the report as a final all-green validation of the current tree.

## Required 35-item closeout

| # | Item | Result |
| --- | --- | --- |
| 1 | Baseline | main; HEAD=origin/main=f916faf955b3d07f213d90dfd59ef16ac0638f6c; 0/0; initially clean; both original stashes preserved |
| 2 | Pre-M1 authority chain | See pitch-target-location-m1-authority.md, recorded before production edits: normal detailed PA → tactical recommendation/acceptance → existing control → physical truth → recognition → plate decision → feedback |
| 3 | Authority matrix | M1-A authority matrix covers all ten requested facts; only one existing control and physical location authority identified |
| 4 | Root gap | Accepted tactical target label was not used to realize physical side/height; location was fixed by actual pitch class |
| 5 | M1 contract | Existing target → canonical batter-relative TargetIntent → existing command outcome plus conditional residual → one pitch.location → existing recognition/swing/take → extended feedback; implementation retained pending regression investigation |
| 6 | Production files changed | ["offensive-plate-approach.js: admission/codec/resolver/physical integration/recognition region/diagnostic","pitcher-catcher-tactical-integration.js: existing feedback extensions only","script.js: batter handedness in detailed PA context"] |
| 7 | New target schema | TargetIntent version/horizontal/vertical/zoneIntent/frame/source; inside/away batter-relative; zone must agree with existing intended class; explicit legacy fallback reasons |
| 8 | Actual location authority | One canonical pitch.location string; legacy categories retained, new coarse categories decoded as derived projections; no second random location state |
| 9 | Control authority | PitchSequencing.resolvePitchControl; roster pitchingProfile.control × 2; existing precisionIntent/rhythm/tempo/class difficulty |
| 10 | RNG contract | 0 new draws; reuse conditional residual of existing control-realization draw; original identity namespaces/draw order unchanged; physical location/feedback snapshots intentionally differ |
| 11 | Command monotonicity | [{"command":2,"attempts":4608,"meanError":1.2552083333333333},{"command":10,"attempts":4608,"meanError":0.7200520833333334},{"command":18,"attempts":4608,"meanError":0.3515625}] |
| 12 | Target influence | Paired target distributions differ. Slider/edge/command10: inside-low top inner-middle-edge 79, inner-low-edge 78; away-high top outer-middle-edge 79, outer-high-edge 78 (256 each) |
| 13 | Execution variance | High command 18: 3006 exact / 1584 near / 18 miss over 4608 samples; target is not guaranteed |
| 14 | Handedness | RHB inside-low maps to fixed inner plate side; LHB inside-low maps to opposite outer side; semantic intent unchanged; focused test PASS |
| 15 | Recognition | Hidden target changes with identical physical pitch leave recognition/take identical; same target with different realized location/class yields different perceived input; focused negative proofs PASS |
| 16 | Swing/take | Existing resolveNextPitch/getSwingExecutionProfile remain authoritative; natural take, calledStrike, ball, foul and ballInPlay observed; no batting bonus introduced |
| 17 | Sequence feedback | Existing normalized tactical feedback receives pitchIntent, targetIntent, actualLocation and derived error/classification; feedback does not rewrite pitch |
| 18 | NPC compressed route | No fake target, actualPitchLocation, pitchHistory or sequenceIntent on compressed PA; real-match assertions passed |
| 19 | Production integration | Last completed integration run 9/9; four seed/policy scenarios × OFF/ON/repeat. A subsequently added real-production fallback assertion has not run because the full suite stopped before this test file; do not claim final integration test 10/10 |
| 20 | PA accounting | Four completed scenario witnesses: 59/59/59, 59/59/59, 70/70/70, 70/70/70 (PA/battingPA/BF); not an independent population estimate |
| 21 | GameRecord accounting | 0 detected duplicate/mismatch in completed integration witnesses; full regression incomplete |
| 22 | R1 regression | Focused R1 15/15 PASS, seed 22430002; current choices accepted, stale rejected, completes |
| 23 | R2 regression | Focused R2 21/21 PASS, seed 22430361; PA=battingPA=BF=122; no duplicate/competing settlement; current stale rejects 0 |
| 24 | Save/reload | Targeted save 2/2 PASS at presented realized pitch before settlement; synchronous target selection/realization has no distinct legal intermediate save boundary |
| 25 | Determinism | Deterministic physical replay PASS in 13824 controlled samples and whole-match representative repeats |
| 26 | Observer neutrality | Entire match OFF/ON deep equality PASS for four representative seed/policy scenarios |
| 27 | Statistical audit | 13824 structural samples; 3 command tiers × 3 targets × 3 classes × 2 existing types × 256 identities; all 18 paired cells strictly monotonic; no balance calibration |
| 28 | Affected-domain regression | Last completed affected-domain run 11/11 PASS; no unrelated test edits |
| 29 | Full regression | Planned 210; executed 89; 88 PASS / 1 FAIL / 121 NOT RUN. goal-balance-test.js failed; suite stopped at first failure |
| 30 | Syntax | 328 JS/CJS syntax PASS; final integration-test addition separately syntax-checked |
| 31 | `git diff --check` | PASS; tracked git diff --check and new text whitespace checks |
| 32 | Production scope | Only three production files; no unrelated probability, defense, catcher ability, fatigue, UI or new pitch-type/velocity/movement model changes |
| 33 | Warnings | TARGET_GEOMETRY_LIMITED: coarse categorical bands, no precise edge/tunnel/backdoor geometry. This warning does not excuse the regression failure |
| 34 | Stop conditions | I triggered. Other stop conditions not observed in completed work; unfinished full regression prevents complete clearance. Cause of goal-balance failure is unproven; no baseline reproduction or unrelated repair attempted |
| 35 | Final status | STOP_REGRESSION_FAILURE |

Evidence: [validation JSON](pitch-target-location-m1-validation.json). Raw per-file logs remain in C:\Users\User\AppData\Local\Temp\pitch-target-location-m1. No commit, push, stash drop or M2. Existing M0/R1/R2 evidence remains unchanged. Await further user direction before any regression repair or continuation.
