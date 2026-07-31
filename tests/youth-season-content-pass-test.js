const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
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
  "npc.js",
  "coach.js",
  "rival.js",
  "story.js",
  "save.js",
  "script.js"
];

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
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { innerHTML: "", value: "", style: {}, classList: { add() {}, remove() {} } });
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
    window: { setTimeout: callback => callback() }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  context.__storage = storage;
  return context;
}

function choiceGameplayContract(game) {
  const contract = {};
  youthEventIds.forEach(eventId => {
    contract[eventId] = game.getEvent(eventId).choices.map(({ text, memory, ...gameplay }) => gameplay);
  });
  return contract;
}

function prepareYouthSeason(game) {
  vm.runInContext(`
    player = createInitialPlayer();
    Object.assign(player, {
      name: "內容測試球員",
      chapter: "少棒第一季",
      age: 10,
      seasonStep: 0,
      chapter2Result: "理解型新生",
      chapter2ResultDetail: "測試",
      seasonPerformance: 0,
      seasonErrors: 0
    });
    player.matchState = Object.assign({}, createInitialPlayer().matchState, { runners: [true, false, false] });
  `, game);
}

function playYouthRoute(positionChoice) {
  const game = makeContext();
  prepareYouthSeason(game);
  const seen = [];
  const choices = [0, positionChoice, 0, 0, 1, 0, 0, 0];
  choices.forEach(choiceIndex => {
    const eventId = game.getCurrentEventId();
    seen.push(eventId);
    game.choose(eventId, choiceIndex);
  });
  return { game, seen };
}

test("Choice 索引、Flag、Effect、關係與所有 Gameplay 欄位保持原快照", () => {
  const game = makeContext();
  const hash = crypto.createHash("sha256").update(JSON.stringify(choiceGameplayContract(game))).digest("hex");
  assert(hash === expectedGameplayHash, `Gameplay 合約變動：${hash}`);
});

test("四條守位路線仍使用原本八回合與原本分支位置", () => {
  const routes = [
    [0, "youth_match_grounder"],
    [1, "youth_match_outfield"],
    [2, "youth_match_catcher"],
    [3, "youth_match_pitcher"]
  ];
  routes.forEach(([positionChoice, positionEvent]) => {
    const { game, seen } = playYouthRoute(positionChoice);
    assert(JSON.stringify(seen) === JSON.stringify([
      "youth_season_intro",
      "youth_position_trial",
      "youth_teammate",
      "youth_bench",
      "youth_match_entry",
      positionEvent,
      "youth_match_mistake",
      "youth_match_after"
    ]), `${positionEvent} 路由改變`);
    assert(vm.runInContext("player.chapter === '少棒第一季小結' && Boolean(player.seasonResult)", game), `${positionEvent} 無法完成少棒第一季`);
  });
});

test("Sprint 1 Validation Event 對應與 competitionId 保持不變", () => {
  const game = makeContext();
  const expected = {
    youth_position_trial: ["coach_test", "youth_position_rotation", false],
    youth_bench: ["intrasquad_scrimmage", "youth_first_intrasquad", false],
    youth_match_entry: ["official_league", "youth_first_league_game", true],
    youth_match_grounder: ["official_league", "youth_first_league_game", true],
    youth_match_outfield: ["official_league", "youth_first_league_game", true],
    youth_match_catcher: ["official_league", "youth_first_league_game", true],
    youth_match_pitcher: ["official_league", "youth_first_league_game", true],
    youth_match_mistake: ["official_league", "youth_first_league_game", true],
    youth_match_after: ["official_league", "youth_first_league_game", true]
  };
  Object.entries(expected).forEach(([eventId, signature]) => {
    const item = game.CompetitionPresentation.getValidationEvent(eventId);
    assert(JSON.stringify([item.typeId, item.competitionId, item.showScore]) === JSON.stringify(signature), `${eventId} Validation 對應變動`);
  });
});

