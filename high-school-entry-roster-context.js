(function (root, factory) {
  const rosterApi = root?.TeamRosterFoundation || (typeof require === "function" ? require("./team-roster-foundation.js") : null);
  const strengthApi = root?.TeamStrengthModel || (typeof require === "function" ? require("./team-strength-model.js") : null);
  const api = factory(rosterApi, strengthApi);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HighSchoolEntryRosterContext = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (TeamRosterFoundation, TeamStrengthModel) {
  "use strict";

  const VERSION = "high-school-entry-roster-context-v1";
  const SCHOOL_POSITION_IDS = Object.freeze(["P", "C", "1B", "2B", "3B", "SS", "OF"]);
  const NEED_LEVELS = Object.freeze(["low", "medium", "high"]);
  const COMPETITION_LEVELS = Object.freeze(["low", "medium", "high", "veryHigh"]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (const character of String(value ?? "")) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function requireRosterApi() {
    if (!TeamRosterFoundation) throw new Error("High School Entry Roster Context requires TeamRosterFoundation.");
    return TeamRosterFoundation;
  }

  function createSchoolYearRosterIdentity(input = {}) {
    const api = requireRosterApi();
    const schoolId = String(input.schoolId || "school-unidentified");
    const schoolStandard = api.SCHOOL_STANDARDS.includes(input.schoolStandard) ? input.schoolStandard : "standard";
    const yearIdentity = String(input.yearIdentity || "hs-entry-year-1");
    const schoolSeed = String(input.schoolSeed || schoolId);
    const rosterGenerationSeed = `roster-${stableHash([schoolId, schoolStandard, yearIdentity, schoolSeed, VERSION].join("|")).toString(16).padStart(8, "0")}`;
    return deepFreeze({
      version: VERSION,
      identity: `${schoolId}|${yearIdentity}|${rosterGenerationSeed}`,
      schoolId, schoolStandard, yearIdentity, rosterGenerationSeed
    });
  }

  function getRosterActor(roster, playerId) {
    return (roster?.players || []).find(player => player.playerId === playerId) || null;
  }

  function getPositionCapability(actor, position) {
    if (!actor) return 0;
    const code = TeamRosterFoundation.normalizePosition(position);
    const simulationOffense = actor.simulationCapability?.offense || {};
    const simulationDefense = actor.simulationCapability?.defense || {};
    const contact = Number(simulationOffense.contact ?? actor.contact) || 0;
    const power = Number(simulationOffense.power ?? actor.power) || 0;
    const speed = Number(simulationOffense.speed ?? actor.speed) || 0;
    const fielding = Number(simulationDefense.fielding ?? actor.defense) || 0;
    const arm = Number(simulationDefense.arm ?? actor.arm) || 0;
    const offense = contact * 0.55 + power * 0.45;
    const defense = fielding * 0.65 + arm * 0.35;
    if (code === "P") return Number(((Number(actor.pitchingProfile?.effectiveness ?? actor.pitching) * 0.4
      + Number(actor.pitchingProfile?.control ?? actor.pitching) * 0.3
      + Number(actor.pitchingProfile?.stuff ?? actor.pitching) * 0.3)).toFixed(3));
    if (code === "C") return Number((defense * 0.7 + offense * 0.3).toFixed(3));
    if (code === "SS" || code === "CF" || code === "2B") return Number((defense * 0.65 + speed * 0.2 + contact * 0.15).toFixed(3));
    if (code === "3B" || code === "RF") return Number((defense * 0.55 + offense * 0.45).toFixed(3));
    return Number((defense * 0.45 + offense * 0.55).toFixed(3));
  }

  function resolveRosterPosition(roster, schoolPosition) {
    if (schoolPosition !== "OF") return TeamRosterFoundation.normalizePosition(schoolPosition);
    const candidates = ["LF", "CF", "RF"].map(position => {
      const context = deriveBasePositionContext(roster, position);
      return { position, context };
    }).sort((left, right) => {
      const needRank = { high: 2, medium: 1, low: 0 };
      return needRank[right.context.positionNeed] - needRank[left.context.positionNeed]
        || left.context.starterCapability - right.context.starterCapability
        || left.position.localeCompare(right.position);
    });
    return candidates[0]?.position || "CF";
  }

  function classifyPositionNeed(starterCapability, benchCapabilities) {
    const benchCount = benchCapabilities.length;
    const benchAverage = benchCount ? benchCapabilities.reduce((sum, value) => sum + value, 0) / benchCount : 0;
    if (starterCapability < 5.7 && (benchCount === 0 || benchAverage < 5.4)) return "high";
    if (starterCapability < 6.5 && (benchCount === 0 || benchAverage < 5.3)) return "high";
    if (starterCapability >= 7.2 && benchCount >= 1 && benchAverage >= 6.1) return "low";
    if (starterCapability >= 7.8) return "low";
    return "medium";
  }

  function deriveBasePositionContext(roster, position) {
    const code = TeamRosterFoundation.normalizePosition(position);
    const query = TeamRosterFoundation.getPositionCompetition(roster, code);
    const starter = getRosterActor(roster, query.starterId);
    const benchActors = query.benchCompetitorIds.map(id => getRosterActor(roster, id)).filter(Boolean);
    const starterCapability = getPositionCapability(starter, code);
    const benchCapabilities = benchActors.map(actor => getPositionCapability(actor, code));
    const benchAverageCapability = benchCapabilities.length
      ? Number((benchCapabilities.reduce((sum, value) => sum + value, 0) / benchCapabilities.length).toFixed(3)) : 0;
    return deepFreeze({
      position: code,
      starterId: query.starterId,
      starterCapability,
      competitorIds: query.competitorIds.slice(),
      benchCompetitorIds: query.benchCompetitorIds.slice(),
      competitorCount: query.competitionCount,
      benchCapabilities,
      benchAverageCapability,
      positionNeed: classifyPositionNeed(starterCapability, benchCapabilities)
    });
  }

  function deriveCompetitionContext(roster, position, playerCapability = 0) {
    const base = deriveBasePositionContext(roster, position);
    const relativeGap = Number((Number(playerCapability || 0) - base.starterCapability).toFixed(3));
    const relativePressureAdjustment = Math.max(-0.75, Math.min(0.75, -relativeGap * 0.1));
    const densityScore = base.starterCapability * 0.55 + base.benchAverageCapability * 0.3
      + Math.min(3, base.benchCompetitorIds.length) * 0.65 + relativePressureAdjustment;
    const competitionDensity = densityScore >= 8 ? "veryHigh" : densityScore >= 6.6 ? "high" : densityScore >= 5 ? "medium" : "low";
    return deepFreeze({ ...clone(base), playerCapability: Number(playerCapability || 0), playerRelativeGap: relativeGap, competitionDensity });
  }

  function derivePositionNeeds(baseRoster) {
    return deepFreeze(Object.fromEntries(SCHOOL_POSITION_IDS.map(position => {
      if (position !== "OF") return [position, deriveBasePositionContext(baseRoster, position).positionNeed];
      const outfieldNeeds = ["LF", "CF", "RF"].map(item => deriveBasePositionContext(baseRoster, item).positionNeed);
      const rank = { low: 0, medium: 1, high: 2 };
      return [position, outfieldNeeds.sort((left, right) => rank[right] - rank[left])[0]];
    })));
  }

  function createCandidateSchoolYearContext(input = {}) {
    const identity = createSchoolYearRosterIdentity(input);
    const baseRoster = TeamRosterFoundation.generateTeamRoster({
      teamId: identity.schoolId, schoolId: identity.schoolId, schoolStandard: identity.schoolStandard,
      yearIdentity: identity.yearIdentity, seed: identity.rosterGenerationSeed,
      positionWeaknesses: input.positionWeaknesses || {}
    });
    const positionNeeds = derivePositionNeeds(baseRoster);
    const teamStrengthProfile = TeamStrengthModel ? TeamStrengthModel.deriveTeamStrengthProfile(baseRoster) : null;
    return deepFreeze({
      version: VERSION,
      schoolYearRosterIdentity: identity,
      schoolId: identity.schoolId,
      schoolStandard: identity.schoolStandard,
      yearIdentity: identity.yearIdentity,
      rosterGenerationSeed: identity.rosterGenerationSeed,
      baseRoster,
      positionNeeds,
      teamStrengthProfile
    });
  }

  function derivePlayerCompetitionContext(candidateContext, schoolPosition, playerCapability) {
    const rosterPosition = resolveRosterPosition(candidateContext.baseRoster, schoolPosition);
    return deriveCompetitionContext(candidateContext.baseRoster, rosterPosition, playerCapability);
  }

  function projectEntryRole(competitionContext) {
    const player = Number(competitionContext?.playerCapability) || 0;
    const starter = Number(competitionContext?.starterCapability) || 0;
    const bench = Number(competitionContext?.benchAverageCapability) || 0;
    const depth = Number(competitionContext?.benchCompetitorIds?.length) || 0;
    const density = competitionContext?.competitionDensity || "medium";
    if (player >= starter + 0.8) {
      return starter >= 6.6 || ["high", "veryHigh"].includes(density) ? "starterCompetition" : "coreCandidate";
    }
    if (player >= starter - 0.35 && player >= bench + 0.25) return "starterCompetition";
    if (player >= starter - 1.8 && player >= bench - 0.4) return "rotationCandidate";
    if (player >= bench - 1 || depth === 0 || (competitionContext?.positionNeed === "high" && density === "low")) return "benchCandidate";
    return "depthCandidate";
  }

  function injectPlayerIntoSelectedRoster(baseRoster, playerActor, options = {}) {
    return TeamRosterFoundation.injectPlayerIntoRoster(baseRoster, playerActor, options);
  }

  function validateCandidateContext(context) {
    const errors = [];
    if (context?.version !== VERSION) errors.push("context-version-invalid");
    if (!context?.schoolYearRosterIdentity?.identity) errors.push("roster-identity-missing");
    if (context?.schoolId !== context?.schoolYearRosterIdentity?.schoolId) errors.push("school-id-mismatch");
    if (context?.schoolStandard !== context?.schoolYearRosterIdentity?.schoolStandard) errors.push("school-standard-mismatch");
    if (!TeamRosterFoundation.validateRoster(context?.baseRoster).ok) errors.push("base-roster-invalid");
    if (!SCHOOL_POSITION_IDS.every(position => NEED_LEVELS.includes(context?.positionNeeds?.[position]))) errors.push("position-needs-invalid");
    return deepFreeze({ ok: errors.length === 0, errors });
  }

  return Object.freeze({
    VERSION, SCHOOL_POSITION_IDS, NEED_LEVELS, COMPETITION_LEVELS,
    createSchoolYearRosterIdentity, createCandidateSchoolYearContext, validateCandidateContext,
    getPositionCapability, deriveBasePositionContext, derivePositionNeeds, deriveCompetitionContext,
    derivePlayerCompetitionContext, projectEntryRole, injectPlayerIntoSelectedRoster
  });
});
