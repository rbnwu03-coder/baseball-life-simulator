const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const decisionFlowSource = fs.readFileSync(path.join(root, "decision-flow.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const controllerSource = fs.readFileSync(path.join(root, "application-controller.js"), "utf8");

const contextBlock = `  let decisionContext = null;
  if (eventId === "chapter2_intro" && index === 0) {
    const contextResult = DecisionFlow.createDecisionContext(eventId, index);
    if (!contextResult.ok) throw new Error(contextResult.error);
    decisionContext = contextResult.context;
  }
`;
const decisionProgressBlock = `    const nextChapter2Step = (Number(player.chapter2Step) || 0) + 1;
    if (
      decisionContext?.eventId === "chapter2_intro" &&
      decisionContext.choiceIndex === 0
    ) {
      const decisionResult = DecisionFlow.createDecisionResult(
        decisionContext,
        { chapter2Step: nextChapter2Step }
      );
      if (!decisionResult.ok) throw new Error(decisionResult.error);
      const stateChangeResult = DecisionFlow.applyDecisionStateChange(
        decisionResult.decisionResult
      );
      if (!stateChangeResult.ok) throw new Error(stateChangeResult.error);
    }
    else {
      player.chapter2Step = nextChapter2Step;
    }`;

const legacyScriptSource = scriptSource
  .replace(contextBlock, "")
  .replace("  else advanceAfterAction(decisionContext, eventId);", "  else advanceAfterAction();")
  .replace(
    "function advanceAfterAction(decisionContext = null, completedEventId = null) {",
    "function advanceAfterAction() {"
  )
  .replace(
    decisionProgressBlock,
    "    player.chapter2Step = (Number(player.chapter2Step) || 0) + 1;"
  );

let validations = 0;
function assert(condition, message) {
  validations += 1;
  if (!condition) throw new Error(message);
}

assert(legacyScriptSource !== scriptSource, "Golden baseline 沒有還原舊 Decision path");
assert(!legacyScriptSource.includes(contextBlock), "Golden baseline 仍建立 Phase 4 Context");
assert(
  legacyScriptSource.includes(
    "player.chapter2Step = (Number(player.chapter2Step) || 0) + 1;"
  ),
  "Golden baseline 缺少原本 chapter2Step direct write"
);

function makeNode(id) {
  return {
    id,
    innerHTML: "",
    textContent: "",
    value: id === "nameInput" ? "Decision 測試球員" : "",
    style: {},
    dataset: {},
    classList: {
      toggle() {},
      add() {},
      remove() {}
    },
    setAttribute() {},
    focus() {}
  };
}

function makeGameContext({ legacy = false } = {}) {
  const nodes = new Map();
  const storage = new Map();
  let documentAccesses = 0;
  const windowObject = {
    __timeouts: 0,
    setTimeout(callback) {
      this.__timeouts += 1;
      callback();
    }
  };
  const document = {
    getElementById(id) {
      documentAccesses += 1;
      if (!nodes.has(id)) nodes.set(id, makeNode(id));
      return nodes.get(id);
    },
    querySelectorAll() {
      documentAccesses += 1;
      return [];
    },
    querySelector() {
      documentAccesses += 1;
      return null;
    }
  };
  const context = vm.createContext({
    console,
    document,
    localStorage: {
      setItem: (key, value) => storage.set(key, value),
      getItem: key => storage.get(key) || null,
      removeItem: key => storage.delete(key)
    },
    window: windowObject,
    __getDocumentAccesses: () => documentAccesses
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
    "story.js",
    "save.js"
  ].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
      filename: file
    });
  });
  vm.runInContext(legacy ? legacyScriptSource : scriptSource, context, {
    filename: legacy ? "script.phase4-baseline.js" : "script.js"
  });
  vm.runInContext(`
    var __phase4RenderCount = 0;
    var __phase4TransitionCount = 0;
    var __phase4SaveCount = 0;
    var __phase4OriginalShowStory = showStory;
    var __phase4OriginalAdvanceAfterAction = advanceAfterAction;
    var __phase4OriginalSaveGame = saveGame;
    showStory = function(eventId) {
      __phase4RenderCount += 1;
      return __phase4OriginalShowStory(eventId);
    };
    advanceAfterAction = function(decisionContext) {
      __phase4TransitionCount += 1;
      return __phase4OriginalAdvanceAfterAction(decisionContext);
    };
    saveGame = function() {
      __phase4SaveCount += 1;
      return __phase4OriginalSaveGame();
    };
  `, context);

  return { context, nodes, storage };
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

