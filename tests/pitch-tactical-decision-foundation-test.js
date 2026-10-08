'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path'), vm = require('vm');
const I = require('../pitch-tactical-interpretation-foundation'), T = require('../pitcher-catcher-tactical-integration');
const D = require('../pitch-tactical-decision-foundation');
const clone = value => JSON.parse(JSON.stringify(value));
const PA = 'decision-test|pa-1|player|1|top';
const source = fs.readFileSync(path.join(__dirname, '../pitch-tactical-decision-foundation.js'), 'utf8');
let passed = 0, draws = 0, orderPermutations = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
// Interpretation-contract fixtures only: Decision never sees Sequence numbers.
function input(types = []) {
  return { supported: true, version: I.VERSION, paIdentity: PA, pitchCount: 4,
    interpretations: types.map(type => ({ type, scope: 'CURRENT_PA', source: I.SOURCE, reasonCode: 'INTERPRETATION_CONTRACT_FIXTURE', evidence: {} })) };
}
function decision(types) { const result = D.decide(input(types)); assert(result.supported, result.reason); return result; }
const selected = types => decision(types).selectedIntent;
const candidate = (types, intent) => decision(types).candidates.find(row => row.intent === intent);
function noRecommendation(value) {
  const forbidden = ['recommendedPitchClass', 'recommendedPitchType', 'recommendedTarget', 'targetLocation', 'physicalPitchType',
    'pitchType', 'velocity', 'location', 'zoneIntent', 'targetIntent', 'intentScore', 'utilityScore', 'expectedRunValue', 'probability', 'confidence'];
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) { assert(!forbidden.includes(key), key); noRecommendation(child); }
  assert(!/fastball|slider|changeup|curveball|competitiveStrike|chasePitch|middle-in|low-away/.test(JSON.stringify(value)));
}

