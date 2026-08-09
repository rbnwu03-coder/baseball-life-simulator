const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const boundarySource = fs.readFileSync(
  path.join(root, "narrative-condition-boundary.js"),
  "utf8"
);
const flowSource = fs.readFileSync(
  path.join(root, "narrative-condition-flow.js"),
  "utf8"
);
const coachBoundarySource = fs.readFileSync(
  path.join(root, "coach-evaluation-boundary.js"),
  "utf8"
);
const coachFlowSource = fs.readFileSync(
  path.join(root, "coach-response-flow.js"),
  "utf8"
);
const storySource = fs.readFileSync(path.join(root, "story.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const saveSource = fs.readFileSync(path.join(root, "save.js"), "utf8");
const controllerSource = fs.readFileSync(
  path.join(root, "application-controller.js"),
  "utf8"
);
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

const migratedNarrativeBlock = `      const contextResult = NarrativeConditionFlow.createNarrativeContext(
        "high_school_scout_feedback"
      );
      if (!contextResult.ok) throw new Error(contextResult.error);
      const responseResult = NarrativeConditionFlow.resolveNarrativeCondition(
        contextResult.context
      );
      if (!responseResult.ok) throw new Error(responseResult.error);
      const narrativeResult =
        NarrativeConditionFlow.applyNarrativeCondition(responseResult);
      if (!narrativeResult.ok) throw new Error(narrativeResult.error);

      const evalText = narrativeResult.category === "recognized"`;
const legacyNarrativeBlock =
  `      const evalText = player.scoutEvaluation >= 3`;
if (!storySource.includes(migratedNarrativeBlock)) {
  throw new Error("找不到 Phase 9 high_school_scout_feedback 遷移區塊");
}
const legacyStorySource = storySource.replace(
  migratedNarrativeBlock,
  legacyNarrativeBlock
);

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
  let storageRemovals = 0;
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
        storageRemovals += 1;
        storage.delete(key);
      }
    },
    sessionStorage: {
      setItem() {
        throw new Error("Narrative Flow 不得寫入 sessionStorage");
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
    "narrative-condition-boundary.js",
    "decision-flow.js",
    "day-completion-flow.js",
    "relationship-flow.js",
    "coach-response-flow.js",
    "narrative-condition-flow.js",
    "career-spine-contract.js",
    "career-transition-runtime-resolver.js",
    "career-development-runtime-resolver.js",
    "career-save-admission.js",
    "npc.js",
    "coach.js",
    "rival.js"
  ].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
      filename: file
    });
  });
  vm.runInContext(legacy ? legacyStorySource : storySource, context, {
    filename: legacy ? "story.phase9-baseline.js" : "story.js"
  });
  vm.runInContext(saveSource, context, { filename: "save.js" });
  vm.runInContext(scriptSource, context, { filename: "script.js" });
  if (controller) {
    vm.runInContext(controllerSource, context, {
      filename: "application-controller.js"
    });
  }

  vm.runInContext(`
    var __phase9RenderCount = 0;
    var __phase9TransitionCount = 0;
    var __phase9OriginalShowStory = showStory;
    var __phase9OriginalAdvanceAfterAction = advanceAfterAction;
    showStory = function(eventId) {
      __phase9RenderCount += 1;
      return __phase9OriginalShowStory(eventId);
    };
    advanceAfterAction = function(context) {
      __phase9TransitionCount += 1;
      return __phase9OriginalAdvanceAfterAction(context);
    };
  `, context);

  return {
    context,
    nodes,
    storage,
    getStorageWrites: () => storageWrites,
    getStorageRemovals: () => storageRemovals
  };
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

