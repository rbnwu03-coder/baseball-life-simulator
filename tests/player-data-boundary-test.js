const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const controllerSource = fs.readFileSync(path.join(root, "application-controller.js"), "utf8");

let validations = 0;
function assert(condition, message) {
  validations += 1;
  if (!condition) throw new Error(message);
}

function makeNode(id) {
  return {
    id,
    innerHTML: "",
    textContent: "",
    value: id === "nameInput" ? "邊界測試球員" : "",
    style: {},
    dataset: {},
    classList: {
      toggle() {},
      add() {},
      remove() {}
    },
    setAttribute() {},
    focus() {}
  };
}

function makeGameContext(files = ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "story.js", "save.js", "script.js", "application-controller.js"]) {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, makeNode(id));
      return nodes.get(id);
    },
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    }
  };
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
  files.forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  });
  return { context, document, storage };
}

function evaluate(context, source) {
  return vm.runInContext(source, context);
}

function getGoldenSnapshot(context) {
  return JSON.parse(evaluate(context, `JSON.stringify({
    name: player.name,
    origin: player.origin,
    idealSelf: player.idealSelf,
    aspiration: player.aspirationState,
    stats: Object.fromEntries(Object.keys(statLabels).map(key => [key, player[key]])),
    personality: player.personality,
    flags: player.flags,
    relationships: player.relationships,
    chapter: player.chapter,
    day: player.day,
    phase: player.phase,
    step: {
      chapter2Step: player.chapter2Step,
      seasonStep: player.seasonStep,
      competitionStep: player.competitionStep,
      juniorStep: player.juniorStep,
      juniorSeasonStep: player.juniorSeasonStep,
      highSchoolStep: player.highSchoolStep,
      criticalYearStep: player.criticalYearStep,
      transitionStep: player.transitionStep,
      developmentStep: player.developmentStep
    },
    eventId: getCurrentEventId()
  })`));
}

function runBoundaryCreation(origin, idealSelf, useController = false) {
  const { context } = makeGameContext();
  evaluate(context, `selectedOrigin=${JSON.stringify(origin)}; selectedIdealSelf=${JSON.stringify(idealSelf)};`);
  if (useController) {
    const result = evaluate(context, "ApplicationController.startGame()");
    assert(result.ok, `Controller 創角失敗：${origin} × ${idealSelf}`);
  } else {
    evaluate(context, "createPlayer()");
  }
  return getGoldenSnapshot(context);
}

function runLegacyCreation(origin, idealSelf) {
  const { context } = makeGameContext();
  evaluate(context, `
    (() => {
      const legacyName = document.getElementById("nameInput").value.trim();
      player = createInitialPlayer(legacyName);
      player.replayMemories = loadReplayMemories();
      player.origin = ${JSON.stringify(origin)};
      player.idealSelf = ${JSON.stringify(idealSelf)};
      const legacyOrigins = {
        prove: { effects: { confidence: 1, pressure: 1 }, personality: { brave: 1, ambitious: 1 }, flag: "origin_wants_to_be_seen", memory: "在真正碰到棒球以前，你先承認自己希望有一天能被看見。" },
        understand: { effects: { observe: 2 }, personality: { thoughtful: 2 }, flag: "origin_wants_to_understand", memory: "你最初靠近棒球，是因為想知道每個動作背後的原因。" },
        belong: { effects: { familySupport: 1, resilience: 1 }, personality: { kind: 1, reliable: 1 }, flag: "origin_wants_to_belong", memory: "你希望棒球能讓自己成為某個團體的一員。" }
      };
      const legacyOrigin = legacyOrigins[${JSON.stringify(origin)}];
      applyEffects(legacyOrigin.effects);
      addPersonalityEffects(legacyOrigin.personality);
      addFlags([legacyOrigin.flag]);
      updateImpression();
      player.memories.push(legacyOrigin.memory);
      showCurrentEvent();
    })()
  `);
  return getGoldenSnapshot(context);
}

