"use strict";
// R2 changes only the first-base acceptance policy. Historical runners/captures stay intact.
const fs = require("node:fs"), path = require("node:path"), os = require("node:os"), cp = require("node:child_process"), crypto = require("node:crypto"), assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."), BASELINE = "ab3117653945de0b7013636187c446276a96e634";
const FIRST_BASE = "tests/first-base-receive-active-ground-production-integration-test.js";
const MANIFEST = "docs/infield-legacy-receiver-model-sprint-6-validation-final.json";
const B = JSON.parse(fs.readFileSync(path.join(root, "docs/receiver-execution-v2-sprint-10a3b-r2-baseline-evidence.json"), "utf8"));
const protectedPaths = new Set(Object.keys(B.protectedMetadata)), reads = new Set();
const fullWrapper = "const cp=require('child_process'),original=cp.execFileSync;cp.execFileSync=function(command,args,opts){if(command==='git'&&args?.[0]==='show'&&opts&&typeof opts==='object'&&opts.maxBuffer===undefined)return original.call(this,command,args,{...opts,maxBuffer:30e6});return original.apply(this,arguments);};require(process.argv[1]);";
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
function safePath(file) {
  assert.equal(typeof file, "string");
  const p = file.replace(/\\/g, "/").replace(/^\.\//, "");
  assert(!path.isAbsolute(file) && !/^[A-Za-z]:/.test(p) && !p.split("/").includes("..") && !protectedPaths.has(p), "Unsafe/protected path");
  assert(/^tests\/[A-Za-z0-9_-]+\.(?:js|cjs)$/.test(p), "Explicit test path required"); return p;
}
function policyFor(file, entry) {
  const p = safePath(file); assert(["comparison", "full", "related"].includes(entry), "Unknown entry");
  if (entry === "comparison") assert.equal(p, FIRST_BASE, "Comparison only authorizes first-base");
  // Original S6 full-final already uses180000/30e6. R1 related default120000/16e6 stays unchanged.
  return Object.freeze({ timeoutMs: p === FIRST_BASE ? 180000 : entry === "full" ? 180000 : 120000,
    maxBuffer: entry === "full" ? 30000000 : 16000000, policy: p === FIRST_BASE ? "approved-first-base-180000-v1" : "unchanged-" + entry + "-default" });
}
function commandFor(file, entry) {
  const p = safePath(file); policyFor(p, entry);
  return entry === "full" ? [process.execPath, "-e", fullWrapper, path.resolve(root, p)] : [process.execPath, p];
}
function read(file) { assert(!protectedPaths.has(file), "Protected content"); reads.add(file); return fs.readFileSync(path.join(root, file)); }
function json(file) { return JSON.parse(read(file).toString("utf8")); }
function git(...args) { return cp.execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 30000000 }); }
function capture(label, value) {
  const file = "docs/receiver-execution-v2-sprint-10a3b-r2-" + label + "-evidence.json";
  fs.writeFileSync(path.join(root, file), JSON.stringify({ sprint: "10A.3b-R2", baseline: BASELINE, createdAt: new Date().toISOString(), ...value, readPaths: [...reads] }, null, 2) + "\n", { flag: "wx" }); return file;
}
function validateManifest(files, expected) {
  assert(Array.isArray(files) && Array.isArray(expected)); assert.equal(files.length, 227); assert.equal(new Set(files).size, 227);
  files.forEach(safePath); assert.deepEqual(files, expected, "Original manifest membership/order required"); return true;
}
function summaryOf(stdout) {
  const lines = stdout.trim().split(/\r?\n/); const value = lines.reverse().find(s => s.startsWith('{"suite":"first-base-receive-active-ground-production-integration"'));
  return value ? JSON.parse(value) : null;
}
function environment() { return { platform: process.platform, arch: process.arch, execArgv: process.execArgv,
  NODE_OPTIONS: process.env.NODE_OPTIONS || null, NODE_PATH: process.env.NODE_PATH || null, NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE || null, TZ: process.env.TZ || null }; }
