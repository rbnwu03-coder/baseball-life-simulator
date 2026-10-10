'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path'), cp = require('child_process');
const { discover } = require('./match-m0-after-r2-admission-context.cjs');
const O = require('../pitch-observation-foundation'), S = require('../pitch-sequence-state-foundation');
const I = require('../pitch-tactical-interpretation-foundation'), G = require('../pitch-tactical-signal-projection-foundation');
const P = require('../offensive-plate-approach');
const { assertPitchProductionSourceScope } = require('./pitch-production-source-scope.cjs');
const clone = value => JSON.parse(JSON.stringify(value));
const BASELINE = '674e49115a9ed7d67c69a3023b5a594d41fe584c';

// TEST-ONLY caller: Interpretation owns evidence, existing PA state owns lifecycle.
// Neither Decision nor Adapter participates in this chain.
function projectState(state) {
  const observations = state.pitchHistory.map(O.observePitch);
  const sequence = observations.length ? S.build(observations) : S.createInitialSequenceState(state.paIdentity);
  const interpretation = I.interpret(sequence);
  const boundary = { paIdentity: state.paIdentity, completedPitchCount: state.pitchHistory.length, pitchNumber: state.pitchNumber,
    completed: state.completed, awaitingDefense: state.awaitingDefense, result: state.result, balls: state.balls, strikes: state.strikes };
  return { observations, sequence, interpretation, boundary, projection: G.project(interpretation, boundary) };
}
function terminalStates(match) {
  return match.completedMoments.filter(moment => moment.pitchHistory?.length).map(moment => {
    const history = moment.pitchHistory, last = history.at(-1);
    assert(last.paResult, 'genuine completed PA closure');
    // Actual persisted completed history, normalized by the existing owner.
    // paResult establishes closure only; success/damage is never evaluated.
    return { last, state: P.createPlateAppearanceState({ paIdentity: last.pitch.paIdentity, pitchHistory: history,
      pitchNumber: history.length, balls: last.countAfter.balls, strikes: last.countAfter.strikes, completed: true, result: last.paResult }) };
  });
}
function finishedProjections(match, captures) {
  const historical = match.completedMoments.flatMap(moment => (moment.pitchHistory || []).map((event, index, history) => {
    // Reconstruct a previously captured live prefix for replay verification only.
    // This never makes the finished PA available for a new production pitch.
    const state = P.createPlateAppearanceState({ paIdentity: event.pitch.paIdentity, pitchHistory: history.slice(0, index),
      pitchNumber: index, balls: event.countBefore.balls, strikes: event.countBefore.strikes });
    const chain = projectState(state), captured = captures.find(row => row.pitchId === event.pitch.pitchId);
    assert(captured, 'historical prefix had a genuine captured live boundary');
    assert.deepEqual(chain.boundary, captured.boundary); assert.deepEqual(chain.projection, captured.projection);
    return chain;
  }));
  return { historical, terminal: terminalStates(match).map(({ state }) => projectState(state)) };
}
function nextMatch(h, previousId) {
  // Normal UI continuation, bounded before running; no capability/pitch edits.
  for (let step = 0; step < 120; step++) {
    const s = h.json('({event:getCurrentEventId(),id:player.highSchoolMatch?.id,completed:player.highSchoolMatch?.completed,'
      + 'transition:isTransitioning,training:!!pendingTrainingOutcome,outcome:!!pendingYouthSeasonOutcome,'
      + 'gameplay:pendingBaseballGameplay?.stage,school:isSchoolInvitationChoicePending(player)})');
    if (s.id && s.id !== previousId && !s.completed) return true;
    if (s.training) h.run('continueTrainingOutcome()');
    else if (s.outcome) h.run('continueYouthSeasonOutcome()');
    else if (s.transition) { if (!h.run('__runNextTimer()')) return false; }
    else if (s.school) h.run('beginSchoolInvitationConfirmationAt(0);confirmSchoolInvitationSelection()');
    else if (s.gameplay === 'throw-decision') h.run('chooseYouthGrounderThrow(youthGrounderThrowChoices[0].code)');
    else {
      const choices = h.json('getEvent(getCurrentEventId()).choices'); if (!choices.length) return false;
      const navigation = choices.findIndex(c => c.nextChapter || c.sleep);
      h.run(`choose(getCurrentEventId(),${navigation >= 0 ? navigation : 0})`);
    }
  }
  return false;
}
function play({ seed, policy, shadow, reload = false }) {
  const { h, row } = discover(seed, { observe: false }); assert(row.matchReached && !row.error, 'normal admission');
  // Browser convention verified through the harness; index.html stays untouched.
  h.run(fs.readFileSync(path.join(__dirname, '../pitch-tactical-signal-projection-foundation.js'), 'utf8'));
  h.run(`var signalProjectionChecks={calls:0,rngDraws:0,mutations:0};
    function projectSignalShadow(state){
      const before=JSON.stringify(player),cursor=m0DiscoveryRandom,random=Math.random;
      try {
        Math.random=function(){signalProjectionChecks.rngDraws++;throw Error('Signal shadow RNG');};
        const observations=state.pitchHistory.map(PitchObservationFoundation.observePitch);
        const sequence=observations.length?PitchSequenceStateFoundation.build(observations)
          :PitchSequenceStateFoundation.createInitialSequenceState(state.paIdentity);
        const interpretation=PitchTacticalInterpretationFoundation.interpret(sequence);
        const boundary={paIdentity:state.paIdentity,completedPitchCount:state.pitchHistory.length,pitchNumber:state.pitchNumber,
          completed:state.completed,awaitingDefense:state.awaitingDefense,result:state.result,balls:state.balls,strikes:state.strikes};
        const projection=PitchTacticalSignalProjectionFoundation.project(interpretation,boundary);
        if(JSON.stringify(player)!==before){signalProjectionChecks.mutations++;throw Error('Signal shadow mutation');}
        if(m0DiscoveryRandom!==cursor)throw Error('Signal shadow cursor mutation');
        signalProjectionChecks.calls++;
        return {observations,sequence,interpretation,boundary,projection};
      } finally {Math.random=random;}
    }`);
  const captures = [], terminals = [], matches = [], seen = new Set();
  const checks = { calls: 0, terminalRebuilds: 0, rngDraws: 0, inputMutations: 0, outcomeReads: 0 };
  let progressionGap = false, liveReloaded = false, finishedReloads = 0, finishedHistoricalBoundaries = 0;
  for (let ordinal = 0; ordinal < 2; ordinal++) {
    let steps = 0;
    while (!h.run('player.highSchoolMatch.completed') && steps++ < 5000) {
      if (h.run('!!pendingYouthSeasonOutcome')) h.run('continueYouthSeasonOutcome()');
      else if (h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)')) {
        const isPlate = h.run('player.highSchoolMatch.activeSituation?.type==="plateDecision" && !!player.highSchoolMatch.offensivePlateAppearanceState?.pendingPitch');
        if (isPlate && shadow) {
          const state = h.json('player.highSchoolMatch.offensivePlateAppearanceState'), pitch = state.pendingPitch;
          assert.equal(pitch.generatorAuthority, 'pitchSequencingCoreSprintA');
          assert.equal(state.pitchNumber, state.pitchHistory.length); assert(!state.completed && !state.awaitingDefense && !state.result);
          if (!seen.has(pitch.pitchId)) {
            const before = clone(state), playerBefore = h.run('JSON.stringify(player)'), cursor = h.run('m0DiscoveryRandom'), random = Math.random;
            try {
              Math.random = () => { checks.rngDraws++; throw Error('Host signal shadow RNG'); };
              const chain = projectState(state); assert(chain.projection.supported, chain.projection.reason);
              assert.equal(chain.projection.status, 'live');
              assert.deepEqual(h.json('projectSignalShadow(player.highSchoolMatch.offensivePlateAppearanceState)'), chain);
              const guarded = clone(state);
              for (const key of ['pendingPitch', 'nextPitchResult', 'paOutcome', 'runsScored']) Object.defineProperty(guarded, key,
                { get() { checks.outcomeReads++; throw Error('Future information read: ' + key); } });
              assert.deepEqual(projectState(guarded), chain);
              assert.deepEqual(state, before); assert.equal(h.run('JSON.stringify(player)'), playerBefore); assert.equal(h.run('m0DiscoveryRandom'), cursor);
              captures.push({ seed, policy, matchIdentity: h.run('player.highSchoolMatch.id'), pitchId: pitch.pitchId,
                interpretationTypes: chain.interpretation.interpretations.map(x => x.type), boundary: chain.boundary, projection: chain.projection,
                // Descriptive production snapshot only, never a projection input.
                production: clone(pitch.pitchTacticalState) });
              checks.calls++; seen.add(pitch.pitchId);
            } finally { Math.random = random; }
          }
          if (reload && !liveReloaded && state.pitchHistory.length > 1) {
            const expression = '({state:player.highSchoolMatch.offensivePlateAppearanceState,record:player.highSchoolMatch.gameRecord,rng:m0DiscoveryRandom})';
            const before = h.json(expression), expected = projectState(state);
            h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');
            assert.deepEqual(h.json(expression), before);
            assert.deepEqual(projectState(h.json('player.highSchoolMatch.offensivePlateAppearanceState')), expected);
            assert.deepEqual(h.json('projectSignalShadow(player.highSchoolMatch.offensivePlateAppearanceState)'), expected);
            liveReloaded = true;
          }
        }
        h.context.signalLegalPolicy = policy;
        assert(h.run(`var signalChoices=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch);
          var signalChoice=signalChoices.find(c=>c.matchDecision===signalLegalPolicy)||signalChoices[0];
          signalChoice&&chooseHighSchoolYearOneMatchMoment(signalChoice.matchDecision,signalChoice.matchMomentId)`));
      } else assert(h.run('__runNextTimer()'), 'pending production timer: ' + JSON.stringify(h.json(
        '({id:player.highSchoolMatch.id,status:player.highSchoolMatch.status,active:player.highSchoolMatch.activeSituation})')));
    }
    const match = h.json('player.highSchoolMatch'); assert(match.completed && !match.activeSituation, 'bounded completed match');
    assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'), []);
    assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'), []);
    matches.push(match);
    if (shadow) for (const { state, last } of terminalStates(match)) {
      const before = clone(state), cursor = h.run('m0DiscoveryRandom'), random = Math.random;
      try {
        Math.random = () => { checks.rngDraws++; throw Error('Terminal projection RNG'); };
        const chain = projectState(state); assert(chain.projection.supported, chain.projection.reason);
        assert.equal(chain.projection.status, 'postPa'); assert.deepEqual(chain.projection.signals, []); assert.equal(chain.projection.nextPitchNumber, null);
        assert.equal(P.resolveNextPitch(state).event, null);
        assert.deepEqual(state, before); assert.equal(h.run('m0DiscoveryRandom'), cursor);
        terminals.push({ seed, policy, matchIdentity: match.id, pitchResult: last.pitchResult,
          interpretationTypes: chain.interpretation.interpretations.map(x => x.type), boundary: chain.boundary, projection: chain.projection,
          evidenceOrigin: 'GENUINE_COMPLETED_HISTORY_RECONSTRUCTION' });
        checks.terminalRebuilds++;
      } finally { Math.random = random; }
    }
    if (reload) {
      const expected = finishedProjections(match, captures), cursor = h.run('m0DiscoveryRandom');
      h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');
      const loaded = h.json('player.highSchoolMatch');
      assert.deepEqual(loaded, match); assert.deepEqual(finishedProjections(loaded, captures), expected); assert.equal(h.run('m0DiscoveryRandom'), cursor);
      finishedReloads++;
      finishedHistoricalBoundaries += expected.historical.length;
    }
    if (ordinal < 1 && !nextMatch(h, match.id)) { progressionGap = true; break; }
  }
  return { seed, policy, captures, terminals, matches, checks, progressionGap, liveReloaded, finishedReloads, finishedHistoricalBoundaries,
    browserChecks: h.json('signalProjectionChecks'), rng: h.run('m0DiscoveryRandom'), player: h.json('player') };
}
function main() {
  let passed = 0;
  const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
  // Predeclared bounded UI routes: two matches each, no result-driven seed search.
  const scenarios = [{ seed: 440000, policy: 'take' }, { seed: 440001, policy: 'contactSwing' }, { seed: 440003, policy: 'powerSwing' }];
  const pairs = scenarios.map(s => ({ on: play({ ...s, shadow: true }), off: play({ ...s, shadow: false }) }));
  const runs = pairs.map(pair => pair.on), rows = runs.flatMap(run => run.captures), terminals = runs.flatMap(run => run.terminals);
  const reloaded = play({ ...scenarios[0], shadow: true, reload: true });
  const witness = type => rows.find(row => row.projection.signals.some(signal => signal.type === type));
  test('1 full normal UI truth chain projects directly from Interpretation at N -> N+1', () => {
    assert(rows.length);
    for (const run of runs) assert.equal(run.captures.length,
      run.matches.flatMap(match => match.completedMoments.flatMap(moment => moment.pitchHistory || [])).length,
      'every detailed pitch has its genuine pre-pitch boundary');
    for (const row of rows) {
      assert.equal(row.projection.status, 'live'); assert.equal(row.projection.paIdentity, row.boundary.paIdentity);
      assert.equal(row.projection.completedPitchCount, row.boundary.pitchNumber);
      assert.equal(row.projection.nextPitchNumber, row.boundary.pitchNumber + 1);
      assert.equal(row.production.context.pitchIndex, row.projection.nextPitchNumber);
    }
  });
  test('2 naturally reached signals have their canonical Interpretation provenance', () => {
    const sourceMap = { takePattern: 'TAKE_PATTERN_PRESENT', calledStrikePattern: 'CALLED_STRIKE_PATTERN_PRESENT',
      chasePattern: 'CHASE_PATTERN_PRESENT', swingMissPattern: 'SWING_MISS_PATTERN_PRESENT' };
    for (const row of rows) for (const signal of row.projection.signals) {
      assert(row.interpretationTypes.includes(sourceMap[signal.type])); assert.equal(signal.scope, 'CURRENT_PA_NEXT_PITCH_SIGNAL');
    }
    // Bounded natural coverage gaps are reported below, never repaired by fixtures.
    assert(G.SIGNAL_TYPES.some(type => witness(type)));
  });
  test('3 naturally coexisting Take and Called Strike remain parallel facts', () => {
    assert(rows.some(row => ['takePattern', 'calledStrikePattern'].every(type => row.projection.signals.some(x => x.type === type))));
    for (const row of rows) assert.deepEqual(row.projection.signals.map(x => x.type),
      G.SIGNAL_TYPES.filter(type => row.projection.signals.some(x => x.type === type)));
  });
  test('4 genuine terminal BIP is postPa with zero next-pitch signals', () => {
    const bip = terminals.filter(row => row.pitchResult === 'ballInPlay'); assert(bip.length, 'natural terminal BIP required');
    for (const row of bip) { assert.equal(row.projection.status, 'postPa'); assert.deepEqual(row.projection.signals, []); }
  });
  test('5 terminal Take pattern still exists but is unavailable for another pitch', () => {
    const take = terminals.filter(row => row.interpretationTypes.includes('TAKE_PATTERN_PRESENT')); assert(take.length);
    for (const row of take) { assert.equal(row.projection.status, 'postPa'); assert.deepEqual(row.projection.signals, []); assert.equal(row.projection.nextPitchNumber, null); }
    for (const row of terminals) assert(!rows.some(live => live.seed === row.seed && live.policy === row.policy
      && live.boundary.paIdentity === row.boundary.paIdentity && live.boundary.completedPitchCount >= row.boundary.completedPitchCount));
  });
  test('6 new PA resets Interpretation/signals despite retained production memory', () => {
    const fresh = rows.filter(row => row.boundary.pitchNumber === 0); assert(fresh.length);
    for (const row of fresh) { assert.deepEqual(row.interpretationTypes, []); assert.equal(row.projection.status, 'live'); assert.deepEqual(row.projection.signals, []); }
    assert(fresh.some(row => row.production.context.sequenceHistory.length), 'separate production cross-PA memory is naturally retained');
    assert(rows.some((row, index) => index && row.seed === rows[index - 1].seed && row.policy === rows[index - 1].policy
      && row.boundary.paIdentity !== rows[index - 1].boundary.paIdentity && row.boundary.pitchNumber === 0));
  });
  test('7 shadow ON/OFF preserves whole matches, tactical state, GameRecord, player and RNG', () => {
    for (const { on, off } of pairs) {
      assert.deepEqual(on.matches, off.matches); assert.deepEqual(on.player, off.player); assert.equal(on.rng, off.rng);
      assert.deepEqual(on.matches.map(x => x.gameRecord), off.matches.map(x => x.gameRecord));
      const tactical = run => run.matches.flatMap(match => match.completedMoments.flatMap(moment => (moment.pitchHistory || []).map(event => event.pitch.pitchTacticalState)));
      assert.deepEqual(tactical(on), tactical(off)); assert.equal(on.progressionGap, off.progressionGap);
    }
  });
  test('8 host/browser chains use no RNG and change no source state', () => {
    for (const run of [...runs, reloaded]) {
      assert.equal(run.checks.rngDraws, 0); assert.equal(run.checks.inputMutations, 0);
      assert.equal(run.browserChecks.rngDraws, 0); assert.equal(run.browserChecks.mutations, 0);
      assert.equal(run.browserChecks.calls, run.checks.calls + (run.liveReloaded ? 1 : 0));
    }
  });
  test('9 pending N+1 truth and future outcome getters are never read', () => {
    assert([...runs, reloaded].every(run => run.checks.calls > 0 && run.checks.outcomeReads === 0));
    for (const row of rows) assert(!Object.hasOwn(row.projection, 'nextPitchResult') && !Object.hasOwn(row.projection, 'paOutcome'));
  });
  test('10 live reload rebuilds identically from persisted truth and finishes identically', () => {
    assert(reloaded.liveReloaded); assert.deepEqual(reloaded.captures, runs[0].captures);
    assert.deepEqual(reloaded.matches, runs[0].matches); assert.equal(reloaded.rng, runs[0].rng);
  });
  test('11 both finished matches rebuild identical historical and terminal projections after save/load', () => {
    assert.equal(reloaded.finishedReloads, 2); assert.deepEqual(reloaded.terminals, runs[0].terminals);
    assert.equal(reloaded.finishedHistoricalBoundaries, reloaded.captures.length);
  });
  test('12 no signal/Interpretation projection or schema is persisted', () => {
    for (const run of [...runs, reloaded]) {
      const saved = JSON.stringify(run.player);
      for (const forbidden of [G.VERSION, G.SOURCE, I.VERSION, 'signalProjectionChecks', 'deferredInterpretations', 'sourceInterpretations', 'CURRENT_PA_NEXT_PITCH_SIGNAL']) {
        assert(!saved.includes(forbidden), forbidden);
      }
    }
  });
  test('13 deferred patterns never become production purposes or projected signals', () => {
    assert(rows.some(row => row.projection.deferredInterpretations.includes('REPEATED_TARGET_HITS')));
    for (const row of [...rows, ...terminals]) {
      assert.deepEqual(row.projection.deferredInterpretations, G.DEFERRED_INTERPRETATIONS.filter(type => row.interpretationTypes.includes(type)));
      assert(row.projection.signals.every(signal => G.SIGNAL_TYPES.includes(signal.type)));
    }
  });
  test('14 protected pitch runtime owners, browser loading and save sources retain their original freeze boundaries', () => {
    const root = path.resolve(__dirname, '..');
    for (const file of ['pitch-observation-foundation.js', 'pitch-sequence-state-foundation.js', 'pitch-tactical-interpretation-foundation.js',
      'pitch-tactical-decision-foundation.js', 'pitch-tactical-decision-production-adapter.js', 'pitcher-catcher-tactical-integration.js',
      'offensive-plate-approach.js', 'plate-decision-foundation.js', 'pitch-sequencing.js', 'script.js', 'save.js', 'index.html']) {
      const current = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n?/g, '\n');
      const baseline = cp.execFileSync('git', ['show', BASELINE + ':' + file], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replace(/\r\n?/g, '\n');
      if (file === 'script.js') assertPitchProductionSourceScope(current, baseline);
      else assert.equal(current, baseline, file);
    }
  });
  const gaps = G.SIGNAL_TYPES.filter(type => !witness(type)).map(type => 'COVERAGE_GAP: NATURAL_' + type);
  if (runs.some(run => run.progressionGap)) gaps.push('COVERAGE_GAP: TWO_MATCH_UI_PROGRESSION');
  if (!terminals.some(row => row.pitchResult === 'ballInPlay' && row.interpretationTypes.some(type =>
    ['TAKE_PATTERN_PRESENT', 'CALLED_STRIKE_PATTERN_PRESENT', 'CHASE_PATTERN_PRESENT', 'SWING_MISS_PATTERN_PRESENT'].includes(type)))) {
    gaps.push('COVERAGE_GAP: NATURAL_TERMINAL_BIP_WITH_READY_PATTERN');
  }
  for (const type of G.DEFERRED_INTERPRETATIONS) if (![...rows, ...terminals].some(row => row.interpretationTypes.includes(type))) {
    gaps.push('COVERAGE_GAP: NATURAL_DEFERRED_' + type);
  }
  const summary = { suite: 'pitch-tactical-signal-projection-production-integration', baseline: BASELINE, passed, failed: 0, scenarios,
    onMatches: runs.reduce((n, run) => n + run.matches.length, 0), offMatches: pairs.reduce((n, pair) => n + pair.off.matches.length, 0),
    matchIdentities: [...new Set(rows.map(row => row.matchIdentity))], boundaries: rows.length,
    signals: Object.fromEntries(G.SIGNAL_TYPES.map(type => [type, rows.filter(row => row.projection.signals.some(signal => signal.type === type)).length])),
    witnesses: Object.fromEntries(G.SIGNAL_TYPES.map(type => { const row = witness(type); return [type, row ? {
      seed: row.seed, policy: row.policy, matchIdentity: row.matchIdentity, paIdentity: row.boundary.paIdentity,
      completedPitchCount: row.boundary.completedPitchCount, nextPitchNumber: row.projection.nextPitchNumber,
      signal: row.projection.signals.find(signal => signal.type === type) } : null]; })),
    freshPAs: rows.filter(row => row.boundary.pitchNumber === 0).length, terminals: terminals.length,
    terminalBIP: terminals.filter(row => row.pitchResult === 'ballInPlay').length,
    terminalTakePattern: terminals.filter(row => row.interpretationTypes.includes('TAKE_PATTERN_PRESENT')).length,
    terminalBIPWithReadyPattern: terminals.filter(row => row.pitchResult === 'ballInPlay' && row.interpretationTypes.some(type =>
      ['TAKE_PATTERN_PRESENT', 'CALLED_STRIKE_PATTERN_PRESENT', 'CHASE_PATTERN_PRESENT', 'SWING_MISS_PATTERN_PRESENT'].includes(type))).length,
    gaps, rngDraws: 0, inputMutations: 0, outcomeReads: 0, wholeMatchEquivalent: true, tacticalStateEquivalent: true,
    gameRecordEquivalent: true, playerEquivalent: true, rngCursorEquivalent: true,
    liveReloaded: reloaded.liveReloaded, finishedReloads: reloaded.finishedReloads,
    finishedHistoricalBoundaries: reloaded.finishedHistoricalBoundaries, runtimeGameplayChanges: 0 };
  console.log(JSON.stringify(summary)); return summary;
}
if (require.main === module) main();
module.exports = { projectState, play, main };
