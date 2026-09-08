const assert = require("assert");
const F = require("../high-school-competition-foundation.js");
const E = require("../high-school-competition-evidence.js");
const { makeContext } = require("./high-school-career-test-context.js");

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function fixture(playerId = "player", participationStatus = "appeared") {
  const player = { age: 17, schoolStage: "high_school", available: true, primaryPosition: "SS" };
  F.assignPrimarySchool(player, { teamId: "school-a", organizationId: "school-a", teamType: "school" });
  F.registerDefinition(player, {
    competitionId: "school-series",
    competitionType: "school_tournament",
    entryUnit: "school",
    level: "high_school",
    selectionRelevance: { level: "high" }
  });
  F.registerEdition(player, {
    editionId: "school-series-2031",
    competitionId: "school-series",
    seasonYear: 2031,
    selectionConfig: { exposureWeight: 1.15 }
  });
  const entry = F.enterCompetition(player, { competitionEditionId: "school-series-2031", teamId: "school-a" });
  F.recordParticipation(player, {
    playerId,
    competitionEditionId: entry.competitionEditionId,
    teamId: entry.teamId,
    rosterStatus: participationStatus === "appeared" ? "active_roster" : "reserve",
    participationStatus
  });
  E.restorePlayer(player);
  return { player, entry, playerId };
}

function sourceEvidence(id, options = {}) {
  return {
    evidenceId: id,
    participationType: options.participationType || "batter",
    experienceQuality: options.experienceQuality || "good",
    situation: options.situation || {},
    sourceSnapshot: options.sourceSnapshot || {},
    skillEvidence: { targetSkill: options.targetSkill || "batting", baseValue: options.value ?? 2, adjustedValue: options.value ?? 2 },
    decisionEvidence: { quality: options.decisionQuality || "acceptable" },
    executionEvidence: { quality: options.executionQuality || "normal" }
  };
}

function match(id, evidence) {
  return { id, completed: true, position: "SS", role: "starter", matchExperience: { finalized: true, evidence } };
}

{
  const { player, entry, playerId } = fixture("reserve-player", "none");
  const before = E.getEvidence(player).length;
  const result = E.integrateMatchEvidence(player, {
    playerId, competitionEntryId: entry.entryId, match: match("reserve-match", [sourceEvidence("reserve-source")])
  });
  verify("1. Team entry and reserve/no appearance do not create performance evidence", result.status === "no-appearance" && E.getEvidence(player).length === before);
}

{
  const { player, entry, playerId } = fixture();
  const result = E.integrateMatchEvidence(player, {
    playerId, competitionEntryId: entry.entryId, position: "SS", role: "starter",
    match: match("formal-match", [
      sourceEvidence("pa-source", { sourceSnapshot: { plateAppearances: 2 } }),
      sourceEvidence("defense-source", { participationType: "cover", targetSkill: "reaction", sourceSnapshot: { defensiveInnings: 4 } })
    ])
  });
  const record = result.records[0];
  verify("2. Appeared player receives competition-wrapped canonical match evidence", result.status === "applied" && result.records.length === 2);
  verify("3. Evidence preserves player, edition, entry, team, role, position, sample, performance and reliability", record.playerId === playerId && record.competitionEditionId === entry.competitionEditionId && record.competitionEntryId === entry.entryId && record.teamId === entry.teamId && record.position === "SS" && record.role === "starter" && record.sample.count === 2 && typeof record.performance.value === "number" && record.reliability === "low");
  verify("4. Evidence references canonical edition identity without copying tournament definition", !Object.hasOwn(record, "competitionName") && !Object.hasOwn(record, "competitionType") && E.getCompetitionContext(player, record.competitionEditionId).competitionType === "school_tournament");
  for (let index = 0; index < 2; index += 1) E.integrateMatchEvidence(player, { playerId, competitionEntryId: entry.entryId, position: "SS", role: "starter", match: match("formal-match", [sourceEvidence("pa-source", { sourceSnapshot: { plateAppearances: 2 } }), sourceEvidence("defense-source", { participationType: "cover", targetSkill: "reaction", sourceSnapshot: { defensiveInnings: 4 } })]) });
  verify("5. Replaying the same match adapter three times remains idempotent", E.getEvidence(player).length === 2);
  verify("6. Competition context exposes config-driven selection relevance and weight", E.getCompetitionContext(player, entry.competitionEditionId).exposureWeight === 1.15);
  verify("7. Evidence adapter never changes capability or fame fields", player.fame === undefined && player.baseballSkills === undefined);
  verify("8. Evidence integrity validates canonical edition and entry references", E.assertIntegrity(player) === true);
}

