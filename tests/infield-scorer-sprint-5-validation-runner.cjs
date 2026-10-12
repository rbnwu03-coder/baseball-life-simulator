'use strict';
// Sprint 5 validation owns only its two new evidence files. No Git mutations.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const { spawn, execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const baseline = 'f16a7f7b2263681788f3846c2e83fbb6f8b0bc53';
const finalManifest = process.argv[2] === 'full-final';
const output = path.join(root, finalManifest ? 'docs/infield-scorer-recovery-sprint-5-validation-final.json'
  : 'docs/infield-scorer-recovery-sprint-5-validation.json');
const comparisonOutput = path.join(root, 'docs/infield-scorer-recovery-sprint-5-execution-comparison.json');
const previousPath = 'docs/first-base-receive-active-ground-sprint-3-validation.json';
const protectedPaths = new Set(['tests/fast-check-smoke-test.cjs', 'install.ps1',
  'docs/first-base-sprint-3-focused-development-evidence.json']);
const reviewedTestChanges = {
  'tests/third-base-ground-production-integration-test.js': 'OBR 9.12(d)(3): change the known incorrect second-leg wild-throw E=1 assertion to E=0, retaining all execution assertions and adding team-E / scorer-reason checks. No seed or fixture changes.'
};
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 30e6 }).trimEnd();
function read(file) {
  const relative = path.relative(root, path.resolve(root, file)).replace(/\\/g, '/');
  if (protectedPaths.has(relative)) throw Error('Protected path cannot be read: ' + relative);
  return fs.readFileSync(path.resolve(root, file));
}
function save(file, value) {
  assert.ok(file === output || file === comparisonOutput, 'Evidence output outside Sprint 5 ownership');
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}
function baselineGuard() {
  assert.equal(git(['branch', '--show-current']), 'main');
  assert.equal(git(['rev-parse', 'HEAD']), baseline);
  assert.equal(git(['rev-parse', 'origin/main']), baseline);
  assert.equal(git(['diff', '--cached', '--name-only']), '');
}
function sourceHashes() {
  return Object.fromEntries(git(['ls-files']).split(/\r?\n/)
    .filter(file => !file.includes('/') && (/\.js$/.test(file) || file === 'index.html'))
    .map(file => [file, sha(read(file))]));
}
function baselineSources() {
  const files = git(['ls-tree', '--name-only', baseline]).split(/\r?\n/)
    .filter(file => /\.js$/.test(file) || file === 'index.html');
  return Object.fromEntries(files.map(file => [file, execFileSync('git', ['show', baseline + ':' + file],
    { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 30e6 })]));
}
function previous() { return JSON.parse(read(previousPath).toString('utf8')).fullRepository; }
function manifestGuard(prior) {
  assert.equal(prior.manifest.length, 227);
  assert.equal(sha(JSON.stringify(prior.manifest)), '871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96');
  assert.ok(prior.manifest.every(file => !protectedPaths.has(file)));
  assert.equal(new Set(prior.manifest).size, 227);
}
function childBootstrap(sources = {}, body, gitShowBuffer = false) {
  // The exact baseline override is entirely in memory; the current worktree is untouched.
  return `'use strict';const fs=require('fs'),path=require('path'),Module=require('module');
const root=${JSON.stringify(root)},sources=${JSON.stringify(sources)},protectedPaths=new Set(${JSON.stringify([...protectedPaths])});
function guard(file){const relative=path.relative(root,path.resolve(String(file))).replace(/\\\\/g,'/');
if(protectedPaths.has(relative))throw Error('Protected path cannot be read: '+relative);return path.resolve(String(file));}
const read=fs.readFileSync;fs.readFileSync=function(file,options){const absolute=guard(file),source=path.dirname(absolute)===root?sources[path.basename(absolute)]:undefined;
if(source!==undefined)return typeof options==='string'||options?.encoding?source:Buffer.from(source);return read.apply(this,arguments);};
const loader=Module._extensions['.js'];Module._extensions['.js']=function(module,file){guard(file);
const source=path.dirname(file)===root?sources[path.basename(file)]:undefined;
if(source!==undefined)return module._compile(source,file);return loader(module,file);};
${gitShowBuffer ? `const cp=require('child_process'),originalExecFileSync=cp.execFileSync;
cp.execFileSync=function(command,args,options){if(command==='git'&&args?.[0]==='show'&&options&&typeof options==='object'&&options.maxBuffer===undefined)
return originalExecFileSync.call(this,command,args,{...options,maxBuffer:30000000,windowsHide:true});return originalExecFileSync.apply(this,arguments);};` : ''}
${body}`;
}
function runChild(code, label, timeoutMs = 600000) {
  return new Promise(resolve => {
    const started = Date.now(), child = spawn(process.execPath, ['-'], { cwd: root, windowsHide: true, env: process.env });
    let stdout = '', stderr = '', timedOut = false, error = null;
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', value => { error = value.message; });
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolve({ label, exitCode, signal, error, timedOut, durationMs: Date.now() - started,
        stdout, stderr, outputSha256: sha(stdout + stderr) });
    });
    child.stdin.on('error', value => { if (!error) error = value.message; });
    child.stdin.end(code);
  });
}
async function runSuite(file, sources = {}, args = []) {
  if (protectedPaths.has(file)) throw Error('Protected suite');
  const sourceSha256 = sha(read(file));
  const code = childBootstrap(sources, `const file=path.resolve(root,${JSON.stringify(file)});
process.argv=[process.execPath,file,...${JSON.stringify(args)}];Module._load(file,null,true);`, finalManifest);
  const result = { file, sourceSha256, ...await runChild(code, file) };
  console.log((result.exitCode === 0 ? 'PASS ' : 'FAIL ') + file + ' (' + result.durationMs + ' ms)');
  return result;
}
async function pool(files) {
  const results = new Array(files.length); let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < files.length) { const index = cursor++; results[index] = await runSuite(files[index]); }
  }));
  return results;
}
const labels = { SS: '\u6e38\u64ca\u624b', '2B': '\u4e8c\u58d8\u624b', '3B': '\u4e09\u58d8\u624b', '1B': '\u4e00\u58d8\u624b' };
const seeds = Array.from({ length: 8 }, (_, index) => 77001 + index);
const observer = String.raw`
var sprint5Observation={rng:[],publicSamples:[],physical:[],transitions:[],settlements:[]};
function sprint5State(m){return JSON.parse(JSON.stringify({id:m.id,inning:m.inning,half:m.half,outs:m.outs,
  scores:m.scores,runners:m.runners,currentBatter:m.currentBatter,simulationCursor:m.simulationCursor,
  homeBattingOrderIndex:m.homeBattingOrderIndex,awayBattingOrderIndex:m.awayBattingOrderIndex,
  battingOrderIndices:m.battingOrderIndices,simulationPhase:m.simulationPhase}));}
var sprint5Random=nextHighSchoolMatchSimulationRandom;
nextHighSchoolMatchSimulationRandom=function(...args){const value=sprint5Random(...args);sprint5Observation.rng.push(value);return value;};
var sprint5Choice=chooseHighSchoolYearOneMatchMoment;
chooseHighSchoolYearOneMatchMoment=function(...args){const before=sprint5State(player.highSchoolMatch);
  if(typeof args[2]==='function'){const original=args[2];args[2]=function(){const value=original();sprint5Observation.publicSamples.push({decision:args[0],momentId:args[1],value});return value;};}
  const result=sprint5Choice(...args);sprint5Observation.transitions.push({owner:'choice',before,after:sprint5State(player.highSchoolMatch)});return result;};
var sprint5Handoff=ensureHighSchoolOrdinaryGroundBallInPlayHandoff;
ensureHighSchoolOrdinaryGroundBallInPlayHandoff=function(m,...args){const result=sprint5Handoff(m,...args);
  const truth=m.ordinaryDefensivePlateAppearanceState?.battedBallPhysicalTruth;if(truth)sprint5Observation.physical.push(JSON.parse(JSON.stringify(truth)));return result;};
var sprint5Playback=advanceHighSchoolMatchPlaybackStep;
advanceHighSchoolMatchPlaybackStep=function(m=player.highSchoolMatch,...args){const before=sprint5State(m),result=sprint5Playback(m,...args);
  sprint5Observation.transitions.push({owner:'playback',before,after:sprint5State(m)});return result;};
var sprint5Apply=applyHighSchoolDefensiveSettlementFacts;
applyHighSchoolDefensiveSettlementFacts=function(m,facts,...args){const before=sprint5State(m),result=sprint5Apply(m,facts,...args);
  sprint5Observation.settlements.push({before,after:sprint5State(m),identity:facts.identity,outsBefore:facts.outsBefore,outsAfter:facts.outsAfter,
    baseChanges:facts.baseChanges,runChanges:facts.runChanges,runnerMovement:facts.runnerMovement,thirdOut:facts.thirdOut});return result;};
`;
function recordProjection(match) {
  const pa = match.simulationLog.filter(event => event.type === 'plateAppearance');
  return { score: match.scores, totals: match.gameRecord.totals, playerLines: match.gameRecord.playerLines,
    PA: pa.map(event => ({ identity: event.id || event.sequence, batterId: event.batterId, result: event.result,
      inning: event.inning, half: event.half })), gameRecord: match.gameRecord };
}
function rawExecutionProjection(match) {
  const events = [...new Map(match.simulationLog.filter(event => event.actionFacts?.physicalIdentity)
    .map(event => [event.actionFacts.playIdentity, event])).values()];
  return events.map(event => ({ playIdentity: event.actionFacts.playIdentity, physicalIdentity: event.actionFacts.physicalIdentity,
    initialRoute: event.initialRoute || event.routeId, executionSample: event.executionSample,
    actions: event.actionFacts.actions.map(action => ({ identity: action.identity, actorId: action.actorId, actorPosition: action.actorPosition,
      type: action.type, status: action.status, targetBase: action.targetBase, receiverId: action.receiverId, runnerId: action.runnerId,
      dependsOn: action.dependsOn, sample: action.provenance?.sample })),
    retirements: (event.defensiveAttribution?.retirements || []).map(retirement => ({ runnerId: retirement.runnerId,
      targetBase: retirement.targetBase, outType: retirement.outType, sequence: retirement.sequence,
      forceStateAtRetirement: retirement.forceStateAtRetirement, forceTargetsAfter: retirement.forceTargetsAfter })),
    outs: event.outsCreated, runs: event.runsAllowed, timing: event.timingResolution,
    playerStages: event.playerLeg, teammateStages: event.teammateLeg }));
}
function runPlaybackChild(positions = Object.keys(labels), fixedSeeds = seeds, wrapped = true) {
  const { makeContext } = require('./high-school-career-test-context.js');
  const rows = [];
  for (const position of positions) {
    const c = makeContext();
    if (wrapped) c.run(observer);
    for (const seed of fixedSeeds) {
      if (wrapped) c.run('sprint5Observation={rng:[],publicSamples:[],physical:[],transitions:[],settlements:[]};');
      c.run('careerFixture(' + JSON.stringify(labels[position]) + ',"starter",' + seed + ');choose("critical_offseason",1);playCareerMatchToEnd();');
      const match = c.json('player.highSchoolMatch');
      assert.equal(match.completed, true); assert.equal(match.gameRecord.status, 'final');
      assert.deepEqual(match.gameRecord.result.finalScore, match.scores);
      assert.deepEqual(c.json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'), []);
      assert.deepEqual(c.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'), []);
      const expected = c.json('normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch');
      c.run('saveGame();player=createInitialPlayer("Sprint 5 cold reload");loadGame();');
      const reloaded = c.json('player.highSchoolMatch'); assert.deepEqual(reloaded, expected);
      const execution = { finalState: { inning: match.inning, half: match.half, outs: match.outs, scores: match.scores,
        runners: match.runners, currentBatter: match.currentBatter, simulationCursor: match.simulationCursor },
        rawPlays: rawExecutionProjection(match), ...(wrapped ? { observation: c.json('sprint5Observation') } : {}) };
      rows.push({ position, seed, completed: true, scoreAndIntegrityEqual: true, reloadEqual: true,
        execution, executionSha256: sha(JSON.stringify(execution)), record: recordProjection(match),
        fullMatchSha256: sha(JSON.stringify(match)), gameRecordSha256: sha(JSON.stringify(match.gameRecord)),
        reloadSha256: sha(JSON.stringify(reloaded)) });
    }
  }
  console.log('SPRINT5_NORMAL_PLAYBACK ' + JSON.stringify(rows));
}
function differences(before, after, prefix = '', result = []) {
  if (JSON.stringify(before) === JSON.stringify(after)) return result;
  if (before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) differences(before[key], after[key], prefix ? prefix + '.' + key : key, result);
  } else result.push({ path: prefix, before, after });
  return result;
}
async function compare() {
  baselineGuard();
  const evidence = JSON.parse(read(path.relative(root, comparisonOutput)).toString('utf8'));
  const before = sourceHashes(), sources = baselineSources();
  const marker = 'SPRINT5_NORMAL_PLAYBACK ';
  const rowsFor = async (label, source, fixedSeeds = seeds, wrapped = true) => {
    const code = childBootstrap(source, `require(${JSON.stringify(__filename)}).runPlaybackChild(undefined,${JSON.stringify(fixedSeeds)},${wrapped});`);
    const child = await runChild(code, label);
    if (child.exitCode !== 0 || child.error || child.timedOut) throw Error(label + ': ' + child.stderr);
    const line = child.stdout.split(/\r?\n/).find(value => value.startsWith(marker));
    if (!line) throw Error(label + ': no playback evidence');
    return { rows: JSON.parse(line.slice(marker.length)), durationMs: child.durationMs,
      stdoutSha256: sha(child.stdout), stderr: child.stderr, exitCode: child.exitCode };
  };
  evidence.startedAt = new Date().toISOString(); evidence.sourceSha256 = before;
  evidence.exactBaseline = await rowsFor('exact-f16', sources);
  evidence.current = await rowsFor('current', {});
  evidence.comparisons = evidence.exactBaseline.rows.map((old, index) => {
    const now = evidence.current.rows[index];
    assert.equal(old.position, now.position); assert.equal(old.seed, now.seed);
    const executionChanges = differences(old.execution, now.execution);
    const recordChanges = differences(old.record, now.record);
    return { position: old.position, seed: old.seed, executionEqual: executionChanges.length === 0,
      executionChanges, recordEqual: recordChanges.length === 0, recordChanges,
      physicalSamplesEqual: JSON.stringify(old.execution.observation.physical) === JSON.stringify(now.execution.observation.physical),
      matchRngEqual: JSON.stringify(old.execution.observation.rng) === JSON.stringify(now.execution.observation.rng),
      publicSamplesEqual: JSON.stringify(old.execution.observation.publicSamples) === JSON.stringify(now.execution.observation.publicSamples),
      transitionsEqual: JSON.stringify(old.execution.observation.transitions) === JSON.stringify(now.execution.observation.transitions),
      settlementsEqual: JSON.stringify(old.execution.observation.settlements) === JSON.stringify(now.execution.observation.settlements) };
  });
  // Eight current unwrapped games check the observer did not change full match/record/cold reload.
  evidence.unwrappedCurrent = await rowsFor('current-unwrapped', {}, seeds.slice(0, 2), false);
  evidence.observerNeutrality = evidence.unwrappedCurrent.rows.map(row => {
    const on = evidence.current.rows.find(value => value.position === row.position && value.seed === row.seed);
    return { position: row.position, seed: row.seed, fullMatchEqual: row.fullMatchSha256 === on.fullMatchSha256,
      recordEqual: row.gameRecordSha256 === on.gameRecordSha256, reloadEqual: row.reloadSha256 === on.reloadSha256,
      finalStateEqual: JSON.stringify(row.execution.finalState) === JSON.stringify(on.execution.finalState) };
  });
  evidence.finalSourceSha256 = sourceHashes();
  evidence.sourcesUnchangedDuringComparison = JSON.stringify(before) === JSON.stringify(evidence.finalSourceSha256);
  evidence.finishedAt = new Date().toISOString();
  evidence.status = 'completed';
  evidence.summary = { pairedGames: evidence.comparisons.length,
    executionUnchanged: evidence.comparisons.every(row => row.executionEqual),
    recordChangedGames: evidence.comparisons.filter(row => !row.recordEqual).length,
    observerNeutral: evidence.observerNeutrality.every(row => row.fullMatchEqual && row.recordEqual && row.reloadEqual && row.finalStateEqual),
    sourcesUnchanged: evidence.sourcesUnchangedDuringComparison };
  evidence.recordChangeDisposition = 'Record differences are saved separately for scorer review; they are not treated as execution changes or automatically accepted.';
  save(comparisonOutput, evidence); console.log('COMPARISON ' + JSON.stringify(evidence.summary));
  if (!evidence.summary.executionUnchanged || !evidence.summary.observerNeutral || !evidence.summary.sourcesUnchanged) process.exitCode = 1;
}
async function full() {
  baselineGuard(); const prior = previous(); manifestGuard(prior);
  if (fs.existsSync(output)) throw Error('Full 227 evidence already exists; do not rerun the manifest without explicit review.');
  const sourceSha256 = sourceHashes();
  const validationInputFiles = [...prior.manifest, 'tests/infield-scorer-recovery-integrity-repair-test.js',
    'tests/infield-scorer-sprint-5-validation-runner.cjs', 'tests/pitch-production-source-scope.cjs'];
  const validationInputsSha256 = () => Object.fromEntries(validationInputFiles.map(file => [file, sha(read(file))]));
  const evidence = { baseline, startedAt: new Date().toISOString(), node: process.version, platform: process.platform,
    manifestOrigin: previousPath + ':fullRepository', manifestSha256: sha(JSON.stringify(prior.manifest)),
    protectedPaths: [...protectedPaths], sourceSha256, validationInputsSha256: validationInputsSha256(), initialStatus: git(['status', '--short']),
    methodology: 'Four hidden Node child processes; exact saved manifest/order; 600000 ms timeout; exact baseline replay via in-memory git-show sources.' };
  save(output, evidence);
  evidence.focused = await runSuite('tests/infield-scorer-recovery-integrity-repair-test.js', {}, [finalManifest ? '--capture-green-final' : '--capture-green']); save(output, evidence);
  if(finalManifest) {
    evidence.previousValidation = {file:'docs/infield-scorer-recovery-sprint-5-validation.json',
      disposition:'Prior stable snapshot retained: 222/227 with three historical debt and two git-show ENOBUFS harness failures. Later PA semantic review found an untested non-hit FC regression; this final manifest validates that repair.'};
    evidence.actualForceOnlyValidation = {file:'docs/infield-scorer-recovery-sprint-5-validation-force-actual-only.json',
      disposition:'Intermediate 224/227 / focused 75 snapshot retained; later prevented-force review found the second OBR 9.05(b)(1) boundary. Final focused 79 plus final manifest include both actual and would-be force non-hit classifications.'};
    evidence.gitShowBufferCompatibility = {enabled:true,bytes:30000000,onlyWhen:'git show invoked without an explicit maxBuffer',
      exactBaselineScriptBytes:Buffer.byteLength(git(['show',baseline+':script.js']),'utf8'),defaultNodeBytes:1048576,
      assertionsUnchanged:true,productionUnchangedByShim:true};
  }
  evidence.fullRepository = { manifest: prior.manifest, startedAt: new Date().toISOString(), results: await pool(prior.manifest) };
  const result = evidence.fullRepository;
  result.passed = result.results.filter(row => row.exitCode === 0).length; result.failed = result.results.length - result.passed;
  result.finishedAt = new Date().toISOString();
  result.previouslyPassingNowFailing = result.results.filter(row => row.exitCode !== 0 && prior.results.find(old => old.file === row.file)?.exitCode === 0).map(row => row.file);
  result.testHashesUnchanged = result.results.every(row => row.sourceSha256 === prior.results.find(old => old.file === row.file)?.sourceSha256);
  result.testSourceChanges = result.results.filter(row => row.sourceSha256 !== prior.results.find(old => old.file === row.file)?.sourceSha256)
    .map(row => ({file: row.file, beforeSha256: prior.results.find(old => old.file === row.file)?.sourceSha256,
      afterSha256: row.sourceSha256, review: reviewedTestChanges[row.file] || null, diff: git(['diff', baseline, '--', row.file])}));
  result.unreviewedTestHashesUnchanged = result.testSourceChanges.every(row => row.review);
  evidence.sharedSourceGuardReview = {file: 'tests/pitch-production-source-scope.cjs',
    reason: 'Whitelist only the exact scorer-owner metadata additions in the two shared PA adapters; retain 95 protected functions / 25 globals / wiring freeze; focused negative probes reject changing authority or broadening admission.',
    sourceSha256: sha(read('tests/pitch-production-source-scope.cjs')), diff: git(['diff', baseline, '--', 'tests/pitch-production-source-scope.cjs'])};
  save(output, evidence);
  const exact = baselineSources(); evidence.baselineReproduction = [];
  for (const row of result.results.filter(value => value.exitCode !== 0)) {
    evidence.baselineReproduction.push({ baseline, ...await runSuite(row.file, exact) }); save(output, evidence);
  }
  const debtSignatures = {
    'tests/ability-performance-gradient-test.js': 'AssertionError [ERR_ASSERTION]: Low tier can have a multi-hit game',
    'tests/baseball-match-foundation-2-2-2-test.js': 'AssertionError [ERR_ASSERTION]: 36. full match',
    'tests/high-school-year-one-opportunity-two-integration-test.js': 'ReferenceError: DefensiveDecisionThrowFoundation is not defined'
  };
  evidence.baselineDebtVerification = Object.entries(debtSignatures).map(([file, signature]) => {
    const now = result.results.find(row => row.file === file), replay = evidence.baselineReproduction.find(row => row.file === file), old = prior.results.find(row => row.file === file);
    return { file, signature, currentExitCode: now?.exitCode, exactBaselineExitCode: replay?.exitCode,
      testHashUnchanged: now?.sourceSha256 === old?.sourceSha256 && now?.sourceSha256 === replay?.sourceSha256,
      sameFailure: now?.exitCode === 1 && replay?.exitCode === 1 && old?.exitCode === 1
        && now.stderr.includes(signature) && replay.stderr.includes(signature) && old.stderr.includes(signature) };
  });
  evidence.finalSourceSha256 = sourceHashes(); evidence.sourcesUnchangedDuringValidation = JSON.stringify(sourceSha256) === JSON.stringify(evidence.finalSourceSha256);
  evidence.finalValidationInputsSha256 = validationInputsSha256();
  evidence.validationInputsUnchanged = JSON.stringify(evidence.validationInputsSha256) === JSON.stringify(evidence.finalValidationInputsSha256);
  evidence.finishedAt = new Date().toISOString(); save(output, evidence);
  console.log('FULL_SUMMARY ' + JSON.stringify({ passed: result.passed, failed: result.failed, newFailures: result.previouslyPassingNowFailing,
    focusedExitCode: evidence.focused.exitCode, testHashesUnchanged: result.testHashesUnchanged,
    unreviewedTestHashesUnchanged: result.unreviewedTestHashesUnchanged, reviewedTestChanges: result.testSourceChanges.map(row => row.file),
    debtVerified: evidence.baselineDebtVerification.every(row => row.sameFailure && row.testHashUnchanged), sourcesUnchanged: evidence.sourcesUnchangedDuringValidation }));
  if (evidence.focused.exitCode !== 0 || result.previouslyPassingNowFailing.length || !result.testHashesUnchanged
    || !evidence.sourcesUnchangedDuringValidation || !evidence.validationInputsUnchanged || evidence.baselineDebtVerification.some(row => !row.sameFailure || !row.testHashUnchanged)
    || result.results.some(row => row.timedOut || row.error)) process.exitCode = 1;
}
async function representative() {
  baselineGuard();
  const evidence = JSON.parse(read(path.relative(root, comparisonOutput)).toString('utf8'));
  const files = [
    'tests/match-full-game-record-test.js',
    'tests/ss-defensive-production-integration-test.js',
    'tests/defensive-decision-throw-production-integration-test.js',
    'tests/shared-infield-contract-2b-production-integration-test.js',
    'tests/third-base-ground-production-integration-test.js',
    'tests/first-base-receive-active-ground-production-integration-test.js',
    'tests/force-advancement-foundation-test.js',
    'tests/defensive-runner-throw-settlement-foundation-test.js',
    'tests/match-experience-development-foundation-v1-test.js',
    'tests/ground-defensive-decision-identity-production-integration-test.js',
    'tests/ground-ball-defensive-settlement-lifecycle-regression-test.js',
    'tests/career-save-admission-test.js',
    'tests/pitch-production-source-scope-test.js'
  ];
  const sourceSha256 = sourceHashes();
  evidence.representativeRegression = { startedAt: new Date().toISOString(), files, sourceSha256,
    results: await pool(files), outputOwnership: 'Saved only in this Sprint 5 execution-comparison evidence.' };
  const run = evidence.representativeRegression;
  run.finalSourceSha256 = sourceHashes(); run.sourcesUnchanged = JSON.stringify(sourceSha256) === JSON.stringify(run.finalSourceSha256);
  run.passed = run.results.filter(result => result.exitCode === 0).length; run.failed = run.results.length - run.passed;
  run.finishedAt = new Date().toISOString(); save(comparisonOutput, evidence);
  console.log('REPRESENTATIVE_SUMMARY ' + JSON.stringify({ passed: run.passed, failed: run.failed, sourcesUnchanged: run.sourcesUnchanged,
    failures: run.results.filter(result => result.exitCode !== 0).map(result => result.file) }));
  if (run.failed || !run.sourcesUnchanged || run.results.some(result => result.error || result.timedOut)) process.exitCode = 1;
}
async function main() {
  const mode = process.argv[2];
  if (mode === 'prepare') {
    baselineGuard(); const prior = previous(); manifestGuard(prior);
    if (fs.existsSync(comparisonOutput)) throw Error('Comparison declaration already exists');
    save(comparisonOutput, { baseline, declaredAt: new Date().toISOString(), status: 'declared-not-executed',
      predeclared: { positions: Object.keys(labels), seeds, gamesPerPosition: seeds.length, pairedGames: 32,
        initialization: 'Existing careerFixture(position, starter, seed), skills=12; formal Opportunity may choose bench/substitute.',
        policy: 'Existing playCareerMatchToEnd first legal choice with owned public sample .62.',
        noInMatchOverrides: true, noExtraPA: true, observerPilot: 'Current unwrapped comparison, seeds77001-77002 for all four positions.',
        measurements: ['physical truth and owned samples', 'match RNG values/count', 'public execution sample values/count',
          'every playback/decision outs/bases/runs/cursor transition', 'settlement facts', 'actual actions/retirements', 'record differences separately', 'cold reload'] },
      manifestSha256: sha(JSON.stringify(prior.manifest)), originalManifestCount: prior.manifest.length,
      protectedPaths: [...protectedPaths] });
    console.log('PREPARED Sprint 5 fixed playback comparison and original 227 manifest'); return;
  }
  if (mode === 'compare') return compare();
  if (mode === 'representative') return representative();
  if (mode === 'full' || mode === 'full-final') return full();
  throw Error('Choose prepare, compare, representative, full, or full-final. Each manifest evidence is retained and cannot be overwritten.');
}
module.exports = { runPlaybackChild };
if (require.main === module) main().catch(error => { console.error(error.stack); process.exitCode = 1; });
