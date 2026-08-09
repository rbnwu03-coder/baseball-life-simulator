const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const boundarySource = fs.readFileSync(
  path.join(root, "coach-evaluation-boundary.js"),
  "utf8"
);
const flowSource = fs.readFileSync(
  path.join(root, "coach-response-flow.js"),
  "utf8"
);
const storySource = fs.readFileSync(path.join(root, "story.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const controllerSource = fs.readFileSync(
  path.join(root, "application-controller.js"),
  "utf8"
);

const migratedShowcaseBlock = `      const contextResult = CoachResponseFlow.createCoachResponseContext(
        "high_school_showcase",
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

      const chance = narrativeResult.category === "early-opportunity" ? "教練在第五局讓你上場，並在名單旁寫下你的兩個守位。" : "你直到第七局才被叫去熱身。看台上的球探已收起一部分資料，但還沒有離開。";`;
const legacyShowcaseBlock =
  `      const chance = player.relationships.coachTrust >= 8 ? "教練在第五局讓你上場，並在名單旁寫下你的兩個守位。" : "你直到第七局才被叫去熱身。看台上的球探已收起一部分資料，但還沒有離開。";`;

if (!storySource.includes(migratedShowcaseBlock)) {
  throw new Error("找不到 Phase 8 high_school_showcase 遷移區塊");
}
const legacyStorySource = storySource.replace(
  migratedShowcaseBlock,
  legacyShowcaseBlock
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
    filename: legacy ? "story.phase8-baseline.js" : "story.js"
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
  vm.runInContext(
    `
      var __phase8RenderCount = 0;
      var __phase8TransitionCount = 0;
      var __phase8OriginalShowStory = showStory;
      var __phase8OriginalAdvanceAfterAction = advanceAfterAction;
      showStory = function(eventId) {
        __phase8RenderCount += 1;
        return __phase8OriginalShowStory(eventId);
      };
      advanceAfterAction = function(context) {
        __phase8TransitionCount += 1;
        return __phase8OriginalAdvanceAfterAction(context);
      };
    `,
    context
  );

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

function prepareShowcase(context, trust, mirror) {
  evaluate(
    context,
    `
      player = createInitialPlayer("Phase8展示賽");
      player.name = "Phase8展示賽";
      player.chapter = "青棒";
      player.age = 16;
      player.day = 1;
      player.phase = "morning";
      player.highSchoolStep = 6;
      player.highSchoolRoute = "普通高中・穩定出賽";
      player.seasonPosition = "內野手";
      player.secondaryPosition = "外野手";
      player.exposure = 2;
      player.scoutEvaluation = 1;
      player.relationships.coachTrust = ${trust};
      player.relationships.teammateBond = 4;
      player.relationships.rivalRespect = 3;
      player.relationships.rivalCompetition = 2;
      coach.trust = ${mirror};
      __phase8RenderCount = 0;
      __phase8TransitionCount = 0;
      window.__timeouts = 0;
    `
  );
}

function protectedState(context) {
  return parse(
    context,
    `({
      player,
      formalRelationships: RelationshipBoundary.getSnapshot(),
      coachMirror: coach.trust
    })`
  );
}

const unit = makeGameContext();
const context = unit.context;

const supportedIds = parse(
  context,
  "CoachEvaluationBoundary.getSupportedEvaluationIds()"
);
assert(supportedIds.length === 2, "Phase 8 應支援兩個 evaluation");
assert(
  supportedIds.includes("coach-trust-response:youth_match_entry"),
  "Phase 7 evaluation 不得消失"
);
assert(
  supportedIds.includes("coach-trust-response:high_school_showcase"),
  "Phase 8 evaluation 必須存在"
);
assert(
  evaluate(
    context,
    `CoachEvaluationBoundary.isSupportedEvaluation(
      "coach-trust-response:high_school_showcase"
    )`
  ),
  "isSupportedEvaluation() 必須辨識展示賽 evaluation"
);

const youthSpec = parse(
  context,
  `CoachEvaluationBoundary.getEvaluationSpecification(
    "coach-trust-response:youth_match_entry"
  )`
);
const showcaseSpec = parse(
  context,
  `CoachEvaluationBoundary.getEvaluationSpecification(
    "coach-trust-response:high_school_showcase"
  )`
);
assert(youthSpec.threshold === 3, "Phase 7 threshold 必須維持 3");
assert(showcaseSpec.threshold === 8, "展示賽 threshold 必須為 8");
assert(
  showcaseSpec.eventId === "high_school_showcase" &&
    showcaseSpec.matchedCategory === "early-opportunity" &&
    showcaseSpec.unmatchedCategory === "late-opportunity" &&
    showcaseSpec.responseId === "high_school_showcase" &&
    showcaseSpec.routeType === "existing-narrative",
  "展示賽 evaluation specification 錯誤"
);
assert(
  evaluate(
    context,
    `(() => {
      const specification = CoachEvaluationBoundary.getEvaluationSpecification(
        "coach-trust-response:high_school_showcase"
      );
      try { specification.threshold = 1; } catch (error) {}
      const fresh = CoachEvaluationBoundary.getEvaluationSpecification(
        "coach-trust-response:high_school_showcase"
      );
      return Object.isFrozen(specification) &&
        specification.threshold === 8 &&
        fresh.threshold === 8;
    })()`
  ),
  "外部不得修改 evaluation specification"
);
assert(
  evaluate(
    context,
    `CoachEvaluationBoundary.getEvaluationSpecification("missing") === null`
  ),
  "未知 evaluation 不得取得 specification"
);

const eventMap = parse(context, "CoachResponseFlow.getSupportedEventMap()");
assert(
  JSON.stringify(eventMap) ===
    JSON.stringify({
      youth_match_entry: "coach-trust-response:youth_match_entry",
      high_school_showcase:
        "coach-trust-response:high_school_showcase"
    }),
  "CoachResponseFlow event mapping 錯誤"
);
assert(
  evaluate(
    context,
    `(() => {
      const map = CoachResponseFlow.getSupportedEventMap();
      try { map.high_school_showcase = "wrong"; } catch (error) {}
      return Object.isFrozen(map) &&
        map.high_school_showcase ===
          "coach-trust-response:high_school_showcase";
    })()`
  ),
  "CoachResponseFlow event mapping 必須不可變"
);

const showcaseContext = parse(
  context,
  `CoachResponseFlow.createCoachResponseContext(
    "high_school_showcase",
    null
  )`
);
assert(showcaseContext.ok, "展示賽 Context 應可建立");
assert(
  JSON.stringify(showcaseContext.context) ===
    JSON.stringify({
      eventId: "high_school_showcase",
      choiceIndex: null
    }),
  "展示賽 Context 格式錯誤"
);
assert(
  evaluate(
    context,
    `Object.isFrozen(
      CoachResponseFlow.createCoachResponseContext(
        "high_school_showcase",
        null
      ).context
    )`
  ),
  "展示賽 Context 必須 freeze"
);
assert(
  !parse(
    context,
    `CoachResponseFlow.createCoachResponseContext(
      "high_school_showcase",
      0
    )`
  ).ok,
  "展示賽 choiceIndex 必須為 null"
);
assert(
  !parse(
    context,
    `CoachResponseFlow.createCoachResponseContext("high_school_intro",null)`
  ).ok,
  "未支援 eventId 必須拒絕"
);

prepareShowcase(context, 8, 0);
const requestResult = parse(
  context,
  `CoachResponseFlow.createCoachEvaluationRequest({
    eventId:"high_school_showcase",
    choiceIndex:null
  })`
);
assert(requestResult.ok, "展示賽 Evaluation Request 應建立成功");
assert(
  JSON.stringify(requestResult.request) ===
    JSON.stringify({
      source: "event:high_school_showcase",
      evaluationId: "coach-trust-response:high_school_showcase",
      context: {
        eventId: "high_school_showcase",
        choiceIndex: null
      },
      expected: {
        coachTrust: 8
      }
    }),
  "展示賽 Evaluation Request 格式錯誤"
);

const invalidRequests = [
  {
    label: "event 與 evaluation mismatch",
    request: {
      source: "event:youth_match_entry",
      evaluationId: "coach-trust-response:high_school_showcase",
      context: { eventId: "youth_match_entry", choiceIndex: null },
      expected: { coachTrust: 8 }
    }
  },
  {
    label: "反向 event 與 evaluation mismatch",
    request: {
      source: "event:high_school_showcase",
      evaluationId: "coach-trust-response:youth_match_entry",
      context: { eventId: "high_school_showcase", choiceIndex: null },
      expected: { coachTrust: 8 }
    }
  },
  {
    label: "source mismatch",
    request: {
      source: "event:youth_match_entry",
      evaluationId: "coach-trust-response:high_school_showcase",
      context: { eventId: "high_school_showcase", choiceIndex: null },
      expected: { coachTrust: 8 }
    }
  },
  {
    label: "stale expected",
    request: {
      source: "event:high_school_showcase",
      evaluationId: "coach-trust-response:high_school_showcase",
      context: { eventId: "high_school_showcase", choiceIndex: null },
      expected: { coachTrust: 7 }
    }
  },
  {
    label: "未知欄位",
    request: {
      source: "event:high_school_showcase",
      evaluationId: "coach-trust-response:high_school_showcase",
      context: { eventId: "high_school_showcase", choiceIndex: null },
      expected: { coachTrust: 8 },
      extra: true
    }
  }
];
invalidRequests.forEach(({ label, request }) => {
  const before = protectedState(context);
  const result = parse(
    context,
    `CoachEvaluationBoundary.validateCoachEvaluationRequest(
      ${JSON.stringify(request)}
    )`
  );
  assert(!result.ok, `${label} 必須拒絕`);
  assert(
    JSON.stringify(protectedState(context)) === JSON.stringify(before),
    `${label} 不得修改 gameplay state`
  );
});

const polluted = parse(
  context,
  `CoachEvaluationBoundary.validateCoachEvaluationRequest(
    JSON.parse(
      '{"source":"event:high_school_showcase","evaluationId":"coach-trust-response:high_school_showcase","context":{"eventId":"high_school_showcase","choiceIndex":null},"expected":{"coachTrust":8},"constructor":{}}'
    )
  )`
);
assert(!polluted.ok, "prototype pollution 必須拒絕");
const circularRejected = evaluate(
  context,
  `(() => {
    const request = {
      source:"event:high_school_showcase",
      evaluationId:"coach-trust-response:high_school_showcase",
      context:{eventId:"high_school_showcase",choiceIndex:null},
      expected:{coachTrust:8}
    };
    request.loop = request;
    return !CoachEvaluationBoundary.validateCoachEvaluationRequest(request).ok;
  })()`
);
assert(circularRejected, "循環資料必須拒絕");

function evaluateShowcase(trust, mirror) {
  prepareShowcase(context, trust, mirror);
  const before = protectedState(context);
  const result = parse(
    context,
    `CoachResponseFlow.resolveCoachResponse({
      eventId:"high_school_showcase",
      choiceIndex:null
    })`
  );
  const after = protectedState(context);
  return { result, before, after };
}

[
  [8, 0, "early-opportunity", ">="],
  [9, 0, "early-opportunity", ">="],
  [7, 20, "late-opportunity", "<"],
  [0, 20, "late-opportunity", "<"],
  [20, 0, "early-opportunity", ">="]
].forEach(([trust, mirror, category, operator]) => {
  const outcome = evaluateShowcase(trust, mirror);
  assert(outcome.result.ok, `coachTrust ${trust} 應成功評估`);
  assert(
    outcome.result.response.category === category,
    `coachTrust ${trust} category 錯誤`
  );
  assert(
    outcome.result.response.evaluationId ===
      "coach-trust-response:high_school_showcase" &&
      outcome.result.response.responseId === "high_school_showcase" &&
      outcome.result.response.routeType === "existing-narrative",
    `coachTrust ${trust} Result identity 錯誤`
  );
  assert(
    outcome.result.response.matchedCondition.field === "coachTrust" &&
      outcome.result.response.matchedCondition.operator === operator &&
      outcome.result.response.matchedCondition.value === 8,
    `coachTrust ${trust} threshold operator 錯誤`
  );
  assert(
    JSON.stringify(outcome.after) === JSON.stringify(outcome.before),
    `coachTrust ${trust} Evaluation 必須保持純度`
  );
  assert(
    outcome.after.coachMirror === mirror,
    `coachTrust ${trust} 不得修正錯誤 mirror`
  );
});
assert(
  Object.values(unit.context.window).filter(value => typeof value === "number")
    .every(value => value === 0),
  "Evaluation 不得排程 timeout"
);
assert(unit.getStorageWrites() === 0, "Evaluation 不得操作 storage");

function collectGolden(bundle, initialStory, initialMirror, initialChoices) {
  return {
    initialStory,
    initialMirror,
    initialChoices,
    runtime: parse(
      bundle.context,
      `({
        eventId:"high_school_showcase",
        choiceIndex:0,
        title:getEvent("high_school_showcase").title,
        nextEvent:getCurrentEventId(),
        chapter:player.chapter,
        highSchoolStep:player.highSchoolStep,
        day:player.day,
        phase:player.phase,
        coachTrust:RelationshipBoundary.getRelationship("coachTrust"),
        relationships:RelationshipBoundary.getSnapshot(),
        coachMirror:coach.trust,
        stats:Object.fromEntries(
          Object.keys(statLabels).map(key => [key,player[key]])
        ),
        skills:player.baseballSkills,
        personality:player.personality,
        flags:player.flags,
        memories:player.memories,
        body:player.body,
        matchState:player.matchState,
        seasonPerformance:player.seasonPerformance,
        seasonErrors:player.seasonErrors,
        exposure:player.exposure,
        scoutEvaluation:player.scoutEvaluation
      })`
    ),
    story: bundle.nodes.get("story")?.innerHTML || "",
    choices: bundle.nodes.get("choices")?.innerHTML || "",
    changeLog: bundle.nodes.get("changeLog")?.innerHTML || "",
    renderCount: evaluate(bundle.context, "__phase8RenderCount"),
    transitionCount: evaluate(bundle.context, "__phase8TransitionCount"),
    timeoutCount: evaluate(bundle.context, "window.__timeouts"),
    storageWrites: bundle.getStorageWrites()
  };
}

function runGolden(trust, mirror) {
  const migrated = makeGameContext();
  const legacy = makeGameContext({ legacy: true });
  prepareShowcase(migrated.context, trust, mirror);
  prepareShowcase(legacy.context, trust, mirror);

  const migratedChoices = parse(
    migrated.context,
    `getEvent("high_school_showcase").choices`
  );
  const legacyChoices = parse(
    legacy.context,
    `getEvent("high_school_showcase").choices`
  );
  evaluate(migrated.context, "showCurrentEvent()");
  evaluate(legacy.context, "showCurrentEvent()");
  const migratedInitial = migrated.nodes.get("story")?.innerHTML || "";
  const legacyInitial = legacy.nodes.get("story")?.innerHTML || "";
  const migratedMirror = evaluate(migrated.context, "coach.trust");
  const legacyMirror = evaluate(legacy.context, "coach.trust");
  evaluate(migrated.context, `choose("high_school_showcase",0)`);
  evaluate(legacy.context, `choose("high_school_showcase",0)`);

  return {
    migrated: collectGolden(
      migrated,
      migratedInitial,
      migratedMirror,
      migratedChoices
    ),
    legacy: collectGolden(
      legacy,
      legacyInitial,
      legacyMirror,
      legacyChoices
    )
  };
}

const highGolden = runGolden(8, 0);
assert(
  JSON.stringify(highGolden.migrated) === JSON.stringify(highGolden.legacy),
  "高信任 Golden High School Showcase Flow 與 baseline 不一致"
);
assert(
  highGolden.migrated.initialStory.includes(
    "教練在第五局讓你上場，並在名單旁寫下你的兩個守位。"
  ),
  "正式 coachTrust 8 應顯示原高信任文字"
);
assert(
  !highGolden.migrated.initialStory.includes(
    "你直到第七局才被叫去熱身。"
  ),
  "高信任不得同時顯示低信任文字"
);
assert(
  highGolden.migrated.runtime.nextEvent === "high_school_scout_feedback" &&
    highGolden.migrated.runtime.highSchoolStep === 7,
  "高信任 Golden Flow 下一事件或 step 錯誤"
);
assert(
  highGolden.migrated.runtime.exposure === 3 &&
    highGolden.migrated.runtime.scoutEvaluation === 3 &&
    highGolden.migrated.runtime.seasonPerformance === 2 &&
    highGolden.migrated.runtime.seasonErrors === 0,
  "固定 choice effects 必須且只能套用一次"
);
assert(
  highGolden.migrated.renderCount === 2 &&
    highGolden.migrated.transitionCount === 1 &&
    highGolden.migrated.timeoutCount === 1 &&
    highGolden.migrated.storageWrites === 0,
  "高信任 render、transition、timeout 或 autosave 次數錯誤"
);

const lowGolden = runGolden(7, 20);
assert(
  JSON.stringify(lowGolden.migrated) === JSON.stringify(lowGolden.legacy),
  "低信任 Golden High School Showcase Flow 與 baseline 不一致"
);
assert(
  lowGolden.migrated.initialStory.includes(
    "你直到第七局才被叫去熱身。看台上的球探已收起一部分資料，但還沒有離開。"
  ),
  "正式 coachTrust 7 應顯示原低信任文字"
);
assert(
  !lowGolden.migrated.initialStory.includes(
    "教練在第五局讓你上場"
  ),
  "低信任不得錯誤顯示高信任文字"
);
assert(
  lowGolden.migrated.runtime.nextEvent === "high_school_scout_feedback" &&
    lowGolden.migrated.runtime.coachTrust === 7,
  "低信任 Golden Flow 下一事件或正式信任值錯誤"
);

const expectedChoiceTexts = [
  "完成球隊任務，不改變平常打法",
  "主動展現守位最醒目的工具",
  "用站位與指揮展現理解力"
];
assert(
  JSON.stringify(
    highGolden.migrated.initialChoices.map(choice => choice.text)
  ) === JSON.stringify(expectedChoiceTexts),
  "展示賽三個 choice 文字不得改變"
);
assert(
  JSON.stringify(highGolden.migrated.initialChoices) ===
    JSON.stringify(highGolden.legacy.initialChoices),
  "展示賽三個 choice effects 不得改變"
);
assert(
  highGolden.migrated.initialStory.includes(
    "秋季交流賽，看台後方坐著一名拿測速槍與筆記本的人。"
  ) &&
    highGolden.migrated.initialStory.includes(
      "這可能只是普通觀察，也可能是你第一次被棒球市場看見。"
    ),
  "展示賽固定正文不得改變"
);

const saveBundle = makeGameContext();
prepareShowcase(saveBundle.context, 8, 0);
evaluate(saveBundle.context, "showCurrentEvent(); saveGame()");
assert(saveBundle.getStorageWrites() === 1, "手動 Save 應只寫入一次");
const savedText = saveBundle.storage.get("baseballLifeRpgSave") || "";
assert(
  !savedText.includes("early-opportunity") &&
    !savedText.includes("late-opportunity") &&
    !savedText.includes("coach-trust-response:high_school_showcase"),
  "Derived Coach Response 不得進入 Save"
);
evaluate(
  saveBundle.context,
  `
    player.relationships.coachTrust = 7;
    coach.trust = 20;
    player.highSchoolStep = 6;
    showCurrentEvent();
  `
);
assert(
  (saveBundle.nodes.get("story")?.innerHTML || "").includes(
    "你直到第七局才被叫去熱身。"
  ),
  "切換低信任狀態後應重新顯示低信任文字"
);
evaluate(saveBundle.context, "loadGame(); coach.trust = 0;");
assert(
  evaluate(
    saveBundle.context,
    "player.relationships.coachTrust === 8 && player.highSchoolStep === 6"
  ),
  "Load 必須還原展示賽正式信任與 step"
);
assert(
  (saveBundle.nodes.get("story")?.innerHTML || "").includes(
    "教練在第五局讓你上場，並在名單旁寫下你的兩個守位。"
  ),
  "Load 後必須依還原的正式信任重新評估"
);
assert(
  evaluate(saveBundle.context, "coach.trust === 0"),
  "Load 後重新 Evaluation 不得修正 mirror"
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
  !scriptSource.includes("highSchoolShowcase"),
  "Phase 8 不得偷偷新增展示賽 Debug bookmark"
);

prepareShowcase(context, 7, 20);
const phase7High = parse(
  context,
  `(() => {
    player.relationships.coachTrust = 7;
    coach.trust = 1;
    return CoachResponseFlow.resolveCoachResponse({
      eventId:"youth_match_entry",
      choiceIndex:null
    });
  })()`
);
const phase7Low = parse(
  context,
  `(() => {
    player.relationships.coachTrust = 2;
    coach.trust = 20;
    return CoachResponseFlow.resolveCoachResponse({
      eventId:"youth_match_entry",
      choiceIndex:null
    });
  })()`
);
assert(
  phase7High.response.category === "supportive" &&
    phase7High.response.matchedCondition.value === 3,
  "Phase 7 高信任 flow 必須維持"
);
assert(
  phase7Low.response.category === "standard" &&
    phase7Low.response.matchedCondition.value === 3,
  "Phase 7 低信任 flow 必須維持"
);

const targetStart = storySource.indexOf("  high_school_showcase: {");
const targetEnd = storySource.indexOf(
  "  high_school_scout_feedback:",
  targetStart
);
const targetSource = storySource.slice(targetStart, targetEnd);
assert(
  !targetSource.includes("player.relationships.coachTrust"),
  "展示賽目標路徑不得直接讀正式 relationship store"
);
assert(
  !targetSource.includes("coach.trust"),
  "展示賽目標路徑不得使用 coach mirror"
);

[
  "document.",
  "innerHTML",
  "localStorage",
  "sessionStorage",
  "showStory",
  "showCurrentEvent",
  "updateStatus",
  "saveGame",
  "loadGame",
  "setTimeout",
  "setInterval",
  "Math.random",
  "player.relationships =",
  "coach.trust =",
  "player.stats",
  "player.skills",
  "player.personality",
  "player.flags",
  "player.memories",
  "player.body",
  "player.matchState",
  "player.career",
  "player.chapter",
  "player.day",
  "player.phase"
].forEach(token => {
  assert(
    !boundarySource.includes(token),
    `CoachEvaluationBoundary Source Guard 命中：${token}`
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
  "player.relationships =",
  "coach.trust ="
].forEach(token => {
  assert(
    !flowSource.includes(token),
    `CoachResponseFlow Source Guard 命中：${token}`
  );
});
assert(
  !flowSource.includes("教練在第五局讓你上場") &&
    !flowSource.includes("你直到第七局才被叫去熱身"),
  "CoachResponseFlow 不得包含完整 narrative text"
);

console.log(`Coach Response Expansion validations：${validations}`);
console.log("Golden High School Showcase（高／低信任）：通過");
console.log("Phase 7 相容、mirror mismatch、Save／Load 與 Source Guard：通過");
console.log("Phase 8 Coach Response Expansion test passed.");
