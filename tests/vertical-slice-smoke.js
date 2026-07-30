const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "story.js", "save.js", "script.js"];

function makeContext() {
  const nodes = new Map();
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { innerHTML: "", value: id === "nameInput" ? "測試球員" : "", style: {} });
      return nodes.get(id);
    }
  };
  const storage = new Map();
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
  return context;
}

function playUntil(game, choices, condition, maxTurns = 20) {
  let turn = 0;
  while (!vm.runInContext(condition, game) && turn < maxTurns) {
    game.choose(game.getCurrentEventId(), choices[turn % choices.length] ?? 0);
    turn += 1;
  }
  if (!vm.runInContext(condition, game)) throw new Error(`流程未在 ${maxTurns} 回合內完成：${condition}`);
}

function play(routeChoices, chapter2Choices, seasonChoices, competitionChoices, juniorChoices, juniorSeasonChoices, highSchoolChoices, criticalChoices, transitionChoices) {
  const game = makeContext();
  vm.runInContext("selectedIdealSelf = '全能型'", game);
  game.createPlayer();
  for (let day = 0; day < 7; day += 1) {
    game.choose(game.getCurrentEventId(), routeChoices[(day * 2) % routeChoices.length]);
    game.choose(game.getCurrentEventId(), day === 6 ? 0 : routeChoices[(day * 2 + 1) % routeChoices.length]);
    if (day < 6) game.choose("night", 0);
  }
  if (!vm.runInContext("player.ending", game)) {
    throw new Error(`第一章沒有產生結局：${vm.runInContext("JSON.stringify({day:player.day,phase:player.phase,event:getCurrentEventId(),transition:isTransitioning})", game)}`);
  }
  game.choose("ending", 0);
  playUntil(game, chapter2Choices, "Boolean(player.chapter2Result)", 10);
  if (!vm.runInContext("player.chapter2Result", game)) throw new Error("第二章沒有產生入門評估");
  game.choose("chapter2_result", 0);
  seasonChoices.forEach(choice => game.choose(game.getCurrentEventId(), choice));
  if (!vm.runInContext("player.seasonResult", game)) throw new Error("少棒第一季沒有產生評估");
  game.choose("youth_season_result", 0);
  playUntil(game, competitionChoices, "Boolean(player.competitionResult)");
  if (!vm.runInContext("player.competitionResult", game)) throw new Error("位置競爭沒有產生評估");
  game.choose("competition_result", 0);
  playUntil(game, juniorChoices, "Boolean(player.juniorResult)");
  if (!vm.runInContext("player.juniorResult", game)) throw new Error("青少棒開場沒有產生評估");
  game.choose("junior_result", 0);
  playUntil(game, juniorSeasonChoices, "Boolean(player.juniorSeasonResult)");
  if (!vm.runInContext("player.juniorSeasonResult && player.highSchoolRoute", game)) throw new Error("青少棒階段沒有產生升學評估");
  game.choose("junior_season_result", 0);
  playUntil(game, highSchoolChoices, "Boolean(player.highSchoolResult)");
  if (!vm.runInContext("player.highSchoolResult && player.highSchoolTeamRole", game)) throw new Error("青棒第一年沒有產生評估");
  game.choose("high_school_result", 0);
  playUntil(game, criticalChoices, "Boolean(player.criticalYearResult)");
  if (!vm.runInContext("player.criticalYearResult && player.careerExit", game)) throw new Error("青棒關鍵年沒有產生出口評估");
  game.choose("critical_year_result", 0);
  playUntil(game, transitionChoices, "Boolean(player.transitionResult)");
  if (!vm.runInContext("player.transitionResult && player.organizationRole", game)) throw new Error("生涯轉換期沒有產生評估");
  game.choose("transition_result", 0);
  playUntil(game, transitionChoices, "Boolean(player.developmentResult)");
  if (!vm.runInContext("player.developmentResult && player.marketOutcome", game)) throw new Error("二十二歲發展期沒有產生評估");
  const summary = vm.runInContext("`${player.chapterOneEnding} -> ${player.careerExit} -> ${player.organizationRole} -> ${player.marketOutcome}`", game);
  game.choose("development_result", 0);
  if (!vm.runInContext("player.completed && getCurrentEventId() === 'slice_complete'", game)) throw new Error("二十二歲完成頁沒有接通");
  return summary;
}

