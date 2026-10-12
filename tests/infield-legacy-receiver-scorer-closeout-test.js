'use strict';
// L03 source contracts use existing legal Production fixtures. No new receive roll.
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),Module=require('module'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const originalPath=path.join(__dirname,'infield-scorer-recovery-integrity-repair-test.js');
const original=fs.readFileSync(originalPath,'utf8');
const harness=new Module(originalPath,module);harness.filename=originalPath;harness.paths=Module._nodeModulePaths(__dirname);
harness._compile(original.slice(0,original.indexOf("for(const position of ['SS','2B','3B'])test"))+'\nmodule.exports={run,json,fixture,actor,options};',originalPath);
const {run,json,fixture,actor,options}=harness.exports;
run('var l03OriginalBoundary=firstBaseIncomingBoundary;firstBaseIncomingBoundary=function(input,phase){var m=l03OriginalBoundary(input,phase);if(input.receiverUnavailable)m.defensiveSituation.teammates.firstBaseReceiver.receivingAvailable=false;return m;};');
const rows=[],results=[];let passed=0,failed=0;
function test(name,fn){try{fn();passed++;results.push({name,pass:true});console.log('PASS '+name);}catch(e){failed++;results.push({name,pass:false,error:e.message});console.error('FAIL '+name+'\n'+e.stack);}}
function projection(v){return {physicalIdentity:v.physicalIdentity,raw:v.raw,outs:v.outs,bases:v.runners,runs:v.scores,cursor:v.cursor,
  actors:v.legal.defensiveAttribution.actors.map(({actorId,actorPosition,PO,A,E,DP})=>({actorId,actorPosition,PO,A,E,DP})),
  H:v.record.totals.away.hits,E:v.record.totals.home.errors,FC:v.legal.batterScoring?.classification||null};}
function sources(){return json('m.lastDefensiveResolution.actionFacts.actions.filter(a=>a.type==="receive").map(a=>getHighSchoolLegacyReceiverScorerSource(m,m.defensiveSituation,m.lastDefensiveResolution,a))');}
function check(pos,name,extra,route,expected,mode='meaningful'){
  const input=options(pos,extra),v=fixture(input,route,mode),before=projection(v);
  rows.push({name,pos,input,route,mode,...before,scorerFacts:v.legal.scorerFacts});
  assert.equal(v.outs,expected.outs);assert.deepEqual(v.scores,{home:1,away:1});
  assert.equal(v.record.totals.home.errors,expected.E);assert.equal(v.record.totals.away.hits,expected.H);
  if(expected.FC)assert.equal(v.legal.batterScoring?.classification,'fieldersChoice');
  assert.deepEqual(v.runners,v.legal.runnerSettlement.runnersAfter);
  assert.equal(v.legal.defensiveAttribution.retirements.length,expected.outs);
  assert.equal(actor(v,pos).A,expected.A);
  assert.equal(actor(v,'1B').PO,expected.PO);
  assert.equal(typeof run('typeof getHighSchoolLegacyReceiverScorerSource'),'string');
  assert.equal(run('typeof getHighSchoolLegacyReceiverScorerSource'),'function','Missing source projection; this is contract coverage, not a new scorer-rule defect');
  const s=sources();rows.at(-1).sourceToScorer=s;
  assert(s.every(x=>x&&x.consumedRng===false));
  assert(s.every(x=>x.fields.receiverActor.classification==='A'&&x.fields.ownedSample.classification==='A'));
  assert(s.every(x=>x.fields.independentReadiness.classification==='C'&&x.fields.ordinaryEffort.classification==='C'));
  assert(s.every(x=>x.fields.errorSpecificAdvancement.classification==='C'));
  const receive=v.legal.actionFacts.actions.filter(a=>a.type==='receive');
  s.forEach((x,i)=>{assert.equal(x.receiverId,receive[i].actorId);assert.equal(x.fields.ownedSample.value,receive[i].provenance.sample);
    assert.deepEqual(x.fields.capabilities.value,receive[i].provenance.capabilities);assert.equal(x.fields.receiveOutcome.value,receive[i].status);});
  const contests=v.legal.scorerFacts?.contests||[];
  for(const contest of contests){const a=v.legal.actionFacts.actions.find(x=>x.identity===contest.failedActionId);
    if(['throw','receive'].includes(a.type))assert(contest.evidence.legacyReceiverSource,'Available legacy evidence not connected to scorer contest');}
  if(pos==='2B'&&extra.weakReceiver&&route==='secureFirstBaseOut'){
    assert.equal(contests[0].potentialOut.status,'feasible');
    assert.equal(contests[0].potentialOut.window,v.raw.firstLegTimingWindow.state);
    assert.equal(contests[0].ordinaryEffort.status,'insufficient');
  }
  assert.deepEqual(projection(json('({physicalIdentity:m.groundBallInPlayState.physicalTruth.identity,raw:repairRaw,outs:m.outs,runners:m.runners,scores:m.scores,cursor:m.simulationCursor,legal:m.lastDefensiveResolution,record:m.gameRecord})')),before);
  return v;
}
for(const pos of ['SS','2B'])for(const mode of ['meaningful','routine']){
  test(pos+' '+mode+' actual legal out, A/PO/H, and source identities',()=>check(pos,'clean',{},'secureFirstBaseOut',{outs:1,E:0,H:0,A:1,PO:1},mode));
  test(pos+' '+mode+' slow runner receiver failure has explicit missing effort, no inferred E/A',()=>check(pos,'slowCombinedFailure',{weakReceiver:'1B'},'secureFirstBaseOut',{outs:0,E:0,H:1,A:0,PO:0},mode));
  test(pos+' '+mode+' fast runner failure retains H and exposes actual arrival scope',()=>{
    check(pos,'fastCombinedFailure',{weakReceiver:'1B',batterSpeed:18},'secureFirstBaseOut',{outs:0,E:0,H:1,A:0,PO:0},mode);
    const s=sources()[0];assert.equal(s.fields.runnerArrival.classification,pos==='SS'?'A':'C');
    if(pos==='SS')assert.equal(json('m.lastDefensiveResolution.scorerFacts.contests[0].potentialOut.status'),'alreadySafe');
    else assert.equal(s.fields.incomingLocation.classification,'C'); // An ordinal window is not exact arrival.
  });
  test(pos+' '+mode+' second receiver failure preserves first force, FC and only actual assist',()=>check(pos,'partialDP',{occupied:1,weakReceiver:'1B'},pos==='SS'?'startDoublePlaySecond':'initiate463',{outs:1,E:0,H:0,A:1,PO:0,FC:true},mode));
}
test('SS offline throw keeps thrower E, no receiver E/virtual A/out, and actual incoming quality',()=>{
  const v=check('SS','offline',{sample:.5,capabilities:{throwing:1,arm:10}},'secureFirstBaseOut',{outs:0,E:1,H:0,A:0,PO:0});
  assert.equal(actor(v,'SS').E,1);assert.equal(actor(v,'1B').E,0);assert.equal(sources()[0].fields.incomingLocation.value,'offline');
});
test('2B failed second delivery has no fabricated accuracy/hands and retains actual first force',()=>{
  check('2B','secondDeliveryFailure',{occupied:1,npc:{SS:{arm:1}}},'initiate463',{outs:1,E:0,H:0,A:1,PO:0,FC:true});
  const s=sources()[1];assert.equal(s.fields.throwDelivery.value,'failed');assert.equal(s.fields.incomingLocation.classification,'C');
});
test('SS failed composite turn/delivery preserves first force without inventing second throw accuracy',()=>{
  check('SS','secondCompositeFailure',{occupied:1,sample:.5,npc:{'2B':{defense:4,arm:1}}},'startDoublePlaySecond',{outs:1,E:0,H:0,A:1,PO:0,FC:true});
  assert.equal(sources()[1].fields.throwDelivery.value,'notAttempted');assert.equal(sources()[1].fields.incomingLocation.classification,'C');
});
test('2B failed first delivery is not asserted to be an independent offline location',()=>{
  check('2B','firstDeliveryFailure',{sample:.1,capabilities:{arm:1,throwing:1}},'secureFirstBaseOut',{outs:0,E:0,H:1,A:0,PO:0});
  assert.equal(sources()[0].fields.throwDelivery.value,'failed');assert.equal(sources()[0].fields.incomingLocation.classification,'C');
});
test('2B explicitly unavailable receiver has no invented muff E or readiness arrival',()=>{
  check('2B','unavailableReceiver',{receiverUnavailable:true},'secureFirstBaseOut',{outs:0,E:0,H:1,A:0,PO:0});
  assert.equal(sources()[0].fields.receiverReadiness.value.available,false);assert.equal(sources()[0].fields.independentReadiness.classification,'C');
});
test('Independent player 1B not-at-base readiness is preserved without E/A/out',()=>{
  const v=fixture(options('1B',{direction:.1,capabilities:{reaction:1,range:1}}));rows.push({name:'canonicalNotAtBase',...projection(v)});
  assert.equal(v.outs,0);assert.equal(v.record.totals.home.errors,0);assert.equal(v.record.totals.away.hits,1);assert.equal(actor(v,'SS').A,0);assert.equal(actor(v,'1B').PO,0);
  assert.deepEqual(v.runners,v.legal.runnerSettlement.runnersAfter);assert.deepEqual(v.scores,{home:1,away:1});assert.equal(v.legal.firstBaseEvidence.incoming.ready,false);
});
test('Canonical NPC ordinary receiver muff has the same E/A responsibility rule as player incoming',()=>{
  const v=fixture(options('3B',{weakReceiver:'1B'}));rows.push({name:'canonicalNpcMuff',...projection(v)});
  assert.equal(v.outs,0);assert.equal(actor(v,'1B').E,1);assert.equal(actor(v,'3B').A,1);assert.equal(actor(v,'1B').PO,0);assert.equal(v.record.totals.home.errors,1);assert.equal(v.record.totals.away.hits,0);
  assert.deepEqual(v.runners,v.legal.runnerSettlement.runnersAfter);assert.deepEqual(v.scores,{home:1,away:1});
});
for(const pos of ['SS','2B'])test(pos+' existing assisted out cannot be counted again by source inspection or duplicate apply',()=>{
  const v=check(pos,'dedupeOut',{},'secureFirstBaseOut',{outs:1,E:0,H:0,A:1,PO:1}),before=json('({match:m,record:m.gameRecord,evaluation:m.matchExperience})');
  sources();sources();run('applyInfieldResolutionToHighSchoolMatch(m,"secure",repairRaw);');assert.deepEqual(json('({match:m,record:m.gameRecord,evaluation:m.matchExperience})'),before);
  assert.deepEqual(v.scores,{home:1,away:1});
});
for(const [pos,route,occupied,receiver]of [['SS','forceSecond',1,'2B'],['SS','homeForceOut',3,'C'],['2B','attackLeadRunnerThird',2,'3B'],['2B','homeForceOut',3,'C']])test(pos+' '+route+' legal receiver target source and actual non-hit force',()=>{
  const v=fixture(options(pos,{occupied}),route),p=projection(v);rows.push({pos,name:route,route,...p});
  assert.equal(v.outs,1);assert.equal(p.H,0);assert.equal(p.E,0);assert.equal(actor(v,pos).A,1);assert.equal(actor(v,receiver).PO,1);
  assert.deepEqual(v.scores,{home:1,away:1});assert.deepEqual(v.runners,v.legal.runnerSettlement.runnersAfter);
  const s=sources();rows.at(-1).sourceToScorer=s;assert.equal(s[0].receiverId,actor(v,receiver).actorId);
  assert.equal(s[0].fields.independentReadiness.classification,'C');
});
for(const pos of ['SS','2B'])test(pos+' pending/executed/settled reload preserves original sample, source, record and evaluation once',()=>{
  const input=options(pos,{weakReceiver:'1B'});run('var m=firstBaseIncomingBoundary('+JSON.stringify(input)+',"pending");var originalPhysical=JSON.stringify(m.groundBallInPlayState.physicalTruth);saveGame();player=createInitialPlayer("L03 pending");loadGame();m=player.highSchoolMatch;');
  assert.equal(run('JSON.stringify(m.groundBallInPlayState.physicalTruth)'),run('originalPhysical'));
  run('var choice=getHighSchoolDefensiveMomentChoices(m).find(x=>x.routeId==="secureFirstBaseOut");beginGroundBallSituationDecision(m,choice.matchDecision);var rolls=0;var raw=resolveHighSchoolDefensivePlay(m,choice.matchDecision,()=>{rolls++;return .8;});recordGroundBallSituationResolution(m,raw);var cursor=m.simulationCursor;var owned=JSON.stringify(m.groundBallInPlayState.shortstopExecution||m.groundBallInPlayState.decisionThrowState);saveGame();player=createInitialPlayer("L03 executed");loadGame();m=player.highSchoolMatch;');
  assert.equal(run('rolls'),1);assert.equal(run('JSON.stringify(m.groundBallInPlayState.shortstopExecution||m.groundBallInPlayState.decisionThrowState)'),run('owned'));
  run('var originalRandom=Math.random;Math.random=()=>{throw Error("L03 replay reroll");};');
  try{run('resumeResolvedHighSchoolGroundBallSettlement(m);var once=JSON.stringify({match:m,record:m.gameRecord,evaluation:m.matchExperience});var firstSource=JSON.stringify(m.lastDefensiveResolution.scorerFacts);resumeResolvedHighSchoolGroundBallSettlement(m);');}
  finally{run('Math.random=originalRandom;');}
  assert.equal(run('JSON.stringify({match:m,record:m.gameRecord,evaluation:m.matchExperience})'),run('once'));
  assert.equal(run('m.simulationCursor'),run('cursor'));assert.equal(run('m.outs'),0);assert.equal(run('m.gameRecord.totals.home.errors'),0);assert.equal(run('m.gameRecord.totals.away.hits'),1);
  assert.deepEqual(json('m.scores'),{home:1,away:1});assert.deepEqual(json('m.runners'),json('m.lastDefensiveResolution.runnerSettlement.runnersAfter'));
  run('saveGame();player=createInitialPlayer("L03 settled");loadGame();m=player.highSchoolMatch;');assert.equal(run('JSON.stringify(m.lastDefensiveResolution.scorerFacts)'),run('firstSource'));
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
});
for(const primary of ['SS','2B'])test(primary+' actual player 1B ordinary muff retains canonical receiver E and preceding assist',()=>{
  const v=fixture(options('1B',{direction:primary==='SS'?.1:.9,occupied:1,capabilities:{catching:1,fielding:1}}),primary==='SS'?'startDoublePlaySecond':'initiate463');
  rows.push({name:'playerCanonicalMuff',primary,...projection(v)});assert.equal(v.outs,1);assert.equal(v.record.totals.home.errors,1);assert.equal(v.record.totals.away.hits,0);
  assert.equal(actor(v,'1B').E,1);assert.equal(actor(v,'1B').PO,0);assert.equal(actor(v,primary==='SS'?'2B':'SS').A,1);assert(v.legal.defensiveAttribution.actors.every(a=>a.DP===0));
  assert.deepEqual(v.runners,v.legal.runnerSettlement.runnersAfter);assert.deepEqual(v.scores,{home:1,away:1});
  assert.equal(json('getHighSchoolLegacyReceiverScorerSource(m,m.defensiveSituation,m.lastDefensiveResolution,m.lastDefensiveResolution.actionFacts.actions.find(a=>a.actorId==="player"&&a.type==="receive"))'),null);
});
const flag=process.argv.includes('--capture-l03-red-source')?'red-source':process.argv.includes('--capture-l03-red')?'red':process.argv.includes('--capture-l03-green')?'green':null;
if(flag){const out=path.join(root,'docs','infield-scorer-recovery-sprint-5-l03-'+flag+'-evidence.json');assert(!fs.existsSync(out),'L03 evidence is immutable');fs.writeFileSync(out,JSON.stringify({capturedAt:new Date().toISOString(),baseline:'f16a7f7b2263681788f3846c2e83fbb6f8b0bc53',sourceMode:flag.startsWith('red')?'Sprint 5 pre-closeout worktree':'Current Production with unchanged authoritative execution',testSource:fs.readFileSync(__filename,'utf8'),testSourceSha256:sha(fs.readFileSync(__filename)),original79TestSha256:sha(original),summary:{passed,failed,total:passed+failed},results,rows,redClassification:'Missing source contract and unconnected saved legacy window; not invented ordinary-effort or potential-out facts'},null,2)+'\n');}
console.log('L03 CLOSEOUT '+passed+' PASS / '+failed+' FAIL / '+(passed+failed)+' checks');if(failed)process.exitCode=1;
module.exports={rows,results,summary:{passed,failed,total:passed+failed}};
