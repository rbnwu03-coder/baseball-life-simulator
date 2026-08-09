const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const contract = require(path.join(root, "career-spine-contract.js"));
const runtimeResolver = require(path.join(root, "career-transition-runtime-resolver.js"));

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function transitionState(careerExit, transitionStep, overrides = {}) {
  return Object.assign({
    chapter: "生涯轉換期",
    age: 18,
    careerExit,
    transitionStep,
    completed: false,
    forcedEventId: "",
    marker: { keep: true }
  }, overrides);
}

const network = contract.getCareerNetwork();
const transitionNode = network.adultNodes.find(node =>
  node.networkRole === "initial-route-and-shared-transition"
);
const legalMatrix = network.initialRoutes.flatMap(route => {
  const eventIds = route.exclusiveEventIds.concat(route.sharedEventIds);
  return route.careerExits.flatMap(careerExit =>
    eventIds.map((eventId, transitionStep) => ({
      careerExit,
      routeKey: route.routeKey,
      transitionStep,
      eventId
    }))
  );
});

verify("1. Runtime Resolver 只公開單一正式 API", Object.keys(runtimeResolver).length === 1
  && typeof runtimeResolver.resolveTransitionRuntime === "function");
verify("2. 生涯轉換節點與五幕事件全部來自 Career Network Contract", Boolean(transitionNode)
  && transitionNode.chapter === "生涯轉換期"
  && network.initialRoutes.length === 4
  && network.initialRoutes.every(route => route.exclusiveEventIds.concat(route.sharedEventIds).length === 5));
verify("3. 五個畢業出口乘所有合法 step 形成 25 個合法案例", legalMatrix.length === 25);

const legalResults = legalMatrix.map(testCase => ({
  testCase,
  result: runtimeResolver.resolveTransitionRuntime(
    transitionState(testCase.careerExit, testCase.transitionStep)
  )
}));
verify("4. Legal Matrix 全部 resolved", legalResults.every(({ result }) =>
  result.status === "resolved" && result.resolved === true));
verify("5. Legal Matrix 的 routeKey、step 與 eventId 完全符合 Contract", legalResults.every(({ testCase, result }) =>
  result.nodeId === transitionNode.nodeId
  && result.routeKey === testCase.routeKey
  && result.transitionStep === testCase.transitionStep
  && result.eventId === testCase.eventId));
verify("6. 兩種高卒出口都由 Contract 解析為 draft 且不改寫原 careerExit", [
  "高卒選秀・中後段指名候選",
  "高卒選秀・落選／培訓測試"
].every(careerExit => {
  const state = transitionState(careerExit, 0);
  const before = JSON.stringify(state);
  const result = runtimeResolver.resolveTransitionRuntime(state);
  return result.routeKey === "draft"
    && state.careerExit === careerExit
    && JSON.stringify(state) === before;
}));

const invalidExitCases = [
  { name: "missing", apply(state) { delete state.careerExit; } },
  { name: "undefined", value: undefined },
  { name: "null", value: null },
  { name: "empty", value: "" },
  { name: "blank", value: "   " },
  { name: "unknown", value: "__invalid__" },
  { name: "object", value: { route: "draft" } },
  { name: "array", value: ["大學棒球"] }
];
const invalidExitResults = invalidExitCases.map(testCase => {
  const state = transitionState("大學棒球", 0);
  if (testCase.apply) testCase.apply(state);
  else state.careerExit = testCase.value;
  return runtimeResolver.resolveTransitionRuntime(state);
});
verify("7. 缺失、空白、未知與非字串 careerExit 全部 unresolved", invalidExitResults.every(result =>
  result.status === "unresolved" && result.resolved === false
  && result.routeKey === null && result.eventId === null));
verify("8. Invalid careerExit 不會 fallback 到 draft 或 rehab", invalidExitResults.every(result =>
  result.eventId !== "transition_draft_day" && result.eventId !== "transition_rehab_plateau"));

const collegeRoute = network.initialRoutes.find(route => route.routeKey === "college");
const collegeLength = collegeRoute.exclusiveEventIds.concat(collegeRoute.sharedEventIds).length;
const invalidSteps = [-1, collegeLength, collegeLength + 1, 1.5, "1", null, undefined, NaN];
const invalidStepResults = invalidSteps.map(transitionStep =>
  runtimeResolver.resolveTransitionRuntime(transitionState("大學棒球", transitionStep))
);
verify("9. 負數、越界、非整數與非 number transitionStep 全部 unresolved", invalidStepResults.every(result =>
  result.status === "unresolved" && result.routeKey === null && result.eventId === null));

const wrongChapterResults = ["青棒生涯出口", "發展期", ""].map(chapter =>
  runtimeResolver.resolveTransitionRuntime(transitionState("大學棒球", 0, { chapter }))
);
verify("10. 生涯轉換期以外 chapter 全部不具 Runtime Resolver 資格", wrongChapterResults.every(result =>
  result.status === "unresolved" && result.eventId === null));

