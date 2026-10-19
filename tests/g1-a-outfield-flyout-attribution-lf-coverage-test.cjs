'use strict';
const assert = require('node:assert/strict');
const { makeContext } = require('./high-school-career-test-context.js');
const { run, json } = makeContext();
const evidence = { suite: 'g1-a-outfield-flyout-attribution-lf-coverage', positive: [], negative: [], continuity: [], capabilities: [] };
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
run(`
  function g1Fixture(direction=.5,outs=0,pending=false,executionRoll=0,catchAbility=null) {
    careerFixture("二壘手","starter",77001);choose("critical_offseason",1);
    const m=player.highSchoolMatch,base=m.rosters.home.teamRoster;
    const roster=base.starters.some(a=>a.id==="player")?base:TeamRosterFoundation.injectPlayerIntoRoster(base,
      createHighSchoolRosterPlayerActor(player,"二壘手"),{playerRole:"starter",playerPosition:"二壘手"});
    m.rosters.home=TeamRosterFoundation.toMatchRoster(roster,TeamStrengthModel.deriveTeamStrengthProfile(roster));
    m.rosters.home=JSON.parse(JSON.stringify(m.rosters.home)); // Explicit controlled capability/invalid-assignment inputs below.
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs,
      runners:[null,null,null],scores:{home:0,away:0},simulationPhase:"moment_1_resolved",
      currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",playerFieldingAssignment:"二壘手",
      developmentPositionOverride:"二壘手",position:"二壘手",defensiveSituation:{},activeSituation:null,
      groundBallInPlayState:null,lineDriveCatchState:null,flyBallCatchState:null});
    m.playerLineupSlot=m.rosters.home.lineup.findIndex(a=>a.id==="player");
    m.battingOrderIndex.away=2;m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id;
    getHighSchoolMatchSimulationEntity(m,m.currentBatter).power=16;
    if(catchAbility!==null){const actor=TeamRosterFoundation.getCurrentDefender(m.rosters.home,direction<.3?"LF":direction>.7?"RF":"CF");actor.defense=catchAbility;actor.speed=20;}
    const opts={tacticalActionOverride:"standardAttack",flyBallCatchExecutionRoll:executionRoll,
      ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,
        physicalRolls:{contactQuality:.65,ballType:.95,pace:.5,direction,depth:.5},outcomeRoll:.85,mappingRolls:{hit:.85,extraBase:.5}}};
    if(pending){m.offensiveTacticalActionState={selectedTacticalAction:"standardAttack"};ensureHighSchoolOrdinaryGroundBallInPlayHandoff(m,opts);}
    return {m,opts};
  }
  function g1Facts(m) {
    return JSON.parse(JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,order:m.battingOrderIndex,logs:m.simulationLog.length,
      pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,record:m.gameRecord,
      playerContribution:m.playerContribution,experience:m.matchExperience}));
  }
  function g1RecordContext(m) {return {rosters:m.rosters,playerId:"player",playerTeam:"home",playerRole:"starter",playerPosition:"二壘手"};}
`);

