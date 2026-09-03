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
  "batted-ball-line-drive-defense.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js", "playing-time-game-exposure.js",
  "match-experience-development.js", "match-development-settlement-presentation.js", "career-spine-contract.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js",
  "career-development-progression.js", "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
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
  function __bbpB2AMatch(seed=99201,outs=0) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("BBP-B2A"); applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"}); applyCanonicalPositionProfile(player,"內野手",["外野手"]);
    player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed;
    const m=prepareHighSchoolYearOneMatch();
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs,runners:["away-sim-2",null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",position:"內野手",developmentPositionOverride:"二壘手"});
    m.battingOrderIndex.away=2; m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id; player.highSchoolMatch=m; return m;
  }
  function __bbpB2AOptions({direction=.95,depth=0,ballType=.5,executionRoll=0,outcomeRoll=.5,preContactRunnerStates={}}={}) {
    return {tacticalActionOverride:"standardAttack",lineDriveCatchExecutionRoll:executionRoll,preContactRunnerStates,
      situationOverrides:{playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10}},
      ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,
        physicalRolls:{contactQuality:.65,ballType,pace:.99,direction,depth},outcomeRoll}};
  }
  function __bbpB2APrepare(seed=99201,optionOverrides={},outs=0) {
    const m=__bbpB2AMatch(seed,outs),opts=__bbpB2AOptions(optionOverrides);
    const before={outs:m.outs,runners:m.runners.slice(),order:m.battingOrderIndex.away,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,routine:m.simulationLog.filter(e=>e.type==="playerRoutinePlay"&&e.familyId==="lineDriveCatch").length};
    const event=prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
    const after={outs:m.outs,runners:m.runners.slice(),order:m.battingOrderIndex.away,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,routine:m.simulationLog.filter(e=>e.type==="playerRoutinePlay"&&e.familyId==="lineDriveCatch").length};
    return {m,event,before,after,opts};
  }
