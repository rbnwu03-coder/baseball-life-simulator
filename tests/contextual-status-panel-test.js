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

function createNode(id) {
  let html = "";
  return {
    id,
    textContent: "",
    value: id === "nameInput" ? "狀態欄測試" : "",
    style: {},
    classList: createClassList(),
    focus() {},
    setAttribute() {},
    removeAttribute() {},
    get innerHTML() { return html; },
    set innerHTML(value) { html = String(value); },
    querySelectorAll() { return []; }
  };
}

function makeContext(debugOpen = false) {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    body: { classList: createClassList(["creation-mode"]) },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, createNode(id));
      return nodes.get(id);
    },
    querySelector(selector) {
      return selector === ".debug-bookmarks" ? { open: debugOpen } : null;
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
    window: { setTimeout: callback => { callback(); return 1; } }
  });
  runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  context.__nodes = nodes;
  context.__storage = storage;
  return context;
}

function count(text, token) {
  return String(text).split(token).length - 1;
}

function sectionSource(source, start, end) {
  return source.slice(source.indexOf(start), source.indexOf(end));
}

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) return "";
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return "";
}

const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const baselineScript = execFileSync("git", ["show", "HEAD:script.js"], { cwd: root, encoding: "utf8" });
const game = makeContext(false);

vm.runInContext("player=createInitialPlayer('摘要測試'); player.chapter='少棒入門'; player.body.stamina=9; player.body.fatigue=2; updateStatus();", game);
let statusHtml = game.__nodes.get("status").innerHTML;

verify("1. Status Panel 有單一 Current Summary 根區塊", count(statusHtml, "class=\"status-current-summary\"") === 1);
verify("2. Current Summary 位於詳細資料之前", statusHtml.indexOf("status-current-summary") < statusHtml.indexOf("status-details"));
verify("3. 有有效目標時顯示目標", statusHtml.includes("完成兩項基本動作") && statusHtml.includes("status-summary__goal"));
vm.runInContext("player.goalState.current=null; player.currentGoal=''; document.getElementById('status').innerHTML=renderCurrentStatusSummary(getCurrentStatusSummary());", game);
statusHtml = game.__nodes.get("status").innerHTML;
verify("4. 無有效目標時不顯示空目標區", !statusHtml.includes("status-summary__goal") && !statusHtml.includes("<strong></strong>"));
verify("5. 顯示既有人生階段或身份資料", statusHtml.includes("少棒入門") && statusHtml.includes("10 歲"));
verify("6. 身體狀態只使用既有 Player 欄位", statusHtml.includes("體力") && statusHtml.includes(">9<") && statusHtml.includes("疲勞") && statusHtml.includes(">2<"));

