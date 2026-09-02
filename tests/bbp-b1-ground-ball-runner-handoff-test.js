const assert = require("assert");
const GroundDefense = require("../batted-ball-ground-defense.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }
const truth = (pace = "firm", direction = "rightSide", contactQuality = "solid") => Object.freeze({
  version: "batted-ball-physical-v1", identity: "bbp-b1-ball", contactQuality,
  ballType: "groundBall", pace, direction, depth: null,
  executionEvidence: { continuousContactScore: 0.64 }
});
const build = ({ leadSpeed = 5, batterSpeed = 5, pace = "firm", direction = "rightSide", contactQuality = "solid" } = {}) =>
  GroundDefense.buildGroundBallDefensiveOpportunity({
    identity: "bbp-b1-opportunity", physicalTruth: truth(pace, direction, contactQuality),
    runners: ["lead", null, null], outs: 0,
    runnerEntities: [{ runnerId: "lead", originBase: 1, speed: leadSpeed }],
    batterRunner: { runnerId: "batter", speed: batterSpeed },
    defenderContext: { playerPosition: "二壘手", reaction: 10, range: 10 }
  });
const rank = state => ({ expired: 0, narrow: 1, normal: 2, wide: 3 }[state]);

const basic = build();
verify("A1. 一壘受迫跑者建立往二壘的 canonical physical movement", basic.runnerRealization.existingRunners[0].originBase === 1 && basic.runnerRealization.existingRunners[0].targetBase === "second" && basic.runnerRealization.existingRunners[0].movementState === "advancing");
verify("A2. 打者跑者先建立而不預判一壘 safe/out", basic.runnerRealization.batterRunner.originBase === "batter" && basic.runnerRealization.batterRunner.targetBase === "first" && basic.runnerRealization.batterRunner.movementState === "advancing" && !Object.hasOwn(basic.runnerRealization.batterRunner, "result"));
verify("A3. Force state 只由 canonical initial live-ball force chain 投影", basic.forceState.forceAtSecond && basic.forceState.doublePlayEligible && basic.forceState.authority === "initialLiveBallForceChainProjection");
verify("A4. 2B right-side access 可用但不預判接球或出局", basic.supported && ["favored", "possible", "poor"].includes(basic.defensiveAccess.level) && !Object.hasOwn(basic.defensiveAccess, "result"));
verify("A5. 兩個第一層出局目標皆存在，沒有把雙殺當 atomic outcome", basic.availableDecisionIds.join("|") === "secureFirstBaseOut|initiate463");
verify("A6. Lead force 與 batter first-base timing windows 分離", basic.timingWindows.leadRunnerForceWindow.targetBase === "second" && basic.timingWindows.batterRunnerFirstBaseWindow.targetBase === "first");

const slowLead = build({ leadSpeed: 2 });
const fastLead = build({ leadSpeed: 9 });
verify("B/C. 只改 lead speed 會改窄 force window，不改 physical ball", rank(slowLead.timingWindows.leadRunnerForceWindow.state) > rank(fastLead.timingWindows.leadRunnerForceWindow.state) && JSON.stringify(slowLead.physicalTruth) === JSON.stringify(fastLead.physicalTruth));
verify("C. Fast lead 不會改寫 force legality", fastLead.forceState.forceAtSecond && fastLead.runnerRealization.existingRunners[0].movementState === "advancing");

const slowBatter = build({ batterSpeed: 2 });
const fastBatter = build({ batterSpeed: 9 });
verify("D/E. 只改 batter speed 會縮短 relay window，不取消第一腿 force", rank(slowBatter.timingWindows.relayToFirstWindow.state) > rank(fastBatter.timingWindows.relayToFirstWindow.state) && slowBatter.forceState.forceAtSecond === fastBatter.forceState.forceAtSecond);
verify("D/E. 同一 physical ball 維持不變", JSON.stringify(slowBatter.physicalTruth) === JSON.stringify(fastBatter.physicalTruth));

const weak = build({ pace: "weak" });
const hard = build({ pace: "hard" });
verify("F. Weak ground ball 表示前壓與 acquisition delay，不等於 easy outcome", weak.ballContext.chargeRequirement === "high" && weak.ballContext.acquisitionProfile === "chargeDelayed" && !Object.hasOwn(weak, "physicalOutcome"));
verify("G. Hard ground ball 表示 reaction pressure 與較早進區，不等於 hit/error", hard.ballContext.reactionPressure === "high" && hard.ballContext.acquisitionProfile === "earlyArrivalReactionPressure" && !Object.hasOwn(hard, "physicalOutcome"));

const left = build({ direction: "leftSide" });
verify("H. Left-side firewall 不把球吸給玩家二壘手", !left.supported && left.defensiveAccess.reason === "leftSideNoPlayerBallMagnet" && left.availableDecisionIds.length === 0);

const forceOnly = GroundDefense.deriveForceState({ runners: [null, "second-only", null], outs: 0 });
verify("I. 二壘單獨有人不會反推出三壘 force", !forceOnly.forceAtSecond && !forceOnly.forceAtThird);

const hardOut = GroundDefense.settleGroundBallPhysicalOutcome(hard, {
  outsCreated: 1, runnersAfter: [null, "lead", null],
  runnerChanges: [{ runnerId: "lead", from: 1, to: 2 }, { runnerId: "batter", from: "batter", to: "out" }],
  primaryCause: "balancedExecution", responsibleActor: "player"
});
const weakSafe = GroundDefense.settleGroundBallPhysicalOutcome(weak, {
  outsCreated: 0, runnersAfter: ["batter", "lead", null],
  runnerChanges: [{ runnerId: "lead", from: 1, to: 2 }, { runnerId: "batter", from: "batter", to: 1 }],
  primaryCause: "timingWindow", responsibleActor: "timingWindow"
});
verify("J. Outcome firewall：hard 可成 out、weak 可成 safe", hardOut.batterRunner.result === "out" && weakSafe.batterRunner.result === "safe");
verify("J. Physical outcome 延後 official scoring", hardOut.officialScoring === "deferred" && weakSafe.officialScoring === "deferred");
verify("PA boundary. PA-compatible result 只由 physical outcome 往下游投影", GroundDefense.derivePACompatibilityResult(hardOut).result === "out" && GroundDefense.derivePACompatibilityResult(weakSafe).result === "single");

verify("Shared truth. BBP-B1 沒有建立第二套 runner/timing primitive", basic.runnerRealization.runnerPhysicalStates.length === 2 && ["wide", "normal", "narrow", "expired"].includes(basic.timingWindows.leadRunnerForceWindow.state));
verify("BBP-A firewall. Handoff 不回寫 canonical physical truth", Object.isFrozen(basic.physicalTruth) && basic.physicalTruth.ballType === "groundBall" && basic.physicalTruth.direction === "rightSide");

const chained = GroundDefense.buildGroundBallDefensiveOpportunity({
  identity: "bbp-b1-chained", physicalTruth: truth(), runners: ["r1", "r2", null], outs: 0,
  runnerEntities: [{ runnerId: "r1", originBase: 1, speed: 5 }, { runnerId: "r2", originBase: 2, speed: 5 }],
  batterRunner: { runnerId: "batter", speed: 5 }, defenderContext: { playerPosition: "二壘手", reaction: 10, range: 10 }
});
verify("Force integration. BBP-B1 在決策前建立 original2B → 3B forced movement", chained.runnerRealization.existingRunners.find(item => item.runnerId === "r2").targetBase === "third" && chained.runnerRealization.existingRunners.find(item => item.runnerId === "r2").isForced && chained.forceChain.forcedRunners.length === 2);

console.log(`BBP-B1 Ground Ball Runner Handoff tests: ${passed}/${passed} passed`);
