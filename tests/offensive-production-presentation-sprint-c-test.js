const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const BatterAnticipation = require("../batter-anticipation.js");
const PlayingTimeGameExposure = require("../playing-time-game-exposure.js");

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
  observationResult: { observedPitchClasses: ["competitiveStrike", "hitterPitch"], observedCues: ["recentChallengeHeavy", "commandAppearsStable"] }
});
const expansionAnticipation = Object.freeze({
  subjectivePitchDistribution: { hitterPitch: 0.13, competitiveStrike: 0.2, edgeStrike: 0.3, chasePitch: 0.27, clearBall: 0.1 },
  anticipationConfidence: 0.58,
  interpretationResult: { uncertainty: 0.34 },
  observationResult: { observedPitchClasses: ["edgeStrike", "chasePitch"], observedCues: ["recentExpansionPattern"] }
});
const noEvidenceAnticipation = Object.freeze({
  subjectivePitchDistribution: { hitterPitch: 0.2, competitiveStrike: 0.25, edgeStrike: 0.2, chasePitch: 0.2, clearBall: 0.15 },
  anticipationConfidence: 0.24,
  interpretationResult: { uncertainty: 0.72 },
  observationResult: { observedPitchClasses: [], observedCues: [] }
});
const pitchEvent = (pitchLocationClass, options = {}) => ({
  pitch: { pitchLocationClass },
  recognition: { correct: options.correct !== false, perceivedPitchClass: options.perceivedPitchClass || pitchLocationClass },
  action: options.action || "swing",
  contact: options.contact === true,
  pitchResult: options.pitchResult || (options.contact ? "ballInPlay" : "swingingStrike")
});

const cueExpectations = {
  recentChallengeHeavy: "主動進入好球帶",
  recentExpansionPattern: "追出好球帶",
  commandAppearsStable: "相對穩定",
  minorLocationDrift: "有些偏移",
  visibleLocationMiss: "明顯的控球偏差",
  recentCommandInstability: "穩定度正在下降"
};
verify("1. cue formatter 集中支援六種正式 player-facing wording", Object.entries(cueExpectations).every(([cue, token]) => BatterAnticipation.formatObservableCueSummary({ observedCues: [cue] }).join("").includes(token)));
verify("2. no-evidence state 有中性文案而非空白", BatterAnticipation.formatObservableCueSummary({ observedPitchClasses: [], observedCues: [] })[0].includes("沒有足夠線索"));
verify("3. subjective distribution 只轉為 qualitative challenge／expansion／mixed summary", BatterAnticipation.formatAnticipationSummary(challengeAnticipation).includes("可以處理") && BatterAnticipation.formatAnticipationSummary(expansionAnticipation).includes("邊角") && BatterAnticipation.formatAnticipationSummary(noEvidenceAnticipation).includes("難確定"));
verify("4. confidence thresholds 集中映射低／中等／高", BatterAnticipation.formatAnticipationConfidence(0.44) === "低" && BatterAnticipation.formatAnticipationConfidence(0.45) === "中等" && BatterAnticipation.formatAnticipationConfidence(0.72) === "高");

const preChallenge = BatterAnticipation.createPrePAPresentation(challengeAnticipation);
verify("5. player-facing anticipation 不顯示 exact probability", !/[0-9]+(?:\.[0-9]+)?%|0\.\d+/.test(JSON.stringify(preChallenge)));
const moduleSource = fs.readFileSync(path.join(__dirname, "..", "batter-anticipation.js"), "utf8");
verify("6. normal presentation formatter 不讀 hidden pitcher truth", !/(frozenTrueDistribution|intendedPitchClass|pitcherMentalState|pitcherProcessState)/.test([BatterAnticipation.createPrePAPresentation, BatterAnticipation.createPostPAExplainability, BatterAnticipation.formatAnticipationSummary].map(fn => fn.toString()).join("\n")));
verify("7. Actual Pitch formatter 涵蓋五類 abstraction 且不虛構球種／位置", BatterAnticipation.PITCH_CLASSES.every(item => BatterAnticipation.formatPlayerFacingPitchClass(item).length > 5) && !/(直球|滑球|曲球|變速球|內角|外角|球速)/.test(BatterAnticipation.PITCH_CLASSES.map(BatterAnticipation.formatPlayerFacingPitchClass).join("")));

