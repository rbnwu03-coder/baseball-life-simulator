# Regression Contract Repair — R1.1

Status: **PASS**. Combined R1 status: **PASS WITH WARNINGS**. R1 initial Stop L remains recorded in the R1 report and JSON; this note does not replace its history.

## Original intent and overbroad gate

Sources reviewed: high-school-relationship-recency-reputation-feasibility-sprint-1.md, its validation JSON, the production integration test and observation helper, plus the actual producer/selection dependencies. The original audit promised no changes to selection/probability/source behavior, lineage authority, persistence, 3/2/1, or the Y1/Y2/Y3 2/2/1 schedule. Its broad root-file search was discovery evidence, not an ownership boundary.

The old test listed every root JS file present at 758e963 using git ls-tree and compared all 89 files byte-for-byte after newline normalization. script.js participated solely because it was a root JS file. A later authorized Match identity fix therefore failed the audit even though it did not change relationship/opportunity behavior. The exact old 89-file list is preserved in followupRegressionContractRepair.oldFrozenFiles in the R1 validation JSON.

## Replacement ownership contract

The historical baseline remains 758e963. A test-only helper declares this explicit source manifest. It has no repository-wide discovery, excluded-file branch, allowed-commit check, ad-hoc hash exception, skip or expected failure.

| Protected file | Audited responsibility |
| --- | --- |
| high-school-exchange-network.js | Canonical evidence constructors, normalization, lineage and source authority |
| high-school-friendly-invitation-producer.js | Return visit, coach and school relationship source refs/precedence |
| high-school-training-camp-producer.js | Camp source authority, merged evidence refs and precedence |
| high-school-match-opportunity-generation.js | Evidence-backed candidate generation and eligibility |
| high-school-opportunity-selection.js | Selection v2, lifecycle slots, budgets and materialization |
| high-school-opportunity-probability.js | Probability v1, source weighting and 3/2/1 |
| high-school-schedule-opportunity.js | Opportunity/schedule identity and lifecycle persistence |
| save.js | Audited normalizeSave/loadGame persistence and evidence restoration |

The manifest follows the original completed-match/schedule → evidence ledger → friendly/camp source → generation → selection/materialization → persisted schedule chain. save.js was explicitly audited as the normalizer/restoration authority and remains protected. Probability and selection retain exact source comparisons plus explicit exported v1/v2 and 3/2/1 assertions.

## script.js semantic protection

script.js contains relationship completion/ingest, year transition, generation/materialization, career effects and Match implementation. Its unrelated Match code is no longer permanently frozen. Its audited integration semantics remain checked by the existing 20 behavioral assertions: real admitted completed evidence; 2/2/1 frequency; unchanged transition facts; both save/reload boundaries; original evidence age; declined/expired/cancelled anti-reroll; budgets/materialization; all 20 GameRecords; RNG/strength neutrality; replay parity; real return-visit lineage; friendly and camp canonical refs; development authority; merged camp refs; coach refs; competition completion; source-year distinction; completed schedule semantic position; and player reputation persistence. These assertions are retained unchanged.

The test still has 22 assertions: the global source freeze is replaced by the explicit owned manifest, and the redundant five-file freeze becomes direct v2/v1/3/2/1 checks. No assertion is removed or skipped.

## Scope regression and negative proof

The new standalone scope suite passes unrelated script.js Match changes through a pure source-map fixture, without touching the working tree. Every one of the eight protected sources is separately mutated in memory and must fail the contract. Each missing protected source must also fail. Equivalent CRLF/LF input passes, and the real protected sources are checked against 758e963. Total: 20 assertions.

R1.1 adds no production change. script.js is checked against the exact authorized R1 patch applied to HEAD; strict expectedMomentId admission remains untouched. The four M0 files and original blocker diagnostic remain unchanged. R1 source/tests are retained.

## Validation plan and chronology

Initial R1 full regression: STOP L, 146 PASS / 1 FAIL / 58 not run. Kept as initialFullRegression in JSON.

R1.1 reruns the original failed test first, then the original blocker, R1 repair tests, current-browser 21-game sweep, expanded selected regression, all JS/CJS syntax, and all 206 test files from the beginning with no reused results. The historical 1,400 audit executes inside the fresh full suite and is reported separately from the current-browser sweep.

Final results follow. No commit, push, stash drop, M0 resume or M1 work.


## Final fresh validation

| Gate | Result |
| --- | --- |
| Original failing feasibility test (node --test) | 22/22 assertions PASS, no skips |
| Scope regression and negative contracts | 20/20 PASS |
| R1 dedicated repair test | 15/15 PASS |
| Original blocker diagnostic | reproduced=false; completed=true, seed 22430002 |
| Current-production sweep | 21/21 complete; 30 decisions, 5 ground lifecycles; 0 mismatches/current rejection; stale 14/14 rejected |
| Selected affected domains | 100/100 PASS |
| Full JS/CJS syntax | 316/316 PASS |
| Full regression from start | 206/206 PASS; no result reuse, no skipped files |
| Historical 1,400 audit in fresh full run | 1000 Bench + 400 Starter PASS; orphan/noProgress/state/record issues 0; deterministic/neutral true |
| Additional production change in R1.1 | 0; exact R1 script hash retained |
| M0 preservation | 4/4 original file hashes identical |
| git diff --check | PASS |

The combined R1 result is upgraded to PASS WITH WARNINGS. Remaining scope warnings are the historical audit loader and naturally sampled 2B ground lifecycle coverage, not correctness failures. initialFullRegression, followupRegressionContractRepair and finalFullRegression preserve the chronology in the R1 validation JSON. No new stop condition was triggered. Recommend M0 resumption after manual acceptance; it was not started. All existing stashes remain; no commit or push.
