var GraduationTransitionResolver = ((careerSpineContract) => {
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
      target: null,
      issues: [{ code, message }],
      details: details ? clone(details) : null
    });
  }

  function resolveGraduationTransition(graduationState) {
    if (!graduationState || typeof graduationState !== "object" || Array.isArray(graduationState)) {
      return unresolved(
        "graduation-state-missing",
        "Graduation Transition Resolver 需要一份高中畢業狀態物件。"
      );
    }

    if (
      !careerSpineContract ||
      typeof careerSpineContract.getCareerNetwork !== "function" ||
      typeof careerSpineContract.getCareerNetworkSnapshot !== "function"
    ) {
      return unresolved(
        "career-network-contract-unavailable",
        "無法取得 Architecture Sprint 4.3 的成年職涯網路契約。"
      );
    }

    const snapshot = careerSpineContract.getCareerNetworkSnapshot(graduationState);
    if (snapshot.status !== "recognized" || snapshot.careerStage !== "high-school-exit") {
      return unresolved(
        "graduation-state-invalid",
        "輸入不是可供成年入口解析的合法高中畢業狀態。",
        { snapshotStatus: snapshot.status, nodeId: snapshot.nodeId, issues: snapshot.issues }
      );
    }

    if (snapshot.forcedEventId) {
      return unresolved(
        "graduation-state-not-stable",
        "高中畢業狀態仍有 forcedEventId，尚未形成穩定的成年轉換交接點。",
        { forcedEventId: snapshot.forcedEventId }
      );
    }

    const network = careerSpineContract.getCareerNetwork();
    const matchingRoutes = network.initialRoutes.filter(route =>
      Array.isArray(route.careerExits) && route.careerExits.includes(snapshot.careerExit)
    );

    if (matchingRoutes.length !== 1) {
      return unresolved(
        matchingRoutes.length === 0 ? "graduation-route-unmapped" : "graduation-route-ambiguous",
        matchingRoutes.length === 0
          ? "高中畢業出口沒有對應到成年職涯網路中的合法入口。"
          : "高中畢業出口同時對應到多個成年職涯入口。",
        { careerExit: snapshot.careerExit, matchingRouteCount: matchingRoutes.length }
      );
    }

    if (!Array.isArray(snapshot.actualNextNodeIds) || snapshot.actualNextNodeIds.length !== 1) {
      return unresolved(
        "adult-entry-node-ambiguous",
        "高中畢業節點沒有唯一的成年職涯下一節點。",
        { actualNextNodeIds: snapshot.actualNextNodeIds }
      );
    }

    const targetNode = network.adultNodes.find(node => node.nodeId === snapshot.actualNextNodeIds[0]);
    if (!targetNode || targetNode.networkRole !== "initial-route-and-shared-transition") {
      return unresolved(
        "adult-entry-node-missing",
        "高中畢業狀態指向的成年職涯入口不存在或不是合法入口節點。",
        { targetNodeId: snapshot.actualNextNodeIds[0] }
      );
    }

    const route = matchingRoutes[0];
    if (!Array.isArray(route.exclusiveEventIds) || route.exclusiveEventIds.length === 0) {
      return unresolved(
        "adult-entry-event-missing",
        "成年職涯路線沒有可用的第一個專屬入口事件。",
        { routeKey: route.routeKey }
      );
    }

    return deepFreeze({
      status: "resolved",
      resolved: true,
      source: {
        nodeId: snapshot.nodeId,
        chapter: snapshot.chapter,
        age: snapshot.age,
        careerExit: snapshot.careerExit
      },
      target: {
        nodeId: targetNode.nodeId,
        chapter: targetNode.chapter,
        routeKey: route.routeKey,
        entryEventId: route.exclusiveEventIds[0]
      },
      issues: []
    });
  }

  const api = Object.freeze({ resolveGraduationTransition });
  if (typeof window !== "undefined") window.GraduationTransitionResolver = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})(
  typeof CareerSpineContract !== "undefined"
    ? CareerSpineContract
    : typeof require === "function"
      ? require("./career-spine-contract.js")
      : null
);
