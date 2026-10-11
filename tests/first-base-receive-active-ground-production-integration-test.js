'use strict';
const assert=require('assert/strict');
const fs=require('fs');
const {makeContext}=require('./high-school-career-test-context.js');
const {run,json}=makeContext();
let passed=0,failed=0;
function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
run(`  function firstBaseFixture(options={}) {
    const position=options.position||"一壘手";
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
    if(options.weakPivotThrow)TeamRosterFoundation.getCurrentDefender(m.rosters.home,"SS").arm=1;
    for(const [p,values] of Object.entries(options.npc||{}))Object.assign(TeamRosterFoundation.getCurrentDefender(m.rosters.home,p),values);
    if(options.densitySuppressed)ensureHighSchoolMatchDecisionDensityState(m).defensiveMeaningfulDecisionCount=6;
    prepareHighSchoolDefensiveMomentFromSimulation(m,{incomingContinuation:createHighSchoolIncomingContinuationAdmission(m,batter),tacticalActionOverride:"standardAttack",
      situationOverrides:{playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10,...options.capabilities}},
      randomSource:()=>options.sample??.8,preContactRunnerStates:options.preContactRunnerStates||{},ordinaryPlateAppearance:{physicalRolls:{contactQuality:options.contactQuality??.65,ballType:options.ballType??.1,pace:options.pace??.68,direction:options.direction??.995,depth:options.depth??0},outcomeRoll:.5}});
    return m;
  }
  function firstBaseGeneric(options={}) {
    const m=firstBaseFixture({occupied:2});m.activeSituation=null;m.groundBallInPlayState=null;
    setHighSchoolDefensiveBallContext(m,"normalGrounder");
    buildInfieldMeaningfulMoment(m,player,{playerPosition:"一壘手",primaryFielderPosition:"一壘手",ballDirection:"straightAtPlayer",ballDepth:"normal",
      playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10,...options.capabilities},
      runnerSpeeds:[1,1,null],batterSpeed:1,pivotCapabilities:{fielding:10,reaction:10,throwing:10}});
    if(options.weakReceiver)m.defensiveSituation.teammates.firstBaseReceiver.capabilities.fielding=1;
    return m;
  }
  function firstBaseFacts(m) {return JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,order:m.battingOrderIndex,
    log:m.simulationLog,record:m.gameRecord,experience:m.matchExperience});}
  function firstBaseExecute(m,decision="secure",sample=.8) {
    beginGroundBallSituationDecision(m,decision);let rolls=0;
    const r=resolveHighSchoolDefensivePlay(m,decision,()=>{rolls++;return sample;});recordGroundBallSituationResolution(m,r);return {r,rolls};
  }
  function firstBasePublic(m,decision="secure",sample=.8) {
    for(let beat=0;beat<m.simulationLog.length&&!isHighSchoolMatchDecisionVisible(m);beat++)advanceHighSchoolPresentationCursor(m);
    const choice=getHighSchoolYearOneMatchMomentChoices(m).find(c=>c.matchDecision===decision);
    if(!choice)throw Error("Missing public 1B choice: "+decision);
    let rolls=0;const accepted=chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>{rolls++;return sample;});
    if(!accepted)throw Error("Public 1B choice rejected");return {choice,rolls};
  }
`);

test('physical first-base primary lane admits the legal player',()=>{
 run('var m=firstBaseFixture({occupied:0});');
 assert.equal(run('m.groundBallInPlayState?.defensiveOpportunity?.primaryPosition'),'1B');
 assert.equal(run('m.groundBallInPlayState.supported'),true);
});
test('same upstream SS physical ground continues into player 1B receiving',()=>{
 run('var m=firstBaseFixture({direction:.1,occupied:0});');
 assert.equal(run('m.lastDefensiveResolution?.firstBaseEvidence?.entry'),'incomingReceive');
 assert.equal(run('m.lastDefensiveResolution?.firstBaseEvidence?.actorId'),'player');
});
test('self base touch does not depend on arm / throwing (supported physical production fixture)',()=>{
 run('var m=firstBaseFixture({capabilities:{arm:1,throwing:1}});var low=resolveInfieldDecision(m.defensiveSituation,"secure",m,.5);var m=firstBaseFixture({capabilities:{arm:10,throwing:10}});var high=resolveInfieldDecision(m.defensiveSituation,"secure",m,.5);');
 assert.equal(run('low.outsCreated'),run('high.outsCreated'));
});
test('3-6-3 contains the real returning 1B receive dependency',()=>{
 run('var m=firstBaseFixture();var x=resolveInfieldDecision(m.defensiveSituation,"challenge",m,.8);');
 assert(run('x.actionFacts?.actions.some(a=>a.actorId==="player"&&a.type==="receive"&&a.targetBase==="first")'));
});
test('1B active evidence requires and emits actual defensive stages',()=>{
 run('var m=firstBaseFixture();var raw=resolveInfieldDecision(m.defensiveSituation,"secure",m,.8);applyRoutineDefensiveResolutionToHighSchoolMatch(m,{...raw,eventClassification:"playerRoutinePlay"});var evidence=MatchExperienceDevelopment.deriveMatchExperienceEvidence(m);');
 assert(run('evidence.some(e=>e.evidenceType==="active"&&e.situation.playFamily.startsWith("firstBase"))'));
});
test('recurring playback admits first base after the initial defense phase (source contract)',()=>{
 const source=fs.readFileSync('script.js','utf8');
 const gate=source.slice(source.indexOf('const defensiveOpportunityPhase ='),source.indexOf('const defensiveResponsibilityReached ='));
 assert(gate.includes('\u4e00\u58d8\u624b'));
});

