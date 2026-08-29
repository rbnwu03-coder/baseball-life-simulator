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
  "baseball-offense-prototype.js", "offensive-plate-approach.js", "baseball-gameplay-integration.js",
  "baseball-training-resolver.js", "match-experience-development.js",
  "match-development-settlement-presentation.js", "career-spine-contract.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js",
  "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const context = vm.createContext({
    console, module: { exports: {} }, URLSearchParams,
    PlayingTimeGameExposure: require(path.join(root, "playing-time-game-exposure.js")),
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
      setItem(key, value) { storage.set(key, String(value)); },
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      removeItem(key) { storage.delete(key); }
    },
    window: { setTimeout() { return 1; }, clearTimeout() {}, location: { search: "" } }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    function __positionFixture(position="內野手", throws="R", seed=93001, direct=false) {
      stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
      player=createInitialPlayer("守位 Admission 測試球員");
      applyDebugBookmarkCharacterProfile(player); settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,position,[]); player.throws=throws;
      player.chapter="青棒"; player.age=16; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
      if(direct&&!player.flags.includes("direct_start_history"))player.flags.push("direct_start_history");
      pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      return {player,match,opportunity:match.gameExposureState?.opportunitySnapshot||null};
    }
    function __admissionSituation(position="內野手", throws="R", seed=93001) {
      const fixture=__positionFixture(position,throws,seed,true); const match=fixture.match;
      Object.assign(match,{inning:4,half:"上",offenseTeam:"away",defenseTeam:"home",outs:1,runners:["r1",null,null],scores:{home:1,away:1},
        currentBatter:match.rosters.away.lineup[2].id,simulationPhase:"moment_2_ready",momentIndex:1,
        currentMomentId:highSchoolYearOneMomentIds[1],currentDomain:"defense",defensiveSituation:{},positionDecisionFamily:""});
      setHighSchoolDefensiveBallContext(match,"normalGrounder");
      const situation=buildInfieldMeaningfulMoment(match,player,{ballDirection:"straightAtPlayer",routeWindowOverrides:{doublePlayWindow:"wide"}});
      const choices=situation?getHighSchoolDefensiveMomentChoices(match):[];
      const classification=situation?classifyHighSchoolMatchDefensiveOpportunity(match,situation,choices,true):null;
      return {fixture,match,situation,choices,classification};
    }
    function __admissionAudit(position="內野手", games=500) {
      const summary={games,zero:0,one:0,twoPlus:0,responsibilityOpportunities:0,legalRouteOpportunities:0,meaningfulOpportunities:0,suppressed:0,admitted:0,deadRoutes:[]};
      const routeHits={};
      const patterns=[
        {runners:[null,null,null],outs:0},
        {runners:["r1",null,null],outs:1,routeWindowOverrides:{doublePlayWindow:"wide"}},
        {runners:["r1","r2",null],outs:0,routeWindowOverrides:{leadRunnerThirdWindow:"normal",doublePlayWindow:"normal"}},
        {runners:[null,null,"r3"],outs:1,activeRunnerBase:3,runnerMovementProgress:{2:"advancing"},routeWindowOverrides:{homeOutWindow:"normal"}},
        {runners:["r1","r2","r3"],outs:1,routeWindowOverrides:{homeOutWindow:"wide",doublePlayWindow:"wide"}},
        {runners:["r1",null,null],outs:1,primaryFielderPosition:"游擊手",ballDirection:"leftSide",routeWindowOverrides:{doublePlayWindow:"normal"}}
      ];
      for(let game=0;game<games;game+=1){
        const fixture=__positionFixture(position,"R",94000+game,true); const match=fixture.match; let decisions=0;
        const eventCount=game%5===0?1:game%7===0?3:6;
        for(let event=0;event<eventCount;event+=1){
          const pattern=patterns[(game+event)%patterns.length];
          Object.assign(match,{inning:1+Math.floor(event/2),half:event%2?"下":"上",outs:pattern.outs,runners:pattern.runners.slice(),
            scores:{home:1,away:1},currentDomain:"defense",simulationPhase:"moment_2_ready",momentIndex:1,
            currentMomentId:highSchoolYearOneMomentIds[1],defensiveSituation:{},positionDecisionFamily:""});
          setHighSchoolDefensiveBallContext(match,"normalGrounder");
          const situation=buildInfieldMeaningfulMoment(match,player,{...pattern});
          if(!situation)continue;
          summary.responsibilityOpportunities+=situation.responsibility?1:0;
          const choices=getHighSchoolDefensiveMomentChoices(match);
          const viable=choices.filter(choice=>choice.legal!==false&&choice.viable!==false&&!choice.executionOnly);
          if(viable.length)summary.legalRouteOpportunities+=1;
          choices.filter(choice=>choice.legal!==false&&choice.viable!==false).forEach(choice=>{routeHits[choice.routeId]=(routeHits[choice.routeId]||0)+1;});
          const classification=classifyHighSchoolMatchDefensiveOpportunity(match,situation,choices,true);
          if(classification.density?.meaningfulCandidate)summary.meaningfulOpportunities+=1;
          const admitted=classification.eventClassification==="playerMeaningfulDecision";
          if(admitted){decisions+=1;summary.admitted+=1;}
          else if(classification.density?.meaningfulCandidate)summary.suppressed+=1;
          applyHighSchoolMatchDefensiveDecisionDensity(match,classification.density,admitted);
          match.simulationLog.push({sequence:match.simulationLog.length,type:"admission-audit-play"});
        }
        if(decisions===0)summary.zero+=1; else if(decisions===1)summary.one+=1; else summary.twoPlus+=1;
      }
      summary.deadRoutes=Object.keys(SECOND_BASE_ROUTE_DEFINITIONS).filter(id=>!routeHits[id]);
      return summary;
    }
  `, context);
  return context;
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title); passed += 1; console.log(`✓ ${title}`);
}

verify("1. explicit 二壘手的 actual game position 為二壘手", evaluate(`__positionFixture("二壘手","R",93001,true).match.playerFieldingAssignment==="二壘手"`));
verify("2. 右投 generic 內野手 deterministic 解析為二壘手", evaluate(`__positionFixture("內野手","R",93002,true).match.playerFieldingAssignment==="二壘手"`));
verify("3. generic assignment 保存正式 source / reason", evaluate(`(() => {const o=__positionFixture("內野手","R",93003,true).opportunity;return o.assignmentSource==="match-assignment"&&o.assignmentReason==="playable-2b-vertical";})()`));
verify("4. generic assignment 不改 career primaryPosition", evaluate(`__positionFixture("內野手","R",93004,true).player.primaryPosition==="內野手"`));
verify("5. 先發 roster 使用 actual 二壘 assignment", evaluate(`(() => {const m=__positionFixture("內野手","R",93005,true).match;return m.rosters.home.lineup.find(x=>x.id==="player").position==="二壘手";})()`));
verify("6. generic→二壘責任可成立且玩家為 primary fielder", evaluate(`(() => {const s=__admissionSituation().situation;return s.playerPosition==="二壘手"&&s.responsibility.playerRole==="initiator"&&s.responsibility.primaryFielder.actor==="player";})()`));
verify("7. generic→二壘能生成 formal 2B route", evaluate(`__admissionSituation().choices.some(choice=>choice.routeId==="secureFirstBaseOut")`));
verify("8. generic→二壘可通過 meaningful decision gate", evaluate(`__admissionSituation().classification.eventClassification==="playerMeaningfulDecision"`));
verify("9. non-infield control 不會進入 infield family", evaluate(`(() => {const x=__positionFixture("外野手","R",93009,true);return buildInfieldMeaningfulMoment(x.match,player)===null;})()`));
verify("10. Match presentation 讀 actual game position", evaluate(`getHighSchoolMatchPresentation(__positionFixture("內野手","R",93010,true).match).currentSituation.position==="二壘手"`));
verify("11. save/reload 保留 career、actual assignment 與 provenance", evaluate(`(() => {const x=__admissionSituation("內野手","R",93011);const role=x.situation.responsibility.playerRole;saveGame();loadGame();const m=player.highSchoolMatch;return player.primaryPosition==="內野手"&&m.playerFieldingAssignment==="二壘手"&&m.gameExposureState.opportunitySnapshot.assignmentSource==="match-assignment"&&m.gameExposureState.opportunitySnapshot.assignmentReason==="playable-2b-vertical"&&m.defensiveSituation.responsibility.playerRole===role;})()`));
verify("12. Direct Start generic infield 與正式 assignment 相容", evaluate(`__positionFixture("內野手","R",93012,true).opportunity.exposureSource==="direct-start-forced"`));
verify("13. normal narrative 也先解析同一 actual game position", evaluate(`__positionFixture("內野手","R",93013,false).opportunity.assignedPosition==="二壘手"`));
verify("14. 國小後左投 generic infield 不會被分配二壘", evaluate(`(() => {const x=__positionFixture("內野手","L",93014,true);return x.opportunity.assignedPosition==="一壘手"&&x.opportunity.assignmentReason==="left-throw-infield-1b-only";})()`));
verify("15. deterministic assignment 不消耗 Match RNG", evaluate(`__positionFixture("內野手","R",93015,true).match.simulationCursor===0`));
verify("16. presentation 讀取不改 RNG 或 cursor", evaluate(`(() => {const m=__positionFixture("內野手","R",93016,true).match;const before=m.simulationCursor+"|"+m.presentedEventCursor;getHighSchoolMatchPresentation(m);getHighSchoolYearOneMatchPresentation();return before===m.simulationCursor+"|"+m.presentedEventCursor;})()`));
verify("17. generic→二壘 explanation actor 與 actual role 一致", evaluate(`(() => {const x=__admissionSituation();const c=x.choices.find(v=>v.routeId==="secureFirstBaseOut");const r=resolveInfieldDecision(x.situation,c.matchDecision,x.match,()=>.9);return r.defensiveOutcomeExplanation.role==="initiator"&&r.defensiveOutcomeExplanation.responsibleActor!=="unknown";})()`));

const explicitAudit = parse(`__admissionAudit("二壘手",500)`);
const genericAudit = parse(`__admissionAudit("內野手",500)`);
verify("18. 500 場 audit 保留合法 zero-decision outcomes", explicitAudit.zero > 0 && genericAudit.zero > 0);
verify("19. explicit 2B 與 generic→2B admission / responsibility / route 完全 parity", JSON.stringify(explicitAudit) === JSON.stringify(genericAudit));
verify("20. 六條 2B route dead route = 0", genericAudit.deadRoutes.length === 0);
verify("21. audit 同時涵蓋 admitted 與 density-suppressed opportunities", genericAudit.admitted > 0 && genericAudit.suppressed > 0);

console.log(`Generic Infield Position Admission Diagnostic: ${passed}/${passed} PASS`);
console.log(`AUDIT ${JSON.stringify({ explicit2B: explicitAudit, genericInfieldResolved2B: genericAudit })}`);
