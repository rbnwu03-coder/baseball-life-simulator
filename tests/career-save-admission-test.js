const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const boundaryFiles = [
  "player.js",
  "career-spine-contract.js",
  "career-transition-runtime-resolver.js",
  "career-development-runtime-resolver.js",
  "career-age22-outcome-resolver.js",
  "career-save-admission.js"
];

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function makeContext(files = boundaryFiles) {
  const storage = new Map();
  const nodes = new Map();
  const notices = [];
  const counters = { render: 0, storageWrites: 0, storageDeletes: 0 };
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { innerHTML: "", style: { display: "block" } });
      return nodes.get(id);
    }
  };
  const context = vm.createContext({
    console,
    document,
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { counters.storageWrites += 1; storage.set(key, value); },
      removeItem(key) { counters.storageDeletes += 1; storage.delete(key); }
    },
    showNotice(message, type) { notices.push({ message, type }); },
    showCurrentEvent() {
      counters.render += 1;
      context.__lastRenderedEventId = context.getCurrentEventId();
    },
    window: { setTimeout(callback) { callback(); } },
    module: { exports: {} }
  });
  files.forEach(file => vm.runInContext(
    fs.readFileSync(path.join(root, file), "utf8"),
    context,
    { filename: file }
  ));
  return { context, storage, nodes, notices, counters };
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

function fresh(context, overrides = {}) {
  evaluate(context, `var __fixture = createInitialPlayer("4.10 測試球員"); Object.assign(__fixture, ${JSON.stringify(overrides)});`);
  return parse(context, "__fixture");
}

function highSchoolExit(context, careerExit = "大學棒球", overrides = {}) {
  return fresh(context, Object.assign({
    chapter: "青棒生涯出口",
    age: 18,
    criticalYearStep: 8,
    criticalYearResult: "畢業評估完成",
    criticalYearDetail: "已取得成年入口。",
    careerExit
  }, overrides));
}

function transitionState(context, careerExit = "大學棒球", transitionStep = 0, overrides = {}) {
  return fresh(context, Object.assign({
    chapter: "生涯轉換期",
    age: 18,
    careerExit,
    transitionStep,
    transitionResult: "",
    transitionDetail: ""
  }, overrides));
}

function transitionResult(context, careerExit = "大學棒球", overrides = {}) {
  return fresh(context, Object.assign({
    chapter: "生涯轉換期小結",
    age: 18,
    careerExit,
    transitionStep: 5,
    transitionResult: "轉換完成",
    transitionDetail: "已完成五幕生涯轉換。"
  }, overrides));
}

function developmentState(context, careerExit = "大學棒球", developmentStep = 2, overrides = {}) {
  return fresh(context, Object.assign({
    chapter: "發展期",
    age: developmentStep <= 3 ? 20 : 21,
    careerExit,
    developmentStep,
    developmentResult: "",
    developmentDetail: "",
    marketOutcome: ""
  }, overrides));
}

function age22Result(context, careerExit = "大學棒球", overrides = {}) {
  const fixture = {
    "高卒選秀・中後段指名候選": {
      age22OutcomeCode: "professional-competitive",
      marketOutcome: "一軍短期升格／正式名單競爭",
      developmentResult: "職業體系開始把你當成可用戰力",
      developmentDetail: "你仍不是穩定一軍球員，但角色、健康與近期表現已足以換到真正的升格機會。"
    },
    "高卒選秀・落選／培訓測試": {
      age22OutcomeCode: "professional-roster-risk",
      marketOutcome: "二軍續留邊緣／球團耐心下降",
      developmentResult: "職業名額開始計算你的替代成本",
      developmentDetail: "年紀與新秀加入讓球團不再只看潛力。下一次評估可能直接決定釋出或轉隊。"
    },
    "大學棒球": {
      age22OutcomeCode: "college-draft-window",
      marketOutcome: "大卒選秀追蹤名單",
      developmentResult: "四年成長讓球探重新回來",
      developmentDetail: "大學路線的價值取決於二十二歲時能否立即使用，而不再只是晚熟想像。"
    },
    "業餘／社會人棒球": {
      age22OutcomeCode: "amateur-professional-window",
      marketOutcome: "晚成選秀／職業測試邀請",
      developmentResult: "有限曝光終於形成職業入口",
      developmentDetail: "職業機會不一定出現，但經濟與棒球不再只能二選一。"
    },
    "復健與生涯暫停": {
      age22OutcomeCode: "rehab-player-reentry",
      marketOutcome: "復出測試／業餘隊邀請",
      developmentResult: "你重新取得以球員身分被評估的資格",
      developmentDetail: "復健結果同時打開球員測試、基層協助與棒球第二職涯的可能。"
    }
  }[careerExit] || {};
  return fresh(context, Object.assign({
    chapter: "二十二歲職涯小結",
    age: 22,
    careerExit,
    developmentStep: 7,
    ...fixture
  }, overrides));
}

