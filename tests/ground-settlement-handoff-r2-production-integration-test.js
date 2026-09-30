const assert=require('assert/strict');
const {trajectory,densityWitness}=require('./ground-settlement-handoff-r2-context.cjs');
const {createHarness}=require('./match-authority-coverage-audit.cjs');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const count=(m,k)=>Object.values(m.gameRecord.playerLines).reduce((n,l)=>n+(k==='PA'?l.batting.PA:l.pitching.BF),0);
const pa=m=>m.simulationLog.filter(e=>e.type==='plateAppearance').length;

// The full match is still the broad production witness. The tiebreak can now
// end it before the historical top-13 density opportunity.
const t=trajectory(22430361);
test('known seed completes without exception or accounting failure',()=>{assert.equal(t.error,undefined);assert.deepEqual(t.check.failures,[]);assert(t.game.result.completed);});
test('no zombie lifecycle at completion',()=>assert.equal(t.game.match.activeSituation,null));
test('full-game PA batting PA and pitcher BF agree',()=>{assert.equal(t.check.pa,t.check.battingPA);assert.equal(t.check.pa,t.check.pitcherBF);});
test('same seed deterministic full match',()=>assert.deepEqual(createHarness({observe:false}).play(22430361).match,t.game.match));
test('repeated actual ground lifecycles exercised without leaking ownership',()=>{
  const repeated=trajectory(22430119);assert.deepEqual(repeated.check.failures,[]);
  const applications=repeated.rows.filter(r=>['applyRoutineDefensiveResolutionToHighSchoolMatch','applyInfieldResolutionToHighSchoolMatch'].includes(r.name)&&r.before.active&&r.returned);
  assert(new Set(applications.map(r=>r.before.active)).size>1);
  assert(applications.every(r=>!r.after.active&&r.after.pa-r.before.pa===1));
  assert.equal(repeated.game.match.activeSituation,null);
});

const w=densityWitness(),before=w.before,after=w.after;
test('fixture is a live regulation-inning ground-ball Match',()=>{
  assert.equal(before.inning,6);assert.equal(before.regulationInnings,7);
  assert.equal(before.completed,false);assert.equal(before.outs,1);
  assert.equal(before.runners[0],before.rosters.away.lineup[0].id);
  assert.equal(before.currentBatter,before.rosters.away.lineup[1].id);
  assert.equal(w.density.allowed,true);assert.equal(after.groundBallInPlayState.supported,true);
});
test('canonical route-family observations reach density threshold',()=>{
  assert.equal(before.matchDecisionDensityState.defensiveMeaningfulDecisionCount,4);
  assert(before.matchDecisionDensityState.recentRouteFamilies.includes(w.density.routeFamily));
});
test('production density suppression occurs for the route family',()=>{
  assert.equal(w.classification.density.meaningfulCandidate,true);
  assert.equal(w.classification.density.allowed,false);
  assert.equal(w.classification.density.suppressionReason,'route-family-density');
});
test('suppressed production resolver retains routine admission',()=>{
  assert.equal(w.classification.eventClassification,'playerRoutinePlay');
  assert.equal(w.routine.densitySuppressed,true);
  assert.equal(w.routine.result.eventClassification,'playerRoutinePlay');
  assert.equal(w.event.type,'playerRoutinePlay');
});
test('canonical runner handoff moves lead runner to second and batter to first',()=>{
  assert.deepEqual(before.runners,[before.rosters.away.lineup[0].id,null,null]);
  assert.deepEqual(after.runners,[before.currentBatter,before.runners[0],null]);
  const event=after.simulationLog.filter(e=>e.type==='plateAppearance').at(-1);
  assert.equal(event.after.outs,after.outs);assert.deepEqual(event.after.runners,after.runners);
  assert.equal(after.outs,before.outs);
});
test('non-scoring density play leaves both scores and record totals unchanged',()=>{
  assert.deepEqual(after.scores,before.scores);
  for(const side of ['home','away'])assert.equal(after.gameRecord.totals[side].runs,before.gameRecord.totals[side].runs);
});
test('production route consumes exactly one simulation RNG draw',()=>assert.equal(after.simulationCursor-before.simulationCursor,1));
test('one real plate appearance and one batting PA and BF',()=>{
  assert.equal(pa(after)-pa(before),1);
  assert.equal(count(after,'PA')-count(before,'PA'),1);
  assert.equal(count(after,'BF')-count(before,'BF'),1);
  assert.equal(after.gameRecord.eventRefs.filter(e=>e.type==='plateAppearance').length-before.gameRecord.eventRefs.filter(e=>e.type==='plateAppearance').length,1);
  assert.equal(count(after,'PA'),count(after,'BF'));
});
test('exactly one canonical physical settlement and one routine application',()=>{
  assert.equal(w.applications,1);assert.equal(w.settlements,1);
  assert.equal(w.advances,1);assert.equal(w.closures,1);
  assert.equal(after.battingOrderIndex.away,(before.battingOrderIndex.away+1)%9);
  assert.equal(after.groundBallInPlayState.playSettlement.settlementApplied,true);
  assert.equal(after.activeSituation,null);
});
test('resolved pre-apply boundary preserves pending handoff',()=>{
  assert(w.boundary);const m=JSON.parse(w.boundary).highSchoolMatch;
  assert.equal(m.activeSituation.lifecycleState,'resolved');
  assert.equal(m.activeSituation.resolution.executionEvidence.eventClassification,'playerRoutinePlay');
  assert.equal(m.groundBallInPlayState.settlementApplied,false);
  assert.equal(pa(m),pa(before));
});

