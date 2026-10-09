'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path'), cp = require('child_process');
const { discover } = require('./match-m0-after-r2-admission-context.cjs');
const { projectState, identicalCallEvidence } = require('./pitch-tactical-intent-semantic-boundary-test');
const P = require('../offensive-plate-approach'), A = require('../pitch-tactical-decision-production-adapter');
const T = require('../pitcher-catcher-tactical-integration');
const clone = value => JSON.parse(JSON.stringify(value));
const BASELINE = '2a4b44a034b714b8de3c8a6897507995ab0f8ccd';

function nextMatch(h, previousId) {
  // Normal UI continuation, bounded to 120 actions; no roster/capability edits.
  for (let step = 0; step < 120; step++) {
    const s = h.json('({event:getCurrentEventId(),chapter:player.chapter,id:player.highSchoolMatch?.id,completed:player.highSchoolMatch?.completed,'
      + 'transition:isTransitioning,training:!!pendingTrainingOutcome,outcome:!!pendingYouthSeasonOutcome,'
      + 'gameplay:pendingBaseballGameplay?.stage,school:isSchoolInvitationChoicePending(player)})');
    if (s.id && s.id !== previousId && !s.completed) return true;
    if (s.training) h.run('continueTrainingOutcome()');
    else if (s.outcome) h.run('continueYouthSeasonOutcome()');
    else if (s.transition) { if (!h.run('__runNextTimer()')) return false; }
    else if (s.school) h.run('beginSchoolInvitationConfirmationAt(0);confirmSchoolInvitationSelection()');
    else if (s.gameplay === 'throw-decision') h.run('chooseYouthGrounderThrow(youthGrounderThrowChoices[0].code)');
    else {
      const choices = h.json('getEvent(getCurrentEventId()).choices');
      if (!choices.length) return false;
      const navigation = choices.findIndex(c => c.nextChapter || c.sleep);
      h.run(`choose(getCurrentEventId(),${navigation >= 0 ? navigation : 0})`);
    }
  }
  return false;
}