const results = [
  play([0], [0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0]),
  play([1], [2, 2, 1, 2], [2, 2, 1, 0, 1, 2, 1, 1], [1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1], [1, 1]),
  play([2], [1, 1, 2, 1], [1, 1, 2, 2, 2, 1, 2, 2], [2, 0, 2], [2, 2, 2, 2, 2], [2, 2, 2, 2, 2, 2], [2, 2, 2, 2, 2, 2], [2, 2, 2, 2, 2, 2], [2, 2])
];

const persistence = makeContext();
vm.runInContext("selectedIdealSelf = '技術鑽研型'", persistence);
persistence.createPlayer();
persistence.choose(persistence.getCurrentEventId(), 0);
vm.runInContext("player.relationships.coachTrust = 4; player.positionAffinity.infield = 3; player.body.injuryRisk = 2", persistence);
persistence.saveGame();
vm.runInContext("player = createInitialPlayer('被覆蓋')", persistence);
persistence.loadGame();
if (vm.runInContext("player.name", persistence) !== "測試球員") throw new Error("存讀檔沒有還原角色");
if (vm.runInContext("player.idealSelf", persistence) !== "技術鑽研型") throw new Error("存讀檔沒有還原理想球員形象");
if (!vm.runInContext("player.baseballSkills && Array.isArray(player.flags)", persistence)) throw new Error("存檔補欄位失敗");
if (!vm.runInContext("player.relationships.coachTrust === 4 && player.positionAffinity.infield === 3", persistence)) throw new Error("第一季狀態沒有還原");
if (!vm.runInContext("player.body.injuryRisk === 2", persistence)) throw new Error("青少棒身體狀態沒有還原");

const legacyIdealSelf = makeContext();
vm.runInContext("player = normalizeSave({ name: '舊存檔球員' }); updateStatus()", legacyIdealSelf);
if (vm.runInContext("player.idealSelf", legacyIdealSelf) !== "") throw new Error("舊存檔的理想球員形象 fallback 不正確");
if (!vm.runInContext("document.getElementById('player-info').innerHTML.includes('理想球員：尚未形成')", legacyIdealSelf)) throw new Error("舊存檔沒有顯示安全 fallback");

const originTest = makeContext();
vm.runInContext("selectedOrigin = 'understand'; selectedIdealSelf = '直覺天賦型'", originTest);
originTest.createPlayer();
if (!vm.runInContext("player.origin === 'understand' && player.observe === 2 && player.flags.includes('origin_wants_to_understand')", originTest)) throw new Error("角色願望沒有套用");
if (!vm.runInContext("getEvent('day1_morning').text().includes('答案')", originTest)) throw new Error("角色願望沒有改變開場文字");

const bookmarkTest = makeContext();
const bookmarkExpectations = {
  childhoodEnd: "day7_morning",
  chapter2: "chapter2_intro",
  firstMatch: "youth_match_entry",
  matchInfield: "youth_match_entry",
  matchOutfield: "youth_match_entry",
  matchCatcher: "youth_match_entry",
  matchPitcher: "youth_match_entry",
  competition: "competition_intro",
  junior: "junior_intro",
  pain: "junior_pain"
  ,juniorSeason: "junior_consequence",
  highSchool: "high_school_intro",
  criticalYear: "critical_offseason",
  batPath: "critical_offseason",
  transitionDraft: "transition_draft_day",
  transitionCollege: "transition_college_arrival",
  transitionAmateur: "transition_amateur_job",
  transitionRehab: "transition_rehab_plateau",
  development: "development_daily_life"
};
Object.entries(bookmarkExpectations).forEach(([bookmark, expected]) => {
  bookmarkTest.loadTestBookmark(bookmark);
  const actual = vm.runInContext("getCurrentEventId()", bookmarkTest);
  if (actual !== expected) throw new Error(`書籤 ${bookmark} 跳到 ${actual}，預期 ${expected}`);
});

const rehabTest = makeContext();
rehabTest.loadTestBookmark("criticalYear");
[2, 0, 0, 0, 2, 2, 0, 3].forEach(choice => rehabTest.choose(rehabTest.getCurrentEventId(), choice));
if (!vm.runInContext("player.careerExit === '復健與生涯暫停'", rehabTest)) throw new Error("復健出口沒有正確形成");

