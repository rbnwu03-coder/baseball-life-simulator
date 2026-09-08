(function (root, factory) {
  const foundation = typeof module === "object" && module.exports
    ? require("./high-school-competition-foundation.js")
    : root.HighSchoolCompetitionFoundation;
  const gameRecord = typeof module === "object" && module.exports
    ? require("./match-game-record.js")
    : root.MatchGameRecord;
  const api = factory(foundation, gameRecord);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HighSchoolCompetitionEvidence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (CompetitionFoundation, MatchGameRecord) {
  "use strict";

  const VERSION = "high-school-competition-evidence-v1";
  const SOURCE_TYPES = ["match", "evaluation"];
  const EVIDENCE_TYPES = ["offense", "defense", "pitching", "baserunning", "catching", "overall_observation"];
  const RELIABILITY_ORDER = Object.freeze({ low: 1, medium: 2, high: 3 });

  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const identity = (...parts) => JSON.stringify(parts.map(value => String(value ?? "")));
  const round = (value, digits = 3) => {
    const scale = 10 ** digits;
    return Math.round((Number(value) || 0) * scale) / scale;
  };

  function emptyState() {
    return { version: VERSION, records: [] };
  }

  function getState(player) {
    if (!player.competitionEvidenceState) player.competitionEvidenceState = emptyState();
    return player.competitionEvidenceState;
  }

  function getReliability(sampleCount) {
    const count = Math.max(0, Number(sampleCount) || 0);
    return count >= 8 ? "high" : count >= 3 ? "medium" : "low";
  }

  function getCompetitionContext(player, competitionEditionId) {
    const state = player?.competitionFoundation;
    const edition = state?.editions?.find(item => item.editionId === competitionEditionId);
    check(edition, `Unknown competition edition: ${competitionEditionId}`);
    const definition = state.definitions.find(item => item.competitionId === edition.competitionId);
    check(definition, `Unknown competition definition: ${edition.competitionId}`);
    const configuredWeight = Number(edition.selectionConfig?.exposureWeight);
    const relevance = edition.selectionConfig?.selectionRelevance ?? definition.selectionRelevance ?? null;
    const relevanceLevel = relevance && typeof relevance === "object" ? relevance.level || relevance.value || "configured" : relevance;
    const exposureWeight = Number.isFinite(configuredWeight) ? Math.max(0, configuredWeight)
      : relevanceLevel === "high" ? 1.2 : relevanceLevel === "medium" ? 1 : relevanceLevel === "low" ? 0.8 : 1;
    return Object.freeze({
      competitionEditionId: edition.editionId,
      competitionId: definition.competitionId,
      competitionType: definition.competitionType,
      level: definition.level,
      selectionRelevance: clone(relevance),
      exposureWeight: round(exposureWeight)
    });
  }

  function resolveEntry(player, input) {
    const entries = player?.competitionFoundation?.entries || [];
    const entry = input.competitionEntryId
      ? entries.find(item => item.entryId === input.competitionEntryId)
      : entries.find(item => item.competitionEditionId === input.competitionEditionId && item.teamId === input.teamId);
    check(entry, "Competition evidence requires a canonical competition entry");
    if (input.competitionEditionId) check(entry.competitionEditionId === input.competitionEditionId, "Competition edition mismatch");
    if (input.teamId) check(entry.teamId === input.teamId, "Competition team mismatch");
    return entry;
  }

  function resolveParticipation(player, input, entry) {
    return (player?.competitionFoundation?.participations || []).find(item =>
      item.playerId === input.playerId && item.competitionEditionId === entry.competitionEditionId && item.teamId === entry.teamId);
  }

  function mapEvidenceType(source, position) {
    const participationType = String(source.participationType || "").toLowerCase();
    const targetSkill = String(source.skillEvidence?.targetSkill || "").toLowerCase();
    const normalizedPosition = String(position || "").toUpperCase();
    if (normalizedPosition === "P" || /pitch/.test(participationType) || ["control", "pitchstamina"].includes(targetSkill)) return "pitching";
    if (/runner|baserun/.test(participationType) || targetSkill === "baserunning") return "baserunning";
    if (normalizedPosition === "C" && /catch|block|throw/.test(`${participationType}|${targetSkill}`)) return "catching";
    if (/batter|plate/.test(participationType) || targetSkill === "batting") return "offense";
    return "defense";
  }

  function getSample(source, evidenceType) {
    const snapshot = source.sourceSnapshot || {};
    const situation = source.situation || {};
    if (evidenceType === "offense") return { type: "PA", count: Math.max(1, Number(snapshot.plateAppearances || situation.plateAppearances) || 1) };
    if (evidenceType === "pitching") return { type: "IP", count: Math.max(1, Number(snapshot.inningsPitched || situation.inningsPitched) || 1) };
    if (evidenceType === "baserunning") return { type: "baserunning_opportunities", count: 1 };
    return { type: "defensive_opportunities", count: Math.max(1, Number(snapshot.defensiveInnings || situation.defensiveInnings) || 1) };
  }

  function performanceValue(source) {
    const base = Number(source.skillEvidence?.adjustedValue ?? source.skillEvidence?.baseValue);
    const decision = { strong: 2, acceptable: 1, questionable: -1, poor: -2 }[source.decisionEvidence?.quality] || 0;
    const execution = { strong: 2, normal: 1, weak: -1, failed: -2 }[source.executionEvidence?.quality] || 0;
    return round((Number.isFinite(base) ? base : 0) + (decision + execution) * 0.5);
  }

  function putRecord(state, record) {
    const existing = state.records.find(item => item.evidenceId === record.evidenceId);
    if (existing) {
      check(JSON.stringify(existing) === JSON.stringify(record), `Conflicting competition evidence: ${record.evidenceId}`);
      return existing;
    }
    state.records.push(record);
    return record;
  }

  function createRecord(input) {
    check(SOURCE_TYPES.includes(input.sourceType), "Invalid competition evidence source");
    check(EVIDENCE_TYPES.includes(input.evidenceType), "Invalid competition evidence type");
    check(input.sample && Number(input.sample.count) > 0, "Competition evidence requires a positive sample");
    return {
      evidenceId: String(input.evidenceId),
      playerId: String(input.playerId),
      competitionEditionId: String(input.competitionEditionId),
      competitionEntryId: String(input.competitionEntryId),
      teamId: String(input.teamId),
      sourceType: input.sourceType,
      evidenceType: input.evidenceType,
      evidenceLayer: String(input.evidenceLayer || (input.sourceType === "match" ? "decision" : "evaluation")),
      position: String(input.position || ""),
      role: String(input.role || "participant"),
      sample: { type: String(input.sample.type), count: Math.max(1, Number(input.sample.count) || 1) },
      context: clone(input.context || {}),
      performance: clone(input.performance || {}),
      reliability: getReliability(input.sample.count),
      createdContext: clone(input.createdContext || {})
    };
  }

  function fullGamePerformanceValue(evidenceType, line) {
    if (evidenceType === "offense") {
      const stats = line.batting;
      return round((stats.H * 2 + stats.doubles + stats.triples * 2 + stats.HR * 3 + stats.BB - stats.SO * 0.5) / Math.max(1, stats.PA));
    }
    if (evidenceType === "pitching") {
      const stats = line.pitching;
      return round((stats.SO * 1.5 - stats.H - stats.BB - stats.HBP - stats.ER * 1.5) / Math.max(1, stats.BF));
    }
    const stats = line.defense;
    return round((stats.PO + stats.A - stats.E * 2) / Math.max(1, stats.chances));
  }

  function integrateFullGameProductionEvidence(player, input, entry, participation) {
    entry = entry || resolveEntry(player, input || {});
    const playerId = String(input?.playerId || "player");
    participation = participation || resolveParticipation(player, { ...(input || {}), playerId }, entry);
    const match = input.match || {};
    const gameRecord = match.gameRecord;
    if (!MatchGameRecord || !gameRecord || gameRecord.status !== "final") return [];
    const line = MatchGameRecord.getPlayerGameLine(gameRecord, playerId);
    if (!line || !participation || participation.participationStatus !== "appeared") return [];
    const state = getState(player);
    const specs = [];
    if (Number(line.batting?.PA) > 0) specs.push(["offense", "PA", line.batting.PA, line.batting]);
    if (Number(line.pitching?.BF) > 0) specs.push(["pitching", "BF", line.pitching.BF, line.pitching]);
    if (Number(line.defense?.chances) > 0) specs.push(["defense", "defensive_chances", line.defense.chances, line.defense]);
    return specs.map(([evidenceType, sampleType, count, stats]) => {
      const sourceId = `${gameRecord.gameId}|full-game|${evidenceType}`;
      return putRecord(state, createRecord({
        evidenceId: identity(playerId, entry.competitionEditionId, gameRecord.gameId, "full-game-production", evidenceType),
        playerId,
        competitionEditionId: entry.competitionEditionId,
        competitionEntryId: entry.entryId,
        teamId: entry.teamId,
        sourceType: "match",
        evidenceType,
        evidenceLayer: "fullGameProduction",
        position: input.position || line.position || match.position,
        role: input.role || line.role || match.role,
        sample: { type: sampleType, count },
        context: { matchId: String(match.id || gameRecord.gameId), gameRecordId: gameRecord.gameId, sourceEvidenceId: sourceId },
        performance: { value: fullGamePerformanceValue(evidenceType, line), stats: clone(stats) },
        createdContext: input.createdContext || { seasonYear: input.seasonYear ?? null, sequence: input.sequence ?? null }
      }));
    });
  }

  function integrateMatchEvidence(player, input = {}) {
    if (!input.competitionEditionId && !input.competitionEntryId) return Object.freeze({ status: "not-applicable", records: [] });
    const entry = resolveEntry(player, input);
    const playerId = String(input.playerId || "player");
    const participation = resolveParticipation(player, { ...input, playerId }, entry);
    if (!participation || participation.participationStatus !== "appeared") {
      return Object.freeze({ status: "no-appearance", records: [] });
    }
    const match = input.match || {};
    check(match.completed === true, "Competition match evidence requires a completed match");
    const canonicalState = match.matchExperience;
    const productionRecords = integrateFullGameProductionEvidence(player, input, entry, participation);
    check(productionRecords.length > 0 || (canonicalState?.finalized === true && Array.isArray(canonicalState.evidence)), "Canonical match experience evidence or full game production is required");
    const state = getState(player);
    const decisionRecords = (canonicalState?.evidence || []).map((source, index) => {
      const evidenceType = mapEvidenceType(source, input.position || match.position);
      const sample = getSample(source, evidenceType);
      const sourceId = source.evidenceId || `${match.id}|${index}`;
      return putRecord(state, createRecord({
        evidenceId: identity(playerId, entry.competitionEditionId, match.id, sourceId, evidenceType),
        playerId,
        competitionEditionId: entry.competitionEditionId,
        competitionEntryId: entry.entryId,
        teamId: entry.teamId,
        sourceType: "match",
        evidenceType,
        evidenceLayer: "decision",
        position: input.position || match.position || match.playerFieldingAssignment,
        role: input.role || match.role || match.playerLineupStatus,
        sample,
        context: { matchId: String(match.id), sourceEvidenceId: String(sourceId), participationType: source.participationType || "" },
        performance: {
          value: performanceValue(source),
          experienceQuality: source.experienceQuality || "",
          targetSkill: source.skillEvidence?.targetSkill || "",
          decisionQuality: source.decisionEvidence?.quality || "",
          executionQuality: source.executionEvidence?.quality || ""
        },
        createdContext: input.createdContext || { seasonYear: input.seasonYear ?? null, sequence: input.sequence ?? null }
      }));
    });
    const records = [...productionRecords, ...decisionRecords];
    return Object.freeze({ status: records.length ? "applied" : "no-canonical-evidence", records: clone(records) });
  }

  function integrateEvaluationEvidence(player, input = {}) {
    const entry = resolveEntry(player, input);
    const playerId = String(input.playerId || "player");
    const participation = resolveParticipation(player, { ...input, playerId }, entry);
    if (!participation) return Object.freeze({ status: "not-rostered", records: [] });
    const source = input.evaluationEvidence;
    check(source?.matchIdentity, "Canonical evaluation evidence is required");
    const sampleCount = Math.max(1, Number(source.matchEvidence?.sampleSize) || 1);
    const record = createRecord({
      evidenceId: identity(playerId, entry.competitionEditionId, source.matchIdentity, "evaluation", "overall_observation"),
      playerId,
      competitionEditionId: entry.competitionEditionId,
      competitionEntryId: entry.entryId,
      teamId: entry.teamId,
      sourceType: "evaluation",
      evidenceType: "overall_observation",
      position: input.position,
      role: input.role,
      sample: { type: "evaluation_observations", count: sampleCount },
      context: { evaluationIdentity: String(source.matchIdentity) },
      performance: { value: round(source.sampleScore), quality: round(source.matchEvidence?.quality), positionFit: round(source.trainingEvidence?.positionFit) },
      createdContext: input.createdContext || {}
    });
    return Object.freeze({ status: "applied", records: [clone(putRecord(getState(player), record))] });
  }

  function getEvidence(player, filter = {}) {
    return clone(getState(player).records.filter(item =>
      (!filter.playerId || item.playerId === filter.playerId)
      && (!filter.competitionEditionId || item.competitionEditionId === filter.competitionEditionId)
      && (!filter.teamId || item.teamId === filter.teamId)));
  }

  function getCompetitionEvidenceSummary(player, filter = {}) {
    const records = getEvidence(player, filter);
    const samplesByIndependentSource = new Map();
    records.forEach(item => {
      const sourceIdentity = item.sourceType === "match" ? item.context.matchId : item.context.evaluationIdentity;
      const sourceKey = identity(item.sourceType, sourceIdentity || item.evidenceId);
      samplesByIndependentSource.set(sourceKey, Math.max(samplesByIndependentSource.get(sourceKey) || 0, item.sample.count));
    });
    const totalSample = [...samplesByIndependentSource.values()].reduce((sum, count) => sum + count, 0);
    const independentSourceCount = samplesByIndependentSource.size;
    const values = records.map(item => Number(item.performance?.value) || 0);
    const overall = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const recentValues = values.slice(-Math.min(3, values.length));
    const recent = recentValues.length ? recentValues.reduce((sum, value) => sum + value, 0) / recentValues.length : 0;
    const quality = round(overall * 0.7 + recent * 0.3);
    const byType = {};
    records.forEach(item => { byType[item.evidenceType] = (byType[item.evidenceType] || 0) + item.sample.count; });
    return Object.freeze({
      playerId: String(filter.playerId || ""),
      competitionEditionId: String(filter.competitionEditionId || ""),
      recordCount: records.length,
      totalSample,
      sampleConfidence: independentSourceCount >= 3 && totalSample >= 8 ? "high"
        : independentSourceCount >= 2 && totalSample >= 3 ? "medium" : "low",
      independentSourceCount,
      quality,
      recentQuality: round(recent),
      byType: Object.freeze(byType),
      records: Object.freeze(records)
    });
  }

  function normalizeState(saved) {
    const state = emptyState();
    if (!saved) return state;
    check(saved.version === VERSION && Array.isArray(saved.records), "Unsupported competition evidence schema");
    saved.records.forEach(item => putRecord(state, createRecord(item)));
    check(state.records.length === saved.records.length, "Duplicate competition evidence");
    return state;
  }

  function assertIntegrity(player) {
    const state = normalizeState(player.competitionEvidenceState);
    state.records.forEach(record => {
      const context = getCompetitionContext(player, record.competitionEditionId);
      check(context.competitionEditionId === record.competitionEditionId, "Dangling competition evidence edition");
      const entry = player.competitionFoundation.entries.find(item => item.entryId === record.competitionEntryId);
      check(entry && entry.teamId === record.teamId && entry.competitionEditionId === record.competitionEditionId, "Dangling competition evidence entry");
      check(RELIABILITY_ORDER[record.reliability] === RELIABILITY_ORDER[getReliability(record.sample.count)], "Invalid evidence reliability");
    });
    return true;
  }

  function restorePlayer(player, savedState = player.competitionEvidenceState) {
    player.competitionEvidenceState = normalizeState(savedState);
    assertIntegrity(player);
    player.competitionEvidenceState = clone(player.competitionEvidenceState);
    return player;
  }

  return Object.freeze({
    VERSION, SOURCE_TYPES: Object.freeze(SOURCE_TYPES.slice()), EVIDENCE_TYPES: Object.freeze(EVIDENCE_TYPES.slice()),
    emptyState, getReliability, getCompetitionContext, integrateMatchEvidence, integrateFullGameProductionEvidence, integrateEvaluationEvidence,
    getEvidence, getCompetitionEvidenceSummary, normalizeState, assertIntegrity, restorePlayer
  });
});
