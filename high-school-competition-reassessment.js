(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HighSchoolCompetitionReassessment = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "high-school-competition-evaluation-v1";
  const MAX_EVIDENCE_HISTORY = 5;
  const MAX_OPPORTUNITY_HISTORY = 5;
  const ROLE_ORDER = Object.freeze(["bench", "rotation", "starter"]);
  const ROLE_LABELS = Object.freeze({
    starter: "先發／關鍵任務",
    rotation: "輪替／替補任務",
    bench: "發展／板凳任務"
  });

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function clamp(value, minimum, maximum, fallback = 0) {
    const numeric = Number(value);
    return Math.max(minimum, Math.min(maximum, Number.isFinite(numeric) ? numeric : fallback));
  }

  function round(value, digits = 3) {
    const scale = 10 ** digits;
    return Math.round((Number(value) || 0) * scale) / scale;
  }

  function normalizeRole(role) {
    return ROLE_ORDER.includes(role) ? role : "bench";
  }

  function createEvaluationState(identity = "") {
    return {
      version: VERSION,
      evaluationIdentity: String(identity || ""),
      sampleCount: 0,
      trainingEvidence: null,
      matchEvidence: null,
      exposureEvidence: null,
      evidenceHistory: [],
      recentTrend: "neutral",
      trendScore: 0,
      accumulatedScore: 0,
      rolePressure: "stable",
      promotionPressure: 0,
      demotionPressure: 0,
      lastReassessmentReason: ["limitedSample"],
      lastReassessmentAt: "",
      appliedMatchIdentities: []
    };
  }

  function normalizeEvaluationState(saved, identity = "") {
    const state = Object.assign(createEvaluationState(identity), clone(saved || {}));
    state.version = VERSION;
    state.evaluationIdentity = String(state.evaluationIdentity || identity || "");
    state.evidenceHistory = Array.isArray(saved?.evidenceHistory)
      ? saved.evidenceHistory.slice(-MAX_EVIDENCE_HISTORY).map(clone) : [];
    state.appliedMatchIdentities = Array.isArray(saved?.appliedMatchIdentities)
      ? [...new Set(saved.appliedMatchIdentities.map(String))].slice(-12) : [];
    state.sampleCount = state.evidenceHistory.length;
    state.lastReassessmentReason = Array.isArray(saved?.lastReassessmentReason)
      ? saved.lastReassessmentReason.slice() : ["limitedSample"];
    return state;
  }

  function getMomentQuality(moment = {}) {
    const decision = { strong: 1.5, acceptable: 0.8, reasonable: 0.8, routine: 0.45, aggressive: 0.35, questionable: -0.7, poor: -1.5 }[moment.decisionQuality] || 0;
    const execution = { strong: 1.5, complete: 1.5, completed: 1.5, normal: 0.7, controlled: 0.7, adjusted: 0.35, partial: 0, weak: -0.8, failed: -1.5, misplay: -1.5 }[moment.executionQuality] || 0;
    return decision + execution;
  }

  function collectCompetitionEvidence(input = {}) {
    const match = input.match || {};
    const exposure = input.exposure || match.gameExposureState || {};
    const readiness = input.readiness || exposure.opportunitySnapshot?.readinessSnapshot || {};
    const contribution = match.playerContribution || {};
    const moments = Array.isArray(match.completedMoments) ? match.completedMoments : [];
    const matchExperience = match.matchExperience || {};
    const matchExperienceSummary = matchExperience.evidenceSummary || {};
    const started = exposure.started === true || exposure.appearanceType === "start";
    const plateAppearances = Math.max(0, Number(exposure.plateAppearances) || 0);
    const defensiveInnings = Math.max(0, Number(exposure.defensiveInnings) || 0);
    const enteredGame = exposure.participated === true || started || plateAppearances > 0 || defensiveInnings > 0;
    const strong = Math.max(0, Number(contribution.strong) || 0);
    const mixed = Math.max(0, Number(contribution.mixed) || 0);
    const failure = Math.max(0, Number(contribution.failure) || 0);
    const errors = Math.max(0, Number(contribution.errors) || 0);
    const performanceSamples = Math.max(strong + mixed + failure, moments.length, Math.min(plateAppearances + Math.min(defensiveInnings, 2), 4));
    const contributionQuality = performanceSamples > 0
      ? ((strong * 2.4) + (mixed * 0.45) - (failure * 2.2) - (errors * 0.8)) / performanceSamples : 0;
    const momentQuality = moments.length
      ? moments.reduce((sum, moment) => sum + getMomentQuality(moment), 0) / moments.length : 0;
    const quality = enteredGame ? clamp((contributionQuality * 1.6) + (momentQuality * 0.55), -5, 5) : 0;
    const sampleConfidence = enteredGame ? clamp(performanceSamples / 3, 0.25, 1) : 0;
    const positionReadiness = clamp(readiness.positionReadiness, 0, 10, 5);
    const positionFit = clamp(readiness.positionFit, 0, 10, 5);
    const coachTrust = clamp(input.coachTrust, 0, 20, 0);
    const health = input.health || {};
    const fatigue = clamp(health.fatigue, 0, 20, 0);
    const injuryRisk = clamp(health.injuryRisk, 0, 20, 0);
    const pain = clamp(health.pain, 0, 20, 0);
    const trainingScore = clamp(
      ((positionReadiness - 5) * 0.7) + ((positionFit - 5) * 0.3) + ((coachTrust - 6) * 0.12)
        - (fatigue * 0.04) - (injuryRisk * 0.08) - (pain * 0.12),
      -3,
      3
    );
    const sampleScore = round((quality * sampleConfidence) + (trainingScore * 0.35));
    return Object.freeze({
      matchIdentity: String(match.id || input.matchIdentity || ""),
      trainingEvidence: Object.freeze({ positionReadiness, positionFit, coachTrust, fatigue, injuryRisk, pain, score: round(trainingScore) }),
      exposureEvidence: Object.freeze({ started, enteredGame, noAppearance: !enteredGame, appearanceType: exposure.appearanceType || (enteredGame ? "appearance" : "noAppearance"), plateAppearances, defensiveInnings }),
      matchEvidence: Object.freeze({
        quality: round(quality), sampleSize: performanceSamples, sampleConfidence: round(sampleConfidence),
        strong, mixed, failure, errors, decisionExecutionSamples: moments.length,
        matchExperienceEvidenceCount: Math.max(0, Number(matchExperienceSummary.total) || 0),
        activeExperienceEvidenceCount: Math.max(0, Number(matchExperienceSummary.active) || 0),
        developmentContextCount: Array.isArray(matchExperience.selectedContexts) ? matchExperience.selectedContexts.length : 0,
        matchExperienceSettlementId: String(matchExperience.matchExperienceSettlementId || "")
      }),
      sampleScore
    });
  }

  function updateCompetitionEvaluation(saved, evidence, identity = "") {
    const state = normalizeEvaluationState(saved, identity);
    if (!evidence?.matchIdentity) return { status: "invalid", state };
    if (state.appliedMatchIdentities.includes(evidence.matchIdentity)) return { status: "duplicate", state };
    state.evidenceHistory.push(clone(evidence));
    state.evidenceHistory = state.evidenceHistory.slice(-MAX_EVIDENCE_HISTORY);
    state.appliedMatchIdentities.push(evidence.matchIdentity);
    state.appliedMatchIdentities = state.appliedMatchIdentities.slice(-12);
    state.sampleCount = state.evidenceHistory.length;
    state.trainingEvidence = clone(evidence.trainingEvidence);
    state.matchEvidence = clone(evidence.matchEvidence);
    state.exposureEvidence = clone(evidence.exposureEvidence);
    const weighted = state.evidenceHistory.map((item, index, all) => ({ value: Number(item.sampleScore) || 0, weight: index + 1 + Math.max(0, 3 - all.length) }));
    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0) || 1;
    state.accumulatedScore = round(weighted.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight);
    const recent = state.evidenceHistory.slice(-2);
    state.trendScore = round(recent.reduce((sum, item) => sum + (Number(item.sampleScore) || 0), 0) / Math.max(1, recent.length));
    state.recentTrend = state.trendScore >= 1 ? "positive" : state.trendScore <= -1 ? "negative" : "neutral";
    state.promotionPressure = round(clamp(state.accumulatedScore, 0, 5));
    state.demotionPressure = round(clamp(-state.accumulatedScore, 0, 5));
    state.rolePressure = state.promotionPressure >= 1.4 ? "promotion" : state.demotionPressure >= 1.4 ? "demotion" : "stable";
    return { status: "applied", state };
  }

  function reassessRole(input = {}) {
    const currentRole = normalizeRole(input.currentRole);
    const evaluation = normalizeEvaluationState(input.evaluation, input.evaluation?.evaluationIdentity);
    const competition = input.competition || {};
    const gap = Number.isFinite(Number(competition.playerRelativeGap)) ? Number(competition.playerRelativeGap) : -99;
    const reasons = [];
    let nextRole = currentRole;
    if (evaluation.sampleCount < 2) reasons.push("limitedSample");
    if (evaluation.exposureEvidence?.noAppearance) reasons.push("noActualExposure");
    if ((evaluation.trainingEvidence?.score || 0) >= 0.8) reasons.push("trainingImprovement");
    if (gap >= -1.8) reasons.push("competitionGapClosed");
    else reasons.push("competitionStillAhead");

    if (evaluation.sampleCount >= 2 && currentRole === "bench" && evaluation.accumulatedScore >= 1.4 && gap >= -2.5) {
      nextRole = "rotation";
      reasons.push("sustainedPositivePerformance");
    } else if (evaluation.sampleCount >= 3 && currentRole === "rotation" && evaluation.accumulatedScore >= 2 && gap >= -0.8) {
      nextRole = "starter";
      reasons.push("sustainedPositivePerformance");
    } else if (evaluation.sampleCount >= 2 && currentRole === "starter" && evaluation.accumulatedScore <= -1.5) {
      nextRole = "rotation";
      reasons.push("sustainedNegativePerformance");
    } else if (evaluation.sampleCount >= 2 && currentRole === "rotation" && evaluation.accumulatedScore <= -1.4) {
      nextRole = "bench";
      reasons.push("sustainedNegativePerformance");
    }
    const change = nextRole === currentRole ? "same" : ROLE_ORDER.indexOf(nextRole) > ROLE_ORDER.indexOf(currentRole) ? "promotion" : "demotion";
    return Object.freeze({ currentRole, nextRole, change, reasons: Object.freeze([...new Set(reasons)]), roleLabel: ROLE_LABELS[nextRole] });
  }

  function applyRoleResult(target, result, opportunityText = "") {
    if (!target || !result) return false;
    target.highSchoolRoleCode = normalizeRole(result.nextRole);
    target.highSchoolTeamRole = ROLE_LABELS[target.highSchoolRoleCode];
    const previous = target.highSchoolRoleContext || {};
    target.highSchoolRoleContext = {
      ...previous,
      code: target.highSchoolRoleCode,
      label: target.highSchoolTeamRole,
      evidence: result.reasons.slice(),
      opportunity: opportunityText || previous.opportunity || "下一次評估機會",
      assignment: result.change
    };
    return true;
  }

  function normalizeOpportunityHistory(history) {
    return Array.isArray(history) ? history.slice(-MAX_OPPORTUNITY_HISTORY).map(clone) : [];
  }

  function recordOpportunity(history, input = {}) {
    const records = normalizeOpportunityHistory(history);
    const opportunity = input.opportunity || {};
    const opportunityId = String(input.opportunityId || opportunity.decisionId || "");
    if (!opportunityId) return records;
    const index = records.findIndex(item => item.opportunityId === opportunityId);
    const record = {
      opportunityId,
      matchId: String(input.matchId || opportunity.matchId || ""),
      opportunityIndex: Math.max(1, Number(input.opportunityIndex) || 1),
      roleAtCreation: normalizeRole(input.roleAtCreation || opportunity.actualRole),
      plannedUsage: clone(input.plannedUsage || opportunity.plannedUsage || null),
      actualExposure: input.actualExposure === undefined ? (index >= 0 ? records[index].actualExposure : null) : clone(input.actualExposure),
      evaluationConsequence: input.evaluationConsequence === undefined ? (index >= 0 ? records[index].evaluationConsequence : null) : clone(input.evaluationConsequence)
    };
    if (index >= 0) records[index] = record;
    else records.push(record);
    return records.slice(-MAX_OPPORTUNITY_HISTORY);
  }

  return Object.freeze({
    VERSION,
    MAX_EVIDENCE_HISTORY,
    MAX_OPPORTUNITY_HISTORY,
    ROLE_LABELS,
    createEvaluationState,
    normalizeEvaluationState,
    collectCompetitionEvidence,
    updateCompetitionEvaluation,
    reassessRole,
    applyRoleResult,
    normalizeOpportunityHistory,
    recordOpportunity
  });
});
