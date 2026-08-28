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
  const storage = new Map();
  const timers = new Map();
  let nextTimerId = 1;
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
    __clearTimers() { timers.clear(); },
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
    function __setup241(seed=224101, position="內野手") {
      stopHighSchoolMatchPlayback(); __clearTimers(); pendingYouthSeasonOutcome=null; isTransitioning=false;
      player=createInitialPlayer("2.2.4.1 整合測試球員");
      applyDebugBookmarkCharacterProfile(player); settleHighSchoolEntryCapability(player,{originType:"test-fixture"}); applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
      Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=9);
      Object.assign(player,{ballSense:9,observe:9,fitness:9,instinct:9,discipline:9,responsibility:9});
      pendingHighSchoolMatchPositionOverride=position; pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      showCurrentEvent();
      resumeHighSchoolMatchPlayback("2.2.4.1-test-start",match);
      return match;
    }
    function __off241({runners=[null,null,null],outs=1,scores={home:2,away:2}}={}) {
      const match=__setup241(); stopHighSchoolMatchPlayback(); __clearTimers();
      Object.assign(match,{inning:5,half:"下",offenseTeam:"home",defenseTeam:"away",outs,runners:runners.slice(),scores:{...scores},
        momentIndex:0,currentMomentId:highSchoolYearOneMomentIds[0],currentDomain:"offense",simulationPhase:"moment_1_ready",
        completed:false,settled:false,completedMoments:[],decision:"",outcome:"",consequence:""});
      match.presentedEventCursor=match.simulationLog.length; syncHighSchoolMatchPlayerRunnerLocation(match); setHighSchoolCoachTacticalDirection(match);
      return match;
    }
    function __meaning241(before,after,paResult,runnerChanges,scoringRunnerIds=[]) {
      const meaning=deriveHighSchoolOffensiveBaseballMeaning({before,after,paResult,runnerChanges,scoringRunnerIds});
      const text=formatHighSchoolOffensivePlayerFacingResult({approach:"compactContact"},paResult,meaning);
      return {meaning,text};
    }
    function __resolveGrounder241(match,choice) {
      return resolveHighSchoolOffensiveDecision(match,choice,null,{plateAppearance:{
        pitchSequence:[{pitchLocationClass:"chasePitch"}],
        pitchOptions:[{recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,outcomeRoll:.4}]
      }});
    }
    function __runUntilDecision241(limit=500) {
      let steps=0;
      while(!isHighSchoolMatchDecisionVisible(player.highSchoolMatch)&&!player.highSchoolMatch.completed&&steps++<limit) {
        if(!__runNextTimer()) return false;
      }
      return isHighSchoolMatchDecisionVisible(player.highSchoolMatch);
    }
    function __chooseVisible241(sample=.8) {
      const match=player.highSchoolMatch;
      const choice=getHighSchoolYearOneMatchMomentChoices(match)[0];
      return Boolean(choice)&&chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>sample);
    }
    function __visibleCount241(match) {
      return match.simulationLog.slice(0,getHighSchoolPresentedEventCursor(match)).filter(isHighSchoolMatchPresentationEventVisible).length;
    }
    function __fullMatch241(seed) {
      const match=__setup241(seed,"二壘手");
      const report={seed,steps:0,decisions:0,offense:0,defense:0,outcomes:0,continues:0,orphan:0,duplicateTimers:0,
        hiddenPlayback:0,doubleVisibleAdvance:0,integrityErrors:0,continueCursorMoves:0,completed:false,innings:0};
      while(!match.completed&&report.steps++<5000) {
        const debug=getHighSchoolMatchPlaybackDebugState(match);
        if(debug.blockingOutcome) {
          const cursor=debug.cursor; report.outcomes+=1; continueYouthSeasonOutcome(); report.continues+=1;
          if(getHighSchoolPresentedEventCursor(match)!==cursor) report.continueCursorMoves+=1;
          if(__timerCount()!==1&&!match.completed) report.orphan+=1;
        } else if(debug.decisionActive) {
          report.decisions+=1; if(match.currentDomain==="offense") report.offense+=1; if(match.currentDomain==="defense") report.defense+=1;
          if(__timerCount()) report.hiddenPlayback+=1;
          if(!__chooseVisible241(.82)) { report.orphan+=1; break; }
          if(!hasBlockingHighSchoolMatchOutcome()||__timerCount()) report.hiddenPlayback+=1;
        } else if(__timerCount()) {
          if(__timerCount()>1) report.duplicateTimers+=1;
          const visibleBefore=__visibleCount241(match); __runNextTimer();
          if(__visibleCount241(match)-visibleBefore>1) report.doubleVisibleAdvance+=1;
        } else {
          report.orphan+=1; break;
        }
        if(getHighSchoolMatchStateIntegrityIssues(match).length) report.integrityErrors+=1;
      }
      report.completed=match.completed; report.innings=match.inning;
      return report;
    }
    function __halfTransition241() {
      const match=__setup241(224106); stopHighSchoolMatchPlayback(); __clearTimers();
      Object.assign(match,{inning:3,half:"上",offenseTeam:"away",defenseTeam:"home",outs:3,runners:[null,null,null],simulationPhase:"full_match_flow"});
      match.simulationLog=[]; match.presentedEventCursor=0; match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(3,"上");
      ensureMatchPlaybackLiveness("half-transition-test",match);
      const seen=[];
      for(let i=0;i<10&&__timerCount();i+=1){__runNextTimer();seen.push(getHighSchoolPresentedEvent(match)?.type||"");if(match.half==="下"&&match.outs<3&&match.simulationLog.some(e=>e.type==="plateAppearance"))break;}
      return {match,seen,timer:__timerCount()};
    }
    function __fallback241() {
      const match=__setup241(224109,"二壘手"); stopHighSchoolMatchPlayback(); __clearTimers();
      Object.assign(match,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:1,runners:["r1","r2","r3"],scores:{home:2,away:2},
        simulationPhase:"moment_2_ready",momentIndex:1,currentMomentId:highSchoolYearOneMomentIds[1],currentDomain:"defense",completed:false,
        position:"內野手",developmentPositionOverride:"二壘手",currentFieldingPosition:"二壘手",playerEntryCompleted:true,playerLineupStatus:"starter"});
      match.battingOrderIndex.away=2; match.currentBatter=getHighSchoolMatchLineupBatter(match,"away").id;
      setHighSchoolDefensiveBallContext(match,"normalGrounder");
      buildInfieldMeaningfulMoment(match,player,{playerPosition:"二壘手",primaryFielderPosition:"二壘手",ballDirection:"straightAtPlayer",batterSpeed:5,
        runnerSpeeds:[6,6,6],playerCapabilities:{fielding:9,reaction:9,range:9,arm:9,throwing:9,decision:9},executionChange:"bobble",
        routeWindowOverrides:{firstBaseOutWindow:"narrow",doublePlayWindow:"wide",homeOutWindow:"wide"}});
      recordHighSchoolMatchSimulationEvent(match,{type:"meaningfulMomentReached",presentationImportance:"attention",momentId:match.currentMomentId,
        domain:"defense",inning:match.inning,half:match.half,outs:match.outs,scores:match.scores,runners:match.runners,assignment:"二壘守備決策"});
      match.presentedEventCursor=match.simulationLog.length;
      const choice=getHighSchoolDefensiveMomentChoices(match).find(item=>item.matchDecision==="challenge");
      const accepted=Boolean(choice)&&chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>.8);
      const fallback=match.lastDefensiveResolution?.fallbackRoute||""; const reassessed=match.lastDefensiveResolution?.reassessed===true;
      if(pendingYouthSeasonOutcome) continueYouthSeasonOutcome();
      return {accepted,fallback,reassessed,timer:isHighSchoolMatchPlaybackScheduled(),pending:Boolean(pendingYouthSeasonOutcome)};
    }
    function __stateTable241() {
      const rows=[];
      for(const completed of [false,true]) for(const decision of [false,true]) for(const outcome of [false,true]) for(const timer of [false,true]) {
        const match=__setup241(224120+(completed?8:0)+(decision?4:0)+(outcome?2:0)+(timer?1:0)); stopHighSchoolMatchPlayback(); __clearTimers();
        if(decision){let guard=0;while(!isHighSchoolMatchDecisionVisible(match)&&guard++<500)advanceHighSchoolMatchPlaybackStep(match);}
        if(timer) scheduleHighSchoolMatchPlayback(match);
        if(outcome) pendingYouthSeasonOutcome={eventId:"high_school_showcase"};
        if(completed) match.completed=true;
        ensureMatchPlaybackLiveness("state-table",match);
        const scheduled=isHighSchoolMatchPlaybackScheduled();
        const expected=!completed&&!decision&&!outcome;
        rows.push({completed,decision,outcome,timer,scheduled,expected,pass:scheduled===expected});
        pendingYouthSeasonOutcome=null; stopHighSchoolMatchPlayback(); __clearTimers();
      }
      return rows;
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

verify("A1. 空壘 ground out 只說明打者出局與壘上無人", evaluate(`(() => {const m=__off241();const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="advance");const r=__resolveGrounder241(m,c);const text=r.outcome+r.consequence;return text.includes("打者出局")&&text.includes("壘上無人")&&!text.includes("跑者推進")&&!text.includes("原有跑者")&&!text.includes("預設文案")&&!text.includes("虛構");})()`));
verify("A2. 真有一壘跑者未動時才生成留在原壘", evaluate(`(() => {const x=__meaning241({outs:0,runners:["r1",null,null],scores:{home:0,away:0}},{outs:1,runners:["r1",null,null],scores:{home:0,away:0}},"out",[{runnerId:"r1",from:1,to:1},{runnerId:"b",from:"batter",to:"out"}]);return x.meaning.runnersHeld.length===1&&x.text.consequence.includes("一壘跑者留在原壘");})()`));
verify("A3. 二壘到三壘由 runnerChanges 生成明確推進", evaluate(`(() => {const x=__meaning241({outs:0,runners:[null,"r2",null],scores:{home:0,away:0}},{outs:1,runners:[null,null,"r2"],scores:{home:0,away:0}},"productiveOut",[{runnerId:"r2",from:2,to:3},{runnerId:"b",from:"batter",to:"out"}]);return x.meaning.runnersAdvanced.length===1&&x.text.consequence.includes("二壘跑者推進到三壘");})()`));
verify("A4. 三壘回本壘由真實得分變化生成", evaluate(`(() => {const x=__meaning241({outs:0,runners:[null,null,"r3"],scores:{home:0,away:0}},{outs:1,runners:[null,null,null],scores:{home:1,away:0}},"productiveOut",[{runnerId:"r3",from:3,to:"home"},{runnerId:"b",from:"batter",to:"out"}],["r3"]);return x.meaning.runnersScored.length===1&&x.meaning.runsScored===1&&x.text.consequence.includes("三壘跑者回到本壘得分");})()`));
verify("A5. 空壘非法推進意圖遭拒且正式畫面不洩漏工程詞", evaluate(`(() => {const m=__off241();const base=buildOffensiveDecisionChoices(m)[0];const illegal={...base,objective:"advanceRunner",requirements:[]};const before=JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,moments:m.completedMoments});const rejected=resolveHighSchoolOffensiveDecision(m,illegal,"mixed")===false;renderHighSchoolYearOneMatch({title:"秋季交流賽"});const ui=document.getElementById("story").innerHTML+document.getElementById("choices").innerHTML;return rejected&&before===JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,moments:m.completedMoments})&&!/[Ii]nvariant|illegal|injected|resolver|stale choice/.test(ui);})()`));
verify("A6. machine meaning 與玩家 formatter 為兩個 pure boundary", evaluate(`typeof deriveHighSchoolOffensiveBaseballMeaning==="function"&&typeof formatHighSchoolOffensivePlayerFacingResult==="function"`));
verify("A7. Choice objective 不會覆寫空壘實際結果", evaluate(`(() => {const x=__meaning241({outs:0,runners:[null,null,null],scores:{home:0,away:0}},{outs:1,runners:[null,null,null],scores:{home:0,away:0}},"productiveOut",[{runnerId:"b",from:"batter",to:"out"}]);return x.meaning.basesEmptyAfter&&x.text.consequence==="打者出局；壘上無人。";})()`));

verify("B1. active flow 由 liveness guard 排一個下一步", evaluate(`(() => {__setup241();return isHighSchoolMatchPlaybackScheduled()&&__timerCount()===1;})()`));
verify("B2. liveness guard 連呼叫仍只有一個 timer", evaluate(`(() => {const m=__setup241();ensureMatchPlaybackLiveness("a",m);ensureMatchPlaybackLiveness("b",m);ensureMatchPlaybackLiveness("c",m);return __timerCount()===1;})()`));
verify("B3. Decision 顯示時 timer 完全停止", evaluate(`(() => {__setup241();const reached=__runUntilDecision241();return reached&&getHighSchoolMatchPlaybackDebugState().decisionActive&&!isHighSchoolMatchPlaybackScheduled()&&__timerCount()===0;})()`));
verify("B4. Outcome overlay 阻塞自動播放", evaluate(`(() => {__setup241();__runUntilDecision241();__chooseVisible241();ensureMatchPlaybackLiveness("blocked");return hasBlockingHighSchoolMatchOutcome()&&!isHighSchoolMatchPlaybackScheduled()&&__timerCount()===0;})()`));
verify("B5. Continue 不推 cursor 並把 ownership 還給 scheduler", evaluate(`(() => {__setup241();__runUntilDecision241();__chooseVisible241();const cursor=getHighSchoolPresentedEventCursor(player.highSchoolMatch);continueYouthSeasonOutcome();return !pendingYouthSeasonOutcome&&getHighSchoolPresentedEventCursor(player.highSchoolMatch)===cursor&&isHighSchoolMatchPlaybackScheduled()&&__timerCount()===1;})()`));
verify("B6. 半局結束、換邊後自動進入下一個打席", evaluate(`(() => {const x=__halfTransition241();return x.seen.includes("halfInningEnd")&&x.seen.includes("sideChange")&&x.match.half==="下"&&x.match.simulationLog.some(e=>e.type==="plateAppearance")&&x.timer===1;})()`));
verify("B7. 進攻 Decision 後可連續回到 Flow", evaluate(`(() => {const r=__fullMatch241(224171);return r.offense>=1&&r.continues>=1&&r.completed&&r.orphan===0&&r.continueCursorMoves===0;})()`));
verify("B8. 二壘守備 Decision 後可回到 Flow", evaluate(`(() => {const r=__fullMatch241(224181);return r.defense>=1&&r.completed&&r.orphan===0&&r.hiddenPlayback===0;})()`));
verify("B9. 動態 fallback 結果 Continue 後恢復排程", evaluate(`(() => {const r=__fallback241();return r.accepted&&r.reassessed&&Boolean(r.fallback)&&!r.pending&&r.timer;})()`));
verify("B10. active match 讀檔不保存 timer 並重建唯一排程", evaluate(`(() => {const m=__setup241(224110);const cursor=m.presentedEventCursor,log=m.simulationLog.length;saveGame();loadGame();const d=getHighSchoolMatchPlaybackDebugState();return d.cursor===cursor&&d.logLength===log&&d.timerScheduled&&__timerCount()===1;})()`));
verify("B11. timer delay 常數維持 1000／1700／1850", evaluate(`MATCH_FLOW_BEAT_MS===1000&&MATCH_ATTENTION_BEAT_MS===1700&&MATCH_MAJOR_TRANSITION_MS===1850`));
verify("B12. Debug state 提供完整 liveness 可觀察欄位", evaluate(`(() => {__setup241();const d=getHighSchoolMatchPlaybackDebugState();return ["matchActive","completed","cursor","logLength","phase","decisionActive","blockingOutcome","timerScheduled","nextVisibleEventType"].every(k=>Object.hasOwn(d,k));})()`));
verify("B13. 16 組 completed／decision／outcome／timer 狀態表全部合法", evaluate(`__stateTable241().length===16&&__stateTable241().every(row=>row.pass)`));

const fullA = parse(`__fullMatch241(224191)`);
const fullB = parse(`__fullMatch241(224192)`);
verify("C1. Full Match A 從首打席跑到終場", fullA.completed && fullA.innings >= 7 && fullA.offense >= 1 && fullA.orphan === 0);
verify("C2. Full Match A 無重複 timer、背景決策續播或雙 visible advance", fullA.duplicateTimers === 0 && fullA.hiddenPlayback === 0 && fullA.doubleVisibleAdvance === 0 && fullA.continueCursorMoves === 0);
verify("C3. Full Match A 全程 runner／game state integrity 正常", fullA.integrityErrors === 0);
verify("C4. Full Match B 使用不同 seed 跑到終場", fullB.seed !== fullA.seed && fullB.completed && fullB.innings >= 7 && fullB.offense >= 1 && fullB.orphan === 0);
verify("C5. Full Match B 無重複 timer、背景決策續播或雙 visible advance", fullB.duplicateTimers === 0 && fullB.hiddenPlayback === 0 && fullB.doubleVisibleAdvance === 0 && fullB.continueCursorMoves === 0);
verify("C6. Full Match B 全程 runner／game state integrity 正常", fullB.integrityErrors === 0);

console.log(`\nBaseball Match Foundation 2.2.4.1：${passed}/${passed} 通過`);
console.log(`Full Match A：${JSON.stringify(fullA)}`);
console.log(`Full Match B：${JSON.stringify(fullB)}`);