function protectedState(context) {
  return parse(context, `({
    player: PlayerDataBoundary.getSnapshot(),
    scoutEvaluation: player.scoutEvaluation,
    relationships: player.relationships,
    stats: Object.fromEntries(
      Object.keys(statLabels).map(key => [key, player[key]])
    ),
    skills: player.baseballSkills,
    personality: player.personality,
    flags: player.flags,
    memories: player.memories,
    body: player.body,
    injury: {
      injuryRisk: player.body.injuryRisk,
      pain: player.body.pain
    },
    matchState: player.matchState,
    career: {
      careerValue: player.careerValue,
      roleIdentity: player.roleIdentity,
      careerArc: player.careerArc,
      exposure: player.exposure,
      scoutEvaluation: player.scoutEvaluation
    },
    chapter: player.chapter,
    highSchoolStep: player.highSchoolStep,
    day: player.day,
    phase: player.phase
  })`);
}

function prepareFeedback(context, scoutEvaluation) {
  evaluate(context, `
    player = createInitialPlayer("NarrativeFlow測試");
    player.chapter = "青棒";
    player.age = 16;
    player.highSchoolStep = 7;
    player.scoutEvaluation = ${scoutEvaluation};
    player.exposure = 2;
    player.body.fatigue = 2;
    player.body.injuryRisk = 1;
    player.relationships.coachTrust = 8;
    coach.trust = 0;
  `);
}

const bundle = makeGameContext();
const context = bundle.context;
assert(
  evaluate(context, "typeof NarrativeConditionFlow === 'object'"),
  "NarrativeConditionFlow 必須存在"
);
[
  "createNarrativeContext",
  "validateNarrativeContext",
  "createNarrativeEvaluationRequest",
  "resolveNarrativeCondition",
  "applyNarrativeCondition",
  "getSupportedEventMap"
].forEach(method => {
  assert(
    evaluate(context, `typeof NarrativeConditionFlow.${method} === "function"`),
    `缺少 NarrativeConditionFlow.${method}()`
  );
});

prepareFeedback(context, 3);
const contextResult = parse(
  context,
  `NarrativeConditionFlow.createNarrativeContext(
    "high_school_scout_feedback"
  )`
);
assert(contextResult.ok, "合法 Narrative Context 應建立成功");
assert(
  JSON.stringify(contextResult.context) ===
    JSON.stringify({ eventId: "high_school_scout_feedback" }),
  "Narrative Context 必須只包含 eventId"
);
assert(
  evaluate(
    context,
    `(() => {
      const value = NarrativeConditionFlow.createNarrativeContext(
        "high_school_scout_feedback"
      ).context;
      try { value.eventId = "high_school_showcase"; } catch (error) {}
      return Object.isFrozen(value) &&
        value.eventId === "high_school_scout_feedback" &&
        !("player" in value) &&
        !("event" in value) &&
        !("element" in value) &&
        !("callback" in value);
    })()`
  ),
  "Narrative Context 必須凍結且不得暴露 mutable object"
);

[
  [
    "空白 eventId",
    `NarrativeConditionFlow.createNarrativeContext("")`
  ],
  [
    "未支援 event",
    `NarrativeConditionFlow.createNarrativeContext("high_school_showcase")`
  ],
  [
    "未知 Context 欄位",
    `NarrativeConditionFlow.validateNarrativeContext({
      eventId:"high_school_scout_feedback",
      choiceIndex:null
    })`
  ],
  ["空 Context", `NarrativeConditionFlow.validateNarrativeContext({})`],
  ["非物件 Context", `NarrativeConditionFlow.validateNarrativeContext(null)`]
].forEach(([label, expression]) => {
  const before = protectedState(context);
  assert(!parse(context, expression).ok, `${label} 必須拒絕`);
  assert(
    JSON.stringify(protectedState(context)) === JSON.stringify(before),
    `${label} 不得修改 gameplay state`
  );
});

assert(
  evaluate(
    context,
    `(() => {
      const original = getEvent;
      getEvent = () => null;
      const result = NarrativeConditionFlow.validateNarrativeContext({
        eventId:"high_school_scout_feedback"
      });
      getEvent = original;
      return !result.ok;
    })()`
  ),
  "目標 story event 不存在時必須拒絕"
);
assert(
  evaluate(
    context,
    `(() => {
      const original = getEvent;
      getEvent = () => ({ title:"缺少 text" });
      const result = NarrativeConditionFlow.validateNarrativeContext({
        eventId:"high_school_scout_feedback"
      });
      getEvent = original;
      return !result.ok;
    })()`
  ),
  "event 無 text renderer 時必須拒絕"
);

