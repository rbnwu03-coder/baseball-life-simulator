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
    function __setup1222(role="bench", level=10, revealCurrent=false) {
      stopHighSchoolMatchPlayback();
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      player=createInitialPlayer("1.2.2.2 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode=role;
      player.highSchoolTeamRole=role==="starter"?"先發／關鍵任務":role==="rotation"?"輪替／替補任務":"發展／板凳任務";
      Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=level);
      Object.assign(player,{ballSense:level,observe:level,fitness:level,instinct:level,discipline:level,responsibility:level});
      pendingHighSchoolMatchSimulationSeed=12222;
      const match=prepareHighSchoolYearOneMatch();
      if(revealCurrent) match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      return match;
    }
    function __resolve1222(decision="zone", sample=0.99) {
      const match=player.highSchoolMatch;
      let safety=0;
      while(!isHighSchoolMatchDecisionVisible(match)&&isHighSchoolMatchPlaybackPhase(match)&&safety++<400) advanceHighSchoolMatchPlaybackStep(match);
      const choices=getHighSchoolYearOneMatchMomentChoices(match);
      const choice=choices.find(item=>item.matchDecision===decision)||choices[0];
      return choice ? resolveHighSchoolYearOneMatch(choice.matchDecision,getHighSchoolYearOneMomentId(match),()=>sample) : false;
    }
    function __reachDefense1222() {
      const match=__setup1222("starter",10,true);
      __resolve1222("zone");
      advanceHighSchoolMatchSimulation(match);
      return match;
    }
    function __reachFinalOffense1222() {
      const match=__reachDefense1222();
      __resolve1222("secure");
      advanceHighSchoolMatchSimulation(match);
      return match;
    }
    function __complete1222() {
      const match=__setup1222("starter",10,true);
      let safety=0;
      while(!match.completed&&safety<20){
        const choice=getHighSchoolYearOneMatchMomentChoices(match)[0];
        if(choice) resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>0.99);
        advanceHighSchoolMatchSimulation(match);
        safety+=1;
      }
      return match;
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

