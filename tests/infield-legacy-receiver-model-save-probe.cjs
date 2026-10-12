'use strict';
// Diagnostic only: inspect the actual c4121ce admission and recovery boundary.
const fs = require('fs'), path = require('path'), Module = require('module'), assert = require('assert/strict');
const own = path.join(__dirname, 'infield-legacy-receiver-model-foundation-test.js');
const source = fs.readFileSync(own, 'utf8'), end = source.indexOf('if (red) {');
assert(end > 0);
const harness = new Module(own, module); harness.filename = own; harness.paths = Module._nodeModulePaths(__dirname);
harness._compile(source.slice(0, end) + '\nmodule.exports={run,json,options};', own);
const { run, json, options } = harness.exports;
const mutations = [
  ['control', ''],
  ['lifecycleReceiver', 'probe.highSchoolMatch.activeSituation.resolution.executionEvidence.actionFacts.actions.find(a=>a.type==="receive").actorId="forged";'],
  ['lifecycleDependency', 'probe.highSchoolMatch.activeSituation.resolution.executionEvidence.actionFacts.actions.find(a=>a.type==="receive").dependsOn=[];'],
  ['lifecycleSample', 'probe.highSchoolMatch.activeSituation.resolution.executionEvidence.executionSample=.01;'],
  ['lifecycleCapabilities', 'probe.highSchoolMatch.activeSituation.resolution.executionEvidence.actionFacts.actions.find(a=>a.type==="receive").provenance.capabilities.fielding=100;'],
  ['executionRoute', 'probe.highSchoolMatch.activeSituation.executionState.selectedRoute="forged";'],
  ['cacheReceiver', 'probe.highSchoolMatch.groundBallInPlayState.shortstopExecution.resolution.actionFacts.actions.find(a=>a.type==="receive").actorId="forged";']
];
const rows = [];
for (const [name, mutation] of mutations) {
  run('var m=firstBaseIncomingBoundary(' + JSON.stringify(options('SS')) + ',"pending");var execution=firstBaseExecute(m,"secure",.8);var liveBefore=JSON.stringify(player);var probe=JSON.parse(liveBefore);' + mutation + 'var inputBefore=JSON.stringify(probe);');
  const row = { name, sampleCount: run('execution.rolls'), normalizationAccepted: false, normalizationError: null, recoveryError: null };
  try { run('var restoredMatch=normalizeSave(probe).highSchoolMatch;'); row.normalizationAccepted = true; }
  catch (error) { row.normalizationError = error.message; }
  row.inputUnchanged = run('JSON.stringify(probe)') === run('inputBefore');
  row.liveUnchangedAfterNormalize = run('JSON.stringify(player)') === run('liveBefore');
  if (row.normalizationAccepted) {
    row.before = json('({outs:restoredMatch.outs,bases:restoredMatch.runners,runs:restoredMatch.scores,cursor:restoredMatch.simulationCursor,record:restoredMatch.gameRecord})');
    run('var probeRandom=Math.random;Math.random=()=>{throw Error("SAVE_PROBE_REROLL");};');
    try { run('resumeResolvedHighSchoolGroundBallSettlement(restoredMatch);'); }
    catch (error) { row.recoveryError = error.message; }
    finally { run('Math.random=probeRandom;'); }
    row.after = json('({outs:restoredMatch.outs,bases:restoredMatch.runners,runs:restoredMatch.scores,cursor:restoredMatch.simulationCursor,record:restoredMatch.gameRecord,actions:restoredMatch.lastDefensiveResolution.actionFacts,attribution:restoredMatch.lastDefensiveResolution.defensiveAttribution})');
    row.matchIntegrity = json('getHighSchoolMatchStateIntegrityIssues(restoredMatch)');
    row.recordIntegrity = json('MatchGameRecord.getIntegrityIssues(restoredMatch.gameRecord)');
  }
  rows.push(row);
}
console.log('S6_SAVE_JSON=' + JSON.stringify({ sourceMode: process.argv.includes('--baseline') ? 'exact c4121ce root sources' : 'current unchanged Production', rows }));
