const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const boundarySource = fs.readFileSync(path.join(root, "current-state-boundary.js"), "utf8");
const timeBoundarySource = fs.readFileSync(path.join(root, "time-boundary.js"), "utf8");
const relationshipBoundarySource = fs.readFileSync(path.join(root, "relationship-boundary.js"), "utf8");
const coachEvaluationBoundarySource = fs.readFileSync(path.join(root, "coach-evaluation-boundary.js"), "utf8");
const dayCompletionFlowSource = fs.readFileSync(path.join(root, "day-completion-flow.js"), "utf8");
const decisionFlowSource = fs.readFileSync(path.join(root, "decision-flow.js"), "utf8");
const relationshipFlowSource = fs.readFileSync(path.join(root, "relationship-flow.js"), "utf8");
const coachResponseFlowSource = fs.readFileSync(path.join(root, "coach-response-flow.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

const boundaryWriteBlock = `  const currentStateResult = CurrentStateBoundary.applyStateChangeRequest({
    source: "showStory",
    changes: { lastEventTitle: event.title }
  });
  if (!currentStateResult.ok) {
    throw new Error(currentStateResult.error);
  }`;
const legacyScriptSource = scriptSource.replace(
  boundaryWriteBlock,
  "  player.lastEventTitle = event.title;"
);

let validations = 0;
function assert(condition, message) {
  validations += 1;
  if (!condition) throw new Error(message);
}

assert(legacyScriptSource !== scriptSource, "Golden baseline 無法還原舊 lastEventTitle 寫入");

function makeNode(id) {
  return {
    id,
    innerHTML: "",
    textContent: "",
    value: id === "nameInput" ? "狀態邊界測試球員" : "",
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

  vm.runInContext(fs.readFileSync(path.join(root, "player.js"), "utf8"), context, {
    filename: "player.js"
  });
  if (!legacy) {
    vm.runInContext(boundarySource, context, { filename: "current-state-boundary.js" });
  }
  vm.runInContext(timeBoundarySource, context, { filename: "time-boundary.js" });
  vm.runInContext(relationshipBoundarySource, context, { filename: "relationship-boundary.js" });
  vm.runInContext(coachEvaluationBoundarySource, context, { filename: "coach-evaluation-boundary.js" });
  vm.runInContext(decisionFlowSource, context, { filename: "decision-flow.js" });
  vm.runInContext(dayCompletionFlowSource, context, { filename: "day-completion-flow.js" });
  vm.runInContext(relationshipFlowSource, context, { filename: "relationship-flow.js" });
  vm.runInContext(coachResponseFlowSource, context, { filename: "coach-response-flow.js" });
  ["story.js", "save.js"].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
      filename: file
    });
  });
  vm.runInContext(legacy ? legacyScriptSource : scriptSource, context, {
    filename: legacy ? "script.legacy-baseline.js" : "script.js"
  });
  vm.runInContext(`
    var __phase3RenderCount = 0;
    var __phase3TransitionCount = 0;
    var __phase3SaveCount = 0;
    var __phase3OriginalShowStory = showStory;
    var __phase3OriginalAdvanceAfterAction = advanceAfterAction;
    var __phase3OriginalSaveGame = saveGame;
    showStory = function(eventId) {
      __phase3RenderCount += 1;
      return __phase3OriginalShowStory(eventId);
    };
    advanceAfterAction = function() {
      __phase3TransitionCount += 1;
      return __phase3OriginalAdvanceAfterAction();
    };
    saveGame = function() {
      __phase3SaveCount += 1;
      return __phase3OriginalSaveGame();
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

assert(evaluate(context, "typeof CurrentStateBoundary === 'object'"), "CurrentStateBoundary 不存在");
[
  "getSnapshot",
  "getProgressPosition",
  "validateStateChangeRequest",
  "applyStateChangeRequest",
  "restoreCurrentState",
  "isCompleted",
  "getCurrentEventId"
].forEach(method => {
  assert(
    evaluate(context, `typeof CurrentStateBoundary.${method} === 'function'`),
    `缺少 public method：${method}`
  );
});
assert(
  evaluate(context, "window.CurrentStateBoundary === CurrentStateBoundary"),
  "未正確公開 window.CurrentStateBoundary"
);

const initialSnapshot = parse(context, "CurrentStateBoundary.getSnapshot()");
assert(
  JSON.stringify(Object.keys(initialSnapshot).sort()) === JSON.stringify([
    "chapter",
    "completed",
    "currentEventId",
    "day",
    "lastEventTitle",
    "phase",
    "progressPosition"
  ].sort()),
  "Snapshot 欄位超出 Current State 範圍"
);
[
  "name",
  "origin",
  "idealSelf",
  "stats",
  "personality",
  "relationships",
  "body",
  "injury",
  "matchState",
  "careerValue",
  "flags",
  "memories"
].forEach(key => assert(!(key in initialSnapshot), `Snapshot 不應包含 ${key}`));

evaluate(context, `
  var __phase3DetachedSnapshot = CurrentStateBoundary.getSnapshot();
  __phase3DetachedSnapshot.chapter = "外部竄改";
  __phase3DetachedSnapshot.progressPosition.chapter2Step = 999;
`);
assert(
  evaluate(context, "player.chapter !== '外部竄改' && player.chapter2Step !== 999"),
  "getSnapshot() 暴露 mutable player reference"
);

const validRequestResult = parse(context, `CurrentStateBoundary.applyStateChangeRequest({
  source: "phase3-test",
  changes: {
    chapter: "少棒入門",
    day: 2,
    phase: "afternoon",
    completed: false,
    lastEventTitle: "邊界測試事件",
    progressPosition: { chapter2Step: 3 }
  }
})`);
assert(validRequestResult.ok, "合法 State Change Request 被拒絕");
assert(
  evaluate(context, `
    player.chapter === "少棒入門" &&
    player.day === 2 &&
    player.phase === "afternoon" &&
    player.completed === false &&
    player.lastEventTitle === "邊界測試事件" &&
    player.chapter2Step === 3
  `),
  "合法白名單欄位未完整更新"
);
assert(
  JSON.stringify(parse(context, "CurrentStateBoundary.getProgressPosition()")) ===
    JSON.stringify({ chapter2Step: 3 }),
  "getProgressPosition() 未限制為批准的最小 step"
);
assert(
  evaluate(context, "CurrentStateBoundary.getCurrentEventId() === getCurrentEventId()"),
  "目前事件 ID 讀取與既有 runtime 不一致"
);

const stateBeforeInvalid = evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())");
[
  `{ source: "bad", changes: { stats: 99 } }`,
  `{ source: "bad", changes: { day: 0 } }`,
  `{ source: "bad", changes: { day: 1.5 } }`,
  `{ source: "bad", changes: { completed: "yes" } }`,
  `{ source: "bad", changes: { phase: "" } }`,
  `{ source: "bad", changes: { progressPosition: { seasonStep: 2 } } }`,
  `{ source: "", changes: { day: 3 } }`,
  `{ source: "bad", changes: {} }`,
  `{ source: "bad", changes: { day: 3 }, extra: true }`,
  `null`
].forEach(requestSource => {
  const result = parse(context, `CurrentStateBoundary.applyStateChangeRequest(${requestSource})`);
  assert(!result.ok, `非法 Request 未被拒絕：${requestSource}`);
  assert(
    evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())") === stateBeforeInvalid,
    `非法 Request 破壞原子性：${requestSource}`
  );
});
assert(
  !evaluate(context, `
    (() => {
      const request = { source: "bad", changes: { day: 3 } };
      request.loop = request;
      return CurrentStateBoundary.validateStateChangeRequest(request).ok;
    })()
  `),
  "循環 Request 未被安全拒絕"
);

[
  `JSON.parse('{"source":"bad","changes":{"__proto__":{"polluted":true}}}')`,
  `JSON.parse('{"source":"bad","changes":{"constructor":{"polluted":true}}}')`,
  `JSON.parse('{"source":"bad","changes":{"progressPosition":{"prototype":1}}}')`
].forEach(requestSource => {
  const result = parse(context, `CurrentStateBoundary.applyStateChangeRequest(${requestSource})`);
  assert(!result.ok, "prototype pollution key 未被拒絕");
  assert(
    evaluate(context, "({}).polluted === undefined"),
    "prototype pollution 影響全域 Object prototype"
  );
});

const protectedBefore = evaluate(context, `JSON.stringify({
  identity: PlayerDataBoundary.getIdentity(),
  stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
  personality: player.personality,
  relationships: player.relationships,
  body: player.body,
  injury: { injury: player.injury, injuryDays: player.injuryDays },
  matchState: player.matchState,
  career: { careerExit: player.careerExit, careerValue: player.careerValue },
  flags: player.flags,
  memories: player.memories
})`);
const countersBefore = parse(context, `({
  document: __getDocumentAccesses(),
  render: __phase3RenderCount,
  transition: __phase3TransitionCount,
  save: __phase3SaveCount,
  timeout: window.__timeouts
})`);
const isolatedResult = parse(context, `CurrentStateBoundary.applyStateChangeRequest({
  source: "isolation-test",
  changes: { lastEventTitle: "只更新標題" }
})`);
assert(isolatedResult.ok, "隔離性測試 Request 套用失敗");
assert(
  evaluate(context, `JSON.stringify({
    identity: PlayerDataBoundary.getIdentity(),
    stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
    personality: player.personality,
    relationships: player.relationships,
    body: player.body,
    injury: { injury: player.injury, injuryDays: player.injuryDays },
    matchState: player.matchState,
    career: { careerExit: player.careerExit, careerValue: player.careerValue },
    flags: player.flags,
    memories: player.memories
  })`) === protectedBefore,
  "Boundary 修改了非 Current State 資料"
);
const countersAfter = parse(context, `({
  document: __getDocumentAccesses(),
  render: __phase3RenderCount,
  transition: __phase3TransitionCount,
  save: __phase3SaveCount,
  timeout: window.__timeouts
})`);
assert(
  JSON.stringify(countersAfter) === JSON.stringify(countersBefore),
  "Boundary 操作了 DOM、render、save、time 或 transition"
);

const idempotentRequest = `({
  source: "idempotent-test",
  changes: { day: 5, phase: "night", progressPosition: { chapter2Step: 4 } }
})`;
assert(parse(context, `CurrentStateBoundary.applyStateChangeRequest(${idempotentRequest})`).ok, "首次 Request 失敗");
const onceState = evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())");
assert(parse(context, `CurrentStateBoundary.applyStateChangeRequest(${idempotentRequest})`).ok, "重複 Request 失敗");
assert(
  evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())") === onceState,
  "相同絕對值 Request 造成重複累加"
);

const restorableSnapshot = parse(context, "CurrentStateBoundary.getSnapshot()");
evaluate(context, `CurrentStateBoundary.applyStateChangeRequest({
  source: "restore-preparation",
  changes: {
    chapter: "十歲暑假",
    day: 1,
    phase: "morning",
    completed: true,
    lastEventTitle: "已改變",
    progressPosition: { chapter2Step: 0 }
  }
})`);
const restoreResult = parse(
  context,
  `CurrentStateBoundary.restoreCurrentState(${JSON.stringify(restorableSnapshot)})`
);
assert(restoreResult.ok, "restoreCurrentState() 無法還原合法 Snapshot");
assert(
  evaluate(context, "JSON.stringify(CurrentStateBoundary.getSnapshot())") ===
    JSON.stringify(restorableSnapshot),
  "restoreCurrentState() 還原結果不一致"
);

function collectGoldenState(targetContext) {
  return parse(targetContext, `({
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
    flags: player.flags,
    stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
    relationships: player.relationships,
    time: { day: player.day, phase: player.phase },
    renderCount: __phase3RenderCount,
    transitionCount: __phase3TransitionCount,
    timeoutCount: window.__timeouts,
    isTransitioning
  })`);
}

function runGoldenFlow(legacy) {
  const golden = makeGameContext({ legacy });
  evaluate(golden.context, "selectedOrigin = 'understand'; selectedIdealSelf = '全能型'; createPlayer()");
  const afterFirstEvent = collectGoldenState(golden.context);
  const firstEventId = evaluate(golden.context, "getCurrentEventId()");
  evaluate(golden.context, `choose(${JSON.stringify(firstEventId)}, 0)`);
  return {
    afterFirstEvent,
    afterFirstChoice: collectGoldenState(golden.context)
  };
}

const legacyGolden = runGoldenFlow(true);
const boundaryGolden = runGoldenFlow(false);
assert(
  JSON.stringify(boundaryGolden.afterFirstEvent) === JSON.stringify(legacyGolden.afterFirstEvent),
  "Golden Flow 第一事件呈現與修改前不一致"
);
assert(
  JSON.stringify(boundaryGolden.afterFirstChoice) === JSON.stringify(legacyGolden.afterFirstChoice),
  "Golden Flow 第一選擇後與修改前不一致"
);
assert(
  boundaryGolden.afterFirstChoice.renderCount === 2 &&
    boundaryGolden.afterFirstChoice.transitionCount === 1 &&
    boundaryGolden.afterFirstChoice.timeoutCount === 1,
  "Golden Flow 發生雙重 render、step 或 transition"
);

const persistence = makeGameContext();
evaluate(persistence.context, `
  selectedOrigin = "belong";
  selectedIdealSelf = "團隊核心型";
  createPlayer();
  CurrentStateBoundary.applyStateChangeRequest({
    source: "save-round-trip",
    changes: {
      chapter: "十歲暑假",
      day: 2,
      phase: "afternoon",
      completed: false,
      progressPosition: { chapter2Step: 0 }
    }
  });
  showCurrentEvent();
`);
const beforeSave = evaluate(
  persistence.context,
  "JSON.stringify(CurrentStateBoundary.getSnapshot())"
);
evaluate(persistence.context, `
  saveGame();
  CurrentStateBoundary.applyStateChangeRequest({
    source: "save-round-trip-mutation",
    changes: { day: 7, phase: "night", completed: true }
  });
  loadGame();
`);
assert(
  evaluate(persistence.context, "JSON.stringify(CurrentStateBoundary.getSnapshot())") ===
    beforeSave,
  "Save → Load Current State Snapshot 不一致"
);

const bookmark = makeGameContext();
evaluate(bookmark.context, "loadTestBookmark('chapter2')");
assert(
  evaluate(bookmark.context, `
    player.chapter === "少棒入門" &&
    getCurrentEventId() === "chapter2_intro" &&
    player.lastEventTitle === getEvent(getCurrentEventId()).title
  `),
  "Debug bookmark 無法在 Boundary 載入後正常運作"
);

[
  "document.",
  "innerHTML",
  "localStorage",
  "showStory",
  "updateStatus",
  "choose(",
  "advanceAfterAction",
  "setTimeout",
  "player.stats",
  "player.relationships",
  "player.body",
  "player.matchState"
].forEach(token => assert(!boundarySource.includes(token), `Boundary Source Guard 命中：${token}`));

const showStorySource = scriptSource
  .slice(scriptSource.indexOf("function showStory(eventId)"), scriptSource.indexOf("function prepareMatchStateForEvent(eventId)"));
assert(
  !/player\.lastEventTitle\s*=/.test(showStorySource),
  "showStory() 仍直接寫入 player.lastEventTitle"
);
assert(
  showStorySource.includes("CurrentStateBoundary.applyStateChangeRequest"),
  "showStory() 未經 CurrentStateBoundary 寫入 lastEventTitle"
);

const playerIndex = indexSource.indexOf('<script src="player.js"></script>');
const boundaryIndex = indexSource.indexOf('<script src="current-state-boundary.js"></script>');
const timeBoundaryIndex = indexSource.indexOf('<script src="time-boundary.js"></script>');
const relationshipBoundaryIndex = indexSource.indexOf('<script src="relationship-boundary.js"></script>');
const dayCompletionIndex = indexSource.indexOf('<script src="day-completion-flow.js"></script>');
const decisionFlowIndex = indexSource.indexOf('<script src="decision-flow.js"></script>');
const relationshipFlowIndex = indexSource.indexOf('<script src="relationship-flow.js"></script>');
const storyIndex = indexSource.indexOf('<script src="story.js"></script>');
const scriptIndex = indexSource.indexOf('<script src="script.js"></script>');
const controllerIndex = indexSource.indexOf('<script src="application-controller.js"></script>');
assert(
    playerIndex >= 0 &&
    playerIndex < boundaryIndex &&
    boundaryIndex < timeBoundaryIndex &&
    timeBoundaryIndex < relationshipBoundaryIndex &&
    relationshipBoundaryIndex < decisionFlowIndex &&
    decisionFlowIndex < dayCompletionIndex &&
    dayCompletionIndex < relationshipFlowIndex &&
    relationshipFlowIndex < storyIndex &&
    storyIndex < scriptIndex &&
    scriptIndex < controllerIndex,
  "瀏覽器載入順序不符合 Phase 3～5 Boundary 契約"
);

console.log(`CurrentStateBoundary validations：${validations}`);
console.log("Golden Flow：修改前／修改後完全一致");
console.log("Save／Load Current State round-trip：通過");
console.log("Debug bookmark 與 Source Guard：通過");
console.log("Phase 3 Current State Ownership Boundary test passed.");
