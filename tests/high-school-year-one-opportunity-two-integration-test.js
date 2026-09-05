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
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));

evaluate(`
  function __opportunityTwoPlayer(seed=99101, role="bench") {
    stopHighSchoolMatchPlayback();
    player=createRepresentativeHighSchoolEntryFixture("ordinary",seed);
    player.name="Opportunity Two "+seed;
    applyCanonicalPositionProfile(player,"游擊手",["二壘手"]);
    player.schoolInvitationState=createDefaultSchoolInvitationState();
    const state=generateSchoolInvitationSet(player,{generationSeed:"opportunity-two-"+seed});
    const selected=state.invitations[0];
    finalizeSchoolInvitationSelection(player,selected.schoolId);
    materializeSelectedHighSchoolRoster(player,{rosterRole:"bench"});
    completeHighSchoolEntry({source:"opportunity-two-test"});
    player.highSchoolStep=5;
    player.highSchoolRoleCode=role;
    player.highSchoolYearOneStartingRole=role;
    player.highSchoolTeamRole=HighSchoolCompetitionReassessment.ROLE_LABELS[role];
    player.highSchoolRoleContext={code:role,label:player.highSchoolTeamRole,evidence:[],opportunity:"",assignment:""};
    ["ballSense","observe","fitness","instinct","discipline","pressure"].forEach(key=>player[key]=20);
    Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=20);
    pendingHighSchoolMatchSimulationSeed=seed+300;
    return selected;
  }

  function __completeOpportunityMatch(match, tier="strong") {
    const starts=match.role==="starter";
    match.playerLineupStatus=starts?"starter":"substitute";
    match.playerEntryCompleted=true;
    match.inning=7; match.half="終";
    match.scores={home:tier==="strong"?4:1,away:tier==="failure"?4:2};
    match.simulationLog=[
      {sequence:1,type:"playerEntry",inning:4,half:"下"},
      {sequence:2,type:"halfInningEnd",inning:5,half:"上"},
      {sequence:3,type:"plateAppearance",inning:5,half:"下",batterId:"player",result:tier==="strong"?"single":"out"},
      {sequence:4,type:"halfInningEnd",inning:6,half:"上"},
      {sequence:5,type:"plateAppearance",inning:6,half:"下",batterId:"player",result:tier==="strong"?"walk":"out"},
      {sequence:6,type:"halfInningEnd",inning:7,half:"上"}
    ];
    const qualities=tier==="strong"
      ? {decisionQuality:"strong",executionQuality:"complete"}
      : tier==="failure"
        ? {decisionQuality:"poor",executionQuality:"failed"}
        : {decisionQuality:"reasonable",executionQuality:"partial"};
    match.completedMoments=[0,1,2].map(index=>({decision:index===1?"secure":"zone",tier,outcome:tier+" outcome",...qualities,scores:{...match.scores},runners:[],runnerChanges:[],scoringRunnerIds:[]}));
    match.playerContribution=tier==="strong"
      ? {strong:3,mixed:0,failure:0,runsCreated:1,runsScored:1,hits:1,walks:1,outsCreated:1,errors:0}
      : tier==="failure"
        ? {strong:0,mixed:0,failure:3,runsCreated:0,runsScored:0,hits:0,walks:0,outsCreated:0,errors:1}
        : {strong:1,mixed:1,failure:1,runsCreated:0,runsScored:0,hits:1,walks:0,outsCreated:1,errors:0};
    settleHighSchoolYearOneMatch(match,tier==="strong"?"zone":"attack");
    return match;
  }

  function __completeNoAppearance(match) {
    match.playerLineupStatus="bench";
    match.playerEntryCompleted=false;
    match.inning=7; match.half="終"; match.scores={home:2,away:1};
    match.simulationLog=[{sequence:1,type:"gameEnd",inning:7,half:"終"}];
    match.completedMoments=[];
    match.playerContribution={strong:0,mixed:0,failure:0,runsCreated:0,runsScored:0,hits:0,walks:0,outsCreated:0,errors:0};
    settleHighSchoolYearOneMatch(match,"");
    return match;
  }

  function __runTwoMatchTrace(seed,role,firstTier,secondTier) {
    const selected=__opportunityTwoPlayer(seed,role);
    const rosterIdentity=player.schoolInvitationState.selectedSchoolYearRosterIdentity.identity;
    const incumbentIds=player.schoolInvitationState.selectedBaseRoster.players.map(actor=>actor.playerId);
    const match1=prepareHighSchoolYearOneMatch();
    const opportunity1=JSON.parse(JSON.stringify(match1.gameExposureState.opportunitySnapshot));
    __completeOpportunityMatch(match1,firstTier);
    const opportunity2=JSON.parse(JSON.stringify(player.highSchoolNextOpportunity));
    const roleAfterOne=player.highSchoolRoleCode;
    const match2=prepareHighSchoolFollowupEvaluationMatch();
    const pendingSnapshot=subject=>JSON.stringify({
      matchId:subject.highSchoolMatch.id,
      simulationSeed:subject.highSchoolMatch.simulationSeed,
      rosterIds:[...(subject.highSchoolMatch.rosters.home.lineup||[]),...(subject.highSchoolMatch.rosters.home.benchPlayers||[])].map(actor=>actor.id),
      opportunityId:subject.highSchoolMatch.gameExposureState.opportunitySnapshot.decisionId,
      plannedUsage:subject.highSchoolMatch.gameExposureState.opportunitySnapshot.plannedUsage,
      next:subject.highSchoolNextOpportunity,
      evaluation:subject.highSchoolCompetitionEvaluation
    });
    const pendingReloadBefore=pendingSnapshot(player);
    player=normalizeSave(JSON.parse(JSON.stringify(player)));
    const pendingReloadStable=pendingReloadBefore===pendingSnapshot(player);
    __completeOpportunityMatch(player.highSchoolMatch,secondTier);
    return {selected,rosterIdentity,incumbentIds,opportunity1,opportunity2,roleAfterOne,match2:player.highSchoolMatch,pendingReloadStable,
      role:player.highSchoolRoleCode,evaluation:player.highSchoolCompetitionEvaluation,opportunityHistory:player.highSchoolOpportunityHistory,
      matchHistory:player.highSchoolYearOneMatchHistory,selectedState:player.schoolInvitationState,
      feedback:getHighSchoolRoleReassessmentFeedbackText(),journey:getHighSchoolYearOneRoleJourneyText()};
  }
`);

