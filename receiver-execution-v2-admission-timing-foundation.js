/* ISOLATED SAFETY CONTRACT. Not registered in Match, lifecycle, Save or settlement. */
"use strict";
const Pure = require("./receiver-execution-v2-foundation.js");
const V = Object.freeze({ safety: "receiver-admission-timing-contract-v1", format: "isolated-receiver-version-envelope-v1",
  policy: "inactive-ss-direct-policy-v1", legacyTiming: "defensive-runner-throw-settlement-v1" });
const TOPOLOGIES = ["regulation-coarse-zones-v1", "regulation-coarse-ground-lanes-v2", "regulation-coarse-ground-lanes-v3"];
const POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];
const ABILITIES = ["reaction", "range", "mobility", "catching", "fielding", "arm", "throwing", "decision"];
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const object = o => o !== null && typeof o === "object" && !Array.isArray(o);
const exact = (o, keys) => object(o) && Object.keys(o).length === keys.length && keys.every(k => own(o, k));
const id = s => typeof s === "string" && /^[A-Za-z0-9_.:|/\-]{1,512}$/.test(s);
const integer = (n, lo = 0, hi = 1000000000) => Number.isSafeInteger(n) && !Object.is(n, -0) && n >= lo && n <= hi;
const freeze = o => { if (o && typeof o === "object") { Object.values(o).forEach(freeze); Object.freeze(o); } return o; };
const clone = o => JSON.parse(Pure.canonicalEncode(o));
const same = (a, b) => Pure.canonicalEncode(a) === Pure.canonicalEncode(b);
const digest = o => Pure.sha256(Pure.canonicalEncode(o));
const invalid = (code, details = [], status = "invalid") => freeze({ status, code, details });
function dataOnly(value, active = new Set()) {
  if (value === null || typeof value !== "object") return;
  if (active.has(value)) throw Error("cyclic contract");
  active.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !own(d, "value")) throw Error("accessor or symbol contract");
    dataOnly(d.value, active);
  }
  active.delete(value);
}
const guarded = fn => (...args) => { try { args.forEach(a => dataOnly(a)); return fn(...args); } catch (_) { return invalid("malformedContract"); } };
const source = s => exact(s, ["classification", "scope", "owner", "reference", "version"]) &&
  ["A", "B", "C"].includes(s.classification) && ["ownedInput", "pureFixture"].includes(s.scope) && [s.owner, s.reference, s.version].every(id);
const versions = () => Object.fromEntries(["execution", "adapter", "timing", "sampler", "effort"].map(k => [k, Pure.versions[k]]));

