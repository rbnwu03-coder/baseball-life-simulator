# Pitch Tactical Decision Foundation v0.1

## Purpose and architecture

Production -> Observation -> Sequence State -> Tactical Interpretation -> Decision Intent

Decision expresses a proposed tactical purpose for the next pitch. It does not
choose a pitch class, physical pitch type, target, or execution. The browser loads
this API immediately after Interpretation. No production consumer is connected.

## Bounded production vocabulary audit

Baseline: main, ac53bf61964bde4b40501c77e15269bae99b55cc.

Audit verdict: REUSE_EXISTING_INTENT_VOCABULARY.

The inspected scope is intent names, selection/priority, and recommendation mapping
in pitcher-catcher-tactical-integration.js and pitch-sequencing.js. Graph tools and
coverage checks returned Transport closed; the audit uses current source reads.
No graph completeness claim or repository-wide audit is made.

PitcherCatcherTacticalIntegration.TACTICAL_INTENTS is the canonical owner of:
challenge, expand, repeatSuccess, changeLook. Its chooseTacticalIntent performs
context-dependent weighted selection, using explicit roll or identity-derived
sampling. There is no canonical fixed conflict priority to inherit. The order of
its enum is a weighted sampling traversal order, not a descending priority.

Existing mapping, audited but not invoked by this foundation:

| Canonical intent | Existing recommendation behavior |
|---|---|
| challenge | Compatible hitterPitch / competitiveStrike preference |
| expand | Compatible edgeStrike / chasePitch preference |
| repeatSuccess | Prior recommended/actual class and prior target |
| changeLook | Different class topology look, subject to compatibility |

PitchSequencing owns pitch classes and physical control realization, not another
tactical-intent vocabulary. No new ATTACK_ZONE/EXPAND_ZONE aliases are introduced.
The foundation reuses challenge/expand for these purposes, and reuses the other
two exact canonical names. It accesses only the static TACTICAL_INTENTS export;
no production context, selection function, scoring, or mapping is consumed.
If required canonical names disappear, decisions reject with
TACTICAL_INTENT_AUTHORITY_CONFLICT instead of falling back to a second taxonomy.

Production repeatSuccess eligibility requires a prior recommendation and a
chase/whiff response, unless an observed repeat failure disables it. Decision
cannot read prior recommendation or production feedback. Its repeat candidate is
therefore only a foundation proposal supported by REPEATED_TARGET_HITS plus
CHASE_PATTERN_PRESENT or SWING_MISS_PATTERN_PRESENT. It does not assert that the
production recommendation is repeatable or that production would accept it.
Target hits alone and target hits plus called strikes do not establish this
candidate. Called-strike-only support is deferred to preserve the audited
chase/whiff success semantics. No production repeat eligibility is changed.

resetNeutral is a new inert fallback marker for this foundation only; production
has no neutral intent. It is not added to the canonical production enum and has
no recommendation mapping. Future integration must explicitly handle it.

## Formal API and canonical input

Browser: `PitchTacticalDecisionFoundation.decide(interpretationWrapper)`

CommonJS: `require("./pitch-tactical-decision-foundation")`

- VERSION: `pitch-tactical-decision-v0.1`
- SOURCE: `pitchTacticalDecisionV1`
- INTENT_PRIORITY: immutable ordered intent names.
- Only runtime input: supported output of PitchTacticalInterpretationFoundation,
  version `pitch-tactical-interpretation-v0.1`.

Decision reads supported, version, paIdentity, pitchCount, interpretations, and
item type/scope/source/reasonCode metadata. Identity must be a five-part player
PA with nonempty parts; pitchCount must be a nonnegative safe integer. A
zero-pitch wrapper must have no interpretations. Items must have recognized type,
CURRENT_PA scope, canonical Interpretation source, and a nonempty reasonCode.
Duplicate types are explicitly rejected. Pattern evidence values are never read,
and pattern thresholds and combinations within Interpretation are not revalidated.
The upstream owner is responsible for establishing those patterns.

Static dependencies are Interpretation.VERSION/SOURCE/INTERPRETATION_TYPES and
Tactical.TACTICAL_INTENTS. No upstream projection or production method is called.
These exports are vocabulary metadata, not additional runtime evidence inputs.

