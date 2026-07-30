const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
function makeGame() {
  const context = vm.createContext({
    console,
    document: { getElementById() { return { innerHTML: "", value: "角色判定測試", style: {} }; }, querySelectorAll() { return []; }, querySelector() { return null; } },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { setTimeout(callback) { callback(); } }
  });
  for (const file of ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "story.js", "save.js", "script.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  return context;
}

function evaluateFlag(flag, eventId = "transition_pro_roster_window", batting = 2) {
  const game = makeGame();
  return vm.runInContext(`
    player = createInitialPlayer("${flag}");
    player.chapter = "生涯轉換期";
    player.careerExit = "高卒選秀候選";
    player.seasonPosition = "內野手";
    player.secondaryPosition = "";
    Object.assign(player.baseballSkills, { batting: ${batting}, catching: 8, throwing: 8, reaction: 8, range: 8, baseballIQ: 4, baseRunning: 3, control: 2 });
    addFlags([${JSON.stringify(flag)}]);
    const inferredBefore = inferRoleIdentity();
    processCareerArcEvent(${JSON.stringify(eventId)}, {});
    ({ inferredBefore, finalRole: player.roleIdentity.primary });
  `, game);
}

const forcedUtility = evaluateFlag("pro_roster_utility");
if (forcedUtility.finalRole !== "工具人") throw new Error(`pro_roster_utility 應為工具人，實際為 ${forcedUtility.finalRole}`);

const opportunityFlags = [
  ["pro_roster_primary_showdown", "transition_pro_roster_window"],
  ["college_chased_starting_job", "transition_college_eligibility"],
  ["amateur_chose_roster_test", "transition_amateur_company_conflict"],
  ["rehab_full_reentry_test", "transition_rehab_reentry_deadline"],
  ["college_delayed_competition", "transition_college_eligibility"],
  ["amateur_negotiated_conflict", "transition_amateur_company_conflict"],
  ["rehab_tested_with_limits", "transition_rehab_reentry_deadline"]
];

const reports = opportunityFlags.map(([flag, eventId]) => {
  const result = evaluateFlag(flag, eventId);
  if (result.finalRole !== result.inferredBefore) throw new Error(`${flag} 不應強制轉型：${result.inferredBefore} → ${result.finalRole}`);
  return { flag, inferred: result.inferredBefore, final: result.finalRole };
});

for (const flag of ["pro_fought_for_bats", "amateur_showed_ceiling"]) {
  const result = evaluateFlag(flag);
  if (result.finalRole !== "打擊型球員") throw new Error(`${flag} 應維持既有打擊型判定`);
}

const naturalBatting = evaluateFlag("pro_roster_primary_showdown", "transition_pro_roster_window", 12);
if (naturalBatting.inferredBefore !== "打擊型球員" || naturalBatting.finalRole !== "打擊型球員") throw new Error("符合能力條件時應可由 inferRoleIdentity() 自然形成打擊型球員");

console.table(reports);
console.log("職涯道路角色判定回歸測試通過。");
