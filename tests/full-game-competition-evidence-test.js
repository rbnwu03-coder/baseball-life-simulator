const assert = require("assert");
const Foundation = require("../high-school-competition-foundation.js");
const Evidence = require("../high-school-competition-evidence.js");
const GameRecord = require("../match-game-record.js");

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function fixture() {
  const player = { age: 17, schoolStage: "high_school", available: true, primaryPosition: "SS" };
  Foundation.assignPrimarySchool(player, { teamId: "school-a", organizationId: "school-a", teamType: "school" });
  Foundation.registerDefinition(player, { competitionId: "series", competitionType: "school_tournament", entryUnit: "school", level: "high_school", selectionRelevance: { level: "high" } });
  Foundation.registerEdition(player, { editionId: "series-2031", competitionId: "series", seasonYear: 2031 });
  const entry = Foundation.enterCompetition(player, { competitionEditionId: "series-2031", teamId: "school-a" });
  Foundation.recordParticipation(player, { playerId: "player", competitionEditionId: entry.competitionEditionId, teamId: entry.teamId, rosterStatus: "active_roster", participationStatus: "appeared" });
  Evidence.restorePlayer(player);
  return { player, entry };
}

function createMatch(gameId) {
  const gameRecord = GameRecord.createGameRecord({
    gameId,
    competitionEditionId: "series-2031",
    competitionEntryId: "entry-placeholder",
    homeTeamId: "school-a",
    awayTeamId: "opponent",
    inningsScheduled: 7,
    rosters: {
      home: { lineup: [{ id: "player", playerId: "player", defensivePosition: "SS" }], bench: [] },
      away: { lineup: [{ id: "pitcher", playerId: "pitcher", defensivePosition: "P" }], bench: [] }
    }
  });
  ["single", "out", "walk", "strikeout"].forEach((result, index) => GameRecord.recordEvent(gameRecord, {
    sequence: index,
    inning: index + 1,
    half: "下",
    type: "plateAppearance",
    offenseTeam: "home",
    batterId: "player",
    result,
    before: { outs: 0 },
    after: { outs: result === "out" || result === "strikeout" ? 1 : 0 }
  }, { rosters: { away: { lineup: [{ id: "pitcher", defensivePosition: "P" }] } } }));
  GameRecord.finalizeGameRecord(gameRecord, { inningsPlayed: 7 });
  return {
    id: gameId,
    completed: true,
    position: "SS",
    role: "starter",
    gameRecord,
    matchExperience: {
      finalized: true,
      evidence: [{
        evidenceId: `${gameId}|decision-1`,
        participationType: "batter",
        experienceQuality: "good",
        sourceSnapshot: { plateAppearances: 1 },
        skillEvidence: { targetSkill: "batting", baseValue: 2, adjustedValue: 2 },
        decisionEvidence: { quality: "strong" },
        executionEvidence: { quality: "normal" }
      }]
    }
  };
}

{
  const { player, entry } = fixture();
  const result = Evidence.integrateMatchEvidence(player, { playerId: "player", competitionEntryId: entry.entryId, teamId: entry.teamId, match: createMatch("full-game-1"), position: "SS", role: "starter" });
  const production = result.records.find(record => record.evidenceLayer === "fullGameProduction" && record.evidenceType === "offense");
  const decision = result.records.find(record => record.evidenceLayer === "decision");
  verify("1. full game record adapts into FullGameProductionEvidence", result.status === "applied" && production?.context.gameRecordId === "full-game-1");
  verify("2. selection sample uses all four PA rather than one operated decision", production.sample.type === "PA" && production.sample.count === 4 && decision.sample.count === 1);
  verify("3. game production and micro decision evidence remain separate records", production.evidenceId !== decision.evidenceId && production.evidenceLayer !== decision.evidenceLayer);
  verify("4. production evidence carries canonical batting performance", production.performance.stats.PA === 4 && production.performance.stats.H === 1 && production.performance.stats.BB === 1 && production.performance.stats.SO === 1);
  const firstLength = Evidence.getEvidence(player).length;
  Evidence.integrateMatchEvidence(player, { playerId: "player", competitionEntryId: entry.entryId, teamId: entry.teamId, match: createMatch("full-game-1"), position: "SS", role: "starter" });
  verify("5. replaying the same game evidence remains idempotent", Evidence.getEvidence(player).length === firstLength);
}

{
  const { player, entry } = fixture();
  for (let game = 1; game <= 3; game += 1) {
    Evidence.integrateMatchEvidence(player, { playerId: "player", competitionEntryId: entry.entryId, teamId: entry.teamId, match: createMatch(`multi-game-${game}`), position: "SS", role: "starter" });
  }
  const summary = Evidence.getCompetitionEvidenceSummary(player, { playerId: "player" });
  verify("6. multi-game evidence aggregates full-game samples by canonical game", summary.independentSourceCount === 3 && summary.totalSample === 12 && summary.sampleConfidence === "high");
  verify("7. evidence integrity accepts additive full-game production records", Evidence.assertIntegrity(player) === true);
}

console.log(`Full Game Competition Evidence: ${passed}/${passed} passed.`);
