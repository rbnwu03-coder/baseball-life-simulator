'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const contract = require('../contracts/ss-decision-resolution-public-presentation-v0.2.cjs');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const clone = x => JSON.parse(JSON.stringify(x));
const historical = read('docs/ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-findings-evidence.json');
const v01 = read('docs/match-ui-slice-data-contract-v0.1-evidence.json');
const audit = read('docs/match-decision-observability-consequence-feedback-audit-v0.1-evidence.json');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const stateOf = s => ({ outs: s.outs, scores: clone(s.scores), bases: s.runners.map(Boolean) });

// Only historical confirmed data. Negative mutations below are invalid contract
// inputs, not new gameplay fixtures or simulated alternative-route results.
function inputs() {
  const before = historical.threeTimes.decisionBefore;
  const completed = historical.publicDecision.newCompleted[0];
  const decision = clone(v01.examples.decision), resolution = clone(v01.examples.resolution);
  const ids = { presentationId: decision.presentationId, matchId: before.matchId, momentId: before.currentMomentId };
  return { decision, resolution,
    decisionConfirmation: { ...ids, phase: 'decision', admitted: historical.lifecycleBefore.admission.admittedToPlayer,
      lifecycleState: historical.lifecycleBefore.lifecycleState },
    resultConfirmation: { ...ids, phase: 'resolution', status: 'settled',
      settlementApplied: historical.execution.settlement.settlementApplied, completedMomentId: completed.id,
      selectedRouteId: completed.initialRoute, actualRouteId: completed.activeRoute,
      beforeState: stateOf(before), afterState: stateOf(completed), beforeRunners: before.runners.slice(),
      afterRunners: completed.runners.slice(), batterRunnerId: before.currentBatter,
      outsCreated: completed.outsCreated, scoringRunnerIds: completed.scoringRunnerIds.slice() } };
}
function views() {
  const i = inputs(), d = contract.createDecisionView(i.decision, i.decisionConfirmation);
  return { i, d, r: contract.createResolutionView(d, i.resolution, i.resultConfirmation) };
}
const rejects = fn => assert.throws(fn, contract.ContractError);
function frozen(value) {
  if (value && typeof value === 'object') {
    assert.equal(Object.isFrozen(value), true); Object.values(value).forEach(frozen);
  }
}

test('v0.2 schema is separate, strict and validates the two historical projections', () => {
  const { i, d, r } = views();
  assert.equal(contract.VERSION, 'match-ui-slice/0.2');
  assert.equal(contract.SCHEMA.$defs.DecisionView.additionalProperties, false);
  assert.equal(contract.SCHEMA.$defs.ResolutionView.additionalProperties, false);
  assert.equal(contract.validateDecisionView(d, i.decision, i.decisionConfirmation), true);
  assert.equal(contract.validateResolutionView(r, d, i.resolution, i.resultConfirmation), true);
  for (const key of ['matchId', 'momentId', 'presentationId', 'state', 'situationText', 'choices']) {
    const bad = clone(d); delete bad[key]; rejects(() => contract.validateSchema(bad));
  }
});

test('Match / Moment / Presentation identity mismatches fail closed independently', () => {
  for (const key of ['matchId', 'momentId', 'presentationId']) {
    const i = inputs(), bad = clone(i.decisionConfirmation); bad[key] += '-stale';
    rejects(() => contract.createDecisionView(i.decision, bad));
    const d = contract.createDecisionView(i.decision, i.decisionConfirmation);
    i.resolution[key] += '-stale'; rejects(() => contract.createResolutionView(d, i.resolution, i.resultConfirmation));
  }
  const { i, d } = views(); i.resultConfirmation.completedMomentId += '-stale';
  rejects(() => contract.createResolutionView(d, i.resolution, i.resultConfirmation));
});

test('all four original legal choices, commands, targets and risks survive unchanged', () => {
  const { i, d } = views(); assert.deepEqual(d.choices, i.decision.choices);
  assert.deepEqual(d.choices.map(c => c.routeId), ['secureFirstBaseOut', 'forceSecond', 'startDoublePlaySecond', 'holdBall']);
  for (const mutate of [x => x.choices.pop(), x => x.choices[1].matchDecision = 'secure',
    x => x.choices[2].risk = 'low', x => x.choices[3].routeId = 'forceSecond', x => x.choices[0].matchMomentId = 'stale']) {
    const bad = clone(i.decision); mutate(bad); rejects(() => contract.createDecisionView(bad, i.decisionConfirmation));
  }
});

