'use strict';
const assert = require('assert/strict'), fs = require('fs'), cp = require('child_process'), path = require('path');
const { discover } = require('./match-m0-after-r2-admission-context.cjs');
const { assertPitchProductionSourceScope } = require('./pitch-production-source-scope.cjs');
const O = require('../pitch-observation-foundation'), S = require('../pitch-sequence-state-foundation');
const clone = value => JSON.parse(JSON.stringify(value));
const rebuild = history => S.build(history.map(O.observePitch));
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };

function play({ sequence = false, reload = false, policy = 'take' } = {}) {
  const { h, row } = discover(440000, { observe: false });
  assert(row.matchReached && !row.error);
  const captured = [];
  h.context.__captureSequence = value => captured.push(clone(value));
  if (sequence) h.run(`
    var sequenceChecks={calls:0,rngDraws:0,sourceMutations:0,previousStateMutations:0};
    var sequenceStates=new Map();
    var originalSequenceResolution=resolveHighSchoolPlateDecisionPitch;
    resolveHighSchoolPlateDecisionPitch=function(...args){
      const result=originalSequenceResolution.apply(this,args);
      if(result?.event){
        const history=result.plateAppearanceState.pitchHistory;
        if(JSON.stringify(history.at(-1))!==JSON.stringify(result.event))throw Error('Event is not canonical history');
        const sourceBefore=JSON.stringify(player),rngBefore=m0DiscoveryRandom,savedRandom=Math.random;
        try{
          Math.random=function(){sequenceChecks.rngDraws++;throw Error('Sequence drew RNG');};
          const projections=history.map(PitchObservationFoundation.observePitch);
          const pitch=projections.at(-1),observationsBefore=JSON.stringify(projections);
          const previous=sequenceStates.get(pitch.paIdentity)||PitchSequenceStateFoundation.createInitialSequenceState(pitch.paIdentity);
          const previousBefore=JSON.stringify(previous);
          const appended=PitchSequenceStateFoundation.appendPitchObservation(previous,pitch);
          const rebuilt=PitchSequenceStateFoundation.build(projections);
          if(!appended.supported||!rebuilt.supported)throw Error(appended.reason||rebuilt.reason);
          if(JSON.stringify(appended)!==JSON.stringify(rebuilt))throw Error('Incremental/rebuild mismatch');
          for(let i=0;i<3;i++)if(JSON.stringify(rebuilt)!==JSON.stringify(PitchSequenceStateFoundation.build(projections)))throw Error('Sequence non-determinism');
          if(JSON.stringify(previous)!==previousBefore){sequenceChecks.previousStateMutations++;throw Error('Previous state mutation');}
          if(JSON.stringify(projections)!==observationsBefore)throw Error('Observation mutation');
          sequenceStates.set(pitch.paIdentity,appended);
          __captureSequence({paIdentity:pitch.paIdentity,pitchId:pitch.pitchId,observations:pitch.observations.map(o=>o.type),state:appended});
        }finally{Math.random=savedRandom;}
        if(JSON.stringify(player)!==sourceBefore){sequenceChecks.sourceMutations++;throw Error('Source mutation');}
        if(m0DiscoveryRandom!==rngBefore)throw Error('RNG cursor mutation');
        sequenceChecks.calls++;
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
        const before = h.json(expression), expected = rebuild(before.history);
        assert(expected.supported);
        h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');
        assert.deepEqual(h.json(expression), before);
        assert.deepEqual(rebuild(h.json('player.highSchoolMatch.offensivePlateAppearanceState.pitchHistory')), expected);
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
  const statesBefore = histories.map(rebuild);
  assert(statesBefore.length && statesBefore.every(s => s.supported));
  h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');
  const loaded = h.json('player.highSchoolMatch');
  assert.deepEqual(loaded.completedMoments.filter(m => m.pitchHistory?.length).map(m => rebuild(m.pitchHistory)), statesBefore);
  assert.deepEqual(rebuild(loaded.lastOffensiveResolution.pitchHistory), rebuild(match.lastOffensiveResolution.pitchHistory));
  const saveText = h.run('JSON.stringify(player)');
  assert(!saveText.includes(S.VERSION)); assert(!saveText.includes('sequenceStateV1'));
  return { match, histories, captured, saved, rng: h.run('m0DiscoveryRandom'),
    checks: sequence ? h.json('sequenceChecks') : null };
}

const off = play(), on = play({ sequence: true }), reload = play({ sequence: true, reload: true });
const swingOff = play({ policy: 'swing' }), swingOn = play({ sequence: true, policy: 'swing' });
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
  }
});
test('3 Sequence ON/OFF leaves whole match, tactical state, record and RNG unchanged', () => {
  assert.deepEqual(on.match, off.match); assert.equal(on.rng, off.rng);
  assert.deepEqual(swingOn.match, swingOff.match); assert.equal(swingOn.rng, swingOff.rng);
});
test('4 live save/load rebuild resumes identically with derived memory discarded', () => {
  assert(reload.saved); assert.deepEqual(reload.match, on.match);
  assert.deepEqual(reload.captured, on.captured); assert.equal(reload.rng, on.rng);
});
test('5 RNG draws, source mutations and previous-state mutations stay zero', () => {
  for (const run of [on, reload, swingOn]) {
    assert(run.checks.calls > 0); assert.equal(run.checks.rngDraws, 0);
    assert.equal(run.checks.sourceMutations, 0); assert.equal(run.checks.previousStateMutations, 0);
  }
});
test('6 genuine compressed NPC events remain unsupported with no fabricated sequence', () => {
  const events = on.match.simulationLog.filter(e => e.resolutionMode === 'compressedPlateAppearance'); assert(events.length);
  for (const event of events) {
    assert(!Object.hasOwn(event, 'pitchHistory')); assert(!Object.hasOwn(event, 'pitchCount'));
    const state = S.build([O.observePitch(event)]); assert.equal(state.supported, false);
    assert.equal(state.reason, 'UNSUPPORTED_OBSERVED_PITCH'); assert(!Object.hasOwn(state, 'pitchCount'));
  }
  for (const ref of on.match.gameRecord.eventRefs) assert.equal(S.build([O.observePitch(ref)]).supported, false);
});
test('7 finished persisted copies rebuild identically without a new save authority', () => {
  for (const run of [on, reload, swingOn]) {
    assert(!JSON.stringify(run.match).includes(S.VERSION)); assert(!Object.hasOwn(run.match, 'pitchSequenceState'));
  }
});
test('8 protected pitch sources retain scoped script freeze and exact repeat eligibility extraction', () => {
  const root = path.resolve(__dirname, '..');
  for (const file of ['pitch-observation-foundation.js', 'offensive-plate-approach.js', 'pitcher-catcher-tactical-integration.js', 'pitch-sequencing.js', 'save.js', 'script.js']) {
    const current = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n?/g, '\n');
    const baseline = cp.execFileSync('git', ['show', 'a0e512b439446990d8df118e3e7d737b9f2f51d3:' + file], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replace(/\r\n?/g, '\n');
    if (file === 'pitcher-catcher-tactical-integration.js') require('./pitch-tactical-selector-extraction-baseline.cjs').assertOnlyRepeatEligibilityExtraction(current, baseline);
    else if (file === 'script.js') assertPitchProductionSourceScope(current, baseline);
    else assert.equal(current, baseline, file);
  }
});
const history = on.histories.find(h => h.length >= 3);
const witness = history.map(event => {
  const row = on.captured.find(r => r.pitchId === event.pitch.pitchId), state = row.state;
  return { pitchNumber: event.pitchNumber, observations: row.observations, pitchCount: state.pitchCount,
    currentCount: state.currentCount, consecutiveTakes: state.sequence.consecutiveTakes, consecutiveSwings: state.sequence.consecutiveSwings,
    targetHits: state.location.targetHits, largeMisses: state.location.largeMisses, measuredPitches: state.location.measuredPitches,
    unobservedLocationPitches: state.location.unobservedPitches, chases: state.batterResponse.chased,
    swingMisses: state.contact.swingMisses, hardContacts: state.contact.hardContacts };
});
console.log('SEQUENCE_PRODUCTION_JSON=' + JSON.stringify({ passed, failed: 0, paIdentity: history[0].pitch.paIdentity,
  witness, checks: on.checks, swingChecks: swingOn.checks, compressedRejected: on.match.simulationLog.filter(e => e.resolutionMode === 'compressedPlateAppearance').length,
  incrementalRebuildEquivalent: true, saveReload: true, wholeMatchEquivalent: true }));
