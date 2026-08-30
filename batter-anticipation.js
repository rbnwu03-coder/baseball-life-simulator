(function (root, factory) {
  const api = factory();
  root.BatterAnticipation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "batter-anticipation-sprint-b";
  const RNG_NAMESPACE = "batter-anticipation-sprint-b-v1";
  const PITCH_CLASSES = Object.freeze(["hitterPitch", "competitiveStrike", "edgeStrike", "chasePitch", "clearBall"]);
  const BASE_PRIOR = Object.freeze({ hitterPitch: 0.2, competitiveStrike: 0.25, edgeStrike: 0.2, chasePitch: 0.2, clearBall: 0.15 });
  const OBSERVABLE_CUE_VOCABULARY = Object.freeze([
    "commandAppearsStable", "minorLocationDrift", "visibleLocationMiss",
    "recentChallengeHeavy", "recentExpansionPattern", "recentCommandInstability"
  ]);

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
    const values = Object.fromEntries(PITCH_CLASSES.map(pitchClass => [pitchClass, Math.max(0.000001, Number(input[pitchClass]) || 0)]));
    const total = Object.values(values).reduce((sum, value) => sum + value, 0);
    const normalized = Object.fromEntries(PITCH_CLASSES.map(pitchClass => [pitchClass, round(values[pitchClass] / total, 9)]));
    const correction = round(1 - Object.values(normalized).reduce((sum, value) => sum + value, 0), 9);
    normalized.clearBall = round(normalized.clearBall + correction, 9);
    return deepFreeze(normalized);
  }

  function sanitizeAbilities(input = {}) {
    return deepFreeze({
      observe: Math.max(0, Math.min(20, Number(input.observe) || 0)),
      baseballIQ: Math.max(0, Math.min(20, Number(input.baseballIQ) || 0)),
      ballSense: Math.max(0, Math.min(20, Number(input.ballSense) || 0))
    });
  }

  function createPublicContext(input = {}) {
    return deepFreeze({
      balls: Math.max(0, Math.min(3, Math.floor(Number(input.balls) || 0))),
      strikes: Math.max(0, Math.min(2, Math.floor(Number(input.strikes) || 0))),
      outs: Math.max(0, Math.min(2, Math.floor(Number(input.outs) || 0))),
      runners: Array.isArray(input.runners) ? input.runners.slice(0, 3).map(Boolean) : [false, false, false],
      scoreDifference: Number(input.scoreDifference) || 0,
      inning: Math.max(1, Math.floor(Number(input.inning) || 1)),
      highLeverage: input.highLeverage === true,
      previousPitchResult: typeof input.previousPitchResult === "string" ? input.previousPitchResult : "",
      previousPAResult: typeof input.previousPAResult === "string" ? input.previousPAResult : ""
    });
  }

  function resolveAnticipationObservation(input = {}) {
    const identity = String(input.identity || "plate-appearance");
    const abilities = sanitizeAbilities(input.batterCapabilities);
    const evidence = input.observableEvidence && typeof input.observableEvidence === "object" ? input.observableEvidence : {};
    const recent = Array.isArray(evidence.recentPitchClasses) ? evidence.recentPitchClasses.filter(item => PITCH_CLASSES.includes(item)).slice(-12) : [];
    const retentionChance = clamp(0.28 + abilities.observe / 20 * 0.58, 0.28, 0.86);
    const errorChance = clamp(0.3 - abilities.observe / 20 * 0.24, 0.06, 0.3);
    const observedPitchClasses = [];
    let omittedCount = 0;
    let noiseCount = 0;
    recent.forEach((pitchClass, index) => {
      if (deterministicUnit(identity, `retain|${index}|${pitchClass}`) > retentionChance) {
        omittedCount += 1;
        return;
      }
      let observedClass = pitchClass;
      if (deterministicUnit(identity, `noise|${index}|${pitchClass}`) < errorChance) {
        const originalIndex = PITCH_CLASSES.indexOf(pitchClass);
        const direction = deterministicUnit(identity, `noise-direction|${index}`) < 0.5 ? -1 : 1;
        observedClass = PITCH_CLASSES[Math.max(0, Math.min(PITCH_CLASSES.length - 1, originalIndex + direction))];
        noiseCount += observedClass === pitchClass ? 0 : 1;
      }
      observedPitchClasses.push(observedClass);
    });
    const cueRetentionChance = clamp(0.22 + abilities.observe / 20 * 0.66, 0.22, 0.88);
    const observedCues = Array.isArray(evidence.observableCues)
      ? evidence.observableCues.filter((cue, index) => typeof cue === "string" && deterministicUnit(identity, `cue|${index}|${cue}`) < cueRetentionChance).slice(-6)
      : [];
    const sampleAdequacy = round(clamp(observedPitchClasses.length / 8));
    const reliability = round(clamp(0.22 + abilities.observe / 20 * 0.56 + sampleAdequacy * 0.18 - noiseCount * 0.035));
    return deepFreeze({
      version: VERSION,
      observedPitchClasses,
      observedCues,
      sourceSampleSize: recent.length,
      retainedSampleSize: observedPitchClasses.length,
      omittedCount,
      noiseCount,
      sampleAdequacy,
      reliability
    });
  }

  function getContextExpectation(publicContext, baseballIQ) {
    const distribution = { ...BASE_PRIOR };
    const weight = 0.2 + baseballIQ / 20 * 0.55;
    if (publicContext.balls === 0 && publicContext.strikes === 2) {
      distribution.hitterPitch -= 0.05 * weight;
      distribution.competitiveStrike -= 0.025 * weight;
      distribution.edgeStrike += 0.035 * weight;
      distribution.chasePitch += 0.055 * weight;
      distribution.clearBall -= 0.015 * weight;
    } else if (publicContext.balls === 3 && publicContext.strikes === 0) {
      distribution.hitterPitch += 0.075 * weight;
      distribution.competitiveStrike += 0.095 * weight;
      distribution.edgeStrike -= 0.035 * weight;
      distribution.chasePitch -= 0.075 * weight;
      distribution.clearBall -= 0.06 * weight;
    } else if (publicContext.balls === 3) {
      distribution.hitterPitch += 0.035 * weight;
      distribution.competitiveStrike += 0.055 * weight;
      distribution.edgeStrike -= 0.01 * weight;
      distribution.chasePitch -= 0.035 * weight;
      distribution.clearBall -= 0.045 * weight;
    }
    if (publicContext.highLeverage) {
      distribution.competitiveStrike += 0.018 * weight;
      distribution.edgeStrike += 0.016 * weight;
      distribution.clearBall -= 0.034 * weight;
    }
    return normalizeDistribution(distribution);
  }

  function resolveAnticipationInterpretation(input = {}) {
    const identity = String(input.identity || "plate-appearance");
    const publicContext = createPublicContext(input.publicContext);
    const observation = input.observationResult && typeof input.observationResult === "object" ? input.observationResult : resolveAnticipationObservation(input);
    const abilities = sanitizeAbilities(input.batterCapabilities);
    const contextExpectation = getContextExpectation(publicContext, abilities.baseballIQ);
    const counts = Object.fromEntries(PITCH_CLASSES.map(pitchClass => [pitchClass, 0]));
    (observation.observedPitchClasses || []).forEach(pitchClass => { if (PITCH_CLASSES.includes(pitchClass)) counts[pitchClass] += 1; });
    const observedTotal = Object.values(counts).reduce((sum, value) => sum + value, 0);
    const observedDistribution = normalizeDistribution(Object.fromEntries(PITCH_CLASSES.map(pitchClass => [pitchClass, counts[pitchClass] + 0.75])));
    const patternWeight = clamp((0.12 + abilities.ballSense / 20 * 0.5) * (0.2 + Number(observation.sampleAdequacy || 0) * 0.8), 0.04, 0.62);
    const combined = Object.fromEntries(PITCH_CLASSES.map(pitchClass => [pitchClass,
      contextExpectation[pitchClass] * (1 - patternWeight) + observedDistribution[pitchClass] * patternWeight
    ]));
    const observedCues = Array.isArray(observation.observedCues)
      ? [...new Set(observation.observedCues.filter(cue => OBSERVABLE_CUE_VOCABULARY.includes(cue)))] : [];
    const cueInterpretationStrength = clamp(0.2 + abilities.baseballIQ / 20 * 0.42 + abilities.ballSense / 20 * 0.28, 0.2, 0.9);
    const strategicCueModifier = Object.fromEntries(PITCH_CLASSES.map(pitchClass => [pitchClass, 0]));
    if (observedCues.includes("recentChallengeHeavy")) {
      strategicCueModifier.hitterPitch += 0.024 * cueInterpretationStrength;
      strategicCueModifier.competitiveStrike += 0.034 * cueInterpretationStrength;
      strategicCueModifier.edgeStrike -= 0.012 * cueInterpretationStrength;
      strategicCueModifier.chasePitch -= 0.026 * cueInterpretationStrength;
      strategicCueModifier.clearBall -= 0.02 * cueInterpretationStrength;
    }
    if (observedCues.includes("recentExpansionPattern")) {
      strategicCueModifier.hitterPitch -= 0.018 * cueInterpretationStrength;
      strategicCueModifier.competitiveStrike -= 0.024 * cueInterpretationStrength;
      strategicCueModifier.edgeStrike += 0.026 * cueInterpretationStrength;
      strategicCueModifier.chasePitch += 0.032 * cueInterpretationStrength;
      strategicCueModifier.clearBall -= 0.016 * cueInterpretationStrength;
    }
    PITCH_CLASSES.forEach(pitchClass => { combined[pitchClass] += strategicCueModifier[pitchClass]; });
    const biasMagnitude = (0.018 + (20 - abilities.ballSense) / 20 * 0.052) * (deterministicUnit(identity, "bias-magnitude") * 0.7 + 0.3);
    const biasFrom = Math.floor(deterministicUnit(identity, "bias-from") * PITCH_CLASSES.length);
    const biasTo = (biasFrom + (deterministicUnit(identity, "bias-direction") < 0.5 ? 1 : PITCH_CLASSES.length - 1)) % PITCH_CLASSES.length;
    combined[PITCH_CLASSES[biasFrom]] -= biasMagnitude;
    combined[PITCH_CLASSES[biasTo]] += biasMagnitude;
    const subjectiveDistribution = normalizeDistribution(combined);
    let commandUncertaintyAdjustment = 0;
    let commandConfidenceAdjustment = 0;
    if (observedCues.includes("commandAppearsStable")) {
      commandUncertaintyAdjustment -= 0.025 * cueInterpretationStrength;
      commandConfidenceAdjustment += 0.035 * cueInterpretationStrength;
    }
    if (observedCues.includes("minorLocationDrift")) {
      commandUncertaintyAdjustment += 0.012 * cueInterpretationStrength;
      commandConfidenceAdjustment -= 0.016 * cueInterpretationStrength;
    }
    if (observedCues.includes("visibleLocationMiss")) {
      commandUncertaintyAdjustment += 0.026 * cueInterpretationStrength;
      commandConfidenceAdjustment -= 0.034 * cueInterpretationStrength;
    }
    if (observedCues.includes("recentCommandInstability")) {
      commandUncertaintyAdjustment += 0.06 * cueInterpretationStrength;
      commandConfidenceAdjustment -= 0.075 * cueInterpretationStrength;
    }
    const uncertainty = round(clamp(0.72 - abilities.baseballIQ / 20 * 0.3 - Number(observation.sampleAdequacy || 0) * 0.24 - Number(observation.reliability || 0) * 0.12 + commandUncertaintyAdjustment, 0.12, 0.86));
    const confidenceNoise = (deterministicUnit(identity, "confidence-bias") - 0.5) * 0.34;
    const uncertaintyPressure = (uncertainty - 0.4) * 0.12;
    const confidence = round(clamp(0.15 + Number(observation.sampleAdequacy || 0) * 0.35 + Number(observation.reliability || 0) * 0.24 + abilities.baseballIQ / 20 * 0.14 + confidenceNoise + commandConfidenceAdjustment - uncertaintyPressure, 0.06, 0.94));
    return deepFreeze({
      version: VERSION,
      subjectivePitchDistribution: clone(subjectiveDistribution),
      subjectiveDistribution: clone(subjectiveDistribution),
      anticipationConfidence: confidence,
      confidence,
      uncertainty,
      contextExpectation: clone(contextExpectation),
      observedDistribution: clone(observedDistribution),
      observedCues: clone(observedCues),
      strategicCueModifier: clone(strategicCueModifier),
      commandCueAdjustment: { uncertainty: round(commandUncertaintyAdjustment), confidence: round(commandConfidenceAdjustment) },
      cueInterpretationStrength: round(cueInterpretationStrength),
      patternWeight: round(patternWeight),
      interpretationBias: { from: PITCH_CLASSES[biasFrom], to: PITCH_CLASSES[biasTo], magnitude: round(biasMagnitude) },
      observedSampleSize: observedTotal
    });
  }

  function prepareBatterAnticipation(input = {}) {
    const identity = String(input.identity || "plate-appearance");
    const publicContext = createPublicContext(input.publicContext);
    const observableEvidenceRaw = clone(input.observableEvidence || {});
    const observationResult = resolveAnticipationObservation({ identity, publicContext, observableEvidence: observableEvidenceRaw, batterCapabilities: input.batterCapabilities });
    const interpretationResult = resolveAnticipationInterpretation({ identity, publicContext, observationResult, batterCapabilities: input.batterCapabilities });
    return deepFreeze({
      version: VERSION,
      identity,
      publicContext,
      observableEvidenceRaw,
      observationResult,
      interpretationResult,
      subjectivePitchDistribution: clone(interpretationResult.subjectiveDistribution),
      subjectiveDistribution: clone(interpretationResult.subjectiveDistribution),
      anticipationConfidence: interpretationResult.confidence,
      confidence: interpretationResult.confidence
    });
  }

  function distributionDirection(distribution = {}) {
    const challenge = (Number(distribution.hitterPitch) || 0) + (Number(distribution.competitiveStrike) || 0);
    const expansion = (Number(distribution.edgeStrike) || 0) + (Number(distribution.chasePitch) || 0);
    const clear = Number(distribution.clearBall) || 0;
    return challenge >= expansion && challenge >= clear ? "challenge" : expansion >= clear ? "expansion" : "clearBall";
  }

  function evaluateAnticipationDebug(anticipation = {}, frozenTrueDistribution = {}) {
    const subjective = normalizeDistribution(anticipation.subjectiveDistribution || anticipation.interpretationResult?.subjectiveDistribution || BASE_PRIOR);
    const truth = normalizeDistribution(frozenTrueDistribution);
    const distance = PITCH_CLASSES.reduce((sum, pitchClass) => sum + Math.abs(subjective[pitchClass] - truth[pitchClass]), 0) / 2;
    const directionAccuracy = round(clamp(1 - distance));
    const confidence = clamp(anticipation.confidence ?? anticipation.interpretationResult?.confidence);
    return deepFreeze({
      directionAccuracy,
      directionCorrect: distributionDirection(subjective) === distributionDirection(truth),
      subjectiveDirection: distributionDirection(subjective),
      trueDirection: distributionDirection(truth),
      confidenceCalibration: round(clamp(1 - Math.abs(confidence - directionAccuracy)))
    });
  }

  function derivePrePitchReadiness(anticipation = {}, chosenApproach = "balancedAttack") {
    const distribution = normalizeDistribution(anticipation.subjectiveDistribution || anticipation.interpretationResult?.subjectiveDistribution || BASE_PRIOR);
    const confidence = clamp(anticipation.confidence ?? anticipation.interpretationResult?.confidence);
    const challenge = distribution.hitterPitch + distribution.competitiveStrike;
    const expansion = distribution.edgeStrike + distribution.chasePitch + distribution.clearBall;
    const alignment = chosenApproach === "aggressiveEarlySwing" ? challenge
      : chosenApproach === "patientSelection" ? expansion
        : 1 - Math.abs(challenge - expansion);
    const score = round(clamp(0.35 + alignment * 0.4 + confidence * 0.25));
    return deepFreeze({
      chosenApproach,
      score,
      level: score >= 0.72 ? "prepared" : score >= 0.52 ? "uncertain" : "misaligned",
      basis: { anticipatedChallenge: round(challenge), anticipatedExpansion: round(expansion), confidence: round(confidence) }
    });
  }

  return deepFreeze({
    VERSION,
    RNG_NAMESPACE,
    PITCH_CLASSES,
    BASE_PRIOR,
    OBSERVABLE_CUE_VOCABULARY,
    stableHash,
    deterministicUnit,
    normalizeDistribution,
    createPublicContext,
    resolveAnticipationObservation,
    resolveAnticipationInterpretation,
    prepareBatterAnticipation,
    evaluateAnticipationDebug,
    derivePrePitchReadiness
  });
});
