const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "story.js", "save.js", "script.js"];
function makeGame() {
  const nodes = new Map();
  const context = vm.createContext({
    console,
    document: {
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, { innerHTML: "", value: "平衡測試球員", style: {} });
        return nodes.get(id);
      },
      querySelectorAll() { return []; }
    },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { setTimeout(callback) { callback(); } }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  return context;
}

const profiles = {
  理解基本功: { observe: 3, discipline: 2, baseballIQ: 4, catching: 2, safe: 2 },
  直覺競爭: { confidence: 3, instinct: 3, throwing: 2, reaction: 2, rival: 2 },
  隊友關係: { teammate: 5, kind: 3, reliable: 3, responsibility: 2 },
  教練信任: { coach: 5, discipline: 2, responsibility: 3, safe: 2 },
  高橋宿敵: { rival: 5, confidence: 2, ambitious: 3, reaction: 2 },
  打擊專精: { batting: 7, ballSense: 2, confidence: 2 },
  守備專精: { catching: 4, throwing: 3, reaction: 3, range: 3, defense: 3 },
  健康工具人: { recovery: 6, responsibility: 3, baseballIQ: 2, teammate: 1, utility: 4 }
};

function nestedPositive(object, keys) {
  if (!object) return 0;
  let total = 0;
  for (const [key, value] of Object.entries(object)) {
    if (value && typeof value === "object") total += nestedPositive(value, keys);
    else if (keys.includes(key)) total += Math.max(0, Number(value) || 0);
  }
  return total;
}

function scoreChoice(choice, weights) {
  let score = 0;
  const effects = choice.effects || {};
  for (const key of ["observe", "discipline", "confidence", "instinct", "responsibility", "ballSense"]) score += (effects[key] || 0) * (weights[key] || 0);
  const skills = choice.skillEffects || {};
  for (const key of ["baseballIQ", "catching", "throwing", "reaction", "range", "batting"]) score += (skills[key] || 0) * (weights[key] || 0);
  score += nestedPositive(choice.positionSkillEffects, ["catching", "throwing", "reaction", "range"]) * (weights.defense || 0);
  score += Math.max(0, choice.relationshipEffects?.teammateBond || 0) * (weights.teammate || 0);
  score += Math.max(0, choice.relationshipEffects?.coachTrust || 0) * (weights.coach || 0);
  score += (Math.max(0, choice.relationshipEffects?.rivalRespect || 0) + Math.max(0, choice.relationshipEffects?.rivalCompetition || 0)) * (weights.rival || 0);
  score += nestedPositive(choice.personalityEffects, ["kind"]) * (weights.kind || 0);
  score += nestedPositive(choice.personalityEffects, ["reliable"]) * (weights.reliable || 0);
  score += nestedPositive(choice.personalityEffects, ["ambitious"]) * (weights.ambitious || 0);
  if ((choice.flags || []).some(flag => /safe|stable|accept_correction/.test(flag))) score += weights.safe || 0;
  if ((choice.flags || []).some(flag => /utility|position_change|role/.test(flag))) score += weights.utility || 0;
  const load = Math.max(0, choice.effects?.pressure || 0) + Math.max(0, choice.bodyEffects?.fatigue || 0) + Math.max(0, choice.bodyEffects?.injuryRisk || 0) * 2 + Math.max(0, choice.bodyEffects?.pain || 0) * 2 + Math.max(0, choice.academicEffects?.burnout || 0);
  const recovery = Math.max(0, -(choice.effects?.pressure || 0)) + Math.max(0, -(choice.bodyEffects?.fatigue || 0)) + Math.max(0, -(choice.bodyEffects?.injuryRisk || 0)) * 2 + Math.max(0, choice.bodyEffects?.recovery || 0);
  score += recovery * (weights.recovery || 0) - load * ((weights.recovery || 0) * .7);
  return score;
}

function chooseFor(game, eventId, weights, variation) {
  const event = game.getEvent(eventId);
  if (!event?.choices?.length) throw new Error(`找不到事件或選項：${eventId}`);
  if (eventId === "night" || event.choices.length === 1) return 0;
  const ranked = event.choices.map((choice, index) => ({ index, score: scoreChoice(choice, weights) + (((variation + index * 7) % 11) - 5) * .08 })).sort((a, b) => b.score - a.score);
  return variation % 7 === 6 && ranked[1] ? ranked[1].index : ranked[0].index;
}

