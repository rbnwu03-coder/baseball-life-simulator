"use strict";
// Explicit Phase B lists only; leaves the original runner/registry untouched.
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const P = require("./source-freeze-contract-reconciliation-v0.1-phase-b-capture.cjs"), R = require("../tests/entry-safe-runner.cjs");
const shortNames = ["decision", "interpretation", "adapter-integration", "intent-evidence", "signal-projection"];
const originals = P.json(P.prefix + "baseline-evidence.json").originalSuiteSources;
const suiteSpecs = P.suiteRows.map((row, i) => ({ file: row.file, name: shortNames[i], expectedTotal: [...originals[row.file].matchAll(/\btest\('[0-9]+ /g)].length, callerOriginalRef: row.ref, policy: { timeoutMs: 180000, outputMaxBuffer: 30000000 } }));
const boundedSpecs = [
  { file: "tests/receiver-execution-v2-sprint-10a3b-r6-save-boundary-test.cjs", name: "save-boundary", expectedTotal: 30 },
  { file: "tests/receiver-execution-v2-sprint-10a3b-r1-save-test.cjs", name: "r1-save", expectedTotal: 19 },
  { file: "tests/receiver-execution-v2-sprint-10a3b-r3-guard-test.cjs", name: "r3-guard", expectedTotal: 40 },
  { file: "tests/receiver-execution-v2-sprint-10a3b-legacy-comparison.cjs", name: "legacy-historical", expectedTotal: 25, expectedHistorical: 3 }
];
function completion(stdout) {
  for (const line of stdout.trim().split(/\r?\n/).reverse()) {
    try { const value = JSON.parse(line.replace(/^[A-Z_]+_JSON=/, "")); if (typeof value.passed === "number" && typeof value.failed === "number") return value; } catch {}
  }
  try { return JSON.parse(stdout).summary; } catch { return null; }
}
function execute(group) {
  const formal = group === "suites"; assert(formal || group === "bounded", "Explicit bounded stage required");
  P.reserve(group); P.integrity(true); const reverse = P.reverseVerify();
  const lock = P.json(P.prefix + "authorized-revisions-evidence.json").lockedExecutionHashes;
  for (const [p, sha] of Object.entries(lock)) assert.equal(P.fileHash(p), sha, p);
  const rootPaths = Object.keys(P.json("docs/source-freeze-contract-reconciliation-v0.1-source-review-evidence.json").scriptScopeHashes);
  const helperPaths = Object.keys(P.json(P.prefix + "baseline-evidence.json").hashes).filter(p => p.startsWith("tests/") && /\.(?:js|cjs)$/.test(p));
  const relevantPaths = [...new Set([...rootPaths, ...helperPaths, "index.html", "tests/receiver-source-index-authorized-wiring.cjs", "tests/source-freeze-reconciliation-exact-contract-test.cjs", "docs/source-freeze-contract-reconciliation-v0.1-phase-b-capture.cjs", "docs/source-freeze-contract-reconciliation-v0.1-phase-b-runner.cjs"])];
  const specs = formal ? suiteSpecs : boundedSpecs, results = []; let stopped = false;
  for (const spec of specs) {
    if (stopped) { results.push(R.notRun({ file: spec.file, entryMode: "standalone" })); continue; }
    const evidence = P.childPrefix + spec.name + "-evidence.json";
    const row = R.runSuite({ ...spec, suiteName: spec.name, entryMode: "standalone", evidencePath: evidence, relevantPaths });
    const summary = completion(row.stdout), completionVerified = summary?.passed === spec.expectedTotal && summary?.failed === 0 && (!spec.expectedHistorical || summary.historical === spec.expectedHistorical);
    const status = row.status === "PASS" && !completionVerified ? "UNVERIFIED" : row.status;
    const result = { file: spec.file, name: spec.name, evidence, status, runnerStatus: row.status, entryMode: row.entryMode, entryVerified: row.entryVerified, successfulAssertions: row.successfulAssertions,
      suiteChecks: summary ? { passed: summary.passed, failed: summary.failed, historical: summary.historical ?? null } : null, expectedTotal: spec.expectedTotal, completionVerified,
      callerOriginalRef: spec.callerOriginalRef ?? null, contractCanonicalRef: formal ? "a0e512b439446990d8df118e3e7d737b9f2f51d3" : null, exitCode: row.exitCode, elapsedMs: row.elapsedMs, policy: row.policy };
    results.push(result);
    console.log(JSON.stringify({ stage: group, suite: spec.name, status, checks: result.suiteChecks, nodeAssertions: row.successfulAssertions, elapsedMs: row.elapsedMs, evidence }));
    if (status !== "PASS") { stopped = true; continue; }
    P.integrity(true); for (const [p, sha] of Object.entries(lock)) assert.equal(P.fileHash(p), sha, p);
  }
  const evidence = P.capture(group, { results, stopped, actualInvocations: results.filter(x => x.status !== "NOT RUN").length, allPassed: results.every(x => x.status === "PASS"), reverseToOriginal: reverse,
    rawLogsStoredSeparately: true, productionDelta: 0, registryDelta: 0, fullInvocations: 0, firstBaseInvocations: 0 });
  console.log(JSON.stringify({ stage: group, passed: results.filter(x => x.status === "PASS").length, stopped, evidence }));
  if (stopped) process.exitCode = 1;
}
module.exports = { execute, suiteSpecs, boundedSpecs };
if (require.main === module) execute(process.argv[2]);
