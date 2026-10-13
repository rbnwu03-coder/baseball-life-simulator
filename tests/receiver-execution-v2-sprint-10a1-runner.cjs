"use strict";
// Captures are exclusive-create. No original evidence or runtime object is writable here.
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const Test = require("./receiver-execution-v2-source-authority-test.cjs");
const root = path.resolve(__dirname, "..");
const baselinePath = "docs/receiver-execution-v2-sprint-10a1-baseline-evidence.json";
const outputs = ["docs/receiver-execution-v2-sprint-10a1-focused-evidence.json", "docs/receiver-execution-v2-sprint-10a1-non-interference-evidence.json"];
const read = p => fs.readFileSync(path.join(root, p));
const hash = p => { const b = read(p); return { size: b.length, sha256: crypto.createHash("sha256").update(b).digest("hex") }; };
const git = args => cp.execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 30 * 1024 * 1024 });
const baseline = JSON.parse(read(baselinePath));
const capture = process.argv.includes("--capture-final");
if (process.argv.slice(2).some(x => x !== "--capture-final")) throw Error("Unsupported runner flag");
if (capture && outputs.some(p => fs.existsSync(path.join(root, p)))) throw Error("Refusing to overwrite existing captures");
function checkBaseline() {
  const branch = git(["branch", "--show-current"]).trim(), head = git(["rev-parse", "HEAD"]).trim(), origin = git(["rev-parse", "origin/main"]).trim();
  if (branch !== "main" || head !== baseline.baseline || origin !== head || git(["diff", "--cached", "--name-only"])) throw Error("Baseline/index mismatch");
  for (const [p, original] of Object.entries(baseline.protectedMetadata)) {
    const s = fs.statSync(path.join(root, p)); if (s.size !== original.size || s.mtimeMs !== original.mtimeMs) throw Error("Protected metadata changed " + p);
  }
  const tracked = git(["ls-files", "-z"]).split("\0").filter(Boolean).filter(p => !Object.hasOwn(baseline.protectedMetadata, p));
  if (tracked.length !== baseline.trackedCount) throw Error("Existing tracked inventory changed");
  for (const p of tracked) if (hash(p).sha256 !== baseline.trackedHashes[p]) throw Error("Existing bytes changed " + p);
  const status = git(["status", "--short"]);
  const newAllowed = p => /^(receiver-execution-v2-source-authority-foundation\.js|tests\/receiver-execution-v2-(source-authority-test|sprint-10a1-runner)\.cjs|docs\/receiver-execution-v2-(sprint-10a1-[A-Za-z0-9-]+\.json|source-authority-foundation-sprint-10a1\.md))$/.test(p);
  const old = status.split(/\r?\n/).filter(l => l && !newAllowed(l.slice(3))).map(l => l.trimStart()).sort();
  const expected = baseline.originalStatus.split(/\r?\n/).filter(Boolean).map(l => l.trimStart()).sort();
  if (JSON.stringify(old) !== JSON.stringify(expected)) throw Error("Unexpected or protected Git difference");
  return { branch, head, originMain: origin, indexEmpty: true, readableTrackedCount: tracked.length,
    allReadableTrackedHashesUnchanged: true, protectedCount: Object.keys(baseline.protectedMetadata).length,
    protectedContentReads: 0, protectedContentHashes: 0, protectedMetadataEqual: true, originalStatusEqual: true, status };
}
const before = checkBaseline();
const result = Test.run();
const after = checkBaseline();
const inputs = ["receiver-execution-v2-source-authority-foundation.js", "tests/receiver-execution-v2-source-authority-test.cjs",
  "tests/receiver-execution-v2-sprint-10a1-runner.cjs", "docs/receiver-execution-v2-sprint-10a1-source-authority-contract.json"];
const sourceHashes = Object.fromEntries(inputs.map(p => [p, hash(p)]));
const rootScopes = Object.keys(baseline.trackedHashes).filter(p => !p.includes("/") && /\.(js|html)$/.test(p));
const formalConsumers = [];
for (const p of rootScopes) {
  const text = read(p).toString("utf8");
  if (/receiver-execution-v2-source-authority-foundation|ReceiverExecutionV2SourceAuthority/.test(text)) formalConsumers.push(p);
}
if (formalConsumers.length) throw Error("Unexpected formal source authority consumer");
const nonInterference = { scope: "ISOLATED_SOURCE_AUTHORITY_POLICIES_ONLY", baseline: baseline.baseline, before, after,
  sourceHashes, originalRootScopesChecked: rootScopes, formalConsumers,
  existingProductionDelta: 0, existingSs2b3b1bChanged: false, officialLifecycleChanged: false, officialSaveSchemaChanged: false,
  officialSettlementChanged: false, officialForceThirdOutChanged: false, scorerGameRecordEvaluationChanged: false,
  newMatchRngCallbacks: 0, formalShadowConsumers: 0, runtimeEnabled: false, formalShadowSimulation: false,
  fullRepository: "NOT_RUN", priorSuites: "NOT_RERUN", inheritedFullRepository: "224/227_PARTIAL_THREE_EXISTING_DEBT",
  L03: "PARTIAL", partBStage: false, partBCommit: false, partBPush: false,
  protectedEvidenceLimit: "Metadata/status only; protected bytes were not read or hashed.",
  coverageLimit: "Source reference search plus unchanged current bytes; not graph absence alone." };
result.runner = { baseline: baseline.baseline, sourceHashes, node: process.version, capturePolicy: "exclusive-create", before, after,
  crossRuntime: "normal Node and --jitless process equality; independent VM imports S8 only; not live browser verification" };
if (capture && result.summary.failed === 0) {
  for (const [p, value] of [[outputs[0], result], [outputs[1], nonInterference]]) fs.writeFileSync(path.join(root, p), JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
}
console.log(JSON.stringify({ suite: result.suite, ...result.summary, gradientRows: result.gradientRows.length,
  existingTrackedUnchanged: after.readableTrackedCount, formalConsumers: formalConsumers.length, capturesWritten: capture && result.summary.failed === 0,
  failures: result.checks.filter(r => r.status === "FAIL") }, null, 2));
process.exitCode = result.summary.failed ? 1 : 0;
