"use strict";
const assert = require("node:assert/strict"), crypto = require("node:crypto"), vm = require("node:vm");
const { readSource } = require("./pitch-production-source-scope.cjs");
const CONTRACT_VERSION = "receiver-source-save-owner-delta-v1";
const PINNED_COMMIT = "a0e512b439446990d8df118e3e7d737b9f2f51d3";
const PINNED_SAVE_NORMALIZED_SHA256 = "d093c730a4082a05050476a110553204e5234d72596b3cb449423f56566fe592";
// Supplemental freeze of the independently reviewed R3 metadata-only adapter.
// Save acceptance below is derived from PINNED source plus three exact patches,
// never from a current/WIP Save hash or a whole current function whitelist.
const REVIEWED_ADAPTER_NORMALIZED_SHA256 = "4a9e63e98259b153c09b1c39216fd152c36e56ef911b2693df28aa8caa353274";
const normalize = s => { assert.equal(typeof s, "string"); return s.replace(/\r\n?/g, "\n"); };
const sha256 = s => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const ORIGINAL_WRITER = '  localStorage.setItem(SAVE_KEY, JSON.stringify(player));\n';
const PREWRITE_DELEGATION = `  const sourceOnlySave = player.saveVersion === 16 || Object.prototype.hasOwnProperty.call(player, "receiverSourceSaveFormatVersion")
    || Object.prototype.hasOwnProperty.call(player.highSchoolMatch || {}, "receiverSourceFormatVersion");
  if (sourceOnlySave) {
    if (typeof ReceiverSourceSnapshot === "undefined") throw new Error("Receiver source snapshot module required for new Save format");
    // Source-only envelope preparation is detached; the live Player/Match is unchanged.
    localStorage.setItem(SAVE_KEY, ReceiverSourceSnapshot.serializeSave(player));
  } else {
    if (typeof ReceiverSourceSnapshot !== "undefined") ReceiverSourceSnapshot.validateRawSave(player);
    // Keep the actual ordinary Legacy storage path and Player JSON boundary.
    localStorage.setItem(SAVE_KEY, JSON.stringify(player));
  }
`;
const RAW_ANCHOR = 'function normalizeSave(saved) {\n  const sourceSaveVersion = saved.saveVersion;\n';
const RAW_GUARD = `  // Raw owner validation precedes defaults, Object.assign and generic normalizers.
  if (typeof ReceiverSourceSnapshot !== "undefined") ReceiverSourceSnapshot.validateRawSave(saved);
  else if (sourceSaveVersion === 16 || saved.receiverSourceSaveFormatVersion || saved.highSchoolMatch?.receiverSourceFormatVersion) {
    throw new Error("Receiver source snapshot module required for new Save format");
  }
`;
const ORIGINAL_VERSION = "  fresh.saveVersion = SAVE_VERSION;\n";
const SOURCE_VERSION = "  fresh.saveVersion = sourceSaveVersion === 16 ? 16 : SAVE_VERSION;\n";
function replaceOnce(source, before, after, responsibility) {
  assert.equal(source.split(before).length - 1, 1, "Pinned precondition: " + responsibility);
  return source.replace(before, after);
}
function expectedAuthorizedSave(pinnedText) {
  const pinned = normalize(pinnedText); assert.equal(sha256(pinned), PINNED_SAVE_NORMALIZED_SHA256, "Original pinned Save authority changed");
  let expected = replaceOnce(pinned, ORIGINAL_WRITER, PREWRITE_DELEGATION, "original unique Legacy writer");
  expected = replaceOnce(expected, RAW_ANCHOR, RAW_ANCHOR + RAW_GUARD, "raw guard before first defaults");
  return replaceOnce(expected, ORIGINAL_VERSION, SOURCE_VERSION, "validated source-only16 preservation");
}
function assertAdapterBoundary(adapterText) {
  const source = normalize(adapterText); new vm.Script(source, { filename: "source-only-adapter.js" });
  // This conservative token check complements the exact reviewed adapter freeze
  // and actual boundary/non-interference tests; it is not a general JS purity proof.
  assert(!/\b(?:localStorage|sessionStorage|indexedDB|XMLHttpRequest|fetch|eval|Function|ReceiverExecutionV22Foundation|ReceiverExecutionV2Foundation)\b|\bMath\s*(?:\.\s*random|\[\s*["']random["']\s*\])|\b(?:setItem|execute|resolveStage)\s*\(/.test(source), "Source adapter acquired storage/RNG/candidate authority");
  assert.equal(sha256(source), REVIEWED_ADAPTER_NORMALIZED_SHA256, "Reviewed metadata-only adapter changed; requires a new contract review");
  const raw = source.slice(source.indexOf("  function validateRawSave(saved) {"), source.indexOf("  function serializeSave(player) {"));
  const serializer = source.slice(source.indexOf("  function serializeSave(player) {"), source.indexOf("  function observe(match) {"));
  assert(raw.includes('if (saved.saveVersion > V.saveVersion) reject("future save format not implemented")'));
  assert(serializer.includes("validateRawSave(saved); return JSON.stringify(saved)"));
  assert(source.includes("versions: V, runtimeEnabled: false"));
  return { reviewedAdapterFrozen: true, storageWriter: false, rngOwner: false, candidateExecutionOwner: false };
}
function assertReceiverSourceSaveAuthorizedDelta(currentText, pinnedText, adapterText) {
  const current = normalize(currentText), pinned = normalize(pinnedText), expected = expectedAuthorizedSave(pinned);
  new vm.Script(current, { filename: "authorized-save-owner.js" });
  assert.equal(current, expected, "Save source outside exact authorized owner delta");
  const actual = readSource(current), original = readSource(pinned), save = actual.get("saveGame").source, normalizer = actual.get("normalizeSave").source;
  assert.equal(actual.get("loadGame").source, original.get("loadGame").source, "candidate-first Load owner changed");
  assert.equal(actual.get("deleteSave").source, original.get("deleteSave").source, "unrelated Save owner changed");
  assert.equal(current.split('const SAVE_KEY = "baseballLifeRpgSave";').length - 1, 1);
  assert(save.indexOf("isBaseballGameplayPending()") < save.indexOf("const sourceOnlySave"));
  assert(save.includes("localStorage.setItem(SAVE_KEY, ReceiverSourceSnapshot.serializeSave(player));"));
  assert(normalizer.indexOf("ReceiverSourceSnapshot.validateRawSave(saved)") < normalizer.indexOf("const fresh = createInitialPlayer"));
  assert(normalizer.indexOf("ReceiverSourceSnapshot.validateRawSave(saved)") < normalizer.indexOf("Object.assign(fresh, saved)"));
  const adapter = assertAdapterBoundary(adapterText);
  return { contractVersion: CONTRACT_VERSION, pinnedCommit: PINNED_COMMIT, exactDeltaCount: 3, untouchedSourceFrozen: true, legacyWriterFrozen: true, rawBeforeDefaultsAndMerge: true, loadAdmissionFrozen: true, source16Preserved: true, adapter };
}
module.exports = { CONTRACT_VERSION, PINNED_COMMIT, PINNED_SAVE_NORMALIZED_SHA256, REVIEWED_ADAPTER_NORMALIZED_SHA256, ORIGINAL_WRITER, PREWRITE_DELEGATION, RAW_ANCHOR, RAW_GUARD, ORIGINAL_VERSION, SOURCE_VERSION, expectedAuthorizedSave, assertAdapterBoundary, assertReceiverSourceSaveAuthorizedDelta };
