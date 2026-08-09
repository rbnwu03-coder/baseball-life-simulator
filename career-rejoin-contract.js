var CareerRejoinContract = ((careerSpineContract) => {
  "use strict";

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function emptyNetwork() {
    return deepFreeze({
      currentGate: {
        resultNodeId: null,
        terminalNodeId: null,
        playableAfterTerminal: false
      },
      identities: [],
      candidateEdges: [],
      postAge22RuntimePlayable: false
    });
  }

  function readContract() {
    if (
      !careerSpineContract ||
      typeof careerSpineContract.getCareerNetwork !== "function" ||
      typeof careerSpineContract.getCandidateTransitions !== "function"
    ) {
      return { network: null, candidates: null, error: "career-spine-contract-unavailable" };
    }

    try {
      return {
        network: careerSpineContract.getCareerNetwork(),
        candidates: careerSpineContract.getCandidateTransitions(),
        error: null
      };
    } catch (_error) {
      return { network: null, candidates: null, error: "career-spine-contract-read-failed" };
    }
  }

  function deriveIdentities(initialRoutes, candidateEdges) {
    const initialIds = [];
    (initialRoutes || []).forEach(route => {
      if (typeof route?.routeKey === "string" && route.routeKey) initialIds.push(route.routeKey);
    });

    const orderedIds = initialIds.slice();
    (candidateEdges || []).forEach(edge => {
      if (typeof edge?.sourceRoute === "string" && edge.sourceRoute) orderedIds.push(edge.sourceRoute);
      if (typeof edge?.targetRoute === "string" && edge.targetRoute) orderedIds.push(edge.targetRoute);
    });

    const identityIds = [...new Set(orderedIds)];
    const initialSet = new Set(initialIds);
    return identityIds.map(identityId => ({
      identityId,
      initialRouteIdentity: initialSet.has(identityId),
      futureOnly: !initialSet.has(identityId),
      candidateSource: candidateEdges.some(edge => edge.sourceRoute === identityId),
      candidateTarget: candidateEdges.some(edge => edge.targetRoute === identityId),
      outgoingCandidateEdgeIds: candidateEdges
        .filter(edge => edge.sourceRoute === identityId)
        .map(edge => edge.id),
      incomingCandidateEdgeIds: candidateEdges
        .filter(edge => edge.targetRoute === identityId)
        .map(edge => edge.id),
      postAge22RuntimePlayable: false
    }));
  }

  function getPostAge22Network() {
    const source = readContract();
    if (source.error) return emptyNetwork();

    const initialRoutes = Array.isArray(source.network?.initialRoutes)
      ? source.network.initialRoutes
      : [];
    const candidateEdges = Array.isArray(source.candidates)
      ? clone(source.candidates)
      : [];
    const endpoint = source.network?.currentEndpoint || {};

    return deepFreeze({
      currentGate: {
        resultNodeId: typeof endpoint.resultNodeId === "string" ? endpoint.resultNodeId : null,
        terminalNodeId: typeof endpoint.terminalNodeId === "string" ? endpoint.terminalNodeId : null,
        playableAfterTerminal: endpoint.playableAfterTerminal === true
      },
      identities: deriveIdentities(initialRoutes, candidateEdges),
      candidateEdges,
      postAge22RuntimePlayable: false
    });
  }

  function issue(code, message, details) {
    return details === undefined ? { code, message } : { code, message, details: clone(details) };
  }

  function auditPostAge22Network() {
    const issues = [];
    const source = readContract();
    if (source.error) {
      issues.push(issue(source.error, "Career Rejoin Contract 無法讀取 CareerSpineContract。"));
      return deepFreeze({ status: "error", identityCount: 0, candidateEdgeCount: 0, issues });
    }

    const network = source.network;
    const candidates = source.candidates;
    if (!network || typeof network !== "object") {
      issues.push(issue("career-network-invalid", "Career Network 必須是物件。"));
    }
    if (!Array.isArray(network?.initialRoutes)) {
      issues.push(issue("initial-routes-invalid", "Career Network initialRoutes 必須是陣列。"));
    }
    if (!Array.isArray(candidates)) {
      issues.push(issue("candidate-transitions-invalid", "Candidate transitions 必須是陣列。"));
    }

    const safeInitialRoutes = Array.isArray(network?.initialRoutes) ? network.initialRoutes : [];
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    const derived = getPostAge22Network();
    const identityIds = derived.identities.map(identity => identity.identityId);
    const identityIdSet = new Set(identityIds);
    const initialRouteIds = safeInitialRoutes.map(route => route?.routeKey);
    const candidateIds = safeCandidates.map(edge => edge?.id);
    const actualEdgeIds = new Set(
      (Array.isArray(network?.actualEdges) ? network.actualEdges : []).map(edge => edge?.id)
    );

    if (new Set(initialRouteIds).size !== initialRouteIds.length) {
      issues.push(issue("duplicate-initial-route-identity", "Initial route identity 不得重複。"));
    }
    if (initialRouteIds.some(routeKey => typeof routeKey !== "string" || !routeKey)) {
      issues.push(issue("initial-route-identity-invalid", "Initial route identity 必須是非空字串。"));
    }
    if (new Set(identityIds).size !== identityIds.length) {
      issues.push(issue("duplicate-derived-identity", "Derived identity 不得重複。"));
    }
    if (new Set(candidateIds).size !== candidateIds.length) {
      issues.push(issue("duplicate-candidate-edge", "Candidate edge ID 不得重複。"));
    }

    const endpoint = network?.currentEndpoint;
    if (!endpoint || typeof endpoint !== "object") {
      issues.push(issue("current-endpoint-missing", "Career Network 缺少 currentEndpoint。"));
    } else {
      if (typeof endpoint.resultNodeId !== "string" || !endpoint.resultNodeId) {
        issues.push(issue("result-node-invalid", "currentEndpoint.resultNodeId 無效。"));
      }
      if (typeof endpoint.terminalNodeId !== "string" || !endpoint.terminalNodeId) {
        issues.push(issue("terminal-node-invalid", "currentEndpoint.terminalNodeId 無效。"));
      }
      if (endpoint.playableAfterTerminal !== false) {
        issues.push(issue("terminal-playability-invalid", "現行 terminal 之後不得標記為可玩。"));
      }
      if (endpoint.resultNodeId && endpoint.resultNodeId === endpoint.terminalNodeId) {
        issues.push(issue("endpoint-node-collision", "結果節點與終止節點不得相同。"));
      }
      const adultNodeIds = new Set(
        (Array.isArray(network?.adultNodes) ? network.adultNodes : []).map(node => node?.nodeId)
      );
      if (endpoint.resultNodeId && !adultNodeIds.has(endpoint.resultNodeId)) {
        issues.push(issue("result-node-not-declared", "目前結果節點未登錄於 Career Network。"));
      }
      if (endpoint.terminalNodeId && !adultNodeIds.has(endpoint.terminalNodeId)) {
        issues.push(issue("terminal-node-not-declared", "目前終止節點未登錄於 Career Network。"));
      }
    }

    safeCandidates.forEach(edge => {
      if (!edge || typeof edge !== "object") {
        issues.push(issue("candidate-edge-invalid", "Candidate edge 必須是物件。"));
        return;
      }
      if (typeof edge.id !== "string" || !edge.id) {
        issues.push(issue("candidate-edge-id-invalid", "Candidate edge 缺少有效 ID。"));
      }
      if (typeof edge.sourceRoute !== "string" || !edge.sourceRoute) {
        issues.push(issue("candidate-source-invalid", "Candidate edge 缺少有效 sourceRoute。", { edgeId: edge.id || null }));
      }
      if (typeof edge.targetRoute !== "string" || !edge.targetRoute) {
        issues.push(issue("candidate-target-invalid", "Candidate edge 缺少有效 targetRoute。", { edgeId: edge.id || null }));
      }
      if (edge.sourceRoute && !identityIdSet.has(edge.sourceRoute)) {
        issues.push(issue("candidate-source-not-derived", "Candidate sourceRoute 未存在於衍生身分集合。", { edgeId: edge.id || null }));
      }
      if (edge.targetRoute && !identityIdSet.has(edge.targetRoute)) {
        issues.push(issue("candidate-target-not-derived", "Candidate targetRoute 未存在於衍生身分集合。", { edgeId: edge.id || null }));
      }
      if (edge.implemented !== false) {
        issues.push(issue("candidate-implemented", "Candidate edge 不得標記為已實作。", { edgeId: edge.id || null }));
      }
      if (!Array.isArray(edge.eventIds) || edge.eventIds.length !== 0) {
        issues.push(issue("candidate-event-ids-present", "Candidate edge 不得宣告 Runtime event ID。", { edgeId: edge.id || null }));
      }
      if (edge.contractStatus !== "candidate-only") {
        issues.push(issue("candidate-status-invalid", "Candidate edge 必須維持 candidate-only。", { edgeId: edge.id || null }));
      }
      if (edge.id && actualEdgeIds.has(edge.id)) {
        issues.push(issue("candidate-actual-edge-collision", "Candidate edge ID 不得與 actual edge 重複。", { edgeId: edge.id }));
      }
    });

    if (derived.postAge22RuntimePlayable !== false || derived.identities.some(identity => identity.postAge22RuntimePlayable !== false)) {
      issues.push(issue("post-age-22-runtime-playable", "4.11 不得建立 22 歲後可玩狀態。"));
    }

    return deepFreeze({
      status: issues.length ? "error" : "valid",
      identityCount: derived.identities.length,
      candidateEdgeCount: derived.candidateEdges.length,
      issues
    });
  }

  const api = Object.freeze({ getPostAge22Network, auditPostAge22Network });
  if (typeof window !== "undefined") window.CareerRejoinContract = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})(
  typeof CareerSpineContract !== "undefined"
    ? CareerSpineContract
    : typeof require === "function"
      ? require("./career-spine-contract.js")
      : null
);
