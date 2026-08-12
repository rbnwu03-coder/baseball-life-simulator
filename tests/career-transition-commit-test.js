const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const commitBoundary = require(path.join(root, "career-transition-commit.js"));

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function graduationState(careerExit, overrides = {}) {
  return Object.assign({
    chapter: "青棒生涯出口",
    age: 18,
    criticalYearStep: 8,
    criticalYearResult: "高中三年評估完成",
    criticalYearDetail: "球員已完成高三出口判定。",
    careerExit,
    forcedEventId: "",
    completed: false,
    transitionStep: 4,
    marker: { keep: true }
  }, overrides);
}

const legalCases = [
  ["高卒選秀・中後段指名候選", "draft", "transition_draft_day"],
  ["高卒選秀・落選／培訓測試", "draft", "transition_draft_day"],
  ["大學棒球", "college", "transition_college_arrival"],
  ["業餘／社會人棒球", "amateur", "transition_amateur_job"],
  ["復健與生涯暫停", "rehab", "transition_rehab_plateau"]
];

verify("1. Commit Boundary 只公開單一正式 commit API", Object.keys(commitBoundary).length === 1
  && typeof commitBoundary.commitGraduationTransition === "function");

const directResults = legalCases.map(([careerExit]) => {
  const state = graduationState(careerExit);
  const before = JSON.parse(JSON.stringify(state));
  const result = commitBoundary.commitGraduationTransition(state);
  return { state, before, result };
});

verify("2. 五種合法高中出口都可提交到成年入口", directResults.every(({ result }) =>
  result.status === "committed" && result.committed === true && result.target));
verify("3. 提交只套用 Resolver target chapter 與 transitionStep=0", directResults.every(({ state, result }) =>
  state.chapter === result.target.chapter
  && state.transitionStep === 0
  && JSON.stringify(result.appliedPatch) === JSON.stringify({ chapter: result.target.chapter, transitionStep: 0 })));
verify("4. 五種合法提交都保留 careerExit、age 與高三結果", directResults.every(({ state, before }) =>
  state.careerExit === before.careerExit
  && state.age === before.age
  && state.criticalYearStep === before.criticalYearStep
  && state.criticalYearResult === before.criticalYearResult
  && state.criticalYearDetail === before.criticalYearDetail));
verify("5. Commit Boundary 不修改其他 Player 欄位", directResults.every(({ state, before }) =>
  state.completed === before.completed
  && state.forcedEventId === before.forcedEventId
  && JSON.stringify(state.marker) === JSON.stringify(before.marker)));
verify("6. 成功結果為深層 readonly", directResults.every(({ result }) =>
  Object.isFrozen(result) && Object.isFrozen(result.source) && Object.isFrozen(result.target)
  && Object.isFrozen(result.appliedPatch) && Object.isFrozen(result.issues)));

const malformedState = graduationState("大學棒球", { criticalYearResult: "" });
const malformedBefore = JSON.stringify(malformedState);
const malformedResult = commitBoundary.commitGraduationTransition(malformedState);
verify("7. 不合法畢業狀態會 rejected 且 target 為 null", malformedResult.status === "rejected"
  && malformedResult.committed === false && malformedResult.target === null);
verify("8. rejected 前後 Player 深層狀態完全相同", JSON.stringify(malformedState) === malformedBefore);

const forcedState = graduationState("大學棒球", { forcedEventId: "azhe_adult_record_echo" });
const forcedBefore = JSON.stringify(forcedState);
const forcedResult = commitBoundary.commitGraduationTransition(forcedState);
verify("9. forcedEventId 存在時拒絕提交且不清除", forcedResult.status === "rejected"
  && forcedState.forcedEventId === "azhe_adult_record_echo" && JSON.stringify(forcedState) === forcedBefore);

const doubleState = graduationState("業餘／社會人棒球");
const firstCommit = commitBoundary.commitGraduationTransition(doubleState);
const afterFirstCommit = JSON.stringify(doubleState);
const secondCommit = commitBoundary.commitGraduationTransition(doubleState);
verify("10. 重複提交時第一次成功、第二次拒絕", firstCommit.committed === true
  && secondCommit.status === "rejected" && secondCommit.committed === false);
verify("11. 第二次提交不再修改已提交狀態", JSON.stringify(doubleState) === afterFirstCommit);

