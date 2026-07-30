const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
const boundarySource = fs.readFileSync(
  path.join(root, "narrative-condition-boundary.js"),
  "utf8"
);

let validations = 0;

function assert(condition, message) {
  validations += 1;
  if (!condition) throw new Error(message);
}

function makeContext() {
  const counters = {
    domReads: 0,
    domWrites: 0,
    storageWrites: 0,
    sessionWrites: 0,
    timeouts: 0,
    intervals: 0,
    randoms: 0
  };
  const context = vm.createContext({
    console,
    document: {
      getElementById() {
        counters.domReads += 1;
        return null;
      }
    },
    localStorage: {
      setItem() {
        counters.storageWrites += 1;
      }
    },
    sessionStorage: {
      setItem() {
        counters.sessionWrites += 1;
      }
    },
    setTimeout() {
      counters.timeouts += 1;
    },
    setInterval() {
      counters.intervals += 1;
    },
    Math: Object.assign(Object.create(Math), {
      random() {
        counters.randoms += 1;
        return 0.5;
      }
    }),
    window: {}
  });
  vm.runInContext(playerSource, context, { filename: "player.js" });
  vm.runInContext(
    `var storyProbe = { untouched: true };
     var npcProbe = { coach: 1, teammate: 2 };`,
    context
  );
  vm.runInContext(boundarySource, context, {
    filename: "narrative-condition-boundary.js"
  });
  return { context, counters };
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
      scoutEvaluation: player.scoutEvaluation,
      exposure: player.exposure
    },
    currentState: {
      chapter: player.chapter,
      day: player.day,
      phase: player.phase
    },
    storyProbe,
    npcProbe
  })`);
}

const bundle = makeContext();
const context = bundle.context;

assert(
  evaluate(context, "typeof NarrativeConditionBoundary === 'object'"),
  "NarrativeConditionBoundary 必須存在"
);
[
  "getInputSnapshot",
  "getSupportedEvaluationIds",
  "isSupportedEvaluation",
  "getEvaluationSpecification",
  "validateNarrativeEvaluationRequest",
  "evaluateNarrativeCondition"
].forEach(method => {
  assert(
    evaluate(
      context,
      `typeof NarrativeConditionBoundary.${method} === "function"`
    ),
    `缺少 NarrativeConditionBoundary.${method}()`
  );
});

const evaluationId =
  "narrative-condition:high_school_scout_feedback";
assert(
  JSON.stringify(
    parse(context, "NarrativeConditionBoundary.getSupportedEvaluationIds()")
  ) === JSON.stringify([evaluationId]),
  "Narrative supported evaluation IDs 必須只包含本次候選"
);
assert(
  evaluate(
    context,
    `NarrativeConditionBoundary.isSupportedEvaluation("${evaluationId}")`
  ),
  "合法 Narrative evaluation ID 應受支援"
);
assert(
  !evaluate(
    context,
    `NarrativeConditionBoundary.isSupportedEvaluation(
      "coach-trust-response:youth_match_entry"
    )`
  ),
  "Narrative Boundary 不得包含 Coach evaluation ID"
);

const specification = parse(
  context,
  `NarrativeConditionBoundary.getEvaluationSpecification("${evaluationId}")`
);
assert(
  JSON.stringify(specification) ===
    JSON.stringify({
      eventId: "high_school_scout_feedback",
      sourceField: "scoutEvaluation",
      operator: ">=",
      threshold: 3,
      matchedCategory: "recognized",
      unmatchedCategory: "uncertain",
      responseId: "high_school_scout_feedback",
      routeType: "existing-narrative"
    }),
  "Narrative Evaluation Specification 錯誤"
);
assert(
  evaluate(
    context,
    `(() => {
      const specification =
        NarrativeConditionBoundary.getEvaluationSpecification(
          "${evaluationId}"
        );
      try {
        specification.threshold = 1;
        specification.sourceField = "coachTrust";
        specification.eventId = "other";
        specification.matchedCategory = "other";
        specification.responseId = "other";
      } catch (error) {}
      const fresh =
        NarrativeConditionBoundary.getEvaluationSpecification(
          "${evaluationId}"
        );
      return Object.isFrozen(specification) &&
        specification.threshold === 3 &&
        specification.sourceField === "scoutEvaluation" &&
        specification.eventId === "high_school_scout_feedback" &&
        specification.matchedCategory === "recognized" &&
        specification.responseId === "high_school_scout_feedback" &&
        fresh.threshold === 3 &&
        fresh.sourceField === "scoutEvaluation";
    })()`
  ),
  "Specification 必須凍結且不可從外部修改"
);
assert(
  evaluate(
    context,
    `NarrativeConditionBoundary.getEvaluationSpecification("missing") === null`
  ),
  "未知 evaluation 不得取得 specification"
);

evaluate(context, `
  player = createInitialPlayer("NarrativeBoundary測試");
  player.scoutEvaluation = 3;
