# Baseline Regression Repair continuation — Stop Condition F

## Outcome

The authorized ninth failure was repaired and the original nine failing regression entries all pass. The subsequent clean-baseline full regression stopped at a newly exposed tenth failure, `tests/decision-flow-test.js`, as required by Stop Condition F. Baseline full green and Sprint 1 applied full green are therefore not claimed.

## Baseline and Sprint 1 preservation

- Branch / HEAD: `main` / `efc9e60 feat: establish runner throw timing and play settlement`.
- Sprint 1 and the previous stop report are preserved in stash `0daf1e954f74ddb45efe620107970567dec6fffd` (`stash@{0}`).
- The earlier independent Sprint 1 stash remains at `8cc34a930df052067d1bad3ea798fe0b9d2ae036` (`stash@{1}`).
- Current working tree contains only baseline test/harness repairs and this report. No production file is modified.

## Original nine failures

All passed together after repair:

1. player-data-boundary-test.js
2. high-school-integration-1-2-test.js
3. high-school-integration-1-2-2-2-test.js
4. high-school-integration-1-1-test.js
5. goal-balance-test.js
6. baseball-match-foundation-2-2-test.js
7. content-flow-audit.js
8. baseball-match-foundation-2-2-2-test.js
9. tests/scene-context-layer-test.js, retained as the canonical copy after removing the identical misplaced root duplicate

## Classification and repair

| Failure group | Classification | Repair |
| --- | --- | --- |
| Player data boundary | Cross-platform test harness bug | Added a source reader that normalizes CRLF and lone CR to LF before source parsing. All original 99 validations remain; none were removed or skipped. |
| Defensive substitution / incumbent admission | Outdated fixtures/harness | Loaded TeamRosterFoundation and TeamStrengthModel together in the five affected harnesses. Adjusted explicit substitution fixtures to use the batting slot belonging to the canonical incumbent. |
| High-school moment expectations | Stale expectation / fixture | Allowed the next visible canonical decision to be the final offensive moment when no real defensive decision occurs. Set the mixed double-play fixture to one out so its expected partial result is not correctly superseded by the third-out contract. |
| content-flow-audit | Outdated runtime harness | Loaded roster, strength and offensive approach dependencies, then established the minimum legal genesis/capability/high-school player context before evaluating dynamic choices. |
| 3B decision assertion | Stale semantic fixture | Explicitly modeled the runner on third as committed toward home. Merely occupying third remains insufficient for a home route. |
| Root scene-context test | Duplicate/misplaced artifact | Removed the root copy after byte/content comparison showed it duplicated `tests/scene-context-layer-test.js`; the canonical test remains and passes. |

## 3B semantic conclusion

The current defensive decision contract requires either a force at home or a runner explicitly committed/advancing toward home. Inning, score, outs and occupancy affect priority but do not invent runner movement. The corrected fixture now provides `runnerMovementProgress[2] = "committed"` and `runnerTargets[2] = "home"`, so it validly expects both prevent-run and secure-out objectives. Production behavior was not changed.

## Newly exposed failure

The full baseline run contained 152 executable files after removal of the duplicate root artifact (153 JavaScript files under `tests/`, excluding the context helper). It reached item 93 with 92 passes, then failed:

`tests/decision-flow-test.js` — `Golden baseline 缺少原本 chapter2Step direct write`

Root cause is another cross-platform newline-sensitive source harness. The test reads CRLF production source and tries to remove multiline LF template blocks with exact string replacement. The removal does not occur, so the synthesized golden source never receives the expected direct-write replacement.

Read-only/in-memory diagnosis normalized source text using `.replace(/\r\n?/g, "\n")`; the unchanged test then passed all 86 validations. No persistent repair was applied because this failure was outside the newly authorized nine and triggers Stop Condition F.

## Validation state

- Authorized ninth test: 99/99 PASS.
- Original nine failure entries: 9/9 PASS.
- Baseline full regression: stopped at 92 PASS / 1 newly exposed FAIL out of 152 scheduled files.
- Baseline FULL GREEN: not achieved.
- Sprint 1 reapplied validation: not started, because the prerequisite baseline full green was not achieved.
- Production diff: 0 files / 0 lines.
- `git diff --check`: PASS, with only Git LF-to-CRLF notices.
- Full syntax: not run after Stop Condition F.
- No commit, push, Sprint 2 work, allowlist, skipped assertion, or production-contract relaxation.

To resume, explicitly add `tests/decision-flow-test.js` newline normalization to the repair scope. Its minimal repair is the same test-only source-reader normalization already validated in memory.
