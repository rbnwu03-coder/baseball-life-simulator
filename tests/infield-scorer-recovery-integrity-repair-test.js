'use strict';
// Sprint 5: explicit legal-roster Production fixtures and pure scorer facts.
// No source writes. --capture-red writes only the new Sprint 5 red evidence.
const assert = require('assert/strict');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const cp = require('child_process');
const root = path.resolve(__dirname, '..');
const baseline = 'f16a7f7b2263681788f3846c2e83fbb6f8b0bc53';
const captureRed = process.argv.includes('--capture-red');
const captureGreen = process.argv.includes('--capture-green') || process.argv.includes('--capture-green-final');
const exactBaseline = captureRed || process.argv.includes('--exact-baseline');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const ownSource = fs.readFileSync(__filename, 'utf8');
if(captureRed && fs.existsSync(path.join(root,'docs','infield-scorer-recovery-sprint-5-red-evidence.json')))
  throw Error('Original RED evidence exists; it is immutable after the initial pre-Production capture');
const git = args => cp.execFileSync('git', args, {cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:30e6}).trimEnd();
const originalRead = fs.readFileSync;
const Module = require('module'), originalLoader = Module._extensions['.js'];
const exactSources = exactBaseline ? Object.fromEntries(git(['ls-tree','--name-only',baseline]).split(/\r?\n/).filter(file=>file.endsWith('.js')).map(file=>[path.join(root,file),cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:30e6})])) : {};
if(exactBaseline) {
  fs.readFileSync = function(file, options) {
    const source = exactSources[path.resolve(String(file))];
    if(source !== undefined) return typeof options === 'string' || options?.encoding ? source : Buffer.from(source);
    return originalRead.apply(this, arguments);
  };
  Module._extensions['.js'] = function(module,file) {
    if(exactSources[file] !== undefined) return module._compile(exactSources[file],file);
    return originalLoader(module,file);
  };
}
const {makeContext} = require('./high-school-career-test-context.js');
const c = makeContext(), {run,json} = c;
const fixtures = fs.readFileSync(path.join(__dirname,'first-base-receive-active-ground-production-integration-test.js'),'utf8');
for(const match of fixtures.matchAll(/\brun\(\x60([\s\S]*?)\x60\);/g))
  if(match[1].includes('function firstBaseFixture') || match[1].includes('function firstBaseIncomingBoundary'))run(match[1]);
const labels = {SS:'游擊手','2B':'二壘手','3B':'三壘手','1B':'一壘手'};
const directions = {SS:.1,'2B':.9,'3B':.005,'1B':.995};
const results = [], snapshots = [];
let passed = 0, failed = 0;
function test(name,classification,fn) {
  try {fn();passed++;results.push({name,classification,pass:true});console.log('PASS '+name);}
  catch(error) {failed++;results.push({name,classification,pass:false,error:error.message,stack:error.stack});console.error('FAIL '+name+'\n'+String(error.stack).slice(0,4000));}
}
function fixture(options={},route='secureFirstBaseOut',mode='meaningful') {
  run('var m=firstBaseIncomingBoundary('+JSON.stringify(options)+',"pending");');
  const choice = json('getHighSchoolDefensiveMomentChoices(m)').find(v=>v.routeId===route);
  assert(choice,'Real legal route missing: '+route);
  run('var repairRaw=resolveInfieldDecision(m.defensiveSituation,'+JSON.stringify(choice.matchDecision)+',m,'+(options.sample??.8)+');');
  const before = json('({physicalIdentity:m.groundBallInPlayState.physicalTruth.identity,cursor:m.simulationCursor,outs:m.outs,runners:m.runners,scores:m.scores})');
  if(mode==='routine')run('applyRoutineDefensiveResolutionToHighSchoolMatch(m,{...repairRaw,eventClassification:"playerRoutinePlay"});');
  else run('if(m.activeSituation?.lifecycleState==="presented")beginGroundBallSituationDecision(m,'+JSON.stringify(choice.matchDecision)+');recordGroundBallSituationResolution(m,repairRaw);applyInfieldResolutionToHighSchoolMatch(m,'+JSON.stringify(choice.matchDecision)+',repairRaw);');
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
  const value = json('({raw:repairRaw,legal:m.lastDefensiveResolution,record:m.gameRecord,outs:m.outs,runners:m.runners,scores:m.scores,cursor:m.simulationCursor,physicalIdentity:m.groundBallInPlayState.physicalTruth.identity})');
  assert.equal(value.physicalIdentity,before.physicalIdentity);
  snapshots.push({options,route,mode,before,...value});
  return value;
}
function actor(value,position) {
  const result = value.legal.defensiveAttribution.actors.find(row=>row.actorPosition===position);
  assert(result,'Missing actor '+position);return result;
}
function options(position,extra={}) {return {position:labels[position],direction:directions[position],occupied:0,...extra};}