for (const [position, direction] of [['LF', .05], ['CF', .5], ['RF', .95]]) for (const outs of [0, 1, 2]) {
  test(`${position} O${outs}: original PA, retirement, actual PO/chance and continuation`, () => {
    run(`var x=g1Fixture(${direction},${outs});var m=x.m;var before=g1Facts(m);var event=prepareHighSchoolDefensiveMomentFromSimulation(m,x.opts);`);
    const row = json(`({position:${JSON.stringify(position)},outsBefore:${outs},physical:m.flyBallCatchState.physicalTruth,
      admission:m.flyBallCatchState.admission,defender:m.flyBallCatchState.defenderContext,
      access:m.flyBallCatchState.defensiveAccess,catchResult:m.flyBallCatchState.catchResult,
      credit:event.flyBallCatchCredit,before,after:g1Facts(m),event,matchIntegrity:getHighSchoolMatchStateIntegrityIssues(m),
      recordIntegrity:MatchGameRecord.getIntegrityIssues(m.gameRecord)})`);
    assert(row.event && row.catchResult.caught);
    assert.equal(row.after.outs, outs + 1);
    assert.equal(row.after.pa - row.before.pa, 1);
    assert.equal(row.event.thirdOutResolution.orderedRetirements.length, 1);
    assert.equal(row.event.thirdOutResolution.orderedRetirements[0].outType, 'caughtBallOut');
    const actorId = row.defender.defenderId;
    assert.notEqual(actorId, 'player');
    for (const [id, line] of Object.entries(row.after.record.playerLines)) {
      const old = row.before.record.playerLines[id]?.defense || { PO: 0, chances: 0, A: 0, E: 0 };
      assert.equal(line.defense.PO - old.PO, id === actorId ? 1 : 0, 'actual putout owner');
      assert.equal(line.defense.chances - old.chances, id === actorId ? 1 : 0, 'actual chance owner');
      assert.equal(line.defense.A - old.A, 0);
      assert.equal(line.defense.E - old.E, 0);
    }
    const batter = row.after.record.playerLines[row.event.batterId].batting;
    const prior = row.before.record.playerLines[row.event.batterId].batting;
    assert.equal(batter.PA - prior.PA, 1); assert.equal(batter.AB - prior.AB, 1);
    assert.equal(batter.H - prior.H, 0);
    assert.deepEqual(row.after.record.totals, row.before.record.totals);
    assert.deepEqual(row.after.scores, row.before.scores);
    assert.deepEqual(row.after.playerContribution, row.before.playerContribution, 'NPC catch is not player performance');
    assert.equal(json('MatchExperienceDevelopment.deriveMatchExperienceEvidence(m).filter(e=>e.playerId==="player"&&e.evidenceType==="active").length'), 0);
    row.npcPlayerActiveEvidence = 0;
    assert.deepEqual(row.matchIntegrity, []); assert.deepEqual(row.recordIntegrity, []);
    assert.equal(row.credit.physicalIdentity, row.physical.identity);
    assert.equal(row.credit.capabilityProvenance.actorId, actorId);
    assert.deepEqual(row.defender.capabilityProvenance.overrides, {});
    assert.equal(row.after.record.eventRefs.filter(r => r.defensivePlayIdentity === row.credit.playIdentity).length, 1);
    assert(row.after.record.eventRefs.some(r => r.eventId === row.credit.paEventId && r.type === 'plateAppearance'));
    run('var stable=JSON.stringify(g1Facts(m));applyHighSchoolFlyBallCatchResolution(m);resolveHighSchoolFlyBallCatchOpportunity(m,{flyBallCatchExecutionRoll:.999});');
    assert(run('stable===JSON.stringify(g1Facts(m))'), 'duplicate callback is inert');
    if (outs === 2) {
      run('var transitionTicks=0;while(m.half==="上"&&transitionTicks++<100)advanceHighSchoolMatchPlaybackStep(m);');
      const transition = json('({half:m.half,outs:m.outs,pa:g1Facts(m).pa,issues:getHighSchoolMatchStateIntegrityIssues(m),line:MatchGameRecord.getPlayerGameLine(m.gameRecord,event.fielderId)})');
      assert.equal(transition.half, '下'); assert.equal(transition.outs, 0);
      assert.equal(transition.pa, row.after.pa); assert.deepEqual(transition.issues, []);
      assert.equal(transition.line.defense.PO, row.after.record.playerLines[actorId].defense.PO);
      row.continuation = transition;
    } else {
      run('var nextEvent=resolveSimulatedHighSchoolPlateAppearance(m,()=>.62,{allowPlayer:true});');
      assert(run('!!nextEvent')); assert.equal(json('g1Facts(m).pa'), row.after.pa + 1);
      assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
      row.continuation = json('({batter:m.currentBatter,outs:m.outs,pa:g1Facts(m).pa})');
    }
    // Keep useful execution evidence without copying the entire match/record.
    for (const side of ['before', 'after']) row[side] = { outs: row[side].outs, pa: row[side].pa,
      scores: row[side].scores, runners: row[side].runners, totals: row[side].record.totals,
      batter: row[side].record.playerLines[row.event.batterId], defender: row[side].record.playerLines[actorId],
      player: row[side].record.playerLines.player, eventRefs: row[side].record.eventRefs };
    evidence.positive.push(row);
  });
}

