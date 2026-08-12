const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const controllerSource = fs.readFileSync(path.join(root, "application-controller.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeDelegationContext(overrides = {}) {
  const calls = [];
  const context = vm.createContext({
    console,
    calls,
    createPlayer: () => calls.push(["createPlayer"]),
    choose: (...args) => calls.push(["choose", ...args]),
    showCurrentEvent: () => calls.push(["showCurrentEvent"]),
    saveGame: () => calls.push(["saveGame"]),
    loadGame: () => calls.push(["loadGame"]),
    deleteSave: () => calls.push(["deleteSave"]),
    selectOrigin: (...args) => calls.push(["selectOrigin", ...args]),
    selectIdealSelf: (...args) => calls.push(["selectIdealSelf", ...args]),
    selectDevelopmentEntry: (...args) => calls.push(["selectDevelopmentEntry", ...args]),
    loadTestBookmark: (...args) => calls.push(["loadTestBookmark", ...args]),
    ...overrides
  });
  vm.runInContext(controllerSource, context, { filename: "application-controller.js" });
  return context;
}

const delegation = makeDelegationContext();
const requiredMethods = [
  "startGame",
  "submitDecision",
  "presentCurrentScene",
  "saveSession",
  "resumeSession",
  "deleteSession"
];

assert(vm.runInContext("typeof ApplicationController === 'object'", delegation), "ApplicationController 不存在");
requiredMethods.forEach(method => {
  assert(vm.runInContext(`typeof ApplicationController.${method} === "function"`, delegation), `缺少 public method：${method}`);
});

vm.runInContext(`
  ApplicationController.startGame();
  ApplicationController.submitDecision("day1_morning", 2);
  ApplicationController.presentCurrentScene();
  ApplicationController.saveSession();
  ApplicationController.resumeSession();
  ApplicationController.deleteSession();
  ApplicationController.selectOrigin("understand");
  ApplicationController.selectIdealSelf("技巧型");
  ApplicationController.selectDevelopmentEntry("highSchool");
  ApplicationController.loadTestBookmark("chapter2");
`, delegation);

assert(JSON.stringify(delegation.calls) === JSON.stringify([
  ["createPlayer"],
  ["choose", "day1_morning", 2],
  ["showCurrentEvent"],
  ["saveGame"],
  ["loadGame"],
  ["deleteSave"],
  ["selectOrigin", "understand"],
  ["selectIdealSelf", "技巧型"],
  ["selectDevelopmentEntry", "highSchool"],
  ["loadTestBookmark", "chapter2"]
]), "façade 委派函式或參數順序不正確");

assert(delegation.calls.filter(call => call[0] === "showCurrentEvent").length === 1, "Controller 額外呼叫 render");
const callsBeforeInvalidDecision = delegation.calls.length;
const invalidDecision = vm.runInContext("ApplicationController.submitDecision('', -1)", delegation);
assert(!invalidDecision.ok && delegation.calls.length === callsBeforeInvalidDecision, "無效 Decision 仍被委派");

const missingDependency = vm.createContext({ console });
vm.runInContext(controllerSource, missingDependency, { filename: "application-controller.js" });
const missingResult = vm.runInContext("ApplicationController.startGame()", missingDependency);
assert(!missingResult.ok && /createPlayer/.test(missingResult.error), "缺少依賴時沒有可理解的錯誤");

const trackedState = { chapter: "十歲暑假", step: 0, flags: ["unchanged"] };
const noMutation = makeDelegationContext({
  trackedState,
  createPlayer: () => undefined,
  choose: () => undefined,
  showCurrentEvent: () => undefined,
  saveGame: () => undefined,
  loadGame: () => undefined,
  deleteSave: () => undefined
});
const stateBefore = JSON.stringify(trackedState);
vm.runInContext(`
  ApplicationController.startGame();
  ApplicationController.submitDecision("event", 0);
  ApplicationController.presentCurrentScene();
  ApplicationController.saveSession();
  ApplicationController.resumeSession();
  ApplicationController.deleteSession();
`, noMutation);
assert(JSON.stringify(trackedState) === stateBefore, "Controller 方法直接修改了狀態");
assert(!/\bplayer\b|document\.|localStorage|innerHTML|applyEffects|advanceAfterAction/.test(controllerSource), "Controller 原始碼含直接狀態、DOM 或規則操作");

function makeGameContext() {
  const nodes = new Map();
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) {
        nodes.set(id, {
          innerHTML: "",
          textContent: "",
          value: id === "nameInput" ? "相容測試球員" : "",
          style: {},
          focus() {}
        });
      }
      return nodes.get(id);
    },
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    }
  };
  const storage = new Map();
  const context = vm.createContext({
    console,
    document,
    localStorage: {
      setItem: (key, value) => storage.set(key, value),
      getItem: key => storage.get(key) || null,
      removeItem: key => storage.delete(key)
    },
    window: { setTimeout: callback => callback() }
  });
  ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "story.js", "save.js", "script.js", "application-controller.js"].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  });
  return context;
}

