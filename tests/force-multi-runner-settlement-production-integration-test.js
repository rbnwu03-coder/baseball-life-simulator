const assert = require("assert");
const { makeContext } = require("./high-school-career-test-context.js");
const { run, json } = makeContext();
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
run(`
  careerFixture("二壘手", "starter"); choose("critical_offseason", 1);
  var forceFixturePlayer = JSON.stringify(player);
  function forceMatch(occupied = [true,true,true], outs = 0) {
    player = JSON.parse(forceFixturePlayer);
    const m = player.highSchoolMatch;
    const base = m.rosters.home.teamRoster;
    const roster = base.starters.some(a => a.id === "player") ? base : TeamRosterFoundation.injectPlayerIntoRoster(base,
      createHighSchoolRosterPlayerActor(player, "二壘手"), {playerRole:"starter",playerPosition:"二壘手"});
    m.rosters.home = TeamRosterFoundation.toMatchRoster(roster, TeamStrengthModel.deriveTeamStrengthProfile(roster));
    Object.assign(m, {inning:5, half:"上", offenseTeam:"away", defenseTeam:"home", outs,
      runners:occupied.map((v,i) => v ? m.rosters.away.lineup[i+1].id : null), scores:{home:1,away:1},
      simulationPhase:"moment_1_resolved", currentDomain:"defense", playerEntryCompleted:true, playerLineupStatus:"starter",
      playerFieldingAssignment:"二壘手", developmentPositionOverride:"二壘手", position:"二壘手",
      defensiveSituation:{}, activeSituation:null, groundBallInPlayState:null, lineDriveCatchState:null, flyBallCatchState:null});
    m.playerLineupSlot = m.rosters.home.lineup.findIndex(a => a.id === "player");
    m.battingOrderIndex.away = 0; m.currentBatter = getHighSchoolMatchLineupBatter(m,"away").id;
    setHighSchoolDefensiveBallContext(m,"hardGrounder");
    buildInfieldMeaningfulMoment(m, player, {playerPosition:"二壘手",primaryFielderPosition:"二壘手",ballDirection:"straight",ballDepth:"normal",
      playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10}});
    return m;
  }
  function resolveForce(m, decision = "challenge") {
    let samples = 0;
    const before = JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores});
    const result = resolveInfieldDecision(m.defensiveSituation,decision,m,()=>{samples++;return .999;});
    if (before !== JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores})) throw Error("resolver mutated runners");
    return {result,samples};
  }
  var m = forceMatch(); var initial = m.runners.slice(); var br = m.currentBatter;
`);
test("legacy meaningful moment establishes canonical chain before decision", () => {
  assert.equal(run('m.defensiveSituation.forceChain.authority'), "baseOccupancy+batterRunnerCreation");
  assert.equal(run('m.defensiveSituation.groundBallDefensiveContext'), null);
  assert.equal(run('m.defensiveSituation.movementIntents.length'), 4);
});
test("BUG-PLAYTEST-LOADED-DP-001 real 2B execution settles every actor", () => {
  run('var execution = resolveForce(m); var result = execution.result;');
  assert.equal(run('result.resultCode'), "twoOuts");
  assert.equal(run('result.routeId'), "initiate463");
  assert.deepEqual(json('result.runnersAfter'), [null,null,run('initial[1]')]);
  assert.deepEqual(json('result.scoringRunnerIds'), [run('initial[2]')]);
  assert.deepEqual(json('result.runnerSettlement.retirements.map(r=>r.runnerId)'), [run('initial[0]'),run('br')]);
  assert.equal(run('execution.samples'), 1);
});
test("actual application produces 2 outs, R2 at third and one legal R3 run", () => {
  run('applyInfieldResolutionToHighSchoolMatch(m,"challenge",result);');
  assert.equal(run('m.outs'),2);
  assert.deepEqual(json('m.runners'), [null,null,run('initial[1]')]);
  assert.equal(run('m.scores.away'),2);
});
test("duplicate application preserves bases, score, outs, order and all events", () => {
  run('var once = JSON.stringify(m); applyInfieldResolutionToHighSchoolMatch(m,"challenge",result);');
  assert.equal(run('JSON.stringify(m) === once'),true);
});
test("completed play normalizeSave replay is idempotent", () => {
  run('var restored = normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch; var restoredOnce = JSON.stringify(restored); applyInfieldResolutionToHighSchoolMatch(restored,"challenge",result);');
  assert.equal(run('JSON.stringify(restored) === restoredOnce'),true);
});
test("pending defensive save restores movement identities and deterministic result", () => {
  run('m=forceMatch(); var pending = normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;');
  assert.deepEqual(json('pending.defensiveSituation.movementIntents'),json('m.defensiveSituation.movementIntents'));
  assert.deepEqual(json('resolveForce(pending).result'),json('resolveForce(m).result'));
});
for (const [name,bases,expected] of [["R1",[true,false,false],[null,null,null]], ["R1+R2",[true,true,false],[null,null,2]], ["R1+R3",[true,false,true],[null,null,3]]]) {
  test(`${name} production DP keeps correct survivors`, () => {
    run(`m=forceMatch(${JSON.stringify(bases)}); var ids=m.runners.slice(); result=resolveForce(m).result; applyInfieldResolutionToHighSchoolMatch(m,"challenge",result);`);
    assert.equal(run('m.outs'),2);
    assert.deepEqual(json('m.runners'),expected.map(v=>v ? run(`ids[${v-1}]`) : null));
    assert.equal(run('m.scores.away'),1);
  });
}
test("R3 alone holds during secure first, no invented scoring", () => {
  run('m=forceMatch([false,false,true]); var r3=m.runners[2]; result=resolveForce(m,"secure").result; applyInfieldResolutionToHighSchoolMatch(m,"secure",result);');
  assert.deepEqual(json('m.runners'),[null,null,run('r3')]); assert.equal(run('m.scores.away'),1);
});
test("BR first retirement removes production R1 force and requires a tag", () => {
  run('m=forceMatch([true,false,false]); result=resolveForce(m,"secure").result; var afterForce=result.runnerSettlement.forceChainAfterRetirements;');
  assert.deepEqual(json('afterForce.forceTargets'),{});
  assert.equal(run('ForceAdvancement.classifyContinuationTarget(afterForce,m.runners[0],"second").tagRequired'),true);
});
test("loaded one-out DP delegates run cancellation to existing third-out authority", () => {
  run('m=forceMatch([true,true,true],1); result=resolveForce(m).result; applyInfieldResolutionToHighSchoolMatch(m,"challenge",result);');
  assert.equal(run('m.outs'),3); assert.equal(run('m.scores.away'),1);
  assert.deepEqual(json('m.runners'),[null,null,null]);
  assert.equal(run('m.lastDefensiveResolution.thirdOutResolution.scoringAllowed'),false);
});
test("legal run reaches canonical event and GameRecord", () => {
  run('m=forceMatch(); result=resolveForce(m).result; applyInfieldResolutionToHighSchoolMatch(m,"challenge",result);');
  assert.ok(json('m.simulationLog').some(e=>e.type === "runScored" || e.type === "run"));
  assert.ok(run('JSON.stringify(m.gameRecord).includes(result.scoringRunnerIds[0])'));
});
test("presentation and repeated render do not replay runner settlement", () => {
  run('var beforeRender=JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,log:m.simulationLog}); renderHighSchoolYearOneScore(); renderHighSchoolYearOneScore();');
  assert.equal(run('JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,log:m.simulationLog})===beforeRender'),true);
});
test("physical DP with expired second-leg window keeps BR and settles both other survivors", () => {
  run(`m=forceMatch(); m.defensiveSituation={};
    getHighSchoolMatchSimulationEntity(m,m.currentBatter).power=4;
    prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"standardAttack",
      situationOverrides:{playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10}},
      ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,
        physicalRolls:{contactQuality:.65,ballType:.1,pace:.68,direction:.95,depth:0},outcomeRoll:.5}});
    var physicalIds=m.runners.slice();
    var physicalChoice=getHighSchoolDefensiveMomentChoices(m).find(c=>c.routeId==="initiate463");
    result=resolveHighSchoolDefensivePlay(m,physicalChoice.matchDecision,()=>.999);
    applyInfieldResolutionToHighSchoolMatch(m,physicalChoice.matchDecision,result);`);
  assert.equal(run('result.outsCreated'),1);
  assert.equal(run('result.detailedResult'),"secondStageExpired");
  assert.deepEqual(json('m.runners'),[run('result.runnerSettlement.initialForceChain.batterRunner.runnerId'),null,run('physicalIds[1]')]);
  assert.equal(run('m.scores.away'),2);
  assert.equal(run('m.groundBallInPlayState.playSettlement.runnerSettlement.retirements.length'),1);
});
test("walk and uncontested BIP share contiguous-force concept", () => {
  for (const occupied of [[true,false,false],[true,true,false],[true,true,true],[false,true,false],[false,false,true],[true,false,true]]) {
    run(`m=forceMatch(${JSON.stringify(occupied)}); var bip=ForceAdvancement.settleForceAdvancement({forceChain:m.defensiveSituation.forceChain,route:"controlledNoThrow",resultCode:"zeroOuts"}); applyHighSchoolSimulatedPlateAppearance(m,"walk",m.currentBatter,"away");`);
    assert.deepEqual(json('m.runners'), json('bip.runnersAfter'));
  }
});
console.log(`Force multi-runner production integration: ${passed}/${passed} PASS`);
