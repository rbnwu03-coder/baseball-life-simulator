'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const P = require('../offensive-plate-approach');
const B = require('../batted-ball-physical');
const O = require('../pitch-observation-foundation');
const clone = value => JSON.parse(JSON.stringify(value));
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };

function fixture({ cls = 'competitiveStrike', actualVertical = 'middle', targetVertical = 'middle', error = 0,
  action = 'take', result, velocity = 89, physical = false } = {}) {
  const state = P.createPlateAppearanceState({ matchId: 'observation-test', paId: 'pa-1', batterId: 'player', inning: 1, half: 'top' });
  const pitch = clone(P.generatePitchOpportunity(state, { pitchLocationClass: cls, pitchType: 'fastball', velocity }));
  pitch.location = `outer-${actualVertical}-${{ competitiveStrike: 'strike', chasePitch: 'chase', clearBall: 'ball' }[cls]}`;
  pitch.targetIntent = P.normalizeTargetIntent({ horizontal: 'away', vertical: targetVertical,
    zoneIntent: pitch.strike ? 'strike' : 'chase', frame: 'batterRelative' }, cls);
  pitch.locationRealization = { targetSource: 'tacticalTarget', targetError: error,
    executionClassification: error === 0 ? 'hitTarget' : error === 1 ? 'nearTarget' : 'missedTarget' };
  const pitchResult = result || (action === 'take' ? pitch.strike ? 'calledStrike' : 'ball' : 'swingingStrike');
  const event = { pitchNumber: 1, pitch, action, plateDecision: action === 'take' ? 'take' : 'contactSwing', pitchResult,
    contact: action === 'take' ? null : ['foul', 'ballInPlay'].includes(pitchResult), contactQuality: null,
    countBefore: { balls: 0, strikes: 0 },
    countAfter: { balls: pitchResult === 'ball' ? 1 : 0, strikes: ['calledStrike', 'swingingStrike', 'foul'].includes(pitchResult) ? 1 : 0 } };
  if (physical) {
    event.battedBallPhysicalTruth = B.resolveBattedBallPhysicalTruth({ identity: pitch.pitchId, actualPitch: { ...pitch, attackability: 1 },
      recognition: { correct: true }, action: 'swing', contact: true, swingIntent: 'contact',
      abilities: { batting: 20, power: 20 }, rolls: { contactQuality: .9, ballType: .5, pace: .9, direction: .5, depth: .5 } });
    event.contactQuality = event.battedBallPhysicalTruth.executionEvidence.continuousContactScore;
  }
  return clone(event);
}
function types(event) {
  const output = O.observePitch(event);
  assert.equal(output.supported, true, output.reason);
  return output.observations.map(x => x.type);
}
const has = (event, type) => types(event).includes(type);

