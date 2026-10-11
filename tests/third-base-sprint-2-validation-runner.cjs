'use strict';
// Reproduce Sprint 2 evidence without checking out, staging, or reading protected WIP.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const baseline = '58b9ce906e00001081dcf8e15d9b0b492a2a74b7';
const output = path.join(root, 'docs/third-base-ordinary-ground-sprint-2-validation.json');
const previous = require('../docs/shared-infield-contract-2b-completion-sprint-1-validation.json').legacyPitchFreezeCloseout.stageThree;
const manifest = previous.manifest;
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
if (manifest.length !== 227 || manifest.some(file => /fast-check-smoke-test|install\.ps1/.test(file))) throw Error('Invalid saved manifest');
const evidence = {
  baseline, startedAt: new Date().toISOString(), node: process.version, platform: process.platform,
  architecture: process.arch, cwd: root, protectedWip: 'Excluded from all reads, execution, writes, staging, and cleanup.',
  initialStatus: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8', windowsHide: true }),
  manifestOrigin: 'docs/shared-infield-contract-2b-completion-sprint-1-validation.json: legacyPitchFreezeCloseout.stageThree',
  manifestSha256: sha(JSON.stringify(manifest)), previousManifestSha256: previous.manifestSha256,
  sourceSha256: Object.fromEntries(['script.js', 'save.js', 'batted-ball-ground-defense.js', 'defensive-opportunity-foundation.js',
    'defensive-reach-secure-foundation.js', 'defensive-decision-throw-foundation.js', 'defensive-runner-throw-settlement-foundation.js',
    'match-experience-development.js', 'match-game-record.js'].map(file => [file, sha(fs.readFileSync(path.join(root, file)))]))
};
function save() { fs.writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n'); }
function run(file, args = [file]) {
  return new Promise(resolve => {
    const started = Date.now();
    const sourceSha256 = sha(fs.readFileSync(path.join(root, file)));
    const child = spawn(process.execPath, args, { cwd: root, windowsHide: true, env: process.env });
    let stdout = '', stderr = '', timedOut = false, error = null;
    child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
    child.on('error', value => { error = value.message; });
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, 600000);
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      const result = { file, exitCode, signal, error, timedOut, durationMs: Date.now() - started,
        sourceSha256, stdout, stderr, outputSha256: sha(stdout + stderr) };
      console.log(`${exitCode === 0 ? 'PASS' : 'FAIL'} ${file} (${result.durationMs} ms)`); resolve(result);
    });
  });
}
async function pool(files) {
  const results = new Array(files.length); let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < files.length) { const index = cursor++; results[index] = await run(files[index]); }
  }));
  return results;
}
async function main() {
  evidence.focused = await run('tests/third-base-ground-production-integration-test.js');
  const line = evidence.focused.stdout.split(/\r?\n/).find(value => value.startsWith('THIRD_BASE_NORMAL_ENTRY_COHORT '));
  if (line) evidence.cohort = JSON.parse(line.slice('THIRD_BASE_NORMAL_ENTRY_COHORT '.length));
  save();
  evidence.fullRepository = { manifest, startedAt: new Date().toISOString(), results: await pool(manifest) };
  const full = evidence.fullRepository;
  full.passed = full.results.filter(result => result.exitCode === 0).length;
  full.failed = full.results.length - full.passed; full.finishedAt = new Date().toISOString();
  full.previouslyPassingNowFailing = full.results.filter(result => result.exitCode !== 0
    && previous.results.find(before => before.file === result.file)?.exitCode === 0).map(result => result.file);
  full.debtComparison = full.results.filter(result => result.exitCode !== 0).map(result => {
    const before = previous.results.find(value => value.file === result.file);
    return { file: result.file, previousExitCode: before?.exitCode, currentExitCode: result.exitCode,
      testSourceUnchanged: before?.sourceSha256 === result.sourceSha256, previousOutputSha256: before?.outputSha256,
      currentOutputSha256: result.outputSha256, exactPreviousOutput: before?.outputSha256 === result.outputSha256 };
  });
  save();
  // Admit historical failures only after a same-test replay on the exact Sprint 1 baseline.
  const sourcePaths = execFileSync('git', ['ls-tree', '--name-only', baseline], { cwd: root, encoding: 'utf8', windowsHide: true })
    .split(/\r?\n/).filter(file => file.endsWith('.js'));
  const sources = Object.fromEntries(sourcePaths.map(file => [file,
    execFileSync('git', ['show', `${baseline}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 20e6, windowsHide: true })]));
  const baselineCode = `const fs=require('fs'),path=require('path'),Module=require('module');
    const root=${JSON.stringify(root)}, sources=${JSON.stringify(sources)};
    const read=fs.readFileSync;fs.readFileSync=function(file,options){const absolute=path.resolve(String(file));
      const source=path.dirname(absolute)===root?sources[path.basename(absolute)]:undefined;
      if(source!==undefined)return typeof options==='string'||options?.encoding?source:Buffer.from(source);return read.apply(this,arguments);};
    const loader=Module._extensions['.js'];Module._extensions['.js']=function(module,file){
      const source=path.dirname(file)===root?sources[path.basename(file)]:undefined;
      if(source!==undefined)return module._compile(source,file);return loader(module,file);};
    const file=path.resolve(process.argv[1]), module=new Module(file);module.filename=file;module.paths=Module._nodeModulePaths(path.dirname(file));
    module._compile(read(file,'utf8'),file);`;
  // Send large in-memory sources via stdin instead of the Windows command-line limit.
  evidence.baselineReproduction = [];
  for (const result of full.results.filter(value => value.exitCode !== 0)) {
    evidence.baselineReproduction.push(await new Promise(resolve => {
      const child = spawn(process.execPath, ['-', result.file], { cwd: root, windowsHide: true });
      let stdout = '', stderr = ''; const start = Date.now();
      child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
      child.on('close', (exitCode, signal) => resolve({ file: result.file, baseline, exitCode, signal,
        sourceSha256: result.sourceSha256, durationMs: Date.now() - start, stdout, stderr, outputSha256: sha(stdout + stderr) }));
      child.stdin.end(baselineCode.replace('process.argv[1]', 'process.argv[2]'));
    }));
  }
  evidence.finishedAt = new Date().toISOString(); save();
  evidence.finalSourceSha256 = Object.fromEntries(Object.keys(evidence.sourceSha256).map(file => [file, sha(fs.readFileSync(path.join(root, file)))]));
  evidence.sourcesUnchangedDuringValidation = JSON.stringify(evidence.sourceSha256) === JSON.stringify(evidence.finalSourceSha256);
  save();
  console.log(JSON.stringify({ focusedExitCode: evidence.focused.exitCode, passed: full.passed, failed: full.failed,
    newFailures: full.previouslyPassingNowFailing, baselineReproductions: evidence.baselineReproduction.map(({ file, exitCode }) => ({ file, exitCode })) }));
  if (evidence.focused.exitCode !== 0 || full.previouslyPassingNowFailing.length || !evidence.sourcesUnchangedDuringValidation) process.exitCode = 1;
}
main().catch(error => { evidence.runnerError = error.stack; save(); console.error(error); process.exitCode = 1; });