function terminalState(context, careerExit = "大學棒球", overrides = {}) {
  return age22Result(context, careerExit, Object.assign({
    chapter: "垂直切片完成",
    completed: true
  }, overrides));
}

function isDeepFrozen(value) {
  if (!value || typeof value !== "object") return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeepFrozen);
}

const { context } = makeContext();
const admission = context.AdultCareerSaveAdmission;
verify("1. Admission Boundary 只公開單一正式 API", Object.keys(admission).join(",") === "evaluate");

const preAdult = fresh(context, { chapter: "少棒第一季", age: 10, seasonStep: 3 });
const preAdultResult = admission.evaluate(preAdult);
verify("2. 合法 pre-adult save 以 bypassed + admitted 保持相容", preAdultResult.status === "bypassed" && preAdultResult.admitted === true && preAdultResult.careerStage === "pre-adult");

const unknown = admission.evaluate(fresh(context, { chapter: "__broken_chapter__" }));
verify("3. 未知 chapter 明確 rejected，不會被當成 pre-adult bypass", unknown.status === "rejected" && unknown.admitted === false);

const careerExits = [
  "高卒選秀・中後段指名候選",
  "高卒選秀・落選／培訓測試",
  "大學棒球",
  "業餘／社會人棒球",
  "復健與生涯暫停"
];
verify("4. 五種青棒生涯出口合法狀態全部 admitted", careerExits.every(exit => admission.evaluate(highSchoolExit(context, exit)).admitted));

const transitionCases = [
  transitionState(context, "高卒選秀・中後段指名候選", 0),
  transitionState(context, "大學棒球", 2),
  transitionState(context, "業餘／社會人棒球", 4),
  transitionState(context, "復健與生涯暫停", 1)
];
verify("5. 四種成年來源的代表 Transition 狀態均 admitted", transitionCases.every(state => admission.evaluate(state).admitted));
verify("6. Transition admission 會消費 4.6 Runtime Resolver", transitionCases.every(state => context.CareerTransitionRuntimeResolver.resolveTransitionRuntime(state).resolved));

verify("7. 四種 route identity 的 Transition Result 均 admitted", [
  "高卒選秀・中後段指名候選", "大學棒球", "業餘／社會人棒球", "復健與生涯暫停"
].every(exit => admission.evaluate(transitionResult(context, exit)).admitted));

const developmentCases = [
  developmentState(context, "高卒選秀・落選／培訓測試", 0, { age: 20 }),
  developmentState(context, "大學棒球", 2, { age: 20 }),
  developmentState(context, "業餘／社會人棒球", 4, { age: 21 }),
  developmentState(context, "復健與生涯暫停", 6, { age: 21 })
];
verify("8. 四種成年來源的代表 Development 狀態均 admitted", developmentCases.every(state => admission.evaluate(state).admitted));
verify("9. Development admission 會消費 4.8 Runtime Resolver", developmentCases.every(state => context.CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(state).resolved));

verify("10. 四種 route identity 的 22 歲結果均 admitted", [
  "高卒選秀・中後段指名候選", "大學棒球", "業餘／社會人棒球", "復健與生涯暫停"
].every(exit => admission.evaluate(age22Result(context, exit)).admitted));
const completedResult = admission.evaluate(terminalState(context));
verify("11. 合法垂直切片完成狀態以 completed snapshot admitted", completedResult.admitted && completedResult.careerStage === "prototype-complete");

const forcedDevelopment = developmentState(context, "大學棒球", 2, { forcedEventId: "takahashi_adult_restart_echo" });
verify("12. forcedEventId 不會讓合法底層成年狀態被拒", admission.evaluate(forcedDevelopment).admitted);

const invalidTransitionStates = [
  transitionState(context, "__invalid__", 0),
  transitionState(context, "大學棒球", -1),
  transitionState(context, "大學棒球", 99),
  transitionState(context, "大學棒球", 0, { age: 19 }),
  transitionState(context, "大學棒球", 0, { transitionResult: "過早結果" })
];
verify("13. Invalid Transition 狀態全部 rejected", invalidTransitionStates.every(state => !admission.evaluate(state).admitted));

