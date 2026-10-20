'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { makeContext } = require('./high-school-career-test-context.js');
const evidence = { suite: 'g2-b1-natural-mixed-match-continuity', games: [], checks: [] };
let passed = 0;
function test(name, fn) { fn(); passed++; evidence.checks.push(name); console.log('PASS ' + name); }
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const copy = x => JSON.parse(JSON.stringify(x));

// Observers call the untouched original functions with exactly the original arguments.
// This is test bookkeeping, not a simulation, result resolver, clock, or admission adapter.
function installObservers() {
  globalThis.g2b1Trace = { tick: 0, calls: [], counts: {}, careerApplications: 0 };
  const names = ['advanceHighSchoolMatchPlaybackStep', 'advanceHighSchoolPresentationCursor',
    'resolveSimulatedHighSchoolPlateAppearance', 'prepareHighSchoolPlateDecision',
    'resolveHighSchoolPlateDecisionPitch', 'resolveHighSchoolOffensiveDecision',
    'nextHighSchoolMatchSimulationRandom', 'settleHighSchoolYearOneMatch'];
  function brief(m) { return { matchId: m.id, phase: m.simulationPhase, seed: m.simulationSeed,
    cursor: m.presentedEventCursor, logLength: m.simulationLog.length, currentBatter: m.currentBatter,
    paId: m.offensivePlateAppearanceState?.paIdentity || null,
    pitchNumber: m.offensivePlateAppearanceState?.pitchNumber || 0,
    resultApplied: m.offensivePlateAppearanceState?.resultApplied === true, settled: m.settled === true }; }
  for (const name of names) {
    const original = globalThis[name];
    if (typeof original !== 'function') throw Error('Missing original owner: ' + name);
    globalThis[name] = function (...args) {
      const m = args[0], before = brief(m);
      g2b1Trace.counts[name] = (g2b1Trace.counts[name] || 0) + 1;
      const result = original.apply(this, args), after = brief(m);
      if (name === 'settleHighSchoolYearOneMatch' && !before.settled && after.settled) g2b1Trace.careerApplications++;
      g2b1Trace.calls.push({ name, tick: g2b1Trace.tick, before, after });
      return result;
    };
  }
  globalThis.g2b1Consumer = LivePublicMatchBridge.createConsumer();
}