verify("1. authoritative match 只新增 presentation reveal cursor，不建立第二份比分", evaluate(`(() => {const m=__setup1222();return m.scoreboardRevealHalfIndex===0&&m.presentationScore===undefined&&m.presentationMatchState===undefined;})()`));
verify("2. 初始畫面從一局上開始，當前格為省略號、未來格為破折號", evaluate(`(() => {const m=__setup1222();const v=getHighSchoolMatchPresentation(m);return v.currentSituation.inning===1&&v.currentSituation.half==="上"&&v.scoreboard.away.cells[0]==="…"&&v.scoreboard.home.cells[0]===null&&v.scoreboard.away.cells.slice(1).every(x=>x===null);})()`));
verify("3. 開場 playback tick 只提交一個 live event，不預揭露半局比分", evaluate(`(() => {const m=__setup1222();const before=m.scoreboardRevealHalfIndex;const result=advanceHighSchoolMatchPlaybackStep(m);return Boolean(result)&&m.scoreboardRevealHalfIndex===before&&m.presentedEventCursor===m.simulationLog.length;})()`));
verify("4. reveal 期間 R 只加總已揭露半局", evaluate(`(() => {const m=__setup1222();m.scoreboardRevealHalfIndex=2;const v=getHighSchoolMatchPresentation(m);return v.scoreboard.away.visibleTotal===(m.lineScore.away[0]||0)&&v.scoreboard.home.visibleTotal===(m.lineScore.home[0]||0)&&v.scoreboard.away.visibleTotal<=m.scores.away&&v.scoreboard.home.visibleTotal<=m.scores.home;})()`));
verify("5. 追上 authoritative half 後仍以省略號標示進行中，並顯示已發生分數", evaluate(`(() => {const m=__setup1222();m.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(m.inning,m.half);const v=getHighSchoolMatchPresentation(m);return v.scoreboard.away.cells[m.inning-1]==="…"&&v.scoreboard.home.cells[m.inning-1]===null&&v.scoreboard.home.visibleTotal===m.scores.home&&v.scoreboard.away.visibleTotal===m.scores.away;})()`));
verify("6. 玩家決策 phase 會暫停 timer、feed 與記分板游標", evaluate(`(() => {const m=__setup1222("bench",10,true);let safety=0;while(!isHighSchoolMatchDecisionVisible(m)&&safety++<400)advanceHighSchoolMatchPlaybackStep(m);const before=JSON.stringify(m);return scheduleHighSchoolMatchPlayback(m)===false&&__timerCount()===0&&JSON.stringify(m)===before;})()`));
verify("7. reveal playback 使用唯一 major-transition timer，觸發後游標只前進一次", evaluate(`(() => {const m=__setup1222();Object.assign(m,{inning:2,half:"上",offenseTeam:"away",defenseTeam:"home"});m.lineScore={away:[0],home:[0]};m.scoreboardRevealHalfIndex=0;const ok=scheduleHighSchoolMatchPlayback(m);const delays=__timerDelays();const before=m.scoreboardRevealHalfIndex;__runNextTimer();return ok&&delays.length===1&&delays[0]===MATCH_MAJOR_TRANSITION_MS&&MATCH_MAJOR_TRANSITION_MS<3000&&m.scoreboardRevealHalfIndex===before+1;})()`));
verify("8. save/load 保留 reveal cursor，且只恢復一個 timer", evaluate(`(() => {const m=__setup1222();Object.assign(m,{inning:2,half:"上",offenseTeam:"away",defenseTeam:"home"});m.lineScore={away:[0],home:[0]};m.scoreboardRevealHalfIndex=1;saveGame();loadGame();return player.highSchoolMatch.scoreboardRevealHalfIndex===1&&__timerCount()===1;})()`));
verify("9. reload 後下一 tick 不重播 simulation event 或比分", evaluate(`(() => {const m=__setup1222();Object.assign(m,{inning:2,half:"上",offenseTeam:"away",defenseTeam:"home"});m.lineScore={away:[0],home:[0]};m.scoreboardRevealHalfIndex=1;const log=m.simulationLog.length;const scores=JSON.stringify(m.scores);saveGame();loadGame();__runNextTimer();return player.highSchoolMatch.scoreboardRevealHalfIndex===2&&player.highSchoolMatch.simulationLog.length===log&&JSON.stringify(player.highSchoolMatch.scores)===scores;})()`));
verify("10. 延長賽仍使用相同 reveal cursor 與第八局 current cell", evaluate(`(() => {const m=__setup1222("starter",10,true);m.inning=8;m.half="上";m.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(8,"上");m.lineScore.away.push(0,0,0,0,0);m.lineScore.home.push(0,0,0,0,0);recordHighSchoolMatchSimulationEvent(m,{type:"fixtureState",inning:m.inning,half:m.half,outs:m.outs,runners:m.runners,scores:m.scores});m.presentedEventCursor=m.simulationLog.length;const v=getHighSchoolMatchPresentation(m);return v.regulationInnings===7&&v.scoreboard.innings.at(-1)===8&&v.scoreboard.away.cells[7]==="…";})()`));
verify("11. 終場記分板全部轉為正式數字或合法未打破折號，R 等於 final score", evaluate(`(() => {const m=__complete1222();const v=getHighSchoolMatchPresentation(m);return m.completed&&!v.scoreboard.away.cells.includes("…")&&!v.scoreboard.home.cells.includes("…")&&v.scoreboard.away.visibleTotal===m.scores.away&&v.scoreboard.home.visibleTotal===m.scores.home;})()`));

