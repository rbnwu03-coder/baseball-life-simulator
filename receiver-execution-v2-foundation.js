/* Receiver v2 PURE CONTRACT ONLY. No runtime registration, persistence or scoring. */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ReceiverExecutionV2Foundation = factory();
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const V = Object.freeze({
    contract: "receiver-pure-contract-v2-1", execution: "receiver-pure-stages-v2-1",
    adapter: "receiver-explicit-input-v1", timing: "crt-integer-ticks-v2-1",
    sampler: "physical-slot-sha256-u32be-v1", effort: "ordinary-effort-reference-v1",
    physical: "physical-contact-binding-v1"
  });
  const POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];
  const BASES = ["first", "second", "third", "home"];
  const ABILITIES = ["reaction", "range", "mobility", "catching", "fielding", "arm", "throwing", "decision"];
  const SOURCES = ["physicalIdentity", "actors", "capabilities", "delivery", "positioning", "runnerArrival", "contest"];
  const STAGES = ["positioning", "secure", "touch"];
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = o => o !== null && typeof o === "object" && !Array.isArray(o);
  const id = s => typeof s === "string" && /^[A-Za-z0-9_.:|/\-]{1,512}$/.test(s);
  const integer = (n, low = 0, high = 1000000000) => Number.isSafeInteger(n) && !Object.is(n, -0) && n >= low && n <= high;
  const freeze = o => { if (o && typeof o === "object") { Object.values(o).forEach(freeze); Object.freeze(o); } return o; };
  function reject(code, details = [], status = "invalid") { return freeze({ status, code, details }); }
  function exact(o, keys) { return object(o) && Object.keys(o).length === keys.length && keys.every(k => own(o, k)); }
  function unicode(s) {
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff) { const next = s.charCodeAt(++i); if (!(next >= 0xdc00 && next <= 0xdfff)) throw Error("unpaired surrogate"); }
      else if (c >= 0xdc00 && c <= 0xdfff) throw Error("unpaired surrogate");
    }
    return s;
  }
  // Canonical JSON subset: scalar strings/booleans/null and safe integers only.
  // Fractional samples are encoded by a separate exact binary64 representation.
  function encode(value) {
    const active = new Set();
    function visit(v) {
      if (v === null || typeof v === "boolean") return JSON.stringify(v);
      if (typeof v === "string") return JSON.stringify(unicode(v));
      if (typeof v === "number") { if (!Number.isSafeInteger(v) || Object.is(v, -0)) throw Error("noncanonical number"); return String(v); }
      if (!v || typeof v !== "object" || active.has(v)) throw Error("noncanonical JSON");
      const proto = Object.getPrototypeOf(v);
      if (!Array.isArray(v) && proto !== null && Object.getPrototypeOf(proto) !== null) throw Error("nonplain object");
      if (Object.getOwnPropertySymbols(v).length) throw Error("symbol key");
      for (const key of Object.keys(v)) if (!own(Object.getOwnPropertyDescriptor(v, key), "value")) throw Error("accessor");
      active.add(v);
      let result;
      if (Array.isArray(v)) {
        if (Object.keys(v).length !== v.length || Array.from({ length: v.length }, (_, i) => i).some(i => !own(v, i))) throw Error("sparse array");
        result = "[" + v.map(visit).join(",") + "]";
      } else result = "{" + Object.keys(v).sort().map(k => JSON.stringify(unicode(k)) + ":" + visit(v[k])).join(",") + "}";
      active.delete(v); return result;
    }
    return visit(value);
  }
  function utf8(text) {
    unicode(text); const bytes = [];
    for (const ch of text) {
      const c = ch.codePointAt(0);
      if (c < 128) bytes.push(c);
      else if (c < 2048) bytes.push(192 | c >> 6, 128 | c & 63);
      else if (c < 65536) bytes.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
      else bytes.push(240 | c >> 18, 128 | c >> 12 & 63, 128 | c >> 6 & 63, 128 | c & 63);
    }
    return bytes;
  }
  // Portable SHA-256: unsigned 32-bit words, FIPS 180-4 constants, UTF-8 bytes.
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function sha256(text) {
    const bytes = utf8(text), bitLength = bytes.length * 8;
    bytes.push(128); while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(bitLength / 4294967296), lo = bitLength >>> 0;
    for (const word of [hi, lo]) for (let shift = 24; shift >= 0; shift -= 8) bytes.push(word >>> shift & 255);
    const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const rotr = (v, n) => v >>> n | v << 32 - n;
    for (let offset = 0; offset < bytes.length; offset += 64) {
      const w = new Array(64);
      for (let j = 0; j < 16; j++) { const p = offset + j * 4; w[j] = (bytes[p] << 24 | bytes[p+1] << 16 | bytes[p+2] << 8 | bytes[p+3]) >>> 0; }
      for (let j = 16; j < 64; j++) {
        const a = w[j-15], b = w[j-2];
        w[j] = (w[j-16] + (rotr(a,7)^rotr(a,18)^a>>>3) + w[j-7] + (rotr(b,17)^rotr(b,19)^b>>>10)) >>> 0;
      }
      let [a,b,c,d,e,f,g,q] = h;
      for (let j = 0; j < 64; j++) {
        const t1 = (q + (rotr(e,6)^rotr(e,11)^rotr(e,25)) + (e&f ^ ~e&g) + K[j] + w[j]) >>> 0;
        const t2 = ((rotr(a,2)^rotr(a,13)^rotr(a,22)) + (a&b ^ a&c ^ b&c)) >>> 0;
        q=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
      }
      [a,b,c,d,e,f,g,q].forEach((v,j) => { h[j]=(h[j]+v)>>>0; });
    }
    return h.map(v => v.toString(16).padStart(8,"0")).join("");
  }
  const digest = value => sha256(encode(value));
  function binary64(value) {
    if (!Number.isFinite(value) || value < 0 || value >= 1 || Object.is(value, -0)) throw Error("invalid owned sample");
    const buffer = new ArrayBuffer(8), view = new DataView(buffer); view.setFloat64(0, value, false);
    return Array.from(new Uint8Array(buffer)).map(n => n.toString(16).padStart(2,"0")).join("");
  }
  function physicalValid(p) {
    return exact(p,["version","matchId","plateAppearanceId","contactId","physicalIdentity"]) && p.version === V.physical &&
      [p.matchId,p.plateAppearanceId,p.contactId,p.physicalIdentity].every(id);
  }
  function sampleVector(physical, slot, samplerVersion = V.sampler) {
    try { dataOnly(physical); encode(physical); } catch (error) { return reject("invalidPhysicalIdentity"); }
    if (!physicalValid(physical)) return reject("invalidPhysicalIdentity");
    if (!["primaryThrow","relayThrow"].includes(slot)) return reject("unsupportedPhysicalSlot");
    if (samplerVersion !== V.sampler) return reject("unsupportedSampler");
    const stages = {};
    for (const stage of STAGES) {
      const key = { executionVersion: V.execution, physical, physicalSlot: slot, samplerVersion, stage };
      const canonical = encode(key), hash = sha256(canonical), u32 = parseInt(hash.slice(0,8),16);
      stages[stage] = { canonical, sha256: hash, u32, unit: (u32 + 0.5) / 4294967296 };
    }
    return freeze({ status: "ok", samplerVersion, stages });
  }
  function source(s) { return exact(s,["classification","scope","owner","reference","version"]) &&
    ["A","B","C"].includes(s.classification) && ["pureFixture","ownedInput"].includes(s.scope) && [s.owner,s.reference,s.version].every(id); }
  function time(t, originId, allowNegative = false) {
    return object(t) && t.version === V.timing && t.originId === originId &&
      (exact(t,["version","originId","status","ticks"]) && t.status === "known" && integer(t.ticks,allowNegative?-1000000000:0) ||
       exact(t,["version","originId","status","reason"]) && t.status === "unknown" && id(t.reason));
  }
  const known = t => t.status === "known";
  const timestamp = (input,ticks) => ({ version:V.timing,originId:input.context.originId,status:"known",ticks });
  function dataOnly(value, active = new Set()) {
    if (value === null || typeof value !== "object") return;
    if (active.has(value)) throw Error("cyclic input");
    active.add(value);
    for (const key of Reflect.ownKeys(value)) {
      const descriptor=Object.getOwnPropertyDescriptor(value,key);
      if (typeof key === "symbol" || !own(descriptor,"value")) throw Error("accessor or symbol input");
      dataOnly(descriptor.value,active);
    }
    active.delete(value);
  }
  function validate(input) {
    try {
      if (!object(input)) return reject("invalidInput");
      // Perform the canonical JSON check before any property-based schema reads.
      dataOnly(input);
      const copy = { ...input, ownedSample: input.ownedSample === undefined ? null : binary64(input.ownedSample) };
      encode(copy);
      if (!exact(input,["contractVersion","versions","identity","context","handoff","capabilities","ownedSample","delivery","positioning","secure","contest","provenance","effortReference","continuation"])) return reject("invalidInputSchema");
      if (input.contractVersion !== V.contract || !exact(input.versions,["execution","adapter","timing","sampler","effort"]) ||
        Object.keys(input.versions).some(k => input.versions[k] !== V[k])) return reject("unsupportedVersion");
      const i=input.identity, c=input.context, caps=input.capabilities;
      if (!exact(i,["playId","physical","leg","thrower","receiver","target"]) || !id(i.playId) || !physicalValid(i.physical)) return reject("invalidPhysicalIdentity");
      if (!exact(i.leg,["actionId","sourceThrowActionId","physicalSlot","parentActionId"]) || !id(i.leg.actionId) || !id(i.leg.sourceThrowActionId) ||
        !["primaryThrow","relayThrow"].includes(i.leg.physicalSlot) || (i.leg.physicalSlot === "primaryThrow" ? i.leg.parentActionId !== null : !id(i.leg.parentActionId))) return reject("invalidLegIdentity");
      if (![i.thrower,i.receiver].every(a => exact(a,["actorId","position"]) && id(a.actorId) && POSITIONS.includes(a.position)) || i.thrower.actorId === i.receiver.actorId) return reject("invalidActor");
      if (!exact(i.target,["runnerId","base"]) || !id(i.target.runnerId) || !BASES.includes(i.target.base) || [i.thrower.actorId,i.receiver.actorId].includes(i.target.runnerId)) return reject("invalidRunner");
      if (!exact(c,["initialOuts","originId","routeId","competitionLevel","environmentId","receiverAvailable"]) || !integer(c.initialOuts,0,2) ||
        ![c.originId,c.routeId,c.competitionLevel,c.environmentId].every(id) || typeof c.receiverAvailable !== "boolean") return reject("invalidContext");
      if (!exact(input.handoff,["playId","physicalIdentity","throwerId","receiverId","runnerId","base"]) ||
        encode(input.handoff) !== encode({playId:i.playId,physicalIdentity:i.physical.physicalIdentity,throwerId:i.thrower.actorId,receiverId:i.receiver.actorId,runnerId:i.target.runnerId,base:i.target.base})) return reject("handoffIdentityMismatch");
      if (!exact(caps,["actorId","adapterVersion","values"]) || caps.actorId !== i.receiver.actorId || caps.adapterVersion !== V.adapter ||
        !exact(caps.values,ABILITIES) || ABILITIES.some(k => !integer(caps.values[k],0,20))) return reject("invalidAbilitySnapshot");
      const d=input.delivery, p=input.positioning, s=input.secure, b=input.contest;
      if (!exact(d,["actionId","upstreamActionId","upstreamStatus","status","accuracy","quality","launch","ballArrival"]) ||
        d.actionId !== i.leg.sourceThrowActionId || !id(d.upstreamActionId) || !["completed","failed","notAttempted"].includes(d.upstreamStatus) ||
        !["completed","notAttempted"].includes(d.status) || !["onTarget","challenging","offline","none"].includes(d.accuracy) ||
        !["clean","challenging","none"].includes(d.quality) || !time(d.launch,c.originId) || !time(d.ballArrival,c.originId)) return reject("invalidDelivery");
      if (d.status === "completed" && (d.upstreamStatus !== "completed" || d.accuracy === "none" || d.quality === "none") ||
        d.status === "notAttempted" && (d.accuracy !== "none" || d.quality !== "none" || known(d.ballArrival)) ||
        d.accuracy === "onTarget" && d.quality !== "clean" || d.accuracy === "challenging" && d.quality !== "challenging") return reject("deliveryDependencyMismatch");
      if (known(d.launch) && known(d.ballArrival) && d.ballArrival.ticks < d.launch.ticks) return reject("arrivalBeforeLaunch");
      if (i.leg.physicalSlot === "primaryThrow" && known(d.launch) && d.launch.ticks !== 0) return reject("firstLaunchMustBeZero");
      if (!exact(p,["actionId","startContext","movementMdu","startTime"]) || !id(p.actionId) || !["atBase","covering","lateCover","distant"].includes(p.startContext) ||
        !integer(p.movementMdu,0,8) || !time(p.startTime,c.originId) || p.startContext === "atBase" && p.movementMdu !== 0) return reject("invalidPositioning");
      if (!exact(s,["actionId","demandMilli","cleanDelayTicks","bobbleDelayTicks"]) || s.actionId !== i.leg.actionId || !integer(s.demandMilli,0,30000) ||
        !integer(s.cleanDelayTicks,0,1000000) || !integer(s.bobbleDelayTicks,0,1000000)) return reject("invalidSecure");
      if (!exact(b,["actionId","type","attempted","contact","legality","delayTicks","runnerArrival"]) || !id(b.actionId) ||
        !["force","batterBeforeFirst","tag"].includes(b.type) || typeof b.attempted !== "boolean" || typeof b.contact !== "boolean" ||
        !integer(b.delayTicks,0,1000000) || !time(b.runnerArrival,c.originId,true) ||
        !exact(b.legality,["status","runnerId","base","sourceActionId"]) || !["eligible","ineligible","unknown"].includes(b.legality.status) ||
        b.legality.runnerId !== i.target.runnerId || b.legality.base !== i.target.base || !id(b.legality.sourceActionId) ||
        b.type === "batterBeforeFirst" && i.target.base !== "first") return reject("invalidContest");
      const actionIds=[d.actionId,p.actionId,s.actionId,b.actionId];
      if (new Set(actionIds).size !== actionIds.length || actionIds.includes(d.upstreamActionId)) return reject("duplicateActionIdentity");
      if (!exact(input.provenance,SOURCES) || SOURCES.some(k => !source(input.provenance[k]))) return reject("missingOrInvalidProvenance");
      const missing=SOURCES.filter(k => input.provenance[k].classification === "C");
      if (missing.length) return reject("insufficientExecutionSources",missing,"insufficient");
      if (input.effortReference !== null) {
        const e=input.effortReference;
        if (!exact(e,["version","status","position","competitionLevel","environmentId","referenceId","capabilities","provenance"]) ||
          e.version !== V.effort || !["uncalibrated","calibrated"].includes(e.status) || e.position !== i.receiver.position ||
          e.competitionLevel !== c.competitionLevel || e.environmentId !== c.environmentId || !id(e.referenceId) ||
          !exact(e.capabilities,ABILITIES) || ABILITIES.some(k=>!integer(e.capabilities[k],0,20)) || !source(e.provenance)) return reject("invalidEffortReference");
        // Calibration authority is intentionally not implemented in this pure sprint.
        if (e.status === "calibrated") return reject("unavailableCalibrationAuthority",[],"insufficient");
      }
      if (i.leg.physicalSlot === "primaryThrow" && input.continuation !== null) return reject("unexpectedContinuation");
      if (i.leg.physicalSlot === "relayThrow") {
        const q=input.continuation;
        if (!exact(q,["firstRetirement","pivot","provenance"]) || !source(q.provenance)) return reject("missingContinuation",[],"insufficient");
        if (q.provenance.classification === "C") return reject("insufficientContinuation",[],"insufficient");
        if (!exact(q.firstRetirement,["status","actionId","runnerId","base","outsBefore","outsAfter"]) ||
          !["completed","failed"].includes(q.firstRetirement.status) || ![q.firstRetirement.actionId,q.firstRetirement.runnerId].every(id) ||
          !BASES.includes(q.firstRetirement.base) || !integer(q.firstRetirement.outsBefore,0,2) || !integer(q.firstRetirement.outsAfter,0,3) ||
          !exact(q.pivot,["status","actorId","actionId"]) || !["completed","failed","notAttempted"].includes(q.pivot.status) ||
          q.pivot.actorId !== i.thrower.actorId || !id(q.pivot.actionId)) return reject("invalidContinuation");
      }
      return freeze({status:"ok"});
    } catch (error) { return reject("noncanonicalInput",[String(error.message)]); }
  }
  function payload(input) { return { ...input, ownedSample: binary64(input.ownedSample) }; }
  function canonicalInputClone(input) { const copy=JSON.parse(encode(payload(input)));copy.ownedSample=input.ownedSample;return copy; }
  function samplePayload(samples) {
    return {...samples,stages:Object.fromEntries(Object.entries(samples.stages).map(([name,row])=>[name,{...row,unit:binary64(row.unit)}]))};
  }
  function seal(input) {
    const validation=validate(input); if (validation.status !== "ok") return validation;
    const cloned=canonicalInputClone(input);
    return freeze({status:"ok",runtimeEnabled:false,input:cloned,inputDigest:digest(payload(cloned)),samples:sampleVector(cloned.identity.physical,cloned.identity.leg.physicalSlot)});
  }
  function checkSeal(sealed) {
    dataOnly(sealed);
    if (!exact(sealed,["status","runtimeEnabled","input","inputDigest","samples"]) || sealed.status !== "ok" || sealed.runtimeEnabled !== false) return reject("invalidSeal");
    const v=validate(sealed.input); if(v.status !== "ok") return v;
    if (sealed.inputDigest !== digest(payload(sealed.input)) || encode(samplePayload(sealed.samples)) !== encode(samplePayload(sampleVector(sealed.input.identity.physical,sealed.input.identity.leg.physicalSlot)))) return reject("sealedInputOrSampleMismatch");
    return {status:"ok"};
  }
  function stage(input,name,status,fields={}) {
    return {stage:name,status,playId:input.identity.playId,physicalIdentity:input.identity.physical.physicalIdentity,
      legActionId:input.identity.leg.actionId,receiverId:input.identity.receiver.actorId,target:input.identity.target,...fields};
  }
  function deliveryRaw(input, permitted) {
    const d=input.delivery;
    if (!permitted) return stage(input,"delivery","blocked",{actionId:d.actionId,reason:"priorForceOrPivotIncomplete"});
    if (d.status !== "completed") return stage(input,"delivery","notAttempted",{actionId:d.actionId,reason:"noCompletedDelivery"});
    if (!known(d.launch) || !known(d.ballArrival)) return stage(input,"delivery","insufficient",{actionId:d.actionId,reason:"unknownDeliveryTime"});
    return stage(input,"delivery",d.accuracy === "offline" ? "offline" : "completed",{
      actionId:d.actionId,accuracy:d.accuracy,quality:d.quality,launch:d.launch,ballArrival:d.ballArrival,upstreamActionId:d.upstreamActionId});
  }
  function positioningRaw(input,samples,a,permitted) {
    const p=input.positioning;
    if (!permitted) return stage(input,"positioning","blocked",{actionId:p.actionId,reason:"priorForceOrPivotIncomplete"});
    if (!input.context.receiverAvailable) return stage(input,"positioning","unavailable",{actionId:p.actionId,ready:false});
    const caps=input.capabilities.values, reachable=p.movementMdu*1000<=1000+400*caps.range;
    if (!reachable) return stage(input,"positioning","unreachable",{actionId:p.actionId,ready:false});
    if (!known(p.startTime)) return stage(input,"positioning","insufficient",{actionId:p.actionId,ready:false,reason:"unknownPositioningTime"});
    const jitter=(samples.stages.positioning.u32>>>28)-8;
    const duration=Math.max(100,1500-60*caps.reaction+jitter*10)+Math.ceil(p.movementMdu*1000000/(500+60*caps.mobility));
    const completion=timestamp(input,p.startTime.ticks+duration);
    if (a.status !== "completed") return stage(input,"positioning","positionedWithoutReception",{actionId:p.actionId,ready:false,completion,durationTicks:duration});
    const ready=completion.ticks<=a.ballArrival.ticks;
    return stage(input,"positioning",ready?"ready":"late",{actionId:p.actionId,ready,completion,durationTicks:duration});
  }
  function secureRaw(input,samples,a,b) {
    const s=input.secure;
    if(a.status !== "completed" || b.status !== "ready") return stage(input,"secure","notAttempted",{actionId:s.actionId,secured:false,attempted:false,reason:a.status !== "completed"?"noReceivableDelivery":"receiverNotReady"});
    const caps=input.capabilities.values, variation=((samples.stages.secure.u32>>>28)-8)*125;
    const margin=650*caps.catching+350*caps.fielding+variation-s.demandMilli;
    if (margin<0) return stage(input,"secure","failedHands",{actionId:s.actionId,secured:false,attempted:true,handsMarginMilli:margin});
    const bobble=margin<1000;
    return stage(input,"secure",bobble?"bobbleControl":"cleanControl",{actionId:s.actionId,secured:true,attempted:true,handsMarginMilli:margin,
      completion:timestamp(input,a.ballArrival.ticks+s.cleanDelayTicks+(bobble?s.bobbleDelayTicks:0)),
      possession:{actorId:input.identity.receiver.actorId,actionId:s.actionId,sourceThrowActionId:a.actionId}});
  }
  function contestRaw(input,samples,c) {
    const d=input.contest;
    if (!c.secured) return stage(input,"contest","notAttempted",{actionId:d.actionId,candidate:null,reason:"noSecuredPossession"});
    if (!d.attempted || !d.contact) return stage(input,"contest","notAttempted",{actionId:d.actionId,candidate:null,reason:"noCompletedTouchOrTag"});
    if (d.legality.status === "unknown") return stage(input,"contest","insufficient",{actionId:d.actionId,candidate:null,reason:"unknownLiveLegality"});
    if (d.legality.status !== "eligible") return stage(input,"contest","ineligible",{actionId:d.actionId,candidate:null});
    const jitter=(samples.stages.touch.u32>>>28)-8;
    const completion=timestamp(input,c.completion.ticks+d.delayTicks+jitter+8);
    if (!known(d.runnerArrival)) return stage(input,"contest","insufficient",{actionId:d.actionId,completion,candidate:null,reason:"unknownRunnerTime"});
    const margin=d.runnerArrival.ticks-completion.ticks;
    const state=margin>0?"retirementCandidate":margin===0?"tie":"alreadySafe";
    return stage(input,"contest",state,{actionId:d.actionId,completion,runnerArrival:d.runnerArrival,timingMarginTicks:margin,
      candidate:margin>0?{kind:"unappliedRetirementCandidate",runnerId:input.identity.target.runnerId,base:input.identity.target.base,
        receiverId:input.identity.receiver.actorId,actionId:d.actionId,type:d.type,initialOuts:input.context.initialOuts,
        wouldBeThirdOut:input.context.initialOuts===2,legalScoring:"requiresExistingThirdOutOwner",possessionActionId:c.actionId}:null});
  }
  function continuationAllowed(input, prior) {
    if (input.identity.leg.physicalSlot === "primaryThrow") return {status:"ok",allowed:true};
    dataOnly(prior);
    if (!exact(prior,["sealed","execution"]) || prior.sealed?.input?.identity?.leg?.physicalSlot !== "primaryThrow") return reject("missingPriorExecution",[],"insufficient");
    const reconstructed=execute(prior.sealed);
    if (reconstructed.status !== "ok" || encode(reconstructed) !== encode(prior.execution)) return reject("priorExecutionTampered");
    const first=prior.sealed.input, q=input.continuation, r=q.firstRetirement;
    if (encode(input.identity.physical)!==encode(first.identity.physical) || input.identity.playId!==first.identity.playId ||
      input.context.originId!==first.context.originId || input.identity.leg.parentActionId!==first.identity.leg.actionId ||
      input.identity.thrower.actorId!==first.identity.receiver.actorId || r.actionId!==first.contest.actionId ||
      input.delivery.upstreamActionId!==q.pivot.actionId || r.runnerId!==first.identity.target.runnerId ||
      r.base!==first.identity.target.base || r.outsBefore!==first.context.initialOuts) return reject("relayIdentityMismatch");
    const d=prior.execution.stages.contest;
    const allowed=r.status==="completed" && r.outsAfter===r.outsBefore+1 && r.outsAfter<3 && q.pivot.status==="completed" &&
      d.status==="retirementCandidate" && ["force","batterBeforeFirst"].includes(first.contest.type);
    if (!allowed) return {status:"ok",allowed:false};
    if (input.context.initialOuts!==r.outsAfter || !known(input.delivery.launch) || input.delivery.launch.ticks<d.completion.ticks) return reject("relayTimeOrOutsMismatch");
    return {status:"ok",allowed:true};
  }
  function effortBoundary(input) {
    return {status:"insufficientScorerFacts",referenceVersion:V.effort,referenceId:input.effortReference?.referenceId||null,
      reason:input.effortReference===null?"missingOrdinaryEffortReference":"uncalibratedOrdinaryEffortReference",
      officialScorerEligibility:"insufficient",officialError:null,wouldBeAssist:null};
  }
  function execute(sealed, prior = null) {
    try {
      const validation=checkSeal(sealed); if (validation.status!=="ok") return validation;
      const input=canonicalInputClone(sealed.input), continuation=continuationAllowed(input,prior); if(continuation.status!=="ok")return continuation;
      const a=deliveryRaw(input,continuation.allowed), b=positioningRaw(input,sealed.samples,a,continuation.allowed);
      const c=secureRaw(input,sealed.samples,a,b), d=contestRaw(input,sealed.samples,c);
      return freeze({status:"ok",runtimeEnabled:false,inputDigest:sealed.inputDigest,identity:input.identity,
        stages:{delivery:a,positioning:b,secure:c,contest:d},scorerFacts:effortBoundary(input),
        application:{matchStateWrites:0,gameRecordWrites:0,rngCallbacks:0,actualRetirements:0}});
    } catch(error) { return reject("malformedExecution",[String(error.message)]); }
  }
  // Independently callable stages verify all supplied serialized dependencies.
  // Recalculation is pure consistency validation with the SAME frozen vector.
  function resolveStage(name,sealed,dependencies,prior) {
    try {
      dataOnly(dependencies);
      const validation=checkSeal(sealed);if(validation.status!=="ok")return validation;
      const input=canonicalInputClone(sealed.input),continuation=continuationAllowed(input,prior);
      if(continuation.status!=="ok")return continuation;
      const required={delivery:[],positioning:["delivery"],secure:["delivery","positioning"],contest:["delivery","positioning","secure"]}[name];
      if(!required || !exact(dependencies,required))return reject("missingStageDependency");
      const stages={delivery:deliveryRaw(input,continuation.allowed)};
      if(name!=="delivery")stages.positioning=positioningRaw(input,sealed.samples,stages.delivery,continuation.allowed);
      if(["secure","contest"].includes(name))stages.secure=secureRaw(input,sealed.samples,stages.delivery,stages.positioning);
      if(name==="contest")stages.contest=contestRaw(input,sealed.samples,stages.secure);
      for(const stageName of required)if(!object(dependencies[stageName]) || encode(dependencies[stageName])!==encode(stages[stageName]))return reject("stageDependencyTampered",[stageName]);
      return freeze({status:"ok",output:stages[name]});
    } catch(error) { return reject("malformedStageDependency"); }
  }
  return freeze({versions:V,runtimeEnabled:false,validate,seal,execute,sampleVector,canonicalEncode:encode,sha256,binary64,
    resolveDelivery:(s,prior=null)=>resolveStage("delivery",s,{},prior),
    resolvePositioning:(s,a,prior=null)=>resolveStage("positioning",s,{delivery:a},prior),
    resolveSecure:(s,a,b,prior=null)=>resolveStage("secure",s,{delivery:a,positioning:b},prior),
    resolveContest:(s,a,b,c,prior=null)=>resolveStage("contest",s,{delivery:a,positioning:b,secure:c},prior)});
});
