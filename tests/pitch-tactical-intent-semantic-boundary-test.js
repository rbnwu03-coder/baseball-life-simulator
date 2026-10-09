'use strict';
const assert = require('assert/strict');
const P = require('../offensive-plate-approach');
const O = require('../pitch-observation-foundation'), S = require('../pitch-sequence-state-foundation');
const I = require('../pitch-tactical-interpretation-foundation'), D = require('../pitch-tactical-decision-foundation');
const A = require('../pitch-tactical-decision-production-adapter'), T = require('../pitcher-catcher-tactical-integration');
const clone = value => JSON.parse(JSON.stringify(value));

// TEST-ONLY contract oracle. This does not select an intent, admit a candidate,
// re-evaluate a pattern, or install a production signal consumer.
function classifySignalAvailability(interpretation, state) {
  if (!interpretation?.supported || interpretation.version !== I.VERSION || !state
    || interpretation.paIdentity !== state.paIdentity) return { classification: 'UNAVAILABLE', reason: 'PA_IDENTITY_OR_PROJECTION_INVALID' };
  if (!Number.isSafeInteger(state.pitchNumber) || state.pitchNumber < 0
    || !Array.isArray(state.pitchHistory) || state.pitchNumber !== state.pitchHistory.length
    || interpretation.pitchCount !== state.pitchNumber) return { classification: 'UNAVAILABLE', reason: 'PITCH_BOUNDARY_MISMATCH' };
  if (state.completed || state.awaitingDefense || state.result || state.balls >= 4 || state.strikes >= 3) {
    return { classification: 'POST_PA_EVIDENCE', nextPitchAvailable: false };
  }
  return { classification: 'CURRENT_PA_NEXT_PITCH_SIGNAL', nextPitchAvailable: true,
    paIdentity: state.paIdentity, completedPitchCount: state.pitchNumber, nextPitchNumber: state.pitchNumber + 1 };
}
function projectState(state) {
  const observations = state.pitchHistory.map(O.observePitch);
  const sequence = observations.length ? S.build(observations) : S.createInitialSequenceState(state.paIdentity);
  const interpretation = I.interpret(sequence), decision = D.decide(interpretation);
  return { observations, sequence, interpretation, decision, availability: classifySignalAvailability(interpretation, state) };
}
function identicalCallEvidence(history) {
  const [previous, latest] = history.slice(-2);
  return previous?.recommendedPitchClass && latest?.recommendedPitchClass && previous.target && latest.target
    && previous.recommendedPitchClass === latest.recommendedPitchClass && previous.target === latest.target
    ? 'IDENTICAL_CALL_EVIDENCE' : 'NOT_IDENTICAL_CALL_EVIDENCE';
}

