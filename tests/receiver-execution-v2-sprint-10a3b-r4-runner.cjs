"use strict";
const fs = require("node:fs"), path = require("node:path"), os = require("node:os"), cp = require("node:child_process"), assert = require("node:assert/strict");
const P = require("./receiver-execution-v2-sprint-10a3b-r3-runner.cjs");
const { root, baseline, hash, git, protectedPaths, read, json, wrapper } = P;
const prefix = "docs/receiver-execution-v2-sprint-10a3b-r4-", BBP = "tests/bbp-b1-ground-ball-production-integration-test.js";
const captureSuffix = process.argv.includes("--final") ? "-final" : "";
function reserve(label) { const p = prefix + label + captureSuffix + "-evidence.json"; assert(!fs.existsSync(path.join(root, p)), "Existing capture: " + p); return p; }
function capture(label, data) { const p = reserve(label); fs.writeFileSync(path.join(root, p), JSON.stringify({ sprint: "10A.3b-R4", baseline, createdAt: new Date().toISOString(), node: process.version, ...data }, null, 2) + "\n", { flag: "wx" }); return p; }
function gitState() { return { branch: git("branch", "--show-current").trim(), head: git("rev-parse", "HEAD").trim(), originMain: git("rev-parse", "origin/main").trim(), index: git("diff", "--cached", "--name-only").trim(), status: git("status", "--short") }; }
function metadata() { return Object.fromEntries([...protectedPaths].map(p => { const s = fs.statSync(path.join(root, p)); return [p, { size: s.size, mtimeMs: s.mtimeMs }]; })); }
function start() {
  reserve("baseline"); reserve("source-before"); const state = gitState(); assert.equal(state.branch, "main"); assert.equal(state.head, baseline); assert.equal(state.originMain, baseline); assert.equal(state.index, "");
  const files = git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(p => p && !protectedPaths.has(p) && !p.includes("-10a3b-r4-"));
  const hashes = Object.fromEntries(files.map(p => [p, hash(read(p))])), delivery = json("docs/receiver-execution-v2-sprint-10a3b-r3-delivery-evidence.json"), old = json("docs/receiver-execution-v2-sprint-10a3b-r3-baseline-evidence.json");
  for (const [p, h] of Object.entries(delivery.hashes)) assert.equal(hashes[p], h, "R3 delivery changed: " + p);
  for (const [p, h] of Object.entries(old.hashes)) assert.equal(hashes[p], p === "receiver-source-snapshot.js" ? delivery.finalSourceHash : h, "Prior WIP changed: " + p);
  capture("baseline", { git: state, hashes, protectedMetadata: metadata(), protectedContentReadOrHashed: false });
  capture("source-before", { script: read("script.js").toString("utf8"), scriptHash: hashes["script.js"], receiverSourceHash: hashes["receiver-source-snapshot.js"] });
  console.log(JSON.stringify({ baselineFiles: files.length, protectedPaths: protectedPaths.size, head: state.head, indexEmpty: true }));
}
function integrity() {
  const b = json(prefix + "baseline-evidence.json"), changed = Object.entries(b.hashes).filter(([p, h]) => hash(read(p)) !== h).map(([p]) => p);
  assert(changed.every(p => ["script.js", "receiver-source-snapshot.js"].includes(p))); const state = gitState(); assert.equal(state.branch, "main"); assert.equal(state.head, baseline); assert.equal(state.originMain, baseline); assert.equal(state.index, ""); assert.deepEqual(metadata(), b.protectedMetadata);
  return { changedExistingPaths: changed, preservedHashCount: Object.keys(b.hashes).length - changed.length, protectedMetadataUnchanged: true, protectedContentReadOrHashed: false, git: state };
}
function runSuite(file, full = false, cwd = root, timeoutMs = 120000) {
  assert(/^tests\/[A-Za-z0-9_-]+\.(js|cjs)$/.test(file) && !protectedPaths.has(file)); const args = full ? ["-e", wrapper, path.resolve(cwd, file)] : [file], maxBuffer = full ? 30000000 : 16000000, t = process.hrtime.bigint();
  const r = cp.spawnSync(process.execPath, args, { cwd, encoding: "utf8", windowsHide: true, maxBuffer, timeout: full ? 180000 : timeoutMs });
  return { file, command: [process.execPath, ...args], cwd, nodeExecutable: process.execPath, nodeVersion: process.version, timeoutMs: full ? 180000 : timeoutMs, maxBuffer,
    environment: { NODE_OPTIONS: process.env.NODE_OPTIONS || null, NODE_PATH: process.env.NODE_PATH || null, TZ: process.env.TZ || null }, elapsedMs: Number(process.hrtime.bigint() - t) / 1e6, exitCode: r.status, signal: r.signal,
    error: r.error ? { code: r.error.code, message: r.error.message } : null, stdout: r.stdout || "", stderr: r.stderr || "", sourceHash: hash(read(file)) };
}
function materializeBBP(mode) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "receiver-r4-bbp-" + mode + "-")), test = read(BBP), list = test.toString().match(/const runtimeFiles = \[([\s\S]*?)\];/)[1];
  const files = [BBP, ...[...list.matchAll(/"([^"]+)"/g)].map(x => x[1])], hashes = {};
  for (const p of files) { assert(!protectedPaths.has(p)); const bytes = mode === "baseline" && p !== BBP ? Buffer.from(git("show", baseline + ":" + p)) : read(p), dest = path.resolve(dir, p); assert(dest.startsWith(dir + path.sep)); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, bytes, { flag: "wx" }); hashes[p] = hash(bytes); }
  assert.equal(test.toString().replace(/\r\n/g, "\n"), git("show", baseline + ":" + BBP).replace(/\r\n/g, "\n")); return { dir, hashes, files };
}
function focusedSuite(file, options) {
  const t = process.hrtime.bigint(); let result, error = null; try { result = require(path.join(root, file)).run(options); } catch (e) { error = { message: e.message, stack: e.stack }; }
  return { file, sourceHash: hash(read(file)), elapsedMs: Number(process.hrtime.bigint() - t) / 1e6, summary: result?.summary || (result ? { total: result.total, passed: result.passed, failed: result.failed } : { total: 0, passed: 0, failed: 1 }),
    error, checks: result?.checks, historicalCompatibility: result?.historicalCompatibility, rows: result?.rows, witnesses: result?.witnesses, candidateExecutionCalls: result?.candidateExecutionCalls, runtimeEnabled: result?.runtimeEnabled };
}
module.exports = { root, baseline, prefix, BBP, read, json, hash, git, protectedPaths, capture, reserve, integrity, runSuite, materializeBBP, focusedSuite, wrapper };
function sourceHashes() { return Object.fromEntries(["index.html", "script.js", "save.js", "match-situation-lifecycle.js", "receiver-source-snapshot.js"].map(p => [p, hash(read(p))])); }
function gates() {
  const labels = ["focused", "bbp-green", "bbp-baseline", "bbp-current", "bbp-comparison", "r3-guard", "gradient", "career-save", "production-focused", "save-focused", "legacy", "related", "compatibility", "s8-cross-runtime", "first-base-current", "gates", "source-change"];
  labels.forEach(reserve); integrity(); const frozenSourceHashes = sourceHashes();
  const before = json(prefix + "source-before-evidence.json"); capture("source-change", { beforeScriptSha256: before.scriptHash, afterScriptSha256: frozenSourceHashes["script.js"], beforeScript: before.script, afterScript: read("script.js").toString(), receiverSourceUnchanged: before.receiverSourceHash === frozenSourceHashes["receiver-source-snapshot.js"] });
  function save(label, data) { assert.deepEqual(sourceHashes(), frozenSourceHashes); capture(label, { ...data, frozenSourceHashes }); }
  function fail(label, data) { save(label, data); capture("gates", { passed: false, stoppedAt: label, frozenSourceHashes, safety: integrity() }); process.exitCode = 1; return false; }
  const focus = focusedSuite("tests/receiver-execution-v2-sprint-10a3b-r4-dependency-test.cjs"); if (focus.error || focus.summary.failed) return fail("focused", { result: focus }); save("focused", { result: focus }); console.log(JSON.stringify({ gate: "R4 focused", summary: focus.summary }));
  const green = runSuite(BBP); if (green.exitCode !== 0 || green.error) return fail("bbp-green", { result: green }); save("bbp-green", { result: green }); console.log(JSON.stringify({ gate: "BBP-B1 original", exitCode: green.exitCode }));
  const pair = []; for (const mode of ["baseline", "current"]) { const tree = materializeBBP(mode), row = runSuite(BBP, false, tree.dir); row.materializedSourceHashes = tree.hashes; pair.push(row); save("bbp-" + mode, { result: row }); }
  const equal = pair.every(x => x.exitCode === 0 && !x.error) && pair[0].stdout === pair[1].stdout && pair[0].stderr === pair[1].stderr && pair[0].sourceHash === pair[1].sourceHash;
  if (!equal) return fail("bbp-comparison", { results: pair, passed: false }); save("bbp-comparison", { passed: true, results: pair, fullOutputEqual: true, originalFixtureAndRuntimeFilesUnchanged: true }); console.log(JSON.stringify({ gate: "BBP baseline/WIP", passed: true }));
  const guard = focusedSuite("tests/receiver-execution-v2-sprint-10a3b-r3-guard-test.cjs"); if (guard.error || guard.summary.failed) return fail("r3-guard", { result: guard }); save("r3-guard", { result: guard }); console.log(JSON.stringify({ gate: "R3 guard", summary: guard.summary }));
  const old = json("docs/infield-legacy-receiver-model-sprint-6-validation-final.json"), gradient = runSuite("tests/ability-performance-gradient-test.js"), debt = old.debtVerification.find(x => x.file === gradient.file);
  gradient.originalDebtReproduced = gradient.exitCode === 1 && !gradient.error && gradient.stderr.includes(debt.signature); gradient.baselineStderr = old.results.find(x => x.file === gradient.file).stderr;
  if (!gradient.originalDebtReproduced) return fail("gradient", { result: gradient }); save("gradient", { result: gradient }); console.log(JSON.stringify({ gate: "gradient", originalDebtReproduced: true }));
  const career = runSuite("tests/career-save-admission-test.js"); if (career.exitCode !== 0 || career.error) return fail("career-save", { result: career }); save("career-save", { result: career }); console.log(JSON.stringify({ gate: "Career Save", exitCode: career.exitCode }));
  for (const [label, file] of [["production-focused", "tests/receiver-execution-v2-production-snapshot-save-test.cjs"], ["save-focused", "tests/receiver-execution-v2-sprint-10a3b-r1-save-test.cjs"], ["legacy", "tests/receiver-execution-v2-sprint-10a3b-legacy-comparison.cjs"]]) {
    const result = focusedSuite(file); if (result.error || result.summary.failed) return fail(label, { result }); save(label, { result }); console.log(JSON.stringify({ gate: label, summary: result.summary, historical: result.historicalCompatibility?.total }));
  }
  const relatedFiles = ["tests/infield-scorer-recovery-integrity-repair-test.js", "tests/infield-legacy-receiver-scorer-closeout-test.js", "tests/infield-legacy-receiver-model-foundation-test.js", "tests/match-full-game-record-test.js", "tests/ss-defensive-production-integration-test.js", "tests/defensive-decision-throw-production-integration-test.js", "tests/shared-infield-contract-2b-production-integration-test.js", "tests/third-base-ground-production-integration-test.js", "tests/force-advancement-foundation-test.js", "tests/defensive-runner-throw-settlement-foundation-test.js", "tests/match-experience-development-foundation-v1-test.js", "tests/ground-defensive-decision-identity-production-integration-test.js", "tests/ground-ball-defensive-settlement-lifecycle-regression-test.js", "tests/pitch-production-source-scope-test.js", "tests/match-situation-lifecycle-test.js", "tests/ground-settlement-handoff-r2-production-integration-test.js", "tests/force-multi-runner-settlement-production-integration-test.js"];
  const related = []; for (const file of relatedFiles) { const row = runSuite(file); related.push(row); console.log(JSON.stringify({ gate: "related", file, exitCode: row.exitCode, elapsedMs: row.elapsedMs })); if (row.exitCode !== 0 || row.error) return fail("related", { results: related, complete: false }); } save("related", { results: related, complete: true });
  const compatibility = []; for (const file of ["tests/receiver-execution-v2-2-contract-test.cjs", "tests/receiver-execution-v2-pure-contract-test.cjs", "tests/receiver-execution-v2-version-admission-timing-test.cjs", "tests/receiver-execution-v2-source-authority-test.cjs", "tests/receiver-execution-v2-production-source-timing-test.cjs"]) {
    const result = focusedSuite(file); compatibility.push(result); console.log(JSON.stringify({ gate: "compatibility", file, summary: result.summary })); if (result.error || result.summary.failed) return fail("compatibility", { results: compatibility, complete: false });
  } save("compatibility", { results: compatibility, complete: true });
  const S8 = require("./receiver-execution-v2-sprint-8-runner.cjs"), pure = require("./receiver-execution-v2-pure-contract-test.cjs").run(), schema = S8.schema();
  const schemaRows = pure.cases.map(x => { assert(S8.conforms(x.sealed.input, schema.$defs.input, schema.$defs)); assert(S8.conforms(x.execution, schema.$defs.execution, schema.$defs)); return { name: x.name, input: "PASS", output: "PASS" }; });
  let cross; try { cross = S8.crossRuntime(); } catch (e) { return fail("s8-cross-runtime", { schemaRows, error: { message: e.message, stack: e.stack } }); }
  save("s8-cross-runtime", { schemaRows, crossRuntime: cross, historicalRunnerCaptureOrIntegrityCalled: false }); console.log(JSON.stringify({ gate: "S8 schema/cross-runtime", schemaRows: schemaRows.length, status: cross.status }));
  const first = runSuite("tests/first-base-receive-active-ground-production-integration-test.js", false, root, 180000), summaryLine = first.stdout.split(/\r?\n/).find(x => x.startsWith('{"suite":"first-base-receive-active-ground-production-integration"'));
  first.summary = summaryLine ? JSON.parse(summaryLine) : null; const fb = json("docs/receiver-execution-v2-sprint-10a3b-r2-first-base-baseline-evidence.json").result;
  first.fullOutputEqualR2Baseline = first.stdout === fb.stdout && first.stderr === fb.stderr;
  if (first.exitCode !== 0 || first.error || first.summary?.passed !== 42 || first.summary?.failed !== 0 || !first.fullOutputEqualR2Baseline) return fail("first-base-current", { result: first });
  save("first-base-current", { result: first, baselineInheritedFrom: "R2 baseline180; no new baseline execution" }); console.log(JSON.stringify({ gate: "first-base180", summary: first.summary, elapsedMs: first.elapsedMs }));
  capture("gates", { passed: true, frozenSourceHashes, safety: integrity(), order: labels });
}
function full() {
  reserve("full-repository"); const gate = json(prefix + "gates" + captureSuffix + "-evidence.json"); assert(gate.passed); assert.deepEqual(sourceHashes(), gate.frozenSourceHashes); integrity();
  const runtimeInvestigation = json(prefix + "runtime-investigation" + captureSuffix + "-evidence.json");
  assert(runtimeInvestigation.fullAllowed, "First-base runtime investigation unresolved"); assert.deepEqual(runtimeInvestigation.frozenSourceHashes, gate.frozenSourceHashes);
  const old = json("docs/infield-legacy-receiver-model-sprint-6-validation-final.json"), files = old.files;
  assert.equal(files.length, 227); assert.equal(new Set(files).size, 227); assert.equal(hash(JSON.stringify(files)), "871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96");
  for (const p of files) assert(!protectedPaths.has(p)); const testHashesBefore = Object.fromEntries(files.map(p => [p, hash(read(p))])), results = [], startedAt = new Date().toISOString();
  const primary = text => text.split(/\r?\n/).find(x => /^(AssertionError|ReferenceError|TypeError|Error)(?:\b|:)/.test(x)) || null;
  for (const [i, file] of files.entries()) {
    const row = runSuite(file, true), prior = old.results.find(x => x.file === file), debt = old.debtVerification.find(x => x.file === file);
    row.baselineExitCode = prior.exitCode; row.debtSignature = debt?.signature || null; row.primaryError = primary(row.stderr); row.baselinePrimaryError = primary(prior.stderr);
    row.existingDebt = Boolean(debt && row.exitCode === prior.exitCode && !row.error && row.stderr.includes(debt.signature) && row.primaryError === row.baselinePrimaryError && (!file.includes("high-school-year-one-opportunity-two") || row.stderr.includes("buildHighSchoolShortstopExecution")));
    row.status = row.error || row.exitCode !== prior.exitCode ? "NEW_REGRESSION" : row.exitCode === 0 ? "PASS" : row.existingDebt ? "EXISTING_DEBT" : "NEW_REGRESSION";
    results.push(row); console.log(JSON.stringify({ index: i + 1, file, exitCode: row.exitCode, status: row.status, elapsedMs: row.elapsedMs, error: row.error })); if (row.status === "NEW_REGRESSION") break;
  }
  assert.deepEqual(sourceHashes(), gate.frozenSourceHashes); for (const [p, h] of Object.entries(testHashesBefore)) assert.equal(hash(read(p)), h);
  const complete = results.length === files.length, newRegressions = results.filter(x => x.status === "NEW_REGRESSION").length;
  capture("full-repository", { startedAt, finishedAt: new Date().toISOString(), files, manifestSha256: hash(JSON.stringify(files)), wrapper, timeoutMs: 180000, maxBuffer: 30000000, testHashesBefore, results, complete,
    passed: results.filter(x => x.status === "PASS").length, existingDebt: results.filter(x => x.status === "EXISTING_DEBT").length, newRegressions, notRun: files.slice(results.length), baselineDebt: old.results.filter(x => x.exitCode !== 0), frozenSourceHashes: gate.frozenSourceHashes, safety: integrity() });
  console.log(JSON.stringify({ complete, executed: results.length, newRegressions })); if (!complete || newRegressions) process.exitCode = 1;
}
if (require.main === module) { if (process.argv[2] === "baseline") start(); else if (process.argv[2] === "red") {
  reserve("red"); assert.deepEqual(integrity().changedExistingPaths, []); const result = require("./receiver-execution-v2-sprint-10a3b-r4-dependency-test.cjs").red(); capture("red", { result, safety: integrity() }); console.log(JSON.stringify(result));
} else if (process.argv[2] === "gates") gates(); else if (process.argv[2] === "full") full(); else throw Error("Explicit R4 mode required"); }
