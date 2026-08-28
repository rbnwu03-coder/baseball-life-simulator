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
    function __base224(seed=224001) {
      stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
      player=createInitialPlayer("2.2.4 二壘測試球員");
      applyDebugBookmarkCharacterProfile(player); settleHighSchoolEntryCapability(player,{originType:"test-fixture"}); applyCanonicalPositionProfile(player,"內野手",["外野手"]);
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
    function __case224(options={}) {
      const match=__base224(options.seed||224001);
      Object.assign(match,{runners:(options.runners||[null,null,null]).slice(),outs:options.outs??0,inning:options.inning||5,scores:{...(options.scores||{home:2,away:2})}});
      setHighSchoolDefensiveBallContext(match,options.ball||"normalGrounder");
      const level=options.level??8;
      const overrides={
        playerPosition:"二壘手",primaryFielderPosition:options.primary||"二壘手",ballDirection:options.direction||"straightAtPlayer",
        ...(options.depth?{ballDepth:options.depth}:{}),batterSpeed:options.batterSpeed??5,
        runnerSpeeds:options.runnerSpeeds||[6,6,6],activeRunnerBase:options.activeRunnerBase,
        runnerMovementProgress:options.runnerMovementProgress||{},runnerTargets:options.runnerTargets||{},
        playerCapabilities:{fielding:level,reaction:level,range:level,arm:level,throwing:options.throwing??level,decision:level},
        routeWindowOverrides:options.routeWindows||{},executionChange:options.executionChange||"",
        upstreamThrowQuality:options.upstreamThrowQuality||"",coverageQuality:options.coverageQuality||""
      };
      buildInfieldMeaningfulMoment(match,player,overrides);
      const choices=getHighSchoolDefensiveMomentChoices(match);
      const classification=classifyPositionFamilyPlay(match.defensiveSituation,choices,true);
      match.playerEventClassification=classification.eventClassification; match.decisionTension=classification.decisionTension;
      match.decisionGate=classification.gate;
      return {match,situation:match.defensiveSituation,choices,classification};
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

verify("1. Case 1 空壘二壘滾地球由玩家擔任 primary fielder", evaluate(`__case224().situation.responsibility.primaryFielder.actor==="player"`));
verify("2. Case 1 只有一壘出局 route", evaluate(`(() => {const x=__case224();return x.choices.length===1&&x.choices[0].routeId==="secureFirstBaseOut";})()`));
verify("3. Case 1 不建立 Meaningful Decision", evaluate(`!__case224().classification.gate.shouldCreateDecision`));
verify("4. Case 1 例行處理仍經 capability resolver", evaluate(`(() => {const x=__case224({level:9});const r=resolveRoutineDefensivePlay(x.match,x.situation,()=>.9);return r.eventClassification==="playerRoutinePlay"&&r.playerLeg&&r.outsCreated===1;})()`));

verify("5. Case 2 4-6-3 玩家角色為 initiator", evaluate(`__case224({runners:["r1",null,null],outs:1,routeWindows:{doublePlayWindow:"wide"}}).situation.responsibility.playerRole==="initiator"`));
verify("6. Case 2 4-6-3 責任鏈為 player → SS → 1B", evaluate(`(() => {const c=__case224({runners:["r1",null,null],outs:1,routeWindows:{doublePlayWindow:"wide"}}).choices.find(c=>c.routeId==="initiate463");return c.action==="throwSecond"&&c.route==="4-6-3"&&c.responsibilityChain.join(">")==="player>SS>1B";})()`));
verify("7. Case 2 4-6-3 文案不虛構二壘手補二壘", evaluate(`(() => {const c=__case224({runners:["r1",null,null],outs:1,routeWindows:{doublePlayWindow:"wide"}}).choices.find(c=>c.routeId==="initiate463");return !c.text.includes("送往二壘後立刻補位")&&!c.text.includes("二壘手補二壘");})()`));
verify("8. Case 2 一壘與 4-6-3 有真實取捨時建立 Decision", evaluate(`__case224({runners:["r1",null,null],outs:1,routeWindows:{doublePlayWindow:"wide"}}).classification.gate.shouldCreateDecision`));

verify("9. Case 3 6-4-3 玩家不是 primary fielder", evaluate(`(() => {const s=__case224({runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",routeWindows:{doublePlayWindow:"normal"}}).situation;return s.responsibility.primaryFielder.position==="游擊手"&&s.responsibility.primaryFielder.actor!=="player";})()`));
verify("10. Case 3 玩家同時是 cover 與 pivot", evaluate(`(() => {const r=__case224({runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",routeWindows:{doublePlayWindow:"normal"}}).situation.responsibility;return r.playerRole==="coverPivot"&&r.playerRoles.includes("cover")&&r.playerRoles.includes("pivot");})()`));
verify("11. Case 3 只有 6-4-3 execution route 且為 Routine", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",routeWindows:{doublePlayWindow:"normal"}});return x.choices.length===1&&x.choices[0].routeId==="coverSecondFor643"&&x.choices[0].executionOnly&&!x.classification.gate.shouldCreateDecision;})()`));
verify("12. Case 3 6-4-3 分段包含 SS 第一傳與玩家補位樞紐", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",routeWindows:{doublePlayWindow:"wide"},coverageQuality:"good",upstreamThrowQuality:"clean",level:10,batterSpeed:3});const r=resolveRoutineDefensivePlay(x.match,x.situation,()=>.99);return r.initialRoute==="coverSecondFor643"&&r.playerLeg.coverage==="good"&&r.teammateLeg.shortstopFirstThrow==="clean";})()`));

verify("13. Case 4 二壘跑者實際推進時可出現三壘挑戰", evaluate(`__case224({runners:[null,"r2",null],activeRunnerBase:2,runnerMovementProgress:{1:"advancing"},routeWindows:{leadRunnerThirdWindow:"normal"}}).choices.some(c=>c.routeId==="attackLeadRunnerThird")`));
verify("14. Case 4 一壘與三壘 route 是不同 commitment", evaluate(`(() => {const c=__case224({runners:[null,"r2",null],activeRunnerBase:2,runnerMovementProgress:{1:"advancing"},routeWindows:{leadRunnerThirdWindow:"normal"}}).choices;return areChoicesBehaviorallyDistinct(c.find(x=>x.routeId==="secureFirstBaseOut"),c.find(x=>x.routeId==="attackLeadRunnerThird"));})()`));
verify("15. Case 4 三壘窗口 expired 時移除三壘 route", evaluate(`!__case224({runners:[null,"r2",null],activeRunnerBase:2,runnerMovementProgress:{1:"advancing"},routeWindows:{leadRunnerThirdWindow:"expired"}}).choices.some(c=>c.routeId==="attackLeadRunnerThird")`));

verify("16. Case 5 非滿壘本壘 route 使用 tag semantics", evaluate(`(() => {const c=__case224({runners:[null,null,"r3"],outs:1,activeRunnerBase:3,runnerMovementProgress:{2:"advancing"},routeWindows:{homeOutWindow:"normal"}}).choices.find(c=>c.routeId==="preventRunHome");return c.action==="throwHomeForTag"&&c.requirements.includes("tagAtHome")&&!c.requirements.includes("forceAtHome");})()`));
verify("17. Case 5 本壘與一壘 route 依窗口形成 Decision", evaluate(`__case224({runners:[null,null,"r3"],outs:1,activeRunnerBase:3,runnerMovementProgress:{2:"advancing"},routeWindows:{homeOutWindow:"normal"}}).classification.gate.shouldCreateDecision`));
verify("18. Case 5 兩出局不沿用同一防分 choice template", evaluate(`!__case224({runners:[null,null,"r3"],outs:2,activeRunnerBase:3,runnerMovementProgress:{2:"advancing"},routeWindows:{homeOutWindow:"normal"}}).choices.some(c=>c.routeId==="preventRunHome")`));

verify("19. Case 6 滿壘同時可有一壘、4-6-3、本壘 force", evaluate(`(() => {const ids=__case224({runners:["r1","r2","r3"],outs:1,routeWindows:{firstBaseOutWindow:"normal",doublePlayWindow:"wide",homeOutWindow:"wide"}}).choices.map(c=>c.routeId);return ["secureFirstBaseOut","initiate463","homeForceOut"].every(id=>ids.includes(id));})()`));
verify("20. Case 6 本壘使用 force semantics", evaluate(`(() => {const c=__case224({runners:["r1","r2","r3"],outs:1,routeWindows:{homeOutWindow:"wide"}}).choices.find(c=>c.routeId==="homeForceOut");return c.action==="throwHomeForForce"&&c.requirements.includes("forceAtHome")&&!c.requirements.includes("tagAtHome");})()`));
verify("21. Case 6 雙殺 bobble 後即時重評估", evaluate(`(() => {const x=__case224({runners:["r1","r2","r3"],outs:1,executionChange:"bobble",routeWindows:{firstBaseOutWindow:"normal",doublePlayWindow:"wide",homeOutWindow:"wide"}});const r=resolveInfieldDecision(x.situation,"challenge",x.match,()=>.8);return r.reassessed&&r.initialRoute==="initiate463"&&r.reassessment.availableRouteIds.length>0;})()`));
verify("22. Case 6 DP expired 而本壘仍有效時動態 fallback 本壘", evaluate(`(() => {const x=__case224({runners:["r1","r2","r3"],outs:1,executionChange:"bobble",routeWindows:{firstBaseOutWindow:"narrow",doublePlayWindow:"wide",homeOutWindow:"wide"}});const r=resolveInfieldDecision(x.situation,"challenge",x.match,()=>.8);return r.fallbackRoute==="homeForceOut"&&r.activeRoute==="homeForceOut"&&r.route==="forceHome"&&r.outsCreated===1;})()`));
verify("23. Case 6 fallback 後 runners 由實際本壘封殺推導", evaluate(`(() => {const x=__case224({runners:["r1","r2","r3"],outs:1,executionChange:"bobble",routeWindows:{firstBaseOutWindow:"narrow",doublePlayWindow:"wide",homeOutWindow:"wide"}});const r=resolveInfieldDecision(x.situation,"challenge",x.match,()=>.8);return r.runnersAfter.join()===[x.situation.batterId,"r1","r2"].join()&&!r.runnersAfter.includes("r3");})()`));

verify("24. Case 7 慢滾球可讓 DP 窗口 expired", evaluate(`__case224({runners:["r1",null,null],ball:"slowGrounder",direction:"rightSide",batterSpeed:9,runnerSpeeds:[9,null,null]}).situation.routeWindows.doublePlayWindow.state==="expired"`));
verify("25. Case 7 只剩一壘 route 時不產生 Decision", evaluate(`(() => {const x=__case224({runners:["r1",null,null],ball:"slowGrounder",direction:"rightSide",batterSpeed:9,runnerSpeeds:[9,null,null]});return !x.choices.some(c=>c.routeId==="initiate463")&&!x.classification.gate.shouldCreateDecision;})()`));
verify("26. Case 7 深處側向球分別提高 reach 與 release demand", evaluate(`(() => {const a=__case224().situation.demands;const b=__case224({ball:"deepGrounder",depth:"deep",direction:"rightSide"}).situation.demands;return b.reach>a.reach&&b.release>a.release;})()`));

verify("27. Case 8 coverage failed 時不傳向無人二壘", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",coverageQuality:"failed",routeWindows:{doublePlayWindow:"wide",firstBaseOutWindow:"wide"}});const r=resolveRoutineDefensivePlay(x.match,x.situation,()=>.8);return r.teammateLeg.shortstopFirstThrow==="heldForReassessment"&&r.fallbackRoute!=="coverSecondFor643";})()`));
verify("28. Case 8 live reassessment 可改傳一壘", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",coverageQuality:"failed",routeWindows:{doublePlayWindow:"wide",firstBaseOutWindow:"wide"}});const r=resolveRoutineDefensivePlay(x.match,x.situation,()=>.8);return r.reassessed&&r.fallbackRoute==="secureFirstBaseOut"&&r.outsCreated===1;})()`));
verify("29. Case 8 主因正確歸屬玩家 coverage", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",coverageQuality:"failed",routeWindows:{doublePlayWindow:"wide",firstBaseOutWindow:"wide"}});const r=resolveRoutineDefensivePlay(x.match,x.situation,()=>.8);return r.primaryCause==="playerCoverage"&&r.responsibleActor==="player";})()`));

verify("30. 高能力與寬窗口 readiness 為 high", evaluate(`(() => {const c=__case224({runners:["r1",null,null],level:10,batterSpeed:3,routeWindows:{firstBaseOutWindow:"wide"}}).choices.find(c=>c.routeId==="secureFirstBaseOut");return c.readiness.level==="high";})()`));
verify("31. 低能力、困難方向與窄窗口 readiness 為 low", evaluate(`(() => {const c=__case224({level:2,throwing:1,ball:"deepGrounder",depth:"deep",direction:"rightSide",routeWindows:{firstBaseOutWindow:"narrow"}}).choices.find(c=>c.routeId==="secureFirstBaseOut");return c.readiness.level==="low";})()`));
verify("32. 弱 SS 只出現在隊友依賴理由，不改寫玩家能力", evaluate(`(() => {const x=__case224({runners:["r1",null,null],level:10,routeWindows:{doublePlayWindow:"normal"}});x.situation.teammates.shortstop.capabilities.fielding=2;x.situation.teammates.shortstop.capabilities.throwing=2;const r=evaluateExecutionReadiness({route:SECOND_BASE_ROUTE_DEFINITIONS.initiate463,situation:x.situation});return r.reasons.some(v=>v.includes("依賴隊友")&&v.includes("並非你的能力不足"))&&x.situation.playerCapabilities.fielding===10;})()`));
verify("33. readiness contract 不含百分比或推薦欄位", evaluate(`(() => {const r=__case224().choices.find(c=>c.routeId==="secureFirstBaseOut").readiness;return !["recommendedRoute","bestRoute","successProbability"].some(k=>Object.hasOwn(r,k));})()`));
verify("34. Decision UI 顯示執行把握與短理由", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,routeWindows:{doublePlayWindow:"wide"}});recordHighSchoolMatchSimulationEvent(x.match,{type:"meaningfulMomentReached",presentationImportance:"attention",momentId:x.match.currentMomentId,assignment:"二壘守備決策"});x.match.presentedEventCursor=x.match.simulationLog.length;player.highSchoolMatch=x.match;renderHighSchoolYearOneMatch({title:"秋季交流賽"});const h=document.getElementById("choices").innerHTML;return h.includes("執行把握：")&&h.includes("match-choice-readiness");})()`));
verify("35. Decision UI 不顯示成功率或推薦", evaluate(`(() => {const h=document.getElementById("choices").innerHTML;return !/[0-9]+%|推薦|最佳選擇/.test(h);})()`));

verify("36. 6-4-3 偏傳歸因 SS upstream throw 而非玩家 throwing", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",coverageQuality:"good",upstreamThrowQuality:"difficultReceive",level:5,routeWindows:{doublePlayWindow:"normal"}});const r=resolveRoutineDefensivePlay(x.match,x.situation,()=>.5);return r.primaryCause==="teammateUpstreamThrow"&&r.responsibleActor==="teammate"&&r.playerLeg.receive==="failed";})()`));
verify("37. 4-6-3 execution chain 分開 Player Leg 與 Teammate Leg", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,level:9,batterSpeed:4,routeWindows:{doublePlayWindow:"wide"}});const r=resolveInfieldDecision(x.situation,"challenge",x.match,()=>.9);return r.playerLeg.reach&&r.playerLeg.control&&r.playerLeg.firstThrow&&r.teammateLeg.shortstopReceive&&r.teammateLeg.firstBaseReceive;})()`));
verify("38. Force state 可由目前 runners / outs 重算", evaluate(`(() => {const a=deriveDefensiveForceStateFromRunners(["r1","r2","r3"],1);const b=deriveDefensiveForceStateFromRunners([null,"r2","r3"],2);return a.forceAtHome&&a.doublePlayEligible&&!b.forceAtHome&&!b.forceAtSecond&&!b.doublePlayEligible;})()`));

verify("39. 所有二壘 route 維持 runner identity conservation", evaluate(`(() => {const scenarios=[
  {runners:[null,null,null],decision:"secure",routeWindows:{firstBaseOutWindow:"wide"}},
  {runners:["r1",null,null],decision:"challenge",routeWindows:{doublePlayWindow:"wide"}},
  {runners:[null,"r2",null],decision:"lead",activeRunnerBase:2,runnerMovementProgress:{1:"advancing"},routeWindows:{leadRunnerThirdWindow:"wide"}},
  {runners:[null,null,"r3"],decision:"home",activeRunnerBase:3,runnerMovementProgress:{2:"advancing"},routeWindows:{homeOutWindow:"wide"}},
  {runners:["r1","r2","r3"],decision:"home",routeWindows:{homeOutWindow:"wide"}}
];return scenarios.every(o=>{const x=__case224(o);const r=resolveInfieldDecision(x.situation,o.decision,x.match,()=>.9);const allowed=new Set([x.situation.batterId,...x.situation.runners.filter(Boolean)]);const ids=[...r.runnersAfter,...r.scoringRunnerIds].filter(Boolean);return ids.every(id=>allowed.has(id))&&ids.length===new Set(ids).size&&!r.scoringRunnerIds.some(id=>r.runnersAfter.includes(id));});})()`));
verify("40. resolved save/reload 深層保留 route、stage、readiness 與 attribution", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,routeWindows:{doublePlayWindow:"wide"}});const r=resolveInfieldDecision(x.situation,"challenge",x.match,()=>.9);x.match.lastDefensiveResolution=JSON.parse(JSON.stringify(r));player.highSchoolMatch=x.match;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return restored.defensiveSituation.responsibility.playerRole==="initiator"&&restored.lastDefensiveResolution.initialRoute==="initiate463"&&restored.lastDefensiveResolution.playerLeg&&restored.lastDefensiveResolution.readiness&&restored.lastDefensiveResolution.responsibleActor;})()`));
verify("41. reload 後合法 route list 不由 stale state 改寫", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,routeWindows:{doublePlayWindow:"wide"}});player.highSchoolMatch=x.match;const before=JSON.stringify(x.choices.map(c=>({id:c.routeId,a:c.availability,r:c.readiness})));player=normalizeSave(JSON.parse(JSON.stringify(player)));return before===JSON.stringify(getHighSchoolDefensiveMomentChoices(player.highSchoolMatch).map(c=>({id:c.routeId,a:c.availability,r:c.readiness})));})()`));
verify("42. 4-6-3 commentary 不出現二壘手補二壘", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,routeWindows:{doublePlayWindow:"wide"}});const r=resolveInfieldDecision(x.situation,"challenge",x.match,()=>.9);const p=presentInfieldDecision(x.situation,r,"challenge");return !p.execution.includes("送向二壘，隨即移動補位")&&!p.execution.includes("二壘手補二壘");})()`));
verify("43. 6-4-3 commentary 明確描述玩家補位與 pivot", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,primary:"游擊手",direction:"leftSide",coverageQuality:"good",upstreamThrowQuality:"clean",level:9,routeWindows:{doublePlayWindow:"wide"}});const r=resolveRoutineDefensivePlay(x.match,x.situation,()=>.9);const e={type:"playerRoutinePlay",batterId:x.situation.batterId,ballContext:r.ballContext,ballDirection:r.ballDirection,playerPosition:"二壘手",initialRoute:r.initialRoute,fallbackRoute:r.fallbackRoute,outsCreated:r.outsCreated,upstreamThrowQuality:r.upstreamThrowQuality,after:{outs:x.match.outs+r.outsCreated}};const t=formatHighSchoolRoutineDefensiveCommentary(e,x.match);return t.includes("補位接球")&&t.includes("轉傳一壘");})()`));
verify("44. timing constants 完全不變", evaluate(`MATCH_FLOW_BEAT_MS===1000&&MATCH_ATTENTION_BEAT_MS===1700&&MATCH_MAJOR_TRANSITION_MS===1850`));
verify("45. Route metadata contract 完整", evaluate(`Object.values(SECOND_BASE_ROUTE_DEFINITIONS).every(r=>r.id&&r.objective&&r.action&&r.targetBase&&r.route&&r.playerRole&&Array.isArray(r.teammateChain)&&Array.isArray(r.requirements)&&typeof r.executionOnly==="boolean")`));
verify("46. 4-6-3 第一傳到位但第二段被快打者壓縮時歸因 timing window", evaluate(`(() => {const x=__case224({runners:["r1",null,null],outs:1,level:9,batterSpeed:9,routeWindows:{doublePlayWindow:"normal"}});x.situation.teammates.shortstop.capabilities.reaction=2;x.situation.teammates.shortstop.capabilities.throwing=2;const r=resolveInfieldDecision(x.situation,"challenge",x.match,()=>.5);return r.outsCreated===1&&r.primaryCause==="timingWindow"&&r.secondaryCause==="teammatePivot"&&r.responsibleActor==="timingWindow";})()`));

console.log(`\nBaseball Match Foundation 2.2.4：${passed}/${passed} 通過`);
