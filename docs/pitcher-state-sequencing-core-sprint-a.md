# Pitcher State & Sequencing Core — Construction Sprint A

## Canonical causality

```text
Game / PA Context
→ match-local Mental State
→ match-local Process State
→ Strategic Pitch Distribution
→ immutable Frozen Distribution
→ Intended Pitch Class
→ Control Realization
→ Actual Pitch Class
→ existing Recognition / Swing-Take / Contact / PA Resolution
```

Mental State never maps directly to a pitch result or PA outcome. Response Profile affects a deterministic Mental Transition; the resulting Mental dimensions feed Process dimensions. Strategic distribution reads count, short recent sequence, limited runner/leverage context, previous PA result, and Process dimensions. It does not read the batter's Plate Approach. Sampling intent and realizing control are separate deterministic steps.

## Match-local contracts

Mental State v1 stores `arousal`, `confidence`, `cognitiveLoad`, and `resultAttachment`. Provisional fixtures provide only `pressureProcessing`, `failureResponse`, and `responsibilityStyle`; they are not career Personality state. Process State stores `rhythm`, `aggression`, `tempo`, and `precisionIntent`. Any `processLabel` is a read-only debug interpretation and is never used by the resolver.

Mental stimulus names are an exact canonical vocabulary. Unsupported strings, known-event typos, `null`, `undefined`, and empty strings are rejected as deterministic no-ops: Mental and Process state remain unchanged, no RNG is consumed, and transition evidence records `normalizedStimulus: null`, `transitionApplied: false`, and `reason: unsupportedStimulus`. The resolver never guesses a nearest baseball event or falls back to `hit`.

The opponent pitcher runtime used by the current player-batting path is match-local. Its control value is an explicit fixture capability because the current opponent roster has no persistent pitching capability schema. When a Player Truth pitcher is supplied, callers must pass `player.baseballSkills.control`; no Mental or Process transition mutates that value. `precisionIntent` increases target difficulty rather than capability.

## Pitch intent and realization

The five existing semantic Pitch Classes remain authoritative. Count is the primary strategy modifier: 0-2 expands edge/chase intent, 3-0 increases zone-oriented challenge intent, and 3-2 remains mixed. Every distribution is normalized, frozen, auditable, and sampled with the `pitcher-sequencing-core-a-v1` deterministic namespace.

Control Realization compares authoritative control with target difficulty and process stability. The topology preserves adjacent misses as more likely than distant misses without becoming uniform at low control or perfect at high control. `intended clearBall → actual clearBall` is recorded as intentional; `edgeStrike → clearBall` is execution drift. Likewise, an intentional `hitterPitch` challenge is not a missed target. Later offensive outcomes cannot mutate intent, actual class, or realization evidence.

## Integration and persistence

`OffensivePlateApproach.generatePitchOpportunity()` is now a compatibility wrapper. In the production load order it delegates to Pitch Sequencing Core; its old classifier remains only as a legacy fallback for isolated environments where the module is not loaded. Explicit pitch overrides remain deterministic test fixtures. The resulting actual class is adapted to the existing pitch profile and passed unchanged into Recognition, Swing/Take, Contact, and PA accounting.

The PA pending-pitch snapshot persists its frozen distribution, intended pitch, control realization, actual class, and debug trace. Match save normalization also preserves current Mental/Process state, response fixture, previous PA result, recent sequence, and the bounded debug trace. No player-facing UI is added.
