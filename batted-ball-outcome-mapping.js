(function (root, factory) {
  const physical = root.BattedBallPhysical || (typeof module === "object" && module.exports ? require("./batted-ball-physical.js") : null);
  const api = factory(physical);
  root.BattedBallOutcomeMapping = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Physical) {
  "use strict";
  const AUTHORITY = "physicalOutcomeMappingV1";
  const RESULTS = Object.freeze(["out", "productiveOut", "single", "double", "triple", "homeRun"]);
  const RNG_NAMESPACES = Object.freeze({ hit: "batted-ball-official-hit-v1", extraBase: "batted-ball-extra-base-v1" });
  const QUALITY = Object.freeze({ poor: 0.2, usable: 0.4, solid: 0.65, barreled: 0.85 });
  const PACE = Object.freeze({ weak: 0, moderate: 1 / 3, firm: 2 / 3, hard: 1 });
  const DEPTH = Object.freeze({ shallow: 0, medium: 0.5, deep: 1 });
  function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  function check(ok, message) { if (!ok) throw new Error(`Official BIP integrity: ${message}`); }
  function clamp(n) { return Math.max(0, Math.min(1, n)); }
  function roll(input, key, identity) {
    if (input.rolls?.[key] !== undefined) {
      check(Number.isFinite(input.rolls[key]) && input.rolls[key] >= 0 && input.rolls[key] <= 1, "invalid mapping roll");
      return input.rolls[key];
    }
    return Physical.deterministicUnit(RNG_NAMESPACES[key], identity, key);
  }
  function assertOfficialBallInPlayOutcomeIntegrity(outcome) {
    check(outcome && RESULTS.includes(outcome.result), "invalid terminal result");
    check(outcome.authority === AUTHORITY && typeof outcome.physicalIdentity === "string" && outcome.physicalIdentity.length > 0, "missing physical authority / identity");
    check(["settledDefense", "compressedOfficialClassification"].includes(outcome.resolutionMode), "unknown resolution mode");
    check(outcome.trace?.fallbackUsed === false, "normal mapping cannot disguise fallback");
    check(!outcome.trace?.caught || outcome.result === "out", "caught ball cannot become a hit");
    check(!(outcome.trace.ballType === "groundBall" && outcome.result === "homeRun"), "ground ball conventional HR");
    for (const key of ["hitScore", "extraBaseScore"]) check(outcome.trace[key] === null || Number.isFinite(outcome.trace[key]), "non-finite score");
    check(!Object.keys(outcome).some(k => ["player", "abilities", "baseballSkills", "power", "batting"].includes(k)), "raw capability snapshot");
    return true;
  }
  function resolveOfficialBallInPlayOutcome(input = {}) {
    const truth = input.physicalTruth;
    check(Physical && truth && Physical.CONTACT_QUALITIES.includes(truth.contactQuality)
      && Physical.BALL_TYPES.includes(truth.ballType) && Physical.PACES.includes(truth.pace)
      && Physical.DIRECTIONS.includes(truth.direction)
      && (truth.ballType === "groundBall" ? truth.depth === null : Physical.DEPTHS.includes(truth.depth)), "valid physical truth required");
    check(typeof truth.identity === "string" && truth.identity.length > 0, "physical identity required");
    const identity = input.identity || truth.identity;
    check(typeof identity === "string" && identity.length > 0, "mapping identity required");
    const defense = input.defenseOutcome;
    const caught = defense?.caught === true;
    const settled = caught || defense?.settled === true;
    const trace = { mappingIdentity: identity, contactQuality: truth.contactQuality, ballType: truth.ballType,
      pace: truth.pace, depth: truth.depth, direction: truth.direction, caught,
      defenseResolutionUsed: settled, hitScore: null, extraBaseScore: null, rolls: null, fallbackUsed: false };
    let result;
    if (settled) {
      check(!defense.physicalIdentity || defense.physicalIdentity === truth.identity, "defense physical identity mismatch");
      check(typeof defense.authority === "string" && defense.authority.length > 0, "settled defense authority required");
      result = caught ? "out" : defense.result;
      check(RESULTS.includes(result), "unresolved defense is not terminal");
      check(result !== "productiveOut" || defense.runnerAdvancementSettled === true, "productive out needs settled runner advancement");
      check(!caught || !defense.result || ["out", "caught"].includes(defense.result), "conflicting caught result");
    } else {
      // Reuse the broad legacy score range and result cutoffs, separating contact from hit shape.
      // These are initial compressed classification constants, not fitted league probabilities.
      const hitRoll = roll(input, "hit", identity);
      trace.hitScore = clamp(0.25 + QUALITY[truth.contactQuality] * 0.5 + (hitRoll - 0.5) * 0.7);
      result = "out";
      if (trace.hitScore >= 0.46) {
        const extraRoll = roll(input, "extraBase", identity);
        const shape = (PACE[truth.pace] + (truth.ballType === "groundBall" ? 0 : DEPTH[truth.depth])) / 2;
        trace.extraBaseScore = clamp(0.25 + shape * 0.5 + (extraRoll - 0.5) * 0.7);
        result = trace.extraBaseScore >= 0.91 && truth.ballType !== "groundBall" ? "homeRun"
          : trace.extraBaseScore >= 0.82 ? "triple" : trace.extraBaseScore >= 0.68 ? "double" : "single";
        trace.rolls = { hit: hitRoll, extraBase: extraRoll };
      } else trace.rolls = { hit: hitRoll, extraBase: null };
      // Do not infer productive advancement from occupied bases. Runner settlement owns it.
    }
    const outcome = { result, authority: AUTHORITY, resolutionMode: settled ? "settledDefense" : "compressedOfficialClassification",
      physicalIdentity: truth.identity, defenseConsumed: settled, officialScoring: "paResultOnly", trace };
    assertOfficialBallInPlayOutcomeIntegrity(outcome);
    return freeze(outcome);
  }
  return freeze({ AUTHORITY, RESULTS, RNG_NAMESPACES, resolveOfficialBallInPlayOutcome, assertOfficialBallInPlayOutcomeIntegrity });
});
