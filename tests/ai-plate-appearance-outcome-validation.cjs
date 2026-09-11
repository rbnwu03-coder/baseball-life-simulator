/* Paired diagnostic scalar experiments, not league calibration. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const AI=require('../ai-plate-appearance-outcome.js'),Record=require('../match-game-record.js'),Core=require('./ability-performance-correlation-audit.cjs');
const tiers=[8,10,12,14,16],clone=x=>JSON.parse(JSON.stringify(x));
function experiment(axis,tier,count=4000){
 const rosters={home:{lineup:[{id:'b',defensivePosition:'SS'}]},away:{lineup:[{id:'p',defensivePosition:'P'}]}};
 const record=Record.createGameRecord({gameId:`ai-isolation-${axis}`,homeTeamId:'h',awayTeamId:'a',rosters});
 const blocks=Array.from({length:10},()=>({BF:0,BB:0,SO:0,H:0,HR:0})),ids=new Set(),counts={},candidates={};
 for(let n=0;n<count;n++){
  const input={identity:`ai-isolation-${axis}|pa-${n}|b|p`,sample:((n*613+173)%4001)/4001,batter:{contact:12,power:8,discipline:12},pitcher:{pitchingQuality:12,decision:8,control:12},context:{outs:0,hasRunner:false,offenseTrailing:false}};
  if(axis==='control')input.pitcher.control=tier;else if(axis==='quality')input.pitcher.pitchingQuality=tier;else input.batter[axis]=tier;
  const before=JSON.stringify(input),r=AI.resolveCompressedPlateAppearanceOutcome(input);assert.equal(before,JSON.stringify(input));assert.deepEqual(r,AI.resolveCompressedPlateAppearanceOutcome(clone(input)));assert(!ids.has(input.identity));ids.add(input.identity);
  if(r.result==='strikeout')assert.equal(r.trace.preStrikeoutResult,'out');else if(r.trace.preStrikeoutResult!=='out')assert.equal(r.result,r.trace.preStrikeoutResult);
  counts[r.result]=(counts[r.result]||0)+1;candidates[r.trace.preStrikeoutResult]=(candidates[r.trace.preStrikeoutResult]||0)+1;
  const b=blocks[Math.floor(n/(count/10))];b.BF++;b.BB+=r.result==='walk';b.SO+=r.result==='strikeout';b.H+=['single','double','triple','homeRun'].includes(r.result);b.HR+=r.result==='homeRun';
  Record.recordEvent(record,{eventId:input.identity,sequence:n+1,type:'plateAppearance',inning:1,half:'下',offenseTeam:'home',batterId:'b',result:r.result,before:{outs:0},after:{outs:['out','productiveOut','strikeout'].includes(r.result)?1:0}},{rosters});
 }
 Record.assertIntegrity(record);const p=record.playerLines.p.pitching,b=record.playerLines.b.batting;assert.equal(p.BF,count);assert.equal(b.PA,count);assert.equal(p.SO,counts.strikeout);assert.equal(p.BB,counts.walk);
 return {tier,uniquePA:ids.size,counts,candidates,batting:b,pitching:p,rates:{BB:p.BB/p.BF,SO:p.SO/p.BF,H:p.H/p.BF,HR:p.HR/p.BF},blocks:blocks.map(b=>({...b,BBRate:b.BB/b.BF,SORate:b.SO/b.BF}))};
}
function fullGames(){const h=Core.createHarness('投手'),original=h.base.highSchoolMatch.id,slot=h.base.highSchoolMatch.rosters.home.lineup.findIndex(p=>p.defensivePosition==='P'),id=h.base.highSchoolMatch.rosters.home.lineup[slot].id,rows=[];
 for(const quality of [4,5,6,7,8]){const games=[],identities=new Set(),eventIds=new Set();for(let seed=1;seed<=20;seed++){
  h.base.highSchoolMatch.id=original+'|ai-full-'+seed;h.base.highSchoolMatch.gameRecord.gameId=h.base.highSchoolMatch.id;
  const g=h.play(`highSchoolMatch.rosters.home.lineup.${slot}.pitching`,quality,seed,id),events=g.log.filter(e=>e.type==='plateAppearance');
  assert.equal(h.ctx.json('player.highSchoolMatch.simulationCursor')-(h.base.highSchoolMatch.simulationCursor||0),events.length);
  for(const e of events){assert(e.compressedOutcomeTrace);assert(!identities.has(e.compressedOutcomeTrace.identity));identities.add(e.compressedOutcomeTrace.identity);if(e.offenseTeam==='away'){const ref=g.record.eventRefs.find(r=>r.sequence===e.sequence&&r.type===e.type);assert(ref);assert(!eventIds.has(ref.eventId));eventIds.add(ref.eventId);}}
  games.push(g);
  if(seed===1){const neutral=h.play(`highSchoolMatch.rosters.home.lineup.${slot}.pitching`,quality,seed,id,false);assert.deepEqual(g.record,neutral.record);assert.deepEqual(g.log,neutral.log);}
 }
 const line=Core.aggregate(games),rates=Core.rates(line);assert.equal(eventIds.size,line.pitching.BF);assert(new Set(games.map(g=>g.record.gameId)).size===20);
 rows.push({quality,games:20,uniqueGameIds:20,uniqueBFEvents:eventIds.size,uniqueAllPA:identities.size,pitching:line.pitching,rates,perGame:games.map(g=>({gameId:g.record.gameId,BF:g.line.pitching.BF,BB:g.line.pitching.BB,SO:g.line.pitching.SO,H:g.line.pitching.H,ER:g.line.pitching.ER,outs:g.line.pitching.outsRecorded}))});}
 assert(rows.at(-1).rates.pitcherH<rows[0].rates.pitcherH,'H/BF gradient lost');assert(rows.at(-1).rates.ER27<rows[0].rates.ER27,'ER27 gradient lost');assert(rows.at(-1).rates.pitcherSO>rows[0].rates.pitcherSO,'SO full-game gradient lost');
 for(const row of rows){assert(new Set(row.perGame.map(g=>g.SO)).size>1);assert(new Set(row.perGame.map(g=>g.BB)).size>1);}
 return rows;
}
function run(){const r={baseline:'caf2199',authority:AI.AUTHORITY,calibrated:false,scope:'4000 unique PA per tier, 10 blocks; same IDs and samples paired within each axis. Raw synthetic scalar tiers 8–16; generated roster native quality 4–8 for full-game confirmation. No rescaling of the existing compressed formula.',axes:{}};
 for(const axis of ['control','quality','contact','discipline']){r.axes[axis]=tiers.map(t=>experiment(axis,t));const rows=r.axes[axis],metric=['control','discipline'].includes(axis)?'BB':'SO',direction=['control','contact'].includes(axis)?-1:1;assert(direction*(rows.at(-1).rates[metric]-rows[0].rates[metric])>0,axis+' direction');for(const row of rows){assert(row.rates[metric]>0&&row.rates[metric]<1);assert(new Set(row.blocks.map(b=>b[metric+'Rate'])).size>1,'block variance');}console.log('Isolated '+axis+' PASS '+rows.map(t=>t.rates[metric].toFixed(5)).join('/'));}
 for(const row of r.axes.control){assert.equal(row.pitching.H,r.axes.control[0].pitching.H);assert.equal(row.pitching.HR,r.axes.control[0].pitching.HR);assert.equal(row.pitching.SO,r.axes.control[0].pitching.SO);}
 r.fullGames=fullGames();console.log('100 completed paired full games PASS (20 distinct game IDs per tier)');
 const mapping=require('./batted-ball-outcome-mapping-validation.cjs').run();r.protectedMapping={assertions:mapping.assertions,axes:Object.fromEntries(Object.entries(mapping.axes).map(([k,rows])=>[k,rows.map(t=>({tier:t.tier,rates:t.rates,XBH:t.XBH,TB:t.TB}))])),fielding:mapping.fielding,fullGameSanity:mapping.fullGameSanity};
 const A=require('./ability-performance-observability-extension.cjs'),speed=A.defenseAudit('speed',1000),historical=require('../docs/ability-performance-correlation-audit-results-v1.1.json').audits.find(a=>a.capability==='speed');
 function assertHistoricalFields(actual,old){if(old&&typeof old==='object'){assert.equal(Array.isArray(actual),Array.isArray(old));if(Array.isArray(old))assert.equal(actual.length,old.length);for(const key of Object.keys(old))assertHistoricalFields(actual[key],old[key]);}else assert.deepEqual(actual,old);}assertHistoricalFields(speed,historical);r.speed={unchanged:true,buckets:speed.buckets.map(b=>({bucket:b.bucket,tiers:b.tiers.map(t=>({tier:t.ability,mean:t.mean}))}))};
 r.invariants={controlHitAndSOUnchanged:true,plainOutOnly:true,uniqueIdentities:true,nativeCursorOnePerPA:true,instrumentationNeutral:true,deterministic:true,historyUntouched:true};return r;
}
module.exports={run,experiment,fullGames};
if(require.main===module){const r=run();fs.writeFileSync(path.join(__dirname,'../docs/ai-plate-appearance-outcome-validation.json'),JSON.stringify(r,null,2)+'\n');console.log('AI outcome validation PASS');}
