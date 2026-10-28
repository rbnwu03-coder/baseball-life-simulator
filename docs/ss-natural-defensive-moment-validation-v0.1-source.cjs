"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./ss-natural-defensive-moment-validation-v0.1-capture.cjs');
const scriptNames=['completeHighSchoolEntry','createHighSchoolPlayingTimeOpportunity','prepareHighSchoolYearOneMatch','shouldEnterHighSchoolMatchPlayer','enterHighSchoolMatchPlayer','insertPlayerIntoHighSchoolMatchLineup','advanceHighSchoolMatchPlaybackStep','shouldReachHighSchoolDefensiveMoment','getHighSchoolDefensiveOpportunity','getHighSchoolPhysicalDefensePlayerContext','getHighSchoolReachAccess','ensureHighSchoolOrdinaryGroundBallInPlayHandoff','prepareHighSchoolDefensiveMomentFromSimulation','classifyHighSchoolMatchDefensiveOpportunity','createGroundBallMatchSituation','resolveHighSchoolDefensivePlay','recordGroundBallSituationResolution','applyInfieldResolutionToHighSchoolMatch','prepareCurrentHighSchoolYearOneMatch','resolveHighSchoolYearOneMatch'];
function region(file,name){const lines=fs.readFileSync(path.join(C.root,file),'utf8').replace(/\r\n/g,'\n').split('\n');
 const start=lines.findIndex(l=>new RegExp('^\\s*function '+name+'\\(').test(l));assert(start>=0,file+':'+name);
 const indent=lines[start].match(/^\s*/)[0];let end=start+1;while(end<lines.length&&!(lines[end].startsWith(indent+'function ')||lines[end].startsWith(indent+'return freeze({')||lines[end].startsWith(indent+'return deepFreeze({ VERSION')))end++;
 assert(end-start<700,'Bounded region '+name);return {file,name,start:start+1,end,source:lines.slice(start,end).join('\n'),fileSha256:C.fileHash(file)};
}
const snippets=scriptNames.map(name=>region('script.js',name));
for(const [file,names]of [
 ['playing-time-game-exposure.js',['resolveStartingOpportunity']],
 ['defensive-opportunity-foundation.js',['resolveDefensiveOpportunity']],
 ['batted-ball-physical.js',['resolveBattedBallPhysicalTruth']],
 ['defensive-reach-secure-foundation.js',['resolveReach','resolveSecure']],
 ['defensive-decision-throw-foundation.js',['resolveThrow']],
 ['defensive-runner-throw-settlement-foundation.js',['resolveTiming']],
 ['match-situation-lifecycle.js',['admitSituation','resolveSituation']]
])for(const name of names)snippets.push(region(file,name));
const files=['tests/helpers/canonical-match-contract-context.cjs','tests/ss-defensive-production-integration-test.js','tests/high-school-career-test-context.js','tests/ground-ball-defensive-settlement-lifecycle-regression-test.js','tests/ground-settlement-handoff-r2-context.cjs',C.prefix+'proof.cjs',C.prefix+'replay.cjs'];
C.capture('source',{snippets,exactCurrentSource:true,files:files.map(file=>({file,sha256:C.fileHash(file),source:fs.readFileSync(path.join(C.root,file),'utf8')})),routingObservation:'prepare supports custom matchId; public resolve invokes prepareCurrentHighSchoolYearOneMatch, which uses event routing and defaults to prepareHighSchoolYearOneMatch without that custom id. This isolates a candidate API-contract problem, not proof that all normal career producers have it.',unexecutedDefenseCheckerLimit:'Candidate did not reach its optional nonzero-defense assertions; those checks cannot be claimed as validated.',explicitFixtureLimit:'Existing careerFixture sets baseballSkills to12 and uses a year-three route; its full-match PASS is separate from this unchanged-original-capability candidate.'});
console.log('Saved '+snippets.length+' direct current function regions and '+files.length+' exact driver/test/helper sources.');
