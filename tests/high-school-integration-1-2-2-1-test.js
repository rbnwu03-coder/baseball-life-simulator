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
  const storage = new Map();
  const timers = new Map();
  let nextTimerId = 1;
  const document = {
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
  };
  const context = vm.createContext({
    console, document, module: { exports: {} },
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: {
      setTimeout(callback, delay) { const id = nextTimerId++; timers.set(id, { callback, delay }); return id; },
      clearTimeout(id) { timers.delete(id); }
    },
    __timerCount() { return timers.size; },
    __timerDelays() { return Array.from(timers.values(), timer => timer.delay); },
    __runNextTimer() {
      const next = timers.entries().next().value;
      if (!next) return false;
      const [id, timer] = next;
      timers.delete(id);
      timer.callback();
      return true;
    }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    function __setup1221(role="starter", position="內野手", level=10) {
      stopHighSchoolMatchPlayback();
      pendingYouthSeasonOutcome=null;
      player=createInitialPlayer("1.2.2.1 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,position,position==="內野手"?["外野手"]:[]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode=role;
      player.highSchoolTeamRole=role==="starter"?"先發／關鍵任務":role==="rotation"?"輪替／替補任務":"發展／板凳任務";
      Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=level);
      Object.assign(player,{ballSense:level,observe:level,fitness:level,instinct:level,discipline:level,responsibility:level});
      pendingHighSchoolMatchSimulationSeed=12211;
      const match=prepareHighSchoolYearOneMatch();
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      return match;
    }
    function __resolve1221(decision="zone", sample=0.99) {
      const match=player.highSchoolMatch;
      let safety=0;
      while(!isHighSchoolMatchDecisionVisible(match)&&isHighSchoolMatchPlaybackPhase(match)&&safety++<400) advanceHighSchoolMatchPlaybackStep(match);
      const choice=getHighSchoolYearOneMatchMomentChoices(match).find(item=>item.matchDecision===decision)||getHighSchoolYearOneMatchMomentChoices(match)[0];
      return resolveHighSchoolYearOneMatch(choice.matchDecision,getHighSchoolYearOneMomentId(match),()=>sample);
    }
    function __completedHalf1221(half, scores, phase="moment_1_resolved") {
      const match=__setup1221();
      Object.assign(match,{inning:7,half,offenseTeam:half==="上"?"away":"home",defenseTeam:half==="上"?"home":"away",outs:3,runners:[null,null,null],scores:{...scores},simulationPhase:phase});
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      match.lineScore={away:[0,0,0,0,0,0,scores.away],home:[0,0,0,0,0,scores.home]};
      return match;
    }
    function __settleWithMomentCount1221(count) {
      const match=__setup1221();
      match.completedMoments=Array.from({length:count},(_,index)=>({id:"m"+(index+1),domain:index===1?"defense":"offense",decision:"zone",tier:"mixed",outcome:"完成第 "+(index+1)+" 次任務",consequence:"比賽依實際局面繼續。",scores:{...match.scores},runners:[],outs:0,inning:match.inning,half:match.half}));
      match.playerContribution.mixed=count;
      finishHighSchoolMatchBySimulation(match);
      return match;
    }
    function __drainPlayback1221(match, limit=20) {
      let result=false;
      for(let i=0;i<limit&&!match.completed;i+=1) result=advanceHighSchoolMatchPlaybackStep(match);
      return result;
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

verify("1. 比賽節奏分成流動、注意與重大轉場三種命名常數", evaluate("MATCH_FLOW_BEAT_MS===1000&&MATCH_ATTENTION_BEAT_MS===1700&&MATCH_MAJOR_TRANSITION_MS===1850"));
verify("2. resolved phase 只會建立一個 attention 節點計時器", evaluate(`(() => {const m=__setup1221();__resolve1221();const a=scheduleHighSchoolMatchPlayback(m);const b=scheduleHighSchoolMatchPlayback(m);return a===true&&b===false&&__timerCount()===1&&__timerDelays()[0]===MATCH_ATTENTION_BEAT_MS&&MATCH_ATTENTION_BEAT_MS<MATCH_MAJOR_TRANSITION_MS;})()`));
verify("3. 一次計時器只推進一個呈現／出局／得分／半局節點或停在決策", evaluate(`(() => {const m=__setup1221();__resolve1221();const before={half:m.inning+"-"+m.half,outs:m.outs,score:JSON.stringify(m.scores),runner:m.playerRunnerLocation,cursor:m.presentedEventCursor};scheduleHighSchoolMatchPlayback(m);__runNextTimer();const after=m.inning+"-"+m.half;return m.presentedEventCursor>before.cursor||m.simulationPhase==="moment_2_ready"||before.half!==after||before.outs!==m.outs||before.score!==JSON.stringify(m.scores)||before.runner!==m.playerRunnerLocation;})()`));
verify("4. meaningful decision phase 不排自動播放", evaluate(`(() => {const m=__setup1221();let safety=0;while(!isHighSchoolMatchDecisionVisible(m)&&safety++<300)advanceHighSchoolMatchPlaybackStep(m);stopHighSchoolMatchPlayback();return m.simulationPhase==="moment_1_ready"&&scheduleHighSchoolMatchPlayback(m)===false&&__timerCount()===0;})()`));
verify("5. 結果頁按繼續後只解除阻塞並由單一排程器恢復同場比賽", evaluate(`(() => {const m=__setup1221();__resolve1221();pendingYouthSeasonOutcome={eventId:"high_school_showcase"};const cursor=m.presentedEventCursor;continueYouthSeasonOutcome();return pendingYouthSeasonOutcome===null&&m.presentedEventCursor===cursor&&isHighSchoolMatchPlaybackScheduled()&&__timerCount()===1;})()`));
verify("6. 讀檔會撤銷舊 timer 並只重建一個", evaluate(`(() => {const m=__setup1221();__resolve1221();scheduleHighSchoolMatchPlayback(m);saveGame();loadGame();return __timerCount()===1&&isHighSchoolMatchPlaybackPhase(player.highSchoolMatch);})()`));
verify("7. 終場後不殘留播放 timer", evaluate(`(() => {const m=__completedHalf1221("上",{home:2,away:1});scheduleHighSchoolMatchPlayback(m);for(let i=0;i<10&&__timerCount();i+=1)__runNextTimer();return m.completed&&__timerCount()===0;})()`));
verify("8. 七局上結束且主隊領先時在半局結束 beat 後終場", evaluate(`(() => {const m=__completedHalf1221("上",{home:2,away:1});const first=advanceHighSchoolMatchPlaybackStep(m);const r=__drainPlayback1221(m);return first==="halfInningEnd"&&r==="gameEnd"&&m.completed&&m.half==="終";})()`));
verify("9. 七局上主隊領先時不產生七局下 side change", evaluate(`(() => {const m=__completedHalf1221("上",{home:2,away:1});advanceHighSchoolMatchPlaybackStep(m);return !m.simulationLog.some(e=>e.type==="sideChange"&&e.inning===7&&e.half==="下")&&m.lineScore.home[6]===null;})()`));
verify("10. 七局下結束且非平手時終場", evaluate(`(() => {const m=__completedHalf1221("下",{home:3,away:2});advanceHighSchoolMatchPlaybackStep(m);return __drainPlayback1221(m)==="gameEnd"&&m.completed;})()`));
verify("10a. 七局下客隊領先時同樣終場", evaluate(`(() => {const m=__completedHalf1221("下",{home:2,away:3});advanceHighSchoolMatchPlaybackStep(m);__drainPlayback1221(m);return m.completed&&m.teamResult.includes("球隊落敗");})()`));
verify("11. 七局下再見超前先呈現 walk-off beat 再終場", evaluate(`(() => {const m=__completedHalf1221("下",{home:3,away:2},"moment_3_resolved");m.outs=1;const result=advanceHighSchoolMatchPlaybackStep(m);__drainPlayback1221(m);return result==="walkOff"&&m.completed&&m.simulationLog.some(e=>e.type==="walkOff");})()`));
verify("12. 七局下平手才進入延長賽", evaluate(`(() => {const m=__completedHalf1221("下",{home:2,away:2},"moment_3_resolved");const result=advanceHighSchoolMatchPlaybackStep(m);return result==="halfInningEnd"&&!m.completed&&m.inning===8&&m.half==="上";})()`));
verify("13. 一個關鍵時刻也可合法結算、摘要與存讀", evaluate(`(() => {const m=__settleWithMomentCount1221(1);const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return m.completed&&m.completedMoments.length===1&&m.performanceSummary.includes("一個關鍵時刻")&&restored.completed&&restored.completedMoments.length===1&&restored.performanceSummary===m.performanceSummary;})()`));
verify("14. 兩個關鍵時刻也可合法結算、摘要與存讀", evaluate(`(() => {const m=__settleWithMomentCount1221(2);const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return m.completed&&m.completedMoments.length===2&&m.performanceSummary.includes("兩個關鍵時刻")&&restored.completed&&restored.completedMoments.length===2&&restored.performanceSummary===m.performanceSummary;})()`));
verify("15. 三個關鍵時刻仍可合法結算、摘要與存讀", evaluate(`(() => {const m=__settleWithMomentCount1221(3);const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return m.completed&&m.completedMoments.length===3&&m.performanceSummary.includes("三個關鍵時刻")&&restored.completed&&restored.completedMoments.length===3&&restored.performanceSummary===m.performanceSummary;})()`));
verify("16. Regulation 終場優先於第三個 Moment", evaluate(`(() => {const m=__completedHalf1221("上",{home:4,away:2},"moment_2_resolved");advanceHighSchoolMatchPlaybackStep(m);__drainPlayback1221(m);return m.completed&&m.completedMoments.length===0&&m.currentMomentId==="";})()`));
verify("17. 終場逐局總和維持 authoritative score", evaluate(`(() => {const m=__completedHalf1221("上",{home:2,away:1});advanceHighSchoolMatchPlaybackStep(m);__drainPlayback1221(m);return m.lineScore.home.reduce((a,b)=>a+(b||0),0)===m.scores.home&&m.lineScore.away.reduce((a,b)=>a+(b||0),0)===m.scores.away;})()`));
verify("17a. Auto playback 不覆蓋先前逐局比分", evaluate(`(() => {const m=__setup1221();__resolve1221();const before=JSON.stringify({home:m.lineScore.home.slice(0,m.inning-1),away:m.lineScore.away.slice(0,m.inning-1)});advanceHighSchoolMatchPlaybackStep(m);return before===JSON.stringify({home:m.lineScore.home.slice(0,JSON.parse(before).home.length),away:m.lineScore.away.slice(0,JSON.parse(before).away.length)});})()`));

const observation = parse(`(() => {const m=__setup1221();__resolve1221("zone");advanceHighSchoolMatchSimulation(m);return {phase:m.simulationPhase,truth:m.opponentTacticalTruth,view:getHighSchoolDefensiveObservation(m),html:(renderHighSchoolYearOneMatch({title:"秋季交流賽"}),document.getElementById("story").innerHTML),choices:document.getElementById("choices").innerHTML};})()`);
verify("18. 守備決策保留 hidden opponent tactical truth", observation.phase === "moment_2_ready" && Boolean(observation.truth.code));
verify("19. 玩家只看到打者與跑者腳程分類", observation.view && ["很快", "快", "普通", "慢"].includes(observation.view.batter.speed) && observation.view.runners.every(runner => ["很快", "快", "普通", "慢"].includes(runner.speed)));
verify("20. 守備畫面提供可觀察線索與 Ball Context", observation.view.cues.length >= 2 && observation.html.includes("球來之前的局面") && observation.html.includes("球況："));
verify("21. 守備畫面不洩漏 opponent strategy answer", !["hitAndRun", "earlyBreak", "shortSwing", observation.truth.targetRunnerId, "opponentTacticalTruth"].some(raw => raw && observation.html.includes(raw)));
verify("22. 守備畫面不洩漏 raw simulator identifier", !["away-sim-", "home-sim-", "simulationPhase", "sourceCoachId"].some(raw => observation.html.includes(raw)));
verify("23. 速度參與風險評估但不移除合法選項", evaluate(`(() => {const m=__setup1221();__resolve1221();advanceHighSchoolMatchSimulation(m);m.currentBatter="away-sim-4";m.runners=["away-sim-2","away-sim-3",null];const batter=getHighSchoolMatchSimulationEntity(m,m.currentBatter);batter.speed=1;const before=getHighSchoolDefensiveDecisionContextModifier(m,"challenge");batter.speed=20;const after=getHighSchoolDefensiveDecisionContextModifier(m,"challenge");buildInfieldMeaningfulMoment(m,player);const choices=getHighSchoolDefensiveMomentChoices(m);return before!==after&&choices.length>=2&&choices.some(c=>c.matchDecision==="secure");})()`));
verify("24. 教練席緊鄰決策內容且選項仍在其後", observation.html.lastIndexOf("coach-tactical-box") > observation.html.lastIndexOf("match-observable-information") && observation.choices.includes("<button"));
verify("25. 自動播放畫面不顯示普通半局繼續按鈕", evaluate(`(() => {const m=__setup1221();__resolve1221();renderHighSchoolYearOneMatch({title:"秋季交流賽"});const choices=document.getElementById("choices").innerHTML;return choices.includes("match-playback-status")&&!choices.includes("<button");})()`));

const postMatch = parse(`(() => {const m=__settleWithMomentCount1221(2);renderHighSchoolPostMatchOutcome({text:"完成最後決定"},"");return {story:document.getElementById("story").innerHTML,choices:document.getElementById("choices").innerHTML};})()`);
verify("26. 賽後摘要依序呈現結果、關鍵表現、教練與後續影響", ["outcomeTitle", "postMatchPerformance", "postMatchCoach", "postMatchImpact"].every((token,index,list)=>postMatch.story.indexOf(token)>=0&&(index===0||postMatch.story.indexOf(token)>postMatch.story.indexOf(list[index-1]))));
verify("27. 賽後摘要使用實際 Moment 數量", (postMatch.story.match(/次關鍵回合/g) || []).length === 2);
verify("28. 賽後摘要移除系統／設計語言", !["執行缺口", "場上證據", "個人評估分開記錄", "沒有用最後一次結果抹掉", "simulationPhase", "模擬器"].some(term => postMatch.story.includes(term)));
verify("29. 賽後頁只有單一繼續操作", (postMatch.choices.match(/<button/g) || []).length === 1 && postMatch.choices.includes("繼續"));
verify("30. event settlement guard 阻止重複生涯結算", evaluate(`(() => {const m=__settleWithMomentCount1221(2);const first=applyHighSchoolShowcaseEventSettlement(m,{text:"完成",memory:m.performanceSummary});const step=player.highSchoolStep;const second=applyHighSchoolShowcaseEventSettlement(m,{text:"完成",memory:m.performanceSummary});return first===true&&second===false&&player.highSchoolStep===step;})()`));

verify("31. normalizeSave 保存 hidden truth 與 settlement guard", evaluate(`(() => {const m=__setup1221();m.opponentTacticalTruth={code:"earlyBreak",targetRunnerId:"away-sim-2"};m.eventSettlementApplied=true;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return restored.opponentTacticalTruth.code==="earlyBreak"&&restored.opponentTacticalTruth.targetRunnerId==="away-sim-2"&&restored.eventSettlementApplied===true;})()`));
verify("32. normalized state 與原 state 不共用 tactical truth reference", evaluate(`(() => {const m=__setup1221();m.opponentTacticalTruth={code:"shortSwing",targetRunnerId:"r"};const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;restored.opponentTacticalTruth.code="changed";return m.opponentTacticalTruth.code==="shortSwing";})()`));
verify("33. 正常進場仍由 canonical profile 決定守位與投打", evaluate(`(() => {const m=__setup1221("rotation","捕手");return m.position==="捕手"&&getHighSchoolYearOneMatchPresentation().includes("左右開弓／左投")===false&&player.characterGenesis.completed===true;})()`));
verify("34. Direct Start canonical profile 仍可建立 Year One 比賽", evaluate(`(() => {player=createInitialPlayer("Direct Start");applyDebugBookmarkCharacterProfile(player);settleHighSchoolEntryCapability(player,{originType:"test-fixture"});applyCanonicalPositionProfile(player,"外野手",["一壘手"]);player.chapter="青棒";player.highSchoolStep=5;player.highSchoolRoleCode="starter";const m=prepareHighSchoolYearOneMatch();return player.characterGenesis.completed&&m.position==="外野手"&&m.simulationPhase==="full_match_flow"&&m.inning===1&&m.scores.home===0&&m.scores.away===0;})()`));

console.log(`\nHigh School Integration 1.2.2.1：${passed}/${passed} 通過`);