const eventMap = parse(
  context,
  "NarrativeConditionFlow.getSupportedEventMap()"
);
assert(
  JSON.stringify(eventMap) ===
    JSON.stringify({
      high_school_scout_feedback:
        "narrative-condition:high_school_scout_feedback"
    }),
  "Narrative Event-to-Evaluation Mapping 錯誤"
);
assert(
  evaluate(
    context,
    `(() => {
      const map = NarrativeConditionFlow.getSupportedEventMap();
      try { map.high_school_scout_feedback = "wrong"; } catch (error) {}
      return Object.isFrozen(map) &&
        map.high_school_scout_feedback ===
          "narrative-condition:high_school_scout_feedback";
    })()`
  ),
  "Narrative event mapping 必須不可變"
);

const requestResult = parse(
  context,
  `NarrativeConditionFlow.createNarrativeEvaluationRequest({
    eventId:"high_school_scout_feedback"
  })`
);
assert(requestResult.ok, "Narrative Evaluation Request 應建立成功");
assert(
  JSON.stringify(requestResult.request) ===
    JSON.stringify({
      source: "event:high_school_scout_feedback",
      evaluationId:
        "narrative-condition:high_school_scout_feedback",
      context: {
        eventId: "high_school_scout_feedback"
      },
      expected: {
        scoutEvaluation: 3
      }
    }),
  "Narrative Evaluation Request 格式錯誤"
);
assert(
  evaluate(
    context,
    `Object.isFrozen(
      NarrativeConditionFlow.createNarrativeEvaluationRequest({
        eventId:"high_school_scout_feedback"
      }).request
    )`
  ),
  "Narrative Evaluation Request 必須凍結"
);

evaluate(context, `
  var __phase9BoundaryCalls = 0;
  var __phase9OriginalNarrativeBoundary = NarrativeConditionBoundary;
  NarrativeConditionBoundary = Object.freeze(Object.assign(
    {},
    __phase9OriginalNarrativeBoundary,
    {
      evaluateNarrativeCondition(request) {
        __phase9BoundaryCalls += 1;
        return __phase9OriginalNarrativeBoundary
          .evaluateNarrativeCondition(request);
      }
    }
  ));
`);
const delegated = parse(
  context,
  `NarrativeConditionFlow.resolveNarrativeCondition({
    eventId:"high_school_scout_feedback"
  })`
);
assert(
  delegated.ok &&
    delegated.response.category === "recognized" &&
    evaluate(context, "__phase9BoundaryCalls === 1"),
  "resolveNarrativeCondition() 必須且只能委派 Boundary 一次"
);
evaluate(
  context,
  "NarrativeConditionBoundary = __phase9OriginalNarrativeBoundary"
);

[
  [3, "recognized", ">="],
  [4, "recognized", ">="],
  [2, "uncertain", "<"],
  [0, "uncertain", "<"]
].forEach(([value, category, operator]) => {
  prepareFeedback(context, value);
  const before = protectedState(context);
  const result = parse(
    context,
    `NarrativeConditionFlow.resolveNarrativeCondition({
      eventId:"high_school_scout_feedback"
    })`
  );
  assert(result.ok, `scoutEvaluation ${value} 應成功 resolve`);
  assert(
    result.response.category === category &&
      result.response.matchedCondition.field === "scoutEvaluation" &&
      result.response.matchedCondition.operator === operator &&
      result.response.matchedCondition.value === 3,
    `scoutEvaluation ${value} category 或門檻錯誤`
  );
  const applied = parse(
    context,
    `NarrativeConditionFlow.applyNarrativeCondition(
      ${JSON.stringify(result)}
    )`
  );
  assert(
    JSON.stringify(applied) ===
      JSON.stringify({
        ok: true,
        responseId: "high_school_scout_feedback",
        category,
        routeType: "existing-narrative"
      }),
    `scoutEvaluation ${value} apply 結果錯誤`
  );
  assert(
    JSON.stringify(protectedState(context)) === JSON.stringify(before),
    `scoutEvaluation ${value} Flow 不得修改 gameplay state`
  );
});

