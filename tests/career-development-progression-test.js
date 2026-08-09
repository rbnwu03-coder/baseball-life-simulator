const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const contract = require(path.join(root, "career-spine-contract.js"));
const runtimeResolver = require(path.join(root, "career-development-runtime-resolver.js"));
const progression = require(path.join(root, "career-development-progression.js"));
const network = contract.getCareerNetwork();
const developmentEvents = network.sharedDevelopment.eventIds;

let validations = 0;
function verify(label, condition) {
  validations += 1;
  if (!condition) throw new Error(`FAIL ${label}`);
  console.log(`✓ ${label}`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function developmentState(careerExit, developmentStep, overrides = {}) {
  return Object.assign({
    chapter: "發展期",
    age: developmentStep < 4 ? 20 : 21,
    careerExit,
    developmentStep,
    forcedEventId: "",
    completed: false,
    flags: [],
    memories: [],
    marker: { keep: true }
  }, overrides);
}

function onlyStepChanged(before, after, nextStep) {
  const expected = clone(before);
  expected.developmentStep = nextStep;
  return JSON.stringify(expected) === JSON.stringify(after);
}

verify("1. Progression Boundary 只公開單一正式 API", JSON.stringify(Object.keys(progression)) === JSON.stringify(["advanceDevelopment"]));

const legalMatrix = network.initialRoutes.flatMap(route =>
  route.careerExits.flatMap(careerExit =>
    developmentEvents.map((eventId, developmentStep) => ({
      routeKey: route.routeKey,
      careerExit,
      developmentStep,
      eventId
    }))
  )
);

const legalResults = legalMatrix.map(testCase => {
  const state = developmentState(testCase.careerExit, testCase.developmentStep);
  const before = clone(state);
  const runtimeResult = runtimeResolver.resolveDevelopmentRuntime(state);
  const result = progression.advanceDevelopment(state, runtimeResult.eventId);
  return { testCase, state, before, runtimeResult, result };
});

verify("2. 5 個 careerExit × 7 steps 形成 35 個合法案例", legalMatrix.length === 35);
verify("3. Legal Matrix 全部由 4.8 Runtime Resolver 解析", legalResults.every(item => item.runtimeResult.resolved));
verify("4. Legal Matrix 全部 advanced 且 routeKey 正確", legalResults.every(item => item.result.advanced && item.result.routeKey === item.testCase.routeKey));
verify("5. 每個合法事件只讓 developmentStep 增加一格", legalResults.every(item => item.state.developmentStep === item.testCase.developmentStep + 1));
verify("6. Boundary 唯一修改 developmentStep", legalResults.every(item => onlyStepChanged(item.before, item.state, item.testCase.developmentStep + 1)));
verify("7. Step 0–5 不要求 settlement", legalResults.filter(item => item.testCase.developmentStep < developmentEvents.length - 1).every(item => !item.result.settlementRequired));
verify("8. 最後一幕由 Contract 長度導出 settlement", legalResults.filter(item => item.testCase.developmentStep === developmentEvents.length - 1).every(item =>
  item.result.nextStep === developmentEvents.length && item.result.settlementRequired));
verify("9. Boundary terminal completion 不修改 chapter 或 age", legalResults.filter(item => item.result.settlementRequired).every(item =>
  item.state.chapter === "發展期" && item.state.age === 21));
verify("10. 兩種高卒出口完整保留原始 careerExit", legalResults.filter(item => item.testCase.routeKey === "draft").every(item =>
  item.state.careerExit === item.testCase.careerExit));

const routeRepresentatives = network.initialRoutes.map(route => ({
  routeKey: route.routeKey,
  careerExit: route.careerExits[0]
}));
const wrongCases = routeRepresentatives.flatMap(route => [
  { label: "previous", eventId: developmentEvents[1] },
  { label: "next", eventId: developmentEvents[3] },
  { label: "transition", eventId: "transition_relationship" },
  { label: "unknown", eventId: "development_unknown_event" },
  { label: "missing", eventId: null }
].map(item => ({ ...route, ...item })));
const wrongResults = wrongCases.map(testCase => {
  const state = developmentState(testCase.careerExit, 2);
  const before = clone(state);
  const result = progression.advanceDevelopment(state, testCase.eventId);
  return { testCase, result, unchanged: JSON.stringify(state) === JSON.stringify(before) };
});
verify("11. 四條 route 的 previous／next／transition／unknown／missing 全部拒絕", wrongResults.every(item => !item.result.advanced));
verify("12. Wrong Event Matrix 全部 zero mutation", wrongResults.every(item => item.unchanged));

const repeatResults = routeRepresentatives.map(route => {
  const state = developmentState(route.careerExit, 2);
  const completedEventId = runtimeResolver.resolveDevelopmentRuntime(state).eventId;
  const first = progression.advanceDevelopment(state, completedEventId);
  const beforeRepeat = clone(state);
  const second = progression.advanceDevelopment(state, completedEventId);
  return { first, second, unchanged: JSON.stringify(state) === JSON.stringify(beforeRepeat) };
});
verify("13. 四條 route 第一次合法事件均成功", repeatResults.every(item => item.first.advanced));
verify("14. 四條 route 重送舊事件均自然失效", repeatResults.every(item => !item.second.advanced));
verify("15. Repeat Event Matrix 全部 zero mutation", repeatResults.every(item => item.unchanged));

const invalidStates = [
  developmentState(undefined, 0),
  developmentState("__unknown__", 0),
  developmentState("大學棒球", 0, { chapter: "生涯轉換期" }),
  developmentState("大學棒球", 0, { age: 22 }),
  developmentState("大學棒球", -1),
  developmentState("大學棒球", developmentEvents.length),
  developmentState("大學棒球", "1")
];
const invalidResults = invalidStates.map(state => {
  const before = clone(state);
  let result;
  let threw = false;
  try {
    result = progression.advanceDevelopment(state, "development_daily_life");
  } catch (_error) {
    threw = true;
  }
  return { result, threw, unchanged: JSON.stringify(state) === JSON.stringify(before) };
});
verify("16. 代表性 invalid Runtime state 全部 rejected", invalidResults.every(item => item.result && !item.result.advanced));
verify("17. Invalid Runtime state 不 throw 且 zero mutation", invalidResults.every(item => !item.threw && item.unchanged));

const forcedState = developmentState("大學棒球", 2, { forcedEventId: "azhe_adult_record_echo" });
const forcedBefore = clone(forcedState);
const forcedUnderlying = runtimeResolver.resolveDevelopmentRuntime(forcedState).eventId;
const forcedResult = progression.advanceDevelopment(forcedState, forcedUnderlying);
verify("18. forcedEventId active 時底層 progression 被拒絕", !forcedResult.advanced);
verify("19. forcedEventId rejection 不清除 forced event 且 zero mutation", JSON.stringify(forcedState) === JSON.stringify(forcedBefore));

const nonWritableState = developmentState("大學棒球", 2);
Object.defineProperty(nonWritableState, "developmentStep", { value: 2, writable: false, enumerable: true, configurable: true });
const nonWritableBefore = clone(nonWritableState);
let nonWritableResult;
let nonWritableThrew = false;
try {
  nonWritableResult = progression.advanceDevelopment(nonWritableState, developmentEvents[2]);
} catch (_error) {
  nonWritableThrew = true;
}
verify("20. non-writable developmentStep rejected 且不 throw", !nonWritableThrew && !nonWritableResult.advanced);
verify("21. non-writable developmentStep zero mutation", JSON.stringify(nonWritableState) === JSON.stringify(nonWritableBefore));

let setterCalls = 0;
const accessorState = developmentState("大學棒球", 2);
Object.defineProperty(accessorState, "developmentStep", {
  get() { return 2; },
  set() { setterCalls += 1; },
  enumerable: true,
  configurable: true
});
const accessorBefore = clone(accessorState);
let accessorResult;
let accessorThrew = false;
try {
  accessorResult = progression.advanceDevelopment(accessorState, developmentEvents[2]);
} catch (_error) {
  accessorThrew = true;
}
verify("22. accessor developmentStep rejected 且不 throw", !accessorThrew && !accessorResult.advanced);
verify("23. accessor setter 未觸發且 Player zero mutation", setterCalls === 0 && JSON.stringify(accessorState) === JSON.stringify(accessorBefore));

const writeTarget = developmentState("大學棒球", 2);
const writeFailureState = new Proxy(writeTarget, {
  set(_target, key) {
    if (key === "developmentStep") throw new TypeError("blocked write");
    return false;
  }
});
const writeFailureBefore = clone(writeTarget);
let writeFailureResult;
let writeFailureThrew = false;
try {
  writeFailureResult = progression.advanceDevelopment(writeFailureState, developmentEvents[2]);
} catch (_error) {
  writeFailureThrew = true;
}
verify("24. preflight 後意外寫入失敗仍 rejected 且不 throw", !writeFailureThrew && !writeFailureResult.advanced);
verify("25. write failure 維持 zero mutation", JSON.stringify(writeTarget) === JSON.stringify(writeFailureBefore));

const deterministicA = developmentState("業餘／社會人棒球", 4);
const deterministicB = clone(deterministicA);
const deterministicEvent = runtimeResolver.resolveDevelopmentRuntime(deterministicA).eventId;
const deterministicResultA = progression.advanceDevelopment(deterministicA, deterministicEvent);
const deterministicResultB = progression.advanceDevelopment(deterministicB, deterministicEvent);
verify("26. 相同 snapshot 與 completedEventId 產生相同結果", JSON.stringify(deterministicResultA) === JSON.stringify(deterministicResultB));
verify("27. advanced 與 rejected result 均為 deep frozen", Object.isFrozen(deterministicResultA)
  && Object.isFrozen(deterministicResultA.issues)
  && Object.isFrozen(forcedResult)
  && Object.isFrozen(forcedResult.issues));

const progressionSource = fs.readFileSync(path.join(root, "career-development-progression.js"), "utf8");
function loadProgressionWithDependencies(resolverDependency, contractDependency) {
  const context = vm.createContext({
    CareerDevelopmentRuntimeResolver: resolverDependency,
    CareerSpineContract: contractDependency,
    module: { exports: {} },
    console
  });
  vm.runInContext(progressionSource, context, { filename: "career-development-progression.js" });
  return context.CareerDevelopmentProgression;
}

const unavailableProgression = loadProgressionWithDependencies(null, contract);
const unavailableState = developmentState("大學棒球", 2);
const unavailableBefore = clone(unavailableState);
const unavailableResult = unavailableProgression.advanceDevelopment(unavailableState, developmentEvents[2]);
verify("28. Runtime Resolver dependency 不可用時 rejected", !unavailableResult.advanced);
verify("29. Dependency failure 維持 zero mutation", JSON.stringify(unavailableState) === JSON.stringify(unavailableBefore));

const inconsistentContract = {
  getCareerNetwork() {
    const value = clone(network);
    value.sharedDevelopment.eventIds.pop();
    return value;
  }
};
const inconsistentProgression = loadProgressionWithDependencies(runtimeResolver, inconsistentContract);
const inconsistentState = developmentState("大學棒球", 2);
const inconsistentBefore = clone(inconsistentState);
const inconsistentResult = inconsistentProgression.advanceDevelopment(inconsistentState, developmentEvents[2]);
verify("30. Contract topology 不一致時 rejected", !inconsistentResult.advanced);
verify("31. Contract inconsistency 維持 zero mutation", JSON.stringify(inconsistentState) === JSON.stringify(inconsistentBefore));

const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "career-spine-contract.js", "career-transition-resolver.js",
  "career-transition-commit.js", "career-transition-runtime-resolver.js",
  "career-transition-progression.js", "career-development-runtime-resolver.js",
  "career-development-progression.js", "story.js", "save.js", "script.js"
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
        value: id === "nameInput" ? "4.9 測試球員" : "",
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
    var __developmentSettlementCalls = 0;
    var __originalEvaluateDevelopmentYears = evaluateDevelopmentYears;
    evaluateDevelopmentYears = function() {
      __developmentSettlementCalls += 1;
      return __originalEvaluateDevelopmentYears();
    };
  `, context);
  return context;
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function setRuntimeState(context, state) {
  evaluate(context, `player = createInitialPlayer("4.9 Runtime"); Object.assign(player, ${JSON.stringify(state)}); isTransitioning = false;`);
}

const integrationContext = makeContext();
setRuntimeState(integrationContext, developmentState("大學棒球", 2));
const staleBefore = evaluate(integrationContext, "JSON.stringify(player)");
evaluate(integrationContext, "choose('development_competition', 0)");
verify("32. Runtime wrong event 在 abilities、flags、relationship、memory、Narrative 與 continuity effects 前被拒絕",
  evaluate(integrationContext, "JSON.stringify(player)") === staleBefore);

setRuntimeState(integrationContext, developmentState("大學棒球", 2));
const firstEvent = evaluate(integrationContext, "getCurrentEventId()");
evaluate(integrationContext, `choose(${JSON.stringify(firstEvent)}, 0)`);
const afterFirst = evaluate(integrationContext, "JSON.stringify(player)");
evaluate(integrationContext, `choose(${JSON.stringify(firstEvent)}, 0)`);
verify("33. Runtime repeat event 不重複 effects、Narrative 或 progression", evaluate(integrationContext, "JSON.stringify(player)") === afterFirst);

setRuntimeState(integrationContext, developmentState("大學棒球", 2, { forcedEventId: "azhe_adult_record_echo" }));
const forcedRuntimeBefore = evaluate(integrationContext, "JSON.stringify(player)");
const underlyingEvent = evaluate(integrationContext, "CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player).eventId");
evaluate(integrationContext, `choose(${JSON.stringify(underlyingEvent)}, 0)`);
verify("34. Runtime forced event active 時 underlying choice 在 effects 前被拒絕", evaluate(integrationContext, "JSON.stringify(player)") === forcedRuntimeBefore);
evaluate(integrationContext, "choose('azhe_adult_record_echo', 0)");
verify("35. 合法 forced event 維持 resumeAfterPending 且不推進 developmentStep", evaluate(integrationContext,
  "player.developmentStep === 2 && player.forcedEventId === '' && player.flags.includes('azhe_adult_record_echo_done')"));

const settlementResults = routeRepresentatives.map(route => {
  const context = makeContext();
  setRuntimeState(context, developmentState(route.careerExit, developmentEvents.length - 1));
  const finalEventId = evaluate(context, "getCurrentEventId()");
  evaluate(context, `choose(${JSON.stringify(finalEventId)}, 0)`);
  const first = evaluate(context, `({
    calls: __developmentSettlementCalls,
    chapter: player.chapter,
    age: player.age,
    developmentStep: player.developmentStep,
    eventId: getCurrentEventId()
  })`);
  evaluate(context, `advanceAfterAction(null, ${JSON.stringify(finalEventId)})`);
  const callsAfterRepeat = evaluate(context, "__developmentSettlementCalls");
  return { routeKey: route.routeKey, first, callsAfterRepeat };
});
verify("36. draft／college／amateur／rehab 最後一幕均進入二十二歲職涯小結", settlementResults.every(item =>
  item.first.chapter === "二十二歲職涯小結"
  && item.first.age === 22
  && item.first.developmentStep === developmentEvents.length
  && item.first.eventId === "development_result"));
verify("37. 四條 route evaluateDevelopmentYears 各只呼叫一次", settlementResults.every(item =>
  item.first.calls === 1 && item.callsAfterRepeat === 1));

const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
verify("38. Progression 不解析 careerExit 或保存第二份 Development Event Registry", !progressionSource.includes("careerExit")
  && !/development_(?:daily_life|competition|mentor|body_choice|opportunity|market|decision)/.test(progressionSource));
verify("39. Progression 只依賴 4.8 Resolver 與 Career Contract", progressionSource.includes("CareerDevelopmentRuntimeResolver")
  && progressionSource.includes("CareerSpineContract")
  && !/document\.|localStorage|sessionStorage|saveGame|loadGame|showStory|showCurrentEvent|choose|advanceAfterAction|evaluateDevelopmentYears|Math\.random|Date\./.test(progressionSource));
verify("40. script.js 已移除正常 Gameplay 直接 developmentStep increment", !/player\.developmentStep\s*(?:\+=\s*1|\+\+|=\s*player\.developmentStep\s*\+\s*1)/.test(scriptSource));
verify("41. Development branch 由 Boundary 結果決定 settlement，未 hard-code 長度", (() => {
  const start = scriptSource.indexOf('if (player.chapter === "發展期")', scriptSource.indexOf("function advanceAfterAction"));
  const end = scriptSource.indexOf('if (player.chapter === "生涯轉換期")', start);
  const branch = scriptSource.slice(start, end);
  return branch.includes("CareerDevelopmentProgression.advanceDevelopment")
    && branch.includes("progressionResult.settlementRequired")
    && !/>=\s*7|===\s*7/.test(branch);
})());
verify("42. enterDevelopmentYears 的 initialization step 0 保持", scriptSource.includes("player.developmentStep = 0;"));
verify("43. evaluateDevelopmentYears 仍由 script.js 負責 age 22 與結果章", scriptSource.includes("function evaluateDevelopmentYears()")
  && scriptSource.includes("player.age = 22;")
  && scriptSource.includes('player.chapter = "二十二歲職涯小結";'));
verify("44. 發展期 choose preflight 位於 event lookup 與 isTransitioning=true 之前", (() => {
  const chooseStart = scriptSource.indexOf("function choose(eventId, index)");
  const preflight = scriptSource.indexOf('player.chapter === "發展期" && getCurrentEventId() !== eventId', chooseStart);
  const eventLookup = scriptSource.indexOf("const event = getEvent(eventId)", chooseStart);
  const transitionStart = scriptSource.indexOf("isTransitioning = true", chooseStart);
  return chooseStart >= 0 && preflight > chooseStart && preflight < eventLookup && preflight < transitionStart;
})());

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const contractIndex = html.indexOf('src="career-spine-contract.js"');
const developmentResolverIndex = html.indexOf('src="career-development-runtime-resolver.js"');
const developmentProgressionIndex = html.indexOf('src="career-development-progression.js"');
const storyIndex = html.indexOf('src="story.js"');
const scriptIndex = html.indexOf('src="script.js"');
verify("45. Browser 依 Contract → Development Resolver → Progression → Story／Script 載入", contractIndex >= 0
  && contractIndex < developmentResolverIndex
  && developmentResolverIndex < developmentProgressionIndex
  && developmentProgressionIndex < storyIndex
  && developmentProgressionIndex < scriptIndex);

const protectedFiles = [
  "career-spine-contract.js", "career-development-runtime-resolver.js",
  "career-transition-resolver.js", "career-transition-commit.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "player.js", "story.js", "style.css"
];
const protectedDiff = execFileSync("git", ["diff", "--name-only", "HEAD", "--", ...protectedFiles], {
  cwd: root,
  encoding: "utf8"
}).trim();
verify("46. Career Contract、4.8 Resolver、Transition 4.4–4.7、Player、Story 與 CSS 均未修改（Save 僅允許 4.10 Admission integration）", protectedDiff === "");
verify("47. Player Schema、Save version 與 localStorage key 完全不變", !/lastDevelopmentEvent|developmentRoute|developmentProgressToken|developmentNonce|developmentNode/.test(fs.readFileSync(path.join(root, "player.js"), "utf8"))
  && evaluate(integrationContext, "SAVE_VERSION") === 13
  && fs.readFileSync(path.join(root, "save.js"), "utf8").includes('"baseballLifeRpgSave"'));

console.log(`\nArchitecture Sprint 4.9 Development Years Progression Boundary：${validations}/${validations} 通過`);