test('1 target hit excludes miss observations', () => {
  const t = types(fixture()); assert(t.includes('TARGET_HIT'));
  for (const type of ['MISS_HIGH', 'MISS_LOW', 'LARGE_LOCATION_MISS']) assert(!t.includes(type));
});
test('2 actual above target emits miss high', () => assert(has(fixture({ actualVertical: 'high', error: 1 }), 'MISS_HIGH')));
test('3 actual below target emits miss low', () => assert(has(fixture({ actualVertical: 'low', error: 1 }), 'MISS_LOW')));
test('4 large miss uses existing error threshold', () => {
  assert(has(fixture({ error: 2 }), 'LARGE_LOCATION_MISS'));
  assert(!has(fixture({ error: 1 }), 'LARGE_LOCATION_MISS'));
});
test('5 chase derives from actual zone independent of target', () => {
  const e = fixture({ cls: 'chasePitch', action: 'swing' });
  assert(has(e, 'BATTER_CHASED'));
  const changed = clone(e); changed.pitch.targetIntent = null;
  assert.deepEqual(O.observePitch(e).observations.filter(o => o.type === 'BATTER_CHASED'),
    O.observePitch(changed).observations.filter(o => o.type === 'BATTER_CHASED'));
  assert(!has(fixture({ action: 'swing' }), 'BATTER_CHASED'));
});
test('6 took strike', () => assert(has(fixture(), 'BATTER_TOOK_STRIKE')));
test('7 took ball', () => assert(has(fixture({ cls: 'clearBall' }), 'BATTER_TOOK_BALL')));
test('8 swung in actual zone', () => assert(has(fixture({ action: 'swing' }), 'BATTER_SWUNG_IN_ZONE')));
test('9 swing miss excludes called strike', () => {
  assert(has(fixture({ action: 'swing' }), 'SWING_MISS'));
  assert(!has(fixture(), 'SWING_MISS'));
});
test('10 foul without invented contact quality', () => {
  const e = fixture({ action: 'swing', result: 'foul' });
  e.contactQuality = 1; e.tacticalFeedback = { observableBatterResponse: { hardContactObservable: true } };
  assert(has(e, 'FOUL')); assert(!has(e, 'HARD_CONTACT'));
});
test('11 fair contact score threshold is inclusive and uses physical authority', () => {
  const e = fixture({ action: 'swing', result: 'ballInPlay', physical: true });
  for (const [score, expected] of [[.7199, false], [.72, true], [.74, true]]) {
    e.contactQuality = score;
    e.battedBallPhysicalTruth.executionEvidence.continuousContactScore = score;
    assert.equal(has(e, 'HARD_CONTACT'), expected);
  }
  delete e.battedBallPhysicalTruth;
  assert(!has(e, 'HARD_CONTACT'));
});
test('12 hard contact on both near and large location miss; target hit excluded', () => {
  for (const error of [0, 1, 2]) {
    const e = fixture({ action: 'swing', result: 'ballInPlay', physical: true, error });
    assert(has(e, 'HARD_CONTACT')); assert.equal(has(e, 'HARD_CONTACT_ON_LOCATION_MISS'), error > 0);
  }
});
test('13 movement and pitch quality do not generate shape observations', () => {
  const e = fixture(); e.pitch.movement = 'breaking'; e.pitch.pitchQuality = 'high';
  assert(types(e).every(t => !t.includes('SHAPE')));
});
test('14 timing windows and late tactical cue do not generate directional timing', () => {
  const e = fixture({ action: 'swing' }); e.executionEvidence = { timing: { window: .4, roll: .9 } };
  e.tacticalFeedback = { observableBatterResponse: { lateSwingObservable: true } };
  assert(types(e).every(t => !['BATTER_EARLY', 'BATTER_ON_TIME', 'BATTER_LATE'].includes(t)));
});
test('15 compressed, summary, bare pitch, partial and non-player input rejected', () => {
  for (const e of [null, {}, { type: 'plateAppearance', result: 'strikeout' }, fixture().pitch,
    { ...fixture(), resolutionMode: 'compressedPlateAppearance' },
    { ...fixture(), authority: 'compressedAIPlateAppearanceOutcomeV1' }]) {
    const r = O.observePitch(e); assert.equal(r.supported, false); assert.deepEqual(r.observations, []);
  }
  const npc = fixture(); npc.pitch.paIdentity = npc.pitch.paIdentity.replace('|player|', '|npc|');
  assert.equal(O.observePitch(npc).reason, 'NOT_DETAILED_PLAYER_PITCH');
});
test('16 projection does not mutate or freeze source and owns its evidence', () => {
  const e = fixture({ action: 'swing', result: 'ballInPlay', physical: true, error: 2 });
  const before = clone(e), r = O.observePitch(e); assert.deepEqual(e, before);
  assert(!Object.isFrozen(e)); assert(!Object.isFrozen(e.pitch.targetIntent));
  const evidence = r.observations.find(o => o.type === 'LARGE_LOCATION_MISS').evidence;
  e.pitch.targetIntent.vertical = 'low'; assert.notEqual(evidence.targetIntent.vertical, 'low');
  assert(Object.isFrozen(r)); assert(Object.isFrozen(r.observations)); assert(Object.isFrozen(evidence.targetIntent));
});
test('17 deterministic ordering and zero RNG, including dependency calls', () => {
  const allowedPlate = new Set(['ABSOLUTE_PITCH_SAFETY_CAP', 'decodePitchLocation', 'normalizeTargetIntent', 'assertPitchResultIntegrity', 'getPitchVelocityBaseline']);
  const guardedPlate = new Proxy(P, { get(target, key) { assert(allowedPlate.has(key), 'unexpected production call: ' + String(key)); return target[key]; } });
  const guardedPhysical = new Proxy(B, { get(target, key) { assert(['VERSION', 'normalizeBattedBallPhysicalTruth'].includes(key)); return target[key]; } });
  let draws = 0;
  const context = vm.createContext({ OffensivePlateApproach: guardedPlate, BattedBallPhysical: guardedPhysical,
    Math: Object.assign(Object.create(Math), { random() { draws++; throw Error('observation RNG'); } }) });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../pitch-observation-foundation.js'), 'utf8'), context);
  const e = fixture({ action: 'swing', result: 'ballInPlay', physical: true, error: 2, actualVertical: 'high' });
  const before = clone(e), first = clone(context.PitchObservationFoundation.observePitch(e));
  for (let i = 0; i < 3; i++) assert.deepEqual(clone(context.PitchObservationFoundation.observePitch(e)), first);
  assert.deepEqual(e, before); assert.equal(draws, 0);
  assert.deepEqual(first.observations.map(o => o.type), ['MISS_HIGH', 'LARGE_LOCATION_MISS', 'GOOD_VELOCITY',
    'BATTER_SWUNG_IN_ZONE', 'HARD_CONTACT', 'HARD_CONTACT_ON_LOCATION_MISS']);
  const reordered = Object.fromEntries(Object.entries(e).reverse()); assert.deepEqual(O.observePitch(reordered), first);
});
test('18 velocity uses owner baseline, equality is good, unknown has no guessed baseline', () => {
  for (const type of ['fastball', 'slider', 'changeup', 'curveball']) {
    const e = fixture(); e.pitch.pitchType = type; e.pitch.velocity = P.getPitchVelocityBaseline(type);
    assert(has(e, 'GOOD_VELOCITY')); e.pitch.velocity -= .1; assert(has(e, 'VELOCITY_DOWN'));
  }
  assert.equal(P.getPitchVelocityBaseline('unknown'), null);
  const e = fixture(); e.pitch.pitchType = 'unknown';
  assert(types(e).every(t => !['GOOD_VELOCITY', 'VELOCITY_DOWN'].includes(t)));
  for (const velocity of [undefined, null, '89', NaN]) {
    const missing = fixture(); missing.pitch.velocity = velocity;
    assert(types(missing).every(t => !['GOOD_VELOCITY', 'VELOCITY_DOWN'].includes(t)));
  }
});
test('19 saved chase boolean has precedence, no debug-trace reconstruction', () => {
  const e = fixture({ cls: 'clearBall', action: 'swing' });
  e.tacticalFeedback = { observableBatterResponse: { chased: false } };
  e.pitch.developerTrace = { chased: true }; assert(!has(e, 'BATTER_CHASED'));
  e.tacticalFeedback.observableBatterResponse.chased = true;
  const r = O.observePitch(e).observations.find(o => o.type === 'BATTER_CHASED');
  assert.equal(r.evidence.basis, 'tacticalFeedback.observableBatterResponse.chased');
});
test('20 fallback target remains unmeasured', () => {
  const e = fixture(); e.pitch.targetIntent = null;
  e.pitch.locationRealization = { targetError: null, executionClassification: 'unmeasured', targetSource: 'legacyLocationFallback' };
  assert(types(e).every(t => !['TARGET_HIT', 'MISS_HIGH', 'MISS_LOW', 'LARGE_LOCATION_MISS'].includes(t)));
});
test('21 conflicting actual zone, response, identity, execution and fair-contact facts reject', () => {
  const mutations = [e => { e.pitch.strike = false; }, e => { e.pitch.pitchId = 'wrong'; },
    e => { e.contact = false; }, e => { e.pitch.locationRealization.targetError = 2; }, e => { e.countBefore.balls = 4; },
    e => { e.pitch.location = 'toString'; }, e => { e.pitch.location = {}; }];
  for (const mutate of mutations) { const e = fixture(); mutate(e); assert.equal(O.observePitch(e).supported, false); }
  const e = fixture({ action: 'swing', result: 'ballInPlay', physical: true });
  e.battedBallPhysicalTruth.identity = 'another-pitch'; assert.equal(O.observePitch(e).reason, 'INVALID_FAIR_CONTACT_AUTHORITY');
});
test('22 output retains stable pitch/PA identity and copied count context', () => {
  const e = fixture(), r = O.observePitch(e);
  assert.equal(r.paIdentity, e.pitch.paIdentity); assert.equal(r.pitchId, e.pitch.pitchId); assert.equal(r.pitchNumber, 1);
  assert.deepEqual(r.countBefore, e.countBefore); assert.deepEqual(r.countAfter, e.countAfter);
  for (const o of r.observations) {
    assert.equal(o.pitchId, r.pitchId); assert.equal(o.paIdentity, r.paIdentity); assert.equal(o.pitchNumber, r.pitchNumber);
    assert.equal(o.source, 'pitchObservationV1'); assert(O.OBSERVATION_TYPES.includes(o.type));
  }
});
console.log(JSON.stringify({ passed, failed: 0, rngDraws: 0, sourceMutations: 0 }));
