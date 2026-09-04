const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }
const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "batter-anticipation.js", "batted-ball-physical.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "force-advancement.js", "offensive-bunt-defensive-handoff.js", "batted-ball-ground-defense.js",
  "batted-ball-line-drive-defense.js", "batted-ball-fly-ball-defense.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
  "playing-time-game-exposure.js", "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "story.js", "save.js", "script.js"
];
const nodes = new Map();
const storage = new Map();
const context = vm.createContext({
  console, module: { exports: {} },
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, { id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; } }); return nodes.get(id); },
    querySelector() { return null; }, querySelectorAll() { return []; }
  },
  localStorage: { setItem(key, value) { storage.set(key, value); }, getItem(key) { return storage.get(key) || null; }, removeItem(key) { storage.delete(key); } },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
const evaluate = expression => vm.runInContext(expression, context);

evaluate(`
  function __bbpB2B1Match(seed=99401,outs=1,runners=[null,null,"away-sim-2"]) {
    stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;
    player=createInitialPlayer("BBP-B2B1");applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"});applyCanonicalPositionProfile(player,"內野手",["外野手"]);
    player.chapter="青棒";player.highSchoolStep=5;player.highSchoolRoleCode="starter";player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed;
    const m=prepareHighSchoolYearOneMatch();
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs,runners:runners.slice(),scores:{home:1,away:1},simulationPhase:"moment_1_resolved",currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",position:"內野手",developmentPositionOverride:"二壘手"});
    m.battingOrderIndex.away=2;m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id;player.highSchoolMatch=m;return m;
  }
  function __bbpB2B1Options({direction=.95,depth=.5,executionRoll=0,outcomeRoll=.5,preContactRunnerStates={},flyBallDefenderContext}={}) {
    const options={tacticalActionOverride:"standardAttack",flyBallCatchExecutionRoll:executionRoll,preContactRunnerStates,
      situationOverrides:{playerCapabilities:{fielding:10,reaction:10,range:10,arm:10,throwing:10,decision:10}},
      ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,
        physicalRolls:{contactQuality:.65,ballType:.95,pace:.5,direction,depth},outcomeRoll}};
    if(flyBallDefenderContext!==undefined)options.flyBallDefenderContext=flyBallDefenderContext;
    return options;
  }
  function __bbpB2B1Prepare(seed=99401,optionOverrides={},outs=1,runners=[null,null,"away-sim-2"]) {
    const m=__bbpB2B1Match(seed,outs,runners),opts=__bbpB2B1Options(optionOverrides);
    const before={outs:m.outs,runners:m.runners.slice(),scores:{...m.scores},order:m.battingOrderIndex.away,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,events:m.simulationLog.filter(e=>e.type==="flyBallCatchResolution").length};
    const event=prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
    const after={outs:m.outs,runners:m.runners.slice(),scores:{...m.scores},order:m.battingOrderIndex.away,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,events:m.simulationLog.filter(e=>e.type==="flyBallCatchResolution").length};
    return {m,event,before,after,opts};
  }
`);

const caught = JSON.parse(evaluate(`(() => {const x=__bbpB2B1Prepare();return JSON.stringify({state:x.m.flyBallCatchState,pa:x.m.ordinaryDefensivePlateAppearanceState,event:x.event,before:x.before,after:x.after,last:x.m.lastDefensiveResolution});})()`));
verify("1. Production 經 Pitch → Recognition → Swing → Contact → BBP-A flyBall", caught.pa.pitchHistory.length === 1 && caught.pa.pitchHistory[0].recognition && caught.pa.pitchHistory[0].action === "swing" && caught.pa.pitchHistory[0].contact === true && caught.pa.battedBallPhysicalTruth.ballType === "flyBall");
verify("2. Supported medium/right flyBall 在 legacy outcome 前建立 catch pending chain", caught.state.sourceAuthority === "BattedBallPhysicalTruth" && caught.state.airborneContext.ballType === "flyBall" && caught.state.defensiveAccess.supported && caught.state.catchWindow.state !== "expired");
verify("3. Production 使用 existing roster RF teammate context，不建立玩家 ball magnet", caught.state.defenderContext.assignmentAuthority === "existingRosterFieldTopology" && caught.state.defenderContext.position === "右外野手" && caught.state.defenderContext.defenderId !== "player");
verify("4. Catch success 才向下游投影 PA out", caught.state.catchResult.result === "caught" && caught.state.paCompatibilityResult.result === "out" && caught.state.paCompatibilityResult.authority === "physicalFlyBallCatchToPACompatibility");
verify("5. 3B touching runner 取得 legal Home target，但未推進、未得分", caught.state.postCatchRunnerStates[0].tagUpLegality.advancementLegal && caught.state.postCatchRunnerStates[0].tagUpLegality.targetBase === "home" && caught.after.runners[2] === "away-sim-2" && JSON.stringify(caught.after.scores) === JSON.stringify(caught.before.scores));
verify("6. Production state 不生成 sacrificeFly 或 runner decision", !Object.hasOwn(caught.state,"sacrificeFly") && caught.state.pendingTagUpHandoff.decisionMade === false && caught.state.postCatchRunnerStates[0].finalMovementDecision === "unresolved");
verify("7. 玩家呈現只說 catch 與合法起點，不做 SEND／HOLD recommendation", caught.event.presentation.includes("球被守備員接住") && caught.event.presentation.includes("具備起跑資格") && !/SEND|HOLD|犧牲飛球|衝本壘/.test(caught.event.presentation));

