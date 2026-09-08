# Baseline Regression Repair — stopped at Condition F

## 1. Baseline reproduction and preservation

HEAD was and remains `efc9e6084f0b7f39b2078f0a3d37c10a8cb3bf45`, branch `main`.
Initial `git diff --check` passed. All nine pre-existing changed/untracked files, including the Sprint 1 ZIP, were copied to a temporary backup with a SHA256 manifest.

- Backup: `C:\Users\User\AppData\Local\Temp\baseball-baseline-repair-48675f34e1254127bac0644ec16b8c97`
- Retained stash: `8cc34a930df052067d1bad3ea798fe0b9d2ae036`
- Clean-baseline sweep log: `C:\Users\User\AppData\Local\Temp\baseball-repair-clean-baseline.log`

After stashing, `git status --short --branch` showed a clean `main` at efc9e60. The full regression was started without any Sprint 1 files/diff. It encountered an additional failing test outside the eight authorized failures and was interrupted under Stop Condition F. This run therefore does not establish a completed eight-failure-only baseline or full green. The prior independent export reproductions remain documented in the Sprint 1 report.

## 2–3. Failure clusters and preliminary classification

| Original failing file | Preliminary classification / evidence |
| --- | --- |
| tests/high-school-integration-1-2-test.js | Outdated harness plus stale fixed moment-order assumption. Omits canonical roster/strength runtime. In-memory loading of both removes incumbent error but exposes assertion 22, which assumes the next decision must be defense. |
| tests/high-school-integration-1-2-2-2-test.js | Outdated harness plus seed-dependent presentation fixture. In-memory loading of both modules removes incumbent error but exposes assertion 21. |
| tests/high-school-integration-1-1-test.js | Outdated harness; in-memory loading of roster and strength passes the complete test. |
| tests/goal-balance-test.js | Outdated harness; in-memory loading of roster and strength passes the complete test. |
| tests/baseball-match-foundation-2-2-test.js | Outdated harness plus substitution fixture assumption. In-memory loading of both modules removes incumbent error but exposes assertion 18. |
| tests/content-flow-audit.js | Outdated harness: directly evaluates dynamic event.choices without admitted genesis/capability state. Not repaired or rerun to completion in this stopped run. |
| tests/baseball-match-foundation-2-2-2-test.js | Stale 3B expectation: third-base occupancy alone is not an advancing-home runner. Formal contract described below. No expectation changed. |
| root scene-context-layer-test.js | Duplicate/misplaced artifact: `git diff --no-index` found no content difference from tests/scene-context-layer-test.js; the parent-directory resolution is incorrect at root. No artifact removed. |

These are audit findings, not completed repairs. No production bug has been established. The incomplete sweep again observed the original Group A failures in high-school-integration-1-2, high-school-integration-1-2-2-2, high-school-integration-1-1 and goal-balance before interruption.

## 4–6. Changes and repairs

Only this report is newly added by this repair attempt. No production logic or test source was changed. All diagnostic test-source substitutions were in memory only. Loading only TeamRosterFoundation is insufficient: createHighSchoolMatchSimulationRoster also requires TeamStrengthModel, otherwise the legacy roster path remains active. A future shared harness repair should load the pair together and keep active-defense validation intact.

## 7. 3B defensive semantics

The authoritative contract is `docs/defensive-decision-throw-foundation-v1.md`, lines 44–59, implemented by `hasHomePlay` and `buildDecisionOpportunity` in defensive-decision-throw-foundation.js. A home route needs a canonical force-home runner or an explicitly committed/advancing runner targeting home. The contract applies generically, including 3B. A runner merely holding third, one out and a tie score do not establish that route. Tie/inning context affects priority, not runner movement truth.

A follow-up should cover holding, explicitly advancing-home, and force-home cases separately, preserving automatic handling when there is no meaningful competing objective. Do not simply flip the old expected boolean or assume every non-home route is automatic. No semantic change was made in this run.

## 8. Newly discovered baseline failure — Stop Condition F

`tests/player-data-boundary-test.js:231` matches createPlayer using literal LF delimiters:

`/function createPlayer\(\)\s*\{([\s\S]*?)\n\}\n\nfunction resetGame/`

The local `core.autocrlf=true` checkout produced CRLF source after stash. On the clean baseline, the regex failed with `無法擷取 createPlayer 原始碼`. Read-only diagnosis confirmed:

- CRLF source: true.
- Original regex on raw source: false.
- Same regex after in-memory CRLF→LF normalization: true.
- Complete player-data-boundary test with only in-memory source normalization: PASS, 99 validations.

This is a newline-sensitive test harness/source guard, not a demonstrated production regression. It is nevertheless outside the eight authorized failures and triggered the explicit instruction to stop on any additional full-regression failure. No persistent newline normalization or ninth-test repair was applied.

## 9. Sprint 1 restoration

Applied the retained stash without deleting it, then restored any Git-converted bytes from the pre-stash backup. SHA256 verification confirms all nine original files are byte-for-byte identical to their pre-repair contents. Sprint 1 domain contracts were not changed.

After restoration:

- high-school-competition-foundation-test.js: PASS.
- representative-team-contract-test.js: PASS.
- player-data-boundary-test.js: PASS (the original pre-stash source bytes are restored).

No baseline full-green or reapplied full-regression claim is made.

## 10–13. Final gates

- Full syntax: not rerun in this stopped repair; the earlier Sprint 1 231-file syntax result is unchanged historical evidence.
- `git diff --check`: PASS; only configured LF/CRLF notices.
- `git status`: main at efc9e60, four modified tracked Sprint 1 files, five restored untracked Sprint 1 files including ZIP, plus this new report. None staged.
- Stop Condition: **F triggered**. No evidence requiring A–D; the incomplete sweep cannot newly certify every original failure for E.
- No commit, push, Sprint 2, production repair, test deletion, or contract relaxation.

To resume, the repair scope needs to explicitly include the ninth newline-sensitive source-guard failure and its minimal test-only correction, followed by the originally requested baseline/Sprint 1 validation sequence.
