var AdultCareerSaveAdmission = ((careerSpineContract, transitionRuntimeResolver, developmentRuntimeResolver) => {
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

  function result(status, admitted, snapshot, issues) {
    return deepFreeze({
      status,
      admitted,
      nodeId: snapshot?.nodeId || null,
      careerStage: snapshot?.careerStage || null,
      networkSegment: snapshot?.networkSegment || null,
      issues: clone(Array.isArray(issues) ? issues : [])
    });
  }

  function rejection(code, message, snapshot, inheritedIssues) {
    const issues = Array.isArray(inheritedIssues) && inheritedIssues.length
      ? inheritedIssues
      : [{ code, message }];
    return result("rejected", false, snapshot, issues);
  }

  function evaluate(candidateState) {
    if (!candidateState || typeof candidateState !== "object" || Array.isArray(candidateState)) {
      return rejection(
        "save-admission-candidate-missing",
        "Adult Career Save Admission 需要 normalized candidate 狀態。"
      );
    }

    if (
      !careerSpineContract ||
      typeof careerSpineContract.getCareerNetworkSnapshot !== "function" ||
      typeof careerSpineContract.getCareerNetwork !== "function"
    ) {
      return rejection(
        "career-spine-contract-unavailable",
        "無法取得成年職涯存檔所需的 Career Spine Contract。"
      );
    }

    let snapshot;
    let network;
    try {
      snapshot = careerSpineContract.getCareerNetworkSnapshot(candidateState);
      network = careerSpineContract.getCareerNetwork();
    } catch (_error) {
      return rejection(
        "career-save-contract-read-failed",
        "無法讀取 normalized candidate 的職涯契約狀態。"
      );
    }

    if (snapshot?.status === "unknown") {
      return rejection(
        "career-save-chapter-unknown",
        "目前 Career Spine Contract 無法辨識這份存檔的人生節點。",
        snapshot,
        snapshot.issues
      );
    }

    if (snapshot?.careerStage === "pre-adult") {
      return result("bypassed", true, snapshot, []);
    }

    const matchingAdultNodes = Array.isArray(network?.adultNodes)
      ? network.adultNodes.filter(node => node.nodeId === snapshot?.nodeId)
      : [];
    if (matchingAdultNodes.length !== 1) {
      return rejection(
        matchingAdultNodes.length === 0
          ? "career-save-adult-node-missing"
          : "career-save-adult-node-ambiguous",
        matchingAdultNodes.length === 0
          ? "Contract snapshot 無法對應到唯一的成年職涯節點。"
          : "Contract snapshot 同時對應到多個成年職涯節點。",
        snapshot
      );
    }

    if (snapshot.status !== "recognized" && snapshot.status !== "completed") {
      return rejection(
        "career-save-adult-state-inconsistent",
        "成年職涯存檔與目前 Career Contract 不一致。",
        snapshot,
        snapshot.issues
      );
    }

    const adultNode = matchingAdultNodes[0];
    if (adultNode.networkRole === "initial-route-and-shared-transition") {
      if (
        !transitionRuntimeResolver ||
        typeof transitionRuntimeResolver.resolveTransitionRuntime !== "function"
      ) {
        return rejection(
          "transition-runtime-resolver-unavailable",
          "無法驗證生涯轉換期存檔的 Runtime 路由。",
          snapshot
        );
      }
      const runtime = transitionRuntimeResolver.resolveTransitionRuntime(candidateState);
      if (!runtime?.resolved) {
        return rejection(
          "transition-runtime-unresolved",
          "生涯轉換期存檔無法解析為合法 Runtime 事件。",
          snapshot,
          runtime?.issues
        );
      }
    }

    if (adultNode.networkRole === "shared-development") {
      if (
        !developmentRuntimeResolver ||
        typeof developmentRuntimeResolver.resolveDevelopmentRuntime !== "function"
      ) {
        return rejection(
          "development-runtime-resolver-unavailable",
          "無法驗證發展期存檔的 Runtime 路由。",
          snapshot
        );
      }
      const runtime = developmentRuntimeResolver.resolveDevelopmentRuntime(candidateState);
      if (!runtime?.resolved) {
        return rejection(
          "development-runtime-unresolved",
          "發展期存檔無法解析為合法 Runtime 事件。",
          snapshot,
          runtime?.issues
        );
      }
    }

    return result("admitted", true, snapshot, []);
  }

  const api = Object.freeze({ evaluate });
  if (typeof window !== "undefined") window.AdultCareerSaveAdmission = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})(
  typeof CareerSpineContract !== "undefined"
    ? CareerSpineContract
    : typeof require === "function"
      ? require("./career-spine-contract.js")
      : null,
  typeof CareerTransitionRuntimeResolver !== "undefined"
    ? CareerTransitionRuntimeResolver
    : typeof require === "function"
      ? require("./career-transition-runtime-resolver.js")
      : null,
  typeof CareerDevelopmentRuntimeResolver !== "undefined"
    ? CareerDevelopmentRuntimeResolver
    : typeof require === "function"
      ? require("./career-development-runtime-resolver.js")
      : null
);
