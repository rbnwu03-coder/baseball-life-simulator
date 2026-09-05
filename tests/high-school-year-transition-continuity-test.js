const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TeamRoster = require("../team-roster-foundation.js");
const TeamStrength = require("../team-strength-model.js");
const EntryRoster = require("../high-school-entry-roster-context.js");
const Transition = require("../high-school-year-transition.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const base = TeamRoster.generateTeamRoster({
  teamId: "continuity-school", schoolId: "continuity-school", schoolStandard: "competitive",
  yearIdentity: "hs-year-1-age-16", seed: "continuity-base"
});
const identity = { identity: "continuity-school|hs-year-1-age-16|continuity-base" };
const first = Transition.advanceHighSchoolRosterYear({
  schoolId: "continuity-school", schoolStandard: "competitive", selectedBaseRoster: base,
  currentSchoolYearRosterIdentity: identity, nextHighSchoolYear: 2
});
const second = Transition.advanceHighSchoolRosterYear({
  schoolId: "continuity-school", schoolStandard: "competitive", selectedBaseRoster: base,
  currentSchoolYearRosterIdentity: identity, nextHighSchoolYear: 2
});
const baseById = new Map(base.players.map(actor => [actor.playerId, actor]));
const evolvedById = new Map(first.selectedBaseRoster.players.map(actor => [actor.playerId, actor]));

verify("1. 相同 transition inputs 產生 deterministic Y2 roster", JSON.stringify(first) === JSON.stringify(second));
verify("2. Y2 建立同校但不同 school-year roster identity", first.schoolYearRosterIdentity.schoolId === base.schoolId && first.schoolYearRosterIdentity.yearIdentity === "hs-year-2-age-17" && first.schoolYearRosterIdentity.identity !== identity.identity);
verify("3. 非畢業 returner actor IDs 全數保留", first.returnerIds.length > 0 && first.returnerIds.every(id => evolvedById.has(id)));
verify("4. Returner 年級 1→2、2→3 且年齡同步", first.returnerIds.every(id => evolvedById.get(id).year === baseById.get(id).year + 1 && evolvedById.get(id).age === baseById.get(id).age + 1));
verify("5. Y1 year-3 actors 全數移出 Y2 active roster", first.graduateIds.length > 0 && first.graduateIds.every(id => !evolvedById.has(id)));
verify("6. Incoming class 補足畢業人數並全部為 year 1", first.incomingIds.length === first.graduateIds.length && first.incomingIds.every(id => evolvedById.get(id)?.year === 1));
verify("7. Incoming IDs deterministic 且不碰撞 returners", new Set([...first.returnerIds, ...first.incomingIds]).size === first.selectedBaseRoster.players.length);
verify("8. Evolved roster 保持九守位合法 coverage", TeamRoster.validateRoster(first.selectedBaseRoster).ok && new Set(first.selectedBaseRoster.battingOrder.map(slot => slot.defensivePosition)).size === 9);
verify("9. Evolved roster 保留 bench 與 pitching depth", first.selectedBaseRoster.benchPlayers.length > 0 && first.selectedBaseRoster.pitchingStaff.secondaryPitchers.length > 0);
verify("10. Y2 Team Strength 由 evolved roster 重算", JSON.stringify(first.teamStrengthProfile) === JSON.stringify(TeamStrength.deriveTeamStrengthProfile(first.selectedBaseRoster)));

const priorSs = EntryRoster.deriveCompetitionContext(base, "SS", 7);
const nextSs = EntryRoster.deriveCompetitionContext(first.selectedBaseRoster, "SS", 7);
verify("11. Senior starter graduation 使 Y2 starter actor 與 competition snapshot 更新", first.graduateIds.includes(priorSs.starterId) && nextSs.starterId !== priorSs.starterId && JSON.stringify(nextSs) !== JSON.stringify(priorSs));