for(const position of ['SS','2B','3B'])test(position+' legal direct out preserves A / PO','valid existing behavior',()=>{
  const value=fixture(options(position));assert.equal(value.legal.outsCreated,1);assert.equal(actor(value,position).A,1);assert.equal(actor(value,'1B').PO,1);assert.equal(value.legal.error,false);
});
test('3U legal out has PO and no invented assist','valid existing behavior',()=>{
  const value=fixture(options('1B'),'selfCoverFirst');assert.equal(value.legal.outsCreated,1);assert.equal(actor(value,'1B').PO,1);assert.equal(actor(value,'1B').A,0);
});
test('L01 fast-safe failed receive does not charge E or remove hit','confirmed current defect',()=>{
  const value=fixture(options('1B',{direction:.1,batterSpeed:18,capabilities:{fielding:1,catching:1}}));
  assert.equal(value.legal.outsCreated,0);assert.equal(actor(value,'1B').E,0);assert.equal(value.record.totals.home.errors,0);assert.equal(value.record.totals.away.hits,1);
});
test('Fast-safe clean and failed hands preserve the same actual result','valid existing behavior',()=>{
  const clean=fixture(options('1B',{direction:.1,batterSpeed:18}));
  const miss=fixture(options('1B',{direction:.1,batterSpeed:18,capabilities:{fielding:1,catching:1}}));
  assert.equal(clean.legal.outsCreated,miss.legal.outsCreated);assert.deepEqual(clean.runners,miss.runners);assert.deepEqual(clean.scores,miss.scores);assert.equal(clean.physicalIdentity,miss.physicalIdentity);
});
for(const [position,route,npc,relay] of [['3B','initiate543',{'2B':{arm:1}},'2B'],['1B','initiate363',{SS:{arm:1}},'SS']]) {
  test('L01 '+route+' wild completion throw without extra advancement has no E','confirmed current defect',()=>{
    const value=fixture(options(position,{occupied:1,npc}),route);assert.equal(value.legal.outsCreated,1);assert.equal(actor(value,relay).E,0);assert.equal(actor(value,relay).DP,0);assert.equal(value.record.totals.home.errors,0);
  });
}
test('A real on-target receiver muff prevents out and charges receiver E','valid existing behavior',()=>{
  const value=fixture(options('3B',{weakReceiver:'1B'}));assert.equal(value.legal.outsCreated,0);assert.equal(actor(value,'1B').E,1);assert.equal(actor(value,'3B').E,0);assert.equal(actor(value,'1B').PO,0);
});
for(const [position,route,thrower] of [['3B','secureFirstBaseOut','3B'],['3B','initiate543','2B'],['1B','initiate363','SS']]) {
  test('L02 '+route+' subsequent receiver E retains would-be-out assist','confirmed current defect',()=>{
    const weak=position==='1B'?{capabilities:{fielding:3,catching:3},pace:0,contactQuality:.1,sample:.5}:{weakReceiver:'1B'};
    const value=fixture(options(position,{occupied:route==='secureFirstBaseOut'?0:1,...weak}),route);
    assert.equal(actor(value,'1B').E,1);assert.equal(actor(value,thrower).A,1);assert.equal(actor(value,'1B').PO,0);assert.equal(actor(value,thrower).DP,0);assert.equal(value.legal.outsCreated,route==='secureFirstBaseOut'?0:1);
  });
}
test('Already-safe incoming failure does not manufacture an assist','valid existing behavior',()=>{
  const value=fixture(options('1B',{direction:.1,batterSpeed:18,capabilities:{fielding:1,catching:1}}));assert.equal(actor(value,'SS').A,0);assert.equal(actor(value,'1B').PO,0);assert.equal(value.legal.outsCreated,0);
});
for(const position of ['SS','2B'])test('L03 '+position+' receiver projection explicitly marks insufficient scorer facts','missing contract coverage',()=>{
  const value=fixture(options(position,{weakReceiver:'1B'}));
  assert.equal(value.legal.outsCreated,0);assert.equal(actor(value,'1B').E,0);
  assert(value.legal.scorerFacts,'Missing scorer fact envelope');
  assert(value.legal.scorerFacts.decisions.some(row=>JSON.stringify(row).includes('insufficient')),'Legacy unknown facts must be explicit');
});
test('L01 attributable extra advancement remains independently error-eligible','missing contract coverage',()=>{
  // This declares isolated scorer evidence. It is not a Production extra-base witness.
  assert.equal(typeof run('DefensiveDecisionThrowFoundation.resolveScorerEligibility'),'function');
  run(`var isolatedScorerActions=DefensiveDecisionThrowFoundation.createActionFacts({playIdentity:"isolated-advancement",physicalIdentity:"declared-ball",
    actions:[{actorId:"thrower",actorPosition:"3B",type:"field",status:"completed",dependsOn:[]},
      {actorId:"thrower",actorPosition:"3B",type:"throw",status:"failed",receiverId:"receiver",targetBase:"first",runnerId:"batter",dependsOn:["isolated-advancement|action|1"]},
      {actorId:"receiver",actorPosition:"1B",type:"receive",status:"notAttempted",targetBase:"first",runnerId:"batter",dependsOn:["isolated-advancement|action|2"]},
      {actorId:"receiver",actorPosition:"1B",type:"baseTouch",status:"notAttempted",targetBase:"first",runnerId:"batter",dependsOn:["isolated-advancement|action|3"]}]});
    var isolatedScorerEvidence=DefensiveDecisionThrowFoundation.resolveScorerEligibility({actionFacts:isolatedScorerActions,retirements:[],contests:[{
      failedActionId:"isolated-advancement|action|2",runnerId:"batter",targetBase:"first",ordinaryEffort:{status:"eligible",source:"declared-isolated-coarse-ordinary-effort"},
      potentialOut:{status:"alreadySafe",cleanCompletion:9,runnerArrival:2,source:"declared-original-timing"},dpLeg:1,
      attributableAdvancement:[{runnerId:"batter",expectedBase:"first",actualBase:"second",sourceActionId:"isolated-advancement|action|2",source:"declared-isolated-advancement-context"}],
      evidence:{source:"declared-isolated-scorer-fixture",consumedRng:false}}]});
    var isolatedScorerProjection=DefensiveDecisionThrowFoundation.projectDefensiveAttribution(isolatedScorerActions,[],isolatedScorerEvidence);`);
  const result=json('isolatedScorerProjection');assert.equal(result.actors.find(a=>a.actorId==='thrower').E,1);assert.equal(result.actors.find(a=>a.actorId==='thrower').A,0);
  assert.deepEqual(result.retirements,[]);assert.equal(run('isolatedScorerEvidence.contests[0].potentialOut.status'),'alreadySafe');
});
for(const position of ['SS','2B','3B','1B'])test('L04 '+position+' forged execution route copy is rejected without input mutation',position==='1B'?'valid existing behavior':'confirmed current defect',()=>{
  run('var m=firstBaseIncomingBoundary('+JSON.stringify(options(position,{occupied:1}))+',"pending");firstBaseExecute(m,"challenge",.8);var forged=JSON.parse(JSON.stringify(player));forged.highSchoolMatch.activeSituation.executionState.selectedRoute="forged";');
  const input=json('forged');assert.throws(()=>run('normalizeSave(forged);'));assert.deepEqual(json('forged'),input);
});

