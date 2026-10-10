'use strict';
const assert = require('assert/strict');
const { makeContext } = require('./high-school-career-test-context.js');
const Throw = require('../defensive-decision-throw-foundation.js');
const Record = require('../match-game-record.js');
const { run, json } = makeContext();
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS ' + name); }
  catch (error) { failed++; console.error('FAIL ' + name + '\n' + error.stack); }
}
// Declared production fixtures, not naturally sampled opportunities.
run(`
  function infieldFixture(options={}) {
    careerFixture(options.position||"二壘手","starter",77001);choose("critical_offseason",1);
    const m=player.highSchoolMatch;m.rosters=JSON.parse(JSON.stringify(m.rosters));
    const position=options.position||"二壘手",base=m.rosters.home.teamRoster;
    if(TeamRosterFoundation.getCurrentDefender(m.rosters.home,position).id!=="player") {
      const roster=TeamRosterFoundation.injectPlayerIntoRoster(base,createHighSchoolRosterPlayerActor(player,position),
        {playerRole:"starter",playerPosition:position});
      m.rosters.home=TeamRosterFoundation.toMatchRoster(roster,TeamStrengthModel.deriveTeamStrengthProfile(roster));
    }
    m.rosters=JSON.parse(JSON.stringify(m.rosters));
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:options.outs||0,
      runners:[null,null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",currentDomain:"defense",
      activeSituation:null,groundBallInPlayState:null,lineDriveCatchState:null,flyBallCatchState:null,defensiveSituation:{},
      playerFieldingAssignment:position,position,playerLineupStatus:"starter",playerEntryCompleted:true});
    m.playerLineupSlot=m.rosters.home.lineup.findIndex(a=>a.id==="player");
    m.battingOrderIndex.away=3;m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id;
    for(let i=0;i<(options.occupied??1);i++) {
      const a=m.rosters.away.lineup[i];a.speed=options.speed??1;m.runners[i]=a.id;
    }
    const batter=getHighSchoolMatchSimulationEntity(m,m.currentBatter);batter.speed=options.speed??1;batter.power=4;
    for(const p of ["1B","2B","SS","3B","C"]) {
      const a=TeamRosterFoundation.getCurrentDefender(m.rosters.home,p);if(a.id!=="player")Object.assign(a,{defense:10,arm:10});
    }
    if(options.weakReceiver)TeamRosterFoundation.getCurrentDefender(m.rosters.home,options.weakReceiver).defense=1;
    const before={order:m.battingOrderIndex.away,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length};
    if(options.densitySuppressed)ensureHighSchoolMatchDecisionDensityState(m).defensiveMeaningfulDecisionCount=6;
    prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"standardAttack",
      situationOverrides:{playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10,...options.capabilities}},
      ordinaryPlateAppearance:{physicalRolls:{contactQuality:.65,ballType:options.ballType??.1,pace:.68,
        direction:options.direction??.95,depth:options.depth??0},outcomeRoll:.5}});
    return {m,before};
  }
  function infieldFacts(m){return JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,
    order:m.battingOrderIndex,log:m.simulationLog,record:m.gameRecord,experience:m.matchExperience});}
  function infieldExecute(m,decision="secure",sample=.5) {
    beginGroundBallSituationDecision(m,decision);let rolls=0;
    const r=resolveHighSchoolDefensivePlay(m,decision,()=>{rolls++;return sample;});
    recordGroundBallSituationResolution(m,r);return {r,rolls};
  }
  function infieldPublic(m,decision="secure",sample=.5) {
    for(let i=0;i<m.simulationLog.length&&!isHighSchoolMatchDecisionVisible(m);i++)advanceHighSchoolPresentationCursor(m);
    const c=getHighSchoolYearOneMatchMomentChoices(m).find(c=>c.matchDecision===decision);
    if(!c)throw Error("missing public choice "+decision);
    if(!chooseHighSchoolYearOneMatchMoment(c.matchDecision,c.matchMomentId,()=>sample))throw Error("public handler rejected");
    return c;
  }
`);
test('R1 unsupported physical ground preserves original PA and has no synthetic decision', () => {
  for (const position of ['一壘手','三壘手','二壘手']) for (const outs of [0,2]) for(const densitySuppressed of [false,true]) {
    run(`var fixture=infieldFixture({position:${JSON.stringify(position)},direction:.05,outs:${outs},densitySuppressed:${densitySuppressed}});var m=fixture.m;`);
    assert.equal(run('m.groundBallInPlayState.supported'), false);
    assert.equal(run('getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth).primaryPosition'), 'SS');
    assert.equal(run('m.activeSituation'), null);
    assert.deepEqual(json('m.defensiveSituation'), {});
    assert.equal(run('m.simulationLog.filter(e=>e.type==="plateAppearance").length-fixture.before.pa'), 1);
    assert.deepEqual(json('m.simulationLog.filter(e=>e.type==="plateAppearance").at(-1).physicalTruth'),json('m.groundBallInPlayState.physicalTruth'));
    assert.equal(run('m.battingOrderIndex.away'), (run('fixture.before.order')+1)%9);
    assert.equal(run('m.simulationLog.filter(e=>["defensiveResolution","playerRoutinePlay"].includes(e.type)&&e.inning===5&&e.half==="上").length'), 0);
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'), []);
  }
});
test('unsupported airborne contact cannot become a player ground decision', () => {
  for (const position of ['二壘手','三壘手','一壘手']) {
    run(`var m=infieldFixture({position:${JSON.stringify(position)},ballType:.5,direction:.05}).m;`);
    assert.notEqual(run('m.groundBallInPlayState.physicalTruth.ballType'), 'groundBall');
    assert.equal(run('m.activeSituation'), null);
    assert.deepEqual(json('m.defensiveSituation'), {});
  }
});

