const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const contract = require(path.join(root, "career-spine-contract.js"));
const runtimeResolver = require(path.join(root, "career-development-runtime-resolver.js"));

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function developmentState(careerExit, developmentStep, overrides = {}) {
  return Object.assign({
    chapter: "發展期",
    age: 20,
    careerExit,
    developmentStep,
    completed: false,
    forcedEventId: "",
    marker: { keep: true }
  }, overrides);
}

const network = contract.getCareerNetwork();
const developmentNodes = network.adultNodes.filter(node => node.networkRole === "shared-development");
const developmentNode = developmentNodes[0];
const developmentEvents = network.sharedDevelopment.eventIds;
const legalMatrix = network.initialRoutes.flatMap(route =>
  route.careerExits.flatMap(careerExit =>
    developmentEvents.map((eventId, developmentStep) => ({
      careerExit,
      routeKey: route.routeKey,
      developmentStep,
      eventId
    }))
  )
);

verify("1. Development Runtime Resolver 只公開單一正式 API", Object.keys(runtimeResolver).length === 1
  && typeof runtimeResolver.resolveDevelopmentRuntime === "function");
verify("2. 唯一 shared-development node 由 Career Network Contract 提供", developmentNodes.length === 1
  && developmentNode.nodeId === "development-years"
  && developmentNode.chapter === "發展期");
verify("3. 合法年齡與 developmentStep 範圍完全取自 Contract", JSON.stringify(developmentNode.age) === JSON.stringify([20, 21])
  && developmentNode.progress.field === "developmentStep"
  && developmentNode.progress.min === 0
  && developmentNode.progress.max === 6);
verify("4. 共用七幕事件拓樸由 sharedDevelopment 提供", network.sharedDevelopment.nodeId === developmentNode.nodeId
  && developmentEvents.length === 7);
verify("5. 五個 careerExit 乘七個合法 step 形成 35 個案例", legalMatrix.length === 35);

const legalResults = legalMatrix.map(testCase => ({
  testCase,
  result: runtimeResolver.resolveDevelopmentRuntime(
    developmentState(testCase.careerExit, testCase.developmentStep, {
      age: testCase.developmentStep < 4 ? 20 : 21
    })
  )
}));
verify("6. Legal Matrix 全部 resolved", legalResults.every(({ result }) =>
  result.status === "resolved" && result.resolved === true));
verify("7. Legal Matrix 的 node、route、step 與 event 完全符合 Contract", legalResults.every(({ testCase, result }) =>
  result.nodeId === developmentNode.nodeId
  && result.routeKey === testCase.routeKey
  && result.developmentStep === testCase.developmentStep
  && result.eventId === testCase.eventId));
verify("8. 兩種高卒出口七幕全部解析為 draft 且不改寫 careerExit", [
  "高卒選秀・中後段指名候選",
  "高卒選秀・落選／培訓測試"
].every(careerExit => developmentEvents.every((_eventId, developmentStep) => {
  const state = developmentState(careerExit, developmentStep);
  const before = JSON.stringify(state);
  const result = runtimeResolver.resolveDevelopmentRuntime(state);
  return result.routeKey === "draft"
    && state.careerExit === careerExit
    && JSON.stringify(state) === before;
})));
verify("9. 四條 route 在相同 developmentStep 共用相同事件", developmentEvents.every((eventId, developmentStep) =>
  network.initialRoutes.every(route => {
    const result = runtimeResolver.resolveDevelopmentRuntime(
      developmentState(route.careerExits[0], developmentStep)
    );
    return result.routeKey === route.routeKey && result.eventId === eventId;
  })));

const invalidExitCases = [
  { apply(state) { delete state.careerExit; } },
  { value: undefined },
  { value: null },
  { value: "" },
  { value: "   " },
  { value: "__invalid__" },
  { value: { route: "draft" } },
  { value: ["大學棒球"] }
];
const invalidExitResults = invalidExitCases.map(testCase => {
  const state = developmentState("大學棒球", 0);
  if (testCase.apply) testCase.apply(state);
  else state.careerExit = testCase.value;
  return runtimeResolver.resolveDevelopmentRuntime(state);
});
verify("10. 缺失、空白、未知與非字串 careerExit 全部 unresolved", invalidExitResults.every(result =>
  result.status === "unresolved" && result.resolved === false
  && result.routeKey === null && result.eventId === null));