const recognitionGood = BatterAnticipation.formatRecognitionResult({ correct: true }, "chasePitch");
const recognitionBad = BatterAnticipation.formatRecognitionResult({ correct: false }, "chasePitch");
verify("8. Recognition wording 只依 authoritative recognition result", recognitionGood.includes("辨認出") && recognitionBad.includes("沒有完整辨認") && recognitionGood !== recognitionBad);
verify("9. Execution wording 只依 swing／take／contact evidence", BatterAnticipation.formatExecutionResult(pitchEvent("chasePitch", { action: "take", pitchResult: "ball" })).includes("沒有出棒") && BatterAnticipation.formatExecutionResult(pitchEvent("competitiveStrike", { action: "swing", contact: false })).includes("沒有碰到") && BatterAnticipation.formatExecutionResult(pitchEvent("competitiveStrike", { action: "swing", contact: true, pitchResult: "ballInPlay" })).includes("進入場內"));

const outcomeOwned = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, pitchEvent: pitchEvent("competitiveStrike", { contact: true }), outcomeText: "這個打席形成打者出局" });
verify("10. Outcome wording 原樣使用 canonical outcome source", outcomeOwned.outcomeText === "這個打席形成打者出局");
const rescue = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, pitchEvent: pitchEvent("chasePitch", { action: "take", pitchResult: "ball" }), outcomeText: "這一球形成壞球" });
verify("11. Wrong anticipation + Recognition rescue 清楚分離預判與出手後修正", rescue.directionMatched === false && rescue.causalityText.includes("沒有抓到第一球") && rescue.causalityText.includes("修正") && rescue.executionText.includes("沒有出棒"));
const poorExecution = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, pitchEvent: pitchEvent("competitiveStrike", { action: "swing", contact: false }), outcomeText: "你揮棒落空" });
verify("12. Correct anticipation + poor execution 明確表達讀對不等於打到", poorExecution.directionMatched === true && poorExecution.causalityText.includes("最後沒有完成理想的揮棒") && poorExecution.executionText.includes("沒有碰到"));
verify("13. High-confidence wrong 保留當時高把握與錯誤方向", rescue.confidenceText === "高" && rescue.directionMatched === false);
const lowCorrectAnticipation = { ...expansionAnticipation, anticipationConfidence: 0.3 };
const lowCorrect = BatterAnticipation.createPostPAExplainability({ anticipation: lowCorrectAnticipation, pitchEvent: pitchEvent("edgeStrike", { action: "take", pitchResult: "calledStrike" }), outcomeText: "主審判定好球" });
verify("14. Low-confidence correct 不因結果 hindsight 提高把握", lowCorrect.confidenceText === "低" && lowCorrect.directionMatched === true);
const sameOutcomeA = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, pitchEvent: pitchEvent("chasePitch", { action: "take", pitchResult: "ball" }), outcomeText: "這個打席形成打者出局" });
const sameOutcomeB = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, pitchEvent: pitchEvent("competitiveStrike", { action: "swing", contact: false }), outcomeText: "這個打席形成打者出局" });
verify("15. Same outcome / different causality 產生不同 explainability", sameOutcomeA.outcomeText === sameOutcomeB.outcomeText && sameOutcomeA.causalityText !== sameOutcomeB.causalityText && sameOutcomeA.executionText !== sameOutcomeB.executionText);
const hitModel = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, pitchEvent: pitchEvent("competitiveStrike", { contact: true }), outcomeText: "一壘安打" });
const outModel = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, pitchEvent: pitchEvent("competitiveStrike", { contact: true }), outcomeText: "打者出局" });
verify("16. Same anticipation / different outcome 不回寫 Pre-PA wording", JSON.stringify(BatterAnticipation.createPrePAPresentation(challengeAnticipation)) === JSON.stringify(BatterAnticipation.createPrePAPresentation(challengeAnticipation)) && hitModel.anticipationText === outModel.anticipationText && hitModel.confidenceText === outModel.confidenceText);
verify("17. First PA no history 同時呈現資訊不足、弱方向與低把握", BatterAnticipation.createPrePAPresentation(noEvidenceAnticipation).observationLines[0].includes("沒有足夠") && BatterAnticipation.createPrePAPresentation(noEvidenceAnticipation).confidenceText === "低");

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
const storage = new Map();
const context = vm.createContext({
  console, module: { exports: {} }, PlayingTimeGameExposure,
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; } });
      return nodes.get(id);
    },
    querySelector() { return null; }, querySelectorAll() { return []; }
  },
  localStorage: { setItem(key, value) { storage.set(key, value); }, getItem(key) { return storage.get(key) || null; }, removeItem(key) { storage.delete(key); } },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
