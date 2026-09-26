/* Diagnostic only: expected production exception is reported, never suppressed in the cohort. */
const assert = require('assert/strict');
const { createHarness } = require('./match-authority-coverage-audit.cjs');
function reproduce(observe) {
  const h = createHarness({ observe });
  let error = null;
  try { h.play(22430361, 'bench'); } catch (caught) { error = caught.message; }
  const match = h.json('player.highSchoolMatch');
  const active = match.activeSituation;
  const ground = match.groundBallInPlayState;
  const situation = match.defensiveSituation;
  const before = active?.createdAt;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  return { match, evidence: {
    observe, seed: 22430361, requestedRole: 'bench', actualRole: match.playerLineupStatus,
    error, completed: match.completed, inning: match.inning, half: match.half,
    lifecycle: active?.lifecycleState, situationId: active?.situationId,
    sourcePhysicalStateRef: active?.sourcePhysicalStateRef, handoffIdentity: ground?.identity,
    createdAt: before, current: { outs: match.outs, bases: match.runners, score: match.scores, batter: match.currentBatter },
    guards: {
      executionEvidencePresent: !!active?.resolution?.executionEvidence,
      runnerTimingPresent: !!ground?.runnerThrowTiming,
      handoffSettlementApplied: !!ground?.settlementApplied,
      playSettlementApplied: !!ground?.playSettlement?.settlementApplied,
      sourceIdentityMatches: active?.sourcePhysicalStateRef === ground?.identity,
      contextIdentityMatches: situation?.groundBallDefensiveContext?.identity === ground?.identity,
      physicalIdentityMatches: active?.contextSnapshot?.physicalIdentity === ground?.physicalTruth?.identity,
      inningMatches: before?.inning === match.inning, halfMatches: before?.half === match.half,
      outsMatch: before?.outs === match.outs, basesMatch: same(before?.bases, match.runners),
      scoreMatches: same(before?.score, match.scores), batterMatches: situation?.batterId === match.currentBatter,
      settlementIdentityMatches: active?.resolution?.executionEvidence?.runnerSettlementIdentity === situation?.runnerSettlementIdentity
    },
    paCount: match.simulationLog.filter(e => e.type === 'plateAppearance').length,
    recentEvents: match.simulationLog.slice(-8).map(e => ({ sequence: e.sequence, type: e.type,
      inning: e.inning, half: e.half, batterId: e.batterId, result: e.result, outsBefore: e.outsBefore, outsAfter: e.outsAfter }))
  }};
}
function run() {
  const off = reproduce(false), on = reproduce(true), repeated = reproduce(false);
  assert.equal(off.evidence.error, 'Stale resolved ground-ball settlement context');
  assert.equal(on.evidence.error, off.evidence.error);
  assert.equal(repeated.evidence.error, off.evidence.error);
  assert.deepEqual(on.match, off.match);
  assert.deepEqual(repeated.match, off.match);
  return { status: 'REPRODUCED_PRODUCTION_BLOCKER', observerNeutral: true, deterministic: true,
    evidence: off.evidence, repetitions: 3 };
}
module.exports = { reproduce, run };
if (require.main === module) console.log(JSON.stringify(run(), null, 2));
