const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const runtimeSources = Object.fromEntries(
  ["player.js", "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-development-runtime-resolver.js", "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js"]
    .map(file => [file, fs.readFileSync(path.join(root, file), "utf8")])
);

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function makeContext() {
  const storage = new Map();
  const nodes = new Map();
  const counters = { save: 0, render: 0, effects: 0, routeAdvance: 0, routeRead: 0 };
  const context = vm.createContext({
    console,
    document: {
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, { style: {}, innerHTML: "", value: "" });
        return nodes.get(id);
      }
    },
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: {},
    module: { exports: {} }
  });

  vm.runInContext(runtimeSources["player.js"], context, { filename: "player.js" });
  vm.runInContext(runtimeSources["career-spine-contract.js"], context, { filename: "career-spine-contract.js" });
  vm.runInContext(runtimeSources["career-transition-runtime-resolver.js"], context, { filename: "career-transition-runtime-resolver.js" });
  vm.runInContext(runtimeSources["career-development-runtime-resolver.js"], context, { filename: "career-development-runtime-resolver.js" });
  vm.runInContext(runtimeSources["career-age22-outcome-resolver.js"], context, { filename: "career-age22-outcome-resolver.js" });
  vm.runInContext(runtimeSources["career-save-admission.js"], context, { filename: "career-save-admission.js" });
  vm.runInContext("module = { exports: {} };", context);
  vm.runInContext(`
    function hasFlag(flag) {
      return Array.isArray(player?.flags) && player.flags.includes(flag);
    }
  `, context);
  vm.runInContext(runtimeSources["story.js"], context, { filename: "story.js" });
  vm.runInContext(`
    var __contractCounters = ${JSON.stringify(counters)};
    function showNotice() {}
    function showCurrentEvent() { __contractCounters.render += 1; }
    function applyEffects() { __contractCounters.effects += 1; }
    function advanceAfterAction() { __contractCounters.routeAdvance += 1; }
  `, context);
  vm.runInContext(runtimeSources["save.js"], context, { filename: "save.js" });
  vm.runInContext(`
    var __contractOriginalSaveGame = saveGame;
    saveGame = function() {
      __contractCounters.save += 1;
      return __contractOriginalSaveGame();
    };
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
  evaluate(context, `player = createInitialPlayer("契約測試"); Object.assign(player, ${JSON.stringify(state)});`);
}

function getSnapshotFor(state, setup = "") {
  setPlayer(context, state);
  if (setup) evaluate(context, setup);
  return parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
}

function runtimeMatches(state, expectedEventId, setup = "") {
  const snapshot = getSnapshotFor(state, setup);
  const actualEventId = evaluate(context, "getCurrentEventId()");
  return {
    snapshot,
    actualEventId,
    matches: actualEventId === expectedEventId
      && snapshot.effectiveEventIds.includes(expectedEventId),
    exact: actualEventId === expectedEventId
      && snapshot.effectiveEventIds.length === 1
      && snapshot.effectiveEventIds[0] === expectedEventId
  };
}

function collectDeclaredEventIds(node) {
  const ids = [];
  if (node.entry?.eventId) ids.push(node.entry.eventId);
  if (Array.isArray(node.settlement?.eventIds)) ids.push(...node.settlement.eventIds);
  if (node.route?.kind === "fixed" && node.route.eventId) ids.push(node.route.eventId);
  if (node.route?.kind === "steps") {
    node.route.events.forEach(events => ids.push(...events));
  }
  if (node.route?.kind === "route-steps") {
    Object.values(node.route.routes).forEach(events => ids.push(...events));
  }
  return ids;
}

const { context, storage } = makeContext();
const nodes = parse(context, "CareerSpineContract.getNodes()");
const knownGaps = parse(context, "CareerSpineContract.getKnownGaps()");

verify("1. Career Spine Contract 公開只讀查詢 API", [
  "getNodes", "getKnownGaps", "getNodeByChapter", "getRuntimeEventExpectation", "getCareerSpineSnapshot"
].every(method => evaluate(context, `typeof CareerSpineContract.${method} === "function"`)));

const chapters = nodes.map(item => item.chapter);
verify("2. 每個現行 chapter 只有一個 Contract node", new Set(chapters).size === chapters.length);

const nodeIds = nodes.map(item => item.id);
verify("2a. 每個 Contract node ID 都唯一", new Set(nodeIds).size === nodeIds.length);

const expectedChapters = [
  "十歲暑假", "少棒入門", "少棒入門小結", "少棒第一季", "少棒第一季小結",
  "位置競爭", "位置競爭小結", "青少棒", "青少棒開場小結", "青少棒分化",
  "青少棒階段小結", "青棒", "青棒第一年小結", "青棒第二年", "青棒第二年小結",
  "青棒關鍵年", "青棒生涯出口",
  "生涯轉換期", "生涯轉換期小結", "發展期", "二十二歲職涯小結", "垂直切片完成"
];
verify("3. 10 歲到 22 歲的所有實際 chapter 都已登錄", expectedChapters.every(chapter => chapters.includes(chapter)) && chapters.length === expectedChapters.length);

const expectedProgress = {
  "十歲暑假": ["day", 1, 7],
  "少棒入門": ["chapter2Step", 0, 5],
  "少棒第一季": ["seasonStep", 0, 7],
  "位置競爭": ["competitionStep", 0, 5],
  "青少棒": ["juniorStep", 0, 9],
  "青少棒分化": ["juniorSeasonStep", 0, 9],
  "青棒": ["highSchoolStep", 0, 7],
  "青棒第二年": ["highSchoolYearTwoStep", 0, 7],
  "青棒關鍵年": ["criticalYearStep", 0, 7],
  "生涯轉換期": ["transitionStep", 0, 4],
  "發展期": ["developmentStep", 0, 6]
};
verify("4. 每個可玩節點的 progress 欄位與範圍符合現行路由", Object.entries(expectedProgress).every(([chapter, expected]) => {
  const progress = nodes.find(item => item.chapter === chapter)?.progress;
  return progress?.field === expected[0] && progress.min === expected[1] && progress.max === expected[2];
}));
verify("5. 結果章沒有偽造 progress 欄位", nodes.filter(item => item.chapter.includes("小結") || item.chapter === "青棒生涯出口").every(item => item.progress === null));

const routeCases = [];
for (let day = 1; day <= 7; day += 1) {
  ["morning", "afternoon", "night"].forEach(phase => routeCases.push({ chapter: "十歲暑假", age: 10, day, phase }));
}
routeCases.push({ chapter: "十歲暑假", age: 10, day: 7, phase: "ending", ending: "觀察型入隊" });

const stepNodes = nodes.filter(item => item.progress && item.chapter !== "十歲暑假" && item.chapter !== "生涯轉換期");
stepNodes.forEach(item => {
  for (let step = item.progress.min; step <= item.progress.max; step += 1) {
    routeCases.push({
      chapter: item.chapter,
      age: item.age[0],
      [item.progress.field]: step,
      ...(item.chapter === "發展期" ? { careerExit: "大學棒球" } : {})
    });
  }
});

[
  ["高卒選秀・中後段指名候選", "draft"],
  ["高卒選秀・落選／培訓測試", "draft"],
  ["大學棒球", "college"],
  ["業餘／社會人棒球", "amateur"],
  ["復健與生涯暫停", "rehab"]
].forEach(([careerExit]) => {
  for (let step = 0; step <= 4; step += 1) {
    routeCases.push({ chapter: "生涯轉換期", age: 18, transitionStep: step, careerExit });
  }
});

[
  ["少棒入門小結", 10], ["少棒第一季小結", 10], ["位置競爭小結", 10],
  ["青少棒開場小結", 13], ["青少棒階段小結", 15], ["青棒第一年小結", 16],
  ["青棒生涯出口", 18], ["生涯轉換期小結", 18], ["二十二歲職涯小結", 22]
].forEach(([chapter, age]) => routeCases.push({ chapter, age }));
routeCases.push({
  chapter: "青棒第二年小結",
  age: 17,
  highSchoolYearTwoStep: 8,
  highSchoolYearTwoResult: "契約測試結果",
  highSchoolYearTwoDetail: "契約測試內容"
});
routeCases.push({ chapter: "垂直切片完成", age: 22, completed: true });

let legalRouteMismatch = null;
routeCases.some(state => {
  setPlayer(context, state);
  const snapshot = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
  const actualEventId = evaluate(context, "getCurrentEventId()");
  const eventExists = Boolean(evaluate(context, `getEvent(${JSON.stringify(actualEventId)})`));
  if (!["recognized", "completed"].includes(snapshot.status) || !snapshot.effectiveEventIds.includes(actualEventId) || !eventExists) {
    legalRouteMismatch = { state, snapshot, actualEventId, eventExists };
    return true;
  }
  return false;
});
verify("6. 所有合法 progress 與結果章都和 getCurrentEventId() 一致", legalRouteMismatch === null);

const youthPositions = {
  "內野手": "youth_match_grounder",
  "外野手": "youth_match_outfield",
  "捕手": "youth_match_catcher",
  "投手": "youth_match_pitcher"
};
verify("7. 少棒守位動態事件都落在契約允許集合", Object.entries(youthPositions).every(([position, eventId]) => {
  setPlayer(context, { chapter: "少棒第一季", age: 10, seasonStep: 5, seasonPosition: position });
  const snapshot = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
  return evaluate(context, "getCurrentEventId()") === eventId && snapshot.underlyingEventIds.includes(eventId);
}));

setPlayer(context, { chapter: "位置競爭", age: 10, competitionStep: 2, forcedEventId: "starter_selection_test" });
const forcedSnapshot = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
verify("8. forcedEventId 不會取代底層 Career Spine 節點", forcedSnapshot.nodeId === "position-competition" && forcedSnapshot.status === "recognized");
verify("9. forcedEventId 同時保留有效與底層事件期待", forcedSnapshot.forcedEventId === "starter_selection_test" && forcedSnapshot.effectiveEventIds[0] === "starter_selection_test" && !forcedSnapshot.underlyingEventIds.includes("starter_selection_test"));
verify("10. Snapshot 不會清除 forcedEventId", evaluate(context, "player.forcedEventId") === "starter_selection_test");

setPlayer(context, { chapter: "不存在的章節", age: 17 });
const unknown = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
verify("11. 未知 chapter 回報 unknown", unknown.status === "unknown" && unknown.issues.some(item => item.code === "unknown-chapter"));

setPlayer(context, { chapter: "青棒", age: 16, highSchoolStep: 8 });
const overflow = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
verify("12. 合法 chapter 搭配越界 step 回報 inconsistent", overflow.status === "inconsistent" && overflow.issues.some(item => item.code === "progress-out-of-contract"));

setPlayer(context, { chapter: "青棒", age: 13, highSchoolStep: 0 });
const wrongAge = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
verify("13. 年齡與 chapter 不一致會明確回報", wrongAge.status === "inconsistent" && wrongAge.issues.some(item => item.code === "age-out-of-contract"));

setPlayer(context, { chapter: "青少棒分化", age: 13, juniorSeasonStep: 0 });
const juniorMain = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
setPlayer(context, { chapter: "青少棒分化", age: 15, juniorSeasonStep: 0 });
const juniorBookmark = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
verify("14. 青少棒分化保留 13／15 現況且標記差異", [juniorMain, juniorBookmark].every(snapshot => snapshot.status === "recognized" && snapshot.knownIssues.some(item => item.id === "junior-split-age-mismatch")));

verify("15. 高二缺口已由正式節點取代", !knownGaps.some(item => item.id === "high-school-year-two-missing")
  && nodes.some(item => item.id === "high-school-year-two")
  && nodes.some(item => item.id === "high-school-year-two-result"));
verify("16. 成年四路線共用 development 的事實已記錄", knownGaps.some(item => item.id === "adult-routes-share-development"));
verify("17. 22 歲後沒有可玩節點的事實已記錄", knownGaps.some(item => item.id === "post-age-22-not-playable") && nodes.at(-1).terminal === true);

setPlayer(context, { chapter: "發展期", age: 20, developmentStep: 4, forcedEventId: "azhe_adult_record_echo" });
const beforePlayer = evaluate(context, "JSON.stringify(player)");
const beforeCounters = parse(context, "__contractCounters");
evaluate(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
const afterPlayer = evaluate(context, "JSON.stringify(player)");
const afterCounters = parse(context, "__contractCounters");
verify("18. Snapshot 呼叫前後 player 完全相同", beforePlayer === afterPlayer);
verify("19. Snapshot 不觸發 Save、Render、Effects 或路由推進", JSON.stringify(beforeCounters) === JSON.stringify(afterCounters));

setPlayer(context, { chapter: "青棒", age: 16, highSchoolStep: 5, name: "存檔路由測試" });
evaluate(context, "saveGame()");
evaluate(context, "player = createInitialPlayer('被覆蓋'); loadGame()");
verify("20. 現有合法 Save 載入後仍走原本事件路由", evaluate(context, "getCurrentEventId()") === "high_school_long_bench" && evaluate(context, "player.highSchoolStep") === 5);
verify("21. Save 仍使用原 localStorage key", storage.has("baseballLifeRpgSave"));
verify("22. Save version 已升級為 14", evaluate(context, "SAVE_VERSION") === 14 && evaluate(context, "player.saveVersion") === 14);

const forbiddenArchitectureDiff = execFileSync("git", ["diff", "--name-only", "--", "current-state-boundary.js", "decision-flow.js", "application-controller.js", "time-boundary.js"], { cwd: root, encoding: "utf8" }).trim();
verify("23. 現有 Boundary、Decision Flow 與 Application Controller 未修改", forbiddenArchitectureDiff === "");
verify("24. Registry 沒有新增 player.stage 或人物在場契約", !/player\.stage|activeNpcId|speakerNpcId|presentNpcIds/.test(runtimeSources["career-spine-contract.js"]));
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const developmentHelperStart = scriptSource.indexOf("function getDevelopmentNarrativeEventIds()");
const developmentHelperEnd = scriptSource.indexOf("function getAdultRouteKey()", developmentHelperStart);
const scriptOutsideDevelopmentHelper = developmentHelperStart >= 0 && developmentHelperEnd > developmentHelperStart
  ? scriptSource.slice(0, developmentHelperStart) + scriptSource.slice(developmentHelperEnd)
  : scriptSource;
verify("25. Gameplay Router 不直接依賴 Registry；4.8 只允許 Narrative topology helper 唯讀查詢", !["story.js", "save.js", "player.js"].some(file => runtimeSources[file].includes("CareerSpineContract"))
  && developmentHelperStart >= 0
  && scriptSource.slice(developmentHelperStart, developmentHelperEnd).includes("CareerSpineContract.getCareerNetwork()")
  && !scriptOutsideDevelopmentHelper.includes("CareerSpineContract"));

const declaredEventIds = [...new Set(nodes.flatMap(collectDeclaredEventIds))];
const missingDeclaredEventIds = declaredEventIds.filter(eventId => !evaluate(context, `Boolean(getEvent(${JSON.stringify(eventId)}))`));
verify("26. Registry 宣告的每一個事件 ID 都能由 getEvent() 取得", declaredEventIds.length > 0 && missingDeclaredEventIds.length === 0);

const fixedStepMismatches = [];
nodes
  .filter(node => node.route?.kind === "steps")
  .forEach(node => {
    node.route.events.forEach((eventIds, step) => {
      if (eventIds.length !== 1) return;
      const result = runtimeMatches({
        chapter: node.chapter,
        age: node.age[0],
        [node.progress.field]: step,
        ...(node.chapter === "發展期" ? { careerExit: "大學棒球" } : {})
      }, eventIds[0]);
      if (!result.exact) fixedStepMismatches.push({ node: node.id, step, result });
    });
  });
verify("27. 一般固定 step 的 effectiveEventIds 與真實路由精確相等", fixedStepMismatches.length === 0);

const competitionStep2Cases = [
  {
    label: "教練認為不成熟",
    expected: "echo_coach_immature",
    setup: "player.impression.coach.immature = 5;"
  },
  {
    label: "教練看見領導力",
    expected: "echo_coach_leadership",
    setup: "player.impression.coach.dependable = 5; player.impression.coach.leader = 3;"
  },
  {
    label: "高橋尊重",
    expected: "echo_rival_respect",
    setup: "player.impression.takahashi.respect = 5;"
  },
  {
    label: "教練信任",
    expected: "echo_coach",
    setup: "player.relationships.coachTrust = 6;"
  },
  {
    label: "隊友羈絆",
    expected: "echo_teammate",
    setup: "player.relationships.teammateBond = 5;"
  },
  {
    label: "競爭關係",
    expected: "echo_rival",
    setup: "player.relationships.rivalCompetition = 5;"
  },
  {
    label: "獨自準備",
    expected: "echo_solo",
    setup: ""
  }
];
verify("28. 位置競爭 step 2 的七種人物回響均與真實優先順序一致", competitionStep2Cases.every(testCase => {
  const result = runtimeMatches(
    { chapter: "位置競爭", age: 10, competitionStep: 2 },
    testCase.expected,
    testCase.setup
  );
  return result.matches && result.snapshot.underlyingEventIds.includes(testCase.expected);
}));

const competitionStep3Cases = [
  {
    expected: "azhe_bond_low",
    setup: "player.impression.azhe.feelsDistance = 5; player.relationships.teammateBond = 3;"
  },
  {
    expected: "azhe_bond_mid",
    setup: "player.impression.azhe.feelsDistance = 0; player.impression.azhe.trusts = 0; player.relationships.teammateBond = 3;"
  },
  {
    expected: "azhe_bond_high",
    setup: "player.impression.azhe.feelsDistance = 0; player.impression.azhe.trusts = 5; player.relationships.teammateBond = 3;"
  }
];
verify("29. 位置競爭 step 3 的 low／mid／high 分支全部精確核對", competitionStep3Cases.every(testCase => {
  const result = runtimeMatches(
    { chapter: "位置競爭", age: 10, competitionStep: 3 },
    testCase.expected,
    testCase.setup
  );
  return result.matches && result.snapshot.underlyingEventIds.includes(testCase.expected);
}));

verify("30. 位置競爭捕手與非捕手測試均精確核對", [
  ["捕手", "competition_catcher_test"],
  ["內野手", "competition_position_test"]
].every(([seasonPosition, expected]) => {
  const result = runtimeMatches({ chapter: "位置競爭", age: 10, competitionStep: 5, seasonPosition }, expected);
  return result.matches && result.snapshot.underlyingEventIds.includes(expected);
}));

verify("31. 少棒第一季四個守位事件均精確核對", Object.entries(youthPositions).every(([seasonPosition, expected]) => {
  const result = runtimeMatches({ chapter: "少棒第一季", age: 10, seasonStep: 5, seasonPosition }, expected);
  return result.matches && result.snapshot.underlyingEventIds.includes(expected);
}));

const adultRouteCases = [
  {
    careerExit: "高卒選秀・中後段指名候選",
    expected: ["transition_draft_day", "transition_rookie_camp", "transition_pro_roster_window", "transition_relationship", "transition_cost_check"]
  },
  {
    careerExit: "高卒選秀・落選／培訓測試",
    expected: ["transition_draft_day", "transition_rookie_camp", "transition_pro_roster_window", "transition_relationship", "transition_cost_check"]
  },
  {
    careerExit: "大學棒球",
    expected: ["transition_college_arrival", "transition_college_balance", "transition_college_eligibility", "transition_relationship", "transition_cost_check"]
  },
  {
    careerExit: "業餘／社會人棒球",
    expected: ["transition_amateur_job", "transition_amateur_test", "transition_amateur_company_conflict", "transition_relationship", "transition_cost_check"]
  },
  {
    careerExit: "復健與生涯暫停",
    expected: ["transition_rehab_plateau", "transition_rehab_identity", "transition_rehab_reentry_deadline", "transition_relationship", "transition_cost_check"]
  }
];
verify("32. 兩種高卒、大學、業餘與復健五條成年入口均精確核對", adultRouteCases.every(testCase => testCase.expected.every((expected, transitionStep) => {
  const result = runtimeMatches({
    chapter: "生涯轉換期",
    age: 18,
    transitionStep,
    careerExit: testCase.careerExit
  }, expected);
  return result.exact && result.snapshot.status === "recognized";
})));

const invalidAdultExitCases = ["", "未辨識出口", "大學棒球候選"];
verify("33. 空白與未辨識 careerExit 仍由 Contract 回報問題，Live Runtime 不再採用復健 fallback", invalidAdultExitCases.every(careerExit => {
  const result = runtimeMatches({ chapter: "生涯轉換期", age: 18, transitionStep: 0, careerExit }, null);
  return result.actualEventId === null
    && result.snapshot.status === "inconsistent"
    && result.snapshot.issues.some(item => item.code === "career-exit-out-of-contract")
    && !result.snapshot.effectiveEventIds.includes("transition_draft_day");
}));

setPlayer(context, {
  chapter: "位置競爭",
  age: 10,
  competitionStep: 2,
  completed: true,
  forcedEventId: "starter_selection_test"
});
const completedForcedSnapshot = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
verify("34. completed=true 且殘留 forcedEventId 時，實際與 Snapshot 都以 slice_complete 為有效事件", evaluate(context, "getCurrentEventId()") === "slice_complete"
  && completedForcedSnapshot.effectiveEventIds.length === 1
  && completedForcedSnapshot.effectiveEventIds[0] === "slice_complete"
  && completedForcedSnapshot.forcedEventId === "starter_selection_test"
  && completedForcedSnapshot.underlyingEventIds.includes("echo_solo"));

const legalChildhoodCases = [
  { state: { chapter: "十歲暑假", age: 10, day: 1, phase: "morning", ending: "" }, expected: "day1_morning" },
  { state: { chapter: "十歲暑假", age: 10, day: 4, phase: "afternoon", ending: "" }, expected: "day4_afternoon" },
  { state: { chapter: "十歲暑假", age: 10, day: 6, phase: "night", ending: "" }, expected: "night" },
  { state: { chapter: "十歲暑假", age: 10, day: 7, phase: "ending", ending: "觀察型入隊" }, expected: "ending" }
];
verify("35. 十歲暑假的 morning／afternoon／night 與正式 ending 狀態可辨識", legalChildhoodCases.every(testCase => {
  const result = runtimeMatches(testCase.state, testCase.expected);
  return result.exact && result.snapshot.status === "recognized";
}));

const invalidEndingMissing = runtimeMatches(
  { chapter: "十歲暑假", age: 10, day: 7, phase: "ending", ending: "" },
  "day7_ending"
);
verify("36. phase=ending 但 ending 空白時回報 inconsistent 且不視為合法事件", invalidEndingMissing.exact
  && invalidEndingMissing.snapshot.status === "inconsistent"
  && invalidEndingMissing.snapshot.issues.some(item => item.code === "ending-value-missing")
  && !evaluate(context, "Boolean(getEvent('day7_ending'))"));

const invalidEndingStateCases = [
  { chapter: "十歲暑假", age: 10, day: 1, phase: "morning", ending: "主動入隊" },
  { chapter: "十歲暑假", age: 10, day: 6, phase: "ending", ending: "主動入隊" },
  { chapter: "十歲暑假", age: 10, day: 7, phase: "night", ending: "主動入隊" }
];
verify("37. ending 已存在但 day／phase 不符正式結算狀態時回報 inconsistent", invalidEndingStateCases.every(state => {
  const result = runtimeMatches(state, "ending");
  return result.exact
    && result.snapshot.status === "inconsistent"
    && result.snapshot.issues.some(item => item.code === "ending-state-mismatch");
}));

const illegalDayOneEnding = runtimeMatches(
  { chapter: "十歲暑假", age: 10, day: 1, phase: "ending", ending: "" },
  "day1_ending"
);
verify("38. day1_ending 不會被契約視為合法狀態", illegalDayOneEnding.snapshot.status === "inconsistent"
  && illegalDayOneEnding.snapshot.issues.some(item => item.code === "ending-value-missing")
  && !evaluate(context, "Boolean(getEvent('day1_ending'))"));

let legalSnapshotFailure = null;
routeCases.some(state => {
  setPlayer(context, state);
  const snapshot = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
  const actualEventId = evaluate(context, "getCurrentEventId()");
  const candidatesExist = snapshot.effectiveEventIds.every(eventId => evaluate(context, `Boolean(getEvent(${JSON.stringify(eventId)}))`));
  if (!["recognized", "completed"].includes(snapshot.status)
    || !snapshot.effectiveEventIds.includes(actualEventId)
    || !candidatesExist) {
    legalSnapshotFailure = { state, snapshot, actualEventId, candidatesExist };
    return true;
  }
  return false;
});
verify("39. 每個合法 Snapshot 都包含真實事件且所有有效候選本身存在", legalSnapshotFailure === null);

console.log(`\nArchitecture Sprint 4.1 Career Spine Contract：${passed}/${passed} 通過`);
