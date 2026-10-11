'use strict';
const assert = require('assert/strict');
const { makeContext } = require('./high-school-career-test-context.js');
const { run, json } = makeContext();
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log('PASS ' + name); } catch(error) { failed++; console.error('FAIL ' + name + '\n' + error.stack); } }
// All mutated ball, runner, capability, and receiver inputs below are declared
// production fixtures. Only the separately labelled full-game witnesses use
// the canonical entry without any in-match override.
run(`
  function thirdBaseFixture(options={}) {
    const position=options.position||"三壘手";
    careerFixture(position,"starter",77001);choose("critical_offseason",1);
    const m=player.highSchoolMatch;m.rosters=JSON.parse(JSON.stringify(m.rosters));
    if(TeamRosterFoundation.getCurrentDefender(m.rosters.home,position).id!=="player") {
      const roster=TeamRosterFoundation.injectPlayerIntoRoster(m.rosters.home.teamRoster,createHighSchoolRosterPlayerActor(player,position),
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
    for(const i of (options.occupiedBases||Array.from({length:options.occupied??1},(_,index)=>index))) {
      const actor=m.rosters.away.lineup[i];actor.speed=options.runnerSpeed??1;actor.reaction=5;m.runners[i]=actor.id;
    }
    const batter=getHighSchoolMatchSimulationEntity(m,m.currentBatter);batter.speed=options.batterSpeed??1;batter.power=4;
    for(const p of ["1B","2B","SS","3B","C"]) {
      const actor=TeamRosterFoundation.getCurrentDefender(m.rosters.home,p);if(actor.id!=="player")Object.assign(actor,{defense:10,arm:10});
    }
    if(options.weakReceiver)TeamRosterFoundation.getCurrentDefender(m.rosters.home,options.weakReceiver).defense=1;
    if(options.weakPivotThrow)TeamRosterFoundation.getCurrentDefender(m.rosters.home,"2B").arm=1;
    if(options.densitySuppressed)ensureHighSchoolMatchDecisionDensityState(m).defensiveMeaningfulDecisionCount=6;
    prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"standardAttack",
      situationOverrides:{playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10,...options.capabilities}},
      ordinaryPlateAppearance:{physicalRolls:{contactQuality:options.contactQuality??.65,ballType:options.ballType??.1,pace:options.pace??.68,direction:options.direction??.005,depth:options.depth??0},outcomeRoll:.5}});
    return m;
  }
  function thirdBaseGeneric(options={}) {
    const m=thirdBaseFixture({occupied:2});m.activeSituation=null;m.groundBallInPlayState=null;
    setHighSchoolDefensiveBallContext(m,"normalGrounder");
    buildInfieldMeaningfulMoment(m,player,{playerPosition:"三壘手",primaryFielderPosition:"三壘手",ballDirection:"straightAtPlayer",ballDepth:"normal",
      playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10,...options.capabilities},
      runnerSpeeds:[1,1,null],batterSpeed:1,pivotCapabilities:{fielding:10,reaction:10,throwing:10}});
    if(options.weakReceiver)m.defensiveSituation.teammates.firstBaseReceiver.capabilities.fielding=1;
    return m;
  }
  function thirdBaseFacts(m) {return JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,order:m.battingOrderIndex,
    log:m.simulationLog,record:m.gameRecord,experience:m.matchExperience});}
  function thirdBaseExecute(m,decision="secure",sample=.8) {
    beginGroundBallSituationDecision(m,decision);let rolls=0;
    const r=resolveHighSchoolDefensivePlay(m,decision,()=>{rolls++;return sample;});recordGroundBallSituationResolution(m,r);return {r,rolls};
  }
  function thirdBasePublic(m,decision="secure",sample=.8) {
    for(let beat=0;beat<m.simulationLog.length&&!isHighSchoolMatchDecisionVisible(m);beat++)advanceHighSchoolPresentationCursor(m);
    const choice=getHighSchoolYearOneMatchMomentChoices(m).find(c=>c.matchDecision===decision);
    if(!choice)throw Error("Missing public 3B choice: "+decision);
    let rolls=0;const accepted=chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>{rolls++;return sample;});
    if(!accepted)throw Error("Public 3B choice rejected");return {choice,rolls};
  }
`);