const pressureBase = TeamRoster.generateTeamRoster({
  teamId: "school-p", schoolId: "school-p", schoolStandard: "powerhouse",
  yearIdentity: "hs-year-1-age-16", seed: "pressure-8"
});
const pressureBefore = EntryRoster.deriveCompetitionContext(pressureBase, "SS", 8);
const pressureEvolution = Transition.advanceHighSchoolRosterYear({
  schoolId: "school-p", schoolStandard: "powerhouse", selectedBaseRoster: pressureBase,
  currentSchoolYearRosterIdentity: { identity: "old-8" }, nextHighSchoolYear: 2
});
const pressureAfter = EntryRoster.deriveCompetitionContext(pressureEvolution.selectedBaseRoster, "SS", 8);
verify("12. Deterministic 強校新生可加入同守位競爭", pressureAfter.competitorIds.some(id => pressureEvolution.incomingIds.includes(id)));
verify("13. Incoming freshman pressure 可提高 competition density", pressureBefore.competitionDensity === "high" && pressureAfter.competitionDensity === "veryHigh");

const yearThree = Transition.advanceHighSchoolRosterYear({
  schoolId: "continuity-school", schoolStandard: "competitive", selectedBaseRoster: first.selectedBaseRoster,
  currentSchoolYearRosterIdentity: first.schoolYearRosterIdentity, nextHighSchoolYear: 3
});
verify("14. Generic transition API 可形成 Y2→Y3 schema", yearThree.schoolYearRosterIdentity.yearIdentity === "hs-year-3-age-18" && TeamRoster.validateRoster(yearThree.selectedBaseRoster).ok);
verify("15. Y2→Y3 仍保留未畢業 actor IDs", yearThree.returnerIds.every(id => yearThree.selectedBaseRoster.players.some(actor => actor.playerId === id)));

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
  "match-experience-development.js", "high-school-competition-reassessment.js", "high-school-year-transition.js", "match-development-settlement-presentation.js",
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
    setItem(key, value) { storage.set(key, value); }, getItem(key) { return storage.get(key) || null; }, removeItem(key) { storage.delete(key); }
  },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));

evaluate(`
  function __createTransitionFixture(seed=120001, role="rotation", sampleScore=3) {
    player=createRepresentativeHighSchoolEntryFixture("ordinary",seed);
    player.name="Transition "+seed;
    applyCanonicalPositionProfile(player,"游擊手",["二壘手"]);
    ["ballSense","observe","fitness","instinct","discipline","pressure"].forEach(key=>player[key]=20);
    Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=20);
    player.schoolInvitationState=createDefaultSchoolInvitationState();
    const invitationState=generateSchoolInvitationSet(player,{generationSeed:"transition-"+seed});
    const selected=invitationState.invitations[0];
    finalizeSchoolInvitationSelection(player,selected.schoolId);
    materializeSelectedHighSchoolRoster(player,{rosterRole:role==="starter"?"starter":"bench",playerPosition:"SS"});
    player.highSchoolRoleCode=role;
    player.highSchoolTeamRole=HighSchoolCompetitionReassessment.ROLE_LABELS[role];
    player.highSchoolRoleContext={code:role,label:player.highSchoolTeamRole,evidence:[],opportunity:"",assignment:""};
    let evaluation=HighSchoolCompetitionReassessment.createEvaluationState(getHighSchoolCompetitionEvaluationIdentity(player));
    for(let i=1;i<=2;i++){
      const evidence={matchIdentity:"hs-y1-fixture-"+i,trainingEvidence:{score:sampleScore>0?1:-1},matchEvidence:{quality:sampleScore},exposureEvidence:{noAppearance:false,plateAppearances:2,defensiveInnings:3},sampleScore};
      evaluation=HighSchoolCompetitionReassessment.updateCompetitionEvaluation(evaluation,evidence,evaluation.evaluationIdentity).state;
      const opportunity={decisionId:"hs-y1-fixture-opportunity-"+i,matchId:"hs-y1-fixture-"+i,actualRole:role,plannedUsage:{appearanceType:"start",entryInning:1,entryHalf:"上"}};
      player.highSchoolOpportunityHistory=HighSchoolCompetitionReassessment.recordOpportunity(player.highSchoolOpportunityHistory,{opportunity,opportunityIndex:i,roleAtCreation:role,actualExposure:{appearanceType:"start",plateAppearances:2,defensiveInnings:3}});
    }
    player.highSchoolCompetitionEvaluation=evaluation;
    player.relationships.coachTrust=7;
    player.seasonPerformance=9;
    player.seasonErrors=2;
    player.developmentState.history.push({settlementId:"carried-development"});
    player.highSchoolStep=10;
    player.highSchoolYearOneComplete=true;
    player.chapter="青棒第一年小結";
    player.highSchoolMatch={...createInitialPlayer().highSchoolMatch,id:"hs-y1-fixture-2",completed:true,settled:true,eventSettlementApplied:true,developmentPresentationCompleted:true};
    return selected;
  }
  function __completeY2Match(tier="strong") {
    const match=prepareHighSchoolYearTwoEvaluationMatch();
    const strong=tier==="strong";
    match.playerLineupStatus="starter";
    match.playerEntryCompleted=true;
    match.inning=7; match.half="終"; match.scores={home:strong?4:1,away:strong?1:4};
    match.simulationLog=[{sequence:1,type:"playerEntry",inning:1,half:"上"},{sequence:2,type:"plateAppearance",inning:3,half:"下",batterId:"player",result:strong?"single":"out"}];
    match.completedMoments=[0,1,2].map(index=>({decision:"secure",tier:strong?"strong":"failure",outcome:strong?"完成任務":"執行失敗",decisionQuality:strong?"strong":"poor",executionQuality:strong?"complete":"failed",scores:{...match.scores},runners:[],runnerChanges:[],scoringRunnerIds:[]}));
    match.playerContribution=strong?{strong:3,mixed:0,failure:0,runsCreated:1,runsScored:1,hits:1,walks:0,outsCreated:1,errors:0}:{strong:0,mixed:0,failure:3,runsCreated:0,runsScored:0,hits:0,walks:0,outsCreated:0,errors:1};
    settleHighSchoolYearOneMatch(match,"secure");
    return match;
  }
`);

