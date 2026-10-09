# Decision -> Production Candidate Adapter Foundation v0.1

## 1. Baseline and audit origin

Validated on 2026-10-09 (Asia/Taipei), branch `main`.
HEAD and origin/main both remain
`9b9546f94a7286afef474be634fd93c57eb455db`
(`feat: establish pitch tactical decision foundation`).

Audit verdict: `RELATED_BUT_DIFFERENT_AUTHORITY`. Decision's deterministic
current-PA pattern priority proposes a purpose. Production's
`PitcherCatcherTacticalIntegration.chooseTacticalIntent` owns the final intent,
using weighted selection, count, cognitive load, command drift, previous
feedback, recent cross-PA history, failure guards, and identity-derived sampling.
These are different authorities; a foundation proposal cannot replace selection.

Structural discovery used codebase-memory search, caller/callee trace, snippets,
and exact-path coverage checks. The existing index reported changed metadata;
the relevant current source and boundary call sites were read directly. This is
a bounded audit of the adapter, tactical owner, OPA next-pitch boundary, and test
harness; it makes no repository-wide completeness claim.

## 2. Files changed

| File | Change |
|---|---|
| `pitch-tactical-decision-production-adapter.js` | New pure browser/CommonJS adapter |
| `pitcher-catcher-tactical-integration.js` | Exact repeat eligibility extraction plus read-only export |
| `index.html` | Load adapter immediately after Decision; no gameplay consumer |
| `tests/pitch-tactical-decision-production-adapter-test.js` | Unit contract, access/RNG/mutation traps |
| `tests/pitch-tactical-decision-production-adapter-integration-test.js` | Genuine next-pitch shadow comparisons, ON/OFF, reload, witnesses |
| `tests/pitch-tactical-selector-equivalence-test.js` | Baseline/extracted selector equivalence |
| `tests/pitch-tactical-selector-extraction-baseline.cjs` | Historical baseline loader and exact extraction source guard |
| `tests/pitch-tactical-decision-production-integration-test.js` | Permit only the exact canonical extraction in existing source guard |
| `tests/pitch-tactical-interpretation-production-integration-test.js` | Same narrow source guard update |
| `tests/pitch-sequence-state-production-integration-test.js` | Same narrow source guard update |
| `docs/pitch-tactical-decision-production-adapter-v0.1.md` | Contract and final report |
| `docs/pitch-tactical-decision-production-adapter-v0.1-validation.json` | Actual machine-readable validation results |

All other guarded production/Foundation sources remain baseline-identical.
The three older regression guards still compare all source text, allowing only
the exact extraction/export delta in the tactical owner. They do not waive
selection behavior or any unrelated edit.

## 3. Canonical production vocabulary

The adapter directly reads `PitcherCatcherTacticalIntegration.TACTICAL_INTENTS`.
It does not declare another four-intent enum or create semantic aliases.
Decision's version, source, and intent metadata remain owned by Decision.
`resetNeutral` stays foundation-only and is never added to the production enum.

## 4. Formal adapter API and input

Browser: `PitchTacticalDecisionProductionAdapter.adapt(decisionResult, productionBoundary)`.
CommonJS: `require("./pitch-tactical-decision-production-adapter.js")`.
VERSION: `pitch-tactical-decision-production-adapter-v0.1`.

```js
// Boundary constructed by the test-only caller at an actual pending pitch.
const productionBoundary = {
  paIdentity: state.paIdentity,
  pitchCount: state.pitchHistory.length, // completed detailed pitches N
  tacticalContext: state.pendingPitch.pitchTacticalState.context // pitch N+1
};
const shadow = PitchTacticalDecisionProductionAdapter.adapt(
  decisionResult, productionBoundary
);
```

The adapter consumes only Decision's supported/version/source/paIdentity/
pitchCount/selectedIntent projection. It validates that metadata and recognized
selected intent; it does not enumerate or inspect candidates, their reasons,
Interpretation evidence, Sequence counters, or raw pitchHistory. Candidate order
and the reasoning that produced selectedIntent stay with Decision.

