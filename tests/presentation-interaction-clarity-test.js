const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js",
  "current-state-boundary.js",
  "time-boundary.js",
  "relationship-boundary.js",
  "evaluation-registry.js",
  "coach-evaluation-boundary.js",
  "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js",
  "decision-flow.js",
  "day-completion-flow.js",
  "relationship-flow.js",
  "coach-response-flow.js",
  "narrative-condition-flow.js",
  "competition-presentation.js",
  "career-spine-contract.js",
  "career-transition-runtime-resolver.js",
  "career-development-runtime-resolver.js",
  "career-save-admission.js",
  "npc.js",
  "coach.js",
  "rival.js",
  "story.js",
  "save.js",
  "script.js"
];

let passed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function test(title, assertion) {
  assertion();
  passed += 1;
  console.log(`✓ ${title}`);
}

function createClassList(initial = []) {
  const values = new Set(initial);
  return {
    add: value => values.add(value),
    remove: value => values.delete(value),
    toggle(value, force) {
      if (force === true) values.add(value);
      else if (force === false) values.delete(value);
      else if (values.has(value)) values.delete(value);
      else values.add(value);
      return values.has(value);
    },
    contains: value => values.has(value)
  };
}

function createButton(label = "") {
  const attributes = new Map();
  return {
    textContent: label,
    disabled: false,
    classList: createClassList(),
    setAttribute: (name, value) => attributes.set(name, String(value)),
    removeAttribute: name => attributes.delete(name),
    getAttribute: name => attributes.has(name) ? attributes.get(name) : null
  };
}

function createNode(id) {
  let html = "";
  let buttons = [];
  return {
    id,
    textContent: "",
    value: id === "nameInput" ? "互動清晰度測試" : "",
    style: {},
    classList: createClassList(),
    focus() {},
    get innerHTML() { return html; },
    set innerHTML(value) {
      html = String(value);
      if (id === "choices") {
        buttons = Array.from(html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g))
          .map(match => createButton(match[1].replace(/<[^>]+>/g, "").trim()));
      }
    },
    querySelectorAll(selector) {
      return selector === "button" ? buttons : [];
    }
  };
}

function makeContext() {
  const nodes = new Map();
  const timers = [];
  const storage = new Map();
  const body = { classList: createClassList(["creation-mode"]) };
  const document = {
    body,
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, createNode(id));
      return nodes.get(id);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    console,
    document,
    localStorage: {
      setItem: (key, value) => storage.set(key, value),
      getItem: key => storage.get(key) || null,
      removeItem: key => storage.delete(key)
    },
    window: {
      setTimeout(callback, delay) {
        timers.push({ callback, delay });
        return timers.length;
      }
    }
  });
  runtimeFiles.forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  });
  context.__nodes = nodes;
  context.__timers = timers;
  context.__storage = storage;
  context.__body = body;
  return context;
}

function choices(game) {
  return game.__nodes.get("choices").querySelectorAll("button");
}

test("初始 HTML 與 CSS 只顯示創角介面", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  assert(/<body class="creation-mode">/.test(html), "初始 body 沒有 creation-mode");
  assert(/body\.creation-mode \.debug-bookmarks[\s\S]*body\.creation-mode \.main-layout[\s\S]*body\.creation-mode \.bottom-panel[\s\S]*display\s*:\s*none/.test(css), "創角模式沒有同時隱藏書籤、主布局與玩家摘要");
});

test("一般選擇提交後立即投影 disabled、aria-disabled 與 transitioning class", () => {
  const game = makeContext();
  vm.runInContext("player=createInitialPlayer('一般事件'); showCurrentEvent();", game);
  const before = choices(game);
  assert(before.length > 1 && before.every(button => !button.disabled), "一般事件初始選項不可操作");
  game.choose("day1_morning", 0);
  const locked = choices(game);
  assert(game.__nodes.get("choices").classList.contains("is-transitioning"), "選項容器沒有 transitioning class");
  assert(locked.every(button => button.disabled), "並非所有舊選項都被 disabled");
  assert(locked.every(button => button.getAttribute("aria-disabled") === "true"), "並非所有舊選項都有 aria-disabled=true");
  assert(game.__timers.length === 1 && game.__timers[0].delay === 420, "既有 420ms 轉場被改變");
});

