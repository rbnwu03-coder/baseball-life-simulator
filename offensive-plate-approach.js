(function (root, factory) {
  const sequencing = root.PitchSequencing || (typeof module === "object" && module.exports && typeof require === "function" ? require("./pitch-sequencing.js") : null);
  const battedBallPhysical = root.BattedBallPhysical || (typeof module === "object" && module.exports && typeof require === "function" ? require("./batted-ball-physical.js") : null);
  const api = factory(sequencing, battedBallPhysical);
  root.OffensivePlateApproach = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (PitchSequencing, BattedBallPhysical) {
  "use strict";

  const VERSION = "offensive-plate-approach-v1";
  const PITCH_SEED_NAMESPACE = "player-meaningful-pa-pitch-v1";
  const ABSOLUTE_PITCH_SAFETY_CAP = 15;
  const PITCH_CLASSES = Object.freeze(["hitterPitch", "competitiveStrike", "edgeStrike", "chasePitch", "clearBall"]);
  const PITCH_CLASS_PROFILES = Object.freeze({
    hitterPitch: Object.freeze({ attackability: 0.96, recognitionDifficulty: 0.18, strike: true, impression: "球往你最能延伸揮棒的甜蜜點進來" }),
    competitiveStrike: Object.freeze({ attackability: 0.76, recognitionDifficulty: 0.34, strike: true, impression: "球進入可攻擊區，但沒有停在正中央" }),
    edgeStrike: Object.freeze({ attackability: 0.48, recognitionDifficulty: 0.62, strike: true, impression: "球壓向好球帶邊角，進壘位置很勉強" }),
    chasePitch: Object.freeze({ attackability: 0.25, recognitionDifficulty: 0.72, strike: false, impression: "球從好球帶邊緣繼續往外逃" }),
    clearBall: Object.freeze({ attackability: 0.08, recognitionDifficulty: 0.14, strike: false, impression: "球明顯偏離你的攻擊區" })
  });
  const APPROACH_PACKAGES = Object.freeze({
    aggressiveEarlySwing: Object.freeze({ approach: "aggressiveEarlySwing", selectionProfile: "aggressive", swingIntent: "power" }),
    patientSelection: Object.freeze({ approach: "patientSelection", selectionProfile: "selective", swingIntent: "normal" }),
    compactContact: Object.freeze({ approach: "compactContact", selectionProfile: "balanced", swingIntent: "contact" }),
    compactLineDrive: Object.freeze({ approach: "compactLineDrive", selectionProfile: "balanced", swingIntent: "contact" }),
    balancedAttack: Object.freeze({ approach: "balancedAttack", selectionProfile: "balanced", swingIntent: "normal" })
  });
  const ATTACK_WINDOWS = Object.freeze({
    aggressive: Object.freeze({ hitterPitch: 0.98, competitiveStrike: 0.88, edgeStrike: 0.52, chasePitch: 0.09, clearBall: 0.015 }),
    balanced: Object.freeze({ hitterPitch: 0.92, competitiveStrike: 0.72, edgeStrike: 0.38, chasePitch: 0.07, clearBall: 0.012 }),
    selective: Object.freeze({ hitterPitch: 0.88, competitiveStrike: 0.52, edgeStrike: 0.16, chasePitch: 0.03, clearBall: 0.008 })
  });
  // Compatibility export name. These values are semantic attack windows, not generic approach swing bonuses.
  const SWING_TENDENCIES = ATTACK_WINDOWS;
  const ATTACK_WINDOW_LABELS = Object.freeze({
    aggressive: Object.freeze({ hitterPitch: "core", competitiveStrike: "core", edgeStrike: "conditional", chasePitch: "outside", clearBall: "clearlyOutside" }),
    balanced: Object.freeze({ hitterPitch: "core", competitiveStrike: "normal", edgeStrike: "conditional", chasePitch: "outside", clearBall: "clearlyOutside" }),
    selective: Object.freeze({ hitterPitch: "core", competitiveStrike: "conditional", edgeStrike: "outside", chasePitch: "outside", clearBall: "clearlyOutside" })
  });

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

  function deterministicUnit(identity, label) {
    return stableHash(`${PITCH_SEED_NAMESPACE}|${identity}|${label}`) / 4294967296;
  }

  function normalizeApproachPackage(approach) {
    return APPROACH_PACKAGES[approach] || APPROACH_PACKAGES.balancedAttack;
  }

  function createPlateAppearanceIdentity(input = {}) {
    return [input.matchId || "match", input.paId || input.momentId || "pa", input.batterId || "player", input.inning || 0, input.half || ""].join("|");
  }

  function createPlateAppearanceState(input = {}) {
    const approachPackage = normalizeApproachPackage(input.approach);
    return deepFreeze({
      version: VERSION,
      paIdentity: input.paIdentity || createPlateAppearanceIdentity(input),
      batterId: input.batterId || "player",
      approach: approachPackage.approach,
      selectionProfile: approachPackage.selectionProfile,
      swingIntent: approachPackage.swingIntent,
      balls: Math.floor(clamp(input.balls, 0, 4, 0)),
      strikes: Math.floor(clamp(input.strikes, 0, 3, 0)),
      pitchNumber: Math.max(0, Math.floor(Number(input.pitchNumber) || 0)),
      pendingPitch: input.pendingPitch ? clone(input.pendingPitch) : null,
      pitchHistory: Array.isArray(input.pitchHistory) ? clone(input.pitchHistory).slice(-ABSOLUTE_PITCH_SAFETY_CAP) : [],
      completed: input.completed === true,
      result: typeof input.result === "string" ? input.result : "",
      battedBallPhysicalTruth: BattedBallPhysical
        ? BattedBallPhysical.normalizeBattedBallPhysicalTruth(input.battedBallPhysicalTruth) : input.battedBallPhysicalTruth ? clone(input.battedBallPhysicalTruth) : null,
      resultApplied: input.resultApplied === true,
      safetyFallbackUsed: input.safetyFallbackUsed === true,
      context: clone(input.context || {}),
      pitcherRuntime: input.pitcherRuntime ? clone(input.pitcherRuntime) : null,
      batterAnticipation: input.batterAnticipation ? clone(input.batterAnticipation) : null,
      prePitchFrozenDistribution: input.prePitchFrozenDistribution ? clone(input.prePitchFrozenDistribution) : null,
      recognitionSummary: clone(input.recognitionSummary || { correct: 0, misread: 0, chaseRecognized: 0, hitterPitchRecognized: 0 }),
      swingExecutionSummary: clone(input.swingExecutionSummary || { swings: 0, takes: 0, whiffs: 0, fouls: 0, ballsInPlay: 0, hardContacts: 0 }),
      decisionQuality: input.decisionQuality || "none",
      executionQuality: input.executionQuality || "notApplicable"
    });
  }

  function normalizePlateAppearanceState(saved, fallback = {}) {
    if (!saved || typeof saved !== "object") return null;
    return createPlateAppearanceState({ ...fallback, ...clone(saved) });
  }

  function classifyPitchRoll(roll) {
    if (roll < 0.18) return "hitterPitch";
    if (roll < 0.45) return "competitiveStrike";
    if (roll < 0.65) return "edgeStrike";
    if (roll < 0.85) return "chasePitch";
    return "clearBall";
  }

  function generatePitchOpportunity(state, override = null) {
    if (override && PITCH_CLASSES.includes(override.pitchLocationClass)) {
      const profile = PITCH_CLASS_PROFILES[override.pitchLocationClass];
      return deepFreeze({
        pitchId: override.pitchId || `${state.paIdentity}|pitch-${state.pitchNumber + 1}`,
        pitchLocationClass: override.pitchLocationClass,
        pitchQuality: override.pitchQuality || (profile.attackability >= 0.75 ? "high" : profile.attackability >= 0.4 ? "competitive" : "low"),
        recognitionDifficulty: clamp(override.recognitionDifficulty, 0, 1, profile.recognitionDifficulty),
        attackability: clamp(override.attackability, 0, 1, profile.attackability),
        strike: override.strike === undefined ? profile.strike : override.strike === true,
        impression: override.impression || profile.impression,
        generatorAuthority: override.generatorAuthority || "deterministicFixtureOverride",
        intendedPitchClass: PITCH_CLASSES.includes(override.intendedPitchClass) ? override.intendedPitchClass : override.pitchLocationClass,
        controlRealization: override.controlRealization ? clone(override.controlRealization) : null,
        pitcherSequencingTrace: override.pitcherSequencingTrace ? clone(override.pitcherSequencingTrace) : null
      });
    }
    const pitchNumber = state.pitchNumber + 1;
    if (PitchSequencing && state.pitcherRuntime) {
      const recentPitchClasses = (state.pitchHistory || []).map(item => item.pitch?.pitchLocationClass).filter(item => PITCH_CLASSES.includes(item)).slice(-6);
      const decision = PitchSequencing.createPitchDecision({
        paIdentity: state.paIdentity,
        pitchNumber,
        balls: state.balls,
        strikes: state.strikes,
        recentPitchClasses,
        previousPAResult: state.pitcherRuntime.previousPAResult,
        scoringPosition: Boolean(state.context?.scoringPosition),
        highLeverage: Boolean(state.context?.highLeverage),
        pitcherRuntime: state.pitcherRuntime,
        frozenDistribution: pitchNumber === 1 ? state.prePitchFrozenDistribution : null
      });
      const pitchLocationClass = decision.actualPitchClass;
      const profile = PITCH_CLASS_PROFILES[pitchLocationClass];
      const realization = decision.controlRealization;
      return deepFreeze({
        pitchId: `${state.paIdentity}|pitch-${pitchNumber}`,
        pitchLocationClass,
        pitchQuality: realization.realizationQuality === "heldTarget" ? "high" : realization.realizationQuality === "adjacentDrift" ? "competitive" : "missedTarget",
        recognitionDifficulty: round(clamp(profile.recognitionDifficulty + realization.realizationDistance * 0.025)),
        attackability: round(clamp(profile.attackability)),
        strike: profile.strike,
        impression: profile.impression,
        generatorAuthority: "pitchSequencingCoreSprintA",
        intendedPitchClass: decision.intendedPitchClass,
        controlRealization: clone(realization),
        pitcherSequencingTrace: clone(decision.debugTrace)
      });
    }
    const pitchLocationClass = classifyPitchRoll(deterministicUnit(state.paIdentity, `pitch-class|${pitchNumber}`));
    const profile = PITCH_CLASS_PROFILES[pitchLocationClass];
    const qualityRoll = deterministicUnit(state.paIdentity, `pitch-quality|${pitchNumber}`);
    return deepFreeze({
      pitchId: `${state.paIdentity}|pitch-${pitchNumber}`,
      pitchLocationClass,
      pitchQuality: qualityRoll > 0.68 ? "high" : qualityRoll > 0.3 ? "competitive" : "missedTarget",
      recognitionDifficulty: round(clamp(profile.recognitionDifficulty + (qualityRoll - 0.5) * 0.12)),
      attackability: round(clamp(profile.attackability + (qualityRoll - 0.5) * 0.1)),
      strike: profile.strike,
      impression: profile.impression,
      generatorAuthority: "legacyCompatibilityFallback",
      intendedPitchClass: pitchLocationClass,
      controlRealization: null,
      pitcherSequencingTrace: null
    });
  }

  function prepareNextPitch(state, override = null) {
    const normalized = normalizePlateAppearanceState(state);
    if (!normalized || normalized.completed || normalized.pendingPitch) return normalized;
    return createPlateAppearanceState({ ...clone(normalized), pendingPitch: generatePitchOpportunity(normalized, override) });
  }

  function getRecognitionScore(abilities = {}) {
    return round((Number(abilities.observe) || 0) * 0.45 + (Number(abilities.baseballIQ) || 0) * 0.35 + (Number(abilities.ballSense) || 0) * 0.2);
  }

  function getRecognitionResult(state, pitch, abilities = {}, overrideRoll) {
    const score = getRecognitionScore(abilities);
    const accuracy = clamp(0.48 + score / 35 - pitch.recognitionDifficulty * 0.22, 0.32, 0.96);
    const roll = Number.isFinite(Number(overrideRoll)) ? clamp(overrideRoll) : deterministicUnit(state.paIdentity, `recognition|${state.pitchNumber + 1}`);
    const correct = roll <= accuracy;
    const misreadMap = { hitterPitch: "competitiveStrike", competitiveStrike: "edgeStrike", edgeStrike: "chasePitch", chasePitch: "edgeStrike", clearBall: "chasePitch" };
    return deepFreeze({
      score,
      quality: score >= 12 ? "high" : score >= 6 ? "medium" : "low",
      accuracy: round(accuracy),
      correct,
      perceivedPitchClass: correct ? pitch.pitchLocationClass : misreadMap[pitch.pitchLocationClass]
    });
  }

  function getSwingTendency(state, recognition) {
    const selectionProfile = ATTACK_WINDOWS[state.selectionProfile] ? state.selectionProfile : "balanced";
    const profile = ATTACK_WINDOWS[selectionProfile];
    const perceivedPitchClass = PITCH_CLASSES.includes(recognition?.perceivedPitchClass) ? recognition.perceivedPitchClass : "competitiveStrike";
    const baseTendency = profile[perceivedPitchClass] ?? 0.5;
    let tendency = baseTendency;
    const protectAdjusted = state.strikes === 2;
    if (protectAdjusted) {
      if (perceivedPitchClass === "hitterPitch") tendency = Math.max(tendency, 0.98);
      if (perceivedPitchClass === "competitiveStrike") tendency = Math.max(tendency, 0.94);
      if (perceivedPitchClass === "edgeStrike") tendency = Math.max(tendency, selectionProfile === "selective" ? 0.78 : 0.82);
      if (perceivedPitchClass === "chasePitch") tendency = Math.min(0.28, tendency + 0.1);
      if (perceivedPitchClass === "clearBall") tendency = Math.min(0.06, tendency + 0.02);
    }
    return deepFreeze({
      tendency: round(clamp(tendency)),
      baseTendency: round(baseTendency),
      protectAdjusted,
      perceivedPitchClass,
      attackWindow: ATTACK_WINDOW_LABELS[selectionProfile][perceivedPitchClass],
      semanticAuthority: "approachAttackWindow+recognition+count"
    });
  }

  function getContactProbability(state, pitch, abilities = {}, recognition = {}) {
    const batting = Number(abilities.batting) || 0;
    const ballSense = Number(abilities.ballSense) || 0;
    const ability = clamp((batting * 0.65 + ballSense * 0.35) / 15);
    const intentModifier = state.swingIntent === "contact" ? 0.14 : state.swingIntent === "power" ? -0.1 : 0;
    const recognitionModifier = recognition.correct ? 0.04 : -0.08;
    return round(clamp(0.2 + pitch.attackability * 0.46 + ability * 0.3 + intentModifier + recognitionModifier, 0.08, 0.97));
  }

  // Transitional downstream adapter. It may read canonical physical truth, but never writes or revises it.
  function resolveLegacyBallInPlayOutcome(state, pitch, abilities, recognition, physicalTruth, outcomeRoll) {
    const batting = Number(abilities.batting) || 0;
    const ballSense = Number(abilities.ballSense) || 0;
    const ability = clamp((batting * 0.65 + ballSense * 0.35) / 15);
    const intentQuality = state.swingIntent === "power" ? 0.14 : state.swingIntent === "contact" ? -0.09 : 0.04;
    const legacyFallbackQuality = clamp(pitch.attackability * 0.48 + ability * 0.36 + intentQuality + (recognition.correct ? 0.04 : -0.06));
    const physicalContactScore = Number(physicalTruth?.executionEvidence?.continuousContactScore);
    const quality = Number.isFinite(physicalContactScore) ? clamp(physicalContactScore) : legacyFallbackQuality;
    const roll = Number.isFinite(Number(outcomeRoll)) ? clamp(outcomeRoll) : deterministicUnit(state.paIdentity, `bip-outcome|${state.pitchNumber + 1}`);
    const outcomeIntentModifier = state.swingIntent === "power" ? 0.08 : state.swingIntent === "contact" ? -0.07 : 0.02;
    const resolved = clamp(0.25 + quality * 0.5 + outcomeIntentModifier + (roll - 0.5) * 0.7);
    let result = "out";
    if (resolved >= 0.91) result = "homeRun";
    else if (resolved >= 0.82) result = "triple";
    else if (resolved >= 0.68) result = "double";
    else if (resolved >= 0.46) result = "single";
    else if (state.context?.hasRunner && Number(state.context?.outs) < 2 && roll > 0.38) result = "productiveOut";
    return deepFreeze({ result, contactQuality: round(quality), resolvedContact: round(resolved), adapterAuthority: "legacyDownstreamOutcomeAdapter" });
  }

  function resolveFairContactBallInPlay(state, pitch, abilities, recognition, options = {}) {
    const identity = `${state.paIdentity}|pitch-${state.pitchNumber + 1}`;
    const physicalTruth = BattedBallPhysical ? BattedBallPhysical.resolveBattedBallPhysicalTruth({
      identity,
      actualPitch: pitch,
      recognition,
      action: "swing",
      contact: true,
      swingIntent: state.swingIntent,
      bats: abilities.bats || "R",
      abilities: { batting: abilities.batting, power: abilities.power },
      rolls: options.physicalRolls
    }) : null;
    const physicalOutcome = physicalTruth && typeof options.physicalOutcomeResolver === "function"
      ? options.physicalOutcomeResolver({ physicalTruth, state, pitch, abilities, recognition }) : null;
    const outcome = physicalOutcome?.result
      ? deepFreeze({ ...clone(physicalOutcome), adapterAuthority: physicalOutcome.authority || "physicalOutcomeResolver" })
      : resolveLegacyBallInPlayOutcome(state, pitch, abilities, recognition, physicalTruth, options.outcomeRoll);
    return deepFreeze({ physicalTruth, outcome });
  }

  function summarizeQualities(state) {
    const history = state.pitchHistory || [];
    const decisionFit = history.map(item => {
      const perceivedPitchClass = item.recognition?.perceivedPitchClass || item.pitch?.pitchLocationClass;
      const profileState = { selectionProfile: item.selectionProfile || state.selectionProfile, strikes: Number(item.countBefore?.strikes) || 0 };
      const tendency = getSwingTendency(profileState, { perceivedPitchClass }).tendency;
      return item.action === "swing" ? tendency : 1 - tendency;
    });
    const decisionRatio = decisionFit.length ? decisionFit.reduce((sum, value) => sum + value, 0) / decisionFit.length : 0;
    const decisionQuality = decisionRatio >= 0.72 ? "strong" : decisionRatio >= 0.52 ? "acceptable" : decisionRatio >= 0.35 ? "questionable" : "poor";
    const execution = state.swingExecutionSummary;
    const executionQuality = execution.ballsInPlay > 0
      ? execution.hardContacts > 0 ? "strong" : "normal"
      : execution.swings > 0 && execution.whiffs / execution.swings <= 0.34 ? "normal" : "weak";
    return { decisionQuality, executionQuality };
  }

  function assertPitchResultIntegrity(event, terminalState = null) {
    if (!event) return true;
    const result = event.pitchResult;
    const contact = event.contact;
    if (result === "calledStrike" && (event.action !== "take" || contact !== null)) throw new Error("calledStrike requires take without contact");
    if (result === "ball" && (event.action !== "take" || contact !== null)) throw new Error("ball requires take without contact");
    if (result === "swingingStrike" && (event.action !== "swing" || contact !== false)) throw new Error("swingingStrike requires a missed swing");
    if (["foul", "ballInPlay"].includes(result) && (event.action !== "swing" || contact !== true)) throw new Error(`${result} requires swing and contact`);
    if (terminalState?.result === "walk" && !(event.pitchResult === "ball" && Number(terminalState.balls) >= 4)) throw new Error("walk must terminate on ball four");
    if (terminalState?.result === "strikeout" && (!['calledStrike', 'swingingStrike'].includes(event.pitchResult) || Number(terminalState.strikes) < 3)) throw new Error("strikeout must terminate on strike three");
    if (["out", "productiveOut", "single", "double", "triple", "homeRun"].includes(terminalState?.result) && event.pitchResult !== "ballInPlay") throw new Error("ball-in-play PA result requires terminal ballInPlay pitch");
    return true;
  }

  function resolveNextPitch(inputState, abilities = {}, options = {}) {
    let state = normalizePlateAppearanceState(inputState);
    if (!state || state.completed) return deepFreeze({ state, event: null, duplicate: Boolean(state?.completed) });
    if (!state.pendingPitch) state = prepareNextPitch(state, options.pitch || null);
    const pitch = state.pendingPitch;
    const countBefore = { balls: state.balls, strikes: state.strikes };
    const recognition = getRecognitionResult(state, pitch, abilities, options.recognitionRoll);
    const swingProfile = getSwingTendency(state, recognition);
    const decisionRoll = Number.isFinite(Number(options.decisionRoll)) ? clamp(options.decisionRoll)
      : deterministicUnit(state.paIdentity, `swing-decision|${state.pitchNumber + 1}`);
    const safetyPitch = state.pitchNumber + 1 >= ABSOLUTE_PITCH_SAFETY_CAP;
    let action = safetyPitch ? "swing" : decisionRoll < swingProfile.tendency ? "swing" : "take";
    let pitchResult = "";
    let paResult = "";
    let contactQuality = null;
    let battedBallPhysicalTruth = null;
    let contact = null;
    const recognitionSummary = clone(state.recognitionSummary);
    recognitionSummary[recognition.correct ? "correct" : "misread"] += 1;
    if (recognition.correct && pitch.pitchLocationClass === "chasePitch") recognitionSummary.chaseRecognized += 1;
    if (recognition.correct && pitch.pitchLocationClass === "hitterPitch") recognitionSummary.hitterPitchRecognized += 1;
    const swingExecutionSummary = clone(state.swingExecutionSummary);
    let balls = state.balls;
    let strikes = state.strikes;
    if (safetyPitch) {
      pitchResult = "ballInPlay";
      contact = true;
      swingExecutionSummary.swings += 1;
      swingExecutionSummary.ballsInPlay += 1;
      const bip = resolveFairContactBallInPlay(state, pitch, abilities, recognition, options);
      paResult = bip.outcome.result;
      contactQuality = bip.outcome.contactQuality;
      battedBallPhysicalTruth = bip.physicalTruth;
      if (bip.outcome.contactQuality >= 0.72) swingExecutionSummary.hardContacts += 1;
    } else if (action === "take") {
      swingExecutionSummary.takes += 1;
      if (pitch.strike) {
        pitchResult = "calledStrike";
        strikes += 1;
      } else {
        pitchResult = "ball";
        balls += 1;
      }
    } else {
      swingExecutionSummary.swings += 1;
      const contactProbability = getContactProbability(state, pitch, abilities, recognition);
      const contactRoll = Number.isFinite(Number(options.contactRoll)) ? clamp(options.contactRoll)
        : deterministicUnit(state.paIdentity, `contact|${state.pitchNumber + 1}`);
      if (contactRoll > contactProbability) {
        pitchResult = "swingingStrike";
        contact = false;
        swingExecutionSummary.whiffs += 1;
        strikes += 1;
      } else {
        const foulRate = state.swingIntent === "contact" ? 0.36 : state.swingIntent === "power" ? 0.18 : 0.25;
        const foulRoll = Number.isFinite(Number(options.foulRoll)) ? clamp(options.foulRoll)
          : deterministicUnit(state.paIdentity, `foul|${state.pitchNumber + 1}`);
        if (foulRoll < foulRate) {
          pitchResult = "foul";
          contact = true;
          swingExecutionSummary.fouls += 1;
          if (strikes < 2) strikes += 1;
        } else {
          pitchResult = "ballInPlay";
          contact = true;
          swingExecutionSummary.ballsInPlay += 1;
          const bip = resolveFairContactBallInPlay(state, pitch, abilities, recognition, options);
          paResult = bip.outcome.result;
          contactQuality = bip.outcome.contactQuality;
          battedBallPhysicalTruth = bip.physicalTruth;
          if (bip.outcome.contactQuality >= 0.72) swingExecutionSummary.hardContacts += 1;
        }
      }
    }
    if (!paResult && balls >= 4) paResult = "walk";
    if (!paResult && strikes >= 3) paResult = "strikeout";
    const safetyFallbackUsed = safetyPitch;
    const pitchNumber = state.pitchNumber + 1;
    const event = {
      pitchNumber,
      pitch,
      recognition,
      selectionProfile: state.selectionProfile,
      swingIntent: state.swingIntent,
      protectAdjusted: swingProfile.protectAdjusted,
      swingTendency: swingProfile.tendency,
      attackWindow: swingProfile.attackWindow,
      swingDecisionAuthority: swingProfile.semanticAuthority,
      action,
      pitchResult,
      contact,
      contactQuality,
      battedBallPhysicalTruth,
      countBefore,
      countAfter: { balls: Math.min(4, balls), strikes: Math.min(3, strikes) },
      paResult
    };
    const next = {
      ...clone(state), balls: Math.min(4, balls), strikes: Math.min(3, strikes), pitchNumber,
      pendingPitch: null, pitchHistory: [...state.pitchHistory, event], completed: Boolean(paResult), result: paResult,
      battedBallPhysicalTruth: battedBallPhysicalTruth || state.battedBallPhysicalTruth,
      safetyFallbackUsed: state.safetyFallbackUsed || safetyFallbackUsed, recognitionSummary, swingExecutionSummary
    };
    const qualities = summarizeQualities(next);
    next.decisionQuality = qualities.decisionQuality;
    next.executionQuality = qualities.executionQuality;
    assertPitchResultIntegrity(event, next.completed ? next : null);
    return deepFreeze({ state: createPlateAppearanceState(next), event: deepFreeze(clone(event)), duplicate: false });
  }

  function simulatePlateAppearance(input = {}) {
    let state = input.state ? normalizePlateAppearanceState(input.state) : createPlateAppearanceState(input);
    const pitchSequence = Array.isArray(input.pitchSequence) ? input.pitchSequence : [];
    const pitchOptions = Array.isArray(input.pitchOptions) ? input.pitchOptions : [];
    let safety = 0;
    while (!state.completed && safety < ABSOLUTE_PITCH_SAFETY_CAP) {
      const options = { ...(pitchOptions[safety] || {}) };
      if (pitchSequence[safety]) options.pitch = pitchSequence[safety];
      state = resolveNextPitch(state, input.abilities || {}, options).state;
      safety += 1;
    }
    return state;
  }

  function markResultApplied(state) {
    const normalized = normalizePlateAppearanceState(state);
    return normalized ? createPlateAppearanceState({ ...clone(normalized), resultApplied: true }) : null;
  }

  return deepFreeze({
    VERSION,
    PITCH_SEED_NAMESPACE,
    ABSOLUTE_PITCH_SAFETY_CAP,
    PITCH_CLASSES,
    PITCH_CLASS_PROFILES,
    APPROACH_PACKAGES,
    ATTACK_WINDOWS,
    SWING_TENDENCIES,
    stableHash,
    deterministicUnit,
    normalizeApproachPackage,
    createPlateAppearanceIdentity,
    createPlateAppearanceState,
    normalizePlateAppearanceState,
    generatePitchOpportunity,
    prepareNextPitch,
    getRecognitionScore,
    getRecognitionResult,
    getSwingTendency,
    getContactProbability,
    summarizeQualities,
    resolveLegacyBallInPlayOutcome,
    resolveFairContactBallInPlay,
    assertPitchResultIntegrity,
    resolveNextPitch,
    simulatePlateAppearance,
    markResultApplied
  });
});
