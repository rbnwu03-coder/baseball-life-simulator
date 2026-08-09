const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "player.js",
  "current-state-boundary.js",
  "time-boundary.js",
  "relationship-boundary.js",
  "evaluation-registry.js",
  "coach-evaluation-boundary.js",
  "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js",
  "decision-flow.js",
  "day-completion-flow.js",
  "relationship-flow.js",
  "coach-response-flow.js",
  "narrative-condition-flow.js",
  "competition-presentation.js",
  "career-spine-contract.js",
  "career-transition-runtime-resolver.js",
  "career-development-runtime-resolver.js",
  "career-save-admission.js",
  "npc.js",
  "coach.js",
  "rival.js",
  "story.js",
  "save.js",
  "script.js"
];
const youthEventIds = [
  "youth_season_intro",
  "youth_position_trial",
  "youth_teammate",
  "youth_bench",
  "youth_match_entry",
  "youth_match_grounder",
  "youth_match_outfield",
  "youth_match_catcher",
  "youth_match_pitcher",
  "youth_match_mistake",
  "youth_match_after",
  "youth_season_result"
];
const expectedGameplayHash = "c3f3210302b281c5423ee946f3f03cd6791e724f849b70af2db02b6754e6f703";

let passed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function test(title, assertion) {
  assertion();
  passed += 1;
  console.log(`✓ ${title}`);
}

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const timers = [];
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) {
        nodes.set(id, {
          innerHTML: "",
          value: "",
          style: {},
          classList: { add() {}, remove() {} }
        });
      }
      return nodes.get(id);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    console,
    document,
    localStorage: {
      setItem: (key, value) => storage.set(key, value),
      getItem: key => storage.get(key) || null,
      removeItem: key => storage.delete(key)
    },
    window: {
      setTimeout(callback, delay) {
        timers.push({ callback, delay });
        return timers.length;
      }
    }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  context.__nodes = nodes;
  context.__storage = storage;
  context.__timers = timers;
  return context;
}

function prepareYouthSeason(game, step = 0) {
  vm.runInContext(`
    player = createInitialPlayer("連續性測試");
    Object.assign(player, {
      chapter: "少棒第一季",
      age: 10,
      seasonStep: ${step},
      chapter2Result: "理解型新生",
      seasonPerformance: 0,
      seasonErrors: 0
    });
    player.matchState = Object.assign({}, createInitialPlayer().matchState, { runners: [true, false, false] });
  `, game);
}

function choiceGameplayContract(game) {
  const contract = {};
  youthEventIds.forEach(eventId => {
    contract[eventId] = game.getEvent(eventId).choices.map(({ text, memory, ...gameplay }) => gameplay);
  });
  return contract;
}

function chooseAndContinue(game, eventId, choiceIndex) {
  game.choose(eventId, choiceIndex);
  if (vm.runInContext("Boolean(pendingYouthSeasonOutcome)", game)) {
    game.continueYouthSeasonOutcome();
  }
}

test("Gameplay 合約雜湊、事件 ID 與 Choice identity 維持不變", () => {
  const game = makeContext();
  const hash = crypto.createHash("sha256").update(JSON.stringify(choiceGameplayContract(game))).digest("hex");
  assert(hash === expectedGameplayHash, `Gameplay 合約變動：${hash}`);
  assert(youthEventIds.every(id => Boolean(game.getEvent(id))), "少棒第一季事件 ID 有缺漏");
});

test("位置輪測由玩家交付任務、教練決定初始分組", () => {
  const game = makeContext();
  const event = game.getEvent("youth_position_trial");
  assert(event.text.includes("不要告訴我你想守哪裡"), "輪測仍像玩家直接宣告位置");
  assert(event.text.includes("由我決定你先去哪一組"), "輪測沒有保留教練的分組權限");
  const expectedGroups = ["內野組", "外野組", "捕手組", "投手組"];
  event.choices.forEach((choice, index) => {
    assert(choice.memory.includes(expectedGroups[index]), `${expectedGroups[index]}沒有寫進選擇結果`);
  });
});