function runGoldenFlow(useController) {
  const game = makeGameContext();
  vm.runInContext("selectedOrigin = 'understand'; selectedIdealSelf = '全能型'; pendingGenesisRoll=rollCharacterGenesis(()=>0); pendingGenesisAllocation={ballSense:1,observe:1,fitness:1,batting:0,baseRunning:0,baseballIQ:0}", game);

  if (useController) {
    const start = vm.runInContext("ApplicationController.startGame()", game);
    assert(start.ok, `Controller startGame 失敗：${start.error || ""}`);
  } else {
    vm.runInContext("createPlayer()", game);
  }

  const beforePresent = vm.runInContext("JSON.stringify({ eventId:getCurrentEventId(), chapter:player.chapter, day:player.day, phase:player.phase, chapter2Step:player.chapter2Step, seasonStep:player.seasonStep })", game);
  if (useController) {
    const present = vm.runInContext("ApplicationController.presentCurrentScene()", game);
    assert(present.ok, `Controller presentCurrentScene 失敗：${present.error || ""}`);
  } else {
    vm.runInContext("showCurrentEvent()", game);
  }
  const afterPresent = vm.runInContext("JSON.stringify({ eventId:getCurrentEventId(), chapter:player.chapter, day:player.day, phase:player.phase, chapter2Step:player.chapter2Step, seasonStep:player.seasonStep })", game);
  assert(afterPresent === beforePresent, "presentCurrentScene 改變事件 ID 或額外推進 step");

  const eventId = vm.runInContext("getCurrentEventId()", game);
  if (useController) {
    const decision = vm.runInContext(`ApplicationController.submitDecision(${JSON.stringify(eventId)}, 0)`, game);
    assert(decision.ok, `Controller submitDecision 失敗：${decision.error || ""}`);
  } else {
    vm.runInContext(`choose(${JSON.stringify(eventId)}, 0)`, game);
  }

  return vm.runInContext(`JSON.stringify({
    eventId: getCurrentEventId(),
    chapter: player.chapter,
    day: player.day,
    phase: player.phase,
    chapter2Step: player.chapter2Step,
    seasonStep: player.seasonStep,
    flags: player.flags,
    relationships: player.relationships,
    stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]]))
  })`, game);
}

const legacySnapshot = runGoldenFlow(false);
const controllerSnapshot = runGoldenFlow(true);
assert(controllerSnapshot === legacySnapshot, "Controller Entry 與 Legacy Entry 的 Golden Flow Snapshot 不一致");

const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert(indexSource.includes('<script src="application-controller.js"></script>'), "index.html 未載入 application-controller.js");
assert(indexSource.indexOf('<script src="application-controller.js"></script>') > indexSource.indexOf('<script src="script.js"></script>'), "Controller 載入順序早於既有 runtime");
[
  "ApplicationController.startGame()",
  "ApplicationController.saveSession()",
  "ApplicationController.resumeSession()",
  "ApplicationController.deleteSession()",
  "ApplicationController.selectOrigin(",
  "ApplicationController.selectIdealSelf(",
  "ApplicationController.selectDevelopmentEntry(",
  "ApplicationController.loadTestBookmark("
].forEach(command => assert(indexSource.includes(command), `主要 UI command 尚未改走 Controller：${command}`));

const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
assert(/onclick="choose\('\$\{eventId\}', \$\{index\}\)"/.test(scriptSource), "動態 Decision handler 未依 Phase 1 保留 legacy choose()");

console.log("ApplicationController public methods：10／10");
console.log("Legacy delegation：10／10");
console.log("Golden Flow：Legacy Entry 與 Controller Entry Snapshot 一致");
console.log("Dynamic Decision handler：Deferred Compatibility Item（仍直接呼叫 choose）");
console.log("Phase 1 Application Controller Compatibility Façade test passed.");
