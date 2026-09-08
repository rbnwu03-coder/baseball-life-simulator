const assert = require("assert");
const F = require("../high-school-competition-foundation.js");
const E = require("../high-school-competition-evidence.js");
const C = require("../county-selection-opportunity.js");
const { makeContext } = require("./high-school-career-test-context.js");

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function fixture(playerId = "player", position = "SS") {
  const player = { age: 17, schoolStage: "high_school", available: true, primaryPosition: position };
  F.assignPrimarySchool(player, { teamId: "school-a", organizationId: "school-a", teamType: "school" });
  F.registerDefinition(player, { competitionId: "school-series", competitionType: "school_tournament", entryUnit: "school", level: "high_school", selectionRelevance: { level: "high" } });
  F.registerEdition(player, { editionId: "school-2031", competitionId: "school-series", seasonYear: 2031, selectionConfig: { exposureWeight: 1.1 } });
  const sourceEntry = F.enterCompetition(player, { competitionEditionId: "school-2031", teamId: "school-a" });
  F.recordParticipation(player, { playerId, competitionEditionId: "school-2031", teamId: "school-a", rosterStatus: "active_roster", participationStatus: "appeared" });
  F.registerDefinition(player, { competitionId: "county-selection", competitionType: "selection_tournament", entryUnit: "county_representative", level: "national_selection", selectionRelevance: { level: "high" } });
  F.registerTeam(player, { teamId: "county-a", organizationId: "county-a", teamType: "county_representative" });
  for (const year of [2031, 2032, 2033]) F.registerEdition(player, { editionId: `county-${year}`, competitionId: "county-selection", seasonYear: year, eligibility: { ageRule: { type: "age", max: 18 }, schoolStages: ["high_school"], requireAvailable: true } });
  F.enterCompetition(player, { competitionEditionId: "county-2031", teamId: "county-a" });
  E.restorePlayer(player);
  C.restorePlayer(player);
  return { player, playerId, position, sourceEntry, sourceRoster: { teamId: "school-a", players: [{ playerId }] } };
}

function readiness(playerId, position, value = 8, fit = 8) {
  return { version: "opportunity-readiness-v1", playerId, position, requestedPosition: position, positionReadiness: value, positionFit: fit, fieldingReadiness: value, reactionReadiness: value, decisionReadiness: value };
}

function addEvidence(subject, values) {
  values.forEach((value, index) => E.integrateEvaluationEvidence(subject.player, {
    playerId: subject.playerId,
    competitionEntryId: subject.sourceEntry.entryId,
    position: subject.position,
    role: subject.position === "P" ? "pitcher" : "starter",
    evaluationEvidence: { matchIdentity: `${subject.playerId}-${subject.position}-evidence-${index}-${values.length}`, sampleScore: value, matchEvidence: { sampleSize: 3, quality: value }, trainingEvidence: { positionFit: 8 } },
    createdContext: { sequence: index + 1 }
  }));
}

function evaluationInput(subject, overrides = {}) {
  return {
    playerId: subject.playerId,
    countyTeamId: "county-a",
    targetCompetitionEditionId: overrides.targetCompetitionEditionId || "county-2031",
    sourceSchoolTeamId: "school-a",
    sourceCompetitionEditionId: "school-2031",
    position: subject.position,
    positionEvaluation: overrides.positionEvaluation || readiness(subject.playerId, subject.position),
    rosterNeed: overrides.rosterNeed || { neededPositions: [subject.position], depthByPosition: { [subject.position]: 0 }, roleNeed: { [subject.position]: true } },
    eligibilityPlayer: overrides.eligibilityPlayer || subject.player,
    evaluationContext: overrides.evaluationContext || {}
  };
}

{
  const subject = fixture("ineligible", "SS");
  addEvidence(subject, [3, 3, 3]);
  const result = C.evaluateOpportunity(subject.player, evaluationInput(subject, { eligibilityPlayer: { ...subject.player, age: 20 } }));
  verify("1. Canonical competition eligibility blocks selection", result.profile.recommendation === "ineligible" && result.opportunity.status === "not_selected");
  verify("2. Eligibility concern is structured and queryable", result.profile.concerns.includes("eligibility:outside-age-window"));
}

