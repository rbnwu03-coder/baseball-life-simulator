const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "story.js", "save.js", "script.js"];

function makeGame() {
  const nodes = new Map();
  const context = vm.createContext({
    console,
    document: {
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, { innerHTML: "", value: "生涯測試", style: {} });
        return nodes.get(id);
      },
      querySelectorAll() { return []; },
      querySelector() { return null; }
    },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { setTimeout(callback) { callback(); } }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  return context;
}

const routes = [
  { name: "順遂路線", role: "守備專家", flag: "development_specialized", position: "內野手" },
  { name: "傷病路線", role: "守備專家", flag: "development_expanded_role", position: "內野手", injury: 11, pain: 6 },
  { name: "工具人路線", role: "工具人", flag: "development_specialized", position: "外野手", utility: true },
  { name: "高橋宿敵路線", role: "守備專家", flag: "development_bat_first", position: "內野手", rivalry: 10 },
  { name: "教練信任路線", role: "守備專家", flag: "development_expanded_role", position: "捕手", coach: 12 },
  { name: "健康管理路線", role: "工具人", flag: "development_specialized", position: "捕手", recovery: 10, utility: true },
  { name: "高天賦低穩定路線", role: "打擊型球員", flag: "development_expanded_role", position: "外野手", batting: 15, fatigue: 12 },
  { name: "普通球員逆襲路線", role: "守備專家", flag: "development_bat_first", position: "內野手", batting: 10, performance: 5 }
];

function runRoute(route) {
  const game = makeGame();
  vm.runInContext(`
    player = createInitialPlayer(${JSON.stringify(route.name)});
    player.age = 20;
    player.chapter = "發展期";
    player.seasonPosition = ${JSON.stringify(route.position)};
    player.secondaryPosition = ${route.utility ? JSON.stringify(route.position === "內野手" ? "外野手" : "內野手") : '""'};
    player.baseballSkills.catching = 9;
    player.baseballSkills.throwing = 8;
    player.baseballSkills.range = 8;
    player.baseballSkills.reaction = 8;
    player.baseballSkills.baseballIQ = ${route.utility ? 10 : 7};
    player.baseballSkills.baseRunning = ${route.utility ? 8 : 5};
    player.baseballSkills.batting = ${route.batting || 7};
    player.baseballSkills.blocking = 8;
    player.baseballSkills.gameCalling = 8;
    player.baseballSkills.control = 8;
    player.baseballSkills.pitchStamina = 8;
    player.relationships.coachTrust = ${route.coach || 7};
    player.relationships.rivalRespect = ${route.rivalry || 5};
    player.recentPerformance = ${route.performance || 3};
    player.reputation = 5;
    player.scoutEvaluation = 4;
    player.exposure = 4;
    player.body.injuryRisk = ${route.injury || 2};
    player.body.pain = ${route.pain || 0};
    player.body.fatigue = ${route.fatigue || 2};
    player.body.recovery = ${route.recovery || 6};
    changeRoleIdentity(${JSON.stringify(route.role)}, "測試初始角色");
    updateCareerValue();
    processCareerArcEvent("high_school_showcase", {});
    addFlags([${JSON.stringify(route.flag)}]);
    processCareerArcEvent("development_competition", {});
    ${route.injury ? 'addFlags(["development_adjusted_role"]); processCareerArcEvent("development_body_choice", {});' : ""}
    processCareerArcEvent("development_opportunity", {});
    evaluateMarket();
    updateCareerValue();
  `, game);
  return vm.runInContext(`({
    peak: player.careerValue.peak,
    minimum: player.careerValue.minimum,
    changes: player.roleIdentity.previous.length,
    reinventions: player.careerArc.reinventions,
    peaks: player.careerArc.peaks,
    valleys: player.careerArc.valleys,
    role: player.roleIdentity.primary,
    turningPoints: player.turningPoints.map(point => point.id),
    summary: generateCareerSummary()
  })`, game);
}

const results = routes.map(route => ({ route: route.name, ...runRoute(route) }));
for (const result of results) {
  if (!result.turningPoints.some(id => id.startsWith("role_lost_"))) throw new Error(`${result.route} 沒有角色失效轉折`);
  if (!result.turningPoints.includes("needed_again")) throw new Error(`${result.route} 沒有再次被需要`);
  if (result.peaks < 2 || result.valleys < 1) throw new Error(`${result.route} 缺少坡峰坡谷`);
  if (!result.summary.includes("最高") || !result.summary.includes("最低")) throw new Error(`${result.route} 生涯摘要不完整`);
}

console.table(results.map(result => ({
  路線: result.route,
  最高市場價值: result.peak,
  最低市場價值: result.minimum,
  轉型次數: result.reinventions,
  角色更換次數: result.changes,
  高峰次數: result.peaks,
  低谷次數: result.valleys,
  最終角色: result.role
})));
console.log("取得角色 → 失去角色 → 重新定義角色：八條路線全部通過");
