const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const integration = require("../baseball-gameplay-integration.js");
let passed = 0;

function test(title, assertion) {
  assertion();
  passed += 1;
  console.log(`✓ ${title}`);
}

function playerFacts(overrides = {}) {
  const value = {
    chapter: "少棒第一季",
    seasonStep: 5,
    seasonPosition: "內野手",
    seasonPerformance: 0,
    seasonErrors: 0,
    baseballSkills: { catching: 10, reaction: 10, range: 10, throwing: 10 },
    body: { fatigue: 0, pain: 0, injuryRisk: 0 },
    matchState: { inning: 4, half: "上", outs: 1, runners: [true, false, false], awayScore: 1, homeScore: 1 },
    flags: []
  };
  const result = JSON.parse(JSON.stringify(value));
  Object.entries(overrides).forEach(([key, nested]) => {
    if (nested && typeof nested === "object" && !Array.isArray(nested) && result[key]) Object.assign(result[key], nested);
    else result[key] = nested;
  });
  return result;
}

function rolls(overrides = {}) {
  return Object.assign({ fieldingExecution: 0.5, fieldingResult: 0.5, throwExecution: 0.5, result: 0.01 }, overrides);
}

function resolve(throwDecision, customPlayer = {}, customRolls = {}) {
  return integration.resolveYouthGrounder(
    playerFacts(customPlayer),
    { fieldingApproach: "secure", throwDecision },
    rolls(customRolls)
  );
}

function offensivePlayerFacts(overrides = {}) {
  const result = playerFacts({
    chapter: "青棒第二年",
    highSchoolYearTwoStep: 2,
    seasonPosition: "內野手",
    ballSense: 10,
    discipline: 10,
    baseballSkills: {
      catching: 10,
      reaction: 10,
      range: 10,
      throwing: 10,
      batting: 10,
      baseballIQ: 10,
      baseRunning: 10
    },
    matchState: { inning: 5, half: "下", outs: 1, runners: [false, true, false], awayScore: 1, homeScore: 1 }
  });
  Object.entries(overrides).forEach(([key, nested]) => {
    if (nested && typeof nested === "object" && !Array.isArray(nested) && result[key]) Object.assign(result[key], nested);
    else result[key] = nested;
  });
  return result;
}

function offensiveRolls(overrides = {}) {
  return Object.assign({ execution: 0.5, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 }, overrides);
}

const runtimeFiles = [
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
  "baseball-gameplay-prototype-utils.js",
  "baseball-defense-prototype.js",
  "baseball-offense-prototype.js", "offensive-plate-approach.js",
  "baseball-gameplay-integration.js",
  "career-spine-contract.js",
  "career-transition-resolver.js",
  "career-transition-commit.js",
  "career-transition-runtime-resolver.js",
  "career-transition-progression.js",
  "career-development-runtime-resolver.js",
  "career-development-progression.js",
  "career-age22-outcome-resolver.js",
  "career-save-admission.js",
  "npc.js",
  "coach.js",
  "rival.js",
  "story.js",
  "save.js",
  "script.js"
];

function makeRuntime() {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) {
        nodes.set(id, {
          innerHTML: "",
          value: "",
          style: {},
          classList: { add() {}, remove() {}, toggle() {} },
          setAttribute() {},
          removeAttribute() {},
          focus() {}
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
    window: { setTimeout: callback => callback() }
  });
  runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  context.__storage = storage;
  return context;
}

function prepareGrounder(game, fixedRolls, extra = "") {
  vm.runInContext(`
    player = createInitialPlayer("整合測試球員");
    Object.assign(player, {
      chapter: "少棒第一季",
      age: 10,
      seasonStep: 5,
      seasonPosition: "內野手",
      seasonPerformance: 0,
      seasonErrors: 0
    });
    Object.assign(player.baseballSkills, { catching: 10, reaction: 10, range: 10, throwing: 10 });
    Object.assign(player.body, { fatigue: 0, pain: 0, injuryRisk: 0 });
    player.matchState = { inning: 4, half: "上", outs: 1, runners: [true, false, false], awayScore: 1, homeScore: 1 };
    ${extra}
    createGameplayRolls = () => Object.freeze(${JSON.stringify(fixedRolls)});
    showCurrentEvent();
  `, game);
}