## Decision output and provenance

```js
{
  supported: true,
  version: "pitch-tactical-decision-v0.1",
  paIdentity: "match|pa|player|1|top",
  pitchCount: 2,
  selectedIntent: "challenge",
  candidates: [{
    intent: "challenge",
    reasonCodes: ["TAKEN_PITCH_PATTERN_SUPPORTS_CHALLENGE"],
    interpretationTypes: ["TAKE_PATTERN_PRESENT"]
  }],
  source: "pitchTacticalDecisionV1"
}
```

Candidate provenance retains only triggering interpretation type names in the
Interpretation owner's canonical order. It does not copy interpretation objects,
numeric evidence, raw pitch facts, or recommendation objects. Multiple triggers
for the same candidate are combined into one candidate. Every candidate carries
an explicit rule reason code. All returned objects and arrays are immutable and
owned by the call; mutable input remains unchanged and unfrozen.

Unsupported output has supported: false, version, reason, and candidates: [].
It has no selected intent or partial candidates. Reasons:
DEPENDENCIES_UNAVAILABLE, TACTICAL_INTENT_AUTHORITY_CONFLICT,
UNSUPPORTED_INTERPRETATION, INTERPRETATION_VERSION_MISMATCH,
INVALID_INTERPRETATION_WRAPPER, UNKNOWN_INTERPRETATION_TYPE,
INVALID_INTERPRETATION_ITEM, DUPLICATE_INTERPRETATION_TYPE.

## Interpretation-to-candidate matrix

| Interpretation support | Candidate | Reason code |
|---|---|---|
| TAKE_PATTERN_PRESENT, TAKE_PATTERN_STRONG, or CALLED_STRIKE_PATTERN_PRESENT | challenge | TAKEN_PITCH_PATTERN_SUPPORTS_CHALLENGE |
| CHASE_PATTERN_PRESENT or SWING_MISS_PATTERN_PRESENT | expand | RESPONSE_PATTERN_SUPPORTS_EXPANSION |
| LOCATION_MISS_PUNISHED | changeLook | LOCATION_MISS_PUNISHED_SUPPORTS_CHANGE_LOOK |
| REPEATED_TARGET_HITS AND (CHASE_PATTERN_PRESENT or SWING_MISS_PATTERN_PRESENT) | repeatSuccess | TARGET_HITS_WITH_CHASE_OR_WHIFF_SUPPORT_REPEAT |
| No eligible candidate | resetNeutral | NO_ACTIONABLE_INTERPRETATION |

REPEATED_TARGET_HITS alone and VELOCITY_DOWN_PATTERN alone are nonactionable.
There is no fatigue or ability inference. Fallback provenance is [] because no
interpretation triggered an actionable candidate; the reason code explains why.
LOCATION_MISS_PUNISHED is a PA-wide interpretation, not necessarily the latest
pitch. Its candidate does not manufacture a recency claim or permanent strategy.

## Deterministic conflict priority

changeLook > repeatSuccess > expand > challenge > resetNeutral

Candidates are sorted by INTENT_PRIORITY; selectedIntent is the first candidate.
No scores, probabilities, weighting, RNG, or sampled tie-break exist. Input order
cannot affect candidate order, type provenance, or selected intent.

This is an explicit v0.1 foundation policy, not a replacement for the existing
production weighted selector. The bounded reachability audit of Decision and
Tactical Integration confirms that production allows repeatSuccess after an
eligible chase/whiff response and can select it while expand is also eligible.
Its recommendation reuses the prior class/target, whereas expand is a generic
expansion plan. Production does not impose an expand-before-repeat priority and
does not test repeated target execution; that additional fact remains this
foundation's eligibility condition.

repeatSuccess is a more specific intent than generic expand
when both repeated target execution and eligible batter-response
success interpretations are present.

Accordingly the specific candidate precedes generic expand; changeLook still
wins. Both candidates and their provenance are retained. The existing production
weighted selector and recommendation mapping remain unchanged. resetNeutral
appears only as the sole fallback candidate.