The boundary supplies explicit completed-pitch count independently of the
bounded cross-PA tactical feedback history. `tacticalContext` is the canonical
context from the existing production tactical decision. The adapter only reads
its version, PA, next-pitch index, and, for repeat only, the existing eligibility
helper's previousFeedback fields. It never rebuilds tactical context itself.

## 5. Candidate output and final-intent authority

```js
{
  supported: true,
  version: "pitch-tactical-decision-production-adapter-v0.1",
  paIdentity: "match|pa|player|1|top",
  pitchCount: 2,
  status: "candidate",
  candidateIntent: "challenge",
  decisionIntent: "challenge",
  reasonCodes: ["CANONICAL_PRODUCTION_CANDIDATE"],
  provenance: {
    decisionVersion: "pitch-tactical-decision-v0.1",
    decisionIntent: "challenge"
  }
}
```

Supported abstention has `status: "abstain"`, `candidateIntent: null`, and the
original decisionIntent/provenance. Structural rejection has supported:false,
version, reason, status:"abstain", candidateIntent:null, and reasonCodes:[reason].
It carries no partial identity, intent, or provenance. All output is detached
and deeply immutable. No score, weight, probability, recommendation, target,
physical pitch, or execution field is emitted.

The candidate does not control `chooseTacticalIntent`, change weights, supply
intentOverride, or select a production outcome. The runtime only exposes the API;
the shadow consumer exists exclusively in the integration test.

## 6. Candidate and abstention rules

| Selected Decision intent | Boundary/eligibility | Result |
|---|---|---|
| `resetNeutral` | Valid matching boundary | Abstain: `NEUTRAL_DECISION_ABSTENTION` |
| Canonical simple intent | Valid matching boundary | Candidate with unchanged canonical name |
| `repeatSuccess` | Canonical production eligibility true | Candidate `repeatSuccess` |
| `repeatSuccess` | Canonical production eligibility false | Abstain: `REPEAT_SUCCESS_NOT_PRODUCTION_ELIGIBLE` |
| Unknown selected intent | Any | Unsupported: `UNKNOWN_PRODUCTION_INTENT` |

Neutral does not map to challenge and never reaches a recommendation default.

## 7. RepeatSuccess eligibility reuse/extraction

The existing selector had no separately reusable eligibility helper. The exact
previousFeedback expressions were extracted as
`PitcherCatcherTacticalIntegration.getRepeatSuccessEligibility(context)`.
It returns `{ repeatFailed, repeatEligible }`, reads only prior canonical feedback,
and performs no weighting, history traversal, sampling, or mutation.
Both selector and adapter use this helper; there is no adapter copy of the rule.

Eligibility retains the baseline expressions: prior recommendedPitchClass is
present, prior observable response chased or whiffed, and a prior repeatSuccess
with observable hard contact has not triggered failure. Failure still adds the
same changeLook weight in production. Called strikes alone do not establish
repeat eligibility. Hard contact on another prior intent does not invent a
broader failure guard. Even sparse raw-input undefined/truthy behavior is retained.

## 8. Identity and pitch boundary contract

Decision and boundary identities must be nonempty five-part player PA identities.
Their PA values and the canonical context PA must match. Decision/boundary
pitchCount must be nonnegative safe integers; context pitchIndex must be a
positive safe integer. Context version must match the production owner.

```text
Decision completed pitches N == productionBoundary.pitchCount
productionBoundary.pitchCount == tacticalContext.pitchIndex - 1
```

Thus the candidate refers to production pitch N+1. The tests independently check
the live state's pitchNumber equals its completed detailed history length.
Empty prefix uses the existing explicit initial Sequence state for that PA;
its Decision is neutral. Non-neutral zero-pitch decisions reject.

Rejections: `DEPENDENCIES_UNAVAILABLE`, `TACTICAL_INTENT_AUTHORITY_CONFLICT`,
`UNSUPPORTED_DECISION`, `DECISION_VERSION_MISMATCH`, `INVALID_DECISION_WRAPPER`,
`UNKNOWN_PRODUCTION_INTENT`, `INVALID_PRODUCTION_BOUNDARY`,
`PA_IDENTITY_MISMATCH`, `PITCH_BOUNDARY_MISMATCH`.
Structural mismatch stays separate from supported semantic abstention.

