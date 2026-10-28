"use strict";
const C=require('./critical-regression-triage-v0.1-capture.cjs'),{obs,count}=require('./critical-regression-triage-v0.1-statistics.cjs');
const x=obs('gradient-rng-isolated','TRIAGE_RNG'),g=x.games.slice(-40);
const data={lastPAActionCounts:count(g.flatMap(r=>(r.lastPA?.pitchHistory||[]).map(p=>p.action))),lastPAPitchResults:count(g.flatMap(r=>(r.lastPA?.pitchHistory||[]).map(p=>p.pitchResult))),lastPAApproaches:count(g.map(r=>r.lastPA?.approach)),lastPANumbers:count(g.map(r=>r.lastPA?.pitchNumber)),example:g.find(r=>r.seed===1&&r.value===8)?.lastPA?.pitchHistory.map(p=>({action:p.action,routeId:p.routeId,pitchResult:p.pitchResult,countAfter:p.countAfter,pitchLocationClass:p.pitch?.pitchLocationClass}))};
if(process.argv[2]==='capture'){C.integrity();C.capture('gradient-policy',data);}console.log(JSON.stringify(data,null,2));
