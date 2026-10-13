"use strict";
// Design-only adapters. Never register in Match, never create a completed S8 input.
const Pure = require("./receiver-execution-v2-foundation.js");
const Roster = require("./team-roster-foundation.js");
const V = Object.freeze({ adapter: "receiver-production-source-adapter-proposal-v1", observation: "receiver-source-observation-v1",
  physical: "physical-contact-binding-utf8-v2", formation: "npc1b-contact-cover-plan-proposal-v1",
  timing: "crt-physical-play-integer-ticks-v2-2", origin: "physical-play-contact-anchor-v1" });
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const object = o => o !== null && typeof o === "object" && !Array.isArray(o);
const exact = (o, keys) => object(o) && Object.keys(o).length === keys.length && keys.every(k => own(o, k));
const freeze = o => { if (o && typeof o === "object") { Object.values(o).forEach(freeze); Object.freeze(o); } return o; };
const fail = (code, status = "invalid", details = []) => freeze({ status, code, details, runtimeEnabled: false });
function dataOnly(value, active = new Set()) {
  if (value === null || ["string", "boolean"].includes(typeof value)) return;
  if (typeof value === "number") { if (!Number.isFinite(value)) throw Error("nonfinite source number"); return; }
  if (!value || typeof value !== "object" || active.has(value)) throw Error("unsupported source value");
  const proto = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && proto !== null && Object.getPrototypeOf(proto) !== null) throw Error("nonplain source");
  active.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !own(d, "value")) throw Error("source accessor");
    if (Array.isArray(value) && key === "length") continue;
    dataOnly(d.value, active);
  }
  if (Array.isArray(value) && Object.keys(value).length !== value.length) throw Error("sparse source array");
  active.delete(value);
}
function textId(value) { return typeof value === "string" && value.length > 0 && value.length <= 4096 && !/[\u0000-\u001f\u007f]/.test(value); }
const clone = o => JSON.parse(JSON.stringify(o));
function wire(v) {
  if (v === null) return ["null"];
  if (typeof v === "number") { const b = new ArrayBuffer(8); new DataView(b).setFloat64(0, v, false); return ["binary64", Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, "0")).join("")]; }
  if (["string", "boolean"].includes(typeof v)) return [typeof v, v];
  if (Array.isArray(v)) return ["array", v.map(wire)];
  return ["object", Object.keys(v).sort().map(k => [k, wire(v[k])])];
}
const digest = v => Pure.sha256(Pure.canonicalEncode(wire(v)));
function proposedBinding(view) {
  const m = view.match, h = m.groundBallInPlayState, pa = m.ordinaryDefensivePlateAppearanceState;
  if (!m.id || !h?.supported || h.physicalTruth?.version !== "batted-ball-physical-v1" || h.physicalTruth.ballType !== "groundBall") return fail("unsupportedOriginalPhysicalSource");
  if (![m.id, pa?.paIdentity, h.identity, h.physicalTruth.identity].every(textId) ||
      pa.battedBallPhysicalTruth?.identity !== h.physicalTruth.identity || view.opportunity?.physicalIdentity !== h.physicalTruth.identity) return fail("physicalSourceCopyMismatch");
  // Strings are kept byte-for-byte, including the original Unicode half-inning.
  return { status: "ok", raw: { matchId: m.id, plateAppearanceId: pa.paIdentity, contactId: h.physicalTruth.identity,
    physicalIdentity: h.physicalTruth.identity, playId: h.identity },
    proposed: { version: V.physical, matchId: m.id, plateAppearanceId: pa.paIdentity,
      contactId: h.physicalTruth.identity, physicalIdentity: h.physicalTruth.identity } };
}
function observe(view, prior = null) {
  try {
    dataOnly(view); dataOnly(prior);
    if (!exact(view, ["scope", "phase", "requestedRouteId", "match", "opportunity", "observedOwnedSamples"]) ||
        view.scope !== "productionSourceObservation" || !["beforeExecution", "postExecution"].includes(view.phase) ||
        !Array.isArray(view.observedOwnedSamples) ||
        !["secureFirstBaseOut", "holdBall"].includes(view.requestedRouteId)) return fail("invalidObservationEnvelope");
    const binding = proposedBinding(view); if (binding.status !== "ok") return binding;
    Pure.canonicalEncode(binding.proposed); // Also rejects malformed Unicode.
    const m = view.match, h = m.groundBallInPlayState, pa = m.ordinaryDefensivePlateAppearanceState;
    const context = m.defensiveSituation;
    if (!context || ![0, 1, 2].includes(context.outs) || !Array.isArray(context.runners) || context.runners.length !== 3 || context.runners.some(Boolean) ||
        context.batterId !== pa.batterId || pa.context?.outs !== context.outs) return fail("outsideOriginalEmptyBaseSlice");
    const runner = h.runnerPhysicalStates?.find(r => r.runnerId === pa.batterId);
    if (!runner || runner.originBase !== "batter" || runner.targetBase !== "first" || runner.isForced !== true ||
        h.forceChain?.batterRunner?.runnerId !== runner.runnerId || h.forceChain.sourceBaseState.some(Boolean)) return fail("originalRunnerObligationMismatch");
    let anchor;
    if (view.phase === "beforeExecution") {
      if (h.shortstopExecution || h.secureResolution || h.decisionThrowState || h.runnerThrowTiming ||
          view.observedOwnedSamples.length || m.activeSituation?.lifecycleState === "executing") return fail("beforeSnapshotHasExecutionOrSample");
      if (m.currentBatter !== pa.batterId) return fail("beforeSnapshotBatterMismatch");
      const roster = m.rosters?.[m.defenseTeam], ss = Roster.getCurrentDefender(roster, "SS"), npc = Roster.getCurrentDefender(roster, "1B");
      if (!ss || ss.id !== "player" || !npc || npc.id === "player" || view.opportunity.primaryPosition !== "SS" ||
          view.opportunity.primaryDefenderId !== ss.id || context.teammates?.firstBaseReceiver?.id !== npc.id) return fail("rosterActorHandoffMismatch");
      const legal = m.activeSituation?.legalRoutes || [];
      if (!legal.some(r => r.routeId === view.requestedRouteId && r.legal === true)) return fail("requestedRouteNotOriginallyLegal");
      const body = { version: V.observation, rawBindings: binding.raw, proposedPhysical: binding.proposed, physicalSlot: "primaryThrow",
        initialOuts: context.outs, initialBases: clone(context.runners), runner: clone(runner), ssActor: clone(ss), npcActor: clone(npc),
        originalDefenseTeam: m.defenseTeam, rosterDigest: digest(roster), legalRoutes: legal.map(r => r.routeId),
        sourcePhase: "beforeExecution", sourceScope: "originalLegacyOwnerInIsolatedFixture", formationSnapshot: null };
      anchor = { kind: "detachedPreExecutionSourceObservation", body, digest: digest(body) };
    } else {
      if (!exact(prior, ["kind", "body", "digest"]) || prior.kind !== "detachedPreExecutionSourceObservation" ||
          digest(prior.body) !== prior.digest) return fail("originalPreExecutionAnchorRequired", "insufficient");
      if (digest(prior.body.rawBindings) !== digest(binding.raw) || prior.body.runner.runnerId !== runner.runnerId ||
          prior.body.initialOuts !== context.outs) return fail("postExecutionOriginalAnchorMismatch");
      anchor = clone(prior);
    }
    const cache = h.shortstopExecution;
    let delivery = null, sample = null;
    if (view.phase === "postExecution") {
      if (!cache || !Number.isFinite(cache.sample) || cache.sample < 0 || cache.sample >= 1) return fail("originalExecutionCacheRequired", "insufficient");
      const actions = cache.resolution?.actionFacts?.actions;
      const throwAction = actions?.find(a => a.type === "throw" && a.actorId === anchor.body.ssActor.id);
      if (!throwAction || throwAction.physicalIdentity !== binding.raw.physicalIdentity || !textId(throwAction.identity)) return fail("originalThrowActionLinkMissing", "insufficient");
      if (!object(throwAction.provenance) || !textId(throwAction.provenance.authority)) return fail("missingOriginalActionProvenance", "insufficient");
      if (throwAction.provenance.sample !== cache.sample) return fail("originalExecutionSampleCopyMismatch");
      if (throwAction.receiverId !== anchor.body.npcActor.id || throwAction.targetBase !== "first") return fail("throwActionActorTargetMismatch");
      const t = cache.decisionThrowState?.throwResolution;
      if (cache.choice.routeId !== view.requestedRouteId) return fail("postExecutionRouteMismatch");
      if (t && (t.throwerId !== anchor.body.ssActor.id || !textId(t.identity))) return fail("canonicalThrowOwnerMismatch");
      const selected = cache.decisionThrowState?.selection;
      if (t && (t.version !== "defensive-decision-throw-v1" || t.routeId !== cache.choice.routeId ||
          !selected || t.decisionIdentity !== selected.identity || t.identity !== selected.identity + "|throw-v1")) return fail("canonicalSelectionCopyMismatch");
      if (!t && throwAction.status === "completed") return fail("completedActionWithoutCanonicalThrow");
      if (t?.throwAttempted && (t.receiverId !== anchor.body.npcActor.id || t.targetRunnerId !== runner.runnerId || t.targetBase !== "first" || t.receiverPosition !== "1B")) return fail("canonicalThrowActorTargetMismatch");
      if (view.requestedRouteId === "holdBall" && (!t || t.throwAttempted !== false || t.receiverId !== null || t.targetRunnerId !== null || t.targetBase !== null)) return fail("holdCanonicalTargetMustRemainNull");
      sample = { value: cache.sample, binary64: Pure.binary64(cache.sample), source: "shortstopExecution.sample", callbackNotInvokedByAdapter: true };
      delivery = { classification: "A", canonicalThrow: t ? clone(t) : null, originalThrowActionId: throwAction.identity,
        originalActionProvenance: clone(throwAction.provenance),
        actionPhysicalIdentity: throwAction.physicalIdentity, plannedReceiverId: anchor.body.npcActor.id, plannedTarget: { runnerId: runner.runnerId, base: "first" },
        actualDeliveryReceiverId: t?.receiverId ?? null, actualDeliveryTarget: t ? { runnerId: t.targetRunnerId, base: t.targetBase } : null,
        status: !t?.throwAttempted ? "notAttempted" : t.throwQuality === "offline" ? "offline" : "completed",
        canonicalSourceAbsentReason: t ? null : "acquisitionDidNotCreateCanonicalThrow", legacyReceiverOutcomeConsumed: false };
    }
    const oldPhysical = { ...binding.proposed, version: Pure.versions.physical };
    const pureCompatibility = Pure.sampleVector(oldPhysical, "primaryThrow");
    const missing = ["preExecutionFormationPolicyAuthority", "fixedSlotAndVersionPinInProduction", "commonPhysicalClockOrigin", "independentSecureDemandAndDuration",
      "independentPossessionTouchTime", "capabilityCoefficientCalibration", "runtimeLifecycleAndSaveGuard"];
    const rawNpc = {}, attributeSources = {};
    for (const key of ["defense", "speed", "arm", "contact"]) {
      const value = anchor.body.npcActor[key], available = typeof value === "number" && Number.isFinite(value);
      rawNpc[key] = available ? value : null; attributeSources[key] = available ? "A" : "C";
      if (!available) missing.push("npcRawAttribute:" + key);
    }
    if (pureCompatibility.status !== "ok") missing.push("currentPureAsciiIdentityContract");
    return freeze({ status: "insufficient", code: "productionSourceCompletenessBlocked", runtimeEnabled: false,
      observationPhase: view.phase, sourceSnapshotDigest: digest(view), anchor, binding: binding.proposed,
      rawBindings: binding.raw, fixedSlot: { value: "primaryThrow", classification: "B_PROPOSED_MAPPING", formallyPinned: false },
      originalSample: sample, delivery, rawNpcCapabilities: { ...rawNpc, attributeSources, scope: "originalActiveRosterObservation" },
      timingSource: { status: "insufficient", reason: "v1HasNoApprovedCommonLaunchOrigin", legacyVersion: h.runnerThrowTiming?.version || null,
        originalRunnerRelativeArrival: h.runnerThrowTiming?.runnerArrival?.relativeArrival ?? null,
        originalBallRelativeArrival: h.runnerThrowTiming?.ballArrival?.relativeArrival ?? null, receiverCompletionConsumed: false },
      pureCompatibility: { status: pureCompatibility.status, code: pureCompatibility.code || null, acceptedNewPhysicalVersion: false },
      missingFacts: missing, sealedCandidateInput: null, candidateExecutionCalls: 0, formalProductionAuthority: false,
      writes: { match: 0, record: 0, evaluation: 0, rng: 0 } });
  } catch (e) { return fail("malformedProductionObservation", "invalid", [String(e.message)]); }
}
function formation(request) {
  try {
    dataOnly(request); Pure.canonicalEncode(request);
    if (!exact(request, ["scope", "phase", "version", "physical", "receiverId", "assignment"]) || request.scope !== "isolatedFixture" ||
        request.phase !== "beforeExecution" || request.version !== V.formation || request.physical?.version !== V.physical ||
        ![request.physical.matchId, request.physical.plateAppearanceId, request.physical.contactId, request.physical.physicalIdentity, request.receiverId].every(textId)) return fail("invalidFormationProposalInput");
    const map = { baseGuard: "baseCovering", firstBaseShade: "nearFirstBase", coverFromInterior: "movingToFirstBase", delayedCover: "lateCover", unassigned: "unavailable" };
    if (!own(map, request.assignment)) return fail("unknownFormationIntent", "insufficient");
    const key = { version: V.formation, physical: request.physical, physicalSlot: "primaryThrow", namespace: "initialFormation" };
    return freeze({ status: "ok", version: V.formation, authority: "NEW_PROPOSED_MODEL_NOT_EXISTING_A", scope: request.scope,
      context: map[request.assignment], receiverId: request.receiverId, formationSeed: Pure.sha256(Pure.canonicalEncode(key)),
      intentDigest: digest(request), request: clone(request), rngCallbacks: 0, formalProductionAuthority: false });
  } catch (e) { return fail("malformedFormationProposal"); }
}
function checkFormation(saved, expectedRequest) {
  try { dataOnly(saved); const fresh = formation(expectedRequest); return fresh.status === "ok" && digest(fresh) === digest(saved)
    ? freeze({ status: "ok", reselected: false }) : fail("frozenFormationBindingMismatch"); } catch (e) { return fail("malformedFrozenFormation"); }
}
function micro(decimal) {
  if (typeof decimal !== "string" || !/^-?(0|[1-9][0-9]{0,8})(\.[0-9]{1,6})?$/.test(decimal)) throw Error("invalid strict decimal CRT");
  const negative = decimal[0] === "-", parts = decimal.replace(/^-/, "").split(".");
  const n = BigInt(parts[0]) * 1000000n + BigInt((parts[1] || "").padEnd(6, "0"));
  if (negative && n === 0n) throw Error("negative zero"); return negative ? -n : n;
}
function roundTicks(n) { const ticks = Number((n < 0n ? -1n : 1n) * ((n < 0n ? -n : n) + 500n) / 1000n);
  if (!Number.isSafeInteger(ticks) || Math.abs(ticks) > 1000000000) throw Error("timing overflow"); return ticks; }
