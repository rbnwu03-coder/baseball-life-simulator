const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
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

let passed = 0;
function test(title, assertion) {
  assertion();
  passed += 1;
  console.log(`✓ ${title}`);
}

function makeRuntime() {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    body: { classList: { toggle() {} } },
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
  context.__nodes = nodes;
  context.__storage = storage;
  return context;
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function defaultRolls(overrides = {}) {
  return Object.assign({ execution: 0.01, battedBall: 0.01, defense: 0.01, result: 0.01, runnerAdvance: 0.01 }, overrides);
}

function prepareSpring(context, rolls, options = {}) {
  const highSkills = options.highSkills !== false;
  evaluate(context, `
    player = createInitialPlayer("進攻整合測試球員");
    Object.assign(player, {
      chapter: "青棒第二年",
      age: 17,
      highSchoolYearTwoStep: 2,
      seasonPosition: "內野手",
      ballSense: ${highSkills ? 10 : 0},
      discipline: ${highSkills ? 10 : 0},
      seasonPerformance: 0
    });
    Object.assign(player.baseballSkills, {
      batting: ${highSkills ? 10 : 0},
      baseballIQ: ${highSkills ? 10 : 0},
      baseRunning: ${highSkills ? 10 : 0}
    });
    Object.assign(player.body, { fatigue: 0, pain: 0, injuryRisk: 0 });
    pendingYouthSeasonOutcome = null;
    pendingBaseballGameplay = null;
    isTransitioning = false;
    showCurrentEvent();
    createOffensiveGameplayRolls = () => Object.freeze(${JSON.stringify(rolls)});
  `);
}

function playSpring(approach, rolls, options = {}) {
  const context = makeRuntime();
  prepareSpring(context, rolls, options);
  assert.strictEqual(context.chooseHighSchoolSpringApproach(approach), true);
  return context;
}

function state(context) {
  return JSON.parse(evaluate(context, `JSON.stringify({
    step: player.highSchoolYearTwoStep,
    outs: player.matchState.outs,
    runners: player.matchState.runners,
    awayScore: player.matchState.awayScore,
    homeScore: player.matchState.homeScore,
    seasonPerformance: player.seasonPerformance,
    flags: player.flags,
    memories: player.memories,
    pendingGameplay: pendingBaseballGameplay,
    pendingOutcome: pendingYouthSeasonOutcome
  })`));
}

test("正式事件顯示四種 approach 且不顯示固定結果", () => {
  const game = makeRuntime();
  prepareSpring(game, defaultRolls());
  const event = evaluate(game, "getEvent('high_school_year_two_spring_game')");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(event.choices.map(choice => choice.gameplayApproach))), ["pull", "opposite", "shorten", "sac-bunt"]);
  assert.ok(event.choices.every(choice => !choice.matchEffects && !choice.careerEffects && !choice.memory));
  const html = game.__nodes.get("choices").innerHTML;
  assert.strictEqual((html.match(/chooseHighSchoolSpringApproach/g) || []).length, 4);
});

test("點擊後先建立 resolving pending 與 click lock", () => {
  const game = makeRuntime();
  prepareSpring(game, defaultRolls());
  const original = evaluate(game, "BaseballGameplayIntegration");
  game.BaseballGameplayIntegration = Object.assign({}, original, {
    resolveHighSchoolYearTwoSpringAtBat(playerState, approach, rolls) {
      game.__lockObserved = evaluate(game, "isTransitioning && pendingBaseballGameplay.stage === 'resolving-at-bat'");
      return original.resolveHighSchoolYearTwoSpringAtBat(playerState, approach, rolls);
    }
  });
  assert.strictEqual(game.chooseHighSchoolSpringApproach("pull"), true);
  assert.strictEqual(game.__lockObserved, true);
});

test("一次點擊只 resolve 一次", () => {
  const game = makeRuntime();
  prepareSpring(game, defaultRolls());
  const original = evaluate(game, "BaseballGameplayIntegration");
  let calls = 0;
  game.BaseballGameplayIntegration = Object.assign({}, original, {
    resolveHighSchoolYearTwoSpringAtBat(...args) {
      calls += 1;
      return original.resolveHighSchoolYearTwoSpringAtBat(...args);
    }
  });
  game.chooseHighSchoolSpringApproach("pull");
  game.chooseHighSchoolSpringApproach("opposite");
  assert.strictEqual(calls, 1);
});