test('public narrative is byte-for-byte preserved; null observations do not remove cues', () => {
  const { i, d } = views(); assert.equal(d.situationText, historical.lifecycleBefore.contextSnapshot.presentationText);
  assert.equal(d.situationText, i.decision.situationText);
  for (const cue of ['往你的左側移動', '一壘跑者受迫往二壘', '打者跑者正衝向一壘', '二壘封殺窗口很緊', '一壘出局窗口很緊']) assert.ok(d.situationText.includes(cue));
  assert.ok(Object.values(d.observations).every(v => v === null));
  assert.equal(d.player.position, 'SS'); assert.equal(d.player.responsibilityText, null);
});

test('missing / null / partial optional observations remain unknown without parsing text', () => {
  for (const mode of ['missing', 'null', 'partial']) {
    const i = inputs();
    if (mode === 'missing') delete i.decision.observations;
    else i.decision.observations = mode === 'null' ? null : { directionText: null };
    const d = contract.createDecisionView(i.decision, i.decisionConfirmation);
    assert.ok(Object.values(d.observations).every(v => v === null));
    assert.equal(d.situationText, v01.examples.decision.situationText);
  }
  const i = inputs(); delete i.decision.state.outs;
  rejects(() => contract.createDecisionView(i.decision, i.decisionConfirmation));
});

test('non-null coarse pace is rejected rather than taken from Playback', () => {
  const i = inputs(); i.decision.observations.paceText = v01.examples.playback[0].payload.pace;
  rejects(() => contract.createDecisionView(i.decision, i.decisionConfirmation));
  const { d } = views(); assert.equal(d.observations.ballPaceCueText, null);
  assert.ok(!JSON.stringify(d).includes('firm'));
});

test('Decision accepts neither future results nor private owner objects at any depth', () => {
  const keys = ['outcomeText', 'resultCode', 'runnerChanges', 'physicalTruth', 'contextSnapshot', 'RNG',
    'decisionQuality', 'executionQuality', 'quality', 'advisable', 'readiness', 'timingMargin', 'hiddenEvaluation', 'playback'];
  for (const key of keys) {
    const i = inputs(); i.decision[key] = null;
    rejects(() => contract.createDecisionView(i.decision, i.decisionConfirmation));
  }
  for (const nest of ['observations', 'choice']) {
    const i = inputs(); (nest === 'choice' ? i.decision.choices[0] : i.decision.observations).physicalTruth = {};
    rejects(() => contract.createDecisionView(i.decision, i.decisionConfirmation));
  }
});

test('Decision source and gate cannot be replaced by completed or non-presented data', () => {
  const i = inputs(); rejects(() => contract.createDecisionView(i.resolution, i.decisionConfirmation));
  for (const [key, value] of [['phase', 'resolution'], ['admitted', false], ['lifecycleState', 'decided']]) {
    const bad = clone(i.decisionConfirmation); bad[key] = value;
    rejects(() => contract.createDecisionView(i.decision, bad));
  }
});

test('accessors, callbacks, prototypes, cycles, sparse arrays and undefined fail before projection', () => {
  const i = inputs(); let calls = 0;
  const getter = clone(i.decision); Object.defineProperty(getter, 'state', { enumerable: true, get() { calls++; return i.decision.state; } });
  rejects(() => contract.createDecisionView(getter, i.decisionConfirmation)); assert.equal(calls, 0);
  for (const mutate of [x => x.callback = () => calls++, x => Object.setPrototypeOf(x, { hidden: true }),
    x => x.self = x, x => delete x.state.bases[1], x => x.observations.directionText = undefined]) {
    const bad = clone(i.decision); mutate(bad); rejects(() => contract.createDecisionView(bad, i.decisionConfirmation));
  }
  assert.equal(calls, 0);
});

test('Resolution requires explicit confirmed settlement and reveal gate; no inferred defaults', () => {
  for (const mutate of [x => x.settlementApplied = false, x => delete x.settlementApplied,
    x => x.phase = 'decision', x => x.status = 'pending', x => delete x.beforeState, x => delete x.outsCreated]) {
    const { i, d } = views(), bad = clone(i.resultConfirmation); mutate(bad);
    rejects(() => contract.createResolutionView(d, i.resolution, bad));
  }
});

test('confirmed 6-3 state comparison shows 1 to 2 outs, unchanged score and first to second', () => {
  const { d, r } = views();
  assert.equal(r.resultCode, 'oneOut'); assert.equal(r.batterResult, 'out');
  assert.equal(r.selectedRouteId, 'secureFirstBaseOut'); assert.equal(r.actualRouteId, 'secureFirstBaseOut');
  assert.deepEqual(r.stateChange.before, d.state); assert.deepEqual(r.stateChange.after, r.state);
  assert.equal(r.stateChange.outsDelta, 1); assert.deepEqual(r.stateChange.scoreDelta, { home: 0, away: 0 });
  assert.deepEqual(r.stateChange.before.bases, [true, false, false]); assert.deepEqual(r.state.bases, [false, true, false]);
  assert.deepEqual(r.state.scores, { home: 0, away: 1 }); assert.equal(r.state.outs, 2);
});