test("Registry 只包含本次兩個 Pilot entries", () => {
  assert.deepStrictEqual(Object.keys(integration.getIntegrationRegistry()), ["youth_match_grounder", "high_school_year_two_spring_game"]);
});

test("youth_match_grounder 標記為 live defense", () => {
  assert.deepStrictEqual(integration.getIntegrationEvent("youth_match_grounder"), {
    eventId: "youth_match_grounder", mode: "live", gameplayFamily: "defense", baseState: "one-out-runner-on-first"
  });
});

test("高中春季打擊已標記為 live offense", () => {
  const registration = integration.getIntegrationEvent("high_school_year_two_spring_game");
  assert.strictEqual(registration.mode, "live");
  assert.strictEqual(registration.gameplayFamily, "offense");
});

test("高中二壘有人與 Offensive Core base state 相容", () => {
  assert.deepStrictEqual(integration.evaluateOffensiveEventReadiness("high_school_year_two_spring_game"), {
    compatible: true,
    reason: "compatible-base-state",
    requiredBaseState: "one-out-runner-on-second",
    supportedBaseStates: ["one-out-runner-on-first", "one-out-runner-on-second"]
  });
});

test("Numeric skill tier mapping 使用單一固定門檻", () => {
  assert.deepStrictEqual([0, 3, 4, 7, 8, 11, 12, 20].map(integration.mapNumericSkillTier), ["low", "low", "average", "average", "high", "high", "elite", "elite"]);
});

test("內野守備由 catching、reaction、range 平均取得", () => {
  assert.strictEqual(integration.deriveFieldingScore({ catching: 4, reaction: 8, range: 9 }), 7);
});

test("Body adapter 依 injury、fatigue、normal 順序映射", () => {
  assert.deepStrictEqual([
    integration.deriveBodyState({ fatigue: 7, pain: 0, injuryRisk: 0 }),
    integration.deriveBodyState({ fatigue: 7, pain: 3, injuryRisk: 0 }),
    integration.deriveBodyState({ fatigue: 0, pain: 0, injuryRisk: 0 })
  ], ["fatigued", "minor-injury", "normal"]);
});

test("正式比分以主隊少棒隊視角衍生", () => {
  assert.deepStrictEqual([
    integration.getScoreStateFromMatchState({ awayScore: 3, homeScore: 1 }),
    integration.getScoreStateFromMatchState({ awayScore: 2, homeScore: 1 }),
    integration.getScoreStateFromMatchState({ awayScore: 1, homeScore: 1 }),
    integration.getScoreStateFromMatchState({ awayScore: 1, homeScore: 2 })
  ], ["behind-2-plus", "behind-1", "tied", "ahead"]);
});

test("Integration input 精確建立固定 Grounder facts", () => {
  const result = integration.createYouthGrounderInput(playerFacts(), { fieldingApproach: "secure", throwDecision: "turn-two" }, rolls());
  assert.strictEqual(result.status, "ready");
  assert.deepStrictEqual(result.input.situation, { ballType: "routine", ballDifficulty: "normal", batterSpeed: "average", runnerSpeed: "average", scoreState: "tied" });
});

test("Provided rolls 讓同一輸入 deterministic", () => {
  assert.deepStrictEqual(resolve("turn-two"), resolve("turn-two"));
});

test("Integration 不修改 Player input", () => {
  const input = playerFacts();
  const before = JSON.stringify(input);
  integration.resolveYouthGrounder(input, { fieldingApproach: "secure", throwDecision: "turn-two" }, rolls());
  assert.strictEqual(JSON.stringify(input), before);
});

