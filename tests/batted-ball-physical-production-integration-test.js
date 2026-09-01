const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js",
  "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js",
  "pitcher-mental-state.js", "pitcher-process-state.js", "pitch-sequencing.js", "batter-anticipation.js",
  "batted-ball-physical.js", "offensive-plate-approach.js", "baseball-gameplay-integration.js",
  "offensive-bunt-count-rules.js", "offensive-bunt-execution.js",
  "baseball-training-resolver.js", "playing-time-game-exposure.js", "match-experience-development.js",
  "match-development-settlement-presentation.js", "career-spine-contract.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js",
  "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

const nodes = new Map();
const storage = new Map();
const context = vm.createContext({
  console,
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false,
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
      });
      return nodes.get(id);
    },
    querySelector() { return null; }, querySelectorAll() { return []; }
  },
  localStorage: {
    setItem(key, value) { storage.set(key, value); },
    getItem(key) { return storage.get(key) || null; },
    removeItem(key) { storage.delete(key); }
  },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
const evaluate = code => vm.runInContext(code, context);

evaluate(`
  function __bbpMatch(seed=98201) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("BBP 正式整合測試球員");
    applyDebugBookmarkCharacterProfile(player); settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
    Object.assign(player,{observe:16,ballSense:16,bats:"R"});
    Object.assign(player.baseballSkills,{batting:14,baseballIQ:16});
    player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed; const match=prepareHighSchoolYearOneMatch();
    Object.assign(match,{inning:5,half:"下",offenseTeam:"home",defenseTeam:"away",outs:1,runners:[null,null,null],scores:{home:2,away:2},momentIndex:0,currentMomentId:highSchoolYearOneMomentIds[0],currentDomain:"offense",simulationPhase:"moment_1_ready",completed:false,settled:false,completedMoments:[],offensivePlateAppearanceState:null,batterAnticipationState:null,prePitchPlanningState:null,pitcherObservableHistory:[],simulationLog:[{type:"meaningfulMomentReached",momentId:highSchoolYearOneMomentIds[0],presentationImportance:"decision"}],presentedEventCursor:1});
    syncHighSchoolMatchPlayerRunnerLocation(match); return match;
  }
  function __bbpPitch(type="competitiveStrike") { return {pitchLocationClass:type}; }
  function __resolveBBP(match, physicalRolls, outcomeRoll=.5) {
    const choice=getHighSchoolYearOneMatchMomentChoices(match).find(item=>item.matchDecision==="attack");
    return resolveHighSchoolOffensiveDecision(match,choice,null,{plateAppearance:{pitchSequence:[__bbpPitch()],pitchOptions:[{recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,physicalRolls,outcomeRoll}]}});
  }
`);

const integrated = JSON.parse(evaluate(`(() => {
  const match=__bbpMatch(); const moment=__resolveBBP(match,{contactQuality:.64,ballType:.2,pace:.72,direction:.8,depth:.4},.3);
  const pa=match.offensivePlateAppearanceState; const event=[...match.simulationLog].reverse().find(item=>item.type==="plateAppearance"&&item.batterId==="player");
  return JSON.stringify({moment,pa,event,last:match.lastOffensiveResolution,abilities:getHighSchoolOffensivePlateApproachAbilities(player)});
})()`));
verify("1. 正式普通打席自動建立 canonical Batted-Ball Physical Truth", integrated.pa.battedBallPhysicalTruth?.version === "batted-ball-physical-v1");
verify("2. Contact → Physical Truth → downstream outcome 次序可稽核", integrated.pa.pitchHistory.at(-1).contact === true && integrated.pa.pitchHistory.at(-1).battedBallPhysicalTruth && integrated.last.physicalOutcomeFlow === "physicalTruthToLegacyDownstreamOutcome");
verify("3. 正式能力輸入沿用既有 batting／power／bats truth", Number.isFinite(integrated.abilities.batting) && Number.isFinite(integrated.abilities.power) && integrated.abilities.bats === "R");
verify("4. Physical Truth 同步寫入 PA event、completed moment 與 last resolution", JSON.stringify(integrated.pa.battedBallPhysicalTruth) === JSON.stringify(integrated.event.battedBallPhysicalTruth) && JSON.stringify(integrated.pa.battedBallPhysicalTruth) === JSON.stringify(integrated.moment.battedBallPhysicalTruth) && JSON.stringify(integrated.pa.battedBallPhysicalTruth) === JSON.stringify(integrated.last.battedBallPhysicalTruth));
verify("5. Physical layer 不持有結果、跑者或防守路徑 authority", !/(resultCode|outcome|runner|defense|fielder|route)/i.test(Object.keys(integrated.pa.battedBallPhysicalTruth).join("|")));

