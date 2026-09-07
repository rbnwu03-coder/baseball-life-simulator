const assert = require("assert");
const rosterAPI = require("../team-roster-foundation.js");
const { makeContext } = require("./high-school-career-test-context.js");
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const copy = value => JSON.parse(JSON.stringify(value));
function roster() {
  return { lineup: rosterAPI.POSITION_ORDER.map(position => ({ id: position, position, throws: "R", age: 18 })),
    bench: [{ id: "bench-SS", position: "SS", throws: "R", age: 18 }] };
}
test("nine canonical positions", () => assert.equal(rosterAPI.validateActiveDefense(roster()).ok, true));
test("aliases accepted", () => { const r = roster(); r.lineup[5].position = "游擊手"; assert.equal(rosterAPI.getCurrentDefender(r, "SS").id, "SS"); });
test("duplicate alias rejected", () => { const r = roster(); r.lineup[3].position = "游擊手"; assert.equal(rosterAPI.validateActiveDefense(r).ok, false); assert.equal(rosterAPI.getCurrentDefender(r, "SS"), null); });
test("missing slot rejected", () => { const r = roster(); r.lineup.pop(); assert.throws(() => rosterAPI.assertActiveDefense(r), /active-position-missing-RF/); });
test("duplicate actor rejected", () => { const r = roster(); r.lineup[2].id = "SS"; assert.equal(rosterAPI.validateActiveDefense(r).ok, false); });
test("duplicate canonical player identity rejected", () => { const r = roster(); r.lineup[2].playerId = "same-actor"; r.lineup[5].playerId = "same-actor"; assert.equal(rosterAPI.validateActiveDefense(r).ok, false); });
test("canonical roster reference cannot be discarded", () => { const r = roster(); r.source = rosterAPI.VERSION; assert.equal(rosterAPI.validateActiveDefense(r).ok, false); });
test("bench overlap rejected", () => { const r = roster(); r.bench.push(copy(r.lineup[5])); assert.equal(rosterAPI.getCurrentDefender(r, "SS"), null); });
test("inactive primary position not used", () => { const r = roster(); r.lineup[5].position = ""; r.lineup[5].primaryPosition = "SS"; assert.equal(rosterAPI.getCurrentDefender(r, "SS"), null); });
test("conflicting position aliases rejected", () => { const r = roster(); r.lineup[5].defensivePosition = "2B"; assert.equal(rosterAPI.validateActiveDefense(r).ok, false); });
test("unknown roster reference rejected", () => { const r = roster(); r.teamRoster = { players: [] }; assert.equal(rosterAPI.validateActiveDefense(r).ok, false); });
test("existing left-hand rule reused", () => { const r = roster(); r.lineup[5].throws = "L"; assert.throws(() => rosterAPI.assertActiveDefense(r), /ineligible/); });
test("existing age threshold unchanged", () => { assert.equal(rosterAPI.isHighSchoolPositionAssignmentLegal({throws:"L",age:9}, "SS"), true); assert.equal(rosterAPI.isHighSchoolPositionAssignmentLegal({throws:"L",age:10}, "SS"), false); });