test("缺少 Player facts 會 fail closed", () => {
  const input = playerFacts();
  delete input.baseballSkills.range;
  assert.strictEqual(integration.resolveYouthGrounder(input, { fieldingApproach: "secure", throwDecision: "turn-two" }, rolls()).status, "unresolved");
});

test("不相容的一出局一壘狀態會 fail closed", () => {
  assert.strictEqual(integration.resolveYouthGrounder(playerFacts({ matchState: { runners: [false, true, false] } }), { fieldingApproach: "secure", throwDecision: "turn-two" }, rolls()).issues[0].code, "base-state");
});

test("Routine Grounder 不提供 dive", () => {
  assert.strictEqual(integration.isFieldingApproachAvailable("dive"), false);
});

test("Fielding failed 直接完成並跳過 Stage B", () => {
  const result = integration.resolveYouthGrounderFielding(
    playerFacts({ baseballSkills: { catching: 0, reaction: 0, range: 0, throwing: 10 }, body: { pain: 3 } }),
    "attack",
    rolls({ fieldingExecution: 0.1, fieldingResult: 0.75 })
  );
  assert.strictEqual(result.stage, "complete");
  assert.strictEqual(result.coreResult.throwDecision.status, "unavailable");
  assert.strictEqual(result.resultType, "fielding-error");
});

test("Clean control 會要求 Stage B", () => {
  const result = integration.resolveYouthGrounderFielding(playerFacts(), "secure", rolls());
  assert.strictEqual(result.stage, "fielding");
  assert.strictEqual(result.requiresThrow, true);
  assert.strictEqual(result.controlQuality, "clean");
});

test("Double play 產生兩出局與清空壘包", () => {
  const result = resolve("turn-two");
  assert.strictEqual(result.resultType, "double-play");
  assert.strictEqual(result.mutation.outsAdded, 2);
  assert.deepStrictEqual(result.mutation.runners, [false, false, false]);
  assert.strictEqual(result.mutation.resultFlag, "youth_grounder_double_play");
});

test("Force second 保留打者在一壘", () => {
  const result = resolve("force-lead-runner");
  assert.strictEqual(result.resultType, "force-out-second");
  assert.strictEqual(result.mutation.outsAdded, 1);
  assert.deepStrictEqual(result.mutation.runners, [true, false, false]);
});

test("Secure first 讓原跑者進二壘", () => {
  const result = resolve("secure-first");
  assert.strictEqual(result.resultType, "batter-out-runner-second");
  assert.deepStrictEqual(result.mutation.runners, [false, true, false]);
});

test("Result flag 反映實際結果而不是 secure approach", () => {
  const result = resolve("secure-first", {}, { result: 0.96 });
  assert.strictEqual(result.resultType, "all-safe");
  assert.strictEqual(result.mutation.resultFlag, "youth_grounder_all_safe");
});

test("高中春季 Registry 固定二壘 Base State 與可見 Event Facts", () => {
  const registration = integration.getIntegrationEvent("high_school_year_two_spring_game");
  assert.deepStrictEqual(registration, {
    eventId: "high_school_year_two_spring_game",
    mode: "live",
    gameplayFamily: "offense",
    baseState: "one-out-runner-on-second",
    runnerSpeed: "average",
    pitcherTendency: "outside",
    pitchDifficulty: "normal",
    nextBatterReliability: "medium",
    defenseQuality: "average"
  });
});

test("高中春季 Production input 只傳 Core 所需資料", () => {
  const prepared = integration.createHighSchoolYearTwoSpringInput(offensivePlayerFacts(), "opposite", offensiveRolls());
  assert.strictEqual(prepared.status, "ready");
  assert.deepStrictEqual(prepared.input.situation, {
    baseState: "one-out-runner-on-second",
    scoreState: "tied",
    runnerSpeed: "average",
    pitcherTendency: "outside"
  });
  assert.deepStrictEqual(Object.keys(prepared.input).sort(), ["approach", "defenseQuality", "pitchDifficulty", "player", "rolls", "situation"]);
});

