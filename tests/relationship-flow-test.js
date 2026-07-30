const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const flowSource = fs.readFileSync(
  path.join(root, "relationship-flow.js"),
  "utf8"
);
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const controllerSource = fs.readFileSync(
  path.join(root, "application-controller.js"),
  "utf8"
);
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

const relationshipBranchStart = scriptSource.indexOf(
  "  if (relationshipContext) {"
);
const relationshipBranchEnd = scriptSource.indexOf(
  '  applyNestedEffects("positionAffinity"',
  relationshipBranchStart
);
if (relationshipBranchStart < 0 || relationshipBranchEnd < 0) {
  throw new Error("找不到 Phase 6 遷移分支");
}
const targetBranchSource = scriptSource.slice(
  relationshipBranchStart,
  relationshipBranchEnd
);
const migratedBranchOnly = targetBranchSource.slice(
  0,
  targetBranchSource.indexOf("\n  else {")
);
const legacyScriptSource =
  scriptSource.slice(0, relationshipBranchStart) +
  '  applyNestedEffects("relationships", choice.relationshipEffects);\n' +
  scriptSource.slice(relationshipBranchEnd);

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
    setAttribute() {},
    focus() {}
  };
}

function makeGameContext({ legacy = false, controller = false } = {}) {
  const nodes = new Map();
  const storage = new Map();
  let storageWrites = 0;
  const context = vm.createContext({
    console,
    alert() {},
    document: {
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, createNode(id));
        return nodes.get(id);
      },
      querySelectorAll() {
        return [];
      },
      querySelector() {
        return null;
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
    "story.js",
    "save.js"
  ].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
      filename: file
    });
  });
  vm.runInContext(legacy ? legacyScriptSource : scriptSource, context, {
    filename: legacy ? "script.phase6-baseline.js" : "script.js"
  });
  if (controller) {
    vm.runInContext(controllerSource, context, {
      filename: "application-controller.js"
    });
  }

  vm.runInContext(`
    var __phase6RenderCount = 0;
    var __phase6TransitionCount = 0;
    var __phase6OriginalShowCurrentEvent = showCurrentEvent;
    var __phase6OriginalAdvanceAfterAction = advanceAfterAction;
    showCurrentEvent = function() {
      __phase6RenderCount += 1;
      return __phase6OriginalShowCurrentEvent();
    };
    advanceAfterAction = function(context) {
      __phase6TransitionCount += 1;
      return __phase6OriginalAdvanceAfterAction(context);
    };
  `, context);

  return {
    context,
    nodes,
    storage,
    getStorageWrites: () => storageWrites
  };
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

const bundle = makeGameContext();
const context = bundle.context;
assert(
  evaluate(context, "typeof RelationshipFlow === 'object'"),
  "RelationshipFlow 必須存在"
);
[
  "createRelationshipContext",
  "validateRelationshipContext",
  "createRelationshipResult",
  "createRelationshipChangeRequest",
  "applyRelationshipResult"
].forEach(method => {
  assert(
    evaluate(context, `typeof RelationshipFlow.${method} === "function"`),
    `缺少 RelationshipFlow.${method}()`
  );
});

evaluate(context, `
  player = createInitialPlayer("RelationshipFlow測試");
  player.chapter = "少棒第一季";
  player.seasonStep = 0;
  player.relationships.coachTrust = 6;
`);
const contextResult = parse(
  context,
  `RelationshipFlow.createRelationshipContext("youth_season_intro",0)`
);
assert(contextResult.ok, "固定 Relationship Context 應建立成功");
assert(
  JSON.stringify(contextResult.context) ===
    JSON.stringify({ eventId: "youth_season_intro", choiceIndex: 0 }),
  "Relationship Context 格式錯誤"
);
assert(
  !Object.prototype.hasOwnProperty.call(contextResult.context, "player"),
  "Relationship Context 不得包含 player"
);
assert(
  !Object.prototype.hasOwnProperty.call(contextResult.context, "targetId"),
  "Relationship Context 不應提前包含 target"
);
evaluate(context, `
  var exposedRelationshipContext =
    RelationshipFlow.createRelationshipContext("youth_season_intro",0).context;
  try { exposedRelationshipContext.choiceIndex = 3; } catch (error) {}
`);
assert(
  evaluate(context, "exposedRelationshipContext.choiceIndex === 0"),
  "Relationship Context 必須凍結"
);

