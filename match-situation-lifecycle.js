(function (root, factory) {
  const api = factory();
  root.MatchSituationLifecycle = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "match-situation-lifecycle-v1";
  const TYPES = Object.freeze({
    groundBallDefensiveDecision: "groundBallDefensiveDecision",
    runnerTagUpDecision: "runnerTagUpDecision"
  });
  const STATES = Object.freeze(["created", "admitted", "presented", "decided", "executing", "reassessing", "resolved", "settled", "closed"]);
  const PHASES = Object.freeze(["initial", "reassessment"]);
  const ALLOWED_TRANSITIONS = Object.freeze({
    created: Object.freeze(["admitted"]),
    admitted: Object.freeze(["presented", "executing"]),
    presented: Object.freeze(["decided"]),
    decided: Object.freeze(["executing"]),
    executing: Object.freeze(["reassessing", "resolved"]),
    reassessing: Object.freeze(["decided", "executing", "resolved"]),
    resolved: Object.freeze(["settled"]),
    settled: Object.freeze(["closed"]),
    closed: Object.freeze([])
  });

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  function normalizeRoutes(routes) {
    return (Array.isArray(routes) ? routes : []).filter(Boolean).map(route => clone(route));
  }
  function createSituationId(input = {}) {
    return [input.gameId || "match", input.inning || 0, input.half || "", input.paIdentity || "pa",
      input.simulationPoint || input.opportunityTraceId || "point", input.type || TYPES.groundBallDefensiveDecision].join("|");
  }
  function appendTransition(situation, state, details = {}) {
    const history = Array.isArray(situation.transitionHistory) ? situation.transitionHistory.map(clone) : [];
    history.push({ state, phase: details.phase || situation.phase || "initial", reason: details.reason || "" });
    return history;
  }
  function transition(situation, nextState, changes = {}, details = {}) {
    if (!situation || !STATES.includes(situation.lifecycleState)) throw new Error("invalid match situation");
    if (situation.lifecycleState === nextState && ["settled", "closed"].includes(nextState)) return situation;
    if (!(ALLOWED_TRANSITIONS[situation.lifecycleState] || []).includes(nextState)) {
      throw new Error(`illegal match situation transition: ${situation.lifecycleState} -> ${nextState}`);
    }
    return deepFreeze({
      ...clone(situation),
      ...clone(changes),
      lifecycleState: nextState,
      transitionHistory: appendTransition(situation, nextState, details)
    });
  }
  function createSituation(input = {}) {
    const type = input.type || TYPES.groundBallDefensiveDecision;
    const situationId = String(input.situationId || createSituationId({ ...input, type }));
    return deepFreeze({
      version: VERSION,
      situationId,
      type,
      lifecycleState: "created",
      phase: "initial",
      actor: clone(input.actor || null),
      sourceAuthority: String(input.sourceAuthority || ""),
      sourcePhysicalStateRef: String(input.sourcePhysicalStateRef || ""),
      createdAt: clone(input.createdAt || {}),
      contextSnapshot: clone(input.contextSnapshot || {}),
      legalRoutes: normalizeRoutes(input.legalRoutes),
      recommendation: clone(input.recommendation || null),
      admission: null,
      decision: null,
      executionState: null,
      reassessmentState: null,
      resolution: null,
      settlement: { applied: false, identity: "" },
      closeState: null,
      previousSituationSummary: clone(input.previousSituationSummary || null),
      transitionHistory: [{ state: "created", phase: "initial", reason: "canonicalContextFrozen" }]
    });
  }
  function admitSituation(situation, input = {}) {
    const routes = normalizeRoutes(situation.legalRoutes);
    const meaningfulRouteIds = [...new Set(routes.map(route => route.routeId || route.id || route.matchDecision).filter(Boolean))];
    const supported = input.supported !== false;
    const playerOwnsDecision = input.playerOwnsDecision === true;
    const admittedToPlayer = supported && playerOwnsDecision && meaningfulRouteIds.length >= 2;
    const mode = !supported ? "unsupportedFallback" : admittedToPlayer ? "playerDecision"
      : meaningfulRouteIds.length <= 1 ? "automaticResolution" : "aiDecision";
    const reason = input.reason || (admittedToPlayer ? "multipleBehaviorallyDistinctPlayerRoutes"
      : !supported ? "unsupportedSituation"
        : meaningfulRouteIds.length <= 1 ? "fewerThanTwoMeaningfulRoutes" : "playerDecisionOwnershipDenied");
    return transition(situation, "admitted", {
      admission: { mode, admittedToPlayer, reason, meaningfulRouteCount: meaningfulRouteIds.length }
    }, { reason });
  }
  function presentSituation(situation) {
    if (situation.lifecycleState === "presented") return situation;
    if (situation.admission?.admittedToPlayer !== true) throw new Error("only player-admitted situations can be presented");
    return transition(situation, "presented", {}, { reason: "canonicalSituationPresented" });
  }
  function recordDecision(situation, input = {}) {
    const selectedRoute = String(input.selectedRoute || "");
    const legal = situation.legalRoutes.some(route => [route.routeId, route.id, route.matchDecision].includes(selectedRoute));
    if (!legal) throw new Error(`illegal match situation route: ${selectedRoute}`);
    return transition(situation, "decided", {
      decision: { selectedRoute, decidedBy: input.decidedBy || "player" }
    }, { reason: "routeIntentRecorded" });
  }
  function beginExecution(situation, input = {}) {
    return transition(situation, "executing", {
      executionState: {
        status: "inProgress",
        selectedRoute: input.selectedRoute || situation.decision?.selectedRoute || "",
        handoffRef: input.handoffRef || "",
        physicalConsequenceApplied: false,
        executionIdentity: input.executionIdentity || ""
      }
    }, { reason: input.reason || "physicalResolverHandoff" });
  }
  function abandonSituation(situation, input = {}) {
    if (!situation || !STATES.includes(situation.lifecycleState)) throw new Error("invalid match situation");
    if (situation.lifecycleState === "closed" && situation.closeState?.terminalMode === "abandoned") return situation;
    if (["resolved", "settled", "closed"].includes(situation.lifecycleState)) {
      throw new Error(`match situation cannot be abandoned from ${situation.lifecycleState}`);
    }
    const execution = situation.executionState || {};
    const physicalConsequenceKnown = execution.physicalConsequenceApplied === true
      || Boolean(situation.resolution) || situation.settlement?.applied === true;
    if (situation.lifecycleState === "executing" && execution.physicalConsequenceApplied !== false) {
      throw new Error("match situation physical consequence is unknown; abandon rejected");
    }
    if (physicalConsequenceKnown) throw new Error("match situation cannot be abandoned after physical consequence");
    const reason = input.reason || "noPhysicalResolution";
    return deepFreeze({
      ...clone(situation),
      lifecycleState: "closed",
      executionState: execution && Object.keys(execution).length
        ? { ...clone(execution), status: "abandoned", physicalConsequenceApplied: false }
        : null,
      closeState: { reason, readyToResume: true, terminalMode: "abandoned", abandoned: true },
      transitionHistory: appendTransition(situation, "closed", { reason })
    });
  }
  function beginReassessment(situation, input = {}) {
    const remainingLegalRoutes = normalizeRoutes(input.remainingLegalRoutes);
    return transition(situation, "reassessing", {
      phase: "reassessment",
      reassessmentState: {
        trigger: input.trigger || "executionStateChanged",
        updatedPhysicalState: clone(input.updatedPhysicalState || null),
        remainingLegalRoutes,
        requiresDecision: input.requiresDecision === true,
        firstLegApplied: input.firstLegApplied === true
      }
    }, { phase: "reassessment", reason: input.trigger || "executionStateChanged" });
  }
  function resolveSituation(situation, input = {}) {
    if (situation.lifecycleState === "reassessing" && situation.reassessmentState?.requiresDecision) {
      throw new Error("cannot resolve while reassessment decision is pending");
    }
    return transition(situation, "resolved", {
      resolution: {
        physicalOutcomeRef: input.physicalOutcomeRef || "",
        outsDelta: Number(input.outsDelta) || 0,
        runsDelta: Number(input.runsDelta) || 0,
        runnerActorOutcomes: clone(input.runnerActorOutcomes || []),
        executionEvidence: clone(input.executionEvidence || null),
        reason: input.reason || "physicalExecutionComplete"
      },
      executionState: { ...clone(situation.executionState || {}), status: "complete" }
    }, { phase: situation.phase, reason: input.reason || "physicalExecutionComplete" });
  }
  function markSettled(situation, input = {}) {
    if (situation.lifecycleState === "settled" || situation.lifecycleState === "closed") return situation;
    return transition(situation, "settled", {
      settlement: { applied: true, identity: input.identity || `${situation.situationId}|settlement` }
    }, { phase: situation.phase, reason: "canonicalSettlementApplied" });
  }
  function closeSituation(situation, input = {}) {
    if (situation.lifecycleState === "closed") return situation;
    if (!situation.resolution || situation.settlement?.applied !== true
      || situation.reassessmentState?.requiresDecision === true || situation.executionState?.status === "inProgress") {
      throw new Error("match situation cannot close before resolution and settlement");
    }
    return transition(situation, "closed", {
      closeState: { reason: input.reason || "settlementComplete", readyToResume: true }
    }, { phase: situation.phase, reason: input.reason || "settlementComplete" });
  }
  function canResumeSimulation(situation) { return !situation || situation.lifecycleState === "closed"; }
  function createClosedSituationSummary(situation) {
    if (situation?.lifecycleState !== "closed") return null;
    return deepFreeze({
      situationId: situation.situationId,
      type: situation.type,
      lifecycleState: situation.lifecycleState,
      phase: situation.phase,
      selectedRoute: situation.decision?.selectedRoute || situation.executionState?.selectedRoute || "",
      outcome: situation.resolution?.reason || situation.closeState?.reason || "",
      outsBefore: Number(situation.createdAt?.outs) || 0,
      outsAfter: (Number(situation.createdAt?.outs) || 0) + (Number(situation.resolution?.outsDelta) || 0),
      settlementIdentity: situation.settlement?.identity || "",
      transitionHistory: clone(situation.transitionHistory || [])
    });
  }
  function normalizeSituation(saved) {
    if (!saved || typeof saved !== "object" || saved.version !== VERSION || !STATES.includes(saved.lifecycleState)) return null;
    return deepFreeze(clone(saved));
  }

  return deepFreeze({
    VERSION, TYPES, STATES, PHASES, ALLOWED_TRANSITIONS, createSituationId, createSituation,
    admitSituation, presentSituation, recordDecision, beginExecution, beginReassessment,
    resolveSituation, markSettled, closeSituation, abandonSituation, canResumeSimulation,
    createClosedSituationSummary, normalizeSituation
  });
});