verify("11. Invalid careerExit 不會 fallback 到 draft 或 rehab", invalidExitResults.every(result =>
  result.routeKey === null && result.eventId === null));

const invalidSteps = [-1, 7, 8, 1.5, "1", null, undefined, NaN];
const invalidStepResults = invalidSteps.map(developmentStep =>
  runtimeResolver.resolveDevelopmentRuntime(developmentState("大學棒球", developmentStep))
);
verify("12. 負數、越界、非整數與非 number developmentStep 全部 unresolved", invalidStepResults.every(result =>
  result.status === "unresolved" && result.developmentStep === null && result.eventId === null));

const invalidAges = [18, 19, 22, 23, 20.5, "20", null, undefined];
verify("13. Contract 範圍外與非 integer age 全部 unresolved", invalidAges.every(age => {
  const result = runtimeResolver.resolveDevelopmentRuntime(developmentState("大學棒球", 0, { age }));
  return result.status === "unresolved" && result.eventId === null;
}));

const wrongChapters = ["生涯轉換期", "生涯轉換期小結", "二十二歲職涯小結", "青棒生涯出口", "垂直切片完成", ""];
verify("14. 發展期以外 chapter 全部不具 Resolver 資格", wrongChapters.every(chapter => {
  const result = runtimeResolver.resolveDevelopmentRuntime(developmentState("大學棒球", 0, { chapter }));
  return result.status === "unresolved" && result.eventId === null;
}));

const deterministicState = developmentState("業餘／社會人棒球", 4, { age: 21 });
const deterministicBefore = JSON.stringify(deterministicState);
const networkBefore = JSON.stringify(network);
const deterministicA = runtimeResolver.resolveDevelopmentRuntime(deterministicState);
const deterministicB = runtimeResolver.resolveDevelopmentRuntime(deterministicState);
verify("15. 相同 snapshot 重複解析結果相同", JSON.stringify(deterministicA) === JSON.stringify(deterministicB));
verify("16. Resolver 對 Player 為 zero mutation", JSON.stringify(deterministicState) === deterministicBefore);
verify("17. Resolver 不修改 Career Network Contract", JSON.stringify(contract.getCareerNetwork()) === networkBefore);
verify("18. resolved 與 unresolved result 均為深層 readonly", Object.isFrozen(deterministicA)
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
  "career-transition-commit.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    body: { classList: { toggle() {} } },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        innerHTML: "",
        value: id === "nameInput" ? "4.8 測試球員" : "",
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
  evaluate(context, `player = createInitialPlayer("4.8 Runtime"); Object.assign(player, ${JSON.stringify(state)});`);
}

const runtimeContext = makeContext();
verify("19. Full Runtime Matrix 的 event 與 Contract／Resolver 完全一致", legalMatrix.every(testCase => {
  setRuntimeState(runtimeContext, developmentState(testCase.careerExit, testCase.developmentStep, {
    age: testCase.developmentStep < 4 ? 20 : 21
  }));
  const actual = evaluate(runtimeContext, `({
    eventId: getCurrentEventId(),
    routeKey: getAdultRouteKey(),
    resolved: CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player)
  })`);
  return actual.eventId === testCase.eventId
    && actual.routeKey === testCase.routeKey
    && actual.resolved.eventId === testCase.eventId
    && actual.resolved.routeKey === testCase.routeKey;
}));

const narrativeCases = network.initialRoutes.map(route => ({
  careerExit: route.careerExits[0],
  routeKey: route.routeKey
}));
verify("20. 四條發展期 Narrative route 與 Contract／Resolver 一致", narrativeCases.every(testCase => {
  setRuntimeState(runtimeContext, developmentState(testCase.careerExit, 2));
  const actual = evaluate(runtimeContext, `(() => {
    const resolved = CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player);
    ensureNarrativeThreadForEvent(resolved.eventId);
    return {
      resolverRoute: resolved.routeKey,
      routeKey: getAdultRouteKey(),
      narrativeRoute: player.narrativeThread.route,
      eventId: getCurrentEventId()
    };
  })()`);
  return actual.resolverRoute === testCase.routeKey
    && actual.routeKey === testCase.routeKey
    && actual.narrativeRoute === testCase.routeKey
    && actual.eventId === developmentEvents[2];
}));

