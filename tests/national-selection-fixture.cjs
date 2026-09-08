const F = require("../high-school-competition-foundation.js");
const E = require("../high-school-competition-evidence.js");
const N = require("../national-selection-pipeline.js");

function selectionConfig(sizes, policy = {}) {
  return {
    stages: sizes.map((targetRosterSize, index) => ({
      stageId: index === 0 ? "initial_pool" : index === sizes.length - 1 ? "final_roster" : `shortlist_${index}`,
      stageType: index === 0 ? "training_pool" : index === sizes.length - 1 ? "final_roster" : "shortlist",
      targetRosterSize,
      teamType: index === sizes.length - 1 ? "national_team" : "national_training",
      evidencePolicy: { minimumConfidence: index === sizes.length - 1 ? "medium" : "low" },
      rosterPolicy: index === 0 ? (policy.initial || {}) : index === sizes.length - 1 ? (policy.final || policy.shortlist || {}) : (policy.shortlist || {})
    }))
  };
}

function setupPlayer(id, spec, editionId, config) {
  const schoolId = `school-${id}`;
  const player = {
    name: id,
    age: spec.age ?? 17,
    schoolStage: "high_school",
    available: spec.available !== false,
    primaryPosition: spec.position,
    throws: spec.throws || "R"
  };
  F.assignPrimarySchool(player, { teamId: schoolId, organizationId: schoolId, teamType: "school" });
  F.registerDefinition(player, { competitionId: "selection-evidence", competitionType: "selection_tournament", entryUnit: "school", level: "national_selection", selectionRelevance: { level: "high" } });
  F.registerEdition(player, { editionId: "selection-evidence-2031", competitionId: "selection-evidence", seasonYear: 2031, selectionConfig: { exposureWeight: 1.1 } });
  const sourceEntry = F.enterCompetition(player, { competitionEditionId: "selection-evidence-2031", teamId: schoolId });
  F.recordParticipation(player, { playerId: id, competitionEditionId: "selection-evidence-2031", teamId: schoolId, rosterStatus: "active_roster", participationStatus: "appeared" });
  F.registerDefinition(player, { competitionId: "u18-selection", competitionType: "international", entryUnit: "national_team", level: "international_u18", selectionRelevance: { level: "high" } });
  F.registerEdition(player, { editionId, competitionId: "u18-selection", seasonYear: Number(spec.seasonYear) || 2031, eligibility: { ageRule: { type: "age", max: 18 }, schoolStages: ["high_school"], requireAvailable: true }, selectionConfig: config });
  F.registerTeam(player, { teamId: "national-training", organizationId: "national", teamType: "national_training" });
  F.registerTeam(player, { teamId: "national-team", organizationId: "national", teamType: "national_team" });
  E.restorePlayer(player);
  const samples = spec.samples ?? 3;
  for (let index = 0; index < samples; index += 1) {
    E.integrateEvaluationEvidence(player, {
      playerId: id,
      competitionEntryId: sourceEntry.entryId,
      position: spec.position,
      role: spec.roles?.[0] || "participant",
      evaluationEvidence: {
        matchIdentity: `${id}|formal-evidence|${index}`,
        sampleScore: spec.evidenceQuality ?? 2,
        matchEvidence: { sampleSize: spec.sampleSize ?? 3, quality: spec.evidenceQuality ?? 2 },
        trainingEvidence: { positionFit: spec.fit ?? 8 }
      },
      createdContext: { sequence: index + 1 }
    });
  }
  return {
    id,
    player,
    spec,
    sourceRoster: { teamId: schoolId, players: [{ playerId: id }] },
    positionEvaluation: {
      version: "opportunity-readiness-v1",
      playerId: id,
      position: spec.position,
      requestedPosition: spec.position,
      positionReadiness: spec.readiness ?? 8,
      positionFit: spec.fit ?? 8,
      fieldingReadiness: spec.readiness ?? 8,
      reactionReadiness: spec.readiness ?? 8,
      decisionReadiness: spec.readiness ?? 8
    }
  };
}