const invalidResults = [
  ["空 Result", "null"],
  [
    "錯誤 category",
    `{ok:true,response:{evaluationId:"narrative-condition:high_school_scout_feedback",category:"wrong",responseId:"high_school_scout_feedback",routeType:"existing-narrative",matchedCondition:{field:"scoutEvaluation",operator:">=",value:3}}}`
  ],
  [
    "錯誤 responseId",
    `{ok:true,response:{evaluationId:"narrative-condition:high_school_scout_feedback",category:"recognized",responseId:"wrong",routeType:"existing-narrative",matchedCondition:{field:"scoutEvaluation",operator:">=",value:3}}}`
  ],
  [
    "錯誤 sourceField",
    `{ok:true,response:{evaluationId:"narrative-condition:high_school_scout_feedback",category:"recognized",responseId:"high_school_scout_feedback",routeType:"existing-narrative",matchedCondition:{field:"coachTrust",operator:">=",value:3}}}`
  ],
  [
    "錯誤 threshold",
    `{ok:true,response:{evaluationId:"narrative-condition:high_school_scout_feedback",category:"recognized",responseId:"high_school_scout_feedback",routeType:"existing-narrative",matchedCondition:{field:"scoutEvaluation",operator:">=",value:4}}}`
  ],
  [
    "未知 Result 欄位",
    `{ok:true,response:{evaluationId:"narrative-condition:high_school_scout_feedback",category:"recognized",responseId:"high_school_scout_feedback",routeType:"existing-narrative",matchedCondition:{field:"scoutEvaluation",operator:">=",value:3}},extra:true}`
  ]
];
invalidResults.forEach(([label, expression]) => {
  const before = protectedState(context);
  assert(
    !parse(
      context,
      `NarrativeConditionFlow.applyNarrativeCondition(${expression})`
    ).ok,
    `${label} 必須拒絕`
  );
  assert(
    JSON.stringify(protectedState(context)) === JSON.stringify(before),
    `${label} 不得修改 gameplay state`
  );
});

function collectGolden(bundle, initialText, initialChoices, repeatText) {
  return {
    initialText,
    repeatText,
    initialChoices,
    runtime: parse(bundle.context, `({
      eventId:"high_school_scout_feedback",
      choiceIndex:2,
      title:getEvent("high_school_scout_feedback").title,
      nextEvent:getCurrentEventId(),
      chapter:player.chapter,
      highSchoolStep:player.highSchoolStep,
      day:player.day,
      phase:player.phase,
      scoutEvaluation:player.scoutEvaluation,
      exposure:player.exposure,
      relationships:player.relationships,
      stats:Object.fromEntries(
        Object.keys(statLabels).map(key => [key,player[key]])
      ),
      skills:player.baseballSkills,
      personality:player.personality,
      flags:player.flags,
      memories:player.memories,
      body:player.body,
      injury:{injuryRisk:player.body.injuryRisk,pain:player.body.pain},
      matchState:player.matchState,
      career:{
        careerValue:player.careerValue,
        roleIdentity:player.roleIdentity,
        careerArc:player.careerArc,
        scoutEvaluation:player.scoutEvaluation,
        exposure:player.exposure
      }
    })`),
    story: bundle.nodes.get("story")?.innerHTML || "",
    choices: bundle.nodes.get("choices")?.innerHTML || "",
    changeLog: bundle.nodes.get("changeLog")?.innerHTML || "",
    renderCount: evaluate(bundle.context, "__phase9RenderCount"),
    transitionCount: evaluate(bundle.context, "__phase9TransitionCount"),
    timeoutCount: evaluate(bundle.context, "window.__timeouts"),
    storageWrites: bundle.getStorageWrites()
  };
}

