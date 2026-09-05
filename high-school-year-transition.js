(function (root, factory) {
  const api = factory(
    root?.TeamRosterFoundation || (typeof require === "function" ? require("./team-roster-foundation.js") : null),
    root?.TeamStrengthModel || (typeof require === "function" ? require("./team-strength-model.js") : null),
    root?.HighSchoolEntryRosterContext || (typeof require === "function" ? require("./high-school-entry-roster-context.js") : null),
    root?.HighSchoolCompetitionReassessment || (typeof require === "function" ? require("./high-school-competition-reassessment.js") : null)
  );
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HighSchoolYearTransition = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (
  TeamRosterFoundation,
  TeamStrengthModel,
  HighSchoolEntryRosterContext,
  HighSchoolCompetitionReassessment
) {
  "use strict";

  const VERSION = "high-school-year-transition-v1";

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function getHighSchoolYearIdentity(year) {
    const normalizedYear = Math.max(1, Math.min(3, Math.floor(Number(year) || 1)));
    return `hs-year-${normalizedYear}-age-${15 + normalizedYear}`;
  }

  function getHighSchoolCompetitionIdentity(schoolId) {
    return `${String(schoolId || "legacy-high-school")}|high-school-competition-career`;
  }

  function createIncomingActor(candidate, input, index) {
    const incomingId = `${input.schoolId}-${input.nextYearIdentity}-incoming-${String(index + 1).padStart(2, "0")}`;
    return Object.freeze({
      ...clone(candidate),
      playerId: incomingId,
      id: incomingId,
      age: 16,
      year: 1,
      source: "high-school-year-transition-incoming"
    });
  }

  function generateIncomingHighSchoolClass(input = {}) {
    if (!TeamRosterFoundation) throw new Error("High-school year transition requires TeamRosterFoundation.");
    const count = Math.max(0, Math.floor(Number(input.count) || 0));
    if (!count) return Object.freeze([]);
    const template = TeamRosterFoundation.generateTeamRoster({
      teamId: `${input.schoolId}-incoming-${input.nextYearIdentity}`,
      schoolId: input.schoolId,
      schoolStandard: input.schoolStandard,
      yearIdentity: input.nextYearIdentity,
      seed: `${input.transitionSeed}|incoming`,
      positionWeaknesses: input.positionNeeds || {}
    });
    const candidates = template.players.slice();
    const selected = [];
    const used = new Set();
    (input.requiredPositions || []).forEach(position => {
      const candidate = candidates.find(actor => !used.has(actor.playerId) && actor.primaryPosition === position);
      if (!candidate) return;
      used.add(candidate.playerId);
      selected.push(candidate);
    });
    candidates.forEach(candidate => {
      if (selected.length >= count || used.has(candidate.playerId)) return;
      used.add(candidate.playerId);
      selected.push(candidate);
    });
    return Object.freeze(selected.slice(0, count).map((candidate, index) => createIncomingActor(candidate, input, index)));
  }

  function advanceHighSchoolRosterYear(input = {}) {
    if (!TeamRosterFoundation || !TeamStrengthModel || !HighSchoolEntryRosterContext) {
      throw new Error("High-school roster transition dependencies are unavailable.");
    }
    const priorRoster = input.selectedBaseRoster;
    if (!priorRoster || !TeamRosterFoundation.validateRoster(priorRoster).ok) {
      throw new Error("High-school roster transition requires a valid canonical base roster.");
    }
    const nextYear = Math.max(2, Math.min(3, Math.floor(Number(input.nextHighSchoolYear) || 2)));
    const schoolId = String(input.schoolId || priorRoster.schoolId || priorRoster.teamId || "school-unidentified");
    const schoolStandard = TeamRosterFoundation.SCHOOL_STANDARDS.includes(input.schoolStandard)
      ? input.schoolStandard : priorRoster.schoolStandard || "standard";
    const nextYearIdentity = String(input.nextYearIdentity || getHighSchoolYearIdentity(nextYear));
    const previousIdentity = String(input.currentSchoolYearRosterIdentity?.identity || priorRoster.generationSeed || schoolId);
    const identity = HighSchoolEntryRosterContext.createSchoolYearRosterIdentity({
      schoolId,
      schoolStandard,
      yearIdentity: nextYearIdentity,
      schoolSeed: `${previousIdentity}|advance-to-${nextYear}`
    });
    const priorActors = priorRoster.players.filter(actor => actor.id !== "player");
    const graduates = priorActors.filter(actor => Number(actor.year) >= 3);
    const returners = priorActors.filter(actor => Number(actor.year) < 3).map(actor => Object.freeze({
      ...clone(actor),
      age: Math.max(16, Number(actor.age) || 16) + 1,
      year: Math.max(1, Number(actor.year) || 1) + 1,
      source: actor.source || "team-roster-foundation"
    }));
    const coveredPrimaryPositions = new Set(returners.map(actor => actor.primaryPosition));
    const requiredPositions = TeamRosterFoundation.POSITION_ORDER.filter(position => !coveredPrimaryPositions.has(position));
    const incoming = generateIncomingHighSchoolClass({
      schoolId,
      schoolStandard,
      nextYearIdentity,
      transitionSeed: identity.rosterGenerationSeed,
      count: graduates.length,
      requiredPositions,
      positionNeeds: input.positionNeeds || {}
    });
    const evolvedRoster = TeamRosterFoundation.rebuildTeamRoster({
      sourceRoster: priorRoster,
      players: [...returners, ...incoming],
      teamId: priorRoster.teamId || schoolId,
      schoolId,
      schoolStandard,
      yearIdentity: nextYearIdentity,
      generationSeed: identity.rosterGenerationSeed,
      composition: priorRoster.composition
    });
    const validation = TeamRosterFoundation.validateRoster(evolvedRoster);
    if (!validation.ok) throw new Error(`Evolved high-school roster is invalid: ${validation.errors.join(",")}`);
    return deepFreeze({
      version: VERSION,
      transitionIdentity: `${previousIdentity}|${identity.identity}|${VERSION}`,
      previousRosterIdentity: previousIdentity,
      schoolYearRosterIdentity: identity,
      selectedBaseRoster: evolvedRoster,
      teamStrengthProfile: TeamStrengthModel.deriveTeamStrengthProfile(evolvedRoster),
      graduateIds: graduates.map(actor => actor.playerId),
      returnerIds: returners.map(actor => actor.playerId),
      incomingIds: incoming.map(actor => actor.playerId),
      nextHighSchoolYear: nextYear
    });
  }

  function advanceHighSchoolCompetitionYear(input = {}) {
    if (!HighSchoolCompetitionReassessment) {
      throw new Error("High-school competition transition requires Competition Reassessment.");
    }
    const evaluation = HighSchoolCompetitionReassessment.normalizeEvaluationState(
      input.evaluation,
      getHighSchoolCompetitionIdentity(input.schoolId)
    );
    evaluation.evaluationIdentity = getHighSchoolCompetitionIdentity(input.schoolId);
    const baseResult = HighSchoolCompetitionReassessment.reassessRole({
      currentRole: input.currentRole,
      evaluation,
      competition: input.nextCompetition,
      readiness: input.readiness,
      coachTrust: input.coachTrust
    });
    const reasons = [];
    if ((input.graduateIds || []).includes(input.previousCompetition?.starterId)) reasons.push("incumbentGraduated", "competitionOpened");
    const incomingSet = new Set(input.incomingIds || []);
    if ((input.nextCompetition?.competitorIds || []).some(id => incomingSet.has(id))) reasons.push("newCompetitorArrived");
    const previousGap = Number(input.previousCompetition?.playerRelativeGap);
    const nextGap = Number(input.nextCompetition?.playerRelativeGap);
    if (Number.isFinite(previousGap) && Number.isFinite(nextGap)) {
      if (nextGap > previousGap) reasons.push("competitionGapImproved");
      if (nextGap < previousGap) reasons.push("competitionGapWorsened");
    }
    if (evaluation.promotionPressure > 0) reasons.push("carriedPositiveEvaluation");
    if (evaluation.demotionPressure > 0) reasons.push("carriedNegativeEvaluation");
    const roleResult = deepFreeze({ ...clone(baseResult), reasons: [...new Set([...baseResult.reasons, ...reasons])] });
    return deepFreeze({
      version: VERSION,
      evaluation,
      roleResult,
      inputSnapshot: {
        priorRole: input.currentRole,
        priorCompetition: clone(input.previousCompetition),
        nextCompetition: clone(input.nextCompetition),
        readiness: clone(input.readiness),
        coachTrust: Number(input.coachTrust) || 0,
        health: clone(input.health)
      }
    });
  }

  return Object.freeze({
    VERSION,
    getHighSchoolYearIdentity,
    getHighSchoolCompetitionIdentity,
    generateIncomingHighSchoolClass,
    advanceHighSchoolRosterYear,
    advanceHighSchoolCompetitionYear
  });
});
