const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
function makeGame() {
  const context = vm.createContext({
    console,
    document: { getElementById() { return { innerHTML: "", value: "追求敘事測試", style: {} }; }, querySelectorAll() { return []; }, querySelector() { return null; } },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { setTimeout(callback) { callback(); } }
  });
  for (const file of ["player.js", "story.js", "save.js", "script.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  return context;
}

const routes = [
  { name: "理解基本功", observe: 9, event: "junior_position_change" },
  { name: "直覺競爭", instinct: 9, event: "competition_intro" },
  { name: "阿哲高信任", azhe: 8, event: "junior_friend_exit" },
  { name: "阿哲疏遠", distance: 8, event: "junior_friend_exit" },
  { name: "高橋高尊重", rival: 8, event: "competition_intro" },
  { name: "教練高信任", coach: 8, event: "chapter2_intro" },
  { name: "傷病轉向", injury: 9, event: "critical_injury" },
  { name: "健康但長期板凳", recovery: 9, event: "high_school_long_bench" }
];

const report = [];
for (const route of routes) {
  const game = makeGame();
  const result = vm.runInContext(`
    player = createInitialPlayer(${JSON.stringify(route.name)});
    player.observe = ${route.observe || 4}; player.instinct = ${route.instinct || 4};
    player.baseballSkills.batting = ${route.batting || 3}; player.baseballSkills.catching = ${route.catching || 3};
    player.body.recovery = ${route.recovery || 5}; player.relationships.teammateBond = ${route.azhe || 3};
    player.relationships.coachTrust = ${route.coach || 3}; player.relationships.rivalRespect = ${route.rival || 3};
    player.impression.azhe.feelsDistance = ${route.distance || 0}; player.body.injuryRisk = ${route.injury || 2};
    const chapters = ["十歲暑假", "少棒入門", "少棒第一季", "位置競爭", "青少棒", "青少棒分化", "青棒", "青棒關鍵年", "生涯轉換期", "發展期"];
    chapters.forEach((chapter, index) => {
      player.chapter = chapter; player.age = 10 + index; player.aspirationState.current = "";
      ensureChapterAspiration();
      recordAspirationMoment({ id: ${JSON.stringify(route.name)} + "_" + index, title: chapter + "的追求", possibility: chapterAspirationGuide[chapter].next, status: index % 3 === 2 ? "redirected" : "active" });
    });
    processAspirationEvent(${JSON.stringify(route.event)}, { memory: "這條路線得到世界的具體回應" });
    ({ state: getCurrentAspiration(), moments: player.aspirationMoments, audit: auditNarrativeTone(), story: generateLifeStory() });
  `, game);
  if (!result.state.current || !result.state.nextPossibility) throw new Error(`${route.name} 缺少目前追求或下一個期待`);
  if (result.moments.length < 10) throw new Error(`${route.name} 的追求記憶不足`);
  if (!result.story.includes("你一路追過的事") || !result.story.includes("下一個可以期待的具體時刻")) throw new Error(`${route.name} 人生總結仍未以追求為中心`);
  if (result.audit.terminalTotal || result.audit.sloganTotal) throw new Error(`${route.name} 敘事語氣稽核失敗`);
  if (result.audit.missingConcreteExpectation.length) throw new Error(`${route.name} 缺少具體期待：${result.audit.missingConcreteExpectation.join("、")}`);
  if (result.audit.chapters.some(item => item.onlyLossWithoutPossibility)) throw new Error(`${route.name} 出現只有失去而沒有新可能的章節`);
  report.push({ route: route.name, moments: result.moments.length, pursuit: result.state.current, worldResponse: result.state.worldResponse || "等待具體回應", next: result.state.nextPossibility, hopeHooks: result.audit.chapters.filter(item => item.hasConcreteExpectation).length });
}

console.table(report);
console.log("Phase 13 aspiration narrative test passed.");
