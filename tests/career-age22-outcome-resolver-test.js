const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const contract = require(path.join(root, "career-spine-contract.js"));
const resolver = require(path.join(root, "career-age22-outcome-resolver.js"));

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isDeepFrozen(value, visited = new Set()) {
  if (!value || typeof value !== "object" || visited.has(value)) return true;
  visited.add(value);
  return Object.isFrozen(value) && Object.values(value).every(item => isDeepFrozen(item, visited));
}

const cases = [
  {
    careerExit: "高卒選秀・中後段指名候選", marketScore: 12, injuryRisk: 0,
    routeKey: "draft", currentIdentity: "professional", outcomeCode: "professional-competitive",
    marketOutcome: "一軍短期升格／正式名單競爭",
    developmentResult: "職業體系開始把你當成可用戰力",
    developmentDetail: "你仍不是穩定一軍球員，但角色、健康與近期表現已足以換到真正的升格機會。"
  },
  {
    careerExit: "高卒選秀・落選／培訓測試", marketScore: 11, injuryRisk: 0,
    routeKey: "draft", currentIdentity: "professional", outcomeCode: "professional-roster-risk",
    marketOutcome: "二軍續留邊緣／球團耐心下降",
    developmentResult: "職業名額開始計算你的替代成本",
    developmentDetail: "年紀與新秀加入讓球團不再只看潛力。下一次評估可能直接決定釋出或轉隊。"
  },
  {
    careerExit: "大學棒球", marketScore: 11, injuryRisk: 0,
    routeKey: "college", currentIdentity: "college", outcomeCode: "college-draft-window",
    marketOutcome: "大卒選秀追蹤名單",
    developmentResult: "四年成長讓球探重新回來",
    developmentDetail: "大學路線的價值取決於二十二歲時能否立即使用，而不再只是晚熟想像。"
  },
  {
    careerExit: "大學棒球", marketScore: 10, injuryRisk: 0,
    routeKey: "college", currentIdentity: "college", outcomeCode: "college-uncertain",
    marketOutcome: "大學主力／落選風險並存",
    developmentResult: "大學延長了時間，尚未消除市場疑問",
    developmentDetail: "大學路線的價值取決於二十二歲時能否立即使用，而不再只是晚熟想像。"
  },
  {
    careerExit: "業餘／社會人棒球", marketScore: 10, injuryRisk: 0,
    routeKey: "amateur", currentIdentity: "amateur", outcomeCode: "amateur-professional-window",
    marketOutcome: "晚成選秀／職業測試邀請",
    developmentResult: "有限曝光終於形成職業入口",
    developmentDetail: "職業機會不一定出現，但經濟與棒球不再只能二選一。"
  },
  {
    careerExit: "業餘／社會人棒球", marketScore: 9, injuryRisk: 0,
    routeKey: "amateur", currentIdentity: "amateur", outcomeCode: "amateur-stable",
    marketOutcome: "業餘主力與穩定工作",
    developmentResult: "你建立了能長期留在棒球裡的生活",
    developmentDetail: "職業機會不一定出現，但經濟與棒球不再只能二選一。"
  },
  {
    careerExit: "復健與生涯暫停", marketScore: 0, injuryRisk: 4,
    routeKey: "rehab", currentIdentity: "rehab", outcomeCode: "rehab-player-reentry",
    marketOutcome: "復出測試／業餘隊邀請",
    developmentResult: "你重新取得以球員身分被評估的資格",
    developmentDetail: "復健結果同時打開球員測試、基層協助與棒球第二職涯的可能。"
  },
  {
    careerExit: "復健與生涯暫停", marketScore: 99, injuryRisk: 5,
    routeKey: "rehab", currentIdentity: "rehab", outcomeCode: "rehab-second-career",
    marketOutcome: "持續復健／轉向第二角色",
    developmentResult: "回到原本球員樣貌不再是唯一答案",
    developmentDetail: "復健結果同時打開球員測試、基層協助與棒球第二職涯的可能。"
  }
];

verify("1. Resolver 只公開分類、舊版遷移與持久結果驗證 API", JSON.stringify(Object.keys(resolver)) === JSON.stringify([
  "resolve", "resolveLegacyOutcome", "validatePersistedOutcome"
]));

