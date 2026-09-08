# Taiwan High School Competition & U18 Selection Foundation — Sprint 1

## Baseline

- Branch: `main`; initial working tree clean.
- Commit: `efc9e60 feat: establish runner throw timing and play settlement`.
- Source: current repository, including the existing defensive foundations; no prototype attachment used.
- Before implementation: all 11 selected dependency test files passed (roster, strength, entry roster, transition, three-year spine, career evidence/offers/exit, save admission, disclosure persistence).

## Domain and ownership

`high-school-competition-foundation.js` exports a browser/CommonJS API. It does not depend on story, match simulation, school names, or selection algorithms.

| Object | Identity and ownership |
| --- | --- |
| CompetitionDefinition | `competitionId`, competitionType, entryUnit, level, selectionRelevance |
| CompetitionEdition | `editionId`, competitionId, seasonYear, status, eligibility, rosterRules, selectionConfig |
| TeamContext | teamType, teamId, organizationId, temporary |
| CompetitionEntry | entryId, competitionEditionId, teamId, teamType, entryStatus |
| TemporaryTeamAssignment | assignmentId, teamId, teamType, competitionEditionId, status, startContext, endContext |
| RepresentativeRoster | rosterId, teamId, competitionEditionId, entries |
| RepresentativeRosterEntry | playerId, sourceTeamId, rosterRole, status; no capabilities |
| PlayerCompetitionParticipation | playerId, competitionEditionId, teamId, rosterStatus, participationStatus |

The canonical player holds one `primaryTeamAssignment`, `temporaryTeamAssignments[]`, and a `competitionFoundation` state with its own `version: 1`. The state stores definitions, editions, teams, entries, representativeRosters, and participations. It does not create another player entity or roster simulation engine.

Team types are school, county_representative, national_training, and national_team. School is permanent; the other types are temporary. `assignPrimarySchool` refuses changing an existing primary identity and checks the authoritative selected school ID. The formal school choice creates this assignment. Unselected youth/legacy players may have no primary assignment; no school is invented from a display name.

Representative entries are admitted by looking up `playerId` in a provided canonical source roster with the matching `teamId`. Only the four reference fields are retained. Source rosters, their capability values, positions, roles, and derived team strengths are not changed. The live game's canonical protagonist identity remains `player`; existing generated teammate IDs are reused.

## Lifecycle and invariants

`startTemporaryAssignment` creates an active assignment. Replaying its edition/team identity returns the existing assignment, including when it has already ended. Identity collisions fail. `endTemporaryAssignment` supports completed and withdrawn; history is retained. `completeEdition` completes the edition and all its active temporary assignments. Active and historical queries return detached snapshots.

`enterCompetition` validates the edition, definition and team entry unit. A school may have separate entries in multiple editions. Entry identity and edition/team identity are independently protected against collisions. Registration does not create player participation or performance evidence. Participation must be explicitly recorded; reserve/none is valid.

`assertIntegrity` checks the primary school, team references, edition references, team types, assignment lifecycle, roster reference-only shape, and duplicate identities. It rejects invalid snapshots instead of merging conflicting identities or silently removing history.

The existing year transition calls the foundation's restore/integrity boundary before changing school-year roster context. It does not regenerate competition identities, truncate history, or reactivate completed assignments. An active assignment is not implicitly ended merely because the school year changes: edition completion or an explicit end command owns that lifecycle.

## Eligibility

`evaluateCompetitionEligibility(player, edition)` returns `{ eligible, reasons }`. Supported rules:

- `ageRule: { type: "age", min?, max? }` reads an explicit integer current age.
- `ageRule: { type: "birth_year", min?, max? }` reads an explicit integer birthYear.
- `schoolStages: [...]` checks an explicit schoolStage.
- `requireAvailable: true` requires `available === true`.

Missing data required by a configured rule fails with a reason. Bounds are inclusive. No rule reads schoolYear or infers U18 eligibility from being in year three. A future birth-date/cutoff adapter can supply birthYear or an age evaluated at the relevant cutoff. This Sprint does not alter character creation or encode real competition regulations.

## Persistence

