"use strict";
const fs = require("node:fs"), path = require("node:path"), cp = require("node:child_process"), assert = require("node:assert/strict");
const P = require("./receiver-execution-v2-sprint-10a3b-r4-runner.cjs");
const { root, baseline, read, json, hash, git, protectedPaths, runSuite, focusedSuite, wrapper } = P;
const prefix = "docs/receiver-execution-v2-sprint-10a3b-r6-", pitch = "tests/pitch-sequence-state-production-integration-test.js";
function reserve(label) { const file = prefix + label + "-evidence.json"; assert(!fs.existsSync(path.join(root, file)), "Existing capture: " + file); return file; }
function capture(label, data) { const file = reserve(label); fs.writeFileSync(path.join(root, file), JSON.stringify({ sprint: "10A.3b-R6", baseline, createdAt: new Date().toISOString(), node: process.version, ...data }, null, 2) + "\n", { flag: "wx" }); return file; }
function gitState() { return { branch: git("branch", "--show-current").trim(), head: git("rev-parse", "HEAD").trim(), main: git("rev-parse", "main").trim(), originMain: git("rev-parse", "origin/main").trim(), index: git("diff", "--cached", "--name-only").trim(), status: git("status", "--short") }; }
function metadata() { return Object.fromEntries([...protectedPaths].map(p => { const s = fs.statSync(path.join(root, p)); return [p, { size: s.size, mtimeMs: s.mtimeMs }]; })); }
function stateCheck(s) { assert.equal(s.branch, "main"); for (const k of ["head", "main", "originMain"]) assert.equal(s[k], baseline); assert.equal(s.index, ""); }
function start() {
  reserve("baseline"); const state = gitState(); stateCheck(state);
  const files = git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(p => p && !protectedPaths.has(p) && !p.includes("-10a3b-r6-"));
  const hashes = Object.fromEntries(files.map(p => [p, hash(read(p))])), d = json("docs/receiver-execution-v2-sprint-10a3b-r5-delivery-evidence.json"), b = json("docs/receiver-execution-v2-sprint-10a3b-r5-baseline-evidence.json");
  for (const [p, h] of Object.entries({ ...b.hashes, ...d.hashes })) assert.equal(hashes[p], h, "Prior WIP/capture changed: " + p);
  assert.deepEqual(metadata(), b.protectedMetadata);
  capture("baseline", { git: state, hashes, protectedMetadata: metadata(), protectedContentReadOrHashed: false, r5DeliveryVerified: true });
  console.log(JSON.stringify({ baselineFiles: files.length, protectedPaths: protectedPaths.size, indexEmpty: true }));
}
function integrity() {
  const b = json(prefix + "baseline-evidence.json"), changed = Object.entries(b.hashes).filter(([p, h]) => hash(read(p)) !== h).map(([p]) => p);
  assert(changed.every(p => p === pitch), "Unauthorized existing file delta: " + changed.join(","));
  const state = gitState(); stateCheck(state); assert.deepEqual(metadata(), b.protectedMetadata);
  return { changedExistingPaths: changed, preservedHashCount: Object.keys(b.hashes).length - changed.length, protectedMetadataUnchanged: true, protectedContentReadOrHashed: false, git: state };
}
function frozenHashes() { return Object.fromEntries(["index.html", "script.js", "save.js", "player.js", "match-situation-lifecycle.js", "receiver-source-snapshot.js", pitch, "tests/receiver-source-save-authorized-delta.cjs", "tests/receiver-execution-v2-sprint-10a3b-r6-exact-checker-test.cjs", "tests/receiver-execution-v2-sprint-10a3b-r6-save-boundary-test.cjs"].map(p => [p, hash(read(p))])); }
const relatedFiles = ["tests/infield-scorer-recovery-integrity-repair-test.js", "tests/infield-legacy-receiver-scorer-closeout-test.js", "tests/infield-legacy-receiver-model-foundation-test.js", "tests/match-full-game-record-test.js", "tests/ss-defensive-production-integration-test.js", "tests/defensive-decision-throw-production-integration-test.js", "tests/shared-infield-contract-2b-production-integration-test.js", "tests/third-base-ground-production-integration-test.js", "tests/force-advancement-foundation-test.js", "tests/defensive-runner-throw-settlement-foundation-test.js", "tests/match-experience-development-foundation-v1-test.js", "tests/ground-defensive-decision-identity-production-integration-test.js", "tests/ground-ball-defensive-settlement-lifecycle-regression-test.js", "tests/pitch-production-source-scope-test.js", "tests/match-situation-lifecycle-test.js", "tests/ground-settlement-handoff-r2-production-integration-test.js", "tests/force-multi-runner-settlement-production-integration-test.js"];
function gates() {
  const order = ["exact-focused", "save-boundary", "pitch-green", "career-save", "production-focused", "r1-save-focused", "r3-guard", "r4-dependency", "compatibility", "s8-cross-runtime", "legacy", "bbp", "related", "first-base-current", "runtime-comparison", "gates"];
  order.forEach(reserve); integrity(); const frozenSourceHashes = frozenHashes();
  function save(label, data) { assert.deepEqual(frozenHashes(), frozenSourceHashes); capture(label, { ...data, frozenSourceHashes }); }
  function stop(label, data) { save(label, data); save("gates", { passed: false, stoppedAt: label, order, safety: integrity() }); process.exitCode = 1; }
  function focus(label, file) { const result = focusedSuite(file); console.log(JSON.stringify({ gate: label, summary: result.summary })); if (result.error || result.summary.failed) { stop(label, { result }); return false; } save(label, { result }); return true; }
  if (!focus("exact-focused", "tests/receiver-execution-v2-sprint-10a3b-r6-exact-checker-test.cjs")) return;
  if (!focus("save-boundary", "tests/receiver-execution-v2-sprint-10a3b-r6-save-boundary-test.cjs")) return;
  const pitchResult = runSuite(pitch, true); const pitchSummary = pitchResult.stdout.split(/\r?\n/).find(x => x.startsWith("SEQUENCE_PRODUCTION_JSON="));
  const sequence = pitchSummary ? JSON.parse(pitchSummary.slice("SEQUENCE_PRODUCTION_JSON=".length)) : null;
  if (pitchResult.exitCode !== 0 || pitchResult.error || sequence?.passed !== 8 || sequence?.failed !== 0) return stop("pitch-green", { result: pitchResult, sequence });
  save("pitch-green", { result: pitchResult, sequence }); console.log(JSON.stringify({ gate: "Pitch Sequence original full", checks: sequence.passed, exit: 0 }));
  const career = runSuite("tests/career-save-admission-test.js"); if (career.exitCode !== 0 || career.error) return stop("career-save", { result: career });
  save("career-save", { result: career }); console.log(JSON.stringify({ gate: "Career Save", exit: 0 }));
  for (const [label, file] of [["production-focused", "tests/receiver-execution-v2-production-snapshot-save-test.cjs"], ["r1-save-focused", "tests/receiver-execution-v2-sprint-10a3b-r1-save-test.cjs"], ["r3-guard", "tests/receiver-execution-v2-sprint-10a3b-r3-guard-test.cjs"], ["r4-dependency", "tests/receiver-execution-v2-sprint-10a3b-r4-dependency-test.cjs"]]) if (!focus(label, file)) return;
  const compatibility = []; for (const file of ["tests/receiver-execution-v2-2-contract-test.cjs", "tests/receiver-execution-v2-pure-contract-test.cjs", "tests/receiver-execution-v2-version-admission-timing-test.cjs", "tests/receiver-execution-v2-source-authority-test.cjs", "tests/receiver-execution-v2-production-source-timing-test.cjs"]) {
    const result = focusedSuite(file); compatibility.push(result); console.log(JSON.stringify({ gate: "compatibility", file, summary: result.summary })); if (result.error || result.summary.failed) return stop("compatibility", { results: compatibility, complete: false });
  } save("compatibility", { results: compatibility, complete: true });
  const S8 = require("./receiver-execution-v2-sprint-8-runner.cjs"), pure = require("./receiver-execution-v2-pure-contract-test.cjs").run(), schema = S8.schema();
  const schemaRows = pure.cases.map(x => { assert(S8.conforms(x.sealed.input, schema.$defs.input, schema.$defs)); assert(S8.conforms(x.execution, schema.$defs.execution, schema.$defs)); return { name: x.name, input: "PASS", output: "PASS" }; });
  let cross; try { cross = S8.crossRuntime(); } catch (e) { return stop("s8-cross-runtime", { schemaRows, error: { message: e.message, stack: e.stack } }); }
  save("s8-cross-runtime", { schemaRows, crossRuntime: cross, repeatedPureChecksExcludedFromMainTotal: pure.summary, historicalRunnerCaptureOrIntegrityCalled: false }); console.log(JSON.stringify({ gate: "S8 schema/cross-runtime", schemaRows: schemaRows.length, status: cross.status }));
  if (!focus("legacy", "tests/receiver-execution-v2-sprint-10a3b-legacy-comparison.cjs")) return;
  const bbp = runSuite("tests/bbp-b1-ground-ball-production-integration-test.js"); if (bbp.exitCode !== 0 || bbp.error) return stop("bbp", { result: bbp }); save("bbp", { result: bbp }); console.log(JSON.stringify({ gate: "BBP-B1", exit: 0 }));
  const related = []; for (const file of relatedFiles) { const row = runSuite(file); related.push(row); console.log(JSON.stringify({ gate: "related", file, exit: row.exitCode, elapsedMs: row.elapsedMs })); if (row.exitCode !== 0 || row.error) return stop("related", { results: related, complete: false }); } save("related", { results: related, complete: true });
  const first = runSuite("tests/first-base-receive-active-ground-production-integration-test.js", false, root, 180000), line = first.stdout.split(/\r?\n/).find(x => x.startsWith('{"suite":"first-base-receive-active-ground-production-integration"'));
  first.summary = line ? JSON.parse(line) : null; const formalFile = "docs/receiver-execution-v2-sprint-10a3b-r4-first-base-baseline180-evidence.json", priorFile = "docs/receiver-execution-v2-sprint-10a3b-r4-first-base-current-final-evidence.json";
  const formal = json(formalFile).result, prior = json(priorFile).result; first.outputEqualFormal = first.stdout === formal.stdout && first.stderr === formal.stderr;
  if (first.exitCode !== 0 || first.error || first.summary?.passed !== 42 || first.summary?.failed !== 0 || !first.outputEqualFormal) return stop("first-base-current", { result: first });
  save("first-base-current", { result: first, formalBaselineInheritedFrom: formalFile, noNewBaselineRun: true });
  function comparison(old) { const deltaMs = first.elapsedMs - old.elapsedMs, thresholdMs = Math.max(10000, old.elapsedMs * .2); return { baselineElapsedMs: old.elapsedMs, currentElapsedMs: first.elapsedMs, deltaMs, thresholdMs, withinInvestigationThreshold: deltaMs <= thresholdMs, outputEqual: first.stdout === old.stdout && first.stderr === old.stderr }; }
  const formalComparison = comparison(formal), priorWipComparison = comparison(prior);
  save("runtime-comparison", { formalBaselineEvidence: formalFile, priorWipEvidence: priorFile, formalComparison, priorWipComparison, productionSourceIdenticalToR4: ["index.html", "script.js", "save.js", "match-situation-lifecycle.js", "receiver-source-snapshot.js"].every(p => frozenSourceHashes[p] === json(priorFile).frozenSourceHashes[p]), timingIsSingleInheritedPairNotStatisticalProof: true, priorR4InvestigationPreserved: "docs/receiver-execution-v2-sprint-10a3b-r4-runtime-investigation-final-evidence.json" });
  console.log(JSON.stringify({ gate: "first-base180", summary: first.summary, elapsedMs: first.elapsedMs, formalComparison, priorWipComparison }));
  save("gates", { passed: true, order, safety: integrity(), functionalFirstBasePassed: true, timingLimitationsRecorded: true });
}
function full() {
  reserve("full-repository"); const gate = json(prefix + "gates-evidence.json"); assert(gate.passed); assert.deepEqual(frozenHashes(), gate.frozenSourceHashes); integrity();
  const review = json(prefix + "independent-review-evidence.json"); assert(review.passed); assert.deepEqual(review.frozenSourceHashes, gate.frozenSourceHashes);
  const old = json("docs/infield-legacy-receiver-model-sprint-6-validation-final.json"), files = old.files;
  assert.equal(files.length, 227); assert.equal(new Set(files).size, 227); assert.equal(hash(JSON.stringify(files)), "871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96");
  files.forEach(p => assert(!protectedPaths.has(p))); const testHashesBefore = Object.fromEntries(files.map(p => [p, hash(read(p))])), results = [], startedAt = new Date().toISOString();
  const primary = text => text.split(/\r?\n/).find(x => /^(AssertionError|ReferenceError|TypeError|Error)(?:\b|:)/.test(x)) || null;
  for (const [i, file] of files.entries()) {
    const row = runSuite(file, true), prior = old.results.find(x => x.file === file), debt = old.debtVerification.find(x => x.file === file);
    row.baselineExitCode = prior.exitCode; row.debtSignature = debt?.signature || null; row.primaryError = primary(row.stderr); row.baselinePrimaryError = primary(prior.stderr);
    row.existingDebt = Boolean(debt && row.exitCode === prior.exitCode && !row.error && row.stderr.includes(debt.signature) && row.primaryError === row.baselinePrimaryError && (!file.includes("high-school-year-one-opportunity-two") || row.stderr.includes("buildHighSchoolShortstopExecution")));
    row.status = row.error || row.exitCode !== prior.exitCode ? "NEW_REGRESSION" : row.exitCode === 0 ? "PASS" : row.existingDebt ? "EXISTING_DEBT" : "NEW_REGRESSION";
    results.push(row); console.log(JSON.stringify({ index: i + 1, file, exit: row.exitCode, status: row.status, elapsedMs: row.elapsedMs, error: row.error })); if (row.status === "NEW_REGRESSION") break;
  }
  assert.deepEqual(frozenHashes(), gate.frozenSourceHashes); for (const [p, h] of Object.entries(testHashesBefore)) assert.equal(hash(read(p)), h);
  const complete = results.length === files.length, newRegressions = results.filter(x => x.status === "NEW_REGRESSION").length;
  capture("full-repository", { startedAt, finishedAt: new Date().toISOString(), files, manifestSha256: hash(JSON.stringify(files)), wrapper, timeoutMs: 180000, maxBuffer: 30000000, testHashesBefore, results, complete, passed: results.filter(x => x.status === "PASS").length, existingDebt: results.filter(x => x.status === "EXISTING_DEBT").length, newRegressions, notRun: files.slice(results.length), baselineDebt: old.results.filter(x => x.exitCode !== 0), frozenSourceHashes: gate.frozenSourceHashes, safety: integrity() });
  console.log(JSON.stringify({ complete, executed: results.length, newRegressions })); if (!complete || newRegressions) process.exitCode = 1;
}
module.exports = { root, baseline, prefix, pitch, read, json, hash, git, protectedPaths, reserve, capture, integrity, metadata, frozenHashes, runSuite, focusedSuite, wrapper, relatedFiles };
if (require.main === module) { if (process.argv[2] === "baseline") start(); else if (process.argv[2] === "gates") gates(); else if (process.argv[2] === "full") full(); else throw new Error("Unknown R6 action"); }
