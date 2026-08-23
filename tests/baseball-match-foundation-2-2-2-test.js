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
    function __candidate2222({position="一壘手",runners=[null,null,null],outs=0,inning=5,scores={home:1,away:1},ball="hardGrounder",direction="straightAtPlayer",depth,level=8,sample=.99,batterSpeed}={}) {
      const match=__setup2222(position);
      Object.assign(match,{runners:runners.slice(),outs,inning,scores:{...scores}});
      const event=prepareHighSchoolDefensiveMomentFromSimulation(match,{
        ballContextType:ball,
        randomSource:()=>sample,
        situationOverrides:{
          playerPosition:position,ballDirection:direction,
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

verify("1. 空壘一壘手強勁正面球分類為 routine", evaluate(`(() => {const x=__candidate2222();return x.event.type==="playerRoutinePlay"&&x.match.playerEventClassification==="playerRoutinePlay";})()`));
verify("2. routine 不建立 meaningful decision pause", evaluate(`(() => {const x=__candidate2222();advanceHighSchoolPresentationCursor(x.match);return x.match.simulationPhase==="moment_1_resolved"&&!isHighSchoolMatchDecisionVisible(x.match);})()`));
verify("3. routine 不占用三個關鍵 Moment", evaluate(`(() => {const x=__candidate2222();return x.match.completedMoments.length===1&&x.match.completedMoments[0].id===highSchoolYearOneMomentIds[0];})()`));
verify("4. routine 成功由同一 resolver 寫回一個出局", evaluate(`(() => {const x=__candidate2222();return x.event.outsCreated===1&&x.match.outs===1&&x.match.playerContribution.outsCreated===1;})()`));
verify("5. 一壘手正面球走自踩一壘 execution route", evaluate(`(() => __candidate2222().event.executionRoute==="selfCoverFirst")()`));
verify("6. 自踩一壘 commentary 不會固定說傳一壘", evaluate(`(() => {const x=__candidate2222();const t=formatMatchSimulationEvent(x.event,x.match).text;return t.includes("踩上一壘完成出局")&&!t.includes("傳一壘");})()`));
verify("7. routine event 使用 1700ms attention beat", evaluate(`(() => {const x=__candidate2222();x.match.presentedEventCursor=x.match.simulationLog.length;return x.event.presentationImportance==="attention"&&getHighSchoolMatchPlaybackDelay(x.match)===MATCH_ATTENTION_BEAT_MS;})()`));

verify("8. routine 仍可依能力與 RNG 形成守備失誤", evaluate(`(() => {const x=__candidate2222({level:1,sample:0});return x.event.error&&x.event.resultCode==="error"&&x.match.playerContribution.errors===1;})()`));
verify("9. 空壘 routine error 只讓真實打者上一壘", evaluate(`(() => {const x=__candidate2222({level:1,sample:0});return x.match.runners.filter(Boolean).length===1&&x.match.runners[0]===x.event.batterId;})()`));
verify("10. routine error commentary 使用打者姓名且不詢問是否接穩", evaluate(`(() => {const x=__candidate2222({level:1,sample:0});const t=formatMatchSimulationEvent(x.event,x.match).text;const name=getHighSchoolMatchSimulationEntityName(x.match,x.event.batterId);return t.includes(name)&&t.includes("安全上一壘")&&!t.includes("你要不要");})()`));
verify("11. routine 保留同一份 player.highSchoolMatch reference", evaluate(`(() => {const x=__candidate2222();return player.highSchoolMatch===x.match;})()`));
verify("12. routine 打序在結果後前進一棒", evaluate(`(() => {const m=__setup2222();const before=m.battingOrderIndex.away;prepareHighSchoolDefensiveMomentFromSimulation(m,{ballContextType:"hardGrounder",randomSource:()=>.99,situationOverrides:{playerPosition:"一壘手",ballDirection:"straightAtPlayer",playerCapabilities:{fielding:9,reaction:9,range:9,arm:9,throwing:9,decision:9}}});return m.battingOrderIndex.away===(before+1)%9;})()`));

verify("13. 空壘慢滾球加快腿打者仍是 routine", evaluate(`(() => __candidate2222({ball:"slowGrounder",direction:"lineSide",batterSpeed:9}).event.type==="playerRoutinePlay")()`));
verify("14. 一壘手遠離壘包的慢滾球只走投手補位 execution", evaluate(`(() => __candidate2222({ball:"slowGrounder",direction:"lineSide",batterSpeed:9}).event.executionRoute==="pitcherCoverFirst")()`));
verify("15. 空壘深處滾地球的控球 route 不會偽裝成 meaningful objective", evaluate(`(() => {const x=__candidate2222({position:"游擊手",ball:"deepGrounder",direction:"towardHole",depth:"deep"});return x.event.type==="playerRoutinePlay"&&x.match.decisionGate.meaningfulChoiceCount===1;})()`));
verify("16. execution-only 控球選項具明確 metadata", evaluate(`(() => {const m=__setup2222();m.momentIndex=1;setHighSchoolDefensiveBallContext(m,"hardGrounder");buildInfieldMeaningfulMoment(m,player,{playerPosition:"一壘手",ballDirection:"straightAtPlayer"});const c=generateInfieldLegalChoices(m.defensiveSituation,m).find(x=>x.infieldRoute==="controlledNoThrow");return c.objective==="controlBall"&&c.baseballValue==="executionOnly"&&c.executionOnly;})()`));

verify("17. 游擊手一壘有人一出局建立 meaningful decision", evaluate(`(() => {const x=__candidate2222({position:"游擊手",runners:["away-sim-4",null,null],outs:1,ball:"normalGrounder",direction:"straightAtPlayer"});return x.event.type==="meaningfulMomentReached"&&x.match.playerEventClassification==="playerMeaningfulDecision";})()`));
verify("18. 雙殺情境至少有 secureOut 與 attemptDoublePlay 兩種目標", evaluate(`(() => {const x=__candidate2222({position:"游擊手",runners:["away-sim-4",null,null],outs:1,ball:"normalGrounder",direction:"straightAtPlayer"});const o=x.match.decisionGate.objectives;return o.includes("secureOut")&&o.includes("attemptDoublePlay");})()`));
verify("19. 雙殺情境 legal choice metadata 包含風險與棒球價值", evaluate(`(() => {const x=__candidate2222({position:"游擊手",runners:["away-sim-4",null,null],outs:1,ball:"normalGrounder",direction:"straightAtPlayer"});return x.choices.every(c=>c.objective&&c.risk&&c.baseballValue);})()`));
verify("20. 雙殺情境 tension 為 high", evaluate(`(() => __candidate2222({position:"游擊手",runners:["away-sim-4",null,null],outs:1,ball:"normalGrounder",direction:"straightAtPlayer"}).match.decisionTension==="high")()`));

verify("21. 三壘手三壘有人一出局平手時建立 decision", evaluate(`(() => {const x=__candidate2222({position:"三壘手",runners:[null,null,"away-sim-4"],outs:1,inning:7,scores:{home:2,away:2},ball:"slowGrounder",direction:"lineSide"});return x.event.type==="meaningfulMomentReached";})()`));
verify("22. 三壘高張力局面提供防止得分與先拿出局兩種目標", evaluate(`(() => {const x=__candidate2222({position:"三壘手",runners:[null,null,"away-sim-4"],outs:1,inning:7,scores:{home:2,away:2},ball:"slowGrounder",direction:"lineSide"});const o=x.match.decisionGate.objectives;return o.includes("preventRun")&&o.includes("secureOut")&&x.match.decisionTension==="high";})()`));
verify("23. 滿壘情境保留防本壘與其他合法出局價值", evaluate(`(() => {const x=__candidate2222({position:"三壘手",runners:["away-sim-2","away-sim-3","away-sim-4"],outs:1,ball:"hardGrounder",direction:"straightAtPlayer"});return x.event.type==="meaningfulMomentReached"&&x.choices.some(c=>c.objective==="preventRun")&&x.choices.some(c=>c.objective==="attemptDoublePlay");})()`));
verify("24. 能力高低不決定 agency gate", evaluate(`(() => {const a=__candidate2222({position:"游擊手",runners:["away-sim-4",null,null],outs:1,level:1,ball:"normalGrounder"});const b=__candidate2222({position:"游擊手",runners:["away-sim-4",null,null],outs:1,level:10,ball:"normalGrounder"});return a.match.playerEventClassification===b.match.playerEventClassification&&a.match.decisionGate.objectives.join()===b.match.decisionGate.objectives.join();})()`));
verify("25. 玩家未參與時共用分類為 ordinaryPlay", evaluate(`classifyPositionFamilyPlay({},[],false).eventClassification==="ordinaryPlay"`));

verify("26. 同半局 routine 後不會每棒重複攔停", evaluate(`(() => {const x=__candidate2222();x.match.outs=1;x.match.runners=[null,null,null];return !shouldReachHighSchoolDefensiveMoment(x.match);})()`));
verify("27. 同半局若後來形成真正壓力仍可進入 gate", evaluate(`(() => {const x=__candidate2222();x.match.outs=1;x.match.runners=["away-sim-5","away-sim-6",null];return shouldReachHighSchoolDefensiveMoment(x.match);})()`));
verify("28. 下一個守備半局可再次出現一次 player involvement", evaluate(`(() => {const x=__candidate2222();x.match.inning+=1;x.match.half="上";x.match.outs=0;x.match.runners=[null,null,null];return shouldReachHighSchoolDefensiveMoment(x.match);})()`));

verify("29. flow UI 有 match-flow-mode 且不顯示決策按鈕", evaluate(`(() => {const m=__setup2222();renderHighSchoolYearOneMatch({title:"秋季交流賽"});const s=document.getElementById("story").innerHTML;const c=document.getElementById("choices").innerHTML;return s.includes("match-flow-mode")&&s.includes("matchCurrentBatterTitle")&&c.includes("match-playback-status")&&!c.includes("<button");})()`));
verify("30. flow UI 目前打者顯示棒次、姓名與打擊側", evaluate(`(() => {const m=__setup2222();renderHighSchoolYearOneMatch({title:"秋季交流賽"});const h=document.getElementById("story").innerHTML;const b=getHighSchoolMatchPresentation(m).currentSituation.currentBatter;return h.includes("第"+b.battingOrderNumber+"棒｜"+b.name)&&h.includes(b.handedness);})()`));
verify("31. decision UI 有 match-decision-mode 與真實選項", evaluate(`(() => {const x=__candidate2222({position:"游擊手",runners:["away-sim-4",null,null],outs:1,ball:"normalGrounder"});advanceHighSchoolPresentationCursor(x.match);renderHighSchoolYearOneMatch({title:"秋季交流賽"});return document.getElementById("story").innerHTML.includes("match-decision-mode")&&document.getElementById("choices").innerHTML.includes("match-player-decisions");})()`));
verify("32. flow UI 仍以記分板、局勢、出局、壘況與 recent feed 為主", evaluate(`(() => {const m=__setup2222();renderHighSchoolYearOneMatch({title:"秋季交流賽"});const h=document.getElementById("story").innerHTML;return ["match-scoreboard","match-live-situation","OUT","match-live-feed","match-current-batter"].every(x=>h.includes(x));})()`));

verify("33. routine presentation snapshot 保留結果後目前打者", evaluate(`(() => {const x=__candidate2222();const next=getHighSchoolMatchLineupBatter(x.match,"away");return x.event.presentationSnapshot.currentBatter===next.id&&x.event.presentationSnapshot.battingOrderSlot===x.match.battingOrderIndex.away;})()`));
verify("34. routine save/reload 保留 gate、事件分類與目前打者 snapshot", evaluate(`(() => {const x=__candidate2222();player.highSchoolMatch=x.match;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;const e=restored.simulationLog.find(v=>v.type==="playerRoutinePlay");return restored.playerEventClassification==="playerRoutinePlay"&&restored.decisionGate.meaningfulChoiceCount===1&&e.presentationSnapshot.currentBatter===x.event.presentationSnapshot.currentBatter;})()`));
verify("35. position family contract 公開 classify adapter", evaluate(`typeof getPositionDecisionFamily("infield").classify==="function"`));
verify("36. full match 仍完成三個關鍵 Moment", evaluate(`(() => {const x=__finish2222();return x.match.completed&&x.match.completedMoments.length===3&&x.safety<1400;})()`));
verify("37. full match 全程維持 game-state invariant", evaluate(`(() => {const x=__finish2222(88222);return x.match.completed&&getHighSchoolMatchStateIntegrityIssues(x.match).length===0;})()`));
verify("38. 玩家可見 routine commentary 不含 raw identifier", evaluate(`(() => {const x=__candidate2222();const t=formatMatchSimulationEvent(x.event,x.match).text;return !["hardGrounder","straightAtPlayer","playerRoutinePlay","selfCoverFirst","decisionTension"].some(raw=>t.includes(raw));})()`));

console.log(`\nBaseball Match Foundation 2.2.2：${passed}/${passed} 通過`);
