"use strict";
const fs=require('node:fs'),C=require('./critical-regression-triage-v0.1-capture.cjs');
const count=xs=>xs.reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{});
function obs(label,tag) {const r=C.json(C.childPrefix+label+'-evidence.json');const line=r.stdout.split('\n').find(l=>l.startsWith(tag+'='));return line?JSON.parse(line.slice(tag.length+1)):null;}
function summarize(gs,s){return {games:gs.length,HHistogram:count(gs.map(g=>g.line.batting.H)),PAHistogram:count(gs.map(g=>g.line.batting.PA)),ABHistogram:count(gs.map(g=>g.line.batting.AB)),multiHitFraction:s.multiHitFraction,hitlessFraction:s.hitlessFraction,batting:s.line.batting,rates:s.rates,capabilities:s.capabilities,rows:gs.map(g=>({seed:g.seed,batting:g.line.batting,recordSha256:g.recordSha256,logSha256:g.logSha256})),playerPAResults:count(gs.flatMap(g=>g.playerEvents.filter(e=>e.type==='plateAppearance').map(e=>e.result)))};}
if(require.main===module) {
 const x=obs('gradient-compact-isolated','TRIAGE_GRADIENT');
 const data={cohort:{field:x.field,tiers:[8,16],declaredAuditTiers:x.tiers,seeds:x.seeds,baseSha256:C.hash(JSON.stringify(x.base)),base:x.base},low:summarize(x.low,x.lowSummary),high:summarize(x.high,x.highSummary),originalAssertions:{low:'multiHitFraction>0',high:'hitlessFraction>0'},originalHighAssertionReached:false,observedHighBoolean:x.highSummary.hitlessFraction>0};
 if(process.argv[2]==='capture'){C.integrity();C.capture('gradient-distribution',data);}
 console.log(JSON.stringify({...data,cohort:{...data.cohort,base:undefined},low:{...data.low,rows:data.low.rows.map(r=>({seed:r.seed,PA:r.batting.PA,AB:r.batting.AB,H:r.batting.H}))},high:{...data.high,rows:data.high.rows.map(r=>({seed:r.seed,PA:r.batting.PA,AB:r.batting.AB,H:r.batting.H}))}},null,2));
}
module.exports={obs,count,summarize};