verify("21. enterDevelopmentYears 四條 route 均建立合法 step 0 與 Narrative", narrativeCases.every(testCase => {
  setRuntimeState(runtimeContext, {
    chapter: "生涯轉換期小結",
    age: 18,
    transitionStep: 5,
    careerExit: testCase.careerExit,
    completed: false,
    forcedEventId: ""
  });
  const actual = evaluate(runtimeContext, `(() => {
    enterDevelopmentYears();
    const resolved = CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player);
    return {
      chapter: player.chapter,
      age: player.age,
      developmentStep: player.developmentStep,
      routeKey: resolved.routeKey,
      narrativeRoute: player.narrativeThread.route,
      eventId: getCurrentEventId()
    };
  })()`);
  return actual.chapter === "發展期"
    && actual.age === 20
    && actual.developmentStep === 0
    && actual.routeKey === testCase.routeKey
    && actual.narrativeRoute === testCase.routeKey
    && actual.eventId === developmentEvents[0];
}));

setRuntimeState(runtimeContext, developmentState("__invalid__", 0));
verify("22. Live Runtime invalid careerExit 明確 unresolved 且無 fallback", evaluate(runtimeContext,
  "CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player).resolved === false && getCurrentEventId() === null && getAdultRouteKey() === null"));

setRuntimeState(runtimeContext, developmentState("大學棒球", 7));
verify("23. 發展期 invalid step 不會旁路到 development_result", evaluate(runtimeContext,
  "CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player).resolved === false && getCurrentEventId() === null"));

setRuntimeState(runtimeContext, developmentState("大學棒球", 2, { forcedEventId: "takahashi_adult_restart_echo" }));
verify("24. forcedEventId 維持高於發展期 chapter route", evaluate(runtimeContext,
  "getCurrentEventId() === 'takahashi_adult_restart_echo' && CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player).eventId === 'development_mentor'"));

setRuntimeState(runtimeContext, developmentState("大學棒球", 2, {
  completed: true,
  forcedEventId: "takahashi_adult_restart_echo"
}));
verify("25. completed 維持最高優先並回傳 slice_complete", evaluate(runtimeContext,
  "getCurrentEventId() === 'slice_complete'"));

setRuntimeState(runtimeContext, {
  chapter: "二十二歲職涯小結",
  age: 22,
  careerExit: "大學棒球",
  developmentStep: 7,
  completed: false,
  forcedEventId: ""
});
verify("26. 正式二十二歲職涯小結仍回 development_result", evaluate(runtimeContext,
  "getCurrentEventId() === 'development_result' && CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player).resolved === false"));

setRuntimeState(runtimeContext, developmentState("大學棒球", 2));
verify("27. 合法既有發展期存檔仍路由至 development_mentor", evaluate(runtimeContext,
  "getCurrentEventId() === 'development_mentor'"));

const helperIsolation = evaluate(runtimeContext, `(() => {
  const first = getDevelopmentNarrativeEventIds();
  const second = getDevelopmentNarrativeEventIds();
  first.push("mutated_test_event");
  return {
    separate: first !== second,
    secondLength: second.length,
    contractLength: CareerSpineContract.getCareerNetwork().sharedDevelopment.eventIds.length,
    contractUntouched: !CareerSpineContract.getCareerNetwork().sharedDevelopment.eventIds.includes("mutated_test_event")
  };
})()`);
verify("28. Narrative helper 回傳 defensive copy 且不修改 Contract", helperIsolation.separate
  && helperIsolation.secondLength === developmentEvents.length
  && helperIsolation.contractLength === developmentEvents.length
  && helperIsolation.contractUntouched);

