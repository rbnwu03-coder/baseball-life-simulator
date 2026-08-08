var CareerTransitionRuntimeResolver = ((careerSpineContract) => {
  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function unresolved(code, message, details) {
    return deepFreeze({
      status: "unresolved",
      resolved: false,
      nodeId: null,
      routeKey: null,
      transitionStep: null,
      eventId: null,
      issues: [{ code, message }],
      details: details ? clone(details) : null
    });
  }

  function resolveTransitionRuntime(playerState) {
    if (!playerState || typeof playerState !== "object" || Array.isArray(playerState)) {
      return unresolved(
        "transition-runtime-state-missing",
        "Adult Transition Runtime Resolver 需要 Player 狀態物件。"
      );
    }

    if (!careerSpineContract || typeof careerSpineContract.getCareerNetwork !== "function") {
      return unresolved(
        "career-network-contract-unavailable",
        "無法取得 Architecture Sprint 4.3 的成年職涯網路契約。"
      );
    }

    let network;
    try {
      network = careerSpineContract.getCareerNetwork();
    } catch (_error) {
      return unresolved(
        "career-network-contract-read-failed",
        "成年職涯網路契約無法讀取。"
      );
    }

    const transitionNode = Array.isArray(network?.adultNodes)
      ? network.adultNodes.find(node => node.networkRole === "initial-route-and-shared-transition")
      : null;
    if (!transitionNode || typeof transitionNode.chapter !== "string") {
      return unresolved(
        "transition-runtime-node-missing",
        "成年職涯網路沒有唯一的生涯轉換期節點。"
      );
    }

    if (playerState.chapter !== transitionNode.chapter) {
      return unresolved(
        "transition-runtime-chapter-ineligible",
        "目前 chapter 不屬於生涯轉換期 Runtime Routing。",
        { chapter: playerState.chapter, expectedChapter: transitionNode.chapter }
      );
    }

    const matchingRoutes = Array.isArray(network.initialRoutes)
      ? network.initialRoutes.filter(route =>
        Array.isArray(route.careerExits) && route.careerExits.includes(playerState.careerExit)
      )
      : [];
    if (matchingRoutes.length !== 1) {
      return unresolved(
        matchingRoutes.length === 0
          ? "transition-runtime-career-exit-unmapped"
          : "transition-runtime-career-exit-ambiguous",
        matchingRoutes.length === 0
          ? "careerExit 沒有對應到合法的成年轉換路線。"
          : "careerExit 同時對應到多個成年轉換路線。",
        { careerExit: playerState.careerExit, matchingRouteCount: matchingRoutes.length }
      );
    }

    const route = matchingRoutes[0];
    const routeEventIds = []
      .concat(Array.isArray(route.exclusiveEventIds) ? route.exclusiveEventIds : [])
      .concat(Array.isArray(route.sharedEventIds) ? route.sharedEventIds : []);
    const transitionStep = playerState.transitionStep;
    if (
      !Number.isInteger(transitionStep) ||
      transitionStep < 0 ||
      transitionStep >= routeEventIds.length
    ) {
      return unresolved(
        "transition-runtime-step-invalid",
        "transitionStep 不是目前成年路線的合法事件索引。",
        { transitionStep, legalMin: 0, legalMax: routeEventIds.length - 1 }
      );
    }

    const eventId = routeEventIds[transitionStep];
    if (typeof eventId !== "string" || !eventId.trim()) {
      return unresolved(
        "transition-runtime-event-missing",
        "成年職涯網路在目前 transitionStep 沒有合法事件。",
        { routeKey: route.routeKey, transitionStep }
      );
    }

    return deepFreeze({
      status: "resolved",
      resolved: true,
      nodeId: transitionNode.nodeId,
      routeKey: route.routeKey,
      transitionStep,
      eventId,
      issues: []
    });
  }

  const api = Object.freeze({ resolveTransitionRuntime });
  if (typeof window !== "undefined") window.CareerTransitionRuntimeResolver = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})(
  typeof CareerSpineContract !== "undefined"
    ? CareerSpineContract
    : typeof require === "function"
      ? require("./career-spine-contract.js")
      : null
);