const files = [
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
        value: id === "nameInput" ? "4.5 測試球員" : "",
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
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    var __commitCounters = { breather: 0, thread: 0, role: 0, careerValue: 0, notice: 0, render: 0 };
    var __originalApplyChapterBreather = applyChapterBreather;
    applyChapterBreather = function() { __commitCounters.breather += 1; return __originalApplyChapterBreather.apply(this, arguments); };
    var __originalStartNarrativeThread = startNarrativeThread;
    startNarrativeThread = function() { __commitCounters.thread += 1; return __originalStartNarrativeThread.apply(this, arguments); };
    var __originalChangeRoleIdentity = changeRoleIdentity;
    changeRoleIdentity = function() { __commitCounters.role += 1; return __originalChangeRoleIdentity.apply(this, arguments); };
    var __originalUpdateCareerValue = updateCareerValue;
    updateCareerValue = function() { __commitCounters.careerValue += 1; return __originalUpdateCareerValue.apply(this, arguments); };
    var __originalShowNotice = showNotice;
    showNotice = function() { __commitCounters.notice += 1; return __originalShowNotice.apply(this, arguments); };
    var __originalShowCurrentEvent = showCurrentEvent;
    showCurrentEvent = function() { __commitCounters.render += 1; return __originalShowCurrentEvent.apply(this, arguments); };
  `, context);
  return context;
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function setRuntimePlayer(context, careerExit, overrides = {}) {
  evaluate(context, `
    player = createInitialPlayer("4.5 測試球員");
    Object.assign(player, ${JSON.stringify({
      chapter: "青棒生涯出口",
      age: 18,
      criticalYearStep: 8,
      criticalYearResult: "高中三年評估完成",
      criticalYearDetail: "球員已完成高三出口判定。",
      careerExit,
      transitionStep: 4,
      completed: false,
      forcedEventId: "",
      ...overrides
    })});
    __commitCounters = { breather: 0, thread: 0, role: 0, careerValue: 0, notice: 0, render: 0 };
  `);
}

const runtime = makeContext();
verify("12. 現行 enterCareerTransition() 已接入 Commit Boundary", evaluate(runtime,
  "enterCareerTransition.toString().includes('CareerTransitionCommitBoundary.commitGraduationTransition(player)')"));

verify("13. 五種出口提交後的真實 Runtime 事件與 Resolver entryEventId 一致", legalCases.every(([careerExit, routeKey, entryEventId]) => {
  setRuntimePlayer(runtime, careerExit);
  const result = evaluate(runtime, "enterCareerTransition()");
  return result.committed === true
    && result.target.routeKey === routeKey
    && result.target.entryEventId === entryEventId
    && evaluate(runtime, "getCurrentEventId()") === entryEventId;
}));

setRuntimePlayer(runtime, "大學棒球", { pressure: 7 });
evaluate(runtime, "player.body.fatigue = 4; player.burnout = 3;");
const successfulRuntimeResult = evaluate(runtime, "enterCareerTransition()");
verify("14. 成功提交後才執行既有入口初始化與呈現", successfulRuntimeResult.committed === true
  && evaluate(runtime, "__commitCounters.breather === 1 && __commitCounters.thread === 1 && __commitCounters.careerValue === 1 && __commitCounters.notice === 1 && __commitCounters.render === 1")
  && evaluate(runtime, "player.narrativeThread.route === 'college'"));
verify("15. 成功提交後保留既有章節喘息效果", evaluate(runtime,
  "player.pressure === 5 && player.body.fatigue === 3 && player.burnout === 2"));

setRuntimePlayer(runtime, "大學棒球", { forcedEventId: "azhe_adult_record_echo", pressure: 7 });
evaluate(runtime, "player.body.fatigue = 4; player.burnout = 3;");
const rejectedRuntimeBefore = evaluate(runtime, "JSON.stringify(player)");
const rejectedRuntimeResult = evaluate(runtime, "enterCareerTransition()");
verify("16. Runtime 提交失敗時 Player 與 forcedEventId 完全不變", rejectedRuntimeResult.status === "rejected"
  && rejectedRuntimeBefore === evaluate(runtime, "JSON.stringify(player)"));
verify("17. Runtime 提交失敗時不執行既有副作用或呈現", evaluate(runtime,
  "Object.values(__commitCounters).every(value => value === 0)"));

const boundarySource = fs.readFileSync(path.join(root, "career-transition-commit.js"), "utf8");
verify("18. Commit Boundary 沒有 RNG、時間、Storage、Save、UI 或 Render 依賴",
  !/Math\.random|Date\.|localStorage|sessionStorage|saveGame|document\.|showNotice|showStory|showCurrentEvent|updateStatus/.test(boundarySource));
verify("19. Commit Boundary 只包含必要的 chapter 與 transitionStep 寫入",
  !/careerExit\s*=|age\s*=|criticalYearStep\s*=|criticalYearResult\s*=|criticalYearDetail\s*=|completed\s*=|forcedEventId\s*=/.test(boundarySource)
  && /chapter:\s*targetChapter/.test(boundarySource)
  && /transitionStep:\s*0/.test(boundarySource));
verify("20. Player 未新增 currentCareerRoute、Save version 為 15 且 localStorage key 不變", !fs.readFileSync(path.join(root, "player.js"), "utf8").includes("currentCareerRoute")
  && evaluate(runtime, "SAVE_VERSION") === 15
  && fs.readFileSync(path.join(root, "save.js"), "utf8").includes('"baseballLifeRpgSave"'));

const protectedDiff = execFileSync("git", [
  "diff", "--name-only", "HEAD", "--",
  "career-transition-resolver.js", "current-state-boundary.js", "decision-flow.js", "competition-presentation.js"
], { cwd: root, encoding: "utf8" }).trim();
verify("21. Resolver 與既有 Boundary 均未修改", protectedDiff === "");

verify("22. index.html 依 Contract → Resolver → Commit → Runtime 順序載入", (() => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const contractIndex = html.indexOf('src="career-spine-contract.js"');
  const resolverIndex = html.indexOf('src="career-transition-resolver.js"');
  const commitIndex = html.indexOf('src="career-transition-commit.js"');
  const runtimeResolverIndex = html.indexOf('src="career-transition-runtime-resolver.js"');
  const runtimeIndex = html.indexOf('src="script.js"');
  return contractIndex >= 0 && contractIndex < resolverIndex && resolverIndex < commitIndex
    && commitIndex < runtimeResolverIndex && runtimeResolverIndex < runtimeIndex;
})());

const nonWritableTransitionState = graduationState("大學棒球");
Object.defineProperty(nonWritableTransitionState, "transitionStep", {
  value: nonWritableTransitionState.transitionStep,
  writable: false,
  enumerable: true,
  configurable: true
});
const nonWritableTransitionBefore = JSON.stringify(nonWritableTransitionState);
let nonWritableTransitionResult = null;
let nonWritableTransitionError = null;
try {
  nonWritableTransitionResult = commitBoundary.commitGraduationTransition(nonWritableTransitionState);
} catch (error) {
  nonWritableTransitionError = error;
}
verify("23. transitionStep 不可寫時會 rejected 且不會 throw", nonWritableTransitionError === null
  && nonWritableTransitionResult.status === "rejected"
  && nonWritableTransitionResult.committed === false);
verify("24. transitionStep 不可寫時 chapter 與完整 Player 維持原狀", nonWritableTransitionState.chapter === "青棒生涯出口"
  && nonWritableTransitionState.transitionStep === 4
  && JSON.stringify(nonWritableTransitionState) === nonWritableTransitionBefore);

const nonWritableChapterState = graduationState("大學棒球");
Object.defineProperty(nonWritableChapterState, "chapter", {
  value: nonWritableChapterState.chapter,
  writable: false,
  enumerable: true,
  configurable: true
});
const nonWritableChapterBefore = JSON.stringify(nonWritableChapterState);
let nonWritableChapterResult = null;
let nonWritableChapterError = null;
try {
  nonWritableChapterResult = commitBoundary.commitGraduationTransition(nonWritableChapterState);
} catch (error) {
  nonWritableChapterError = error;
}
verify("25. chapter 不可寫時會 rejected 且不會 throw", nonWritableChapterError === null
  && nonWritableChapterResult.status === "rejected"
  && nonWritableChapterResult.committed === false);
verify("26. chapter 不可寫時 transitionStep 與完整 Player 維持原狀", nonWritableChapterState.chapter === "青棒生涯出口"
  && nonWritableChapterState.transitionStep === 4
  && JSON.stringify(nonWritableChapterState) === nonWritableChapterBefore);

console.log(`\nArchitecture Sprint 4.5 Graduation Transition Commit Boundary：${passed}/${passed} 通過`);
