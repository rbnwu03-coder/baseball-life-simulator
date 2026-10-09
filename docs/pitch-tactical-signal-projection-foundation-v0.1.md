# Typed Tactical Signal Projection Foundation v0.1

Date: 2026-10-09. Baseline: `main`, HEAD = origin/main = `674e49115a9ed7d67c69a3023b5a594d41fe584c` (`docs: establish tactical intent semantic contract`).

Status for the four supported signals: **READY_FOR_FUTURE_INJECTION_RESEARCH**.

## 1. Purpose

At a trusted live current-PA boundary after N completed pitches, expose the parallel typed facts already established by Interpretation that are temporally available for N+1. This Foundation neither chooses an intent nor changes gameplay. Runtime gameplay changes = 0.

```text
Production pitch truth -> Observation -> Sequence -> Interpretation -> Signal Projection
                                                                        SHADOW ONLY

Production tactical context -> chooseTacticalIntent -> final intent -> catcher recommendation
```

The two chains have no signal-injection connection.

## 2. Layer ownership

| Owner | Responsibility |
| --- | --- |
| Production detailed pitch history | Persisted physical and observable response truth |
| PitchObservationFoundation | Classify a completed detailed pitch |
| PitchSequenceStateFoundation | Accumulate current-PA observed facts |
| PitchTacticalInterpretationFoundation | Own pattern thresholds, evidence and Interpretation vocabulary |
| OffensivePlateApproach PA state | Own PA identity, completed pitch boundary, count and lifecycle truth |
| PitchTacticalSignalProjectionFoundation | Validate supplied metadata and temporal alignment; retain ready facts |
| PitcherCatcherTacticalIntegration | Own production context, cross-PA tactical memory and final intent selection |

The existing Decision and Production Adapter APIs remain separate. Neither supplies signal input.

## 3. Canonical input

```js
PitchTacticalSignalProjectionFoundation.project(interpretationWrapper, liveBoundary)
```

Interpretation must be a supported wrapper with the existing owner VERSION, a valid five-component player PA identity, a nonnegative safe integer `pitchCount`, and an `interpretations` array. Each item supplies its known `type`, `scope: "CURRENT_PA"`, owner `source`, and nonempty `reasonCode`.

The projector reads this metadata only. It never reads item `evidence`, raw `pitchHistory`, Observation events, Sequence counters, Decision results, Adapter candidates, production intent, recommended class, target, physical pitch or tactical history. An N=0 wrapper cannot contain patterns. Duplicate types and Strong without Present are rejected as inconsistent owner metadata; the existing Interpretation contract always supplements Present with Strong.

The caller supplies exactly this boundary data from the existing PA state:

```js
{
  paIdentity: state.paIdentity,
  completedPitchCount: state.pitchHistory.length,
  pitchNumber: state.pitchNumber,
  completed: state.completed,
  awaitingDefense: state.awaitingDefense,
  result: state.result,
  balls: state.balls,
  strikes: state.strikes
}
```

Building Observation/Sequence/Interpretation and copying PA metadata belong to the caller. The projector itself has no PA-history dependency.

Structural validation cannot authenticate provenance. A caller can fabricate aligned metadata; it must use actual owner state. Tests distinguish explicit unit fixtures from genuine normal-UI evidence. No new lifecycle authority or pattern inference is introduced.

## 4. Live-boundary contract and output API

A supported live boundary requires:

```text
same paIdentity
interpretation.pitchCount === completedPitchCount === pitchNumber === N
completed === false
awaitingDefense === false
result === ""
0 <= balls < 4
0 <= strikes < 3
```

Flags must be booleans, result must be a string, counts must be integers in the owner's full terminal-inclusive ranges (balls 0..4, strikes 0..3), and pitch counts must be nonnegative safe integers. N+1 must remain a safe integer.

Supported output:

