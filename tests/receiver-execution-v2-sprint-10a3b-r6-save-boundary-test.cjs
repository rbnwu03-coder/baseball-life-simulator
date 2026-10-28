"use strict";
const assert = require("node:assert/strict");
const { makeHarness, officialProjection } = require("./receiver-execution-v2-sprint-10a3b-harness.cjs");
function run() {
  const checks = [], witnesses = [], h = makeHarness();
  const loadErrors = [];
  h.context.console = { ...h.context.console, error: e => loadErrors.push({ name: e.name, message: e.message, stack: e.stack }) };
  function test(name, fn) { try { fn(); checks.push({ name, status: "PASS" }); } catch (e) { checks.push({ name, status: "FAIL", error: e.stack }); } }
  function fixture(phase = "executed") {
    loadErrors.length = 0;
    h.fresh({}, "beforeExecution"); if (phase !== "pending") h.run("beginAutomaticGroundBallSituationExecution(m);firstBaseExecute(m,'secure',.8);"); if (phase === "settled") h.run("resumeResolvedHighSchoolGroundBallSettlement(m);");
    h.run("var r6NativeWrite=localStorage.setItem;saveGame();var r6Wire=localStorage.getItem(SAVE_KEY);var r6Writes=0;var r6CandidateCalls=0;localStorage.setItem=function(...a){r6Writes++;return r6NativeWrite.apply(this,a)};ReceiverExecutionV22Foundation={execute:()=>{r6CandidateCalls++;throw Error('candidate execution')},resolveStage:()=>{r6CandidateCalls++;throw Error('candidate stage')}};");
    return JSON.parse(h.run("r6Wire"));
  }
  function defaultsTrap() { h.run("var r6Defaults=0;var r6Initial=createInitialPlayer;createInitialPlayer=function(...a){r6Defaults++;return r6Initial(...a)};"); }
  function restoreTrap() { h.run("if(typeof r6Initial==='function')createInitialPlayer=r6Initial;localStorage.setItem=r6NativeWrite;"); }
  for (const phase of ["pending", "executed", "settled"]) {
    test("Source16 " + phase + " direct normalizeSave preserves official state without writes/RNG/candidate", () => {
      const raw = fixture(phase), before = h.snapshot(), text = JSON.stringify(raw); h.context.r6Raw = raw;
      const normalized = h.json("normalizeSave(r6Raw)"); assert.equal(normalized.saveVersion, 16); assert.equal(normalized.receiverSourceSaveFormatVersion, "receiver-source-only-save-v1");
      assert.deepEqual(h.snapshot(), before); assert.equal(JSON.stringify(raw), text); assert.equal(h.run("r6Writes"), 0); assert.equal(h.run("r6CandidateCalls"), 0); witnesses.push({ phase, entry: "direct normalizeSave", rawUnchanged: true, writes: 0, candidate: 0 }); restoreTrap();
    });
    test("Source16 " + phase + " loadGame uses same raw owner and commits only admitted candidate", () => {
      const raw = fixture(phase); h.context.r6Raw = raw; const expected = h.json("normalizeSave(r6Raw)"), rng = h.json("s3bRng");
      h.run("player=createInitialPlayer('R6 before load');loadGame();m=player.highSchoolMatch;"); assert.deepEqual(h.json("player"), expected); assert.deepEqual(h.json("s3bRng"), rng); assert.equal(h.run("r6Writes"), 0); assert.equal(h.run("r6CandidateCalls"), 0); restoreTrap();
    });
  }
  const mutations = [
    ["missing header", r => delete r.receiverSourceSaveFormatVersion],
    ["tampered legitimate header", r => r.receiverSourceSaveFormatVersion = "receiver-source-only-save-v2"],
    ["future Save version", r => r.saveVersion = 17],
    ["missing match format", r => delete r.highSchoolMatch.receiverSourceFormatVersion],
    ["missing pin", r => delete r.highSchoolMatch.groundBallInPlayState.receiverSourcePin],
    ["missing executed binding", r => delete r.highSchoolMatch.groundBallInPlayState.receiverSourceExecutionBinding],
    ["physical tamper", r => r.highSchoolMatch.groundBallInPlayState.receiverSourceSnapshot.body.physical.contactId += "other"],
    ["actor tamper", r => r.highSchoolMatch.groundBallInPlayState.receiverSourceSnapshot.body.original.receiver.actorId = "other"],
    ["sample tamper", r => r.highSchoolMatch.groundBallInPlayState.shortstopExecution.sample = .3]
  ];
  for (const [label, mutate] of mutations) {
    test("direct raw " + label + " rejects BEFORE defaults/merge", () => {
      const raw = fixture(); mutate(raw); h.context.r6Raw = raw; const text = JSON.stringify(raw), before = h.snapshot(); defaultsTrap();
      try { assert.throws(() => h.run("normalizeSave(r6Raw)"), /receiver source/); assert.equal(h.run("r6Defaults"), 0); assert.equal(h.run("r6Writes"), 0); assert.equal(h.run("r6CandidateCalls"), 0); assert.equal(JSON.stringify(raw), text); assert.deepEqual(h.snapshot(), before); } finally { restoreTrap(); }
    });
    test("loadGame raw " + label + " rejects without live commit/normalization/writer", () => {
      const raw = fixture(); mutate(raw); h.context.r6WireBad = JSON.stringify(raw); h.run("r6NativeWrite.call(localStorage,SAVE_KEY,r6WireBad);player=createInitialPlayer('R6 retained');m=player.highSchoolMatch;"); const before = h.snapshot(); defaultsTrap();
      try { h.run("loadGame()"); assert.equal(loadErrors.length, 1); assert.match(loadErrors[0].message, /receiver source/); assert.equal(h.run("r6Defaults"), 0); assert.equal(h.run("r6Writes"), 0); assert.equal(h.run("r6CandidateCalls"), 0); assert.deepEqual(h.snapshot(), before); assert.equal(h.run("localStorage.getItem(SAVE_KEY)"), JSON.stringify(raw)); witnesses.push({ entry: "loadGame", mutation: label, error: loadErrors[0], defaultsCalls: 0, writes: 0, candidateCalls: 0, liveCommit: false }); } finally { restoreTrap(); }
    });
  }
  test("Source16 missing adapter rejects direct raw before defaults", () => {
    const raw = fixture(); h.context.r6Raw = raw; const before = h.snapshot(); defaultsTrap(); h.run("var r6Source=ReceiverSourceSnapshot;ReceiverSourceSnapshot=undefined;");
    try { assert.throws(() => h.run("normalizeSave(r6Raw)"), /module required/); assert.equal(h.run("r6Defaults"), 0); assert.equal(h.run("r6Writes"), 0); assert.deepEqual(h.snapshot(), before); } finally { h.run("ReceiverSourceSnapshot=r6Source;"); restoreTrap(); }
  });
  test("Source16 missing adapter loadGame cannot replace live Player", () => {
    fixture(); h.run("player=createInitialPlayer('R6 absent adapter');m=player.highSchoolMatch;"); const before = h.snapshot(); defaultsTrap(); h.run("var r6Source=ReceiverSourceSnapshot;ReceiverSourceSnapshot=undefined;");
    try { h.run("loadGame()"); assert.equal(loadErrors.length, 1); assert.match(loadErrors[0].message, /module required/); assert.equal(h.run("r6Defaults"), 0); assert.equal(h.run("r6Writes"), 0); assert.deepEqual(h.snapshot(), before); witnesses.push({ entry: "loadGame", mutation: "missing adapter", error: loadErrors[0], defaultsCalls: 0, writes: 0, liveCommit: false }); } finally { h.run("ReceiverSourceSnapshot=r6Source;"); restoreTrap(); }
  });
  test("Ordinary Legacy15 with no adapter uses original JSON writer exactly once", () => {
    h.fresh({ occupied: 1 }); const before = h.snapshot(); h.run("var r6Source=ReceiverSourceSnapshot;ReceiverSourceSnapshot=undefined;var r6NativeWrite=localStorage.setItem;var r6Writes=0;localStorage.setItem=function(...a){r6Writes++;return r6NativeWrite.apply(this,a)};");
    try { h.run("saveGame()"); assert.equal(h.run("r6Writes"), 1); assert.deepEqual(JSON.parse(h.run("localStorage.getItem(SAVE_KEY)")), before.player); assert.deepEqual(h.snapshot(), before); } finally { h.run("ReceiverSourceSnapshot=r6Source;"); restoreTrap(); }
  });
  const old = makeHarness("baseline");
  for (const phase of ["pending", "executed", "settled"]) test("genuine formal owner Historical " + phase + " retains15 and no backfill", () => {
    old.fresh({}, "beforeExecution"); if (phase !== "pending") old.run("beginAutomaticGroundBallSituationExecution(m);firstBaseExecute(m,'secure',.8);"); if (phase === "settled") old.run("resumeResolvedHighSchoolGroundBallSettlement(m);");
    const raw = old.json("player"), text = JSON.stringify(raw); h.context.r6Historical = raw; const normalized = h.json("normalizeSave(r6Historical)"); assert.equal(normalized.saveVersion, 15); assert(!Object.hasOwn(normalized.highSchoolMatch, "receiverSourceAdmission")); assert.equal(JSON.stringify(raw), text); assert.deepEqual(officialProjection(normalized), officialProjection(old.json("normalizeSave(player)")));
  });
  return { summary: { total: checks.length, passed: checks.filter(c => c.status === "PASS").length, failed: checks.filter(c => c.status === "FAIL").length }, checks, witnesses, runtimeEnabled: false, scope: "Source-only metadata with Legacy execution; no authoritative Receiver v2 executed/settled Save support" };
}
module.exports = { run };
if (require.main === module) { const r = run(); console.log(JSON.stringify(r, null, 2)); if (r.summary.failed) process.exitCode = 1; }
