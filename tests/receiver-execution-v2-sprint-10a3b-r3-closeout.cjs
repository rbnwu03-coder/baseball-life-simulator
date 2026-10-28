"use strict";
// Read-only closeout audit. This file never executes a suite or changes source.
const fs = require("node:fs"), assert = require("node:assert/strict"), R = require("./receiver-execution-v2-sprint-10a3b-r3-runner.cjs");
R.reserve("blocking-regression"); R.reserve("closeout");
const full = R.json(R.prefix + "full-repository-evidence.json"), old = R.json("docs/infield-legacy-receiver-model-sprint-6-validation-final.json"), last = full.results.at(-1);
assert.equal(last.status, "NEW_REGRESSION"); assert.equal(last.file, "tests/bbp-b1-ground-ball-production-integration-test.js");
const script = R.read("script.js").toString(), baselineScript = R.git("show", R.baseline + ":script.js"), test = R.read(last.file).toString(), initial = R.json(R.prefix + "baseline-evidence.json");
const audit = full.results.map(row => {
  const prior = old.results.find(x => x.file === row.file), primary = text => text.split(/\r?\n/).find(x => /^(AssertionError|ReferenceError|TypeError|Error)(?:\b|:)/.test(x)) || null;
  return { file: row.file, baselineExitCode: prior.exitCode, currentExitCode: row.exitCode, baselinePrimaryError: primary(prior.stderr), currentPrimaryError: primary(row.stderr),
    baselineTestHash: prior.sourceHash, currentTestHash: row.sourceHash, testHashUnchanged: prior.sourceHash === row.sourceHash,
    sameReason: primary(prior.stderr) === primary(row.stderr), status: row.status, stdoutHashMatchesHistorical: R.hash(row.stdout) === prior.stdoutSha256 };
});
assert(audit.every(x => x.testHashUnchanged));
assert(audit.filter(x => x.status === "EXISTING_DEBT").every(x => x.sameReason));
assert.deepEqual(full.files, old.files); assert.equal(full.wrapper, R.wrapper); assert.equal(full.timeoutMs, 180000); assert.equal(full.maxBuffer, 30000000);
for (const [p, h] of Object.entries(full.testHashesBefore)) assert.equal(R.hash(R.read(p)), h);
R.capture("blocking-regression", { suiteIndex: full.results.length, failedSuite: last, baseline: old.results.find(x => x.file === last.file),
  capturedReason: "ReferenceError: TeamRosterFoundation is not defined", sourceLine: 5337, owner: "ensureHighSchoolOrdinaryGroundBallInPlayHandoff",
  readOnlyFindings: { originalTestUnchanged: true, runtimeFilesOmitTeamRosterAndReceiverSource: !test.slice(test.indexOf("const runtimeFiles"), test.indexOf("const nodes")).includes("team-roster-foundation.js") && !test.slice(test.indexOf("const runtimeFiles"), test.indexOf("const nodes")).includes("receiver-source-snapshot.js"),
    rosterReadsPrecedeReceiverModuleEligibility: script.indexOf("const sourceSs = sourceRoster && TeamRosterFoundation") < script.indexOf('if (typeof ReceiverSourceSnapshot !== "undefined" && sourceHandoff'),
    rosterReadsAbsentFromFormalBaseline: !baselineScript.includes("const sourceSs = sourceRoster && TeamRosterFoundation"), scriptUnchangedDuringR3: R.hash(script) === initial.hashes["script.js"] },
  classification: "New baseline-PASS -> WIP-FAIL dependency exception, observed for the first time at R3 manifest member34. It is in preserved pre-R3 script WIP; R3 changed only receiver-source-snapshot.js.",
  notRun: full.notRun, newDiagnosticsOrReexecutionAfterStop: false, sourceFixAfterStop: false, manifestInvocations: 1 });
const newPaths = R.git("ls-files", "--others", "--exclude-standard", "-z").split("\0").filter(x => x && x.includes("-10a3b-r3-"));
const whitespace = []; for (const p of ["receiver-source-snapshot.js", ...newPaths]) { const text = R.read(p).toString("utf8"); text.split(/\r?\n/).forEach((line, i) => { if (/[\t ]+$/.test(line)) whitespace.push({ file: p, line: i + 1 }); }); } assert.equal(whitespace.length, 0);
const safety = R.integrity(); assert.deepEqual(safety.changedExistingPaths, ["receiver-source-snapshot.js"]);
R.capture("closeout", { safety, frozenSourceHashes: full.frozenSourceHashes, finalSourceHashesMatchAllGates: Object.entries(full.frozenSourceHashes).every(([p, h]) => R.hash(R.read(p)) === h),
  resultAudit: audit, manifest: { expected: 227, executed: full.results.length, passed: full.passed, existingDebtReproduced: full.existingDebt, newRegressions: full.newRegressions, notRun: full.notRun.length, unique: new Set(full.files).size, originalOrderAndMembers: true, originalWrapperAndLimits: true, sha256: full.manifestSha256 },
  newPathsBeforeCloseout: newPaths, newFileHashes: Object.fromEntries(newPaths.map(p => [p, R.hash(R.read(p))])), whitespace,
  receiverRuntime: "DISABLED", L03: "PARTIAL", readyForSprint10B: "NO", readyForCommit: "NO", stoppedForManualReview: true, stageCommitPush: false });
console.log(JSON.stringify({ safety: { preserved: safety.preservedHashCount, changed: safety.changedExistingPaths, protectedMetadataUnchanged: true }, full: { executed: full.results.length, pass: full.passed, debt: full.existingDebt, newRegression: full.newRegressions, notRun: full.notRun.length }, outputChanges: audit.filter(x => !x.stdoutHashMatchesHistorical).map(x => x.file) }));
