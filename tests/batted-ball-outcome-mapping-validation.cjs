// Post-construction measurements. Historical committed audit artifacts are read-only.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const A=require('./ability-performance-observability-extension.cjs'),Core=require('./ability-performance-correlation-audit.cjs');
const historical=require('../docs/ability-performance-correlation-audit-results-v1.1.json');
function fullGameHarness(){
  const h=Core.createHarness('游擊手');
  const original=h.ctx.run('auditPlay.toString()');
  const updated=original.replace('getHighSchoolYearOneMatchMomentChoices(match)[0]','(getHighSchoolYearOneMatchMomentChoices(match)[2] || getHighSchoolYearOneMatchMomentChoices(match)[0])');
  assert.notEqual(updated,original);h.ctx.run(updated);return h;
}
function run(){
  const results={baseline:'36b093f',scope:'1000 unique standalone PA per tier per axis; separate full-game sanity. No calibration.',axes:{}};
  for(const axis of ['power','contact','recognition']){
    const audit=A.battingAudit(axis,1000);
    const old=historical.audits.find(a=>a.capability===axis);
    results.axes[axis]=audit.tiers.map((t,i)=>{
      assert.deepEqual(t.physicalEvidence,old.tiers[i].physicalEvidence,'Upstream physical generation changed');
      assert.deepEqual(t.decisionEvidence,old.tiers[i].decisionEvidence,'Recognition / pitch decision changed');
      return {tier:t.ability,stats:t.line.batting,XBH:t.line.batting.doubles+t.line.batting.triples+t.line.batting.HR,TB:t.line.batting.H+t.line.batting.doubles+2*t.line.batting.triples+3*t.line.batting.HR,rates:t.rates,physical:t.physicalEvidence,decisions:t.decisionEvidence,independence:t.independence,blocks:t.blocks.map(b=>({sample:b.games,batting:b.line.batting,rates:{AVG:b.rates.AVG,SO:b.rates.SO,BB:b.rates.BB,XBH:b.rates.XBH,TB:b.rates.TB}}))};
    });
  }
  const power=results.axes.power,contact=results.axes.contact;
  assert(power.at(-1).XBH>power[0].XBH&&power.at(-1).TB>power[0].TB,'Power physical signal must reach XBH and TB');
  assert(contact.at(-1).rates.AVG>contact[0].rates.AVG&&contact.at(-1).rates.SO<contact[0].rates.SO,'Contact gradient reversed');
  const field=A.defenseAudit('fielding',1000),oldField=historical.audits.find(a=>a.capability==='fielding');
  results.fielding=field.buckets.map((b,i)=>{assert.deepEqual(b.tiers.map(t=>t.mean),oldField.buckets[i].tiers.map(t=>t.mean),'Defensive conversion changed');return {bucket:b.bucket,tiers:b.tiers.map(t=>({tier:t.ability,opportunities:t.sample,conversion:t.mean}))};});
  const h=fullGameHarness(),games=[];
  for(let seed=1;seed<=20;seed++){const g=h.play('baseballSkills.batting',12,seed);games.push(g);}
  const totals=Core.aggregate(games),events=games.flatMap(g=>g.log),physicalEvents=events.filter(e=>e.type==='plateAppearance'&&e.officialBallInPlayOutcome?.authority==='physicalOutcomeMappingV1');
  const counts=physicalEvents.reduce((a,e)=>(a[e.result]=(a[e.result]||0)+1,a),{});
  assert(physicalEvents.length>0,'Full matches must exercise official mapper');
  const allCounts=events.filter(e=>e.type==='plateAppearance').reduce((a,e)=>(a[e.result]=(a[e.result]||0)+1,a),{});
  assert(allCounts.out>0&&allCounts.single>0,'Full-game outcomes degenerate');
  assert(counts.single>0,'Mapped full-game contacts must not all be extra-base hits');
  results.fullGameSanity={completed:games.length,physicalPA:physicalEvents.length,physicalOutcomes:counts,allPAOutcomes:allCounts,playerTotals:totals,scope:'20 complete SS games, third legal choice with first-choice fallback policy, at fixed routing identities with independent native simulation seeds. Sanity only, not a Power-effect estimate; 1400-game regression is separate.'};
  results.assertions={physicalUnchanged:true,recognitionUnchanged:true,contactGradient:true,powerMediation:true,fieldingUnchanged:true};
  return results;
}
module.exports={run,fullGameHarness};
if(require.main===module){const result=run();fs.writeFileSync(path.join(__dirname,'../docs/batted-ball-outcome-mapping-validation.json'),JSON.stringify(result,null,2)+'\n');console.log('Post-construction mapping validation PASS');}
