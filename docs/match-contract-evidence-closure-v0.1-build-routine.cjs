"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./match-contract-evidence-closure-v0.1-capture.cjs'),p=C.json(C.prefix+'plan-evidence.json');C.integrity();
assert.equal(C.fileHash(p.tasks.B.test),p.tasks.B.testSha256);assert.equal(C.hash(p.tasks.B.originalPrefix),p.tasks.B.originalPrefixSha256);
const observer=String.raw`
vm.runInContext(`+'`'+String.raw`
globalThis.closureFormatterCalls=[];
{const original=formatMatchSimulationEvent;globalThis.closureOriginalFormatterSource=original.toString();
formatMatchSimulationEvent=function(...args){const result=Reflect.apply(original,this,args),event=args[0],match=args[1];closureFormatterCalls.push({event:JSON.parse(JSON.stringify(event)),formatted:JSON.parse(JSON.stringify(result)),match:{id:match.id,simulationSeed:match.simulationSeed,inning:match.inning,half:match.half,outs:match.outs,scores:match.scores,playerLineupStatus:match.playerLineupStatus,playerEntryCompleted:match.playerEntryCompleted,position:match.position,developmentPositionOverride:match.developmentPositionOverride,completedMoments:JSON.parse(JSON.stringify(match.completedMoments))},playerAge:player.age});return result;};}
`+'`'+String.raw`,context);
const closureC=require('./match-contract-evidence-closure-v0.1-capture.cjs');
const closurePlan=closureC.json(closureC.prefix+'plan-evidence.json');
let closureError=null;
try{
`;
const footer=String.raw`
}catch(error){closureError=error;}
const closureFacts=JSON.parse(evaluate('JSON.stringify({calls:closureFormatterCalls,originalFormatterSource:closureOriginalFormatterSource})'));
const closureLast=closureFacts.calls.at(-1),closureTokens=closurePlan.tasks.B.rawIdentifiers;
const closureChecks=closureLast?Object.fromEntries(closureTokens.map(t=>[t,!closureLast.formatted.text.includes(t)])):null;
console.log('CLOSURE_ROUTINE_PROOF='+JSON.stringify({policy:closurePlan.tasks.B,planSha256:closureC.fileHash(closureC.prefix+'plan-evidence.json'),passedOriginalChecks:passed,checks:closureChecks,facts:closureFacts,originalFormatterSourceSha256:closureC.hash(closureFacts.originalFormatterSource),error:closureError?{name:closureError.name,message:closureError.message}:null,scope:'Exact legacy synthetic fixture and original #38 assertion only. Original artificial setup is not canonical / Moment3 admission evidence.'}));
if(closureError)throw closureError;
assert.equal(passed,1);assert(closureChecks&&Object.values(closureChecks).every(Boolean));assert.equal(closureLast.event.type,'playerRoutinePlay');
console.log('CLOSURE_ROUTINE_SUMMARY='+JSON.stringify({diagnosticOnly:true,originalAssertion:38,originalCheckExecuted:true,passedOriginalChecks:passed,eventType:closureLast.event.type,syntheticSimulationSeed:closureLast.match.simulationSeed,text:closureLast.formatted.text,checks:closureChecks,legacySyntheticPremisesPreserved:true,fullMatchExecuted:false}));
`;
const source=p.tasks.B.originalPrefix+observer+p.tasks.B.assertion38+'\n'+footer,file=C.prefix+'routine.cjs';assert(!fs.existsSync(path.join(C.root,file)));fs.writeFileSync(path.join(C.root,file),source,{flag:'wx'});
C.capture('routine-copy',{path:file,sha256:C.fileHash(file),source,originalPrefixSha256:C.hash(p.tasks.B.originalPrefix),originalAssertion:p.tasks.B.assertion38,originalPrefixRetainedExactly:source.startsWith(p.tasks.B.originalPrefix),originalAssertionOccurrences:source.split(p.tasks.B.assertion38).length-1,originalFixtureAndAssertionBytesUnchanged:true,observer:'Pass-through original formatter invocation; copies arguments/result only, preserves this/arguments/return; no RNG call',seed88221FullMatchInvocations:0,legacyArtificialSetupNotCanonical:true});C.integrity();
console.log(JSON.stringify({routineCopy:file,originalPrefixAnd38Preserved:true,exclusiveCreate:true}));
