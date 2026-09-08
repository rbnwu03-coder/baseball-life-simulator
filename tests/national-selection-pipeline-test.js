const assert = require("assert");
const { F, E, N, selectionConfig, createCampaign, evaluateCurrentStage, advanceCurrentStage } = require("./national-selection-fixture.cjs");
const { makeContext } = require("./high-school-career-test-context.js");

let passed = 0;
function verify(title, condition) { assert.ok(condition, title); passed += 1; console.log(`✓ ${title}`); }

{
  for (const sizes of [[36, 22, 18], [36, 24, 20], [12, 8, 5]]) {
    const policy = sizes[0] === 12 ? { final: { minByPosition: { P: 2, C: 1, SS: 1 }, requiredRoles: { starter: 1, reliever: 1 } } } : {};
    const campaign = createCampaign({ sizes, count: sizes[0] + 4, prefix: `config-${sizes.join("-")}`, pipelineId: `pipeline-${sizes.join("-")}`, editionId: `u18-${sizes.join("-")}`, policy });
    verify(`Config ${sizes.join("→")} creates stages directly from edition config`, campaign.pipeline.stages.map(stage => stage.targetRosterSize).join() === sizes.join());
  }
}

{
  const campaign = createCampaign({ sizes: [12, 8, 5], count: 14, prefix: "custom", policy: { shortlist: { minByPosition: { P: 2, C: 1, SS: 1 }, requiredRoles: { starter: 1, reliever: 1 } }, final: { minByPosition: { P: 2, C: 1, SS: 1 }, requiredRoles: { starter: 1, reliever: 1 } } }, specs: [
    ...Array.from({ length: 5 }, () => ({ position: "1B", positions: ["1B"], roles: ["power_bat"], readiness: 9, fit: 9, evidenceQuality: 3 })),
    { position: "P", roles: ["starter"], readiness: 8, fit: 8 }, { position: "P", roles: ["reliever"], readiness: 8, fit: 8 }, { position: "P", roles: ["multi_inning"], readiness: 7, fit: 7 },
    { position: "C", roles: ["starter_catcher"], readiness: 8, fit: 8 }, { position: "C", roles: ["backup_catcher"], readiness: 7, fit: 7 },
    { position: "SS", roles: ["middle_infield_defense"], readiness: 8, fit: 8 }, { position: "SS", roles: ["bench_versatility"], readiness: 7, fit: 7 },
    { position: "CF", roles: ["bench_versatility"], readiness: 7, fit: 7 }, { position: "2B", roles: ["bench_versatility"], readiness: 7, fit: 7 }
  ] });
  const firstCandidate = campaign.pipeline.candidates[0];
  N.addCandidate(campaign.owner, { pipelineId: campaign.pipeline.pipelineId, playerId: firstCandidate.playerId, sourceTeamId: firstCandidate.sourceTeamId });
  N.addCandidate(campaign.owner, { pipelineId: campaign.pipeline.pipelineId, playerId: firstCandidate.playerId, sourceTeamId: firstCandidate.sourceTeamId });
  verify("Candidate add replayed three times keeps one canonical identity", campaign.pipeline.candidates.filter(item => item.playerId === firstCandidate.playerId).length === 1);
  evaluateCurrentStage(campaign);
  evaluateCurrentStage(campaign);
  verify("Same candidate and stage re-evaluation creates revisions without duplicate candidate/evaluation identity", campaign.pipeline.evaluations.length === 14 && campaign.pipeline.evaluations.every(item => item.revisions.length === 2));
  const schoolBefore = JSON.stringify(campaign.subjects[0].player.primaryTeamAssignment);
  const initial = advanceCurrentStage(campaign);
  verify("Eligible evaluated candidates enter the config-sized initial pool", initial.advanced.length === 12 && initial.notSelected.length === 2);
  verify("Initial pool starts national_training assignments and preserves school identity", initial.advanced.every(decision => campaign.registry[decision.playerId].temporaryTeamAssignments.some(item => item.teamType === "national_training" && item.status === "active")) && JSON.stringify(campaign.subjects[0].player.primaryTeamAssignment) === schoolBefore);
  const replay = N.advanceSelectionStage(campaign.owner, { pipelineId: campaign.pipeline.pipelineId, stageId: "initial_pool", playerRegistry: campaign.registry, sourceRosters: campaign.sourceRosters });
  verify("Completed stage replay returns duplicate without duplicating decisions", replay.status === "duplicate" && campaign.pipeline.decisions.filter(item => item.stageId === "initial_pool").length === 14);
  const lockedSubject = campaign.subjects[0];
  assert.throws(() => N.evaluateCandidate(campaign.owner, {
    pipelineId: campaign.pipeline.pipelineId,
    stageId: "initial_pool",
    playerId: lockedSubject.id,
    player: lockedSubject.player,
    position: lockedSubject.spec.position,
    positions: lockedSubject.spec.positions || [lockedSubject.spec.position],
    roleTags: lockedSubject.spec.roles || [],
    positionEvaluation: lockedSubject.positionEvaluation,
    sourceCompetitionEditionId: "selection-evidence-2031",
    nationalRosterNeed: {}
  }), /locked/);
  assert.throws(() => N.addCandidate(campaign.owner, { pipelineId: campaign.pipeline.pipelineId, playerId: "late-candidate", sourceTeamId: "late-school" }), /locked/);
  verify("Completed stage locks evaluation and ordinary late candidate admission", true);
  const shortlist = advanceCurrentStage(campaign);
  verify("Shortlist creates formal advance and cut decisions with history", shortlist.advanced.length === 8 && shortlist.cut.length === 4 && shortlist.decisions.every(item => item.positiveReasons.length || item.concerns.length));
  verify("Shortlist cuts remain distinct and complete their training assignment", shortlist.cut.every(decision => campaign.pipeline.candidates.find(item => item.playerId === decision.playerId).status === "cut" && campaign.registry[decision.playerId].temporaryTeamAssignments.some(item => item.teamType === "national_training" && item.status === "completed")));
  const final = advanceCurrentStage(campaign);
  verify("Final selection transitions training assignments to active national_team assignments", final.advanced.length === 5 && final.advanced.every(decision => campaign.registry[decision.playerId].temporaryTeamAssignments.some(item => item.teamType === "national_training" && item.status === "completed") && campaign.registry[decision.playerId].temporaryTeamAssignments.some(item => item.teamType === "national_team" && item.status === "active")));
  verify("Final roster and decisions retain identity-only player references", N.getFinalRoster(campaign.owner, campaign.pipeline.pipelineId).entries.every(entry => !Object.hasOwn(entry, "capability") && !Object.hasOwn(entry, "fielding") && !Object.hasOwn(entry, "power")));
  verify("Primary school identity survives every national assignment transition", campaign.subjects.every(subject => subject.player.primaryTeamAssignment.teamId === subject.sourceRoster.teamId));
  const corruptedCandidateState = JSON.parse(JSON.stringify(campaign.owner.nationalSelectionState));
  corruptedCandidateState.pipelines[0].candidates[0].power = 99;
  assert.throws(() => N.normalizeState(corruptedCandidateState), /identity and lifecycle/);
  verify("Candidate state rejects copied capability fields", true);
}