## 9. No second-choice promotion

If selected repeatSuccess fails canonical eligibility, the adapter abstains even
when Decision retains expand as another candidate. It never reads alternatives
or sorts/promotes them. Selecting a runner-up would require an arbitration policy.

## 10. Natural production witnesses

All matches use the established normal UI admission and choice harness, without
writing capabilities, tactical intents, pitch truth, or recommendations. Seed
440000 covers take and contactSwing. Bounded contactSwing search additionally
uses 440001, 440002, 440003, 440010, 440100, and 441000. Each ON run has a paired
OFF run; take also has a live-reload run: 17 complete matches in total.

| Natural output | Seed/policy | PA / completed pitches -> next pitch | Existing final intent |
|---|---|---|---|
| challenge candidate | 440000 / take | hs_y1_match_moment_1, inning 1 bottom / 2 -> 3 | challenge |
| expand candidate | 440000 / contactSwing | hs_y1_match_moment_1, inning 1 bottom / 3 -> 4 | challenge |
| repeatSuccess candidate | 440001 / contactSwing | hs_y1_match_offense_2, inning 3 bottom / 2 -> 3 | expand |
| resetNeutral abstention | 440000 / take | hs_y1_match_moment_1, inning 1 bottom / 0 -> 1 | challenge |
| changeLook candidate | Not naturally observed in this bounded run set | Covered by unit contract only | No injected witness |

Full PA identities and witness diagnostics are in the validation JSON.
48 genuine compressed NPC events from the primary match reject throughout the
foundation chain; no detailed history or candidate is fabricated for them.

## 11. Shadow comparison and intent breakdown

Each actual next-pitch projection records only diagnostics:
`ADAPTER_ABSTAIN`, `CANDIDATE_MATCHES_PRODUCTION`, or
`CANDIDATE_DIFFERS_FROM_PRODUCTION`.

Across eight distinct ON matches: **82 evaluated, 16 candidates, 66 abstentions,
3 candidate matches, 13 differences, 0 unsupported detailed boundaries**.
Reload/repeated rebuilds are excluded from these counts. All observed abstentions
are neutral; unit fixtures separately cover repeat eligibility rejection.

| Policy | Evaluated | Candidates | Abstentions | Matches | Differences |
|---|---:|---:|---:|---:|---:|
| take | 13 | 7 | 6 | 2 | 5 |
| contactSwing (seven seeds) | 69 | 9 | 60 | 1 | 8 |
| Total | 82 | 16 | 66 | 3 | 13 |

| Adapter candidate | Count | Final challenge | Final expand | Final repeatSuccess | Final changeLook | Matches | Differences |
|---|---:|---:|---:|---:|---:|---:|---:|
| challenge | 7 | 2 | 4 | 0 | 1 | 2 | 5 |
| expand | 8 | 4 | 1 | 0 | 3 | 1 | 7 |
| repeatSuccess | 1 | 0 | 1 | 0 | 0 | 0 | 1 |
| changeLook | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

The validation JSON also separates the primary seed (39 evaluations) from the
six supplementary seeds (43). This is bounded deterministic evidence for future
arbitration design, not a population estimate or a conversion-to-weight contract.

## 12. Determinism, RNG, and mutation

Unit tests adapt every intent 100 times. Browser traps permit only Decision
metadata and the tactical owner's metadata/pure helper. Math.random and the
instrumented tactical identity hash both record zero adapter draws. Getter/Proxy
traps prohibit alternative candidates, upstream reasoning, geometry, enumeration,
selector/recommendation calls, and unnecessary feedback reads for simple/neutral
intents. Output is detached/frozen; mutable input remains unchanged and unfrozen.

Production performs 100 complete rebuilds per observed boundary under Math.random
traps. Eight ON matches plus live reload perform 9,600 rebuilds, with zero RNG,
player, Decision, and production-boundary mutations.

