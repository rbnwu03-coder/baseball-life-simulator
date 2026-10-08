'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path'), vm = require('vm');
const O = require('../pitch-observation-foundation'), S = require('../pitch-sequence-state-foundation');
const I = require('../pitch-tactical-interpretation-foundation');
const clone = value => JSON.parse(JSON.stringify(value));
const PA = 'interpretation-test|pa-1|player|1|top';
let passed = 0, draws = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
// Unit fixtures use the upstream contracts; no production pitch truth is invented.
function state(typesByPitch) {
  const result = S.build(typesByPitch.map((types, i) => {
    const identity = { paIdentity: PA, pitchNumber: i + 1, pitchId: PA + '|pitch-' + (i + 1) };
    return { supported: true, version: O.VERSION, ...identity, countBefore: { balls: 0, strikes: 0 }, countAfter: { balls: 0, strikes: 0 },
      observations: types.map(type => ({ type, ...identity, source: O.SOURCE, evidence: {} })) };
  }));
  assert(result.supported, result.reason); return result;
}
const repeat = (types, count) => state(Array.from({ length: count }, () => types));
function types(s) { const result = I.interpret(s); assert(result.supported, result.reason); return result.interpretations.map(x => x.type); }
function item(s, type) { return I.interpret(s).interpretations.find(x => x.type === type); }

