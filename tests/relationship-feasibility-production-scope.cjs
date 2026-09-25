'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const BASELINE = '758e963';
// Ownership follows the original feasibility audit's writer -> persistence ->
// source -> candidate -> selection chain, not every file searched by that audit.
const OWNERS = Object.freeze({
  'high-school-exchange-network.js': 'Canonical evidence constructors, normalization, lineage and source authority',
  'high-school-friendly-invitation-producer.js': 'Return visit, coach and school relationship source refs/precedence',
  'high-school-training-camp-producer.js': 'Camp source authority, merged evidence refs and precedence',
  'high-school-match-opportunity-generation.js': 'Evidence-backed candidate generation and eligibility',
  'high-school-opportunity-selection.js': 'Selection v2, lifecycle slots, budgets and materialization',
  'high-school-opportunity-probability.js': 'Probability v1, source weighting and 3/2/1',
  'high-school-schedule-opportunity.js': 'Opportunity/schedule identity and lifecycle persistence',
  'save.js': 'Audited normalizeSave/loadGame persistence and evidence restoration'
});
const FILES = Object.freeze(Object.keys(OWNERS));
const normalize = text => text.replace(/\r\n?/g, '\n');
function assertSources(current, baseline) {
  for (const file of FILES) {
    assert.equal(typeof current[file], 'string', 'Missing current protected source: ' + file);
    assert.equal(typeof baseline[file], 'string', 'Missing baseline protected source: ' + file);
    assert.equal(normalize(current[file]), normalize(baseline[file]), 'Protected feasibility source mismatch: ' + file);
  }
}
function assertWorkingTree() {
  const root = path.resolve(__dirname, '..');
  const current = {}, baseline = {};
  for (const file of FILES) {
    current[file] = fs.readFileSync(path.join(root, file), 'utf8');
    baseline[file] = cp.execFileSync('git', ['show', BASELINE + ':' + file], { cwd: root, encoding: 'utf8', maxBuffer: 8e6 });
  }
  assertSources(current, baseline);
}
module.exports = { BASELINE, OWNERS, FILES, assertSources, assertWorkingTree };
