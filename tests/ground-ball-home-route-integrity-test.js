const assert = require("assert");
const GroundDefense = require("../batted-ball-ground-defense.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }

const physicalTruth = Object.freeze({
  version: "batted-ball-physical-v1",
  identity: "home-route-ground-ball",
  contactQuality: "solid",
  ballType: "groundBall",
  pace: "firm",
  direction: "rightSide",
  depth: null,
  executionEvidence: { continuousContactScore: 0.65 }
});

function build({ runners = ["r1", null, "r3"], outs = 1, thirdSpeed = 5, thirdReaction = 5, thirdBaseballIQ = 5, thirdState = null, identity = "home-route-opportunity" } = {}) {
  const runnerEntities = runners.map((runnerId, index) => runnerId ? {
    runnerId,
    originBase: index + 1,
    speed: index === 2 ? thirdSpeed : 5,
    reaction: index === 2 ? thirdReaction : 5,
    baseballIQ: index === 2 ? thirdBaseballIQ : 5
  } : null).filter(Boolean);
  const preContactRunnerStates = thirdState && runners[2] ? { [runners[2]]: thirdState } : {};
  return GroundDefense.buildGroundBallDefensiveOpportunity({
    identity,
    physicalTruth,
    runners,
    outs,
    runnerEntities,
    batterRunner: { runnerId: "batter", speed: 5 },
    preContactRunnerStates,
    defenderContext: { playerPosition: "二壘手", reaction: 10, range: 10 }
  });
}

const naturalOpportunity = GroundDefense.buildRunner3BAdvanceOpportunity({
  physicalTruth,
  runner: { runnerId: "r3", originBase: 3 },
  defensiveAccess: { level: "favored" },
  playerPosition: "二壘手",
  outs: 1,
  isForced: false
});
verify("Runner opportunity. 一出局、非受迫三壘跑者取得獨立的 medium advance opportunity", naturalOpportunity.available && naturalOpportunity.movementType === "voluntary" && naturalOpportunity.opportunityLevel === "medium" && naturalOpportunity.authority === "battedBallPhysicalTruth+baseState+outs");

const sameBallOpportunity = GroundDefense.buildRunner3BAdvanceOpportunity({
  physicalTruth: { ...physicalTruth, identity: "same-ball" },
  runner: { runnerId: "runner-b", originBase: 3 },
  defensiveAccess: { level: "favored" },
  playerPosition: "二壘手",
  outs: 1,
  isForced: false
});
const poorReaderDecision = GroundDefense.resolveRunner3BAdvanceDecision(sameBallOpportunity,
  { runnerId: "runner-b", reaction: 3, baseballIQ: 3, speed: 2 }, { identity: "game-pa-ground" });
const strongReaderDecision = GroundDefense.resolveRunner3BAdvanceDecision(sameBallOpportunity,
  { runnerId: "runner-b", reaction: 10, baseballIQ: 10, speed: 9 }, { identity: "game-pa-ground" });
verify("Fixture B/C. 同一顆球的 poor read runner 自主 hold、strong read runner 自主 commit", poorReaderDecision.decision === "holdBase" && strongReaderDecision.decision === "commitAdvance" && poorReaderDecision.deterministicRoll === strongReaderDecision.deterministicRoll);
verify("Deterministic decision. namespace 與 game/PA、runner、physical identity 被保存", strongReaderDecision.rngNamespace === "ground-ball-runner3b-decision-v1" && strongReaderDecision.deterministicIdentity === "game-pa-ground|runner-b|same-ball");
const speedOnlyDecision = GroundDefense.resolveRunner3BAdvanceDecision(sameBallOpportunity,
  { runnerId: "runner-b", reaction: 10, baseballIQ: 10, speed: 2 }, { identity: "game-pa-ground" });
verify("Ability firewall. Speed 不改寫 decision quality", speedOnlyDecision.decision === strongReaderDecision.decision && speedOnlyDecision.commitThreshold === strongReaderDecision.commitThreshold);
const twoOutOpportunity = GroundDefense.buildRunner3BAdvanceOpportunity({
  physicalTruth,
  runner: { runnerId: "r3", originBase: 3 },
  defensiveAccess: { level: "favored" },
  playerPosition: "二壘手",
  outs: 2,
  isForced: false
});
verify("Supported scope. 兩出局情境明確 fallback，不硬編 always-go", !twoOutOpportunity.available && twoOutOpportunity.reason === "twoOutRunnerDecisionDeferred");

const attacking = build({ thirdState: { movementDecision: "commitAdvance", targetBase: "home", advancementProgress: "early" } });
const runner3B = attacking.runnerRealization.existingRunners.find(runner => runner.originBase === 3);
verify("A1. 三壘攻本壘來自 canonical runner physical state", runner3B.runnerId === "r3" && runner3B.targetBase === "home" && runner3B.movementState === "advancing" && !runner3B.isForced);
verify("A2. 一、三壘情境保留一壘 force chain，但三壘跑者不受迫", attacking.forceState.forceAtSecond && !attacking.forceState.forceAtHome && attacking.forceChain.unforcedRunners.some(runner => runner.runnerId === "r3"));
verify("A3. BBP-B1 opportunity 同時公開一壘、二壘與 non-force 本壘 route", ["secureFirstBaseOut", "initiate463", "preventRunHome"].every(route => attacking.availableDecisionIds.includes(route)) && !attacking.availableDecisionIds.includes("homeForceOut"));
verify("A4. Home timing window 保存 evaluated authority 與 canonical taxonomy", attacking.timingWindows.homeOutWindow.evaluated && attacking.timingWindows.homeOutWindow.authority === "runnerPhysicalState+ballAcquisitionTiming" && attacking.timingWindows.homeOutWindow.state === "normal");

const holding = build({ thirdState: { movementDecision: "holdBase", targetBase: "third" } });
verify("C. 三壘跑者 holding 時不虛構本壘威脅", holding.runnerRealization.existingRunners.find(runner => runner.originBase === 3).movementState === "holding" && !holding.timingWindows.homeOutWindow.evaluated && !holding.availableDecisionIds.includes("preventRunHome"));

const natural = build();
const naturalThird = natural.runnerRealization.existingRunners.find(runner => runner.originBase === 3);
verify("Fixture A. 無 preContact injection 時可由自然 runner decision 形成 canonical commit", naturalThird.advanceDecision.authority.includes("runnerAdvanceOpportunity") && naturalThird.movementDecision === "commitAdvance" && natural.availableDecisionIds.includes("preventRunHome"));

const naturalHold = build({ identity: "hold-opportunity-0", thirdSpeed: 2, thirdReaction: 3, thirdBaseballIQ: 3 });
const naturalHoldingThird = naturalHold.runnerRealization.existingRunners.find(runner => runner.originBase === 3);
verify("Fixture B. 自然 poor-read decision 形成 hold，且一壘與二壘 route 保留", naturalHoldingThird.advanceDecision.authority.includes("runnerAdvanceOpportunity") && naturalHoldingThird.movementDecision === "holdBase" && !naturalHold.availableDecisionIds.includes("preventRunHome") && ["secureFirstBaseOut", "initiate463"].every(route => naturalHold.availableDecisionIds.includes(route)));

const naturalExpired = build({ thirdSpeed: 9 });
const naturalExpiredThird = naturalExpired.runnerRealization.existingRunners.find(runner => runner.originBase === 3);
verify("Fixture I. 自然 commit 與防守窗口分離：跑者已啟動但 home route 已 expired", naturalExpiredThird.movementDecision === "commitAdvance" && naturalExpired.timingWindows.homeOutWindow.state === "expired" && !naturalExpired.availableDecisionIds.includes("preventRunHome") && naturalExpired.availableDecisionIds.includes("secureFirstBaseOut"));

const expired = build({ thirdState: { movementDecision: "commitAdvance", targetBase: "home", movementState: "committed", advancementProgress: "late" } });
verify("B. 過晚進度仍保留 home route evaluated 證據，但窗口為 expired", expired.timingWindows.homeOutWindow.evaluated && expired.timingWindows.homeOutWindow.state === "expired" && !expired.availableDecisionIds.includes("preventRunHome"));

const wide = build({ thirdSpeed: 2, thirdState: { movementDecision: "commitAdvance", targetBase: "home", advancementProgress: "early" } });
const narrow = build({ thirdSpeed: 9, thirdState: { movementDecision: "commitAdvance", targetBase: "home", advancementProgress: "early" } });
verify("H1. 慢跑者形成 wide 粗略機會窗口", wide.timingWindows.homeOutWindow.state === "wide" && wide.availableDecisionIds.includes("preventRunHome"));
verify("H2. 快跑者形成 narrow 但仍合法可選的窗口", narrow.timingWindows.homeOutWindow.state === "narrow" && narrow.availableDecisionIds.includes("preventRunHome"));

const loaded = build({ runners: ["r1", "r2", "r3"], thirdState: null });
const loadedThird = loaded.runnerRealization.existingRunners.find(runner => runner.originBase === 3);
verify("F1. 滿壘三壘跑者由 force chain 推進本壘", loaded.forceState.forceAtHome && loadedThird.isForced && loadedThird.targetBase === "home");
verify("F2. 滿壘 route classification 是 homeForceOut，不是 preventRunHome", loaded.availableDecisionIds.includes("homeForceOut") && !loaded.availableDecisionIds.includes("preventRunHome"));

const tagSuccess = GroundDefense.settleGroundBallPhysicalOutcome(attacking, {
  outsCreated: 1,
  runnersAfter: ["batter", "r1", null],
  runnerChanges: [{ runnerId: "r1", from: 1, to: 2 }, { runnerId: "r3", from: 3, to: "out" }, { runnerId: "batter", from: "batter", to: 1 }],
  homeTagLeg: { tagRequired: true, possession: "secured", tagOpportunity: "formed", result: "out" }
});
verify("D. Home tag success 保存觸殺 leg、三壘跑者出局與其他 runner continuation", tagSuccess.homeTagLeg.tagRequired && tagSuccess.homeRunner.result === "out" && tagSuccess.batterRunner.result === "safe" && tagSuccess.leadRunner.result === "safe" && tagSuccess.baseOccupancy.join("|") === "batter|r1|");

const tagFailure = GroundDefense.settleGroundBallPhysicalOutcome(attacking, {
  outsCreated: 0,
  runnersAfter: ["batter", "r1", null],
  runnerChanges: [{ runnerId: "r1", from: 1, to: 2 }, { runnerId: "r3", from: 3, to: "home" }, { runnerId: "batter", from: "batter", to: 1 }],
  homeTagLeg: { tagRequired: true, possession: "secured", tagOpportunity: "formed", result: "safe" }
});
verify("E. Home tag failure 保存 safe/scored，不製造 force out", tagFailure.homeTagLeg.result === "safe" && tagFailure.homeRunner.result === "scored" && tagFailure.outsAdded === 0);
verify("Fixture D. downstream safe/out 都不回寫 upstream commitAdvance", attacking.runnerRealization.existingRunners.find(runner => runner.originBase === 3).movementDecision === "commitAdvance" && tagSuccess.homeRunner.result !== tagFailure.homeRunner.result);
verify("Settlement firewall. Physical outcome 延後 official scoring", tagSuccess.officialScoring === "deferred" && tagFailure.officialScoring === "deferred");
verify("BBP-A firewall. Home route evaluation 不回寫 physical ball truth", Object.isFrozen(attacking.physicalTruth) && attacking.physicalTruth.identity === physicalTruth.identity && !Object.hasOwn(attacking.physicalTruth, "outcome"));

console.log(`Ground Ball Home Route Integrity tests: ${passed}/${passed} passed`);
