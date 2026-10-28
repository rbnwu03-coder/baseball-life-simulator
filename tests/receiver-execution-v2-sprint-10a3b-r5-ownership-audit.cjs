"use strict";
// Read-only R5 contract diagnosis. No production hooks, source rewriting or test changes.
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const P = require("./receiver-execution-v2-sprint-10a3b-r4-runner.cjs");
const { root, baseline, read, json, hash, git, protectedPaths, runSuite } = P;
const prefix = "docs/receiver-execution-v2-sprint-10a3b-r5-";
const pitch = "tests/pitch-sequence-state-production-integration-test.js";
const pinned = "a0e512b439446990d8df118e3e7d737b9f2f51d3";
const normalize = s => s.replace(/\r\n?/g, "\n");
function reserve(label) { const file = prefix + label + "-evidence.json"; assert(!fs.existsSync(path.join(root, file)), "Existing capture: " + file); return file; }
function capture(label, data) { const file = reserve(label); fs.writeFileSync(path.join(root, file), JSON.stringify({ sprint: "10A.3b-R5", baseline, createdAt: new Date().toISOString(), node: process.version, ...data }, null, 2) + "\n", { flag: "wx" }); return file; }
function gitState() { return { branch: git("branch", "--show-current").trim(), head: git("rev-parse", "HEAD").trim(), main: git("rev-parse", "main").trim(), originMain: git("rev-parse", "origin/main").trim(), index: git("diff", "--cached", "--name-only").trim(), status: git("status", "--short") }; }
function metadata() { return Object.fromEntries([...protectedPaths].map(p => { const s = fs.statSync(path.join(root, p)); return [p, { size: s.size, mtimeMs: s.mtimeMs }]; })); }
function stateAssertions(s) { assert.equal(s.branch, "main"); for (const k of ["head", "main", "originMain"]) assert.equal(s[k], baseline); assert.equal(s.index, ""); }
function start() {
  reserve("baseline"); const state = gitState(); stateAssertions(state);
  const files = git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(p => p && !protectedPaths.has(p) && !p.includes("-10a3b-r5-"));
  const hashes = Object.fromEntries(files.map(p => [p, hash(read(p))]));
  const old = json("docs/receiver-execution-v2-sprint-10a3b-r4-baseline-evidence.json"), delivery = json("docs/receiver-execution-v2-sprint-10a3b-r4-delivery-evidence.json");
  for (const [p, h] of Object.entries(delivery.hashes)) assert.equal(hashes[p], h, "R4 delivery changed: " + p);
  const change = json("docs/receiver-execution-v2-sprint-10a3b-r4-source-change-final-evidence.json");
  for (const [p, h] of Object.entries(old.hashes)) assert.equal(hashes[p], p === "script.js" ? change.afterScriptSha256 : h, "Prior WIP changed: " + p);
  assert.deepEqual(metadata(), old.protectedMetadata);
  capture("baseline", { git: state, hashes, previousDeliveryHash: hash(read("docs/receiver-execution-v2-sprint-10a3b-r4-delivery-evidence.json")), protectedMetadata: metadata(), protectedContentReadOrHashed: false, r4DeliveryAndPreviousWipVerified: true });
  console.log(JSON.stringify({ baselineFiles: files.length, protectedPaths: protectedPaths.size, indexEmpty: true }));
}
function integrity() {
  const b = json(prefix + "baseline-evidence.json"), changed = Object.entries(b.hashes).filter(([p, h]) => hash(read(p)) !== h).map(([p]) => p);
  assert.deepEqual(changed, []); const state = gitState(); stateAssertions(state); assert.deepEqual(metadata(), b.protectedMetadata);
  return { changedExistingPaths: changed, preservedHashCount: Object.keys(b.hashes).length, protectedMetadataUnchanged: true, protectedContentReadOrHashed: false, git: state };
}
function red() {
  reserve("pitch-red"); integrity(); const result = runSuite(pitch, true);
  capture("pitch-red", { result, primaryFailure: result.stderr.match(/AssertionError \[ERR_ASSERTION\]:[^\n]*/)?.[0] || null, observedPassChecks: (result.stdout.match(/^PASS /gm) || []).length, testUnchanged: hash(read(pitch)) === json(prefix + "baseline-evidence.json").hashes[pitch], safety: integrity() });
  assert.equal(result.exitCode, 1); assert.equal(result.error, null); assert(result.stderr.includes("AssertionError [ERR_ASSERTION]: save.js"));
  console.log(JSON.stringify({ exit: result.exitCode, elapsedMs: result.elapsedMs, passedBeforeFailure: 7, failure: "save.js full source freeze" }));
}
function freeze() {
  reserve("freeze-comparisons"); integrity(); const rows = [];
  for (const file of ["pitch-observation-foundation.js", "offensive-plate-approach.js", "pitcher-catcher-tactical-integration.js", "pitch-sequencing.js", "save.js", "script.js"]) {
    const current = normalize(read(file).toString("utf8")), original = normalize(git("show", pinned + ":" + file));
    const formal = normalize(git("show", baseline + ":" + file));
    const row = { file, currentNormalizedSha256: hash(Buffer.from(current)), pinnedNormalizedSha256: hash(Buffer.from(original)), formalNormalizedSha256: hash(Buffer.from(formal)), completeNormalizedBytesEqual: current === original, formalCompleteNormalizedBytesEqual: formal === original, actualOriginalSuiteReached: file !== "script.js", checkType: file === "script.js" ? "original scoped assertion" : file === "pitcher-catcher-tactical-integration.js" ? "original repeat extraction assertion" : "complete normalized source equality" };
    try {
      if (file === "script.js") row.scope = require("./pitch-production-source-scope.cjs").assertPitchProductionSourceScope(current, original);
      else if (file === "pitcher-catcher-tactical-integration.js") require("./pitch-tactical-selector-extraction-baseline.cjs").assertOnlyRepeatEligibilityExtraction(current, original);
      else assert.equal(current, original, file);
      row.verdict = "PASS";
    } catch (e) { row.verdict = "FAIL"; row.error = { name: e.name, message: e.message.split("\n")[0], stackHead: e.stack?.split("\n").slice(0, 4) }; }
    rows.push(row);
  }
  capture("freeze-comparisons", { pinned, rows, independentlyAuditedAllSix: true, originalSuiteGreen: false, passedComparisons: rows.filter(x => x.verdict === "PASS").length, failedComparisons: rows.filter(x => x.verdict === "FAIL").length, safety: integrity() });
  console.log(JSON.stringify(rows.map(x => ({ file: x.file, verdict: x.verdict, scope: x.scope }))));
}
function contract() {
  reserve("ownership-contract"); integrity();
  const { readSource } = require("./pitch-production-source-scope.cjs");
  const sources = Object.fromEntries(["save.js", "player.js", "script.js", "receiver-source-snapshot.js", "application-controller.js", "career-save-admission.js"].map(p => [p, { currentSha256: hash(read(p)), current: normalize(read(p).toString("utf8")), formal: p === "receiver-source-snapshot.js" ? null : normalize(git("show", baseline + ":" + p)) }]));
  // The new adapter is untracked: it has no formal-commit source.
  const saved = sources["save.js"], current = readSource(saved.current), original = readSource(saved.formal);
  const bodies = Object.fromEntries(["saveGame", "normalizeSave", "loadGame"].map(n => [n, { current: current.get(n).source, original: original.get(n).source }]));
  const checks = [];
  function check(name, fn) { fn(); checks.push({ name, passed: true, kind: "read-only source contract assertion; no functional regression execution" }); }
  check("formal Save equals pinned complete normalized bytes", () => assert.equal(saved.formal, normalize(git("show", pinned + ":save.js"))));
  check("original writer is direct Player JSON storage", () => assert(bodies.saveGame.original.includes("localStorage.setItem(SAVE_KEY, JSON.stringify(player));")));
  check("original Save has no receiver adapter reference", () => assert(!/ReceiverSourceSnapshot|receiverSource/.test(saved.formal)));
  check("original first normalizer dependency receives name only", () => assert(bodies.normalizeSave.original.startsWith('function normalizeSave(saved) {\n  const sourceSaveVersion = saved.saveVersion;\n  const fresh = createInitialPlayer(saved.name || "");\n  Object.assign(fresh, saved);')));
  check("original generic module calls follow defaults and merge", () => assert(bodies.normalizeSave.original.indexOf("HighSchoolExchangeNetwork.normalizeState") > bodies.normalizeSave.original.indexOf("Object.assign(fresh, saved)")));
  check("original decision guard is after normalized Match construction", () => assert(bodies.normalizeSave.original.indexOf("validateHighSchoolDecisionThrowState(fresh.highSchoolMatch)") > bodies.normalizeSave.original.indexOf("fresh.highSchoolMatch = Object.assign")));
  check("original version assignment does not preserve source Save16", () => assert(bodies.normalizeSave.original.includes("fresh.saveVersion = SAVE_VERSION;")));
  check("current raw guard precedes first defaults", () => assert(bodies.normalizeSave.current.indexOf("ReceiverSourceSnapshot.validateRawSave(saved)") < bodies.normalizeSave.current.indexOf("const fresh = createInitialPlayer")));
  check("current raw guard precedes first merge", () => assert(bodies.normalizeSave.current.indexOf("ReceiverSourceSnapshot.validateRawSave(saved)") < bodies.normalizeSave.current.indexOf("Object.assign(fresh, saved)")));
  check("current source serialization is evaluated before storage write", () => assert(bodies.saveGame.current.includes("localStorage.setItem(SAVE_KEY, ReceiverSourceSnapshot.serializeSave(player));")));
  check("current ordinary guard precedes direct JSON write", () => assert(bodies.saveGame.current.indexOf("ReceiverSourceSnapshot.validateRawSave(player)") < bodies.saveGame.current.indexOf("JSON.stringify(player)")));
  check("load admission owner is unchanged", () => assert.equal(bodies.loadGame.current, bodies.loadGame.original));
  check("load normalizes parsed raw before career admission", () => assert(bodies.loadGame.original.indexOf("normalizeSave(JSON.parse(raw))") < bodies.loadGame.original.indexOf("AdultCareerSaveAdmission.evaluate(candidate)")));
  check("load admission precedes live Player replacement", () => assert(bodies.loadGame.original.indexOf("AdultCareerSaveAdmission.evaluate(candidate)") < bodies.loadGame.original.indexOf("player = candidate")));
  check("Player owner unchanged from formal baseline", () => assert.equal(sources["player.js"].current, sources["player.js"].formal));
  check("Player owner has no preexisting toJSON hook", () => assert(!/\btoJSON\b/.test(sources["player.js"].formal)));
  check("ApplicationController delegates Save and Load without raw body", () => { assert(sources["application-controller.js"].formal.includes('invokeLegacy("saveSession", "saveGame")')); assert(sources["application-controller.js"].formal.includes('invokeLegacy("resumeSession", "loadGame")')); });
  check("Career admission explicitly receives normalized candidate", () => assert(sources["career-save-admission.js"].formal.includes("需要 normalized candidate 狀態")));
  check("gameplay gate only reads pending flag", () => assert.equal(readSource(sources["script.js"].formal).get("isBaseballGameplayPending").source, 'function isBaseballGameplayPending() {\n  return Boolean(pendingBaseballGameplay);\n}'));
  check("source adapter has no storage writer", () => assert(!/localStorage|setItem\(/.test(sources["receiver-source-snapshot.js"].current)));
  check("source adapter remains disabled", () => assert(require("../receiver-source-snapshot.js").runtimeEnabled === false));
  const originalTest = normalize(git("show", "98bcd1d:tests/pitch-sequence-state-production-integration-test.js"));
  capture("ownership-contract", { verdict: "C: BLOCKED", productionDelta: 0, sources, bodies, saveDiffAgainstFormal: git("diff", "--unified=3", baseline, "--", "save.js"), freezeIntroduction: { commit: "98bcd1d", originalTest8: originalTest.slice(originalTest.indexOf("test('8"), originalTest.indexOf("const history = on.histories")), rationaleDocument: "docs/pitch-sequence-state-foundation-v0.1.md", rationaleInference: "Sequence State is derived from persisted pitchHistory and does not acquire Save authority; the original test made Save source equality executable. No documented Receiver exception exists in this assertion." }, sourceChecks: checks, sourceCheckCount: checks.length, functionalFocusedChecksRun: 0, reachability: { currentWip: "prewrite saveGame and pre-default normalizeSave, with loadGame delegating to normalizeSave; read-only verified", frozenOriginal: "no prewrite receiver delegation or pre-default raw hook; post-normalization domain owners cannot meet required timing", directNormalize: "public top-level function bypasses ApplicationController/loadGame-only additions" }, plans: { A: "NOT FEASIBLE: no existing full-raw pre-default extension seam in original owner", B: "NOT FEASIBLE: original owner has no call/delegation to proposed Source adapter and direct normalizeSave remains unguarded", C: "SELECTED: preserve WIP; require explicit ownership/source-freeze contract revision; no implementation" }, forbiddenWorkaroundsNotImplemented: ["global rebinding/monkey patch", "toJSON/getter side effects", "Storage interception", "hidden raw Save global", "second writer", "post-normalization guard treated as raw guard", "altered original assertion/pinned commit"], safety: integrity() });
  console.log(JSON.stringify({ verdict: "C: BLOCKED", sourceContractAssertions: checks.length, functionalFocusedChecksRun: 0, productionDelta: 0 }));
}
function inheritance() {
  reserve("inherited-regression"); const b = json(prefix + "baseline-evidence.json"), rows = [];
  for (const label of ["career-save-final", "save-focused-final", "production-focused-final", "r3-guard-final", "focused-final", "legacy-final", "bbp-green-final", "first-base-current-final", "compatibility-final", "related-final", "gates-final"]) {
    const file = "docs/receiver-execution-v2-sprint-10a3b-r4-" + label + "-evidence.json", d = json(file);
    for (const [p, h] of Object.entries(d.frozenSourceHashes || {})) assert.equal(hash(read(p)), h, "Inherited source mismatch: " + p);
    assert.equal(hash(read(file)), b.hashes[file]);
    if (d.result?.file && d.result?.sourceHash) assert.equal(hash(read(d.result.file)), d.result.sourceHash);
    rows.push({ file, sha256: b.hashes[file], rerunInR5: false, sourceHashesVerified: d.frozenSourceHashes || null, result: d.result || null, results: d.results || null, passed: d.passed ?? null, focused: d.focused ?? null, summary: d.summary || null });
  }
  const oldFull = json("docs/receiver-execution-v2-sprint-10a3b-r4-full-repository-final-evidence.json");
  const failures = oldFull.results.filter(r => r.exitCode !== 0).map(r => ({ file: r.file, exitCode: r.exitCode, primaryFailure: r.stderr.match(/^(?:AssertionError \[ERR_ASSERTION\]|ReferenceError|Error):[^\n]*/m)?.[0] || null }));
  capture("inherited-regression", { rows, scope: "R4 unchanged-source bounded evidence only; not R5 reruns and not acceptance of any frozen-original workaround", historicalCompatibility: rows.find(r => r.file.includes("legacy-final")).result.historicalCompatibility, r5FunctionalFocusedChecks: 0, r5LegacyPairs: 0, r5HistoricalCases: 0, r5RelatedSuites: 0, r5FirstBaseRuns: 0, r5FullInvocations: 0, r5FullExecuted: 0, historicalFull: { file: "docs/receiver-execution-v2-sprint-10a3b-r4-full-repository-final-evidence.json", executed: oldFull.results.length, pass: oldFull.passed, existingDebt: oldFull.existingDebt, newRegressions: oldFull.newRegressions, notRun: oldFull.notRun.length, failures }, safety: integrity() });
  console.log(JSON.stringify({ inheritedEvidenceFiles: rows.length, r5RegressionRuns: 0, r5FullInvocations: 0, historicalFullExecuted: oldFull.results.length, historicalFailureFiles: failures.map(r => r.file) }));
}
module.exports = { root, baseline, pinned, prefix, pitch, read, json, hash, git, protectedPaths, capture, reserve, integrity, metadata, normalize };
if (require.main === module) { const action = process.argv[2]; if (action === "start") start(); else if (action === "red") red(); else if (action === "freeze") freeze(); else if (action === "contract") contract(); else if (action === "inheritance") inheritance(); else throw new Error("Unknown R5 audit action"); }
