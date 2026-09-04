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
  "match-situation-lifecycle.js",
  "playing-time-game-exposure.js", "match-experience-development.js", "match-development-settlement-presentation.js",
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
  function __homeRouteMatch(seed=99501,{outs=1,loaded=false}={}) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("Home Route"); applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"}); applyCanonicalPositionProfile(player,"內野手",["外野手"]);
    player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed;
    const m=prepareHighSchoolYearOneMatch(),away=m.rosters.away.lineup;
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs,
      runners:loaded?[away[3].id,away[4].id,away[5].id]:[away[3].id,null,away[5].id],scores:{home:1,away:1},
      simulationPhase:"moment_1_resolved",currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",
      position:"內野手",developmentPositionOverride:"二壘手",defensiveSituation:{}});
    m.battingOrderIndex.away=2;m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id;player.highSchoolMatch=m;return m;
  }
  function __homeRouteOptions(m,{attack=true,committed=false,late=false}={}) {
    const r3=m.runners[2];
    return {tacticalActionOverride:"standardAttack",
      ...(attack===null?{}:{preContactRunnerStates:{[r3]:{movementDecision:attack?"commitAdvance":"holdBase",targetBase:attack?"home":"third",movementState:committed?"committed":attack?"advancing":"holding",advancementProgress:late?"late":"early",startQuality:"normalStart"}}}),
      situationOverrides:{playerCapabilities:{fielding:10,reaction:10,range:10,arm:10,throwing:10,decision:10}},
      ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,
        physicalRolls:{contactQuality:.65,ballType:.1,pace:.68,direction:.9,depth:.4},outcomeRoll:.5}};
  }
  function __prepareHome(seed=99501,setup={},runner={}) {
    const m=__homeRouteMatch(seed,setup),opts=__homeRouteOptions(m,runner),event=prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
    return {m,opts,event,choices:getHighSchoolDefensiveMomentChoices(m),s:m.defensiveSituation};
  }
