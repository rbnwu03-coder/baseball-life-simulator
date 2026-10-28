"use strict";
const C=require('./critical-regression-triage-v0.1-capture.cjs'),{derive}=require('./critical-regression-triage-v0.1-isolation.cjs');
if(process.argv[2]==='build') {
 const observer=`const triageRngGames=[];
h.ctx.run(\`globalThis.__triageIdentities=[]; const __triageOriginalIdentity=createHighSchoolOffensivePlateAppearanceIdentity;
createHighSchoolOffensivePlateAppearanceIdentity=function(...args){const id=Reflect.apply(__triageOriginalIdentity,this,args);__triageIdentities.push(id);return id;};\`);
const triageOriginalPlay=h.play;
h.play=function(field,value,seed,...rest){
  h.ctx.run('__triageIdentities=[];');
  const result=Reflect.apply(triageOriginalPlay,this,[field,value,seed,...rest]);
  if(field==='baseballSkills.batting'&&[8,16].includes(value)) {
    const facts=h.ctx.json('({identities:[...new Set(__triageIdentities)],lastPA:player.highSchoolMatch.offensivePlateAppearanceState,matchSeed:player.highSchoolMatch.simulationSeed,simulationCursor:player.highSchoolMatch.simulationCursor})');
    const identityDraws=facts.identities.map(id=>({identity:id,draws:Object.fromEntries(['pitch-class|1','pitch-quality|1','recognition|1','contact|1','bip-outcome|1'].map(label=>[label,h.ctx.run('OffensivePlateApproach.deterministicUnit('+JSON.stringify(id)+','+JSON.stringify(label)+')')]))}));
    triageRngGames.push({field,value,seed,...facts,identityDraws,recordSha256:require('node:crypto').createHash('sha256').update(JSON.stringify(result.record)).digest('hex'),logSha256:require('node:crypto').createHash('sha256').update(JSON.stringify(result.log)).digest('hex')});
  }
  return result;
};
`;
 const row=derive('gradient-rng','tests/ability-performance-gradient-test.js',[
 {before:"require('./ability-performance-correlation-audit.cjs')",after:"require('../tests/ability-performance-correlation-audit.cjs')"},
 {before:'const before = JSON.stringify(h.base);',after:observer+'const before = JSON.stringify(h.base);'},
 {before:'assert(audit.summarize(low).multiHitFraction>0',after:'console.log("TRIAGE_RNG="+JSON.stringify({games:triageRngGames,lowSummary:audit.summarize(low),highSummary:audit.summarize(high)}));\nassert(audit.summarize(low).multiHitFraction>0'}]);
 C.capture('rng-isolation-contract',{row,purpose:'Observe original identity and last detailed PA; recompute pure hash draws without consuming stream RNG; compare all 40 cohort record/log hashes to compact diagnostic',newSeedsOrAdditionalStatisticalSamples:false,assertionsUnchanged:true});console.log(row.file);
} else if(process.argv[2]==='run')C.run('gradient-rng-isolated',C.prefix+'gradient-rng-isolated.cjs',[C.prefix+'rng.cjs']);
else throw Error('Explicit build/run required');