test('3B receives a real ordinary physical primary ground opportunity',()=>{
  run('var m=thirdBaseFixture();');
  assert.equal(run('getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth).primaryPosition'),'3B');
  assert.equal(run('m.groundBallInPlayState.supported'),true);
  assert.equal(run('m.activeSituation.actor.id'),'player');
});
test('SS and 3B use mutually exclusive physical-source responsibilities',()=>{
  run('var m=thirdBaseFixture({position:"游擊手"});');
  assert.equal(run('getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth).primaryPosition'),'3B');
  assert.equal(run('m.groundBallInPlayState.supported'),false);
  assert.equal(run('m.activeSituation'),null);
  run('var m=thirdBaseFixture({position:"游擊手",direction:.05});');
  assert.equal(run('getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth).primaryPosition'),'SS');
  assert.equal(run('m.groundBallInPlayState.supported'),true);
});
test('5U controlled base touch is independent of arm and throwing on the supported physical path',()=>{
  const results=[];
  for(const ability of [1,10]) {
    run('var m=thirdBaseFixture({occupied:2,capabilities:{arm:'+ability+',throwing:'+ability+'}});var x=thirdBaseExecute(m,"lead",.5);var raw=JSON.stringify(x.r);applyInfieldResolutionToHighSchoolMatch(m,"lead",x.r);');
    assert.equal(run('x.rolls'),1);
    assert.equal(run('x.r.outsCreated'),1);
    assert.equal(run('x.r.routeId'),'stepThird');
    assert.equal(run('x.r.actionFacts.actions.some(a=>a.type==="throw"&&a.status==="completed")'),false);
    assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.PO'),1);
    assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.A'),0);
    assert.equal(run('JSON.stringify(x.r)'),run('raw'));
    results.push(json('({outs:x.r.outsCreated,error:x.r.error,quality:x.r.executionQuality,retirements:x.r.runnerSettlement.retirements})'));
  }
  assert.deepEqual(results[0],results[1]);
});
test('5-4-3 weak final 1B receive retains the first force retirement with teammate attribution',()=>{
  run('var m=thirdBaseFixture({weakReceiver:"1B"});var x=thirdBaseExecute(m,"challenge",.8);applyInfieldResolutionToHighSchoolMatch(m,"challenge",x.r);');
  assert.equal(run('x.r.outsCreated'),1);
  assert.equal(run('x.r.responsibleActor'),'teammate');
  assert.equal(run('x.r.teammateLeg.firstBaseReceive'),'failed');
  assert.equal(run('x.r.error'),false);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.E'),0);
  assert.deepEqual(json('x.r.runnerSettlement.retirements.map(r=>r.targetBase)'),['second']);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").id).defense.E'),1);
});
test('public physical 3B choice emits decision, player stage, teammate and final outcome evidence',()=>{
  run('var m=thirdBaseFixture();var publicResult=thirdBasePublic(m);var evidence=MatchExperienceDevelopment.deriveMatchExperienceEvidence(m);');
  assert.equal(run('publicResult.rolls'),1);
  const active=json('evidence').filter(e=>e.evidenceType==='active'&&e.situation.playFamily==='thirdBaseMeaningful');
  assert(active.length>=4);
  assert(active.some(e=>e.skillEvidence.component==='decision'));
  assert(active.some(e=>e.skillEvidence.component==='execution'));
  for(const e of active)assert(e.decisionEvidence&&e.executionEvidence&&e.outcomeEvidence);
});

