"use strict";
const assert = require("node:assert/strict"), vm = require("node:vm");
const { makeHarness, officialProjection } = require("./receiver-execution-v2-sprint-10a3b-harness.cjs");
const R = require("./receiver-execution-v2-sprint-10a3b-r3-runner.cjs"), Source = require("../receiver-source-snapshot.js");
const clone = x => JSON.parse(JSON.stringify(x));
function run() {
  const checks = [], witnesses = [], h = makeHarness();
  function test(name, fn) { try { fn(); checks.push({ name, status: "PASS" }); } catch (e) { checks.push({ name, status: "FAIL", error: e.stack }); } }
  function rejects(name, mutate, phase = "automatic", pattern = /Invalid receiver source metadata/) {
    test(name, () => { const m = h.fresh({}, phase); mutate(m); assert.throws(() => Source.validateMatch(m), pattern); });
  }
  const reproduction = R.json(R.prefix + "reproduction-evidence.json").metadataReplay;
  test("actual gradient metadata replay: archived closed versus current Legacy ACCEPT", () => { assert.equal(Source.validateMatch(reproduction), true); });
  test("original R2 validator reproduces canonical(undefined) on captured operands", () => {
    const sandbox = { module: { exports: {} } }; vm.createContext(sandbox);
    vm.runInContext(R.read("team-roster-foundation.js").toString(), sandbox);
    const old = R.json("docs/receiver-execution-v2-sprint-10a3b-r3-original-validator.json").source;
    const bytes = R.read("receiver-source-snapshot.js").toString().replace(/  function validateMatch\(match\) \{[\s\S]*?(?=  function validateRawSave)/, old + "\n");
    vm.runInContext(bytes, sandbox); sandbox.replay = reproduction;
    assert.throws(() => sandbox.ReceiverSourceSnapshot.validateMatch(sandbox.replay), /non-JSON metadata/);
  });
  for (const phase of ["pending", "executed", "settled", "closed"]) test("same play complete metadata ACCEPT " + phase, () => {
    h.fresh({}, "beforeExecution"); if (phase !== "pending") h.run("beginAutomaticGroundBallSituationExecution(m);firstBaseExecute(m,'secure',.8)");
    if (["settled", "closed"].includes(phase)) h.run("resumeResolvedHighSchoolGroundBallSettlement(m)");
    assert.equal(h.run("ReceiverSourceSnapshot.validateMatch(m)"), true); h.cold("R3 " + phase);
    witnesses.push({ phase, sourceFormat: h.run("m.receiverSourceFormatVersion"), lifecycle: h.run("m.activeSituation?.lifecycleState || m.lastClosedSituationSummary?.lifecycleState") });
  });
  rejects("same play required current binding missing REJECT", m => { delete m.groundBallInPlayState.receiverSourceExecutionBinding; }, "automatic", /required original execution binding/);
  rejects("same play required current binding undefined REJECT explicit", m => { m.groundBallInPlayState.receiverSourceExecutionBinding = undefined; }, "automatic", /execution binding required/);
  rejects("same play binding tamper REJECT", m => { m.groundBallInPlayState.receiverSourceExecutionBinding.originalSampleBinary64 = "3fd3333333333333"; });
  rejects("same play actor tamper REJECT", m => { m.groundBallInPlayState.receiverSourceSnapshot.body.original.receiver.actorId = "other"; });
  for (const field of ["matchId", "plateAppearanceId", "contactId", "physicalIdentity", "playId"]) rejects("same play physical tamper REJECT " + field, m => { m.groundBallInPlayState.receiverSourceSnapshot.body.physical[field] += "other"; });
  rejects("pending binding is forbidden", m => { m.groundBallInPlayState.receiverSourceExecutionBinding = {}; }, "beforeExecution");
  rejects("missing current source-format tag REJECT", m => { delete m.groundBallInPlayState.receiverSourceFormatVersion; });
  rejects("unknown current source-format version REJECT", m => { m.groundBallInPlayState.receiverSourceFormatVersion = "future"; });
  rejects("undefined tag is present, not historical omission", m => { m.groundBallInPlayState.receiverSourceFormatVersion = undefined; });
  rejects("same identity erase handoff source tags REJECT", m => { for (const k of ["receiverSourceFormatVersion", "receiverSourceSnapshot", "receiverSourcePin", "receiverSourceExecutionBinding"]) delete m.groundBallInPlayState[k]; });
  for (const [label, value] of [["undefined", undefined], ["NaN", NaN], ["function", () => 1]]) rejects("non-JSON binding metadata REJECT explicit " + label, m => { m.groundBallInPlayState.receiverSourceExecutionBinding.actualReceiverId = value; }, "automatic", /execution binding non-JSON metadata/);
  rejects("cyclic snapshot metadata REJECT explicit", m => { m.groundBallInPlayState.receiverSourceSnapshot.body.provenance.cycle = m.groundBallInPlayState.receiverSourceSnapshot; }, "automatic", /snapshot non-JSON metadata/);
  rejects("missing closed binding REJECT", m => { delete m.lastClosedSituationSummary.receiverSourceExecutionBinding; }, "automatic", /execution binding required/);
  test("cross-play archive tamper still REJECT against its own pin", () => {
    for (const [field, value] of [["physicalIdentity", "other"], ["pinDigest", "other"], ["snapshotDigest", "other"], ["version", "future"], ["originalExecutionOwner", "other"], ["candidateExecutionPerformed", true]]) {
      const m = clone(reproduction); m.lastClosedSituationSummary.receiverSourceExecutionBinding[field] = value; assert.throws(() => Source.validateMatch(m), /execution binding/);
    }
  });
  test("cross-play archive physical pin tamper REJECT", () => { const m = clone(reproduction); m.lastClosedSituationSummary.receiverSourcePin.physical.contactId += "other"; assert.throws(() => Source.validateMatch(m), /pin reference/); });
  test("cross-play archive requires closed lifecycle", () => { const m = clone(reproduction); m.lastClosedSituationSummary.lifecycleState = "executing"; assert.throws(() => Source.validateMatch(m), /closed archive/); });
  test("cross-play new source admission independently validates archive and current", () => {
    const a = h.fresh({}, "automatic"), b = h.fresh({ outs: 1 }, "beforeExecution"); assert.equal(a.id, b.id); assert.notEqual(a.groundBallInPlayState.identity, b.groundBallInPlayState.identity);
    b.lastClosedSituationSummary = a.lastClosedSituationSummary; assert.equal(Source.validateMatch(b), true);
    b.lastClosedSituationSummary.receiverSourceExecutionBinding.physicalIdentity = "other"; assert.throws(() => Source.validateMatch(b), /execution binding/);
  });
  test("real consecutive full games have multiple ground opportunities, no candidate calls", () => {
    const a = require("./ability-performance-correlation-audit.cjs").createHarness();
    a.ctx.run("var r3CandidateCalls=0;ReceiverExecutionV22Foundation={execute:()=>{r3CandidateCalls++;throw Error('CANDIDATE')},resolveStage:()=>{r3CandidateCalls++;throw Error('STAGE')}}");
    for (const seed of [19, 20]) { const g = a.play("baseballSkills.batting", 8, seed); assert(g.log.filter(x => x.type === "playerRoutinePlay" || x.type === "meaningfulMomentResolved").length > 1); }
    assert.equal(a.ctx.run("r3CandidateCalls"), 0);
  });
  test("automatic routine callback/order preserved; duplicate no RNG/record/evaluation writes", () => {
    h.fresh({}, "automatic"); assert.equal(h.run("s3bRng.callbacks.length"), 1); assert.equal(h.run("s3bRng.callbacks[0].phase"), "executing"); const before = h.snapshot();
    for (let n = 0; n < 3; n++) h.run("resumeResolvedHighSchoolGroundBallSettlement(m);ReceiverSourceSnapshot.validateMatch(m)"); assert.deepEqual(h.snapshot(), before);
  });
  test("meaningful occupied-base public execution and duplicate preserve official facts", () => {
    h.fresh({ occupied: 1 }, "automatic"); h.run("var r3Public=firstBasePublic(m,'secure',.8)"); const before = h.snapshot();
    assert.equal(h.run("chooseHighSchoolYearOneMatchMoment(r3Public.choice.matchDecision,r3Public.choice.matchMomentId,()=>{throw Error('DUPLICATE_RNG')})"), false); assert.deepEqual(h.snapshot(), before);
  });
  for (const [name, mutate] of [["first-base", m => { m.groundBallInPlayState.firstBaseContext = {}; }], ["3B", m => { m.groundBallInPlayState.thirdBaseExecution = {}; }], ["missingFacts", m => { delete m.groundBallInPlayState.decisionThrowState; }]]) test("shared guard rejects source tamper before " + name + " early return", () => {
    const m = h.fresh({}, "automatic"); m.groundBallInPlayState.receiverSourcePin.runtimeEnabled = true; mutate(m); h.context.r3Bad = m; assert.throws(() => h.run("validateHighSchoolDecisionThrowState(r3Bad)"), /receiver source/);
  });
  test("raw Save unknown/missing versions and erased header cannot downgrade", () => {
    h.fresh({}, "automatic"); const raw = h.json("JSON.parse(ReceiverSourceSnapshot.serializeSave(player))");
    for (const mutate of [s => { s.saveVersion = 17; }, s => { delete s.receiverSourceSaveFormatVersion; }, s => { delete s.highSchoolMatch.receiverSourceFormatVersion; }, s => { s.highSchoolMatch.receiverSourceFormatVersion = "future"; }]) {
      const bad = clone(raw); mutate(bad); h.context.r3BadSave = bad; assert.throws(() => h.run("normalizeSave(r3BadSave)"), /receiver source/);
    }
  });
  test("genuine historical omission remains compatible in three phases", () => {
    const old = makeHarness("baseline");
    for (const phase of ["pending", "executed", "settled"]) { old.fresh({}, "beforeExecution"); if (phase !== "pending") old.run("beginAutomaticGroundBallSituationExecution(m);firstBaseExecute(m,'secure',.8)"); if (phase === "settled") old.run("resumeResolvedHighSchoolGroundBallSettlement(m)");
      h.context.r3Historical = old.json("player"); assert.deepEqual(officialProjection(h.json("normalizeSave(r3Historical)")), officialProjection(old.json("normalizeSave(player)")));
    }
  });
  test("explicitly undefined lifecycle pin is not historical omission", () => { assert.throws(() => Source.assertLifecycle({ receiverSourcePin: undefined }), /pin reference required/); });
  test("binding without pin cannot escape legacy early return", () => { assert.throws(() => Source.validateMatch({ activeSituation: { receiverSourceExecutionBinding: {} } }), /required match format/); });
  test("observer and shared source guard write no official state or RNG", () => {
    h.fresh({}, "automatic"); const before = h.snapshot(); h.run("var r3Calls=0;ReceiverExecutionV22Foundation={execute:()=>{r3Calls++;throw Error('V2')},resolveStage:()=>{r3Calls++;throw Error('V2')}}");
    for (let i = 0; i < 3; i++) h.run("ReceiverSourceSnapshot.observe(m);validateHighSchoolDecisionThrowState(m)"); assert.deepEqual(h.snapshot(), before); assert.equal(h.run("r3Calls"), 0);
  });
  return { summary: { total: checks.length, passed: checks.filter(x => x.status === "PASS").length, failed: checks.filter(x => x.status === "FAIL").length }, checks, witnesses, sourceHash: R.hash(R.read("receiver-source-snapshot.js")), runtimeEnabled: false };
}
module.exports = { run };
if (require.main === module) { const r = run(); console.log(JSON.stringify(r)); if (r.summary.failed) process.exitCode = 1; }