function playUntil(game, condition, weights, variation, max = 45) {
  for (let turn = 0; turn < max && !vm.runInContext(condition, game); turn += 1) {
    const eventId = game.getCurrentEventId();
    game.choose(eventId, chooseFor(game, eventId, weights, variation + turn));
    if (vm.runInContext("Boolean(pendingYouthSeasonOutcome)", game)) game.continueYouthSeasonOutcome();
  }
  if (!vm.runInContext(condition, game)) throw new Error(`未完成流程：${condition}，停在 ${game.getCurrentEventId()}`);
}

function captureGoals(game) {
  return vm.runInContext(`(() => {
    const goals=[player.goalState.current,player.goalState.short,player.goalState.chapter].filter(Boolean);
    const small=goals.filter(g=>g.tier==='small'); const medium=goals.filter(g=>g.tier==='medium');
    return {
      smallTotal:small.length, smallDone:small.filter(g=>g.status==='completed').length,
      mediumTotal:medium.length, mediumDone:medium.filter(g=>g.status==='completed').length,
      mediumSuccess:medium.filter(g=>g.status==='success').length,
      mediumPartial:medium.filter(g=>g.status==='partial').length,
      mediumFailed:medium.filter(g=>g.status==='failed').length,
      mediumUseful:medium.filter(g=>['completed','success','partial'].includes(g.status)).length,
      majorUseful:goals.filter(g=>g.tier==='major'&&['completed','success','partial'].includes(g.status)).length
    };
  })()`, game);
}

function simulate(profileName, weights, variation) {
  const game = makeGame();
  vm.runInContext(`selectedOrigin=${profileName === "理解基本功" ? "'understand'" : profileName === "隊友關係" ? "'belong'" : "'prove'"}; selectedIdealSelf='全能型'`, game);
  game.createPlayer();
  playUntil(game, "Boolean(player.ending)", weights, variation, 35);
  game.choose("ending", 0);
  playUntil(game, "Boolean(player.chapter2Result)", weights, variation, 12);
  const intro = captureGoals(game); game.choose("chapter2_result", 0);
  playUntil(game, "Boolean(player.seasonResult)", weights, variation, 15);
  const youth = captureGoals(game); game.choose("youth_season_result", 0);
  const initialGap = vm.runInContext("player.startingCompetition.playerRating-player.startingCompetition.rivalRating", game);
  playUntil(game, "Boolean(player.competitionResult)", weights, variation, 20);
  const competition = captureGoals(game);
  const finalGap = vm.runInContext("player.startingCompetition.playerRating-player.startingCompetition.rivalRating", game);
  const competitionTier = vm.runInContext("player.startingCompetition.result", game);
  competition.mediumDone = competitionTier === "先發候選" ? 1 : 0;
  competition.mediumUseful = ["先發候選", "並列競爭", "第一替補"].includes(competitionTier) ? 1 : 0;
  game.choose("competition_result", 0);
  playUntil(game, "Boolean(player.juniorResult)", weights, variation, 20);
  const junior = captureGoals(game); game.choose("junior_result", 0);
  playUntil(game, "Boolean(player.juniorSeasonResult)", weights, variation, 20);
  const juniorSeason = captureGoals(game); game.choose("junior_season_result", 0);
  playUntil(game, "Boolean(player.highSchoolResult)", weights, variation, 18);
  const highSchool = captureGoals(game);
  const state = vm.runInContext(`({skills:Object.values(player.baseballSkills),pressure:player.pressure,fatigue:player.body.fatigue,injuryRisk:player.body.injuryRisk,role:player.highSchoolTeamRole,result:player.highSchoolResult,schoolFit:player.juniorSchoolFit.level,valueLevel:player.highSchoolValueAssessment.level})`, game);
  return { intro, youth, competition, junior, juniorSeason, highSchool, initialGap, finalGap, competitionTier, ...state };
}

const runsPerRoute = 25;
const allRuns = [];
for (const [name, weights] of Object.entries(profiles)) {
  for (let run = 0; run < runsPerRoute; run += 1) allRuns.push({ route: name, ...simulate(name, weights, run) });
}

