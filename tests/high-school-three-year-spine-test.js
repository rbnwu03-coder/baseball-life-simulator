const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const files = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "career-spine-contract.js", "story.js", "save.js", "script.js"
];

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function makeContext(options = {}) {
  const nodes = new Map();
  const storage = new Map();
  const timers = [];
  const document = {
    body: { classList: { toggle() {} } },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        innerHTML: "",
        value: id === "nameInput" ? "高二測試球員" : "",
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
    window: {
      setTimeout(callback) {
        if (options.deferTimers) timers.push(callback);
        else callback();
      }
    },
    module: { exports: {} }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  return { context, storage, timers, nodes };
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

function resetToYearTwo(context, overrides = {}) {
  evaluate(context, `player = createInitialPlayer("高二測試球員"); Object.assign(player, ${JSON.stringify({
    chapter: "青棒第二年",
    age: 17,
    highSchoolYearTwoStep: 0,
    highSchoolTeamRole: "多位置工具人與後段輪替",
    seasonPosition: "內野手",
    careerExit: "",
    ...overrides
  })});`);
}

function fingerprint(context, ids) {
  const data = ids.map(id => {
    const event = evaluate(context, `getEvent(${JSON.stringify(id)})`);
    return {
      id,
      choices: event.choices.map(choice => ({
        text: choice.text,
        ...Object.fromEntries(
          Object.keys(choice)
            .filter(key => key === "effects" || key.endsWith("Effects"))
            .sort()
            .map(key => [key, choice[key]])
        )
      }))
    };
  });
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

function playYearTwoRoute(context, choiceIndexes, setup = "") {
  resetToYearTwo(context);
  if (setup) evaluate(context, setup);
  yearTwoIds.forEach((eventId, step) => evaluate(context, `choose(${JSON.stringify(eventId)}, ${choiceIndexes[step]})`));
  return parse(context, `({
    chapter: player.chapter,
    result: player.highSchoolYearTwoResult,
    detail: player.highSchoolYearTwoDetail,
    role: player.highSchoolTeamRole,
    coachTrust: player.relationships.coachTrust,
    injuryRisk: player.body.injuryRisk,
    pain: player.body.pain,
    flags: player.flags
  })`);
}

const yearTwoIds = [
  "high_school_year_two_roster_reset",
  "high_school_year_two_role_test",
  "high_school_year_two_spring_game",
  "high_school_year_two_depth_chart",
  "high_school_year_two_body_load",
  "high_school_year_two_team_responsibility",
  "high_school_year_two_autumn_stage",
  "high_school_year_two_senior_plan"
];
const highOneIds = [
  "high_school_intro", "high_school_load", "high_school_life", "high_school_call_home",
  "high_school_role", "high_school_long_bench", "high_school_showcase", "high_school_scout_feedback"
];
const highThreeIds = [
  "critical_offseason", "critical_tournament", "critical_public_attention", "critical_injury",
  "critical_scout_interview", "critical_family", "critical_farewell", "critical_exit_choice"
];

const { context, storage, nodes } = makeContext();

verify("1. Player Schema 只新增三個高二持久欄位", [
  "highSchoolYearTwoStep", "highSchoolYearTwoResult", "highSchoolYearTwoDetail"
].every(key => Object.prototype.hasOwnProperty.call(parse(context, "createInitialPlayer('測試')"), key)));
verify("2. SAVE_VERSION 已由 12 升級為 13", evaluate(context, "SAVE_VERSION === 13 && player.saveVersion === 13"));
verify("3. localStorage key 保持不變", evaluate(context, "SAVE_KEY") === "baseballLifeRpgSave");

evaluate(context, `var __legacyV12 = createInitialPlayer("v12"); __legacyV12.saveVersion = 12;
  delete __legacyV12.highSchoolYearTwoStep; delete __legacyV12.highSchoolYearTwoResult; delete __legacyV12.highSchoolYearTwoDetail;
  var __migratedV12 = normalizeSave(__legacyV12);`);
verify("4. v12 存檔補入高二預設欄位", evaluate(context, "__migratedV12.highSchoolYearTwoStep === 0 && __migratedV12.highSchoolYearTwoResult === '' && __migratedV12.highSchoolYearTwoDetail === ''"));
verify("5. v12 遷移後標記為 v13", evaluate(context, "__migratedV12.saveVersion === 13"));

evaluate(context, `player = normalizeSave(Object.assign(createInitialPlayer("舊高一結果"), {
  saveVersion: 12, chapter: "青棒第一年小結", age: 16, highSchoolResult: "舊結果", highSchoolDetail: "舊內容"
}));`);
verify("6. v12 高一小結載入後仍停在原結果事件", evaluate(context, "getCurrentEventId() === 'high_school_result'"));
evaluate(context, "choose('high_school_result', 0)");
verify("7. v12 高一小結可接入新的高二入口", evaluate(context, "player.chapter === '青棒第二年' && player.age === 17 && getCurrentEventId() === 'high_school_year_two_roster_reset'"));

evaluate(context, `player = normalizeSave(Object.assign(createInitialPlayer("舊高三"), { saveVersion: 12, chapter: "青棒關鍵年", age: 18, criticalYearStep: 3 }));`);
verify("8. v12 高三存檔不會倒退到高二", evaluate(context, "player.chapter === '青棒關鍵年' && getCurrentEventId() === 'critical_injury'"));
evaluate(context, `player = normalizeSave(Object.assign(createInitialPlayer("舊成年"), { saveVersion: 12, chapter: "發展期", age: 20, developmentStep: 2, careerExit: "大學棒球" }));`);
verify("9. v12 成年存檔不會倒退到高中", evaluate(context, "player.chapter === '發展期' && getCurrentEventId() === 'development_mentor'"));

resetToYearTwo(context, { highSchoolYearTwoStep: 3 });
evaluate(context, "saveGame(); player = createInitialPlayer('覆蓋'); loadGame()");
verify("10. v13 高二 step 可完整 round-trip", evaluate(context, "player.highSchoolYearTwoStep === 3 && getCurrentEventId() === 'high_school_year_two_depth_chart'"));
resetToYearTwo(context, {
  chapter: "青棒第二年小結", highSchoolYearTwoStep: 8,
  highSchoolYearTwoResult: "全年角色成立", highSchoolYearTwoDetail: "春秋都留下證明。"
});
evaluate(context, "saveGame(); player = createInitialPlayer('覆蓋'); loadGame()");
verify("11. v13 高二 result 與 detail 可完整 round-trip", evaluate(context, "player.highSchoolYearTwoResult === '全年角色成立' && player.highSchoolYearTwoDetail === '春秋都留下證明。'"));

resetToYearTwo(context);
verify("12. 高二入口固定為 17 歲與 step 0", evaluate(context, "player.age === 17 && player.highSchoolYearTwoStep === 0"));
verify("13. 高二八個 step 依固定順序路由", yearTwoIds.every((id, step) => {
  resetToYearTwo(context, { highSchoolYearTwoStep: step });
  return evaluate(context, "getCurrentEventId()") === id;
}));
verify("14. 高二八個事件與小結都可由 getEvent 取得", [...yearTwoIds, "high_school_year_two_result"].every(id => Boolean(evaluate(context, `getEvent(${JSON.stringify(id)})`))));
verify("15. 高二每個事件都提供具體選擇", yearTwoIds.every(id => {
  const event = evaluate(context, `getEvent(${JSON.stringify(id)})`);
  return event.choices.length >= 3 && event.choices.every(choice => typeof choice.text === "string" && choice.text.length > 4);
}));

const effectChecks = [];
yearTwoIds.forEach((id, step) => {
  resetToYearTwo(context, { highSchoolYearTwoStep: step });
  const before = evaluate(context, "JSON.stringify(player)");
  evaluate(context, `choose(${JSON.stringify(id)}, 0)`);
  const after = evaluate(context, "JSON.stringify(player)");
  effectChecks.push({
    id,
    changed: before !== after,
    progressed: step === 7
      ? evaluate(context, "player.chapter === '青棒第二年小結' && player.highSchoolYearTwoStep === 8")
      : evaluate(context, `player.chapter === "青棒第二年" && player.highSchoolYearTwoStep === ${step + 1}`)
  });
});
verify("16. 高二每幕選擇都會實際套用既有 Effects", effectChecks.every(item => item.changed));
verify("17. 高二每幕選擇只推進一個 step", effectChecks.every(item => item.progressed));

const deferred = makeContext({ deferTimers: true });
resetToYearTwo(deferred.context);
const beforeDouble = parse(deferred.context, "({ observe: player.observe, step: player.highSchoolYearTwoStep, flags: player.flags.length })");
evaluate(deferred.context, "choose('high_school_year_two_roster_reset', 1); choose('high_school_year_two_roster_reset', 1)");
const afterDouble = parse(deferred.context, "({ observe: player.observe, step: player.highSchoolYearTwoStep, flags: player.flags.length })");
verify("18. 快速重複點擊不會重複套用效果", afterDouble.observe === beforeDouble.observe + 1 && afterDouble.flags === beforeDouble.flags + 1);
verify("19. 快速重複點擊不會重複推進", afterDouble.step === 1);

resetToYearTwo(context, { highSchoolYearTwoStep: 2 });
const renderGameplaySnapshot = "JSON.stringify({ step: player.highSchoolYearTwoStep, ballSense: player.ballSense, observe: player.observe, confidence: player.confidence, skills: player.baseballSkills, body: player.body, relationships: player.relationships, flags: player.flags, memories: player.memories, careerExit: player.careerExit })";
const beforeRender = evaluate(context, renderGameplaySnapshot);
evaluate(context, "showCurrentEvent(); showCurrentEvent(); updateStatus()");
verify("20. 重複 Render 不重複套用 Gameplay 狀態", beforeRender === evaluate(context, renderGameplaySnapshot));

resetToYearTwo(context, { highSchoolYearTwoStep: 8 });
const firstEvaluation = evaluate(context, "evaluateHighSchoolYearTwo()");
const resultAfterFirst = evaluate(context, "JSON.stringify(player)");
const secondEvaluation = evaluate(context, "evaluateHighSchoolYearTwo()");
verify("21. 高二小結只會正式產生一次", firstEvaluation === true && secondEvaluation === false && resultAfterFirst === evaluate(context, "JSON.stringify(player)"));
verify("22. 高二小結 result 與 detail 都不是空白", evaluate(context, "Boolean(player.highSchoolYearTwoResult.trim()) && Boolean(player.highSchoolYearTwoDetail.trim())"));

resetToYearTwo(context);
for (let step = 0; step < yearTwoIds.length; step += 1) evaluate(context, `choose(${JSON.stringify(yearTwoIds[step])}, 0)`);
verify("23. 八幕完成後進入青棒第二年小結", evaluate(context, "player.chapter === '青棒第二年小結' && getCurrentEventId() === 'high_school_year_two_result'"));
verify("24. 高二整段不會提前寫入 careerExit", evaluate(context, "player.careerExit === ''"));
evaluate(context, "choose('high_school_year_two_result', 0)");
verify("25. 高二小結正式接回既有高三入口", evaluate(context, "player.chapter === '青棒關鍵年' && player.age === 18 && player.criticalYearStep === 0 && getCurrentEventId() === 'critical_offseason'"));

for (let step = 0; step < highThreeIds.length; step += 1) evaluate(context, `choose(${JSON.stringify(highThreeIds[step])}, 0)`);
verify("26. 既有高三八幕仍可產生生涯出口", evaluate(context, "player.chapter === '青棒生涯出口' && Boolean(player.criticalYearResult) && Boolean(player.careerExit)"));

evaluate(context, "loadTestBookmark('highSchoolYearTwo')");
verify("27. 高二 Debug 書籤可直接進入合法入口", evaluate(context, "player.chapter === '青棒第二年' && player.age === 17 && player.highSchoolYearTwoStep === 0 && getCurrentEventId() === 'high_school_year_two_roster_reset'"));
evaluate(context, "updateStatus()");
verify("28. 高二時間標籤顯示八幕進度", nodes.get("time").innerHTML.includes("青棒第二年・第 1／8 階段"));
verify("29. 高二狀態面板建立當下、短期與章節目標", evaluate(context, "player.goalState.current?.id === 'high_school_year_two_reset' && player.goalState.short?.id === 'high_school_year_two_proof' && player.goalState.chapter?.id === 'high_school_year_two_plan'"));
verify("30. 高二 aspiration guide 已連接", evaluate(context, "getCurrentAspiration().current.includes('高一建立的角色')"));
verify("31. 高二小結具有下一章期待 hook", evaluate(context, "getHopeHook('high_school_year_two_result').text.includes('高三第一張訓練表')"));
verify("32. Skill growth audit 正式納入高二事件集合", fs.readFileSync(path.join(root, "script.js"), "utf8").includes("highSchoolEvents, highSchoolYearTwoEvents, criticalYearEvents"));

const springPresentation = parse(context, "CompetitionPresentation.getValidationEvent('high_school_year_two_spring_game')");
const autumnPresentation = parse(context, "CompetitionPresentation.getValidationEvent('high_school_year_two_autumn_stage')");
verify("33. 春季聯賽登錄為 Validation Event", springPresentation.category === "validation-event" && springPresentation.typeId === "official_league");
verify("34. 秋季盃賽登錄為 Validation Event", autumnPresentation.category === "validation-event" && autumnPresentation.typeId === "tournament");
verify("35. 高二 Competition Presentation 不自行管理比分", springPresentation.showScore === false && autumnPresentation.showScore === false);

const contractNodes = parse(context, "CareerSpineContract.getNodes()");
const knownGaps = parse(context, "CareerSpineContract.getKnownGaps()");
verify("36. Career Spine 節點由 20 增至 22", contractNodes.length === 22);
verify("37. 高二與高二小結 Contract node ID 唯一存在", ["high-school-year-two", "high-school-year-two-result"].every(id => contractNodes.filter(node => node.id === id).length === 1));
verify("38. high-school-year-two-missing 已從已知缺口移除", !knownGaps.some(item => item.id === "high-school-year-two-missing"));

resetToYearTwo(context, { highSchoolYearTwoStep: 0 });
const validSnapshot = parse(context, "CareerSpineContract.getCareerSpineSnapshot(player)");
verify("39. 高二 step 0 Snapshot 可辨識且對應真實事件", validSnapshot.status === "recognized" && validSnapshot.effectiveEventIds[0] === "high_school_year_two_roster_reset");
resetToYearTwo(context, { age: 16 });
verify("40. 高二錯誤年齡回報 inconsistent", evaluate(context, "CareerSpineContract.getCareerSpineSnapshot(player).status === 'inconsistent'"));
resetToYearTwo(context, { highSchoolYearTwoStep: 8 });
verify("41. 高二越界 step 回報 inconsistent", evaluate(context, "CareerSpineContract.getCareerSpineSnapshot(player).issues.some(item => item.code === 'progress-out-of-contract')"));
resetToYearTwo(context, { highSchoolYearTwoResult: "提前結果", highSchoolYearTwoDetail: "提前內容" });
verify("42. 結果提前存在於高二主章會回報 inconsistent", evaluate(context, "CareerSpineContract.getCareerSpineSnapshot(player).issues.some(item => item.code === 'high-school-year-two-result-state-mismatch')"));
resetToYearTwo(context, { chapter: "青棒第二年小結", highSchoolYearTwoStep: 8 });
verify("43. 高二小結缺少 result／detail 會回報 inconsistent", evaluate(context, "CareerSpineContract.getCareerSpineSnapshot(player).issues.some(item => item.code === 'high-school-year-two-result-missing')"));
resetToYearTwo(context, {
  chapter: "青棒第二年小結", highSchoolYearTwoStep: 8,
  highSchoolYearTwoResult: "合法結果", highSchoolYearTwoDetail: "合法內容"
});
verify("44. 合法高二小結 Snapshot 可辨識", evaluate(context, "CareerSpineContract.getCareerSpineSnapshot(player).status === 'recognized' && getCurrentEventId() === 'high_school_year_two_result'"));

verify("45. 高一八幕選項與效果指紋維持 Sprint 前基線", fingerprint(context, highOneIds) === "98fd7fa4bcfac6a8dc3ae2ae3e6c4ce9fbfaf595198d664f4187da7fa0ee3d78");
verify("46. 高三八幕選項與效果指紋維持 Sprint 前基線", fingerprint(context, highThreeIds) === "62efa6c57ea795cd060ca7c34aefe89d3481d66ae085a822bbde4fbd90109f44");
verify("47. 高二事件沒有直接寫入 careerExit", yearTwoIds.every(id => evaluate(context, `getEvent(${JSON.stringify(id)}).choices.every(choice => !Object.prototype.hasOwnProperty.call(choice, 'careerExit'))`)));
verify("48. 高二事件沒有新增 roll 或隱藏 outcome 欄位", yearTwoIds.every(id => evaluate(context, `getEvent(${JSON.stringify(id)}).choices.every(choice => !('roll' in choice) && !('outcome' in choice))`)));

const establishedRoute = playYearTwoRoute(context, [0, 0, 0, 0, 0, 1, 0, 0]);
verify("49. 主守位的春秋證明與高三計畫一致時可抵達全年驗證成功", establishedRoute.result === "你的球隊用途通過了一整年的第二次驗證" && establishedRoute.role === "內野手專職競爭者");

const coachRoute = playYearTwoRoute(context, [2, 1, 0, 0, 0, 0, 0, 3], "player.relationships.coachTrust = 2");
verify("50. 角色證明不一致但教練信任足夠時可抵達保留任務", coachRoute.result === "教練願意繼續交付任務，但場上證明仍不完整" && coachRoute.coachTrust >= 8);

const unstableRoute = playYearTwoRoute(context, [0, 2, 1, 2, 1, 2, 0, 2]);
verify("51. 角色證明不一致且教練信任不足時可抵達定位未穩", unstableRoute.result === "高二結束時，角色仍在重新排列" && unstableRoute.coachTrust < 8);

const highRiskRoute = playYearTwoRoute(context, [0, 2, 2, 2, 2, 2, 1, 2], "player.body.injuryRisk = 6; player.body.pain = 3");
verify("52. 傷病風險 6、疼痛 3 且帶傷硬撐的合法流程可抵達健康風險小結", highRiskRoute.result === "角色仍在，身體負荷先成為高三問題" && highRiskRoute.injuryRisk >= 8 && highRiskRoute.pain >= 5);

const utilityPriorityRoute = playYearTwoRoute(context, [1, 1, 1, 1, 0, 0, 2, 1]);
const priorityRouteOutcomes = [establishedRoute, utilityPriorityRoute, highRiskRoute].map(route => `${route.result}|${route.detail}`);
verify("53. 三條人工優先路線不會無條件得到相同小結", new Set(priorityRouteOutcomes).size === 3);

const autumnPositionExpectations = {
  "內野手": ["封住二壘", "滾地球"],
  "外野手": ["接殺", "飛球"],
  "捕手": ["不死三振", "打者揮空"],
  "投手": ["正面滾地", "投手板"]
};
const autumnPositionChoicesAreValid = Object.entries(autumnPositionExpectations).every(([position, fragments]) => {
  resetToYearTwo(context, { highSchoolYearTwoStep: 6, seasonPosition: position });
  const choice = evaluate(context, "getEvent('high_school_year_two_autumn_stage').choices[0]");
  return choice.text.includes(fragments[0]) && choice.memory.includes(fragments[1]);
});
verify("54. 捕手、投手、內野手與外野手各自看到成立的秋季守備行動", autumnPositionChoicesAreValid);

console.log(`\nArchitecture Sprint 4.2 High School Three-Year Spine：${passed}/${passed} 通過`);
