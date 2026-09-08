(function (root, factory) {
  const foundation = typeof module === "object" && module.exports
    ? require("./high-school-competition-foundation.js") : root.HighSchoolCompetitionFoundation;
  const evidence = typeof module === "object" && module.exports
    ? require("./high-school-competition-evidence.js") : root.HighSchoolCompetitionEvidence;
  const api = factory(foundation, evidence);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CountySelectionOpportunity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (CompetitionFoundation, CompetitionEvidence) {
  "use strict";

  const VERSION = "county-selection-opportunity-v1";
  const STATUSES = ["not_considered", "under_observation", "candidate", "selected", "not_selected"];
  const RECOMMENDATIONS = ["ineligible", "observe", "candidate", "select", "decline"];
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const key = (...parts) => JSON.stringify(parts.map(value => String(value ?? "")));
  const round = (value, digits = 3) => {
    const scale = 10 ** digits;
    return Math.round((Number(value) || 0) * scale) / scale;
  };
  const clamp = (value, min = 0, max = 10) => Math.max(min, Math.min(max, Number(value) || 0));

  function emptyState() {
    return { version: VERSION, opportunities: [] };
  }

  function getState(player) {
    if (!player.countySelectionState) player.countySelectionState = emptyState();
    return player.countySelectionState;
  }

  function normalizeRosterNeed(input = {}) {
    const neededPositions = [...new Set((input.neededPositions || []).map(String))];
    const depthByPosition = {};
    Object.entries(input.depthByPosition || {}).forEach(([position, depth]) => { depthByPosition[position] = Math.max(0, Number(depth) || 0); });
    const roleNeed = input.roleNeed && typeof input.roleNeed === "object" ? clone(input.roleNeed) : {};
    return Object.freeze({ neededPositions: Object.freeze(neededPositions), depthByPosition: Object.freeze(depthByPosition), roleNeed: Object.freeze(roleNeed) });
  }

  function getTeamNeedFit(rosterNeed, position, role) {
    if (rosterNeed.neededPositions.includes(position)) return 9;
    if (Number.isFinite(rosterNeed.depthByPosition[position])) return clamp(8 - rosterNeed.depthByPosition[position] * 2);
    if (rosterNeed.roleNeed[position] === role || rosterNeed.roleNeed[position] === true) return 7;
    return 4;
  }

  function validateReadiness(snapshot, playerId, position) {
    check(snapshot && typeof snapshot === "object", "County selection requires a canonical position evaluation snapshot");
    check(snapshot.playerId === playerId, "Position evaluation player mismatch");
    check(snapshot.position === position || snapshot.requestedPosition === position, "Position evaluation position mismatch");
    check(typeof snapshot.version === "string" && snapshot.version.length > 0, "Unversioned position evaluation snapshot");
    return snapshot;
  }

  function recommendationRank(value) {
    return { ineligible: 0, decline: 1, observe: 2, candidate: 3, select: 4 }[value] ?? 0;
  }

  function buildCountySelectionProfile(player, input = {}) {
    const playerId = String(input.playerId || "player");
    const countyTeamId = String(input.countyTeamId || "");
    const targetCompetitionEditionId = String(input.targetCompetitionEditionId || "");
    const sourceSchoolTeamId = String(input.sourceSchoolTeamId || "");
    check(countyTeamId && targetCompetitionEditionId && sourceSchoolTeamId, "Incomplete county selection context");
    check(player.primaryTeamAssignment?.teamId === sourceSchoolTeamId, "County selection source school mismatch");
    const edition = player.competitionFoundation?.editions?.find(item => item.editionId === targetCompetitionEditionId);
    check(edition, "County selection target edition is unknown");
    const countyTeam = player.competitionFoundation?.teams?.find(item => item.teamId === countyTeamId);
    check(countyTeam?.teamType === "county_representative", "County selection requires a county representative team");
    const eligibility = CompetitionFoundation.evaluateCompetitionEligibility(input.eligibilityPlayer || player, edition);
    const position = String(input.position || player.primaryPosition || "");
    const readiness = validateReadiness(input.positionEvaluation, playerId, position);
    const rosterNeed = normalizeRosterNeed(input.rosterNeed);
    const evidenceSummary = CompetitionEvidence.getCompetitionEvidenceSummary(player, {
      playerId,
      competitionEditionId: input.sourceCompetitionEditionId || undefined
    });
    const competitionContext = input.sourceCompetitionEditionId
      ? CompetitionEvidence.getCompetitionContext(player, input.sourceCompetitionEditionId) : null;
    const exposureWeight = clamp(competitionContext?.exposureWeight ?? 1, 0, 2);
    const positionFit = clamp(readiness.positionFit);
    const positionReadiness = clamp(readiness.positionReadiness);
    const confidence = { low: 2.5, medium: 6, high: 9 }[evidenceSummary.sampleConfidence] || 0;
    const evidenceQuality = clamp(5 + evidenceSummary.quality * exposureWeight, 0, 10);
    const recentForm = clamp(5 + evidenceSummary.recentQuality, 0, 10);
    const teamNeedFit = getTeamNeedFit(rosterNeed, position, input.role || "participant");
    const score = round(positionReadiness * 0.23 + positionFit * 0.2 + evidenceQuality * 0.2
      + confidence * 0.17 + teamNeedFit * 0.15 + recentForm * 0.05);
    const positiveReasons = [];
    const concerns = [];
    if (positionReadiness >= 6.5) positiveReasons.push("strong-position-readiness");
    else if (positionReadiness < 4.5) concerns.push("limited-position-readiness");
    if (positionFit >= 6.5) positiveReasons.push("strong-position-fit");
    else if (positionFit < 4.5) concerns.push("limited-position-fit");
    if (teamNeedFit >= 7) positiveReasons.push("county-position-need");
    else if (teamNeedFit < 5) concerns.push("limited-county-roster-need");
    if (evidenceSummary.sampleConfidence === "high") positiveReasons.push("strong-competition-sample");
    else if (evidenceSummary.sampleConfidence === "medium") positiveReasons.push("sufficient-competition-sample");
    else concerns.push("limited-competition-sample");
    if (evidenceSummary.quality >= 1) positiveReasons.push("positive-competition-evidence");
    else if (evidenceSummary.quality < -0.5) concerns.push("weak-competition-evidence");
    if (!eligibility.eligible) concerns.push(...eligibility.reasons.map(reason => `eligibility:${reason}`));
    let recommendation = "decline";
    if (!eligibility.eligible) recommendation = "ineligible";
    else if (evidenceSummary.sampleConfidence === "low") recommendation = "observe";
    else if (score >= 7.4 && positionFit >= 6 && teamNeedFit >= 6 && evidenceSummary.quality > 0) recommendation = "select";
    else if (score >= 5.7 && positionFit >= 4.5) recommendation = "candidate";
    else if (score >= 4.3) recommendation = "observe";
    return Object.freeze({
      version: VERSION,
      playerId,
      countyTeamId,
      targetCompetitionEditionId,
      sourceSchoolTeamId,
      position,
      capabilitySummary: Object.freeze({
        sourceVersion: readiness.version,
        positionReadiness: round(positionReadiness),
        fieldingReadiness: round(readiness.fieldingReadiness),
        reactionReadiness: round(readiness.reactionReadiness),
        decisionReadiness: round(readiness.decisionReadiness)
      }),
      positionFit: round(positionFit),
      competitionEvidenceSummary: evidenceSummary,
      sampleConfidence: evidenceSummary.sampleConfidence,
      recentTrend: evidenceSummary.recentQuality > 0.5 ? "positive" : evidenceSummary.recentQuality < -0.5 ? "negative" : "neutral",
      teamNeed: rosterNeed,
      teamNeedFit: round(teamNeedFit),
      evaluationScore: score,
      recommendation,
      positiveReasons: Object.freeze([...new Set(positiveReasons)]),
      concerns: Object.freeze([...new Set(concerns)]),
      eligibility: Object.freeze(clone(eligibility))
    });
  }

  function evaluateOpportunity(player, input = {}) {
    const profile = buildCountySelectionProfile(player, input);
    const opportunityId = key(profile.playerId, profile.countyTeamId, profile.targetCompetitionEditionId);
    const state = getState(player);
    const existing = state.opportunities.find(item => item.opportunityId === opportunityId);
    const previousStatus = existing?.status;
    const evaluatedStatus = profile.recommendation === "ineligible" || profile.recommendation === "decline" ? "not_selected"
      : profile.recommendation === "candidate" || profile.recommendation === "select" ? "candidate" : "under_observation";
    const revision = {
      revision: (existing?.evaluationHistory?.length || 0) + 1,
      context: clone(input.evaluationContext || {}),
      recommendation: profile.recommendation,
      evaluationScore: profile.evaluationScore,
      positiveReasons: clone(profile.positiveReasons),
      concerns: clone(profile.concerns)
    };
    const opportunity = existing || {
      opportunityId,
      playerId: profile.playerId,
      countyTeamId: profile.countyTeamId,
      targetCompetitionEditionId: profile.targetCompetitionEditionId,
      sourceSchoolTeamId: profile.sourceSchoolTeamId,
      status: "not_considered",
      recommendation: "observe",
      positiveReasons: [],
      concerns: [],
      profile: null,
      evaluationHistory: [],
      decision: null
    };
    check(opportunity.sourceSchoolTeamId === profile.sourceSchoolTeamId, "County opportunity source school conflict");
    opportunity.recommendation = profile.recommendation;
    opportunity.positiveReasons = clone(profile.positiveReasons);
    opportunity.concerns = clone(profile.concerns);
    opportunity.profile = clone(profile);
    opportunity.evaluationHistory.push(revision);
    if (!previousStatus || !["selected", "not_selected"].includes(previousStatus)) opportunity.status = evaluatedStatus;
    if (!existing) state.opportunities.push(opportunity);
    return Object.freeze({ status: existing ? "updated" : "created", opportunity: clone(opportunity), profile });
  }

  function findOpportunity(player, input) {
    const opportunityId = input.opportunityId || key(input.playerId || "player", input.countyTeamId, input.targetCompetitionEditionId);
    const opportunity = getState(player).opportunities.find(item => item.opportunityId === opportunityId);
    check(opportunity, "Unknown county selection opportunity");
    return opportunity;
  }

  function recordSelectionDecision(player, input = {}) {
    const decision = input.decision;
    check(["selected", "not_selected"].includes(decision), "Invalid county selection decision");
    const opportunity = findOpportunity(player, input);
    if (opportunity.decision) {
      check(opportunity.decision.result === decision, "County selection decision conflict");
      return Object.freeze({ status: "duplicate", opportunity: clone(opportunity) });
    }
    if (decision === "selected") {
      check(opportunity.profile?.eligibility?.eligible === true, "Ineligible player cannot be selected");
      check(recommendationRank(opportunity.recommendation) >= recommendationRank("candidate"), "Selection requires candidate-level support");
      const assignment = CompetitionFoundation.startTemporaryAssignment(player, {
        assignmentId: input.assignmentId || `${opportunity.opportunityId}|assignment`,
        teamId: opportunity.countyTeamId,
        competitionEditionId: opportunity.targetCompetitionEditionId,
        startContext: { countySelectionOpportunityId: opportunity.opportunityId, ...(clone(input.decisionContext || {})) }
      });
      const roster = CompetitionFoundation.addRepresentativeRosterEntry(player, {
        rosterId: input.rosterId,
        teamId: opportunity.countyTeamId,
        competitionEditionId: opportunity.targetCompetitionEditionId,
        playerId: opportunity.playerId,
        sourceTeamId: opportunity.sourceSchoolTeamId,
        rosterRole: input.rosterRole || "reserve"
      }, input.sourceRoster);
      opportunity.bridge = { assignmentId: assignment.assignmentId, rosterId: roster.rosterId };
    }
    opportunity.status = decision;
    opportunity.decision = {
      decisionId: `${opportunity.opportunityId}|decision`,
      result: decision,
      recommendationAtDecision: opportunity.recommendation,
      positiveReasons: clone(opportunity.positiveReasons),
      concerns: clone(opportunity.concerns),
      context: clone(input.decisionContext || {})
    };
    return Object.freeze({ status: "applied", opportunity: clone(opportunity) });
  }

  function getOpportunities(player, filter = {}) {
    return clone(getState(player).opportunities.filter(item =>
      (!filter.playerId || item.playerId === filter.playerId)
      && (!filter.countyTeamId || item.countyTeamId === filter.countyTeamId)
      && (!filter.targetCompetitionEditionId || item.targetCompetitionEditionId === filter.targetCompetitionEditionId)));
  }

  function normalizeState(saved) {
    if (!saved) return emptyState();
    check(saved.version === VERSION && Array.isArray(saved.opportunities), "Unsupported county selection schema");
    const state = emptyState();
    const ids = new Set();
    saved.opportunities.forEach(source => {
      check(!ids.has(source.opportunityId), "Duplicate county selection opportunity");
      check(STATUSES.includes(source.status) && RECOMMENDATIONS.includes(source.recommendation), "Invalid county selection state");
      check(Array.isArray(source.positiveReasons) && Array.isArray(source.concerns) && Array.isArray(source.evaluationHistory), "Invalid county selection explainability");
      ids.add(source.opportunityId);
      state.opportunities.push(clone(source));
    });
    return state;
  }

  function assertIntegrity(player) {
    const state = normalizeState(player.countySelectionState);
    state.opportunities.forEach(item => {
      check(player.competitionFoundation?.teams?.some(team => team.teamId === item.countyTeamId && team.teamType === "county_representative"), "Dangling county team");
      check(player.competitionFoundation?.editions?.some(edition => edition.editionId === item.targetCompetitionEditionId), "Dangling county target edition");
      check(player.primaryTeamAssignment?.teamId === item.sourceSchoolTeamId, "County opportunity source school changed");
      if (item.status === "selected") {
        check(player.temporaryTeamAssignments?.some(assignment => assignment.assignmentId === item.bridge?.assignmentId), "Selected opportunity lacks assignment");
        const roster = player.competitionFoundation.representativeRosters.find(candidate => candidate.rosterId === item.bridge?.rosterId);
        check(roster?.entries?.some(entry => entry.playerId === item.playerId && entry.sourceTeamId === item.sourceSchoolTeamId), "Selected opportunity lacks canonical roster reference");
      }
    });
    return true;
  }

  function restorePlayer(player, savedState = player.countySelectionState) {
    player.countySelectionState = normalizeState(savedState);
    assertIntegrity(player);
    player.countySelectionState = clone(player.countySelectionState);
    return player;
  }

  return Object.freeze({
    VERSION, STATUSES: Object.freeze(STATUSES.slice()), RECOMMENDATIONS: Object.freeze(RECOMMENDATIONS.slice()),
    emptyState, normalizeRosterNeed, buildCountySelectionProfile, evaluateOpportunity, recordSelectionDecision,
    getOpportunities, normalizeState, assertIntegrity, restorePlayer
  });
});