{
  const shortstop = fixture("shortstop-a", "SS");
  const infielder = fixture("infielder-b", "2B");
  addEvidence(shortstop, [2, 2, 2]);
  addEvidence(infielder, [2, 2, 2]);
  const a = C.evaluateOpportunity(shortstop.player, evaluationInput(shortstop, { rosterNeed: { neededPositions: ["SS"], depthByPosition: { SS: 0 } } }));
  const b = C.evaluateOpportunity(infielder.player, evaluationInput(infielder, { rosterNeed: { neededPositions: ["SS"], depthByPosition: { "2B": 3 } } }));
  verify("3. Similar capability can produce different opportunity through county position need", a.profile.evaluationScore > b.profile.evaluationScore && a.profile.teamNeedFit > b.profile.teamNeedFit);
  verify("4. Position need reason explains the stronger shortstop recommendation", a.profile.positiveReasons.includes("county-position-need") && b.profile.concerns.includes("limited-county-roster-need"));
}

{
  const reliable = fixture("reliable-a", "SS");
  const small = fixture("small-b", "SS");
  addEvidence(reliable, [2, 2, 2]);
  E.integrateEvaluationEvidence(small.player, {
    playerId: small.playerId,
    competitionEntryId: small.sourceEntry.entryId,
    position: small.position,
    role: "starter",
    evaluationEvidence: { matchIdentity: "small-b-one-observation", sampleScore: 4, matchEvidence: { sampleSize: 1, quality: 4 }, trainingEvidence: { positionFit: 8 } }
  });
  const a = C.evaluateOpportunity(reliable.player, evaluationInput(reliable));
  const b = C.evaluateOpportunity(small.player, evaluationInput(small));
  const rank = { ineligible: 0, decline: 1, observe: 2, candidate: 3, select: 4 };
  verify("5. Reliable competition evidence strengthens opportunity over a small sample", rank[a.profile.recommendation] > rank[b.profile.recommendation]);
  verify("6. One excellent game is observation, never automatic selection", b.profile.sampleConfidence === "low" && b.profile.recommendation === "observe");
}

{
  const oneGame = fixture("one-game", "SS");
  E.integrateEvaluationEvidence(oneGame.player, { playerId: oneGame.playerId, competitionEntryId: oneGame.sourceEntry.entryId, position: "SS", role: "starter", evaluationEvidence: { matchIdentity: "one-pa-home-run", sampleScore: 8, matchEvidence: { sampleSize: 1, quality: 8 }, trainingEvidence: { positionFit: 8 } } });
  const result = C.evaluateOpportunity(oneGame.player, evaluationInput(oneGame));
  verify("7. One-PA high-prestige result remains under observation", result.profile.sampleConfidence === "low" && result.profile.recommendation === "observe");
}

{
  const durable = fixture("durable", "SS");
  addEvidence(durable, [3, 3, 3, -2]);
  const result = C.evaluateOpportunity(durable.player, evaluationInput(durable));
  verify("8. Strong accumulated evidence survives one weak recent result", ["candidate", "select"].includes(result.profile.recommendation));
  verify("9. Profile exposes capability, evidence, confidence, recent trend, need, recommendation and reasons", result.profile.capabilitySummary.sourceVersion && result.profile.competitionEvidenceSummary.recordCount === 4 && result.profile.sampleConfidence && result.profile.recentTrend && result.profile.teamNeed && Array.isArray(result.profile.positiveReasons) && Array.isArray(result.profile.concerns));
}

{
  const rejected = fixture("rejected", "SS");
  const evaluated = C.evaluateOpportunity(rejected.player, evaluationInput(rejected));
  const decided = C.recordSelectionDecision(rejected.player, { opportunityId: evaluated.opportunity.opportunityId, decision: "not_selected", decisionContext: { highSchoolYear: 1 } });
  verify("10. Not selected is a canonical retained decision", decided.opportunity.status === "not_selected" && decided.opportunity.decision.result === "not_selected" && decided.opportunity.decision.concerns.length > 0);
}