const corruptions = [
  ['wrong LF actor', .05, 's.defenderContext.defenderId="wrong-lf"'],
  ['wrong CF actor', .5, 's.defenderContext.defenderId="wrong-cf"'],
  ['wrong RF actor', .95, 's.defenderContext.defenderId="wrong-rf"'],
  ['invalid active roster', .05, 'm.rosters.home.lineup.find(a=>a.id===s.defenderContext.defenderId).defensivePosition="RF"'],
  ['capability mismatch', .05, 's.defenderContext.catching+=3'],
  ['capability source changed', .5, 'm.rosters.home.lineup.find(a=>a.id===s.defenderContext.defenderId).defense+=1'],
  ['physical identity mismatch', .95, 's.physicalTruth.identity+="-wrong"'],
  ['unsupported line contact', .05, 's.physicalTruth.ballType="lineDrive"'],
  ['unsupported shallow contact', .05, 's.physicalTruth.depth="shallow"'],
  ['illegal eligibility', .05, 's.catchWindow.state="expired"'],
  ['stale batter callback', .5, 's.admission.batterId="stale-batter"'],
  ['stale outs callback', .95, 's.admission.outs=2'],
  ['forged completed catch', .5, 's.catchResult={caught:true,result:"caught"}']
];
for (const [name, direction, edit] of corruptions) test('reject ' + name, () => {
  run(`var x=g1Fixture(${direction},0,true),m=x.m;var s=JSON.parse(JSON.stringify(m.flyBallCatchState));${edit};m.flyBallCatchState=s;var stable=JSON.stringify(g1Facts(m));`);
  let message;
  assert.throws(() => run('resolveHighSchoolFlyBallCatchOpportunity(m,x.opts);applyHighSchoolFlyBallCatchResolution(m);'), e => { message=e.message;return true; });
  assert(run('stable===JSON.stringify(g1Facts(m))'), 'rejected before Match/Record write');
  evidence.negative.push({ name, message, unchanged: true });
});

test('misses use the admitted classification; never credit a catch or infer a single', () => {
  for (const direction of [.05, .5, .95]) {
    run(`var x=g1Fixture(${direction},0,true,.999,4),m=x.m;var before=g1Facts(m);resolveHighSchoolFlyBallCatchOpportunity(m,x.opts);var event=applyHighSchoolFlyBallCatchResolution(m);`);
    const row = json('({direction:m.flyBallCatchState.physicalTruth.direction,state:m.flyBallCatchState,before,after:g1Facts(m),event})');
    assert.equal(row.state.catchResult.caught, false); assert(row.state.liveBallContinuation.ballRemainsLive);
    assert.equal(row.state.paCompatibilityResult.resolutionMode, 'compressedOfficialClassification');
    assert.equal(row.state.admission.continuation, 'preAdmittedCompressed');
    assert.equal(row.event.flyBallCatchCredit, null);
    for (const [id, line] of Object.entries(row.after.record.playerLines)) assert.deepEqual(line.defense, row.before.record.playerLines[id].defense);
    assert.equal(row.after.outs, row.before.outs); // Declared .85 sample is a hit, not a fabricated flyout.
    run('var stable=JSON.stringify(g1Facts(m));applyHighSchoolFlyBallCatchResolution(m);');
    assert(run('stable===JSON.stringify(g1Facts(m))'));
    evidence.negative.push({name:'miss '+row.direction,admission:row.state.admission,physicalIdentity:row.state.physicalTruth.identity,
      catchResult:row.state.catchResult,mapping:row.state.paCompatibilityResult,credit:row.event.flyBallCatchCredit,
      outsBefore:row.before.outs,outsAfter:row.after.outs,defenseUnchanged:true});
  }
});

