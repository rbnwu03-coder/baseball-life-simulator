# Pitch Tactical Interpretation Foundation v0.1

## Purpose and architecture

This module describes patterns supported by the current player PA's accumulated
Sequence facts. A pattern is a bounded interpretation of observations, not a new
canonical fact about a player's ability, intention, personality, or condition.

Production truth -> Pitch Observation -> Pitch Sequence State -> Tactical Interpretation

The browser loads the module immediately after Sequence State. Loading declares
an API only. No production consumer, tactical recommendation, or UI is connected.
The existing PitcherCatcherTacticalIntegration behavior stays unchanged.

## Formal API and input authority

Browser: `PitchTacticalInterpretationFoundation.interpret(sequenceState)`

CommonJS: `require("./pitch-tactical-interpretation-foundation")`

- VERSION: `pitch-tactical-interpretation-v0.1`
- SOURCE: `pitchTacticalInterpretationV1`
- INTERPRETATION_TYPES: immutable array in formal output order.
- Input: supported output of PitchSequenceStateFoundation, version
  `pitch-sequence-state-foundation-v0.1`.

Only supported/version, paIdentity/pitchCount, six named sequence counters, and
contact.hardContactsOnLocationMiss are read. The Sequence owner remains responsible
for aggregating observations and validating its full state. Interpretation checks
its consumed projection: five-part player PA identity with nonempty parts,
nonnegative safe-integer pitchCount, and all consumed counters as safe integers
between zero and pitchCount. It does not replay or validate pitch-level history.
Zero-pitch initial Sequence states are supported and have no patterns.

## Output contract

```js
{
  supported: true,
  version: "pitch-tactical-interpretation-v0.1",
  paIdentity: "match|pa|player|1|top",
  pitchCount: 2,
  interpretations: [{
    type: "TAKE_PATTERN_PRESENT",
    scope: "CURRENT_PA",
    source: "pitchTacticalInterpretationV1",
    reasonCode: "CONSECUTIVE_TAKES_AT_LEAST_TWO",
    evidence: { consecutiveTakes: 2 }
  }]
}
```

Every item has exactly type, scope, source, reasonCode, and minimal evidence.
Each evidence object copies one consumed numeric fact; the full Sequence State
and upstream evidence are not copied. All output objects and arrays are frozen;
input is neither mutated nor frozen. Each call owns fresh output objects.

Unsupported output is atomic and has no partial patterns:

```js
{ supported: false, version, reason, interpretations: [] }
```

Reasons are DEPENDENCIES_UNAVAILABLE (browser Sequence owner absent),
UNSUPPORTED_SEQUENCE_STATE (input absent or supported !== true),
SEQUENCE_VERSION_MISMATCH, and INVALID_SEQUENCE_STATE (consumed projection invalid).
Compressed/NPC events must first pass through upstream owners; their unsupported
Sequence result remains unsupported here. Raw events are not accepted directly.

## Supported types, thresholds, and deterministic order

| Type | Source fact | Trigger | Reason code |
|---|---|---|---|
| TAKE_PATTERN_PRESENT | sequence.consecutiveTakes | >= 2 | CONSECUTIVE_TAKES_AT_LEAST_TWO |
| TAKE_PATTERN_STRONG | sequence.consecutiveTakes | >= 3 | CONSECUTIVE_TAKES_AT_LEAST_THREE |
| CALLED_STRIKE_PATTERN_PRESENT | sequence.consecutiveCalledStrikes | >= 2 | CONSECUTIVE_CALLED_STRIKES_AT_LEAST_TWO |
| CHASE_PATTERN_PRESENT | sequence.consecutiveChases | >= 2 | CONSECUTIVE_CHASES_AT_LEAST_TWO |
| SWING_MISS_PATTERN_PRESENT | sequence.consecutiveSwingMisses | >= 2 | CONSECUTIVE_SWING_MISSES_AT_LEAST_TWO |
| REPEATED_TARGET_HITS | sequence.consecutiveTargetHits | >= 2 | CONSECUTIVE_TARGET_HITS_AT_LEAST_TWO |
| VELOCITY_DOWN_PATTERN | sequence.consecutiveVelocityDown | >= 2 | CONSECUTIVE_VELOCITY_DOWN_AT_LEAST_TWO |
| LOCATION_MISS_PUNISHED | contact.hardContactsOnLocationMiss | >= 1 | HARD_CONTACT_ON_LOCATION_MISS_IN_CURRENT_PA |

Output follows this table: batter response, execution, velocity, contact.
Strong supplements Present: three or more consecutive takes produce both types.
This uses presence types and the explicit Strong take category rather than a
separate confidence field, severity score, or calibrated probability.
Thresholds are descriptive v0.1 rules, not estimates of predictive accuracy.

Streak patterns depend exclusively on current streaks, not PA-wide ratios or
totals. A reset removes the streak pattern even when prior PA totals remain high.
LOCATION_MISS_PUNISHED is PA-wide and persists within that PA after the supporting
event. Starting a new PA carries nothing from the previous PA.

