const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const storage = new Map();
const context = vm.createContext({
  console,
  document: {
    getElementById() { return { innerHTML: "", value: "情緒測試球員", style: {} }; },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  },
  localStorage: {
    setItem(key, value) { storage.set(key, value); },
    getItem(key) { return storage.get(key) || null; },
    removeItem(key) { storage.delete(key); }
  },
  window: { setTimeout(callback) { callback(); } }
});

for (const file of ["player.js", "story.js", "save.js", "script.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

vm.runInContext(`
  player = createInitialPlayer("情緒測試球員");
  processEmotionalEvent("youth_match_entry", {});
  processEmotionalEvent("youth_match_mistake", {});
  processEmotionalEvent("echo_coach", {});
  processEmotionalEvent("starter_selection_test", {});
  player.startingCompetition.result = "lose";
  processEmotionalEvent("starter_selection_result", {});
  processEmotionalEvent("junior_friend_exit", {});
  processEmotionalEvent("junior_pain", {});
  processEmotionalEvent("high_school_long_bench", {});
  processEmotionalEvent("high_school_showcase", {});
  processEmotionalEvent("critical_injury", {});
  processEmotionalEvent("development_competition", {});
  player.careerArc.reinventions = 1;
  processEmotionalEvent("development_opportunity", {});
  ["ending", "chapter2_result", "youth_season_result", "competition_result", "junior_result", "junior_season_result", "high_school_result", "critical_year_result", "transition_result", "development_result"].forEach(generateChapterEndingScene);
  archiveReplayMemory();
`, context);

const result = vm.runInContext(`({
  lifeEvents: player.lifeEvents.map(item => item.id),
  peaks: player.emotionalPeaks,
  lows: player.lowPoints,
  callbacks: player.npcEmotionalCallbacks,
  audit: auditEmotion(),
  lifeStory: generateLifeStory(),
  replay: loadReplayMemories()
})`, context);

for (const id of ["first_appearance", "first_failure", "first_praise", "first_lost_position", "first_injury", "azhe_goodbye", "needed_again_emotion", "first_rebirth"]) {
  if (!result.lifeEvents.includes(id)) throw new Error(`缺少必要人生事件：${id}`);
}
if (!result.peaks.some(item => item.level === "legendary")) throw new Error("缺少 legendary 情緒高峰");
if (!result.audit.every(item => item.meetsTarget)) throw new Error("仍有章節未達情緒稽核標準");
if (!result.callbacks.some(item => item.npc === "azhe") || !result.callbacks.some(item => item.npc === "takahashi") || !result.callbacks.some(item => item.npc === "yamamoto")) throw new Error("NPC 情緒回調不完整");
if (result.replay.length !== 5) throw new Error("跨周目記憶沒有保存五件重要事件");
if (!result.lifeStory.includes("最大高峰") || !result.lifeStory.includes("最大低谷") || !result.lifeStory.includes("最重要的人")) throw new Error("人生總結缺少必要欄位");

console.table(result.audit);
console.log(`人生事件 ${result.lifeEvents.length}／高潮 ${result.peaks.length}／低谷 ${result.lows.length}／NPC 回調 ${result.callbacks.length}`);
console.log("Phase 11 emotional payoff test passed.");