// Explicit Production fixtures below use legal current rosters and declared ball /
// capability / runner inputs. These do not establish natural frequencies.
function integrity(){assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);}
function execute(options,decision='secure',sample=.8){run('var m=firstBaseFixture('+JSON.stringify(options)+');var x=firstBaseExecute(m,'+JSON.stringify(decision)+','+sample+');applyInfieldResolutionToHighSchoolMatch(m,'+JSON.stringify(decision)+',x.r);');integrity();return json('x.r');}
function actorStat(id='player'){return json('m.gameRecord.playerLines['+JSON.stringify(id)+'].defense');}
for(const [upstream,direction] of [['SS',.1],['2B',.9],['3B',.005]]) {
 test(upstream+' direct throw automatically continues through actual player 1B before one PA / settlement',()=>{
  run('var m=firstBaseFixture({direction:'+direction+',occupied:0});var r=m.lastDefensiveResolution;');integrity();
  assert.equal(run('r.firstBaseEvidence.entry'),'incomingReceive');assert.equal(run('r.firstBaseEvidence.primaryPosition'),upstream);
  assert.equal(run('r.firstBaseEvidence.incoming.receiverId'),'player');assert.equal(run('r.outsCreated'),1);
  assert.equal(actorStat().PO,1);assert.equal(actorStat().A,0);
  assert.equal(run('m.activeSituation'),null);assert.equal(run('m.simulationLog.filter(e=>e.type==="plateAppearance"&&e.batterId===r.runnerSettlement.retirements[0].runnerId&&e.inning===5).length'),1);
  assert.equal(run('r.actionFacts.actions.filter(a=>a.type==="throw")[0].identity'),run('r.firstBaseEvidence.upstreamThrowActionId'));
  const before=run('firstBaseFacts(m)');run('applyRoutineDefensiveResolutionToHighSchoolMatch(m,r);');assert.equal(run('firstBaseFacts(m)'),before);
 });
 test(upstream+' relay final receive preserves first force and charges player only for an actual on-target receiving error',()=>{
  run('var m=firstBaseFixture({direction:'+direction+',occupied:1,capabilities:{fielding:1,catching:1,reaction:10,range:10}});var r=m.lastDefensiveResolution;');integrity();
  assert.equal(run('r.outsCreated'),1);assert.equal(actorStat().PO,0);assert.equal(actorStat().DP,0);assert.equal(actorStat().E,1);
  assert.equal(run('r.firstBaseEvidence.incoming.status'),'failed');assert.equal(run('r.responsibleActor'),'player');
  assert.equal(run('r.actionFacts.actions.find(a=>a.actorId==="player"&&a.type==="receive").errorCharged'),true);
 });
 test(upstream+' full relay records ordered two-runner retirement and actual participant PO / A / DP once',()=>{
  run('var m=firstBaseFixture({direction:'+direction+',occupied:1});var r=m.lastDefensiveResolution;');integrity();
  assert.equal(run('r.outsCreated'),2);assert.equal(actorStat().PO,1);assert.equal(actorStat().DP,1);assert.equal(actorStat().A,0);
  const outs=json('r.runnerSettlement.retirements');assert.notEqual(outs[0].runnerId,outs[1].runnerId);
  assert.equal(outs[0].targetBase,'second');assert.equal(outs[1].targetBase,'first');
 });
}
test('on-target receiver failure / unavailable footwork / fast batter have distinct facts, attribution and E',()=>{
 for(const [caps,speed,status,error] of [[{fielding:1,catching:1,reaction:10,range:10},1,'failed',1],[{fielding:10,catching:10,reaction:1,range:1},1,'unavailable',0],[{},18,'completed',0]]) {
  run('var m=firstBaseFixture({direction:.1,occupied:0,capabilities:'+JSON.stringify(caps)+',batterSpeed:'+speed+'});var r=m.lastDefensiveResolution;');integrity();
  assert.equal(run('r.outsCreated'),0);assert.equal(run('r.firstBaseEvidence.incoming.status'),status);assert.equal(actorStat().E,error);
  if(status==='completed')assert.equal(run('r.primaryCause'),'timingWindow');
 }
});
test('upstream failure never starts a receiver success roll or charges player E / poor catching evidence',()=>{
 for(const npc of [{SS:{arm:1}},{SS:{defense:5}}]) {
  run('var m=firstBaseFixture({direction:.1,occupied:0,npc:'+JSON.stringify(npc)+'});var r=m.lastDefensiveResolution;');integrity();
  assert.equal(run('r.outsCreated'),0);assert.equal(actorStat().E,0);assert.equal(run('r.responsibleActor'),'teammate');
  assert.equal(run('r.actionFacts.actions.some(a=>a.actorId==="player"&&a.type==="receive"&&a.status==="completed")'),false);
  assert.equal(run('MatchExperienceDevelopment.deriveMatchExperienceEvidence(m).some(e=>e.situation.playFamily==="firstBaseReceive"&&e.skillEvidence.targetSkill==="catching"&&e.executionEvidence.quality==="failed")'),false);
 }
});
test('3U public handler binds controlled possession to batter arrival and credits only player PO',()=>{
 run('var m=firstBaseFixture();var before=JSON.stringify(player.baseballSkills);var result=firstBasePublic(m);');integrity();
 assert.equal(run('result.rolls'),1);assert.equal(actorStat().PO,1);assert.equal(actorStat().A,0);
 assert.equal(run('m.groundBallInPlayState.firstBaseExecution.decisionThrowState.throwResolution'),null);
 assert.equal(run('JSON.stringify(player.baseballSkills)'),run('before'));
 const once=run('firstBaseFacts(m)');assert.equal(run('chooseHighSchoolYearOneMatchMoment(result.choice.matchDecision,result.choice.matchMomentId,()=>{throw Error("duplicate RNG");})'),false);assert.equal(run('firstBaseFacts(m)'),once);
});
test('3U secure failure and fast runner cannot manufacture a possession out',()=>{
 for(const options of [{capabilities:{fielding:1,catching:1}},{batterSpeed:18}]) {
  const r=execute(options);assert.equal(r.outsCreated,0);assert.equal(actorStat().PO,0);
  if(options.capabilities)assert.equal(run('m.groundBallInPlayState.firstBaseExecution.decisionThrowState.selection'),null);
 }
});
test('3-1 uses real P actor, traceable cover demand and pitcher receive / first-base touch',()=>{
 execute({pace:0,contactQuality:.1},'cover');
 assert.equal(run('x.r.outsCreated'),1);assert.equal(actorStat().A,1);assert.equal(actorStat().PO,0);
 const pitcher=run('TeamRosterFoundation.getCurrentDefender(m.rosters.home,"P").id');assert.equal(actorStat(pitcher).PO,1);
 assert.equal(run('x.r.actionFacts.actions.find(a=>a.type==="throw").receiverId'),pitcher);
 assert.equal(run('x.r.actionFacts.actions.find(a=>a.type==="baseTouch").actorId'),pitcher);
});
test('3-1 unavailable actual pitcher cover retains safe batter without synthetic receiver or out',()=>{
 execute({pace:0,contactQuality:.1,npc:{P:{defense:1,speed:1}}},'cover');assert.equal(run('x.r.outsCreated'),0);assert.equal(actorStat().A,0);
 assert.equal(run('x.r.teammateLeg.receiver'),'unavailable');assert.equal(actorStat().E,0);
});
test('3-6-3 full DP credits the same player one A / one PO / one DP via actual dependencies',()=>{
 execute({},'challenge');assert.equal(run('x.r.outsCreated'),2);
 assert.deepEqual([actorStat().A,actorStat().PO,actorStat().DP],[1,1,1]);
 const ss=run('TeamRosterFoundation.getCurrentDefender(m.rosters.home,"SS").id');assert.deepEqual([actorStat(ss).A,actorStat(ss).PO,actorStat(ss).DP],[1,1,1]);
 assert.equal(run('x.r.firstBaseEvidence.incoming.receiverId'),'player');assert.equal(run('x.r.firstBaseEvidence.incoming.throwerId'),ss);
});
test('3-6-3 fast batter / weak SS relay / return receive failure retain only first force',()=>{
 for(const options of [{batterSpeed:12},{weakPivotThrow:true},{capabilities:{fielding:3,catching:3},pace:0,contactQuality:.1,sample:.5}]) {
  const r=execute(options,'challenge',options.sample??.8);assert.equal(r.outsCreated,1);
  assert.equal(actorStat().DP,0);assert.equal(actorStat().A,1);assert.equal(actorStat().PO,0);
 }
});
test('3-6-3 failed player first throw never executes SS pivot or return receive',()=>{
 execute({capabilities:{arm:1,throwing:1}},'challenge');assert.equal(run('x.r.outsCreated'),0);
 assert.equal(run('x.r.actionFacts.actions.some(a=>a.type==="pivot"&&a.status==="completed")'),false);
 assert.equal(run('x.r.actionFacts.actions.some(a=>a.type==="receive"&&a.actorId==="player"&&a.status==="completed")'),false);
});
test('no initial first-base runner means no 3-6-3; actual forced runner differs from batter',()=>{
 run('var m=firstBaseFixture({occupied:0});');assert.equal(run('getHighSchoolDefensiveMomentChoices(m).some(c=>c.routeId==="initiate363")'),false);
 execute({occupied:2},'challenge');assert.equal(run('x.r.runnerSettlement.retirements[0].runnerId'),run('m.groundBallInPlayState.firstBaseExecution.before.runners[0]'));
});
test('force and batter-before-first third outs cancel raw scoring attempts through one authority',()=>{
 for(const decision of ['secure','challenge']) {
  execute({occupied:3,outs:2},decision==='challenge'?'lead':decision);
  assert.equal(run('m.outs'),3);assert.deepEqual(json('m.runners'),[null,null,null]);assert.equal(run('x.r.runsAllowed'),1);
  assert.equal(run('m.lastDefensiveResolution.runsAllowed'),0);assert.equal(run('m.scores.away'),1);
 }
});
test('meaningful and automatic events emit final legal outcome / genuine stage families without imaginary throw evidence',()=>{
 execute({},'secure');const self=json('MatchExperienceDevelopment.deriveMatchExperienceEvidence(m)').filter(e=>e.situation.playFamily==='firstBaseBaseTouch');assert(self.length);assert(!self.some(e=>e.skillEvidence.targetSkill==='throwing'));
 run('var m=firstBaseFixture({direction:.1,occupied:0});');const receive=json('MatchExperienceDevelopment.deriveMatchExperienceEvidence(m)').filter(e=>e.situation.playFamily==='firstBaseReceive');assert(receive.length);assert(receive.every(e=>e.decisionEvidence.quality==='none'));assert(!receive.some(e=>e.skillEvidence.targetSkill==='throwing'));
});
test('v3 strict right boundary shares one player / NPC classifier',()=>{
 run('var m=firstBaseFixture();var truth=m.groundBallInPlayState.physicalTruth;');
 for(const [roll,primary] of [[.981,'2B'],[.99,'2B'],[.990001,'1B'],[.995,'1B']]) {
  run('var t={...truth,executionEvidence:{...truth.executionEvidence,rolls:{...truth.executionEvidence.rolls,direction:'+roll+'}}};');
  assert.equal(run('DefensiveOpportunityFoundation.deriveGroundResponsibility(t,DefensiveOpportunityFoundation.FIRST_BASE_GROUND_TOPOLOGY_VERSION).primaryPosition'),primary);
 }
 run('var roster=m.rosters.away;');
 assert.equal(run('DefensiveOpportunityFoundation.resolveDefensiveOpportunity({physicalTruth:truth,activeRoster:roster,topologyVersion:DefensiveOpportunityFoundation.FIRST_BASE_GROUND_TOPOLOGY_VERSION}).primaryDefenderId'),run('TeamRosterFoundation.getCurrentDefender(roster,"1B").id'));
});
test('unsupported airborne / missing classifier / unreachable NPC preserve original PA without receiving fabrication',()=>{
 for(const options of [{ballType:.99,direction:.1},{direction:.1,npc:{SS:{defense:1}},occupied:0}]) {
  run('var m=firstBaseFixture('+JSON.stringify(options)+');');integrity();assert.equal(run('Boolean(m.groundBallInPlayState?.firstBaseContext)'),false);
  assert.equal(run('m.simulationLog.some(e=>e.firstBaseEvidence)'),false);
 }
 run('var m=firstBaseFixture();var truth=JSON.parse(JSON.stringify(m.groundBallInPlayState.physicalTruth));delete truth.executionEvidence.rolls.direction;');
 assert.equal(run('DefensiveOpportunityFoundation.deriveGroundResponsibility(truth,DefensiveOpportunityFoundation.FIRST_BASE_GROUND_TOPOLOGY_VERSION)'),null);
});
test('pending 3U / 3-1 / 3-6-3 and executed failures cold reload / recover exactly once',()=>{
 for(const [options,decision,sample] of [[{},'secure',.8],[{pace:0,contactQuality:.1},'cover',.8],[{},'challenge',.8],
  [{capabilities:{fielding:1,catching:1}},'secure',.8],[{capabilities:{arm:1,throwing:1}},'challenge',.8],
  [{batterSpeed:18},'secure',.8],[{weakPivotThrow:true},'challenge',.8],[{pace:0,contactQuality:.1,npc:{P:{defense:1,speed:1}}},'cover',.8]]) {
  run('var m=firstBaseFixture('+JSON.stringify(options)+');var pending=JSON.stringify(m.activeSituation);saveGame();player=createInitialPlayer("1B pending cold");loadGame();m=player.highSchoolMatch;');
  assert.equal(run('JSON.stringify(m.activeSituation)'),run('pending'));
  run('var x=firstBaseExecute(m,'+JSON.stringify(decision)+','+sample+');var raw=JSON.stringify(x.r);var stage=JSON.stringify(m.groundBallInPlayState.firstBaseExecution);var cursor=m.simulationCursor;saveGame();player=createInitialPlayer("1B executed cold");loadGame();m=player.highSchoolMatch;');
  assert.equal(run('JSON.stringify(m.groundBallInPlayState.firstBaseExecution)'),run('stage'));assert.equal(run('m.simulationCursor'),run('cursor'));
  run('resumeResolvedHighSchoolGroundBallSettlement(m);var once=firstBaseFacts(m);resumeResolvedHighSchoolGroundBallSettlement(m);');
  assert.equal(run('firstBaseFacts(m)'),run('once'));assert.equal(run('JSON.stringify(x.r)'),run('raw'));integrity();
  run('saveGame();player=createInitialPlayer("1B settled cold");loadGame();m=player.highSchoolMatch;');assert.equal(run('firstBaseFacts(m)'),run('once'));
 }
});
// Capture a real automatic pipeline boundary, then restore its owner functions.
// The capture does not invent a throw or a second physical play.
run(`
 function firstBaseIncomingBoundary(options={},phase="pending") {
  const originalResolve=resolveRoutineDefensivePlay,originalApply=applyRoutineDefensiveResolutionToHighSchoolMatch;
  let captured=null;
  if(phase==="pending")resolveRoutineDefensivePlay=()=>{throw Error("DECLARED_AUTO_BOUNDARY");};
  else applyRoutineDefensiveResolutionToHighSchoolMatch=(match,resolution)=>{captured=match;return null;};
  try {captured=firstBaseFixture({direction:.1,occupied:0,...options});}catch(e){if(e.message!=="DECLARED_AUTO_BOUNDARY")throw e;captured=player.highSchoolMatch;}
  finally {resolveRoutineDefensivePlay=originalResolve;applyRoutineDefensiveResolutionToHighSchoolMatch=originalApply;}
  return captured;
 }
`);
test('incoming pending / executed / failed receiver / partial relay / settled reload keep the one upstream PA',()=>{
 for(const options of [{},{capabilities:{fielding:1,catching:1}},{occupied:1},{occupied:1,batterSpeed:18},{npc:{SS:{arm:1}}}]) {
  run('var m=firstBaseIncomingBoundary('+JSON.stringify(options)+',"pending");var identity=m.groundBallInPlayState.physicalTruth.identity;saveGame();player=createInitialPlayer("1B incoming pending");loadGame();m=player.highSchoolMatch;');
  assert.equal(run('m.groundBallInPlayState.physicalTruth.identity'),run('identity'));
  run('var r=resolveRoutineDefensivePlay(m,m.defensiveSituation,()=>.8);recordGroundBallSituationResolution(m,r);var execution=JSON.stringify(m.groundBallInPlayState.firstBaseExecution);var cursor=m.simulationCursor;saveGame();player=createInitialPlayer("1B incoming executed");loadGame();m=player.highSchoolMatch;');
  assert.equal(run('JSON.stringify(m.groundBallInPlayState.firstBaseExecution)'),run('execution'));assert.equal(run('m.simulationCursor'),run('cursor'));
  run('var originalRandom=Math.random;Math.random=()=>{throw Error("receive replay RNG");};');
  try {run('resumeResolvedHighSchoolGroundBallSettlement(m);var once=firstBaseFacts(m);resumeResolvedHighSchoolGroundBallSettlement(m);');}
  finally {run('Math.random=originalRandom;');}
  assert.equal(run('firstBaseFacts(m)'),run('once'));integrity();run('saveGame();player=createInitialPlayer("1B incoming settled");loadGame();m=player.highSchoolMatch;');assert.equal(run('firstBaseFacts(m)'),run('once'));
 }
});
test('incoming continuation admission rejects a stale PA snapshot before reconstruction',()=>{
 run('var m=firstBaseIncomingBoundary({occupied:0});var bad=JSON.parse(JSON.stringify(player));bad.highSchoolMatch.groundBallInPlayState.firstBaseContext.incomingAdmission.outs=2;var before=JSON.stringify(bad);');
 assert.throws(()=>run('normalizeSave(bad)'),/incoming continuation admission/);
 assert.equal(run('JSON.stringify(bad)'),run('before'));
});
test('execution reconstruction keeps captured abilities after career changes and reads no RNG',()=>{
 run('var m=firstBaseFixture();var x=firstBaseExecute(m,"challenge",.8);var before=JSON.stringify(m.groundBallInPlayState.firstBaseExecution);player.baseballSkills.catching=1;player.baseballSkills.throwing=1;player.baseballSkills.reaction=1;var saved=JSON.parse(JSON.stringify(player));var originalRandom=Math.random;Math.random=()=>{throw Error("snapshot recovery RNG");};');
 try {run('var normalized=normalizeSave(saved);');assert.equal(run('JSON.stringify(normalized.highSchoolMatch.groundBallInPlayState.firstBaseExecution)'),run('before'));}
 finally {run('Math.random=originalRandom;');}
});
test('tampered actor / receiver / route / timing / dependency / physical identity / missing stages reject without mutation',()=>{
 for(const mutation of [
  'bad.highSchoolMatch.groundBallInPlayState.firstBaseExecution.choice.routeId="holdBall"',
  'bad.highSchoolMatch.groundBallInPlayState.firstBaseExecution.resolution.actionFacts.actions[0].actorId="bench"',
  'bad.highSchoolMatch.groundBallInPlayState.firstBaseExecution.resolution.actionFacts.actions[1].dependsOn=[]',
  'bad.highSchoolMatch.groundBallInPlayState.firstBaseExecution.resolution.firstBaseEvidence.upstreamThrowActionId="forged"',
  'bad.highSchoolMatch.groundBallInPlayState.runnerThrowTiming.timingMargin=99',
  'bad.highSchoolMatch.groundBallInPlayState.physicalTruth.identity="forged"',
  'bad.highSchoolMatch.activeSituation.resolution.executionEvidence.firstBaseEvidence.actorId="bench"',
  'bad.highSchoolMatch.activeSituation.executionState.selectedRoute="holdBall"',
  'delete bad.highSchoolMatch.groundBallInPlayState.firstBaseExecution',
  'delete bad.highSchoolMatch.groundBallInPlayState.firstBaseContext',
  'delete bad.highSchoolMatch.groundBallInPlayState.secureResolution',
  'TeamRosterFoundation.getCurrentDefender(bad.highSchoolMatch.rosters.home,"1B").id="new-first"',
  'TeamRosterFoundation.getCurrentDefender(bad.highSchoolMatch.rosters.home,"SS").id="new-shortstop"']) {
  run('var m=firstBaseFixture();firstBaseExecute(m,"challenge",.8);var bad=JSON.parse(JSON.stringify(player));');run(mutation);const before=json('bad');
  assert.throws(()=>run('normalizeSave(bad)'),/Stale|stale|Invalid|integrity|mismatch/,mutation);assert.deepEqual(json('bad'),before);
 }
});
test('settled actor and capability snapshots survive a later roster substitution',()=>{
 execute({},'challenge');run('var once=JSON.stringify(m.groundBallInPlayState.firstBaseExecution);var roster=m.rosters.home;var slot=roster.lineup.findIndex(a=>a.id==="player");var replacement=roster.bench.find(a=>TeamRosterFoundation.isHighSchoolPositionAssignmentLegal(a,"1B"));roster.bench=roster.bench.filter(a=>a.id!==replacement.id);roster.lineup[slot]={...replacement,position:"一壘手",defensivePosition:"1B"};TeamRosterFoundation.assertActiveDefense(roster);saveGame();player=createInitialPlayer("1B historical actor cold");loadGame();m=player.highSchoolMatch;');
 assert.equal(run('JSON.stringify(m.groundBallInPlayState.firstBaseExecution)'),run('once'));
});
test('changing the live receiver rejects a pending stage before mutation',()=>{
 run('var m=firstBaseIncomingBoundary({},"pending");var old=JSON.stringify(m.groundBallInPlayState);TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").id="new-first";');
 assert.throws(()=>run('resolveRoutineDefensivePlay(m,m.defensiveSituation,()=>.8)'),/Stale|stale|integrity/);assert.equal(run('JSON.stringify(m.groundBallInPlayState)'),run('old'));
});
test('open ground / unrelated situations keep the admission mutex',()=>{
 run('var m=firstBaseFixture();var before=JSON.stringify(m.activeSituation);var facts=firstBaseFacts(m);prepareHighSchoolDefensiveMomentFromSimulation(m);');
 assert.equal(run('JSON.stringify(m.activeSituation)'),run('before'));assert.equal(run('firstBaseFacts(m)'),run('facts'));
 run('m.activeSituation=MatchSituationLifecycle.createSituation({situationId:"first-base-mutex",type:MatchSituationLifecycle.TYPES.plateDecision,actor:{id:"player",position:"一壘手"}});var before=JSON.stringify(m.activeSituation);prepareHighSchoolDefensiveMomentFromSimulation(m);');assert.equal(run('JSON.stringify(m.activeSituation)'),run('before'));
});
test('historical v1 2B near-right-line and v2 3B saved topology retain admission / recovery',()=>{
 for(const [position,direction,version] of [['二壘手',.985,'regulation-coarse-zones-v1'],['三壘手',.005,'regulation-coarse-ground-lanes-v2']]) {
  run('var oldRouter=getHighSchoolDefensiveOpportunity;getHighSchoolDefensiveOpportunity=(m,t)=>DefensiveOpportunityFoundation.resolveDefensiveOpportunity({physicalTruth:t,activeRoster:m.rosters[m.defenseTeam],topologyVersion:'+JSON.stringify(version)+'});');
  try {run('var m=firstBaseFixture({position:'+JSON.stringify(position)+',direction:'+direction+'});');}
  finally {run('getHighSchoolDefensiveOpportunity=oldRouter;');}
  run('saveGame();player=createInitialPlayer("historical pending");loadGame();m=player.highSchoolMatch;var x=firstBaseExecute(m);saveGame();player=createInitialPlayer("historical executed");loadGame();m=player.highSchoolMatch;resumeResolvedHighSchoolGroundBallSettlement(m);');integrity();
  assert.equal(run('Boolean(m.groundBallInPlayState.firstBaseExecution)'),false);
 }
});
test('successive PA in one defensive half retain 1B physical admission after a routine receive',()=>{
 run('var m=firstBaseFixture({direction:.1,occupied:0});var beforeCount=m.simulationLog.filter(e=>e.type==="plateAppearance"&&e.inning===5).length;var beforeOrder=m.battingOrderIndex.away;var firstIdentity=m.groundBallInPlayState.physicalTruth.identity;');
 assert.equal(run('shouldReachHighSchoolDefensiveMoment(m)'),true);
 run('prepareHighSchoolDefensiveMomentFromSimulation(m,{incomingContinuation:createHighSchoolIncomingContinuationAdmission(m,getHighSchoolMatchLineupBatter(m,m.offenseTeam)),tacticalActionOverride:"standardAttack",ordinaryPlateAppearance:{physicalRolls:{contactQuality:.65,ballType:.1,pace:.68,direction:.1,depth:0},outcomeRoll:.5},randomSource:()=>.8});');integrity();
 assert.equal(run('m.simulationLog.filter(e=>e.type==="plateAppearance"&&e.inning===5).length'),run('beforeCount+1'));
 assert.equal(run('m.battingOrderIndex.away'),run('(beforeOrder+1)%9'));assert.notEqual(run('m.groundBallInPlayState.physicalTruth.identity'),run('firstIdentity'));
 assert.equal(run('m.simulationLog.filter(e=>e.type==="playerRoutinePlay"&&e.firstBaseEvidence&&e.inning===5).length'),2);
});
// Canonical entry, predeclared contiguous seeds. Harness initializes skills at 12
// and its public-choice sample at .62; no ball/runner/capability/result/roster
// override is made during a match. These are integration witnesses, not balance.
const normalEntrySeeds=Array.from({length:200},(_,index)=>77001+index);
// Supplemental range was declared before its separate execution after the
// initial 200 games had no primary-lane witness. Neither range is substituted.
const supplementalEntrySeeds=Array.from({length:200},(_,index)=>77201+index);
const observedCohorts=[];
function observeNormalEntryCohort(seeds,label) {
 const cohort=[];
 for(const seed of seeds) {
  run('careerFixture("一壘手","starter",'+seed+');choose("critical_offseason",1);var entryStatus=player.highSchoolMatch.playerLineupStatus;var entryPosition=player.highSchoolMatch.playerFieldingAssignment;playCareerMatchToEnd();var full=player.highSchoolMatch;');
  assert.equal(run('full.completed'),true);assert.equal(run('full.gameRecord.status'),'final');
  assert.deepEqual(json('full.gameRecord.result.finalScore'),json('full.scores'));
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(full)'),[]);assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(full.gameRecord)'),[]);
  const events=json('full.simulationLog').filter(e=>['defensiveResolution','playerRoutinePlay'].includes(e.type)&&e.firstBaseEvidence);
  const incoming=events.filter(e=>e.firstBaseEvidence.entry==='incomingReceive');
  const delivered=incoming.filter(e=>e.firstBaseEvidence.incoming?.delivery);
  const primary=events.filter(e=>e.firstBaseEvidence.entry==='activeGround');
  const active=json('full.matchExperience.evidence').filter(e=>e.evidenceType==='active'&&e.situation.playFamily.startsWith('firstBase'));
  const playerLine=json('full.gameRecord.playerLines.player');
  const item={seed,entryStatus:run('entryStatus'),entryPosition:run('entryPosition'),scores:json('full.scores'),
   playerFirstBaseActive:run('full.rosters.home.lineup.some(a=>a.id==="player"&&TeamRosterFoundation.normalizePosition(a.position)==="1B")'),
   incomingSources:incoming.length,actualIncomingDelivery:delivered.length,
   incomingByPrimary:Object.fromEntries(['SS','2B','3B'].map(p=>[p,delivered.filter(e=>e.firstBaseEvidence.primaryPosition===p).length])),
   primaryGround:primary.length,baseTouch:primary.filter(e=>e.firstBaseEvidence.actionType==='baseTouch').length,
   pitcherCover:primary.filter(e=>e.initialRoute==='pitcherCoverFirst').length,relay363:primary.filter(e=>e.initialRoute==='initiate363').length,
   routine:events.filter(e=>e.type==='playerRoutinePlay').length,meaningful:events.filter(e=>e.type==='defensiveResolution').length,
   laterInning:events.filter(e=>e.inning>2).length,receiverFailures:delivered.filter(e=>e.firstBaseEvidence.incoming.status==='failed').length,
   upstreamFailures:incoming.filter(e=>!e.firstBaseEvidence.incoming?.delivery).length,defense:playerLine?.defense||null,activeEvidence:active.length,
   actions:events.map(e=>({inning:e.inning,physicalIdentity:e.physicalIdentity,entry:e.firstBaseEvidence.entry,primary:e.firstBaseEvidence.primaryPosition,
    route:e.initialRoute,outs:e.outsCreated,cause:e.primaryCause,responsibleActor:e.responsibleActor,playerError:e.error,
    receiveStatus:e.firstBaseEvidence.incoming?.status||null,throwActionId:e.firstBaseEvidence.upstreamThrowActionId,
    playerLeg:e.playerLeg,attribution:e.defensiveAttribution,firstLegTiming:e.timingResolution.firstLeg.timingMargin,
    relayTiming:e.timingResolution.secondLeg?.timingMargin??null}))};
  cohort.push(item);
  const saved=json('normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch');
  run('saveGame();player=createInitialPlayer("normal cohort cold");loadGame();');assert.deepEqual(json('player.highSchoolMatch'),saved);
 }
 console.log(label+' '+JSON.stringify({evidenceOrigin:'PREDECLARED_CANONICAL_ENTRY_NO_IN_MATCH_OVERRIDES',seeds,cohort}));
 assert(cohort.some(c=>c.actualIncomingDelivery>0),'COVERAGE BLOCKER: no canonical incoming delivery');
 assert(cohort.some(c=>c.laterInning>0),'recurring physical work is reachable');
 observedCohorts.push(cohort);
}
test('original 200 canonical 1B entry games retain full integrity and recurring actual incoming receive',()=>{
 observeNormalEntryCohort(normalEntrySeeds,'FIRST_BASE_NORMAL_ENTRY_COHORT');
});
test('separately declared supplemental 200 canonical games retain full integrity without lane or in-match overrides',()=>{
 observeNormalEntryCohort(supplementalEntrySeeds,'FIRST_BASE_SUPPLEMENTAL_ENTRY_COHORT');
});
test('normal-entry primary first-base ground is observed across the two separately reported fixed cohorts',()=>{
 assert(observedCohorts.flat().some(c=>c.primaryGround>0),'COVERAGE BLOCKER: no canonical primary first-base ground');
});
/*FINAL_SUMMARY*/console.log(JSON.stringify({suite:'first-base-receive-active-ground-production-integration',passed,failed,phase:'SPRINT_GREEN',evidenceOrigin:'EXPLICIT_PRODUCTION_FIXTURES_AND_SEPARATE_NORMAL_ENTRY'}));
if(failed)process.exitCode=1;
