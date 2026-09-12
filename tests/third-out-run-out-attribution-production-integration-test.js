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
run(`
  function pitcherStats(m,side="home") { return m.gameRecord.playerLines[getCurrentHighSchoolMatchDefender(m,side,"投手").id].pitching; }
  function applyDP(outs) { const m=forceMatch([true,true,true],outs);const r=resolveForce(m).result;applyInfieldResolutionToHighSchoolMatch(m,"challenge",r);return {m,r}; }
`);
test("production DP consumes ordered retirements with force at retirement",()=>{
  run('var x=applyDP(1);m=x.m;var result=x.r;');
  assert.equal(run('m.lastDefensiveResolution.thirdOutResolution.thirdRetirement.runnerId'),run('result.runnerSettlement.retirements[1].runnerId'));
  assert.equal(run('result.runnerSettlement.retirements[0].forceStateAtRetirement.forceTargets[result.runnerSettlement.retirements[0].runnerId]'),"second");
});
test("loaded 1-out DP classifies BR before first and clears bases",()=>{
  assert.equal(run('m.lastDefensiveResolution.thirdOutResolution.thirdOutType'),"batterRunnerBeforeFirst");
  assert.equal(run('m.outs'),3);assert.deepEqual(json('m.runners'),[null,null,null]);
});
test("invalid run never generates run event",()=>assert.equal(run('m.simulationLog.filter(e=>e.type==="run").length'),0));
test("invalid run leaves GameRecord total unchanged",()=>{assert.equal(run('m.gameRecord.totals.away.runs'),0);assert.equal(run('m.scores.away'),1);});
test("DP pitcher outs are exactly two with one BF",()=>{assert.equal(run('pitcherStats(m).outsRecorded'),2);assert.equal(run('pitcherStats(m).BF'),1);});
test("third-out save/load and event replay are idempotent",()=>{
  run('var restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;var beforeReplay=JSON.stringify(restored);applyInfieldResolutionToHighSchoolMatch(restored,"challenge",result);');
  assert.equal(run('JSON.stringify(restored)===beforeReplay'),true);
  run('var pa=restored.simulationLog.find(e=>e.type==="plateAppearance");var recordBefore=JSON.stringify(restored.gameRecord);MatchGameRecord.recordEvent(restored.gameRecord,pa,{rosters:restored.rosters});');
  assert.equal(run('JSON.stringify(restored.gameRecord)===recordBefore'),true);
});
test("half inning finalization preserves truth and only swaps once",()=>{
  run('var ended=m.pendingHalfInningTermination;advanceHighSchoolMatchAfterHalfInning(m);var afterSide=JSON.stringify(m);advanceHighSchoolMatchAfterHalfInning(m);');
  assert.equal(run('ended.thirdOutType'),"batterRunnerBeforeFirst");assert.equal(run('m.half'),"下");assert.equal(run('m.outs'),0);
  assert.equal(run('JSON.stringify(m)===afterSide'),true);
});
test("0-out loaded DP still emits exactly one legal GameRecord run",()=>{
  run('x=applyDP(0);m=x.m;result=x.r;');
  assert.equal(run('m.outs'),2);assert.equal(run('m.scores.away'),2);assert.equal(run('m.gameRecord.totals.away.runs'),1);
  assert.equal(run('m.simulationLog.filter(e=>e.type==="run").length'),1);assert.equal(run('m.gameRecord.playerLines[result.scoringRunnerIds[0]].batting.R'),1);
});
test("two-out force play uses first retirement, never last planned out",()=>{
  run('m=forceMatch([true,false,true],2);var r1=m.runners[0],r3=m.runners[2];var fact=ForceAdvancement.settleForceAdvancement({forceChain:m.defensiveSituation.forceChain,route:"forceSecond",resultCode:"oneOut"});var third=finalizeHighSchoolDefensiveThirdOut(m,{outs:2,runners:m.runners},{outsCreated:1,runnerSettlement:fact,runnersAfter:fact.runnersAfter,scoringAttempts:[{runnerId:r3,timing:"beforeThirdOut"}]});');
  assert.equal(run('third.thirdOutType'),"force");assert.deepEqual(json('third.legalScoringRunnerIds'),[]);
});
run(`
  function tagMatch(outsBeforeCatch=0) {
    const m=forceMatch([false,false,false],outsBeforeCatch);
    m.half="下";m.offenseTeam="home";m.defenseTeam="away";m.runners=[null,null,"player"];
    m.battingOrderIndex.home=m.rosters.home.lineup.findIndex(a=>a.id!=="player");m.currentBatter=getHighSchoolMatchLineupBatter(m,"home").id;
    const defender=getCurrentHighSchoolMatchDefender(m,"away","右外野手");
    const truth={version:"batted-ball-physical-v1",identity:"out-tag-physical",contactQuality:"solid",ballType:"flyBall",pace:"firm",direction:"rightSide",depth:"deep",executionEvidence:{continuousContactScore:.64}};
    const opportunity=BattedBallFlyBallDefense.buildFlyBallCatchOpportunity({identity:"out-tag-catch",physicalTruth:truth,runners:m.runners,outs:m.outs,
      runnerEntities:[{runnerId:"player",originBase:3,speed:9,reaction:9,baseballIQ:9}],preContactRunnerStates:{player:{movementState:"stationary",touchingOriginBase:true}},
      defenderContext:{defenderId:defender.id,name:defender.name,position:"右外野手",catching:10,reaction:10,range:10,arm:defender.arm,throwing:defender.arm,source:"simulation-roster"}});
    const caught=BattedBallFlyBallDefense.resolveFlyBallCatchExecution(opportunity,{executionRoll:0});
    m.flyBallCatchState=BattedBallFlyBallDefense.applyFlyBallCatchResult(opportunity,caught,{paCompatibilityResult:{result:"out",authority:"physicalFlyBallCatchToPACompatibility",officialScoring:"deferred"}});
    applyHighSchoolFlyBallCatchResolution(m);createHighSchoolRunnerTagUpSituation(m);return m;
  }
`);
test("real tag-up runner-only out adds one pitcher out, no BF or batter stats",()=>{
  run('m=tagMatch();var beforePitch={...pitcherStats(m,"away")};var beforeBatter=JSON.stringify(m.gameRecord.playerLines[m.currentBatter].batting);var beforePA=m.simulationLog.filter(e=>e.type==="plateAppearance").length;resolveHighSchoolRunnerTagUpDecision(m,"tagUpSendHome",{rolls:{runnerRoll:.999,throwRoll:0,receivingRoll:0}});');
  assert.equal(run('m.outs'),2);assert.equal(run('pitcherStats(m,"away").outsRecorded-beforePitch.outsRecorded'),1);
  assert.equal(run('pitcherStats(m,"away").BF'),run('beforePitch.BF'));
  assert.equal(run('JSON.stringify(m.gameRecord.playerLines[m.currentBatter].batting)===beforeBatter'),true);
  assert.equal(run('m.simulationLog.filter(e=>e.type==="plateAppearance").length'),run('beforePA'));
});
test("runner-only settled replay cannot duplicate pitcher out",()=>{
  run('var onceTag=JSON.stringify(m);resolveHighSchoolRunnerTagUpDecision(m,"tagUpSendHome");settleAndCloseHighSchoolRunnerTagUpSituation(m);');
  assert.equal(run('JSON.stringify(m)===onceTag'),true);
});
test("tag-up third out remains non-force and survives save/load",()=>{
  run('m=tagMatch(1);resolveHighSchoolRunnerTagUpDecision(m,"tagUpSendHome",{rolls:{runnerRoll:.999,throwRoll:0,receivingRoll:0}});var tagSaved=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;');
  assert.equal(run('m.pendingHalfInningTermination.thirdOutType'),"nonForceTag");assert.equal(run('m.outs'),3);
  assert.equal(run('pitcherStats(tagSaved,"away").outsRecorded'),2);assert.equal(run('pitcherStats(tagSaved,"away").BF'),1);
});
test("catch third out prevents tag-up and records caughtBallOut",()=>{
  run('m=tagMatch(2);');assert.equal(run('m.outs'),3);assert.equal(run('m.activeSituation'),null);
  assert.equal(run('m.pendingHalfInningTermination.thirdOutType'),"caughtBallOut");assert.equal(run('pitcherStats(m,"away").outsRecorded'),1);
});
test("CompetitionEvidence consumes corrected pitcher outs with unchanged BF sample",()=>{
  run(`m=tagMatch();resolveHighSchoolRunnerTagUpDecision(m,"tagUpSendHome",{rolls:{runnerRoll:.999,throwRoll:0,receivingRoll:0}});
    var pid=getCurrentHighSchoolMatchDefender(m,"away","投手").id;
    var ep={age:17,schoolStage:"high_school",available:true,primaryPosition:"P"};
    HighSchoolCompetitionFoundation.assignPrimarySchool(ep,{teamId:m.gameRecord.awayTeamId,organizationId:m.gameRecord.awayTeamId,teamType:"school"});
    HighSchoolCompetitionFoundation.registerDefinition(ep,{competitionId:"outs-series",competitionType:"school_tournament",entryUnit:"school",level:"high_school"});
    HighSchoolCompetitionFoundation.registerEdition(ep,{editionId:"outs-edition",competitionId:"outs-series",seasonYear:2031});
    var entry=HighSchoolCompetitionFoundation.enterCompetition(ep,{competitionEditionId:"outs-edition",teamId:m.gameRecord.awayTeamId});
    HighSchoolCompetitionFoundation.recordParticipation(ep,{playerId:pid,competitionEditionId:entry.competitionEditionId,teamId:entry.teamId,rosterStatus:"active_roster",participationStatus:"appeared"});
    HighSchoolCompetitionEvidence.restorePlayer(ep);MatchGameRecord.finalizeGameRecord(m.gameRecord,{inningsPlayed:5});m.completed=true;
    var evidence=HighSchoolCompetitionEvidence.integrateMatchEvidence(ep,{playerId:pid,competitionEntryId:entry.entryId,teamId:entry.teamId,match:m,position:"P",role:"starter"}).records.find(e=>e.evidenceType==="pitching"&&e.evidenceLayer==="fullGameProduction");`);
  assert.equal(run('evidence.performance.stats.outsRecorded'),2);assert.equal(run('evidence.performance.stats.BF'),1);assert.equal(run('evidence.sample.count'),1);
});
console.log(`Third-out production integration: ${passed}/${passed} PASS`);
