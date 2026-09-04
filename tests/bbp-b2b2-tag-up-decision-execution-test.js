const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const TagUpExecution = require("../batted-ball-tag-up-execution.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }

const unitContext = {
  runnerContext: { speed: 8, readQuality: "strong", responseTiming: "early" },
  defensiveContext: {
    catchDefender: { defenderId: "rf", arm: 8, throwing: 8 },
    receivingTarget: { receiverId: "c", receiving: 8, reaction: 8 },
    catchContext: { depth: "deep", pace: "firm" }
  }
};
const safeUnit = TagUpExecution.resolveTagUpExecution({ situationId: "safe", selectedRoute: TagUpExecution.ROUTES.sendHome, contextSnapshot: unitContext }, { rolls: { runnerRoll: 0, throwRoll: .999, receivingRoll: .999 } });
const outUnit = TagUpExecution.resolveTagUpExecution({ situationId: "out", selectedRoute: TagUpExecution.ROUTES.sendHome, contextSnapshot: unitContext }, { rolls: { runnerRoll: .999, throwRoll: 0, receivingRoll: 0 } });
const borderUnit = TagUpExecution.resolveTagUpExecution({ situationId: "border", selectedRoute: TagUpExecution.ROUTES.sendHome, contextSnapshot: unitContext }, { rolls: { runnerRoll: .5, throwRoll: .5, receivingRoll: .5 } });
verify("1. execution 保留 runner／throw／receiving component 與 timing margin", safeUnit.runnerAdvanceChallenge.attempted && safeUnit.throwChallenge.attempted && safeUnit.receivingChallenge.attempted && Number.isFinite(safeUnit.timingMargin));
verify("2. injectable rolls 可強制 clearly safe／out／borderline", safeUnit.physicalOutcome.code === "safeHome" && outUnit.physicalOutcome.code === "taggedOutAtHome" && Math.abs(borderUnit.timingMargin) < Math.max(Math.abs(safeUnit.timingMargin), Math.abs(outUnit.timingMargin)));
verify("3. execution identity 與預設 rolls deterministic", TagUpExecution.resolveTagUpExecution({ situationId: "stable", selectedRoute: TagUpExecution.ROUTES.sendHome, contextSnapshot: unitContext }).executionIdentity === TagUpExecution.resolveTagUpExecution({ situationId: "stable", selectedRoute: TagUpExecution.ROUTES.sendHome, contextSnapshot: unitContext }).executionIdentity);

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "batter-anticipation.js", "batted-ball-physical.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "force-advancement.js", "offensive-bunt-defensive-handoff.js", "batted-ball-ground-defense.js",
  "batted-ball-line-drive-defense.js", "batted-ball-fly-ball-defense.js", "batted-ball-tag-up-execution.js", "match-situation-lifecycle.js",
  "baseball-gameplay-integration.js", "baseball-training-resolver.js", "playing-time-game-exposure.js", "match-experience-development.js",
  "match-development-settlement-presentation.js", "career-spine-contract.js", "career-transition-runtime-resolver.js",
  "career-transition-progression.js", "career-development-runtime-resolver.js", "career-development-progression.js",
  "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
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
  function __bbpB2B2Match({seed=99601,outs=1,runnerId="player",originBase=3,offenseTeam="home"}={}) {
    stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;
    player=createInitialPlayer("BBP-B2B2");applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"});applyCanonicalPositionProfile(player,"內野手",["外野手"]);
    player.chapter="青棒";player.highSchoolStep=5;player.highSchoolRoleCode="starter";player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed;
    const m=prepareHighSchoolYearOneMatch(),half=offenseTeam==="home"?"下":"上",defenseTeam=offenseTeam==="home"?"away":"home";
    const lineup=m.rosters[offenseTeam].lineup, batterIndex=Math.max(0,lineup.findIndex(x=>x.id!==runnerId));
    m.battingOrderIndex[offenseTeam]=batterIndex;
    Object.assign(m,{inning:5,half,offenseTeam,defenseTeam,outs,runners:[null,null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",position:"內野手",developmentPositionOverride:"二壘手"});
    m.runners[originBase-1]=runnerId;m.currentBatter=getHighSchoolMatchLineupBatter(m,offenseTeam).id;
    m.pendingDefensiveResumeState={simulationPhase:"moment_2_resolved",momentIndex:1,currentMomentId:"hs_y1_match_defense_1",currentDomain:"flow",currentAssignment:"resume"};
    m.momentIndex=1;m.currentMomentId="hs_y1_match_defense_1";
    const defender=m.rosters[defenseTeam].lineup.find(x=>x.position==="右外野手")||m.rosters[defenseTeam].lineup[0];
    const truth={version:"batted-ball-physical-v1",identity:"tag-up-physical-"+seed,contactQuality:"solid",ballType:"flyBall",pace:"firm",direction:"rightSide",depth:"deep",executionEvidence:{continuousContactScore:.64}};
    const opportunity=BattedBallFlyBallDefense.buildFlyBallCatchOpportunity({identity:"tag-up-catch-"+seed,physicalTruth:truth,runners:m.runners,outs:m.outs,runnerEntities:[{runnerId,originBase,speed:9,reaction:9,baseballIQ:9}],preContactRunnerStates:{[runnerId]:{movementState:"stationary",touchingOriginBase:true}},defenderContext:{defenderId:defender.id,name:defender.name,position:"右外野手",catching:10,reaction:10,range:10,arm:defender.arm,throwing:defender.arm,source:"simulation-roster"}});
    const catchResult=BattedBallFlyBallDefense.resolveFlyBallCatchExecution(opportunity,{executionRoll:0});
    m.flyBallCatchState=BattedBallFlyBallDefense.applyFlyBallCatchResult(opportunity,catchResult,{paCompatibilityResult:{result:"out",authority:"physicalFlyBallCatchToPACompatibility",officialScoring:"deferred"}});
    player.highSchoolMatch=m;applyHighSchoolFlyBallCatchResolution(m);const situation=createHighSchoolRunnerTagUpSituation(m);return {m,situation};
  }
`);

const firewall = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match();return JSON.stringify({id:x.situation.situationId,state:x.situation.lifecycleState,decision:x.situation.decision,resolution:x.situation.resolution,routes:x.situation.legalRoutes,ctx:x.situation.contextSnapshot,outs:x.m.outs,score:x.m.scores.home,runner:x.m.runners[2],resume:MatchSituationLifecycle.canResumeSimulation(x.situation),visible:isHighSchoolMatchDecisionVisible(x.m),choices:getHighSchoolDefensiveMomentChoices(x.m),text:getHighSchoolDefensiveSituationText(x.m)});})()`));
verify("4. B2B1 handoff 建立 deterministic presented runnerTagUpDecision", firewall.state === "presented" && firewall.id.includes("runnerTagUpDecision") && firewall.id === JSON.parse(evaluate(`JSON.stringify(__bbpB2B2Match().situation.situationId)`)));
verify("5. Decision firewall 前 runner／score／額外 out 不變且無 result leakage", firewall.decision === null && firewall.resolution === null && firewall.runner === "player" && firewall.score === 1 && firewall.outs === 2 && !JSON.stringify(firewall).includes("sacrificeFly"));
verify("6. frozen snapshot 保存 game／runner／defense／catch／physical refs，不複製整場 match", firewall.ctx.gameContext.paIdentity && firewall.ctx.runnerContext.retouchState.retouchSatisfied && firewall.ctx.defensiveContext.catchDefender.defenderId && firewall.ctx.defensiveContext.receivingTarget.receiverId && firewall.ctx.catchIdentity && firewall.ctx.physicalTruthRef && !Object.hasOwn(firewall.ctx, "match"));
verify("7. presentation 與 route 從 frozen situation 讀取", firewall.visible && firewall.choices.map(x=>x.matchDecision).join("|") === "tagUpSendHome|tagUpHoldThird" && firewall.text.includes("三壘壘包") && !firewall.resume);

const beforeReload = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match({seed:99602});const before=JSON.stringify(x.situation),restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return JSON.stringify({same:before===JSON.stringify(restored.activeSituation),state:restored.activeSituation.lifecycleState,routes:restored.activeSituation.legalRoutes.length});})()`));
verify("8. Save/reload before decision 保留 identity／snapshot／routes／state", beforeReload.same && beforeReload.state === "presented" && beforeReload.routes === 2);

const safe = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match({seed:99603}),m=x.m,id=x.situation.situationId;resolveHighSchoolRunnerTagUpDecision(m,"tagUpSendHome",{rolls:{runnerRoll:0,throwRoll:.999,receivingRoll:.999}});return JSON.stringify({outs:m.outs,score:m.scores.home,runner:m.runners[2],active:m.activeSituation,summary:m.lastClosedSituationSummary,id,logs:m.simulationLog.filter(e=>e.type==="runnerTagUpResolution").length,runLogs:m.simulationLog.filter(e=>e.type==="run"&&e.runnerId==="player"&&e.source==="tagUp").length,phase:m.simulationPhase});})()`));
verify("9. Fixture A SEND safe：得 1 分、離開三壘、outs 留在 catch 後 2、close 後 resume", safe.score === 2 && safe.runner === null && safe.outs === 2 && safe.active === null && safe.summary.situationId === safe.id && safe.summary.outcome === "safeHome" && safe.logs === 1 && safe.runLogs === 1 && safe.phase === "moment_2_resolved");

