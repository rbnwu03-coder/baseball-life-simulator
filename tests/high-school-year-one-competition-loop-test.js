const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "team-roster-foundation.js", "team-strength-model.js", "high-school-entry-roster-context.js",
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "pitcher-catcher-tactical-integration.js", "batter-anticipation.js", "batted-ball-physical.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "force-advancement.js", "offensive-bunt-defensive-handoff.js", "batted-ball-ground-defense.js",
  "batted-ball-line-drive-defense.js", "batted-ball-fly-ball-defense.js", "batted-ball-tag-up-execution.js", "match-situation-lifecycle.js",
  "plate-decision-foundation.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js", "playing-time-game-exposure.js",
  "match-experience-development.js", "high-school-competition-reassessment.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js",
  "career-development-progression.js", "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];
const nodes = new Map();
const storage = new Map();
const context = vm.createContext({
  console: { log() {}, warn() {}, error: console.error },
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, { id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; } }); return nodes.get(id); },
    querySelector() { return null; }, querySelectorAll() { return []; }
  },
  localStorage: { setItem(key, value) { storage.set(key, value); }, getItem(key) { return storage.get(key) || null; }, removeItem(key) { storage.delete(key); } },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));

evaluate(`
  function __competitionLoopPlayer(seed=97001, role="bench") {
    stopHighSchoolMatchPlayback();
    player=createRepresentativeHighSchoolEntryFixture("ordinary",seed);
    player.name="Competition "+seed;
    applyCanonicalPositionProfile(player,"游擊手",["二壘手"]);
    player.schoolInvitationState=createDefaultSchoolInvitationState();
    const state=generateSchoolInvitationSet(player,{generationSeed:"competition-loop-"+seed});
    const selected=state.invitations[0];
    finalizeSchoolInvitationSelection(player,selected.schoolId);
    materializeSelectedHighSchoolRoster(player,{rosterRole:"bench"});
    completeHighSchoolEntry({source:"competition-loop-test"});
    player.highSchoolStep=5;
    player.highSchoolRoleCode=role;
    player.highSchoolTeamRole=HighSchoolCompetitionReassessment.ROLE_LABELS[role];
    player.highSchoolRoleContext={code:role,label:player.highSchoolTeamRole,evidence:[],opportunity:"",assignment:""};
    pendingHighSchoolMatchSimulationSeed=seed+100;
    return selected;
  }
  function __settlePositiveCompetitionMatch(seed=97001) {
    const selected=__competitionLoopPlayer(seed,"bench");
    const match=prepareHighSchoolYearOneMatch();
    const firstOpportunity=JSON.parse(JSON.stringify(match.gameExposureState.opportunitySnapshot));
    match.playerLineupStatus="substitute";
    match.playerEntryCompleted=true;
    match.inning=7; match.half="終";
    match.simulationLog=[
      {sequence:1,type:"playerEntry",inning:5,half:"下"},
      {sequence:2,type:"halfInningEnd",inning:6,half:"上"},
      {sequence:3,type:"plateAppearance",inning:6,half:"下",batterId:"player",result:"single"},
      {sequence:4,type:"halfInningEnd",inning:7,half:"上"}
    ];
    match.completedMoments=[
      {decision:"zone",tier:"strong",outcome:"選球與執行成功",decisionQuality:"strong",executionQuality:"strong",scores:{home:0,away:0},runners:[],runnerChanges:[],scoringRunnerIds:[]},
      {decision:"advance",tier:"strong",outcome:"守備執行成功",decisionQuality:"strong",executionQuality:"complete",scores:{home:0,away:0},runners:[],runnerChanges:[],scoringRunnerIds:[]}
    ];
    match.playerContribution={strong:2,mixed:0,failure:0,runsCreated:1,runsScored:0,hits:1,walks:0,outsCreated:1,errors:0};
    settleHighSchoolYearOneMatch(match,"zone");
    return {selected,match,firstOpportunity,next:player.highSchoolNextOpportunity,evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,schoolState:player.schoolInvitationState,feedback:getEvent("high_school_scout_feedback").text(),evaluationText:formatHighSchoolCompetitionEvaluation(player.highSchoolCompetitionEvaluation)};
  }
`);