function validateRequest(request) {
  // Canonical encoding precedes reads and rejects getters, cycles and non-JSON inputs.
  Pure.canonicalEncode(request);
  if (!exact(request, ["mode", "identity", "topologyVersion", "initialOuts", "basesAtAdmission", "routeId", "routeEligibility", "capabilities", "provenance"])) return invalid("invalidAdmissionSchema");
  if (!["legacy", "candidateV2"].includes(request.mode)) return invalid("unknownExecutionModel");
  const i = request.identity;
  if (!exact(i, ["playId", "physical", "leg", "thrower", "receiver", "target"]) || !id(i.playId) ||
    Pure.sampleVector(i.physical, i.leg?.physicalSlot).status !== "ok") return invalid("invalidPhysicalIdentity");
  if (!exact(i.leg, ["actionId", "sourceThrowActionId", "physicalSlot", "parentActionId"]) ||
    ![i.leg.actionId, i.leg.sourceThrowActionId].every(id) || i.leg.actionId === i.leg.sourceThrowActionId ||
    (i.leg.physicalSlot === "primaryThrow" ? i.leg.parentActionId !== null : !id(i.leg.parentActionId))) return invalid("invalidActionLeg");
  if (![i.thrower, i.receiver].every(a => exact(a, ["actorId", "position"]) && id(a.actorId) && POSITIONS.includes(a.position)) || i.thrower.actorId === i.receiver.actorId) return invalid("invalidActor");
  if (!exact(i.target, ["runnerId", "base"]) || !id(i.target.runnerId) || !["first", "second", "third", "home"].includes(i.target.base) ||
    [i.thrower.actorId, i.receiver.actorId].includes(i.target.runnerId)) return invalid("invalidTargetRunner");
  if (!TOPOLOGIES.includes(request.topologyVersion) || !integer(request.initialOuts, 0, 2) || !Array.isArray(request.basesAtAdmission) ||
    request.basesAtAdmission.length !== 3 || request.basesAtAdmission.some(r => r !== null && !id(r)) || !id(request.routeId)) return invalid("invalidAdmissionContext");
  const e = request.routeEligibility, caps = request.capabilities;
  if (!exact(e, ["newOpportunity", "ownerPosition", "surface", "throwerRole", "receiverRole", "phaseAtAdmission"]) || typeof e.newOpportunity !== "boolean" || !POSITIONS.includes(e.ownerPosition) ||
    !["primaryPlayer", "npc", "player"].includes(e.throwerRole) || !["npc", "player"].includes(e.receiverRole) ||
    !["directFirst", "hold", "otherLegacy"].includes(e.surface)) return invalid("invalidRouteEligibility");
  if (e.phaseAtAdmission !== "beforeExecution") return invalid("admissionMustPrecedeExecution");
  if (!exact(caps, ["actorId", "adapterVersion", "values"]) || caps.actorId !== i.receiver.actorId || caps.adapterVersion !== Pure.versions.adapter ||
    !exact(caps.values, ABILITIES) || ABILITIES.some(k => !integer(caps.values[k], 0, 20))) return invalid("invalidCapabilityBinding");
  if (!exact(request.provenance, ["physicalIdentity", "actors", "capabilities", "eligibility"]) || !Object.values(request.provenance).every(source)) return invalid("missingAdmissionProvenance");
  const gaps = Object.keys(request.provenance).filter(k => request.provenance[k].classification === "C");
  if (gaps.length) return invalid("insufficientAdmissionSources", gaps, "insufficient");
  if (request.mode === "candidateV2" && (!e.newOpportunity || e.ownerPosition !== "SS" || e.throwerRole !== "primaryPlayer" || e.receiverRole !== "npc" ||
    i.receiver.actorId === "player" || i.thrower.position !== "SS" || i.receiver.position !== "1B" ||
    i.target.base !== "first" || i.leg.physicalSlot !== "primaryThrow" || request.basesAtAdmission.some(Boolean) ||
    !(e.surface === "directFirst" && request.routeId === "secureFirstBaseOut" || e.surface === "hold" && request.routeId === "holdBall"))) return invalid("ineligibleCandidateRoute");
  return { status: "ok" };
}
function createPinRaw(request, policy) {
  const check = validateRequest(request); if (check.status !== "ok") return check;
  Pure.canonicalEncode(policy);
  if (!exact(policy, ["version", "runtimeEnabled", "candidatePreparationEnabled"]) || policy.version !== V.policy ||
    policy.runtimeEnabled !== false || typeof policy.candidatePreparationEnabled !== "boolean") return invalid("unsupportedAdmissionPolicy");
  if (request.mode === "candidateV2" && !policy.candidatePreparationEnabled) return invalid("candidatePreparationDisabled", [], "insufficient");
  const body = { safetyVersion: V.safety, runtimeEnabled: false, officialExecutionOwner: "existingLegacyOwner",
    policy: clone(policy), request: clone(request), candidateVersions: request.mode === "candidateV2" ? versions() : null,
    legacyTimingVersion: V.legacyTiming };
  return freeze({ status: "ok", kind: "isolatedVersionPin", body, pinDigest: digest(body) });
}
function validatePinRaw(pin) {
  Pure.canonicalEncode(pin);
  if (!exact(pin, ["status", "kind", "body", "pinDigest"]) || pin.status !== "ok" || pin.kind !== "isolatedVersionPin" ||
    !exact(pin.body, ["safetyVersion", "runtimeEnabled", "officialExecutionOwner", "policy", "request", "candidateVersions", "legacyTimingVersion"])) return invalid("invalidVersionPin");
  const fresh = createPinRaw(pin.body.request, pin.body.policy);
  if (fresh.status !== "ok") return fresh;
  return same(pin, fresh) ? freeze({ status: "ok", scope: "ISOLATED_PIN_NOT_MATCH_ADMISSION" }) : invalid("versionPinMismatch");
}
function retainPinRaw(pin, expectedRequest, phase, currentPolicy) {
  // Policy updates are validated but cannot select a replacement for an admitted pin.
  const valid = validatePinRaw(pin); if (valid.status !== "ok") return valid;
  const check = validateRequest(expectedRequest); if (check.status !== "ok") return check;
  if (!["pending", "executed", "settled"].includes(phase)) return invalid("unknownRecoveryPhase");
  Pure.canonicalEncode(currentPolicy);
  if (!exact(currentPolicy, ["version", "runtimeEnabled", "candidatePreparationEnabled"]) || currentPolicy.version !== V.policy ||
    currentPolicy.runtimeEnabled !== false || typeof currentPolicy.candidatePreparationEnabled !== "boolean") return invalid("unsupportedAdmissionPolicy");
  if (!same(pin.body.request, expectedRequest)) return invalid("pinnedAdmissionIdentityMismatch");
  return freeze({ status: "ok", scope: "ISOLATED_PIN_RETENTION_ONLY", phase, pin: clone(pin), reselected: false,
    formalLifecycleSupported: pin.body.request.mode === "legacy" ? "existingOwnerOnly" : false });
}

