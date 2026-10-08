# Pitch Sequence State Foundation v0.1

## Purpose and architectural position

Answer: what objective observations have accumulated so far in this player PA?
Do not answer: what should the next pitch be?

```text
Production pitchHistory -> Pitch Observation -> Pitch Sequence State
                                                |
                              future Tactical Interpretation (not implemented)
```

Sequence State is fact aggregation, bounded sequence memory, and deterministic
derivation. It is not a tactical decision, rating, prediction, or UI model.
Production Observation baseline: `a0e512b439446990d8df118e3e7d737b9f2f51d3`.

## Canonical input and APIs

Module: `pitch-sequence-state-foundation.js`.
Browser global / CommonJS export: `PitchSequenceStateFoundation`.

Exports:

```js
VERSION // "pitch-sequence-state-foundation-v0.1"
RECENT_WINDOW // 3
createInitialSequenceState(paIdentity)
appendPitchObservation(previousState, observedPitch)
build(observedPitches)
```

`observedPitch` is the **complete supported wrapper** returned by
`PitchObservationFoundation.observePitch`, not a bare observation array or raw
pitch event. `build` accepts the ordered full PA prefix beginning at pitch 1;
it uses the same append reducer as incremental construction. Empty `build([])`
is unsupported because no PA identity is available. An explicitly identified
zero-pitch state is available through `createInitialSequenceState`.

Only wrapper identity/count metadata and each observation's type, source, and
identity are read. The evidence must be an object, but its contents are never
read, classified, copied, or retained. The Observation owner supplies the enum
and version/source constants; the reducer never calls `observePitch` itself or
any production helper. The caller owns canonical provenance; structural
validation is not authentication of arbitrary fabricated objects.

Only a player detailed PA is supported. Raw terminal PA summaries, compressed
NPC Observation results, MatchGameRecord refs, mixed PAs, and partial histories
cannot be substituted with invented pitches.

## Complete supported state schema

```js
{
  supported: true,
  version: "pitch-sequence-state-foundation-v0.1",
  paIdentity,
  pitchCount,
  lastPitchId,       // null initially
  lastPitchNumber,   // null initially
  currentCount: { balls, strikes },
  lastPitch: { // null initially
    pitchId, pitchNumber, observationTypes: []
  },
  recentPitches: [ /* same minimal schema as lastPitch, last 3 only */ ],
  location: {
    targetHits, missHigh, missLow, largeMisses,
    measuredPitches, unobservedPitches
  },
  batterResponse: {
    totalTakes, totalSwings, unobservedResponses,
    tookStrike, tookBall, chased, swungInZone, swingMiss, foul, hardContact
  },
  contact: { swingMisses, fouls, hardContacts, hardContactsOnLocationMiss },
  velocity: { goodVelocityCount, velocityDownCount, unobservedPitches },
  sequence: {
    consecutiveTakes, consecutiveSwings, consecutiveChases,
    consecutiveCalledStrikes, consecutiveTargetHits,
    consecutiveSwingMisses, consecutiveVelocityDown
  }
}
```

The initial count is 0-0 and counters are zero. Each appended `countBefore`
must equal the prior `currentCount`; `currentCount` then copies `countAfter`
verbatim. No ball/strike settlement is recalculated from observation types.
Terminal count values (four balls or three strikes) are retained, not clamped.

PA identity is protected throughout. Pitch IDs follow the accepted Observation
identity convention `${paIdentity}|pitch-N`. Numbers must be contiguous; input
is not sorted. An earlier pitch number is rejected as a duplicate even if it
has fallen outside the recent window. No unbounded seen-ID history is needed.

Unsupported result: `{ supported: false, version: VERSION, reason }` with no
partial state, fake pitch count, or fabricated recent pitches. Reasons:

- `DEPENDENCIES_UNAVAILABLE`
- `INVALID_PLAYER_PA_IDENTITY`
- `EMPTY_OR_INVALID_SEQUENCE`
- `UNSUPPORTED_OBSERVED_PITCH`
- `INVALID_OBSERVED_PITCH`
- `UNKNOWN_OBSERVATION_TYPE`
- `INVALID_OBSERVATION_IDENTITY`
- `DUPLICATE_OBSERVATION_TYPE`
- `CONFLICTING_OBSERVATIONS`
- `INVALID_PREVIOUS_STATE`
- `PA_IDENTITY_MISMATCH`
- `DUPLICATE_PITCH`
- `PITCH_ORDER_DISCONTINUITY`
- `COUNT_ALREADY_TERMINAL`
- `COUNT_DISCONTINUITY`

## Aggregates and evidence availability

Named counters increment once per pitch containing the corresponding enum.
Multiple location or swing observations on one pitch do not inflate the
distinct-pitch counts. Duplicate types reject instead of double counting.
Unknown types reject; they are never assigned guessed semantics.

`totalTakes` counts pitches with either took-strike or took-ball.
`totalSwings` counts the union of chased, swung-in-zone, swing-miss, foul, hard
contact, and hard-contact-on-miss observations. These are **observed** response
counts, not a new action authority. If no response type exists, the pitch adds
to `unobservedResponses`; absence is never converted into take or swing.

`location.measuredPitches` is the distinct-pitch count carrying at least one
of TARGET_HIT / MISS_HIGH / MISS_LOW / LARGE_LOCATION_MISS. It is **not a claim
about all raw production measurements**. A horizontal near miss can have a
production target error without any of these four types. This reducer does not
inspect the raw error to fill that contract gap. `unobservedPitches` means no
location type is available, not proof that production was physically unmeasured.
No type means no target hit or miss count. HARD_CONTACT_ON_LOCATION_MISS remains
a contact fact; it does not invent a generic location type or a large miss.