function publicRead(h) {
  return h.json('(function(){var before=JSON.stringify(player),counts=JSON.stringify(g2b1Trace.counts),r=Math.random;'
    + 'Math.random=function(){throw Error("PUBLIC_READ_RNG");};try{'
    + 'var p=LivePublicMatchBridge.readCurrent(),again=LivePublicMatchBridge.readCurrent(),played=[],next;'
    + 'var sameApis=JSON.stringify(p.snapshot)===JSON.stringify(LivePublicMatchBridge.projectSnapshot(m))'
    + '&&JSON.stringify(p.timeline)===JSON.stringify(LivePublicMatchBridge.projectTimeline(m));'
    + 'while((next=g2b1Consumer.advancePresentation()))played.push(next.eventId);'
    + 'return {projection:p,repeated:JSON.stringify(p)===JSON.stringify(again),sameApis:sameApis,played:played,'
    + 'frozen:Object.isFrozen(p)&&Object.isFrozen(p.snapshot)&&Object.isFrozen(p.timeline),'
    + 'playerUnchanged:before===JSON.stringify(player),ownersUncalled:counts===JSON.stringify(g2b1Trace.counts)};'
    + '}finally{Math.random=r;}})()');
}
function source(h) { return h.json('m'); }
function gameplay(h) {
  return h.json('({seed:m.simulationSeed,record:m.gameRecord,scores:m.scores,outs:m.outs,runners:m.runners,'
    + 'battingOrder:m.battingOrder,currentBatter:m.currentBatter,skills:player.baseballSkills,'
    + 'experience:m.matchExperience,log:m.simulationLog})');
}
function compact(m) {
  return { phase: m.simulationPhase, cursor: m.presentedEventCursor, logLength: m.simulationLog.length,
    inning: m.inning, half: m.half, outs: m.outs, batter: m.currentBatter, seed: m.simulationSeed,
    paId: m.offensivePlateAppearanceState?.paIdentity || null,
    pitch: m.offensivePlateAppearanceState?.pitchNumber || 0, completed: m.completed,
    situationId: m.activeSituation?.situationId || null, lifecycle: m.activeSituation?.lifecycleState || null };
}
function validatePublic(h, consumed) {
  const result = publicRead(h), m = source(h), p = result.projection, prefix = m.simulationLog.slice(0, m.presentedEventCursor);
  assert(result.repeated && result.sameApis && result.frozen && result.playerUnchanged && result.ownersUncalled);
  const ids = p.timeline.events.map(e => e.eventId);
  assert.doesNotMatch(JSON.stringify(p), /"(?:pendingPitch|intendedPitchClass|intentRoll|realizationRoll|samples|pitchIntent|targetIntent|frozenDistribution|debugTrace)"/);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of result.played) { assert(!consumed.has(id), 'Consumer repeated an already played identity'); consumed.add(id); }
  assert.deepEqual(p.timeline.events.map(e => [e.order.sourceSequence, e.order.evidenceOrder]),
    p.timeline.events.map(e => [e.order.sourceSequence, e.order.evidenceOrder]).sort((a, b) => a[0] - b[0] || a[1] - b[1]));
  const visibleRefs = new Set(m.gameRecord.eventRefs.filter(r => prefix.some(e => e.sequence === r.sequence && e.type === r.type)).map(r => r.eventId));
  for (const e of p.timeline.events) {
    if (e.source.eventId) assert(visibleRefs.has(e.source.eventId), 'Unrevealed source event leaked');
    else if (e.source.owner === 'plateDecisionState.closedSituation') {
      const closed = m.plateDecisionState?.closedSituation;
      assert(closed?.lifecycleState === 'closed' && closed.settlement?.applied === true);
      assert.equal(e.source.identity, closed.situationId);
      assert(['DECISION_PRESENTED', 'DECISION_ACCEPTED'].includes(e.type));
    } else assert(m.activeSituation?.type === 'plateDecision' && m.activeSituation.lifecycleState === 'presented',
      'Event lacks an actual presented or closed source: ' + JSON.stringify(e));
  }
  const latest = prefix.map(e => e.presentationSnapshot).filter(Boolean).at(-1);
  if (latest) {
    assert.equal(p.snapshot.game.inning.value, latest.inning);
    assert.equal(p.snapshot.game.half.value, latest.half);
    assert.equal(p.snapshot.game.outs.value, latest.outs);
    assert.deepEqual(p.snapshot.game.bases.value, latest.runners);
    if (['上', '下'].includes(latest.half)) {
      const offense = latest.half === '上' ? 'away' : 'home';
      assert.equal(p.snapshot.game.offenseTeam.value.side, offense);
      assert.equal(p.snapshot.game.defenseTeam.value.side, offense === 'home' ? 'away' : 'home');
    }
  }
  const board = h.json('MatchGameRecord.getScoreboardFromEvents({id:m.id,regulationInnings:m.regulationInnings,'
    + 'homeTeamId:m.gameRecord.homeTeamId,awayTeamId:m.gameRecord.awayTeamId},m.simulationLog.slice(0,m.presentedEventCursor))');
  if (m.presentedEventCursor) {
    assert.equal(p.snapshot.game.homeScore.value, board.totals.home.runs);
    assert.equal(p.snapshot.game.awayScore.value, board.totals.away.runs);
  }
  if (m.activeSituation?.type === 'plateDecision' && m.activeSituation.lifecycleState === 'presented') {
    assert.equal(p.snapshot.decision.waiting, true);
    assert.deepEqual(p.snapshot.decision.routes.value.map(x => x.routeId), m.activeSituation.legalRoutes.map(x => x.routeId));
    assert.equal(p.snapshot.identity.paId.value, m.activeSituation.contextSnapshot.paIdentity);
    assert.equal(p.snapshot.identity.pitchId.value, m.offensivePlateAppearanceState.pendingPitch.pitchId);
  } else assert.equal(p.snapshot.identity.paId.status, 'unavailable', 'A completed PA became the current PA');
  if (h.run('isHighSchoolMatchDecisionVisible(m)')) assert.equal(p.snapshot.decision.waiting, true, 'Unsupported decision disguised as not waiting');
  if (m.completed) assert.equal(p.snapshot.decision.waiting, false);
  assert.equal(p.snapshot.game.gameStatus.value === 'final', prefix.some(e => e.type === 'gameEnd'));
  return p;
}
function reload(h, label, points, consumed) {
  const before = validatePublic(h, consumed), facts = gameplay(h), trace = h.json('g2b1Trace.counts'), state = compact(source(h));
  h.run('saveGame();loadGame();m=player.highSchoolMatch;');
  const after = validatePublic(h, consumed);
  assert.deepEqual(gameplay(h), facts, label + ' must not re-execute gameplay or RNG');
  assert.deepEqual(h.json('g2b1Trace.counts'), trace, label + ' must not call execution owners');
  assert.deepEqual(after.snapshot, before.snapshot, label + ' Snapshot restored from original save');
  // Missing original transient histories must stay unavailable, never be fabricated.
  assert.deepEqual(after.timeline, before.timeline, label + ' retained Timeline restored');
  points.push({ label, state, gameplaySha256: hash(facts), snapshot: after.snapshot,
    eventIds: after.timeline.events.map(e => e.eventId), noReroll: true, noSettlement: true });
}

