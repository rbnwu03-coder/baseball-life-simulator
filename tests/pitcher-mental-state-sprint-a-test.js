const assert = require("assert");
const PitcherMentalState = require("../pitcher-mental-state.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const initial = PitcherMentalState.createMentalState({ arousal: 55, confidence: 52, cognitiveLoad: 50, resultAttachment: 48 });
const simplify = PitcherMentalState.RESPONSE_PROFILE_FIXTURES.simplifyReset;
const elaborate = PitcherMentalState.RESPONSE_PROFILE_FIXTURES.elaborateInternalize;
const resetTransition = PitcherMentalState.transitionMentalState(initial, "consecutiveWalk", simplify);
const internalizeTransition = PitcherMentalState.transitionMentalState(initial, "consecutiveWalk", elaborate);

verify("1. Mental State v1 保留四個 canonical dimensions", ["arousal", "confidence", "cognitiveLoad", "resultAttachment"].every(key => Number.isFinite(initial[key])));
verify("2. Simplify / Reset 連續四壞後 cognitiveLoad 下降", resetTransition.mentalStateAfter.cognitiveLoad < initial.cognitiveLoad);
verify("3. Simplify / Reset 連續四壞後 resultAttachment 不再惡化", resetTransition.mentalStateAfter.resultAttachment <= initial.resultAttachment);
verify("4. Simplify / Reset 不會讓 confidence 無因上升", resetTransition.mentalStateAfter.confidence <= initial.confidence);
verify("5. Elaborate / Internalize 連續四壞後 cognitiveLoad 上升", internalizeTransition.mentalStateAfter.cognitiveLoad > initial.cognitiveLoad);
verify("6. Elaborate / Internalize 連續四壞後 resultAttachment 上升", internalizeTransition.mentalStateAfter.resultAttachment > initial.resultAttachment);
verify("7. 相同 input transition 完全 deterministic", JSON.stringify(resetTransition) === JSON.stringify(PitcherMentalState.transitionMentalState(initial, "consecutiveWalk", simplify)));
verify("8. 所有規定 stimulus 皆可產生合法 bounded state", PitcherMentalState.STIMULI.every(stimulus => Object.values(PitcherMentalState.transitionMentalState(initial, stimulus, simplify).mentalStateAfter).filter(Number.isFinite).every(value => value >= 0 && value <= 100)));
verify("9. Response Profile fixture 只含 provisional response directions", simplify.pressureProcessing === "simplify" && simplify.failureResponse === "reset" && elaborate.pressureProcessing === "elaborate" && elaborate.responsibilityStyle === "internalize");
verify("10. Mental transition 不修改 input state 或 response fixture", Object.isFrozen(initial) && Object.isFrozen(simplify) && initial.cognitiveLoad === 50 && simplify.failureResponse === "reset");

const unknownInputs = ["unsupportedMentalStimulus", "extraBaseHits", null, undefined, ""];
const unknownTransitions = unknownInputs.map(stimulus => PitcherMentalState.transitionMentalState(initial, stimulus, simplify));
verify("11. Unknown string 是 no-op 且不 fallback 成 hit", JSON.stringify(unknownTransitions[0].mentalStateAfter) === JSON.stringify(initial) && unknownTransitions[0].normalizedStimulus === null && unknownTransitions[0].mentalStimulus === null && unknownTransitions[0].transitionApplied === false);
verify("12. Known-event typo 不做 fuzzy correction", JSON.stringify(unknownTransitions[1].mentalStateAfter) === JSON.stringify(initial) && unknownTransitions[1].requestedStimulus === "extraBaseHits" && unknownTransitions[1].normalizedStimulus === null);
verify("13. null／undefined／empty string 不 crash 或修改 Mental State", unknownTransitions.slice(2).every(transition => JSON.stringify(transition.mentalStateAfter) === JSON.stringify(initial) && transition.transitionApplied === false));
verify("14. Unknown debug evidence 明確記錄 unsupportedStimulus", unknownTransitions.every(transition => transition.reason === "unsupportedStimulus" && Object.values(transition.appliedDelta).every(value => value === 0)));
verify("15. null 與 undefined audit evidence 可區分", unknownTransitions[2].requestedStimulusType === "null" && unknownTransitions[3].requestedStimulusType === "undefined");
const knownHit = PitcherMentalState.transitionMentalState(initial, "hit", simplify);
verify("16. Known hit 仍套用原 deterministic transition", knownHit.transitionApplied === true && knownHit.normalizedStimulus === "hit" && knownHit.reason === "applied" && JSON.stringify(knownHit.mentalStateAfter) !== JSON.stringify(initial) && JSON.stringify(knownHit) === JSON.stringify(PitcherMentalState.transitionMentalState(initial, "hit", simplify)));

console.log(`\nPitcher Mental State Sprint A：${passed}/${passed} 通過`);