const network = contract.getCareerNetwork();
verify("2. CareerSpineContract 提供兩個高卒與大學、業餘、復健共五個精確出口", network.initialRoutes.flatMap(route => route.careerExits).length === 5);

const resolvedCases = cases.map(testCase => ({ testCase, result: resolver.resolve(testCase) }));
verify("3. 八種既有結果全部 resolved", resolvedCases.every(item => item.result.resolved && item.result.status === "resolved"));
verify("4. 八種 outcome code、routeKey 與 currentIdentity 精確符合契約", resolvedCases.every(({ testCase, result }) =>
  result.routeKey === testCase.routeKey &&
  result.currentIdentity === testCase.currentIdentity &&
  result.outcomeCode === testCase.outcomeCode
));
verify("5. 八組既有玩家可見結算文字完全不變", resolvedCases.every(({ testCase, result }) =>
  result.marketOutcome === testCase.marketOutcome &&
  result.developmentResult === testCase.developmentResult &&
  result.developmentDetail === testCase.developmentDetail
));
verify("6. 兩種高卒出口在相同分數使用同一 professional outcome family", [
  "高卒選秀・中後段指名候選", "高卒選秀・落選／培訓測試"
].every(careerExit => resolver.resolve({ careerExit, marketScore: 12, injuryRisk: 0 }).outcomeCode === "professional-competitive"));

const boundaryCases = [
  ["高卒選秀・中後段指名候選", 11.999, 0, "professional-roster-risk"],
  ["高卒選秀・中後段指名候選", 12, 0, "professional-competitive"],
  ["大學棒球", 10.999, 0, "college-uncertain"],
  ["大學棒球", 11, 0, "college-draft-window"],
  ["業餘／社會人棒球", 9.999, 0, "amateur-stable"],
  ["業餘／社會人棒球", 10, 0, "amateur-professional-window"],
  ["復健與生涯暫停", 999, 4, "rehab-player-reentry"],
  ["復健與生涯暫停", -999, 5, "rehab-second-career"]
];
verify("7. draft／college／amateur／rehab 邊界行為精確鎖定", boundaryCases.every(([careerExit, marketScore, injuryRisk, expected]) =>
  resolver.resolve({ careerExit, marketScore, injuryRisk }).outcomeCode === expected
));
verify("8. 復健分類只依 injuryRisk，不受 marketScore 高低改寫", resolver.resolve({ careerExit: "復健與生涯暫停", marketScore: -999, injuryRisk: 4 }).outcomeCode === "rehab-player-reentry"
  && resolver.resolve({ careerExit: "復健與生涯暫停", marketScore: 999, injuryRisk: 5 }).outcomeCode === "rehab-second-career");

const invalidInputs = [
  null,
  {},
  { careerExit: "", marketScore: 12, injuryRisk: 0 },
  { careerExit: "__broken__", marketScore: 12, injuryRisk: 0 },
  { careerExit: { value: "大學棒球" }, marketScore: 11, injuryRisk: 0 },
  { careerExit: ["大學棒球"], marketScore: 11, injuryRisk: 0 },
  { careerExit: "大學棒球", marketScore: "11", injuryRisk: 0 },
  { careerExit: "大學棒球", marketScore: NaN, injuryRisk: 0 },
  { careerExit: "大學棒球", marketScore: Infinity, injuryRisk: 0 },
  { careerExit: "大學棒球", marketScore: 11, injuryRisk: "0" },
  { careerExit: "大學棒球", marketScore: 11, injuryRisk: NaN }
];
verify("9. 無效 candidate、careerExit、marketScore 與 injuryRisk 全部 unresolved", invalidInputs.every(input => {
  let result;
  let threw = false;
  try { result = resolver.resolve(input); } catch (_error) { threw = true; }
  return !threw && result && !result.resolved && result.status === "unresolved";
}));

