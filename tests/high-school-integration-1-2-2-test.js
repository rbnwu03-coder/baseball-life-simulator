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
    window: { setTimeout(callback) { callback(); return 1; } }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    function __setup122(role="starter", position="內野手", level=10) {
      player=createInitialPlayer("1.2.2 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,position,position==="內野手"?["外野手"]:[]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode=role;
      player.highSchoolTeamRole=role==="starter"?"先發／關鍵任務":role==="rotation"?"輪替／替補任務":"發展／板凳任務";
      Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=level);
      Object.assign(player,{ballSense:level,observe:level,fitness:level,instinct:level,discipline:level,responsibility:level});
      pendingHighSchoolMatchSimulationSeed=12201;
      pendingHighSchoolMatchPositionOverride=position==="內野手"?"二壘手":"";
      const match=prepareHighSchoolYearOneMatch();
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      return match;
    }
    function __resolve122(decision, sample=0.99) {
      let safety=0;
      while(!isHighSchoolMatchDecisionVisible(player.highSchoolMatch)&&isHighSchoolMatchPlaybackPhase(player.highSchoolMatch)&&safety++<400) advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);
      const choices=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch);
      const choice=choices.find(item=>item.matchDecision===decision)||choices[0];
      return choice ? resolveHighSchoolYearOneMatch(choice.matchDecision,getHighSchoolYearOneMomentId(),()=>sample) : false;
    }
    function __resolveAdvance122(decision, sample=0.99) {
      const result=__resolve122(decision,sample);
      if(result) advanceHighSchoolMatchSimulation(player.highSchoolMatch);
      return result;
    }
    function __complete122(role="starter", sample=0.99) {
      const match=__setup122(role); let safety=0;
      while(!match.completed&&safety++<1200){
        if(isHighSchoolMatchDecisionVisible(match)){
          const choices=getHighSchoolYearOneMatchMomentChoices(match);
          const choice=choices.find(item=>item.matchDecision===(match.currentDomain==="defense"?"secure":"zone"))||choices[0];
          if(!choice||!resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>sample))break;
        }else if(isHighSchoolMatchPlaybackPhase(match)) advanceHighSchoolMatchSimulation(match);
        else break;
      }
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

verify("1. authoritative match state 保存 regulation、line score、event log、feed cursor 與 tactical direction", evaluate(`(() => {
  const match=__setup122();return match.regulationInnings===7&&Array.isArray(match.lineScore.home)&&Array.isArray(match.lineScore.away)&&Array.isArray(match.simulationLog)&&match.presentedEventCursor===0&&typeof match.coachTacticalDirection==="object";
})()`));

verify("2. Presentation Model 為 derived readonly view，不建立第二份 match truth", evaluate(`(() => {
  const match=__setup122();const before=JSON.stringify(match);const model=getHighSchoolMatchPresentation(match);return Object.isFrozen(model)&&Object.isFrozen(model.scoreboard)&&Object.isFrozen(model.currentSituation)&&JSON.stringify(match)===before&&player.highSchoolMatch===match&&player.presentationMatchState===undefined;
})()`));

const entryLineScores = parse(`(() => ["starter","rotation","bench"].map(role=>{const match=__setup122(role);return {role,inning:match.inning,scores:match.scores,lineScore:match.lineScore,history:match.matchEntryHistory};}))()`);
verify("3. Starter／Rotation／Bench 都從空白逐局表與一局上 live truth 開始", entryLineScores.every(item => item.inning === 1 && item.lineScore.home.length === 0 && item.lineScore.away.length === 0 && item.history));
verify("4. 三種角色開場逐局加總都等於 0：0 authoritative score", entryLineScores.every(item => item.lineScore.home.reduce((a, b) => a + (b || 0), 0) === item.scores.home && item.lineScore.away.reduce((a, b) => a + (b || 0), 0) === item.scores.away));