// Additional green-safety checks are kept separate from the immutable initial RED capture.
if(!captureRed) {
  for(const [position,route]of [['3B','initiate543'],['1B','initiate363']])for(const mode of ['meaningful','routine'])
    test(position+' '+mode+' first-leg error preventing a feasible force is E plus non-hit FC, with no virtual out','confirmed scorer repair regression',()=>{
      const value=fixture(options(position,{occupied:1,capabilities:{throwing:1}}),route,mode);
      assert.equal(value.legal.outsCreated,0);assert.equal(value.record.totals.away.hits,0);
      assert.equal(value.record.totals.home.errors,1);assert.equal(actor(value,position).E,1);
      assert.equal(value.legal.batterScoring.reason,'OBR9.05b1PrecedingForcePreventedByError');
      assert.equal(value.runners[0],value.legal.batterScoring.batterId);
      assert.equal(value.record.playerLines[value.legal.batterScoring.batterId].batting.H,0);
      assert.equal(value.legal.defensiveAttribution.retirements.length,0);
      assert(value.legal.defensiveAttribution.actors.every(a=>a.PO===0&&a.A===0&&a.DP===0));
    });
  for(const [position,route,extra]of [
    ['SS','startDoublePlaySecond',{weakReceiver:'1B'}],
    ['2B','initiate463',{weakReceiver:'1B'}],
    ['3B','initiate543',{weakReceiver:'1B'}],
    ['1B','initiate363',{capabilities:{fielding:3,catching:3},pace:0,contactQuality:.1,sample:.5}]
  ])for(const mode of ['meaningful','routine'])test(position+' '+mode+' partial DP keeps batter safe with a non-hit FC classification','confirmed scorer repair regression',()=>{
    const value=fixture(options(position,{occupied:1,...extra}),route,mode);
    assert.equal(value.legal.outsCreated,1);assert.equal(value.record.totals.away.hits,0);
    assert.equal(value.legal.batterScoring.classification,'fieldersChoice');
    const batter=value.legal.batterScoring.batterId;
    assert.equal(value.runners[0],batter);assert.equal(value.record.playerLines[batter].batting.H,0);
    assert.equal(value.raw.runnerSettlement.outRunnerIds.includes(batter),false);
    assert(value.legal.defensiveAttribution.actors.every(a=>a.DP===0));
  });
  for(const position of ['SS','3B','1B'])test(position+' failed acquisition preserves original field scorer with explicit compatibility boundary','valid existing behavior',()=>{
    const value=fixture(options(position,{capabilities:{fielding:1,catching:1}}),position==='1B'?'selfCoverFirst':'secureFirstBaseOut');
    assert.equal(value.legal.outsCreated,0);assert.equal(value.raw.error,true);
    assert.equal(actor(value,position).E,1);assert.equal(value.legal.scorerFacts,undefined);
    assert.equal(value.legal.scorerCompatibility.status,'insufficientScorerFacts');
    assert.equal(value.raw.actionFacts.actions.some(a=>a.type==='throw'&&a.status==='completed'),false);
    assert.equal(value.record.totals.home.errors,1);
  });
  for(const position of ['SS','2B','3B','1B'])test(position+' all lifecycle phases reject conflicting / empty route copies and admit genuinely omitted copies','missing contract coverage',()=>{
    for(const phase of ['pending','executed','settled']) {
      run('var m=firstBaseIncomingBoundary('+JSON.stringify(options(position,{occupied:1}))+',"pending");');
      if(phase!=='pending')run('firstBaseExecute(m,"challenge",.8);');
      if(phase==='settled') {
        // Capture the valid settled boundary before Production immediately closes it.
        run('var closeScorerLifecycle=settleAndCloseGroundBallSituation;settleAndCloseGroundBallSituation=function(match){var life=MatchSituationLifecycle.normalizeSituation(match.activeSituation);if(life?.lifecycleState==="resolved")life=MatchSituationLifecycle.markSettled(life,{identity:life.situationId+"|"+match.groundBallInPlayState.identity+"|settlement"});match.activeSituation=life;return life;};');
        try{run('resumeResolvedHighSchoolGroundBallSettlement(m);');}
        finally{run('settleAndCloseGroundBallSituation=closeScorerLifecycle;');}
      }
      const original=json('player'),cursor=run('m.simulationCursor');
      for(const copy of ['decision','executionState'])for(const route of ['forged','']) {
        run('var routeProbe=JSON.parse(JSON.stringify(player));var routeLife=routeProbe.highSchoolMatch.activeSituation;routeLife['+JSON.stringify(copy)+']={...routeLife['+JSON.stringify(copy)+'],selectedRoute:'+JSON.stringify(route)+'};');
        const input=json('routeProbe');assert.throws(()=>run('normalizeSave(routeProbe);'));
        assert.deepEqual(json('routeProbe'),input);assert.deepEqual(json('player'),original);
        assert.equal(run('m.simulationCursor'),cursor);
      }
      run('var omittedRoute=JSON.parse(JSON.stringify(player));if(omittedRoute.highSchoolMatch.activeSituation.executionState)delete omittedRoute.highSchoolMatch.activeSituation.executionState.selectedRoute;normalizeSave(omittedRoute);');
      assert.deepEqual(json('player'),original);
    }
  });
  test('Pitch source freeze rejects broadening or changing exact scorer-owner additions','missing contract coverage',()=>{
    const {assertPitchProductionSourceScope}=require('./pitch-production-source-scope.cjs');
    const current=fs.readFileSync(path.join(root,'script.js'),'utf8').replace(/\r\n?/g,'\n');
    const old=git(['show','9b9546f94a7286afef474be634fd93c57eb455db:script.js']);
    assertPitchProductionSourceScope(current,old);
    for(const [from,to]of [['runnerFacts.scorerFacts ? { scorerErrorOwner','true ? { scorerErrorOwner'],['authority: "defensiveActionAttribution"','authority: "anything"']]) {
      const mutated=current.replace(from,to);assert.notEqual(mutated,current);
      assert.throws(()=>assertPitchProductionSourceScope(mutated,old));
    }
  });
  for(const position of ['SS','2B','3B','1B']) {
    for(const [name,extra]of [['clean',{}],['low throwing',{capabilities:{arm:1,throwing:1}}],['low hands',{capabilities:{fielding:1,catching:1}}]])
      test(position+' '+name+' pending / executed / settled recovery is deterministic','valid existing behavior',()=>{
        run('var m=firstBaseIncomingBoundary('+JSON.stringify(options(position,{occupied:1,...extra}))+',"pending");var pendingGround=JSON.stringify(m.groundBallInPlayState);saveGame();player=createInitialPlayer("scorer pending cold");loadGame();m=player.highSchoolMatch;');
        assert.equal(run('JSON.stringify(m.groundBallInPlayState)'),run('pendingGround'));
        run('var savedExecution=firstBaseExecute(m,"challenge",.8);var groundExecution=JSON.stringify(m.groundBallInPlayState);var initialCursor=m.simulationCursor;saveGame();player=createInitialPlayer("scorer executed cold");loadGame();m=player.highSchoolMatch;');
        assert.equal(run('savedExecution.rolls'),1);assert.equal(run('JSON.stringify(m.groundBallInPlayState)'),run('groundExecution'));
        assert.equal(run('m.simulationCursor'),run('initialCursor'));
        run('var replayRandom=Math.random;Math.random=()=>{throw Error("SCORER_RECOVERY_REROLL");};');
        try {
          run('resumeResolvedHighSchoolGroundBallSettlement(m);var settledScorerFacts=firstBaseFacts(m);resumeResolvedHighSchoolGroundBallSettlement(m);');
          assert.equal(run('firstBaseFacts(m)'),run('settledScorerFacts'));
        } finally {run('Math.random=replayRandom;');}
        run('saveGame();player=createInitialPlayer("scorer settled cold");loadGame();m=player.highSchoolMatch;');
        assert.equal(run('firstBaseFacts(m)'),run('settledScorerFacts'));
        assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);
        assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
      });
    test(position+' public choice and duplicate preserve one official record','valid existing behavior',()=>{
      run('var m=firstBaseFixture('+JSON.stringify(options(position,{occupied:1}))+');var publicChoice=firstBasePublic(m,"secure",.8);var afterPublic=firstBaseFacts(m);');
      assert.equal(run('publicChoice.rolls'),1);
      assert.equal(run('chooseHighSchoolYearOneMatchMoment(publicChoice.choice.matchDecision,publicChoice.choice.matchMomentId,()=>{throw Error("DUPLICATE_SAMPLE");})'),false);
      assert.equal(run('firstBaseFacts(m)'),run('afterPublic'));
      assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);
      assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
    });
  }
  for(const [position,direction,versionKey]of [['SS',.005,'TOPOLOGY_VERSION'],['2B',.995,'TOPOLOGY_VERSION'],['3B',.005,'GROUND_TOPOLOGY_VERSION'],['1B',.995,'FIRST_BASE_GROUND_TOPOLOGY_VERSION']])
    test(position+' historical topology pending and executed ownership survives scorer repair','valid existing behavior',()=>{
      run('var oldScorerRouter=getHighSchoolDefensiveOpportunity;var historicalScorerVersion=DefensiveOpportunityFoundation.'+versionKey+';getHighSchoolDefensiveOpportunity=(m,t)=>DefensiveOpportunityFoundation.resolveDefensiveOpportunity({physicalTruth:t,activeRoster:m.rosters[m.defenseTeam],topologyVersion:historicalScorerVersion});');
      try {run('var m=firstBaseFixture('+JSON.stringify(options(position,{direction,occupied:1}))+');');}
      finally {run('getHighSchoolDefensiveOpportunity=oldScorerRouter;');}
      const identity=run('m.groundBallInPlayState.physicalTruth.identity');
      run('saveGame();player=createInitialPlayer("scorer historical pending");loadGame();m=player.highSchoolMatch;firstBaseExecute(m,"secure",.8);saveGame();player=createInitialPlayer("scorer historical executed");loadGame();m=player.highSchoolMatch;resumeResolvedHighSchoolGroundBallSettlement(m);');
      assert.equal(run('m.groundBallInPlayState.physicalTruth.identity'),identity);
      assert.equal(run('getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth).topologyVersion'),run('historicalScorerVersion'));
      assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);
      assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
    });
  test('Meaningful / routine 5-3 receiver error has the same E / would-be A / state','valid existing behavior',()=>{
    const opts=options('3B',{weakReceiver:'1B'});
    const meaningful=fixture(opts,'secureFirstBaseOut','meaningful');
    const routine=fixture(opts,'secureFirstBaseOut','routine');
    assert.deepEqual(meaningful.runners,routine.runners);assert.deepEqual(meaningful.scores,routine.scores);assert.equal(meaningful.outs,routine.outs);
    for(const position of ['3B','1B'])for(const stat of ['PO','A','E','DP'])assert.equal(actor(meaningful,position)[stat],actor(routine,position)[stat]);
    const before=json('m.gameRecord');run('applyRoutineDefensiveResolutionToHighSchoolMatch(m,{...repairRaw,eventClassification:"playerRoutinePlay"});');
    assert.deepEqual(json('m.gameRecord'),before);
  });
  test('Scorer changes preserve exact RED fixture execution / identities / settlement / cursor','valid existing behavior',()=>{
    const red=JSON.parse(fs.readFileSync(path.join(root,'docs','infield-scorer-recovery-sprint-5-red-evidence.json'),'utf8'));
    const fields=value=>({physicalIdentity:value.physicalIdentity,cursor:value.cursor,outs:value.outs,runners:value.runners,scores:value.scores,
      retirements:value.raw.runnerSettlement.retirements,runnerChanges:value.raw.runnerSettlement.runnerChanges,
      scoringRunnerIds:value.raw.runnerSettlement.scoringRunnerIds,
      actions:value.raw.actionFacts.actions.map(a=>({identity:a.identity,actorId:a.actorId,actorPosition:a.actorPosition,type:a.type,status:a.status,
        receiverId:a.receiverId,targetBase:a.targetBase,runnerId:a.runnerId,dependsOn:a.dependsOn,provenance:a.provenance}))});
    for(const original of red.snapshots) {
      const current=fixture(original.options,original.route,original.mode);
      assert.deepEqual(fields(current),fields(original),'Execution changed in '+original.route+' '+original.options.position);
    }
  });
  test('Fast-safe 3-6-3 return muff keeps first force without E / second PO / DP','confirmed current defect',()=>{
    const value=fixture(options('1B',{occupied:1,batterSpeed:18,capabilities:{fielding:3,catching:3},pace:0,contactQuality:.1,sample:.5}),'initiate363');
    assert.equal(value.legal.outsCreated,1);assert.equal(actor(value,'1B').E,0);assert.equal(actor(value,'1B').A,1);assert.equal(actor(value,'1B').PO,0);assert.equal(actor(value,'SS').A,0);assert.equal(actor(value,'SS').DP,0);
  });
  test('3B first-leg inaccurate throw lost feasible out belongs to thrower','valid existing behavior',()=>{
    const value=fixture(options('3B',{capabilities:{throwing:1}}));
    assert.equal(value.legal.outsCreated,0);assert.equal(actor(value,'3B').E,1);assert.equal(actor(value,'1B').E,0);assert.equal(actor(value,'1B').PO,0);assert.equal(value.record.totals.home.errors,1);
  });
  test('1B first-leg inaccurate 3-6-3 throw is not exempted as DP completion','valid existing behavior',()=>{
    const value=fixture(options('1B',{occupied:1,capabilities:{throwing:1}}),'initiate363');
    assert.equal(value.legal.outsCreated,0);assert.equal(actor(value,'1B').E,1);assert.equal(actor(value,'SS').E,0);assert.equal(actor(value,'SS').PO,0);assert.equal(actor(value,'1B').A,0);
  });
  test('3B challenging receive failure lacks automatic ordinary-effort E','valid existing behavior',()=>{
    const value=fixture(options('3B',{weakReceiver:'1B',capabilities:{throwing:5}}));
    assert.equal(value.legal.outsCreated,0);assert.equal(actor(value,'1B').E,0);assert.equal(actor(value,'3B').E,0);assert.equal(actor(value,'3B').A,0);
  });
  for(const row of [
    {name:'first throw already-safe failure',type:'throw',potential:'alreadySafe',ordinary:'eligible',leg:1,E:0,A:0},
    {name:'first throw lost feasible out',type:'throw',potential:'feasible',ordinary:'eligible',leg:1,E:1,A:0},
    {name:'DP completion wild throw without extra advancement',type:'throw',potential:'feasible',ordinary:'eligible',leg:2,E:0,A:0},
    {name:'DP completion muff with feasible out',type:'receive',potential:'feasible',ordinary:'eligible',leg:2,E:1,A:1},
    {name:'muff after runner already safe',type:'receive',potential:'alreadySafe',ordinary:'eligible',leg:1,E:0,A:0},
    {name:'difficult receive without ordinary effort',type:'receive',potential:'feasible',ordinary:'ineligible',leg:1,E:0,A:0},
    {name:'unknown potential out is explicitly insufficient',type:'receive',potential:'insufficient',ordinary:'eligible',leg:1,E:0,A:0}
  ])test('Isolated scorer '+row.name,'missing contract coverage',()=>{
    const identity='isolated-'+row.name.replace(/[^a-z]+/g,'-');
    const actions=row.leg===2?[
      {actorId:'firstThrower',actorPosition:'3B',type:'field',status:'completed',dependsOn:[]},
      {actorId:'firstThrower',actorPosition:'3B',type:'throw',status:'completed',receiverId:'thrower',targetBase:'second',runnerId:'r1',dependsOn:[identity+'|action|1']},
      {actorId:'thrower',actorPosition:'2B',type:'receive',status:'completed',targetBase:'second',runnerId:'r1',dependsOn:[identity+'|action|2']},
      {actorId:'thrower',actorPosition:'2B',type:'baseTouch',status:'completed',targetBase:'second',runnerId:'r1',dependsOn:[identity+'|action|3']},
      {actorId:'thrower',actorPosition:'2B',type:'pivot',status:'completed',targetBase:'first',dependsOn:[identity+'|action|4']},
      {actorId:'thrower',actorPosition:'2B',type:'throw',status:row.type==='throw'?'failed':'completed',receiverId:'receiver',targetBase:'first',runnerId:'batter',dependsOn:[identity+'|action|5']},
      {actorId:'receiver',actorPosition:'1B',type:'receive',status:row.type==='receive'?'failed':'notAttempted',targetBase:'first',runnerId:'batter',dependsOn:[identity+'|action|6']},
      {actorId:'receiver',actorPosition:'1B',type:'baseTouch',status:'notAttempted',targetBase:'first',runnerId:'batter',dependsOn:[identity+'|action|7']}
    ]:[
      {actorId:'thrower',actorPosition:'3B',type:'field',status:'completed',dependsOn:[]},
      {actorId:'thrower',actorPosition:'3B',type:'throw',status:row.type==='throw'?'failed':'completed',receiverId:'receiver',targetBase:'first',runnerId:'batter',dependsOn:[identity+'|action|1']},
      {actorId:'receiver',actorPosition:'1B',type:'receive',status:row.type==='receive'?'failed':'notAttempted',targetBase:'first',runnerId:'batter',dependsOn:[identity+'|action|2']},
      {actorId:'receiver',actorPosition:'1B',type:'baseTouch',status:'notAttempted',targetBase:'first',runnerId:'batter',dependsOn:[identity+'|action|3']}
    ];
    run('var pureActions=DefensiveDecisionThrowFoundation.createActionFacts('+JSON.stringify({playIdentity:identity,physicalIdentity:'declared-scorer-truth',actions})+');');
    const failedActionId=identity+'|action|'+(row.type==='throw'?(row.leg===2?6:2):(row.leg===2?7:3));
    const input={failedActionId,runnerId:'batter',targetBase:'first',ordinaryEffort:{status:row.ordinary,source:'declared-isolated-ordinary-effort'},potentialOut:{status:row.potential,cleanCompletion:row.potential==='insufficient'?null:row.potential==='alreadySafe'?9:2,runnerArrival:row.potential==='insufficient'?null:row.potential==='alreadySafe'?2:9,source:'declared-isolated-original-timing'},dpLeg:row.leg,firstRetirementId:row.leg===2?'r1':null,attributableAdvancement:[],evidence:{source:'declared-isolated-contract',consumedRng:false}};
    const retirements=row.leg===2?[{runnerId:'r1',targetBase:'second',outType:'force',sequence:1}]:[];
    run('var pureRetirements='+JSON.stringify(retirements)+';var pureScorer=DefensiveDecisionThrowFoundation.resolveScorerEligibility({actionFacts:pureActions,retirements:pureRetirements,contests:['+JSON.stringify(input)+']});var pureAttribution=DefensiveDecisionThrowFoundation.projectDefensiveAttribution(pureActions,pureRetirements,pureScorer);');
    const actual=json('pureAttribution');
    assert.equal(actual.actors.find(a=>a.actorId===(row.type==='throw'?'thrower':'receiver')).E,row.E);
    assert.equal(actual.actors.find(a=>a.actorId==='thrower').A,row.A);
    assert.equal(actual.retirements.length,retirements.length);assert.equal(actual.actors.find(a=>a.actorId==='receiver').PO,0);assert(actual.actors.every(a=>a.DP===0));
    if(row.potential==='insufficient')assert(JSON.stringify(json('pureScorer')).includes('insufficient'));
  });
  test('Existing GameRecord keeps base-hit H plus extra-advancement E in actor / team totals','missing contract coverage',()=>{
    // Declared pure scorer facts enter the real record owner; no simulated extra-base witness is claimed.
    run(`var extraRecord=MatchGameRecord.createGameRecord({gameId:"extra-advancement-record",homeTeamId:"home",awayTeamId:"away"});
      var extraPA={sequence:0,type:"plateAppearance",inning:1,half:"上",offenseTeam:"away",batterId:"batter",result:"single",
        before:{outs:0},after:{outs:0},scorerErrorOwner:{authority:"defensiveActionAttribution",playIdentity:isolatedScorerActions.playIdentity}};
      var extraDefense={sequence:1,type:"defensivePlay",inning:1,half:"上",offenseTeam:"away",actionFacts:isolatedScorerActions,
        scorerFacts:isolatedScorerEvidence,defensiveAttribution:isolatedScorerProjection,error:true,outsCreated:0};
      MatchGameRecord.recordEvent(extraRecord,extraPA);MatchGameRecord.recordEvent(extraRecord,extraDefense);`);
    assert.equal(run('isolatedScorerEvidence.batterReachedOnError'),false);
    assert.equal(run('extraRecord.totals.away.hits'),1);assert.equal(run('extraRecord.playerLines.batter.batting.H'),1);
    assert.equal(run('extraRecord.totals.home.errors'),1);assert.equal(run('extraRecord.playerLines.thrower.defense.E'),1);
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(extraRecord)'),[]);
    const before=json('extraRecord');assert.equal(run('MatchGameRecord.recordEvent(extraRecord,extraDefense).status'),'duplicate');assert.deepEqual(json('extraRecord'),before);
    run('MatchGameRecord.recordEvent(extraRecord,{...extraDefense,sequence:2,type:"playerRoutinePlay"});');
    assert.equal(run('extraRecord.totals.home.errors'),1);assert.equal(run('extraRecord.totals.away.hits'),1);
    assert.equal(run('extraRecord.playerLines.thrower.defense.E'),1);assert.equal(run('extraRecord.playerLines.thrower.defense.chances'),1);
    assert(run('Object.values(extraRecord.playerLines).every(line=>line.defense.PO===0&&line.defense.DP===0)'));
  });
  test('Same actor / same play multiple eligible misplays charge one E through existing owner','missing contract coverage',()=>{
    run(`var multiActions=DefensiveDecisionThrowFoundation.createActionFacts({playIdentity:"declared-multiple-misplay",physicalIdentity:"declared-one-ball",actions:[
      {actorId:"fielder",actorPosition:"3B",type:"field",status:"failed",dependsOn:[],provenance:{authority:"declared-first-misplay"}},
      {actorId:"fielder",actorPosition:"3B",type:"field",status:"completed",dependsOn:[],provenance:{authority:"declared-recovered-possession"}},
      {actorId:"fielder",actorPosition:"3B",type:"throw",status:"failed",targetBase:"first",receiverId:"first",dependsOn:["declared-multiple-misplay|action|2"]},
      {actorId:"first",actorPosition:"1B",type:"receive",status:"notAttempted",targetBase:"first",dependsOn:["declared-multiple-misplay|action|3"]},
      {actorId:"first",actorPosition:"1B",type:"baseTouch",status:"notAttempted",targetBase:"first",runnerId:"batter",dependsOn:["declared-multiple-misplay|action|4"]}]});
      var multiContests=[1,3].map((index,n)=>({failedActionId:"declared-multiple-misplay|action|"+index,runnerId:"batter",targetBase:"first",dpLeg:1,
        ordinaryEffort:{status:"eligible",source:"declared-independent-misplay-context"},potentialOut:{status:"alreadySafe",cleanCompletion:9,runnerArrival:2,source:"declared-original-arrival"},
        attributableAdvancement:[{runnerId:"batter",expectedBase:n?"second":"first",actualBase:n?"third":"second",sourceActionId:"declared-multiple-misplay|action|"+index,source:"declared-independent-advancement-attribution"}]}));
      var multiScorer=DefensiveDecisionThrowFoundation.resolveScorerEligibility({actionFacts:multiActions,retirements:[],contests:multiContests});
      var multiAttribution=DefensiveDecisionThrowFoundation.projectDefensiveAttribution(multiActions,[],multiScorer);
      var multiRecord=MatchGameRecord.createGameRecord({gameId:"multi-record",homeTeamId:"home",awayTeamId:"away"});
      MatchGameRecord.recordEvent(multiRecord,{sequence:0,type:"plateAppearance",inning:1,half:"上",offenseTeam:"away",batterId:"batter",result:"single",before:{outs:0},after:{outs:0}});
      var multiEvent={sequence:1,type:"defensivePlay",inning:1,half:"上",offenseTeam:"away",actionFacts:multiActions,scorerFacts:multiScorer,defensiveAttribution:multiAttribution};
      MatchGameRecord.recordEvent(multiRecord,multiEvent);MatchGameRecord.recordEvent(multiRecord,{...multiEvent,sequence:2,type:"playerRoutinePlay"});`);
    assert.equal(run('multiScorer.decisions.filter(d=>d.charged).length'),2);
    assert.equal(run('multiRecord.playerLines.fielder.defense.E'),1);assert.equal(run('multiRecord.totals.home.errors'),1);assert.equal(run('multiRecord.totals.away.hits'),1);
    assert(run('Object.values(multiRecord.playerLines).every(line=>line.defense.PO===0&&line.defense.A===0&&line.defense.DP===0)'));
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(multiRecord)'),[]);
  });
  test('Scorer interpretation tamper is rejected before GameRecord mutation','missing contract coverage',()=>{
    run('var tamperedScorer=JSON.parse(JSON.stringify(isolatedScorerEvidence));tamperedScorer.decisions[0].charged=false;var tamperRecord=MatchGameRecord.createGameRecord({gameId:"tamper",homeTeamId:"home",awayTeamId:"away"});');
    const before=json('tamperRecord'),input=json('tamperedScorer');
    assert.throws(()=>run('MatchGameRecord.recordEvent(tamperRecord,{sequence:0,type:"defensivePlay",inning:1,half:"上",offenseTeam:"away",actionFacts:isolatedScorerActions,scorerFacts:tamperedScorer,defensiveAttribution:isolatedScorerProjection});'));
    assert.deepEqual(json('tamperRecord'),before);assert.deepEqual(json('tamperedScorer'),input);
    run('var identityTamper=JSON.parse(JSON.stringify(isolatedScorerEvidence));identityTamper.physicalIdentity="another-ball";');
    assert.throws(()=>run('DefensiveDecisionThrowFoundation.projectDefensiveAttribution(isolatedScorerActions,[],identityTamper);'));
  });
  test('Scorer contest cannot claim an unrelated runner / base or terminal chain','missing contract coverage',()=>{
    run(`var unrelatedActions=DefensiveDecisionThrowFoundation.createActionFacts({playIdentity:"unrelated-scorer",physicalIdentity:"one-ball",actions:[
      {actorId:"thrower",actorPosition:"3B",type:"field",status:"completed",dependsOn:[]},
      {actorId:"thrower",actorPosition:"3B",type:"throw",status:"failed",receiverId:"first",targetBase:"first",runnerId:"batter",dependsOn:["unrelated-scorer|action|1"]},
      {actorId:"first",actorPosition:"1B",type:"baseTouch",status:"notAttempted",targetBase:"first",runnerId:"batter",dependsOn:["unrelated-scorer|action|1"]}]});
      var unrelatedContest={...isolatedScorerEvidence.contests[0],failedActionId:"unrelated-scorer|action|2",attributableAdvancement:[]};`);
    assert.throws(()=>run('DefensiveDecisionThrowFoundation.resolveScorerEligibility({actionFacts:unrelatedActions,contests:[unrelatedContest]});'));
    assert.throws(()=>run('DefensiveDecisionThrowFoundation.resolveScorerEligibility({actionFacts:isolatedScorerActions,contests:[{...isolatedScorerEvidence.contests[0],runnerId:"unrelated-runner"}]});'));
  });
  test('Recovered initial misplay with actual out retains A / PO and no scorer E','missing contract coverage',()=>{
    run(`var recoveredActions=DefensiveDecisionThrowFoundation.createActionFacts({playIdentity:"declared-recovered-out",physicalIdentity:"declared-recovered-ball",actions:[
      {actorId:"fielder",actorPosition:"3B",type:"field",status:"failed",dependsOn:[]},
      {actorId:"fielder",actorPosition:"3B",type:"field",status:"completed",dependsOn:[],provenance:{authority:"declared-recovered-possession"}},
      {actorId:"fielder",actorPosition:"3B",type:"throw",status:"completed",targetBase:"first",receiverId:"first",dependsOn:["declared-recovered-out|action|2"]},
      {actorId:"first",actorPosition:"1B",type:"receive",status:"completed",targetBase:"first",dependsOn:["declared-recovered-out|action|3"]},
      {actorId:"first",actorPosition:"1B",type:"baseTouch",status:"completed",targetBase:"first",runnerId:"batter",dependsOn:["declared-recovered-out|action|4"]}]});
      var recoveredRetirement=[{runnerId:"batter",targetBase:"first",outType:"batterRunnerBeforeFirst",sequence:1}];
      var recoveredScorer=DefensiveDecisionThrowFoundation.resolveScorerEligibility({actionFacts:recoveredActions,retirements:recoveredRetirement,contests:[{
        failedActionId:"declared-recovered-out|action|1",runnerId:"batter",targetBase:"first",dpLeg:1,ordinaryEffort:{status:"eligible",source:"declared-ordinary-effort"},
        potentialOut:{status:"feasible",cleanCompletion:2,runnerArrival:9,source:"declared-original-arrival"},attributableAdvancement:[]}]});
      var recoveredAttribution=DefensiveDecisionThrowFoundation.projectDefensiveAttribution(recoveredActions,recoveredRetirement,recoveredScorer);
      var recoveredRecord=MatchGameRecord.createGameRecord({gameId:"recovered",homeTeamId:"home",awayTeamId:"away"});
      MatchGameRecord.recordEvent(recoveredRecord,{sequence:0,type:"plateAppearance",inning:1,half:"上",offenseTeam:"away",batterId:"batter",result:"out",before:{outs:0},after:{outs:1}});
      MatchGameRecord.recordEvent(recoveredRecord,{sequence:1,type:"defensivePlay",inning:1,half:"上",offenseTeam:"away",actionFacts:recoveredActions,scorerFacts:recoveredScorer,defensiveAttribution:recoveredAttribution});`);
    assert.equal(run('recoveredAttribution.retirements.length'),1);assert.equal(run('recoveredRecord.playerLines.fielder.defense.A'),1);assert.equal(run('recoveredRecord.playerLines.first.defense.PO'),1);
    assert.equal(run('recoveredRecord.totals.home.errors'),0);assert.equal(run('recoveredRecord.playerLines.fielder.defense.E'),0);
    assert(run('Object.values(recoveredRecord.playerLines).every(line=>line.defense.DP===0)'));assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(recoveredRecord)'),[]);
  });
  test('PA reached-on-error marker delegates one team E to the same defensive owner','missing contract coverage',()=>{
    run(`var errorPARecord=MatchGameRecord.createGameRecord({gameId:"owned-error",homeTeamId:"home",awayTeamId:"away"});
      var errorActions=DefensiveDecisionThrowFoundation.createActionFacts({playIdentity:"owned-error-play",physicalIdentity:"owned-error-ball",actions:[
        {actorId:"fielder",actorPosition:"3B",type:"field",status:"completed",dependsOn:[]},
        {actorId:"fielder",actorPosition:"3B",type:"throw",status:"completed",targetBase:"first",receiverId:"first",dependsOn:["owned-error-play|action|1"]},
        {actorId:"first",actorPosition:"1B",type:"receive",status:"failed",targetBase:"first",dependsOn:["owned-error-play|action|2"]},
        {actorId:"first",actorPosition:"1B",type:"baseTouch",status:"notAttempted",targetBase:"first",runnerId:"batter",dependsOn:["owned-error-play|action|3"]}]});
      var errorScorer=DefensiveDecisionThrowFoundation.resolveScorerEligibility({actionFacts:errorActions,retirements:[],contests:[{failedActionId:"owned-error-play|action|3",runnerId:"batter",targetBase:"first",dpLeg:1,
        ordinaryEffort:{status:"eligible",source:"declared-on-target-ordinary-receive"},potentialOut:{status:"feasible",cleanCompletion:2,runnerArrival:9,source:"declared-original-arrival"},attributableAdvancement:[]}]});
      var errorAttribution=DefensiveDecisionThrowFoundation.projectDefensiveAttribution(errorActions,[],errorScorer);
      MatchGameRecord.recordEvent(errorPARecord,{sequence:0,type:"plateAppearance",inning:1,half:"上",offenseTeam:"away",batterId:"batter",result:"error",before:{outs:0},after:{outs:0},
        scorerErrorOwner:{authority:"defensiveActionAttribution",playIdentity:errorActions.playIdentity}});
      MatchGameRecord.recordEvent(errorPARecord,{sequence:1,type:"defensivePlay",inning:1,half:"上",offenseTeam:"away",actionFacts:errorActions,scorerFacts:errorScorer,defensiveAttribution:errorAttribution});`);
    assert.equal(run('errorScorer.batterReachedOnError'),true);assert.equal(run('errorPARecord.totals.away.hits'),0);
    assert.equal(run('errorPARecord.totals.home.errors'),1);assert.equal(run('errorPARecord.playerLines.first.defense.E'),1);assert.equal(run('errorPARecord.playerLines.fielder.defense.A'),1);
    assert(run('Object.values(errorPARecord.playerLines).every(line=>line.defense.PO===0&&line.defense.DP===0)'));assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(errorPARecord)'),[]);
  });
}