function runSuite(file, entry, cwd = root) {
  const policy = policyFor(file, entry), command = commandFor(file, entry), start = process.hrtime.bigint();
  const result = cp.spawnSync(command[0], command.slice(1), { cwd, encoding: "utf8", windowsHide: true, timeout: policy.timeoutMs, maxBuffer: policy.maxBuffer });
  return { file, entry, command, cwd, nodeExecutable: process.execPath, nodeVersion: process.version, environment: environment(), ...policy,
    elapsedMs: Number(process.hrtime.bigint() - start) / 1e6, exitCode: result.status, signal: result.signal, error: result.error ? { code: result.error.code, message: result.error.message } : null,
    stdout: result.stdout || "", stderr: result.stderr || "", summary: summaryOf(result.stdout || "") };
}
function evaluateRuntimePair(a, b) {
  const checks = [], check = (name, pass) => checks.push({ name, pass: Boolean(pass) }), same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  check("baseline actual exit0,42/42,no error", a.exitCode === 0 && !a.error && a.summary?.passed === 42 && a.summary?.failed === 0);
  check("WIP actual exit0,42/42,no error", b.exitCode === 0 && !b.error && b.summary?.passed === 42 && b.summary?.failed === 0);
  check("approved same180000/16MB", a.timeoutMs === 180000 && b.timeoutMs === 180000 && a.maxBuffer === 16000000 && b.maxBuffer === 16000000);
  check("same Node executable/version", a.nodeExecutable === b.nodeExecutable && a.nodeVersion === b.nodeVersion);
  check("same command/environment", same(a.command, b.command) && same(a.environment, b.environment));
  check("original test/helper bytes equal", same(a.sourceHashes, b.sourceHashes));
  check("complete stdout/stderr parity", a.stdout === b.stdout && a.stderr === b.stderr);
  check("completed within approved180seconds", Number.isFinite(a.elapsedMs) && Number.isFinite(b.elapsedMs) && a.elapsedMs > 0 && b.elapsedMs > 0 && a.elapsedMs <= 180000 && b.elapsedMs <= 180000);
  check("no observed significant slowdown", b.elapsedMs - a.elapsedMs <= Math.max(10000, a.elapsedMs * .20));
  return { passed: checks.every(c => c.pass), checks, summary: { total: checks.length, passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length },
    performanceRule: "Stop/investigate if WIP slower by >max(10000ms,20% of baseline); one pair is not a statistical performance guarantee." };
}
function unchangedR1() {
  assert.equal(git("branch", "--show-current").trim(), "main"); assert.equal(git("rev-parse", "HEAD").trim(), BASELINE); assert.equal(git("rev-parse", "origin/main").trim(), BASELINE); assert.equal(git("diff", "--cached", "--name-only").trim(), "");
  for (const [p, value] of Object.entries(B.hashes)) assert.equal(sha(read(p)), value, "Existing source/WIP/capture changed: " + p);
  const f = json("docs/receiver-execution-v2-sprint-10a3b-r1-focused-evidence.json"), r = json("docs/receiver-execution-v2-sprint-10a3b-r1-related-evidence.json");
  for (const [p, h] of Object.entries(f.finalSourceHashes)) assert.equal(sha(read(p)), h, "R1 final source differs");
  assert(f.results.every(x => x.summary.failed === 0)); assert.equal(r.passed, 18);
  return { existingUnchanged: Object.keys(B.hashes).length, inheritedFocused: 906, inheritedLegacyPairs: 25, inheritedHistoricalStates: 3, inheritedRelatedSuites: 18, originalFirstBaseAndHelpersUnchanged: true, runtimeEnabled: false, candidateCalls: 0 };
}
function materialize(mode) {
  assert(["baseline", "current"].includes(mode)); const dir = fs.mkdtempSync(path.join(os.tmpdir(), "receiver-r2-" + mode + "-"));
  const index = mode === "baseline" ? Buffer.from(git("show", BASELINE + ":index.html")) : read("index.html");
  const files = new Set(["index.html", "tests/high-school-career-test-context.js", FIRST_BASE]);
  for (const x of index.toString("utf8").matchAll(/<script src="([^"]+)"/g)) if (x[1] !== "application-controller.js") files.add(x[1]);
  const hashes = {};
  for (const file of files) {
    assert(!protectedPaths.has(file)); reads.add(file); const bytes = mode === "baseline" ? Buffer.from(git("show", BASELINE + ":" + file)) : read(file), destination = path.resolve(dir, file);
    assert(destination.startsWith(dir + path.sep)); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, bytes, { flag: "wx" }); hashes[file] = sha(bytes);
    if (file.startsWith("tests/")) assert.equal(bytes.toString("utf8"), git("show", BASELINE + ":" + file), "Original fixture/helper changed");
  }
  return { dir, hashes };
}
function comparison() {
  const inheritance = unchangedR1(), results = [];
  // Exactly two sequential runs; no concurrent suites or widened retries.
  for (const mode of ["baseline", "current"]) {
    const tree = materialize(mode), row = runSuite(FIRST_BASE, "comparison", tree.dir);
    row.sourceHashes = { test: tree.hashes[FIRST_BASE], helper: tree.hashes["tests/high-school-career-test-context.js"] }; row.fullSourceHashes = tree.hashes;
    results.push(row); capture("first-base-" + mode, { mode, result: row, inheritance, approvedAcceptance: true });
    console.log(JSON.stringify({ mode, exitCode: row.exitCode, error: row.error, elapsedMs: row.elapsedMs, summary: row.summary }));
  }
  const verdict = evaluateRuntimePair(...results); capture("runtime-comparison", { results: results.map(r => ({ ...r, stdout: undefined, stderr: undefined, fullSourceHashes: undefined })), verdict,
    fullStdoutSha256: results.map(r => sha(r.stdout)), fullStderrSha256: results.map(r => sha(r.stderr)), inheritance, old120And300EvidenceUnmodified: true });
  if (!verdict.passed) process.exitCode = 1;
}
function focused() {
  const inheritance = unchangedR1(), result = require("./receiver-execution-v2-sprint-10a3b-r2-runner-test.cjs").run();
  capture("focused", { result, inheritance, runnerHash: sha(read("tests/receiver-execution-v2-sprint-10a3b-r2-runner.cjs")), testHash: sha(read("tests/receiver-execution-v2-sprint-10a3b-r2-runner-test.cjs")) });
  console.log(JSON.stringify(result.summary)); if (result.summary.failed) process.exitCode = 1;
}
function full() {
  const inheritance = unchangedR1(), runtime = json("docs/receiver-execution-v2-sprint-10a3b-r2-runtime-comparison-evidence.json"), focus = json("docs/receiver-execution-v2-sprint-10a3b-r2-focused-evidence.json");
  assert(runtime.verdict.passed && focus.result.summary.failed === 0, "Full manifest gates not passed");
  assert.equal(sha(read("tests/receiver-execution-v2-sprint-10a3b-r2-runner.cjs")), focus.runnerHash);
  const old = json(MANIFEST), files = old.files; validateManifest(files, old.files);
  assert.equal(sha(JSON.stringify(files)), "871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96");
  const debts = old.results.filter(r => r.exitCode !== 0), expectedDebts = new Map(old.debtVerification.map(r => [r.file, r.signature])); assert.equal(debts.length, 3);
  const results = [], testHashesBefore = Object.fromEntries(files.map(p => [p, sha(read(p))]));
  const startedAt = new Date().toISOString(); let newRegression = false;
  for (const [i, file] of files.entries()) {
    const row = runSuite(file, "full"), prior = old.results.find(x => x.file === file), signature = expectedDebts.get(file);
    assert(prior, "No baseline verdict for suite"); row.sourceHash = testHashesBefore[file]; row.baselineExitCode = prior.exitCode;
    row.existingDebt = Boolean(signature && row.exitCode === prior.exitCode && !row.error && row.stderr.includes(signature) &&
      (!file.includes("high-school-year-one-opportunity-two") || row.stderr.includes("buildHighSchoolShortstopExecution")));
    row.debtSignature = signature || null; row.expectedStatus = row.exitCode === 0 ? prior.exitCode === 0 ? "PASS" : "BASELINE_DEBT_NOW_PASSES" : row.existingDebt ? "EXISTING_DEBT" : "NEW_REGRESSION";
    results.push(row); console.log(JSON.stringify({ index: i + 1, file, exitCode: row.exitCode, elapsedMs: row.elapsedMs, status: row.expectedStatus, error: row.error }));
    if (row.expectedStatus === "NEW_REGRESSION") { newRegression = true; break; }
  }
  for (const [p, h] of Object.entries(testHashesBefore)) assert.equal(sha(read(p)), h, "Suite changed during execution");
  const actualFailures = results.filter(r => r.exitCode !== 0).map(r => r.file), baselineFailures = debts.map(r => r.file);
  const complete = results.length === files.length, sameFailureSet = JSON.stringify(actualFailures.slice().sort()) === JSON.stringify(baselineFailures.slice().sort());
  const baselineDebt = debts.map(r => ({ file: r.file, exitCode: r.exitCode, signature: expectedDebts.get(r.file), stderr: r.stderr }));
  const file = capture("full-repository", { startedAt, finishedAt: new Date().toISOString(), inheritance, manifestSource: MANIFEST, files, manifestSha256: sha(JSON.stringify(files)),
    firstBaseIsManifestMember: files.includes(FIRST_BASE), defaultFullPolicyUnchanged: { timeoutMs: 180000, maxBuffer: 30000000, wrapper: fullWrapper }, testHashesBefore, results, complete,
    passed: results.filter(r => r.exitCode === 0).length, failed: actualFailures.length, baselineFailures, actualFailures, sameFailureSet, baselineDebt, newTimeouts: results.filter(r => r.error?.code === "ETIMEDOUT").map(r => r.file),
    existingDebtReasonsMatch: sameFailureSet && results.filter(r => r.exitCode !== 0).every(r => r.existingDebt), newProductionRegressions: results.filter(r => r.expectedStatus === "NEW_REGRESSION").length,
    verdict: complete && sameFailureSet && !newRegression ? "PARTIAL_3_EXISTING_DEBT_0_NEW_REGRESSION" : "FAIL_OR_INCOMPLETE", originalsUnmodified: true });
  console.log(JSON.stringify({ capture: file, complete, passed: results.filter(r => r.exitCode === 0).length, failed: actualFailures.length, sameFailureSet, newRegression }));
  if (newRegression || !complete || !sameFailureSet) process.exitCode = 1;
}
module.exports = { FIRST_BASE, BASELINE, policyFor, commandFor, validateManifest, evaluateRuntimePair };
if (require.main === module) { const mode = process.argv[2]; if (mode === "compare") comparison(); else if (mode === "focused") focused(); else if (mode === "full") full(); else throw Error("Explicit compare / focused / full mode required"); }