verify("5. runner scoring 同步增加當局 line score 與總比分", evaluate(`(() => {
  const match=__setup122("rotation");const total=match.scores.home;const inningRun=match.lineScore.home[match.inning-1]||0;scoreHighSchoolMatchRunner(match,"player","home","test");return match.scores.home===total+1&&match.lineScore.home[match.inning-1]===inningRun+1;
})()`));

verify("6. half-inning transition 寫入正確 inning／half／runsScored", evaluate(`(() => {
  const match=__setup122("starter");match.inning=4;match.half="上";match.offenseTeam="away";match.defenseTeam="home";match.outs=3;match.lineScore.away=[1,0,0,2];match.scores.away=3;endHighSchoolMatchHalfInning(match);const event=match.simulationLog.findLast(item=>item.type==="halfInningEnd");return event.inning===4&&event.half==="上"&&event.runsScored===2&&match.inning===4&&match.half==="下";
})()`));

const finalLineScores = parse(`(() => ["starter","rotation","bench"].map(role=>{const match=__complete122(role);return {role,inning:match.inning,scores:match.scores,lineScore:match.lineScore};}))()`);
verify("7. 終場逐局加總與 final score 完全一致", finalLineScores.every(item => item.lineScore.home.reduce((a, b) => a + (b || 0), 0) === item.scores.home && item.lineScore.away.reduce((a, b) => a + (b || 0), 0) === item.scores.away));
verify("7a. 終場實際進行過的局數都有正式 line-score cell", finalLineScores.every(item => item.lineScore.home.length >= item.inning && item.lineScore.away.length >= item.inning));

verify("8. 七局記分板正確 render 1–7 與 R", evaluate(`(() => {
  __setup122();const html=renderHighSchoolYearOneScore();return html.includes("7 局記分板")&&[1,2,3,4,5,6,7].every(i=>html.includes('<th scope="col">'+i+'</th>'))&&html.includes('<th scope="col">R</th>');
})()`));

verify("9. 額外局只擴充 presentation columns，不改 regulationInnings", evaluate(`(() => {
  const match=__setup122();match.inning=8;match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);match.lineScore.home.push(0,1,0,0);match.lineScore.away.push(0,0,0,1);recordHighSchoolMatchSimulationEvent(match,{type:"fixtureState",inning:match.inning,half:match.half,outs:match.outs,runners:match.runners,scores:match.scores});match.presentedEventCursor=match.simulationLog.length;const model=getHighSchoolMatchPresentation(match);return model.regulationInnings===7&&model.scoreboard.innings.length===8&&model.scoreboard.innings.at(-1)===8;
})()`));

verify("10. Current Situation 反映 presented snapshot 的 inning／half／score／outs／runners", evaluate(`(() => {
  const match=__setup122();match.inning=6;match.half="上";match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);match.outs=2;match.runners=["r1",null,"r3"];match.scores={home:2,away:3};recordHighSchoolMatchSimulationEvent(match,{type:"fixtureState",inning:match.inning,half:match.half,outs:match.outs,runners:match.runners,scores:match.scores});match.presentedEventCursor=match.simulationLog.length;const now=getHighSchoolMatchPresentation(match).currentSituation;return now.inning===6&&now.half==="上"&&now.outs===2&&now.score.home===2&&now.score.away===3&&now.runners.join()===match.runners.join();
})()`));

verify("11. Base 與 Outs UI 由 presented occupancy／outs 產生", evaluate(`(() => {
  const match=__setup122();match.runners=["r1",null,"r3"];match.outs=1;recordHighSchoolMatchSimulationEvent(match,{type:"fixtureState",inning:match.inning,half:match.half,outs:match.outs,runners:match.runners,scores:match.scores});match.presentedEventCursor=match.simulationLog.length;const model=getHighSchoolMatchPresentation(match);const html=renderHighSchoolLiveSituation(model);return model.bases.join() === [true,false,true].join()&&model.outs.join() === [true,false,false].join()&&(html.match(/base occupied/g)||[]).length===2&&(html.match(/out-light is-on/g)||[]).length===1;
})()`));

