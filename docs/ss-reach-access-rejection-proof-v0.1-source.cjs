"use strict";
const assert=require('node:assert/strict');
const C=require('./ss-reach-access-rejection-proof-v0.1-capture.cjs');
const runtime=C.runtimeWhitelist();
const requests={
 'script.js':['getHighSchoolDefensiveOpportunity','getHighSchoolReachAccess','getHighSchoolPhysicalDefensePlayerContext','ensureHighSchoolOrdinaryGroundBallInPlayHandoff','prepareHighSchoolDefensiveMomentFromSimulation'],
 'defensive-reach-secure-foundation.js':['binding','demand','variation','resolveReach','projectAccess'],
 'batted-ball-ground-defense.js':['resolveGroundBallDefensiveAccess'],
 'offensive-plate-approach.js':['resolveFairContactBallInPlay']
};
const snippets=[];
for(const [file,names]of Object.entries(requests)){
 const source=C.readSource(file),lines=source.split('\n');
 for(const name of names){const index=lines.findIndex(l=>new RegExp('^\\s*function '+name+'\\(').test(l));assert(index>=0,name);const indent=lines[index].match(/^\s*/)[0],pattern=new RegExp('^'+indent+'function ');let end=index+1;while(end<lines.length&&!pattern.test(lines[end]))end++;
  snippets.push({file,name,startLine:index+1,endLine:end,source:lines.slice(index,end).join('\n'),fileSha256:C.fileHash(file)});
 }
}
const files=['tests/helpers/canonical-match-contract-context.cjs','tests/entry-safe-runner.cjs','tests/entry-safe-preload.cjs',...['capture','adapter','observer','proof','replay','plan'].map(x=>C.prefix+x+'.cjs')].map(file=>({file,sha256:C.fileHash(file),source:C.readSource(file)}));
C.capture('source',{snippets,files,runtimeHashes:Object.fromEntries(runtime.map(f=>[f,C.fileHash(f)])),recursiveWhitelist:C.prefix+'recursive-read-whitelist-evidence.json',formalExistingDelta:0,scope:'Only Reach/access rejection and existing handoff/fallback; no new architectural audit'});
console.log(JSON.stringify({currentRegions:snippets.length,exactFiles:files.length,runtimeModules:runtime.length}));