{
  const selected = fixture("player", "SS");
  addEvidence(selected, [3, 3, 3]);
  const primaryBefore = JSON.stringify(selected.player.primaryTeamAssignment);
  const evaluated = C.evaluateOpportunity(selected.player, evaluationInput(selected));
  const first = C.recordSelectionDecision(selected.player, { opportunityId: evaluated.opportunity.opportunityId, decision: "selected", sourceRoster: selected.sourceRoster, rosterRole: "shortstop" });
  const second = C.recordSelectionDecision(selected.player, { opportunityId: evaluated.opportunity.opportunityId, decision: "selected", sourceRoster: selected.sourceRoster, rosterRole: "shortstop" });
  verify("11. Selected decision bridges through Sprint 1 assignment and representative roster APIs", first.opportunity.status === "selected" && selected.player.temporaryTeamAssignments.length === 1 && selected.player.competitionFoundation.representativeRosters[0].entries.length === 1);
  verify("12. County bridge preserves the primary school identity", JSON.stringify(selected.player.primaryTeamAssignment) === primaryBefore);
  verify("13. Replayed decision creates no duplicate assignment, roster entry or opportunity", second.status === "duplicate" && selected.player.temporaryTeamAssignments.length === 1 && selected.player.competitionFoundation.representativeRosters[0].entries.length === 1 && C.getOpportunities(selected.player).length === 1);
  verify("14. Representative roster keeps identity references without capability copies", Object.keys(selected.player.competitionFoundation.representativeRosters[0].entries[0]).sort().join() === "playerId,rosterRole,sourceTeamId,status");
  verify("15. Selected opportunity passes domain integrity", C.assertIntegrity(selected.player) === true && F.assertIntegrity(selected.player) === true);
}

{
  const history = fixture("history-player", "SS");
  let y1 = C.evaluateOpportunity(history.player, evaluationInput(history, { targetCompetitionEditionId: "county-2031", evaluationContext: { highSchoolYear: 1 } }));
  addEvidence(history, [1, 1]);
  let y2 = C.evaluateOpportunity(history.player, evaluationInput(history, { targetCompetitionEditionId: "county-2032", evaluationContext: { highSchoolYear: 2 } }));
  addEvidence(history, [2]);
  let y3 = C.evaluateOpportunity(history.player, evaluationInput(history, { targetCompetitionEditionId: "county-2033", evaluationContext: { highSchoolYear: 3 } }));
  y3 = C.recordSelectionDecision(history.player, { opportunityId: y3.opportunity.opportunityId, decision: "selected", sourceRoster: history.sourceRoster, rosterRole: "shortstop", decisionContext: { highSchoolYear: 3 } });
  verify("16. Y1 observation, Y2 candidate and Y3 selected remain distinct retained history", y1.opportunity.status === "under_observation" && y2.opportunity.status === "candidate" && y3.opportunity.status === "selected" && new Set([y1.opportunity.opportunityId, y2.opportunity.opportunityId, y3.opportunity.opportunityId]).size === 3 && C.getOpportunities(history.player).length === 3);
  const updated = C.evaluateOpportunity(history.player, evaluationInput(history, { targetCompetitionEditionId: "county-2032", evaluationContext: { highSchoolYear: 2, phase: "final" } }));
  verify("17. Same-year reevaluation updates one opportunity with a revision", C.getOpportunities(history.player).length === 3 && updated.opportunity.evaluationHistory.length === 2);
}

{
  const shortstop = fixture("vertical-ss", "SS");
  const pitcher = fixture("vertical-p", "P");
  addEvidence(shortstop, [2, 2, 2]);
  addEvidence(pitcher, [2, 2, 2]);
  const ss = C.evaluateOpportunity(shortstop.player, evaluationInput(shortstop));
  const p = C.evaluateOpportunity(pitcher.player, evaluationInput(pitcher));
  verify("18. SS vertical consumes defensive fit and shortstop need", ss.profile.position === "SS" && ss.profile.positiveReasons.includes("county-position-need"));
  verify("19. Pitcher vertical uses the same generic selection adapter", p.profile.position === "P" && ["candidate", "select"].includes(p.profile.recommendation));
}