verify("12. 沒有合法 countContext 時不偽造 B／S 顯示", evaluate(`(() => {__setup122();const html=renderHighSchoolYearOneScore();return !html.includes("BALL")&&!html.includes("STRIKE")&&!html.includes("B/S");})()`));

verify("13. non-player PA 產生 simulator event 並可格式化成 feed", evaluate(`(() => {
  const match=__setup122("bench");match.half="下";match.offenseTeam="home";match.defenseTeam="away";match.battingOrderIndex.home=4;match.currentBatter=getHighSchoolMatchLineupBatter(match,"home").id;match.outs=0;const before=match.simulationLog.length;resolveSimulatedHighSchoolPlateAppearance(match,()=>0.8);const event=match.simulationLog.at(-1);const feed=formatMatchSimulationEvent(event,match);return match.simulationLog.length>before&&event.type==="plateAppearance"&&feed.type==="plateAppearance"&&feed.text.includes("安打");
})()`));

verify("14. 相同 Simulation Event 產生 deterministic 且保留 inning／actor／result 的文案", evaluate(`(() => {
  const match=__setup122();const event={type:"plateAppearance",sequence:5,inning:6,half:"下",batterId:"home-sim-2",result:"double",before:{outs:0,runners:[null,null,null]},after:{outs:0,runners:["b",null,null]}};const a=formatMatchSimulationEvent(event,match);const b=formatMatchSimulationEvent(event,match);return JSON.stringify(a)===JSON.stringify(b)&&a.text.includes("森")&&a.text.includes("二壘安打");
})()`));

verify("15. 玩家跑者推進事件在 feed 中可見且優先", evaluate(`(() => {
  const match=__setup122();match.simulationLog=[];recordHighSchoolMatchSimulationEvent(match,{type:"plateAppearance",inning:4,half:"下",batterId:"home-sim-2",result:"single",before:{outs:0,runners:["player",null,null]},after:{outs:0,runners:["b","player",null]}});const feed=getHighSchoolMatchLiveFeed(match,0);return feed[0].playerRelated&&feed[0].priority===5&&feed[0].text.includes("一壘推進到二壘");
})()`));

verify("16. 玩家得分事件明確顯示回本壘，不會只說一般得分", evaluate(`(() => {
  const match=__setup122();match.simulationLog=[];recordHighSchoolMatchSimulationEvent(match,{type:"run",inning:5,half:"下",team:"home",runnerId:"player",scores:{home:2,away:2}});const item=getHighSchoolMatchLiveFeed(match,0)[0];return item.playerRelated&&item.text.includes("你")&&item.text.includes("回本壘");
})()`));

verify("17. 玩家殘壘會在 half-inning ending feed 中說明", evaluate(`(() => {
  const match=__setup122();match.simulationLog=[];match.runners=[null,"player",null];match.outs=3;endHighSchoolMatchHalfInning(match);const event=match.simulationLog.find(item=>item.type==="halfInningEnd");return event.playerStranded&&formatMatchSimulationEvent(event,match).text.includes("留在壘上");
})()`));

verify("18. 第三個出局在 plate appearance feed 中可見", evaluate(`(() => {
  const match=__setup122();const item=formatMatchSimulationEvent({type:"plateAppearance",sequence:2,inning:4,half:"上",batterId:"away-sim-1",result:"out",before:{outs:2,runners:[]},after:{outs:3,runners:[]}},match);return item.thirdOut&&item.text.includes("第三個出局");
})()`));

verify("19. Side Change feed 顯示新半局與當前比分", evaluate(`(() => {
  const match=__setup122();const item=formatMatchSimulationEvent({type:"sideChange",inning:5,half:"下",scores:{home:2,away:3}},match);return item.text.includes("攻守交換")&&item.text.includes("5局下")&&item.text.includes("3：2");
})()`));

