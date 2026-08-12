const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const contract = require(path.join(root, "career-spine-contract.js"));
const resolver = require(path.join(root, "career-transition-resolver.js"));

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function graduationState(careerExit, overrides) {
  return Object.assign({
    chapter: "青棒生涯出口",
    age: 18,
    criticalYearStep: 8,
    criticalYearResult: "高中三年評估完成",
    criticalYearDetail: "球員已完成高三出口判定。",
    careerExit,
    forcedEventId: "",
    completed: false
  }, overrides || {});
}

const legalCases = [
  ["高卒選秀・中後段指名候選", "draft", "transition_draft_day"],
  ["高卒選秀・落選／培訓測試", "draft", "transition_draft_day"],
  ["大學棒球", "college", "transition_college_arrival"],
  ["業餘／社會人棒球", "amateur", "transition_amateur_job"],
  ["復健與生涯暫停", "rehab", "transition_rehab_plateau"]
];

const network = contract.getCareerNetwork();
const resolvedCases = legalCases.map(([careerExit, routeKey, entryEventId]) => {
  const result = resolver.resolveGraduationTransition(graduationState(careerExit));
  return { careerExit, routeKey, entryEventId, result };
});

verify("1. 五種合法高中出口全部得到 resolved 結果", resolvedCases.every(item =>
  item.result.status === "resolved" && item.result.resolved === true
));
verify("2. 每個合法高中出口只對應一個 Contract route", legalCases.every(([careerExit]) =>
  network.initialRoutes.filter(route => route.careerExits.includes(careerExit)).length === 1
));
verify("3. 兩種高卒出口都解析到 draft 入口", resolvedCases.slice(0, 2).every(item =>
  item.result.target.routeKey === "draft" && item.result.target.entryEventId === "transition_draft_day"
));
verify("4. 大學、業餘與復健出口解析到各自正式入口", resolvedCases.slice(2).every(item =>
  item.result.target.routeKey === item.routeKey && item.result.target.entryEventId === item.entryEventId
));
verify("5. 所有 target node 都存在於 4.3 adult career network", resolvedCases.every(item =>
  network.adultNodes.some(node => node.nodeId === item.result.target.nodeId)
));
verify("6. 所有 target 都是 career-transition 合法入口節點", resolvedCases.every(item => {
  const target = network.adultNodes.find(node => node.nodeId === item.result.target.nodeId);
  return target.networkRole === "initial-route-and-shared-transition"
    && target.chapter === item.result.target.chapter;
}));
verify("7. 所有 entryEventId 都由對應 Contract route 宣告", resolvedCases.every(item => {
  const route = network.initialRoutes.find(candidate => candidate.routeKey === item.result.target.routeKey);
  return route.exclusiveEventIds[0] === item.result.target.entryEventId;
}));

const missing = resolver.resolveGraduationTransition(null);
const emptyExit = resolver.resolveGraduationTransition(graduationState(""));
const unknownExit = resolver.resolveGraduationTransition(graduationState("不存在的出口"));
const malformed = resolver.resolveGraduationTransition(graduationState("大學棒球", { criticalYearStep: 7 }));
const contradictory = resolver.resolveGraduationTransition(graduationState("大學棒球", { chapter: "青棒關鍵年" }));
const unstable = resolver.resolveGraduationTransition(graduationState("大學棒球", { forcedEventId: "azhe_adult_record_echo" }));

verify("8. 缺失 graduation state 明確 unresolved", missing.status === "unresolved"
  && missing.issues[0].code === "graduation-state-missing");
verify("9. 空白 careerExit 不會 silent fallback", emptyExit.status === "unresolved" && emptyExit.target === null);
verify("10. 未知 careerExit 不會 silent fallback", unknownExit.status === "unresolved" && unknownExit.target === null);
verify("11. step 不合法的畢業狀態明確 unresolved", malformed.status === "unresolved" && malformed.target === null);
verify("12. chapter 與結果互相矛盾時明確 unresolved", contradictory.status === "unresolved" && contradictory.target === null);
verify("13. 殘留 forcedEventId 的交接狀態不會被解析", unstable.status === "unresolved"
  && unstable.issues[0].code === "graduation-state-not-stable");

const deterministicInput = graduationState("大學棒球");
const deterministicA = resolver.resolveGraduationTransition(deterministicInput);
const deterministicB = resolver.resolveGraduationTransition(deterministicInput);
verify("14. 相同輸入重複解析得到完全相同輸出", JSON.stringify(deterministicA) === JSON.stringify(deterministicB));

const inputBefore = JSON.stringify(deterministicInput);
resolver.resolveGraduationTransition(deterministicInput);
verify("15. Resolver 不修改輸入 graduation state", JSON.stringify(deterministicInput) === inputBefore);

const networkBefore = JSON.stringify(contract.getCareerNetwork());
resolver.resolveGraduationTransition(deterministicInput);
verify("16. Resolver 不修改 adult career network contract", JSON.stringify(contract.getCareerNetwork()) === networkBefore);
verify("17. Resolver 輸出與 4.3 Network 均維持 readonly", Object.isFrozen(deterministicA)
  && Object.isFrozen(deterministicA.target)
  && Object.isFrozen(contract.getCareerNetwork()));

const context = vm.createContext({
  CareerSpineContract: contract,
  player: { marker: "不得變更", chapter: "青棒生涯出口" },
  window: {}
});
vm.runInContext(fs.readFileSync(path.join(root, "career-transition-resolver.js"), "utf8"), context, {
  filename: "career-transition-resolver.js"
});
const playerBefore = vm.runInContext("JSON.stringify(player)", context);
context.__state = graduationState("業餘／社會人棒球");
vm.runInContext("GraduationTransitionResolver.resolveGraduationTransition(__state)", context);
verify("18. Resolver 不讀寫全域 player", vm.runInContext("JSON.stringify(player)", context) === playerBefore);

const resolverSource = fs.readFileSync(path.join(root, "career-transition-resolver.js"), "utf8");
verify("19. Resolver 沒有 RNG、時間、UI、Storage 或 Save 依賴", !/Math\.random|Date\.|document\.|localStorage|sessionStorage|saveGame|showStory|showCurrentEvent/.test(resolverSource));
verify("20. Resolver 沒有複製四條 route key registry", !/\[\s*["']draft["']\s*,\s*["']college["']\s*,\s*["']amateur["']\s*,\s*["']rehab["']\s*\]/.test(resolverSource));
verify("21. Gameplay 與 Save 沒有接入 Resolver", ["player.js", "story.js", "script.js", "save.js"].every(file =>
  !fs.readFileSync(path.join(root, file), "utf8").includes("GraduationTransitionResolver")
));
verify("22. Resolver 不寫入 chapter、careerExit、route 或 Save", !/\b(?:player|graduationState)\s*\[[^\]]+\]\s*=|\b(?:player|graduationState)\.[A-Za-z_$][\w$]*\s*=/.test(resolverSource));

const forbiddenDiff = execFileSync("git", [
  "diff", "--name-only", "HEAD", "--",
  "competition-presentation.js", "current-state-boundary.js", "decision-flow.js",
], { cwd: root, encoding: "utf8" }).trim();
verify("23. Resolver 相鄰的 Competition 與既有 Boundary 均未修改", forbiddenDiff === "");

console.log(`\nArchitecture Sprint 4.4 Graduation Transition Resolver：${passed}/${passed} 通過`);
