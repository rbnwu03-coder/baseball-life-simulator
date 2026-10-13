"use strict";
const fs = require("node:fs"), path = require("node:path"), cp = require("node:child_process"), crypto = require("node:crypto"), assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."), baseline = JSON.parse(fs.readFileSync(path.join(root, "docs/receiver-execution-v2-sprint-10a3a-baseline-evidence.json"), "utf8"));
const git = (...args) => cp.execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 30000000 });
const read = p => { if (Object.hasOwn(baseline.protectedMetadata, p)) throw Error("Protected read prohibited"); return fs.readFileSync(path.join(root, p)); };
const hash = p => { const bytes = read(p); return { size: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") }; };
const allowed = p => /^(receiver-execution-v2-2-foundation\.js|tests\/receiver-execution-v2-(2-contract-test|sprint-10a3a-(runner|browser-probe))\.cjs|docs\/receiver-execution-v2-(pure-contract-revision-sprint-10a3a\.md|sprint-10a3a-[a-z0-9-]+\.json))$/.test(p);
const norm = s => s.split(/\r?\n/).filter(Boolean).map(s => s.trimStart()).sort();
function integrity() {
  assert.equal(git("branch", "--show-current").trim(), "main"); assert.equal(git("rev-parse", "HEAD").trim(), baseline.baseline);
  assert.equal(git("rev-parse", "origin/main").trim(), baseline.baseline); assert.equal(git("diff", "--cached", "--name-only").trim(), "");
  for (const [p, v] of Object.entries(baseline.protectedMetadata)) { const st = fs.statSync(path.join(root, p)); assert.equal(st.size, v.size, p); assert.equal(st.mtimeMs, v.mtimeMs, p); }
  const paths = git("ls-files", "-z").split("\0").filter(p => p && !Object.hasOwn(baseline.protectedMetadata, p)); assert.equal(paths.length, baseline.trackedCount);
  for (const p of paths) assert.equal(hash(p).sha256, baseline.trackedHashes[p], p);
  const status = git("status", "--short", "--untracked-files=all"); assert.deepEqual(norm(status).filter(line => !allowed(line.slice(3))), norm(baseline.originalStatus));
  return { branch: "main", head: baseline.baseline, originMain: baseline.baseline, indexEmpty: true, existingReadableTrackedCount: paths.length,
    existingTrackedHashesUnchanged: true, protectedCount: Object.keys(baseline.protectedMetadata).length, protectedMetadataEqual: true,
    originalStatusEqual: true, protectedContentReads: 0, protectedContentHashes: 0, status };
}
const capture = process.argv.includes("--capture-final");
if (process.argv.slice(2).some(x => x !== "--capture-final")) throw Error("Unsupported flag");
const outputs = ["focused", "compatibility", "non-interference"].map(p => "docs/receiver-execution-v2-sprint-10a3a-" + p + "-evidence.json");
if (capture && outputs.some(p => fs.existsSync(path.join(root, p)))) throw Error("Refusing to overwrite captures");
const before = integrity(), result = require("./receiver-execution-v2-2-contract-test.cjs").run(), compatibility = [];
for (const [sprint, file] of [["8", "receiver-execution-v2-pure-contract-test.cjs"], ["9", "receiver-execution-v2-version-admission-timing-test.cjs"], ["10A.1", "receiver-execution-v2-source-authority-test.cjs"], ["10A.2", "receiver-execution-v2-production-source-timing-test.cjs"]]) {
  const r = require("./" + file).run(), summary = r.summary || { total: r.total, passed: r.passed, failed: r.failed };
  assert(Number.isInteger(summary.total)); compatibility.push({ sprint, file: "tests/" + file, sourceHash: hash("tests/" + file), summary, failures: (r.rows || r.checks).filter(x => x.status === "FAIL") });
}
const after = integrity(), inputs = ["receiver-execution-v2-2-foundation.js", "tests/receiver-execution-v2-2-contract-test.cjs", "tests/receiver-execution-v2-sprint-10a3a-runner.cjs", "tests/receiver-execution-v2-sprint-10a3a-browser-probe.cjs"];
const sourceHashes = Object.fromEntries(inputs.map(p => [p, hash(p)]));
const rootScope = Object.keys(baseline.trackedHashes).filter(p => !p.includes("/") && /\.(js|cjs|html)$/.test(p));
const consumers = rootScope.filter(p => /receiver-execution-v2-2-foundation|ReceiverExecutionV22Foundation/.test(read(p).toString("utf8"))); assert.equal(consumers.length, 0);
const graph = JSON.parse(read("docs/receiver-execution-v2-sprint-10a3a-architecture-evidence.json")), sourceVerification = [];
for (const node of [...graph.traces, ...graph.additionalTraces].map(x => x.snippet).concat(graph.savePages)) {
  const s = node.structuredContent || JSON.parse(node.content.find(c => c.type === "text").text);
  const relative = path.relative(root, s.file_path).replace(/\\/g, "/"), disk = read(relative).toString("utf8").replace(/\r\n/g, "\n").split("\n").slice(s.start_line - 1, s.end_line).join("\n") + "\n";
  assert.equal(disk, s.source, relative + ":" + s.start_line); sourceVerification.push({ path: relative, start: s.start_line, end: s.end_line, currentDiskMatches: true });
}
const compatible = { suites: compatibility, total: compatibility.reduce((n, r) => n + r.summary.total, 0), passed: compatibility.reduce((n, r) => n + r.summary.passed, 0),
  failed: compatibility.reduce((n, r) => n + r.summary.failed, 0), oldSourceChanged: false, oldCapturesOverwritten: false, oldFixturesAssertionsSeedsChanged: false, oldCaptureFlagsUsed: false };
result.runner = { baseline: baseline.baseline, node: process.version, sourceHashes, capturePolicy: "exclusive-create", fullRepository: "NOT_RUN" };
const non = { baseline: baseline.baseline, before, after, sourceHashes, sourceVerification, rootScopesChecked: rootScope, formalConsumers: consumers, runtimeEnabled: false,
  existingProductionDelta: 0, newMatchRngCallbacks: 0, officialMatchRecordEvaluationWrites: 0, formalSaveSchemaChanged: false, formalShadowSimulation: false,
  fullRepository: "NOT_RUN", inheritedFullRepository: "224/227_PARTIAL_THREE_EXISTING_DEBT", boundedScope: "new isolated pure execution and unchanged old suites; not formal v2 runtime Save acceptance",
  protectedPreservation: "metadata/status only; no protected content reads or hashes", L03: "PARTIAL", stage: false, commit: false, push: false };
const success = result.summary.failed === 0 && compatible.failed === 0;
if (capture && success) for (const [i, data] of [result, compatible, non].entries()) fs.writeFileSync(path.join(root, outputs[i]), JSON.stringify(data, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ focused: result.summary, gradientRows: result.gradientRows, compatibility: compatibility.map(r => ({ sprint: r.sprint, ...r.summary })), compatibilityTotal: compatible.total,
  oldTrackedHashes: after.existingReadableTrackedCount, sourceSnippetPages: sourceVerification.length, formalConsumers: consumers.length, capturesWritten: capture && success, failures: result.checks.filter(x => x.status === "FAIL") }, null, 2));
if (!success) process.exitCode = 1;
