# Match Opportunity Structural Completion v1

## Scope

This foundation completes the second-base Match Decision Opportunity path after a player has already entered a game. It does not change Playing-Time Opportunity, lineup role, Game Exposure, development coefficients, or the simulation RNG stream.

```text
Playing-Time Opportunity (can the player enter?)
!=
Match Decision Opportunity (does this live play contain a real baseball tradeoff?)
```

The canonical path is:

```text
Canonical Situation
-> Role Assignment
-> Legal Routes
-> Availability Window
-> Density / Novelty Gate
-> Meaningful Decision
-> Execution / Reassessment
-> Outcome / Experience
```

## Availability and readiness

Availability is derived from runner topology, force state, ball direction/depth, runner speed, and the appropriate timing window. It does not depend on player or teammate ability. A route is viable only when it is legal and its window is not expired.

Readiness is evaluated after availability. Player reaction, range, fielding and throwing affect the high/medium/low readiness description and execution, but do not broadly hide a legal route. Teammate dependency remains separate for routes such as 4-6-3.

Debug route status exposes `legal`, `viable`, `windowState`, `unavailableReason`, and `readiness` independently.

## Second-base route matrix

| Canonical route | Typical topology | Availability window | Player role | Canonical unavailable reason |
| --- | --- | --- | --- | --- |
| `secureFirstBaseOut` | Any handled ground ball | `firstBaseOutWindow` | `primaryFielder` | `firstBaseRouteUnavailable` / `firstBaseWindowExpired` |
| `initiate463` | Runner on first, fewer than two outs, force at second | `doublePlayWindow` | `initiator` | `doublePlayForceUnavailable` / `doublePlayWindowExpired` |
| `coverSecondFor643` | Runner on first; shortstop is primary fielder | `doublePlayWindow` | `coverPivot` | `coverPivotRoleUnavailable` / `doublePlayWindowExpired` |
| `attackLeadRunnerThird` | Runner on second with a live force at third, or a runner actively advancing to third | `leadRunnerThirdWindow` | `initiator` | `thirdBaseOutOpportunityUnavailable` / `thirdBaseWindowExpired` |
| `preventRunHome` | Runner on third breaking home, no home force, fewer than two outs | `homeOutWindow` | `initiator` | `runnerNotBreakingHome` / `homeTagWindowExpired` |
| `homeForceOut` | Bases loaded with a live force at home | `homeOutWindow` | `initiator` | `homeForceUnavailable` / `homeForceWindowExpired` |

`coverSecondFor643` is an execution responsibility, not a primary-fielder choice. It therefore remains execution-only and cannot be inserted into the player Choice UI as a competing route.

## `attackLeadRunnerThird`

The canonical force fixture is 0 outs, runners on first and second, a normal ground ball handled by the second baseman at general depth, and a non-expired third-base window. The generated set contains `secureFirstBaseOut`, `initiate463`, and `attackLeadRunnerThird` when all three windows are viable.

The route remains legally diagnosable when its timing window has expired, but is excluded from player choices with `thirdBaseWindowExpired`. The presentation includes runner movement and the fielder's directional/body read so a missing route has a player-readable cause.

Selecting the route maps uniquely to the 4-5 commitment. Execution follows secure -> transfer -> throw to third -> timing outcome. It does not silently become a throw to first or a 4-6-3 play; only the existing explicit reassessment path may change a route. Third-out finalization continues to own half-inning termination and scoring legality.

## Other rare routes

- `preventRunHome` remains distinct tag-at-home semantics for a third-base runner breaking home without a force.
- `homeForceOut` remains force-at-home semantics for bases loaded.
- `coverSecondFor643` remains the second baseman's cover/pivot execution responsibility after a shortstop fielding play.

All six formal second-base routes now have deterministic reachability fixtures.

## Meaningful Decision gate

A player Decision exists only when at least two viable, non-execution-only choices have different canonical commitments and carry a real tradeoff. A one-route play remains routine and resolves automatically. Variants such as “throw harder” are not manufactured as choices.

Every visible option maps to one canonical route ID and is deduplicated by baseball commitment.

## One-shot replacement and density

The former full-match behavior treated any completed defensive moment as a match-long consumed flag. Playback also only targeted the original scripted defensive phase. The normal gate no longer uses that one-shot state.

The replacement state records:

- defensive meaningful decision count;
- last decision play index and inning/half;
- recent situation and route-set families;
- repetition and suppression counts;
- consecutive decision density;
- selected and final route.

Novelty combines runner topology, outs, player role, ball family/direction, leverage, and the viable route set. An exact repeated opportunity is suppressed inside an eight-play spacing window. At most two meaningful prompts may appear consecutively before a routine-flow beat is required. A count of six remains only as an absolute malformed/runaway safety cap.

This model allows zero-decision games and multi-decision games. It does not set a target number of decisions per game and does not perform final pacing balance.

## Determinism, persistence, and playback

Availability and density are pure derivations from canonical match state and existing simulation-log positions. They do not draw random numbers and do not re-roll the ball in play. Execution continues to consume the established resolver RNG exactly where it did before.

Save normalization preserves route situation truth, density/novelty history, decision count, pending defensive resume state, and selected/final route. Playback restores the phase, moment, and domain that an emergent defensive Decision interrupted, preventing frozen or duplicated decisions and allowing later distinct opportunities.

## Match Experience boundary

The existing second-base Match Experience adapter consumes canonical `route` / `activeRoute` values generically. Deterministic evidence tests cover `attackLeadRunnerThird`, `preventRunHome`, and `homeForceOut`; no coefficient or development mapping change was required.

## Structural audit boundary

The focused suite runs 2,000 deterministic full-game-equivalent second-base opportunity schedules across runner states, outs, ball contexts, roles, route families, density, and novelty. It reports availability, selection, decision distribution, suppression, safety-cap breaches, illegal selections, orphan decisions, freezes, duplicate resolutions, cursor drift, RNG drift, and NaN state.

This is structural validation, not final event-density balance.

## Future reuse

The Situation -> Role -> Availability -> Density -> Decision contract can be reused by future shortstop, first-base, third-base, outfield, pitcher, and catcher opportunity verticals. Those verticals, final event-density tuning, and population balance are explicitly deferred.