verify("12. 教練 tactical direction 保存當下 moment context signature", evaluate(`(() => {const m=__setup1222("bench",10,true);return typeof m.coachTacticalContextSignature==="string"&&m.coachTacticalContextSignature===getHighSchoolCoachTacticalContextSignature(m)&&m.coachTacticalDirection.domain==="offense";})()`));
verify("13. offense → defense 時 stale 指示會由當前 domain 重算，presentation 不反向 mutation", evaluate(`(() => {const m=__setup1222("bench",10,true);m.currentDomain="defense";m.currentMomentId="hs_y1_match_moment_2";m.currentAssignment="守備當前球";m.outs=1;m.runners=["r1","r2",null];const before=JSON.stringify(m);const v=getHighSchoolMatchPresentation(m);return v.coachDirection.domain==="defense"&&["attackLeadRunner","aggressiveOuts"].includes(v.coachDirection.intent)&&JSON.stringify(m)===before;})()`));
verify("14. 同為 offense 但比分改變時不沿用舊指示", evaluate(`(() => {const m=__setup1222("bench",10,true);m.runners=[null,null,null];m.scores={home:0,away:2};setHighSchoolCoachTacticalDirection(m);const old=m.coachTacticalDirection.intent;m.scores={home:3,away:2};const v=getHighSchoolMatchPresentation(m);return old==="controlledAttack"&&v.coachDirection.intent==="createPressure"&&m.coachTacticalDirection.intent===old;})()`));
verify("15. defense 的出局數與壘況改變會刷新 priority", evaluate(`(() => {const m=__setup1222("bench",10,true);m.currentDomain="defense";m.runners=[null,null,"r3"];m.outs=0;setHighSchoolCoachTacticalDirection(m);const old=m.coachTacticalDirection.priority;m.runners=[null,null,null];m.outs=2;const v=getHighSchoolMatchPresentation(m);return v.coachDirection.intent==="secureOut"&&v.coachDirection.priority!==old&&v.coachDirection.priority.includes("第三個出局");})()`));
verify("15a. defense → offense 時不會殘留拿出局數的舊建議", evaluate(`(() => {const m=__setup1222("bench",10,true);m.currentDomain="defense";m.currentMomentId="hs_y1_match_moment_2";m.outs=2;m.runners=[null,null,null];m.currentAssignment="完成第三個出局";setHighSchoolCoachTacticalDirection(m);m.currentDomain="offense";m.currentMomentId="hs_y1_match_moment_3";m.outs=1;m.runners=["r1",null,null];m.currentAssignment="完成追分打席";const v=getHighSchoolMatchPresentation(m);return v.coachDirection.domain==="offense"&&!v.coachLine.includes("出局收乾淨")&&!v.coachDirection.priority.includes("第三個出局");})()`));
verify("16. normalizeSave 保存 coach context signature", evaluate(`(() => {const m=__setup1222("bench",10,true);const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return restored.coachTacticalContextSignature===m.coachTacticalContextSignature&&restored.coachTacticalDirection.intent===m.coachTacticalDirection.intent;})()`));

