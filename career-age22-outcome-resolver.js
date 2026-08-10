var CareerAge22OutcomeResolver = ((careerSpineContract) => {
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

  const OUTCOME_DEFINITIONS = deepFreeze({
    "professional-competitive": {
      routeKey: "draft",
      currentIdentity: "professional",
      marketOutcome: "一軍短期升格／正式名單競爭",
      developmentResult: "職業體系開始把你當成可用戰力",
      developmentDetail: "你仍不是穩定一軍球員，但角色、健康與近期表現已足以換到真正的升格機會。"
    },
    "professional-roster-risk": {
      routeKey: "draft",
      currentIdentity: "professional",
      marketOutcome: "二軍續留邊緣／球團耐心下降",
      developmentResult: "職業名額開始計算你的替代成本",
      developmentDetail: "年紀與新秀加入讓球團不再只看潛力。下一次評估可能直接決定釋出或轉隊。"
    },
    "college-draft-window": {
      routeKey: "college",
      currentIdentity: "college",
      marketOutcome: "大卒選秀追蹤名單",
      developmentResult: "四年成長讓球探重新回來",
      developmentDetail: "大學路線的價值取決於二十二歲時能否立即使用，而不再只是晚熟想像。"
    },
    "college-uncertain": {
      routeKey: "college",
      currentIdentity: "college",
      marketOutcome: "大學主力／落選風險並存",
      developmentResult: "大學延長了時間，尚未消除市場疑問",
      developmentDetail: "大學路線的價值取決於二十二歲時能否立即使用，而不再只是晚熟想像。"
    },
    "amateur-professional-window": {
      routeKey: "amateur",
      currentIdentity: "amateur",
      marketOutcome: "晚成選秀／職業測試邀請",
      developmentResult: "有限曝光終於形成職業入口",
      developmentDetail: "職業機會不一定出現，但經濟與棒球不再只能二選一。"
    },
    "amateur-stable": {
      routeKey: "amateur",
      currentIdentity: "amateur",
      marketOutcome: "業餘主力與穩定工作",
      developmentResult: "你建立了能長期留在棒球裡的生活",
      developmentDetail: "職業機會不一定出現，但經濟與棒球不再只能二選一。"
    },
    "rehab-player-reentry": {
      routeKey: "rehab",
      currentIdentity: "rehab",
      marketOutcome: "復出測試／業餘隊邀請",
      developmentResult: "你重新取得以球員身分被評估的資格",
      developmentDetail: "復健結果同時打開球員測試、基層協助與棒球第二職涯的可能。"
    },
    "rehab-second-career": {
      routeKey: "rehab",
      currentIdentity: "rehab",
      marketOutcome: "持續復健／轉向第二角色",
      developmentResult: "回到原本球員樣貌不再是唯一答案",
      developmentDetail: "復健結果同時打開球員測試、基層協助與棒球第二職涯的可能。"
    }
  });

  function issue(code, message) {
    return { code, message };
  }

  function unresolved(code, message, extra = {}) {
    return deepFreeze(Object.assign({
      status: "unresolved",
      resolved: false,
      routeKey: null,
      currentIdentity: null,
      outcomeCode: null,
      marketOutcome: null,
      developmentResult: null,
      developmentDetail: null,
      definition: null,
      issues: [issue(code, message)]
    }, clone(extra)));
  }

  function resolved(routeKey, outcomeCode) {
    const definition = OUTCOME_DEFINITIONS[outcomeCode];
    return deepFreeze({
      status: "resolved",
      resolved: true,
      routeKey,
      currentIdentity: definition.currentIdentity,
      outcomeCode,
      marketOutcome: definition.marketOutcome,
      developmentResult: definition.developmentResult,
      developmentDetail: definition.developmentDetail,
      definition: clone(definition),
      issues: []
    });
  }

  function getRouteKey(careerExit) {
    if (typeof careerExit !== "string" || !careerExit) {
      return { routeKey: null, issues: [issue("career-exit-invalid", "careerExit 必須是現行契約中的非空字串。") ] };
    }
    if (!careerSpineContract || typeof careerSpineContract.getCareerNetwork !== "function") {
      return { routeKey: null, issues: [issue("career-spine-contract-unavailable", "無法取得 Career Spine Contract 的成年入口資料。") ] };
    }

    let network;
    try {
      network = careerSpineContract.getCareerNetwork();
    } catch (_error) {
      return { routeKey: null, issues: [issue("career-network-read-failed", "無法讀取 Career Spine Contract 的成年入口資料。") ] };
    }

    const matchingRoutes = Array.isArray(network?.initialRoutes)
      ? network.initialRoutes.filter(route =>
        typeof route?.routeKey === "string" &&
        Array.isArray(route.careerExits) &&
        route.careerExits.includes(careerExit)
      )
      : [];

    if (matchingRoutes.length !== 1) {
      return {
        routeKey: null,
        issues: [issue(
          matchingRoutes.length > 1 ? "career-exit-ambiguous" : "career-exit-unknown",
          matchingRoutes.length > 1
            ? "careerExit 同時對應到多個成年入口。"
            : "careerExit 不屬於目前 Career Spine Contract 的合法成年入口。"
        )]
      };
    }
    return { routeKey: matchingRoutes[0].routeKey, issues: [] };
  }

  function resolve(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return unresolved("candidate-missing", "Age-22 Outcome Resolver 需要分類輸入物件。");
    }
    if (typeof candidate.marketScore !== "number" || !Number.isFinite(candidate.marketScore)) {
      return unresolved("market-score-invalid", "marketScore 必須是有限數字。");
    }
    if (typeof candidate.injuryRisk !== "number" || !Number.isFinite(candidate.injuryRisk)) {
      return unresolved("injury-risk-invalid", "injuryRisk 必須是有限數字。");
    }

    const route = getRouteKey(candidate.careerExit);
    if (!route.routeKey) {
      const firstIssue = route.issues[0];
      return unresolved(firstIssue.code, firstIssue.message);
    }

    let outcomeCode = "";
    if (route.routeKey === "draft") {
      outcomeCode = candidate.marketScore >= 12
        ? "professional-competitive"
        : "professional-roster-risk";
    } else if (route.routeKey === "college") {
      outcomeCode = candidate.marketScore >= 11
        ? "college-draft-window"
        : "college-uncertain";
    } else if (route.routeKey === "amateur") {
      outcomeCode = candidate.marketScore >= 10
        ? "amateur-professional-window"
        : "amateur-stable";
    } else if (route.routeKey === "rehab") {
      outcomeCode = candidate.injuryRisk <= 4
        ? "rehab-player-reentry"
        : "rehab-second-career";
    } else {
      return unresolved("route-key-unsupported", "Career Spine Contract 回傳了尚未支援的成年入口身分。");
    }

    return resolved(route.routeKey, outcomeCode);
  }

  function resolveLegacyOutcome(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return unresolved("legacy-candidate-missing", "Legacy Outcome Resolver 需要相容性輸入物件。");
    }
    if (typeof candidate.marketOutcome !== "string" || !candidate.marketOutcome) {
      return unresolved("legacy-market-outcome-missing", "Legacy marketOutcome 不存在或不是字串。");
    }

    const route = getRouteKey(candidate.careerExit);
    if (!route.routeKey) {
      const firstIssue = route.issues[0];
      return unresolved(firstIssue.code, firstIssue.message);
    }

    const matches = Object.entries(OUTCOME_DEFINITIONS).filter(([, definition]) =>
      definition.routeKey === route.routeKey &&
      definition.marketOutcome === candidate.marketOutcome
    );
    if (matches.length !== 1) {
      return unresolved("legacy-outcome-unrecognized", "Legacy marketOutcome 與 careerExit 路線不構成唯一合法結果。");
    }
    return resolved(route.routeKey, matches[0][0]);
  }

  function validatePersistedOutcome(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return unresolved("persisted-candidate-missing", "Persisted Outcome validation 需要候選狀態。");
    }
    const route = getRouteKey(candidate.careerExit);
    if (!route.routeKey) {
      const firstIssue = route.issues[0];
      return unresolved(firstIssue.code, firstIssue.message);
    }
    if (typeof candidate.age22OutcomeCode !== "string" || !candidate.age22OutcomeCode) {
      return unresolved("age22-outcome-code-missing", "二十二歲結果缺少 age22OutcomeCode。");
    }

    const definition = OUTCOME_DEFINITIONS[candidate.age22OutcomeCode];
    if (!definition) {
      return unresolved("age22-outcome-code-unknown", "age22OutcomeCode 不是目前登錄的二十二歲結果。");
    }
    if (definition.routeKey !== route.routeKey) {
      return unresolved("age22-outcome-route-mismatch", "age22OutcomeCode 與 careerExit 所屬成年路線不一致。");
    }

    const textFields = ["marketOutcome", "developmentResult", "developmentDetail"];
    const mismatchedField = textFields.find(field => candidate[field] !== definition[field]);
    if (mismatchedField) {
      return unresolved(
        "age22-outcome-text-mismatch",
        `age22OutcomeCode 與 ${mismatchedField} 的既有結算文字不一致。`
      );
    }
    return resolved(route.routeKey, candidate.age22OutcomeCode);
  }

  const api = Object.freeze({
    resolve,
    resolveLegacyOutcome,
    validatePersistedOutcome
  });
  if (typeof window !== "undefined") window.CareerAge22OutcomeResolver = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})(
  typeof CareerSpineContract !== "undefined"
    ? CareerSpineContract
    : typeof require === "function"
      ? require("./career-spine-contract.js")
      : null
);