test('responsibility boundary and NPC/player assignment use the same physical rule',()=>{
  for(const [direction,primary] of [[.005,'3B'],[.024999,'3B'],[.025,'SS'],[.05,'SS'],[.5,'SS'],[.95,'2B']]) {
    const truths=[],responsibilities=[];
    for(const position of ['三壘手','游擊手','二壘手']) {
      run('var m=thirdBaseFixture({position:'+JSON.stringify(position)+',direction:'+direction+'});');
      assert.equal(run('getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth).primaryPosition'),primary);
      truths.push(json('m.groundBallInPlayState.physicalTruth'));
      run('var sameTruth='+JSON.stringify(truths[0])+';');
      responsibilities.push(json('(()=>{const o=getHighSchoolDefensiveOpportunity(m,sameTruth);return {physicalIdentity:o.physicalIdentity,primaryPosition:o.primaryPosition,secondaryPositions:o.secondaryPositions,classification:DefensiveOpportunityFoundation.deriveGroundResponsibility(sameTruth)};})()'));
      assert.equal(run('getHighSchoolDefensiveOpportunity(m,sameTruth).primaryPosition'),primary);
      if(primary!=='3B'&&position==='三壘手') {
        assert.equal(run('m.groundBallInPlayState.supported'),false);
        assert.equal(run('m.activeSituation'),null);
        assert.deepEqual(json('m.defensiveSituation'),{});
      }
    }
    assert.deepEqual(responsibilities[0],responsibilities[1]);assert.deepEqual(responsibilities[1],responsibilities[2]);
  }
});
test('unsupported SS-side and airborne contacts preserve one original PA and no synthetic 3B play',()=>{
  for(const options of [{direction:.05},{direction:.95},{direction:.005,ballType:.5},{direction:.005,ballType:.9}]) {
    run('var m=thirdBaseFixture('+JSON.stringify(options)+');var event=m.simulationLog.findLast(e=>e.type==="plateAppearance");');
    assert.equal(run('m.groundBallInPlayState.supported'),false);
    assert.equal(run('m.activeSituation'),null);
    assert.equal(run('m.simulationLog.filter(e=>e.type==="plateAppearance"&&e.inning===5&&e.half==="上").length'),1);
    assert.equal(run('m.battingOrderIndex.away'),4);
    assert.deepEqual(json('event.physicalTruth'),json('m.groundBallInPlayState.physicalTruth'));
    assert.equal(run('m.simulationLog.some(e=>["defensiveResolution","playerRoutinePlay"].includes(e.type)&&e.inning===5&&e.playerPosition==="三壘手")'),false);
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
  }
});
test('3B Reach and Secure stay separate across hard / normal / charging demands',()=>{
  const profiles=[];
  for(const pace of [0,.4,.9]) {
    run('var m=thirdBaseFixture({pace:'+pace+',contactQuality:'+(pace===.9?'.95':'.65')+'});var access=m.groundBallInPlayState.defensiveAccess;');
    assert.equal(run('access.supported'),true);
    assert.equal(run('access.reachResolution.reached'),true);
    run('var x=thirdBaseExecute(m);');
    assert.equal(run('m.groundBallInPlayState.thirdBaseExecution.secureResolution.secured'),true);
    profiles.push(json('({pace:m.groundBallInPlayState.physicalTruth.pace,reach:access.reachResolution,secure:m.groundBallInPlayState.thirdBaseExecution.secureResolution})'));
  }
  assert.equal(profiles[0].pace,'weak');assert.equal(profiles[2].pace,'hard');
  assert.notDeepEqual(profiles[0].reach.ballDemand,profiles[2].reach.ballDemand,'weak and hard balls retain distinct movement / reaction demands');
  run('var m=thirdBaseFixture({pace:.9,contactQuality:.95,capabilities:{reaction:1,range:1,fielding:10,catching:10}});var op=getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth);var reachInput={physicalTruth:m.groundBallInPlayState.physicalTruth,opportunity:op,activeRoster:m.rosters.home,topologyVersion:op.topologyVersion,capabilities:{defenderId:"player",reaction:1,range:1,mobility:1,fielding:10,catching:10},roll:.5};var unreachable=DefensiveReachSecureFoundation.resolveReach(reachInput);var unavailableSecure=DefensiveReachSecureFoundation.resolveSecure({...reachInput,reachResult:unreachable});');
  assert.equal(run('unreachable.reached'),false);assert.equal(run('unavailableSecure.attemptAvailable'),false);
  assert.equal(run('unavailableSecure.secured'),false);assert.equal(run('m.activeSituation'),null);
  assert.equal(run('m.simulationLog.filter(e=>e.type==="plateAppearance"&&e.inning===5).length'),1);
});
test('same input new 3B physical responsibility does not rewrite career position or skill truth',()=>{
  run('var m=thirdBaseFixture();var profile=player.primaryPosition;var skills=JSON.stringify(player.baseballSkills);thirdBasePublic(m);');
  assert.equal(run('player.primaryPosition'),run('profile'));assert.equal(run('JSON.stringify(player.baseballSkills)'),run('skills'));
});
test('5-3 public out binds the true receiver and credits actual 3B A / 1B PO once',()=>{
  run('var m=thirdBaseFixture();var initialBatter=m.currentBatter;var result=thirdBasePublic(m);var final=m.lastDefensiveResolution;var event=m.simulationLog.findLast(e=>e.type==="defensiveResolution");');
  assert.equal(run('final.outsCreated'),1);
  assert.equal(run('final.routeId'),'secureFirstBaseOut');
  assert.equal(run('m.groundBallInPlayState.decisionThrowState.throwResolution.receiverPosition'),'1B');
  assert.equal(run('m.groundBallInPlayState.decisionThrowState.throwResolution.receiverId'),run('TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").id'));
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.A'),1);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.PO'),0);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").id).defense.PO'),1);
  assert.equal(run('event.decisionProvenance.decidedBy'),'player');
  assert(run('event.decisionIdentity&&event.contextSnapshot&&event.availableOptions.length&&event.physicalIdentity'));
  assert.equal(run('m.groundBallInPlayState.playSettlement.settlementApplied'),true);
  assert.equal(run('m.lastClosedSituationSummary.lifecycleState'),'closed');
  assert(run('m.gameRecord.eventRefs.some(e=>e.sequence===event.sequence)'));
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
});
test('secure failure cannot create possession, completed throw or actual retirement',()=>{
  run('var m=thirdBaseFixture({capabilities:{fielding:1,catching:1}});var x=thirdBaseExecute(m);applyInfieldResolutionToHighSchoolMatch(m,"secure",x.r);');
  assert.equal(run('x.r.outsCreated'),0);assert.equal(run('x.r.error'),true);
  assert.equal(run('x.r.playerLeg.control'),'failed');
  assert.equal(run('x.r.playerLeg.firstThrow'),'notAttempted');
  assert.equal(run('x.r.actionFacts.actions.some(a=>a.type==="throw"&&a.status==="completed")'),false);
  assert.equal(run('x.r.runnerSettlement.retirements.length'),0);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.E'),1);
});
test('long-throw offline error is the player stage and does not invent a teammate receive',()=>{
  run('var m=thirdBaseFixture({capabilities:{throwing:1}});var x=thirdBaseExecute(m);applyInfieldResolutionToHighSchoolMatch(m,"secure",x.r);');
  assert.equal(run('x.r.outsCreated'),0);assert.equal(run('x.r.error'),true);
  assert.equal(run('x.r.playerLeg.control'),'completed');assert.equal(run('x.r.playerLeg.firstThrow'),'failed');
  assert.equal(run('x.r.responsibleActor'),'player');
  assert.equal(run('x.r.actionFacts.actions.some(a=>a.type==="receive"&&a.status==="completed")'),false);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.E'),1);
});
test('completed 5-3 delivery with failed 1B receive is a teammate failure, with no false out or player E',()=>{
  run('var m=thirdBaseFixture({weakReceiver:"1B"});thirdBasePublic(m);var final=m.lastDefensiveResolution;var evidence=MatchExperienceDevelopment.deriveMatchExperienceEvidence(m);');
  assert.equal(run('final.outsCreated'),0);assert.equal(run('final.error'),false);
  assert.equal(run('final.playerLeg.firstThrow'),'completed');
  assert.equal(run('final.responsibleActor'),'teammate');
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.E'),0);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").id).defense.PO'),0);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").id).defense.E'),1);
  const active=json('evidence').filter(e=>e.evidenceType==='active'&&e.situation.playFamily==='thirdBaseMeaningful');
  assert.equal(run('m.simulationLog.findLast(e=>e.type==="plateAppearance").result'),'error');
  assert.equal(run('m.gameRecord.totals.home.errors'),1);
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
  assert(active.length>=4);
  for(const e of active){assert.equal(e.attribution.responsibleActor,'teammate');assert(e.skillEvidence.adjustedValue>=0);}
});
test('weak arm and fast batter create a timing-safe result independently of clean throw accuracy',()=>{
  run('var m=thirdBaseFixture({batterSpeed:20,capabilities:{arm:1,throwing:10}});var x=thirdBaseExecute(m);applyInfieldResolutionToHighSchoolMatch(m,"secure",x.r);');
  assert.equal(run('x.r.outsCreated'),0);assert.equal(run('x.r.error'),false);
  assert.equal(run('x.r.playerLeg.firstThrow'),'completed');
  assert.equal(run('x.r.responsibleActor'),'timingWindow');
  assert.equal(run('m.groundBallInPlayState.runnerThrowTiming.timingClassification'),'runnerClearlyAhead');
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
});
test('5U needs a true force chain; a lone second-base runner never grants a forced retirement',()=>{
  run('var m=thirdBaseFixture({occupiedBases:[1]});var choices=getHighSchoolDefensiveMomentChoices(m);');
  assert.equal(run('m.defensiveSituation.forceState.forceAtThird'),false);
  assert.equal(json('choices').some(c=>c.routeId==='stepThird'),false);
});
test('5U late runner contest and missing possession cannot manufacture a base-touch out',()=>{
  for(const options of [{occupied:2,runnerSpeed:20},{occupied:2,capabilities:{fielding:1,catching:1}}]) {
    run('var m=thirdBaseFixture('+JSON.stringify(options)+');var choices=getHighSchoolDefensiveMomentChoices(m);');
    const lead=json('choices').find(c=>c.routeId==='stepThird');
    if(lead) {
      run('var x=thirdBaseExecute(m,"lead",.8);');assert.equal(run('x.r.outsCreated'),0);
      assert.equal(run('x.r.actionFacts.actions.some(a=>a.type==="baseTouch"&&a.status==="completed")'),false);
    } else assert.equal(run('m.defensiveSituation.routeWindows.forceThirdWindow.state'),'expired');
  }
});
test('5-4-3 full double play has ordered actual retirements and the real 3B / 2B / 1B actors',()=>{
  run('var m=thirdBaseFixture();var x=thirdBaseExecute(m,"challenge",.8);var raw=JSON.stringify(x.r);applyInfieldResolutionToHighSchoolMatch(m,"challenge",x.r);');
  assert.equal(run('x.rolls'),1);assert.equal(run('x.r.outsCreated'),2);
  assert.deepEqual(json('x.r.runnerSettlement.retirements.map(r=>r.targetBase)'),['second','first']);
  assert.equal(run('x.r.teammateLeg.secondBasePivot'),'completed');
  assert.equal(run('x.r.teammateLeg.secondBaseSecondThrow'),'completed');
  assert.equal(run('x.r.teammateLeg.firstBaseReceive'),'completed');
  for(const p of ['3B','2B','1B'])assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"'+p+'").id).defense.DP'),1);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.A'),1);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"2B").id).defense.PO'),1);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"2B").id).defense.A'),1);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").id).defense.PO'),1);
  assert.equal(run('JSON.stringify(x.r)'),run('raw'));
});
test('5-4-3 completed pivot with weak second throw retains first out and credits no fake DP',()=>{
  run('var m=thirdBaseFixture({weakPivotThrow:true});var x=thirdBaseExecute(m,"challenge",.5);applyInfieldResolutionToHighSchoolMatch(m,"challenge",x.r);');
  assert.equal(run('x.r.teammateLeg.secondBasePivot'),'completed');
  assert.equal(run('x.r.teammateLeg.secondBaseSecondThrow'),'failed');
  assert.equal(run('x.r.outsCreated'),1);assert.equal(run('x.r.executionQuality'),'partial');
  assert.equal(run('x.r.responsibleActor'),'teammate');assert.equal(run('x.r.error'),false);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"2B").id).defense.E'),1);
  for(const p of ['3B','2B','1B'])assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"'+p+'").id).defense.DP'),0);
});
test('5-4-3 failed first throw records zero retirements and does not execute the relay',()=>{
  run('var m=thirdBaseFixture({capabilities:{throwing:1}});var x=thirdBaseExecute(m,"challenge",.8);');
  assert.equal(run('x.r.outsCreated'),0);assert.equal(run('x.r.error'),true);
  assert.equal(run('x.r.runnerSettlement.retirements.length'),0);
  assert.equal(run('x.r.actionFacts.actions.some(a=>a.type==="pivot"&&a.status==="completed")'),false);
});
test('illegal second-base force context offers no 5-4-3 start route',()=>{
  run('var m=thirdBaseFixture({occupiedBases:[1,2]});var choices=getHighSchoolDefensiveMomentChoices(m);');
  assert.equal(run('m.defensiveSituation.forceState.forceAtSecond'),false);
  assert.equal(json('choices').some(c=>c.routeId==='initiate543'),false);
});

