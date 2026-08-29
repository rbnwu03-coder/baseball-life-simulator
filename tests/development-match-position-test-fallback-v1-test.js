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
  "baseball-training-resolver.js", "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const developmentButtons = ["", "一壘手", "二壘手", "游擊手", "三壘手"].map(position => ({
    dataset: { developmentPosition: position }, disabled: false, attributes: {},
    classList: { toggle() {} }, setAttribute(key, value) { this.attributes[key] = String(value); }
  }));
  const context = vm.createContext({
    console, module: { exports: {} }, URLSearchParams,
    PlayingTimeGameExposure: require(path.join(root, "playing-time-game-exposure.js")),
    document: {
      body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, {
          id, innerHTML: "", textContent: "", value: id === "throwsSelect" ? "R" : "", style: {}, dataset: {}, disabled: false,
          classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
          focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
        });
        return nodes.get(id);
      },
      querySelector() { return null; },
      querySelectorAll(selector) { return selector === "[data-development-position]" ? developmentButtons : []; }
    },
    localStorage: {
      setItem(key, value) { storage.set(key, String(value)); },
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      removeItem(key) { storage.delete(key); }
    },
    window: { setTimeout() { return 1; }, clearTimeout() {}, location: { search: "" } }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  context.__nodes = nodes;
  context.__developmentButtons = developmentButtons;
  vm.runInContext(`
    const __developmentButtons=document.querySelectorAll("[data-development-position]");
    const __defensiveKeys=["catching","throwing","armStrength","reaction","range","baseballIQ"];
    function __fallbackFixture({override=true,position="二壘手",throws="R",seed=96001,skills=null,high=false,floors=null}={}) {
      stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
      player=createRepresentativeHighSchoolEntryFixture("low",seed); player.name="Development Position Floor Fixture";
      applyCanonicalPositionProfile(player,"內野手",[]); player.throws=throws; player.age=16;
      player.chapter="青棒";player.highSchoolStep=5;player.highSchoolRoleCode="starter";player.highSchoolTeamRole="starter";
      if(!player.flags.includes("direct_start_history"))player.flags.push("direct_start_history");
      const values=skills||Object.fromEntries(__defensiveKeys.map(key=>[key,high?12:1]));
      Object.assign(player.baseballSkills,values); const raw=JSON.stringify(player.baseballSkills);
      pendingHighSchoolMatchPositionOverride=override?position:"";pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      if(floors&&match.developmentTestCapabilityOverride){
        match.developmentTestCapabilityOverride={...match.developmentTestCapabilityOverride,
          benchmarkVersion:"development-playable-position-calibration-sweep-v1",
          skillFloors:{...match.developmentTestCapabilityOverride.skillFloors,...floors}};
      }
      return {match,raw,audit:getDevelopmentMatchPositionTestCapabilityAudit(player,match),capability:getDefensiveSimulationCapability(player,"內野手",match)};
    }
    function __fallbackSituation(options={}) {
      const fixture=__fallbackFixture(options); const match=fixture.match;
      Object.assign(match,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:options.outs??1,
        runners:(options.runners||["r1",null,null]).slice(),scores:{home:2,away:2},simulationPhase:"moment_2_ready",momentIndex:1,
        currentMomentId:highSchoolYearOneMomentIds[1],currentDomain:"defense",defensiveSituation:{},positionDecisionFamily:""});
      match.battingOrderIndex.away=2;match.currentBatter=getHighSchoolMatchLineupBatter(match,"away").id;
      setHighSchoolDefensiveBallContext(match,"normalGrounder");
      const situation=buildInfieldMeaningfulMoment(match,player,{playerPosition:"二壘手",ballDirection:"straightAtPlayer",
        routeWindowOverrides:{firstBaseOutWindow:"normal",doublePlayWindow:"normal",leadRunnerThirdWindow:"normal",homeOutWindow:"normal"}});
      return {fixture,match,situation,choices:getHighSchoolDefensiveMomentChoices(match)};
    }
    function __fallbackDisplay(options={}) {
      const fixture=__fallbackFixture(options);
      player.chapter2Result||="已完成少棒入門";
      updateStatus();
      const display=getDevelopmentTestEffectiveCapabilityDisplay(player,fixture.match);
      return {fixture,display,html:document.getElementById("status").innerHTML};
    }
    function __fallbackAudit(override=false,games=500,floors=null) {
      const result={games,zero:0,one:0,twoPlus:0,meaningful:0,viableOpportunities:0,expiredWindows:0,
        readiness:{high:0,medium:0,low:0},execution:{success:0,failure:0,partial:0},causes:{},actors:{},reassessment:0,routeCounts:{},availabilitySignatures:[],decisionQualitySignatures:[],
        stages:{control:0,transfer:0,throw:0,playerBasic:0,teammateLegReached:0,timingReached:0,deepChain:0,explanationAfterBasic:0},
        skillMutation:0,availabilityMismatch:0,rngDrift:0,cursorDrift:0,nan:0,freeze:0};
      const patterns=[
        {runners:[null,null,null],outs:0},
        {runners:["r1",null,null],outs:1},
        {runners:["r1","r2",null],outs:0},
        {runners:[null,null,"r3"],outs:1,activeRunnerBase:3,runnerMovementProgress:{2:"advancing"}},
        {runners:["r1","r2","r3"],outs:1},
        {runners:["r1",null,null],outs:1,primaryFielderPosition:"游擊手",ballDirection:"leftSide"}
      ];
      for(let game=0;game<games;game+=1){
        let decisions=0; const fixture=__fallbackFixture({override,seed:97000+game,floors}); const match=fixture.match;
        const raw=fixture.raw; const rng=match.simulationCursor; const cursor=match.presentedEventCursor;
        const eventCount=game%5===0?1:game%7===0?3:6;
        try {
          for(let event=0;event<eventCount;event+=1){
            const pattern=patterns[(game+event)%patterns.length];
            Object.assign(match,{inning:1+Math.floor(event/2),half:event%2?"下":"上",outs:pattern.outs,runners:pattern.runners.slice(),
              scores:{home:1,away:1},currentDomain:"defense",simulationPhase:"moment_2_ready",momentIndex:1,
              currentMomentId:highSchoolYearOneMomentIds[1],defensiveSituation:{},positionDecisionFamily:""});
            setHighSchoolDefensiveBallContext(match,"normalGrounder");
            const situation=buildInfieldMeaningfulMoment(match,player,{...pattern,playerPosition:"二壘手",
              routeWindowOverrides:{firstBaseOutWindow:"normal",doublePlayWindow:"normal",leadRunnerThirdWindow:"normal",homeOutWindow:"normal"}});
            const choices=getHighSchoolDefensiveMomentChoices(match);
            const viable=choices.filter(choice=>choice.legal!==false&&choice.viable!==false&&!choice.executionOnly);
            if(viable.length)result.viableOpportunities+=1;
            choices.forEach(choice=>{if(choice.viable===false)result.expiredWindows+=1;});
            const classification=classifyHighSchoolMatchDefensiveOpportunity(match,situation,choices,true);
            const admitted=classification.eventClassification==="playerMeaningfulDecision";
            if(admitted){
              decisions+=1;result.meaningful+=1;
              const choice=viable[(game+event)%viable.length];
              if(choice){
                result.routeCounts[choice.routeId]=(result.routeCounts[choice.routeId]||0)+1;
                result.readiness[choice.readiness?.level||"low"]+=1;
                const resolution=resolveInfieldDecision(situation,choice.matchDecision,match,()=>[.05,.25,.55,.85][(game+event)%4]);
                if(resolution?.outsCreated>0)result.execution.success+=1;else result.execution.failure+=1;
                if(resolution?.executionQuality==="partial")result.execution.partial+=1;
                const playerLeg=resolution?.playerLeg||{};
                const controlCompleted=["completed","recovered"].includes(playerLeg.control);
                const transferCompleted=playerLeg.transfer==="completed";
                const throwCompleted=playerLeg.firstThrow==="completed";
                const playerBasicCompleted=controlCompleted&&transferCompleted&&throwCompleted;
                if(controlCompleted)result.stages.control+=1;
                if(transferCompleted)result.stages.transfer+=1;
                if(throwCompleted)result.stages.throw+=1;
                if(playerBasicCompleted)result.stages.playerBasic+=1;
                const teammateLegReached=playerBasicCompleted&&Object.keys(resolution?.teammateLeg||{}).length>0;
                const timingReached=playerBasicCompleted&&Object.keys(resolution?.timingResolution||{}).length>0;
                if(teammateLegReached)result.stages.teammateLegReached+=1;
                if(timingReached)result.stages.timingReached+=1;
                if(playerBasicCompleted&&(teammateLegReached||timingReached))result.stages.deepChain+=1;
                if(playerBasicCompleted&&resolution?.defensiveOutcomeExplanation)result.stages.explanationAfterBasic+=1;
                const cause=resolution?.defensiveOutcomeExplanation?.primaryCause||resolution?.primaryCause||"unknown";
                result.causes[cause]=(result.causes[cause]||0)+1;
                const actor=resolution?.defensiveOutcomeExplanation?.responsibleActor||resolution?.responsibleActor||"unknown";
                result.actors[actor]=(result.actors[actor]||0)+1;
                if(resolution?.reassessed)result.reassessment+=1;
                result.decisionQualitySignatures.push(choice.advisable||"");
              }
            }
            applyHighSchoolMatchDefensiveDecisionDensity(match,classification.density,admitted);
            result.availabilitySignatures.push(choices.map(choice=>[choice.routeId,choice.legal!==false,choice.viable!==false]).sort());
            match.simulationLog.push({sequence:match.simulationLog.length,type:"fallback-audit"});
          }
        } catch(error){result.freeze+=1;}
        if(decisions===0)result.zero+=1;else if(decisions===1)result.one+=1;else result.twoPlus+=1;
        if(raw!==JSON.stringify(player.baseballSkills))result.skillMutation+=1;
        if(match.simulationCursor!==rng)result.rngDrift+=1;
        if(match.presentedEventCursor!==cursor)result.cursorDrift+=1;
        if([decisions,match.outs,match.inning].some(value=>!Number.isFinite(Number(value))))result.nan+=1;
      }
      return result;
    }
  `, context);
  return context;
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) { assert.ok(condition, title); passed += 1; console.log(`✓ ${title}`); }