const out = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match({seed:99604}),m=x.m;resolveHighSchoolRunnerTagUpDecision(m,"tagUpSendHome",{rolls:{runnerRoll:.999,throwRoll:0,receivingRoll:0}});return JSON.stringify({outs:m.outs,score:m.scores.home,runner:m.runners[2],pending:m.pendingHalfInningTermination,summary:m.lastClosedSituationSummary});})()`));
verify("10. Fixture B SEND out：追加第三出局、不計分、runner 移除、non-force half end", out.outs === 3 && out.score === 1 && out.runner === null && out.pending.halfInningEnded && out.pending.thirdOutType === "nonForceTag" && out.summary.outsBefore === 2 && out.summary.outsAfter === 3);

const hold = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match({seed:99605}),m=x.m;resolveHighSchoolRunnerTagUpDecision(m,"tagUpHoldThird");return JSON.stringify({outs:m.outs,score:m.scores.home,runner:m.runners[2],summary:m.lastClosedSituationSummary});})()`));
verify("11. Fixture C HOLD 經完整 lifecycle，runner 留三壘且 score／outs 不變", hold.outs === 2 && hold.score === 1 && hold.runner === "player" && hold.summary.selectedRoute === "tagUpHoldThird" && hold.summary.outcome === "heldThird");

