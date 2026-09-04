const assert = require("assert");
const Plate = require("../offensive-plate-approach.js");
const Lifecycle = require("../match-situation-lifecycle.js");
const Decision = require("../plate-decision-foundation.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const abilities = { observe: 9, baseballIQ: 9, ballSense: 9, reaction: 9, batting: 9, power: 9, bats: "R" };
function state(id, count = {}) {
  return Plate.createPlateAppearanceState({
    matchId: "plate-foundation", paId: id, batterId: "player", approach: "balancedAttack",
    balls: count.balls || 0, strikes: count.strikes || 0, context: { pitcherId: "pitcher-1" }
  });
}
function prepare(id, pitch, count = {}, recognitionRoll = 0) {
  return Decision.prepare({ gameId: "game-1", inning: 5, half: "下", batterId: "player", pitcherId: "pitcher-1", plateAppearanceState: state(id, count), abilities, pitch, recognitionRoll });
}
function resolve(prepared, routeId, executionOptions = {}) {
  return Decision.resolve({ situation: prepared.situation, plateAppearanceState: prepared.plateAppearanceState, routeId, abilities, recognition: prepared.recognition, executionOptions });
}
const ballPitch = { pitchLocationClass: "clearBall", pitchType: "changeup", velocity: 79, movement: "fading", location: "below-zone" };
const strikePitch = { pitchLocationClass: "competitiveStrike", pitchType: "fastball", velocity: 91, movement: "subtle", location: "outer-middle" };

const takeBall = resolve(prepare("take-ball", ballPitch), "take");
verify("A. Take actual ball 由 actual zone truth 判為壞球", takeBall.event.pitchResult === "ball" && takeBall.plateAppearanceState.balls === 1);
const takeStrike = resolve(prepare("take-strike", strikePitch), "take");
verify("B. Take actual strike 仍判為好球", takeStrike.event.pitchResult === "calledStrike" && takeStrike.plateAppearanceState.strikes === 1);

const contact = resolve(prepare("contact-success", strikePitch), "contactSwing", { timingRoll: 0, batToBallRoll: 0, foulRoll: 1, physicalRolls: { contactQuality: .6, ballType: .2, pace: .5, direction: .6 }, outcomeRoll: .5 });
verify("C1. Contact Swing 成功先形成 contact 再進 BBP", contact.event.pitchResult === "ballInPlay" && contact.event.contact === true && contact.event.battedBallPhysicalTruth?.identity);
verify("C2. Plate Decision 不自行建立第二套 contact authority", contact.event.battedBallPhysicalTruth.version === "batted-ball-physical-v1" && contact.event.battedBallPhysicalTruth.identity === contact.plateAppearanceState.battedBallPhysicalTruth.identity);

const contactMiss = resolve(prepare("contact-miss", strikePitch), "contactSwing", { timingRoll: 1, batToBallRoll: 0 });
verify("D. Contact Swing timing failure 形成 swinging strike", contactMiss.event.pitchResult === "swingingStrike" && contactMiss.event.executionEvidence.timing.roll === 1);

const contactProfile = Plate.getSwingExecutionProfile(state("profile-contact"), strikePitch, abilities, { correct: true, recognitionState: "accurate" }, "contactSwing");
const powerProfile = Plate.getSwingExecutionProfile(state("profile-power"), strikePitch, abilities, { correct: true, recognitionState: "accurate" }, "powerSwing");
verify("E1. Power Swing 有較高 damage ceiling 與較小 timing window", powerProfile.damageCeiling > contactProfile.damageCeiling && powerProfile.timingWindow < contactProfile.timingWindow);
const powerContact = resolve(prepare("power-contact", strikePitch), "powerSwing", { timingRoll: 0, batToBallRoll: 0, foulRoll: 1, physicalRolls: { contactQuality: .9, ballType: .5, pace: .9, direction: .5, depth: .8 }, outcomeRoll: .6 });
verify("E2. Power Swing 成功只提供強接觸輸入，不直接保證安打", powerContact.event.pitchResult === "ballInPlay" && powerContact.event.executionEvidence.contactQuality.damageCeiling === powerProfile.damageCeiling && Boolean(powerContact.event.battedBallPhysicalTruth));
const powerMiss = resolve(prepare("power-miss", strikePitch), "powerSwing", { timingRoll: .9, batToBallRoll: .9 });
verify("F. Power Swing 小窗口可形成揮空", powerMiss.event.pitchResult === "swingingStrike" && powerMiss.event.plateDecision === "powerSwing");

const misreadPrepared = prepare("misread", { pitchLocationClass: "chasePitch", pitchType: "slider", velocity: 82, movement: "breaking", location: "outer-below" }, {}, 1);
verify("G1. Actual breaking ball outside 可被誤判為可攻擊球", misreadPrepared.plateAppearanceState.pendingPitch.strike === false && misreadPrepared.recognition.recognitionState === "misread" && misreadPrepared.recognition.perceivedPitchClass === "competitiveStrike");
const misreadSwing = resolve(misreadPrepared, "contactSwing", { timingRoll: 0, batToBallRoll: 0, foulRoll: 1, physicalRolls: { contactQuality: .4, ballType: .2, pace: .4, direction: .4 }, outcomeRoll: .4 });
verify("G2. Recognition error 不改寫 actual pitch truth", misreadSwing.event.pitch.strike === false && misreadSwing.event.pitch.pitchType === "slider");
const recognitionState = state("recognition-states");
const recognitionPitch = Plate.prepareNextPitch(recognitionState, strikePitch).pendingPitch;
const recognitionBase = Plate.getRecognitionResult(recognitionState, recognitionPitch, abilities, 0);
const partialRecognition = Plate.getRecognitionResult(recognitionState, recognitionPitch, abilities, Math.min(.98, recognitionBase.accuracy + .05));
const lateRecognition = Plate.getRecognitionResult(recognitionState, recognitionPitch, abilities, Math.min(.99, recognitionBase.accuracy + .15));
verify("G3. Recognition 可形成 accurate／partial／late 等分層", recognitionBase.recognitionState === "accurate" && partialRecognition.recognitionState === "partial" && lateRecognition.recognitionState === "late");

const foul = resolve(prepare("two-strike-foul", strikePitch, { strikes: 2 }), "contactSwing", { timingRoll: 0, batToBallRoll: 0, foulRoll: 0 });
verify("H. Two-strike normal foul 保持兩好球", foul.event.pitchResult === "foul" && foul.plateAppearanceState.strikes === 2 && !foul.plateAppearanceState.completed);
const strikeout = resolve(prepare("strikeout", strikePitch, { strikes: 2 }), "powerSwing", { timingRoll: 1, batToBallRoll: 1 });
verify("I. 第三個 swinging strike 正式終止為 strikeout", strikeout.plateAppearanceState.completed && strikeout.plateAppearanceState.result === "strikeout");
const walk = resolve(prepare("walk", ballPitch, { balls: 3 }), "take");
verify("J. 第四壞正式終止為 walk", walk.plateAppearanceState.completed && walk.plateAppearanceState.result === "walk");

const beforeSave = prepare("save-before", strikePitch, { balls: 1, strikes: 1 }, .55);
const loadedPA = Plate.normalizePlateAppearanceState(JSON.parse(JSON.stringify(beforeSave.plateAppearanceState)));
const loadedSituation = Lifecycle.normalizeSituation(JSON.parse(JSON.stringify(beforeSave.situation)));
verify("K1. Decision 前 save/reload 保留同一 pitch 與 situation identity", loadedPA.pendingPitch.pitchId === beforeSave.plateAppearanceState.pendingPitch.pitchId && loadedSituation.situationId === beforeSave.situation.situationId);
verify("K2. Frozen snapshot 只有 perceived context 與 actual reference，沒有 outcome leakage", loadedSituation.contextSnapshot.actualPitchRef === loadedPA.pendingPitch.pitchId && !Object.hasOwn(loadedSituation.contextSnapshot, "pitchResult") && !Object.hasOwn(loadedSituation.contextSnapshot, "outcome"));
verify("K3. 玩家 presentation 不暴露 actual pitch type、mph 或 raw coordinates", !JSON.stringify(Decision.getPlayerFacingContext(loadedSituation)).includes("fastball") && !JSON.stringify(Decision.getPlayerFacingContext(loadedSituation)).includes("91"));

const settled = resolve(prepare("idempotent", ballPitch), "take");
const duplicate = Decision.resolve({ situation: settled.situation, plateAppearanceState: settled.plateAppearanceState, routeId: "take", abilities, priorEvent: settled.event });
verify("L. Closed pitch settlement 重送不 double count", duplicate.duplicate && duplicate.plateAppearanceState.balls === 1 && duplicate.plateAppearanceState.pitchNumber === 1);
verify("Lifecycle. Plate Decision 共用 create→admit→present→decide→execute→resolve→settle→close", settled.situation.type === Lifecycle.TYPES.plateDecision && settled.situation.lifecycleState === "closed" && settled.situation.transitionHistory.map(item => item.state).join(",") === "created,admitted,presented,decided,executing,resolved,settled,closed");

console.log(`Plate Decision Foundation tests: ${passed}/${passed} passed`);
