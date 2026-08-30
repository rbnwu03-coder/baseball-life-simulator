(function (root, factory) {
  const mental = root.PitcherMentalState || (typeof module === "object" && module.exports && typeof require === "function" ? require("./pitcher-mental-state.js") : null);
  const process = root.PitcherProcessState || (typeof module === "object" && module.exports && typeof require === "function" ? require("./pitcher-process-state.js") : null);
  const api = factory(mental, process);
  root.PitchSequencing = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (PitcherMentalState, PitcherProcessState) {
  "use strict";

  const VERSION = "pitch-sequencing-core-sprint-a";
  const RNG_NAMESPACE = "pitcher-sequencing-core-a-v1";
  const PITCH_CLASSES = Object.freeze(["hitterPitch", "competitiveStrike", "edgeStrike", "chasePitch", "clearBall"]);
  const PITCH_CLASS_TOPOLOGY = Object.freeze(Object.fromEntries(PITCH_CLASSES.map((pitchClass, index) => [pitchClass, index])));
  const BASE_DISTRIBUTION = Object.freeze({ hitterPitch: 0.18, competitiveStrike: 0.27, edgeStrike: 0.2, chasePitch: 0.2, clearBall: 0.15 });
  const TARGET_DIFFICULTY = Object.freeze({ hitterPitch: 0.18, competitiveStrike: 0.3, edgeStrike: 0.66, chasePitch: 0.62, clearBall: 0.45 });

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function clamp(value, minimum = 0, maximum = 1, fallback = minimum) {
    const numeric = Number(value);
    return Math.max(minimum, Math.min(maximum, Number.isFinite(numeric) ? numeric : fallback));
  }

  function round(value, digits = 6) {
    const scale = 10 ** digits;
    return Math.round((Number(value) || 0) * scale) / scale;
  }

  function stableHash(value) {
    const text = String(value ?? "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function deterministicUnit(identity, label) {
    return stableHash(`${RNG_NAMESPACE}|${identity}|${label}`) / 4294967296;
  }

  function normalizeDistribution(input = {}) {
    const positive = Object.fromEntries(PITCH_CLASSES.map(pitchClass => [pitchClass, Math.max(0.000001, Number(input[pitchClass]) || 0)]));
    const total = Object.values(positive).reduce((sum, value) => sum + value, 0);
    const normalized = Object.fromEntries(PITCH_CLASSES.map(pitchClass => [pitchClass, round(positive[pitchClass] / total, 9)]));
    const correction = round(1 - Object.values(normalized).reduce((sum, value) => sum + value, 0), 9);
    normalized[PITCH_CLASSES.at(-1)] = round(normalized[PITCH_CLASSES.at(-1)] + correction, 9);
    return deepFreeze(normalized);
  }

  function emptyModifier() {
    return Object.fromEntries(PITCH_CLASSES.map(pitchClass => [pitchClass, 0]));
  }

  function addModifier(target, source) {
    PITCH_CLASSES.forEach(pitchClass => { target[pitchClass] += Number(source[pitchClass]) || 0; });
  }

  function buildStrategicPitchDistribution(context = {}, processState = {}) {
    const process = PitcherProcessState
      ? PitcherProcessState.normalizeProcessState(processState)
      : { rhythm: 55, aggression: 50, tempo: 50, precisionIntent: 50 };
    const balls = Math.max(0, Math.min(3, Math.floor(Number(context.balls) || 0)));
    const strikes = Math.max(0, Math.min(2, Math.floor(Number(context.strikes) || 0)));
    const countModifier = emptyModifier();
    if (balls === 0 && strikes === 2) addModifier(countModifier, { hitterPitch: -0.04, competitiveStrike: -0.03, edgeStrike: 0.04, chasePitch: 0.06, clearBall: -0.03 });
    else if (balls === 3 && strikes === 0) addModifier(countModifier, { hitterPitch: 0.12, competitiveStrike: 0.12, edgeStrike: -0.05, chasePitch: -0.1, clearBall: -0.09 });
    else if (balls === 3 && strikes === 2) addModifier(countModifier, { hitterPitch: -0.02, competitiveStrike: 0.08, edgeStrike: 0.01, chasePitch: -0.03, clearBall: -0.04 });
    else if (balls === 3) addModifier(countModifier, { hitterPitch: 0.06, competitiveStrike: 0.07, edgeStrike: -0.02, chasePitch: -0.05, clearBall: -0.06 });
    else if (strikes === 2) addModifier(countModifier, { hitterPitch: -0.02, competitiveStrike: -0.01, edgeStrike: 0.02, chasePitch: 0.03, clearBall: -0.02 });

    const sequenceModifier = emptyModifier();
    const recent = Array.isArray(context.recentPitchClasses) ? context.recentPitchClasses.filter(item => PITCH_CLASSES.includes(item)).slice(-3) : [];
    const previousPitch = recent.at(-1) || "";
    if (previousPitch) {
      sequenceModifier[previousPitch] -= 0.025;
      const previousIndex = PITCH_CLASS_TOPOLOGY[previousPitch];
      const neighbors = PITCH_CLASSES.filter(item => Math.abs(PITCH_CLASS_TOPOLOGY[item] - previousIndex) === 1);
      neighbors.forEach(item => { sequenceModifier[item] += 0.025 / neighbors.length; });
    }
    if (["single", "double", "triple", "homeRun"].includes(context.previousPAResult)) {
      addModifier(sequenceModifier, { hitterPitch: -0.025, competitiveStrike: 0.03, edgeStrike: 0.02, chasePitch: -0.005, clearBall: -0.02 });
    }
    if (context.scoringPosition || context.highLeverage) {
      addModifier(sequenceModifier, { hitterPitch: 0, competitiveStrike: 0.02, edgeStrike: 0.02, chasePitch: -0.01, clearBall: -0.03 });
    }

    const processModifier = emptyModifier();
    const aggressionShift = ((process.aggression - 50) / 50) * 0.08;
    addModifier(processModifier, {
      hitterPitch: aggressionShift * 0.55, competitiveStrike: aggressionShift * 0.45,
      edgeStrike: 0, chasePitch: aggressionShift * -0.45, clearBall: aggressionShift * -0.55
    });
    const precisionShift = ((process.precisionIntent - 50) / 50) * 0.08;
    addModifier(processModifier, {
      hitterPitch: precisionShift * -0.55, competitiveStrike: precisionShift * -0.15,
      edgeStrike: precisionShift * 0.7, chasePitch: precisionShift * 0.3, clearBall: precisionShift * -0.3
    });
    const rushedShift = Math.max(0, process.tempo - process.rhythm) / 100 * 0.06;
    addModifier(processModifier, {
      hitterPitch: rushedShift * 0.5, competitiveStrike: rushedShift * 0.5,
      edgeStrike: rushedShift * -0.15, chasePitch: rushedShift * -0.35, clearBall: rushedShift * -0.5
    });

    const combined = Object.fromEntries(PITCH_CLASSES.map(pitchClass => [pitchClass,
      BASE_DISTRIBUTION[pitchClass] + countModifier[pitchClass] + sequenceModifier[pitchClass] + processModifier[pitchClass]
    ]));
    return deepFreeze({
      version: VERSION,
      context: { balls, strikes, previousPitch, previousPAResult: context.previousPAResult || "", scoringPosition: Boolean(context.scoringPosition), highLeverage: Boolean(context.highLeverage) },
      processState: clone(process),
      baseDistribution: clone(BASE_DISTRIBUTION),
      contextModifiers: { count: clone(countModifier), sequence: clone(sequenceModifier) },
      processModifiers: clone(processModifier),
      strategicDistribution: clone(normalizeDistribution(combined))
    });
  }

  function freezePitchDistribution(strategicPlan) {
    const plan = strategicPlan && typeof strategicPlan === "object" ? strategicPlan : buildStrategicPitchDistribution();
    return deepFreeze({
      version: VERSION,
      baseDistribution: clone(plan.baseDistribution || BASE_DISTRIBUTION),
      contextModifiers: clone(plan.contextModifiers || {}),
      processModifiers: clone(plan.processModifiers || emptyModifier()),
      finalFrozenDistribution: clone(normalizeDistribution(plan.strategicDistribution || plan.finalFrozenDistribution || BASE_DISTRIBUTION)),
      frozenContext: clone(plan.context || {})
    });
  }

  function sampleDistribution(distribution, roll) {
    const unit = clamp(roll, 0, 0.999999999, 0);
    let cumulative = 0;
    for (const pitchClass of PITCH_CLASSES) {
      cumulative += distribution[pitchClass];
      if (unit < cumulative) return pitchClass;
    }
    return PITCH_CLASSES.at(-1);
  }

  function sampleIntendedPitchClass(frozenDistribution, options = {}) {
    const frozen = freezePitchDistribution(frozenDistribution);
    const roll = Number.isFinite(Number(options.roll)) ? clamp(options.roll, 0, 0.999999999)
      : deterministicUnit(options.identity || "pitch", options.label || "intended-pitch");
    return deepFreeze({ intendedPitchClass: sampleDistribution(frozen.finalFrozenDistribution, roll), intentRoll: round(roll), frozenDistribution: frozen });
  }

  function resolvePitchControl(input = {}) {
    const intendedPitchClass = PITCH_CLASSES.includes(input.intendedPitchClass) ? input.intendedPitchClass : "competitiveStrike";
    const control = Math.max(0, Math.min(20, Number(input.control) || 0));
    const precisionIntent = Math.max(0, Math.min(100, Number(input.precisionIntent) || 0));
    const rhythm = Math.max(0, Math.min(100, Number(input.rhythm) || 0));
    const tempo = Math.max(0, Math.min(100, Number(input.tempo) || 0));
    const targetDifficulty = clamp(TARGET_DIFFICULTY[intendedPitchClass] + Math.max(0, precisionIntent - 50) / 100 * 0.35);
    const realizationStability = clamp(0.12 + control / 20 * 0.72 + rhythm / 100 * 0.18 - targetDifficulty * 0.28 - Math.abs(tempo - rhythm) / 100 * 0.12, 0.08, 0.94);
    const intendedIndex = PITCH_CLASS_TOPOLOGY[intendedPitchClass];
    const raw = Object.fromEntries(PITCH_CLASSES.map(pitchClass => {
      const distance = Math.abs(PITCH_CLASS_TOPOLOGY[pitchClass] - intendedIndex);
      let weight = Math.exp(-distance * (0.9 + realizationStability * 2.2));
      if (distance === 0) weight *= 1.2 + realizationStability * 3.8;
      return [pitchClass, weight];
    }));
    const actualDistribution = normalizeDistribution(raw);
    const roll = Number.isFinite(Number(input.roll)) ? clamp(input.roll, 0, 0.999999999)
      : deterministicUnit(input.identity || "pitch", input.label || "control-realization");
    const actualPitchClass = sampleDistribution(actualDistribution, roll);
    const realizationDistance = Math.abs(PITCH_CLASS_TOPOLOGY[actualPitchClass] - intendedIndex);
    const realizationQuality = realizationDistance === 0 ? "heldTarget" : realizationDistance === 1 ? "adjacentDrift" : "majorDrift";
    const realizationCause = realizationDistance > 0 ? "executionDrift"
      : intendedPitchClass === "clearBall" ? "intentionalClearBall"
        : intendedPitchClass === "hitterPitch" ? "intentionalChallenge" : "targetRealized";
    return deepFreeze({
      intendedPitchClass,
      actualPitchClass,
      control: round(control),
      targetDifficulty: round(targetDifficulty),
      realizationStability: round(realizationStability),
      realizationDistance,
      realizationQuality,
      realizationCause,
      realizationRoll: round(roll),
      actualDistribution: clone(actualDistribution)
    });
  }

  function createPitcherRuntimeState(input = {}) {
    const responseProfile = PitcherMentalState.createResponseProfile(input.responseProfile);
    const mentalState = PitcherMentalState.normalizeMentalState(input.mentalState);
    const processState = input.processState
      ? PitcherProcessState.normalizeProcessState(input.processState)
      : PitcherProcessState.derivePitcherProcessState(mentalState, responseProfile, null, input.context || {});
    return deepFreeze({
      version: VERSION,
      runtimeId: input.runtimeId || "pitcher-runtime",
      responseProfile: clone(responseProfile),
      mentalState: clone(mentalState),
      processState: clone(processState),
      control: Math.max(0, Math.min(20, Number(input.control) || 0)),
      previousPAResult: typeof input.previousPAResult === "string" ? input.previousPAResult : "",
      recentPitchClasses: Array.isArray(input.recentPitchClasses) ? input.recentPitchClasses.filter(item => PITCH_CLASSES.includes(item)).slice(-6) : [],
      lastMentalTransition: input.lastMentalTransition ? clone(input.lastMentalTransition) : null
    });
  }

  function normalizePitcherRuntimeState(saved, fallback = {}) {
    return createPitcherRuntimeState({ ...fallback, ...(saved && typeof saved === "object" ? clone(saved) : {}) });
  }

  function advancePitcherRuntimeState(runtimeState, stimulus, context = {}) {
    const before = normalizePitcherRuntimeState(runtimeState);
    const transition = PitcherMentalState.transitionMentalState(before.mentalState, stimulus, before.responseProfile);
    if (!transition.transitionApplied) {
      return createPitcherRuntimeState({ ...clone(before), lastMentalTransition: transition });
    }
    const processState = PitcherProcessState.derivePitcherProcessState(transition.mentalStateAfter, before.responseProfile, before.processState, context);
    return createPitcherRuntimeState({
      ...clone(before),
      mentalState: transition.mentalStateAfter,
      processState,
      previousPAResult: context.paResult || before.previousPAResult,
      recentPitchClasses: context.recentPitchClasses || before.recentPitchClasses,
      lastMentalTransition: transition
    });
  }

  function createPitchDecision(input = {}) {
    const runtime = normalizePitcherRuntimeState(input.pitcherRuntime, { control: input.control });
    const identity = `${input.paIdentity || "pa"}|pitch-${Math.max(1, Number(input.pitchNumber) || 1)}`;
    const context = {
      balls: input.balls,
      strikes: input.strikes,
      recentPitchClasses: input.recentPitchClasses || runtime.recentPitchClasses,
      previousPAResult: input.previousPAResult ?? runtime.previousPAResult,
      scoringPosition: input.scoringPosition,
      highLeverage: input.highLeverage
    };
    const strategicPlan = buildStrategicPitchDistribution(context, runtime.processState);
    const frozenDistribution = freezePitchDistribution(strategicPlan);
    const intent = sampleIntendedPitchClass(frozenDistribution, { identity, label: "intended-pitch", roll: input.intentRoll });
    const controlRealization = resolvePitchControl({
      intendedPitchClass: intent.intendedPitchClass,
      control: runtime.control,
      precisionIntent: runtime.processState.precisionIntent,
      rhythm: runtime.processState.rhythm,
      tempo: runtime.processState.tempo,
      identity,
      label: "control-realization",
      roll: input.realizationRoll
    });
    const transition = runtime.lastMentalTransition;
    const debugTrace = deepFreeze({
      mentalStateBefore: clone(transition?.mentalStateBefore || runtime.mentalState),
      mentalStimulus: transition?.mentalStimulus || "",
      responseProfile: clone(runtime.responseProfile),
      mentalStateAfter: clone(transition?.mentalStateAfter || runtime.mentalState),
      processState: clone(runtime.processState),
      basePitchDistribution: clone(frozenDistribution.baseDistribution),
      strategicModifiers: { context: clone(frozenDistribution.contextModifiers), process: clone(frozenDistribution.processModifiers) },
      frozenPitchDistribution: clone(frozenDistribution.finalFrozenDistribution),
      intendedPitchClass: intent.intendedPitchClass,
      control: controlRealization.control,
      targetDifficulty: controlRealization.targetDifficulty,
      realizationStability: controlRealization.realizationStability,
      actualPitchClass: controlRealization.actualPitchClass,
      realizationCause: controlRealization.realizationCause
    });
    return deepFreeze({
      version: VERSION,
      identity,
      frozenDistribution,
      intendedPitchClass: intent.intendedPitchClass,
      controlRealization,
      actualPitchClass: controlRealization.actualPitchClass,
      debugTrace
    });
  }

  return deepFreeze({
    VERSION,
    RNG_NAMESPACE,
    PITCH_CLASSES,
    PITCH_CLASS_TOPOLOGY,
    BASE_DISTRIBUTION,
    TARGET_DIFFICULTY,
    stableHash,
    deterministicUnit,
    normalizeDistribution,
    buildStrategicPitchDistribution,
    freezePitchDistribution,
    sampleIntendedPitchClass,
    resolvePitchControl,
    createPitcherRuntimeState,
    normalizePitcherRuntimeState,
    advancePitcherRuntimeState,
    createPitchDecision
  });
});
