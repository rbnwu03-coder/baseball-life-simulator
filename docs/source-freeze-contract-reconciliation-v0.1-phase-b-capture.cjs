"use strict";
// Bounded Phase B bookkeeping; no discovery-driven or full-suite execution.
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict"), crypto = require("node:crypto");
const A = require("./test-reliability-audit-v0.1-extract.cjs");
const prefix = "docs/source-freeze-contract-reconciliation-v0.1-phase-b-";
const childPrefix = "docs/test-infrastructure-sprint-0.1-phase-b-";
const report = "docs/source-freeze-contract-reconciliation-v0.1-phase-b.md";
const newTests = new Set(["tests/receiver-source-index-authorized-wiring.cjs", "tests/source-freeze-reconciliation-exact-contract-test.cjs"]);
const suiteRows = A.json("docs/source-freeze-contract-reconciliation-v0.1-source-review-evidence.json").suiteRows;
const saveBranch = "else if (file === 'save.js') require('./receiver-source-save-authorized-delta.cjs').assertReceiverSourceSaveAuthorizedDelta(current, baseline, fs.readFileSync(path.join(root, 'receiver-source-snapshot.js'), 'utf8'));";
const indexBranch = "else if (file === 'index.html') require('./receiver-source-index-authorized-wiring.cjs').assertReceiverSourceIndexAuthorizedWiring(current, baseline, fs.readFileSync(path.join(root, 'receiver-source-snapshot.js'), 'utf8'));";
// Phase A already delivered this similarly named proposal; it remains immutable.
const phaseAPlan = "docs/source-freeze-contract-reconciliation-v0.1-phase-b-plan-evidence.json";
const isNew = p => p !== phaseAPlan && (p.startsWith(prefix) || p.startsWith(childPrefix) || p === report || newTests.has(p));
const files = () => A.git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(p => p && !A.protectedPaths.has(p));
function fileHash(p) {
  assert(!A.protectedPaths.has(p));
  const fd = fs.openSync(path.join(A.root, p), "r"), digest = crypto.createHash("sha256"), block = Buffer.alloc(1048576);
  try { let size; while ((size = fs.readSync(fd, block, 0, block.length, null)) > 0) digest.update(block.subarray(0, size)); return digest.digest("hex"); }
  finally { fs.closeSync(fd); }
}
function reserve(label) {
  assert(/^[a-z0-9-]+$/.test(label));
  const p = prefix + label + "-evidence.json";
  assert(!fs.existsSync(path.join(A.root, p)), "Existing evidence: " + p); return p;
}
function capture(label, data) {
  const p = reserve(label);
  fs.writeFileSync(path.join(A.root, p), JSON.stringify({ phase: "Source Freeze Contract Reconciliation v0.1 Phase B", createdAt: new Date().toISOString(), ...data }, null, 2) + "\n", { flag: "wx" });
  return p;
}
function start() {
  reserve("baseline");
  const state = A.gitState(); assert.equal(state.branch, "main"); assert.equal(state.index, "");
  for (const k of ["head", "main", "originMain"]) assert.equal(state[k], "ab3117653945de0b7013636187c446276a96e634");
  const previous = A.json("docs/source-freeze-contract-reconciliation-v0.1-baseline-evidence.json");
  const deliveries = ["source-freeze-contract-reconciliation-v0.1", "test-infrastructure-sprint-0.1", "receiver-execution-v2-sprint-10a3b-r6"].map(p => "docs/" + p + "-delivery-evidence.json");
  for (const p of deliveries) for (const [file, sha] of Object.entries(A.json(p).hashes)) assert.equal(fileHash(file), sha, file);
  for (const [file, sha] of Object.entries(previous.hashes)) assert.equal(fileHash(file), sha, file);
  assert.deepEqual(A.metadata(), previous.protectedMetadata);
  // Phase A opening status predates its own ten already hash-verified deliveries.
  const normalizeStatus = s => s.split(/\r?\n/).filter(line => line && !isNew(line.slice(3)) && !line.slice(3).startsWith("docs/source-freeze-contract-reconciliation-v0.1-")).join("\n");
  assert.equal(normalizeStatus(state.status), normalizeStatus(previous.git.status), "Original WIP status changed");
  const oldFiles = files().filter(p => !isNew(p)); assert.equal(oldFiles.length, 1269, "Existing inventory differs; stop");
  const hashes = Object.fromEntries(oldFiles.map(p => [p, fileHash(p)]));
  for (const row of suiteRows) assert.equal(hashes[row.file], row.testRawSha256, row.file);
  const originals = Object.fromEntries(suiteRows.map(row => [row.file, A.read(row.file).toString("utf8")]));
  capture("baseline", { git: state, hashes, originalSuiteSources: originals, protectedMetadata: A.metadata(), priorDeliveriesVerified: deliveries, protectedContentReadOrHashed: false,
    authorization: { productionEdits: false, allowedOriginalTestFiles: suiteRows.map(x => x.file), saveBranches: 5, indexBranches: 2, ordinaryMetadataGuardPreserved: true },
    inheritedOriginalStates: suiteRows.map(x => ({ file: x.file, callerOriginalRef: x.ref, status: x.entry.priorCurrentSuiteStatus, evidence: x.entry.priorEvidence })) });
  console.log(JSON.stringify({ readableExistingFiles: hashes && Object.keys(hashes).length, priorDeliveriesVerified: 3, protectedMetadataOnly: A.protectedPaths.size }));
}
function allowedSource(file, original) {
  const row = suiteRows.find(x => x.file === file); assert(row, "Unauthorized original test");
  const anchor = original.match(/^(\s*)else assert\.equal\(current, baseline, file\);$/m);
  assert(anchor, "Original final comparison branch missing"); assert.equal(original.split(anchor[0]).length - 1, 1);
  const indent = anchor[1], lines = [saveBranch]; if (row.guard === 10 || row.guard === 14) lines.push(indexBranch);
  return original.replace(anchor[0], lines.map(line => indent + line).join("\n") + "\n" + anchor[0]);
}
function reverseVerify() {
  const b = A.json(prefix + "baseline-evidence.json");
  return suiteRows.map(row => {
    const original = b.originalSuiteSources[row.file], current = A.read(row.file).toString("utf8");
    assert.equal(current, allowedSource(row.file, original), "Extra original suite edit: " + row.file);
    let reversed = current;
    for (const branch of row.guard === 10 || row.guard === 14 ? [saveBranch, indexBranch] : [saveBranch]) {
      const line = current.split("\n").find(x => x.trim() === branch); assert(line); assert.equal(reversed.split(line + "\n").length - 1, 1);
      reversed = reversed.replace(line + "\n", "");
    }
    assert.equal(reversed, original, "Original source not restored");
    return { file: row.file, guard: row.guard, callerOriginalRef: row.ref, contractCanonicalRef: "a0e512b439446990d8df118e3e7d737b9f2f51d3", beforeSha256: b.hashes[row.file], afterSha256: A.hash(A.read(row.file)), reversedSha256: A.hash(reversed), exactReverseToOriginal: true,
      addedBranches: row.guard === 10 || row.guard === 14 ? 2 : 1, behaviorAssertionsFixturesSeedsPinsAndOtherGuardsUnchanged: true };
  });
}
function integrity(revised = false) {
  const b = A.json(prefix + "baseline-evidence.json"), changed = [];
  for (const [p, h] of Object.entries(b.hashes)) {
    const actual = fileHash(p); if (actual === h) continue;
    assert(revised && suiteRows.some(x => x.file === p), "Unexpected existing file changed: " + p);
    assert.equal(A.read(p).toString("utf8"), allowedSource(p, b.originalSuiteSources[p]), p); changed.push(p);
  }
  if (revised) assert.equal(changed.length, 5);
  assert.deepEqual(A.metadata(), b.protectedMetadata);
  const state = A.gitState(); for (const k of ["branch", "head", "main", "originMain", "index"]) assert.equal(state[k], b.git[k]);
  const originalStatus = s => s.split(/\r?\n/).filter(line => line && !isNew(line.slice(3)) && !suiteRows.some(x => x.file === line.slice(3))).join("\n");
  assert.equal(originalStatus(state.status), originalStatus(b.git.status), "Other WIP Git status changed");
  for (const p of files()) assert(p in b.hashes || isNew(p), "Unapproved new file: " + p);
  return { readableExistingFiles: Object.keys(b.hashes).length, unchangedExistingHashes: Object.keys(b.hashes).length - changed.length, changedExistingPaths: changed, productionDelta: 0, oldCapturesPreserved: true, protectedMetadataUnchanged: true, protectedContentReadOrHashed: false, git: state };
}
module.exports = { ...A, prefix, childPrefix, report, newTests, suiteRows, saveBranch, indexBranch, isNew, files, fileHash, reserve, capture, allowedSource, reverseVerify, integrity };
if (require.main === module) { if (process.argv[2] === "baseline") start(); else throw Error("Explicit baseline mode only"); }