const pct = (value, total) => total ? Math.round(value / total * 100) : 0;
const chapterNames = ["intro", "youth", "competition", "junior", "juniorSeason", "highSchool"];
const chapterLabels = { intro: "少棒入門", youth: "少棒第一季", competition: "位置競爭", junior: "青少棒", juniorSeason: "青少棒分化", highSchool: "青棒第一年" };
const chapterReport = chapterNames.map(key => {
  const smallDone = allRuns.reduce((sum, run) => sum + run[key].smallDone, 0);
  const smallTotal = allRuns.reduce((sum, run) => sum + run[key].smallTotal, 0);
  const mediumDone = allRuns.reduce((sum, run) => sum + run[key].mediumDone, 0);
  const mediumSuccess = allRuns.reduce((sum, run) => sum + run[key].mediumSuccess, 0);
  const mediumPartial = allRuns.reduce((sum, run) => sum + run[key].mediumPartial, 0);
  const mediumFailed = allRuns.reduce((sum, run) => sum + run[key].mediumFailed, 0);
  const mediumTotal = allRuns.reduce((sum, run) => sum + run[key].mediumTotal, 0);
  const mediumUseful = allRuns.reduce((sum, run) => sum + run[key].mediumUseful, 0);
  return { chapter: chapterLabels[key], smallGoal: pct(smallDone, smallTotal), mediumFull: pct(mediumDone, mediumTotal), mediumSuccess: pct(mediumSuccess, mediumTotal), mediumPartial: pct(mediumPartial, mediumTotal), mediumFailed: pct(mediumFailed, mediumTotal), mediumWithPartial: pct(mediumUseful, mediumTotal) };
});

const routeReport = Object.keys(profiles).map(route => {
  const runs = allRuns.filter(run => run.route === route);
  const skillValues = runs.flatMap(run => run.skills);
  return {
    route,
    smallGoals: pct(runs.reduce((sum, run) => sum + chapterNames.reduce((n, key) => n + run[key].smallDone, 0), 0), runs.reduce((sum, run) => sum + chapterNames.reduce((n, key) => n + run[key].smallTotal, 0), 0)),
    mediumUseful: pct(runs.reduce((sum, run) => sum + chapterNames.reduce((n, key) => n + run[key].mediumUseful, 0), 0), runs.reduce((sum, run) => sum + chapterNames.reduce((n, key) => n + run[key].mediumTotal, 0), 0)),
    roleFormation: pct(runs.filter(run => ["complete", "success"].includes(run.valueLevel)).length, runs.length),
    roleFull: pct(runs.filter(run => run.valueLevel === "complete").length, runs.length),
    rolePartial: pct(runs.filter(run => run.valueLevel === "partial").length, runs.length),
    roleFailed: pct(runs.filter(run => run.valueLevel === "failed").length, runs.length),
    competitionUseful: pct(runs.filter(run => ["先發候選", "並列競爭", "第一替補"].includes(run.competitionTier)).length, runs.length),
    initialGap: Math.round(runs.reduce((sum, run) => sum + run.initialGap, 0) / runs.length * 10) / 10,
    avgGap: Math.round(runs.reduce((sum, run) => sum + run.finalGap, 0) / runs.length * 10) / 10,
    avgSkill: Math.round(skillValues.reduce((a, b) => a + b, 0) / skillValues.length * 10) / 10,
    minSkill: Math.min(...skillValues),
    pressure: Math.round(runs.reduce((sum, run) => sum + run.pressure, 0) / runs.length * 10) / 10,
    fatigue: Math.round(runs.reduce((sum, run) => sum + run.fatigue, 0) / runs.length * 10) / 10,
    injuryRisk: Math.round(runs.reduce((sum, run) => sum + run.injuryRisk, 0) / runs.length * 10) / 10
  };
});

console.log(`八種路線 × ${runsPerRoute} 次，共 ${allRuns.length} 次模擬`);
console.table(chapterReport);
console.table(routeReport);
const gapWithinTen = pct(allRuns.filter(run => run.finalGap >= -10).length, allRuns.length);
console.log(`位置競爭差距不低於 -10：${gapWithinTen}%`);

const skillAuditGame = makeGame();
const skillAudit = vm.runInContext("auditSkillGrowthSources()", skillAuditGame);
console.table(Object.entries(skillAudit).filter(([key]) => ["baseRunning", "armStrength", "reaction", "range", "blocking", "gameCalling", "control", "pitchStamina", "batting"].includes(key)).map(([skill, data]) => ({ skill, ...data, positions: data.positions.join("／") })));

if (chapterReport.find(row => row.chapter === "少棒入門").smallGoal < 85) throw new Error("少棒入門小目標完成率不足 85%");
if (chapterReport.find(row => row.chapter === "少棒第一季").smallGoal < 80) throw new Error("少棒第一季小目標完成率不足 80%");
if (gapWithinTen < 75) throw new Error("位置競爭合理差距比例不足 75%");