const firstPlan = parse(`(() => {__competitionLoopPlayer(97001,"bench");const m=prepareHighSchoolYearOneMatch();return {decision:m.gameExposureState.opportunitySnapshot,state:m.gameExposureState,history:player.highSchoolOpportunityHistory};})()`);
verify("1. Opportunity 1 建立正式 persistent history", firstPlan.history.length === 1 && firstPlan.history[0].opportunityIndex === 1 && firstPlan.history[0].opportunityId === firstPlan.decision.decisionId);
const firstReload = evaluate(`(() => {const before=JSON.stringify({exposure:player.highSchoolMatch.gameExposureState,history:player.highSchoolOpportunityHistory});player=normalizeSave(JSON.parse(JSON.stringify(player)));return before===JSON.stringify({exposure:player.highSchoolMatch.gameExposureState,history:player.highSchoolOpportunityHistory});})()`);
verify("2. Opportunity 1 save/reload 不 reroll", firstReload);

const loop = parse(`__settlePositiveCompetitionMatch(97002)`);
verify("3. Match settlement 後建立 accumulated evaluation", loop.evaluation.version === "high-school-competition-evaluation-v1" && loop.evaluation.sampleCount === 1);
verify("4. Evaluation 消費 current readiness、coach trust 與 health", loop.evaluation.trainingEvidence.positionReadiness >= 0 && Number.isFinite(loop.evaluation.trainingEvidence.coachTrust) && Number.isFinite(loop.evaluation.trainingEvidence.fatigue));
verify("5. Evaluation 消費 actual PA／defensive innings", loop.evaluation.exposureEvidence.enteredGame && loop.evaluation.exposureEvidence.plateAppearances === 1 && loop.evaluation.exposureEvidence.defensiveInnings === 2);
verify("6. Evaluation 消費 canonical match decision／execution 與 Match Experience truth", loop.evaluation.matchEvidence.quality > 0 && loop.evaluation.matchEvidence.decisionExecutionSamples === 2 && loop.evaluation.matchEvidence.matchExperienceEvidenceCount === loop.match.matchExperience.evidenceSummary.total && loop.evaluation.matchEvidence.matchExperienceSettlementId === loop.match.matchExperience.matchExperienceSettlementId);
verify("7. 單一正向樣本因 smoothing 維持 Bench", loop.evaluation.lastReassessmentReason.includes("limitedSample") && loop.match.role === "bench" && loop.next.actualRole === "bench");
verify("8. Match 1 history 回填 actual exposure 與 evaluation consequence", loop.history[0].actualExposure.plateAppearances === 1 && loop.history[0].evaluationConsequence.trend === "positive");
verify("9. Production settlement 正式建立 Opportunity N+1", loop.next.matchId === "hs-y1-followup-evaluation-2" && loop.next.opportunityIndex === 2 && loop.history.length === 2);
verify("10. Opportunity N+1 讀 updated evaluation trend 與前次 actual exposure", loop.next.evaluationTrend > 0 && loop.next.previousActualExposure.plateAppearances === 1 && loop.next.previousMatchId === "hs-y1-autumn-exhibition");
verify("11. Opportunity N+1 使用 current canonical role 而非 projected role", loop.next.actualRole === loop.next.actualRoleAtDecision && loop.next.actualRole === "bench" && loop.next.projectedRolePrior === loop.selected.projectedRole);
verify("12. Opportunity N+1 identity 綁定 school-year／phase／index 且與 Opportunity 1 不同", loop.next.decisionId !== loop.firstOpportunity.decisionId && loop.next.opportunitySeed !== loop.firstOpportunity.opportunitySeed && loop.next.opportunitySeed.includes(loop.selected.schoolYearRosterIdentity.identity) && loop.next.opportunitySeed.includes("post-autumn-evaluation|2"));
verify("13. Competition refresh 重算 current player gap", Number.isFinite(loop.schoolState.selectedPositionCompetitionContext.playerRelativeGap) && loop.next.competitionSnapshot.playerRelativeGap === loop.schoolState.selectedPositionCompetitionContext.playerRelativeGap);
verify("14. selected school-year identity 在 N → N+1 不變", loop.schoolState.selectedSchoolYearRosterIdentity.identity === loop.selected.schoolYearRosterIdentity.identity);
verify("15. Canonical incumbent actors 在 refresh 後全數保留", loop.selected.baseRoster.players.every(actor => loop.schoolState.selectedSchoolRoster.players.some(current => current.playerId === actor.playerId)));
verify("15a. 賽後 production narrative 顯示已建立的下一次評估安排", loop.feedback.includes("下一次隊內評估安排") && loop.feedback.includes("本場先從板凳"));
verify("15b. 玩家可讀評估不洩漏 raw reason identifiers", loop.evaluationText.includes("上升") && !/sustained|limitedSample|competitionGap|trainingImprovement|noActualExposure/.test(loop.evaluationText));