// Boundary existence, API and canonical option contract.
const playerOnly = makeGameContext(["player.js"]).context;
assert(evaluate(playerOnly, "typeof PlayerDataBoundary === 'object'"), "PlayerDataBoundary 不存在");
assert(evaluate(playerOnly, "window.PlayerDataBoundary === PlayerDataBoundary"), "window.PlayerDataBoundary 未建立");
assert(evaluate(playerOnly, "window.PlayerIdentityOptions === PlayerIdentityOptions"), "window.PlayerIdentityOptions 未建立");
assert(evaluate(playerOnly, "window.player === player"), "window.player legacy 相容入口未保留");
[
  "createInitialSnapshot",
  "getSnapshot",
  "getIdentity",
  "initializeIdentity",
  "restoreSnapshot",
  "isIdentityInitialized",
  "validateIdentityInput"
].forEach(method => {
  assert(evaluate(playerOnly, `typeof PlayerDataBoundary.${method} === "function"`), `缺少 Boundary method：${method}`);
});
assert(evaluate(playerOnly, "PlayerIdentityOptions.origins.length === 3"), "Origin runtime 合法值不是 3 種");
assert(evaluate(playerOnly, "PlayerIdentityOptions.idealSelf.length === 5"), "Ideal Self runtime 合法值不是 5 種");
assert(evaluate(playerOnly, "Object.isFrozen(PlayerIdentityOptions) && Object.isFrozen(PlayerIdentityOptions.origins) && Object.isFrozen(PlayerIdentityOptions.idealSelf)"), "Identity 合法值來源不是唯讀");

// Factory delegation and read isolation.
assert(evaluate(playerOnly, "JSON.stringify(PlayerDataBoundary.createInitialSnapshot()) === JSON.stringify(createInitialPlayer())"), "createInitialSnapshot 與 factory 結果不同");
assert(evaluate(playerOnly, "PlayerDataBoundary.createInitialSnapshot() !== PlayerDataBoundary.createInitialSnapshot()"), "createInitialSnapshot 重複回傳同一物件");
assert(evaluate(playerOnly, `(() => {
  const a=PlayerDataBoundary.createInitialSnapshot();
  const b=PlayerDataBoundary.createInitialSnapshot();
  a.body.fatigue=99;
  return b.body.fatigue===0;
})()`), "createInitialSnapshot nested data 共用 reference");
assert(evaluate(playerOnly, `(() => {
  const snapshot=PlayerDataBoundary.getSnapshot();
  snapshot.body.fatigue=99;
  snapshot.flags.push("external");
  return player.body.fatigue===0 && !player.flags.includes("external");
})()`), "getSnapshot 洩漏 mutable player reference");
assert(evaluate(playerOnly, `(() => {
  const identity=PlayerDataBoundary.getIdentity();
  identity.name="外部修改";
  return player.name==="";
})()`), "getIdentity 洩漏 mutable player reference");
assert(evaluate(playerOnly, "Object.keys(PlayerDataBoundary.getIdentity()).sort().join(',') === 'idealSelf,name,origin'"), "getIdentity 回傳了 Identity 以外欄位");

// Atomic identity initialization and failure behavior.
const beforeValidNonIdentity = evaluate(playerOnly, `(() => {
  const value=PlayerDataBoundary.getSnapshot();
  delete value.name; delete value.origin; delete value.idealSelf;
  return JSON.stringify(value);
})()`);
const validResult = evaluate(playerOnly, `PlayerDataBoundary.initializeIdentity({
  name:"  原子測試球員  ",
  origin:"understand",
  idealSelf:"技術鑽研型"
})`);
assert(validResult.ok, "合法 Identity 初始化失敗");
assert(JSON.stringify(validResult.identity) === JSON.stringify({ name: "原子測試球員", origin: "understand", idealSelf: "技術鑽研型" }), "合法 Identity 回傳值不正確");
assert(evaluate(playerOnly, "player.name==='原子測試球員' && player.origin==='understand' && player.idealSelf==='技術鑽研型'"), "合法 Identity 未一次寫入三欄");
assert(evaluate(playerOnly, `(() => {
  const value=PlayerDataBoundary.getSnapshot();
  delete value.name; delete value.origin; delete value.idealSelf;
  return JSON.stringify(value);
})()`) === beforeValidNonIdentity, "initializeIdentity 修改了 Identity 以外資料");
assert(evaluate(playerOnly, "PlayerDataBoundary.isIdentityInitialized()"), "合法 Identity 未被判定為 initialized");

