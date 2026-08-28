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
    function __setup121(role="starter", position="內野手", level=10) {
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      player=createInitialPlayer("1.2.1 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,position,position==="內野手"?["外野手"]:[]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode=role;
      player.highSchoolTeamRole=role==="starter"?"先發／關鍵任務":role==="rotation"?"輪替／替補任務":"發展／板凳任務";
      Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=Math.max(1,level));
      Object.assign(player,{ballSense:level,observe:level,fitness:level,instinct:level,discipline:level,responsibility:level});
      pendingHighSchoolMatchSimulationSeed=12101;
      pendingHighSchoolMatchPositionOverride=position==="內野手"?"二壘手":"";
      return prepareHighSchoolYearOneMatch();
    }
    function __resolve121(decision, sample=0.99) {
      let safety=0;
      while(safety++<400){
        while(!isHighSchoolMatchDecisionVisible(player.highSchoolMatch)&&isHighSchoolMatchPlaybackPhase(player.highSchoolMatch)&&safety++<400) advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);
        if(player.highSchoolMatch.simulationPhase!=="offensive_agency_ready")break;
        const target=player.highSchoolMatch.offensivePlayerAgencyState?.routeTarget;
        const agencyDecision=target==="finalOffense"?"agencyManual":"agencySimulate";
        const agency=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch).find(item=>item.matchDecision===agencyDecision);
        if(!agency||!resolveHighSchoolYearOneMatch(agency.matchDecision,agency.matchMomentId,()=>sample))return false;
      }
      const choices=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch);
      const choice=choices.find(item=>item.matchDecision===decision)||choices[0];
      return choice ? resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>sample) : false;
    }
    function __resolveAdvance121(decision, sample=0.99) {
      const result=__resolve121(decision,sample);
      if(result) advanceHighSchoolMatchSimulation(player.highSchoolMatch);
      return result;
    }
    function __forceThirdMoment121() {
      const match=player.highSchoolMatch;
      const needed=Math.max(0,match.scores.home+20-match.scores.away);
      if(needed>0){ensureHighSchoolMatchLineScoreInning(match,"away");match.scores.away+=needed;match.lineScore.away[match.inning-1]+=needed;}
    }
    function __advanceToThird121(sample=0.99) {
      const match=player.highSchoolMatch; let safety=0;
      while(!match.completed&&!(match.simulationPhase==="moment_3_ready"&&match.currentMomentId===highSchoolYearOneMomentIds[2])&&safety++<600){
        if(isHighSchoolMatchDecisionVisible(match)){
          const choices=getHighSchoolYearOneMatchMomentChoices(match);
          let choice;
          if(match.simulationPhase==="offensive_agency_ready"){
            const agencyDecision=match.offensivePlayerAgencyState?.routeTarget==="finalOffense"?"agencyManual":"agencySimulate";
            choice=choices.find(item=>item.matchDecision===agencyDecision);
          }else if(match.currentDomain==="defense")choice=choices.find(item=>item.matchDecision==="secure")||choices[0];
          else choice=choices.find(item=>item.matchDecision==="zone")||choices[0];
          if(!choice||!resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>sample))break;
        }else if(isHighSchoolMatchPlaybackPhase(match)) advanceHighSchoolMatchSimulation(match);
        else break;
      }
      return match.simulationPhase==="moment_3_ready"&&match.currentMomentId===highSchoolYearOneMomentIds[2];
    }
    function __complete121(role="starter", sample=0.99) {
      __setup121(role);
      __resolveAdvance121("attack",sample);
      __resolve121("secure",sample);
      __forceThirdMoment121();
      __advanceToThird121(sample);
      __resolveAdvance121("zone",sample);
      const match=player.highSchoolMatch; let safety=0;
      while(!match.completed&&safety++<800){
        if(isHighSchoolMatchDecisionVisible(match)){
          const choices=getHighSchoolYearOneMatchMomentChoices(match);
          const choice=match.simulationPhase==="offensive_agency_ready"
            ? choices.find(item=>item.matchDecision==="agencySimulate")||choices[0]
            : choices.find(item=>item.matchDecision==="secure")||choices[0];
          if(!choice||!resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>sample))break;
        }else if(isHighSchoolMatchPlaybackPhase(match)) advanceHighSchoolMatchSimulation(match);
        else break;
      }
      return player.highSchoolMatch;
    }
    function __npcResult121(sample) {
      const match=__setup121("bench");
      match.runners=[null,null,null]; match.outs=0; match.scores={home:0,away:0};
      match.half="下"; match.offenseTeam="home"; match.defenseTeam="away"; match.battingOrderIndex.home=4;
      match.currentBatter=getHighSchoolMatchLineupBatter(match,"home").id;
      return resolveSimulatedHighSchoolPlateAppearance(match,()=>sample).result;
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

verify("1. player.highSchoolMatch 是唯一正式模擬狀態 owner", evaluate(`(() => {
  const match=__setup121();
  return player.highSchoolMatch===match && typeof player.simMatch==="undefined" && typeof player.matchState2==="undefined" && typeof player.featuredMatchRuntime==="undefined";
})()`));

verify("2. authoritative state 具備模擬、打序、當前任務與結算欄位", evaluate(`(() => {
  const match=__setup121();
  return ["offenseTeam","defenseTeam","currentBatter","currentAssignment","battingOrderIndex","halfInningResolved","simulationPhase","simulationCursor","simulationSeed","playerRunnerLocation","settled"].every(key=>Object.prototype.hasOwnProperty.call(match,key));
})()`));

verify("3. 同角色與守位會產生 deterministic minimal rosters", evaluate(`(() => {
  player=createInitialPlayer("固定球員"); const a=createHighSchoolMatchSimulationRoster("rotation","捕手"); const b=createHighSchoolMatchSimulationRoster("rotation","捕手"); return JSON.stringify(a)===JSON.stringify(b);
})()`));

verify("4. 雙方先發名單各九人，模擬球員與 canonical player 清楚分流", evaluate(`(() => {
  const match=__setup121("starter","外野手"); const all=[...match.rosters.home.lineup,...match.rosters.away.lineup];
  return match.rosters.home.lineup.length===9&&match.rosters.away.lineup.length===9&&all.filter(item=>item.id==="player").length===1&&all.filter(item=>item.id!=="player").every(item=>item.source==="simulation-roster")&&all.find(item=>item.id==="player").source==="canonical-player";
})()`));

verify("5. 先發直接在 lineup，輪替與板凳先以 bench entry 表示", evaluate(`(() => {
  player=createInitialPlayer("角色"); const starter=createHighSchoolMatchSimulationRoster("starter","內野手"); const rotation=createHighSchoolMatchSimulationRoster("rotation","內野手"); const bench=createHighSchoolMatchSimulationRoster("bench","內野手");
  return starter.home.lineup.some(item=>item.id==="player")&&!starter.home.bench.some(item=>item.id==="player")&&!rotation.home.lineup.some(item=>item.id==="player")&&rotation.home.bench.some(item=>item.id==="player")&&!bench.home.lineup.some(item=>item.id==="player")&&bench.home.bench.some(item=>item.id==="player");
})()`));

verify("6. 三種角色都只有一個 canonical player identity，板凳角色不會提前進打序", evaluate(`(() => ["starter","rotation","bench"].every(role=>{const match=__setup121(role);const all=[...match.rosters.home.lineup,...match.rosters.home.bench];const inLineup=match.rosters.home.lineup.some(item=>item.id==="player");return all.filter(item=>item.id==="player").length===1&&(role==="starter"?inLineup:!inLineup);}))()`));

verify("7. 進攻 capability adapter 讀取既有能力，沒有新增 match-only truth", evaluate(`(() => {
  __setup121("starter","內野手",0);const low=getOffensiveSimulationCapability(player);Object.assign(player.baseballSkills,{batting:12,baseRunning:9,baseballIQ:8});Object.assign(player,{ballSense:8,observe:7,fitness:7,instinct:6,discipline:8});const high=getOffensiveSimulationCapability(player);
  return high.contact>low.contact&&high.power>low.power&&high.speed>low.speed&&high.discipline>low.discipline&&player.matchContact===undefined&&Object.isFrozen(high);
})()`));

verify("8. 守備 capability adapter 依 canonical position 選用現有技能", evaluate(`(() => {
  __setup121("starter","捕手",0);Object.assign(player.baseballSkills,{blocking:10,gameCalling:9,throwing:8,range:0,armStrength:0});const catcher=getDefensiveSimulationCapability(player,"捕手");const outfield=getDefensiveSimulationCapability(player,"外野手");return catcher.fielding>outfield.fielding&&catcher.arm>outfield.arm&&Object.isFrozen(catcher);
})()`));

verify("9. seeded RNG 只依 seed 與 cursor 決定且可重現", evaluate(`(() => {const a=__setup121("starter");const x=[nextHighSchoolMatchSimulationRandom(a),nextHighSchoolMatchSimulationRandom(a)];const b=__setup121("starter");const y=[nextHighSchoolMatchSimulationRandom(b),nextHighSchoolMatchSimulationRandom(b)];return JSON.stringify(x)===JSON.stringify(y)&&x[0]!==x[1];})()`));

verify("10. non-player PA resolver 支援最小完整 outcome set", JSON.stringify(parse(`([0.1,0.5,0.6,0.7,0.9,0.95,0.99].map(__npcResult121))`)) === JSON.stringify(["out","productiveOut","walk","single","double","triple","homeRun"]));

verify("11. 玩家安打後以 runner identity 留在一壘，不是 boolean occupancy", evaluate(`(() => {const match=__setup121();match.runners=[null,null,null];match.outs=0;applyHighSchoolSimulatedPlateAppearance(match,"single","player","home");return match.runners[0]==="player"&&match.playerRunnerLocation===0&&typeof match.runners[0]==="string";})()`));

verify("12. 後續隊友長打能從 authoritative runners 送回玩家並記錄得分", evaluate(`(() => {const match=__setup121();match.runners=["player",null,null];match.playerRunnerLocation=0;const before=match.scores.home;applyHighSchoolSimulatedPlateAppearance(match,"double","home-sim-2","home");applyHighSchoolSimulatedPlateAppearance(match,"single","home-sim-3","home");return match.scores.home===before+1&&match.playerContribution.runsScored===1&&match.playerRunnerLocation===-1&&match.simulationLog.some(item=>item.type==="run"&&item.runnerId==="player");})()`));

verify("13. productive out 與保送會按壘況推進，不製造幽靈跑者", evaluate(`(() => {const match=__setup121();match.runners=["r1","r2","r3"];match.outs=0;applyHighSchoolSimulatedPlateAppearance(match,"productiveOut","b","home");const productive=match.outs===1&&match.runners.join()===[null,"r1","r2"].join();match.runners=["r1","r2","r3"];applyHighSchoolSimulatedPlateAppearance(match,"walk","b","home");return productive&&match.runners.join() === ["b","r1","r2"].join();})()`));

verify("14. 三出局會清空壘包、歸零 outs 並完成下半局到次局上半的攻守交換", evaluate(`(() => {const match=__setup121();match.inning=4;match.half="下";match.offenseTeam="home";match.defenseTeam="away";match.outs=3;match.runners=["player","r2",null];return endHighSchoolMatchHalfInning(match)&&match.inning===5&&match.half==="上"&&match.offenseTeam==="away"&&match.defenseTeam==="home"&&match.outs===0&&match.runners.every(item=>item===null)&&match.playerRunnerLocation===-1;})()`));

verify("15. 上半局結束只翻到同局下半，不錯誤增加 inning", evaluate(`(() => {const match=__setup121();match.inning=5;match.half="上";match.offenseTeam="away";match.defenseTeam="home";match.outs=3;return endHighSchoolMatchHalfInning(match)&&match.inning===5&&match.half==="下"&&match.offenseTeam==="home";})()`));

verify("16. Moment 1 outcome 先寫回比分／出局／跑者，再允許模擬器 resume", evaluate(`(() => {const match=__setup121("starter","內野手",10);const before=JSON.stringify({scores:match.scores,outs:match.outs,runners:match.runners});__resolve121("zone",0.99);return match.simulationPhase==="moment_1_resolved"&&match.completedMoments.length===1&&JSON.stringify({scores:match.scores,outs:match.outs,runners:match.runners})!==before&&match.runners.includes("player");})()`));

verify("17. Moment 1 failure 只增加當前半局出局，不會提前結束比賽", evaluate(`(() => {const match=__setup121("bench","內野手",0);__resolve121("attack",0);return match.simulationPhase==="moment_1_resolved"&&!match.completed&&match.outs>0&&match.completedMoments[0].tier==="failure";})()`));

const defensivePauseProof = parse(`(() => {const match=__setup121();__resolve121("attack",0.99);advanceHighSchoolMatchSimulation(match);return {phase:match.simulationPhase,domain:match.currentDomain,offense:match.offenseTeam,runners:match.runners,outs:match.outs,passage:match.passage,inning:match.inning,half:match.half,log:match.simulationLog.slice(-5)};})()`);
verify("18. Moment 1 後模擬器延續正式半局並停在 live 守備情境", defensivePauseProof.phase==="moment_2_ready"&&defensivePauseProof.domain==="defense"&&defensivePauseProof.offense==="away"&&defensivePauseProof.outs<3&&defensivePauseProof.inning>=2&&defensivePauseProof.log.some(item=>item.type==="meaningfulMomentReached"));

verify("19. 一、二壘滾地球提供一壘、雙殺、三壘封殺，且不亂出本壘選項", evaluate(`(() => {const match=__setup121();match.momentIndex=1;match.runners=["r1","r2",null];match.outs=1;const choices=getHighSchoolDefensiveMomentChoices(match);const decisions=choices.map(item=>item.matchDecision);return ["secure","challenge","lead"].every(item=>decisions.includes(item))&&!decisions.includes("home");})()`));

verify("20. 三壘有人與滿壘時才會出現合理的本壘處理", evaluate(`(() => {const match=__setup121();match.momentIndex=1;match.outs=1;match.runners=[null,null,"r3"];const third=getHighSchoolDefensiveMomentChoices(match).map(item=>item.matchDecision);match.runners=["r1","r2","r3"];const loaded=getHighSchoolDefensiveMomentChoices(match).map(item=>item.matchDecision);return third.includes("home")&&loaded.includes("home");})()`));

verify("21. 無人上壘不產生跑者控制或本壘攻防 nonsense", evaluate(`(() => {const match=__setup121();match.momentIndex=1;match.runners=[null,null,null];match.outs=0;const choices=getHighSchoolDefensiveMomentChoices(match);const text=choices.map(item=>item.text).join("｜");return choices.length===3&&!choices.some(item=>["home","challenge"].includes(item.matchDecision))&&!text.includes("跑者");})()`));

verify("22. 兩出局時不再提供雙殺作為額外目標", evaluate(`(() => {const match=__setup121();match.momentIndex=1;match.runners=["r1","r2",null];match.outs=2;return !getHighSchoolDefensiveMomentChoices(match).some(item=>item.matchDecision==="challenge");})()`));

verify("23. Defense Moment 的教練與對手文字都由守備 domain 產生", evaluate(`(() => {const match=__setup121();__resolveAdvance121("attack",0.99);const coach=match.coachInstruction;const opponent=match.opponentAdjustment;return !["打席","揮棒","好球帶","配球"].some(word=>coach.includes(word))&&!["球種","好球帶","配球","投手用"].some(word=>opponent.includes(word))&&(opponent.includes("跑者")||opponent.includes("打者"));})()`));

verify("24. Moment 2 decision 直接更新 outs、runners snapshot 與 defensive contribution", evaluate(`(() => {const match=__setup121();__resolveAdvance121("zone",0.99);const before={outs:match.outs,created:match.playerContribution.outsCreated};__resolve121("secure",0.99);const recorded=match.completedMoments.at(-1);return match.simulationPhase==="moment_2_resolved"&&match.outs>before.outs&&match.playerContribution.outsCreated>before.created&&JSON.stringify(recorded.runners)===JSON.stringify(match.runners)&&recorded.outs===match.outs;})()`));

verify("25. 守備後若又遇到合法 Decision 先完成，再推進到終盤 Moment 3", evaluate(`(() => {const match=__setup121();__resolveAdvance121("zone",0.99);__resolve121("secure",0.99);__forceThirdMoment121();const reached=__advanceToThird121(0.99);return reached&&match.simulationPhase==="moment_3_ready"&&match.momentIndex===2&&match.inning>=5&&match.half==="下"&&match.offenseTeam==="home"&&match.currentBatter==="player";})()`));

verify("26. Moment 3 任務會依 simulator 的落後、平手、領先比分切換", evaluate(`(() => {const match=__setup121();match.momentIndex=2;match.runners=[null,null,null];match.outs=1;const texts=[];for(const scores of [{home:1,away:3},{home:2,away:2},{home:4,away:2}]){match.scores=scores;texts.push(getHighSchoolYearOneMatchMomentChoices(match).map(item=>item.text).join("｜"));}return texts[0].includes("縮小差距")&&texts[1].includes("超前")&&texts[2].includes("挑戰外野空檔")&&!texts[2].includes("保險分");})()`));

verify("27. Moment 3 寫回後可處理後續防守 Decision，再由 simulator 結算終場一次", evaluate(`(() => {const match=__complete121("starter");const ids=match.completedMoments.map(moment=>moment.id);return match.completed&&match.settled&&match.simulationPhase==="complete"&&match.half==="終"&&match.outs>=0&&match.outs<=3&&match.currentMomentId===""&&ids.includes(highSchoolYearOneMomentIds[0])&&ids.includes(highSchoolYearOneMomentIds[2])&&match.completedMoments.filter(moment=>moment.domain==="defense").length===match.matchDecisionDensityState.defensiveMeaningfulDecisionCount&&match.teamResult.includes("終場");})()`));

verify("28. 個人 performance 與 team result 分開存在", evaluate(`(() => {const match=__complete121("rotation");return match.performanceSummary.includes("關鍵時刻")&&match.teamResult.includes("終場")&&match.playerContribution.hits+match.playerContribution.walks+match.playerContribution.outsCreated>=1&&!match.performanceSummary.includes(match.teamResult);})()`));

verify("29. settled guard 阻止重複永久效果與重複終場模擬", evaluate(`(() => {const match=__complete121("bench");const before=JSON.stringify({season:player.seasonPerformance,recent:player.recentPerformance,exposure:player.exposure,scout:player.scoutEvaluation,flags:player.flags,log:match.simulationLog,scores:match.scores});const a=advanceHighSchoolMatchSimulation(match);const b=resolveHighSchoolYearOneMatch("zone","hs_y1_match_moment_3",()=>0.99);return a===false&&b===false&&before===JSON.stringify({season:player.seasonPerformance,recent:player.recentPerformance,exposure:player.exposure,scout:player.scoutEvaluation,flags:player.flags,log:match.simulationLog,scores:match.scores});})()`));

verify("30. simulation phase guard 對 decision-ready 狀態的非法 resume 保持零 mutation", evaluate(`(() => {const match=__setup121();Object.assign(match,{simulationPhase:"moment_1_ready",currentDomain:"offense"});const before=JSON.stringify(match);return advanceHighSchoolMatchSimulation(match)===false&&JSON.stringify(match)===before;})()`));

verify("31. stale Moment submission 不會改動模擬 cursor、比分或跑者", evaluate(`(() => {const match=__setup121();__resolveAdvance121("attack",0.99);const before=JSON.stringify(match);const result=resolveHighSchoolYearOneMatch("attack","hs_y1_match_moment_1",()=>0.99);return result===false&&JSON.stringify(match)===before;})()`));

verify("32. normalizeSave 深層保存 player runner identity 與 simulation phase", evaluate(`(() => {const match=__setup121();match.runners=[null,"player","home-sim-2"];match.playerRunnerLocation=1;match.simulationPhase="moment_1_resolved";const restored=normalizeSave(JSON.parse(JSON.stringify(player)));restored.highSchoolMatch.runners[1]="changed";return player.highSchoolMatch.runners[1]==="player"&&restored.highSchoolMatch.playerRunnerLocation===1&&restored.highSchoolMatch.simulationPhase==="moment_1_resolved";})()`));

verify("33. half-inning simulation 後存讀檔保留打序、比分、phase 與合法決定", evaluate(`(() => {const match=__setup121();__resolveAdvance121("attack",0.99);const expected=JSON.stringify({inning:match.inning,half:match.half,scores:match.scores,outs:match.outs,runners:match.runners,order:match.battingOrderIndex,phase:match.simulationPhase,cursor:match.simulationCursor,choices:getHighSchoolYearOneMatchMomentChoices(match).map(item=>item.matchDecision)});const restored=normalizeSave(JSON.parse(JSON.stringify(player)));player=restored;const actual=JSON.stringify({inning:restored.highSchoolMatch.inning,half:restored.highSchoolMatch.half,scores:restored.highSchoolMatch.scores,outs:restored.highSchoolMatch.outs,runners:restored.highSchoolMatch.runners,order:restored.highSchoolMatch.battingOrderIndex,phase:restored.highSchoolMatch.simulationPhase,cursor:restored.highSchoolMatch.simulationCursor,choices:getHighSchoolYearOneMatchMomentChoices(restored.highSchoolMatch).map(item=>item.matchDecision)});return actual===expected;})()`));

verify("34. Defense outcome reload 後只 resume 一次，不重複已完成守備", evaluate(`(() => {const match=__setup121();__resolveAdvance121("zone",0.99);__resolve121("secure",0.99);__forceThirdMoment121();if(!__advanceToThird121(0.99))return false;const completed=match.completedMoments.length;const contribution=match.playerContribution.outsCreated;saveGame();player=createInitialPlayer();loadGame();return player.highSchoolMatch.simulationPhase==="moment_3_ready"&&player.highSchoolMatch.completedMoments.length===completed&&player.highSchoolMatch.playerContribution.outsCreated===contribution;})()`));

verify("35. 未完成且缺少 1.2.1 phase／roster 的開發存檔 deterministic reset 到正式比賽入口", evaluate(`(() => {const saved=__setup121();const legacy=JSON.parse(JSON.stringify(player));delete legacy.highSchoolMatch.simulationPhase;delete legacy.highSchoolMatch.rosters;legacy.highSchoolMatch.momentIndex=1;legacy.highSchoolMatch.completed=false;player=normalizeSave(legacy);const reset=player.highSchoolMatch.id===""&&player.highSchoolMatch.completedMoments.length===0;const entry=prepareHighSchoolYearOneMatch();return reset&&entry.simulationPhase==="full_match_flow"&&entry.inning===1&&entry.half==="上"&&entry.scores.home===0&&entry.scores.away===0&&entry.rosters.home.lineup.length===9;})()`));

verify("36. 已完成 v15 高一比賽存檔不會被開發態 migration 重置", evaluate(`(() => {const match=__complete121();const saved=JSON.parse(JSON.stringify(player));const count=saved.highSchoolMatch.completedMoments.length;delete saved.highSchoolMatch.simulationPhase;delete saved.highSchoolMatch.rosters;const restored=normalizeSave(saved);return restored.highSchoolMatch.completed&&restored.highSchoolMatch.id==="hs-y1-autumn-exhibition"&&restored.highSchoolMatch.completedMoments.length===count;})()`));

const roleProof = parse(`(() => ["starter","rotation","bench"].map(role=>{const match=__complete121(role);return {role,completed:match.completed,moments:match.completedMoments.length,defensiveDecisions:match.matchDecisionDensityState.defensiveMeaningfulDecisionCount,domains:match.completedMoments.map(item=>item.domain),result:match.teamResult};}))()`);
verify("37. Starter／Rotation／Bench 都能依 Regulation 走完同一套 simulation gameplay", roleProof.every(item => item.completed && item.moments === item.defensiveDecisions + 2 && item.domains[0] === "offense" && item.domains.includes("defense") && item.result.includes("終場")));

verify("38. current assignment 與 live match entry history 是兩個不同 UI truth", evaluate(`(() => {const match=__setup121("bench");const initialHistory=match.matchEntryHistory;const assignment=match.currentAssignment;__resolveAdvance121("attack",0.99);return initialHistory&&assignment&&initialHistory!==assignment&&match.matchEntryHistory!==initialHistory&&match.matchEntryHistory.includes("代打")&&match.currentAssignment!==match.matchEntryHistory;})()`));

verify("39. simulation passage 只保留實際打席事實，不使用 generic 推進敘述", evaluate(`(() => {const match=__setup121();__resolve121("attack",0.99);const start=match.simulationLog.length;advanceHighSchoolMatchSimulation(match);const pa=match.simulationLog.slice(start).filter(item=>item.type==="plateAppearance").length;return pa>0&&!match.passage.includes("你的打席結束後")&&!match.passage.includes("球隊仍完成了這個半局")&&match.simulationLog.some(item=>item.type==="sideChange");})()`));

verify("40. 玩家可見 match presentation 不洩漏 simulator internal identifiers", evaluate(`(() => {const match=__setup121();__resolveAdvance121("zone",0.99);const text=getHighSchoolYearOneMatchPresentation()+getHighSchoolYearOneMatchMomentChoices().map(item=>item.text).join("｜");return !["home-sim-","away-sim-","simulationPhase","simulationCursor","playerRunnerLocation","hs_y1_match_moment"].some(raw=>text.includes(raw));})()`));

console.log(`\nHigh School Integration 1.2.1：${passed}/${passed} 通過`);
