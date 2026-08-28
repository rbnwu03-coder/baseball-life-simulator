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
    console,
    module: { exports: {} },
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
    function __setup22(role="starter", seed=22001) {
      stopHighSchoolMatchPlayback();
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      player=createInitialPlayer("2.2 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode=role;
      player.highSchoolTeamRole=role;
      pendingHighSchoolMatchSimulationSeed=seed;
      return prepareHighSchoolYearOneMatch();
    }
    function __run22(role="starter", seed=22001, limit=1400) {
      const match=__setup22(role,seed);
      let safety=0;
      while(!match.completed&&safety++<limit){
        if(isHighSchoolMatchDecisionVisible(match)){
          const choice=getHighSchoolYearOneMatchMomentChoices(match)[0];
          resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.62);
        }else{
          advanceHighSchoolMatchPlaybackStep(match);
        }
      }
      return {match,safety};
    }
    function __toFirstDecision22(role="starter",seed=22001){
      const match=__setup22(role,seed);
      let safety=0;
      while(!isHighSchoolMatchDecisionVisible(match)&&safety++<300)advanceHighSchoolMatchPlaybackStep(match);
      return match;
    }
    function __finishSettlement22(match){
      let safety=0;
      while(!match.completed&&safety++<20)advanceHighSchoolMatchPlaybackStep(match);
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

verify("1. 正式比賽從一局上、0 OUT、空壘、0：0 開始", evaluate(`(() => {const m=__setup22();return m.inning===1&&m.half==="上"&&m.outs===0&&m.runners.every(x=>x===null)&&m.scores.home===0&&m.scores.away===0;})()`));
verify("2. 正式開場沒有預填逐局比分", evaluate(`(() => {const m=__setup22();return m.lineScore.home.length===0&&m.lineScore.away.length===0;})()`));
verify("3. production match initialization 不再含 preset line-score helper", !fs.readFileSync(path.join(root, "script.js"), "utf8").includes("createHighSchoolMatchInitialLineScore"));
verify("4. 主客隊都建立九人且持續的打序", evaluate(`(() => {const m=__setup22();return m.rosters.home.lineup.length===9&&m.rosters.away.lineup.length===9;})()`));
verify("5. player.highSchoolMatch 是唯一正式比賽 owner", evaluate(`(() => {const m=__setup22();return player.highSchoolMatch===m&&!player.fullMatchSimulator2&&!player.liveMatchState2&&!player.historicalMatchState;})()`));
verify("6. 第一個一般打席由 simulator 改變出局／壘況並推進棒次", evaluate(`(() => {const m=__setup22();const before=m.battingOrderIndex.away;let r;do{r=advanceHighSchoolMatchPlaybackStep(m);}while(r&&m.battingOrderIndex.away===before);return m.battingOrderIndex.away===(before+1)%9&&m.simulationLog.some(e=>e.type==="plateAppearance");})()`));
verify("7. 半局由實際 PA 走到三出局並換邊", evaluate(`(() => {const m=__setup22();let n=0;while(m.half==="上"&&n++<120)advanceHighSchoolMatchPlaybackStep(m);return m.half==="下"&&m.simulationLog.filter(e=>e.inning===1&&e.half==="上"&&e.type==="plateAppearance").length>0&&m.simulationLog.some(e=>e.type==="halfInningEnd")&&m.simulationLog.some(e=>e.type==="sideChange");})()`));
verify("8. 打序跨半局持續而不重設", evaluate(`(() => {const m=__setup22();let n=0;while(!(m.inning===2&&m.half==="上")&&n++<240)advanceHighSchoolMatchPlaybackStep(m);return m.inning===2&&m.battingOrderIndex.away!==0;})()`));
verify("9. 跑者在 walk 後保留 identity，下一棒 single 後連續推進", evaluate(`(() => {const m=__setup22();m.half="下";m.offenseTeam="home";m.defenseTeam="away";m.currentBatter=m.rosters.home.lineup[1].id;m.battingOrderIndex.home=1;resolveSimulatedHighSchoolPlateAppearance(m,()=>.64);const a=m.runners[0];resolveSimulatedHighSchoolPlateAppearance(m,()=>.77);return a&&m.runners[1]===a&&m.runners[0]===m.rosters.home.lineup[2].id;})()`));
verify("10. line score 只在模擬半局進行後生成", evaluate(`(() => {const m=__setup22();let n=0;while(m.half==="上"&&n++<120)advanceHighSchoolMatchPlaybackStep(m);return m.lineScore.away.length===1&&Number.isInteger(m.lineScore.away[0]);})()`));
verify("11. 七局正式比賽可以完整結束", evaluate(`(() => {const r=__run22();return r.match.completed&&r.match.inning>=7&&r.safety<1400&&r.match.half==="終";})()`));
verify("12. 完整比賽逐局加總等於終場比分", evaluate(`(() => {const m=__run22().match;const sum=a=>a.reduce((s,x)=>s+(Number(x)||0),0);return sum(m.lineScore.home)===m.scores.home&&sum(m.lineScore.away)===m.scores.away;})()`));
verify("13. 七局上結束且主隊領先時跳過七局下", evaluate(`(() => {const m=__setup22();Object.assign(m,{inning:7,half:"上",offenseTeam:"away",defenseTeam:"home",outs:3,scores:{home:3,away:1},simulationPhase:"moment_3_resolved"});m.lineScore={home:[0,1,0,1,0,1],away:[0,0,0,1,0,0]};__finishSettlement22(m);return m.completed&&m.lineScore.home[6]===null&&!m.simulationLog.some(e=>e.inning===7&&e.half==="下"&&e.type==="plateAppearance");})()`));
verify("14. 七局下超前會立即形成 walk-off", evaluate(`(() => {const m=__setup22();Object.assign(m,{inning:7,half:"下",offenseTeam:"home",defenseTeam:"away",outs:1,scores:{home:2,away:1},simulationPhase:"moment_3_resolved"});m.lineScore={home:[0,0,0,0,0,0,2],away:[0,0,0,0,0,0,1]};__finishSettlement22(m);return m.completed&&m.simulationLog.some(e=>e.type==="walkOff");})()`));
verify("15. 七局下打完同分會進入延長賽", evaluate(`(() => {const m=__setup22();Object.assign(m,{inning:7,half:"下",offenseTeam:"home",defenseTeam:"away",outs:3,scores:{home:2,away:2},simulationPhase:"moment_3_resolved"});m.lineScore={home:[0,0,0,0,0,0,2],away:[0,0,0,0,0,0,2]};let n=0;while(!(m.inning===8&&m.half==="上")&&n++<20)advanceHighSchoolMatchPlaybackStep(m);return !m.completed&&m.inning===8&&m.half==="上";})()`));
verify("16. 先發球員從開賽就在打序與守備配置中", evaluate(`(() => {const m=__setup22("starter");return m.playerLineupStatus==="starter"&&m.playerEntryCompleted&&m.playerLineupSlot>=0&&m.playerFieldingAssignment;})()`));
verify("17. 板凳球員未登場前比賽仍持續模擬", evaluate(`(() => {const m=__setup22("bench");let n=0;while(m.inning<2&&n++<200)advanceHighSchoolMatchPlaybackStep(m);return m.inning>=2&&m.playerLineupStatus==="bench"&&!m.playerEntryCompleted&&!m.rosters.home.lineup.some(x=>x.id==="player");})()`));
verify("18. 板凳登場沿用當下比分、出局與跑者", evaluate(`(() => {const m=__setup22("bench");Object.assign(m,{inning:5,half:"下",offenseTeam:"home",defenseTeam:"away",outs:1,scores:{home:2,away:3},runners:["home-sim-2",null,"home-sim-4"]});const truth=JSON.stringify({i:m.inning,h:m.half,o:m.outs,s:m.scores,r:m.runners});enterHighSchoolMatchPlayer(m);return truth===JSON.stringify({i:m.inning,h:m.half,o:m.outs,s:m.scores,r:m.runners})&&m.playerLineupStatus==="substitute"&&m.rosters.home.lineup[m.playerLineupSlot].id==="player"&&m.playerFieldingAssignment;})()`));
verify("19. 登場事件保存 live-state snapshot", evaluate(`(() => {const m=__setup22("rotation");Object.assign(m,{inning:4,half:"下",offenseTeam:"home",defenseTeam:"away",outs:2,scores:{home:1,away:2},runners:[null,"home-sim-3",null]});const e=enterHighSchoolMatchPlayer(m);return e.type==="playerEntry"&&e.presentationSnapshot.inning===4&&e.presentationSnapshot.outs===2&&e.presentationSnapshot.runners[1]==="home-sim-3"&&e.presentationSnapshot.scores.away===2;})()`));
verify("20. 第一個玩家時刻在 simulator 解球前攔截", evaluate(`(() => {const m=__toFirstDecision22();const e=m.performanceEvidence.player;return m.simulationPhase==="moment_1_ready"&&m.currentBatter==="player"&&(!e||e.plateAppearances===0)&&m.simulationLog.at(-1).type==="meaningfulMomentReached";})()`));
verify("21. 玩家決策寫回同一份 match truth", evaluate(`(() => {const m=__toFirstDecision22();const before={ref:player.highSchoolMatch,order:m.battingOrderIndex.home,log:m.simulationLog.length};const c=getHighSchoolYearOneMatchMomentChoices(m)[0];resolveHighSchoolYearOneMatch(c.matchDecision,c.matchMomentId,()=>.62);return player.highSchoolMatch===before.ref&&m.completedMoments.length===1&&m.battingOrderIndex.home===(before.order+1)%9&&m.performanceEvidence.player.plateAppearances===1&&m.simulationLog.length>before.log;})()`));
verify("22. 決策後 simulator 從結果狀態繼續下一棒", evaluate(`(() => {const m=__toFirstDecision22();const c=getHighSchoolYearOneMatchMomentChoices(m)[0];resolveHighSchoolYearOneMatch(c.matchDecision,c.matchMomentId,()=>.62);const log=m.simulationLog.length;let n=0;while(m.simulationLog.length===log&&n++<20)advanceHighSchoolMatchPlaybackStep(m);return m.simulationLog.length>log&&m.simulationPhase!=="moment_1_ready";})()`));
verify("23. 進攻 proof moments 與實際防守 Decisions 都從同一場 live match 完成", evaluate(`(() => {const m=__run22().match;const ids=m.completedMoments.map(x=>x.id);return ids.includes(highSchoolYearOneMomentIds[0])&&ids.includes(highSchoolYearOneMomentIds[2])&&new Set(ids).size===ids.length&&m.completedMoments.filter(x=>x.domain==="defense").length===m.matchDecisionDensityState.defensiveMeaningfulDecisionCount&&m.completedMoments.every(x=>x.inning>=1);})()`));
verify("24. NPC 打席累積可供敘事引用的表現證據", evaluate(`(() => {const m=__run22().match;const ids=Object.keys(m.performanceEvidence).filter(id=>id!=="player");return ids.length>0&&ids.some(id=>m.performanceEvidence[id].plateAppearances>0)&&ids.some(id=>m.performanceEvidence[id].hits+m.performanceEvidence[id].walks>0);})()`));
verify("25. 相同 seed 可重現相同正式模擬", evaluate(`(() => {const a=__run22("starter",99173).match;const sa=JSON.stringify({s:a.scores,l:a.lineScore,p:a.simulationLog.filter(e=>e.type==="plateAppearance").map(e=>e.result)});const b=__run22("starter",99173).match;return sa===JSON.stringify({s:b.scores,l:b.lineScore,p:b.simulationLog.filter(e=>e.type==="plateAppearance").map(e=>e.result)});})()`));
verify("26. 不同 seed 可產生不同前段比賽流", evaluate(`(() => {const seq=s=>__run22("starter",s).match.simulationLog.filter(e=>e.type==="plateAppearance").slice(0,12).map(e=>e.result).join();return seq(1103)!==seq(880301);})()`));
verify("27. simulator 隨機取樣集中由 match RNG adapter 管理", evaluate(`(() => {const source=${JSON.stringify(fs.readFileSync(path.join(root, "script.js"), "utf8"))};const body=source.slice(source.indexOf("function resolveSimulatedHighSchoolPlateAppearance"),source.indexOf("function endHighSchoolMatchHalfInning"));return !body.includes("Math.random")&&body.includes("nextHighSchoolMatchSimulationRandom");})()`));
verify("28. flow／attention／decision 具有不同播放節奏", evaluate(`(() => {const m=__setup22();m.simulationLog.push({presentationImportance:"flow",presentationSnapshot:{}});m.presentedEventCursor=m.simulationLog.length;const flow=getHighSchoolMatchPlaybackDelay(m);m.simulationLog.push({presentationImportance:"attention",presentationSnapshot:{}});m.presentedEventCursor=m.simulationLog.length;const attention=getHighSchoolMatchPlaybackDelay(m);m.simulationPhase="moment_1_ready";return flow>=800&&flow<=1500&&attention>=1500&&attention<=3000&&isHighSchoolMatchDecisionVisible(Object.assign(m,{simulationLog:[{type:"meaningfulMomentReached",momentId:m.currentMomentId,presentationImportance:"attention",presentationSnapshot:{}}],presentedEventCursor:1}));})()`));
verify("29. 中場存讀檔保留完整 live match 與 RNG 游標", evaluate(`(() => {const m=__setup22("starter",73001);let n=0;while(!(m.inning>=3&&m.half==="上")&&n++<500){if(isHighSchoolMatchDecisionVisible(m)){const c=getHighSchoolYearOneMatchMomentChoices(m)[0];resolveHighSchoolYearOneMatch(c.matchDecision,c.matchMomentId,()=>.62);}else advanceHighSchoolMatchPlaybackStep(m);}const before=JSON.stringify({i:m.inning,h:m.half,o:m.outs,r:m.runners,s:m.scores,l:m.lineScore,b:m.battingOrderIndex,ro:m.rosters,ls:m.playerLineupStatus,f:m.playerFieldingAssignment,log:m.simulationLog,c:m.presentedEventCursor,rng:m.simulationCursor,e:m.performanceEvidence});player=normalizeSave(JSON.parse(JSON.stringify(player)));const x=player.highSchoolMatch;return before===JSON.stringify({i:x.inning,h:x.half,o:x.outs,r:x.runners,s:x.scores,l:x.lineScore,b:x.battingOrderIndex,ro:x.rosters,ls:x.playerLineupStatus,f:x.playerFieldingAssignment,log:x.simulationLog,c:x.presentedEventCursor,rng:x.simulationCursor,e:x.performanceEvidence});})()`));
verify("30. 板凳登場後存讀檔不會重複替換打序", evaluate(`(() => {const m=__setup22("bench");Object.assign(m,{inning:5,half:"下",offenseTeam:"home",defenseTeam:"away",outs:1});enterHighSchoolMatchPlayer(m);const slot=m.playerLineupSlot;player=normalizeSave(JSON.parse(JSON.stringify(player)));const x=prepareHighSchoolYearOneMatch();return x.playerEntryCompleted&&x.playerLineupStatus==="substitute"&&x.playerLineupSlot===slot&&x.rosters.home.lineup.filter(p=>p.id==="player").length===1;})()`));
verify("31. Full Match Test Mode 已提供直接入口", fs.readFileSync(path.join(root, "index.html"), "utf8").includes('data-development-entry="highSchoolFullMatch"'));
verify("32. Full Match Test Mode 仍走正式 prepare 與 live simulation", evaluate(`(() => {pendingHighSchoolFullMatchTest=true;const m=__setup22();m.developmentFullMatchStart=true;return m.simulationPhase==="full_match_flow"&&m.scores.home===0&&m.scores.away===0&&m.simulationLog.length===1&&m.simulationLog[0].type==="matchEntry";})()`));
verify("33. 板凳開場文字不會偽稱玩家已進入打序或守位", evaluate(`(() => {const m=__setup22("bench");const text=getHighSchoolYearOneMatchPresentation();return m.playerLineupStatus==="bench"&&text.includes("目前守位：板凳待命")&&text.includes("尚未被叫進打序或守備位置")&&!text.includes("教練叫你拿起球棒");})()`));

console.log(`\nBaseball Match Foundation 2.2：${passed}/${passed} 通過`);