function validateTimingRaw(packet) {
  // This consistency validator accepts ALREADY PRODUCED pure outputs. It does not run a Match opportunity.
  if (!object(packet)) return invalid("missingCandidatePacket");
  // Pure stage API performs its own no-accessor validation before touching supplied dependencies.
  if (!exact(packet, ["kind", "safetyVersion", "sealed", "execution", "prior"]) || packet.kind !== "unappliedPureTimingPacket" || packet.safetyVersion !== V.safety) return invalid("unknownTimingPacketVersion");
  // Do not read any dependency before S8 validates the sealed JSON and original frozen vector.
  const a = Pure.resolveDelivery(packet.sealed, packet.prior); if (a.status !== "ok") return a;
  const b = Pure.resolvePositioning(packet.sealed, a.output, packet.prior); if (b.status !== "ok") return b;
  const c = Pure.resolveSecure(packet.sealed, a.output, b.output, packet.prior); if (c.status !== "ok") return c;
  const d = Pure.resolveContest(packet.sealed, a.output, b.output, c.output, packet.prior); if (d.status !== "ok") return d;
  // Execution has integer-only output. Encoding rejects malicious getters in serialized copies.
  Pure.canonicalEncode(packet.execution);
  const expected = Pure.execute(packet.sealed, packet.prior); if (expected.status !== "ok") return expected;
  if (!same(packet.execution, expected)) return invalid("candidateTimingDependencyMismatch");
  const i = packet.sealed.input;
  return freeze({ status: "ok", kind: "validatedUnappliedTimingDiagnostic", safetyVersion: V.safety, runtimeEnabled: false,
    timingVersion: Pure.versions.timing, originId: i.context.originId, identity: clone(i.identity), inputDigest: packet.sealed.inputDigest,
    timestamps: { launch: clone(i.delivery.launch), ballArrival: clone(i.delivery.ballArrival), positioningCompletion: b.output.completion ? clone(b.output.completion) : null,
      secureCompletion: c.output.completion ? clone(c.output.completion) : null, contactCompletion: d.output.completion ? clone(d.output.completion) : null, runnerArrival: clone(i.contest.runnerArrival) },
    disposition: d.output.status, timingKnowledge: [i.delivery.launch, i.delivery.ballArrival, i.positioning.startTime, i.contest.runnerArrival].some(t => t.status === "unknown") || i.contest.legality.status === "unknown" ? "unresolved" : "known",
    settlementAdmission: false, scoringAdmission: false, actualRetirements: 0, validationOnly: true });
}

function bindExecutionRaw(pin, sealed) {
  const valid = validatePinRaw(pin); if (valid.status !== "ok") return valid;
  if (pin.body.request.mode !== "candidateV2") return invalid("legacyPinCannotUpgrade");
  const a = Pure.resolveDelivery(sealed); if (a.status !== "ok") return a;
  const r = pin.body.request, i = sealed.input;
  if (!same(r.identity, i.identity) || !same(r.capabilities, i.capabilities) || !same(pin.body.candidateVersions, i.versions) ||
    r.routeId !== i.context.routeId || r.initialOuts !== i.context.initialOuts) return invalid("executionAdmissionBindingMismatch");
  if (r.routeEligibility.surface === "hold" && i.delivery.status !== "notAttempted") return invalid("heldBallIncludesDelivery");
  for (const key of ["physicalIdentity", "actors", "capabilities"]) if (!same(r.provenance[key], i.provenance[key])) return invalid("executionSourceBindingMismatch", [key]);
  return freeze({ status: "ok", kind: "isolatedExecutionBinding", runtimeEnabled: false, pinDigest: pin.pinDigest,
    inputDigest: sealed.inputDigest, originalSampleBinary64: Pure.binary64(i.ownedSample), sampleVectorDigest: digest(Object.fromEntries(Object.entries(sealed.samples.stages).map(([k, v]) => [k, { sha256: v.sha256, u32: v.u32 }]))),
    formalSaveAdmission: false });
}