evaluate("__createTransitionFixture(120001,'rotation',3)");
const y1Snapshot = parse(`({
  role:player.highSchoolRoleCode,evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,
  roster:player.schoolInvitationState.selectedBaseRoster,identity:player.schoolInvitationState.selectedSchoolYearRosterIdentity,
  competition:player.schoolInvitationState.selectedPositionCompetitionContext,
  development:player.developmentState,coachTrust:player.relationships.coachTrust,positions:[player.primaryPosition,...player.secondaryPositions]
})`);
evaluate("player=normalizeSave(JSON.parse(JSON.stringify(player))); enterHighSchoolYearTwo()");
const y2 = parse(`({
  role:player.highSchoolRoleCode,label:player.highSchoolTeamRole,context:player.highSchoolRoleContext,
  evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,next:player.highSchoolNextOpportunity,
  roster:player.schoolInvitationState.selectedBaseRoster,selected:player.schoolInvitationState.selectedSchoolRoster,
  identity:player.schoolInvitationState.selectedSchoolYearRosterIdentity,competition:player.schoolInvitationState.selectedPositionCompetitionContext,
  strength:player.schoolInvitationState.selectedTeamStrengthProfile,transition:player.highSchoolYearTransitionState,
  development:player.developmentState,coachTrust:player.relationships.coachTrust,positions:[player.primaryPosition,...player.secondaryPositions],
  seasonPerformance:player.seasonPerformance,seasonErrors:player.seasonErrors,firstText:getEvent('high_school_year_two_roster_reset').text()
})`);

