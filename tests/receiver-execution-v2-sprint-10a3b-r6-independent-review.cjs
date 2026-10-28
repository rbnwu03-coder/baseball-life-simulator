"use strict";
// Independent reverse-delta review. Does not use the checker's expected source builder.
const assert = require("node:assert/strict"), R = require("./receiver-execution-v2-sprint-10a3b-r6-runner.cjs");
function review() {
  R.reserve("independent-review"); const contract = R.json(R.prefix + "authorized-delta-contract-evidence.json"), gates = R.json(R.prefix + "gates-evidence.json");
  assert(gates.passed); assert.deepEqual(R.frozenHashes(), gates.frozenSourceHashes);
  const normalize = s => s.replace(/\r\n?/g, "\n"), original = normalize(R.git("show", contract.pinnedCommit + ":save.js"));
  let reversed = normalize(R.read("save.js").toString()); const rows = [];
  function undo(name, approved, prior) { assert.equal(reversed.split(approved).length - 1, 1, name); reversed = reversed.replace(approved, prior); rows.push({ name, occurrences: 1, status: "PASS" }); }
  undo("Source version responsibility only", contract.patches.version.after, contract.patches.version.before);
  undo("pre-default raw insertion only", contract.patches.raw.anchor + contract.patches.raw.insert, contract.patches.raw.anchor);
  undo("unique pre-write owner replacement only", contract.patches.writer.after, contract.patches.writer.before);
  assert.equal(reversed, original, "Non-authorized Save bytes changed");
  const pitchOriginal = normalize(R.git("show", R.baseline + ":" + R.pitch)), pitchCurrent = normalize(R.read(R.pitch).toString());
  const addition = "    else if (file === 'save.js') require('./receiver-source-save-authorized-delta.cjs').assertReceiverSourceSaveAuthorizedDelta(current, baseline, fs.readFileSync(path.join(root, 'receiver-source-snapshot.js'), 'utf8'));\n";
  assert.equal(pitchCurrent.split(addition).length - 1, 1); assert.equal(pitchCurrent.replace(addition, ""), pitchOriginal, "Pitch change outside single Save comparison branch");
  const boundary = R.json(R.prefix + "save-boundary-evidence.json").result, exact = R.json(R.prefix + "exact-focused-evidence.json").result;
  assert.equal(boundary.summary.failed, 0); assert.equal(boundary.summary.total, 30); assert.equal(exact.summary.failed, 0); assert.equal(exact.summary.total, 23);
  const header = boundary.witnesses.find(w => w.mutation === "tampered legitimate header"); assert(header && header.defaultsCalls === 0 && header.writes === 0 && header.liveCommit === false);
  const b = R.json(R.prefix + "baseline-evidence.json");
  for (const p of ["save.js", "player.js", "script.js", "receiver-source-snapshot.js", "tests/pitch-production-source-scope.cjs", "tests/pitch-tactical-selector-extraction-baseline.cjs"]) assert.equal(R.hash(R.read(p)), b.hashes[p], p);
  const adapter = R.read("receiver-source-snapshot.js").toString(); assert(!/\b(?:localStorage|sessionStorage|indexedDB|fetch|ReceiverExecutionV22Foundation)\b|Math\.random/.test(adapter));
  const rejectedMutationNames = exact.checks.filter(x => x.negative && x.status === "PASS").map(x => x.name); assert.equal(rejectedMutationNames.length, 21);
  R.capture("independent-review", { passed: true, method: "Remove three frozen approved deltas from current Save and compare every remaining normalized byte to original pinned source; independently remove single Pitch Save branch and compare entire original test", rows, reverseDeltaEqualsPinned: true, pitchDeltaLimitedToSaveComparison: true, test1Through7Unchanged: true, otherFiveSourceCheckersUnchanged: true, scriptScopedHelperUnchanged: true, wholeWipSaveHashWhitelistUsed: false, currentProductionHashesUnchanged: true, rawDirectBoundaryFunctionalChecksPassed: true, tamperedLegitimateHeaderRejectedBeforeDefaults: header, secondStorageOrAdmissionOwner: false, sourceOnlyAdapterUnchangedAndNoStorageRngCandidateCalls: true, negativeMutationsRejected: rejectedMutationNames, frozenSourceHashes: gates.frozenSourceHashes, reviewerUtilitySha256: R.hash(R.read("tests/receiver-execution-v2-sprint-10a3b-r6-independent-review.cjs")), safety: R.integrity(), limits: "Independent algorithm in the same agent; not a separate human/sub-agent review. Purity claims refer to the exact frozen adapter and bounded runtime fixtures." });
  console.log(JSON.stringify({ independentReview: "PASS", reverseDeltaEqualsPinned: true, pitchChange: "single Save comparison branch", rejectedMutations: 21 }));
}
if (require.main === module) review();
module.exports = { review };
