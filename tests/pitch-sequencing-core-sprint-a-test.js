const assert = require("assert");
const fs = require("fs");
const path = require("path");
const PitcherMentalState = require("../pitcher-mental-state.js");
const PitcherProcessState = require("../pitcher-process-state.js");
const PitchSequencing = require("../pitch-sequencing.js");
const OffensivePlateApproach = require("../offensive-plate-approach.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const sum = distribution => Object.values(distribution).reduce((total, value) => total + value, 0);
const process = PitcherProcessState.createProcessState({ rhythm: 62, aggression: 52, tempo: 54, precisionIntent: 55 });
const zeroTwo = PitchSequencing.freezePitchDistribution(PitchSequencing.buildStrategicPitchDistribution({ balls: 0, strikes: 2 }, process));
const threeZero = PitchSequencing.freezePitchDistribution(PitchSequencing.buildStrategicPitchDistribution({ balls: 3, strikes: 0 }, process));
const threeTwo = PitchSequencing.freezePitchDistribution(PitchSequencing.buildStrategicPitchDistribution({ balls: 3, strikes: 2 }, process));

verify("1. Same Ability / Different Count：0-2 提高 edge + chase tendency", zeroTwo.finalFrozenDistribution.edgeStrike + zeroTwo.finalFrozenDistribution.chasePitch > threeZero.finalFrozenDistribution.edgeStrike + threeZero.finalFrozenDistribution.chasePitch);
verify("2. Same Ability / Different Count：3-0 提高 challenge tendency", threeZero.finalFrozenDistribution.hitterPitch + threeZero.finalFrozenDistribution.competitiveStrike > zeroTwo.finalFrozenDistribution.hitterPitch + zeroTwo.finalFrozenDistribution.competitiveStrike);
verify("3. 3-0 並非 deterministic strike shortcut", threeZero.finalFrozenDistribution.chasePitch > 0 && threeZero.finalFrozenDistribution.clearBall > 0);
verify("4. 0-2 並非 deterministic chase shortcut", zeroTwo.finalFrozenDistribution.hitterPitch > 0 && zeroTwo.finalFrozenDistribution.competitiveStrike > 0);
verify("5. 3-2 保持五種 class 非零混合分布", PitchSequencing.PITCH_CLASSES.every(pitchClass => threeTwo.finalFrozenDistribution[pitchClass] > 0));
verify("6. Frozen distribution normalization = 1 且無負數／NaN", [zeroTwo, threeZero, threeTwo].every(item => Math.abs(sum(item.finalFrozenDistribution) - 1) < 1e-8 && Object.values(item.finalFrozenDistribution).every(value => Number.isFinite(value) && value >= 0)));

const approachA = PitchSequencing.freezePitchDistribution(PitchSequencing.buildStrategicPitchDistribution({ balls: 1, strikes: 1, approach: "aggressiveEarlySwing" }, process));
const approachB = PitchSequencing.freezePitchDistribution(PitchSequencing.buildStrategicPitchDistribution({ balls: 1, strikes: 1, approach: "patientSelection" }, process));
verify("7. Player Approach 無法修改 frozen pitch distribution", JSON.stringify(approachA) === JSON.stringify(approachB));
verify("8. Frozen distribution immutable 且 sampling 為獨立步驟", Object.isFrozen(approachA) && !Object.hasOwn(approachA, "intendedPitchClass") && PitchSequencing.sampleIntendedPitchClass(approachA, { roll: 0.5 }).intendedPitchClass.length > 0);
verify("9. 相同 context／seed identity 重跑完全一致", JSON.stringify(PitchSequencing.createPitchDecision({ paIdentity: "repeat", pitchNumber: 1, balls: 1, strikes: 1, pitcherRuntime: { control: 8, processState: process } })) === JSON.stringify(PitchSequencing.createPitchDecision({ paIdentity: "repeat", pitchNumber: 1, balls: 1, strikes: 1, pitcherRuntime: { control: 8, processState: process } })));

const initialMental = PitcherMentalState.createMentalState({ arousal: 55, confidence: 52, cognitiveLoad: 50, resultAttachment: 48 });
const controlTruth = 9;
const simplifyRuntime = PitchSequencing.createPitcherRuntimeState({ control: controlTruth, mentalState: initialMental, responseProfile: "simplifyReset" });
const elaborateRuntime = PitchSequencing.createPitcherRuntimeState({ control: controlTruth, mentalState: initialMental, responseProfile: "elaborateInternalize" });
const simplifyAfter = PitchSequencing.advancePitcherRuntimeState(simplifyRuntime, "consecutiveWalk", { paResult: "walk" });
const elaborateAfter = PitchSequencing.advancePitcherRuntimeState(elaborateRuntime, "consecutiveWalk", { paResult: "walk" });
verify("10. Same Ability / Different Response：Mental → Process 方向不同", simplifyAfter.mentalState.cognitiveLoad < elaborateAfter.mentalState.cognitiveLoad && simplifyAfter.processState.precisionIntent < elaborateAfter.processState.precisionIntent && simplifyAfter.processState.rhythm > elaborateAfter.processState.rhythm);
verify("11. Response transition 前後 authoritative control 完全不變", simplifyRuntime.control === controlTruth && elaborateRuntime.control === controlTruth && simplifyAfter.control === controlTruth && elaborateAfter.control === controlTruth);

function realizationClasses(input) {
  const classes = new Set();
  for (let index = 0; index < 10000; index += 1) classes.add(PitchSequencing.resolvePitchControl({ ...input, roll: index / 10000 }).actualPitchClass);
  return classes;
}
const stableEdge = realizationClasses({ intendedPitchClass: "edgeStrike", control: 16, precisionIntent: 55, rhythm: 75, tempo: 55 });
const unstableEdge = realizationClasses({ intendedPitchClass: "edgeStrike", control: 3, precisionIntent: 90, rhythm: 25, tempo: 80 });
verify("12. Intent ≠ Actual：edge intent 可 realization 為 intended／adjacent／far classes", stableEdge.has("edgeStrike") && (stableEdge.has("competitiveStrike") || stableEdge.has("chasePitch")) && (unstableEdge.has("clearBall") || unstableEdge.has("hitterPitch")));
const stableRealization = PitchSequencing.resolvePitchControl({ intendedPitchClass: "edgeStrike", control: 9, precisionIntent: 55, rhythm: 75, tempo: 55, roll: 0.5 });
const overcontrolledRealization = PitchSequencing.resolvePitchControl({ intendedPitchClass: "edgeStrike", control: 9, precisionIntent: 95, rhythm: 25, tempo: 80, roll: 0.5 });
verify("13. Moderate precision + stable rhythm 的 realizationStability 較高", stableRealization.realizationStability > overcontrolledRealization.realizationStability);
verify("14. Low control actual distribution 仍依 topology 而非 uniform random", new Set(Object.values(PitchSequencing.resolvePitchControl({ intendedPitchClass: "edgeStrike", control: 1, precisionIntent: 90, rhythm: 20, tempo: 80, roll: 0 }).actualDistribution)).size > 1);
verify("15. High control 仍非 100% intended match", PitchSequencing.resolvePitchControl({ intendedPitchClass: "edgeStrike", control: 20, precisionIntent: 50, rhythm: 90, tempo: 70, roll: 0 }).actualDistribution.edgeStrike < 1);

const intentionalClear = PitchSequencing.resolvePitchControl({ intendedPitchClass: "clearBall", control: 20, precisionIntent: 40, rhythm: 80, tempo: 60, roll: 0.99 });
let missedClear = null;
for (let index = 0; index < 10000 && !missedClear; index += 1) {
  const candidate = PitchSequencing.resolvePitchControl({ intendedPitchClass: "edgeStrike", control: 2, precisionIntent: 90, rhythm: 20, tempo: 80, roll: index / 10000 });
  if (candidate.actualPitchClass === "clearBall") missedClear = candidate;
}
verify("16. Intentional clearBall 與 missed clearBall 有不同 realization cause", intentionalClear.actualPitchClass === "clearBall" && intentionalClear.realizationCause === "intentionalClearBall" && missedClear?.realizationCause === "executionDrift");
const intentionalChallenge = PitchSequencing.resolvePitchControl({ intendedPitchClass: "hitterPitch", control: 20, precisionIntent: 35, rhythm: 80, tempo: 60, roll: 0 });
verify("17. Intended hitterPitch → actual hitterPitch 不被誤判為失投", intentionalChallenge.actualPitchClass === "hitterPitch" && intentionalChallenge.realizationCause === "intentionalChallenge");

const runtime = PitchSequencing.createPitcherRuntimeState({ runtimeId: "integration", control: 9, responseProfile: "simplifyReset" });
const state = OffensivePlateApproach.createPlateAppearanceState({ matchId: "pitcher-core", paId: "pa-1", batterId: "player", approach: "patientSelection", pitcherRuntime: runtime });
const prepared = OffensivePlateApproach.prepareNextPitch(state);
verify("18. Production pending pitch 只使用 canonical Sequencing authority", prepared.pendingPitch.generatorAuthority === "pitchSequencingCoreSprintA" && prepared.pendingPitch.pitchLocationClass === prepared.pendingPitch.pitcherSequencingTrace.actualPitchClass);
const recognition = OffensivePlateApproach.getRecognitionResult(prepared, prepared.pendingPitch, { observe: 8, baseballIQ: 8, ballSense: 8 }, 0);
verify("19. Actual Pitch Class 接回既有 Recognition contract", recognition.perceivedPitchClass === prepared.pendingPitch.pitchLocationClass && recognition.correct);
const restored = OffensivePlateApproach.normalizePlateAppearanceState(JSON.parse(JSON.stringify(prepared)));
verify("20. Pending frozen distribution save/reload 不重抽", JSON.stringify(restored.pendingPitch) === JSON.stringify(prepared.pendingPitch));

const chaseRealization = PitchSequencing.resolvePitchControl({ intendedPitchClass: "chasePitch", control: 20, precisionIntent: 45, rhythm: 85, tempo: 65, roll: 0.5 });
const chasePitch = { pitchLocationClass: "chasePitch", intendedPitchClass: "chasePitch", controlRealization: chaseRealization, generatorAuthority: "pitchSequencingCoreSprintA" };
const beforeEvidence = JSON.stringify(chasePitch);
const resolvedOutcome = OffensivePlateApproach.resolveNextPitch(state, { observe: 12, baseballIQ: 12, ballSense: 12, batting: 14 }, { pitch: chasePitch, recognitionRoll: 0, decisionRoll: 0, contactRoll: 0, foulRoll: 1, outcomeRoll: 0.65 }).state;
verify("21. Outcome Cannot Rewrite Intent／Actual／Realization", ["single", "double", "triple", "homeRun", "out", "productiveOut"].includes(resolvedOutcome.result) && JSON.stringify(chasePitch) === beforeEvidence && chasePitch.intendedPitchClass === "chasePitch" && chasePitch.pitchLocationClass === "chasePitch" && chasePitch.controlRealization.realizationCause !== "executionDrift");

const reached = new Set();
for (const frozen of [zeroTwo, threeZero, threeTwo, approachA]) {
  for (let index = 0; index < 1000; index += 1) reached.add(PitchSequencing.sampleIntendedPitchClass(frozen, { roll: index / 1000 }).intendedPitchClass);
}
verify("22. Distribution structural sample 保持五種 Pitch Class reachable", PitchSequencing.PITCH_CLASSES.every(pitchClass => reached.has(pitchClass)));
const source = fs.readFileSync(path.join(__dirname, "..", "pitch-sequencing.js"), "utf8");
verify("23. 新 sequencing core 不使用 Math.random 或 processLabel branch", !source.includes("Math.random") && !/if\s*\([^)]*processLabel/.test(source));
verify("24. Debug trace 含 Sprint A 全部 canonical audit evidence", ["mentalStateBefore", "mentalStimulus", "responseProfile", "mentalStateAfter", "processState", "basePitchDistribution", "strategicModifiers", "frozenPitchDistribution", "intendedPitchClass", "control", "targetDifficulty", "realizationStability", "actualPitchClass", "realizationCause"].every(key => Object.hasOwn(prepared.pendingPitch.pitcherSequencingTrace, key)));
const actualReachability = new Set();
for (const intendedPitchClass of PitchSequencing.PITCH_CLASSES) {
  for (let index = 0; index < 1000; index += 1) {
    const realization = PitchSequencing.resolvePitchControl({ intendedPitchClass, control: 5, precisionIntent: 75, rhythm: 40, tempo: 70, roll: index / 1000 });
    actualReachability.add(realization.actualPitchClass);
  }
}
verify("25. Control realization structural sample 保持五種 Actual Pitch Class reachable", PitchSequencing.PITCH_CLASSES.every(pitchClass => actualReachability.has(pitchClass)));
const unsupportedRuntime = PitchSequencing.advancePitcherRuntimeState(runtime, "extraBaseHits", { paResult: "double" });
const decisionWithoutUnsupported = PitchSequencing.createPitchDecision({ paIdentity: "unknown-rng", pitchNumber: 1, balls: 1, strikes: 1, pitcherRuntime: runtime });
const decisionAfterUnsupported = PitchSequencing.createPitchDecision({ paIdentity: "unknown-rng", pitchNumber: 1, balls: 1, strikes: 1, pitcherRuntime: unsupportedRuntime });
verify("26. Unsupported stimulus 不改 Process／control 或後續 deterministic pitch truth", JSON.stringify(unsupportedRuntime.mentalState) === JSON.stringify(runtime.mentalState) && JSON.stringify(unsupportedRuntime.processState) === JSON.stringify(runtime.processState) && unsupportedRuntime.control === runtime.control && JSON.stringify(decisionAfterUnsupported.frozenDistribution) === JSON.stringify(decisionWithoutUnsupported.frozenDistribution) && decisionAfterUnsupported.intendedPitchClass === decisionWithoutUnsupported.intendedPitchClass && decisionAfterUnsupported.actualPitchClass === decisionWithoutUnsupported.actualPitchClass);

console.log(`\nPitch Sequencing Core Sprint A：${passed}/${passed} 通過`);
