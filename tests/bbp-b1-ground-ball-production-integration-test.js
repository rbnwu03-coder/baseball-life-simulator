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
  "offensive-bunt-execution.js", "force-advancement.js", "offensive-bunt-defensive-handoff.js", "batted-ball-ground-defense.js", "baseball-gameplay-integration.js",
  "baseball-training-resolver.js", "playing-time-game-exposure.js", "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js",
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
  function __bbpB1Match(seed=99101) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("BBP-B1"); applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"}); applyCanonicalPositionProfile(player,"內野手",["外野手"]);
    player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed;
    const m=prepareHighSchoolYearOneMatch();
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:["away-sim-2",null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",position:"內野手",developmentPositionOverride:"二壘手"});
    m.battingOrderIndex.away=2; m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id; player.highSchoolMatch=m; return m;
  }
  function __bbpB1Options(direction=.9,ballType=.1,batterSpeed=4) {
    const m=player.highSchoolMatch; getHighSchoolMatchSimulationEntity(m,m.currentBatter).speed=batterSpeed;
    return {tacticalActionOverride:"standardAttack",situationOverrides:{playerCapabilities:{fielding:10,reaction:10,range:10,arm:10,throwing:10,decision:10}},ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,physicalRolls:{contactQuality:.65,ballType,pace:.68,direction,depth:.4},outcomeRoll:.5}};
  }
  function __bbpB1Prepare(seed=99101,direction=.9,ballType=.1,batterSpeed=4) {
    const m=__bbpB1Match(seed),opts=__bbpB1Options(direction,ballType,batterSpeed);
    const event=prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
    return {m,event,choices:getHighSchoolDefensiveMomentChoices(m),text:getHighSchoolDefensiveSituationText(m),opts};
  }