Velocity counters only consume GOOD_VELOCITY and VELOCITY_DOWN. No baseline,
speed, threshold, or trend is re-derived. Missing velocity types add only to
`velocity.unobservedPitches`.

Hard-contact counters consume their observation types directly. No score or
threshold is reread. Contact state is not a fair-BIP history owner.

The formal wrapper has no general `pitchType` metadata. Pitch-type repetition
is intentionally not implemented; velocity evidence is not repurposed to fill
missing metadata. The Observation contract is unchanged.

## Streak and recent-window semantics

Each streak counts the trailing contiguous run of pitches containing its fact.
Took-strike and took-ball both sustain consecutive takes. Any swing fact
sustains consecutive swings. A pitch without the tracked fact resets its streak
to zero, including unavailable observations; this is an observed run, not an
inference about hidden behavior. Consecutive called strikes means successive
BATTER_TOOK_STRIKE observations, not all strikes.

`RECENT_WINDOW = 3` limits only `recentPitches`. PA-wide totals and streaks can
exceed three. Minimal entries retain identity, number, and enum-ordered types,
not evidence, target geometry, velocity, pitch type, or full production objects.

Syntactically contradictory observations reject (e.g. took-strike plus took-ball,
take plus swing facts, chased plus swung-in-zone, high plus low miss, hit plus miss, good plus down velocity,
whiff/foul plus hard contact). Hard-on-miss must include HARD_CONTACT. There is
no raw-truth arbitration or recomputation of Observation semantics.

## Purity, immutability, and non-interpretation

No RNG, deterministic identity draw, clock, random fallback, mutable global PA
access, or simulation helper exists. Every output is a recursively frozen fresh
copy of the known schema. Appending never writes to or freezes input wrappers,
prior state, PA history, tactical state, or counts. Unknown input fields are not
propagated. Browser and CommonJS produce identical results.

No strategy/recommendation, psychology, evaluation, day form, stuff, fatigue,
shape, directional swing timing, or next-pitch labels are produced. In particular,
observed chase/take/velocity-down counts do not imply impatience, passivity,
tiredness, confidence, or a recommended next pitch. Existing tactical feedback,
recommendations, and weighting remain unchanged and do not consume this API.

## Save/load and future handoff

Sequence State is derived, not persisted. Rebuild using:

```js
const projections = persistedPitchHistory.map(PitchObservationFoundation.observePitch);
const state = PitchSequenceStateFoundation.build(projections);
```

Live `offensivePlateAppearanceState.pitchHistory`, completed moment copies, and
`lastOffensiveResolution.pitchHistory` remain the sole persisted source. No save
schema or core lifecycle modification is needed. The browser merely loads the
foundation after Observation; consumption occurs only in tests this sprint.

Future Tactical Interpretation can consume these immutable observed counts and
minimal ordered recent facts, respecting unavailable evidence and PA boundaries.
That separate layer must own interpretation and decisions; it must not make this
reducer regenerate pitches or rewrite production truth.

## Validation results and witness

New suites:

- `node tests/pitch-sequence-state-foundation-test.js`: 25/25. Covers all 16
  required gates, bounded history, unavailable facts, 100-repeat determinism,
  guarded owner access, raw/evidence access traps, browser parity, count/identity
  protection, duplicates, contradictions, immutable copies, and every-prefix
  incremental vs full rebuild.
- `node tests/pitch-sequence-state-production-integration-test.js`: 8/8 across
  five real UI/admission-driven matches (take OFF/ON/reload and swing OFF/ON).
  No injected pitch truth or forced role/capability. Every actual prefix compares
  incremental build, full rebuild, and browser/CommonJS. Entire match/tactical
  state/GameRecord/RNG are identical with sequence projection ON/OFF. Live reload
  explicitly discards derived memory and rebuilds from persisted history; finished
  copies rebuild identically. All 48 real compressed NPC events reject.

Regression: Observation foundation 22/22, Observation production 7/7, velocity
baseline extraction 24/24 comparisons, tactical integration 34/34, plate-decision
production 15/15, target-location save production 2/2. Existing Observation,
offensive PA, sequencing, tactical integration, save, and script source files
are compared against the formal baseline and remain identical.

Witness PA: `hs-y1-autumn-exhibition|hs_y1_match_moment_1|player|1|下`.
This is a test seed witness, not a hardcoded production outcome requirement.
G = GOOD_VELOCITY, H = TARGET_HIT, TS = BATTER_TOOK_STRIKE, TB = BATTER_TOOK_BALL.

| Pitch | Types | Pitch count | Current count | Takes/swings streak | Target hits | Large misses | Chases | Whiffs | Hard contacts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | H, G, TS | 1 | 0-1 | 1 / 0 | 1 | 0 | 0 | 0 | 0 |
| 2 | G, TB | 2 | 1-1 | 2 / 0 | 1 | 0 | 0 | 0 | 0 |
| 3 | H, G, TS | 3 | 1-2 | 3 / 0 | 2 | 0 | 0 | 0 | 0 |
| 4 | H, G, TS | 4 | 1-3 | 4 / 0 | 3 | 0 | 0 | 0 | 0 |

Pitch 2 has no location observation and adds only to unobserved location pitches.
The take arm makes 13 sequence calls and swing arm 26. RNG draws, source mutations,
and previous-state mutations are all zero; incremental/rebuild and reload gates pass.