function defaultSpecs(count) {
  const specs = [];
  for (let index = 0; index < count; index += 1) {
    if (index < Math.min(20, count)) specs.push({ position: "1B", positions: ["1B"], roles: ["power_bat"], readiness: 9, fit: 9, evidenceQuality: 3 });
    else if (index < Math.min(28, count)) specs.push({ position: "P", positions: ["P"], roles: [index % 2 ? "reliever" : "starter", index % 3 ? "strike_thrower" : "multi_inning"], readiness: 8, fit: 8, evidenceQuality: 2.4, throws: index % 4 === 0 ? "L" : "R" });
    else if (index < Math.min(31, count)) specs.push({ position: "C", positions: ["C"], roles: [index % 2 ? "backup_catcher" : "starter_catcher"], readiness: 8, fit: 8, evidenceQuality: 2.2 });
    else if (index < Math.min(33, count)) specs.push({ position: "SS", positions: ["SS", "2B"], roles: ["middle_infield_defense"], readiness: 8, fit: 8, evidenceQuality: 2.3 });
    else specs.push({ position: ["CF", "RF", "LF", "2B", "3B"][index % 5], roles: ["bench_versatility"], readiness: 7, fit: 7, evidenceQuality: 1.5 });
  }
  return specs;
}

function createCampaign(options = {}) {
  const sizes = options.sizes || [12, 8, 5];
  const config = selectionConfig(sizes, options.policy || {});
  const editionId = options.editionId || "u18-2031";
  const specs = options.specs || defaultSpecs(options.count || Math.max(sizes[0] + 4, 14));
  const subjects = specs.map((spec, index) => setupPlayer(`${options.prefix || "candidate"}-${String(index + 1).padStart(2, "0")}`, spec, editionId, config));
  const owner = subjects[0].player;
  const pipeline = N.createPipeline(owner, { pipelineId: options.pipelineId || `${editionId}|pipeline`, competitionEditionId: editionId, trainingTeamId: "national-training", targetNationalTeamId: "national-team" });
  const registry = Object.fromEntries(subjects.map(subject => [subject.id, subject.player]));
  const sourceRosters = Object.fromEntries(subjects.map(subject => [subject.id, subject.sourceRoster]));
  subjects.forEach(subject => N.addCandidate(owner, { pipelineId: pipeline.pipelineId, playerId: subject.id, sourceTeamId: subject.player.primaryTeamAssignment.teamId, sourceCountyTeamId: `county-${subject.id}` }));
  return { owner, pipeline, registry, sourceRosters, subjects, config, editionId };
}

function evaluateCurrentStage(campaign, options = {}) {
  const stageId = campaign.pipeline.currentStageId;
  const stage = campaign.pipeline.stages.find(item => item.stageId === stageId);
  const requiredRoles = stage.rosterPolicy.requiredRoles || {};
  const neededPositions = Object.keys(stage.rosterPolicy.minByPosition || {});
  campaign.pipeline.candidates.filter(candidate => candidate.currentStageId === stageId && !["cut", "injured", "withdrawn"].includes(candidate.status)).forEach(candidate => {
    const subject = campaign.subjects.find(item => item.id === candidate.playerId);
    N.evaluateCandidate(campaign.owner, {
      pipelineId: campaign.pipeline.pipelineId,
      stageId,
      playerId: subject.id,
      player: subject.player,
      position: subject.spec.position,
      positions: subject.spec.positions || [subject.spec.position],
      roleTags: subject.spec.roles || [],
      positionEvaluation: subject.positionEvaluation,
      sourceCompetitionEditionId: "selection-evidence-2031",
      nationalRosterNeed: { neededPositions, depthByPosition: {}, requiredRoles, roleDepth: {}, flexibleSlots: stage.rosterPolicy.flexibleSlots || 0 },
      evaluationContext: options.evaluationContext || { stageId }
    });
  });
}

function advanceCurrentStage(campaign, options = {}) {
  evaluateCurrentStage(campaign, options);
  return N.advanceSelectionStage(campaign.owner, {
    pipelineId: campaign.pipeline.pipelineId,
    stageId: campaign.pipeline.currentStageId,
    playerRegistry: campaign.registry,
    sourceRosters: campaign.sourceRosters,
    decisionContext: options.decisionContext || {}
  });
}

module.exports = { F, E, N, selectionConfig, setupPlayer, defaultSpecs, createCampaign, evaluateCurrentStage, advanceCurrentStage };
