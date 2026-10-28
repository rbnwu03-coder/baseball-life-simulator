"use strict";
// Exact derived copies: original assertions, fixtures, seeds and decisions remain intact.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./critical-regression-triage-v0.1-capture.cjs');
function derive(label,original,edits) {
  C.integrity(); const raw=fs.readFileSync(path.join(C.root,original),'utf8'); let text=raw;
  for(const e of edits) {assert.equal(text.split(e.before).length-1,1,'Unique diagnostic anchor: '+label);text=text.replace(e.before,e.after);}
  let reversed=text;for(const e of [...edits].reverse()){assert.equal(reversed.split(e.after).length-1,1);reversed=reversed.replace(e.after,e.before);}
  assert.equal(reversed,raw,'Exact reverse to original');
  const file=C.prefix+label+'-isolated.cjs';assert(!fs.existsSync(path.join(C.root,file)));
  fs.writeFileSync(path.join(C.root,file),text,{flag:'wx'});
  return {file,original,originalSha256:C.fileHash(original),derivedSha256:C.fileHash(file),exactReverse:true,edits};
}
function build() {
  const rows=[];
  rows.push(derive('opportunity','tests/high-school-year-one-opportunity-two-integration-test.js',[
    {before:'"ai-plate-appearance-outcome.js", "defensive-runner-throw-settlement-foundation.js"',after:'"ai-plate-appearance-outcome.js", "defensive-decision-throw-foundation.js", "defensive-runner-throw-settlement-foundation.js"'},
    {before:'verify("38.',after:'console.log("TRIAGE_OPPORTUNITY="+JSON.stringify(liveEngine));\nverify("38.'}
  ]));
  rows.push(derive('match','tests/baseball-match-foundation-2-2-2-test.js',[
    {before:'      let safety=0;',after:'      let safety=0; const triageSteps=[];'},
    {before:'      while(!match.completed&&safety++<1400){',after:'      while(!match.completed&&safety++<1400){\n        triageSteps.push({safety,inning:match.inning,half:match.half,outs:match.outs,phase:match.simulationPhase,momentIndex:match.momentIndex,currentMomentId:match.currentMomentId,currentBatter:match.currentBatter,nextBatter:getHighSchoolMatchLineupBatter(match,match.offenseTeam)?.id,completedIds:match.completedMoments.map(m=>m.id),activeSituation:match.activeSituation,visible:isHighSchoolMatchDecisionVisible(match)});'},
    {before:'      return {match,safety};',after:'      globalThis.__triageMatchSteps=triageSteps; return {match,safety};'},
    {before:'const ids=x.match.completedMoments.map(moment=>moment.id);return x.match.completed',after:'const ids=x.match.completedMoments.map(moment=>moment.id);console.log("TRIAGE_MATCH="+JSON.stringify({seed:x.match.simulationSeed,expectedIds:highSchoolYearOneMomentIds,ids,completed:x.match.completed,firstIdPresent:ids.includes(highSchoolYearOneMomentIds[0]),finalIdPresent:ids.includes(highSchoolYearOneMomentIds[2]),defenseMomentCount:x.match.completedMoments.filter(m=>m.domain==="defense").length,defensiveMeaningfulDecisionCount:x.match.matchDecisionDensityState.defensiveMeaningfulDecisionCount,safety:x.safety,safetyBelow1400:x.safety<1400,integrityIssues:getHighSchoolMatchStateIntegrityIssues(x.match),match:x.match,steps:__triageMatchSteps}));return x.match.completed'}
  ]));
  rows.push(derive('gradient','tests/ability-performance-gradient-test.js',[
    {before:"require('./ability-performance-correlation-audit.cjs')",after:"require('../tests/ability-performance-correlation-audit.cjs')"},
    {before:'assert(audit.summarize(low).multiHitFraction>0',after:'console.log("TRIAGE_GRADIENT="+JSON.stringify({base:h.base,tiers:audit.TIERS,field:"baseballSkills.batting",seeds:Array.from({length:20},(_,i)=>i+1),lowSummary:audit.summarize(low),highSummary:audit.summarize(high),low,high}));\nassert(audit.summarize(low).multiHitFraction>0'}
  ]));
  C.capture('isolation-contract',{rows,rootResolution:'docs and tests are both one directory below the repository root',assertionsSeedsFixturesDecisionsUnchanged:true});
  console.log(JSON.stringify(rows.map(({file,original,exactReverse})=>({file,original,exactReverse}))));
}
module.exports={derive};
if(require.main===module) {
  if(process.argv[2]==='build')build();
  else if(process.argv[2]==='run') {
    for(const label of ['opportunity','match','gradient']) C.run(label+'-isolated',C.prefix+label+'-isolated.cjs',[C.prefix+'isolation.cjs']);
  } else throw Error('Explicit build/run required');
}
