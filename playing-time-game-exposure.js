(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PlayingTimeGameExposure = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const OPPORTUNITY_VERSION = "playing-time-opportunity-v1";
  const READINESS_VERSION = "opportunity-readiness-v1";
  const EXPOSURE_VERSION = "game-exposure-v1";
  const COACH_STYLE_MAP = Object.freeze({
    conservative: "conservative",
    balanced: "balanced",
    developmental: "developmental",
    performanceFirst: "performanceFirst",
    fundamentals: "conservative",
    analysis: "balanced",
    development: "developmental",
    competition: "performanceFirst"
  });
  const ACTUAL_ROLES = Object.freeze(["starter", "rotation", "bench"]);
  const APPEARANCE_TYPES = Object.freeze(["start", "defensiveSubstitution", "pinchHit", "lateGameAppearance", "noAppearance"]);
  const LEFT_THROW_RESTRICTED_POSITIONS = Object.freeze(["捕手", "二壘手", "游擊手", "三壘手"]);
  const ROLE_BASE = Object.freeze({ starter: 58, rotation: 48, bench: 37 });
  const ENVIRONMENT_MODIFIER = Object.freeze({ low: -5, medium: -1, mediumHigh: 3, high: 6 });
  const COMPETITION_MODIFIER = Object.freeze({ veryHigh: -6, high: -3, medium: 0, low: 4 });
  const POSITION_NEED_MODIFIER = Object.freeze({ low: -4, medium: 0, high: 5 });
  const PROJECTED_ROLE_PRIOR = Object.freeze({ coreCandidate: 3, starterCompetition: 2, rotationCandidate: 0, benchCandidate: -1, depthCandidate: -2 });

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function clamp(value, minimum, maximum, fallback = minimum) {
    const numeric = Number(value);
    return Math.max(minimum, Math.min(maximum, Number.isFinite(numeric) ? numeric : fallback));
  }

  function stableHash(value) {
    const text = String(value ?? "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function normalizeCoachUsageStyle(style) {
    return COACH_STYLE_MAP[style] || "balanced";
  }

  function normalizeActualRole(role) {
    return ACTUAL_ROLES.includes(role) ? role : "bench";
  }

  function normalizePosition(position) {
    return typeof position === "string" && position.trim() ? position.trim() : "內野手";
  }

  function isPositionLegalForThrowingHand(position, throws = "R", age = 16) {
    const normalized = normalizePosition(position);
    if (throws !== "L" || Number(age) <= 12) return true;
    if (normalized === "內野手") return false;
    return !LEFT_THROW_RESTRICTED_POSITIONS.includes(normalized);
  }

  function resolveLegalPosition(input = {}) {
    const requested = normalizePosition(input.position);
    if (requested === "投手") return deepFreeze({
      requested, assigned: "投手", legal: true, pitcherExposureDeferred: true, fallbackApplied: false,
      assignmentSource: "requested-position", assignmentReason: "pitcher-exposure-deferred"
    });
    if (requested === "內野手" && (input.throws !== "L" || Number(input.age) <= 12)) {
      return deepFreeze({
        requested, assigned: "二壘手", legal: true, pitcherExposureDeferred: false, fallbackApplied: true,
        assignmentSource: "match-assignment", assignmentReason: "playable-2b-vertical"
      });
    }
    if (isPositionLegalForThrowingHand(requested, input.throws, input.age)) {
      return deepFreeze({
        requested, assigned: requested, legal: true, pitcherExposureDeferred: false, fallbackApplied: false,
        assignmentSource: "requested-position", assignmentReason: "specific-position-request"
      });
    }
    const candidates = Array.isArray(input.secondaryPositions) ? input.secondaryPositions : [];
    const legalSecondary = candidates.find(position => position !== "投手" && isPositionLegalForThrowingHand(position, input.throws, input.age));
    const assigned = legalSecondary || (input.throws === "L" && Number(input.age) > 12 ? "一壘手" : requested);
    return deepFreeze({
      requested, assigned, legal: isPositionLegalForThrowingHand(assigned, input.throws, input.age), pitcherExposureDeferred: false, fallbackApplied: assigned !== requested,
      assignmentSource: "handedness-legality-fallback", assignmentReason: legalSecondary ? "legal-secondary-position" : "left-throw-infield-1b-only"
    });
  }

  function getReadinessBand(positionReadiness) {
    if (positionReadiness >= 7) return "strong";
    if (positionReadiness >= 5) return "competitive";
    if (positionReadiness >= 3.5) return "developing";
    return "low";
  }

  function createOpportunityReadinessSnapshot(input = {}) {
    const subject = input.subject || {};
    const requestedPosition = normalizePosition(input.position || subject.primaryPosition);
    if (typeof input.capabilityProvider !== "function" || typeof input.positionAssessmentProvider !== "function") {
      throw new Error("Opportunity Readiness provisional producer requires capability and position assessment providers.");
    }
    const capabilityView = input.capabilityProvider(subject, requestedPosition) || {};
    const assessment = input.positionAssessmentProvider(requestedPosition, subject)
      || input.positionAssessmentProvider(subject.primaryPosition, subject) || {};
    const fieldingReadiness = clamp(capabilityView.fielding, 0, 10, 0);
    const reactionReadiness = clamp(capabilityView.reaction, 0, 10, 0);
    const decisionReadiness = clamp(capabilityView.decision, 0, 10, 0);
    const positionReadiness = (fieldingReadiness + reactionReadiness + decisionReadiness) / 3;
    const positionFit = clamp((Number(assessment.rating) || 0) / 3, 0, 10, 0);
    const secondaryPositions = Array.isArray(subject.secondaryPositions) ? subject.secondaryPositions.slice() : [];
    const experienceReadiness = typeof input.positionExperienceProvider === "function"
      ? clamp(input.positionExperienceProvider(subject, requestedPosition), 0, 10, 3)
      : requestedPosition === subject.primaryPosition ? 7 : secondaryPositions.includes(requestedPosition) ? 5 : 3;
    const legality = resolveLegalPosition({
      position: requestedPosition,
      secondaryPositions,
      throws: subject.throws,
      age: subject.age
    });
    const readinessBand = getReadinessBand(positionReadiness);
    const reasons = [
      fieldingReadiness >= 7 ? "strongFieldingReadiness" : fieldingReadiness < 4 ? "developingFieldingReadiness" : "competitiveFieldingReadiness",
      reactionReadiness >= 7 ? "strongReactionReadiness" : reactionReadiness < 4 ? "developingReaction" : "competitiveReactionReadiness",
      decisionReadiness >= 7 ? "strongDecisionReadiness" : decisionReadiness < 4 ? "developingDecisionReadiness" : "competitiveDecisionReadiness",
      experienceReadiness >= 7 ? "strongPositionExperience" : experienceReadiness < 4 ? "limitedPositionExperience" : "developingPositionExperience",
      positionFit >= 7 ? "strongPositionFit" : positionFit < 4 ? "limitedPositionFit" : "developingPositionFit",
      legality.fallbackApplied ? `legalPositionFallback:${legality.assigned}` : legality.legal ? "positionLegal" : "positionIllegal"
    ];
    const playerId = String(input.playerId || subject.name || "player");
    const inputVersion = String(subject.capabilityState?.settlementVersion || subject.capabilityState?.initialSkillFormulaVersion || input.inputVersion || "provisional-capability");
    const identitySource = [READINESS_VERSION, playerId, requestedPosition, legality.assigned, positionReadiness,
      positionFit, fieldingReadiness, reactionReadiness, decisionReadiness, experienceReadiness, inputVersion].join("|");
    return deepFreeze({
      version: READINESS_VERSION,
      playerId,
      position: legality.assigned,
      requestedPosition,
      sourceType: "system-derived-provisional",
      sourceVersion: READINESS_VERSION,
      readinessBand,
      positionReadiness,
      positionFit,
      fieldingReadiness,
      reactionReadiness,
      decisionReadiness,
      experienceReadiness,
      confidence: "provisional",
      positionLegal: legality.legal,
      positionFallbackApplied: legality.fallbackApplied,
      assignmentSource: legality.assignmentSource,
      assignmentReason: legality.assignmentReason,
      pitcherExposureDeferred: legality.pitcherExposureDeferred,
      reasons,
      provenance: {
        snapshotId: `readiness-${stableHash(identitySource).toString(16).padStart(8, "0")}`,
        sourceType: "system-derived-provisional",
        sourceVersion: READINESS_VERSION,
        inputVersion,
        deterministicIdentity: identitySource
      }
    });
  }

  function deriveCoachModifier(style, actualRole, positionCapability) {
    if (style === "conservative") return actualRole === "starter" ? 2 : -3;
    if (style === "developmental") return actualRole === "starter" ? -1 : 4;
    if (style === "performanceFirst") return positionCapability >= 6 ? 3 : -4;
    return 0;
  }

  function deriveGameContextModifier(gameContext = {}) {
    const leverage = gameContext.leverage || "normal";
    const importance = gameContext.importance || "regular";
    const margin = Math.abs(Number(gameContext.scoreMargin) || 0);
    let modifier = importance === "mustWin" ? -2 : importance === "development" ? 3 : 0;
    if (leverage === "low" || margin >= 4) modifier += 2;
    if (leverage === "high" && margin <= 1) modifier -= 1;
    return modifier;
  }

  function resolvePlannedAppearance(score, role, coachStyle, hash) {
    if (score >= 55) return { appearanceType: "start", entryInning: 1, entryHalf: "上" };
    if (score < 36) return { appearanceType: "noAppearance", entryInning: null, entryHalf: "" };
    const entryInning = role === "rotation" ? 5 : 5 + (hash % 2);
    const appearanceSelector = hash % 10;
    const appearanceType = coachStyle === "developmental" || appearanceSelector <= 3
      ? "defensiveSubstitution"
      : appearanceSelector <= 6 ? "pinchHit" : "lateGameAppearance";
    return { appearanceType, entryInning, entryHalf: "下" };
  }

  function resolveStartingOpportunity(input = {}) {
    const readiness = input.readinessSnapshot;
    if (!readiness || readiness.version !== READINESS_VERSION) {
      throw new Error("Playing-Time Opportunity requires a valid Opportunity Readiness Snapshot.");
    }
    const matchId = String(input.matchId || "match");
    const playerId = String(readiness.playerId || "player");
    const actualRole = normalizeActualRole(input.actualRole);
    const coachUsageStyle = normalizeCoachUsageStyle(input.coachUsageStyle || input.coachStyle);
    const positionCapability = clamp(readiness.positionReadiness, 0, 10, 5);
    const positionFit = clamp(readiness.positionFit, 0, 10, 5);
    const positionExperience = clamp(readiness.experienceReadiness, 0, 10, 5);
    const position = {
      requested: normalizePosition(readiness.requestedPosition),
      assigned: normalizePosition(readiness.position),
      legal: readiness.positionLegal === true,
      pitcherExposureDeferred: readiness.pitcherExposureDeferred === true,
      fallbackApplied: readiness.positionFallbackApplied === true
    };
    const directStartForced = input.directStartForced === true;
    const gameContext = input.gameContext || {};
    const previousActualExposure = input.previousActualExposure ? {
      appearanceType: input.previousActualExposure.appearanceType || "noAppearance",
      plateAppearances: Math.max(0, Number(input.previousActualExposure.plateAppearances) || 0),
      defensiveInnings: Math.max(0, Number(input.previousActualExposure.defensiveInnings) || 0)
    } : null;
    const evaluationTrend = clamp(input.evaluationTrend, -4, 4, 0);
    const decisionIdentityParts = [OPPORTUNITY_VERSION, matchId, playerId, input.opportunitySeed || "", actualRole,
      input.projectedRole || "", input.playingTimeEnvironment || "medium", input.competitionDepth || "medium",
      input.positionNeed || "medium", coachUsageStyle, position.assigned, positionCapability, positionFit, positionExperience,
      gameContext.gameType || "game", gameContext.inning || 0, gameContext.scoreMargin || 0,
      gameContext.expectedGameImportance || gameContext.importance || "regular", gameContext.leverage || "normal"];
    if (input.evaluationTrend !== undefined) decisionIdentityParts.push(evaluationTrend);
    if (previousActualExposure) decisionIdentityParts.push([previousActualExposure.appearanceType, previousActualExposure.plateAppearances, previousActualExposure.defensiveInnings].join(":"));
    const decisionIdentity = decisionIdentityParts.join("|");
    const opportunityHash = stableHash(decisionIdentity);
    const hashVariation = (opportunityHash % 31) - 15;
    const scoreBreakdown = {
      actualRole: ROLE_BASE[actualRole],
      positionCapability: Math.round((positionCapability - 5) * 4),
      positionFit: Math.round((positionFit - 5) * 2),
      positionExperience: Math.round((positionExperience - 5) * 1.5),
      schoolEnvironment: ENVIRONMENT_MODIFIER[input.playingTimeEnvironment] ?? ENVIRONMENT_MODIFIER.medium,
      competitionDepth: COMPETITION_MODIFIER[input.competitionDepth] ?? COMPETITION_MODIFIER.medium,
      positionNeed: POSITION_NEED_MODIFIER[input.positionNeed] ?? POSITION_NEED_MODIFIER.medium,
      projectedRolePrior: PROJECTED_ROLE_PRIOR[input.projectedRole] ?? 0,
      coachUsage: deriveCoachModifier(coachUsageStyle, actualRole, positionCapability),
      gameContext: deriveGameContextModifier(gameContext),
      deterministicVariation: hashVariation
    };
    if (input.evaluationTrend !== undefined) scoreBreakdown.evaluationTrend = Math.round(evaluationTrend);
    const opportunityScore = Object.values(scoreBreakdown).reduce((sum, value) => sum + Number(value || 0), 0);
    let plannedUsage = resolvePlannedAppearance(opportunityScore, actualRole, coachUsageStyle, opportunityHash);
    let exposureSource = "opportunity-resolver";
    if (directStartForced && !position.pitcherExposureDeferred) {
      plannedUsage = { appearanceType: "start", entryInning: 1, entryHalf: "上" };
      exposureSource = "direct-start-forced";
    }
    if (position.pitcherExposureDeferred || !position.legal) plannedUsage = { appearanceType: "noAppearance", entryInning: null, entryHalf: "" };
    const reasons = [
      `actual-role:${actualRole}`,
      `school-environment:${input.playingTimeEnvironment || "medium"}`,
      `competition-depth:${input.competitionDepth || "medium"}`,
      `position-need:${input.positionNeed || "medium"}`,
      `coach-usage:${coachUsageStyle}`,
      position.fallbackApplied ? `legal-position-fallback:${position.assigned}` : "position-legal"
    ];
    if (position.pitcherExposureDeferred) reasons.push("pitcher-exposure-deferred");
    if (!position.legal) reasons.push("position-illegal");
    const startingOpportunity = plannedUsage.appearanceType === "start" ? "start" : actualRole === "rotation" ? "rotationCandidate" : "bench";
    return deepFreeze({
      version: OPPORTUNITY_VERSION,
      sourceVersion: OPPORTUNITY_VERSION,
      decisionId: `${matchId}|${playerId}|${opportunityHash.toString(16).padStart(8, "0")}`,
      matchId,
      playerId,
      exposureSource,
      actualRole,
      actualRoleAtDecision: actualRole,
      projectedRolePrior: input.projectedRole || "",
      playingTimeEnvironment: input.playingTimeEnvironment || "medium",
      schoolPlayingTimeEnvironment: input.playingTimeEnvironment || "medium",
      competitionDepth: input.competitionDepth || "medium",
      positionCompetition: input.competitionDepth || "medium",
      positionNeed: input.positionNeed || "medium",
      evaluationTrend,
      previousActualExposure,
      coachUsageStyle,
      positionCapability,
      positionFit,
      positionExperience,
      assignedPosition: position.assigned,
      requestedPosition: position.requested,
      positionFallbackApplied: position.fallbackApplied,
      assignmentSource: readiness.assignmentSource || (position.fallbackApplied ? "position-fallback" : "requested-position"),
      assignmentReason: readiness.assignmentReason || (position.fallbackApplied ? `legal-position-fallback:${position.assigned}` : "specific-position-request"),
      pitcherExposureDeferred: position.pitcherExposureDeferred,
      startingOpportunity,
      startingDecision: startingOpportunity,
      appearancePlan: plannedUsage,
      substitutionOpportunity: plannedUsage.appearanceType === "start" ? "none" : plannedUsage.appearanceType,
      opportunityReasons: reasons,
      opportunitySeed: decisionIdentity,
      gameContext: clone(gameContext),
      readinessSnapshot: clone(readiness),
      plannedUsage,
      debug: { opportunityHash, opportunityScore, scoreBreakdown, reasons }
    });
  }

  function createGameExposureState(opportunity = {}) {
    const planned = APPEARANCE_TYPES.includes(opportunity?.plannedUsage?.appearanceType)
      ? clone(opportunity.plannedUsage)
      : { appearanceType: "noAppearance", entryInning: null, entryHalf: "" };
    return {
      version: EXPOSURE_VERSION,
      matchId: String(opportunity.matchId || ""),
      opportunitySnapshot: clone(opportunity),
      plannedUsage: planned,
      actualUsage: { appearanceType: "noAppearance", defensiveInnings: 0, plateAppearances: 0 },
      entryInning: null,
      exitInning: null,
      defensiveInnings: 0,
      plateAppearances: 0,
      appearanceType: "noAppearance",
      exposureSource: opportunity.exposureSource || "opportunity-resolver",
      pitcherExposureDeferred: opportunity.pitcherExposureDeferred === true,
      finalized: false,
      finalizationId: ""
    };
  }

  function normalizeGameExposureState(saved, matchId = "") {
    if (!saved || typeof saved !== "object") return null;
    const state = Object.assign(createGameExposureState(saved.opportunitySnapshot || saved.opportunity || { matchId }), clone(saved));
    state.version = EXPOSURE_VERSION;
    state.matchId = String(saved.matchId || matchId || "");
    state.opportunitySnapshot = clone(saved.opportunitySnapshot || saved.opportunity || state.opportunitySnapshot);
    delete state.opportunity;
    state.plannedUsage = clone(saved.plannedUsage || state.plannedUsage);
    state.actualUsage = clone(saved.actualUsage || state.actualUsage);
    state.entryInning = saved.entryInning === null || saved.entryInning === undefined ? null : Math.max(1, Math.floor(Number(saved.entryInning) || 1));
    state.exitInning = saved.exitInning === null || saved.exitInning === undefined ? null : Math.max(1, Math.floor(Number(saved.exitInning) || 1));
    state.defensiveInnings = Math.max(0, Math.floor(Number(saved.defensiveInnings) || 0));
    state.plateAppearances = Math.max(0, Math.floor(Number(saved.plateAppearances) || 0));
    state.appearanceType = APPEARANCE_TYPES.includes(saved.appearanceType) ? saved.appearanceType : "noAppearance";
    state.finalized = saved.finalized === true;
    state.finalizationId = typeof saved.finalizationId === "string" ? saved.finalizationId : "";
    return state;
  }

  function finalizeGameExposure(saved, matchTruth = {}) {
    const state = normalizeGameExposureState(saved, matchTruth.matchId);
    if (!state) return deepFreeze({ ok: false, status: "rejected", errors: ["game-exposure-state-required"] });
    if (state.finalized) return deepFreeze({ ok: true, status: "duplicate", duplicate: true, state: clone(state) });
    const defensiveInnings = Math.max(0, Math.floor(Number(matchTruth.defensiveInnings) || 0));
    const plateAppearances = Math.max(0, Math.floor(Number(matchTruth.plateAppearances) || 0));
    const participated = defensiveInnings > 0 || plateAppearances > 0 || matchTruth.participated === true;
    let appearanceType = APPEARANCE_TYPES.includes(matchTruth.appearanceType) ? matchTruth.appearanceType : "noAppearance";
    if (!participated) appearanceType = "noAppearance";
    else if (matchTruth.started === true) appearanceType = "start";
    else if (plateAppearances > 0 && defensiveInnings === 0) appearanceType = "pinchHit";
    else if (defensiveInnings > 0 && plateAppearances === 0) appearanceType = "defensiveSubstitution";
    else if (appearanceType === "noAppearance") appearanceType = "lateGameAppearance";
    state.actualUsage = { appearanceType, defensiveInnings, plateAppearances };
    state.entryInning = participated ? Math.max(1, Math.floor(Number(matchTruth.entryInning) || 1)) : null;
    state.exitInning = participated && matchTruth.exitInning !== null && matchTruth.exitInning !== undefined
      ? Math.max(state.entryInning, Math.floor(Number(matchTruth.exitInning) || state.entryInning)) : null;
    state.defensiveInnings = defensiveInnings;
    state.plateAppearances = plateAppearances;
    state.appearanceType = appearanceType;
    state.finalized = true;
    state.finalizationId = `${state.matchId || "match"}|player|${EXPOSURE_VERSION}`;
    return deepFreeze({ ok: true, status: "finalized", duplicate: false, state: clone(state) });
  }

  function getDebugSnapshot(state) {
    const normalized = normalizeGameExposureState(state, state?.matchId || "");
    return normalized ? deepFreeze(clone(normalized)) : null;
  }

  return deepFreeze({
    OPPORTUNITY_VERSION,
    READINESS_VERSION,
    EXPOSURE_VERSION,
    COACH_STYLE_MAP,
    ACTUAL_ROLES,
    APPEARANCE_TYPES,
    stableHash,
    normalizeCoachUsageStyle,
    isPositionLegalForThrowingHand,
    resolveLegalPosition,
    createOpportunityReadinessSnapshot,
    resolveStartingOpportunity,
    createGameExposureState,
    normalizeGameExposureState,
    finalizeGameExposure,
    getDebugSnapshot
  });
});
