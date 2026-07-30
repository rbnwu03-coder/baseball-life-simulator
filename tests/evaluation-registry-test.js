const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const registrySource = fs.readFileSync(
  path.join(root, "evaluation-registry.js"),
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
    storageWrites: 0,
    sessionWrites: 0,
    timers: 0,
    randoms: 0,
    evaluations: 0
  };
  const context = vm.createContext({
    console,
    window: {},
    document: {
      body: Object.create({ nodeType: 1 }),
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
      counters.timers += 1;
    },
    setInterval() {
      counters.timers += 1;
    },
    Math: Object.assign(Object.create(Math), {
      random() {
        counters.randoms += 1;
        return 0.5;
      }
    }),
    evaluationProbe() {
      counters.evaluations += 1;
    },
    gameplayProbe: {
      relationships: { coachTrust: 7 },
      scout: 3,
      currentState: { chapter: "青棒", day: 1, phase: "morning" },
      story: { untouched: true }
    }
  });
  vm.runInContext(registrySource, context, {
    filename: "evaluation-registry.js"
  });
  return { context, counters };
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

const bundle = makeContext();
const context = bundle.context;
const metadataA = {
  evaluationId: "coach-trust-response:youth_match_entry",
  owner: "CoachEvaluationBoundary",
  ownerType: "coach-evaluation",
  eventId: "youth_match_entry",
  responseId: "youth_match_entry",
  routeType: "existing-narrative"
};
const metadataB = {
  evaluationId: "coach-trust-response:high_school_showcase",
  owner: "CoachEvaluationBoundary",
  ownerType: "coach-evaluation",
  eventId: "high_school_showcase",
  responseId: "high_school_showcase",
  routeType: "existing-narrative"
};
const metadataC = {
  evaluationId: "narrative-condition:shared-event",
  owner: "NarrativeConditionBoundary",
  ownerType: "narrative-condition",
  eventId: "youth_match_entry",
  responseId: "shared-event",
  routeType: "existing-narrative"
};

assert(
  evaluate(context, "typeof EvaluationRegistry === 'object'"),
  "EvaluationRegistry 必須存在"
);
[
  "registerEvaluation",
  "getEvaluationIds",
  "isSupportedEvaluation",
  "findEvaluation",
  "findByEvent",
  "getRegisteredCount"
].forEach(method => {
  assert(
    evaluate(context, `typeof EvaluationRegistry.${method} === "function"`),
    `缺少 EvaluationRegistry.${method}()`
  );
});
assert(
  evaluate(context, "EvaluationRegistry.getRegisteredCount() === 0"),
  "Registry 初始 count 必須為 0"
);
assert(
  JSON.stringify(parse(context, "EvaluationRegistry.getEvaluationIds()")) ===
    "[]",
  "Registry 初始 ID 陣列必須為空"
);
assert(
  evaluate(context, "Object.isFrozen(EvaluationRegistry)"),
  "Registry public API 必須凍結"
);

evaluate(context, `var mutableMetadata = ${JSON.stringify(metadataA)}`);
const firstRegistration = parse(
  context,
  "EvaluationRegistry.registerEvaluation(mutableMetadata)"
);
assert(firstRegistration.ok, "合法 metadata 應註冊成功");
assert(
  firstRegistration.evaluationId === metadataA.evaluationId,
  "註冊結果 evaluationId 錯誤"
);
assert(
  evaluate(context, "EvaluationRegistry.getRegisteredCount() === 1"),
  "首次註冊後 count 必須為 1"
);
assert(
  evaluate(
    context,
    `EvaluationRegistry.isSupportedEvaluation("${metadataA.evaluationId}")`
  ),
  "已註冊 evaluationId 應受支援"
);

const foundA = parse(
  context,
  `EvaluationRegistry.findEvaluation("${metadataA.evaluationId}")`
);
assert(
  JSON.stringify(foundA) === JSON.stringify(metadataA),
  "findEvaluation() metadata 錯誤"
);
assert(
  evaluate(
    context,
    `Object.isFrozen(
      EvaluationRegistry.findEvaluation("${metadataA.evaluationId}")
    )`
  ),
  "查詢 metadata 必須凍結"
);
assert(
  evaluate(
    context,
    `(() => {
      const first = EvaluationRegistry.findEvaluation("${metadataA.evaluationId}");
      const second = EvaluationRegistry.findEvaluation("${metadataA.evaluationId}");
      return first !== second;
    })()`
  ),
  "多次查詢不得暴露同一個內部 reference"
);
evaluate(context, `
  mutableMetadata.owner = "ChangedOwner";
  const exposedMetadata =
    EvaluationRegistry.findEvaluation("${metadataA.evaluationId}");
  try { exposedMetadata.owner = "ExternalChange"; } catch (error) {}
`);
assert(
  evaluate(
    context,
    `EvaluationRegistry.findEvaluation("${metadataA.evaluationId}").owner ===
      "CoachEvaluationBoundary"`
  ),
  "輸入或輸出變更不得污染 Registry"
);