const readonlyInput = { careerExit: "大學棒球", marketScore: 11, injuryRisk: 2, marker: { keep: true } };
const readonlyBefore = JSON.stringify(readonlyInput);
const contractBefore = JSON.stringify(contract.getCareerNetwork());
const readonlyResult = resolver.resolve(readonlyInput);
verify("10. Resolver 對輸入物件 zero mutation", JSON.stringify(readonlyInput) === readonlyBefore);
verify("11. Resolver 對 CareerSpineContract zero mutation", JSON.stringify(contract.getCareerNetwork()) === contractBefore);
verify("12. resolved 與 unresolved 結果均 deep frozen", isDeepFrozen(readonlyResult) && isDeepFrozen(resolver.resolve({ careerExit: "", marketScore: 0, injuryRisk: 0 })));
verify("13. 相同輸入重跑 deterministic", JSON.stringify(resolver.resolve(readonlyInput)) === JSON.stringify(resolver.resolve(clone(readonlyInput))));

verify("14. 八個 legacy canonical marketOutcome 都能依正確路線遷移", cases.every(testCase => {
  const migrated = resolver.resolveLegacyOutcome(testCase);
  return migrated.resolved && migrated.outcomeCode === testCase.outcomeCode && migrated.currentIdentity === testCase.currentIdentity;
}));
verify("15. legacy 中文結果與 careerExit 路線矛盾時不猜測", !resolver.resolveLegacyOutcome({
  careerExit: "大學棒球",
  marketOutcome: "一軍短期升格／正式名單競爭"
}).resolved);
verify("16. 未知 legacy 中文結果 unresolved", !resolver.resolveLegacyOutcome({ careerExit: "大學棒球", marketOutcome: "未知舊結果" }).resolved);

verify("17. 八個 canonical persisted snapshots 全部可驗證", cases.every(testCase => resolver.validatePersistedOutcome({
  careerExit: testCase.careerExit,
  age22OutcomeCode: testCase.outcomeCode,
  marketOutcome: testCase.marketOutcome,
  developmentResult: testCase.developmentResult,
  developmentDetail: testCase.developmentDetail
}).resolved));
verify("18. persisted code 缺失、未知、跨路線與文字矛盾全部 unresolved", [
  resolver.validatePersistedOutcome({ careerExit: "大學棒球", age22OutcomeCode: "" }),
  resolver.validatePersistedOutcome({ careerExit: "大學棒球", age22OutcomeCode: "__broken__" }),
  resolver.validatePersistedOutcome({ careerExit: "大學棒球", age22OutcomeCode: "amateur-stable" }),
  resolver.validatePersistedOutcome({
    careerExit: "大學棒球",
    age22OutcomeCode: "college-draft-window",
    marketOutcome: "業餘主力與穩定工作",
    developmentResult: "四年成長讓球探重新回來",
    developmentDetail: "大學路線的價值取決於二十二歲時能否立即使用，而不再只是晚熟想像。"
  })
].every(result => !result.resolved));

const resolverSource = fs.readFileSync(path.join(root, "career-age22-outcome-resolver.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
const settlementStart = scriptSource.indexOf("function evaluateDevelopmentYears()");
const settlementEnd = scriptSource.indexOf("function showCurrentEvent()", settlementStart);
const settlementSource = scriptSource.slice(settlementStart, settlementEnd);
verify("19. Resolver 只依賴 CareerSpineContract，不接觸 Player、Runtime、UI、Save、Storage、RNG 或時間", !/CareerRejoinContract|AdultCareerSaveAdmission|CareerDevelopmentRuntimeResolver|CareerDevelopmentProgression|\bplayer\s*[.=]|document\.|localStorage|sessionStorage|saveGame|loadGame|showStory|showCurrentEvent|Math\.random|\bDate\b/.test(resolverSource));
verify("20. Resolver 使用 CareerSpineContract initialRoutes exact mapping，不使用 startsWith 高卒", resolverSource.includes("getCareerNetwork")
  && resolverSource.includes("initialRoutes")
  && resolverSource.includes("route.careerExits.includes(careerExit)")
  && !resolverSource.includes('startsWith("高卒")'));
verify("21. 12／11／10／injuryRisk 4 的分類門檻已從 script.js 結算函式移除", !/>=\s*12|>=\s*11|>=\s*10|<=\s*4/.test(settlementSource));
verify("22. Runtime 結算不解析既有中文結果", !/marketOutcome\s*===|marketOutcome\s*==/.test(settlementSource));
verify("23. Player 只持久化 age22OutcomeCode，沒有 currentIdentity 複本", /age22OutcomeCode:\s*""/.test(playerSource)
  && !/currentCareerIdentity|adultCareerIdentity|currentIdentity\s*:/.test(playerSource));

const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "career-spine-contract.js", "career-transition-resolver.js",
  "career-transition-commit.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js",
  "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];

function makeRuntimeContext() {
  const nodes = new Map();
  const context = vm.createContext({
    console,
    document: {
      body: { classList: { toggle() {} } },
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, {
          innerHTML: "", value: "", style: {}, dataset: {},
          classList: { add() {}, remove() {}, toggle() {} },
          focus() {}, setAttribute() {}, removeAttribute() {}
        });
        return nodes.get(id);
      },
      querySelector() { return null; },
      querySelectorAll() { return []; }
    },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { setTimeout(callback) { callback(); } },
    module: { exports: {} }
  });
  runtimeFiles.forEach(file => vm.runInContext(
    fs.readFileSync(path.join(root, file), "utf8"),
    context,
    { filename: file }
  ));
  return context;
}