const pendingReload = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match({seed:99606}),m=x.m;resolveHighSchoolRunnerTagUpDecision(m,"tagUpSendHome",{rolls:{runnerRoll:0,throwRoll:.999,receivingRoll:.999},deferSettlement:true});player.highSchoolMatch=m;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch,before={outs:restored.outs,score:restored.scores.home,runner:restored.runners[2],execution:restored.activeSituation.resolution.executionEvidence.executionIdentity};settleAndCloseHighSchoolRunnerTagUpSituation(restored);const once={outs:restored.outs,score:restored.scores.home,runner:restored.runners[2],logs:restored.simulationLog.filter(e=>e.type==="runnerTagUpResolution").length};settleAndCloseHighSchoolRunnerTagUpSituation(restored);const twice={outs:restored.outs,score:restored.scores.home,runner:restored.runners[2],logs:restored.simulationLog.filter(e=>e.type==="runnerTagUpResolution").length};return JSON.stringify({before,once,twice,active:restored.activeSituation});})()`));
verify("12. Reload after execution 保存 execution identity，settlement 不 reroll、不 double apply", pendingReload.before.runner === "player" && pendingReload.before.score === 1 && pendingReload.once.score === 2 && JSON.stringify(pendingReload.once) === JSON.stringify(pendingReload.twice) && pendingReload.active === null);

const catchThird = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match({seed:99607,outs:2});return JSON.stringify({situation:x.situation,active:x.m.activeSituation,outs:x.m.outs,pending:x.m.flyBallCatchState.pendingTagUpHandoff});})()`));
verify("13. Fixture G catch 本身第三出局，不建立 tag-up situation", catchThird.outs === 3 && catchThird.situation === null && catchThird.active == null && catchThird.pending.reason === "thirdOutCatch");

