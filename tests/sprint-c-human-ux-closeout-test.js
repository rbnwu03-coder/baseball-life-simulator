const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const BatterAnticipation = require("../batter-anticipation.js");
const OffensivePlateApproach = require("../offensive-plate-approach.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const challengeAnticipation = Object.freeze({
  subjectivePitchDistribution: { hitterPitch: 0.3, competitiveStrike: 0.3, edgeStrike: 0.16, chasePitch: 0.14, clearBall: 0.1 },
  anticipationConfidence: 0.82,
  interpretationResult: { uncertainty: 0.24 },
  observationResult: { observedPitchClasses: [], observedCues: [] }
});
const unclearAnticipation = Object.freeze({
  subjectivePitchDistribution: { hitterPitch: 0.2, competitiveStrike: 0.25, edgeStrike: 0.2, chasePitch: 0.2, clearBall: 0.15 },
  anticipationConfidence: 0.24,
  interpretationResult: { uncertainty: 0.72 },
  observationResult: { observedPitchClasses: [], observedCues: [] }
});
function pitchEvent(pitchLocationClass, options = {}) {
  return {
    pitch: { pitchLocationClass },
    recognition: { correct: options.correct !== false, perceivedPitchClass: options.perceivedPitchClass || pitchLocationClass },
    action: options.action || "take",
    contact: options.action === "swing" ? options.contact === true : null,
    pitchResult: options.pitchResult || (options.action === "swing" ? "swingingStrike" : "calledStrike")
  };
}

const noDirection = BatterAnticipation.createPostPAExplainability({ anticipation: unclearAnticipation, pitchEvent: pitchEvent("competitiveStrike"), outcomeText: "主審判定好球" });
verify("1. No-direction + correct recognition 使用棒球事件語言", noDirection.openingAttributionText.includes("沒有明確預判") && noDirection.openingAttributionText.includes("看清") && !/(決定|分開記錄|反向|simulation|canonical|resolver|state)/i.test(noDirection.openingAttributionText));

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js",
  "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js",
  "pitcher-mental-state.js", "pitcher-process-state.js", "pitch-sequencing.js", "batter-anticipation.js",
  "offensive-plate-approach.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
  "playing-time-game-exposure.js", "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "story.js", "save.js", "script.js"
];
const nodes = new Map();
const context = vm.createContext({
  console, module: { exports: {} },
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; } });
      return nodes.get(id);
    },
    querySelector() { return null; }, querySelectorAll() { return []; }
  },
  localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
function evaluate(code) { return vm.runInContext(code, context); }

const secureFirst = evaluate(`formatDefensiveOutcomeAttribution(
  {outs:0,runners:["r1",null,null]},
  {activeRoute:"secureFirstBaseOut",outsCreated:1,runnerChanges:[{runnerId:"r1",from:1,to:2},{runnerId:"b",from:"batter",to:"out"}],runnersAfter:[null,"r1",null]}, "")`);
verify("2. secureFirstBaseOut 明確說一壘與打者出局", secureFirst.includes("一壘") && secureFirst.includes("打者出局") && secureFirst.includes("一壘跑者從一壘推進到二壘") && secureFirst.includes("1 出局、二壘有人"));

const leadRunner = evaluate(`formatDefensiveOutcomeAttribution(
  {outs:1,runners:[null,"r2",null]},
  {activeRoute:"attackLeadRunnerThird",outsCreated:1,runnerChanges:[{runnerId:"r2",from:2,to:"out"},{runnerId:"b",from:"batter",to:1}],runnersAfter:["b",null,null]}, "")`);
verify("3. lead-runner route 明確說三壘目標且不同於抓打者", leadRunner.includes("傳向三壘") && leadRunner.includes("原二壘跑者") && leadRunner.includes("打者趁機安全上一壘") && leadRunner !== secureFirst);

const genericCues = evaluate(`getHighSchoolOpponentObservableCues({runners:["r1",null,null],opponentTacticalTruth:{code:"shortSwing"}}).join(" ")`);
verify("4. 無正式 tactical truth 的 generic event 不呈現短打語意", !/(短棒|觸擊|強迫取分|打帶跑|靠近本壘板)/.test(genericCues) && genericCues.includes("速度與落點"));

const coachHtml = evaluate(`renderHighSchoolCoachDirection({completed:false,coachLine:"把眼前的跑者壓在原壘。",coachDirection:{domain:"defense",priority:"先確認最短出局目標"}})`);
verify("5. Coach instruction 標為戰術期待而非推薦答案", coachHtml.includes("戰術期待") && !/(優先事項|推薦|最佳|應該選)/.test(coachHtml));

const singleModel = evaluate(`createHighSchoolOffensiveExplainabilityModel({batterAnticipation:${JSON.stringify(challengeAnticipation)},pitchHistory:[{pitch:{pitchLocationClass:"competitiveStrike"},recognition:{correct:true},action:"swing",contact:true,pitchResult:"ballInPlay"}],outcome:"一壘安打"})`);
const singleHtml = evaluate(`renderHighSchoolOffensiveExplainability(${JSON.stringify(singleModel)})`);
verify("6. Single-pitch PA 壓縮 opening/final 重複術語", singleHtml.includes("實際來球") && singleHtml.includes("你的辨認") && singleHtml.includes("你的處理") && !/(實際第一球|第一球辨認|最後一次處理)/.test(singleHtml));