function evaluate(code) { return vm.runInContext(code, context); }
evaluate(`
  function __sprintCMatch(seed=97101) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("Sprint C 測試球員"); applyDebugBookmarkCharacterProfile(player); settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
    Object.assign(player,{observe:18,ballSense:17}); Object.assign(player.baseballSkills,{batting:9,baseballIQ:18});
    player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed; const match=prepareHighSchoolYearOneMatch();
    Object.assign(match,{inning:5,half:"下",offenseTeam:"home",defenseTeam:"away",outs:1,runners:[null,null,null],scores:{home:2,away:2},momentIndex:0,currentMomentId:highSchoolYearOneMomentIds[0],currentDomain:"offense",simulationPhase:"moment_1_ready",completed:false,settled:false,completedMoments:[],offensivePlateAppearanceState:null,batterAnticipationState:null,prePitchPlanningState:null,pitcherObservableHistory:[],simulationLog:[{type:"meaningfulMomentReached",momentId:highSchoolYearOneMomentIds[0],presentationImportance:"decision"}],presentedEventCursor:1});
    syncHighSchoolMatchPlayerRunnerLocation(match); return match;
  }
  function __sprintCPitch(type) { return {pitchLocationClass:type}; }
`);

const firstPAHtml = evaluate(`(() => {const m=__sprintCMatch();renderHighSchoolYearOneMatch({title:"秋季交流賽"});return {story:document.getElementById("story").innerHTML,choices:document.getElementById("choices").innerHTML,state:JSON.stringify(m.batterAnticipationState),planning:JSON.stringify(m.prePitchPlanningState)};})()`);
verify("18. First production PA 在 Approach 前顯示 no-history Read Panel", firstPAHtml.story.includes("打席判讀") && firstPAHtml.story.includes("沒有足夠線索") && firstPAHtml.choices.includes("搶第一顆") && !firstPAHtml.story.includes("intendedPitchClass"));
verify("19. Pre-choice save/reload 由 canonical state 重建相同 presentation", evaluate(`(() => {const m=__sprintCMatch(97102);getHighSchoolYearOneMatchMomentChoices(m);const before=JSON.stringify(BatterAnticipation.createPrePAPresentation(m.batterAnticipationState));player.highSchoolMatch=m;const loaded=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return before===JSON.stringify(BatterAnticipation.createPrePAPresentation(loaded.batterAnticipationState))&&JSON.stringify(loaded.prePitchPlanningState)===JSON.stringify(m.prePitchPlanningState);})()`));
verify("20. Production ordering：render 前完成 Anticipation、UI 後才提供 Approach", evaluate(`(() => {const m=__sprintCMatch(97103);const empty=m.batterAnticipationState===null;renderHighSchoolYearOneMatch({title:"秋季交流賽"});const story=document.getElementById("story").innerHTML;const choices=document.getElementById("choices").innerHTML;return empty&&m.batterAnticipationState?.chosenApproach===""&&story.includes("觀察")&&story.includes("你的預判")&&story.includes("判斷把握")&&choices.includes("你的決定");})()`));
verify("21. 不同 Approach 不改 pre-rendered anticipation wording", evaluate(`(() => {const a=__sprintCMatch(97104);const choices=getHighSchoolYearOneMatchMomentChoices(a);const before=JSON.stringify(BatterAnticipation.createPrePAPresentation(a.batterAnticipationState));ensureHighSchoolOffensivePlateAppearanceState(a,choices.find(x=>x.approach==="aggressiveEarlySwing"));const afterA=JSON.stringify(BatterAnticipation.createPrePAPresentation(a.batterAnticipationState));const b=__sprintCMatch(97104);const bChoices=getHighSchoolYearOneMatchMomentChoices(b);ensureHighSchoolOffensivePlateAppearanceState(b,bChoices.find(x=>x.approach==="patientSelection"));return before===afterA&&before===JSON.stringify(BatterAnticipation.createPrePAPresentation(b.batterAnticipationState));})()`));
const laterPAResult = evaluate(`(() => {const m=__sprintCMatch(97105);const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="zone");resolveHighSchoolOffensiveDecision(m,c,null,{plateAppearance:{pitchSequence:[__sprintCPitch("competitiveStrike"),__sprintCPitch("competitiveStrike"),__sprintCPitch("competitiveStrike")],pitchOptions:Array.from({length:3},()=>({recognitionRoll:0,decisionRoll:.99}))}});const history=m.pitcherObservableHistory.length;Object.assign(m,{inning:6,momentIndex:2,currentMomentId:highSchoolYearOneMomentIds[2],currentDomain:"offense",simulationPhase:"moment_3_ready",offensivePlateAppearanceState:null,batterAnticipationState:null,prePitchPlanningState:null,simulationLog:[...m.simulationLog,{type:"meaningfulMomentReached",momentId:highSchoolYearOneMomentIds[2],presentationImportance:"decision"}],presentedEventCursor:m.simulationLog.length+1});renderHighSchoolYearOneMatch({title:"秋季交流賽"});const html=document.getElementById("story").innerHTML;return {history,html,observed:m.batterAnticipationState?.observationResult};})()`);
verify("22. PA1 canonical history 讓 PA2 Read Panel 出現新 observable information", laterPAResult.history === 3 && !laterPAResult.html.includes("目前還沒有足夠線索") && (laterPAResult.html.includes("主動進入好球帶") || laterPAResult.html.includes("可處理區域") || laterPAResult.html.includes("看到了幾顆來球")));

