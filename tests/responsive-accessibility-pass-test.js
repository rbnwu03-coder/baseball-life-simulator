const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "npc.js", "coach.js", "rival.js", "story.js", "save.js", "script.js"
];

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
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

function makeContext() {
  const nodes = new Map();
  const focusTargets = new Map();
  const timers = [];
  const storage = new Map();
  let activeElement = null;

  function createFocusable(id) {
    return {
      id,
      tabIndex: -1,
      focusOptions: null,
      focus(options) {
        this.focusOptions = options || null;
        activeElement = this;
      }
    };
  }

  function createButton(markup, label) {
    const attributes = new Map();
    const classMatch = markup.match(/class="([^"]*)"/);
    let disabled = /\sdisabled(?:\s|>|=)/.test(markup);
    const button = {
      textContent: label,
      classList: createClassList(classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : []),
      setAttribute: (name, value) => attributes.set(name, String(value)),
      removeAttribute: name => attributes.delete(name),
      getAttribute: name => attributes.has(name) ? attributes.get(name) : null
    };
    Object.defineProperty(button, "disabled", {
      get: () => disabled,
      set(value) {
        disabled = Boolean(value);
      }
    });
    return button;
  }

  function createNode(id) {
    let inner = "";
    let buttons = [];
    const attributes = new Map();
    return {
      id,
      value: id === "nameInput" ? "無障礙測試" : "",
      textContent: "",
      style: {},
      classList: createClassList(),
      setAttribute: (name, value) => attributes.set(name, String(value)),
      removeAttribute: name => attributes.delete(name),
      getAttribute: name => attributes.has(name) ? attributes.get(name) : null,
      get innerHTML() { return inner; },
      set innerHTML(value) {
        inner = String(value);
        if (id === "story") {
          ["currentEventTitle", "outcomeTitle"].forEach(targetId => {
            if (inner.includes(`id="${targetId}"`) || inner.includes(`id='${targetId}'`)) {
              focusTargets.set(targetId, createFocusable(targetId));
            }
            else focusTargets.delete(targetId);
          });
        }
        if (id === "choices") {
          buttons = Array.from(inner.matchAll(/(<button[^>]*>)([\s\S]*?)<\/button>/g))
            .map(match => createButton(match[1], match[2].replace(/<[^>]+>/g, "").trim()));
        }
      },
      querySelectorAll(selector) { return selector === "button" ? buttons : []; },
      get buttons() { return buttons; }
    };
  }

  const document = {
    body: { classList: createClassList(["creation-mode"]) },
    get activeElement() { return activeElement; },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, createNode(id));
      return nodes.get(id);
    },
    querySelector(selector) {
      if (selector === ".debug-bookmarks") return null;
      if (selector === "#currentEventTitle") return focusTargets.get("currentEventTitle") || null;
      if (selector === "#outcomeTitle") return focusTargets.get("outcomeTitle") || null;
      if (selector === "#choices .outcome-continue-button") {
        return document.getElementById("choices").buttons.find(button => button.classList.contains("outcome-continue-button")) || null;
      }
      return null;
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
  runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  context.__nodes = nodes;
  context.__timers = timers;
  context.__document = document;
  return context;
}

function choiceButtons(game) {
  return game.__nodes.get("choices").querySelectorAll("button");
}