test("板凳四種結果都結束紅白賽，正式賽入口交代時間經過", () => {
  const game = makeContext();
  const bench = game.getEvent("youth_bench");
  bench.choices.forEach((choice, index) => {
    assert(choice.memory.includes("最後半局") && choice.memory.includes("沒有上場"), `板凳選項 ${index + 1} 沒有收束紅白賽`);
    assert(choice.memory.includes("名單") || choice.memory.includes("器材") || choice.memory.includes("球袋"), `板凳選項 ${index + 1} 缺少收操因果`);
  });
  prepareYouthSeason(game, 4);
  vm.runInContext("addFlags(['studied_rival_on_bench'])", game);
  const entry = game.getEvent("youth_match_entry").text();
  assert(entry.includes("紅白賽結束後") && entry.includes("又練了幾次") && entry.includes("正式聯賽"), "紅白賽到正式聯賽缺少時間與名單過渡");
});

test("四種板凳旗標都在正式賽入口得到具體回音", () => {
  const flags = [
    ["studied_rival_on_bench", "高橋三次接球"],
    ["supported_from_bench", "沿界外線熱身"],
    ["resented_bench", "掌聲收了起來"],
    ["bench_studied_pitching", "偏高、偏外球"]
  ];
  flags.forEach(([flag, phrase]) => {
    const game = makeContext();
    prepareYouthSeason(game, 4);
    vm.runInContext(`addFlags([${JSON.stringify(flag)}])`, game);
    assert(game.getEvent("youth_match_entry").text().includes(phrase), `${flag} 沒有在正式賽入口回響`);
  });
});

test("Choice Outcome 停留、只顯示一個繼續按鈕且不排入 420ms 自動跳轉", () => {
  const game = makeContext();
  prepareYouthSeason(game, 1);
  const before = vm.runInContext("({observe:player.observe,pressure:player.pressure,step:player.seasonStep})", game);
  game.choose("youth_position_trial", 0);
  const after = vm.runInContext("({observe:player.observe,pressure:player.pressure,step:player.seasonStep,pending:Boolean(pendingYouthSeasonOutcome),transitioning:isTransitioning})", game);
  const storyHtml = game.__nodes.get("story").innerHTML;
  const choicesHtml = game.__nodes.get("choices").innerHTML;
  assert(after.observe === before.observe + 1 && after.pressure === before.pressure + 1 && after.step === before.step + 1, "選項效果或回合沒有照常套用一次");
  assert(after.pending && after.transitioning, "結果畫面沒有維持等待狀態");
  assert(storyHtml.includes("你選擇") && storyHtml.includes("發生的結果") && storyHtml.includes("場上的回應") && storyHtml.includes("狀態變化"), "結果資訊層級不完整");
  assert(storyHtml.includes("觀察 +1") && storyHtml.includes("壓力 +1"), "結果畫面沒有顯示數值變化");
  assert((choicesHtml.match(/<button/g) || []).length === 1 && choicesHtml.includes("繼續") && !choicesHtml.includes("choose("), "結果畫面在繼續前仍顯示下一組選項");
  assert(game.__timers.length === 0, "少棒結果畫面仍使用自動跳轉計時器");
});

test("連點原選項與連點繼續都不會重複套用效果", () => {
  const game = makeContext();
  prepareYouthSeason(game, 1);
  game.choose("youth_position_trial", 0);
  const once = vm.runInContext("JSON.stringify({observe:player.observe,pressure:player.pressure,step:player.seasonStep,memories:player.memories.length})", game);
  game.choose("youth_position_trial", 0);
  const twice = vm.runInContext("JSON.stringify({observe:player.observe,pressure:player.pressure,step:player.seasonStep,memories:player.memories.length})", game);
  assert(once === twice, "連點選項重複套用了效果");
  game.continueYouthSeasonOutcome();
  const nextEvent = game.getCurrentEventId();
  game.continueYouthSeasonOutcome();
  assert(nextEvent === "youth_teammate" && game.getCurrentEventId() === nextEvent, "連點繼續重複推進流程");
});

