const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

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
  const attributes = new Map();
  return {
    id,
    textContent: "",
    value: id === "nameInput" ? "結果層級測試" : "",
    style: {},
    classList: createClassList(),
    focus() {},
    setAttribute: (name, value) => attributes.set(name, String(value)),
    removeAttribute: name => attributes.delete(name),
    getAttribute: name => attributes.has(name) ? attributes.get(name) : null,
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
  return context;
}

function count(text, token) {
  return String(text).split(token).length - 1;
}

function buttons(game) {
  return game.__nodes.get("choices").querySelectorAll("button");
}

const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const baselineScript = execFileSync("git", ["show", "HEAD:script.js"], { cwd: root, encoding: "utf8" });

const youth = makeContext();
vm.runInContext(`player=createInitialPlayer("少棒結果"); Object.assign(player,{chapter:"少棒第一季",seasonStep:1,chapter2Result:"理解型新生"}); showCurrentEvent();`, youth);
const youthBefore = vm.runInContext("JSON.stringify(player)", youth);
youth.choose("youth_position_trial", 0);
const youthStory = youth.__nodes.get("story").innerHTML;
const youthChoices = youth.__nodes.get("choices").innerHTML;

verify("1. Outcome Card 使用單一共用根 class", count(youthStory, "class=\"event-card outcome choice-outcome-card\"") === 1);
verify("2. Narrative Outcome 存在且為主要內容", youthStory.includes("outcome__narrative") && youthStory.includes("事件結果"));
verify("3. World Reaction 有資料時顯示", youthStory.includes("outcome__reaction") && youthStory.includes("山本教練"));

const conditional = makeContext();
vm.runInContext("player=createInitialPlayer('條件渲染'); player.chapter='少棒第一季'; getYouthSeasonOutcomeReaction=()=>'';", conditional);
conditional.renderYouthSeasonOutcome("youth_position_trial", { text: "可靠選擇", memory: "可靠結果" }, "");
const conditionalStory = conditional.__nodes.get("story").innerHTML;
verify("4. World Reaction 無資料時不渲染空區塊", !conditionalStory.includes("outcome__reaction"));
verify("5. System Feedback 與 Narrative Outcome 分開", youthStory.includes("outcome__narrative") && youthStory.includes("outcome__feedback") && youthStory.indexOf("outcome__narrative") < youthStory.indexOf("outcome__feedback"));
verify("6. Continue 位於結果資訊最後", (youthStory + youthChoices).lastIndexOf("outcome__action") > (youthStory + youthChoices).lastIndexOf("outcome__feedback"));
verify("7. Continue 仍只有一個", buttons(youth).length === 1 && buttons(youth)[0].textContent === "繼續");
const afterOneChoice = vm.runInContext("JSON.stringify(player)", youth);
youth.continueYouthSeasonOutcome();
const afterContinue = vm.runInContext("JSON.stringify(player)", youth);
youth.continueYouthSeasonOutcome();
verify("8. Continue 快速連點不會重複執行", vm.runInContext("JSON.stringify(player)", youth) === afterContinue);
verify("9. pendingYouthSeasonOutcome 行為不變", !vm.runInContext("Boolean(pendingYouthSeasonOutcome)", youth));

const pureRenderer = makeContext();
vm.runInContext("player=createInitialPlayer('純呈現'); player.chapter='少棒第一季';", pureRenderer);
const rendererPlayerBefore = vm.runInContext("JSON.stringify(player)", pureRenderer);
const gameplaySnapshotExpression = "JSON.stringify({ballSense:player.ballSense,observe:player.observe,fitness:player.fitness,confidence:player.confidence,resilience:player.resilience,instinct:player.instinct,flags:player.flags,memories:player.memories,seasonStep:player.seasonStep,forcedEventId:player.forcedEventId,matchState:player.matchState})";
const rendererGameplayBefore = vm.runInContext(gameplaySnapshotExpression, pureRenderer);
pureRenderer.renderYouthSeasonOutcome("youth_position_trial", { text: "只讀選擇", memory: "只讀結果" }, "<div>能力 +1</div>");
verify("10. Outcome Renderer 不重新套用 effects", vm.runInContext(gameplaySnapshotExpression, pureRenderer) === rendererGameplayBefore);
verify("11. 有可靠 choice label 時才顯示確認", pureRenderer.__nodes.get("story").innerHTML.includes("只讀選擇") && pureRenderer.__nodes.get("story").innerHTML.includes("outcome__confirmation"));
pureRenderer.__nodes.get("choices").innerHTML = "<button>DOM 裡的錯誤選擇</button>";
pureRenderer.renderYouthSeasonOutcome("youth_position_trial", { text: "資料中的可靠選擇", memory: "結果" }, "");
verify("12. Choice Confirmation 不從 DOM 反向取值", pureRenderer.__nodes.get("story").innerHTML.includes("資料中的可靠選擇") && !pureRenderer.__nodes.get("story").innerHTML.includes("DOM 裡的錯誤選擇"));
verify("13. Outcome 不新增 Player 或 Save 欄位", JSON.stringify(Object.keys(JSON.parse(rendererPlayerBefore)).sort()) === vm.runInContext("JSON.stringify(Object.keys(player).sort())", pureRenderer));
pureRenderer.renderYouthSeasonOutcome("youth_position_trial", { memory: "只有結果" }, "");
verify("14. 缺少 choice label 時不顯示空確認", !pureRenderer.__nodes.get("story").innerHTML.includes("outcome__confirmation") && !pureRenderer.__nodes.get("story").innerHTML.includes("你的選擇"));

