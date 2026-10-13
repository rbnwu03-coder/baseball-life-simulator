/* Isolated v2.2 pure contract. No Match dispatch, persistence, settlement or scoring. */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory(require("./receiver-execution-v2-foundation.js"));
  else root.ReceiverExecutionV22Foundation = factory(root.ReceiverExecutionV2Foundation);
})(typeof globalThis === "object" ? globalThis : this, function (Codec) {
  "use strict";
  if (!Codec) throw Error("Explicit v2.1 codec dependency required");
  // Only stable encoding/hash/binary64 primitives are reused; no old stage resolver is called.
  const V = Object.freeze({ contract: "receiver-pure-contract-v2-2", execution: "receiver-pure-stages-v2-2",
    physical: "physical-contact-binding-utf8-v2", timing: "crt-physical-play-integer-ticks-v2-2",
    sampler: "physical-slot-sha256-u32be-utf8-v2", adapter: "receiver-explicit-input-v2-2",
    source: "receiver-pure-source-boundary-v2-2", effort: "ordinary-effort-reference-v1", pin: "isolated-receiver-revision-pin-v2-2" });
  const LEGACY = Object.freeze({ ...Codec.versions, source: "receiver-source-authority-isolated-v1", pin: "receiver-admission-timing-contract-v1" });
  const KEYS = Object.keys(V), ABILITIES = ["reaction", "range", "mobility", "catching", "fielding", "arm", "throwing", "decision"];
  const SOURCES = ["identity", "actors", "capabilities", "delivery", "positioning", "timing", "secure", "contest"];
  const TIMES = ["positioningStart", "acquisitionCompletion", "throwLaunch", "ballArrival", "receiveAttempt", "positioningCompletion", "secureCompletion", "baseTouch", "runnerArrival"];
  const BASES = ["first", "second", "third", "home"], POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const obj = o => o !== null && typeof o === "object" && !Array.isArray(o);
  const exact = (o, keys) => obj(o) && Object.keys(o).length === keys.length && keys.every(k => own(o, k));
  const int = (n, lo = 0, hi = 1000000000) => Number.isSafeInteger(n) && !Object.is(n, -0) && n >= lo && n <= hi;
  const freeze = o => { if (o && typeof o === "object") { Object.values(o).forEach(freeze); Object.freeze(o); } return o; };
  const fail = (code, status = "invalid", details = []) => freeze({ status, code, details });
  const clone = o => JSON.parse(Codec.canonicalEncode(o)), same = (a, b) => Codec.canonicalEncode(a) === Codec.canonicalEncode(b);
  const digest = o => Codec.sha256(Codec.canonicalEncode(o));
  function dataOnly(o, active = new Set()) {
    if (o === null || typeof o !== "object") return;
    if (active.has(o)) throw Error("cyclic input"); active.add(o);
    for (const k of Reflect.ownKeys(o)) { const d = Object.getOwnPropertyDescriptor(o, k);
      if (typeof k === "symbol" || !own(d, "value")) throw Error("accessor or symbol"); dataOnly(d.value, active); }
    active.delete(o);
  }
  const guard = fn => (...args) => { try { args.forEach(a => dataOnly(a)); return fn(...args); } catch (e) { return fail("malformedContract", "invalid", [e.message]); } };
  function id(s) {
    if (typeof s !== "string" || s.length < 1 || s.length > 4096 || /[\u0000-\u001f\u007f]/.test(s)) return false;
    try { Codec.canonicalEncode(s); return true; } catch (_) { return false; }
  }
  function physical(p) { return exact(p, ["version", "matchId", "plateAppearanceId", "contactId", "physicalIdentity"]) &&
    p.version === V.physical && [p.matchId, p.plateAppearanceId, p.contactId, p.physicalIdentity].every(id); }
  const actor = a => exact(a, ["actorId", "position", "role"]) && id(a.actorId) && POSITIONS.includes(a.position) && ["player", "npc"].includes(a.role);
  const target = t => exact(t, ["runnerId", "base", "kind"]) && id(t.runnerId) && BASES.includes(t.base) && t.kind === "runner";
  function identity(i) {
    if (!exact(i, ["playId", "physical", "leg", "thrower"]) || !id(i.playId) || !physical(i.physical) || !actor(i.thrower)) return false;
    const l = i.leg; return exact(l, ["actionId", "sourceThrowActionId", "physicalSlot", "parentActionId"]) &&
      [l.actionId, l.sourceThrowActionId].every(id) && l.actionId !== l.sourceThrowActionId && ["primaryThrow", "relayThrow"].includes(l.physicalSlot) &&
      (l.physicalSlot === "primaryThrow" ? l.parentActionId === null : id(l.parentActionId));
  }
  const source = s => exact(s, ["classification", "scope", "owner", "reference", "version"]) && ["A", "B", "C"].includes(s.classification) &&
    ["isolatedFixture", "productionWitness"].includes(s.scope) && [s.owner, s.reference, s.version].every(id);
  function versions(v, pinned = null, phase = "beforeExecution") {
    Codec.canonicalEncode(v);
    if (!exact(v, KEYS)) return fail("missingVersion");
    const entry = [V, LEGACY].find(row => same(row, v));
    if (!entry) return fail("unknownMixedOrIncompatibleVersions");
    if (!["beforeExecution", "pending", "executed", "settled"].includes(phase)) return fail("invalidVersionPhase");
    if (pinned !== null) {
      const check = versions(pinned); if (check.status !== "ok") return check;
      if (!same(pinned, v)) return fail("pinnedVersionChangeForbidden");
    }
    return freeze({ status: "ok", contract: entry.contract, resolver: entry === V ? "v2.2" : "existingV2.1Api", runtimeEnabled: false });
  }
  function sampleVector(p, slot, v = V) {
    Codec.canonicalEncode(p); const check = versions(v); if (check.status !== "ok") return check;
    if (check.resolver !== "v2.2") return fail("useExistingPinnedResolver");
    if (!physical(p)) return fail("invalidPhysicalIdentity");
    if (!["primaryThrow", "relayThrow"].includes(slot)) return fail("unsupportedPhysicalSlot");
    const stages = {};
    for (const stage of ["positioning", "secure", "touch"]) {
      const key = { executionVersion: V.execution, physical: p, physicalSlot: slot, samplerVersion: V.sampler, stage };
      const canonical = Codec.canonicalEncode(key), sha256 = Codec.sha256(canonical), u32 = parseInt(sha256.slice(0, 8), 16);
      stages[stage] = { canonical, sha256, u32, unit: (u32 + 0.5) / 4294967296 };
    }
    return freeze({ status: "ok", samplerVersion: V.sampler, stages });
  }
  // Absolute decimal values are source text, not binary floating-point clocks.
  function micro(s) {
    if (typeof s !== "string" || !/^-?(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/.test(s) || /^-0(?:\.0+)?$/.test(s)) throw Error("strictDecimalRequired");
    const negative = s[0] === "-", parts = (negative ? s.slice(1) : s).split(".");
    return (negative ? -1n : 1n) * (BigInt(parts[0]) * 1000000n + BigInt((parts[1] || "").padEnd(6, "0")));
  }
  function quantize(n) {
    const sign = n < 0n ? -1n : 1n, ticks = sign * ((n * sign + 500n) / 1000n);
    if (ticks < -1000000000n || ticks > 1000000000n) throw Error("relativeClockOverflow"); return Number(ticks);
  }
  const unknown = (originId, reason) => ({ originId, status: "unknown", reason });
  function readTime(t, originId, anchor) {
    if (exact(t, ["originId", "status", "reason"]) && t.originId === originId && t.status === "unknown" && id(t.reason)) return null;
    if (!exact(t, ["originId", "status", "decimal"]) || t.originId !== originId || t.status !== "known") throw Error("invalidTimestampOrOrigin");
    const n = micro(t.decimal) - anchor; quantize(n); return n;
  }
  function stamp(originId, n, reason = "unknownSourceTime") { return n === null ? { version: V.timing, ...unknown(originId, reason) } :
    { version: V.timing, originId, status: "known", ticks: quantize(n), exactMicroOffset: String(n) }; }
  function clock(t, inputMode = false) {
    if (!exact(t, ["version", "sourceDomain", "anchor", "times"]) || t.version !== V.timing) return fail("invalidTimingVersionOrSchema");
    if (t.sourceDomain === "legacy-v1-relative") return fail("legacyOriginMappingUnavailable", "insufficient");
    if (t.sourceDomain !== "physicalContactClock") return fail("unsupportedTimingDomain");
    const a = t.anchor;
    if (!obj(a) || !id(a.originId) || a.version !== "physical-play-contact-anchor-v1" || !physical(a.physical)) return fail("invalidContactAnchor");
    if (exact(a, ["version", "originId", "physical", "status", "reason"]) && a.status === "unknown" && id(a.reason)) return fail("unknownContactAnchor", "insufficient");
    if (!exact(a, ["version", "originId", "physical", "status", "decimal"]) || a.status !== "known") return fail("invalidContactAnchor");
    const anchor = micro(a.decimal);
    if (!exact(t.times, TIMES)) return fail("invalidTimelineSchema");
    const values = Object.fromEntries(TIMES.map(k => [k, readTime(t.times[k], a.originId, anchor)]));
    for (const k of ["acquisitionCompletion", "throwLaunch", "ballArrival", "receiveAttempt", "secureCompletion", "baseTouch"])
      if (values[k] !== null && values[k] < 0n) return fail("actionBeforeContact", "invalid", [k]);
    const pairs = [["acquisitionCompletion", "throwLaunch"], ["throwLaunch", "ballArrival"], ["ballArrival", "receiveAttempt"],
      ["positioningStart", "positioningCompletion"], ["positioningCompletion", "receiveAttempt"], ["receiveAttempt", "secureCompletion"], ["secureCompletion", "baseTouch"]];
    for (const [before, after] of pairs) {
      if (inputMode && before === "positioningCompletion" && after === "receiveAttempt") continue;
      if (values[after] !== null && values[before] === null) return fail("knownTimeWithoutDependency", "invalid", [before, after]);
      if (values[after] !== null && values[before] !== null && values[after] < values[before]) return fail("causalTimeOrderViolation", "invalid", [before, after]);
    }
    return { status: "ok", values, originId: a.originId };
  }
  function validateTimeline(packet) {
    Codec.canonicalEncode(packet);
    if (!exact(packet, ["timing", "deliveryCompleted", "possession", "contact"]) || [packet.deliveryCompleted, packet.possession, packet.contact].some(x => typeof x !== "boolean")) return fail("invalidTimelinePacket");
    const r = clock(packet.timing); if (r.status !== "ok") return r;
    const n = r.values;
    if (n.receiveAttempt !== null && n.positioningCompletion > n.ballArrival) return fail("lateReceiverCannotAttemptSecure");
    if (!packet.deliveryCompleted && ["throwLaunch", "ballArrival", "receiveAttempt", "secureCompletion", "baseTouch"].some(k => n[k] !== null)) return fail("chainWithoutDelivery");
    if (!packet.possession && (n.secureCompletion !== null || n.baseTouch !== null)) return fail("timeWithoutPossession");
    if (!packet.contact && n.baseTouch !== null) return fail("touchWithoutContact");
    const timeline = Object.fromEntries(TIMES.map(k => [k, stamp(r.originId, n[k])]));
    const local = n.throwLaunch === null || n.positioningStart === null ? null : stamp(r.originId, n.positioningStart - n.throwLaunch);
    return freeze({ status: "ok", timeline, launchLocalPositioning: local, authoritativeLocalClock: false, actualRetirements: 0, runtimeEnabled: false });
  }
  function validate(input) {
    // Prevent getters before spreading; binary64 is the one explicit fractional field.
    dataOnly(input);
    const payload = { ...input, ownedSample: input?.ownedSample === null ? null : Codec.binary64(input?.ownedSample) };
    Codec.canonicalEncode(payload);
    if (!exact(input, ["versions", "scope", "identity", "planned", "actual", "handoff", "context", "capabilities", "ownedSample", "timing", "positioning", "secure", "contest", "provenance", "effortReference", "continuation"])) return fail("invalidInputSchema");
    const v = versions(input.versions); if (v.status !== "ok") return v;
    if (v.resolver !== "v2.2") return fail("useExistingPinnedResolver");
    if (!["isolatedFixture", "productionWitness"].includes(input.scope)) return fail("invalidSourceScope");
    const i = input.identity, p = input.planned, d = input.actual, c = input.context;
    if (!identity(i)) return fail("invalidTypedIdentity");
    if (!exact(p, ["receiver", "target"]) || !actor(p.receiver) || !target(p.target) || p.receiver.actorId === i.thrower.actorId ||
      [p.receiver.actorId, i.thrower.actorId].includes(p.target.runnerId)) return fail("invalidPlannedActorOrRunner");
    if (!exact(d, ["actionId", "canonicalSourceId", "upstreamActionId", "upstreamStatus", "status", "receiver", "target", "release", "accuracy", "quality"]) ||
      d.actionId !== i.leg.sourceThrowActionId || !id(d.upstreamActionId) || !["completed", "failed", "notAttempted", "unknown"].includes(d.upstreamStatus) ||
      !["completed", "offline", "acquisitionFailed", "notAttempted", "hold", "unknown"].includes(d.status) || (d.canonicalSourceId !== null && !id(d.canonicalSourceId))) return fail("invalidActualDelivery");
    const delivered = ["completed", "offline"].includes(d.status);
    if (delivered) {
      if (d.upstreamStatus !== "completed" || !actor(d.receiver) || !target(d.target) || !same(d.receiver, p.receiver) || !same(d.target, p.target) ||
        !id(d.canonicalSourceId) || !["readyRelease", "delayedRelease"].includes(d.release) || (d.status === "offline" ? d.accuracy !== "offline" : !["onTarget", "challenging"].includes(d.accuracy)) ||
        !["clean", "challenging"].includes(d.quality) || d.accuracy === "onTarget" && d.quality !== "clean" || d.accuracy === "challenging" && d.quality !== "challenging") return fail("deliveryActorOrStatusMismatch");
      if (input.ownedSample === null) return fail("originalSampleNotAvailable", "insufficient");
    } else if (d.receiver !== null || d.target !== null || d.release !== (d.status === "unknown" ? "unknown" : "held") || d.accuracy !== "none" || d.quality !== "none" ||
      d.status === "acquisitionFailed" && (d.upstreamStatus !== "failed" || d.canonicalSourceId !== null) || d.status === "hold" && d.upstreamStatus !== "completed" ||
      d.status === "notAttempted" && !["completed", "notAttempted"].includes(d.upstreamStatus) || d.status === "unknown" && d.upstreamStatus !== "unknown") return fail("noDeliveryMustRemainNullable");
    if (!same(input.handoff, { identity: i, planned: p, actual: d })) return fail("fullTypedHandoffMismatch");
    if (!exact(c, ["initialOuts", "routeId", "competitionLevel", "environmentId", "receiverAvailable"]) || !int(c.initialOuts, 0, 2) ||
      ![c.routeId, c.competitionLevel, c.environmentId].every(id) || typeof c.receiverAvailable !== "boolean" ||
      c.routeId === "holdBall" && d.status !== "hold" || d.status === "hold" && c.routeId !== "holdBall") return fail("invalidContext");
    const caps = input.capabilities;
    if (!exact(caps, ["actorId", "adapterVersion", "values"]) || caps.actorId !== p.receiver.actorId || caps.adapterVersion !== V.adapter ||
      !exact(caps.values, ABILITIES) || ABILITIES.some(k => !int(caps.values[k], 0, 20))) return fail("invalidCapabilities");
    const b = input.positioning, s = input.secure, t = input.contest;
    if (!exact(b, ["actionId", "startContext", "movementMdu", "preContactAuthorized"]) || !id(b.actionId) ||
      !["atBase", "covering", "lateCover", "distant"].includes(b.startContext) || !int(b.movementMdu, 0, 8) || typeof b.preContactAuthorized !== "boolean" || b.startContext === "atBase" && b.movementMdu !== 0) return fail("invalidPositioning");
    if (!exact(s, ["actionId", "demandMilli", "cleanDelayTicks", "bobbleDelayTicks"]) || s.actionId !== i.leg.actionId || !int(s.demandMilli, 0, 30000) ||
      !int(s.cleanDelayTicks, 0, 1000000) || !int(s.bobbleDelayTicks, 0, 1000000)) return fail("invalidSecure");
    if (!exact(t, ["actionId", "type", "attempted", "contact", "legality", "delayTicks"]) || !id(t.actionId) || !["force", "batterBeforeFirst", "tag"].includes(t.type) ||
      typeof t.attempted !== "boolean" || typeof t.contact !== "boolean" || t.contact && !t.attempted || !int(t.delayTicks, 0, 1000000) ||
      !exact(t.legality, ["status", "target", "sourceActionId"]) || !["eligible", "ineligible", "unknown"].includes(t.legality.status) || !same(t.legality.target, p.target) || !id(t.legality.sourceActionId) ||
      t.type === "batterBeforeFirst" && p.target.base !== "first" || !delivered && (t.attempted || t.contact)) return fail("invalidContestDependency");
    const actions = [d.actionId, b.actionId, s.actionId, t.actionId, d.upstreamActionId]; if (new Set(actions).size !== 5) return fail("duplicateActionIdentity");
    const tm = input.timing;
    if (!obj(tm) || !obj(tm.anchor) || !same(tm.anchor.physical, i.physical)) return fail("clockPhysicalMismatch");
    const timing = clock(tm, true); if (timing.status !== "ok") return timing;
    if (["positioningCompletion", "secureCompletion", "baseTouch"].some(k => timing.values[k] !== null)) return fail("executionOutputMustNotBeInput");
    // receiveAttempt is a planned time for a receivable delivery, NOT proof of actual attempt.
    if (!delivered && ["throwLaunch", "ballArrival", "receiveAttempt"].some(k => timing.values[k] !== null) || d.status === "offline" && timing.values.receiveAttempt !== null) return fail("timeChainWithoutReceivableDelivery");
    // Readiness is computed here, so input's positioningCompletion must stay unknown.
    if (timing.values.positioningStart !== null && timing.values.positioningStart < 0n && !b.preContactAuthorized) return fail("preContactSourceRequired");
    if (!exact(input.provenance, SOURCES) || SOURCES.some(k => !source(input.provenance[k]) || input.provenance[k].scope !== input.scope)) return fail("missingOrInvalidProvenance");
    const gaps = SOURCES.filter(k => input.provenance[k].classification === "C"); if (gaps.length) return fail("insufficientExecutionSources", "insufficient", gaps);
    if (input.effortReference !== null) {
      const e = input.effortReference;
      if (!exact(e, ["version", "status", "position", "competitionLevel", "environmentId", "referenceId", "capabilities", "provenance"]) || e.version !== V.effort ||
        !["calibrated", "uncalibrated"].includes(e.status) || e.position !== p.receiver.position || e.competitionLevel !== c.competitionLevel || e.environmentId !== c.environmentId ||
        !id(e.referenceId) || !exact(e.capabilities, ABILITIES) || ABILITIES.some(k => !int(e.capabilities[k], 0, 20)) || !source(e.provenance)) return fail("invalidEffortReference");
      if (e.status === "calibrated") return fail("unavailableCalibrationAuthority", "insufficient");
    }
    if (i.leg.physicalSlot === "primaryThrow" && input.continuation !== null) return fail("unexpectedContinuation");
    if (i.leg.physicalSlot === "relayThrow") {
      const q = input.continuation;
      if (!exact(q, ["firstRetirement", "pivot", "provenance"]) || !source(q.provenance) || q.provenance.scope !== input.scope) return fail("missingContinuation", "insufficient");
      if (q.provenance.classification === "C") return fail("missingContinuationSource", "insufficient");
      if (!exact(q.firstRetirement, ["status", "actionId", "target", "outsBefore", "outsAfter"]) || !["completed", "failed"].includes(q.firstRetirement.status) ||
        !id(q.firstRetirement.actionId) || !target(q.firstRetirement.target) || !int(q.firstRetirement.outsBefore, 0, 2) || !int(q.firstRetirement.outsAfter, 0, 3) ||
        !exact(q.pivot, ["status", "actorId", "actionId"]) || !["completed", "failed", "notAttempted"].includes(q.pivot.status) || q.pivot.actorId !== i.thrower.actorId || !id(q.pivot.actionId)) return fail("invalidContinuation");
    }
    return freeze({ status: "ok", sourceShapeAccepted: true, formalProductionAuthority: false });
  }
  function sourceBoundary(input) { const check = validate(input); if (check.status !== "ok") return check;
    return input.scope === "isolatedFixture" ? check : fail("productionFormationClockAdapterNotIntegrated", "insufficient"); }
  const payload = i => ({ ...i, ownedSample: i.ownedSample === null ? null : Codec.binary64(i.ownedSample) });
  const cloneInput = i => { const o = clone(payload(i)); o.ownedSample = i.ownedSample; return o; };
  function seal(input) { const check = sourceBoundary(input); if (check.status !== "ok") return check;
    const saved = cloneInput(input); return freeze({ status: "ok", runtimeEnabled: false, input: saved, inputDigest: digest(payload(saved)), samples: sampleVector(saved.identity.physical, saved.identity.leg.physicalSlot) }); }
  const vectorPayload = v => ({ ...v, stages: Object.fromEntries(Object.entries(v.stages).map(([k, s]) => [k, { ...s, unit: Codec.binary64(s.unit) }])) });
  function checkSeal(s) { if (!exact(s, ["status", "runtimeEnabled", "input", "inputDigest", "samples"]) || s.status !== "ok" || s.runtimeEnabled !== false) return fail("invalidSeal");
    const fresh = seal(s.input); if (fresh.status !== "ok") return fresh;
    return s.inputDigest === fresh.inputDigest && same(vectorPayload(s.samples), vectorPayload(fresh.samples)) ? { status: "ok" } : fail("sealedInputOrSampleTampered"); }
  function stage(i, name, status, fields = {}) { return { stage: name, status, identity: clone(i.identity), planned: clone(i.planned),
    actualReceiver: clone(i.actual.receiver), actualTarget: clone(i.actual.target), ...fields }; }
  function relayAllowed(i, prior) {
    if (i.identity.leg.physicalSlot === "primaryThrow") return { status: "ok", allowed: true };
    if (!exact(prior, ["sealed", "execution"]) || prior.sealed?.input?.identity?.leg?.physicalSlot !== "primaryThrow") return fail("missingPriorExecution", "insufficient");
    const fresh = execute(prior.sealed); if (fresh.status !== "ok" || !same(fresh, prior.execution)) return fail("priorExecutionTampered");
    const first = prior.sealed.input, q = i.continuation, r = q.firstRetirement, d = fresh.stages.contest;
    if (!same(i.identity.physical, first.identity.physical) || i.identity.playId !== first.identity.playId || !same(i.timing.anchor, first.timing.anchor) ||
      i.identity.leg.parentActionId !== first.identity.leg.actionId || !same(i.identity.thrower, first.planned.receiver) || r.actionId !== first.contest.actionId ||
      !same(r.target, first.planned.target) || r.outsBefore !== first.context.initialOuts || i.actual.upstreamActionId !== q.pivot.actionId) return fail("relayBindingMismatch");
    const allowed = r.status === "completed" && r.outsAfter === r.outsBefore + 1 && r.outsAfter < 3 && q.pivot.status === "completed" &&
      d.status === "retirementCandidate" && ["force", "batterBeforeFirst"].includes(first.contest.type);
    if (!allowed) return { status: "ok", allowed: false };
    const n = clock(i.timing, true).values;
    if (i.context.initialOuts !== r.outsAfter || n.throwLaunch === null || n.acquisitionCompletion === null ||
      n.acquisitionCompletion < BigInt(d.completion.exactMicroOffset) || n.throwLaunch < BigInt(d.completion.exactMicroOffset)) return fail("relayClockOrOutsMismatch");
    return { status: "ok", allowed: true };
  }
  function rawStages(s, permitted, stopAt = "contest") {
    const i = s.input, n = clock(i.timing, true).values, origin = i.timing.anchor.originId, samples = s.samples.stages, stages = {};
    const st = (name, status, fields) => stage(i, name, status, fields), ts = value => stamp(origin, value), d = i.actual;
    if (!permitted) stages.delivery = st("delivery", "blocked", { actionId: d.actionId });
    else if (!["completed", "offline"].includes(d.status)) stages.delivery = st("delivery", d.status === "unknown" ? "insufficient" : "notAttempted", { actionId: d.actionId, reason: d.status });
    else if (n.throwLaunch === null || n.ballArrival === null) stages.delivery = st("delivery", "insufficient", { actionId: d.actionId, reason: "unknownDeliveryTime" });
    else stages.delivery = st("delivery", d.status, { actionId: d.actionId, launch: ts(n.throwLaunch), ballArrival: ts(n.ballArrival), accuracy: d.accuracy, quality: d.quality });
    if (stopAt === "delivery") return stages;
    const p = i.positioning, caps = i.capabilities.values;
    if (!permitted) stages.positioning = st("positioning", "blocked", { actionId: p.actionId, ready: false });
    else if (!i.context.receiverAvailable) stages.positioning = st("positioning", "unavailable", { actionId: p.actionId, ready: false });
    else if (p.movementMdu * 1000 > 1000 + 400 * caps.range) stages.positioning = st("positioning", "unreachable", { actionId: p.actionId, ready: false });
    else if (n.positioningStart === null) stages.positioning = st("positioning", "insufficient", { actionId: p.actionId, ready: false });
    else {
      const jitter = (samples.positioning.u32 >>> 28) - 8;
      const duration = Math.max(100, 1500 - 60 * caps.reaction + jitter * 10) + Math.ceil(p.movementMdu * 1000000 / (500 + 60 * caps.mobility));
      const completion = n.positioningStart + BigInt(duration) * 1000n;
      const ready = stages.delivery.status === "completed" && completion <= n.ballArrival;
      stages.positioning = st("positioning", stages.delivery.status !== "completed" ? "positionedWithoutReception" : ready ? "ready" : "late",
        { actionId: p.actionId, ready, start: ts(n.positioningStart), completion: ts(completion), durationTicks: duration });
    }
    if (stopAt === "positioning") return stages;
    const secure = i.secure;
    if (stages.delivery.status !== "completed" || !stages.positioning.ready) stages.secure = st("secure", "notAttempted", { actionId: secure.actionId, attempted: false, secured: false, reason: "noReceivableDeliveryOrReadiness" });
    else if (n.receiveAttempt === null) stages.secure = st("secure", "insufficient", { actionId: secure.actionId, attempted: false, secured: false, reason: "unknownReceiveAttemptTime" });
    else {
      const variation = ((samples.secure.u32 >>> 28) - 8) * 125, margin = 650 * caps.catching + 350 * caps.fielding + variation - secure.demandMilli;
      if (margin < 0) stages.secure = st("secure", "failedHands", { actionId: secure.actionId, attempted: true, secured: false, handsMarginMilli: margin, attemptTime: ts(n.receiveAttempt) });
      else { const bobble = margin < 1000, completion = n.receiveAttempt + BigInt(secure.cleanDelayTicks + (bobble ? secure.bobbleDelayTicks : 0)) * 1000n;
        stages.secure = st("secure", bobble ? "bobbleControl" : "cleanControl", { actionId: secure.actionId, attempted: true, secured: true, handsMarginMilli: margin,
          attemptTime: ts(n.receiveAttempt), completion: ts(completion), possession: { actorId: i.planned.receiver.actorId, actionId: secure.actionId, sourceThrowActionId: d.actionId } }); }
    }
    if (stopAt === "secure") return stages;
    const t = i.contest, sc = stages.secure;
    if (!sc.secured || !t.attempted || !t.contact) stages.contest = st("contest", "notAttempted", { actionId: t.actionId, candidate: null, reason: !sc.secured ? "noSecuredPossession" : "noCompletedContact" });
    else if (t.legality.status !== "eligible") stages.contest = st("contest", t.legality.status === "unknown" ? "insufficient" : "ineligible", { actionId: t.actionId, candidate: null });
    else {
      const completion = BigInt(sc.completion.exactMicroOffset) + BigInt(t.delayTicks + (samples.touch.u32 >>> 28)) * 1000n;
      const margin = n.runnerArrival === null ? null : quantize(n.runnerArrival) - quantize(completion);
      const status = margin === null ? "insufficient" : margin > 0 ? "retirementCandidate" : margin === 0 ? "tie" : "alreadySafe";
      stages.contest = st("contest", status, { actionId: t.actionId, completion: ts(completion), runnerArrival: ts(n.runnerArrival), timingMarginTicks: margin,
        candidate: margin > 0 ? { kind: "unappliedRetirementCandidate", target: clone(i.planned.target), actor: clone(i.planned.receiver), actionId: t.actionId,
          possessionActionId: sc.actionId, initialOuts: i.context.initialOuts, wouldBeThirdOut: i.context.initialOuts === 2, legalScoring: "requiresExistingThirdOutOwner" } : null });
    }
    return stages;
  }
  function execute(s, prior = null) { const check = checkSeal(s); if (check.status !== "ok") return check;
    const permitted = relayAllowed(s.input, prior); if (permitted.status !== "ok") return permitted;
    return freeze({ status: "ok", runtimeEnabled: false, inputDigest: s.inputDigest, stages: rawStages(s, permitted.allowed),
      scorerFacts: { status: "insufficientScorerFacts", referenceVersion: V.effort, officialScorerEligibility: "insufficient", officialError: null, wouldBeAssist: null },
      application: { matchStateWrites: 0, gameRecordWrites: 0, rngCallbacks: 0, actualRetirements: 0 } }); }
  function resolveStage(name, s, dependencies, prior = null) { const check = checkSeal(s); if (check.status !== "ok") return check;
    const required = { delivery: [], positioning: ["delivery"], secure: ["delivery", "positioning"], contest: ["delivery", "positioning", "secure"] }[name];
    if (!required || !exact(dependencies, required)) return fail("missingStageDependency");
    const permitted = relayAllowed(s.input, prior); if (permitted.status !== "ok") return permitted;
    const stages = rawStages(s, permitted.allowed, name);
    for (const k of required) if (!same(dependencies[k], stages[k])) return fail("stageDependencyTampered", "invalid", [k]);
    return freeze({ status: "ok", output: stages[name] }); }
  // This pure pin is metadata only; no lifecycle/Save support is implied.
  function createPin(request) { Codec.canonicalEncode(request);
    if (!exact(request, ["versions", "identity", "phase"]) || request.phase !== "beforeExecution" || !identity(request.identity)) return fail("invalidRevisionPinRequest");
    const v = versions(request.versions); if (v.status !== "ok") return v;
    if (v.resolver !== "v2.2") return fail("useExistingPinnedResolver");
    return freeze({ status: "ok", kind: V.pin, runtimeEnabled: false, body: clone(request), pinDigest: digest(request) }); }
  function retainPin(pin, expectedIdentity, requestedVersions, phase) {
    if (!exact(pin, ["status", "kind", "runtimeEnabled", "body", "pinDigest"]) || !same(pin, createPin(pin.body))) return fail("revisionPinTampered");
    if (!identity(expectedIdentity) || !same(pin.body.identity, expectedIdentity)) return fail("pinnedIdentityMismatch");
    const v = versions(requestedVersions, pin.body.versions, phase); if (v.status !== "ok") return v;
    return freeze({ status: "ok", pin: clone(pin), formalLifecycleSupported: false, reselected: false });
  }
  return freeze({ versions: V, versionRegistry: { v2_1: LEGACY, v2_2: V }, runtimeEnabled: false,
    idAccepted: guard(s => ({ status: id(s) ? "ok" : "invalid", limitUtf16CodeUnits: 4096 })),
    validateIdentity: guard(i => ({ status: identity(i) ? "ok" : "invalid" })),
    validateVersions: guard(versions), sampleVector: guard(sampleVector), validateTimeline: guard(validateTimeline),
    validate: guard(validate), sourceBoundary: guard(sourceBoundary), seal: guard(seal), execute: guard(execute),
    createPin: guard(createPin), retainPin: guard(retainPin), resolveStage: guard(resolveStage),
    canonicalEncode: Codec.canonicalEncode, sha256: Codec.sha256, binary64: Codec.binary64 });
});
