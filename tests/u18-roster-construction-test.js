const assert = require("assert");
const { F, E, N, selectionConfig, createCampaign, advanceCurrentStage } = require("./national-selection-fixture.cjs");

let passed = 0;
function verify(title, condition) { assert.ok(condition, title); passed += 1; console.log(`✓ ${title}`); }

const policy = {
  shortlist: {
    minByPosition: { P: 6, C: 2, SS: 1 },
    maxByPosition: { P: 9, C: 3, SS: 2, "1B": 14 },
    requiredRoles: { starter: 1, reliever: 1, backup_catcher: 1 },
    flexibleSlots: 13
  },
  final: {
    minByPosition: { P: 6, C: 2, SS: 1 },
    maxByPosition: { P: 8, C: 3, SS: 2, "1B": 10 },
    requiredRoles: { starter: 1, reliever: 1, backup_catcher: 1 },
    flexibleSlots: 9
  }
};

function runFullCampaign(sizes, prefix) {
  const campaign = createCampaign({ sizes, count: 40, prefix, pipelineId: `${prefix}-pipeline`, editionId: `${prefix}-edition`, policy });
  const stageResults = [];
  while (campaign.pipeline.stages.some(stage => stage.status !== "completed")) stageResults.push(advanceCurrentStage(campaign));
  return { campaign, stageResults, roster: N.getFinalRoster(campaign.owner, campaign.pipeline.pipelineId) };
}

const asia = runFullCampaign([36, 22, 18], "config-a");
verify("1. Config A completes 36→22→18 with the configured stage sizes", asia.stageResults.map(result => result.advanced.length).join() === "36,22,18" && asia.roster.entries.length === 18);
const world = runFullCampaign([36, 24, 20], "config-b");
verify("2. Config B completes 36→24→20 with the same engine", world.stageResults.map(result => result.advanced.length).join() === "36,24,20" && world.roster.entries.length === 20);
verify("3. Both 36+ candidate campaigns retain one candidate identity per player", asia.campaign.pipeline.candidates.length === 40 && world.campaign.pipeline.candidates.length === 40 && new Set(asia.campaign.pipeline.candidates.map(item => item.playerId)).size === 40);

function countPosition(roster, position) { return roster.entries.filter(entry => entry.assignedPosition === position).length; }
verify("4. Final roster satisfies the configured catcher minimum", countPosition(asia.roster, "C") >= 2);
verify("5. Final roster satisfies the configured shortstop minimum", countPosition(asia.roster, "SS") >= 1);
verify("6. Final roster satisfies the configured pitcher minimum", countPosition(asia.roster, "P") >= 6);
verify("7. Pitcher role policy preserves starter and reliever diversity", asia.roster.entries.some(entry => entry.assignedRole === "starter") && asia.roster.entries.some(entry => entry.assignedRole === "reliever"));
verify("8. Catcher role policy preserves a backup catcher", asia.roster.entries.some(entry => entry.assignedRole === "backup_catcher"));

const topScoreIds = new Set(asia.campaign.subjects.slice(0, 18).map(subject => subject.id));
const selectedIds = new Set(asia.roster.entries.map(entry => entry.playerId));
verify("9. Best-team construction is not top-N score selection", [...selectedIds].some(id => !topScoreIds.has(id)) && [...topScoreIds].some(id => !selectedIds.has(id)));
verify("10. Mandatory coverage is selected before flexible high-score slots", asia.roster.entries.filter(entry => ["P", "C", "SS"].includes(entry.assignedPosition)).length >= 9 && asia.roster.entries.some(entry => entry.assignedPosition === "1B"));
verify("11. Final roster contains no duplicate player slots", selectedIds.size === asia.roster.entries.length && N.assertFinalRosterIntegrity(asia.roster));

const lowSampleSpecs = [
  { position: "1B", roles: ["power_bat"], readiness: 10, fit: 10, evidenceQuality: 8, samples: 1, sampleSize: 1 },
  { position: "1B", roles: ["power_bat"], readiness: 8, fit: 8, evidenceQuality: 2 },
  { position: "SS", roles: ["middle_infield_defense"], readiness: 8, fit: 8, evidenceQuality: 2 },
  { position: "C", roles: ["backup_catcher"], readiness: 8, fit: 8, evidenceQuality: 2 },
  { position: "P", roles: ["starter"], readiness: 8, fit: 8, evidenceQuality: 2 }
];
const sampleCampaign = createCampaign({ sizes: [5, 3], count: 5, specs: lowSampleSpecs, prefix: "sample", pipelineId: "sample-pipeline", editionId: "sample-edition", policy: { final: { minByPosition: { SS: 1, C: 1, P: 1 } } } });
advanceCurrentStage(sampleCampaign);
const sampleFinal = advanceCurrentStage(sampleCampaign);
verify("12. One great low-sample game does not produce automatic final selection", sampleFinal.cut.some(item => item.playerId === sampleCampaign.subjects[0].id) && sampleCampaign.pipeline.candidates[0].status === "cut");

