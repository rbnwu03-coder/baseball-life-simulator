const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "team-roster-foundation.js", "team-strength-model.js", "high-school-entry-roster-context.js",
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "pitcher-catcher-tactical-integration.js", "batter-anticipation.js", "batted-ball-physical.js", "batted-ball-outcome-mapping.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "force-advancement.js", "offensive-bunt-defensive-handoff.js", "batted-ball-ground-defense.js",
  "batted-ball-line-drive-defense.js", "batted-ball-fly-ball-defense.js", "batted-ball-tag-up-execution.js", "match-situation-lifecycle.js",
  "plate-decision-foundation.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js", "playing-time-game-exposure.js",
  "match-experience-development.js", "high-school-competition-reassessment.js", "high-school-year-transition.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js",
  "career-development-progression.js", "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "ai-plate-appearance-outcome.js", "defensive-runner-throw-settlement-foundation.js", "script.js"
];
const nodes = new Map();
const storage = new Map();
const context = vm.createContext({
  console: { log() {}, warn() {}, error: console.error },
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
    setItem(key, value) { storage.set(key, value); }, getItem(key) { return storage.get(key) || null; }, removeItem(key) { storage.delete(key); }
  },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));

evaluate(`
  function __y2LoopFixture(seed=130001, role="bench", priorScores=[]) {
    stopHighSchoolMatchPlayback();
    player=createRepresentativeHighSchoolEntryFixture("ordinary",seed);
    player.name="Y2 Loop "+seed;
    applyCanonicalPositionProfile(player,"游擊手",["二壘手"]);
    ["ballSense","observe","fitness","instinct","discipline","pressure"].forEach(key=>player[key]=14);
    Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=12);
    player.schoolInvitationState=createDefaultSchoolInvitationState();
    const invitations=generateSchoolInvitationSet(player,{generationSeed:"y2-loop-"+seed});
    finalizeSchoolInvitationSelection(player,invitations.invitations[0].schoolId);
    materializeSelectedHighSchoolRoster(player,{rosterRole:role==="starter"?"starter":"bench",playerPosition:"SS"});
    player.highSchoolRoleCode=role;
    player.highSchoolTeamRole=HighSchoolCompetitionReassessment.ROLE_LABELS[role];
    player.highSchoolRoleContext={code:role,label:player.highSchoolTeamRole,evidence:[],opportunity:"",assignment:""};
    let evaluation=HighSchoolCompetitionReassessment.createEvaluationState(getHighSchoolCompetitionEvaluationIdentity(player));
    priorScores.forEach((score,index)=>{
      const evidence={matchIdentity:"hs-y1-prior-"+(index+1),trainingEvidence:{score:score>0?1:-1},matchEvidence:{quality:score},exposureEvidence:{noAppearance:false,plateAppearances:2,defensiveInnings:3},sampleScore:score};
      evaluation=HighSchoolCompetitionReassessment.updateCompetitionEvaluation(evaluation,evidence,evaluation.evaluationIdentity).state;
      const opportunity={decisionId:"hs-y1-prior-opportunity-"+(index+1),matchId:evidence.matchIdentity,actualRole:role,plannedUsage:{appearanceType:"start",entryInning:1,entryHalf:"上"}};
      player.highSchoolOpportunityHistory=HighSchoolCompetitionReassessment.recordOpportunity(player.highSchoolOpportunityHistory,{opportunity,opportunityIndex:index+1,roleAtCreation:role,actualExposure:{appearanceType:"start",plateAppearances:2,defensiveInnings:3}});
    });
    player.highSchoolCompetitionEvaluation=evaluation;
    player.relationships.coachTrust=5;
    player.highSchoolStep=10;
    player.highSchoolYearOneComplete=true;
    player.chapter="青棒第一年小結";
    player.highSchoolMatch={...createInitialPlayer().highSchoolMatch,id:"hs-y1-complete",completed:true,settled:true,eventSettlementApplied:true,developmentPresentationCompleted:true};
    enterHighSchoolYearTwo();
    return player;
  }
  function __finishY2Match(match,tier="strong",participated=true) {
    match.playerLineupStatus=participated?"substitute":"bench";
    match.playerEntryCompleted=participated;
    match.inning=7;match.half="終";match.scores={home:tier==="strong"?4:1,away:tier==="failure"?4:1};
    match.simulationLog=participated?[{sequence:1,type:"playerEntry",inning:4,half:"下"},{sequence:2,type:"plateAppearance",inning:5,half:"下",batterId:"player",result:tier==="strong"?"single":"out"}]:[];
    match.completedMoments=participated?[0,1,2].map(index=>({decision:index===1?"secure":"zone",tier,outcome:tier+" outcome",decisionQuality:tier==="strong"?"strong":"poor",executionQuality:tier==="strong"?"complete":"failed",scores:{...match.scores},runners:[],runnerChanges:[],scoringRunnerIds:[]})):[];
    match.playerContribution=!participated
      ? {strong:0,mixed:0,failure:0,runsCreated:0,runsScored:0,hits:0,walks:0,outsCreated:0,errors:0}
      : tier==="strong"?{strong:3,mixed:0,failure:0,runsCreated:1,runsScored:1,hits:1,walks:0,outsCreated:1,errors:0}:{strong:0,mixed:0,failure:3,runsCreated:0,runsScored:0,hits:0,walks:0,outsCreated:0,errors:1};
    settleHighSchoolYearOneMatch(match,"secure");
    return match;
  }
`);