function prepareDiagnosticRaw(pin, input) {
  // Input must already contain owned facts and the original sample supplied by its owner.
  // No public callback or legacy boolean is used to fill absent facts.
  const valid = validatePinRaw(pin); if (valid.status !== "ok") return valid;
  if (pin.body.request.mode !== "candidateV2") return invalid("legacyPinCannotUpgrade");
  const sealed = Pure.seal(input); if (sealed.status !== "ok") return sealed;
  const binding = bindExecutionRaw(pin, sealed); if (binding.status !== "ok") return binding;
  return freeze({ status: "ok", kind: "diagnosticPreparationOnly", runtimeEnabled: false, binding, sealed,
    simulationPerformed: false, officialExecutionConsumed: false, formalSaveAdmission: false });
}
function validateExecutionBindingRaw(pin, sealed, savedBinding) {
  Pure.canonicalEncode(savedBinding);
  const fresh = bindExecutionRaw(pin, sealed); if (fresh.status !== "ok") return fresh;
  return same(fresh, savedBinding) ? freeze({ status: "ok", scope: "ISOLATED_EXECUTION_BINDING_ONLY", formalSaveAdmission: false }) : invalid("savedExecutionBindingMismatch");
}

function validateSnapshotRaw(snapshot, expectedPin) {
  Pure.canonicalEncode(snapshot);
  const valid = validatePinRaw(expectedPin); if (valid.status !== "ok") return valid;
  if (!exact(snapshot, ["formatVersion", "phase", "admission", "admissionCopy", "executionBinding"]) || snapshot.formatVersion !== V.format) return invalid("unknownOrMissingSnapshotFormat");
  if (!["pending", "executed", "settled"].includes(snapshot.phase)) return invalid("unknownRecoveryPhase");
  if (!snapshot.admission || !snapshot.admissionCopy) return invalid("newFormatMissingVersionPin");
  const a = validatePinRaw(snapshot.admission); if (a.status !== "ok") return a;
  const b = validatePinRaw(snapshot.admissionCopy); if (b.status !== "ok") return b;
  if (!same(snapshot.admission, snapshot.admissionCopy) || !same(snapshot.admission, expectedPin)) return invalid("snapshotVersionCopyMismatch");
  if (snapshot.phase === "pending" && snapshot.executionBinding !== null) return invalid("pendingHasExecutionBinding");
  if (snapshot.admission.body.request.mode === "candidateV2" && snapshot.phase !== "pending") return invalid("candidateRuntimeSaveNotImplemented", [snapshot.phase], "insufficient");
  if (snapshot.phase !== "pending") return invalid("legacyExecutionRecoveryBelongsToExistingOwner", [snapshot.phase], "insufficient");
  return freeze({ status: "ok", scope: "ISOLATED_PENDING_SERIALIZATION_ONLY", formalSaveAdmission: false, phase: "pending", pinDigest: expectedPin.pinDigest });
}
function recognizeHistoricalRaw(snapshot, history) {
  // history is separate evidence from the existing Save owner, never inferred from absent tags.
  Pure.canonicalEncode(snapshot); Pure.canonicalEncode(history);
  if (!exact(history, ["knownHistoricalLegacy", "sourceSaveVersion", "provenance"]) || history.knownHistoricalLegacy !== true ||
    !integer(history.sourceSaveVersion, 0, 100000) || !source(history.provenance)) return invalid("unprovenHistoricalLegacy", [], "insufficient");
  if (history.provenance.classification === "C") return invalid("insufficientHistoricalEvidence", [], "insufficient");
  if (!object(snapshot) || ["kind", "safetyVersion", "formatVersion", "admission", "admissionCopy", "executionBinding", "receiverExecutionVersion",
    "candidateVersions", "timingVersion", "samplerVersion", "adapterVersion", "effortProfileVersion", "runtimeEnabled"].some(k => own(snapshot, k))) return invalid("versionedSnapshotCannotUseHistoricalFallback");
  return freeze({ status: "ok", scope: "HISTORICAL_ROUTING_ONLY_NOT_SAVE_VALIDATION", executionOwner: "existingLegacyOwner",
    provenance: clone(history.provenance), sourceSaveVersion: history.sourceSaveVersion, formalSaveAdmission: false });
}
function officialAdmissionRaw(value) {
  // No exported diagnostic type can be promoted into the formal pipeline by this API.
  return invalid("formalReceiverV2AdmissionUnavailable", [], "insufficient");
}
module.exports = freeze({ versions: V, runtimeEnabled: false, createPin: guarded(createPinRaw), validatePin: guarded(validatePinRaw), retainPin: guarded(retainPinRaw),
  bindExecution: guarded(bindExecutionRaw), validateExecutionBinding: guarded(validateExecutionBindingRaw), prepareDiagnostic: guarded(prepareDiagnosticRaw), validateTimingCandidate: guarded(validateTimingRaw),
  validateSnapshot: guarded(validateSnapshotRaw), recognizeHistorical: guarded(recognizeHistoricalRaw), admitOfficial: guarded(officialAdmissionRaw) });
