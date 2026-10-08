# Pitch Observation Foundation v0.1

## Objective and authority

Describe what objectively happened on one detailed player pitch, as a pure,
deterministic projection. This module does not simulate, select, evaluate, or
settle a pitch. It does not participate in tactical decisions or presentation.

The only authorized source is a genuine event from
`offensivePlateAppearanceState.pitchHistory`. Completed canonical copies are
`completedMoments[].pitchHistory` and `lastOffensiveResolution.pitchHistory`.
`OffensivePlateApproach.resolveNextPitch` owns these events; the production
player route prepares a pitch through `prepareHighSchoolPlateDecision`, takes
a player decision, and settles it through `resolveHighSchoolPlateDecisionPitch`.

Never reconstruct pitches from MatchGameRecord refs, simulation PA summaries,
presentation feeds, or developer traces. `AIPlateAppearanceOutcome` compressed
NPC resolution supplies only a terminal PA result, not a pitch stream.

## API and schema

Browser global and CommonJS export: `PitchObservationFoundation`.

```js
const result = PitchObservationFoundation.observePitch(pitchHistoryEvent);
// Supported:
{
  supported: true,
  version: "pitch-observation-foundation-v0.1",
  pitchId, paIdentity, pitchNumber,
  countBefore: { balls, strikes },
  countAfter: { balls, strikes },
  observations: [{
    type, pitchId, paIdentity, pitchNumber,
    source: "pitchObservationV1",
    evidence: { /* copied source facts and explicit derivation basis */ }
  }]
}
// Unsupported:
{ supported: false, reason, observations: [] }
```

Exports also include `VERSION`, `SOURCE`, and immutable `OBSERVATION_TYPES`.
The result and all nested copies are frozen; no source object is frozen or
shared with output evidence. Counts retain source context, not a new settlement.

The caller must provide canonical provenance. Structural validation cannot
authenticate an arbitrary object. It checks the player component of the
existing PA identity, pitch number/safety cap, exact `${paIdentity}|pitch-N`
identity, action/result/contact coherence, valid count ranges, and agreement of
actual location, class, strike, and zone through the production decoder.
It does not regenerate a pitch, count transition, or contact outcome.

Explicit rejection reasons:

- `DEPENDENCIES_UNAVAILABLE`
- `NO_DETAILED_PITCH_HISTORY` (including compressed input and summary refs)
- `NOT_DETAILED_PLAYER_PITCH`
- `INVALID_DETAILED_PITCH_EVENT`
- `INVALID_ACTUAL_ZONE_FACTS`
- `INVALID_PITCH_RESPONSE_FACTS`
- `INVALID_TARGET_INTENT`
- `INVALID_LOCATION_EXECUTION_FACTS`
- `INVALID_FAIR_CONTACT_AUTHORITY`

A valid event can have unavailable optional evidence. An unmeasured legacy
target produces no location observations. Missing/non-numeric velocity or an
unknown pitch type produces no velocity observations. Fair contact without a
physical truth produces no hard-contact observation. These omissions are not
substituted with guessed facts. A supplied conflicting physical truth is rejected.

## Supported observations and derivations

The following table is also the fixed output order. Missing types are simply
omitted; input property order never determines observation order.

| Type | Production basis / derivation |
| --- | --- |
| `TARGET_HIT` | Measured target error 0 (`hitTarget`) |
| `MISS_HIGH` | Decoded actual vertical is above normalized target vertical |
| `MISS_LOW` | Decoded actual vertical is below normalized target vertical |
| `LARGE_LOCATION_MISS` | Measured target error >= 2 (`missedTarget`) |
| `GOOD_VELOCITY` | Numeric actual velocity >= existing pitch-type baseline |
| `VELOCITY_DOWN` | Numeric actual velocity < existing pitch-type baseline |
| `BATTER_CHASED` | Swing and saved `tacticalFeedback.observableBatterResponse.chased`; only if absent, derive from actual out-of-zone truth |
| `BATTER_TOOK_STRIKE` | Take and actual strike |
| `BATTER_TOOK_BALL` | Take and actual ball |
| `BATTER_SWUNG_IN_ZONE` | Swing and actual in-zone pitch |
| `SWING_MISS` | `swingingStrike`, coherent with swing / contact false |
| `FOUL` | `foul`, coherent with swing / contact true |
| `HARD_CONTACT` | Fair `ballInPlay` / contact true and valid physical continuous contact score >= 0.72 |
| `HARD_CONTACT_ON_LOCATION_MISS` | Hard contact plus measured target error > 0 (near or large miss) |

Location uses `OffensivePlateApproach.decodePitchLocation` and
`normalizeTargetIntent`. The original target-error classification remains
authoritative: 0 hit, 1 near, >=2 missed. Conflicting measured classification
is rejected, not overwritten. No horizontal geometry or target error is
recalculated. Vertical ordering alone yields the descriptive high/low relation.
Actual regions are fixed-RHB-reference; targets are batter-relative. This is
not permission to infer arm/glove side.