const rehabTransitionTest = makeContext();
rehabTransitionTest.loadTestBookmark("transitionRehab");
playUntil(rehabTransitionTest, [1], "Boolean(player.transitionResult)");
if (!vm.runInContext("player.transitionResult && player.organizationRole === '復健球員與基層協助者'", rehabTransitionTest)) throw new Error("復健轉換期沒有正確形成");

const positionTest = makeContext();
const positionProfiles = {
  "內野手": "Object.assign(player.baseballSkills,{catching:12,throwing:10,reaction:14,range:10,baseballIQ:11})",
  "外野手": "Object.assign(player.baseballSkills,{catching:10,throwing:10,armStrength:14,range:14,baseRunning:12})",
  "捕手": "Object.assign(player.baseballSkills,{catching:12,throwing:10,blocking:14,gameCalling:14,baseballIQ:12})",
  "投手": "Object.assign(player.baseballSkills,{throwing:12,armStrength:14,control:14,pitchStamina:14,baseballIQ:10})"
};
Object.entries(positionProfiles).forEach(([expected, setup]) => {
  vm.runInContext("player = createInitialPlayer('守位測試')", positionTest);
  vm.runInContext(setup, positionTest);
  const actual = vm.runInContext("calculatePositionRatings()[0].position", positionTest);
  if (actual !== expected) throw new Error(`守位能力連結錯誤：預期 ${expected}，得到 ${actual}`);
});

const positionImpactTest = makeContext();
const positionRoutes = [
  { choice: 0, position: "內野手", event: "youth_match_grounder", skill: "reaction" },
  { choice: 1, position: "外野手", event: "youth_match_outfield", skill: "range" },
  { choice: 2, position: "捕手", event: "youth_match_catcher", skill: "blocking" },
  { choice: 3, position: "投手", event: "youth_match_pitcher", skill: "control" }
];
positionRoutes.forEach(route => {
  vm.runInContext("player = createInitialPlayer('守位事件測試'); player.chapter = '少棒第一季'; player.seasonStep = 1", positionImpactTest);
  positionImpactTest.choose("youth_position_trial", route.choice);
  if (vm.runInContext("player.seasonPosition", positionImpactTest) !== route.position) throw new Error(`${route.position}沒有成為暫定主守位`);
  vm.runInContext("player.seasonStep = 5", positionImpactTest);
  if (vm.runInContext("getCurrentEventId()", positionImpactTest) !== route.event) throw new Error(`${route.position}沒有觸發專屬比賽事件`);
  const before = vm.runInContext(`player.baseballSkills.${route.skill}`, positionImpactTest);
  positionImpactTest.choose(route.event, 0);
  if (vm.runInContext(`player.baseballSkills.${route.skill}`, positionImpactTest) <= before) throw new Error(`${route.position}專屬能力沒有成長`);
});
vm.runInContext("player = createInitialPlayer('上限測試'); applyNestedEffects('positionAffinity', { catcher: 99 }); applyNestedEffects('relationships', { coachTrust: 99 })", positionImpactTest);
if (!vm.runInContext("player.positionAffinity.catcher === 20 && player.relationships.coachTrust === 20", positionImpactTest)) throw new Error("守位適性或關係數值沒有維持上限");
vm.runInContext("player = createInitialPlayer('轉守位測試'); player.chapter = '青少棒'; player.seasonPosition = '捕手'", positionImpactTest);
positionImpactTest.choose("junior_position_change", 0);
if (!vm.runInContext("player.secondaryPosition === '內野手' && player.positionAffinity.infield === 2", positionImpactTest)) throw new Error("接受轉守位後沒有建立第二守位");

const batPathTest = makeContext();
vm.runInContext("player = createInitialPlayer('打擊路線'); player.seasonPosition = '外野手'; player.baseballSkills.batting = 20; player.ballSense = 15; player.discipline = 12; player.confidence = 12; player.baseballSkills.baseballIQ = 8; player.scoutEvaluation = 3; player.body.injuryRisk = 0; player.flags = ['entered_high_school_draft','developed_high_school_bat','critical_invest_offense']", batPathTest);
if (!vm.runInContext("getOffensiveCareerValue() > getPositionCareerValue()", batPathTest)) throw new Error("高打擊低守位角色沒有形成進攻優勢");
vm.runInContext("evaluateCriticalYear()", batPathTest);
if (!vm.runInContext("player.careerPrimaryTool === '打擊' && player.careerExit === '高卒選秀・中後段指名候選'", batPathTest)) throw new Error("靠打擊進入高卒選秀的道路沒有成立");
vm.runInContext("evaluateCareerTransition()", batPathTest);
if (!vm.runInContext("player.organizationRole === '職業球團打擊養成／代打候選'", batPathTest)) throw new Error("職業體系沒有承接打擊型角色");

