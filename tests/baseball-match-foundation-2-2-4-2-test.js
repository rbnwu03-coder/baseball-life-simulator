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
    __captureTimer() { const next = timers.values().next().value; context.__capturedTimer = next?.callback || null; return Boolean(context.__capturedTimer); },
    __runCapturedTimer() { if (!context.__capturedTimer) return false; context.__capturedTimer(); return true; },
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
    function __setup242(seed=22424201) {
      stopHighSchoolMatchPlayback("2.2.4.2-reset"); __clearTimers(); pendingYouthSeasonOutcome=null; isTransitioning=false;
      player=createInitialPlayer();
      document.getElementById("nameInput").value="2.2.4.2 Production Path 球員";
      selectOrigin(PlayerIdentityOptions.origins[1]); selectIdealSelf("棒球理解型");
      pendingGenesisRoll=rollCharacterGenesis(()=>.25);
      pendingGenesisAllocation={ballSense:1,observe:1,fitness:0,batting:0,baseRunning:0,baseballIQ:1};
      selectDevelopmentEntry("highSchoolFullMatch"); selectDevelopmentTestPosition("二壘手");
      pendingHighSchoolMatchSimulationSeed=seed;
      setHighSchoolMatchPlaybackDebugEnabled(true); clearHighSchoolMatchPlaybackTrace();
      createPlayer();
      return player.highSchoolMatch;
    }
    function __choose242(sample=.82) {
      const choice=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch)[0];
      return Boolean(choice)&&chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>sample);
    }
    function __state242(match=player.highSchoolMatch) {
      const d=getHighSchoolMatchPlaybackDebugState(match);
      return {cursor:d.presentedEventCursor,log:d.simulationLogLength,phase:d.playbackPhase,decision:d.decisionActive,
        outcome:d.blockingOutcome,completed:d.matchCompleted,inning:d.inning,half:d.half,outs:d.outs,score:d.score,
        reveal:match.scoreboardRevealHalfIndex,entered:d.playerEnteredGame,paHalf:d.playerHadPlateAppearanceThisHalf};
    }
    function __progress242(before,after) {
      return before.cursor!==after.cursor||before.log!==after.log||before.phase!==after.phase||before.decision!==after.decision
        ||before.outcome!==after.outcome||before.completed!==after.completed||before.inning!==after.inning||before.half!==after.half
        ||before.outs!==after.outs||before.reveal!==after.reveal||before.score.home!==after.score.home||before.score.away!==after.score.away;
    }
    function __autoBeat242() {
      const before=__state242(); const fired=__runNextTimer(); const after=__state242();
      return {fired,before,after,progress:fired&&__progress242(before,after)};
    }
    function __advanceUntil242(predicate,limit=3000) {
      const match=player.highSchoolMatch; let steps=0,noProgress=0;
      while(!predicate(match)&&!match.completed&&steps++<limit) {
        const d=getHighSchoolMatchPlaybackDebugState(match);
        if(d.blockingOutcome) continueYouthSeasonOutcome();
        else if(d.decisionActive) __choose242();
        else {const beat=__autoBeat242();if(!beat.fired)return {ok:false,steps,noProgress,orphan:true};if(!beat.progress)noProgress+=1;}
      }
      return {ok:predicate(match),steps,noProgress,orphan:false};
    }
    function __full242(seed) {
      const match=__setup242(seed); const report={seed,role:match.role,steps:0,decisions:0,agencyChoices:0,outcomes:0,continues:0,noProgress:0,orphan:0,
        visibleAfterEntry:0,entry:false,integrity:0,delays:[],completed:false,traceActions:[]};
      let lastVisible=getHighSchoolPresentedEventCursor(match);
      while(!match.completed&&report.steps++<5000) {
        const d=getHighSchoolMatchPlaybackDebugState(match);
        if(d.blockingOutcome){report.outcomes+=1;continueYouthSeasonOutcome();report.continues+=1;}
        else if(d.decisionActive){report.decisions+=1;if(match.simulationPhase==="offensive_agency_ready")report.agencyChoices+=1;if(!__choose242()){report.orphan+=1;break;}}
        else {
          if(__timerCount()!==1){report.orphan+=1;break;}
          report.delays.push(__timerDelays()[0]); const beat=__autoBeat242();
          if(!beat.progress)report.noProgress+=1;
        }
        if(match.playerEntryCompleted)report.entry=true;
        const visible=getHighSchoolPresentedEventCursor(match);
        if(report.entry&&visible>lastVisible)report.visibleAfterEntry+=1;
        lastVisible=visible;
        if(getHighSchoolMatchStateIntegrityIssues(match).length)report.integrity+=1;
      }
      report.completed=match.completed;report.finalTimer=__timerCount();report.final=__state242();
      report.traceActions=Array.from(new Set(getHighSchoolMatchPlaybackTrace().map(entry=>entry.action)));
      return report;
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

verify("E1. Bench player 第一局未入場且無虛構打席敘述", evaluate(`(() => {const m=__setup242();const p=getHighSchoolMatchPlayerParticipationState(m);const ui=document.getElementById("story").innerHTML;return m.inning===1&&m.playerLineupStatus==="bench"&&!p.playerEnteredGame&&!p.playerHadPlateAppearance&&!/你的打席結束後|你完成打席後|你的攻擊結束後/.test(ui);})()`));
verify("E2. 正式 Player Entry event 發生後 playback 繼續前進", evaluate(`(() => {__setup242();const r=__advanceUntil242(m=>m.playerEntryCompleted);const before=__state242();const beat=__autoBeat242();return r.ok&&r.noProgress===0&&player.highSchoolMatch.simulationLog.some(e=>e.type==="playerEntry")&&beat.fired&&beat.progress&&before.entered;})()`));
verify("E3. 已進場但本半局未 PA 時不顯示虛構 PA 文案", evaluate(`(() => {__setup242();const r=__advanceUntil242(m=>m.inning>=6&&m.half==="上"&&!getHighSchoolMatchPlaybackDebugState(m).decisionActive);showCurrentEvent();const p=getHighSchoolMatchPlayerParticipationState(player.highSchoolMatch);const ui=document.getElementById("story").innerHTML;return r.ok&&p.playerEnteredGame&&!p.playerHadPlateAppearanceThisHalf&&!/你的打席結束後|你完成打席後|你的攻擊結束後/.test(ui);})()`));
verify("E4. Actual player PA 寫入 evidence，Outcome Continue 後恢復 Flow", evaluate(`(() => {__setup242();const r=__advanceUntil242(m=>isHighSchoolMatchDecisionVisible(m)&&m.currentDomain==="offense");const chosen=r.ok&&__choose242();const p=getHighSchoolMatchPlayerParticipationState(player.highSchoolMatch);const blocked=hasBlockingHighSchoolMatchOutcome();continueYouthSeasonOutcome();return chosen&&p.playerHadPlateAppearance&&blocked&&isHighSchoolMatchPlaybackScheduled()&&__timerCount()===1;})()`));
const fullA = parse(`__full242(22424202)`);
const fullB = parse(`__full242(22424201)`);
verify("E5. Post-entry late inning 連續 20+ visible beats 並完成終場", fullA.entry && fullA.visibleAfterEntry >= 20 && fullA.completed && fullA.noProgress === 0);

verify("T1. schedule → fire → valid replacement schedule", evaluate(`(() => {__setup242();const before=getHighSchoolMatchPlaybackDebugState();const beat=__autoBeat242();const after=getHighSchoolMatchPlaybackDebugState();return before.timerScheduled&&beat.progress&&after.timerScheduled&&after.timerGeneration>before.timerGeneration;})()`));
verify("T2. Decision enter 後沒有背景 timer", evaluate(`(() => {__setup242();const r=__advanceUntil242(m=>isHighSchoolMatchDecisionVisible(m));return r.ok&&__timerCount()===0&&!isHighSchoolMatchPlaybackScheduled();})()`));
verify("T3. Decision Outcome → Continue 由新 generation 接手", evaluate(`(() => {__setup242();__advanceUntil242(m=>isHighSchoolMatchDecisionVisible(m));const before=getHighSchoolMatchPlaybackDebugState().activeTimerGeneration;__choose242();const blocked=hasBlockingHighSchoolMatchOutcome();continueYouthSeasonOutcome();const after=getHighSchoolMatchPlaybackDebugState();return blocked&&after.timerScheduled&&after.timerGeneration===after.activeTimerGeneration&&after.activeTimerGeneration>before;})()`));
verify("T4. 舊 generation late callback 安全 abort 且不破壞新 owner", evaluate(`(() => {const m=__setup242();__captureTimer();const old=getHighSchoolMatchPlaybackDebugState().timerGeneration;stopHighSchoolMatchPlayback("stale-fixture");resumeHighSchoolMatchPlayback("replacement",m);const fresh=getHighSchoolMatchPlaybackDebugState().timerGeneration;__runCapturedTimer();const d=getHighSchoolMatchPlaybackDebugState();const aborted=getHighSchoolMatchPlaybackTrace().some(e=>e.action==="callback-aborted"&&e.reason==="stale-generation");return fresh>old&&d.timerScheduled&&d.timerGeneration===fresh&&__timerCount()===1&&aborted;})()`));
verify("T5. Player Entry boundary 後有效 replacement generation 存在", evaluate(`(() => {__setup242();let previous=0;const r=__advanceUntil242(m=>{const d=getHighSchoolMatchPlaybackDebugState(m);previous=d.timerGeneration;return m.playerEntryCompleted;});const d=getHighSchoolMatchPlaybackDebugState();return r.ok&&d.timerScheduled&&d.timerGeneration===d.activeTimerGeneration&&d.timerGeneration>=previous;})()`));
verify("T6. Side Change boundary 後有效 replacement generation 存在", evaluate(`(() => {__setup242();const r=__advanceUntil242(m=>m.simulationLog.some(e=>e.type==="sideChange"));const d=getHighSchoolMatchPlaybackDebugState();return r.ok&&d.timerScheduled&&d.timerGeneration===d.activeTimerGeneration;})()`));
verify("T7. Reload 後由新 runtime generation 重建唯一 owner", evaluate(`(() => {__setup242();__advanceUntil242(m=>m.inning>=5&&m.playerEntryCompleted);const before=getHighSchoolMatchPlaybackDebugState().activeTimerGeneration;saveGame();loadGame();const d=getHighSchoolMatchPlaybackDebugState();return d.matchActive&&d.timerScheduled&&d.timerGeneration===d.activeTimerGeneration&&d.activeTimerGeneration>before&&__timerCount()===1;})()`));

verify("C1. Visible event 每 step 只提交一個 visible beat", evaluate(`(() => {const m=__setup242();const before=m.simulationLog.slice(0,getHighSchoolPresentedEventCursor(m)).filter(isHighSchoolMatchPresentationEventVisible).length;__autoBeat242();const after=m.simulationLog.slice(0,getHighSchoolPresentedEventCursor(m)).filter(isHighSchoolMatchPresentationEventVisible).length;return after-before===1;})()`));
verify("C2. Hidden event 同步跳過並抵達下一個 visible cursor", evaluate(`(() => {const m=__setup242();stopHighSchoolMatchPlayback("cursor-fixture");__clearTimers();m.simulationLog=[];m.presentedEventCursor=0;recordHighSchoolMatchSimulationEvent(m,{type:"metadata",presentationImportance:"hidden",inning:1,half:"上",outs:0,scores:m.scores,runners:m.runners});recordHighSchoolMatchSimulationEvent(m,{type:"plateAppearance",presentationImportance:"flow",inning:1,half:"上",before:{outs:0,scores:m.scores,runners:m.runners},after:{outs:1,scores:m.scores,runners:m.runners}});const e=advanceHighSchoolPresentationCursor(m);return e.type==="plateAppearance"&&m.presentedEventCursor===2;})()`));
verify("C3. Production full run 不接受 no-progress step", fullA.noProgress === 0 && fullB.noProgress === 0);
verify("C4. Continue 不消費 presentation cursor", evaluate(`(() => {__setup242();__advanceUntil242(m=>isHighSchoolMatchDecisionVisible(m));__choose242();const before=getHighSchoolPresentedEventCursor(player.highSchoolMatch);continueYouthSeasonOutcome();return getHighSchoolPresentedEventCursor(player.highSchoolMatch)===before;})()`));
verify("C5. Render 不消費 cursor 且不取得額外 ownership", evaluate(`(() => {__setup242();const before=getHighSchoolMatchPlaybackDebugState();const count=__timerCount();showCurrentEvent();const after=getHighSchoolMatchPlaybackDebugState();return before.cursor===after.cursor&&count===__timerCount()&&before.timerGeneration===after.timerGeneration;})()`));

verify("D1. Production debug snapshot 提供 2.2.4.2 全部欄位", evaluate(`(() => {__setup242();const d=getHighSchoolMatchPlaybackDebugState();return ["matchActive","matchCompleted","inning","half","outs","score","presentedEventCursor","simulationLogLength","nextRawEventType","nextVisibleEventType","playbackPhase","decisionActive","pendingDecisionType","blockingOutcome","pendingOutcomeType","timerHandlePresent","timerScheduledFlag","timerGeneration","activeTimerGeneration","lastScheduledReason","lastTimerClearReason","lastCallbackReason","lastCallbackResult","playerEnteredGame","playerParticipationState","playerHadPlateAppearanceThisHalf","currentEventId","matchEventId"].every(k=>Object.hasOwn(d,k));})()`));
verify("D2. Trace 可區分 schedule／callback／step／render／resume", ["schedule-request", "schedule-created", "callback-fired", "step-start", "step-end", "resume-request", "render"].every(action => fullA.traceActions.includes(action)));
verify("D3. timer handle／flag／generation 維持 atomic valid invariant", evaluate(`(() => {__setup242();for(let i=0;i<20;i+=1){const d=getHighSchoolMatchPlaybackDebugState();if(d.timerHandlePresent!==d.timerScheduledFlag)return false;if(d.timerScheduled&&d.timerGeneration!==d.activeTimerGeneration)return false;if(d.decisionActive||d.blockingOutcome)break;if(!__runNextTimer())return false;}return true;})()`));
verify("D4. 正式 UI 已移除 generic half-inning meta narration", !fs.readFileSync(path.join(root, "script.js"), "utf8").includes("你的打席結束後，球隊仍完成了這個半局") && !fs.readFileSync(path.join(root, "script.js"), "utf8").includes("【比賽推進】"));
verify("D5. timing constants 維持 1000／1700／1850", evaluate(`MATCH_FLOW_BEAT_MS===1000&&MATCH_ATTENTION_BEAT_MS===1700&&MATCH_MAJOR_TRANSITION_MS===1850`));

verify("P1. Production Full Match A：bench → entry → multi Decisions → 終場", fullA.role === "bench" && fullA.completed && fullA.decisions >= 3 && fullA.outcomes + fullA.agencyChoices === fullA.decisions && fullA.orphan === 0 && fullA.integrity === 0 && fullA.finalTimer === 0);
verify("P2. Production Full Match B：不同 seed 同樣無 orphan／no-progress", fullB.seed !== fullA.seed && fullB.role === "bench" && fullB.completed && fullB.noProgress === 0 && fullB.orphan === 0 && fullB.integrity === 0 && fullB.finalTimer === 0);
verify("P3. Production A/B 只使用正式 timing constants", [...fullA.delays, ...fullB.delays].every(delay => [1000, 1700, 1850].includes(delay)));

console.log(`\nBaseball Match Foundation 2.2.4.2：${passed}/${passed} 通過`);
console.log(`Production A：${JSON.stringify(fullA)}`);
console.log(`Production B：${JSON.stringify(fullB)}`);
