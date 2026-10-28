"use strict";
const assert = require("node:assert/strict"), R = require("./receiver-execution-v2-sprint-10a3b-r4-runner.cjs");
function red() {
  const result = R.runSuite(R.BBP); assert.equal(result.exitCode, 1); assert.equal(result.error, null);
  assert(result.stderr.includes("ReferenceError: TeamRosterFoundation is not defined")); assert(result.stderr.includes("ensureHighSchoolOrdinaryGroundBallInPlayHandoff"));
  return { summary: { total: 1, passed: 1, failed: 0 }, expectedRed: true, result, scriptHash: R.hash(R.read("script.js")), testUnchanged: result.sourceHash === R.json(R.prefix + "baseline-evidence.json").hashes[R.BBP] };
}
const { makeHarness, officialProjection } = require("./receiver-execution-v2-sprint-10a3b-harness.cjs");
function run() {
  const h = makeHarness(), checks = [], witnesses = [];
  function test(name, fn) { try { fn(); checks.push({ name, status: "PASS" }); } catch (e) { checks.push({ name, status: "FAIL", error: e.stack }); } }
  function restore() { h.run("ReceiverSourceSnapshot=r4Source;TeamRosterFoundation=r4Roster;MatchSituationLifecycle=r4Life;BattedBallGroundDefense=r4Ground"); }
  function originals() { h.run("var r4Source=ReceiverSourceSnapshot,r4Roster=TeamRosterFoundation,r4Life=MatchSituationLifecycle,r4Ground=BattedBallGroundDefense"); }
  function missing(name, action, call = "validateHighSchoolReceiverSourceMetadata(m)") { test(name, () => {
    h.fresh({}, "beforeExecution"); originals(); h.run(action);
    try { assert.throws(() => h.run(call), /Receiver source .* module required/); assert.equal(h.run("s3bRng.callbacks.length"), 0); } finally { restore(); }
  }); }
  test("RED captures original ReferenceError and unchanged original test", () => { const r = R.json(R.prefix + "red-evidence.json").result; assert(r.expectedRed && r.testUnchanged); assert(r.result.stderr.includes("ReferenceError: TeamRosterFoundation is not defined")); });
  test("eligible Production SS source uses real canonical actors before sample", () => {
    const m = h.fresh({}, "beforeExecution"), b = m.receiverSourceAdmission.snapshot.body; assert.equal(b.original.thrower.actorId, "player");
    assert.equal(b.original.receiver.actorId, h.run("TeamRosterFoundation.getCurrentDefender(m.rosters[m.defenseTeam],'1B').id")); assert.equal(h.run("s3bRng.callbacks.length"), 0);
    assert.equal(m.groundBallInPlayState.shortstopExecution, undefined); assert.equal(b.phaseAtAdmission, "beforeExecution"); assert.equal(m.receiverSourceAdmission.pin.runtimeEnabled, false);
    witnesses.push({ name: "normalProduction", physical: b.physical, actors: { thrower: b.original.thrower, receiver: b.original.receiver }, sampleCallbacks: 0 });
  });
  for (const action of ["ReceiverSourceSnapshot=undefined", "delete globalThis.ReceiverSourceSnapshot", "ReceiverSourceSnapshot=null"]) test("source absent/no admission preserves Legacy: " + action, () => {
    originals(); h.run(action); try { h.fresh({}, "automatic"); assert.equal(h.run("m.receiverSourceAdmission"), undefined); assert.equal(h.run("s3bRng.callbacks.length"), 1); h.run("validateHighSchoolDecisionThrowState(m)"); } finally { restore(); }
  });
  for (const sourcePresent of [false, true]) for (const action of ["TeamRosterFoundation=undefined", "delete globalThis.TeamRosterFoundation", "TeamRosterFoundation=null"]) test("no admission / optional roster at boundary: source=" + sourcePresent + " " + action, () => {
    originals(); h.run("var r4FirstContext=createHighSchoolFirstBaseContext,r4Ensure=ensureHighSchoolOrdinaryGroundBallInPlayHandoff,r4Get=getHighSchoolReceiverSourceAdapter,r4Boundary=[];" + (sourcePresent ? "" : "ReceiverSourceSnapshot=undefined;") +
      "createHighSchoolFirstBaseContext=function(...args){var result=r4FirstContext(...args);" + action + ";return result;};" +
      "getHighSchoolReceiverSourceAdapter=function(...args){var result=r4Get(...args);r4Boundary.push({rosterAbsent:typeof TeamRosterFoundation==='undefined'||TeamRosterFoundation===null,sourceAvailable:result!==null});return result;};" +
      "ensureHighSchoolOrdinaryGroundBallInPlayHandoff=function(...args){try{return r4Ensure(...args)}finally{TeamRosterFoundation=r4Roster;}};");
    try { h.fresh({}, "beforeExecution"); assert.equal(h.run("m.receiverSourceAdmission"), undefined); assert.equal(h.run("s3bRng.callbacks.length"), 0); assert(h.json("r4Boundary").some(x => x.rosterAbsent && !x.sourceAvailable)); }
    finally { restore(); h.run("createHighSchoolFirstBaseContext=r4FirstContext;ensureHighSchoolOrdinaryGroundBallInPlayHandoff=r4Ensure;getHighSchoolReceiverSourceAdapter=r4Get"); }
  });
  for (const action of ["ReceiverSourceSnapshot=undefined", "delete globalThis.ReceiverSourceSnapshot", "ReceiverSourceSnapshot=null", "ReceiverSourceSnapshot={}"]) missing("new metadata requires source adapter: " + action, action);
  for (const action of ["TeamRosterFoundation=undefined", "delete globalThis.TeamRosterFoundation", "TeamRosterFoundation=null"]) missing("new metadata requires roster owner: " + action, action);
  missing("binding requires source adapter", "ReceiverSourceSnapshot=undefined", "bindHighSchoolReceiverSourceExecution(m)");
  missing("binding requires ground owner", "BattedBallGroundDefense=undefined", "bindHighSchoolReceiverSourceExecution(m)");
  missing("binding requires pinned lifecycle owner", "MatchSituationLifecycle=undefined", "bindHighSchoolReceiverSourceExecution(m)");
  for (const value of ["undefined", "null", "false", "0", "''"]) test("falsy but present source tag cannot become historical: " + value, () => {
    h.fresh({ occupied: 1 }, "automatic"); originals(); h.run("ReceiverSourceSnapshot=undefined;m.receiverSourceFormatVersion=" + value);
    try { assert.throws(() => h.run("validateHighSchoolReceiverSourceMetadata(m)"), /snapshot module required/); } finally { restore(); }
  });
  for (const [scope, key] of [["m", "receiverSourceAdmission"], ["m.groundBallInPlayState", "receiverSourceExecutionBinding"], ["m.activeSituation", "receiverSourcePin"], ["m.activeSituation.contextSnapshot", "receiverSourcePin"], ["m.lastClosedSituationSummary", "receiverSourceExecutionBinding"]]) test("source presence requires adapter: " + scope + "." + key, () => {
    h.fresh({ occupied: 1 }, "automatic"); originals(); h.run("player=JSON.parse(JSON.stringify(player));m=player.highSchoolMatch;ReceiverSourceSnapshot=undefined;m.lastClosedSituationSummary={};" + scope + "." + key + "=undefined");
    try { assert.throws(() => h.run("validateHighSchoolReceiverSourceMetadata(m)"), /snapshot module required/); } finally { restore(); }
  });
  test("unknown source version rejects before sample", () => { const m = h.fresh({}, "beforeExecution"); m.receiverSourceFormatVersion = "future"; h.context.r4Bad = m; assert.throws(() => h.run("validateHighSchoolDecisionThrowState(r4Bad)"), /required match format/); assert.equal(h.run("s3bRng.callbacks.length"), 0); });
  test("Unicode long canonical ID remains byte-exact", () => {
    h.fresh({}, "beforeExecution"); const original = h.json("m.receiverSourceAdmission"), a = structuredClone(original), suffix = "|界".repeat(500);
    for (const k of ["matchId", "plateAppearanceId", "contactId", "physicalIdentity", "playId"]) a.snapshot.body.physical[k] += suffix;
    const s = require("../receiver-source-snapshot.js"), created = s.createSnapshot({ physical: a.snapshot.body.physical, original: a.snapshot.body.original, capabilitySource: a.snapshot.body.capabilitySource, beforeExecution: true });
    assert.equal(created.snapshot.body.physical.playId, a.snapshot.body.physical.playId); assert.equal(s.validatePair(created.snapshot, created.pin), true); assert.deepEqual(h.json("m.receiverSourceAdmission"), original);
  });
  test("hold keeps nullable actual receiver/target and one sample", () => { h.fresh({}, "beforeExecution"); h.run("var r4Held=firstBaseExecute(m,'contain',.8)"); const b = h.json("m.groundBallInPlayState.receiverSourceExecutionBinding"); assert.equal(b.actualReceiverId, null); assert.deepEqual(b.actualTarget, { runnerId: null, base: null }); assert.equal(b.releaseQuality, "held"); assert.equal(h.run("r4Held.rolls"), 1); });
  for (const action of ["m.groundBallInPlayState.receiverSourcePin.runtimeEnabled=true", "m.groundBallInPlayState.receiverSourceExecutionBinding.originalSampleBinary64='3fd3333333333333'"]) test("same-play tamper still rejected: " + action, () => {
    h.fresh({}, "automatic"); h.run("player=JSON.parse(JSON.stringify(player));m=player.highSchoolMatch;" + action); assert.throws(() => h.run("validateHighSchoolDecisionThrowState(m)"), /receiver source/);
  });
  test("cross-play archive does not interfere with current Legacy", () => { h.context.r4Cross = R.json("docs/receiver-execution-v2-sprint-10a3b-r3-reproduction-evidence.json").metadataReplay; h.run("validateHighSchoolReceiverSourceMetadata(r4Cross)"); });
  test("cross-play archive still requires adapter", () => { h.context.r4Cross = R.json("docs/receiver-execution-v2-sprint-10a3b-r3-reproduction-evidence.json").metadataReplay; originals(); h.run("ReceiverSourceSnapshot=undefined"); try { assert.throws(() => h.run("validateHighSchoolReceiverSourceMetadata(r4Cross)"), /snapshot module required/); } finally { restore(); } });
  for (const [name, action] of [["first-base", "m.groundBallInPlayState.firstBaseContext={}"], ["3B", "m.groundBallInPlayState.thirdBaseExecution={}"], ["missingFacts", "delete m.groundBallInPlayState.decisionThrowState"]]) test("new metadata rejected before " + name + " early return", () => {
    h.fresh({}, "automatic"); originals(); h.run("ReceiverSourceSnapshot=undefined;" + action); try { assert.throws(() => h.run("validateHighSchoolDecisionThrowState(m)"), /snapshot module required/); } finally { restore(); }
  });
  for (const sourcePresent of [true, false]) test("exact official state/callbacks equals baseline: source=" + sourcePresent, () => {
    const old = makeHarness("baseline"); old.fresh({}, "automatic"); originals(); if (!sourcePresent) h.run("ReceiverSourceSnapshot=undefined");
    try { h.fresh({}, "automatic"); assert.deepEqual(officialProjection(h.snapshot()), officialProjection(old.snapshot())); } finally { restore(); }
  });
  test("guard/observer/duplicates add no callbacks/candidate/official writes", () => {
    h.fresh({}, "automatic"); const before = h.snapshot(); h.run("var r4CandidateCalls=0;ReceiverExecutionV22Foundation={execute:()=>{r4CandidateCalls++;throw Error('V2')},resolveStage:()=>{r4CandidateCalls++;throw Error('V2')}}");
    for (let i = 0; i < 3; i++) h.run("validateHighSchoolReceiverSourceMetadata(m);ReceiverSourceSnapshot.observe(m);resumeResolvedHighSchoolGroundBallSettlement(m)"); assert.deepEqual(h.snapshot(), before); assert.equal(h.run("r4CandidateCalls"), 0);
  });
  return { summary: { total: checks.length, passed: checks.filter(x => x.status === "PASS").length, failed: checks.filter(x => x.status === "FAIL").length }, checks, witnesses, runtimeEnabled: false, candidateExecutionCalls: 0 };
}
module.exports = { red, run };
if (require.main === module) { const result = run(); console.log(JSON.stringify(result)); if (result.summary.failed) process.exitCode = 1; }
