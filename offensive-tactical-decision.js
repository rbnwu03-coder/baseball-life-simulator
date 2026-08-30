(function (root, factory) {
  const opportunity = root.OffensiveTacticalOpportunity || (typeof module === "object" && module.exports && typeof require === "function" ? require("./offensive-tactical-opportunity.js") : null);
  const api = factory(opportunity);
  root.OffensiveTacticalDecision = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (OffensiveTacticalOpportunity) {
  "use strict";

  const VERSION = "offensive-tactical-decision-v1";
  const RNG_NAMESPACE = "offensive-tactical-decision-v1";
  const PROFILE_AXES = Object.freeze(["outPreservation", "pressureCreation", "variancePreference", "coordinationTrust", "informationExploitation"]);
  const DEFAULT_PROFILE = Object.freeze({ outPreservation: 0.55, pressureCreation: 0.5, variancePreference: 0.45, coordinationTrust: 0.5, informationExploitation: 0.5 });
  const ALLOWED_EVIDENCE_TYPES = Object.freeze(["previousBuntDefenseResponse", "recentDefensiveChargeTiming"]);

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
  function deterministicUnit(identity, label = "selection") {
    return stableHash(`${RNG_NAMESPACE}|${identity}|${label}`) / 4294967296;
  }
  function normalizeProfile(input = {}) {
    return deepFreeze(Object.fromEntries(PROFILE_AXES.map(axis => [axis, clamp(input[axis], 0, 1, DEFAULT_PROFILE[axis])])));
  }
  function createProvisionalPlayerFit(input = {}) {
    const batting = clamp((Number(input.batting) || 0) / 20);
    const baseRunning = clamp((Number(input.baseRunning) || 0) / 20);
    const baseballIQ = clamp((Number(input.baseballIQ) || 0) / 20);
    const ballSense = clamp((Number(input.ballSense) || 0) / 20);
    return deepFreeze({
      version: "provisional-existing-capability-adapter-v1",
      standardAttack: round(0.35 + batting * 0.45 + ballSense * 0.2),
      sacrificeBunt: round(0.28 + baseballIQ * 0.4 + baseRunning * 0.2 + ballSense * 0.12),
      surpriseBunt: round(0.25 + baseRunning * 0.3 + baseballIQ * 0.25 + ballSense * 0.2)
    });
  }
  function sanitizeRecentObservableEvidence(input) {
    return (Array.isArray(input) ? input : []).filter(item => item && ALLOWED_EVIDENCE_TYPES.includes(item.type)).slice(-6).map(item => ({
      type: item.type,
      value: typeof item.value === "string" ? item.value : ""
    }));
  }
  function situationValue(action, context) {
    const hasRunner = context.runners.some(Boolean);
    const scoringPosition = Boolean(context.runners[1] || context.runners[2]);
    if (action === "standardAttack") return 0.58 + (context.outs >= 2 ? 0.16 : 0) + (context.scoreDifference < 0 ? 0.08 : 0);
    if (action === "sacrificeBunt") return 0.38 + (hasRunner ? 0.22 : 0) + (scoringPosition ? 0.1 : 0) - context.outs * 0.08;
    if (action === "surpriseBunt") return 0.34 + (context.outs >= 2 ? 0.08 : 0) + (!hasRunner ? 0.08 : 0);
    return 0;
  }
  function profileValue(action, profile) {
    if (action === "standardAttack") return profile.outPreservation * 0.24 - profile.variancePreference * 0.05;
    if (action === "sacrificeBunt") return profile.pressureCreation * 0.22 + profile.coordinationTrust * 0.2 - profile.outPreservation * 0.12;
    if (action === "surpriseBunt") return profile.informationExploitation * 0.28 + profile.variancePreference * 0.18 + profile.pressureCreation * 0.1;
    return 0;
  }
  function evidenceValue(action, evidence) {
    return evidence.reduce((total, item) => {
      if (item.type === "recentDefensiveChargeTiming" && item.value === "late" && action === "surpriseBunt") return total + 0.12;
      if (item.type === "previousBuntDefenseResponse" && item.value === "earlyCharge" && action === "standardAttack") return total + 0.08;
      if (item.type === "previousBuntDefenseResponse" && item.value === "earlyCharge" && action === "surpriseBunt") return total - 0.06;
      return total;
    }, 0);
  }
  function evaluateCandidates(opportunity, profile, playerFit, evidence) {
    const evaluations = opportunity.candidateActions.map(action => {
      const situation = situationValue(action, opportunity.context);
      const coachProfile = profileValue(action, profile);
      const fit = ((playerFit[action] ?? 0.5) - 0.5) * 0.28;
      const observedEvidence = evidenceValue(action, evidence);
      const utility = round(situation + coachProfile + fit + observedEvidence);
      return { action, situationValue: round(situation), coachProfileValue: round(coachProfile), provisionalPlayerFitValue: round(fit), recentObservableEvidenceValue: round(observedEvidence), utility };
    });
    const exponentials = evaluations.map(item => Math.exp(item.utility * 2));
    const total = exponentials.reduce((sum, value) => sum + value, 0) || 1;
    return evaluations.map((item, index) => ({ ...item, weight: round(exponentials[index] / total, 6) }));
  }
  function selectWeighted(evaluations, roll) {
    let cursor = 0;
    for (const evaluation of evaluations) {
      cursor += evaluation.weight;
      if (roll < cursor) return evaluation.action;
    }
    return evaluations.at(-1)?.action || "standardAttack";
  }
  function resolveTacticalDecision(input = {}) {
    if (!OffensiveTacticalOpportunity) throw new Error("OffensiveTacticalOpportunity is required");
    const opportunity = input.opportunity?.version ? input.opportunity : OffensiveTacticalOpportunity.resolveTacticalOpportunity(input.context || {});
    const profile = normalizeProfile(input.tacticalProfile || {});
    const playerFit = input.playerFit?.version ? deepFreeze(clone(input.playerFit)) : createProvisionalPlayerFit(input.playerCapabilities || {});
    const recentObservableEvidence = sanitizeRecentObservableEvidence(input.recentObservableEvidence);
    const candidates = opportunity.candidateActions.length ? opportunity.candidateActions : ["standardAttack"];
    const safeOpportunity = { ...opportunity, candidateActions: candidates };
    const evaluations = evaluateCandidates(safeOpportunity, profile, playerFit, recentObservableEvidence);
    const identity = String(input.identity || [opportunity.context.batterId || "batter", opportunity.context.inning, opportunity.context.half, opportunity.context.outs, opportunity.context.runners.map(Boolean).join("")].join("|"));
    const selectionRoll = deterministicUnit(`${input.seed ?? "default"}|${identity}`);
    const selectedAction = selectWeighted(evaluations, selectionRoll);
    return deepFreeze({
      version: VERSION,
      identity,
      rngNamespace: RNG_NAMESPACE,
      selectedAction,
      distribution: Object.fromEntries(evaluations.map(item => [item.action, item.weight])),
      debugTrace: {
        tacticalContext: clone(opportunity.context),
        opportunityEntries: clone(opportunity.entries),
        candidateActions: candidates.slice(),
        provisionalTacticalProfile: clone(profile),
        provisionalPlayerFit: clone(playerFit),
        recentObservableEvidence: clone(recentObservableEvidence),
        subjectiveEvaluations: clone(evaluations),
        selectionRoll,
        selectedTacticalAction: selectedAction,
        inputBoundary: ["currentGameContext", "provisionalTacticalProfile", "existingPlayerCapabilities", "recentObservableDefensiveResponse"]
      }
    });
  }

  return deepFreeze({ VERSION, RNG_NAMESPACE, DEFAULT_PROFILE, ALLOWED_EVIDENCE_TYPES, deterministicUnit, normalizeProfile, createProvisionalPlayerFit, sanitizeRecentObservableEvidence, resolveTacticalDecision });
});