```js
{
  supported: true,
  version: "pitch-tactical-signal-projection-v0.1",
  paIdentity,
  completedPitchCount: N,
  nextPitchNumber: N + 1, // null for postPa
  status: "live",       // "postPa" for terminal evidence
  signals: [
    {
      type: "takePattern",
      scope: "CURRENT_PA_NEXT_PITCH_SIGNAL",
      sourceInterpretations: ["TAKE_PATTERN_PRESENT"],
      strength: "present"
    }
  ],
  deferredInterpretations: [],
  source: "pitchTacticalSignalProjectionV1"
}
```

`live` means SUPPORTED_LIVE_SIGNALS, including a valid empty array. `postPa` means POST_PA_EVIDENCE and always has `signals: []` and `nextPitchNumber: null`. Structural failures produce UNAVAILABLE:

```js
{ supported: false, version: "pitch-tactical-signal-projection-v0.1",
  status: "unavailable", reason: "PA_IDENTITY_MISMATCH", signals: [] }
```

Failure reasons are `DEPENDENCIES_UNAVAILABLE`, `UNSUPPORTED_INTERPRETATION`, `INTERPRETATION_VERSION_MISMATCH`, `INVALID_INTERPRETATION_WRAPPER`, `UNKNOWN_INTERPRETATION_TYPE`, `INVALID_INTERPRETATION_ITEM`, `DUPLICATE_INTERPRETATION_TYPE`, `INCONSISTENT_TAKE_PATTERN`, `INVALID_LIVE_BOUNDARY`, `PA_IDENTITY_MISMATCH`, and `PITCH_BOUNDARY_MISMATCH`. Structural failures are checked before terminal classification.

Exports are `VERSION`, `SOURCE`, `SIGNAL_TYPES`, `DEFERRED_INTERPRETATIONS`, and `project`. CommonJS and browser global `PitchTacticalSignalProjectionFoundation` follow the existing Foundation wrapper convention.

## 5. Supported signal vocabulary and mapping

| Existing Interpretation metadata | Typed signal | Additional field |
| --- | --- | --- |
| TAKE_PATTERN_PRESENT | takePattern | strength = present |
| TAKE_PATTERN_PRESENT + TAKE_PATTERN_STRONG | one takePattern | strength = strong |
| CALLED_STRIKE_PATTERN_PRESENT | calledStrikePattern | none |
| CHASE_PATTERN_PRESENT | chasePattern | none |
| SWING_MISS_PATTERN_PRESENT | swingMissPattern | none |

`sourceInterpretations` preserves applicable type names in a fixed order. Strong and Present never compete as separate signals. Strength is the owner's qualitative distinction; it is neither confidence nor a score.

## 6. Deferred interpretations

These known owner types stay supported as input but appear only in `deferredInterpretations`, in this fixed order:

1. `REPEATED_TARGET_HITS`
2. `VELOCITY_DOWN_PATTERN`
3. `LOCATION_MISS_PUNISHED`

All eight current Interpretation types are accounted for by supported mappings or this list. Unknown types reject explicitly. A wrapper containing only deferred types can be supported with an empty signal array. Deferred metadata remains diagnostic even for postPa output; it never grants next-pitch availability.

No `repeatExecutionPattern`, `locationMissPunished`, `targetHitPattern`, or `velocityDownPattern` signal exists. Repeated execution and repeated tactical calls still have a semantic gap; location-miss punishment still has terminal evidence limitations. This Sprint does not redefine either.

## 7. Parallel facts and no intent selection

Fixed serialization order is `takePattern`, `calledStrikePattern`, `chasePattern`, `swingMissPattern`, independent of input order. This order carries no tactical priority. Every ready fact survives, including Take + Called Strike and Chase + Swing Miss.

There is no winner, primary signal, candidate, intent, confidence, score, weight, probability or priority. Called Strike does not imply challenge; Chase and Swing Miss do not imply expand or repeatSuccess. Unit tests verify all 120 permutations of the five ready Interpretation types while reversing deferred metadata order.

## 8. No production authority or loading changes

The new module exposes a Foundation API. `index.html` is unchanged. Integration tests explicitly load the source into the existing browser VM harness; gameplay has no consumer.

