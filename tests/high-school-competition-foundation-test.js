const assert = require("assert");
const F = require("../high-school-competition-foundation.js");
const player = {};
const school = { teamId: "school-a", organizationId: "school-a", teamType: "school" };
F.assignPrimarySchool(player, school);
for (const [competitionId, competitionType, entryUnit, level] of [
  ["HS_WOOD_BAT_LEAGUE", "school_league", "school", "high_school"],
  ["BLACK_PANTHER", "school_tournament", "school", "high_school"],
  ["ESUN_CUP", "selection_tournament", "county_representative", "national_selection"],
  ["U18_ASIA", "international", "national_team", "international_u18"]
]) {
  F.registerDefinition(player, { competitionId, competitionType, entryUnit, level, selectionRelevance: "fixture" });
  for (const seasonYear of [2031, 2032, 2033]) F.registerEdition(player, {
    editionId: `${competitionId}-${seasonYear}`, competitionId, seasonYear,
    eligibility: { ageRule: { type: "age", max: 18 } }
  });
}
for (let i = 0; i < 3; i++) {
  F.enterCompetition(player, { competitionEditionId: "HS_WOOD_BAT_LEAGUE-2031", teamId: school.teamId });
  F.enterCompetition(player, { competitionEditionId: "BLACK_PANTHER-2031", teamId: school.teamId });
}
assert.equal(player.competitionFoundation.entries.length, 2);
assert.equal(player.competitionFoundation.editions.length, 12);
assert.notEqual(player.competitionFoundation.entries[0].entryId, player.competitionFoundation.entries[1].entryId);
assert.equal(player.competitionFoundation.participations.length, 0);
F.recordParticipation(player, { playerId: "player", competitionEditionId: "HS_WOOD_BAT_LEAGUE-2031", teamId: school.teamId, rosterStatus: "reserve", participationStatus: "none" });
assert.equal(player.competitionFoundation.participations[0].participationStatus, "none");
assert.throws(() => F.enterCompetition(player, { teamId: school.teamId, competitionEditionId: "missing" }));
assert.throws(() => F.enterCompetition(player, { teamId: school.teamId, competitionEditionId: "ESUN_CUP-2031" }));
assert.throws(() => F.assignPrimarySchool(player, { ...school, teamId: "school-b" }));
const edition = player.competitionFoundation.editions[0];
assert(F.evaluateCompetitionEligibility({ age: 16, schoolYear: 1 }, edition).eligible);
assert(!F.evaluateCompetitionEligibility({ age: 20, schoolYear: 3 }, edition).eligible);
assert(!F.evaluateCompetitionEligibility({ schoolYear: 3 }, edition).eligible);
const birthEdition = { ...edition, eligibility: { ageRule: { type: "birth_year", min: 2013, max: 2016 }, schoolStages: ["high_school"], requireAvailable: true } };
assert(F.evaluateCompetitionEligibility({ birthYear: 2014, schoolStage: "high_school", available: true }, birthEdition).eligible);
assert.equal(F.evaluateCompetitionEligibility({ birthYear: 2010, schoolStage: "college", available: false }, birthEdition).reasons.length, 3);
assert.throws(() => F.createCompetitionEdition({ ...edition, eligibility: { ageRule: { type: "schoolYear" } } }));
assert(F.assertIntegrity(player));
const duplicate = JSON.parse(JSON.stringify(player));
duplicate.competitionFoundation.entries.push(duplicate.competitionFoundation.entries[0]);
assert.throws(() => F.restorePlayer(duplicate));
const dangling = JSON.parse(JSON.stringify(player));
dangling.competitionFoundation.entries[0].competitionEditionId = "missing";
assert.throws(() => F.restorePlayer(dangling));
console.log("Competition foundation: definitions, editions, entry identity, participation separation, eligibility and integrity PASS.");
