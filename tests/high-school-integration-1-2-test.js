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

function createClassList() {
  return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
}

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    body: { classList: createClassList() },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false,
        classList: createClassList(), focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
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
    function __setupHighSchoolMatch(role="starter", position="內野手", level="high") {
      pendingYouthSeasonOutcome=null;
      isTransitioning=false;
      player=createInitialPlayer("1.2 測試球員");
      applyDebugBookmarkCharacterProfile(player);
      settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      applyCanonicalPositionProfile(player,position,position==="內野手"?["外野手"]:[]);
      player.chapter="青棒";
      player.highSchoolStep=5;
      player.highSchoolRoleCode=role;
      player.highSchoolTeamRole=role==="starter"?"先發／關鍵任務":role==="rotation"?"輪替／替補任務":"發展／板凳任務";
      const value=level==="high"?10:level==="mixed"?3:1;
      Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=value);
      Object.assign(player,{ballSense:value,observe:value,fitness:value,instinct:value,discipline:value,responsibility:value});
      pendingHighSchoolMatchSimulationSeed=12001;
      pendingHighSchoolMatchPositionOverride=position==="內野手"?"二壘手":"";
      return prepareHighSchoolYearOneMatch();
    }
    function __resolveCurrent(decision, sample) {
      let safety=0;
      while(safety++<400){
        while(!isHighSchoolMatchDecisionVisible(player.highSchoolMatch)&&isHighSchoolMatchPlaybackPhase(player.highSchoolMatch)&&safety++<400) advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);
        if(player.highSchoolMatch.simulationPhase!=="offensive_agency_ready")break;
        const agency=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch).find(item=>item.matchDecision==="agencyManual");
        if(!agency||!resolveHighSchoolYearOneMatch(agency.matchDecision,agency.matchMomentId,()=>sample))return false;
      }
      const choices=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch);
      const choice=choices.find(item=>item.matchDecision===decision)||choices[0];
      return choice ? resolveHighSchoolYearOneMatch(choice.matchDecision,getHighSchoolYearOneMomentId(),()=>sample) : false;
    }
    function __resumeSimulation() {
      return advanceHighSchoolMatchSimulation(player.highSchoolMatch);
    }
    function __resolveAndAdvance(decision, sample) {
      const result=__resolveCurrent(decision,sample);
      if(result) __resumeSimulation();
      return result;
    }
    function __forceThirdMomentPath() {
      const match=player.highSchoolMatch;
      const needed=Math.max(0,match.scores.home+20-match.scores.away);
      if(needed>0){ensureHighSchoolMatchLineScoreInning(match,"away");match.scores.away+=needed;match.lineScore.away[match.inning-1]+=needed;}
    }
    function __advanceToFinalMoment120(sample=0.99) {
      const match=player.highSchoolMatch; let safety=0;
      while(!match.completed&&!(match.simulationPhase==="moment_3_ready"&&match.currentMomentId===highSchoolYearOneMomentIds[2])&&safety++<700){
        if(isHighSchoolMatchDecisionVisible(match)){
          if(match.simulationPhase==="offensive_agency_ready"){
            const agency=getHighSchoolYearOneMatchMomentChoices(match)[0];
            if(!agency||!resolveHighSchoolYearOneMatch(agency.matchDecision,agency.matchMomentId,()=>sample))break;
            continue;
          }
          const choices=getHighSchoolYearOneMatchMomentChoices(match);
          const choice=match.currentDomain==="defense"
            ? choices.find(item=>item.matchDecision==="secure")||choices[0]
            : choices.find(item=>item.matchDecision==="zone")||choices[0];
          if(!choice||!resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>sample))break;
        }else if(isHighSchoolMatchPlaybackPhase(match))__resumeSimulation();
        else break;
      }
      return match.simulationPhase==="moment_3_ready"&&match.currentMomentId===highSchoolYearOneMomentIds[2];
    }
    function __completeDirect(role="starter", level="high", sample=0.99) {
      const match=__setupHighSchoolMatch(role,"內野手",level); let safety=0;
      while(!match.completed&&safety++<1400){
        if(isHighSchoolMatchDecisionVisible(match)){
          const choices=getHighSchoolYearOneMatchMomentChoices(match);
          const preferred=match.currentDomain==="defense"?"secure":match.momentIndex===0?"attack":"zone";
          const choice=choices.find(item=>item.matchDecision===preferred)||choices[0];
          if(!choice||!resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>sample))break;
        }else if(isHighSchoolMatchPlaybackPhase(match))__resumeSimulation();
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

verify("1. 比賽固定三個穩定 Moment identity，且沿用唯一 showcase event", evaluate("highSchoolYearOneMomentIds.length===3 && new Set(highSchoolYearOneMomentIds).size===3 && highSchoolEvents.high_school_showcase"));

const shared = parse(`(() => {
  const match=__setupHighSchoolMatch("starter"); const id=match.id,opponent=match.opponent;
  const snapshots=[];let safety=0;
  while(!match.completed&&safety++<1400){if(isHighSchoolMatchDecisionVisible(match)){snapshots.push({id:match.id,opponent:match.opponent,score:{...match.scores},moment:match.currentMomentId,domain:match.currentDomain});const choices=getHighSchoolYearOneMatchMomentChoices(match);const choice=choices[0];resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.99);}else if(isHighSchoolMatchPlaybackPhase(match))__resumeSimulation();else break;}
  return {id,opponent,snapshots,completed:match.completed,count:match.completedMoments.length};
})()`);
verify("2. 全部 Moment 共用 match identity、對手與累積比分", shared.completed && shared.count === shared.snapshots.length && shared.snapshots.every(item => item.id === shared.id && item.opponent === shared.opponent) && shared.snapshots[1].score.home >= shared.snapshots[0].score.home);
const sharedFixedMoments = shared.snapshots.map(item => item.moment).filter(id => ["hs_y1_match_moment_1", "hs_y1_match_moment_2", "hs_y1_match_moment_3"].includes(id));
verify("3. 固定進攻 Moment 1 → 3 保持順序；Moment 2 只在首個真實防守 Decision 成立", sharedFixedMoments[0] === "hs_y1_match_moment_1" && sharedFixedMoments.at(-1) === "hs_y1_match_moment_3"
  && (!sharedFixedMoments.includes("hs_y1_match_moment_2") || sharedFixedMoments.indexOf("hs_y1_match_moment_2") === 1));

const roleFlows = parse(`(() => ["starter","rotation","bench"].map(role=>{
  const match=__completeDirect(role); return {role,completed:match.completed,count:match.completedMoments.length,defensiveDecisions:match.matchDecisionDensityState.defensiveMeaningfulDecisionCount,domains:match.completedMoments.map(item=>item.domain),assignment:match.assignment};
}))()`);
verify("4. Starter／Rotation／Bench 都依 regulation 完成 density-controlled active decision loop", roleFlows.every(item => item.completed && item.count === item.defensiveDecisions + item.domains.filter(domain=>domain==="offense").length && item.domains.includes("offense") && item.assignment));
verify("5. 每條角色路線都正式涵蓋 offense 與 defense", roleFlows.every(item => new Set(item.domains).has("offense") && new Set(item.domains).has("defense")));

const positionContext = evaluate(`(() => {
  __setupHighSchoolMatch("rotation","捕手","high"); __resolveAndAdvance("zone",0.99);
  const text=getHighSchoolYearOneMatchPresentation(); const choices=getHighSchoolYearOneMatchMomentChoices().map(item=>item.text).join("｜");
  return text.includes("變化球提前落地") && choices.includes("擋住球") && player.highSchoolMatch.position==="捕手";
})()`);
verify("6. 守備 Moment 正式讀取 canonical primaryPosition", positionContext);
verify("7. 投打慣用側只提供可見 context，不 gate 選項", evaluate(`(() => { __setupHighSchoolMatch("bench","外野手","low"); player.bats="S";player.throws="L";return getHighSchoolYearOneMatchPresentation().includes("左右開弓／左投")&&getHighSchoolYearOneMatchMomentChoices().length===3; })()`));

const firstCausality = parse(`(() => {
  const run=(level,sample)=>{__setupHighSchoolMatch("starter","內野手",level);__resolveAndAdvance("attack",sample);return {moment:player.highSchoolMatch.currentMomentId,phase:player.highSchoolMatch.simulationPhase,domain:player.highSchoolMatch.currentDomain,coach:player.highSchoolMatch.coachInstruction,opponent:player.highSchoolMatch.opponentAdjustment,previous:player.highSchoolMatch.previousMomentOutcome};};
  return [run("high",0.99),run("low",0)];
})()`);
verify("8. Moment 1 成功與失敗都離開首段並形成不同教練 context", firstCausality.every(item => item.phase !== "moment_1_ready" && item.previous) && firstCausality[0].coach !== firstCausality[1].coach);
verify("9. 對手會依 Moment 1 選擇更新 hidden tactical truth", evaluate(`(() => { const contexts=[];for(const decision of ["attack","zone","advance"]){__setupHighSchoolMatch();__resolveAndAdvance(decision,0.5);contexts.push(player.highSchoolMatch.opponentTacticalTruth.code);}return new Set(contexts).size===3; })()`));

const secondCausality = parse(`(() => {
  const run=(level,sample)=>{__setupHighSchoolMatch("starter","內野手",level);__resolveAndAdvance("zone",sample);__resolveCurrent("secure",sample);__forceThirdMomentPath();__advanceToFinalMoment120(sample);return {moment:player.highSchoolMatch.currentMomentId,coach:player.highSchoolMatch.coachInstruction,opponent:player.highSchoolMatch.opponentAdjustment,previous:player.highSchoolMatch.previousMomentOutcome};};
  return [run("high",0.99),run("low",0)];
})()`);
verify("10. Moment 2 結果改變後續教練回應，Regulation 可優先終場", secondCausality.every(item => ["hs_y1_match_moment_3", ""].includes(item.moment) && item.previous) && secondCausality[0].coach !== secondCausality[1].coach);
verify("11. 前兩段失敗且比賽尚未結束時仍保留後續核心 Moment", evaluate(`(() => {__setupHighSchoolMatch("bench","內野手","low");__resolveAndAdvance("attack",0);__resolveCurrent("challenge",0);__forceThirdMomentPath();if(!__advanceToFinalMoment120(0))return false;if(player.highSchoolMatch.simulationPhase==="offensive_agency_ready"){const agency=getHighSchoolYearOneMatchMomentChoices()[0];if(!resolveHighSchoolYearOneMatch(agency.matchDecision,agency.matchMomentId,()=>0))return false;}const before=getHighSchoolYearOneMatchMomentChoices().length;const final=getHighSchoolYearOneMatchMomentChoices()[0];resolveHighSchoolYearOneMatch(final.matchDecision,final.matchMomentId,()=>0);return before===3&&player.highSchoolMatch.completedMoments.some(moment=>moment.id===highSchoolYearOneMomentIds[2]);})()`));

verify("12. Wrong／stale／replayed Moment submission 完全零 mutation", evaluate(`(() => {
  __setupHighSchoolMatch(); const wrongBefore=JSON.stringify(player); const wrong=resolveHighSchoolYearOneMatch("attack","hs_y1_match_moment_3",()=>0.99); const wrongStable=wrong===false&&JSON.stringify(player)===wrongBefore;
  const old=getHighSchoolYearOneMomentId();__resolveCurrent("attack",0.99);const after=JSON.stringify(player);const stale=resolveHighSchoolYearOneMatch("attack",old,()=>0.99);
  return wrongStable&&stale===false&&JSON.stringify(player)===after;
})()`));
verify("13. 不可跳過 Moment，非法 domain decision 也不產生效果", evaluate(`(() => {__setupHighSchoolMatch();const before=JSON.stringify(player);return resolveHighSchoolYearOneMatch("challenge",getHighSchoolYearOneMomentId(),()=>0.99)===false&&JSON.stringify(player)===before;})()`));

verify("14. strong／mixed／failure outcome 可 deterministic 注入測試", evaluate("getHighSchoolYearOneOutcomeTier(40,()=>0)==='strong' && getHighSchoolYearOneOutcomeTier(18,()=>0.5)==='mixed' && getHighSchoolYearOneOutcomeTier(0,()=>0.99)==='failure'"));
verify("15. 能力影響 outcome tier，但所有能力層級都有三個選項", evaluate(`(() => {const tiers=[];for(const level of ["high","low"]){__setupHighSchoolMatch("starter","內野手",level);const count=getHighSchoolYearOneMatchMomentChoices().length;__resolveCurrent("zone",level==="high"?0.99:0);tiers.push([count,player.highSchoolMatch.completedMoments[0].tier]);}return tiers[0][0]===3&&tiers[1][0]===3&&tiers[0][1]!==tiers[1][1];})()`));

const aggregate = parse(`(() => {
  __setupHighSchoolMatch("starter","內野手","high");__resolveAndAdvance("attack",0.99);__resolveCurrent("challenge",0.99);__forceThirdMomentPath();__advanceToFinalMoment120(.99);
  UNIVERSAL_BASEBALL_SKILL_KEYS.forEach(key=>player.baseballSkills[key]=1);SPECIALIST_BASEBALL_SKILL_KEYS.forEach(key=>player.baseballSkills[key]=0);Object.assign(player,{ballSense:0,observe:0,instinct:0,discipline:0});__resolveAndAdvance("zone",0);
  const match=player.highSchoolMatch;let safety=0;while(!match.completed&&safety++<900){if(isHighSchoolMatchDecisionVisible(match)){const choice=getHighSchoolYearOneMatchMomentChoices(match)[0];resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>0);}else if(isHighSchoolMatchPlaybackPhase(match))__resumeSimulation();else break;}
  const finalMoment=match.completedMoments.find(moment=>moment.id===highSchoolYearOneMomentIds[2]);
  return {last:finalMoment?.tier,firstOutcome:match.completedMoments[0].outcome,lastOutcome:finalMoment?.outcome,summary:match.performanceSummary,strong:match.playerContribution.strong,mixed:match.playerContribution.mixed,failure:match.playerContribution.failure,count:match.completedMoments.length};
})()`);
verify("16. Final summary 累積全部 Moment，不被最後一次結果覆蓋", aggregate.last && aggregate.strong + aggregate.mixed + aggregate.failure === aggregate.count && aggregate.summary.includes("關鍵時刻") && aggregate.summary.includes(aggregate.firstOutcome) && aggregate.summary.includes(aggregate.lastOutcome));

const separation = parse(`(() => {const match=__completeDirect("starter","high",0.99);return {strong:match.playerContribution.strong,result:match.teamResult,summary:match.performanceSummary};})()`);
verify("17. 個人表現與球隊賽果分開記錄", separation.strong > 0 && separation.result.includes("球隊") && separation.summary.includes("關鍵時刻") && !separation.summary.includes(separation.result));

verify("18. Match completion 與 season／exposure／scout effects 僅結算一次", evaluate(`(() => {const match=__completeDirect("rotation","high",0.99);const snapshot=JSON.stringify({season:player.seasonPerformance,recent:player.recentPerformance,exposure:player.exposure,scout:player.scoutEvaluation,flags:player.flags});const repeated=resolveHighSchoolYearOneMatch("zone","hs_y1_match_moment_3",()=>0.99);return match.settled&&repeated===false&&snapshot===JSON.stringify({season:player.seasonPerformance,recent:player.recentPerformance,exposure:player.exposure,scout:player.scoutEvaluation,flags:player.flags});})()`));

verify("19. Moment 1 後 save／reload 只恢復一次模擬並拒絕 replay", evaluate(`(() => {
  __setupHighSchoolMatch("rotation","外野手","high");__resolveCurrent("attack",0.99);const outcome=player.highSchoolMatch.previousMomentOutcome;saveGame();player=createInitialPlayer();loadGame();const resumed=player.highSchoolMatch.momentIndex===1&&player.highSchoolMatch.simulationPhase==="moment_2_ready"&&player.highSchoolMatch.completedMoments.length===1&&player.highSchoolMatch.previousMomentOutcome===outcome;const before=JSON.stringify(player.highSchoolMatch);const stale=resolveHighSchoolYearOneMatch("attack","hs_y1_match_moment_1",()=>0.99);return resumed&&stale===false&&JSON.stringify(player.highSchoolMatch)===before;
})()`));
verify("20. Moment 2 後 save／reload 保留第三段入口，且未提前完成", evaluate(`(() => {
  __setupHighSchoolMatch("starter","捕手","high");__resolveAndAdvance("zone",0.99);__resolveCurrent("secure",0.99);__forceThirdMomentPath();__resumeSimulation();const score=JSON.stringify(player.highSchoolMatch.scores);saveGame();player=createInitialPlayer();loadGame();return player.highSchoolMatch.momentIndex===2&&!player.highSchoolMatch.completed&&player.highSchoolMatch.completedMoments.length===2&&JSON.stringify(player.highSchoolMatch.scores)===score&&getHighSchoolYearOneMomentId()==="hs_y1_match_moment_3";
})()`));
verify("21. normalizeSave 深層恢復 completedMoments 與 accumulated contribution", evaluate(`(() => {const match=__completeDirect("bench");const saved=JSON.parse(JSON.stringify(player));const expected=JSON.stringify(saved.highSchoolMatch.playerContribution);const total=saved.highSchoolMatch.playerContribution.strong+saved.highSchoolMatch.playerContribution.mixed+saved.highSchoolMatch.playerContribution.failure;const restored=normalizeSave(saved);restored.highSchoolMatch.completedMoments[0].outcome="改寫";return saved.highSchoolMatch.completedMoments[0].outcome!=="改寫"&&total>=1&&JSON.stringify(restored.highSchoolMatch.playerContribution)===expected;})()`));

verify("22. Outcome 保留閱讀與 Continue，前兩段不推進 Career Spine", evaluate(`(() => {
  __setupHighSchoolMatch("starter","內野手","high");let safety=0;while(!isHighSchoolMatchDecisionVisible(player.highSchoolMatch)&&safety++<300)advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);const id=getHighSchoolYearOneMomentId();const ok=chooseHighSchoolYearOneMatchMoment("attack",id,()=>0.99);const held=pendingYouthSeasonOutcome?.eventId==="high_school_showcase"&&player.highSchoolStep===5&&document.getElementById("choices").innerHTML.includes("繼續");continueYouthSeasonOutcome();while(!isHighSchoolMatchDecisionVisible(player.highSchoolMatch)&&safety++<600)advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);return ok&&held&&player.highSchoolStep===5&&getCurrentEventId()==="high_school_showcase"&&player.highSchoolMatch.currentDomain==="defense";
})()`));
verify("23. Regulation 終場後只推進一次，Continue 才前往下一個高一事件", evaluate(`(() => {
  __setupHighSchoolMatch("starter","內野手","high");let safety=0;while(!player.highSchoolMatch.completed&&safety++<1200){if(isHighSchoolMatchDecisionVisible(player.highSchoolMatch)){const choice=getHighSchoolYearOneMatchMomentChoices()[0];chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>0.99);if(!player.highSchoolMatch.completed)continueYouthSeasonOutcome();}else advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);}const held=player.highSchoolStep===6&&pendingYouthSeasonOutcome?.eventId==="high_school_showcase";continueYouthSeasonOutcome();return held&&getCurrentEventId()==="high_school_call_home";
})()`));
verify("24. Regulation 合法結束的 legacy fixture 仍可跳過不存在的 Opportunity 2 並進入 Year One settlement", evaluate(`(() => {
  __setupHighSchoolMatch("rotation","內野手","high");let safety=0;while(!player.highSchoolMatch.completed&&safety++<1200){if(isHighSchoolMatchDecisionVisible(player.highSchoolMatch)){const choice=getHighSchoolYearOneMatchMomentChoices()[0];chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>0.99);continueYouthSeasonOutcome();}else advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);}
  choose("high_school_call_home",0);choose("high_school_scout_feedback",0);return player.highSchoolYearOneComplete&&player.chapter==="青棒第一年小結"&&player.highSchoolStep===10&&player.highSchoolDetail.includes("關鍵時刻");
})()`));

const visible = evaluate(`(() => {__setupHighSchoolMatch("bench","外野手","low");const text=getHighSchoolYearOneMatchPresentation()+getHighSchoolYearOneMatchMomentChoices().map(item=>item.text).join("");return !["hs_y1_match_moment","matchDecision","playerContribution","outcomeTier"].some(raw=>text.includes(raw));})()`);
verify("25. 玩家可見比賽內容沒有 raw identifier", visible);
const finalContextProof = parse(`(() => {
  __setupHighSchoolMatch("bench","內野手","low");__resolveAndAdvance("attack",0);__resolveCurrent("challenge",0);__forceThirdMomentPath();__advanceToFinalMoment120(0);
  const context=getHighSchoolYearOneMatchPresentation()+getHighSchoolYearOneMatchMomentChoices().map(item=>item.text).join("｜");
  Object.assign(player.baseballSkills,{batting:4,baseballIQ:4});player.ballSense=2;__resolveAndAdvance("advance",0.5);
  const finalMoment=player.highSchoolMatch.completedMoments.at(-1);
  return {context,consequence:finalMoment.consequence,objective:finalMoment.objective,approach:finalMoment.approach,resultCode:finalMoment.resultCode};
})()`);
verify("26. 終盤進攻依實際壘況保存 Objective／Approach 並由真實 PA 結果解釋", !finalContextProof.context.includes("優先完成跑者推進")&&Boolean(finalContextProof.objective)&&Boolean(finalContextProof.approach)&&Boolean(finalContextProof.resultCode)&&!finalContextProof.consequence.includes("預設完成推進"));

console.log(`\nHigh School Integration 1.2：${passed}/${passed} 通過`);
