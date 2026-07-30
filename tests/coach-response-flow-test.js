const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const flowSource = fs.readFileSync(path.join(root, "coach-response-flow.js"), "utf8");
const storySource = fs.readFileSync(path.join(root, "story.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const controllerSource = fs.readFileSync(
  path.join(root, "application-controller.js"),
  "utf8"
);
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

const migratedCoachBlock = `      const contextResult = CoachResponseFlow.createCoachResponseContext(
        "youth_match_entry",
        null
      );
      if (!contextResult.ok) throw new Error(contextResult.error);
      const responseResult = CoachResponseFlow.resolveCoachResponse(
        contextResult.context
      );
      if (!responseResult.ok) throw new Error(responseResult.error);
      const narrativeResult = CoachResponseFlow.applyCoachResponse(
        responseResult
      );
      if (!narrativeResult.ok) throw new Error(narrativeResult.error);

`;
const migratedCondition = `      const call = narrativeResult.category === "supportive"`;
if (
  !storySource.includes(migratedCoachBlock) ||
  !storySource.includes(migratedCondition)
) {
  throw new Error("找不到 Phase 7 youth_match_entry 遷移區塊");
}
const legacyStorySource = storySource
  .replace(migratedCoachBlock, "      const trust = player.relationships.coachTrust;\n")
  .replace(migratedCondition, "      const call = trust >= 3");

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
    "npc.js",
    "coach.js",
    "rival.js"
  ].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
      filename: file
    });
  });
  vm.runInContext(legacy ? legacyStorySource : storySource, context, {
    filename: legacy ? "story.phase7-baseline.js" : "story.js"
  });
  vm.runInContext(fs.readFileSync(path.join(root, "save.js"), "utf8"), context, {
    filename: "save.js"
  });
  vm.runInContext(scriptSource, context, { filename: "script.js" });
  if (controller) {
    vm.runInContext(controllerSource, context, {
      filename: "application-controller.js"
    });
  }

  vm.runInContext(`
    var __phase7RenderCount = 0;
    var __phase7TransitionCount = 0;
    var __phase7OriginalShowStory = showStory;
    var __phase7OriginalAdvanceAfterAction = advanceAfterAction;
    showStory = function(eventId) {
      __phase7RenderCount += 1;
      return __phase7OriginalShowStory(eventId);
    };
    advanceAfterAction = function(context) {
      __phase7TransitionCount += 1;
      return __phase7OriginalAdvanceAfterAction(context);
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
  evaluate(context, "typeof CoachResponseFlow === 'object'"),
  "CoachResponseFlow 必須存在"
);
[
  "createCoachResponseContext",
  "validateCoachResponseContext",
  "createCoachEvaluationRequest",
  "resolveCoachResponse",
  "applyCoachResponse"
].forEach(method => {
  assert(
    evaluate(context, `typeof CoachResponseFlow.${method} === "function"`),
    `缺少 CoachResponseFlow.${method}()`
  );
});

evaluate(context, `
  player = createInitialPlayer("CoachResponseFlow測試");
  player.relationships.coachTrust = 7;
  coach.trust = 1;
`);
const contextResult = parse(
  context,
  `CoachResponseFlow.createCoachResponseContext("youth_match_entry",null)`
);
assert(contextResult.ok, "合法 Coach Response Context 應建立成功");
assert(
  JSON.stringify(contextResult.context) ===
    JSON.stringify({ eventId: "youth_match_entry", choiceIndex: null }),
  "Coach Response Context 格式錯誤"
);
assert(
  !Object.prototype.hasOwnProperty.call(contextResult.context, "player") &&
    !Object.prototype.hasOwnProperty.call(contextResult.context, "coach") &&
    !Object.prototype.hasOwnProperty.call(contextResult.context, "event"),
  "Context 不得暴露 mutable reference"
);
assert(
  evaluate(
    context,
    `(() => {
      const value = CoachResponseFlow.createCoachResponseContext(
        "youth_match_entry",
        null
      ).context;
      try { value.eventId = "youth_bench"; } catch (error) {}
      return Object.isFrozen(value) && value.eventId === "youth_match_entry";
    })()`
  ),
  "Context 必須凍結"
);

[
  ["非法 eventId", `CoachResponseFlow.createCoachResponseContext("youth_bench",null)`],
  ["不存在 eventId", `CoachResponseFlow.createCoachResponseContext("missing",null)`],
  ["非法 choiceIndex", `CoachResponseFlow.createCoachResponseContext("youth_match_entry",-1)`],
  ["非 choice 路徑夾帶 index", `CoachResponseFlow.createCoachResponseContext("youth_match_entry",0)`],
  ["未知欄位", `CoachResponseFlow.validateCoachResponseContext({eventId:"youth_match_entry",choiceIndex:null,player:{}})`],
  ["空 Context", `CoachResponseFlow.validateCoachResponseContext({})`]
].forEach(([label, expression]) => {
  assert(!parse(context, expression).ok, `${label} 應被拒絕`);
});

const request = parse(
  context,
  `CoachResponseFlow.createCoachEvaluationRequest({
    eventId:"youth_match_entry",
    choiceIndex:null
  })`
);
assert(request.ok, "Coach Evaluation Request 應建立成功");
assert(
  JSON.stringify(request.request) ===
    JSON.stringify({
      source: "event:youth_match_entry",
      evaluationId: "coach-trust-response:youth_match_entry",
      context: {
        eventId: "youth_match_entry",
        choiceIndex: null
      },
      expected: {
        coachTrust: 7
      }
    }),
  "Coach Evaluation Request 格式錯誤"
);

const resolved = parse(
  context,
  `CoachResponseFlow.resolveCoachResponse({
    eventId:"youth_match_entry",
    choiceIndex:null
  })`
);
assert(
  resolved.ok &&
    resolved.response.category === "supportive" &&
    resolved.response.responseId === "youth_match_entry" &&
    resolved.response.matchedCondition.value === 3,
  "Coach Response Resolution 未沿用既有門檻或 response ID"
);
const applied = parse(
  context,
  `CoachResponseFlow.applyCoachResponse(${JSON.stringify(resolved)})`
);
assert(
  JSON.stringify(applied) ===
    JSON.stringify({
      ok: true,
      responseId: "youth_match_entry",
      category: "supportive",
      routeType: "existing-narrative"
    }),
  "applyCoachResponse() 應只回傳既有 narrative hook"
);

const delegationCalls = [];
const delegationContext = vm.createContext({
  console,
  window: {},
  CoachEvaluationBoundary: {
    isSupportedEvaluation(id) {
      return id === "coach-trust-response:youth_match_entry";
    },
    getEvaluationSpecification(id) {
      return id === "coach-trust-response:youth_match_entry"
        ? {
            eventId: "youth_match_entry",
            threshold: 3,
            matchedCategory: "supportive",
            unmatchedCategory: "standard",
            responseId: "youth_match_entry",
            routeType: "existing-narrative"
          }
        : null;
    },
    getInputSnapshot() {
      return { relationships: { coachTrust: 7 } };
    },
    validateCoachEvaluationRequest(request) {
      return { ok: true, request };
    },
    evaluateCoachResponse(request) {
      delegationCalls.push(request);
      return {
        ok: true,
        response: {
          evaluationId: request.evaluationId,
          category: "supportive",
          responseId: "youth_match_entry",
          routeType: "existing-narrative",
          matchedCondition: {
            field: "coachTrust",
            operator: ">=",
            value: 3
          }
        }
      };
    }
  }
});
vm.runInContext(
  `function getEvent(id) {
    return id === "youth_match_entry"
      ? { text() { return "fixed"; }, choices: [] }
      : null;
  }`,
  delegationContext
);
vm.runInContext(flowSource, delegationContext, {
  filename: "coach-response-flow.js"
});
vm.runInContext(
  `CoachResponseFlow.resolveCoachResponse({
    eventId:"youth_match_entry",
    choiceIndex:null
  })`,
  delegationContext
);
assert(
  delegationCalls.length === 1,
  "同一 resolveCoachResponse() 必須只委派 Evaluation 一次"
);

function prepareGolden(targetContext, trust, mirror) {
  evaluate(targetContext, `
    player = createInitialPlayer("GoldenCoachResponse");
    player.name = "GoldenCoachResponse";
    player.chapter = "少棒第一季";
    player.seasonStep = 4;
    player.day = 1;
    player.phase = "morning";
    player.seasonPosition = "內野手";
    player.relationships.coachTrust = ${trust};
    player.relationships.teammateBond = 2;
    player.relationships.rivalRespect = 3;
    player.relationships.rivalCompetition = 4;
    coach.trust = ${mirror};
    __phase7RenderCount = 0;
    __phase7TransitionCount = 0;
    window.__timeouts = 0;
  `);
}

function collectGolden(targetBundle, initialStory, initialCoachMirror) {
  const targetContext = targetBundle.context;
  return {
    initialStory,
    initialCoachMirror,
    runtime: parse(targetContext, `({
      eventId:"youth_match_entry",
      choiceIndex:1,
      coachTrust: RelationshipBoundary.getRelationship("coachTrust"),
      coachMirror: coach.trust,
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
      relationships: RelationshipBoundary.getSnapshot(),
      body: player.body,
      matchState: player.matchState,
      career: {
        careerValue: player.careerValue,
        roleIdentity: player.roleIdentity,
        careerArc: player.careerArc
      }
    })`),
    renderCount: evaluate(targetContext, "__phase7RenderCount"),
    transitionCount: evaluate(targetContext, "__phase7TransitionCount"),
    timeoutCount: evaluate(targetContext, "window.__timeouts"),
    story: targetBundle.nodes.get("story")?.innerHTML || "",
    choices: targetBundle.nodes.get("choices")?.innerHTML || "",
    changeLog: targetBundle.nodes.get("changeLog")?.innerHTML || "",
    storageWrites: targetBundle.getStorageWrites()
  };
}

function runGolden(trust, mirror) {
  const migrated = makeGameContext();
  const legacy = makeGameContext({ legacy: true });
  prepareGolden(migrated.context, trust, mirror);
  prepareGolden(legacy.context, trust, mirror);

  evaluate(migrated.context, "showCurrentEvent()");
  evaluate(legacy.context, "showCurrentEvent()");
  const migratedInitial = migrated.nodes.get("story")?.innerHTML || "";
  const legacyInitial = legacy.nodes.get("story")?.innerHTML || "";
  const migratedInitialMirror = evaluate(migrated.context, "coach.trust");
  const legacyInitialMirror = evaluate(legacy.context, "coach.trust");
  evaluate(migrated.context, `choose("youth_match_entry",1)`);
  evaluate(legacy.context, `choose("youth_match_entry",1)`);

  return {
    migrated: collectGolden(migrated, migratedInitial, migratedInitialMirror),
    legacy: collectGolden(legacy, legacyInitial, legacyInitialMirror)
  };
}

const supportiveGolden = runGolden(7, 1);
assert(
  JSON.stringify(supportiveGolden.migrated) ===
    JSON.stringify(supportiveGolden.legacy),
  "高信任 Golden Coach Response Flow 與 legacy baseline 不一致"
);
assert(
  supportiveGolden.migrated.initialStory.includes(
    "山本教練沒有回頭，只朝你招手"
  ),
  "正式 coachTrust 7 應顯示原本高信任文本"
);
assert(
  supportiveGolden.migrated.runtime.coachTrust === 7 &&
    supportiveGolden.migrated.initialCoachMirror === 1,
  "Coach Evaluation 不得修改 coachTrust 或錯誤 mirror"
);
assert(
  supportiveGolden.migrated.runtime.seasonStep === 5 &&
    supportiveGolden.migrated.runtime.currentEventId === "youth_match_grounder",
  "Golden Flow 下一事件必須維持原本守位事件"
);
assert(
  supportiveGolden.migrated.renderCount === 2 &&
    supportiveGolden.migrated.transitionCount === 1 &&
    supportiveGolden.migrated.timeoutCount === 1,
  "Golden Flow render、transition、timeout 次數錯誤"
);
assert(
  supportiveGolden.migrated.storageWrites === 0,
  "Coach Response 不得 autosave"
);

const standardGolden = runGolden(2, 20);
assert(
  JSON.stringify(standardGolden.migrated) ===
    JSON.stringify(standardGolden.legacy),
  "低信任 Golden Coach Response Flow 與 legacy baseline 不一致"
);
assert(
  standardGolden.migrated.initialStory.includes(
    "這個機會來得比你預期突然"
  ),
  "正式 coachTrust 2 應顯示原本一般文本"
);
assert(
  standardGolden.migrated.runtime.coachTrust === 2 &&
    standardGolden.migrated.initialCoachMirror === 20,
  "低信任 Evaluation 不得採用或修正錯誤 mirror"
);

const saveBundle = makeGameContext();
prepareGolden(saveBundle.context, 7, 1);
evaluate(saveBundle.context, "saveGame()");
assert(saveBundle.getStorageWrites() === 1, "手動 Save 應維持一次寫入");
evaluate(
  saveBundle.context,
  "player.relationships.coachTrust = 2; coach.trust = 20; loadGame(); coach.trust = 1;"
);
const restoredResponse = parse(
  saveBundle.context,
  `CoachResponseFlow.resolveCoachResponse({
    eventId:"youth_match_entry",
    choiceIndex:null
  })`
);
assert(
  evaluate(saveBundle.context, "player.relationships.coachTrust === 7"),
  "Save → Load 必須還原正式 coachTrust"
);
assert(
  restoredResponse.ok && restoredResponse.response.category === "supportive",
  "Load 後重新 Evaluation 必須依存檔時 coachTrust"
);
assert(
  evaluate(saveBundle.context, "coach.trust === 1"),
  "重新 Evaluation 不得修正 mirror"
);

const debugBundle = makeGameContext({ controller: true });
evaluate(
  debugBundle.context,
  `ApplicationController.loadTestBookmark("firstMatch")`
);
assert(
  evaluate(debugBundle.context, "getCurrentEventId() === 'youth_match_entry'"),
  "firstMatch Debug bookmark 應進入指定 Coach Response"
);
evaluate(debugBundle.context, "coach.trust = 0; showCurrentEvent()");
assert(
  (debugBundle.nodes.get("story")?.innerHTML || "").includes(
    "山本教練沒有回頭，只朝你招手"
  ),
  "Debug bookmark 必須依正式 Relationship 值顯示回應"
);

const targetEventStart = storySource.indexOf("  youth_match_entry: {");
const targetEventEnd = storySource.indexOf("  youth_match_grounder:", targetEventStart);
const targetEventSource = storySource.slice(targetEventStart, targetEventEnd);
assert(
  !targetEventSource.includes("player.relationships.coachTrust"),
  "遷移 Coach Response path 不得直接讀正式 relationship store"
);
assert(
  !targetEventSource.includes("coach.trust"),
  "遷移 Coach Response path 不得以 coach mirror 判斷"
);

[
  "document.",
  "innerHTML",
  "localStorage",
  "saveGame",
  "setTimeout",
  "player.relationships =",
  "coach.trust =",
  "player.stats",
  "player.personality",
  "player.body",
  "player.matchState"
].forEach(token => {
  assert(!flowSource.includes(token), `CoachResponseFlow Source Guard 命中：${token}`);
});
assert(!flowSource.includes("Math.random"), "CoachResponseFlow 不得使用隨機");

const playerIndex = indexSource.indexOf('<script src="player.js"></script>');
const currentStateIndex = indexSource.indexOf(
  '<script src="current-state-boundary.js"></script>'
);
const timeIndex = indexSource.indexOf('<script src="time-boundary.js"></script>');
const relationshipIndex = indexSource.indexOf(
  '<script src="relationship-boundary.js"></script>'
);
const evaluationIndex = indexSource.indexOf(
  '<script src="coach-evaluation-boundary.js"></script>'
);
const decisionIndex = indexSource.indexOf('<script src="decision-flow.js"></script>');
const relationshipFlowIndex = indexSource.indexOf(
  '<script src="relationship-flow.js"></script>'
);
const coachFlowIndex = indexSource.indexOf(
  '<script src="coach-response-flow.js"></script>'
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
    timeIndex < relationshipIndex &&
    relationshipIndex < evaluationIndex &&
    evaluationIndex < decisionIndex &&
    decisionIndex < relationshipFlowIndex &&
    relationshipFlowIndex < coachFlowIndex &&
    coachFlowIndex < storyIndex &&
    storyIndex < scriptIndex &&
    scriptIndex < controllerIndex,
  "Phase 7 script 載入順序錯誤"
);

console.log(`CoachResponseFlow validations：${validations}`);
console.log("Golden Coach Response Flow（高／低信任與錯誤 mirror）：通過");
console.log("Save／Load、Debug、Source Guard 與既有 narrative：通過");
console.log("Phase 7 CoachResponseFlow test passed.");