## Interpretation versus fact, psychology, and recommendation

Take describes observed non-swings, not passivity, fear, or a pitch expectation.
Called strikes describe consecutive taken strikes, not recognition ability.
Chase does not mean poor discipline. Swing misses do not establish lateness or
weakness against a pitch family. Target hits are not a generic command grade.
Velocity down refers to prior observations relative to each pitch's own baseline;
it does not establish fatigue, arm condition, day form, or declining stuff.
Location miss punished records that the PA contains hard contact on a miss;
it does not tell a pitcher to abandon a pitch or avoid a hitter.

No interpretation settles a count, upgrades a player trait, or changes canonical
truth. No recommended pitch, target, next-pitch call, tactical command,
probability distribution, or decision is emitted. No existing repeatSuccess,
changeLook, challenge, or expandZone consumer is connected.

FOUL_PRESSURE_PRESENT is omitted because the current Sequence contract has no
consecutiveFouls authority. Sequence State is not expanded for this Sprint.

## Authority access, determinism, RNG, and mutation

The module uses only Sequence.VERSION from its owner and never calls an upstream
reducer or PitchObservationFoundation.observePitch. It never reads pitchHistory,
raw pitch/location, pitchResult, pitchType, targetIntent, contactQuality,
Observation evidence, recentPitches, or lastPitch. It does not reconstruct chase,
location execution, velocity, hard contact, or swing-miss semantics.

Unit tests use getter/Proxy traps on raw and pitch-level fields, forbid input
enumeration, allow only VERSION access on the Sequence owner, and trap Observation
owner access. Browser Math.random is trapped. One input is interpreted 100 times
with identical results. Mutable input snapshots stay equal and unfrozen, and
returned evidence remains detached after later input changes.

## Production projection and save/load

The integration test uses normal UI/admission choices and genuine detailed
player PAs, with no forced role, capability, pitch truth, or injected observation.
It temporarily wraps the existing resolution function only in the test. At each
actual pitch it projects Observation -> incremental and rebuilt Sequence ->
Interpretation, compares browser/CommonJS results, and checks 100 Sequence-to-Interpretation
rebuilds under an RNG trap. Snapshots protect production, observations, previous
Sequence state, and current Sequence state.

Five matches cover take OFF/ON/reload and swing OFF/ON. Whole match deep equality
covers tactical state, outcomes, and GameRecord; RNG cursors are compared separately.
A source guard verifies Sequence, Observation, OPA, tactical integration,
pitch sequencing, save.js, and script.js against baseline 98bcd1d.

Interpretation is derived memory only and is never written into player or save
schema. Live reload checks persisted history, pending pitch, count, record, and RNG,
then discards derived Sequence memory. Finished persisted copies are also rebuilt:

persisted pitchHistory -> Observation rebuild -> Sequence rebuild -> Interpretation rebuild

The rebuilt browser result and CommonJS result equal the pre-save interpretation.
Save text contains neither the interpretation version nor an interpretation field.

## Actual production witness

PA: hs-y1-autumn-exhibition|hs_y1_match_moment_1|player|1|下

| Pitch | Consecutive takes / called strikes / target hits | Interpretations |
|---|---|---|
| 1 | 1 / 1 / 1 | none |
| 2 | 2 / 0 / 0 | TAKE_PATTERN_PRESENT |
| 3 | 3 / 1 / 1 | TAKE_PATTERN_PRESENT, TAKE_PATTERN_STRONG |
| 4 | 4 / 2 / 2 | TAKE_PATTERN_PRESENT, TAKE_PATTERN_STRONG, CALLED_STRIKE_PATTERN_PRESENT, REPEATED_TARGET_HITS |

This is an observed deterministic fixture outcome, not a required hardcoded
production pattern. Velocity-down streak is zero throughout this witness.

## Validation

- Interpretation unit: 24/24.
- Interpretation production integration: 10/10.
- Sequence State unit: 25/25; production integration: 8/8.
- Observation unit: 22/22; production integration: 7/7.
- Existing Pitcher/Catcher Tactical Integration: 34/34.
- Plate Decision foundation: 19/19; production integration: 15/15.

Take ON: 13 projections, 1,300 chain rebuilds. Swing ON: 26 projections,
2,600 chain rebuilds. RNG draws, production source mutations, previous-state
mutations, and Sequence mutations are all zero. Incremental/rebuild equality,
ON/OFF whole-match equivalence, and live/finished save reload all pass.
48 genuine compressed NPC events remain unsupported.

## Future Decision Foundation handoff

A later Sprint may explicitly authorize a Decision Foundation to consume these
PA-local types and their evidence. That layer must own recommendation policy,
selection, and any RNG behavior. This Sprint provides no decision API, consumer
hook, tactical redesign, UI, commentary, narrative, scouting, or evaluation.
