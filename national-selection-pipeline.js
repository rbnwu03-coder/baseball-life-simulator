(function (root, factory) {
  const foundation = typeof module === "object" && module.exports
    ? require("./high-school-competition-foundation.js") : root.HighSchoolCompetitionFoundation;
  const evidence = typeof module === "object" && module.exports
    ? require("./high-school-competition-evidence.js") : root.HighSchoolCompetitionEvidence;
  const api = factory(foundation, evidence);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NationalSelectionPipeline = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (CompetitionFoundation, CompetitionEvidence) {
  "use strict";

  const VERSION = "national-selection-pipeline-v1";
  const STAGE_TYPES = ["observation", "training_pool", "shortlist", "final_roster"];
  const STAGE_STATUSES = ["planned", "active", "completed", "cancelled"];
  const CANDIDATE_STATUSES = ["observed", "invited", "active", "advanced", "cut", "withdrawn", "injured", "final_selected", "not_selected"];
  const RECOMMENDATIONS = ["ineligible", "observe", "candidate", "invite"];
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const key = (...parts) => JSON.stringify(parts.map(value => String(value ?? "")));
  const round = (value, digits = 3) => {
    const scale = 10 ** digits;
    return Math.round((Number(value) || 0) * scale) / scale;
  };
  const clamp = (value, min = 0, max = 10) => Math.max(min, Math.min(max, Number(value) || 0));

  function emptyState() {
    return { version: VERSION, pipelines: [] };
  }

  function getState(owner) {
    if (!owner.nationalSelectionState) owner.nationalSelectionState = emptyState();
    return owner.nationalSelectionState;
  }

  function normalizeCountMap(value = {}) {
    const result = {};
    Object.entries(value || {}).forEach(([name, count]) => {
      check(typeof name === "string" && name.length > 0, "Invalid roster policy key");
      check(Number.isInteger(Number(count)) && Number(count) >= 0, "Invalid roster policy count");
      result[name] = Number(count);
    });
    return result;
  }

  function normalizeRequiredRoles(value = {}) {
    if (Array.isArray(value)) return Object.fromEntries([...new Set(value.map(String))].map(role => [role, 1]));
    return normalizeCountMap(value);
  }

  function normalizeRosterPolicy(input = {}) {
    return {
      minByPosition: normalizeCountMap(input.minByPosition),
      maxByPosition: normalizeCountMap(input.maxByPosition),
      requiredRoles: normalizeRequiredRoles(input.requiredRoles),
      flexibleSlots: Math.max(0, Number(input.flexibleSlots) || 0)
    };
  }

  function createSelectionStage(input, sequence) {
    check(input && typeof input.stageId === "string" && input.stageId.length > 0, "Selection stage identity is required");
    check(STAGE_TYPES.includes(input.stageType), "Invalid selection stage type");
    check(Number.isInteger(input.targetRosterSize) && input.targetRosterSize > 0, "Invalid stage roster size");
    const teamType = input.teamType || (input.stageType === "final_roster" ? "national_team" : "national_training");
    check(["national_training", "national_team"].includes(teamType), "Invalid selection stage team type");
    const evidencePolicy = clone(input.evidencePolicy || {});
    if (evidencePolicy.minimumConfidence !== undefined) check(["low", "medium", "high"].includes(evidencePolicy.minimumConfidence), "Invalid stage evidence confidence policy");
    return {
      stageId: input.stageId,
      sequence,
      stageType: input.stageType,
      targetRosterSize: input.targetRosterSize,
      status: sequence === 1 ? "active" : "planned",
      teamType,
      evidencePolicy,
      rosterPolicy: normalizeRosterPolicy(input.rosterPolicy)
    };
  }

  function resolvePipeline(owner, pipelineId) {
    const pipeline = getState(owner).pipelines.find(item => item.pipelineId === pipelineId);
    check(pipeline, `Unknown national selection pipeline: ${pipelineId}`);
    return pipeline;
  }

  function getEdition(owner, editionId) {
    const edition = owner.competitionFoundation?.editions?.find(item => item.editionId === editionId);
    check(edition, `Unknown national selection edition: ${editionId}`);
    return edition;
  }

  function createPipeline(owner, input = {}) {
    const edition = getEdition(owner, input.competitionEditionId);
    const configuredStages = edition.selectionConfig?.stages;
    check(Array.isArray(configuredStages) && configuredStages.length > 0, "Selection stages must come from CompetitionEdition.selectionConfig");
    const stages = configuredStages.map((stage, index) => createSelectionStage(stage, index + 1));
    check(new Set(stages.map(stage => stage.stageId)).size === stages.length, "Duplicate selection stage identity");
    stages.forEach((stage, index) => {
      if (index > 0) check(stage.targetRosterSize <= stages[index - 1].targetRosterSize, "Selection stage sizes must not increase");
      if (stage.stageType === "final_roster") check(stage.teamType === "national_team", "Final roster must use national_team");
      else check(stage.teamType === "national_training", "Pre-final stage must use national_training");
    });
    check(stages.at(-1).stageType === "final_roster", "Pipeline requires a final roster stage");
    const trainingTeam = owner.competitionFoundation?.teams?.find(team => team.teamId === input.trainingTeamId);
    const nationalTeam = owner.competitionFoundation?.teams?.find(team => team.teamId === input.targetNationalTeamId);
    check(trainingTeam?.teamType === "national_training", "Pipeline training team identity is invalid");
    check(nationalTeam?.teamType === "national_team", "Pipeline national team identity is invalid");
    const pipelineId = String(input.pipelineId || key(edition.editionId, input.trainingTeamId, input.targetNationalTeamId));
    const existing = getState(owner).pipelines.find(item => item.pipelineId === pipelineId);
    if (existing) {
      check(existing.competitionEditionId === edition.editionId, "Pipeline identity conflict");
      return existing;
    }
    const pipeline = {
      pipelineId,
      competitionEditionId: edition.editionId,
      targetNationalTeamId: input.targetNationalTeamId,
      trainingTeamId: input.trainingTeamId,
      stages,
      currentStageId: stages[0].stageId,
      candidates: [],
      evaluations: [],
      decisions: [],
      finalRoster: null,
      amendments: []
    };
    getState(owner).pipelines.push(pipeline);
    return pipeline;
  }

  function addCandidate(owner, input = {}) {
    const pipeline = resolvePipeline(owner, input.pipelineId);
    const playerId = String(input.playerId || "");
    const sourceTeamId = String(input.sourceTeamId || "");
    check(playerId && sourceTeamId, "Candidate player and source team identity are required");
    const candidateId = String(input.candidateId || key(pipeline.pipelineId, playerId));
    const existing = pipeline.candidates.find(item => item.candidateId === candidateId || item.playerId === playerId);
    if (existing) {
      check(existing.candidateId === candidateId && existing.sourceTeamId === sourceTeamId, "Candidate identity conflict");
      return existing;
    }
    check(pipeline.stages[0].status === "active", "Initial candidate admission is locked");
    const candidate = {
      candidateId,
      playerId,
      sourceTeamId,
      sourceCountyTeamId: input.sourceCountyTeamId ? String(input.sourceCountyTeamId) : "",
      status: "observed",
      currentStageId: pipeline.stages[0].stageId
    };
    pipeline.candidates.push(candidate);
    return candidate;
  }

  function normalizeNationalRosterNeed(input = {}) {
    const neededPositions = [...new Set((input.neededPositions || []).map(String))];
    const depthByPosition = normalizeCountMap(input.depthByPosition);
    const requiredRoles = normalizeRequiredRoles(input.requiredRoles);
    const roleDepth = normalizeCountMap(input.roleDepth);
    return Object.freeze({ neededPositions: Object.freeze(neededPositions), depthByPosition: Object.freeze(depthByPosition), requiredRoles: Object.freeze(requiredRoles), roleDepth: Object.freeze(roleDepth), flexibleSlots: Math.max(0, Number(input.flexibleSlots) || 0) });
  }

  function validatePositionEvaluation(snapshot, playerId, position) {
    check(snapshot && typeof snapshot === "object" && typeof snapshot.version === "string", "National selection requires a versioned position evaluation");
    check(snapshot.playerId === playerId, "National position evaluation player mismatch");
    check(snapshot.position === position || snapshot.requestedPosition === position, "National position evaluation position mismatch");
    return snapshot;
  }

  function buildNationalSelectionProfile(player, input = {}) {
    const playerId = String(input.playerId || "player");
    const targetEdition = getEdition(player, input.competitionEditionId);
    const eligibility = CompetitionFoundation.evaluateCompetitionEligibility(input.eligibilityPlayer || player, targetEdition);
    const position = String(input.position || player.primaryPosition || "");
    const positions = [...new Set([position, ...(input.positions || [])].filter(Boolean).map(String))];
    const roleTags = [...new Set((input.roleTags || []).map(String))];
    const positionEvaluation = validatePositionEvaluation(input.positionEvaluation, playerId, position);
    const need = normalizeNationalRosterNeed(input.nationalRosterNeed);
    const evidenceSummary = CompetitionEvidence.getCompetitionEvidenceSummary(player, {
      playerId,
      competitionEditionId: input.sourceCompetitionEditionId || undefined
    });
    const positionFit = clamp(positionEvaluation.positionFit);
    const positionReadiness = clamp(positionEvaluation.positionReadiness);
    const neededPositionFit = positions.some(value => need.neededPositions.includes(value)) ? 9
      : positions.reduce((best, value) => Math.max(best, Number.isFinite(need.depthByPosition[value]) ? clamp(8 - need.depthByPosition[value] * 2) : 4), 4);
    const matchedRequiredRoles = roleTags.filter(role => Number(need.requiredRoles[role]) > 0);
    const roleFit = matchedRequiredRoles.length ? 9 : roleTags.reduce((best, role) => Math.max(best, Number.isFinite(need.roleDepth[role]) ? clamp(8 - need.roleDepth[role] * 2) : 5), 4);
    const confidence = { low: 2.5, medium: 6, high: 9 }[evidenceSummary.sampleConfidence] || 0;
    const evidenceQuality = clamp(5 + evidenceSummary.quality);
    const score = round(positionReadiness * 0.2 + positionFit * 0.18 + evidenceQuality * 0.18 + confidence * 0.16 + neededPositionFit * 0.14 + roleFit * 0.14);
    const positiveReasons = [];
    const concerns = [];
    if (positionReadiness >= 6.5) positiveReasons.push("strong-position-readiness");
    else if (positionReadiness < 4.5) concerns.push("limited-position-readiness");
    if (positionFit >= 6.5) positiveReasons.push("strong-position-fit");
    else if (positionFit < 4.5) concerns.push("limited-position-fit");
    if (neededPositionFit >= 7) positiveReasons.push("national-position-need");
    else concerns.push("redundant-position-profile");
    if (matchedRequiredRoles.length) positiveReasons.push(...matchedRequiredRoles.map(role => `national-role-need:${role}`));
    else if (Object.keys(need.requiredRoles).length) concerns.push("limited-national-role-fit");
    if (evidenceSummary.sampleConfidence === "high") positiveReasons.push("strong-competition-sample");
    else if (evidenceSummary.sampleConfidence === "medium") positiveReasons.push("sufficient-competition-sample");
    else concerns.push("limited-sample-confidence");
    if (evidenceSummary.quality >= 1) positiveReasons.push("positive-competition-evidence");
    else if (evidenceSummary.quality < -0.5) concerns.push("weak-competition-evidence");
    if (!eligibility.eligible) concerns.push(...eligibility.reasons.map(reason => `eligibility:${reason}`));
    const recommendation = !eligibility.eligible ? "ineligible"
      : evidenceSummary.sampleConfidence === "low" ? "observe"
        : score >= 7.2 ? "invite" : score >= 5.6 ? "candidate" : "observe";
    return Object.freeze({
      version: VERSION,
      playerId,
      eligibility: Object.freeze(clone(eligibility)),
      capabilitySummary: Object.freeze({ sourceVersion: positionEvaluation.version, positionReadiness: round(positionReadiness), fieldingReadiness: round(positionEvaluation.fieldingReadiness), reactionReadiness: round(positionEvaluation.reactionReadiness), decisionReadiness: round(positionEvaluation.decisionReadiness) }),
      position,
      positions: Object.freeze(positions),
      positionFit: round(positionFit),
      roleTags: Object.freeze(roleTags),
      roleFit: round(roleFit),
      competitionEvidenceSummary: evidenceSummary,
      sampleConfidence: evidenceSummary.sampleConfidence,
      recentTrend: evidenceSummary.recentQuality > 0.5 ? "positive" : evidenceSummary.recentQuality < -0.5 ? "negative" : "neutral",
      nationalRosterNeed: need,
      nationalRosterNeedFit: round(neededPositionFit),
      evaluationScore: score,
      recommendation,
      positiveReasons: Object.freeze([...new Set(positiveReasons)]),
      concerns: Object.freeze([...new Set(concerns)])
    });
  }

  function evaluateCandidate(owner, input = {}) {
    const pipeline = resolvePipeline(owner, input.pipelineId);
    const candidate = pipeline.candidates.find(item => item.playerId === input.playerId);
    check(candidate, "Candidate must be admitted before evaluation");
    const stageId = input.stageId || pipeline.currentStageId;
    const stage = pipeline.stages.find(item => item.stageId === stageId);
    check(stage?.status === "active", "Selection stage evaluation is locked");
    const profile = buildNationalSelectionProfile(input.player, { ...input, playerId: candidate.playerId, competitionEditionId: pipeline.competitionEditionId });
    const evaluationId = key(candidate.candidateId, stageId);
    let evaluation = pipeline.evaluations.find(item => item.evaluationId === evaluationId);
    const revision = { revision: (evaluation?.revisions.length || 0) + 1, profile: clone(profile), context: clone(input.evaluationContext || {}) };
    if (!evaluation) {
      evaluation = { evaluationId, candidateId: candidate.candidateId, playerId: candidate.playerId, stageId, revisions: [], currentProfile: null };
      pipeline.evaluations.push(evaluation);
    }
    evaluation.revisions.push(revision);
    evaluation.currentProfile = clone(profile);
    if (profile.recommendation === "invite" || profile.recommendation === "candidate") candidate.status = "invited";
    return Object.freeze({ status: revision.revision === 1 ? "created" : "updated", evaluation: clone(evaluation), profile });
  }

  function recordStageEvidence(owner, input = {}) {
    const pipeline = resolvePipeline(owner, input.pipelineId);
    const stage = pipeline.stages.find(item => item.stageId === (input.stageId || pipeline.currentStageId));
    check(stage?.status === "active", "Selection stage evidence is locked");
    const candidate = pipeline.candidates.find(item => item.playerId === input.playerId);
    check(candidate && candidate.currentStageId === stage.stageId, "Stage evidence candidate is not active");
    return CompetitionEvidence.integrateEvaluationEvidence(input.player, {
      playerId: candidate.playerId,
      competitionEntryId: input.competitionEntryId,
      competitionEditionId: input.sourceCompetitionEditionId,
      teamId: candidate.sourceTeamId,
      position: input.position,
      role: input.role,
      evaluationEvidence: input.evaluationEvidence,
      createdContext: { pipelineId: pipeline.pipelineId, selectionStageId: stage.stageId, evaluationKind: "selection_stage_evaluation", ...clone(input.createdContext || {}) }
    });
  }

  function confidenceRank(value) {
    return { low: 1, medium: 2, high: 3 }[value] || 0;
  }

  function compareRecords(a, b) {
    return (b.profile.evaluationScore - a.profile.evaluationScore)
      || (b.profile.roleFit - a.profile.roleFit)
      || (confidenceRank(b.profile.sampleConfidence) - confidenceRank(a.profile.sampleConfidence))
      || ({ positive: 2, neutral: 1, negative: 0 }[b.profile.recentTrend] - ({ positive: 2, neutral: 1, negative: 0 }[a.profile.recentTrend]))
      || a.candidate.playerId.localeCompare(b.candidate.playerId);
  }

  function choosePosition(profile, positionCounts, maxByPosition) {
    const positions = profile.positions.length ? profile.positions : [profile.position];
    return positions.find(position => maxByPosition[position] === undefined || (positionCounts[position] || 0) < maxByPosition[position]) || "";
  }

  function constructRoster(records, targetRosterSize, policyInput = {}) {
    const policy = normalizeRosterPolicy(policyInput);
    const minimumPositionSlots = Object.values(policy.minByPosition).reduce((sum, count) => sum + count, 0);
    check(minimumPositionSlots <= targetRosterSize, "Roster policy minimum positions exceed target size");
    check(records.length >= targetRosterSize, "Insufficient eligible candidates for target roster size");
    const ordered = records.slice().sort(compareRecords);
    const selected = [];
    const selectedIds = new Set();
    const positionCounts = {};
    const roleCounts = {};

    function select(record, assignedPosition, assignedRole = "") {
      if (!record || selectedIds.has(record.candidate.playerId)) return false;
      const position = assignedPosition || choosePosition(record.profile, positionCounts, policy.maxByPosition);
      if (!position) return false;
      selected.push({ record, assignedPosition: position, assignedRole });
      selectedIds.add(record.candidate.playerId);
      positionCounts[position] = (positionCounts[position] || 0) + 1;
      if (assignedRole) roleCounts[assignedRole] = (roleCounts[assignedRole] || 0) + 1;
      return true;
    }

    for (const [role, required] of Object.entries(policy.requiredRoles)) {
      while ((roleCounts[role] || 0) < required) {
        const record = ordered.find(item => !selectedIds.has(item.candidate.playerId) && item.profile.roleTags.includes(role) && choosePosition(item.profile, positionCounts, policy.maxByPosition));
        check(record, `Roster policy cannot satisfy required role: ${role}`);
        select(record, choosePosition(record.profile, positionCounts, policy.maxByPosition), role);
      }
    }
    for (const [position, minimum] of Object.entries(policy.minByPosition)) {
      while ((positionCounts[position] || 0) < minimum) {
        const record = ordered.find(item => !selectedIds.has(item.candidate.playerId) && item.profile.positions.includes(position)
          && (policy.maxByPosition[position] === undefined || (positionCounts[position] || 0) < policy.maxByPosition[position]));
        check(record, `Roster policy cannot satisfy required position: ${position}`);
        select(record, position);
      }
    }
    for (const record of ordered) {
      if (selected.length >= targetRosterSize) break;
      if (selectedIds.has(record.candidate.playerId)) continue;
      const position = choosePosition(record.profile, positionCounts, policy.maxByPosition);
      if (position) select(record, position);
    }
    check(selected.length === targetRosterSize, "Roster policy cannot fill target roster size");
    for (const [position, minimum] of Object.entries(policy.minByPosition)) check((positionCounts[position] || 0) >= minimum, `Missing required position: ${position}`);
    for (const [position, maximum] of Object.entries(policy.maxByPosition)) check((positionCounts[position] || 0) <= maximum, `Position maximum exceeded: ${position}`);
    for (const [role, required] of Object.entries(policy.requiredRoles)) check((roleCounts[role] || 0) >= required, `Missing required role: ${role}`);
    return { selected, positionCounts, roleCounts, policy };
  }

  function getRegistryPlayer(registry, playerId) {
    const player = registry instanceof Map ? registry.get(playerId) : registry?.[playerId];
    check(player, `Canonical candidate player is unavailable: ${playerId}`);
    return player;
  }

  function findEvaluation(pipeline, candidateId, stageId) {
    return pipeline.evaluations.find(item => item.candidateId === candidateId && item.stageId === stageId)?.currentProfile || null;
  }

  function putDecision(pipeline, decision) {
    const existing = pipeline.decisions.find(item => item.decisionId === decision.decisionId);
    if (existing) {
      check(JSON.stringify(existing) === JSON.stringify(decision), "Selection decision identity conflict");
      return existing;
    }
    pipeline.decisions.push(decision);
    return decision;
  }

  function endTrainingAssignment(player, pipeline, result, context = {}) {
    const assignment = (player.temporaryTeamAssignments || []).find(item => item.teamId === pipeline.trainingTeamId && item.competitionEditionId === pipeline.competitionEditionId && item.status === "active");
    if (assignment) CompetitionFoundation.endTemporaryAssignment(player, assignment.assignmentId, "completed", { selectionResult: result, ...clone(context) });
  }

  function startTrainingAssignment(player, pipeline, candidate, context = {}) {
    return CompetitionFoundation.startTemporaryAssignment(player, {
      assignmentId: `${candidate.candidateId}|national-training`,
      teamId: pipeline.trainingTeamId,
      competitionEditionId: pipeline.competitionEditionId,
      startContext: { pipelineId: pipeline.pipelineId, ...clone(context) }
    });
  }

  function bridgeFinalSelection(player, pipeline, candidate, selection, input) {
    endTrainingAssignment(player, pipeline, "final_selected", { stageId: input.stageId });
    const assignment = CompetitionFoundation.startTemporaryAssignment(player, {
      assignmentId: `${candidate.candidateId}|national-team`,
      teamId: pipeline.targetNationalTeamId,
      competitionEditionId: pipeline.competitionEditionId,
      startContext: { pipelineId: pipeline.pipelineId, stageId: input.stageId }
    });
    const sourceRoster = input.sourceRosters instanceof Map ? input.sourceRosters.get(candidate.playerId) : input.sourceRosters?.[candidate.playerId];
    check(sourceRoster, `Canonical source roster is required: ${candidate.playerId}`);
    const roster = CompetitionFoundation.addRepresentativeRosterEntry(player, {
      teamId: pipeline.targetNationalTeamId,
      competitionEditionId: pipeline.competitionEditionId,
      playerId: candidate.playerId,
      sourceTeamId: candidate.sourceTeamId,
      rosterRole: selection.assignedRole || selection.assignedPosition || "reserve"
    }, sourceRoster);
    return { assignmentId: assignment.assignmentId, representativeRosterId: roster.rosterId };
  }

  function advanceSelectionStage(owner, input = {}) {
    const pipeline = resolvePipeline(owner, input.pipelineId);
    const stage = pipeline.stages.find(item => item.stageId === (input.stageId || pipeline.currentStageId));
    check(stage, "Unknown selection stage");
    if (stage.status === "completed") {
      return Object.freeze({ status: "duplicate", stage: clone(stage), decisions: clone(pipeline.decisions.filter(item => item.stageId === stage.stageId)) });
    }
    check(stage.status === "active", "Selection stage is locked");
    const candidateRecords = pipeline.candidates
      .filter(candidate => candidate.currentStageId === stage.stageId && !["withdrawn", "injured"].includes(candidate.status))
      .map(candidate => {
        const player = getRegistryPlayer(input.playerRegistry, candidate.playerId);
        const edition = getEdition(player, pipeline.competitionEditionId);
        const eligibility = CompetitionFoundation.evaluateCompetitionEligibility(player, edition);
        const profile = findEvaluation(pipeline, candidate.candidateId, stage.stageId);
        return { candidate, player, eligibility, profile };
      });
    const minimumConfidence = stage.evidencePolicy?.minimumConfidence || (stage.stageType === "final_roster" ? "medium" : "low");
    const eligible = candidateRecords.filter(item => item.eligibility.eligible && item.profile && item.profile.eligibility?.eligible
      && confidenceRank(item.profile.sampleConfidence) >= confidenceRank(minimumConfidence));
    const construction = constructRoster(eligible, stage.targetRosterSize, stage.rosterPolicy);
    const selectedById = new Map(construction.selected.map(item => [item.record.candidate.playerId, item]));
    const stageDecisions = [];
    candidateRecords.forEach(record => {
      const selection = selectedById.get(record.candidate.playerId);
      const final = stage.stageType === "final_roster";
      const result = selection ? (final ? "final_selected" : "advanced") : stage.sequence === 1 ? "not_selected" : "cut";
      const eligibilityConcerns = record.eligibility.eligible ? [] : record.eligibility.reasons.map(reason => `eligibility:${reason}`);
      const decision = {
        decisionId: key(pipeline.pipelineId, stage.stageId, record.candidate.playerId, result),
        playerId: record.candidate.playerId,
        candidateId: record.candidate.candidateId,
        stageId: stage.stageId,
        result,
        positiveReasons: selection ? [...new Set([...(record.profile?.positiveReasons || []), selection.assignedPosition ? `roster-position:${selection.assignedPosition}` : "", selection.assignedRole ? `roster-role:${selection.assignedRole}` : ""].filter(Boolean))] : clone(record.profile?.positiveReasons || []),
        concerns: selection ? clone(record.profile?.concerns || []) : [...new Set([...(record.profile?.concerns || ["missing-stage-evaluation"]), ...eligibilityConcerns, "weaker-roster-combination-fit"])],
        decisionContext: clone(input.decisionContext || {})
      };
      putDecision(pipeline, decision);
      stageDecisions.push(decision);
      if (selection) {
        record.candidate.status = final ? "final_selected" : "active";
        if (!final) {
          const next = pipeline.stages[stage.sequence];
          record.candidate.currentStageId = next?.stageId || stage.stageId;
          if (stage.teamType === "national_training") startTrainingAssignment(record.player, pipeline, record.candidate, { stageId: stage.stageId });
        }
      } else {
        record.candidate.status = result;
        endTrainingAssignment(record.player, pipeline, result, { stageId: stage.stageId });
      }
    });
    if (stage.stageType === "final_roster") {
      construction.selected.forEach(selection => {
        const candidate = selection.record.candidate;
        const sourceRoster = input.sourceRosters instanceof Map ? input.sourceRosters.get(candidate.playerId) : input.sourceRosters?.[candidate.playerId];
        check(sourceRoster?.teamId === candidate.sourceTeamId && sourceRoster.players?.some(actor => actor.playerId === candidate.playerId), `Canonical source roster is required: ${candidate.playerId}`);
        CompetitionFoundation.assertIntegrity(selection.record.player);
      });
      const entries = construction.selected.map(selection => {
        const candidate = selection.record.candidate;
        const bridge = bridgeFinalSelection(selection.record.player, pipeline, candidate, selection, { ...input, stageId: stage.stageId });
        return {
          playerId: candidate.playerId,
          sourceTeamId: candidate.sourceTeamId,
          sourceCountyTeamId: candidate.sourceCountyTeamId,
          assignedPosition: selection.assignedPosition,
          assignedRole: selection.assignedRole,
          status: "active",
          assignmentId: bridge.assignmentId,
          representativeRosterId: bridge.representativeRosterId
        };
      });
      pipeline.finalRoster = {
        rosterId: key(pipeline.pipelineId, stage.stageId, "final-roster"),
        teamId: pipeline.targetNationalTeamId,
        teamType: "national_team",
        stageId: stage.stageId,
        targetRosterSize: stage.targetRosterSize,
        rosterPolicy: clone(construction.policy),
        status: "complete",
        entries
      };
    }
    stage.status = "completed";
    const nextStage = pipeline.stages[stage.sequence];
    if (nextStage) {
      nextStage.status = "active";
      pipeline.currentStageId = nextStage.stageId;
    } else pipeline.currentStageId = stage.stageId;
    if (pipeline.finalRoster) assertFinalRosterIntegrity(pipeline.finalRoster);
    return Object.freeze({ status: "applied", stage: clone(stage), advanced: clone(stageDecisions.filter(item => ["advanced", "final_selected"].includes(item.result))), cut: clone(stageDecisions.filter(item => item.result === "cut")), notSelected: clone(stageDecisions.filter(item => item.result === "not_selected")), decisions: clone(stageDecisions) });
  }

  function recordCandidateExit(owner, input = {}) {
    const pipeline = resolvePipeline(owner, input.pipelineId);
    check(["injured", "withdrawn"].includes(input.result), "Candidate exit must be injury or withdrawal");
    const candidate = pipeline.candidates.find(item => item.playerId === input.playerId);
    check(candidate, "Unknown exit candidate");
    const stageId = input.stageId || candidate.currentStageId || pipeline.currentStageId;
    const decisionId = key(pipeline.pipelineId, stageId, candidate.playerId, input.result);
    const existing = pipeline.decisions.find(item => item.decisionId === decisionId);
    if (existing) return Object.freeze({ status: "duplicate", decision: clone(existing) });
    candidate.status = input.result;
    const player = getRegistryPlayer(input.playerRegistry, candidate.playerId);
    const activeAssignments = (player.temporaryTeamAssignments || []).filter(item => item.competitionEditionId === pipeline.competitionEditionId && item.status === "active");
    activeAssignments.forEach(item => CompetitionFoundation.endTemporaryAssignment(player, item.assignmentId, "withdrawn", { selectionResult: input.result, stageId }));
    const decision = putDecision(pipeline, {
      decisionId,
      playerId: candidate.playerId,
      candidateId: candidate.candidateId,
      stageId,
      result: input.result,
      positiveReasons: [],
      concerns: [`unavailable:${input.result}`],
      decisionContext: clone(input.decisionContext || {})
    });
    if (pipeline.finalRoster?.entries.some(entry => entry.playerId === candidate.playerId)) {
      CompetitionFoundation.setRepresentativeRosterEntryStatus(player, {
        teamId: pipeline.targetNationalTeamId,
        competitionEditionId: pipeline.competitionEditionId,
        playerId: candidate.playerId,
        status: "withdrawn"
      });
      pipeline.finalRoster.entries = pipeline.finalRoster.entries.filter(entry => entry.playerId !== candidate.playerId);
      pipeline.finalRoster.status = "vacant";
      pipeline.amendments.push({ amendmentId: `${decisionId}|vacancy`, type: "vacancy", playerId: candidate.playerId, stageId, reason: input.result, context: clone(input.decisionContext || {}) });
    }
    return Object.freeze({ status: "applied", decision: clone(decision) });
  }

  function promoteAlternate(owner, input = {}) {
    const pipeline = resolvePipeline(owner, input.pipelineId);
    check(pipeline.finalRoster, "Replacement requires a final roster");
    const amendmentId = key(pipeline.pipelineId, pipeline.finalRoster.stageId, input.replacementPlayerId, "replacement");
    const existing = pipeline.amendments.find(item => item.amendmentId === amendmentId);
    if (existing) return Object.freeze({ status: "duplicate", amendment: clone(existing) });
    check(pipeline.finalRoster.status === "vacant", "Replacement requires an explicit final-roster vacancy");
    const candidate = pipeline.candidates.find(item => item.playerId === input.replacementPlayerId);
    check(candidate && !["injured", "withdrawn"].includes(candidate.status), "Invalid replacement candidate");
    const player = getRegistryPlayer(input.playerRegistry, candidate.playerId);
    const edition = getEdition(player, pipeline.competitionEditionId);
    check(CompetitionFoundation.evaluateCompetitionEligibility(player, edition).eligible, "Replacement candidate is ineligible");
    const profile = findEvaluation(pipeline, candidate.candidateId, pipeline.finalRoster.stageId);
    check(profile && profile.sampleConfidence !== "low", "Replacement requires final-stage evidence");
    const currentRecords = pipeline.finalRoster.entries.map(entry => {
      const currentCandidate = pipeline.candidates.find(item => item.playerId === entry.playerId);
      return { candidate: currentCandidate, profile: findEvaluation(pipeline, currentCandidate.candidateId, pipeline.finalRoster.stageId), fixedEntry: entry };
    });
    const replacementRecord = { candidate, profile };
    const prospective = constructRoster([...currentRecords, replacementRecord], pipeline.finalRoster.targetRosterSize, pipeline.finalRoster.rosterPolicy);
    check(prospective.selected.some(item => item.record.candidate.playerId === candidate.playerId), "Replacement does not satisfy roster policy");
    const selection = prospective.selected.find(item => item.record.candidate.playerId === candidate.playerId);
    const bridge = bridgeFinalSelection(player, pipeline, candidate, selection, { ...input, stageId: pipeline.finalRoster.stageId });
    pipeline.finalRoster.entries.push({
      playerId: candidate.playerId,
      sourceTeamId: candidate.sourceTeamId,
      sourceCountyTeamId: candidate.sourceCountyTeamId,
      assignedPosition: selection.assignedPosition,
      assignedRole: selection.assignedRole,
      status: "active",
      assignmentId: bridge.assignmentId,
      representativeRosterId: bridge.representativeRosterId
    });
    pipeline.finalRoster.status = "complete";
    candidate.status = "final_selected";
    const decision = putDecision(pipeline, {
      decisionId: key(pipeline.pipelineId, pipeline.finalRoster.stageId, candidate.playerId, "replacement_selected"),
      playerId: candidate.playerId,
      candidateId: candidate.candidateId,
      stageId: pipeline.finalRoster.stageId,
      result: "replacement_selected",
      positiveReasons: [...new Set([...(profile.positiveReasons || []), "explicit-replacement", `roster-position:${selection.assignedPosition}`])],
      concerns: clone(profile.concerns || []),
      decisionContext: clone(input.decisionContext || {})
    });
    const amendment = { amendmentId, type: "replacement", replacedPlayerId: String(input.replacedPlayerId || ""), playerId: candidate.playerId, stageId: pipeline.finalRoster.stageId, decisionId: decision.decisionId, context: clone(input.decisionContext || {}) };
    pipeline.amendments.push(amendment);
    assertFinalRosterIntegrity(pipeline.finalRoster);
    return Object.freeze({ status: "applied", amendment: clone(amendment), decision: clone(decision) });
  }

  function assertFinalRosterIntegrity(roster) {
    check(roster?.teamType === "national_team", "Final roster must reference national_team");
    check(Array.isArray(roster.entries), "Invalid final roster entries");
    check(new Set(roster.entries.map(entry => entry.playerId)).size === roster.entries.length, "Duplicate final roster player");
    roster.entries.forEach(entry => {
      check(Object.keys(entry).sort().join() === "assignedPosition,assignedRole,assignmentId,playerId,representativeRosterId,sourceCountyTeamId,sourceTeamId,status", "Final roster entries must contain identity and assignment references only");
      check(entry.playerId && entry.sourceTeamId && entry.assignmentId && entry.representativeRosterId, "Invalid final roster identity reference");
    });
    if (roster.status === "complete") check(roster.entries.length === roster.targetRosterSize, "Final roster size mismatch");
    const policy = normalizeRosterPolicy(roster.rosterPolicy);
    const positionCounts = {};
    roster.entries.forEach(entry => { positionCounts[entry.assignedPosition] = (positionCounts[entry.assignedPosition] || 0) + 1; });
    if (roster.status === "complete") {
      for (const [position, minimum] of Object.entries(policy.minByPosition)) check((positionCounts[position] || 0) >= minimum, `Final roster missing position: ${position}`);
      for (const [position, maximum] of Object.entries(policy.maxByPosition)) check((positionCounts[position] || 0) <= maximum, `Final roster position maximum exceeded: ${position}`);
      for (const [role, required] of Object.entries(policy.requiredRoles)) check(roster.entries.filter(entry => entry.assignedRole === role).length >= required, `Final roster missing role: ${role}`);
    }
    return true;
  }

  function getNationalSelectionHistory(owner, playerId) {
    return clone(getState(owner).pipelines.flatMap(pipeline => pipeline.decisions.filter(item => !playerId || item.playerId === playerId).map(item => ({ pipelineId: pipeline.pipelineId, competitionEditionId: pipeline.competitionEditionId, ...item }))));
  }

  function getCurrentSelectionStage(owner, pipelineId) {
    const pipeline = resolvePipeline(owner, pipelineId);
    return clone(pipeline.stages.find(stage => stage.stageId === pipeline.currentStageId) || null);
  }

  function getFinalRoster(owner, pipelineId) {
    return clone(resolvePipeline(owner, pipelineId).finalRoster);
  }

  function getCandidateProfile(owner, pipelineId, playerId, stageId) {
    const pipeline = resolvePipeline(owner, pipelineId);
    const candidate = pipeline.candidates.find(item => item.playerId === playerId);
    if (!candidate) return null;
    return clone(findEvaluation(pipeline, candidate.candidateId, stageId || pipeline.currentStageId));
  }

  function normalizeState(saved) {
    if (!saved) return emptyState();
    check(saved.version === VERSION && Array.isArray(saved.pipelines), "Unsupported national selection schema");
    const state = emptyState();
    const pipelineIds = new Set();
    saved.pipelines.forEach(source => {
      check(!pipelineIds.has(source.pipelineId), "Duplicate national selection pipeline");
      pipelineIds.add(source.pipelineId);
      check(Array.isArray(source.stages) && Array.isArray(source.candidates) && Array.isArray(source.evaluations) && Array.isArray(source.decisions) && Array.isArray(source.amendments), "Invalid national selection collections");
      check(new Set(source.stages.map(item => item.stageId)).size === source.stages.length, "Duplicate restored selection stage");
      source.stages.forEach(stage => { check(STAGE_TYPES.includes(stage.stageType) && STAGE_STATUSES.includes(stage.status), "Invalid restored selection stage"); });
      check(new Set(source.candidates.map(item => item.playerId)).size === source.candidates.length, "Duplicate restored candidate");
      source.candidates.forEach(candidate => {
        check(Object.keys(candidate).sort().join() === "candidateId,currentStageId,playerId,sourceCountyTeamId,sourceTeamId,status", "Candidate records must contain identity and lifecycle fields only");
        check(CANDIDATE_STATUSES.includes(candidate.status), "Invalid restored candidate status");
      });
      check(new Set(source.decisions.map(item => item.decisionId)).size === source.decisions.length, "Duplicate restored selection decision");
      if (source.finalRoster) assertFinalRosterIntegrity(source.finalRoster);
      state.pipelines.push(clone(source));
    });
    return state;
  }

  function assertIntegrity(owner) {
    normalizeState(owner.nationalSelectionState);
    return true;
  }

  function restorePlayer(owner, savedState = owner.nationalSelectionState) {
    owner.nationalSelectionState = normalizeState(savedState);
    owner.nationalSelectionState = clone(owner.nationalSelectionState);
    return owner;
  }

  return Object.freeze({
    VERSION,
    STAGE_TYPES: Object.freeze(STAGE_TYPES.slice()),
    CANDIDATE_STATUSES: Object.freeze(CANDIDATE_STATUSES.slice()),
    emptyState,
    normalizeRosterPolicy,
    createSelectionStage,
    createPipeline,
    addCandidate,
    normalizeNationalRosterNeed,
    buildNationalSelectionProfile,
    evaluateCandidate,
    recordStageEvidence,
    constructRoster,
    advanceSelectionStage,
    recordCandidateExit,
    promoteAlternate,
    assertFinalRosterIntegrity,
    getNationalSelectionHistory,
    getCurrentSelectionStage,
    getFinalRoster,
    getCandidateProfile,
    normalizeState,
    assertIntegrity,
    restorePlayer
  });
});
