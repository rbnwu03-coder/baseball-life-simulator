# Offensive Plate Approach Foundation v1

## Scope

This foundation replaces the authoritative result package for player-controlled Meaningful Offensive plate appearances. NPC plate appearances continue to use the existing one-step simulator. It does not change offensive admission density, Playing-Time Opportunity, Game Exposure, Match Experience coefficients, Development coefficients, defensive decisions, or the Match Simulation RNG stream.

## Plate Selection and Swing Intent

Plate Selection answers which pitches the player is willing to attack. Swing Intent answers how the player tries to execute after deciding to swing. Neither field is a plate-appearance outcome.

| Existing choice ID | Plate Selection | Swing Intent | Meaning |
|---|---|---|---|
| `aggressiveEarlySwing` | `aggressive` | `power` | Attack hittable pitches early and trade contact margin for extra-base upside. |
| `patientSelection` | `selective` | `normal` | Narrow the attack region, take marginal pitches, and still attack a true hitter's pitch. |
| `compactContact` | `balanced` | `contact` | Use a normal selection baseline and shorten the swing to improve contact and foul survival. |
| `compactLineDrive` | `balanced` | `contact` | The runner-context variant of the same contact intent. |

The legacy IDs remain stable for saves and event contracts. The canonical state stores `approach`, `selectionProfile`, and `swingIntent` separately.

## Selective Is Not Walk

`patientSelection` no longer maps a tier directly to `walk`. Selective hitters have a high swing tendency against `hitterPitch`, a moderate tendency against `competitiveStrike`, and lower tendencies against `edgeStrike`, `chasePitch`, and `clearBall`.

A walk occurs only when the count reaches four balls. A selective hit occurs when the hitter takes pitches outside the selected region, later swings at an attackable pitch, completes contact, and receives a hit result from contact quality.

## Canonical Player PA Pipeline

```text
Approach Package
→ Pitch Opportunity
→ Recognition
→ Swing / Take
→ Count
→ Contact or Pitch Result
→ Repeat
→ PA Result
→ Existing Match Runner-State Application
```

The resolver owns one player Meaningful PA from 0-0 to its terminal result. The Match layer applies that terminal result once.

## Pitch Opportunity

The categorical pitch topology is:

- `hitterPitch`
- `competitiveStrike`
- `edgeStrike`
- `chasePitch`
- `clearBall`

Each opportunity contains `pitchQuality`, `pitchLocationClass`, `recognitionDifficulty`, `attackability`, strike truth, and a player-readable location impression. It does not model XY coordinates, pitch arsenal, catcher game calling, or full pitcher sequencing.

Approach never changes which pitch is generated. It only changes the hitter's response to the generated pitch.

## Determinism and Match RNG Isolation

Pitch opportunities use a stable namespace containing match identity, PA identity, batter identity, inning/half, and pitch number. Swing recognition, contact, foul, and ball-in-play rolls use separate deterministic labels under the same PA namespace.

The player PA resolver does not call `Math.random()` and does not consume Match Simulation RNG. NPC PA simulation and defensive simulation retain their existing RNG authority.

## Recognition

Recognition is derived from existing capability truth:

- `observe`: 45%
- `baseballIQ`: 35%
- `ballSense`: 20%

Recognition changes how accurately the hitter identifies hitter, edge, chase, and clear-ball opportunities. It is not perfect information and does not create a new Vision, Discipline, Power, or Overall skill.

The UI presents a location impression rather than the internal pitch-class identifier.

## Swing / Take and Two-Strike Protection

Aggressive, balanced, and selective profiles have different swing tendencies by perceived pitch class. Aggressive still usually takes a recognized `clearBall`; selective still attacks a recognized `hitterPitch`.

At two strikes, the resolver automatically expands protection:

- `hitterPitch` and `competitiveStrike` approach near-mandatory attack levels.
- `edgeStrike` swing tendency rises materially.
- `chasePitch` protection rises only modestly.
- `clearBall` remains outside normal protection.

