(function (root, factory) {
  const api = factory();
  root.OffensiveTacticalAction = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "offensive-tactical-action-v1";
  const PHASES = Object.freeze(["prePitch", "delivery", "postRelease", "lateReveal"]);

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  function event(id, type, timing) {
    return { id, type, timing, actor: "batter", salience: "high" };
  }
  function planFor(action, identity) {
    if (action === "sacrificeBunt") return {
      batterCommitment: "bunt", runnerCommitment: "conditionalAdvance", revealTiming: "early",
      observableEventPlan: [event(`${identity}|bunt-reveal-early`, "buntReveal", "prePitch")]
    };
    if (action === "surpriseBunt") return {
      batterCommitment: "bunt", runnerCommitment: "reactive", revealTiming: "late",
      observableEventPlan: [event(`${identity}|bunt-reveal-late`, "lateBuntReveal", "lateReveal")]
    };
    return { batterCommitment: "standard", runnerCommitment: "noSpecialTacticalCommitment", revealTiming: "none", observableEventPlan: [] };
  }
  function phaseIndex(phase) { return Math.max(0, PHASES.indexOf(phase)); }
  function createTacticalActionState(decision = {}) {
    const selected = ["standardAttack", "sacrificeBunt", "surpriseBunt"].includes(decision.selectedAction) ? decision.selectedAction : "standardAttack";
    const identity = decision.identity || "tactical-pa";
    const assignment = planFor(selected, identity);
    const initialPhase = "prePitch";
    const emitted = assignment.observableEventPlan.filter(item => phaseIndex(item.timing) <= phaseIndex(initialPhase));
    return deepFreeze({
      version: VERSION,
      identity,
      selectedTacticalAction: selected,
      batterCommitment: assignment.batterCommitment,
      runnerCommitment: assignment.runnerCommitment,
      revealTiming: assignment.revealTiming,
      currentPhase: initialPhase,
      observableEventPlan: clone(assignment.observableEventPlan),
      observableEvents: clone(emitted),
      emittedEventIds: emitted.map(item => item.id),
      executionDeferred: true
    });
  }
  function normalizeTacticalActionState(saved) {
    if (!saved || typeof saved !== "object") return null;
    const state = createTacticalActionState({ identity: saved.identity, selectedAction: saved.selectedTacticalAction });
    const emittedEventIds = Array.isArray(saved.emittedEventIds) ? saved.emittedEventIds.slice() : [];
    const observableEvents = state.observableEventPlan.filter(item => emittedEventIds.includes(item.id));
    return deepFreeze({ ...clone(state), currentPhase: PHASES.includes(saved.currentPhase) ? saved.currentPhase : "prePitch", observableEvents, emittedEventIds });
  }
  function advanceTacticalReveal(saved, phase) {
    const state = normalizeTacticalActionState(saved);
    if (!state || !PHASES.includes(phase) || phaseIndex(phase) < phaseIndex(state.currentPhase)) return state;
    const emittedEventIds = state.emittedEventIds.slice();
    const observableEvents = state.observableEvents.map(clone);
    state.observableEventPlan.forEach(item => {
      if (phaseIndex(item.timing) <= phaseIndex(phase) && !emittedEventIds.includes(item.id)) {
        emittedEventIds.push(item.id);
        observableEvents.push(clone(item));
      }
    });
    return deepFreeze({ ...clone(state), currentPhase: phase, observableEvents, emittedEventIds });
  }
  function getObservableTacticalEvents(saved) {
    return normalizeTacticalActionState(saved)?.observableEvents || deepFreeze([]);
  }
  function formatObservableTacticalInformation(observableEvents = []) {
    return deepFreeze((Array.isArray(observableEvents) ? observableEvents : []).map(item => {
      if (item.type === "buntReveal") return "打者提早擺出短打姿勢。";
      if (item.type === "lateBuntReveal") return "打者突然轉棒準備觸擊。";
      return "";
    }).filter(Boolean));
  }

  return deepFreeze({ VERSION, PHASES, createTacticalActionState, normalizeTacticalActionState, advanceTacticalReveal, getObservableTacticalEvents, formatObservableTacticalInformation });
});