function runNatural({ label, strategy, checkpoints }) {
  const h = makeContext();
  // Exact original G2-A Career setup; no outcome, NPC capability, physical result or admission injection.
  h.run('careerFixture("二壘手","starter",77001);choose("critical_offseason",1);var m=player.highSchoolMatch;');
  h.run('(' + installObservers.toString() + ')()');
  const initial = source(h), consumed = new Set(), steps = [], decisions = [], admissions = [], saves = [], detailedStates = {}, detailedEventIds = {}, playedRows = [];
  let ticks = 0, firstWaiting = false, midPitch = false, settled = false, cToD = false, dToC = false;
  validatePublic(h, consumed);
  while (!h.run('m.completed')) {
    if (++ticks > 600) throw Error('STALLED: ' + JSON.stringify(compact(source(h))));
    h.run('g2b1Trace.tick=' + ticks);
    if (h.run('!!pendingYouthSeasonOutcome')) h.run('continueYouthSeasonOutcome()');
    const before = source(h), beforeBrief = compact(before);
    let action, result, choice = null;
    if (h.run('isHighSchoolMatchDecisionVisible(m)')) {
      const choices = h.json('getHighSchoolYearOneMatchMomentChoices(m)');
      choice = choices.find(x => x.matchDecision === strategy) || choices[0];
      assert(choice, 'No original legal decision');
      validatePublic(h, consumed);
      h.context.g2b1Choice = choice;
      action = 'originalPlayerDecision';
      result = h.run('chooseHighSchoolYearOneMatchMoment(g2b1Choice.matchDecision,g2b1Choice.matchMomentId,()=>.62)');
      assert.equal(result, true, 'Original legal decision was rejected');
      const situation = before.activeSituation;
      decisions.push({ tick: ticks, momentId: choice.matchMomentId, route: choice.matchDecision,
        situationId: situation?.situationId || null, type: situation?.type || 'originalApproachOrAgency',
        paId: situation?.contextSnapshot?.paIdentity || null, pitchId: situation?.sourcePhysicalStateRef || null });
    } else {
      action = 'originalMatchPlayback';
      result = h.run('advanceHighSchoolMatchPlaybackStep(m)');
    }
    const after = source(h), publicState = validatePublic(h, consumed), newEvents = after.simulationLog.slice(before.simulationLog.length);
    for (const oldPA of before.simulationLog.filter(e => e.type === 'plateAppearance')) {
      assert.deepEqual(after.simulationLog.find(e => e.sequence === oldPA.sequence), oldPA, 'Completed PA was re-simulated or rewritten');
    }
    if (after.activeSituation?.type === 'plateDecision' && after.offensivePlateAppearanceState?.pitchNumber === 0
      && before.offensivePlateAppearanceState?.paIdentity !== after.offensivePlateAppearanceState.paIdentity) {
      const pa = after.offensivePlateAppearanceState, s = after.activeSituation;
      assert.equal(s.admission.admittedToPlayer, true);
      assert.equal(s.sourceAuthority, 'existingOffensivePlateApproachPitchTruth');
      assert.equal(s.contextSnapshot.paIdentity, pa.paIdentity);
      assert.equal(pa.pitchHistory.length, 0);
      assert(pa.pendingPitch && !pa.resultApplied);
      assert.equal(pa.context.sameBallExecution, undefined, 'Natural run must not opt into controlled same-ball coverage');
      admissions.push({ tick: ticks, paId: pa.paIdentity, originalAdmission: s.admission, createdAt: s.createdAt,
        sourceAuthority: s.sourceAuthority, pitchId: s.sourcePhysicalStateRef, catcherSnapshot: pa.context.thirdStrikeCatcher,
        pendingOpportunity: after.pendingOffensiveOpportunity, priorPA: after.simulationLog.filter(e => e.type === 'plateAppearance').at(-1),
        beforeFirstExecution: true, noControlledSameBallAdmission: true });
      if (checkpoints && !firstWaiting) { reload(h, 'legal player decision waiting', saves, consumed); firstWaiting = true; }
      if (checkpoints && !cToD) { reload(h, 'Compressed to Detailed admission boundary', saves, consumed); cToD = true; }
    }
    if (after.offensivePlateAppearanceState?.paIdentity) detailedStates[after.offensivePlateAppearanceState.paIdentity] = copy(after.offensivePlateAppearanceState);
    if (checkpoints && !midPitch && after.activeSituation?.type === 'plateDecision' && after.offensivePlateAppearanceState.pitchNumber > 0) {
      reload(h, 'Detailed PA between executed pitches', saves, consumed); midPitch = true;
    }
    const paEvents = newEvents.filter(e => e.type === 'plateAppearance');
    for (const e of paEvents) {
      if (e.pitchCount) {
        const pa = after.offensivePlateAppearanceState;
        assert(pa.resultApplied);
        if (e.paIdentity) assert.equal(pa.paIdentity, e.paIdentity);
        else {
          assert.equal(e.result, pa.result);
          assert.equal(e.pitchCount, pa.pitchNumber);
          if (pa.battedBallPhysicalTruth) assert.equal(e.officialBallInPlayOutcome?.physicalIdentity, pa.battedBallPhysicalTruth.identity,
            'Legacy contact journal must link to the original retained physical identity');
        }
        detailedEventIds[e.sequence] = pa.paIdentity;
        assert(!after.activeSituation || after.activeSituation.lifecycleState !== 'presented', 'Stale pending detailed decision');
        if (checkpoints && !settled) { reload(h, 'Detailed PA officially settled', saves, consumed); settled = true; }
        const facts = gameplay(h);
        h.context.g2b1OldChoice = choice;
        assert.equal(h.run('chooseHighSchoolYearOneMatchMoment(g2b1OldChoice.matchDecision,g2b1OldChoice.matchMomentId,()=>.62)'), false);
        assert.deepEqual(gameplay(h), facts, 'Completed PA decision resubmission changed gameplay');
      }
      if (checkpoints && !dToC && e.resolutionMode === 'compressedPlateAppearance' && settled) {
        reload(h, 'Detailed to Compressed original next PA', saves, consumed); dToC = true;
      }
    }
    const progress = hash(beforeBrief) !== hash(compact(after)) || newEvents.length > 0;
    const waiting = h.run('isHighSchoolMatchDecisionVisible(m)') || h.run('!!pendingYouthSeasonOutcome');
    assert(progress || waiting || after.completed, 'No progress outside a legal wait: ' + JSON.stringify(compact(after)));
    for (const e of newEvents) playedRows.push({ sequence: e.sequence, type: e.type, classification: e.eventClassification,
      result: e.result, mode: e.resolutionMode, authority: e.outcomeAuthority });
    steps.push({ tick: ticks, action, result, before: beforeBrief, after: compact(after),
      progress: progress ? 'changed' : waiting ? 'legalPlayerOrOutcomeWait' : 'completed',
      newEventSequences: newEvents.map(e => e.sequence), snapshotRevision: publicState.snapshot.revision,
      publicEventCount: publicState.timeline.events.length });
  }
  const finalProjection = validatePublic(h, consumed), final = source(h);
  if (checkpoints) { reload(h, 'final match', saves, consumed); assert.equal(saves.length, 6); }
  assert(final.completed && final.settled && final.gameRecord.status === 'final');
  assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
  assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'), []);
  assert.equal(h.run('g2b1Trace.careerApplications'), 1);
  const facts = gameplay(h), traceBeforeFinalRead = h.json('g2b1Trace.counts');
  assert.equal(h.run('advanceHighSchoolMatchPlaybackStep(m)'), false);
  assert.equal(h.run('chooseHighSchoolYearOneMatchMoment("take","stale-final-moment",()=>.62)'), false);
  assert.equal(h.run('settleHighSchoolYearOneMatch(m,"secure")'), false);
  assert.deepEqual(gameplay(h), facts, 'Final duplicate request changed Record/RNG/development');
  assert.equal(h.run('g2b1Trace.careerApplications'), 1);
  const pas = final.simulationLog.filter(e => e.type === 'plateAppearance');
  const detailed = pas.filter(e => e.batterId === 'player' && e.pitchCount > 0).map(e => {
    const paId = detailedEventIds[e.sequence], state = detailedStates[paId];
    assert(state && state.resultApplied && state.completed && state.pitchHistory.length === e.pitchCount);
    assert.equal(new Set(state.pitchHistory.map(p => p.pitch.pitchId)).size, e.pitchCount);
    assert.equal(Object.values(detailedEventIds).filter(id => id === paId).length, 1);
    assert(state.pitchHistory.every(p => p.pitch.paIdentity === paId));
    if (e.result === 'strikeout') assert(e.thirdStrikeCatch?.execution?.status === 'completed');
    return { paId, event: e, state, admission: admissions.find(a => a.paId === paId) };
  });
  const compressed = pas.filter(e => e.resolutionMode === 'compressedPlateAppearance');
  assert(detailed.length && compressed.length, 'Actual Detailed and explicit Compressed execution required');
  assert(compressed.every(e => e.outcomeAuthority === 'compressedAIPlateAppearanceOutcomeV1' && e.compressedOutcomeTrace));
  const handoffs = [];
  for (let i = 1; i < pas.length; i++) {
    const a = pas[i - 1], b = pas[i], da = detailed.some(x => x.event.sequence === a.sequence), db = detailed.some(x => x.event.sequence === b.sequence);
    if (a.resolutionMode === 'compressedPlateAppearance' && db) handoffs.push({ type: 'CompressedToDetailed', from: a, to: b });
    if (da && b.resolutionMode === 'compressedPlateAppearance') handoffs.push({ type: 'DetailedToCompressed', from: a, to: b });
    if (da && db) handoffs.push({ type: 'DetailedToDetailed', from: a, to: b });
  }
  assert(handoffs.some(x => x.type === 'CompressedToDetailed') && handoffs.some(x => x.type === 'DetailedToCompressed'));
  const pitchDecisions = decisions.filter(d => d.type === 'plateDecision');
  assert.equal(new Set(pitchDecisions.map(d => d.situationId)).size, pitchDecisions.length, 'Player pitch decision submitted twice');
  assert.equal(new Set(final.gameRecord.eventRefs.map(r => r.eventId)).size, final.gameRecord.eventRefs.length);
  assert.equal(final.gameRecord.eventRefs.length, final.simulationLog.length);
  const finalScore = final.gameRecord.result.finalScore;
  assert.deepEqual({ home: finalScore.home, away: finalScore.away }, final.scores);
  assert.equal(finalProjection.snapshot.game.homeScore.value, final.scores.home);
  assert.equal(finalProjection.snapshot.game.awayScore.value, final.scores.away);
  assert(final.matchExperience.settled && !final.matchExperience.errors.length);
  assert.equal(new Set(final.matchExperience.developmentSettlementIds).size, final.matchExperience.developmentSettlementIds.length);
  for (const e of final.simulationLog.filter(e => e.type === 'halfInningEnd')) {
    assert.equal(e.outs ?? e.presentationSnapshot?.outs, 3);
    if (e.basesAfter) assert.deepEqual(e.basesAfter, [null, null, null]);
  }
  const row = { label, entry: { source: 'Original G2-A makeContext/careerFixture/choose critical_offseason', seed: 77001,
    position: '二壘手', role: 'starter', strategy, noOutcomeOrAdmissionInjection: true }, matchId: final.id, ticks,
    decisionCount: decisions.length, pitchDecisionCount: pitchDecisions.length, decisions, detailed, compressed,
    unclassifiedPA: pas.filter(e => !detailed.some(d => d.event.sequence === e.sequence) && !compressed.includes(e)), handoffs,
    detailedCount: detailed.length, compressedCount: compressed.length, admission: admissions, steps, sourceEvents: playedRows,
    saves, final: { record: final.gameRecord, scores: final.scores, simulationSeed: final.simulationSeed,
      exposure: final.gameExposureState, experience: final.matchExperience, log: final.simulationLog },
    finalProjection, publicEventCount: finalProjection.timeline.events.length, consumerPlayedCount: consumed.size,
    ownerTrace: h.json('g2b1Trace'), careerApplications: 1, duplicateFinalNoop: true, factsBeforeDuplicateFinal: facts,
    ownerCountsBeforeFinalNoops: traceBeforeFinalRead };
  evidence.games.push(row);
  return row;
}