Production selector, catcher recommendation, pitcher response, PitchSequencing, loading/save sources and save schema are unchanged. The integration suite compares twelve existing source files against the formal baseline. Selector equivalence also preserves weights, eligibility, selected intent, full downstream chain and hash cursor.

No signal -> weight, intent, candidate, veto, override or recommendation connection exists. Decision.selectedIntent and Adapter candidates are not consumed by this module.

## 9. Terminal/post-PA exclusion

After structural alignment, any `completed`, `awaitingDefense`, nonempty `result`, four balls or three strikes produces `postPa`, empty signals and no next pitch number. A still-present pattern does not establish signal availability.

PA lifecycle metadata is copied from the existing owner. In particular, `OffensivePlateApproach.createPlateAppearanceState` normalizes a `Pending` result to awaitingDefense, and `resolveNextPitch` returns no event for completed or awaiting-defense states. The projector does not resolve defense or reopen a PA.

Natural evidence: 16 completed PAs, including 3 terminal BIPs and 6 terminal PAs still containing TAKE_PATTERN_PRESENT, all produce postPa/empty. Unit cases separately cover each terminal gate, including Strong Take and combined ready patterns. Terminal historical reconstruction uses genuine persisted completed pitch history and the owner normalizer; paResult is used solely as a closure marker, without evaluating success or damage.

## 10. Cross-PA reset

N=0 on a new PA yields supported live/empty output. No prior signals are stored or copied. The projector never reads `sequenceHistory`, `previousFeedback` or production tactical memory.

All 16 naturally reached fresh PAs have empty Interpretation and signal arrays, including fresh boundaries with retained production cross-PA history. Old PA metadata supplied alongside a different new PA identity rejects.

## 11. Determinism, RNG and mutation

Projection performs zero Math.random, tactical hash or game RNG draws and reads no clock. One hundred repeated unit projections are deeply equal. Browser dependency traps allow only the Interpretation VERSION/SOURCE/type list and reject access to Observation, Sequence, Decision, Adapter, Tactical Integration, game RNG and hash surfaces.

Inputs are neither changed nor frozen. Output objects, arrays, vocabulary and API are detached and deeply frozen. Copied source type names cannot change when mutable inputs are later edited. Getter/Proxy guards prohibit numeric evidence, unrelated fields and input enumeration; production guards prohibit pending N+1 truth and future outcome reads. Host/browser source snapshots and game RNG cursors remain identical.

## 12. Save/rebuild

No projection is persisted. Rebuild the completed truth -> Observation -> Sequence -> Interpretation -> Projection chain after loading.

The save/load route uses seed 440000/take. A live save/reload preserves the actual PA history, pending pitch, tactical state, count, GameRecord, RNG and full rebuilt chain. Both normally reached finished matches reload identically. Their 25 recorded historical live prefixes rebuild the same signals as the original live captures; terminal projections rebuild identically as postPa/empty.

Historical live prefix replay verifies an already observed boundary. It does not make a finished PA live for a new gameplay pitch. Saved player checks reject projection VERSION/SOURCE, Interpretation wrappers and signal metadata, and the unchanged `save.js` requires no schema addition.

## 13. Future signal-injection boundary

The four signals are **READY_FOR_FUTURE_INJECTION_RESEARCH** only. A separate authorized Sprint must design any injection policy, production context interactions and acceptance criteria. No injection or arbitration implementation is started here.

Raw Sequence requirements would indicate STOP_INTERPRETATION_CONTRACT_GAP; an absent trusted PA owner would indicate STOP_LIFECYCLE_AUTHORITY_GAP; inability to separate terminal evidence would indicate STOP_TEMPORAL_BOUNDARY_GAP; a required production selector change would indicate STOP_RUNTIME_POLICY_REQUIRED; repeat/changeLook redefinition would indicate STOP_SEMANTIC_SCOPE_EXPANSION. None was necessary for this API.

## 14. Natural witnesses and bounded route