test('runner changes identify the actual batter and original first-base runner', () => {
  const { r } = views();
  assert.deepEqual(r.runnerChanges, [
    { runnerId: 'regional-power-school-player-09', from: 'batter', to: 'out' },
    { runnerId: 'regional-power-school-player-04', from: 1, to: 2 }
  ]);
  assert.deepEqual(r.achievedOutcome.outRunnerIds, ['regional-power-school-player-09']);
  assert.deepEqual(r.achievedOutcome.advancedRunnerIds, ['regional-power-school-player-04']);
  assert.deepEqual(r.achievedOutcome.scoringRunnerIds, []);
});

test('unknown, duplicate, missing or inconsistent runner movements fail closed', () => {
  for (const mutate of [x => x.runnerChanges[0].runnerId = 'unknown-runner', x => x.runnerChanges[1].to = 3,
    x => x.runnerChanges.push(clone(x.runnerChanges[0])), x => x.runnerChanges.pop(),
    x => x.runnerChanges[1].from = 2, x => x.batterResult = 'single']) {
    const { i, d } = views(), bad = clone(i.resolution); mutate(bad);
    rejects(() => contract.createResolutionView(d, bad, i.resultConfirmation));
  }
  const { i, d } = views(); i.resultConfirmation.afterRunners[1] = 'wrong-runner';
  rejects(() => contract.createResolutionView(d, i.resolution, i.resultConfirmation));
});

test('snapshot / outs / score / ordering contradictions are not recomputed into a result', () => {
  for (const mutate of [x => x.state.outs = 3, x => x.state.scores.home = 1, x => x.state.bases[0] = true,
    x => x.presentationSequence = 0, x => x.half = 'bottom']) {
    const { i, d } = views(), bad = clone(i.resolution); mutate(bad);
    rejects(() => contract.createResolutionView(d, bad, i.resultConfirmation));
  }
  const { i, d } = views(); i.resultConfirmation.outsCreated = 0;
  rejects(() => contract.createResolutionView(d, i.resolution, i.resultConfirmation));
});

test('selected and actual route may differ at the relation level without creating an outcome', () => {
  const { d } = views();
  assert.equal(contract.validateRoutePair({ selectedRouteId: 'startDoublePlaySecond', actualRouteId: 'secureFirstBaseOut' }, d), true);
  assert.equal(contract.validateRoutePair({ selectedRouteId: 'forceSecond', actualRouteId: 'holdBall' }, d), true);
  rejects(() => contract.validateRoutePair({ selectedRouteId: 'invented', actualRouteId: 'secureFirstBaseOut' }, d));
  // No synthetic completedMoment / runnerChanges / result is made for these pairs.
});

test('a mismatched submitted-route confirmation cannot alter the frozen selected objective', () => {
  const { i, d, r } = views();
  assert.deepEqual(r.selectedObjective, { routeId: 'secureFirstBaseOut', matchDecision: 'secure', routeLabel: '6-3', objectiveText: '優先爭取打者出局', risk: 'low' });
  i.resultConfirmation.selectedRouteId = 'forceSecond';
  rejects(() => contract.createResolutionView(d, i.resolution, i.resultConfirmation));
});

test('other three legal routes remain unverified and cannot reuse the 6-3 result', () => {
  for (const routeId of ['forceSecond', 'startDoublePlaySecond', 'holdBall']) {
    const { i, d } = views(); i.resolution.actualRouteId = routeId; i.resultConfirmation.actualRouteId = routeId;
    assert.throws(() => contract.createResolutionView(d, i.resolution, i.resultConfirmation), { code: 'UnsupportedRoute' });
    assert.ok(d.choices.some(c => c.routeId === routeId));
  }
  assert.equal(contract.createPlayback, undefined);
});

test('verified tradeoff describes actual gain and remaining situation only', () => {
  const { r } = views();
  assert.equal(r.verifiedTradeoffText, '優先爭取打者出局；實際完成打者出局，原一壘跑者推進二壘。');
  assert.ok(!/放棄.*雙殺|如果|最佳|確定.*出局/.test(r.verifiedTradeoffText));
  const nullable = clone(r); nullable.verifiedTradeoffText = null;
  assert.equal(contract.validateSchema(nullable), true); // null is representable; no new result created.
});

