"use strict";
// Isolated source mutations only; no Production, original fixture or pin writes.
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict"), vm = require("node:vm"), { createRequire } = require("node:module");
const P = require("../docs/source-freeze-contract-reconciliation-v0.1-phase-b-capture.cjs");
const I = require("./receiver-source-index-authorized-wiring.cjs"), S = require("./receiver-source-save-authorized-delta.cjs");
const Scope = require("./pitch-production-source-scope.cjs"), Tactical = require("./pitch-tactical-selector-extraction-baseline.cjs");
const normalize = s => s.replace(/\r\n?/g, "\n");
function changedOnce(source, before, after) {
  assert.equal(source.split(before).length - 1, 1, "Unique mutation anchor required");
  const result = source.replace(before, after); assert.notEqual(result, source); return result;
}
function guardBody(source, row) {
  const marker = row.comparisonLocation[0].text.trim(), start = source.indexOf(marker); assert(start >= 0);
  const opening = source.indexOf("{", start), closing = /\n[ \t]*\}\);/.exec(source.slice(opening)); assert(closing);
  return source.slice(opening + 1, opening + closing.index);
}
function run() {
  const checks = [], baseline = P.json(P.prefix + "baseline-evidence.json");
  const currentIndex = normalize(P.read("index.html").toString("utf8")), currentSave = normalize(P.read("save.js").toString("utf8")), adapter = P.read("receiver-source-snapshot.js").toString("utf8");
  const pinned = (ref, file) => normalize(P.git("show", ref + ":" + file));
  const indexRows = P.suiteRows.filter(row => row.guard === 10 || row.guard === 14);
  const originalIndex = pinned(indexRows[0].ref, "index.html");
  function test(name, fn, negative = false) { fn(); checks.push({ name, status: "PASS", negative }); }
  function rejectIndex(name, mutation) {
    test(name, () => { const changed = mutation(currentIndex); assert.notEqual(changed, currentIndex); assert.throws(() => I.assertReceiverSourceIndexAuthorizedWiring(changed, originalIndex, adapter), { code: "ERR_ASSERTION" }); }, true);
  }
  for (const row of indexRows) test("exact original Index + one insertion: " + row.ref, () => {
    const result = I.assertReceiverSourceIndexAuthorizedWiring(currentIndex, pinned(row.ref, "index.html"), adapter);
    assert.equal(result.originalScriptTags, 92); assert.equal(result.currentScriptTags, 93); assert.equal(result.authorizedInsertions, 1);
  });
  test("Original CRLF normalization remains compatible", () => assert.deepEqual(I.assertReceiverSourceIndexAuthorizedWiring(currentIndex.replace(/\n/g, "\r\n"), originalIndex.replace(/\n/g, "\r\n"), adapter), I.assertReceiverSourceIndexAuthorizedWiring(currentIndex, originalIndex, adapter)));
  rejectIndex("missing Source tag rejected", s => changedOnce(s, "    " + I.SOURCE_TAG + "\n", ""));
  rejectIndex("duplicate Source tag rejected", s => changedOnce(s, I.SOURCE_TAG, I.SOURCE_TAG + "\n    " + I.SOURCE_TAG));
  rejectIndex("moved Source tag rejected", s => changedOnce(s, "    " + I.SOURCE_TAG + "\n", "") + "\n" + I.SOURCE_TAG + "\n");
  const tags = [...originalIndex.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(m => m[0]);
  rejectIndex("old script tag reorder rejected", s => changedOnce(changedOnce(s, tags[0], "__FIRST_OLD_TAG__"), tags[1], tags[0]).replace("__FIRST_OLD_TAG__", tags[1]));
  rejectIndex("old script tag deletion rejected", s => changedOnce(s, tags[0], ""));
  rejectIndex("old script tag duplicate rejected", s => changedOnce(s, tags[0], tags[0] + "\n" + tags[0]));
  for (const [name, tag] of [
    ["async", '<script async src="receiver-source-snapshot.js"></script>'],
    ["defer", '<script defer src="receiver-source-snapshot.js"></script>'],
    ["type", '<script type="module" src="receiver-source-snapshot.js"></script>'],
    ["src", '<script src="other-receiver.js"></script>'],
    ["query", '<script src="receiver-source-snapshot.js?v=2"></script>']
  ]) rejectIndex("Source " + name + " change rejected", s => changedOnce(s, I.SOURCE_TAG, tag));
  rejectIndex("old tag attribute change rejected", s => changedOnce(s, tags[0], tags[0].replace("<script ", "<script defer ")));
  rejectIndex("other module insertion rejected", s => changedOnce(s, I.SOURCE_TAG, I.SOURCE_TAG + '\n    <script src="unapproved-module.js"></script>'));
  rejectIndex("DOM change rejected", s => { const tag = /<body\b[^>]*>/.exec(s)?.[0]; assert(tag); return changedOnce(s, tag, tag.replace("<body", '<body data-unapproved="1"')); });
  rejectIndex("style change rejected", s => changedOnce(s, "</head>", "<style>body{opacity:.5}</style>\n</head>"));
  rejectIndex("inline handler change rejected", s => changedOnce(s, 'onclick="ApplicationController.saveSession()"', 'onclick="ApplicationController.deleteSession()"'));
  rejectIndex("other text and whitespace change rejected", s => s + "\n<!-- unapproved -->\n");
  test("wrong original pinned Index rejected", () => assert.throws(() => I.assertReceiverSourceIndexAuthorizedWiring(currentIndex, originalIndex + "\n", adapter), /Original pinned Index authority changed/), true);
  for (const [name, addition] of [["Storage", 'localStorage.setItem("second", "x");'], ["RNG", "Math.random();"], ["candidate execution", "ReceiverExecutionV22Foundation.execute({});"], ["unreviewed version", "// unreviewed adapter version\n"]]) {
    test("Index cannot approve adapter " + name, () => { const changed = adapter + "\n" + addition; assert.notEqual(changed, adapter); new vm.Script(changed); assert.throws(() => I.assertReceiverSourceIndexAuthorizedWiring(currentIndex, originalIndex, changed), { code: "ERR_ASSERTION" }); }, true);
  }
  const callerResults = [];
  for (const row of P.suiteRows) {
    const original = baseline.originalSuiteSources[row.file], proposed = P.allowedSource(row.file, original), body = guardBody(proposed, row);
    new vm.Script(proposed, { filename: row.file });
    const sources = ["save.js", ...row.otherGuardSources], originals = Object.fromEntries(sources.map(file => [file, pinned(row.ref, file)]));
    const current = Object.fromEntries(sources.map(file => [file, normalize(P.read(file).toString("utf8"))]));
    const nativeRequire = createRequire(path.join(P.root, row.file));
    function exerciseGuard(currentOverrides = {}, pinnedOverrides = {}) {
      let comparisons = 0;
      const context = { assert, path, __dirname: path.join(P.root, "tests"), BASELINE: row.ref, require: nativeRequire,
        assertPitchProductionSourceScope: Scope.assertPitchProductionSourceScope, assertOnlyRepeatEligibilityExtraction: Tactical.assertOnlyRepeatEligibilityExtraction,
        fs: { readFileSync(absolute, encoding) { assert.equal(encoding, "utf8"); const file = path.relative(P.root, absolute).replace(/\\/g, "/"); if (file === "receiver-source-snapshot.js") return adapter; assert(Object.hasOwn(current, file)); return currentOverrides[file] ?? current[file]; } },
        cp: { execFileSync(command, args, options) { assert.equal(command, "git"); assert.equal(args[0], "show"); assert.equal(options.maxBuffer, 8 * 1024 * 1024); const separator = args[1].indexOf(":"); assert.equal(args[1].slice(0, separator), row.ref); const file = args[1].slice(separator + 1); assert(Object.hasOwn(originals, file)); comparisons++; return pinnedOverrides[file] ?? originals[file]; } } };
      new vm.Script(body, { filename: "isolated-guard-" + path.basename(row.file) }).runInNewContext(context);
      return comparisons;
    }
    const label = path.basename(row.file);
    test(label + ": whole original guard accepts only planned branches", () => { const count = exerciseGuard(); assert.equal(count, sources.length); callerResults.push({ file: row.file, callerOriginalRef: row.ref, originalGuardComparisons: count, contractCanonicalRef: S.PINNED_COMMIT, allOtherGuardsExecuted: true }); });
    const saveMutations = [
      ["missing raw guard", s => changedOnce(s, S.RAW_GUARD, "")],
      ["ordinary metadata guard removal", s => changedOnce(s, '    if (typeof ReceiverSourceSnapshot !== "undefined") ReceiverSourceSnapshot.validateRawSave(player);\n', "")],
      ["Source serializer bypass", s => changedOnce(s, "localStorage.setItem(SAVE_KEY, ReceiverSourceSnapshot.serializeSave(player));", "localStorage.setItem(SAVE_KEY, JSON.stringify(player));")],
      ["unapproved version migration", s => changedOnce(s, "sourceSaveVersion === 16 ? 16 : SAVE_VERSION", "sourceSaveVersion >= 16 ? sourceSaveVersion : SAVE_VERSION")]
    ];
    for (const [name, mutation] of saveMutations) test(label + ": rejects " + name, () => { const changed = mutation(currentSave); new vm.Script(changed); assert.throws(() => exerciseGuard({ "save.js": changed }), { code: "ERR_ASSERTION" }); }, true);
    test(label + ": wrong pinned Save rejected", () => assert.throws(() => exerciseGuard({}, { "save.js": originals["save.js"] + "\n" }), { code: "ERR_ASSERTION" }), true);
    test(label + ": other full-source mismatch rejected", () => { const changed = current["pitch-observation-foundation.js"] + "\n// unapproved owner delta\n"; new vm.Script(changed); assert.throws(() => exerciseGuard({ "pitch-observation-foundation.js": changed }), { code: "ERR_ASSERTION" }); }, true);
    test(label + ": original script function scope mismatch rejected", () => {
      const functionSource = Scope.readSource(current["script.js"]).get("createOffensiveGameplayRolls").source;
      const changed = changedOnce(current["script.js"], functionSource, functionSource.replace("{", "{ /* unapproved protected owner delta */")); new vm.Script(changed);
      assert.throws(() => exerciseGuard({ "script.js": changed }), { code: "ERR_ASSERTION" });
    }, true);
    test(label + ": wrong caller ref rejected by exact source contract", () => { const altered = proposed.includes(row.ref) ? changedOnce(proposed, row.ref, "0".repeat(40)) : proposed.replace("BASELINE + ':' + file", "'" + "0".repeat(40) + "' + ':' + file"); assert.notEqual(altered, proposed); new vm.Script(altered); assert.throws(() => assert(altered === P.allowedSource(row.file, original), "Caller original ref changed"), { code: "ERR_ASSERTION" }); }, true);
    test(label + ": extra comparison branch rejected by reverse contract", () => { const altered = proposed.replace("else assert.equal(current, baseline, file);", "else if (file === 'pitch-observation-foundation.js') assert(true);\n      else assert.equal(current, baseline, file);"); assert.notEqual(altered, proposed); new vm.Script(altered); assert.throws(() => assert(altered === P.allowedSource(row.file, original), "Extra comparison branch"), { code: "ERR_ASSERTION" }); }, true);
    test(label + ": extra hook rejected by reverse contract", () => { const altered = proposed + "\nfunction hiddenGuardHook() { return true; }\n"; new vm.Script(altered); assert.throws(() => assert(altered === P.allowedSource(row.file, original), "Extra source hook"), { code: "ERR_ASSERTION" }); }, true);
  }
  return { summary: { total: checks.length, passed: checks.length, failed: 0 }, negative: { total: checks.filter(x => x.negative).length, passed: checks.filter(x => x.negative).length, failed: 0 }, checks, callerResults,
    indexContract: I.CONTRACT_VERSION, saveContract: S.CONTRACT_VERSION, mutationScope: "in-memory source copies and isolated guard callbacks; no original suite main or Production execution", productionWrites: 0 };
}
module.exports = { run };
if (require.main === module) console.log(JSON.stringify(run(), null, 2));
