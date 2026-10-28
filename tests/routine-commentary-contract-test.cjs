"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { createHash } = require("node:crypto");

// The original synthetic input includes artificial entry/phase and a completed
// Moment. It proves presentation only. No canonical fixture uses this context.
function runSuite() {
  const file=path.join(__dirname,'baseball-match-foundation-2-2-2-test.js');
  const source=fs.readFileSync(file,'utf8'), start=source.indexOf('verify("1.');
  const assertion=source.split(/\r?\n/).filter(line=>line.startsWith('verify("38.'));
  assert(start>0); assert.equal(assertion.length,1);
  const prefix=source.slice(0,start), rawIdentifiers=['hardGrounder','straightAtPlayer','playerRoutinePlay','selfCoverFirst','decisionTension'];
  for(const token of rawIdentifiers) assert(assertion[0].includes('"'+token+'"'));
  const outerModule={exports:{}};
  const observer=String.raw`
    vm.runInContext('globalThis.routineContractCalls=[];{const original=formatMatchSimulationEvent;formatMatchSimulationEvent=function(...args){const value=Reflect.apply(original,this,args);routineContractCalls.push(JSON.parse(JSON.stringify({event:args[0],formatted:value,seed:args[1].simulationSeed,playerAge:player.age,completedMoments:args[1].completedMoments})));return value;};}',context);
  `;
  const footer=String.raw`
    module.exports={passed,calls:JSON.parse(evaluate('JSON.stringify(routineContractCalls)'))};
  `;
  // Execute the exact original prefix and #38 line, without checks #1-37.
  vm.runInNewContext(prefix+observer+assertion[0]+'\n'+footer,
    {require:createRequire(file),__dirname,console,module:outerModule},{filename:'routine-commentary-original-38.cjs'});
  const result=outerModule.exports;
  assert.equal(result.passed,1); assert.equal(result.calls.length,1);
  const call=result.calls[0]; assert.equal(call.event.type,'playerRoutinePlay'); assert.equal(typeof call.formatted.text,'string'); assert(call.formatted.text.length>0);
  assert(!rawIdentifiers.some(raw=>call.formatted.text.includes(raw)));
  const summary={suite:'routine-commentary-contract',passedOriginalAssertions:result.passed,failed:0,
    originalAssertion:38,syntheticSimulationSeed:call.seed,text:call.formatted.text,
    rawIdentifiersAbsent:Object.fromEntries(rawIdentifiers.map(raw=>[raw,!call.formatted.text.includes(raw)])),canonicalAdmissionProof:false,fullMatchExecuted:false};
  console.log('ROUTINE_COMMENTARY_CONTRACT_EVIDENCE='+JSON.stringify({summary,originalTest:'tests/baseball-match-foundation-2-2-2-test.js',
    originalSourceSha256:createHash('sha256').update(Buffer.from(source)).digest('hex'),
    originalPrefixSha256:createHash('sha256').update(prefix).digest('hex'),originalAssertion:assertion[0],
    fixture:'Exact original __candidate2222 defaults, including legacy artificial setup',calls:result.calls}));
  console.log('ROUTINE_COMMENTARY_CONTRACT_SUMMARY='+JSON.stringify(summary));
  console.log('Routine Commentary Contract: 1/1 original assertion passed.');
  return summary;
}
module.exports={runSuite};
if(require.main===module) runSuite();