test("十二種正式守備選擇都精確回收上一球，標題區分瑕疵與完成", () => {
  const cases = [
    ["match_safe_fielding", false, "傳一壘拿到出局"],
    ["match_aggressive_fielding", true, "回傳卻把一壘手拉離壘包"],
    ["match_read_fielding", false, "完成了雙殺"],
    ["outfield_took_route", false, "警戒區接殺"],
    ["outfield_set_throw", false, "沒有多推進一個壘包"],
    ["outfield_diving_attempt", true, "一壘跑者繞回本壘得分"],
    ["match_catcher_block_first", false, "擋住提前落地的第三好球"],
    ["match_catcher_called_defense", false, "引向提前移動的三壘手"],
    ["match_catcher_backed_pitcher", false, "高位快速球"],
    ["pitcher_first_strike", false, "軟弱飛球"],
    ["pitcher_challenged_hitter", true, "記錄留下暴投"],
    ["pitcher_read_swing", false, "投手前滾地球"]
  ];
  cases.forEach(([flag, isError, phrase]) => {
    const game = makeContext();
    prepareYouthSeason(game, 6);
    vm.runInContext(`addFlags([${JSON.stringify(flag)}])`, game);
    const event = game.getEvent("youth_match_mistake");
    const text = event.text();
    assert(text.includes(phrase), `${flag} 沒有精確回收上一球`);
    assert(event.title === (isError ? "那次瑕疵之後" : "下一次守備"), `${flag} 的瑕疵標題判斷錯誤`);
    assert(text.includes("又過了一局") && text.includes("五局上") && text.includes("零出局、無人在壘"), `${flag} 缺少第五局時間橋接`);
  });
});

test("第五局 Presentation 使用上一球回收文字與既有比賽狀態", () => {
  const game = makeContext();
  prepareYouthSeason(game, 6);
  vm.runInContext("player.seasonPosition='內野手'; addFlags(['match_read_fielding'])", game);
  game.showStory("youth_match_mistake");
  const state = vm.runInContext("JSON.stringify(player.matchState)", game);
  const html = game.__nodes.get("story").innerHTML;
  assert(state.includes('"inning":5') && state.includes('"outs":0') && state.includes('"runners":[false,false,false]'), "第五局狀態被改動");
  assert(html.includes("完成了雙殺") && html.includes("一局過去"), "Presentation 沒有接上精確上一球結果");
});

test("存讀結果畫面只還原已推進狀態，不重套效果也不增加 schema", () => {
  const game = makeContext();
  prepareYouthSeason(game, 1);
  const initialKeys = vm.runInContext("Object.keys(player).sort().join('|')", game);
  game.choose("youth_position_trial", 0);
  const savedObserve = vm.runInContext("player.observe", game);
  game.saveGame();
  vm.runInContext("player.observe=0", game);
  game.loadGame();
  assert(vm.runInContext("player.observe", game) === savedObserve, "讀檔後選擇效果遺失或重複");
  assert(game.getCurrentEventId() === "youth_teammate", "讀檔後沒有落在已推進的下一事件");
  assert(!vm.runInContext("Boolean(pendingYouthSeasonOutcome)", game), "暫時結果被寫進存檔");
  assert(vm.runInContext("Object.keys(player).sort().join('|')", game) === initialKeys, "暫時結果污染 player schema");
});

test("四守位仍以原八回合完成少棒第一季", () => {
  const routeEvents = ["youth_match_grounder", "youth_match_outfield", "youth_match_catcher", "youth_match_pitcher"];
  routeEvents.forEach((positionEvent, positionChoice) => {
    const game = makeContext();
    prepareYouthSeason(game, 0);
    const choices = [0, positionChoice, 0, 0, 1, 0, 0, 0];
    const seen = [];
    choices.forEach(choiceIndex => {
      const eventId = game.getCurrentEventId();
      seen.push(eventId);
      chooseAndContinue(game, eventId, choiceIndex);
    });
    assert(seen[5] === positionEvent, `${positionEvent} 守位路由改變`);
    assert(seen.length === 8 && vm.runInContext("player.chapter", game) === "少棒第一季小結", `${positionEvent} 沒有在原八回合完成`);
  });
});

console.log(`\nEvent Continuity Pass：${passed}/${passed} 通過`);