Velocity baselines remain owned by `OffensivePlateApproach`. Its previously
private lookup was minimally extracted as `getPitchVelocityBaseline`:
fastball 89, slider 82, changeup 80, curveball 76. Observation references that
helper, not a second constant table. Unknown types return null; production
generation retains its historical 76 fallback. No generation draw or physical
profile calculation changed. `GOOD_VELOCITY` means at/above that baseline, not
good stuff, fatigue, daily form, or a velocity trend.

Hard contact uses `battedBallPhysicalTruth.executionEvidence.continuousContactScore`
and the existing tactical threshold 0.72. Physical normalization, version,
identity, actual-pitch reference, taxonomy, and numeric score are checked.
Evidence retains the physical categorical contact quality and score separately.
Foul/whiff never inherits a fair-BIP contact quality, even if a summary or
tactical flag claims hard contact.

## Unsupported observations and semantic hazards

Not implemented:

- `MISS_ARM_SIDE`, `MISS_GLOVE_SIDE`
- `GOOD_SHAPE`, `NORMAL_SHAPE`, `FLAT_SHAPE`
- `BATTER_EARLY`, `BATTER_ON_TIME`, `BATTER_LATE`
- Day/pitch form, shape today, command trend, PA-wide pitching strategy

`pitch.pitchQuality` is command/class realization, not stuff or pitch shape.
`controlRealization.realizationQuality` is class-control execution;
`locationRealization.executionClassification` includes geometry and class
distance. They are not collapsed into a new `locationQuality`.
Timing window/roll describes execution-window success, not early/on-time/late.
The existing narrow `lateSwingObservable` remains solely a tactical observable.
Movement labels do not support shape observations. Target intent, intended
class, and catcher recommendation never substitute for actual zone truth.

## Purity, integration, and persistence

There are no RNG calls, identity draws, clocks, random fallbacks, source writes,
or downstream simulation calls. Repeated calls have identical values and order.
The browser only loads the API after its owners; production does not auto-consume
the observations. Tactical integration, UI, match logic, and save normalization
are unchanged.

Observations are **derived from persisted canonical truth**. Do not save a second
observation authority. Live history and completed copies are reprojected after
load. A later Sequence State layer may consume these immutable facts while
retaining pitch identity and evidence; sequence aggregation and tactical
interpretation remain a separate future sprint and must not rewrite source truth.

## Validation and production witness

New tests:

- `node tests/pitch-observation-foundation-test.js`: 22 targeted tests, covering
  every required observation, exclusions, boundaries, rejection, ordering,
  copied evidence, determinism, no mutation, and guarded dependency access.
- `node tests/pitch-observation-production-integration-test.js`: 7 tests across
  five genuine UI/admission-driven matches. Take and swing ON/OFF arms compare
  the entire match and RNG cursor; observation calls prohibit RNG and compare
  player state before/after. A live multi-pitch save boundary and finished-copy
  reload both reproject identically. Real compressed NPC events are rejected.
- `node tests/pitch-velocity-baseline-extraction-test.js`: 24 fixed cases compare
  full generated pitch truth and settlement against baseline commit
  `5937fe5298a8a4779a9127889cfaf388e8707cca`, including override and unknown types.

Affected regression covers target-location foundation and save integration,
plate decision foundation/production, offensive PA foundation and semantics,
pitch sequencing, tactical integration, and physical BIP foundation/production.
All ten suites passed (317 assertions): target location 13 + 2, plate decision
19 + 15, offensive PA 136 + semantics 20, sequencing 26, tactical integration
34, and physical BIP 39 + 13. The new suites passed 22 + 7 tests and the
baseline extraction passed all 24 comparisons.

One genuine player PA from the integration harness (`hs-y1-autumn-exhibition`,
first player moment, inning 1 bottom) produced the following witness. The seed
is only a reproducible test choice, not a production observation requirement.
All four pitches were fastballs and player actions were Take.

| Pitch | Target (away / middle) | Actual | Result / count after | Observations |
| --- | --- | --- | --- | --- |
| 1 | strike | outer-middle | calledStrike / 0-1 | TARGET_HIT, GOOD_VELOCITY, BATTER_TOOK_STRIKE |
| 2 | chase | middle-middle-ball | ball / 1-1 | GOOD_VELOCITY, BATTER_TOOK_BALL |
| 3 | strike | outer-middle | calledStrike / 1-2 | TARGET_HIT, GOOD_VELOCITY, BATTER_TOOK_STRIKE |
| 4 | strike | outer-middle | calledStrike / 1-3 | TARGET_HIT, GOOD_VELOCITY, BATTER_TOOK_STRIKE |

Pitch 2 has an unmeasured legacy location fallback: the existing target is not
permission to invent a miss measurement. The harness reports 13 take-arm and
26 swing-arm observation calls, zero RNG draws and source mutations, and 48
compressed NPC events rejected without fabricated pitch history/count.