const pacingTest = makeContext();
pacingTest.loadTestBookmark("chapter2");
const chapter2Sequence = ["chapter2_intro", "chapter2_day1_training", "chapter2_team_breath", "chapter2_day2_correction", "chapter2_batting_intro", "chapter2_day3_test"];
chapter2Sequence.forEach((expected, step) => {
  vm.runInContext(`player.chapter2Step = ${step}`, pacingTest);
  if (vm.runInContext("getCurrentEventId()", pacingTest) !== expected) throw new Error(`少棒入門第 ${step + 1} 段節奏錯誤`);
});
vm.runInContext("player.day = 1", pacingTest);
const nightOne = vm.runInContext("getNightEvent().text", pacingTest);
vm.runInContext("player.day = 3", pacingTest);
const nightThree = vm.runInContext("getNightEvent().text", pacingTest);
if (nightOne === nightThree) throw new Error("童年夜晚回顧仍然重複");
pacingTest.loadTestBookmark("transitionDraft");
vm.runInContext("player.transitionStep = 4", pacingTest);
if (vm.runInContext("getCurrentEventId()", pacingTest) !== "transition_cost_check") throw new Error("生涯轉換期缺少代價承接事件");

const skillCapTest = makeContext();
skillCapTest.loadTestBookmark("firstMatch");
vm.runInContext("player.baseballSkills.reaction = 20; applySkillEffects({reaction: 3}); updateStatus()", skillCapTest);
if (!vm.runInContext("player.baseballSkills.reaction === 20", skillCapTest)) throw new Error("棒球技能上限失效");
if (vm.runInContext("document.getElementById('status').innerHTML.includes('undefined')", skillCapTest)) throw new Error("棒球技能顯示 undefined");

const suspenseTest = makeContext();
suspenseTest.loadTestBookmark("competition");
vm.runInContext("enterPositionCompetition()", suspenseTest);
if (!vm.runInContext("player.pendingEvents.length === 1 && player.pendingEvents[0].remainingActions === 3", suspenseTest)) throw new Error("先發測試倒數沒有建立");
[0, 0, 0].forEach(choice => suspenseTest.choose(suspenseTest.getCurrentEventId(), choice));
if (!vm.runInContext("getCurrentEventId() === 'starter_selection_test'", suspenseTest)) throw new Error("倒數歸零後沒有自動觸發先發測試");
suspenseTest.choose("starter_selection_test", 0);
if (!vm.runInContext("getCurrentEventId() === 'starter_selection_result' && Boolean(player.startingCompetition.result)", suspenseTest)) throw new Error("先發競爭沒有公布結果");
suspenseTest.choose("starter_selection_result", 0);
if (!vm.runInContext("!player.forcedEventId && player.currentGoal && player.shortGoal && player.longGoal", suspenseTest)) throw new Error("競爭結果後沒有回到原流程或更新目標");
suspenseTest.saveGame();
vm.runInContext("player = createInitialPlayer('被覆蓋')", suspenseTest);
suspenseTest.loadGame();
if (!vm.runInContext("player.startingCompetition && Array.isArray(player.pendingEvents)", suspenseTest)) throw new Error("懸念與競爭資料沒有正確存讀");