verify("16. Y1 final canonical role 作為 Y2 prior 並保持 code authority", y2.role === "rotation" && y2.context.code === y2.role);
verify("17. Role code／label／context 在 Y2 entry 同步", y2.label === "輪替／替補任務" && y2.context.label === y2.label);
verify("18. Y1 evaluation samples 與 positive pressure 跨年保留", y2.evaluation.sampleCount === 2 && y2.evaluation.promotionPressure === y1Snapshot.evaluation.promotionPressure && y2.evaluation.recentTrend === "positive");
verify("19. Evaluation identity 升為同校 career-level identity", y2.evaluation.evaluationIdentity.endsWith("|high-school-competition-career") && !y2.evaluation.evaluationIdentity.includes("year-one"));
verify("20. Y1 applied match identities 跨年保留", y1Snapshot.evaluation.appliedMatchIdentities.every(id => y2.evaluation.appliedMatchIdentities.includes(id)));
verify("21. Y2 transition 不增加 performance sample", y2.evaluation.sampleCount === y1Snapshot.evaluation.sampleCount);
verify("22. Y2 transition 建立新 Opportunity 並保留 Y1 history", y2.next.matchId === "hs-y2-spring-evaluation-1" && y2.next.highSchoolYear === 2 && y2.history.length === 3 && y2.history.slice(0,2).every(item => item.matchId.startsWith("hs-y1-")));
verify("23. Y2 Opportunity 使用 updated role、competition 與 prior exposure", y2.next.actualRole === y2.role && y2.next.competitionSnapshot.playerRelativeGap === y2.competition.playerRelativeGap && y2.next.previousActualExposure.plateAppearances === 2);
verify("24. Y2 roster identity 更新且 school identity 不變", y2.identity.identity !== y1Snapshot.identity.identity && y2.identity.schoolId === y1Snapshot.identity.schoolId && y2.identity.yearIdentity === "hs-year-2-age-17");
verify("25. Production transition 保留 returners、移除 graduates、加入 incoming", y2.transition.history[0].returnerIds.every(id => y2.roster.players.some(actor => actor.playerId === id)) && y2.transition.history[0].graduateIds.every(id => !y2.roster.players.some(actor => actor.playerId === id)) && y2.transition.history[0].incomingIds.every(id => y2.roster.players.some(actor => actor.playerId === id && actor.year === 1)));
verify("26. Y2 selected roster assignment 與 canonical Rotation 一致", y2.selected.playerInjection.rosterRole === "bench" && y2.role === "rotation");
verify("27. Competition context 由 Y2 roster 重算而非沿用 Y1 snapshot", JSON.stringify(y2.competition) !== JSON.stringify(y1Snapshot.competition) && y2.competition.starterId && y2.roster.players.some(actor => actor.playerId === y2.competition.starterId));
verify("28. Y2 team strength 綁定 evolved selected roster", JSON.stringify(y2.strength) === JSON.stringify(parse("TeamStrengthModel.deriveTeamStrengthProfile(player.schoolInvitationState.selectedSchoolRoster)")));
verify("29. Development、coachTrust 與 canonical positions 跨年不變", JSON.stringify(y2.development) === JSON.stringify(y1Snapshot.development) && y2.coachTrust === y1Snapshot.coachTrust && JSON.stringify(y2.positions) === JSON.stringify(y1Snapshot.positions));
verify("30. 舊 season totals 被封存在 transition metadata 且 Y2 從零開始", y2.transition.history[0].previousSeasonPerformance === 9 && y2.transition.history[0].previousSeasonErrors === 2 && y2.seasonPerformance === 0 && y2.seasonErrors === 0);
verify("31. 第一個 Y2 role-sensitive narrative 讀 canonical role 與 updated competition", y2.firstText.includes("輪替／替補任務") && y2.firstText.includes("同守位競爭深度"));

const transitionReloadBefore = evaluate("JSON.stringify({state:player.highSchoolYearTransitionState,school:player.schoolInvitationState,role:player.highSchoolRoleCode,evaluation:player.highSchoolCompetitionEvaluation,next:player.highSchoolNextOpportunity,history:player.highSchoolOpportunityHistory})");
evaluate("player=normalizeSave(JSON.parse(JSON.stringify(player)))");
verify("32. Y2 initialization save/reload 不 reroll roster／incoming／role／competition", transitionReloadBefore === evaluate("JSON.stringify({state:player.highSchoolYearTransitionState,school:player.schoolInvitationState,role:player.highSchoolRoleCode,evaluation:player.highSchoolCompetitionEvaluation,next:player.highSchoolNextOpportunity,history:player.highSchoolOpportunityHistory})"));