This adjustment is stored in pitch history as `protectAdjusted`; it is execution adaptation, not another player choice.

## Contact Execution

Contact execution uses existing `batting` and `ballSense`, pitch attackability, recognition correctness, and Swing Intent.

- `power`: lower contact margin, higher contact-quality and extra-base upside.
- `normal`: neutral contact and quality baseline.
- `contact`: higher contact probability and foul survival, lower extra-base upside.

Swinging does not directly create a hit or out. A successful contact first becomes `foul` or `ballInPlay`; only `ballInPlay` enters the contact outcome resolver.

## Count Rules

- Taken pitch outside the strike zone: `ball`.
- Taken strike: `calledStrike`.
- Missed swing: `swingingStrike`.
- Foul with fewer than two strikes: add one strike.
- Ordinary foul with two strikes: count unchanged.
- Four balls: `walk`.
- Three strikes: `strikeout`.
- Ball in play: `out`, `productiveOut`, `single`, `double`, `triple`, or `homeRun`.

The absolute pitch safety cap is 15 and exists only to terminate malformed or infinite PA states. It deterministically falls back to a ball-in-play result and is not a target PA length.

## PA Result Ownership and Runner Truth

The player Meaningful PA no longer asks the old tier package for a precomputed result. The plate approach resolver returns one terminal canonical result. `applyHighSchoolSimulatedPlateAppearance()` remains the only owner that changes outs, runners, and score for that result.

This preserves:

- bases-loaded walk force advancement;
- productive-out runner movement;
- third-out termination and scoring legality;
- one batting-order advancement;
- one player PA event in the simulation log.

Pitch history never increments Game Exposure plate appearances. One multi-pitch PA remains one PA.

## Save / Reload and Idempotency

`offensivePlateAppearanceState` preserves:

- PA deterministic identity;
- balls and strikes;
- pitch number;
- approach, selection profile, and swing intent;
- pending pitch;
- resolved pitch history;
- recognition and swing summaries;
- terminal result and whether Match truth already applied it.

Reload does not redraw a pending pitch. `resultApplied` prevents double-click or replay from advancing runners or recording the PA twice. Completed legacy PAs are never recalculated. A legacy unfinished player PA without v1 state restarts that unfinished PA deterministically from 0-0 rather than inventing a partial count.

## Match Experience and Development Boundary

Pitch events remain inside the PA state; they are not emitted as separate Match Experience settlements. The completed moment and single plate-appearance event carry aggregated `decisionQuality`, `executionQuality`, `recognitionSummary`, and `swingExecutionSummary`.

One PA therefore produces aggregated evidence once. No Match Experience coefficient, Development coefficient, progress formula, learning multiplier, or skill formula changes in this sprint.

## Presentation and Base-State Wording

The player chooses an approach once per PA. Pitch decisions auto-resolve from the selected profile and current count. The match card shows a B-S count context, while the result explains how the pitch sequence created the terminal result.

With empty bases and a lead, attack wording now refers to challenging the outfield gap or extending the offense. It does not claim that a nonexistent runner can score an insurance run. Selective wording describes narrowing the attack region rather than waiting for a walk; contact wording describes shortening the swing.

## Structural Audit Boundary

The focused suite runs 4,000 deterministic PA samples for each of aggressive, balanced, selective, and contact packages: 16,000 total. It reports walk, strikeout, ball-in-play, hit, extra-base, pitches per PA, swing, chase, called-strike, hitter-pitch take, two-strike protection, and whiff rates, plus NaN, duplicate PA, and RNG drift.

This is structural validation, not final offensive balance.

## Deferred

- full pitcher sequencing and selection AI;
- catcher game calling;
- pitch arsenal and matchup effects;
- advanced strike-zone or XY geometry;
- hit-by-pitch and bunt-foul edge cases;
- mid-PA player strategy reselection;
- final offensive, event-density, and population balance;
- Defensive Outcome Cause Explainability.