evaluate("__y2LoopFixture(130001,'bench',[])");
const springBefore = parse("player.highSchoolNextOpportunity");
evaluate("player.relationships.coachTrust=1;player.body.fatigue=12;player.body.pain=3;player.body.injuryRisk=7;refreshHighSchoolYearTwoSpringOpportunity()");
const springTired = parse("player.highSchoolNextOpportunity");
evaluate("player.relationships.coachTrust=10;player.body.fatigue=0;player.body.pain=0;player.body.injuryRisk=0;Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=20);refreshHighSchoolYearTwoSpringOpportunity()");
const springReady = parse("player.highSchoolNextOpportunity");
verify("1. Spring refresh 保持 Opportunity identity", springBefore.decisionId === springTired.decisionId && springTired.decisionId === springReady.decisionId);
verify("2. Spring refresh 保持 match／year／phase identity", springReady.matchId === "hs-y2-spring-evaluation-1" && springReady.highSchoolYear === 2 && springReady.opportunityIndex === 1 && springReady.phase === "year-two-spring-evaluation");
verify("3. Coach／fatigue／pain／injury risk 進入 refresh snapshot", springReady.readinessRefresh.coachTrust === 10 && springTired.readinessRefresh.fatigue === 12 && springTired.readinessRefresh.pain === 3 && springTired.readinessRefresh.injuryRisk === 7);
verify("4. 最終準備狀態可改善同一 Opportunity score", springReady.debug.opportunityScore > springTired.debug.opportunityScore);
verify("5. Refresh 更新同一 history record 而非新增 Opportunity", parse("player.highSchoolOpportunityHistory.filter(item=>item.matchId==='hs-y2-spring-evaluation-1').length") === 1);
verify("6. Training/readiness refresh 不增加 performance sample", parse("player.highSchoolCompetitionEvaluation.sampleCount") === 0 && parse("player.highSchoolRoleCode") === "bench");

const springMatch = parse("(() => {const m=prepareHighSchoolYearTwoEvaluationMatch();return {id:m.id,type:m.matchType,year:m.highSchoolYear,index:m.opportunityIndex,home:m.rosters.home.lineup.map(x=>x.id),away:m.rosters.away.lineup.map(x=>x.id),roster:player.schoolInvitationState.selectedSchoolYearRosterIdentity.identity};})()");
verify("7. Canonical Spring 永遠進 Existing Match Engine", springMatch.id === "hs-y2-spring-evaluation-1" && springMatch.type === "year-two-spring-evaluation" && springMatch.home.length === 9);
verify("8. Spring 使用 evolved Y2 roster identity", springMatch.roster.includes("hs-year-2-age-17"));
evaluate("__finishY2Match(player.highSchoolMatch,'strong',true)");
const postSpring = parse("({role:player.highSchoolRoleCode,evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolYearTwoMatchHistory,next:player.highSchoolNextOpportunity})");
verify("9. Spring settlement 形成 Y2 evidence #1", postSpring.evaluation.sampleCount === 1 && postSpring.evaluation.evidenceHistory.at(-1).matchIdentity === "hs-y2-spring-evaluation-1");
verify("10. Autumn Opportunity 不在 preparation events 前預建", postSpring.next === null);

