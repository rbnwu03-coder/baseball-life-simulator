"use strict";
const assert = require("node:assert/strict"), R = require("./receiver-execution-v2-sprint-10a3b-r3-runner.cjs");
R.reserve("source-change");
const current = R.read("receiver-source-snapshot.js").toString("utf8"), originalValidator = R.json("docs/receiver-execution-v2-sprint-10a3b-r3-original-validator.json").source;
// Reconstruct pre-edit bytes only in memory, then require exact agreement with the pre-edit SHA-256.
const reference = `  function assertReference(ref) {
    canonical(ref);
    if (!exact(ref, ["kind", "sourceSnapshotVersion", "officialReceiverExecutionVersion", "officialExecutionOwner", "runtimeEnabled", "phaseAtAdmission", "physicalSlot", "physical", "snapshotDigest", "versionTuple", "pinDigest"]) ||
      ref.kind !== V.pin || ref.sourceSnapshotVersion !== V.snapshot || ref.officialReceiverExecutionVersion !== V.official || ref.officialExecutionOwner !== "existingLegacyOwner" || ref.runtimeEnabled !== false ||
      ref.phaseAtAdmission !== "beforeExecution" || ref.physicalSlot !== "primaryThrow" || !physical(ref.physical) || !same(ref.versionTuple, V) || typeof ref.snapshotDigest !== "string" || typeof ref.pinDigest !== "string") reject("lifecycle pin reference");
    return true;
  }
`;
const lifecycle = `  function assertLifecycle(situation) {
    if (!situation) return true;
    const ref = situation.receiverSourcePin, ctx = situation.contextSnapshot?.receiverSourcePin, exec = situation.executionState?.receiverSourcePin;
    if ([ref, ctx, exec].every(x => x === undefined) && !own(situation, "receiverSourceExecutionBinding")) return true;
    assertReference(ref); assertReference(ctx); if (!same(ref, ctx) || situation.sourcePhysicalStateRef !== ref.physical.playId || situation.contextSnapshot.physicalIdentity !== ref.physical.physicalIdentity) reject("lifecycle pin copies");
    if (situation.executionState) { assertReference(exec); if (!same(exec, ref)) reject("execution pin copy"); }
    if (own(situation, "receiverSourceExecutionBinding") && (!exact(situation.receiverSourceExecutionBinding, ["version", "pinDigest", "snapshotDigest", "physicalIdentity", "routeId", "originalSampleBinary64", "canonicalSourceId", "actualReceiverId", "actualTarget", "releaseQuality", "originalExecutionOwner", "candidateExecutionPerformed"]) ||
      situation.receiverSourceExecutionBinding.version !== V.binding || situation.receiverSourceExecutionBinding.pinDigest !== ref.pinDigest || situation.receiverSourceExecutionBinding.candidateExecutionPerformed !== false)) reject("lifecycle binding version");
    return true;
  }
`;
let before = current.replace(/\r\n/g, "\n")
  .replace(/  function assertJson\(value, reason\) \{[\s\S]*?(?=  const actor)/, "")
  .replace('    assertJson(snapshot, "snapshot"); assertJson(pin, "pin");', '    canonical(snapshot); canonical(pin);')
  .replace(/  function assertReference\(ref\) \{[\s\S]*?(?=  function assertLifecycle)/, reference)
  .replace(/  function assertLifecycle\(situation\) \{[\s\S]*?(?=  function validateMatch)/, lifecycle)
  .replace(/  function validateMatch\(match\) \{[\s\S]*?(?=  function validateRawSave)/, originalValidator.replace(/\r\n/g, "\n").trimEnd() + "\n");
const expected = R.json(R.prefix + "baseline-evidence.json").hashes["receiver-source-snapshot.js"];
const candidates = [before, before.replace(/\n/g, "\r\n")]; before = candidates.find(x => R.hash(x) === expected); assert(before, "Reconstructed source must exactly match original bytes/hash");
const beforeLines = before.split(/\r?\n/), afterLines = current.split(/\r?\n/);
R.capture("source-change", { beforeSha256: R.hash(before), afterSha256: R.hash(current), beforeSource: before, afterSource: current, beforeLines: beforeLines.length, afterLines: afterLines.length,
  modifications: ["full physical identity determines same-play equality", "required bindings checked before canonical equality", "archive pin checksum and binding self-validation", "explicit present/absent tags and non-JSON validation reasons"],
  otherExistingFiles: R.integrity(), sourceOnly: true, executionOwnerChanged: false });
console.log(JSON.stringify({ beforeSha256: R.hash(before), afterSha256: R.hash(current), beforeLines: beforeLines.length, afterLines: afterLines.length }));