const reloadLoop = evaluate(`(() => {const before=JSON.stringify({role:player.highSchoolRoleCode,evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,competition:player.schoolInvitationState.selectedPositionCompetitionContext,next:player.highSchoolNextOpportunity,roster:player.schoolInvitationState.selectedSchoolRoster});player=normalizeSave(JSON.parse(JSON.stringify(player)));return before===JSON.stringify({role:player.highSchoolRoleCode,evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,competition:player.schoolInvitationState.selectedPositionCompetitionContext,next:player.highSchoolNextOpportunity,roster:player.schoolInvitationState.selectedSchoolRoster});})()`);
verify("16. Role／evaluation／history／competition／N+1／roster reload 穩定", reloadLoop);
const exactlyOnce = parse(`(() => {const before=JSON.stringify({evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,role:player.highSchoolRoleCode,next:player.highSchoolNextOpportunity});const result=applyHighSchoolCompetitionMatchSettlement(player.highSchoolMatch);return {status:result.status,same:before===JSON.stringify({evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,role:player.highSchoolRoleCode,next:player.highSchoolNextOpportunity})};})()`);
verify("17. 重進結算不重複 evaluation／role／history", exactlyOnce.status === "duplicate" && exactlyOnce.same);

const rosterTransition = parse(`(() => {
  __competitionLoopPlayer(97003,"rotation");
  const baseIds=player.schoolInvitationState.selectedBaseRoster.players.map(x=>x.playerId);
  const competition=refreshSelectedPositionCompetitionContext(player,"游擊手");
  let evaluation=HighSchoolCompetitionReassessment.createEvaluationState("promotion-fixture");
  const make=(id,score)=>({matchIdentity:id,sampleScore:score,trainingEvidence:{score:2},matchEvidence:{quality:4},exposureEvidence:{noAppearance:false}});
  for(const item of [["a",3],["b",3],["c",3]]) evaluation=HighSchoolCompetitionReassessment.updateCompetitionEvaluation(evaluation,make(item[0],item[1]),"promotion-fixture").state;
  competition.playerRelativeGap=-.2;
  const promoted=HighSchoolCompetitionReassessment.reassessRole({currentRole:"rotation",evaluation,competition});
  HighSchoolCompetitionReassessment.applyRoleResult(player,promoted);
  const starterRoster=materializeSelectedHighSchoolRoster(player,{rosterRole:"starter",playerPosition:"游擊手",refreshCompetition:true});
  const displaced=starterRoster.playerInjection.replacedPlayerId;
  const demoted=HighSchoolCompetitionReassessment.reassessRole({currentRole:"starter",evaluation:(()=>{let s=HighSchoolCompetitionReassessment.createEvaluationState("demotion-fixture");for(const item of [["d",-3],["e",-3]])s=HighSchoolCompetitionReassessment.updateCompetitionEvaluation(s,make(item[0],item[1]),"demotion-fixture").state;return s;})(),competition});
  HighSchoolCompetitionReassessment.applyRoleResult(player,demoted);
  const benchRoster=materializeSelectedHighSchoolRoster(player,{rosterRole:"bench",playerPosition:"游擊手",refreshCompetition:true});
  return {promoted,demoted,baseIds,displaced,starterRoster,benchRoster,role:player.highSchoolRoleCode,label:player.highSchoolTeamRole,context:player.highSchoolRoleContext};
})()`);
verify("18. Rotation sustained success 正式升 Starter 並同步 role derivatives", rosterTransition.promoted.nextRole === "starter" && rosterTransition.starterRoster.playerInjection.rosterRole === "starter");
verify("19. Promotion 保留被取代 incumbent actor", rosterTransition.displaced && rosterTransition.starterRoster.benchPlayers.some(actor => actor.playerId === rosterTransition.displaced));
verify("20. Demotion 恢復 canonical incumbent 且不重生 roster actors", rosterTransition.demoted.nextRole === "rotation" && rosterTransition.benchRoster.battingOrder.some(slot => slot.playerId === rosterTransition.displaced) && rosterTransition.baseIds.every(id => rosterTransition.benchRoster.players.some(actor => actor.playerId === id)) && rosterTransition.role === "rotation" && rosterTransition.context.code === "rotation");

