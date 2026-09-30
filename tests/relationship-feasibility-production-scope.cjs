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
// Keep the persistence operations audited by the feasibility Sprint protected,
// without freezing unrelated Match-rule normalization elsewhere in save.js.
const SAVE_PERSISTENCE_OPERATIONS = Object.freeze([
  'localStorage.setItem(SAVE_KEY, JSON.stringify(player))',
  'const fresh = createInitialPlayer(saved.name || "")',
  'Object.assign(fresh, saved)',
  'fresh.highSchoolExchangeNetwork = HighSchoolExchangeNetwork.normalizeState(saved.highSchoolExchangeNetwork)',
  'else if (saved.highSchoolExchangeNetwork?.evidence?.length)',
  'fresh.highSchoolSchedule = HighSchoolScheduleOpportunity.normalizeState(saved.highSchoolSchedule)',
  'const raw = localStorage.getItem(SAVE_KEY)',
  'const candidate = normalizeSave(JSON.parse(raw))',
  'player = candidate;'
]);
function savePersistenceContract(source) {
  const lines = normalize(source).split('\n');
  return SAVE_PERSISTENCE_OPERATIONS.map(operation => {
    const matches = lines.filter(line => line.includes(operation));
    assert.equal(matches.length, 1, 'Missing or ambiguous feasibility persistence operation: ' + operation);
    return matches[0].trim();
  }).join('\n');
}
function assertFeasibilitySaveLoad() {
  const env = require('./high-school-opportunity-selection-test-context.cjs')('enabled');
  env.run("priorExchange('incomingFriendlyInvitation');");
  const snapshot = `(()=>{const input=sourceInput();return {
    ledger:player.highSchoolExchangeNetwork,
    schedule:player.highSchoolSchedule,
    reputation:player.reputation,
    rules:{ruleSetId:player.highSchoolMatch.ruleSetId,rules:player.highSchoolMatch.rules,ruleSetWarning:player.highSchoolMatch.ruleSetWarning},
    friendly:HighSchoolFriendlyInvitationSource.deriveFriendlyInvitationSources(input),
    camp:HighSchoolTrainingCampSource.deriveTrainingCampSources(input),
    candidates:HighSchoolMatchOpportunityGeneration.deriveOpportunityCandidates(input).candidates,
    selection:HighSchoolOpportunitySelection.selectOpportunityCandidates({...input,probabilityPolicy:'enabled'})
  };})()`;
  const before = env.json(snapshot);
  assert(before.ledger.evidence.length > 0);
  assert(before.friendly.sources.length > 0);
  assert.equal(before.rules.ruleSetId, 'highSchoolFullGameV1');
  assert.equal(before.rules.rules.version, 1);
  env.run('saveGame();var feasibilityRenderer=showCurrentEvent;try{showCurrentEvent=()=>{};loadGame();}finally{showCurrentEvent=feasibilityRenderer;}');
  const after = env.json(snapshot);
  assert.deepEqual(after, before, 'Feasibility state or derivation changed after real save/load with Match rules');
  env.run('var feasibilityLegacy=JSON.parse(JSON.stringify(player));delete feasibilityLegacy.highSchoolMatch.ruleSetId;delete feasibilityLegacy.highSchoolMatch.rules;delete feasibilityLegacy.highSchoolMatch.ruleSetWarning;');
  const legacySnapshot = `(()=>{const current=player;try{player=normalizeSave(feasibilityLegacy);return ${snapshot};}finally{player=current;}})()`;
  const legacy = env.json(legacySnapshot);
  const repeated = env.json(legacySnapshot);
  const { rules: ignoredRules, ...feasibilityBefore } = before;
  const { rules: ignoredLegacyRules, ...feasibilityLegacyState } = legacy;
  assert.deepEqual(feasibilityLegacyState, feasibilityBefore, 'Legacy Match-rule normalization changed feasibility');
  assert.deepEqual(repeated, legacy, 'Same legacy save produced different feasibility result');
}
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
  current['save.js'] = savePersistenceContract(current['save.js']);
  baseline['save.js'] = savePersistenceContract(baseline['save.js']);
  assertSources(current, baseline);
  assertFeasibilitySaveLoad();
}
module.exports = { BASELINE, OWNERS, FILES, assertSources, assertWorkingTree };
