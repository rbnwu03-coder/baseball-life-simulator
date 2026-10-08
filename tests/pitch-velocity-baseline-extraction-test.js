'use strict';
const assert = require('assert/strict');
const cp = require('child_process');
const vm = require('vm');
const path = require('path');
const { createRequire } = require('module');
const current = require('../offensive-plate-approach');
// Fixed safe production baseline, not HEAD: remains useful after this sprint is committed.
const baseline = cp.execFileSync('git', ['show', '5937fe5:offensive-plate-approach.js'], { encoding: 'utf8', cwd: path.join(__dirname, '..') });
const context = vm.createContext({ module: { exports: {} }, require: createRequire(path.join(__dirname, '../offensive-plate-approach.js')) });
vm.runInContext(baseline, context);
const original = context.module.exports;
const clone = x => JSON.parse(JSON.stringify(x));
const abilities = { observe: 9, baseballIQ: 9, ballSense: 9, batting: 9, power: 9 };
let comparisons = 0;
for (const pitchType of [undefined, 'fastball', 'slider', 'changeup', 'curveball', 'unknown']) {
  for (const velocity of [undefined, null, 75, 105]) {
    const state = current.createPlateAppearanceState({ matchId: 'extraction-proof', paId: `pa-${comparisons}`, batterId: 'player', inning: 1, half: 'top' });
    const options = { pitch: { pitchLocationClass: 'competitiveStrike', ...(pitchType ? { pitchType } : {}), velocity }, decisionRoute: 'take' };
    assert.deepEqual(clone(current.generatePitchOpportunity(state, options.pitch)), clone(original.generatePitchOpportunity(state, options.pitch)));
    assert.deepEqual(clone(current.resolveNextPitch(state, abilities, options)), clone(original.resolveNextPitch(state, abilities, options)));
    comparisons++;
  }
}
assert.deepEqual(['fastball', 'slider', 'changeup', 'curveball'].map(current.getPitchVelocityBaseline), [89, 82, 80, 76]);
assert.equal(current.getPitchVelocityBaseline('unknown'), null);
console.log('PASS baseline extraction preserves full pitch truth and settlement: ' + comparisons + ' fixed cases');
