'use strict';
const assert = require('assert/strict'), fs = require('fs'), cp = require('child_process'), path = require('path');
const { discover } = require('./match-m0-after-r2-admission-context.cjs');
const { assertPitchProductionSourceScope } = require('./pitch-production-source-scope.cjs');
const O = require('../pitch-observation-foundation'), S = require('../pitch-sequence-state-foundation');
const I = require('../pitch-tactical-interpretation-foundation');
const D = require('../pitch-tactical-decision-foundation'), T = require('../pitcher-catcher-tactical-integration');
const clone = value => JSON.parse(JSON.stringify(value));
const rebuild = history => S.build(history.map(O.observePitch));
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };

function play({ decision = false, reload = false, policy = 'take' } = {}) {
  const { h, row } = discover(440000, { observe: false });
  assert(row.matchReached && !row.error);
  const captured = [];
  h.context.__captureDecision = value => captured.push(clone(value));
  if (decision) h.run(`
    var decisionChecks={calls:0,rngDraws:0,sourceMutations:0,previousStateMutations:0,sequenceMutations:0,interpretationMutations:0,rebuilds:0};
    var sequenceStates=new Map();
    var originalSequenceResolution=resolveHighSchoolPlateDecisionPitch;
    resolveHighSchoolPlateDecisionPitch=function(...args){
      const result=originalSequenceResolution.apply(this,args);
      if(result?.event){
        const history=result.plateAppearanceState.pitchHistory;
        if(JSON.stringify(history.at(-1))!==JSON.stringify(result.event))throw Error('Event is not canonical history');
        const sourceBefore=JSON.stringify(player),rngBefore=m0DiscoveryRandom,savedRandom=Math.random;
        try{
          Math.random=function(){decisionChecks.rngDraws++;throw Error('Sequence drew RNG');};
          const projections=history.map(PitchObservationFoundation.observePitch);
          const pitch=projections.at(-1),observationsBefore=JSON.stringify(projections);
          const previous=sequenceStates.get(pitch.paIdentity)||PitchSequenceStateFoundation.createInitialSequenceState(pitch.paIdentity);
          const previousBefore=JSON.stringify(previous);
          const appended=PitchSequenceStateFoundation.appendPitchObservation(previous,pitch);
          const rebuilt=PitchSequenceStateFoundation.build(projections);
          if(!appended.supported||!rebuilt.supported)throw Error(appended.reason||rebuilt.reason);
          if(JSON.stringify(appended)!==JSON.stringify(rebuilt))throw Error('Incremental/rebuild mismatch');
          for(let i=0;i<3;i++)if(JSON.stringify(rebuilt)!==JSON.stringify(PitchSequenceStateFoundation.build(projections)))throw Error('Sequence non-determinism');
          if(JSON.stringify(previous)!==previousBefore){decisionChecks.previousStateMutations++;throw Error('Previous state mutation');}
          if(JSON.stringify(projections)!==observationsBefore)throw Error('Observation mutation');
          const sequenceBefore=JSON.stringify(appended);
          const interpreted=PitchTacticalInterpretationFoundation.interpret(appended);
          if(!interpreted.supported)throw Error(interpreted.reason);
          const interpretationBefore=JSON.stringify(interpreted);
          const decided=PitchTacticalDecisionFoundation.decide(interpreted);
          if(!decided.supported)throw Error(decided.reason);
          const reordered={...interpreted,interpretations:[...interpreted.interpretations].reverse()};
          if(JSON.stringify(decided)!==JSON.stringify(PitchTacticalDecisionFoundation.decide(reordered)))throw Error('Decision order dependence');
          for(let i=0;i<100;i++){
            const fromRebuild=PitchTacticalDecisionFoundation.decide(PitchTacticalInterpretationFoundation.interpret(PitchSequenceStateFoundation.build(projections)));
            if(JSON.stringify(decided)!==JSON.stringify(fromRebuild))throw Error('Decision non-determinism');
            decisionChecks.rebuilds++;
          }
          if(JSON.stringify(appended)!==sequenceBefore){decisionChecks.sequenceMutations++;throw Error('Sequence mutation');}
          if(JSON.stringify(interpreted)!==interpretationBefore){decisionChecks.interpretationMutations++;throw Error('Interpretation mutation');}
          sequenceStates.set(pitch.paIdentity,appended);
          __captureDecision({paIdentity:pitch.paIdentity,pitchId:pitch.pitchId,observations:pitch.observations.map(o=>o.type),state:appended,interpretation:interpreted,decision:decided});
        }finally{Math.random=savedRandom;}
        if(JSON.stringify(player)!==sourceBefore){decisionChecks.sourceMutations++;throw Error('Source mutation');}
        if(m0DiscoveryRandom!==rngBefore)throw Error('RNG cursor mutation');
        decisionChecks.calls++;
      }
      return result;
    };
  `);
  let steps = 0, saved = false;
  while (!h.run('player.highSchoolMatch.completed') && steps++ < 5000) {
    if (h.run('!!pendingYouthSeasonOutcome')) h.run('continueYouthSeasonOutcome()');
    else if (h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)')) {
      if (reload && !saved && h.run('player.highSchoolMatch.offensivePlateAppearanceState?.pitchHistory.length>1 && player.highSchoolMatch.activeSituation?.type==="plateDecision"')) {
        const expression = '({history:player.highSchoolMatch.offensivePlateAppearanceState.pitchHistory,pending:player.highSchoolMatch.offensivePlateAppearanceState.pendingPitch,count:{balls:player.highSchoolMatch.offensivePlateAppearanceState.balls,strikes:player.highSchoolMatch.offensivePlateAppearanceState.strikes},record:player.highSchoolMatch.gameRecord,rng:m0DiscoveryRandom})';
        const before = h.json(expression), expected = rebuild(before.history), expectedInterpretation = I.interpret(expected), expectedDecision = D.decide(expectedInterpretation);
        assert(expected.supported);
        h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');
        assert.deepEqual(h.json(expression), before);
        assert.deepEqual(rebuild(h.json('player.highSchoolMatch.offensivePlateAppearanceState.pitchHistory')), expected);
        assert.deepEqual(h.json('PitchTacticalInterpretationFoundation.interpret(PitchSequenceStateFoundation.build(player.highSchoolMatch.offensivePlateAppearanceState.pitchHistory.map(PitchObservationFoundation.observePitch)))'), expectedInterpretation);
        assert.deepEqual(h.json('PitchTacticalDecisionFoundation.decide(PitchTacticalInterpretationFoundation.interpret(PitchSequenceStateFoundation.build(player.highSchoolMatch.offensivePlateAppearanceState.pitchHistory.map(PitchObservationFoundation.observePitch))))'), expectedDecision);
        assert.deepEqual(h.json('PitchSequenceStateFoundation.build(player.highSchoolMatch.offensivePlateAppearanceState.pitchHistory.map(PitchObservationFoundation.observePitch))'), expected);
        // Discard derived memory and resume from persisted truth, not saved states.
        h.run('sequenceStates.clear();var loadedHistory=player.highSchoolMatch.offensivePlateAppearanceState.pitchHistory;var rebuiltSequence=PitchSequenceStateFoundation.build(loadedHistory.map(PitchObservationFoundation.observePitch));sequenceStates.set(rebuiltSequence.paIdentity,rebuiltSequence);');
        saved = true;
      }
      h.context.sequencePolicy = policy;
      assert(h.run(`var sequenceChoices=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch);
        var sequenceChoice=sequenceChoices.find(c=>c.matchDecision===(sequencePolicy==='swing'?'contactSwing':'take'))||sequenceChoices[0];
        chooseHighSchoolYearOneMatchMoment(sequenceChoice.matchDecision,sequenceChoice.matchMomentId)`));
    } else assert(h.run('__runNextTimer()'), 'pending production timer');
  }
  const match = h.json('player.highSchoolMatch');
  assert(match.completed && !match.activeSituation);
  assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'), []);
  assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'), []);
  if (reload) assert(saved);
  const histories = match.completedMoments.filter(m => m.pitchHistory?.length).map(m => m.pitchHistory);
  const statesBefore = histories.map(rebuild), interpretationsBefore = statesBefore.map(I.interpret), decisionsBefore = interpretationsBefore.map(D.decide);
  assert(statesBefore.length && statesBefore.every(s => s.supported));
  h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');
  const loaded = h.json('player.highSchoolMatch');
  assert.deepEqual(loaded.completedMoments.filter(m => m.pitchHistory?.length).map(m => rebuild(m.pitchHistory)), statesBefore);
  assert.deepEqual(rebuild(loaded.lastOffensiveResolution.pitchHistory), rebuild(match.lastOffensiveResolution.pitchHistory));
  assert.deepEqual(loaded.completedMoments.filter(m => m.pitchHistory?.length).map(m => I.interpret(rebuild(m.pitchHistory))), interpretationsBefore);
  assert.deepEqual(I.interpret(rebuild(loaded.lastOffensiveResolution.pitchHistory)), I.interpret(rebuild(match.lastOffensiveResolution.pitchHistory)));
  assert.deepEqual(loaded.completedMoments.filter(m => m.pitchHistory?.length).map(m => D.decide(I.interpret(rebuild(m.pitchHistory)))), decisionsBefore);
  assert.deepEqual(D.decide(I.interpret(rebuild(loaded.lastOffensiveResolution.pitchHistory))), D.decide(I.interpret(rebuild(match.lastOffensiveResolution.pitchHistory))));
  const saveText = h.run('JSON.stringify(player)');
  assert(!saveText.includes(D.VERSION)); assert(!saveText.includes('pitchTacticalDecision')); assert(!saveText.includes(S.VERSION)); assert(!saveText.includes(I.VERSION)); assert(!saveText.includes('pitchTacticalInterpretation')); assert(!saveText.includes('sequenceStateV1'));
  return { match, histories, captured, saved, rng: h.run('m0DiscoveryRandom'),
    checks: decision ? h.json('decisionChecks') : null };
}