const game = makeGameContext();
const context = game.context;

assert(evaluate(context, "typeof DecisionFlow === 'object'"), "DecisionFlow 不存在");
[
  "createDecisionContext",
  "validateDecisionContext",
  "createDecisionResult",
  "createStateChangeRequest",
  "applyDecisionStateChange"
].forEach(method => {
  assert(
    evaluate(context, `typeof DecisionFlow.${method} === 'function'`),
    `缺少 public method：${method}`
  );
});
assert(
  evaluate(context, "window.DecisionFlow === DecisionFlow"),
  "未正確公開 window.DecisionFlow"
);

const validContextResult = parse(
  context,
  `DecisionFlow.createDecisionContext("chapter2_intro", 0)`
);
assert(validContextResult.ok, "合法 Decision Context 無法建立");
assert(
  JSON.stringify(validContextResult.context) ===
    JSON.stringify({ eventId: "chapter2_intro", choiceIndex: 0 }),
  "Decision Context 格式不正確"
);
assert(
  !Object.prototype.hasOwnProperty.call(validContextResult.context, "player") &&
    !Object.prototype.hasOwnProperty.call(validContextResult.context, "event") &&
    !Object.prototype.hasOwnProperty.call(validContextResult.context, "choice"),
  "Decision Context 暴露 mutable Player、Event 或 Choice reference"
);
assert(
  evaluate(context, `
    (() => {
      const result = DecisionFlow.createDecisionContext("chapter2_intro", 0);
      result.context.choiceIndex = 2;
      return result.context.choiceIndex === 0;
    })()
  `),
  "Decision Context 可以被外部改寫"
);

[
  `DecisionFlow.createDecisionContext("", 0)`,
  `DecisionFlow.createDecisionContext("chapter2_intro", -1)`,
  `DecisionFlow.createDecisionContext("chapter2_intro", 1.5)`,
  `DecisionFlow.createDecisionContext("missing_event", 0)`,
  `DecisionFlow.createDecisionContext("chapter2_intro", 99)`,
  `DecisionFlow.validateDecisionContext(null)`,
  `DecisionFlow.validateDecisionContext({eventId:"chapter2_intro",choiceIndex:0,player:{}})`,
  `DecisionFlow.validateDecisionContext(JSON.parse('{"eventId":"chapter2_intro","choiceIndex":0,"__proto__":{"polluted":true}}'))`
].forEach(expression => {
  const before = evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())");
  const result = parse(context, expression);
  assert(!result.ok, `非法 Context 未被拒絕：${expression}`);
  assert(
    evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())") === before,
    `Context 驗證失敗仍修改 Current State：${expression}`
  );
});

assert(
  !evaluate(context, `
    (() => {
      const candidate = { eventId: "chapter2_intro", choiceIndex: 0 };
      candidate.loop = candidate;
      return DecisionFlow.validateDecisionContext(candidate).ok;
    })()
  `),
  "循環 Context 未被安全拒絕"
);
assert(evaluate(context, "({}).polluted === undefined"), "Context 驗證污染 Object prototype");

const decisionResultResponse = parse(
  context,
  `DecisionFlow.createDecisionResult(
    { eventId: "chapter2_intro", choiceIndex: 0 },
    { chapter2Step: 1 }
  )`
);
assert(decisionResultResponse.ok, "合法 Decision Result 無法建立");
assert(
  JSON.stringify(decisionResultResponse.decisionResult) === JSON.stringify({
    source: {
      type: "decision",
      eventId: "chapter2_intro",
      choiceIndex: 0
    },
    currentStateEffects: {
      progressPosition: {
        chapter2Step: 1
      }
    }
  }),
  "Decision Result 格式不正確"
);
assert(
  JSON.stringify(Object.keys(decisionResultResponse.decisionResult).sort()) ===
    JSON.stringify(["currentStateEffects", "source"]),
  "Decision Result 含有未批准的 gameplay effects"
);

