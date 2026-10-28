"use strict";
const fs = require("node:fs"), path = require("node:path"), os = require("node:os"), assert = require("node:assert/strict");
const R = require("./receiver-execution-v2-sprint-10a3b-r4-runner.cjs"), suite = "tests/first-base-receive-active-ground-production-integration-test.js";
R.reserve("first-base-r3-wip-diagnostic"); R.reserve("runtime-investigation");
const gate = R.json(R.prefix + "gates-final-evidence.json"), before = R.json(R.prefix + "source-before-evidence.json"), current = R.json(R.prefix + "first-base-current-final-evidence.json").result;
assert(gate.passed); assert.equal(R.hash(before.script), before.scriptHash); for (const [p, h] of Object.entries(gate.frozenSourceHashes)) assert.equal(R.hash(R.read(p)), h);
const index = R.read("index.html").toString(), files = ["index.html", "tests/high-school-career-test-context.js", suite, ...[...index.matchAll(/<script src="([^"]+)"/g)].map(x => x[1]).filter(x => x !== "application-controller.js")];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "receiver-r4-r3-wip-diagnostic-")), hashes = {};
for (const p of files) { assert(!R.protectedPaths.has(p)); const bytes = p === "script.js" ? Buffer.from(before.script) : R.read(p), dest = path.resolve(dir, p); assert(dest.startsWith(dir + path.sep)); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, bytes, { flag: "wx" }); hashes[p] = R.hash(bytes); }
assert.equal(hashes["script.js"], before.scriptHash); assert.equal(hashes["receiver-source-snapshot.js"], before.receiverSourceHash);
const result = R.runSuite(suite, false, dir, 180000), line = result.stdout.split(/\r?\n/).find(x => x.startsWith('{"suite":"first-base-receive-active-ground-production-integration"')); result.summary = line ? JSON.parse(line) : null;
R.capture("first-base-r3-wip-diagnostic", { result, diagnosticScope: "Exact pre-R4 WIP source: original R3 script + unchanged current R3 owners; not formal-baseline acceptance", materializedSourceHashes: hashes });
const checks = [
  { name: "both exact180000/16MB,42/42,exit0,no error", pass: [result, current].every(x => x.timeoutMs === 180000 && x.maxBuffer === 16000000 && x.exitCode === 0 && !x.error && x.summary?.passed === 42 && x.summary?.failed === 0) },
  { name: "Node executable/version/command/environment parity", pass: result.nodeExecutable === current.nodeExecutable && result.nodeVersion === current.nodeVersion && JSON.stringify(result.command) === JSON.stringify(current.command) && JSON.stringify(result.environment) === JSON.stringify(current.environment) },
  { name: "complete stdout/stderr parity", pass: result.stdout === current.stdout && result.stderr === current.stderr },
  { name: "no observed significant R4 slowdown against exact pre-R4 WIP", pass: current.elapsedMs - result.elapsedMs <= Math.max(10000, result.elapsedMs * .20) }
];
const fullAllowed = checks.every(x => x.pass); R.capture("runtime-investigation", { checks, fullAllowed, preR4WipElapsedMs: result.elapsedMs, finalR4WipElapsedMs: current.elapsedMs,
  formalBaselineElapsedMs: R.json(R.prefix + "first-base-baseline180-evidence.json").result.elapsedMs, formalBaselineComparison: "Both earlier formal-baseline timing comparisons remain failed investigation thresholds; no evidence is relabeled PASS.",
  interpretation: "R4 acceptance uses unchanged180s policy and complete output. Before/after WIP pair tests for a new R4 slowdown; it does not establish a statistical performance guarantee or erase the overall WIP/formal-baseline timing difference.",
  frozenSourceHashes: gate.frozenSourceHashes, safety: R.integrity() });
console.log(JSON.stringify({ preR4WipElapsedMs: result.elapsedMs, finalR4WipElapsedMs: current.elapsedMs, fullAllowed, checks })); if (!fullAllowed) process.exitCode = 1;
