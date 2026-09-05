const assert = require("assert");
const Competition = require("../high-school-competition-reassessment.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }

function sample(id, score, options = {}) {
  return {
    matchIdentity: id,
    sampleScore: score,
    trainingEvidence: { positionReadiness: options.readiness ?? 7, positionFit: 7, coachTrust: 8, fatigue: 1, injuryRisk: 0, pain: 0, score: options.trainingScore ?? 1 },
    exposureEvidence: { started: options.started === true, enteredGame: options.noAppearance !== true, noAppearance: options.noAppearance === true, appearanceType: options.noAppearance ? "noAppearance" : "lateGameAppearance", plateAppearances: options.noAppearance ? 0 : 1, defensiveInnings: options.noAppearance ? 0 : 1 },
    matchEvidence: { quality: options.quality ?? score, sampleSize: options.noAppearance ? 0 : 1, sampleConfidence: options.noAppearance ? 0 : 0.34, strong: score > 0 ? 1 : 0, mixed: score === 0 ? 1 : 0, failure: score < 0 ? 1 : 0, errors: 0, decisionExecutionSamples: options.noAppearance ? 0 : 1 }
  };
}

function accumulate(role, scores, gap) {
  let state = Competition.createEvaluationState("school|y1");
  scores.forEach((score, index) => { state = Competition.updateCompetitionEvaluation(state, sample(`${role}-${index}`, score), "school|y1").state; });
  return { state, result: Competition.reassessRole({ currentRole: role, evaluation: state, competition: { playerRelativeGap: gap } }) };
}

const defaults = Competition.createEvaluationState("school|y1");
verify("1. Evaluation state 保存 identity、三類 evidence、壓力與 exactly-once ids", defaults.evaluationIdentity === "school|y1" && defaults.sampleCount === 0 && "trainingEvidence" in defaults && "matchEvidence" in defaults && "exposureEvidence" in defaults && Array.isArray(defaults.appliedMatchIdentities));

const noAppearance = Competition.collectCompetitionEvidence({
  match: { id: "no-appearance", completedMoments: [], playerContribution: {} },
  exposure: { finalized: true, appearanceType: "noAppearance", participated: false, plateAppearances: 0, defensiveInnings: 0 },
  readiness: { positionReadiness: 7, positionFit: 7 }, coachTrust: 8, health: { fatigue: 1, injuryRisk: 0, pain: 0 }
});
verify("2. No appearance 被保存為 exposure truth", noAppearance.exposureEvidence.noAppearance && !noAppearance.exposureEvidence.enteredGame);
verify("3. No appearance 沒有 performance penalty 或虛構 sample", noAppearance.matchEvidence.quality === 0 && noAppearance.matchEvidence.sampleSize === 0 && noAppearance.matchEvidence.sampleConfidence === 0);
const noAppearanceUpdate = Competition.updateCompetitionEvaluation(defaults, noAppearance, "school|y1");
const stableNoAppearance = Competition.reassessRole({ currentRole: "bench", evaluation: noAppearanceUpdate.state, competition: { playerRelativeGap: -3 } });
verify("3a. Bench 無出賽只累積 readiness，不被當成失敗或自動改角色", noAppearanceUpdate.state.accumulatedScore >= 0 && stableNoAppearance.nextRole === "bench" && stableNoAppearance.reasons.includes("noActualExposure"));

const oneBench = accumulate("bench", [3], -1);
verify("4. Bench 單一好樣本不會直接升級", oneBench.result.change === "same" && oneBench.result.reasons.includes("limitedSample"));
const benchPromotion = accumulate("bench", [2.4, 2.8], -1.2);
verify("5. Bench 累積正向證據後升 Rotation", benchPromotion.result.nextRole === "rotation" && benchPromotion.result.change === "promotion");
verify("6. Promotion reason 保存持續正向與 gap closed", benchPromotion.result.reasons.includes("sustainedPositivePerformance") && benchPromotion.result.reasons.includes("competitionGapClosed"));

const rotationPromotion = accumulate("rotation", [2.5, 2.7, 3], -0.4);
verify("7. Rotation 多筆正向樣本後升 Starter", rotationPromotion.result.nextRole === "starter");
const oneBadStarter = accumulate("starter", [-4], 0.5);
verify("8. Starter 單一差表現仍維持 Starter", oneBadStarter.result.nextRole === "starter" && oneBadStarter.result.reasons.includes("limitedSample"));
const starterDemotion = accumulate("starter", [-2.2, -3], 0.5);
verify("9. Starter 持續負向趨勢降為 Rotation", starterDemotion.result.nextRole === "rotation" && starterDemotion.result.reasons.includes("sustainedNegativePerformance"));
const rotationDemotion = accumulate("rotation", [-2.1, -2.5], -2);
verify("10. Rotation 持續負向趨勢降為 Bench", rotationDemotion.result.nextRole === "bench");
const stableStarter = accumulate("starter", [0.2, -0.2], 0.5);
verify("11. Starter mixed evidence 不會過敏 demotion", stableStarter.result.nextRole === "starter");

let duplicateState = Competition.createEvaluationState("school|y1");
const applied = Competition.updateCompetitionEvaluation(duplicateState, sample("same-match", 3), "school|y1");
const duplicate = Competition.updateCompetitionEvaluation(applied.state, sample("same-match", 3), "school|y1");
verify("12. 同 match identity evaluation exactly once", applied.status === "applied" && duplicate.status === "duplicate" && duplicate.state.sampleCount === 1);

let bounded = Competition.createEvaluationState("school|y1");
for (let index = 0; index < 8; index += 1) bounded = Competition.updateCompetitionEvaluation(bounded, sample(`bounded-${index}`, 1), "school|y1").state;
verify("13. Evidence horizon 固定只保留最近五筆", bounded.evidenceHistory.length === 5 && bounded.sampleCount === 5 && bounded.evidenceHistory[0].matchIdentity === "bounded-3");

const target = { highSchoolRoleCode: "bench", highSchoolTeamRole: "", highSchoolRoleContext: { evidence: [] } };
Competition.applyRoleResult(target, benchPromotion.result, "下一次評估賽");
verify("14. canonical role change 同步 derivative label/context", target.highSchoolRoleCode === "rotation" && target.highSchoolTeamRole === Competition.ROLE_LABELS.rotation && target.highSchoolRoleContext.code === "rotation" && target.highSchoolRoleContext.opportunity === "下一次評估賽");

let history = [];
for (let index = 1; index <= 7; index += 1) history = Competition.recordOpportunity(history, { opportunityId: `opp-${index}`, matchId: `match-${index}`, opportunityIndex: index, roleAtCreation: "bench", plannedUsage: { appearanceType: "lateGameAppearance" } });
history = Competition.recordOpportunity(history, { opportunityId: "opp-7", matchId: "match-7", opportunityIndex: 7, roleAtCreation: "bench", plannedUsage: { appearanceType: "lateGameAppearance" }, actualExposure: { plateAppearances: 1 }, evaluationConsequence: { trend: "positive" } });
verify("15. Opportunity history bounded 且同 identity 更新不重複", history.length === 5 && history.at(-1).opportunityId === "opp-7" && history.at(-1).actualExposure.plateAppearances === 1);

const restored = Competition.normalizeEvaluationState(JSON.parse(JSON.stringify(benchPromotion.state)), "school|y1");
verify("16. Evaluation state JSON reload 保留 identity、samples 與 score", restored.evaluationIdentity === benchPromotion.state.evaluationIdentity && restored.sampleCount === benchPromotion.state.sampleCount && restored.accumulatedScore === benchPromotion.state.accumulatedScore);

console.log(`High School Competition Reassessment: ${passed}/17 passed.`);