verify("20. Meaningful Moment arrival 以當前 assignment 銜接 Player Decision", evaluate(`(() => {
  const match=__setup122();__resolveAdvance122("zone",0.99);const event=match.simulationLog.findLast(item=>item.type==="meaningfulMomentReached");const feed=formatMatchSimulationEvent(event,match);return event.domain==="defense"&&feed.priority===5&&feed.text.includes(match.currentAssignment)&&feed.text.startsWith(match.outs+" 出局｜");
})()`));

verify("21. Game end event 與終場 feed 都由 simulator log 提供", evaluate(`(() => {
  const match=__complete122();const event=match.simulationLog.at(-1);return event.type==="gameEnd"&&formatMatchSimulationEvent(event,match).text.includes("比賽結束")&&formatMatchSimulationEvent(event,match).text.includes(event.scores.away+"："+event.scores.home);
})()`));

verify("22. Feed chunking 最多四則並優先保留 player／scoring／side-change／arrival", evaluate(`(() => {
  const match=__setup122();match.simulationLog=[];for(let i=0;i<6;i++)recordHighSchoolMatchSimulationEvent(match,{type:"plateAppearance",inning:3,half:"下",batterId:"home-sim-2",result:"out",before:{outs:0,runners:[]},after:{outs:1,runners:[]}});recordHighSchoolMatchSimulationEvent(match,{type:"run",inning:3,half:"下",team:"home",runnerId:"player",scores:{home:1,away:1}});recordHighSchoolMatchSimulationEvent(match,{type:"sideChange",inning:4,half:"上",scores:{home:1,away:1}});recordHighSchoolMatchSimulationEvent(match,{type:"meaningfulMomentReached",inning:4,half:"上",assignment:"下一個關鍵守備。"});const feed=getHighSchoolMatchLiveFeed(match,0);return feed.length<=4&&feed.some(i=>i.playerRelated)&&feed.some(i=>i.type==="sideChange")&&feed.some(i=>i.type==="meaningfulMomentReached");
})()`));

verify("23. Feed Truth：玩家只到二壘且零得分時不會誤報回本壘", evaluate(`(() => {
  const match=__setup122();match.simulationLog=[];recordHighSchoolMatchSimulationEvent(match,{type:"plateAppearance",inning:4,half:"下",batterId:"home-sim-3",result:"single",before:{outs:0,scores:{home:1,away:1},runners:["player",null,null]},after:{outs:0,scores:{home:1,away:1},runners:["b","player",null]}});const text=getHighSchoolMatchLiveFeed(match,0).map(i=>i.text).join(" ");return text.includes("二壘")&&!text.includes("回本壘")&&!text.includes("得分");
})()`));

verify("24. Coach Tactical Direction 是最小結構化 schema 且保留 presentation style", evaluate(`(() => {
  const direction=__setup122().coachTacticalDirection;return ["domain","intent","riskPreference","priority","sourceCoachId","presentationStyle"].every(key=>typeof direction[key]==="string"&&direction[key])&&direction.sourceCoachId==="high-school-head-coach"&&direction.presentationStyle==="detail-oriented";
})()`));

verify("25. Offense Moment 只產生合法 offensive tactical intent", evaluate(`(() => {
  const allowed=["createPressure","secureAdvance","controlledAttack","patientApproach"];const match=__setup122();const cases=[{scores:{home:0,away:2},runners:[null,null,null]},{scores:{home:1,away:2},runners:["r",null,null]},{scores:{home:2,away:2},runners:[null,"r",null]},{scores:{home:3,away:2},runners:[null,null,null]}];return cases.every(state=>{Object.assign(match,state,{currentDomain:"offense"});return allowed.includes(deriveHighSchoolCoachTacticalDirection(match).intent);});
})()`));

