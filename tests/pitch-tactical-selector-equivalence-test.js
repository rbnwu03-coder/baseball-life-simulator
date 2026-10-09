'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path');
const T = require('../pitcher-catcher-tactical-integration');
const { baselineSource, assertOnlyRepeatEligibilityExtraction, loadTactical, BASELINE } = require('./pitch-tactical-selector-extraction-baseline.cjs');
const currentSource = fs.readFileSync(path.join(__dirname, '../pitcher-catcher-tactical-integration.js'), 'utf8');
const originalSource = baselineSource();
let passed = 0, contexts = 0, comparisons = 0, rawComparisons = 0, baselineHashes = 0, currentHashes = 0, randomDraws = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
const randomTrap = () => { randomDraws++; throw Error('Tactical RNG'); };
const baseline = loadTactical(originalSource, () => { baselineHashes++; }, randomTrap);
const extracted = loadTactical(currentSource, () => { currentHashes++; }, randomTrap);
const clone = value => JSON.parse(JSON.stringify(value));
test('1 production source differs from formal baseline only by exact eligibility extraction/export', () => {
  assertOnlyRepeatEligibilityExtraction(currentSource, originalSource);
});
test('2 exhaustive bounded normalized contexts preserve weights, eligibility, safeguards, final selection and hash cursor', () => {
  // 4 balls x 3 strikes x 5 previous intents x 2 recommendation-presence
  // x 8 response combinations x 3 repeat-run lengths x 4 cognitive loads
  // x 2 command qualities. Sample the full matrix at seven selection options.
  for (let balls = 0; balls <= 3; balls++) for (let strikes = 0; strikes <= 2; strikes++)
  for (const previousIntent of [null, ...T.TACTICAL_INTENTS]) for (const recommended of [false, true])
  for (let flags = 0; flags < 8; flags++) for (const repeats of [0, 1, 2])
  for (const cognitiveLoad of [0, 67, 68, 100]) for (const previousCommandResult of ['heldTarget', 'majorDrift']) {
    const feedback = { intent: previousIntent, recommendedPitchClass: recommended ? 'edgeStrike' : '', actualPitchClass: 'edgeStrike',
      executionQuality: previousCommandResult, observableBatterResponse: { chased: Boolean(flags & 1), whiffed: Boolean(flags & 2), hardContactObservable: Boolean(flags & 4) } };
    const input = { paIdentity: 'selector|bounded|player|1|top', pitchIndex: 3, balls, strikes,
      pitcherRuntime: { mentalState: { cognitiveLoad }, processState: {} },
      sequenceHistory: previousIntent === null ? [] : [...Array.from({ length: repeats }, () => feedback), feedback] };
    const context = T.buildTacticalContext(input);
    assert.deepEqual(clone(baseline.buildTacticalContext(input)), context);
    const eligibility = T.getRepeatSuccessEligibility(context);
    for (const options of [{}, { roll: 0 }, { roll: 0.3 }, { roll: 0.6 }, { roll: 0.999999999 },
      { roll: 'invalid' }, { intentOverride: 'repeatSuccess' }]) {
      const oldHash = baselineHashes, newHash = currentHashes;
      const before = baseline.chooseTacticalIntent(context, options), after = extracted.chooseTacticalIntent(context, options);
      assert.deepEqual(clone(after), clone(before));
      assert.equal(eligibility.repeatEligible, before.eligibility.repeatSuccess);
      assert.equal(eligibility.repeatFailed, before.safeguards.repeatFailureObserved);
      assert.equal(currentHashes - newHash, baselineHashes - oldHash);
      comparisons++;
    }
    contexts++;
  }
});
test('3 sparse raw contexts preserve undefined/truthy semantics and explicit roll coercion/fallbacks', () => {
  for (const previous of [null, {}, { recommendedPitchClass: 'edgeStrike' },
    ...[undefined, false, true, 1].flatMap(chased => [undefined, false, true].flatMap(whiffed => [undefined, false, true].map(hardContactObservable =>
      ({ intent: 'repeatSuccess', recommendedPitchClass: 'edgeStrike', observableBatterResponse: { chased, whiffed, hardContactObservable } }))))]) {
    const context = { count: { balls: 2, strikes: 2 }, previousFeedback: previous, tacticalIdentity: 'raw-identity', sequenceHistory: [] };
    const beforeContext = clone(context);
    for (const options of [{}, { roll: null }, { roll: -1 }, { roll: 1 }, { roll: Infinity }, { roll: '0.5' },
      { intentOverride: 'unknown' }, ...T.TACTICAL_INTENTS.map(intentOverride => ({ intentOverride, roll: 0.7 }))]) {
      const before = baseline.chooseTacticalIntent(context, options), after = extracted.chooseTacticalIntent(context, options);
      assert.deepEqual(clone(after), clone(before));
      const eligibility = T.getRepeatSuccessEligibility(context);
      assert.equal(eligibility.repeatEligible, before.eligibility.repeatSuccess);
      assert.equal(eligibility.repeatFailed, before.safeguards.repeatFailureObserved);
      assert.deepEqual(clone(context), beforeContext); rawComparisons++;
    }
  }
});
test('4 complete tactical/recommendation/response/sequencing output stays identical for representative inputs', () => {
  for (const intent of T.TACTICAL_INTENTS) for (let index = 0; index < 12; index++) {
    const input = { paIdentity: 'selector|chain|player|1|top', pitchIndex: index + 1, balls: index % 4, strikes: index % 3,
      pitcherRuntime: { control: 55 + index, mentalState: { cognitiveLoad: index * 10 }, processState: {} },
      sequenceHistory: [{ intent, actualPitchClass: 'edgeStrike', recommendedPitchClass: 'edgeStrike', observableBatterResponse: { whiffed: true, hardContactObservable: index > 6 } }],
      realizationRoll: index / 12 };
    assert.deepEqual(clone(extracted.createTacticalPitchDecision(input)), clone(baseline.createTacticalPitchDecision(input)));
  }
});
test('5 helper uses only prior canonical feedback, without sampling/weights/history reads', () => {
  const context = new Proxy({ previousFeedback: { intent: 'repeatSuccess', recommendedPitchClass: 'edgeStrike',
    observableBatterResponse: { chased: true, hardContactObservable: false } } }, { get(target, key) { assert.equal(key, 'previousFeedback'); return target[key]; } });
  const hashBefore = currentHashes; assert.equal(extracted.getRepeatSuccessEligibility(context).repeatEligible, true);
  assert.equal(currentHashes, hashBefore); assert.equal(randomDraws, 0); assert.equal(currentHashes, baselineHashes);
});
console.log('SELECTOR_EQUIVALENCE_JSON=' + JSON.stringify({ passed, failed: 0, baseline: BASELINE, contexts, comparisons, rawComparisons,
  fullChainComparisons: 48, baselineHashCursor: baselineHashes, extractedHashCursor: currentHashes, randomDraws,
  weightsIdentical: true, eligibilityIdentical: true, selectedIntentIdentical: true, hashCursorIdentical: true }));
