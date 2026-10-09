'use strict';
const assert = require('assert/strict'), fs = require('fs'), cp = require('child_process'), path = require('path');
const { discover } = require('./match-m0-after-r2-admission-context.cjs');
const { BASELINE, assertOnlyRepeatEligibilityExtraction } = require('./pitch-tactical-selector-extraction-baseline.cjs');
const O = require('../pitch-observation-foundation'), S = require('../pitch-sequence-state-foundation');
const I = require('../pitch-tactical-interpretation-foundation'), D = require('../pitch-tactical-decision-foundation');
const A = require('../pitch-tactical-decision-production-adapter'), T = require('../pitcher-catcher-tactical-integration');
const clone = value => JSON.parse(JSON.stringify(value));
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
function project(history, paIdentity, tactical) {
  const sequence = history.length ? S.build(history.map(O.observePitch)) : S.createInitialSequenceState(paIdentity);
  const interpretation = I.interpret(sequence), decision = D.decide(interpretation);
  const boundary = { paIdentity, pitchCount: history.length, tacticalContext: tactical.context };
  return { sequence, interpretation, decision, boundary, adapter: A.adapt(decision, boundary) };
}
function persistedProjections(match) {
  return match.completedMoments.filter(m => m.pitchHistory?.length).flatMap(m => m.pitchHistory.map((event, index, history) =>
    project(history.slice(0, index), event.pitch.paIdentity, event.pitch.pitchTacticalState)));
}
function play({ shadow = false, reload = false, policy = 'take', seed = 440000 } = {}) {
  const { h, row } = discover(seed, { observe: false }); assert(row.matchReached && !row.error);
  const captured = [], seen = new Set();
  h.run(`var adapterChecks={calls:0,rngDraws:0,sourceMutations:0,decisionMutations:0,boundaryMutations:0,rebuilds:0};
    function projectAdapterShadow(state){
      const before=JSON.stringify(player),rngBefore=m0DiscoveryRandom,savedRandom=Math.random;
      try{
        Math.random=function(){adapterChecks.rngDraws++;throw Error('Adapter projection RNG');};
        if(state.pitchNumber!==state.pitchHistory.length)throw Error('Detailed completed-pitch boundary mismatch');
        const tactical=state.pendingPitch.pitchTacticalState;
        function rebuild(){
          const sequence=state.pitchHistory.length?PitchSequenceStateFoundation.build(state.pitchHistory.map(PitchObservationFoundation.observePitch))
            :PitchSequenceStateFoundation.createInitialSequenceState(state.paIdentity);
          const interpretation=PitchTacticalInterpretationFoundation.interpret(sequence);
          const decision=PitchTacticalDecisionFoundation.decide(interpretation);
          const boundary={paIdentity:state.paIdentity,pitchCount:state.pitchHistory.length,tacticalContext:tactical.context};
          const decisionBefore=JSON.stringify(decision),boundaryBefore=JSON.stringify(boundary);
          const adapter=PitchTacticalDecisionProductionAdapter.adapt(decision,boundary);
          if(!adapter.supported)throw Error(adapter.reason);
          if(JSON.stringify(decision)!==decisionBefore){adapterChecks.decisionMutations++;throw Error('Decision mutation');}
          if(JSON.stringify(boundary)!==boundaryBefore){adapterChecks.boundaryMutations++;throw Error('Boundary mutation');}
          return {sequence,interpretation,decision,boundary,adapter};
        }
        const result=rebuild();
        for(let i=0;i<100;i++){
          if(JSON.stringify(rebuild())!==JSON.stringify(result))throw Error('Adapter rebuild non-determinism');
          adapterChecks.rebuilds++;
        }
        if(JSON.stringify(player)!==before){adapterChecks.sourceMutations++;throw Error('Production mutation');}
        if(m0DiscoveryRandom!==rngBefore)throw Error('RNG cursor mutation');
        adapterChecks.calls++;
        return result;
      }finally{Math.random=savedRandom;}
    }`);
  let steps = 0, saved = false;
  while (!h.run('player.highSchoolMatch.completed') && steps++ < 5000) {
    if (h.run('!!pendingYouthSeasonOutcome')) h.run('continueYouthSeasonOutcome()');
    else if (h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)')) {
      const isPlate = h.run('player.highSchoolMatch.activeSituation?.type==="plateDecision" && !!player.highSchoolMatch.offensivePlateAppearanceState?.pendingPitch');
      if (isPlate && shadow) {
        const state = h.json('player.highSchoolMatch.offensivePlateAppearanceState'), pitch = state.pendingPitch;
        assert(pitch.pitchTacticalState, 'genuine production tactical state');
        assert.equal(pitch.generatorAuthority, 'pitchSequencingCoreSprintA');
        if (!seen.has(pitch.pitchId)) {
          const projection = h.json('projectAdapterShadow(player.highSchoolMatch.offensivePlateAppearanceState)');
          assert.deepEqual(projection, project(state.pitchHistory, state.paIdentity, pitch.pitchTacticalState));
          const productionIntent = pitch.pitchTacticalState.intentDecision.selectedIntent;
          const diagnostic = projection.adapter.status === 'abstain' ? 'ADAPTER_ABSTAIN'
            : projection.adapter.candidateIntent === productionIntent ? 'CANDIDATE_MATCHES_PRODUCTION' : 'CANDIDATE_DIFFERS_FROM_PRODUCTION';
          captured.push({ pitchId: pitch.pitchId, ...projection, productionIntent, diagnostic }); seen.add(pitch.pitchId);
        }
        if (reload && !saved && state.pitchHistory.length > 1) {
          const expression = '({history:player.highSchoolMatch.offensivePlateAppearanceState.pitchHistory,tacticalHistory:player.highSchoolMatch.offensivePlateAppearanceState.tacticalSequenceHistory,pending:player.highSchoolMatch.offensivePlateAppearanceState.pendingPitch,count:{balls:player.highSchoolMatch.offensivePlateAppearanceState.balls,strikes:player.highSchoolMatch.offensivePlateAppearanceState.strikes},record:player.highSchoolMatch.gameRecord,rng:m0DiscoveryRandom})';
          const before = h.json(expression), expected = project(state.pitchHistory, state.paIdentity, pitch.pitchTacticalState);
          h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');
          assert.deepEqual(h.json(expression), before);
          assert.deepEqual(h.json('projectAdapterShadow(player.highSchoolMatch.offensivePlateAppearanceState)'), expected);
          saved = true;
        }
      }
      h.context.adapterPolicy = policy;
      assert(h.run(`var adapterChoices=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch);
        var adapterChoice=adapterChoices.find(c=>c.matchDecision===(adapterPolicy==='contactSwing'?'contactSwing':'take'))||adapterChoices[0];
        chooseHighSchoolYearOneMatchMoment(adapterChoice.matchDecision,adapterChoice.matchMomentId)`));
    } else assert(h.run('__runNextTimer()'), 'pending production timer');
  }
  const match = h.json('player.highSchoolMatch'); assert(match.completed && !match.activeSituation);
  assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'), []);
  assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'), []);
  if (reload) assert(saved);
  const beforeLoad = persistedProjections(match);
  h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');
  assert.deepEqual(persistedProjections(h.json('player.highSchoolMatch')), beforeLoad);
  const last = match.lastOffensiveResolution, loadedLast = h.json('player.highSchoolMatch.lastOffensiveResolution');
  const lastProjection = value => value.pitchHistory.map((event, index, history) => project(history.slice(0, index), event.pitch.paIdentity, event.pitch.pitchTacticalState));
  assert.deepEqual(lastProjection(loadedLast), lastProjection(last));
  const saveText = h.run('JSON.stringify(player)');
  for (const forbidden of [A.VERSION, D.VERSION, I.VERSION, S.VERSION, 'candidateIntent', 'adapterShadow', 'pitchTacticalDecision']) assert(!saveText.includes(forbidden));
  return { match, captured, seed, policy, saved, rng: h.run('m0DiscoveryRandom'), checks: h.json('adapterChecks') };
}
function summarize(runs) {
  const result = { totalEvaluated: 0, candidate: 0, abstain: 0, matches: 0, differences: 0, unsupported: 0,
    byIntent: Object.fromEntries(T.TACTICAL_INTENTS.map(intent => [intent, { candidate: 0, matches: 0, differences: 0,
      production: Object.fromEntries(T.TACTICAL_INTENTS.map(production => [production, 0])) }])), abstentionReasons: {} };
  for (const row of runs.flatMap(run => run.captured)) {
    result.totalEvaluated++;
    if (!row.adapter.supported) { result.unsupported++; continue; }
    if (row.adapter.status === 'abstain') {
      result.abstain++; const reason = row.adapter.reasonCodes[0]; result.abstentionReasons[reason] = (result.abstentionReasons[reason] || 0) + 1;
    } else {
      result.candidate++; const item = result.byIntent[row.adapter.candidateIntent]; item.candidate++; item.production[row.productionIntent]++;
      if (row.diagnostic === 'CANDIDATE_MATCHES_PRODUCTION') { result.matches++; item.matches++; }
      else { result.differences++; item.differences++; }
    }
  }
  return result;
}
function main() {
  const off = play(), on = play({ shadow: true }), reload = play({ shadow: true, reload: true });
  const swingOff = play({ policy: 'contactSwing' }), swingOn = play({ shadow: true, policy: 'contactSwing' });
  // Bounded natural witness search: seed only normal admission/RNG, never
  // patch intents, pitch truth, recommendations, or match/player capability.
  const naturalSeeds = [440001, 440002, 440003, 440010, 440100, 441000];
  const supplementary = naturalSeeds.map(seed => ({
    enabled: play({ shadow: true, policy: 'contactSwing', seed }),
    disabled: play({ policy: 'contactSwing', seed })
  }));
  const runs = [on, swingOn, ...supplementary.map(pair => pair.enabled)], summary = summarize(runs);
  test('1 genuine take/contactSwing policies evaluate every actual next-pitch boundary through the full chain', () => {
    for (const run of runs) {
      assert(run.captured.length);
      assert.equal(run.captured.length, persistedProjections(run.match).length);
      for (const row of run.captured) {
        assert.equal(row.adapter.supported, true); assert.equal(row.adapter.pitchCount, row.sequence.pitchCount);
        assert.equal(row.boundary.tacticalContext.pitchIndex, row.sequence.pitchCount + 1);
        assert.equal(row.boundary.paIdentity, row.decision.paIdentity);
      }
    }
  });
  test('2 browser/CommonJS agree and all saved completed prefixes reproduce live candidates', () => {
    for (const run of runs) for (const projection of persistedProjections(run.match)) {
      assert.deepEqual(run.captured.find(row => row.pitchId === projection.boundary.tacticalContext.pitchIdentity).adapter, projection.adapter);
    }
  });
  test('3 shadow ON/OFF whole match, tactical state, GameRecord and RNG cursor are identical', () => {
    for (const [enabled, disabled] of [[on, off], [swingOn, swingOff], ...supplementary.map(pair => [pair.enabled, pair.disabled])]) {
      assert.deepEqual(enabled.match, disabled.match); assert.deepEqual(enabled.match.gameRecord, disabled.match.gameRecord);
      assert.equal(enabled.rng, disabled.rng);
      assert.deepEqual(enabled.match.completedMoments.map(m => m.pitchHistory?.map(e => e.pitch.pitchTacticalState)),
        disabled.match.completedMoments.map(m => m.pitchHistory?.map(e => e.pitch.pitchTacticalState)));
    }
  });
  test('4 live reload rebuilds from persisted production truth/context and finishes identically', () => {
    assert(reload.saved); assert.deepEqual(reload.match, on.match); assert.deepEqual(reload.captured, on.captured); assert.equal(reload.rng, on.rng);
  });
  test('5 repeated rebuilds consume zero RNG and mutate no player/Decision/boundary', () => {
    for (const run of [...runs, reload]) {
      assert.equal(run.checks.rngDraws, 0); assert.equal(run.checks.sourceMutations, 0);
      assert.equal(run.checks.decisionMutations, 0); assert.equal(run.checks.boundaryMutations, 0);
      assert.equal(run.checks.rebuilds, run.checks.calls * 100);
    }
  });
  test('6 finished save/load uses persisted pitch and tactical histories with no adapter save schema', () => {
    for (const run of runs) assert(persistedProjections(run.match).every(row => row.adapter.supported));
  });
  test('7 compressed NPC events are explicitly unsupported throughout the foundation chain', () => {
    const compressed = on.match.simulationLog.filter(e => e.resolutionMode === 'compressedPlateAppearance'); assert(compressed.length);
    for (const event of compressed) {
      assert(!Object.hasOwn(event, 'pitchHistory'));
      const decision = D.decide(I.interpret(S.build([O.observePitch(event)])));
      assert.equal(A.adapt(decision, null).supported, false); assert.equal(A.adapt(decision, null).reason, 'UNSUPPORTED_DECISION');
    }
  });
  test('8 all production sources remain baseline-identical except the exact canonical helper extraction', () => {
    const root = path.resolve(__dirname, '..');
    for (const file of ['pitch-tactical-decision-foundation.js', 'pitch-tactical-interpretation-foundation.js', 'pitch-sequence-state-foundation.js',
      'pitch-observation-foundation.js', 'offensive-plate-approach.js', 'pitcher-catcher-tactical-integration.js', 'pitch-sequencing.js', 'save.js', 'script.js']) {
      const current = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n?/g, '\n');
      const baseline = cp.execFileSync('git', ['show', BASELINE + ':' + file], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replace(/\r\n?/g, '\n');
      if (file === 'pitcher-catcher-tactical-integration.js') assertOnlyRepeatEligibilityExtraction(current, baseline);
      else assert.equal(current, baseline, file);
    }
  });
  test('9 shadow classifications reconcile without injecting intent, pitch, or result', () => {
    assert.equal(summary.totalEvaluated, summary.candidate + summary.abstain); assert.equal(summary.unsupported, 0);
    assert.equal(summary.candidate, summary.matches + summary.differences);
    assert(summary.abstain > 0 && summary.candidate > 0);
    assert(on.captured.some(row => row.adapter.candidateIntent === 'challenge'));
  });
  test('10 production candidates carry only semantic provenance, with no downstream recommendation ownership', () => {
    for (const run of runs) for (const row of run.captured) {
      assert(!/recommendedPitchClass|targetLocation|pitchType|intendedPitchClass|actualPitchClass|weight|score|probability/.test(JSON.stringify(row.adapter)));
      if (row.decision.selectedIntent === 'resetNeutral') assert.equal(row.adapter.candidateIntent, null);
      if (row.decision.selectedIntent === 'repeatSuccess') assert.equal(row.adapter.status,
        T.getRepeatSuccessEligibility(row.boundary.tacticalContext).repeatEligible ? 'candidate' : 'abstain');
    }
  });
  test('11 bounded normal admission runs naturally expose repeat candidate with ON/OFF equivalence', () => {
    assert(supplementary.some(pair => pair.enabled.captured.some(row => row.adapter.candidateIntent === 'repeatSuccess')));
    assert.equal(summarize(supplementary.map(pair => pair.enabled)).unsupported, 0);
  });
  const witnesses = Object.fromEntries([...T.TACTICAL_INTENTS, 'resetNeutral'].map(intent => {
    const run = runs.find(run => run.captured.some(row => intent === 'resetNeutral' ? row.decision.selectedIntent === intent : row.adapter.candidateIntent === intent));
    const row = run?.captured.find(row => intent === 'resetNeutral' ? row.decision.selectedIntent === intent : row.adapter.candidateIntent === intent);
    return [intent, row ? { seed: run.seed, policy: run.policy, paIdentity: row.adapter.paIdentity, completedPitches: row.adapter.pitchCount,
      nextPitch: row.boundary.tacticalContext.pitchIndex, decisionIntent: row.decision.selectedIntent, status: row.adapter.status,
      candidateIntent: row.adapter.candidateIntent, productionIntent: row.productionIntent, diagnostic: row.diagnostic } : null];
  }));
  const report = { passed, failed: 0, baseline: BASELINE, summary,
    byPolicy: Object.fromEntries(['take', 'contactSwing'].map(policy => [policy, summarize(runs.filter(run => run.policy === policy))])),
    baseSeedSummary: summarize([on, swingOn]), naturalSearch: { seeds: naturalSeeds, summary: summarize(supplementary.map(pair => pair.enabled)) },
    witnesses, notNaturallyObserved: Object.keys(witnesses).filter(intent => witnesses[intent] === null),
    checks: { take: on.checks, contactSwing: swingOn.checks, reload: reload.checks,
      supplementary: Object.fromEntries(supplementary.map(pair => [pair.enabled.seed, pair.enabled.checks])) },
    compressedRejected: on.match.simulationLog.filter(e => e.resolutionMode === 'compressedPlateAppearance').length,
    wholeMatchEquivalent: true, tacticalStateEquivalent: true, gameRecordEquivalent: true, rngCursorEquivalent: true, liveAndFinishedSaveReload: true };
  console.log('ADAPTER_PRODUCTION_JSON=' + JSON.stringify(report));
  return report;
}
if (require.main === module) main();
module.exports = { play, summarize, project, main };