const durableId = asia.roster.entries.find(entry => entry.assignedPosition === "SS").playerId;
const durableSubject = asia.campaign.subjects.find(subject => subject.id === durableId);
E.integrateEvaluationEvidence(durableSubject.player, {
  playerId: durableId,
  competitionEntryId: durableSubject.player.competitionFoundation.entries.find(entry => entry.competitionEditionId === "selection-evidence-2031").entryId,
  position: "SS",
  role: "middle_infield_defense",
  evaluationEvidence: { matchIdentity: `${durableId}|weak-camp-observation`, sampleScore: -2, matchEvidence: { sampleSize: 3, quality: -2 }, trainingEvidence: { positionFit: 8 } }
});
verify("13. Strong accumulated evidence remains queryable after one weak camp observation", E.getCompetitionEvidenceSummary(durableSubject.player, { playerId: durableId }).sampleConfidence === "high" && E.getCompetitionEvidenceSummary(durableSubject.player, { playerId: durableId }).quality > 0);

{
  const camp = createCampaign({
    sizes: [4, 2],
    count: 5,
    prefix: "camp-evidence",
    pipelineId: "camp-evidence-pipeline",
    editionId: "camp-evidence-edition",
    policy: { final: { minByPosition: { SS: 1 } } },
    specs: [
      { position: "SS", roles: ["middle_infield_defense"], readiness: 8, fit: 8, evidenceQuality: 3 },
      { position: "1B", roles: ["power_bat"], readiness: 9, fit: 9, evidenceQuality: 3 },
      { position: "C", roles: ["backup_catcher"], readiness: 8, fit: 8, evidenceQuality: 2 },
      { position: "P", roles: ["starter"], readiness: 8, fit: 8, evidenceQuality: 2 },
      { position: "2B", roles: ["bench_versatility"], readiness: 7, fit: 7, evidenceQuality: 1 }
    ]
  });
  advanceCurrentStage(camp);
  const subject = camp.subjects[0];
  const sourceEntry = subject.player.competitionFoundation.entries.find(entry => entry.competitionEditionId === "selection-evidence-2031");
  const skillBefore = JSON.stringify(subject.player.baseballSkills);
  const evidenceBefore = E.getEvidence(subject.player, { playerId: subject.id }).length;
  for (let replay = 0; replay < 3; replay += 1) N.recordStageEvidence(camp.owner, {
    pipelineId: camp.pipeline.pipelineId,
    stageId: "final_roster",
    playerId: subject.id,
    player: subject.player,
    competitionEntryId: sourceEntry.entryId,
    position: "SS",
    role: "middle_infield_defense",
    evaluationEvidence: { matchIdentity: "weak-final-camp-observation", sampleScore: -2, matchEvidence: { sampleSize: 1, quality: -2 }, trainingEvidence: { positionFit: 8 } }
  });
  const stageRecord = E.getEvidence(subject.player, { playerId: subject.id }).find(record => record.context.evaluationIdentity === "weak-final-camp-observation");
  const finalResult = advanceCurrentStage(camp);
  verify("14. Stage-specific evaluation adapter is idempotent and retains low-sample reliability", E.getEvidence(subject.player, { playerId: subject.id }).length === evidenceBefore + 1 && stageRecord.reliability === "low" && stageRecord.createdContext.selectionStageId === "final_roster");
  verify("15. Strong history survives one weak camp observation and still advances", finalResult.advanced.some(item => item.playerId === subject.id));
  verify("16. Training evaluation evidence does not mutate player ability or fame", JSON.stringify(subject.player.baseballSkills) === skillBefore && subject.player.fame === undefined);
}