function timing(request) {
  try {
    dataOnly(request); Pure.canonicalEncode(request);
    if (!exact(request, ["scope", "version", "sourceDomain", "origin", "physicalIdentity", "times", "possession", "contact", "legality"]) ||
        request.scope !== "isolatedFixture" || request.version !== V.timing || !textId(request.physicalIdentity)) return fail("invalidTimingProposalInput");
    if (request.sourceDomain === "legacy-v1-relative") return fail("legacyOriginMappingUnapproved", "insufficient");
    if (request.sourceDomain !== "proposedPhysicalClock") return fail("unsupportedTimingDomain");
    const o = request.origin;
    if (!exact(o, ["version", "originId", "physicalIdentity", "status", "decimal"]) || o.version !== V.origin ||
        !textId(o.originId) || o.physicalIdentity !== request.physicalIdentity) return fail("invalidPhysicalOriginBinding");
    if (o.status === "unknown") return fail("unknownPhysicalOrigin", "insufficient");
    if (o.status !== "known") return fail("invalidOriginStatus");
    const anchor = micro(o.decimal), keys = ["throwLaunch", "ballArrival", "positioningStart", "positioningCompletion", "receiveAttempt", "secureCompletion", "baseTouchCompletion", "runnerArrival"];
    if (!exact(request.times, keys) || typeof request.possession !== "boolean" || typeof request.contact !== "boolean" ||
        !["eligible", "ineligible", "unknown"].includes(request.legality)) return fail("invalidTimelineSchema");
    const exactTimes = {}, stamps = {};
    for (const key of keys) {
      const t = request.times[key];
      if (exact(t, ["status", "reason"]) && t.status === "unknown" && textId(t.reason)) { exactTimes[key] = null; stamps[key] = { version: V.timing, originId: o.originId, status: "unknown", reason: t.reason }; }
      else if (exact(t, ["status", "decimal"]) && t.status === "known") { exactTimes[key] = micro(t.decimal) - anchor;
        stamps[key] = { version: V.timing, originId: o.originId, status: "known", ticks: roundTicks(exactTimes[key]) }; }
      else return fail("invalidTimestamp");
    }
    const known = key => exactTimes[key] !== null;
    if (known("throwLaunch") && exactTimes.throwLaunch < 0n) return fail("launchBeforePhysicalContact");
    for (const [before, after] of [["throwLaunch", "ballArrival"], ["positioningStart", "positioningCompletion"], ["ballArrival", "receiveAttempt"],
      ["positioningCompletion", "receiveAttempt"], ["receiveAttempt", "secureCompletion"], ["secureCompletion", "baseTouchCompletion"]]) {
      if (known(after) && !known(before)) return fail("missingCausalTimeDependency", "insufficient", [before, after]);
      if (known(before) && known(after) && exactTimes[after] < exactTimes[before]) return fail("causalTimeOrderViolation", "invalid", [before, after]);
    }
    if (!request.possession && (known("secureCompletion") || known("baseTouchCompletion"))) return fail("completionWithoutPossession");
    if (known("receiveAttempt") && exactTimes.positioningCompletion > exactTimes.ballArrival) return fail("lateReceiverCannotAttemptSecure");
    if (known("receiveAttempt") && exactTimes.receiveAttempt !== exactTimes.ballArrival) return fail("receiveAttemptMustMatchBallArrival");
    if (!request.contact && known("baseTouchCompletion")) return fail("touchTimeWithoutContact");
    const comparable = request.possession && request.contact && request.legality === "eligible" && known("baseTouchCompletion") && known("runnerArrival");
    const margin = comparable ? stamps.runnerArrival.ticks - stamps.baseTouchCompletion.ticks : null;
    const launch = exactTimes.throwLaunch;
    const localProjection = Object.fromEntries(keys.map(key => [key, launch !== null && exactTimes[key] !== null
      ? { status: "known", ticks: roundTicks(exactTimes[key] - launch), relativeTo: "firstThrowLaunch", authoritativeClock: false }
      : { status: "unknown", reason: "missingLaunchOrTimestamp", authoritativeClock: false }]));
    return freeze({ status: "ok", kind: "unappliedPhysicalClockDesignDiagnostic", version: V.timing, origin: clone(o), timeline: stamps,
      firstThrowLocalProjection: localProjection, timingMarginTicks: margin, relation: margin === null ? "insufficient" : margin > 0 ? "defenseBeforeRunner" : margin === 0 ? "tie" : "alreadySafe",
      rounding: "exact decimal origin subtraction before half-away-from-zero to integer ticks", perRelativeTimestampErrorBoundTicks: "0.5",
      actualRetirements: 0, formalSettlementAdmission: false, formalScoringAdmission: false, runtimeEnabled: false });
  } catch (e) { return fail("malformedTimingProposal", "invalid", [String(e.message)]); }
}
module.exports = freeze({ versions: V, runtimeEnabled: false, observe, formation, checkFormation, timing });