const nonPlayer = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match({seed:99608,runnerId:"away-sim-2",offenseTeam:"away"});return JSON.stringify({admission:x.situation.admission,state:x.situation.lifecycleState,active:x.m.activeSituation,score:x.m.scores.away,runner:x.m.runners[2],summary:x.m.lastClosedSituationSummary});})()`));
verify("14. Fixture H 非玩家 runner 採 aiDecision ownership 後安全 terminal，不呈現玩家 choices", nonPlayer.admission.mode === "aiDecision" && nonPlayer.state === "closed" && nonPlayer.active === null && nonPlayer.score === 1 && nonPlayer.runner === "away-sim-2" && nonPlayer.summary.outcome === "nonPlayerTagUpDecisionDeferred");

const unsupported = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match({seed:99609,runnerId:"player",originBase:2});return JSON.stringify({admission:x.situation.admission,state:x.situation.lifecycleState,active:x.m.activeSituation,score:x.m.scores.home,runners:x.m.runners,summary:x.m.lastClosedSituationSummary});})()`));
verify("15. Fixture I 2B→3B unsupportedFallback 不假造結果且不留下 lock", unsupported.admission.mode === "unsupportedFallback" && unsupported.state === "closed" && unsupported.active === null && unsupported.score === 1 && unsupported.runners[1] === "player" && unsupported.summary.outcome === "unsupportedTagUpTopology");

const repeated = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match({seed:99610}),m=x.m;resolveHighSchoolRunnerTagUpDecision(m,"tagUpHoldThird");const before={outs:m.outs,score:m.scores.home,runner:m.runners[2],order:m.battingOrderIndex.home,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,log:m.simulationLog.length};resolveHighSchoolRunnerTagUpDecision(m,"tagUpHoldThird");const after={outs:m.outs,score:m.scores.home,runner:m.runners[2],order:m.battingOrderIndex.home,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,log:m.simulationLog.length};return JSON.stringify({before,after});})()`));
verify("16. Fixture F 重複 decision/settlement 不 double score/out/runner/PA/log", JSON.stringify(repeated.before) === JSON.stringify(repeated.after));
const routed = JSON.parse(evaluate(`(() => {const x=__bbpB2B2Match({seed:99611}),m=x.m,result=resolveHighSchoolYearOneMatch("tagUpHoldThird");return JSON.stringify({result,runner:m.runners[2],active:m.activeSituation,summary:m.lastClosedSituationSummary});})()`));
verify("17. 正式 match decision entry 可執行 HOLD 並關閉 situation", routed.result.includes("留在三壘") && routed.runner === "player" && routed.active === null && routed.summary.selectedRoute === "tagUpHoldThird");
verify("18. runtime load order 在 fly defense 後、script 前載入 execution 與 lifecycle", runtimeFiles.indexOf("batted-ball-fly-ball-defense.js") < runtimeFiles.indexOf("batted-ball-tag-up-execution.js") && runtimeFiles.indexOf("batted-ball-tag-up-execution.js") < runtimeFiles.indexOf("script.js"));

console.log(`BBP-B2B2 Tag-Up Decision & Execution tests: ${passed}/${passed} passed`);