`);

const production = JSON.parse(evaluate(`(() => {const x=__bbpB1Prepare();return JSON.stringify({
  handoff:x.m.groundBallInPlayState,pa:x.m.ordinaryDefensivePlateAppearanceState,situation:x.m.defensiveSituation,
  choices:x.choices,text:x.text,ballContext:x.m.ballContext
});})()`));
verify("1. Production Standard Attack 自動走 Actual Pitch → Recognition → Swing → Contact", production.pa.pitchHistory.length === 1 && production.pa.pitchHistory[0].pitch.pitchLocationClass === "hitterPitch" && production.pa.pitchHistory[0].recognition && production.pa.pitchHistory[0].action === "swing" && production.pa.pitchHistory[0].contact === true);
verify("2. Fair contact 先建立 BBP-A truth，再標記 physical defense pending", production.pa.battedBallPhysicalTruth?.ballType === "groundBall" && production.pa.battedBallPhysicalTruth.direction === "rightSide" && production.pa.result === "groundBallDefensePending");
verify("3. BBP-B1 handoff 的 upstream authority 是 BBP-A，不是 legacy PA result", production.handoff.sourceAuthority === "BattedBallPhysicalTruth" && production.handoff.physicalTruth.identity === production.pa.battedBallPhysicalTruth.identity && !production.handoff.legacyFallbackResult);
verify("4. Canonical runner state 投影進既有 infield situation", production.situation.runnerContext[0].movementProgress === "advancing" && production.situation.runnerContext[0].targetBase === "second" && production.handoff.runnerRealization.batterRunner.movementState === "advancing");
verify("5. Synthetic context 僅為 physical truth compatibility projection", production.ballContext.sourceFamily === "ordinaryBattedBall" && production.ballContext.physicalTruth.ballType === "groundBall" && production.ballContext.downstreamSupport === "supported2BOrdinaryGroundBall");
verify("6. 玩家第一層選項是先抓一壘或先抓二壘跑者", production.choices.some(choice => choice.routeId === "secureFirstBaseOut" && choice.text.includes("打者跑者")) && production.choices.some(choice => choice.routeId === "initiate463" && choice.text.includes("前位跑者")));
verify("7. 玩家資訊可讀且不顯示 raw identifier", production.text.includes("一般擊球形成的滾地守備") && production.text.includes("打者跑者") && !/(rightSide|groundBall|initiate463|secureFirstBaseOut)/.test(production.text));

const settlement = JSON.parse(evaluate(`(() => {
  const x=__bbpB1Prepare(99102,.9,.1,2),m=x.m;
  const before={outs:m.outs,runners:m.runners.slice(),order:m.battingOrderIndex.away,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,def:m.simulationLog.filter(e=>e.type==="defensiveResolution").length};
  const choice=x.choices.find(c=>c.routeId==="initiate463");
  const resolution=resolveHighSchoolDefensivePlay(m,choice.matchDecision,()=>.99);
  const completed=applyInfieldResolutionToHighSchoolMatch(m,choice.matchDecision,resolution);
  const after={outs:m.outs,runners:m.runners.slice(),order:m.battingOrderIndex.away,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,def:m.simulationLog.filter(e=>e.type==="defensiveResolution").length};
  applyInfieldResolutionToHighSchoolMatch(m,choice.matchDecision,resolution);
  const duplicate={outs:m.outs,runners:m.runners.slice(),order:m.battingOrderIndex.away,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,def:m.simulationLog.filter(e=>e.type==="defensiveResolution").length};
  return JSON.stringify({before,after,duplicate,resolution,completed,handoff:m.groundBallInPlayState,paState:m.ordinaryDefensivePlateAppearanceState});
})()`));
verify("8. 先傳二壘後第一腿與 relay continuation 分開解析", settlement.resolution.firstLegState.status === "completed" && settlement.resolution.continuationState.status === "completed" && settlement.resolution.outsCreated === 2);
verify("9. Physical outcome 先產生，再投影 PA-compatible result", settlement.handoff.physicalOutcome?.authority === "defensiveExecution+runnerTiming" && settlement.handoff.paCompatibilityResult?.authority === "physicalOutcomeToLegacyPACompatibility" && settlement.handoff.physicalOutcome.officialScoring === "deferred");
verify("10. Supported play 只增加一次 outs、PA、打序與 defensive event", settlement.after.outs - settlement.before.outs === 2 && settlement.after.pa - settlement.before.pa === 1 && settlement.after.def - settlement.before.def === 1 && settlement.after.order !== settlement.before.order);
verify("11. 重送結算不會再次改 outs、bases、PA、打序或 event", JSON.stringify(settlement.after) === JSON.stringify(settlement.duplicate) && settlement.handoff.settlementApplied && settlement.paState.resultApplied);
verify("12. Physical outcome 保存 batter/lead runner safe-out 與 base occupancy", settlement.handoff.physicalOutcome.batterRunner.result === "out" && settlement.handoff.physicalOutcome.leadRunner.result === "out" && settlement.handoff.physicalOutcome.baseOccupancy.length === 3);

const aggressive = JSON.parse(evaluate(`(() => {
  const x=__bbpB1Prepare(99103,.9,.1,2),s=x.m.defensiveSituation;
  s.groundBallDefensiveContext.timingWindows.leadRunnerForceWindow.state="narrow";
  s.routeWindowOverrides={firstBaseOutWindow:"normal",doublePlayWindow:"narrow"};
  s.routeWindows=deriveSecondBaseExecutionWindows(s,s.routeWindowOverrides);s.legalChoices=generateInfieldLegalChoices(s,x.m);
  const c=s.legalChoices.find(c=>c.routeId==="initiate463"),r=resolveHighSchoolDefensivePlay(x.m,c.matchDecision,()=>0);
  return JSON.stringify({choice:c.advisable,resolution:r.decisionQuality,outs:r.outsCreated});
})()`));
verify("K. Tight lead window 的 aggressive quality 不隨失敗 outcome 改寫", aggressive.choice === "aggressive" && aggressive.resolution === "aggressive" && aggressive.outs === 0);

const unsupported = JSON.parse(evaluate(`(() => {const x=__bbpB1Prepare(99104,.05,.1,5);return JSON.stringify({handoff:x.m.groundBallInPlayState,pa:x.m.ordinaryDefensivePlateAppearanceState,ball:x.m.ballContext,situation:x.m.defensiveSituation});})()`));
verify("13. Left-side ordinary ground ball 保留 BBP truth 但不強制 2B primary opportunity", unsupported.handoff.supported === false && unsupported.handoff.physicalTruth.direction === "leftSide" && unsupported.handoff.fallbackAuthority === "existingSyntheticDefensiveContext" && !unsupported.situation.groundBallDefensiveContext);
verify("14. Unsupported scope 使用單一 legacy fallback result", unsupported.pa.result !== "groundBallDefensePending" && unsupported.handoff.legacyFallbackResult === unsupported.pa.result && !unsupported.handoff.settlementApplied);

const airborne = JSON.parse(evaluate(`(() => {const x=__bbpB1Prepare(99105,.9,.95,5);return JSON.stringify({handoff:x.m.groundBallInPlayState,pa:x.m.ordinaryDefensivePlateAppearanceState});})()`));
verify("15. Line drive / fly ball 維持 legacy fallback", airborne.handoff.supported === false && airborne.handoff.fallbackAuthority === "existingSyntheticDefensiveContext" && ["lineDrive","flyBall"].includes(airborne.handoff.physicalTruth.ballType) && airborne.pa.result !== "groundBallDefensePending");

const saved = JSON.parse(evaluate(`(() => {
  const x=__bbpB1Prepare(99106,.9,.1,4),m=x.m;player.highSchoolMatch=m;
  const before=JSON.stringify({truth:m.groundBallInPlayState.physicalTruth,forceChain:m.groundBallInPlayState.forceChain,runners:m.groundBallInPlayState.runnerPhysicalStates,windows:m.groundBallInPlayState.timingWindows,choices:m.defensiveSituation.legalChoices});
  const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;
  const after=JSON.stringify({truth:restored.groundBallInPlayState.physicalTruth,forceChain:restored.groundBallInPlayState.forceChain,runners:restored.groundBallInPlayState.runnerPhysicalStates,windows:restored.groundBallInPlayState.timingWindows,choices:restored.defensiveSituation.legalChoices});
  return JSON.stringify({same:before===after,settled:restored.groundBallInPlayState.settlementApplied});
})()`));
verify("16. Save/reload 保留同一 ball、runner、windows 與 choice state", saved.same && saved.settled === false);

const savedAfter = JSON.parse(evaluate(`(() => {
  const x=__bbpB1Prepare(99107,.9,.1,2),m=x.m,c=x.choices.find(c=>c.routeId==="initiate463"),r=resolveHighSchoolDefensivePlay(m,c.matchDecision,()=>.99);
  applyInfieldResolutionToHighSchoolMatch(m,c.matchDecision,r);player.highSchoolMatch=m;
  const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch,before={outs:restored.outs,order:restored.battingOrderIndex.away,logs:restored.simulationLog.length};
  const duplicate=applyInfieldResolutionToHighSchoolMatch(restored,c.matchDecision,r),after={outs:restored.outs,order:restored.battingOrderIndex.away,logs:restored.simulationLog.length};
  return JSON.stringify({same:JSON.stringify(before)===JSON.stringify(after),settled:restored.groundBallInPlayState.settlementApplied,duplicate:!!duplicate});
})()`));
verify("17. 結算後 reload 不重抽也不重複 settlement", savedAfter.same && savedAfter.settled && savedAfter.duplicate);

verify("18. Runtime script order 在 BBP-B1 前已載入 BBP-A 與 shared Bunt runner primitive", runtimeFiles.indexOf("batted-ball-physical.js") < runtimeFiles.indexOf("batted-ball-ground-defense.js") && runtimeFiles.indexOf("offensive-bunt-defensive-handoff.js") < runtimeFiles.indexOf("batted-ball-ground-defense.js"));

const chainedForce = JSON.parse(evaluate(`(() => {
  const m=__bbpB1Match(99108);m.runners=["away-sim-2","away-sim-6",null];const opts=__bbpB1Options(.9,.1,2);
  prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
  const c=getHighSchoolDefensiveMomentChoices(m).find(c=>c.routeId==="initiate463"),r=resolveHighSchoolDefensivePlay(m,c.matchDecision,()=>.99);
  applyInfieldResolutionToHighSchoolMatch(m,c.matchDecision,r);
  return JSON.stringify({outs:m.outs,runners:m.runners,changes:m.lastDefensiveResolution.runnerChanges});
})()`));
verify("19. Original bug：1B+2B 成功 4-6-3 後只留下 original 2B runner 於 3B", chainedForce.outs === 2 && chainedForce.runners[0] === null && chainedForce.runners[1] === null && chainedForce.runners[2] === "away-sim-6" && chainedForce.changes.some(change => change.runnerId === "away-sim-6" && change.from === 2 && change.to === 3));

console.log(`BBP-B1 Ground Ball Production Integration tests: ${passed}/${passed} passed`);