const deterministicA = BatterAnticipation.createPostPAExplainability({ anticipation: expansionAnticipation, pitchEvent: pitchEvent("chasePitch", { action: "take", pitchResult: "ball" }), outcomeText: "壞球" });
const deterministicB = BatterAnticipation.createPostPAExplainability({ anticipation: expansionAnticipation, pitchEvent: pitchEvent("chasePitch", { action: "take", pitchResult: "ball" }), outcomeText: "壞球" });
verify("23. Presentation formatter deterministic 且不使用 Math.random", JSON.stringify(deterministicA) === JSON.stringify(deterministicB) && !/Math\.random/.test([BatterAnticipation.createPrePAPresentation, BatterAnticipation.createPostPAExplainability].map(fn => fn.toString()).join("")));

const productionUi = firstPAHtml.story + firstPAHtml.choices;
verify("24. Normal production UI 不含 hidden debug truth 或 anticipation exact percentages", !/(frozenTrueDistribution|directionAccuracy|confidenceCalibration|intendedPitchClass|pitcherMentalState|pitcherProcessState|\d+(?:\.\d+)?%)/.test(productionUi));
verify("25. Production resolution 保存 PA-local anticipation 並建立完整 Post-PA explainability", evaluate(`(() => {const m=__sprintCMatch(97106);const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="attack");const moment=resolveHighSchoolOffensiveDecision(m,c,null,{plateAppearance:{pitchSequence:[__sprintCPitch("competitiveStrike"),__sprintCPitch("competitiveStrike"),__sprintCPitch("competitiveStrike")],pitchOptions:Array.from({length:3},()=>({recognitionRoll:0,decisionRoll:0,contactRoll:1}))}});const model=createHighSchoolOffensiveExplainabilityModel(moment);const html=renderHighSchoolOffensiveExplainability(model);return Boolean(moment?.batterAnticipation)&&html.includes("你的預判")&&html.includes("實際第一球")&&html.includes("第一球辨認")&&html.includes("最後一次處理")&&html.includes("最後結果")&&!/(intendedPitchClass|frozenTrueDistribution|directionAccuracy|\d+(?:\.\d+)?%)/.test(html);})()`));