test("快速連點仍只套用一次，420ms 後新選項恢復可操作", () => {
  const game = makeContext();
  vm.runInContext("player=createInitialPlayer('快速連點'); showCurrentEvent();", game);
  game.choose("day1_morning", 0);
  const once = vm.runInContext("JSON.stringify({confidence:player.confidence,day:player.day,phase:player.phase,memories:player.memories.length})", game);
  game.choose("day1_morning", 0);
  const twice = vm.runInContext("JSON.stringify({confidence:player.confidence,day:player.day,phase:player.phase,memories:player.memories.length})", game);
  assert(once === twice, "快速連點重複套用效果");
  game.__timers.shift().callback();
  const next = choices(game);
  assert(!game.__nodes.get("choices").classList.contains("is-transitioning"), "下一事件仍保留 transitioning class");
  assert(next.length > 0 && next.every(button => !button.disabled && button.getAttribute("aria-disabled") === null), "下一事件選項沒有恢復可操作");
  assert(game.getCurrentEventId() === "day1_afternoon", "420ms 後沒有進入原定事件");
});

test("少棒第一季 Outcome Continue 不會被一般選項鎖定", () => {
  const game = makeContext();
  vm.runInContext(`player=createInitialPlayer("Outcome"); Object.assign(player,{chapter:"少棒第一季",seasonStep:1,chapter2Result:"理解型新生"}); showCurrentEvent();`, game);
  game.choose("youth_position_trial", 0);
  const outcomeButtons = choices(game);
  assert(vm.runInContext("Boolean(pendingYouthSeasonOutcome) && isTransitioning", game), "Outcome 沒有維持既有等待狀態");
  assert(!game.__nodes.get("choices").classList.contains("is-transitioning"), "Outcome 容器沿用舊選項鎖定 class");
  assert(outcomeButtons.length === 1 && outcomeButtons[0].textContent === "繼續" && !outcomeButtons[0].disabled, "Outcome Continue 被永久鎖定");
  game.continueYouthSeasonOutcome();
  assert(game.getCurrentEventId() === "youth_teammate" && choices(game).every(button => !button.disabled), "Outcome Continue 沒有正常進入下一幕");
});

test("創角、讀檔與刪除存檔會同步切換 creation-mode", () => {
  const game = makeContext();
  assert(game.__body.classList.contains("creation-mode"), "初始 runtime 沒有維持創角模式");
  vm.runInContext("selectedIdealSelf='全能型'; pendingGenesisRoll=rollCharacterGenesis(()=>0); pendingGenesisAllocation={ballSense:1,observe:1,fitness:1,batting:0,baseRunning:0,baseballIQ:0}; createPlayer();", game);
  assert(!game.__body.classList.contains("creation-mode"), "建立角色後主 UI 沒有顯示");
  game.saveGame();
  game.resetGame();
  assert(game.__body.classList.contains("creation-mode"), "重設後沒有回到創角模式");
  game.loadGame();
  assert(!game.__body.classList.contains("creation-mode") && choices(game).every(button => !button.disabled), "有效讀檔後主 UI 或選項沒有恢復");
  game.deleteSave();
  assert(game.__body.classList.contains("creation-mode"), "刪除存檔後沒有回到創角模式");
});

test("changeLog 與記憶回響不再使用固定高度裁切", () => {
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  const changeLogRule = css.match(/#changeLog\s*\{([\s\S]*?)\}/)?.[1] || "";
  const memoryRule = css.match(/\.memory-line\s*\{([\s\S]*?)\}/)?.[1] || "";
  assert(/min-height\s*:\s*78px/.test(changeLogRule), "changeLog 沒有保留穩定最小高度");
  assert(/height\s*:\s*auto/.test(changeLogRule) && /overflow\s*:\s*visible/.test(changeLogRule), "changeLog 仍會固定高度裁切");
  assert(!/max-height/.test(changeLogRule) && !/overflow\s*:\s*hidden/.test(changeLogRule), "changeLog 仍含 max-height 或 overflow:hidden");
  assert(/white-space\s*:\s*normal/.test(memoryRule) && /overflow\s*:\s*visible/.test(memoryRule), "記憶回響仍被單行省略");
});

test("Presentation Helper 不增加主 Render 呼叫或取代 isTransitioning", () => {
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const lockHelper = script.match(/function setChoiceTransitionState[\s\S]*?\n\}/)?.[0] || "";
  const visibilityHelper = script.match(/function syncGameUiVisibility[\s\S]*?\n\}/)?.[0] || "";
  assert(!/showStory\s*\(|updateStatus\s*\(/.test(lockHelper + visibilityHelper), "Presentation Helper 額外呼叫主 Render");
  assert(/isTransitioning\s*=\s*true;\s*setChoiceTransitionState\(true\)/.test(script), "視覺鎖定沒有投影既有 isTransitioning");
});

console.log(`\nUX Sprint 3.1 Presentation Regression：${passed}/${passed} 通過`);
