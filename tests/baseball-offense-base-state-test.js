const assert = require("assert");
const offense = require("../baseball-offense-prototype.js");

let passed = 0;
function test(title, assertion) {
  assertion();
  passed += 1;
  console.log(`✓ ${title}`);
}

function input(baseState = "one-out-runner-on-second", overrides = {}) {
  const value = {
    situation: { baseState, scoreState: "tied", runnerSpeed: "average", pitcherTendency: "outside" },
    player: { power: "average", contact: "high", bunt: "average", body: "normal", nextBatterReliability: "high" },
    approach: "opposite",
    pitchDifficulty: "normal",
    defenseQuality: "average",
    rolls: { execution: 0.5, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 }
  };
  const copy = JSON.parse(JSON.stringify(value));
  Object.entries(overrides).forEach(([key, nested]) => {
    if (nested && typeof nested === "object" && !Array.isArray(nested) && copy[key]) Object.assign(copy[key], nested);
    else copy[key] = nested;
  });
  return copy;
}

function findProfile(baseInput, profile, resultType) {
  for (let ball = 0; ball < 100; ball += 1) {
    for (let resultRoll = 0; resultRoll < 100; resultRoll += 1) {
      const candidate = JSON.parse(JSON.stringify(baseInput));
      candidate.rolls.battedBall = ball / 100;
      candidate.rolls.result = resultRoll / 100;
      const resolved = offense.resolveAtBat(candidate);
      if (resolved.battedBall?.profile === profile && (!resultType || resolved.result.resultType === resultType)) return resolved;
    }
  }
  return null;
}

function withRunnerRoll(resolved, runnerAdvance) {
  const replay = JSON.parse(JSON.stringify(resolved.input));
  replay.rolls.runnerAdvance = runnerAdvance;
  return offense.resolveAtBat(replay);
}

function sum(distribution) {
  return Object.values(distribution).reduce((total, value) => total + value, 0);
}

function isDeepFrozen(value) {
  return !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(isDeepFrozen));
}

test("支援的 Base State 精確為一出局一壘與一出局二壘", () => {
  assert.deepStrictEqual(offense.getSupportedBaseStates(), ["one-out-runner-on-first", "one-out-runner-on-second"]);
});

test("缺少或未知 Base State 會 fail closed", () => {
  const missing = input();
  delete missing.situation.baseState;
  assert.strictEqual(offense.resolveAtBat(missing).issues[0].code, "base-state");
  assert.strictEqual(offense.resolveAtBat(input("runner-on-third")).issues[0].code, "base-state");
});

test("一壘 Base State machine snapshot 正確", () => {
  const result = offense.resolveAtBat(input("one-out-runner-on-first"));
  assert.deepStrictEqual(result.baseState.runners, [true, false, false]);
  assert.strictEqual(result.baseState.outs, 1);
});

test("二壘 Base State machine snapshot 正確", () => {
  const result = offense.resolveAtBat(input());
  assert.deepStrictEqual(result.baseState.runners, [false, true, false]);
  assert.strictEqual(result.baseState.outs, 1);
});

test("二壘有人時推打取得獨立 Base State 決策權重", () => {
  const first = offense.evaluateDecision(input("one-out-runner-on-first", { approach: "opposite" }));
  const second = offense.evaluateDecision(input("one-out-runner-on-second", { approach: "opposite" }));
  assert.strictEqual(first.modifiers.baseState, 0);
  assert.strictEqual(second.modifiers.baseState, 1);
  assert.strictEqual(second.rawScore - first.rawScore, 1);
});

test("二壘有人慢跑者拉打不沿用一壘雙殺風險扣分", () => {
  const first = offense.evaluateDecision(input("one-out-runner-on-first", { situation: { runnerSpeed: "slow" }, approach: "pull" }));
  const second = offense.evaluateDecision(input("one-out-runner-on-second", { situation: { runnerSpeed: "slow" }, approach: "pull" }));
  assert.strictEqual(first.modifiers.runnerSpeed, -1);
  assert.strictEqual(second.modifiers.runnerSpeed, 0);
});

test("十二組 Base State／跑速／策略決策差異符合契約", () => {
  const expectedDeltas = {
    slow: { pull: 1, opposite: 1, shorten: 0, "sac-bunt": 1 },
    average: { pull: 0, opposite: 1, shorten: 0, "sac-bunt": 0 },
    fast: { pull: 0, opposite: 1, shorten: 0, "sac-bunt": 0 }
  };
  Object.entries(expectedDeltas).forEach(([speed, approaches]) => {
    Object.entries(approaches).forEach(([approach, expected]) => {
      const first = offense.evaluateDecision(input("one-out-runner-on-first", { situation: { runnerSpeed: speed }, approach }));
      const second = offense.evaluateDecision(input("one-out-runner-on-second", { situation: { runnerSpeed: speed }, approach }));
      assert.strictEqual(second.rawScore - first.rawScore, expected, `${speed}/${approach}`);
    });
  });
});

const groundout = findProfile(input(), "ground-ball", "groundout");
test("二壘跑者在拉打滾地出局可停留二壘", () => {
  const result = withRunnerRoll(findProfile(input("one-out-runner-on-second", { situation: { runnerSpeed: "average" }, approach: "pull" }), "ground-ball", "groundout"), 0.9);
  assert.strictEqual(result.result.stateDelta.runnerFromSecondBase, 2);
});

test("二壘跑者在推打滾地出局可推進三壘", () => {
  const result = withRunnerRoll(groundout, 0.2);
  assert.strictEqual(result.result.stateDelta.runnerFromSecondBase, 3);
});