[
  ["其他選項", `RelationshipFlow.createRelationshipContext("youth_season_intro",1)`],
  ["其他事件", `RelationshipFlow.createRelationshipContext("chapter2_intro",0)`],
  ["負 choiceIndex", `RelationshipFlow.validateRelationshipContext({eventId:"youth_season_intro",choiceIndex:-1})`],
  ["未知欄位", `RelationshipFlow.validateRelationshipContext({eventId:"youth_season_intro",choiceIndex:0,player:{}})`],
  ["空物件", `RelationshipFlow.validateRelationshipContext({})`]
].forEach(([label, expression]) => {
  assert(!parse(context, expression).ok, `${label} Context 應被拒絕`);
});

const relationshipResult = parse(
  context,
  `RelationshipFlow.createRelationshipResult(
    {eventId:"youth_season_intro",choiceIndex:0},
    {targetId:"coachTrust",amount:1,previousValue:6}
  )`
);
assert(relationshipResult.ok, "Relationship Result 應建立成功");
assert(
  JSON.stringify(relationshipResult.relationshipResult) === JSON.stringify({
    source: {
      type: "decision",
      eventId: "youth_season_intro",
      choiceIndex: 0
    },
    relationshipChanges: [
      { targetId: "coachTrust", operation: "add", amount: 1 }
    ]
  }),
  "Relationship Result 格式錯誤"
);
assert(
  relationshipResult.relationshipResult.relationshipChanges.length === 1,
  "Relationship Result 只能有一項 change"
);
assert(
  evaluate(
    context,
    `(() => {
      const result = RelationshipFlow.createRelationshipResult(
        {eventId:"youth_season_intro",choiceIndex:0},
        {targetId:"coachTrust",amount:1,previousValue:6}
      ).relationshipResult;
      return Object.isFrozen(result) &&
        Object.isFrozen(result.source) &&
        Object.isFrozen(result.relationshipChanges) &&
        Object.isFrozen(result.relationshipChanges[0]);
    })()`
  ),
  "Relationship Result 必須完整凍結"
);

const changeRequest = parse(
  context,
  `RelationshipFlow.createRelationshipChangeRequest(
    ${JSON.stringify(relationshipResult.relationshipResult)}
  )`
);
assert(changeRequest.ok, "Relationship Change Request 應建立成功");
assert(
  JSON.stringify(changeRequest.request) === JSON.stringify({
    source: "decision:youth_season_intro:0",
    targetId: "coachTrust",
    operation: "add",
    amount: 1,
    expected: { currentValue: 6 }
  }),
  "Relationship Change Request 格式錯誤"
);

[
  ["錯誤 legacy target", `{targetId:"teammateBond",amount:1,previousValue:6}`],
  ["錯誤 legacy amount", `{targetId:"coachTrust",amount:2,previousValue:6}`],
  ["過期 previousValue", `{targetId:"coachTrust",amount:1,previousValue:5}`],
  ["未知 legacy 欄位", `{targetId:"coachTrust",amount:1,previousValue:6,extra:true}`]
].forEach(([label, outcome]) => {
  const result = parse(
    context,
    `RelationshipFlow.createRelationshipResult(
      {eventId:"youth_season_intro",choiceIndex:0},
      ${outcome}
    )`
  );
  assert(!result.ok, `${label} 應被拒絕`);
});

const invalidResult = parse(
  context,
  `RelationshipFlow.createRelationshipChangeRequest({
    source:{type:"decision",eventId:"youth_season_intro",choiceIndex:0},
    relationshipChanges:[
      {targetId:"coachTrust",operation:"add",amount:1},
      {targetId:"teammateBond",operation:"add",amount:1}
    ]
  })`
);
assert(!invalidResult.ok, "多項 relationship changes 應被拒絕");
const unknownResultField = parse(
  context,
  `RelationshipFlow.createRelationshipChangeRequest({
    source:{type:"decision",eventId:"youth_season_intro",choiceIndex:0},
    relationshipChanges:[
      {targetId:"coachTrust",operation:"add",amount:1,field:"trust"}
    ]
  })`
);
assert(!unknownResultField.ok, "未知 relationship field 應被拒絕");