function runtimeSettlement(context, careerExit, marketScore, injuryRisk) {
  vm.runInContext(`
    player = createInitialPlayer("4.12 Runtime");
    Object.assign(player, {
      chapter: "發展期",
      age: 21,
      careerExit: ${JSON.stringify(careerExit)},
      developmentStep: 7,
      scoutEvaluation: ${marketScore},
      recentPerformance: 0,
      reputation: 0,
      exposure: 0,
      seasonPosition: ""
    });
    player.body.injuryRisk = ${injuryRisk};
    player.baseballSkills.batting = 0;
  `, context);
  const beforeCalls = vm.runInContext("JSON.stringify(player)", context);
  const returned = vm.runInContext("evaluateDevelopmentYears()", context);
  const state = JSON.parse(vm.runInContext("JSON.stringify(player)", context));
  return { returned, state, beforeCalls };
}

const runtime = makeRuntimeContext();
const runtimeCases = [
  runtimeSettlement(runtime, "高卒選秀・中後段指名候選", 12, 0),
  runtimeSettlement(runtime, "大學棒球", 11, 0),
  runtimeSettlement(runtime, "業餘／社會人棒球", 10, 0),
  runtimeSettlement(runtime, "復健與生涯暫停", 0, 5)
];
verify("24. 四條 route 的實際 settlement 全部成功進入二十二歲小結", runtimeCases.every(item => item.returned === true && item.state.age === 22 && item.state.chapter === "二十二歲職涯小結"));
verify("25. 四條 route 的實際 settlement 全部持久化正確 code 與既有文案", runtimeCases.every(item => item.state.age22OutcomeCode && item.state.marketOutcome && item.state.developmentResult && item.state.developmentDetail));

vm.runInContext(`
  player = createInitialPlayer("4.12 Fail Closed");
  Object.assign(player, { chapter: "發展期", age: 21, careerExit: "__broken__", developmentStep: 7 });
  var __beforeFailedSettlement = JSON.stringify(player);
  var __failedSettlementResult = evaluateDevelopmentYears();
`, runtime);
verify("26. 無法分類的實際 settlement fail closed 且不 fabricated outcome", vm.runInContext("__failedSettlementResult === false && JSON.stringify(player) === __beforeFailedSettlement", runtime));

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const loadOrder = [
  "career-spine-contract.js",
  "career-age22-outcome-resolver.js",
  "career-save-admission.js",
  "story.js",
  "save.js",
  "script.js"
].map(file => html.indexOf(`<script src="${file}"></script>`));
verify("27. Browser 依 Contract → Age22 Resolver → Admission → Story／Save／Script 載入", loadOrder.every((position, index) => position >= 0 && (index === 0 || position > loadOrder[index - 1])));
verify("28. CareerRejoinContract 未被 Resolver 或 Gameplay settlement 消費", !resolverSource.includes("CareerRejoinContract") && !settlementSource.includes("CareerRejoinContract"));
verify("29. Resolver 不回傳 eligibility、nextRoutes 或 availableChoices", !/eligibleEdges|nextRoutes|availableChoices/.test(resolverSource));
verify("30. Resolver 沒有新增 chapter、event 或 actual edge mutation", !/player\.chapter|nextChapters|actualEdges\s*=|eventIds\s*=/.test(resolverSource));

console.log(`\nArchitecture Sprint 4.12 Age-22 Career Outcome Resolver：${passed}/${passed} 通過`);
