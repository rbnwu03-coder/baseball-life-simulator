"use strict";
const assert=require('node:assert/strict');
const C=require('./ss-defensive-controlled-scenario-contract-v0.1-capture.cjs');
const runtime=C.runtimeWhitelist();C.sourceWhitelist.add('tests/high-school-career-test-context.js');
const requests={
 'script.js':['prepareHighSchoolYearOneMatch','prepareCurrentHighSchoolYearOneMatch','advanceHighSchoolMatchPlaybackStep','shouldReachHighSchoolDefensiveMoment','prepareHighSchoolDefensiveMomentFromSimulation','ensureHighSchoolOrdinaryGroundBallInPlayHandoff','getHighSchoolDefensiveOpportunity','getHighSchoolPhysicalDefensePlayerContext','getHighSchoolReachAccess','getHighSchoolGroundBallDefensiveSituationOverrides','classifyHighSchoolMatchDefensiveOpportunity','evaluateHighSchoolMatchDefensiveDecisionDensity','resolveHighSchoolYearOneMatch'],
 'batted-ball-physical.js':['resolveBattedBallPhysicalTruth'],
 'offensive-plate-approach.js':['resolveFairContactBallInPlay'],
 'defensive-opportunity-foundation.js':['deriveGroundResponsibility','resolveDefensiveOpportunity'],
 'defensive-reach-secure-foundation.js':['resolveReach','resolveSecure','projectAccess'],
 'batted-ball-ground-defense.js':['resolveGroundBallDefensiveAccess']
};
const snippets=[];
for(const [file,names]of Object.entries(requests)){
 const source=C.readSource(file),lines=source.split('\n');
 for(const name of names){const index=lines.findIndex(l=>new RegExp('^\\s*function '+name+'\\(').test(l));assert(index>=0,name);
  const indentation=lines[index].match(/^\s*/)[0],pattern=new RegExp('^'+indentation+'function ');let end=index+1;while(end<lines.length&&!pattern.test(lines[end]))end++;
  // At the end of a factory, bound the region to its own closing declaration.
  if(end===lines.length){const close=lines.findIndex((l,i)=>i>index&&l===indentation+'}');if(close>index)end=close+1;}
  snippets.push({file,name,startLine:index+1,endLine:end,source:lines.slice(index,end).join('\n'),fileSha256:C.fileHash(file)});
 }
}
const files=['tests/helpers/canonical-match-contract-context.cjs','tests/ss-defensive-production-integration-test.js','tests/ground-ball-defensive-settlement-lifecycle-regression-test.js','tests/high-school-career-test-context.js',...['capture','adapter','proof','replay','plan'].map(s=>C.prefix+s+'.cjs')].map(file=>({file,sha256:C.fileHash(file),source:C.readSource(file)}));
C.capture('source',{snippets,files,runtimeHashes:Object.fromEntries(runtime.map(file=>[file,C.fileHash(file)])),snippetCount:snippets.length,formalSourceUnchanged:true,sourceWhitelist:[...C.sourceWhitelist],regressionDependencyAccounting:C.prefix+'regression-dependency-accounting-evidence.json'});
console.log(JSON.stringify({currentSourceRegions:snippets.length,exactFiles:files.length,runtimeModules:runtime.length}));
