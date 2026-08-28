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
    function __setup2111(positionOverride="游擊手") {
      stopHighSchoolMatchPlayback();
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      pendingHighSchoolMatchPositionOverride=positionOverride;
      player=createInitialPlayer("2.1.1.1 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode="starter";
      player.highSchoolTeamRole="先發／關鍵任務";
      Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=7);
      Object.assign(player,{ballSense:7,observe:7,fitness:7,instinct:7,discipline:7,responsibility:7});
      const match=prepareHighSchoolYearOneMatch();
      Object.assign(match,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:[null,null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved"});
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      match.simulationLog=[];
      match.presentedEventCursor=0;
      recordHighSchoolMatchSimulationEvent(match,{type:"fixtureStart",presentationImportance:"hidden",inning:5,half:"上",outs:0,runners:match.runners,scores:match.scores});
      match.presentedEventCursor=match.simulationLog.length;
      return match;
    }
    function __appendPa2111(match,result) {
      const batter=getHighSchoolMatchLineupBatter(match,"away");
      const before={outs:match.outs,scores:{...match.scores},runners:match.runners.slice()};
      applyHighSchoolSimulatedPlateAppearance(match,result,batter.id,"away");
      const event=recordHighSchoolMatchSimulationEvent(match,{type:"plateAppearance",inning:match.inning,half:match.half,offenseTeam:"away",batterId:batter.id,result,before,after:{outs:match.outs,scores:{...match.scores},runners:match.runners.slice()}});
      advanceHighSchoolMatchBattingOrder(match,"away");
      return event;
    }
    function __queue2111({futureScore=false}={}) {
      const match=__setup2111();
      const start=match.presentedEventCursor;
      __appendPa2111(match,"walk");
      __appendPa2111(match,"single");
      __appendPa2111(match,"out");
      prepareHighSchoolDefensiveMomentFromSimulation(match);
      if (futureScore) {
        match.scores.away+=1;
        ensureHighSchoolMatchLineScoreInning(match,"away",match.inning);
        match.lineScore.away[match.inning-1]+=1;
        recordHighSchoolMatchSimulationEvent(match,{type:"run",inning:match.inning,half:match.half,offenseTeam:"away",runnerId:"away-sim-9",scores:match.scores,runners:match.runners,outs:match.outs});
      }
      return {match,start};
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

const queued = parse(`(() => {const {match,start}=__queue2111();return {start,cursor:match.presentedEventCursor,length:match.simulationLog.length,types:match.simulationLog.slice(start).map(e=>e.type),decision:isHighSchoolMatchDecisionVisible(match),playback:isHighSchoolMatchPlaybackPhase(match)};})()`);
verify("1. simulator 可預先產生 walk／single／out／meaningful 四拍", queued.types.join() === "plateAppearance,plateAppearance,plateAppearance,meaningfulMomentReached" && queued.length > queued.cursor);
verify("2. pending meaningful moment 不會自行移動 presentation cursor", queued.cursor === queued.start && !queued.decision && queued.playback);

const progression = parse(`(() => {const {match,start}=__queue2111();const steps=[];for(let i=0;i<4;i+=1){const result=advanceHighSchoolMatchPlaybackStep(match);const model=getHighSchoolMatchPresentation(match);steps.push({result,cursor:match.presentedEventCursor,outs:model.currentSituation.outs,bases:model.bases,score:model.currentSituation.score,feed:model.feed.map(x=>x.type),decision:isHighSchoolMatchDecisionVisible(match),playback:isHighSchoolMatchPlaybackPhase(match)});}return {start,steps};})()`);
verify("3. A walk 單獨呈現為 0 OUT／一壘有人", progression.steps[0].cursor === progression.start + 1 && progression.steps[0].outs === 0 && progression.steps[0].bases.join() === "true,false,false");
verify("4. B single 下一拍呈現為 0 OUT／一二壘有人", progression.steps[1].cursor === progression.start + 2 && progression.steps[1].outs === 0 && progression.steps[1].bases.join() === "true,true,false");
verify("5. C out 再下一拍呈現為 1 OUT／一二壘有人", progression.steps[2].cursor === progression.start + 3 && progression.steps[2].outs === 1 && progression.steps[2].bases.join() === "true,true,false");
verify("6. D meaningful moment 最後才顯示 Decision 並暫停", progression.steps[3].cursor === progression.start + 4 && progression.steps[3].decision && !progression.steps[3].playback);
verify("7. 每個 playback tick 最多只提交一個 visible beat", progression.steps.every((step, index) => step.cursor === progression.start + index + 1));
verify("8. Feed 永遠不包含 cursor 後方事件", progression.steps[0].feed.join() === "plateAppearance" && progression.steps[1].feed.join() === "plateAppearance,plateAppearance" && !progression.steps[2].feed.includes("meaningfulMomentReached"));
verify("9. Decision 在 A／B／C 階段維持隱藏", progression.steps.slice(0, 3).every(step => !step.decision && step.playback));

verify("10. 未播放的未來得分不會洩漏到 B 的 visible score", evaluate(`(() => {const {match,start}=__queue2111({futureScore:true});advanceHighSchoolMatchPlaybackStep(match);advanceHighSchoolMatchPlaybackStep(match);const model=getHighSchoolMatchPresentation(match);return match.scores.away===2&&model.currentSituation.score.away===1&&model.scoreboard.away.visibleTotal===1&&model.feed.every(e=>e.type!=="run")&&match.presentedEventCursor===start+2;})()`));
verify("11. snapshot timeline 啟動後不會 fallback 到 authoritative runners／outs", evaluate(`(() => {const {match}=__queue2111();match.presentedEventCursor=1;match.runners=["future-a","future-b","future-c"];match.outs=3;match.scores.away=9;const model=getHighSchoolMatchPresentation(match);return model.currentSituation.outs===0&&model.currentSituation.score.away===1&&model.bases.join()==="false,false,false";})()`));

verify("12. hidden bookkeeping 可跳過但不消耗 visible beat 配額", evaluate(`(() => {const m=__setup2111();const start=m.presentedEventCursor;recordHighSchoolMatchSimulationEvent(m,{type:"debugMeta",presentationImportance:"hidden",inning:5,half:"上",outs:0,runners:m.runners,scores:m.scores});__appendPa2111(m,"walk");const event=advanceHighSchoolPresentationCursor(m);return event.type==="plateAppearance"&&m.presentedEventCursor===start+2;})()`));

const halfOrder = parse(`(() => {const m=__setup2111();m.outs=2;__appendPa2111(m,"out");const thirdCursor=m.simulationLog.length;m.presentedEventCursor=thirdCursor;const a=advanceHighSchoolMatchPlaybackStep(m);const half=getHighSchoolPresentedEvent(m);const b=advanceHighSchoolMatchPlaybackStep(m);const side=getHighSchoolPresentedEvent(m);return {a,b,half:half.type,side:side.type,types:m.simulationLog.slice(thirdCursor).map(e=>e.type)};})()`);
verify("13. 第三出局之後依序才是 half-inning end 與 side change", halfOrder.a === "halfInningEnd" && halfOrder.b === "sideChange" && halfOrder.half === "halfInningEnd" && halfOrder.side === "sideChange" && halfOrder.types.join() === "halfInningEnd,sideChange");

verify("14. reload 在 B 後會從 C 繼續且不重複 simulator mutation", evaluate(`(() => {const {match,start}=__queue2111();advanceHighSchoolMatchPlaybackStep(match);advanceHighSchoolMatchPlaybackStep(match);const before={log:match.simulationLog.length,score:JSON.stringify(match.scores),outs:match.outs};player=normalizeSave(JSON.parse(JSON.stringify(player)));const restored=player.highSchoolMatch;const result=advanceHighSchoolMatchPlaybackStep(restored);return result==="outState"&&restored.presentedEventCursor===start+3&&restored.simulationLog.length===before.log&&JSON.stringify(restored.scores)===before.score&&restored.outs===before.outs;})()`));
verify("15. reload 在 D 的 Decision pause 保留畫面且 timer 不續跑", evaluate(`(() => {const {match}=__queue2111();for(let i=0;i<4;i+=1)advanceHighSchoolMatchPlaybackStep(match);const before=JSON.stringify(getHighSchoolMatchPresentation(match).currentSituation);player=normalizeSave(JSON.parse(JSON.stringify(player)));const restored=player.highSchoolMatch;return isHighSchoolMatchDecisionVisible(restored)&&!isHighSchoolMatchPlaybackPhase(restored)&&advanceHighSchoolMatchPlaybackStep(restored)===false&&before===JSON.stringify(getHighSchoolMatchPresentation(restored).currentSituation);})()`));

verify("16. Decision outcome 與 resumed simulator event 分成不同 presentation beat", evaluate(`(() => {const {match}=__queue2111();for(let i=0;i<4;i+=1)advanceHighSchoolMatchPlaybackStep(match);const decisionCursor=match.presentedEventCursor;const narrative=resolveHighSchoolYearOneMatch("secure",match.currentMomentId,()=>0.8);const outcome=advanceHighSchoolPresentationCursor(match);const outcomeCursor=match.presentedEventCursor;const logBeforeResume=match.simulationLog.length;const resumed=advanceHighSchoolMatchPlaybackStep(match);return narrative&&outcome.type==="meaningfulMomentResolved"&&outcomeCursor>decisionCursor&&resumed&&match.simulationLog.length>=logBeforeResume&&match.presentedEventCursor<=match.simulationLog.length&&getHighSchoolPresentedEvent(match).type!=="meaningfulMomentResolved";})()`));

verify("17. gameplay production code 只由單一 helper 寫入 cursor", (() => {
  const source = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const assignments = [...source.matchAll(/match\.presentedEventCursor\s*=\s*([^;]+);/g)].map(match => match[1].trim());
  return assignments.length === 1 && assignments[0] === "cursor" && !source.includes("presentedEventCursor = match.simulationLog.length");
})());
verify("18. 初始化與 migration 的合法 cursor 寫入仍保留", (() => {
  const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
  const saveSource = fs.readFileSync(path.join(root, "save.js"), "utf8");
  return playerSource.includes("presentedEventCursor: 0") && saveSource.includes("fresh.highSchoolMatch.presentedEventCursor = Math.min(");
})());

verify("19. 舊 event 缺少 snapshot 時依事件順序 migration", evaluate(`(() => {const m=__setup2111();m.simulationLog=[{type:"matchEntry",inning:3,half:"下",outs:1,runners:["r1",null,null],scores:{home:0,away:1}},{type:"plateAppearance",inning:3,half:"下",after:{outs:2,runners:["r1",null,null],scores:{home:0,away:1}}}];m.presentedEventCursor=1;player.highSchoolMatch=m;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;const shown=getHighSchoolMatchPresentation(restored).currentSituation;return restored.simulationLog.every(e=>e.presentationSnapshot)&&restored.simulationLog[0].presentationImportance==="hidden"&&shown.outs===1&&shown.runners[0]==="r1";})()`));

const positions = parse(`(() => ["一壘手","二壘手","游擊手","三壘手"].map(position=>{const m=__setup2111(position);Object.assign(m,{outs:1,runners:["away-sim-2","away-sim-3",null]});prepareHighSchoolDefensiveMomentFromSimulation(m);advanceHighSchoolPresentationCursor(m);return {position,current:m.currentFieldingPosition,family:m.positionDecisionFamily,canonical:player.primaryPosition,decision:isHighSchoolMatchDecisionVisible(m),choices:getHighSchoolDefensiveMomentChoices(m).length};}))()`);
verify("20. Position Test Harness 四個內野守位維持可用", positions.every(item => item.position === item.current && item.family === "infield" && item.canonical === "內野手" && item.decision && item.choices >= 2));

console.log(`\nBaseball Match Foundation 2.1.1.1：${passed}/${passed} 通過`);