function runGolden(scoutEvaluation) {
  const migrated = makeGameContext();
  const legacy = makeGameContext({ legacy: true });
  prepareFeedback(migrated.context, scoutEvaluation);
  prepareFeedback(legacy.context, scoutEvaluation);

  const migratedChoices = parse(
    migrated.context,
    `getEvent("high_school_scout_feedback").choices`
  );
  const legacyChoices = parse(
    legacy.context,
    `getEvent("high_school_scout_feedback").choices`
  );
  const beforeRepeated = protectedState(migrated.context);
  const migratedText = evaluate(
    migrated.context,
    `getEvent("high_school_scout_feedback").text()`
  );
  const repeatedText = evaluate(
    migrated.context,
    `getEvent("high_school_scout_feedback").text()`
  );
  assert(
    JSON.stringify(protectedState(migrated.context)) ===
      JSON.stringify(beforeRepeated),
    "text() 多次呼叫不得修改任何 gameplay state"
  );
  const legacyText = evaluate(
    legacy.context,
    `getEvent("high_school_scout_feedback").text()`
  );
  assert(
    migratedText === legacyText && repeatedText === migratedText,
    "多次 text() 與 legacy 完整文字必須一致"
  );

  evaluate(migrated.context, "showCurrentEvent()");
  evaluate(legacy.context, "showCurrentEvent()");
  const migratedInitial = migrated.nodes.get("story")?.innerHTML || "";
  const legacyInitial = legacy.nodes.get("story")?.innerHTML || "";
  assert(
    migratedInitial === legacyInitial,
    "初次 render 的完整 HTML 必須與 baseline 一致"
  );
  evaluate(
    migrated.context,
    `choose("high_school_scout_feedback",2)`
  );
  evaluate(legacy.context, `choose("high_school_scout_feedback",2)`);

  return {
    migrated: collectGolden(
      migrated,
      migratedInitial,
      migratedChoices,
      repeatedText
    ),
    legacy: collectGolden(
      legacy,
      legacyInitial,
      legacyChoices,
      legacyText
    )
  };
}

const highText =
  "球探透過教練留下一句話：『現在不是明星，但有可使用的位置價值。』";
const lowText =
  "球探的筆記沒有留下明確評語。教練只說，沒被否定不等於已經被看見。";
const fixedText = "你必須決定，下一年要用什麼方式提高自己的價值。";

const highGolden = runGolden(3);
assert(
  JSON.stringify(highGolden.migrated) === JSON.stringify(highGolden.legacy),
  "高評價 Golden Flow 與修改前 baseline 不一致"
);
assert(
  highGolden.migrated.initialText.includes(highText) &&
    highGolden.migrated.initialText.includes(fixedText) &&
    !highGolden.migrated.initialText.includes(lowText),
  "門檻值 3 必須只顯示原高評價正文"
);
assert(
  highGolden.migrated.runtime.nextEvent === "high_school_result" &&
    highGolden.migrated.runtime.chapter === "青棒第一年小結" &&
    highGolden.migrated.runtime.highSchoolStep === 8,
  "高評價 Golden Flow 下一事件、章節或 step 錯誤"
);
assert(
  highGolden.migrated.runtime.scoutEvaluation === 3,
  "Golden choice 不得修改 scoutEvaluation"
);

const lowGolden = runGolden(2);
assert(
  JSON.stringify(lowGolden.migrated) === JSON.stringify(lowGolden.legacy),
  "低評價 Golden Flow 與修改前 baseline 不一致"
);
assert(
  lowGolden.migrated.initialText.includes(lowText) &&
    lowGolden.migrated.initialText.includes(fixedText) &&
    !lowGolden.migrated.initialText.includes(highText),
  "門檻前一值 2 必須只顯示原低評價正文"
);
assert(
  lowGolden.migrated.runtime.nextEvent === "high_school_result" &&
    lowGolden.migrated.runtime.scoutEvaluation === 2,
  "低評價 Golden Flow 下一事件或 scoutEvaluation 錯誤"
);

