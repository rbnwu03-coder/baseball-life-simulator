(function (root, factory) {
  const plate = root.OffensivePlateApproach || (typeof module === "object" && module.exports && typeof require === "function" ? require("./offensive-plate-approach.js") : null);
  const lifecycle = root.MatchSituationLifecycle || (typeof module === "object" && module.exports && typeof require === "function" ? require("./match-situation-lifecycle.js") : null);
  const api = factory(plate, lifecycle);
  root.PlateDecisionFoundation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (OffensivePlateApproach, MatchSituationLifecycle) {
  "use strict";

  const VERSION = "plate-decision-foundation-v1";
  const ROUTES = Object.freeze([
    Object.freeze({ routeId: "take", matchDecision: "take", text: "放掉", action: "take", tradeoff: "避開追打，但好球會直接累積好球數。" }),
    Object.freeze({ routeId: "contactSwing", matchDecision: "contactSwing", text: "確實碰球", action: "swing", tradeoff: "擴大碰球與時間窗口，但降低最大擊球傷害。" }),
    Object.freeze({ routeId: "powerSwing", matchDecision: "powerSwing", text: "全力攻擊", action: "swing", tradeoff: "提高擊球傷害上限，但縮小時間與碰球窗口。" })
  ]);

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function assertDependencies() {
    if (!OffensivePlateApproach || !MatchSituationLifecycle) throw new Error("Plate Decision dependencies unavailable");
  }

  function buildSituationIdentity(input, pitch) {
    return MatchSituationLifecycle.createSituationId({
      gameId: input.gameId,
      inning: input.inning,
      half: input.half,
      paIdentity: input.plateAppearanceState.paIdentity,
      simulationPoint: `pitch-${input.plateAppearanceState.pitchNumber + 1}|${pitch.pitchId}`,
      type: MatchSituationLifecycle.TYPES.plateDecision
    });
  }

  function prepare(input = {}) {
    assertDependencies();
    let plateAppearanceState = OffensivePlateApproach.normalizePlateAppearanceState(input.plateAppearanceState);
    if (!plateAppearanceState || plateAppearanceState.completed) return deepFreeze({ plateAppearanceState, situation: null, duplicate: Boolean(plateAppearanceState?.completed) });
    plateAppearanceState = OffensivePlateApproach.prepareNextPitch(plateAppearanceState, input.pitch || null);
    const pitch = plateAppearanceState.pendingPitch;
    const recognition = OffensivePlateApproach.getRecognitionResult(plateAppearanceState, pitch, input.abilities || {}, input.recognitionRoll);
    const situationId = buildSituationIdentity({ ...input, plateAppearanceState }, pitch);
    if (input.existingSituation?.situationId === situationId) {
      return deepFreeze({ plateAppearanceState, situation: MatchSituationLifecycle.normalizeSituation(input.existingSituation), duplicate: true });
    }
    let situation = MatchSituationLifecycle.createSituation({
      situationId,
      type: MatchSituationLifecycle.TYPES.plateDecision,
      gameId: input.gameId,
      inning: input.inning,
      half: input.half,
      paIdentity: plateAppearanceState.paIdentity,
      simulationPoint: `pitch-${plateAppearanceState.pitchNumber + 1}`,
      actor: { id: input.batterId || plateAppearanceState.batterId, role: "batter" },
      sourceAuthority: "existingOffensivePlateApproachPitchTruth",
      sourcePhysicalStateRef: pitch.pitchId,
      createdAt: { balls: plateAppearanceState.balls, strikes: plateAppearanceState.strikes, pitchNumber: plateAppearanceState.pitchNumber + 1 },
      contextSnapshot: {
        count: { balls: plateAppearanceState.balls, strikes: plateAppearanceState.strikes },
        batterId: input.batterId || plateAppearanceState.batterId,
        pitcherId: input.pitcherId || pitch.pitcherId,
        paIdentity: plateAppearanceState.paIdentity,
        pitchIndex: plateAppearanceState.pitchNumber + 1,
        actualPitchRef: pitch.pitchId,
        recognitionState: recognition.recognitionState,
        perceivedPitchClass: recognition.perceivedPitchClass,
        perceivedPitch: clone(recognition.perceivedPitch)
      },
      legalRoutes: ROUTES,
      previousSituationSummary: input.previousSituationSummary || null
    });
    situation = MatchSituationLifecycle.admitSituation(situation, {
      supported: true,
      playerOwnsDecision: input.playerOwnsDecision !== false,
      reason: input.playerOwnsDecision === false ? "nonPlayerPlateDecision" : "threeDistinctPitchLevelRoutes"
    });
    if (situation.admission.admittedToPlayer) situation = MatchSituationLifecycle.presentSituation(situation);
    return deepFreeze({ plateAppearanceState, situation, recognition, duplicate: false });
  }

  function resolve(input = {}) {
    assertDependencies();
    let situation = MatchSituationLifecycle.normalizeSituation(input.situation);
    const plateAppearanceState = OffensivePlateApproach.normalizePlateAppearanceState(input.plateAppearanceState);
    if (!situation || situation.type !== MatchSituationLifecycle.TYPES.plateDecision || !plateAppearanceState) throw new Error("invalid plate decision state");
    if (situation.lifecycleState === "closed") return deepFreeze({ plateAppearanceState, situation, event: input.priorEvent || null, duplicate: true });
    const routeId = String(input.routeId || "");
    if (situation.lifecycleState === "presented") situation = MatchSituationLifecycle.recordDecision(situation, { selectedRoute: routeId, decidedBy: "player" });
    if (situation.lifecycleState === "admitted" && !situation.admission?.admittedToPlayer) {
      const automaticRoute = situation.legalRoutes[0]?.routeId || "take";
      situation = MatchSituationLifecycle.beginExecution(situation, { selectedRoute: automaticRoute, handoffRef: situation.sourcePhysicalStateRef, reason: "automaticPlateDecisionExecution" });
    } else if (situation.lifecycleState === "decided") {
      situation = MatchSituationLifecycle.beginExecution(situation, { selectedRoute: routeId, handoffRef: situation.sourcePhysicalStateRef, executionIdentity: `${situation.situationId}|execution` });
    }
    if (situation.lifecycleState !== "executing") throw new Error("plate decision is not executable");
    const selectedRoute = situation.executionState.selectedRoute;
    const recognition = {
      correct: situation.contextSnapshot.recognitionState === "accurate",
      recognitionState: situation.contextSnapshot.recognitionState,
      perceivedPitchClass: situation.contextSnapshot.perceivedPitchClass || input.perceivedPitchClass || input.recognition?.perceivedPitchClass,
      perceivedPitch: clone(situation.contextSnapshot.perceivedPitch)
    };
    if (!recognition.perceivedPitchClass) recognition.perceivedPitchClass = input.recognition?.perceivedPitchClass || "competitiveStrike";
    const resolved = OffensivePlateApproach.resolveNextPitch(plateAppearanceState, input.abilities || {}, {
      ...clone(input.executionOptions || {}),
      decisionRoute: selectedRoute,
      recognition
    });
    const event = resolved.event;
    situation = MatchSituationLifecycle.resolveSituation(situation, {
      physicalOutcomeRef: event.pitchResult === "ballInPlay" ? event.battedBallPhysicalTruth?.identity || `${situation.situationId}|contact` : `${situation.situationId}|${event.pitchResult}`,
      outsDelta: 0,
      runsDelta: 0,
      runnerActorOutcomes: [],
      executionEvidence: { decision: selectedRoute, recognitionState: recognition.recognitionState, components: clone(event.executionEvidence || null), pitchResult: event.pitchResult },
      reason: event.pitchResult
    });
    situation = MatchSituationLifecycle.markSettled(situation, { identity: `${situation.situationId}|count-${event.countAfter.balls}-${event.countAfter.strikes}` });
    situation = MatchSituationLifecycle.closeSituation(situation, { reason: resolved.state.completed ? "plateAppearanceTerminalPitch" : "pitchResolutionComplete" });
    return deepFreeze({ plateAppearanceState: resolved.state, situation, event, duplicate: false });
  }

  function getPlayerFacingContext(situation) {
    const normalized = MatchSituationLifecycle.normalizeSituation(situation);
    if (!normalized || normalized.type !== MatchSituationLifecycle.TYPES.plateDecision) return null;
    return deepFreeze({
      count: clone(normalized.contextSnapshot.count),
      pitchIndex: normalized.contextSnapshot.pitchIndex,
      recognitionState: normalized.contextSnapshot.recognitionState,
      perceivedPitch: clone(normalized.contextSnapshot.perceivedPitch),
      routes: ROUTES.map(clone)
    });
  }

  return deepFreeze({ VERSION, ROUTES, prepare, resolve, getPlayerFacingContext });
});
