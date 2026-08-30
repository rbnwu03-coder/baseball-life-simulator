(function (root, factory) {
  const mental = root.PitcherMentalState || (typeof module === "object" && module.exports && typeof require === "function" ? require("./pitcher-mental-state.js") : null);
  const api = factory(mental);
  root.PitcherProcessState = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (PitcherMentalState) {
  "use strict";

  const VERSION = "pitcher-process-state-v1";

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

  function deriveProcessLabel(process) {
    if (process.precisionIntent >= 72 && process.rhythm < 46) return "overcontrol";
    if (process.tempo >= 68 && process.rhythm < 46) return "rushedAttack";
    if (process.rhythm >= 65 && process.aggression >= 60) return "controlledAttack";
    if (process.rhythm >= 62 && process.precisionIntent <= 48) return "simplifiedFlow";
    if (process.rhythm < 42 && process.aggression < 44) return "hesitantProcess";
    return "stableFlow";
  }

  function createProcessState(input = {}) {
    const process = {
      version: VERSION,
      rhythm: round(clamp(input.rhythm, 0, 100, 55)),
      aggression: round(clamp(input.aggression, 0, 100, 50)),
      tempo: round(clamp(input.tempo, 0, 100, 50)),
      precisionIntent: round(clamp(input.precisionIntent, 0, 100, 50))
    };
    return deepFreeze({ ...process, processLabel: deriveProcessLabel(process) });
  }

  function normalizeProcessState(saved) {
    return createProcessState(saved && typeof saved === "object" ? saved : {});
  }

  function derivePitcherProcessState(mentalState, responseProfile, previousProcessState = null, context = {}) {
    const mental = PitcherMentalState
      ? PitcherMentalState.normalizeMentalState(mentalState)
      : { arousal: 50, confidence: 50, cognitiveLoad: 40, resultAttachment: 35 };
    const previous = previousProcessState ? normalizeProcessState(previousProcessState) : createProcessState();
    const continuity = previousProcessState ? 0.22 : 0;
    const fresh = 1 - continuity;
    const arousalDistance = Math.abs(mental.arousal - 50);
    const leverageLoad = context.highLeverage ? 4 : 0;
    const rhythm = 74 - arousalDistance * 0.28 - mental.cognitiveLoad * 0.3 - mental.resultAttachment * 0.09 - leverageLoad;
    const aggression = 49 + (mental.confidence - 50) * 0.34 + (mental.arousal - 50) * 0.16 - mental.resultAttachment * 0.06;
    const tempo = 48 + (mental.arousal - 50) * 0.38 - (mental.cognitiveLoad - 40) * 0.08;
    const precisionIntent = 38 + mental.cognitiveLoad * 0.34 + mental.resultAttachment * 0.22 + (context.twoStrikeCount ? 3 : 0);
    return createProcessState({
      rhythm: previous.rhythm * continuity + rhythm * fresh,
      aggression: previous.aggression * continuity + aggression * fresh,
      tempo: previous.tempo * continuity + tempo * fresh,
      precisionIntent: previous.precisionIntent * continuity + precisionIntent * fresh
    });
  }

  return deepFreeze({
    VERSION,
    createProcessState,
    normalizeProcessState,
    derivePitcherProcessState,
    deriveProcessLabel
  });
});