{
  const config = selectionConfig([2, 1]);
  const campaign = createCampaign({ sizes: [2, 1], count: 3, prefix: "eligibility", pipelineId: "eligibility-pipeline", editionId: "u18-eligibility" });
  campaign.subjects[0].player.age = 20;
  evaluateCurrentStage(campaign);
  const profile = N.getCandidateProfile(campaign.owner, campaign.pipeline.pipelineId, campaign.subjects[0].id, "initial_pool");
  const result = N.advanceSelectionStage(campaign.owner, { pipelineId: campaign.pipeline.pipelineId, playerRegistry: campaign.registry, sourceRosters: campaign.sourceRosters });
  verify("Ineligible candidate is blocked even with strong capability and evidence", profile.recommendation === "ineligible" && result.notSelected.some(item => item.playerId === campaign.subjects[0].id));
}

{
  const campaign = createCampaign({ sizes: [4, 3, 2], count: 5, prefix: "exit", pipelineId: "exit-pipeline", editionId: "u18-exit" });
  advanceCurrentStage(campaign);
  const activeIds = campaign.pipeline.candidates.filter(item => item.status === "active").map(item => item.playerId);
  const injured = N.recordCandidateExit(campaign.owner, { pipelineId: campaign.pipeline.pipelineId, playerId: activeIds[0], result: "injured", playerRegistry: campaign.registry, decisionContext: { reason: "camp-injury" } });
  const withdrawn = N.recordCandidateExit(campaign.owner, { pipelineId: campaign.pipeline.pipelineId, playerId: activeIds[1], result: "withdrawn", playerRegistry: campaign.registry, decisionContext: { reason: "personal" } });
  verify("Injury and withdrawal are separate canonical outcomes", injured.decision.result === "injured" && injured.decision.concerns.includes("unavailable:injured") && withdrawn.decision.result === "withdrawn" && withdrawn.decision.concerns.includes("unavailable:withdrawn"));
  verify("Exited candidates are not silently relabeled as cuts", !campaign.pipeline.decisions.some(item => activeIds.includes(item.playerId) && item.stageId === campaign.pipeline.currentStageId && item.result === "cut"));
}

