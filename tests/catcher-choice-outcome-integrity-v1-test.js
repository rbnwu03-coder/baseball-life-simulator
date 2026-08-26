const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js",
  "baseball-offense-prototype.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
  "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const nodes = new Map();
  const context = vm.createContext({
    console, module: { exports: {} },
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
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { setTimeout() { return 1; }, clearTimeout() {} }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    function __setupCatcher(runners=[], seed=41001) {
      stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
      player=createInitialPlayer("Catcher Integrity Fixture");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"捕手",["內野手"]);
      player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
      pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      Object.assign(match,{position:"捕手",playerFieldingAssignment:"捕手",currentFieldingPosition:"捕手",positionDecisionFamily:"",defensiveSituation:{},momentIndex:1,currentMomentId:highSchoolYearOneMomentIds[1],currentDomain:"defense",simulationPhase:"moment_2_ready",inning:4,half:"上",offenseTeam:"away",defenseTeam:"home",outs:1,runners:[null,null,null]});
      runners.forEach((base,index)=>{if(base)match.runners[index]=match.rosters.away.lineup[index+1].id;});
      match.currentBatter=getHighSchoolMatchLineupBatter(match,"away").id;
      setHighSchoolDefensiveBallContext(match,"highChop");
      match.currentAssignment=getHighSchoolDefensiveSituationText(match);
      setHighSchoolCoachTacticalDirection(match);
      return match;
    }
    function __resolveCatcher(route,runners=[],sample=.8,trigger=null,seed=41001) {
      const match=__setupCatcher(runners,seed);
      if(trigger)match.catcherReassessmentTrigger=trigger;
      const beforeOrder=match.battingOrderIndex.away;
      const narrative=resolveHighSchoolYearOneMatch(route,match.currentMomentId,()=>sample);
      return {match,narrative,beforeOrder,moment:match.completedMoments.at(-1),resolution:match.lastDefensiveResolution};
    }
  `, context);
  return context;
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

verify("1. 每個 player-visible 捕手選項都有唯一 canonical intent", evaluate(`(() => {const c=getHighSchoolDefensiveMomentChoices(__setupCatcher());return c.every(x=>x.catcherIntent&&x.routeId===x.catcherIntent)&&new Set(c.map(x=>x.catcherIntent)).size===c.length;})()`));
verify("2. 無跑者時只顯示控制／重設 route，不顯示抓跑者 route", evaluate(`(() => {const ids=getHighSchoolDefensiveMomentChoices(__setupCatcher()).map(x=>x.catcherIntent);return ids.includes("secureAndReset")&&!ids.includes("attemptLeadRunnerOut")&&!ids.includes("attemptHomeOut");})()`));
verify("3. 有跑者時不提供悠閒 secureAndReset", evaluate(`!getHighSchoolDefensiveMomentChoices(__setupCatcher([true,false,false])).some(x=>x.catcherIntent==="secureAndReset")`));
verify("4. 接穩交回投手保留 selectedRoute 與 finalRoute", evaluate(`(() => {const x=__resolveCatcher("secureAndReset");return x.resolution.selectedRoute==="secureAndReset"&&x.resolution.finalRoute==="secureAndReset"&&!x.resolution.reassessment;})()`));
verify("5. secureAndReset execution 真的回傳投手且不傳壘", evaluate(`(() => {const x=__resolveCatcher("secureAndReset");const s=x.resolution.executionStages;return s.releaseDecision==="returnToPitcher"&&s.throw==="notAttempted"&&s.reset==="completed"&&!x.moment.executionText.includes("補位");})()`));
verify("6. secureAndReset outcome 不產生 phantom runner／base throw", evaluate(`(() => {const x=__resolveCatcher("secureAndReset");return x.match.runners.every(v=>v===null)&&x.resolution.outsCreated===0&&x.moment.outcome.includes("交回投手")&&!x.narrative.includes("趁傳");})()`));
verify("7. holdRunner route 不傳球、不虛構出局且跑者守恆", evaluate(`(() => {const x=__resolveCatcher("holdRunnerAndReset",[true,true,false]);return x.resolution.executionStages.throw==="notAttempted"&&x.resolution.outsCreated===0&&x.match.runners.filter(Boolean).length===2&&x.resolution.runnerChanges.every(c=>c.to===c.from);})()`));
verify("8. attemptRunnerOut 才會實際傳向壘包並解算 timing", evaluate(`(() => {const x=__resolveCatcher("attemptLeadRunnerOut",[false,true,false],.99);return x.resolution.executionStages.throw==="completed"&&x.resolution.finalRoute==="attemptLeadRunnerOut"&&["runnerOut","runnerSafe"].includes(x.resolution.resultCode);})()`));
verify("9. aggressive route 才允許出現 runner out／趁傳類 consequence", evaluate(`(() => {const reset=__resolveCatcher("secureAndReset").resolution;const attack=__resolveCatcher("attemptLeadRunnerOut",[false,true,false],0).resolution;return !["runnerOut","throwingError"].includes(reset.resultCode)&&["runnerOut","runnerSafe","throwingError"].includes(attack.resultCode);})()`));
verify("10. secure intent 發生 late runner break 時建立 explicit reassessment", evaluate(`(() => {const x=__resolveCatcher("holdRunnerAndReset",[false,false,true],.9,{active:true,runnerBase:3,reason:"lateBreak"});return x.resolution.reassessment?.explicit&&x.resolution.selectedRoute==="holdRunnerAndReset"&&x.resolution.finalRoute==="attemptHomeOut";})()`));
verify("11. reassessment presentation 說明原 intent 與局勢改變", evaluate(`(() => {const x=__resolveCatcher("holdRunnerAndReset",[false,false,true],.9,{active:true,runnerBase:3});return x.moment.executionText.includes("原本準備")&&x.moment.executionText.includes("突然啟動")&&x.moment.executionText.includes("本壘");})()`));
verify("12. 無 explicit trigger 時不得 silent route rewrite", evaluate(`(() => {const routes=["secureAndHold","secureAndReset","holdRunnerAndReset","blockAndControl"];return routes.filter(r=>getHighSchoolDefensiveMomentChoices(__setupCatcher([false,true,false])).some(c=>c.catcherIntent===r)).every(r=>{const x=__resolveCatcher(r,[false,true,false]);return x.resolution.selectedRoute===x.resolution.finalRoute&&!x.resolution.reassessment;});})()`));
verify("13. 捕手 attribution 沿用 responsibleActor／cause contract", evaluate(`(() => {const r=__resolveCatcher("attemptLeadRunnerOut",[false,true,false],0).resolution;return r.responsibleActor==="player"&&r.primaryCause&&r.playerResponsibility&&r.teammateResponsibility==="none";})()`));
verify("14. 捕手處理不把 blocked pitch 虛構成打者完成打席", evaluate(`(() => {const x=__resolveCatcher("secureAndReset");return x.match.battingOrderIndex.away===x.beforeOrder&&!x.match.simulationLog.some(e=>e.type==="plateAppearance"&&e.meaningful&&e.batterId===x.match.currentBatter);})()`));
verify("15. save/reload 深層保留 selected／final route 與 stages", evaluate(`(() => {const x=__resolveCatcher("secureAndReset");player.highSchoolMatch=x.match;const m=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return m.catcherDecisionState.selectedRoute==="secureAndReset"&&m.catcherDecisionState.finalRoute==="secureAndReset"&&m.catcherDecisionState.executionStages.reset==="completed";})()`));
verify("16. reassessment state save/reload 後不退回另一 generic route", evaluate(`(() => {const x=__resolveCatcher("holdRunnerAndReset",[false,false,true],.9,{active:true,runnerBase:3});player.highSchoolMatch=x.match;const m=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return m.catcherDecisionState.selectedRoute==="holdRunnerAndReset"&&m.catcherDecisionState.reassessment.explicit&&m.catcherDecisionState.finalRoute==="attemptHomeOut";})()`));
verify("17. 同 seed／同 choice selected route 與 outcome deterministic", evaluate(`(() => {const a=__resolveCatcher("attemptLeadRunnerOut",[false,true,false],.42,null,41991).resolution;const b=__resolveCatcher("attemptLeadRunnerOut",[false,true,false],.42,null,41991).resolution;return JSON.stringify({s:a.selectedRoute,f:a.finalRoute,r:a.resultCode,o:a.outcome,x:a.executionStages})===JSON.stringify({s:b.selectedRoute,f:b.finalRoute,r:b.resultCode,o:b.outcome,x:b.executionStages});})()`));
verify("18. 捕手修正沒有消耗 match simulation RNG cursor", evaluate(`(() => {const m=__setupCatcher([false,true,false]);const before=m.simulationCursor;resolveHighSchoolCatcherDecision(m,"attemptLeadRunnerOut",()=>.5);return m.simulationCursor===before;})()`));
verify("19. Match Experience 支援邊界仍只有 2B defense 與 batter", !fs.readFileSync(path.join(root, "match-experience-development.js"), "utf8").includes("catcherDecisionState"));
verify("20. 捕手 decision 不直接寫入永久 skill growth", evaluate(`(() => {const m=__setupCatcher();const before=JSON.stringify(player.baseballSkills);resolveHighSchoolYearOneMatch("secureAndReset",m.currentMomentId,()=>.8);return JSON.stringify(player.baseballSkills)===before;})()`));

console.log(`\nCatcher Choice Outcome Integrity v1：${passed}/${passed} 通過`);