[
  `DecisionFlow.createDecisionResult({eventId:"chapter2_intro",choiceIndex:1},{chapter2Step:1})`,
  `DecisionFlow.createDecisionResult({eventId:"chapter2_intro",choiceIndex:0},{completed:true})`,
  `DecisionFlow.createDecisionResult({eventId:"chapter2_intro",choiceIndex:0},{chapter2Step:-1})`,
  `DecisionFlow.createDecisionResult({eventId:"chapter2_intro",choiceIndex:0},{chapter2Step:1,extra:true})`,
  `DecisionFlow.createDecisionResult({eventId:"chapter2_intro",choiceIndex:0},null)`
].forEach(expression => {
  const result = parse(context, expression);
  assert(!result.ok, `非法 legacyOutcome 未被拒絕：${expression}`);
});

const stateRequestResponse = parse(
  context,
  `DecisionFlow.createStateChangeRequest(${JSON.stringify(
    decisionResultResponse.decisionResult
  )})`
);
assert(stateRequestResponse.ok, "Decision Result 無法轉換為 State Change Request");
assert(
  JSON.stringify(stateRequestResponse.request) === JSON.stringify({
    source: "decision:chapter2_intro:0",
    changes: {
      progressPosition: {
        chapter2Step: 1
      }
    }
  }),
  "State Change Request 格式或 source 不正確"
);

[
  `DecisionFlow.createStateChangeRequest(null)`,
  `DecisionFlow.createStateChangeRequest({source:{type:"decision",eventId:"chapter2_intro",choiceIndex:0},currentStateEffects:{completed:true}})`,
  `DecisionFlow.createStateChangeRequest(JSON.parse('{"source":{"type":"decision","eventId":"chapter2_intro","choiceIndex":0},"currentStateEffects":{"progressPosition":{"constructor":1}}}'))`
].forEach(expression => {
  const before = evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())");
  const result = parse(context, expression);
  assert(!result.ok, `非法 Decision Result 未被拒絕：${expression}`);
  assert(
    evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())") === before,
    "非法 Decision Result 仍修改 Current State"
  );
});

evaluate(context, `
  player = createInitialPlayer("隔離測試");
  player.chapter = "少棒入門";
  player.chapter2Step = 0;
`);
const protectedBefore = evaluate(context, `JSON.stringify({
  identity: PlayerDataBoundary.getIdentity(),
  chapter: player.chapter,
  day: player.day,
  phase: player.phase,
  completed: player.completed,
  lastEventTitle: player.lastEventTitle,
  stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
  personality: player.personality,
  relationships: player.relationships,
  flags: player.flags,
  memories: player.memories,
  body: player.body,
  injury: { injury: player.injury, injuryDays: player.injuryDays },
  matchState: player.matchState
})`);
const countersBefore = parse(context, `({
  document: __getDocumentAccesses(),
  render: __phase4RenderCount,
  transition: __phase4TransitionCount,
  save: __phase4SaveCount,
  timeout: window.__timeouts
})`);
const applyResult = parse(
  context,
  `DecisionFlow.applyDecisionStateChange(${JSON.stringify(
    decisionResultResponse.decisionResult
  )})`
);
assert(applyResult.ok, "applyDecisionStateChange() 套用合法 Result 失敗");
assert(evaluate(context, "player.chapter2Step === 1"), "Decision Result 未更新 chapter2Step");
assert(
  evaluate(context, `JSON.stringify({
    identity: PlayerDataBoundary.getIdentity(),
    chapter: player.chapter,
    day: player.day,
    phase: player.phase,
    completed: player.completed,
    lastEventTitle: player.lastEventTitle,
    stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
    personality: player.personality,
    relationships: player.relationships,
    flags: player.flags,
    memories: player.memories,
    body: player.body,
    injury: { injury: player.injury, injuryDays: player.injuryDays },
    matchState: player.matchState
  })`) === protectedBefore,
  "DecisionFlow 修改了批准欄位以外的狀態"
);
const countersAfter = parse(context, `({
  document: __getDocumentAccesses(),
  render: __phase4RenderCount,
  transition: __phase4TransitionCount,
  save: __phase4SaveCount,
  timeout: window.__timeouts
})`);
assert(
  JSON.stringify(countersAfter) === JSON.stringify(countersBefore),
  "DecisionFlow 操作了 DOM、render、save、time 或 transition"
);

