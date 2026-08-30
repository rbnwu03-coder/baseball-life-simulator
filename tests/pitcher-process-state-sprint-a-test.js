const assert = require("assert");
const PitcherMentalState = require("../pitcher-mental-state.js");
const PitcherProcessState = require("../pitcher-process-state.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const initialMental = PitcherMentalState.createMentalState({ arousal: 55, confidence: 52, cognitiveLoad: 50, resultAttachment: 48 });
const simplify = PitcherMentalState.RESPONSE_PROFILE_FIXTURES.simplifyReset;
const elaborate = PitcherMentalState.RESPONSE_PROFILE_FIXTURES.elaborateInternalize;
const simplifyMental = PitcherMentalState.transitionMentalState(initialMental, "consecutiveWalk", simplify).mentalStateAfter;
const elaborateMental = PitcherMentalState.transitionMentalState(initialMental, "consecutiveWalk", elaborate).mentalStateAfter;
const simplifyProcess = PitcherProcessState.derivePitcherProcessState(simplifyMental, simplify);
const elaborateProcess = PitcherProcessState.derivePitcherProcessState(elaborateMental, elaborate);

verify("1. Process State 保留 rhythm／aggression／tempo／precisionIntent", ["rhythm", "aggression", "tempo", "precisionIntent"].every(key => Number.isFinite(simplifyProcess[key])));
verify("2. Simplify / Reset 導向較低 precision demand", simplifyProcess.precisionIntent < elaborateProcess.precisionIntent);
verify("3. Elaborate / Internalize 導向較不穩定 rhythm", simplifyProcess.rhythm > elaborateProcess.rhythm);
verify("4. Response 差異經 Mental State 進入 Process，而非能力 mutation", simplifyMental.cognitiveLoad < elaborateMental.cognitiveLoad && simplifyMental.resultAttachment < elaborateMental.resultAttachment);
verify("5. Tempo high 不等於 Rhythm high", PitcherProcessState.createProcessState({ tempo: 80, rhythm: 30 }).tempo > PitcherProcessState.createProcessState({ tempo: 80, rhythm: 30 }).rhythm);
verify("6. 可表示 fast + stable", PitcherProcessState.createProcessState({ tempo: 75, rhythm: 75 }).tempo >= 70 && PitcherProcessState.createProcessState({ tempo: 75, rhythm: 75 }).rhythm >= 70);
verify("7. 可表示 slow + stable", PitcherProcessState.createProcessState({ tempo: 35, rhythm: 75 }).tempo < 50 && PitcherProcessState.createProcessState({ tempo: 35, rhythm: 75 }).rhythm >= 70);
verify("8. Precision Intent state 不含 control capability", !Object.hasOwn(simplifyProcess, "control") && !Object.hasOwn(elaborateProcess, "control"));
verify("9. Process label 僅為 derived readable summary", typeof simplifyProcess.processLabel === "string" && typeof elaborateProcess.processLabel === "string");
verify("10. Process derivation deterministic 且 immutable", JSON.stringify(simplifyProcess) === JSON.stringify(PitcherProcessState.derivePitcherProcessState(simplifyMental, simplify)) && Object.isFrozen(simplifyProcess));

console.log(`\nPitcher Process State Sprint A：${passed}/${passed} 通過`);
