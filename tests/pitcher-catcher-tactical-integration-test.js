const assert = require("assert");
const fs = require("fs");
const path = require("path");
const PitchSequencing = require("../pitch-sequencing.js");
const Tactical = require("../pitcher-catcher-tactical-integration.js");
const OffensivePlateApproach = require("../offensive-plate-approach.js");
const MatchSituationLifecycle = require("../match-situation-lifecycle.js");
const PlateDecisionFoundation = require("../plate-decision-foundation.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const runtime = PitchSequencing.createPitcherRuntimeState({
  runtimeId: "tactical-test-pitcher",
  control: 8,
  mentalState: { arousal: 50, confidence: 55, cognitiveLoad: 45, resultAttachment: 45 },
  processState: { rhythm: 58, aggression: 52, tempo: 54, precisionIntent: 56 }
});

function frozenFor(balls, strikes) {
  return PitchSequencing.freezePitchDistribution(PitchSequencing.buildStrategicPitchDistribution({ balls, strikes }, runtime.processState));
}

function tactical(input = {}) {
  return Tactical.createTacticalPitchDecision({
    paIdentity: input.paIdentity || "game-a|pa-a|player|5|bottom",
    pitchIndex: input.pitchIndex || 1,
    balls: input.balls || 0,
    strikes: input.strikes || 0,
    context: input.context || { outs: 1, runners: [null, "runner-2", null], scores: { home: 1, away: 1 }, highLeverage: true, scoringPosition: true },
    pitcherRuntime: input.pitcherRuntime || runtime,
    frozenDistribution: input.frozenDistribution || frozenFor(input.balls || 0, input.strikes || 0),
    sequenceHistory: input.sequenceHistory || [],
    intentOverride: input.intentOverride,
    intentRoll: input.intentRoll,
    realizationRoll: input.realizationRoll
  });
}

const challenge = tactical({ balls: 3, strikes: 0, intentOverride: "challenge" });
verify("A1. 3-0 challenge 建立具名 tactical intent", challenge.intentDecision.selectedIntent === "challenge");
verify("A2. challenge recommendation 使用既有可執行 pitch class", ["hitterPitch", "competitiveStrike"].includes(challenge.catcherRecommendation.recommendedPitchClass) && challenge.catcherRecommendation.compatibility.availablePitchClasses.includes(challenge.catcherRecommendation.recommendedPitchClass));
verify("A3. AI pitcher 明確保存 recommended／accepted compatibility path", challenge.pitcherResponse.recommended && challenge.pitcherResponse.accepted && challenge.pitcherResponse.source === "automaticCompatibility");
verify("A4. 接受的 call 只設定 intended pitch，actual 仍由既有 control authority 產生", challenge.pitchDecision.intendedPitchClass === challenge.pitcherResponse.acceptedPitchClass && challenge.pitchDecision.debugTrace.intendedPitchSource === "acceptedTacticalCall" && challenge.pitchDecision.controlRealization.realizationCause);

let poorExpand = null;
for (let index = 0; index < 10000 && !poorExpand; index += 1) {
  const candidate = tactical({ paIdentity: "game-b|pa-b", pitchIndex: 1, strikes: 2, intentOverride: "expand", realizationRoll: index / 10000 });
  if (candidate.pitchDecision.controlRealization.realizationDistance >= 2) poorExpand = candidate;
}
verify("B1. 0-2 expand 形成 outer-low 類抽象目標", poorExpand?.intentDecision.selectedIntent === "expand" && poorExpand.catcherRecommendation.targetLocation === "outerLow");
verify("G1. Good call / poor execution 合法保留 expand intent 與 execution miss", poorExpand?.pitchDecision.controlRealization.realizationQuality === "majorDrift" && poorExpand.pitchDecision.actualPitchClass !== poorExpand.pitchDecision.intendedPitchClass);
verify("G2. 捕手 recommendation 沒有直接建立 actual pitch truth", !Object.hasOwn(poorExpand.catcherRecommendation, "actualPitchClass") && !Object.hasOwn(poorExpand.catcherRecommendation, "pitchResult"));

