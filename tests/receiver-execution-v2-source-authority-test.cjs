"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const cp = require("node:child_process");
const Pure = require("../receiver-execution-v2-foundation.js");
const F = require("../receiver-execution-v2-source-authority-foundation.js");
const clone = o => JSON.parse(JSON.stringify(o));
const source = () => ({ classification: "A", scope: "pureFixture", owner: "isolatedDeclaredFixture", reference: "source-fixture-1", version: "fixture-source-v1" });
const known = decimal => ({ status: "known", decimal });
const unknown = reason => ({ status: "unknown", reason });
function fixture() {
  const request = { version: F.versions.source, scope: "isolatedFixture", phase: "beforeExecution", mode: "routine",
    identity: { playId: "isolated-play-1", physical: { version: Pure.versions.physical, matchId: "fixture-match-1",
      plateAppearanceId: "fixture-pa-1", contactId: "fixture-contact-1", physicalIdentity: "declared-fixture-physical-1" },
      leg: { actionId: "receive-1", sourceThrowActionId: "throw-action-1", physicalSlot: "primaryThrow", parentActionId: null },
      thrower: { actorId: "player", position: "SS" }, receiver: { actorId: "npc1b-1", position: "1B" }, target: { runnerId: "batter-1", base: "first" } },
    handoff: { playId: "isolated-play-1", physicalIdentity: "declared-fixture-physical-1", throwerId: "player", receiverId: "npc1b-1", runnerId: "batter-1", base: "first" },
    routeId: "secureFirstBaseOut", initialOuts: 0, bases: [null, null, null], receiverRole: "npc",
    npc: { actorId: "npc1b-1", position: "1B", source: "team-roster-foundation", defense: 12, speed: 12, arm: 8, contact: 10 },
    coverPlan: { version: F.versions.positioning, context: "baseCovering", referenceId: "frozen-preexecution-cover-intent-1", receiverId: "npc1b-1", phase: "beforeExecution" },
    competitionLevel: "high-school", environmentId: "neutral-fixture-field",
    provenance: Object.fromEntries(["physicalIdentity", "actors", "capabilities", "coverIntent"].map(k => [k, source()])) };
  const execution = { version: F.versions.source, pinDigest: "assignedByFixture", ownedSample: 0.62,
    throwFact: { version: F.versions.delivery, actionId: "throw-action-1", canonicalThrowIdentity: "declared-original-ss-throw-v1",
      physicalIdentity: request.identity.physical.physicalIdentity, routeId: request.routeId, throwerId: "player", receiverId: "npc1b-1",
      targetRunnerId: "batter-1", targetBase: "first", throwAttempted: true, throwQuality: "onTarget", releaseQuality: "ready",
      distanceClass: "medium", upstreamActionId: "acquisition-1", upstreamStatus: "completed" },
    timing: { version: F.versions.bridge, sourceDomain: "isolated-common-origin-fixture", physicalIdentity: request.identity.physical.physicalIdentity,
      originId: "fixture-launch-origin-1", launchOffset: known("2.000"), ballArrival: known("7.000"), runnerArrival: known("12.000"),
      positioningStart: known("2.000"), provenance: source() },
    touch: { version: F.versions.touch, actionId: "receive-1:touch", attempted: true, contact: true, legality: "eligible", sourceActionId: "first-obligation-fixture-1" },
    provenance: Object.fromEntries(["delivery", "timing", "contact"].map(k => [k, source()])), effortReference: null };
  return { request, execution };
}
function evaluate(input = fixture()) {
  const pin = F.createPin(input.request); assert.equal(pin.status, "ok", JSON.stringify(pin));
  const execution = clone(input.execution); execution.pinDigest = pin.pinDigest;
  const result = F.evaluate(pin, execution); assert.equal(result.status, "ok", JSON.stringify(result));
  return { pin, execution, result };
}
function probe() {
  const rows = [];
  for (const context of Object.keys(F.coverPolicy)) {
    const i = fixture(); i.request.coverPlan.context = context;
    rows.push({ context, ...evaluate(i) });
  }
  return { versions: F.versions, rows, quantization: ["0", "1.0005", "-1.0005", "2.0004", "0.0005"].map(s => [s, F.quantize(s)]) };
}
function run() {
  const checks = [], observations = [], gradientRows = [];
  function test(name, fn) { try { fn(); checks.push({ name, status: "PASS" }); } catch (e) { checks.push({ name, status: "FAIL", message: e.stack }); } }
  function pinInvalid(name, change, code, status = "invalid") { test(name, () => { const i = fixture(); change(i.request); const before = JSON.stringify(i.request);
    const r = F.createPin(i.request); assert.equal(r.status, status); assert.equal(r.code, code); assert.equal(JSON.stringify(i.request), before); }); }
  function executionInvalid(name, change, code, status = "invalid") { test(name, () => { const i = fixture(), pin = F.createPin(i.request); i.execution.pinDigest = pin.pinDigest;
    change(i.execution); const before = JSON.stringify(i.execution), r = F.evaluate(pin, i.execution); assert.equal(r.status, status); assert.equal(r.code, code); assert.equal(JSON.stringify(i.execution), before); }); }
  const planInput = () => ({ version: F.versions.positioning, phase: "beforeExecution", receiverId: "npc1b-1", position: "1B",
    assignment: "baseGuard", referenceId: "precontact-defensive-assignment-1", provenance: source() });
  for (const [assignment, context] of [["baseGuard", "baseCovering"], ["firstBaseShade", "nearFirstBase"], ["coverFromInterior", "movingToFirstBase"],
    ["delayedCover", "lateCover"], ["unassigned", "unavailable"]]) test("initial policy from preexecution assignment " + assignment, () => {
    const input = planInput(); input.assignment = assignment; const plan = F.initialCoverPlan(input); assert.equal(plan.status, "ok"); assert.equal(plan.plan.context, context);
    const i = fixture(); i.request.coverPlan = clone(plan.plan); const r = evaluate(i); assert.equal(r.pin.positioningPolicy.context, context);
    assert.equal(plan.formalProductionAuthority, false); assert.deepEqual(F.initialCoverPlan(clone(input)), plan); });
  test("initial cover policy rejects result-time decision", () => { const input = planInput(); input.phase = "settled"; assert.equal(F.initialCoverPlan(input).code, "invalidInitialPositionIntent"); });
  test("initial cover policy never accepts legacy atBase", () => { const input = planInput(); input.atBase = true; assert.equal(F.initialCoverPlan(input).status, "invalid"); });
  test("unknown formation intent stays insufficient without default base covering", () => { const input = planInput(); input.provenance.classification = "C";
    assert.equal(F.initialCoverPlan(input).code, "missingPreexecutionCoverIntent"); input.provenance = source(); input.assignment = "unknown";
    assert.equal(F.initialCoverPlan(input).code, "unknownDefensiveCoverAssignment"); });
  for (const [context, expected] of [["baseCovering", "ready"], ["nearFirstBase", "ready"], ["movingToFirstBase", "ready"], ["lateCover", "late"], ["unavailable", "unavailable"]]) {
    test("cover context " + context, () => { const i = fixture(); i.request.coverPlan.context = context; const r = evaluate(i);
      assert.equal(r.result.execution.stages.positioning.status, expected); assert.equal(r.pin.positioningPolicy.authority, "NEW_VERSIONED_MODEL");
      assert.equal(r.pin.positioningPolicy.legacyAtBaseConsumed, false); assert.equal(r.pin.positioningPolicy.phase, "beforeExecution");
      if (expected !== "ready") { assert.equal(r.result.execution.stages.secure.attempted, false); assert.equal(r.result.execution.stages.contest.candidate, null); }
      observations.push({ name: context, result: r.result }); });
  }
  for (const outs of [0, 1, 2]) test("clean 6-3 candidate with initial outs " + outs, () => { const i = fixture(); i.request.initialOuts = outs; const r = evaluate(i).result;
    assert.equal(r.execution.stages.secure.status, "cleanControl"); assert.equal(r.execution.stages.contest.status, "retirementCandidate");
    assert.equal(r.execution.stages.contest.candidate.wouldBeThirdOut, outs === 2); assert.equal(r.execution.application.actualRetirements, 0); });
  for (const quality of ["onTarget", "challengingReceive", "lateWeakThrow"]) test("canonical delivery quality " + quality, () => { const i = fixture(); i.execution.throwFact.throwQuality = quality;
    const r = evaluate(i).result; assert.equal(r.prepared.models.incoming.newThrowRolls, 0); assert(r.execution.stages.secure.attempted);
    assert.equal(r.prepared.models.incoming.calibration, "uncalibrated"); assert.equal(r.prepared.models.incoming.canonicalThrowIdentity, i.execution.throwFact.canonicalThrowIdentity);
    observations.push({ name: quality, result: r }); });
  test("offline never attempts hands", () => { const i = fixture(); i.execution.throwFact.throwQuality = "offline";
    const r = evaluate(i).result; assert.equal(r.execution.stages.delivery.status, "offline"); assert.equal(r.execution.stages.secure.attempted, false);
    assert(!("handsMarginMilli" in r.execution.stages.secure)); assert.equal(r.execution.stages.contest.candidate, null); });
  test("unreachable receiver does not become failed hands", () => { const i = fixture(); i.request.coverPlan.context = "movingToFirstBase"; i.request.npc.defense = 0;
    const r = evaluate(i).result; assert.equal(r.execution.stages.positioning.status, "unreachable"); assert.equal(r.execution.stages.secure.attempted, false); });
  test("independent failed hands despite ready receiver", () => { const i = fixture(); i.request.npc.defense = 0;
    const r = evaluate(i).result; assert.equal(r.execution.stages.positioning.status, "ready"); assert.equal(r.execution.stages.secure.status, "failedHands");
    assert.equal(r.execution.stages.contest.candidate, null); assert.equal(r.officialError, null); });
  test("bobble delays possession with same fixed vector", () => { const i = fixture(); i.request.npc.defense = 11; i.execution.throwFact.throwQuality = "challengingReceive";
    const r = evaluate(i).result; assert.equal(r.execution.stages.secure.status, "bobbleControl");
    assert.equal(r.execution.stages.secure.completion.ticks, r.execution.stages.delivery.ballArrival.ticks + r.prepared.models.incoming.cleanDelayTicks + r.prepared.models.incoming.bobbleDelayTicks);
    observations.push({ name: "bobble", result: r }); });
  test("fast runner negative common-origin time remains already safe", () => { const i = fixture(); i.execution.timing.runnerArrival = known("1.000");
    const r = evaluate(i).result; assert.equal(r.execution.stages.contest.runnerArrival.ticks, -1000); assert.equal(r.execution.stages.secure.status, "cleanControl");
    assert.equal(r.execution.stages.contest.status, "alreadySafe"); assert.equal(r.execution.stages.contest.candidate, null); });
  test("clean catch does not imply retirement", () => { const i = fixture(); i.execution.timing.runnerArrival = known("7.050");
    const r = evaluate(i).result; assert.equal(r.execution.stages.secure.secured, true); assert.equal(r.execution.stages.contest.status, "alreadySafe"); });
  test("exact tie produces no candidate", () => { const i = fixture(); const first = evaluate(i).result; const ticks = first.execution.stages.contest.completion.ticks + 2000;
    i.execution.timing.runnerArrival = known((ticks / 1000).toFixed(3)); const r = evaluate(i).result;
    assert.equal(r.execution.stages.contest.status, "tie"); assert.equal(r.execution.stages.contest.candidate, null); });
  test("no possession prevents touch completion", () => { const i = fixture(); i.request.npc.defense = 0; const r = evaluate(i).result;
    assert.equal(r.execution.stages.contest.status, "notAttempted"); assert(!("completion" in r.execution.stages.contest)); });
  for (const field of ["attempted", "contact"]) test("no legal touch " + field, () => { const i = fixture(); i.execution.touch[field] = false;
    if (field === "attempted") i.execution.touch.contact = false; const r = evaluate(i).result;
    assert.equal(r.execution.stages.secure.secured, true); assert.equal(r.execution.stages.contest.candidate, null); });
  for (const legality of ["ineligible", "unknown"]) test("live first-base legality " + legality, () => { const i = fixture(); i.execution.touch.legality = legality;
    assert.equal(evaluate(i).result.execution.stages.contest.candidate, null); });
  for (const route of ["secureFirstBaseOut", "holdBall"]) test("no delivery branch " + route, () => { const i = fixture(); i.request.routeId = route; i.execution.throwFact.routeId = route;
    Object.assign(i.execution.throwFact, { throwAttempted: false, throwQuality: "notAttempted", releaseQuality: "none" });
    i.execution.timing.ballArrival = unknown("notThrown"); const r = evaluate(i).result;
    assert.equal(r.execution.stages.delivery.status, "notAttempted"); assert.equal(r.execution.stages.secure.attempted, false); assert.equal(r.execution.stages.contest.candidate, null); });
  test("failed acquisition cannot produce incoming delivery", () => { const i = fixture(); Object.assign(i.execution.throwFact,
    { throwAttempted: false, throwQuality: "notAttempted", releaseQuality: "none", upstreamStatus: "failed" });
    i.execution.timing.ballArrival = unknown("acquisitionFailed"); assert.equal(evaluate(i).result.execution.stages.secure.attempted, false); });
  for (const field of ["ballArrival", "runnerArrival", "positioningStart"]) test("unknown CRT " + field, () => { const i = fixture(); i.execution.timing[field] = unknown("notMeasured");
    const r = evaluate(i).result; assert.equal(r.execution.stages.contest.candidate, null);
    assert.equal(r.prepared.models.timing[field].status, "unknown"); assert(!("ticks" in r.prepared.models.timing[field])); });
  test("bridge subtracts the same launch offset from ball and runner", () => { const i = fixture(), r = F.bridgeTiming(i.execution.timing, i.request.identity.physical.physicalIdentity);
    assert.equal(r.ballArrival.ticks, 5000); assert.equal(r.runnerArrival.ticks, 10000); assert.equal(r.launch.ticks, 0); assert.equal(r.positioningStart.ticks, 0);
    assert.equal(r.runnerArrival.ticks - r.ballArrival.ticks, 5000); });
  test("complete modeled timeline shares one origin and original arrival", () => { const r = evaluate().result, t = r.timeline;
    for (const key of ["throwLaunch", "ballArrival", "positioningCompletion", "receiveAttempt", "secureCompletion", "baseTouchCompletion", "runnerArrival"]) {
      assert.equal(t[key].version, F.versions.timing); assert.equal(t[key].originId, t.originId); assert.equal(t[key].status, "known"); }
    assert.equal(t.receiveAttempt.ticks, t.ballArrival.ticks); assert.equal(t.secureCompletion.ticks, r.execution.stages.secure.completion.ticks);
    assert.equal(t.baseTouchCompletion.ticks, r.execution.stages.contest.completion.ticks); assert.equal(t.throwLaunch.ticks, 0); });
  test("late readiness has no attempt or possession time", () => { const i = fixture(); i.request.coverPlan.context = "lateCover"; const t = evaluate(i).result.timeline;
    assert.equal(t.receiveAttempt.status, "unknown"); assert.equal(t.secureCompletion.status, "unknown"); assert.equal(t.baseTouchCompletion.status, "unknown");
    assert(!("ticks" in t.receiveAttempt)); });
  test("failed hands preserves attempt time but has no touch time", () => { const i = fixture(); i.request.npc.defense = 0; const t = evaluate(i).result.timeline;
    assert.equal(t.receiveAttempt.status, "known"); assert.equal(t.secureCompletion.status, "unknown"); assert.equal(t.baseTouchCompletion.status, "unknown"); });
  test("unknown runner time does not erase completed touch", () => { const i = fixture(); i.execution.timing.runnerArrival = unknown("runnerTimeNotAvailable");
    const r = evaluate(i).result; assert.equal(r.timeline.baseTouchCompletion.status, "known"); assert.equal(r.timeline.runnerArrival.status, "unknown");
    assert.equal(r.execution.stages.contest.candidate, null); });
  test("modeled completion cannot overflow bounded CRT", () => { const i = fixture(); i.execution.timing.launchOffset = known("0"); i.execution.timing.ballArrival = known("1000000.000");
    i.execution.timing.runnerArrival = known("1000000.000"); const p = F.createPin(i.request); i.execution.pinDigest = p.pinDigest;
    assert.equal(F.evaluate(p, i.execution).code, "modelTimeOutOfRange"); });
  test("decimal quantization golden vectors and half-away-from-zero", () => { for (const [s, expected] of [["0", 0], ["1.0005", 1001], ["-1.0005", -1001], ["1.0004", 1000], ["-0.0004", 0], ["0.0005", 1]]) assert.equal(F.quantize(s), expected); });
  for (const decimal of ["-0", "1e3", "01", "NaN", "0.0000001", "9999999", 1.2]) test("reject noncanonical CRT " + decimal, () => assert.throws(() => F.quantize(decimal)));
  pinInvalid("reject missing physical binding", r => { r.identity.physical = null; }, "invalidPhysicalIdentity");
  pinInvalid("reject synthetic primitive identity", r => { r.identity.physical = "synthetic"; }, "invalidPhysicalIdentity");
  pinInvalid("reject unsupported physical version", r => { r.identity.physical.version = "unknown"; }, "invalidPhysicalIdentity");
  pinInvalid("reject fake SS actor", r => { r.identity.thrower.actorId = "npc-ss"; }, "invalidSsNpcActor");
  pinInvalid("reject player1B", r => { r.identity.receiver.actorId = "player"; r.npc.actorId = "player"; }, "invalidSsNpcActor");
  pinInvalid("reject unmatched receiver snapshot", r => { r.npc.actorId = "different-npc"; }, "invalidSsNpcActor");
  pinInvalid("reject unmatched handoff", r => { r.handoff.runnerId = "other-runner"; }, "handoffIdentityMismatch");
  pinInvalid("reject wrong target base", r => { r.identity.target.base = "second"; }, "invalidTargetRunner");
  pinInvalid("reject actor as runner", r => { r.identity.target.runnerId = "player"; }, "invalidTargetRunner");
  pinInvalid("reject executed cover policy selection", r => { r.phase = "executed"; }, "outsideSsEmptyBaseSlice");
  pinInvalid("reject occupied-base slice", r => { r.bases[0] = "lead-runner"; }, "outsideSsEmptyBaseSlice");
  pinInvalid("reject meaningful fixture posing as routine slice", r => { r.mode = "meaningful"; }, "outsideSsEmptyBaseSlice");
  pinInvalid("reject relay slot", r => { r.identity.leg.physicalSlot = "relayThrow"; }, "invalidPrimaryLeg");
  pinInvalid("reject retry-based physical slot", r => { r.identity.leg.physicalSlot = "retry-2"; }, "invalidPrimaryLeg");
  pinInvalid("reject unknown source version", r => { r.version = "future"; }, "unsupportedSourceVersion");
  pinInvalid("reject unknown initial-cover policy", r => { r.coverPlan.version = "future"; }, "invalidInitialCoverPolicy");
  pinInvalid("reject cover plan from another receiver", r => { r.coverPlan.receiverId = "other-npc"; }, "invalidInitialCoverPolicy");
  pinInvalid("reject cover plan decided after execution", r => { r.coverPlan.phase = "executed"; }, "invalidInitialCoverPolicy");
  pinInvalid("reject legacy atBase input", r => { r.coverPlan.atBase = true; }, "invalidInitialCoverPolicy");
  pinInvalid("reject legacy receiver success input", r => { r.receiverCompleted = true; }, "invalidPinRequestSchema");
  pinInvalid("reject safe/out outcome input", r => { r.outRecorded = true; }, "invalidPinRequestSchema");
  pinInvalid("reject pending sample preload", r => { r.ownedSample = 0.62; }, "noncanonicalPinRequest");
  pinInvalid("reject unknown provenance", r => { delete r.provenance.actors; }, "missingOrInvalidProvenance");
  pinInvalid("required source C stays insufficient", r => { r.provenance.coverIntent.classification = "C"; }, "insufficientSourceAuthority", "insufficient");
  pinInvalid("production scope cannot turn pure policy into live authority", r => { r.scope = "productionSnapshot"; }, "productionSourceAdapterNotIntegrated", "insufficient");
  pinInvalid("reject padded NPC capability", r => { delete r.npc.speed; }, "invalidNpcSnapshot");
  pinInvalid("reject unsupported NPC scale", r => { r.npc.defense = 21; }, "invalidNpcSnapshot");
  test("snapshot and policy clone are frozen without mutating caller", () => { const i = fixture(), before = JSON.stringify(i), pin = F.createPin(i.request);
    assert(Object.isFrozen(pin.request.npc)); assert(Object.isFrozen(pin.positioningPolicy)); assert(!Object.isFrozen(i.request));
    i.request.npc.defense = 0; assert.equal(pin.request.npc.defense, 12); assert.notEqual(JSON.stringify(i), before); });
  executionInvalid("reject mismatched pin binding", e => { e.pinDigest = "changed"; }, "executionSourcePinMismatch");
  executionInvalid("missing original owned sample stays insufficient", e => { e.ownedSample = null; }, "ownedSampleNotProduced", "insufficient");
  executionInvalid("reject invalid original sample", e => { e.ownedSample = 1; }, "malformedExecutionSource");
  for (const field of ["physicalIdentity", "throwerId", "receiverId", "targetRunnerId", "targetBase", "actionId", "routeId"]) executionInvalid("reject canonical handoff mismatch " + field,
    e => { e.throwFact[field] = "wrong-copy"; }, "canonicalDeliveryIdentityMismatch");
  executionInvalid("reject unknown canonical quality", e => { e.throwFact.throwQuality = "legacySuccess"; }, "invalidCanonicalDeliveryFacts");
  executionInvalid("reject second throw-roll sample input", e => { e.throwFact.throwSample = 1; }, "invalidCanonicalDeliveryView");
  executionInvalid("reject completed delivery after failed acquisition", e => { e.throwFact.upstreamStatus = "failed"; }, "canonicalDeliveryDependencyMismatch");
  executionInvalid("reject legacy receiver ready as hands input", e => { e.throwFact.receiverReady = true; }, "invalidCanonicalDeliveryView");
  executionInvalid("reject official E as hands input", e => { e.throwFact.officialError = 1; }, "invalidCanonicalDeliveryView");
  executionInvalid("missing execution provenance rejected", e => { delete e.provenance.contact; }, "missingOrInvalidProvenance");
  executionInvalid("C incoming source stays insufficient", e => { e.provenance.delivery.classification = "C"; }, "insufficientSourceAuthority", "insufficient");
  executionInvalid("legacy v1 origin cannot be silently zeroed", e => { e.timing.sourceDomain = "legacy-v1-relative"; }, "legacyV1OriginMappingUnapproved", "insufficient");
  executionInvalid("unknown launch origin blocks execution", e => { e.timing.launchOffset = unknown("noOriginAuthority"); }, "unknownCommonLaunchOrigin", "insufficient");
  executionInvalid("wrong physical time binding rejected", e => { e.timing.physicalIdentity = "other-ball"; }, "invalidTimingBridge");
  executionInvalid("v1 ordinal window rejected as CRT", e => { e.timing.ballArrival = { value: 5, state: "wide" }; }, "invalidTimingValue");
  executionInvalid("negative actor time rejected without clamping", e => { e.timing.ballArrival = known("1.000"); }, "invalidTimingValue");
  executionInvalid("prelaunch positioning not silently clamped to S8 zero", e => { e.timing.positioningStart = known("1.000"); }, "invalidTimingValue");
  executionInvalid("touch without attempted contact rejected", e => { e.touch.attempted = false; }, "invalidPossessionTouchPlan");
  executionInvalid("unrelated touch action rejected", e => { e.touch.actionId = "unrelated-touch"; }, "invalidPossessionTouchPlan");
  executionInvalid("calibrated name cannot authorize ordinary effort", e => { e.effortReference = { status: "calibrated", average: 10 }; }, "ordinaryEffortCalibrationUnavailable", "insufficient");
  test("hold with completed throw rejected", () => { const i = fixture(); i.request.routeId = "holdBall"; i.execution.throwFact.routeId = "holdBall";
    const p = F.createPin(i.request); i.execution.pinDigest = p.pinDigest; assert.equal(F.evaluate(p, i.execution).code, "canonicalDeliveryDependencyMismatch"); });
  test("hold cannot hide a forged numeric ball arrival", () => { const i = fixture(); i.request.routeId = "holdBall"; i.execution.throwFact.routeId = "holdBall";
    Object.assign(i.execution.throwFact, { throwAttempted: false, throwQuality: "notAttempted", releaseQuality: "none" });
    const p = F.createPin(i.request); i.execution.pinDigest = p.pinDigest; assert.equal(F.evaluate(p, i.execution).code, "noDeliveryHasBallArrival"); });
  test("offline missing arrival never fabricates flight", () => { const i = fixture(); i.execution.throwFact.throwQuality = "offline";
    i.execution.timing.ballArrival = unknown("legacyOfflineHasNoNumericArrival"); const r = evaluate(i).result;
    assert.equal(r.prepared.models.timing.ballArrival.status, "unknown"); assert.equal(r.execution.stages.secure.attempted, false); assert.equal(r.execution.stages.contest.candidate, null); });
  test("serialized pin tamper rejected even after caller edits capability copy", () => { const r = evaluate(), p = clone(r.pin); p.capabilityAdapter.values.catching = 20;
    assert.equal(F.evaluate(p, r.execution).code, "sourcePinTampered"); });
  test("repeat and JSON cold round-trip preserve complete output", () => { const r = evaluate();
    assert.deepEqual(F.evaluate(r.pin, r.execution), r.result); assert.deepEqual(F.evaluate(clone(r.pin), clone(r.execution)), r.result); });
  test("sampler binds physical slot, not actor ability route or sample", () => { const a = fixture(), b = fixture(); b.request.npc.defense = 1; b.request.npc.speed = 2;
    b.request.npc.arm = 20; b.execution.ownedSample = 0.1; const first = evaluate(a), second = evaluate(b);
    assert.deepEqual(first.result.prepared.sealed.samples, second.result.prepared.sealed.samples);
    assert.notEqual(first.pin.pinDigest, second.pin.pinDigest); assert.notEqual(first.result.prepared.sourceDigest, second.result.prepared.sourceDigest);
    const hold = fixture(); hold.request.routeId = "holdBall"; hold.execution.throwFact.routeId = "holdBall";
    Object.assign(hold.execution.throwFact, { throwAttempted: false, throwQuality: "notAttempted", releaseQuality: "none" });
    hold.execution.timing.ballArrival = unknown("notThrown");
    assert.deepEqual(evaluate(hold).result.prepared.sealed.samples, first.result.prepared.sealed.samples); });
  test("sample vector matches independent Node SHA256 encoding", () => { const r = evaluate().result; for (const row of Object.values(r.prepared.sealed.samples.stages)) {
    const h = crypto.createHash("sha256").update(row.canonical, "utf8").digest(); assert.equal(h.toString("hex"), row.sha256); assert.equal(h.readUInt32BE(0), row.u32); } });
  test("receiver arm/contact changes cannot improve hands or positioning", () => { const a = evaluate().result, i = fixture(); i.request.npc.arm = 20; i.request.npc.contact = 20;
    const b = evaluate(i).result; for (const stage of ["positioning", "secure", "contest"]) assert.deepEqual(a.execution.stages[stage], b.execution.stages[stage]); });
  test("fixed-vector defense aliases have monotonic reach time and hands margin", () => {
    let duration = Infinity, margin = -Infinity, reachable = false;
    for (let defense = 0; defense <= 20; defense++) { const i = fixture(); i.request.coverPlan.context = "nearFirstBase"; i.request.npc.defense = defense;
      const r = evaluate(i).result, b = r.execution.stages.positioning, c = r.execution.stages.secure;
      if (b.status !== "unreachable") { assert(b.durationTicks <= duration); duration = b.durationTicks; reachable = true; } else assert.equal(reachable, false);
      if (c.attempted) { assert(c.handsMarginMilli >= margin); margin = c.handsMarginMilli; }
      gradientRows.push({ axis: "defenseAliases", value: defense, positioning: b.status, durationTicks: b.durationTicks ?? null, handsMarginMilli: c.handsMarginMilli ?? null }); }
  });
  test("fixed-vector speed to mobility mapping monotonic across contexts", () => { for (const context of ["nearFirstBase", "movingToFirstBase", "lateCover"]) {
    let duration = Infinity; for (let speed = 0; speed <= 20; speed++) { const i = fixture(); i.request.coverPlan.context = context; i.request.npc.speed = speed;
      const r = evaluate(i).result, b = r.execution.stages.positioning; assert(b.durationTicks <= duration); duration = b.durationTicks;
      gradientRows.push({ axis: "speedMobility", context, value: speed, durationTicks: b.durationTicks, positioning: b.status }); } } });
  test("ordinary effort independent of actual receiver weakness", () => { for (const defense of [0, 10, 20]) { const i = fixture(); i.request.npc.defense = defense;
    const r = evaluate(i).result; assert.equal(r.ordinaryEffort, "insufficient"); assert.equal(r.officialError, null); assert.equal(r.wouldBeAssist, null);
    assert.equal(r.execution.scorerFacts.officialScorerEligibility, "insufficient"); } });
  test("no random callback Match object or official record capability", () => { const original = Math.random; Math.random = () => { throw Error("Forbidden Math.random"); };
    try { const r = evaluate().result; assert.deepEqual(r.execution.application, { matchStateWrites: 0, gameRecordWrites: 0, rngCallbacks: 0, actualRetirements: 0 });
      assert.equal(r.formalProductionAuthority, false); assert.equal(r.formalSettlementAdmission, false); assert.equal(r.formalSaveAdmission, false); } finally { Math.random = original; } });
  test("source request getter never executes", () => { const i = fixture(); let reads = 0; Object.defineProperty(i.request, "phase", { enumerable: true, get() { reads++; return "beforeExecution"; } });
    assert.equal(F.createPin(i.request).status, "invalid"); assert.equal(reads, 0); });
  test("execution source getter never executes", () => { const r = evaluate(); let reads = 0; Object.defineProperty(r.execution, "ownedSample", { enumerable: true, get() { reads++; return 0.62; } });
    assert.equal(F.evaluate(r.pin, r.execution).status, "invalid"); assert.equal(reads, 0); });
  test("input/output objects immutable with no caller mutation", () => { const i = fixture(), before = JSON.stringify(i); const r = evaluate(i).result;
    assert.equal(JSON.stringify(i), before); assert(!Object.isFrozen(i.request)); assert(Object.isFrozen(r.execution.stages.secure)); });
  test("normal and jitless Node process reproduce hash encoding and stage arithmetic", () => {
    const script = "process.stdout.write(JSON.stringify(require('./tests/receiver-execution-v2-source-authority-test.cjs').probe()))";
    const a = cp.execFileSync(process.execPath, ["-e", script], { cwd: require("node:path").resolve(__dirname, ".."), maxBuffer: 4 * 1024 * 1024, encoding: "utf8" });
    const b = cp.execFileSync(process.execPath, ["--jitless", "-e", script], { cwd: require("node:path").resolve(__dirname, ".."), maxBuffer: 4 * 1024 * 1024, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    assert.equal(a, b); assert.equal(a, JSON.stringify(probe())); });
  test("independent VM load only imports S8 pure API and never random", () => {
    const pureContext = vm.createContext({}); vm.runInContext("Math.random=()=>{throw Error('Forbidden random')}", pureContext);
    vm.runInContext(fs.readFileSync(require.resolve("../receiver-execution-v2-foundation.js"), "utf8"), pureContext);
    const context = vm.createContext({ module: { exports: {} }, require: name => { assert.equal(name, "./receiver-execution-v2-foundation.js"); return pureContext.ReceiverExecutionV2Foundation; } });
    vm.runInContext("Math.random=()=>{throw Error('Forbidden random')}", context);
    vm.runInContext(fs.readFileSync(require.resolve("../receiver-execution-v2-source-authority-foundation.js"), "utf8"), context);
    const i = fixture(), p = context.module.exports.createPin(i.request); i.execution.pinDigest = p.pinDigest;
    assert.equal(JSON.stringify(context.module.exports.evaluate(p, i.execution)), JSON.stringify(evaluate().result)); });
  const failed = checks.filter(r => r.status === "FAIL").length;
  return { suite: "receiver-source-authority-sprint-10a1", summary: { total: checks.length, passed: checks.length - failed, failed }, checks,
    observations, gradientRows, limits: { sourceScope: "DECLARED_ISOLATED_FIXTURE_NOT_PRODUCTION_AUTHORITY", runtimeEnabled: false,
      formalShadowSimulation: false, officialScoring: false, formalSave: false, sourcePolicyCalibration: "uncalibrated", fixtureSample: 0.62,
      sampler: "existing S8 physical-slot B; original sample bound but not a new throw roll", fullRepository: "NOT_RUN", L03: "PARTIAL" } };
}
module.exports = { run, fixture, evaluate, probe };
if (require.main === module) { const result = run(); console.log(JSON.stringify({ ...result.summary, suite: result.suite, failures: result.checks.filter(r => r.status === "FAIL") }, null, 2)); process.exitCode = result.summary.failed ? 1 : 0; }
