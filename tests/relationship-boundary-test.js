const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
const boundarySource = fs.readFileSync(
  path.join(root, "relationship-boundary.js"),
  "utf8"
);

let validations = 0;

function assert(condition, message) {
  validations += 1;
  if (!condition) throw new Error(message);
}

function makeContext() {
  const context = vm.createContext({ console, window: {} });
  vm.runInContext(playerSource, context, { filename: "player.js" });
  vm.runInContext(boundarySource, context, {
    filename: "relationship-boundary.js"
  });
  return context;
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

const context = makeContext();
assert(
  evaluate(context, "typeof RelationshipBoundary === 'object'"),
  "RelationshipBoundary 必須存在"
);
[
  "getSnapshot",
  "getRelationship",
  "hasRelationship",
  "validateRelationshipChangeRequest",
  "applyRelationshipChangeRequest",
  "restoreRelationshipSnapshot"
].forEach(method => {
  assert(
    evaluate(context, `typeof RelationshipBoundary.${method} === "function"`),
    `缺少 RelationshipBoundary.${method}()`
  );
});

evaluate(context, `
  player = createInitialPlayer("RelationshipBoundary測試");
  player.relationships = {
    coachTrust: 6,
    teammateBond: 4,
    rivalRespect: 3,
    rivalCompetition: 2
  };
`);

const snapshot = parse(context, "RelationshipBoundary.getSnapshot()");
assert(
  JSON.stringify(Object.keys(snapshot)) ===
    JSON.stringify([
      "coachTrust",
      "teammateBond",
      "rivalRespect",
      "rivalCompetition"
    ]),
  "Relationship Snapshot 必須維持現有 schema"
);
assert(snapshot.coachTrust === 6, "Relationship Snapshot 數值錯誤");
evaluate(context, `
  var exposedRelationshipSnapshot = RelationshipBoundary.getSnapshot();
  exposedRelationshipSnapshot.coachTrust = 20;
`);
assert(
  evaluate(context, "player.relationships.coachTrust === 6"),
  "Relationship Snapshot 不可暴露 mutable reference"
);
assert(
  evaluate(context, "RelationshipBoundary.getRelationship('coachTrust') === 6"),
  "getRelationship() 應回傳現值"
);
assert(
  evaluate(context, "RelationshipBoundary.getRelationship('unknown') === null"),
  "未知 target 應回傳 null"
);
assert(
  evaluate(context, "RelationshipBoundary.hasRelationship('teammateBond')"),
  "既有 target 應存在"
);
assert(
  !evaluate(context, "RelationshipBoundary.hasRelationship('affection')"),
  "不存在的 target 不得被接受"
);

const protectedBefore = parse(context, `({
  identity: { name: player.name, origin: player.origin, idealSelf: player.idealSelf },
  stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
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

const request = {
  source: "decision:youth_season_intro:0",
  targetId: "coachTrust",
  operation: "add",
  amount: 1,
  expected: { currentValue: 6 }
};
const validRequest = parse(
  context,
  `RelationshipBoundary.validateRelationshipChangeRequest(${JSON.stringify(request)})`
);
assert(validRequest.ok, "合法 Relationship Change Request 應通過");
assert(
  JSON.stringify(validRequest.request) === JSON.stringify(request),
  "驗證後的 Request 不得改變語意"
);

const applyResult = parse(
  context,
  `RelationshipBoundary.applyRelationshipChangeRequest(${JSON.stringify(request)})`
);
assert(applyResult.ok, "合法 Request 應成功套用");
assert(applyResult.change.targetId === "coachTrust", "變更 target 錯誤");
assert(applyResult.change.previousValue === 6, "previousValue 錯誤");
assert(applyResult.change.amount === 1, "amount 錯誤");
assert(applyResult.change.nextValue === 7, "nextValue 錯誤");
assert(
  evaluate(context, "player.relationships.coachTrust === 7"),
  "只應更新指定 relationship"
);
assert(
  evaluate(
    context,
    "player.relationships.teammateBond === 4 && player.relationships.rivalRespect === 3 && player.relationships.rivalCompetition === 2"
  ),
  "其他 relationship 不得改變"
);
assert(
  JSON.stringify(parse(context, `({
    identity: { name: player.name, origin: player.origin, idealSelf: player.idealSelf },
    stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
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
  })`)) === JSON.stringify(protectedBefore),
  "Boundary 不得改變 relationship 以外的狀態"
);

evaluate(context, "player.relationships.coachTrust = 20");
const highClamp = parse(
  context,
  `RelationshipBoundary.applyRelationshipChangeRequest({
    source:"test:upper",
    targetId:"coachTrust",
    operation:"add",
    amount:5,
    expected:{currentValue:20}
  })`
);
assert(highClamp.ok && highClamp.change.nextValue === 20, "關係上限應維持 20");
evaluate(context, "player.relationships.coachTrust = 0");
const lowClamp = parse(
  context,
  `RelationshipBoundary.applyRelationshipChangeRequest({
    source:"test:lower",
    targetId:"coachTrust",
    operation:"add",
    amount:-5,
    expected:{currentValue:0}
  })`
);
assert(lowClamp.ok && lowClamp.change.nextValue === 0, "關係下限應維持 0");

const invalidExpressions = [
  ["空 request", "RelationshipBoundary.validateRelationshipChangeRequest(null)"],
  ["未知 target", `RelationshipBoundary.validateRelationshipChangeRequest({source:"x",targetId:"unknown",operation:"add",amount:1,expected:{currentValue:0}})`],
  ["錯誤 operation", `RelationshipBoundary.validateRelationshipChangeRequest({source:"x",targetId:"coachTrust",operation:"set",amount:1,expected:{currentValue:0}})`],
  ["非數字 amount", `RelationshipBoundary.validateRelationshipChangeRequest({source:"x",targetId:"coachTrust",operation:"add",amount:"1",expected:{currentValue:0}})`],
  ["NaN", `RelationshipBoundary.validateRelationshipChangeRequest({source:"x",targetId:"coachTrust",operation:"add",amount:NaN,expected:{currentValue:0}})`],
  ["Infinity", `RelationshipBoundary.validateRelationshipChangeRequest({source:"x",targetId:"coachTrust",operation:"add",amount:Infinity,expected:{currentValue:0}})`],
  ["超出 amount 範圍", `RelationshipBoundary.validateRelationshipChangeRequest({source:"x",targetId:"coachTrust",operation:"add",amount:21,expected:{currentValue:0}})`],
  ["expected 不一致", `RelationshipBoundary.validateRelationshipChangeRequest({source:"x",targetId:"coachTrust",operation:"add",amount:1,expected:{currentValue:1}})`],
  ["未知 request 欄位", `RelationshipBoundary.validateRelationshipChangeRequest({source:"x",targetId:"coachTrust",operation:"add",amount:1,expected:{currentValue:0},field:"trust"})`],
  ["未知 expected 欄位", `RelationshipBoundary.validateRelationshipChangeRequest({source:"x",targetId:"coachTrust",operation:"add",amount:1,expected:{currentValue:0,extra:true}})`],
  ["空 source", `RelationshipBoundary.validateRelationshipChangeRequest({source:"",targetId:"coachTrust",operation:"add",amount:1,expected:{currentValue:0}})`]
];

invalidExpressions.forEach(([label, expression]) => {
  evaluate(context, "player.relationships.coachTrust = 0");
  const before = parse(context, "RelationshipBoundary.getSnapshot()");
  const result = parse(context, expression);
  assert(!result.ok, `${label} 應被拒絕`);
  assert(
    JSON.stringify(parse(context, "RelationshipBoundary.getSnapshot()")) ===
      JSON.stringify(before),
    `${label} 不得造成部分寫入`
  );
});

const pollution = parse(
  context,
  `RelationshipBoundary.validateRelationshipChangeRequest(JSON.parse(
    '{"source":"x","targetId":"coachTrust","operation":"add","amount":1,"expected":{"currentValue":0},"constructor":{}}'
  ))`
);
assert(!pollution.ok, "prototype pollution key 應被拒絕");
const cycle = parse(
  context,
  `(() => {
    const request = {
      source:"x",
      targetId:"coachTrust",
      operation:"add",
      amount:1,
      expected:{currentValue:0}
    };
    request.expected.loop = request;
    return RelationshipBoundary.validateRelationshipChangeRequest(request);
  })()`
);
assert(!cycle.ok, "循環 Request 應被拒絕");

const restoreTarget = {
  coachTrust: 8,
  teammateBond: 9,
  rivalRespect: 10,
  rivalCompetition: 11
};
const restoreResult = parse(
  context,
  `RelationshipBoundary.restoreRelationshipSnapshot(${JSON.stringify(restoreTarget)})`
);
assert(restoreResult.ok, "合法 Relationship Snapshot 應可還原");
assert(
  JSON.stringify(parse(context, "RelationshipBoundary.getSnapshot()")) ===
    JSON.stringify(restoreTarget),
  "Relationship Snapshot 還原結果錯誤"
);

[
  ["缺少欄位", `{coachTrust:1,teammateBond:2,rivalRespect:3}`],
  ["多餘欄位", `{coachTrust:1,teammateBond:2,rivalRespect:3,rivalCompetition:4,extra:5}`],
  ["非數字", `{coachTrust:"1",teammateBond:2,rivalRespect:3,rivalCompetition:4}`],
  ["越界", `{coachTrust:21,teammateBond:2,rivalRespect:3,rivalCompetition:4}`]
].forEach(([label, value]) => {
  const before = parse(context, "RelationshipBoundary.getSnapshot()");
  const result = parse(
    context,
    `RelationshipBoundary.restoreRelationshipSnapshot(${value})`
  );
  assert(!result.ok, `${label} Snapshot 應被拒絕`);
  assert(
    JSON.stringify(parse(context, "RelationshipBoundary.getSnapshot()")) ===
      JSON.stringify(before),
    `${label} Snapshot 不得造成部分還原`
  );
});

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
  "player.phase"
].forEach(token => {
  assert(
    !boundarySource.includes(token),
    `RelationshipBoundary Source Guard 命中：${token}`
  );
});

console.log(`RelationshipBoundary validations：${validations}`);
console.log("Relationship Snapshot、Request 驗證、原子性與 Source Guard：通過");
console.log("Phase 6 RelationshipBoundary test passed.");
