(function (root, factory) {
  const countRules = root.OffensiveBuntCountRules || (typeof module === "object" && module.exports && typeof require === "function" ? require("./offensive-bunt-count-rules.js") : null);
  const api = factory(countRules);
  root.OffensiveBuntExecution = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (OffensiveBuntCountRules) {
  "use strict";

  const VERSION = "offensive-bunt-execution-v1";
  const RNG_NAMESPACES = Object.freeze({
    attempt: "offensive-bunt-attempt-v1",
    preparation: "offensive-bunt-preparation-v1",
    contact: "offensive-bunt-contact-v1",
    ball: "offensive-bunt-ball-realization-v1"
  });
  const BUNT_ACTIONS = Object.freeze(["sacrificeBunt", "surpriseBunt"]);
  const PREPARATION_STATES = Object.freeze(["set", "adjusted", "rushed", "broken"]);
  const CONTACT_RESULTS = Object.freeze(["miss", "foulContact", "fairContact"]);
  const FAIR_BALL_TYPES = Object.freeze(["groundBunt", "popBunt"]);
  const GROUND_PACES = Object.freeze(["dead", "soft", "controlled", "hard"]);
  const PLACEMENTS = Object.freeze(["firstBaseSide", "pitcherArea", "secondBaseSide", "thirdBaseSide"]);
  const PITCH_DIFFICULTY = Object.freeze({
    hitterPitch: Object.freeze({ contactAccessibility: 0.88, controlDifficulty: 0.36 }),
    competitiveStrike: Object.freeze({ contactAccessibility: 0.8, controlDifficulty: 0.42 }),
    edgeStrike: Object.freeze({ contactAccessibility: 0.58, controlDifficulty: 0.68 }),
    chasePitch: Object.freeze({ contactAccessibility: 0.34, controlDifficulty: 0.78 }),
    clearBall: Object.freeze({ contactAccessibility: 0.16, controlDifficulty: 0.86 })
  });

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  function clamp(value, minimum = 0, maximum = 1, fallback = minimum) {
    const numeric = Number(value);
    return Math.max(minimum, Math.min(maximum, Number.isFinite(numeric) ? numeric : fallback));
  }
  function round(value, digits = 4) {
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
  function deterministicUnit(namespace, identity, label) {
    return stableHash(`${namespace}|${identity}|${label}`) / 4294967296;
  }
  function rollFor(input, key, namespace, identity, label) {
    return Number.isFinite(Number(input?.rolls?.[key])) ? clamp(input.rolls[key]) : deterministicUnit(namespace, identity, label);
  }
  function createProvisionalBuntExecutionFit(input = {}) {
    const batting = clamp((Number(input.batting) || 0) / 20);
    const reaction = clamp((Number(input.reaction) || 0) / 20);
    const baseballIQ = clamp((Number(input.baseballIQ) || 0) / 20);
    const ballSense = clamp((Number(input.ballSense) || 0) / 20);
    return deepFreeze({
      version: "provisional-bunt-execution-fit-v1",
      source: "provisionalExistingCapabilities",
      value: round(0.42 * batting + 0.24 * reaction + 0.22 * baseballIQ + 0.12 * ballSense),
      components: { batting: round(batting), reaction: round(reaction), baseballIQ: round(baseballIQ), ballSense: round(ballSense) }
    });
  }
  function createPATacticalPlan(input = {}) {
    const actionState = input.actionState || {};
    const action = BUNT_ACTIONS.includes(input.selectedTacticalAction) ? input.selectedTacticalAction
      : BUNT_ACTIONS.includes(actionState.selectedTacticalAction) ? actionState.selectedTacticalAction : "standardAttack";
    const identity = String(input.identity || actionState.identity || "tactical-pa");
    return deepFreeze({
      version: VERSION,
      identity,
      selectedTacticalAction: action,
      status: input.status || (BUNT_ACTIONS.includes(action) ? "active" : "notApplicable"),
      revealTiming: input.revealTiming || actionState.revealTiming || "none",
      currentPitchTacticalState: input.currentPitchTacticalState ? clone(input.currentPitchTacticalState) : null,
      count: OffensiveBuntCountRules ? OffensiveBuntCountRules.normalizeCount(input.count) : { balls: 0, strikes: 0 },
      pitchNumber: Math.max(0, Math.floor(Number(input.pitchNumber) || 0)),
      pitchHistory: Array.isArray(input.pitchHistory) ? clone(input.pitchHistory) : [],
      completed: input.completed === true,
      cancelled: input.cancelled === true,
      endReason: typeof input.endReason === "string" ? input.endReason : "",
      paResult: typeof input.paResult === "string" ? input.paResult : "",
      runnerExecutionDeferred: true,
      defensiveExecutionDeferred: true
    });
  }
  function normalizePATacticalPlan(saved) {
    return saved && typeof saved === "object" ? createPATacticalPlan(clone(saved)) : null;
  }
  function createCurrentPitchTacticalCommitment(plan, input = {}) {
    const normalized = normalizePATacticalPlan(plan);
    if (!normalized || normalized.completed || normalized.cancelled || normalized.status !== "active") return null;
    return deepFreeze({
      version: "current-pitch-tactical-commitment-v1",
      pitchIdentity: `${normalized.identity}|pitch-${normalized.pitchNumber + 1}`,
      pitchNumber: normalized.pitchNumber + 1,
      commitment: BUNT_ACTIONS.includes(normalized.selectedTacticalAction) ? "buntPrepared" : "normal",
      revealTiming: input.revealTiming || normalized.revealTiming,
      planIdentity: normalized.identity
    });
  }
  function normalizeActualPitch(input = {}) {
    const pitchLocationClass = PITCH_DIFFICULTY[input.pitchLocationClass] ? input.pitchLocationClass : "competitiveStrike";
    return deepFreeze({
      pitchLocationClass,
      strike: input.strike === undefined ? !["chasePitch", "clearBall"].includes(pitchLocationClass) : input.strike === true,
      pitchId: typeof input.pitchId === "string" ? input.pitchId : ""
    });
  }
  function normalizeRecognition(input = {}, actualPitch = {}) {
    return deepFreeze({
      correct: input.correct === true,
      perceivedPitchClass: PITCH_DIFFICULTY[input.perceivedPitchClass] ? input.perceivedPitchClass : actualPitch.pitchLocationClass,
      authority: input.authority || "existingActualPitchRecognition"
    });
  }
  function resolveAttemptHold(input = {}) {
    const actualPitch = normalizeActualPitch(input.actualPitch);
    const recognition = normalizeRecognition(input.recognition, actualPitch);
    const difficulty = PITCH_DIFFICULTY[actualPitch.pitchLocationClass];
    const fit = input.provisionalBuntFit?.version ? input.provisionalBuntFit : createProvisionalBuntExecutionFit(input.capabilities);
    let attemptProbability = 0.24 + difficulty.contactAccessibility * 0.62 + fit.value * 0.08;
    if (recognition.correct && !actualPitch.strike) attemptProbability -= actualPitch.pitchLocationClass === "clearBall" ? 0.48 : 0.25;
    if (!recognition.correct) attemptProbability += 0.08;
    attemptProbability = clamp(attemptProbability, 0.05, 0.96);
    const roll = rollFor(input, "attempt", RNG_NAMESPACES.attempt, input.pitchCommitment?.pitchIdentity || "bunt-pitch", "attempt-hold");
    return deepFreeze({ attemptDecision: roll < attemptProbability ? "attempt" : "hold", attemptProbability: round(attemptProbability), roll });
  }
  function resolvePreparation(input = {}) {
    const actualPitch = normalizeActualPitch(input.actualPitch);
    const recognition = normalizeRecognition(input.recognition, actualPitch);
    const fit = input.provisionalBuntFit?.version ? input.provisionalBuntFit : createProvisionalBuntExecutionFit(input.capabilities);
    const difficulty = PITCH_DIFFICULTY[actualPitch.pitchLocationClass];
    const revealBonus = input.revealTiming === "early" ? 0.2 : input.revealTiming === "late" ? -0.08 : 0;
    const recognitionModifier = recognition.correct ? 0.08 : -0.08;
    const stability = clamp(0.25 + fit.value * 0.42 + revealBonus + recognitionModifier - difficulty.controlDifficulty * 0.14, 0.08, 0.9);
    const roll = rollFor(input, "preparation", RNG_NAMESPACES.preparation, input.pitchCommitment?.pitchIdentity || "bunt-pitch", "preparation");
    const setLimit = stability * 0.48;
    const adjustedLimit = setLimit + 0.26 + stability * 0.12;
    const rushedLimit = Math.min(0.94, adjustedLimit + 0.2);
    const preparationState = roll < setLimit ? "set" : roll < adjustedLimit ? "adjusted" : roll < rushedLimit ? "rushed" : "broken";
    return deepFreeze({ preparationState, stability: round(stability), roll });
  }
  function resolveContact(input = {}) {
    const actualPitch = normalizeActualPitch(input.actualPitch);
    const recognition = normalizeRecognition(input.recognition, actualPitch);
    const fit = input.provisionalBuntFit?.version ? input.provisionalBuntFit : createProvisionalBuntExecutionFit(input.capabilities);
    const difficulty = PITCH_DIFFICULTY[actualPitch.pitchLocationClass];
    const prep = { set: 0.16, adjusted: 0.07, rushed: -0.09, broken: -0.2 }[input.preparationState] || 0;
    const recognitionModifier = recognition.correct ? 0.05 : -0.05;
    const fairProbability = clamp(0.16 + difficulty.contactAccessibility * 0.42 + fit.value * 0.3 + prep + recognitionModifier, 0.05, 0.82);
    const missProbability = clamp(0.48 - difficulty.contactAccessibility * 0.24 - fit.value * 0.16 - prep * 0.35 - recognitionModifier * 0.3, 0.08, 0.58);
    const roll = rollFor(input, "contact", RNG_NAMESPACES.contact, input.pitchCommitment?.pitchIdentity || "bunt-pitch", "contact");
    const contactResult = roll < missProbability ? "miss" : roll < missProbability + (1 - missProbability - fairProbability) ? "foulContact" : "fairContact";
    return deepFreeze({ contactResult, fairProbability: round(fairProbability), missProbability: round(missProbability), roll });
  }
  function realizeFairBuntBall(input = {}) {
    if (input.contactResult !== "fairContact") return null;
    const identity = input.pitchCommitment?.pitchIdentity || "bunt-pitch";
    const prepPopModifier = input.preparationState === "broken" ? 0.14 : input.preparationState === "rushed" ? 0.07 : 0;
    const typeRoll = rollFor(input, "fairBallType", RNG_NAMESPACES.ball, identity, "fair-ball-type");
    const fairBallType = typeRoll < 0.18 + prepPopModifier ? "popBunt" : "groundBunt";
    if (fairBallType === "popBunt") return deepFreeze({ fairBallType, pace: null, placement: null, typeRoll });
    const paceRoll = rollFor(input, "pace", RNG_NAMESPACES.ball, identity, "ground-pace");
    const placementRoll = rollFor(input, "placement", RNG_NAMESPACES.ball, identity, "ground-placement");
    const pace = GROUND_PACES[Math.min(3, Math.floor(paceRoll * 4))];
    const placement = PLACEMENTS[Math.min(3, Math.floor(placementRoll * 4))];
    return deepFreeze({ fairBallType, pace, placement, typeRoll, paceRoll, placementRoll });
  }
  function resolveBuntPitch(input = {}) {
    const plan = normalizePATacticalPlan(input.plan);
    if (!plan || plan.status !== "active" || plan.completed || plan.cancelled || !BUNT_ACTIONS.includes(plan.selectedTacticalAction)) return null;
    const pitchCommitment = input.pitchCommitment || createCurrentPitchTacticalCommitment(plan, { revealTiming: input.revealTiming });
    if (!pitchCommitment || pitchCommitment.commitment !== "buntPrepared") return null;
    const actualPitch = normalizeActualPitch(input.actualPitch);
    const recognition = normalizeRecognition(input.recognition, actualPitch);
    const provisionalBuntFit = input.provisionalBuntFit?.version ? deepFreeze(clone(input.provisionalBuntFit)) : createProvisionalBuntExecutionFit(input.capabilities);
    const attempt = resolveAttemptHold({ ...input, pitchCommitment, actualPitch, recognition, provisionalBuntFit });
    let preparation = null;
    let contact = null;
    let ball = null;
    if (attempt.attemptDecision === "attempt") {
      preparation = resolvePreparation({ ...input, pitchCommitment, actualPitch, recognition, provisionalBuntFit, revealTiming: pitchCommitment.revealTiming });
      contact = resolveContact({ ...input, pitchCommitment, actualPitch, recognition, provisionalBuntFit, preparationState: preparation.preparationState });
      ball = realizeFairBuntBall({ ...input, pitchCommitment, contactResult: contact.contactResult, preparationState: preparation.preparationState });
    }
    return deepFreeze({
      version: VERSION,
      paTacticalPlan: { identity: plan.identity, selectedTacticalAction: plan.selectedTacticalAction, status: plan.status },
      currentPitchTacticalCommitment: pitchCommitment,
      revealTiming: pitchCommitment.revealTiming,
      actualPitch,
      recognition,
      attemptDecision: attempt.attemptDecision,
      preparationState: preparation?.preparationState || null,
      provisionalBuntExecutionFit: provisionalBuntFit,
      contactResult: contact?.contactResult || null,
      fairBallType: ball?.fairBallType || null,
      pace: ball?.pace || null,
      placement: ball?.placement || null,
      executionEvidence: { attempt: clone(attempt), preparation: clone(preparation), contact: clone(contact), ball: clone(ball) },
      runnerMovement: null,
      runnerTargets: null,
      defensiveRoutes: null,
      batterOut: false,
      finalOutcome: null
    });
  }
  function advancePATacticalPlan(plan, buntResolution, countResult) {
    const normalized = normalizePATacticalPlan(plan);
    if (!normalized || !buntResolution || !countResult) return normalized;
    const record = { pitchNumber: normalized.pitchNumber + 1, buntResolution: clone(buntResolution), countResult: clone(countResult) };
    return createPATacticalPlan({
      ...clone(normalized),
      currentPitchTacticalState: clone(buntResolution.currentPitchTacticalCommitment),
      count: clone(countResult.countAfter),
      pitchNumber: normalized.pitchNumber + 1,
      pitchHistory: [...normalized.pitchHistory, record],
      completed: countResult.paEnded,
      status: countResult.paEnded ? "completed" : normalized.status,
      endReason: countResult.endReason,
      paResult: countResult.paResult
    });
  }
  function cancelPATacticalPlan(plan, reason = "explicitCancellation") {
    const normalized = normalizePATacticalPlan(plan);
    return normalized ? createPATacticalPlan({ ...clone(normalized), status: "cancelled", cancelled: true, endReason: reason }) : null;
  }
  function resolveAndAdvanceBuntPitch(input = {}) {
    if (!OffensiveBuntCountRules) throw new Error("OffensiveBuntCountRules is required");
    const resolution = resolveBuntPitch(input);
    if (!resolution) return deepFreeze({ plan: normalizePATacticalPlan(input.plan), resolution: null, countResult: null });
    const countResult = OffensiveBuntCountRules.resolveBuntPitchCount({ count: input.plan?.count, actualPitch: resolution.actualPitch, buntResolution: resolution });
    const plan = advancePATacticalPlan(input.plan, resolution, countResult);
    return deepFreeze({ plan, resolution, countResult, debugTrace: {
      paTacticalPlan: clone(resolution.paTacticalPlan),
      currentPitchTacticalCommitment: clone(resolution.currentPitchTacticalCommitment),
      revealTiming: resolution.revealTiming,
      actualPitch: clone(resolution.actualPitch),
      recognition: clone(resolution.recognition),
      attemptDecision: resolution.attemptDecision,
      preparationState: resolution.preparationState,
      provisionalBuntExecutionFit: clone(resolution.provisionalBuntExecutionFit),
      contactResult: resolution.contactResult,
      fairBallType: resolution.fairBallType,
      pace: resolution.pace,
      placement: resolution.placement,
      countResult: clone(countResult),
      paContinues: !countResult.paEnded,
      paEnds: countResult.paEnded
    } });
  }
  function formatBuntPhysicalTruth(resolution) {
    if (!resolution) return "";
    if (resolution.attemptDecision === "hold") return "打者收回短棒，讓這顆球通過。";
    if (resolution.contactResult === "miss") return "打者伸棒觸擊，但沒有碰到球。";
    if (resolution.contactResult === "foulContact") return "打者碰到球，但球落入界外。";
    if (resolution.fairBallType === "popBunt") return "打者把球點成空中的短飛球。";
    const side = { firstBaseSide: "一壘手一側", pitcherArea: "投手附近", secondBaseSide: "二壘手一側", thirdBaseSide: "三壘手一側" }[resolution.placement] || "內野前方";
    const pace = { dead: "幾乎停在本壘附近", soft: "緩慢滾動", controlled: "以受控速度滾動", hard: "出去得偏強" }[resolution.pace] || "向前滾動";
    return `打者把球點進場內，球沿${side}${pace}。`;
  }

  return deepFreeze({
    VERSION, RNG_NAMESPACES, BUNT_ACTIONS, PREPARATION_STATES, CONTACT_RESULTS, FAIR_BALL_TYPES, GROUND_PACES, PLACEMENTS, PITCH_DIFFICULTY,
    stableHash, deterministicUnit, createProvisionalBuntExecutionFit, createPATacticalPlan, normalizePATacticalPlan,
    createCurrentPitchTacticalCommitment, normalizeActualPitch, normalizeRecognition, resolveAttemptHold, resolvePreparation,
    resolveContact, realizeFairBuntBall, resolveBuntPitch, advancePATacticalPlan, cancelPATacticalPlan, resolveAndAdvanceBuntPitch,
    formatBuntPhysicalTruth
  });
});