const single = findProfile(input(), "ground-ball", "single");
test("二壘跑者安打後可停在三壘", () => {
  const result = withRunnerRoll(single, 0.2);
  assert.strictEqual(result.result.stateDelta.runnerFromSecondBase, 3);
  assert.strictEqual(result.result.stateDelta.runsScored, 0);
});

test("二壘跑者安打後可得分", () => {
  const result = withRunnerRoll(single, 0.8);
  assert.strictEqual(result.result.stateDelta.runnerFromSecondBase, 4);
  assert.strictEqual(result.result.stateDelta.runsScored, 1);
});

const infieldHit = findProfile(input(), "weak-grounder", "infield-hit");
test("二壘跑者遇內野安打時留在二壘且打者上一壘", () => {
  assert.deepStrictEqual(infieldHit.result.stateDelta.runnersAfter, [true, true, false]);
});

const extraBaseHit = findProfile(input(), "line-drive", "extra-base-hit");
test("二壘跑者遇長打必定得分且打者到二壘", () => {
  assert.strictEqual(extraBaseHit.result.stateDelta.runsScored, 1);
  assert.strictEqual(extraBaseHit.result.stateDelta.batterBase, 2);
  assert.deepStrictEqual(extraBaseHit.result.stateDelta.runnersAfter, [false, true, false]);
});

test("三振與飛球出局不會讓二壘跑者擅自推進", () => {
  const strikeout = offense.resolveAtBat(input("one-out-runner-on-second", {
    situation: { scoreState: "behind-2-plus", runnerSpeed: "slow" },
    player: { power: "low", body: "minor-injury" },
    approach: "pull",
    pitchDifficulty: "difficult",
    rolls: { execution: 0.1 }
  }));
  const flyout = findProfile(input(), "fly-ball", "flyout");
  assert.strictEqual(strikeout.result.stateDelta.runnerFromSecondBase, 2);
  assert.strictEqual(flyout.result.stateDelta.runnerFromSecondBase, 2);
});

const error = findProfile(input(), "weak-pop-up", "fielding-error");
test("二壘跑者遇守備失誤推進三壘且打者上一壘", () => {
  assert.deepStrictEqual(error.result.stateDelta.runnersAfter, [true, false, true]);
});

test("二壘觸擊可形成前位跑者在三壘出局", () => {
  const result = offense.resolveAtBat(input("one-out-runner-on-second", { approach: "sac-bunt", rolls: { result: 0 } }));
  assert.strictEqual(result.result.resultType, "lead-runner-out-third");
  assert.deepStrictEqual(result.result.stateDelta.runnersAfter, [true, false, false]);
});

test("二壘觸擊可讓打者出局並推進跑者到三壘", () => {
  const result = offense.resolveAtBat(input("one-out-runner-on-second", { approach: "sac-bunt", rolls: { result: 0.5 } }));
  assert.strictEqual(result.result.resultType, "batter-out-runner-third");
  assert.deepStrictEqual(result.result.stateDelta.runnersAfter, [false, false, true]);
});

test("二壘普通滾地球結果不含雙殺或野選", () => {
  ["ground-ball", "weak-grounder"].forEach(profile => {
    const result = findProfile(input(), profile);
    assert.ok(!Object.keys(result.result.distribution).some(key => ["double-play", "fielders-choice"].includes(key)));
  });
});

test("所有新增 Base State 分布總和為 100", () => {
  const samples = [groundout, single, infieldHit, extraBaseHit, error, offense.resolveAtBat(input("one-out-runner-on-second", { approach: "sac-bunt" }))];
  samples.forEach(result => {
    if (result.battedBall) assert.ok(Math.abs(sum(result.battedBall.distribution) - 100) < 1e-9);
    assert.ok(Math.abs(sum(result.result.distribution) - 100) < 1e-9);
  });
});

test("二壘 Base State 在相同 input 與 rolls 下 deterministic", () => {
  const value = input();
  assert.deepStrictEqual(offense.resolveAtBat(value), offense.resolveAtBat(value));
});

test("Base State Resolver 不修改輸入", () => {
  const value = input();
  const before = JSON.stringify(value);
  offense.resolveAtBat(value);
  assert.strictEqual(JSON.stringify(value), before);
});

test("Supported Base States 與 resolved output 均 deep frozen", () => {
  assert.ok(isDeepFrozen(offense.getSupportedBaseStates()));
  assert.ok(isDeepFrozen(offense.resolveAtBat(input())));
});

test("runnersAfter 是跨 Base State 的通用壘況真相", () => {
  [groundout, single, infieldHit, extraBaseHit, error].forEach(result => {
    assert.ok(Array.isArray(result.result.stateDelta.runnersAfter));
    assert.strictEqual(result.result.stateDelta.runnersAfter.length, 3);
  });
});

test("跑者來源相容 alias 只在對應 Base State 有值", () => {
  const first = offense.resolveAtBat(input("one-out-runner-on-first"));
  const second = offense.resolveAtBat(input("one-out-runner-on-second"));
  assert.strictEqual(first.result.stateDelta.runnerFromSecondBase, null);
  assert.strictEqual(typeof first.result.stateDelta.runnerFromFirstBase, "number");
  assert.strictEqual(second.result.stateDelta.runnerFromFirstBase, null);
  assert.strictEqual(typeof second.result.stateDelta.runnerFromSecondBase, "number");
});

console.log(`\nGameplay Sprint 5.3 Offensive Base State：${passed}/${passed} 通過`);