const { run, json } = makeContext();
run('careerFixture("游擊手","rotation");choose("critical_offseason",1);var originalDefense=JSON.parse(JSON.stringify(player.highSchoolMatch.rosters.home));');
test("production entry starts with valid defense", () => assert.equal(run("TeamRosterFoundation.validateActiveDefense(originalDefense).ok"), true));
test("wrong batting slot cannot replace another position", () => {
  run("var entryProbe=JSON.parse(JSON.stringify(player.highSchoolMatch));entryProbe.battingOrderIndex.home=4;");
  assert.equal(run("insertPlayerIntoHighSchoolMatchLineup(entryProbe)"), false);
  assert.deepEqual(json("entryProbe.rosters.home"), json("originalDefense"));
});
test("Y3 production match completes", () => { run("playCareerMatchToEnd()"); assert.equal(run("player.highSchoolMatch.completed"), true); });
test("Y3 substitutes the incumbent SS only", () => {
  const event = json('player.highSchoolMatch.simulationLog.find(e=>e.type==="playerEntry")');
  assert.equal(event.lineupSlot, 6);
  assert.equal(event.replacedPlayerId, run("originalDefense.lineup[6].id"));
});
test("Y3 keeps all nine assignments and the original 2B", () => {
  assert.equal(run("TeamRosterFoundation.validateActiveDefense(player.highSchoolMatch.rosters.home).ok"), true);
  assert.equal(run('getCurrentHighSchoolMatchDefender(player.highSchoolMatch,"home","2B").id'), run("originalDefense.lineup[4].id"));
});
test("replaced SS is bench, not current defender", () => {
  assert.equal(run('getCurrentHighSchoolMatchDefender(player.highSchoolMatch,"home","SS").id'), "player");
  assert.equal(run('player.highSchoolMatch.rosters.home.bench.some(a=>a.id===originalDefense.lineup[6].id)'), true);
  assert.equal(run('getInfieldTeammateForPosition(player.highSchoolMatch,"游擊手")'), null);
});
test("valid save preserves active identity", () => {
  run("var savedAssignment=JSON.parse(JSON.stringify(player));var loadedAssignment=normalizeSave(savedAssignment);");
  assert.deepEqual(json("loadedAssignment.highSchoolMatch.rosters"), json("player.highSchoolMatch.rosters"));
});
test("duplicate saved assignment fails closed", () => {
  run('var badAssignment=JSON.parse(JSON.stringify(savedAssignment));Object.assign(badAssignment.highSchoolMatch.rosters.home.lineup[4],{position:"游擊手",defensivePosition:"SS"});');
  assert.throws(() => run("normalizeSave(badAssignment)"), /Active defense integrity/);
});
test("missing saved assignment fails closed", () => {
  run("badAssignment=JSON.parse(JSON.stringify(savedAssignment));badAssignment.highSchoolMatch.rosters.home.lineup.pop();");
  assert.throws(() => run("normalizeSave(badAssignment)"), /active-position-missing/);
});
test("illegal saved left-handed SS fails closed", () => {
  run('badAssignment=JSON.parse(JSON.stringify(savedAssignment));badAssignment.highSchoolMatch.rosters.home.lineup[6].throws="L";');
  assert.throws(() => run("normalizeSave(badAssignment)"), /ineligible/);
});
test("save does not promote replaced bench actor", () => assert.equal(run('getCurrentHighSchoolMatchDefender(loadedAssignment.highSchoolMatch,"home","SS").id'), "player"));
test("missing saved team is rejected", () => {
  run("badAssignment=JSON.parse(JSON.stringify(savedAssignment));badAssignment.highSchoolMatch.rosters.home=null;");
  assert.throws(() => run("normalizeSave(badAssignment)"), /active-defense-size/);
});
test("unknown saved actor reference is rejected", () => {
  run('badAssignment=JSON.parse(JSON.stringify(savedAssignment));badAssignment.highSchoolMatch.rosters.home.lineup[0].id="unknown-actor";');
  assert.throws(() => run("normalizeSave(badAssignment)"), /active-actor-not-in-roster/);
});
test("same-slot substitution works for every regulation position", () => {
  for (const position of rosterAPI.POSITION_ORDER) {
    run(`var supportedRoster=${JSON.stringify(roster())};supportedRoster.bench.push({id:"player",position:${JSON.stringify(position)}});
      var supportedMatch={rosters:{home:supportedRoster},position:${JSON.stringify(position)},battingOrderIndex:{home:${rosterAPI.POSITION_ORDER.indexOf(position)}}};`);
    assert.ok(run("insertPlayerIntoHighSchoolMatchLineup(supportedMatch)"));
    assert.equal(run("TeamRosterFoundation.validateActiveDefense(supportedMatch.rosters.home).ok"), true);
    assert.equal(run(`getCurrentHighSchoolMatchDefender(supportedMatch,"home",${JSON.stringify(position)}).id`), "player");
  }
});
test("missing receiver cannot use bench catcher", () => {
  run('var missingReceiver=JSON.parse(JSON.stringify(player.highSchoolMatch));missingReceiver.defenseTeam="home";missingReceiver.rosters.home.bench.push(missingReceiver.rosters.home.lineup.splice(1,1)[0]);');
  assert.equal(run('getCurrentHighSchoolMatchDefender(missingReceiver,"home","捕手")'), null);
  assert.throws(() => run("getHighSchoolTagUpReceivingTarget(missingReceiver)"), /missing tag-up receiver/);
  assert.throws(() => run('buildInfieldTeammateContext(missingReceiver,"游擊手")'), /Active defense integrity/);
});
test("fly-ball lookup cannot use a bench outfielder", () => {
  run('var missingOutfielder=JSON.parse(JSON.stringify(player.highSchoolMatch));missingOutfielder.defenseTeam="home";var rfIndex=missingOutfielder.rosters.home.lineup.findIndex(a=>a.defensivePosition==="RF");missingOutfielder.rosters.home.bench.push(missingOutfielder.rosters.home.lineup.splice(rfIndex,1)[0]);');
  assert.equal(run('getHighSchoolFlyBallDefenderCatchContext(missingOutfielder,{direction:"rightSide"}).assignmentAuthority'), "unavailable");
});
test("neutral evidence envelope retains explicit actor and position", () => {
  const evidence = json('MatchExperienceDevelopment.createEvidenceRecord({playerId:"active-SS",situation:{position:"SS",inning:7},difficulty:"challenging",decisionQuality:"strong",executionQuality:"failed",outcomeEvidence:{result:"safe"},attribution:{responsibleActor:"active-SS",primaryCause:"throw"}})');
  assert.equal(evidence.playerId, "active-SS");
  assert.equal(evidence.situation.position, "SS");
  assert.equal(evidence.difficulty, "challenging");
  assert.equal(evidence.decisionEvidence.quality, "strong");
  assert.equal(evidence.executionEvidence.quality, "failed");
  assert.equal(evidence.outcomeEvidence.result, "safe");
  assert.equal(evidence.attribution.responsibleActor, "active-SS");
});
console.log(`${passed}/${passed} PASS`);