`);
const input = parse(
  context,
  `NarrativeConditionBoundary.getInputSnapshot("${evaluationId}")`
);
assert(
  JSON.stringify(input) === JSON.stringify({ scoutEvaluation: 3 }),
  "Narrative Input Snapshot 必須只包含 scoutEvaluation"
);
assert(
  evaluate(
    context,
    `Object.isFrozen(
      NarrativeConditionBoundary.getInputSnapshot("${evaluationId}")
    )`
  ),
  "Narrative Input Snapshot 必須凍結"
);
assert(
  evaluate(
    context,
    `(() => {
      const snapshot =
        NarrativeConditionBoundary.getInputSnapshot("${evaluationId}");
      try { snapshot.scoutEvaluation = 20; } catch (error) {}
      return snapshot.scoutEvaluation === 3 &&
        player.scoutEvaluation === 3 &&
        Object.keys(snapshot).length === 1 &&
        !("player" in snapshot);
    })()`
  ),
  "Snapshot 不得暴露 mutable player 或未知欄位"
);
assert(
  evaluate(
    context,
    `NarrativeConditionBoundary.getInputSnapshot("missing") === null`
  ),
  "未知 evaluation 不得產生 Input Snapshot"
);

const validRequest = {
  source: "event:high_school_scout_feedback",
  evaluationId,
  context: {
    eventId: "high_school_scout_feedback"
  },
  expected: {
    scoutEvaluation: 3
  }
};
const validated = parse(
  context,
  `NarrativeConditionBoundary.validateNarrativeEvaluationRequest(
    ${JSON.stringify(validRequest)}
  )`
);
assert(validated.ok, "合法 Narrative Evaluation Request 應通過");
assert(
  JSON.stringify(validated.request) === JSON.stringify(validRequest),
  "驗證後 Request 不得改變語意"
);
assert(
  evaluate(
    context,
    `Object.isFrozen(
      NarrativeConditionBoundary.validateNarrativeEvaluationRequest(
        ${JSON.stringify(validRequest)}
      ).request
    )`
  ),
  "通過驗證的 Request 必須凍結"
);

const invalidExpressions = [
  ["空 request", "null"],
  [
    "空 source",
    `{source:"",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:3}}`
  ],
  [
    "非法 evaluationId",
    `{source:"event:high_school_scout_feedback",evaluationId:"missing",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:3}}`
  ],
  [
    "非法 eventId",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_showcase"},expected:{scoutEvaluation:3}}`
  ],
  [
    "source mismatch",
    `{source:"event:high_school_showcase",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:3}}`
  ],
  [
    "expected 欄位缺失",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{}}`
  ],
  [
    "sourceField mismatch",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{coachTrust:3}}`
  ],
  [
    "expected 多餘欄位",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:3,extra:true}}`
  ],
  [
    "stale expected",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:2}}`
  ],
  [
    "非數字",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:"3"}}`
  ],
  [
    "NaN",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:NaN}}`
  ],
  [
    "Infinity",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:Infinity}}`
  ],
  [
    "-Infinity",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:-Infinity}}`
  ],
  [
    "低於合法範圍",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:-1}}`
  ],
  [
    "高於合法範圍",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:21}}`
  ],
  [
    "未知 request 欄位",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback"},expected:{scoutEvaluation:3},extra:true}`
  ],
  [
    "未知 context 欄位",
    `{source:"event:high_school_scout_feedback",evaluationId:"${evaluationId}",context:{eventId:"high_school_scout_feedback",choiceIndex:null},expected:{scoutEvaluation:3}}`
  ]
];

invalidExpressions.forEach(([label, expression]) => {
  const before = protectedState(context);
  const result = parse(
    context,
    `NarrativeConditionBoundary.validateNarrativeEvaluationRequest(
      ${expression}
    )`
  );
  assert(!result.ok, `${label} 必須拒絕`);
  assert(
    JSON.stringify(protectedState(context)) === JSON.stringify(before),
    `${label} 不得修改 gameplay state`
  );
});

