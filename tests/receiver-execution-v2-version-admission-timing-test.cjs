"use strict";
// Sprint 9 isolated safety checks. No Match, Save, captures or Git mutations.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const Foundation = require("../receiver-execution-v2-foundation.js");
const Safety = require("../receiver-execution-v2-admission-timing-foundation.js");
const Previous = require("./receiver-execution-v2-pure-contract-test.cjs");
const clone = value => JSON.parse(JSON.stringify(value));
function inputFixture() {
  const input = Previous.fixture();
  input.context.routeId = "secureFirstBaseOut";
  return input;
}
function fixtureRequest(input = inputFixture()) {
  return {
    mode: "candidateV2", identity: clone(input.identity),
    topologyVersion: "regulation-coarse-zones-v1", initialOuts: input.context.initialOuts,
    basesAtAdmission: [null, null, null], routeId: input.context.routeId,
    routeEligibility: { newOpportunity: true, ownerPosition: "SS", surface: "directFirst",
      throwerRole: "primaryPlayer", receiverRole: "npc", phaseAtAdmission: "beforeExecution" },
    capabilities: clone(input.capabilities),
    provenance: {
      physicalIdentity: clone(input.provenance.physicalIdentity), actors: clone(input.provenance.actors),
      capabilities: clone(input.provenance.capabilities), eligibility: clone(input.provenance.physicalIdentity)
    }
  };
}
function policy(candidatePreparationEnabled = true) {
  return { version: Safety.versions.policy, runtimeEnabled: false, candidatePreparationEnabled };
}
function packet(input = inputFixture(), prior = null) {
  const sealed = Foundation.seal(input);
  assert.equal(sealed.status, "ok", JSON.stringify(sealed));
  const execution = Foundation.execute(sealed, prior);
  assert.equal(execution.status, "ok", JSON.stringify(execution));
  return { kind: "unappliedPureTimingPacket", safetyVersion: Safety.versions.safety,
    sealed, execution, prior };
}
function pin(request = fixtureRequest(), activePolicy = policy()) {
  const result = Safety.createPin(request, activePolicy);
  assert.equal(result.status, "ok", JSON.stringify(result));
  return result;
}
function snapshot(admission = pin(), phase = "pending") {
  return { formatVersion: Safety.versions.format, phase,
    admission: clone(admission), admissionCopy: clone(admission), executionBinding: null };
}
function historicalEvidence() {
  return { knownHistoricalLegacy: true, sourceSaveVersion: 1,
    provenance: { classification: "A", scope: "pureFixture", owner: "declared-existing-save-owner",
      reference: "known-historical-fixture", version: "historical-fixture-evidence-v1" } };
}
function priorFrom(first) { return { sealed: first.sealed, execution: first.execution }; }
function run() {
  const rows = [];
  function test(name, fn) {
    try { fn(); rows.push({ name, status: "PASS" }); }
    catch (error) { rows.push({ name, status: "FAIL", message: error.message }); }
  }
  function rejected(name, operation, expectedStatus = "invalid", code) {
    test(name, () => {
      const result = operation();
      assert.equal(result.status, expectedStatus, JSON.stringify(result));
      if (code) assert.equal(result.code, code);
    });
  }
  test("candidate pin keeps runtime disabled and official execution with legacy", () => {
    const result = pin();
    assert.equal(result.kind, "isolatedVersionPin");
    assert.equal(result.body.runtimeEnabled, false);
    assert.equal(result.body.officialExecutionOwner, "existingLegacyOwner");
    assert.deepEqual(result.body.candidateVersions, inputFixture().versions);
    assert.equal(Safety.validatePin(result).status, "ok");
    assert.equal(Safety.admitOfficial(result).status, "insufficient");
  });
  test("legacy pin has no candidate versions and remains existing-owner metadata", () => {
    const request = fixtureRequest(); request.mode = "legacy";
    const result = pin(request, policy(false));
    assert.equal(result.body.candidateVersions, null);
    assert.equal(result.body.officialExecutionOwner, "existingLegacyOwner");
    assert.equal(Safety.validatePin(result).status, "ok");
    assert.equal(Safety.admitOfficial(result).status, "insufficient");
  });
  test("pin creation does not mutate or freeze caller input", () => {
    const request = fixtureRequest(), before = clone(request), p = policy();
    const result = pin(request, p);
    assert.deepEqual(request, before); assert.equal(Object.isFrozen(request), false);
    assert.equal(Object.isFrozen(result.body.request.identity.physical), true);
    assert.equal(Object.isFrozen(p), false);
  });
  test("all three historical topology tags remain distinct from receiver version", () => {
    for (const topologyVersion of ["regulation-coarse-zones-v1", "regulation-coarse-ground-lanes-v2", "regulation-coarse-ground-lanes-v3"]) {
      const request = fixtureRequest(); request.topologyVersion = topologyVersion;
      const result = pin(request);
      assert.equal(result.body.request.topologyVersion, topologyVersion);
      assert.equal(result.body.candidateVersions.execution, Foundation.versions.execution);
    }
  });
  test("explicit hold surface pins before no-delivery diagnostic preparation", () => {
    const input = inputFixture(); input.context.routeId = "holdBall";
    input.delivery.status = "notAttempted"; input.delivery.accuracy = "none";
    input.delivery.quality = "none";
    input.delivery.ballArrival = { version: Foundation.versions.timing, originId: input.context.originId,
      status: "unknown", reason: "explicit-hold-no-delivery" };
    const request = fixtureRequest(input); request.routeEligibility.surface = "hold";
    const admission = pin(request), prepared = Safety.prepareDiagnostic(admission, input);
    assert.equal(prepared.status, "ok", JSON.stringify(prepared));
    assert.equal(prepared.simulationPerformed, false);
    assert.equal(prepared.officialExecutionConsumed, false);
  });
  test("legal held ball with notAttempted delivery has only an isolated execution binding", () => {
    const input = inputFixture(); input.context.routeId = "holdBall";
    input.delivery.status = "notAttempted"; input.delivery.accuracy = "none"; input.delivery.quality = "none";
    input.delivery.ballArrival = { version: Foundation.versions.timing, originId: input.context.originId,
      status: "unknown", reason: "held-ball-no-flight" };
    const request = fixtureRequest(input); request.routeEligibility.surface = "hold";
    const admission = pin(request), prepared = Safety.prepareDiagnostic(admission, input);
    assert.equal(prepared.status, "ok"); assert.equal(prepared.simulationPerformed, false);
    assert.equal(prepared.officialExecutionConsumed, false); assert.equal(prepared.formalSaveAdmission, false);
    assert.equal(Safety.validateExecutionBinding(admission, prepared.sealed, prepared.binding).status, "ok");
    const independentlyEvaluated = Foundation.execute(prepared.sealed);
    assert.equal(independentlyEvaluated.stages.delivery.status, "notAttempted");
    assert.equal(independentlyEvaluated.stages.secure.attempted, false);
    assert.equal(independentlyEvaluated.stages.contest.candidate, null);
  });
  rejected("completed delivery cannot be bound to a held-ball admission", () => {
    const input = inputFixture(); input.context.routeId = "holdBall";
    const request = fixtureRequest(input); request.routeEligibility.surface = "hold";
    return Safety.prepareDiagnostic(pin(request), input);
  }, "invalid", "heldBallIncludesDelivery");
  rejected("player receiver role is excluded from NPC receiver candidate slice", () => {
    const request = fixtureRequest(); request.routeEligibility.receiverRole = "player";
    return Safety.createPin(request, policy());
  }, "invalid", "ineligibleCandidateRoute");
  rejected("actorId player cannot masquerade as NPC receiver role", () => {
    const request = fixtureRequest(); request.identity.receiver.actorId = "player";
    request.capabilities.actorId = "player";
    return Safety.createPin(request, policy());
  }, "invalid", "ineligibleCandidateRoute");
  for (const role of ["throwerRole", "receiverRole"]) rejected("missing explicit " + role + " has no inferred role fallback", () => {
    const request = fixtureRequest(); delete request.routeEligibility[role];
    return Safety.createPin(request, policy());
  }, "invalid", "invalidRouteEligibility");
  for (const role of ["npc", "player"]) rejected("non-primary " + role + " thrower cannot use SS primary-player admission", () => {
    const request = fixtureRequest(); request.routeEligibility.throwerRole = role;
    return Safety.createPin(request, policy());
  }, "invalid", "ineligibleCandidateRoute");
  for (const mode of ["candidateV2", "legacy"]) for (const phase of ["executed", "settled"]) rejected(mode + " cannot be newly pinned after " + phase, () => {
    const request = fixtureRequest(); request.mode = mode; request.routeEligibility.phaseAtAdmission = phase;
    return Safety.createPin(request, policy());
  }, "invalid", "admissionMustPrecedeExecution");
  rejected("missing phaseAtAdmission cannot infer before-execution admission", () => {
    const request = fixtureRequest(); delete request.routeEligibility.phaseAtAdmission;
    return Safety.createPin(request, policy());
  }, "invalid", "invalidRouteEligibility");
  rejected("unknown admission phase cannot select an execution model", () => {
    const request = fixtureRequest(); request.routeEligibility.phaseAtAdmission = "unknown";
    return Safety.createPin(request, policy());
  }, "invalid", "admissionMustPrecedeExecution");
  for (const [name, mutate] of [
    ["unknown model", r => { r.mode = "futureV3"; }],
    ["removed execution discriminator", r => { delete r.mode; }],
    ["null physical identity", r => { r.identity.physical = null; }],
    ["synthetic legacy physical version", r => { r.identity.physical.version = "legacySynthetic"; }],
    ["missing contact identity", r => { delete r.identity.physical.contactId; }],
    ["invalid actor position", r => { r.identity.receiver.position = "DH"; }],
    ["self throw", r => { r.identity.receiver = clone(r.identity.thrower); r.capabilities.actorId = r.identity.receiver.actorId; }],
    ["runner is receiving actor", r => { r.identity.target.runnerId = r.identity.receiver.actorId; }],
    ["retry physical slot", r => { r.identity.leg.physicalSlot = "retryThrow2"; }],
    ["unknown topology", r => { r.topologyVersion = "future-topology"; }],
    ["three outs at admission", r => { r.initialOuts = 3; }],
    ["capability actor mismatch", r => { r.capabilities.actorId = "unrelated-actor"; }],
    ["unknown ability adapter", r => { r.capabilities.adapterVersion = "future-adapter"; }],
    ["fractional actual ability", r => { r.capabilities.values.catching = 0.5; }],
    ["missing provenance", r => { delete r.provenance.actors; }],
    ["legacy success boolean", r => { r.legacySuccess = true; }]
  ]) rejected("admission rejects " + name, () => { const request = fixtureRequest(); mutate(request); return Safety.createPin(request, policy()); });
  for (const [name, mutate] of [
    ["previously admitted opportunity", r => { r.routeEligibility.newOpportunity = false; }],
    ["2B primary owner", r => { r.routeEligibility.ownerPosition = "2B"; }],
    ["occupied bases", r => { r.basesAtAdmission[0] = "lead-runner"; }],
    ["wrong force target", r => { r.identity.target.base = "second"; }],
    ["route outside direct allowlist", r => { r.routeId = "startDoublePlaySecond"; }],
    ["hold route with direct surface", r => { r.routeId = "holdBall"; }],
    ["direct route with hold surface", r => { r.routeEligibility.surface = "hold"; }]
  ]) rejected("candidate excludes " + name, () => { const request = fixtureRequest(); mutate(request); return Safety.createPin(request, policy()); });
  for (const key of ["physicalIdentity", "actors", "capabilities", "eligibility"]) rejected("missing source C remains insufficient: " + key, () => {
    const request = fixtureRequest(); request.provenance[key].classification = "C";
    return Safety.createPin(request, policy());
  }, "insufficient", "insufficientAdmissionSources");
  test("pureFixture sources permit isolated pin only, not official admission", () => {
    const result = pin(); assert(Object.values(result.body.request.provenance).every(p => p.scope === "pureFixture"));
    assert.equal(Safety.admitOfficial(result).code, "formalReceiverV2AdmissionUnavailable");
  });
  rejected("runtime-enabled policy rejected", () => Safety.createPin(fixtureRequest(), { ...policy(), runtimeEnabled: true }));
  rejected("unknown policy version rejected", () => Safety.createPin(fixtureRequest(), { ...policy(), version: "future-policy" }));
  rejected("new candidate preparation can be disabled", () => Safety.createPin(fixtureRequest(), policy(false)), "insufficient", "candidatePreparationDisabled");
  for (const phase of ["pending", "executed", "settled"]) test("policy rollback does not replace admitted pin: " + phase, () => {
    const admission = pin(), before = clone(admission);
    const result = Safety.retainPin(admission, fixtureRequest(), phase, policy(false));
    assert.equal(result.status, "ok"); assert.deepEqual(result.pin, before);
    assert.equal(result.reselected, false); assert.equal(result.formalLifecycleSupported, false);
    assert.deepEqual(admission, before);
  });
  for (const [name, mutate] of [
    ["actor", r => { r.identity.receiver.actorId = "new-first-base"; r.capabilities.actorId = "new-first-base"; }],
    ["capability", r => { r.capabilities.values.catching = 4; }],
    ["physical", r => { r.identity.physical.contactId = "new-contact"; }],
    ["route", r => { r.routeId = "holdBall"; r.routeEligibility.surface = "hold"; }],
    ["model downgrade", r => { r.mode = "legacy"; }]
  ]) rejected("retention refuses pinned " + name + " change", () => {
    const request = fixtureRequest(); mutate(request);
    return Safety.retainPin(pin(), request, "pending", policy());
  }, "invalid", "pinnedAdmissionIdentityMismatch");
  test("legacy pending cannot upgrade model under changed policy", () => {
    const request = fixtureRequest(); request.mode = "legacy";
    assert.equal(Safety.retainPin(pin(request), fixtureRequest(), "pending", policy()).status, "invalid");
    assert.equal(Safety.prepareDiagnostic(pin(request), inputFixture()).code, "legacyPinCannotUpgrade");
  });
  for (const key of ["execution", "adapter", "timing", "sampler", "effort"]) rejected("unknown pinned " + key + " version refused", () => {
    const admission = clone(pin()); admission.body.candidateVersions[key] = "future-version";
    return Safety.validatePin(admission);
  });
  rejected("removed candidate version tag refused", () => { const admission = clone(pin()); delete admission.body.candidateVersions; return Safety.validatePin(admission); });
  rejected("unknown safety version refused", () => { const admission = clone(pin()); admission.body.safetyVersion = "future-safety"; return Safety.validatePin(admission); });
  rejected("unknown legacy timing version refused", () => { const admission = clone(pin()); admission.body.legacyTimingVersion = "future-legacy-timing"; return Safety.validatePin(admission); });
  test("JSON cold round-trip preserves pin and pending isolated serialization", () => {
    const admission = clone(pin()), stored = clone(snapshot(admission));
    assert.equal(Safety.validatePin(admission).status, "ok");
    const result = Safety.validateSnapshot(stored, admission);
    assert.equal(result.status, "ok"); assert.equal(result.formalSaveAdmission, false);
    assert.equal(result.scope, "ISOLATED_PENDING_SERIALIZATION_ONLY");
  });
  for (const phase of ["executed", "settled"]) rejected("candidate " + phase + " Save is explicitly not implemented", () => Safety.validateSnapshot(snapshot(pin(), phase), pin()), "insufficient", "candidateRuntimeSaveNotImplemented");
  for (const phase of ["executed", "settled"]) rejected("legacy " + phase + " recovery belongs to existing owner", () => {
    const request = fixtureRequest(); request.mode = "legacy"; const admission = pin(request);
    return Safety.validateSnapshot(snapshot(admission, phase), admission);
  }, "insufficient", "legacyExecutionRecoveryBelongsToExistingOwner");
  for (const key of ["formatVersion", "admission", "admissionCopy", "executionBinding"]) rejected("new snapshot missing required " + key + " cannot fallback", () => {
    const stored = snapshot(); delete stored[key]; return Safety.validateSnapshot(stored, pin());
  });
  rejected("snapshot null pin cannot be historical omission", () => { const stored = snapshot(); stored.admissionCopy = null; return Safety.validateSnapshot(stored, pin()); });
  rejected("different otherwise-valid admission copies rejected", () => {
    const stored = snapshot(), request = fixtureRequest(); request.capabilities.values.catching = 12;
    stored.admissionCopy = clone(pin(request)); return Safety.validateSnapshot(stored, stored.admission);
  }, "invalid", "snapshotVersionCopyMismatch");
  rejected("snapshot cannot replace independently expected pin", () => {
    const stored = snapshot(), request = fixtureRequest(); request.identity.physical.contactId = "different-contact";
    return Safety.validateSnapshot(stored, pin(request));
  }, "invalid", "snapshotVersionCopyMismatch");
  rejected("pending snapshot cannot pretend execution binding already present", () => { const stored = snapshot(); stored.executionBinding = {}; return Safety.validateSnapshot(stored, pin()); });
  test("explicit historical evidence routes only to existing legacy owner", () => {
    const old = { legacyCache: "preserved-fixture-cache" }, before = clone(old);
    const result = Safety.recognizeHistorical(old, historicalEvidence());
    assert.equal(result.status, "ok"); assert.equal(result.executionOwner, "existingLegacyOwner");
    assert.equal(result.formalSaveAdmission, false); assert.deepEqual(old, before);
    assert.equal(result.scope, "HISTORICAL_ROUTING_ONLY_NOT_SAVE_VALIDATION");
  });
  rejected("missing historical evidence does not infer legacy from omission", () => Safety.recognizeHistorical({}, null), "insufficient");
  rejected("unsupported historical claim remains insufficient", () => Safety.recognizeHistorical({}, { ...historicalEvidence(), knownHistoricalLegacy: false }), "insufficient");
  rejected("historical source C remains insufficient", () => { const history = historicalEvidence(); history.provenance.classification = "C"; return Safety.recognizeHistorical({}, history); }, "insufficient");
  for (const key of ["formatVersion", "admission", "admissionCopy", "executionBinding", "receiverExecutionVersion", "kind", "safetyVersion", "candidateVersions", "timingVersion", "samplerVersion", "adapterVersion", "effortProfileVersion", "runtimeEnabled"]) rejected("present new tag cannot masquerade as historical: " + key, () => Safety.recognizeHistorical({ [key]: null }, historicalEvidence()));
  test("all exported new envelope kinds prohibit historical fallback", () => {
    const values = [pin(), packet(), Safety.prepareDiagnostic(pin(), inputFixture()), Safety.validateTimingCandidate(packet())];
    for (const value of values) assert.equal(Safety.recognizeHistorical(value, historicalEvidence()).status, "invalid");
  });
  test("diagnostic preparation seals supplied input without producing execution", () => {
    const input = inputFixture(), before = clone(input), result = Safety.prepareDiagnostic(pin(fixtureRequest(input)), input);
    assert.equal(result.status, "ok", JSON.stringify(result));
    assert.equal(result.simulationPerformed, false); assert.equal(result.officialExecutionConsumed, false);
    assert.equal(result.formalSaveAdmission, false); assert.equal("execution" in result, false);
    assert.equal(result.binding.originalSampleBinary64, Foundation.binary64(input.ownedSample));
    assert.deepEqual(input, before); assert.equal(Object.isFrozen(input), false);
  });
  test("diagnostic preparation never calls full pure execute", () => {
    const file = require.resolve("../receiver-execution-v2-admission-timing-foundation.js"), isolated = new Module(file, module);
    isolated.filename = file; isolated.paths = module.paths;
    let executions = 0;
    const fake = { ...Foundation, execute() { executions++; throw Error("full execute forbidden during preparation"); } };
    isolated.require = name => name === "./receiver-execution-v2-foundation.js" ? fake : require(name);
    isolated._compile(fs.readFileSync(file, "utf8"), file);
    const admission = isolated.exports.createPin(fixtureRequest(), policy());
    assert.equal(isolated.exports.prepareDiagnostic(admission, inputFixture()).status, "ok");
    assert.equal(executions, 0);
  });
  test("saved execution binding validates unchanged and after JSON cold round-trip", () => {
    const admission = pin(), prepared = Safety.prepareDiagnostic(admission, inputFixture());
    const result = Safety.validateExecutionBinding(admission, prepared.sealed, prepared.binding);
    assert.equal(result.status, "ok"); assert.equal(result.formalSaveAdmission, false);
    assert.equal(result.scope, "ISOLATED_EXECUTION_BINDING_ONLY");
    assert.deepEqual(Safety.validateExecutionBinding(clone(admission), clone(prepared.sealed), clone(prepared.binding)), result);
  });
  for (const key of ["inputDigest", "originalSampleBinary64", "sampleVectorDigest", "pinDigest"]) rejected("saved binding rejects changed " + key, () => {
    const admission = pin(), prepared = Safety.prepareDiagnostic(admission, inputFixture()), saved = clone(prepared.binding);
    saved[key] = "forged-bound-value";
    return Safety.validateExecutionBinding(admission, prepared.sealed, saved);
  }, "invalid", "savedExecutionBindingMismatch");
  rejected("removed saved original sample cannot become pending omission", () => {
    const admission = pin(), prepared = Safety.prepareDiagnostic(admission, inputFixture()), saved = clone(prepared.binding);
    delete saved.originalSampleBinary64;
    return Safety.validateExecutionBinding(admission, prepared.sealed, saved);
  }, "invalid", "savedExecutionBindingMismatch");
  test("valid resealing of changed original sample cannot replace saved execution binding", () => {
    const admission = pin(), prepared = Safety.prepareDiagnostic(admission, inputFixture()), changed = inputFixture();
    changed.ownedSample = 0.25;
    const resealed = Foundation.seal(changed); assert.equal(resealed.status, "ok");
    assert.deepEqual(resealed.samples, prepared.sealed.samples);
    const result = Safety.validateExecutionBinding(admission, resealed, prepared.binding);
    assert.equal(result.status, "invalid"); assert.equal(result.code, "savedExecutionBindingMismatch");
    assert.equal(prepared.binding.originalSampleBinary64, Foundation.binary64(0.62));
  });
  test("saved binding getters do not execute during recovery validation", () => {
    const admission = pin(), prepared = Safety.prepareDiagnostic(admission, inputFixture()), saved = clone(prepared.binding);
    let reads = 0;
    Object.defineProperty(saved, "inputDigest", { enumerable: true, get() { reads++; return prepared.binding.inputDigest; } });
    assert.equal(Safety.validateExecutionBinding(admission, prepared.sealed, saved).status, "invalid");
    assert.equal(reads, 0);
  });
  rejected("diagnostic lacks positioning source instead of legacy fallback", () => { const input = inputFixture(); input.provenance.positioning.classification = "C"; return Safety.prepareDiagnostic(pin(), input); }, "insufficient");
  for (const [name, mutate] of [
    ["capability", i => { i.capabilities.values.catching = 2; }],
    ["route", i => { i.context.routeId = "holdBall"; }],
    ["actor", i => { i.identity.receiver.actorId = "different-receiver"; i.capabilities.actorId = "different-receiver"; i.handoff.receiverId = "different-receiver"; }]
  ]) rejected("execution binding refuses admitted " + name + " mismatch", () => { const input = inputFixture(); mutate(input); return Safety.prepareDiagnostic(pin(), input); });
  test("timing consistency accepts only an unapplied diagnostic and zero actual retirements", () => {
    const value = packet(), before = clone(value), result = Safety.validateTimingCandidate(value);
    assert.equal(result.status, "ok"); assert.equal(result.disposition, "retirementCandidate");
    assert.equal(result.runtimeEnabled, false); assert.equal(result.actualRetirements, 0);
    assert.equal(result.validationOnly, true); assert.equal(result.settlementAdmission, false); assert.equal(result.scoringAdmission, false);
    assert.deepEqual(value, before); assert.deepEqual(result.timestamps.runnerArrival, value.sealed.input.contest.runnerArrival);
  });
  for (const outs of [0, 1, 2]) test("timing candidate initial outs " + outs + " cannot settle score", () => {
    const input = inputFixture(); input.context.initialOuts = outs; const value = packet(input);
    const result = Safety.validateTimingCandidate(value);
    assert.equal(result.status, "ok"); assert.equal(result.actualRetirements, 0);
    assert.equal(result.settlementAdmission, false); assert.equal(result.scoringAdmission, false);
    assert.equal(value.execution.stages.contest.candidate.wouldBeThirdOut, outs === 2);
  });
  test("exact tie remains known with no out candidate", () => {
    const input = inputFixture(), completion = packet(input).execution.stages.contest.completion;
    input.contest.runnerArrival = clone(completion); const value = packet(input), result = Safety.validateTimingCandidate(value);
    assert.equal(result.status, "ok"); assert.equal(result.disposition, "tie"); assert.equal(result.timingKnowledge, "known");
    assert.equal(value.execution.stages.contest.candidate, null); assert.equal(result.actualRetirements, 0);
  });
  for (const key of ["runner", "ball", "position", "legality"]) test("unknown " + key + " time stays unresolved", () => {
    const input = inputFixture(), unknown = { version: Foundation.versions.timing, originId: input.context.originId, status: "unknown", reason: "fixture-unavailable" };
    if (key === "runner") input.contest.runnerArrival = unknown;
    if (key === "ball") input.delivery.ballArrival = unknown;
    if (key === "position") input.positioning.startTime = unknown;
    if (key === "legality") input.contest.legality.status = "unknown";
    const value = packet(input), result = Safety.validateTimingCandidate(value);
    assert.equal(result.status, "ok"); assert.equal(result.timingKnowledge, "unresolved");
    assert.equal(result.actualRetirements, 0); assert.equal(result.settlementAdmission, false);
    assert.equal(value.execution.stages.contest.candidate, null);
  });
  for (const [name, mutate] of [
    ["offline", i => { i.delivery.accuracy = "offline"; }],
    ["unavailable", i => { i.context.receiverAvailable = false; }],
    ["late", i => { i.positioning.startContext = "distant"; i.positioning.movementMdu = 5; }],
    ["hands failure", i => { i.capabilities.values.catching = 0; i.capabilities.values.fielding = 0; }],
    ["already-safe runner", i => { i.contest.runnerArrival.ticks = -1000; }],
    ["missing touch", i => { i.contest.attempted = false; i.contest.contact = false; }]
  ]) test("timing validates preserved causal branch: " + name, () => {
    const input = inputFixture(); mutate(input); const value = packet(input), result = Safety.validateTimingCandidate(value);
    assert.equal(result.status, "ok"); assert.equal(result.actualRetirements, 0);
    assert.equal(value.execution.stages.contest.candidate, null);
    assert.equal(value.execution.scorerFacts.officialError, null); assert.equal(value.execution.scorerFacts.wouldBeAssist, null);
  });
  test("relay timing keeps original absolute origin, no additional actual retirement", () => {
    const first = packet(), prior = priorFrom(first), value = packet(Previous.relay(prior), prior);
    const result = Safety.validateTimingCandidate(value);
    assert.equal(result.status, "ok"); assert.equal(result.originId, first.sealed.input.context.originId);
    assert(result.timestamps.launch.ticks >= first.execution.stages.contest.completion.ticks);
    assert.equal(result.actualRetirements, 0);
  });
  test("failed first force suppresses second candidate despite claimed continuation", () => {
    const input = inputFixture(); input.capabilities.values.catching = 0; input.capabilities.values.fielding = 0;
    const first = packet(input), prior = priorFrom(first), value = packet(Previous.relay(prior), prior);
    const result = Safety.validateTimingCandidate(value);
    assert.equal(result.status, "ok"); assert.equal(value.execution.stages.delivery.status, "blocked");
    assert.equal(value.execution.stages.contest.candidate, null); assert.equal(result.actualRetirements, 0);
  });
  test("first force third out prevents a fourth retirement candidate", () => {
    const input = inputFixture(); input.context.initialOuts = 2; const first = packet(input), prior = priorFrom(first);
    const second = Previous.relay(prior); second.context.initialOuts = 2;
    const value = packet(second, prior), result = Safety.validateTimingCandidate(value);
    assert.equal(result.status, "ok"); assert.equal(value.execution.stages.delivery.status, "blocked");
    assert.equal(value.execution.stages.contest.candidate, null); assert.equal(result.actualRetirements, 0);
  });
  rejected("relay requires supplied validated prior", () => {
    const first = packet(), prior = priorFrom(first), value = packet(Previous.relay(prior), prior);
    value.prior = null; return Safety.validateTimingCandidate(value);
  }, "insufficient");
  for (const [name, mutate] of [
    ["unknown packet version", p => { p.safetyVersion = "future-safety"; }],
    ["removed packet version", p => { delete p.safetyVersion; }],
    ["formal packet kind", p => { p.kind = "settlementFacts"; }],
    ["changed actor", p => { p.sealed.input.identity.receiver.actorId = "forged"; }],
    ["changed runner", p => { p.sealed.input.identity.target.runnerId = "forged-runner"; }],
    ["changed route", p => { p.sealed.input.context.routeId = "forged-route"; }],
    ["changed capability", p => { p.sealed.input.capabilities.values.catching = 0; }],
    ["changed owned sample", p => { p.sealed.input.ownedSample = 0.2; }],
    ["changed derived sample", p => { p.sealed.samples.stages.secure.u32++; }],
    ["changed timing origin", p => { p.sealed.input.contest.runnerArrival.originId = "relay-reset"; }],
    ["v1 ordinal arrival", p => { p.sealed.input.delivery.ballArrival = { value: 4, state: "wide" }; }],
    ["forged possession", p => { p.execution.stages.secure.secured = false; }],
    ["forged earlier touch", p => { p.execution.stages.contest.completion.ticks--; }],
    ["forged application", p => { p.execution.application.actualRetirements = 1; }]
  ]) rejected("serialized timing dependency rejects " + name, () => { const value = clone(packet()); mutate(value); return Safety.validateTimingCandidate(value); });
  rejected("modified prior output cannot support relay timing", () => {
    const first = packet(), prior = priorFrom(first), value = clone(packet(Previous.relay(prior), prior));
    value.prior.execution.stages.secure.secured = false; return Safety.validateTimingCandidate(value);
  });
  test("JSON serialization and repeated validation preserve all sealed values", () => {
    const value = packet(), before = clone(value), first = Safety.validateTimingCandidate(value);
    assert.deepEqual(Safety.validateTimingCandidate(clone(value)), first);
    assert.deepEqual(Safety.validateTimingCandidate(value), first); assert.deepEqual(value, before);
  });
  test("no Match RNG or Math.random is consumed by safety APIs", () => {
    const request = fixtureRequest(), value = packet(), random = Math.random;
    const existed = Object.prototype.hasOwnProperty.call(global, "nextHighSchoolMatchSimulationRandom"), old = global.nextHighSchoolMatchSimulationRandom;
    let calls = 0; const forbidden = () => { calls++; throw Error("RNG access forbidden"); };
    Math.random = forbidden; global.nextHighSchoolMatchSimulationRandom = forbidden;
    try {
      const admission = pin(request);
      assert.equal(Safety.prepareDiagnostic(admission, inputFixture()).status, "ok");
      assert.equal(Safety.validateTimingCandidate(value).status, "ok");
      assert.equal(Safety.validateSnapshot(snapshot(admission), admission).status, "ok");
      assert.equal(Safety.retainPin(admission, request, "settled", policy(false)).status, "ok");
      assert.equal(Safety.admitOfficial(value).status, "insufficient"); assert.equal(calls, 0);
    } finally { Math.random = random; if (existed) global.nextHighSchoolMatchSimulationRandom = old; else delete global.nextHighSchoolMatchSimulationRandom; }
  });
  test("getters are rejected without invoking source or version accessors", () => {
    let reads = 0; const request = fixtureRequest();
    Object.defineProperty(request, "mode", { enumerable: true, get() { reads++; return "candidateV2"; } });
    assert.equal(Safety.createPin(request, policy()).status, "invalid");
    const value = packet(); Object.defineProperty(value, "execution", { enumerable: true, get() { reads++; throw Error("getter executed"); } });
    assert.equal(Safety.validateTimingCandidate(value).status, "invalid"); assert.equal(reads, 0);
  });
  test("cycles, symbols and non-JSON types cannot become version facts", () => {
    const cycle = fixtureRequest(); cycle.cycle = cycle;
    assert.equal(Safety.createPin(cycle, policy()).status, "invalid");
    const symbol = fixtureRequest(); symbol[Symbol("hidden")] = true;
    assert.equal(Safety.createPin(symbol, policy()).status, "invalid");
    assert.equal(Safety.createPin(new Date(0), policy()).status, "invalid");
  });
  test("every diagnostic output remains unavailable to official admission", () => {
    const admission = pin(), prepared = Safety.prepareDiagnostic(admission, inputFixture()), validated = Safety.validateTimingCandidate(packet());
    for (const value of [admission, prepared, prepared.binding, prepared.sealed, validated, snapshot(admission), {}]) {
      const result = Safety.admitOfficial(value);
      assert.equal(result.status, "insufficient"); assert.equal(result.code, "formalReceiverV2AdmissionUnavailable");
    }
  });
  return { scope: "ISOLATED_ADMISSION_TIMING_SAFETY_NOT_PRODUCTION_SAVE", total: rows.length,
    passed: rows.filter(r => r.status === "PASS").length, failed: rows.filter(r => r.status === "FAIL").length, rows };
}
module.exports = { run, fixtureRequest, policy, packet };
if (require.main === module) {
  const result = run();
  console.log(JSON.stringify({ scope: result.scope, total: result.total, passed: result.passed,
    failed: result.failed, failures: result.rows.filter(r => r.status === "FAIL") }, null, 2));
  if (result.failed) process.exitCode = 1;
}
