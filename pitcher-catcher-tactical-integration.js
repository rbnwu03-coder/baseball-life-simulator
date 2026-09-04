(function (root, factory) {
  const sequencing = root.PitchSequencing || (typeof module === "object" && module.exports && typeof require === "function" ? require("./pitch-sequencing.js") : null);
  const api = factory(sequencing);
  root.PitcherCatcherTacticalIntegration = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (PitchSequencing) {
  "use strict";

  const VERSION = "pitcher-catcher-tactical-integration-v1";
  const RNG_NAMESPACE = "pitcher-catcher-tactical-v1";
  const TACTICAL_INTENTS = Object.freeze(["challenge", "expand", "repeatSuccess", "changeLook"]);
  const ABSTRACT_TARGETS = Object.freeze(["middle", "inner", "outer", "low", "high", "outerLow", "innerLow"]);
  const HISTORY_LIMIT = 6;
  const CLASS_TARGETS = Object.freeze({
    hitterPitch: "middle",
    competitiveStrike: "outer",
    edgeStrike: "outerLow",
    chasePitch: "outerLow",
    clearBall: "outer"
  });

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
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

  function normalizeObservableResponse(input = {}) {
    return deepFreeze({
      took: input.took === true,
      chased: input.chased === true,
      whiffed: input.whiffed === true,
      fouled: input.fouled === true,
      contacted: input.contacted === true,
      hardContactObservable: input.hardContactObservable === true,
      lateSwingObservable: input.lateSwingObservable === true
    });
  }

  function normalizeFeedback(input = {}) {
    if (!input || typeof input !== "object") return null;
    const pitchClass = PitchSequencing.PITCH_CLASSES.includes(input.actualPitchClass) ? input.actualPitchClass : "";
    const recommendedPitchClass = PitchSequencing.PITCH_CLASSES.includes(input.recommendedPitchClass) ? input.recommendedPitchClass : "";
    if (!pitchClass && !recommendedPitchClass) return null;
    return deepFreeze({
      version: VERSION,
      tacticalIdentity: typeof input.tacticalIdentity === "string" ? input.tacticalIdentity : "",
      pitchIdentity: typeof input.pitchIdentity === "string" ? input.pitchIdentity : "",
      intent: TACTICAL_INTENTS.includes(input.intent) ? input.intent : "challenge",
      recommendedPitchClass,
      target: ABSTRACT_TARGETS.includes(input.target) ? input.target : "middle",
      actualPitchClass: pitchClass,
      actualLocation: typeof input.actualLocation === "string" ? input.actualLocation : "unknown",
      pitchResult: typeof input.pitchResult === "string" ? input.pitchResult : "",
      batterAction: input.batterAction === "swing" || input.batterAction === "take" ? input.batterAction : "unknown",
      observableBatterResponse: normalizeObservableResponse(input.observableBatterResponse),
      executionQuality: ["heldTarget", "adjacentDrift", "majorDrift", "unknown"].includes(input.executionQuality) ? input.executionQuality : "unknown"
    });
  }

  function normalizeSequenceHistory(history) {
    return deepFreeze((Array.isArray(history) ? history : []).map(normalizeFeedback).filter(Boolean).slice(-HISTORY_LIMIT));
  }

  function summarizePreviousSwingResponse(previous) {
    const response = previous?.observableBatterResponse;
    if (!response) return "none";
    if (response.hardContactObservable) return "hardContactObservable";
    if (response.whiffed) return "whiffed";
    if (response.chased) return "chased";
    if (response.fouled) return "fouled";
    if (response.contacted) return "contacted";
    if (response.took) return "took";
    return "none";
  }

  function buildTacticalContext(input = {}) {
    const history = normalizeSequenceHistory(input.sequenceHistory);
    const previous = history.at(-1) || null;
    const balls = Math.max(0, Math.min(3, Math.floor(Number(input.balls) || 0)));
    const strikes = Math.max(0, Math.min(2, Math.floor(Number(input.strikes) || 0)));
    const pitchIndex = Math.max(1, Math.floor(Number(input.pitchIndex) || 1));
    const paIdentity = input.paIdentity || "pa";
    const pitchIdentity = input.pitchIdentity || `${paIdentity}|pitch-${pitchIndex}`;
    const runtime = input.pitcherRuntime && typeof input.pitcherRuntime === "object" ? input.pitcherRuntime : {};
    const explicitRecentPitchClasses = Array.isArray(input.recentPitchClasses)
      ? input.recentPitchClasses.filter(item => PitchSequencing.PITCH_CLASSES.includes(item)).slice(-HISTORY_LIMIT) : [];
    const recentPitchClasses = explicitRecentPitchClasses.length
      ? explicitRecentPitchClasses : history.map(item => item.actualPitchClass).filter(Boolean).slice(-HISTORY_LIMIT);
    return deepFreeze({
      version: VERSION,
      tacticalIdentity: `${pitchIdentity}|tactical`,
      gameIdentity: input.gameIdentity || input.context?.gameId || String(paIdentity).split("|")[0] || "match",
      paIdentity,
      pitchIndex,
      pitchIdentity,
      count: { balls, strikes },
      outs: Math.max(0, Math.min(3, Number(input.context?.outs) || 0)),
      bases: clone(input.context?.runners || []),
      score: clone(input.context?.scores || {}),
      highLeverage: input.context?.highLeverage === true,
      scoringPosition: input.context?.scoringPosition === true,
      pitcherState: {
        control: Number(runtime.control) || 0,
        mentalState: clone(runtime.mentalState || {}),
        processState: clone(runtime.processState || {})
      },
      recentPitchClasses,
      previousPitchResult: previous?.pitchResult || "",
      previousBatterDecision: previous?.batterAction || "",
      previousRecognitionQuality: previous?.observableBatterResponse?.lateSwingObservable ? "lateSwingObservable" : "notObservable",
      previousSwingContactResponse: summarizePreviousSwingResponse(previous),
      previousCommandResult: previous?.executionQuality || "",
      previousFeedback: clone(previous),
      sequenceHistory: clone(history)
    });
  }

  function consecutiveSameRecommendations(history) {
    const classes = history.map(item => item.recommendedPitchClass).filter(Boolean);
    if (!classes.length) return 0;
    const latest = classes.at(-1);
    let count = 0;
    for (let index = classes.length - 1; index >= 0 && classes[index] === latest; index -= 1) count += 1;
    return count;
  }

  function chooseWeightedIntent(scores, roll) {
    const eligible = TACTICAL_INTENTS.filter(intent => scores[intent] > 0);
    const total = eligible.reduce((sum, intent) => sum + scores[intent], 0);
    let cursor = Math.max(0, Math.min(0.999999999, roll)) * total;
    for (const intent of eligible) {
      cursor -= scores[intent];
      if (cursor < 0) return intent;
    }
    return eligible.at(-1) || "challenge";
  }

  function chooseTacticalIntent(context, options = {}) {
    const previous = context.previousFeedback;
    const response = previous?.observableBatterResponse || {};
    const repeatFailed = previous?.intent === "repeatSuccess" && response.hardContactObservable;
    const repeatEligible = !repeatFailed && Boolean(previous?.recommendedPitchClass) && (response.chased || response.whiffed);
    const repeatedCalls = consecutiveSameRecommendations(context.sequenceHistory || []);
    const scores = {
      challenge: context.count.balls === 3 ? 1.15 : 0.5,
      expand: context.count.strikes === 2 && context.count.balls < 3 ? 1.05 : 0.24,
      repeatSuccess: repeatEligible ? 0.95 : 0,
      changeLook: repeatedCalls >= 2 || response.hardContactObservable ? 0.82 : 0.22
    };
    const process = context.pitcherState?.processState || {};
    const mental = context.pitcherState?.mentalState || {};
    if ((Number(mental.cognitiveLoad) || 0) >= 68 || context.previousCommandResult === "majorDrift") {
      scores.challenge += 0.3;
      scores.expand = Math.max(0.08, scores.expand - 0.18);
    }
    if (repeatFailed) scores.changeLook += 0.55;
    const roll = Number.isFinite(Number(options.roll)) ? Math.max(0, Math.min(0.999999999, Number(options.roll)))
      : deterministicUnit(context.tacticalIdentity, "intent");
    const selectedIntent = TACTICAL_INTENTS.includes(options.intentOverride)
      ? options.intentOverride : chooseWeightedIntent(scores, roll);
    return deepFreeze({
      version: VERSION,
      selectedIntent,
      intentRoll: round(roll),
      candidateScores: clone(scores),
      eligibility: { repeatSuccess: repeatEligible, changeLook: repeatedCalls >= 2 || response.hardContactObservable === true },
      safeguards: { repeatFailureObserved: repeatFailed, noStickySuccess: repeatFailed && scores.repeatSuccess === 0 }
    });
  }

  function supportedClasses(frozenDistribution) {
    const distribution = frozenDistribution?.finalFrozenDistribution || {};
    return PitchSequencing.PITCH_CLASSES.filter(pitchClass => Number(distribution[pitchClass]) > 0);
  }

  function highestWeighted(classes, distribution) {
    return classes.slice().sort((a, b) => (Number(distribution[b]) || 0) - (Number(distribution[a]) || 0))[0] || "competitiveStrike";
  }

  function chooseDifferentLook(available, previousClass, distribution) {
    if (!PitchSequencing.PITCH_CLASSES.includes(previousClass)) return highestWeighted(available, distribution);
    const previousIndex = PitchSequencing.PITCH_CLASS_TOPOLOGY[previousClass];
    return available.slice().sort((a, b) => {
      const distance = Math.abs(PitchSequencing.PITCH_CLASS_TOPOLOGY[b] - previousIndex) - Math.abs(PitchSequencing.PITCH_CLASS_TOPOLOGY[a] - previousIndex);
      return distance || (Number(distribution[b]) || 0) - (Number(distribution[a]) || 0);
    })[0];
  }

  function buildReasonCodes(context, intent) {
    const previous = context.previousFeedback;
    const response = previous?.observableBatterResponse || {};
    const reasons = [];
    if (context.count.strikes === 2 || context.count.balls === 3) reasons.push("countPressure");
    if (intent === "repeatSuccess") reasons.push("recentSuccess");
    if (response.chased || response.whiffed) reasons.push("batterChase");
    if (response.hardContactObservable) reasons.push("batterHardContact");
    if (context.previousCommandResult === "majorDrift" || (Number(context.pitcherState?.mentalState?.cognitiveLoad) || 0) >= 68) reasons.push("commandConcern");
    if (intent === "changeLook" && consecutiveSameRecommendations(context.sequenceHistory || []) >= 2) reasons.push("changeLookAfterRepeat");
    return reasons.length ? reasons : ["contextualPlan"];
  }

  function buildCatcherRecommendation(context, intentDecision, frozenDistribution) {
    const distribution = frozenDistribution?.finalFrozenDistribution || {};
    const available = supportedClasses(frozenDistribution);
    const intent = intentDecision.selectedIntent;
    const previous = context.previousFeedback;
    let preferred = "competitiveStrike";
    if (intent === "challenge") preferred = highestWeighted(available.filter(item => ["hitterPitch", "competitiveStrike"].includes(item)), distribution);
    if (intent === "expand") preferred = highestWeighted(available.filter(item => ["edgeStrike", "chasePitch"].includes(item)), distribution);
    if (intent === "repeatSuccess") preferred = previous?.recommendedPitchClass || previous?.actualPitchClass || preferred;
    if (intent === "changeLook") preferred = chooseDifferentLook(available, previous?.recommendedPitchClass || context.recentPitchClasses.at(-1), distribution);
    const compatiblePitchClass = available.includes(preferred) ? preferred : highestWeighted(available, distribution);
    const target = intent === "repeatSuccess" && ABSTRACT_TARGETS.includes(previous?.target)
      ? previous.target : CLASS_TARGETS[compatiblePitchClass] || "middle";
    return deepFreeze({
      version: VERSION,
      recommendationIdentity: `${context.tacticalIdentity}|catcher-recommendation`,
      tacticalIntent: intent,
      recommendedPitchClass: compatiblePitchClass,
      targetLocation: target,
      reasonCodes: buildReasonCodes(context, intent),
      compatibility: {
        availablePitchClasses: available,
        originalPreferredPitchClass: preferred,
        adjusted: preferred !== compatiblePitchClass
      }
    });
  }

  function biasPitchDistribution(frozenDistribution, recommendation) {
    const source = frozenDistribution?.finalFrozenDistribution || {};
    const biased = Object.fromEntries(PitchSequencing.PITCH_CLASSES.map(pitchClass => [
      pitchClass,
      (Number(source[pitchClass]) || 0) * (pitchClass === recommendation.recommendedPitchClass ? 2.4 : 1)
    ]));
    return PitchSequencing.freezePitchDistribution({
      baseDistribution: frozenDistribution?.baseDistribution,
      contextModifiers: frozenDistribution?.contextModifiers,
      processModifiers: frozenDistribution?.processModifiers,
      strategicDistribution: PitchSequencing.normalizeDistribution(biased),
      context: frozenDistribution?.frozenContext
    });
  }

  function createAutomaticPitcherResponse(recommendation, frozenDistribution) {
    const available = supportedClasses(frozenDistribution);
    const acceptedPitchClass = available.includes(recommendation.recommendedPitchClass)
      ? recommendation.recommendedPitchClass : highestWeighted(available, frozenDistribution?.finalFrozenDistribution || {});
    return deepFreeze({
      version: VERSION,
      recommended: true,
      accepted: true,
      source: "automaticCompatibility",
      acceptedPitchClass,
      targetLocation: recommendation.targetLocation,
      compatibilityAdjusted: acceptedPitchClass !== recommendation.recommendedPitchClass
    });
  }

  function createTacticalPitchDecision(input = {}) {
    const context = buildTacticalContext(input);
    const runtime = input.pitcherRuntime || {};
    const strategicPlan = input.frozenDistribution ? null : PitchSequencing.buildStrategicPitchDistribution({
      balls: context.count.balls,
      strikes: context.count.strikes,
      recentPitchClasses: context.recentPitchClasses,
      previousPAResult: input.previousPAResult,
      scoringPosition: context.scoringPosition,
      highLeverage: context.highLeverage
    }, runtime.processState);
    const baseFrozenDistribution = PitchSequencing.freezePitchDistribution(input.frozenDistribution || strategicPlan);
    const intentDecision = chooseTacticalIntent(context, { roll: input.intentRoll, intentOverride: input.intentOverride });
    const catcherRecommendation = buildCatcherRecommendation(context, intentDecision, baseFrozenDistribution);
    const pitcherResponse = createAutomaticPitcherResponse(catcherRecommendation, baseFrozenDistribution);
    const acceptedDistribution = biasPitchDistribution(baseFrozenDistribution, catcherRecommendation);
    const pitchDecision = PitchSequencing.createPitchDecision({
      paIdentity: context.paIdentity,
      pitchNumber: context.pitchIndex,
      balls: context.count.balls,
      strikes: context.count.strikes,
      recentPitchClasses: context.recentPitchClasses,
      previousPAResult: input.previousPAResult,
      scoringPosition: context.scoringPosition,
      highLeverage: context.highLeverage,
      pitcherRuntime: runtime,
      frozenDistribution: acceptedDistribution,
      intendedPitchClassOverride: pitcherResponse.acceptedPitchClass,
      realizationRoll: input.realizationRoll
    });
    return deepFreeze({
      version: VERSION,
      tacticalIdentity: context.tacticalIdentity,
      context,
      intentDecision,
      catcherRecommendation,
      pitcherResponse,
      baseFrozenDistribution,
      acceptedDistribution,
      pitchDecision,
      developerTrace: {
        context: { count: clone(context.count), previousSwingContactResponse: context.previousSwingContactResponse, previousCommandResult: context.previousCommandResult },
        intent: intentDecision.selectedIntent,
        reasonCodes: clone(catcherRecommendation.reasonCodes),
        catcherRecommendation: { pitchClass: catcherRecommendation.recommendedPitchClass, target: catcherRecommendation.targetLocation },
        pitcherResponse: clone(pitcherResponse),
        execution: { intendedPitchClass: pitchDecision.intendedPitchClass, actualPitchClass: pitchDecision.actualPitchClass, realizationQuality: pitchDecision.controlRealization.realizationQuality }
      }
    });
  }

  function recordPitchTacticalFeedback(tacticalState, event = {}) {
    if (!tacticalState?.catcherRecommendation || !event?.pitch) return null;
    const pitch = event.pitch;
    const action = event.action === "swing" || event.action === "take" ? event.action : "unknown";
    const outside = ["chasePitch", "clearBall"].includes(pitch.pitchLocationClass);
    const timing = event.executionEvidence?.timing;
    const lateSwingObservable = action === "swing" && Number.isFinite(Number(timing?.roll)) && Number.isFinite(Number(timing?.window))
      && Number(timing.roll) > Number(timing.window) && Number(pitch.velocity) >= 88;
    const response = normalizeObservableResponse({
      took: action === "take",
      chased: action === "swing" && outside,
      whiffed: event.pitchResult === "swingingStrike",
      fouled: event.pitchResult === "foul",
      contacted: event.contact === true,
      hardContactObservable: event.contact === true && Number(event.contactQuality) >= 0.72,
      lateSwingObservable
    });
    return normalizeFeedback({
      tacticalIdentity: tacticalState.tacticalIdentity,
      pitchIdentity: pitch.pitchId,
      intent: tacticalState.intentDecision.selectedIntent,
      recommendedPitchClass: tacticalState.catcherRecommendation.recommendedPitchClass,
      target: tacticalState.catcherRecommendation.targetLocation,
      actualPitchClass: pitch.pitchLocationClass,
      actualLocation: pitch.location,
      pitchResult: event.pitchResult,
      batterAction: action,
      observableBatterResponse: response,
      executionQuality: pitch.controlRealization?.realizationQuality || "unknown"
    });
  }

  return deepFreeze({
    VERSION,
    RNG_NAMESPACE,
    TACTICAL_INTENTS,
    ABSTRACT_TARGETS,
    HISTORY_LIMIT,
    CLASS_TARGETS,
    deterministicUnit,
    normalizeObservableResponse,
    normalizeFeedback,
    normalizeSequenceHistory,
    buildTacticalContext,
    chooseTacticalIntent,
    buildCatcherRecommendation,
    biasPitchDistribution,
    createAutomaticPitcherResponse,
    createTacticalPitchDecision,
    recordPitchTacticalFeedback
  });
});