assert(
  parse(context, 'EvaluationRegistry.findByEvent("youth_match_entry")')
    .length === 1,
  "findByEvent() 應找到第一筆 metadata"
);
assert(
  evaluate(
    context,
    `(() => {
      const items = EvaluationRegistry.findByEvent("youth_match_entry");
      return Object.isFrozen(items) && Object.isFrozen(items[0]);
    })()`
  ),
  "findByEvent() 的陣列與項目必須凍結"
);

assert(
  parse(
    context,
    `EvaluationRegistry.registerEvaluation(${JSON.stringify(metadataB)})`
  ).ok,
  "第二筆合法 metadata 應註冊成功"
);
assert(
  parse(
    context,
    `EvaluationRegistry.registerEvaluation(${JSON.stringify(metadataC)})`
  ).ok,
  "第三筆合法 metadata 應註冊成功"
);
assert(
  evaluate(context, "EvaluationRegistry.getRegisteredCount() === 3"),
  "三次合法註冊後 count 必須為 3"
);
assert(
  JSON.stringify(parse(context, "EvaluationRegistry.getEvaluationIds()")) ===
    JSON.stringify([
      metadataA.evaluationId,
      metadataB.evaluationId,
      metadataC.evaluationId
    ]),
  "Evaluation ID 順序必須依註冊順序保持 deterministic"
);
assert(
  evaluate(context, "Object.isFrozen(EvaluationRegistry.getEvaluationIds())"),
  "Evaluation ID 陣列必須凍結"
);
assert(
  parse(context, 'EvaluationRegistry.findByEvent("youth_match_entry")')
    .length === 2,
  "findByEvent() 必須支援一個 event 對應多個 Evaluation"
);
assert(
  JSON.stringify(
    parse(context, 'EvaluationRegistry.findByEvent("youth_match_entry")')
      .map(item => item.evaluationId)
  ) === JSON.stringify([metadataA.evaluationId, metadataC.evaluationId]),
  "findByEvent() 多筆順序必須 deterministic"
);

const invalidExpressions = [
  ["null", "null"],
  ["array", "[]"],
  ["非 plain object", "new Date()"],
  [
    "缺少 evaluationId",
    `{owner:"Owner",ownerType:"type",eventId:"event",responseId:"response",routeType:"route"}`
  ],
  [
    "缺少 owner",
    `{evaluationId:"id",ownerType:"type",eventId:"event",responseId:"response",routeType:"route"}`
  ],
  [
    "缺少 ownerType",
    `{evaluationId:"id",owner:"Owner",eventId:"event",responseId:"response",routeType:"route"}`
  ],
  [
    "缺少 eventId",
    `{evaluationId:"id",owner:"Owner",ownerType:"type",responseId:"response",routeType:"route"}`
  ],
  [
    "缺少 responseId",
    `{evaluationId:"id",owner:"Owner",ownerType:"type",eventId:"event",routeType:"route"}`
  ],
  [
    "缺少 routeType",
    `{evaluationId:"id",owner:"Owner",ownerType:"type",eventId:"event",responseId:"response"}`
  ],
  [
    "未知欄位",
    `{evaluationId:"id",owner:"Owner",ownerType:"type",eventId:"event",responseId:"response",routeType:"route",extra:true}`
  ],
  [
    "函式欄位",
    `{evaluationId:"id",owner:() => "Owner",ownerType:"type",eventId:"event",responseId:"response",routeType:"route"}`
  ],
  [
    "DOM object",
    `{evaluationId:"id",owner:document.body,ownerType:"type",eventId:"event",responseId:"response",routeType:"route"}`
  ]
];
invalidExpressions.forEach(([label, expression]) => {
  const before = evaluate(
    context,
    "JSON.stringify(EvaluationRegistry.getEvaluationIds())"
  );
  const result = parse(
    context,
    `EvaluationRegistry.registerEvaluation(${expression})`
  );
  assert(!result.ok, `${label} 必須被拒絕`);
  assert(
    evaluate(
      context,
      "JSON.stringify(EvaluationRegistry.getEvaluationIds())"
    ) === before,
    `${label} 失敗不得污染 Registry`
  );
});

[
  "evaluationId",
  "owner",
  "ownerType",
  "eventId",
  "responseId",
  "routeType"
].forEach(field => {
  const expression = JSON.stringify(
    Object.assign({}, metadataA, {
      evaluationId: `blank:${field}`,
      [field]: "   "
    })
  );
  assert(
    !parse(
      context,
      `EvaluationRegistry.registerEvaluation(${expression})`
    ).ok,
    `${field} 空白字串必須被拒絕`
  );
});

