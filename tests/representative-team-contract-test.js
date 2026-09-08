const assert = require("assert");
const F = require("../high-school-competition-foundation.js");
const R = require("../team-roster-foundation.js");
const { makeContext } = require("./high-school-career-test-context.js");
const { run, json } = makeContext();
run(`
  player = createRepresentativeHighSchoolEntryFixture("ordinary", 9123);
  player.schoolInvitationState = createDefaultSchoolInvitationState();
  var invitations = generateSchoolInvitationSet(player, { generationSeed: "competition-contract" });
  finalizeSchoolInvitationSelection(player, invitations.invitations[0].schoolId);
  materializeSelectedHighSchoolRoster(player, { rosterRole: "bench", playerPosition: "SS" });
`);
const originalPrimary = json("player.primaryTeamAssignment");
const originalRoster = json("player.schoolInvitationState.selectedSchoolRoster");
run(`
  var F = HighSchoolCompetitionFoundation;
  F.registerDefinition(player, { competitionId: "school-test", competitionType: "school_league", entryUnit: "school", level: "high_school" });
  F.registerEdition(player, { editionId: "school-2031", competitionId: "school-test", seasonYear: 2031 });
  F.enterCompetition(player, { competitionEditionId: "school-2031", teamId: player.primaryTeamAssignment.teamId });
  F.registerDefinition(player, { competitionId: "county-test", competitionType: "selection_tournament", entryUnit: "county_representative", level: "national_selection" });
  F.registerEdition(player, { editionId: "county-2031", competitionId: "county-test", seasonYear: 2031 });
  F.registerTeam(player, { teamId: "county-a", organizationId: "county-a", teamType: "county_representative" });
  for (var i = 0; i < 3; i++) {
    F.enterCompetition(player, { competitionEditionId: "county-2031", teamId: "county-a" });
    F.startTemporaryAssignment(player, { assignmentId: "county-selection", teamId: "county-a", competitionEditionId: "county-2031", startContext: { highSchoolYear: 1 } });
    F.addRepresentativeRosterEntry(player, { teamId: "county-a", competitionEditionId: "county-2031", playerId: "player", sourceTeamId: player.primaryTeamAssignment.teamId }, player.schoolInvitationState.selectedSchoolRoster);
  }
`);
assert.deepStrictEqual(json("player.primaryTeamAssignment"), originalPrimary);
assert.deepStrictEqual(json("player.schoolInvitationState.selectedSchoolRoster"), originalRoster);
assert.equal(json("player.temporaryTeamAssignments").length, 1);
assert.equal(json("player.competitionFoundation.entries").length, 2);
assert.equal(json("F.getActiveAssignments(player)").length, 1);
const beforeSave = json("player");
run("saveGame(); player = createInitialPlayer(); loadGame();");
assert.deepStrictEqual(json("player.primaryTeamAssignment"), originalPrimary);
for (const field of ["temporaryTeamAssignments", "competitionFoundation"]) assert.deepStrictEqual(json(`player.${field}`), beforeSave[field]);
run("initializeHighSchoolYearTransition(2);");
assert.deepStrictEqual(json("player.primaryTeamAssignment"), originalPrimary);
run("F.completeEdition(player, 'county-2031', { highSchoolYear: 2 }); initializeHighSchoolYearTransition(3); initializeHighSchoolYearTransition(3);");
assert.equal(json("F.getActiveAssignments(player)").length, 0);
assert.equal(json("F.getHistoricalAssignments(player)").length, 1);
assert.equal(json("player.temporaryTeamAssignments[0].status"), "completed");
run("F.startTemporaryAssignment(player, { assignmentId: 'county-selection', teamId: 'county-a', competitionEditionId: 'county-2031' }); saveGame(); loadGame();");
assert.equal(json("F.getActiveAssignments(player)").length, 0);
assert.deepStrictEqual(json("player.primaryTeamAssignment"), originalPrimary);
assert(run("F.assertIntegrity(player)"));
const snapshot = json("player");
const schoolB = R.generateTeamRoster({ teamId: "school-b", seed: "source-b" });
F.addRepresentativeRosterEntry(snapshot, { teamId: "county-a", competitionEditionId: "county-2031", sourceTeamId: "school-b", playerId: schoolB.players[0].playerId }, schoolB);
const references = snapshot.competitionFoundation.representativeRosters[0].entries;
assert.equal(references.length, 2);
assert.equal(references[0].sourceTeamId, originalPrimary.teamId);
assert.equal(references[1].sourceTeamId, "school-b");
assert.deepStrictEqual(Object.keys(references[1]).sort(), ["playerId", "rosterRole", "sourceTeamId", "status"]);
assert.throws(() => F.addRepresentativeRosterEntry(snapshot, { teamId: "county-a", competitionEditionId: "county-2031", sourceTeamId: "school-b", playerId: "missing" }, schoolB));
references[1].contact = 15;
assert.throws(() => F.assertIntegrity(snapshot));
for (const teamType of ["national_training", "national_team"]) {
  const p = json("player");
  F.registerTeam(p, { teamId: teamType, teamType, organizationId: "national" });
  F.registerEdition(p, { editionId: "county-2032", competitionId: "county-test", seasonYear: 2032 });
  const a = F.startTemporaryAssignment(p, { teamId: teamType, competitionEditionId: "county-2032" });
  F.endTemporaryAssignment(p, a.assignmentId, "withdrawn");
  assert.deepStrictEqual(p.primaryTeamAssignment, originalPrimary);
  assert(F.assertIntegrity(p));
}
run("var legacy = createInitialPlayer(); legacy.schoolInvitationState = player.schoolInvitationState; legacy = normalizeSave(legacy);");
assert.deepStrictEqual(json("legacy.primaryTeamAssignment"), originalPrimary);
run(`
  var validSnapshot = JSON.stringify(player);
  var corruptSnapshot = JSON.parse(validSnapshot);
  corruptSnapshot.temporaryTeamAssignments.push(corruptSnapshot.temporaryTeamAssignments[0]);
  localStorage.setItem(SAVE_KEY, JSON.stringify(corruptSnapshot));
  var savedConsoleError = console.error;
  console.error = function () {};
  try { loadGame(); } finally { console.error = savedConsoleError; }
`);
assert(run("JSON.stringify(player) === validSnapshot"), "Rejected load must preserve live player");
console.log("Representative contract: canonical references, two source schools, lifecycle, idempotency, real save/load, Y1/Y2/Y3 transition and legacy migration PASS.");