function play({ seed, policy, shadow }) {
  const { h, row } = discover(seed, { observe: false });
  assert(row.matchReached && !row.error, 'normal admission');
  const captures = [], terminals = [], matches = [], seen = new Set();
  const checks = { calls: 0, rngDraws: 0, mutations: 0, outcomeReads: 0 };
  let progressionGap = false;
  h.run(`var semanticWitnessChecks={calls:0,rngDraws:0,mutations:0};
    function rebuildSemanticWitness(state){
      const before=JSON.stringify(player),cursor=m0DiscoveryRandom,random=Math.random;
      try {
        Math.random=function(){semanticWitnessChecks.rngDraws++;throw Error('Semantic witness RNG');};
        const sequence=state.pitchHistory.length?PitchSequenceStateFoundation.build(state.pitchHistory.map(PitchObservationFoundation.observePitch))
          :PitchSequenceStateFoundation.createInitialSequenceState(state.paIdentity);
        const interpretation=PitchTacticalInterpretationFoundation.interpret(sequence),decision=PitchTacticalDecisionFoundation.decide(interpretation);
        const boundary={paIdentity:state.paIdentity,pitchCount:state.pitchHistory.length,tacticalContext:state.pendingPitch.pitchTacticalState.context};
        const adapter=PitchTacticalDecisionProductionAdapter.adapt(decision,boundary);
        if(JSON.stringify(player)!==before){semanticWitnessChecks.mutations++;throw Error('Semantic witness mutation');}
        if(m0DiscoveryRandom!==cursor)throw Error('Semantic witness cursor mutation');
        semanticWitnessChecks.calls++;
        return {sequence,interpretation,decision,adapter};
      } finally {Math.random=random;}
    }`);
  for (let ordinal = 0; ordinal < 2; ordinal++) {
    let steps = 0;
    while (!h.run('player.highSchoolMatch.completed') && steps++ < 5000) {
      if (h.run('!!pendingYouthSeasonOutcome')) h.run('continueYouthSeasonOutcome()');
      else if (h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)')) {
        const isPlate = h.run('player.highSchoolMatch.activeSituation?.type==="plateDecision" && !!player.highSchoolMatch.offensivePlateAppearanceState?.pendingPitch');
        if (isPlate && shadow) {
          const state = h.json('player.highSchoolMatch.offensivePlateAppearanceState'), pitch = state.pendingPitch;
          assert.equal(pitch.generatorAuthority, 'pitchSequencingCoreSprintA');
          assert.equal(state.pitchNumber, state.pitchHistory.length);
          assert(!state.completed && !state.awaitingDefense && !state.result);
          if (!seen.has(pitch.pitchId)) {
            const playerBefore = h.run('JSON.stringify(player)'), cursor = h.run('m0DiscoveryRandom');
            const stateBefore = clone(state), random = Math.random;
            try {
              Math.random = () => { checks.rngDraws++; throw Error('Host semantic witness RNG'); };
              const projection = projectState(state), tactical = pitch.pitchTacticalState;
              const boundary = { paIdentity: state.paIdentity, pitchCount: state.pitchNumber, tacticalContext: tactical.context };
              const adapter = A.adapt(projection.decision, boundary);
              assert.equal(adapter.supported, true, adapter.reason);
              assert.deepEqual(T.chooseTacticalIntent(tactical.context), tactical.intentDecision);
              assert.deepEqual(h.json('rebuildSemanticWitness(player.highSchoolMatch.offensivePlateAppearanceState)'),
                { sequence: projection.sequence, interpretation: projection.interpretation, decision: projection.decision, adapter });
              // The Foundation/availability projection must not inspect pending N+1 truth or later outcomes.
              const guarded = clone(state);
              for (const key of ['pendingPitch', 'nextPitchResult', 'paOutcome', 'runsScored']) Object.defineProperty(guarded, key,
                { get() { checks.outcomeReads++; throw Error('Future information read: ' + key); } });
              assert.deepEqual(projectState(guarded), projection);
              assert.deepEqual(state, stateBefore);
              assert.equal(h.run('JSON.stringify(player)'), playerBefore);
              assert.equal(h.run('m0DiscoveryRandom'), cursor);
              captures.push({ seed, policy, matchIdentity: h.run('player.highSchoolMatch.id'), pitchId: pitch.pitchId,
                paIdentity: state.paIdentity, completedPitchCount: state.pitchNumber, nextPitchNumber: state.pitchNumber + 1,
                availability: projection.availability, sequence: projection.sequence,
                interpretationTypes: projection.interpretation.interpretations.map(x => x.type), decision: projection.decision, adapter,
                repeatEligibility: T.getRepeatSuccessEligibility(tactical.context), callEvidence: identicalCallEvidence(tactical.context.sequenceHistory),
                production: tactical.intentDecision, context: clone(tactical.context) });
              checks.calls++;
            } finally { Math.random = random; }
            seen.add(pitch.pitchId);
          }
        }
        h.context.semanticLegalPolicy = policy;
        assert(h.run(`var semanticChoices=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch);
          var semanticChoice=semanticChoices.find(c=>c.matchDecision===semanticLegalPolicy)||semanticChoices[0];
          semanticChoice&&chooseHighSchoolYearOneMatchMoment(semanticChoice.matchDecision,semanticChoice.matchMomentId)`));
      } else assert(h.run('__runNextTimer()'), 'pending production timer: ' + JSON.stringify(h.json(
        '({id:player.highSchoolMatch.id,event:getCurrentEventId(),status:player.highSchoolMatch.status,active:player.highSchoolMatch.activeSituation,training:!!pendingTrainingOutcome})')));
    }
    const match = h.json('player.highSchoolMatch');
    assert(match.completed && !match.activeSituation, 'bounded completed match');
    assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'), []);
    assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'), []);
    matches.push(match);
    if (shadow) for (const moment of match.completedMoments) {
      const history = moment.pitchHistory;
      if (!history?.length) continue;
      const last = history.at(-1);
      if (last.pitchResult !== 'ballInPlay' || !last.paResult) continue;
      // Reconstruction from genuine completed history. paResult is only a
      // lifecycle closure marker; outcome success/damage is never evaluated.
      const terminal = P.createPlateAppearanceState({ paIdentity: last.pitch.paIdentity, pitchHistory: history,
        pitchNumber: history.length, balls: last.countAfter.balls, strikes: last.countAfter.strikes, completed: true, result: last.paResult });
      const snapshot = clone(terminal), cursor = h.run('m0DiscoveryRandom'), random = Math.random;
      try {
        Math.random = () => { checks.rngDraws++; throw Error('Terminal witness RNG'); };
        const projection = projectState(terminal);
        assert(projection.interpretation.supported);
        assert.equal(projection.availability.classification, 'POST_PA_EVIDENCE');
        assert.equal(P.resolveNextPitch(terminal).event, null);
        assert.deepEqual(terminal, snapshot); assert.equal(h.run('m0DiscoveryRandom'), cursor);
        terminals.push({ seed, policy, matchIdentity: match.id, paIdentity: terminal.paIdentity, completedPitchCount: terminal.pitchNumber,
          pitchResult: last.pitchResult, interpretationTypes: projection.interpretation.interpretations.map(x => x.type),
          availability: projection.availability, evidenceOrigin: 'GENUINE_COMPLETED_HISTORY_RECONSTRUCTION' });
      } finally { Math.random = random; }
    }
    if (ordinal < 1 && !nextMatch(h, match.id)) { progressionGap = true; break; }
  }
  return { seed, policy, captures, terminals, matches, checks, progressionGap,
    browserChecks: h.json('semanticWitnessChecks'), rng: h.run('m0DiscoveryRandom'), player: h.json('player') };
}