const missed = JSON.parse(evaluate(`(() => {const x=__bbpB2B1Prepare(99402,{executionRoll:.999,outcomeRoll:.85});return JSON.stringify({state:x.m.flyBallCatchState,pa:x.m.ordinaryDefensivePlateAppearanceState,event:x.event});})()`));
verify("8. Catch failure 先固定 notCaught，再交 transitional legacy continuation", missed.state.catchResult.result === "notCaught" && missed.state.liveBallContinuation.ballRemainsLive && missed.state.paCompatibilityResult.authority === "flyBallCatchFailureToTransitionalLegacyContinuation" && missed.state.paCompatibilityResult.upstreamCatchResult === "notCaught");
verify("9. Catch failure 沒有 tag-up legality、automatic hit 或結果倒灌", missed.state.postCatchRunnerStates[0].tagUpLegality.reason === "ballNotCaught" && !missed.state.postCatchRunnerStates[0].tagUpLegality.advancementLegal && missed.state.catchResult.liveBallContinuation.automaticHit === false && missed.event.presentation === "球沒有被接住，仍是活球。" && missed.state.catchResult.result === "notCaught");

const offBase = JSON.parse(evaluate(`(() => {const x=__bbpB2B1Prepare(99403,{preContactRunnerStates:{"away-sim-2":{movementState:"advancing",touchingOriginBase:false}}},0,["away-sim-2",null,null]);return JSON.stringify(x.m.flyBallCatchState.postCatchRunnerStates[0]);})()`));
verify("10. Production pre-contact advancing runner 保存 unsatisfied retouch 且不自動出局", offBase.readState.readAction === "retreatToRetouch" && offBase.retouchState.retouchRequired && !offBase.retouchState.retouchSatisfied && offBase.tagUpLegality.reason === "retouchNotSatisfied" && !Object.hasOwn(offBase,"runnerOut"));

const unsupported = JSON.parse(evaluate(`(() => {const left=__bbpB2B1Prepare(99404,{direction:.05}),shallow=__bbpB2B1Prepare(99405,{depth:0}),missing=__bbpB2B1Prepare(99406,{flyBallDefenderContext:{defenderId:"",position:"右外野手"}});return JSON.stringify({left:{state:left.m.flyBallCatchState,pa:left.m.ordinaryDefensivePlateAppearanceState},shallow:{state:shallow.m.flyBallCatchState,pa:shallow.m.ordinaryDefensivePlateAppearanceState},missing:{state:missing.m.flyBallCatchState,pa:missing.m.ordinaryDefensivePlateAppearanceState}});})()`));
verify("11. Unsupported direction/depth/defender 都走 legacy fallback，未反推 catch", !unsupported.left.state.supported && !unsupported.shallow.state.supported && !unsupported.missing.state.supported && unsupported.left.pa.result !== "flyBallCatchPending" && unsupported.shallow.pa.result !== "flyBallCatchPending" && unsupported.missing.pa.result !== "flyBallCatchPending");

const duplicate = JSON.parse(evaluate(`(() => {const x=__bbpB2B1Prepare(99407),m=x.m,before={outs:m.outs,order:m.battingOrderIndex.away,logs:m.simulationLog.length,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length};const event=applyHighSchoolFlyBallCatchResolution(m);const after={outs:m.outs,order:m.battingOrderIndex.away,logs:m.simulationLog.length,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length};return JSON.stringify({before,after,event:!!event,settled:m.flyBallCatchState.settlementApplied});})()`));
verify("I. Catch settlement guard 阻止 out、PA、cursor 與 event 重複", JSON.stringify(duplicate.before) === JSON.stringify(duplicate.after) && duplicate.event && duplicate.settled);

const thirdOut = JSON.parse(evaluate(`(() => {const x=__bbpB2B1Prepare(99408,{},2);return JSON.stringify({before:x.before,after:x.after,state:x.m.flyBallCatchState,pending:x.m.pendingHalfInningTermination,event:x.event});})()`));
verify("J. Third-out catch 正好形成第三出局、終止半局且不建立 tag-up action", thirdOut.after.outs === 3 && thirdOut.after.outs-thirdOut.before.outs === 1 && thirdOut.pending.halfInningEnded && thirdOut.state.pendingTagUpHandoff.reason === "thirdOutCatch" && thirdOut.state.postCatchRunnerStates[0].tagUpLegality.reason === "thirdOutCatch" && thirdOut.event.scoringRunnerIds.length === 0);

const saved = JSON.parse(evaluate(`(() => {const x=__bbpB2B1Prepare(99409),m=x.m;player.highSchoolMatch=m;const before=JSON.stringify(m.flyBallCatchState),restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch,after=JSON.stringify(restored.flyBallCatchState),snapshot={outs:restored.outs,order:restored.battingOrderIndex.away,logs:restored.simulationLog.length};applyHighSchoolFlyBallCatchResolution(restored);const duplicate={outs:restored.outs,order:restored.battingOrderIndex.away,logs:restored.simulationLog.length};return JSON.stringify({same:before===after,settled:restored.flyBallCatchState.settlementApplied,noDuplicate:JSON.stringify(snapshot)===JSON.stringify(duplicate)});})()`));
verify("12. Save/reload 完整保存 catch、outs、retouch、legality、handoff 與 settlement guard", saved.same && saved.settled && saved.noDuplicate);
verify("13. Runtime 在 shared Airborne 後、script 前載入 Fly Ball layer", runtimeFiles.indexOf("batted-ball-line-drive-defense.js") < runtimeFiles.indexOf("batted-ball-fly-ball-defense.js") && runtimeFiles.indexOf("batted-ball-fly-ball-defense.js") < runtimeFiles.indexOf("script.js"));

console.log(`BBP-B2B1 Fly Ball Production Integration tests: ${passed}/${passed} passed`);
