"use strict";
const fs = require("node:fs"), path = require("node:path"), cp = require("node:child_process"), crypto = require("node:crypto"), assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."), baseline = "ab3117653945de0b7013636187c446276a96e634";
const prefix = "docs/receiver-execution-v2-sprint-10a3b-r3-";
const previous = JSON.parse(fs.readFileSync(path.join(root, "docs/receiver-execution-v2-sprint-10a3b-r2-baseline-evidence.json"), "utf8"));
const protectedPaths = new Set(Object.keys(previous.protectedMetadata)), reads = new Set();
const hash = x => crypto.createHash("sha256").update(x).digest("hex");
const git = (...args) => cp.execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 30000000 });
function read(p) { assert(!protectedPaths.has(p), "Protected content prohibited"); reads.add(p); return fs.readFileSync(path.join(root, p)); }
function json(p) { return JSON.parse(read(p)); }
function reserve(label) { const file = prefix + label + "-evidence.json"; assert(!fs.existsSync(path.join(root, file)), "Existing capture: " + file); return file; }
function capture(label, data) { const file = reserve(label); fs.writeFileSync(path.join(root, file), JSON.stringify({ sprint: "10A.3b-R3", baseline, createdAt: new Date().toISOString(), node: process.version, ...data, readPaths: [...reads] }, null, 2) + "\n", { flag: "wx" }); return file; }
function gitState() { return { branch: git("branch", "--show-current").trim(), head: git("rev-parse", "HEAD").trim(), originMain: git("rev-parse", "origin/main").trim(), index: git("diff", "--cached", "--name-only").trim(), status: git("status", "--short") }; }
function metadata() { return Object.fromEntries([...protectedPaths].map(p => { const s = fs.statSync(path.join(root, p)); return [p, { size: s.size, mtimeMs: s.mtimeMs }]; })); }
function start() {
  reserve("baseline"); const state = gitState(); assert.equal(state.head, baseline); assert.equal(state.originMain, baseline); assert.equal(state.index, "");
  const files = git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(p => p && !protectedPaths.has(p) && !p.includes("-10a3b-r3-"));
  const hashes = Object.fromEntries(files.map(p => [p, hash(read(p))]));
  for (const [p, h] of Object.entries(previous.hashes)) assert.equal(hashes[p], h, "R2 baseline changed: " + p);
  capture("baseline", { git: state, hashes, protectedMetadata: metadata(), protectedContentReadOrHashed: false });
  console.log(JSON.stringify({ baselineFiles: files.length, protectedPaths: protectedPaths.size, git: state }));
}
function integrity() {
  const b = json(prefix + "baseline-evidence.json"), changed = [];
  for (const [p, h] of Object.entries(b.hashes)) if (hash(read(p)) !== h) changed.push(p);
  assert(changed.every(p => p === "receiver-source-snapshot.js" || p === "script.js"), "Unauthorized existing file change: " + changed);
  const state = gitState(); assert.equal(state.head, baseline); assert.equal(state.originMain, baseline); assert.equal(state.index, ""); assert.deepEqual(metadata(), b.protectedMetadata);
  return { changedExistingPaths: changed, preservedHashCount: Object.keys(b.hashes).length - changed.length, protectedMetadataUnchanged: true, protectedContentReadOrHashed: false, git: state };
}
const wrapper = "const cp=require('child_process'),original=cp.execFileSync;cp.execFileSync=function(command,args,opts){if(command==='git'&&args?.[0]==='show'&&opts&&typeof opts==='object'&&opts.maxBuffer===undefined)return original.call(this,command,args,{...opts,maxBuffer:30e6});return original.apply(this,arguments);};require(process.argv[1]);";
function runSuite(file, full = false, timeoutMs = 120000) {
  assert(/^tests\/[A-Za-z0-9_-]+\.(js|cjs)$/.test(file) && !protectedPaths.has(file));
  const args = full ? ["-e", wrapper, path.resolve(root, file)] : [file], maxBuffer = full ? 30000000 : 16000000, start = process.hrtime.bigint();
  const r = cp.spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", windowsHide: true, timeout: full ? 180000 : timeoutMs, maxBuffer });
  return { file, command: [process.execPath, ...args], timeoutMs: full ? 180000 : timeoutMs, maxBuffer, sourceHash: hash(read(file)), elapsedMs: Number(process.hrtime.bigint() - start) / 1e6,
    exitCode: r.status, signal: r.signal, error: r.error ? { code: r.error.code, message: r.error.message } : null, stdout: r.stdout || "", stderr: r.stderr || "" };
}
function diagnose() {
  reserve("root-cause"); integrity();
  // Only the isolated VM's same() is observed; production bytes remain untouched.
  const originalRead = fs.readFileSync, oldSource = read("receiver-source-snapshot.js").toString("utf8");
  const needle = "same = (a, b) => canonical(a) === canonical(b)";
  assert(oldSource.includes(needle));
  const observed = oldSource.replace(needle, "same = (a, b) => { try { return canonical(a) === canonical(b); } catch (error) { globalThis.r3FailedEquality={leftType:typeof a,rightType:typeof b,leftPresent:a!==undefined,rightPresent:b!==undefined,error:error.message}; throw error; } }");
  let h, failure;
  try {
    fs.readFileSync = function(file, options) { if (path.resolve(String(file)) === path.join(root, "receiver-source-snapshot.js")) return options ? observed : Buffer.from(observed); return originalRead.apply(this, arguments); };
    h = require("./ability-performance-correlation-audit.cjs").createHarness();
  } finally { fs.readFileSync = originalRead; }
  h.ctx.run(`var r3OriginalValidate=ReceiverSourceSnapshot.validateMatch;
    ReceiverSourceSnapshot={...ReceiverSourceSnapshot,validateMatch:function(match){try{return r3OriginalValidate(match)}catch(error){
      var s=match.groundBallInPlayState,a=match.receiverSourceAdmission,summary=match.lastClosedSituationSummary;
      globalThis.r3Operands={current:{playId:s?.identity,physicalIdentity:s?.physicalTruth?.identity,paIdentity:match.ordinaryDefensivePlateAppearanceState?.paIdentity,contactId:match.ordinaryDefensivePlateAppearanceState?.battedBallPhysicalTruth?.identity,
        sourceFormatPresent:Object.hasOwn(s||{},'receiverSourceFormatVersion'),sourceFormatType:typeof s?.receiverSourceFormatVersion,sourceFormatVersion:s?.receiverSourceFormatVersion??null,
        snapshotPresent:Object.hasOwn(s||{},'receiverSourceSnapshot'),pinPresent:Object.hasOwn(s||{},'receiverSourcePin'),bindingPresent:Object.hasOwn(s||{},'receiverSourceExecutionBinding'),bindingType:typeof s?.receiverSourceExecutionBinding,executionPresent:!!s?.shortstopExecution,settlementApplied:s?.settlementApplied},
        archivedAdmission:{physical:a?.snapshot?.body?.physical,formatVersion:a?.formatVersion},matchFormat:match.receiverSourceFormatVersion,
        summary:{physical:summary?.receiverSourcePin?.physical,lifecycleState:summary?.lifecycleState,bindingPresent:Object.hasOwn(summary||{},'receiverSourceExecutionBinding'),bindingType:typeof summary?.receiverSourceExecutionBinding},
        active:{sourcePhysicalStateRef:match.activeSituation?.sourcePhysicalStateRef,lifecycleState:match.activeSituation?.lifecycleState},failedEquality:globalThis.r3FailedEquality,error:error.message,stack:error.stack};throw error;}}};`);
  const attempts = [{ value: 8, seed: 1 }, { value: 8, seed: 1 }, { value: 8, seed: 1, observe: false }];
  for (let seed = 1; seed <= 20; seed++) attempts.push({ value: 8, seed }, { value: 16, seed });
  let failingFixture;
  for (const spec of attempts) { try { h.play("baseballSkills.batting", spec.value, spec.seed, "player", spec.observe !== false); } catch (e) { failure = { message: e.message, stack: e.stack }; failingFixture = spec; break; } }
  assert.equal(failure?.message, "non-JSON metadata"); const operands = h.ctx.json("r3Operands");
  assert.equal(operands.failedEquality.rightType, "undefined"); assert.notEqual(operands.current.playId, operands.archivedAdmission.physical.playId);
  assert.equal(operands.current.bindingPresent, false); assert.equal(operands.summary.bindingPresent, true);
  const replay = h.ctx.json(`({id:player.highSchoolMatch.id,receiverSourceFormatVersion:player.highSchoolMatch.receiverSourceFormatVersion,receiverSourceAdmission:player.highSchoolMatch.receiverSourceAdmission,
    groundBallInPlayState:{identity:player.highSchoolMatch.groundBallInPlayState.identity,physicalTruth:{identity:player.highSchoolMatch.groundBallInPlayState.physicalTruth.identity},shortstopExecution:{},settlementApplied:player.highSchoolMatch.groundBallInPlayState.settlementApplied},
    ordinaryDefensivePlateAppearanceState:{paIdentity:player.highSchoolMatch.ordinaryDefensivePlateAppearanceState.paIdentity,battedBallPhysicalTruth:{identity:player.highSchoolMatch.ordinaryDefensivePlateAppearanceState.battedBallPhysicalTruth.identity}},
    activeSituation:{sourcePhysicalStateRef:player.highSchoolMatch.activeSituation.sourcePhysicalStateRef,lifecycleState:player.highSchoolMatch.activeSituation.lifecycleState},
    lastClosedSituationSummary:{situationId:player.highSchoolMatch.lastClosedSituationSummary.situationId,lifecycleState:player.highSchoolMatch.lastClosedSituationSummary.lifecycleState,outsBefore:player.highSchoolMatch.lastClosedSituationSummary.outsBefore,receiverSourcePin:player.highSchoolMatch.lastClosedSituationSummary.receiverSourcePin,receiverSourceExecutionBinding:player.highSchoolMatch.lastClosedSituationSummary.receiverSourceExecutionBinding}})`);
  capture("reproduction", { metadataReplay: replay, note: "Only identity, source metadata, presence and lifecycle required for validator replay; no Match/gameRecord dump.", originalSourceHash: hash(oldSource) });
  capture("root-cause", { originalSourceHash: hash(oldSource), fixture: { field: "baseballSkills.batting", ...failingFixture }, operands, failure, classification: "cross-play: archived source-only closed play versus current unpinned Legacy execution", productionBytesChanged: false, safety: integrity() });
  console.log(JSON.stringify(operands));
}
module.exports = { root, baseline, prefix, read, json, hash, capture, reserve, integrity, runSuite, wrapper, protectedPaths, git };
const sourceFiles = ["index.html", "script.js", "save.js", "match-situation-lifecycle.js", "receiver-source-snapshot.js"];
function sourceHashes() { return Object.fromEntries(sourceFiles.map(p => [p, hash(read(p))])); }
function focusedSuite(file) {
  const start = process.hrtime.bigint(); let result, error = null;
  try { result = require(path.join(root, file)).run(); } catch (e) { error = { message: e.message, stack: e.stack }; }
  const summary = result?.summary || (result ? { total: result.total, passed: result.passed, failed: result.failed } : { total: 0, passed: 0, failed: 1 });
  return { file, sourceHash: hash(read(file)), elapsedMs: Number(process.hrtime.bigint() - start) / 1e6, summary, error,
    checks: result?.checks, historicalCompatibility: result?.historicalCompatibility, rows: result?.rows, candidateExecutionCalls: result?.candidateExecutionCalls, runtimeEnabled: result?.runtimeEnabled };
}
function gates() {
  const labels = ["focused", "gradient", "career-save", "production-focused", "save-focused", "legacy", "related", "compatibility", "first-base-current", "gates"];
  labels.forEach(reserve); integrity(); const frozenSourceHashes = sourceHashes();
  function save(label, data) { assert.deepEqual(sourceHashes(), frozenSourceHashes, "Source changed after final freeze"); capture(label, { ...data, frozenSourceHashes }); }
  function fail(label, data) { save(label, data); capture("gates", { passed: false, stoppedAt: label, frozenSourceHashes, safety: integrity() }); process.exitCode = 1; return false; }
  const focused = focusedSuite("tests/receiver-execution-v2-sprint-10a3b-r3-guard-test.cjs");
  if (focused.summary.failed || focused.error) return fail("focused", { result: focused }); save("focused", { result: focused }); console.log(JSON.stringify({ gate: "R3 focused", summary: focused.summary }));
  const gradient = runSuite("tests/ability-performance-gradient-test.js"), old = json("docs/infield-legacy-receiver-model-sprint-6-validation-final.json"), debt = old.debtVerification.find(x => x.file === gradient.file);
  gradient.originalDebtReproduced = gradient.exitCode === 1 && !gradient.error && gradient.stderr.includes(debt.signature) && !gradient.stderr.includes("non-JSON metadata");
  gradient.baselineStderr = old.results.find(x => x.file === gradient.file).stderr; gradient.debtSignature = debt.signature;
  if (!gradient.originalDebtReproduced) return fail("gradient", { result: gradient }); save("gradient", { result: gradient }); console.log(JSON.stringify({ gate: "gradient", originalDebtReproduced: true, elapsedMs: gradient.elapsedMs }));
  const career = runSuite("tests/career-save-admission-test.js"); if (career.exitCode !== 0 || career.error) return fail("career-save", { result: career }); save("career-save", { result: career }); console.log(JSON.stringify({ gate: "Career Save", exitCode: career.exitCode }));
  for (const [label, file] of [["production-focused", "tests/receiver-execution-v2-production-snapshot-save-test.cjs"], ["save-focused", "tests/receiver-execution-v2-sprint-10a3b-r1-save-test.cjs"], ["legacy", "tests/receiver-execution-v2-sprint-10a3b-legacy-comparison.cjs"]]) {
    const result = focusedSuite(file); if (result.summary.failed || result.error) return fail(label, { result }); save(label, { result }); console.log(JSON.stringify({ gate: label, summary: result.summary, historical: result.historicalCompatibility?.total }));
  }
  const relatedFiles = ["tests/infield-scorer-recovery-integrity-repair-test.js", "tests/infield-legacy-receiver-scorer-closeout-test.js", "tests/infield-legacy-receiver-model-foundation-test.js", "tests/match-full-game-record-test.js", "tests/ss-defensive-production-integration-test.js", "tests/defensive-decision-throw-production-integration-test.js", "tests/shared-infield-contract-2b-production-integration-test.js", "tests/third-base-ground-production-integration-test.js", "tests/force-advancement-foundation-test.js", "tests/defensive-runner-throw-settlement-foundation-test.js", "tests/match-experience-development-foundation-v1-test.js", "tests/ground-defensive-decision-identity-production-integration-test.js", "tests/ground-ball-defensive-settlement-lifecycle-regression-test.js", "tests/pitch-production-source-scope-test.js", "tests/match-situation-lifecycle-test.js", "tests/ground-settlement-handoff-r2-production-integration-test.js", "tests/force-multi-runner-settlement-production-integration-test.js"];
  const related = []; for (const file of relatedFiles) { const r = runSuite(file); related.push(r); console.log(JSON.stringify({ gate: "related", file, exitCode: r.exitCode, elapsedMs: r.elapsedMs })); if (r.exitCode !== 0 || r.error) return fail("related", { results: related, complete: false }); } save("related", { results: related, complete: true });
  const compatibility = []; for (const file of ["tests/receiver-execution-v2-2-contract-test.cjs", "tests/receiver-execution-v2-pure-contract-test.cjs", "tests/receiver-execution-v2-version-admission-timing-test.cjs", "tests/receiver-execution-v2-source-authority-test.cjs", "tests/receiver-execution-v2-production-source-timing-test.cjs"]) {
    const result = focusedSuite(file); compatibility.push(result); console.log(JSON.stringify({ gate: "compatibility", file, summary: result.summary })); if (result.summary.failed || result.error) return fail("compatibility", { results: compatibility, complete: false });
  } save("compatibility", { results: compatibility, complete: true });
  const firstBase = runSuite("tests/first-base-receive-active-ground-production-integration-test.js", false, 180000);
  const summaryLine = firstBase.stdout.split(/\r?\n/).find(x => x.startsWith('{"suite":"first-base-receive-active-ground-production-integration"')); firstBase.summary = summaryLine ? JSON.parse(summaryLine) : null;
  const r2 = json("docs/receiver-execution-v2-sprint-10a3b-r2-first-base-baseline-evidence.json").result;
  firstBase.completeOutputMatchesR2Baseline = firstBase.stdout === r2.stdout && firstBase.stderr === r2.stderr;
  if (firstBase.exitCode !== 0 || firstBase.error || firstBase.summary?.passed !== 42 || firstBase.summary?.failed !== 0 || !firstBase.completeOutputMatchesR2Baseline) return fail("first-base-current", { result: firstBase });
  save("first-base-current", { result: firstBase, baselineEvidence: "R2 first-base baseline180 (inherited); no new baseline run", testAndHelperUnchanged: hash(read(firstBase.file)) === previous.hashes[firstBase.file] && hash(read("tests/high-school-career-test-context.js")) === previous.hashes["tests/high-school-career-test-context.js"] });
  console.log(JSON.stringify({ gate: "First-base180", summary: firstBase.summary, elapsedMs: firstBase.elapsedMs }));
  capture("gates", { passed: true, frozenSourceHashes, safety: integrity(), order: labels });
}
function full() {
  reserve("full-repository"); const gate = json(prefix + "gates-evidence.json"); assert(gate.passed, "Related gates failed"); assert.deepEqual(sourceHashes(), gate.frozenSourceHashes); integrity();
  const old = json("docs/infield-legacy-receiver-model-sprint-6-validation-final.json"), files = old.files;
  assert.equal(files.length, 227); assert.equal(new Set(files).size, 227); assert.equal(hash(JSON.stringify(files)), "871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96");
  for (const p of files) assert(!protectedPaths.has(p));
  const testHashesBefore = Object.fromEntries(files.map(p => [p, hash(read(p))])), results = [], startedAt = new Date().toISOString();
  for (const [i, file] of files.entries()) {
    const row = runSuite(file, true), prior = old.results.find(x => x.file === file), debt = old.debtVerification.find(x => x.file === file);
    row.baselineExitCode = prior.exitCode; row.debtSignature = debt?.signature || null;
    row.existingDebt = Boolean(debt && row.exitCode === prior.exitCode && !row.error && row.stderr.includes(debt.signature) && (!file.includes("high-school-year-one-opportunity-two") || row.stderr.includes("buildHighSchoolShortstopExecution")));
    row.status = row.error || row.exitCode !== prior.exitCode ? "NEW_REGRESSION" : row.exitCode === 0 ? "PASS" : row.existingDebt ? "EXISTING_DEBT" : "NEW_REGRESSION";
    results.push(row); console.log(JSON.stringify({ index: i + 1, file, exitCode: row.exitCode, status: row.status, elapsedMs: row.elapsedMs, error: row.error }));
    if (row.status === "NEW_REGRESSION") break;
  }
  assert.deepEqual(sourceHashes(), gate.frozenSourceHashes); for (const [p, h] of Object.entries(testHashesBefore)) assert.equal(hash(read(p)), h);
  const complete = results.length === files.length, newRegressions = results.filter(x => x.status === "NEW_REGRESSION").length;
  capture("full-repository", { startedAt, finishedAt: new Date().toISOString(), files, manifestSha256: hash(JSON.stringify(files)), wrapper, timeoutMs: 180000, maxBuffer: 30000000, testHashesBefore, results, complete,
    passed: results.filter(x => x.status === "PASS").length, existingDebt: results.filter(x => x.status === "EXISTING_DEBT").length, newRegressions, notRun: files.slice(results.length), baselineDebt: old.results.filter(x => x.exitCode !== 0), frozenSourceHashes: gate.frozenSourceHashes, safety: integrity() });
  console.log(JSON.stringify({ complete, executed: results.length, newRegressions })); if (!complete || newRegressions) process.exitCode = 1;
}
if (require.main === module) { const mode = process.argv[2]; if (mode === "baseline") start(); else if (mode === "diagnose") diagnose(); else if (mode === "gates") gates(); else if (mode === "full") full();
  else if (mode === "coverage-paths") console.log(JSON.stringify([...new Set([...json("docs/infield-legacy-receiver-model-sprint-6-validation-final.json").files,
    ...[...read("index.html").toString().matchAll(/<script src="([^"]+)"/g)].map(x => x[1]), "tests/high-school-career-test-context.js", "tests/ability-performance-correlation-audit.cjs",
    "tests/receiver-execution-v2-sprint-10a3b-r3-runner.cjs", "tests/receiver-execution-v2-sprint-10a3b-r3-guard-test.cjs", "tests/receiver-execution-v2-sprint-10a3b-r1-save-test.cjs",
    "tests/receiver-execution-v2-production-snapshot-save-test.cjs", "tests/receiver-execution-v2-sprint-10a3b-harness.cjs", "tests/receiver-execution-v2-sprint-10a3b-legacy-comparison.cjs", "tests/receiver-execution-v2-sprint-10a3b-r2-runner.cjs"]) ]));
  else throw Error("Explicit R3 mode required"); }
