const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({
  console,
  document: { getElementById() { return { innerHTML: "", value: "型態測試", style: {} }; }, querySelectorAll() { return []; }, querySelector() { return null; } },
  localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
  window: { setTimeout(callback) { callback(); } }
});
for (const file of ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "story.js", "save.js", "script.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });

const cases = [
  ["本壘板指揮官", "捕手", "捕手核心", { gameCalling: 10, baseballIQ: 10, blocking: 5, catching: 6 }],
  ["銅牆鐵壁", "捕手", "捕手核心", { blocking: 10, catching: 10, gameCalling: 4, baseballIQ: 4 }],
  ["雷射肩捕手", "捕手", "捕手核心", { armStrength: 10, throwing: 10, blocking: 4, catching: 5 }],
  ["攻擊型捕手", "捕手", "捕手核心", { batting: 12, blocking: 8, gameCalling: 8 }],
  ["精密控球師", "投手", "中繼投手", { control: 11, baseballIQ: 10, pitchStamina: 6 }],
  ["火球派投手", "投手", "中繼投手", { armStrength: 12, throwing: 11, control: 7, baseballIQ: 6 }],
  ["吃局機器", "投手", "中繼投手", { pitchStamina: 11, control: 7 }, { recovery: 8 }],
  ["銅牆鐵壁", "內野手", "守備專家", { catching: 10, reaction: 10, range: 10 }],
  ["內野指揮塔", "內野手", "守備專家", { baseballIQ: 10, reaction: 10, catching: 6, range: 6 }],
  ["強肩三游", "內野手", "守備專家", { throwing: 11, armStrength: 10 }],
  ["攻守兼備內野手", "內野手", "守備專家", { batting: 11, catching: 7, reaction: 7, range: 7 }],
  ["外野獵犬", "外野手", "守備專家", { range: 11, reaction: 10 }],
  ["雷射肩外野手", "外野手", "守備專家", { armStrength: 11, throwing: 10 }],
  ["強打外野手", "外野手", "守備專家", { batting: 11, range: 7, reaction: 7 }],
  ["超級工具人", "內野手", "工具人", { baseballIQ: 10, catching: 8 }, null, "外野手"],
  ["靠棒子生存", "外野手", "打擊型球員", { batting: 13 }],
  ["板凳席王牌", "內野手", "代打", { batting: 11 }],
  ["壘間破壞者", "外野手", "速度型球員", { baseRunning: 11 }]
];

const results = [];
for (const [expected, position, role, skills, body, secondary] of cases) {
  const result = vm.runInContext(`
    player = createInitialPlayer(${JSON.stringify(expected)});
    player.seasonPosition = ${JSON.stringify(position)};
    player.secondaryPosition = ${JSON.stringify(secondary || "")};
    Object.assign(player.baseballSkills, ${JSON.stringify(skills)});
    Object.assign(player.body, ${JSON.stringify(body || {})});
    changeRoleIdentity(${JSON.stringify(role)}, "型態測試");
    ({ archetype: player.roleIdentity.archetype, description: getPlayerArchetypeDescription() });
  `, context);
  if (result.archetype !== expected) throw new Error(`${position}／${role} 預期 ${expected}，實際 ${result.archetype}`);
  if (!result.description || result.description.includes("仍在形成")) throw new Error(`${expected} 缺少型態說明`);
  results.push({ position, role, archetype: result.archetype });
}

console.table(results);
console.log(`球員型態測試通過：${results.length} 種代表組合。`);