const bench = parse(`__runTwoMatchTrace(99101,"bench","strong","strong")`);
verify("1. Match 1 正式產生 Opportunity N+1", bench.opportunity2.matchId === "hs-y1-followup-evaluation-2" && bench.opportunity2.opportunityIndex === 2);
verify("2. Opportunity 2 與 Opportunity 1 identity 不同", bench.opportunity2.decisionId !== bench.opportunity1.decisionId);
verify("3. Opportunity 2 直接進入 production follow-up event", bench.match2.eventId === "high_school_followup_evaluation" && bench.match2.opportunityIndex === 2);
verify("4. Match 2 直接重用既有 Opportunity 2 而非重抽", bench.match2.gameExposureState.opportunitySnapshot.decisionId === bench.opportunity2.decisionId);
verify("5. Match 2 使用既有完整 Match Engine state", bench.match2.regulationInnings === 7 && Array.isArray(bench.match2.simulationLog) && bench.match2.rosters.home.lineup.length === 9 && bench.match2.rosters.away.lineup.length === 9);
verify("6. Match 2 為 bounded evaluation/practice match", bench.match2.matchType === "evaluation-practice" && bench.match2.opponent.includes("受邀協助評估"));
verify("7. Match 2 保持 selected school-year roster identity", bench.selectedState.selectedSchoolYearRosterIdentity.identity === bench.rosterIdentity);
verify("8. Match 2 保持 canonical incumbent actor identities", bench.incumbentIds.every(id => bench.selectedState.selectedBaseRoster.players.some(actor => actor.playerId === id)));
verify("9. Match 1 與 Match 2 各自保存最小 history", bench.matchHistory.length === 2 && bench.matchHistory[0].matchId !== bench.matchHistory[1].matchId);
verify("10. 第二場產生第二筆 performance evidence", bench.evaluation.sampleCount === 2 && bench.evaluation.appliedMatchIdentities.length === 2);
verify("11. 第二場 actual exposure 回填 Opportunity history", bench.opportunityHistory.length === 2 && bench.opportunityHistory[1].actualExposure.plateAppearances === 2);
verify("12. 第二次 Competition Reassessment 已執行", bench.evaluation.lastReassessmentAt === "hs-y1-followup-evaluation-2|settled");
verify("13. Bench 兩筆正向 production evidence 可升 Rotation", bench.roleAfterOne === "bench" && bench.role === "rotation");
verify("14. Bench 正向 Match 1 改善 Opportunity 2 context", bench.opportunity2.evaluationTrend > 0 && bench.opportunity2.actualRole === "bench");
verify("15. Role change aftermath 即時顯示目前 Rotation", bench.feedback.includes("升為") && bench.feedback.includes("輪替"));
verify("16. Year journey 讀取起始 Bench 與結束 Rotation", bench.journey.includes("發展／板凳任務") && bench.journey.includes("輪替／替補任務") && bench.journey.includes("機會 1") && bench.journey.includes("機會 2"));
verify("17. Match 2 pending save/reload 不 reroll", bench.pendingReloadStable);
verify("18. 第二場完成後不再生成第三個高一 Opportunity", bench.selectedState && evaluate(`player.highSchoolNextOpportunity === null`));

