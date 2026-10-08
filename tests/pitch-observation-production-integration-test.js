'use strict';
const assert = require('assert/strict');
const { discover } = require('./match-m0-after-r2-admission-context.cjs');
const O = require('../pitch-observation-foundation');
const clone = value => JSON.parse(JSON.stringify(value));
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };

function play({ observe = false, reload = false, policy = 'take' } = {}) {
  const { h, row } = discover(440000, { observe: false });
  assert(row.matchReached && !row.error);
  const projections = [];
  h.context.__capturePitchObservation = value => projections.push(clone(value));
  if (observe) h.run(`
    var observationChecks={calls:0,rngDraws:0,sourceMutations:0};
    var originalPitchResolution=resolveHighSchoolPlateDecisionPitch;
    resolveHighSchoolPlateDecisionPitch=function(...args){
      const result=originalPitchResolution.apply(this,args);
      if(result?.event){
        const sourceBefore=JSON.stringify(player),rngBefore=m0DiscoveryRandom;
        const savedRandom=Math.random;
        try{
          Math.random=function(){observationChecks.rngDraws++;throw Error('Observation drew RNG');};
          const projection=PitchObservationFoundation.observePitch(result.event);
          if(!projection.supported)throw Error(projection.reason);
          if(JSON.stringify(projection)!==JSON.stringify(PitchObservationFoundation.observePitch(result.event)))throw Error('Non-deterministic observation');
          __capturePitchObservation(projection);
        }finally{Math.random=savedRandom;}
        if(JSON.stringify(player)!==sourceBefore){observationChecks.sourceMutations++;throw Error('Observation mutated player');}
        if(m0DiscoveryRandom!==rngBefore)throw Error('Observation changed RNG cursor');
        observationChecks.calls++;
      }
      return result;
    };
  `);
  let steps = 0, saved = false;
  while (!h.run('player.highSchoolMatch.completed') && steps++ < 5000) {
    if (h.run('!!pendingYouthSeasonOutcome')) h.run('continueYouthSeasonOutcome()');
    else if (h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)')) {
      if (reload && !saved && h.run('player.highSchoolMatch.offensivePlateAppearanceState?.pitchHistory.length>1 && player.highSchoolMatch.activeSituation?.type==="plateDecision"')) {
        const expression = '({history:player.highSchoolMatch.offensivePlateAppearanceState.pitchHistory,pending:player.highSchoolMatch.offensivePlateAppearanceState.pendingPitch,record:player.highSchoolMatch.gameRecord,rng:m0DiscoveryRandom})';
        const before = h.json(expression), observations = before.history.map(O.observePitch);
        h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');
        assert.deepEqual(h.json(expression), before);
        assert.deepEqual(h.json('player.highSchoolMatch.offensivePlateAppearanceState.pitchHistory').map(O.observePitch), observations);
        saved = true;
      }
      h.context.observationPolicy = policy;
      assert(h.run(`var observationChoices=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch);
        var observationChoice=observationChoices.find(x=>x.matchDecision===(observationPolicy==='swing'?'contactSwing':'take'))||observationChoices[0];
        chooseHighSchoolYearOneMatchMoment(observationChoice.matchDecision,observationChoice.matchMomentId)`));
    } else assert(h.run('__runNextTimer()'), 'pending production timer');
  }
  const match = h.json('player.highSchoolMatch');
  assert(match.completed && !match.activeSituation);
  assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'), []);
  assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'), []);
  if (reload) assert(saved, 'reachable live multi-pitch save boundary');
  // Finished canonical copies survive actual save/load and rebuild the same projections.
  const histories = match.completedMoments.filter(m => Array.isArray(m.pitchHistory)).map(m => m.pitchHistory);
  const finishedBefore = histories.map(history => history.map(O.observePitch));
  h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');
  const loaded = h.json('player.highSchoolMatch');
  assert.deepEqual(loaded.completedMoments.filter(m => Array.isArray(m.pitchHistory)).map(m => m.pitchHistory.map(O.observePitch)), finishedBefore);
  assert.deepEqual(loaded.lastOffensiveResolution.pitchHistory.map(O.observePitch), match.lastOffensiveResolution.pitchHistory.map(O.observePitch));
  return { match, projections, histories, rng: h.run('m0DiscoveryRandom'), saved,
    checks: observe ? h.json('observationChecks') : null };
}

const off = play(), on = play({ observe: true }), reload = play({ observe: true, reload: true });
const swingOff = play({ policy: 'swing' }), swingOn = play({ observe: true, policy: 'swing' });
test('browser and CommonJS API both loaded', () => assert(on.projections.length));
test('real detailed player route produces genuine multi-pitch projections', () => {
  assert(on.histories.some(h => h.length > 1));
  for (const h of on.histories) for (const e of h) {
    const projection = O.observePitch(e); assert(projection.supported, projection.reason);
    assert.deepEqual(on.projections.find(o => o.pitchId === e.pitch.pitchId), projection);
  }
  assert(on.projections.some(o => o.observations.some(x => x.type === 'BATTER_TOOK_STRIKE')));
  assert(on.projections.some(o => o.observations.some(x => x.type === 'BATTER_TOOK_BALL')));
});
test('observation ON/OFF preserves entire match and RNG for take and swing', () => {
  assert.deepEqual(on.match, off.match); assert.equal(on.rng, off.rng);
  assert.deepEqual(swingOn.match, swingOff.match); assert.equal(swingOn.rng, swingOff.rng);
});
test('live reload preserves counts, pending pitch, history, outcomes and projections', () => {
  assert(reload.saved); assert.deepEqual(reload.match, on.match);
  assert.deepEqual(reload.projections, on.projections); assert.equal(reload.rng, on.rng);
});
test('zero source mutations and zero observation RNG draws', () => {
  for (const run of [on, reload, swingOn]) {
    assert(run.checks.calls > 0); assert.equal(run.checks.rngDraws, 0); assert.equal(run.checks.sourceMutations, 0);
  }
});
test('NPC compressed events and MatchGameRecord refs never fabricate observations', () => {
  const events = on.match.simulationLog.filter(e => e.resolutionMode === 'compressedPlateAppearance');
  assert(events.length);
  for (const e of events) {
    assert(!Object.hasOwn(e, 'pitchHistory')); assert(!Object.hasOwn(e, 'pitchCount'));
    const r = O.observePitch(e); assert.equal(r.supported, false); assert.deepEqual(r.observations, []);
  }
  for (const e of on.match.gameRecord.eventRefs) assert.equal(O.observePitch(e).supported, false);
});
test('projection remains derived and save contains no observation schema', () => {
  for (const match of [on.match, reload.match, swingOn.match]) {
    assert(!JSON.stringify(match).includes('pitchObservationV1'));
    assert(!Object.hasOwn(match, 'pitchObservations'));
  }
});
const witness = on.histories.find(h => h.length > 1).map(e => ({ pitchNumber: e.pitchNumber, pitchId: e.pitch.pitchId,
  pitchType: e.pitch.pitchType, target: e.pitch.targetIntent, actual: e.pitch.location, action: e.action,
  pitchResult: e.pitchResult, countBefore: e.countBefore, countAfter: e.countAfter,
  observations: O.observePitch(e).observations.map(o => o.type) }));
console.log('OBSERVATION_JSON=' + JSON.stringify({ passed, failed: 0, witness, checks: on.checks,
  swingChecks: swingOn.checks, compressedRejected: on.match.simulationLog.filter(e => e.resolutionMode === 'compressedPlateAppearance').length,
  saveReload: true, wholeMatchEquivalent: true }));