test('fast batter makes a clean 5-4-3 relay partial without charging player execution failure',()=>{
  run('var m=thirdBaseFixture({batterSpeed:20});var x=thirdBaseExecute(m,"challenge",.8);applyInfieldResolutionToHighSchoolMatch(m,"challenge",x.r);');
  assert.equal(run('x.r.outsCreated'),1);
  assert.equal(run('x.r.teammateLeg.secondBaseSecondThrow'),'completed');
  assert.equal(run('x.r.teammateLeg.firstBaseReceive'),'completed');
  assert.equal(run('x.r.timingResolution.secondLeg.timingMargin<0'),true);
  assert.equal(run('x.r.responsibleActor'),'timingWindow');
  assert.equal(run('x.r.error'),false);
  for(const p of ['3B','2B','1B'])assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,TeamRosterFoundation.getCurrentDefender(m.rosters.home,"'+p+'").id).defense.DP'),0);
});
test('meaningful and density-suppressed routine events use final third-out legality while preserving raw execution',()=>{
  for(const routine of [false,true])for(const outs of [0,2]) {
    run('var m=thirdBaseFixture({occupied:3,outs:'+outs+'});var initialScore=m.scores.away;var initialRecord=m.gameRecord.totals.away.runs;'+
      'var r='+(routine?'resolveRoutineDefensivePlay(m,m.defensiveSituation,()=>.8,{densitySuppressed:true})':'thirdBaseExecute(m,"secure",.8).r')+';var raw=JSON.stringify(r);'+
      (routine?'applyRoutineDefensiveResolutionToHighSchoolMatch(m,r)':'applyInfieldResolutionToHighSchoolMatch(m,"secure",r)')+';var event=m.simulationLog.findLast(e=>e.type==="'+(routine?'playerRoutinePlay':'defensiveResolution')+'");');
    const legalRuns=outs===0?1:0;
    assert.equal(run('m.scores.away-initialScore'),legalRuns);assert.equal(run('m.gameRecord.totals.away.runs-initialRecord'),legalRuns);
    assert.equal(run('event.runsAllowed'),legalRuns);assert.equal(run('m.lastDefensiveResolution.runsAllowed'),legalRuns);
    assert.equal(run('r.runsAllowed'),1);assert.equal(run('JSON.stringify(r)'),run('raw'));
    assert.equal(run('event.runnerChanges.find(c=>c.from===3).scored'),legalRuns===1);
    assert.equal(run('event.runnerChanges.find(c=>c.from===3).targetBase'),'home');
    assert.deepEqual(json('event.runnerChanges'),json('m.lastDefensiveResolution.runnerChanges'));
    assert.deepEqual(json('event.scoringRunnerIds'),json('m.lastDefensiveResolution.thirdOutResolution.legalScoringRunnerIds'));
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
    const evidence=json('MatchExperienceDevelopment.deriveMatchExperienceEvidence(m)').filter(e=>e.evidenceType==='active'&&e.situation.playFamily===(routine?'thirdBaseRoutine':'thirdBaseMeaningful'));
    assert(evidence.length);for(const e of evidence)assert.equal(e.outcomeEvidence.runsAllowed,legalRuns);
  }
});
test('force third out from 5U cancels attempted home score through the shared authority',()=>{
  run('var m=thirdBaseFixture({occupied:3,outs:2});var x=thirdBaseExecute(m,"lead",.8);var raw=JSON.stringify(x.r);applyInfieldResolutionToHighSchoolMatch(m,"lead",x.r);');
  assert.equal(run('x.r.outsCreated'),1);assert.equal(run('m.outs'),3);assert.equal(run('x.r.runsAllowed'),1);
  assert.deepEqual(json('m.scores'),{home:1,away:1});assert.deepEqual(json('m.runners'),[null,null,null]);
  assert.equal(run('m.lastDefensiveResolution.runsAllowed'),0);
  assert.equal(run('m.lastDefensiveResolution.thirdOutResolution.thirdOutType'),'force');
  assert.equal(run('JSON.stringify(x.r)'),run('raw'));
});
test('public repeat and settled cold reload preserve execution, record, evidence and cursor',()=>{
  run('var m=thirdBaseFixture();var result=thirdBasePublic(m);var once=thirdBaseFacts(m);var execution=JSON.stringify(m.groundBallInPlayState.thirdBaseExecution);var cursor=m.simulationCursor;');
  assert.equal(run('chooseHighSchoolYearOneMatchMoment(result.choice.matchDecision,result.choice.matchMomentId,()=>{throw Error("duplicate reroll");})'),false);
  assert.equal(run('thirdBaseFacts(m)'),run('once'));
  run('saveGame();player=createInitialPlayer("3B settled cold context");loadGame();m=player.highSchoolMatch;');
  assert.equal(run('thirdBaseFacts(m)'),run('once'));assert.equal(run('JSON.stringify(m.groundBallInPlayState.thirdBaseExecution)'),run('execution'));
  assert.equal(run('m.simulationCursor'),run('cursor'));
  assert.equal(run('chooseHighSchoolYearOneMatchMoment(result.choice.matchDecision,result.choice.matchMomentId,()=>{throw Error("reloaded reroll");})'),false);
  assert.equal(run('thirdBaseFacts(m)'),run('once'));
});
test('pending and executed clean / failed secure / failed throw / receiver failure / partial DP reload exactly once',()=>{
  for(const [options,decision,sample] of [[{},'secure',.8],[{capabilities:{fielding:1,catching:1}},'secure',.8],
    [{capabilities:{throwing:1}},'secure',.8],[{weakReceiver:'1B'},'secure',.8],[{weakPivotThrow:true},'challenge',.5]]) {
    run('var m=thirdBaseFixture('+JSON.stringify(options)+');var pending=JSON.stringify(m.activeSituation);var originalChoices=JSON.stringify(getHighSchoolDefensiveMomentChoices(m));'+
      'saveGame();player=createInitialPlayer("3B pending cold context");loadGame();m=player.highSchoolMatch;');
    assert.equal(run('JSON.stringify(m.activeSituation)'),run('pending'));
    assert.equal(run('JSON.stringify(getHighSchoolDefensiveMomentChoices(m))'),run('originalChoices'));
    run('var x=thirdBaseExecute(m,"'+decision+'",'+sample+');var raw=JSON.stringify(x.r);var execution=JSON.stringify(m.groundBallInPlayState.thirdBaseExecution);var cursor=m.simulationCursor;'+
      'saveGame();player=createInitialPlayer("3B executed cold context");loadGame();m=player.highSchoolMatch;');
    assert.equal(run('JSON.stringify(m.groundBallInPlayState.thirdBaseExecution)'),run('execution'));
    assert.equal(run('m.simulationCursor'),run('cursor'));
    run('resumeResolvedHighSchoolGroundBallSettlement(m);var once=thirdBaseFacts(m);resumeResolvedHighSchoolGroundBallSettlement(m);');
    assert.equal(run('thirdBaseFacts(m)'),run('once'));assert.equal(run('JSON.stringify(x.r)'),run('raw'));
    run('saveGame();player=createInitialPlayer("3B recovered settled cold context");loadGame();m=player.highSchoolMatch;applyInfieldResolutionToHighSchoolMatch(m,"'+decision+'",x.r);');
    assert.equal(run('thirdBaseFacts(m)'),run('once'));
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
  }
});
test('deterministic rebuild reads no RNG and mutates no source / match cursor / authority',()=>{
  run('var m=thirdBaseFixture();var choice=getHighSchoolDefensiveMomentChoices(m).find(c=>c.matchDecision==="challenge");var before=JSON.stringify(player);var cursor=m.simulationCursor;var originalRandom=Math.random;Math.random=()=>{throw Error("3B rebuild RNG");};');
  try {
    run('var first=buildHighSchoolThirdBaseExecution(m,m.defensiveSituation,choice,.8);var second=buildHighSchoolThirdBaseExecution(m,m.defensiveSituation,choice,.8);');
    assert.deepEqual(json('first'),json('second'));assert.equal(run('JSON.stringify(player)'),run('before'));
    assert.equal(run('m.simulationCursor'),run('cursor'));assert.equal(run('m.outs'),0);assert.equal(run('m.runners[0]!==null'),true);
  } finally {run('Math.random=originalRandom;');}
});
test('tampered actor / route / receiver / timing / physical identity / action facts reject save before authority writes',()=>{
  for(const mutation of ['bad.highSchoolMatch.groundBallInPlayState.thirdBaseExecution.choice.routeId="holdBall"',
    'bad.highSchoolMatch.groundBallInPlayState.thirdBaseExecution.resolution.actionFacts.actions[0].actorId="bench"',
    'bad.highSchoolMatch.groundBallInPlayState.decisionThrowState.throwResolution.receiverId="bench"',
    'bad.highSchoolMatch.groundBallInPlayState.runnerThrowTiming.timingMargin=99',
    'bad.highSchoolMatch.groundBallInPlayState.physicalTruth.identity="forged"',
    'bad.highSchoolMatch.activeSituation.resolution.executionEvidence.actionFacts.actions[0].actorId="bench"',
    'bad.highSchoolMatch.activeSituation.decision.selectedRoute="holdBall"',
    'delete bad.highSchoolMatch.groundBallInPlayState.thirdBaseExecution',
    'delete bad.highSchoolMatch.groundBallInPlayState.secureResolution',
    'delete bad.highSchoolMatch.groundBallInPlayState.decisionThrowState',
    'delete bad.highSchoolMatch.groundBallInPlayState.runnerThrowTiming',
    'TeamRosterFoundation.getCurrentDefender(bad.highSchoolMatch.rosters.home,"1B").defense=1',
    'TeamRosterFoundation.getCurrentDefender(bad.highSchoolMatch.rosters.home,"3B").id="bench"']) {
    run('var m=thirdBaseFixture();thirdBaseExecute(m);var bad=JSON.parse(JSON.stringify(player));');run(mutation);
    const before=json('bad');assert.throws(()=>run('normalizeSave(bad)'),/Stale|stale|Invalid|integrity|mismatch/);
    assert.deepEqual(json('bad'),before);
  }
});
test('active ground and unrelated open situation retain mutual exclusion under direct prepare',()=>{
  run('var m=thirdBaseFixture();var open=JSON.stringify(m.activeSituation);var facts=thirdBaseFacts(m);prepareHighSchoolDefensiveMomentFromSimulation(m);');
  assert.equal(run('JSON.stringify(m.activeSituation)'),run('open'));assert.equal(run('thirdBaseFacts(m)'),run('facts'));
  run('m.activeSituation=MatchSituationLifecycle.createSituation({situationId:"3b-mutex-plate",type:MatchSituationLifecycle.TYPES.plateDecision,actor:{id:"player",position:"三壘手"}});var open=JSON.stringify(m.activeSituation);prepareHighSchoolDefensiveMomentFromSimulation(m);');
  assert.equal(run('JSON.stringify(m.activeSituation)'),run('open'));
});

