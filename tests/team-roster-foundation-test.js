const assert = require("assert");
const Roster = require("../team-roster-foundation.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const legal = Roster.generateTeamRoster({ teamId: "legal", schoolStandard: "competitive", yearIdentity: 2026, seed: 1101 });
verify("1. TeamRoster canonical schema 與 9 人先發成立", legal.version === Roster.VERSION && legal.starters.length === 9 && legal.battingOrder.length === 9);
verify("2. 九個正式守位各自唯一", new Set(legal.battingOrder.map(slot => slot.defensivePosition)).size === 9 && Roster.POSITION_ORDER.every(position => legal.battingOrder.some(slot => slot.defensivePosition === position)));
verify("3. 打序沒有重複球員", new Set(legal.battingOrder.map(slot => slot.playerId)).size === 9);
verify("4. 正式 roster validation 通過", Roster.validateRoster(legal).ok);
verify("5. Bench 與 future substitution seam 存在", legal.benchPlayers.length >= 6);
verify("6. Pitching staff 有先發與複數 depth", Boolean(legal.pitchingStaff.starter) && legal.pitchingStaff.secondaryPitchers.length >= 2);
verify("7. 先發投手就是守 P 的 lineup actor", legal.battingOrder.some(slot => slot.playerId === legal.pitchingStaff.starter && slot.defensivePosition === "P"));
verify("8. 左投不會正式配置到 C/2B/3B/SS", legal.battingOrder.every(slot => {
  const actor = legal.players.find(player => player.playerId === slot.playerId);
  return actor.throws !== "L" || !Roster.LEFT_HANDED_RESTRICTED.includes(slot.defensivePosition);
}));
verify("9. 左投 legality helper 拒絕高中捕手與中線內野", ["C", "2B", "3B", "SS"].every(position => !Roster.isPositionEligible({ throws: "L", age: 16, primaryPosition: position }, position)));
verify("10. 同 school/year/seed 完全 deterministic", JSON.stringify(legal) === JSON.stringify(Roster.generateTeamRoster({ teamId: "legal", schoolStandard: "competitive", yearIdentity: 2026, seed: 1101 })));
verify("11. 同校不同年份產生不同 roster", JSON.stringify(legal.players) !== JSON.stringify(Roster.generateTeamRoster({ teamId: "legal", schoolStandard: "competitive", yearIdentity: 2027, seed: 1101 }).players));

const powerhouse = Roster.generateTeamRoster({ teamId: "power", schoolStandard: "powerhouse", yearIdentity: 2026, seed: 2101 });
const uniqueShapes = new Set(powerhouse.players.map(player => [player.contact, player.power, player.speed, player.defense, player.arm, player.pitching].join("|")));
verify("12. Powerhouse 由有 variance 的球員分布形成", uniqueShapes.size > 10);
verify("13. School standard 不存在 teamPower 或 winChance flat bonus", !("teamPower" in powerhouse) && !("winChance" in powerhouse));

const weakCatcher = Roster.generateTeamRoster({ teamId: "weak-catcher", schoolStandard: "powerhouse", yearIdentity: 2026, seed: 2101, positionWeaknesses: { C: 3 } });
const catcher = weakCatcher.starters.find(player => player.primaryPosition === "C");
const others = weakCatcher.starters.filter(player => player.primaryPosition !== "C");
verify("14. 強校仍可保留 position-specific catcher weakness", catcher.defense < others.reduce((sum, player) => sum + player.defense, 0) / others.length);

const playerActor = { id: "player", name: "主角", age: 16, primaryPosition: "SS", secondaryPositions: ["2B"], bats: "L", throws: "R", simulationCapability: { offense: { contact: 8, power: 6, speed: 7 }, defense: { fielding: 8, arm: 7 } } };
const playerBench = Roster.generateTeamRoster({ teamId: "player-team", schoolStandard: "standard", yearIdentity: 2026, seed: 3101, playerActor });
verify("15. 玩家預設只是 roster member，不會被強制先發", playerBench.players.some(player => player.id === "player") && playerBench.benchPlayers.some(player => player.id === "player") && !playerBench.battingOrder.some(slot => slot.playerId === "player"));
const playerStarter = Roster.generateTeamRoster({ teamId: "player-team", schoolStandard: "standard", yearIdentity: 2026, seed: 3101, playerActor, playerRole: "starter", playerPosition: "SS" });
verify("16. 合法 starter role 可把玩家納入打序並保留 identity", playerStarter.battingOrder.some(slot => slot.playerId === "player" && slot.defensivePosition === "SS"));
const illegalLefty = Roster.generateTeamRoster({ teamId: "lefty-team", schoolStandard: "standard", yearIdentity: 2026, seed: 3102, playerActor: { ...playerActor, throws: "L" }, playerRole: "starter", playerPosition: "SS" });
verify("17. 非法左投 starter assignment 會留在 bench", !illegalLefty.battingOrder.some(slot => slot.playerId === "player") && illegalLefty.benchPlayers.some(player => player.id === "player"));
const shortstopCompetition = Roster.getPositionCompetition(playerBench, "SS");
verify("18. Roster interface 可回答 starter／bench／position competition", Boolean(shortstopCompetition.starterId) && shortstopCompetition.competitionCount >= 1 && Array.isArray(shortstopCompetition.benchCompetitorIds));

console.log(`Team Roster Foundation tests: ${passed}/18 passed.`);
