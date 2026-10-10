'use strict';
const assert = require('assert/strict'), fs = require('fs'), cp = require('child_process'), path = require('path');
const { assertPitchProductionSourceScope, PROTECTED_FUNCTIONS, PROTECTED_GLOBALS, readSource } = require('./pitch-production-source-scope.cjs');
const root = path.resolve(__dirname, '..');
const current = fs.readFileSync(path.join(root, 'script.js'), 'utf8').replace(/\r\n?/g, '\n');
const references = ['9b9546f94a7286afef474be634fd93c57eb455db',
  '2a4b44a034b714b8de3c8a6897507995ab0f8ccd', '674e49115a9ed7d67c69a3023b5a594d41fe584c'];
const sources = references.map(ref => cp.execFileSync('git', ['show', ref + ':script.js'], {
  cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024
}).replace(/\r\n?/g, '\n'));
let passed = 0, rejected = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reject(source, baseline = sources[0]) {
  assert.throws(() => assertPitchProductionSourceScope(source, baseline)); rejected++;
}
test('all three original immutable tactical baselines retain exact protected implementations', () => {
  for (const source of sources) assert.equal(assertPitchProductionSourceScope(current, source).protectedFunctions, PROTECTED_FUNCTIONS.length);
});
test('each protected function body mutation is rejected without executing production', () => {
  const parsed = readSource(current);
  for (const name of PROTECTED_FUNCTIONS) {
    const declaration = parsed.get(name), body = declaration.source;
    const mutated = body.replace(/\{\n/, '{\n  throw Error("source-scope mutation");\n');
    assert.notEqual(mutated, body, name);
    reject(current.slice(0, declaration.start) + mutated + current.slice(declaration.end));
  }
});
test('removed, renamed, duplicated and overridden pitch owners cannot escape the freeze', () => {
  const name = 'ensureHighSchoolOffensivePlateAppearanceState', declaration = readSource(current).get(name);
  reject(current.slice(0, declaration.start) + current.slice(declaration.end));
  reject(current.replace('function ' + name + '(', 'function renamedPitchOwner('));
  reject(current + '\n' + declaration.source);
  reject(current + '\n' + name + ' = function() { return null; };\n');
  reject(current + '\nrecordHighSchoolMatchSimulationEvent = function() { return null; };\n');
});
test('new external pitch calls, module calls and registrations remain protected', () => {
  reject(current + '\nfunction addedPitchCaller() { ensureHighSchoolPitcherRuntimeState({}); }\n');
  reject(current + '\nfunction addedModuleCaller() { OffensivePlateApproach.resolveNextPitch({}); }\n');
  reject(current + '\npositionDecisionFamilyRegistry.set("pitchMutation", ensureHighSchoolPitcherRuntimeState);\n');
});
test('every protected top-level declaration mutation fails its guard', () => {
  for (const name of PROTECTED_GLOBALS) {
    const pattern = new RegExp('^((?:const|let|var) ' + name + '[^\\n]*)(?=\\n|$)', 'm');
    const mutated = current.replace(pattern, '$1 // source-scope constant mutation');
    assert.notEqual(mutated, current, name); reject(mutated);
  }
});
test('exact shared-wrapper exceptions cannot hide changing offense or broadening defensive admission', () => {
  reject(current.replace('error: Boolean(eventFacts.error),\n    ...(eventFacts.defensiveFacts || {})',
    'error: true,\n    ...(eventFacts.defensiveFacts || {})'));
  reject(current.replace('runnerFacts.outcomeAuthority === "existingOrdinaryPhysicalOutcome"', 'true'));
  reject(current.replace('eventClassification: "ordinaryPlay", outcomeAuthority: runnerFacts.outcomeAuthority',
    'eventClassification: "playerRoutinePlay", outcomeAuthority: runnerFacts.outcomeAuthority'));
});
test('unrelated new defensive function does not freeze the whole script again', () => {
  assertPitchProductionSourceScope(current + '\nfunction defenseScopeProbe() { return "defense-only"; }\n', sources[0]);
});
console.log(JSON.stringify({ suite: 'pitch-production-source-scope', passed, failed: 0,
  immutableReferences: references, protectedFunctions: PROTECTED_FUNCTIONS.length,
  protectedGlobals: PROTECTED_GLOBALS.length, rejectedMutations: rejected, productionExecuted: false }));