const general = makeContext();
vm.runInContext("player=createInitialPlayer('一般結果'); showCurrentEvent();", general);
const generalBefore = vm.runInContext("JSON.stringify({confidence:player.confidence,memories:player.memories.length})", general);
general.choose("day1_morning", 0);
verify("15. 一般事件仍使用 420ms", general.__timers.length === 1 && general.__timers[0].delay === 420);
verify("16. 一般事件不新增 Continue", !general.__nodes.get("choices").innerHTML.includes("continueYouthSeasonOutcome") && !general.__nodes.get("choices").innerHTML.includes(">繼續<"));
verify("17. changeLog 仍為原始回饋容器", general.__nodes.get("changeLog").innerHTML.includes("outcome-feedback__content"));
verify("18. 一般回饋具有 Outcome Feedback 語意 class", general.__nodes.get("changeLog").classList.contains("outcome__feedback") && general.__nodes.get("changeLog").getAttribute("aria-label") === "上一個選擇的系統回饋");
verify("19. 一般回饋完整顯示且不裁切", /#changeLog\s*\{[\s\S]*?height\s*:\s*auto[\s\S]*?overflow\s*:\s*visible/.test(css) && !/#changeLog\.outcome__feedback\s*\{[^}]*overflow\s*:\s*hidden/.test(css));
general.__timers.shift().callback();
verify("20. 新事件出現後新選項可操作", buttons(general).length > 0 && buttons(general).every(button => !button.disabled));
general.choose("day1_afternoon", 0);
const generalOnce = vm.runInContext("JSON.stringify({confidence:player.confidence,memories:player.memories.length})", general);
general.choose("day1_afternoon", 0);
verify("21. 一般事件快速連點只套用一次", vm.runInContext("JSON.stringify({confidence:player.confidence,memories:player.memories.length})", general) === generalOnce && generalBefore !== generalOnce);

verify("22. Outcome Continue 後不殘留 Outcome Card", !youth.__nodes.get("story").innerHTML.includes("choice-outcome-card"));
verify("23. Continue 後產生下一幕 Scene Context", count(youth.__nodes.get("story").innerHTML, "scene-context chapter-one-scene-context") === 1);

const persistence = makeContext();
vm.runInContext(`player=createInitialPlayer("存讀結果"); Object.assign(player,{chapter:"少棒第一季",seasonStep:1,chapter2Result:"理解型新生"}); showCurrentEvent();`, persistence);
persistence.choose("youth_position_trial", 0);
persistence.saveGame();
persistence.loadGame();
verify("24. 讀檔後不殘留 Outcome class", !persistence.__nodes.get("story").innerHTML.includes("choice-outcome-card") && !persistence.__nodes.get("changeLog").classList.contains("outcome__feedback"));
verify("25. 讀檔後不殘留 locked class", !persistence.__nodes.get("choices").classList.contains("is-transitioning") && buttons(persistence).every(button => !button.disabled));
persistence.deleteSave();
verify("26. 刪除存檔後不顯示 Outcome", !persistence.__nodes.get("story").innerHTML.includes("outcome") && !persistence.__nodes.get("changeLog").classList.contains("outcome__feedback"));
general.resetGame();
verify("27. 一般事件 Feedback 依既有重設政策清除", general.__nodes.get("changeLog").innerHTML === "" && !general.__nodes.get("changeLog").classList.contains("outcome__feedback"));

const countCalls = (source, name) => (source.match(new RegExp(`\\b${name}\\s*\\(`, "g")) || []).length;
verify("28. 不增加 showStory() 呼叫次數", countCalls(script, "showStory") === countCalls(baselineScript, "showStory"));
verify("29. 不增加 updateStatus() 呼叫次數", countCalls(script, "updateStatus") === countCalls(baselineScript, "updateStatus"));
verify("30. 不修改 Player Schema", execFileSync("git", ["diff", "--name-only", "--", "player.js"], { cwd: root, encoding: "utf8" }).trim() === "");
verify("31. 不修改 Save Schema", execFileSync("git", ["diff", "--name-only", "--", "save.js"], { cwd: root, encoding: "utf8" }).trim() === "");
const matchBefore = vm.runInContext("JSON.stringify(player.matchState)", pureRenderer);
pureRenderer.renderYouthSeasonOutcome("youth_match_grounder", { text: "守位選擇", memory: "守位結果" }, "");
verify("32. Outcome 不修改 matchState", vm.runInContext("JSON.stringify(player.matchState)", pureRenderer) === matchBefore);
verify("33. 不修改事件 effects 或路由", execFileSync("git", ["diff", "--name-only", "--", "story.js", "competition-presentation.js"], { cwd: root, encoding: "utf8" }).trim() === "" && vm.runInContext(gameplaySnapshotExpression, pureRenderer) === rendererGameplayBefore);

verify("34. Outcome 長內容可自然換行", /\.outcome,[\s\S]*?overflow-wrap\s*:\s*anywhere/.test(css) && !/\.choice-outcome-card\s*\{[^}]*height\s*:/.test(css));
verify("35. 390px 版面不設定水平裁切或固定寬度", /@media\s*\(max-width:\s*900px\)/.test(css) && /\.outcome,[\s\S]*?max-width\s*:\s*100%/.test(css) && !/\.outcome[^}]*width\s*:\s*[4-9]\d{2}px/.test(css));
verify("36. Continue 在手機寬度維持完整可操作", /#choices button\s*\{[^}]*width\s*:\s*100%/.test(css) && /#choices \.outcome-continue-button\s*\{[^}]*max-width\s*:\s*100%/.test(css) && buttons(pureRenderer).length === 1);

console.log(`\nUX Sprint 3.3 Outcome and Transition Hierarchy：${passed}/${passed} 通過`);
