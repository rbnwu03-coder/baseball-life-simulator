const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const sources = [
  "player.js",
  "relationship-boundary.js",
  "evaluation-registry.js",
  "coach-evaluation-boundary.js",
  "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js"
].map(file => ({
  file,
  source: fs.readFileSync(path.join(root, file), "utf8")
}));
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const saveSource = fs.readFileSync(path.join(root, "save.js"), "utf8");
const bootstrapSource = fs.readFileSync(
  path.join(root, "evaluation-registry-bootstrap.js"),
  "utf8"
);

let validations = 0;

function assert(condition, message) {
  validations += 1;
  if (!condition) throw new Error(message);
}

function makeContext() {
  const context = vm.createContext({
    console,
    window: {}
  });
  sources.forEach(({ file, source }) => {
    vm.runInContext(source, context, { filename: file });
  });
  return context;
}

function makeBoundaryOnlyContext(files) {
  const context = vm.createContext({
    console,
    window: {}
  });
  files.forEach(file => {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    vm.runInContext(source, context, { filename: file });
  });
  return context;
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

function runExistingTest(file) {
  try {
    execFileSync(process.execPath, [path.join(__dirname, file)], {
      cwd: root,
      stdio: "pipe"
    });
    return true;
  } catch (error) {
    return false;
  }
}

const context = makeContext();
const expectedIds = [
  "coach-trust-response:youth_match_entry",
  "coach-trust-response:high_school_showcase",
  "narrative-condition:high_school_scout_feedback"
];
const expectedMetadata = [
  {
    evaluationId: expectedIds[0],
    owner: "CoachEvaluationBoundary",
    ownerType: "coach-evaluation",
    eventId: "youth_match_entry",
    responseId: "youth_match_entry",
    routeType: "existing-narrative"
  },
  {
    evaluationId: expectedIds[1],
    owner: "CoachEvaluationBoundary",
    ownerType: "coach-evaluation",
    eventId: "high_school_showcase",
    responseId: "high_school_showcase",
    routeType: "existing-narrative"
  },
  {
    evaluationId: expectedIds[2],
    owner: "NarrativeConditionBoundary",
    ownerType: "narrative-condition",
    eventId: "high_school_scout_feedback",
    responseId: "high_school_scout_feedback",
    routeType: "existing-narrative"
  }
];

assert(
  evaluate(context, "typeof EvaluationRegistryBootstrap === 'object'"),
  "EvaluationRegistryBootstrap 必須存在"
);
assert(
  evaluate(
    context,
    "EvaluationRegistryBootstrap.getInitializationResult().ok === true"
  ),
  "Registry bootstrap 必須初始化成功"
);
assert(
  evaluate(context, "EvaluationRegistry.getRegisteredCount() === 3"),
  "正式 Registry count 必須為 3"
);
assert(
  JSON.stringify(parse(context, "EvaluationRegistry.getEvaluationIds()")) ===
    JSON.stringify(expectedIds),
  "Golden Registry ID 順序錯誤"
);

expectedMetadata.forEach(metadata => {
  const found = parse(
    context,
    `EvaluationRegistry.findEvaluation(${JSON.stringify(
      metadata.evaluationId
    )})`
  );
  assert(
    JSON.stringify(found) === JSON.stringify(metadata),
    `${metadata.evaluationId} metadata 錯誤`
  );
  assert(
    parse(
      context,
      `EvaluationRegistry.findByEvent(${JSON.stringify(metadata.eventId)})`
    ).some(item => item.evaluationId === metadata.evaluationId),
    `${metadata.eventId} event lookup 錯誤`
  );
});
assert(
  parse(context, 'EvaluationRegistry.findByEvent("unknown")').length === 0,
  "未知 event 必須回傳空陣列"
);
assert(
  expectedMetadata.filter(
    metadata => metadata.owner === "CoachEvaluationBoundary"
  ).length === 2,
  "Coach owner 應有兩筆"
);
assert(
  expectedMetadata.filter(
    metadata => metadata.owner === "NarrativeConditionBoundary"
  ).length === 1,
  "Narrative owner 應有一筆"
);
assert(
  expectedMetadata.every(metadata =>
    ["coach-evaluation", "narrative-condition"].includes(metadata.ownerType)
  ),
  "ownerType 必須正確"
);
assert(
  expectedMetadata.every(
    metadata =>
      metadata.responseId === metadata.eventId &&
      metadata.routeType === "existing-narrative"
  ),
  "responseId 或 routeType 錯誤"
);

assert(
  JSON.stringify(
    parse(context, "CoachEvaluationBoundary.getSupportedEvaluationIds()")
  ) === JSON.stringify(expectedIds.slice(0, 2)),
  "Coach Boundary supported IDs 必須維持兩個"
);
assert(
  JSON.stringify(
    parse(context, "NarrativeConditionBoundary.getSupportedEvaluationIds()")
  ) === JSON.stringify(expectedIds.slice(2)),
  "Narrative Boundary supported IDs 必須維持一個"
);
assert(
  JSON.stringify(
    parse(context, "CoachEvaluationBoundary.getRegistryMetadata()")
  ) === JSON.stringify(expectedMetadata.slice(0, 2)),
  "Coach Registry Metadata 錯誤"
);
assert(
  JSON.stringify(
    parse(context, "NarrativeConditionBoundary.getRegistryMetadata()")
  ) === JSON.stringify(expectedMetadata.slice(2)),
  "Narrative Registry Metadata 錯誤"
);
assert(
  evaluate(
    context,
    `(() => {
      const coachItems = CoachEvaluationBoundary.getRegistryMetadata();
      const narrativeItems =
        NarrativeConditionBoundary.getRegistryMetadata();
      return Object.isFrozen(coachItems) &&
        coachItems.every(Object.isFrozen) &&
        Object.isFrozen(narrativeItems) &&
        narrativeItems.every(Object.isFrozen);
    })()`
  ),
  "Boundary Registry Metadata 必須深度凍結"
);

const coachSpecification = parse(
  context,
  `CoachEvaluationBoundary.getEvaluationSpecification("${expectedIds[0]}")`
);
assert(
  coachSpecification.threshold === 3 &&
    coachSpecification.matchedCategory === "supportive" &&
    coachSpecification.unmatchedCategory === "standard",
  "Registry 不得改變 Coach specification"
);
const narrativeSpecification = parse(
  context,
  `NarrativeConditionBoundary.getEvaluationSpecification("${expectedIds[2]}")`
);
assert(
  narrativeSpecification.threshold === 3 &&
    narrativeSpecification.sourceField === "scoutEvaluation" &&
    narrativeSpecification.matchedCategory === "recognized" &&
    narrativeSpecification.unmatchedCategory === "uncertain",
  "Registry 不得改變 Narrative specification"
);
expectedMetadata.forEach(metadata => {
  ["threshold", "operator", "category", "sourceField"].forEach(field => {
    assert(
      !Object.prototype.hasOwnProperty.call(metadata, field),
      `Registry metadata 不得包含 ${field}`
    );
  });
});

const coachOnly = makeBoundaryOnlyContext([
  "player.js",
  "relationship-boundary.js",
  "coach-evaluation-boundary.js"
]);
evaluate(coachOnly, `
  player.relationships.coachTrust = 3;
`);
assert(
  parse(
    coachOnly,
    `CoachEvaluationBoundary.evaluateCoachResponse({
      source:"event:youth_match_entry",
      evaluationId:"coach-trust-response:youth_match_entry",
      context:{eventId:"youth_match_entry",choiceIndex:null},
      expected:{coachTrust:3}
    })`
  ).response.category === "supportive",
  "Coach Boundary 不得依賴 Registry 才能評估"
);

const narrativeOnly = makeBoundaryOnlyContext([
  "player.js",
  "narrative-condition-boundary.js"
]);
evaluate(narrativeOnly, "player.scoutEvaluation = 3");
assert(
  parse(
    narrativeOnly,
    `NarrativeConditionBoundary.evaluateNarrativeCondition({
      source:"event:high_school_scout_feedback",
      evaluationId:"narrative-condition:high_school_scout_feedback",
      context:{eventId:"high_school_scout_feedback"},
      expected:{scoutEvaluation:3}
    })`
  ).response.category === "recognized",
  "Narrative Boundary 不得依賴 Registry 才能評估"
);

const beforeSecondInitialize = parse(
  context,
  "EvaluationRegistry.getEvaluationIds()"
);
const secondInitialize = parse(
  context,
  "EvaluationRegistryBootstrap.initialize()"
);
assert(secondInitialize.ok && secondInitialize.count === 3, "重複 initialize 應保持穩定");
assert(
  JSON.stringify(parse(context, "EvaluationRegistry.getEvaluationIds()")) ===
    JSON.stringify(beforeSecondInitialize),
  "重複 initialize 不得重複註冊"
);

const playerIndex = indexSource.indexOf('<script src="player.js"></script>');
const relationshipIndex = indexSource.indexOf(
  '<script src="relationship-boundary.js"></script>'
);
const registryIndex = indexSource.indexOf(
  '<script src="evaluation-registry.js"></script>'
);
const coachBoundaryIndex = indexSource.indexOf(
  '<script src="coach-evaluation-boundary.js"></script>'
);
const narrativeBoundaryIndex = indexSource.indexOf(
  '<script src="narrative-condition-boundary.js"></script>'
);
const bootstrapIndex = indexSource.indexOf(
  '<script src="evaluation-registry-bootstrap.js"></script>'
);
const coachFlowIndex = indexSource.indexOf(
  '<script src="coach-response-flow.js"></script>'
);
const narrativeFlowIndex = indexSource.indexOf(
  '<script src="narrative-condition-flow.js"></script>'
);
const storyIndex = indexSource.indexOf('<script src="story.js"></script>');
assert(
  playerIndex >= 0 &&
    playerIndex < relationshipIndex &&
    relationshipIndex < registryIndex &&
    registryIndex < coachBoundaryIndex &&
    coachBoundaryIndex < narrativeBoundaryIndex &&
    narrativeBoundaryIndex < bootstrapIndex &&
    bootstrapIndex < coachFlowIndex &&
    coachFlowIndex < narrativeFlowIndex &&
    narrativeFlowIndex < storyIndex,
  "Registry 初始化載入順序錯誤"
);

assert(
  !saveSource.includes("EvaluationRegistry") &&
    !saveSource.includes("evaluationRegistry"),
  "Registry metadata 不得進入 Save"
);
[
  "player",
  "evaluateCoachResponse",
  "evaluateNarrativeCondition",
  "document.",
  "localStorage",
  "sessionStorage",
  "saveGame",
  "loadGame",
  "showStory",
  "showCurrentEvent",
  "setTimeout",
  "setInterval",
  "Math.random"
].forEach(token => {
  assert(
    !bootstrapSource.includes(token),
    `Registry bootstrap Source Guard 命中：${token}`
  );
});

assert(
  runExistingTest("coach-response-flow-test.js"),
  "Phase 7 Golden Flow 必須通過"
);
assert(
  runExistingTest("coach-response-expansion-test.js"),
  "Phase 8 Golden High／Low 必須通過"
);
assert(
  runExistingTest("narrative-condition-flow-test.js"),
  "Phase 9 Golden High／Low 與 Save／Load 必須通過"
);
assert(
  runExistingTest("vertical-slice-smoke.js"),
  "完整垂直切片回歸必須通過"
);

console.log(`EvaluationRegistry integration validations：${validations}`);
console.log("Golden Registry State、Boundary ownership 與 Phase 7～9：通過");
console.log("Phase 10 EvaluationRegistry integration test passed.");
