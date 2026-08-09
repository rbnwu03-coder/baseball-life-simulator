const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const dayCompletionSource = fs.readFileSync(
  path.join(root, "day-completion-flow.js"),
  "utf8"
);
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const controllerSource = fs.readFileSync(
  path.join(root, "application-controller.js"),
  "utf8"
);

const legacySleepBranch = `  if (choice.sleep) {
    advanceFromNight();
    showCurrentEvent();
    return;
  }

  isTransitioning = true;`;
const legacyScriptSource = scriptSource.replace(
  /  if \(choice\.sleep\) \{[\s\S]*?\n  \}\n\n  isTransitioning = true;/,
  legacySleepBranch
);

if (legacyScriptSource === scriptSource) {
  throw new Error("無法建立 Phase 5 修改前 Golden baseline");
}

let validations = 0;

function assert(condition, message) {
  validations += 1;
  if (!condition) throw new Error(message);
}

function createNode(id) {
  return {
    id,
    innerHTML: "",
    textContent: "",
    value: "",
    style: {},
    dataset: {},
    classList: { toggle() {}, add() {}, remove() {} },
    addEventListener() {},
    focus() {}
  };
}

function makeGameContext({ legacy = false } = {}) {
  const nodes = new Map();
  const storage = new Map();
  let storageWrites = 0;
  let documentAccesses = 0;

  const context = vm.createContext({
    console,
    alert() {},
    document: {
      getElementById(id) {
        documentAccesses += 1;
        if (!nodes.has(id)) nodes.set(id, createNode(id));
        return nodes.get(id);
      },
      querySelectorAll() {
        documentAccesses += 1;
        return [];
      }
    },
    localStorage: {
      setItem(key, value) {
        storageWrites += 1;
        storage.set(key, value);
      },
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      removeItem(key) {
        storage.delete(key);
      }
    },
    window: {
      __timeouts: 0,
      setTimeout(callback) {
        this.__timeouts += 1;
        callback();
      }
    }
  });

  [
    "player.js",
    "current-state-boundary.js",
    "time-boundary.js",
    "relationship-boundary.js",
    "coach-evaluation-boundary.js",
    "decision-flow.js",
    "day-completion-flow.js",
    "relationship-flow.js",
    "coach-response-flow.js",
    "career-spine-contract.js",
    "career-transition-runtime-resolver.js",
    "career-development-runtime-resolver.js",
    "career-save-admission.js",
    "story.js",
    "save.js"
  ].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
      filename: file
    });
  });
  vm.runInContext(legacy ? legacyScriptSource : scriptSource, context, {
    filename: "script.js"
  });

  vm.runInContext(`
    var __phase5RenderCount = 0;
    var __phase5TransitionCount = 0;
    var __phase5OriginalShowCurrentEvent = showCurrentEvent;
    showCurrentEvent = function() {
      __phase5RenderCount += 1;
      return __phase5OriginalShowCurrentEvent();
    };
  `, context);

  return {
    context,
    getStorageWrites: () => storageWrites,
    getDocumentAccesses: () => documentAccesses
  };
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

const contextBundle = makeGameContext();
const context = contextBundle.context;

assert(
  evaluate(context, "typeof DayCompletionFlow === 'object'"),
  "DayCompletionFlow 不存在"
);
[
  "createDayCompletionContext",
  "validateDayCompletionContext",
  "createTimeAdvanceRequest",
  "createStableDayCompletionSnapshot",
  "completeDay"
].forEach(method => {
  assert(
    evaluate(context, `typeof DayCompletionFlow.${method} === "function"`),
    `缺少 DayCompletionFlow.${method}()`
  );
});

evaluate(context, `
  player = createInitialPlayer("DayCompletion測試");
  player.chapter = "十歲暑假";
  player.day = 1;
  player.phase = "night";
`);
const validContext = parse(
  context,
  `DayCompletionFlow.createDayCompletionContext("night", 0)`
);
assert(validContext.ok, "合法夜晚 Context 無法建立");
assert(
  JSON.stringify(validContext.context) ===
    JSON.stringify({ eventId: "night", choiceIndex: 0 }),
  "Day Completion Context 格式不正確"
);
assert(
  !Object.prototype.hasOwnProperty.call(validContext.context, "player"),
  "Day Completion Context 暴露 player"
);
evaluate(context, `
  var exposedDayContext = DayCompletionFlow.createDayCompletionContext("night", 0).context;
  try { exposedDayContext.choiceIndex = 9; } catch (error) {}
`);
assert(
  evaluate(context, "exposedDayContext.choiceIndex === 0"),
  "Day Completion Context 不是不可變資料"
);

