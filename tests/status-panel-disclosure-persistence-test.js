const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js",
  "baseball-offense-prototype.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
  "career-spine-contract.js", "career-transition-resolver.js", "career-transition-commit.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js",
  "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];

function classListFrom(className = "") {
  const values = new Set(String(className).split(/\s+/).filter(Boolean));
  return {
    add: value => values.add(value), remove: value => values.delete(value),
    contains: value => values.has(value),
    toggle(value, force) {
      if (force === true) values.add(value);
      else if (force === false) values.delete(value);
      else if (values.has(value)) values.delete(value);
      else values.add(value);
      return values.has(value);
    }
  };
}

function createStatusRoot() {
  let html = "";
  let details = [];
  const listeners = new Map();
  return {
    id: "status", style: {}, dataset: {}, classList: classListFrom(),
    get innerHTML() { return html; },
    set innerHTML(value) {
      html = String(value);
      details = [...html.matchAll(/<details class="([^"]*)" data-status-disclosure="([^"]+)"( open)?>/g)].map(match => ({
        open: Boolean(match[3]),
        dataset: { statusDisclosure: match[2] },
        classList: classListFrom(match[1]),
        getAttribute(name) { return name === "data-status-disclosure" ? this.dataset.statusDisclosure : null; }
      }));
    },
    querySelectorAll(selector) {
      return selector === "details.status-section[data-status-disclosure]" ? details.slice() : [];
    },
    addEventListener(type, listener, capture) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push({ listener, capture });
    },
    listenerCount(type) { return (listeners.get(type) || []).length; },
    disclosure(key) { return details.find(item => item.dataset.statusDisclosure === key) || null; },
    toggleDisclosure(key, open) {
      const target = this.disclosure(key);
      if (!target) throw new Error(`找不到 disclosure: ${key}`);
      target.open = Boolean(open);
      (listeners.get("toggle") || []).forEach(item => item.listener({ target }));
      return target;
    }
  };
}

function makeContext() {
  const nodes = new Map();
  const statusRoot = createStatusRoot();
  nodes.set("status", statusRoot);
  const document = {
    body: { classList: classListFrom(), appendChild() {} }, activeElement: null,
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        id, innerHTML: "", textContent: "", value: id === "nameInput" ? "Disclosure 測試" : "",
        style: {}, dataset: {}, disabled: false, classList: classListFrom(),
        focus() { document.activeElement = this; }, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
      });
      return nodes.get(id);
    },
    querySelector(selector) { return selector === ".debug-bookmarks" ? { open: false } : null; },
    querySelectorAll() { return []; },
    createElement() { return { value: "", style: {}, setAttribute() {}, select() {}, remove() {} }; }, execCommand() { return true; }
  };
  const context = vm.createContext({
    console: { log() {}, warn() {}, error: console.error }, document, module: { exports: {} }, URLSearchParams,
    navigator: { clipboard: { async writeText() {} } },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { location: { search: "" }, setTimeout() { return 1; }, clearTimeout() {} }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  context.__statusRoot = statusRoot;
  return context;
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
let passed = 0;
function verify(title, condition) { assert.ok(condition, title); passed += 1; console.log(`✓ ${title}`); }

evaluate(`player=createInitialPlayer("Disclosure Player");player.chapter="少棒入門";updateStatus();`);
verify("1. 恢復既定 UX default：能力與技能初始展開", context.__statusRoot.disclosure("abilities")?.open === true);
verify("2. 保留既有 UX default：人物關係初始收合", context.__statusRoot.disclosure("relationships")?.open === false);

const playerBeforeToggle = evaluate("JSON.stringify(player)");
context.__statusRoot.toggleDisclosure("abilities", true);
verify("3. 原生 toggle 更新 transient abilities state 且不修改 Player", evaluate("statusPanelDisclosureState.abilities===true") && evaluate("JSON.stringify(player)") === playerBeforeToggle);
evaluate("updateStatus()");
verify("4. Status 完整 innerHTML 重建後 abilities 仍展開", context.__statusRoot.disclosure("abilities")?.open === true);

context.__statusRoot.toggleDisclosure("abilities", false);
evaluate("updateStatus()");
verify("5. 玩家手動收合 abilities 後重建仍維持收合", context.__statusRoot.disclosure("abilities")?.open === false);

context.__statusRoot.toggleDisclosure("relationships", true);
evaluate("updateStatus()");
verify("6. 人物關係使用同一機制並跨 render 保持展開", context.__statusRoot.disclosure("relationships")?.open === true);
context.__statusRoot.toggleDisclosure("growth", true);
evaluate("updateStatus()");
verify("7. 成長與身份也使用相同 stable-key mechanism", context.__statusRoot.disclosure("growth")?.open === true);
verify("8. 多次 render 只在持續存在的 status root 綁定一個 toggle listener", context.__statusRoot.listenerCount("toggle") === 1);

context.__statusRoot.toggleDisclosure("abilities", true);
evaluate("player.ballSense=8;updateStatus()");
verify("9. 保存 open state 時 Status 內容仍會投影最新能力值", context.__statusRoot.disclosure("abilities")?.open === true && context.__statusRoot.innerHTML.includes("球感</span><strong>8</strong>"));

evaluate(`
  stopHighSchoolMatchPlayback("disclosure-test-reset");
  player=createRepresentativeHighSchoolEntryFixture("ordinary",71001);
  player.highSchoolRoleCode="bench";player.highSchoolTeamRole="發展／板凳任務";
  pendingHighSchoolMatchPositionOverride="二壘手";pendingHighSchoolMatchSimulationSeed=71001;
  prepareHighSchoolYearOneMatch();showCurrentEvent();
`);
context.__statusRoot.toggleDisclosure("abilities", true);
const beforeMatchCursor = evaluate("getHighSchoolPresentedEventCursor(player.highSchoolMatch)");
evaluate("advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);showCurrentEvent()");
verify("10. 實際 Match playback step 與 showCurrentEvent render 後 abilities 仍展開", context.__statusRoot.disclosure("abilities")?.open === true && evaluate("getHighSchoolPresentedEventCursor(player.highSchoolMatch)") >= beforeMatchCursor);

context.__statusRoot.toggleDisclosure("abilities", false);
evaluate("advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);showCurrentEvent()");
verify("11. 實際 Match 下一次 render 後 abilities 仍維持手動收合", context.__statusRoot.disclosure("abilities")?.open === false);
verify("12. 保留原生 details／summary，未偽造 ARIA accordion", /<details class="status-section" data-status-disclosure="abilities"/.test(context.__statusRoot.innerHTML) && /<summary>能力與技能<\/summary>/.test(context.__statusRoot.innerHTML) && !/<summary[^>]+(?:role=|aria-expanded=)/.test(context.__statusRoot.innerHTML));
verify("13. Disclosure state 未進 Player 或 Match schema", !Object.hasOwn(evaluate("player"), "statusPanelDisclosureState") && !Object.hasOwn(evaluate("player.highSchoolMatch"), "statusPanelDisclosureState"));

evaluate("resetGame()");
verify("14. 完全重新開始遊戲會清除 transient disclosure state 並恢復能力預設展開", evaluate("Object.keys(statusPanelDisclosureState).length===0") && context.__statusRoot.disclosure("abilities")?.open === true);

console.log(`\nCapability Human Validation UI Fix：${passed}/${passed} 通過`);
