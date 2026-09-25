'use strict';
const assert = require('assert/strict');
const scope = require('./relationship-feasibility-production-scope.cjs');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
const baseline = Object.fromEntries(scope.FILES.map(f => [f, 'owned contract: ' + f + '\n']));
test('explicit ownership manifest has no repository-wide discovery', () => {
  assert.equal(scope.FILES.length, 8);
  assert.equal(scope.FILES.length, new Set(scope.FILES).size);
  assert(Object.values(scope.OWNERS).every(reason => reason.length > 20));
});
test('unrelated Match-only source change does not alter source-scope gate', () => {
  const before = { ...baseline, 'script.js': 'old Match implementation' };
  const after = { ...baseline, 'script.js': 'new Match implementation' };
  scope.assertSources(after, before);
  assert(!scope.FILES.includes('script.js'));
});
for (const file of scope.FILES) {
  test('reject protected mismatch: ' + file, () => assert.throws(() => scope.assertSources({ ...baseline, [file]: baseline[file] + 'changed contract' }, baseline), /Protected feasibility source mismatch/));
  test('reject missing protected source: ' + file, () => { const missing = { ...baseline }; delete missing[file]; assert.throws(() => scope.assertSources(missing, baseline), /Missing current protected source/); });
}
test('cross-platform newlines retain equivalent contract', () => scope.assertSources(Object.fromEntries(scope.FILES.map(f => [f, baseline[f].replace(/\n/g, '\r\n')])), baseline));
test('actual protected sources still match historical baseline', () => scope.assertWorkingTree());
console.log(`${passed}/${passed} PASS`);