[
  { label: "空白姓名", input: { name: "   ", origin: "prove", idealSelf: "全能型" } },
  { label: "非法 Origin", input: { name: "測試", origin: "invalid", idealSelf: "全能型" } },
  { label: "非法 Ideal Self", input: { name: "測試", origin: "prove", idealSelf: "不存在型" } },
  { label: "空輸入", input: null }
].forEach(testCase => {
  const before = evaluate(playerOnly, "JSON.stringify(PlayerDataBoundary.getIdentity())");
  const result = evaluate(playerOnly, `PlayerDataBoundary.initializeIdentity(${JSON.stringify(testCase.input)})`);
  const after = evaluate(playerOnly, "JSON.stringify(PlayerDataBoundary.getIdentity())");
  assert(!result.ok, `${testCase.label} 未拒絕`);
  assert(after === before, `${testCase.label} 造成部分 Identity 寫入`);
});

// Restore wrapper compatibility and clone isolation.
const restoreResult = evaluate(playerOnly, `PlayerDataBoundary.restoreSnapshot(Object.assign(
  PlayerDataBoundary.createInitialSnapshot(),
  { name:"還原球員", origin:"belong", idealSelf:"團隊核心型", chapter:"少棒入門" }
))`);
assert(restoreResult.ok, "restoreSnapshot 無法還原合法 Snapshot");
assert(evaluate(playerOnly, "player.name==='還原球員' && player.chapter==='少棒入門'"), "restoreSnapshot 沒有替換完整 Snapshot");
assert(evaluate(playerOnly, `(() => {
  const source=PlayerDataBoundary.createInitialSnapshot();
  source.name="來源";
  PlayerDataBoundary.restoreSnapshot(source);
  source.name="後改";
  return player.name==="來源";
})()`), "restoreSnapshot 保留了輸入 reference");
assert(!evaluate(playerOnly, "PlayerDataBoundary.restoreSnapshot(null)").ok, "restoreSnapshot 未拒絕非法輸入");

// Source guards.
const createPlayerMatch = scriptSource.match(/function createPlayer\(\)\s*\{([\s\S]*?)\n\}\n\nfunction resetGame/);
assert(Boolean(createPlayerMatch), "無法擷取 createPlayer 原始碼");
const createPlayerBody = createPlayerMatch[1];
assert(createPlayerBody.includes("PlayerDataBoundary.initializeIdentity(identityInput)"), "createPlayer 未改走 initializeIdentity");
assert(createPlayerBody.includes("PlayerDataBoundary.createInitialSnapshot()"), "createPlayer 未改走 createInitialSnapshot");
[
  /player\.name\s*=/,
  /player\.origin\s*=/,
  /player\.idealSelf\s*=/
].forEach(pattern => assert(!pattern.test(createPlayerBody), `createPlayer 仍含 direct write：${pattern}`));

const boundaryStart = playerSource.indexOf("var PlayerDataBoundary");
const boundaryEnd = playerSource.indexOf("let player = createInitialPlayer()");
assert(boundaryStart >= 0 && boundaryEnd > boundaryStart, "無法擷取 PlayerDataBoundary 原始碼");
const boundarySource = playerSource.slice(boundaryStart, boundaryEnd);
[
  "document.",
  "innerHTML",
  "localStorage",
  "showStory",
  "updateStatus",
  "applyEffects",
  "advanceAfterAction",
  "setTimeout"
].forEach(token => assert(!boundarySource.includes(token), `Boundary 含禁止依賴：${token}`));