[
  ["__proto__", "__proto__"],
  ["constructor", "constructor"],
  ["prototype", "prototype"]
].forEach(([label, key]) => {
  const result = parse(
    context,
    `NarrativeConditionBoundary.validateNarrativeEvaluationRequest(
      JSON.parse(
        '{"source":"event:high_school_scout_feedback","evaluationId":"${evaluationId}","context":{"eventId":"high_school_scout_feedback"},"expected":{"scoutEvaluation":3},"${key}":{}}'
      )
    )`
  );
  assert(!result.ok, `${label} pollution key 必須拒絕`);
});
assert(
  evaluate(
    context,
    `(() => {
      const request = {
        source:"event:high_school_scout_feedback",
        evaluationId:"${evaluationId}",
        context:{eventId:"high_school_scout_feedback"},
        expected:{scoutEvaluation:3}
      };
      request.context.loop = request;
      return !NarrativeConditionBoundary
        .validateNarrativeEvaluationRequest(request).ok;
    })()`
  ),
  "循環 Narrative Evaluation Request 必須拒絕"
);

[
  [3, "recognized", ">="],
  [4, "recognized", ">="],
  [2, "uncertain", "<"],
  [0, "uncertain", "<"],
  [20, "recognized", ">="]
].forEach(([value, category, operator]) => {
  evaluate(context, `player.scoutEvaluation = ${value}`);
  const request = `{
    source:"event:high_school_scout_feedback",
    evaluationId:"${evaluationId}",
    context:{eventId:"high_school_scout_feedback"},
    expected:{scoutEvaluation:${value}}
  }`;
  const before = protectedState(context);
  const result = parse(
    context,
    `NarrativeConditionBoundary.evaluateNarrativeCondition(${request})`
  );
  assert(result.ok, `scoutEvaluation ${value} 應成功評估`);
  assert(
    JSON.stringify(result.response) ===
      JSON.stringify({
        evaluationId,
        category,
        responseId: "high_school_scout_feedback",
        routeType: "existing-narrative",
        matchedCondition: {
          field: "scoutEvaluation",
          operator,
          value: 3
        }
      }),
    `scoutEvaluation ${value} 的 Result 格式或分類錯誤`
  );
  assert(
    JSON.stringify(protectedState(context)) === JSON.stringify(before),
    `scoutEvaluation ${value} 的 Evaluation 必須保持純度`
  );
  assert(
    evaluate(
      context,
      `Object.isFrozen(
        NarrativeConditionBoundary.evaluateNarrativeCondition(${request})
      ) && Object.isFrozen(
        NarrativeConditionBoundary.evaluateNarrativeCondition(${request})
          .response
      )`
    ),
    "Narrative Condition Result 必須深度凍結"
  );
  assert(
    !Object.prototype.hasOwnProperty.call(result.response, "player") &&
      !Object.prototype.hasOwnProperty.call(result.response, "event") &&
      !Object.prototype.hasOwnProperty.call(result.response, "element") &&
      !Object.prototype.hasOwnProperty.call(result.response, "callback"),
    "Result 不得包含 player、event、DOM 或 callback"
  );
});

[
  "NaN",
  "Infinity",
  "-Infinity",
  "-1",
  "21"
].forEach(value => {
  evaluate(context, `player.scoutEvaluation = ${value}`);
  const result = parse(
    context,
    `NarrativeConditionBoundary.validateNarrativeEvaluationRequest({
      source:"event:high_school_scout_feedback",
      evaluationId:"${evaluationId}",
      context:{eventId:"high_school_scout_feedback"},
      expected:{scoutEvaluation:3}
    })`
  );
  assert(!result.ok, `正式 scoutEvaluation ${value} 必須拒絕`);
});

assert(
  Object.values(bundle.counters).every(value => value === 0),
  "Boundary 不得操作 DOM、storage、timer 或 random"
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
  "player.phase =",
  "coachTrust"
].forEach(token => {
  assert(
    !boundarySource.includes(token),
    `NarrativeConditionBoundary Source Guard 命中：${token}`
  );
});

console.log(`NarrativeConditionBoundary validations：${validations}`);
console.log("最小 Snapshot、Request Guard、門檻分類與純度：通過");
console.log("Phase 9 NarrativeConditionBoundary test passed.");
