# Architecture Sprint 4.7 — Adult Transition Progression Boundary

## Purpose

Architecture Sprint 4.7 establishes a single write boundary for normal-gameplay advancement through the five-event Adult Transition route. Architecture Sprint 4.6 remains the read authority for the current route and event; Architecture Sprint 4.7 authorizes completion of that event and advances only the existing `transitionStep` field.

Architecture Sprint 4.7 makes the Adult Transition Progression Boundary the sole normal-gameplay owner of transitionStep advancement.

## Progression Mutation Owner

`CareerTransitionProgression.advanceTransition(playerState, completedEventId)` is the only formal mutation API introduced by this Sprint. The former direct `player.transitionStep += 1` write in `script.js` has been removed.

The Architecture Sprint 4.5 initialization write (`transitionStep = 0`) remains outside this responsibility. Debug fixtures may also construct snapshots. Development Years and every youth or high-school progress field remain unchanged.

## Authoritative Current Event

The Boundary calls `CareerTransitionRuntimeResolver.resolveTransitionRuntime(playerState)` and accepts the Resolver's `routeKey`, `transitionStep`, and `eventId` as authoritative.

A transition event may advance progression only when it matches the event currently resolved by Architecture Sprint 4.6.

The Boundary does not inspect `careerExit` and does not maintain a second Adult Transition event registry.

## Choice Preflight

While `player.chapter === "生涯轉換期"`, `choose(eventId, index)` compares its requested `eventId` with `getCurrentEventId()` before event lookup, transition locking, or any Gameplay effect. This preserves the existing runtime precedence of:

1. completed state;
2. `forcedEventId`;
3. chapter routing through the Architecture Sprint 4.6 Resolver.

The preflight applies only to Adult Transition. Other chapters retain their previous behavior.

## Progression Contract

Successful advancement returns a deeply frozen result:

```javascript
{
  status: "advanced",
  advanced: true,
  routeKey,
  completedEventId,
  previousStep,
  nextStep,
  settlementRequired,
  issues: []
}
```

Rejected advancement returns a deeply frozen result with `advanced: false`, null route and step fields, `settlementRequired: false`, and an explanatory issue.

## Authorized Mutation

The only authorized Player mutation is:

```text
transitionStep: previousStep → previousStep + 1
```

The Boundary does not modify chapter, career exit, age, role, results, flags, memories, relationships, body state, narrative state, or UI state.

## Wrong Event Behavior

Missing, unknown, previous, next, or other-route event IDs are rejected whenever they do not equal the current Resolver event. Rejection occurs without throwing and without Player mutation.

## Repeat Event Behavior

After a legal event advances the step, the Resolver identifies the next event. Resubmitting the previous event therefore fails the same equality check naturally. No persistent nonce, token, or completed-event field is added to Player or Save data.

## Forced Event Behavior

An active `forcedEventId` prevents the Boundary from advancing the underlying Adult Transition step. The `choose()` preflight still permits the actual forced event because `getCurrentEventId()` returns it. Existing `resumeAfterPending` handling clears the forced event and returns without calling Adult Transition progression.

## Writable Preflight

Before mutation, `transitionStep` must be an own data property whose descriptor has `writable: true`. Missing, non-writable, accessor, or descriptor-failure states are rejected before assignment. Accessor setters are not invoked.

## Terminal Step Detection

Route identity comes only from the Architecture Sprint 4.6 Resolver. The Boundary then reads the matching route length from `CareerSpineContract.getCareerNetwork()` using that resolved `routeKey`. It does not hard-code step 4 or an event ID as the terminal rule.

When `nextStep` equals the Contract route length, the successful result sets `settlementRequired: true`.

## Settlement Boundary

Settlement remains outside the Progression Boundary.

`advanceAfterAction()` receives the completed event ID, calls the Boundary, and invokes the existing `evaluateCareerTransition()` only after a successful terminal completion. The existing settlement continues to own organization role, transition result and detail, role identity, turning point, career value, and the chapter change to `生涯轉換期小結`.

## Runtime Integration

The browser dependency order is:

```text
CareerSpineContract
→ Graduation Transition Resolver
→ Graduation Transition Commit Boundary
→ Adult Transition Runtime Resolver
→ Adult Transition Progression Boundary
→ Story / Script runtime
```

`choose()` passes its original `eventId` to `advanceAfterAction(decisionContext, eventId)`. The additional parameter is ignored by every non-Adult-Transition branch.

## Zero-Mutation Guarantee

Wrong event, repeated event, missing event, forced state, unresolved runtime state, invalid step, non-writable property, and accessor property are all rejected without throwing. The rejection path does not mutate Player.

## Save Boundary

This Sprint adds no Player field, Save field, migration, version change, or localStorage key. The existing `transitionStep` remains persisted by the existing whole-Player save path.

## Deferred Development Progression

`developmentStep` remains directly advanced by the existing Development Years branch. Architecture Sprint 4.7 does not create a universal progression controller and does not alter the 20–22-year route.

## Test Strategy

The dedicated contract test covers:

- 25 legal combinations across five career exits and five steps;
- non-terminal and terminal progression;
- dual draft exits without rewriting `careerExit`;
- wrong, repeated, forced, missing, unknown, and invalid inputs;
- non-writable and accessor safety;
- deterministic and deeply frozen results;
- choice preflight before effects;
- forced-event continuation without underlying progression;
- settlement exactly once across draft, college, amateur, and rehab routes;
- source-level ownership, dependency, schema, and load-order guards.

Existing resolver, commit, network, route, role, DecisionFlow, callback, storyboard, and vertical-slice tests remain regression coverage for the surrounding architecture.
