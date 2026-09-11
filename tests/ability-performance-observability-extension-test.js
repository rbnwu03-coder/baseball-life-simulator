const assert=require('assert/strict');
const A=require('./ability-performance-observability-extension.cjs');
const Core=require('./ability-performance-correlation-audit.cjs');
let passed=0;
function test(name,fn){fn();passed++;console.log(`PASS ${name}`);}
test('only requested capability changes; Contact and Power independently controlled',()=>{
  for(const axis of ['contact','power','recognition']){
    const a=A.abilityView(axis,8),b=A.abilityView(axis,16);
    assert.equal(Object.keys(a).filter(k=>a[k]!==b[k]).length,1);
    if(axis==='contact')assert.equal(a.power,b.power);
    if(axis==='power')assert.equal(a.batting,b.batting);
  }
});
test('unique opportunities and settled pitch identities, no event replay',()=>{
  const samples=Array.from({length:30},(_,i)=>A.battingOpportunity('contact',8,i+1));
  assert.equal(A.independence(samples).uniqueEvents,30);
  assert.throws(()=>A.independence([samples[0],samples[0]]),/reused|replay/);
  for(const s of samples)assert.equal(s.record.playerLines.player.batting.PA,1);
});
test('deterministic repeat is explicit and paired environment is consistent',()=>{
  const a=A.battingOpportunity('contact',8,19),b=A.battingOpportunity('contact',16,19);
  assert.deepEqual(a,A.battingOpportunity('contact',8,19));
  const reference=require('../offensive-plate-approach.js').simulatePlateAppearance({paIdentity:a.paId,batterId:'player',approach:'balancedAttack',abilities:a.abilities,context:{outs:0,hasRunner:false}});
  assert.deepEqual(a.state,reference,'Instrumentation must preserve the untouched resolver result');
  assert.equal(a.paId,b.paId);assert.equal(a.gameId,b.gameId);assert.equal(a.abilities.power,b.abilities.power);
  assert.deepEqual(a.state.pitchHistory[0].pitch,b.state.pitchHistory[0].pitch);
});
test('defensive buckets use canonical physical difficulty; SS and non-target inputs fixed',()=>{
  const buckets=['ROUTINE','MODERATE','DIFFICULT'].map(b=>A.defensiveInput(b,1,8));
  assert(buckets[0].secureResult.secureDemand<buckets[1].secureResult.secureDemand);
  assert(buckets[1].secureResult.secureDemand<buckets[2].secureResult.secureDemand);
  const high=A.defensiveInput('DIFFICULT',1,16);
  assert.deepEqual(buckets[2].reachResult,high.reachResult);
  assert.equal(buckets[2].capabilities.catching,high.capabilities.catching);
});
test('difficult fielding no longer globally saturated',()=>{
  const low=[],high=[];
  for(let seed=1;seed<=100;seed++){low.push(A.defensiveSample('fielding',8,'DIFFICULT',seed));high.push(A.defensiveSample('fielding',16,'DIFFICULT',seed));}
  const l=low.filter(s=>s.success).length,h=high.filter(s=>s.success).length;
  assert(h>l);assert(h<100);assert(h>0);
});
test('arm tiers preserve fielding acquisition and speed',()=>{
  const a=A.defensiveSample('arm',8,'MODERATE',1),b=A.defensiveSample('arm',16,'MODERATE',1);
  assert.deepEqual(a.capabilities,b.capabilities);assert.equal(a.secureId,b.secureId);assert.equal(a.speed,b.speed);
});
test('speed samples are legal force advancement attempts, never fabricated steals',()=>{
  let attempts=0;
  for(let seed=1;seed<=60;seed++){const s=A.defensiveSample('speed',12,'MODERATE',seed);if(s.attempted){attempts++;assert(['out','safe','unresolved'].includes(s.runnerResult));}}
  assert(attempts>0);assert.equal(A.structural().steal.attempts,null);
});
test('canonical projection aggregation never depends on decision counts',()=>{
  const s=A.battingOpportunity('power',12,1),before=JSON.stringify(s.record);
  assert.deepEqual(Core.aggregate([s]),Core.aggregate([{...s,decisions:Array(999).fill({})}]));
  assert.equal(JSON.stringify(s.record),before);
});
test('player pitcher exposure blocker retained and historical AI gaps resolved',()=>{
  const historical=require('../docs/ability-performance-correlation-audit-results-v1.1.json');assert.equal(historical.structural.control.controlRead,false);assert.equal(historical.structural.strikeout.verdict,'OUTCOME_SPACE_GAP');assert(!historical.structural.strikeout.observedOutcomeSpace.includes('strikeout'));
  const s=A.structural();assert.equal(s.playerPitcher.playerBF,0);assert.notEqual(s.playerPitcher.assignment,'player');
  assert.equal(s.playerPitcher.verdict,'BLOCKED_BY_EXPOSURE');assert.equal(s.strikeout.verdict,'OBSERVABLE');
  assert(s.strikeout.observedOutcomeSpace.includes('walk'));assert(s.strikeout.observedOutcomeSpace.includes('strikeout'));
  assert.equal(s.control.walkExists,true);assert.equal(s.control.controlRead,true);
});
console.log(`Observability extension: ${passed}/${passed} PASS`);
