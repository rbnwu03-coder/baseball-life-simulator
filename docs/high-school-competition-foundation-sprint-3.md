# Taiwan High School Competition & U18 Selection Foundation — Sprint 3 Closeout

## 1. Baseline

- Branch: `main`
- HEAD and `origin/main` at construction start: `5ccc650 feat: integrate competition evidence with county selection`
- Ahead / behind: `0 / 0`
- Working tree at construction start: clean
- Baseline dependency gate: 18/18 files passed

## 2. Changed files

- `national-selection-pipeline.js`
- `high-school-competition-foundation.js`
- `high-school-competition-evidence.js`
- `index.html`
- `player.js`
- `save.js`
- `script.js`
- `tests/national-selection-fixture.cjs`
- `tests/national-selection-pipeline-test.js`
- `tests/u18-roster-construction-test.js`
- `docs/high-school-competition-foundation-sprint-3.md`

## 3. NationalSelectionPipeline contract

`nationalSelectionState` is an additive versioned player subdomain containing canonical pipelines. Each pipeline identifies one CompetitionEdition, one national-training team, one national team, config-derived stages, the current stage, candidate references, evaluation revisions, decisions, final roster and explicit amendments. Pipeline identity includes the edition/campaign context, so multiple campaigns in one year or across years do not overwrite one another.

## 4. SelectionConfig / stage contract

Stages are read only from `CompetitionEdition.selectionConfig.stages`. Each normalized stage stores `stageId`, sequence, stage type, target roster size, lifecycle status, team type, evidence policy and roster policy. Sizes must remain non-increasing, all pre-final stages use `national_training`, and the final stage uses `national_team`.

Evidence confidence requirements are config-driven through `evidencePolicy.minimumConfidence`. Completed stages reject ordinary candidate admission and evaluation changes; explicit injury/withdrawal/replacement amendments remain available.

## 5. Candidate identity

Candidate records contain only `candidateId`, `playerId`, source school/county identity, lifecycle status and current stage identity. Restore validation rejects added capability fields. Contact, power, fielding, pitching and other player truth are never copied into a candidate or roster entry.

Initial non-admission is recorded as `not_selected`. Later competitive removal is `cut`; `injured` and `withdrawn` remain separate states.

## 6. NationalSelectionProfile

`buildNationalSelectionProfile()` consumes Sprint 2 CompetitionEvidence, canonical position readiness, position/role tags, current eligibility and national roster need. It returns capability summary provenance, position/role fit, evidence summary, confidence, recent trend, recommendation, positive reasons and concerns. County selection can contribute evidence but is not an admission prerequisite.

The profile uses accumulated evidence with the existing recent-evidence weighting. One new weak camp observation therefore affects but does not erase strong history.

## 7. Roster policy

Roster policy supports `minByPosition`, `maxByPosition`, `requiredRoles` and flexible slots. Required pitcher roles, catcher roles, shortstop coverage and other constraints live in CompetitionEdition fixtures/config rather than engine constants.

## 8. Roster construction algorithm

The deterministic constructor follows four steps:

1. Recheck candidate eligibility, availability, stage evidence and confidence.
2. Fill configured required roles.
3. Fill configured minimum position coverage while respecting maximums.
4. Fill remaining flexible slots using profile quality, role fit, confidence, recent trend and stable player ID tie-breaks.

The completed roster must match the target size, contain unique canonical players, satisfy policy and reference a `national_team`. Impossible policy fails before stage mutation.

## 9. Best-team-not-top-N proof

The 40-candidate fixture deliberately gives the highest profile values to a large block of first basemen. A score-only top-N roster would contain no catcher, shortstop or pitcher diversity. The engine instead selects lower-ranked role/position specialists first, satisfies 6 P / 2 C / 1 SS plus starter, reliever and backup-catcher roles, then fills flexible slots. Tests confirm both selected specialists outside the score-only top N and high-score redundant players left out.

## 10. Training team lifecycle

Initial-pool advancement uses Sprint 1 `startTemporaryAssignment()` with `national_training`. Shortlist advancement retains that assignment. A shortlist/final cut completes the training assignment with the selection result in end context. Primary school identity remains unchanged.

## 11. Final national team lifecycle

Final selection completes the training assignment, starts one `national_team` temporary assignment and adds a Sprint 1 RepresentativeRoster entry referencing the canonical player/source roster. No candidate can occupy two final roster slots.

Sprint 1 gained the small `setRepresentativeRosterEntryStatus()` lifecycle API so explicit post-final injury/withdrawal can close the representative entry without direct array mutation.

## 12. Cut / injury / withdrawal semantics