["__proto__", "constructor", "prototype"].forEach(key => {
  const serialized = JSON.stringify(
    Object.assign({}, metadataA, { evaluationId: `pollution:${key}` })
  ).replace(/}$/, `,"${key}":{}}`);
  assert(
    !parse(
      context,
      `EvaluationRegistry.registerEvaluation(JSON.parse(${JSON.stringify(
        serialized
      )}))`
    ).ok,
    `${key} 必須被拒絕`
  );
});
assert(
  evaluate(
    context,
    `(() => {
      const metadata = ${JSON.stringify(
        Object.assign({}, metadataA, { evaluationId: "cycle" })
      )};
      metadata.loop = metadata;
      return !EvaluationRegistry.registerEvaluation(metadata).ok;
    })()`
  ),
  "循環 metadata 必須被拒絕"
);

const countBeforeDuplicate = evaluate(
  context,
  "EvaluationRegistry.getRegisteredCount()"
);
const originalBeforeDuplicate = parse(
  context,
  `EvaluationRegistry.findEvaluation("${metadataA.evaluationId}")`
);
assert(
  !parse(
    context,
    `EvaluationRegistry.registerEvaluation(${JSON.stringify(metadataA)})`
  ).ok,
  "完全相同的 evaluationId 不得重複註冊"
);
assert(
  !parse(
    context,
    `EvaluationRegistry.registerEvaluation(${JSON.stringify(
      Object.assign({}, metadataA, { owner: "OtherBoundary" })
    )})`
  ).ok,
  "不同 metadata 也不得覆寫既有 evaluationId"
);
assert(
  evaluate(context, "EvaluationRegistry.getRegisteredCount()") ===
    countBeforeDuplicate,
  "重複註冊失敗後 count 不得變化"
);
assert(
  JSON.stringify(
    parse(
      context,
      `EvaluationRegistry.findEvaluation("${metadataA.evaluationId}")`
    )
  ) === JSON.stringify(originalBeforeDuplicate),
  "重複註冊失敗後原 metadata 不得變化"
);

assert(
  evaluate(context, 'EvaluationRegistry.findEvaluation("unknown") === null'),
  "未知 evaluationId 必須回傳 null"
);
assert(
  JSON.stringify(parse(context, 'EvaluationRegistry.findByEvent("unknown")')) ===
    "[]",
  "未知 eventId 必須回傳空陣列"
);
[null, 1, {}, [], ""].forEach(value => {
  const expression = JSON.stringify(value);
  assert(
    !evaluate(
      context,
      `EvaluationRegistry.isSupportedEvaluation(${expression})`
    ),
    "非字串或空 evaluationId 必須回傳 false"
  );
});
[null, 1, {}, [], ""].forEach(value => {
  const expression = JSON.stringify(value);
  assert(
    JSON.stringify(
      parse(context, `EvaluationRegistry.findByEvent(${expression})`)
    ) === "[]",
    "非字串或空 eventId 必須安全回傳空陣列"
  );
});

const approvedFields = [
  "evaluationId",
  "owner",
  "ownerType",
  "eventId",
  "responseId",
  "routeType"
];
const registeredMetadata = parse(
  context,
  `EvaluationRegistry.findEvaluation("${metadataA.evaluationId}")`
);
assert(
  JSON.stringify(Object.keys(registeredMetadata)) ===
    JSON.stringify(approvedFields),
  "Registry metadata 只能包含批准欄位"
);
[
  "threshold",
  "operator",
  "category",
  "sourceField",
  "player",
  "specification"
].forEach(field => {
  assert(
    !Object.prototype.hasOwnProperty.call(registeredMetadata, field),
    `Registry metadata 不得包含 ${field}`
  );
});
assert(
  !Object.prototype.hasOwnProperty.call(
    parse(context, "Object.keys(EvaluationRegistry)"),
    "registry"
  ) &&
    !evaluate(context, '"registry" in EvaluationRegistry'),
  "Registry 內部集合不得暴露"
);

assert(
  Object.values(bundle.counters).every(value => value === 0),
  "Registry 不得操作 DOM、storage、timer、random 或 Evaluation"
);
assert(
  evaluate(
    context,
    `JSON.stringify(gameplayProbe) === JSON.stringify({
      relationships:{coachTrust:7},
      scout:3,
      currentState:{chapter:"青棒",day:1,phase:"morning"},
      story:{untouched:true}
    })`
  ),
  "Registry 不得修改 gameplay probe"
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
  "Date.now",
  "player",
  "coachTrust",
  "scoutEvaluation",
  "RelationshipBoundary",
  "PlayerDataBoundary",
  "evaluateCoachResponse",
  "evaluateNarrativeCondition",
  "threshold",
  "operator",
  "matchedCategory",
  "unmatchedCategory"
].forEach(token => {
  assert(
    !registrySource.includes(token),
    `EvaluationRegistry Source Guard 命中：${token}`
  );
});

console.log(`EvaluationRegistry validations：${validations}`);
console.log("Registry validation、immutability、duplicate 與 Source Guard：通過");
console.log("Phase 10 EvaluationRegistry test passed.");