test("Power adapter 直接使用既有 batting，不新增 Player skill", () => {
  const prepared = integration.createHighSchoolYearTwoSpringInput(offensivePlayerFacts({ baseballSkills: { batting: 8 } }), "pull", offensiveRolls());
  assert.strictEqual(prepared.adaptedFacts.powerScore, 8);
  assert.strictEqual(prepared.input.player.power, "high");
});

test("Contact adapter 由 batting、ballSense、discipline 單一衍生", () => {
  const prepared = integration.createHighSchoolYearTwoSpringInput(offensivePlayerFacts({ ballSense: 7, discipline: 6, baseballSkills: { batting: 8 } }), "opposite", offensiveRolls());
  assert.strictEqual(prepared.adaptedFacts.contactScore, 7);
  assert.strictEqual(prepared.input.player.contact, "average");
});

test("Bunt adapter 由 baseballIQ、baseRunning、discipline 單一衍生", () => {
  const prepared = integration.createHighSchoolYearTwoSpringInput(offensivePlayerFacts({ discipline: 6, baseballSkills: { baseballIQ: 9, baseRunning: 6 } }), "sac-bunt", offensiveRolls());
  assert.strictEqual(prepared.adaptedFacts.buntScore, 7);
  assert.strictEqual(prepared.input.player.bunt, "average");
});

test("Offense 與 Defense 共用 Body adapter", () => {
  const prepared = integration.createHighSchoolYearTwoSpringInput(offensivePlayerFacts({ body: { fatigue: 7, pain: 0, injuryRisk: 0 } }), "shorten", offensiveRolls());
  assert.strictEqual(prepared.input.player.body, "fatigued");
});

test("Runner、投手、球難度、下一棒與守備品質均來自 Event Facts", () => {
  const prepared = integration.createHighSchoolYearTwoSpringInput(offensivePlayerFacts(), "opposite", offensiveRolls());
  assert.deepStrictEqual({
    runnerSpeed: prepared.input.situation.runnerSpeed,
    pitcherTendency: prepared.input.situation.pitcherTendency,
    pitchDifficulty: prepared.input.pitchDifficulty,
    nextBatterReliability: prepared.input.player.nextBatterReliability,
    defenseQuality: prepared.input.defenseQuality
  }, {
    runnerSpeed: "average",
    pitcherTendency: "outside",
    pitchDifficulty: "normal",
    nextBatterReliability: "medium",
    defenseQuality: "average"
  });
});

test("高中春季 supplied rolls 產生 deterministic 結果", () => {
  const facts = offensivePlayerFacts();
  const fixed = offensiveRolls();
  assert.deepStrictEqual(
    integration.resolveHighSchoolYearTwoSpringAtBat(facts, "opposite", fixed),
    integration.resolveHighSchoolYearTwoSpringAtBat(facts, "opposite", fixed)
  );
});

test("高中春季 invalid rolls fail closed", () => {
  [-0.1, 1, NaN].forEach(value => {
    const result = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts(), "opposite", offensiveRolls({ execution: value }));
    assert.strictEqual(result.status, "unresolved");
    assert.strictEqual(result.issues[0].code, "rolls");
  });
});

test("高中春季不相容壘況與比分 fail closed", () => {
  const wrongBase = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts({ matchState: { runners: [true, false, false] } }), "opposite", offensiveRolls());
  const wrongScore = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts({ matchState: { homeScore: 2 } }), "opposite", offensiveRolls());
  assert.strictEqual(wrongBase.status, "unresolved");
  assert.strictEqual(wrongScore.status, "unresolved");
});

test("runnersAfter 是正式壘況 mapping 的唯一來源", () => {
  const result = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts(), "opposite", offensiveRolls());
  assert.deepStrictEqual(result.mutation.runners, result.stateDelta.runnersAfter);
});