const successfulFeedback = Tactical.normalizeFeedback({
  tacticalIdentity: "game-c|pa-c|pitch-1|tactical",
  pitchIdentity: "game-c|pa-c|pitch-1",
  intent: "expand",
  recommendedPitchClass: "chasePitch",
  target: "outerLow",
  actualPitchClass: "chasePitch",
  actualLocation: "outer-below",
  pitchResult: "swingingStrike",
  batterAction: "swing",
  observableBatterResponse: { chased: true, whiffed: true },
  executionQuality: "heldTarget"
});
const repeat = tactical({ paIdentity: "game-c|pa-c", pitchIndex: 2, strikes: 1, sequenceHistory: [successfulFeedback], intentOverride: "repeatSuccess" });
verify("C1. chase／whiff 使 repeatSuccess 成為正式 eligible candidate", repeat.intentDecision.eligibility.repeatSuccess === true);
verify("C2. repeatSuccess 保存 recentSuccess 與 batterChase reason codes", repeat.catcherRecommendation.reasonCodes.includes("recentSuccess") && repeat.catcherRecommendation.reasonCodes.includes("batterChase"));
verify("C3. repeatSuccess 建議相同 pitch family 與 target", repeat.catcherRecommendation.recommendedPitchClass === "chasePitch" && repeat.catcherRecommendation.targetLocation === "outerLow");

const repeatRollSelections = new Set([0, 0.25, 0.5, 0.75, 0.99].map(roll => tactical({ paIdentity: "game-c|pa-c", pitchIndex: 2, strikes: 1, sequenceHistory: [successfulFeedback], intentRoll: roll }).intentDecision.selectedIntent));
verify("C4. repeatSuccess 是 tactical candidate 而非必然鎖定", repeatRollSelections.has("repeatSuccess") && repeatRollSelections.size > 1);

const repeatAgain = tactical({ paIdentity: "game-c|pa-c", pitchIndex: 3, strikes: 1, sequenceHistory: [successfulFeedback], intentOverride: "repeatSuccess" });
verify("D1. 相同 recommendation 仍建立新的 pitch／tactical identity", repeatAgain.catcherRecommendation.recommendedPitchClass === repeat.catcherRecommendation.recommendedPitchClass && repeatAgain.context.pitchIdentity !== repeat.context.pitchIdentity && repeatAgain.tacticalIdentity !== repeat.tacticalIdentity);
verify("D2. 每球 control realization 依新 identity 獨立存在", repeatAgain.pitchDecision.identity !== repeat.pitchDecision.identity && repeatAgain.pitchDecision.controlRealization.realizationRoll !== undefined);

const failedRepeatFeedback = Tactical.normalizeFeedback({
  tacticalIdentity: repeat.tacticalIdentity,
  pitchIdentity: repeat.context.pitchIdentity,
  intent: "repeatSuccess",
  recommendedPitchClass: "chasePitch",
  target: "outerLow",
  actualPitchClass: "hitterPitch",
  actualLocation: "middle-middle",
  pitchResult: "ballInPlay",
  batterAction: "swing",
  observableBatterResponse: { contacted: true, hardContactObservable: true },
  executionQuality: "majorDrift"
});
const afterFailedRepeat = tactical({ paIdentity: "game-c|pa-c", pitchIndex: 3, sequenceHistory: [successfulFeedback, failedRepeatFeedback], intentRoll: 0 });
verify("E1. failed repeat 的 hard contact 與 command miss 進入下一球 context", afterFailedRepeat.context.previousSwingContactResponse === "hardContactObservable" && afterFailedRepeat.context.previousCommandResult === "majorDrift");
verify("E2. repeat success flag 不會永久 sticky", !afterFailedRepeat.intentDecision.eligibility.repeatSuccess && afterFailedRepeat.intentDecision.safeguards.noStickySuccess);
verify("E3. failed repeat 提高 changeLook 並留下 batterHardContact／commandConcern reason", afterFailedRepeat.intentDecision.candidateScores.changeLook > afterFailedRepeat.intentDecision.candidateScores.repeatSuccess && afterFailedRepeat.catcherRecommendation.reasonCodes.includes("batterHardContact") && afterFailedRepeat.catcherRecommendation.reasonCodes.includes("commandConcern"));