Predeclared legal routes are 440000/take, 440001/contactSwing and 440003/powerSwing, with at most two normally reached matches each, 120 UI continuation actions between matches and 5000 match actions. No intent, recommendation, pitch truth, roster or capability is injected; no result-driven seed search is performed.

The routes reach `hs-y1-autumn-exhibition` and `hs-y1-followup-evaluation-2`: 6 ON matches and 6 OFF matches, 51 live boundaries.

| Signal | Natural live boundaries | First witness: seed / policy / PA identity | N -> N+1 |
| --- | ---: | --- | --- |
| takePattern | 13 | 440000 / take / `hs-y1-autumn-exhibition\|hs_y1_match_moment_1\|player\|1\|下` | 2 -> 3 |
| calledStrikePattern | 5 | 440000 / take / `hs-y1-autumn-exhibition\|hs_y1_match_offense_3\|player\|4\|下` | 3 -> 4 |
| chasePattern | 1 | 440001 / contactSwing / `hs-y1-followup-evaluation-2\|hs_y1_match_moment_3\|player\|6\|下` | 2 -> 3 |
| swingMissPattern | 7 | 440001 / contactSwing / `hs-y1-autumn-exhibition\|hs_y1_match_offense_2\|player\|3\|下` | 2 -> 3 |

ON/OFF whole matches, tactical state, GameRecord, full player and RNG cursors are deeply identical. The reload route also finishes with the same matches, captures and RNG.

## 15. Coverage gaps

The bounded route reports:

- `COVERAGE_GAP: NATURAL_TERMINAL_BIP_WITH_READY_PATTERN`: all 3 natural BIPs are terminal/empty, but none has a ready Interpretation pattern. The 6 natural terminal Take-pattern witnesses prove pattern persistence with postPa exclusion separately; unit fixtures cover combined ready patterns on terminal/Pending owner states.
- `COVERAGE_GAP: NATURAL_DEFERRED_LOCATION_MISS_PUNISHED`: no natural witness appears. Explicit unit metadata fixtures verify recognized deferral with no signal, including a fabricated live boundary. This is not evidence that such a live production boundary is reachable.

All four supported signals have natural witnesses. No two-match progression gap is observed. Deferred repeated-target-hit and velocity-down metadata are naturally observed. Unit fixture evidence is never reported as natural production evidence.

## 16. Validation

| Suite | Passed | Failed |
| --- | ---: | ---: |
| Signal Projection foundation | 34 | 0 |
| Signal Projection production integration | 14 | 0 |
| Semantic boundary | 16 | 0 |
| Semantic evidence integration | 10 | 0 |
| Interpretation foundation / production | 24 / 10 | 0 |
| Sequence foundation / production | 25 / 8 | 0 |
| Observation foundation / production | 22 / 7 | 0 |
| Decision foundation / production | 33 / 12 | 0 |
| Adapter unit / production | 22 / 11 | 0 |
| Existing Tactical Integration | 34 | 0 |
| Selector equivalence | 5 | 0 |
| **Total: 16 suites** | **287** | **0** |

All exit codes are zero. New projection unit/integration checks report zero RNG draws, input mutations and future outcome reads. Selector equivalence covers 23040 contexts, 161280 comparisons, 429 raw comparisons and 48 full-chain comparisons; hash cursors remain 69285/69285.

## 17. Git integrity and acceptance boundary

Only these four Sprint files are added:

- `pitch-tactical-signal-projection-foundation.js`
- `tests/pitch-tactical-signal-projection-foundation-test.js`
- `tests/pitch-tactical-signal-projection-production-integration-test.js`
- `docs/pitch-tactical-signal-projection-foundation-v0.1.md`

No existing production source is modified. Stage remains empty; no commit or push is performed. HEAD and origin/main remain the formal baseline pending human acceptance.

Protected `tests/fast-check-smoke-test.cjs` remains modified/unstaged/uncommitted and is not read or changed. Protected `install.ps1` remains untracked and is not read, run or changed. The two existing stash hashes remain `0daf1e954f74ddb45efe620107970567dec6fffd` and `8cc34a930df052067d1bad3ea798fe0b9d2ae036`.
