(function (root, factory) {
  const api = factory();
  root.PitcherMentalState = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "pitcher-mental-state-v1";
  const STIMULI = Object.freeze([
    "walk", "consecutiveWalk", "hit", "extraBaseHit", "strikeout",
    "runAllowed", "defensiveError", "cleanInning", "escapeJam"
  ]);
  const RESPONSE_PROFILE_FIXTURES = Object.freeze({
    simplifyReset: Object.freeze({
      id: "simplifyReset",
      pressureProcessing: "simplify",
      failureResponse: "reset",
      responsibilityStyle: "distribute"
    }),
    elaborateInternalize: Object.freeze({
      id: "elaborateInternalize",
      pressureProcessing: "elaborate",
      failureResponse: "persist",
      responsibilityStyle: "internalize"
    })
  });

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function clamp(value, minimum = 0, maximum = 100, fallback = 50) {
    const numeric = Number(value);
    return Math.max(minimum, Math.min(maximum, Number.isFinite(numeric) ? numeric : fallback));
  }

  function round(value, digits = 3) {
    const scale = 10 ** digits;
    return Math.round((Number(value) || 0) * scale) / scale;
  }

  function createResponseProfile(input = RESPONSE_PROFILE_FIXTURES.simplifyReset) {
    const source = typeof input === "string" ? RESPONSE_PROFILE_FIXTURES[input] : input;
    const profile = source && typeof source === "object" ? source : RESPONSE_PROFILE_FIXTURES.simplifyReset;
    return deepFreeze({
      id: typeof profile.id === "string" ? profile.id : "provisionalResponseProfile",
      pressureProcessing: ["simplify", "elaborate"].includes(profile.pressureProcessing) ? profile.pressureProcessing : "simplify",
      failureResponse: ["persist", "reset"].includes(profile.failureResponse) ? profile.failureResponse : "reset",
      responsibilityStyle: ["internalize", "distribute"].includes(profile.responsibilityStyle) ? profile.responsibilityStyle : "distribute"
    });
  }

  function createMentalState(input = {}) {
    return deepFreeze({
      version: VERSION,
      arousal: round(clamp(input.arousal, 0, 100, 50)),
      confidence: round(clamp(input.confidence, 0, 100, 50)),
      cognitiveLoad: round(clamp(input.cognitiveLoad, 0, 100, 40)),
      resultAttachment: round(clamp(input.resultAttachment, 0, 100, 35))
    });
  }

  function normalizeMentalState(saved) {
    return createMentalState(saved && typeof saved === "object" ? saved : {});
  }

  const BASE_STIMULUS_DELTAS = Object.freeze({
    walk: Object.freeze({ arousal: 4, confidence: -2, cognitiveLoad: 5, resultAttachment: 4 }),
    consecutiveWalk: Object.freeze({ arousal: 8, confidence: -5, cognitiveLoad: 8, resultAttachment: 8 }),
    hit: Object.freeze({ arousal: 3, confidence: -2, cognitiveLoad: 3, resultAttachment: 4 }),
    extraBaseHit: Object.freeze({ arousal: 7, confidence: -5, cognitiveLoad: 6, resultAttachment: 8 }),
    strikeout: Object.freeze({ arousal: -2, confidence: 3, cognitiveLoad: -3, resultAttachment: -2 }),
    runAllowed: Object.freeze({ arousal: 6, confidence: -5, cognitiveLoad: 5, resultAttachment: 9 }),
    defensiveError: Object.freeze({ arousal: 4, confidence: -1, cognitiveLoad: 4, resultAttachment: 5 }),
    cleanInning: Object.freeze({ arousal: -5, confidence: 5, cognitiveLoad: -7, resultAttachment: -6 }),
    escapeJam: Object.freeze({ arousal: -3, confidence: 7, cognitiveLoad: -6, resultAttachment: -7 })
  });

  function transitionMentalState(previousState, stimulus, responseProfile) {
    const before = normalizeMentalState(previousState);
    const profile = createResponseProfile(responseProfile);
    const requestedStimulus = stimulus === undefined ? null : stimulus;
    const requestedStimulusType = stimulus === null ? "null" : typeof stimulus;
    const normalizedStimulus = STIMULI.includes(stimulus) ? stimulus : null;
    if (!normalizedStimulus) {
      return deepFreeze({
        version: VERSION,
        mentalStateBefore: clone(before),
        requestedStimulus,
        requestedStimulusType,
        normalizedStimulus: null,
        mentalStimulus: null,
        transitionApplied: false,
        reason: "unsupportedStimulus",
        responseProfile: clone(profile),
        appliedDelta: Object.freeze({ arousal: 0, confidence: 0, cognitiveLoad: 0, resultAttachment: 0 }),
        mentalStateAfter: clone(before)
      });
    }
    const delta = { ...BASE_STIMULUS_DELTAS[normalizedStimulus] };
    const adverse = ["walk", "consecutiveWalk", "hit", "extraBaseHit", "runAllowed", "defensiveError"].includes(normalizedStimulus);

    if (adverse && profile.pressureProcessing === "simplify") {
      delta.cognitiveLoad -= normalizedStimulus === "consecutiveWalk" ? 18 : 8;
      delta.arousal -= 2;
    } else if (adverse && profile.pressureProcessing === "elaborate") {
      delta.cognitiveLoad += normalizedStimulus === "consecutiveWalk" ? 8 : 4;
    }
    if (adverse && profile.failureResponse === "reset") {
      delta.resultAttachment -= normalizedStimulus === "consecutiveWalk" ? 12 : 6;
    } else if (adverse && profile.failureResponse === "persist") {
      delta.resultAttachment += normalizedStimulus === "consecutiveWalk" ? 6 : 3;
    }
    if (adverse && profile.responsibilityStyle === "internalize") {
      delta.resultAttachment += 4;
      delta.confidence -= 2;
    } else if (adverse && profile.responsibilityStyle === "distribute") {
      delta.resultAttachment -= 2;
    }

    const after = createMentalState({
      arousal: before.arousal + delta.arousal,
      confidence: before.confidence + delta.confidence,
      cognitiveLoad: before.cognitiveLoad + delta.cognitiveLoad,
      resultAttachment: before.resultAttachment + delta.resultAttachment
    });
    return deepFreeze({
      version: VERSION,
      mentalStateBefore: clone(before),
      requestedStimulus,
      requestedStimulusType,
      normalizedStimulus,
      mentalStimulus: normalizedStimulus,
      transitionApplied: true,
      reason: "applied",
      responseProfile: clone(profile),
      appliedDelta: Object.freeze(Object.fromEntries(Object.entries(delta).map(([key, value]) => [key, round(value)]))),
      mentalStateAfter: clone(after)
    });
  }

  return deepFreeze({
    VERSION,
    STIMULI,
    RESPONSE_PROFILE_FIXTURES,
    createResponseProfile,
    createMentalState,
    normalizeMentalState,
    transitionMentalState
  });
});
