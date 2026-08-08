const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function makeGame() {
  const storage = {};
  const context = vm.createContext({
    console,
    document: {
      getElementById() { return { innerHTML: "", value: "阿哲分鏡測試", style: {} }; },
      querySelectorAll() { return []; },
      querySelector() { return null; }
    },
    localStorage: {
      setItem(key, value) { storage[key] = value; },
      getItem(key) { return storage[key] ?? null; },
      removeItem(key) { delete storage[key]; }
    },
    window: { setTimeout(callback) { callback(); } }
  });
  for (const file of ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "career-spine-contract.js", "career-transition-runtime-resolver.js", "story.js", "save.js", "script.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  }
  return context;
}

const eventCases = [
  { id: "youth_teammate", chapter: "少棒第一季", step: "seasonStep", value: 2, flags: ["azhe_error_reworked", "azhe_error_minimized", "chose_solo_over_teammate"] },
  { id: "azhe_bond_high", chapter: "位置競爭", step: "competitionStep", value: 3, flags: ["azhe_felt_heard", "azhe_private_signal", "azhe_fear_minimized", "azhe_competition_boundary"] },
  { id: "azhe_bond_mid", chapter: "位置競爭", step: "competitionStep", value: 3, flags: ["checked_on_azhe", "shared_silence_with_azhe", "kept_distance_from_azhe"] },
  { id: "azhe_bond_low", chapter: "位置競爭", step: "competitionStep", value: 3, flags: ["repaired_azhe_signal", "formalized_azhe_assignment", "blamed_azhe_missed_cover"] },
  { id: "junior_friend_exit", chapter: "青少棒", step: "juniorStep", value: 8, flags: ["respected_azhe_exit", "left_door_open_for_azhe", "questioned_azhe_exit"] }
];

for (const config of eventCases) {
  const probe = makeGame();
  const choiceCount = vm.runInContext(`getEvent(${JSON.stringify(config.id)}).choices.length`, probe);
  if (choiceCount !== config.flags.length) throw new Error(`${config.id} 選項數量改變`);
  for (let index = 0; index < choiceCount; index += 1) {
    const game = makeGame();
    vm.runInContext(`player = createInitialPlayer("${config.id}-${index}"); player.chapter = ${JSON.stringify(config.chapter)}; player.${config.step} = ${config.value};`, game);
    game.choose(config.id, index);
    if (vm.runInContext("Boolean(pendingYouthSeasonOutcome)", game)) game.continueYouthSeasonOutcome();
    const state = vm.runInContext(`({ flag: hasFlag(${JSON.stringify(config.flags[index])}), step: player.${config.step}, transitioning: isTransitioning })`, game);
    if (!state.flag) throw new Error(`${config.id} 選項 ${index + 1} 沒有保留原旗標`);
    if (state.step !== config.value + 1 || state.transitioning) throw new Error(`${config.id} 選項 ${index + 1} 沒有正常返回主流程`);
  }
}

const objectProbe = makeGame();
const objectResults = vm.runInContext(`(() => {
  player = createInitialPlayer("跨章物件");
  const youth = getEvent("youth_teammate");
  const high = getEvent("azhe_bond_high");
  const low = getEvent("azhe_bond_low");
  const exit = getEvent("junior_friend_exit");
  return {
    grounder: youth.choices.every(choice => choice.flags.includes("azhe_grounder_object")),
    highLine: high.choices[1].flags.includes("azhe_red_dirt_line"),
    lowLine: low.choices.slice(0, 2).every(choice => choice.flags.includes("azhe_red_dirt_line")),
    record: exit.choices[0].flags.includes("azhe_record_sheet"),
    concreteChoices: [youth.choices[0].text, high.choices[1].text, low.choices[0].text, exit.choices[0].text]
  };
})()`, objectProbe);
if (!objectResults.grounder || !objectResults.highLine || !objectResults.lowLine || !objectResults.record) throw new Error("跨章物件旗標沒有建立完整");
if (!objectResults.concreteChoices.every(text => /滾|畫|鞋尖|攤平/.test(text))) throw new Error("選項仍缺少可拍攝動作");

const coverStates = [
  { name: "平等", setup: `player.characterArc.azhe="respected_equal"; addFlags(["azhe_grounder_object","azhe_red_dirt_line"]);`, clues: ["沒有先確認", "手套"] },
  { name: "依賴", setup: `player.characterArc.azhe="dependent"; addFlags(["azhe_grounder_object","azhe_red_dirt_line"]);`, clues: ["轉頭看你", "穿過"] },
  { name: "疏遠", setup: `player.characterArc.azhe="distant"; player.impression.azhe.feelsDistance=7;`, clues: ["沒有看你", "教練掌心"] },
  { name: "未定", setup: `player.characterArc.azhe="neutral";`, clues: ["差點撞", "重新說清楚"] }
];
if (vm.runInContext(`getEvent("junior_azhe_cover").title`, objectProbe) !== "二游之間的下一球") throw new Error("junior_azhe_cover 標題沒有修正");
for (const state of coverStates) {
  const game = makeGame();
  const text = vm.runInContext(`player=createInitialPlayer(${JSON.stringify(state.name)}); ${state.setup} getEvent("junior_azhe_cover").text()`, game);
  if (!state.clues.every(clue => text.includes(clue))) throw new Error(`junior_azhe_cover 缺少${state.name}版本的具體鏡頭`);
}
for (let index = 0; index < 3; index += 1) {
  const game = makeGame();
  vm.runInContext(`player=createInitialPlayer("補位選項${index}"); player.chapter="青少棒"; player.juniorStep=4;`, game);
  game.choose("junior_azhe_cover", index);
  if (!vm.runInContext("hasFlag('azhe_cover_echo_done') && player.juniorStep===5", game)) throw new Error(`junior_azhe_cover 選項 ${index + 1} 沒有正常完成`);
}

const coverArcCases = [
  { name: "respected_equal", setup: `player.characterArc.azhe="respected_equal"; player.impression.azhe.trusts=5;`, expected: "respected_equal" },
  { name: "dependent", setup: `player.characterArc.azhe="dependent"; player.impression.azhe.trusts=2; player.impression.azhe.depends=5;`, expected: "dependent", depends: 4, trusts: 3 },
  { name: "distant", setup: `player.characterArc.azhe="distant"; player.impression.azhe.feelsDistance=6;`, expected: "distant", feelsDistance: 5 },
  { name: "neutral", setup: `player.characterArc.azhe="neutral";`, expected: "confided", trusts: 1 }
];
const coverArcReport = [];
for (const config of coverArcCases) {
  const game = makeGame();
  vm.runInContext(`player=createInitialPlayer(${JSON.stringify(config.name)}); player.chapter="青少棒"; player.juniorStep=4; ${config.setup}`, game);
  game.choose("junior_azhe_cover", 0);
  const result = vm.runInContext(`({ arc:player.characterArc.azhe, trusts:player.impression.azhe.trusts, depends:player.impression.azhe.depends, feelsDistance:player.impression.azhe.feelsDistance, teammateBond:player.relationships.teammateBond, step:player.juniorStep })`, game);
  if (result.arc !== config.expected) throw new Error(`${config.name} 使用舊暗號後錯誤跳成 ${result.arc}`);
  if (config.name !== "respected_equal" && result.arc === "respected_equal") throw new Error(`${config.name} 被單一選項直接洗成 respected_equal`);
  if (config.depends != null && result.depends !== config.depends) throw new Error("dependent 的依賴沒有降低 1");
  if (config.trusts != null && result.trusts !== config.trusts) throw new Error(`${config.name} 的信任調整不正確`);
  if (config.feelsDistance != null && result.feelsDistance !== config.feelsDistance) throw new Error("distant 的距離感沒有有限降低");
  if (result.teammateBond !== 1 || result.step !== 5) throw new Error(`${config.name} 沒有改善場上合作或正常推進主線`);
  coverArcReport.push({ original: config.name, final: result.arc, mainFlow: "正常" });
}

function testAdultEcho(setup, mainEvent) {
  const game = makeGame();
  const queued = vm.runInContext(`player=createInitialPlayer("成年回響"); ${setup}; queueAzheAdultRecordEcho(${JSON.stringify(mainEvent)})`, game);
  if (!queued || vm.runInContext("player.forcedEventId", game) !== "azhe_adult_record_echo") throw new Error("成年阿哲回響沒有依條件插入");
  const before = vm.runInContext("JSON.stringify({transitionStep:player.transitionStep,developmentStep:player.developmentStep})", game);
  game.choose("azhe_adult_record_echo", 0);
  const after = vm.runInContext(`({ steps: JSON.stringify({transitionStep:player.transitionStep,developmentStep:player.developmentStep}), done: hasFlag("azhe_adult_record_echo_done"), forced: player.forcedEventId, current: getCurrentEventId(), repeated: queueAzheAdultRecordEcho(${JSON.stringify(mainEvent)}) })`, game);
  if (!after.done || after.forced || after.repeated) throw new Error("成年阿哲回響重複觸發或沒有解除");
  if (after.steps !== before || after.current !== mainEvent) throw new Error("成年阿哲回響消耗了主線回合或沒有回到原事件");
}

testAdultEcho(`player.chapter="生涯轉換期"; player.careerExit="大學棒球"; player.transitionStep=3; addFlags(["azhe_record_sheet"]);`, "transition_relationship");
testAdultEcho(`player.chapter="發展期"; player.developmentStep=2; player.careerArc.stage="transition";`, "development_mentor");

const persistence = makeGame();
vm.runInContext(`player=createInitialPlayer("物件存檔"); addFlags(["azhe_grounder_object","azhe_red_dirt_line","azhe_record_sheet"]); saveGame(); player=createInitialPlayer("覆蓋"); loadGame();`, persistence);
if (!vm.runInContext(`["azhe_grounder_object","azhe_red_dirt_line","azhe_record_sheet"].every(hasFlag)`, persistence)) throw new Error("既有存讀檔沒有保留分鏡物件旗標");

const sceneProbe = makeGame();
const sceneText = vm.runInContext(`player=createInitialPlayer("場景檢查"); ({ youth:getEvent("youth_teammate").text(), high:getEvent("azhe_bond_high").text(), mid:getEvent("azhe_bond_mid").text, low:getEvent("azhe_bond_low").text, exit:getEvent("junior_friend_exit").text() })`, sceneProbe);
for (const [id, text] of Object.entries(sceneText)) {
  if (String(text).length < 80) throw new Error(`${id} 場景仍過薄`);
}

console.table([
  { item: "既有阿哲事件", result: "16／16" },
  { item: "青少棒補位選項", result: "3／3" },
  { item: "總計", result: "19／19" },
  { item: "成年回響", result: "2 種觸發、主線不耗回合、不重複" },
  { item: "跨章物件", result: "滾地球／紅土線／紀錄表可存讀" }
]);
console.table(coverArcReport);
console.log("阿哲人物線分鏡化測試通過。");