evaluate("player.highSchoolYearTwoStep=6;player.relationships.coachTrust=9;player.body.fatigue=2;ensureHighSchoolYearTwoAutumnOpportunity()");
const autumn = parse("player.highSchoolNextOpportunity");
verify("11. Autumn 建立獨立 deterministic Opportunity 2", autumn.matchId === "hs-y2-autumn-evaluation-2" && autumn.opportunityIndex === 2 && autumn.highSchoolYear === 2 && autumn.decisionId !== springReady.decisionId);
verify("12. Autumn 讀 post-Spring role／trend／actual exposure", autumn.actualRole === postSpring.role && autumn.evaluationTrend === Math.max(-4, Math.min(4, postSpring.evaluation.trendScore)) && autumn.previousActualExposure.plateAppearances > 0);
verify("13. Autumn 讀最新 trust／health context", autumn.debug.scoreBreakdown.coachTrust > 0 && Object.hasOwn(autumn.debug.scoreBreakdown,"healthReadiness"));
const autumnReload = evaluate("JSON.stringify(player.highSchoolNextOpportunity)");
evaluate("player=normalizeSave(JSON.parse(JSON.stringify(player)))");
verify("14. Autumn Opportunity save/reload 不 reroll", autumnReload === evaluate("JSON.stringify(player.highSchoolNextOpportunity)"));

