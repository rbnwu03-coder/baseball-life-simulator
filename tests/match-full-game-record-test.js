const assert = require("assert");
const GameRecord = require("../match-game-record.js");
const { makeContext } = require("./high-school-career-test-context.js");

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function sumInningRuns(record, side) {
  return record.inningLines.reduce((sum, line) => sum + line[side === "home" ? "homeRuns" : "awayRuns"], 0);
}

{
  const { run, json } = makeContext();
  run(`careerFixture("游擊手","starter",77001);choose("critical_offseason",1);playCareerMatchToEnd()`);
  const match = json("player.highSchoolMatch");
  const record = match.gameRecord;
  verify("1. 7 inning production match creates a finalized canonical scoreboard", match.completed && record.status === "final" && record.inningsScheduled === 7 && record.inningsPlayed >= 7);
  verify("2. inning run sums equal canonical R totals and final result", sumInningRuns(record, "home") === record.totals.home.runs && sumInningRuns(record, "away") === record.totals.away.runs && record.result.finalScore.home === record.totals.home.runs);
  const playerPA = match.simulationLog.filter(event => event.type === "plateAppearance" && event.batterId === "player").length;
  const decisionPA = match.completedMoments.filter(moment => moment.domain === "offense").length;
  verify("3. full player PA is independent from operated decision count", record.playerLines.player.batting.PA === playerPA && playerPA > decisionPA);
  const nonPlayerPA = match.simulationLog.filter(event => event.type === "plateAppearance" && event.batterId !== "player");
  verify("4. non-player plate appearances enter canonical player lines", nonPlayerPA.length > 20 && nonPlayerPA.every(event => record.playerLines[event.batterId]?.batting.PA > 0));
  verify("5. decision PA settlement and resumed simulation never double count", Object.values(record.playerLines).reduce((sum, line) => sum + line.batting.PA, 0) === match.simulationLog.filter(event => event.type === "plateAppearance").length);
  verify("6. team hit totals equal all batter hit totals", ["home", "away"].every(side => Object.values(record.playerLines).filter(line => line.teamId === record[`${side}TeamId`]).reduce((sum, line) => sum + line.batting.H, 0) === record.totals[side].hits));
  verify("7. canonical integrity reports no issue", GameRecord.assertIntegrity(record) === true && record.integrity.issues.length === 0);
}

{
  const { run, json } = makeContext();
  run(`
    careerFixture("游擊手","starter",77111);choose("critical_offseason",1);
    for(var midTicks=0;midTicks<700&&player.highSchoolMatch.inning<4;midTicks++){
      if(isHighSchoolMatchDecisionVisible(player.highSchoolMatch)){
        var midChoice=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch)[0];
        chooseHighSchoolYearOneMatchMoment(midChoice.matchDecision,midChoice.matchMomentId,()=>.62);
      }else advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);
    }
    var midRecordBefore=JSON.stringify(player.highSchoolMatch.gameRecord);
    var midLogBefore=JSON.stringify(player.highSchoolMatch.simulationLog);
    saveGame();loadGame();
    var midRecordSame=midRecordBefore===JSON.stringify(player.highSchoolMatch.gameRecord);
    var midLogSame=midLogBefore===JSON.stringify(player.highSchoolMatch.simulationLog);
  `);
  verify("8. inning-four save/load preserves scoreboard, stats and event identities", json("player.highSchoolMatch.inning") >= 4 && json("midRecordSame") && json("midLogSame"));
  run("playCareerMatchToEnd();saveGame();loadGame();var completedRecordBefore=JSON.stringify(player.highSchoolMatch.gameRecord);var duplicateFinalize=finalizeHighSchoolGameRecord(player.highSchoolMatch);var completedRecordSame=completedRecordBefore===JSON.stringify(player.highSchoolMatch.gameRecord)");
  verify("9. completed reload cannot duplicate finalization or stats", json("duplicateFinalize.status") === "duplicate" && json("completedRecordSame"));
}

{
  const record = GameRecord.createGameRecord({ gameId: "error-game", homeTeamId: "home", awayTeamId: "away", inningsScheduled: 7 });
  GameRecord.recordEvent(record, { sequence: 0, inning: 1, half: "上", type: "plateAppearance", offenseTeam: "away", batterId: "away-batter", result: "error", before: { outs: 0 }, after: { outs: 0 } });
  GameRecord.recordEvent(record, { sequence: 1, inning: 1, half: "上", type: "defensivePlay", offenseTeam: "away", playerId: "home-fielder", playerPosition: "SS", error: true, outsCreated: 0 });
  GameRecord.finalizeGameRecord(record, { inningsPlayed: 7 });
  verify("10. defensive error event agrees with canonical scoreboard errors", record.totals.home.errors === 1 && record.playerLines["home-fielder"].defense.E === 1);
}

{
  const formal = GameRecord.createGameRecord({ gameId: "formal", homeTeamId: "school", awayTeamId: "opponent", competitionEditionId: "edition-1", competitionEntryId: "entry-1", inningsScheduled: 9 });
  GameRecord.finalizeGameRecord(formal, { inningsPlayed: 10 });
  verify("11. formal game retains competition edition and entry references", formal.competitionEditionId === "edition-1" && formal.competitionEntryId === "entry-1");
  verify("12. inningsPlayed can differ from configurable inningsScheduled", formal.inningsScheduled === 9 && formal.inningsPlayed === 10);
  const practice = GameRecord.createGameRecord({ gameId: "practice", homeTeamId: "school", awayTeamId: "opponent", inningsScheduled: 7 });
  GameRecord.finalizeGameRecord(practice, { inningsPlayed: 7 });
  verify("13. practice game finalizes without invented competition references", practice.status === "final" && practice.competitionEditionId === null && practice.competitionEntryId === null);
}

console.log(`Match Full Game Record: ${passed}/${passed} passed.`);