test("三振增加一個出局且跑者留二壘", () => {
  const game = playSpring("pull", defaultRolls(), { highSkills: false });
  const result = state(game);
  assert.strictEqual(result.outs, 2);
  assert.deepStrictEqual(result.runners, [false, true, false]);
  assert.ok(result.flags.includes("hs_y2_spring_strikeout"));
});

test("滾地出局可讓跑者留在二壘", () => {
  const game = playSpring("pull", defaultRolls({ runnerAdvance: 0.5 }));
  const result = state(game);
  assert.strictEqual(result.outs, 2);
  assert.deepStrictEqual(result.runners, [false, true, false]);
  assert.ok(result.flags.includes("hs_y2_spring_groundout_hold"));
});

test("滾地出局可讓跑者推進三壘", () => {
  const game = playSpring("opposite", defaultRolls({ battedBall: 0.5 }));
  const result = state(game);
  assert.strictEqual(result.outs, 2);
  assert.deepStrictEqual(result.runners, [false, false, true]);
  assert.ok(result.flags.includes("hs_y2_spring_groundout_advance"));
});

test("安打可讓跑者停在三壘", () => {
  const game = playSpring("opposite", defaultRolls({ result: 0.25 }));
  const result = state(game);
  assert.deepStrictEqual(result.runners, [true, false, true]);
  assert.strictEqual(result.homeScore, 1);
  assert.ok(result.flags.includes("hs_y2_spring_single_runner_third"));
});

test("一壘安打可送回二壘跑者", () => {
  const game = playSpring("opposite", defaultRolls({ result: 0.25, runnerAdvance: 0.5 }));
  const result = state(game);
  assert.deepStrictEqual(result.runners, [true, false, false]);
  assert.strictEqual(result.homeScore, 2);
  assert.ok(result.flags.includes("hs_y2_spring_single_rbi"));
  assert.ok(game.__nodes.get("story").innerHTML.includes("高中球隊"));
  assert.ok(game.__nodes.get("story").innerHTML.includes("<strong>2</strong> 高中球隊"));
});

test("長打送回跑者並讓打者站上二壘", () => {
  const game = playSpring("pull", defaultRolls({ battedBall: 0.5, result: 0.75 }));
  const result = state(game);
  assert.deepStrictEqual(result.runners, [false, true, false]);
  assert.strictEqual(result.homeScore, 2);
  assert.ok(result.flags.includes("hs_y2_spring_extra_base_rbi"));
});

test("內野安打保留二壘跑者並讓打者上一壘", () => {
  const game = playSpring("pull", defaultRolls({ battedBall: 0.9, result: 0.75 }));
  const result = state(game);
  assert.deepStrictEqual(result.runners, [true, true, false]);
  assert.ok(result.flags.includes("hs_y2_spring_infield_hit"));
});

test("守備失誤讓打者上一壘、跑者進三壘", () => {
  const game = playSpring("pull", defaultRolls({ battedBall: 0.99, result: 0.9 }));
  const result = state(game);
  assert.deepStrictEqual(result.runners, [true, false, true]);
  assert.ok(result.flags.includes("hs_y2_spring_fielding_error"));
});

test("觸擊可形成前位跑者在三壘出局", () => {
  const game = playSpring("sac-bunt", defaultRolls({ result: 0.01 }));
  const result = state(game);
  assert.deepStrictEqual(result.runners, [true, false, false]);
  assert.strictEqual(result.outs, 2);
  assert.ok(result.flags.includes("hs_y2_spring_bunt_lead_runner_out"));
});

test("觸擊可用一個出局推進跑者", () => {
  const game = playSpring("sac-bunt", defaultRolls({ result: 0.1 }));
  const result = state(game);
  assert.deepStrictEqual(result.runners, [false, false, true]);
  assert.strictEqual(result.outs, 2);
  assert.ok(result.flags.includes("hs_y2_spring_bunt_advance"));
});

test("觸擊可形成全部安全上壘", () => {
  const game = playSpring("sac-bunt", defaultRolls({ result: 0.9 }));
  const result = state(game);
  assert.deepStrictEqual(result.runners, [true, false, true]);
  assert.strictEqual(result.outs, 1);
  assert.ok(result.flags.includes("hs_y2_spring_bunt_all_safe"));
});

