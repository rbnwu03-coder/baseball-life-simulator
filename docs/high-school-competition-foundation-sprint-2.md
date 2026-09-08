# Taiwan High School Competition & U18 Selection Foundation — Sprint 2 Closeout

## 1. Baseline

- Branch: `main`
- HEAD at construction start: `d3cf831 feat: establish high school competition and representative team foundation`
- `origin/main`: `d3cf831`
- Ahead / behind: `0 / 0`
- Working tree at construction start: clean
- Baseline dependency gate: 16/16 files passed before implementation

## 2. Changed files

- `high-school-competition-evidence.js`
- `county-selection-opportunity.js`
- `index.html`
- `player.js`
- `save.js`
- `script.js`
- `tests/high-school-competition-evidence-test.js`
- `tests/county-selection-opportunity-test.js`
- `docs/high-school-competition-foundation-sprint-2.md`

## 3. CompetitionEvidence contract

`competitionEvidenceState` is an additive, versioned player subdomain. Each record carries deterministic `evidenceId`, canonical `playerId`, `competitionEditionId`, `competitionEntryId`, `teamId`, source/evidence type, position, role, sample, context, performance, reliability and creation context. Records reference edition identity and query definition metadata through `getCompetitionContext()`; they do not copy tournament names or create tournament-name branches.

Supported sources are `match` and `evaluation`. Supported evidence types are offense, defense, pitching, baserunning, catching and overall observation. Recording evidence does not modify capability, growth, fame or match outcomes.

## 4. Match / Evaluation integration boundary

The match adapter consumes finalized `MatchExperienceDevelopment` evidence. Production match settlement invokes it only when a match explicitly carries a competition edition or entry identity. A canonical competition entry and an `appeared` participation are required before performance evidence is written. Team entry, reserve status and no appearance do not create match performance evidence.

The evaluation adapter consumes the existing competition reassessment evidence shape and preserves its match/evaluation identity. It does not simulate another performance result or introduce a second evaluation engine.

## 5. Evidence sample / reliability contract

Each record has a typed positive sample and derives `low`, `medium` or `high` reliability from sample size. Selection summaries group evidence dimensions by independent match/evaluation source so several observations from one game cannot be counted as several games. High confidence requires at least three independent sources and eight effective observations. Overall evidence uses 70% accumulated quality and 30% recent quality, so recent form matters without replacing longer history.

Competition exposure weight and selection relevance come from CompetitionDefinition/Edition configuration. Competition level does not override sample reliability.

## 6. CountySelectionOpportunity contract

`countySelectionState` stores versioned opportunities keyed by player, county team and target edition. States are `not_considered`, `under_observation`, `candidate`, `selected` and `not_selected`. Re-evaluation updates the same opportunity and appends a revision; different editions retain separate historical opportunities.

The selection profile consumes canonical position readiness, position fit, competition evidence, sample confidence, recent trend, eligibility and county roster need. Its recommendation is `ineligible`, `observe`, `candidate`, `select` or `decline`. It does not read or create a single overall player rating threshold.

## 7. County roster need integration

The roster-need adapter accepts `neededPositions`, `depthByPosition` and `roleNeed`. It returns one normalized context and derives a bounded position/role fit. No position-specific county score fields or tournament-specific rules were added.

## 8. Explainability structure

Every profile and decision retains machine-readable `positiveReasons` and `concerns`, along with component summaries. Examples covered by tests include strong position fit, county position need, sufficient sample, limited sample, weak evidence and eligibility reasons. A decision never consists only of a Boolean or numeric score.

## 9. Eligibility integration

County evaluation calls Sprint 1 `evaluateCompetitionEligibility()` against the specific target CompetitionEdition. An ineligible player receives an `ineligible` recommendation and cannot pass the selected-decision guard. No school-year age proxy was introduced.

## 10. Selection to Temporary Assignment bridge

