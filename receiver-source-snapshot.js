/* Production SOURCE METADATA ONLY. No receiver resolver, RNG, settlement or scoring. */
(function (root, factory) {
  "use strict";
  const rosterOwner = root.TeamRosterFoundation
    || (typeof module === "object" && module.exports && typeof require === "function" ? require("./team-roster-foundation.js") : null);
  const api = factory(rosterOwner); root.ReceiverSourceSnapshot = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Roster) {
  "use strict";
  const V = Object.freeze({ format: "receiver-source-snapshot-format-v1", snapshot: "receiver-source-snapshot-v2-2",
    policy: "ss-empty-source-only-policy-v1", pin: "receiver-production-source-pin-v1",
    execution: "receiver-pure-stages-v2-2", physical: "physical-contact-binding-utf8-v2",
    sampler: "physical-slot-sha256-u32be-utf8-v2", timing: "crt-physical-play-integer-ticks-v2-2",
    adapter: "receiver-production-raw-capability-snapshot-v1", official: "legacy-infield-execution-v1",
    binding: "receiver-legacy-source-binding-v1", saveFormat: "receiver-source-only-save-v1", saveVersion: 16 });
  const own = (o, k) => o !== null && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
  const exact = (o, keys) => o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).length === keys.length && keys.every(k => own(o, k));
  const freeze = o => { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.values(o).forEach(freeze); Object.freeze(o); } return o; };
  function canonical(o, active = new Set()) {
    if (o === null || typeof o === "boolean") return JSON.stringify(o);
    if (typeof o === "string") { for (let i = 0; i < o.length; i++) { const c = o.charCodeAt(i); if (c >= 0xd800 && c <= 0xdbff) { const n = o.charCodeAt(++i); if (!(n >= 0xdc00 && n <= 0xdfff)) throw Error("unpaired surrogate"); } else if (c >= 0xdc00 && c <= 0xdfff) throw Error("unpaired surrogate"); } return JSON.stringify(o); }
    if (typeof o === "number" && Number.isFinite(o) && !Object.is(o, -0)) return JSON.stringify(o);
    if (!o || typeof o !== "object" || active.has(o)) throw Error("non-JSON metadata");
    const proto = Object.getPrototypeOf(o); if (!Array.isArray(o) && proto !== null && Object.getPrototypeOf(proto) !== null) throw Error("nonplain metadata");
    for (const k of Reflect.ownKeys(o)) if (typeof k === "symbol" || !own(Object.getOwnPropertyDescriptor(o, k), "value")) throw Error("metadata accessor");
    active.add(o); let s;
    if (Array.isArray(o)) { if (Object.keys(o).length !== o.length || o.some((_, i) => !own(o, i))) throw Error("sparse metadata"); s = "[" + o.map(x => canonical(x, active)).join(",") + "]"; }
    else s = "{" + Object.keys(o).sort().map(k => JSON.stringify(k) + ":" + canonical(o[k], active)).join(",") + "}";
    active.delete(o); return s;
  }
  const copy = o => JSON.parse(canonical(o)), same = (a, b) => canonical(a) === canonical(b);
  // Consistency checksum only. Every present body/copy and original owner binding is also compared.
  const digest = o => { let n = 2166136261; for (const ch of canonical(o)) { n ^= ch.codePointAt(0); n = Math.imul(n, 16777619); } return "fnv1a32:" + (n >>> 0).toString(16).padStart(8, "0"); };
  const id = s => { if (typeof s !== "string" || !s.length || s.length > 4096 || /[\u0000-\u001f\u007f]/.test(s)) return false; try { canonical(s); return true; } catch (_) { return false; } };
  const reject = reason => { throw Error("Invalid receiver source metadata: " + reason); };
  function assertJson(value, reason) {
    if (value === undefined) reject(reason + " required");
    try { canonical(value); } catch (_) { reject(reason + " non-JSON metadata"); }
  }
  const actor = a => exact(a, ["actorId", "position", "role"]) && id(a.actorId) && ["player", "npc"].includes(a.role);
  const physical = p => exact(p, ["version", "matchId", "plateAppearanceId", "contactId", "physicalIdentity", "playId"]) &&
    p.version === V.physical && [p.matchId, p.plateAppearanceId, p.contactId, p.physicalIdentity, p.playId].every(id);
  const MISSING = ["formationLocationAuthority", "contactGlobalClock", "independentIncomingDemand", "independentSecureDuration", "independentTouchCompletion", "capabilityCalibration", "ordinaryEffortCalibration"];
  function pinFor(snapshot) {
    return freeze({ kind: V.pin, sourceSnapshotVersion: V.snapshot, officialReceiverExecutionVersion: V.official,
      officialExecutionOwner: "existingLegacyOwner", runtimeEnabled: false, phaseAtAdmission: "beforeExecution",
      physicalSlot: "primaryThrow", physical: copy(snapshot.body.physical), snapshotDigest: snapshot.snapshotDigest,
      versionTuple: copy(snapshot.body.versions), pinDigest: digest({ snapshotDigest: snapshot.snapshotDigest, physical: snapshot.body.physical, versions: snapshot.body.versions }) });
  }
  function validatePair(snapshot, pin) {
    assertJson(snapshot, "snapshot"); assertJson(pin, "pin");
    if (!exact(snapshot, ["kind", "body", "snapshotDigest"]) || snapshot.kind !== V.snapshot) reject("snapshot kind/schema");
    const b = snapshot.body;
    if (!exact(b, ["snapshotFormatVersion", "sourcePolicyVersion", "versions", "phaseAtAdmission", "physical", "original", "planned", "capabilitySource", "formation", "completeness", "provenance"]) ||
      b.snapshotFormatVersion !== V.format || b.sourcePolicyVersion !== V.policy || !same(b.versions, V) || b.phaseAtAdmission !== "beforeExecution" || !physical(b.physical)) reject("snapshot versions/physical");
    if (!exact(b.original, ["outs", "bases", "defenseTeam", "thrower", "receiver", "batterRunner", "firstBaseObligation", "topologyVersion"]) ||
      !Number.isInteger(b.original.outs) || b.original.outs < 0 || b.original.outs > 2 || !same(b.original.bases, [null, null, null]) ||
      !["home", "away"].includes(b.original.defenseTeam) || !actor(b.original.thrower) || b.original.thrower.actorId !== "player" || b.original.thrower.position !== "SS" || b.original.thrower.role !== "player" ||
      !actor(b.original.receiver) || b.original.receiver.actorId === "player" || b.original.receiver.position !== "1B" || b.original.receiver.role !== "npc" || !id(b.original.batterRunner) ||
      !exact(b.original.firstBaseObligation, ["runnerId", "base", "forceReason"]) || b.original.firstBaseObligation.runnerId !== b.original.batterRunner || b.original.firstBaseObligation.base !== "first" || !id(b.original.firstBaseObligation.forceReason) ||
      !["regulation-coarse-zones-v1", "regulation-coarse-ground-lanes-v2", "regulation-coarse-ground-lanes-v3"].includes(b.original.topologyVersion)) reject("original actor/runner binding");
    if (!same(b.planned, { physicalSlot: "primaryThrow", receiver: b.original.receiver, target: { runnerId: b.original.batterRunner, base: "first" }, routeAllowlist: ["secureFirstBaseOut", "holdBall"] })) reject("fixed slot/planned intent");
    if (!exact(b.capabilitySource, ["adapterVersion", "thrower", "receiver", "reference"]) || b.capabilitySource.adapterVersion !== V.adapter || !id(b.capabilitySource.reference) ||
      !exact(b.capabilitySource.receiver, ["defense", "speed", "arm", "contact"]) || Object.values(b.capabilitySource.receiver).some(x => x !== null && (!Number.isFinite(x) || x < 0 || x > 20)) || !b.capabilitySource.thrower || typeof b.capabilitySource.thrower !== "object") reject("capability source");
    if (!same(b.formation, { classification: "C", status: "insufficient", reason: "noAuthoritativePreexecutionLocation", nominalPolicyUsed: false }) ||
      !same(b.completeness, { status: "insufficient", missing: MISSING })) reject("unsupported source promotion");
    if (!exact(b.provenance, ["scope", "owner", "physical", "actors", "capabilities", "formation", "timing"]) || b.provenance.scope !== "productionSourceMetadata" || b.provenance.owner !== "ensureHighSchoolOrdinaryGroundBallInPlayHandoff" ||
      !same(b.provenance.physical, { classification: "A", reference: b.physical.physicalIdentity }) || !same(b.provenance.actors, { classification: "A", reference: b.original.defenseTeam }) ||
      !same(b.provenance.capabilities, { classification: "A_OR_C_RAW_ONLY", reference: b.capabilitySource.reference }) || b.provenance.formation !== "C" || b.provenance.timing !== "C") reject("source provenance");
    if (snapshot.snapshotDigest !== digest(b) || !same(pin, pinFor(snapshot))) reject("snapshot/pin consistency");
    return true;
  }
  function createSnapshot(input) {
    canonical(input);
    if (!exact(input, ["physical", "original", "capabilitySource", "beforeExecution"]) || input.beforeExecution !== true) reject("admission must precede execution");
    const body = { snapshotFormatVersion: V.format, sourcePolicyVersion: V.policy, versions: copy(V), phaseAtAdmission: "beforeExecution",
      physical: copy(input.physical), original: copy(input.original),
      planned: { physicalSlot: "primaryThrow", receiver: copy(input.original.receiver), target: { runnerId: input.original.batterRunner, base: "first" }, routeAllowlist: ["secureFirstBaseOut", "holdBall"] },
      capabilitySource: copy(input.capabilitySource), formation: { classification: "C", status: "insufficient", reason: "noAuthoritativePreexecutionLocation", nominalPolicyUsed: false },
      completeness: { status: "insufficient", missing: MISSING.slice() }, provenance: { scope: "productionSourceMetadata", owner: "ensureHighSchoolOrdinaryGroundBallInPlayHandoff",
        physical: { classification: "A", reference: input.physical.physicalIdentity }, actors: { classification: "A", reference: input.original.defenseTeam },
        capabilities: { classification: "A_OR_C_RAW_ONLY", reference: input.capabilitySource.reference }, formation: "C", timing: "C" } };
    const snapshot = freeze({ kind: V.snapshot, body, snapshotDigest: digest(body) }), pin = pinFor(snapshot); validatePair(snapshot, pin);
    return freeze({ formatVersion: V.format, snapshot, pin });
  }
  const STATE_KEYS = ["receiverSourceFormatVersion", "receiverSourceSnapshot", "receiverSourcePin", "receiverSourceExecutionBinding"];
  const presentState = state => STATE_KEYS.some(k => own(state, k));
  function sampleHex(n) { if (!Number.isFinite(n) || n < 0 || n >= 1 || Object.is(n, -0)) reject("original sample");
    const a = new ArrayBuffer(8), v = new DataView(a); v.setFloat64(0, n, false); return Array.from(new Uint8Array(a)).map(x => x.toString(16).padStart(2, "0")).join(""); }
  function executionBinding(state) {
    const e = state.shortstopExecution, s = state.receiverSourceSnapshot; if (!e) return null;
    const thrown = e.decisionThrowState?.throwResolution, selected = e.decisionThrowState?.selection?.route;
    if (!same(e.decisionThrowState, state.decisionThrowState) || !same(e.secureResolution, state.secureResolution) || !same(e.runnerThrowTiming, state.runnerThrowTiming)) reject("original Legacy cache copies");
    const selection = e.decisionThrowState?.selection;
    if (selection && (selection.identity !== `${e.decisionThrowState.opportunity.identity}|select|${e.choice.routeId}` || selection.defenderId !== s.body.original.thrower.actorId)) reject("original selection identity lineage");
    if (thrown && (thrown.version !== "defensive-decision-throw-v1" || thrown.identity !== `${selection?.identity}|throw-v1` || thrown.decisionIdentity !== selection?.identity)) reject("original canonical identity lineage");
    if (!s.body.planned.routeAllowlist.includes(e.choice?.routeId)) reject("executed route outside pinned surface");
    if (thrown && (!id(thrown.identity) || thrown.throwerId !== s.body.original.thrower.actorId || thrown.routeId !== e.choice.routeId ||
      (thrown.throwAttempted ? thrown.receiverId !== s.body.original.receiver.actorId || thrown.targetRunnerId !== s.body.original.batterRunner || thrown.targetBase !== "first"
        : thrown.receiverId !== null || thrown.targetRunnerId !== null || thrown.targetBase !== null || thrown.releaseQuality !== "held"))) reject("actual canonical delivery binding");
    if (selected && selected.routeId !== e.choice.routeId) reject("original selection route");
    return freeze({ version: V.binding, pinDigest: state.receiverSourcePin.pinDigest, snapshotDigest: s.snapshotDigest, physicalIdentity: s.body.physical.physicalIdentity,
      routeId: e.choice.routeId, originalSampleBinary64: sampleHex(e.sample), canonicalSourceId: thrown?.identity || null,
      actualReceiverId: thrown?.receiverId ?? null, actualTarget: { runnerId: thrown?.targetRunnerId ?? null, base: thrown?.targetBase ?? null },
      releaseQuality: thrown?.releaseQuality || "notAttempted", originalExecutionOwner: "existingLegacyOwner", candidateExecutionPerformed: false });
  }
  function assertReference(ref) {
    assertJson(ref, "pin reference");
    if (!exact(ref, ["kind", "sourceSnapshotVersion", "officialReceiverExecutionVersion", "officialExecutionOwner", "runtimeEnabled", "phaseAtAdmission", "physicalSlot", "physical", "snapshotDigest", "versionTuple", "pinDigest"]) ||
      ref.kind !== V.pin || ref.sourceSnapshotVersion !== V.snapshot || ref.officialReceiverExecutionVersion !== V.official || ref.officialExecutionOwner !== "existingLegacyOwner" || ref.runtimeEnabled !== false ||
      ref.phaseAtAdmission !== "beforeExecution" || ref.physicalSlot !== "primaryThrow" || !physical(ref.physical) || !same(ref.versionTuple, V) || typeof ref.snapshotDigest !== "string" || typeof ref.pinDigest !== "string" ||
      ref.pinDigest !== digest({ snapshotDigest: ref.snapshotDigest, physical: ref.physical, versions: ref.versionTuple })) reject("lifecycle pin reference");
    return true;
  }
  function assertBinding(binding, ref) {
    assertJson(binding, "execution binding");
    if (!exact(binding, ["version", "pinDigest", "snapshotDigest", "physicalIdentity", "routeId", "originalSampleBinary64", "canonicalSourceId", "actualReceiverId", "actualTarget", "releaseQuality", "originalExecutionOwner", "candidateExecutionPerformed"]) ||
      binding.version !== V.binding || binding.pinDigest !== ref.pinDigest || binding.snapshotDigest !== ref.snapshotDigest || binding.physicalIdentity !== ref.physical.physicalIdentity ||
      !["secureFirstBaseOut", "holdBall"].includes(binding.routeId) || !/^[0-9a-f]{16}$/.test(binding.originalSampleBinary64) ||
      !exact(binding.actualTarget, ["runnerId", "base"]) || ![binding.canonicalSourceId, binding.actualReceiverId, binding.actualTarget.runnerId].every(x => x === null || id(x)) ||
      ![null, "first"].includes(binding.actualTarget.base) || !id(binding.releaseQuality) || binding.originalExecutionOwner !== "existingLegacyOwner" || binding.candidateExecutionPerformed !== false) reject("execution binding schema/identity");
    const bytes = Uint8Array.from(binding.originalSampleBinary64.match(/../g), x => parseInt(x, 16));
    sampleHex(new DataView(bytes.buffer).getFloat64(0, false));
    return true;
  }
  function currentPhysical(match, state) {
    return { version: V.physical, matchId: match.id, plateAppearanceId: match.ordinaryDefensivePlateAppearanceState?.paIdentity,
      contactId: match.ordinaryDefensivePlateAppearanceState?.battedBallPhysicalTruth?.identity, physicalIdentity: state?.physicalTruth?.identity, playId: state?.identity };
  }
  function assertLifecycle(situation) {
    if (!situation) return true;
    const ref = situation.receiverSourcePin, ctx = situation.contextSnapshot?.receiverSourcePin, exec = situation.executionState?.receiverSourcePin;
    if (!own(situation, "receiverSourcePin") && !own(situation.contextSnapshot, "receiverSourcePin") && !own(situation.executionState, "receiverSourcePin") && !own(situation, "receiverSourceExecutionBinding")) return true;
    assertReference(ref); assertReference(ctx); if (!same(ref, ctx) || situation.sourcePhysicalStateRef !== ref.physical.playId || situation.contextSnapshot.physicalIdentity !== ref.physical.physicalIdentity) reject("lifecycle pin copies");
    if (situation.executionState) { assertReference(exec); if (!same(exec, ref)) reject("execution pin copy"); }
    if (own(situation, "receiverSourceExecutionBinding")) assertBinding(situation.receiverSourceExecutionBinding, ref);
    return true;
  }
  function validateMatch(match) {
    if (!match) return true;
    const state = match.groundBallInPlayState, admission = match.receiverSourceAdmission;
    if ([state, match.activeSituation?.executionState].some(o => ["receiverExecutionVersion", "receiverV2Execution", "receiverModelAdmission"].some(k => own(o, k))) ||
      own(match, "officialReceiverExecutionVersion") && match.officialReceiverExecutionVersion !== V.official || own(match, "receiverExecutionVersion") && match.receiverExecutionVersion !== V.official) reject("actual v2 execution not implemented");
    const any = own(match, "receiverSourceFormatVersion") || own(match, "receiverSourceAdmission") || presentState(state) ||
      own(match.activeSituation, "receiverSourcePin") || own(match.activeSituation, "receiverSourceExecutionBinding") || own(match.activeSituation?.contextSnapshot, "receiverSourcePin") || own(match.activeSituation?.executionState, "receiverSourcePin") || own(match.lastClosedSituationSummary, "receiverSourcePin") || own(match.lastClosedSituationSummary, "receiverSourceExecutionBinding");
    if (!any) return true; // genuine omitted legacy metadata; never build a snapshot here.
    if (match.receiverSourceFormatVersion !== V.format || !exact(admission, ["formatVersion", "snapshot", "pin"]) || admission.formatVersion !== V.format) reject("required match format/admission");
    validatePair(admission.snapshot, admission.pin);
    const b = admission.snapshot.body, current = currentPhysical(match, state);
    const samePlay = physical(current) && same(current, b.physical);
    if (b.physical.matchId !== match.id) reject("match identity");
    if (presentState(state)) {
      if (state.receiverSourceFormatVersion !== V.format || !own(state, "receiverSourceSnapshot") || !own(state, "receiverSourcePin")) reject("required handoff source fields");
      validatePair(state.receiverSourceSnapshot, state.receiverSourcePin);
      if (!same(state.receiverSourceSnapshot, admission.snapshot) || !same(state.receiverSourcePin, admission.pin) || state.identity !== b.physical.playId ||
        !samePlay || state.runnerRealization?.batterRunner?.runnerId !== b.original.batterRunner || state.defensiveAccess?.playerPosition !== "游擊手" ||
        state.firstBaseContext || state.firstBaseExecution || state.thirdBaseExecution) reject("original handoff/actor/physical copies");
      if (!same(state.defensiveAccess?.secureCapabilities, b.capabilitySource.thrower) || state.defensiveAccess?.reachResolution?.identity !== b.capabilitySource.reference) reject("original thrower capability/reference");
      if (!state.settlementApplied && (match.outs !== b.original.outs || !same(match.runners, b.original.bases))) reject("original pre-settlement outs/bases");
      if (!state.settlementApplied) {
        if (!Roster || match.defenseTeam !== b.original.defenseTeam) reject("original defense team/roster owner");
        const roster = match.rosters?.[b.original.defenseTeam], ss = Roster.getCurrentDefender(roster, "SS"), first = Roster.getCurrentDefender(roster, "1B");
        if (ss?.id !== b.original.thrower.actorId || first?.id !== b.original.receiver.actorId) reject("original active roster actors");
        const raw = Object.fromEntries(["defense", "speed", "arm", "contact"].map(k => [k, Number.isFinite(first[k]) ? first[k] : null]));
        if (!same(raw, b.capabilitySource.receiver)) reject("original raw receiver capabilities");
      }
      const pa = match.ordinaryDefensivePlateAppearanceState;
      if (pa?.paIdentity !== b.physical.plateAppearanceId || pa?.battedBallPhysicalTruth?.identity !== b.physical.contactId) reject("original PA/contact");
      const binding = executionBinding(state);
      if (binding !== null) {
        if (!own(state, "receiverSourceExecutionBinding")) reject("required original execution binding");
        assertBinding(state.receiverSourceExecutionBinding, state.receiverSourcePin);
        if (!same(binding, state.receiverSourceExecutionBinding)) reject("required original execution binding");
      }
      if (binding === null && own(state, "receiverSourceExecutionBinding")) reject("pending cannot contain execution binding");
    } else if (state?.identity === b.physical.playId || current.physicalIdentity === b.physical.physicalIdentity) reject("new source handoff cannot omit metadata");
    assertLifecycle(match.activeSituation);
    const active = match.activeSituation;
    if (active?.sourcePhysicalStateRef === b.physical.playId) {
      if (!own(active, "receiverSourcePin")) reject("required active lifecycle pin");
      if (!same(active.receiverSourcePin, admission.pin)) reject("required active lifecycle pin");
      if (active.createdAt?.outs !== b.original.outs || !same(active.createdAt?.bases, b.original.bases)) reject("lifecycle original outs/bases");
      if (samePlay && state?.shortstopExecution) {
        if (!own(active, "receiverSourceExecutionBinding") || !own(state, "receiverSourceExecutionBinding")) reject("required active source binding");
        if (!same(active.receiverSourceExecutionBinding, state.receiverSourceExecutionBinding)) reject("required active source binding");
      }
    }
    const summary = match.lastClosedSituationSummary;
    if (samePlay && state?.settlementApplied && summary?.situationId?.includes(b.physical.playId) && !own(summary, "receiverSourcePin")) reject("closed source pin missing");
    if (own(summary, "receiverSourcePin")) { assertReference(summary.receiverSourcePin);
      const ref = summary.receiverSourcePin, archiveSameAdmission = same(ref.physical, b.physical);
      if (summary.lifecycleState !== "closed" || ref.physical.matchId !== match.id || !summary.situationId?.includes(ref.physical.playId)) reject("closed archive lifecycle/identity");
      if (ref.physical.playId === b.physical.playId && !archiveSameAdmission) reject("closed physical identity");
      if (archiveSameAdmission && !same(ref, admission.pin)) reject("closed pin copy");
      if (archiveSameAdmission && summary.outsBefore !== b.original.outs) reject("closed original outs");
      assertBinding(summary.receiverSourceExecutionBinding, ref);
      // An archive is validated against its own pin. Compare current cache only for the same complete physical play.
      if (archiveSameAdmission && samePlay && state?.shortstopExecution) {
        if (!own(state, "receiverSourceExecutionBinding")) reject("closed execution binding required");
        if (!same(summary.receiverSourceExecutionBinding, state.receiverSourceExecutionBinding)) reject("closed execution binding");
      }
    } else if (own(summary, "receiverSourceExecutionBinding")) reject("closed binding requires pin");
    return true;
  }
  function validateRawSave(saved) {
    if (!saved || typeof saved !== "object") reject("raw save object");
    // Called by the actual Save owner before defaults/merge. No caller history label is accepted.
    if (saved.saveVersion > V.saveVersion) reject("future save format not implemented");
    if (saved.saveVersion === V.saveVersion) {
      if (saved.receiverSourceSaveFormatVersion !== V.saveFormat || !own(saved.highSchoolMatch, "receiverSourceFormatVersion")) reject("new save requires source format");
    } else if (own(saved, "receiverSourceSaveFormatVersion")) reject("source Save envelope cannot downgrade");
    const m = saved.highSchoolMatch;
    if (own(m, "officialReceiverExecutionVersion") && m.officialReceiverExecutionVersion !== V.official || own(m, "receiverExecutionVersion") && m.receiverExecutionVersion !== V.official ||
      ["receiverExecutionVersion", "receiverV2Execution", "receiverModelAdmission"].some(k => own(m?.groundBallInPlayState, k))) reject("actual v2 execution Save not implemented");
    validateMatch(m); return true;
  }
  function serializeSave(player) {
    if (player.saveVersion !== 15 && player.saveVersion !== V.saveVersion) reject("unsupported live source Save version");
    if (own(player, "receiverSourceSaveFormatVersion") && player.receiverSourceSaveFormatVersion !== V.saveFormat) reject("unsupported live source Save format");
    validateMatch(player.highSchoolMatch);
    if (!own(player.highSchoolMatch, "receiverSourceFormatVersion")) {
      // A later match with no source admission is an ordinary Save, not a downgrade of a pinned opportunity.
      const saved = { ...player }; if (saved.saveVersion === V.saveVersion) saved.saveVersion = 15;
      delete saved.receiverSourceSaveFormatVersion; validateRawSave(saved); return JSON.stringify(saved);
    }
    const saved = { ...player, saveVersion: V.saveVersion, receiverSourceSaveFormatVersion: V.saveFormat };
    validateRawSave(saved); return JSON.stringify(saved);
  }
  function observe(match) {
    validateMatch(match);
    const state = match?.groundBallInPlayState;
    if (!presentState(state)) return freeze({ status: "legacyOrIneligible", runtimeEnabled: false, candidateExecutionCalls: 0 });
    const e = state.shortstopExecution, thrown = e?.decisionThrowState?.throwResolution;
    return freeze({ status: "insufficient", sourceIdentityStatus: "validatedOriginalPhysical", actorBindingStatus: "validatedSourceCopies", versionPinStatus: "sourceOnlyLegacyOfficialOwner",
      formationAvailability: "insufficient", ownedSampleAvailability: e ? "originalCacheAvailable" : "notYetProduced",
      canonicalDeliveryAvailability: thrown ? thrown.throwAttempted ? "originalCanonicalAvailable" : "originalHeldNullable" : "notAttemptedOrNotYetProduced",
      crtTouchAvailability: "insufficient", missingReasons: MISSING.slice(), runtimeEnabled: false, candidateExecutionCalls: 0 });
  }
  return freeze({ versions: V, runtimeEnabled: false, createSnapshot, validatePair, validateMatch, assertReference, assertLifecycle, executionBinding,
    validateRawSave, serializeSave, observe, copy, same, digest, canonical });
});