const expectedChoiceTexts = [
  "繼續增加多位置與戰術價值",
  "集中打擊與身體能力，追求更高上限",
  "先確保健康與課業，不追逐一次評價"
];
assert(
  JSON.stringify(
    highGolden.migrated.initialChoices.map(choice => choice.text)
  ) === JSON.stringify(expectedChoiceTexts),
  "目標事件三個 choice 文字不得改變"
);
assert(
  JSON.stringify(highGolden.migrated.initialChoices) ===
    JSON.stringify(highGolden.legacy.initialChoices),
  "目標事件所有 choice effects 不得改變"
);
assert(
  highGolden.migrated.renderCount ===
      highGolden.legacy.renderCount &&
    highGolden.migrated.transitionCount ===
      highGolden.legacy.transitionCount &&
    highGolden.migrated.timeoutCount ===
      highGolden.legacy.timeoutCount &&
    highGolden.migrated.storageWrites === 0,
  "render、transition、timeout 或 autosave 次數必須與 baseline 相同"
);

const saveBundle = makeGameContext();
prepareFeedback(saveBundle.context, 3);
evaluate(saveBundle.context, "showCurrentEvent(); saveGame()");
assert(saveBundle.getStorageWrites() === 1, "手動 Save 應只寫入一次");
const savedText =
  saveBundle.storage.get("baseballLifeRpgSave") || "";
[
  "narrative-condition:high_school_scout_feedback",
  "recognized",
  "uncertain",
  "matchedCondition"
].forEach(token => {
  assert(
    !savedText.includes(token),
    `Derived Narrative Result 不得進入 Save：${token}`
  );
});
evaluate(saveBundle.context, `
  player.scoutEvaluation = 2;
  player.highSchoolStep = 7;
  showCurrentEvent();
`);
assert(
  (saveBundle.nodes.get("story")?.innerHTML || "").includes(lowText),
  "切換低評價狀態後應重新顯示原低評價正文"
);
evaluate(saveBundle.context, "loadGame()");
assert(
  evaluate(
    saveBundle.context,
    `player.scoutEvaluation === 3 &&
      player.highSchoolStep === 7 &&
      getCurrentEventId() === "high_school_scout_feedback"`
  ),
  "Load 必須還原正式 scoutEvaluation 與目標事件"
);
assert(
  (saveBundle.nodes.get("story")?.innerHTML || "").includes(highText),
  "Load 後必須依正式值重新評估高評價正文"
);
assert(
  saveBundle.getStorageWrites() === 1,
  "Load 及 Narrative Evaluation 不得新增 storage write"
);

const debugBundle = makeGameContext({ controller: true });
evaluate(
  debugBundle.context,
  `ApplicationController.loadTestBookmark("highSchool")`
);
assert(
  evaluate(
    debugBundle.context,
    `player.chapter === "青棒" &&
      player.highSchoolStep === 0 &&
      getCurrentEventId() === "high_school_intro"`
  ),
  "既有 highSchool Debug bookmark 必須保持原 fixture 與 route"
);
assert(
  debugBundle.getStorageWrites() === 0,
  "Debug bookmark 不得寫入正式 Save"
);
assert(
  !scriptSource.includes("highSchoolScoutFeedback"),
  "Phase 9 不得新增重複 Debug bookmark"
);

