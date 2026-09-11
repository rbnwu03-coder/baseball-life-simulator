(function (root, factory) {
  const api = factory();
  root.AIPlateAppearanceOutcome = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const AUTHORITY = "compressedAIPlateAppearanceOutcomeV1";
  const SO_NAMESPACE = "compressed-ai-strikeout-v1";
  const RESULTS = Object.freeze(["out", "productiveOut", "walk", "single", "double", "triple", "homeRun", "strikeout"]);
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function check(ok, message) { if (!ok) throw new Error(`Compressed PA integrity: ${message}`); }
  function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  function deterministicStrikeoutRoll(identity) {
    let hash = 2166136261;
    const text = `${SO_NAMESPACE}|${identity}`;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0) / 4294967296;
  }
  function assertCompressedPlateAppearanceOutcomeIntegrity(outcome) {
    check(outcome && RESULTS.includes(outcome.result), "invalid terminal result");
    check(outcome.authority === AUTHORITY && outcome.resolutionMode === "compressedPlateAppearance", "invalid authority");
    const t = outcome.trace;
    check(t && typeof t.identity === "string" && t.identity.length > 0, "missing identity");
    for (const k of ["sample", "quality", "pitcherPressure", "adjusted", "walkLower", "walkUpper", "walkAdjustment", "strikeoutProbability"]) check(Number.isFinite(t[k]), `non-finite ${k}`);
    check(t.controlAvailable === Number.isFinite(t.pitcherControl), "control availability mismatch");
    check(t.controlAvailable || (t.controlFallback === "missingControlNeutral" && t.walkAdjustment === 0), "missing-control fallback not neutral");
    check(outcome.result !== "strikeout" || t.preStrikeoutResult === "out", "SO must subclass plain out");
    check(t.preStrikeoutResult === "out" || outcome.result === t.preStrikeoutResult, "SO changed a protected result");
    check(t.strikeoutRoll === null || Number.isFinite(t.strikeoutRoll), "invalid SO roll");
    check(!["player", "roster", "baseballSkills", "pitchCount", "pitchSequence"].some(k => k in outcome || k in t), "raw state / invented pitch facts");
    return true;
  }
  function resolveCompressedPlateAppearanceOutcome(input = {}) {
    check(typeof input.identity === "string" && input.identity.length > 0, "identity required");
    const b = input.batter || {}, p = input.pitcher || {}, c = input.context || {};
    for (const [name, value] of Object.entries({ contact: b.contact, power: b.power, discipline: b.discipline, pitchingQuality: p.pitchingQuality, decision: p.decision })) check(Number.isFinite(value) && value >= 0, `invalid scalar ${name}`);
    check(Number.isFinite(input.sample), "sample required");
    const sample = clamp(input.sample, 0, 0.999999);
    // Preserve caf2199 matchup and hit boundaries exactly; no second safe/out bonus.
    const quality = b.contact * 0.025 + b.power * 0.012 + b.discipline * 0.008;
    const pitcherPressure = ((p.pitchingQuality || 5) * 2 + p.decision) * 0.004;
    const adjusted = clamp(sample + quality + (c.hasRunner ? 0.01 : 0) + (c.offenseTrailing ? 0.005 : 0) - pitcherPressure - (c.outs === 2 ? 0.015 : 0) - 0.18, 0, 0.999999);
    const controlAvailable = Number.isFinite(p.control);
    // Fixed initial constants. The width changes only along the productiveOut/walk boundary.
    const walkAdjustment = controlAvailable ? clamp((b.discipline - p.control) * 0.004, -0.03, 0.03) : 0;
    const walkLower = 0.58 - walkAdjustment, walkUpper = 0.69;
    const preStrikeoutResult = adjusted < 0.46 ? "out" : adjusted < walkLower ? "productiveOut" : adjusted < walkUpper ? "walk" : adjusted < 0.88 ? "single" : adjusted < 0.955 ? "double" : adjusted < 0.985 ? "triple" : "homeRun";
    const strikeoutProbability = clamp(0.18 + (p.pitchingQuality - b.contact) * 0.018, 0.04, 0.45);
    const strikeoutRoll = preStrikeoutResult === "out" ? deterministicStrikeoutRoll(input.identity) : null;
    const result = preStrikeoutResult === "out" && strikeoutRoll < strikeoutProbability ? "strikeout" : preStrikeoutResult;
    const outcome = { result, authority: AUTHORITY, resolutionMode: "compressedPlateAppearance", trace: {
      identity: input.identity, sample, batterContact: b.contact, batterDiscipline: b.discipline,
      pitcherControl: controlAvailable ? p.control : null, pitcherQuality: p.pitchingQuality,
      controlAvailable, controlFallback: controlAvailable ? null : "missingControlNeutral",
      quality, pitcherPressure, adjusted, walkLower, walkUpper, walkAdjustment,
      preStrikeoutResult, strikeoutProbability, strikeoutRoll, finalResult: result
    } };
    assertCompressedPlateAppearanceOutcomeIntegrity(outcome);
    return freeze(outcome);
  }
  return freeze({ AUTHORITY, SO_NAMESPACE, RESULTS, deterministicStrikeoutRoll, resolveCompressedPlateAppearanceOutcome, assertCompressedPlateAppearanceOutcomeIntegrity });
});