const off = play(), on = play({ decision: true }), reload = play({ decision: true, reload: true });
const swingOff = play({ policy: 'swing' }), swingOn = play({ decision: true, policy: 'swing' });
test('1 genuine three-plus-pitch player PA produces incremental and rebuilt states', () => {
  assert(on.histories.some(history => history.length >= 3));
  for (const history of [...on.histories, ...swingOn.histories]) for (let i = 0; i < history.length; i++) {
    const run = on.histories.includes(history) ? on : swingOn;
    const state = rebuild(history.slice(0, i + 1)); assert(state.supported, state.reason);
    assert.deepEqual(run.captured.find(row => row.pitchId === state.lastPitchId).state, state);
    assert.deepEqual(state.currentCount, history[i].countAfter);
  }
});
test('2 browser and CommonJS results match every genuine prefix', () => {
  for (const run of [on, swingOn]) for (const row of run.captured) {
    const history = run.histories.find(h => h[0].pitch.paIdentity === row.paIdentity);
    assert.deepEqual(row.state, rebuild(history.slice(0, row.state.pitchCount)));
    assert.deepEqual(row.interpretation, I.interpret(row.state));
    assert.deepEqual(row.decision, D.decide(row.interpretation));
  }
});
test('3 Decision ON/OFF leaves whole match, tactical state, record and RNG unchanged', () => {
  assert.deepEqual(on.match, off.match); assert.equal(on.rng, off.rng);
  assert.deepEqual(swingOn.match, swingOff.match); assert.equal(swingOn.rng, swingOff.rng);
});
test('4 live save/load rebuild resumes identically with derived memory discarded', () => {
  assert(reload.saved); assert.deepEqual(reload.match, on.match);
  assert.deepEqual(reload.captured, on.captured); assert.equal(reload.rng, on.rng);
});
test('5 RNG draws, production, Sequence and Interpretation mutations stay zero', () => {
  for (const run of [on, reload, swingOn]) {
    assert(run.checks.calls > 0); assert.equal(run.checks.rngDraws, 0);
    assert.equal(run.checks.sourceMutations, 0); assert.equal(run.checks.previousStateMutations, 0);
    assert.equal(run.checks.sequenceMutations, 0); assert.equal(run.checks.interpretationMutations, 0); assert.equal(run.checks.rebuilds, run.checks.calls * 100);
  }
});
test('6 genuine compressed NPC events remain unsupported with no fabricated sequence', () => {
  const events = on.match.simulationLog.filter(e => e.resolutionMode === 'compressedPlateAppearance'); assert(events.length);
  for (const event of events) {
    assert(!Object.hasOwn(event, 'pitchHistory')); assert(!Object.hasOwn(event, 'pitchCount'));
    const state = S.build([O.observePitch(event)]); assert.equal(state.supported, false);
    assert.equal(state.reason, 'UNSUPPORTED_OBSERVED_PITCH'); assert(!Object.hasOwn(state, 'pitchCount'));
    assert.equal(I.interpret(state).supported, false); assert.deepEqual(I.interpret(state).interpretations, []);
    assert.equal(D.decide(I.interpret(state)).supported, false); assert.deepEqual(D.decide(I.interpret(state)).candidates, []);
  }
  for (const ref of on.match.gameRecord.eventRefs) assert.equal(D.decide(I.interpret(S.build([O.observePitch(ref)]))).supported, false);
});
test('7 finished persisted copies rebuild identically without a new save authority', () => {
  for (const run of [on, reload, swingOn]) {
    assert(!JSON.stringify(run.match).includes(S.VERSION)); assert(!Object.hasOwn(run.match, 'pitchSequenceState'));
  }
});
test('8 protected pitch sources retain scoped script freeze and exact repeat eligibility extraction', () => {
  const root = path.resolve(__dirname, '..');
  for (const file of ['pitch-tactical-interpretation-foundation.js', 'pitch-sequence-state-foundation.js', 'pitch-observation-foundation.js', 'offensive-plate-approach.js', 'pitcher-catcher-tactical-integration.js', 'pitch-sequencing.js', 'save.js', 'script.js']) {
    const current = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n?/g, '\n');
    const baseline = cp.execFileSync('git', ['show', 'ac53bf61964bde4b40501c77e15269bae99b55cc:' + file], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replace(/\r\n?/g, '\n');
    if (file === 'pitcher-catcher-tactical-integration.js') require('./pitch-tactical-selector-extraction-baseline.cjs').assertOnlyRepeatEligibilityExtraction(current, baseline);
    else if (file === 'script.js') assertPitchProductionSourceScope(current, baseline);
    else assert.equal(current, baseline, file);
  }
});
test('9 production decisions contain no recommendation, physical pitch, scoring or psychology', () => {
  for (const run of [on, reload, swingOn]) for (const row of run.captured) {
    const text = JSON.stringify(row.decision);
    assert(!/recommended|nextPitch|confidence|passive|discipline|fear|fatigue|pitchType|targetIntent|probability|competitiveStrike|chasePitch|fastball|slider|changeup|curveball/.test(text));
    for (const key of ['velocity', 'location', 'zoneIntent', 'targetLocation', 'physicalPitchType', 'intentScore', 'utilityScore']) assert(!text.includes('"' + key + '"'));
    for (const item of row.decision.candidates) {
      assert.deepEqual(Object.keys(item), ['intent', 'reasonCodes', 'interpretationTypes']);
      for (const type of item.interpretationTypes) assert(row.interpretation.interpretations.some(i => i.type === type));
    }
  }
});
test('10 genuine Interpretation wrapper forbids Sequence, raw truth and numeric evidence access', () => {
  const input = clone(on.captured.find(row => row.state.pitchCount >= 3).interpretation), expected = D.decide(input);
  for (const key of ['sequence', 'sequenceState', 'observations', 'pitchHistory', 'pitch', 'pitchType', 'pitchResult', 'targetIntent', 'contactQuality', 'currentCount']) {
    Object.defineProperty(input, key, { get() { throw Error('Forbidden upstream read ' + key); } });
  }
  for (const row of input.interpretations) Object.defineProperty(row, 'evidence', { get() { throw Error('Interpretation threshold reimplementation'); } });
  assert.deepEqual(D.decide(input), expected);
});
test('11 canonical production vocabulary reused with neutral fallback kept independent', () => {
  for (const run of [on, swingOn]) for (const row of run.captured) {
    assert(T.TACTICAL_INTENTS.includes(row.decision.selectedIntent) || row.decision.selectedIntent === 'resetNeutral');
    assert.deepEqual(D.decide({ ...row.interpretation, interpretations: [...row.interpretation.interpretations].reverse() }), row.decision);
  }
});
test('12 real detailed PA produces non-neutral intents without consuming them in production', () => {
  assert(on.captured.some(row => row.decision.selectedIntent !== 'resetNeutral'));
  assert.deepEqual(on.match, off.match); assert.equal(on.rng, off.rng);
});
const history = on.histories.find(h => h.length >= 3);
const witness = history.map(event => {
  const row = on.captured.find(r => r.pitchId === event.pitch.pitchId), state = row.state;
  return { pitchNumber: event.pitchNumber, observations: row.observations, pitchCount: state.pitchCount,
    currentCount: state.currentCount, consecutiveTakes: state.sequence.consecutiveTakes, consecutiveSwings: state.sequence.consecutiveSwings,
    targetHits: state.location.targetHits, largeMisses: state.location.largeMisses, measuredPitches: state.location.measuredPitches,
    unobservedLocationPitches: state.location.unobservedPitches, chases: state.batterResponse.chased,
    swingMisses: state.contact.swingMisses, hardContacts: state.contact.hardContacts,
    consecutiveCalledStrikes: state.sequence.consecutiveCalledStrikes, consecutiveTargetHits: state.sequence.consecutiveTargetHits,
    consecutiveVelocityDown: state.sequence.consecutiveVelocityDown, interpretations: row.interpretation.interpretations.map(item => item.type), candidates: row.decision.candidates, selectedIntent: row.decision.selectedIntent };
});
console.log('DECISION_PRODUCTION_JSON=' + JSON.stringify({ passed, failed: 0, paIdentity: history[0].pitch.paIdentity,
  witness, checks: on.checks, swingChecks: swingOn.checks, compressedRejected: on.match.simulationLog.filter(e => e.resolutionMode === 'compressedPlateAppearance').length,
  incrementalRebuildEquivalent: true, saveReload: true, wholeMatchEquivalent: true }));
