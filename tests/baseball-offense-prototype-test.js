const assert = require("assert");
const offense = require("../baseball-offense-prototype.js");

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function base(overrides = {}) {
  const input = {
    situation: { scoreState: "tied", runnerSpeed: "average", pitcherTendency: "inside" },
    player: { power: "average", contact: "average", bunt: "average", body: "normal", nextBatterReliability: "medium" },
    approach: "opposite",
    pitchDifficulty: "normal",
    defenseQuality: "average",
    rolls: { execution: 0.5, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 }
  };
  const result = JSON.parse(JSON.stringify(input));
  Object.entries(overrides).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object") Object.assign(result[key], value);
    else result[key] = value;
  });
  return result;
}

function sum(distribution) {
  return Object.values(distribution).reduce((total, value) => total + value, 0);
}

function frozen(value) {
  return !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(frozen));
}

verify("四個 approach 使用精確 machine IDs", JSON.stringify(offense.APPROACH_IDS) === JSON.stringify(["pull", "opposite", "shorten", "sac-bunt"]));

const matrix = [
  [base({ situation: { scoreState: "behind-2-plus", runnerSpeed: "average", pitcherTendency: "inside" }, approach: "pull" }), "excellent"],
  [base({ situation: { scoreState: "behind-2-plus", runnerSpeed: "average", pitcherTendency: "inside" }, approach: "sac-bunt" }), "bad"],
  [base({ situation: { scoreState: "behind-1", runnerSpeed: "average", pitcherTendency: "outside" }, approach: "opposite" }), "excellent"],
  [base({ situation: { scoreState: "tied", runnerSpeed: "average", pitcherTendency: "inside" }, approach: "sac-bunt" }), "neutral"],
  [base({ situation: { scoreState: "ahead", runnerSpeed: "average", pitcherTendency: "inside" }, approach: "shorten" }), "good"],
  [base({ situation: { scoreState: "behind-1", runnerSpeed: "slow", pitcherTendency: "outside" }, approach: "pull" }), "bad"],
  [base({ situation: { scoreState: "behind-1", runnerSpeed: "fast", pitcherTendency: "inside" }, approach: "opposite" }), "good"],
  [base({ situation: { scoreState: "tied", runnerSpeed: "average", pitcherTendency: "outside" }, approach: "opposite" }), "excellent"],
  [base({ situation: { scoreState: "behind-1", runnerSpeed: "average", pitcherTendency: "inside" }, approach: "opposite" }), "neutral"],
  [base({ situation: { scoreState: "behind-1", runnerSpeed: "average", pitcherTendency: "breaking" }, approach: "shorten" }), "excellent"],
  [base({ situation: { scoreState: "behind-2-plus", runnerSpeed: "average", pitcherTendency: "fatigued" }, approach: "pull" }), "excellent"],
  [base({ situation: { scoreState: "behind-1", runnerSpeed: "average", pitcherTendency: "outside" }, player: { body: "minor-injury", nextBatterReliability: "high" }, approach: "pull" }), "bad"]
];
verify("Decision Quality 12-case representative matrix", matrix.every(([input, quality]) => offense.resolveAtBat(input).decision.quality === quality));

const rawHigh = base({ situation: { scoreState: "behind-1", runnerSpeed: "fast", pitcherTendency: "outside" }, player: { contact: "high", nextBatterReliability: "high" }, approach: "opposite" });
const rawLow = base({ situation: { scoreState: "tied", runnerSpeed: "average", pitcherTendency: "outside" }, player: { contact: "high", nextBatterReliability: "medium" }, approach: "opposite" });
const highResolved = offense.resolveAtBat(rawHigh);
const lowResolved = offense.resolveAtBat(rawLow);
verify("raw Decision Score 不直接進 Execution", highResolved.decision.rawScore !== lowResolved.decision.rawScore && highResolved.decision.quality === "excellent" && lowResolved.decision.quality === "excellent" && highResolved.execution.score === lowResolved.execution.score);

const qualityModifiers = { excellent: 1, good: 0, neutral: 0, poor: -1, bad: -1 };
verify("五級 Decision Quality 只使用有限 Execution modifier", Object.entries(qualityModifiers).every(([quality, expected]) => {
  const result = offense.resolveExecution(base(), { quality });
  return result.components.decisionQuality === expected;
}));

const barrel = offense.resolveAtBat(base({ situation: { scoreState: "tied", runnerSpeed: "fast", pitcherTendency: "outside" }, player: { contact: "high", nextBatterReliability: "high" }, approach: "opposite", pitchDifficulty: "easy", rolls: { execution: 0.9, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 } }));
verify("Barreled threshold >= 3", barrel.execution.score >= 3 && barrel.execution.tier === "barreled-contact");

const gated = offense.resolveAtBat(base({ situation: { scoreState: "tied", runnerSpeed: "fast", pitcherTendency: "outside" }, player: { contact: "average", nextBatterReliability: "high" }, approach: "opposite", pitchDifficulty: "easy", rolls: { execution: 0.9, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 } }));
verify("Barreled 具有 Relevant Skill gate", gated.execution.score >= 3 && gated.execution.tier === "solid-contact");

const shorten = offense.resolveAtBat(base({ situation: { scoreState: "ahead", runnerSpeed: "average", pitcherTendency: "breaking" }, player: { contact: "elite", nextBatterReliability: "high" }, approach: "shorten", pitchDifficulty: "easy", rolls: { execution: 0.9, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 } }));
verify("握短棒 Execution ceiling 為 solid-contact", shorten.execution.score >= 3 && shorten.execution.tier === "solid-contact");