const invalidTransitionResults = [
  transitionResult(context, "大學棒球", { transitionStep: 4 }),
  transitionResult(context, "大學棒球", { transitionResult: "" }),
  transitionResult(context, "大學棒球", { transitionDetail: "" })
];
verify("14. Invalid Transition Result 全部 rejected", invalidTransitionResults.every(state => !admission.evaluate(state).admitted));

const invalidDevelopmentStates = [
  developmentState(context, "__invalid__", 2),
  developmentState(context, "大學棒球", -1),
  developmentState(context, "大學棒球", 7),
  developmentState(context, "大學棒球", 99),
  developmentState(context, "大學棒球", 2, { age: 18 }),
  developmentState(context, "大學棒球", 2, { age: 22 }),
  developmentState(context, "大學棒球", 2, { developmentResult: "過早結果" }),
  developmentState(context, "大學棒球", 2, { marketOutcome: "過早市場結果" })
];
verify("15. Invalid Development 狀態全部 rejected", invalidDevelopmentStates.every(state => !admission.evaluate(state).admitted));

const invalidAge22States = [
  age22Result(context, "大學棒球", { developmentStep: 6 }),
  age22Result(context, "大學棒球", { age: 21 }),
  age22Result(context, "大學棒球", { developmentResult: "" }),
  age22Result(context, "大學棒球", { developmentDetail: "" }),
  age22Result(context, "大學棒球", { marketOutcome: "" }),
  age22Result(context, "大學棒球", { age22OutcomeCode: "" }),
  age22Result(context, "大學棒球", { age22OutcomeCode: "__invalid__" }),
  age22Result(context, "大學棒球", { age22OutcomeCode: "amateur-stable" }),
  age22Result(context, "大學棒球", { marketOutcome: "業餘主力與穩定工作" }),
  age22Result(context, "__invalid__")
];
verify("16. Invalid 22 歲結果狀態全部 rejected", invalidAge22States.every(state => !admission.evaluate(state).admitted));
verify("17. completed=false 的終止狀態 rejected", !admission.evaluate(terminalState(context, "大學棒球", { completed: false })).admitted);

const deterministicCandidate = developmentState(context, "業餘／社會人棒球", 4, { age: 21 });
const candidateBefore = JSON.stringify(deterministicCandidate);
const contractBefore = JSON.stringify(context.CareerSpineContract.getCareerNetwork());
const resultA = admission.evaluate(deterministicCandidate);
const resultB = admission.evaluate(deterministicCandidate);
verify("18. Admission evaluation 對 candidate 為 zero mutation", JSON.stringify(deterministicCandidate) === candidateBefore);
verify("19. Admission evaluation 對 Career Contract 為 zero mutation", JSON.stringify(context.CareerSpineContract.getCareerNetwork()) === contractBefore);
verify("20. 相同 candidate 的 Admission result deterministic", JSON.stringify(resultA) === JSON.stringify(resultB));
verify("21. admitted／bypassed／rejected 結果全部 deep frozen", [resultA, preAdultResult, unknown].every(isDeepFrozen));

