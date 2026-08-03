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
  "npc.js",
  "coach.js",
  "rival.js",
  "story.js",
  "save.js",
  "script.js"
];

let passed = 0;

function verify(title, condition) {
  if (!condition) throw new Error(title);
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
    value: id === "nameInput" ? "場景脈絡測試" : "",
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
    querySelector(selector) {
      return selector === ".debug-bookmarks" ? { open: false } : null;
    },
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
  return context;
}

function count(text, token) {
  return String(text).split(token).length - 1;
}

const game = makeContext();
vm.runInContext("player=createInitialPlayer('場景脈絡');", game);

const childhoodEvent = game.getEvent("day1_morning");
const childhoodScene = childhoodEvent.scene;
const childhoodContext = game.getSceneContext("day1_morning", childhoodEvent);
const childhoodHtml = game.renderSceneContext(childhoodContext);

verify("有 event.scene 的事件顯示原場景文字", childhoodHtml.includes(childhoodScene));
verify("原有十歲篇 scene 字串完全不變", childhoodContext.sceneLabel === childhoodScene && childhoodEvent.scene === childhoodScene);

game.showStory("day1_morning");
let storyHtml = game.__nodes.get("story").innerHTML;
verify("十歲篇只出現一個 Scene Context", count(storyHtml, "class=\"scene-context chapter-one-scene-context\"") === 1);

const noSceneEvent = game.getEvent("chapter2_intro");
verify("無 scene 事件維持 optional 而不報錯", typeof noSceneEvent.scene === "undefined");
const noSceneContext = game.getSceneContext("chapter2_intro", noSceneEvent);
const noSceneHtml = game.renderSceneContext(noSceneContext);
verify("無 scene 事件不產生未知或佔位場景", noSceneContext.sceneLabel === "" && !/未知|待補|目前位置|一般場景/.test(noSceneHtml));
verify("無 scene 事件仍顯示可靠章節與時間", noSceneHtml.includes("scene-context__chapter") && noSceneHtml.includes("scene-context__time") && !noSceneHtml.includes("scene-context__location"));

vm.runInContext("player.day=3; player.phase='night';", game);
const nightEvent = game.getNightEvent();
verify("動態夜間事件沿用既有 scene", game.getSceneContext("night", nightEvent).sceneLabel === nightEvent.scene);

vm.runInContext("player=createInitialPlayer('純度測試');", game);
const purityEvent = game.getEvent("day1_morning");
const playerBefore = vm.runInContext("JSON.stringify(player)", game);
const eventBefore = JSON.stringify(purityEvent);
game.getSceneContext("day1_morning", purityEvent);
verify("Context Helper 不修改 Player", vm.runInContext("JSON.stringify(player)", game) === playerBefore);
verify("Context Helper 不修改 Event", JSON.stringify(purityEvent) === eventBefore);

const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const helperSource = script.slice(
  script.indexOf("function getCompetitionPresentationContext"),
  script.indexOf("function showStory(eventId)")
);
verify("Context Helper 不呼叫 showStory 或 updateStatus", !/showStory\s*\(|updateStatus\s*\(/.test(helperSource));

vm.runInContext("originalSceneUpdate=updateStatus; sceneUpdateCalls=0; updateStatus=function(){sceneUpdateCalls++; return originalSceneUpdate();};", game);
game.showStory("day1_morning");
verify("Scene Context 不增加主 Render 呼叫次數", vm.runInContext("sceneUpdateCalls", game) === 1);

vm.runInContext(`player=createInitialPlayer("比賽場景"); Object.assign(player,{chapter:"少棒第一季",seasonStep:4,chapter2Result:"理解型新生"});`, game);
const matchKeysBefore = vm.runInContext("JSON.stringify(Object.keys(player.matchState).sort())", game);
game.showStory("youth_match_entry");
storyHtml = game.__nodes.get("story").innerHTML;
verify("比賽事件取得既有 Competition 名稱", storyHtml.includes("少棒第一季・第一場正式聯賽"));
verify("正式比賽 Context 使用既有 matchState 局數", storyHtml.includes("4 局上"));
verify("Scene Context 不新增 matchState 欄位", vm.runInContext("JSON.stringify(Object.keys(player.matchState).sort())", game) === matchKeysBefore);
verify("Competition Frame 與 Scene Context 各只出現一次", count(storyHtml, "class=\"competition-frame") === 1 && count(storyHtml, "class=\"scene-context chapter-one-scene-context\"") === 1);

game.showStory("youth_match_mistake");
storyHtml = game.__nodes.get("story").innerHTML;
verify("同場下一幕 Context 更新為現有第五局狀態", storyHtml.includes("5 局上") && !storyHtml.includes("scene-context__time\">\n      <small class=\"scene-context__label\">時間</small>\n      <span class=\"scene-context__value\">4 局上"));

vm.runInContext(`player=createInitialPlayer("Outcome"); Object.assign(player,{chapter:"少棒第一季",seasonStep:1,chapter2Result:"理解型新生"}); showCurrentEvent();`, game);
game.choose("youth_position_trial", 0);
storyHtml = game.__nodes.get("story").innerHTML;
verify("Outcome Card 不殘留上一幕 Scene Context", !storyHtml.includes("scene-context") && Boolean(vm.runInContext("pendingYouthSeasonOutcome", game)));
game.continueYouthSeasonOutcome();
storyHtml = game.__nodes.get("story").innerHTML;
verify("Continue 後下一事件產生單一新 Context", count(storyHtml, "class=\"scene-context chapter-one-scene-context\"") === 1 && !vm.runInContext("Boolean(pendingYouthSeasonOutcome)", game));

const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const contextCss = css.match(/\.scene-context,\s*\n\.chapter-one-scene-context\s*\{([\s\S]*?)\}/)?.[1] || "";
verify("Scene Context 使用自然換行且不固定高度裁切", /flex-wrap\s*:\s*wrap/.test(contextCss) && !/height\s*:|overflow\s*:\s*hidden/.test(contextCss));
verify("390px 規則改為直向排列且保留完整文字", /@media[\s\S]*\.scene-context,[\s\S]*\.chapter-one-scene-context\s*\{[\s\S]*flex-direction\s*:\s*column/.test(css) && /\.scene-context__value\s*\{[\s\S]*overflow-wrap\s*:\s*anywhere/.test(css));

verify("pendingYouthSeasonOutcome 與 420ms 契約保持不變", /pendingYouthSeasonOutcome\s*=\s*\{\s*eventId\s*\}/.test(script) && /setTimeout\(\(\)\s*=>\s*\{[\s\S]*?\},\s*420\)/.test(script));

console.log(`\nUX Sprint 3.2 Scene Context Layer：${passed}/${passed} 通過`);