const delegationCalls = [];
const delegationContext = vm.createContext({
  console,
  window: {},
  RelationshipBoundary: {
    getRelationship() {
      return 6;
    },
    applyRelationshipChangeRequest(request) {
      delegationCalls.push(request);
      return {
        ok: true,
        change: {
          targetId: request.targetId,
          previousValue: 6,
          amount: request.amount,
          nextValue: 7
        }
      };
    }
  }
});
vm.runInContext(`
  function getEvent(eventId) {
    return eventId === "youth_season_intro"
      ? { choices: [{ relationshipEffects: { coachTrust: 1 } }] }
      : null;
  }
`, delegationContext);
vm.runInContext(flowSource, delegationContext, {
  filename: "relationship-flow.js"
});
vm.runInContext(`
  var flowContext =
    RelationshipFlow.createRelationshipContext("youth_season_intro",0).context;
  var flowResult = RelationshipFlow.createRelationshipResult(
    flowContext,
    {targetId:"coachTrust",amount:1,previousValue:6}
  ).relationshipResult;
  RelationshipFlow.applyRelationshipResult(flowResult);
`, delegationContext);
assert(
  delegationCalls.length === 1,
  "applyRelationshipResult() 必須只委派 RelationshipBoundary 一次"
);
assert(
  JSON.stringify(delegationCalls[0]) ===
    JSON.stringify({
      source: "decision:youth_season_intro:0",
      targetId: "coachTrust",
      operation: "add",
      amount: 1,
      expected: { currentValue: 6 }
    }),
  "RelationshipFlow 委派 Request 錯誤"
);

function prepareGolden(targetContext) {
  evaluate(targetContext, `
    player = createInitialPlayer("GoldenRelationship");
    player.chapter = "少棒第一季";
    player.seasonStep = 0;
    player.day = 1;
    player.phase = "morning";
    player.relationships.coachTrust = 6;
    player.relationships.teammateBond = 2;
    player.relationships.rivalRespect = 3;
    player.relationships.rivalCompetition = 4;
    __phase6RenderCount = 0;
    __phase6TransitionCount = 0;
    window.__timeouts = 0;
  `);
}

function collectGolden(bundleToRead) {
  const targetContext = bundleToRead.context;
  return {
    runtime: parse(targetContext, `({
      eventId:"youth_season_intro",
      choiceIndex:0,
      relationships: RelationshipBoundary.getSnapshot(),
      chapter: player.chapter,
      day: player.day,
      phase: player.phase,
      seasonStep: player.seasonStep,
      currentEventId: getCurrentEventId(),
      stats: Object.fromEntries(Object.keys(statLabels).map(key => [key,player[key]])),
      skills: player.baseballSkills,
      personality: player.personality,
      flags: player.flags,
      memories: player.memories,
      body: player.body,
      matchState: player.matchState,
      isTransitioning
    })`),
    renderCount: evaluate(targetContext, "__phase6RenderCount"),
    transitionCount: evaluate(targetContext, "__phase6TransitionCount"),
    timeoutCount: evaluate(targetContext, "window.__timeouts"),
    effectMessage: bundleToRead.nodes.get("changeLog")?.innerHTML || "",
    story: bundleToRead.nodes.get("story")?.innerHTML || "",
    choices: bundleToRead.nodes.get("choices")?.innerHTML || "",
    storageWrites: bundleToRead.getStorageWrites()
  };
}

const migratedBundle = makeGameContext();
const legacyBundle = makeGameContext({ legacy: true });
prepareGolden(migratedBundle.context);
prepareGolden(legacyBundle.context);
evaluate(
  migratedBundle.context,
  `choose("youth_season_intro",0)`
);
evaluate(
  legacyBundle.context,
  `choose("youth_season_intro",0)`
);
const migratedGolden = collectGolden(migratedBundle);
const legacyGolden = collectGolden(legacyBundle);
assert(
  JSON.stringify(migratedGolden) === JSON.stringify(legacyGolden),
  "Golden Relationship Flow 與 legacy baseline 不一致"
);
assert(
  migratedGolden.runtime.relationships.coachTrust === 7,
  "目標教練信任應由 6 變成 7"
);
assert(
  migratedGolden.runtime.relationships.teammateBond === 2 &&
    migratedGolden.runtime.relationships.rivalRespect === 3 &&
    migratedGolden.runtime.relationships.rivalCompetition === 4,
  "非目標 relationship 不得改變"
);
assert(
  migratedGolden.runtime.seasonStep === 1 &&
    migratedGolden.runtime.currentEventId === "youth_position_trial",
  "事件推進應與舊流程一致"
);
assert(
  migratedGolden.renderCount === 1 &&
    migratedGolden.transitionCount === 1 &&
    migratedGolden.timeoutCount === 1,
  "render、transition、timeout 次數應與舊流程一致"
);
assert(
  migratedGolden.effectMessage === legacyGolden.effectMessage &&
    migratedGolden.effectMessage.length > 0,
  "effect message 應與舊流程一致"
);
assert(
  migratedGolden.storageWrites === 0,
  "Relationship Flow 不得自動存檔"
);

