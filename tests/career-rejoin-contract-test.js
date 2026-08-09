const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const contract = require(path.join(root, "career-spine-contract.js"));
const rejoin = require(path.join(root, "career-rejoin-contract.js"));
const admission = require(path.join(root, "career-save-admission.js"));

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function isDeepFrozen(value, visited = new Set()) {
  if (!value || typeof value !== "object" || visited.has(value)) return true;
  visited.add(value);
  return Object.isFrozen(value) && Object.values(value).every(item => isDeepFrozen(item, visited));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadWithDependency(dependency) {
  const context = vm.createContext({
    CareerSpineContract: dependency,
    module: { exports: {} },
    console
  });
  vm.runInContext(
    fs.readFileSync(path.join(root, "career-rejoin-contract.js"), "utf8"),
    context,
    { filename: "career-rejoin-contract.js" }
  );
  return context.module.exports;
}

function dependencyFrom(overrides = {}) {
  const network = clone(contract.getCareerNetwork());
  const candidates = clone(contract.getCandidateTransitions());
  const dependency = {
    getCareerNetwork() { return network; },
    getCandidateTransitions() { return candidates; }
  };
  if (overrides.network) overrides.network(network);
  if (overrides.candidates) overrides.candidates(candidates);
  return overrides.api ? overrides.api(dependency) : dependency;
}

const sourceNetwork = contract.getCareerNetwork();
const sourceCandidates = contract.getCandidateTransitions();
const sourceBefore = JSON.stringify({ network: sourceNetwork, candidates: sourceCandidates });
const network = rejoin.getPostAge22Network();
const audit = rejoin.auditPostAge22Network();

const expectedCandidateIds = [
  "college-to-professional",
  "college-to-amateur",
  "amateur-to-professional",
  "professional-to-amateur",
  "professional-to-baseball-industry",
  "college-to-baseball-industry",
  "amateur-to-baseball-industry",
  "rehab-to-player-reentry"
];
const expectedIdentityIds = [
  "draft", "college", "amateur", "rehab",
  "professional", "baseball-industry", "player-competition"
];
const derivedIdentityIdsFromSource = [...new Set([
  ...sourceNetwork.initialRoutes.map(route => route.routeKey),
  ...sourceCandidates.flatMap(edge => [edge.sourceRoute, edge.targetRoute])
])];

verify("1. 4.11 只公開兩個唯讀查詢 API", Object.keys(rejoin).sort().join(",") === "auditPostAge22Network,getPostAge22Network");
verify("2. 現行 Contract 提供四個初始路線與八條候選轉換", sourceNetwork.initialRoutes.length === 4 && sourceCandidates.length === 8);
verify("3. 測試獨立計算聯集後與 4.11 衍生身分一致", JSON.stringify(network.identities.map(item => item.identityId)) === JSON.stringify(derivedIdentityIdsFromSource));
verify("4. 衍生聯集鎖定目前七個產品身分", JSON.stringify(derivedIdentityIdsFromSource) === JSON.stringify(expectedIdentityIds));
verify("5. 四個初始身分與三個 future-only 身分分類正確", network.identities.filter(item => item.initialRouteIdentity).length === 4
  && network.identities.filter(item => item.futureOnly).length === 3);
verify("6. Candidate edge 完整複製既有 Contract 語意", JSON.stringify(network.candidateEdges) === JSON.stringify(sourceCandidates));
verify("7. Candidate edge 與 Contract 回傳值沒有共享參照", network.candidateEdges !== sourceCandidates
  && network.candidateEdges.every((edge, index) => edge !== sourceCandidates[index] && edge.eventIds !== sourceCandidates[index].eventIds));
verify("8. 八條候選 ID 完整且沒有另建 Production registry", JSON.stringify(network.candidateEdges.map(edge => edge.id)) === JSON.stringify(expectedCandidateIds));

const byIdentity = Object.fromEntries(network.identities.map(item => [item.identityId, item]));
verify("9. draft 保留為現行入口且沒有虛構候選出邊", byIdentity.draft.initialRouteIdentity === true
  && byIdentity.draft.outgoingCandidateEdgeIds.length === 0
  && byIdentity.draft.incomingCandidateEdgeIds.length === 0);
verify("10. college 的候選出邊與既有 Contract 一致", JSON.stringify(byIdentity.college.outgoingCandidateEdgeIds) === JSON.stringify([
  "college-to-professional", "college-to-amateur", "college-to-baseball-industry"
]));
verify("11. amateur 同時可作為候選來源與目標", byIdentity.amateur.candidateSource === true
  && byIdentity.amateur.candidateTarget === true
  && byIdentity.amateur.incomingCandidateEdgeIds.includes("college-to-amateur")
  && byIdentity.amateur.incomingCandidateEdgeIds.includes("professional-to-amateur"));
verify("12. professional 僅由候選圖導出且保留正確進出邊", byIdentity.professional.futureOnly === true
  && byIdentity.professional.incomingCandidateEdgeIds.includes("college-to-professional")
  && byIdentity.professional.incomingCandidateEdgeIds.includes("amateur-to-professional")
  && byIdentity.professional.outgoingCandidateEdgeIds.includes("professional-to-amateur"));
verify("13. baseball-industry 只作為候選目標且沒有虛構細分類", byIdentity["baseball-industry"].candidateSource === false
  && byIdentity["baseball-industry"].candidateTarget === true
  && byIdentity["baseball-industry"].outgoingCandidateEdgeIds.length === 0);
verify("14. player-competition 保留為復健候選目標且沒有虛構後續", JSON.stringify(byIdentity["player-competition"].incomingCandidateEdgeIds) === JSON.stringify(["rehab-to-player-reentry"])
  && byIdentity["player-competition"].outgoingCandidateEdgeIds.length === 0);
verify("15. 所有候選邊維持 candidate-only、未實作且沒有事件", network.candidateEdges.every(edge => edge.contractStatus === "candidate-only"
  && edge.implemented === false && Array.isArray(edge.eventIds) && edge.eventIds.length === 0));
verify("16. 4.11 沒有建立 22 歲後 Runtime 可玩狀態", network.postAge22RuntimePlayable === false
  && network.identities.every(identity => identity.postAge22RuntimePlayable === false));
verify("17. current gate 精確沿用現行 age-22 result 與 terminal", JSON.stringify(network.currentGate) === JSON.stringify(sourceNetwork.currentEndpoint));
verify("18. current gate 與候選圖並列，沒有偽造 age-22 到 future identity 的 edge", !network.candidateEdges.some(edge => [network.currentGate.resultNodeId, network.currentGate.terminalNodeId].includes(edge.sourceRoute)));
verify("19. Audit 回報 valid、7 個身分與 8 條候選邊", audit.status === "valid" && audit.identityCount === 7
  && audit.candidateEdgeCount === 8 && audit.issues.length === 0);
verify("20. Network 與 Audit 全部 deep frozen", isDeepFrozen(network) && isDeepFrozen(audit));
verify("21. 相同 Contract 輸入得到 deterministic 結果", JSON.stringify(rejoin.getPostAge22Network()) === JSON.stringify(network)
  && JSON.stringify(rejoin.auditPostAge22Network()) === JSON.stringify(audit));
verify("22. 讀取 4.11 前後 CareerSpineContract 完全不變", JSON.stringify({
  network: contract.getCareerNetwork(), candidates: contract.getCandidateTransitions()
}) === sourceBefore);

global.player = { chapter: "不可修改", nested: { value: 1 } };
const playerBefore = JSON.stringify(global.player);
rejoin.getPostAge22Network();
rejoin.auditPostAge22Network();
verify("23. 4.11 查詢不讀寫或替換全域 Player", JSON.stringify(global.player) === playerBefore);
delete global.player;

const missingApiAudit = loadWithDependency({}).auditPostAge22Network();
verify("24. Contract API 缺失時不 throw 且 Audit 回報 error", missingApiAudit.status === "error"
  && missingApiAudit.issues.some(item => item.code === "career-spine-contract-unavailable"));
const throwingAudit = loadWithDependency({
  getCareerNetwork() { throw new Error("read failed"); },
  getCandidateTransitions() { return []; }
}).auditPostAge22Network();
verify("25. Contract 讀取失敗時不 throw 且 Audit 回報 error", throwingAudit.status === "error"
  && throwingAudit.issues.some(item => item.code === "career-spine-contract-read-failed"));

const duplicateEdgeAudit = loadWithDependency(dependencyFrom({
  candidates(items) { items.push(clone(items[0])); }
})).auditPostAge22Network();
verify("26. 重複 candidate edge ID 會使 Audit 失敗", duplicateEdgeAudit.status === "error"
  && duplicateEdgeAudit.issues.some(item => item.code === "duplicate-candidate-edge"));
const duplicateIdentityAudit = loadWithDependency(dependencyFrom({
  network(value) { value.initialRoutes.push(clone(value.initialRoutes[0])); }
})).auditPostAge22Network();
verify("27. 重複 initial route identity 會使 Audit 失敗", duplicateIdentityAudit.status === "error"
  && duplicateIdentityAudit.issues.some(item => item.code === "duplicate-initial-route-identity"));
const invalidCandidateAudit = loadWithDependency(dependencyFrom({
  candidates(items) {
    items[0].implemented = true;
    items[1].eventIds = ["future_event"];
    items[2].contractStatus = "implemented";
  }
})).auditPostAge22Network();
verify("28. implemented、eventIds 與非 candidate-only 均會使 Audit 失敗", invalidCandidateAudit.status === "error"
  && ["candidate-implemented", "candidate-event-ids-present", "candidate-status-invalid"]
    .every(code => invalidCandidateAudit.issues.some(item => item.code === code)));
const invalidEndpointAudit = loadWithDependency(dependencyFrom({
  network(value) { value.currentEndpoint.playableAfterTerminal = true; value.currentEndpoint.terminalNodeId = "missing-terminal"; }
})).auditPostAge22Network();
verify("29. 可玩 terminal 或未登錄 endpoint 會使 Audit 失敗", invalidEndpointAudit.status === "error"
  && invalidEndpointAudit.issues.some(item => item.code === "terminal-playability-invalid")
  && invalidEndpointAudit.issues.some(item => item.code === "terminal-node-not-declared"));
const collisionAudit = loadWithDependency(dependencyFrom({
  network(value) { value.actualEdges[0].id = sourceCandidates[0].id; }
})).auditPostAge22Network();
verify("30. Candidate ID 與 actual edge 碰撞會使 Audit 失敗", collisionAudit.status === "error"
  && collisionAudit.issues.some(item => item.code === "candidate-actual-edge-collision"));
const invalidEndpointsAudit = loadWithDependency(dependencyFrom({
  candidates(items) { items[0].sourceRoute = ""; items[1].targetRoute = ""; }
})).auditPostAge22Network();
verify("31. 無效 candidate source／target 會使 Audit 失敗", invalidEndpointsAudit.status === "error"
  && invalidEndpointsAudit.issues.some(item => item.code === "candidate-source-invalid")
  && invalidEndpointsAudit.issues.some(item => item.code === "candidate-target-invalid"));

const futureChapters = ["professional", "baseball-industry", "player-competition"];
verify("32. Future identity 作為 synthetic chapter 時仍由 4.10 Admission 全數拒絕", futureChapters.every(chapter => {
  const result = admission.evaluate({ chapter, age: 23, completed: false });
  return result.status === "rejected" && result.admitted === false;
}));

const productionSource = fs.readFileSync(path.join(root, "career-rejoin-contract.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const guardedRuntimeFiles = ["player.js", "save.js", "story.js", "script.js", "career-save-admission.js"];
verify("33. Production source 沒有硬編八條 candidate ID", expectedCandidateIds.every(id => !productionSource.includes(id)));
verify("34. Production source 沒有硬編七個 identity registry", !/\[\s*["']draft["'][\s\S]*["']player-competition["']\s*\]/.test(productionSource));
verify("35. 4.11 不載入 Browser Runtime，既有 Runtime 亦不依賴它", !indexSource.includes("career-rejoin-contract.js")
  && guardedRuntimeFiles.every(file => !fs.readFileSync(path.join(root, file), "utf8").includes("CareerRejoinContract")));
verify("36. 4.11 source 不接觸 DOM、Storage、Save、Player mutation、Resolver、時間或隨機", [
  "document.", "localStorage", "sessionStorage", "saveGame", "player.",
  "CareerTransitionRuntimeResolver", "CareerDevelopmentRuntimeResolver", "Math.random", "Date.now"
].every(token => !productionSource.includes(token)));
verify("37. 4.11 沒有 mutation、transition 或 progression API", !/(commit|apply|advance|transitionTo|progressTo|mutate)[A-Z]/.test(Object.keys(rejoin).join(" ")));

console.log(`\nArchitecture Sprint 4.11 Post-Age-22 Career Rejoin Readonly Contract：${passed}/${passed} 通過`);
