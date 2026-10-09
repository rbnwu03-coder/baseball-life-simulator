'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path'), vm = require('vm');
const G = require('../pitch-tactical-signal-projection-foundation');
const I = require('../pitch-tactical-interpretation-foundation'), S = require('../pitch-sequence-state-foundation');
const P = require('../offensive-plate-approach');
const clone = value => JSON.parse(JSON.stringify(value));
const PA = 'signal-unit|current-pa|player|1|top';
// Explicit metadata UNIT FIXTURES, never natural production witnesses.
function wrapper(types = [], pitchCount = 3) {
  return { supported: true, version: I.VERSION, paIdentity: PA, pitchCount,
    interpretations: types.map(type => ({ type, scope: 'CURRENT_PA', source: I.SOURCE, reasonCode: 'UNIT_METADATA_FIXTURE' })) };
}
function boundary(overrides = {}) {
  const state = P.createPlateAppearanceState({ paIdentity: PA, pitchNumber: 3, balls: 1, strikes: 1, ...overrides });
  return { paIdentity: state.paIdentity, completedPitchCount: state.pitchNumber, pitchNumber: state.pitchNumber,
    completed: state.completed, awaitingDefense: state.awaitingDefense, result: state.result, balls: state.balls, strikes: state.strikes };
}
function permutations(items) {
  return items.length ? items.flatMap((item, index) => permutations(items.filter((_, other) => other !== index)).map(rest => [item, ...rest])) : [[]];
}
function main() {
  let passed = 0, rngDraws = 0, forbiddenReads = 0;
  const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
  const types = ['TAKE_PATTERN_PRESENT', 'TAKE_PATTERN_STRONG', 'CALLED_STRIKE_PATTERN_PRESENT', 'CHASE_PATTERN_PRESENT', 'SWING_MISS_PATTERN_PRESENT'];
  const project = list => G.project(wrapper(list), boundary());
  const reject = (input, live, reason) => {
    const result = G.project(input, live);
    assert.deepEqual(result, { supported: false, version: G.VERSION, status: 'unavailable', reason, signals: [] });
  };
  const originalRandom = Math.random;
  Math.random = () => { rngDraws++; throw Error('Signal projection RNG'); };
  try {
    test('1 empty Interpretation on live PA has no signals', () => {
      const result = project([]); assert(result.supported); assert.equal(result.status, 'live'); assert.deepEqual(result.signals, []);
      assert.equal(result.completedPitchCount, 3); assert.equal(result.nextPitchNumber, 4);
    });
    test('2 Take Present maps to one present fact', () => {
      assert.deepEqual(project(['TAKE_PATTERN_PRESENT']).signals, [{ type: 'takePattern', scope: 'CURRENT_PA_NEXT_PITCH_SIGNAL',
        sourceInterpretations: ['TAKE_PATTERN_PRESENT'], strength: 'present' }]);
    });
    test('3 Take Strong supplements Present without a duplicate signal', () => {
      const signals = project(types.slice(0, 2)).signals; assert.equal(signals.length, 1); assert.equal(signals[0].strength, 'strong');
      assert.deepEqual(signals[0].sourceInterpretations, types.slice(0, 2));
    });
    test('4 Called Strike maps to its own fact', () => assert.equal(project([types[2]]).signals[0].type, 'calledStrikePattern'));
    test('5 Chase maps to its own fact', () => assert.equal(project([types[3]]).signals[0].type, 'chasePattern'));
    test('6 Swing Miss maps to its own fact', () => assert.equal(project([types[4]]).signals[0].type, 'swingMissPattern'));
    test('7 parallel facts all survive in the fixed serialization order', () => {
      assert.deepEqual(project(types).signals.map(x => x.type), G.SIGNAL_TYPES);
      assert.deepEqual(project([types[3], types[4]]).signals.map(x => x.type), ['chasePattern', 'swingMissPattern']);
      assert.deepEqual(project([types[0], types[2]]).signals.map(x => x.type), ['takePattern', 'calledStrikePattern']);
    });
    test('8 all 120 ready-type permutations serialize identically', () => {
      const expected = project([...types, ...G.DEFERRED_INTERPRETATIONS]);
      for (const order of permutations(types)) assert.deepEqual(project([...G.DEFERRED_INTERPRETATIONS].reverse().concat(order)), expected);
    });
    test('9 repeated target hits are recognized and deferred', () => {
      const result = project(['REPEATED_TARGET_HITS']); assert(result.supported); assert.deepEqual(result.signals, []);
      assert.deepEqual(result.deferredInterpretations, ['REPEATED_TARGET_HITS']);
    });
    test('10 location miss punishment with fabricated live metadata cannot become a signal', () => {
      const result = project(['LOCATION_MISS_PUNISHED']); assert.equal(result.status, 'live'); assert.deepEqual(result.signals, []);
      assert.deepEqual(result.deferredInterpretations, ['LOCATION_MISS_PUNISHED']);
    });
    test('11 completed PA excludes even a strong take pattern', () => {
      const result = G.project(wrapper(types.slice(0, 2)), boundary({ completed: true }));
      assert.equal(result.status, 'postPa'); assert.equal(result.nextPitchNumber, null); assert.deepEqual(result.signals, []);
    });
    test('12 existing Pending result lifecycle excludes awaiting defense', () => {
      const live = boundary({ completed: true, result: 'groundBallPending' });
      assert.equal(live.completed, false); assert.equal(live.awaitingDefense, true);
      assert.equal(G.project(wrapper(types), live).status, 'postPa'); assert.deepEqual(G.project(wrapper(types), live).signals, []);
    });
    test('13 three strikes are post-PA evidence', () => {
      const result = G.project(wrapper(types), boundary({ strikes: 3 })); assert.equal(result.status, 'postPa'); assert.deepEqual(result.signals, []);
    });
    test('14 four balls are post-PA evidence', () => {
      const result = G.project(wrapper(types), boundary({ balls: 4 })); assert.equal(result.status, 'postPa'); assert.deepEqual(result.signals, []);
    });
    test('15 different PA identities are unavailable', () => reject(wrapper(types), { ...boundary(), paIdentity: 'signal-unit|next-pa|player|1|top' }, 'PA_IDENTITY_MISMATCH'));
    test('16 each completed-pitch boundary mismatch is unavailable', () => {
      reject(wrapper(types, 2), boundary(), 'PITCH_BOUNDARY_MISMATCH');
      reject(wrapper(types), { ...boundary(), pitchNumber: 4 }, 'PITCH_BOUNDARY_MISMATCH');
      reject(wrapper(types), { ...boundary(), completedPitchCount: 4 }, 'PITCH_BOUNDARY_MISMATCH');
    });
    test('17 truly unknown Interpretation types reject explicitly', () => reject(wrapper(['NEW_UNKNOWN_PATTERN']), boundary(), 'UNKNOWN_INTERPRETATION_TYPE'));
    test('18 one hundred projections are deeply identical', () => {
      const input = wrapper([...types, ...G.DEFERRED_INTERPRETATIONS]), live = boundary(), expected = G.project(input, live);
      for (let n = 0; n < 100; n++) assert.deepEqual(G.project(input, live), expected);
    });
    test('19 browser API reads only Interpretation metadata and uses no RNG/hash/clock', () => {
      const deny = key => { forbiddenReads++; throw Error('Forbidden projection read: ' + String(key)); };
      const owner = new Proxy(I, { get(target, key) {
        if (!['VERSION', 'SOURCE', 'INTERPRETATION_TYPES'].includes(key)) return deny(key);
        return target[key];
      } });
      const context = { PitchTacticalInterpretationFoundation: owner, Math: Object.create(Math), Date: { now: () => deny('clock') } };
      context.Math.random = () => deny('Math.random');
      for (const key of ['PitchObservationFoundation', 'PitchSequenceStateFoundation', 'PitchTacticalDecisionFoundation',
        'PitchTacticalDecisionProductionAdapter', 'PitcherCatcherTacticalIntegration', 'tacticalHash', 'gameRng']) {
        Object.defineProperty(context, key, { get: () => deny(key) });
      }
      vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../pitch-tactical-signal-projection-foundation.js'), 'utf8'), context);
      assert.deepEqual(clone(context.PitchTacticalSignalProjectionFoundation.project(wrapper(types), boundary())), project(types));
      assert.equal(forbiddenReads, 0);
    });
    test('20 inputs stay mutable and unchanged; output is detached and deeply immutable', () => {
      const input = wrapper(types), live = boundary(), snapshots = [clone(input), clone(live)];
      const result = G.project(input, live);
      assert.deepEqual(input, snapshots[0]); assert.deepEqual(live, snapshots[1]);
      assert(!Object.isFrozen(input)); assert(!Object.isFrozen(input.interpretations)); assert(!Object.isFrozen(input.interpretations[0])); assert(!Object.isFrozen(live));
      const frozen = value => { if (value && typeof value === 'object') { assert(Object.isFrozen(value)); Object.values(value).forEach(frozen); } };
      frozen(result);
      input.interpretations[0].type = 'NEW_UNKNOWN_PATTERN'; input.interpretations.length = 0; live.paIdentity = 'changed';
      assert.equal(result.signals[0].sourceInterpretations[0], 'TAKE_PATTERN_PRESENT'); assert.equal(result.paIdentity, PA);
      assert.throws(() => result.signals[0].sourceInterpretations.push('changed'), TypeError);
      assert.throws(() => { result.signals[0].strength = 'changed'; }, TypeError);
    });
    test('21 velocity down is deferred, and all eight owner types are accounted for', () => {
      assert.deepEqual(project(['VELOCITY_DOWN_PATTERN']).deferredInterpretations, ['VELOCITY_DOWN_PATTERN']);
      assert.deepEqual([...types, ...G.DEFERRED_INTERPRETATIONS].sort(), [...I.INTERPRETATION_TYPES].sort());
      assert.deepEqual(project([...G.DEFERRED_INTERPRETATIONS]).signals, []);
    });
    test('22 terminal result alone closes next-pitch availability', () => {
      const result = G.project(wrapper(types), boundary({ result: 'single', completed: false }));
      assert.equal(result.status, 'postPa'); assert.deepEqual(result.signals, []);
    });
    test('23 awaitingDefense alone closes availability without manufacturing a result', () => {
      const result = G.project(wrapper(types), { ...boundary(), awaitingDefense: true });
      assert.equal(result.status, 'postPa'); assert.deepEqual(result.signals, []);
    });
    test('24 fresh PA starts live with no inherited signal', () => {
      const state = P.createPlateAppearanceState({ paIdentity: 'signal-unit|fresh-pa|player|2|top' });
      const interpretation = I.interpret(S.createInitialSequenceState(state.paIdentity));
      const result = G.project(interpretation, { ...boundary({ pitchNumber: 0, balls: 0, strikes: 0 }), paIdentity: state.paIdentity });
      assert.equal(result.status, 'live'); assert.equal(result.nextPitchNumber, 1); assert.deepEqual(result.signals, []);
    });
    test('25 balls/strikes below terminal thresholds never change signal semantics', () => {
      const expected = project(types);
      for (let balls = 0; balls < 4; balls++) for (let strikes = 0; strikes < 3; strikes++) {
        assert.deepEqual(G.project(wrapper(types), boundary({ balls, strikes })), expected);
      }
    });
    test('26 evidence, raw history, Decision, Adapter and production fields are unreachable', () => {
      const deny = key => { forbiddenReads++; throw Error('Forbidden data read: ' + String(key)); };
      const input = wrapper(types), live = boundary();
      for (const item of input.interpretations) Object.defineProperty(item, 'evidence', { get: () => deny('evidence') });
      const guard = (target, keys) => new Proxy(target, { get(object, key) {
        if (!keys.includes(key)) return deny(key); return object[key];
      }, ownKeys() { return deny('ownKeys'); } });
      const guardedInput = guard(input, ['supported', 'version', 'paIdentity', 'pitchCount', 'interpretations']);
      const guardedBoundary = guard(live, ['paIdentity', 'completedPitchCount', 'pitchNumber', 'completed', 'awaitingDefense', 'result', 'balls', 'strikes']);
      assert.deepEqual(G.project(guardedInput, guardedBoundary), project(types)); assert.equal(forbiddenReads, 0);
    });
    test('27 outputs contain no policy, priority, candidate or scoring fields', () => {
      const forbidden = ['intent', 'selectedIntent', 'candidateIntent', 'primary', 'priority', 'confidence', 'score', 'weight', 'probability', 'recommendedClass', 'target', 'pitchType'];
      const walk = value => { if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) { assert(!forbidden.includes(key), key); walk(child); } };
      walk(project([...types, ...G.DEFERRED_INTERPRETATIONS]));
    });
    test('28 unsupported or mismatched-version wrappers reject', () => {
      reject(null, boundary(), 'UNSUPPORTED_INTERPRETATION'); reject({ ...wrapper(), supported: false }, boundary(), 'UNSUPPORTED_INTERPRETATION');
      reject({ ...wrapper(), version: 'different' }, boundary(), 'INTERPRETATION_VERSION_MISMATCH');
    });
    test('29 malformed identities, counts and missing interpretation arrays reject', () => {
      for (const changes of [{ paIdentity: 'bad' }, { pitchCount: -1 }, { pitchCount: 1.5 }, { pitchCount: NaN },
        { pitchCount: Number.MAX_SAFE_INTEGER + 1 }, { interpretations: null }]) reject({ ...wrapper(), ...changes }, boundary(), 'INVALID_INTERPRETATION_WRAPPER');
      reject(wrapper(['TAKE_PATTERN_PRESENT'], 0), boundary({ pitchNumber: 0 }), 'INVALID_INTERPRETATION_WRAPPER');
    });
    test('30 malformed lifecycle metadata and out-of-range counts reject without coercion', () => {
      for (const changes of [{ completed: undefined }, { completed: 1 }, { awaitingDefense: 'false' }, { result: null },
        { balls: 5 }, { strikes: 4 }, { balls: -1 }, { strikes: 1.5 }, { balls: '1' }, { pitchNumber: -1 },
        { completedPitchCount: Number.MAX_SAFE_INTEGER }, { paIdentity: 'bad' }]) reject(wrapper(), { ...boundary(), ...changes }, 'INVALID_LIVE_BOUNDARY');
      reject(wrapper(), null, 'INVALID_LIVE_BOUNDARY');
    });
    test('31 item scope/source/reason and duplicate metadata must be canonical', () => {
      for (const changes of [{ scope: 'CROSS_PA' }, { source: 'Decision' }, { reasonCode: '' }, { reasonCode: null }]) {
        const input = wrapper(['TAKE_PATTERN_PRESENT']); Object.assign(input.interpretations[0], changes);
        reject(input, boundary(), 'INVALID_INTERPRETATION_ITEM');
      }
      reject(wrapper(['TAKE_PATTERN_PRESENT', 'TAKE_PATTERN_PRESENT']), boundary(), 'DUPLICATE_INTERPRETATION_TYPE');
      reject(wrapper(['TAKE_PATTERN_STRONG']), boundary(), 'INCONSISTENT_TAKE_PATTERN');
    });
    test('32 browser dependency failure is explicit and immutable', () => {
      const context = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../pitch-tactical-signal-projection-foundation.js'), 'utf8'), context);
      const result = context.PitchTacticalSignalProjectionFoundation.project(wrapper(), boundary());
      assert.equal(result.reason, 'DEPENDENCIES_UNAVAILABLE'); assert(Object.isFrozen(result)); assert(Object.isFrozen(result.signals));
    });
    test('33 terminal status does not conceal a structural mismatch', () => {
      reject(wrapper(types, 2), boundary({ completed: true }), 'PITCH_BOUNDARY_MISMATCH');
      reject(wrapper(['NEW_UNKNOWN_PATTERN']), boundary({ completed: true }), 'UNKNOWN_INTERPRETATION_TYPE');
    });
    test('34 every exported vocabulary/API and unsupported output is frozen', () => {
      assert(Object.isFrozen(G)); assert(Object.isFrozen(G.SIGNAL_TYPES)); assert(Object.isFrozen(G.DEFERRED_INTERPRETATIONS));
      const result = G.project(null, boundary()); assert(Object.isFrozen(result)); assert(Object.isFrozen(result.signals));
      assert.equal(rngDraws, 0); assert.equal(forbiddenReads, 0);
    });
  } finally { Math.random = originalRandom; }
  const summary = { suite: 'pitch-tactical-signal-projection-foundation', passed, failed: 0, permutations: 120, deterministicRebuilds: 100,
    rngDraws, tacticalHashDraws: 0, forbiddenReads, inputMutations: 0 };
  console.log(JSON.stringify(summary)); return summary;
}
if (require.main === module) main();
module.exports = { main };