verify("1. fallback 與 benchmark 使用正式 development-only version", evaluate(`DEVELOPMENT_MATCH_POSITION_TEST_FALLBACK_VERSION==="development-match-position-test-fallback-v1"&&DEVELOPMENT_MATCH_POSITION_TEST_BENCHMARK_VERSION==="development-playable-position-v2"`));
verify("2. benchmark 以 1,000 場 effective behavior calibration 為主要來源", evaluate(`developmentMatchPositionTestBenchmark.source==="effective-match-behavior-calibration"&&developmentMatchPositionTestBenchmark.fixtureSource==="createRepresentativeHighSchoolEntryFixture"&&developmentMatchPositionTestBenchmark.sampleSize===1000`));
verify("3. chosen floors 採 minimum sufficient Candidate E 與 65–75% Player Basic 目標", evaluate(`developmentMatchPositionTestBenchmark.floorRule==="minimum-sufficient-deep-chain-reachability"&&JSON.stringify(developmentMatchPositionTestBenchmark.targetPlayerBasicExecutionBand)===JSON.stringify([.65,.75])&&JSON.stringify(developmentMatchPositionTestBenchmark.floors)===JSON.stringify({catching:9,throwing:9,armStrength:9,reaction:8,range:8,baseballIQ:9})`));
verify("4. 低能力指定 2B 建立 match-local override", evaluate(`(() => {const x=__fallbackFixture();return x.match.developmentTestCapabilityOverride.active&&x.match.developmentTestCapabilityOverride.position==="二壘手";})()`));
verify("5. 低 raw skill 的 effective 值逐項達 floor", evaluate(`(() => {const a=__fallbackFixture().audit;return Object.values(a.skills).every(v=>v.raw===1&&v.effective===v.floor);})()`));
verify("6. capability resolver 讀取 effective floor", evaluate(`(() => {const low=__fallbackFixture({override:false}).capability,floor=__fallbackFixture({override:true}).capability;return floor.fielding>low.fielding&&floor.reaction>low.reaction&&floor.decision>low.decision;})()`));
verify("7. player.baseballSkills 完全不被 override mutation", evaluate(`(() => {const x=__fallbackFixture();return x.raw===JSON.stringify(player.baseballSkills);})()`));
verify("8. 高 raw skill 不被 floor 降低", evaluate(`(() => {const a=__fallbackFixture({high:true}).audit;return Object.values(a.skills).every(v=>v.raw===12&&v.effective===12);})()`));
verify("9. mixed skills 使用 max(raw,floor)", evaluate(`(() => {const a=__fallbackFixture({skills:{catching:3,throwing:10,armStrength:2,reaction:4,range:9,baseballIQ:1}}).audit.skills;return a.catching.effective===9&&a.throwing.effective===10&&a.reaction.effective===8&&a.range.effective===9&&a.baseballIQ.effective===9;})()`));
verify("10. 2B 不補 batting/baseRunning 等無關能力", evaluate(`(() => {const x=__fallbackFixture();return !Object.hasOwn(x.audit.skills,"batting")&&!Object.hasOwn(x.audit.skills,"baseRunning")&&!Object.hasOwn(x.audit.skills,"armStrength");})()`));
verify("11. 1B/2B 沿用 generic infield 正式 skill requirements", evaluate(`JSON.stringify(developmentMatchPositionTestSkillMap["一壘手"])===JSON.stringify(positionConfigs["內野手"].skills)&&JSON.stringify(developmentMatchPositionTestSkillMap["二壘手"])===JSON.stringify(positionConfigs["內野手"].skills)`));
verify("12. SS 額外 floor armStrength", evaluate(`developmentMatchPositionTestSkillMap["游擊手"].includes("armStrength")`));
verify("13. 3B 使用 catching/throwing/arm/reaction/IQ 且不補 range", evaluate(`(() => {const s=developmentMatchPositionTestSkillMap["三壘手"];return ["catching","throwing","armStrength","reaction","baseballIQ"].every(k=>s.includes(k))&&!s.includes("range");})()`));
verify("14. 右投可指定 1B/2B/SS/3B", evaluate(`["一壘手","二壘手","游擊手","三壘手"].every(p=>isDevelopmentTestPositionLegalForThrowingHand(p,"R",16))`));
verify("15. 左投只允許 1B", evaluate(`isDevelopmentTestPositionLegalForThrowingHand("一壘手","L",16)&&["二壘手","游擊手","三壘手"].every(p=>!isDevelopmentTestPositionLegalForThrowingHand(p,"L",16))`));
verify("16. 左投非法 pending position 在 Match admission 明確拒絕", evaluate(`(() => {let rejected=false;try{__fallbackFixture({position:"游擊手",throws:"L"});}catch(error){rejected=error.message.includes("左投");}return rejected;})()`));
verify("17. UI 左投會 disable 2B/SS/3B 並保留 1B", evaluate(`(() => {document.getElementById("throwsSelect").value="L";updateDevelopmentTestPositionLegality();return !__developmentButtons[1].disabled&&__developmentButtons.slice(2).every(button=>button.disabled);})()`));
verify("18. UI 非法選擇回傳 false 並顯示拒絕原因", evaluate(`selectDevelopmentTestPosition("游擊手")===false&&document.getElementById("developmentPositionDescription").textContent.includes("左投")`));
evaluate(`document.getElementById("throwsSelect").value="R";updateDevelopmentTestPositionLegality()`);
verify("19. explicit 3B 優先於 generic infield fallback", evaluate(`(() => {const x=__fallbackFixture({position:"三壘手"});return player.primaryPosition==="內野手"&&x.match.playerFieldingAssignment==="三壘手"&&x.match.developmentTestCapabilityOverride.position==="三壘手";})()`));
verify("20. 不指定仍走 generic→2B 且 floor inactive", evaluate(`(() => {const x=__fallbackFixture({override:false});return x.match.playerFieldingAssignment==="二壘手"&&!x.match.developmentTestCapabilityOverride&&!x.audit.active;})()`));
verify("21. normal narrative 無 override 時 effective 等於 raw", evaluate(`(() => {const x=__fallbackFixture({override:false});return x.capability.fielding===getDefensiveSimulationCapability(player,"內野手",null).fielding;})()`));
verify("22. save/reload 保存 position、version、benchmark 與 floors", evaluate(`(() => {const x=__fallbackSituation();const before=JSON.stringify(x.match.developmentTestCapabilityOverride);saveGame();loadGame();return player.highSchoolMatch.playerFieldingAssignment==="二壘手"&&before===JSON.stringify(player.highSchoolMatch.developmentTestCapabilityOverride);})()`));
verify("23. reload 後 raw/effective audit 不漂移", evaluate(`(() => {const before=getDevelopmentMatchPositionTestCapabilityAudit(player,player.highSchoolMatch);const raw=JSON.stringify(player.baseballSkills);saveGame();loadGame();return raw===JSON.stringify(player.baseballSkills)&&JSON.stringify(before)===JSON.stringify(getDevelopmentMatchPositionTestCapabilityAudit(player,player.highSchoolMatch));})()`));
verify("24. presentation/debug audit 不消耗 RNG 或 cursor", evaluate(`(() => {const x=__fallbackFixture();const before=x.match.simulationCursor+"|"+x.match.presentedEventCursor;getDevelopmentMatchPositionTestCapabilityAudit(player,x.match);getHighSchoolMatchPresentation(x.match);return before===x.match.simulationCursor+"|"+x.match.presentedEventCursor;})()`));
verify("25. floor 不改 route availability 或 decision quality", evaluate(`(() => {const raw=__fallbackSituation({override:false}),floor=__fallbackSituation({override:true});const sig=x=>x.choices.map(c=>[c.routeId,c.legal!==false,c.viable!==false,c.advisable]).sort();return JSON.stringify(sig(raw))===JSON.stringify(sig(floor));})()`));
verify("26. floor 改善 execution capability 但 route admission 仍成立", evaluate(`(() => {const raw=__fallbackSituation({override:false}),floor=__fallbackSituation({override:true});const total=x=>["fielding","reaction","range","arm","throwing","decision"].reduce((sum,key)=>sum+x.situation.playerCapabilities[key],0);return total(floor)>total(raw)&&floor.choices.some(c=>c.routeId==="secureFirstBaseOut");})()`));
verify("27. reasonable decision + execution failure 在 floor 下仍可發生", evaluate(`(() => {const x=__fallbackSituation({override:true});const c=x.choices.find(c=>c.routeId==="secureFirstBaseOut");const r=resolveInfieldDecision(x.situation,c.matchDecision,x.match,()=>0);return c.advisable==="reasonable"&&r.outsCreated===0&&r.defensiveOutcomeExplanation;})()`));
verify("28. 右投四個 explicit position 都成為 actual assignment", evaluate(`["一壘手","二壘手","游擊手","三壘手"].every(position=>__fallbackFixture({position}).match.playerFieldingAssignment===position)`));
verify("29. Playing-Time snapshot 在 match floor 建立前只讀 raw capability", evaluate(`(() => {const x=__fallbackFixture();const canonical=JSON.parse(JSON.stringify(player));canonical.highSchoolMatch=null;const raw=getDefensiveSimulationCapability(canonical,"二壘手",null);const readiness=x.match.gameExposureState.opportunitySnapshot.readinessSnapshot;return readiness.fieldingReadiness===raw.fielding&&readiness.reactionReadiness===raw.reaction&&readiness.decisionReadiness===raw.decision;})()`));
verify("30. Match completed 後 resolver 停用 floor 且 Player Truth 不變", evaluate(`(() => {const x=__fallbackFixture();const before=x.capability;const raw=x.raw;x.match.completed=true;const after=getDefensiveSimulationCapability(player,"內野手",x.match);return before.fielding>after.fielding&&raw===JSON.stringify(player.baseballSkills);})()`));
verify("31. Development / Evaluation production modules 不讀 test override", ["match-experience-development.js","baseball-training-resolver.js","coach-evaluation-boundary.js","evaluation-registry.js"].every(file=>!fs.readFileSync(path.join(root,file),"utf8").includes("developmentTestCapabilityOverride")));

