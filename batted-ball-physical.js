(function (root, factory) {
  const api = factory();
  root.BattedBallPhysical = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "batted-ball-physical-v1";
  const RNG_NAMESPACES = Object.freeze({
    contactQuality: "batted-ball-contact-quality-v1",
    ballType: "batted-ball-type-v1",
    pace: "batted-ball-pace-v1",
    direction: "batted-ball-direction-v1",
    depth: "batted-ball-depth-v1"
  });
  const CONTACT_QUALITIES = Object.freeze(["poor", "usable", "solid", "barreled"]);
  const BALL_TYPES = Object.freeze(["groundBall", "lineDrive", "flyBall"]);
  const PACES = Object.freeze(["weak", "moderate", "firm", "hard"]);
  const DIRECTIONS = Object.freeze(["leftSide", "middle", "rightSide"]);
  const DEPTHS = Object.freeze(["shallow", "medium", "deep"]);

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  function clamp(value, minimum = 0, maximum = 1, fallback = minimum) {
    const number = Number(value);
    return Math.max(minimum, Math.min(maximum, Number.isFinite(number) ? number : fallback));
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
  function resolveRoll(input, key, namespace, identity) {
    return Number.isFinite(Number(input?.rolls?.[key])) ? clamp(input.rolls[key]) : deterministicUnit(namespace, identity, key);
  }
  function normalizeAbility(value, fallback = 5) {
    const number = Number(value);
    return clamp((Number.isFinite(number) ? number : fallback) / 20);
  }
  function qualityIndex(contactQuality) { return Math.max(0, CONTACT_QUALITIES.indexOf(contactQuality)); }

  function resolveContactQuality(input = {}) {
    const identity = String(input.identity || "ordinary-contact");
    const batting = normalizeAbility(input.abilities?.batting);
    const pitchAccessibility = clamp(input.actualPitch?.attackability, 0, 1, 0.5);
    const recognitionAdjustment = input.recognition?.correct === true ? 0.055 : -0.055;
    const executionAdjustment = input.swingIntent === "contact" ? 0.025 : input.swingIntent === "power" ? -0.025 : 0;
    const roll = resolveRoll(input, "contactQuality", RNG_NAMESPACES.contactQuality, identity);
    const score = clamp(0.12 + batting * 0.39 + pitchAccessibility * 0.28 + recognitionAdjustment + executionAdjustment + (roll - 0.5) * 0.42);
    const contactQuality = score < 0.3 ? "poor" : score < 0.52 ? "usable" : score < 0.74 ? "solid" : "barreled";
    return deepFreeze({ contactQuality, score: round(score), roll });
  }

  function resolveBattedBallType(input = {}) {
    const identity = String(input.identity || "ordinary-contact");
    const quality = qualityIndex(input.contactQuality);
    const power = normalizeAbility(input.abilities?.power);
    const roll = resolveRoll(input, "ballType", RNG_NAMESPACES.ballType, identity);
    const adjusted = clamp(roll + (quality - 1.5) * 0.025 + (power - 0.5) * 0.08);
    return adjusted < 0.34 ? "groundBall" : adjusted < 0.69 ? "lineDrive" : "flyBall";
  }

  function resolveBattedBallPace(input = {}) {
    const identity = String(input.identity || "ordinary-contact");
    const quality = qualityIndex(input.contactQuality) / 3;
    const power = normalizeAbility(input.abilities?.power);
    const roll = resolveRoll(input, "pace", RNG_NAMESPACES.pace, identity);
    const score = clamp(quality * 0.34 + power * 0.26 + roll * 0.4);
    return deepFreeze({ pace: score < 0.28 ? "weak" : score < 0.5 ? "moderate" : score < 0.72 ? "firm" : "hard", score: round(score), roll });
  }

  function resolveBattedBallDirection(input = {}) {
    const identity = String(input.identity || "ordinary-contact");
    const roll = resolveRoll(input, "direction", RNG_NAMESPACES.direction, identity);
    const handednessShift = input.bats === "L" ? 0.035 : input.bats === "R" ? -0.035 : 0;
    const adjusted = clamp(roll + handednessShift);
    return deepFreeze({ direction: adjusted < 0.33 ? "leftSide" : adjusted < 0.67 ? "middle" : "rightSide", roll, adjusted: round(adjusted) });
  }

  function resolveBattedBallDepth(input = {}) {
    if (input.ballType === "groundBall") return deepFreeze({ depth: null, score: null, roll: null, consumed: false });
    const identity = String(input.identity || "ordinary-contact");
    const quality = qualityIndex(input.contactQuality) / 3;
    const power = normalizeAbility(input.abilities?.power);
    const roll = resolveRoll(input, "depth", RNG_NAMESPACES.depth, identity);
    const score = clamp(quality * 0.2 + power * 0.48 + roll * 0.32);
    return deepFreeze({ depth: score < 0.35 ? "shallow" : score < 0.67 ? "medium" : "deep", score: round(score), roll, consumed: true });
  }

  function resolveBattedBallPhysicalTruth(input = {}) {
    const identity = String(input.identity || "ordinary-contact");
    const quality = resolveContactQuality({ ...input, identity });
    const ballType = resolveBattedBallType({ ...input, identity, contactQuality: quality.contactQuality });
    const pace = resolveBattedBallPace({ ...input, identity, contactQuality: quality.contactQuality, ballType });
    const direction = resolveBattedBallDirection({ ...input, identity });
    const depth = resolveBattedBallDepth({ ...input, identity, contactQuality: quality.contactQuality, ballType });
    return deepFreeze({
      version: VERSION,
      identity,
      contactQuality: quality.contactQuality,
      ballType,
      pace: pace.pace,
      direction: direction.direction,
      depth: depth.depth,
      executionEvidence: {
        actualPitch: clone(input.actualPitch || {}),
        recognition: clone(input.recognition || {}),
        swing: { action: input.action || "swing", contact: input.contact === true, swingIntent: input.swingIntent || "normal" },
        continuousContactScore: quality.score,
        paceScore: pace.score,
        depthScore: depth.score,
        rolls: { contactQuality: quality.roll, ballType: resolveRoll(input, "ballType", RNG_NAMESPACES.ballType, identity), pace: pace.roll, direction: direction.roll, depth: depth.roll },
        depthRollConsumed: depth.consumed
      }
    });
  }

  function getHandednessDirectionInterpretation(direction, bats = "R") {
    if (direction === "middle") return "中間方向";
    const pullSide = bats === "L" ? "rightSide" : "leftSide";
    return direction === pullSide ? "拉打方向" : "反方向";
  }

  function formatBattedBallPhysicalTruth(truth, options = {}) {
    if (!truth) return "";
    const quality = { poor: "擊球沒有完全咬中", usable: "球被打進場內", solid: "球被扎實擊中", barreled: "球被非常完整地擊中" }[truth.contactQuality] || "球被打進場內";
    const pace = { weak: "力道偏弱地", moderate: "以一般力道", firm: "帶著明顯力道", hard: "強勁地" }[truth.pace] || "";
    const direction = { leftSide: "左半邊", middle: "中間方向", rightSide: "右半邊" }[truth.direction] || "場內";
    const shape = truth.ballType === "groundBall" ? `滾向${direction}`
      : truth.ballType === "lineDrive" ? `形成${truth.depth === "deep" ? "深遠" : truth.depth === "shallow" ? "較淺" : "中等縱深"}的平飛球，飛向${direction}`
        : `形成${truth.depth === "deep" ? "深遠" : truth.depth === "shallow" ? "較淺" : "中等縱深"}的飛球，飛向${direction}`;
    const interpretation = options.includeHandednessInterpretation ? `（${getHandednessDirectionInterpretation(truth.direction, options.bats)}）` : "";
    return `${quality}，${pace}${shape}${interpretation}。`;
  }

  function normalizeBattedBallPhysicalTruth(saved) {
    if (!saved || typeof saved !== "object") return null;
    const valid = CONTACT_QUALITIES.includes(saved.contactQuality) && BALL_TYPES.includes(saved.ballType)
      && PACES.includes(saved.pace) && DIRECTIONS.includes(saved.direction)
      && (saved.ballType === "groundBall" ? saved.depth === null : DEPTHS.includes(saved.depth));
    return valid ? deepFreeze(clone(saved)) : null;
  }

  return deepFreeze({
    VERSION, RNG_NAMESPACES, CONTACT_QUALITIES, BALL_TYPES, PACES, DIRECTIONS, DEPTHS,
    stableHash, deterministicUnit, resolveContactQuality, resolveBattedBallType, resolveBattedBallPace,
    resolveBattedBallDirection, resolveBattedBallDepth, resolveBattedBallPhysicalTruth,
    getHandednessDirectionInterpretation, formatBattedBallPhysicalTruth, normalizeBattedBallPhysicalTruth
  });
});
