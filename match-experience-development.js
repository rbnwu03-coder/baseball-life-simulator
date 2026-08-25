const MatchExperienceDevelopment = (() => {
  "use strict";

  const VERSION = "match-experience-development-v1";
  const SETTLEMENT_VERSION = "match-experience-settlement-v1";
  const MAX_CONTEXTS_PER_MATCH = 3;
  const MAX_EVIDENCE_RECORDS = 80;
  const DEFENSIVE_INNING_MARGINALS = Object.freeze([2.4, 1.9, 1.5, 1.2, 0.9, 0.7, 0.5]);
  const PLATE_APPEARANCE_MARGINALS = Object.freeze([2.2, 1.7, 1.25, 0.9]);
  const NOVELTY_MODIFIERS = Object.freeze([1, 0.72, 0.52, 0.40, 0.32, 0.27, 0.23]);
  const SKILL_ORDER = Object.freeze(["baseballIQ", "reaction", "range", "catching", "throwing", "batting"]);
  const ACTIVITY_BY_SKILL = Object.freeze({
    baseballIQ: "decision",
    reaction: "recognition",
    range: "physical",
    catching: "technical",
    throwing: "technical",
    batting: "technical"
  });
  const DIFFICULTY_MODIFIERS = Object.freeze({ easy: 0.86, appropriate: 1, challenging: 1.12, overmatched: 0.78 });
  const DECISION_VALUES = Object.freeze({ strong: 2.20, acceptable: 1.75, questionable: 1.30, poor: 0.85, none: 0.90 });
  const EXECUTION_VALUES = Object.freeze({ strong: 2.15, normal: 1.75, weak: 1.30, failed: 1.10, notApplicable: 0.70 });
  let enabled = true;

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function round(value, digits = 3) {
    const scale = 10 ** digits;
    return Math.round((Number(value) || 0) * scale) / scale;
  }

  function getDiminishingExposureValue(quantity, marginals) {
    const count = Math.max(0, Math.floor(Number(quantity) || 0));
    let total = 0;
    for (let index = 0; index < count; index += 1) {
      total += index < marginals.length ? marginals[index] : Math.max(0.12, marginals.at(-1) / Math.sqrt(index - marginals.length + 2));
    }
    return round(total);
  }

  function getDefensiveInningsExposureValue(innings) {
    return getDiminishingExposureValue(innings, DEFENSIVE_INNING_MARGINALS);
  }

  function getPlateAppearanceExposureValue(plateAppearances) {
    return getDiminishingExposureValue(plateAppearances, PLATE_APPEARANCE_MARGINALS);
  }

  function normalizeDecisionQuality(value) {
    if (["strong", "acceptable", "questionable", "poor", "none"].includes(value)) return value;
    if (value === "poorFit") return "poor";
    if (["reasonable", "routine", "conservative", "contextual", "aggressive"].includes(value)) return "acceptable";
    return "none";
  }

  function normalizeExecutionQuality(value) {
    if (["strong", "normal", "weak", "failed", "notApplicable"].includes(value)) return value;
    if (["complete", "completed", "clean", "good"].includes(value)) return "strong";
    if (["partial", "controlled", "adjusted", "recovered"].includes(value)) return "normal";
    if (["late", "delayed", "slightlyOffLine", "notCompleted"].includes(value)) return "weak";
    if (["misplay", "error", "failure"].includes(value)) return "failed";
    return "notApplicable";
  }

  function getExperienceQuality(value) {
    const score = Number(value) || 0;
    if (score >= 6) return "highValue";
    if (score >= 3.5) return "valuable";
    if (score >= 1.5) return "normal";
    return "low";
  }

  function getDevelopmentQuality(experienceQuality) {
    return { low: "limited", normal: "standard", valuable: "good", highValue: "elite" }[experienceQuality] || "limited";
  }

  function derivePressure(situation = {}) {
    const inning = Math.max(1, Number(situation.inning) || 1);
    const regulationInnings = Math.max(1, Number(situation.regulationInnings) || 7);
    const scoreMargin = Number.isFinite(Number(situation.scoreMargin)) ? Math.abs(Number(situation.scoreMargin)) : 4;
    const runners = Array.isArray(situation.runners) ? situation.runners.filter(Boolean).length : Number(situation.runnerCount) || 0;
    const outs = Math.max(0, Number(situation.outs) || 0);
    const reasons = [];
    if (inning >= regulationInnings - 1) reasons.push("lateGame");
    if (scoreMargin <= 1) reasons.push("closeScore");
    if (runners >= 2) reasons.push("traffic");
    if (outs === 2) reasons.push("twoOuts");
    const band = reasons.length >= 2 ? "high" : reasons.length ? "normal" : "low";
    return { band, modifier: band === "high" ? 1.05 : band === "normal" ? 1.02 : 1, reasons };
  }

  function deriveDifficulty(source = {}) {
    if (["easy", "appropriate", "challenging", "overmatched"].includes(source.difficulty)) return source.difficulty;
    if (source.routeWindow === "expired") return "overmatched";
    if (source.meaningful || source.ballDepth === "deep" || source.decisionTension === "high") return "challenging";
    if (source.ballDirection === "straightAtPlayer" && source.decisionTension === "none") return "easy";
    return "appropriate";
  }

  function createEvidenceRecord(input = {}) {
    const targetSkill = input.targetSkill || input.skillEvidence?.targetSkill || "";
    const difficulty = deriveDifficulty(input);
    const pressure = input.pressure?.band ? clone(input.pressure) : derivePressure(input.situation || {});
    const decisionQuality = normalizeDecisionQuality(input.decisionQuality ?? input.decisionEvidence?.quality);
    const executionQuality = normalizeExecutionQuality(input.executionQuality ?? input.executionEvidence?.quality);
    const nestedComponent = input.skillEvidence?.component;
    const component = input.component === "decision" ? "decision"
      : input.component === "execution" ? "execution"
        : nestedComponent === "decision" ? "decision"
          : nestedComponent === "execution" ? "execution" : "exposure";
    const nestedBaseValue = Number(input.skillEvidence?.baseValue);
    const baseValue = Number.isFinite(Number(input.baseValue)) ? Math.max(0, Number(input.baseValue))
      : Number.isFinite(nestedBaseValue) ? Math.max(0, nestedBaseValue)
      : component === "decision" ? DECISION_VALUES[decisionQuality]
        : component === "execution" ? EXECUTION_VALUES[executionQuality] : 0;
    const playFamily = input.playFamily || input.situation?.playFamily || "matchExposure";
    const role = input.role || "participant";
    const semanticKey = input.semanticKey || [targetSkill, role, playFamily, difficulty, component === "decision" ? decisionQuality : component].join("|");
    return {
      evidenceId: String(input.evidenceId || ""),
      matchId: String(input.matchId || ""),
      playId: String(input.playId || ""),
      playerId: String(input.playerId || "player"),
      evidenceType: input.evidenceType === "exposure" ? "exposure" : "active",
      activeType: input.evidenceType === "exposure" ? "none" : input.activeType || (component === "decision" ? "decision" : "execution"),
      participationType: input.participationType || "batter",
      role,
      situation: clone(input.situation || {}),
      decisionEvidence: {
        quality: decisionQuality,
        opportunity: input.decisionEvidence?.opportunity === true || component === "decision",
        reasons: Array.isArray(input.decisionEvidence?.reasons) ? input.decisionEvidence.reasons.slice() : []
      },
      executionEvidence: {
        quality: executionQuality,
        stages: clone(input.executionEvidence?.stages || {}),
        feedback: input.executionEvidence?.feedback || ""
      },
      outcomeEvidence: clone(input.outcomeEvidence || { result: "none" }),
      difficulty,
      novelty: { semanticKey, occurrence: 1, modifier: 1 },
      pressure,
      experienceQuality: getExperienceQuality(baseValue),
      skillEvidence: {
        targetSkill,
        component,
        relevance: input.skillEvidence?.relevance || "direct",
        baseValue: round(baseValue),
        adjustedValue: round(baseValue)
      },
      attribution: {
        primaryCause: input.attribution?.primaryCause || "",
        secondaryCause: input.attribution?.secondaryCause || "",
        responsibleActor: input.attribution?.responsibleActor || "",
        playerResponsibility: input.attribution?.playerResponsibility || "",
        teammateResponsibility: input.attribution?.teammateResponsibility || ""
      },
      sourceSnapshot: clone(input.sourceSnapshot || {})
    };
  }

  function createExposureEvidence(input = {}) {
    const matchId = input.matchId || "match";
    const playerId = input.playerId || "player";
    const role = input.role || "participant";
    const defensiveInnings = Math.max(0, Math.floor(Number(input.defensiveInnings) || 0));
    const plateAppearances = Math.max(0, Math.floor(Number(input.plateAppearances) || 0));
    const defensiveValue = getDefensiveInningsExposureValue(defensiveInnings);
    const plateAppearanceValue = getPlateAppearanceExposureValue(plateAppearances);
    const evidence = [];
    if (defensiveInnings > 0) {
      evidence.push(createEvidenceRecord({
        evidenceId: `${matchId}|exposure|defense`, matchId, playId: "defensive-innings", playerId,
        evidenceType: "exposure", participationType: "cover", role,
        targetSkill: "baseballIQ", baseValue: defensiveValue * 0.55,
        situation: { playFamily: "defensiveInningsExposure", defensiveInnings },
        semanticKey: "baseballIQ|defensive-exposure|innings", sourceSnapshot: { defensiveInnings }
      }));
    }
    if (plateAppearances > 0) {
      evidence.push(createEvidenceRecord({
        evidenceId: `${matchId}|exposure|pa|batting`, matchId, playId: "plate-appearances", playerId,
        evidenceType: "exposure", participationType: "batter", role,
        targetSkill: "batting", baseValue: plateAppearanceValue * 0.42,
        situation: { playFamily: "plateAppearanceExposure", plateAppearances },
        semanticKey: "batting|offensive-exposure|pa", sourceSnapshot: { plateAppearances }
      }));
      evidence.push(createEvidenceRecord({
        evidenceId: `${matchId}|exposure|pa|iq`, matchId, playId: "plate-appearances", playerId,
        evidenceType: "exposure", participationType: "batter", role,
        targetSkill: "baseballIQ", baseValue: plateAppearanceValue * 0.28,
        situation: { playFamily: "plateAppearanceExposure", plateAppearances },
        semanticKey: "baseballIQ|offensive-exposure|pa", sourceSnapshot: { plateAppearances }
      }));
    }
    return evidence;
  }

  function getStageQuality(stages = {}, keys = [], fallback = "notApplicable") {
    for (const key of keys) {
      if (stages[key] !== undefined && stages[key] !== "") return normalizeExecutionQuality(stages[key]);
    }
    return normalizeExecutionQuality(fallback);
  }

  function normalizeParticipationType(role) {
    if (["initiator", "pivot", "receiver", "cover"].includes(role)) return role;
    if (role === "coverPivot") return "pivot";
    return "primaryFielder";
  }

  function buildSituation(source = {}, match = {}) {
    const scores = source.scores || source.before?.scores || {};
    return {
      inning: Math.max(1, Number(source.inning) || 1),
      half: source.half || "",
      outs: Math.max(0, Number(source.outs ?? source.before?.outs) || 0),
      runners: (source.runners || source.before?.runners || []).slice?.(0, 3) || [],
      scoreMargin: (Number(scores.home) || 0) - (Number(scores.away) || 0),
      regulationInnings: Math.max(1, Number(match.regulationInnings) || 7),
      playFamily: source.playFamily || source.familyId || source.positionDecisionFamily || "matchPlay",
      ballContext: source.ballContext || "",
      ballDirection: source.ballDirection || "",
      ballDepth: source.ballDepth || "",
      route: source.route || source.activeRoute || "",
      decisionTension: source.decisionTension || (source.domain === "defense" ? "meaningful" : "none")
    };
  }

  function createDefensiveEvidence(match, source, index) {
    const position = source.playerPosition || match.developmentPositionOverride || match.playerFieldingAssignment || match.currentFieldingPosition || "";
    if (position !== "二壘手") return [];
    const rawRole = source.playerRole || "primaryFielder";
    const participationType = normalizeParticipationType(rawRole);
    const meaningful = source.domain === "defense" || source.eventClassification === "playerMeaningfulDecision";
    const decisionQuality = meaningful ? normalizeDecisionQuality(source.decisionQuality) : "none";
    const overallExecution = normalizeExecutionQuality(source.executionQuality);
    const stages = source.playerLeg || source.executionEvidence?.stages || {};
    const situation = buildSituation({ ...source, meaningful, playFamily: meaningful ? "secondBaseMeaningful" : "secondBaseRoutine" }, match);
    const playId = source.id || source.playId || `defense-${index + 1}`;
    const common = {
      matchId: match.id, playId, playerId: "player", evidenceType: "active", participationType, role: rawRole,
      situation, meaningful, decisionQuality, decisionEvidence: { opportunity: meaningful, reasons: meaningful ? ["canonicalMeaningfulDecision"] : ["routineResponsibility"] },
      outcomeEvidence: { result: source.resultCode || source.result || "", outsCreated: Number(source.outsCreated) || 0, error: source.error === true, runsAllowed: Number(source.runsAllowed) || 0 },
      attribution: {
        primaryCause: source.primaryCause || "", secondaryCause: source.secondaryCause || "", responsibleActor: source.responsibleActor || "",
        playerResponsibility: source.playerResponsibility || "", teammateResponsibility: source.teammateResponsibility || ""
      },
      sourceSnapshot: { type: source.type || "completedMoment", sequence: source.sequence ?? null, momentId: source.id || "", route: source.route || source.activeRoute || "" }
    };
    const specs = [];
    specs.push(["reaction", "execution", getStageQuality(stages, ["reach", "coverage"], overallExecution)]);
    if (participationType !== "cover" || stages.receive || stages.control || stages.force) {
      specs.push(["catching", "execution", getStageQuality(stages, ["control", "receive", "force"], overallExecution)]);
    }
    if (["initiator", "pivot", "primaryFielder"].includes(participationType) || stages.firstThrow || stages.secondThrow || stages.transfer) {
      specs.push(["throwing", "execution", getStageQuality(stages, ["firstThrow", "secondThrow", "transfer", "fallbackRelease"], overallExecution)]);
    }
    if (["leftSide", "rightSide", "upTheMiddle", "towardHole"].includes(source.ballDirection) || source.ballDepth === "deep" || ["pivot", "cover"].includes(participationType)) {
      specs.push(["range", "execution", getStageQuality(stages, ["reach", "coverage"], overallExecution)]);
    }
    if (meaningful || ["pivot", "cover"].includes(participationType)) {
      specs.push(["baseballIQ", "decision", "notApplicable"]);
    }
    return specs.map(([targetSkill, component, executionQuality], specIndex) => createEvidenceRecord({
      ...common,
      evidenceId: `${match.id}|${playId}|${targetSkill}|${specIndex + 1}`,
      targetSkill,
      component,
      activeType: component,
      executionQuality,
      executionEvidence: { quality: executionQuality, stages, feedback: source.primaryCause || source.executionStage || "" },
      playFamily: situation.playFamily,
      ballDepth: source.ballDepth,
      ballDirection: source.ballDirection,
      difficulty: deriveDifficulty({ ...source, meaningful })
    }));
  }

  function createBatterEvidence(match, source, index) {
    const decisionQuality = normalizeDecisionQuality(source.decisionQuality || (source.decision ? "acceptable" : "none"));
    const executionQuality = normalizeExecutionQuality(source.executionQuality || (source.tier === "strong" ? "strong" : source.tier === "mixed" ? "normal" : "weak"));
    const situation = buildSituation({ ...source, meaningful: true, playFamily: "meaningfulPlateAppearance" }, match);
    const playId = source.id || `offense-${index + 1}`;
    const common = {
      matchId: match.id, playId, playerId: "player", evidenceType: "active", participationType: "batter", role: "batter",
      situation, meaningful: true, decisionQuality, executionQuality,
      decisionEvidence: { opportunity: true, reasons: [source.objective || source.approach || "canonicalPlayerDecision"] },
      executionEvidence: { quality: executionQuality, stages: { contact: executionQuality }, feedback: source.primaryCause || "" },
      outcomeEvidence: { result: source.resultCode || "", objectiveSucceeded: source.objectiveSucceeded === true, runsCreated: Number(source.baseballMeaning?.runsScored) || 0 },
      attribution: { primaryCause: source.primaryCause || "", secondaryCause: source.secondaryCause || "", responsibleActor: source.responsibleActor || "player" },
      sourceSnapshot: { type: "completedMoment", momentId: source.id || "", decision: source.decision || "", approach: source.approach || "" },
      difficulty: deriveDifficulty({ ...source, meaningful: true })
    };
    return [
      createEvidenceRecord({ ...common, evidenceId: `${match.id}|${playId}|batting`, targetSkill: "batting", component: "execution", activeType: "execution" }),
      createEvidenceRecord({ ...common, evidenceId: `${match.id}|${playId}|baseballIQ`, targetSkill: "baseballIQ", component: "decision", activeType: "decision" })
    ];
  }

  function derivePlayerExposure(match) {
    const log = Array.isArray(match?.simulationLog) ? match.simulationLog : [];
    const status = match?.playerLineupStatus;
    const entryEvent = log.find(event => event.type === "playerEntry") || null;
    const participated = status === "starter" || (status === "substitute" && (match.playerEntryCompleted || entryEvent));
    if (!participated) return { defensiveInnings: 0, plateAppearances: 0, role: status || "bench", entrySequence: null };
    const entrySequence = status === "starter" ? -1 : Number(entryEvent?.sequence) || 0;
    const defensiveInnings = new Set(log.filter(event => event.type === "halfInningEnd" && event.half === "上" && Number(event.sequence) >= entrySequence).map(event => Number(event.inning) || 0).filter(Boolean)).size;
    const plateAppearances = log.filter(event => event.type === "plateAppearance" && event.batterId === "player" && Number(event.sequence) >= entrySequence).length;
    return { defensiveInnings, plateAppearances, role: status, entrySequence };
  }

  function applyNoveltyDiminishing(evidence = []) {
    const occurrences = new Map();
    return evidence.map(item => {
      const record = clone(item);
      const key = record.novelty?.semanticKey || `${record.skillEvidence?.targetSkill}|unknown`;
      const occurrence = (occurrences.get(key) || 0) + 1;
      occurrences.set(key, occurrence);
      const modifier = record.evidenceType === "exposure" ? 1
        : NOVELTY_MODIFIERS[Math.min(NOVELTY_MODIFIERS.length - 1, occurrence - 1)];
      const difficultyModifier = DIFFICULTY_MODIFIERS[record.difficulty] || 1;
      const pressureModifier = Math.max(1, Math.min(1.06, Number(record.pressure?.modifier) || 1));
      const adjustedValue = Math.max(0, Number(record.skillEvidence?.baseValue) || 0) * modifier * difficultyModifier * pressureModifier;
      record.novelty = { semanticKey: key, occurrence, modifier };
      record.skillEvidence.adjustedValue = round(adjustedValue);
      record.experienceQuality = getExperienceQuality(adjustedValue);
      return record;
    });
  }

  function deriveMatchExperienceEvidence(match, options = {}) {
    const exposure = options.exposure || derivePlayerExposure(match);
    const evidence = createExposureEvidence({ matchId: match?.id || "match", playerId: "player", role: exposure.role, ...exposure });
    if (Array.isArray(options.activeEvidence)) evidence.push(...options.activeEvidence.map(item => createEvidenceRecord(item)));
    else {
      (match?.simulationLog || []).filter(event => event.type === "playerRoutinePlay").forEach((event, index) => evidence.push(...createDefensiveEvidence(match, event, index)));
      (match?.completedMoments || []).filter(moment => moment.domain === "defense").forEach((moment, index) => evidence.push(...createDefensiveEvidence(match, moment, index + 20)));
      (match?.completedMoments || []).filter(moment => moment.domain === "offense").forEach((moment, index) => evidence.push(...createBatterEvidence(match, moment, index)));
    }
    return deepFreeze(applyNoveltyDiminishing(evidence).map(record => deepFreeze(record)));
  }

  function aggregateMatchExperience(evidence = []) {
    const groups = new Map();
    evidence.forEach(record => {
      const skill = record.skillEvidence?.targetSkill;
      if (!SKILL_ORDER.includes(skill)) return;
      if (!groups.has(skill)) groups.set(skill, {
        targetSkill: skill, evidenceCount: 0, activeEvidenceCount: 0, exposureEvidenceCount: 0,
        activeValue: 0, exposureValue: 0, totalValue: 0, noveltyGroups: new Set(), difficulties: new Map(), reasons: new Set()
      });
      const group = groups.get(skill);
      const value = Math.max(0, Number(record.skillEvidence.adjustedValue) || 0);
      group.evidenceCount += 1;
      group.totalValue += value;
      if (record.evidenceType === "active") { group.activeEvidenceCount += 1; group.activeValue += value; }
      else { group.exposureEvidenceCount += 1; group.exposureValue += value; }
      group.noveltyGroups.add(record.novelty.semanticKey);
      group.difficulties.set(record.difficulty, (group.difficulties.get(record.difficulty) || 0) + value);
      (record.decisionEvidence?.reasons || []).forEach(reason => group.reasons.add(reason));
      if (record.attribution?.responsibleActor === "teammate") group.reasons.add("teammateAttributionPreserved");
      if (["weak", "failed"].includes(record.executionEvidence?.quality)) group.reasons.add("correctiveExecutionFeedback");
    });
    return deepFreeze([...groups.values()].map(group => {
      const difficulty = [...group.difficulties.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || "appropriate";
      const experienceQuality = getExperienceQuality(group.totalValue);
      return deepFreeze({
        targetSkill: group.targetSkill,
        evidenceCount: group.evidenceCount,
        activeEvidenceCount: group.activeEvidenceCount,
        exposureEvidenceCount: group.exposureEvidenceCount,
        activeValue: round(group.activeValue),
        exposureValue: round(group.exposureValue),
        totalValue: round(group.totalValue),
        noveltyGroupCount: group.noveltyGroups.size,
        difficulty,
        experienceQuality,
        developmentQuality: getDevelopmentQuality(experienceQuality),
        reasons: [...group.reasons]
      });
    }).sort((left, right) => right.totalValue - left.totalValue
      || right.activeValue - left.activeValue
      || SKILL_ORDER.indexOf(left.targetSkill) - SKILL_ORDER.indexOf(right.targetSkill)));
  }

  function selectDevelopmentContexts(aggregated = [], match = {}, playerId = "player") {
    const matchIdentity = `${match.id || "match"}|${Math.max(0, Number(match.simulationSeed) || 0)}|${playerId}|${VERSION}`;
    return deepFreeze(aggregated.filter(item => item.totalValue >= 0.5).slice(0, MAX_CONTEXTS_PER_MATCH).map(item => deepFreeze({
      sourceType: "gameExperience",
      sourceId: `${matchIdentity}|${item.targetSkill}`,
      settlementId: `${matchIdentity}|${item.targetSkill}`,
      targetSkill: item.targetSkill,
      activityType: ACTIVITY_BY_SKILL[item.targetSkill],
      difficulty: item.difficulty,
      quality: item.developmentQuality,
      playerChoice: `match-experience:${item.targetSkill}`,
      developmentBias: "ideal-self",
      metadata: {
        matchExperienceVersion: VERSION,
        settlementVersion: SETTLEMENT_VERSION,
        matchExperienceSettlementId: matchIdentity,
        evidenceCount: item.evidenceCount,
        activeEvidenceCount: item.activeEvidenceCount,
        exposureEvidenceCount: item.exposureEvidenceCount,
        experienceValue: item.totalValue,
        noveltyGroupCount: item.noveltyGroupCount,
        experienceQuality: item.experienceQuality,
        reasons: item.reasons.slice()
      }
    })));
  }

  function createMatchExperienceState(match = {}) {
    return {
      version: VERSION,
      settlementVersion: SETTLEMENT_VERSION,
      finalized: false,
      settled: false,
      matchExperienceSettlementId: "",
      exposure: { defensiveInnings: 0, plateAppearances: 0, defensiveExposureValue: 0, plateAppearanceExposureValue: 0 },
      evidence: [],
      evidenceSummary: { total: 0, exposure: 0, active: 0, noveltyGroups: 0 },
      aggregated: [],
      selectedContexts: [],
      developmentSettlementIds: [],
      developmentResults: [],
      errors: [],
      matchId: match.id || "",
      simulationSeed: Math.max(0, Number(match.simulationSeed) || 0)
    };
  }

  function normalizeMatchExperienceState(saved, match = {}) {
    if (!saved || typeof saved !== "object") return null;
    const state = Object.assign(createMatchExperienceState(match), clone(saved));
    state.version = VERSION;
    state.settlementVersion = SETTLEMENT_VERSION;
    state.evidence = Array.isArray(saved.evidence) ? saved.evidence.slice(-MAX_EVIDENCE_RECORDS).map(clone) : [];
    state.aggregated = Array.isArray(saved.aggregated) ? saved.aggregated.slice(0, SKILL_ORDER.length).map(clone) : [];
    state.selectedContexts = Array.isArray(saved.selectedContexts) ? saved.selectedContexts.slice(0, MAX_CONTEXTS_PER_MATCH).map(clone) : [];
    state.developmentSettlementIds = Array.isArray(saved.developmentSettlementIds) ? [...new Set(saved.developmentSettlementIds.filter(Boolean))].slice(0, MAX_CONTEXTS_PER_MATCH) : [];
    state.developmentResults = Array.isArray(saved.developmentResults) ? saved.developmentResults.slice(0, MAX_CONTEXTS_PER_MATCH).map(clone) : [];
    state.errors = Array.isArray(saved.errors) ? saved.errors.slice(0, 10) : [];
    return state;
  }

  function settleMatchExperienceDevelopment(target, match, options = {}) {
    if (!enabled || options.enabled === false) return deepFreeze({ ok: true, status: "disabled", settled: false, contexts: [] });
    if (!target || !match || match.completed !== true) return deepFreeze({ ok: false, status: "rejected", errors: ["completed-match-required"] });
    const existing = normalizeMatchExperienceState(match.matchExperience, match);
    if (existing?.settled) return deepFreeze({ ok: true, status: "duplicate", duplicate: true, settled: true, state: clone(existing) });
    const state = existing || createMatchExperienceState(match);
    const exposure = options.exposure || derivePlayerExposure(match);
    const evidence = deriveMatchExperienceEvidence(match, { ...options, exposure });
    const aggregated = aggregateMatchExperience(evidence);
    const contexts = selectDevelopmentContexts(aggregated, match, "player");
    const applications = [];
    const errors = [];
    contexts.forEach(context => {
      const application = typeof applyDevelopmentResult === "function"
        ? applyDevelopmentResult(target, { ...context, metadata: { ...context.metadata, settlementId: context.settlementId } })
        : { ok: false, status: "rejected", errors: ["development-processor-unavailable"] };
      if (!application.ok) errors.push(...(application.errors || [application.status || "development-application-failed"]));
      applications.push(application);
    });
    state.finalized = true;
    state.settled = errors.length === 0;
    state.matchExperienceSettlementId = `${match.id || "match"}|${Math.max(0, Number(match.simulationSeed) || 0)}|player|${VERSION}`;
    state.exposure = {
      defensiveInnings: exposure.defensiveInnings,
      plateAppearances: exposure.plateAppearances,
      defensiveExposureValue: getDefensiveInningsExposureValue(exposure.defensiveInnings),
      plateAppearanceExposureValue: getPlateAppearanceExposureValue(exposure.plateAppearances)
    };
    state.evidence = evidence.slice(-MAX_EVIDENCE_RECORDS).map(clone);
    state.evidenceSummary = {
      total: evidence.length,
      exposure: evidence.filter(item => item.evidenceType === "exposure").length,
      active: evidence.filter(item => item.evidenceType === "active").length,
      noveltyGroups: new Set(evidence.map(item => item.novelty.semanticKey)).size
    };
    state.aggregated = aggregated.map(clone);
    state.selectedContexts = contexts.map(clone);
    state.developmentSettlementIds = contexts.map(context => context.settlementId);
    state.developmentResults = applications.map(application => clone(application.result || { status: application.status }));
    state.errors = errors.slice(0, 10);
    match.matchExperience = state;
    return deepFreeze({ ok: errors.length === 0, status: errors.length ? "rejected" : "applied", duplicate: false, settled: state.settled, contexts: clone(contexts), applications: clone(applications), state: clone(state) });
  }

  function getDebugSnapshot(match = {}) {
    const state = normalizeMatchExperienceState(match.matchExperience, match);
    return state ? deepFreeze(clone(state)) : null;
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  return Object.freeze({
    VERSION,
    SETTLEMENT_VERSION,
    MAX_CONTEXTS_PER_MATCH,
    getDefensiveInningsExposureValue,
    getPlateAppearanceExposureValue,
    createEvidenceRecord,
    createExposureEvidence,
    derivePlayerExposure,
    deriveMatchExperienceEvidence,
    applyNoveltyDiminishing,
    aggregateMatchExperience,
    selectDevelopmentContexts,
    createMatchExperienceState,
    normalizeMatchExperienceState,
    settleMatchExperienceDevelopment,
    getDebugSnapshot,
    setEnabled,
    isEnabled
  });
})();