test('unadmitted detailed miss fails closed and cannot reroll on the fly handler', () => {
  run('var x=g1Fixture(.05,0,true,.999,4),m=x.m;var s=JSON.parse(JSON.stringify(m.flyBallCatchState));s.admission.continuation="detailedCatchOnly";m.flyBallCatchState=s;var stable=JSON.stringify(g1Facts(m));');
  assert.throws(() => run('resolveHighSchoolFlyBallCatchOpportunity(m,x.opts)'), /cannot resample/);
  assert.equal(json('m.flyBallCatchState.catchResult.caught'), false);
  run('resolveHighSchoolFlyBallCatchOpportunity(m,{flyBallCatchExecutionRoll:0})');
  assert.throws(() => run('applyHighSchoolFlyBallCatchResolution(m)'), /cannot resample/);
  assert(run('stable===JSON.stringify(g1Facts(m))'));
  evidence.negative.push({name:'detailed miss',unchanged:true,cachedNotCaught:true,mapperInvoked:false});
});

test('record requires completed catch and correct identity; duplicate projections credit once', () => {
  run('var x=g1Fixture(.5),m=x.m;var event=prepareHighSchoolDefensiveMomentFromSimulation(m,x.opts);var stable=JSON.stringify(m.gameRecord);');
  const mutations = ['e.fielderId="player"','e.flyBallCatchCredit.actorId="wrong"','e.physicalIdentity="wrong"',
    'e.catchResult.caught=false','e.flyBallCatchCredit.retirement.outType="force"','e.flyBallCatchCredit.paEventId="missing"',
    'e.physicalTruth.ballType="lineDrive"','e.after.outs+=1','e.paCompatibilityResult.physicalIdentity="wrong"'];
  for (const edit of mutations) {
    run(`var e=JSON.parse(JSON.stringify(event));e.eventId="invalid-projection";${edit};`);
    assert.throws(() => run('MatchGameRecord.recordEvent(m.gameRecord,e,g1RecordContext(m))'), /Fly catch credit/);
    assert(run('stable===JSON.stringify(m.gameRecord)'));
  }
  run('var creditBefore=JSON.stringify(MatchGameRecord.getPlayerGameLine(m.gameRecord,event.fielderId).defense);var e={...event,eventId:"second-dispatch",type:"defensivePlay"};MatchGameRecord.recordEvent(m.gameRecord,e,g1RecordContext(m));MatchGameRecord.recordEvent(m.gameRecord,event,g1RecordContext(m));');
  assert(run('creditBefore===JSON.stringify(MatchGameRecord.getPlayerGameLine(m.gameRecord,event.fielderId).defense)'));
  assert(run('stable===JSON.stringify(m.gameRecord)'), 'double dispatch leaves original eventRefs unchanged');
  evidence.negative.push({name:'record rejection and dual dispatch',invalidProjections:mutations.length,creditOnce:true,paOnce:true});
});

test('real Save/Load before execution, after execution and after settlement retains unique credit', () => {
  for (const stage of ['pending', 'executed', 'settled']) {
    run('var x=g1Fixture(.05,0,true),m=x.m;');
    if (stage !== 'pending') run('resolveHighSchoolFlyBallCatchOpportunity(m,x.opts)');
    if (stage === 'settled') run('applyHighSchoolFlyBallCatchResolution(m)');
    run('var savedCatch=JSON.stringify(m.flyBallCatchState);saveGame();var previous=player;loadGame();m=player.highSchoolMatch;');
    assert(run('previous!==player')); assert(run('savedCatch===JSON.stringify(m.flyBallCatchState)'));
    run('resolveHighSchoolFlyBallCatchOpportunity(m,x.opts);applyHighSchoolFlyBallCatchResolution(m);var stable=JSON.stringify(g1Facts(m));applyHighSchoolFlyBallCatchResolution(m);');
    assert(run('stable===JSON.stringify(g1Facts(m))'));
    const saved = json('({state:m.flyBallCatchState,defense:MatchGameRecord.getPlayerGameLine(m.gameRecord,m.flyBallCatchState.defenderContext.defenderId).defense,pa:g1Facts(m).pa,outs:m.outs})');
    assert.equal(saved.defense.PO, 1);assert.equal(saved.defense.chances, 1);assert.equal(saved.pa, 1);assert.equal(saved.outs, 1);
    evidence.continuity.push({stage,physicalIdentity:saved.state.physicalTruth.identity,defense:saved.defense,pa:saved.pa,outs:saved.outs});
  }
});

