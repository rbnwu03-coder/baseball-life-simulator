const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
const relationshipSource = fs.readFileSync(
  path.join(root, "relationship-boundary.js"),
  "utf8"
);
const boundarySource = fs.readFileSync(
  path.join(root, "coach-evaluation-boundary.js"),
  "utf8"
);
const coachSource = fs.readFileSync(path.join(root, "coach.js"), "utf8");

let validations = 0;

function assert(condition, message) {
  validations += 1;
  if (!condition) throw new Error(message);
}

function makeContext() {
  const counters = {
    renders: 0,
    saves: 0,
    storageWrites: 0,
    timeouts: 0
  };
  const context = vm.createContext({
    console,
    window: {
      setTimeout() {
        counters.timeouts += 1;
      }
    },
    localStorage: {
      setItem() {
        counters.storageWrites += 1;
      }
    },
    showStory() {
      counters.renders += 1;
    },
    showCurrentEvent() {
      counters.renders += 1;
    },
    updateStatus() {
      counters.renders += 1;
    },
    saveGame() {
      counters.saves += 1;
    }
  });
  vm.runInContext(playerSource, context, { filename: "player.js" });
  vm.runInContext(relationshipSource, context, {
    filename: "relationship-boundary.js"
  });
  vm.runInContext(coachSource, context, { filename: "coach.js" });
  vm.runInContext(boundarySource, context, {
    filename: "coach-evaluation-boundary.js"
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
    relationships: RelationshipBoundary.getSnapshot(),
    coachMirror: coach.trust,
    stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
    skills: player.baseballSkills,
    personality: player.personality,
    flags: player.flags,
    memories: player.memories,
    body: player.body,
    matchState: player.matchState,
    career: {
      careerValue: player.careerValue,
      roleIdentity: player.roleIdentity,
      careerArc: player.careerArc
    },
    chapter: player.chapter,
    day: player.day,
    phase: player.phase
  })`);
}

const bundle = makeContext();
const context = bundle.context;
assert(
  evaluate(context, "typeof CoachEvaluationBoundary === 'object'"),
  "CoachEvaluationBoundary 必須存在"
);
[
  "getInputSnapshot",
  "validateCoachEvaluationRequest",
  "evaluateCoachResponse",
  "getSupportedEvaluationIds",
  "getEvaluationSpecification"
].forEach(method => {
  assert(
    evaluate(
      context,
      `typeof CoachEvaluationBoundary.${method} === "function"`
    ),
    `缺少 CoachEvaluationBoundary.${method}()`
  );
});

evaluate(context, `
  player = createInitialPlayer("CoachEvaluation測試");
  player.relationships.coachTrust = 7;
  coach.trust = 1;
`);
const input = parse(context, "CoachEvaluationBoundary.getInputSnapshot()");
assert(
  JSON.stringify(input) ===
    JSON.stringify({ relationships: { coachTrust: 7 } }),
  "Coach Evaluation Input Snapshot 必須只包含正式 coachTrust"
);
evaluate(context, `
  var exposedCoachInput = CoachEvaluationBoundary.getInputSnapshot();
  try { exposedCoachInput.relationships.coachTrust = 20; } catch (error) {}
`);
assert(
  evaluate(context, "player.relationships.coachTrust === 7"),
  "Input Snapshot 不得暴露 mutable relationship reference"
);
assert(
  evaluate(context, "coach.trust === 1"),
  "取得 Snapshot 不得自動修正 coach mirror"
);
assert(
  evaluate(context, "CoachEvaluationBoundary.getCoachTrust() === 7"),
  "正式輸入必須來自 RelationshipBoundary"
);
assert(
  JSON.stringify(
    parse(context, "CoachEvaluationBoundary.getSupportedEvaluationIds()")
  ) ===
    JSON.stringify([
      "coach-trust-response:youth_match_entry",
      "coach-trust-response:high_school_showcase"
    ]),
  "Evaluation whitelist 錯誤"
);

const validRequest = {
  source: "event:youth_match_entry",
  evaluationId: "coach-trust-response:youth_match_entry",
  context: {
    eventId: "youth_match_entry",
    choiceIndex: null
  },
  expected: {
    coachTrust: 7
  }
};
const validated = parse(
  context,
  `CoachEvaluationBoundary.validateCoachEvaluationRequest(${JSON.stringify(validRequest)})`
);
assert(validated.ok, "合法 Coach Evaluation Request 應通過");
assert(
  JSON.stringify(validated.request) === JSON.stringify(validRequest),
  "驗證後 Request 不得改變語意"
);

const beforeEvaluation = protectedState(context);
const evaluation = parse(
  context,
  `CoachEvaluationBoundary.evaluateCoachResponse(${JSON.stringify(validRequest)})`
);
assert(evaluation.ok, "合法 Coach Evaluation 應成功");
assert(
  JSON.stringify(evaluation.response) ===
    JSON.stringify({
      evaluationId: "coach-trust-response:youth_match_entry",
      category: "supportive",
      responseId: "youth_match_entry",
      routeType: "existing-narrative",
      matchedCondition: {
        field: "coachTrust",
        operator: ">=",
        value: 3
      }
    }),
  "Coach Evaluation Result 格式、門檻或 response ID 錯誤"
);
assert(
  JSON.stringify(protectedState(context)) === JSON.stringify(beforeEvaluation),
  "Evaluation 不得修改任何 gameplay state 或 mirror"
);
assert(
  !Object.prototype.hasOwnProperty.call(evaluation.response, "player") &&
    !Object.prototype.hasOwnProperty.call(evaluation.response, "coach") &&
    !Object.prototype.hasOwnProperty.call(evaluation.response, "element"),
  "Result 不得包含 mutable player、coach 或 DOM"
);
assert(
  Object.values(bundle.counters).every(value => value === 0),
  "Evaluation 不得 render、存檔、操作 storage 或排程 timeout"
);

evaluate(context, `
  player.relationships.coachTrust = 2;
  coach.trust = 20;
`);
const lowEvaluation = parse(
  context,
  `CoachEvaluationBoundary.evaluateCoachResponse({
    source:"event:youth_match_entry",
    evaluationId:"coach-trust-response:youth_match_entry",
    context:{eventId:"youth_match_entry",choiceIndex:null},
    expected:{coachTrust:2}
  })`
);
assert(
  lowEvaluation.ok &&
    lowEvaluation.response.category === "standard" &&
    lowEvaluation.response.matchedCondition.operator === "<" &&
    lowEvaluation.response.matchedCondition.value === 3,
  "低信任結果必須沿用原本 < 3 分支"
);
assert(
  evaluate(context, "coach.trust === 20"),
  "低信任 Evaluation 不得修正錯誤 mirror"
);

const invalidExpressions = [
  ["空 request", "null"],
  ["空 source", `{source:"",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:null},expected:{coachTrust:2}}`],
  ["非法 evaluationId", `{source:"x",evaluationId:"unknown",context:{eventId:"youth_match_entry",choiceIndex:null},expected:{coachTrust:2}}`],
  ["非法 eventId", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_bench",choiceIndex:null},expected:{coachTrust:2}}`],
  ["非法 choiceIndex", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:-1},expected:{coachTrust:2}}`],
  ["非 choice 路徑夾帶 index", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:0},expected:{coachTrust:2}}`],
  ["expected 不一致", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:null},expected:{coachTrust:3}}`],
  ["非 numeric coachTrust", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:null},expected:{coachTrust:"2"}}`],
  ["NaN", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:null},expected:{coachTrust:NaN}}`],
  ["Infinity", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:null},expected:{coachTrust:Infinity}}`],
  ["超出範圍", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:null},expected:{coachTrust:21}}`],
  ["未知 request 欄位", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:null},expected:{coachTrust:2},extra:true}`],
  ["未知 context 欄位", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:null,coach:{}},expected:{coachTrust:2}}`],
  ["未知 expected 欄位", `{source:"x",evaluationId:"coach-trust-response:youth_match_entry",context:{eventId:"youth_match_entry",choiceIndex:null},expected:{coachTrust:2,extra:true}}`]
];

invalidExpressions.forEach(([label, requestExpression]) => {
  evaluate(context, `
    player.relationships.coachTrust = 2;
    coach.trust = 20;
  `);
  const before = protectedState(context);
  const result = parse(
    context,
    `CoachEvaluationBoundary.validateCoachEvaluationRequest(${requestExpression})`
  );
  assert(!result.ok, `${label} 應被拒絕`);
  assert(
    JSON.stringify(protectedState(context)) === JSON.stringify(before),
    `${label} 不得修改任何狀態`
  );
});

const pollution = parse(
  context,
  `CoachEvaluationBoundary.validateCoachEvaluationRequest(JSON.parse(
    '{"source":"x","evaluationId":"coach-trust-response:youth_match_entry","context":{"eventId":"youth_match_entry","choiceIndex":null},"expected":{"coachTrust":2},"constructor":{}}'
  ))`
);
assert(!pollution.ok, "prototype pollution key 應被拒絕");
const cycle = parse(
  context,
  `(() => {
    const request = {
      source:"x",
      evaluationId:"coach-trust-response:youth_match_entry",
      context:{eventId:"youth_match_entry",choiceIndex:null},
      expected:{coachTrust:2}
    };
    request.context.loop = request;
    return CoachEvaluationBoundary.validateCoachEvaluationRequest(request);
  })()`
);
assert(!cycle.ok, "循環 Coach Evaluation Request 應被拒絕");

evaluate(context, "player.relationships.coachTrust = NaN");
assert(
  !parse(
    context,
    `CoachEvaluationBoundary.validateCoachEvaluationRequest({
      source:"x",
      evaluationId:"coach-trust-response:youth_match_entry",
      context:{eventId:"youth_match_entry",choiceIndex:null},
      expected:{coachTrust:2}
    })`
  ).ok,
  "正式 Relationship 值為 NaN 時必須拒絕"
);
evaluate(context, "player.relationships.coachTrust = Infinity");
assert(
  !parse(
    context,
    `CoachEvaluationBoundary.validateCoachEvaluationRequest({
      source:"x",
      evaluationId:"coach-trust-response:youth_match_entry",
      context:{eventId:"youth_match_entry",choiceIndex:null},
      expected:{coachTrust:2}
    })`
  ).ok,
  "正式 Relationship 值為 Infinity 時必須拒絕"
);
evaluate(context, "player.relationships.coachTrust = 21");
assert(
  !parse(
    context,
    `CoachEvaluationBoundary.validateCoachEvaluationRequest({
      source:"x",
      evaluationId:"coach-trust-response:youth_match_entry",
      context:{eventId:"youth_match_entry",choiceIndex:null},
      expected:{coachTrust:21}
    })`
  ).ok,
  "正式 Relationship 值越界時必須拒絕"
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
  "player.stats",
  "player.personality",
  "player.flags",
  "player.memories",
  "player.body",
  "player.matchState",
  "player.chapter",
  "player.day",
  "player.phase",
  "player.relationships =",
  "coach.trust ="
].forEach(token => {
  assert(
    !boundarySource.includes(token),
    `CoachEvaluationBoundary Source Guard 命中：${token}`
  );
});
assert(!boundarySource.includes("Math.random"), "Evaluation 不得使用隨機");

console.log(`CoachEvaluationBoundary validations：${validations}`);
console.log("正式 Relationship 輸入、原門檻、純 Result 與 mirror 隔離：通過");
console.log("Phase 7 CoachEvaluationBoundary test passed.");