const repeatedHistory = [1, 2].map(index => Tactical.normalizeFeedback({
  tacticalIdentity: `game-f|pa-f|pitch-${index}|tactical`, pitchIdentity: `game-f|pa-f|pitch-${index}`,
  intent: "expand", recommendedPitchClass: "edgeStrike", target: "outerLow", actualPitchClass: "edgeStrike",
  actualLocation: "outer-low", pitchResult: "foul", batterAction: "swing", observableBatterResponse: { fouled: true, contacted: true }, executionQuality: "heldTarget"
}));
const changeLook = tactical({ paIdentity: "game-f|pa-f", pitchIndex: 3, sequenceHistory: repeatedHistory, intentOverride: "changeLook" });
const allowedRepeat = tactical({ paIdentity: "game-f|pa-f", pitchIndex: 3, sequenceHistory: repeatedHistory, intentOverride: "repeatSuccess" });
verify("F1. 近期相同 call 使 changeLook 成為 plausible candidate", changeLook.intentDecision.eligibility.changeLook && changeLook.catcherRecommendation.reasonCodes.includes("changeLookAfterRepeat"));
verify("F2. changeLook 偏離最近 family，但沒有 anti-repeat 禁令", changeLook.catcherRecommendation.recommendedPitchClass !== "edgeStrike" && allowedRepeat.catcherRecommendation.recommendedPitchClass === "edgeStrike");

const contextKeys = ["paIdentity", "pitchIndex", "count", "outs", "bases", "score", "pitcherState", "recentPitchClasses", "previousPitchResult", "previousBatterDecision", "previousRecognitionQuality", "previousSwingContactResponse", "previousCommandResult"];
verify("H1. canonical tactical context 包含規定的最小情境", contextKeys.every(key => Object.hasOwn(repeat.context, key)));
verify("H2. tactical context 不保存 hidden recognition／perception／RNG truth", !JSON.stringify(repeat.context).includes("perceivedPitch") && !JSON.stringify(repeat.context).includes("recognitionRoll") && !JSON.stringify(repeat.context).includes("hiddenProbability"));
verify("H3. 新 PA 即使 current pitch history 為空，仍從 match-local tactical history 延續 recent classes", Tactical.buildTacticalContext({ paIdentity: "game-h|new-pa", pitchIndex: 1, recentPitchClasses: [], sequenceHistory: repeatedHistory, pitcherRuntime: runtime }).recentPitchClasses.join(",") === "edgeStrike,edgeStrike");

let pa = OffensivePlateApproach.createPlateAppearanceState({
  paIdentity: "game-i|pa-i|player|5|bottom", batterId: "player", approach: "balancedAttack", pitcherRuntime: runtime,
  context: { gameId: "game-i", outs: 1, runners: [null, null, null], scores: { home: 0, away: 0 } }
});
pa = OffensivePlateApproach.prepareNextPitch(pa);
verify("I1. production pending pitch 保存 intent／recommendation／acceptance／pitch identity", pa.pendingPitch.pitchTacticalState?.context.pitchIdentity === pa.pendingPitch.pitchId && pa.pendingPitch.pitchTacticalState?.catcherRecommendation && pa.pendingPitch.pitchTacticalState?.pitcherResponse.accepted);
const beforeReload = JSON.stringify(pa);
const reloadedBeforePitch = OffensivePlateApproach.normalizePlateAppearanceState(JSON.parse(beforeReload));
verify("I2. pitch execution 前 save/reload 不改 tactical state 或 pitch truth", JSON.stringify(reloadedBeforePitch) === beforeReload);