const source = fs.readFileSync(path.join(root, "career-save-admission.js"), "utf8");
verify("22. Admission source 不接觸 Storage、UI、live Player 或 Save flow", !/localStorage|sessionStorage|document|showCurrentEvent|showNotice|player\s*=|normalizeSave|saveGame|loadGame|Math\.random|\bDate\b/.test(source));
verify("23. Admission source 未保存成年 chapter／careerExit／事件 registry", !/\[\s*["'](?:生涯轉換期|發展期|二十二歲職涯小結|垂直切片完成)|["'](?:高卒選秀|大學棒球|業餘／社會人棒球)["']|transition_draft_day|development_daily_life/.test(source));

const runtimeFiles = boundaryFiles.concat(["story.js", "save.js"]);
const validLoad = makeContext(runtimeFiles);
const validCandidate = developmentState(validLoad.context, "大學棒球", 2, { age: 20 });
validLoad.storage.set("baseballLifeRpgSave", JSON.stringify(validCandidate));
evaluate(validLoad.context, "player = createInitialPlayer('載入前'); var __beforeValidLoad = player; loadGame()");
verify("24. 合法成年 Load 在 admission 後才替換 live Player", evaluate(validLoad.context, "player !== __beforeValidLoad && player.name === '4.10 測試球員'"));
verify("25. 合法 Development Load 恢復既有 development_mentor event", validLoad.counters.render === 1 && validLoad.context.__lastRenderedEventId === "development_mentor");
verify("26. 合法 Load 隱藏創角區、顯示 success 且不重寫 Storage", validLoad.nodes.get("characterCreation").style.display === "none" && validLoad.notices.some(item => item.type === "success") && validLoad.counters.storageWrites === 0);

const invalidLoad = makeContext(runtimeFiles);
const badRaw = JSON.stringify(developmentState(invalidLoad.context, "大學棒球", 99, { age: 20 }));
invalidLoad.storage.set("baseballLifeRpgSave", badRaw);
invalidLoad.context.document.getElementById("characterCreation").style.display = "grid";
invalidLoad.context.document.getElementById("story").innerHTML = "原故事";
invalidLoad.context.document.getElementById("choices").innerHTML = "原選項";
evaluate(invalidLoad.context, "player = createInitialPlayer('既有玩家'); player.flags.push('unchanged'); var __beforeRejectedLoad = player; var __beforeRejectedJson = JSON.stringify(player); loadGame()");
verify("27. Rejected Load 維持 live Player identity 與完整內容", evaluate(invalidLoad.context, "player === __beforeRejectedLoad && JSON.stringify(player) === __beforeRejectedJson"));
verify("28. Rejected Load 不 Render、不切換主 UI、不清空故事與選項", invalidLoad.counters.render === 0 && invalidLoad.nodes.get("characterCreation").style.display === "grid" && invalidLoad.nodes.get("story").innerHTML === "原故事" && invalidLoad.nodes.get("choices").innerHTML === "原選項");
verify("29. Rejected Load 保留原始 localStorage 且不寫入或刪除", invalidLoad.storage.get("baseballLifeRpgSave") === badRaw && invalidLoad.counters.storageWrites === 0 && invalidLoad.counters.storageDeletes === 0);
verify("30. Rejected Load 只顯示 error notice", invalidLoad.notices.length === 1 && invalidLoad.notices[0].type === "error");

const malformed = makeContext(runtimeFiles);
malformed.storage.set("baseballLifeRpgSave", "{invalid-json");
evaluate(malformed.context, "player = createInitialPlayer('JSON 前'); var __beforeMalformed = player; var __beforeMalformedJson = JSON.stringify(player); loadGame()");
verify("31. Malformed JSON 沿用 catch 且 live Player、UI、Storage 不變", evaluate(malformed.context, "player === __beforeMalformed && JSON.stringify(player) === __beforeMalformedJson") && malformed.counters.render === 0 && malformed.storage.get("baseballLifeRpgSave") === "{invalid-json" && malformed.notices.some(item => item.type === "error"));

const missingModule = makeContext(["player.js", "story.js", "save.js"]);
const missingRaw = JSON.stringify(fresh(context, { chapter: "少棒第一季", age: 10, seasonStep: 1 }));
missingModule.storage.set("baseballLifeRpgSave", missingRaw);
evaluate(missingModule.context, "player = createInitialPlayer('模組缺失前'); var __beforeMissingModule = player; loadGame()");
verify("32. Admission module unavailable 時 fail closed", evaluate(missingModule.context, "player === __beforeMissingModule") && missingModule.counters.render === 0 && missingModule.notices.some(item => item.type === "error"));

const legacyLoad = makeContext(runtimeFiles);
legacyLoad.storage.set("baseballLifeRpgSave", JSON.stringify({
  name: "舊少棒存檔",
  saveVersion: 7,
  chapter: "少棒第一季",
  age: 10,
  seasonStep: 2
}));
evaluate(legacyLoad.context, "loadGame()");
verify("33. 舊存檔先 normalize 到 v15 再由 pre-adult Admission 放行", evaluate(legacyLoad.context, "player.name === '舊少棒存檔' && player.saveVersion === 15 && player.age22OutcomeCode === '' && player.baseballSkills && player.relationships") && legacyLoad.counters.render === 1);

const legacyAge22Load = makeContext(runtimeFiles);
const legacyAge22State = age22Result(legacyAge22Load.context, "大學棒球", { saveVersion: 13 });
delete legacyAge22State.age22OutcomeCode;
const legacyAge22Raw = JSON.stringify(legacyAge22State);
legacyAge22Load.storage.set("baseballLifeRpgSave", legacyAge22Raw);
evaluate(legacyAge22Load.context, "loadGame()");
verify("33a. 合法 v13 二十二歲結果以既有 marketOutcome 遷移到 v15 code", evaluate(legacyAge22Load.context, "player.saveVersion === 15 && player.age22OutcomeCode === 'college-draft-window'") && legacyAge22Load.counters.render === 1);
verify("33b. v13 Load migration 不自動覆寫原始 Storage", legacyAge22Load.storage.get("baseballLifeRpgSave") === legacyAge22Raw && legacyAge22Load.counters.storageWrites === 0);

const invalidLegacyAge22Load = makeContext(runtimeFiles);
const invalidLegacyState = age22Result(invalidLegacyAge22Load.context, "大學棒球", {
  saveVersion: 13,
  marketOutcome: "一軍短期升格／正式名單競爭"
});
delete invalidLegacyState.age22OutcomeCode;
const invalidLegacyRaw = JSON.stringify(invalidLegacyState);
invalidLegacyAge22Load.storage.set("baseballLifeRpgSave", invalidLegacyRaw);
evaluate(invalidLegacyAge22Load.context, "player = createInitialPlayer('遷移拒絕前'); var __beforeInvalidLegacy = player; var __beforeInvalidLegacyJson = JSON.stringify(player); loadGame()");
verify("33c. 路線與舊中文結果矛盾的 v13 存檔被拒且 live Player zero mutation", evaluate(invalidLegacyAge22Load.context, "player === __beforeInvalidLegacy && JSON.stringify(player) === __beforeInvalidLegacyJson") && invalidLegacyAge22Load.counters.render === 0);
verify("33d. 無法遷移的 v13 存檔不修改 Storage", invalidLegacyAge22Load.storage.get("baseballLifeRpgSave") === invalidLegacyRaw && invalidLegacyAge22Load.counters.storageWrites === 0 && invalidLegacyAge22Load.counters.storageDeletes === 0);

const forcedLoad = makeContext(runtimeFiles);
forcedLoad.storage.set("baseballLifeRpgSave", JSON.stringify(forcedDevelopment));
evaluate(forcedLoad.context, "loadGame()");
verify("34. forced-event Save/Load 保留既有 precedence", forcedLoad.context.__lastRenderedEventId === "takahashi_adult_restart_echo" && evaluate(forcedLoad.context, "player.forcedEventId === 'takahashi_adult_restart_echo'"));

const completedLoad = makeContext(runtimeFiles);
completedLoad.storage.set("baseballLifeRpgSave", JSON.stringify(terminalState(completedLoad.context, "大學棒球", { forcedEventId: "takahashi_adult_restart_echo" })));
evaluate(completedLoad.context, "loadGame()");
verify("35. completed Save 仍優先於殘留 forced event", completedLoad.context.__lastRenderedEventId === "slice_complete");

const transitionLoad = makeContext(runtimeFiles);
transitionLoad.storage.set("baseballLifeRpgSave", JSON.stringify(transitionState(transitionLoad.context, "業餘／社會人棒球", 3)));
evaluate(transitionLoad.context, "loadGame()");
verify("36. 合法 Transition Save 恢復 Resolver 指定事件", transitionLoad.context.__lastRenderedEventId === "transition_relationship");

const resultLoads = [transitionResult(context), age22Result(context), terminalState(context)];
verify("37. Transition Result、22 歲 Result 與 Terminal 都不錯套 Runtime Resolver", resultLoads.every(state => admission.evaluate(state).admitted));

const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const loadOrder = [
  "career-spine-contract.js",
  "career-transition-runtime-resolver.js",
  "career-development-runtime-resolver.js",
  "career-age22-outcome-resolver.js",
  "career-save-admission.js",
  "save.js"
].map(file => indexSource.indexOf(`<script src="${file}"></script>`));
verify("38. Browser dependency 依 Contract → Runtime Resolvers → Admission → Save 載入", loadOrder.every((position, index) => position >= 0 && (index === 0 || position > loadOrder[index - 1])));

const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
const saveSource = fs.readFileSync(path.join(root, "save.js"), "utf8");
verify("39. SAVE_VERSION 升級為 15，SAVE_KEY 與 saveGame snapshot shape 保持不變", /const SAVE_VERSION = 15;/.test(playerSource) && /const SAVE_KEY = "baseballLifeRpgSave";/.test(saveSource) && /localStorage\.setItem\(SAVE_KEY, JSON\.stringify\(player\)\)/.test(saveSource));
verify("40. Player Schema 只新增 age22OutcomeCode，未新增 currentIdentity 或 Admission persistence 欄位", /age22OutcomeCode:\s*""/.test(playerSource) && !/currentCareerIdentity|adultCareerIdentity|saveValid|admissionStatus|adultNodeId|loadedRoute|saveAdmissionVersion/.test(playerSource));
verify("41. loadGame 明確維持 candidate-first、admission-second、commit-last", saveSource.indexOf("const candidate = normalizeSave") < saveSource.indexOf("AdultCareerSaveAdmission.evaluate(candidate)") && saveSource.indexOf("AdultCareerSaveAdmission.evaluate(candidate)") < saveSource.indexOf("player = candidate"));

console.log(`\nArchitecture Sprint 4.10 Adult Career Save Admission Boundary：${passed}/${passed} 通過`);