let uninterrupted, restored, swinging;
test('Original Career entry reaches real mixed gameplay and final Record', () => {
  uninterrupted = runNatural({ label: 'original G2-A take policy', strategy: 'take', checkpoints: false });
});
test('Explicit compressed owner and executed pitch-level owner prove both natural handoffs', () => {
  assert.equal(uninterrupted.handoffs.filter(h => h.type === 'CompressedToDetailed').length, 2);
  assert.equal(uninterrupted.handoffs.filter(h => h.type === 'DetailedToCompressed').length, 2);
  assert(uninterrupted.detailed.every(d => d.admission.beforeFirstExecution));
});
test('Original Save/Reload preserves waiting, executing, settled, both handoffs and final', () => {
  restored = runNatural({ label: 'same Career with six real save/load boundaries', strategy: 'take', checkpoints: true });
  assert.deepEqual(restored.final, uninterrupted.final, 'Save/Reload re-ran or changed original gameplay');
  assert.deepEqual(restored.finalProjection, uninterrupted.finalProjection);
});
test('Different legal player route executes different real pitch facts without forcing outcomes', () => {
  swinging = runNatural({ label: 'same Career legal contactSwing policy', strategy: 'contactSwing', checkpoints: false });
  const a = uninterrupted.detailed[0].state.pitchHistory[0], b = swinging.detailed[0].state.pitchHistory[0];
  assert.equal(a.pitch.pitchId, b.pitch.pitchId);
  assert.equal(a.action, 'take'); assert.equal(b.action, 'swing');
  assert.notDeepEqual(a, b);
});
test('Detailed-to-Detailed is reported only if distinct adjacent natural PAs actually execute', () => {
  evidence.detailedToDetailed = evidence.games.map(g => ({ label: g.label,
    count: g.handoffs.filter(h => h.type === 'DetailedToDetailed').length,
    qualification: 'Distinct adjacent PAs only; consecutive pitches are not a mode handoff. No admission injection.' }));
});
test('Mode evidence does not relabel other ordinary physical or routine PAs as compressed', () => {
  for (const g of evidence.games) assert.equal(g.detailedCount + g.compressedCount + g.unclassifiedPA.length,
    g.final.log.filter(e => e.type === 'plateAppearance').length);
});
test('Public reads and Consumer never invoke original gameplay or cursor owners', () => {
  assert(evidence.games.every(g => g.steps.length > 0 && g.publicEventCount > 0));
});
test('Each original PA advances to the actual next batting-order actor', () => {
  evidence.battingOrderSubstitutions = [];
  for (const g of evidence.games) {
    const entries = g.final.log.filter(e => e.type === 'plateAppearance');
    for (let i = 1; i < entries.length; i++) {
      const a = entries[i - 1], b = entries[i];
      if (a.inning === b.inning && a.half === b.half && a.currentBatterAfter) {
        let expectedBatter = a.currentBatterAfter;
        for (const entry of g.final.log.filter(e => e.type === 'playerEntry' && e.sequence > a.sequence && e.sequence < b.sequence)) {
          assert.equal(entry.replacedPlayerId, expectedBatter);
          assert.equal(entry.presentationSnapshot.currentBatter, 'player');
          expectedBatter = 'player';
          evidence.battingOrderSubstitutions.push({ game: g.label, fromSequence: a.sequence, entry, toSequence: b.sequence });
        }
        assert.equal(b.batterId, expectedBatter);
      }
    }
  }
});
test('Career applies once per match and per-skill development identities remain unique', () => {
  for (const g of evidence.games) {
    assert.equal(g.careerApplications, 1);
    assert(g.final.experience.matchExperienceSettlementId);
    assert.equal(new Set(g.final.experience.developmentSettlementIds).size, g.final.experience.developmentSettlementIds.length);
  }
});
evidence.status = 'PASS'; evidence.passed = passed;
if (process.env.G2_B1_EVIDENCE_OUTPUT) fs.writeFileSync(process.env.G2_B1_EVIDENCE_OUTPUT, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ suite: evidence.suite, status: evidence.status, passed, games: evidence.games.map(g => ({ label: g.label,
  ticks: g.ticks, scores: g.final.scores, detailed: g.detailedCount, compressed: g.compressedCount,
  handoffs: g.handoffs.map(h => h.type), publicEvents: g.publicEventCount })) }));