test('unsupported ordinary PA preserves authority and initialized presentation metadata across cold reload', () => {
  // This declared inning-5 fixture retains unrelated inning-1 pitch adapters.
  // Compare the PA / defensive authority and presentation owned by this fallback.
  const projection='({facts:infieldFacts(m),phase:m.simulationPhase,cursor:m.simulationCursor,ground:m.groundBallInPlayState,ordinary:m.ordinaryDefensivePlateAppearanceState,presentation:{classification:m.playerEventClassification,gate:m.decisionGate,tension:m.decisionTension}})';
  run('var m=infieldFixture({direction:.05}).m;');
  const before=json(projection);
  assert.equal(run('m.playerEventClassification'), 'ordinaryPlay');
  assert.equal(run('m.decisionGate'), null);
  assert.equal(run('m.decisionTension'), 'none');
  run('saveGame();player=createInitialPlayer("Outside-scope cold reload");loadGame();m=player.highSchoolMatch;');
  assert.deepEqual(json(projection), before);
});
test('R3 public 2B direct throw receiver failure retains player execution and teammate attribution', () => {
  run('var m=infieldFixture({weakReceiver:"1B"}).m;var c=infieldPublic(m);var r=m.lastDefensiveResolution;');
  assert.equal(run('r.outsCreated'), 0);
  assert.equal(run('r.playerLeg.firstThrow'), 'completed');
  assert.equal(run('r.receiverResolution.receiverId'), run('TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").id'));
  assert.equal(run('r.receiverResolution.secured'), false);
  assert.equal(run('r.responsibleActor'), 'teammate');
  assert.equal(run('r.error'), false);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.E'), 0);
  const evidence=json('MatchExperienceDevelopment.deriveMatchExperienceEvidence(m)').filter(e=>e.situation.playFamily==='secondBaseMeaningful');
  assert(evidence.length);
  for(const e of evidence)assert.equal(e.attribution.responsibleActor,'teammate');
});
test('actor-based direct out credits actual 1B PO and player 2B A exactly once', () => {
  run('var m=infieldFixture().m;var c=infieldPublic(m);var event=m.simulationLog.findLast(e=>e.type==="defensiveResolution");');
  assert.equal(run('m.outs'), 1);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.A'), 1);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").id).defense.PO'), 1);
  assert(run('event.actionFacts.actions.some(a=>a.type==="baseTouch"&&a.actorPosition==="1B")'));
  assert.equal(run('event.decisionProvenance.decidedBy'),'player');
  assert(run('event.decisionIdentity&&event.physicalIdentity&&event.availableOptions.length'));
  run('var once=infieldFacts(m);');
  assert.equal(run('chooseHighSchoolYearOneMatchMoment(c.matchDecision,c.matchMomentId,()=>{throw Error("reroll");})'),false);
  assert.equal(run('infieldFacts(m)'),run('once'));
});
test('4-6-3 and 6-4-3 record actual retirement participants without changing raw execution', () => {
  for(const position of ['二壘手','游擊手']) {
    run(`var m=infieldFixture({position:${JSON.stringify(position)},direction:${position==='游擊手'?'.05':'.95'}}).m;
      var x=infieldExecute(m,"challenge",.8);var raw=JSON.stringify(x.r);applyInfieldResolutionToHighSchoolMatch(m,"challenge",x.r);`);
    assert.equal(run('x.rolls'),1);
    assert.equal(run('x.r.outsCreated'),2);
    assert.equal(run('JSON.stringify(x.r)'),run('raw'));
    for(const p of ['2B','SS','1B'])assert.equal(run(`MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"${p}").id).defense.DP`),1);
    const pivot=position==='二壘手'?'SS':'2B';
    assert.equal(run(`MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"${pivot}").id).defense.PO`),1);
    assert.equal(run(`MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"${pivot}").id).defense.A`),1);
  }
});
test('shared baseTouch attribution creates PO without a nonexistent throw assist', () => {
  for(const position of ['1B','3B']) {
    const actionFacts=Throw.createActionFacts({playIdentity:'touch-'+position,physicalIdentity:'physical-touch',actions:[
      {actorId:'player',actorPosition:position,type:'field',targetBase:position==='1B'?'first':'third',status:'completed'},
      {actorId:'player',actorPosition:position,type:'baseTouch',runnerId:'runner',targetBase:position==='1B'?'first':'third',status:'completed'}]});
    const attribution=Throw.projectDefensiveAttribution(actionFacts,[{runnerId:'runner',targetBase:position==='1B'?'first':'third',sequence:1}]);
    const record=Record.createGameRecord({gameId:'touch'});
    Record.recordEvent(record,{sequence:0,type:'defensivePlay',playerId:'player',playerPosition:position,actionFacts,defensiveAttribution:attribution,outsCreated:1},{playerId:'player'});
    assert.equal(record.playerLines.player.defense.PO,1);
    assert.equal(record.playerLines.player.defense.A,0);
  }
});
test('routine and meaningful final scoring facts agree and preserve execution actions', () => {
  for(const routine of [false,true])for(const outs of [0,2]) {
    run(`var m=infieldFixture({occupied:3,outs:${outs}}).m;
      var r=${routine?'resolveRoutineDefensivePlay(m,m.defensiveSituation,()=>.8,{densitySuppressed:true})':'infieldExecute(m,"secure",.8).r'};
      var raw=JSON.stringify(r);${routine?'applyRoutineDefensiveResolutionToHighSchoolMatch(m,r)':'applyInfieldResolutionToHighSchoolMatch(m,"secure",r)'};
      var final=m.simulationLog.findLast(e=>e.type===${JSON.stringify(routine?'playerRoutinePlay':'defensiveResolution')});`);
    assert.equal(run('final.runsAllowed'),outs===0?1:0);
    assert.equal(run('m.lastDefensiveResolution.runsAllowed'),run('final.runsAllowed'));
    assert.deepEqual(json('final.actionFacts'),json('r.actionFacts'));
    assert.equal(run('JSON.stringify(r)'),run('raw'));
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
  }
});
test('pending, executed receiver failure, failed control and settled cold reload are exactly once', () => {
  for(const options of [{},{weakReceiver:'1B'},{failedControl:true}]) {
    run(`var m=infieldFixture(${JSON.stringify(options)}).m;var pending=JSON.parse(JSON.stringify(m.activeSituation));
      saveGame();player=createInitialPlayer("cold pending");loadGame();m=player.highSchoolMatch;`);
    assert.deepEqual(json('m.activeSituation'),json('pending'));
    run(`var cursor=m.simulationCursor;${options.failedControl?'m.defensiveSituation.windows={...m.defensiveSituation.windows,fielding:-20};':''}
      var x=infieldExecute(m);var originalRandom=Math.random;Math.random=()=>{throw Error("rebuild RNG");};`);
    try {
      run('var restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;');
      assert.equal(run('restored.simulationCursor'),run('cursor'));
      assert.deepEqual(json('restored.activeSituation.resolution.executionEvidence.actionFacts'),json('x.r.actionFacts'));
    } finally {run('Math.random=originalRandom;');}
    run(`saveGame();player=createInitialPlayer("cold executed");loadGame();m=player.highSchoolMatch;resumeResolvedHighSchoolGroundBallSettlement(m);var once=infieldFacts(m);var cached=JSON.parse(JSON.stringify(m.lastDefensiveResolution));
      saveGame();player=createInitialPlayer("cold settled");loadGame();m=player.highSchoolMatch;applyInfieldResolutionToHighSchoolMatch(m,"secure",x.r);`);
    assert.equal(run('infieldFacts(m)'),run('once'));
    assert.deepEqual(json('m.lastDefensiveResolution'),json('cached'));
  }
});
test('executed save rejects altered receiver capability, identity and action facts before mutation', () => {
  for(const mutation of [
    'TeamRosterFoundation.getCurrentDefender(bad.highSchoolMatch.rosters.home,"1B").defense=1',
    'bad.highSchoolMatch.activeSituation.resolution.executionEvidence.receiverResolution.receiverId="bench"',
    'bad.highSchoolMatch.activeSituation.resolution.executionEvidence.actionFacts.actions[0].actorId="bench"']) {
    run('var m=infieldFixture().m;infieldExecute(m);var bad=JSON.parse(JSON.stringify(player));');
    run(mutation);
    assert.throws(()=>run('normalizeSave(bad)'),/Stale|stale|Invalid|integrity/);
  }
});
test('2B delivery failure, receiver unavailable, late runner contest and clean out stay distinct', () => {
  for(const scenario of ['delivery','unavailable','late','out']) {
    run(`var m=infieldFixture().m;var selected=getInfieldDecisionChoice(m.defensiveSituation,m,"secure");
      ${scenario==='delivery'?'m.defensiveSituation.windows={...m.defensiveSituation.windows,throw:-20};':''}
      ${scenario==='unavailable'?'m.defensiveSituation.teammates={...m.defensiveSituation.teammates,firstBaseReceiver:{...m.defensiveSituation.teammates.firstBaseReceiver,receivingAvailable:false}};':''}
      ${scenario==='late'?'m.defensiveSituation.routeWindows={...m.defensiveSituation.routeWindows,firstBaseOutWindow:{state:"expired"}};':''}
      var x=${scenario==='late'?'(()=>{let rolls=0;const sample=()=>{rolls++;return .5;};return {r:resolveSecondBaseInitiatedRoute(m.defensiveSituation,selected,sample(),m),rolls};})()':'infieldExecute(m)'};`);
    assert.equal(run('x.rolls'),1);
    assert.equal(run('x.r.outsCreated'),scenario==='out'?1:0);
    assert.equal(run('x.r.playerLeg.firstThrow'),scenario==='delivery'?'notCompleted':'completed');
    assert.equal(run('x.r.receiverResolution.secured'),['late','out'].includes(scenario));
    assert.equal(run('x.r.responsibleActor'),scenario==='unavailable'?'teammate':scenario==='late'?'timingWindow':'player');
  }
});
test('actual density suppression uses automatic physical route and final evidence', () => {
  for(const weakReceiver of [false,true]) {
    run(`var m=infieldFixture({densitySuppressed:true,${weakReceiver?'weakReceiver:"1B",':''}occupied:3,outs:2}).m;
      var event=m.simulationLog.findLast(e=>e.type==="playerRoutinePlay");`);
    assert.equal(run('m.activeSituation'),null);
    assert.equal(run('event.decisionProvenance.decidedBy'),'system');
    assert.equal(run('event.outsCreated'),weakReceiver?0:1);
    assert.equal(run('event.runsAllowed'),weakReceiver?1:0);
    assert.equal(run('event.runsAllowed'),run('m.lastDefensiveResolution.runsAllowed'));
    assert(run('event.actionFacts.physicalIdentity'));
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
  }
});
test('declared legacy 2B cover/pivot credits receiving force PO and relay A with explicit source', () => {
  run(`var m=infieldFixture().m;m.activeSituation=null;m.groundBallInPlayState=null;
    setHighSchoolDefensiveBallContext(m,"normalGrounder");
    buildInfieldMeaningfulMoment(m,player,{playerPosition:"二壘手",primaryFielderPosition:"游擊手",ballDirection:"leftSide",
      playerCapabilities:{fielding:10,reaction:10,range:10,arm:10,throwing:10,decision:10},runnerSpeeds:[1,null,null],batterSpeed:1,
      routeWindowOverrides:{doublePlayWindow:"wide"}});
    var r=resolveRoutineDefensivePlay(m,m.defensiveSituation,()=>.8);applyRoutineDefensiveResolutionToHighSchoolMatch(m,r);`);
  assert.equal(run('r.outsCreated'),2);
  assert.equal(run('r.actionFacts.physicalIdentity'),null);
  assert.equal(run('r.actionFacts.sourceAuthority'),'declaredLegacyInfieldScenario');
  const line=json('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense');
  assert.equal(line.PO,1);assert.equal(line.A,1);assert.equal(line.DP,1);
});
test('confirmed receiver error is charged only to that actor; duplicate events and reload cannot recount', () => {
  const playIdentity='receiver-error';
  const actionFacts=Throw.createActionFacts({playIdentity,physicalIdentity:'ball',actions:[
    {actorId:'player',actorPosition:'2B',type:'throw',targetBase:'first',receiverId:'receiver',status:'completed'},
    {actorId:'receiver',actorPosition:'1B',type:'receive',targetBase:'first',status:'failed',errorCharged:true,
      dependsOn:[playIdentity+'|action|1']} ]});
  const defensiveAttribution=Throw.projectDefensiveAttribution(actionFacts,[]);
  let record=Record.createGameRecord({gameId:'errors'});
  Record.recordEvent(record,{sequence:0,type:'plateAppearance',offenseTeam:'away',batterId:'batter',result:'error'});
  const event={sequence:1,type:'defensivePlay',offenseTeam:'away',actionFacts,defensiveAttribution};
  Record.recordEvent(record,event,{playerId:'player'});
  record=Record.normalizeGameRecord(record);
  Record.recordEvent(record,{...event,sequence:2},{playerId:'player'});
  assert.equal(record.playerLines.player.defense.E,0);
  assert.equal(record.playerLines.receiver.defense.E,1);
  assert.deepEqual(Record.getIntegrityIssues(record),[]);
});
test('shared attribution rejects an out dependent on failed receive or an altered actor projection', () => {
  const facts=Throw.createActionFacts({playIdentity:'invalid',actions:[
    {actorId:'receiver',actorPosition:'1B',type:'receive',status:'failed'},
    {actorId:'receiver',actorPosition:'1B',type:'baseTouch',status:'completed',runnerId:'batter',targetBase:'first',dependsOn:['invalid|action|1']}]});
  assert.throws(()=>Throw.projectDefensiveAttribution(facts,[{runnerId:'batter',targetBase:'first',sequence:1}]),/incomplete action/);
  const valid=Throw.createActionFacts({playIdentity:'forged',actions:[
    {actorId:'receiver',actorPosition:'1B',type:'baseTouch',status:'completed',runnerId:'batter',targetBase:'first'}]});
  const forged=JSON.parse(JSON.stringify(Throw.projectDefensiveAttribution(valid,[{runnerId:'batter',targetBase:'first',sequence:1}])));
  forged.actors[0].PO=2;
  const record=Record.createGameRecord({gameId:'forged'}),before=JSON.stringify(record);
  assert.throws(()=>Record.recordEvent(record,{type:'defensivePlay',sequence:0,actionFacts:valid,defensiveAttribution:forged}),/attribution does not match/);
  assert.equal(JSON.stringify(record),before,'invalid attribution rejects before record mutation');
});
test('pre-contract SS executed save retains admission and deterministic settlement', () => {
  run(`var m=infieldFixture({position:"游擊手",direction:.05}).m;var x=infieldExecute(m);var historical=JSON.parse(JSON.stringify(player));
    for(const raw of [historical.highSchoolMatch.groundBallInPlayState.shortstopExecution.resolution,
      historical.highSchoolMatch.activeSituation.resolution.executionEvidence]){delete raw.actionFacts;delete raw.executionSample;}
    var historicalCursor=historical.highSchoolMatch.simulationCursor;var restored=normalizeSave(historical).highSchoolMatch;
    resumeResolvedHighSchoolGroundBallSettlement(restored);`);
  assert.equal(run('restored.outs'),1);
  assert.equal(run('restored.simulationCursor'),run('historicalCursor'));
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(restored.gameRecord)'),[]);
});
test('4-6-3 completed pivot cannot guarantee a weak second throw; first out is retained', () => {
  run(`var m=infieldFixture().m;var ss=TeamRosterFoundation.getCurrentDefender(m.rosters.home,"SS");ss.arm=1;
    m.defensiveSituation.teammates={...m.defensiveSituation.teammates,shortstop:{...m.defensiveSituation.teammates.shortstop,
      capabilities:{...m.defensiveSituation.teammates.shortstop.capabilities,throwing:1,arm:1}}};
    var x=infieldExecute(m,"challenge",.5);`);
  assert.equal(run('x.r.teammateLeg.shortstopPivot'),'completed');
  assert.equal(run('x.r.teammateLeg.shortstopSecondThrow'),'notCompleted');
  assert.equal(run('x.r.outsCreated'),1);
  assert.equal(run('x.r.responsibleActor'),'teammate');
  assert.equal(run('x.rolls'),1);
});
console.log(JSON.stringify({suite:'shared-infield-contract-2b-production-integration',passed,failed,evidenceOrigin:'EXPLICIT_PRODUCTION_FIXTURES'}));
if(failed)process.exitCode=1;