A selected decision calls Sprint 1 `startTemporaryAssignment()` and `addRepresentativeRosterEntry()`. The representative roster stores only player/source-team identity references. The player's primary school assignment remains unchanged. A not-selected result is also stored as a canonical decision with its context and reasons.

## 11. Idempotency strategy

- Evidence identity combines player, edition, source match/evaluation identity, canonical source evidence and evidence type.
- Replaying the same match adapter three times keeps one copy of each record.
- Opportunity identity combines player, county team and target edition.
- Re-evaluation updates one opportunity instead of duplicating it.
- Replaying a selected decision returns the existing decision and does not duplicate assignment or roster entry.

## 12. Save / load changes

`createInitialPlayer()` contains empty additive Sprint 2 state. `normalizeSave()` restores and validates evidence after Sprint 1 competition identity, then restores and validates county selection history. No new localStorage key or outer save-version bump was required. A real save/load fixture confirms evidence IDs, opportunity IDs, reasons and decisions remain identical.

Legacy saves without Sprint 2 data load into empty canonical states and do not invent historical observations or selections.

## 13. Multi-year continuity behavior

Year transition validates and preserves both Sprint 2 subdomains. The vertical fixture retains distinct Y1 under-observation, Y2 candidate and Y3 selected opportunities. A same-edition re-evaluation adds a revision to the existing opportunity rather than overwriting or duplicating historical years.

## 14. SS vertical validation

PASS. The shortstop fixture combines canonical position readiness, defensive fit, accumulated competition evidence and explicit county shortstop need. Two similarly capable infielders receive different results when one fills the actual roster need, and structured reasons explain the difference.

## 15. Pitcher vertical validation

PASS. The pitcher fixture uses the same generic evidence/selection adapter with pitcher position and role context. It does not reuse a shortstop-only assumption or redesign the deferred Pitcher Evaluation Foundation.

## 16. New tests

- `tests/high-school-competition-evidence-test.js`: 14/14 assertions passed. Covers no-participation gate, appeared-player evidence, canonical references, production match settlement integration, evidence/evaluation adapters, source identity, idempotency, sample reliability, config-driven context and serialized restore.
- `tests/county-selection-opportunity-test.js`: 22/22 assertions passed. Covers eligibility, position need, evidence confidence, one-game restraint, accumulated-history resilience, structured explainability, not-selected state, selected bridge, bridge idempotency, identity-only roster entry, multi-year continuity, re-evaluation, SS/P verticals, real save/load and legacy saves.

## 17. Selected dependency regression

18/18 files passed, including both new suites plus Competition Foundation, Representative Team Contract, Opportunity Evaluation, Playing Time/Game Exposure, Match Experience, Team Roster, Team Strength, High School Entry Roster, Y1/Y2/Y3 transitions, save admission, career evidence and career exit.

## 18. Full JavaScript syntax

234/234 JavaScript files passed `node --check`.

## 19. Full regression

156/156 runners passed: 153 `*test.js` files plus the content-flow audit, vertical-slice smoke test and 1,400-game structural opportunity audit. The audit completed with zero orphan matches, no-progress cases or integrity issues.

## 20. git diff --check

PASS. Only Git's configured LF-to-CRLF working-tree notices are emitted.

## 21. git status

The Sprint 2 changes are intentionally unstaged on `main`. No commit or push was performed.

## 22. Stop Condition status

No Stop Condition A–K was triggered. The implementation reuses existing evaluation evidence and Sprint 1 identities, does not copy capabilities, does not use an overall-only threshold, does not change Defensive Foundation semantics, does not hard-code a real tournament name, preserves primary school identity and retains save/transition history. Full regression is green.

## 23. Known deferred work

Full tournament schedules and formats, county preliminaries, U18 training pools and cuts, national-team selection, international simulation, media/fame integration, scouting personality work, UI/narrative polish and Defensive Position Expansion remain deferred. Sprint 3 was not started.

Sprint 2 is **PASS** and remains available for human review without commit or push.