const multiModel = evaluate(`createHighSchoolOffensiveExplainabilityModel({batterAnticipation:${JSON.stringify(challengeAnticipation)},pitchHistory:[{pitch:{pitchLocationClass:"competitiveStrike"},recognition:{correct:true},action:"take",contact:null,pitchResult:"calledStrike"},{pitch:{pitchLocationClass:"chasePitch"},recognition:{correct:false},action:"swing",contact:false,pitchResult:"swingingStrike"}],outcome:"三振"})`);
const multiHtml = evaluate(`renderHighSchoolOffensiveExplainability(${JSON.stringify(multiModel)})`);
verify("7. Multi-pitch PA 保留 opening attribution 與 final execution", multiModel.directionMatched === true && multiModel.actualPitchText.includes("好球") && multiModel.executionText.includes("沒有碰到") && multiHtml.includes("實際第一球") && multiHtml.includes("第一球辨認") && multiHtml.includes("最後一次處理"));

const normalPlayerText = [noDirection.openingAttributionText, secureFirst, leadRunner, genericCues, coachHtml, singleHtml, multiHtml].join(" ");
verify("8. Focused normal UI 不含 engine contract language", !/(reverse inference|simulation|canonical|resolver|execution window|選擇品質|分開記錄|依實際狀態繼續|系統自動)/i.test(normalPlayerText));

const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
verify("9. patientSelection 文案不再承諾絕對放掉所有邊角球", scriptSource.includes("盡量放掉邊角球") && !scriptSource.includes("邊角球放掉，只打真正進入甜蜜點"));

const auditAbilities = { observe: 9, baseballIQ: 9, ballSense: 9, batting: 9 };
function auditSwing(approach, pitchLocationClass, recognitionCorrect, strikes = 0, samples = 2000) {
  let swings = 0;
  for (let index = 0; index < samples; index += 1) {
    const state = OffensivePlateApproach.createPlateAppearanceState({ matchId: "ux-audit", paId: `${approach}-${pitchLocationClass}-${recognitionCorrect}-${strikes}-${index}`, batterId: "player", approach, strikes });
    const resolved = OffensivePlateApproach.resolveNextPitch(state, auditAbilities, {
      pitch: { pitchLocationClass }, recognitionRoll: recognitionCorrect ? 0 : 1, contactRoll: 1
    });
    if (resolved.event.action === "swing") swings += 1;
  }
  return Object.freeze({ samples, swings, takes: samples - swings, swingRate: Number((swings / samples).toFixed(4)), takeRate: Number(((samples - swings) / samples).toFixed(4)) });
}

const audit = Object.freeze({
  patientCompetitiveCorrect: auditSwing("patientSelection", "competitiveStrike", true),
  patientCompetitiveIncorrect: auditSwing("patientSelection", "competitiveStrike", false),
  patientEdgeCorrect: auditSwing("patientSelection", "edgeStrike", true),
  patientEdgeIncorrect: auditSwing("patientSelection", "edgeStrike", false),
  patientChaseCorrect: auditSwing("patientSelection", "chasePitch", true),
  patientChaseIncorrect: auditSwing("patientSelection", "chasePitch", false),
  aggressiveEdgeCorrect: auditSwing("aggressiveEarlySwing", "edgeStrike", true),
  aggressiveEdgeIncorrect: auditSwing("aggressiveEarlySwing", "edgeStrike", false),
  balancedEdgeCorrect: auditSwing("balancedAttack", "edgeStrike", true),
  balancedEdgeIncorrect: auditSwing("balancedAttack", "edgeStrike", false),
  compactEdgeCorrect: auditSwing("compactContact", "edgeStrike", true),
  compactEdgeIncorrect: auditSwing("compactContact", "edgeStrike", false),
  patientEdgeTwoStrikeCorrect: auditSwing("patientSelection", "edgeStrike", true, 2)
});
verify("10. patientSelection 正確辨認 edgeStrike 時大多 Take", audit.patientEdgeCorrect.takeRate > 0.7 && audit.patientEdgeCorrect.swingRate < 0.3);
verify("11. patientSelection 對 edgeStrike 與 aggressive/balanced/compact 有 semantic differentiation", audit.patientEdgeCorrect.swingRate < audit.aggressiveEdgeCorrect.swingRate && audit.patientEdgeCorrect.swingRate < audit.balancedEdgeCorrect.swingRate && audit.patientEdgeCorrect.swingRate < audit.compactEdgeCorrect.swingRate);
verify("12. Recognition 分層實際影響各 pitch-class Swing/Take", audit.patientCompetitiveCorrect.swingRate > audit.patientCompetitiveIncorrect.swingRate && audit.patientEdgeCorrect.swingRate > audit.patientEdgeIncorrect.swingRate && audit.patientChaseCorrect.swingRate < audit.patientChaseIncorrect.swingRate);
verify("13. 兩好球 edgeStrike 保護機制可解釋人工看到的出棒", audit.patientEdgeTwoStrikeCorrect.swingRate > 0.75 && audit.patientEdgeTwoStrikeCorrect.swingRate > audit.patientEdgeCorrect.swingRate);
console.log(`AUDIT ${JSON.stringify(audit)}`);
console.log(`\nSprint C Human UX Closeout：${passed}/${passed} 通過`);