const resolverSource = fs.readFileSync(path.join(root, "career-development-runtime-resolver.js"), "utf8");
const storySource = fs.readFileSync(path.join(root, "story.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const developmentBranchStart = storySource.indexOf('if (player.chapter === "發展期")');
const developmentBranchEnd = storySource.indexOf('if (player.chapter === "生涯轉換期小結")', developmentBranchStart);
const developmentBranch = storySource.slice(developmentBranchStart, developmentBranchEnd);
verify("29. story.js 發展期 branch 改由 Development Resolver 路由", developmentBranchStart >= 0
  && developmentBranch.includes("CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player)")
  && !developmentBranch.includes("const sequence")
  && !developmentBranch.includes('|| "development_result"'));
verify("30. Resolver 沒有複製七幕事件 ID 或成年 route registry", !/development_(?:daily_life|competition|mentor|body_choice|opportunity|market|decision)/.test(resolverSource)
  && !/draft\s*:\s*\[|college\s*:\s*\[|amateur\s*:\s*\[|rehab\s*:\s*\[/.test(resolverSource));
verify("31. Resolver 為 pure readonly 且無 UI、Save、Storage、RNG 或時間依賴", !/Math\.random|Date\.|document\.|localStorage|sessionStorage|saveGame|loadGame|showStory|showCurrentEvent|choose|advanceAfterAction|evaluateDevelopmentYears/.test(resolverSource)
  && !/playerState\s*\[[^\]]+\]\s*=|playerState\.[A-Za-z_$][\w$]*\s*=/.test(resolverSource));
verify("32. script.js 不再保存 hard-coded Development Narrative topology", !scriptSource.includes("const developmentNarrativeEvents")
  && scriptSource.includes("function getDevelopmentNarrativeEventIds()")
  && scriptSource.includes("CareerSpineContract.getCareerNetwork()?.sharedDevelopment?.eventIds"));
verify("33. 發展期 getAdultRouteKey 使用 Development Resolver", scriptSource.includes('if (player.chapter === "發展期")')
  && scriptSource.includes("CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player)"));
verify("34. developmentStep mutation ownership交由 4.9 Boundary 且既有結算保持不變", !scriptSource.includes("player.developmentStep += 1")
  && scriptSource.includes("CareerDevelopmentProgression.advanceDevelopment")
  && scriptSource.includes("if (progressionResult.settlementRequired) evaluateDevelopmentYears()")
  && scriptSource.includes('player.chapter = "二十二歲職涯小結"'));

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const contractIndex = html.indexOf('src="career-spine-contract.js"');
const transitionProgressionIndex = html.indexOf('src="career-transition-progression.js"');
const developmentResolverIndex = html.indexOf('src="career-development-runtime-resolver.js"');
const developmentProgressionIndex = html.indexOf('src="career-development-progression.js"');
const storyIndex = html.indexOf('src="story.js"');
const scriptIndex = html.indexOf('src="script.js"');
verify("35. Browser dependency 依 Contract／Transition modules → Development Resolver → Progression → Story／Script 載入", contractIndex >= 0
  && contractIndex < transitionProgressionIndex
  && transitionProgressionIndex < developmentResolverIndex
  && developmentResolverIndex < developmentProgressionIndex
  && developmentProgressionIndex < storyIndex
  && developmentProgressionIndex < scriptIndex);

const protectedDiff = execFileSync("git", [
  "diff", "--name-only", "HEAD", "--",
  "career-spine-contract.js", "career-transition-resolver.js", "career-transition-commit.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "player.js", "style.css"
], { cwd: root, encoding: "utf8" }).trim();
verify("36. Contract、Transition 4.4–4.7、Player 與 CSS 均未修改（Save 僅允許 4.10 Admission integration）", protectedDiff === "");
verify("37. Player Schema、Save version 與 localStorage key 完全不變", !/developmentRoute|currentDevelopmentNode|developmentEventId|adultRoute|routeKey/.test(fs.readFileSync(path.join(root, "player.js"), "utf8"))
  && evaluate(runtimeContext, "SAVE_VERSION") === 13
  && fs.readFileSync(path.join(root, "save.js"), "utf8").includes('"baseballLifeRpgSave"'));

console.log(`\nArchitecture Sprint 4.8 Development Years Runtime Routing Boundary：${passed}/${passed} 通過`);