{
  const { run, json } = makeContext();
  run(`
    player=createInitialPlayer("national-save-player");player.age=17;player.schoolStage="high_school";player.available=true;player.primaryPosition="SS";
    HighSchoolCompetitionFoundation.assignPrimarySchool(player,{teamId:"national-save-school",organizationId:"national-save-school",teamType:"school"});
    HighSchoolCompetitionFoundation.registerDefinition(player,{competitionId:"national-save-source",competitionType:"selection_tournament",entryUnit:"school",level:"national_selection"});
    HighSchoolCompetitionFoundation.registerEdition(player,{editionId:"national-save-source-2031",competitionId:"national-save-source",seasonYear:2031});
    var nationalSaveSourceEntry=HighSchoolCompetitionFoundation.enterCompetition(player,{competitionEditionId:"national-save-source-2031",teamId:"national-save-school"});
    HighSchoolCompetitionFoundation.recordParticipation(player,{playerId:"player",competitionEditionId:"national-save-source-2031",teamId:"national-save-school",rosterStatus:"active_roster",participationStatus:"appeared"});
    for(var nationalEvidenceIndex=0;nationalEvidenceIndex<3;nationalEvidenceIndex++)HighSchoolCompetitionEvidence.integrateEvaluationEvidence(player,{playerId:"player",competitionEntryId:nationalSaveSourceEntry.entryId,position:"SS",evaluationEvidence:{matchIdentity:"national-save-evidence-"+nationalEvidenceIndex,sampleScore:2,matchEvidence:{sampleSize:3,quality:2},trainingEvidence:{positionFit:8}}});
    HighSchoolCompetitionFoundation.registerDefinition(player,{competitionId:"national-save-target",competitionType:"international",entryUnit:"national_team",level:"international_u18"});
    HighSchoolCompetitionFoundation.registerEdition(player,{editionId:"national-save-target-2031",competitionId:"national-save-target",seasonYear:2031,eligibility:{ageRule:{type:"age",max:18}},selectionConfig:{stages:[{stageId:"initial_pool",stageType:"training_pool",targetRosterSize:1,teamType:"national_training"},{stageId:"final_roster",stageType:"final_roster",targetRosterSize:1,teamType:"national_team",rosterPolicy:{minByPosition:{SS:1}}}]}});
    HighSchoolCompetitionFoundation.registerTeam(player,{teamId:"national-save-training",organizationId:"national",teamType:"national_training"});
    HighSchoolCompetitionFoundation.registerTeam(player,{teamId:"national-save-team",organizationId:"national",teamType:"national_team"});
    var nationalSavePipeline=NationalSelectionPipeline.createPipeline(player,{pipelineId:"national-save-pipeline",competitionEditionId:"national-save-target-2031",trainingTeamId:"national-save-training",targetNationalTeamId:"national-save-team"});
    NationalSelectionPipeline.addCandidate(player,{pipelineId:nationalSavePipeline.pipelineId,playerId:"player",sourceTeamId:"national-save-school"});
    function nationalSaveEvaluate(stageId){return NationalSelectionPipeline.evaluateCandidate(player,{pipelineId:nationalSavePipeline.pipelineId,stageId,playerId:"player",player,position:"SS",positions:["SS"],roleTags:["middle_infield_defense"],positionEvaluation:{version:"opportunity-readiness-v1",playerId:"player",position:"SS",positionReadiness:8,positionFit:8,fieldingReadiness:8,reactionReadiness:8,decisionReadiness:8},sourceCompetitionEditionId:"national-save-source-2031",nationalRosterNeed:{neededPositions:["SS"]}});}
    nationalSaveEvaluate("initial_pool");NationalSelectionPipeline.advanceSelectionStage(player,{pipelineId:nationalSavePipeline.pipelineId,playerRegistry:{player},sourceRosters:{player:{teamId:"national-save-school",players:[{playerId:"player"}]}}});
    var nationalShortlistSnapshot=JSON.stringify(player.nationalSelectionState);saveGame();player=createInitialPlayer();loadGame();
  `);
  verify("Pipeline at final-stage entry survives real save/load unchanged", json("JSON.stringify(player.nationalSelectionState)") === json("nationalShortlistSnapshot"));
  run(`
    nationalSavePipeline=player.nationalSelectionState.pipelines[0];nationalSaveEvaluate("final_roster");NationalSelectionPipeline.advanceSelectionStage(player,{pipelineId:nationalSavePipeline.pipelineId,playerRegistry:{player},sourceRosters:{player:{teamId:"national-save-school",players:[{playerId:"player"}]}}});
    var nationalFinalSnapshot=JSON.stringify(player.nationalSelectionState);saveGame();player=createInitialPlayer();loadGame();
  `);
  verify("Final roster and national assignment survive real save/load unchanged", json("JSON.stringify(player.nationalSelectionState)") === json("nationalFinalSnapshot") && json("player.temporaryTeamAssignments").some(item => item.teamType === "national_team" && item.status === "active"));
  run("initializeHighSchoolYearTransition(2)");
  verify("Year transition retains national selection history", json("JSON.stringify(player.nationalSelectionState)") === json("nationalFinalSnapshot"));
  run("var legacyNational=createInitialPlayer('legacy-national');legacyNational=normalizeSave(legacyNational);");
  verify("Legacy save initializes an empty canonical national selection state", json("legacyNational.nationalSelectionState.pipelines").length === 0);
}

console.log(`National Selection Pipeline: ${passed}/${passed} passed.`);
