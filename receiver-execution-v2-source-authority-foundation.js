/* Isolated source authority policies. NOT a Match adapter, Save owner or runtime feature. */
"use strict";
const Pure = require("./receiver-execution-v2-foundation.js");
const V = Object.freeze({
  source: "receiver-source-authority-isolated-v1", positioning: "npc1b-initial-cover-policy-v1",
  incoming: "ss-canonical-incoming-policy-v1", adapter: "npc1b-explicit-alias-adapter-v1",
  bridge: "common-launch-crt-bridge-proposal-v1", touch: "npc1b-possession-touch-policy-v1",
  delivery: "canonical-ss-delivery-view-v1", timing: Pure.versions.timing, sampler: Pure.versions.sampler
});
// All coefficients are UNCALIBRATED, versioned model assumptions; not measurements.
const COVER = Object.freeze({
  baseCovering: { movementMdu: 0, startDelayTicks: 0, touchDelayTicks: 100 },
  nearFirstBase: { movementMdu: 1, startDelayTicks: 0, touchDelayTicks: 150 },
  movingToFirstBase: { movementMdu: 3, startDelayTicks: 250, touchDelayTicks: 200 },
  lateCover: { movementMdu: 5, startDelayTicks: 1500, touchDelayTicks: 250 },
  unavailable: { movementMdu: 0, startDelayTicks: 0, touchDelayTicks: 100 }
});
const INCOMING = Object.freeze({
  onTarget: { demandMilli: 6000, cleanDelayTicks: 200, lateralReachMdu: 0 },
  challengingReceive: { demandMilli: 9500, cleanDelayTicks: 350, lateralReachMdu: 1 },
  lateWeakThrow: { demandMilli: 10000, cleanDelayTicks: 450, lateralReachMdu: 1 },
  offline: { demandMilli: 0, cleanDelayTicks: 0, lateralReachMdu: 0 },
  notAttempted: { demandMilli: 0, cleanDelayTicks: 0, lateralReachMdu: 0 }
});
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const object = o => o !== null && typeof o === "object" && !Array.isArray(o);
const exact = (o, keys) => object(o) && Object.keys(o).length === keys.length && keys.every(k => own(o, k));
const id = s => typeof s === "string" && /^[A-Za-z0-9_.:|/\-]{1,240}$/.test(s);
const integer = (n, low = 0, high = 1000000000) => Number.isSafeInteger(n) && !Object.is(n, -0) && n >= low && n <= high;
const freeze = o => { if (o && typeof o === "object") { Object.values(o).forEach(freeze); Object.freeze(o); } return o; };
const fail = (code, status = "invalid", details = []) => freeze({ status, code, details });
function dataOnly(v, active = new Set()) {
  if (v === null || typeof v !== "object") return;
  if (active.has(v)) throw Error("cyclic input");
  active.add(v);
  for (const k of Reflect.ownKeys(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (typeof k === "symbol" || !own(d, "value")) throw Error("accessor or symbol input");
    dataOnly(d.value, active);
  }
  active.delete(v);
}
const clone = v => JSON.parse(Pure.canonicalEncode(v));
const digest = v => Pure.sha256(Pure.canonicalEncode(v));
const equal = (a, b) => Pure.canonicalEncode(a) === Pure.canonicalEncode(b);
function source(s) {
  return exact(s, ["classification", "scope", "owner", "reference", "version"]) &&
    ["A", "B", "C"].includes(s.classification) && s.scope === "pureFixture" && [s.owner, s.reference, s.version].every(id);
}
function sources(p, keys) {
  if (!exact(p, keys) || keys.some(k => !source(p[k]))) return fail("missingOrInvalidProvenance");
  const missing = keys.filter(k => p[k].classification === "C");
  return missing.length ? fail("insufficientSourceAuthority", "insufficient", missing) : { status: "ok" };
}
const projected = (version, reference) => ({ classification: "B", scope: "pureFixture", owner: "isolatedVersionedPolicy", reference, version });
function initialCoverPlan(input) {
  try {
    dataOnly(input); Pure.canonicalEncode(input);
    if (!exact(input, ["version", "phase", "receiverId", "position", "assignment", "referenceId", "provenance"]) ||
        input.version !== V.positioning || input.phase !== "beforeExecution" || !id(input.receiverId) ||
        input.receiverId === "player" || input.position !== "1B" || !id(input.referenceId)) return fail("invalidInitialPositionIntent");
    if (!source(input.provenance)) return fail("missingOrInvalidProvenance");
    if (input.provenance.classification === "C") return fail("missingPreexecutionCoverIntent", "insufficient");
    const map = { baseGuard: "baseCovering", firstBaseShade: "nearFirstBase", coverFromInterior: "movingToFirstBase",
      delayedCover: "lateCover", unassigned: "unavailable" };
    if (!own(map, input.assignment)) return fail("unknownDefensiveCoverAssignment");
    return freeze({ status: "ok", plan: { version: V.positioning, context: map[input.assignment], referenceId: input.referenceId,
      receiverId: input.receiverId, phase: input.phase },
      receiverId: input.receiverId, phase: input.phase, input: clone(input), inputDigest: digest(input),
      authority: "NEW_VERSIONED_MODEL", calibration: "uncalibrated", formalProductionAuthority: false });
  } catch (e) { return fail("noncanonicalPositionIntent"); }
}
function adaptNpc(raw, provenance) {
  try {
    dataOnly(raw); dataOnly(provenance); Pure.canonicalEncode(raw);
    if (!source(provenance)) return fail("missingOrInvalidProvenance");
    if (provenance.classification === "C") return fail("missingNpcCapabilitySource", "insufficient");
    if (!exact(raw, ["actorId", "position", "source", "defense", "speed", "arm", "contact"]) || !id(raw.actorId) ||
        raw.actorId === "player" || raw.position !== "1B" || !["team-roster-foundation", "simulation-roster"].includes(raw.source) ||
        ["defense", "speed", "arm", "contact"].some(k => !integer(raw[k], 0, 20))) return fail("invalidNpcSnapshot");
    return freeze({ status: "ok", actorId: raw.actorId, adapterVersion: V.adapter, calibration: "uncalibrated",
      values: { reaction: raw.defense, range: raw.defense, mobility: raw.speed, catching: raw.defense,
        fielding: raw.defense, arm: raw.arm, throwing: raw.arm, decision: Math.floor((raw.defense + raw.contact + 1) / 2) },
      mapping: { reaction: "defenseAlias", range: "defenseAlias", mobility: "NEW_identitySpeedMapping_uncalibrated",
        catching: "NEW_defenseAlias_uncalibrated", fielding: "defenseAlias", arm: "rawArm", throwing: "armAlias", decision: "roundedDefenseContactComposite" },
      provenance: { raw: clone(provenance), conversion: projected(V.adapter, "explicitNpcAliasPolicy") },
      formalProductionAdapter: false });
  } catch (e) { return fail("noncanonicalCapabilityInput"); }
}
function createPin(request) {
  try {
    dataOnly(request); Pure.canonicalEncode(request);
    if (!exact(request, ["version", "scope", "phase", "mode", "identity", "handoff", "routeId", "initialOuts", "bases",
      "receiverRole", "npc", "coverPlan", "competitionLevel", "environmentId", "provenance"])) return fail("invalidPinRequestSchema");
    if (request.version !== V.source) return fail("unsupportedSourceVersion");
    if (request.scope !== "isolatedFixture") return fail("productionSourceAdapterNotIntegrated", "insufficient");
    if (request.phase !== "beforeExecution" || request.mode !== "routine" || !integer(request.initialOuts, 0, 2) ||
        !Array.isArray(request.bases) || request.bases.length !== 3 || request.bases.some(x => x !== null) ||
        !["secureFirstBaseOut", "holdBall"].includes(request.routeId)) return fail("outsideSsEmptyBaseSlice");
    const i = request.identity;
    if (!exact(i, ["playId", "physical", "leg", "thrower", "receiver", "target"]) || !id(i.playId) ||
        Pure.sampleVector(i.physical, "primaryThrow").status !== "ok") return fail("invalidPhysicalIdentity");
    if (!exact(i.leg, ["actionId", "sourceThrowActionId", "physicalSlot", "parentActionId"]) ||
        !id(i.leg.actionId) || !id(i.leg.sourceThrowActionId) || i.leg.actionId === i.leg.sourceThrowActionId ||
        i.leg.physicalSlot !== "primaryThrow" || i.leg.parentActionId !== null) return fail("invalidPrimaryLeg");
    if (!exact(i.thrower, ["actorId", "position"]) || i.thrower.actorId !== "player" || i.thrower.position !== "SS" ||
        !exact(i.receiver, ["actorId", "position"]) || !id(i.receiver.actorId) || i.receiver.actorId === "player" ||
        i.receiver.position !== "1B" || request.receiverRole !== "npc" || request.npc.actorId !== i.receiver.actorId) return fail("invalidSsNpcActor");
    if (!exact(i.target, ["runnerId", "base"]) || !id(i.target.runnerId) || i.target.base !== "first" ||
        [i.thrower.actorId, i.receiver.actorId].includes(i.target.runnerId)) return fail("invalidTargetRunner");
    const handoff = { playId: i.playId, physicalIdentity: i.physical.physicalIdentity, throwerId: i.thrower.actorId,
      receiverId: i.receiver.actorId, runnerId: i.target.runnerId, base: i.target.base };
    if (!equal(request.handoff, handoff)) return fail("handoffIdentityMismatch");
    if (!exact(request.coverPlan, ["version", "context", "referenceId", "receiverId", "phase"]) || request.coverPlan.version !== V.positioning ||
        request.coverPlan.receiverId !== i.receiver.actorId || request.coverPlan.phase !== "beforeExecution" ||
        !own(COVER, request.coverPlan.context) || !id(request.coverPlan.referenceId) ||
        !id(request.competitionLevel) || !id(request.environmentId)) return fail("invalidInitialCoverPolicy");
    const s = sources(request.provenance, ["physicalIdentity", "actors", "capabilities", "coverIntent"]); if (s.status !== "ok") return s;
    const caps = adaptNpc(request.npc, request.provenance.capabilities); if (caps.status !== "ok") return caps;
    const payload = { request: clone(request), versions: V, capabilityAdapter: caps,
      positioningPolicy: { ...COVER[request.coverPlan.context], context: request.coverPlan.context, version: V.positioning,
        phase: "beforeExecution", calibration: "uncalibrated", authority: "NEW_VERSIONED_MODEL", legacyAtBaseConsumed: false } };
    return freeze({ status: "ok", kind: "isolatedReceiverSourcePin", runtimeEnabled: false, ...payload, pinDigest: digest(payload) });
  } catch (e) { return fail("noncanonicalPinRequest"); }
}
function checkPin(pin) {
  dataOnly(pin);
  if (!exact(pin, ["status", "kind", "runtimeEnabled", "request", "versions", "capabilityAdapter", "positioningPolicy", "pinDigest"])) return fail("invalidSourcePin");
  const expected = createPin(pin.request);
  return expected.status === "ok" && equal(pin, expected) ? { status: "ok" } : fail("sourcePinTampered");
}
// Decimal text is required: no binary float multiplication or silent loss of origin.
// Half-away-from-zero quantization to 1000 ticks/CRT, up to six decimal places.
function quantize(decimal) {
  if (typeof decimal !== "string" || !/^-?(0|[1-9][0-9]{0,6})(\.[0-9]{1,6})?$/.test(decimal)) throw Error("invalid CRT decimal");
  const neg = decimal[0] === "-", parts = decimal.replace(/^-/, "").split(".");
  const micros = BigInt(parts[0]) * 1000000n + BigInt((parts[1] || "").padEnd(6, "0"));
  if (neg && micros === 0n) throw Error("negative zero CRT");
  const value = (micros + 500n) / 1000n;
  const result = Number(neg ? -value : value);
  if (!integer(result, -1000000000)) throw Error("CRT outside bounded range");
  return result;
}
function bridgeTiming(timing, physicalIdentity) {
  try {
    dataOnly(timing); Pure.canonicalEncode(timing);
    if (!exact(timing, ["version", "sourceDomain", "physicalIdentity", "originId", "launchOffset", "ballArrival", "runnerArrival", "positioningStart", "provenance"]) ||
        timing.version !== V.bridge || !id(timing.originId) || timing.physicalIdentity !== physicalIdentity) return fail("invalidTimingBridge");
    if (!source(timing.provenance)) return fail("missingOrInvalidProvenance");
    if (timing.provenance.classification === "C") return fail("missingTimingAuthority", "insufficient");
    if (timing.sourceDomain === "legacy-v1-relative") return fail("legacyV1OriginMappingUnapproved", "insufficient");
    if (timing.sourceDomain !== "isolated-common-origin-fixture") return fail("unsupportedTimingDomain");
    function value(t) {
      if (exact(t, ["status", "decimal"]) && t.status === "known") return { status: "known", ticks: quantize(t.decimal) };
      if (exact(t, ["status", "reason"]) && t.status === "unknown" && id(t.reason)) return t;
      throw Error("invalid timestamp");
    }
    const offset = value(timing.launchOffset);
    if (offset.status !== "known") return fail("unknownCommonLaunchOrigin", "insufficient");
    if (offset.ticks < 0) return fail("negativeLaunchOffset");
    const stamp = (t, negative) => {
      const v = value(t), base = { version: V.timing, originId: timing.originId };
      if (v.status === "unknown") return { ...base, status: "unknown", reason: v.reason };
      const ticks = v.ticks - offset.ticks;
      if (!integer(ticks, negative ? -1000000000 : 0)) throw Error("negative or overflowing actor time");
      return { ...base, status: "known", ticks };
    };
    return freeze({ status: "ok", version: V.bridge, sourceDomain: timing.sourceDomain, originId: timing.originId,
      launch: { version: V.timing, originId: timing.originId, status: "known", ticks: 0 },
      ballArrival: stamp(timing.ballArrival, false), runnerArrival: stamp(timing.runnerArrival, true),
      positioningStart: stamp(timing.positioningStart, false), launchOffsetTicks: offset.ticks,
      quantization: "each source absolute decimal quantized half-away-from-zero, then subtract same quantized launch offset",
      formalLegacyBridge: false });
  } catch (e) { return fail("invalidTimingValue"); }
}
function incoming(pin, fact) {
  dataOnly(fact); Pure.canonicalEncode(fact);
  if (!exact(fact, ["version", "actionId", "canonicalThrowIdentity", "physicalIdentity", "routeId", "throwerId", "receiverId", "targetRunnerId", "targetBase",
    "throwAttempted", "throwQuality", "releaseQuality", "distanceClass", "upstreamActionId", "upstreamStatus"]) || fact.version !== V.delivery) return fail("invalidCanonicalDeliveryView");
  const i = pin.request.identity;
  if (fact.actionId !== i.leg.sourceThrowActionId || !id(fact.canonicalThrowIdentity) || fact.physicalIdentity !== i.physical.physicalIdentity ||
      fact.routeId !== pin.request.routeId || fact.throwerId !== i.thrower.actorId || fact.receiverId !== i.receiver.actorId ||
      fact.targetRunnerId !== i.target.runnerId || fact.targetBase !== i.target.base) return fail("canonicalDeliveryIdentityMismatch");
  if (typeof fact.throwAttempted !== "boolean" || !own(INCOMING, fact.throwQuality) || !id(fact.upstreamActionId) ||
      !["completed", "failed", "notAttempted"].includes(fact.upstreamStatus) || !["ready", "delayedRelease", "none"].includes(fact.releaseQuality) ||
      !["short", "medium", "long"].includes(fact.distanceClass)) return fail("invalidCanonicalDeliveryFacts");
  if (fact.throwAttempted ? fact.upstreamStatus !== "completed" || fact.throwQuality === "notAttempted" || fact.releaseQuality === "none" || pin.request.routeId === "holdBall"
      : fact.throwQuality !== "notAttempted" || fact.releaseQuality !== "none") return fail("canonicalDeliveryDependencyMismatch");
  const p = INCOMING[fact.throwQuality], attempted = fact.throwAttempted;
  const distancePenalty = { short: 0, medium: 250, long: 500 }[fact.distanceClass];
  const demandMilli = attempted && fact.throwQuality !== "offline" ? p.demandMilli + distancePenalty + (fact.releaseQuality === "delayedRelease" ? 250 : 0) : 0;
  return freeze({ status: "ok", version: V.incoming, authority: "NEW_VERSIONED_MODEL", calibration: "uncalibrated",
    canonicalThrowIdentity: fact.canonicalThrowIdentity, throwAttempted: attempted,
    accuracy: !attempted ? "none" : fact.throwQuality === "offline" ? "offline" : fact.throwQuality === "onTarget" ? "onTarget" : "challenging",
    quality: !attempted ? "none" : fact.throwQuality === "onTarget" || fact.throwQuality === "offline" ? "clean" : "challenging",
    demandMilli, cleanDelayTicks: p.cleanDelayTicks, bobbleDelayTicks: attempted ? 800 : 0,
    lateralReachMdu: p.lateralReachMdu, catchable: attempted && fact.throwQuality !== "offline", newThrowRolls: 0 });
}
function prepare(pin, executionSource) {
  try {
    const checked = checkPin(pin); if (checked.status !== "ok") return checked;
    dataOnly(executionSource);
    if (!exact(executionSource, ["version", "pinDigest", "ownedSample", "throwFact", "timing", "touch", "provenance", "effortReference"]) ||
        executionSource.version !== V.source || executionSource.pinDigest !== pin.pinDigest) return fail("executionSourcePinMismatch");
    if (executionSource.ownedSample === null) return fail("ownedSampleNotProduced", "insufficient");
    if (executionSource.ownedSample === null) return fail("ownedSampleNotProduced", "insufficient");
    const sampleHex = Pure.binary64(executionSource.ownedSample);
    Pure.canonicalEncode({ ...executionSource, ownedSample: sampleHex });
    if (executionSource.effortReference !== null) return fail("ordinaryEffortCalibrationUnavailable", "insufficient");
    const s = sources(executionSource.provenance, ["delivery", "timing", "contact"]); if (s.status !== "ok") return s;
    const inc = incoming(pin, executionSource.throwFact); if (inc.status !== "ok") return inc;
    const r = pin.request, i = r.identity, p = pin.positioningPolicy, t = executionSource.touch;
    const times = bridgeTiming(executionSource.timing, i.physical.physicalIdentity); if (times.status !== "ok") return times;
    if (!inc.throwAttempted && times.ballArrival.status !== "unknown") return fail("noDeliveryHasBallArrival");
    if (!exact(t, ["version", "actionId", "attempted", "contact", "legality", "sourceActionId"]) || t.version !== V.touch ||
        t.actionId !== i.leg.actionId + ":touch" || typeof t.attempted !== "boolean" || typeof t.contact !== "boolean" ||
        (!t.attempted && t.contact) || !["eligible", "ineligible", "unknown"].includes(t.legality) || !id(t.sourceActionId)) return fail("invalidPossessionTouchPlan");
    const start = times.positioningStart.status === "known" ? { ...times.positioningStart, ticks: times.positioningStart.ticks + p.startDelayTicks } : times.positioningStart;
    const movementMdu = p.movementMdu + inc.lateralReachMdu;
    const pureInput = { contractVersion: Pure.versions.contract,
      versions: Object.fromEntries(["execution", "adapter", "timing", "sampler", "effort"].map(k => [k, Pure.versions[k]])),
      identity: clone(i), context: { initialOuts: r.initialOuts, originId: times.originId, routeId: r.routeId,
        competitionLevel: r.competitionLevel, environmentId: r.environmentId, receiverAvailable: p.context !== "unavailable" },
      handoff: clone(r.handoff), capabilities: { actorId: i.receiver.actorId, adapterVersion: Pure.versions.adapter, values: clone(pin.capabilityAdapter.values) },
      ownedSample: executionSource.ownedSample,
      delivery: { actionId: i.leg.sourceThrowActionId, upstreamActionId: executionSource.throwFact.upstreamActionId,
        upstreamStatus: executionSource.throwFact.upstreamStatus, status: inc.throwAttempted ? "completed" : "notAttempted",
        accuracy: inc.accuracy, quality: inc.quality, launch: times.launch,
        ballArrival: inc.throwAttempted ? times.ballArrival : { version: V.timing, originId: times.originId, status: "unknown", reason: "noDelivery" } },
      positioning: { actionId: i.leg.actionId + ":position", startContext: movementMdu === 0 ? "atBase" : p.context === "lateCover" ? "lateCover" : "covering",
        movementMdu, startTime: start },
      secure: { actionId: i.leg.actionId, demandMilli: inc.demandMilli, cleanDelayTicks: inc.cleanDelayTicks, bobbleDelayTicks: inc.bobbleDelayTicks },
      contest: { actionId: t.actionId, type: "batterBeforeFirst", attempted: t.attempted, contact: t.contact,
        legality: { status: t.legality, runnerId: i.target.runnerId, base: i.target.base, sourceActionId: t.sourceActionId },
        delayTicks: p.touchDelayTicks, runnerArrival: times.runnerArrival },
      provenance: { physicalIdentity: clone(r.provenance.physicalIdentity), actors: clone(r.provenance.actors),
        capabilities: projected(V.adapter, "versionedNpcAliasSnapshot"), delivery: projected(V.incoming, "canonicalThrowToIncomingModel"),
        positioning: projected(V.positioning, r.coverPlan.referenceId), runnerArrival: projected(V.bridge, "commonOriginFixtureBridge"),
        contest: projected(V.touch, t.sourceActionId) }, effortReference: null, continuation: null };
    const sealed = Pure.seal(pureInput); if (sealed.status !== "ok") return sealed;
    return freeze({ status: "ok", kind: "isolatedSourceAuthorityPrepared", runtimeEnabled: false,
      pinDigest: pin.pinDigest, sourceDigest: digest({ ...executionSource, ownedSample: sampleHex }), versions: V,
      models: { positioning: p, incoming: inc, capabilityAdapter: pin.capabilityAdapter, timing: times,
        touch: { version: V.touch, delayTicks: p.touchDelayTicks, contactSource: clone(executionSource.provenance.contact), authority: "NEW_VERSIONED_MODEL" } },
      sealed, formalProductionAuthority: false, formalSaveAdmission: false });
  } catch (e) { return fail("malformedExecutionSource"); }
}
function evaluate(pin, executionSource) {
  const prepared = prepare(pin, executionSource); if (prepared.status !== "ok") return prepared;
  const execution = Pure.execute(prepared.sealed); if (execution.status !== "ok") return execution;
  const s = execution.stages, times = prepared.models.timing;
  const absent = reason => ({ version: V.timing, originId: times.originId, status: "unknown", reason });
  const timeline = { version: V.timing, originId: times.originId, throwLaunch: times.launch, ballArrival: times.ballArrival,
    positioningCompletion: s.positioning.completion || absent("positioningNotCompleted"),
    receiveAttempt: s.secure.attempted ? times.ballArrival : absent("receiveNotAttempted"),
    secureCompletion: s.secure.secured ? s.secure.completion : absent("noSecuredPossession"),
    baseTouchCompletion: s.contest.completion || absent("noValidatedTouchCompletion"), runnerArrival: times.runnerArrival };
  if (Object.values(timeline).some(t => object(t) && t.status === "known" && !integer(t.ticks, -1000000000))) return fail("modelTimeOutOfRange");
  return freeze({ status: "ok", kind: "isolatedReceiverSourceEvaluation", runtimeEnabled: false, prepared, execution,
    timeline,
    ordinaryEffort: "insufficient", officialError: null, wouldBeAssist: null,
    formalProductionAuthority: false, formalSaveAdmission: false, formalSettlementAdmission: false });
}
module.exports = freeze({ versions: V, runtimeEnabled: false, calibration: "uncalibrated", coverPolicy: COVER,
  incomingPolicy: INCOMING, initialCoverPlan, adaptNpc, createPin, bridgeTiming, quantize, prepare, evaluate });
