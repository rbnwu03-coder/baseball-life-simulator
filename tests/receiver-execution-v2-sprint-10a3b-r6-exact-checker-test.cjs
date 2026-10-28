"use strict";
const assert = require("node:assert/strict"), vm = require("node:vm");
const R = require("./receiver-execution-v2-sprint-10a3b-r6-runner.cjs"), C = require("./receiver-source-save-authorized-delta.cjs");
function run() {
  const checks = [], pinned = R.git("show", C.PINNED_COMMIT + ":save.js").replace(/\r\n?/g, "\n"), current = R.read("save.js").toString().replace(/\r\n?/g, "\n"), adapter = R.read("receiver-source-snapshot.js").toString();
  function test(name, fn, negative = false) { try { fn(); checks.push({ name, negative, status: "PASS" }); } catch (e) { checks.push({ name, negative, status: "FAIL", error: e.stack }); } }
  function mutate(text, before, after) { assert.equal(text.split(before).length - 1, 1, "Mutation precondition"); const out = text.replace(before, after); assert.notEqual(out, text); return out; }
  function rejectSave(name, change) { test(name, () => { const changed = change(current); assert.notEqual(changed, current); new vm.Script(changed); assert.throws(() => C.assertReceiverSourceSaveAuthorizedDelta(changed, pinned, adapter), /Save source outside exact authorized owner delta/); }, true); }
  test("current Save equals pinned source plus the three reviewed exact patches", () => { const r = C.assertReceiverSourceSaveAuthorizedDelta(current, pinned, adapter); assert.equal(r.exactDeltaCount, 3); assert.equal(r.loadAdmissionFrozen, true); });
  test("CRLF normalization preserves the same original authority", () => C.assertReceiverSourceSaveAuthorizedDelta(current.replace(/\n/g, "\r\n"), pinned.replace(/\n/g, "\r\n"), adapter.replace(/\r?\n/g, "\r\n")));
  test("frozen original without required Source safety is not the new authorized contract", () => assert.throws(() => C.assertReceiverSourceSaveAuthorizedDelta(pinned, pinned, adapter), /Save source outside/), true);
  rejectSave("remove Raw Guard FAIL", s => mutate(s, C.RAW_GUARD, ""));
  rejectSave("move Raw Guard after defaults FAIL", s => mutate(s.replace(C.RAW_GUARD, ""), '  const fresh = createInitialPlayer(saved.name || "");\n', '  const fresh = createInitialPlayer(saved.name || "");\n' + C.RAW_GUARD));
  rejectSave("move Raw Guard after merge FAIL", s => mutate(s.replace(C.RAW_GUARD, ""), "  Object.assign(fresh, saved);\n", "  Object.assign(fresh, saved);\n" + C.RAW_GUARD));
  rejectSave("remove ordinary pre-write validation FAIL", s => mutate(s, '    if (typeof ReceiverSourceSnapshot !== "undefined") ReceiverSourceSnapshot.validateRawSave(player);\n', ""));
  rejectSave("remove source pre-write validation/detached serialization FAIL", s => mutate(s, "ReceiverSourceSnapshot.serializeSave(player)", "JSON.stringify(player)"));
  rejectSave("change Legacy Storage Writer FAIL", s => mutate(s, "    localStorage.setItem(SAVE_KEY, JSON.stringify(player));", "    sessionStorage.setItem(SAVE_KEY, JSON.stringify(player));"));
  rejectSave("change SAVE_KEY FAIL", s => mutate(s, 'const SAVE_KEY = "baseballLifeRpgSave";', 'const SAVE_KEY = "otherSave";'));
  rejectSave("allow unknown source version fallback FAIL", s => mutate(s, "sourceSaveVersion === 16 ? 16 : SAVE_VERSION", "sourceSaveVersion >= 16 ? sourceSaveVersion : SAVE_VERSION"));
  rejectSave("downgrade Source16 during normalization FAIL", s => mutate(s, C.SOURCE_VERSION, C.ORIGINAL_VERSION));
  rejectSave("remove adapter-unavailable fail-closed FAIL", s => mutate(s, '    if (typeof ReceiverSourceSnapshot === "undefined") throw new Error("Receiver source snapshot module required for new Save format");\n', ""));
  rejectSave("modify non-authorized deleteSave FAIL", s => mutate(s, "localStorage.removeItem(SAVE_KEY);", 'localStorage.removeItem("differentKey");'));
  rejectSave("skip loadGame career admission FAIL", s => mutate(s, "if (!admission || admission.admitted !== true)", "if (false)"));
  rejectSave("commit Player before candidate admission FAIL", s => mutate(s, "const candidate = normalizeSave(JSON.parse(raw));", "const candidate = normalizeSave(JSON.parse(raw)); player = candidate;"));
  rejectSave("add second Storage Writer FAIL", s => s + '\nfunction anotherSaveWriter() { localStorage.setItem("second", JSON.stringify(player)); }\n');
  rejectSave("add hidden Save hook outside reviewed hunks FAIL", s => s + "\nvar rawSaveAdmissionBypass = true;\n");
  for (const [name, statement] of [["Storage Writer", 'localStorage.setItem("second", "x");'], ["RNG", "Math.random();"], ["candidate execution", "ReceiverExecutionV22Foundation.execute({});"]]) test("adapter acquires " + name + " FAIL", () => { const changed = adapter + "\n" + statement; new vm.Script(changed); assert.throws(() => C.assertReceiverSourceSaveAuthorizedDelta(current, pinned, changed), /Source adapter acquired/); }, true);
  test("unreviewed adapter branch cannot evade supplemental source freeze", () => { const changed = adapter.replace("return true; // genuine omitted legacy metadata", "return false; // genuine omitted legacy metadata"); assert.notEqual(changed, adapter); assert.throws(() => C.assertReceiverSourceSaveAuthorizedDelta(current, pinned, changed), /Reviewed metadata-only adapter changed/); }, true);
  test("changing original pinned authority FAIL", () => assert.throws(() => C.assertReceiverSourceSaveAuthorizedDelta(current, pinned + "\n", adapter), /Original pinned Save authority changed/), true);
  return { summary: { total: checks.length, passed: checks.filter(x => x.status === "PASS").length, failed: checks.filter(x => x.status === "FAIL").length }, negative: { total: checks.filter(x => x.negative).length, passed: checks.filter(x => x.negative && x.status === "PASS").length, failed: checks.filter(x => x.negative && x.status === "FAIL").length }, checks, contractVersion: C.CONTRACT_VERSION };
}
module.exports = { run };
if (require.main === module) { const r = run(); console.log(JSON.stringify(r, null, 2)); if (r.summary.failed) process.exitCode = 1; }
