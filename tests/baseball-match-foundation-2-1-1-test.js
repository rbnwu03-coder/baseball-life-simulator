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
    window: { setTimeout() { return 1; }, clearTimeout() {} }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    function __setup211(positionOverride="") {
      stopHighSchoolMatchPlayback();
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      pendingHighSchoolMatchPositionOverride=positionOverride;
      player=createInitialPlayer("2.1.1 測試球員");
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
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      match.presentedEventCursor=match.simulationLog.length;
      return match;
    }
    function __recordPa211(result,{outs=0,runners=[null,null,null],scores={home:1,away:1},team="away"}={}) {
      const match=__setup211();
      Object.assign(match,{inning:5,half:team==="away"?"上":"下",offenseTeam:team,defenseTeam:team==="away"?"home":"away",outs,runners:runners.slice(),scores:{...scores},simulationPhase:"moment_1_resolved"});
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      ensureHighSchoolMatchLineScoreInning(match,team,5);
      const start=match.simulationLog.length;
      const batter=getHighSchoolMatchLineupBatter(match,team);
      const before={outs:match.outs,scores:{...match.scores},runners:match.runners.slice()};
      const runnerFacts=applyHighSchoolSimulatedPlateAppearance(match,result,batter.id,team);
      const runsBattedIn=match.scores[team]-before.scores[team];
      recordHighSchoolMatchSimulationEvent(match,{type:"plateAppearance",inning:match.inning,half:match.half,offenseTeam:team,batterId:batter.id,result,runsBattedIn,runnerChanges:runnerFacts.runnerChanges,scoringRunnerIds:runnerFacts.scoringRunnerIds,before,after:{outs:match.outs,scores:{...match.scores},runners:match.runners.slice()}});
      return {match,start};
    }
    function __position211(position) {
      const match=__setup211(position);
      Object.assign(match,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:1,runners:["away-sim-2","away-sim-3",null],simulationPhase:"moment_1_resolved"});
      prepareHighSchoolDefensiveMomentFromSimulation(match);
      return match;
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

verify("1. 每個 simulation event 都附有只讀 presentation snapshot", evaluate(`(() => {const m=__setup211();const s=m.simulationLog[0].presentationSnapshot;return Object.isFrozen(s)&&Object.isFrozen(s.runners)&&Object.isFrozen(s.scores)&&["inning","half","outs","runners","scores","lineScoreRevealHalfIndex"].every(k=>Object.hasOwn(s,k));})()`));
verify("2. walk snapshot 同步顯示打者上壘", evaluate(`(() => {const {match,start}=__recordPa211("walk");const e=match.simulationLog.at(-1);return e.presentationSnapshot.runners[0]===e.batterId&&e.presentationSnapshot.outs===0&&start===e.sequence;})()`));
verify("3. 滿壘 walk 的 run 與 plate snapshot 使用同一完成後壘況", evaluate(`(() => {const {match,start}=__recordPa211("walk",{runners:["away-sim-5","away-sim-6","away-sim-7"]});const events=match.simulationLog.slice(start);const run=events.find(e=>e.type==="run");const pa=events.find(e=>e.type==="plateAppearance");return run&&pa&&JSON.stringify(run.presentationSnapshot.runners)===JSON.stringify(pa.presentationSnapshot.runners)&&run.presentationSnapshot.scores.away===2;})()`));
verify("4. single snapshot 顯示打者到一壘、原一壘跑者到二壘", evaluate(`(() => {const {match}=__recordPa211("single",{runners:["away-sim-5",null,null]});const s=match.simulationLog.at(-1).presentationSnapshot;return s.runners[0]&&s.runners[1]==="away-sim-5";})()`));
verify("5. double snapshot 顯示打者到二壘並保留推進結果", evaluate(`(() => {const {match}=__recordPa211("double",{runners:["away-sim-5",null,null]});const s=match.simulationLog.at(-1).presentationSnapshot;return s.runners[0]===null&&s.runners[1]&&s.runners[2]==="away-sim-5";})()`));
verify("6. 得分 snapshot 與單一 PA commentary 的比分一致", evaluate(`(() => {const {match}=__recordPa211("single",{runners:[null,null,"away-sim-7"]});match.presentedEventCursor=match.simulationLog.length;const model=getHighSchoolMatchPresentation(match);const pa=model.feed.find(x=>x.type==="plateAppearance");return model.currentSituation.score.away===2&&pa&&pa.text.includes("回本壘得分")&&pa.text.includes("2：1")&&model.feed.every(x=>x.type!=="run");})()`));
verify("7. 一般出局 snapshot 增加一個 out", evaluate(`(() => {const {match}=__recordPa211("out",{outs:0});return match.simulationLog.at(-1).presentationSnapshot.outs===1;})()`));
verify("8. 第三出局 snapshot 保留 3 OUT", evaluate(`(() => {const {match}=__recordPa211("out",{outs:2});const s=match.simulationLog.at(-1).presentationSnapshot;return s.outs===3&&s.half==="上";})()`));
verify("9. 第三出局 presentation 有三顆 OUT 燈", evaluate(`(() => {const {match}=__recordPa211("out",{outs:2});match.presentedEventCursor=match.simulationLog.length;const model=getHighSchoolMatchPresentation(match);return model.currentSituation.outs===3&&model.outs.join()==="true,true,true";})()`));

