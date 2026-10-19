"use strict";
const assert = require("node:assert/strict"), crypto = require("node:crypto");
const { assertAdapterBoundary } = require("./receiver-source-save-authorized-delta.cjs");
const CONTRACT_VERSION = "receiver-source-index-wiring-delta-v1";
const PINNED_INDEX_NORMALIZED_SHA256 = "01a1267379d1732437452e44f1eb49ac49a3a9565ee9f3dda820b906c498d71b";
const SOURCE_TAG = '<script src="receiver-source-snapshot.js"></script>';
const ORIGINAL_ANCHOR = '    <script src="batted-ball-tag-up-execution.js"></script>\n    <script src="match-situation-lifecycle.js"></script>\n';
const AUTHORIZED_ANCHOR = ORIGINAL_ANCHOR.replace('    <script src="match-situation-lifecycle.js">', '    ' + SOURCE_TAG + '\n    <script src="match-situation-lifecycle.js">');
function normalize(text) { assert.equal(typeof text, "string"); return text.replace(/\r\n?/g, "\n"); }
const sha256 = text => crypto.createHash("sha256").update(text, "utf8").digest("hex");
const scriptTags = text => [...text.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(m => m[0]);
function expectedAuthorizedIndex(pinnedText) {
  const pinned = normalize(pinnedText);
  assert.equal(sha256(pinned), PINNED_INDEX_NORMALIZED_SHA256, "Original pinned Index authority changed");
  assert.equal(pinned.split(ORIGINAL_ANCHOR).length - 1, 1, "Pinned unique adjacent wiring anchor required");
  assert.equal(scriptTags(pinned).length, 92, "Original 92 script tags required");
  // Authority is the original pinned document plus one exact insertion.
  // No current document hash or arbitrary current script list is accepted.
  return pinned.replace(ORIGINAL_ANCHOR, AUTHORIZED_ANCHOR);
}
function assertReceiverSourceIndexAuthorizedWiring(currentText, pinnedText, adapterText) {
  const current = normalize(currentText), pinned = normalize(pinnedText), expected = expectedAuthorizedIndex(pinned);
  assert.equal(current, expected, "Index source outside exact authorized wiring delta");
  const originalTags = scriptTags(pinned), actualTags = scriptTags(current);
  assert.equal(actualTags.length, 93);
  const sourceTags = actualTags.filter(tag => /\breceiver-source-snapshot\.js\b/.test(tag));
  assert.deepEqual(sourceTags, [SOURCE_TAG], "Source adapter must be unique, classic and exact");
  assert.deepEqual(actualTags.filter(tag => tag !== SOURCE_TAG), originalTags, "Original tags, attributes and order must remain exact");
  assert.equal(current.split(AUTHORIZED_ANCHOR).length - 1, 1, "Source adapter position changed");
  const adapter = assertAdapterBoundary(adapterText);
  return { contractVersion: CONTRACT_VERSION, pinnedIndexNormalizedSha256: PINNED_INDEX_NORMALIZED_SHA256, authorizedInsertions: 1,
    originalScriptTags: 92, currentScriptTags: 93, originalAttributesAndOrderFrozen: true, outsideWiringBytesFrozen: true,
    sourceAdapterUniqueAndPositionFixed: true, adapter };
}
module.exports = { CONTRACT_VERSION, PINNED_INDEX_NORMALIZED_SHA256, SOURCE_TAG, ORIGINAL_ANCHOR, AUTHORIZED_ANCHOR, expectedAuthorizedIndex, assertReceiverSourceIndexAuthorizedWiring };