const autumnMatch = parse("(() => {const springAway=" + JSON.stringify(springMatch.away) + ";const m=prepareHighSchoolYearTwoAutumnMatch();return {id:m.id,type:m.matchType,index:m.opportunityIndex,home:m.rosters.home.lineup.map(x=>x.id),away:m.rosters.away.lineup.map(x=>x.id),differentOpponent:JSON.stringify(springAway)!==JSON.stringify(m.rosters.away.lineup.map(x=>x.id)),selected:player.schoolInvitationState.selectedSchoolYearRosterIdentity.identity};})()");
verify("15. Autumn 進 Existing Match Engine", autumnMatch.id === "hs-y2-autumn-evaluation-2" && autumnMatch.type === "year-two-autumn-evaluation" && autumnMatch.home.length === 9);
verify("16. Autumn 沿用 selected Y2 roster 且使用不同 opponent identity", autumnMatch.selected === springMatch.roster && autumnMatch.differentOpponent);
const pendingAutumn = evaluate("JSON.stringify({id:player.highSchoolMatch.id,phase:player.highSchoolMatch.simulationPhase,cursor:player.highSchoolMatch.simulationCursor,home:player.highSchoolMatch.rosters.home.lineup.map(x=>x.id),away:player.highSchoolMatch.rosters.away.lineup.map(x=>x.id),next:player.highSchoolNextOpportunity})");
evaluate("player=normalizeSave(JSON.parse(JSON.stringify(player)))");
verify("16a. Autumn pending Match save/reload 保留 roster、cursor 與 Opportunity", pendingAutumn === evaluate("JSON.stringify({id:player.highSchoolMatch.id,phase:player.highSchoolMatch.simulationPhase,cursor:player.highSchoolMatch.simulationCursor,home:player.highSchoolMatch.rosters.home.lineup.map(x=>x.id),away:player.highSchoolMatch.rosters.away.lineup.map(x=>x.id),next:player.highSchoolNextOpportunity})"));
verify("17. Canonical Autumn event choices 來自 Match decision 而非 fixed performance effects", parse("getEvent('high_school_year_two_autumn_stage').choices.every(choice=>choice.matchDecision||choice.agencyDecision)") === true);
evaluate("__finishY2Match(player.highSchoolMatch,'strong',true)");
const postAutumn = parse("({evaluation:player.highSchoolCompetitionEvaluation,matches:player.highSchoolYearTwoMatchHistory,opportunities:player.highSchoolOpportunityHistory,role:player.highSchoolRoleCode,next:player.highSchoolNextOpportunity,feedback:player.highSchoolMatch.competitionFeedback})");
verify("18. Autumn settlement 形成獨立 Y2 evidence #2", postAutumn.evaluation.sampleCount === 2 && postAutumn.evaluation.evidenceHistory.at(-1).matchIdentity === "hs-y2-autumn-evaluation-2");
verify("19. Y2 formal history 保存 Spring 與 Autumn", postAutumn.matches.length === 2 && postAutumn.matches.map(x=>x.matchId).join("|") === "hs-y2-spring-evaluation-1|hs-y2-autumn-evaluation-2");
verify("20. Opportunity history 保存 Y2 Spring 與 Autumn 且不超過 bounded limit", postAutumn.opportunities.filter(x=>x.matchId.startsWith("hs-y2-")).length === 2 && postAutumn.opportunities.length <= 5);
verify("21. Autumn 後提供 player-facing canonical reassessment feedback", postAutumn.feedback.includes("正式角色") && postAutumn.feedback.includes("評估趨勢"));
const once = evaluate("JSON.stringify({evaluation:player.highSchoolCompetitionEvaluation,matches:player.highSchoolYearTwoMatchHistory,opportunities:player.highSchoolOpportunityHistory,development:player.developmentState})");
verify("22. Autumn settlement exactly once", evaluate("settleHighSchoolYearOneMatch(player.highSchoolMatch,'secure')") === false && once === evaluate("JSON.stringify({evaluation:player.highSchoolCompetitionEvaluation,matches:player.highSchoolYearTwoMatchHistory,opportunities:player.highSchoolOpportunityHistory,development:player.developmentState})"));

evaluate("player.flags.push('year_two_plan_position');player.highSchoolYearTwoStep=8;evaluateHighSchoolYearTwo()");
const summary = parse("({result:player.highSchoolYearTwoResult,detail:player.highSchoolYearTwoDetail,chapter:player.chapter})");
verify("23. Y2 Summary 消費兩場 exposure 與 starting/ending role", summary.chapter === "青棒第二年小結" && summary.detail.includes("春季") && summary.detail.includes("秋季") && summary.detail.includes("正式角色由"));
verify("24. Y2 Summary 不依賴 legacy autumn proof flag", !parse("player.flags.includes('year_two_autumn_secure_out')") && summary.result.length > 0);
evaluate("player=normalizeSave(JSON.parse(JSON.stringify(player)))");
verify("24a. Y2 Summary save/reload 保持相同 systemic journey", summary.result === evaluate("player.highSchoolYearTwoResult") && summary.detail === evaluate("player.highSchoolYearTwoDetail") && evaluate("player.chapter") === "青棒第二年小結");
const y2Roster = parse("player.schoolInvitationState.selectedBaseRoster.players.map(x=>({id:x.playerId,year:x.year}))");
evaluate("enterCriticalYear()");
const y3 = parse("({chapter:player.chapter,year:player.highSchoolYearTransitionState.currentHighSchoolYear,identity:player.schoolInvitationState.selectedSchoolYearRosterIdentity,roster:player.schoolInvitationState.selectedBaseRoster,competition:player.schoolInvitationState.selectedPositionCompetitionContext,role:player.highSchoolRoleCode,next:player.highSchoolNextOpportunity})");
verify("25. Y2→Y3 production 使用 generic transition 並更新 roster identity", y3.chapter === "青棒關鍵年" && y3.year === 3 && y3.identity.yearIdentity === "hs-year-3-age-18");
verify("26. Y3 移除 Y2 year-3 actors並保留未畢業 IDs", y2Roster.filter(x=>x.year >= 3).every(x=>!y3.roster.players.some(a=>a.playerId===x.id)) && y2Roster.filter(x=>x.year < 3).every(x=>y3.roster.players.some(a=>a.playerId===x.id)));
verify("27. Y3 重算 competition 且不預建 Y3 season content", y3.competition.position && y3.next === null);
const y3Reload = evaluate("JSON.stringify({state:player.highSchoolYearTransitionState,school:player.schoolInvitationState,role:player.highSchoolRoleCode,evaluation:player.highSchoolCompetitionEvaluation})");
evaluate("player=normalizeSave(JSON.parse(JSON.stringify(player)))");
verify("28. Y3 entry save/reload 不 reroll", y3Reload === evaluate("JSON.stringify({state:player.highSchoolYearTransitionState,school:player.schoolInvitationState,role:player.highSchoolRoleCode,evaluation:player.highSchoolCompetitionEvaluation})"));