prepareFeedback(context, 3);
const phase7 = parse(
  context,
  `CoachResponseFlow.resolveCoachResponse({
    eventId:"youth_match_entry",
    choiceIndex:null
  })`
);
const phase8 = parse(
  context,
  `CoachResponseFlow.resolveCoachResponse({
    eventId:"high_school_showcase",
    choiceIndex:null
  })`
);
assert(
  phase7.ok &&
    phase7.response.category === "supportive" &&
    phase7.response.matchedCondition.value === 3,
  "Phase 7 Coach Response 必須維持"
);
assert(
  phase8.ok &&
    phase8.response.category === "early-opportunity" &&
    phase8.response.matchedCondition.value === 8,
  "Phase 8 Coach Response 必須維持"
);
assert(
  JSON.stringify(
    parse(context, "CoachEvaluationBoundary.getSupportedEvaluationIds()")
  ) ===
    JSON.stringify([
      "coach-trust-response:youth_match_entry",
      "coach-trust-response:high_school_showcase"
    ]),
  "Coach supported evaluation IDs 必須維持兩個"
);
assert(
  !coachBoundarySource.includes("scoutEvaluation") &&
    !coachFlowSource.includes("scoutEvaluation"),
  "Coach Boundary／Flow 不得接管 scoutEvaluation"
);
assert(
  !boundarySource.includes("coachTrust") &&
    !flowSource.includes("CoachResponseFlow") &&
    !flowSource.includes("coach-response-flow"),
  "Narrative Boundary／Flow 不得依賴 Coach Input 或 Coach Flow"
);
assert(
  !controllerSource.includes("NarrativeConditionFlow") &&
    !controllerSource.includes("NarrativeConditionBoundary"),
  "ApplicationController 不得接管 Narrative threshold 判定"
);

const targetStart = storySource.indexOf(
  "  high_school_scout_feedback: {"
);
const targetEnd = storySource.indexOf(
  "  high_school_result:",
  targetStart
);
const targetSource = storySource.slice(targetStart, targetEnd);
assert(
  !targetSource.includes("player.scoutEvaluation"),
  "目標 Runtime Path 不得直接讀取 player.scoutEvaluation"
);
assert(
  !targetSource.includes("scoutEvaluation >= 3"),
  "目標 Runtime Path 不得保留原 direct threshold"
);
assert(
  targetSource.includes(highText) &&
    targetSource.includes(lowText) &&
    targetSource.includes(fixedText),
  "完整故事文字必須仍由 story.js 持有"
);

const playerIndex = indexSource.indexOf('<script src="player.js"></script>');
const narrativeBoundaryIndex = indexSource.indexOf(
  '<script src="narrative-condition-boundary.js"></script>'
);
const narrativeFlowIndex = indexSource.indexOf(
  '<script src="narrative-condition-flow.js"></script>'
);
const storyIndex = indexSource.indexOf('<script src="story.js"></script>');
assert(
  playerIndex >= 0 &&
    playerIndex < narrativeBoundaryIndex &&
    narrativeBoundaryIndex < narrativeFlowIndex &&
    narrativeFlowIndex < storyIndex,
  "Narrative Boundary／Flow 瀏覽器載入順序錯誤"
);

[
  "document.",
  "innerHTML",
  "textContent =",
  "localStorage",
  "sessionStorage",
  "saveGame",
  "loadGame",
  "showStory",
  "showCurrentEvent",
  "updateStatus",
  "setTimeout",
  "setInterval",
  "Math.random",
  "player.scoutEvaluation =",
  "player.relationships",
  "player.stats",
  "player.skills",
  "player.personality",
  "player.flags",
  "player.memories",
  "player.body",
  "player.injury",
  "player.matchState",
  "player.career",
  "player.chapter =",
  "player.day =",
  "player.phase ="
].forEach(token => {
  assert(
    !boundarySource.includes(token),
    `NarrativeConditionBoundary Source Guard 命中：${token}`
  );
});
[
  "document.",
  "innerHTML",
  "localStorage",
  "sessionStorage",
  "saveGame",
  "loadGame",
  "setTimeout",
  "setInterval",
  "Math.random",
  "player.scoutEvaluation =",
  "player.relationships =",
  "player.stats",
  "player.skills",
  "player.body",
  "player.matchState",
  highText,
  lowText
].forEach(token => {
  assert(
    !flowSource.includes(token),
    `NarrativeConditionFlow Source Guard 命中：${token}`
  );
});

console.log(`NarrativeConditionFlow validations：${validations}`);
console.log("Golden Narrative Flow（高／低評價）、Save／Load 與 Coach 隔離：通過");
console.log("Phase 9 NarrativeConditionFlow test passed.");
