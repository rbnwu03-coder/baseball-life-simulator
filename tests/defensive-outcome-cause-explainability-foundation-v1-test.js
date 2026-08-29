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
  "baseball-training-resolver.js", "playing-time-game-exposure.js", "match-experience-development.js",
  "match-development-settlement-presentation.js", "career-spine-contract.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js",
  "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
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
    function __defBase(seed=91001) {
      stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
      player=createInitialPlayer("防守因果測試球員");
      applyDebugBookmarkCharacterProfile(player); settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
      pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      Object.assign(match,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:[null,null,null],scores:{home:2,away:2},
        simulationPhase:"moment_2_ready",momentIndex:1,currentMomentId:highSchoolYearOneMomentIds[1],currentDomain:"defense",
        completed:false,settled:false,position:"內野手",developmentPositionOverride:"二壘手",currentFieldingPosition:"二壘手",
        playerEntryCompleted:true,playerLineupStatus:"starter",defensiveSituation:{},positionDecisionFamily:""});
      match.battingOrderIndex.away=2; match.currentBatter=getHighSchoolMatchLineupBatter(match,"away").id;
      return match;
    }
    function __defCase(options={}) {
      const match=__defBase(options.seed||91001);
      Object.assign(match,{runners:(options.runners||[null,null,null]).slice(),outs:options.outs??0,inning:options.inning||5,scores:{...(options.scores||{home:2,away:2})}});
      setHighSchoolDefensiveBallContext(match,options.ball||"normalGrounder");
      const level=options.level??8;
      buildInfieldMeaningfulMoment(match,player,{
        playerPosition:"二壘手",primaryFielderPosition:options.primary||"二壘手",ballDirection:options.direction||"straightAtPlayer",
        ...(options.depth?{ballDepth:options.depth}:{}),batterSpeed:options.batterSpeed??5,
        runnerSpeeds:options.runnerSpeeds||[6,6,6],activeRunnerBase:options.activeRunnerBase,
        runnerMovementProgress:options.runnerMovementProgress||{},runnerTargets:options.runnerTargets||{},
        playerCapabilities:{fielding:level,reaction:level,range:level,arm:level,throwing:options.throwing??level,decision:level},
        routeWindowOverrides:options.routeWindows||{},executionChange:options.executionChange||"",
        upstreamThrowQuality:options.upstreamThrowQuality||"",coverageQuality:options.coverageQuality||""
      });
      if(Number.isFinite(options.shortstopPivotLevel)) {
        match.defensiveSituation.teammates.shortstop.capabilities.reaction=options.shortstopPivotLevel;
        match.defensiveSituation.teammates.shortstop.capabilities.throwing=options.shortstopPivotLevel;
      }
      return {match,situation:match.defensiveSituation,choices:getHighSchoolDefensiveMomentChoices(match)};
    }
    function __resolveDef(options, sample=.9) {
      const x=__defCase(options); const choice=x.choices.find(c=>c.routeId===options.routeId);
      if(!choice) return {x,choice:null,resolution:null,explanation:null};
      const resolution=resolveInfieldDecision(x.situation,choice.matchDecision,x.match,()=>sample);
      return {x,choice,resolution,explanation:resolution?.defensiveOutcomeExplanation||null};
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

const secure = `{routeId:"secureFirstBaseOut",routeWindows:{firstBaseOutWindow:"wide"}}`;
const dp = `{routeId:"initiate463",runners:["r1",null,null],outs:1,ball:"deepGrounder",depth:"deep",level:10,routeWindows:{doublePlayWindow:"wide"},batterSpeed:4}`;
const cover = `{routeId:"coverSecondFor643",runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",coverageQuality:"good",upstreamThrowQuality:"clean",routeWindows:{doublePlayWindow:"wide"},batterSpeed:4}`;
const third = `{routeId:"attackLeadRunnerThird",runners:[null,"r2",null],activeRunnerBase:2,runnerMovementProgress:{1:"advancing"},routeWindows:{leadRunnerThirdWindow:"wide"}}`;
const tagHome = `{routeId:"preventRunHome",runners:[null,null,"r3"],outs:1,activeRunnerBase:3,runnerMovementProgress:{2:"advancing"},routeWindows:{homeOutWindow:"wide"}}`;
const forceHome = `{routeId:"homeForceOut",runners:["r1","r2","r3"],outs:1,routeWindows:{homeOutWindow:"wide"}}`;

verify("1. explainability 使用正式版本", evaluate(`__resolveDef(${secure}).explanation.version===DEFENSIVE_EXPLAINABILITY_VERSION`));
verify("2. 一壘穩定出局有判斷、執行、結果、原因四層", evaluate(`(() => {const e=__resolveDef(${secure}).explanation;return e.judgment&&e.executionSummary&&e.outcome&&e.causeText;})()`));
verify("3. 一壘成功保留 secureFirstBaseOut route", evaluate(`__resolveDef(${secure}).explanation.routeId==="secureFirstBaseOut"`));
verify("4. 低 readiness 不改寫一壘 route 的 decision quality", evaluate(`(() => {const a=__resolveDef({routeId:"secureFirstBaseOut",level:2,throwing:1,ball:"deepGrounder",depth:"deep",direction:"rightSide",routeWindows:{firstBaseOutWindow:"narrow"}},.1);return a.explanation.readiness.level==="low"&&a.explanation.decisionQuality==="reasonable";})()`));
verify("5. 合理判斷但第一傳失敗時主因為傳球準確度", evaluate(`(() => {const a=__resolveDef({routeId:"secureFirstBaseOut",level:8,throwing:1,ball:"deepGrounder",depth:"deep",routeWindows:{firstBaseOutWindow:"wide"}},0);return a.resolution.outsCreated===0&&a.explanation.primaryCause==="throwAccuracy"&&a.explanation.responsibleActor==="player";})()`));
verify("6. 4-6-3 完整雙殺能說清第一段與隊友鏈", evaluate(`(() => {const a=__resolveDef(${dp},.99);return a.resolution.outsCreated===2&&a.explanation.executionSummary.includes("隊友");})()`));
verify("7. 4-6-3 積極判斷不因成功改成穩健", evaluate(`__resolveDef(${dp},.99).explanation.decisionQuality==="aggressive"`));
verify("8. 4-6-3 第二腿 timing loss 歸 systemTiming", evaluate(`(() => {const a=__resolveDef({routeId:"initiate463",runners:["r1",null,null],outs:1,level:9,batterSpeed:9,routeWindows:{doublePlayWindow:"normal"}},.5);a.x.situation.teammates.shortstop.capabilities.reaction=2;a.x.situation.teammates.shortstop.capabilities.throwing=2;const r=resolveInfieldDecision(a.x.situation,"challenge",a.x.match,()=>.5);return r.outsCreated===1&&r.defensiveOutcomeExplanation.primaryCause==="runnerTiming"&&r.defensiveOutcomeExplanation.responsibleActor==="systemTiming";})()`));
verify("9. timing-only feedback 不指控壞傳球", evaluate(`(() => {const a=__resolveDef({routeId:"initiate463",runners:["r1",null,null],outs:1,level:9,batterSpeed:9,routeWindows:{doublePlayWindow:"normal"}},.5);a.x.situation.teammates.shortstop.capabilities.reaction=2;a.x.situation.teammates.shortstop.capabilities.throwing=2;const e=resolveInfieldDecision(a.x.situation,"challenge",a.x.match,()=>.5).defensiveOutcomeExplanation;return !/傳球偏|壞傳球/.test(e.coachFeedback);})()`));
verify("10. 4-6-3 隊友接球失敗不怪玩家", evaluate(`(() => {const a=__resolveDef(${dp},.5);a.x.situation.teammates.shortstop.capabilities.fielding=1;const e=resolveInfieldDecision(a.x.situation,"challenge",a.x.match,()=>.5).defensiveOutcomeExplanation;return e.responsibleActor==="teammate"&&!e.coachFeedback.includes("你的傳球失誤");})()`));
verify("11. 6-4-3 判斷文字不把玩家寫成啟動者", evaluate(`(() => {const e=__resolveDef(${cover},.99).explanation;return e.role==="coverPivot"&&e.judgment.includes("游擊手啟動")&&!e.judgment.includes("你選擇啟動");})()`));
verify("12. 6-4-3 成功記錄補位、接球、踩壘、轉傳", evaluate(`(() => {const e=__resolveDef(${cover},.99).explanation;return ["補位","接球","踩壘","轉傳"].every(t=>e.executionSummary.includes(t));})()`));
verify("13. 6-4-3 上游偏傳歸隊友", evaluate(`(() => {const e=__resolveDef({routeId:"coverSecondFor643",runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",coverageQuality:"good",upstreamThrowQuality:"difficultReceive",level:5,routeWindows:{doublePlayWindow:"normal"}},.5).explanation;return e.primaryCause==="throwAccuracy"&&e.responsibleActor==="teammate";})()`));
verify("14. 三壘領先跑者成功路線可讀", evaluate(`(() => {const e=__resolveDef(${third},.99).explanation;return e.routeId==="attackLeadRunnerThird"&&e.outcome.includes("三壘");})()`));
verify("15. 三壘 outcome 不會反向改寫原 decision quality", evaluate(`(() => {const a=__resolveDef(${third},.99);const changed={...a.resolution,resultCode:"zeroOuts",outsCreated:0,detailedResult:"lateThrow"};return createDefensiveOutcomeExplanation(a.x.situation,a.choice,changed).decisionQuality===a.explanation.decisionQuality;})()`));
verify("16. 非滿壘本壘結果使用觸殺文字", evaluate(`(() => {const e=__resolveDef(${tagHome},.99).explanation;return e.outcome.includes("觸殺")&&!e.outcome.includes("踩住壘包完成封殺");})()`));
verify("17. 滿壘本壘結果使用封殺文字", evaluate(`(() => {const e=__resolveDef(${forceHome},.99).explanation;return e.outcome.includes("封殺")&&!e.outcome.includes("觸殺");})()`));
verify("18. 本壘失敗原因不是單純失分", evaluate(`(() => {const e=__resolveDef(${tagHome},0).explanation;return e.causeText&&e.causeText!=="失分";})()`));
verify("19. bobble 後 fallback 被說明為即時重判", evaluate(`(() => {const e=__resolveDef({routeId:"initiate463",runners:["r1","r2","r3"],outs:1,executionChange:"bobble",routeWindows:{firstBaseOutWindow:"narrow",doublePlayWindow:"wide",homeOutWindow:"wide"}},.8).explanation;return e.finalRouteId==="homeForceOut"&&e.reassessmentSummary.includes("重新讀取壘況")&&e.coachFeedback.includes("重判");})()`));
verify("20. reassessment 不自動視為決策失敗", evaluate(`(() => {const e=__resolveDef({routeId:"initiate463",runners:["r1","r2","r3"],outs:1,executionChange:"bobble",routeWindows:{firstBaseOutWindow:"narrow",doublePlayWindow:"wide",homeOutWindow:"wide"}},.8).explanation;return ["strong","reasonable","aggressive"].includes(e.decisionQuality)&&!e.judgment.includes("判斷錯誤");})()`));
verify("21. secondary cause 可為 null", evaluate(`__resolveDef(${secure},.99).explanation.secondaryCause===null`));
verify("22. explanation 保存 canonical evidence pointers", evaluate(`(() => {const ids=__resolveDef(${dp},.99).explanation.sourceEvidenceIds;return ids.includes("resolution.playerLeg")&&ids.includes("resolution.teammateLeg")&&ids.includes("resolution.resultCode");})()`));
verify("23. 玩家文字不洩漏 raw route/cause identifier", evaluate(`(() => {const e=__resolveDef(${dp},.5).explanation;const t=[e.judgment,e.executionSummary,e.outcome,e.causeText,e.coachFeedback].join(" ");return !/initiate463|playerFirstThrow|timingWindow|receiverExecution|throwAccuracy/.test(t);})()`));
verify("24. 同一 evidence 重建說明完全 deterministic", evaluate(`(() => {const a=__resolveDef(${dp},.5);return JSON.stringify(a.explanation)===JSON.stringify(createDefensiveOutcomeExplanation(a.x.situation,a.choice,a.resolution));})()`));
verify("25. 說明建立不修改 situation 或 resolution", evaluate(`(() => {const a=__resolveDef(${dp},.5),s=JSON.stringify(a.x.situation),r=JSON.stringify(a.resolution);createDefensiveOutcomeExplanation(a.x.situation,a.choice,a.resolution);return s===JSON.stringify(a.x.situation)&&r===JSON.stringify(a.resolution);})()`));
verify("26. 說明建立不讀取 RNG", evaluate(`(() => {const a=__resolveDef(${secure},.5);let calls=0;const old=Math.random;Math.random=()=>{calls++;return .1};createDefensiveOutcomeExplanation(a.x.situation,a.choice,a.resolution);Math.random=old;return calls===0;})()`));
verify("27. resolved explanation 可經 save/reload 原樣保留", evaluate(`(() => {const a=__resolveDef(${dp},.5);player.highSchoolMatch=a.x.match;applyInfieldResolutionToHighSchoolMatch(a.x.match,a.choice.matchDecision,a.resolution);const restored=normalizeSave(JSON.parse(JSON.stringify(player))),last=restored.highSchoolMatch.completedMoments.at(-1);return JSON.stringify(restored.highSchoolMatch.lastDefensiveResolution.defensiveOutcomeExplanation)===JSON.stringify(a.explanation)&&JSON.stringify(last.defensiveOutcomeExplanation)===JSON.stringify(a.explanation);})()`));
verify("28. pending defensive choices save/reload 不漂移", evaluate(`(() => {const a=__defCase({runners:["r1",null,null],outs:1,routeWindows:{doublePlayWindow:"wide"}});player.highSchoolMatch=a.match;const before=JSON.stringify(a.choices.map(c=>({id:c.routeId,a:c.availability,r:c.readiness})));player=normalizeSave(JSON.parse(JSON.stringify(player)));const after=JSON.stringify(getHighSchoolDefensiveMomentChoices(player.highSchoolMatch).map(c=>({id:c.routeId,a:c.availability,r:c.readiness})));return before===after;})()`));
verify("29. 無特定 evidence 時使用 unknown guard", evaluate(`(() => {const a=__resolveDef(${secure},.5);const r={...a.resolution,primaryCause:"unrecordedCause",secondaryCause:"",responsibleActor:""};const e=createDefensiveOutcomeExplanation(a.x.situation,a.choice,r);return e.primaryCause==="unknown"&&e.causeText.includes("紀錄不足");})()`));
verify("30. available 不等於 sound：積極 route 維持 aggressive", evaluate(`(() => {const a=__resolveDef(${dp},.99);return a.choice.availability.viable&&a.explanation.decisionQuality==="aggressive";})()`));
verify("31. settlement 將同一 explanation 寫入 completed moment", evaluate(`(() => {const a=__resolveDef(${dp},.99);player.highSchoolMatch=a.x.match;const m=applyInfieldResolutionToHighSchoolMatch(a.x.match,a.choice.matchDecision,a.resolution);return m.defensiveOutcomeExplanation.version===DEFENSIVE_EXPLAINABILITY_VERSION&&m.executionText===a.explanation.executionSummary&&m.coachFeedback===a.explanation.coachFeedback;})()`));
verify("32. outcome card 顯示判斷、執行、結果與主要原因且無 raw enum", evaluate(`(() => {const a=__resolveDef(${dp},.5),e=a.explanation;player.highSchoolMatch=a.x.match;renderYouthSeasonOutcome("high_school_showcase",{text:a.choice.text,judgmentText:e.judgment,executionText:e.executionSummary,memory:e.outcome,causeText:e.causeText,coachFeedback:e.coachFeedback},"");const h=document.getElementById("story").innerHTML;return ["你的判斷","你的執行","發生的結果","為什麼會這樣"].every(t=>h.includes(t))&&!["initiate463","playerFirstThrow","undefined","[object Object]"].some(raw=>h.includes(raw));})()`));
verify("33. secureFirst teammate receive formatter 不怪玩家", evaluate(`(() => {const a=__resolveDef(${secure},.99),r={...a.resolution,resultCode:"zeroOuts",outsCreated:0,detailedResult:"lateThrow",primaryCause:"teammateFirstBaseReceive",responsibleActor:"teammate",teammateLeg:{receiver:"failed"}};const e=createDefensiveOutcomeExplanation(a.x.situation,a.choice,r);return e.primaryCause==="receiverExecution"&&e.responsibleActor==="teammate"&&!e.coachFeedback.includes("你的傳球失誤");})()`));
verify("34. secureFirst timing formatter 不虛構壞傳球", evaluate(`(() => {const a=__resolveDef(${secure},.99),r={...a.resolution,resultCode:"zeroOuts",outsCreated:0,detailedResult:"lateThrow",primaryCause:"timingWindow",responsibleActor:"timingWindow",timingResolution:{routeWindow:"narrow"}};const e=createDefensiveOutcomeExplanation(a.x.situation,a.choice,r);return e.primaryCause==="runnerTiming"&&e.responsibleActor==="systemTiming"&&!e.coachFeedback.includes("傳球偏");})()`));
verify("35. attackThird player throw failure 仍維持 route 判斷", evaluate(`(() => {const a=__resolveDef({routeId:"attackLeadRunnerThird",runners:[null,"r2",null],activeRunnerBase:2,runnerMovementProgress:{1:"advancing"},level:8,throwing:1,ball:"deepGrounder",depth:"deep",routeWindows:{leadRunnerThirdWindow:"wide"}},0);return a.explanation.primaryCause==="throwAccuracy"&&a.explanation.responsibleActor==="player"&&a.explanation.outcome.includes("三壘");})()`));
verify("36. attackThird timing formatter 說明跑者先到三壘", evaluate(`(() => {const a=__resolveDef(${third},.99),r={...a.resolution,resultCode:"zeroOuts",outsCreated:0,detailedResult:"lateThrow",primaryCause:"timingWindow",responsibleActor:"timingWindow",timingResolution:{routeWindow:"narrow"}};const e=createDefensiveOutcomeExplanation(a.x.situation,a.choice,r);return e.outcome.includes("三壘")&&e.causeText.includes("跑者先一步");})()`));
verify("37. preventRunHome player execution failure 可讀且不以失分代替原因", evaluate(`(() => {const a=__resolveDef({routeId:"preventRunHome",runners:[null,null,"r3"],outs:1,activeRunnerBase:3,runnerMovementProgress:{2:"advancing"},level:2,throwing:1,routeWindows:{homeOutWindow:"wide"}},0);return a.resolution.outsCreated===0&&a.explanation.responsibleActor==="player"&&a.explanation.causeText!=="失分";})()`));
verify("38. preventRunHome teammate receive formatter 歸因隊友", evaluate(`(() => {const a=__resolveDef(${tagHome},.99),r={...a.resolution,resultCode:"zeroOuts",outsCreated:0,detailedResult:"lateThrow",primaryCause:"teammateFirstBaseReceive",responsibleActor:"teammate",teammateLeg:{receiver:"failed"}};const e=createDefensiveOutcomeExplanation(a.x.situation,a.choice,r);return e.outcome.includes("本壘")&&e.primaryCause==="receiverExecution"&&e.responsibleActor==="teammate";})()`));
verify("39. preventRunHome timing formatter 歸因 systemTiming", evaluate(`(() => {const a=__resolveDef(${tagHome},.99),r={...a.resolution,resultCode:"zeroOuts",outsCreated:0,detailedResult:"lateThrow",primaryCause:"timingWindow",responsibleActor:"timingWindow",timingResolution:{routeWindow:"narrow"}};const e=createDefensiveOutcomeExplanation(a.x.situation,a.choice,r);return e.outcome.includes("本壘")&&e.primaryCause==="runnerTiming"&&e.responsibleActor==="systemTiming";})()`));
verify("40. primary / secondary cause 依 source evidence 穩定且不重複", evaluate(`(() => {const a=__resolveDef(${secure},.99),r={...a.resolution,resultCode:"zeroOuts",outsCreated:0,detailedResult:"lateThrow",primaryCause:"playerFirstThrow",secondaryCause:"timingWindow",responsibleActor:"shared"};const e=createDefensiveOutcomeExplanation(a.x.situation,a.choice,r);return e.primaryCause==="throwAccuracy"&&e.secondaryCause==="runnerTiming"&&e.responsibleActor==="shared";})()`));

const audit = evaluate(`(() => {
  const scenarios=[${secure},${dp},${cover},${third},${tagHome},${forceHome}];
  const routeCounts=Object.fromEntries(scenarios.map(s=>[s.routeId,0]));
  const routeStats=Object.fromEntries(scenarios.map(s=>[s.routeId,{samples:0,primaryCauses:{},actors:{},missingExplanation:0,impossibleAttribution:0}]));
  const outcomes={},decisionQualities={},primaryCauses={},responsibleActors={};
  let reassessment=0,fallback=0;
  const errors={causeMissing:0,actorMismatch:0,decisionOutcomeContamination:0,playerBlamedForTeammate:0,playerBlamedForTiming:0,impossibleCauseStage:0,duplicateExplanation:0,rngDrift:0,cursorDrift:0,freeze:0,nan:0,rawLeak:0,stateMutation:0,routeMismatch:0};
  const causes=new Set(["fieldingControl","transfer","throwAccuracy","releaseTiming","receiverExecution","runnerTiming","windowExpired","routeTradeoff","forceState","sharedExecution","unknown"]);
  const actors=new Set(["player","teammate","runner","systemTiming","shared","unknown"]);
  const bump=(bucket,key)=>bucket[key]=(bucket[key]||0)+1;
  const hasNaN=value=>typeof value==="number"?Number.isNaN(value):Array.isArray(value)?value.some(hasNaN):value&&typeof value==="object"?Object.values(value).some(hasNaN):false;
  for(let i=0;i<3000;i++){
    const routeIndex=i%scenarios.length,variant=Math.floor(i/scenarios.length)%10;
    let config={...scenarios[routeIndex],seed:91001+i};
    let sample=((i*37)%100)/100;
    if(variant===0&&config.routeId==="initiate463") { config={...config,runners:["r1","r2","r3"],executionChange:"bobble",routeWindows:{firstBaseOutWindow:"narrow",doublePlayWindow:"wide",homeOutWindow:"wide"}}; sample=.8; }
    else if(variant===1&&config.routeId==="initiate463") { config={...config,ball:"normalGrounder",depth:"normal",level:9,batterSpeed:9,shortstopPivotLevel:2,routeWindows:{doublePlayWindow:"normal"}}; sample=.5; }
    else if(variant===0&&config.routeId==="coverSecondFor643") { config={...config,level:5,upstreamThrowQuality:"difficultReceive",routeWindows:{doublePlayWindow:"normal"}}; sample=.5; }
    else if(variant===0&&config.routeId==="preventRunHome") { config={...config,level:2,throwing:1,routeWindows:{homeOutWindow:"wide"}}; sample=0; }
    else if(variant===0) { config={...config,level:8,throwing:1,ball:"deepGrounder",depth:"deep",routeWindows:{firstBaseOutWindow:"wide",leadRunnerThirdWindow:"wide",homeOutWindow:"wide"}}; sample=0; }
    const a=__resolveDef(config,sample),routeStat=routeStats[config.routeId];
    routeStat.samples++;
    if(!a.resolution||!a.explanation){errors.causeMissing++;routeStat.missingExplanation++;continue;}
    routeCounts[config.routeId]++;
    bump(outcomes,a.resolution.resultCode); bump(decisionQualities,a.explanation.decisionQuality);
    bump(primaryCauses,a.explanation.primaryCause); bump(responsibleActors,a.explanation.responsibleActor);
    bump(routeStat.primaryCauses,a.explanation.primaryCause); bump(routeStat.actors,a.explanation.responsibleActor);
    if(a.resolution.reassessed) reassessment++;
    if(a.resolution.fallbackRoute) fallback++;
    if(!causes.has(a.explanation.primaryCause)) errors.causeMissing++;
    if(!actors.has(a.explanation.responsibleActor)) errors.actorMismatch++;
    const changed={...a.resolution,resultCode:a.resolution.resultCode==="zeroOuts"?"oneOut":"zeroOuts",outsCreated:a.resolution.outsCreated?0:1};
    if(createDefensiveOutcomeExplanation(a.x.situation,a.choice,changed).decisionQuality!==a.explanation.decisionQuality) errors.decisionOutcomeContamination++;
    if(a.explanation.responsibleActor==="teammate"&&/你的.*(失誤|偏|慢)/.test(a.explanation.coachFeedback)) errors.playerBlamedForTeammate++;
    if(a.explanation.responsibleActor==="systemTiming"&&/(傳球偏|你的動作太慢)/.test(a.explanation.coachFeedback)) errors.playerBlamedForTiming++;
    const allowedSource={throwAccuracy:["playerFirstThrow","playerSecondThrow","teammateUpstreamThrow"],transfer:["playerPivot"],receiverExecution:["teammatePivot","teammateFirstBaseReceive"],runnerTiming:["timingWindow"],windowExpired:["timingWindow"],releaseTiming:["playerCoverage"],fieldingControl:["playerFieldingControl","balancedExecution"],sharedExecution:["balancedExecution"],unknown:["unrecordedCause"]};
    if(allowedSource[a.explanation.primaryCause]&&!allowedSource[a.explanation.primaryCause].includes(a.explanation.sourcePrimaryCause)) { errors.impossibleCauseStage++; routeStat.impossibleAttribution++; }
    if(new Set(a.explanation.sourceEvidenceIds).size!==a.explanation.sourceEvidenceIds.length) errors.duplicateExplanation++;
    const text=[a.explanation.judgment,a.explanation.executionSummary,a.explanation.outcome,a.explanation.causeText,a.explanation.coachFeedback].join(" ");
    if(["secureFirstBaseOut","initiate463","coverSecondFor643","attackLeadRunnerThird","preventRunHome","homeForceOut","playerFirstThrow","timingWindow","undefined","[object Object]"].some(raw=>text.includes(raw))) errors.rawLeak++;
    const before=JSON.stringify({s:a.x.situation,r:a.resolution}),rng=a.x.match.simulationCursor,cursor=a.x.match.presentedEventCursor;
    createDefensiveOutcomeExplanation(a.x.situation,a.choice,a.resolution);
    if(before!==JSON.stringify({s:a.x.situation,r:a.resolution})) errors.stateMutation++;
    if(rng!==a.x.match.simulationCursor) errors.rngDrift++;
    if(cursor!==a.x.match.presentedEventCursor) errors.cursorDrift++;
    if(!Object.isFrozen(a.explanation)||!Object.isFrozen(a.explanation.sourceEvidenceIds)) errors.freeze++;
    if(hasNaN(a.explanation)) errors.nan++;
    if(a.explanation.routeId!==config.routeId) errors.routeMismatch++;
  }
  return {decisions:3000,routeCounts,routeStats,outcomes,decisionQualities,primaryCauses,responsibleActors,reassessment,fallback,errors};
})()`);
console.log(`Structural audit preview: ${JSON.stringify(audit)}`);
verify("41. 3,000 次完整防守決策 audit 全部結構完整", audit.decisions === 3000 && Object.values(audit.errors).every(value => value === 0));
verify("42. 六條 canonical route 在 audit 中皆非 dead route", Object.values(audit.routeCounts).every(value => value > 0));

console.log(`\nDefensive Outcome Cause Explainability Foundation v1：${passed}/${passed} 通過`);
console.log(`Structural audit: ${JSON.stringify(audit)}`);