test("Groundout advance 正確映射出局與三壘跑者", () => {
  const result = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts(), "opposite", offensiveRolls());
  assert.strictEqual(result.mutation.outsAdded, 1);
  assert.strictEqual(result.mutation.runsScored, 0);
  assert.deepStrictEqual(result.mutation.runners, [false, false, true]);
});

test("RBI single 正確映射得分與一壘打者", () => {
  const result = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts(), "opposite", offensiveRolls({ battedBall: 0.01, result: 0.25, runnerAdvance: 0.5 }));
  assert.strictEqual(result.resultType, "single");
  assert.strictEqual(result.mutation.runsScored, 1);
  assert.deepStrictEqual(result.mutation.runners, [true, false, false]);
  assert.strictEqual(result.mutation.resultFlag, "hs_y2_spring_single_rbi");
});

test("XBH RBI 正確映射得分與二壘打者", () => {
  const result = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts(), "pull", offensiveRolls({ execution: 0.01, battedBall: 0.5, defense: 0.01, result: 0.75, runnerAdvance: 0.01 }));
  assert.strictEqual(result.resultType, "extra-base-hit");
  assert.strictEqual(result.mutation.runsScored, 1);
  assert.deepStrictEqual(result.mutation.runners, [false, true, false]);
});

test("觸擊前位跑者出局使用 Actual Result flag", () => {
  const result = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts(), "sac-bunt", offensiveRolls({ result: 0.01 }));
  assert.strictEqual(result.resultType, "lead-runner-out-third");
  assert.strictEqual(result.mutation.resultFlag, "hs_y2_spring_bunt_lead_runner_out");
});

test("觸擊成功推進使用獨立 Actual Result flag", () => {
  const result = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts(), "sac-bunt", offensiveRolls({ result: 0.1 }));
  assert.strictEqual(result.resultType, "batter-out-runner-third");
  assert.strictEqual(result.mutation.resultFlag, "hs_y2_spring_bunt_advance");
});

test("Decision Quality 不取代 machine result", () => {
  const result = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts(), "opposite", offensiveRolls({ execution: 0.01, battedBall: 0.01, defense: 0.01, result: 0.01 }));
  assert.strictEqual(result.coreResult.decision.quality, "excellent");
  assert.strictEqual(result.resultType, "lineout");
  assert.strictEqual(result.mutation.runsScored, 0);
});

test("Offensive Integration 不修改 Core input", () => {
  const prepared = integration.createHighSchoolYearTwoSpringInput(offensivePlayerFacts(), "opposite", offensiveRolls());
  const before = JSON.stringify(prepared.input);
  integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts(), "opposite", offensiveRolls());
  assert.strictEqual(JSON.stringify(prepared.input), before);
});

test("Offensive Integration 不修改 Player input", () => {
  const facts = offensivePlayerFacts();
  const before = JSON.stringify(facts);
  integration.resolveHighSchoolYearTwoSpringAtBat(facts, "opposite", offensiveRolls());
  assert.strictEqual(JSON.stringify(facts), before);
});

test("Approach 與 Actual Result 在 Integration output 中保持分離", () => {
  const result = integration.resolveHighSchoolYearTwoSpringAtBat(offensivePlayerFacts(), "sac-bunt", offensiveRolls({ result: 0.01 }));
  assert.strictEqual(result.coreResult.input.approach, "sac-bunt");
  assert.strictEqual(result.mutation.resultFlag, "hs_y2_spring_bunt_lead_runner_out");
  assert.ok(!result.mutation.resultFlag.includes("success"));
});