const y2Match = parse("__completeY2Match('strong')");
const afterEvidence = parse(`({role:player.highSchoolRoleCode,label:player.highSchoolTeamRole,context:player.highSchoolRoleContext,evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,matchHistory:player.highSchoolYearTwoMatchHistory,next:player.highSchoolNextOpportunity,roster:player.schoolInvitationState.selectedSchoolRoster})`);
verify("33. Y2 Opportunity 進入 Existing Match Engine", y2Match.highSchoolYear === 2 && y2Match.matchType === "year-two-spring-evaluation" && y2Match.rosters.home.lineup.length === 9 && y2Match.regulationInnings === 7);
verify("34. Y2 first formal evidence 追加為第三筆而非 transition sample", afterEvidence.evaluation.sampleCount === 3 && afterEvidence.evaluation.evidenceHistory.at(-1).matchIdentity === "hs-y2-spring-evaluation-1");
verify("35. Rotation 三筆正向 evidence 依原門檻升 Starter", afterEvidence.role === "starter" && afterEvidence.evaluation.sampleCount >= 3);
verify("36. Promotion 同步 code／label／context／roster assignment", afterEvidence.label === "先發／關鍵任務" && afterEvidence.context.code === "starter" && afterEvidence.roster.playerInjection.rosterRole === "starter");
verify("37. Opportunity history 同時保留 Y1×2 與 Y2×1", afterEvidence.history.length === 3 && afterEvidence.history.filter(item => item.matchId.startsWith("hs-y1-")).length === 2 && afterEvidence.history.some(item => item.matchId.startsWith("hs-y2-")));
verify("38. Y2 formal match history 帶 year metadata", afterEvidence.matchHistory.length === 1 && afterEvidence.matchHistory[0].highSchoolYear === 2);
verify("39. Y2 evidence settlement 不建立錯誤的 Y1 N+1", afterEvidence.next === null);
const exactlyOnceBefore = evaluate("JSON.stringify({evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,role:player.highSchoolRoleCode,development:player.developmentState})");
verify("40. Y2 match settlement exactly once", evaluate("settleHighSchoolYearOneMatch(player.highSchoolMatch,'secure')") === false && exactlyOnceBefore === evaluate("JSON.stringify({evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,role:player.highSchoolRoleCode,development:player.developmentState})"));
evaluate("player=normalizeSave(JSON.parse(JSON.stringify(player)))");
verify("41. Y2 evidence save/reload 保留 match identity、evidence、role 與 exactly-once IDs", afterEvidence.role === evaluate("player.highSchoolRoleCode") && afterEvidence.evaluation.appliedMatchIdentities.every(id => evaluate("player.highSchoolCompetitionEvaluation.appliedMatchIdentities").includes(id)) && evaluate("player.highSchoolMatch.id") === "hs-y2-spring-evaluation-1");

evaluate("__createTransitionFixture(120002,'starter',-3); enterHighSchoolYearTwo()");
const negativeEntry = parse("({role:player.highSchoolRoleCode,demotion:player.highSchoolCompetitionEvaluation.demotionPressure,samples:player.highSchoolCompetitionEvaluation.sampleCount})");
evaluate("__completeY2Match('failure')");
const negativeAfter = parse("({role:player.highSchoolRoleCode,demotion:player.highSchoolCompetitionEvaluation.demotionPressure,samples:player.highSchoolCompetitionEvaluation.sampleCount})");
verify("42. Negative pressure 跨年保留且 Y2 poor evidence 繼續累積", negativeEntry.demotion > 0 && negativeEntry.samples === 2 && negativeAfter.samples === 3 && negativeAfter.demotion > 0);
verify("43. Negative carryover 不會在 Y2 無故升級角色", ["rotation","bench"].includes(negativeAfter.role));

evaluate("__createTransitionFixture(120003,'rotation',3); enterHighSchoolYearTwo(); player.flags.push('year_two_plan_batting'); player.highSchoolYearTwoStep=8; evaluateHighSchoolYearTwo()");
verify("44. Y2 usage plan 與 canonical role 分離", evaluate("player.highSchoolYearTwoPlan") === "batting" && evaluate("player.highSchoolRoleCode") === "rotation" && evaluate("player.highSchoolTeamRole") === "輪替／替補任務");

console.log(`High School Year Transition Continuity v1: ${passed}/${passed} passed.`);