test('public 5U and 5-4-3 decisions use one execution sample and reject duplicate submissions',()=>{
  for(const [decision,occupied,outs] of [['lead',2,1],['challenge',1,2]]) {
    run('var m=thirdBaseFixture({occupied:'+occupied+'});var result=thirdBasePublic(m,"'+decision+'");var once=thirdBaseFacts(m);');
    assert.equal(run('result.rolls'),1);assert.equal(run('m.lastDefensiveResolution.outsCreated'),outs);
    assert.equal(run('chooseHighSchoolYearOneMatchMoment(result.choice.matchDecision,result.choice.matchMomentId,()=>{throw Error("3B duplicate route RNG");})'),false);
    assert.equal(run('thirdBaseFacts(m)'),run('once'));
  }
});

test('historical v1 SS near-line and 2B ground saves retain their original admission and execution owner',()=>{
  for(const [position,direction] of [['游擊手',.005],['二壘手',.95]]) {
    // Declared legacy fixture: build with the exact old topology contract, then
    // restore the production router before every save, execution, and recovery.
    run('var currentOpportunityRouter=getHighSchoolDefensiveOpportunity;getHighSchoolDefensiveOpportunity=(m,t)=>DefensiveOpportunityFoundation.resolveDefensiveOpportunity({physicalTruth:t,activeRoster:m.rosters[m.defenseTeam],topologyVersion:DefensiveOpportunityFoundation.TOPOLOGY_VERSION});');
    try { run('var m=thirdBaseFixture({position:'+JSON.stringify(position)+',direction:'+direction+'});'); }
    finally {run('getHighSchoolDefensiveOpportunity=currentOpportunityRouter;');}
    assert.equal(run('m.groundBallInPlayState.supported'),true);
    assert.equal(run('getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth).topologyVersion'),'regulation-coarse-zones-v1');
    run('saveGame();player=createInitialPlayer("legacy v1 pending");loadGame();m=player.highSchoolMatch;var x=thirdBaseExecute(m);saveGame();player=createInitialPlayer("legacy v1 executed");loadGame();m=player.highSchoolMatch;resumeResolvedHighSchoolGroundBallSettlement(m);var once=thirdBaseFacts(m);resumeResolvedHighSchoolGroundBallSettlement(m);');
    assert.equal(run('thirdBaseFacts(m)'),run('once'));
    assert.equal(run('Boolean(m.groundBallInPlayState.thirdBaseExecution)'),false);
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
  }
});
test('left throwing 3B uses the legal Opportunity fallback and preserves career position',()=>{
  run('stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;player=createRepresentativeHighSchoolEntryFixture("ordinary",77001);applyCanonicalPositionProfile(player,"三壘手",[]);player.throws="L";player.age=16;player.chapter="青棒";player.highSchoolStep=5;applyHighSchoolRoleState("starter");player.flags.push("direct_start_history");pendingHighSchoolMatchPositionOverride="";prepareHighSchoolYearOneMatch();');
  assert.equal(run('player.highSchoolMatch.rosters.home.lineup.some(a=>a.id==="player"&&TeamRosterFoundation.normalizePosition(a.position)==="3B")'),false);
  assert.notEqual(run('player.highSchoolMatch.playerFieldingAssignment'),'三壘手');assert.equal(run('player.primaryPosition'),'三壘手');
  assert.equal(run('player.highSchoolMatch.gameExposureState.opportunitySnapshot.positionFallbackApplied'),true);
  run('playCareerMatchToEnd();');assert.equal(run('player.highSchoolMatch.completed'),true);
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'),[]);
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'),[]);
});