const transition = parse(`(() => {const {match}=__recordPa211("out",{outs:2});match.presentedEventCursor=match.simulationLog.length;const third=getHighSchoolMatchPresentation(match);const a=advanceHighSchoolMatchPlaybackStep(match);const half=getHighSchoolMatchPresentation(match);const b=advanceHighSchoolMatchPlaybackStep(match);const side=getHighSchoolMatchPresentation(match);return {third:third.currentSituation,half:half.currentSituation,side:side.currentSituation,a,b,types:match.simulationLog.slice(-2).map(e=>e.type),cursor:match.presentedEventCursor};})()`);
verify("10. 第三出局後下一拍才呈現 half-inning end", transition.third.outs === 3 && transition.a === "halfInningEnd" && transition.half.outs === 3);
verify("11. half-inning end 再下一拍才呈現 side change", transition.b === "sideChange" && transition.side.outs === 0 && transition.side.half === "下");
verify("12. half end 與 side change 都是正式 snapshot event", transition.types.join() === "halfInningEnd,sideChange");

verify("13. presentation cursor 停在過去時不洩漏未來壘況", evaluate(`(() => {const {match,start}=__recordPa211("single",{runners:["away-sim-5",null,null]});const firstEnd=match.simulationLog.length;const first=match.simulationLog.at(-1).presentationSnapshot;const batter=getHighSchoolMatchLineupBatter(match,"away");const before={outs:match.outs,scores:{...match.scores},runners:match.runners.slice()};applyHighSchoolSimulatedPlateAppearance(match,"double",batter.id,"away");recordHighSchoolMatchSimulationEvent(match,{type:"plateAppearance",inning:5,half:"上",batterId:batter.id,result:"double",before,after:{outs:match.outs,scores:{...match.scores},runners:match.runners.slice()}});match.presentedEventCursor=firstEnd;const shown=getHighSchoolMatchPresentation(match).currentSituation;return shown.runners.join()===first.runners.join()&&shown.runners.join()!==match.runners.join()&&getHighSchoolMatchPresentation(match).feed.every(x=>!x.text.includes("二壘安打"));})()`));
verify("14. score R、Bases、Outs 與 Feed 來自同一 snapshot", evaluate(`(() => {const {match}=__recordPa211("single",{outs:1,runners:[null,null,"away-sim-7"]});match.presentedEventCursor=match.simulationLog.length;const m=getHighSchoolMatchPresentation(match);return m.currentSituation.outs===1&&m.currentSituation.score.away===2&&m.bases.join()===m.currentSituation.runners.map(Boolean).join()&&m.scoreboard.away.visibleTotal===2&&m.feed.at(-1).type==="plateAppearance";})()`));
verify("15. decision arrival 只在 presentation helper 提交後顯示 meaningful moment snapshot", evaluate(`(() => {const m=__setup211("游擊手");Object.assign(m,{half:"上",offenseTeam:"away",defenseTeam:"home",outs:1,runners:["away-sim-2","away-sim-3",null],simulationPhase:"moment_1_resolved"});const before=m.presentedEventCursor;prepareHighSchoolDefensiveMomentFromSimulation(m);const e=m.simulationLog.at(-1);const queued=m.presentedEventCursor===before&&!isHighSchoolMatchDecisionVisible(m);advanceHighSchoolPresentationCursor(m);const p=getHighSchoolMatchPresentation(m);return queued&&e.type==="meaningfulMomentReached"&&m.presentedEventCursor===m.simulationLog.length&&isHighSchoolMatchDecisionVisible(m)&&p.currentSituation.outs===e.presentationSnapshot.outs&&p.currentSituation.runners.join()===e.presentationSnapshot.runners.join();})()`));
verify("16. decision-ready phase 不會自動模擬或移動 cursor", evaluate(`(() => {const m=__position211("游擊手");m.presentedEventCursor=m.simulationLog.length;const before=JSON.stringify(m);return advanceHighSchoolMatchPlaybackStep(m)===false&&JSON.stringify(m)===before;})()`));