test("優秀決策仍接受平飛球出局", () => {
  const game = playSpring("opposite", defaultRolls());
  const result = state(game);
  assert.ok(result.flags.includes("hs_y2_spring_lineout"));
  assert.strictEqual(result.homeScore, 1);
  assert.ok(!game.__nodes.get("story").innerHTML.includes("Excellent"));
});

test("較差決策仍接受 machine 產生的安打", () => {
  const game = playSpring("pull", defaultRolls({ execution: 0.9, battedBall: 0.75, result: 0.5 }), { highSkills: false });
  const result = state(game);
  assert.ok(result.flags.includes("hs_y2_spring_single_runner_third"));
  assert.deepStrictEqual(result.runners, [true, false, true]);
});

test("stateDelta、技能與進度各只套用一次", () => {
  const game = playSpring("opposite", defaultRolls({ battedBall: 0.5 }));
  const once = state(game);
  game.chooseHighSchoolSpringApproach("opposite");
  const twice = state(game);
  assert.deepStrictEqual(twice, once);
  assert.strictEqual(once.step, 3);
  assert.strictEqual(evaluate(game, "player.baseballSkills.batting"), 11);
  assert.strictEqual(evaluate(game, "player.baseballSkills.baseballIQ"), 11);
});

test("Approach flag 與 Actual Result flag 分離且各只一份", () => {
  const game = playSpring("sac-bunt", defaultRolls({ result: 0.01 }));
  const flags = state(game).flags;
  assert.strictEqual(flags.filter(flag => flag === "hs_y2_spring_sac_bunt").length, 1);
  assert.strictEqual(flags.filter(flag => flag === "hs_y2_spring_bunt_lead_runner_out").length, 1);
  assert.ok(!flags.includes("hs_y2_spring_bunt_advance"));
});

test("Result 進入 Outcome Hold，不立即顯示下一事件", () => {
  const game = playSpring("opposite", defaultRolls({ battedBall: 0.5 }));
  assert.strictEqual(Boolean(state(game).pendingOutcome), true);
  assert.ok(game.__nodes.get("story").innerHTML.includes("春季聯賽打席結果"));
  assert.ok(game.__nodes.get("story").innerHTML.includes("二壘跑者"));
});

test("Continue 回到原本高二下一事件", () => {
  const game = playSpring("opposite", defaultRolls({ battedBall: 0.5 }));
  game.continueYouthSeasonOutcome();
  assert.strictEqual(game.getCurrentEventId(), "high_school_year_two_depth_chart");
  assert.strictEqual(state(game).pendingOutcome, null);
});

test("Gameplay unresolved 時 zero mutation 且不推進", () => {
  const game = makeRuntime();
  prepareSpring(game, defaultRolls());
  const original = evaluate(game, "BaseballGameplayIntegration");
  const before = state(game);
  game.BaseballGameplayIntegration = Object.assign({}, original, {
    resolveHighSchoolYearTwoSpringAtBat() { return { status: "unresolved", issues: [{ code: "test" }] }; }
  });
  assert.strictEqual(game.chooseHighSchoolSpringApproach("pull"), false);
  const after = state(game);
  assert.deepStrictEqual({ step: after.step, outs: after.outs, runners: after.runners, homeScore: after.homeScore, flags: after.flags }, {
    step: before.step, outs: before.outs, runners: before.runners, homeScore: before.homeScore, flags: before.flags
  });
});

test("Stale snapshot 在 commit 前 fail closed", () => {
  const game = makeRuntime();
  prepareSpring(game, defaultRolls({ battedBall: 0.5 }));
  const integration = evaluate(game, "BaseballGameplayIntegration");
  const result = integration.resolveHighSchoolYearTwoSpringAtBat(evaluate(game, "player"), "opposite", defaultRolls({ battedBall: 0.5 }));
  evaluate(game, `pendingBaseballGameplay = {
    eventId: "high_school_year_two_spring_game", gameplayFamily: "offense", stage: "resolving-at-bat",
    approach: "opposite", rolls: ${JSON.stringify(defaultRolls({ battedBall: 0.5 }))}, resolvedPlay: null,
    playerSnapshotKey: BaseballGameplayIntegration.getHighSchoolYearTwoSpringSnapshotKey(player)
  }; player.discipline += 1;`);
  const before = state(game);
  assert.strictEqual(game.completeIntegratedHighSchoolSpringAtBat(result, "opposite"), false);
  const after = state(game);
  assert.strictEqual(after.step, before.step);
  assert.strictEqual(after.homeScore, before.homeScore);
  assert.deepStrictEqual(after.runners, before.runners);
});