const starter = parse(`__runTwoMatchTrace(99102,"starter","failure","failure")`);
verify("19. Starter 第一筆負向結果進入 Opportunity 2", starter.opportunity2.evaluationTrend < 0 && starter.opportunity2.actualRole === "starter");
verify("20. Starter 兩筆負向 evidence production-reachable 降為 Rotation", starter.roleAfterOne === "starter" && starter.role === "rotation");
verify("21. Demotion feedback 由 canonical reassessment reasons 產生", starter.feedback.includes("降為") && starter.feedback.includes("近期多次執行未達角色要求"));

const rotation = parse(`__runTwoMatchTrace(99103,"rotation","strong","strong")`);
verify("22. Rotation 兩筆正向樣本仍依 canonical smoothing 留在 Rotation", rotation.roleAfterOne === "rotation" && rotation.role === "rotation" && rotation.evaluation.sampleCount === 2);
verify("23. Rotation 正向 trajectory 保存 promotion pressure", rotation.evaluation.recentTrend === "positive" && rotation.evaluation.promotionPressure >= 1.4);
verify("24. Rotation 正向 feedback 明示仍需下一筆正式證據", rotation.feedback.includes("仍需下一筆正式證據") && rotation.journey.includes("三筆正式證據"));
verify("25. 下一筆 qualifying evidence 已可沿 canonical 門檻自然升 Starter", parse(`(() => {let e=JSON.parse(JSON.stringify(player.highSchoolCompetitionEvaluation));const last=JSON.parse(JSON.stringify(e.evidenceHistory.at(-1)));last.matchIdentity="future-year-two-evidence";e=HighSchoolCompetitionReassessment.updateCompetitionEvaluation(e,last,e.evaluationIdentity).state;const c={...player.schoolInvitationState.selectedPositionCompetitionContext,playerRelativeGap:-0.2};return HighSchoolCompetitionReassessment.reassessRole({currentRole:"rotation",evaluation:e,competition:c});})()`).nextRole === "starter");

const mixed = parse(`__runTwoMatchTrace(99104,"rotation","strong","failure")`);
verify("26. Mixed path 維持 Rotation", mixed.role === "rotation" && mixed.evaluation.sampleCount === 2);

const noAppearance = parse(`(() => {__opportunityTwoPlayer(99105,"bench");const m1=prepareHighSchoolYearOneMatch();__completeNoAppearance(m1);const call=getHighSchoolCallHomePresentation();const noPenalty=player.highSchoolCompetitionEvaluation.sampleCount===1&&player.highSchoolCompetitionEvaluation.exposureEvidence.noAppearance&&player.highSchoolCompetitionEvaluation.accumulatedScore>=0;const o2=JSON.parse(JSON.stringify(player.highSchoolNextOpportunity));const m2=prepareHighSchoolFollowupEvaluationMatch();__completeNoAppearance(m2);return {call,noPenalty,o2,role:player.highSchoolRoleCode,evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolYearOneMatchHistory};})()`);
verify("27. Match 1 no appearance 不虛構負面 performance", noAppearance.noPenalty && noAppearance.evaluation.sampleCount === 2);
verify("28. No-appearance 後仍有合法 Opportunity 2 consumer", noAppearance.o2.matchId === "hs-y1-followup-evaluation-2" && noAppearance.history.length === 2);
verify("29. 兩次 no appearance 合法維持 Bench", noAppearance.role === "bench" && noAppearance.history.every(item => !item.actualExposure.participated));
verify("30. Call-home 明說未上場且不偽造場上選擇", noAppearance.call.includes("沒有真的輪到你上場") && !noAppearance.call.includes("第七局") && !noAppearance.call.includes("平手、二壘有人"));

