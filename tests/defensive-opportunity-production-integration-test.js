const assert = require("assert");
const { makeContext } = require("./high-school-career-test-context.js");
const { run, json } = makeContext();
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
run(`
  function opportunityMatch(position="二壘手", starts=true) {
    careerFixture(position, starts?"starter":"bench");choose("critical_offseason",1);
    const m=player.highSchoolMatch;
    player.throws="R";
    const base=m.rosters.home.teamRoster;
    const roster=starts && base.starters.some(actor=>actor.id==="player") ? base
      : TeamRosterFoundation.injectPlayerIntoRoster(base,createHighSchoolRosterPlayerActor(player,position),
        {playerRole:starts?"starter":"bench",playerPosition:position});
    m.rosters.home=TeamRosterFoundation.toMatchRoster(roster,TeamStrengthModel.deriveTeamStrengthProfile(roster));
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,
      runners:[m.rosters.away.lineup[1].id,null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",
      currentDomain:"defense",playerEntryCompleted:starts,playerLineupStatus:starts?"starter":"bench",
      playerFieldingAssignment:position,developmentPositionOverride:starts?position:"",position,
      defensiveSituation:{},activeSituation:null,groundBallInPlayState:null,lineDriveCatchState:null,flyBallCatchState:null});
    m.playerLineupSlot=m.rosters.home.lineup.findIndex(actor=>actor.id==="player");
    m.battingOrderIndex.away=2;m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id;
    getHighSchoolMatchSimulationEntity(m,m.currentBatter).power=4;
    return m;
  }
  function opportunityOptions(ballType=.1,direction=.95,depth=0) {
    return {tacticalActionOverride:"standardAttack",lineDriveCatchExecutionRoll:0,flyBallCatchExecutionRoll:0,
      situationOverrides:{playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10}},
      ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,
        physicalRolls:{contactQuality:.65,ballType,pace:.68,direction,depth},outcomeRoll:.5}};
  }
  function prepareOpportunity(type=.1,direction=.95,depth=0,position="二壘手") {
    const m=opportunityMatch(position);
    if(type>.8 && depth>.8) getHighSchoolMatchSimulationEntity(m,m.currentBatter).power=16;
    const opts=opportunityOptions(type,direction,depth);
    const event=prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
    return {m,event,opts};
  }
`);
test("production BBP -> responsibility -> supported 2B ground path", () => {
  run("var ground=prepareOpportunity();var groundTruth=ground.m.ordinaryDefensivePlateAppearanceState.battedBallPhysicalTruth;");
  const result = json("getHighSchoolDefensiveOpportunity(ground.m,groundTruth)");
  assert.equal(result.primaryPosition, "2B"); assert.equal(result.primaryDefenderId, "player");
  assert.equal(run("ground.m.groundBallInPlayState.supported"), true);
  assert.equal(run("ground.m.activeSituation.type"), "groundBallDefensiveDecision");
});
test("opportunity query does not mutate match, lifecycle or physical truth", () => {
  run("var queryBefore=JSON.stringify(ground.m);getHighSchoolDefensiveOpportunity(ground.m,groundTruth);");
  assert.equal(run("JSON.stringify(ground.m)===queryBefore"), true);
  assert.equal(run('Object.hasOwn(ground.m,"defensiveOpportunity")'), false);
  // 1.1 persists the linked opportunity identity inside the Reach stage, not a second opportunity authority.
  assert.equal(run('ground.m.groundBallInPlayState.defensiveAccess.reachResolution.opportunityIdentity'), run('getHighSchoolDefensiveOpportunity(ground.m,groundTruth).identity'));
});
test("ground active situation survives save with identical derived responsibility", () => {
  run("var groundReload=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;");
  assert.deepEqual(json("getHighSchoolDefensiveOpportunity(groundReload,groundTruth)"), json("getHighSchoolDefensiveOpportunity(ground.m,groundTruth)"));
  assert.deepEqual(json("groundReload.activeSituation"), json("ground.m.activeSituation"));
});
test("supported 2B ground decision still settles once", () => {
  run(`var groundChoice=getHighSchoolDefensiveMomentChoices(ground.m).find(choice=>choice.routeId==="secureFirstBaseOut");
    var resolution=resolveHighSchoolDefensivePlay(ground.m,groundChoice.matchDecision,()=>.8);
    applyInfieldResolutionToHighSchoolMatch(ground.m,groundChoice.matchDecision,resolution);
    var settledSnapshot=JSON.stringify({outs:ground.m.outs,order:ground.m.battingOrderIndex,logs:ground.m.simulationLog.length});
    applyInfieldResolutionToHighSchoolMatch(ground.m,groundChoice.matchDecision,resolution);`);
  assert.equal(run("ground.m.groundBallInPlayState.settlementApplied"), true);
  assert.equal(run("JSON.stringify({outs:ground.m.outs,order:ground.m.battingOrderIndex,logs:ground.m.simulationLog.length})===settledSnapshot"), true);
});
test("production shallow right line drive retains 2B catch compatibility", () => {
  run("var line=prepareOpportunity(.5);var lineTruth=line.m.lineDriveCatchState.physicalTruth;");
  assert.equal(run('lineTruth.depth'), "shallow");
  assert.equal(run("getHighSchoolDefensiveOpportunity(line.m,lineTruth).primaryDefenderId"), "player");
  assert.equal(run("line.m.lineDriveCatchState.supported"), true);
  assert.equal(run("line.m.lineDriveCatchState.catchResult.caught"), true);
  assert.equal(run("line.m.lineDriveCatchState.settlementApplied"), true);
});
test("production fly lookup consumes depth-aware responsibility", () => {
  run("var fly=prepareOpportunity(.95,.95,.99);var flyTruth=fly.m.flyBallCatchState.physicalTruth;");
  const result = json("getHighSchoolDefensiveOpportunity(fly.m,flyTruth)");
  assert.equal(result.primaryPosition, "RF");
  assert.equal(run("fly.m.flyBallCatchState.defenderContext.defenderId"), result.primaryDefenderId);
  assert.equal(run("fly.m.flyBallCatchState.defenderContext.assignmentAuthority"), "defensiveOpportunity");
  assert.equal(run("fly.m.flyBallCatchState.supported"), true);
  assert.equal(run("fly.m.flyBallCatchState.catchResult.caught"), true);
});
test("left/deep fly responsibility exists without expanding detailed catch execution", () => {
  run('var deepLeft={...flyTruth,identity:"deep-left-fixture",direction:"leftSide"};var leftContext=getHighSchoolFlyBallDefenderCatchContext(fly.m,deepLeft);');
  assert.equal(run("getHighSchoolDefensiveOpportunity(fly.m,deepLeft).primaryPosition"), "LF");
  assert.equal(run("leftContext.position"), "左外野手");
  assert.equal(run("BattedBallFlyBallDefense.buildFlyBallCatchOpportunity({physicalTruth:deepLeft,defenderContext:leftContext}).supported"), false);
});
test("shallow right fly uses infield topology, not ad hoc RF", () => {
  run('var shallowRight={...flyTruth,identity:"shallow-right-fixture",depth:"shallow"};');
  assert.equal(run("getHighSchoolDefensiveOpportunity(fly.m,shallowRight).primaryPosition"), "2B");
  assert.equal(run("getHighSchoolFlyBallDefenderCatchContext(fly.m,shallowRight).position"), "二壘手");
});
test("presentation/capability override cannot replace canonical fly defender", () => {
  assert.throws(() => run('getHighSchoolFlyBallDefenderCatchContext(fly.m,flyTruth,{flyBallDefenderContext:{defenderId:"fictional-player",position:"右外野手"}})'), /override cannot replace assignment/);
});
test("production player SS does not claim the NPC 2B responsibility", () => {
  run('var shortstop=prepareOpportunity(.1,.95,0,"游擊手");var shortstopTruth=shortstop.m.ordinaryDefensivePlateAppearanceState.battedBallPhysicalTruth;');
  assert.equal(run("getHighSchoolDefensiveOpportunity(shortstop.m,shortstopTruth).primaryPosition"), "2B");
  assert.notEqual(run("getHighSchoolDefensiveOpportunity(shortstop.m,shortstopTruth).primaryDefenderId"), "player");
  assert.equal(run("shortstop.m.groundBallInPlayState.supported"), false);
});
test("re-query after legitimate replacement binds new actor; pending catch cannot use stale actor", () => {
  run(`var pending=JSON.parse(JSON.stringify(fly.m));pending.flyBallCatchState.catchResult=null;pending.flyBallCatchState.settlementApplied=false;
    var oldRF=getCurrentHighSchoolMatchDefender(pending,"home","RF");
    var replacement={...oldRF,id:"new-rf",playerId:"new-rf"};
    pending.rosters.home.teamRoster.players.push(replacement);
    pending.rosters.home.lineup=pending.rosters.home.lineup.map(actor=>actor.id===oldRF.id?replacement:actor);
    pending.rosters.home.bench.push(oldRF);
    var pendingBefore=JSON.stringify(pending);`);
  assert.equal(run("getHighSchoolDefensiveOpportunity(pending,flyTruth).primaryDefenderId"), "new-rf");
  assert.throws(() => run("resolveHighSchoolFlyBallCatchOpportunity(pending)"), /stale or unsupported/);
  assert.equal(run("JSON.stringify(pending)===pendingBefore"), true);
});
test("save/reload rejects stale persisted Reach without rebinding the live play", () => {
  run("var reloadPlayer=JSON.parse(JSON.stringify(player));reloadPlayer.highSchoolMatch=pending;var pendingReload=JSON.parse(JSON.stringify(pending));");
  assert.throws(() => run("normalizeSave(reloadPlayer)"), /invalid or stale/);
  assert.equal(run("JSON.stringify(pending)===pendingBefore"), true);
});
test("ground reload cannot execute for a player no longer assigned to 2B", () => {
  run(`var staleGround=JSON.parse(JSON.stringify(groundReload));var home=staleGround.rosters.home;
    var replacement2B=home.bench.find(actor=>TeamRosterFoundation.normalizePosition(actor.position)==="2B" && actor.id!=="player");
    var outgoingPlayer=home.lineup.find(actor=>actor.id==="player");
    home.lineup=home.lineup.map(actor=>actor.id==="player"?{...replacement2B,defensivePosition:"2B"}:actor);
    home.bench=home.bench.filter(actor=>actor.id!==replacement2B.id);home.bench.push(outgoingPlayer);
    var staleGroundBefore=JSON.stringify(staleGround);`);
  assert.notEqual(run("getHighSchoolDefensiveOpportunity(staleGround,groundTruth).primaryDefenderId"), "player");
  assert.throws(() => run('resolveHighSchoolDefensivePlay(staleGround,"secure",()=>{throw new Error("must not consume execution RNG")})'), /stale or unsupported/);
  assert.equal(run("JSON.stringify(staleGround)===staleGroundBefore"), true);
});
test("computed but unsettled fly catch cannot apply a stale actor result", () => {
  run("var staleSettlement=JSON.parse(JSON.stringify(pendingReload));staleSettlement.flyBallCatchState.catchResult=fly.m.flyBallCatchState.catchResult;var staleSettlementBefore=JSON.stringify(staleSettlement);");
  assert.throws(() => run("applyHighSchoolFlyBallCatchResolution(staleSettlement)"), /stale or unsupported/);
  assert.equal(run("JSON.stringify(staleSettlement)===staleSettlementBefore"), true);
});
console.log(`${passed}/${passed} PASS`);