test('actual NPC ability changes access/execution; weak LF is not automatically caught', () => {
  for (const defense of [0, 20]) {
    run(`var x=g1Fixture(.05),m=x.m;var actor=TeamRosterFoundation.getCurrentDefender(m.rosters.home,"LF");actor.defense=${defense};m.offensiveTacticalActionState={selectedTacticalAction:"standardAttack"};ensureHighSchoolOrdinaryGroundBallInPlayHandoff(m,x.opts);`);
    const supported = run('m.flyBallCatchState.supported');
    if (supported) run('resolveHighSchoolFlyBallCatchOpportunity(m,x.opts);applyHighSchoolFlyBallCatchResolution(m)');
    evidence.capabilities.push(json('({defense:actor.defense,actorId:actor.id,state:m.flyBallCatchState,outs:m.outs,record:m.gameRecord.totals})'));
  }
  assert.equal(evidence.capabilities[0].state.supported, false);
  assert.equal(evidence.capabilities[0].outs, 0);
  assert.equal(evidence.capabilities[1].state.catchResult.caught, true);
  assert.equal(evidence.capabilities[1].outs, 1);
});

test('same LF ball and secure roll: actual catching capability changes completed execution', () => {
  const pair=[];
  for (const ability of [4,8]) {
    run(`var x=g1Fixture(.05,0,true,.999,${ability}),m=x.m;resolveHighSchoolFlyBallCatchOpportunity(m,x.opts);applyHighSchoolFlyBallCatchResolution(m);`);
    pair.push(json('({physicalIdentity:m.flyBallCatchState.physicalTruth.identity,actor:m.flyBallCatchState.defenderContext,access:m.flyBallCatchState.defensiveAccess.level,catchResult:m.flyBallCatchState.catchResult,outs:m.outs,credit:m.flyBallCatchState.settlementFacts.event.flyBallCatchCredit})'));
  }
  assert.equal(pair[0].physicalIdentity,pair[1].physicalIdentity);
  assert.equal(pair[0].access,pair[1].access);
  assert.equal(pair[0].catchResult.executionEvidence.roll,pair[1].catchResult.executionEvidence.roll);
  assert.equal(pair[0].catchResult.caught,false);assert.equal(pair[1].catchResult.caught,true);
  evidence.capabilityExecutionPair=pair;
});

test('one predeclared public Career game completes with the original Record and development owners', () => {
  run('careerFixture("二壘手","starter",77001);choose("critical_offseason",1);var naturalMatch=player.highSchoolMatch;var ticks=playCareerMatchToEnd();');
  const natural=json('({seed:77001,ticks,completed:naturalMatch.completed,status:naturalMatch.gameRecord.status,scores:naturalMatch.scores,recordScore:naturalMatch.gameRecord.result.finalScore,matchIntegrity:getHighSchoolMatchStateIntegrityIssues(naturalMatch),recordIntegrity:MatchGameRecord.getIntegrityIssues(naturalMatch.gameRecord),development:naturalMatch.matchExperience,flyouts:naturalMatch.simulationLog.filter(e=>e.flyBallCatchCredit).map(e=>({physicalIdentity:e.physicalIdentity,credit:e.flyBallCatchCredit})),playerLine:MatchGameRecord.getPlayerGameLine(naturalMatch.gameRecord,"player")})');
  assert(natural.completed);assert.equal(natural.status,'final');assert.deepEqual(natural.scores,natural.recordScore);
  assert.deepEqual(natural.matchIntegrity,[]);assert.deepEqual(natural.recordIntegrity,[]);
  assert.equal(natural.development.settled,true);
  run('var naturalStable=JSON.stringify({record:naturalMatch.gameRecord,experience:naturalMatch.matchExperience,skills:player.baseballSkills});settleHighSchoolYearOneMatch(naturalMatch,"secure");');
  assert(run('naturalStable===JSON.stringify({record:naturalMatch.gameRecord,experience:naturalMatch.matchExperience,skills:player.baseballSkills})'));
  evidence.naturalGame=natural;
});

evidence.status = 'PASS'; evidence.passed = passed;
console.log('G1_A_EVIDENCE ' + JSON.stringify(evidence));