Every advance, final selection, not-selected result and cut has a canonical stage decision. Injury and withdrawal use separate decision results and `unavailable:*` concerns. They close active national assignments through Sprint 1 lifecycle APIs. No exit is silently rewritten as a cut.

## 13. Replacement semantics

A final injury creates an explicit vacancy amendment and leaves the roster under target until a replacement command is issued. `promoteAlternate()` rechecks the alternate's current eligibility, final-stage evidence and roster-policy fit, then creates a replacement decision, national assignment, representative entry and amendment. Replaying the command returns the existing amendment.

## 14. Explainability

Every stage decision preserves `positiveReasons`, `concerns` and decision context. Reasons cover position/role need, sample confidence, evidence quality, eligibility, assigned roster role/position, weaker combination fit, availability and replacement source. Numeric scores are never the only explanation.

## 15. Idempotency

- Replaying candidate admission three times retains one candidate.
- Same candidate/stage evaluations append revisions under one evaluation identity.
- Replaying a completed stage returns existing decisions.
- Assignment and RepresentativeRoster identities reuse Sprint 1 idempotency.
- Final roster contains unique player IDs.
- Stage evidence replay reuses Sprint 2 deterministic evidence identity.
- Replacement replay retains one roster entry and one amendment.

## 16. Save / load

`createInitialPlayer()` includes an empty national-selection state. `normalizeSave()` restores and validates it after Sprint 1/2 state. Real save/load tests cover a pipeline entering its final stage and a completed final roster with national assignment. Pipeline identity, stage status, candidates, evaluation revisions, decisions, reasons, assignments and final roster remain unchanged. No outer save-version bump or extra localStorage key was added.

Sprint 2 received one narrow compatibility repair: `selectionRelevance: null` is now treated as absent instead of being dereferenced as an object during evidence restore. This does not change weighting or evidence semantics.

## 17. Multi-year continuity

Y2 and Y3 campaigns remain separate pipelines. The same player can retain a prior-year cut decision and a later final selection. High-school year transition restores and preserves the entire national-selection subdomain. Legacy saves create an empty canonical state without invented history.

## 18. SS vertical

PASS. The generic pipeline fills configured shortstop coverage using position readiness, evidence and middle-infield role context.

## 19. Pitcher vertical

PASS. The same pipeline satisfies pitcher count and distinct starter/reliever roles. Additional role tags such as multi-inning, left-handed option and strike thrower remain supported by config without a new pitcher evaluator.

## 20. Catcher vertical

PASS. The same pipeline satisfies catcher minimum and backup-catcher role policy, preventing a score-heavy roster with zero catchers.

## 21. Config-driven stage tests

- 36 → 22 → 18: PASS
- 36 → 24 → 20: PASS
- 12 → 8 → 5: PASS

No production branch contains these counts or a tournament-name condition.

## 22. 36+ candidate scale test

Two independent 40-candidate campaigns complete all stages, assignments, decisions and roster construction. Candidate and final-roster identities remain unique. Both configured final sizes and policies pass integrity validation.

## 23. Selected dependency regression

20/20 files passed, covering the two new suites plus Competition Foundation, Representative Team, CompetitionEvidence, CountySelectionOpportunity, position/opportunity, Match Experience, Team Roster, Team Strength, entry roster, Y1/Y2/Y3, save admission, career evidence and career finale.

## 24. Full JavaScript syntax

238/238 `.js` and `.cjs` files passed `node --check`.

## 25. Full regression

158/158 runners passed: 155 `*test.js` files plus content-flow audit, vertical-slice smoke and the 1,400-game structural audit.

## 26. 1,400-game audit

PASS. The deterministic audit completed 1,000 bench and 400 starter matches with zero orphan matches, no-progress cases or integrity issues. Sprint 3 does not modify Match Engine, Defensive Decision, runner settlement or pitcher-catcher sequencing.

## 27. git diff --check

PASS. Git only reports configured LF-to-CRLF working-tree notices.

## 28. git status

Sprint 3 changes remain unstaged on `main` at HEAD `5ccc650`. No commit or push was performed.

## 29. Stop Condition status

No Stop Condition A–L was triggered. Stage counts and roster constraints are config-driven; candidates and rosters use canonical identity references; final construction is coverage-first; national-training and national-team assignments remain separate; exits and replacements are explicit; save/transition history is retained; no tournament names or Defensive Foundation changes were introduced; full regression is green.

## 30. Deferred work

Full training-camp content, blue-white games, professional farm-team exhibitions, international opponents/gameplay, scouting personality redesign, fame/media effects, draft/university balance, injury-system redesign, Defensive Position Expansion, UI and narrative polish remain deferred. Sprint 4 was not started.

Sprint 3 is **PASS** and remains available for human review without commit or push.