const azheBondTest = makeContext();
azheBondTest.loadTestBookmark("competition");
vm.runInContext("player.competitionStep = 3; player.relationships.teammateBond = 7", azheBondTest);
if (vm.runInContext("getCurrentEventId()", azheBondTest) !== "azhe_bond_high") throw new Error("阿哲高羈絆事件沒有觸發");
azheBondTest.choose("azhe_bond_high", 0);
if (!vm.runInContext("player.flags.includes('azhe_confession_resolved') && player.relationships.teammateBond >= 9 && player.characterArc.azhe === 'confided'", azheBondTest)) throw new Error("阿哲高羈絆回響沒有留下");
vm.runInContext("player.competitionStep = 3; player.relationships.teammateBond = 1; player.forcedEventId = ''", azheBondTest);
if (vm.runInContext("getCurrentEventId()", azheBondTest) !== "azhe_bond_low") throw new Error("阿哲低羈絆事件沒有觸發");
azheBondTest.choose("azhe_bond_low", 0);
if (!vm.runInContext("player.flags.includes('repaired_azhe_signal') && player.relationships.teammateBond === 4", azheBondTest)) throw new Error("阿哲低羈絆修復選項沒有生效");
vm.runInContext("player.chapter = '青少棒'; player.juniorStep = 8; player.relationships.teammateBond = 8; player.characterArc.azhe = 'respected_equal'", azheBondTest);
if (!vm.runInContext("getEvent('junior_friend_exit').text().includes('工作表攤開') && getEvent('junior_friend_exit').text().includes('不是替他簽名')", azheBondTest)) throw new Error("阿哲去留事件沒有以具體場景回收高羈絆");
vm.runInContext("player.relationships.teammateBond = 1; player.characterArc.azhe = 'distant'", azheBondTest);
if (!vm.runInContext("getEvent('junior_friend_exit').text().includes('教練口中')", azheBondTest)) throw new Error("阿哲去留事件沒有回收低羈絆");

const catcherEventTest = makeContext();
catcherEventTest.loadTestBookmark("competition");
vm.runInContext("player.pendingEvents = []; player.forcedEventId = ''; player.competitionStep = 5; player.seasonPosition = '捕手'", catcherEventTest);
if (vm.runInContext("getCurrentEventId()", catcherEventTest) !== "competition_catcher_test") throw new Error("捕手專屬測驗沒有觸發");
const blockingBefore = vm.runInContext("player.baseballSkills.blocking", catcherEventTest);
catcherEventTest.choose("competition_catcher_test", 0);
if (vm.runInContext("player.baseballSkills.blocking", catcherEventTest) <= blockingBefore) throw new Error("捕手擋球沒有成長");
catcherEventTest.loadTestBookmark("competition");
vm.runInContext("player.pendingEvents = []; player.forcedEventId = ''; player.competitionStep = 5; player.seasonPosition = '捕手'", catcherEventTest);
const callingBefore = vm.runInContext("player.baseballSkills.gameCalling", catcherEventTest);
catcherEventTest.choose("competition_catcher_test", 2);
if (vm.runInContext("player.baseballSkills.gameCalling", catcherEventTest) <= callingBefore) throw new Error("捕手配球指揮沒有成長");

const personalityTest = makeContext();
personalityTest.loadTestBookmark("competition");
vm.runInContext("player.pendingEvents = []; player.forcedEventId = ''; player.competitionStep = 0", personalityTest);
personalityTest.choose("competition_intro", 0);
if (!vm.runInContext("player.personality.brave >= 1 && player.personality.ambitious >= 1 && player.impression.coach.competitive >= 1", personalityTest)) throw new Error("Phase 6 personality effects were not applied");
vm.runInContext("player.competitionStep = 2; player.impression.coach.immature = 5", personalityTest);
if (vm.runInContext("getCurrentEventId()", personalityTest) !== "echo_coach_immature") throw new Error("Immature coach echo did not route");
vm.runInContext("player.impression.coach.immature = 0; player.impression.coach.dependable = 5; player.impression.coach.leader = 3", personalityTest);
if (vm.runInContext("getCurrentEventId()", personalityTest) !== "echo_coach_leadership") throw new Error("Leadership coach echo did not route");
vm.runInContext("player.impression.coach.dependable = 0; player.impression.coach.leader = 0; player.impression.takahashi.respect = 5", personalityTest);
if (vm.runInContext("getCurrentEventId()", personalityTest) !== "echo_rival_respect") throw new Error("Rival respect echo did not route");
vm.runInContext("player.competitionStep = 3; player.impression.azhe.trusts = 5; player.impression.azhe.feelsDistance = 0; player.relationships.teammateBond = 3", personalityTest);
if (vm.runInContext("getCurrentEventId()", personalityTest) !== "azhe_bond_high") throw new Error("Azhe impression did not unlock high bond scene");
vm.runInContext("player.impression.azhe.feelsDistance = 5", personalityTest);
if (vm.runInContext("getCurrentEventId()", personalityTest) !== "azhe_bond_low") throw new Error("Azhe distance did not unlock low bond scene");
vm.runInContext("player.chapter = '青少棒'; player.juniorStep = 5", personalityTest);
personalityTest.choose("junior_friend_exit", 0);
if (!vm.runInContext("player.characterArc.azhe === 'respected_equal' && player.personality.kind >= 2", personalityTest)) throw new Error("Azhe character arc was not preserved");
vm.runInContext("player.completed = true", personalityTest);
if (!vm.runInContext("getEvent('slice_complete').text().includes('你成為的那種人')", personalityTest)) throw new Error("Final personality reflection is missing");