`);

const created = JSON.parse(evaluate(`(() => {const x=__prepareHome();return JSON.stringify({
  truth:x.m.groundBallInPlayState.runnerRealization,window:x.s.routeWindows.homeOutWindow,evaluation:x.s.homeRouteEvaluation,
  routes:x.choices.map(c=>({id:c.routeId,route:c.infieldRoute,hint:c.successChanceHint,basis:c.successChanceBasis,tradeoff:c.strategicTradeoff})),
  coach:x.m.coachInstruction,text:getHighSchoolDefensiveSituationText(x.m),lifecycle:x.m.activeSituation
});})()`));
verify("1. Production chain 由普通擊球 physical truth 建立原三壘跑者攻本壘", created.truth.authority === "bbpPhysicalTruth+baseForceState" && created.truth.existingRunners.some(runner => runner.originBase === 3 && runner.targetBase === "home" && runner.movementState === "advancing" && !runner.isForced));
verify("2. Fixture A 同時提供本壘、二壘與一壘三條 legal route", ["preventRunHome", "initiate463", "secureFirstBaseOut"].every(id => created.routes.some(route => route.id === id)));
verify("3. preventRunHome 是 tagHome，不是 homeForceOut", created.routes.some(route => route.id === "preventRunHome" && route.route === "tagHome") && !created.routes.some(route => route.id === "homeForceOut"));
verify("4. Normal window 可讀為成功機會中，且標記不是固定 probability", created.window.state === "normal" && created.routes.some(route => route.id === "preventRunHome" && route.hint === "中" && route.basis === "roughOpportunityWindowNotProbability" && route.tradeoff.includes("觸殺")));
verify("5. 場上資訊與教練建議都讀到同一 runner threat", created.text.includes("三壘跑者已啟動攻本壘") && created.text.includes("本壘觸殺") && created.coach.includes("先守住得分"));
verify("5a. Ground Ball canonical Situation 已 presented 且 freeze 三條 routes", created.lifecycle.type === "groundBallDefensiveDecision" && created.lifecycle.lifecycleState === "presented" && created.lifecycle.legalRoutes.length === 3 && created.lifecycle.decision === null && Object.keys(created.lifecycle.contextSnapshot).length < 12);

const expired = JSON.parse(evaluate(`(() => {const x=__prepareHome(99502,{}, {attack:true,committed:true,late:true});return JSON.stringify({routes:x.choices.map(c=>c.routeId),evaluation:x.s.homeRouteEvaluation,coach:x.m.coachInstruction});})()`));
verify("6. Fixture B expired 是已評估但不可用，其他路線保留", expired.evaluation.legal && !expired.evaluation.viable && expired.evaluation.unavailableReason === "homeTagWindowExpired" && !expired.routes.includes("preventRunHome") && expired.routes.includes("secureFirstBaseOut") && expired.routes.includes("initiate463"));
verify("7. Expired 時 coach 不再要求守本壘", expired.coach.includes("本壘已經來不及") && !expired.coach.includes("先守住得分"));

const holding = JSON.parse(evaluate(`(() => {const x=__prepareHome(99503,{}, {attack:false});return JSON.stringify({routes:x.choices.map(c=>c.routeId),evaluation:x.s.homeRouteEvaluation,text:getHighSchoolDefensiveSituationText(x.m)});})()`));
verify("8. Fixture C holding 不產生假本壘威脅", !holding.evaluation.legal && !holding.routes.includes("preventRunHome") && !holding.text.includes("已啟動攻本壘"));

const loaded = JSON.parse(evaluate(`(() => {const x=__prepareHome(99504,{loaded:true},{attack:false});return JSON.stringify(x.choices.map(c=>({id:c.routeId,route:c.infieldRoute})));})()`));
verify("9. Fixture F 滿壘只建立 homeForceOut classification", loaded.some(route => route.id === "homeForceOut" && route.route === "forceHome") && !loaded.some(route => route.id === "preventRunHome"));

const recommendationFirewall = JSON.parse(evaluate(`(() => {const x=__prepareHome(99505),before=x.choices.map(c=>c.routeId).sort();x.m.coachTacticalDirection={domain:"defense",intent:"secureOut",riskPreference:"balanced",priority:"先換出局數"};x.m.coachInstruction="先換出局數。";const after=getHighSchoolDefensiveMomentChoices(x.m).map(c=>c.routeId).sort();return JSON.stringify({before,after});})()`));
verify("10. Fixture G coach recommendation 不建立也不刪除 legal route", JSON.stringify(recommendationFirewall.before) === JSON.stringify(recommendationFirewall.after));

const success = JSON.parse(evaluate(`(() => {
  const x=__prepareHome(99506),m=x.m,c=x.choices.find(c=>c.routeId==="preventRunHome"),before={outs:m.outs,away:m.scores.away,runners:m.runners.slice(),order:m.battingOrderIndex.away};
  const r=resolveHighSchoolDefensivePlay(m,c.matchDecision,()=>.99);applyInfieldResolutionToHighSchoolMatch(m,c.matchDecision,r);
  return JSON.stringify({before,after:{outs:m.outs,away:m.scores.away,runners:m.runners.slice(),order:m.battingOrderIndex.away},r,h:m.groundBallInPlayState,logs:m.simulationLog.filter(e=>e.type==="defensiveResolution").length,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length});
})()`));
verify("11. Fixture D 本壘成功要求 possession + tag，再將 runner3B 判出局", success.r.homeTagLeg.possession === "secured" && success.r.homeTagLeg.tagRequired && success.r.homeTagLeg.tagOpportunity === "formed" && success.r.homeTagLeg.result === "out" && success.after.outs === success.before.outs + 1 && success.after.away === success.before.away);
verify("12. 選本壘後 batter-runner 與 runner1B 依 force continuation 到一、二壘", success.after.runners[0] === success.r.runnerChanges.find(change => change.from === "batter").runnerId && success.after.runners[1] === success.before.runners[0] && success.after.runners[2] === null);
const homeLifecycle = JSON.parse(evaluate(`JSON.stringify(player.highSchoolMatch.lastClosedSituationSummary)`));
verify("12a. Fixture B Home route 經完整 lifecycle 關閉後才恢復 simulation", homeLifecycle.lifecycleState === "closed" && homeLifecycle.selectedRoute === "preventRunHome" && homeLifecycle.transitionHistory.map(item=>item.state).join("|") === "created|admitted|presented|decided|executing|resolved|settled|closed");

const failure = JSON.parse(evaluate(`(() => {
  const x=__prepareHome(99507),m=x.m,c=x.choices.find(c=>c.routeId==="preventRunHome");m.defensiveSituation.teammates.catcher.capabilities={fielding:5,reaction:5,range:5,arm:5,throwing:5,decision:5};
  const before={outs:m.outs,away:m.scores.away},r=resolveHighSchoolDefensivePlay(m,c.matchDecision,()=>0);applyInfieldResolutionToHighSchoolMatch(m,c.matchDecision,r);
  return JSON.stringify({before,after:{outs:m.outs,away:m.scores.away,runners:m.runners.slice()},r});
})()`));
verify("13. Fixture E 捕手接球後 runner beat tag 會得分且不增加出局", failure.r.homeTagLeg.possession === "secured" && failure.r.homeTagLeg.tagOpportunity === "formed" && failure.r.homeTagLeg.result === "safe" && failure.after.away === failure.before.away + 1 && failure.after.outs === failure.before.outs);

const saveReload = JSON.parse(evaluate(`(() => {const x=__prepareHome(99508),m=x.m;player.highSchoolMatch=m;const before=JSON.stringify({runner:m.groundBallInPlayState.runnerRealization,window:m.defensiveSituation.routeWindows.homeOutWindow,evaluation:m.defensiveSituation.homeRouteEvaluation,routes:getHighSchoolDefensiveMomentChoices(m),coach:m.coachInstruction,lifecycle:m.activeSituation});const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;const after=JSON.stringify({runner:restored.groundBallInPlayState.runnerRealization,window:restored.defensiveSituation.routeWindows.homeOutWindow,evaluation:restored.defensiveSituation.homeRouteEvaluation,routes:getHighSchoolDefensiveMomentChoices(restored),coach:restored.coachInstruction,lifecycle:restored.activeSituation});return JSON.stringify({same:before===after});})()`));
verify("14. Fixture I pending decision save/reload 不重抽 runner、window、route 或 recommendation", saveReload.same);

const noDouble = JSON.parse(evaluate(`(() => {const x=__prepareHome(99509),m=x.m,c=x.choices.find(c=>c.routeId==="preventRunHome"),r=resolveHighSchoolDefensivePlay(m,c.matchDecision,()=>.99);applyInfieldResolutionToHighSchoolMatch(m,c.matchDecision,r);const once={outs:m.outs,score:m.scores.away,runners:m.runners.slice(),order:m.battingOrderIndex.away,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,event:m.simulationLog.filter(e=>e.type==="defensiveResolution").length};applyInfieldResolutionToHighSchoolMatch(m,c.matchDecision,r);const twice={outs:m.outs,score:m.scores.away,runners:m.runners.slice(),order:m.battingOrderIndex.away,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,event:m.simulationLog.filter(e=>e.type==="defensiveResolution").length};return JSON.stringify({same:JSON.stringify(once)===JSON.stringify(twice),once,h:m.groundBallInPlayState});})()`));
verify("15. Fixture J runner、run/out、PA、打序與 event 只結算一次", noDouble.same && noDouble.once.pa === 1 && noDouble.once.event === 1 && noDouble.h.settlementApplied);

const thirdOut = JSON.parse(evaluate(`(() => {const t=resolveHighSchoolThirdOutIntegrity({outsBefore:2,outsCreated:1,runnersBefore:["r1",null,"r3"],proposedRunnersAfter:["b", "r1", null],scoringAttempts:[],thirdOutType:HIGH_SCHOOL_THIRD_OUT_TYPES.nonForceTag});return JSON.stringify(t);})()`));
verify("16. Non-force home tag 第三出局規則無第四出局、無重複得分且半局終止", thirdOut.outsAfter === 3 && thirdOut.basesAfter.every(runner => !runner) && thirdOut.halfInningEnded && thirdOut.thirdOutType === "nonForceTag" && thirdOut.legalScoringRunnerIds.length === 0);

const ui = evaluate(`(() => {const x=__prepareHome(99511);advanceHighSchoolPresentationCursor(x.m);renderHighSchoolYearOneMatch({title:"守備決策"});return document.getElementById("choices").innerHTML;})()`);
verify("17. Production UI 可顯示三個按鈕、粗略成功機會與取捨，無 raw route id", (ui.match(/<button/g) || []).length === 3 && ui.includes("成功機會：中") && ui.includes("取捨：") && !/preventRunHome|homeForceOut|initiate463/.test(ui));

const naturalProduction = JSON.parse(evaluate(`(() => {
  const m=__homeRouteMatch(99512),opts=__homeRouteOptions(m,{attack:null});
  const callerOwnsInjection=Object.hasOwn(opts,"preContactRunnerStates");
  prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
  const runner=m.groundBallInPlayState.runnerRealization.existingRunners.find(r=>r.originBase===3);
  const choices=getHighSchoolDefensiveMomentChoices(m);
  return JSON.stringify({callerOwnsInjection,runner,window:m.defensiveSituation.routeWindows.homeOutWindow,routes:choices.map(c=>c.routeId),uiText:getHighSchoolDefensiveSituationText(m)});
})()`));
verify("18. Fixture J production caller 不注入 preContactRunnerStates 仍自然產生 runner3B decision", !naturalProduction.callerOwnsInjection && naturalProduction.runner.advanceDecision.authority.includes("runnerAdvanceOpportunity") && naturalProduction.runner.movementDecision === "commitAdvance");
verify("19. 自然 commit 經 canonical realization 產生 Home route 與三路 decision set", naturalProduction.window.state !== "expired" && ["preventRunHome", "initiate463", "secureFirstBaseOut"].every(id => naturalProduction.routes.includes(id)));
verify("20. Fixture H presentation 只陳述已啟動與可用窗口，不預告得分", naturalProduction.uiText.includes("三壘跑者已啟動攻本壘") && !naturalProduction.uiText.includes("一定得分"));

const naturalReload = JSON.parse(evaluate(`(() => {
  const x=__prepareHome(99513,{}, {attack:null}),m=x.m;
  player.highSchoolMatch=m;
  const before=JSON.stringify({decision:m.groundBallInPlayState.runnerRealization.runnerAdvanceDecisions,runner:m.groundBallInPlayState.runnerRealization.existingRunners,window:m.defensiveSituation.routeWindows.homeOutWindow,routes:getHighSchoolDefensiveMomentChoices(m).map(c=>c.routeId)});
  const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;
  const after=JSON.stringify({decision:restored.groundBallInPlayState.runnerRealization.runnerAdvanceDecisions,runner:restored.groundBallInPlayState.runnerRealization.existingRunners,window:restored.defensiveSituation.routeWindows.homeOutWindow,routes:getHighSchoolDefensiveMomentChoices(restored).map(c=>c.routeId)});
  return JSON.stringify({same:before===after});
})()`));
verify("21. Fixture E natural runner decision pending 時 save/reload 不重抽", naturalReload.same);

const coachFirewall = JSON.parse(evaluate(`(() => {
  const x=__prepareHome(99514,{}, {attack:null}),m=x.m;
  const before=JSON.stringify(m.groundBallInPlayState.runnerRealization.runnerAdvanceDecisions);
  m.coachTacticalDirection={domain:"defense",intent:"secureOut",riskPreference:"conservative",priority:"先換出局數"};
  m.coachInstruction="先換出局數。";
  const after=JSON.stringify(m.groundBallInPlayState.runnerRealization.runnerAdvanceDecisions);
  return JSON.stringify({same:before===after});
})()`));
verify("22. Fixture F defensive coach preference 不改寫對手跑者 decision", coachFirewall.same);

const reassessmentLifecycle = JSON.parse(evaluate(`(() => {
  const x=__prepareHome(99515),m=x.m,c=x.choices.find(c=>c.routeId==="initiate463");
  m.defensiveSituation.executionChange="bobble";
  const r=resolveHighSchoolDefensivePlay(m,c.matchDecision,()=>.99);
  applyInfieldResolutionToHighSchoolMatch(m,c.matchDecision,r);
  return JSON.stringify({reassessed:r.reassessed,summary:m.lastClosedSituationSummary,active:m.activeSituation,pending:m.pendingDefensiveResumeState});
})()`));
verify("23. Fixture C multi-leg execution 在同一 Situation 經 reassessing 後關閉", reassessmentLifecycle.reassessed && reassessmentLifecycle.summary.transitionHistory.some(item=>item.state==="reassessing") && reassessmentLifecycle.summary.phase === "reassessment");
verify("24. Situation closed 後清除 active pointer 與 pending resume，才允許 simulation 繼續", reassessmentLifecycle.active === null && reassessmentLifecycle.pending === null);

const automaticThirdOut = JSON.parse(evaluate(`(() => {
  const m=__homeRouteMatch(99516,{outs:2}),opts=__homeRouteOptions(m,{attack:false});
  opts.randomSource=()=>.99;
  prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
  return JSON.stringify({summary:m.lastClosedSituationSummary,active:m.activeSituation,pending:m.pendingHalfInningTermination,routes:m.lastClosedSituationSummary?.transitionHistory||[]});
})()`));
verify("25. Fixture E 單一路線走 automatic lifecycle，不建立 player decision", automaticThirdOut.summary.transitionHistory.some(item=>item.state==="admitted") && !automaticThirdOut.summary.transitionHistory.some(item=>item.state==="presented"));
verify("26. 第三出局前 active Situation 已 settled／closed 並清除 pointer", automaticThirdOut.summary.lifecycleState === "closed" && automaticThirdOut.active === null && automaticThirdOut.pending?.halfInningEnded === true);
verify("27. Presentation 不洩漏 lifecycle／admission／reassessment developer words", !/lifecycle|admitted|reassessing|unsupported fallback|vertical slice/i.test(ui));

const abandonedRoutine = JSON.parse(evaluate(`(() => {
  const m=__homeRouteMatch(99517),opts=__homeRouteOptions(m,{attack:false});
  prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
  if (!m.activeSituation) {
    let s=MatchSituationLifecycle.createSituation({type:MatchSituationLifecycle.TYPES.groundBallDefensiveDecision,gameId:m.id,inning:m.inning,half:m.half,paIdentity:"routine-no-resolution",simulationPoint:"fallback",legalRoutes:[{routeId:"automatic"}]});
    s=MatchSituationLifecycle.admitSituation(s,{supported:true,playerOwnsDecision:false});
    s=MatchSituationLifecycle.beginExecution(s,{selectedRoute:"automatic"});m.activeSituation=s;
  }
  const closed=abandonActiveMatchSituation(m,"noRoutineResolution");
  return JSON.stringify({closed,summary:m.lastClosedSituationSummary,active:m.activeSituation});
})()`));
verify("28. routine resolver 無 resolution 時由 lifecycle abandon 後才清 pointer", abandonedRoutine.closed.closeState.terminalMode === "abandoned" && abandonedRoutine.summary.outcome === "noRoutineResolution" && abandonedRoutine.active === null);

console.log(`Ground Ball Home Route Production Integration tests: ${passed}/${passed} passed`);