const rawAudit = parse(`__fallbackAudit(false,2000)`);
const floorAudit = parse(`__fallbackAudit(true,2000)`);
verify("32. 2,000+2,000 場 final structural audit 無 mutation/RNG/cursor/NaN/freeze", [rawAudit,floorAudit].every(a=>a.skillMutation===0&&a.rngDrift===0&&a.cursorDrift===0&&a.nan===0&&a.freeze===0));
verify("33. floor readiness 與 execution outcome 明顯改善", floorAudit.readiness.medium+floorAudit.readiness.high>rawAudit.readiness.medium+rawAudit.readiness.high&&floorAudit.execution.success>rawAudit.execution.success);
verify("34. floor 不改 meaningful/viable/0-1-2+ decision distribution", ["meaningful","viableOpportunities","zero","one","twoPlus"].every(key=>rawAudit[key]===floorAudit[key]));
verify("35. floor availability 與 decision quality signatures 完全一致", JSON.stringify(rawAudit.availabilitySignatures)===JSON.stringify(floorAudit.availabilitySignatures)&&JSON.stringify(rawAudit.decisionQualitySignatures)===JSON.stringify(floorAudit.decisionQualitySignatures));
verify("36. floor execution 有成功也有失敗，不是 god mode", floorAudit.execution.success>0&&floorAudit.execution.failure>0&&floorAudit.execution.success<floorAudit.execution.success+floorAudit.execution.failure);