const onceState = evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())");
const secondApply = parse(
  context,
  `DecisionFlow.applyDecisionStateChange(${JSON.stringify(
    decisionResultResponse.decisionResult
  )})`
);
assert(secondApply.ok, "相同 Decision Result 第二次套用失敗");
assert(
  evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())") === onceState,
  "相同 Decision Result 造成 step 重複累加"
);

const delegationCalls = [];
const delegationContext = vm.createContext({
  console,
  calls: delegationCalls,
  getEvent: eventId => eventId === "chapter2_intro"
    ? { choices: [{ text: "target" }] }
    : null,
  CurrentStateBoundary: {
    applyStateChangeRequest(request) {
      delegationCalls.push(request);
      return { ok: true, state: { progressPosition: request.changes.progressPosition } };
    }
  },
  window: {}
});
vm.runInContext(decisionFlowSource, delegationContext, {
  filename: "decision-flow.js"
});
vm.runInContext(`
  var result = DecisionFlow.createDecisionResult(
    { eventId: "chapter2_intro", choiceIndex: 0 },
    { chapter2Step: 1 }
  );
  DecisionFlow.applyDecisionStateChange(result.decisionResult);
`, delegationContext);
assert(delegationCalls.length === 1, "applyDecisionStateChange() 沒有只委派一次 Boundary");
assert(
  delegationCalls[0].source === "decision:chapter2_intro:0",
  "Boundary 委派 Request source 不正確"
);

function collectGoldenState(targetContext) {
  return parse(targetContext, `({
    eventId: getCurrentEventId(),
    chapter: player.chapter,
    day: player.day,
    phase: player.phase,
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
    renderCount: __phase4RenderCount,
    transitionCount: __phase4TransitionCount,
    timeoutCount: window.__timeouts,
    isTransitioning
  })`);
}

function runGoldenDecisionFlow(legacy) {
  const target = makeGameContext({ legacy });
  evaluate(target.context, `
    loadTestBookmark("chapter2");
    __phase4RenderCount = 0;
    __phase4TransitionCount = 0;
    __phase4SaveCount = 0;
    window.__timeouts = 0;
  `);
  const before = collectGoldenState(target.context);
  evaluate(target.context, `choose("chapter2_intro", 0)`);
  const after = collectGoldenState(target.context);
  return { before, after };
}

const legacyGolden = runGoldenDecisionFlow(true);
const boundaryGolden = runGoldenDecisionFlow(false);
assert(
  JSON.stringify(boundaryGolden.before) === JSON.stringify(legacyGolden.before),
  "Golden Decision 起點與修改前不一致"
);
assert(
  JSON.stringify(boundaryGolden.after) === JSON.stringify(legacyGolden.after),
  "Golden Decision 結果與修改前不一致"
);
assert(
  boundaryGolden.before.eventId === "chapter2_intro" &&
    boundaryGolden.before.steps.chapter2Step === 0,
  "Golden Decision 沒有從指定事件與 step 開始"
);
assert(
  boundaryGolden.after.eventId === "chapter2_day1_training" &&
    boundaryGolden.after.steps.chapter2Step === 1,
  "Golden Decision 下一事件或 step 不正確"
);
assert(
  boundaryGolden.after.renderCount === 1 &&
    boundaryGolden.after.transitionCount === 1 &&
    boundaryGolden.after.timeoutCount === 1,
  "Golden Decision 產生額外 render、transition 或 timeout"
);
assert(
  boundaryGolden.after.chapter === boundaryGolden.before.chapter &&
    boundaryGolden.after.day === boundaryGolden.before.day &&
    boundaryGolden.after.phase === boundaryGolden.before.phase,
  "Golden Decision 額外推進 chapter、day 或 phase"
);

const persistence = makeGameContext();
evaluate(persistence.context, `
  loadTestBookmark("chapter2");
  choose("chapter2_intro", 0);
  saveGame();
`);
const beforeSave = evaluate(
  persistence.context,
  `JSON.stringify({
    currentState: CurrentStateBoundary.getSnapshot(),
    stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
    personality: player.personality,
    flags: player.flags,
    memories: player.memories,
    relationships: player.relationships,
    body: player.body,
    matchState: player.matchState
  })`
);
evaluate(persistence.context, `
  choose(getCurrentEventId(), 0);
  loadGame();
`);
assert(
  evaluate(persistence.context, `JSON.stringify({
    currentState: CurrentStateBoundary.getSnapshot(),
    stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
    personality: player.personality,
    flags: player.flags,
    memories: player.memories,
    relationships: player.relationships,
    body: player.body,
    matchState: player.matchState
  })`) === beforeSave,
  "Save → Load 沒有回到 Decision 後儲存狀態"
);

