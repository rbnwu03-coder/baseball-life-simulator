"use strict";
const assert = require("node:assert/strict");
const cp = require("node:child_process");
const Pure = require("../receiver-execution-v2-foundation.js");
const P = require("../receiver-execution-v2-production-source-adapter-prototype.cjs");
const Probe = require("./receiver-execution-v2-sprint-10a2-source-probe.cjs");
const clone = v => JSON.parse(JSON.stringify(v));
const known = decimal => ({ status: "known", decimal });
const unknown = reason => ({ status: "unknown", reason });
function clockFixture() {
  return { scope: "isolatedFixture", version: P.versions.timing, sourceDomain: "proposedPhysicalClock", physicalIdentity: "fixture-contact-clock-1",
    origin: { version: P.versions.origin, originId: "fixture-common-contact-origin-1", physicalIdentity: "fixture-contact-clock-1", status: "known", decimal: "100.000" },
    times: { throwLaunch: known("102.000"), ballArrival: known("107.000"), positioningStart: known("100.250"),
      positioningCompletion: known("101.500"), receiveAttempt: known("107.000"), secureCompletion: known("107.200"),
      baseTouchCompletion: known("107.350"), runnerArrival: known("108.000") }, possession: true, contact: true, legality: "eligible" };
}
function timingProbe() { return { versions: P.versions, clock: P.timing(clockFixture()) }; }
function run() {
  const checks = [], observations = [], inputPaths = new Set(), H = Probe.makeHarness();
  let firstBefore, firstAfter, firstObservation;
  const test = (name, fn) => { try { fn(); checks.push({ name, status: "PASS" }); } catch (e) { checks.push({ name, status: "FAIL", message: e.stack }); } };
  function record(name, result) { observations.push({ name, sourceScope: "ORIGINAL_LEGACY_OWNER_IN_ISOLATED_EXISTING_FIXTURE_NOT_NATURAL_COHORT", result }); }
  function unchanged(sample, fn) { const before = JSON.stringify(sample.view), playerBefore = sample.vm.run("JSON.stringify(player)"); const result = fn();
    assert.equal(JSON.stringify(sample.view), before); assert.equal(sample.vm.run("JSON.stringify(player)"), playerBefore); return result; }
  for (const outs of [0, 1, 2]) {
    let before, after, pending, executed;
    test("real before-execution physical/actor snapshot outs " + outs, () => { before = H.collect({ outs }, "beforeExecution");
      pending = unchanged(before, () => P.observe(before.view)); assert.equal(pending.code, "productionSourceCompletenessBlocked");
      assert.equal(pending.anchor.body.initialOuts, outs); assert.deepEqual(pending.anchor.body.initialBases, [null, null, null]);
      assert.equal(pending.anchor.body.ssActor.id, "player"); assert.notEqual(pending.anchor.body.npcActor.id, "player");
      assert.equal(pending.anchor.body.runner.runnerId, before.view.match.ordinaryDefensivePlateAppearanceState.batterId);
      assert.equal(pending.originalSample, null); assert.equal(before.view.observedOwnedSamples.length, 0); record("before outs " + outs, pending);
      if (outs === 0) { firstBefore = before; firstObservation = pending; } });
    test("actual Unicode identity is preserved and current S8 rejects it outs " + outs, () => {
      assert.equal(pending.binding.physicalIdentity, before.view.match.groundBallInPlayState.physicalTruth.identity);
      assert(/[^\x00-\x7f]/.test(pending.binding.physicalIdentity)); assert.equal(pending.pureCompatibility.code, "invalidPhysicalIdentity");
      assert(pending.missingFacts.includes("currentPureAsciiIdentityContract")); assert.equal(pending.sealedCandidateInput, null); });
    test("post-execution retains original PA runner and fixed slot outs " + outs, () => { after = H.collect({ outs }, "postExecution");
      executed = unchanged(after, () => P.observe(after.view, pending.anchor)); assert.equal(executed.code, "productionSourceCompletenessBlocked");
      assert.equal(executed.originalSample.value, .8); assert.equal(executed.originalSample.binary64, Pure.binary64(.8));
      assert.equal(after.view.observedOwnedSamples.length, 1); assert.equal(after.view.observedOwnedSamples[0].phase, "executing");
      assert.equal(executed.delivery.status, "completed"); assert.equal(executed.delivery.canonicalThrow.targetRunnerId, pending.anchor.body.runner.runnerId);
      assert.equal(executed.fixedSlot.value, pending.fixedSlot.value); assert.deepEqual(executed.rawBindings, pending.rawBindings);
      assert.equal(executed.candidateExecutionCalls, 0); if (outs === 0) firstAfter = after;
      if (outs === 2) assert.notEqual(after.view.match.currentBatter, pending.anchor.body.runner.runnerId);
      record("post outs " + outs, executed); });
  }
  for (const [name, options, expected] of [["offline", { capabilities: { arm: 1, throwing: 1 } }, "offline"],
    ["acquisition failure", { capabilities: { fielding: 1, catching: 1 } }, "notAttempted"],
    ["legacy receiver failure", { weakReceiver: "1B" }, "completed"], ["fast runner already safe", { batterSpeed: 18 }, "completed"]]) {
    test("original " + name + " never fills independent source gaps", () => { const a = H.collect(options, "beforeExecution"), pin = P.observe(a.view), b = H.collect(options, "postExecution");
      const r = unchanged(b, () => P.observe(b.view, pin.anchor)); assert.equal(r.code, "productionSourceCompletenessBlocked"); assert.equal(r.delivery.status, expected);
      assert.equal(r.delivery.legacyReceiverOutcomeConsumed, false); assert.equal(r.timingSource.receiverCompletionConsumed, false);
      assert(r.missingFacts.includes("independentSecureDemandAndDuration")); assert.equal(r.sealedCandidateInput, null); record(name, r); });
  }
  test("actual hold preserves null canonical receiver and target", () => { const s = H.collectHold(), a = P.observe(s.before.view), b = unchanged(s.after, () => P.observe(s.after.view, a.anchor));
    assert.equal(b.delivery.status, "notAttempted"); assert.equal(b.delivery.canonicalThrow.releaseQuality, "held");
    assert.equal(b.delivery.actualDeliveryReceiverId, null); assert.deepEqual(b.delivery.actualDeliveryTarget, { runnerId: null, base: null });
    assert.equal(b.delivery.plannedTarget.runnerId, a.anchor.body.runner.runnerId); assert.equal(b.fixedSlot.value, "primaryThrow"); record("hold", b); });
  function invalidView(name, mutate, code, status = "invalid") { test(name, () => { const v = clone(firstBefore.view); mutate(v);
    const before = JSON.stringify(v), r = P.observe(v); assert.equal(r.status, status); assert.equal(r.code, code); assert.equal(JSON.stringify(v), before); }); }
  invalidView("physical handoff copy tamper", v => { v.match.groundBallInPlayState.physicalTruth.identity = "other-ball"; }, "physicalSourceCopyMismatch");
  invalidView("PA physical copy tamper", v => { v.match.ordinaryDefensivePlateAppearanceState.battedBallPhysicalTruth.identity = "other-ball"; }, "physicalSourceCopyMismatch");
  invalidView("unsupported legacy synthetic handoff", v => { v.match.groundBallInPlayState.supported = false; }, "unsupportedOriginalPhysicalSource");
  invalidView("primary SS opportunity actor mismatch", v => { v.opportunity.primaryDefenderId = "npc-ss"; }, "rosterActorHandoffMismatch");
  invalidView("NPC1B context/roster mismatch", v => { v.match.defensiveSituation.teammates.firstBaseReceiver.id = "other-npc"; }, "rosterActorHandoffMismatch");
  invalidView("invalid active lineup cannot become receiver source", v => { v.match.rosters[v.match.defenseTeam].lineup[0].id = "other-player"; }, "rosterActorHandoffMismatch");
  invalidView("occupied initial bases rejected", v => { v.match.defensiveSituation.runners[0] = "lead"; }, "outsideOriginalEmptyBaseSlice");
  invalidView("source must use original PA batter", v => { v.match.currentBatter = "later-batter"; }, "beforeSnapshotBatterMismatch");
  invalidView("runner obligation tamper", v => { v.match.groundBallInPlayState.runnerPhysicalStates[0].targetBase = "second"; }, "originalRunnerObligationMismatch");
  invalidView("preload sample rejected", v => { v.observedOwnedSamples.push({ phase: "admitted", value: .8 }); }, "beforeSnapshotHasExecutionOrSample");
  invalidView("malformed sample log cannot pose empty pre-execution evidence", v => { v.observedOwnedSamples = {}; }, "invalidObservationEnvelope");
  invalidView("partial original execution facts cannot pose before snapshot", v => { v.match.groundBallInPlayState.decisionThrowState = {}; }, "beforeSnapshotHasExecutionOrSample");
  invalidView("executing snapshot cannot pose before execution", v => { v.match.activeSituation.lifecycleState = "executing"; }, "beforeSnapshotHasExecutionOrSample");
  invalidView("unrelated route rejected", v => { v.requestedRouteId = "forceSecond"; }, "invalidObservationEnvelope");
  invalidView("malformed present provenance scope rejected", v => { v.scope = "isolatedFixture"; }, "invalidObservationEnvelope");
  test("post snapshot cannot reconstruct missing original anchor from settled outs", () => { assert.equal(P.observe(firstAfter.view).code, "originalPreExecutionAnchorRequired"); });
  test("serialized anchor tamper rejected", () => { const a = clone(firstObservation.anchor); a.body.initialOuts = 1;
    assert.equal(P.observe(firstAfter.view, a).code, "originalPreExecutionAnchorRequired"); });
  test("canonical throw receiver tamper rejected", () => { const v = clone(firstAfter.view); v.match.groundBallInPlayState.shortstopExecution.decisionThrowState.throwResolution.receiverId = "other";
    assert.equal(P.observe(v, firstObservation.anchor).code, "canonicalThrowActorTargetMismatch"); });
  test("canonical route/selection copy mismatch rejected", () => { const v = clone(firstAfter.view); v.match.groundBallInPlayState.shortstopExecution.decisionThrowState.throwResolution.routeId = "forceSecond";
    assert.equal(P.observe(v, firstObservation.anchor).code, "canonicalSelectionCopyMismatch"); });
  test("completed raw action cannot hide absent canonical throw", () => { const v = clone(firstAfter.view); v.match.groundBallInPlayState.shortstopExecution.decisionThrowState.throwResolution = null;
    assert.equal(P.observe(v, firstObservation.anchor).code, "completedActionWithoutCanonicalThrow"); });
  test("throw action physical tamper rejected", () => { const v = clone(firstAfter.view); v.match.groundBallInPlayState.shortstopExecution.resolution.actionFacts.actions.find(a => a.type === "throw").physicalIdentity = "other";
    assert.equal(P.observe(v, firstObservation.anchor).code, "originalThrowActionLinkMissing"); });
  test("missing original action provenance remains insufficient", () => { const v = clone(firstAfter.view); delete v.match.groundBallInPlayState.shortstopExecution.resolution.actionFacts.actions.find(a => a.type === "throw").provenance;
    assert.equal(P.observe(v, firstObservation.anchor).code, "missingOriginalActionProvenance"); });
  test("original sample/action copy mismatch rejected", () => { const v = clone(firstAfter.view); v.match.groundBallInPlayState.shortstopExecution.resolution.actionFacts.actions.find(a => a.type === "throw").provenance.sample = .2;
    assert.equal(P.observe(v, firstObservation.anchor).code, "originalExecutionSampleCopyMismatch"); });
  test("real canonical throw ID also exceeds old isolated adapter id limit", () => { const raw = firstAfter.view.match.groundBallInPlayState.shortstopExecution.decisionThrowState.throwResolution.identity;
    assert(raw.length > 240); const T = require("./receiver-execution-v2-source-authority-test.cjs"), F = require("../receiver-execution-v2-source-authority-foundation.js"), i = T.fixture();
    const pin = F.createPin(i.request); i.execution.pinDigest = pin.pinDigest; i.execution.throwFact.canonicalThrowIdentity = raw;
    assert.equal(F.prepare(pin, i.execution).code, "canonicalDeliveryIdentityMismatch"); });
  test("raw capability aliases are source values, not calibrated skills", () => { const r = firstObservation.rawNpcCapabilities, npc = firstObservation.anchor.body.npcActor;
    for (const k of ["defense", "speed", "arm", "contact"]) assert.equal(r[k], npc[k]);
    assert(firstObservation.missingFacts.includes("capabilityCoefficientCalibration")); assert.equal(firstObservation.formalProductionAuthority, false); });
  test("absent raw NPC attribute is C and never padded", () => { const v = clone(firstBefore.view), roster = v.match.rosters[v.match.defenseTeam];
    delete roster.lineup.find(a => a.id === firstObservation.anchor.body.npcActor.id).speed; const r = P.observe(v);
    assert.equal(r.rawNpcCapabilities.speed, null); assert.equal(r.rawNpcCapabilities.attributeSources.speed, "C");
    assert(r.missingFacts.includes("npcRawAttribute:speed")); assert.equal(r.sealedCandidateInput, null); });
  test("repeat and JSON source round-trip preserve complete observation", () => { assert.deepEqual(P.observe(clone(firstBefore.view)), firstObservation);
    assert.deepEqual(P.observe(clone(firstAfter.view), clone(firstObservation.anchor)), P.observe(firstAfter.view, firstObservation.anchor)); });
  function formationInput(assignment = "baseGuard") { return { scope: "isolatedFixture", phase: "beforeExecution", version: P.versions.formation,
    physical: firstObservation.binding, receiverId: firstObservation.anchor.body.npcActor.id, assignment }; }
  for (const [assignment, expected] of [["baseGuard", "baseCovering"], ["firstBaseShade", "nearFirstBase"], ["coverFromInterior", "movingToFirstBase"],
    ["delayedCover", "lateCover"], ["unassigned", "unavailable"]]) test("NEW deterministic formation " + assignment, () => { const input = formationInput(assignment), r = P.formation(input);
      assert.equal(r.status, "ok"); assert.equal(r.context, expected); assert.equal(r.authority, "NEW_PROPOSED_MODEL_NOT_EXISTING_A");
      assert.equal(r.formalProductionAuthority, false); assert.equal(r.rngCallbacks, 0); assert.deepEqual(P.formation(clone(input)), r); assert.equal(P.checkFormation(r, input).reselected, false); });
  test("formation seed does not change with actor/assignment", () => { const a = formationInput(), b = clone(a); b.receiverId = "otherNpc"; b.assignment = "delayedCover";
    assert.equal(P.formation(a).formationSeed, P.formation(b).formationSeed); assert.notEqual(P.formation(a).intentDigest, P.formation(b).intentDigest);
    assert.equal(P.checkFormation(P.formation(a), b).code, "frozenFormationBindingMismatch"); });
  for (const [name, field, value, code] of [["after execution", "phase", "executed", "invalidFormationProposalInput"],
    ["unknown intent", "assignment", "unknown", "unknownFormationIntent"], ["production scope", "scope", "production", "invalidFormationProposalInput"],
    ["unknown version", "version", "future", "invalidFormationProposalInput"]]) test("formation rejects " + name, () => { const r = formationInput(); r[field] = value; assert.equal(P.formation(r).code, code); });
  test("formation cannot consume route success or retry", () => { for (const field of ["routeId", "outRecorded", "retryCount", "ownedSample"]) {
    const r = formationInput(); r[field] = 1; assert.equal(P.formation(r).status, "invalid"); } });
  test("physical origin C supports pre-launch movement without clamp", () => { const r = P.timing(clockFixture()); assert.equal(r.status, "ok");
    assert.equal(r.timeline.throwLaunch.ticks, 2000); assert.equal(r.timeline.positioningStart.ticks, 250);
    assert.equal(r.firstThrowLocalProjection.positioningStart.ticks, -1750); assert.equal(r.firstThrowLocalProjection.positioningCompletion.ticks, -500);
    assert.equal(r.relation, "defenseBeforeRunner"); assert.equal(r.actualRetirements, 0); observations.push({ name: "isolatedFixture prelaunch clock", result: r }); });
  test("all proposed timestamps share one immutable physical origin", () => { const r = P.timing(clockFixture());
    for (const t of Object.values(r.timeline)) { assert.equal(t.version, P.versions.timing); assert.equal(t.originId, r.origin.originId); } });
  test("receiver movement before contact may be signed in proposed version", () => { const i = clockFixture(); i.times.positioningStart = known("99.500");
    const r = P.timing(i); assert.equal(r.timeline.positioningStart.ticks, -500); assert.equal(r.firstThrowLocalProjection.positioningStart.ticks, -2500); });
  test("already-arrived runner remains negative without reroll", () => { const i = clockFixture(); i.times.runnerArrival = known("99.500"); const r = P.timing(i);
    assert.equal(r.timeline.runnerArrival.ticks, -500); assert.equal(r.relation, "alreadySafe"); });
  test("exact tie cannot imply actual out", () => { const i = clockFixture(); i.times.runnerArrival = known("107.350"); const r = P.timing(i);
    assert.equal(r.relation, "tie"); assert.equal(r.timingMarginTicks, 0); assert.equal(r.actualRetirements, 0); assert.equal(r.formalSettlementAdmission, false); });
  test("subtick race may collapse to tie; not called lossless v1 migration", () => { const i = clockFixture(); i.times.runnerArrival = known("107.3501");
    const r = P.timing(i); assert.equal(r.relation, "tie"); assert.equal(r.perRelativeTimestampErrorBoundTicks, "0.5"); });
  test("origin subtraction happens before quantization", () => { const i = clockFixture(); i.origin.decimal = "100.0004";
    i.times.positioningStart = known("100.0010"); const r = P.timing(i); assert.equal(r.timeline.positioningStart.ticks, 1);
    assert.equal(r.timeline.throwLaunch.ticks, 2000); });
  for (const key of ["throwLaunch", "ballArrival", "positioningStart", "positioningCompletion", "receiveAttempt", "secureCompletion", "baseTouchCompletion", "runnerArrival"]) {
    test("unknown " + key + " preserved, never zero-filled", () => { const i = clockFixture(); i.times[key] = unknown("notMeasured");
      // Remove later completions when an upstream dependency is unknown.
      if (key !== "runnerArrival") { for (const k of ["receiveAttempt", "secureCompletion", "baseTouchCompletion"]) i.times[k] = unknown("missingDependency"); }
      if (key === "throwLaunch") i.times.ballArrival = unknown("missingLaunch");
      if (key === "positioningStart") i.times.positioningCompletion = unknown("missingPositionStart");
      const r = P.timing(i); assert.equal(r.status, "ok"); assert.equal(r.timeline[key].status, "unknown"); assert(!("ticks" in r.timeline[key])); assert.equal(r.relation, "insufficient"); });
  }
  test("unknown common origin blocks clock interpretation", () => { const i = clockFixture(); i.origin.status = "unknown"; i.origin.decimal = null;
    assert.equal(P.timing(i).code, "unknownPhysicalOrigin"); });
  test("v1 relative values never acquire a fabricated new origin", () => { const i = clockFixture(); i.sourceDomain = "legacy-v1-relative";
    assert.equal(P.timing(i).code, "legacyOriginMappingUnapproved"); });
  test("v1 ordinal window rejected", () => { const i = clockFixture(); i.times.ballArrival = { value: 5, state: "wide" };
    assert.equal(P.timing(i).code, "invalidTimestamp"); });
  test("wrong physical clock source rejected", () => { const i = clockFixture(); i.origin.physicalIdentity = "other-ball";
    assert.equal(P.timing(i).code, "invalidPhysicalOriginBinding"); });
  for (const [before, after] of [["throwLaunch", "ballArrival"], ["positioningStart", "positioningCompletion"], ["ballArrival", "receiveAttempt"],
    ["positioningCompletion", "receiveAttempt"], ["receiveAttempt", "secureCompletion"], ["secureCompletion", "baseTouchCompletion"]]) {
    test("reject exact causal reversal " + before + " -> " + after, () => { const i = clockFixture(); i.times[after] = known("99.000");
      assert.equal(P.timing(i).code, "causalTimeOrderViolation"); });
  }
  test("subtick negative causal duration rejected before rounding", () => { const i = clockFixture(); i.times.secureCompletion = known("106.9999");
    assert.equal(P.timing(i).code, "causalTimeOrderViolation"); });
  test("no possession cannot produce touch time", () => { const i = clockFixture(); i.possession = false; assert.equal(P.timing(i).code, "completionWithoutPossession");
    i.times.secureCompletion = unknown("noPossession"); i.times.baseTouchCompletion = unknown("noTouch"); assert.equal(P.timing(i).relation, "insufficient"); });
  test("no legal contact cannot produce touch time", () => { const i = clockFixture(); i.contact = false; assert.equal(P.timing(i).code, "touchTimeWithoutContact");
    i.times.baseTouchCompletion = unknown("noTouch"); assert.equal(P.timing(i).relation, "insufficient"); });
  test("late positioning cannot be relabeled as a hands attempt", () => { const i = clockFixture(); i.times.positioningCompletion = known("107.100");
    i.times.receiveAttempt = known("107.100"); assert.equal(P.timing(i).code, "lateReceiverCannotAttemptSecure"); });
  test("hands attempt time remains original receivable ball arrival", () => { const i = clockFixture(); i.times.receiveAttempt = known("107.100");
    assert.equal(P.timing(i).code, "receiveAttemptMustMatchBallArrival"); });
  test("no delivery has no receive Secure or touch completion", () => { const i = clockFixture(); i.possession = false; i.contact = false;
    for (const k of ["ballArrival", "receiveAttempt", "secureCompletion", "baseTouchCompletion"]) i.times[k] = unknown("heldBall");
    const r = P.timing(i); assert.equal(r.status, "ok"); assert.equal(r.relation, "insufficient"); });
  for (const decimal of ["-0", "01", "1e3", "NaN", "0.0000001", "1000000000"]) test("strict decimal rejects " + decimal, () => { const i = clockFixture();
    i.times.runnerArrival = known(decimal); assert.equal(P.timing(i).status, "invalid"); });
  test("bounded relative overflow rejected", () => { const i = clockFixture(); i.times.runnerArrival = known("1000100.001");
    assert.equal(P.timing(i).code, "malformedTimingProposal"); });
  test("clock relay offsets do not redefine contact origin", () => { const first = P.timing(clockFixture()), i = clockFixture();
    for (const key of ["throwLaunch", "ballArrival", "receiveAttempt", "secureCompletion", "baseTouchCompletion", "runnerArrival"]) {
      i.times[key] = known((Number(i.times[key].decimal) + 10).toFixed(3)); }
    const second = P.timing(i); assert.equal(second.origin.originId, first.origin.originId); assert.equal(second.timeline.throwLaunch.ticks, 12000);
    assert.equal(second.actualRetirements, 0); // Clock continuation only, not a relay authority fixture.
  });
  test("current S8 contract continues to reject new timing version", () => { const old = require("./receiver-execution-v2-pure-contract-test.cjs").fixture();
    old.versions.timing = P.versions.timing; assert.equal(Pure.seal(old).code, "unsupportedVersion"); });
  test("current S8 nonnegative positioning contract remains unchanged", () => { const old = require("./receiver-execution-v2-pure-contract-test.cjs").fixture();
    old.positioning.startTime.ticks = -1000; assert.equal(Pure.seal(old).code, "invalidPositioning"); });
  test("clock repeat JSON round-trip and independent jitless process agree", () => {
    assert.deepEqual(P.timing(clone(clockFixture())), P.timing(clockFixture()));
    const script = "process.stdout.write(JSON.stringify(require('./tests/receiver-execution-v2-production-source-timing-test.cjs').timingProbe()))";
    const options = { cwd: require("node:path").resolve(__dirname, ".."), encoding: "utf8", maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] };
    const a = cp.execFileSync(process.execPath, ["-e", script], options), b = cp.execFileSync(process.execPath, ["--jitless", "-e", script], options);
    assert.equal(a, b); assert.equal(a, JSON.stringify(timingProbe())); });
  test("prototype cannot consume Math.random or mutate actual legacy Match", () => { const sample = H.collect(), before = sample.vm.run("JSON.stringify(player)"), random = Math.random;
    Math.random = () => { throw Error("Forbidden random"); }; try { const r = P.observe(sample.view); const f = P.formation(formationInput());
      assert.equal(r.candidateExecutionCalls, 0); assert.deepEqual(r.writes, { match: 0, record: 0, evaluation: 0, rng: 0 }); assert.equal(f.rngCallbacks, 0);
      assert.equal(P.timing(clockFixture()).actualRetirements, 0); } finally { Math.random = random; }
    assert.equal(sample.vm.run("JSON.stringify(player)"), before); });
  test("getter input is rejected without reads", () => { const v = clone(firstBefore.view); let reads = 0; Object.defineProperty(v, "match", { enumerable: true, get() { reads++; throw Error("getter"); } });
    assert.equal(P.observe(v).status, "invalid"); assert.equal(reads, 0); });
  for (const p of H.readPaths) inputPaths.add(p);
  const failed = checks.filter(x => x.status === "FAIL").length;
  return { suite: "receiver-production-source-timing-design-sprint-10a2", summary: { total: checks.length, passed: checks.length - failed, failed },
    checks, observations, sourcePaths: [...inputPaths].sort(), limits: { prototypeScope: "DESIGN_ONLY_NOT_RUNTIME_REGISTERED", sourceWitnesses: "existing Legacy code in original isolated fixture",
      timingAndFormationAssumptions: "isolatedFixture", candidateExecutionCalls: 0, runtimeEnabled: false, formalShadowSimulation: false,
      syntheticProductionIdentities: false, formalSourceAuthorityPassClaim: false, actualRetirements: 0, L03: "PARTIAL" } };
}
module.exports = { run, clockFixture, timingProbe };
if (require.main === module) { const r = run(); console.log(JSON.stringify({ ...r.summary, failures: r.checks.filter(x => x.status === "FAIL") }, null, 2)); process.exitCode = r.summary.failed ? 1 : 0; }
