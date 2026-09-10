const assert = require('assert/strict');
const audit = require('./ability-performance-correlation-audit.cjs');
const h = audit.createHarness();
const before = JSON.stringify(h.base);
assert.deepEqual(audit.TIERS, [8, 10, 12, 14, 16]);
for (const spec of audit.CASES) for (const tier of audit.TIERS) {
  const fixture = audit.changeTarget(h.base, spec.field, tier);
  const keys = spec.field.split('.');
  let target = fixture, original = h.base;
  for (const key of keys.slice(0, -1)) { target = target[key]; original = original[key]; }
  assert.equal(target[keys.at(-1)], tier);
  target[keys.at(-1)] = original[keys.at(-1)];
  assert.deepEqual(fixture, h.base, 'Only the named target may change');
}
const first = h.play('baseballSkills.batting', 8, 1);
const repeated = h.play('baseballSkills.batting', 8, 1);
assert.deepEqual(first, repeated, 'Identical seed and fixture must replay exactly');
const unobserved = h.play('baseballSkills.batting', 8, 1, 'player', false);
assert.deepEqual(first.record, unobserved.record, 'Instrumentation neutrality: exact full record');
assert.deepEqual(first.log, unobserved.log, 'Instrumentation neutrality: exact event sequence');
assert.notEqual(audit.seedFixture(h.base, 1).highSchoolMatch.simulationSeed, audit.seedFixture(h.base, 2).highSchoolMatch.simulationSeed);
assert.equal(audit.seedFixture(h.base, 1).highSchoolMatch.id, h.base.highSchoolMatch.id, 'Keep canonical scenario routing identity');
assert.equal(JSON.stringify(h.base), before, 'Immutable source fixture');
assert.deepEqual(first.line, first.record.playerLines.player, 'Full-game record supplies the sample');
assert.equal(first.line.batting.PA, first.log.filter(e=>e.type==='plateAppearance'&&e.batterId==='player').length, 'Canonical PA agrees with full event log');
const canonicalAggregate = require('../match-game-record.js').aggregatePlayerGameLines([first.record,repeated.record], 'player').playerLine;
const sums = audit.aggregate([first, repeated]);
for(const section of ['batting','pitching','defense','baserunning'])assert.deepEqual(sums[section],canonicalAggregate[section], 'Audit aggregation agrees with canonical API');
assert.equal(sums.batting.PA, 2 * first.record.playerLines.player.batting.PA);
assert.equal(sums.pitching.BF, 2 * first.record.playerLines.player.pitching.BF);
assert.equal(sums.defense.chances, 2 * first.record.playerLines.player.defense.chances);
assert.deepEqual(audit.aggregate([{...first, decisions: Array(999).fill({})}]), audit.aggregate([first]), 'Decision counts cannot alter samples');
assert.equal(audit.diagnostics([1, 2, 3, 4, 5], 1).monotonicSteps, 4);
assert.equal(audit.diagnostics([1, 2, 3, 4, 5], -1).verdict, 'INVERTED');
assert.equal(audit.diagnostics([0, 0, 0, 0, 0], 1).correlation, null);
assert.equal(audit.diagnostics(Array(5).fill(0.10753720595295248), -1).correlation, null, 'Constant fractional data has undefined correlation');
assert.equal(audit.diagnostics([null, null, null, null, null], 1).verdict, 'NOT_OBSERVABLE');
assert.equal(audit.diagnostics([1, 3, 2, 4, 5], 1).verdict, 'NON_MONOTONIC');
assert.equal(audit.rates(first.line).AVG, first.line.batting.H / first.line.batting.AB);
const low=[],high=[];
for(let seed=1;seed<=20;seed++) {
  low.push(h.play('baseballSkills.batting',8,seed));
  high.push(h.play('baseballSkills.batting',16,seed));
}
assert(audit.summarize(low).multiHitFraction>0, 'Low tier can have a multi-hit game');
assert(audit.summarize(high).hitlessFraction>0, 'High tier can have a hitless game');
console.log('PASS: isolated tiers, target-only changes, canonical samples, repeatability, aggregation and diagnostics');