## 13. ON/OFF and selector equivalence

All eight shadow ON/OFF pairs pass whole-match deepEqual, explicit tactical-state
and GameRecord comparisons, and RNG cursor equality.

The dedicated selector regression compares the formal baseline source against
the extracted source in isolated browser VMs:

- 23,040 bounded normalized contexts and 161,280 selector comparisons.
- 429 sparse/raw-input and roll/override/fallback comparisons.
- 48 complete tactical/recommendation/response/sequencing comparisons.
- Weights, eligibility, safeguards, selectedIntent, and outputs are identical.
- Both tactical hash cursors are 69,285; Math.random draws are zero.

The normalized matrix spans all legal balls/strikes, previous intent and
recommendation presence, chase/whiff/hard-contact combinations, repeated-call
lengths, cognitive-load threshold sides, command drift, explicit rolls,
identity-hash selection, and override compatibility. No production rule changes.

## 14. Save/load rebuild and downstream ownership

Live save/load preserves detailed history, tactical feedback history, pending
pitch/context, count, GameRecord, and RNG, then rebuilds the full chain without
derived memory. It finishes with identical match and diagnostics. Every finished
match also reloads and rebuilds all prior candidate boundaries from saved detailed
pitch truth and the saved event's canonical tactical context; the last offensive
resolution is independently checked.

Adapter/Decision/Sequence/Interpretation outputs are never persisted and no save
schema is introduced. The following chain keeps its existing ownership and code:

```text
chooseTacticalIntent -> buildCatcherRecommendation
-> createAutomaticPitcherResponse -> PitchSequencing.createPitchDecision
-> resolvePitchControl -> OPA physical pitch / target realization
```

No recommendation foundation, pitcher disagreement policy, physical profile,
or repertoire policy is introduced.

## 15. Regressions and reproduction

| Suite | Passed |
|---|---:|
| Adapter unit | 22 |
| Adapter production | 11 |
| Selector equivalence | 5 |
| Decision unit / production | 33 / 12 |
| Interpretation unit / production | 24 / 10 |
| Sequence unit / production | 25 / 8 |
| Observation unit / production | 22 / 7 |
| Existing Tactical Integration | 34 |
| Pitch Sequencing Core Sprint A | 26 |
| Plate Decision unit / production | 19 / 15 |
| Total (15 suites) | **273 / 273** |

Run each file listed in validation JSON with `node tests/<file>`; the new suites:

```powershell
node tests/pitch-tactical-decision-production-adapter-test.js
node tests/pitch-tactical-decision-production-adapter-integration-test.js
node tests/pitch-tactical-selector-equivalence-test.js
```

Their final JSON lines expose the actual counts, witnesses, and equivalence
results. No protected smoke test is part of the validation runs.

## 16. Git integrity

No commit, push, or staging was performed. HEAD and origin/main remain the formal
baseline. `tests/fast-check-smoke-test.cjs` remains the existing modified,
unstaged, uncommitted file; it was not read or changed by this sprint.
`install.ps1` remains untracked and was not read, executed, or changed.
Protected-file verification uses their Git status only, honoring the no-read rule.

Both original stash entries and their order remain unchanged:

```text
stash@{0}: 0daf1e954f74ddb45efe620107970567dec6fffd
stash@{1}: 8cc34a930df052067d1bad3ea798fe0b9d2ae036
```

## 17. Future arbitration handoff

```text
Production truth -> Observation -> Sequence -> Interpretation -> Decision
-> Production Candidate Adapter -> shadow candidate / explicit abstention

Existing production tactical context -> existing selector -> final intent
-> existing catcher recommendation -> pitcher response -> PitchSequencing
```

This sprint establishes semantic compatibility, canonical eligibility,
abstention, provenance, and observed disagreement data. It does not assign a
candidate weight/bonus, translate foundation priority to weights, or promote a
runner-up. Intent Arbitration Policy remains deferred to the next authorized
sprint. Human acceptance is the next step; implementation stops here.