const deterministicState = transitionState("業餘／社會人棒球", 2);
const deterministicBefore = JSON.stringify(deterministicState);
const networkBefore = JSON.stringify(network);
const deterministicA = runtimeResolver.resolveTransitionRuntime(deterministicState);
const deterministicB = runtimeResolver.resolveTransitionRuntime(deterministicState);
verify("11. 相同 snapshot 重複解析產生相同結果", JSON.stringify(deterministicA) === JSON.stringify(deterministicB));
verify("12. Runtime Resolver 對 Player 為 zero mutation", JSON.stringify(deterministicState) === deterministicBefore);
verify("13. Runtime Resolver 不修改 Career Network Contract", JSON.stringify(contract.getCareerNetwork()) === networkBefore);
verify("14. resolved 與 unresolved 結果均為深層 readonly", Object.isFrozen(deterministicA)
  && Object.isFrozen(deterministicA.issues)
  && Object.isFrozen(invalidExitResults[0])
  && Object.isFrozen(invalidExitResults[0].issues)
  && Object.isFrozen(invalidExitResults[0].details));

const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "career-spine-contract.js", "career-transition-resolver.js",
  "career-transition-commit.js", "career-transition-runtime-resolver.js", "career-transition-progression.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    body: { classList: { toggle() {} } },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        innerHTML: "",
        value: id === "nameInput" ? "4.6 測試球員" : "",
        style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        focus() {}, setAttribute() {}, removeAttribute() {}
      });
      return nodes.get(id);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    console,
    document,
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: { setTimeout(callback) { callback(); } },
    module: { exports: {} }
  });
  runtimeFiles.forEach(file => vm.runInContext(
    fs.readFileSync(path.join(root, file), "utf8"),
    context,
    { filename: file }
  ));
  return context;
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function setRuntimeState(context, state) {
  evaluate(context, `player = createInitialPlayer("4.6 Runtime"); Object.assign(player, ${JSON.stringify(state)});`);
}

const runtimeContext = makeContext();
verify("15. Full Runtime Matrix 的 getCurrentEventId 與 Resolver、Contract 完全一致", legalMatrix.every(testCase => {
  setRuntimeState(runtimeContext, transitionState(testCase.careerExit, testCase.transitionStep));
  const actual = evaluate(runtimeContext, `({
    eventId: getCurrentEventId(),
    resolved: CareerTransitionRuntimeResolver.resolveTransitionRuntime(player)
  })`);
  return actual.eventId === testCase.eventId
    && actual.resolved.routeKey === testCase.routeKey
    && actual.resolved.eventId === testCase.eventId;
}));

const narrativeCases = network.initialRoutes.map(route => ({
  careerExit: route.careerExits[0],
  routeKey: route.routeKey
}));
verify("16. 生涯轉換期 Narrative route 與 Runtime Resolver route 一致", narrativeCases.every(testCase => {
  setRuntimeState(runtimeContext, transitionState(testCase.careerExit, 0));
  const actual = evaluate(runtimeContext, `(() => {
    const resolved = CareerTransitionRuntimeResolver.resolveTransitionRuntime(player);
    ensureNarrativeThreadForEvent(resolved.eventId);
    return { routeKey: getAdultRouteKey(), narrativeRoute: player.narrativeThread.route, eventId: getCurrentEventId() };
  })()`);
  return actual.routeKey === testCase.routeKey
    && actual.narrativeRoute === testCase.routeKey
    && actual.eventId === legalMatrix.find(item => item.careerExit === testCase.careerExit && item.transitionStep === 0).eventId;
}));

verify("17. enterCareerTransition 使用 Runtime Resolver route 初始化 Narrative", narrativeCases.every(testCase => {
  setRuntimeState(runtimeContext, {
    chapter: "青棒生涯出口",
    age: 18,
    criticalYearStep: 8,
    criticalYearResult: "高中三年評估完成",
    criticalYearDetail: "球員已完成高三出口判定。",
    careerExit: testCase.careerExit,
    transitionStep: 4,
    completed: false,
    forcedEventId: ""
  });
  const actual = evaluate(runtimeContext, `(() => {
    const commitResult = enterCareerTransition();
    const runtimeResult = CareerTransitionRuntimeResolver.resolveTransitionRuntime(player);
    return { committed: commitResult.committed, routeKey: runtimeResult.routeKey, narrativeRoute: player.narrativeThread.route, eventId: getCurrentEventId() };
  })()`);
  return actual.committed === true
    && actual.routeKey === testCase.routeKey
    && actual.narrativeRoute === testCase.routeKey
    && actual.eventId === legalMatrix.find(item => item.careerExit === testCase.careerExit && item.transitionStep === 0).eventId;
}));

setRuntimeState(runtimeContext, transitionState("大學棒球", 1, { forcedEventId: "takahashi_adult_restart_echo" }));
verify("18. forcedEventId 維持高於生涯轉換期 chapter route", evaluate(runtimeContext,
  "getCurrentEventId() === 'takahashi_adult_restart_echo' && CareerTransitionRuntimeResolver.resolveTransitionRuntime(player).eventId === 'transition_college_balance'"));