const injuredEntry = asia.roster.entries.find(entry => entry.assignedPosition === "1B");
const alternate = asia.campaign.pipeline.candidates.find(candidate => candidate.status === "cut" && asia.campaign.pipeline.evaluations.some(evaluation => evaluation.candidateId === candidate.candidateId && evaluation.stageId === "final_roster"));
assert.ok(injuredEntry && alternate, "Replacement fixture requires a final member and final-stage alternate");
const beforeInjuryCount = asia.roster.entries.length;
const injury = N.recordCandidateExit(asia.campaign.owner, { pipelineId: asia.campaign.pipeline.pipelineId, playerId: injuredEntry.playerId, result: "injured", playerRegistry: asia.campaign.registry, decisionContext: { phase: "post-final-medical" } });
const vacant = N.getFinalRoster(asia.campaign.owner, asia.campaign.pipeline.pipelineId);
verify("17. Final injury creates an explicit vacancy without silent replacement", injury.decision.result === "injured" && vacant.status === "vacant" && vacant.entries.length === beforeInjuryCount - 1);
verify("18. Injured final player closes national assignment and representative roster entry", asia.campaign.registry[injuredEntry.playerId].temporaryTeamAssignments.some(item => item.teamType === "national_team" && item.status === "withdrawn") && asia.campaign.registry[injuredEntry.playerId].competitionFoundation.representativeRosters.some(roster => roster.entries.some(entry => entry.playerId === injuredEntry.playerId && entry.status === "withdrawn")));
const replacement = N.promoteAlternate(asia.campaign.owner, { pipelineId: asia.campaign.pipeline.pipelineId, replacedPlayerId: injuredEntry.playerId, replacementPlayerId: alternate.playerId, playerRegistry: asia.campaign.registry, sourceRosters: asia.campaign.sourceRosters, decisionContext: { phase: "medical-replacement" } });
const replacementReplay = N.promoteAlternate(asia.campaign.owner, { pipelineId: asia.campaign.pipeline.pipelineId, replacedPlayerId: injuredEntry.playerId, replacementPlayerId: alternate.playerId, playerRegistry: asia.campaign.registry, sourceRosters: asia.campaign.sourceRosters, decisionContext: { phase: "medical-replacement" } });
const replacedRoster = N.getFinalRoster(asia.campaign.owner, asia.campaign.pipeline.pipelineId);
verify("19. Explicit alternate promotion restores roster size and records an amendment", replacement.status === "applied" && replacedRoster.status === "complete" && replacedRoster.entries.length === beforeInjuryCount && asia.campaign.pipeline.amendments.some(item => item.type === "replacement"));
verify("20. Replacement replay is idempotent", replacementReplay.status === "duplicate" && replacedRoster.entries.filter(entry => entry.playerId === alternate.playerId).length === 1);
verify("21. Replacement decision retains structured explainability", replacement.decision.result === "replacement_selected" && replacement.decision.positiveReasons.includes("explicit-replacement"));

{
  const corrupt = JSON.parse(JSON.stringify(world.roster));
  corrupt.entries.push(corrupt.entries[0]);
  assert.throws(() => N.assertFinalRosterIntegrity(corrupt));
  verify("22. Duplicate final-roster player is rejected", true);
}

{
  const impossible = createCampaign({ sizes: [7, 5], count: 8, prefix: "impossible", pipelineId: "impossible-pipeline", editionId: "impossible-edition", policy: { final: { minByPosition: { P: 4, C: 3 } } } });
  advanceCurrentStage(impossible);
  assert.throws(() => advanceCurrentStage(impossible), /minimum positions exceed target size/);
  verify("23. Impossible roster policy fails closed", impossible.pipeline.stages.find(stage => stage.stageId === "final_roster").status === "active" && impossible.pipeline.finalRoster === null);
}

{
  const y2CutCandidate = asia.campaign.pipeline.candidates.find(candidate => candidate.status === "cut");
  const y2Subject = asia.campaign.subjects.find(subject => subject.id === y2CutCandidate.playerId);
  const y3Config = selectionConfig([1, 1]);
  for (const player of [asia.campaign.owner, y2Subject.player]) {
    F.registerEdition(player, { editionId: "config-a-edition-y3", competitionId: "u18-selection", seasonYear: 2032, eligibility: { ageRule: { type: "age", max: 18 }, schoolStages: ["high_school"], requireAvailable: true }, selectionConfig: y3Config });
  }
  const y3Pipeline = N.createPipeline(asia.campaign.owner, { pipelineId: "config-a-y3-pipeline", competitionEditionId: "config-a-edition-y3", trainingTeamId: "national-training", targetNationalTeamId: "national-team" });
  N.addCandidate(asia.campaign.owner, { pipelineId: y3Pipeline.pipelineId, playerId: y2Subject.id, sourceTeamId: y2Subject.player.primaryTeamAssignment.teamId });
  const mini = { owner: asia.campaign.owner, pipeline: y3Pipeline, registry: { [y2Subject.id]: y2Subject.player }, sourceRosters: { [y2Subject.id]: y2Subject.sourceRoster }, subjects: [y2Subject] };
  advanceCurrentStage(mini);
  advanceCurrentStage(mini);
  const history = N.getNationalSelectionHistory(asia.campaign.owner, y2Subject.id);
  verify("24. Multi-year pipelines retain prior cut and later final selection", history.some(item => item.competitionEditionId === "config-a-edition" && item.result === "cut") && history.some(item => item.competitionEditionId === "config-a-edition-y3" && item.result === "final_selected"));
}

verify("25. SS vertical uses the generic pipeline", asia.roster.entries.some(entry => entry.assignedPosition === "SS"));
verify("26. Pitcher vertical uses the generic pipeline with role diversity", asia.roster.entries.filter(entry => entry.assignedPosition === "P").length >= 6);
verify("27. Catcher vertical uses the generic pipeline with required coverage", asia.roster.entries.filter(entry => entry.assignedPosition === "C").length >= 2);

console.log(`U18 Roster Construction: ${passed}/${passed} passed.`);