const phase7Test = makeContext();
const phase7Bookmarks = ["azheTrust", "azheDistance", "takahashiRespect", "takahashiHostile", "coachDependable", "coachDisappointed", "characterCrossroads", "coachRecommendation"];
phase7Bookmarks.forEach(bookmark => phase7Test.loadTestBookmark(bookmark));
phase7Test.loadTestBookmark("azheDistance");
if (vm.runInContext("getCurrentEventId()", phase7Test) !== "junior_azhe_cover") throw new Error("Phase 7 Azhe cover bookmark failed");
if (!vm.runInContext("getNpcPerceptionSummary('azhe').includes('阿哲') && !getNpcPerceptionSummary('azhe').match(/\\d/)", phase7Test)) throw new Error("NPC perception summary exposed raw values");
phase7Test.loadTestBookmark("takahashiRespect");
if (vm.runInContext("getCurrentEventId()", phase7Test) !== "junior_takahashi_failure") throw new Error("Phase 7 Takahashi event chain failed");
phase7Test.loadTestBookmark("coachDisappointed");
if (vm.runInContext("getCurrentEventId()", phase7Test) !== "junior_coach_disagreement") throw new Error("Phase 7 coach disagreement failed");
phase7Test.loadTestBookmark("coachRecommendation");
if (vm.runInContext("getCurrentEventId()", phase7Test) !== "yamamoto_recommendation") throw new Error("Phase 7 recommendation bookmark failed");
const recommendations = vm.runInContext(`(() => {
  const variants = [
    { personality:{}, impression:{ dependable:7, leader:4, competitive:0, immature:0 } },
    { personality:{}, impression:{ dependable:7, leader:0, competitive:0, immature:0 } },
    { personality:{}, impression:{ dependable:0, leader:0, competitive:7, immature:0 } },
    { personality:{}, impression:{ dependable:0, leader:0, competitive:0, immature:7 } },
    { personality:{ thoughtful:7 }, impression:{ dependable:0, leader:0, competitive:0, immature:0 } },
    { personality:{}, impression:{ dependable:0, leader:0, competitive:0, immature:0 } }
  ];
  return variants.map(v => {
    player.personality = Object.assign({}, createInitialPlayer().personality, v.personality);
    player.impression.coach = Object.assign({}, createInitialPlayer().impression.coach, v.impression);
    player.flags = [];
    player.characterArc.azhe = 'neutral';
    return generateCoachRecommendation();
  });
})()`, phase7Test);
if (new Set(recommendations).size < 6) throw new Error("Coach recommendation does not provide six core variants");
if (!vm.runInContext("SAVE_VERSION >= 5", phase7Test)) throw new Error("Save version does not include Phase 7 structures");

console.log(results.join("\n"));
console.log("存讀檔 -> 通過");
console.log("角色願望與開場變體 -> 通過");
console.log("十四個暫時測試書籤 -> 通過");
console.log("復健生涯出口 -> 通過");
console.log("復健轉換期 -> 通過");
console.log("四種守位能力連結 -> 通過");
console.log("四守位專屬比賽與評分上限 -> 通過");
console.log("靠打擊進職棒與代打養成角色 -> 通過");
console.log("章節節奏、夜晚呼吸與轉換期承接 -> 通過");
console.log("技能上限與缺少欄位補全 -> 通過");
console.log("近期目標、倒數懸念與先發競爭 -> 通過");
console.log("阿哲高低羈絆事件與後續回響 -> 通過");
console.log("捕手擋球與配球指揮事件 -> 通過");
console.log("Phase 7 人物視角、專屬事件鏈與八個書籤 -> 通過");