## v1.0.1 — Opportunity and Pitch Result Integrity

### Human validation findings

- Selective walk causality passed: four actual balls produce the walk.
- Selective still attacks hittable pitches.
- The two-strike protection adjustment is visible.
- A pitch feed could correctly report `ballInPlay` while the PA headline incorrectly described a called third strike. This B-level presentation mismatch is fixed in v1.0.1.
- A seventh-inning trailing player PA could be auto-resolved after the legacy final offensive slot. This B-level opportunity-admission gap is fixed in v1.0.1.

### Canonical pitch-result presentation

Every pitch now stores explicit action and contact truth beside its canonical result:

| Canonical result | Action | Contact | Presentation authority |
|---|---|---|---|
| `ball` | take | none | taken pitch outside the zone |
| `calledStrike` | take | none | taken pitch called a strike |
| `swingingStrike` | swing | false | swing and miss |
| `foul` | swing | true | contacted foul ball |
| `ballInPlay` | swing | true | contacted ball entering play |

The terminal headline reads the last canonical pitch result. It no longer infers a called strike from `patientSelection`, or ball in play merely from the fact that the hitter swung. Walk, strikeout, and ball-in-play PA results are defensively checked against ball four, strike three, or a terminal `ballInPlay` pitch respectively.

### Offensive opportunity admission

The player batting is first an existing canonical PA. Interactive ownership is then decided through:

```text
Canonical Player PA
→ Opportunity Classification
→ Categorical Leverage
→ Density / Novelty
→ Meaningful Offensive Decision
→ Plate Approach Resolver
```

Classification uses inning, half, the seven-inning regulation boundary, score differential, outs, runner topology, scoring-position state, tying/go-ahead reach, live-game state, and the existence of at least two distinct strategic commitments. It does not use player ability, previous success, or a fixed first/final narrative slot to decide leverage.

Leverage classes are `routine`, `meaningful`, `highLeverage`, and `critical`. A seventh-inning bottom PA down one with a runner in scoring position can be critical; the same inning down one with empty bases can still be high leverage because reaching base affects the tying path. A large deficit or large lead remains routine unless another material context exists. The seventh inning alone never forces a decision.

The density state records offensive decision count, prior player-PA number, recent situation family, novelty key, and suppression counts. A repeated non-critical situation can be softly suppressed. High-leverage and critical contexts override ordinary repetition suppression, and no global one-shot count permanently blocks them. The scripted first and legacy `finalOffense` hooks remain compatible but do not consume a permanent quota.

Pending opportunities persist their classification, leverage, density decision, moment identity, resume phase, and selected approach package. Resolving an interactive PA returns to its saved playback phase, consumes one batting-order position, and applies one canonical runner-state result. Suppressed PAs continue through the existing automatic PA simulator without being simulated twice.

The v1.0.1 structural audit covers 2,000 full-game-equivalent player-participation sequences and reports zero-, one-, and multi-decision games, late and critical admission, routine/repeat suppression, illegal admission, duplicate PA, freeze, cursor drift, RNG drift, and NaN. This is structural validation only, not final offensive event-density balance.

## v1.0.2 — Offensive Player Agency

Human validation found that a canonical seventh-inning player PA could correctly classify as routine and therefore move directly to automatic simulation. The baseball leverage was correct, but it incorrectly answered a separate player-experience question: whether the player wanted to operate a likely final PA personally.

v1.0.2 formally separates:

```text
Strategic Opportunity ≠ Player Agency Opportunity
```

The resulting pipeline is:

```text
Canonical Player PA
→ Strategic Opportunity Evaluation
→ Player Agency Evaluation
→ Participation Choice
   ├─ Play Manually → existing Plate Approach resolver
   └─ Simulate PA   → existing automatic PA simulator
→ canonical Match runner-state pipeline
```

