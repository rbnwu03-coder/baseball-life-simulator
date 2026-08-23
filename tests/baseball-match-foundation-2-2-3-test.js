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
    function __base223(position="一壘手", seed=223001) {
      stopHighSchoolMatchPlayback();
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      player=createInitialPlayer("2.2.3 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode="starter";
      player.highSchoolTeamRole="starter";
      pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      match.developmentPositionOverride=position;
      match.position="內野手";
      match.currentFieldingPosition="";
      match.playerEntryCompleted=true;
      match.playerLineupStatus="starter";
      return match;
    }
    function __off223({runners=[null,null,null],outs=1,inning=5,scores={home:2,away:2},momentIndex=0}={}) {
      const match=__base223();
      Object.assign(match,{
        inning,half:"下",offenseTeam:"home",defenseTeam:"away",outs,
        runners:runners.slice(),scores:{...scores},momentIndex,
        currentMomentId:highSchoolYearOneMomentIds[momentIndex],currentDomain:"offense",
        simulationPhase:"moment_"+(momentIndex+1)+"_ready",completed:false,settled:false,
        completedMoments:[],decision:"",outcome:"",consequence:""
      });
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      match.presentedEventCursor=match.simulationLog.length;
      syncHighSchoolMatchPlayerRunnerLocation(match);
      setHighSchoolCoachTacticalDirection(match);
      return match;
    }
    function __def223({position="一壘手",runners=["away-sim-4",null,null],outs=0,level=8,batterSpeed=6}={}) {
      const match=__base223(position);
      Object.assign(match,{
        inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs,
        runners:runners.slice(),scores:{home:2,away:2},simulationPhase:"moment_1_resolved",
        momentIndex:0,currentMomentId:highSchoolYearOneMomentIds[0],currentDomain:"flow",
        completedMoments:[{id:highSchoolYearOneMomentIds[0],domain:"offense",decision:"zone",tier:"mixed",outcome:"測試",consequence:"繼續",inning:4,half:"下",outs:1,scores:{home:2,away:2},runners:[null,null,null]}]
      });
      match.battingOrderIndex.away=2;
      match.currentBatter=getHighSchoolMatchLineupBatter(match,"away").id;
      prepareHighSchoolDefensiveMomentFromSimulation(match,{
        ballContextType:"hardGrounder",randomSource:()=>.8,
        situationOverrides:{playerPosition:position,ballDirection:"straightAtPlayer",ballDepth:"normal",batterSpeed,
          playerCapabilities:{fielding:level,reaction:level,range:level,arm:level,throwing:level,decision:level}}
      });
      return {match,situation:match.defensiveSituation,choices:getHighSchoolDefensiveMomentChoices(match)};
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

verify("1. 精確人工情境空壘選項不含跑者 objective", evaluate(`(() => {const m=__off223();return getHighSchoolYearOneMatchMomentChoices(m).every(c=>!["advanceRunner","scoreRunner","avoidDoublePlay","sacrificeAdvance"].includes(c.objective));})()`));
verify("2. 空壘三個選項都是當下合法棒球承諾", evaluate(`(() => {const m=__off223();const c=getHighSchoolYearOneMatchMomentChoices(m);return c.length===3&&c.every(x=>isOffensiveDecisionChoiceLegal(x,m));})()`));
verify("3. 空壘 contact choice 改為確實擊球而非推進跑者", evaluate(`(() => getHighSchoolYearOneMatchMomentChoices(__off223()).find(c=>c.matchDecision==="advance").text.includes("確實打進場內"))()`));
verify("4. 所有進攻選項都有 Objective 與 Approach", evaluate(`(() => getHighSchoolYearOneMatchMomentChoices(__off223()).every(c=>c.objective&&c.approach&&c.action&&c.route&&c.riskProfile&&Array.isArray(c.requirements)&&c.executionOnly===false))()`));
verify("5. Objective 與 Approach 是分離欄位", evaluate(`(() => getHighSchoolYearOneMatchMomentChoices(__off223()).every(c=>c.objective!==c.approach))()`));

verify("6. 手動注入空壘 advanceRunner 會被 resolver 拒絕", evaluate(`(() => {const m=__off223();const base=buildOffensiveDecisionChoices(m)[2];const illegal={...base,objective:"advanceRunner",requirements:[]};const before=JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,moments:m.completedMoments});return resolveHighSchoolOffensiveDecision(m,illegal,"mixed")===false&&before===JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,moments:m.completedMoments});})()`));
verify("7. renderer 會過濾 requirements 已失效的 stale choice", evaluate(`(() => {const m=__off223({runners:["runner",null,null]});const c=buildOffensiveDecisionChoices(m).find(x=>x.objective==="advanceRunner");m.runners=[null,null,null];return !isOffensiveDecisionChoiceLegal(c,m)&&!getHighSchoolYearOneMatchMomentChoices(m).some(x=>x.objective==="advanceRunner");})()`));
verify("8. 空壘一出局 contact ground out 後為兩出局空壘", evaluate(`(() => {const m=__off223();const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="advance");resolveHighSchoolOffensiveDecision(m,c,"mixed");return m.outs===2&&m.runners.every(x=>!x)&&m.lastOffensiveResolution.resultCode==="productiveOut";})()`));
verify("9. 空壘 ground out 意義不宣稱完成推進", evaluate(`(() => {const m=__off223();const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="advance");const r=resolveHighSchoolOffensiveDecision(m,c,"mixed");return r.outcome.includes("打者出局")&&!r.outcome.includes("完成推進")&&!r.consequence.includes("實際向前推進");})()`));
verify("10. 二壘有人同一 ground out 真的把跑者送上三壘", evaluate(`(() => {const m=__off223({runners:[null,"runner-2",null]});const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="advance");const r=resolveHighSchoolOffensiveDecision(m,c,"mixed");return m.runners[2]==="runner-2"&&r.runnerChanges.some(x=>x.runnerId==="runner-2"&&x.from===2&&x.to===3)&&r.consequence.includes("二壘跑者推進到三壘");})()`));
verify("11. 棒球意義在 PA 與 runner rules 之後由 before/after 推導", evaluate(`(() => {const m=__off223({runners:[null,"runner-2",null]});const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="advance");resolveHighSchoolOffensiveDecision(m,c,"mixed");const e=m.simulationLog.findLast(x=>x.type==="plateAppearance"&&x.meaningful);return e.before.runners[1]==="runner-2"&&e.after.runners[2]==="runner-2"&&e.result==="productiveOut";})()`));

verify("12. 一壘有人一出局可生成 advanceRunner", evaluate(`(() => getHighSchoolYearOneMatchMomentChoices(__off223({runners:["runner-1",null,null]})).some(c=>c.objective==="advanceRunner"&&c.requirements.includes("runnerOnFirst")))()`));
verify("13. 三壘有人一出局可生成 scoreRunner", evaluate(`(() => getHighSchoolYearOneMatchMomentChoices(__off223({runners:[null,null,"runner-3"]})).some(c=>c.objective==="scoreRunner"&&c.requirements.includes("runnerOnThird")))()`));
verify("14. 三壘 runner 只有實際得分後 objective 才成功", evaluate(`(() => {const m=__off223({runners:[null,null,"runner-3"]});const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.objective==="scoreRunner");const r=resolveHighSchoolOffensiveDecision(m,c,"mixed");return m.scores.home===3&&r.objectiveSucceeded&&r.scoringRunnerIds.includes("runner-3");})()`));
verify("15. 兩出局不產生 sacrifice objective 或 route", evaluate(`(() => getHighSchoolYearOneMatchMomentChoices(__off223({runners:[null,null,"runner-3"],outs:2})).every(c=>![c.objective,c.route].some(v=>["sacrificeForRun","sacrificeAdvance","sacrificeFly"].includes(v))))()`));
verify("16. 三壘有人兩出局不以出局換一分", evaluate(`(() => {const m=__off223({runners:[null,null,"runner-3"],outs:2});const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="advance");const r=resolveHighSchoolOffensiveDecision(m,c,"mixed");return m.outs===3&&m.scores.home===2&&!r.objectiveSucceeded&&!r.consequence.includes("送回 1 名");})()`));
verify("17. 滿壘可合法生成 scoreRunner context", evaluate(`(() => getHighSchoolYearOneMatchMomentChoices(__off223({runners:["r1","r2","r3"]})).some(c=>c.objective==="scoreRunner"))()`));
verify("18. 大比分落後且空壘的 Coach 不提推進、跑者或犧牲", evaluate(`(() => {const m=__off223({inning:7,scores:{home:1,away:7}});setHighSchoolCoachTacticalDirection(m);return m.coachTacticalDirection.intent==="controlledAttack"&&!/[推進跑者犧牲]/.test(m.coachInstruction);})()`));

verify("19. 一壘手 reference case 保留 self-cover 與 3-6-3 兩條真實 route", evaluate(`(() => {const x=__def223();const routes=x.choices.map(c=>c.route);return routes.includes("selfCoverFirst")&&routes.includes("3-6-3");})()`));
verify("20. 一壘手 self-cover choice 的 action 與 target 正確", evaluate(`(() => {const c=__def223().choices.find(x=>x.route==="selfCoverFirst");return c.action==="selfCoverFirst"&&c.targetBase==="first"&&c.text.includes("自己踩上一壘");})()`));
verify("21. 一壘手 3-6-3 只保留一個傳二壘 commitment", evaluate(`(() => {const c=__def223().choices.filter(x=>x.action==="throwSecond"&&x.targetBase==="secondThenFirst");return c.length===1&&c[0].route==="3-6-3";})()`));
verify("22. 3-6-3 choice 同時有 objective/action/route/risk/requirements", evaluate(`(() => {const c=__def223().choices.find(x=>x.route==="3-6-3");return c.objective==="attemptDoublePlay"&&c.action==="throwSecond"&&c.riskProfile==="high"&&c.requirements.includes("forceAtSecond")&&!c.executionOnly;})()`));
verify("23. 不同文字但同一 commitment 會 semantic dedup", evaluate(`dedupePositionDecisionChoices([{text:"只拿二壘",objective:"attackLeadRunner",action:"throwSecond",route:"3-6-3",targetBase:"secondThenFirst",riskProfile:"high"},{text:"挑戰雙殺",objective:"attemptDoublePlay",action:"throwSecond",route:"3-6-3",targetBase:"secondThenFirst",riskProfile:"high"}]).length===1`));
verify("24. 行動或 route 真正不同時才是 behaviorally distinct", evaluate(`(() => {const c=__def223().choices;return areChoicesBehaviorallyDistinct(c.find(x=>x.route==="selfCoverFirst"),c.find(x=>x.route==="3-6-3"));})()`));
verify("25. 只有 fake duplicates 的 Meaningful Gate 為 false", evaluate(`(() => {const x=__def223();const a={objective:"secureOut",action:"throwSecond",route:"3-6-3",targetBase:"secondThenFirst",riskProfile:"high",baseballValue:"convertBatterOut",executionOnly:false};const b={...a,objective:"attemptDoublePlay",baseballValue:"createMultipleOuts"};return !evaluatePositionDecisionMoment(x.situation,[a,b]).shouldCreateDecision;})()`));
verify("26. execution-only choices 不足以通過 Meaningful Gate", evaluate(`(() => {const x=__def223();const a={objective:"secureOut",action:"selfCoverFirst",route:"selfCoverFirst",targetBase:"first",riskProfile:"low",baseballValue:"convertBatterOut",executionOnly:false};const b={objective:"controlBall",action:"holdBall",route:"controlledHold",targetBase:"none",riskProfile:"low",baseballValue:"executionOnly",executionOnly:true};return !evaluatePositionDecisionMoment(x.situation,[a,b]).shouldCreateDecision;})()`));

verify("27. 同一條 3-6-3 route 可 deterministic 完成雙殺", evaluate(`(() => {const x=__def223({level:10,batterSpeed:2});return resolveInfieldDecision(x.situation,"challenge",x.match,()=>.99).resultCode==="twoOuts";})()`));
verify("28. 同一條 3-6-3 route 可 deterministic 只拿一個出局", evaluate(`(() => {const x=__def223({level:7,batterSpeed:9});return Array.from({length:100},(_,i)=>i/100).some(sample=>resolveInfieldDecision(x.situation,"challenge",x.match,()=>sample).resultCode==="oneOut");})()`));
verify("29. 同一條 3-6-3 route 可 deterministic 形成失敗", evaluate(`(() => {const x=__def223({level:2,batterSpeed:9});return ["zeroOuts","error"].includes(resolveInfieldDecision(x.situation,"challenge",x.match,()=>0).resultCode);})()`));
verify("30. 1B 雙殺解算保留 pivot 與回壘 timing", evaluate(`(() => {const x=__def223({level:9,batterSpeed:5});const r=resolveInfieldDecision(x.situation,"challenge",x.match,()=>.9);return r.teammateResponsibility&&Number.isFinite(r.returnTiming)&&r.windows&&Number.isFinite(r.throwing)&&Number.isFinite(r.arm);})()`));

verify("31. Flow/Attention/Major timing 使用集中命名常數", evaluate(`MATCH_FLOW_BEAT_MS===1000&&MATCH_ATTENTION_BEAT_MS===1700&&MATCH_MAJOR_TRANSITION_MS===1850`));
verify("32. 普通事件使用 flow timing", evaluate(`(() => {const m=__off223();m.simulationLog.push({type:"plateAppearance",presentationImportance:"hidden"});m.presentedEventCursor=m.simulationLog.length;return getHighSchoolMatchPlaybackDelay(m)===MATCH_FLOW_BEAT_MS;})()`));
verify("33. attention 事件使用 attention timing", evaluate(`(() => {const m=__off223();m.simulationLog.push({type:"playerRoutinePlay",presentationImportance:"attention"});m.presentedEventCursor=m.simulationLog.length;return getHighSchoolMatchPlaybackDelay(m)===MATCH_ATTENTION_BEAT_MS;})()`));
verify("34. 換邊等重大轉場不回到三秒", evaluate(`(() => {const m=__off223();m.simulationLog.push({type:"sideChange",presentationImportance:"attention"});m.presentedEventCursor=m.simulationLog.length;return getHighSchoolMatchPlaybackDelay(m)===MATCH_MAJOR_TRANSITION_MS&&MATCH_MAJOR_TRANSITION_MS<3000;})()`));
verify("35. Meaningful Decision 維持完全 pause", evaluate(`(() => {const m=__off223();m.simulationLog.push({type:"meaningfulMomentReached",presentationImportance:"attention",momentId:m.currentMomentId});m.presentedEventCursor=m.simulationLog.length;return isHighSchoolMatchDecisionVisible(m)&&scheduleHighSchoolMatchPlayback(m)===false;})()`));
verify("36. offensive choice metadata 與 before/after 可通過 save normalization", evaluate(`(() => {const m=__off223({runners:["runner-1",null,null]});const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.objective==="advanceRunner");resolveHighSchoolOffensiveDecision(m,c,"mixed");player.highSchoolMatch=m;const r=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return r.completedMoments[0].objective==="advanceRunner"&&r.completedMoments[0].approach&&r.lastOffensiveResolution.before.runners[0]==="runner-1"&&r.lastOffensiveResolution.after.runners[1]==="runner-1";})()`));
verify("37. 玩家可見 Choice 不暴露 internal identifiers", evaluate(`(() => {const m=__off223({runners:["runner-1",null,null]});renderHighSchoolYearOneMatch({title:"秋季交流賽"});const h=document.getElementById("choices").innerHTML;return !["advanceRunner","compactContact","3-6-3","riskProfile","runnerOnFirst"].some(raw=>h.includes(raw));})()`));

console.log(`\nBaseball Match Foundation 2.2.3：${passed}/${passed} 通過`);
