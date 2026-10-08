'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path'), vm = require('vm');
const O = require('../pitch-observation-foundation');
const S = require('../pitch-sequence-state-foundation');
const clone = value => JSON.parse(JSON.stringify(value));
const PA = 'sequence-test|pa-1|player|1|top';
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
// Observation-contract fixtures, not fabricated production pitch histories.
function observed(n, types, before = { balls: 0, strikes: 0 }, after = before, pa = PA) {
  const identity = { paIdentity: pa, pitchNumber: n, pitchId: `${pa}|pitch-${n}` };
  return { supported: true, version: O.VERSION, ...identity, countBefore: clone(before), countAfter: clone(after),
    observations: types.map(type => ({ type, ...identity, source: O.SOURCE, evidence: {} })) };
}
const takes = () => [
  observed(1, ['TARGET_HIT', 'GOOD_VELOCITY', 'BATTER_TOOK_STRIKE'], { balls: 0, strikes: 0 }, { balls: 0, strikes: 1 }),
  observed(2, ['VELOCITY_DOWN', 'BATTER_TOOK_BALL'], { balls: 0, strikes: 1 }, { balls: 1, strikes: 1 }),
  observed(3, ['MISS_HIGH', 'LARGE_LOCATION_MISS', 'BATTER_TOOK_STRIKE'], { balls: 1, strikes: 1 }, { balls: 1, strikes: 2 })
];
function build(input) { const state = S.build(input); assert(state.supported, state.reason); return state; }

