const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
function makeGame() {
  const context = vm.createContext({
    console,
    document: { getElementById() { return { innerHTML: "", value: "道路差異測試", style: {} }; }, querySelectorAll() { return []; }, querySelector() { return null; } },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { setTimeout(callback) { callback(); } }
  });
  for (const file of ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "career-spine-contract.js", "career-transition-runtime-resolver.js", "story.js", "save.js", "script.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  return context;
}

const routes = {
  draft: { exit: "高卒選秀・中後段指名候選", third: "transition_pro_roster_window" },
  college: { exit: "大學棒球", third: "transition_college_eligibility" },
  amateur: { exit: "業餘／社會人棒球", third: "transition_amateur_company_conflict" },
  rehab: { exit: "復健與生涯暫停", third: "transition_rehab_reentry_deadline" }
};

const report = [];
for (const [route, config] of Object.entries(routes)) {
  const game = makeGame();
  const result = vm.runInContext(`
    player = createInitialPlayer(${JSON.stringify(route)});
    player.chapter = "生涯轉換期";
    player.careerExit = ${JSON.stringify(config.exit)};
    player.transitionStep = 2;
    const thirdId = getCurrentEventId();
    const event = getEvent(thirdId);
    const before = JSON.stringify(player);
    const choice = event.choices[0];
    applyEffects(choice.effects); applySkillEffects(choice.skillEffects); applyBodyEffects(choice.bodyEffects);
    applyAcademicEffects(choice.academicEffects); applyCareerEffects(choice.careerEffects); applyFinanceEffects(choice.financeEffects); addFlags(choice.flags);
    player.transitionStep = 3; const fourthId = getCurrentEventId();
    player.transitionStep = 4; const fifthId = getCurrentEventId();
    player.transitionStep = 5; player.chapter = "生涯轉換期小結"; const resultId = getCurrentEventId();
    ({ thirdId, title: event.title, choices: event.choices.length, changed: before !== JSON.stringify(player), fourthId, fifthId, resultId, checkpointExists: Boolean(getEvent("transition_checkpoint")), chain: adultNarrativeChains[${JSON.stringify(route)}].events });
  `, game);
  if (result.thirdId !== config.third) throw new Error(`${route} 第三事件錯誤：${result.thirdId}`);
  if (result.choices !== 3 || !result.changed) throw new Error(`${route} 新事件選項或效果不完整`);
  if (result.fourthId !== "transition_relationship" || result.fifthId !== "transition_cost_check" || result.resultId !== "transition_result") throw new Error(`${route} 後續順序錯誤`);
  if (!result.checkpointExists || result.chain.includes("transition_checkpoint") || result.chain[2] !== config.third) throw new Error(`${route} 舊事件保留或連續事件鏈同步失敗`);
  report.push({ route, thirdEvent: result.thirdId, title: result.title, next: `${result.fourthId} → ${result.fifthId} → ${result.resultId}` });
}

console.table(report);
console.log("第 9 章職涯道路差異第一階段測試通過。");