const requestResult = parse(
  context,
  `DayCompletionFlow.createTimeAdvanceRequest({eventId:"night",choiceIndex:0})`
);
assert(requestResult.ok, "DayCompletionFlow 無法建立 Time Advance Request");
assert(
  JSON.stringify(requestResult.request) === JSON.stringify({
    source: "night-decision:night:0",
    operation: "advance-to-next-day",
    expected: { day: 1, phase: "night" },
    next: { day: 2, phase: "morning" }
  }),
  "DayCompletionFlow 的 Time Advance Request 格式不正確"
);

[
  {
    label: "非夜晚事件",
    setup: `player.day=1; player.phase="night";`,
    expression: `DayCompletionFlow.createDayCompletionContext("day1_morning",0)`
  },
  {
    label: "非 sleep choice",
    setup: `player.day=1; player.phase="night";`,
    expression: `DayCompletionFlow.validateDayCompletionContext({eventId:"day1_morning",choiceIndex:0})`
  },
  {
    label: "非法 choice index",
    setup: `player.day=1; player.phase="night";`,
    expression: `DayCompletionFlow.createDayCompletionContext("night",1)`
  },
  {
    label: "非 night phase",
    setup: `player.day=1; player.phase="morning";`,
    expression: `DayCompletionFlow.createDayCompletionContext("night",0)`
  },
  {
    label: "未知 Context 欄位",
    setup: `player.day=1; player.phase="night";`,
    expression: `DayCompletionFlow.validateDayCompletionContext({eventId:"night",choiceIndex:0,player:{}})`
  }
].forEach(testCase => {
  evaluate(context, testCase.setup);
  const before = parse(context, "TimeBoundary.getSnapshot()");
  const result = parse(context, testCase.expression);
  assert(!result.ok, `${testCase.label} 未被拒絕`);
  assert(
    JSON.stringify(parse(context, "TimeBoundary.getSnapshot()")) ===
      JSON.stringify(before),
    `${testCase.label} 修改了 Time State`
  );
});

evaluate(context, `player.day=1; player.phase="night";`);
const pollutionContext = parse(
  context,
  `DayCompletionFlow.validateDayCompletionContext(
    JSON.parse('{"eventId":"night","choiceIndex":0,"__proto__":{"polluted":true}}')
  )`
);
assert(!pollutionContext.ok, "Day Completion prototype pollution 未被拒絕");
const cycleContext = parse(
  context,
  `(() => {
    const value = { eventId: "night", choiceIndex: 0 };
    value.loop = value;
    return DayCompletionFlow.validateDayCompletionContext(value);
  })()`
);
assert(!cycleContext.ok, "循環 Day Completion Context 未被拒絕");

const protectedBefore = parse(context, `({
  chapter: player.chapter,
  steps: {
    chapter2Step: player.chapter2Step,
    seasonStep: player.seasonStep,
    competitionStep: player.competitionStep
  },
  stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
  personality: player.personality,
  relationships: player.relationships,
  flags: player.flags,
  memories: player.memories,
  body: player.body,
  matchState: player.matchState
})`);
const completionResult = parse(
  context,
  `DayCompletionFlow.completeDay({eventId:"night",choiceIndex:0})`
);
assert(completionResult.ok, "合法夜晚無法完成一天");
assert(
  completionResult.stableSnapshot.day === 2 &&
    completionResult.stableSnapshot.phase === "morning",
  "Stable Snapshot 不是 next-day／morning"
);
assert(
  evaluate(context, "player.day === 2 && player.phase === 'morning'"),
  "completeDay() 未正確推進一天"
);
assert(
  JSON.stringify(parse(context, `({
    chapter: player.chapter,
    steps: {
      chapter2Step: player.chapter2Step,
      seasonStep: player.seasonStep,
      competitionStep: player.competitionStep
    },
    stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
    personality: player.personality,
    relationships: player.relationships,
    flags: player.flags,
    memories: player.memories,
    body: player.body,
    matchState: player.matchState
  })`)) === JSON.stringify(protectedBefore),
  "completeDay() 修改了 day／phase 以外的狀態"
);
const secondCompletion = parse(
  context,
  `DayCompletionFlow.completeDay({eventId:"night",choiceIndex:0})`
);
assert(!secondCompletion.ok, "相同 Context 在 morning 又推進一次");
assert(
  evaluate(context, "player.day === 2 && player.phase === 'morning'"),
  "同一 Context 重複增加一天"
);

