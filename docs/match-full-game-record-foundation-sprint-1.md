# Match Full Game Record Foundation Sprint 1 Closeout

## 1. Baseline

- Branch: `main`
- Baseline HEAD and `origin/main`: `18d876b65127d8f6fab460174db7449c597ccf2c`
- Baseline title: `feat: establish multi-stage U18 national selection pipeline`
- Baseline gate: ahead/behind `0/0`, clean working tree, prior regression `158/158`, prior JS/CJS syntax `238/238`.

## 2. Changed files

- Added `match-game-record.js`.
- Integrated the record into `script.js`, `player.js`, `save.js`, and the production script order in `index.html`.
- Upgraded `high-school-competition-evidence.js` with an additive full-game production layer.
- Added three focused test files and extended the 1,400-game audit with Game Record integrity.
- Added this closeout document.

## 3. GameRecord contract

`MatchGameRecord` owns `gameId`, optional competition identities, home/away team identities, status, configurable scheduled innings, actual innings played, inning lines, R/H/E totals, final result, composable player lines, compact event references, and integrity state. It is the full-game fact source. It stores stat facts and deterministic event identities, not animation snapshots or narrative text.

## 4. Scoreboard contract

The scoreboard is projected from `gameRecord.inningLines`, `gameRecord.totals`, and `gameRecord.result`. Production presentation still applies its existing reveal cursor so future simulated beats remain hidden, while the completed scoreboard displays inning-by-inning runs and R/H/E from the canonical record. `inningsScheduled` is configurable and `inningsPlayed` may be larger or smaller.

## 5. Batter line

Each player can retain `PA`, `AB`, `R`, `H`, doubles, triples, `HR`, `RBI`, `BB`, `HBP`, `SO`, `SB`, `CS`, `SH`, and `SF`. Every settled player and non-player plate appearance enters the same aggregation path.

## 6. Pitcher line

Each active pitcher can retain `outsRecorded`, `BF`, `H`, `R`, `ER`, `BB`, `HBP`, `SO`, and `HR`. Outs are canonical integer outs; floating-point innings pitched are not stored. Pitch and strike counts remain `null` because the current full-match event stream does not provide complete pitch counts.

## 7. Defensive line

The record retains `chances`, `PO`, `A`, `E`, and `DP` for settled fielder events supported by the current Defensive Foundation. It records catches and directly supported out contributions without inventing a complete assist chain for ordinary plays that do not identify a fielder.

## 8. Baserunning line

Runs, stolen bases, and caught stealing are retained independently under baserunning while the compatible batting totals remain available on the same player aggregate.

## 9. Decision intervention integration

Player decisions continue through the existing plate and defensive decision contracts. Their settled plate appearance or defensive event is written once through the common match-event boundary. Decision records remain micro evidence and are not redefined as full-game samples.

## 10. Non-player simulation integration

Existing AI plate appearances already produce canonical `plateAppearance` and `run` events. The new recorder consumes those events, so non-player segments contribute to the scoreboard, batter lines, and pitcher lines without a second simulation engine.

## 11. Double-count prevention

Every event uses a deterministic identity based on game, inning, half, and sequence unless an explicit event ID exists. Reapplying an event returns `duplicate`; applying an event after finalization returns `locked`. A production integration test also proves that total player PA equals the number of settled plate-appearance events.

## 12. Event identity

`eventRefs` retains only event ID, type, sequence, inning, and half. This is sufficient for idempotency and save/load integrity without copying full animation state or player snapshots.

## 13. Finalization

`finalizeGameRecord()` fills required zero-run inning rows, derives the final result, checks run/hit/error and player-line integrity, marks the record final, and locks ordinary writes. Repeated finalization returns `duplicate` without changing state.

## 14. Save/load

The active or completed record remains inside `player.highSchoolMatch` and therefore uses the existing save payload. `normalizeSave()` restores the schema, scoreboard, player lines, event identities, result, and locked state. No additional local-storage key was added.

## 15. Mid-game reload

A production match saved during inning four restores an identical Game Record and simulation log. Scoreboard values, accumulated stats, and all event IDs remain unchanged, and simulation can proceed to finalization.

## 16. Competition refs

Formal records retain `competitionEditionId` and `competitionEntryId`, including identities attached after match setup and synchronized at finalization. Practice games finalize with both references `null`.

## 17. Full-game evidence adapter

`HighSchoolCompetitionEvidence` now creates additive `fullGameProduction` records from finalized batter, pitcher, and defensive lines. Each record references the canonical game record and retains the actual stat payload. Existing decision evidence is still produced with the `decision` layer.

## 18. Sample reliability change

For a game with four player PA and one decision observation, the production sample is four PA and the decision sample remains one observation. Summary reliability groups both records under the same independent match and takes the full-game sample, so decision frequency no longer substitutes for evaluation sample size.

## 19. Multi-game aggregation

`aggregatePlayerGameLines()` sums batting, pitching, defensive, and baserunning components across records while retaining position appearances. Competition evidence also aggregates independent game samples; the three-game fixture produces 12 PA and high confidence.

## 20. County Selection regression

`county-selection-opportunity-test.js` passes `22/22`. No County Selection thresholds or algorithm were changed.

## 21. National Selection regression

`national-selection-pipeline-test.js` passes `22/22`, including configurable 36+ candidate pools and real save/load. No National Selection algorithm was changed.

## 22. New tests

- `match-full-game-record-test.js`: `13/13`.
- `full-game-player-line-test.js`: `8/8`.
- `full-game-competition-evidence-test.js`: `7/7`.
- Total focused Sprint tests: `28/28`.

These cover the required 7-inning scoreboard, decision count versus PA, non-player PA, double-count prevention, batter/pitcher/defensive/baserunning lines, R/H/E integrity, mid-game and completed reload, competition/practice identities, evidence separation and reliability, multi-game aggregation, limited bench samples, defensive replacement, and position changes.

## 23. Selected dependencies

Thirty-six existing match, high-school integration, competition, playing-time, match-experience, roster, representative-team, County Selection, and National Selection test files passed. The existing High School Competition Evidence suite also remains `14/14`.

## 24. Full syntax

All `242/242` JavaScript and CommonJS files passed `node --check` before this document was added.

## 25. Full regression

The authoritative closeout suite passed `161/161` after all source changes. This total is the baseline `158` plus the three new Sprint test files.

## 26. 1,400-game audit

The audit runs 1,000 bench and 400 starter matches. All matches complete with `0` orphan, `0` no-progress, `0` match-state integrity issue, and `0` Game Record integrity issue. Deterministic replay and instrumentation neutrality remain required assertions.

## 27. Git diff check

`git diff --check` passes. Git reports only expected Windows LF-to-CRLF conversion notices.

## 28. Git status

The implementation is intentionally left uncommitted on `main`; no commit or push was performed.

## 29. Stop Conditions

No Stop Condition was triggered. The implementation uses settled events, never parses narrative or DOM state, records all simulated PA, prevents decision double counts, preserves save/load, and does not alter Defensive Foundation or National Selection semantics.

## 30. Deferred work

- Complete inherited-runner earned-run attribution.
- Complete scorer-specific putout and assist chains for every ordinary defensive play.
- Full pitch/strike totals when the complete match stream supplies every pitch.
- Full box-score UI, advanced metrics, standings, and season leaderboards.