const controllerBundle = makeGameContext({ controller: true });
prepareGolden(controllerBundle.context);
const controllerResult = parse(
  controllerBundle.context,
  `ApplicationController.submitDecision("youth_season_intro",0)`
);
assert(controllerResult.ok, "ApplicationController 應繼續委派 choose()");
assert(
  evaluate(
    controllerBundle.context,
    "player.relationships.coachTrust === 7 && player.seasonStep === 1"
  ),
  "Controller 路徑應完成相同關係變化"
);

const saveBundle = makeGameContext();
prepareGolden(saveBundle.context);
evaluate(saveBundle.context, `choose("youth_season_intro",0)`);
assert(saveBundle.getStorageWrites() === 0, "選擇後不應 autosave");
evaluate(saveBundle.context, "saveGame()");
assert(saveBundle.getStorageWrites() === 1, "手動 saveGame() 應維持一次寫入");
evaluate(
  saveBundle.context,
  "player.relationships.coachTrust = 1; loadGame();"
);
assert(
  evaluate(saveBundle.context, "player.relationships.coachTrust === 7"),
  "Save → Load 應還原 migrated relationship"
);
assert(
  evaluate(saveBundle.context, "player.seasonStep === 1"),
  "Save → Load 應保留事件進度"
);

assert(
  !migratedBranchOnly.includes('applyNestedEffects("relationships"'),
  "遷移分支不得再呼叫 legacy relationship processor"
);
assert(
  !/player\.relationships(?:\.|\[)[^;\n]*(?:=|\+=|-=)/.test(migratedBranchOnly),
  "遷移分支不得直接寫入 player.relationships"
);
assert(
  scriptSource.includes(
    'applyNestedEffects("relationships", choice.relationshipEffects)'
  ),
  "未遷移選項必須保留 legacy relationship path"
);

[
  "document.",
  "innerHTML",
  "localStorage",
  "showStory",
  "showCurrentEvent",
  "updateStatus",
  "saveGame",
  "setTimeout",
  "player.relationships =",
  "player.stats",
  "player.flags",
  "player.memories",
  "player.body"
].forEach(token => {
  assert(!flowSource.includes(token), `RelationshipFlow Source Guard 命中：${token}`);
});
assert(!flowSource.includes("Math.random"), "RelationshipFlow 不得使用隨機");

const playerIndex = indexSource.indexOf('<script src="player.js"></script>');
const currentStateIndex = indexSource.indexOf(
  '<script src="current-state-boundary.js"></script>'
);
const timeIndex = indexSource.indexOf('<script src="time-boundary.js"></script>');
const relationshipBoundaryIndex = indexSource.indexOf(
  '<script src="relationship-boundary.js"></script>'
);
const decisionIndex = indexSource.indexOf('<script src="decision-flow.js"></script>');
const dayCompletionIndex = indexSource.indexOf(
  '<script src="day-completion-flow.js"></script>'
);
const relationshipFlowIndex = indexSource.indexOf(
  '<script src="relationship-flow.js"></script>'
);
const storyIndex = indexSource.indexOf('<script src="story.js"></script>');
const scriptIndex = indexSource.indexOf('<script src="script.js"></script>');
const controllerIndex = indexSource.indexOf(
  '<script src="application-controller.js"></script>'
);
assert(
  playerIndex >= 0 &&
    playerIndex < currentStateIndex &&
    currentStateIndex < timeIndex &&
    timeIndex < relationshipBoundaryIndex &&
    relationshipBoundaryIndex < decisionIndex &&
    decisionIndex < dayCompletionIndex &&
    dayCompletionIndex < relationshipFlowIndex &&
    relationshipFlowIndex < storyIndex &&
    storyIndex < scriptIndex &&
    scriptIndex < controllerIndex,
  "Phase 6 script 載入順序錯誤"
);

console.log(`RelationshipFlow validations：${validations}`);
console.log("Golden Relationship Flow：通過");
console.log("Save／Load、Controller、Source Guard：通過");
console.log("Phase 6 RelationshipFlow test passed.");
