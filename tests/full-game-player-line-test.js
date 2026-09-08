const assert = require("assert");
const GameRecord = require("../match-game-record.js");

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function fixture(gameId = "line-game") {
  return GameRecord.createGameRecord({
    gameId,
    homeTeamId: "home",
    awayTeamId: "away",
    inningsScheduled: 7,
    rosters: {
      home: { lineup: [{ id: "home-pitcher", playerId: "home-pitcher", defensivePosition: "P" }], bench: [] },
      away: { lineup: [{ id: "batter", playerId: "batter", defensivePosition: "SS" }, { id: "away-pitcher", playerId: "away-pitcher", defensivePosition: "P" }], bench: [{ id: "bench", playerId: "bench", defensivePosition: "2B" }] }
    }
  });
}

function pa(record, sequence, result, extras = {}) {
  return GameRecord.recordEvent(record, {
    sequence, inning: 1, half: "上", type: "plateAppearance", offenseTeam: "away", batterId: extras.batterId || "batter", result,
    runsBattedIn: extras.RBI || 0, before: { outs: extras.beforeOuts || 0 }, after: { outs: extras.afterOuts ?? extras.beforeOuts ?? 0 }
  }, { rosters: {
    home: { lineup: [{ id: "home-pitcher", playerId: "home-pitcher", defensivePosition: "P" }] },
    away: { lineup: [{ id: "away-pitcher", playerId: "away-pitcher", defensivePosition: "P" }] }
  } });
}

{
  const record = fixture();
  pa(record, 1, "single");
  pa(record, 2, "walk");
  pa(record, 3, "strikeout", { beforeOuts: 0, afterOuts: 1 });
  pa(record, 4, "homeRun", { RBI: 2 });
  GameRecord.recordEvent(record, { sequence: 5, inning: 1, half: "上", type: "run", team: "away", runnerId: "batter", source: "homeRun" }, { rosters: { home: { lineup: [{ id: "home-pitcher", defensivePosition: "P" }] } } });
  GameRecord.recordEvent(record, { sequence: 6, inning: 1, half: "上", type: "defensivePlay", offenseTeam: "away", playerId: "home-fielder", playerPosition: "SS", outsCreated: 2, error: false });
  GameRecord.recordEvent(record, { sequence: 7, inning: 1, half: "上", type: "stolenBase", offenseTeam: "away", runnerId: "batter" });
  GameRecord.finalizeGameRecord(record, { inningsPlayed: 7 });
  const batter = GameRecord.getPlayerGameLine(record, "batter");
  const pitcher = GameRecord.getPlayerGameLine(record, "home-pitcher");
  const fielder = GameRecord.getPlayerGameLine(record, "home-fielder");
  verify("1. full batter line accounts PA/AB/H/BB/SO/HR/RBI", batter.batting.PA === 4 && batter.batting.AB === 3 && batter.batting.H === 2 && batter.batting.BB === 1 && batter.batting.SO === 1 && batter.batting.HR === 1 && batter.batting.RBI === 2);
  verify("2. full pitcher line accounts outsRecorded/BF/H/R/ER/BB/SO", pitcher.pitching.BF === 4 && pitcher.pitching.outsRecorded === 1 && pitcher.pitching.H === 2 && pitcher.pitching.R === 1 && pitcher.pitching.ER === 1 && pitcher.pitching.BB === 1 && pitcher.pitching.SO === 1);
  verify("3. defensive line records actual chance, out contribution and error state", fielder.defense.chances === 1 && fielder.defense.A === 1 && fielder.defense.DP === 1 && fielder.defense.E === 0);
  verify("4. baserunning line remains composable with batting line", batter.baserunning.R === 1 && batter.baserunning.SB === 1 && batter.batting.R === 1 && batter.batting.SB === 1);
}

{
  const record = fixture("bench-game");
  GameRecord.recordEvent(record, { sequence: 1, inning: 6, half: "上", type: "playerEntry", team: "away", playerId: "bench", playerPosition: "2B", role: "pinchHitter" });
  pa(record, 2, "single", { batterId: "bench" });
  GameRecord.recordEvent(record, { sequence: 3, inning: 7, half: "下", type: "defensivePlay", offenseTeam: "home", playerId: "bench", playerPosition: "2B", role: "defensiveReplacement", outsCreated: 1 });
  GameRecord.recordEvent(record, { sequence: 4, inning: 7, half: "下", type: "positionChange", team: "away", playerId: "bench", playerPosition: "SS", role: "defensiveReplacement" });
  GameRecord.finalizeGameRecord(record, { inningsPlayed: 7 });
  const line = GameRecord.getPlayerGameLine(record, "bench");
  verify("5. late bench player keeps the actual one-PA sample", line.batting.PA === 1 && line.role === "defensiveReplacement");
  verify("6. defensive replacement receives only settled chances", line.defense.chances === 1);
  verify("7. position change preserves both 2B and SS appearances", line.positionAppearances.some(item => item.position === "2B") && line.positionAppearances.some(item => item.position === "SS"));
}

{
  const records = [];
  for (let game = 1; game <= 3; game += 1) {
    const record = fixture(`aggregate-${game}`);
    pa(record, 1, game === 2 ? "walk" : "single");
    pa(record, 2, "strikeout", { beforeOuts: 0, afterOuts: 1 });
    GameRecord.finalizeGameRecord(record, { inningsPlayed: 7 });
    records.push(record);
  }
  const aggregate = GameRecord.aggregatePlayerGameLines(records, "batter");
  verify("8. three-game aggregation preserves PA/H/BB/SO totals", aggregate.games === 3 && aggregate.playerLine.batting.PA === 6 && aggregate.playerLine.batting.H === 2 && aggregate.playerLine.batting.BB === 1 && aggregate.playerLine.batting.SO === 3);
}

console.log(`Full Game Player Line: ${passed}/${passed} passed.`);
