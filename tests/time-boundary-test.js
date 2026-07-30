const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
const currentStateSource = fs.readFileSync(
  path.join(root, "current-state-boundary.js"),
  "utf8"
);
const timeBoundarySource = fs.readFileSync(
  path.join(root, "time-boundary.js"),
  "utf8"
);
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

let validations = 0;

function assert(condition, message) {
  validations += 1;
  if (!condition) throw new Error(message);
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

function makeContext() {
  const context = vm.createContext({
    console,
    window: {}
  });
  vm.runInContext(playerSource, context, { filename: "player.js" });
  vm.runInContext(currentStateSource, context, {
    filename: "current-state-boundary.js"
  });
  vm.runInContext(timeBoundarySource, context, {
    filename: "time-boundary.js"
  });
  return context;
}

const context = makeContext();

assert(evaluate(context, "typeof TimeBoundary === 'object'"), "TimeBoundary 不存在");
[
  "getSnapshot",
  "isNight",
  "canAdvanceToNextDay",
  "validateTimeAdvanceRequest",
  "createNextDayRequest",
  "applyTimeAdvanceRequest"
].forEach(method => {
  assert(
    evaluate(context, `typeof TimeBoundary.${method} === "function"`),
    `缺少 TimeBoundary.${method}()`
  );
});

evaluate(context, `
  player = createInitialPlayer("TimeBoundary測試");
  player.day = 4;
  player.phase = "night";
`);
const snapshot = parse(context, "TimeBoundary.getSnapshot()");
assert(
  JSON.stringify(Object.keys(snapshot).sort()) === JSON.stringify(["day", "phase"]),
  "Time Snapshot 不只包含 day／phase"
);
assert(snapshot.day === 4 && snapshot.phase === "night", "Time Snapshot 數值不正確");
evaluate(context, `
  var exposedTimeSnapshot = TimeBoundary.getSnapshot();
  exposedTimeSnapshot.day = 99;
  exposedTimeSnapshot.phase = "afternoon";
`);
assert(
  evaluate(context, "player.day === 4 && player.phase === 'night'"),
  "Time Snapshot 暴露 mutable player reference"
);
assert(evaluate(context, "TimeBoundary.isNight()"), "isNight() 判定錯誤");
assert(
  evaluate(context, "TimeBoundary.canAdvanceToNextDay()"),
  "合法夜晚不可推進"
);

const createdRequest = parse(
  context,
  `TimeBoundary.createNextDayRequest("night-decision:night:0")`
);
assert(createdRequest.ok, "無法建立合法 Time Advance Request");
assert(
  JSON.stringify(createdRequest.request) === JSON.stringify({
    source: "night-decision:night:0",
    operation: "advance-to-next-day",
    expected: { day: 4, phase: "night" },
    next: { day: 5, phase: "morning" }
  }),
  "Time Advance Request 格式不正確"
);

const protectedBefore = parse(context, `({
  chapter: player.chapter,
  chapter2Step: player.chapter2Step,
  stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
  relationships: player.relationships,
  flags: player.flags,
  memories: player.memories,
  body: player.body,
  matchState: player.matchState
})`);
const applyResult = parse(
  context,
  `TimeBoundary.applyTimeAdvanceRequest(${JSON.stringify(createdRequest.request)})`
);
assert(applyResult.ok, "合法 Time Advance Request 套用失敗");
assert(
  evaluate(context, "player.day === 5 && player.phase === 'morning'"),
  "Time Advance 未正確進入下一天早晨"
);
assert(
  JSON.stringify(
    parse(context, `({
      chapter: player.chapter,
      chapter2Step: player.chapter2Step,
      stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
      relationships: player.relationships,
      flags: player.flags,
      memories: player.memories,
      body: player.body,
      matchState: player.matchState
    })`)
  ) === JSON.stringify(protectedBefore),
  "TimeBoundary 修改了 day／phase 以外的狀態"
);

const invalidRequests = [
  {
    label: "非 night phase",
    request: {
      source: "night-decision:night:0",
      operation: "advance-to-next-day",
      expected: { day: 4, phase: "morning" },
      next: { day: 5, phase: "morning" }
    }
  },
  {
    label: "next day 未加一",
    request: {
      source: "night-decision:night:0",
      operation: "advance-to-next-day",
      expected: { day: 4, phase: "night" },
      next: { day: 6, phase: "morning" }
    }
  },
  {
    label: "next phase 不是 morning",
    request: {
      source: "night-decision:night:0",
      operation: "advance-to-next-day",
      expected: { day: 4, phase: "night" },
      next: { day: 5, phase: "afternoon" }
    }
  },
  {
    label: "expected 與目前狀態不同",
    request: {
      source: "night-decision:night:0",
      operation: "advance-to-next-day",
      expected: { day: 3, phase: "night" },
      next: { day: 4, phase: "morning" }
    }
  },
  {
    label: "未知欄位",
    request: {
      source: "night-decision:night:0",
      operation: "advance-to-next-day",
      expected: { day: 4, phase: "night" },
      next: { day: 5, phase: "morning" },
      extra: true
    }
  },
  {
    label: "空 source",
    request: {
      source: "",
      operation: "advance-to-next-day",
      expected: { day: 4, phase: "night" },
      next: { day: 5, phase: "morning" }
    }
  },
  {
    label: "錯誤 operation",
    request: {
      source: "night-decision:night:0",
      operation: "skip-day",
      expected: { day: 4, phase: "night" },
      next: { day: 5, phase: "morning" }
    }
  }
];

invalidRequests.forEach(({ label, request }) => {
  evaluate(context, "player.day = 4; player.phase = 'night'");
  const before = parse(context, "TimeBoundary.getSnapshot()");
  const result = parse(
    context,
    `TimeBoundary.applyTimeAdvanceRequest(${JSON.stringify(request)})`
  );
  assert(!result.ok, `${label} 未被拒絕`);
  assert(
    JSON.stringify(parse(context, "TimeBoundary.getSnapshot()")) ===
      JSON.stringify(before),
    `${label} 造成部分 Time State 修改`
  );
});

evaluate(context, "player.day = 4; player.phase = 'night'");
const pollutionResult = parse(
  context,
  `TimeBoundary.validateTimeAdvanceRequest(JSON.parse(
    '{"source":"night-decision:night:0","operation":"advance-to-next-day","expected":{"day":4,"phase":"night"},"next":{"day":5,"phase":"morning","constructor":{}}}'
  ))`
);
assert(!pollutionResult.ok, "prototype pollution key 未被拒絕");
assert(
  evaluate(context, "player.day === 4 && player.phase === 'night'"),
  "污染 Request 修改了 Time State"
);

const cycleResult = parse(
  context,
  `(() => {
    const request = {
      source: "night-decision:night:0",
      operation: "advance-to-next-day",
      expected: { day: 4, phase: "night" },
      next: { day: 5, phase: "morning" }
    };
    request.next.loop = request;
    return TimeBoundary.validateTimeAdvanceRequest(request);
  })()`
);
assert(!cycleResult.ok, "循環 Time Advance Request 未被拒絕");
assert(
  evaluate(context, "player.day === 4 && player.phase === 'night'"),
  "循環 Request 修改了 Time State"
);

const delegationCalls = [];
const delegationContext = vm.createContext({
  console,
  window: {},
  player: { day: 7, phase: "night" },
  CurrentStateBoundary: {
    applyStateChangeRequest(request) {
      delegationCalls.push(request);
      return { ok: true, state: { day: request.changes.day, phase: request.changes.phase } };
    }
  }
});
vm.runInContext(timeBoundarySource, delegationContext, {
  filename: "time-boundary.js"
});
vm.runInContext(`
  var requestResult = TimeBoundary.createNextDayRequest("night-decision:night:0");
  TimeBoundary.applyTimeAdvanceRequest(requestResult.request);
`, delegationContext);
assert(
  delegationCalls.length === 1,
  "applyTimeAdvanceRequest() 沒有只委派一次 CurrentStateBoundary"
);
assert(
  JSON.stringify(delegationCalls[0]) === JSON.stringify({
    source: "night-decision:night:0",
    changes: { day: 8, phase: "morning" }
  }),
  "轉換後的 State Change Request 不正確"
);

[
  "document.",
  "innerHTML",
  "localStorage",
  "showStory",
  "showCurrentEvent",
  "saveGame",
  "setTimeout",
  "player.stats",
  "player.relationships",
  "player.flags",
  "player.memories",
  "player.body",
  "player.matchState",
  "player.chapter"
].forEach(token => {
  assert(!timeBoundarySource.includes(token), `TimeBoundary Source Guard 命中：${token}`);
});
assert(
  !/player\.day\s*=|player\.day\s*\+=|player\.phase\s*=/.test(timeBoundarySource),
  "TimeBoundary 直接寫入 player.day／player.phase"
);

const playerIndex = indexSource.indexOf('<script src="player.js"></script>');
const currentStateIndex = indexSource.indexOf(
  '<script src="current-state-boundary.js"></script>'
);
const timeIndex = indexSource.indexOf('<script src="time-boundary.js"></script>');
const relationshipBoundaryIndex = indexSource.indexOf(
  '<script src="relationship-boundary.js"></script>'
);
const dayCompletionIndex = indexSource.indexOf(
  '<script src="day-completion-flow.js"></script>'
);
const decisionIndex = indexSource.indexOf('<script src="decision-flow.js"></script>');
const relationshipFlowIndex = indexSource.indexOf(
  '<script src="relationship-flow.js"></script>'
);
assert(
  playerIndex >= 0 &&
    playerIndex < currentStateIndex &&
    currentStateIndex < timeIndex &&
    timeIndex < relationshipBoundaryIndex &&
    relationshipBoundaryIndex < decisionIndex &&
    decisionIndex < dayCompletionIndex &&
    dayCompletionIndex < relationshipFlowIndex,
  "Phase 5 瀏覽器載入順序不正確"
);
assert(
  !indexSource.includes('<script src="time.js"></script>'),
  "既有 time.js 被意外啟用"
);

console.log(`TimeBoundary validations：${validations}`);
console.log("Time Advance Request 原子驗證與 CurrentStateBoundary 委派：通過");
console.log("Phase 5 TimeBoundary test passed.");
