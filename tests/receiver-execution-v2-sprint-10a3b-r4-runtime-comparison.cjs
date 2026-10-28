"use strict";
const fs = require("node:fs"), path = require("node:path"), os = require("node:os"), assert = require("node:assert/strict");
const R = require("./receiver-execution-v2-sprint-10a3b-r4-runner.cjs"), suite = "tests/first-base-receive-active-ground-production-integration-test.js";
const final = process.argv.includes("--final"), suffix = final ? "-final" : "";
if (!final) R.reserve("first-base-baseline180"); R.reserve("first-base-runtime-comparison");
const gate = R.json(R.prefix + "gates" + suffix + "-evidence.json"); assert(gate.passed); for (const [p, h] of Object.entries(gate.frozenSourceHashes)) assert.equal(R.hash(R.read(p)), h);
const index = R.git("show", R.baseline + ":index.html"), files = ["index.html", "tests/high-school-career-test-context.js", suite, ...[...index.matchAll(/<script src="([^"]+)"/g)].map(x => x[1]).filter(x => x !== "application-controller.js")];
let hashes = {}, baselineResult;
if (final) { const prior = R.json(R.prefix + "first-base-baseline180-evidence.json"); hashes = prior.materializedSourceHashes; baselineResult = prior.result; }
else {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "receiver-r4-first-base-baseline-"));
  for (const p of files) { assert(!R.protectedPaths.has(p)); const bytes = Buffer.from(R.git("show", R.baseline + ":" + p)), dest = path.resolve(dir, p); assert(dest.startsWith(dir + path.sep)); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, bytes, { flag: "wx" }); hashes[p] = R.hash(bytes); }
  baselineResult = R.runSuite(suite, false, dir, 180000);
}
const wip = R.json(R.prefix + "first-base-current" + suffix + "-evidence.json").result;
const line = baselineResult.stdout.split(/\r?\n/).find(x => x.startsWith('{"suite":"first-base-receive-active-ground-production-integration"')); baselineResult.summary = line ? JSON.parse(line) : null;
if (!final) R.capture("first-base-baseline180", { result: baselineResult, materializedSourceHashes: hashes, frozenSourceHashes: gate.frozenSourceHashes });
const checks = [
  { name: "baseline/current exit0,42/42,no error", pass: [baselineResult, wip].every(x => x.exitCode === 0 && !x.error && x.summary?.passed === 42 && x.summary?.failed === 0) },
  { name: "same Node/command/environment/180000/16MB", pass: baselineResult.nodeExecutable === wip.nodeExecutable && baselineResult.nodeVersion === wip.nodeVersion && JSON.stringify(baselineResult.command) === JSON.stringify(wip.command) && JSON.stringify(baselineResult.environment) === JSON.stringify(wip.environment) && [baselineResult, wip].every(x => x.timeoutMs === 180000 && x.maxBuffer === 16000000) },
  { name: "original fixture/helper unchanged", pass: [suite, "tests/high-school-career-test-context.js"].every(p => hashes[p] === R.hash(R.read(p))) },
  { name: "complete stdout/stderr parity", pass: baselineResult.stdout === wip.stdout && baselineResult.stderr === wip.stderr },
  { name: "no significant slowdown under inherited investigation rule", pass: wip.elapsedMs - baselineResult.elapsedMs <= Math.max(10000, baselineResult.elapsedMs * .20) }
];
const passed = checks.every(x => x.pass); for (const [p, h] of Object.entries(gate.frozenSourceHashes)) assert.equal(R.hash(R.read(p)), h);
R.capture("first-base-runtime-comparison", { checks, passed, summary: { total: checks.length, passed: checks.filter(x => x.pass).length, failed: checks.filter(x => !x.pass).length }, baselineElapsedMs: baselineResult.elapsedMs, currentElapsedMs: wip.elapsedMs,
  executionOrder: final ? "R4 baseline180 already completed before source fast-path revision; final-source WIP180 rerun after all related gates. Original pair and captures preserved." : "R4 first WIP180 gate, then one baseline180; sequential", rule: "Investigate if WIP slower by >max(10000ms,20% baseline). Single pair is not a statistical performance guarantee.", frozenSourceHashes: gate.frozenSourceHashes, safety: R.integrity() });
console.log(JSON.stringify({ baselineElapsedMs: baselineResult.elapsedMs, currentElapsedMs: wip.elapsedMs, passed, checks })); if (!passed) process.exitCode = 1;
