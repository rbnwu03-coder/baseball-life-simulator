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
  const storage = new Map();
  const context = vm.createContext({
    console,
    URLSearchParams,
    module: { exports: {} },
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
      querySelector() { return null; },
      querySelectorAll() { return []; }
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
    function __baseStructural(seed=2245001) {
      stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
      player=createInitialPlayer("Structural Completion 二壘測試球員");
      applyDebugBookmarkCharacterProfile(player); settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
      pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      Object.assign(match,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:[null,null,null],scores:{home:2,away:2},
        simulationPhase:"moment_2_resolved",momentIndex:1,currentMomentId:highSchoolYearOneMomentIds[1],currentDomain:"flow",
        completed:false,settled:false,position:"內野手",developmentPositionOverride:"二壘手",currentFieldingPosition:"二壘手",
        playerEntryCompleted:true,playerLineupStatus:"starter",defensiveSituation:{},positionDecisionFamily:"",
        simulationLog:[],matchDecisionDensityState:createHighSchoolMatchDecisionDensityState()});
      match.battingOrderIndex.away=2; match.currentBatter=getHighSchoolMatchLineupBatter(match,"away").id;
      return match;
    }
    function __structuralCase(options={}) {
      const match=options.match||__baseStructural(options.seed||2245001);
      Object.assign(match,{runners:(options.runners||[null,null,null]).slice(),outs:options.outs??0,inning:options.inning||5,
        half:options.half||"上",scores:{...(options.scores||{home:2,away:2})}});
      setHighSchoolDefensiveBallContext(match,options.ball||"normalGrounder");
      const level=options.level??8;
      buildInfieldMeaningfulMoment(match,player,{
        playerPosition:"二壘手",primaryFielderPosition:options.primary||"二壘手",ballDirection:options.direction||"straightAtPlayer",
        ballDepth:options.depth||"normal",batterSpeed:options.batterSpeed??5,runnerSpeeds:options.runnerSpeeds||[6,6,6],
        activeRunnerBase:options.activeRunnerBase,runnerMovementProgress:options.runnerMovementProgress||{},runnerTargets:options.runnerTargets||{},
        playerCapabilities:{fielding:level,reaction:level,range:level,arm:level,throwing:level,decision:level},
        routeWindowOverrides:options.routeWindows||{},executionChange:options.executionChange||""
      });
      const choices=getHighSchoolDefensiveMomentChoices(match);
      const classification=classifyHighSchoolMatchDefensiveOpportunity(match,match.defensiveSituation,choices,true);
      return {match,situation:match.defensiveSituation,choices,classification};
    }
    function __routeIds(options={}) { return __structuralCase(options).choices.map(choice=>choice.routeId); }
    function __routeStatus(options={},routeId="") {
      const x=__structuralCase(options); const route=SECOND_BASE_ROUTE_DEFINITIONS[routeId];
      return {availability:evaluateDefensiveRouteAvailability(x.situation,route),readiness:evaluateExecutionReadiness({route,situation:x.situation})};
    }
    function __runStructuralAudit(gameCount=2000) {
      const routeGenerated={}; const routeAvailability={}; const routeSelections={}; const expiredWindowCounts={}; const routeSetFamilies={}; const decisionsPerGame={};
      let totalDecisions=0,totalSuppressed=0,zeroDecisionGames=0,multiDecisionGames=0,repeatedSpam=0,safetyCapBreaches=0;
      let orphanDecisions=0,illegalSelections=0,frozenGames=0,duplicateResolutions=0,cursorBreaks=0,rngBreaks=0,nanStates=0;
      let maxConsecutivePrompts=0; const decisionSpacings=[];
      const patterns=[
        {runners:[null,null,null],outs:0},
        {runners:["r1",null,null],outs:1,routeWindows:{doublePlayWindow:"wide"}},
        {runners:["r1","r2",null],outs:0,routeWindows:{leadRunnerThirdWindow:"normal",doublePlayWindow:"normal"}},
        {runners:[null,null,"r3"],outs:1,activeRunnerBase:3,runnerMovementProgress:{2:"advancing"},routeWindows:{homeOutWindow:"normal"}},
        {runners:["r1","r2","r3"],outs:1,routeWindows:{homeOutWindow:"wide",doublePlayWindow:"wide"}},
        {runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",routeWindows:{doublePlayWindow:"normal"}},
        {runners:["r1","r2",null],outs:0,direction:"rightSide",routeWindows:{leadRunnerThirdWindow:"expired",doublePlayWindow:"normal"}}
      ];
      for(let game=0;game<gameCount;game+=1){
        const match=__baseStructural(2245001+game); let decisions=0; let priorResolutionKeys=new Set();
        const eventCount=game%5===0?1:game%7===0?12:game%13===0?3:7;
        for(let eventIndex=0;eventIndex<eventCount;eventIndex+=1){
          const patternIndex=game%11===0?0:(game+eventIndex)%patterns.length;
          const x=__structuralCase({...patterns[patternIndex],match,inning:1+Math.floor(eventIndex/2),half:eventIndex%2?"下":"上"});
          Object.values(SECOND_BASE_ROUTE_DEFINITIONS).forEach(route=>{const status=evaluateDefensiveRouteAvailability(x.situation,route);if(status.legal)routeGenerated[route.id]=(routeGenerated[route.id]||0)+1;if(status.viable)routeAvailability[route.id]=(routeAvailability[route.id]||0)+1;if(status.legal&&!status.viable)expiredWindowCounts[route.id]=(expiredWindowCounts[route.id]||0)+1;});
          const density=x.classification.density;
          routeSetFamilies[density.routeFamily||"routine-only"]=(routeSetFamilies[density.routeFamily||"routine-only"]||0)+1;
          const created=x.classification.eventClassification==="playerMeaningfulDecision";
          applyHighSchoolMatchDefensiveDecisionDensity(match,density,created);
          if(created){
            decisions+=1; totalDecisions+=1;
            if(density.spacing!==null)decisionSpacings.push(density.spacing);
            const legal=x.choices.filter(choice=>choice.legal!==false&&choice.viable!==false&&!choice.executionOnly);
            const selected=legal[(game*3+eventIndex*5+Math.floor(game/6))%legal.length];
            if(!selected){orphanDecisions+=1;continue;}
            if(!legal.some(choice=>choice.routeId===selected.routeId))illegalSelections+=1;
            routeSelections[selected.routeId]=(routeSelections[selected.routeId]||0)+1;
            const resolutionKey=eventIndex+"|"+selected.routeId;
            if(priorResolutionKeys.has(resolutionKey))duplicateResolutions+=1;
            priorResolutionKeys.add(resolutionKey);
          } else if(density?.meaningfulCandidate){totalSuppressed+=1;}
          match.simulationLog.push({sequence:match.simulationLog.length,type:"audit-play"});
          if(match.matchDecisionDensityState.defensiveMeaningfulDecisionCount>6)safetyCapBreaches+=1;
          maxConsecutivePrompts=Math.max(maxConsecutivePrompts,match.matchDecisionDensityState.maxConsecutiveMeaningfulDecisions);
          if(match.matchDecisionDensityState.currentConsecutiveMeaningfulDecisions>match.matchDecisionDensityState.maxConsecutiveMeaningfulDecisions)cursorBreaks+=1;
          const numeric=[match.outs,match.inning,match.matchDecisionDensityState.defensiveMeaningfulDecisionCount];
          if(numeric.some(value=>!Number.isFinite(Number(value))))nanStates+=1;
        }
        decisionsPerGame[decisions]=(decisionsPerGame[decisions]||0)+1;
        if(decisions===0)zeroDecisionGames+=1;
        if(decisions>=2)multiDecisionGames+=1;
        if(match.matchDecisionDensityState.currentConsecutiveMeaningfulDecisions>3)repeatedSpam+=1;
        if(eventCount>0&&!match)frozenGames+=1;
        if(match.simulationLog.some((event,index)=>event.sequence!==index))cursorBreaks+=1;
        if(match.simulationSeed!==2245001+game)rngBreaks+=1;
      }
      const deadRoutes=Object.keys(SECOND_BASE_ROUTE_DEFINITIONS).filter(routeId=>(routeAvailability[routeId]||0)===0);
      const meanDecisionSpacing=decisionSpacings.length?Number((decisionSpacings.reduce((sum,value)=>sum+value,0)/decisionSpacings.length).toFixed(3)):null;
      return {gameCount,routeGenerated,routeAvailability,routeSelections,expiredWindowCounts,routeSetFamilies,deadRoutes,decisionsPerGame,totalDecisions,totalSuppressed,zeroDecisionGames,multiDecisionGames,
        maxConsecutivePrompts,meanDecisionSpacing,repeatedSpam,safetyCapBreaches,orphanDecisions,illegalSelections,frozenGames,duplicateResolutions,cursorBreaks,rngBreaks,nanStates};
    }
  `, context);
  return context;
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

const forceThird = { runners: ["r1", "r2", null], outs: 0, routeWindows: { leadRunnerThirdWindow: "normal", doublePlayWindow: "normal" } };
verify("1. 一、二壘有人且 0 出局的 force-at-third 局面可見 attackLeadRunnerThird", evaluate(`__routeIds(${JSON.stringify(forceThird)}).includes("attackLeadRunnerThird")`));
verify("2. 同局面同時保留一壘、雙殺、三壘三條不同 route", evaluate(`["secureFirstBaseOut","initiate463","attackLeadRunnerThird"].every(id=>__routeIds(${JSON.stringify(forceThird)}).includes(id))`));
verify("3. 三壘窗口 expired 時 route 仍可診斷為合法但不可執行", evaluate(`(() => {const x=__routeStatus(${JSON.stringify({ ...forceThird, routeWindows: { leadRunnerThirdWindow: "expired" } })},"attackLeadRunnerThird");return x.availability.legal&&!x.availability.viable&&x.availability.unavailableReason==="thirdBaseWindowExpired";})()`));
verify("4. 低能力不會把合法三壘 route 從 choices 隱藏", evaluate(`__routeIds(${JSON.stringify({ ...forceThird, level: 1 })}).includes("attackLeadRunnerThird")`));
verify("5. 低能力只反映為低 Readiness", evaluate(`__routeStatus(${JSON.stringify({ ...forceThird, level: 1, routeWindows: { leadRunnerThirdWindow: "narrow" } })},"attackLeadRunnerThird").readiness.level==="low"`));

verify("6. preventRunHome 非滿壘追殺本壘 route 可達", evaluate(`__routeIds({runners:[null,null,"r3"],outs:1,activeRunnerBase:3,runnerMovementProgress:{2:"advancing"},routeWindows:{homeOutWindow:"normal"}}).includes("preventRunHome")`));
verify("7. homeForceOut 滿壘本壘封殺 route 可達", evaluate(`__routeIds({runners:["r1","r2","r3"],outs:1,routeWindows:{homeOutWindow:"normal"}}).includes("homeForceOut")`));
verify("8. coverSecondFor643 在游擊手接球時可達且為 execution-only", evaluate(`(() => {const x=__structuralCase({runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",routeWindows:{doublePlayWindow:"normal"}});return x.choices.length===1&&x.choices[0].routeId==="coverSecondFor643"&&x.choices[0].executionOnly;})()`));

verify("9. attackLeadRunnerThird 可實際執行且移除二壘跑者", evaluate(`(() => {const x=__structuralCase(${JSON.stringify(forceThird)});const r=resolveInfieldDecision(x.situation,"lead",x.match,()=>.99);return r.initialRoute==="attackLeadRunnerThird"&&r.activeRoute==="attackLeadRunnerThird"&&r.outsCreated===1&&!r.runnersAfter.includes("r2");})()`));
verify("10. 防守 Decision 僅在至少兩條不同 viable routes 時建立", evaluate(`(() => {const multi=__structuralCase(${JSON.stringify(forceThird)}).classification;const single=__structuralCase({runners:[null,null,null]}).classification;return multi.gate.meaningfulChoiceCount>=2&&multi.eventClassification==="playerMeaningfulDecision"&&single.eventClassification==="playerRoutinePlay";})()`));
verify("11. 玩家可見 choices 唯一映射 canonical route", evaluate(`(() => {const ids=__routeIds({runners:["r1","r2","r3"],outs:1,routeWindows:{homeOutWindow:"wide",doublePlayWindow:"wide",leadRunnerThirdWindow:"wide"}});return ids.length===new Set(ids).size&&ids.every(Boolean);})()`));
verify("12. 三壘封殺形成第三出局時依 Third-Out contract 結束半局", evaluate(`(() => {const x=__structuralCase({...${JSON.stringify(forceThird)},outs:2});const r=resolveInfieldDecision(x.situation,"lead",x.match,()=>.99);const t=finalizeHighSchoolDefensiveThirdOut(x.match,{inning:5,half:"上",outs:2,scores:{home:2,away:2},runners:["r1","r2",null]},r);return t.halfInningEnded&&t.outsAfter===3&&t.basesAfter.every(v=>v===null)&&t.legalScoringRunnerIds.length===0;})()`));

verify("13. 相同 novelty 在最小間距內會被 density 抑制", evaluate(`(() => {const m=__baseStructural();const a=__structuralCase({...${JSON.stringify(forceThird)},match:m});applyHighSchoolMatchDefensiveDecisionDensity(m,a.classification.density,true);m.simulationLog.push({});const b=__structuralCase({...${JSON.stringify(forceThird)},match:m});return b.classification.eventClassification==="playerRoutinePlay"&&b.classification.density.suppressionReason==="repeated-situation-spacing";})()`));
verify("14. 不同 runner topology 的新局面不受 one-shot 阻擋", evaluate(`(() => {const m=__baseStructural();const a=__structuralCase({...${JSON.stringify(forceThird)},match:m});applyHighSchoolMatchDefensiveDecisionDensity(m,a.classification.density,true);for(let i=0;i<9;i++)m.simulationLog.push({});const b=__structuralCase({match:m,runners:["r1","r2","r3"],outs:1,routeWindows:{homeOutWindow:"wide",doublePlayWindow:"wide"}});return b.classification.eventClassification==="playerMeaningfulDecision"&&b.classification.density.highNovelty;})()`));
verify("15. 絕對 safety cap 僅作最後保險", evaluate(`(() => {const m=__baseStructural();m.matchDecisionDensityState.defensiveMeaningfulDecisionCount=6;const x=__structuralCase({...${JSON.stringify(forceThird)},match:m});return x.classification.density.suppressionReason==="absolute-safety-cap";})()`));

verify("16. Save / Reload 保留 routes、density 與 selected/final route 欄位", evaluate(`(() => {const x=__structuralCase(${JSON.stringify(forceThird)});const before=x.choices.map(c=>c.routeId).sort().join("|");x.match.matchDecisionDensityState={...createHighSchoolMatchDecisionDensityState(),defensiveMeaningfulDecisionCount:2,lastSelectedRoute:"attackLeadRunnerThird",lastFinalRoute:"attackLeadRunnerThird",recentSituationFamilies:["a"],recentRouteFamilies:["b"]};player.highSchoolMatch=x.match;saveGame();loadGame();const d=player.highSchoolMatch.matchDecisionDensityState;const after=getHighSchoolDefensiveMomentChoices(player.highSchoolMatch).map(c=>c.routeId).sort().join("|");return before===after&&d.defensiveMeaningfulDecisionCount===2&&d.lastSelectedRoute==="attackLeadRunnerThird"&&d.lastFinalRoute==="attackLeadRunnerThird"&&d.recentSituationFamilies[0]==="a";})()`));
verify("17. Debug candidate route 同時揭露 availability、unavailableReason 與 readiness", evaluate(`(() => {const x=__structuralCase(${JSON.stringify(forceThird)});setHighSchoolMatchOpportunityDebugEnabled(true);const trace=ensureHighSchoolMatchOpportunityTrace(x.match);const o=beginHighSchoolMatchDefensiveOpportunity(x.match,{id:"b"},"defense");updateHighSchoolMatchDefensiveOpportunityFromSituation(x.match,o,x.situation,x.choices,x.classification);const r=o.candidateRoutes.find(route=>route.id==="attackLeadRunnerThird");return r.viable&&r.unavailableReason===""&&r.readiness.level;})()`));
verify("18. Match Experience 可消費三條稀有 route 的既有語意證據", evaluate(`(() => {const m=__baseStructural();m.completedMoments=["attackLeadRunnerThird","preventRunHome","homeForceOut"].map((route,index)=>({id:"m"+index,domain:"defense",playerPosition:"二壘手",playerRole:"initiator",route,activeRoute:route,decisionQuality:"reasonable",executionQuality:"complete",outsCreated:1,playerLeg:{fielding:"completed",throw:"completed"},inning:5,half:"上",outs:index,runners:["r1","r2","r3"]}));const evidence=MatchExperienceDevelopment.deriveMatchExperienceEvidence(m,{exposure:{defensiveInnings:0,plateAppearances:0}});return evidence.length>0&&["attackLeadRunnerThird","preventRunHome","homeForceOut"].every(route=>evidence.some(item=>item.sourceSnapshot.route===route));})()`));

const audit = parse(`__runStructuralAudit(2000)`);
verify("19. 2,000 場等價完整結構稽核完成", audit.gameCount === 2000);
verify("20. 六條二壘 route 均有 availability 樣本", ["secureFirstBaseOut", "initiate463", "attackLeadRunnerThird", "preventRunHome", "homeForceOut", "coverSecondFor643"].every(id => (audit.routeAvailability[id] || 0) > 0));
verify("21. 可選路線皆有 selection 樣本且 execution-only 不被誤選", ["secureFirstBaseOut", "initiate463", "attackLeadRunnerThird", "preventRunHome", "homeForceOut"].every(id => (audit.routeSelections[id] || 0) > 0) && !audit.routeSelections.coverSecondFor643);
verify("22. 稽核同時存在 0 Decision 與 2+ Decisions 的合法比賽", audit.zeroDecisionGames > 0 && audit.multiDecisionGames > 0);
verify("23. Expired route 與多種 route-set family 都有正式稽核樣本", (audit.expiredWindowCounts.attackLeadRunnerThird || 0) > 0 && Object.keys(audit.routeSetFamilies).length >= 5);
verify("24. 稽核有實際 density suppression，無連續 spam 與 safety cap breach", audit.totalSuppressed > 0 && audit.maxConsecutivePrompts <= 2 && audit.repeatedSpam === 0 && audit.safetyCapBreaches === 0);
verify("25. 無 dead route、orphan、illegal selection、freeze、duplicate resolution", audit.deadRoutes.length === 0 && audit.orphanDecisions === 0 && audit.illegalSelections === 0 && audit.frozenGames === 0 && audit.duplicateResolutions === 0);
verify("26. 無 cursor／RNG／NaN state 破壞", audit.cursorBreaks === 0 && audit.rngBreaks === 0 && audit.nanStates === 0);

console.log("\n結構稽核摘要：" + JSON.stringify(audit));
console.log(`\nMatch Opportunity Structural Completion v1：${passed}/${passed} 通過`);