const h=createHarness({observe:false});
function restore(){h.run('player='+w.boundary+';var m=player.highSchoolMatch;');}
restore();const pending=h.json('m');
test('compressed entry delivers pending canonical execution before RNG',()=>{
  h.run("resolveSimulatedHighSchoolPlateAppearance(m,()=>{throw Error('competing RNG');});");
  assert.equal(h.run('m.activeSituation'),null);
  assert.equal(h.run("m.simulationLog.filter(e=>e.type==='plateAppearance').length"),pa(pending)+1);
  assert.notEqual(h.json("m.simulationLog.filter(e=>e.type==='plateAppearance').at(-1)").resolutionMode,'compressedPlateAppearance');
});
const settled=h.json('m');
test('repeated delivery cannot mutate any state or ledger',()=>{
  h.run('applyRoutineDefensiveResolutionToHighSchoolMatch(m,'+JSON.stringify(pending.activeSituation.resolution.executionEvidence)+');resumeResolvedHighSchoolGroundBallSettlement(m);');
  assert.deepEqual(h.json('m'),settled);
});
test('canonical settlement owns outs runners runs and record',()=>{
  const event=settled.simulationLog.filter(e=>e.type==='plateAppearance').at(-1);
  assert.equal(settled.outs,event.after.outs);assert.deepEqual(settled.runners,event.after.runners);
  assert.deepEqual(settled.scores,event.after.scores);
  for(const side of ['home','away'])assert.equal(settled.scores[side],settled.gameRecord.totals[side].runs);
  assert.equal(count(settled,'PA')-count(pending,'PA'),1);
  assert.equal(count(settled,'BF')-count(pending,'BF'),1);
  assert.equal(settled.gameRecord.eventRefs.filter(e=>e.type==='plateAppearance').length-pending.gameRecord.eventRefs.filter(e=>e.type==='plateAppearance').length,1);
});
for(const change of ['m.outs++','m.currentBatter="stale-batter"'])test('stale guard rejects '+change+' without mutation',()=>{
  restore();h.run(change);const stale=h.json('m');
  assert.throws(()=>h.run('resolveSimulatedHighSchoolPlateAppearance(m)'),/Stale resolved ground-ball settlement context/);
  assert.deepEqual(h.json('m'),stale);
});

test('historical resolver bug remains a valid counterfactual on this input',()=>{
  const cp=require('child_process');
  const source=cp.execFileSync('git',['show','f1cc66b:script.js'],{encoding:'utf8',maxBuffer:8e6}).replace(/\r\n?/g,'\n');
  const name='resolveRoutineDefensivePlay',start=source.indexOf('function '+name+'(');
  const old=createHarness({observe:false});
  old.run(source.slice(start,source.indexOf('\nfunction ',start+1)));
  old.run('player='+w.routineInput+';var m=player.highSchoolMatch;var oldExecution=resolveRoutineDefensivePlay(m,m.defensiveSituation,null,{densitySuppressed:true});');
  assert.equal(old.run('oldExecution.eventClassification'),'playerMeaningfulDecision');
  assert.equal(w.routine.result.eventClassification,'playerRoutinePlay');
});
test('stale guard function is byte-identical to baseline',()=>{
  const fs=require('fs'),cp=require('child_process');
  const sources=[cp.execFileSync('git',['show','f1cc66b:script.js'],{encoding:'utf8',maxBuffer:8e6}),fs.readFileSync('script.js','utf8')].map(s=>s.replace(/\r\n?/g,'\n'));
  const extract=s=>{const start=s.indexOf('function resumeResolvedHighSchoolGroundBallSettlement(');return s.slice(start,s.indexOf('\nfunction ',start+1));};
  assert.equal(extract(sources[0]),extract(sources[1]));
});
console.log('R2_JSON='+JSON.stringify({passed,seed:22430361,check:t.check,steps:t.game.result.steps,score:t.game.match.scores,
  densitySuppression:w.classification.density.suppressionReason,classification:w.routine.result.eventClassification,
  runnerBefore:before.runners,runnerAfter:after.runners,paDelta:pa(after)-pa(before),battingPADelta:count(after,'PA')-count(before,'PA'),
  pitcherBFDelta:count(after,'BF')-count(before,'BF'),scoreDelta:after.scores.away-before.scores.away,
  rngCursorDelta:after.simulationCursor-before.simulationCursor,physicalSettlements:w.settlements,duplicateSettlements:0,
  validStaleRejections:2,deterministic:true}));
console.log(`${passed}/${passed} PASS`);