test('1 no interpretation resets neutral with explicit empty provenance', () => {
  assert.deepEqual(decision([]), { supported: true, version: D.VERSION, paIdentity: PA, pitchCount: 4, selectedIntent: 'resetNeutral',
    candidates: [{ intent: 'resetNeutral', reasonCodes: ['NO_ACTIONABLE_INTERPRETATION'], interpretationTypes: [] }], source: D.SOURCE });
});
test('2 Take Present supports canonical challenge', () => assert.equal(selected(['TAKE_PATTERN_PRESENT']), 'challenge'));
test('3 Strong Take supports canonical challenge', () => assert.equal(selected(['TAKE_PATTERN_STRONG']), 'challenge'));
test('4 Called Strike supports canonical challenge', () => assert.equal(selected(['CALLED_STRIKE_PATTERN_PRESENT']), 'challenge'));
test('5 Chase supports canonical expand', () => assert.equal(selected(['CHASE_PATTERN_PRESENT']), 'expand'));
test('6 Swing Miss supports canonical expand', () => assert.equal(selected(['SWING_MISS_PATTERN_PRESENT']), 'expand'));
test('7 Location Miss Punished supports canonical changeLook', () => assert.equal(selected(['LOCATION_MISS_PUNISHED']), 'changeLook'));
test('8 target hits plus whiff or chase establish repeat candidate under canonical semantics', () => {
  for (const response of ['SWING_MISS_PATTERN_PRESENT', 'CHASE_PATTERN_PRESENT']) {
    const types = ['REPEATED_TARGET_HITS', response];
    assert.equal(selected(types), 'repeatSuccess');
    assert.deepEqual(candidate(types, 'repeatSuccess'), { intent: 'repeatSuccess',
      reasonCodes: ['TARGET_HITS_WITH_CHASE_OR_WHIFF_SUPPORT_REPEAT'], interpretationTypes: [response, 'REPEATED_TARGET_HITS'] });
  }
});
test('9 target hits alone do not establish batter suppression or repeat success', () => {
  assert.equal(selected(['REPEATED_TARGET_HITS']), 'resetNeutral'); assert(!candidate(['REPEATED_TARGET_HITS'], 'repeatSuccess'));
});
test('10 conflict priority is changeLook then repeatSuccess then expand then challenge', () => {
  const types = ['REPEATED_TARGET_HITS', 'TAKE_PATTERN_STRONG', 'CHASE_PATTERN_PRESENT', 'LOCATION_MISS_PUNISHED'];
  assert.deepEqual(decision(types).candidates.map(row => row.intent), ['changeLook', 'repeatSuccess', 'expand', 'challenge']);
  assert.equal(selected(types), 'changeLook');
  assert.equal(selected(types.filter(type => type !== 'LOCATION_MISS_PUNISHED')), 'repeatSuccess');
  assert.equal(selected(['TAKE_PATTERN_PRESENT', 'REPEATED_TARGET_HITS']), 'challenge');
});
test('11 every permutation produces byte-identical decision and provenance ordering', () => {
  for (const types of [
    ['TAKE_PATTERN_PRESENT', 'TAKE_PATTERN_STRONG', 'SWING_MISS_PATTERN_PRESENT', 'REPEATED_TARGET_HITS', 'LOCATION_MISS_PUNISHED'],
    ['REPEATED_TARGET_HITS', 'CHASE_PATTERN_PRESENT', 'TAKE_PATTERN_STRONG'],
    ['REPEATED_TARGET_HITS', 'SWING_MISS_PATTERN_PRESENT', 'CALLED_STRIKE_PATTERN_PRESENT'],
    ['CHASE_PATTERN_PRESENT', 'TAKE_PATTERN_STRONG']
  ]) {
    const expected = decision(types);
    function permutations(rest, prefix = []) {
      if (!rest.length) { assert.deepEqual(decision(prefix), expected); orderPermutations++; return; }
      rest.forEach((type, index) => permutations(rest.filter((_, i) => i !== index), [...prefix, type]));
    }
    permutations(types);
  }
});
test('12 unknown interpretation explicitly rejects without partial candidates', () => {
  const result = D.decide(input(['TAKE_PATTERN_PRESENT', 'UNKNOWN_PATTERN']));
  assert.deepEqual(result, { supported: false, version: D.VERSION, reason: 'UNKNOWN_INTERPRETATION_TYPE', candidates: [] });
});
test('13 Proxy forbids Sequence and Observation access and input enumeration', () => {
  const value = input(['TAKE_PATTERN_PRESENT']);
  for (const key of ['sequence', 'sequenceState', 'currentCount', 'location', 'contact', 'velocity', 'observations', 'consecutiveTakes']) {
    Object.defineProperty(value, key, { get() { throw Error('Upstream access ' + key); } });
  }
  const proxy = new Proxy(value, { ownKeys() { throw Error('Wrapper enumeration'); }, get(target, key) {
    assert(['supported', 'version', 'paIdentity', 'pitchCount', 'interpretations'].includes(key)); return target[key];
  } });
  assert.equal(D.decide(proxy).selectedIntent, 'challenge');
});
test('14 raw truth and Interpretation numeric evidence are never read', () => {
  const value = input(['REPEATED_TARGET_HITS', 'SWING_MISS_PATTERN_PRESENT']);
  for (const key of ['pitchHistory', 'pitch', 'pitchType', 'targetIntent', 'contactQuality', 'countGeometry']) {
    Object.defineProperty(value, key, { get() { throw Error('Raw read ' + key); } });
  }
  for (const row of value.interpretations) {
    Object.defineProperty(row, 'evidence', { get() { throw Error('Threshold reimplementation'); } });
    Object.defineProperty(row, 'sequence', { get() { throw Error('Row Sequence access'); } });
  }
  assert.equal(D.decide(value).selectedIntent, 'repeatSuccess');
});
test('15 output contains no recommendation geometry physical pitch scoring or psychology', () => {
  noRecommendation(decision(I.INTERPRETATION_TYPES));
  assert(!/passive|fear|fatigue|frustration|discipline/.test(JSON.stringify(decision(I.INTERPRETATION_TYPES))));
});
test('16 same Interpretation decided 100 times is identical', () => {
  const value = input(I.INTERPRETATION_TYPES), expected = D.decide(value);
  for (let i = 0; i < 100; i++) assert.deepEqual(D.decide(value), expected);
});
test('17 browser accesses owner metadata only and draws zero RNG', () => {
  const interpretation = new Proxy(I, { get(target, key) { assert(['VERSION', 'SOURCE', 'INTERPRETATION_TYPES'].includes(key)); return target[key]; } });
  const tactical = new Proxy(T, { get(target, key) { assert.equal(key, 'TACTICAL_INTENTS'); return target[key]; } });
  const context = vm.createContext({ PitchTacticalInterpretationFoundation: interpretation, PitcherCatcherTacticalIntegration: tactical,
    Math: Object.assign(Object.create(Math), { random() { draws++; throw Error('Decision RNG'); } }) });
  for (const key of ['PitchSequenceStateFoundation', 'PitchObservationFoundation', 'PitchSequencing', 'player']) {
    Object.defineProperty(context, key, { get() { throw Error('Forbidden owner access ' + key); } });
  }
  vm.runInContext(source, context);
  const value = input(I.INTERPRETATION_TYPES);
  for (let i = 0; i < 100; i++) assert.deepEqual(clone(context.PitchTacticalDecisionFoundation.decide(value)), D.decide(value));
  assert.equal(draws, 0);
});
test('18 mutable source remains unchanged and unfrozen while output is detached and immutable', () => {
  const value = input(['TAKE_PATTERN_PRESENT']), before = clone(value), result = D.decide(value);
  assert.deepEqual(value, before); assert(!Object.isFrozen(value)); assert(!Object.isFrozen(value.interpretations));
  assert(Object.isFrozen(result)); assert(Object.isFrozen(result.candidates)); assert(Object.isFrozen(result.candidates[0].interpretationTypes));
  value.interpretations[0].type = 'LOCATION_MISS_PUNISHED'; value.paIdentity = 'changed';
  assert.equal(result.selectedIntent, 'challenge'); assert.equal(result.paIdentity, PA);
  assert.deepEqual(result.candidates[0].interpretationTypes, ['TAKE_PATTERN_PRESENT']);
});
test('19 unsupported upstream cannot create partial decision', () => {
  for (const value of [null, {}, { supported: false, version: I.VERSION, interpretations: [] }]) {
    assert.deepEqual(D.decide(value), { supported: false, version: D.VERSION, reason: 'UNSUPPORTED_INTERPRETATION', candidates: [] });
  }
});
test('20 wrong upstream version rejects before reading patterns', () => {
  const value = { supported: true, version: 'future' };
  Object.defineProperty(value, 'interpretations', { get() { throw Error('Premature read'); } });
  assert.equal(D.decide(value).reason, 'INTERPRETATION_VERSION_MISMATCH');
});
test('21 malformed wrapper metadata explicitly rejects', () => {
  for (const mutate of [v => { v.paIdentity = 'npc'; }, v => { v.paIdentity = '|pa|player|1|top'; }, v => { v.pitchCount = -1; },
    v => { v.pitchCount = 1.5; }, v => { v.pitchCount = Infinity; }, v => { v.interpretations = {}; },
    v => { v.pitchCount = 0; }]) {
    const value = input(['TAKE_PATTERN_PRESENT']); mutate(value); assert.equal(D.decide(value).reason, 'INVALID_INTERPRETATION_WRAPPER');
  }
});
test('22 malformed scope source or reason rejects atomically', () => {
  for (const mutate of [v => { v.scope = 'CAREER'; }, v => { v.source = 'other'; }, v => { v.reasonCode = ''; }]) {
    const value = input(['TAKE_PATTERN_PRESENT']); mutate(value.interpretations[0]);
    assert.equal(D.decide(value).reason, 'INVALID_INTERPRETATION_ITEM'); assert.deepEqual(D.decide(value).candidates, []);
  }
});
test('23 duplicate type rejects instead of inflating provenance', () => {
  assert.equal(D.decide(input(['TAKE_PATTERN_PRESENT', 'TAKE_PATTERN_PRESENT'])).reason, 'DUPLICATE_INTERPRETATION_TYPE');
});
test('24 Called Strike plus target hits does not override canonical chase-whiff eligibility', () => {
  const types = ['REPEATED_TARGET_HITS', 'CALLED_STRIKE_PATTERN_PRESENT'];
  assert.equal(selected(types), 'challenge'); assert(!candidate(types, 'repeatSuccess'));
});
test('25 velocity-down pattern alone is nonactionable; no fatigue inference', () => assert.equal(selected(['VELOCITY_DOWN_PATTERN']), 'resetNeutral'));
test('26 missing dependencies and conflicting vocabulary explicitly fail', () => {
  const missing = vm.createContext({}); vm.runInContext(source, missing);
  assert.equal(missing.PitchTacticalDecisionFoundation.decide(input()).reason, 'DEPENDENCIES_UNAVAILABLE');
  const conflict = vm.createContext({ PitchTacticalInterpretationFoundation: I, PitcherCatcherTacticalIntegration: { TACTICAL_INTENTS: ['ATTACK_ZONE'] } });
  vm.runInContext(source, conflict);
  assert.equal(conflict.PitchTacticalDecisionFoundation.decide(input()).reason, 'TACTICAL_INTENT_AUTHORITY_CONFLICT');
});
test('27 every non-neutral output intent belongs to the production vocabulary', () => {
  assert.deepEqual(D.INTENT_PRIORITY, ['changeLook', 'repeatSuccess', 'expand', 'challenge', 'resetNeutral']);
  for (const row of decision(I.INTERPRETATION_TYPES).candidates) assert(T.TACTICAL_INTENTS.includes(row.intent));
});
test('28 zero-pitch supported Interpretation result resets without any inferred action', () => {
  const value = input(); value.pitchCount = 0; assert.equal(D.decide(value).selectedIntent, 'resetNeutral');
});
test('29 A repeatSuccess is selected for target hits plus chase while expand stays a candidate', () => {
  const result = decision(['REPEATED_TARGET_HITS', 'CHASE_PATTERN_PRESENT']);
  assert.deepEqual(result.candidates.map(row => row.intent), ['repeatSuccess', 'expand']);
  assert.equal(result.selectedIntent, 'repeatSuccess');
});
test('30 B repeatSuccess is selected for target hits plus swing miss', () => {
  const result = decision(['REPEATED_TARGET_HITS', 'SWING_MISS_PATTERN_PRESENT']);
  assert.deepEqual(result.candidates.map(row => row.intent), ['repeatSuccess', 'expand']);
  assert.equal(result.selectedIntent, 'repeatSuccess');
});
test('31 C generic expand remains independently reachable for chase or swing miss alone', () => {
  for (const type of ['CHASE_PATTERN_PRESENT', 'SWING_MISS_PATTERN_PRESENT']) {
    const result = decision([type]); assert.equal(result.selectedIntent, 'expand');
    assert.deepEqual(result.candidates.map(row => row.intent), ['expand']);
  }
});
test('32 D changeLook still wins over eligible repeatSuccess and expand', () => {
  const result = decision(['LOCATION_MISS_PUNISHED', 'REPEATED_TARGET_HITS', 'CHASE_PATTERN_PRESENT']);
  assert.deepEqual(result.candidates.map(row => row.intent), ['changeLook', 'repeatSuccess', 'expand']);
  assert.equal(result.selectedIntent, 'changeLook');
});
test('33 E every production intent is selected by a legal upstream Interpretation output', () => {
  const O = require('../pitch-observation-foundation'), S = require('../pitch-sequence-state-foundation');
  const witnesses = {
    challenge: [['BATTER_TOOK_BALL'], ['BATTER_TOOK_BALL']],
    expand: [['BATTER_CHASED', 'SWING_MISS'], ['BATTER_CHASED', 'SWING_MISS']],
    repeatSuccess: [['TARGET_HIT', 'BATTER_SWUNG_IN_ZONE', 'SWING_MISS'], ['TARGET_HIT', 'BATTER_SWUNG_IN_ZONE', 'SWING_MISS']],
    changeLook: [['HARD_CONTACT', 'HARD_CONTACT_ON_LOCATION_MISS']]
  };
  assert.deepEqual(Object.keys(witnesses).sort(), [...T.TACTICAL_INTENTS].sort());
  for (const [intent, pitches] of Object.entries(witnesses)) {
    const observations = pitches.map((types, index) => {
      const identity = { paIdentity: PA, pitchNumber: index + 1, pitchId: PA + '|pitch-' + (index + 1) };
      const countBefore = { balls: intent === 'challenge' ? index : 0, strikes: 0 };
      const countAfter = { balls: intent === 'challenge' ? index + 1 : 0, strikes: intent === 'expand' || intent === 'repeatSuccess' ? index + 1 : 0 };
      if (index && countAfter.strikes) countBefore.strikes = index;
      return { supported: true, version: O.VERSION, ...identity, countBefore, countAfter,
        observations: types.map(type => ({ type, ...identity, source: O.SOURCE, evidence: {} })) };
    });
    const sequence = S.build(observations); assert(sequence.supported, sequence.reason);
    const interpretation = I.interpret(sequence); assert(interpretation.supported, interpretation.reason);
    const result = D.decide(interpretation); assert(result.supported, result.reason);
    assert.equal(result.selectedIntent, intent, 'Unreachable production intent: ' + intent);
  }
});
console.log('DECISION_UNIT_JSON=' + JSON.stringify({ passed, failed: 0, decisions: 100, orderPermutations, rngDraws: draws, sourceMutations: 0 }));