function main() {
  let passed = 0;
  const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
  // Three predeclared seeds/policies, at most two normally reached matches
  // per route and one ON/OFF pair each. No search until a desired result appears.
  const scenarios = [{ seed: 440000, policy: 'take' }, { seed: 440001, policy: 'contactSwing' }, { seed: 440003, policy: 'powerSwing' }];
  const pairs = scenarios.map(s => ({ on: play({ ...s, shadow: true }), off: play({ ...s, shadow: false }) }));
  const runs = pairs.map(x => x.on), rows = runs.flatMap(x => x.captures), terminals = runs.flatMap(x => x.terminals);
  const witness = type => rows.find(x => x.interpretationTypes.includes(type));
  test('1 live UI boundaries preserve same PA identity and completed N -> N+1', () => {
    assert(rows.length);
    for (const run of runs) assert.equal(run.captures.length,
      run.matches.flatMap(match => match.completedMoments.flatMap(moment => moment.pitchHistory || [])).length,
      'every detailed player pitch has a captured pre-pitch boundary');
    for (const row of rows) {
      assert.equal(row.availability.classification, 'CURRENT_PA_NEXT_PITCH_SIGNAL');
      assert.equal(row.availability.paIdentity, row.paIdentity);
      assert.equal(row.nextPitchNumber, row.completedPitchCount + 1);
      assert.equal(row.context.pitchIndex, row.nextPitchNumber);
      assert.equal(row.decision.paIdentity, row.adapter.paIdentity);
    }
  });
  test('2 normal legal policies produce genuine take, chase, swing miss and repeat-related witnesses', () => {
    for (const type of ['TAKE_PATTERN_PRESENT', 'CHASE_PATTERN_PRESENT', 'SWING_MISS_PATTERN_PRESENT', 'REPEATED_TARGET_HITS']) assert(witness(type), type);
    assert(rows.some(x => x.decision.selectedIntent === 'repeatSuccess'));
  });
  test('3 every new PA resets Foundation evidence while Production may retain cross-PA history', () => {
    const fresh = rows.filter(x => !x.completedPitchCount); assert(fresh.length);
    for (const row of fresh) {
      assert.equal(row.sequence.contact.hardContactsOnLocationMiss, 0);
      assert.deepEqual(row.interpretationTypes, []); assert.equal(row.decision.selectedIntent, 'resetNeutral');
      assert.equal(row.adapter.status, 'abstain');
    }
    assert(fresh.some(x => x.context.sequenceHistory.length), 'production memory is separate from Foundation PA reset');
  });
  test('4 naturally available terminal BIP is post-PA evidence with no next-pitch boundary', () => {
    for (const row of terminals) {
      assert.equal(row.availability.nextPitchAvailable, false);
      assert(!rows.some(x => x.paIdentity === row.paIdentity && x.seed === row.seed && x.policy === row.policy
        && x.completedPitchCount >= row.completedPitchCount));
    }
    // Missing BIP/hard-miss witnesses are reported as COVERAGE_GAP, never fixtures.
  });
  test('5 naturally different repeat calls demonstrate partial alignment and canonical admission', () => {
    const repeat = rows.filter(x => x.decision.selectedIntent === 'repeatSuccess'); assert(repeat.length);
    assert(repeat.some(x => x.callEvidence === 'NOT_IDENTICAL_CALL_EVIDENCE'));
    for (const row of repeat) assert.equal(row.adapter.status, row.repeatEligibility.repeatEligible ? 'candidate' : 'abstain');
  });
  test('6 shadow ON/OFF preserves all reached matches, tactical state, GameRecord, player and RNG', () => {
    for (const { on, off } of pairs) {
      assert.deepEqual(on.matches, off.matches); assert.deepEqual(on.player, off.player);
      assert.equal(on.rng, off.rng); assert.equal(on.progressionGap, off.progressionGap);
    }
  });
  test('7 host and browser projections consume no RNG and mutate no source state', () => {
    for (const run of runs) {
      assert.equal(run.checks.rngDraws, 0); assert.equal(run.checks.mutations, 0); assert.equal(run.checks.outcomeReads, 0);
      assert.equal(run.browserChecks.rngDraws, 0); assert.equal(run.browserChecks.mutations, 0);
      assert.equal(run.browserChecks.calls, run.checks.calls);
    }
  });
  test('8 pending N+1 truth and future outcome getters are unreachable from semantic projection', () => {
    assert(runs.every(x => x.checks.calls > 0 && x.checks.outcomeReads === 0));
    assert(rows.every(x => !Object.hasOwn(x, 'nextPitchResult') && !Object.hasOwn(x, 'paOutcome')));
  });
  test('9 Production still owns selection and no shadow data or new schema is persisted', () => {
    for (const run of runs) {
      const saved = JSON.stringify(run.player);
      for (const forbidden of ['semanticWitness', 'CURRENT_PA_NEXT_PITCH_SIGNAL', 'POST_PA_EVIDENCE', 'candidateIntent', A.VERSION]) assert(!saved.includes(forbidden));
    }
    assert(rows.some(x => x.adapter.status === 'candidate' && x.adapter.candidateIntent !== x.production.selectedIntent));
  });
  test('10 all runtime owners and loading/save sources are exactly baseline-identical', () => {
    const root = path.resolve(__dirname, '..');
    for (const file of ['pitch-observation-foundation.js', 'pitch-sequence-state-foundation.js', 'pitch-tactical-interpretation-foundation.js',
      'pitch-tactical-decision-foundation.js', 'pitch-tactical-decision-production-adapter.js', 'pitcher-catcher-tactical-integration.js',
      'offensive-plate-approach.js', 'plate-decision-foundation.js', 'pitch-sequencing.js', 'script.js', 'save.js', 'index.html']) {
      const current = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n?/g, '\n');
      const baseline = cp.execFileSync('git', ['show', BASELINE + ':' + file], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replace(/\r\n?/g, '\n');
      assert.equal(current, baseline, file);
    }
  });
  const types = ['TAKE_PATTERN_PRESENT', 'TAKE_PATTERN_STRONG', 'CALLED_STRIKE_PATTERN_PRESENT', 'CHASE_PATTERN_PRESENT',
    'SWING_MISS_PATTERN_PRESENT', 'REPEATED_TARGET_HITS', 'LOCATION_MISS_PUNISHED'];
  const loads = rows.map(x => x.context.pitcherState.mentalState.cognitiveLoad).filter(Number.isFinite);
  const commands = [...new Set(rows.map(x => x.context.previousCommandResult))];
  const gaps = [];
  if (!terminals.length) gaps.push('COVERAGE_GAP: NATURAL_TERMINAL_BIP');
  if (!terminals.some(x => x.interpretationTypes.includes('LOCATION_MISS_PUNISHED'))) gaps.push('COVERAGE_GAP: NATURAL_TERMINAL_LOCATION_MISS_PUNISHED');
  if (!rows.some(x => x.context.pitcherState.mentalState.cognitiveLoad >= 68)) gaps.push('COVERAGE_GAP: HIGH_COGNITIVE_LOAD');
  if (!commands.includes('majorDrift')) gaps.push('COVERAGE_GAP: MAJOR_DRIFT');
  if (!rows.some(x => x.repeatEligibility.repeatFailed)) gaps.push('COVERAGE_GAP: FAILED_REPEAT');
  if (runs.some(x => x.progressionGap)) gaps.push('COVERAGE_GAP: TWO_MATCH_UI_PROGRESSION');
  const summary = { suite: 'pitch-tactical-intent-evidence-integration', baseline: BASELINE, passed, failed: 0,
    scenarios, onMatches: runs.reduce((n, x) => n + x.matches.length, 0), offMatches: pairs.reduce((n, x) => n + x.off.matches.length, 0),
    matchIdentities: [...new Set(rows.map(x => x.matchIdentity))], boundaries: rows.length,
    tacticalIdentities: new Set(rows.map(x => x.context.tacticalIdentity)).size,
    interpretationCounts: Object.fromEntries(types.map(type => [type, rows.filter(x => x.interpretationTypes.includes(type)).length])),
    witnesses: Object.fromEntries(types.map(type => { const row = witness(type); return [type, row ? {
      seed: row.seed, policy: row.policy, matchIdentity: row.matchIdentity, paIdentity: row.paIdentity,
      completedPitchCount: row.completedPitchCount, nextPitchNumber: row.nextPitchNumber, decisionIntent: row.decision.selectedIntent,
      adapterStatus: row.adapter.status, callEvidence: row.callEvidence } : null]; })),
    terminalBIP: terminals.length, terminalLocationMissPunished: terminals.filter(x => x.interpretationTypes.includes('LOCATION_MISS_PUNISHED')).length,
    repeatProposals: rows.filter(x => x.decision.selectedIntent === 'repeatSuccess').length,
    repeatWithDifferentCalls: rows.filter(x => x.decision.selectedIntent === 'repeatSuccess' && x.callEvidence === 'NOT_IDENTICAL_CALL_EVIDENCE').length,
    cognitiveLoad: { min: Math.min(...loads), max: Math.max(...loads) }, commands, gaps,
    distinctPitcherStates: new Set(rows.map(x => JSON.stringify(x.context.pitcherState))).size,
    pitcherStateWitnesses: [...new Set(rows.map(x => x.matchIdentity))].map(matchIdentity => {
      const row = rows.find(x => x.matchIdentity === matchIdentity);
      return { matchIdentity, seed: row.seed, policy: row.policy, pitcherState: row.context.pitcherState };
    }),
    rngDraws: 0, inputMutations: 0, outcomeReads: 0, wholeMatchEquivalent: true, playerEquivalent: true,
    gameRecordEquivalent: true, tacticalStateEquivalent: true, rngCursorEquivalent: true, runtimeChanges: 0 };
  console.log(JSON.stringify(summary));
  return summary;
}
if (require.main === module) main();
module.exports = { play, main };
