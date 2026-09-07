const assert = require("assert");
const { makeContext } = require("./high-school-career-test-context.js");
const { run, json } = makeContext();
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
run(`
  function reachMatch(type=.1, pending=false, weakReach=false) {
    careerFixture("二壘手","starter");choose("critical_offseason",1);
    const m=player.highSchoolMatch;player.throws="R";
    const base=m.rosters.home.teamRoster;
    const roster=base.starters.some(actor=>actor.id==="player") ? base
      : TeamRosterFoundation.injectPlayerIntoRoster(base,createHighSchoolRosterPlayerActor(player,"二壘手"),
        {playerRole:"starter",playerPosition:"二壘手"});
    m.rosters.home=TeamRosterFoundation.toMatchRoster(roster,TeamStrengthModel.deriveTeamStrengthProfile(roster));
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,
      runners:[m.rosters.away.lineup[1].id,null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",
      currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",
      playerFieldingAssignment:"二壘手",developmentPositionOverride:"二壘手",position:"二壘手",
      defensiveSituation:{},activeSituation:null,groundBallInPlayState:null,lineDriveCatchState:null,flyBallCatchState:null});
    m.playerLineupSlot=m.rosters.home.lineup.findIndex(actor=>actor.id==="player");
    m.battingOrderIndex.away=2;m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id;
    getHighSchoolMatchSimulationEntity(m,m.currentBatter).power=type>.8?16:4;
    const opts={tacticalActionOverride:"standardAttack",lineDriveCatchExecutionRoll:0,flyBallCatchExecutionRoll:0,
      flyBallDefenderContext:{catching:10,reaction:10,range:10},
      situationOverrides:{playerCapabilities:{fielding:10,catching:10,reaction:weakReach?0:10,range:weakReach?0:10,arm:10,throwing:10,decision:10}},
      ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,
        physicalRolls:{contactQuality:.65,ballType:type,pace:.68,direction:.95,depth:type>.8?.99:0},outcomeRoll:.5}};
    if(pending){m.offensiveTacticalActionState={selectedTacticalAction:"standardAttack"};ensureHighSchoolOrdinaryGroundBallInPlayHandoff(m,opts);}
    else prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
    return {m,opts};
  }
  function baseballFacts(m) {return JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,order:m.battingOrderIndex,logs:m.simulationLog});}
`);
test("ground pause stores linked Reach, not a second control roll", () => {
  run("var ground=reachMatch();var handoff=ground.m.groundBallInPlayState;");
  const reach = json("handoff.defensiveAccess.reachResolution");
  assert.equal(reach.defenderId, "player"); assert.equal(reach.position, "2B"); assert.equal(reach.reached, true);
  assert.equal(run("handoff.secureResolution===undefined"), true);
  assert.equal(run('ground.m.activeSituation.lifecycleState'), "presented");
});
test("paused Reach survives normalizeSave and repeat admission despite changed fixture capabilities", () => {
  run(`var savedGround=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;
    var pausedBefore=JSON.stringify(savedGround.groundBallInPlayState);
    ensureHighSchoolOrdinaryGroundBallInPlayHandoff(savedGround,{situationOverrides:{playerCapabilities:{reaction:0,range:0,fielding:0}}});`);
  assert.equal(run("JSON.stringify(savedGround.groundBallInPlayState)===pausedBefore"), true);
  assert.deepEqual(json("savedGround.activeSituation"), json("ground.m.activeSituation"));
});
test("validated 2B control projects into Secure and duplicate settlement preserves it", () => {
  run(`var choice=getHighSchoolDefensiveMomentChoices(ground.m).find(c=>c.routeId==="secureFirstBaseOut");
    var groundResolution=resolveHighSchoolDefensivePlay(ground.m,choice.matchDecision,()=>.8);
    applyInfieldResolutionToHighSchoolMatch(ground.m,choice.matchDecision,groundResolution);
    var groundAfter=JSON.stringify(ground.m);
    applyInfieldResolutionToHighSchoolMatch(ground.m,choice.matchDecision,groundResolution);`);
  assert.equal(run("ground.m.groundBallInPlayState.secureResolution.inputs.control"), run("groundResolution.playerLeg.control"));
  assert.equal(run("ground.m.groundBallInPlayState.secureResolution.authority"), "existingSecondBaseControlAdapter");
  assert.equal(run("groundResolution.playerLeg.reach"), "completed");
  assert.equal(run("ground.m.groundBallInPlayState.secureResolution.variationEvidence.consumed"), false);
  assert.equal(run("ground.m.groundBallInPlayState.secureResolution.variationEvidence.sourceRoll"), .8);
  assert.equal(run("ground.m.groundBallInPlayState.secureResolution.inputs.fieldingWindow"), run("groundResolution.controlEvidence.fieldingWindow"));
  assert.equal(run("JSON.stringify(ground.m)===groundAfter"), true);
});
for (const [label, type, field, resolve, apply] of [
  ["line", .5, "lineDriveCatchState", "resolveHighSchoolLineDriveCatchOpportunity", "applyHighSchoolLineDriveCatchResolution"],
  ["fly", .95, "flyBallCatchState", "resolveHighSchoolFlyBallCatchOpportunity", "applyHighSchoolFlyBallCatchResolution"]
]) {
  test(`${label}: Secure resolves physical control without baseball settlement`, () => {
    run(`var ${label}=reachMatch(${type},true);var ${label}Before=baseballFacts(${label}.m);
      ${resolve}(${label}.m,${label}.opts);`);
    assert.equal(run(`${label}.m.${field}.supported`), true);
    assert.equal(run(`${label}.m.${field}.catchResult.secureResolution.secureQuality`), "caughtBeforeGround");
    assert.equal(run(`${label}.m.${field}.catchResult.authority`), "canonicalSecureToExistingCatchSettlement");
    assert.equal(run(`baseballFacts(${label}.m)===${label}Before`), true);
    assert.equal(run(`${label}.m.${field}.settlementApplied`), false);
  });
  test(`${label}: resolved Secure survives save and repeated execution with a different roll`, () => {
    run(`var ${label}Saved=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;
      var ${label}Snapshot=JSON.stringify(${label}Saved.${field});
      ${resolve}(${label}Saved,{lineDriveCatchExecutionRoll:1,flyBallCatchExecutionRoll:1});`);
    assert.equal(run(`JSON.stringify(${label}Saved.${field})===${label}Snapshot`), true);
    assert.deepEqual(json(`${label}Saved.${field}.defensiveAccess`), json(`${label}.m.${field}.defensiveAccess`));
  });
  test(`${label}: existing settlement remains exactly once`, () => {
    run(`${apply}(${label}.m);var ${label}Settled=JSON.stringify(${label}.m);${apply}(${label}.m);`);
    assert.equal(run(`${label}.m.${field}.settlementApplied`), true);
    assert.equal(run(`JSON.stringify(${label}.m)===${label}Settled`), true);
  });
}
test("unreachable 2B ball declines detailed admission despite strong hands", () => {
  run("var missed=reachMatch(.1,true,true);");
  assert.equal(run("missed.m.groundBallInPlayState.supported"), false);
  assert.equal(run("missed.m.groundBallInPlayState.secureResolution===undefined"), true);
  assert.equal(run("missed.m.activeSituation"), null);
});
test("stale persisted Reach and Secure are rejected without state mutation", () => {
  run(`var corrupt=JSON.parse(JSON.stringify(player));corrupt.highSchoolMatch=JSON.parse(JSON.stringify(lineSaved));
    corrupt.highSchoolMatch.lineDriveCatchState.catchResult.secureResolution.defenderId="bench";
    var corruptBefore=JSON.stringify(corrupt);`);
  assert.throws(() => run("normalizeSave(corrupt)"), /stale persisted secure/);
  assert.equal(run("JSON.stringify(corrupt)===corruptBefore"), true);
  run('corrupt.highSchoolMatch.lineDriveCatchState=JSON.parse(lineSnapshot);corrupt.highSchoolMatch.lineDriveCatchState.defensiveAccess.reachResolution.physicalIdentity="other-play";');
  assert.throws(() => run("normalizeSave(corrupt)"), /incompatible reach/);
});
test("legacy in-flight state with no Reach retains its existing migration path", () => {
  run(`var legacy=JSON.parse(JSON.stringify(player));legacy.highSchoolMatch=JSON.parse(JSON.stringify(savedGround));
    delete legacy.highSchoolMatch.groundBallInPlayState.defensiveAccess.reachResolution;
    delete legacy.highSchoolMatch.groundBallInPlayState.defensiveAccess.secureCapabilities;
    var legacyReload=normalizeSave(legacy);`);
  assert.equal(run("legacyReload.highSchoolMatch.groundBallInPlayState.supported"), true);
  assert.equal(run("legacyReload.highSchoolMatch.groundBallInPlayState.defensiveAccess.reachResolution===undefined"), true);
});
console.log(`${passed}/${passed} PASS`);