test("pending 打席禁止 Save，完成後允許 Save", () => {
  const game = makeRuntime();
  prepareSpring(game, defaultRolls({ battedBall: 0.5 }));
  const original = evaluate(game, "BaseballGameplayIntegration");
  game.BaseballGameplayIntegration = Object.assign({}, original, {
    resolveHighSchoolYearTwoSpringAtBat(...args) {
      game.saveGame();
      game.__pendingSaveBlocked = !game.__storage.has("baseballLifeRpgSave");
      return original.resolveHighSchoolYearTwoSpringAtBat(...args);
    }
  });
  game.chooseHighSchoolSpringApproach("opposite");
  assert.strictEqual(game.__pendingSaveBlocked, true);
  game.saveGame();
  assert.strictEqual(game.__storage.has("baseballLifeRpgSave"), true);
  const saved = JSON.parse(game.__storage.get("baseballLifeRpgSave"));
  assert.strictEqual(Object.prototype.hasOwnProperty.call(saved, "pendingBaseballGameplay"), false);
});

test("完成後 Save／Load 保留比分、壘況、進度與旗標", () => {
  const game = playSpring("opposite", defaultRolls({ result: 0.25, runnerAdvance: 0.5 }));
  game.saveGame();
  evaluate(game, "player = createInitialPlayer('覆蓋'); pendingBaseballGameplay = { eventId: 'test' };");
  game.loadGame();
  const loaded = state(game);
  assert.strictEqual(loaded.step, 3);
  assert.strictEqual(loaded.homeScore, 2);
  assert.deepStrictEqual(loaded.runners, [true, false, false]);
  assert.ok(loaded.flags.includes("hs_y2_spring_single_rbi"));
  assert.strictEqual(loaded.pendingGameplay, null);
});

test("既有 Defense Stage A／B 流程不受影響", () => {
  const game = makeRuntime();
  evaluate(game, `
    player = createInitialPlayer("守備回歸球員");
    Object.assign(player, { chapter: "少棒第一季", seasonStep: 5, seasonPosition: "內野手" });
    Object.assign(player.baseballSkills, { catching: 10, reaction: 10, range: 10, throwing: 10 });
    showCurrentEvent();
    createGameplayRolls = () => Object.freeze({ fieldingExecution: 0.5, fieldingResult: 0.5, throwExecution: 0.5, result: 0.01 });
  `);
  assert.strictEqual(game.chooseYouthGrounderFielding("secure"), true);
  assert.strictEqual(evaluate(game, "pendingBaseballGameplay.stage"), "throw-decision");
  assert.strictEqual(game.chooseYouthGrounderThrow("turn-two"), true);
  assert.strictEqual(evaluate(game, "player.seasonStep"), 6);
});

test("正式 UI 不顯示隱藏 Decision grade、roll 或 distribution", () => {
  const game = playSpring("opposite", defaultRolls());
  const html = game.__nodes.get("story").innerHTML;
  ["Excellent", "Poor", "Raw Score", "distribution", "runnerAdvance", "0.01"].forEach(fragment => {
    assert.ok(!html.includes(fragment));
  });
});

test("進攻暫存未污染 Player Schema，SAVE_VERSION 為 15 且 SAVE_KEY 未改變", () => {
  const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
  const saveSource = fs.readFileSync(path.join(root, "save.js"), "utf8");
  assert.ok(/const\s+SAVE_VERSION\s*=\s*15\s*;/.test(playerSource));
  assert.ok(/const\s+SAVE_KEY\s*=\s*["']baseballLifeRpgSave["']\s*;/.test(saveSource));
  assert.ok(!/pendingAtBat\s*:|currentApproach\s*:|offensiveDecisionQuality\s*:/.test(playerSource));
});

console.log(`\nGameplay Sprint 5.4 Offensive Production Integration：${passed}/${passed} 通過`);
