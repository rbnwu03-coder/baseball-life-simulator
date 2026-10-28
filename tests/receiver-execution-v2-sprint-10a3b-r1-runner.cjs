"use strict";
// R1 captures are exclusive-create. Original suites and fixtures remain unchanged.
const fs = require("node:fs"), path = require("node:path"), os = require("node:os"), cp = require("node:child_process"), crypto = require("node:crypto"), assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."), baseline = "ab3117653945de0b7013636187c446276a96e634";
const B = JSON.parse(fs.readFileSync(path.join(root, "docs/receiver-execution-v2-sprint-10a3b-r1-baseline-evidence.json"), "utf8"));
const protectedPaths = new Set(Object.keys(B.protectedMetadata));
const reads = new Set();
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
function read(p) { assert(!protectedPaths.has(p), "Protected content"); reads.add(p); return fs.readFileSync(path.join(root, p)); }
function git(...args) { return cp.execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 30000000 }); }
function capture(label, result) {
  const file = "docs/receiver-execution-v2-sprint-10a3b-r1-" + label + "-evidence.json";
  fs.writeFileSync(path.join(root, file), JSON.stringify({ sprint: "10A.3b-R1", baseline, createdAt: new Date().toISOString(), node: process.version, ...result, readPaths: [...reads] }, null, 2) + "\n", { flag: "wx" });
  return file;
}
function runSuite(file, cwd = root, timeout = 120000) {
  assert(!protectedPaths.has(file)); const start = process.hrtime.bigint();
  const r = cp.spawnSync(process.execPath, [file], { cwd, encoding: "utf8", windowsHide: true, timeout, maxBuffer: 16000000 });
  return { file, command: [process.execPath, file], cwd, timeoutMs: timeout, elapsedMs: Number(process.hrtime.bigint() - start) / 1e6,
    exitCode: r.status, signal: r.signal, error: r.error ? { code: r.error.code, message: r.error.message } : null, stdout: r.stdout || "", stderr: r.stderr || "" };
}
function materialize(mode) {
  assert(["baseline", "current"].includes(mode));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "receiver-r1-" + mode + "-"));
  const index = mode === "baseline" ? Buffer.from(git("show", baseline + ":index.html")) : read("index.html");
  const files = new Set(["index.html", "tests/high-school-career-test-context.js", "tests/first-base-receive-active-ground-production-integration-test.js"]);
  for (const x of index.toString("utf8").matchAll(/<script src="([^"]+)"/g)) if (x[1] !== "application-controller.js") files.add(x[1]);
  const hashes = {};
  for (const p of files) {
    assert(!protectedPaths.has(p)); reads.add(p);
    const bytes = mode === "baseline" ? Buffer.from(git("show", baseline + ":" + p)) : read(p);
    const dest = path.resolve(dir, p); assert(dest.startsWith(dir + path.sep));
    fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, bytes, { flag: "wx" }); hashes[p] = hash(bytes);
    if (p.startsWith("tests/")) assert.equal(bytes.toString("utf8").replace(/\r\n/g, "\n"), git("show", baseline + ":" + p).replace(/\r\n/g, "\n"), "Original test/helper altered");
  }
  return { dir, hashes };
}
function firstBase(mode, timeout = 120000, suffix = "") {
  const copy = materialize(mode), r = runSuite("tests/first-base-receive-active-ground-production-integration-test.js", copy.dir, timeout);
  const label = "first-base-" + mode + (timeout === 120000 ? "" : "-diagnostic-" + timeout) + suffix;
  const file = capture(label, { mode, diagnosticOnly: timeout !== 120000, sourceHashes: copy.hashes, fixtureAndHelperUnchanged: true, originalRunnerTimeoutMs: 120000, result: r });
  console.log(JSON.stringify({ file, mode, elapsedMs: r.elapsedMs, exitCode: r.exitCode, error: r.error, tail: r.stdout.slice(-650), stderr: r.stderr.slice(-650) }));
  return r;
}
function timeoutRecovery() {
  // Sequential comparable executions, no overlapping suites. Wider runs remain diagnostic only.
  const a = firstBase("baseline", 120000, "-serial"), b = firstBase("current", 120000, "-serial");
  if (b.exitCode !== null && b.exitCode !== 0) { capture("timeout-comparison", { baseline: a, current: b, stop: "current non-timeout failure; do not expand" }); process.exitCode = 1; return; }
  const da = firstBase("baseline", 300000), db = firstBase("current", 300000);
  capture("timeout-comparison", { executionOrder: "baseline120,current120,baseline300diagnostic,current300diagnostic; sequential", originalCondition: { baseline: { exitCode: a.exitCode, error: a.error, elapsedMs: a.elapsedMs }, current: { exitCode: b.exitCode, error: b.error, elapsedMs: b.elapsedMs }, accepted: b.exitCode === 0 },
    diagnosticOnly: { timeoutMs: 300000, baseline: { exitCode: da.exitCode, error: da.error, elapsedMs: da.elapsedMs }, current: { exitCode: db.exitCode, error: db.error, elapsedMs: db.elapsedMs }, completeStdoutEqual: da.stdout === db.stdout, baselineStdoutSha256: hash(da.stdout), currentStdoutSha256: hash(db.stdout) },
    verdict: b.exitCode === 0 ? "PASS_ORIGINAL_CONDITION" : "UNRESOLVED_ORIGINAL120_TIMEOUT; wider diagnostic cannot replace acceptance", formalTimeoutUnchanged: true });
}
function namedSuites() {
  const files = ["tests/receiver-execution-v2-production-snapshot-save-test.cjs", "tests/receiver-execution-v2-sprint-10a3b-legacy-comparison.cjs", "tests/receiver-execution-v2-2-contract-test.cjs", "tests/receiver-execution-v2-pure-contract-test.cjs", "tests/receiver-execution-v2-version-admission-timing-test.cjs", "tests/receiver-execution-v2-source-authority-test.cjs", "tests/receiver-execution-v2-production-source-timing-test.cjs", "tests/receiver-execution-v2-sprint-10a3b-r1-save-test.cjs"];
  const results = [];
  for (const p of files) {
    read(p); const t = process.hrtime.bigint(), result = require(path.join(root, p)).run();
    const summary = result.summary || { total: result.total, passed: result.passed, failed: result.failed };
    results.push({ file: p, elapsedMs: Number(process.hrtime.bigint() - t) / 1e6, summary, result });
    console.log(JSON.stringify({ file: p, summary }));
    if (summary.failed) { capture("focused-stopped", { results }); process.exitCode = 1; return; }
  }
  capture("focused", { results, finalSourceHashes: Object.fromEntries(["save.js", "receiver-source-snapshot.js", "script.js", "match-situation-lifecycle.js", "index.html", ...files].map(p => [p, hash(read(p))])) });
}
function related() {
  const files = ["tests/career-save-admission-test.js", "tests/infield-scorer-recovery-integrity-repair-test.js", "tests/infield-legacy-receiver-scorer-closeout-test.js", "tests/infield-legacy-receiver-model-foundation-test.js", "tests/match-full-game-record-test.js", "tests/ss-defensive-production-integration-test.js", "tests/defensive-decision-throw-production-integration-test.js", "tests/shared-infield-contract-2b-production-integration-test.js", "tests/third-base-ground-production-integration-test.js", "tests/force-advancement-foundation-test.js", "tests/defensive-runner-throw-settlement-foundation-test.js", "tests/match-experience-development-foundation-v1-test.js", "tests/ground-defensive-decision-identity-production-integration-test.js", "tests/ground-ball-defensive-settlement-lifecycle-regression-test.js", "tests/pitch-production-source-scope-test.js", "tests/match-situation-lifecycle-test.js", "tests/ground-settlement-handoff-r2-production-integration-test.js", "tests/force-multi-runner-settlement-production-integration-test.js"];
  const results = [];
  for (const p of files) { read(p); const r = runSuite(p); results.push(r); console.log(JSON.stringify({ file: p, exitCode: r.exitCode, elapsedMs: r.elapsedMs, error: r.error, tail: r.stdout.slice(-160) })); if (r.exitCode !== 0) { capture("related-stopped", { results }); process.exitCode = 1; return; } }
  capture("related", { results, suiteCount: results.length, passed: results.filter(r => r.exitCode === 0).length });
}
const mode = process.argv[2];
if (mode === "first-base") firstBase(process.argv[3], Number(process.argv[4] || 120000));
else if (mode === "focused") namedSuites();
else if (mode === "related") related();
else if (mode === "timeout-recovery") timeoutRecovery();
else if (require.main === module) throw Error("Use explicit first-base / focused / related mode");
module.exports = { capture, runSuite, read, hash, protectedPaths, root, baseline };
