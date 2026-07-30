const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function makeGame() {
  const nodes = new Map();
  const context = vm.createContext({
    console,
    document: {
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, { innerHTML: "", value: id === "nameInput" ? "高橋分鏡測試" : "", style: {} });
        return nodes.get(id);
      },
      querySelectorAll() { return []; },
      querySelector() { return null; }
    },
    localStorage: {
      setItem() {},
      getItem() { return null; },
      removeItem() {}
    },
    window: { setTimeout(callback) { callback(); } }
  });
  for (const file of ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "story.js", "save.js", "script.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  }
  return context;
}

const eventSpecs = [
  { id: "junior_takahashi_failure", label: "第一次失常", choices: 4, objectFlag: "takahashi_first_wild_ball" },
  { id: "junior_takahashi_pressure", label: "壓力累積", choices: 3, objectFlag: "takahashi_scoreboard" },
  { id: "junior_takahashi_break", label: "真正失常", choices: 3, objectFlag: "takahashi_shined_glove" },
  { id: "takahashi_adult_restart_echo", label: "成年回響", choices: 3, objectFlag: "takahashi_adult_restart_echo_done" }
];

const inspection = makeGame();
for (const spec of eventSpecs) {
  const event = vm.runInContext(`getEvent(${JSON.stringify(spec.id)})`, inspection);
  if (!event || event.choices.length !== spec.choices) throw new Error(`${spec.label}事件或選項數量不正確`);
  const text = vm.runInContext(`(() => { player=createInitialPlayer("${spec.label}"); addFlags(["takahashi_first_wild_ball","takahashi_scoreboard","takahashi_shined_glove"]); const e=getEvent(${JSON.stringify(spec.id)}); return typeof e.text === "function" ? e.text() : e.text; })()`, inspection);
  if (text.length < 180 || text.length > 350) throw new Error(`${spec.label}正文長度 ${text.length}，未落在 180～350 字`);
  if (!event.choices.every(choice => choice.flags.includes(spec.objectFlag))) throw new Error(`${spec.label}沒有在所有選項保存跨章物件或完成旗標`);
  if (event.choices.some(choice => /支持|鼓勵|理解|陪伴|安慰/.test(choice.text))) throw new Error(`${spec.label}仍出現抽象情緒選項`);
  for (const choice of event.choices) {
    if (choice.memory.length < 50 || choice.memory.length > 120) throw new Error(`${spec.label}結果長度 ${choice.memory.length}，未落在 50～120 字`);
  }
}

for (let index = 0; index < 4; index += 1) {
  const game = makeGame();
  vm.runInContext(`player=createInitialPlayer("第一次失常-${index}"); player.chapter="青少棒"; player.juniorStep=5;`, game);
  game.choose("junior_takahashi_failure", index);
  if (!vm.runInContext("player.juniorStep===6 && player.forcedEventId==='junior_takahashi_pressure' && hasFlag('takahashi_first_wild_ball')", game)) throw new Error(`第一次失常選項 ${index + 1} 沒有進入壓力累積`);
}

for (let index = 0; index < 3; index += 1) {
  const game = makeGame();
  vm.runInContext(`player=createInitialPlayer("壓力累積-${index}"); player.chapter="青少棒"; player.juniorStep=6; player.forcedEventId="junior_takahashi_pressure";`, game);
  game.choose("junior_takahashi_pressure", index);
  if (!vm.runInContext("player.juniorStep===6 && player.forcedEventId==='junior_takahashi_break' && hasFlag('takahashi_scoreboard')", game)) throw new Error(`壓力累積選項 ${index + 1} 沒有進入真正失常`);
}

for (let index = 0; index < 3; index += 1) {
  const game = makeGame();
  vm.runInContext(`player=createInitialPlayer("真正失常-${index}"); player.chapter="青少棒"; player.juniorStep=6; player.forcedEventId="junior_takahashi_break";`, game);
  game.choose("junior_takahashi_break", index);
  if (!vm.runInContext("player.juniorStep===6 && !player.forcedEventId && getCurrentEventId()==='junior_coach_disagreement' && hasFlag('takahashi_shined_glove')", game)) throw new Error(`真正失常選項 ${index + 1} 沒有回到原主線`);
}

for (let index = 0; index < 3; index += 1) {
  const game = makeGame();
  const queued = vm.runInContext(`player=createInitialPlayer("成年回響-${index}"); player.chapter="發展期"; player.age=20; player.developmentStep=1; addFlags(["takahashi_first_failure_seen","takahashi_first_wild_ball","takahashi_pressure_seen","takahashi_scoreboard","takahashi_break_seen","takahashi_shined_glove"]); queueTakahashiAdultRestartEcho("development_competition")`, game);
  if (!queued || vm.runInContext("player.forcedEventId", game) !== "takahashi_adult_restart_echo") throw new Error(`成年回響選項 ${index + 1} 沒有插入`);
  const adultText = vm.runInContext("getEvent('takahashi_adult_restart_echo').text()", game);
  if (!["黑記號", "白板", "磨到發亮"].every(clue => adultText.includes(clue))) throw new Error("成年回響沒有收回三個跨章物件");
  game.choose("takahashi_adult_restart_echo", index);
  const result = vm.runInContext("({done:hasFlag('takahashi_adult_restart_echo_done'), forced:player.forcedEventId, step:player.developmentStep, current:getCurrentEventId(), repeated:queueTakahashiAdultRestartEcho('development_competition')})", game);
  if (!result.done || result.forced || result.step !== 1 || result.current !== "development_competition" || result.repeated) throw new Error(`成年回響選項 ${index + 1} 沒有正常返回主線或阻止重複`);
}

console.table(eventSpecs.map(spec => ({ event: spec.label, result: `${spec.choices}／${spec.choices}` })));
console.log("跨章物件：第一顆失投球／白板計分頁／磨到發亮的手套，成年全部回收。");
console.log("高橋人物線：四個分鏡事件全部通過。");