`);

const success = JSON.parse(evaluate(`(() => {const x=__bbpB2APrepare();return JSON.stringify({state:x.m.lineDriveCatchState,pa:x.m.ordinaryDefensivePlateAppearanceState,event:x.event,before:x.before,after:x.after,last:x.m.lastDefensiveResolution});})()`));
verify("1. Production flow 經 Actual Pitch → Recognition → Swing → Fair Contact", success.pa.pitchHistory.length === 1 && success.pa.pitchHistory[0].recognition && success.pa.pitchHistory[0].action === "swing" && success.pa.pitchHistory[0].contact === true);
verify("2. BBP-A 先建立 lineDrive/rightSide/shallow truth", success.pa.battedBallPhysicalTruth.ballType === "lineDrive" && success.pa.battedBallPhysicalTruth.direction === "rightSide" && success.pa.battedBallPhysicalTruth.depth === "shallow");
verify("3. Supported production 自動建立 runner read、access、window、opportunity", success.state.sourceAuthority === "BattedBallPhysicalTruth" && success.state.runnerInitialReadStates.length === 1 && success.state.defensiveAccess.supported && success.state.catchWindow.state !== "expired");
verify("4. Catch success 才向下游投影 PA out", success.state.catchResult.result === "caught" && success.state.paCompatibilityResult.result === "out" && success.state.paCompatibilityResult.authority === "physicalCatchResultToPACompatibility");
verify("5. Catch success 只增加一次 out、PA、batting cursor 與 routine event", success.after.outs - success.before.outs === 1 && success.after.pa - success.before.pa === 1 && success.after.routine - success.before.routine === 1 && success.after.order !== success.before.order);
verify("6. Stationary runner 留在一壘且沒有 automatic double-off", success.after.runners[0] === "away-sim-2" && success.state.retouchRequirements[0].runnerOut === false && success.state.retouchRequirements[0].satisfiedAtCatch);
verify("7. 呈現只在結果後說球進手套與 retouch，不含 raw identifier", success.event.presentation.includes("球在落地前進入手套") && !/(rightSide|lineDrive|caughtAirBall|lineDriveCatch)/.test(success.event.presentation));

const failure = JSON.parse(evaluate(`(() => {const x=__bbpB2APrepare(99202,{executionRoll:.999,outcomeRoll:.85});return JSON.stringify({state:x.m.lineDriveCatchState,pa:x.m.ordinaryDefensivePlateAppearanceState,event:x.event,before:x.before,after:x.after});})()`));
verify("8. Catch failure 先固定 notCaught，再交 transitional legacy continuation", failure.state.catchResult.result === "notCaught" && failure.state.liveBallContinuation.ballRemainsLive && failure.state.paCompatibilityResult.authority === "catchFailureToTransitionalLegacyContinuation" && failure.state.paCompatibilityResult.upstreamCatchResult === "notCaught");
verify("9. Catch failure presentation 不直接宣稱安打", failure.event.presentation.includes("仍是活球") && !failure.event.presentation.includes("安打") && failure.state.catchResult.batterRunner.finalBaseOutcome === "unresolved");
verify("10. Legacy continuation 不回頭改寫 physical catch result", failure.state.catchResult.result === "notCaught" && failure.state.paCompatibilityResult.result === failure.pa.result);

const advancing = JSON.parse(evaluate(`(() => {const x=__bbpB2APrepare(99203,{preContactRunnerStates:{"away-sim-2":{movementState:"advancing"}}});return JSON.stringify({state:x.m.lineDriveCatchState,runners:x.m.runners});})()`));
verify("11. Future H&R interface 讀到 advancing 後 brake/retreat，接殺只建立回一壘義務", advancing.state.runnerInitialReadStates[0].readAction === "brakeAndRetreat" && advancing.state.runnerInitialReadStates[0].movementState === "retreating" && advancing.state.retouchRequirements[0].targetBase === "first" && advancing.state.retouchRequirements[0].runnerOut === false);

const unsupported = JSON.parse(evaluate(`(() => {const left=__bbpB2APrepare(99204,{direction:.05}),deep=__bbpB2APrepare(99205,{depth:.99});return JSON.stringify({left:{state:left.m.lineDriveCatchState,pa:left.m.ordinaryDefensivePlateAppearanceState},deep:{state:deep.m.lineDriveCatchState,pa:deep.m.ordinaryDefensivePlateAppearanceState}});})()`));
verify("12. Left-side lineDrive 不產生 player primary catch opportunity", unsupported.left.state.supported === false && unsupported.left.state.defensiveAccess.reason === "leftSideNoPlayerBallMagnet" && unsupported.left.pa.result !== "lineDriveCatchPending");
verify("13. Medium/deep lineDrive 保留 physical truth 並走 legacy fallback", unsupported.deep.state.supported === false && ["medium","deep"].includes(unsupported.deep.state.physicalTruth.depth) && unsupported.deep.pa.result !== "lineDriveCatchPending");

const duplicate = JSON.parse(evaluate(`(() => {const x=__bbpB2APrepare(99206),m=x.m,before={outs:m.outs,order:m.battingOrderIndex.away,logs:m.simulationLog.length,pa:m.performanceEvidence[m.currentBatter]?.plateAppearances||0};const event=applyHighSchoolLineDriveCatchResolution(m),after={outs:m.outs,order:m.battingOrderIndex.away,logs:m.simulationLog.length,pa:m.performanceEvidence[m.currentBatter]?.plateAppearances||0};return JSON.stringify({before,after,event:!!event,settled:m.lineDriveCatchState.settlementApplied});})()`));
verify("I. Settlement guard 阻止 outs、打序與 event 重複結算", JSON.stringify(duplicate.before) === JSON.stringify(duplicate.after) && duplicate.event && duplicate.settled);

const thirdOut = JSON.parse(evaluate(`(() => {const x=__bbpB2APrepare(99207,{},2);return JSON.stringify({before:x.before,after:x.after,state:x.m.lineDriveCatchState,pending:x.m.pendingHalfInningTermination,event:x.event});})()`));
verify("J. 兩出局接殺形成正好第三出局並沿用 pending half-inning termination", thirdOut.after.outs === 3 && thirdOut.after.outs - thirdOut.before.outs === 1 && thirdOut.pending.halfInningEnded && thirdOut.pending.outsAfter === 3 && thirdOut.event.thirdOutResolution.halfInningTransition === "pending");

const saveReload = JSON.parse(evaluate(`(() => {const x=__bbpB2APrepare(99208,{preContactRunnerStates:{"away-sim-2":{movementState:"advancing"}}}),m=x.m;player.highSchoolMatch=m;const before=JSON.stringify(m.lineDriveCatchState),restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch,after=JSON.stringify(restored.lineDriveCatchState),snapshot={outs:restored.outs,order:restored.battingOrderIndex.away,logs:restored.simulationLog.length};applyHighSchoolLineDriveCatchResolution(restored);const duplicate={outs:restored.outs,order:restored.battingOrderIndex.away,logs:restored.simulationLog.length};return JSON.stringify({same:before===after,settled:restored.lineDriveCatchState.settlementApplied,noDuplicate:JSON.stringify(snapshot)===JSON.stringify(duplicate)});})()`));
verify("14. Save/reload 保留 truth、read、access、window、result、retouch 與 settlement guard", saveReload.same && saveReload.settled && saveReload.noDuplicate);
verify("15. Runtime order 在 BBP-A/Plate Approach 後、script 前載入 B2A", runtimeFiles.indexOf("batted-ball-physical.js") < runtimeFiles.indexOf("batted-ball-line-drive-defense.js") && runtimeFiles.indexOf("offensive-plate-approach.js") < runtimeFiles.indexOf("batted-ball-line-drive-defense.js") && runtimeFiles.indexOf("batted-ball-line-drive-defense.js") < runtimeFiles.indexOf("script.js"));

console.log(`BBP-B2A Line Drive Production Integration tests: ${passed}/${passed} passed`);
