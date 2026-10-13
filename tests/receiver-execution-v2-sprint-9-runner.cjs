"use strict";
const fs = require("node:fs"), path = require("node:path"), cp = require("node:child_process"), crypto = require("node:crypto");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const baselinePath = "docs/receiver-execution-v2-sprint-9-baseline-evidence.json";
const sha = v => crypto.createHash("sha256").update(v).digest("hex");
const read = p => fs.readFileSync(path.join(root, p));
const git = args => cp.execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 30e6 }).trim();
const newPaths = [
  "receiver-execution-v2-admission-timing-foundation.js",
  "tests/receiver-execution-v2-version-admission-timing-test.cjs",
  "tests/receiver-execution-v2-sprint-9-legacy-comparison.cjs",
  "tests/receiver-execution-v2-sprint-9-runner.cjs",
  "docs/receiver-execution-v2-version-admission-timing-seam-sprint-9.md",
  "docs/receiver-execution-v2-sprint-9-baseline-evidence.json",
  "docs/receiver-execution-v2-sprint-9-architecture-evidence.json",
  "docs/receiver-execution-v2-sprint-9-pure-architecture-evidence.json",
  "docs/receiver-execution-v2-sprint-9-contract-specification.json",
  "docs/receiver-execution-v2-sprint-9-red-source-evidence.json",
  "docs/receiver-execution-v2-sprint-9-initial-test-evidence.json",
  "docs/receiver-execution-v2-sprint-9-coverage-evidence.json",
  "docs/receiver-execution-v2-sprint-9-legacy-regression-evidence.json"
];
const captures = {
  focused: "docs/receiver-execution-v2-sprint-9-focused-evidence.json",
  comparison: "docs/receiver-execution-v2-sprint-9-legacy-comparison-evidence.json",
  integrity: "docs/receiver-execution-v2-sprint-9-non-interference-evidence.json",
  closeout: "docs/receiver-execution-v2-sprint-9-closeout-evidence.json"
};
function integrity(extraPaths = []) {
  const start = JSON.parse(read(baselinePath));
  const protectedPaths = Object.keys(start.protectedMetadata);
  const tracked = git(["ls-files", "-z"]).split("\0").filter(Boolean);
  assert.deepEqual(tracked.filter(p => !protectedPaths.includes(p)).sort(), Object.keys(start.trackedHashes).sort());
  for (const [p, hash] of Object.entries(start.trackedHashes)) assert.equal(sha(read(p)), hash, "Existing tracked content changed: " + p);
  const metadata = Object.fromEntries(protectedPaths.map(p => { const s = fs.statSync(path.join(root, p)); return [p, { size: s.size, mtimeMs: s.mtimeMs }]; }));
  assert.deepEqual(metadata, start.protectedMetadata);
  assert.equal(git(["rev-parse", "HEAD"]), start.head);
  assert.equal(git(["rev-parse", "origin/main"]), start.head);
  assert.equal(git(["branch", "--show-current"]), "main");
  assert.equal(git(["diff", "--cached", "--name-only"]), "");
  const allowed = new Set([...newPaths, ...Object.values(captures), ...extraPaths]);
  const originalStatus = start.status.split(/\r?\n/);
  const currentStatus = git(["status", "--short"]);
  const unexpectedStatus = currentStatus.split(/\r?\n/).filter(line => !originalStatus.includes(line) && !allowed.has(line.slice(3)));
  assert.deepEqual(unexpectedStatus, [], "Unknown worktree difference");
  for (const line of originalStatus) assert(currentStatus.split(/\r?\n/).includes(line), "Protected original status changed: " + line);
  const references = [];
  for (const p of tracked.filter(p => /\.(js|cjs|html)$/.test(p) && !protectedPaths.includes(p)))
    if (/receiver-execution-v2-admission-timing-foundation|ReceiverExecutionV2AdmissionTiming/.test(read(p).toString("utf8"))) references.push(p);
  assert.deepEqual(references, []);
  const moduleText = read(newPaths[0]).toString("utf8");
  assert.deepEqual([...moduleText.matchAll(/require\(["']([^"']+)["']\)/g)].map(r => r[1]), ["./receiver-execution-v2-foundation.js"]);
  assert(!/Math\.random|nextHighSchoolMatchSimulationRandom|registerPositionDecisionFamily|MatchGameRecord|applyInfieldResolution|applyRoutineDefensiveResolution/.test(moduleText));
  const snippets = JSON.parse(read(newPaths[6])).snippets;
  const pureRows = JSON.parse(read(newPaths[7])).rows.filter(r => typeof r?.source === "string");
  const sourceVerifications = [...snippets, ...pureRows].map(s => {
    const relative = path.relative(root, s.file_path).replace(/\\/g, "/");
    assert(!protectedPaths.includes(relative));
    const disk = read(relative).toString("utf8").replace(/\r\n/g, "\n").split("\n").slice(s.start_line - 1, s.end_line).join("\n").replace(/\n$/, "");
    assert.equal(disk, s.source.replace(/\r\n/g, "\n").replace(/\n$/, ""), "Graph/current source mismatch: " + s.name);
    return { path: relative, symbol: s.name, lines: [s.start_line, s.end_line], matches: true, sha256: sha(disk) };
  });
  const files = [...newPaths, ...extraPaths].filter(p => fs.existsSync(path.join(root, p))).map(p => {
    const buffer = read(p), text = buffer.toString("utf8");
    assert(!/[\t ]+$/m.test(text), "Trailing whitespace: " + p);
    assert(!/\n\s*\n$/.test(text), "Blank line at EOF: " + p);
    if (p.endsWith(".json")) JSON.parse(text);
    return { path: p, bytes: buffer.length, sha256: sha(buffer) };
  });
  cp.execFileSync("git", ["diff", "--check", "--", ...Object.keys(start.trackedHashes)], { cwd: root, windowsHide: true });
  return { scope: "EXISTING_LEGACY_BYTES_AND_UNLOADED_SAFETY_MODULE", baseline: start.head, trackedHashCount: Object.keys(start.trackedHashes).length,
    existingTrackedDelta: 0, protectedContentRead: false, protectedContentHashed: false, protectedMetadata: metadata,
    oldProductionReferences: references, onlyDependency: "receiver-execution-v2-foundation.js", sourceVerifications,
    gitDiffCheckExit: 0, whitespaceCheck: "all new text paths", files, head: git(["rev-parse", "HEAD"]), originMain: git(["rev-parse", "origin/main"]), index: "", status: currentStatus,
    formalRuntimeEnabled: false, formalSaveSchemaChanged: false, modelRegistration: false, fullRepositoryRun: false };
}
function run() {
  const focused = require("./receiver-execution-v2-version-admission-timing-test.cjs").run();
  assert.equal(focused.failed, 0, JSON.stringify(focused));
  const comparison = require("./receiver-execution-v2-sprint-9-legacy-comparison.cjs").run();
  assert.equal(comparison.summary.failed, 0);
  return { focused, comparison, integrity: integrity() };
}
function captureFinal() {
  // Exclusive creation; preflight the entire capture set before doing any work.
  for (const p of Object.values(captures)) assert(!fs.existsSync(path.join(root, p)), "Immutable capture already exists: " + p);
  const result = run();
  for (const k of ["focused", "comparison", "integrity"]) fs.writeFileSync(path.join(root, captures[k]), JSON.stringify(result[k], null, 2) + "\n", { flag: "wx" });
  const finalIntegrity = integrity(Object.values(captures).filter(p => p !== captures.closeout));
  const closeout = { scope: "SPRINT_9_ISOLATED_SAFETY_FOUNDATION_NOT_PRODUCTION_V2_SAVE", ...finalIntegrity,
    focused: { total: result.focused.total, passed: result.focused.passed, failed: result.focused.failed }, legacyPairs: result.comparison.summary,
    inheritedFullRepository: "224/227 PARTIAL; three unchanged Baseline Debt; NOT rerun", l03: "PARTIAL",
    candidateSave: { pending: "isolated serialization only", executed: "NOT_IMPLEMENTED", settled: "NOT_IMPLEMENTED", normalizeSave: "NOT_CONNECTED" },
    stageCommitPushPerformedInSprint9: false };
  fs.writeFileSync(path.join(root, captures.closeout), JSON.stringify(closeout, null, 2) + "\n", { flag: "wx" });
  return { focused: closeout.focused, legacyPairs: closeout.legacyPairs, trackedHashCount: closeout.trackedHashCount, capturePaths: captures };
}
module.exports = { run, integrity, captureFinal, newPaths, captures };
if (require.main === module) {
  const result = process.argv.includes("--capture-final") ? captureFinal() : run();
  console.log(JSON.stringify(process.argv.includes("--capture-final") ? result : { focused: { total: result.focused.total, passed: result.focused.passed, failed: result.focused.failed },
    comparison: result.comparison.summary, trackedHashCount: result.integrity.trackedHashCount, existingTrackedDelta: result.integrity.existingTrackedDelta }, null, 2));
}
