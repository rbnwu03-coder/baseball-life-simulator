const assert=require('assert/strict');
const Audit=require('./match-simulation-outcome-mapping-audit.cjs');
const historical=require('../docs/match-simulation-outcome-mapping-audit-results.json');
assert.equal(historical.paths.find(p=>p.id==='control').classification,'MISSING_INPUT_PATH');
assert.equal(historical.paths.find(p=>p.id==='strikeout').classification,'OUTCOME_SPACE_GAP');
assert(!historical.ordinary.outcomes.includes('strikeout'));
const result=Audit.run({expectedResolved:true});
let passed=0;
function test(name,fn){fn();passed++;console.log(`PASS ${passed}. ${name}`);}
test('Power changes physical pace and depth',()=>{
  assert(new Set(result.power.rows.map(r=>r.physical.pace)).size>1);
  assert(new Set(result.power.rows.map(r=>r.physical.depth)).size>1);
});
test('Historical legacy signal loss retained; normal route now uses physical mapper',()=>{
  assert.equal(new Set(result.power.rows.map(r=>r.physical.executionEvidence.continuousContactScore)).size,1);
  assert.equal(new Set(result.power.rows.map(r=>JSON.stringify(r.mapping))).size,1);
  assert.notEqual(result.power.reverse[0].result,result.power.reverse[1].result);
  assert(result.power.rows.every(r=>r.currentMapping.authority==='physicalOutcomeMappingV1'));
});
test('Mapper consumers explicitly captured and guarded against source drift',()=>{
  const body=Audit.section('offensive-plate-approach.js','resolveLegacyBallInPlayOutcome');
  assert(body.includes('physicalTruth?.executionEvidence?.continuousContactScore'));
  assert(!/physicalTruth\??\.(pace|depth|ballType|direction)\b/.test(body));
  assert(!body.includes('abilities.power'));
  for(const token of ['abilities.batting','abilities.ballSense','pitch.attackability','recognition.correct','state.swingIntent','outcomeRoll'])assert(body.includes(token));
});
test('GameRecord preserves HR and extra-base hits, TB audit equals ten',()=>{
  const b=result.ledger.batting;assert.deepEqual([b.H,b.doubles,b.triples,b.HR,result.ledger.totalBases],[4,1,1,1,10]);
});
test('Interactive Control changes realized zone with identical intended class',()=>{
  const rows=result.interactive.control.rows;
  assert.equal(new Set(rows.map(r=>r.pitch.intendedPitchClass)).size,1);
  assert.equal(new Set(rows.map(r=>r.pitch.strike)).size,2);
  assert.equal(result.interactive.walk.result,'walk');
});
test('Ordinary AI BB input trace matches untouched resolver deterministically',()=>{
  assert.equal(result.ordinary.comparisonCount,160);
  for(const t of result.ordinary.tiers)assert(t.genericScoreIdentical);
  assert(result.ordinary.outcomeLine.includes('adjusted < walkUpper ? "walk"'));
});
test('Control isolated at real roster input without unrelated capability changes',()=>{
  assert(result.ordinary.capabilityInputUnchanged);
  assert.deepEqual(result.ordinary.tiers.map(t=>t.control),[8,10,12,14,16]);
  assert.deepEqual(result.ordinary.tiers.map(t=>t.rosterControl),[4,5,6,7,8]);
  const defense=Audit.section('script.js','getDefensiveSimulationCapability');
  assert(defense.includes('decision: Math.round((subject.defense + subject.contact) / 2)'));
});
test('All ordinary terminal outcomes are captured from current production source',()=>{
  assert.deepEqual(result.ordinary.outcomes,['out','productiveOut','walk','single','double','triple','homeRun','strikeout']);
  assert(result.ordinary.source.sourceHash);
});
test('Interactive strikeout terminates on real third strike',()=>{
  assert.equal(result.interactive.strikeout.result,'strikeout');assert.equal(result.interactive.strikeout.strikes,3);
  assert.equal(result.interactive.strikeout.pitches.at(-1),'calledStrike');
});
test('Ordinary AI has SO while aggregate pitching remains connected',()=>{
  assert(result.ordinary.outcomes.includes('strikeout'));
  const body=Audit.section('script.js','resolveSimulatedHighSchoolPlateAppearance');
  assert(body.includes('pitchingProfile?.control'));assert(!/\b(stuff|PitchSequencing)\b/.test(body));
  assert(result.ordinary.quality[1].trace.pitcherPressure>result.ordinary.quality[0].trace.pitcherPressure);
});
test('GameRecord credits batter and active pitcher SO and BB',()=>{
  assert.deepEqual([result.ledger.batting.SO,result.ledger.pitching.SO,result.ledger.batting.BB,result.ledger.pitching.BB],[1,1,1,1]);
});
test('CompetitionEvidence retains canonical BB/SO/HR without aggregation loss',()=>{
  for(const e of result.ledger.evidence)assert.deepEqual([e.stats.BB,e.stats.SO,e.stats.HR],[1,1,1]);
  assert.deepEqual(result.ledger.evidence.map(e=>e.sample.count),[6,6]);
});
test('Outcome parity matrix includes statistical and physical boundaries',()=>{
  assert.equal(result.sharedOutcomeMatrix.length,10);
  assert.equal(result.sharedOutcomeMatrix.find(r=>r.outcome==='strikeout').ordinaryAI,true);
  assert.equal(result.sharedOutcomeMatrix.find(r=>r.outcome==='homeRun').ordinaryAI,true);
});
test('Instrumentation preserves native RNG sequence and resolved outcome',()=>assert(result.ordinary.nativeRngCursorParity));
test('Original fixtures and pure inputs remain unchanged; ledger integrity holds',()=>{
  assert(result.power.inputsUnchanged);assert(result.ordinary.baseFixtureUnchanged);assert(result.ledger.integrity);
});
console.log(`Outcome Mapping Audit: ${passed}/15 PASS`);
