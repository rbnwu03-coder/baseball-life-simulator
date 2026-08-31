(function (root, factory) {
  const api = factory();
  root.OffensiveBuntCountRules = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "offensive-bunt-count-rules-v1";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function normalizeCount(input = {}) {
    return deepFreeze({
      balls: Math.max(0, Math.min(4, Math.floor(Number(input.balls) || 0))),
      strikes: Math.max(0, Math.min(3, Math.floor(Number(input.strikes) || 0)))
    });
  }

  function resolveBuntPitchCount(input = {}) {
    const before = normalizeCount(input.count);
    const actualPitch = input.actualPitch || {};
    const resolution = input.buntResolution || {};
    let balls = before.balls;
    let strikes = before.strikes;
    let pitchResult = "";
    let paResult = "";
    let paEnded = false;
    let endReason = "";

    if (resolution.attemptDecision === "hold") {
      if (actualPitch.strike === true) {
        pitchResult = "calledStrike";
        strikes += 1;
      } else {
        pitchResult = "ball";
        balls += 1;
      }
    } else if (resolution.contactResult === "miss") {
      pitchResult = "swingingStrike";
      strikes += 1;
    } else if (resolution.contactResult === "foulContact") {
      pitchResult = "foul";
      strikes += 1;
    } else if (resolution.contactResult === "fairContact") {
      pitchResult = "ballInPlay";
      paResult = "ballInPlayPendingDefense";
      paEnded = true;
      endReason = "fairBallEnteredPlay";
    } else {
      throw new Error("Bunt count resolution requires hold or canonical contact result");
    }

    balls = Math.min(4, balls);
    strikes = Math.min(3, strikes);
    if (!paEnded && balls >= 4) {
      paResult = "walk";
      paEnded = true;
      endReason = "ballFour";
    }
    if (!paEnded && strikes >= 3) {
      paResult = "strikeout";
      paEnded = true;
      endReason = resolution.contactResult === "foulContact" ? "twoStrikeBuntFoul" : "strikeThree";
    }

    return deepFreeze({
      version: VERSION,
      countBefore: before,
      countAfter: { balls, strikes },
      pitchResult,
      paResult,
      paEnded,
      endReason,
      batterOut: paResult === "strikeout",
      outcomeAuthority: "countAndPARules"
    });
  }

  return deepFreeze({ VERSION, normalizeCount, resolveBuntPitchCount });
});