const bookmark = makeGameContext();
evaluate(bookmark.context, `loadTestBookmark("chapter2")`);
assert(
  evaluate(bookmark.context, `
    player.chapter === "少棒入門" &&
    player.chapter2Step === 0 &&
    getCurrentEventId() === "chapter2_intro"
  `),
  "Phase 4 載入後 Debug bookmark 不正常"
);

[
  "document.",
  "innerHTML",
  "localStorage",
  "showStory",
  "updateStatus",
  "advanceAfterAction",
  "advanceFromNight",
  "setTimeout",
  "player.stats",
  "player.personality",
  "player.relationships",
  "player.flags",
  "player.memories",
  "player.body",
  "player.matchState",
  "saveGame"
].forEach(token => {
  assert(!decisionFlowSource.includes(token), `DecisionFlow Source Guard 命中：${token}`);
});

const chooseSource = scriptSource.slice(
  scriptSource.indexOf("function choose(eventId, index)"),
  scriptSource.indexOf("function enterChapterTwo()")
);
assert(
  !/player\.chapter2Step\s*=/.test(chooseSource),
  "choose() 仍直接寫入 chapter2Step"
);
assert(
  chooseSource.includes("DecisionFlow.createDecisionContext") &&
    chooseSource.includes("advanceAfterAction(decisionContext, eventId)"),
  "choose() 未建立或傳遞被接管的 Decision Context"
);

const targetBranchStart = scriptSource.indexOf(
  'decisionContext?.eventId === "chapter2_intro"'
);
const targetBranchEnd = scriptSource.indexOf("    else {", targetBranchStart);
const targetBranchSource = scriptSource.slice(targetBranchStart, targetBranchEnd);
assert(
  targetBranchSource.includes("DecisionFlow.createDecisionResult") &&
    targetBranchSource.includes("DecisionFlow.applyDecisionStateChange"),
  "被接管 path 未經 Decision Result 與 State Change Request"
);
assert(
  !/player\.chapter2Step\s*=/.test(targetBranchSource),
  "被接管 path 仍直接寫 chapter2Step"
);

const playerIndex = indexSource.indexOf('<script src="player.js"></script>');
const stateIndex = indexSource.indexOf('<script src="current-state-boundary.js"></script>');
const timeIndex = indexSource.indexOf('<script src="time-boundary.js"></script>');
const relationshipBoundaryIndex = indexSource.indexOf('<script src="relationship-boundary.js"></script>');
const dayCompletionIndex = indexSource.indexOf('<script src="day-completion-flow.js"></script>');
const decisionIndex = indexSource.indexOf('<script src="decision-flow.js"></script>');
const relationshipFlowIndex = indexSource.indexOf('<script src="relationship-flow.js"></script>');
const storyIndex = indexSource.indexOf('<script src="story.js"></script>');
const scriptIndex = indexSource.indexOf('<script src="script.js"></script>');
const controllerIndex = indexSource.indexOf('<script src="application-controller.js"></script>');
assert(
  playerIndex >= 0 &&
    playerIndex < stateIndex &&
    stateIndex < timeIndex &&
    timeIndex < relationshipBoundaryIndex &&
    relationshipBoundaryIndex < decisionIndex &&
    decisionIndex < dayCompletionIndex &&
    dayCompletionIndex < relationshipFlowIndex &&
    relationshipFlowIndex < storyIndex &&
    storyIndex < scriptIndex &&
    scriptIndex < controllerIndex,
  "Phase 4 瀏覽器載入順序不正確"
);
assert(
  /submitDecision\(eventId, choiceIndex\)[\s\S]*invokeLegacy\("submitDecision", "choose"/.test(
    controllerSource
  ) &&
    !controllerSource.includes("DecisionFlow"),
  "ApplicationController.submitDecision() 不再只委派 legacy choose()"
);

console.log(`DecisionFlow validations：${validations}`);
console.log("Golden Decision Flow：chapter2_intro 選項 0 完全一致");
console.log("Save／Load、Debug bookmark 與 Source Guard：通過");
console.log("Phase 4 Decision / Event Request Flow test passed.");