const delegation = { create: 0, apply: 0 };
const delegationContext = vm.createContext({
  console,
  window: {},
  getEvent(eventId) {
    return eventId === "night"
      ? { choices: [{ text: "sleep", sleep: true }] }
      : null;
  },
  TimeBoundary: {
    isNight() {
      return true;
    },
    createNextDayRequest(source) {
      delegation.create += 1;
      return {
        ok: true,
        request: {
          source,
          operation: "advance-to-next-day",
          expected: { day: 1, phase: "night" },
          next: { day: 2, phase: "morning" }
        }
      };
    },
    applyTimeAdvanceRequest(request) {
      delegation.apply += 1;
      return { ok: true, state: request.next };
    },
    getSnapshot() {
      return { day: 2, phase: "morning" };
    }
  }
});
vm.runInContext(dayCompletionSource, delegationContext, {
  filename: "day-completion-flow.js"
});
vm.runInContext(
  `DayCompletionFlow.completeDay({eventId:"night",choiceIndex:0})`,
  delegationContext
);
assert(
  delegation.create === 1 && delegation.apply === 1,
  "completeDay() 沒有只透過 TimeBoundary 建立並套用一次 Request"
);

function collectGoldenState(targetContext, storageWrites) {
  return {
    runtime: parse(targetContext, `({
      eventId: "night",
      choiceIndex: 0,
      day: player.day,
      phase: player.phase,
      chapter: player.chapter,
      steps: {
        chapter2Step: player.chapter2Step,
        seasonStep: player.seasonStep,
        competitionStep: player.competitionStep,
        juniorStep: player.juniorStep,
        juniorSeasonStep: player.juniorSeasonStep,
        highSchoolStep: player.highSchoolStep,
        criticalYearStep: player.criticalYearStep,
        transitionStep: player.transitionStep,
        developmentStep: player.developmentStep
      },
      completed: player.completed,
      lastEventTitle: player.lastEventTitle,
      currentEventId: getCurrentEventId(),
      stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
      personality: player.personality,
      flags: player.flags,
      memories: player.memories,
      relationships: player.relationships,
      body: player.body,
      matchState: player.matchState,
      renderCount: __phase5RenderCount,
      transitionCount: __phase5TransitionCount,
      timeoutCount: window.__timeouts,
      isTransitioning
    })`),
    dom: parse(targetContext, `({
      story: document.getElementById("story").innerHTML,
      choices: document.getElementById("choices").innerHTML,
      status: document.getElementById("status").innerHTML,
      playerInfo: document.getElementById("player-info").innerHTML,
      changeLog: document.getElementById("changeLog").innerHTML
    })`),
    storageWrites
  };
}

function runGoldenFlow(legacy) {
  const bundle = makeGameContext({ legacy });
  evaluate(bundle.context, `
    player = createInitialPlayer("GoldenNight");
    player.chapter = "十歲暑假";
    player.day = 1;
    player.phase = "night";
    showCurrentEvent();
    __phase5RenderCount = 0;
    __phase5TransitionCount = 0;
    window.__timeouts = 0;
  `);
  const storageBefore = bundle.getStorageWrites();
  evaluate(bundle.context, `choose("night", 0)`);
  return collectGoldenState(
    bundle.context,
    bundle.getStorageWrites() - storageBefore
  );
}