verify("17. save/reload 保留 snapshot、cursor 與 reveal position", evaluate(`(() => {const {match}=__recordPa211("single",{runners:[null,null,"away-sim-7"]});match.presentedEventCursor=match.simulationLog.length-1;match.scoreboardRevealHalfIndex=8;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return restored.presentedEventCursor===match.presentedEventCursor&&restored.scoreboardRevealHalfIndex===8&&JSON.stringify(restored.simulationLog.map(e=>e.presentationSnapshot))===JSON.stringify(match.simulationLog.map(e=>e.presentationSnapshot));})()`));
verify("18. reload 後呈現下一拍不重複比分、log 或 simulation cursor", evaluate(`(() => {const {match}=__recordPa211("single",{runners:[null,null,"away-sim-7"]});match.presentedEventCursor=match.simulationLog.length-1;const before={score:JSON.stringify(match.scores),log:match.simulationLog.length,sim:match.simulationCursor};player=normalizeSave(JSON.parse(JSON.stringify(player)));advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);return before.score===JSON.stringify(player.highSchoolMatch.scores)&&before.log===player.highSchoolMatch.simulationLog.length&&before.sim===player.highSchoolMatch.simulationCursor;})()`));
verify("19. reload 前後 presentation model 完全一致", evaluate(`(() => {const {match}=__recordPa211("double",{runners:["away-sim-5",null,null]});match.presentedEventCursor=match.simulationLog.length;const before=JSON.stringify(getHighSchoolMatchPresentation(match));player=normalizeSave(JSON.parse(JSON.stringify(player)));return before===JSON.stringify(getHighSchoolMatchPresentation(player.highSchoolMatch));})()`));
verify("19a. force play resolution 也保存同一完成後 snapshot", evaluate(`(() => {const m=__position211("游擊手");const before=m.outs;const result=resolveHighSchoolYearOneMatch("lead",m.currentMomentId,()=>.8);const event=m.simulationLog.findLast(e=>e.type==="defensiveResolution");return result&&event&&event.presentationSnapshot.outs===m.outs&&event.presentationSnapshot.runners.join()===m.runners.join()&&m.outs>=before;})()`));

