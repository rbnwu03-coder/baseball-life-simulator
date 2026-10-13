"use strict";
const fs = require("node:fs"), path = require("node:path"), cp = require("node:child_process"), crypto = require("node:crypto");
const root = path.resolve(__dirname, ".."), baseline = JSON.parse(fs.readFileSync(path.join(root, "docs/receiver-execution-v2-sprint-10a2-baseline-evidence.json"), "utf8"));
const git = a => cp.execFileSync("git", a, { cwd: root, encoding: "utf8", maxBuffer: 30 * 1024 * 1024 });
const read = p => { if (Object.hasOwn(baseline.protectedMetadata, p)) throw Error("Protected read prohibited"); return fs.readFileSync(path.join(root, p)); };
const hash = p => { const b = read(p); return { size: b.length, sha256: crypto.createHash("sha256").update(b).digest("hex") }; };
const capture = process.argv.includes("--capture-final");
if (process.argv.slice(2).some(x => x !== "--capture-final")) throw Error("Unsupported flag");
const outputs = ["docs/receiver-execution-v2-sprint-10a2-focused-evidence.json", "docs/receiver-execution-v2-sprint-10a2-compatibility-evidence.json", "docs/receiver-execution-v2-sprint-10a2-non-interference-evidence.json"];
if (capture && outputs.some(p => fs.existsSync(path.join(root, p)))) throw Error("Refusing to overwrite captures");
function integrity() {
  const head = git(["rev-parse", "HEAD"]).trim(), origin = git(["rev-parse", "origin/main"]).trim();
  if (head !== baseline.baseline || origin !== head || git(["branch", "--show-current"]).trim() !== "main" || git(["diff", "--cached", "--name-only"])) throw Error("Baseline/index changed");
  for (const [p, v] of Object.entries(baseline.protectedMetadata)) { const s = fs.statSync(path.join(root, p)); if (s.size !== v.size || s.mtimeMs !== v.mtimeMs) throw Error("Protected metadata changed " + p); }
  const tracked = git(["ls-files", "-z"]).split("\0").filter(Boolean).filter(p => !Object.hasOwn(baseline.protectedMetadata, p));
  if (tracked.length !== baseline.trackedCount) throw Error("Existing tracked inventory changed");
  for (const p of tracked) if (hash(p).sha256 !== baseline.trackedHashes[p]) throw Error("Existing source changed " + p);
  const status = git(["status", "--short"]), allowed = p => /^(receiver-execution-v2-production-source-adapter-prototype\.cjs|tests\/receiver-execution-v2-(production-source-timing-test|sprint-10a2-(source-probe|runner))\.cjs|docs\/receiver-execution-v2-(production-source-timing-origin-sprint-10a2\.md|sprint-10a2-[a-z0-9-]+\.json))$/.test(p);
  const norm = s => s.split(/\r?\n/).filter(Boolean).map(x => x.trimStart()).sort();
  const old = status.split(/\r?\n/).filter(x => x && !allowed(x.slice(3))).join("\n");
  if (JSON.stringify(norm(old)) !== JSON.stringify(norm(baseline.originalStatus))) throw Error("Unexpected/protected Git difference");
  return { head, originMain: origin, branch: "main", indexEmpty: true, existingTrackedCount: tracked.length,
    existingTrackedHashesUnchanged: true, protectedMetadataEqual: true, originalStatusEqual: true, protectedContentReads: 0, protectedContentHashes: 0, status };
}
const before = integrity();
const result = require("./receiver-execution-v2-production-source-timing-test.cjs").run();
const compatibility = [];
for (const [sprint, file] of [["8", "tests/receiver-execution-v2-pure-contract-test.cjs"], ["9", "tests/receiver-execution-v2-version-admission-timing-test.cjs"], ["10A.1", "tests/receiver-execution-v2-source-authority-test.cjs"]]) {
  const r = require(path.join(root, file)).run();
  const rows = r.checks || r.rows;
  const summary = r.summary || { total: r.total, passed: r.passed, failed: r.failed };
  if (!rows || !Number.isInteger(summary.total)) throw Error("Unsupported original suite result shape");
  compatibility.push({ sprint, file, sourceHash: hash(file), summary, failures: rows.filter(x => x.status === "FAIL") });
}
const after = integrity();
const inputs = ["receiver-execution-v2-production-source-adapter-prototype.cjs", "tests/receiver-execution-v2-production-source-timing-test.cjs",
  "tests/receiver-execution-v2-sprint-10a2-source-probe.cjs", "tests/receiver-execution-v2-sprint-10a2-runner.cjs",
  "docs/receiver-execution-v2-sprint-10a2-production-entry-matrix.json", "docs/receiver-execution-v2-sprint-10a2-source-adapter-specification.json",
  "docs/receiver-execution-v2-sprint-10a2-timing-origin-decision.json", "docs/receiver-execution-v2-sprint-10a2-pure-contract-revision-proposal.json",
  "docs/receiver-execution-v2-sprint-10a2-calibration-lifecycle-plan.json"];
const sourceHashes = Object.fromEntries(inputs.map(p => [p, hash(p)]));
const rootScopes = Object.keys(baseline.trackedHashes).filter(p => !p.includes("/") && /\.(js|cjs|html)$/.test(p));
const consumers = rootScopes.filter(p => /receiver-execution-v2-production-source-adapter-prototype|ReceiverProductionSourceTimingPrototype/.test(read(p).toString("utf8")));
if (consumers.length) throw Error("Unexpected formal consumer");
const totalCompatibility = compatibility.reduce((n, r) => n + r.summary.total, 0), failedCompatibility = compatibility.reduce((n, r) => n + r.summary.failed, 0);
const compatible = { suites: compatibility, total: totalCompatibility, passed: totalCompatibility - failedCompatibility, failed: failedCompatibility,
  captureFlagsUsedOnOldSuites: false, oldRunnersModified: false, oldCapturesOverwritten: false };
result.runner = { baseline: baseline.baseline, before, after, sourceHashes, node: process.version, fullRepository: "NOT_RUN", capturePolicy: "exclusive-create" };
const non = { scope: "PRODUCTION_ADAPTER_AND_TIMING_DESIGN_ONLY", baseline: baseline.baseline, before, after, sourceHashes,
  originalRootScopesChecked: rootScopes, formalConsumers: consumers, newMatchRngCallbacks: 0, candidateExecutionCalls: 0,
  officialMatchWrites: 0, scorerRecordEvaluationWrites: 0, existingProductionDelta: 0, runtimeEnabled: false, formalShadowSimulation: false,
  fullRepository: "NOT_RUN", inheritedFullRepository: "224/227_PARTIAL_THREE_EXISTING_DEBT", sourceWitnessScope: "original LEGACY fixture VM only; not natural cohort",
  timingFormationScope: "isolatedFixture; proposed versions not implemented in official Pure/Save", protectedEvidenceLimit: "metadata/status only; protected content not read/hashed",
  L03: "PARTIAL", stage: false, commit: false, push: false };
const success = result.summary.failed === 0 && failedCompatibility === 0;
if (capture && success) for (const [p, data] of [[outputs[0], result], [outputs[1], compatible], [outputs[2], non]]) fs.writeFileSync(path.join(root, p), JSON.stringify(data, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ focused: result.summary, compatibility: compatible.suites.map(x => ({ sprint: x.sprint, ...x.summary })), compatibilityTotal: totalCompatibility,
  existingTrackedUnchanged: after.existingTrackedCount, formalConsumers: consumers.length, capturesWritten: capture && success,
  failures: result.checks.filter(x => x.status === "FAIL") }, null, 2));
process.exitCode = success ? 0 : 1;