`lateGamePlayerAgency` is true only when the game is live, the player is an active lineup participant, the canonical batting order currently points to the player, and `inning >= regulationInnings`. It does not depend on score differential and never changes the strategic leverage class. A seventh-inning bottom PA down eight can therefore remain `routine` while still presenting agency. The same contract applies to legal extra innings. A terminal game or a PA belonging to another batter never creates agency.

The participation UI contains only `自己打` and `交給模擬`. This is an interface ownership preference, not a character action. Simulation applies no personality, ability, coach-evaluation, Match Experience, or Development penalty.

The manual path forwards the untouched canonical PA to the existing Plate Approach pipeline. The simulate path forwards it once to `resolveSimulatedHighSchoolPlateAppearance()`. Neither path changes the pre-PA score, runners, outs, lineup, playing time, or exposure truth. Both advance the batting order and record the PA exactly once.

`offensivePlayerAgencyState` persists agency identity, reason, status, manual/simulate selection, canonical PA identity, inning/half, player PA number, resume phase, strategic classification, density result, prior playback state, result, and idempotency truth. Reload before selection restores the same participation UI; reload after manual selection preserves the same PA and pending pitch; reload after simulation or completion does not ask or resolve again.

The deterministic agency audit covers 2,000 game-equivalent samples, including seventh and extra innings, routine and meaningful leverage, and both ownership paths. It is structural validation, not final event-density balance.

Known but deferred from this follow-up: Offensive PA Outcome Explainability / Hit-Type Presentation. Single, double, triple, and error-reach presentation may still collapse to generic safe-on-base language; v1.0.2 does not modify it.

## Canonical PA Accounting Integrity Audit

The audit defines a completed canonical player PA as one `simulationLog` `plateAppearance` record whose `batterId` is `player`. This truth is independent of pitch count, decision UI count, key-moment count, outcome, or whether the PA was resolved manually or by the automatic simulator.

All production completion paths converge on the same ownership boundary. The automatic resolver applies the result, records one PA event and one performance-evidence PA, then advances the batting-order cursor once. Scripted first offense, classified meaningful offense, Plate Approach, late-game agency manual, and legacy final offense all converge on `resolveHighSchoolOffensiveDecision`, which applies one completed Plate Approach result, records one meaningful PA event, and advances the cursor once. Late-game agency simulation delegates directly to the automatic resolver. Reloaded manual PA state preserves the same PA identity and cannot record or advance until that PA becomes terminal.

At match settlement, `deriveHighSchoolMatchActualExposure` independently counts completed player PA records after the player's entry sequence. `finalizeHighSchoolGameExposure` stores that actual count. Match Experience receives the finalized Game Exposure value, and Match Development Settlement Presentation renders `matchExperience.exposure.plateAppearances`. Decision count and participation-choice count are never used as PA accounting sources.

Deterministic fixtures cover all-automatic, mixed ownership, three meaningful decisions within four PA, a ten-pitch PA, walk, strikeout, ball in play, 2-2 save/reload, late-game agency manual, late-game agency simulation, and substitute partial appearance. A 2,000-game-equivalent accounting audit produced zero canonical/exposure/display mismatches, duplicate or skipped PA, duplicate batting-order advancement, cursor drift, freeze, RNG integrity error, or NaN state. No production fix was required: the human-validation value of four PA is structurally plausible and the existing accounting chain already uses canonical actual participation truth.

## Offensive Feedback & Outcome Presentation Integrity Fix

Root-cause inspection found two presentation ownership gaps. `formatHighSchoolOffensivePlayerFacingResult()` received the canonical terminal PA result but its label map omitted `triple` and `homeRun`, while `single` used only a generic hit label. Those results therefore fell through to a generic ending sentence and left runner-state presentation such as safe on base to carry information it did not own. Separately, `resolveHighSchoolOffensiveDecision()` selected the offensive coach response from the derived strong/mixed/failure tier alone. A four-take walk has no swing evidence but can have weak execution quality under the existing quality summary, so the generic failure template falsely described slow action.

