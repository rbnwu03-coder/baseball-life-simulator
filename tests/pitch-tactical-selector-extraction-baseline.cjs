'use strict';
const assert = require('assert/strict'), cp = require('child_process'), path = require('path'), vm = require('vm');
const PS = require('../pitch-sequencing');
const BASELINE = '9b9546f94a7286afef474be634fd93c57eb455db';
const root = path.resolve(__dirname, '..');
const normalize = text => text.replace(/\r\n?/g, '\n');
function baselineSource(commit = BASELINE) {
  return normalize(cp.execFileSync('git', ['show', commit + ':pitcher-catcher-tactical-integration.js'], { cwd: root, encoding: 'utf8' }));
}
// Keep historical source guards strict: the only authorized delta is this
// exact extraction and its read-only export. No selector behavior is waived.
function assertOnlyRepeatEligibilityExtraction(current, baseline) {
  const before = `  function chooseTacticalIntent(context, options = {}) {
    const previous = context.previousFeedback;
    const response = previous?.observableBatterResponse || {};
    const repeatFailed = previous?.intent === "repeatSuccess" && response.hardContactObservable;
    const repeatEligible = !repeatFailed && Boolean(previous?.recommendedPitchClass) && (response.chased || response.whiffed);`;
  const after = `  // Shared semantic eligibility only; no selection, weights, or sampling.
  function getRepeatSuccessEligibility(context) {
    const previous = context.previousFeedback;
    const response = previous?.observableBatterResponse || {};
    const repeatFailed = previous?.intent === "repeatSuccess" && response.hardContactObservable;
    const repeatEligible = !repeatFailed && Boolean(previous?.recommendedPitchClass) && (response.chased || response.whiffed);
    return { repeatFailed, repeatEligible };
  }

  function chooseTacticalIntent(context, options = {}) {
    const { repeatFailed, repeatEligible } = getRepeatSuccessEligibility(context);
    const response = context.previousFeedback?.observableBatterResponse || {};`;
  assert(baseline.includes(before), 'historical selector precondition');
  const expected = baseline.replace(before, after).replace('    buildTacticalContext,\n    chooseTacticalIntent,',
    '    buildTacticalContext,\n    getRepeatSuccessEligibility,\n    chooseTacticalIntent,');
  assert.equal(normalize(current), expected, 'only exact repeat eligibility extraction is permitted');
}
function loadTactical(source, onHash = () => {}, onRandom = () => { throw Error('Production tactical Math.random'); }) {
  const instrumented = normalize(source).replace('  function deterministicUnit(identity, label) {',
    '  function deterministicUnit(identity, label) {\n    __recordTacticalHash(identity, label);');
  assert.notEqual(instrumented, normalize(source));
  const context = vm.createContext({ PitchSequencing: PS, __recordTacticalHash: onHash,
    Math: Object.assign(Object.create(Math), { random: onRandom }) });
  vm.runInContext(instrumented, context);
  return context.PitcherCatcherTacticalIntegration;
}
module.exports = { BASELINE, baselineSource, assertOnlyRepeatEligibilityExtraction, loadTactical, normalize };