verify("26. Defense Moment 只產生合法 defensive tactical intent", evaluate(`(() => {
  const allowed=["secureOut","preventRun","attackLeadRunner","aggressiveOuts"];const match=__setup122();match.currentDomain="defense";return [[null,null,null],["r1",null,null],["r1","r2",null],[null,null,"r3"],["r1","r2","r3"]].every(runners=>{match.runners=runners;match.outs=1;return allowed.includes(deriveHighSchoolCoachTacticalDirection(match).intent);});
})()`));

verify("27. Tactical legality 涵蓋一二壘、三壘、滿壘、無人、兩出局、領先與落後", evaluate(`(() => {
  const match=__setup122();match.currentDomain="defense";match.outs=1;match.runners=["r1","r2",null];const force=deriveHighSchoolCoachTacticalDirection(match).intent==="aggressiveOuts";match.runners=[null,null,"r3"];const third=deriveHighSchoolCoachTacticalDirection(match).intent==="preventRun";match.runners=["r1","r2","r3"];const loaded=deriveHighSchoolCoachTacticalDirection(match).intent==="preventRun";match.runners=[null,null,null];const empty=deriveHighSchoolCoachTacticalDirection(match).intent==="secureOut";match.runners=["r1","r2",null];match.outs=2;const twoOut=deriveHighSchoolCoachTacticalDirection(match).intent==="secureOut";match.currentDomain="offense";match.outs=0;match.runners=[null,null,null];match.scores={home:1,away:3};const trail=deriveHighSchoolCoachTacticalDirection(match).intent==="controlledAttack";match.scores={home:3,away:1};const lead=deriveHighSchoolCoachTacticalDirection(match).intent==="createPressure";return force&&third&&loaded&&empty&&twoOut&&trail&&lead;
})()`));

verify("28. Tactical logic 與 character voice formatter 分離", evaluate(`(() => {
  const match=__setup122();const direction=deriveHighSchoolCoachTacticalDirection(match);const line=formatHighSchoolCoachTacticalDirection(direction,match);return typeof direction.intent==="string"&&typeof line==="string"&&line.length>0&&!line.includes(direction.intent)&&direction.presentationStyle==="detail-oriented";
})()`));

verify("29. secureOut 教練方向不會 filter 掉其他棒球合法高風險選項", evaluate(`(() => {
  const match=__setup122();match.momentIndex=1;match.currentDomain="defense";match.currentMomentId=getHighSchoolYearOneMomentId(match);match.runners=["r1","r2",null];match.outs=1;setHighSchoolCoachTacticalDirection(match);const choices=getHighSchoolDefensiveMomentChoices(match);return match.coachTacticalDirection.intent==="aggressiveOuts"&&choices.some(item=>item.matchDecision==="secure")&&choices.some(item=>item.matchDecision==="challenge")&&choices.some(item=>item.matchDecision==="lead");
})()`));

const normalizeProof = parse(`(() => {
  const match=__setup122();__resolveAdvance122("zone",0.99);match.presentedEventCursor=2;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;const proof={sameLine:JSON.stringify(restored.lineScore.home)===JSON.stringify(match.lineScore.home)&&JSON.stringify(restored.lineScore.away)===JSON.stringify(match.lineScore.away),sameLog:restored.simulationLog.length===match.simulationLog.length&&restored.simulationLog.every((event,index)=>event.type===match.simulationLog[index].type&&event.sequence===match.simulationLog[index].sequence&&event.inning===match.simulationLog[index].inning),sameTactical:JSON.stringify(restored.coachTacticalDirection)===JSON.stringify(match.coachTacticalDirection),cursor:restored.presentedEventCursor};restored.lineScore.home[0]=99;restored.simulationLog[0].type="changed";proof.deepLine=match.lineScore.home[0]!==99;proof.deepLog=match.simulationLog[0].type!=="changed";return proof;
})()`);
verify("30. normalizeSave 保存 line score 與 tactical direction", normalizeProof.sameLine && normalizeProof.sameTactical);
verify("31. normalizeSave 保存 event history 與 presented cursor", normalizeProof.sameLog && normalizeProof.cursor === 2);
verify("32. normalizeSave 對 line score 與 event history 做深層複製", normalizeProof.deepLine && normalizeProof.deepLog);

