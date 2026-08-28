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
    function __setup21(level=7) {
      stopHighSchoolMatchPlayback();
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      player=createInitialPlayer("2.1 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,"內野手",["外野手"]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode="starter";
      player.highSchoolTeamRole="先發／關鍵任務";
      pendingHighSchoolMatchSimulationSeed=21001;
      Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=level);
      Object.assign(player,{ballSense:level,observe:level,fitness:level,instinct:level,discipline:level,responsibility:level});
      return prepareHighSchoolYearOneMatch();
    }
    function __infield21(position="游擊手", type="normalGrounder", options={}) {
      const match=__setup21(options.level??7);
      Object.assign(match,{
        momentIndex:1,currentMomentId:highSchoolYearOneMomentIds[1],currentDomain:"defense",simulationPhase:"moment_2_ready",
        inning:options.inning??5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:options.outs??1,
        runners:(options.runners||["away-sim-2",null,null]).slice(),scores:{home:options.home??1,away:options.away??1},
        currentFieldingPosition:position,positionDecisionFamily:"",defensiveSituation:{}
      });
      match.currentBatter="away-sim-4";
      getHighSchoolMatchSimulationEntity(match,match.currentBatter).speed=options.batterSpeed??5;
      match.runners.forEach((runnerId,index)=>{if(runnerId)getHighSchoolMatchSimulationEntity(match,runnerId).speed=(options.runnerSpeeds||[])[index]??5;});
      setHighSchoolDefensiveBallContext(match,type);
      buildInfieldMeaningfulMoment(match,player,{
        playerPosition:position,
        ballDirection:options.direction,
        ballDepth:options.depth,
        batterSpeed:options.batterSpeed,
        runnerSpeeds:options.runnerSpeeds,
        playerCapabilities:options.capabilities,
        teammates:options.teammates
      });
      match.currentAssignment=getHighSchoolDefensiveSituationText(match);
      setHighSchoolCoachTacticalDirection(match);
      return match;
    }
    function __counts21(position,type,decision,options={}) {
      const counts={twoOuts:0,oneOut:0,zeroOuts:0,error:0};
      const details={};
      const causes={};
      for(let i=0;i<101;i+=1){
        const match=__infield21(position,type,options);
        const result=resolveHighSchoolDefensivePlay(match,decision,i/101);
        if(!result)continue;
        counts[result.resultCode]+=1;
        details[result.detailedResult]=(details[result.detailedResult]||0)+1;
        causes[result.primaryCause]=(causes[result.primaryCause]||0)+1;
      }
      return {counts,details,causes};
    }
    function __hasCause21(position,type,decision,options,cause) {
      for(let i=0;i<101;i+=1){
        const result=resolveHighSchoolDefensivePlay(__infield21(position,type,options),decision,i/101);
        if(result&&(result.primaryCause===cause||result.secondaryCause===cause))return true;
      }
      return false;
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

verify("1. shared Position Decision Family registry 具備六個正式 adapter", evaluate(`(() => {const f=getPositionDecisionFamily("infield");return ["buildSituation","adaptInformation","generateLegalChoices","resolve","analyzeCauses","present"].every(key=>typeof f[key]==="function");})()`));
verify("2. Infield family 只寫入 authoritative highSchoolMatch", evaluate(`(() => {const m=__infield21();return player.highSchoolMatch===m&&m.positionDecisionFamily==="infield"&&!player.infieldMatchState&&!player.defenseGameState;})()`));
verify("3. Situation Builder 從 live match 建立完整內野 truth", evaluate(`(() => {const s=__infield21("游擊手","normalGrounder").defensiveSituation;return s.playerPosition==="游擊手"&&s.outs===1&&s.runners[0]&&s.forceState.forceAtSecond&&s.batterSpeed&&s.scoreContext&&s.playerCapabilities;})()`));
verify("4. pace、direction、depth 保持三個可組合欄位", evaluate(`(() => {const s=__infield21("三壘手","slowGrounder",{direction:"lineSide",depth:"shallow"}).defensiveSituation;return s.ballContext.pace==="slow"&&s.ballDirection==="lineSide"&&s.ballDepth==="shallow";})()`));
verify("5. direction 會改變 first-step demand", evaluate(`(() => {const a=__infield21("游擊手","normalGrounder",{direction:"straightAtPlayer"}).defensiveSituation;const b=__infield21("游擊手","normalGrounder",{direction:"towardHole"}).defensiveSituation;return b.firstStepDemand>a.firstStepDemand&&b.windows.fielding<a.windows.fielding;})()`));
verify("6. depth 會分別改變 fielding 與 throw window", evaluate(`(() => {const a=__infield21("游擊手","normalGrounder",{depth:"normal"}).defensiveSituation;const b=__infield21("游擊手","deepGrounder",{depth:"deep"}).defensiveSituation;return b.firstStepDemand>a.firstStepDemand&&b.windows.throw<a.windows.throw;})()`));
verify("7. defensive windows 正式拆成 fielding／transfer／throw", evaluate(`(() => {const w=__infield21().defensiveSituation.windows;return ["fielding","transfer","throw"].every(key=>Number.isFinite(w[key]));})()`));
verify("8. routine ground ball family 可由 context 推導", evaluate(`__infield21("游擊手","normalGrounder").defensiveSituation.scenarioFamily==="routineGroundBall"`));
verify("9. slow roller family 可由 pace／shallow 推導", evaluate(`__infield21("三壘手","slowGrounder").defensiveSituation.scenarioFamily==="slowRoller"`));
verify("10. deep ground ball family 可由 depth 推導", evaluate(`__infield21("游擊手","deepGrounder").defensiveSituation.scenarioFamily==="deepGroundBall"`));
verify("11. runner on third／滿壘形成 lead-runner pressure", evaluate(`__infield21("三壘手","normalGrounder",{runners:["away-sim-2","away-sim-3","away-sim-5"]}).defensiveSituation.scenarioFamily==="leadRunnerPressure"`));

verify("12. 游擊手 routine force 可見雙殺與二壘路徑", evaluate(`(() => {const c=getHighSchoolDefensiveMomentChoices(__infield21("游擊手"));return c.some(x=>x.infieldRoute==="doublePlay")&&!c.some(x=>x.text.includes("踩二壘"));})()`));
verify("13. 二壘手 4-6-3 由玩家第一傳、游擊手補位轉傳", evaluate(`(() => {const c=getHighSchoolDefensiveMomentChoices(__infield21("二壘手", "normalGrounder", {direction:"upTheMiddle"}));const dp=c.find(x=>x.routeId==="initiate463");return dp&&dp.action==="throwSecond"&&dp.text.includes("傳二壘")&&dp.responsibilityChain.join(">")==="player>SS>1B"&&!c.some(x=>x.infieldRoute==="forceSecond");})()`));
verify("14. 三壘手 force-at-third 才能合法踩三壘", evaluate(`(() => {const none=getHighSchoolDefensiveMomentChoices(__infield21("三壘手"));const forced=getHighSchoolDefensiveMomentChoices(__infield21("三壘手","normalGrounder",{runners:["away-sim-2","away-sim-3",null]}));return !none.some(x=>x.text.includes("踩三壘"))&&forced.some(x=>x.infieldRoute==="forceThird"&&x.text.includes("踩三壘"));})()`));
verify("15. 一壘手使用唯一 3-6-3 路徑，不把期望結果拆成第二選項", evaluate(`(() => {const c=getHighSchoolDefensiveMomentChoices(__infield21("一壘手"));return c.filter(x=>x.action==="throwSecond"&&x.targetBase==="secondThenFirst").length===1&&c.some(x=>x.route==="3-6-3"&&x.text.includes("游擊手"))&&!c.some(x=>x.text.includes("移向二壘"));})()`));
verify("16. 兩出局時不產生無意義的雙殺選項", evaluate(`!getHighSchoolDefensiveMomentChoices(__infield21("游擊手","hardGrounder",{outs:2})).some(x=>x.infieldRoute==="doublePlay")`));
verify("17. 無 force 時不產生 force-only 或雙殺選項", evaluate(`(() => {const c=getHighSchoolDefensiveMomentChoices(__infield21("游擊手","normalGrounder",{runners:[null,null,null]}));return !c.some(x=>["doublePlay","forceSecond","forceThird","forceHome"].includes(x.infieldRoute));})()`));
verify("18. 本壘 force 只在滿壘 force context 生成", evaluate(`(() => {const no=getHighSchoolDefensiveMomentChoices(__infield21("二壘手","normalGrounder",{runners:["away-sim-2",null,"away-sim-5"]}));const yes=getHighSchoolDefensiveMomentChoices(__infield21("二壘手","normalGrounder",{runners:["away-sim-2","away-sim-3","away-sim-5"]}));return !no.some(x=>x.infieldRoute==="forceHome")&&yes.some(x=>x.infieldRoute==="forceHome");})()`));
verify("19. 高風險但合法的慢滾雙殺仍保留 agency", evaluate(`(() => {const c=getHighSchoolDefensiveMomentChoices(__infield21("游擊手","slowGrounder"));const dp=c.find(x=>x.infieldRoute==="doublePlay");return dp&&dp.advisable==="aggressive";})()`));
verify("20. 同球況四個內野守位的合法選項不完全相同", evaluate(`(() => {const sets=["一壘手","二壘手","游擊手","三壘手"].map(p=>getHighSchoolDefensiveMomentChoices(__infield21(p,"normalGrounder",{runners:["away-sim-2","away-sim-3",null],direction:"upTheMiddle"})).map(x=>x.text).join("|"));return new Set(sets).size===4;})()`));

verify("21. minimal roster 供應 receiving／pivot／first-base teammate", evaluate(`(() => {const t=__infield21().defensiveSituation.teammates;return t.receivingFielder.position==="二壘手"&&t.pivotFielder.capabilities.fielding&&t.firstBaseReceiver.position==="一壘手";})()`));
verify("22. resolution contract 以場上 facts 為核心", evaluate(`(() => {const m=__infield21("游擊手","hardGrounder");const r=resolveHighSchoolDefensivePlay(m,"challenge",0.5);return ["decisionQuality","executionQuality","outsCreated","runnerChanges","error","runsAllowed","primaryCause","secondaryCause","playerResponsibility","teammateResponsibility"].every(key=>Object.hasOwn(r,key));})()`));
verify("23. 合理判斷與未完整執行可以同時成立", evaluate(`(() => {for(let i=0;i<101;i++){const m=__infield21("游擊手","normalGrounder",{batterSpeed:9});const r=resolveHighSchoolDefensivePlay(m,"challenge",i/101);if(["strong","reasonable"].includes(r.decisionQuality)&&["partial","late","misplay"].includes(r.executionQuality))return true;}return false;})()`));
verify("24. aggressive decision 也能成功執行", evaluate(`(() => {for(let i=0;i<101;i++){const m=__infield21("游擊手","slowGrounder",{level:10,batterSpeed:3});const r=resolveHighSchoolDefensivePlay(m,"challenge",i/101);if(r.decisionQuality==="aggressive"&&r.executionQuality==="complete")return true;}return false;})()`));
verify("25. resolver 可產生 twoOuts／oneOut／zeroOuts／error", evaluate(`(() => {const all=new Set();for(const level of [1,4,7,10])for(const type of ["hardGrounder","slowGrounder","deepGrounder"]){const r=__counts21("游擊手",type,"challenge",{level,batterSpeed:8});Object.keys(r.counts).filter(k=>r.counts[k]).forEach(k=>all.add(k));}return ["twoOuts","oneOut","zeroOuts","error"].every(x=>all.has(x));})()`));
verify("26. deep result 可區分長傳出局／安全上壘／慢傳／不準／控球不傳", evaluate(`(() => {const details=new Set();for(const level of [2,5,9])for(const throwing of [2,5,9]){const r=__counts21("游擊手","deepGrounder","secure",{level,capabilities:{arm:level,throwing}});Object.keys(r.details).forEach(x=>details.add(x));}for(let i=0;i<101;i++){const m=__infield21("游擊手","deepGrounder",{capabilities:{fielding:10,reaction:10,range:10,decision:10,arm:2,throwing:5}});details.add(resolveHighSchoolDefensivePlay(m,"secure",i/101).detailedResult);}const controlled=resolveHighSchoolDefensivePlay(__infield21("游擊手","deepGrounder"),"contain",.5).detailedResult;return details.has("cleanLongThrowOut")&&details.has("closeSafe")&&details.has("lateThrow")&&details.has("inaccurateThrow")&&controlled==="controlledNoThrow";})()`));

verify("27. hard routine DP 完成率高於 slow roller＋快打者", evaluate(`(() => {const hard=__counts21("游擊手","hardGrounder","challenge",{batterSpeed:5}).counts.twoOuts;const slow=__counts21("游擊手","slowGrounder","challenge",{batterSpeed:9}).counts.twoOuts;return hard>slow+10;})()`));
verify("28. fast batter 明顯壓縮慢滾一壘封殺率", evaluate(`(() => {const slow=__counts21("三壘手","slowGrounder","secure",{batterSpeed:3}).counts.oneOut;const fast=__counts21("三壘手","slowGrounder","secure",{batterSpeed:9}).counts.oneOut;return slow>fast;})()`));
verify("29. deep grounder 強臂長傳出局率高於弱臂", evaluate(`(() => {const weak=__counts21("游擊手","deepGrounder","secure",{capabilities:{arm:2,throwing:6}}).counts.oneOut;const strong=__counts21("游擊手","deepGrounder","secure",{capabilities:{arm:10,throwing:6}}).counts.oneOut;return strong>weak+10;})()`));
verify("30. 橫向球高 reaction 控球率高於低 reaction", evaluate(`(() => {const low=__counts21("三壘手","hardGrounder","secure",{direction:"leftSide",capabilities:{reaction:2,fielding:7,range:5}});const high=__counts21("三壘手","hardGrounder","secure",{direction:"leftSide",capabilities:{reaction:10,fielding:7,range:5}});return high.counts.oneOut>low.counts.oneOut;})()`));
verify("31. fielding 會改變第一段控制結果", evaluate(`(() => {const low=__counts21("游擊手","normalGrounder","secure",{capabilities:{fielding:2,reaction:6,range:6}});const high=__counts21("游擊手","normalGrounder","secure",{capabilities:{fielding:10,reaction:6,range:6}});return high.counts.oneOut>low.counts.oneOut;})()`));
verify("32. throwing 會改變深處傳球結果", evaluate(`(() => {const low=__counts21("游擊手","deepGrounder","secure",{capabilities:{arm:7,throwing:2}});const high=__counts21("游擊手","deepGrounder","secure",{capabilities:{arm:7,throwing:10}});return high.counts.oneOut>low.counts.oneOut;})()`));
verify("33. strong pivot 的雙殺完成率高於 weak pivot", evaluate(`(() => {const mk=v=>({receivingFielder:{capabilities:{fielding:v,throwing:v,reaction:v}},pivotFielder:{capabilities:{fielding:v,throwing:v,reaction:v}},firstBaseReceiver:{capabilities:{fielding:7,throwing:7,reaction:7}}});const weak=__counts21("游擊手","hardGrounder","challenge",{teammates:mk(2)}).counts.twoOuts;const strong=__counts21("游擊手","hardGrounder","challenge",{teammates:mk(10)}).counts.twoOuts;return strong>weak+10;})()`));
verify("34. 快跑者會壓縮第一個封殺窗口", evaluate(`(() => {const slow=__counts21("三壘手","normalGrounder","lead",{runners:["away-sim-2","away-sim-3",null],runnerSpeeds:[4,4,null]}).counts.oneOut;const fast=__counts21("三壘手","normalGrounder","lead",{runners:["away-sim-2","away-sim-3",null],runnerSpeeds:[9,9,null]}).counts.oneOut;return slow>fast;})()`));

verify("35. late tie 與 early four-run lead 改變教練 tactical interpretation", evaluate(`(() => {const late=__infield21("三壘手","normalGrounder",{inning:7,home:1,away:1,runners:["away-sim-2",null,"away-sim-5"]});const early=__infield21("三壘手","normalGrounder",{inning:3,home:5,away:1,runners:["away-sim-2",null,"away-sim-5"]});return late.coachTacticalDirection.intent==="preventRun"&&early.coachTacticalDirection.intent==="secureOut";})()`));
verify("36. score context 不會刪除合法選項", evaluate(`(() => {const a=__infield21("三壘手","normalGrounder",{inning:7,home:1,away:1,runners:["away-sim-2",null,"away-sim-5"]});const b=__infield21("三壘手","normalGrounder",{inning:3,home:5,away:1,runners:["away-sim-2",null,"away-sim-5"]});return getHighSchoolDefensiveMomentChoices(a).map(x=>x.infieldRoute).join()==getHighSchoolDefensiveMomentChoices(b).map(x=>x.infieldRoute).join();})()`));
verify("37. Baseball IQ／Observation 只改變 cue clarity", evaluate(`(() => {const m=__infield21();player.observe=1;player.baseballSkills.baseballIQ=1;const low=adaptInfieldInformation(m.defensiveSituation,player);player.observe=10;player.baseballSkills.baseballIQ=10;const high=adaptInfieldInformation(m.defensiveSituation,player);return low.readCue!==high.readCue&&low.batterSpeed===high.batterSpeed;})()`));
verify("38. 玩家可見 presentation 不出現 raw identifier 或 rating", evaluate(`(() => {const m=__infield21("游擊手","deepGrounder",{direction:"towardHole"});const r=resolveHighSchoolDefensivePlay(m,"secure",.4);const p=JSON.stringify(presentInfieldDecision(m.defensiveSituation,r,"secure"));return !["hardGrounder","towardHole","fastBatter","primaryCause","executionWindow","fielding:"].some(raw=>p.includes(raw));})()`));

verify("39. pre-decision save/reload 保留同一顆球與合法選項", evaluate(`(() => {const m=__infield21("三壘手","slowGrounder",{direction:"lineSide"});const before=JSON.stringify({s:m.defensiveSituation,c:getHighSchoolDefensiveMomentChoices(m)});const restored=normalizeSave(JSON.parse(JSON.stringify(player)));player=restored;const after=JSON.stringify({s:player.highSchoolMatch.defensiveSituation,c:getHighSchoolDefensiveMomentChoices(player.highSchoolMatch)});return before===after;})()`));
verify("40. resolved save/reload 不會重骰或重複 mutation", evaluate(`(() => {const m=__infield21("游擊手","hardGrounder");resolveHighSchoolYearOneMatch("challenge",m.currentMomentId,()=>.7);const snapshot=JSON.stringify({outs:m.outs,runners:m.runners,score:m.scores,contribution:m.playerContribution,resolution:m.lastDefensiveResolution});player=normalizeSave(JSON.parse(JSON.stringify(player)));prepareHighSchoolYearOneMatch();return snapshot===JSON.stringify({outs:player.highSchoolMatch.outs,runners:player.highSchoolMatch.runners,score:player.highSchoolMatch.scores,contribution:player.highSchoolMatch.playerContribution,resolution:player.highSchoolMatch.lastDefensiveResolution});})()`));
verify("41. current assignment position 不覆寫 canonical 長期守位", evaluate(`(() => {const m=__infield21("二壘手");return m.currentFieldingPosition==="二壘手"&&player.primaryPosition==="內野手"&&player.secondaryPositions[0]==="外野手";})()`));
verify("42. featured match 使用 live-state meaningful-moment extension point", evaluate(`(() => {pendingHighSchoolMatchPositionOverride="二壘手";const m=__setup21();let safety=0;while(!m.completed&&safety++<520){if(isHighSchoolMatchDecisionVisible(m)){if(m.currentDomain==="defense")return m.positionDecisionFamily==="infield"&&m.defensiveSituation.id.includes(m.id)&&m.currentAssignment.includes("滾地球");const choice=getHighSchoolYearOneMatchMomentChoices(m)[0];if(!choice||!resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.8))return false;}else if(isHighSchoolMatchPlaybackPhase(m)){advanceHighSchoolMatchPlaybackStep(m);}else return false;}return false;})()`));
verify("43. Situation → Decision → Execution → Outcome → Why 可由同一 presentation adapter 產生", evaluate(`(() => {const m=__infield21("游擊手","normalGrounder");const r=resolveHighSchoolDefensivePlay(m,"challenge",.5);const p=presentInfieldDecision(m.defensiveSituation,r,"challenge");return p.situation&&p.decision&&p.execution&&p.outcome&&p.why;})()`));
verify("44. fast batter 與 fast lead runner 可成為不同原因", evaluate(`__hasCause21("三壘手","slowGrounder","secure",{batterSpeed:9},"fastBatter")&&__hasCause21("三壘手","normalGrounder","lead",{runners:["away-sim-2","away-sim-3",null],runnerSpeeds:[9,9,null]},"fastLeadRunner")`));
verify("45. slow grounder 與 deep grounder 保留不同球況原因", evaluate(`__hasCause21("三壘手","slowGrounder","secure",{batterSpeed:3},"slowGrounder")&&__hasCause21("游擊手","deepGrounder","secure",{level:10},"deepGrounder")`));
verify("46. poor reaction 與 fielding issue 可被 Cause Analyzer 分辨", evaluate(`__hasCause21("三壘手","hardGrounder","secure",{direction:"leftSide",capabilities:{reaction:1,fielding:7,range:1}},"poorReaction")&&__hasCause21("三壘手","hardGrounder","secure",{direction:"leftSide",capabilities:{reaction:7,fielding:1,range:1}},"fieldingIssue")`));
verify("47. weak arm 與 throwing issue 對應不同傳球問題", evaluate(`__hasCause21("游擊手","deepGrounder","secure",{capabilities:{fielding:10,reaction:10,range:10,decision:10,arm:2,throwing:7}},"weakArm")&&__hasCause21("游擊手","deepGrounder","secure",{capabilities:{fielding:10,reaction:10,range:10,decision:10,arm:8,throwing:2}},"throwingIssue")`));
verify("48. teammate issue 不會被歸成玩家主要責任", evaluate(`(() => {const weak={receivingFielder:{capabilities:{fielding:1,throwing:1,reaction:1}},pivotFielder:{capabilities:{fielding:1,throwing:1,reaction:1}},firstBaseReceiver:{capabilities:{fielding:7,throwing:7,reaction:7}}};for(let i=0;i<101;i++){const r=resolveHighSchoolDefensivePlay(__infield21("游擊手","hardGrounder",{level:10,teammates:weak}),"challenge",i/101);if(r.primaryCause==="teammateIssue")return r.playerResponsibility==="limited"&&r.teammateResponsibility==="major";}return false;})()`));

console.log(`\nBaseball Match Foundation 2.1：${passed}/${passed} 通過`);