test('new decision / execution feedback is nullable and never upgrades hidden quality or guaranteed wording', () => {
  const { i, d, r } = views();
  assert.equal(r.decisionFeedbackText, null); assert.equal(r.executionFeedbackText, null);
  const absent = clone(r); delete absent.decisionFeedbackText; delete absent.executionFeedbackText;
  assert.equal(contract.validateResolutionView(absent, d, i.resolution, i.resultConfirmation), true);
  for (const field of ['decisionFeedbackText', 'executionFeedbackText']) {
    const bad = clone(r); bad[field] = historical.publicDecision.newCompleted[0].defensiveOutcomeExplanation.judgment;
    rejects(() => contract.validateSchema(bad));
  }
});

test('original outcome / feedback text is retained completely; missing optional feedback stays null', () => {
  const { i, d, r } = views();
  assert.equal(r.outcomeText, historical.publicDecision.newCompleted[0].outcome);
  assert.equal(r.feedbackText, historical.publicDecision.newCompleted[0].causeExplanation);
  assert.equal(r.outcomeText, i.resolution.outcomeText); assert.equal(r.feedbackText, i.resolution.feedbackText);
  delete i.resolution.feedbackText;
  const missing = contract.createResolutionView(d, i.resolution, i.resultConfirmation);
  assert.equal(missing.feedbackText, null); assert.equal(missing.outcomeText, r.outcomeText);
});

test('source-aware validators reject forged cues, strategy assertions and internal payloads', () => {
  const { i, d, r } = views(); const cue = clone(d); cue.observations.ballDirectionText = 'invented';
  rejects(() => contract.validateDecisionView(cue, i.decision, i.decisionConfirmation));
  const strategy = clone(r); strategy.verifiedTradeoffText = '6-3 是最佳選擇。';
  rejects(() => contract.validateResolutionView(strategy, d, i.resolution, i.resultConfirmation));
  for (const key of ['decisionQuality', 'executionQuality', 'physicalTruth', 'contextSnapshot', 'provenance', 'evaluation', 'quality']) {
    const bad = clone(r); bad[key] = null; rejects(() => contract.validateSchema(bad));
    const source = clone(i.resolution); source[key] = null; rejects(() => contract.createResolutionView(d, source, i.resultConfirmation));
  }
});

test('all DTO descendants and schema freeze without freezing or changing caller inputs', () => {
  const i = inputs(), before = JSON.stringify(i);
  const d = contract.createDecisionView(i.decision, i.decisionConfirmation);
  const r = contract.createResolutionView(d, i.resolution, i.resultConfirmation);
  frozen(d); frozen(r); frozen(contract.SCHEMA);
  assert.equal(JSON.stringify(i), before); assert.equal(Object.isFrozen(i.decision.state), false);
  assert.throws(() => d.state.bases.push(true), TypeError);
  assert.throws(() => r.runnerChanges[0].to = 1, TypeError);
  i.decision.state.outs = 0; i.resolution.state.scores.home = 99;
  assert.equal(d.state.outs, 1); assert.equal(r.state.scores.home, 0);
});

test('Replay returns the same frozen cached result without projection, quality or simulation calls', () => {
  const { i, d, r } = views(), cache = contract.createReplayCache(d, r), bytes = JSON.stringify(r);
  Object.defineProperty(i.resultConfirmation, 'settlementApplied', { get() { throw new Error('source re-read'); } });
  for (let n = 0; n < 3; n++) { assert.equal(cache.replay(), r); assert.equal(JSON.stringify(cache.replay()), bytes); }
  assert.equal(Object.isFrozen(cache), true);
  rejects(() => contract.createReplayCache(clone(d), r));
  rejects(() => contract.createReplayCache(d, clone(r)));
  assert.ok(!Object.keys(require.cache).some(p => ['script.js', 'save.js', 'defensive-runner-throw-settlement-foundation.js'].includes(path.basename(p))));
});

test('full-game final score cannot replace the single-ball Resolution', () => {
  const { i, d, r } = views(); assert.deepEqual(r.state.scores, { home: 0, away: 1 });
  assert.deepEqual(historical.threeTimes.final.scores, { home: 1, away: 7 });
  i.resolution.state.scores = clone(historical.threeTimes.final.scores);
  rejects(() => contract.createResolutionView(d, i.resolution, i.resultConfirmation));
});

test('v0.1 contract and every prior Prototype file retain audit hashes (hash-only)', () => {
  const protectedPaths = new Set(audit.integrity.protectedMetadata.map(x => x.file));
  const hashes = audit.integrity.existingReadableHashes;
  const paths = ['docs/match-ui-slice-data-contract-v0.1.md', 'docs/match-ui-slice-data-contract-v0.1-evidence.json',
    ...Object.keys(hashes).filter(p => p.startsWith('prototype/match-ui-p1/'))];
  assert.ok(paths.length > 2);
  for (const p of paths) { assert.ok(!protectedPaths.has(p)); assert.equal(hash(p), hashes[p], p); }
});
