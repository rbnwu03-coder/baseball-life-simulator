const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
function makeGame() {
  const context = vm.createContext({
    console,
    document: { getElementById() { return { innerHTML: "", value: "連續性測試", style: {} }; }, querySelectorAll() { return []; }, querySelector() { return null; } },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { setTimeout(callback) { callback(); } }
  });
  for (const file of ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "story.js", "save.js", "script.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  return context;
}

const routes = Object.keys({ draft: 1, college: 1, amateur: 1, rehab: 1 });
const reports = [];
for (const route of routes) {
  const game = makeGame();
  vm.runInContext(`
    player = createInitialPlayer(${JSON.stringify(route)});
    const config = adultNarrativeChains[${JSON.stringify(route)}];
    startNarrativeThread({ ...config, route: ${JSON.stringify(route)} });
    config.events.forEach((eventId, index) => {
      const before = getNarrativeBridge(eventId, "in");
      const after = getNarrativeBridge(eventId, "out");
      if (!before || !after) throw new Error(eventId + " 缺少橋接");
      advanceNarrativeThread(eventId, { memory: "第" + (index + 1) + "幕的具體結果" });
    });
  `, game);
  const result = vm.runInContext(`({ thread: player.narrativeThread, audit: auditTitleContentAlignment() })`, game);
  if (result.thread.history.length !== 5) throw new Error(`${route} 不是完整五幕事件鏈`);
  if (!result.thread.history.slice(1).every((item, index) => item.outcome.includes(`第${index + 2}幕`))) throw new Error(`${route} 未保存逐幕結果`);
  const auditFailures = result.audit.filter(item => !item.hasBridgeIn || !item.hasNextTension || !item.changesState);
  if (auditFailures.length) throw new Error(`${route} 標題／正文／懸念稽核失敗：${JSON.stringify(auditFailures)}`);
  reports.push({ route, beats: result.thread.history.length, lastOutcome: result.thread.lastOutcome, nextTension: result.thread.nextTension });
}

console.table(reports);
console.log("Phase 13 narrative continuity test passed.");