evaluate("__y2LoopFixture(130002,'bench',[]);player.highSchoolYearTwoStep=2;__finishY2Match(prepareHighSchoolYearTwoEvaluationMatch(),'strong',true);player.highSchoolYearTwoStep=6;ensureHighSchoolYearTwoAutumnOpportunity();__finishY2Match(prepareHighSchoolYearTwoAutumnMatch(),'strong',true)");
verify("29. Y2-only Bench 兩筆正向 evidence 依原 threshold 可升 Rotation", evaluate("player.highSchoolCompetitionEvaluation.sampleCount") === 2 && evaluate("player.highSchoolRoleCode") === "rotation");

evaluate("__y2LoopFixture(130003,'bench',[]);player.highSchoolYearTwoStep=2;__finishY2Match(prepareHighSchoolYearTwoEvaluationMatch(),'strong',false);player.highSchoolYearTwoStep=6;ensureHighSchoolYearTwoAutumnOpportunity();__finishY2Match(prepareHighSchoolYearTwoAutumnMatch(),'failure',false);globalThis.__noAppearanceEvidence=player.highSchoolCompetitionEvaluation.evidenceHistory.map(x=>({noAppearance:x.exposureEvidence.noAppearance,sampleSize:x.matchEvidence.sampleSize,quality:x.matchEvidence.quality}))");
verify("30. Spring／Autumn no appearance 不增加 performance sample", parse("globalThis.__noAppearanceEvidence").every(item => item.noAppearance && item.sampleSize === 0 && item.quality === 0));

evaluate("__y2LoopFixture(130004,'rotation',[3]);player.highSchoolYearTwoStep=2;__finishY2Match(prepareHighSchoolYearTwoEvaluationMatch(),'strong',true);player.highSchoolYearTwoStep=6;ensureHighSchoolYearTwoAutumnOpportunity();__finishY2Match(prepareHighSchoolYearTwoAutumnMatch(),'strong',true)");
verify("31. Rotation 可由累積三筆正向 evidence 依既有 threshold 升 Starter", evaluate("player.highSchoolCompetitionEvaluation.sampleCount") === 3 && evaluate("player.highSchoolRoleCode") === "starter");

evaluate("__y2LoopFixture(130005,'starter',[-0.5,-0.5]);player.highSchoolYearTwoStep=2;__finishY2Match(prepareHighSchoolYearTwoEvaluationMatch(),'failure',true);player.highSchoolYearTwoStep=6;ensureHighSchoolYearTwoAutumnOpportunity();__finishY2Match(prepareHighSchoolYearTwoAutumnMatch(),'failure',true)");
verify("32. Starter 連續負向 Spring／Autumn evidence 可依既有 threshold demote", ["rotation","bench"].includes(evaluate("player.highSchoolRoleCode")) && evaluate("player.highSchoolCompetitionEvaluation.demotionPressure") > 0);

