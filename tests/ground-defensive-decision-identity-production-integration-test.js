const assert = require('assert/strict');
const { trajectory, assertComplete } = require('./ground-defensive-decision-identity-test-context.cjs');
const { createHarness } = require('./match-authority-coverage-audit.cjs');
const first = trajectory(); assertComplete(first);
const repeated = trajectory(); assertComplete(repeated);
assert.deepEqual(first.game.match, repeated.game.match);
assert.deepEqual(first.moments, repeated.moments);
const off = createHarness({ observe: false }).play(22430002);
const on = createHarness({ observe: true }).play(22430002);
assert.deepEqual(off.match, on.match);
assert.deepEqual(off.match, first.game.match);
const m = off.match, r = m.gameRecord;
assert.equal(m.scores.home, 0); assert.equal(m.scores.away, 3);
assert.equal(r.result.winnerTeamId, r.awayTeamId);
assert.equal(r.result.loserTeamId, r.homeTeamId);
assert.equal(r.result.tie, false);
assert.deepEqual(r.result.finalScore, { away: 3, home: 0 });
assert.equal(Object.values(r.playerLines).reduce((n,l) => n+l.pitching.outsRecorded,0), 42);
const sweep = [];
for (const seed of [...Array.from({length:20}, (_,i) => 22430000+i), 22430119]) {
  const t = trajectory(seed, { stale: true }); assertComplete(t);
  assert(t.stale.every(x => x.rejected && x.unchanged));
  sweep.push({ seed, completed: true, defensiveMoments: t.moments.length, groundLifecycleMoments: t.moments.filter(m=>m.lifecycleType === "groundBallDefensiveDecision").length,
    ids: t.moments.map(m => m.id), positions: [...new Set(t.moments.map(m => m.position))],
    displayedChoiceMomentIdMismatch: t.moments.flatMap(m => m.choices.filter(c => c.matchMomentId !== m.id)).length,
    rejectedCurrent: t.moments.filter(m => !m.accepted).length,
    staleAttempted: t.stale.length, staleRejected: t.stale.filter(s => s.rejected).length,
    noProgress: t.game.result.noProgress, stateIssues: t.game.result.integrityIssues.length,
    recordIssues: t.game.result.gameRecordIntegrityIssues.length, pa: t.check.pa, pitcherBF: t.check.pitcherBF });
}
const repeatedGround = sweep.find(r => r.seed === 22430119);
assert.equal(repeatedGround.groundLifecycleMoments, 2);
assert.deepEqual(repeatedGround.ids, ['hs_y1_match_defense_1', 'hs_y1_match_defense_2']);
assert(sweep.some(r => r.ids.includes('hs_y1_match_defense_3')));
assert(sweep.reduce((n,r) => n+r.staleAttempted,0) > 0);
console.log('R1_JSON=' + JSON.stringify({ seed22430002: { completed: true, pa: first.check.pa, pitcherBF: first.check.pitcherBF,
  score: m.scores, winner: r.result.winnerTeamId, status: r.status, outs:42 },
  determinism: true, observerNeutral: true, simulationCursorEqual: true, sweep,
  warnings: ['Current production ground lifecycle trajectory sample is admitted 2B; no unsupported positions forced.'] }));
console.log('Production integration PASS');