verify("17. 三種進攻選擇依真實壘況產生相符且不預告 outcome 的執行文字", evaluate(`(() => {const m=__setup1222("bench",10,true);m.currentDomain="offense";m.runners=[null,null,null];const empty=["attack","zone","advance"].map(d=>getHighSchoolDecisionExecutionText(m,d));m.runners=["r1",null,null];const withRunner=getHighSchoolDecisionExecutionText(m,"advance");return empty[0].includes("第一顆")&&(empty[1].includes("攻擊區")||empty[1].includes("甜蜜點"))&&empty[2].includes("確實擊中")&&!empty[2].includes("跑者")&&withRunner.includes("跑者")&&[...empty,withRunner].every(t=>!t.includes("安打")&&!t.includes("三振"));})()`));
verify("18. 守備選擇的執行文字會隨傳球目標改變", evaluate(`(() => {const m=__setup1222("bench",10,true);m.currentDomain="defense";const lead=getHighSchoolDecisionExecutionText(m,"lead");const home=getHighSchoolDecisionExecutionText(m,"home");return lead.includes("最前位跑者")&&home.includes("本壘")&&lead!==home;})()`));
verify("19. 結果卡依序顯示你的選擇、你的執行、發生的結果", evaluate(`(() => {__setup1222("bench",10,true);renderYouthSeasonOutcome("high_school_showcase",{text:"等球進入好球帶",executionText:"你把擊球點留在好球帶。",memory:"你把球打向右前方。"},"");const h=document.getElementById("story").innerHTML;return h.indexOf("你的選擇")<h.indexOf("你的執行")&&h.indexOf("你的執行")<h.indexOf("發生的結果");})()`));
verify("20. 玩家做出 match choice 後同一張卡立即完成 execution bridge，只有繼續操作", evaluate(`(() => {const m=__setup1222("bench",10,true);let safety=0;while(!isHighSchoolMatchDecisionVisible(m)&&safety++<400)advanceHighSchoolMatchPlaybackStep(m);const c=getHighSchoolYearOneMatchMomentChoices(m)[1];const ok=chooseHighSchoolYearOneMatchMoment(c.matchDecision,c.matchMomentId,()=>0.5);const h=document.getElementById("story").innerHTML;const buttons=document.getElementById("choices").innerHTML;return ok&&h.includes("choice-outcome-execution")&&h.includes("發生的結果")&&(buttons.match(/<button/g)||[]).length===1&&buttons.includes("繼續");})()`));
verify("21. mixed 守備結果明確描述只完成一部分，不以抽象成敗帶過", evaluate(`(() => {const m=__reachDefense1222();advanceHighSchoolYearOneAfterMomentTwo(m,"challenge","mixed");const last=m.completedMoments.at(-1);return last.resultCode==="oneOut"&&last.outcome.includes("二壘封殺成功")&&last.consequence.includes("只完成一半");})()`));
verify("22. 最終進攻結果不再沿用前一段守備 reaction", evaluate(`(() => {const m=__setup1222("bench",10,true);Object.assign(m,{momentIndex:2,currentMomentId:"hs_y1_match_moment_3",currentDomain:"offense",simulationPhase:"moment_3_ready",inning:7,half:"下",offenseTeam:"home",defenseTeam:"away",outs:1,runners:["r1",null,null],scores:{home:2,away:2},coachReaction:"現任教練立刻重申補位與最短出局責任。"});ensureHighSchoolMatchLineScoreInning(m,"home",7);recordHighSchoolMatchSimulationEvent(m,{type:"meaningfulMomentReached",momentId:m.currentMomentId,inning:m.inning,half:m.half,domain:m.currentDomain,assignment:m.currentAssignment,outs:m.outs,runners:m.runners,scores:m.scores});m.presentedEventCursor=m.simulationLog.length;__resolve1222("zone",0.5);return !m.coachReaction.includes("補位")&&!m.coachReaction.includes("守備決策")&&m.coachReaction.includes("進攻");})()`));
verify("23. outcome 與 execution 不洩漏 raw identifier", evaluate(`(() => {const h=document.getElementById("story").innerHTML;return !["simulationPhase","sourceCoachId","away-sim-","home-sim-","hs_y1_match_moment"].some(raw=>h.includes(raw));})()`));
verify("23a. 負面結果仍以發生的結果敘述，不先顯示抽象 Failure 標籤", evaluate(`(() => {__setup1222("bench",10,true);renderYouthSeasonOutcome("high_school_showcase",{text:"搶攻",executionText:"你鎖定第一顆可攻擊球出棒。",memory:"球棒從球下方穿過，這個打席最後被三振。"},"");const h=document.getElementById("story").innerHTML;const title=h.slice(h.indexOf('<h2'),h.indexOf('</h2>')+5);return h.includes("發生的結果")&&!title.includes("失敗")&&!title.includes("Failure");})()`));
verify("24. Direct Start canonical profile 仍可建立高一比賽且從 live timeline 開始", evaluate(`(() => {player=createInitialPlayer("Direct Start");applyDebugBookmarkCharacterProfile(player);settleHighSchoolEntryCapability(player,{originType:"test-fixture"});applyCanonicalPositionProfile(player,"外野手",["一壘手"]);player.chapter="青棒";player.highSchoolStep=5;player.highSchoolRoleCode="starter";const m=prepareHighSchoolYearOneMatch();return player.characterGenesis.completed&&m.position==="外野手"&&m.simulationPhase==="full_match_flow"&&m.scoreboardRevealHalfIndex===0&&m.lineScore.home.length===0&&m.lineScore.away.length===0;})()`));
verify("25. Normal Start 初始狀態與完整人生 route 未被 match hotfix 提前改寫", evaluate(`(() => {player=createInitialPlayer("Normal Start");return player.characterGenesis.completed===false&&player.highSchoolMatch.id===""&&player.chapter==="十歲暑假";})()`));

console.log(`\nHigh School Integration 1.2.2.2：${passed}/${passed} 通過`);
