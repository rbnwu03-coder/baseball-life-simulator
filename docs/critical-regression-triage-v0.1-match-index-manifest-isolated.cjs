const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "team-roster-foundation.js",
  "team-strength-model.js",
  "high-school-entry-roster-context.js",
  "high-school-competition-foundation.js",
  "match-context-foundation.js",
  "competition-rules.js",
  "high-school-schedule-opportunity.js",
  "high-school-exchange-network.js",
  "high-school-friendly-invitation-producer.js",
  "high-school-training-camp-producer.js",
  "high-school-match-opportunity-generation.js",
  "high-school-opportunity-probability.js",
  "high-school-opportunity-selection.js",
  "high-school-relationship-temporal-authority.js",
  "high-school-relationship-recency.js",
  "match-game-record.js",
  "high-school-competition-evidence.js",
  "county-selection-opportunity.js",
  "national-selection-pipeline.js",
  "player.js",
  "current-state-boundary.js",
  "time-boundary.js",
  "relationship-boundary.js",
  "evaluation-registry.js",
  "coach-evaluation-boundary.js",
  "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js",
  "decision-flow.js",
  "day-completion-flow.js",
  "relationship-flow.js",
  "coach-response-flow.js",
  "narrative-condition-flow.js",
  "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js",
  "baseball-defense-prototype.js",
  "baseball-offense-prototype.js",
  "pitcher-mental-state.js",
  "pitcher-process-state.js",
  "pitch-sequencing.js",
  "pitcher-catcher-tactical-integration.js",
  "batter-anticipation.js",
  "batted-ball-physical.js",
  "batted-ball-outcome-mapping.js",
  "defensive-opportunity-foundation.js",
  "defensive-reach-secure-foundation.js",
  "offensive-plate-approach.js",
  "pitch-observation-foundation.js",
  "pitch-sequence-state-foundation.js",
  "pitch-tactical-interpretation-foundation.js",
  "pitch-tactical-decision-foundation.js",
  "pitch-tactical-decision-production-adapter.js",
  "offensive-tactical-opportunity.js",
  "offensive-tactical-decision.js",
  "offensive-tactical-action.js",
  "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js",
  "force-advancement.js",
  "defensive-decision-throw-foundation.js",
  "offensive-bunt-defensive-handoff.js",
  "defensive-runner-throw-settlement-foundation.js",
  "batted-ball-ground-defense.js",
  "batted-ball-line-drive-defense.js",
  "batted-ball-fly-ball-defense.js",
  "batted-ball-tag-up-execution.js",
  "receiver-source-snapshot.js",
  "match-situation-lifecycle.js",
  "plate-decision-foundation.js",
  "baseball-gameplay-integration.js",
  "baseball-training-resolver.js",
  "playing-time-game-exposure.js",
  "match-experience-development.js",
  "high-school-competition-reassessment.js",
  "high-school-year-transition.js",
  "high-school-career-evaluation.js",
  "high-school-career-offers.js",
  "match-development-settlement-presentation.js",
  "career-spine-contract.js",
  "career-transition-resolver.js",
  "career-transition-commit.js",
  "career-transition-runtime-resolver.js",
  "career-transition-progression.js",
  "career-development-runtime-resolver.js",
  "career-development-progression.js",
  "career-age22-outcome-resolver.js",
  "career-save-admission.js",
  "npc.js",
  "coach.js",
  "rival.js",
  "story.js",
  "save.js",
  "ai-plate-appearance-outcome.js",
  "script.js"
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
    function __setup2222(position="一壘手", seed=222201) {
      stopHighSchoolMatchPlayback();
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      player=createInitialPlayer("2.2.2 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode="starter";
      player.highSchoolTeamRole="starter";
      pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      Object.assign(match,{
        inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,
        runners:[null,null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",
        momentIndex:0,currentMomentId:highSchoolYearOneMomentIds[0],currentDomain:"flow",
        playerEntryCompleted:true,playerLineupStatus:"starter",position:"內野手",
        developmentPositionOverride:position,currentFieldingPosition:"",positionDecisionFamily:"",defensiveSituation:{},
        completedMoments:[{id:highSchoolYearOneMomentIds[0],domain:"offense",decision:"zone",tier:"mixed",outcome:"測試打席",consequence:"比賽繼續",inning:4,half:"下",outs:1,scores:{home:1,away:1},runners:[null,null,null]}]
      });
      match.battingOrderIndex.away=2;
      match.currentBatter=getHighSchoolMatchLineupBatter(match,"away").id;
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      match.presentedEventCursor=match.simulationLog.length;
      return match;
    }
    function __candidate2222({position="一壘手",runners=[null,null,null],outs=0,inning=5,scores={home:1,away:1},ball="hardGrounder",direction="straightAtPlayer",depth,level=8,sample=.99,batterSpeed,runnerMovementProgress={},runnerTargets={}}={}) {
      const match=__setup2222(position);
      Object.assign(match,{runners:runners.slice(),outs,inning,scores:{...scores}});
      const event=prepareHighSchoolDefensiveMomentFromSimulation(match,{
        ballContextType:ball,
        randomSource:()=>sample,
        situationOverrides:{
          playerPosition:position,ballDirection:direction,runnerMovementProgress,runnerTargets,
          ...(depth?{ballDepth:depth}:{}),...(batterSpeed?{batterSpeed}:{}),
          playerCapabilities:{fielding:level,reaction:level,range:level,arm:level,throwing:level,decision:level}
        }
      });
      return {match,event,choices:getHighSchoolDefensiveMomentChoices(match)};
    }
    function __finish2222(seed=88221) {
      const match=__setup2222("游擊手",seed);
      match.inning=1;match.half="上";match.offenseTeam="away";match.defenseTeam="home";
      match.outs=0;match.runners=[null,null,null];match.scores={home:0,away:0};
      match.completedMoments=[];match.simulationPhase="full_match_flow";match.currentMomentId=highSchoolYearOneMomentIds[0];
      match.playerEntryCompleted=true;match.presentedEventCursor=match.simulationLog.length;
      let safety=0; const triageSteps=[];
      while(!match.completed&&safety++<1400){
        triageSteps.push({safety,inning:match.inning,half:match.half,outs:match.outs,phase:match.simulationPhase,momentIndex:match.momentIndex,currentMomentId:match.currentMomentId,currentBatter:match.currentBatter,nextBatter:getHighSchoolMatchLineupBatter(match,match.offenseTeam)?.id,completedIds:match.completedMoments.map(m=>m.id),activeSituation:match.activeSituation,visible:isHighSchoolMatchDecisionVisible(match)});
        if(isHighSchoolMatchDecisionVisible(match)){
          const choices=getHighSchoolYearOneMatchMomentChoices(match);
          const choice=choices.find(item=>item.matchDecision==="secure"||item.matchDecision==="zone")||choices[0];
          resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72);
        }else advanceHighSchoolMatchPlaybackStep(match);
      }
      globalThis.__triageMatchSteps=triageSteps; return {match,safety};
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


verify("36. full match 完成兩個既定進攻 Moment；防守 Moment 只在真實 Decision 時成立", evaluate(`(() => {const x=__finish2222();const ids=x.match.completedMoments.map(moment=>moment.id);console.log("TRIAGE_MATCH="+JSON.stringify({seed:x.match.simulationSeed,expectedIds:highSchoolYearOneMomentIds,ids,completed:x.match.completed,firstIdPresent:ids.includes(highSchoolYearOneMomentIds[0]),finalIdPresent:ids.includes(highSchoolYearOneMomentIds[2]),defenseMomentCount:x.match.completedMoments.filter(m=>m.domain==="defense").length,defensiveMeaningfulDecisionCount:x.match.matchDecisionDensityState.defensiveMeaningfulDecisionCount,safety:x.safety,safetyBelow1400:x.safety<1400,integrityIssues:getHighSchoolMatchStateIntegrityIssues(x.match),match:x.match,steps:__triageMatchSteps}));return x.match.completed&&ids.includes(highSchoolYearOneMomentIds[0])&&ids.includes(highSchoolYearOneMomentIds[2])&&x.match.completedMoments.filter(moment=>moment.domain==="defense").length===x.match.matchDecisionDensityState.defensiveMeaningfulDecisionCount&&x.safety<1400;})()`));
