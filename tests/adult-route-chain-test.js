const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
function makeGame() {
  const context = vm.createContext({
    console,
    document: { getElementById() { return { innerHTML: "", value: "成年事件鏈測試", style: {} }; }, querySelectorAll() { return []; }, querySelector() { return null; } },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { setTimeout(callback) { callback(); } }
  });
  for (const file of ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "career-spine-contract.js", "career-transition-runtime-resolver.js", "story.js", "save.js", "script.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  return context;
}

const exits = { draft: "高卒選秀・中後段指名候選", college: "大學棒球", amateur: "業餘／社會人棒球", rehab: "復健與生涯暫停" };
const reports = [];
for (const [route, exit] of Object.entries(exits)) {
  const game = makeGame();
  const result = vm.runInContext(`
    player = createInitialPlayer(${JSON.stringify(route)}); player.chapter = "生涯轉換期"; player.careerExit = ${JSON.stringify(exit)};
    Object.assign(player.baseballSkills, { batting: 10, catching: 10, baseballIQ: 10, control: 8 }); player.body.injuryRisk = 3;
    Object.assign(player.impression.azhe, { trusts: 8, feelsDistance: 0 }); Object.assign(player.impression.takahashi, { respect: 8, rivalry: 8, underestimate: 0 });
    Object.assign(player.impression.coach, { dependable: 8, leader: 4, immature: 0 }); Object.assign(player.relationships, { coachTrust: 9, teammateBond: 8, rivalRespect: 8 });
    const chain = adultNarrativeChains[${JSON.stringify(route)}]; startNarrativeThread({ ...chain, route: ${JSON.stringify(route)} });
    chain.events.forEach(eventId => {
      const event = getEvent(eventId); const choice = event.choices[0];
      addFlags(choice.flags); recordContinuityOutcome(createContinuityOutcome(eventId, choice)); processCareerArcEvent(eventId, choice); processRelationshipPayoffs(eventId); advanceNarrativeThread(eventId, choice);
    });
    ({ thread: player.narrativeThread, outcomes: player.continuityOutcomes, payoffs: player.relationshipPayoffs, roleChanges: player.roleIdentity.previous.length + (player.roleIdentity.primary ? 1 : 0), audit: auditNarrativeContinuity() });
  `, game);
  if (result.thread.history.length < 5 || result.thread.history.length > 7) throw new Error(`${route} 事件鏈長度錯誤`);
  if (result.outcomes.length !== result.thread.history.length) throw new Error(`${route} 並非每幕都有結果承接`);
  if (result.thread.history.some(item => !item.nextPossibility)) throw new Error(`${route} 有事件缺少下一個具體期待`);
  const routeAudit = result.audit.find(item => item.route === route);
  if (!routeAudit || routeAudit.breaks.length) throw new Error(`${route} 出現敘事斷裂：${routeAudit?.breaks.join("、")}`);
  reports.push({ route, beats: result.thread.history.length, carriedOutcomes: result.outcomes.length, hopeHooks: result.thread.history.filter(item => item.nextPossibility).length, relationshipPayoffs: result.payoffs.length, roleChanges: result.roleChanges, finalNextStep: result.thread.nextPossibility });
}

console.table(reports);
console.log("Phase 14 adult route chain test passed.");
