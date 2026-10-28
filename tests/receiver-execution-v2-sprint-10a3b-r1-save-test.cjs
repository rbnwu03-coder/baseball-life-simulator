"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs");
const { makeHarness, officialProjection } = require("./receiver-execution-v2-sprint-10a3b-harness.cjs");
function run() {
  const checks = [], witnesses = [], h = makeHarness();
  h.run("var r1NativeSet=localStorage.setItem;");
  function test(name, fn) { try { fn(); checks.push({ name, status: "PASS" }); } catch (e) { checks.push({ name, status: "FAIL", error: e.stack }); } }
  function trap() {
    h.run("var r1Writes=[];localStorage.setItem=function(k,v){r1Writes.push({key:k,value:v});return r1NativeSet.call(this,k,v)};var r1Calls=0;ReceiverExecutionV22Foundation={execute:()=>{r1Calls++;throw Error('V2_EXECUTION')},resolveStage:()=>{r1Calls++;throw Error('V2_STAGE')}};");
  }
  function saveUnchanged() {
    const before = h.snapshot(); h.run("saveGame()"); assert.deepEqual(h.snapshot(), before); assert.equal(h.run("r1Calls"), 0);
    const writes = h.json("r1Writes"); assert.equal(writes.at(-1).key, "baseballLifeRpgSave"); return JSON.parse(writes.at(-1).value);
  }
  test("ordinary Legacy path executes literal JSON.stringify(player), without serializer", () => {
    h.fresh({ occupied: 1 }); trap(); const player = h.json("player");
    // Removing the adapter proves the ordinary branch does not depend on serialization helpers.
    h.run("var r1Source=ReceiverSourceSnapshot;ReceiverSourceSnapshot=undefined;");
    try { const saved = saveUnchanged(); assert.deepEqual(saved, player); assert.equal(saved.saveVersion, 15); assert.equal(saved.receiverSourceSaveFormatVersion, undefined); }
    finally { h.run("ReceiverSourceSnapshot=r1Source"); }
  });
  test("ordinary Legacy adapter validation is called before the real write", () => {
    h.fresh({ occupied: 1 }); trap(); h.run("var r1OriginalSource=ReceiverSourceSnapshot;ReceiverSourceSnapshot={...r1OriginalSource,validateRawSave:()=>{throw Error('PREWRITE_VALIDATION')}};");
    try { assert.throws(() => h.run("saveGame()"), /PREWRITE_VALIDATION/); assert.equal(h.run("r1Writes.length"), 0); }
    finally { h.run("ReceiverSourceSnapshot=r1OriginalSource"); }
  });
  for (const phase of ["pending", "executed", "settled"]) test("source-only " + phase + " real Save / duplicate / cold preserves complete official state", () => {
    h.fresh({}, "beforeExecution");
    if (phase !== "pending") h.run("beginAutomaticGroundBallSituationExecution(m);firstBaseExecute(m,'secure',.8);");
    if (phase === "settled") h.run("resumeResolvedHighSchoolGroundBallSettlement(m);");
    // An executed source state uses the existing Legacy cache; no v2 result is created.
    trap(); const original = h.snapshot(), saved = saveUnchanged(); assert.equal(saved.saveVersion, 16); assert.equal(saved.receiverSourceSaveFormatVersion, "receiver-source-only-save-v1");
    assert.deepEqual(saved.highSchoolMatch, original.player.highSchoolMatch);
    for (let n = 0; n < 3; n++) assert.deepEqual(saveUnchanged(), saved);
    h.context.r1Saved = saved; const expected = h.json("normalizeSave(r1Saved)"); h.cold("R1 cold " + phase);
    assert.deepEqual(h.json("player"), expected); assert.deepEqual(h.json("s3bRng"), original.rng); assert.equal(h.run("r1Calls"), 0);
    witnesses.push({ phase, saveVersion: saved.saveVersion, sourcePin: saved.highSchoolMatch.receiverSourceAdmission.pin.pinDigest, duplicateWrites: 4, cold: "PASS", officialCandidateCalls: 0 });
  });
  test("genuine historical Legacy pending/executed/settled saves never backfill source", () => {
    const old = makeHarness("baseline");
    for (const phase of ["pending", "executed", "settled"]) {
      old.fresh({}, "beforeExecution");
      if (phase !== "pending") old.run("beginAutomaticGroundBallSituationExecution(m);firstBaseExecute(m,'secure',.8);");
      if (phase === "settled") old.run("resumeResolvedHighSchoolGroundBallSettlement(m);");
      const raw = old.json("player"); h.context.r1Historical = raw;
      const normalized = h.json("normalizeSave(r1Historical)"); assert.equal(normalized.saveVersion, 15); assert.equal(normalized.highSchoolMatch.receiverSourceAdmission, undefined);
      assert.deepEqual(officialProjection(normalized), officialProjection(old.json("normalizeSave(player)")));
    }
  });
  test("later ordinary Match retains version15 storage without live root mutation", () => {
    h.fresh(); h.run("player={...player,saveVersion:16,receiverSourceSaveFormatVersion:ReceiverSourceSnapshot.versions.saveFormat,highSchoolMatch:createInitialPlayer().highSchoolMatch};m=player.highSchoolMatch;"); trap();
    const saved = saveUnchanged(); assert.equal(saved.saveVersion, 15); assert.equal(saved.receiverSourceSaveFormatVersion, undefined);
  });
  for (const [name, code] of [
    ["unknown live version", "player.saveVersion=17"],
    ["unknown live format", "player.receiverSourceSaveFormatVersion='future'"],
    ["missing source format", "delete m.receiverSourceFormatVersion"],
    ["pin tamper", "m.receiverSourceAdmission.pin.runtimeEnabled=true"],
    ["physical tamper", "m.groundBallInPlayState.receiverSourceSnapshot.body.physical.contactId+='other'"],
    ["actor tamper", "m.groundBallInPlayState.receiverSourceSnapshot.body.original.receiver.actorId='other'"],
    ["sample tamper", "m.groundBallInPlayState.shortstopExecution.sample=.3"],
    ["no adapter for source-only", "ReceiverSourceSnapshot=undefined"]
  ]) test("invalid source-only Save refuses storage: " + name, () => {
    h.fresh({}, "automatic"); trap(); h.run("player=JSON.parse(JSON.stringify(player));m=player.highSchoolMatch;var r1OriginalSource=ReceiverSourceSnapshot;" + code); const before = h.snapshot();
    try { assert.throws(() => h.run("saveGame()")); assert.equal(h.run("r1Writes.length"), 0); assert.deepEqual(h.snapshot(), before); }
    finally { h.run("ReceiverSourceSnapshot=r1OriginalSource"); }
  });
  test("ordinary unknown version also refuses storage", () => { h.fresh({ occupied: 1 }); trap(); h.run("player.saveVersion=17"); assert.throws(() => h.run("saveGame()")); assert.equal(h.run("r1Writes.length"), 0); });
  test("raw restore rejects erased format before normalization defaults", () => {
    h.fresh(); trap(); const saved = saveUnchanged(); delete saved.receiverSourceSaveFormatVersion; h.context.r1Raw = saved;
    assert.throws(() => h.run("normalizeSave(r1Raw)"));
  });
  test("shared early-return guard cannot skip source pin validation", () => {
    h.fresh({}, "automatic"); const m = h.json("m"); m.groundBallInPlayState.receiverSourcePin.runtimeEnabled = true; m.groundBallInPlayState.settlementApplied = true; h.context.r1Tampered = m;
    assert.throws(() => h.run("validateHighSchoolDecisionThrowState(r1Tampered)"));
  });
  test("SAVE_VERSION15 / SAVE_KEY / effective Legacy literal unchanged", () => {
    assert(/const SAVE_VERSION = 15;/.test(fs.readFileSync("player.js", "utf8")));
    const s = fs.readFileSync("save.js", "utf8"); assert(s.includes('const SAVE_KEY = "baseballLifeRpgSave";')); assert(s.includes("localStorage.setItem(SAVE_KEY, JSON.stringify(player));"));
  });
  return { summary: { total: checks.length, passed: checks.filter(c => c.status === "PASS").length, failed: checks.filter(c => c.status === "FAIL").length }, checks, witnesses, limits: "Source-only Save metadata with existing Legacy caches; no authoritative v2 execution, source calibration or shadow integration acceptance." };
}
module.exports = { run };
if (require.main === module) { const r = run(); console.log(JSON.stringify(r, null, 2)); if (r.summary.failed) process.exitCode = 1; }