const starterMemory = parse(`(() => {__opportunityTwoPlayer(99106,"starter");processEmotionalEvent("high_school_long_bench",{});processAspirationEvent("high_school_long_bench",{memory:"名單確認"});return {scene:getSignatureSceneText("high_school_long_bench"),aspiration:getAspirationEventText("high_school_long_bench"),low:player.lowPoints.some(item=>item.id==="long_bench_low"),life:player.lifeEvents.some(item=>item.id==="first_high_school_starting_assignment"),state:player.aspirationState};})()`);
verify("31. Starter 不保存 long-bench low point", !starterMemory.low && starterMemory.life);
verify("32. Starter preparation scene 不聲稱名字未被念到", starterMemory.scene.includes("先發討論") && !starterMemory.scene.includes("名字沒有出現"));
verify("33. Starter aspiration 保留名單不保證結果的 truth", starterMemory.aspiration.includes("不等於已經站穩位置") && starterMemory.state.status === "active");

const year = parse(`(() => {const trace=__runTwoMatchTrace(99107,"bench","strong","strong");player.highSchoolStep=10;const settled=evaluateHighSchoolYear();const detail=player.highSchoolDetail;const saved=normalizeSave(JSON.parse(JSON.stringify(player)));return {settled,detail,role:player.highSchoolRoleCode,savedRole:saved.highSchoolRoleCode,savedEvaluation:saved.highSchoolCompetitionEvaluation,savedHistory:saved.highSchoolYearOneMatchHistory};})()`);
verify("34. Year settlement 消費兩次 Opportunity journey", year.settled && year.detail.includes("高一角色歷程") && year.detail.includes("實戰機會 1") && year.detail.includes("實戰機會 2"));
verify("35. Year summary 使用 final canonical role", year.role === "rotation" && year.detail.includes("輪替／替補任務"));
verify("36. Year settlement/reload 保留 role、evaluation 與 bounded history", year.savedRole === "rotation" && year.savedEvaluation.sampleCount === 2 && year.savedHistory.length === 2);

const once = parse(`(() => {const before=JSON.stringify({evaluation:player.highSchoolCompetitionEvaluation,opportunities:player.highSchoolOpportunityHistory,matches:player.highSchoolYearOneMatchHistory,role:player.highSchoolRoleCode});const result=applyHighSchoolCompetitionMatchSettlement(player.highSchoolMatch);return {status:result.status,same:before===JSON.stringify({evaluation:player.highSchoolCompetitionEvaluation,opportunities:player.highSchoolOpportunityHistory,matches:player.highSchoolYearOneMatchHistory,role:player.highSchoolRoleCode})};})()`);
verify("37. Match 2 evaluation/reassessment exactly once", once.status === "duplicate" && once.same);

const liveEngine = parse(`(() => {__opportunityTwoPlayer(99108,"rotation");__completeOpportunityMatch(prepareHighSchoolYearOneMatch(),"strong");player.highSchoolStep=7;const match=prepareHighSchoolFollowupEvaluationMatch();let safety=0;while(!match.completed&&safety++<1600){if(isHighSchoolMatchDecisionVisible(match)){const choices=getHighSchoolYearOneMatchMomentChoices(match);const choice=choices.find(item=>item.matchDecision==="secure")||choices.find(item=>item.matchDecision==="zone")||choices[0];if(!choice||!resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.83))break;}else if(isHighSchoolMatchPlaybackPhase(match))advanceHighSchoolMatchSimulation(match);else break;}return {completed:match.completed,id:match.id,eventId:match.eventId,samples:player.highSchoolCompetitionEvaluation.sampleCount,log:match.simulationLog.length,moments:match.completedMoments.length};})()`);
verify("38. Production event 的 Match 2 可由既有 Match Engine 實際走到結算", liveEngine.completed && liveEngine.id === "hs-y1-followup-evaluation-2" && liveEngine.eventId === "high_school_followup_evaluation" && liveEngine.samples === 2 && liveEngine.log > 0 && liveEngine.moments > 0);

const reassessmentSource = fs.readFileSync(path.join(root, "high-school-competition-reassessment.js"), "utf8");
verify("39. Rotation → Starter canonical sampleCount >= 3 未被降低", reassessmentSource.includes('evaluation.sampleCount >= 3 && currentRole === "rotation"'));
verify("40. 高一小結不清除跨年 evaluation pressure", evaluate(`player.highSchoolCompetitionEvaluation.sampleCount === 2 && player.highSchoolCompetitionEvaluation.promotionPressure > 0`));

console.log(`High School Year One Opportunity Two Integration: ${passed}/40 passed.`);