const miss = offense.resolveAtBat(base({ situation: { scoreState: "behind-2-plus", runnerSpeed: "slow", pitcherTendency: "outside" }, player: { power: "low", body: "minor-injury", nextBatterReliability: "high" }, approach: "pull", pitchDifficulty: "difficult", rolls: { execution: 0.1, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 } }));
verify("miss 抽象為整個打席 strikeout", miss.execution.tier === "miss" && miss.result.resultType === "strikeout" && miss.result.stateDelta.outsAdded === 1);

const bunt = offense.resolveAtBat(base({ situation: { scoreState: "tied", runnerSpeed: "fast", pitcherTendency: "inside" }, player: { bunt: "high", nextBatterReliability: "high" }, approach: "sac-bunt", pitchDifficulty: "easy", rolls: { execution: 0.9, battedBall: 0.5, defense: 0.5, result: 0.9, runnerAdvance: 0.5 } }));
verify("犧牲觸擊使用獨立 Execution 與 Result family", bunt.execution.tier.endsWith("bunt") && bunt.battedBall === null && ["lead-runner-out", "batter-out-runner-second", "all-safe", "bunt-single"].includes(bunt.result.resultType));

const distributions = [barrel.battedBall.distribution, barrel.result.distribution, bunt.result.distribution];
verify("所有抽樣 distributions 總和為 100", distributions.every(distribution => Math.abs(sum(distribution) - 100) < 1e-9));

verify("非法 enum fail closed", offense.resolveAtBat(base({ approach: "guess" })).status === "unresolved");
verify("非法 roll fail closed", offense.resolveAtBat(base({ rolls: { execution: 1, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 } })).status === "unresolved");

const deterministicInput = base();
verify("相同 input 與 rolls 產生 deterministic 結果", JSON.stringify(offense.resolveAtBat(deterministicInput)) === JSON.stringify(offense.resolveAtBat(deterministicInput)));
const before = JSON.stringify(deterministicInput);
offense.resolveAtBat(deterministicInput);
verify("Resolver 不修改 input 或 nested values", JSON.stringify(deterministicInput) === before);
verify("Resolved 與 nested result 均 deep frozen", frozen(offense.resolveAtBat(deterministicInput)));

function findResult(input, wanted) {
  for (let index = 0; index < 100; index += 1) {
    input.rolls.result = index / 100;
    const result = offense.resolveAtBat(input);
    if (result.result.resultType === wanted) return result;
  }
  return null;
}

const averageSingle = findResult(base({ situation: { scoreState: "tied", runnerSpeed: "average", pitcherTendency: "outside" }, player: { contact: "high" }, approach: "opposite", rolls: { execution: 0.5, battedBall: 0.5, defense: 0.1, result: 0, runnerAdvance: 0.8 } }), "single");
verify("普通安打依跑者速度與 runnerAdvance 推進", averageSingle && averageSingle.result.stateDelta.runnerFromFirstBase === 3);

const extraBase = findResult(base({ situation: { scoreState: "tied", runnerSpeed: "fast", pitcherTendency: "outside" }, player: { contact: "elite", nextBatterReliability: "high" }, approach: "opposite", pitchDifficulty: "easy", defenseQuality: "weak", rolls: { execution: 0.9, battedBall: 0.2, defense: 0.1, result: 0, runnerAdvance: 0.8 } }), "extra-base-hit");
verify("長打可讓快速跑者得分並留下二壘打者", extraBase && extraBase.result.stateDelta.batterBase === 2 && extraBase.result.stateDelta.runnerFromFirstBase === 4 && extraBase.result.stateDelta.runsScored === 1);

const defenseMapping = [
  ["weak-pop-up", "strong", 0.9, "defense-advantage"],
  ["line-drive", "weak", 0.1, "offense-advantage"],
  ["ground-ball", "average", 0.5, "contested"]
].every(([profile, quality, roll, expected]) => offense.resolveDefense({ defenseQuality: quality, rolls: { defense: roll } }, { profile }).tier === expected);
verify("Defense Interaction tier mapping 正確", defenseMapping);

const goodDecisionBadResult = offense.resolveAtBat(base({ situation: { scoreState: "tied", runnerSpeed: "fast", pitcherTendency: "outside" }, player: { contact: "low", nextBatterReliability: "high" }, approach: "opposite", pitchDifficulty: "difficult", rolls: { execution: 0.1, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 } }));
verify("高品質決策仍可能得到壞結果", goodDecisionBadResult.decision.quality === "excellent" && goodDecisionBadResult.result.resultType === "strikeout");

const poorDecisionGoodResult = offense.resolveAtBat(base({ situation: { scoreState: "behind-1", runnerSpeed: "slow", pitcherTendency: "outside" }, player: { power: "elite", nextBatterReliability: "high" }, approach: "pull", pitchDifficulty: "easy", defenseQuality: "weak", rolls: { execution: 0.9, battedBall: 0.5, defense: 0.1, result: 0.99, runnerAdvance: 0.8 } }));
verify("差決策仍可由能力與 execution roll 形成好結果", ["poor", "bad"].includes(poorDecisionGoodResult.decision.quality) && ["solid-contact", "barreled-contact"].includes(poorDecisionGoodResult.execution.tier) && ["single", "extra-base-hit"].includes(poorDecisionGoodResult.result.resultType));

console.log(`\nGameplay Sprint 5.1 Offensive Prototype：${passed}/${passed} 通過`);