setRuntimeState(runtimeContext, transitionState("大學棒球", 1, {
  completed: true,
  forcedEventId: "takahashi_adult_restart_echo"
}));
verify("19. completed 維持最高優先並回傳 slice_complete", evaluate(runtimeContext,
  "getCurrentEventId() === 'slice_complete'"));

setRuntimeState(runtimeContext, transitionState("__invalid__", 0));
verify("20. Live Runtime invalid state explicit unresolved 且事件為 null", evaluate(runtimeContext,
  "CareerTransitionRuntimeResolver.resolveTransitionRuntime(player).resolved === false && getCurrentEventId() === null"));

const resolverSource = fs.readFileSync(path.join(root, "career-transition-runtime-resolver.js"), "utf8");
const storySource = fs.readFileSync(path.join(root, "story.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const transitionBranchStart = storySource.indexOf('if (player.chapter === "生涯轉換期")');
const transitionBranchEnd = storySource.indexOf('if (player.chapter === "青棒生涯出口")', transitionBranchStart);
const transitionBranch = storySource.slice(transitionBranchStart, transitionBranchEnd);
verify("21. story.js 已移除完整成年 transition topology 並改用 Runtime Resolver", transitionBranchStart >= 0
  && transitionBranch.includes("CareerTransitionRuntimeResolver.resolveTransitionRuntime(player)")
  && !transitionBranch.includes("const sequences")
  && !transitionBranch.includes("transition_draft_day")
  && !transitionBranch.includes("transition_rehab_plateau"));
verify("22. Runtime Resolver 沒有複製成年事件 ID 或 route registry", !/transition_(?:draft|rookie|pro|college|amateur|rehab|relationship|cost)/.test(resolverSource)
  && !/draft\s*:\s*\[|college\s*:\s*\[|amateur\s*:\s*\[|rehab\s*:\s*\[/.test(resolverSource));
verify("23. Runtime Resolver 為 pure readonly 且沒有 UI、Save、Storage、RNG 或時間依賴", !/Math\.random|Date\.|document\.|localStorage|sessionStorage|saveGame|loadGame|showStory|showCurrentEvent/.test(resolverSource)
  && !/playerState\s*\[[^\]]+\]\s*=|playerState\.[A-Za-z_$][\w$]*\s*=/.test(resolverSource));
verify("24. 生涯轉換期 getAdultRouteKey 與 enterCareerTransition 都使用 Runtime Resolver", scriptSource.includes('if (player.chapter === "生涯轉換期")')
  && scriptSource.includes("const runtimeResult = CareerTransitionRuntimeResolver.resolveTransitionRuntime(player)")
  && scriptSource.includes("const routeKey = runtimeResult.routeKey"));
verify("25. transitionStep mutation ownership 已交由 4.7 Boundary 且既有結算仍保留", !scriptSource.includes("player.transitionStep += 1")
  && scriptSource.includes("CareerTransitionProgression.advanceTransition")
  && scriptSource.includes("if (progressionResult.settlementRequired) evaluateCareerTransition()"));

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const contractIndex = html.indexOf('src="career-spine-contract.js"');
const graduationResolverIndex = html.indexOf('src="career-transition-resolver.js"');
const commitIndex = html.indexOf('src="career-transition-commit.js"');
const runtimeResolverIndex = html.indexOf('src="career-transition-runtime-resolver.js"');
const progressionIndex = html.indexOf('src="career-transition-progression.js"');
const storyIndex = html.indexOf('src="story.js"');
verify("26. Browser dependency 依 Contract → Graduation Resolver → Commit → Runtime Resolver → Progression → Story 載入", contractIndex >= 0
  && contractIndex < graduationResolverIndex
  && graduationResolverIndex < commitIndex
  && commitIndex < runtimeResolverIndex
  && runtimeResolverIndex < progressionIndex
  && progressionIndex < storyIndex);

const protectedDiff = execFileSync("git", [
  "diff", "--name-only", "HEAD", "--",
  "career-spine-contract.js", "career-transition-resolver.js", "career-transition-commit.js",
  "player.js", "style.css"
], { cwd: root, encoding: "utf8" }).trim();
verify("27. 4.3 Contract、4.4 Resolver、4.5 Commit、Player 與 CSS 均未修改（Save 僅允許 4.10 Admission integration）", protectedDiff === "");
verify("28. Player Schema、Save version 與 localStorage key 完全不變", !/adultRoute|careerRouteKey|currentCareerNode|transitionRoute|currentTransitionEventId/.test(fs.readFileSync(path.join(root, "player.js"), "utf8"))
  && evaluate(runtimeContext, "SAVE_VERSION") === 13
  && fs.readFileSync(path.join(root, "save.js"), "utf8").includes('"baseballLifeRpgSave"'));

console.log(`\nArchitecture Sprint 4.6 Adult Transition Runtime Routing Boundary：${passed}/${passed} 通過`);
