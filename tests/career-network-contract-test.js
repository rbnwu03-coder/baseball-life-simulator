const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const files = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "career-spine-contract.js", "career-transition-resolver.js",
  "career-transition-commit.js", "story.js", "save.js", "script.js"
];

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    body: { classList: { toggle() {} } },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        innerHTML: "",
        value: id === "nameInput" ? "職涯網路測試" : "",
        style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        focus() {},
        setAttribute() {},
        removeAttribute() {}
      });
      return nodes.get(id);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    console,
    document,
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: { setTimeout(callback) { callback(); } },
    module: { exports: {} }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    var __networkCounters = { save: 0, effects: 0, advance: 0, render: 0 };
    var __originalSaveGame = saveGame;
    saveGame = function() { __networkCounters.save += 1; return __originalSaveGame(); };
    var __originalApplyEffects = applyEffects;
    applyEffects = function() { __networkCounters.effects += 1; return __originalApplyEffects.apply(this, arguments); };
    var __originalAdvanceAfterAction = advanceAfterAction;
    advanceAfterAction = function() { __networkCounters.advance += 1; return __originalAdvanceAfterAction.apply(this, arguments); };
    var __originalShowCurrentEvent = showCurrentEvent;
    showCurrentEvent = function() { __networkCounters.render += 1; return __originalShowCurrentEvent.apply(this, arguments); };
  `, context);
  return { context, storage };
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

function setPlayer(context, state) {
  evaluate(context, `player = createInitialPlayer("職涯網路測試"); Object.assign(player, ${JSON.stringify(state)});`);
}

const { context } = makeContext();
const network = parse(context, "CareerSpineContract.getCareerNetwork()");
const nodes = parse(context, "CareerSpineContract.getNodes()");
const actualEdges = parse(context, "CareerSpineContract.getActualEdges()");
const candidates = parse(context, "CareerSpineContract.getCandidateTransitions()");

verify("1. Career Network 擴充沿用既有 Career Spine Contract", [
  "getCareerNetwork", "getActualEdges", "getCandidateTransitions", "getCareerNetworkSnapshot", "auditCareerNetwork"
].every(name => evaluate(context, `typeof CareerSpineContract.${name} === "function"`)));

const expectedAdultNodeIds = [
  "high-school-career-exit", "career-transition", "career-transition-result",
  "development-years", "age-22-career-result", "vertical-slice-complete"
];
verify("2. 所有現行成年節點均由 Network Contract 辨識", expectedAdultNodeIds.every(id => network.adultNodes.some(node => node.nodeId === id)));

const expectedRoutes = {
  draft: ["transition_draft_day", "transition_rookie_camp", "transition_pro_roster_window"],
  college: ["transition_college_arrival", "transition_college_balance", "transition_college_eligibility"],
  amateur: ["transition_amateur_job", "transition_amateur_test", "transition_amateur_company_conflict"],
  rehab: ["transition_rehab_plateau", "transition_rehab_identity", "transition_rehab_reentry_deadline"]
};
const sharedTransition = ["transition_relationship", "transition_cost_check"];
verify("3. 四條成年入口的三幕專屬區段符合實際 Gameplay", Object.entries(expectedRoutes).every(([routeKey, eventIds]) => {
  const route = network.initialRoutes.find(item => item.routeKey === routeKey);
  return JSON.stringify(route?.exclusiveEventIds) === JSON.stringify(eventIds);
}));
verify("4. 真正重新交會點為 transitionStep=3", network.sharedTransition.startsAtStep === 3
  && JSON.stringify(network.sharedTransition.eventIds) === JSON.stringify(sharedTransition)
  && network.initialRoutes.every(route => route.rejoinStep === 3 && JSON.stringify(route.sharedEventIds) === JSON.stringify(sharedTransition)));

const expectedDevelopment = [
  "development_daily_life", "development_competition", "development_mentor",
  "development_body_choice", "development_opportunity", "development_market", "development_decision"
];
verify("5. 20–22 歲共用七幕發展期符合實際 Gameplay", JSON.stringify(network.sharedDevelopment.eventIds) === JSON.stringify(expectedDevelopment));
verify("6. 目前終點是二十二歲結果加垂直切片完成", network.currentEndpoint.resultNodeId === "age-22-career-result"
  && network.currentEndpoint.terminalNodeId === "vertical-slice-complete"
  && network.currentEndpoint.playableAfterTerminal === false);

const expectedActualEdges = [
  ["high-school-career-exit", "career-transition"],
  ["career-transition", "career-transition-result"],
  ["career-transition-result", "development-years"],
  ["development-years", "age-22-career-result"],
  ["age-22-career-result", "vertical-slice-complete"]
];
verify("7. 成年 actual edges 只包含現行可達節點", expectedActualEdges.every(([from, to]) => actualEdges.some(edge => edge.fromNodeId === from && edge.toNodeId === to)));
verify("8. 所有 actual edges 都指向存在的 Contract node", actualEdges.every(edge => nodes.some(node => node.id === edge.fromNodeId) && nodes.some(node => node.id === edge.toNodeId)));

verify("9. 八個候選轉換與 actual edges 完全隔離", candidates.length === 8
  && candidates.every(candidate => candidate.implemented === false && candidate.contractStatus === "candidate-only" && candidate.eventIds.length === 0)
  && candidates.every(candidate => !actualEdges.some(edge => edge.id === candidate.id)));
verify("10. 候選轉換不會出現在 Snapshot 合法下一步", (() => {
  setPlayer(context, { chapter: "發展期", age: 20, developmentStep: 4, careerExit: "大學棒球" });
  const snapshot = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  return snapshot.candidateTransitionIds.length === 0 && snapshot.actualNextNodeIds.length === 1 && snapshot.actualNextNodeIds[0] === "age-22-career-result";
})());

const audit = parse(context, "CareerSpineContract.auditCareerNetwork(getEvent)");
verify("11. Registry 全部 actual event ID 均可由 getEvent() 取得", audit.status === "valid" && audit.declaredActualEventCount > 0);
const missingAudit = parse(context, "CareerSpineContract.auditCareerNetwork(id => id === 'transition_cost_check' ? null : getEvent(id))");
verify("12. 不存在的 Registry event ID 會形成 contract error", missingAudit.status === "error"
  && missingAudit.issues.some(item => item.code === "actual-event-missing" && item.message.includes("transition_cost_check")));
verify("13. Registry 沒有宣告孤立但可達的正式節點", !audit.issues.some(item => item.code === "unreachable-actual-node"));

const exitCases = [
  {
    setup: "player.flags.push('entered_high_school_draft'); player.scoutEvaluation=8; player.careerPrimaryTool='守備'; player.baseballSkills.catching=8; player.body.injuryRisk=2;",
    careerExit: "高卒選秀・中後段指名候選",
    eventId: "transition_draft_day"
  },
  {
    setup: "player.flags.push('chose_college_baseball');",
    careerExit: "大學棒球",
    eventId: "transition_college_arrival"
  },
  {
    setup: "player.flags.push('chose_amateur_baseball');",
    careerExit: "業餘／社會人棒球",
    eventId: "transition_amateur_job"
  },
  {
    setup: "player.flags.push('chose_rehab_before_career');",
    careerExit: "復健與生涯暫停",
    eventId: "transition_rehab_plateau"
  }
];
verify("14. 四個高中出口條件仍各自進入正確成年入口", exitCases.every(testCase => {
  setPlayer(context, { chapter: "青棒關鍵年", age: 18, criticalYearStep: 8 });
  evaluate(context, testCase.setup);
  evaluate(context, "evaluateCriticalYear(); enterCareerTransition();");
  return evaluate(context, "player.careerExit") === testCase.careerExit
    && evaluate(context, "getCurrentEventId()") === testCase.eventId;
}));

const adultRouteCases = [
  ["高卒選秀・中後段指名候選", "draft"],
  ["高卒選秀・落選／培訓測試", "draft"],
  ["大學棒球", "college"],
  ["業餘／社會人棒球", "amateur"],
  ["復健與生涯暫停", "rehab"]
];
verify("15. 兩種高卒與大學、業餘、復健事件順序均符合 Gameplay", adultRouteCases.every(([careerExit, routeKey]) => {
  const expected = expectedRoutes[routeKey].concat(sharedTransition);
  return expected.every((eventId, transitionStep) => {
    setPlayer(context, { chapter: "生涯轉換期", age: 18, transitionStep, careerExit });
    const snapshot = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
    return evaluate(context, "getCurrentEventId()") === eventId
      && snapshot.status === "recognized"
      && snapshot.effectiveEventIds.length === 1
      && snapshot.effectiveEventIds[0] === eventId;
  });
}));

verify("16. transition 前三幕標記為專屬、後兩幕標記為共用", (() => {
  setPlayer(context, { chapter: "生涯轉換期", age: 18, transitionStep: 2, careerExit: "大學棒球" });
  const exclusive = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  setPlayer(context, { chapter: "生涯轉換期", age: 18, transitionStep: 3, careerExit: "大學棒球" });
  const shared = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  return exclusive.networkSegment === "route-exclusive-transition" && !exclusive.rejoinsOtherRoutes
    && shared.networkSegment === "shared-transition" && shared.rejoinsOtherRoutes;
})());

verify("17. 所有成年出口在 20–22 歲都走相同發展期事件", adultRouteCases.every(([careerExit]) => expectedDevelopment.every((eventId, developmentStep) => {
  setPlayer(context, { chapter: "發展期", age: developmentStep < 4 ? 20 : 21, developmentStep, careerExit });
  const snapshot = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  return evaluate(context, "getCurrentEventId()") === eventId
    && snapshot.status === "recognized"
    && snapshot.networkSegment === "shared-development";
})));

setPlayer(context, {
  chapter: "生涯轉換期小結", age: 18, transitionStep: 5, careerExit: "大學棒球",
  transitionResult: "大學入口成立", transitionDetail: "完成轉換期"
});
verify("18. 合法生涯轉換結果狀態可辨識", parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)").status === "recognized"
  && evaluate(context, "getCurrentEventId()") === "transition_result");

setPlayer(context, { chapter: "生涯轉換期", age: 18, transitionStep: 2, careerExit: "大學棒球", transitionResult: "過早結果" });
verify("19. result 在 transition 結算前出現會回報 inconsistent", (() => {
  const snapshot = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  return snapshot.status === "inconsistent" && snapshot.issues.some(item => item.code === "transition-result-state-mismatch");
})());

setPlayer(context, { chapter: "生涯轉換期小結", age: 18, transitionStep: 4, careerExit: "大學棒球" });
verify("20. transition 結果缺失或 step 不符會回報 inconsistent", (() => {
  const snapshot = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  return snapshot.status === "inconsistent"
    && snapshot.issues.some(item => item.code === "transition-result-step-mismatch")
    && snapshot.issues.some(item => item.code === "transition-result-missing");
})());

setPlayer(context, {
  chapter: "二十二歲職涯小結", age: 22, developmentStep: 7, careerExit: "大學棒球",
  developmentResult: "發展期完成", developmentDetail: "完成二十二歲評估", marketOutcome: "大卒選秀追蹤名單"
});
verify("21. 合法二十二歲結果與目前內容閘門可辨識", (() => {
  const snapshot = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  return snapshot.status === "recognized" && snapshot.currentContentEndpoint && evaluate(context, "getCurrentEventId()") === "development_result";
})());

setPlayer(context, {
  chapter: "發展期", age: 20, developmentStep: 3, careerExit: "大學棒球",
  developmentResult: "過早結果", developmentDetail: "不應存在", marketOutcome: "不應存在"
});
verify("22. development result 在結算前出現會回報 inconsistent", (() => {
  const snapshot = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  return snapshot.status === "inconsistent" && snapshot.issues.some(item => item.code === "development-result-state-mismatch");
})());

setPlayer(context, {
  chapter: "垂直切片完成", age: 22, developmentStep: 7, careerExit: "大學棒球", completed: true,
  developmentResult: "發展期完成", developmentDetail: "完成二十二歲評估", marketOutcome: "大卒選秀追蹤名單",
  forcedEventId: "azhe_adult_record_echo"
});
verify("23. completed 優先於殘留 forced event 並維持目前終點", (() => {
  const snapshot = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  return snapshot.status === "completed"
    && snapshot.effectiveEventIds.length === 1
    && snapshot.effectiveEventIds[0] === "slice_complete"
    && snapshot.forcedEventId === "azhe_adult_record_echo";
})());

setPlayer(context, { chapter: "發展期", age: 20, developmentStep: 1, careerExit: "大學棒球", forcedEventId: "takahashi_adult_restart_echo" });
verify("24. 合法 forced event 不會覆蓋底層 Career Network 節點", (() => {
  const snapshot = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  return snapshot.nodeId === "development-years"
    && snapshot.underlyingEventIds[0] === "development_competition"
    && snapshot.effectiveEventIds[0] === "takahashi_adult_restart_echo";
})());

setPlayer(context, { chapter: "發展期", age: 20, developmentStep: 1, careerExit: "大學棒球", forcedEventId: "不存在的強制事件" });
const missingForcedAudit = parse(context, "CareerSpineContract.auditCareerNetwork(getEvent, player)");
verify("25. 無法辨識的 forced event 會形成 runtime contract error", missingForcedAudit.status === "error"
  && missingForcedAudit.issues.some(item => item.code === "runtime-event-missing"));

const invalidStates = [
  { state: { chapter: "生涯轉換期", age: 17, transitionStep: 0, careerExit: "大學棒球" }, issue: "age-out-of-contract" },
  { state: { chapter: "生涯轉換期", age: 18, transitionStep: 8, careerExit: "大學棒球" }, issue: "progress-out-of-contract" },
  { state: { chapter: "發展期", age: 20, developmentStep: 0, careerExit: "" }, issue: "career-exit-out-of-contract" },
  { state: { chapter: "未知成年章節", age: 20, developmentStep: 0, careerExit: "大學棒球" }, issue: "unknown-chapter" }
];
verify("26. chapter、age、step 與 careerExit 異常均明確回報", invalidStates.every(testCase => {
  setPlayer(context, testCase.state);
  const snapshot = parse(context, "CareerSpineContract.getCareerNetworkSnapshot(player)");
  return ["inconsistent", "unknown"].includes(snapshot.status) && snapshot.issues.some(item => item.code === testCase.issue);
}));

setPlayer(context, {
  chapter: "發展期", age: 20, developmentStep: 4, careerExit: "大學棒球",
  forcedEventId: "azhe_adult_record_echo",
  pendingEvents: [{ id: "保留事件", title: "尚未處理", remainingActions: 2 }]
});
evaluate(context, "pendingYouthSeasonOutcome = { title: '保留結果', nextStep: 5 };");
const beforePlayer = evaluate(context, "JSON.stringify(player)");
const beforePendingOutcome = evaluate(context, "JSON.stringify(pendingYouthSeasonOutcome)");
const beforeCounters = evaluate(context, "JSON.stringify(__networkCounters)");
evaluate(context, "CareerSpineContract.getCareerNetworkSnapshot(player); CareerSpineContract.auditCareerNetwork(getEvent, player);");
verify("27. Snapshot 與 audit 前後 Player 深層狀態完全相同", beforePlayer === evaluate(context, "JSON.stringify(player)"));
verify("28. Snapshot 與 audit 不消耗 forced event 或 pending outcome", evaluate(context, "player.forcedEventId") === "azhe_adult_record_echo"
  && beforePendingOutcome === evaluate(context, "JSON.stringify(pendingYouthSeasonOutcome)"));
verify("29. Snapshot 與 audit 不觸發 Save、Effects、推進或 Render", beforeCounters === evaluate(context, "JSON.stringify(__networkCounters)"));

const expectedEdgePairs = nodes.slice(0, -1).map((node, index) => [node.id, nodes[index + 1].id]);
verify("30. Contract 的現行主幹 actual edge 與 chapter 順序一致", expectedEdgePairs.every(([from, to]) => actualEdges.some(edge => edge.fromNodeId === from && edge.toNodeId === to))
  && actualEdges.length === expectedEdgePairs.length);
verify("31. 舊 transition_checkpoint 沒有被偽裝成成年正式路由", !network.initialRoutes.some(route => route.exclusiveEventIds.concat(route.sharedEventIds).includes("transition_checkpoint")));
verify("32. Gameplay 未依賴 Career Spine Contract 作為 Router", ["player.js", "story.js", "save.js", "script.js"].every(file => !fs.readFileSync(path.join(root, file), "utf8").includes("CareerSpineContract")));
verify("33. Contract 未新增 current route 或 transition history Gameplay 欄位", !/currentCareerRoute|careerTransitionHistory/.test(fs.readFileSync(path.join(root, "career-spine-contract.js"), "utf8")));
verify("34. Save version 與 localStorage key 保持 v13 既有契約", evaluate(context, "SAVE_VERSION") === 13
  && fs.readFileSync(path.join(root, "save.js"), "utf8").includes('"baseballLifeRpgSave"'));

const forbiddenDiff = execFileSync("git", [
  "diff", "--name-only", "HEAD", "--",
  "player.js", "save.js", "story.js", "event.js", "time.js", "style.css",
  "current-state-boundary.js", "decision-flow.js", "application-controller.js", "competition-presentation.js"
], { cwd: root, encoding: "utf8" }).trim();
verify("35. Career Network、Gameplay 資料、Save、UI 與既有 Boundary 均未修改", forbiddenDiff === "");

console.log(`\nArchitecture Sprint 4.3 Career Network Contract：${passed}/${passed} 通過`);
