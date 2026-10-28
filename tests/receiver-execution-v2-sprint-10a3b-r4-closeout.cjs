"use strict";
// Read-only evidence closeout; never executes a test or writes Production source.
const assert = require("node:assert/strict"), R = require("./receiver-execution-v2-sprint-10a3b-r4-runner.cjs");
R.reserve("blocking-regression"); R.reserve("closeout");
const full = R.json(R.prefix + "full-repository-final-evidence.json"), old = R.json("docs/infield-legacy-receiver-model-sprint-6-validation-final.json"), last = full.results.at(-1), initial = R.json(R.prefix + "baseline-evidence.json");
assert.equal(last.file, "tests/pitch-sequence-state-production-integration-test.js"); assert.equal(last.status, "NEW_REGRESSION"); assert.equal(last.primaryError, "AssertionError [ERR_ASSERTION]: save.js");
const currentSave = R.read("save.js"), formalSave = R.git("show", R.baseline + ":save.js"), pinned = R.git("show", "a0e512b439446990d8df118e3e7d737b9f2f51d3:save.js"), normalize = s => s.replace(/\r\n?/g, "\n");
R.capture("blocking-regression", { suiteIndex: full.results.length, failedSuite: last, formalBaselineResult: old.results.find(x => x.file === last.file), firstSevenBehaviorChecks: "PASS in actual stdout",
  classification: "New formal-baseline PASS -> WIP FAIL: exact Save source freeze assertion. Runtime Sequence checks1-7 pass; it is not one of the three original Debt signatures.",
  saveAudit: { currentHash: R.hash(currentSave), initialR4Hash: initial.hashes["save.js"], saveUnchangedDuringR4: R.hash(currentSave) === initial.hashes["save.js"], formalSaveNormalizedHash: R.hash(normalize(formalSave)), pinnedSaveNormalizedHash: R.hash(normalize(pinned)), formalMatchesPinned: normalize(formalSave) === normalize(pinned), currentMatchesPinned: normalize(currentSave.toString()) === normalize(pinned) },
  assertionLine: 141, pinnedCommit: "a0e512b439446990d8df118e3e7d737b9f2f51d3", scriptScopedAssertionReached: false, noSourceOrTestEditAfterStop: true, manifestInvocations: 1, noSuiteReplayAfterStop: true });
assert.deepEqual(full.files, old.files); assert.equal(full.wrapper, R.wrapper); assert.equal(full.timeoutMs, 180000); assert.equal(full.maxBuffer, 30000000);
const audit = full.results.map(x => { const b = old.results.find(y => y.file === x.file); return { file: x.file, status: x.status, baselineExitCode: b.exitCode, currentExitCode: x.exitCode, testHashUnchanged: b.sourceHash === x.sourceHash,
  primaryError: x.primaryError, baselinePrimaryError: x.baselinePrimaryError, reasonMatches: x.primaryError === x.baselinePrimaryError, stdoutMatchesHistoricalHash: R.hash(x.stdout) === b.stdoutSha256 }; });
assert(audit.every(x => x.testHashUnchanged)); assert(audit.filter(x => x.status === "EXISTING_DEBT").every(x => x.reasonMatches));
for (const [p, h] of Object.entries(full.testHashesBefore)) assert.equal(R.hash(R.read(p)), h); for (const [p, h] of Object.entries(full.frozenSourceHashes)) assert.equal(R.hash(R.read(p)), h);
const safety = R.integrity(); assert.deepEqual(safety.changedExistingPaths, ["script.js"]);
const paths = R.git("ls-files", "--others", "--exclude-standard", "-z").split("\0").filter(x => x && x.includes("-10a3b-r4-")), whitespace = [];
for (const p of ["script.js", ...paths]) R.read(p).toString().split(/\r?\n/).forEach((line, i) => { if (/[\t ]+$/.test(line)) whitespace.push({ file: p, line: i + 1 }); }); assert.equal(whitespace.length, 0);
R.capture("closeout", { safety, frozenSourceHashes: full.frozenSourceHashes, manifest: { expected: 227, executed: full.results.length, passed: full.passed, existingDebt: full.existingDebt, newRegressions: full.newRegressions, notRun: full.notRun.length, sha256: full.manifestSha256, originalMembersOrderWrapperLimits: true }, resultAudit: audit,
  earlierTimingComparisonsRetained: ["first-base-runtime-comparison-evidence.json", "first-base-runtime-comparison-final-evidence.json"], runtimeInvestigation: R.json(R.prefix + "runtime-investigation-final-evidence.json"),
  pathsBeforeCloseout: paths, newFileHashes: Object.fromEntries(paths.map(p => [p, R.hash(R.read(p))])), whitespace, readyForCommit: "NO", readyForSprint10B: "NO", receiverRuntime: "DISABLED", L03: "PARTIAL", noStageCommitPush: true });
console.log(JSON.stringify({ executed: full.results.length, passed: full.passed, existingDebt: full.existingDebt, newRegressions: full.newRegressions, notRun: full.notRun.length, preserved: safety.preservedHashCount, changed: safety.changedExistingPaths, stdoutChanges: audit.filter(x => !x.stdoutMatchesHistoricalHash).map(x => x.file) }));