test('1 single pitch counts target hit and take once', () => {
  const s = build([takes()[0]]); assert.equal(s.pitchCount, 1); assert.equal(s.location.targetHits, 1);
  assert.equal(s.batterResponse.totalTakes, 1); assert.equal(s.batterResponse.tookStrike, 1);
});
test('2 multiple pitches accumulate all aggregate families', () => {
  const input = takes(); input[2] = observed(3, ['MISS_LOW', 'LARGE_LOCATION_MISS', 'BATTER_CHASED', 'SWING_MISS'], input[2].countBefore, input[2].countAfter);
  const s = build(input);
  assert.deepEqual(s.location, { targetHits: 1, missHigh: 0, missLow: 1, largeMisses: 1, measuredPitches: 2, unobservedPitches: 1 });
  assert.deepEqual(s.batterResponse, { totalTakes: 2, totalSwings: 1, unobservedResponses: 0, tookStrike: 1, tookBall: 1, chased: 1, swungInZone: 0, swingMiss: 1, foul: 0, hardContact: 0 });
  assert.deepEqual(s.velocity, { goodVelocityCount: 1, velocityDownCount: 1, unobservedPitches: 1 });
  assert.deepEqual(s.contact, { swingMisses: 1, fouls: 0, hardContacts: 0, hardContactsOnLocationMiss: 0 });
});
test('3 current count copies countAfter without observation-based settlement', () => {
  const p = observed(1, ['BATTER_TOOK_BALL'], undefined, { balls: 2, strikes: 1 });
  assert.deepEqual(build([p]).currentCount, p.countAfter);
});
test('4 different PA identities cannot merge', () => {
  const input = takes(); input[1] = observed(2, ['BATTER_TOOK_BALL'], input[1].countBefore, input[1].countAfter, PA.replace('pa-1', 'pa-2'));
  assert.equal(S.build(input).reason, 'PA_IDENTITY_MISMATCH');
});
test('5 out-of-order or missing first pitch is rejected, not sorted', () => {
  const p = takes(); assert.equal(S.build([p[0], p[2], p[1]]).reason, 'PITCH_ORDER_DISCONTINUITY');
  assert.equal(S.build(p.slice(1)).reason, 'PITCH_ORDER_DISCONTINUITY');
});
test('6 duplicate pitches cannot double apply even outside recent window', () => {
  const input = Array.from({ length: 5 }, (_, i) => observed(i + 1, ['FOUL', 'BATTER_SWUNG_IN_ZONE']));
  const s = build(input), before = clone(s);
  assert.equal(S.appendPitchObservation(s, input[0]).reason, 'DUPLICATE_PITCH'); assert.deepEqual(s, before);
});
test('7 consecutive takes span strike and ball observations', () => assert.equal(build(takes()).sequence.consecutiveTakes, 3));
test('8 swing and missing response reset take streak without guessing', () => {
  const input = takes(), count = input.at(-1).countAfter;
  const s = build([...input, observed(4, ['BATTER_SWUNG_IN_ZONE', 'FOUL'], count, count)]);
  assert.equal(s.sequence.consecutiveTakes, 0); assert.equal(s.sequence.consecutiveSwings, 1);
  const unknown = S.appendPitchObservation(s, observed(5, ['GOOD_VELOCITY'], count, count));
  assert(unknown.supported); assert.equal(unknown.sequence.consecutiveSwings, 0); assert.equal(unknown.batterResponse.unobservedResponses, 1);
});
test('9 absent location observations never imply hit or miss', () => {
  const s = build([observed(1, ['BATTER_TOOK_BALL'])]);
  assert.deepEqual(s.location, { targetHits: 0, missHigh: 0, missLow: 0, largeMisses: 0, measuredPitches: 0, unobservedPitches: 1 });
});
test('10 one hard-contact pitch increments once despite multiple swing facts', () => {
  const s = build([observed(1, ['BATTER_SWUNG_IN_ZONE', 'HARD_CONTACT'])]);
  assert.equal(s.contact.hardContacts, 1); assert.equal(s.batterResponse.hardContact, 1); assert.equal(s.batterResponse.totalSwings, 1);
});
test('11 hard contact on miss has separate aggregate without creating location types', () => {
  const s = build([observed(1, ['HARD_CONTACT', 'HARD_CONTACT_ON_LOCATION_MISS'])]);
  assert.equal(s.contact.hardContacts, 1); assert.equal(s.contact.hardContactsOnLocationMiss, 1);
  assert.equal(s.location.measuredPitches, 0); assert.equal(s.location.largeMisses, 0);
});
test('12 unknown observation types are explicitly rejected', () => assert.equal(S.build([observed(1, ['BATTER_PASSIVE'])]).reason, 'UNKNOWN_OBSERVATION_TYPE'));
test('13 same observation sequence rebuilds identically 100 times', () => {
  const input = takes(), expected = build(input); for (let i = 0; i < 100; i++) assert.deepEqual(build(input), expected);
});
test('14 browser reducer is RNG-free and does not call observation or production logic', () => {
  let draws = 0, cursor = 123;
  const api = new Proxy(O, { get(target, key) { assert(['VERSION', 'SOURCE', 'OBSERVATION_TYPES'].includes(key), 'unexpected owner call ' + String(key)); return target[key]; } });
  const context = vm.createContext({ PitchObservationFoundation: api,
    Math: Object.assign(Object.create(Math), { random() { draws++; cursor++; throw Error('Sequence RNG'); } }) });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../pitch-sequence-state-foundation.js'), 'utf8'), context);
  for (let i = 0; i < 100; i++) assert.deepEqual(clone(context.PitchSequenceStateFoundation.build(takes())), build(takes()));
  assert.equal(draws, 0); assert.equal(cursor, 123);
});
test('15 source and previous state remain detached and unchanged', () => {
  const input = takes(), before = clone(input), previous = build(input.slice(0, 2)), previousBefore = clone(previous);
  const s = S.appendPitchObservation(previous, input[2]); assert(s.supported);
  assert.deepEqual(input, before); assert.deepEqual(previous, previousBefore);
  assert(!Object.isFrozen(input)); assert(!Object.isFrozen(input[2].countAfter));
  assert(Object.isFrozen(s)); assert(Object.isFrozen(s.recentPitches)); assert(Object.isFrozen(s.recentPitches[0].observationTypes));
  input[2].countAfter.balls = 3; assert.equal(s.currentCount.balls, 1);
  assert.notEqual(s.recentPitches[0], previous.recentPitches[0]);
});
test('16 incremental append equals every full-prefix rebuild', () => {
  const input = takes(); let state = S.createInitialSequenceState(PA);
  input.forEach((pitch, i) => { state = S.appendPitchObservation(state, pitch); assert.deepEqual(state, build(input.slice(0, i + 1))); });
});
test('17 recent window stays three minimal pitches while totals span full PA', () => {
  const s = build(Array.from({ length: 6 }, (_, i) => observed(i + 1, ['FOUL', 'BATTER_SWUNG_IN_ZONE'])));
  assert.equal(S.RECENT_WINDOW, 3); assert.deepEqual(s.recentPitches.map(p => p.pitchNumber), [4, 5, 6]);
  assert.equal(s.contact.fouls, 6); assert.equal(s.sequence.consecutiveSwings, 6);
  assert.deepEqual(Object.keys(s.lastPitch), ['pitchId', 'pitchNumber', 'observationTypes']);
});
test('18 count discontinuity rejects without recomputing balls or strikes', () => {
  const input = takes(); input[1].countBefore.strikes = 0; assert.equal(S.build(input).reason, 'COUNT_DISCONTINUITY');
  const first = takes()[0]; first.countBefore.balls = 1; assert.equal(S.build([first]).reason, 'COUNT_DISCONTINUITY');
  const walk = build(Array.from({ length: 4 }, (_, i) => observed(i + 1, ['BATTER_TOOK_BALL'], { balls: i, strikes: 0 }, { balls: i + 1, strikes: 0 })));
  assert.deepEqual(walk.currentCount, { balls: 4, strikes: 0 });
  assert.equal(S.appendPitchObservation(walk, observed(5, ['BATTER_TOOK_BALL'], { balls: 3, strikes: 0 }, { balls: 4, strikes: 0 })).reason, 'COUNT_ALREADY_TERMINAL');
});
test('19 unsupported wrappers, raw summaries, and empty input cannot create states', () => {
  for (const p of [O.observePitch({ resolutionMode: 'compressedPlateAppearance' }), { result: 'strikeout' }, null]) {
    const r = S.build([p]); assert.equal(r.supported, false); assert(!Object.hasOwn(r, 'pitchCount'));
  }
  for (const input of [[], null, {}]) assert.equal(S.build(input).reason, 'EMPTY_OR_INVALID_SEQUENCE');
});
test('20 malformed identity, version, counts and duplicate types reject', () => {
  for (const mutate of [p => { p.version = 'future'; }, p => { p.pitchId = 'other'; }, p => { delete p.countAfter; },
    p => { p.observations[0].source = 'other'; }, p => { p.observations[0].paIdentity = 'other'; }]) {
    const p = takes()[0]; mutate(p); assert.equal(S.build([p]).supported, false);
  }
  const p = takes()[0]; p.observations.push(clone(p.observations[0])); assert.equal(S.build([p]).reason, 'DUPLICATE_OBSERVATION_TYPE');
});
test('21 contradictory types and orphan hard-on-miss reject', () => {
  for (const types of [['BATTER_TOOK_BALL', 'BATTER_TOOK_STRIKE'], ['BATTER_TOOK_STRIKE', 'FOUL'],
    ['BATTER_CHASED', 'BATTER_SWUNG_IN_ZONE'], ['GOOD_VELOCITY', 'VELOCITY_DOWN'], ['MISS_HIGH', 'MISS_LOW'], ['TARGET_HIT', 'LARGE_LOCATION_MISS'],
    ['SWING_MISS', 'HARD_CONTACT'], ['FOUL', 'HARD_CONTACT'], ['HARD_CONTACT_ON_LOCATION_MISS']]) {
    assert.equal(S.build([observed(1, types)]).reason, 'CONFLICTING_OBSERVATIONS');
  }
});
test('22 evidence and raw truth are not read or reclassified', () => {
  const p = observed(1, ['BATTER_TOOK_BALL']);
  p.observations[0].evidence = new Proxy({}, { get() { throw Error('Evidence reparse'); }, ownKeys() { throw Error('Evidence enumeration'); } });
  for (const key of ['pitch', 'action', 'zone', 'pitchResult', 'pitchType', 'targetIntent', 'contactQuality']) Object.defineProperty(p, key, { get() { throw Error('Raw truth access'); } });
  const s = build([p]); assert.equal(s.batterResponse.tookBall, 1); assert.equal(s.location.measuredPitches, 0);
  assert.equal(s.velocity.goodVelocityCount, 0); assert.equal(s.contact.hardContacts, 0);
});
test('23 observation order is canonicalized, no strategy or extra input fields retained', () => {
  const p = takes()[0], expected = build([p]); p.observations.reverse(); p.strategy = 'repeatSuccess'; p.pitchType = 'fastball';
  const s = build([p]); assert.deepEqual(s, expected); assert(!Object.hasOwn(s, 'strategy')); assert(!JSON.stringify(s).includes('fastball'));
});
test('24 streaks record only consecutive observed facts and reset on absence', () => {
  const input = [observed(1, ['MISS_HIGH', 'BATTER_CHASED', 'SWING_MISS', 'VELOCITY_DOWN']),
    observed(2, ['BATTER_CHASED', 'SWING_MISS', 'VELOCITY_DOWN']), observed(3, ['TARGET_HIT', 'FOUL', 'BATTER_SWUNG_IN_ZONE'])];
  const two = build(input.slice(0, 2)); assert.equal(two.sequence.consecutiveChases, 2); assert.equal(two.sequence.consecutiveSwingMisses, 2); assert.equal(two.sequence.consecutiveVelocityDown, 2);
  const three = build(input); assert.equal(three.sequence.consecutiveChases, 0); assert.equal(three.sequence.consecutiveSwingMisses, 0); assert.equal(three.sequence.consecutiveVelocityDown, 0); assert.equal(three.sequence.consecutiveTargetHits, 1);
});
test('25 invalid prior state and unavailable browser owner are explicit failures', () => {
  assert.equal(S.appendPitchObservation({}, takes()[0]).reason, 'INVALID_PREVIOUS_STATE');
  const context = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(__dirname, '../pitch-sequence-state-foundation.js'), 'utf8'), context);
  assert.equal(context.PitchSequenceStateFoundation.build(takes()).reason, 'DEPENDENCIES_UNAVAILABLE');
  assert.equal(S.createInitialSequenceState('npc').supported, false);
});
console.log('SEQUENCE_UNIT_JSON=' + JSON.stringify({ passed, failed: 0, rebuilds: 100, rngDraws: 0, sourceMutations: 0, previousStateMutations: 0 }));
