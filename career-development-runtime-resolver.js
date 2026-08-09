var CareerDevelopmentRuntimeResolver = ((careerSpineContract) => {
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
      developmentStep: null,
      eventId: null,
      issues: [{ code, message }],
      details: details ? clone(details) : null
    });
  }

  function resolveDevelopmentRuntime(playerState) {
    if (!playerState || typeof playerState !== "object" || Array.isArray(playerState)) {
      return unresolved(
        "development-runtime-state-missing",
        "Development Years Runtime Resolver 需要 Player 狀態物件。"
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

    const developmentNodes = Array.isArray(network?.adultNodes)
      ? network.adultNodes.filter(node => node.networkRole === "shared-development")
      : [];
    if (developmentNodes.length !== 1) {
      return unresolved(
        developmentNodes.length === 0
          ? "development-runtime-node-missing"
          : "development-runtime-node-ambiguous",
        developmentNodes.length === 0
          ? "成年職涯網路沒有發展期節點。"
          : "成年職涯網路存在多個發展期節點。",
        { matchingNodeCount: developmentNodes.length }
      );
    }

    const developmentNode = developmentNodes[0];
    if (playerState.chapter !== developmentNode.chapter) {
      return unresolved(
        "development-runtime-chapter-ineligible",
        "目前 chapter 不屬於發展期 Runtime Routing。",
        { chapter: playerState.chapter, expectedChapter: developmentNode.chapter }
      );
    }

    const ageRange = developmentNode.age;
    const age = playerState.age;
    if (
      !Array.isArray(ageRange) || ageRange.length !== 2 ||
      !Number.isInteger(ageRange[0]) || !Number.isInteger(ageRange[1]) ||
      !Number.isInteger(age) || age < ageRange[0] || age > ageRange[1]
    ) {
      return unresolved(
        "development-runtime-age-invalid",
        "age 不在 Contract 定義的發展期合法範圍。",
        { age, legalAge: clone(ageRange) }
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
          ? "development-runtime-career-exit-unmapped"
          : "development-runtime-career-exit-ambiguous",
        matchingRoutes.length === 0
          ? "careerExit 沒有對應到合法的成年來源路線。"
          : "careerExit 同時對應到多個成年來源路線。",
        { careerExit: clone(playerState.careerExit), matchingRouteCount: matchingRoutes.length }
      );
    }

    const progress = developmentNode.progress;
    const sharedDevelopment = network.sharedDevelopment;
    const eventIds = Array.isArray(sharedDevelopment?.eventIds)
      ? sharedDevelopment.eventIds
      : [];
    if (
      sharedDevelopment?.nodeId !== developmentNode.nodeId ||
      !progress || progress.field !== "developmentStep" ||
      !Number.isInteger(progress.min) || !Number.isInteger(progress.max) ||
      progress.max < progress.min ||
      eventIds.length !== progress.max - progress.min + 1 ||
      eventIds.some(eventId => typeof eventId !== "string" || !eventId.trim())
    ) {
      return unresolved(
        "development-runtime-contract-inconsistent",
        "發展期 progress 範圍與共用事件拓樸不一致。",
        {
          nodeId: developmentNode.nodeId,
          sharedNodeId: sharedDevelopment?.nodeId,
          progress: clone(progress),
          eventCount: eventIds.length
        }
      );
    }

    const developmentStep = playerState[progress.field];
    if (
      !Number.isInteger(developmentStep) ||
      developmentStep < progress.min ||
      developmentStep > progress.max
    ) {
      return unresolved(
        "development-runtime-step-invalid",
        "developmentStep 不是 Contract 定義的合法事件索引。",
        { developmentStep, legalMin: progress.min, legalMax: progress.max }
      );
    }

    const eventId = eventIds[developmentStep - progress.min];
    return deepFreeze({
      status: "resolved",
      resolved: true,
      nodeId: developmentNode.nodeId,
      routeKey: matchingRoutes[0].routeKey,
      developmentStep,
      eventId,
      issues: []
    });
  }

  const api = Object.freeze({ resolveDevelopmentRuntime });
  if (typeof window !== "undefined") window.CareerDevelopmentRuntimeResolver = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})(
  typeof CareerSpineContract !== "undefined"
    ? CareerSpineContract
    : typeof require === "function"
      ? require("./career-spine-contract.js")
      : null
);
