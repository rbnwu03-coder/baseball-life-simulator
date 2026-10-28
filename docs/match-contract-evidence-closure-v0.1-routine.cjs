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
  "baseball-offense-prototype.js", "offensive-plate-approach.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "story.js", "save.js", "ai-plate-appearance-outcome.js", "force-advancement.js", "defensive-runner-throw-settlement-foundation.js", "script.js"
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
      let safety=0;
      while(!match.completed&&safety++<1400){
        if(isHighSchoolMatchDecisionVisible(match)){
          const choices=getHighSchoolYearOneMatchMomentChoices(match);
          const choice=choices.find(item=>item.matchDecision==="secure"||item.matchDecision==="zone")||choices[0];
          resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72);
        }else advanceHighSchoolMatchPlaybackStep(match);
      }
      return {match,safety};
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


vm.runInContext(`
globalThis.closureFormatterCalls=[];
{const original=formatMatchSimulationEvent;globalThis.closureOriginalFormatterSource=original.toString();
formatMatchSimulationEvent=function(...args){const result=Reflect.apply(original,this,args),event=args[0],match=args[1];closureFormatterCalls.push({event:JSON.parse(JSON.stringify(event)),formatted:JSON.parse(JSON.stringify(result)),match:{id:match.id,simulationSeed:match.simulationSeed,inning:match.inning,half:match.half,outs:match.outs,scores:match.scores,playerLineupStatus:match.playerLineupStatus,playerEntryCompleted:match.playerEntryCompleted,position:match.position,developmentPositionOverride:match.developmentPositionOverride,completedMoments:JSON.parse(JSON.stringify(match.completedMoments))},playerAge:player.age});return result;};}
`,context);
const closureC=require('./match-contract-evidence-closure-v0.1-capture.cjs');
const closurePlan=closureC.json(closureC.prefix+'plan-evidence.json');
let closureError=null;
try{
verify("38. 玩家可見 routine commentary 不含 raw identifier", evaluate(`(() => {const x=__candidate2222();const t=formatMatchSimulationEvent(x.event,x.match).text;return !["hardGrounder","straightAtPlayer","playerRoutinePlay","selfCoverFirst","decisionTension"].some(raw=>t.includes(raw));})()`));

}catch(error){closureError=error;}
const closureFacts=JSON.parse(evaluate('JSON.stringify({calls:closureFormatterCalls,originalFormatterSource:closureOriginalFormatterSource})'));
const closureLast=closureFacts.calls.at(-1),closureTokens=closurePlan.tasks.B.rawIdentifiers;
const closureChecks=closureLast?Object.fromEntries(closureTokens.map(t=>[t,!closureLast.formatted.text.includes(t)])):null;
console.log('CLOSURE_ROUTINE_PROOF='+JSON.stringify({policy:closurePlan.tasks.B,planSha256:closureC.fileHash(closureC.prefix+'plan-evidence.json'),passedOriginalChecks:passed,checks:closureChecks,facts:closureFacts,originalFormatterSourceSha256:closureC.hash(closureFacts.originalFormatterSource),error:closureError?{name:closureError.name,message:closureError.message}:null,scope:'Exact legacy synthetic fixture and original #38 assertion only. Original artificial setup is not canonical / Moment3 admission evidence.'}));
if(closureError)throw closureError;
assert.equal(passed,1);assert(closureChecks&&Object.values(closureChecks).every(Boolean));assert.equal(closureLast.event.type,'playerRoutinePlay');
console.log('CLOSURE_ROUTINE_SUMMARY='+JSON.stringify({diagnosticOnly:true,originalAssertion:38,originalCheckExecuted:true,passedOriginalChecks:passed,eventType:closureLast.event.type,syntheticSimulationSeed:closureLast.match.simulationSeed,text:closureLast.formatted.text,checks:closureChecks,legacySyntheticPremisesPreserved:true,fullMatchExecuted:false}));