test("完整 Double Play Runtime 只推進一次並等待 Continue", () => {
  const game = makeRuntime();
  prepareGrounder(game, rolls());
  game.chooseYouthGrounderFielding("secure");
  assert.strictEqual(vm.runInContext("pendingBaseballGameplay.stage", game), "throw-decision");
  game.chooseYouthGrounderThrow("turn-two");
  assert.strictEqual(vm.runInContext("player.seasonStep", game), 6);
  assert.strictEqual(vm.runInContext("player.matchState.outs", game), 3);
  assert.strictEqual(vm.runInContext("JSON.stringify(player.matchState.runners)", game), "[false,false,false]");
  assert.strictEqual(vm.runInContext("Boolean(pendingYouthSeasonOutcome)", game), true);
  assert.strictEqual(game.chooseYouthGrounderThrow("turn-two"), false);
  assert.strictEqual(vm.runInContext("player.seasonStep", game), 6);
  game.continueYouthSeasonOutcome();
  assert.strictEqual(game.getCurrentEventId(), "youth_match_mistake");
  assert.strictEqual(game.getYouthPreviousPlayEcho().error, false);
});

test("完整 Force Lead Runner Runtime 寫入正確壘況", () => {
  const game = makeRuntime();
  prepareGrounder(game, rolls());
  game.chooseYouthGrounderFielding("secure");
  game.chooseYouthGrounderThrow("force-lead-runner");
  assert.strictEqual(vm.runInContext("player.matchState.outs", game), 2);
  assert.strictEqual(vm.runInContext("JSON.stringify(player.matchState.runners)", game), "[true,false,false]");
  assert.strictEqual(vm.runInContext("player.flags.includes('youth_grounder_force_second') && !player.flags.includes('youth_grounder_throwing_error')", game), true);
});

test("Fielding error Runtime 不顯示 Stage B 且錯誤只計一次", () => {
  const game = makeRuntime();
  prepareGrounder(game, rolls({ fieldingExecution: 0.1, fieldingResult: 0.75 }), "Object.assign(player.baseballSkills, { catching: 0, reaction: 0, range: 0 }); player.body.pain = 3;");
  game.chooseYouthGrounderFielding("attack");
  assert.strictEqual(vm.runInContext("pendingBaseballGameplay", game), null);
  assert.strictEqual(vm.runInContext("player.seasonErrors", game), 1);
  assert.strictEqual(vm.runInContext("player.seasonStep", game), 6);
  assert.strictEqual(vm.runInContext("Boolean(pendingYouthSeasonOutcome)", game), true);
  assert.strictEqual(game.chooseYouthGrounderThrow("secure-first"), false);
  assert.strictEqual(vm.runInContext("player.seasonErrors", game), 1);
  game.continueYouthSeasonOutcome();
  assert.strictEqual(game.getCurrentEventId(), "youth_match_mistake");
  assert.strictEqual(game.getYouthPreviousPlayEcho().error, true);
});

test("Stage A pending 時 Save fail closed，完成後可儲存", () => {
  const game = makeRuntime();
  prepareGrounder(game, rolls());
  game.saveGame();
  assert.strictEqual(game.__storage.has("baseballLifeRpgSave"), true);
  game.__storage.delete("baseballLifeRpgSave");
  game.chooseYouthGrounderFielding("secure");
  game.saveGame();
  assert.strictEqual(game.__storage.has("baseballLifeRpgSave"), false);
  game.chooseYouthGrounderThrow("secure-first");
  game.saveGame();
  assert.strictEqual(game.__storage.has("baseballLifeRpgSave"), true);
  const saved = JSON.parse(game.__storage.get("baseballLifeRpgSave"));
  assert.strictEqual(Object.prototype.hasOwnProperty.call(saved, "pendingBaseballGameplay"), false);
});

test("Gameplay 暫存未污染 Player Schema，SAVE_VERSION 為 15 且 SAVE_KEY 未改變", () => {
  const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
  const saveSource = fs.readFileSync(path.join(root, "save.js"), "utf8");
  assert.ok(/const\s+SAVE_VERSION\s*=\s*15\s*;/.test(playerSource));
  assert.ok(/const\s+SAVE_KEY\s*=\s*["']baseballLifeRpgSave["']\s*;/.test(saveSource));
  assert.ok(!/pendingBaseballGameplay\s*:/.test(playerSource));
});

console.log(`\nGameplay Sprint 5.2 Baseball Gameplay Integration：${passed}/${passed} 通過`);
