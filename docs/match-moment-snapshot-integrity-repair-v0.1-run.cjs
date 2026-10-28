"use strict";
const assert = require('node:assert/strict');
const C = require('./match-moment-snapshot-integrity-repair-v0.1-capture.cjs');
C.epoch('fixed');
const planned = C.json(C.prefix + 'plan-evidence.json');
const suites = [
  ['canonical', 'tests/canonical-match-regression-integration-test.cjs', 50, 'Canonical Match Regression: 50/50 passed.'],
  ['game-record', 'tests/match-full-game-record-test.js', 13, 'Match Full Game Record: 13/13 passed.'],
  ['experience', 'tests/match-experience-development-foundation-v1-test.js', 46, '46/46'],
  ['presentation', 'tests/match-development-settlement-presentation-v1-test.js', 35, '35/35']
];
const results = [];
for (const [label, file, checks, summary] of suites) {
  const row = C.run(label, file, 'fixed');
  const accepted = row.status === 'PASS' && row.exitCode === 0 && row.entryVerified && row.sourceStable && row.stdout.includes(summary);
  results.push({label, file, checks, accepted, status:row.status, exitCode:row.exitCode, elapsedMs:row.elapsedMs, entryVerified:row.entryVerified, sourceStable:row.sourceStable, successfulAssertions:row.successfulAssertions, evidence:C.childPrefix + label + '-evidence.json', witness:C.childPrefix + label + '-evidence-assertions.json'});
  if (!accepted) {
    C.capture('acceptance-stopped', {results, stoppedBefore:suites.slice(results.length).map(row => row[0]), reason:'Unexpected failure or incomplete entry evidence; no further suites or Production scope expansion.'});
    assert.fail('Unexpected acceptance failure; stopped: ' + label);
  }
}
C.capture('acceptance', {plan:C.prefix + 'plan-evidence.json', results, standaloneChildren:results.length, namedChecks:results.reduce((n,row)=>n+row.checks,0), intentionalRedExcluded:true, unexpectedFailures:0, integrity:C.integrity('fixed')});
console.log('Accepted bounded GREEN regressions: 144 named checks in 4 standalone suites.');
