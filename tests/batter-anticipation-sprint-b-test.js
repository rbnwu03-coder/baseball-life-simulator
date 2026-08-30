const assert = require("assert");
const fs = require("fs");
const path = require("path");
const PitcherProcessState = require("../pitcher-process-state.js");
const PitchSequencing = require("../pitch-sequencing.js");
const BatterAnticipation = require("../batter-anticipation.js");
const OffensivePlateApproach = require("../offensive-plate-approach.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const classes = BatterAnticipation.PITCH_CLASSES;
const sum = distribution => Object.values(distribution).reduce((total, value) => total + value, 0);
const direction = distribution => {
  const challenge = distribution.hitterPitch + distribution.competitiveStrike;
  const expansion = distribution.edgeStrike + distribution.chasePitch;
  return challenge >= expansion && challenge >= distribution.clearBall ? "challenge" : expansion >= distribution.clearBall ? "expansion" : "clearBall";
};
const rawChallengeHistory = [
  "hitterPitch", "competitiveStrike", "competitiveStrike", "hitterPitch", "competitiveStrike", "hitterPitch", "competitiveStrike", "edgeStrike"
].map((pitchClass, index) => ({ actualPitchClass: pitchClass, pitchResult: index % 2 ? "calledStrike" : "ballInPlay", controlRealization: { realizationDistance: index % 4 === 0 ? 1 : 0 } }));
const canonicalChallengeHistory = rawChallengeHistory.map(PitchSequencing.createObservablePitchRecord);
const challengeEvidence = PitchSequencing.buildObservablePitcherEvidence({ observableHistory: canonicalChallengeHistory });
const sparseEvidence = PitchSequencing.buildObservablePitcherEvidence({ observableHistory: [{ pitchLocationClass: "chasePitch", pitchResult: "ball", controlRealization: { realizationDistance: 0 } }] });
const highAbilities = { observe: 18, baseballIQ: 18, ballSense: 17 };
const lowAbilities = { observe: 3, baseballIQ: 3, ballSense: 3 };
const process = PitcherProcessState.createProcessState({ rhythm: 65, aggression: 70, tempo: 60, precisionIntent: 45 });
const true31 = PitchSequencing.freezePitchDistribution(PitchSequencing.buildStrategicPitchDistribution({ balls: 3, strikes: 1 }, process));
const correct = BatterAnticipation.prepareBatterAnticipation({ identity: "scenario-correct", publicContext: { balls: 3, strikes: 1 }, observableEvidence: challengeEvidence, batterCapabilities: highAbilities });
const correctAudit = BatterAnticipation.evaluateAnticipationDebug(correct, true31.finalFrozenDistribution);

const rawRecord = PitchSequencing.createObservablePitchRecord({ actualPitchClass: "chasePitch", pitchResult: "ball", controlRealization: { realizationDistance: 1 }, ballsAfter: 1, strikesAfter: 2 });
verify("Closeout 1. raw resolved pitch 可建立 canonical observable record", rawRecord.pitchClass === "chasePitch" && rawRecord.commandCue === "minorLocationDrift");
const canonicalRecord = { pitchClass: "edgeStrike", pitchResult: "calledStrike", ballsAfter: 0, strikesAfter: 1, commandCue: "recentEdgeAttempts" };
const canonicalEvidence = PitchSequencing.buildObservablePitcherEvidence({ observableHistory: [canonicalRecord] });
verify("Closeout 2. canonical observable record 可直接進入 evidence 而不被清空", canonicalEvidence.sampleSize === 1 && canonicalEvidence.recentPitchClasses[0] === "edgeStrike");
verify("Closeout 3. canonical command cue 與 previous pitch result 完整保留", canonicalEvidence.observableCues.includes("recentEdgeAttempts") && canonicalEvidence.previousPitchResult === "calledStrike");
const productionStored = PitchSequencing.createObservablePitchRecord({ pitch: { pitchLocationClass: "competitiveStrike", controlRealization: { realizationDistance: 0 } }, pitchResult: "calledStrike", ballsAfter: 0, strikesAfter: 1 });
const productionEvidence = PitchSequencing.buildObservablePitcherEvidence({ observableHistory: [productionStored] });
const productionAnticipation = BatterAnticipation.prepareBatterAnticipation({ identity: "production-chain", publicContext: { balls: 0, strikes: 0 }, observableEvidence: productionEvidence, batterCapabilities: highAbilities });
verify("Closeout 4. resolved pitch → stored history → evidence → anticipation 完整保留", productionStored.pitchClass === "competitiveStrike" && productionEvidence.sampleSize === 1 && productionAnticipation.observableEvidenceRaw.recentPitchClasses[0] === "competitiveStrike");
const multiCanonicalHistory = [
  { pitchClass: "competitiveStrike", pitchResult: "calledStrike", commandCue: "commandAppearsStable" },
  { pitchClass: "edgeStrike", pitchResult: "foul", commandCue: "recentEdgeAttempts" },
  { pitchClass: "chasePitch", pitchResult: "ball", commandCue: "recentExpansionPattern" }
];
const multiEvidence = PitchSequencing.buildObservablePitcherEvidence({ observableHistory: multiCanonicalHistory });
verify("Closeout 5. multi-pitch canonical history 保留 sample size、順序與 trend extraction", multiEvidence.sampleSize === 3 && JSON.stringify(multiEvidence.recentPitchClasses) === JSON.stringify(["competitiveStrike", "edgeStrike", "chasePitch"]) && multiEvidence.observableCues.includes("recentExpansionPattern"));
const invalidResultOnly = PitchSequencing.createObservablePitchRecord({ pitchResult: "calledStrike", commandCue: "commandAppearsStable" });
verify("Closeout 6. 缺少 pitchClass 時不從 pitchResult reverse-infer", invalidResultOnly.pitchClass === "" && PitchSequencing.buildObservablePitcherEvidence({ observableHistory: [invalidResultOnly] }).sampleSize === 0);
const canonicalPriority = PitchSequencing.createObservablePitchRecord({ pitchClass: "edgeStrike", actualPitchClass: "chasePitch", pitchLocationClass: "clearBall", pitchResult: "ball" });
verify("Closeout 7. compatibility priority 為 canonical pitchClass → actual → location", canonicalPriority.pitchClass === "edgeStrike");
const reloadedCanonicalHistory = JSON.parse(JSON.stringify(multiCanonicalHistory));
const reloadedEvidence = PitchSequencing.buildObservablePitcherEvidence({ observableHistory: reloadedCanonicalHistory });
verify("Closeout 8. save/reload shape 保留 history order 與完全相同 evidence", JSON.stringify(reloadedCanonicalHistory) === JSON.stringify(multiCanonicalHistory) && JSON.stringify(reloadedEvidence) === JSON.stringify(multiEvidence));
const historyBeforeApproach = JSON.stringify(canonicalChallengeHistory);
BatterAnticipation.derivePrePitchReadiness(correct, "aggressiveEarlySwing");
BatterAnticipation.derivePrePitchReadiness(correct, "patientSelection");
verify("Closeout 9. Player Approach 不修改 observable history", JSON.stringify(canonicalChallengeHistory) === historyBeforeApproach);
const expansionEvidence = PitchSequencing.buildObservablePitcherEvidence({ observableHistory: ["edgeStrike", "chasePitch", "chasePitch"].map((pitchClass, index) => ({ pitchClass, pitchResult: index === 0 ? "foul" : "ball", commandCue: "recentExpansionPattern" })) });
const historyA = BatterAnticipation.prepareBatterAnticipation({ identity: "history-shape", publicContext: {}, observableEvidence: challengeEvidence, batterCapabilities: highAbilities });
const historyB = BatterAnticipation.prepareBatterAnticipation({ identity: "history-shape", publicContext: {}, observableEvidence: expansionEvidence, batterCapabilities: highAbilities });
verify("Closeout 10. 有效不同 history 實際產生不同 subjective anticipation", challengeEvidence.sampleSize > 0 && expansionEvidence.sampleSize > 0 && JSON.stringify(historyA.subjectivePitchDistribution) !== JSON.stringify(historyB.subjectivePitchDistribution));

const sharedObservation = {
  observedPitchClasses: ["competitiveStrike", "edgeStrike", "competitiveStrike", "edgeStrike"],
  observedCues: [], sourceSampleSize: 4, retainedSampleSize: 4, omittedCount: 0, noiseCount: 0,
  sampleAdequacy: 0.5, reliability: 0.8
};
const challengeCueInterpretation = BatterAnticipation.resolveAnticipationInterpretation({ identity: "strategic-cue-contract", publicContext: { balls: 1, strikes: 1 }, observationResult: { ...sharedObservation, observedCues: ["recentChallengeHeavy"] }, batterCapabilities: highAbilities });
const expansionCueInterpretation = BatterAnticipation.resolveAnticipationInterpretation({ identity: "strategic-cue-contract", publicContext: { balls: 1, strikes: 1 }, observationResult: { ...sharedObservation, observedCues: ["recentExpansionPattern"] }, batterCapabilities: highAbilities });
const challengeMass = distribution => distribution.hitterPitch + distribution.competitiveStrike;
const expansionMass = distribution => distribution.edgeStrike + distribution.chasePitch;
verify("Final Closeout A. 相同 history 下 strategic cues 造成合理方向差異", challengeMass(challengeCueInterpretation.subjectivePitchDistribution) > challengeMass(expansionCueInterpretation.subjectivePitchDistribution) && expansionMass(expansionCueInterpretation.subjectivePitchDistribution) > expansionMass(challengeCueInterpretation.subjectivePitchDistribution));

const noCommandInterpretation = BatterAnticipation.resolveAnticipationInterpretation({ identity: "command-cue-contract", publicContext: { balls: 1, strikes: 1 }, observationResult: sharedObservation, batterCapabilities: highAbilities });
const unstableCommandInterpretation = BatterAnticipation.resolveAnticipationInterpretation({ identity: "command-cue-contract", publicContext: { balls: 1, strikes: 1 }, observationResult: { ...sharedObservation, observedCues: ["recentCommandInstability"] }, batterCapabilities: highAbilities });
verify("Final Closeout B. command instability 主要降低 confidence／提高 uncertainty", unstableCommandInterpretation.anticipationConfidence < noCommandInterpretation.anticipationConfidence && unstableCommandInterpretation.uncertainty > noCommandInterpretation.uncertainty && JSON.stringify(unstableCommandInterpretation.subjectivePitchDistribution) === JSON.stringify(noCommandInterpretation.subjectivePitchDistribution));

let omittedCueObservation = null;
let omittedCueIdentity = "";
for (let index = 0; index < 100 && !omittedCueObservation; index += 1) {
  const identity = `omitted-cue-${index}`;
  const observation = BatterAnticipation.resolveAnticipationObservation({ identity, publicContext: {}, observableEvidence: { recentPitchClasses: [], observableCues: ["recentChallengeHeavy"] }, batterCapabilities: lowAbilities });
  if (!observation.observedCues.includes("recentChallengeHeavy")) {
    omittedCueObservation = observation;
    omittedCueIdentity = identity;
  }
}
const equivalentNoCueObservation = BatterAnticipation.resolveAnticipationObservation({ identity: omittedCueIdentity, publicContext: {}, observableEvidence: { recentPitchClasses: [], observableCues: [] }, batterCapabilities: lowAbilities });
const omittedCueInterpretation = BatterAnticipation.resolveAnticipationInterpretation({ identity: omittedCueIdentity, publicContext: {}, observationResult: omittedCueObservation, batterCapabilities: lowAbilities });
const equivalentNoCueInterpretation = BatterAnticipation.resolveAnticipationInterpretation({ identity: omittedCueIdentity, publicContext: {}, observationResult: equivalentNoCueObservation, batterCapabilities: lowAbilities });
verify("Final Closeout C. raw cue 未被 Observe 捕捉時對 Interpretation 完全無作用", Boolean(omittedCueObservation) && JSON.stringify(omittedCueInterpretation) === JSON.stringify(equivalentNoCueInterpretation));

const stableInterpretation = BatterAnticipation.resolveAnticipationInterpretation({ identity: "stable-command-contract", publicContext: { balls: 1, strikes: 1 }, observationResult: { ...sharedObservation, observedCues: ["commandAppearsStable"] }, batterCapabilities: highAbilities });
const stableBaselineInterpretation = BatterAnticipation.resolveAnticipationInterpretation({ identity: "stable-command-contract", publicContext: { balls: 1, strikes: 1 }, observationResult: sharedObservation, batterCapabilities: highAbilities });
const stableAnticipation = { subjectivePitchDistribution: stableInterpretation.subjectivePitchDistribution, anticipationConfidence: stableInterpretation.anticipationConfidence };
const stableAudit = BatterAnticipation.evaluateAnticipationDebug(stableAnticipation, true31.finalFrozenDistribution);
verify("Final Closeout D. stable command 可提高 confidence 但不揭露 true distribution", stableInterpretation.anticipationConfidence > stableBaselineInterpretation.anticipationConfidence && JSON.stringify(stableInterpretation.subjectivePitchDistribution) !== JSON.stringify(true31.finalFrozenDistribution) && stableAudit.directionAccuracy < 1);

const threeZeroExpansion = BatterAnticipation.resolveAnticipationInterpretation({ identity: "count-cue-30", publicContext: { balls: 3, strikes: 0 }, observationResult: { ...sharedObservation, observedCues: ["recentExpansionPattern"] }, batterCapabilities: highAbilities });
const zeroTwoChallenge = BatterAnticipation.resolveAnticipationInterpretation({ identity: "count-cue-02", publicContext: { balls: 0, strikes: 2 }, observationResult: { ...sharedObservation, observedCues: ["recentChallengeHeavy"] }, batterCapabilities: highAbilities });
verify("Final Closeout E. strategic cue 不會完全覆蓋 3-0／0-2 count context", challengeMass(threeZeroExpansion.subjectivePitchDistribution) > expansionMass(threeZeroExpansion.subjectivePitchDistribution) && expansionMass(zeroTwoChallenge.subjectivePitchDistribution) > zeroTwoChallenge.subjectivePitchDistribution.hitterPitch && Math.max(...Object.values(threeZeroExpansion.subjectivePitchDistribution), ...Object.values(zeroTwoChallenge.subjectivePitchDistribution)) < 0.5);

const productionCueHistory = ["competitiveStrike", "hitterPitch", "competitiveStrike", "hitterPitch"].map((actualPitchClass, index) => PitchSequencing.createObservablePitchRecord({ actualPitchClass, pitchResult: index % 2 ? "ballInPlay" : "calledStrike", controlRealization: { realizationDistance: 0 } }));
const productionCueEvidence = PitchSequencing.buildObservablePitcherEvidence({ observableHistory: productionCueHistory });
let productionCueAnticipation = null;
for (let index = 0; index < 100 && !productionCueAnticipation; index += 1) {
  const candidate = BatterAnticipation.prepareBatterAnticipation({ identity: `production-cue-${index}`, publicContext: { balls: 1, strikes: 1 }, observableEvidence: productionCueEvidence, batterCapabilities: highAbilities });
  if (candidate.observationResult.observedCues.includes("recentChallengeHeavy")) productionCueAnticipation = candidate;
}
const productionCueWithoutInterpretation = BatterAnticipation.resolveAnticipationInterpretation({ identity: productionCueAnticipation?.identity, publicContext: productionCueAnticipation?.publicContext, observationResult: { ...productionCueAnticipation?.observationResult, observedCues: [] }, batterCapabilities: highAbilities });
verify("Final Closeout F. production record → evidence → observed cue → interpretation chain 有效", productionCueEvidence.observableCues.includes("recentChallengeHeavy") && productionCueAnticipation?.interpretationResult.observedCues.includes("recentChallengeHeavy") && JSON.stringify(productionCueAnticipation.subjectivePitchDistribution) !== JSON.stringify(productionCueWithoutInterpretation.subjectivePitchDistribution));

const reloadedCueHistory = JSON.parse(JSON.stringify(productionCueHistory));
const reloadedCueEvidence = PitchSequencing.buildObservablePitcherEvidence({ observableHistory: reloadedCueHistory });
const cueBeforeReload = BatterAnticipation.prepareBatterAnticipation({ identity: "cue-save-reload", publicContext: { balls: 1, strikes: 1 }, observableEvidence: productionCueEvidence, batterCapabilities: highAbilities });
const cueAfterReload = BatterAnticipation.prepareBatterAnticipation({ identity: "cue-save-reload", publicContext: { balls: 1, strikes: 1 }, observableEvidence: reloadedCueEvidence, batterCapabilities: highAbilities });
verify("Final Closeout G. save/reload 後 cue observation／distribution／confidence deterministic", JSON.stringify(cueAfterReload) === JSON.stringify(cueBeforeReload));

verify("1. Subjective distribution normalization = 1", Math.abs(sum(correct.subjectivePitchDistribution) - 1) < 1e-8);
verify("2. Subjective distribution 保留全部五種 Pitch Class", classes.every(pitchClass => Object.hasOwn(correct.subjectivePitchDistribution, pitchClass)));
verify("3. Subjective distribution 無 NaN、Infinity 或負值", Object.values(correct.subjectivePitchDistribution).every(value => Number.isFinite(value) && value >= 0));
verify("4. 相同 identity／evidence／能力 deterministic 重跑一致", JSON.stringify(correct) === JSON.stringify(BatterAnticipation.prepareBatterAnticipation({ identity: "scenario-correct", publicContext: { balls: 3, strikes: 1 }, observableEvidence: challengeEvidence, batterCapabilities: highAbilities })));
verify("5. 相同 evidence、不同能力形成不同主觀模型", JSON.stringify(correct.subjectivePitchDistribution) !== JSON.stringify(BatterAnticipation.prepareBatterAnticipation({ identity: "scenario-correct", publicContext: { balls: 3, strikes: 1 }, observableEvidence: challengeEvidence, batterCapabilities: lowAbilities }).subjectivePitchDistribution));

const highIQ = BatterAnticipation.resolveAnticipationInterpretation({ identity: "iq-boundary", publicContext: { balls: 0, strikes: 2 }, observationResult: correct.observationResult, batterCapabilities: { observe: 10, baseballIQ: 19, ballSense: 10 } });
const lowIQ = BatterAnticipation.resolveAnticipationInterpretation({ identity: "iq-boundary", publicContext: { balls: 0, strikes: 2 }, observationResult: correct.observationResult, batterCapabilities: { observe: 10, baseballIQ: 1, ballSense: 10 } });
verify("6. 相同 evidence 的高低 BaseballIQ 產生不同 context interpretation／uncertainty", JSON.stringify(highIQ.contextExpectation) !== JSON.stringify(lowIQ.contextExpectation) && highIQ.uncertainty < lowIQ.uncertainty);
verify("7. 高 Observe 仍只讀 observable evidence 且不複製 hidden truth", JSON.stringify(correct.subjectivePitchDistribution) !== JSON.stringify(true31.finalFrozenDistribution) && !Object.hasOwn(correct.observationResult, "processState"));
verify("8. Correct Anticipation：3-1 challenge 方向正確、信心可高但不等於精確 truth", correctAudit.directionCorrect && correct.anticipationConfidence >= 0.6 && JSON.stringify(correct.subjectivePitchDistribution) !== JSON.stringify(true31.finalFrozenDistribution));

const true02 = PitchSequencing.freezePitchDistribution(PitchSequencing.buildStrategicPitchDistribution({ balls: 0, strikes: 2 }, PitcherProcessState.createProcessState({ rhythm: 60, aggression: 35, tempo: 55, precisionIntent: 80 })));
let wrongHigh = null;
for (let index = 0; index < 1000 && !wrongHigh; index += 1) {
  const candidate = BatterAnticipation.prepareBatterAnticipation({ identity: `wrong-high-${index}`, publicContext: { balls: 0, strikes: 2 }, observableEvidence: challengeEvidence, batterCapabilities: highAbilities });
  const audit = BatterAnticipation.evaluateAnticipationDebug(candidate, true02.finalFrozenDistribution);
  if (!audit.directionCorrect && candidate.anticipationConfidence >= 0.62) wrongHigh = { candidate, audit };
}
verify("9. Wrong High-Confidence：高信心仍可判斷錯誤且不被當成 truth", Boolean(wrongHigh) && JSON.stringify(wrongHigh.candidate.subjectivePitchDistribution) !== JSON.stringify(true02.finalFrozenDistribution));

let lowConfidenceCorrect = null;
for (let index = 0; index < 1000 && !lowConfidenceCorrect; index += 1) {
  const candidate = BatterAnticipation.prepareBatterAnticipation({ identity: `low-good-${index}`, publicContext: { balls: 0, strikes: 2 }, observableEvidence: sparseEvidence, batterCapabilities: { observe: 5, baseballIQ: 19, ballSense: 10 } });
  const audit = BatterAnticipation.evaluateAnticipationDebug(candidate, true02.finalFrozenDistribution);
  if (audit.directionCorrect && candidate.anticipationConfidence < 0.45) lowConfidenceCorrect = { candidate, audit };
}
verify("10. Low Confidence but Good Direction：少量 evidence 下方向可對但信心低", Boolean(lowConfidenceCorrect));

const runtime = PitchSequencing.createPitcherRuntimeState({ runtimeId: "agency-firewall", control: 9, processState: process });
function prepareApproach(approach) {
  const anticipation = BatterAnticipation.prepareBatterAnticipation({ identity: "same-pa", publicContext: { balls: 3, strikes: 1 }, observableEvidence: challengeEvidence, batterCapabilities: highAbilities });
  const state = OffensivePlateApproach.createPlateAppearanceState({ paIdentity: "same-pa", approach, pitcherRuntime: runtime, batterAnticipation: anticipation, prePitchFrozenDistribution: true31 });
  return { anticipation, pitch: OffensivePlateApproach.prepareNextPitch(state).pendingPitch };
}
const aggressive = prepareApproach("aggressiveEarlySwing");
const patient = prepareApproach("patientSelection");
verify("11. Approach 不改 frozen true distribution", JSON.stringify(aggressive.pitch.pitcherSequencingTrace.frozenPitchDistribution) === JSON.stringify(patient.pitch.pitcherSequencingTrace.frozenPitchDistribution));
verify("12. Approach 不改 observable evidence 或 subjective anticipation", JSON.stringify(aggressive.anticipation) === JSON.stringify(patient.anticipation));
verify("13. Anticipation／Approach 不改 intended pitch sampling", aggressive.pitch.intendedPitchClass === patient.pitch.intendedPitchClass);
verify("14. Anticipation／Approach 不改 control realization 後的 actual pitch", aggressive.pitch.pitchLocationClass === patient.pitch.pitchLocationClass);

const rescueAnticipation = wrongHigh.candidate;
const rescueState = OffensivePlateApproach.createPlateAppearanceState({ paIdentity: "recognition-rescue", approach: "patientSelection", batterAnticipation: rescueAnticipation });
const rescuePitch = { pitchLocationClass: "chasePitch", recognitionDifficulty: 0.72, attackability: 0.25, strike: false };
const rescue = OffensivePlateApproach.resolveNextPitch(rescueState, { observe: 20, baseballIQ: 20, ballSense: 20, batting: 10 }, { pitch: rescuePitch, recognitionRoll: 0, decisionRoll: 0.99 });
verify("15. Wrong anticipation 可被 post-release Recognition 救回為 Take", rescue.event.recognition.correct && rescue.event.recognition.perceivedPitchClass === "chasePitch" && rescue.event.action === "take" && JSON.stringify(rescue.state.batterAnticipation) === JSON.stringify(rescueAnticipation));

const executionState = OffensivePlateApproach.createPlateAppearanceState({ paIdentity: "poor-execution", approach: "aggressiveEarlySwing", batterAnticipation: correct });
const poor = OffensivePlateApproach.resolveNextPitch(executionState, { observe: 20, baseballIQ: 20, ballSense: 10, batting: 1 }, { pitch: { pitchLocationClass: "competitiveStrike", recognitionDifficulty: 0.34, attackability: 0.76, strike: true }, recognitionRoll: 0, decisionRoll: 0, contactRoll: 1 });
verify("16. Correct anticipation／Recognition 仍可 poor execution，且 outcome 不回寫 anticipation", poor.event.recognition.correct && poor.event.action === "swing" && poor.event.pitchResult === "swingingStrike" && JSON.stringify(poor.state.batterAnticipation) === JSON.stringify(correct));

const pendingBeforeReload = OffensivePlateApproach.prepareNextPitch(OffensivePlateApproach.createPlateAppearanceState({ paIdentity: "reload", approach: "patientSelection", pitcherRuntime: runtime, batterAnticipation: correct, prePitchFrozenDistribution: true31 }));
const restored = OffensivePlateApproach.normalizePlateAppearanceState(JSON.parse(JSON.stringify(pendingBeforeReload)));
verify("17. Save/reload contract 保存 evidence／subjective／confidence／debug／pending frozen state 而不重抽", JSON.stringify(restored.batterAnticipation) === JSON.stringify(correct) && JSON.stringify(restored.prePitchFrozenDistribution) === JSON.stringify(true31) && Boolean(restored.pendingPitch));

const playerTruth = { observe: 12, ballSense: 11, baseballSkills: { baseballIQ: 13, batting: 9 } };
const truthBefore = JSON.stringify(playerTruth);
BatterAnticipation.prepareBatterAnticipation({ identity: "truth-immutable", publicContext: {}, observableEvidence: challengeEvidence, batterCapabilities: { observe: playerTruth.observe, ballSense: playerTruth.ballSense, baseballIQ: playerTruth.baseballSkills.baseballIQ } });
verify("18. Anticipation 不修改 Player Truth abilities", JSON.stringify(playerTruth) === truthBefore);

const resolverSources = [BatterAnticipation.resolveAnticipationObservation, BatterAnticipation.resolveAnticipationInterpretation, BatterAnticipation.prepareBatterAnticipation].map(fn => fn.toString()).join("\n");
verify("19. Information Firewall：production resolver 不接 hidden pitcher truth", !/(pitcherMentalState|pitcherProcessState|frozenPitchDistribution|intendedPitchClass|actualPitchClass)/.test(resolverSources));
verify("20. True distribution 僅由獨立 debug evaluator 在 resolver 完成後比較", /frozenTrueDistribution/.test(BatterAnticipation.evaluateAnticipationDebug.toString()) && !/frozenTrueDistribution/.test(BatterAnticipation.prepareBatterAnticipation.toString()));

let highAccuracy = 0;
let lowAccuracy = 0;
let highWrongCount = 0;
let lowCorrectCount = 0;
let collapseCount = 0;
const subjectiveReachability = new Set();
for (let index = 0; index < 300; index += 1) {
  const high = BatterAnticipation.prepareBatterAnticipation({ identity: `sample-high-${index}`, publicContext: { balls: 3, strikes: 1 }, observableEvidence: challengeEvidence, batterCapabilities: highAbilities });
  const low = BatterAnticipation.prepareBatterAnticipation({ identity: `sample-low-${index}`, publicContext: { balls: 3, strikes: 1 }, observableEvidence: challengeEvidence, batterCapabilities: lowAbilities });
  const highAudit = BatterAnticipation.evaluateAnticipationDebug(high, true31.finalFrozenDistribution);
  const lowAudit = BatterAnticipation.evaluateAnticipationDebug(low, true31.finalFrozenDistribution);
  const wrongSample = BatterAnticipation.prepareBatterAnticipation({ identity: `wrong-high-${index}`, publicContext: { balls: 0, strikes: 2 }, observableEvidence: challengeEvidence, batterCapabilities: highAbilities });
  const wrongSampleAudit = BatterAnticipation.evaluateAnticipationDebug(wrongSample, true02.finalFrozenDistribution);
  const uncertainSample = BatterAnticipation.prepareBatterAnticipation({ identity: `low-good-${index}`, publicContext: { balls: 0, strikes: 2 }, observableEvidence: sparseEvidence, batterCapabilities: { observe: 5, baseballIQ: 19, ballSense: 10 } });
  const uncertainSampleAudit = BatterAnticipation.evaluateAnticipationDebug(uncertainSample, true02.finalFrozenDistribution);
  highAccuracy += highAudit.directionAccuracy;
  lowAccuracy += lowAudit.directionAccuracy;
  if (!wrongSampleAudit.directionCorrect && wrongSample.anticipationConfidence >= 0.62) highWrongCount += 1;
  if (uncertainSampleAudit.directionCorrect && uncertainSample.anticipationConfidence < 0.45) lowCorrectCount += 1;
  if (JSON.stringify(high.subjectivePitchDistribution) === JSON.stringify(true31.finalFrozenDistribution) || JSON.stringify(low.subjectivePitchDistribution) === JSON.stringify(true31.finalFrozenDistribution)) collapseCount += 1;
  classes.forEach(pitchClass => { if (high.subjectivePitchDistribution[pitchClass] > 0 && low.subjectivePitchDistribution[pitchClass] > 0) subjectiveReachability.add(pitchClass); });
}
verify("21. Structural sample：高能力平均 direction accuracy 較高但不 perfect", highAccuracy / 300 > lowAccuracy / 300 && highAccuracy / 300 < 1);
verify("22. Structural sample：confidence/accuracy 可分離且不 collapse 成 truth", collapseCount === 0 && subjectiveReachability.size === 5 && highWrongCount > 0 && lowCorrectCount > 0);

const source = fs.readFileSync(path.join(__dirname, "..", "batter-anticipation.js"), "utf8");
verify("23. Anticipation noise deterministic，production module 不使用 Math.random", !source.includes("Math.random"));

console.log(`\nBatter Anticipation Sprint B：${passed}/${passed} 通過`);
console.log(JSON.stringify({
  highAbilityAverageDirectionAccuracy: Number((highAccuracy / 300).toFixed(4)),
  lowAbilityAverageDirectionAccuracy: Number((lowAccuracy / 300).toFixed(4)),
  highConfidenceWrongCases: highWrongCount,
  lowConfidenceCorrectCases: lowCorrectCount,
  trueDistributionCollapseCases: collapseCount,
  reachableSubjectiveClasses: [...subjectiveReachability]
}));
