'use strict';
// Isolated Sprint 6 evidence owner. Existing Sprint evidence and Git are read-only.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('assert/strict');
const cp = require('child_process');
const root = path.resolve(__dirname, '..');
const baselineFile = 'docs/infield-legacy-receiver-model-sprint-6-baseline-evidence.json';
const baseline = JSON.parse(fs.readFileSync(path.join(root, baselineFile), 'utf8'));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 30e6, windowsHide: true }).trimEnd();
function guard() {
  assert.equal(git(['branch', '--show-current']), 'main');
  assert.equal(git(['rev-parse', 'HEAD']), baseline.baseline);
  assert.equal(git(['rev-parse', 'origin/main']), baseline.baseline);
  assert.equal(git(['diff', '--cached', '--name-only']), '');
  for (const [p, h] of Object.entries(baseline.sha256)) {
    assert(!baseline.protectedPaths.includes(p));
    const actual = sha(fs.readFileSync(path.join(root, p)));
    if (p === 'script.js' && actual !== h) {
      const repair = JSON.parse(fs.readFileSync(path.join(root, 'docs/infield-legacy-receiver-model-sprint-6-validation-repair.json'), 'utf8'));
      assert.equal(actual, repair.sourceAfterSha256, 'Only the declared validation repair is allowed');
    } else assert.equal(actual, h, 'Original tracked content changed: ' + p);
  }
  for (const expected of baseline.protectedMetadata) {
    const actual = fs.statSync(path.join(root, expected.path));
    assert.equal(actual.size, expected.bytes); assert.equal(actual.mtimeMs, expected.mtimeMs);
  }
}
function capture(file, value) {
  assert(file.startsWith('docs/infield-legacy-receiver-model-sprint-6-'));
  fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
}
function focused(args = []) {
  const r = cp.spawnSync(process.execPath, ['tests/infield-legacy-receiver-model-foundation-test.js', ...args, '--json'],
    { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 30e6, timeout: 120000 });
  assert(!r.error, r.error?.message);
  const line = r.stdout.split(/\r?\n/).find(s => s.startsWith('S6_JSON='));
  assert(line, 'Focused test did not complete: ' + r.stderr);
  return { exitCode: r.status, stdout: r.stdout.split(/\r?\n/).filter(s => !s.startsWith('S6_JSON=')).join('\n'), stderr: r.stderr, ...JSON.parse(line.slice(8)) };
}
async function main() {
  guard(); const mode = process.argv[2], startedAt = new Date().toISOString();
  if (mode === 'red') {
    const result = focused(['--red']);
    assert.equal(result.exitCode, 1); assert(result.gapSummary.failed > 0);
    capture('docs/infield-legacy-receiver-model-sprint-6-red-evidence.json', { startedAt,
      baseline: baseline.baseline, classification: 'Independent receiver-source gaps remain red; no Production repair attempted',
      testSource: fs.readFileSync(path.join(__dirname, 'infield-legacy-receiver-model-foundation-test.js'), 'utf8'),
      sourceHashes: baseline.sha256, result });
    console.log('RED_CAPTURE ' + JSON.stringify(result.gapSummary));
  } else if (mode === 'red-save') {
    const current = focused(), old = focused(['--baseline']);
    const failures = value => value.results.filter(r => !r.pass).map(({ name, error }) => ({ name, error }));
    assert.deepEqual(failures(current), failures(old));
    assert(failures(current).length > 0, 'Do not create a fictitious save red');
    capture('docs/infield-legacy-receiver-model-sprint-6-save-red-evidence.json', { startedAt,
      baseline: baseline.baseline, classification: 'Newly discovered existing SS lifecycle-copy admission gap; not one of the three historical debts',
      current: { exitCode: current.exitCode, summary: current.summary, failures: failures(current) },
      exactBaseline: { exitCode: old.exitCode, summary: old.summary, failures: failures(old) },
      sameFailures: true, testSource: fs.readFileSync(path.join(__dirname, 'infield-legacy-receiver-model-foundation-test.js'), 'utf8'),
      testSourceSha256: sha(fs.readFileSync(path.join(__dirname, 'infield-legacy-receiver-model-foundation-test.js'))) });
    console.log('SAVE_RED_CAPTURE ' + JSON.stringify({ baselineReproduced: true, failures: failures(current).length }));
  } else if (mode === 'green') {
    const result = focused();
    capture('docs/infield-legacy-receiver-model-sprint-6-green-evidence.json', { startedAt,
      classification: 'Legacy safety/compatibility checks only; not independent receiver-stage closeout', result });
    console.log('GREEN_CAPTURE ' + JSON.stringify(result.summary)); if (result.exitCode !== 0) process.exitCode = 1;
  } else if (mode === 'save-probe' || mode === 'save-probe-final') {
    function probe(args) {
      const r = cp.spawnSync(process.execPath, ['tests/infield-legacy-receiver-model-save-probe.cjs', ...args],
        { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 30e6, timeout: 120000 });
      assert.equal(r.status, 0, r.stderr);
      return JSON.parse(r.stdout.split(/\r?\n/).find(s => s.startsWith('S6_SAVE_JSON=')).slice(13));
    }
    const current = probe([]), old = probe(['--baseline']);
    if (mode === 'save-probe') assert.deepEqual(current.rows, old.rows);
    else {
      assert.deepEqual(current.rows[0], old.rows[0]);
      assert(current.rows.slice(1).every(r => r.normalizationAccepted === false && r.inputUnchanged && r.liveUnchangedAfterNormalize));
      assert.equal(old.rows.filter(r => r.normalizationAccepted).length, 5);
    }
    capture('docs/infield-legacy-receiver-model-sprint-6-' + (mode === 'save-probe' ? 'save-probe' : 'save-probe-final') + '.json', { startedAt,
      baseline: baseline.baseline, classification: 'Existing lifecycle-copy validation/recovery behavior, not new receiver execution',
      controlUnchangedOnExactBaseline: true, expectedValidationChange: mode === 'save-probe-final', current, exactBaseline: old });
    console.log('SAVE_PROBE_CAPTURE ' + JSON.stringify(current.rows.map(({ name, normalizationAccepted, recoveryError }) => ({ name, normalizationAccepted, recoveryError }))));
  } else if (mode === 'compare') {
    const current = focused(), old = focused(['--baseline']);
    const pairs = current.cases.map((row, i) => ({ name: row.name,
      equal: JSON.stringify(row) === JSON.stringify(old.cases[i]) }));
    const expectedValidationChanges = old.results.filter(r => !r.pass).map(r => r.name);
    const regressions = current.results.filter((r, i) => !r.pass && old.results[i]?.pass);
    const equal = current.exitCode === 0 && old.exitCode === 1 && current.cases.length === old.cases.length && pairs.every(p => p.equal)
      && expectedValidationChanges.length === 4 && expectedValidationChanges.every(name => name.startsWith('SS save rejects '))
      && regressions.length === 0;
    capture('docs/infield-legacy-receiver-model-sprint-6-comparison.json', { startedAt, baseline: baseline.baseline,
      methodology: 'Exact c4121ce root sources compiled in memory versus unchanged current Production; no new authority enabled',
      pairs, allEqual: equal, currentSummary: current.summary, baselineSummary: old.summary,
      migrationWitnesses: current.migrationWitnesses, expectedVersionedExecutionChanges: [],
      enabledScorerChanges: [], expectedValidationChanges, baselineFailuresRetained: old.results.filter(r => !r.pass),
      unintendedRegressions: [...pairs.filter(p => !p.equal), ...regressions], currentCases: current.cases });
    console.log('COMPARE_CAPTURE ' + JSON.stringify({ pairs: pairs.length, equal })); if (!equal) process.exitCode = 1;
  } else if (mode === 'regression' || mode === 'regression-final' || mode === 'full-final') {
    const previous = JSON.parse(fs.readFileSync(path.join(root, 'docs/infield-scorer-recovery-sprint-5-l03-execution-comparison.json'), 'utf8'));
    const validation = JSON.parse(fs.readFileSync(path.join(root, 'docs/infield-scorer-recovery-sprint-5-l03-validation-final.json'), 'utf8'));
    const full = mode === 'full-final';
    const files = full ? validation.fullRepository.manifest : ['tests/infield-scorer-recovery-integrity-repair-test.js', 'tests/infield-legacy-receiver-scorer-closeout-test.js', ...previous.representativeRegression.files];
    if (full) { assert.equal(files.length, 227); assert.equal(sha(JSON.stringify(files)), validation.manifestSha256); }
    const output = 'docs/infield-legacy-receiver-model-sprint-6-' + (full ? 'validation-final' : mode === 'regression-final' ? 'regression-final' : 'regression') + '.json';
    assert(!fs.existsSync(path.join(root, output)), 'Immutable validation already exists; do not rerun the manifest');
    const sourceBefore = sha(fs.readFileSync(path.join(root, 'script.js')));
    const results = [];
    for (const file of files) {
      assert(!baseline.protectedPaths.includes(file));
      // The previously verified git-show buffer compatibility applies only to a
      // call without explicit maxBuffer. Tests, assertions and seeds are unchanged.
      const wrapper = "const cp=require('child_process'),original=cp.execFileSync;cp.execFileSync=function(command,args,opts){if(command==='git'&&args?.[0]==='show'&&opts&&typeof opts==='object'&&opts.maxBuffer===undefined)return original.call(this,command,args,{...opts,maxBuffer:30e6});return original.apply(this,arguments);};require(process.argv[1]);";
      const r = cp.spawnSync(process.execPath, ['-e', wrapper, path.resolve(root, file)],
        { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 180000, maxBuffer: 30e6 });
      results.push({ file, sourceHash: sha(fs.readFileSync(path.join(root, file))), exitCode: r.status,
        error: r.error?.message || null, stdoutBytes: Buffer.byteLength(r.stdout || ''),
        stdoutSha256: sha(r.stdout || ''), stdoutTail: (r.stdout || '').slice(-6000), stderr: r.stderr || '' });
      console.log((full ? 'FULL ' : 'REGRESSION ') + file + ' exit=' + r.status);
    }
    guard();
    const passed = results.filter(r => r.exitCode === 0 && !r.error).length;
    assert.equal(sha(fs.readFileSync(path.join(root, 'script.js'))), sourceBefore);
    const failures = results.filter(r => r.exitCode !== 0 || r.error);
    const debtVerification = full ? validation.baselineDebtVerification.map(debt => {
      const r = results.find(r => r.file === debt.file);
      return { ...debt, sameCurrentSignature: r.exitCode === 1 && (r.stdoutTail + r.stderr).includes(debt.signature),
        unchangedTestHash: r.sourceHash === validation.validationInputsSha256[debt.file] };
    }) : [];
    const known = new Set(validation.baselineDebtVerification.map(r => r.file));
    const newProductionRegressions = full ? failures.filter(r => !known.has(r.file)) : failures;
    capture(output, { startedAt, finishedAt: new Date().toISOString(),
      baseline: baseline.baseline, files, results, passed, failed: files.length - passed,
      sourceBefore, sourceAfter: sourceBefore, manifestSha256: full ? validation.manifestSha256 : null,
      allOriginalSuiteSourceHashesUnchanged: full ? files.every(p => sha(fs.readFileSync(path.join(root, p))) === validation.validationInputsSha256[p]) : null,
      debtVerification, newProductionRegressions,
      fullRepository: { runThisSprint: full, originalManifestExecutionsThisSprint: full ? 1 : 0,
        source: 'docs/infield-scorer-recovery-sprint-5-l03-validation-final.json' } });
    console.log('REGRESSION_CAPTURE ' + passed + '/' + files.length);
    if (full ? newProductionRegressions.length > 0 || debtVerification.some(r => !r.sameCurrentSignature || !r.unchangedTestHash) : passed !== files.length) process.exitCode = 1;
  } else throw Error('Choose red, red-save, green, save-probe, compare, regression-final or full-final. Captures are immutable.');
  guard();
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