const legacyGolden = runGoldenFlow(true);
const phase5Golden = runGoldenFlow(false);
if (JSON.stringify(phase5Golden) !== JSON.stringify(legacyGolden)) {
  console.error("LEGACY", JSON.stringify(legacyGolden, null, 2));
  console.error("PHASE5", JSON.stringify(phase5Golden, null, 2));
}
assert(
  JSON.stringify(phase5Golden) === JSON.stringify(legacyGolden),
  "Golden Day Completion Flow 與修改前不一致"
);
assert(
  phase5Golden.runtime.day === 2 &&
    phase5Golden.runtime.phase === "morning" &&
    phase5Golden.runtime.currentEventId === "day2_morning",
  "Golden Flow 沒有停在第 2 天早晨事件"
);
assert(
  phase5Golden.runtime.renderCount === 1 &&
    phase5Golden.runtime.transitionCount === 0 &&
    phase5Golden.runtime.timeoutCount === 0,
  "Golden Flow 的 render／transition／timeout 次數改變"
);
assert(phase5Golden.storageWrites === 0, "Day Completion 意外觸發 autosave");

const stableBundle = makeGameContext();
evaluate(stableBundle.context, `
  player = createInitialPlayer("StableSave");
  player.chapter = "十歲暑假";
  player.day = 1;
  player.phase = "night";
  showCurrentEvent();
`);
const writesBeforeCompletion = stableBundle.getStorageWrites();
evaluate(stableBundle.context, `choose("night", 0)`);
assert(
  stableBundle.getStorageWrites() === writesBeforeCompletion,
  "完成一天時寫入 localStorage"
);
const stableSnapshot = parse(
  stableBundle.context,
  "DayCompletionFlow.createStableDayCompletionSnapshot()"
);
assert(
  stableSnapshot.day === 2 && stableSnapshot.phase === "morning",
  "日結後取得的 Stable Snapshot 不正確"
);
evaluate(stableBundle.context, "saveGame()");
assert(
  stableBundle.getStorageWrites() === writesBeforeCompletion + 1,
  "手動 saveGame() 沒有且只寫入一次"
);
evaluate(stableBundle.context, `
  choose("day2_morning", 0);
  loadGame();
`);
assert(
  evaluate(
    stableBundle.context,
    "player.day === 2 && player.phase === 'morning' && getCurrentEventId() === 'day2_morning'"
  ),
  "Save → 繼續 → Load 未回到 next-day／morning"
);

evaluate(stableBundle.context, `loadTestBookmark("chapter2")`);
assert(
  evaluate(
    stableBundle.context,
    "player.chapter === '少棒入門' && getCurrentEventId() === 'chapter2_intro'"
  ),
  "Phase 5 破壞 Debug bookmark"
);

[
  "document.",
  "innerHTML",
  "localStorage",
  "saveGame",
  "showStory",
  "showCurrentEvent",
  "setTimeout",
  "player.day =",
  "player.phase =",
  "player.stats",
  "player.relationships",
  "player.body"
].forEach(token => {
  assert(!dayCompletionSource.includes(token), `DayCompletionFlow Source Guard 命中：${token}`);
});

const sleepBranch = scriptSource.slice(
  scriptSource.indexOf("if (choice.sleep)"),
  scriptSource.indexOf("isTransitioning = true", scriptSource.indexOf("if (choice.sleep)"))
);
const migratedTargetBranch = sleepBranch.slice(0, sleepBranch.indexOf("else {"));
assert(
  migratedTargetBranch.includes("DayCompletionFlow.completeDay"),
  "目標 sleep path 未使用 DayCompletionFlow"
);
assert(
  !migratedTargetBranch.includes("advanceFromNight"),
  "目標 sleep path 仍直接呼叫 advanceFromNight()"
);
assert(
  sleepBranch.includes("else") && sleepBranch.includes("advanceFromNight"),
  "未接管的 legacy sleep path 沒有保留 advanceFromNight()"
);
assert(
  /submitDecision\(eventId, choiceIndex\)[\s\S]*invokeLegacy\("submitDecision", "choose"/.test(
    controllerSource
  ),
  "ApplicationController.submitDecision() 不再委派 choose()"
);
assert(
  !scriptSource.slice(
    scriptSource.indexOf("if (choice.sleep)"),
    scriptSource.indexOf("isTransitioning = true", scriptSource.indexOf("if (choice.sleep)"))
  ).includes("saveGame"),
  "sleep path 新增 autosave"
);
assert(
  !indexSource.includes('<script src="time.js"></script>'),
  "既有 time.js 被意外載入"
);

console.log(`DayCompletionFlow validations：${validations}`);
console.log("Golden Day Completion Flow：night:0 完全一致");
console.log("Stable Snapshot 與手動 Save／Load：通過");
console.log("Phase 5 Day Completion Flow test passed.");