The unit contract explicitly proves that all four canonical production intents
can be selected from supported upstream Interpretation outputs, with neutral
fallback tested separately. Chase/whiff without target hits still selects expand;
target hits with chase or whiff selects repeatSuccess. Called strikes alone or
with target hits do not change the audited repeat eligibility.

## Hard boundaries and future recommendation handoff

Decision never reads Sequence State, Observation, pitchHistory, count geometry,
raw pitch/location, pitchType, targetIntent, contactQuality, or numeric
Interpretation evidence. It never checks consecutiveTakes or any other threshold.
Unit getter/Proxy traps forbid these accesses, wrapper enumeration, upstream
owner calls, and production state access.

No output pitch class, physical pitch type, target coordinates, recommended target,
velocity, location, zoneIntent, scoring model, or psychology trait exists.
challenge, expand, repeatSuccess, and changeLook are purpose names only. The module
never invokes buildCatcherRecommendation or chooseTacticalIntent. Existing
production intent selection, recommendation mapping, pitch sequencing, anti-repeat,
and feedback state remain unchanged.

A future Recommendation layer must separately authorize policy integration and
own pitch-class/target mapping, compatibility, and physical selection handoff.
The neutral marker and foundation repeat proposal require an explicit adapter;
this foundation does not provide one. No consumer, tactical redesign, UI, or
narrative change is part of this Sprint.

## Determinism, mutation, production projection, and save/load

Unit tests decide the same input 100 times, test 134 permutations across conflict and reachable-repeat
inputs, trap browser Math.random, and check detached immutable output.
Only static vocabulary exports can be accessed on dependency proxies.

The production test uses normal admission/UI choices and genuine detailed player
PAs. A test-only resolution wrapper projects Observation -> incremental/rebuilt
Sequence -> Interpretation -> Decision after each real pitch. It compares
browser/CommonJS results and reversed interpretation order. It rebuilds
Sequence -> Interpretation -> Decision 100 times per prefix under an RNG trap.
It snapshots player, observations, previous/current Sequence, and Interpretation.

Five matches cover take OFF/ON/reload and swing OFF/ON. Whole match deep equality
includes existing tactical state and GameRecord; RNG cursor equality is separate.
All Interpretation, Sequence, Observation, OPA, tactical integration, sequencing,
save.js, and script.js sources are guarded against baseline ac53bf6.
48 genuine compressed NPC events remain unsupported throughout the chain.

Decision is derived only and is never written to player or a save schema.
Live reload checks canonical history, pending pitch, count, record, and RNG,
discards derived Sequence memory, and resumes with an identical final result.
Finished persisted copies rebuild equally through the complete chain:

persisted pitchHistory -> Observation -> Sequence -> Interpretation -> Decision

## Actual production witness

PA: hs-y1-autumn-exhibition|hs_y1_match_moment_1|player|1|下

| Pitch | Interpretations | Decision candidates | Selected intent |
|---|---|---|---|
| 1 | none | resetNeutral | resetNeutral |
| 2 | TAKE_PATTERN_PRESENT | challenge | challenge |
| 3 | TAKE_PATTERN_PRESENT, TAKE_PATTERN_STRONG | challenge | challenge |
| 4 | TAKE_PATTERN_PRESENT, TAKE_PATTERN_STRONG, CALLED_STRIKE_PATTERN_PRESENT, REPEATED_TARGET_HITS | challenge | challenge |

This table reports the actual deterministic witness, not a required hardcoded
production response. Candidate challenge is projected but never consumed.

## Validation

Decision unit: 33/33. Decision production: 12/12.

Take ON: 13 projections / 1,300 rebuilds. Swing ON: 26 projections / 2,600 rebuilds.
RNG draws, production source mutations, previous-state mutations, Sequence
mutations, and Interpretation mutations are all zero. Incremental/rebuild,
ON/OFF equivalence, and live/finished save reload pass.

Affected regressions: Interpretation unit/production 24/10; Sequence 25/8;
Observation 22/7; existing Tactical Integration 34; Plate Decision 19/15.
All eleven suites, including Decision, pass: 209/209 tests.
