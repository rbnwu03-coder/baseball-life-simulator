const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "competition-presentation.js"), "utf8");
const context = vm.createContext({ console, window: {} });
vm.runInContext(source, context, { filename: "competition-presentation.js" });
const api = context.CompetitionPresentation;

let passed = 0;

function test(title, assertion) {
  assertion();
  passed += 1;
  console.log(`✓ ${title}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("提供獨立且凍結的 Competition Presentation API", () => {
  assert(api && Object.isFrozen(api), "CompetitionPresentation API 未建立或未凍結");
  assert(context.window.CompetitionPresentation === api, "瀏覽器 global 未正確掛載");
});

test("Validation Event 類型涵蓋賽事、測驗與合作挑戰", () => {
  const types = plain(api.getCompetitionTypes());
  [
    "intrasquad_scrimmage",
    "exchange_game",
    "official_league",
    "tournament",
    "coach_test",
    "fielding_drill",
    "batting_test",
    "game_calling_drill",
    "teammate_challenge"
  ].forEach(id => assert(types[id], `缺少 Validation Event 類型：${id}`));
});

test("六個棒球層級都有局數、常見賽事與球季節奏資料", () => {
  const rules = plain(api.getCompetitionRules());
  const expected = { youth: 6, junior: 7, highSchool: 7, college: 9, amateur: 9, professional: 9 };
  Object.entries(expected).forEach(([id, innings]) => {
    assert(rules[id], `缺少 Competition Rule：${id}`);
    assert(rules[id].innings === innings, `${id} 局數不符`);
    assert(rules[id].commonEvents.length >= 4, `${id} 常見賽事資料不足`);
    assert(rules[id].seasonRhythm.length > 0, `${id} 缺少球季節奏`);
  });
});

test("少棒第一季整理成五個節奏拍點且不增加事件", () => {
  const flow = plain(api.getYouthSeasonFlow());
  assert(flow.length === 5, "少棒第一季應為五個節奏拍點");
  assert(flow.filter(item => item.kind === "validation").length === 3, "應有三個 Validation 節點");
  assert(flow.flatMap(item => item.eventIds).length === 11, "只應映射既有十一個可能事件 ID");
  assert(flow[0].eventIds[0] === "youth_season_intro", "球季起點錯誤");
  assert(flow[4].eventIds.includes("youth_match_after"), "正式聯賽未連到賽後");
});

test("守位輪測與紅白賽被辨識為非正式 Validation Event", () => {
  const trial = plain(api.getValidationEvent("youth_position_trial"));
  const scrimmage = plain(api.getValidationEvent("youth_bench"));
  assert(trial.typeId === "coach_test" && trial.showScore === false, "守位輪測分類錯誤");
  assert(scrimmage.typeId === "intrasquad_scrimmage" && scrimmage.showScore === false, "紅白賽分類錯誤");
});

test("正式比賽各幕共用同一 competitionId", () => {
  [
    "youth_match_entry",
    "youth_match_grounder",
    "youth_match_outfield",
    "youth_match_catcher",
    "youth_match_pitcher",
    "youth_match_mistake",
    "youth_match_after"
  ].forEach(eventId => {
    const event = plain(api.getValidationEvent(eventId));
    assert(event.competitionId === "youth_first_league_game", `${eventId} 未連回同一場正式比賽`);
    assert(event.typeId === "official_league", `${eventId} 類型不是正式聯賽`);
  });
});

test("正式比賽 Presentation 同時提供 Header、Transition、局面、比分、Connector 與 Timeline", () => {
  const model = api.createPresentation("youth_match_mistake", {
    matchState: { inning: 5, half: "上", outs: 1, runners: [true, false, true], awayScore: 2, homeScore: 1 },
    abilities: { pressure: 8, observe: 6, baseballIQ: 9 }
  });
  assert(model.competitionTitle && model.type.label, "缺少 Header");
  assert(model.transition, "缺少 Transition");
  assert(model.inningSummary === "5 局上｜1 出局", "Inning Summary 錯誤");
  assert(model.showScore && model.matchState.homeScore === 1, "Score Presentation 錯誤");
  assert(model.connector, "缺少 Connector");
  assert(model.timeline.length === 5 && model.timeline[4].status === "current", "Timeline 錯誤");
  assert(Object.isFrozen(model), "Presentation model 應為唯讀");
});

test("能力存在感只改變描述，不改變輸入或比賽狀態", () => {
  const input = {
    matchState: { inning: 4, half: "上", outs: 1, runners: [true, false, false], awayScore: 1, homeScore: 0 },
    abilities: { pressure: 1, observe: 2, baseballIQ: 3 }
  };
  const before = JSON.stringify(input);
  const low = plain(api.createPresentation("youth_match_entry", input));
  const high = plain(api.createPresentation("youth_match_entry", {
    matchState: input.matchState,
    abilities: { pressure: 9, observe: 9, baseballIQ: 9 }
  }));
  assert(JSON.stringify(input) === before, "Presentation 修改了輸入資料");
  assert(low.abilityCues[0].description !== high.abilityCues[0].description, "壓力沒有產生敘事存在感");
  assert(low.abilityCues[1].description !== high.abilityCues[1].description, "觀察沒有產生敘事存在感");
  assert(low.abilityCues[2].description !== high.abilityCues[2].description, "棒球理解沒有產生敘事存在感");
});

test("正式賽顯示比分，紅白賽不偽造比分", () => {
  const official = api.render("youth_match_entry", { matchState: { inning: 4, half: "上" } });
  const scrimmage = api.render("youth_bench", {});
  assert(official.includes("competition-score"), "正式賽缺少比分展示");
  assert(official.includes("competition-timeline"), "正式賽缺少球季 Timeline");
  assert(scrimmage.includes("Validation Event"), "紅白賽缺少 Validation 標示");
  assert(!scrimmage.includes("competition-score"), "紅白賽不應偽造比分");
});

test("非 Validation Event 不產生額外展示", () => {
  assert(api.createPresentation("youth_teammate", {}) === null, "生活事件不應建立 Competition model");
  assert(api.render("youth_teammate", {}) === "", "生活事件不應插入 Competition UI");
  assert(api.isValidationEvent("youth_teammate") === false, "生活事件被錯分成 Validation Event");
});

test("Presentation 模組沒有接管 Gameplay 或底層系統", () => {
  [
    "document.",
    "localStorage",
    "sessionStorage",
    "saveGame",
    "loadGame",
    "Math.random",
    "Date.now",
    "CurrentStateBoundary",
    "DecisionFlow",
    "EvaluationRegistry"
  ].forEach(token => assert(!source.includes(token), `Presentation 不應依賴 ${token}`));
});

console.log(`\nCompetition Flow Framework：${passed}/${passed} 通過`);
