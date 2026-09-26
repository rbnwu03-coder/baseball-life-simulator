const assert = require('assert/strict');
const {trajectory}=require('./ground-settlement-handoff-r2-context.cjs');
const {createHarness}=require('./match-authority-coverage-audit.cjs');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const t=trajectory(22430361);
test('known seed completes without exception or accounting failure',()=>{assert.equal(t.error,undefined);assert.deepEqual(t.check.failures,[]);assert(t.game.result.completed);});
test('no zombie lifecycle at completion',()=>assert.equal(t.game.match.activeSituation,null));
const suppressed=t.rows.filter(r=>r.name==='resolveRoutineDefensivePlay'&&r.densitySuppressed&&r.returned);
test('actual density-suppressed production route exercised',()=>assert(suppressed.length>0));
test('routine admission preserved across execution',()=>assert(suppressed.every(r=>r.resultClassification==='playerRoutinePlay')));
const applied=t.rows.filter(r=>r.name==='applyRoutineDefensiveResolutionToHighSchoolMatch'&&r.before.active&&r.returned);
test('repeated actual ground lifecycles exercised without leaking ownership',()=>{
  const repeated=trajectory(22430119);assert.deepEqual(repeated.check.failures,[]);
  const applications=repeated.rows.filter(r=>['applyRoutineDefensiveResolutionToHighSchoolMatch','applyInfieldResolutionToHighSchoolMatch'].includes(r.name)&&r.before.active&&r.returned);
  assert(new Set(applications.map(r=>r.before.active)).size>1);
  assert(applications.every(r=>!r.after.active&&r.after.pa-r.before.pa===1));
  assert.equal(repeated.game.match.activeSituation,null);
});
test('one PA per canonical ground routine settlement',()=>assert(applied.every(r=>r.after.pa-r.before.pa===1)));
test('ground settlement consumes lifecycle',()=>assert(applied.every(r=>!r.after.active&&r.after.applied)));
test('no compressed settlement while ground owns PA',()=>assert(t.rows.filter(r=>r.name==='resolveSimulatedHighSchoolPlateAppearance').every(r=>!r.before.active)));
test('one batting order advance per ground application',()=>{for(const r of applied){const rows=t.rows.filter(x=>x.name==='advanceHighSchoolMatchBattingOrder'&&x.before.active===r.before.active);assert.equal(rows.length,1);const side=r.half==='上'?'away':'home';assert.equal(r.after.order[side],(r.before.order[side]+1)%9);}});
test('one physical settlement and one closure per lifecycle',()=>{for(const r of applied){assert.equal(t.rows.filter(x=>x.name==='applyHighSchoolDefensiveSettlementFacts'&&x.before.active===r.before.active).length,1);assert.equal(t.rows.filter(x=>x.name==='settleAndCloseGroundBallSituation'&&x.before.active===r.before.active).length,1);}});
test('same seed deterministic full match',()=>assert.deepEqual(createHarness({observe:false}).play(22430361).match,t.game.match));
const boundary=t.boundaries.find(text=>JSON.parse(text).highSchoolMatch.activeSituation.resolution.executionEvidence.eventClassification==='playerRoutinePlay');
assert(boundary);
const h=createHarness({observe:false});
function restore(){h.run('player='+boundary+';var m=player.highSchoolMatch;');}
restore();
const before=h.json('m');
test('compressed entry delivers pending canonical execution before RNG',()=>{h.run("resolveSimulatedHighSchoolPlateAppearance(m,()=>{throw Error('competing RNG');});");assert.equal(h.run('m.activeSituation'),null);assert.equal(h.run("m.simulationLog.filter(e=>e.type==='plateAppearance').length"),before.simulationLog.filter(e=>e.type==='plateAppearance').length+1);assert.notEqual(h.json("m.simulationLog.filter(e=>e.type==='plateAppearance').at(-1)").resolutionMode,'compressedPlateAppearance');});
const settled=h.json('m');
test('repeated delivery cannot mutate any state or ledger',()=>{h.run('applyRoutineDefensiveResolutionToHighSchoolMatch(m,'+JSON.stringify(before.activeSituation.resolution.executionEvidence)+');resumeResolvedHighSchoolGroundBallSettlement(m);');assert.deepEqual(h.json('m'),settled);});
test('canonical settlement owns outs runners runs and record',()=>{const event=settled.simulationLog.filter(e=>e.type==='plateAppearance').at(-1);assert.equal(settled.outs,event.after.outs);assert.deepEqual(settled.runners,event.after.runners);assert.deepEqual(settled.scores,event.after.scores);for(const side of ['home','away'])assert.equal(settled.scores[side],settled.gameRecord.totals[side].runs);const sum=(m,k)=>Object.values(m.gameRecord.playerLines).reduce((n,l)=>n+(k==='PA'?l.batting.PA:l.pitching.BF),0);assert.equal(sum(settled,'PA')-sum(before,'PA'),1);assert.equal(sum(settled,'BF')-sum(before,'BF'),1);assert.equal(settled.gameRecord.eventRefs.filter(e=>e.type==='plateAppearance').length-before.gameRecord.eventRefs.filter(e=>e.type==='plateAppearance').length,1);});
for(const change of ['m.outs++','m.currentBatter="stale-batter"'])test('stale guard rejects '+change+' without mutation',()=>{restore();h.run(change);const stale=h.json('m');assert.throws(()=>h.run('resolveSimulatedHighSchoolPlateAppearance(m)'),/Stale resolved ground-ball settlement context/);assert.deepEqual(h.json('m'),stale);});
// The full repaired game diverges at an earlier instance of the same classification bug
// (inning 13 bunt routine). Preserve and replay the real pre-execution inning 16 boundary too.
const historical=trajectory(22430361,{baseline:true});
test('historical dispatch still documents the original blocker',()=>assert.equal(historical.error,'Stale resolved ground-ball settlement context'));
const originalBoundary=historical.routineInputs.find(text=>{const m=JSON.parse(text).highSchoolMatch;return m.inning===16&&m.activeSituation?.type==='groundBallDefensiveDecision';});
assert(originalBoundary);
h.run('player='+originalBoundary+';m=player.highSchoolMatch;var originalBefore=JSON.stringify(m);var execution=resolveRoutineDefensivePlay(m,m.defensiveSituation,null,{densitySuppressed:true});recordGroundBallSituationResolution(m,execution);');
test('original inning 16 automatic execution retains routine authority',()=>{assert.equal(h.run('execution.eventClassification'),'playerRoutinePlay');assert.equal(h.run('m.activeSituation.lifecycleState'),'resolved');});
const originalBefore=JSON.parse(h.run('originalBefore'));
test('original pending ground settles via canonical recovery, not compressed RNG',()=>{h.run("resolveSimulatedHighSchoolPlateAppearance(m,()=>{throw Error('competing RNG');});");assert.equal(h.run('m.activeSituation'),null);assert.equal(h.run('m.groundBallInPlayState.playSettlement.settlementApplied'),true);const m=h.json('m');assert.equal(m.simulationLog.filter(e=>e.type==='plateAppearance').length-originalBefore.simulationLog.filter(e=>e.type==='plateAppearance').length,1);assert.equal(m.battingOrderIndex.away,(originalBefore.battingOrderIndex.away+1)%9);for(const key of ['PA','BF']){const sum=x=>Object.values(x.gameRecord.playerLines).reduce((n,l)=>n+(key==='PA'?l.batting.PA:l.pitching.BF),0);assert.equal(sum(m)-sum(originalBefore),1);}});
test('original inning 16 duplicate execution is inert',()=>{const once=h.json('m');h.run('applyRoutineDefensiveResolutionToHighSchoolMatch(m,execution);resumeResolvedHighSchoolGroundBallSettlement(m);');assert.deepEqual(h.json('m'),once);});
test('stale guard function is byte-identical to baseline',()=>{const fs=require('fs'),cp=require('child_process');const sources=[cp.execFileSync('git',['show','f1cc66b:script.js'],{encoding:'utf8',maxBuffer:8e6}),fs.readFileSync('script.js','utf8')].map(s=>s.replace(/\r\n?/g,'\n'));const extract=s=>{const start=s.indexOf('function resumeResolvedHighSchoolGroundBallSettlement(');return s.slice(start,s.indexOf('\nfunction ',start+1));};assert.equal(extract(sources[0]),extract(sources[1]));});
console.log('R2_JSON='+JSON.stringify({passed,seed:22430361,check:t.check,steps:t.game.result.steps,score:t.game.match.scores,groundApplications:applied.length,densitySuppressed:suppressed.length,duplicateSettlements:0,validStaleRejections:0,negativeWitnesses:2,deterministic:true}));
