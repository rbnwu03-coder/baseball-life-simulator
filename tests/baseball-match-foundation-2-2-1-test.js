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
    function __setup221(seed=22101) {
      stopHighSchoolMatchPlayback();
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      player=createInitialPlayer("2.2.1 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode="starter";
      player.highSchoolTeamRole="starter";
      pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      match.presentedEventCursor=match.simulationLog.length;
      return match;
    }
    function __thirdOut221() {
      const match=__setup221();
      match.outs=2;
      const beforeCount=match.simulationLog.filter(event=>event.type==="plateAppearance"&&event.inning===1&&event.half==="上").length;
      const beforeAwayIndex=match.battingOrderIndex.away;
      const beforeHomeIndex=match.battingOrderIndex.home;
      resolveSimulatedHighSchoolPlateAppearance(match,()=>0);
      advanceHighSchoolPresentationCursor(match);
      const third=getHighSchoolMatchPresentation(match);
      const rejected=resolveSimulatedHighSchoolPlateAppearance(match,()=>0);
      const halfResult=advanceHighSchoolMatchPlaybackStep(match);
      const half=getHighSchoolMatchPresentation(match);
      const sideResult=advanceHighSchoolMatchPlaybackStep(match);
      const side=getHighSchoolMatchPresentation(match);
      return {match,third,half,side,rejected,halfResult,sideResult,beforeCount,beforeAwayIndex,beforeHomeIndex};
    }
    function __infield221(runners=[null,null,null]) {
      const match=__setup221();
      Object.assign(match,{inning:3,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:runners.slice(),currentDomain:"defense",momentIndex:1,currentMomentId:highSchoolYearOneMomentIds[1],simulationPhase:"moment_2_ready",currentFieldingPosition:"一壘手",positionDecisionFamily:"",defensiveSituation:{}});
      match.battingOrderIndex.away=3;
      match.currentBatter=match.rosters.away.lineup[3].id;
      setHighSchoolDefensiveBallContext(match,"hardGrounder");
      buildInfieldMeaningfulMoment(match,player,{playerPosition:"一壘手",ballDirection:"straightAtPlayer",playerCapabilities:{fielding:1,reaction:1,range:1,arm:3,throwing:3,decision:3}});
      match.currentAssignment=getHighSchoolDefensiveSituationText(match);
      setHighSchoolCoachTacticalDirection(match);
      return match;
    }
    function __event221(result,{before=[null,null,null],after=[null,null,null],changes=[],scoring=[],runs=0,scores={home:0,away:0},team="away"}={}) {
      const match=__setup221();
      const batter=match.rosters[team].lineup[0].id;
      return {match,event:{type:"plateAppearance",inning:1,half:team==="away"?"上":"下",offenseTeam:team,batterId:batter,result,runsBattedIn:runs,runnerChanges:changes,scoringRunnerIds:scoring,before:{outs:0,runners:before,scores:{home:0,away:0}},after:{outs:0,runners:after,scores}}};
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

verify("1. match-state invariant 接受合法正式開場", evaluate(`getHighSchoolMatchStateIntegrityIssues(__setup221()).length===0`));
verify("2. invariant 可偵測第四出局", evaluate(`(() => {const m=__setup221();m.outs=4;return getHighSchoolMatchStateIntegrityIssues(m).includes("outs-out-of-range");})()`));
verify("3. invariant 可偵測重複跑者 identity", evaluate(`(() => {const m=__setup221();m.runners=["A","A",null];return getHighSchoolMatchStateIntegrityIssues(m).includes("duplicate-runner-identity");})()`));
verify("4. 第三出局 PA snapshot 保留舊半局 3 OUT", evaluate(`(() => {const x=__thirdOut221();return x.third.currentSituation.inning===1&&x.third.currentSituation.half==="上"&&x.third.currentSituation.outs===3;})()`));
verify("5. 第三出局下一拍才呈現 half-inning end", evaluate(`(() => {const x=__thirdOut221();return x.halfResult==="halfInningEnd"&&x.half.currentSituation.half==="上"&&x.half.currentSituation.outs===3;})()`));
verify("6. half-inning end 再下一拍呈現 side change", evaluate(`(() => {const x=__thirdOut221();return x.sideResult==="sideChange"&&x.side.currentSituation.half==="下"&&x.side.currentSituation.outs===0;})()`));
verify("7. 第三出局後不得 resolve 同半局第四棒", evaluate(`(() => {const x=__thirdOut221();const pa=x.match.simulationLog.filter(e=>e.type==="plateAppearance"&&e.inning===1&&e.half==="上").length;return x.rejected===false&&pa===x.beforeCount+1;})()`));
verify("8. atomic side change 交換 offense／defense", evaluate(`(() => {const x=__thirdOut221();return x.match.offenseTeam==="home"&&x.match.defenseTeam==="away";})()`));
verify("9. 換邊保留兩隊各自 batting-order index", evaluate(`(() => {const x=__thirdOut221();return x.match.battingOrderIndex.away===(x.beforeAwayIndex+1)%9&&x.match.battingOrderIndex.home===x.beforeHomeIndex;})()`));
verify("10. 換邊 current batter 來自新進攻隊棒次", evaluate(`(() => {const x=__thirdOut221();return x.match.currentBatter===getHighSchoolMatchLineupBatter(x.match,"home").id;})()`));
verify("11. 新半局固定 0 OUT／空壘", evaluate(`(() => {const x=__thirdOut221();return x.match.outs===0&&x.match.runners.every(r=>r===null);})()`));
verify("12. half end 與 side change assignment 各自保存對應 snapshot", evaluate(`(() => {const x=__thirdOut221();const e=x.match.simulationLog.filter(v=>["halfInningEnd","sideChange"].includes(v.type));return e[0].presentationSnapshot.assignment.includes("半局結束")&&e[1].presentationSnapshot.assignment.includes("攻守交換");})()`));

verify("13. 空壘失誤只允許打者成為跑者", evaluate(`(() => {const r=applyDefensiveRunnerOutcome({runnersBefore:[null,null,null],batterId:"A",route:"secureFirst",resultCode:"error"});return r.runnersAfter.join()===["A",null,null].join()&&r.scoringRunnerIds.length===0;})()`));
verify("14. 一壘有人失誤只保留原跑者與打者", evaluate(`(() => {const r=applyDefensiveRunnerOutcome({runnersBefore:["B",null,null],batterId:"A",route:"secureFirst",resultCode:"error"});return r.runnersAfter.join()===["A","B",null].join()&&r.runnersAfter.every(x=>!x||["A","B"].includes(x));})()`));
verify("15. 多跑者失誤不會生成前態以外 identity", evaluate(`(() => {const states=[["B",null,"D"],[null,"C","D"],["B","C","D"],[null,"C",null]];return states.every(before=>{const r=applyDefensiveRunnerOutcome({runnersBefore:before,batterId:"A",route:"controlledNoThrow",resultCode:"error"});const allowed=new Set(["A",...before.filter(Boolean)]);return [...r.runnersAfter,...r.scoringRunnerIds].filter(Boolean).every(id=>allowed.has(id));});})()`));
verify("16. runner duplication guard 確保每個 identity 最多一個壘包", evaluate(`(() => {const r=applyDefensiveRunnerOutcome({runnersBefore:["B","B",null],batterId:"A",route:"controlledNoThrow",resultCode:"error"});const ids=r.runnersAfter.filter(Boolean);return ids.length===new Set(ids).size;})()`));
verify("17. 滿壘失誤的得分跑者會離開壘包並保留 scoring identity", evaluate(`(() => {const r=applyDefensiveRunnerOutcome({runnersBefore:["B","C","D"],batterId:"A",route:"controlledNoThrow",resultCode:"error"});return r.scoringRunnerIds.join()==="D"&&!r.runnersAfter.includes("D")&&r.runnerChanges.some(c=>c.runnerId==="D"&&c.to==="home");})()`));
verify("18. 實際空壘 infield error resolution 不會生出第二位跑者", evaluate(`(() => {const m=__infield221();const r=resolveHighSchoolDefensivePlay(m,"secure",0);applyInfieldResolutionToHighSchoolMatch(m,"secure",r);return r.error&&m.runners.filter(Boolean).length===1&&m.runners[0]===m.rosters.away.lineup[3].id;})()`));

verify("19. 空壘 information adapter 不產生 runner cue", evaluate(`(() => {const m=__infield221();const i=adaptInfieldInformation(m.defensiveSituation,player);return i.runnerCue===""&&!i.readCue.includes("跑者");})()`));
verify("20. 空壘 observable cues 只談打者、球況與接傳", evaluate(`(() => {const m=__infield221();const text=getHighSchoolDefensiveObservation(m).cues.join("|");return !["壘上跑者","前位跑者","跑者提前","牽制"].some(x=>text.includes(x));})()`));
verify("21. 空壘 Coach direction 不要求處理前位跑者", evaluate(`(() => {const m=__infield221();const t=formatHighSchoolCoachTacticalDirection(deriveHighSchoolCoachTacticalDirection(m),m);return !["前位跑者","三壘跑者","封殺點"].some(x=>t.includes(x));})()`));
verify("22. 空壘 choices 不提供 runner-only action", evaluate(`(() => {const c=getHighSchoolDefensiveMomentChoices(__infield221());const text=c.map(x=>x.text).join("|");return !["二壘封殺","三壘封殺","本壘","前位跑者","壓住跑者"].some(x=>text.includes(x));})()`));
verify("23. 有跑者時仍顯示腳程、force 與唯一合法二壘處理路線", evaluate(`(() => {const m=__infield221(["away-sim-2",null,null]);const i=adaptInfieldInformation(m.defensiveSituation,player);const c=getHighSchoolDefensiveMomentChoices(m);return i.runnerCue.includes("一壘跑者腳程")&&m.defensiveSituation.forceState.forceAtSecond&&c.filter(x=>x.action==="throwSecond"&&x.targetBase==="secondThenFirst").length===1;})()`));
verify("24. 空壘失誤 presentation 只說打者上一壘", evaluate(`(() => {const m=__infield221();const r=resolveHighSchoolDefensivePlay(m,"secure",0);const t=presentInfieldDecision(m.defensiveSituation,r,"secure").outcome;return t.includes("打者趁機安全上一壘")&&!t.includes("打者與跑者")&&!t.includes("跑者都安全");})()`));
verify("25. 一壘有人失誤 presentation 依 runnerChanges 說明推進", evaluate(`(() => {const m=__infield221(["away-sim-2",null,null]);const r=resolveHighSchoolDefensivePlay(m,"secure",0);const t=presentInfieldDecision(m.defensiveSituation,r,"secure").outcome;return t.includes("一壘跑者從一壘推進到二壘")&&t.includes("打者趁機安全上一壘");})()`));

verify("26. single commentary 使用一壘安打", evaluate(`(() => {const x=__event221("single");return formatMatchSimulationEvent(x.event,x.match).text.includes("一壘安打");})()`));
verify("27. double commentary 使用二壘安打", evaluate(`(() => {const x=__event221("double");return formatMatchSimulationEvent(x.event,x.match).text.includes("二壘安打");})()`));
verify("28. triple commentary 使用三壘安打", evaluate(`(() => {const x=__event221("triple");return formatMatchSimulationEvent(x.event,x.match).text.includes("三壘安打");})()`));
verify("29. home-run commentary 使用全壘打", evaluate(`(() => {const x=__event221("homeRun");return formatMatchSimulationEvent(x.event,x.match).text.includes("全壘打");})()`));
verify("30. runner advancement 明確寫出起點與終點", evaluate(`(() => {const x=__event221("single",{before:["away-sim-2",null,null],after:["away-sim-1","away-sim-2",null],changes:[{runnerId:"away-sim-2",from:1,to:2},{runnerId:"away-sim-1",from:"batter",to:1}]});const t=formatMatchSimulationEvent(x.event,x.match).text;return t.includes("從一壘推進到二壘");})()`));
verify("31. scoring commentary 明確說回本壘得分並使用真實比分", evaluate(`(() => {const x=__event221("double",{before:[null,"away-sim-2",null],after:[null,"away-sim-1",null],changes:[{runnerId:"away-sim-2",from:2,to:"home"},{runnerId:"away-sim-1",from:"batter",to:2}],scoring:["away-sim-2"],runs:1,scores:{home:0,away:1}});const t=formatMatchSimulationEvent(x.event,x.match).text;return t.includes("二壘安打")&&t.includes("回本壘得分")&&t.includes("1：0");})()`));
verify("32. commentary 不捏造方向、三振或不存在的比分", evaluate(`(() => {const x=__event221("out");const t=formatMatchSimulationEvent(x.event,x.match).text;return !["左外野","右外野","中外野","三振","1：0"].some(raw=>t.includes(raw));})()`));
verify("33. generic roster identity 使用棒次名字而不是只稱打者", evaluate(`(() => {const x=__event221("single");const t=formatMatchSimulationEvent(x.event,x.match).text;return t.includes(x.match.rosters.away.lineup[0].name)&&!t.includes("對方打者");})()`));
verify("34. full simulation 在多個 decision／PA／side-change boundary 保持 invariant", evaluate(`(() => {const m=__setup221(77881);let safety=0;while(!m.completed&&safety++<500){if(isHighSchoolMatchDecisionVisible(m)){const c=getHighSchoolYearOneMatchMomentChoices(m)[0];resolveHighSchoolYearOneMatch(c.matchDecision,c.matchMomentId,()=>.65);}else advanceHighSchoolMatchPlaybackStep(m);if(getHighSchoolMatchStateIntegrityIssues(m).length)return false;}return safety>20;})()`));
verify("35. runner scoring bookkeeping event 保留但不重複顯示於 Feed", evaluate(`(() => {const m=__setup221();m.runners=[null,null,"away-sim-3"];const b=getHighSchoolMatchLineupBatter(m,"away");const before={outs:0,scores:{...m.scores},runners:m.runners.slice()};const facts=applyHighSchoolSimulatedPlateAppearance(m,"single",b.id,"away");recordHighSchoolMatchSimulationEvent(m,{type:"plateAppearance",inning:1,half:"上",offenseTeam:"away",batterId:b.id,result:"single",runsBattedIn:1,runnerChanges:facts.runnerChanges,scoringRunnerIds:facts.scoringRunnerIds,before,after:{outs:m.outs,scores:{...m.scores},runners:m.runners.slice()}});m.presentedEventCursor=m.simulationLog.length;const feed=getHighSchoolMatchLiveFeed(m,0);return m.simulationLog.some(e=>e.type==="run"&&e.presentationImportance==="hidden")&&feed.filter(e=>e.text.includes("回本壘得分")).length===1;})()`));
verify("36. save normalization 深層保存 runnerChanges 與 scoring identity", evaluate(`(() => {const m=__infield221(["away-sim-2",null,null]);const r=resolveHighSchoolDefensivePlay(m,"secure",0);applyInfieldResolutionToHighSchoolMatch(m,"secure",r);const saved=JSON.parse(JSON.stringify(player));const restored=normalizeSave(saved);const event=restored.highSchoolMatch.simulationLog.find(e=>e.type==="meaningfulMomentResolved");const same=JSON.stringify(event.runnerChanges)===JSON.stringify(m.simulationLog.find(e=>e.type==="meaningfulMomentResolved").runnerChanges);saved.highSchoolMatch.simulationLog.find(e=>e.type==="meaningfulMomentResolved").runnerChanges[0].to="tampered";return same&&event.runnerChanges[0].to!=="tampered";})()`));

console.log(`\nBaseball Match Foundation 2.2.1：${passed}/${passed} 通過`);
