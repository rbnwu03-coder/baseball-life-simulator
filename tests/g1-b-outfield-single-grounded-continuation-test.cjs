'use strict';
const assert=require('node:assert/strict');
const {makeContext}=require('./high-school-career-test-context.js');
const {run,json}=makeContext();
const evidence={suite:'g1-b-outfield-single-grounded-continuation',positive:[],negative:[],persistence:[],capabilities:[]};
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
run(`
function g1bFixture(direction=.5,outs=0,pending=false,overrides={}) {
  careerFixture("\u4e8c\u58d8\u624b","starter",77001);choose("critical_offseason",1);
  const m=player.highSchoolMatch,base=m.rosters.home.teamRoster;
  const roster=base.starters.some(a=>a.id==="player")?base:TeamRosterFoundation.injectPlayerIntoRoster(base,
    createHighSchoolRosterPlayerActor(player,"\u4e8c\u58d8\u624b"),{playerRole:"starter",playerPosition:"\u4e8c\u58d8\u624b"});
  m.rosters.home=TeamRosterFoundation.toMatchRoster(roster,TeamStrengthModel.deriveTeamStrengthProfile(roster));
  m.rosters.away=JSON.parse(JSON.stringify(m.rosters.away));
  for(const p of ["LF","CF","RF"]){const actor=TeamRosterFoundation.getCurrentDefender(m.rosters.away,p);
    actor.defense=overrides.defense??2;actor.speed=overrides.mobility??7;}
  player.baseballSkills.batting=16;player.baseballSkills.baseRunning=overrides.baseRunning??8;player.fitness=overrides.fitness??8;
  Object.assign(m,{inning:5,half:"\u4e0b",offenseTeam:"home",defenseTeam:"away",outs,runners:[null,null,null],
    scores:{home:0,away:0},simulationPhase:"moment_1_resolved",currentDomain:"defense",playerEntryCompleted:true,
    playerLineupStatus:"starter",playerFieldingAssignment:"\u4e8c\u58d8\u624b",developmentPositionOverride:"\u4e8c\u58d8\u624b",
    position:"\u4e8c\u58d8\u624b",defensiveSituation:{},activeSituation:null,groundBallInPlayState:null,lineDriveCatchState:null,flyBallCatchState:null});
  m.playerLineupSlot=m.rosters.home.lineup.findIndex(a=>a.id==="player");
  m.battingOrderIndex.home=m.playerLineupSlot;m.currentBatter="player";
  const opts={tacticalActionOverride:"standardAttack",
    outfieldSingle:{policy:"g1-b-clean-outfield-single-v1",samples:{approach:overrides.approach??.99,acquire:overrides.acquire??.75}},
    ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,
      physicalRolls:{contactQuality:.65,ballType:overrides.ballType??.95,pace:overrides.pace??.5,direction,depth:overrides.depth??.95},
      outcomeRoll:.85,mappingRolls:{hit:.85,extraBase:.5}}};
  if(pending){m.offensiveTacticalActionState={selectedTacticalAction:"standardAttack"};ensureHighSchoolOrdinaryGroundBallInPlayHandoff(m,opts);}
  return {m,opts};
}
function g1bFacts(m){return JSON.parse(JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,order:m.battingOrderIndex,
  pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,logs:m.simulationLog.length,
  record:m.gameRecord,playerContribution:m.playerContribution,experience:m.matchExperience}));}
`);
const positions=process.argv.includes('--cf-only')?[['CF',.5]]:[['CF',.5],['LF',.05],['RF',.95]];
for(const [position,direction]of positions)for(const outs of process.argv.includes('--cf-only')?[0]:[0,1,2]){
 test(position+' O'+outs+' original player PA single and next PA',()=>{
  run('var x=g1bFixture('+direction+','+outs+'),m=x.m,before=g1bFacts(m);var event=prepareHighSchoolDefensiveMomentFromSimulation(m,x.opts);');
  const row=json('({before,after:g1bFacts(m),state:m.flyBallCatchState,event,matchIssues:getHighSchoolMatchStateIntegrityIssues(m),recordIssues:MatchGameRecord.getIntegrityIssues(m.gameRecord)})');
  assert.equal(row.event.type,'outfieldSingleResolution');
  const f=row.event.outfieldSingleFacts,id=row.event.batterId;
  assert.equal(id,'player');assert.equal(f.retrieval.position,position);assert.equal(f.retrieval.status,'completed');
  assert.equal(f.ballState.ordinaryEffort.reach.reached,false);assert.equal(f.ballState.ordinaryEffort.catchAttempted,false);
  assert.equal(f.ballState.possession.holderId,null);assert.equal(f.retrieval.afterPossession.holderId,f.ballState.defender.id);
  assert.equal(f.runnerContinuation.decision.type,'holdFirst');assert.equal(f.runnerContinuation.closed,true);
  assert(f.runnerContinuation.originalArrival.relativeArrival<f.retrieval.completedAt);
  assert.deepEqual(row.after.runners,[id,null,null]);assert.equal(row.after.outs,outs);
  assert.equal(row.after.pa-row.before.pa,1);assert.equal(row.after.order.home,(row.before.order.home+1)%9);
  const batting=row.after.record.playerLines[id].batting,prior=row.before.record.playerLines[id].batting;
  for(const k of ['PA','AB','H'])assert.equal(batting[k]-prior[k],1,k);
  const sum=(record,k)=>Object.values(record.playerLines).reduce((s,l)=>s+(l.pitching?.[k]||0),0);
  assert.equal(sum(row.after.record,'BF')-sum(row.before.record,'BF'),1);
  assert.equal(sum(row.after.record,'H')-sum(row.before.record,'H'),1);
  assert.equal(row.after.record.totals.home.hits-row.before.record.totals.home.hits,1);
  for(const[id,line]of Object.entries(row.after.record.playerLines))for(const k of ['PO','A','E','chances'])
    assert.equal(line.defense[k]-(row.before.record.playerLines[id]?.defense[k]||0),0,k);
  assert.deepEqual(row.matchIssues,[]);assert.deepEqual(row.recordIssues,[]);
  run('var stable=JSON.stringify(g1bFacts(m));applyHighSchoolOutfieldSingle(m);resolveHighSchoolOutfieldSingle(m);applyHighSchoolFlyBallCatchResolution(m);');
  assert(run('stable===JSON.stringify(g1bFacts(m))'));
  run('var nextEvent=resolveSimulatedHighSchoolPlateAppearance(m,()=>.62,{allowPlayer:true});');
  assert(run('!!nextEvent'));assert.equal(json('g1bFacts(m).pa'),row.after.pa+1);
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);
  evidence.positive.push({...row,position,outs});
 });
}
if(!process.argv.includes('--cf-only')) {
 test('exact additive sources retain original pins and reject 24 mutations',()=>{
  evidence.sourceGuard=require('./g1-b-source-delta.cjs').runSourceTests();
 });
 const negatives=[
  ['wrong defender identity',false,'s.outfieldSingleState.admission.defenders[1].id="wrong"'],
  ['wrong position assignment',false,'TeamRosterFoundation.getCurrentDefender(m.rosters.away,"CF").defensivePosition="RF"'],
  ['missing Physical',false,'s.physicalTruth=null'],
  ['stale Physical',false,'s.physicalTruth.identity="stale"'],
  ['stale PA',false,'m.ordinaryDefensivePlateAppearanceState={...m.ordinaryDefensivePlateAppearanceState,paIdentity:"stale"}'],
  ['stale batter',false,'m.currentBatter="stale"'],
  ['stale outs',false,'m.outs=2'],
  ['stale lineup index',false,'m.battingOrderIndex.home=(m.battingOrderIndex.home+1)%9'],
  ['fake landing',true,'s.outfieldSingleState.facts.ballState.landed=false'],
  ['catch succeeded and hit',true,'s.catchResult={caught:true}'],
  ['pickup failed forged possession',true,'s.outfieldSingleState.facts.retrieval.pickup.secured=false'],
  ['no runner timing',true,'delete s.outfieldSingleState.facts.runnerContinuation.originalArrival'],
  ['unproved first terminal',true,'s.outfieldSingleState.facts.runnerContinuation.attainedBases=[]'],
  ['extra base unresolved',true,'s.outfieldSingleState.facts.runnerContinuation.decision.type="attemptSecond"'],
  ['unsupported contact',false,'s.physicalTruth.ballType="lineDrive"'],
  ['unsupported direction',false,'s.physicalTruth.direction="foulSide"'],
  ['hit inferred from no error',true,'s.outfieldSingleState.facts.classification={status:"supported",compatibleOffensiveResult:"single"}'],
  ['unresolved error eligibility',true,'s.outfieldSingleState.facts.ballState.ordinaryEffort.errorEligibility="unknown"'],
  ['conflicting pickup callback',true,'s.outfieldSingleState.facts.retrieval.completedAt+=1'],
  ['late switch to compressed',false,'s.admission.continuation="preAdmittedCompressed"'],
  ['changed post-admission sample',false,'s.outfieldSingleState.admission.control.samples.acquire=.1']
 ];
 for(const [name,executed,mutation]of negatives)test('reject '+name,()=>{
  run('var x=g1bFixture(.5,0,true),m=x.m;'+(executed?'resolveHighSchoolOutfieldSingle(m);':'')+
    'm.flyBallCatchState=JSON.parse(JSON.stringify(m.flyBallCatchState));var s=m.flyBallCatchState;'+mutation+';var stable=JSON.stringify(g1bFacts(m));');
  let message;assert.throws(()=>run('resolveHighSchoolFlyBallCatchOpportunity(m,x.opts);applyHighSchoolFlyBallCatchResolution(m);'),e=>{message=e.message;return true;});
  assert(run('stable===JSON.stringify(g1bFacts(m))'));
  evidence.negative.push({name,message});
 });
 for(const [name,overrides,reason]of [
  ['failed pickup',{acquire:.1},'OUTFIELD_PICKUP_UNRESOLVED'],
  ['failed approach',{approach:0},'OUTFIELD_PICKUP_UNRESOLVED'],
  ['extra-base opportunity',{baseRunning:20},'EXTRA_BASE_ATTEMPT_REQUIRES_TERMINAL'],
  ['first still contested',{baseRunning:0,fitness:0,pace:.95},'FIRST_CONTEST_REQUIRES_EXECUTION']
 ])test('pending '+name+' blocks PA and compressed playback',()=>{
  run('var x=g1bFixture(.5,0,true,'+JSON.stringify(overrides)+'),m=x.m;var stable=JSON.stringify(g1bFacts(m));');
  let message;assert.throws(()=>run('resolveHighSchoolOutfieldSingle(m)'),e=>{message=e.message;return true;});
  const f=json('m.flyBallCatchState.outfieldSingleState.facts');
  assert.equal(f.runnerContinuation.reason,reason);assert.equal(f.runnerContinuation.finalBase,null);
  assert.throws(()=>run('applyHighSchoolOutfieldSingle(m)'));
  assert.throws(()=>run('resolveSimulatedHighSchoolPlateAppearance(m,()=>.62,{allowPlayer:true})'),/cannot advance/);
  assert.throws(()=>run('advanceHighSchoolMatchPlaybackStep(m)'),/cannot advance/);
  assert(run('stable===JSON.stringify(g1bFacts(m))'));evidence.negative.push({name,message,facts:f});
 });
 for(const stage of ['pending','executed','settled'])test('real Save/Load '+stage+' settles PA H BF once',()=>{
  run('var x=g1bFixture(.5,2,true),m=x.m;var before=g1bFacts(m);');
  if(stage!=='pending')run('resolveHighSchoolOutfieldSingle(m)');
  if(stage==='settled')run('applyHighSchoolOutfieldSingle(m)');
  run('saveGame();loadGame();m=player.highSchoolMatch;resolveHighSchoolOutfieldSingle(m);applyHighSchoolOutfieldSingle(m);var stable=JSON.stringify(g1bFacts(m));applyHighSchoolOutfieldSingle(m);resolveHighSchoolFlyBallCatchOpportunity(m,{flyBallCatchExecutionRoll:0});');
  assert(run('stable===JSON.stringify(g1bFacts(m))'));
  const row=json('({before,after:g1bFacts(m),state:m.flyBallCatchState})');
  assert.equal(row.after.pa-row.before.pa,1);assert.equal(row.after.outs,2);assert.deepEqual(row.after.runners,['player',null,null]);
  for(const k of ['PA','AB','H'])assert.equal(row.after.record.playerLines.player.batting[k]-row.before.record.playerLines.player.batting[k],1);
  const bf=r=>Object.values(r.playerLines).reduce((n,l)=>n+l.pitching.BF,0);
  assert.equal(bf(row.after.record)-bf(row.before.record),1);assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
  evidence.persistence.push({stage,paDelta:1,outs:2,physicalIdentity:row.state.physicalTruth.identity,
    runner:row.state.outfieldSingleState.facts.runnerContinuation});
 });
 test('actual NPC mobility changes retrieval time without resampling',()=>{
  const rows=[];
  for(const mobility of [6,7,8]){
   run('var x=g1bFixture(.5,0,true,{mobility:'+mobility+'}),m=x.m;');
   try{run('resolveHighSchoolOutfieldSingle(m)');}catch{}
   const f=json('m.flyBallCatchState.outfieldSingleState.facts');
   rows.push({mobility,ball:f.ballState.status,retrieval:f.retrieval,runner:f.runnerContinuation});
  }
  assert(rows.every(r=>r.retrieval.status==='completed'));
  assert(rows[0].retrieval.completedAt>rows[1].retrieval.completedAt);
  assert(rows[1].retrieval.completedAt>rows[2].retrieval.completedAt);
  assert.deepEqual(rows[0].retrieval.provenance.samples,rows[1].retrieval.provenance.samples);
  evidence.capabilities=rows;
 });
 test('ordinary catch opportunity is refused by clean-single policy',()=>{
  run('var x=g1bFixture(.5,0,true,{defense:8}),m=x.m;var stable=JSON.stringify(g1bFacts(m));');
  assert.throws(()=>run('resolveHighSchoolOutfieldSingle(m)'));
  assert.equal(json('m.flyBallCatchState.outfieldSingleState.facts.ballState.reason'),'ORDINARY_EFFORT_CATCH_STILL_POSSIBLE');
  assert(run('stable===JSON.stringify(g1bFacts(m))'));
 });
 test('pure scorer rejects missing timing or forced result; inputs remain immutable',()=>{
  run('var x=g1bFixture(.5,0,true),m=x.m;resolveHighSchoolOutfieldSingle(m);');
  const f=json('m.flyBallCatchState.outfieldSingleState.facts');
  const D=require('../defensive-decision-throw-foundation.js');
  for(const mutate of [p=>delete p.runnerContinuation.originalArrival,p=>p.runnerContinuation.finalBase='second',
   p=>p.ballState.ordinaryEffort.caught=true,p=>p.retrieval.afterPossession.holderId='player',p=>p.desiredResult='single']){
   const p=structuredClone({ballInput:f.ballInput,ballState:f.ballState,retrieval:f.retrieval,runnerContinuation:f.runnerContinuation});mutate(p);
   const stable=JSON.stringify(p),result=D.resolveOutfieldSingleClassification(p);
   assert.equal(result.status,'insufficient');assert(!result.compatibleOffensiveResult);assert.equal(JSON.stringify(p),stable);
  }
 });
 test('NPC retrieval creates no player fielding growth',()=>{
  run('var x=g1bFixture(.5),m=x.m;var prior=MatchExperienceDevelopment.deriveMatchExperienceEvidence(m);var skillBefore=JSON.stringify(player.baseballSkills);prepareHighSchoolDefensiveMomentFromSimulation(m,x.opts);var after=MatchExperienceDevelopment.deriveMatchExperienceEvidence(m);');
  const rows=json('after.filter(e=>e.playerId==="player"&&e.evidenceType==="active")');
  assert.deepEqual(rows,json('prior.filter(e=>e.playerId==="player"&&e.evidenceType==="active")'));
  assert(run('skillBefore===JSON.stringify(player.baseballSkills)'));evidence.noPlayerFieldingGrowth=rows;
 });
 test('one normal mode-off Career match completes with original development',()=>{
  run('careerFixture("二壘手","starter",77001);choose("critical_offseason",1);var normal=player.highSchoolMatch;var ticks=playCareerMatchToEnd();');
  const row=json('({ticks,completed:normal.completed,phase:normal.simulationPhase,scores:normal.scores,recordScore:normal.gameRecord.result.finalScore,recordStatus:normal.gameRecord.status,issues:MatchGameRecord.getIntegrityIssues(normal.gameRecord),development:normal.matchExperience,hasG1B:normal.simulationLog.some(e=>e.type==="outfieldSingleResolution")})');
  assert(row.completed);assert(row.ticks<2500);assert.equal(row.recordStatus,'final');assert.deepEqual(row.scores,row.recordScore);
  assert.equal(row.development.settled,true);assert.deepEqual(row.issues,[]);assert.equal(row.hasG1B,false);
  evidence.normalGame=row;
 });
}
// Preserve execution provenance while avoiding repeated full Record/state copies.
evidence.positive=evidence.positive.map(row=>({position:row.position,outs:row.outs,event:row.event,
  before:{outs:row.before.outs,runners:row.before.runners,pa:row.before.pa,totals:row.before.record.totals,
    batter:row.before.record.playerLines.player,pitchers:Object.fromEntries(Object.entries(row.before.record.playerLines).filter(([,v])=>v.pitching.BF))},
  after:{outs:row.after.outs,runners:row.after.runners,pa:row.after.pa,totals:row.after.record.totals,
    batter:row.after.record.playerLines.player,pitchers:Object.fromEntries(Object.entries(row.after.record.playerLines).filter(([,v])=>v.pitching.BF))},
  matchIssues:row.matchIssues,recordIssues:row.recordIssues}));
console.log(JSON.stringify({...evidence,status:'PASS',passed}));