verify("1. viewport 允許標準響應式縮放", /<meta name="viewport" content="width=device-width, initial-scale=1">/.test(html) && !/maximum-scale|user-scalable\s*=\s*no/i.test(html));
verify("2. 創角名字輸入有正式 label", /<label for="nameInput"[^>]*>主角名字<\/label>/.test(html));
verify("3. Status Panel 是具名稱的 complementary region", /<aside class="right-panel" aria-labelledby="statusPanelTitle">/.test(html) && /id="statusPanelTitle"/.test(html));
verify("4. 選項容器具有清楚用途", /id="choices" role="group" aria-label="事件選項"/.test(html));
verify("5. visually-hidden 不使用 display 或 visibility 隱藏", /\.visually-hidden\s*\{/.test(css) && !/\.visually-hidden\s*\{[^}]*(?:display\s*:\s*none|visibility\s*:\s*hidden)/.test(css));
verify("6. 共用 focus-visible 具有外框與間距", /:where\(button,input,select,textarea,summary\):focus-visible\s*\{[^}]*outline\s*:[^;]+;[^}]*outline-offset\s*:/s.test(css));
verify("7. 程式焦點標題具有可見外框", /#currentEventTitle:focus,[\s\S]*#outcomeTitle:focus\s*\{[^}]*outline\s*:/.test(css));
verify("8. 一般按鈕最小操作高度達 44px", /button\s*\{[^}]*min-height\s*:\s*44px/.test(css));
verify("9. 手機存讀檔按鈕可換行", /@media\s*\(max-width:\s*900px\)[\s\S]*?\.save-buttons\s*\{[^}]*flex-wrap\s*:\s*wrap/.test(css));
verify("10. 手機長內容保留自然換行", /@media\s*\(max-width:\s*900px\)[\s\S]*?\.competition-frame,[\s\S]*?overflow-wrap\s*:\s*anywhere/.test(css));

const sceneSource = script.slice(script.indexOf("function renderSceneContext"), script.indexOf("function showStory(eventId)"));
verify("11. Scene Context 使用具標題的 section", /<section class="scene-context chapter-one-scene-context" aria-labelledby="sceneContextTitle">/.test(sceneSource));
verify("12. Scene Context 標題 ID 存在", /id="sceneContextTitle"[^>]*>場景資訊/.test(sceneSource));
const showStorySource = script.slice(script.indexOf("function showStory(eventId)"), script.indexOf("function prepareMatchStateForEvent"));
verify("13. Main Event 使用 article 與 aria-labelledby", /<article class="event-card" aria-labelledby="currentEventTitle">/.test(showStorySource));
verify("14. Main Event 標題可程式聚焦但不進 Tab 順序", /id="currentEventTitle" tabindex="-1"/.test(showStorySource));
const outcomeSource = script.slice(script.indexOf("function renderYouthSeasonOutcome"), script.indexOf("function showNotice"));
verify("15. Outcome 使用 article 與 aria-labelledby", /choice-outcome-card" aria-labelledby="outcomeTitle"/.test(outcomeSource));
verify("16. Outcome 標題可程式聚焦但不進 Tab 順序", /id="outcomeTitle" tabindex="-1"/.test(outcomeSource));
verify("17. Outcome 沒有 assertive live region", !/aria-live="assertive"/.test(outcomeSource));
verify("18. 原生 summary 沒有衝突 role 或 aria-expanded", /<summary>\$\{escapeHtml\(title\)\}<\/summary>/.test(script) && !/<summary[^>]+(?:role=|aria-expanded=)/.test(script));
verify("19. 沒有新增正值 tabindex", !/tabindex="[1-9]\d*"/.test(html + script));

const lockSource = script.slice(script.indexOf("function setChoiceTransitionState"), script.indexOf("function syncGameUiVisibility"));
verify("20. 選項鎖定使用原生 disabled", /button\.disabled\s*=\s*Boolean\(locked\)/.test(lockSource));
verify("21. 選項鎖定保留一致 aria-disabled 投影", /setAttribute\?\.\("aria-disabled",\s*"true"\)/.test(lockSource));
verify("22. 程式狀態在 effects 前鎖定", script.indexOf("isTransitioning = true;\n  setChoiceTransitionState(true);") < script.indexOf("applyEffects(choice.effects)"));
verify("23. Continue 有單一用途鎖定 helper", /function setOutcomeContinueState\(locked\)/.test(script) && /setOutcomeContinueState\(true\);[\s\S]*pendingYouthSeasonOutcome = null/.test(outcomeSource));
verify("24. 焦點 helper 找不到目標時安全失敗", /if \(!target \|\| typeof target\.focus !== "function"\) return false/.test(script));
verify("25. 焦點 helper 不呼叫 Render 或點擊", !/showStory\s*\(|updateStatus\s*\(|\.click\s*\(/.test(script.slice(script.indexOf("function focusRenderedElement"), script.indexOf("function syncGameUiVisibility"))));

const game = makeContext();
vm.runInContext("player=createInitialPlayer('鍵盤流程'); showCurrentEvent();", game);
verify("26. 事件 Render 後焦點位於事件標題", game.__document.activeElement?.id === "currentEventTitle");
verify("27. 事件標題聚焦使用 preventScroll", game.__document.activeElement?.focusOptions?.preventScroll === true);
verify("28. 新事件不自動聚焦第一個選項", !choiceButtons(game).includes(game.__document.activeElement));
const beforeGeneral = vm.runInContext("JSON.stringify({confidence:player.confidence,day:player.day,phase:player.phase,memories:player.memories.length})", game);
game.choose("day1_morning", 0);
const afterGeneral = vm.runInContext("JSON.stringify({confidence:player.confidence,day:player.day,phase:player.phase,memories:player.memories.length})", game);
verify("29. 選擇後同組按鈕立即全部 disabled", choiceButtons(game).length > 1 && choiceButtons(game).every(button => button.disabled));
game.choose("day1_morning", 0);
verify("30. 快速重複觸發只套用一次效果", beforeGeneral !== afterGeneral && vm.runInContext("JSON.stringify({confidence:player.confidence,day:player.day,phase:player.phase,memories:player.memories.length})", game) === afterGeneral);
verify("31. 一般事件仍只有一個 420ms 轉場", game.__timers.length === 1 && game.__timers[0].delay === 420);
game.__timers.shift().callback();
verify("32. 一般轉場後焦點進入新事件標題", game.__document.activeElement?.id === "currentEventTitle" && game.getCurrentEventId() === "day1_afternoon");

const youth = makeContext();
vm.runInContext(`player=createInitialPlayer("Outcome焦點"); Object.assign(player,{chapter:"少棒第一季",seasonStep:1,chapter2Result:"理解型新生"}); showCurrentEvent();`, youth);
youth.choose("youth_position_trial", 0);
verify("33. Outcome 顯示後焦點位於 Outcome 標題", youth.__document.activeElement?.id === "outcomeTitle");
verify("34. Outcome 只建立一個 Continue", choiceButtons(youth).length === 1 && choiceButtons(youth)[0].textContent === "繼續");
const continueButton = choiceButtons(youth)[0];
vm.runInContext("setOutcomeContinueState(true)", youth);
verify("35. Continue 鎖定 helper 會套用原生 disabled", continueButton.disabled && continueButton.getAttribute("aria-disabled") === "true");
vm.runInContext("setOutcomeContinueState(false); originalA11ySetOutcomeContinueState=setOutcomeContinueState; a11yOutcomeLockCalls=[]; setOutcomeContinueState=function(locked){a11yOutcomeLockCalls.push(locked); return originalA11ySetOutcomeContinueState(locked);}; originalA11yShowStory=showStory; a11yRenderCount=0; showStory=function(id){a11yRenderCount++; return originalA11yShowStory(id);};", youth);
youth.continueYouthSeasonOutcome();
verify("36. Continue 觸發時先要求鎖定", vm.runInContext("a11yOutcomeLockCalls.length === 1 && a11yOutcomeLockCalls[0] === true", youth));
verify("37. Continue 後只 Render 一次", vm.runInContext("a11yRenderCount", youth) === 1);
verify("38. Continue 後焦點位於下一事件標題", youth.__document.activeElement?.id === "currentEventTitle" && youth.getCurrentEventId() === "youth_teammate");
youth.continueYouthSeasonOutcome();
verify("39. Continue 重複觸發不再 Render", vm.runInContext("a11yRenderCount", youth) === 1);
verify("40. pendingYouthSeasonOutcome 防重複契約仍有效", !vm.runInContext("Boolean(pendingYouthSeasonOutcome)", youth));
verify("41. 不存在的焦點目標不拋錯", vm.runInContext("focusRenderedElement('#missing-target')", youth) === false);

const changedFiles = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
verify("42. 未修改 Player、Save、Story 或 Competition 資料檔", !changedFiles.some(file => ["player.js", "save.js", "story.js", "competition-presentation.js"].includes(file)));
verify("43. 未新增 active NPC 推測", !/activeNpcId|activeNpcIds|speakerNpcId|presentNpcIds/.test(script));
verify("44. Save key 與 schema 未變", execFileSync("git", ["diff", "--name-only", "--", "save.js", "player.js"], { cwd: root, encoding: "utf8" }).trim() === "");
verify("45. Competition Presentation 未變", execFileSync("git", ["diff", "--name-only", "--", "competition-presentation.js"], { cwd: root, encoding: "utf8" }).trim() === "");

console.log(`\nUX Sprint 3.5 Responsive and Accessibility Pass：${passed}/${passed} 通過`);
