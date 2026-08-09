const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const contract = require(path.join(root, "career-spine-contract.js"));
const runtimeResolver = require(path.join(root, "career-transition-runtime-resolver.js"));
const progression = require(path.join(root, "career-transition-progression.js"));
const network = contract.getCareerNetwork();

let validations = 0;
function verify(label, condition) {
  validations += 1;
  if (!condition) throw new Error(`FAIL ${label}`);
  console.log(`✓ ${label}`);
}

function routeEventIds(route) {
  return []
    .concat(route.exclusiveEventIds || [])
    .concat(route.sharedEventIds || []);
}

function transitionState(careerExit, transitionStep, overrides = {}) {
  return Object.assign({
    chapter: "生涯轉換期",
    age: 18,
    careerExit,
    transitionStep,
    forcedEventId: "",
    completed: false,
    flags: [],
    memories: []
  }, overrides);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function onlyStepChanged(before, after, nextStep) {
  const expected = clone(before);
  expected.transitionStep = nextStep;
  return JSON.stringify(expected) === JSON.stringify(after);
}

verify("1. Progression Boundary 只公開單一正式 API", JSON.stringify(Object.keys(progression)) === JSON.stringify(["advanceTransition"]));

const legalMatrix = network.initialRoutes.flatMap(route => {
  const eventIds = routeEventIds(route);
  return route.careerExits.flatMap(careerExit => eventIds.map((eventId, transitionStep) => ({
    routeKey: route.routeKey,
    careerExit,
    transitionStep,
    eventId,
    routeLength: eventIds.length
  })));
});

const legalResults = legalMatrix.map(testCase => {
  const state = transitionState(testCase.careerExit, testCase.transitionStep);
  const before = clone(state);
  const runtimeResult = runtimeResolver.resolveTransitionRuntime(state);
  const result = progression.advanceTransition(state, runtimeResult.eventId);
  return { testCase, state, before, runtimeResult, result };
});

verify("2. 5 個 careerExit × 5 steps 形成 25 個合法案例", legalMatrix.length === 25);
verify("3. Legal Matrix 全部由 4.6 Runtime Resolver 解析", legalResults.every(item => item.runtimeResult.resolved));
verify("4. Legal Matrix 全部 advanced 且 routeKey 正確", legalResults.every(item => item.result.advanced && item.result.routeKey === item.testCase.routeKey));
verify("5. 每個合法事件只讓 transitionStep 增加一格", legalResults.every(item => item.state.transitionStep === item.testCase.transitionStep + 1));
verify("6. Boundary 唯一修改 transitionStep", legalResults.every(item => onlyStepChanged(item.before, item.state, item.testCase.transitionStep + 1)));
verify("7. Step 0–3 不要求 settlement", legalResults.filter(item => item.testCase.transitionStep < item.testCase.routeLength - 1).every(item => !item.result.settlementRequired));
verify("8. Step 4 → 5 並要求 settlement", legalResults.filter(item => item.testCase.transitionStep === item.testCase.routeLength - 1).every(item => item.result.nextStep === item.testCase.routeLength && item.result.settlementRequired));
verify("9. Boundary terminal completion 不修改 chapter", legalResults.filter(item => item.result.settlementRequired).every(item => item.state.chapter === "生涯轉換期"));
verify("10. 兩種高卒出口完整保留原始 careerExit", legalResults.filter(item => item.testCase.routeKey === "draft").every(item => item.state.careerExit === item.testCase.careerExit));

const wrongCases = network.initialRoutes.flatMap((route, routeIndex) => {
  const events = routeEventIds(route);
  const otherRouteEvents = routeEventIds(network.initialRoutes[(routeIndex + 1) % network.initialRoutes.length]);
  return [
    { label: "previous", eventId: events[0] },
    { label: "next", eventId: events[2] },
    { label: "other-route", eventId: otherRouteEvents[0] },
    { label: "unknown", eventId: "transition_unknown_event" }
  ].map(item => ({ route, careerExit: route.careerExits[0], expected: events[1], ...item }));
});

const wrongResults = wrongCases.map(testCase => {
  const state = transitionState(testCase.careerExit, 1);
  const before = clone(state);
  const result = progression.advanceTransition(state, testCase.eventId);
  return { testCase, result, unchanged: JSON.stringify(state) === JSON.stringify(before) };
});
verify("11. 四條 route 的 previous／next／other-route／unknown 全部拒絕", wrongResults.every(item => !item.result.advanced));
verify("12. Wrong Event Matrix 全部 zero mutation", wrongResults.every(item => item.unchanged));

const repeatResults = network.initialRoutes.map(route => {
  const state = transitionState(route.careerExits[0], 0);
  const completedEventId = runtimeResolver.resolveTransitionRuntime(state).eventId;
  const first = progression.advanceTransition(state, completedEventId);
  const beforeRepeat = clone(state);
  const second = progression.advanceTransition(state, completedEventId);
  return { first, second, unchanged: JSON.stringify(state) === JSON.stringify(beforeRepeat) };
});
verify("13. 四條 route 第一次合法事件均成功", repeatResults.every(item => item.first.advanced));
verify("14. 四條 route 重送舊事件均自然失效", repeatResults.every(item => !item.second.advanced));
verify("15. Repeat Event Matrix 全部 zero mutation", repeatResults.every(item => item.unchanged));

const invalidStates = [
  transitionState(undefined, 0),
  transitionState("__unknown__", 0),
  transitionState(network.initialRoutes[0].careerExits[0], 0, { chapter: "發展期" }),
  transitionState(network.initialRoutes[0].careerExits[0], -1),
  transitionState(network.initialRoutes[0].careerExits[0], routeEventIds(network.initialRoutes[0]).length),
  transitionState(network.initialRoutes[0].careerExits[0], "1")
];
const invalidResults = invalidStates.map(state => {
  const before = clone(state);
  let result;
  let threw = false;
  try {
    result = progression.advanceTransition(state, "transition_unknown_event");
  } catch (_error) {
    threw = true;
  }
  return { result, threw, unchanged: JSON.stringify(state) === JSON.stringify(before) };
});
verify("16. 代表性 invalid Runtime state 全部 rejected", invalidResults.every(item => item.result && !item.result.advanced));
verify("17. Invalid Runtime state 不 throw 且 zero mutation", invalidResults.every(item => !item.threw && item.unchanged));

const missingState = transitionState(network.initialRoutes[0].careerExits[0], 0);
const missingBefore = clone(missingState);
const missingResult = progression.advanceTransition(missingState, null);
verify("18. 缺少 completedEventId 會 rejected", !missingResult.advanced && JSON.stringify(missingState) === JSON.stringify(missingBefore));

const forcedState = transitionState(network.initialRoutes[1].careerExits[0], 1, { forcedEventId: "azhe_adult_record_echo" });
const forcedBefore = clone(forcedState);
const forcedUnderlying = runtimeResolver.resolveTransitionRuntime(forcedState).eventId;
const forcedResult = progression.advanceTransition(forcedState, forcedUnderlying);
verify("19. forcedEventId active 時底層 progression 被拒絕", !forcedResult.advanced);
verify("20. forcedEventId rejection 不清除 forced event 且 zero mutation", JSON.stringify(forcedState) === JSON.stringify(forcedBefore));

const writableRoute = network.initialRoutes[1];
const writableEvent = routeEventIds(writableRoute)[1];
const nonWritableState = transitionState(writableRoute.careerExits[0], 1);
Object.defineProperty(nonWritableState, "transitionStep", { value: 1, writable: false, enumerable: true, configurable: true });
const nonWritableBefore = clone(nonWritableState);
let nonWritableResult;
let nonWritableThrew = false;
try {
  nonWritableResult = progression.advanceTransition(nonWritableState, writableEvent);
} catch (_error) {
  nonWritableThrew = true;
}
verify("21. non-writable transitionStep rejected 且不 throw", !nonWritableThrew && !nonWritableResult.advanced);
verify("22. non-writable transitionStep zero mutation", JSON.stringify(nonWritableState) === JSON.stringify(nonWritableBefore));

let setterCalls = 0;
const accessorState = transitionState(writableRoute.careerExits[0], 1);
Object.defineProperty(accessorState, "transitionStep", {
  get() { return 1; },
  set() { setterCalls += 1; },
  enumerable: true,
  configurable: true
});
const accessorBefore = clone(accessorState);
let accessorResult;
let accessorThrew = false;
try {
  accessorResult = progression.advanceTransition(accessorState, writableEvent);
} catch (_error) {
  accessorThrew = true;
}
verify("23. accessor transitionStep rejected 且不 throw", !accessorThrew && !accessorResult.advanced);
verify("24. accessor setter 未觸發且 Player zero mutation", setterCalls === 0 && JSON.stringify(accessorState) === JSON.stringify(accessorBefore));

const deterministicA = transitionState(writableRoute.careerExits[0], 2);
const deterministicB = clone(deterministicA);
const deterministicEvent = runtimeResolver.resolveTransitionRuntime(deterministicA).eventId;
const deterministicResultA = progression.advanceTransition(deterministicA, deterministicEvent);
const deterministicResultB = progression.advanceTransition(deterministicB, deterministicEvent);
verify("25. 相同 snapshot 與 completedEventId 產生相同結果", JSON.stringify(deterministicResultA) === JSON.stringify(deterministicResultB));
verify("26. advanced 與 rejected result 均為 deep frozen", Object.isFrozen(deterministicResultA)
  && Object.isFrozen(deterministicResultA.issues)
  && Object.isFrozen(missingResult)
  && Object.isFrozen(missingResult.issues));

const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "career-spine-contract.js", "career-transition-resolver.js",
  "career-transition-commit.js", "career-transition-runtime-resolver.js",
  "career-transition-progression.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    body: { classList: { toggle() {} } },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        innerHTML: "",
        textContent: "",
        value: id === "nameInput" ? "4.7 測試球員" : "",
        style: {},
        dataset: {},
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
  vm.runInContext(`
    var __settlementCalls = 0;
    var __originalEvaluateCareerTransition = evaluateCareerTransition;
    evaluateCareerTransition = function() {
      __settlementCalls += 1;
      return __originalEvaluateCareerTransition();
    };
  `, context);
  return context;
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function setRuntimeState(context, state) {
  evaluate(context, `player = createInitialPlayer("4.7 Runtime"); Object.assign(player, ${JSON.stringify(state)}); isTransitioning = false;`);
}

const integrationContext = makeContext();
const collegeRoute = network.initialRoutes.find(route => route.routeKey === "college");
const collegeEvents = routeEventIds(collegeRoute);
setRuntimeState(integrationContext, transitionState(collegeRoute.careerExits[0], 1));
const staleBefore = evaluate(integrationContext, "JSON.stringify(player)");
evaluate(integrationContext, `choose(${JSON.stringify(collegeEvents[0])}, 0)`);
verify("27. Runtime wrong event 在 effects 前被拒絕", evaluate(integrationContext, "JSON.stringify(player)") === staleBefore);

setRuntimeState(integrationContext, transitionState(collegeRoute.careerExits[0], 0));
const firstEvent = evaluate(integrationContext, "getCurrentEventId()");
evaluate(integrationContext, `choose(${JSON.stringify(firstEvent)}, 0)`);
const afterFirst = evaluate(integrationContext, "JSON.stringify(player)");
evaluate(integrationContext, `choose(${JSON.stringify(firstEvent)}, 0)`);
verify("28. Runtime repeat event 不重複 effects、flags、memory、narrative 或 progression", evaluate(integrationContext, "JSON.stringify(player)") === afterFirst);

setRuntimeState(integrationContext, transitionState(collegeRoute.careerExits[0], 3, { forcedEventId: "azhe_adult_record_echo" }));
const forcedRuntimeBefore = evaluate(integrationContext, "JSON.stringify(player)");
const underlyingEvent = evaluate(integrationContext, "CareerTransitionRuntimeResolver.resolveTransitionRuntime(player).eventId");
evaluate(integrationContext, `choose(${JSON.stringify(underlyingEvent)}, 0)`);
verify("29. Runtime forced event active 時 underlying choice 在 effects 前被拒絕", evaluate(integrationContext, "JSON.stringify(player)") === forcedRuntimeBefore);
evaluate(integrationContext, "choose('azhe_adult_record_echo', 0)");
verify("30. 合法 forced event 維持既有 resumeAfterPending 且不推進 transitionStep", evaluate(integrationContext,
  "player.transitionStep === 3 && player.forcedEventId === '' && player.flags.includes('azhe_adult_record_echo_done')"));

const settlementResults = network.initialRoutes.map(route => {
  const context = makeContext();
  const events = routeEventIds(route);
  setRuntimeState(context, transitionState(route.careerExits[0], events.length - 1));
  const finalEventId = evaluate(context, "getCurrentEventId()");
  evaluate(context, `choose(${JSON.stringify(finalEventId)}, 0)`);
  const first = evaluate(context, `({
    calls: __settlementCalls,
    chapter: player.chapter,
    transitionStep: player.transitionStep
  })`);
  evaluate(context, `advanceAfterAction(null, ${JSON.stringify(finalEventId)})`);
  const callsAfterRepeat = evaluate(context, "__settlementCalls");
  return { first, callsAfterRepeat };
});
verify("31. 四條 route 最後一幕都進入生涯轉換期小結", settlementResults.every(item => item.first.chapter === "生涯轉換期小結" && item.first.transitionStep === 5));
verify("32. 四條 route evaluateCareerTransition 各只呼叫一次", settlementResults.every(item => item.first.calls === 1 && item.callsAfterRepeat === 1));

const source = fs.readFileSync(path.join(root, "career-transition-progression.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
verify("33. Progression 不使用 careerExit 判 route 或保存成年 Event Registry", !source.includes("careerExit")
  && !/transition_(?:draft|rookie|pro|college|amateur|rehab|relationship|cost)/.test(source));
verify("34. Progression 不依賴 UI、Save、Storage、RNG、時間或 Settlement", !/document\.|localStorage|sessionStorage|saveGame|loadGame|showStory|showCurrentEvent|evaluateCareerTransition|applyEffects|Math\.random|Date\./.test(source));
verify("35. script.js 已移除直接 transitionStep progression increment", !/player\.transitionStep\s*(?:\+=\s*1|\+\+|=\s*player\.transitionStep\s*\+\s*1)/.test(scriptSource));
verify("36. advanceAfterAction 只在 Boundary terminal 成功後呼叫既有 settlement", scriptSource.includes("CareerTransitionProgression.advanceTransition")
  && scriptSource.includes("if (!progressionResult.advanced) return progressionResult;")
  && scriptSource.includes("if (progressionResult.settlementRequired) evaluateCareerTransition();"));
verify("37. 生涯轉換期 choose preflight 位於 event lookup 與 isTransitioning=true 之前", (() => {
  const chooseStart = scriptSource.indexOf("function choose(eventId, index)");
  const preflight = scriptSource.indexOf('player.chapter === "生涯轉換期" && getCurrentEventId() !== eventId', chooseStart);
  const eventLookup = scriptSource.indexOf("const event = getEvent(eventId)", chooseStart);
  const transitionStart = scriptSource.indexOf("isTransitioning = true", chooseStart);
  return chooseStart >= 0 && preflight > chooseStart && preflight < eventLookup && preflight < transitionStart;
})());

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const contractIndex = html.indexOf('src="career-spine-contract.js"');
const runtimeResolverIndex = html.indexOf('src="career-transition-runtime-resolver.js"');
const progressionIndex = html.indexOf('src="career-transition-progression.js"');
const storyIndex = html.indexOf('src="story.js"');
const scriptIndex = html.indexOf('src="script.js"');
verify("38. Browser 依 Contract → Runtime Resolver → Progression → Story／Script 載入", contractIndex >= 0
  && contractIndex < runtimeResolverIndex
  && runtimeResolverIndex < progressionIndex
  && progressionIndex < storyIndex
  && progressionIndex < scriptIndex);

const protectedFiles = [
  "career-spine-contract.js", "career-transition-resolver.js", "career-transition-commit.js",
  "career-transition-runtime-resolver.js", "player.js", "save.js", "style.css"
];
const { execFileSync } = require("child_process");
const protectedDiff = execFileSync("git", ["diff", "--name-only", "HEAD", "--", ...protectedFiles], {
  cwd: root,
  encoding: "utf8"
}).trim();
verify("39. Contract、Resolver、Commit、Runtime Resolver、Player、Save 與 CSS 均未修改（不含 4.8 授權的 Story routing）", protectedDiff === "");
verify("40. Player Schema、Save version 與 localStorage key 完全不變", !/adultRoute|careerRouteKey|currentCareerNode|lastCompletedTransitionEvent|transitionNonce|progressToken/.test(fs.readFileSync(path.join(root, "player.js"), "utf8"))
  && evaluate(integrationContext, "SAVE_VERSION") === 13
  && fs.readFileSync(path.join(root, "save.js"), "utf8").includes('"baseballLifeRpgSave"'));

console.log(`\nArchitecture Sprint 4.7 Adult Transition Progression Boundary：${validations}/${validations} 通過`);
