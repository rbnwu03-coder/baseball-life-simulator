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
  "match-experience-development.js", "match-development-settlement-presentation.js",
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
    function __setupThirdOut(seed=31001) {
      stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
      player=createInitialPlayer("Third Out Fixture");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
      pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      match.presentedEventCursor=match.simulationLog.length;
      match.outs=2;
      match.runners=[match.rosters.away.lineup[1].id,match.rosters.away.lineup[2].id,null];
      return match;
    }
    function __groundballThirdOut(seed=31001) {
      const match=__setupThirdOut(seed);
      const runners=match.runners.slice();
      const result=resolveSimulatedHighSchoolPlateAppearance(match,()=>0);
      const event=match.simulationLog.findLast(item=>item.type==="plateAppearance");
      const commentary=formatHighSchoolPlateAppearanceCommentary(event,match);
      return {match,runners,result,event,commentary};
    }
    function __timedThirdOut(type,timing) {
      const match=__setupThirdOut(31077);
      const runnerId=match.rosters.away.lineup[3].id;
      match.runners=[null,null,runnerId];
      const beforeScore=match.scores.away;
      const truth=resolveHighSchoolThirdOutIntegrity({
        outsBefore:2,outsCreated:1,runnersBefore:match.runners,
        proposedRunnersAfter:[null,null,null],
        scoringAttempts:[{runnerId,timing}],thirdOutType:type
      });
      match.outs=truth.outsAfter;
      truth.legalScoringRunnerIds.forEach(id=>scoreHighSchoolMatchRunner(match,id,"away","timed-third-out-fixture"));
      match.runners=truth.basesAfter.slice();
      match.pendingHalfInningTermination=JSON.parse(JSON.stringify(truth));
      advanceHighSchoolMatchAfterHalfInning(match);
      return {match,truth,beforeScore,runnerId};
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

verify("1. 兩出局一二壘有人滾地球在一壘形成第三出局", evaluate(`(() => {const x=__groundballThirdOut();return x.result.result==="out"&&x.match.outs===3&&x.event.thirdOutResolution.thirdOutType==="batterRunnerBeforeFirst";})()`));
verify("2. 第三出局 play truth 立即收斂為空壘 terminal state", evaluate(`(() => {const x=__groundballThirdOut();return x.match.runners.every(v=>v===null)&&x.event.after.runners.every(v=>v===null)&&x.event.thirdOutResolution.halfInningEnded;})()`));
verify("3. 第三出局摘要不再描述跑者留壘或推進", evaluate(`(() => {const t=__groundballThirdOut().commentary;return t.includes("第三個出局，半局結束")&&!t.includes("留在")&&!t.includes("推進");})()`));
verify("4. terminal runner changes 使用 halfInningEnd 而非虛構跑者出局", evaluate(`(() => {const e=__groundballThirdOut().event;return e.runnerChanges.filter(c=>c.from!=="batter").every(c=>c.to==="halfInningEnd");})()`));
verify("5. force third out 即使跑者先過本壘也不計分", evaluate(`(() => {const r=resolveHighSchoolThirdOutIntegrity({outsBefore:2,outsCreated:1,runnersBefore:["r1","r2","r3"],proposedRunnersAfter:["b","r1","r2"],scoringAttempts:[{runnerId:"r3",timing:"beforeThirdOut"}],thirdOutType:"force"});return !r.scoringAllowed&&r.legalScoringRunnerIds.length===0&&r.invalidatedScoringRunnerIds[0]==="r3";})()`));
verify("6. batter-runner 一壘前第三出局不計先過本壘的分數", evaluate(`(() => {const r=resolveHighSchoolThirdOutIntegrity({outsBefore:2,outsCreated:1,runnersBefore:[null,null,"r3"],proposedRunnersAfter:[null,null,null],scoringAttempts:[{runnerId:"r3",timing:"beforeThirdOut"}],thirdOutType:"batterRunnerBeforeFirst"});return r.legalScoringRunnerIds.length===0&&r.basesAfter.every(v=>v===null);})()`));
verify("7. non-force tag 發生前已合法過本壘的得分保留", evaluate(`(() => {const r=resolveHighSchoolThirdOutIntegrity({outsBefore:2,outsCreated:1,runnersBefore:[null,"r2",null],proposedRunnersAfter:[null,null,null],scoringAttempts:[{runnerId:"r2",timing:"beforeThirdOut"}],thirdOutType:"nonForceTag"});return r.scoringAllowed&&r.legalScoringRunnerIds[0]==="r2"&&r.halfInningEnded;})()`));
verify("8. non-force tag 後才過本壘的嘗試不計分", evaluate(`resolveHighSchoolThirdOutIntegrity({outsBefore:2,outsCreated:1,scoringAttempts:[{runnerId:"r",timing:"afterThirdOut"}],thirdOutType:"nonForceTag"}).legalScoringRunnerIds.length===0`));
verify("9. 半局 transition 固定清壘、歸零出局並交換攻守", evaluate(`(() => {const x=__groundballThirdOut();advanceHighSchoolMatchAfterHalfInning(x.match);return x.match.half==="下"&&x.match.outs===0&&x.match.runners.every(v=>v===null)&&x.match.offenseTeam==="home"&&x.match.defenseTeam==="away";})()`));
verify("10. halfInningEnd debug truth 保存第三出局類型與完成 transition", evaluate(`(() => {const x=__groundballThirdOut();advanceHighSchoolMatchAfterHalfInning(x.match);const e=x.match.simulationLog.findLast(v=>v.type==="halfInningEnd");return e.thirdOutType==="batterRunnerBeforeFirst"&&e.halfInningTransition==="completed"&&e.basesAfter.every(v=>v===null);})()`));
verify("11. event log 不同時存在第三出局與 runner-stay destination", evaluate(`(() => {const e=__groundballThirdOut().event;return e.thirdOutResolution.halfInningEnded&&!e.runnerChanges.some(c=>c.to===c.from);})()`));
verify("12. save/reload 後第三出局 pending truth 深層保存", evaluate(`(() => {const x=__groundballThirdOut();player.highSchoolMatch=x.match;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return restored.pendingHalfInningTermination.thirdOutType==="batterRunnerBeforeFirst"&&restored.runners.every(v=>v===null);})()`));
verify("13. 同 seed／同 play fresh 與 reload transition truth 相同", evaluate(`(() => {const a=__groundballThirdOut(31991).match;player.highSchoolMatch=__groundballThirdOut(31991).match;const b=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;advanceHighSchoolMatchAfterHalfInning(a);advanceHighSchoolMatchAfterHalfInning(b);const truth=m=>JSON.stringify({inning:m.inning,half:m.half,outs:m.outs,runners:m.runners,scores:m.scores,order:m.battingOrderIndex});return truth(a)===truth(b);})()`));
verify("14. 第三出局未造成第四出局、重複換邊或打序跳號", evaluate(`(() => {const x=__groundballThirdOut();const before=x.match.battingOrderIndex.home;advanceHighSchoolMatchAfterHalfInning(x.match);const again=advanceHighSchoolMatchAfterHalfInning(x.match);return again===false&&x.match.outs===0&&x.match.battingOrderIndex.home===before;})()`));
verify("15. force third out 套入正式 score／transition 後仍不增加分數", evaluate(`(() => {const x=__timedThirdOut("force","beforeThirdOut");return x.match.scores.away===x.beforeScore&&x.match.outs===0&&x.match.runners.every(v=>v===null);})()`));
verify("16. non-force tag 前合法得分套入正式 score／transition 後仍保留", evaluate(`(() => {const x=__timedThirdOut("nonForceTag","beforeThirdOut");return x.match.scores.away===x.beforeScore+1&&x.match.lineScore.away[0]===1&&x.match.outs===0&&x.match.runners.every(v=>v===null);})()`));

console.log(`\nThird-Out Runner Resolution Integrity v1：${passed}/${passed} 通過`);
