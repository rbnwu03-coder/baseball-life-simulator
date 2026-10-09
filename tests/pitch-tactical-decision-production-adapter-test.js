'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path'), vm = require('vm');
const I = require('../pitch-tactical-interpretation-foundation'), D = require('../pitch-tactical-decision-foundation');
const T = require('../pitcher-catcher-tactical-integration'), A = require('../pitch-tactical-decision-production-adapter');
const { loadTactical } = require('./pitch-tactical-selector-extraction-baseline.cjs');
const clone = value => JSON.parse(JSON.stringify(value)), PA = 'adapter-unit|pa-1|player|1|top';
let passed = 0, draws = 0, hashes = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
const typesByIntent = { resetNeutral: [], challenge: ['TAKE_PATTERN_PRESENT'], expand: ['CHASE_PATTERN_PRESENT'],
  repeatSuccess: ['REPEATED_TARGET_HITS', 'SWING_MISS_PATTERN_PRESENT'], changeLook: ['LOCATION_MISS_PUNISHED'] };
function decision(intent = 'resetNeutral') {
  return clone(D.decide({ supported: true, version: I.VERSION, paIdentity: PA, pitchCount: 3,
    interpretations: typesByIntent[intent].map(type => ({ type, scope: 'CURRENT_PA', source: I.SOURCE, reasonCode: 'CONTRACT_FIXTURE' })) }));
}
function boundary(feedback = null, pitchCount = 3) {
  return { paIdentity: PA, pitchCount, tacticalContext: clone(T.buildTacticalContext({ paIdentity: PA, pitchIndex: pitchCount + 1,
    sequenceHistory: feedback ? [feedback] : [] })) };
}
function feedback(response = { whiffed: true }, extra = {}) {
  return { intent: 'challenge', recommendedPitchClass: 'edgeStrike', actualPitchClass: 'edgeStrike', observableBatterResponse: response, ...extra };
}
function candidate(intent, b = boundary()) {
  const result = A.adapt(decision(intent), b);
  assert.equal(result.supported, true, result.reason); assert.equal(result.status, 'candidate'); assert.equal(result.candidateIntent, intent);
  assert.deepEqual(result.provenance, { decisionVersion: D.VERSION, decisionIntent: intent });
}
function abstain(b = boundary()) {
  const result = A.adapt(decision('repeatSuccess'), b);
  assert.equal(result.supported, true); assert.equal(result.status, 'abstain'); assert.equal(result.candidateIntent, null);
  assert.deepEqual(result.reasonCodes, ['REPEAT_SUCCESS_NOT_PRODUCTION_ELIGIBLE']);
}
function rejects(d, b, reason) {
  const result = A.adapt(d, b); assert.equal(result.supported, false); assert.equal(result.reason, reason);
  assert.equal(result.status, 'abstain'); assert.equal(result.candidateIntent, null);
}
test('1 neutral explicitly abstains', () => {
  const result = A.adapt(decision(), boundary());
  assert.equal(result.supported, true); assert.equal(result.status, 'abstain'); assert.equal(result.candidateIntent, null);
  assert.deepEqual(result.reasonCodes, ['NEUTRAL_DECISION_ABSTENTION']);
});
test('2 challenge is a canonical candidate', () => candidate('challenge'));
test('3 expand is a canonical candidate', () => candidate('expand'));
test('4 changeLook is a canonical candidate', () => candidate('changeLook'));
test('5 repeat is eligible after either chase or whiff', () => {
  for (const response of [{ chased: true }, { whiffed: true }, { chased: true, whiffed: true }]) candidate('repeatSuccess', boundary(feedback(response)));
});
test('6 repeat without previous recommendation abstains', () => {
  abstain(); abstain(boundary(feedback({ whiffed: true }, { recommendedPitchClass: '' })));
});
test('7 repeat without chase or whiff abstains, including called-strike success', () => {
  for (const response of [{ took: true }, { fouled: true }, { contacted: true }, {}]) abstain(boundary(feedback(response)));
});
test('8 canonical failed-repeat hard-contact guard abstains', () => {
  abstain(boundary(feedback({ chased: true, whiffed: true, hardContactObservable: true }, { intent: 'repeatSuccess' })));
  // Hard contact on another intent does not invent a broader failure rule.
  candidate('repeatSuccess', boundary(feedback({ chased: true, hardContactObservable: true })));
});
test('9 rejected selected repeat never promotes the expand runner-up', () => {
  const d = decision('repeatSuccess'); assert.equal(d.candidates[1].intent, 'expand');
  assert.equal(A.adapt(d, boundary()).candidateIntent, null);
  Object.defineProperty(d, 'candidates', { get() { throw Error('Adapter attempted arbitration'); } });
  assert.equal(A.adapt(d, boundary()).status, 'abstain');
});
test('10 old-PA Decision and inconsistent context identities reject', () => {
  const b = boundary(); b.paIdentity = 'adapter-unit|pa-2|player|1|top'; rejects(decision(), b, 'PA_IDENTITY_MISMATCH');
  const other = boundary(); other.tacticalContext.paIdentity = b.paIdentity; rejects(decision(), other, 'PA_IDENTITY_MISMATCH');
});
test('11 completed-pitch mismatch and off-by-one context reject', () => {
  rejects(decision(), boundary(null, 4), 'PITCH_BOUNDARY_MISMATCH');
  const b = boundary(); b.tacticalContext.pitchIndex = 3; rejects(decision(), b, 'PITCH_BOUNDARY_MISMATCH');
  b.tacticalContext.pitchIndex = 5; rejects(decision(), b, 'PITCH_BOUNDARY_MISMATCH');
});
test('12 unknown intent is rejected instead of flowing into recommendation defaults', () => {
  rejects({ ...decision(), selectedIntent: 'ATTACK_ZONE' }, boundary(), 'UNKNOWN_PRODUCTION_INTENT');
});
test('13 identical inputs adapted 100 times are identical for every intent', () => {
  for (const intent of Object.keys(typesByIntent)) {
    const d = decision(intent), b = boundary(feedback()), expected = A.adapt(d, b);
    for (let n = 0; n < 100; n++) assert.deepEqual(A.adapt(d, b), expected);
  }
});
test('14 browser owner traps allow only metadata and the pure eligibility helper; RNG/hash draws zero', () => {
  const source = fs.readFileSync(path.join(__dirname, '../pitch-tactical-decision-production-adapter.js'), 'utf8');
  const tactical = loadTactical(fs.readFileSync(path.join(__dirname, '../pitcher-catcher-tactical-integration.js'), 'utf8'),
    () => { hashes++; throw Error('Adapter tactical hash draw'); }, () => { draws++; throw Error('Adapter tactical random'); });
  const context = vm.createContext({
    PitchTacticalDecisionFoundation: new Proxy(D, { get(target, key) { assert(['VERSION', 'SOURCE', 'INTENT_PRIORITY'].includes(key)); return target[key]; } }),
    PitcherCatcherTacticalIntegration: new Proxy(tactical, { get(target, key) { assert(['VERSION', 'TACTICAL_INTENTS', 'getRepeatSuccessEligibility'].includes(key)); return target[key]; } }),
    Math: Object.assign(Object.create(Math), { random() { draws++; throw Error('Adapter random'); } })
  });
  for (const key of ['PitchObservationFoundation', 'PitchSequenceStateFoundation', 'PitchTacticalInterpretationFoundation', 'PitchSequencing', 'player']) {
    Object.defineProperty(context, key, { get() { throw Error('Forbidden owner ' + key); } });
  }
  vm.runInContext(source, context);
  for (const intent of Object.keys(typesByIntent)) for (const b of [boundary(), boundary(feedback())]) {
    assert.deepEqual(clone(context.PitchTacticalDecisionProductionAdapter.adapt(decision(intent), b)), A.adapt(decision(intent), b));
  }
  assert.equal(draws, 0); assert.equal(hashes, 0);
});
test('15 mutable decision and boundary remain unchanged/unfrozen; output is detached and deeply frozen', () => {
  const d = decision('repeatSuccess'), b = boundary(feedback()), before = clone({ d, b }), result = A.adapt(d, b);
  assert.deepEqual({ d, b }, before); assert(!Object.isFrozen(d)); assert(!Object.isFrozen(b)); assert(!Object.isFrozen(b.tacticalContext));
  assert(Object.isFrozen(result)); assert(Object.isFrozen(result.reasonCodes)); assert(Object.isFrozen(result.provenance));
  d.selectedIntent = 'expand'; b.paIdentity = 'changed'; b.tacticalContext.previousFeedback.observableBatterResponse.whiffed = false;
  assert.equal(result.candidateIntent, 'repeatSuccess'); assert.equal(result.paIdentity, PA); assert.equal(result.provenance.decisionIntent, 'repeatSuccess');
});
test('16 output contains no recommendation, execution, weights, or physical fields', () => {
  for (const intent of Object.keys(typesByIntent)) {
    const text = JSON.stringify(A.adapt(decision(intent), boundary(feedback())));
    assert(!/recommendedPitchClass|targetLocation|pitchType|intendedPitchClass|actualPitchClass|weight|score|probability|physicalPitch|contactQuality/.test(text));
  }
});
test('17 malformed or unsupported Decision projections reject', () => {
  for (const d of [null, {}, { supported: false }]) rejects(d, boundary(), 'UNSUPPORTED_DECISION');
  rejects({ ...decision(), version: 'future' }, boundary(), 'DECISION_VERSION_MISMATCH');
  for (const update of [{ source: 'unknown' }, { paIdentity: 'npc' }, { paIdentity: '|pa|player|1|top' },
    { pitchCount: -1 }, { pitchCount: 1.5 }, { pitchCount: Infinity }, { pitchCount: Number.MAX_SAFE_INTEGER + 1 }]) {
    rejects({ ...decision(), ...update }, boundary(), 'INVALID_DECISION_WRAPPER');
  }
  rejects({ ...decision('challenge'), pitchCount: 0 }, boundary(null, 0), 'INVALID_DECISION_WRAPPER');
});
test('18 invalid production context/count/version rejects even for neutral', () => {
  for (const b of [null, {}, { ...boundary(), tacticalContext: null }, { ...boundary(), pitchCount: -1 },
    { ...boundary(), pitchCount: 1.5 }, { ...boundary(), paIdentity: 'npc' }]) rejects(decision(), b, 'INVALID_PRODUCTION_BOUNDARY');
  for (const update of [{ version: 'future' }, { pitchIndex: 0 }, { pitchIndex: Infinity }, { pitchIndex: 1.5 }]) {
    const b = boundary(); Object.assign(b.tacticalContext, update); rejects(decision(), b, 'INVALID_PRODUCTION_BOUNDARY');
  }
});
test('19 empty same-PA prefix maps only to next-pitch neutral abstention', () => {
  const d = decision(); d.pitchCount = 0; assert.equal(A.adapt(d, boundary(null, 0)).status, 'abstain');
});
test('20 adapters never enumerate or read upstream evidence, alternative candidates, or geometry', () => {
  const d = decision('repeatSuccess'), b = boundary(feedback());
  const restrict = (object, allowed) => new Proxy(object, { ownKeys() { throw Error('Input enumeration'); },
    get(target, key) { assert(allowed.includes(key), 'Forbidden input read ' + String(key)); return target[key]; } });
  b.tacticalContext.previousFeedback = restrict(b.tacticalContext.previousFeedback, ['intent', 'recommendedPitchClass', 'observableBatterResponse']);
  b.tacticalContext.previousFeedback.observableBatterResponse = restrict(b.tacticalContext.previousFeedback.observableBatterResponse,
    ['chased', 'whiffed', 'hardContactObservable']);
  b.tacticalContext = restrict(b.tacticalContext, ['version', 'paIdentity', 'pitchIndex', 'previousFeedback']);
  assert.equal(A.adapt(restrict(d, ['supported', 'version', 'source', 'paIdentity', 'pitchCount', 'selectedIntent']),
    restrict(b, ['paIdentity', 'pitchCount', 'tacticalContext'])).candidateIntent, 'repeatSuccess');
});
test('21 missing dependencies, helper, or canonical vocabulary fail explicitly', () => {
  const source = fs.readFileSync(path.join(__dirname, '../pitch-tactical-decision-production-adapter.js'), 'utf8');
  for (const deps of [{}, { PitchTacticalDecisionFoundation: D, PitcherCatcherTacticalIntegration: { TACTICAL_INTENTS: T.TACTICAL_INTENTS } }]) {
    const c = vm.createContext(deps); vm.runInContext(source, c);
    assert.equal(c.PitchTacticalDecisionProductionAdapter.adapt(decision(), boundary()).reason, 'DEPENDENCIES_UNAVAILABLE');
  }
  for (const vocabulary of [[], null]) {
    const c = vm.createContext({ PitchTacticalDecisionFoundation: D, PitcherCatcherTacticalIntegration: { ...T, TACTICAL_INTENTS: vocabulary } });
    vm.runInContext(source, c); assert.equal(c.PitchTacticalDecisionProductionAdapter.adapt(decision(), boundary()).reason, 'TACTICAL_INTENT_AUTHORITY_CONFLICT');
  }
  const c = vm.createContext({ PitchTacticalDecisionFoundation: D, PitcherCatcherTacticalIntegration: { ...T, TACTICAL_INTENTS: ['different'] } });
  vm.runInContext(source, c); assert.equal(c.PitchTacticalDecisionProductionAdapter.adapt(decision('challenge'), boundary()).reason, 'UNKNOWN_PRODUCTION_INTENT');
});
test('22 simple/neutral projections do not consume production feedback', () => {
  const b = boundary(); Object.defineProperty(b.tacticalContext, 'previousFeedback', { get() { throw Error('Unneeded repeat guard'); } });
  for (const intent of ['resetNeutral', 'challenge', 'expand', 'changeLook']) assert.equal(A.adapt(decision(intent), b).supported, true);
});
console.log('ADAPTER_UNIT_JSON=' + JSON.stringify({ passed, failed: 0, rngDraws: draws, tacticalHashDraws: hashes, inputMutations: 0 }));