verify("33. Moment 1 feed save/load 不重複事件、比分與 presentation", evaluate(`(() => {
  const match=__setup122();__resolve122("zone",0.99);match.presentedEventCursor=match.simulationLog.length;advanceHighSchoolMatchSimulation(match);const before={scores:JSON.stringify(match.scores),home:JSON.stringify(match.lineScore.home),away:JSON.stringify(match.lineScore.away),logLength:match.simulationLog.length,eventTypes:match.simulationLog.map(event=>event.type).join(),cursor:match.presentedEventCursor,feed:JSON.stringify(getHighSchoolMatchLiveFeed(match))};player=normalizeSave(JSON.parse(JSON.stringify(player)));const restored=player.highSchoolMatch;return before.scores===JSON.stringify(restored.scores)&&before.home===JSON.stringify(restored.lineScore.home)&&before.away===JSON.stringify(restored.lineScore.away)&&before.logLength===restored.simulationLog.length&&before.eventTypes===restored.simulationLog.map(event=>event.type).join()&&before.cursor===restored.presentedEventCursor&&before.feed===JSON.stringify(getHighSchoolMatchLiveFeed(restored));
})()`));

verify("34. Side change 後 save/load 保留 inning／half 與逐局比分", evaluate(`(() => {
  const match=__setup122();match.inning=5;match.half="上";match.offenseTeam="away";match.defenseTeam="home";match.outs=3;match.lineScore.away=[1,0,0,0,2];match.scores.away=3;endHighSchoolMatchHalfInning(match);const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return match.inning===restored.inning&&match.half===restored.half&&JSON.stringify(match.scores)===JSON.stringify(restored.scores)&&JSON.stringify(match.lineScore.home)===JSON.stringify(restored.lineScore.home)&&JSON.stringify(match.lineScore.away)===JSON.stringify(restored.lineScore.away);
})()`));

verify("35. Moment 2 後 reload 保留 defense direction，下一段依 Regulation 抵達決策或終場", evaluate(`(() => {
  const match=__setup122();__resolveAdvance122("zone",0.99);const defenseIntent=match.coachTacticalDirection.intent;__resolve122("secure",0.99);match.presentedEventCursor=match.simulationLog.length;player=normalizeSave(JSON.parse(JSON.stringify(player)));const restored=player.highSchoolMatch;const preserved=restored.coachTacticalDirection.intent===defenseIntent;advanceHighSchoolMatchSimulation(restored);const feed=getHighSchoolMatchLiveFeed(restored);const nextType=feed.at(-1)?.type;return defenseIntent&&preserved&&["moment_2_ready","moment_3_ready","complete"].includes(restored.simulationPhase)&&feed.length>0&&["meaningfulMomentReached","gameEnd"].includes(nextType);
})()`));

verify("36. Flow Mode 同時包含比分、局勢、feed、目前打者與目前賽況，隱藏教練決策區", evaluate(`(() => {
  __setup122();renderHighSchoolYearOneMatch({title:"秋季交流賽"});const html=document.getElementById("story").innerHTML;return ["high-school-match-screen","match-scoreboard","match-live-situation","match-live-feed","match-flow-mode","match-current-batter","match-current-assignment"].every(token=>html.includes(token))&&!html.includes("coach-tactical-box");
})()`));

verify("37. 玩家可見 Match Screen 不洩漏 raw simulator identifier", evaluate(`(() => {
  const match=__setup122();__resolveAdvance122("zone",0.99);const html=renderHighSchoolYearOneScore()+getHighSchoolYearOneMatchPresentation();return !["home-sim-","away-sim-","simulationPhase","presentedEventCursor","high-school-head-coach","controlledAttack","hs_y1_match"].some(raw=>html.includes(raw));
})()`));

console.log(`\nHigh School Integration 1.2.2：${passed}/${passed} 通過`);