const presentation = JSON.parse(evaluate(`(() => {
  const match=__bbpMatch(98202); const moment=__resolveBBP(match,{contactQuality:.6,ballType:.55,pace:.65,direction:.8,depth:.45},.4);
  return JSON.stringify({outcome:moment.outcome,truth:moment.battedBallPhysicalTruth});
})()`));
verify("6. 玩家顯示使用可讀的物理擊球描述", /(滾地球|平飛球|飛球)/.test(presentation.outcome) && /(左半邊|中間方向|右半邊)/.test(presentation.outcome));
verify("7. 玩家顯示不洩漏 raw physical identifier", !/(groundBall|lineDrive|flyBall|leftSide|rightSide|barreled)/.test(presentation.outcome));

const saved = JSON.parse(evaluate(`(() => {
  const match=__bbpMatch(98203); __resolveBBP(match,{contactQuality:.3,ballType:.7,pace:.4,direction:.3,depth:.9},.7);
  const before=JSON.stringify(match.offensivePlateAppearanceState.battedBallPhysicalTruth); const logCount=match.simulationLog.length;
  player.highSchoolMatch=match; const loaded=normalizeSave(JSON.parse(JSON.stringify(player))); const restored=loaded.highSchoolMatch;
  const after=JSON.stringify(restored.offensivePlateAppearanceState.battedBallPhysicalTruth);
  const choice=getHighSchoolYearOneMatchMomentChoices(restored).find(item=>item.matchDecision==="attack");
  const duplicate=resolveHighSchoolOffensiveDecision(restored,choice,null,{resolvedPhase:"moment_1_resolved"});
  return JSON.stringify({same:before===after,duplicate,logCount,afterLog:restored.simulationLog.length,applied:restored.offensivePlateAppearanceState.resultApplied});
})()`));
verify("8. Save／reload 完整保留同一 physical truth", saved.same && saved.applied);
verify("9. Reload 後重送不重複結算 PA 或物理結果", saved.duplicate === false && saved.logCount === saved.afterLog);

const separated = JSON.parse(evaluate(`(() => {
  const strong=__bbpMatch(98204); const strongMoment=__resolveBBP(strong,{contactQuality:1,ballType:.5,pace:1,direction:.5,depth:.5},0);
  const weak=__bbpMatch(98205); player.baseballSkills.batting=0; const weakMoment=__resolveBBP(weak,{contactQuality:0,ballType:0,pace:0,direction:.5},1);
  return JSON.stringify({strongTruth:strongMoment.battedBallPhysicalTruth,strongResult:strongMoment.resultCode,weakTruth:weakMoment.battedBallPhysicalTruth,weakResult:weakMoment.resultCode});
})()`));
verify("10. 正式 outcome firewall：barreled／hard 仍可出局", separated.strongTruth.contactQuality === "barreled" && separated.strongTruth.pace === "hard" && ["out", "productiveOut"].includes(separated.strongResult));
verify("11. 正式 outcome firewall：poor／weak 仍可安全上壘", separated.weakTruth.contactQuality === "poor" && separated.weakTruth.pace === "weak" && ["single", "double", "triple", "homeRun"].includes(separated.weakResult));

const bunt = JSON.parse(evaluate(`(() => {
  const plan=OffensiveBuntExecution.createPATacticalPlan({actionState:{identity:"bbp-bunt",selectedTacticalAction:"sacrificeBunt"},count:{balls:0,strikes:0}});
  const result=OffensiveBuntExecution.resolveAndAdvanceBuntPitch({plan,actualPitch:{pitchLocationClass:"competitiveStrike",strike:true},recognition:{correct:true,perceivedPitchClass:"competitiveStrike"},capabilities:{batting:10,reaction:10,baseballIQ:10,ballSense:10},rolls:{attempt:0,preparation:0,contact:.99,fairBallType:.9,pace:.6,placement:.9}});
  return JSON.stringify(result);
})()`));
verify("12. Bunt 維持獨立 groundBunt／popBunt physical truth", ["groundBunt", "popBunt"].includes(bunt.resolution?.fairBallType));
verify("13. Bunt 不誤掛 ordinary BBP canonical truth", !bunt.battedBallPhysicalTruth && !bunt.resolution?.battedBallPhysicalTruth && bunt.resolution?.version !== "batted-ball-physical-v1");

console.log(`Batted-Ball Physical production integration tests: ${passed}/${passed} passed`);