const summaryHelpers = sectionSource(script, "function renderStatusSection", "function auditSkillGrowthSources");
verify("7. 摘要不重新執行 Goal、Evaluation 或 Competition 計算", !/updateGoals\s*\(|evaluateMarket\s*\(|refreshStartingCompetition\s*\(|refreshPlayerArchetype\s*\(/.test(summaryHelpers));
const helperPlayerBefore = vm.runInContext("JSON.stringify(player)", game);
vm.runInContext("getCurrentStatusSummary({pendingHtml:'<div>提醒</div>',competitionHtml:'<div>競爭</div>'})", game);
verify("8. 摘要 Helper 不修改 Player", vm.runInContext("JSON.stringify(player)", game) === helperPlayerBefore);
vm.runInContext("updateStatus();", game);
statusHtml = game.__nodes.get("status").innerHTML;

verify("9. 能力與技能為獨立區塊", statusHtml.includes("<summary>能力與技能</summary>"));
verify("10. 人物關係為獨立區塊", statusHtml.includes("<summary>人物關係</summary>"));
verify("11. 成長與身份為獨立區塊", statusHtml.includes("<summary>成長與身份</summary>"));
verify("12. 章節評估為獨立區塊契約", script.includes('renderStatusSection("章節評估", evaluationHtml)'));
verify("13. 生涯與市場為獨立區塊契約", script.includes('renderStatusSection("生涯與市場", careerHtml)'));
verify("14. 無資料區塊不渲染", !statusHtml.includes("<summary>章節評估</summary>") && !statusHtml.includes("<summary>生涯與市場</summary>"));
verify("15. 未登場人物不提前顯示", !statusHtml.includes("阿哲") && !statusHtml.includes("高橋") && !statusHtml.includes("山本"));
verify("16. 少棒前期不顯示成年市場空值", !statusHtml.includes("市場重估") && !statusHtml.includes("球探評價"));

verify("17. 詳細區塊使用可鍵盤操作的原生 details/summary", statusHtml.includes("<details class=\"status-section\"") && statusHtml.includes("<summary>能力與技能</summary>"));
verify("18. 收合不呼叫 updateStatus", !/addEventListener[\s\S]{0,180}updateStatus|ontoggle[\s\S]{0,100}updateStatus/.test(script));
verify("19. 收合不修改 Player", !/status-section[\s\S]{0,200}player\s*=|status-section[\s\S]{0,200}player\.[\w]+\s*=/.test(script));
verify("20. 收合不寫入 Save", !/status-section[\s\S]{0,300}saveGame\s*\(|saveGame\s*\([\s\S]{0,300}status-section/.test(script));
verify("21. 收合狀態不寫入 localStorage", !/status-section[\s\S]{0,300}localStorage|localStorage[\s\S]{0,300}status-section/.test(script));
vm.runInContext("player.ballSense=7; updateStatus();", game);
statusHtml = game.__nodes.get("status").innerHTML;
verify("22. 收合後 Gameplay 更新仍投影最新值", statusHtml.includes("球感</span><strong>7</strong>"));
vm.runInContext("updateStatus(); updateStatus();", game);
verify("23. 下一次完整狀態重建不產生錯誤", count(game.__nodes.get("status").innerHTML, "status-current-summary") === 1);

verify("24. Debug 資料不混入正式 Current Summary", !sectionSource(statusHtml, "status-current-summary", "status-details").includes("平衡測試"));
verify("25. Debug 關閉時不顯示測試資訊", !statusHtml.includes("系統／測試資訊") && !statusHtml.includes("平衡測試"));
const debugGame = makeContext(true);
vm.runInContext("player=createInitialPlayer('Debug測試'); player.chapter='少棒第一季'; player.seasonResult='輪替球員'; updateStatus();", debugGame);
const debugStatusHtml = debugGame.__nodes.get("status").innerHTML;
verify("26. Debug 開啟時只顯示既有測試資料", debugStatusHtml.includes("系統／測試資訊") && debugStatusHtml.includes("平衡測試") && debugStatusHtml.includes("原始關係數值"));
const debugKeys = vm.runInContext("JSON.stringify(Object.keys(player).sort())", debugGame);
verify("27. Debug DOM 狀態不修改 Gameplay Schema", debugKeys === vm.runInContext("JSON.stringify(Object.keys(createInitialPlayer()).sort())", debugGame));

const countCalls = (source, name) => (source.match(new RegExp(`\\b${name}\\s*\\(`, "g")) || []).length;
verify("28. updateStatus() 呼叫次數不增加", countCalls(script, "updateStatus") === countCalls(baselineScript, "updateStatus"));
verify("29. showStory() 呼叫次數不增加", countCalls(script, "showStory") === countCalls(baselineScript, "showStory"));
const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
const saveSource = fs.readFileSync(path.join(root, "save.js"), "utf8");
verify("30. Status Panel 未新增專用 Player Schema", !/statusPanelState\s*:|statusSectionState\s*:|collapsedStatus\s*:/.test(playerSource));
verify("31. Status Panel 收合狀態不進入 Save Schema", !/statusPanelState|statusSectionState|collapsedStatus/.test(saveSource));
verify("32. 既有 Competition 摘要仍由 Presentation 提供", vm.runInContext("CompetitionPresentation.isValidationEvent('youth_match_entry')", game));
const outcomeSource = sectionSource(script, "function renderYouthSeasonOutcome", "function showNotice");
verify("33. Outcome Hierarchy 保持原有資料與順序", /pendingYouthSeasonOutcome\s*=\s*\{\s*eventId\s*\}/.test(outcomeSource) && outcomeSource.indexOf("outcome__confirmation") < outcomeSource.indexOf("outcome__narrative") && outcomeSource.indexOf("outcome__narrative") < outcomeSource.indexOf("outcome__feedback") && !/applyEffects\s*\(|advanceAfterAction\s*\(/.test(outcomeSource));
const sceneContextSource = sectionSource(script, "function getCompetitionPresentationContext", "function showStory(eventId)");
verify("34. Scene Context 保持純 Presentation", !/showStory\s*\(|updateStatus\s*\(|player\.[\w]+\s*=(?!=)/.test(sceneContextSource) && /CompetitionPresentation\.createPresentation/.test(sceneContextSource));
verify("35. 選項鎖定契約不變", functionSource(script, "setChoiceTransitionState") === functionSource(baselineScript, "setChoiceTransitionState"));

verify("36. 桌面狀態欄不改變主故事欄寬", /\.left-panel\s*\{[^}]*width\s*:\s*68%/.test(css) && /\.right-panel\s*\{[^}]*width\s*:\s*32%/.test(css));
verify("37. 390px 狀態內容可自然換行", /@media\s*\(max-width:\s*900px\)[\s\S]*?\.status-summary__identity,[\s\S]*?grid-template-columns\s*:\s*repeat\(2,minmax\(0,1fr\)\)/.test(css) && /overflow-wrap\s*:\s*anywhere/.test(css));
verify("38. 390px 不使用固定寬度或水平捲動", !/\.status-(?:current-summary|section|details)[^{]*\{[^}]*width\s*:\s*\d+px/.test(css) && !/\.status-(?:current-summary|section|details)[^{]*\{[^}]*overflow-x\s*:\s*(?:auto|scroll)/.test(css));
verify("39. Summary 操作區在手機可完整點擊", /\.status-section\s*>\s*summary\s*\{[^}]*min-height\s*:\s*48px/.test(css) && /@media\s*\(max-width:\s*900px\)[\s\S]*?\.status-section\s*>\s*summary\s*\{[^}]*min-height\s*:\s*52px/.test(css));
verify("40. 收合內容不使用固定高度裁切", !/\.status-section__content\s*\{[^}]*height\s*:/.test(css) && !/\.status-section__content\s*\{[^}]*overflow\s*:\s*hidden/.test(css));

console.log(`\nUX Sprint 3.4 Contextual Status Panel：${passed}/${passed} 通過`);