evaluate("__y2LoopFixture(130006,'rotation',[]);player.highSchoolYearTwoStep=2;__finishY2Match(prepareHighSchoolYearTwoEvaluationMatch(),'strong',true);player.highSchoolYearTwoStep=6;ensureHighSchoolYearTwoAutumnOpportunity();__finishY2Match(prepareHighSchoolYearTwoAutumnMatch(),'failure',true)");
verify("33. Spring good／Autumn bad mixed path 不強制角色變化", evaluate("player.highSchoolRoleCode") === "rotation");

const strongAutumnScore = evaluate("__y2LoopFixture(130007,'bench',[]);player.highSchoolYearTwoStep=2;__finishY2Match(prepareHighSchoolYearTwoEvaluationMatch(),'strong',true);player.highSchoolYearTwoStep=6;ensureHighSchoolYearTwoAutumnOpportunity().debug.opportunityScore");
const poorAutumnScore = evaluate("__y2LoopFixture(130007,'bench',[]);player.highSchoolYearTwoStep=2;__finishY2Match(prepareHighSchoolYearTwoEvaluationMatch(),'failure',true);player.highSchoolYearTwoStep=6;ensureHighSchoolYearTwoAutumnOpportunity().debug.opportunityScore");
verify("34. Spring result 透過 evaluation trend 改變 Autumn Opportunity", strongAutumnScore > poorAutumnScore);

evaluate("__y2LoopFixture(130008,'bench',[]);applyCanonicalPositionProfile(player,'投手',[]);materializeSelectedHighSchoolRoster(player,{rosterRole:'bench',playerPosition:'P',refreshCompetition:true});player.highSchoolNextOpportunity=null;ensureHighSchoolYearTwoSpringOpportunity();globalThis.__pitcherSpring=JSON.parse(JSON.stringify(player.highSchoolNextOpportunity));player.highSchoolYearTwoStep=2;__finishY2Match(prepareHighSchoolYearTwoEvaluationMatch(),'strong',false);player.highSchoolYearTwoStep=6;ensureHighSchoolYearTwoAutumnOpportunity();globalThis.__pitcherAutumn=JSON.parse(JSON.stringify(player.highSchoolNextOpportunity));__finishY2Match(prepareHighSchoolYearTwoAutumnMatch(),'strong',false);player.flags.push('year_two_plan_position');player.highSchoolYearTwoStep=8;evaluateHighSchoolYearTwo();globalThis.__pitcherSummary=player.highSchoolYearTwoDetail");
const pitcher = parse("({spring:globalThis.__pitcherSpring,autumn:globalThis.__pitcherAutumn,summary:globalThis.__pitcherSummary})");
verify("35. Canonical P route 在 Spring／Autumn 一致 deferred/noAppearance", pitcher.spring.pitcherExposureDeferred && pitcher.autumn.pitcherExposureDeferred && pitcher.spring.plannedUsage.appearanceType === "noAppearance" && pitcher.autumn.plannedUsage.appearanceType === "noAppearance");
verify("36. Pitcher Summary 不偽造正式投球證明", pitcher.summary.includes("pitcher") === false && pitcher.summary.includes("投手使用仍延後處理") && pitcher.summary.includes("沒有虛構正式投球局數"));

evaluate("__y2LoopFixture(130009,'rotation',[]);applyCanonicalPositionProfile(player,'捕手',['一壘手']);materializeSelectedHighSchoolRoster(player,{rosterRole:'bench',playerPosition:'C',refreshCompetition:true});player.highSchoolNextOpportunity=null;ensureHighSchoolYearTwoSpringOpportunity();globalThis.__catcherOpportunity=JSON.parse(JSON.stringify(player.highSchoolNextOpportunity));globalThis.__catcherMatch=prepareHighSchoolYearTwoEvaluationMatch()");
verify("37. Canonical C route 保留 Catcher-compatible formal Match", evaluate("globalThis.__catcherOpportunity.assignedPosition") === "捕手" && !evaluate("globalThis.__catcherOpportunity.pitcherExposureDeferred") && evaluate("globalThis.__catcherMatch.id") === "hs-y2-spring-evaluation-1");

console.log(`High School Year Two Competition Loop: ${passed}/${passed} passed.`);
