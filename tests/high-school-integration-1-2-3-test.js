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
    function __setup123(level=6) {
      stopHighSchoolMatchPlayback();
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      player=createInitialPlayer("1.2.3 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode="starter";
      player.highSchoolTeamRole="先發／關鍵任務";
      Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=level);
      Object.assign(player,{ballSense:level,observe:level,fitness:level,instinct:level,discipline:level,responsibility:level});
      pendingHighSchoolMatchSimulationSeed=12301;
      const match=prepareHighSchoolYearOneMatch();
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      return match;
    }
    function __defense123(context="normalGrounder", level=6, batterSpeed=5, runnerSpeed=5) {
      const match=__setup123(level);
      Object.assign(match,{momentIndex:1,currentMomentId:highSchoolYearOneMomentIds[1],currentDomain:"defense",simulationPhase:"moment_2_ready",inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:1,runners:["away-sim-2","away-sim-3",null]});
      match.currentBatter="away-sim-4";
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(match.inning,match.half);
      getHighSchoolMatchSimulationEntity(match,match.currentBatter).speed=batterSpeed;
      getHighSchoolMatchSimulationEntity(match,match.runners[0]).speed=runnerSpeed;
      setHighSchoolDefensiveBallContext(match,context);
      match.currentAssignment=getHighSchoolDefensiveSituationText(match);
      setHighSchoolCoachTacticalDirection(match);
      recordHighSchoolMatchSimulationEvent(match,{type:"meaningfulMomentReached",momentId:match.currentMomentId,inning:match.inning,half:match.half,domain:match.currentDomain,assignment:match.currentAssignment,outs:match.outs,runners:match.runners,scores:match.scores});
      match.presentedEventCursor=match.simulationLog.length;
      return match;
    }
    function __distribution123(context, batterSpeed=5, runnerSpeed=5, level=6) {
      const match=__defense123(context,level,batterSpeed,runnerSpeed);
      const counts={twoOuts:0,oneOut:0,zeroOuts:0,error:0};
      for(let index=0;index<101;index+=1) counts[resolveHighSchoolDefensivePlay(match,"challenge",index/101).resultCode]+=1;
      return counts;
    }
    function __playOutAnchors123() {
      const match=__setup123(7);
      let safety=0;
      while(!isHighSchoolMatchDecisionVisible(match)&&safety++<300)advanceHighSchoolMatchPlaybackStep(match);
      resolveHighSchoolYearOneMatch("zone",getHighSchoolYearOneMomentId(match),()=>0.8);
      const states=[match.outs]; const results=[];
      safety=0;
      while(match.half==="下"&&safety<80){
        const result=advanceHighSchoolMatchPlaybackStep(match);
        results.push(result); states.push(match.outs); safety+=1;
        if(result==="decision"||result==="gameEnd") break;
      }
      return {states,results,half:match.half,events:match.simulationLog.map(event=>event.type),feed:getHighSchoolMatchLiveFeed(match,0).map(item=>item.text)};
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

const anchors = parse("__playOutAnchors123()");
verify("1. half-inning playback 會在一出局與兩出局形成節奏錨點", anchors.results.includes("outState") && anchors.states.includes(1) && anchors.states.includes(2));
verify("2. 第三出局後先呈現半局結束，再把 authoritative outs reset 為 0", anchors.results.includes("halfInningEnd") && anchors.half === "上" && anchors.states.at(-1) === 0);
verify("3. 半局結束與攻守交換都保留在 authoritative simulation log", anchors.events.includes("halfInningEnd") && anchors.events.includes("sideChange"));
verify("4. 出局 feed 使用自然語言標示 out state，不顯示逐球 count", evaluate(`(() => {const m=__setup123();const one=formatMatchSimulationEvent({type:"plateAppearance",inning:1,half:"上",batterId:"away-sim-1",result:"out",before:{outs:0,runners:[]},after:{outs:1,runners:[]}},m).text;const three=formatMatchSimulationEvent({type:"plateAppearance",inning:1,half:"上",batterId:"away-sim-1",result:"out",before:{outs:2,runners:[]},after:{outs:3,runners:[]}},m).text;return one.startsWith("1 出局｜")&&three.startsWith("3 出局｜")&&three.includes("半局結束")&&!["balls","strikes","B/S"].some(raw=>(one+three).includes(raw));})()`));
verify("5. Current Situation 的 OUT 燈可顯示到第三個出局", evaluate(`(() => {const m=__setup123();m.outs=2;recordHighSchoolMatchSimulationEvent(m,{type:"fixtureState",inning:m.inning,half:m.half,outs:m.outs,runners:m.runners,scores:m.scores});m.presentedEventCursor=m.simulationLog.length;const model=getHighSchoolMatchPresentation(m);const html=renderHighSchoolLiveSituation(model);return model.outs.join()==="true,true,false"&&html.includes("2 OUT")&&(html.match(/is-on/g)||[]).length===2;})()`));
verify("6. meaningful decision ready phase 不會被 playback step 跳過", evaluate(`(() => {const m=__defense123();const before=JSON.stringify(m);return advanceHighSchoolMatchPlaybackStep(m)===false&&JSON.stringify(m)===before;})()`));

verify("7. Ball Context schema 支援五種 ground-ball truth", evaluate(`["hardGrounder","normalGrounder","slowGrounder","deepGrounder","highChop"].every(type=>highSchoolBallContexts[type]&&highSchoolBallContexts[type].family==="groundBall"&&highSchoolBallContexts[type].label&&highSchoolBallContexts[type].timeWindow)`));
verify("8. 防守 Situation 持有 Ball Context，resolver 讀取相同 type", evaluate(`(() => {const m=__defense123("slowGrounder");const r=resolveHighSchoolDefensivePlay(m,"challenge",0.5);return m.ballContext.type==="slowGrounder"&&r.ballContext===m.ballContext.type;})()`));
verify("9. hard／slow／deep grounder 產生不同玩家可讀描述", evaluate(`(() => {const labels=["hardGrounder","slowGrounder","deepGrounder"].map(type=>{const m=__defense123(type);return renderHighSchoolOpponentInformation(getHighSchoolMatchPresentation(m));});return new Set(labels).size===3&&labels[0].includes("強勁正面滾地球")&&labels[1].includes("慢速滾地球")&&labels[2].includes("深處滾地球");})()`));
verify("10. Ball Context presentation 不顯示 raw speed 或 internal identifier", evaluate(`(() => {const m=__defense123("hardGrounder");const html=renderHighSchoolOpponentInformation(getHighSchoolMatchPresentation(m));return html.includes("球況：強勁正面滾地球")&&!html.includes("ballSpeed")&&!html.includes("hardGrounder")&&!html.includes("away-sim-");})()`));
verify("11. 打者投打側與腳程以玩家可讀文字呈現", evaluate(`(() => {const m=__defense123();const html=renderHighSchoolOpponentInformation(getHighSchoolMatchPresentation(m));return /(左打|右打|左右開弓)/.test(html)&&/(很快|快|普通|慢)/.test(html);})()`));

const hardAverage = parse('__distribution123("hardGrounder",5,5,6)');
const slowFast = parse('__distribution123("slowGrounder",9,5,6)');
const normalSlow = parse('__distribution123("normalGrounder",3,5,6)');
const normalFast = parse('__distribution123("normalGrounder",9,5,6)');
verify("12. 強勁正面球的雙殺分布明顯優於慢滾球＋快打者", hardAverage.twoOuts > slowFast.twoOuts + 35);
verify("13. 慢滾球＋快打者以 one-out partial 為主要結果", slowFast.oneOut > slowFast.twoOuts && slowFast.oneOut > slowFast.zeroOuts);
verify("14. batter speed 會實際改變第二段傳球分布", normalSlow.twoOuts > normalFast.twoOuts);
verify("15. relevant runner speed 會實際改變第一段封殺分布", evaluate(`(() => {const slow=__distribution123("normalGrounder",5,2,4);const fast=__distribution123("normalGrounder",5,10,4);return slow.twoOuts+slow.oneOut>fast.twoOuts+fast.oneOut||slow.error+slow.zeroOuts<fast.error+fast.zeroOuts;})()`));
verify("16. 深處滾地球搭配弱臂時第二段傳球風險上升", evaluate(`(() => {const m=__defense123("deepGrounder",6,5,5);player.baseballSkills.throwing=2;player.baseballSkills.armStrength=2;const weak=[];for(let i=0;i<101;i++)weak.push(resolveHighSchoolDefensivePlay(m,"challenge",i/101).resultCode);player.baseballSkills.throwing=9;player.baseballSkills.armStrength=9;const strong=[];for(let i=0;i<101;i++)strong.push(resolveHighSchoolDefensivePlay(m,"challenge",i/101).resultCode);return strong.filter(x=>x==="twoOuts").length>weak.filter(x=>x==="twoOuts").length;})()`));
verify("17. fielding／reaction 會改變第一段處理結果", evaluate(`(() => {const m=__defense123("normalGrounder",6,5,8);Object.assign(player.baseballSkills,{catching:2,reaction:2});const low=resolveHighSchoolDefensivePlay(m,"challenge",0.5);Object.assign(player.baseballSkills,{catching:10,reaction:10});const high=resolveHighSchoolDefensivePlay(m,"challenge",0.5);return high.firstStage>low.firstStage&&["twoOuts","oneOut"].includes(high.resultCode)&&["zeroOuts","error"].includes(low.resultCode);})()`));
verify("18. arm／throwing 會改變第二段傳球品質", evaluate(`(() => {const m=__defense123("deepGrounder");Object.assign(player.baseballSkills,{throwing:2});const low=resolveHighSchoolDefensivePlay(m,"challenge",0.5);Object.assign(player.baseballSkills,{throwing:10});const high=resolveHighSchoolDefensivePlay(m,"challenge",0.5);return high.secondStage>low.secondStage&&high.resultCode==="twoOuts"&&low.resultCode==="oneOut";})()`));
verify("19. 雙殺 resolver 正式區分 twoOuts／oneOut／zeroOuts／error", evaluate(`(() => {const codes=new Set();for(const level of [1,3,6,10])for(const type of ["hardGrounder","normalGrounder","slowGrounder","deepGrounder","highChop"]){const m=__defense123(type,level,9,9);for(const sample of [0,.25,.5,.75,.99])codes.add(resolveHighSchoolDefensivePlay(m,"challenge",sample).resultCode);}return ["twoOuts","oneOut","zeroOuts","error"].every(code=>codes.has(code));})()`));
verify("20. 合理雙殺判斷與執行品質分開記錄", evaluate(`(() => {const m=__defense123("slowGrounder",6,9,5);const r=resolveHighSchoolDefensivePlay(m,"challenge",0.5);return r.decisionQuality==="reasonableRisk"&&r.executionQuality==="partial"&&r.resultCode==="oneOut";})()`));
verify("21. primary／secondary cause 產生不同語意解釋", evaluate(`(() => {const a=getHighSchoolDefensiveCauseExplanation({primaryCause:"batterSpeed",secondaryCause:"slowGrounder"});const b=getHighSchoolDefensiveCauseExplanation({primaryCause:"armStrength",secondaryCause:"deepGrounder"});return a!==b&&a.includes("打者")&&b.includes("傳球速度");})()`));
verify("22. one-out partial outcome 明確說明已完成第一個封殺", evaluate(`(() => {const m=__defense123("slowGrounder",6,9,5);resolveHighSchoolYearOneMatch("challenge",m.currentMomentId,()=>0.5);const last=m.completedMoments.at(-1);return last.resultCode==="oneOut"&&last.outcome.includes("二壘封殺成功")&&last.consequence.includes("只完成一半")&&last.causeExplanation;})()`));

verify("23. Match Mode 形成 Scoreboard → Situation → Assignment → Coach → Choices 閱讀順序", evaluate(`(() => {const m=__defense123("hardGrounder");renderHighSchoolYearOneMatch({title:"秋季交流賽"});const story=document.getElementById("story").innerHTML;const choices=document.getElementById("choices").innerHTML;return story.includes("match-mode")&&story.indexOf("matchScoreboardTitle")<story.indexOf("matchSituationTitle")&&story.indexOf("matchSituationTitle")<story.indexOf("matchAssignmentTitle")&&story.indexOf("matchAssignmentTitle")<story.indexOf("coachTacticalTitle")&&choices.includes("matchDecisionTitle");})()`));
verify("24. Situation 集中呈現比分、出局、壘況、守位、打者與 Ball Context", evaluate(`(() => {const m=__defense123("deepGrounder");renderHighSchoolYearOneMatch({title:"秋季交流賽"});const html=document.getElementById("story").innerHTML;return ["matchSituationTitle","OUT","你的守位","打者：","球況：深處滾地球"].every(token=>html.includes(token));})()`));
verify("25. Coach 與 Player Choices 相鄰，Feed／舊回饋留在次要 context column", evaluate(`(() => {const m=__defense123();renderHighSchoolYearOneMatch({title:"秋季交流賽"},{bridgeOutHtml:'<aside id="oldRecall">舊系統回饋</aside>'});const story=document.getElementById("story").innerHTML;const choices=document.getElementById("choices").innerHTML;return story.includes("match-mode-context-column")&&story.includes("match-mode-decision-column")&&story.indexOf("oldRecall")<story.indexOf("match-mode-decision-column")&&story.lastIndexOf("coach-tactical-box")>story.lastIndexOf("match-observable-information")&&choices.includes("match-player-decisions");})()`));
verify("26. Choice 後固定以 Execution → Outcome → Cause → 場上回應呈現", evaluate(`(() => {__setup123();renderYouthSeasonOutcome("high_school_showcase",{text:"抓二壘再轉一壘",executionText:"接球後踩二壘再轉傳一壘。",memory:"二壘封殺成功，但一壘未趕上。",causeText:"打者起跑很快，第二段只差半步。"},"");const html=document.getElementById("story").innerHTML;return html.indexOf("你的執行")<html.indexOf("發生的結果")&&html.indexOf("發生的結果")<html.indexOf("為什麼會這樣")&&html.indexOf("為什麼會這樣")<html.indexOf("場上的回應")&&document.getElementById("choices").innerHTML.match(/<button/g).length===1;})()`));
verify("27. save normalization 深層保存 Ball Context 與防守原因", evaluate(`(() => {const m=__defense123("deepGrounder");resolveHighSchoolYearOneMatch("challenge",m.currentMomentId,()=>0.5);const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return restored.ballContext.type==="deepGrounder"&&restored.lastDefensiveResolution.primaryCause&&restored.completedMoments.at(-1).causeExplanation;})()`));
verify("28. match-mode-scoreboard 可作為未來獨立 Match Entry hook", evaluate(`(() => {const m=__defense123();const html=renderHighSchoolYearOneScore("header",getHighSchoolMatchPresentation(m));return html.includes("match-mode-scoreboard")&&!html.includes("match-live-grid");})()`));

console.log(`\nHigh School Integration 1.2.3：${passed}/28 通過`);