// Conditions are declared in advance and are not selected after seeing results.
// These are canonical harness entry witnesses, not natural career frequencies.
const normalEntrySeeds=Array.from({length:200},(_,index)=>77001+index);
test('normal production entry cohort creates recurring physical 3B work and finalized evidence',()=>{
  const cohort=[];
  for(const seed of normalEntrySeeds) {
    run('careerFixture("三壘手","starter",'+seed+');choose("critical_offseason",1);var entryStatus=player.highSchoolMatch.playerLineupStatus;playCareerMatchToEnd();var full=player.highSchoolMatch;');
    assert.equal(run('full.completed'),true);
    assert.equal(run('full.gameRecord.status'),'final');
    assert.deepEqual(json('full.gameRecord.result.finalScore'),json('full.scores'));
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(full)'),[]);
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(full.gameRecord)'),[]);
    const events=json('full.simulationLog').filter(e=>['defensiveResolution','playerRoutinePlay'].includes(e.type)&&e.playerPosition==='三壘手'&&e.physicalIdentity);
    const active=json('full.matchExperience.evidence').filter(e=>e.evidenceType==='active'&&e.situation.playFamily.startsWith('thirdBase'));
    for(const e of events)assert(e.actionFacts&&e.physicalIdentity&&e.decisionProvenance);
    if(events.length)assert(active.length);
    const contacts=json('full.simulationLog').filter(e=>e.physicalTruth?.identity&&e.half==='上');
    const primarySources=new Set(events.map(e=>e.physicalIdentity));
    for(const e of contacts)if(run('DefensiveOpportunityFoundation.deriveGroundResponsibility('+JSON.stringify(e.physicalTruth)+')?.primaryPosition')==='3B')primarySources.add(e.physicalTruth.identity);
    cohort.push({seed,matchId:run('full.id'),scores:json('full.scores'),entryStatus:run('entryStatus'),
      observedOrdinaryPhysicalContacts:contacts.length+events.length,primaryGroundSources:primarySources.size,physicalPlays:events.length,
      meaningful:events.filter(e=>e.type==='defensiveResolution').length,routine:events.filter(e=>e.type==='playerRoutinePlay').length,
      laterInning:events.filter(e=>e.inning>2).length,activeEvidence:active.length,
      reasons:events.map(e=>e.primaryCause),partialDoublePlays:events.filter(e=>e.executionQuality==='partial'&&e.initialRoute==='initiate543').length,
      actions:events.map(e=>({action:e.thirdBaseEvidence.actionType,route:e.initialRoute,outs:e.outsCreated,
        throwDemand:e.thirdBaseEvidence.demand.throw,playerStage:e.playerLeg,teammateStage:e.teammateLeg,
        timingMargin:e.timingResolution.firstLeg.timingMargin}))});
    const saved=json('normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch');run('saveGame();loadGame();');assert.deepEqual(json('player.highSchoolMatch'),saved);
  }
  console.log('THIRD_BASE_NORMAL_ENTRY_COHORT '+JSON.stringify({evidenceOrigin:'PREDECLARED_CANONICAL_ENTRY_NO_IN_MATCH_OVERRIDES',seeds:normalEntrySeeds,cohort}));
  assert(cohort.some(item=>item.physicalPlays>0),'canonical physical 3B entry is reachable');
  assert(cohort.some(item=>item.laterInning>0),'recurring later-inning physical 3B entry is reachable');
  assert(cohort.some(item=>item.routine>0),'canonical routine physical 3B entry is reachable');
  assert(cohort.some(item=>item.meaningful>0),'canonical meaningful physical 3B entry is reachable');
});
console.log(JSON.stringify({suite:'third-base-ground-production-integration',passed,failed,evidenceOrigin:'EXPLICIT_PRODUCTION_FIXTURES_AND_SEPARATE_NORMAL_ENTRY'}));
if(failed)process.exitCode=1;