const openingCorrectFinalDifferent = BatterAnticipation.createPostPAExplainability({
  anticipation: challengeAnticipation,
  openingPitchEvent: pitchEvent("competitiveStrike", { action: "take", pitchResult: "calledStrike" }),
  finalPitchEvent: pitchEvent("chasePitch", { action: "take", pitchResult: "ball" }),
  outcomeText: "這個打席形成保送"
});
verify("26. Opening correct / final different 仍以第一球判定正確", openingCorrectFinalDifferent.directionMatched === true && openingCorrectFinalDifferent.actualPitchText.includes("好球") && openingCorrectFinalDifferent.openingAttributionText.includes("讀到了第一球"));

const openingWrongFinalMatches = BatterAnticipation.createPostPAExplainability({
  anticipation: challengeAnticipation,
  openingPitchEvent: pitchEvent("chasePitch", { action: "take", pitchResult: "ball" }),
  finalPitchEvent: pitchEvent("competitiveStrike", { action: "swing", contact: true, pitchResult: "ballInPlay" }),
  outcomeText: "這個打席形成打者出局"
});
verify("27. Opening wrong / final matches 仍以第一球判定錯誤", openingWrongFinalMatches.directionMatched === false && openingWrongFinalMatches.actualPitchText.includes("追出") && openingWrongFinalMatches.openingAttributionText.includes("沒有抓到第一球"));

const singlePitchCompatibility = BatterAnticipation.createPostPAExplainability({
  anticipation: challengeAnticipation,
  pitchEvent: pitchEvent("competitiveStrike", { action: "swing", contact: true, pitchResult: "ballInPlay" }),
  outcomeText: "一壘安打"
});
verify("28. Single-pitch PA 維持 opening 與 final 同一事件的相容行為", singlePitchCompatibility.directionMatched === true && singlePitchCompatibility.executionText.includes("進入場內") && singlePitchCompatibility.openingAttributionText.includes("讀到了第一球"));

const openingRescueFinalUnrelated = BatterAnticipation.createPostPAExplainability({
  anticipation: challengeAnticipation,
  openingPitchEvent: pitchEvent("chasePitch", { action: "take", pitchResult: "ball", correct: true }),
  finalPitchEvent: pitchEvent("competitiveStrike", { action: "swing", contact: false, correct: false }),
  outcomeText: "這個打席形成三振"
});
verify("29. Recognition rescue 只使用同一 opening pitch recognition", openingRescueFinalUnrelated.directionMatched === false && openingRescueFinalUnrelated.openingAttributionText.includes("及時修正") && openingRescueFinalUnrelated.recognitionText.includes("離開可攻擊區域"));

const openingCorrectPoorLaterOutcome = BatterAnticipation.createPostPAExplainability({
  anticipation: challengeAnticipation,
  openingPitchEvent: pitchEvent("competitiveStrike", { action: "take", pitchResult: "calledStrike" }),
  finalPitchEvent: pitchEvent("chasePitch", { action: "swing", contact: false, pitchResult: "swingingStrike" }),
  outcomeText: "這個打席形成三振"
});
verify("30. Correct opening + poor later outcome 不回寫 opening attribution", openingCorrectPoorLaterOutcome.directionMatched === true && openingCorrectPoorLaterOutcome.openingAttributionText.includes("讀到了第一球") && openingCorrectPoorLaterOutcome.causalityText.includes("最後沒有完成理想的揮棒"));