const trendEffect = parse(`(() => {
  __competitionLoopPlayer(97004,"bench");
  const previous={appearanceType:"pinchHit",plateAppearances:1,defensiveInnings:0};
  for(let i=0;i<100;i++){
    const id="trend-proof-"+i;
    const neutral=createHighSchoolPlayingTimeOpportunity({matchId:id,actualRole:"bench",requestedPosition:"游擊手",evaluationTrend:0,previousActualExposure:previous});
    const positive=createHighSchoolPlayingTimeOpportunity({matchId:id,actualRole:"bench",requestedPosition:"游擊手",evaluationTrend:4,previousActualExposure:previous});
    const rank={noAppearance:0,pinchHit:1,defensiveSubstitution:1,lateGameAppearance:1,start:2};
    if(rank[positive.plannedUsage.appearanceType]>rank[neutral.plannedUsage.appearanceType]) return {neutral,positive};
  }
  return null;
})()`);
verify("21. Positive evaluation 可在不 promotion 時提高 planned exposure", trendEffect && trendEffect.positive.actualRole === "bench" && trendEffect.neutral.actualRole === "bench");
verify("22. Evaluation modifier 小於 canonical role base 差距", Math.abs(trendEffect.positive.debug.scoreBreakdown.evaluationTrend) <= 4);

const trainingGrowth = parse(`(() => {
  __competitionLoopPlayer(97005,"bench");
  const before=refreshSelectedPositionCompetitionContext(player,"游擊手");
  const roleBefore=player.highSchoolRoleCode;
  player.baseballSkills.catching=Math.min(20,player.baseballSkills.catching+4);
  player.baseballSkills.throwing=Math.min(20,player.baseballSkills.throwing+4);
  player.baseballSkills.reaction=Math.min(20,player.baseballSkills.reaction+4);
  const after=refreshSelectedPositionCompetitionContext(player,"游擊手");
  const opportunity=createHighSchoolPlayingTimeOpportunity({matchId:"training-only-followup",actualRole:player.highSchoolRoleCode,requestedPosition:"游擊手",evaluationTrend:2,previousActualExposure:{appearanceType:"noAppearance",plateAppearances:0,defensiveInnings:0}});
  return {before,after,roleBefore,roleAfter:player.highSchoolRoleCode,opportunity};
})()`);
verify("23. Training-only capability growth 縮小 incumbent gap", trainingGrowth.after.playerRelativeGap > trainingGrowth.before.playerRelativeGap);
verify("24. Training-only growth 可提高下一次機會但不直接跳角色", trainingGrowth.roleBefore === "bench" && trainingGrowth.roleAfter === "bench" && trainingGrowth.opportunity.evaluationTrend > 0);

const narrative = fs.readFileSync(path.join(root, "story.js"), "utf8");
verify("25. 長板凳文案不再保證未實現的第七局出場", narrative.includes("真正是否上場，要等正式安排與比賽局勢決定") && !narrative.includes("第七局代打與短局${player.primaryPosition || \"守備\"}任務交給你"));
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
verify("26. Production 在 script 前載入 Competition Reassessment module", indexHtml.indexOf("high-school-competition-reassessment.js") < indexHtml.indexOf("script.js"));

console.log(`High School Year One Competition Loop: ${passed}/28 passed.`);
