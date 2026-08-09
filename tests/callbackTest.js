const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const nodes = new Map();
const storage = new Map();
const document = {
  getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { innerHTML: "", value: "回收測試球員", style: {} });
    return nodes.get(id);
  },
  querySelectorAll() { return []; }
};
const game = vm.createContext({
  console,
  document,
  localStorage: {
    setItem: (key, value) => storage.set(key, value),
    getItem: key => storage.get(key) || null,
    removeItem: key => storage.delete(key)
  },
  window: { setTimeout: callback => callback() }
});
["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js", "career-development-progression.js", "story.js", "save.js", "script.js"].forEach(file => {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), game, { filename: file });
});

vm.runInContext(`player = createInitialPlayer("回收測試球員"); addFlags([
  "ignored_laugh", "asked_family", "asked_demo", "wants_free_baseball",
  "azhe_error_reworked", "takahashi_first_challenge_done",
  "chose_solo_over_teammate", "proved_consistency_extra"
])`, game);

if (vm.runInContext("player.callbacks.length", game) !== 6) throw new Error("重大選擇沒有建立六個 callback");
if (!vm.runInContext("hasConsequence('fear_of_mistake') && hasConsequence('trust_deficit') && hasConsequence('overtraining_tendency')", game)) throw new Error("長期代價沒有建立");

const pressureBefore = vm.runInContext("player.pressure", game);
vm.runInContext("player.chapter='少棒第一季'; player.seasonStep=6; player.seasonErrors=1", game);
game.choose("youth_match_mistake", 0);
game.continueYouthSeasonOutcome();
if (!vm.runInContext("hasCallback('fear_of_failure', true)", game)) throw new Error("少棒沒有回收童年害怕");
if (vm.runInContext("player.pressure", game) < pressureBefore + 1) throw new Error("害怕失誤代價沒有在比賽觸發");

vm.runInContext("player.chapter='青少棒'; player.juniorStep=4", game);
game.choose("junior_azhe_cover", 0);
if (!vm.runInContext("hasCallback('azhe_hidden_grounder', true)", game)) throw new Error("青少棒沒有回收阿哲滾地球");

vm.runInContext("player.chapter='青少棒'; player.juniorStep=5", game);
game.choose("junior_takahashi_failure", 0);
if (!vm.runInContext("hasCallback('takahashi_ten_ball', true)", game)) throw new Error("青少棒沒有回收十球挑戰");

vm.runInContext("player.chapter='青少棒分化'; player.juniorSeasonStep=8", game);
game.choose("yamamoto_recommendation", 0);
if (!vm.runInContext("hasCallback('asked_for_another_demo', true)", game)) throw new Error("高中入口沒有回收教練示範");

vm.runInContext("player.chapter='生涯轉換期'; player.careerExit='大學棒球'; player.transitionStep=3; player.forcedEventId=''", game);
game.choose("transition_relationship", 0);
if (!vm.runInContext("hasCallback('family_safe_place', true)", game)) throw new Error("生涯轉換沒有回收家庭避風港");

vm.runInContext("player.chapter='發展期'; player.age=21; player.developmentStep=6", game);
game.choose("development_decision", 1);
if (!vm.runInContext("hasCallback('freedom_origin', true)", game)) throw new Error("二十二歲沒有回收自由起點");

const audit = vm.runInContext("auditCallbacks()", game);
if (audit.recoveryRate < 70) throw new Error(`callback 回收率不足：${audit.recoveryRate}%`);

vm.runInContext("player.body.fatigue=0; player.body.injuryRisk=0; applyBodyEffects({fatigue:1})", game);
if (!vm.runInContext("player.body.fatigue === 2 && player.body.injuryRisk === 0", game)) throw new Error("普通訓練不應因過度訓練傾向反覆增加傷病風險");
vm.runInContext("player.body.fatigue=0; player.body.injuryRisk=0; applyBodyEffects({fatigue:2})", game);
if (!vm.runInContext("player.body.fatigue === 3 && player.body.injuryRisk === 1", game)) throw new Error("高強度加練沒有觸發過度訓練風險");

vm.runInContext("player.relationships.teammateBond=0; applyNestedEffects('relationships',{teammateBond:2})", game);
if (vm.runInContext("player.relationships.teammateBond", game) !== 1) throw new Error("信任欠帳沒有降低關係成長");

const normalized = vm.runInContext("normalizeSave({name:'舊存檔',saveVersion:5})", game);
if (!Array.isArray(normalized.callbacks) || !Array.isArray(normalized.consequences) || normalized.lifeThemes.fear !== 0) throw new Error("舊存檔沒有補齊 Phase 8 結構");
if (!normalized.goalState || !Array.isArray(normalized.goalState.completedGoals) || normalized.trainingFocus.streak !== 0) throw new Error("舊存檔沒有補齊 Phase 9 目標與專注結構");

console.log(`Callback 建立 ${audit.created}／回收 ${audit.resolved}／回收率 ${audit.recoveryRate}%`);
console.log("童年 → 少棒 → 青少棒 → 高中入口 → 生涯轉換 → 二十二歲：通過");
console.log("長期代價與舊存檔相容：通過");
