"use strict";
const C=require('./critical-regression-triage-v0.1-capture.cjs');
function observation(label,tag) {
 const row=C.json(C.childPrefix+label+'-evidence.json');
 const line=row.stdout.split('\n').find(x=>x.startsWith(tag+'='));
 if(!line)return {status:row.status,missingObservation:true,spawnError:row.spawnError};
 return JSON.parse(line.slice(tag.length+1));
}
const count=xs=>xs.reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{});
if(process.argv[2]==='match') {
 const x=observation('match-isolated','TRIAGE_MATCH'),m=x.match,events=m.simulationLog;
 console.log(JSON.stringify({operands:{completed:x.completed,firstIdPresent:x.firstIdPresent,finalIdPresent:x.finalIdPresent,defenseMomentCount:x.defenseMomentCount,defensiveMeaningfulDecisionCount:x.defensiveMeaningfulDecisionCount,safety:x.safety,safetyBelow1400:x.safetyBelow1400},seed:x.seed,ids:x.ids,integrityIssues:x.integrityIssues,final:{inning:m.inning,half:m.half,outs:m.outs,scores:m.scores,cursor:m.simulationCursor,phase:m.simulationPhase},eventCounts:count(events.map(e=>e.type)),paResults:count(events.filter(e=>e.type==='plateAppearance').map(e=>e.result)),firstPA:events.find(e=>e.type==='plateAppearance'),lastPA:events.findLast(e=>e.type==='plateAppearance'),moments:m.completedMoments.map(v=>({id:v.id,domain:v.domain,inning:v.inning,half:v.half,decision:v.decision,outsCreated:v.outsCreated})),firstSteps:x.steps.slice(0,4)},null,2));
} else if(process.argv[2]==='match-state') {
 const x=observation('match-isolated','TRIAGE_MATCH'),m=x.match;
 console.log(JSON.stringify({groundBallInPlayState:m.groundBallInPlayState,defensiveSituation:m.defensiveSituation,density:m.matchDecisionDensityState,lastRoutine:m.simulationLog.findLast(e=>e.type==='playerRoutinePlay'),firstRoutine:m.simulationLog.find(e=>e.type==='playerRoutinePlay')},null,2));
} else if(process.argv[2]==='gradient') {
 const x=observation('gradient-compact-isolated','TRIAGE_GRADIENT');
 console.log(JSON.stringify({lowSummary:x.lowSummary,highSummary:x.highSummary,low:x.low.map(g=>({seed:g.seed,batting:g.line.batting,capabilities:g.capabilities,events:g.playerEvents.map(e=>({type:e.type,result:e.result,inning:e.inning,half:e.half,momentId:e.momentId,pa:e.offensivePlateAppearance}))})),high:x.high.map(g=>({seed:g.seed,batting:g.line.batting})),base:{name:x.base.name,id:x.base.highSchoolMatch.id,seed:x.base.highSchoolMatch.simulationSeed,role:x.base.highSchoolRoleCode,skills:x.base.baseballSkills,ballSense:x.base.ballSense,observe:x.base.observe,fitness:x.base.fitness,instinct:x.base.instinct,discipline:x.base.discipline}},null,2));
} else if(process.argv[2]==='manifests') {
 const fs=require('node:fs');
 const html=fs.readFileSync('index.html','utf8');const index=[...html.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]);
 for(const file of ['tests/high-school-year-one-opportunity-two-integration-test.js','tests/baseball-match-foundation-2-2-2-test.js']) {
 const s=fs.readFileSync(file,'utf8');const array=s.match(/const (?:runtimeFiles|files) = \[([\s\S]*?)\];/)[1];const manifest=[...array.matchAll(/"([^"]+\.js)"/g)].map(x=>x[1]);
 console.log(JSON.stringify({file,count:manifest.length,missingIndexModules:index.filter(x=>!manifest.includes(x)),manifest}));
 }
} else throw Error('Read-only inspection mode required');
module.exports={observation,count};