The existing JSON player snapshot includes the new fields. `normalizeSave` restores and validates the foundation before the existing candidate-first load admission/commit boundary. Legacy saves get empty state; saves with an authoritative selected school get that primary identity. No new localStorage key is introduced. The outer save version remains 15; the additive domain is independently versioned at 1. Unsupported domain versions or corrupt identities are rejected. When foundation data exists but its module is unavailable, load fails closed.

The new production integration test exercises actual `saveGame`/`loadGame`, active and completed assignments, both year transitions, repeated commands, two source schools, national team types, legacy migration, and corrupt-load preservation of the live player.

## Changed files

- `high-school-competition-foundation.js`: new domain and validation API.
- `player.js`: additive fields and formal school-choice binding.
- `save.js`: restore/admission hook.
- `script.js`: three-line year-transition boundary hook; no domain implementation.
- `index.html`: module load before player initialization.
- `tests/high-school-competition-foundation-test.js`: domain, identity, participation, eligibility and corrupt-state tests.
- `tests/representative-team-contract-test.js`: representative lifecycle and production persistence/transition tests.
- This report.

## Scope

No architecture Stop Condition A–F was triggered. Existing canonical roster references, persistent school identity and JSON save admission support the foundation without copying representative players or replacing the school roster. The baseline harness failures were repaired separately without production changes, and both the repaired baseline and reapplied Sprint 1 now have full-green regression results. Sprint 1 is **PASS**. No schedule, selection algorithm, cut pipeline, match balance, defensive redesign, narrative expansion, commit, push or Sprint 2 work is included.

## Validation

- New foundation and representative tests: PASS.
- Post-change selected dependency tests: 11/11 PASS.
- Full JavaScript syntax after baseline repair and Sprint 1 reapplication: 230/230 PASS. The count is one lower than the prior 231-file run because the misplaced root duplicate was removed; Sprint 1's three JavaScript files remain present.
- Repaired baseline full automated regression: 152/152 executable test files PASS.
- Sprint 1 applied full automated regression: 154/154 executable test files PASS.
- The context helper is excluded as a standalone executable and covered by its consuming tests. The long-running 1,400-game opportunity audit passed in both final full sweeps.
- `git diff --check`: PASS (only Git's configured LF-to-CRLF notices).
- Final branch: `main`, HEAD remains `efc9e60`; changes remain unstaged. No commit or push.

## Baseline regression conflicts

The following failures were independently reproduced by exporting unmodified `efc9e60` to a temporary directory and running the same tests there. The Sprint changes were not present in that export.

| Test | Baseline and working-tree failure |
| --- | --- |
| high-school-integration-1-2-test.js | missing substitution incumbent |
| high-school-integration-1-2-2-2-test.js | missing substitution incumbent |
| high-school-integration-1-1-test.js | missing substitution incumbent |
| goal-balance-test.js | missing substitution incumbent |
| baseball-match-foundation-2-2-test.js | missing substitution incumbent |
| content-flow-audit.js | character genesis / capability settlement prerequisites missing |
| baseball-match-foundation-2-2-2-test.js | assertion 21: third baseman, runner on third, one out, tied game should create a decision |
| root scene-context-layer-test.js | ENOENT: resolves player.js in parent directory; the test under tests/ passes |

The first five fail in `shouldEnterHighSchoolMatchPlayer`, at the existing active-defense admission check (`script.js:6366`). Suggested minimum follow-up: inspect each fixture's assigned position and canonical starting defender/bench setup; use a specific canonical defensive position and valid incumbent where the fixture currently uses a generic position. Determine whether a production adapter correction is necessary before changing engine behavior. Do not remove the integrity assertion or synthesize an arbitrary substitute defender.

The content audit accesses dynamic `event.choices` without first establishing a settled high-school player. Suggested minimum follow-up: initialize an admitted canonical player before inspecting dynamic match choices, or separate static content inspection from runtime getters. Do not bypass capability admission.

For the third-base assertion, compare the legacy fixture/expectation against the current defensive-opportunity contract before proposing a change; baseline reproduction alone does not prove whether the fixture or the engine needs repair. For the root-level scene test, correct its relative root or explicitly retire the misplaced duplicate while retaining `tests/scene-context-layer-test.js`.

These baseline repairs were implemented as test-only changes in the separate Baseline Regression Repair pass. See `docs/baseline-regression-repair-closeout.md` for final classification and validation.