test("輪測與紅白賽不顯示虛構比分，正式賽顯示完整局面", () => {
  const game = makeContext();
  const trial = game.CompetitionPresentation.render("youth_position_trial", {});
  const bench = game.CompetitionPresentation.render("youth_bench", {});
  const official = game.CompetitionPresentation.render("youth_match_grounder", {
    matchState: { inning: 4, half: "上", outs: 1, awayScore: 2, homeScore: 1, runners: [true, false, false] },
    abilities: { baseballIQ: 8 }
  });
  assert(!trial.includes("competition-score") && !bench.includes("competition-score"), "非正式驗證出現虛構比分");
  ["4 局上｜1 出局", "客隊", "2", "1", "少棒隊", "一壘有人", "1壘"].forEach(text => assert(official.includes(text), `正式賽缺少：${text}`));
});

test("Presentation 不重複主要資訊，Story 不再重述結構化比分", () => {
  const game = makeContext();
  const model = game.CompetitionPresentation.createPresentation("youth_match_grounder", {
    matchState: { inning: 4, half: "上", outs: 1, awayScore: 2, homeScore: 1, runners: [true, false, false] }
  });
  const html = game.CompetitionPresentation.render("youth_match_grounder", {
    matchState: { inning: 4, half: "上", outs: 1, awayScore: 2, homeScore: 1, runners: [true, false, false] }
  });
  assert(model.stageLabel === "第一個守備" && !model.stageLabel.includes("局"), "Header 重複局數");
  assert(html.split(model.competitionTitle).length - 1 === 1, "比賽名稱重複輸出");
  const entryText = game.getEvent("youth_match_entry").text();
  const afterText = game.getEvent("youth_match_after").text();
  assert(!entryText.includes("四局上") && !entryText.includes("1：2"), "Story 重複 Entry 局數或比分");
  assert(!afterText.includes("終場，少棒隊以") && !afterText.includes("比分定格"), "Story 重複終場比分");
});

test("每個 Validation 局面只顯示一項自然能力線索", () => {
  const game = makeContext();
  [
    ["youth_match_entry", "pressure"],
    ["youth_match_outfield", "observe"],
    ["youth_match_catcher", "baseballIQ"]
  ].forEach(([eventId, abilityId]) => {
    const model = game.CompetitionPresentation.createPresentation(eventId, { abilities: { pressure: 9, observe: 9, baseballIQ: 9 } });
    assert(model.abilityCues.length === 1 && model.abilityCues[0].id === abilityId, `${eventId} 能力線索層級錯誤`);
    assert(!model.abilityCues[0].description.includes("提高") && !model.abilityCues[0].description.includes("能力"), `${eventId} 仍像數值說明`);
  });
});

test("棒球選項改為具體動作，結果先描述場上後果", () => {
  const game = makeContext();
  const baseballEvents = youthEventIds.filter(id => !["youth_teammate", "youth_season_result"].includes(id));
  const forbidden = ["積極進攻", "穩定處理", "仔細觀察", "相信自己", "配合隊友", "做得很好"];
  baseballEvents.forEach(eventId => {
    game.getEvent(eventId).choices.forEach((choice, index) => {
      forbidden.forEach(word => assert(!choice.text.includes(word), `${eventId}[${index}] 使用抽象選項：${word}`));
      assert(choice.text.length >= 8, `${eventId}[${index}] 選項缺少具體動作`);
      assert(typeof choice.memory === "string" && choice.memory.length >= 20, `${eventId}[${index}] 結果敘述過薄`);
    });
  });
});

test("少棒第一季完成後 Save／Load 能還原章節、守位、比賽與結果", () => {
  const { game } = playYouthRoute(2);
  game.saveGame();
  vm.runInContext(`
    player.chapter = "十歲暑假";
    player.seasonPosition = "";
    player.seasonResult = "";
    player.matchState.homeScore = 99;
  `, game);
  game.loadGame();
  assert(vm.runInContext(`
    player.chapter === "少棒第一季小結" &&
    player.seasonPosition === "捕手" &&
    Boolean(player.seasonResult) &&
    player.matchState.homeScore !== 99
  `, game), "Save／Load 未完整還原少棒第一季");
});

console.log(`\n少棒第一季 Content & Match Presentation：${passed}/${passed} 通過`);
