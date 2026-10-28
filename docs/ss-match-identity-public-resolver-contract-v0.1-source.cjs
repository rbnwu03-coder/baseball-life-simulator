"use strict";
const C=require('./ss-match-identity-public-resolver-contract-v0.1-capture.cjs'),assert=require('node:assert/strict');C.runtimeWhitelist();
function region(file,name){const lines=C.readSource(file).replace(/\r\n/g,'\n').split('\n'),start=lines.findIndex(l=>new RegExp('^\\s*function '+name+'\\(').test(l));assert(start>=0,file+':'+name);const indent=lines[start].match(/^\s*/)[0];let end=start+1;while(end<lines.length&&!lines[end].startsWith(indent+'function ')&&!lines[end].startsWith(indent+'return freeze({'))end++;assert(end-start<900);return{file,name,start:start+1,end,source:lines.slice(start,end).join('\n'),fileSha256:C.fileHash(file)};}
const snippets=[];
for(const [file,names]of [
 ['script.js',['prepareHighSchoolYearOneMatch','prepareCurrentHighSchoolYearOneMatch','resolveHighSchoolYearOneMatch','advanceHighSchoolMatchPlaybackStep','createHighSchoolPlayingTimeOpportunity','createHighSchoolMatchSimulationSeed','createHighSchoolMatchSimulationSeedFromIdentity','getHighSchoolYearOneMatchEventId','getHighSchoolScheduleExecutionContext','launchHighSchoolScheduleEntry','prepareHighSchoolFollowupEvaluationMatch','completeHighSchoolEntry']],
 ['story.js',['getCurrentEventId','getEvent']],
 ['high-school-schedule-opportunity.js',['deriveMatchContextInput','markScheduleStarted']]
])for(const name of names)snippets.push(region(file,name));
const story=C.readSource('story.js').split(/\r?\n/);const storyMatch=story.findIndex(l=>l.includes('  high_school_showcase: {'));assert(storyMatch>=0);
C.capture('source',{snippets,showcaseEvent:{file:'story.js',start:storyMatch+1,end:storyMatch+9,source:story.slice(storyMatch,storyMatch+9).join('\n'),sha256:C.fileHash('story.js')},files:['tests/helpers/canonical-match-contract-context.cjs',C.prefix+'proof.cjs',C.prefix+'replay.cjs',C.prefix+'capture.cjs'].map(file=>({file,sha256:C.fileHash(file),source:C.readSource(file)})),noProductionChanges:true,checkpointScope:'Existing admitted step5 checkpoint restored unchanged; this task does not advance event state or validate the preceding story choices.',scheduleScope:'General schedule link contract is source-verified; new runtime candidate uses the first showcase Current Match route, not a new schedule entry.'});
console.log('Saved '+snippets.length+' exact whitelisted current function regions.');