function main() {
  let passed = 0, rngDraws = 0;
  const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
  const originalRandom = Math.random;
  Math.random = () => { rngDraws++; throw Error('Semantic boundary RNG'); };
  try {
    // Explicit UNIT FIXTURES through existing public physical/lifecycle APIs.
    // Overrides below are never used by the natural evidence integration test.
    const initial = paId => P.createPlateAppearanceState({ matchId: 'semantic-unit', paId, batterId: 'player', inning: 1, half: 'top' });
    function pitch(state, cls, { error = 0, target = 'middle' } = {}) {
      const result = clone(P.generatePitchOpportunity(state, { pitchLocationClass: cls, pitchType: 'fastball', velocity: 89 }));
      result.targetIntent = P.normalizeTargetIntent({ horizontal: 'away', vertical: target,
        zoneIntent: result.strike ? 'strike' : 'chase', frame: 'batterRelative' }, cls);
      result.locationRealization = { targetError: error, executionClassification: error ? 'nearTarget' : 'hitTarget' };
      return result;
    }
    const abilities = { batting: 20, power: 20, observe: 20, baseballIQ: 20, ballSense: 20 };
    const resolve = (state, cls, route, options = {}) => P.resolveNextPitch(
      P.createPlateAppearanceState({ ...clone(state), pendingPitch: pitch(state, cls, options) }), abilities, {
      decisionRoute: route, recognitionRoll: 0,
      timingRoll: 0, batToBallRoll: 0, contactRoll: 0, foulRoll: 0, ...options
    });
    let take = resolve(initial('live-take'), 'clearBall', 'take').state;
    take = resolve(take, 'competitiveStrike', 'take').state;
    const takeProjection = projectState(take);
    let execution = resolve(initial('repeat-execution'), 'chasePitch', 'contactSwing', { target: 'low' }).state;
    execution = resolve(execution, 'clearBall', 'contactSwing', { target: 'middle' }).state;
    const repeatProjection = projectState(execution);
    const fair = resolve(initial('terminal-bip'), 'hitterPitch', 'powerSwing', { error: 1, foulRoll: 1,
      physicalRolls: { contactQuality: .9, ballType: .5, pace: .9, direction: .5, depth: .8 }, outcomeRoll: .5 });
    const terminalProjection = projectState(fair.state);
    const feedback = (cls = 'chasePitch', target = 'outerLow', response = { chased: true }, intent = 'expand') =>
      ({ recommendedPitchClass: cls, actualPitchClass: cls, target, observableBatterResponse: response, intent });
    const context = (state, history = []) => T.buildTacticalContext({ paIdentity: state.paIdentity, pitchIndex: state.pitchNumber + 1,
      balls: state.balls, strikes: state.strikes, sequenceHistory: history });
    const boundary = (state, history = []) => ({ paIdentity: state.paIdentity, pitchCount: state.pitchNumber, tacticalContext: context(state, history) });
    const differingCalls = [feedback('chasePitch', 'outerLow'), feedback('clearBall', 'outer')];

    test('1 actual live PA resolution makes take evidence available at the same PA N+1', () => {
      assert.equal(take.completed, false); assert.equal(take.awaitingDefense, false);
      assert(takeProjection.interpretation.interpretations.some(x => x.type === 'TAKE_PATTERN_PRESENT'));
      assert.equal(takeProjection.decision.selectedIntent, 'challenge');
      assert.deepEqual(takeProjection.availability, { classification: 'CURRENT_PA_NEXT_PITCH_SIGNAL', nextPitchAvailable: true,
        paIdentity: take.paIdentity, completedPitchCount: 2, nextPitchNumber: 3 });
      const next = P.prepareNextPitch(take);
      assert.equal(next.pendingPitch.pitchId, take.paIdentity + '|pitch-3');
      assert.equal(A.adapt(takeProjection.decision, boundary(take)).candidateIntent, 'challenge');
    });
    test('2 stale completed count and a different PA are unavailable', () => {
      assert.equal(classifySignalAvailability(takeProjection.interpretation, { ...take, pitchNumber: 1 }).reason, 'PITCH_BOUNDARY_MISMATCH');
      assert.equal(classifySignalAvailability(takeProjection.interpretation, initial('other')).classification, 'UNAVAILABLE');
      const wrong = clone(boundary(take)); wrong.tacticalContext.pitchIndex++;
      assert.equal(A.adapt(takeProjection.decision, wrong).reason, 'PITCH_BOUNDARY_MISMATCH');
    });
    test('3 owner-resolved hard contact on a miss reconstructs LOCATION_MISS_PUNISHED after fair BIP', () => {
      assert.equal(fair.event.pitchResult, 'ballInPlay'); assert(fair.event.paResult);
      assert.equal(fair.state.completed, true); assert.equal(fair.state.pendingPitch, null);
      assert(terminalProjection.observations[0].observations.some(x => x.type === 'HARD_CONTACT_ON_LOCATION_MISS'));
      assert(terminalProjection.interpretation.interpretations.some(x => x.type === 'LOCATION_MISS_PUNISHED'));
      assert.equal(terminalProjection.decision.selectedIntent, 'changeLook');
      assert.deepEqual(terminalProjection.availability, { classification: 'POST_PA_EVIDENCE', nextPitchAvailable: false });
    });
    test('4 completed PA has no actual N+1 event even when its Decision remains reconstructible', () => {
      assert.equal(P.prepareNextPitch(fair.state).pendingPitch, null);
      assert.equal(P.resolveNextPitch(fair.state, abilities).event, null);
      // Adapter validates metadata and eligibility, not lifecycle/provenance.
      // Fabricated same-PA metadata can pass; it is NOT an actual live boundary.
      assert.equal(A.adapt(terminalProjection.decision, boundary(fair.state)).status, 'candidate');
      assert.equal(terminalProjection.availability.nextPitchAvailable, false);
    });
    test('5 defensive handoff also closes next-pitch availability before settlement', () => {
      const waiting = P.createPlateAppearanceState({ ...clone(fair.state), completed: true, result: 'groundBallPending' });
      assert.equal(waiting.completed, false); assert.equal(waiting.awaitingDefense, true);
      assert.equal(projectState(waiting).availability.classification, 'POST_PA_EVIDENCE');
      assert.equal(P.resolveNextPitch(waiting, abilities).event, null);
    });
    test('6 fresh PA B inherits neither Sequence evidence nor Decision changeLook from terminal PA A', () => {
      const fresh = initial('fresh-b'), projected = projectState(fresh);
      assert.notEqual(fresh.paIdentity, fair.state.paIdentity); assert.equal(projected.sequence.pitchCount, 0);
      assert.equal(projected.sequence.contact.hardContactsOnLocationMiss, 0);
      assert.deepEqual(projected.interpretation.interpretations, []); assert.equal(projected.decision.selectedIntent, 'resetNeutral');
      assert.equal(classifySignalAvailability(terminalProjection.interpretation, fresh).classification, 'UNAVAILABLE');
      assert.equal(A.adapt(terminalProjection.decision, boundary(fresh)).reason, 'PA_IDENTITY_MISMATCH');
      assert.equal(S.appendPitchObservation(projected.sequence, terminalProjection.observations[0]).reason, 'PA_IDENTITY_MISMATCH');
    });
    test('7 repeated target execution with different classes and targets is NOT_IDENTICAL_CALL_EVIDENCE', () => {
      assert.equal(repeatProjection.sequence.sequence.consecutiveTargetHits, 2);
      assert.equal(repeatProjection.sequence.sequence.consecutiveChases, 2);
      assert.equal(repeatProjection.decision.selectedIntent, 'repeatSuccess');
      assert.notEqual(execution.pitchHistory[0].pitch.pitchLocationClass, execution.pitchHistory[1].pitch.pitchLocationClass);
      assert.notEqual(execution.pitchHistory[0].pitch.targetIntent.vertical, execution.pitchHistory[1].pitch.targetIntent.vertical);
      assert.equal(identicalCallEvidence(differingCalls), 'NOT_IDENTICAL_CALL_EVIDENCE');
    });
    test('8 identical-call evidence requires both class and target; missing evidence is not equality', () => {
      assert.equal(identicalCallEvidence([feedback(), feedback()]), 'IDENTICAL_CALL_EVIDENCE');
      assert.equal(identicalCallEvidence([feedback(), feedback('chasePitch', 'middle')]), 'NOT_IDENTICAL_CALL_EVIDENCE');
      assert.equal(identicalCallEvidence([feedback(), feedback('clearBall')]), 'NOT_IDENTICAL_CALL_EVIDENCE');
      assert.equal(identicalCallEvidence([]), 'NOT_IDENTICAL_CALL_EVIDENCE');
    });
    test('9 production repeat eligibility can exist without a Foundation repeat pattern', () => {
      for (const response of [{ chased: true }, { whiffed: true }]) {
        const live = initial('eligibility-only');
        assert.equal(projectState(live).decision.selectedIntent, 'resetNeutral');
        assert.equal(T.getRepeatSuccessEligibility(context(live, [feedback('edgeStrike', 'outerLow', response)])).repeatEligible, true);
      }
    });
    test('10 Foundation repeat pattern can exist without production repeat eligibility', () => {
      assert.equal(repeatProjection.decision.selectedIntent, 'repeatSuccess');
      for (const history of [[], [feedback('', 'outerLow')], [feedback('edgeStrike', 'outerLow', { took: true })]]) {
        assert(!T.getRepeatSuccessEligibility(context(execution, history)).repeatEligible);
        const admitted = A.adapt(repeatProjection.decision, boundary(execution, history));
        assert.equal(admitted.status, 'abstain'); assert.equal(admitted.candidateIntent, null);
      }
    });
    test('11 repeat compatibility gate does not prove the same repeated-call pattern', () => {
      assert.equal(T.getRepeatSuccessEligibility(context(execution, differingCalls)).repeatEligible, true);
      assert.equal(A.adapt(repeatProjection.decision, boundary(execution, differingCalls)).candidateIntent, 'repeatSuccess');
      assert.equal(identicalCallEvidence(differingCalls), 'NOT_IDENTICAL_CALL_EVIDENCE');
    });
    test('12 failed repeat stays canonically ineligible despite the unchanged Foundation proposal', () => {
      const history = [feedback('chasePitch', 'outerLow', { chased: true, hardContactObservable: true }, 'repeatSuccess')];
      const c = context(execution, history), b = boundary(execution, history);
      assert.equal(T.getRepeatSuccessEligibility(c).repeatFailed, true);
      assert.equal(T.getRepeatSuccessEligibility(c).repeatEligible, false);
      assert.equal(repeatProjection.decision.selectedIntent, 'repeatSuccess');
      const admitted = A.adapt(repeatProjection.decision, b);
      assert.equal(admitted.status, 'abstain'); assert.deepEqual(admitted.reasonCodes, ['REPEAT_SUCCESS_NOT_PRODUCTION_ELIGIBLE']);
      for (const roll of [0, .25, .5, .75, .999999]) {
        const selected = T.chooseTacticalIntent(c, { roll });
        assert.equal(selected.candidateScores.repeatSuccess, 0); assert.notEqual(selected.selectedIntent, 'repeatSuccess');
        assert.equal(selected.safeguards.noStickySuccess, true);
      }
      assert(!admitted.reasonCodes.includes('RESPONSE_PATTERN_SUPPORTS_EXPANSION'));
    });
    test('13 rejecting selected repeat never promotes its expand runner-up', () => {
      assert(repeatProjection.decision.candidates.some(x => x.intent === 'expand'));
      assert.equal(A.adapt(repeatProjection.decision, boundary(execution)).candidateIntent, null);
    });
    test('14 candidate metadata never changes the sole final Production owner', () => {
      const c = clone(context(take)), before = T.chooseTacticalIntent(c);
      A.adapt(takeProjection.decision, { paIdentity: take.paIdentity, pitchCount: take.pitchNumber, tacticalContext: c });
      assert.deepEqual(T.chooseTacticalIntent(c), before);
      Object.defineProperty(c, 'foundationCandidate', { get() { throw Error('Unexpected runtime consumer'); } });
      assert.deepEqual(T.chooseTacticalIntent(c), before);
    });
    test('15 semantic availability consumes no future result or final match outcome', () => {
      const copy = clone(take);
      for (const field of ['nextPitchResult', 'paOutcome', 'runsScored']) Object.defineProperty(copy, field, { get() { throw Error('Outcome leak'); } });
      assert.deepEqual(classifySignalAvailability(takeProjection.interpretation, copy), takeProjection.availability);
      // state.result is used only to close the PA, never to judge signal quality.
      for (const result of ['single', 'out', 'homeRun']) assert.equal(classifySignalAvailability(terminalProjection.interpretation,
        { ...fair.state, result }).classification, 'POST_PA_EVIDENCE');
    });
    test('16 source state, feedback, Decision and boundary stay mutable and unchanged', () => {
      const state = clone(execution), b = clone(boundary(state, differingCalls)), d = clone(repeatProjection.decision);
      const snapshot = clone({ state, b, d });
      for (let n = 0; n < 20; n++) { projectState(state); A.adapt(d, b); T.getRepeatSuccessEligibility(b.tacticalContext); }
      assert.deepEqual({ state, b, d }, snapshot);
      for (const input of [state, state.pitchHistory, b, b.tacticalContext, d]) assert.equal(Object.isFrozen(input), false);
      assert.equal(rngDraws, 0);
    });
  } finally { Math.random = originalRandom; }
  console.log(JSON.stringify({ suite: 'pitch-tactical-intent-semantic-boundary', passed, failed: 0, rngDraws, inputMutations: 0,
    fixtureEvidence: true, naturalEvidence: false, runtimeChanges: 0 }));
}
module.exports = { classifySignalAvailability, projectState, identicalCallEvidence };
if (require.main === module) main();