{
  const { run, json } = makeContext();
  run(`
    player=createInitialPlayer("save-player");
    player.age=17;player.schoolStage="high_school";player.available=true;player.primaryPosition="SS";
    HighSchoolCompetitionFoundation.assignPrimarySchool(player,{teamId:"save-school",organizationId:"save-school",teamType:"school"});
    HighSchoolCompetitionFoundation.registerDefinition(player,{competitionId:"save-source",competitionType:"school_tournament",entryUnit:"school",level:"high_school",selectionRelevance:{level:"high"}});
    HighSchoolCompetitionFoundation.registerEdition(player,{editionId:"save-source-2031",competitionId:"save-source",seasonYear:2031});
    var saveEntry=HighSchoolCompetitionFoundation.enterCompetition(player,{competitionEditionId:"save-source-2031",teamId:"save-school"});
    HighSchoolCompetitionFoundation.recordParticipation(player,{playerId:"player",competitionEditionId:"save-source-2031",teamId:"save-school",rosterStatus:"active_roster",participationStatus:"appeared"});
    HighSchoolCompetitionFoundation.registerDefinition(player,{competitionId:"save-county",competitionType:"selection_tournament",entryUnit:"county_representative",level:"national_selection"});
    HighSchoolCompetitionFoundation.registerEdition(player,{editionId:"save-county-2031",competitionId:"save-county",seasonYear:2031,eligibility:{ageRule:{type:"age",max:18}}});
    HighSchoolCompetitionFoundation.registerTeam(player,{teamId:"save-county-team",organizationId:"save-county-team",teamType:"county_representative"});
    HighSchoolCompetitionEvidence.integrateEvaluationEvidence(player,{playerId:"player",competitionEntryId:saveEntry.entryId,position:"SS",role:"starter",evaluationEvidence:{matchIdentity:"save-evaluation",sampleScore:2,matchEvidence:{sampleSize:3,quality:2},trainingEvidence:{positionFit:8}}});
    var saveEvaluation=CountySelectionOpportunity.evaluateOpportunity(player,{playerId:"player",countyTeamId:"save-county-team",targetCompetitionEditionId:"save-county-2031",sourceSchoolTeamId:"save-school",sourceCompetitionEditionId:"save-source-2031",position:"SS",positionEvaluation:{version:"opportunity-readiness-v1",playerId:"player",position:"SS",positionReadiness:8,positionFit:8,fieldingReadiness:8,reactionReadiness:8,decisionReadiness:8},rosterNeed:{neededPositions:["SS"],depthByPosition:{SS:0}}});
    CountySelectionOpportunity.recordSelectionDecision(player,{opportunityId:saveEvaluation.opportunity.opportunityId,decision:"not_selected",decisionContext:{highSchoolYear:1}});
    var sprint2BeforeSave={evidence:JSON.stringify(player.competitionEvidenceState),selection:JSON.stringify(player.countySelectionState)};
    saveGame();player=createInitialPlayer();loadGame();
  `);
  const before = json("sprint2BeforeSave");
  verify("20. Real save/load preserves evidence and selection identity, reasons and decision", JSON.stringify(json("player.competitionEvidenceState")) === before.evidence && JSON.stringify(json("player.countySelectionState")) === before.selection);
  run("initializeHighSchoolYearTransition(2)");
  verify("21. Year transition preserves historical selection state", JSON.stringify(json("player.countySelectionState")) === before.selection);
  run("var legacySprint2=createInitialPlayer('legacy');legacySprint2=normalizeSave(legacySprint2);");
  verify("22. Legacy saves restore empty canonical Sprint 2 states without invented history", json("legacySprint2.competitionEvidenceState.records").length === 0 && json("legacySprint2.countySelectionState.opportunities").length === 0);
}

console.log(`County Selection Opportunity: ${passed}/${passed} passed.`);
