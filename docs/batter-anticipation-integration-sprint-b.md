# Batter Anticipation Integration — Sprint B

## Canonical boundary

The production order is: public game context and completed pitch history create observable evidence; the batter observes a noisy subset, interprets that subset into a subjective five-class distribution and confidence, then the player independently chooses a plate approach. The pitcher distribution was already frozen before that choice and remains the input to intended-pitch sampling and control realization.

Pitcher truth, batter expectation, and the eventual actual pitch are separate states. Recognition remains a post-release resolver and can correct a bad expectation. Contact and PA outcome do not rewrite anticipation quality.

## Information firewall

Production anticipation resolvers accept only:

- public count, outs, runners, score difference, inning and leverage;
- previously observable pitch classes, pitch results, and abstract visible command cues;
- the batter's Observe, BaseballIQ, and BallSense;
- a deterministic plate-appearance identity.

They do not accept pitcher mental state, pitcher process state, the frozen true distribution, intended pitch class, or any future actual pitch. The frozen true distribution is passed only to the separate development audit evaluator after subjective anticipation is complete.

## Capability responsibility

- Observe controls evidence retention, omissions, visible-cue retention, and deterministic observation noise.
- BaseballIQ controls count/context interpretation and uncertainty awareness.
- BallSense controls integration of observed patterns and the size of deterministic interpretive bias.

High capability improves the model without granting perfect information. Confidence is calculated separately from directional accuracy.

## Persistence and agency

The meaningful-PA save boundary stores the observable evidence snapshot, observation result, interpretation result, subjective distribution, confidence, debug audit, chosen approach/readiness, and pre-pitch frozen distribution. Reload uses those stored values instead of rerunning observation noise.

Anticipation never selects an approach. Pre-pitch readiness describes alignment between a player's chosen approach and their subjective expectation; it is not a success probability and does not alter recognition, swing/take, contact, or outcome resolution.

## Observable history shape compatibility

The canonical match-local observable record contains `pitchClass`, `pitchResult`, `ballsAfter`, `strikesAfter`, and `commandCue`. The shared normalizer accepts both stored canonical records and raw resolved pitches, using the explicit class priority `pitchClass` → `actualPitchClass` → `pitchLocationClass`. Existing canonical cues are preserved; raw pitches derive only an observable command abstraction. A record without any valid pitch class is ignored rather than reverse-inferred from its pitch result.

## Cue interpretation

Interpretation consumes only cues retained in `observationResult.observedCues`; it never returns to raw evidence. `recentChallengeHeavy` and `recentExpansionPattern` apply small, capability-scaled directional modifiers before normalization. Command cues remain semantically separate: `commandAppearsStable` adds modest confidence and reduces uncertainty, while `minorLocationDrift`, `visibleLocationMiss`, and `recentCommandInstability` apply progressively stronger uncertainty pressure. Command cues do not directly predict a pitch class, and strategic cues cannot override count context or reveal pitcher truth.

## Deferred

Player-facing anticipation presentation, exact-probability UI, pitch arsenal and named pitch types, catcher game-calling, personality, scouting, season history, zone geometry, mid-PA approach changes, and outcome/batted-ball balance remain deferred.