const compactAudit = audit => ({
  games: audit.games, zero: audit.zero, one: audit.one, twoPlus: audit.twoPlus,
  meaningful: audit.meaningful, viableOpportunities: audit.viableOpportunities,
  expiredWindows: audit.expiredWindows, readiness: audit.readiness,
  execution: audit.execution, causes: audit.causes, actors: audit.actors,
  reassessment: audit.reassessment, stages: audit.stages, routeCounts: audit.routeCounts,
  skillMutation: audit.skillMutation, availabilityMismatch: audit.availabilityMismatch,
  rngDrift: audit.rngDrift, cursorDrift: audit.cursorDrift, nan: audit.nan, freeze: audit.freeze
});
const calibrationSweep = {
  current: parse(`__fallbackAudit(true,1000,{catching:7,throwing:7,reaction:6,range:6,baseballIQ:7})`),
  candidateD: parse(`__fallbackAudit(true,1000,{catching:8,throwing:8,reaction:7,range:7,baseballIQ:8})`),
  candidateE: parse(`__fallbackAudit(true,1000,{catching:9,throwing:9,reaction:8,range:8,baseballIQ:9})`),
  candidateF: parse(`__fallbackAudit(true,1000,{catching:10,throwing:10,reaction:9,range:9,baseballIQ:10})`),
  candidateG: parse(`__fallbackAudit(true,1000,{catching:11,throwing:11,reaction:10,range:10,baseballIQ:11})`)
};
const successRate = audit => audit.execution.success / (audit.execution.success + audit.execution.failure);
const basicRate = audit => audit.stages.playerBasic / audit.meaningful;
verify("37. v2 Sweep 五組 route availability 與 decision distribution 完全一致", Object.values(calibrationSweep).every(a=>a.meaningful===calibrationSweep.current.meaningful&&a.viableOpportunities===calibrationSweep.current.viableOpportunities&&a.zero===calibrationSweep.current.zero&&a.one===calibrationSweep.current.one&&a.twoPlus===calibrationSweep.current.twoPlus&&JSON.stringify(a.availabilitySignatures)===JSON.stringify(calibrationSweep.current.availabilitySignatures)&&JSON.stringify(a.decisionQualitySignatures)===JSON.stringify(calibrationSweep.current.decisionQualitySignatures)));
verify("38. v2 Sweep stage counters 全部來自 canonical resolution 且單調可達", Object.values(calibrationSweep).every(a=>a.stages.control>=a.stages.transfer&&a.stages.transfer>=a.stages.throw&&a.stages.throw===a.stages.playerBasic&&a.stages.deepChain===a.stages.playerBasic));
verify("39. Current 與 D 未達 Player Basic 65% 下限", basicRate(calibrationSweep.current)<.65&&basicRate(calibrationSweep.candidateD)<.65);
verify("40. Candidate E 是第一組進入 65–75% 目標帶的最低候選", basicRate(calibrationSweep.candidateE)>=.65&&basicRate(calibrationSweep.candidateE)<=.75);
verify("41. F/G 超過目標帶且 E 保留 failure diversity", basicRate(calibrationSweep.candidateF)>.75&&basicRate(calibrationSweep.candidateG)>.75&&calibrationSweep.candidateE.execution.failure>0&&calibrationSweep.candidateE.readiness.medium>0);
verify("42. production floors 正好採 Candidate E", evaluate(`JSON.stringify(developmentMatchPositionTestBenchmark.floors)===JSON.stringify({catching:9,throwing:9,armStrength:9,reaction:8,range:8,baseballIQ:9})`));
verify("43. final 2,000 場 Player Basic 落在 65–75% 且能進入 deep chain", basicRate(floorAudit)>=.65&&basicRate(floorAudit)<=.75&&floorAudit.stages.deepChain>rawAudit.stages.deepChain);
verify("44. audit skill 提供 raw/floor/effective/override/source/version 完整欄位", evaluate(`(() => {const a=__fallbackFixture().audit;return Object.values(a.skills).every(v=>Object.hasOwn(v,"raw")&&Object.hasOwn(v,"floor")&&Object.hasOwn(v,"effective")&&v.overrideApplied===true&&v.source==="development-position-test"&&v.benchmarkVersion==="development-playable-position-v2");})()`));
verify("45. 低 raw active UI 顯示有效值、原始值、開發測試標記與說明", evaluate(`(() => {const x=__fallbackDisplay({skills:{catching:4,throwing:4,armStrength:3,reaction:3,range:4,baseballIQ:4}});return x.display.active&&x.html.includes("開發測試能力覆蓋中")&&x.html.includes('data-development-effective-skill="catching"')&&x.html.includes('data-effective-value="9"')&&x.html.includes('data-raw-value="4"')&&x.html.includes("原始 4");})()`));
verify("46. mixed UI 只標記實際提高的能力", evaluate(`(() => {const x=__fallbackDisplay({skills:{catching:12,throwing:4,armStrength:12,reaction:12,range:2,baseballIQ:11}});return x.display.skills.catching.overrideApplied===false&&x.display.skills.throwing.overrideApplied===true&&x.display.skills.range.overrideApplied===true&&!x.html.includes('data-development-effective-skill="catching"')&&x.html.includes('data-development-effective-skill="throwing"')&&x.html.includes('data-development-effective-skill="range"');})()`));
verify("47. 無 override 不顯示開發測試 UI 且維持 raw", evaluate(`(() => {const x=__fallbackDisplay({override:false,skills:{catching:4}});return !x.display.active&&!x.html.includes("開發測試能力覆蓋中")&&!x.html.includes("data-development-effective-skill")&&x.html.includes(">4</strong>");})()`));
verify("48. Match completed 後 UI 回到 raw 顯示", evaluate(`(() => {const x=__fallbackFixture({skills:{catching:4,throwing:4,reaction:3,range:4,baseballIQ:4}});x.match.completed=true;player.chapter2Result||="已完成少棒入門";updateStatus();const html=document.getElementById("status").innerHTML;return !getDevelopmentTestEffectiveCapabilityDisplay(player,x.match).active&&!html.includes("開發測試能力覆蓋中")&&!html.includes("data-development-effective-skill");})()`));
verify("49. effective display 與權威 audit 零 mismatch", evaluate(`(() => {const x=__fallbackFixture({skills:{catching:4,throwing:10,reaction:3,range:9,baseballIQ:4}});const d=getDevelopmentTestEffectiveCapabilityDisplay(player,x.match);return d.benchmarkVersion===x.audit.benchmarkVersion&&Object.keys(x.audit.skills).every(k=>JSON.stringify(d.skills[k])===JSON.stringify(x.audit.skills[k]));})()`));
verify("50. save/reload 後 effective display 穩定且不消耗 RNG/cursor", evaluate(`(() => {const x=__fallbackFixture({skills:{catching:4,throwing:10,reaction:3,range:9,baseballIQ:4}});const before=JSON.stringify(getDevelopmentTestEffectiveCapabilityDisplay(player,x.match));const cursors=x.match.simulationCursor+"|"+x.match.presentedEventCursor;saveGame();loadGame();const after=JSON.stringify(getDevelopmentTestEffectiveCapabilityDisplay(player,player.highSchoolMatch));return before===after&&cursors===player.highSchoolMatch.simulationCursor+"|"+player.highSchoolMatch.presentedEventCursor;})()`));
console.log(`Development Match Position Test Fallback v1：${passed}/${passed} PASS`);
console.log(`BENCHMARK ${JSON.stringify(parse("developmentMatchPositionTestBenchmark"))}`);
console.log(`CALIBRATION_SWEEP ${JSON.stringify(Object.fromEntries(Object.entries(calibrationSweep).map(([key,audit])=>[key,compactAudit(audit)])))}`);
console.log(`STRUCTURAL_AUDIT ${JSON.stringify({rawLow:compactAudit(rawAudit),testFloor:compactAudit(floorAudit)})}`);
