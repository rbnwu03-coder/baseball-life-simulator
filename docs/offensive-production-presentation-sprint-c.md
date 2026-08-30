# Offensive Production Presentation — Sprint C

## Presentation source ownership

- Observation wording comes only from `observationResult.observedPitchClasses` and `observationResult.observedCues`.
- Anticipation wording comes only from the subjective five-class distribution and interpretation uncertainty.
- Confidence wording comes only from the frozen pre-choice anticipation confidence.
- Actual-pitch wording comes only from the resolved actual pitch class.
- Recognition wording comes only from the existing recognition result.
- Execution wording comes only from swing/take/contact evidence on the resolved pitch event.
- Outcome wording comes from the canonical PA result formatter.

No presentation layer derives an earlier layer from a later outcome.

## Player-visible and debug-visible data

The player sees qualitative observation lines, a qualitative anticipation summary, a low/medium/high confidence tier, an actual-pitch abstraction, recognition, execution, causality, and the canonical result. Exact subjective percentages, frozen true distribution, intended pitch, pitcher mental/process state, direction accuracy, and confidence calibration remain development-only.

## Pre-PA structure

The meaningful offensive PA renderer prepares anticipation before rendering choices. The compact `打席判讀` panel appears after the existing situation/count context and before Plate Approach buttons:

1. Observation
2. Subjective anticipation
3. Confidence
4. Player-owned Approach choice

No-evidence is a valid neutral presentation. Pre-pitch readiness remains internal because showing it beside each choice would risk reading as a recommendation.

## Post-PA structure

The resolved PA preserves its canonical anticipation snapshot and ordered pitch history. A transient view model reconstructs:

1. Original anticipation and confidence
2. Actual opening pitch
3. Opening-pitch recognition
4. Final swing/take/contact execution
5. Cross-layer causal summary
6. Canonical outcome

The view model is not stored as simulation truth.

## Temporal attribution contract

- Opening anticipation attribution compares the canonical pre-choice anticipation snapshot only with `pitchHistory[0]`.
- Opening recognition comes only from that same opening pitch event, so recognition rescue never crosses between pitches.
- Final execution comes from the final authoritative pitch event; it does not rewrite opening-read accuracy.
- PA outcome comes from the canonical PA result and is never used to infer anticipation accuracy.
- Empty or malformed legacy pitch history produces a deterministic insufficient-data fallback instead of reverse inference.

Single-pitch plate appearances naturally use the same event as both opening pitch and final execution. Per-pitch anticipation refresh remains deferred.

## Hidden-truth firewall

Presentation formatters never receive pitcher intent, frozen truth, mental/process state, or debug accuracy. Command-instability wording describes visible stability only and never predicts that the next pitch must be a ball.

## Player-facing versus engine language rule

Player-facing presentation describes baseball reality: what the batter saw, which base a defender threw to, who was retired, how runners moved, and the resulting outs and base state. It does not explain simulation contracts with terms such as reverse inference, canonical state, resolver behavior, separate recording, or automatic system execution. Those architecture terms remain appropriate only in tests, debug output, and documentation.

Single-pitch plate appearances compress the presentation to actual pitch, recognition, handling, and result. Multi-pitch appearances explicitly distinguish the opening pitch and recognition from the final handling event without exposing engine terminology.

Coach copy is labeled as a tactical expectation rather than a priority or recommendation. It never changes available Plate Approaches, anticipation, readiness, or pitch distribution.

## Defensive outcome attribution

Defensive outcome wording is reconstructed from canonical route identity, active target base, outs created, runner changes, runners after the play, and outs after the play. A secure first-base route names first base and the batter-runner; lead-runner routes name second, third, or home and the affected runner. Generic “completed an out” copy is not used when authoritative route and runner data are available.

## Unsupported tactical truth rule

No canonical offensive tactical action means no tactical presentation. Generic defensive events therefore use only neutral observable ball, runner, and positioning information. They do not invent bunt, squeeze, hit-and-run, or related intent from presentation variety or a generic ground-ball context.

## Plate Approach semantic audit

A deterministic 2,000-seed-per-cell audit confirmed that `patientSelection` is a probability-shaping selection profile rather than a hard never-swing rule. At zero strikes, a correctly recognized `edgeStrike` produced 22.0% swings and 78.0% takes, compared with 64.15% swings for `aggressiveEarlySwing` and roughly 41–43% for balanced/contact profiles. Two-strike protection increased the same patient edge-strike swing rate to 82.95%. Player-facing copy therefore says “盡量放掉邊角球” instead of promising every edge pitch will be taken. No resolver probability or balance value was changed.

## Save and reload

Pre-choice save/reload preserves the canonical anticipation and pre-pitch planning state. The same deterministic formatter reconstructs identical wording; presentation strings are not added to save truth. Pending and completed PA presentation is likewise rebuilt from canonical PA-local state.

## Deferred boundaries

Per-pitch anticipation refresh, mid-PA approach changes, pitch arsenal and named pitches, catcher game-calling, zone geometry, scouting, personality, coach/scout evaluation, progression rewards, batted-ball physics, and BB/K/H balance remain deferred.

Offensive Tactical Action Foundation remains deferred. Its future chain must establish game context, a canonical offensive tactical decision, batter/runner action, defender-observable evidence, defender recognition/reaction, batted ball, and the resulting defensive opportunity. Sacrifice bunt, surprise bunt, squeeze, hit-and-run, and bunt-and-run must not appear as generic presentation before that truth exists.

Offensive Swing / Batted-ball Intent Foundation also remains deferred. Plate Approach continues to describe which pitches the batter wants to attack; a future separate layer may represent how the batter intends to shape a contacted ball. Sprint C does not add that intent or infer it from outcomes.