The player-facing result now maps the existing canonical result directly: `single` → 一壘安打, `double` → 二壘安打, `triple` → 三壘安打, `homeRun` → 全壘打, `walk` → 四壞保送, and `strikeout` → either called-third-strike or swing-and-miss semantics from the final canonical pitch. No result is inferred from the player's ending base. `out` and `productiveOut` retain their existing out truth. The repository has no offensive Plate Approach terminal `reachOnError`, `fielderChoice`, or `sacrifice`, so this fix does not invent those categories.

Single-PA execution and coach feedback now use a deterministic, read-only evidence pipeline:

```text
Decision Quality
→ Recognition Summary
→ Swing / Take Evidence
→ Contact Evidence
→ Canonical Outcome Context
→ Feedback Attribution
```

Execution text describes approach, recognition, take/swing, or contact process; the result text owns the canonical baseball outcome. A no-swing PA cannot receive swing-timing criticism, and a no-contact PA cannot receive contact-quality criticism. Recognition language is emitted only from recorded pitch/recognition evidence. A good decision followed by an out can be evaluated as sound process with an unsuccessful result; a chase misread followed by a lucky hit can still be identified when the canonical evidence records it. If the evidence does not support a more specific statement, the coach uses the neutral fallback: `教練記下這次進攻打席的選擇與結果，後續仍會持續觀察。`

The resolved moment, canonical meaningful PA event, and last offensive resolution persist the derived feedback. The immediate result renderer receives that single-PA feedback explicitly, preventing a later generic match-level string from changing its attribution. Presentation formatters consume no Match RNG and mutate no match, score, runner, Experience, or Development state. Whole-game evidence aggregation remains deferred; this pass does not redesign the match-level evaluator.

Focused fixtures cover every supported terminal result, selective four-ball discipline, called and swinging strikeouts, good-decision/bad-outcome separation, poor-decision/lucky-hit separation, first-pitch aggressive success, compact-contact foul extension, reload determinism, Match RNG isolation, Match Truth immutability, and canonical PA accounting. A 3,000-sample deterministic presentation audit reports zero hit-type mismatch, strikeout-semantic mismatch, feedback-attribution mismatch, no-swing violation, no-contact violation, RNG drift, or NaN. The existing 2,000-game canonical/Game Exposure/settlement PA accounting audit remains at zero mismatch.

## Final Closeout Audit Notes

The production diff was audited against Capability, School Invitation, Development coefficients, Playing-Time formulas, Game Exposure probability, defensive route legality, second-base availability, third-out scoring, runner conservation, coach evaluator architecture, position evaluation, and unrelated random namespaces. No unrelated production change was found. The Foundation reads existing offensive capability values but does not change their formulas. Match Experience and Development keep their existing aggregation and coefficients.

A repository search for the human observation that the first meaningful defensive event often appears in the second inning found no `inning === 2` gate, directly scripted second-inning defensive decision, hidden inning preference, or one-shot routing leakage in this Foundation. Statistical timing analysis and calibration remain deferred under Defensive Decision Temporal Clustering Audit.

Direct Start retains initialized canonical capability and defensive skill state through the existing Capability Foundation settlement. No missing defensive-skills object, null capability, or zero-initialization regression was found. Lower Direct Start capability and its effect on execution success remain balance context, not a closeout defect.

The complete deferred freeze is:

- Offensive Pitch / Count Distribution Calibration;
- Final Offensive Event Density;
- Defensive Decision Temporal Clustering;
- Defensive Outcome Cause Explainability;
- In-Game Coach Reassessment & Substitution;
- Whole-Game Coach Evidence Aggregation;
- Direct Start Capability Balance;
- High School Population & Capability Balance;
- Full Pitcher Sequencing;
- Catcher gameCalling;
- Pitch Arsenal Matchup;
- Advanced Strike-Zone Geometry;
- HBP;
- Bunt Edge Cases;
- Mid-PA Strategy Changes;
- Skill Mastery / Peak Expression;
- Youth Soft Branching / Seeded Divergence.