fs.readFileSync=originalRead;Module._extensions['.js']=originalLoader;
console.log('INFIELD SCORER / RECOVERY '+passed+' PASS / '+failed+' FAIL / '+(passed+failed)+' checks');
if(captureGreen) {
  assert.equal(exactBaseline,false,'Green evidence requires current Production');
  const output=path.join(root,'docs',process.argv.includes('--capture-green-final')
    ? 'infield-scorer-recovery-sprint-5-green-final-evidence.json' : 'infield-scorer-recovery-sprint-5-green-evidence.json');
  if(fs.existsSync(output))throw Error('Final GREEN evidence exists; retain the completed capture');
  const productionFiles=git(['ls-files']).split(/\r?\n/).filter(file=>!file.includes('/')&&file.endsWith('.js'));
  fs.writeFileSync(output,JSON.stringify({baseline,capturedAt:new Date().toISOString(),sourceMode:'current worktree; Production fixtures plus separately declared pure contracts',
    testSourceHash:sha(ownSource),productionSourceHashes:Object.fromEntries(productionFiles.map(file=>[file,sha(fs.readFileSync(path.join(root,file)))])),
    summary:{passed,failed,total:passed+failed},results,snapshots},null,2)+'\n');
}
if(captureRed) {
  const output=path.join(root,'docs','infield-scorer-recovery-sprint-5-red-evidence.json');
  const prior=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):null;
  const evidence={baseline,capturedAt:new Date().toISOString(),command:'node tests/infield-scorer-recovery-integrity-repair-test.js --capture-red',sourceMode:'git show exact f16 root Production JS compiled in memory; unchanged original test fixtures',testSourceHash:sha(ownSource),testSource:ownSource,productionSourceHashes:Object.fromEntries(Object.entries(exactSources).map(([file,source])=>[path.relative(root,file).replace(/\\/g,'/'),sha(source)])),summary:{passed,failed,total:passed+failed},results,snapshots,classificationNotes:{confirmed:'Expected formal scorer / route-copy behavior fails on baseline.',missingContract:'Isolated declared extra advancement and explicit legacy insufficiency require a scorer contract; no invented actual retirement.',valid:'Existing legal action / same-state / ownership behavior stays true.'}};
  if(prior)evidence.initialHarnessCapture={...prior,classification:'TEST HARNESS ISSUE: initial own 3U route name was wrong; initial 363 receiver case did not reduce player return hands. Original output/source preserved; neither is a Production defect.'};
  fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');
}
if(failed)process.exitCode=1;