{
  const { player, entry, playerId } = fixture();
  E.integrateMatchEvidence(player, {
    playerId, competitionEntryId: entry.entryId,
    match: match("one-pa", [sourceEvidence("one-pa-source", { sourceSnapshot: { plateAppearances: 1 }, value: 8, decisionQuality: "strong", executionQuality: "strong" })])
  });
  verify("9. One high-value PA remains low confidence", E.getCompetitionEvidenceSummary(player, { playerId }).sampleConfidence === "low");
}

{
  const { player, entry, playerId } = fixture();
  for (let index = 1; index <= 3; index += 1) {
    E.integrateEvaluationEvidence(player, {
      playerId, competitionEntryId: entry.entryId, position: "SS", role: "starter",
      evaluationEvidence: {
        matchIdentity: `evaluation-match-${index}`,
        sampleScore: 2,
        matchEvidence: { sampleSize: 3, quality: 2 },
        trainingEvidence: { positionFit: 8 }
      },
      createdContext: { sequence: index }
    });
  }
  const summary = E.getCompetitionEvidenceSummary(player, { playerId });
  verify("10. Multiple formal samples raise confidence deterministically", summary.totalSample === 9 && summary.sampleConfidence === "high");
  verify("11. Evaluation adapter reuses canonical evaluation identity", summary.records.every(item => item.sourceType === "evaluation" && item.context.evaluationIdentity));
  const restored = JSON.parse(JSON.stringify(player));
  E.restorePlayer(restored);
  verify("12. Evidence identity and content survive serialized restore", JSON.stringify(restored.competitionEvidenceState) === JSON.stringify(player.competitionEvidenceState));
}

{
  const { run, json } = makeContext();
  run(`
    careerFixture("游擊手","rotation",88021);
    var productionSchoolId=player.primaryTeamAssignment.teamId;
    HighSchoolCompetitionFoundation.registerDefinition(player,{competitionId:"production-school-series",competitionType:"school_tournament",entryUnit:"school",level:"high_school",selectionRelevance:{level:"high"}});
    HighSchoolCompetitionFoundation.registerEdition(player,{editionId:"production-school-2033",competitionId:"production-school-series",seasonYear:2033});
    var productionEntry=HighSchoolCompetitionFoundation.enterCompetition(player,{competitionEditionId:"production-school-2033",teamId:productionSchoolId});
    HighSchoolCompetitionFoundation.recordParticipation(player,{playerId:"player",competitionEditionId:"production-school-2033",teamId:productionSchoolId,rosterStatus:"active_roster",participationStatus:"appeared"});
    player.highSchoolMatch.competitionEditionId="production-school-2033";
    player.highSchoolMatch.competitionEntryId=productionEntry.entryId;
    player.highSchoolMatch.competitionTeamId=productionSchoolId;
    finishCareerMatch("strong",true);
  `);
  verify("13. Production match settlement automatically wraps formal Match Experience evidence", json("player.competitionEvidenceState.records").length > 0 && json("player.highSchoolMatch.matchExperience").finalized === true);
  verify("14. Production integration retains the canonical match evidence source IDs", json("player.competitionEvidenceState.records").every(item => item.context.matchId === json("player.highSchoolMatch.id") && item.context.sourceEvidenceId));
}

console.log(`High School Competition Evidence: ${passed}/${passed} passed.`);