const positions = parse(`(() => ["一壘手","二壘手","游擊手","三壘手"].map(position=>{const m=__position211(position);return {position,current:m.currentFieldingPosition,override:m.developmentPositionOverride,canonical:player.primaryPosition,secondary:player.secondaryPositions.slice(),family:m.positionDecisionFamily,context:m.ballContext.type,direction:m.defensiveSituation.ballDirection,choices:getHighSchoolDefensiveMomentChoices(m).map(x=>x.text)};}))()`);
verify("20. 一壘手測試入口建立實際一壘手情境", positions[0].current === "一壘手" && positions[0].context === "hardGrounder" && positions[0].direction === "straightAtPlayer");
verify("21. 二壘手測試入口建立實際二壘手情境", positions[1].current === "二壘手" && positions[1].context === "normalGrounder" && positions[1].direction === "upTheMiddle");
verify("22. 游擊手測試入口建立實際游擊手情境", positions[2].current === "游擊手" && positions[2].context === "deepGrounder" && positions[2].direction === "towardHole");
verify("23. 三壘手測試入口建立實際三壘手情境", positions[3].current === "三壘手" && positions[3].context === "slowGrounder" && positions[3].direction === "lineSide");
verify("24. 四種測試守位都走既有 infield family", positions.every(item => item.family === "infield"));
verify("25. 測試守位不覆寫 canonical primaryPosition", positions.every(item => item.canonical === "內野手"));
verify("26. 測試守位不覆寫 canonical secondaryPositions", positions.every(item => item.secondary.join() === "外野手"));
verify("27. 四個守位產生各自可用的合法選項", new Set(positions.map(item => item.choices.join("|"))).size === 4 && positions.every(item => item.choices.length >= 2));
verify("28. 切換測試守位不殘留上一場 override", evaluate(`(() => {const a=__position211("一壘手");const b=__position211("三壘手");return a!==b&&a.currentFieldingPosition==="一壘手"&&b.currentFieldingPosition==="三壘手"&&player.highSchoolMatch===b;})()`));
verify("29. 不指定時沿用原本角色守位策略", evaluate(`(() => {const m=__setup211();return m.developmentPositionOverride===""&&m.currentFieldingPosition===""&&m.position===player.primaryPosition;})()`));
verify("30. selector 只接受 Normal／四個正式內野守位", evaluate(`selectDevelopmentTestPosition("游擊手")===true&&selectedDevelopmentTestPosition==="游擊手"&&selectDevelopmentTestPosition("捕手")===false&&selectedDevelopmentTestPosition==="游擊手"&&selectDevelopmentTestPosition("")===true`));
verify("31. 守位測試 UI 明確標示開發測試且不提供 scenario selector", (() => { const html = fs.readFileSync(path.join(root, "index.html"), "utf8"); return html.includes("開發測試：指定本場守位") && ["一壘手", "二壘手", "游擊手", "三壘手"].every(position => html.includes(`data-development-position="${position}"`)) && !html.includes("data-development-scenario"); })());
verify("32. 玩家可見守位 presentation 不含 raw identifiers", evaluate(`(() => {const m=__position211("游擊手");const html=renderHighSchoolYearOneScore("full",getHighSchoolMatchPresentation(m))+renderHighSchoolOpponentInformation(getHighSchoolMatchPresentation(m));return html.includes("游擊手")&&![/away-sim-/,/presentationSnapshot/,/towardHole/,/developmentPositionOverride/].some(raw=>raw.test(html));})()`));
verify("33. Normal Start 不套用已選測試守位", evaluate(`(() => {selectDevelopmentEntry("full");selectDevelopmentTestPosition("二壘手");pendingHighSchoolMatchPositionOverride="";const m=__setup211();return m.developmentPositionOverride===""&&player.primaryPosition==="內野手";})()`));
verify("34. Direct Start 的選擇可傳入唯一 match-local override", evaluate(`(() => {selectDevelopmentEntry("highSchool");selectDevelopmentTestPosition("二壘手");pendingHighSchoolMatchPositionOverride=selectedDevelopmentTestPosition;const m=__setup211(pendingHighSchoolMatchPositionOverride);return m.currentFieldingPosition==="二壘手"&&m.developmentPositionOverride==="二壘手"&&player.primaryPosition==="內野手";})()`));
verify("35. 流動、注意與重大轉場使用集中且遞增的命名節奏", evaluate(`MATCH_FLOW_BEAT_MS===1000&&MATCH_ATTENTION_BEAT_MS===1700&&MATCH_MAJOR_TRANSITION_MS>=1700&&MATCH_MAJOR_TRANSITION_MS<=2000`));

console.log(`\nBaseball Match Foundation 2.1.1：${passed}/${passed} 通過`);