const sameFinalOutcomeOpeningCorrect = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, openingPitchEvent: pitchEvent("competitiveStrike"), finalPitchEvent: pitchEvent("chasePitch", { contact: true }), outcomeText: "打者出局" });
const sameFinalOutcomeOpeningWrong = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, openingPitchEvent: pitchEvent("chasePitch"), finalPitchEvent: pitchEvent("chasePitch", { contact: true }), outcomeText: "打者出局" });
verify("31. Same final outcome / different opening accuracy 產生不同 opening attribution", sameFinalOutcomeOpeningCorrect.outcomeText === sameFinalOutcomeOpeningWrong.outcomeText && sameFinalOutcomeOpeningCorrect.openingAttributionText !== sameFinalOutcomeOpeningWrong.openingAttributionText);

const sameOpeningDifferentFinalA = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, openingPitchEvent: pitchEvent("competitiveStrike"), finalPitchEvent: pitchEvent("edgeStrike", { action: "take", pitchResult: "calledStrike" }), outcomeText: "三振" });
const sameOpeningDifferentFinalB = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, openingPitchEvent: pitchEvent("competitiveStrike"), finalPitchEvent: pitchEvent("chasePitch", { action: "take", pitchResult: "ball" }), outcomeText: "保送" });
verify("32. Same opening / different final pitch 保持相同 opening attribution wording", sameOpeningDifferentFinalA.openingAttributionText === sameOpeningDifferentFinalB.openingAttributionText && sameOpeningDifferentFinalA.executionText === sameOpeningDifferentFinalB.executionText);

verify("33. Production model 以 pitchHistory[0] 歸因、以 final pitch 呈現執行", evaluate(`(() => {const model=createHighSchoolOffensiveExplainabilityModel({batterAnticipation:${JSON.stringify(challengeAnticipation)},pitchHistory:[{pitch:{pitchLocationClass:"competitiveStrike"},recognition:{correct:true},action:"take",contact:false,pitchResult:"calledStrike"},{pitch:{pitchLocationClass:"chasePitch"},recognition:{correct:false},action:"swing",contact:false,pitchResult:"swingingStrike"}],outcome:"這個打席形成三振"});return model.directionMatched===true&&model.actualPitchText.includes("好球")&&model.recognitionText.includes("可以處理")&&model.executionText.includes("沒有碰到")&&model.openingAttributionText.includes("讀到了第一球");})()`));

const missingOpening = BatterAnticipation.createPostPAExplainability({ anticipation: challengeAnticipation, openingPitchEvent: null, finalPitchEvent: null, outcomeText: "打者出局" });
verify("34. Empty pitch history 使用 deterministic safe fallback 且不從 outcome 倒推", missingOpening.directionMatched === null && missingOpening.hasOpeningPitch === false && missingOpening.actualPitchText.includes("沒有足夠") && missingOpening.openingAttributionText.includes("沒有留下足夠的逐球資訊"));

verify("35. Save/reload 保留 pitch history order 與 opening attribution", evaluate(`(() => {const m=__sprintCMatch(97107);m.completedMoments=[{batterAnticipation:${JSON.stringify(challengeAnticipation)},pitchHistory:[{pitch:{pitchLocationClass:"competitiveStrike"},recognition:{correct:true},action:"take",contact:false,pitchResult:"calledStrike"},{pitch:{pitchLocationClass:"chasePitch"},recognition:{correct:true},action:"take",contact:false,pitchResult:"ball"}],outcome:"這個打席形成保送"}];player.highSchoolMatch=m;const loaded=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;const savedMoment=loaded.completedMoments[0];const model=createHighSchoolOffensiveExplainabilityModel(savedMoment);return savedMoment.pitchHistory[0].pitch.pitchLocationClass==="competitiveStrike"&&savedMoment.pitchHistory[1].pitch.pitchLocationClass==="chasePitch"&&model.directionMatched===true&&model.openingAttributionText.includes("讀到了第一球");})()`));

console.log(`\nOffensive Production Presentation Sprint C：${passed}/${passed} 通過`);
