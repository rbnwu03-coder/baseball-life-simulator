const assert = require("assert");
const Plate = require("../offensive-plate-approach.js");

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

const state = (approach, strikes = 0, identity = `${approach}-${strikes}`) => Plate.createPlateAppearanceState({
  paIdentity: identity, batterId: "player", approach, strikes
});
const recognition = (perceivedPitchClass, correct = true) => Object.freeze({ perceivedPitchClass, correct });
const tendency = (approach, perceivedPitchClass, strikes = 0) => Plate.getSwingTendency(state(approach, strikes), recognition(perceivedPitchClass)).tendency;

verify("1. semantic authority 明定為 Approach Attack Window + Recognition + Count", Plate.getSwingTendency(state("balancedAttack"), recognition("competitiveStrike")).semanticAuthority === "approachAttackWindow+recognition+count");
verify("2. Fixture A：0-0 aggressive 對 hitterPitch 為高攻擊意願", tendency("aggressiveEarlySwing", "hitterPitch") >= .95);
verify("3. Fixture B：aggressive 正確辨認 chasePitch 時高度偏 Take", tendency("aggressiveEarlySwing", "chasePitch") <= .1);
verify("4. Fixture C：chasePitch 被誤認為 competitiveStrike 時 aggressive Swing 明顯可達", tendency("aggressiveEarlySwing", "competitiveStrike") >= .8 && tendency("aggressiveEarlySwing", "competitiveStrike") > tendency("aggressiveEarlySwing", "chasePitch") * 5);

const edgeTake = Plate.resolveNextPitch(state("patientSelection", 0, "narrow-edge"), { observe: 20, baseballIQ: 20, ballSense: 20 }, {
  pitch: { pitchLocationClass: "edgeStrike" }, recognitionRoll: 0, decisionRoll: .5
});
verify("5. Fixture D：0-0 narrow zone 正確辨認 edgeStrike 時正常 Take 並成 Strike 1", edgeTake.event.action === "take" && edgeTake.event.pitchResult === "calledStrike" && edgeTake.state.strikes === 1 && edgeTake.event.attackWindow === "outside");
verify("6. Fixture E：narrow zone 仍明顯攻擊 hitterPitch，不是 take-all", tendency("patientSelection", "hitterPitch") >= .85);
verify("7. Fixture F：balanced 對 competitiveStrike 保持正常攻擊傾向", tendency("balancedAttack", "competitiveStrike") >= .65 && tendency("balancedAttack", "competitiveStrike") < .9);

const ordinaryApproaches = ["aggressiveEarlySwing", "patientSelection", "balancedAttack", "compactContact"];
verify("8. Fixture G：全部普通 approach 正確辨認 clearBall 時均高度偏 Take", ordinaryApproaches.every(approach => tendency(approach, "clearBall") <= .02));
verify("9. Fixture G：全部普通 approach 的 correct chase 明顯低於 hitter／competitive", ordinaryApproaches.every(approach => tendency(approach, "chasePitch") < tendency(approach, "competitiveStrike") * .2 && tendency(approach, "chasePitch") < tendency(approach, "hitterPitch") * .2));
verify("10. Fixture H：patient two-strike edge protection 明顯高於 0-0", tendency("patientSelection", "edgeStrike", 2) >= .75 && tendency("patientSelection", "edgeStrike", 2) > tendency("patientSelection", "edgeStrike", 0));
verify("11. Fixture H：兩好球仍不把 chase／clear 變成必揮", tendency("patientSelection", "chasePitch", 2) <= .15 && tendency("patientSelection", "clearBall", 2) <= .06);

verify("12. Attack Window 區分 core／conditional／outside 而非 strike-zone equivalence", Plate.getSwingTendency(state("patientSelection"), recognition("hitterPitch")).attackWindow === "core" && Plate.getSwingTendency(state("patientSelection"), recognition("competitiveStrike")).attackWindow === "conditional" && Plate.getSwingTendency(state("patientSelection"), recognition("edgeStrike")).attackWindow === "outside");
verify("13. Approach 不修改 Actual Pitch 或 Recognition object", (() => {
  const pitch = Object.freeze({ pitchLocationClass: "chasePitch", strike: false });
  const read = recognition("competitiveStrike", false);
  const before = JSON.stringify({ pitch, read });
  Plate.getSwingTendency(state("aggressiveEarlySwing"), read);
  Plate.getSwingTendency(state("patientSelection"), read);
  return before === JSON.stringify({ pitch, read });
})());

const decisionHistory = [{
  pitchNumber: 1, pitch: { pitchLocationClass: "chasePitch", strike: false },
  recognition: { correct: false, perceivedPitchClass: "competitiveStrike" },
  selectionProfile: "aggressive", countBefore: { balls: 0, strikes: 0 }, action: "swing", contact: true, pitchResult: "ballInPlay"
}];
const qualityForResult = result => Plate.summarizeQualities(Plate.createPlateAppearanceState({ paIdentity: `outcome-${result}`, approach: "aggressiveEarlySwing", pitchHistory: decisionHistory, result, completed: true })).decisionQuality;
verify("14. Outcome 不回寫 Decision Quality", qualityForResult("single") === qualityForResult("out"));
verify("15. Recognition error + aggressive intent 的 swing 可被評為符合當時 perceived attack window", qualityForResult("out") === "strong");

const saved = Plate.resolveNextPitch(state("patientSelection", 0, "semantic-save"), { observe: 20, baseballIQ: 20, ballSense: 20 }, {
  pitch: { pitchLocationClass: "edgeStrike" }, recognitionRoll: 0, decisionRoll: .5
}).state;
const restored = Plate.normalizePlateAppearanceState(JSON.parse(JSON.stringify(saved)));
verify("16. Save／reload 保留相同 swing decision evidence 且不 reroll", JSON.stringify(restored) === JSON.stringify(saved));

const sampleSize = 2000;
function semanticRate(approach, perceivedPitchClass, strikes = 0) {
  const threshold = tendency(approach, perceivedPitchClass, strikes);
  let swings = 0;
  for (let index = 0; index < sampleSize; index += 1) {
    if (Plate.deterministicUnit(`semantic-audit-${index}`, "swing-decision|1") < threshold) swings += 1;
  }
  return swings / sampleSize;
}
const audit = Object.fromEntries(ordinaryApproaches.map(approach => [approach, {
  hitter: semanticRate(approach, "hitterPitch"),
  competitive: semanticRate(approach, "competitiveStrike"),
  edge: semanticRate(approach, "edgeStrike"),
  chase: semanticRate(approach, "chasePitch"),
  clear: semanticRate(approach, "clearBall")
}]));
verify("17. Statistical audit：aggressive 0-0 hitter swing rate 不低於 narrow zone", audit.aggressiveEarlySwing.hitter >= audit.patientSelection.hitter);
verify("18. Statistical audit：narrow-zone edge swing rate 低於 aggressive 與 balanced", audit.patientSelection.edge < audit.aggressiveEarlySwing.edge && audit.patientSelection.edge < audit.balancedAttack.edge);
verify("19. Statistical audit：各普通 approach correct chase／clear 均維持低 Swing", Object.values(audit).every(item => item.chase < item.competitive * .2 && item.clear < .03));
verify("20. Statistical audit：misrecognized chase as competitive 的 Swing 顯著高於 correct chase", semanticRate("aggressiveEarlySwing", "competitiveStrike") > semanticRate("aggressiveEarlySwing", "chasePitch") * 5);

console.log(`\nPlate Approach semantic audit: ${JSON.stringify(audit)}`);
console.log(`Plate Approach Semantic Integrity focused tests: ${passed}/${passed} passed`);
