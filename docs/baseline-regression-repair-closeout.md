# Baseline Regression Repair — Defensive Admission & Test Harness Reconciliation

## 1. Baseline reproduction

- Branch / commit: `main` / `efc9e60 feat: establish runner throw timing and play settlement`.
- Sprint 1 was stashed before baseline work. The clean baseline reproduced the original failures without Sprint 1 code.
- An additional newline-sensitive Decision Flow harness was discovered, explicitly authorized, and repaired within the narrow newline sweep.

## 2–3. Failure clusters, roots, and classification

| Failure | Classification | Root cause / repair |
| --- | --- | --- |
| high-school-integration-1-2 | stale harness and expectation | Loaded canonical roster/strength. A real defensive decision is conditional, so continuation now accepts the next visible canonical decision without forcing defense. |
| high-school-integration-1-2-2-2 | stale fixture | Loaded canonical roster/strength and set the partial double-play fixture to one out; with two outs, the third-out contract correctly ends the inning. |
| high-school-integration-1-1 | stale harness | Loaded canonical roster and strength instead of silently exercising the legacy roster path. |
| goal-balance | stale harness | Loaded canonical roster and strength. |
| baseball-match-foundation-2-2 | stale fixture/harness | Loaded canonical roster/strength and aligned forced substitutions with the batting slot of the canonical incumbent. |
| content-flow-audit | stale harness | Loaded roster, strength, and offensive approach dependencies; initialized minimum legal genesis, capability settlement, position, and high-school state before reading dynamic choices. |
| baseball-match-foundation-2-2-2 assertion 21/22 | stale semantic fixture | Explicitly modeled the runner on third as committed toward home. |
| root scene-context-layer-test.js | duplicate / misplaced artifact | Removed exact duplicate; canonical `tests/scene-context-layer-test.js` remains and passes. |
| player-data-boundary-test | cross-platform newline harness bug | Normalized source text before multiline regex extraction; 99 validations retained. |
| decision-flow-test | cross-platform newline harness bug | Normalized source text before exact multiline replacement and golden synthesis; 86 validations retained. |

No failure required a production logic change. Defensive admission, capability admission, third-out handling, and player-data ownership contracts remain intact.

## 4. Modified files

Baseline repair changed only tests/harnesses:

- Removed `scene-context-layer-test.js`, the misplaced duplicate.
- Updated `tests/baseball-match-foundation-2-2-2-test.js`.
- Updated `tests/baseball-match-foundation-2-2-test.js`.
- Updated `tests/content-flow-audit.js`.
- Updated `tests/goal-balance-test.js`.
- Updated `tests/high-school-integration-1-1-test.js`.
- Updated `tests/high-school-integration-1-2-2-2-test.js`.
- Updated `tests/high-school-integration-1-2-test.js`.
- Updated six newline-sensitive source harnesses listed below.

Sprint 1 separately retains its intended production integration in `index.html`, `player.js`, `save.js`, and `script.js`, plus its new domain, tests, and report.

## 5–6. Production and test-only repair

- Baseline repair production diff: **0 files / 0 lines**.
- Overall production diff consists only of the previously completed Sprint 1 changes.
- No assertion was deleted, skipped, allowlisted, or weakened to a platform-specific result.
- No shared helper file was created. Each affected harness uses a local one-line source reader/normalizer to avoid broad test refactoring.

## 7. 3B defensive semantic conclusion

Canonical behavior requires a force at home or an explicitly committed/advancing runner targeting home before offering the home defensive route. A runner merely occupying third base does not create that physical truth. Inning, tie score, and outs affect priority but do not invent movement. The corrected fixture sets runner index 2 to `committed` with target `home`, then verifies the prevent-run and secure-out objectives. Production behavior is unchanged.

## 8. Source Harness Newline Compatibility Sweep

The sweep inspected 41 source-reading harness candidates: 39 direct source-variable candidates plus the two already identified tests. Each candidate was run with in-memory forced LF and forced CRLF source reads.

Six files were proven newline-sensitive and normalized locally with `.replace(/\r\n?/g, "\n")` before source inspection:

| File | Original sensitive pattern |
| --- | --- |
| player-data-boundary-test.js | multiline regex extraction of `createPlayer` using literal LF boundaries |
| decision-flow-test.js | exact multiline `.replace` used to synthesize a golden legacy source |
| day-completion-flow-test.js | multiline regex/replacement of the sleep branch |
| current-state-boundary-test.js | exact multiline replacement of a state-boundary block |
| coach-response-flow-test.js | exact multiline replacement of migrated coach blocks |
| contextual-status-panel-test.js | section/function equality between CRLF working-tree source and LF `git show` source |

All six pass with native source, forced LF, and forced CRLF. Syntactic `assert`/`verify` call counts match HEAD exactly for each file. Player Data remains 99 validations; Decision Flow remains 86 validations.

## 9–13. Validation

- Original 10 known failure entries: 10/10 PASS.
- Baseline full JavaScript syntax: 227/227 PASS.
- Baseline full regression: **152/152 PASS**.
- Sprint 1 stash restore: no conflict; all nine stash-listed files restored.
- Sprint 1 dedicated tests: 2/2 files PASS.
- Sprint 1 dependency regression: 11/11 files PASS.
- Sprint 1 applied full JavaScript syntax: **230/230 PASS**.
- Sprint 1 applied full regression: **154/154 PASS**.
- The 1,400-game opportunity audit passed in both final full regression runs.

## 14–16. Repository closeout

- `git diff --check`: PASS; Git only reports configured LF-to-CRLF notices.
- Branch / HEAD remain `main` / `efc9e60`.
- Changes are unstaged. No commit or push was performed.
- No Stop Condition remains triggered in the completed repair. No Sprint 2 work was started.