// Golden Character Creation Matrix: current Boundary flow vs pre-Phase-2 creation orchestration.
const origins = ["prove", "understand", "belong"];
const idealSelfValues = ["全能型", "技術鑽研型", "直覺天賦型", "關鍵時刻型", "團隊核心型"];
let matrixCases = 0;
origins.forEach(origin => {
  idealSelfValues.forEach(idealSelf => {
    const current = runBoundaryCreation(origin, idealSelf);
    const legacy = runLegacyCreation(origin, idealSelf);
    assert(JSON.stringify(current) === JSON.stringify(legacy), `Golden Matrix 不一致：${origin} × ${idealSelf}`);
    assert(current.origin === origin && current.idealSelf === idealSelf, `創角 Identity 不正確：${origin} × ${idealSelf}`);
    matrixCases += 1;
  });
});
assert(matrixCases === 15, "Golden Matrix 未完整測試 15 組");

// Controller equivalence remains unchanged.
const directSnapshot = runBoundaryCreation("understand", "全能型", false);
const controllerSnapshot = runBoundaryCreation("understand", "全能型", true);
assert(JSON.stringify(controllerSnapshot) === JSON.stringify(directSnapshot), "Controller 與 legacy createPlayer 入口結果不同");
assert(/startGame\(\)\s*\{\s*return invokeLegacy\("startGame", "createPlayer"\)/.test(controllerSource), "ApplicationController.startGame 不再委派 createPlayer");

// Save/load and legacy fixture compatibility.
const persistence = makeGameContext();
evaluate(persistence.context, "selectedOrigin='belong'; selectedIdealSelf='團隊核心型'; createPlayer()");
const beforeSave = evaluate(persistence.context, "JSON.stringify(PlayerDataBoundary.getSnapshot())");
evaluate(persistence.context, "saveGame(); player=createInitialPlayer('覆蓋'); loadGame()");
const afterLoad = evaluate(persistence.context, "JSON.stringify(PlayerDataBoundary.getSnapshot())");
assert(afterLoad === beforeSave, "Save → Load round-trip Snapshot 不一致");
assert(evaluate(persistence.context, "player.name==='邊界測試球員' && player.origin==='belong' && player.idealSelf==='團隊核心型'"), "Save → Load 沒有保留 Identity");

const legacyFixture = makeGameContext();
evaluate(legacyFixture.context, "player=normalizeSave({name:'舊存檔球員'}); updateStatus()");
assert(evaluate(legacyFixture.context, "player.name==='舊存檔球員' && player.origin==='prove' && player.idealSelf===''"), "舊存檔 Identity fallback 不相容");
assert(evaluate(legacyFixture.context, "document.getElementById('player-info').innerHTML.includes('理想球員：尚未形成')"), "舊存檔 UI fallback 不相容");

// Existing load order and runtime source projections.
const playerIndex = indexSource.indexOf('<script src="player.js"></script>');
const scriptIndex = indexSource.indexOf('<script src="script.js"></script>');
const controllerIndex = indexSource.indexOf('<script src="application-controller.js"></script>');
assert(playerIndex >= 0 && playerIndex < scriptIndex && scriptIndex < controllerIndex, "VM／瀏覽器 runtime 載入順序不正確");
assert(evaluate(makeGameContext(["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "story.js", "script.js"]).context, "typeof PlayerDataBoundary==='object' && typeof createPlayer==='function'"), "Phase 1～7 runtime VM 載入失敗");
assert(scriptSource.includes("[PlayerIdentityOptions.idealSelf[0]]") && scriptSource.includes("[PlayerIdentityOptions.origins[0]]"), "script.js 未使用單一合法值 runtime source");

console.log(`PlayerDataBoundary validations：${validations}`);
console.log(`Golden Character Creation Matrix：${matrixCases}／15`);
console.log("Identity 原子寫入與 Source Guard：通過");
console.log("Save／Load round-trip 與舊存檔 fixture：通過");
console.log("ApplicationController 相容入口：通過");
console.log("Phase 2 Player Data Ownership Boundary test passed.");