test('1 one take has no pattern', () => assert.deepEqual(types(repeat(['BATTER_TOOK_BALL'], 1)), []));
test('2 two takes establish Present with exact evidence and reason', () => {
  const s = repeat(['BATTER_TOOK_BALL'], 2);
  assert.deepEqual(types(s), ['TAKE_PATTERN_PRESENT']);
  assert.deepEqual(item(s, 'TAKE_PATTERN_PRESENT'), { type: 'TAKE_PATTERN_PRESENT', scope: 'CURRENT_PA', source: I.SOURCE,
    reasonCode: 'CONSECUTIVE_TAKES_AT_LEAST_TWO', evidence: { consecutiveTakes: 2 } });
});
test('3 three takes keep Present and add Strong', () => {
  const s = repeat(['BATTER_TOOK_BALL'], 3);
  assert.deepEqual(types(s), ['TAKE_PATTERN_PRESENT', 'TAKE_PATTERN_STRONG']);
  assert.deepEqual(item(s, 'TAKE_PATTERN_STRONG').evidence, { consecutiveTakes: 3 });
});
test('4 called strikes establish their independent pattern', () => assert(types(repeat(['BATTER_TOOK_STRIKE'], 2)).includes('CALLED_STRIKE_PATTERN_PRESENT')));
test('5 repeated chase establishes only Chase', () => assert.deepEqual(types(repeat(['BATTER_CHASED'], 2)), ['CHASE_PATTERN_PRESENT']));
test('6 repeated swing misses establish only Swing Miss', () => assert.deepEqual(types(repeat(['SWING_MISS'], 2)), ['SWING_MISS_PATTERN_PRESENT']));
test('7 repeated target hits establish execution pattern', () => assert.deepEqual(types(repeat(['TARGET_HIT'], 2)), ['REPEATED_TARGET_HITS']));
test('8 repeated velocity-down observations establish velocity pattern', () => assert.deepEqual(types(repeat(['VELOCITY_DOWN'], 2)), ['VELOCITY_DOWN_PATTERN']));
test('9 one hard contact on miss establishes PA-wide contact pattern', () => {
  const s = state([['HARD_CONTACT', 'HARD_CONTACT_ON_LOCATION_MISS'], []]);
  assert.deepEqual(types(s), ['LOCATION_MISS_PUNISHED']);
  assert.deepEqual(item(s, 'LOCATION_MISS_PUNISHED').evidence, { hardContactsOnLocationMiss: 1 });
});
test('10 take streak reset prevents interpretation despite three PA-wide takes', () => {
  const s = state([['BATTER_TOOK_BALL'], ['BATTER_TOOK_STRIKE'], ['BATTER_TOOK_BALL'], ['FOUL']]);
  assert.equal(s.batterResponse.totalTakes, 3); assert.equal(s.sequence.consecutiveTakes, 0); assert.deepEqual(types(s), []);
});
test('11 no psychology or numeric confidence fields', () => {
  const text = JSON.stringify(I.interpret(repeat(['BATTER_TOOK_STRIKE', 'TARGET_HIT'], 3)));
  assert(!/passive|aggressive|confidence|fear|frustration|discipline|fatigue|tacticalScore/i.test(text));
});
test('12 no recommendation, next pitch, probability or selection output', () => {
  const text = JSON.stringify(I.interpret(repeat(['BATTER_CHASED', 'SWING_MISS'], 3)));
  assert(!/recommended|nextPitch|repeatSuccess|changeLook|challenge|expandZone|finishPitch|probability|pitchType|targetIntent/i.test(text));
});
test('13 getter and Proxy traps forbid raw truth, upstream calls and pitch-level history', () => {
  const s = clone(repeat(['BATTER_TOOK_BALL'], 3));
  const forbidden = ['pitchHistory', 'pitch', 'location', 'pitchResult', 'pitchType', 'targetIntent', 'contactQuality', 'rawObservation',
    'observations', 'evidence', 'recentPitches', 'lastPitch', 'batterResponse', 'velocity', 'currentCount'];
  for (const key of forbidden) Object.defineProperty(s, key, { get() { throw Error('Forbidden read: ' + key); } });
  const proxy = new Proxy(s, { ownKeys() { throw Error('State enumeration'); }, get(target, key) {
    assert(['supported', 'version', 'paIdentity', 'pitchCount', 'sequence', 'contact'].includes(key), 'Unexpected field ' + String(key));
    return target[key];
  } });
  assert.deepEqual(types(proxy), ['TAKE_PATTERN_PRESENT', 'TAKE_PATTERN_STRONG']);
});
test('14 one state interpreted 100 times is identical', () => {
  const s = repeat(['BATTER_CHASED', 'SWING_MISS', 'VELOCITY_DOWN'], 3), expected = I.interpret(s);
  for (let i = 0; i < 100; i++) assert.deepEqual(I.interpret(s), expected);
});
test('15 browser dependency access is VERSION-only, zero RNG and no Observation owner', () => {
  const owner = new Proxy(S, { get(target, key) { assert.equal(key, 'VERSION'); return target[key]; } });
  const context = vm.createContext({ PitchSequenceStateFoundation: owner,
    Math: Object.assign(Object.create(Math), { random() { draws++; throw Error('Interpretation RNG'); } }) });
  Object.defineProperty(context, 'PitchObservationFoundation', { get() { throw Error('Observation owner access'); } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../pitch-tactical-interpretation-foundation.js'), 'utf8'), context);
  const s = repeat(['BATTER_TOOK_STRIKE', 'TARGET_HIT'], 3);
  for (let i = 0; i < 100; i++) assert.deepEqual(clone(context.PitchTacticalInterpretationFoundation.interpret(s)), I.interpret(s));
  assert.equal(draws, 0);
});
test('16 mutable source stays unchanged and unfrozen; output owns immutable evidence', () => {
  const s = clone(repeat(['BATTER_TOOK_BALL'], 2)), before = clone(s), result = I.interpret(s);
  assert.deepEqual(s, before); assert(!Object.isFrozen(s)); assert(!Object.isFrozen(s.sequence));
  assert(Object.isFrozen(result)); assert(Object.isFrozen(result.interpretations[0].evidence));
  s.sequence.consecutiveTakes = 0; assert.equal(result.interpretations[0].evidence.consecutiveTakes, 2);
});
test('17 unsupported and compressed Sequence results produce no partial interpretation', () => {
  for (const s of [null, {}, { supported: false }, S.build([O.observePitch({ resolutionMode: 'compressedPlateAppearance' })])]) {
    assert.deepEqual(I.interpret(s), { supported: false, version: I.VERSION, reason: 'UNSUPPORTED_SEQUENCE_STATE', interpretations: [] });
  }
});
test('18 wrong Sequence version rejects before reading counters', () => {
  const s = { supported: true, version: 'future' };
  Object.defineProperty(s, 'sequence', { get() { throw Error('Premature counter read'); } });
  assert.equal(I.interpret(s).reason, 'SEQUENCE_VERSION_MISMATCH');
});
test('19 missing malformed negative fractional or oversized consumed facts reject', () => {
  for (const mutate of [s => { s.paIdentity = 'npc'; }, s => { s.pitchCount = -1; }, s => { s.pitchCount = 1.5; },
    s => { delete s.sequence; }, s => { delete s.contact; }, s => { delete s.sequence.consecutiveChases; },
    s => { s.sequence.consecutiveTakes = -1; }, s => { s.sequence.consecutiveTakes = NaN; },
    s => { s.sequence.consecutiveTakes = '2'; }, s => { s.sequence.consecutiveTakes = 2.5; },
    s => { s.sequence.consecutiveTakes = 4; }, s => { s.contact.hardContactsOnLocationMiss = Infinity; }]) {
    const s = clone(repeat(['BATTER_TOOK_BALL'], 3)); mutate(s);
    assert.deepEqual(I.interpret(s), { supported: false, version: I.VERSION, reason: 'INVALID_SEQUENCE_STATE', interpretations: [] });
  }
});
test('20 zero-pitch initial Sequence state is supported without patterns', () => assert.deepEqual(types(S.createInitialSequenceState(PA)), []));
test('21 absent observations and PA-wide counts do not create streak patterns or foul pressure', () => {
  const s = state([['BATTER_CHASED', 'SWING_MISS', 'TARGET_HIT', 'VELOCITY_DOWN'], [], ['BATTER_CHASED', 'SWING_MISS', 'TARGET_HIT', 'VELOCITY_DOWN'], []]);
  assert.deepEqual(types(s), []); assert.deepEqual(types(repeat(['FOUL'], 4)), []);
});
test('22 fixed ordering and every interpretation has only minimal owned evidence', () => {
  const s = state([['HARD_CONTACT', 'HARD_CONTACT_ON_LOCATION_MISS'], ...Array.from({ length: 3 }, () => ['BATTER_TOOK_STRIKE', 'TARGET_HIT', 'VELOCITY_DOWN'])]);
  assert.deepEqual(types(s), ['TAKE_PATTERN_PRESENT', 'TAKE_PATTERN_STRONG', 'CALLED_STRIKE_PATTERN_PRESENT', 'REPEATED_TARGET_HITS', 'VELOCITY_DOWN_PATTERN', 'LOCATION_MISS_PUNISHED']);
  for (const row of I.interpret(s).interpretations) {
    assert.deepEqual(Object.keys(row), ['type', 'scope', 'source', 'reasonCode', 'evidence']);
    assert.equal(Object.keys(row.evidence).length, 1); assert.equal(row.scope, 'CURRENT_PA'); assert(row.reasonCode);
  }
  assert.equal(I.INTERPRETATION_TYPES.length, 8);
});
test('23 missing browser Sequence dependency fails explicitly', () => {
  const context = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(__dirname, '../pitch-tactical-interpretation-foundation.js'), 'utf8'), context);
  assert.equal(context.PitchTacticalInterpretationFoundation.interpret({}).reason, 'DEPENDENCIES_UNAVAILABLE');
});
test('24 a new PA carries no interpretations from previous PA', () => {
  assert(types(repeat(['BATTER_TOOK_BALL'], 3)).length);
  assert.deepEqual(types(S.createInitialSequenceState(PA.replace('pa-1', 'pa-2'))), []);
});
console.log('INTERPRETATION_UNIT_JSON=' + JSON.stringify({ passed, failed: 0, rebuilds: 100, rngDraws: draws, sequenceMutations: 0 }));