const firstResolved = OffensivePlateApproach.resolveNextPitch(pa, { batting: 7, power: 7, observe: 7, ballSense: 7, reaction: 7 }, { decisionRoute: "powerSwing", recognitionRoll: 0, timingRoll: 1, batToBallRoll: 1 });
verify("J1. pitch 結束後建立 minimal observable tactical feedback", firstResolved.event.tacticalFeedback?.observableBatterResponse.whiffed && !Object.hasOwn(firstResolved.event.tacticalFeedback, "recognition"));
verify("J2. PA state 保存 bounded tactical sequence history", firstResolved.state.tacticalSequenceHistory.length === 1 && firstResolved.state.tacticalSequenceHistory[0].pitchIdentity === firstResolved.event.pitch.pitchId);
const reloadedAfterPitch = OffensivePlateApproach.normalizePlateAppearanceState(JSON.parse(JSON.stringify(firstResolved.state)));
verify("J3. previous pitch 後 save/reload 不遺失 sequence history", JSON.stringify(reloadedAfterPitch.tacticalSequenceHistory) === JSON.stringify(firstResolved.state.tacticalSequenceHistory));
const nextPrepared = OffensivePlateApproach.prepareNextPitch(reloadedAfterPitch);
verify("J4. next-pitch reassessment 建立新 recommendation object 與 identity", nextPrepared.pendingPitch.pitchId !== firstResolved.event.pitch.pitchId && nextPrepared.pendingPitch.pitchTacticalState.tacticalIdentity !== firstResolved.event.pitch.pitchTacticalState.tacticalIdentity && nextPrepared.pendingPitch.pitchTacticalState.context.previousSwingContactResponse === "whiffed");

let longHistory = [];
for (let index = 1; index <= 10; index += 1) longHistory.push({ ...successfulFeedback, pitchIdentity: `history-${index}` });
verify("J5. tactical sequence memory 嚴格限制最近六球", Tactical.normalizeSequenceHistory(longHistory).length === 6 && Tactical.normalizeSequenceHistory(longHistory)[0].pitchIdentity === "history-5");

const nonPlayer = OffensivePlateApproach.simulatePlateAppearance({
  paIdentity: "game-k|pa-ai|ai-batter", batterId: "ai-batter", approach: "balancedAttack", pitcherRuntime: runtime,
  abilities: { batting: 7, power: 7, observe: 7, ballSense: 7, reaction: 7 }
});
verify("K1. AI／non-player batter 既有 simulation 仍能完成單一 PA", nonPlayer.completed && nonPlayer.result && nonPlayer.pitchHistory.length >= 1 && nonPlayer.pitchHistory.length <= OffensivePlateApproach.ABSOLUTE_PITCH_SAFETY_CAP);

const situationPrepared = PlateDecisionFoundation.prepare({
  gameId: "game-l", inning: 5, half: "bottom", batterId: "player", pitcherId: "pitcher",
  plateAppearanceState: pa, abilities: { observe: 8, baseballIQ: 8, ballSense: 8 }, recognitionRoll: 0, playerOwnsDecision: true
});
const playerFacing = PlateDecisionFoundation.getPlayerFacingContext(situationPrepared.situation);
verify("L1. Plate Decision 玩家 context 不洩漏 tactical intent／catcher call／acceptance", !JSON.stringify(playerFacing).includes("tacticalIntent") && !JSON.stringify(playerFacing).includes("catcherRecommendation") && !JSON.stringify(playerFacing).includes("automaticCompatibility"));
verify("L2. Plate Decision 仍只呈現 perceived pitch 與三條 batter routes", playerFacing.perceivedPitch && playerFacing.routes.map(route => route.routeId).join(",") === "take,contactSwing,powerSwing");

verify("Trace. developer trace 可回答 context／intent／reason／call／acceptance／execution", ["context", "intent", "reasonCodes", "catcherRecommendation", "pitcherResponse", "execution"].every(key => Object.hasOwn(repeat.developerTrace, key)));
verify("Authority. 新模組不使用 Math.random、Date.now 或 UUID identity", (() => { const source = fs.readFileSync(path.join(__dirname, "..", "pitcher-catcher-tactical-integration.js"), "utf8"); return !source.includes("Math.random") && !source.includes("Date.now") && !source.includes("randomUUID"); })());
const indexHtml = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
verify("Load order. Tactical Integration 在 Pitch Sequencing 後、OPA 前載入", indexHtml.indexOf("pitch-sequencing.js") < indexHtml.indexOf("pitcher-catcher-tactical-integration.js") && indexHtml.indexOf("pitcher-catcher-tactical-integration.js") < indexHtml.indexOf("offensive-plate-approach.js"));

console.log(`\nPitcher / Catcher Tactical Integration v1：${passed}/${passed} 通過`);
