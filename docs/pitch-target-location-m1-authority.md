# M1-A — pre-implementation authority trace

Baseline: main, HEAD = origin/main = f916faf955b3d07f213d90dfd59ef16ac0638f6c; 0/0; initially clean. Both stashes preserved. This trace was recorded before production edits.

Production chain: script.ensureHighSchoolOffensivePlateAppearanceState → prepareHighSchoolPlateDecision → PlateDecisionFoundation.prepare → OffensivePlateApproach.prepareNextPitch/generatePitchOpportunity → PitcherCatcherTacticalIntegration.createTacticalPitchDecision → buildCatcherRecommendation/createAutomaticPitcherResponse → PitchSequencing.createPitchDecision/resolvePitchControl → OffensivePlateApproach.completePitchTruth/getPitchPhysicalProfile → getRecognitionResult → PlateDecisionFoundation.resolve → resolveNextPitch → recordPitchTacticalFeedback → script.syncHighSchoolPitcherTacticalState.

| Fact | Producer | Canonical owner | Consumer | Current status |
| --- | --- | --- | --- | --- |
| Pitch type intent | getPitchPhysicalProfile deterministic type selection or explicit pitch override | physical preparation | velocity/movement profile | Existing derived intent; tactical layer recommends class, not new pitch types |
| Target intent | buildCatcherRecommendation, accepted by createAutomaticPitcherResponse | pitcherResponse.targetLocation (abstract target) | debug/feedback; only class drives current physical profile | existing partial field |
| Control | script.ensureHighSchoolPitcherRuntimeState from active roster pitchingProfile.control × 2 | PitchSequencing runtime.control (0–20), existing process precision/rhythm/tempo | resolvePitchControl | Single reconciled authority |
| Actual class | resolvePitchControl | controlRealization.actualPitchClass → physical pitch.pitchLocationClass | recognition, swing/take, feedback | Production connected |
| Actual location | completePitchTruth/getPitchPhysicalProfile | physical pitch.location string category | feedback; recognition currently consumes class rather than geometry | Single authority; fixed class mapping is the gap |
| Velocity | getPitchPhysicalProfile existing type profile + identity variation | physical pitch.velocity | recognition/timing | Connected; preserve |
| Movement | getPitchPhysicalProfile existing type mapping | physical pitch.movement | recognition/timing | Connected; preserve |
| Recognition | getRecognitionResult | recognition/perceivedPitch snapshot | PlateDecisionFoundation context, swing tendency | Uses actual physical class/velocity/movement/quality, no hidden target input |
| Swing/take | resolveNextPitch, getSwingExecutionProfile | pitch event/count/PA state | PA settlement | Existing engine; preserve |
| Feedback | recordPitchTacticalFeedback/normalizeFeedback | tacticalSequenceHistory | buildTacticalContext / next recommendation | Already has target label, actual class/location and observable response |

Design: extend the existing physical producer, no second pitch engine. Admit the existing abstract target as batter-relative semantic TargetIntent. Keep location as a categorical string; extend its vocabulary with coarse side/height/zone bands, preserving legacy categories for fallback/fixtures. A documented categorical adapter decodes the single location value; class/strike are consistent projections, not competing random location owners. No continuous coordinates or pixel geometry. TARGET_GEOMETRY_LIMITED: coarse categories cannot represent exact edge distance, backdoor trajectory or tunneling.

Reuse resolvePitchControl's actual class, realizationStability, distribution and roll. Conditional residual within the selected class interval supplies location-direction variation without an extra RNG draw; no new control rating/table. Recognition can expose only perceived realized-region cues, never target. Extend existing feedback with target-versus-location evidence. Missing target/control follows explicit legacyLocationFallback. NPC compressed PA untouched.
