const assert = require("assert");
const FlyBallDefense = require("../batted-ball-fly-ball-defense.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }
const truth = (depth = "deep", direction = "rightSide", pace = "firm") => Object.freeze({
  version: "batted-ball-physical-v1", identity: `bbp-b2b1-${depth}-${direction}-${pace}`,
  contactQuality: "solid", ballType: "flyBall", pace, direction, depth,
  executionEvidence: { continuousContactScore: 0.64 }
});
const defender = Object.freeze({ defenderId: "rf-1", name: "右外野手", position: "右外野手", catching: 10, reaction: 10, range: 10 });
const build = ({ runners = [null, null, "runner-3"], outs = 1, movementState = "stationary", touchingOriginBase, depth = "deep", direction = "rightSide", identity = "bbp-b2b1-opportunity" } = {}) => {
  const originBase = runners.findIndex(Boolean) + 1;
  const runnerId = runners[originBase - 1];
  const prior = { movementState };
  if (typeof touchingOriginBase === "boolean") prior.touchingOriginBase = touchingOriginBase;
  return FlyBallDefense.buildFlyBallCatchOpportunity({
    identity, physicalTruth: truth(depth, direction), runners, outs,
    runnerEntities: runnerId ? [{ runnerId, originBase, speed: 7, reaction: 8, baseballIQ: 9 }] : [],
    preContactRunnerStates: runnerId ? { [runnerId]: prior } : {}, defenderContext: defender
  });
};
const settle = (opportunity, executionRoll) => {
  const catchResult = FlyBallDefense.resolveFlyBallCatchExecution(opportunity, { executionRoll });
  return { catchResult, state: FlyBallDefense.applyFlyBallCatchResult(opportunity, catchResult) };
};

const thirdBase = build();
verify("A1. FlyBall 建立 outcome-free Airborne Context 與 Catch Opportunity", thirdBase.airborneContext.ballType === "flyBall" && thirdBase.airborneContext.sourceAuthority === "BattedBallPhysicalTruth" && thirdBase.catchResult === null && !Object.hasOwn(thirdBase.airborneContext, "caught") && !Object.hasOwn(thirdBase.airborneContext, "out"));
verify("A2. 3B／1 out／deep fly 在 catch 前只形成 prepareToTag", thirdBase.runnerInitialReadStates[0].readAction === "prepareToTag" && thirdBase.runnerInitialReadStates[0].finalMovementDecision === "unresolved" && !Object.hasOwn(thirdBase.runnerInitialReadStates[0], "advancementLegal"));
verify("A3. Existing RF context 建立 canonical access 與 timing window", thirdBase.supported && ["favored", "possible", "poor"].includes(thirdBase.defensiveAccess.level) && ["wide", "normal", "narrow"].includes(thirdBase.catchWindow.state));

const caughtThird = settle(thirdBase, 0);
const caughtThirdRunner = caughtThird.state.postCatchRunnerStates[0];
verify("A4. Catch success 先形成 batter out 與 outsAfterCatch=2", caughtThird.catchResult.result === "caught" && caughtThird.catchResult.batterRunner.result === "out" && caughtThird.state.outsAfterCatch === 2);
verify("A5. Touching 3B 的 runner retouch satisfied 且 legal target=Home", !caughtThirdRunner.retouchState.retouchRequired && caughtThirdRunner.retouchState.retouchSatisfied && caughtThirdRunner.tagUpLegality.advancementLegal && caughtThirdRunner.tagUpLegality.targetBase === "home");
verify("A6. Tag-up legal 仍沒有 advance decision、score 或 sacrifice fly", caughtThirdRunner.finalMovementDecision === "unresolved" && caughtThird.state.pendingTagUpHandoff.decisionMade === false && !Object.hasOwn(caughtThird.state, "runScored") && !Object.hasOwn(caughtThird.state, "sacrificeFly"));

const thirdOut = settle(build({ outs: 2 }), 0).state;
verify("B. 2 outs catch 先到三出局，tag-up 不可 actionable", thirdOut.outsAfterCatch === 3 && thirdOut.pendingTagUpHandoff.status === "notApplicable" && thirdOut.postCatchRunnerStates[0].tagUpLegality.reason === "thirdOutCatch" && !thirdOut.postCatchRunnerStates[0].tagUpLegality.advancementLegal);

const offFirst = settle(build({ runners: ["runner-1", null, null], outs: 0, movementState: "advancing", touchingOriginBase: false }), 0).state.postCatchRunnerStates[0];
verify("C. Runner1B off base 接殺後 retouch required／unsatisfied，但不自動出局", offFirst.readState.readAction === "retreatToRetouch" && offFirst.retouchState.retouchRequired && !offFirst.retouchState.retouchSatisfied && offFirst.tagUpLegality.reason === "retouchNotSatisfied" && !Object.hasOwn(offFirst, "runnerOut"));

const holdingFirst = settle(build({ runners: ["runner-1", null, null], outs: 0 }), 0).state.postCatchRunnerStates[0];
verify("D. Runner1B touching first 可合法往二壘，但沒有自動 advance 或 recommendation", holdingFirst.retouchState.retouchSatisfied && holdingFirst.tagUpLegality.advancementLegal && holdingFirst.tagUpLegality.targetBase === "second" && holdingFirst.finalMovementDecision === "unresolved" && !Object.hasOwn(holdingFirst.tagUpLegality, "recommendation"));

const missed = settle(thirdBase, 0.999).state;
verify("E. Catch failure 保持 live ball，沒有 tag-up、automatic hit 或 batter out", missed.catchResult.result === "notCaught" && missed.liveBallContinuation.ballRemainsLive && missed.postCatchRunnerStates[0].tagUpLegality.reason === "ballNotCaught" && !missed.postCatchRunnerStates[0].tagUpLegality.advancementLegal && missed.catchResult.liveBallContinuation.automaticHit === false && missed.catchResult.batterRunner.result === "active");

const touchingOpportunity = build({ identity: "same-ball-same-catch" });
const movingOpportunity = build({ identity: "same-ball-same-catch", movementState: "advancing", touchingOriginBase: false });
const touchingResult = settle(touchingOpportunity, undefined).state;
const movingResult = settle(movingOpportunity, undefined).state;
verify("F. Same ball／identity 產生相同 catch result，但 runner state 決定 retouch 與 legality", JSON.stringify(touchingOpportunity.physicalTruth) === JSON.stringify(movingOpportunity.physicalTruth) && touchingResult.catchResult.result === movingResult.catchResult.result && touchingResult.postCatchRunnerStates[0].retouchState.retouchSatisfied !== movingResult.postCatchRunnerStates[0].retouchState.retouchSatisfied && touchingResult.postCatchRunnerStates[0].tagUpLegality.advancementLegal !== movingResult.postCatchRunnerStates[0].tagUpLegality.advancementLegal);
verify("G. Deep fly catch 即使 legal home tag 也不生成 sacrifice fly", thirdBase.physicalTruth.depth === "deep" && caughtThirdRunner.tagUpLegality.advancementLegal && !Object.hasOwn(caughtThird.state, "sacrificeFly"));

const sameReadCaught = settle(thirdBase, 0).state;
const sameReadMissed = settle(thirdBase, 0.999).state;
verify("H. Runner initial read 不受未來 caught／notCaught 改寫", JSON.stringify(sameReadCaught.runnerInitialReadStates) === JSON.stringify(sameReadMissed.runnerInitialReadStates) && sameReadCaught.catchResult.result !== sameReadMissed.catchResult.result);
verify("Timing. Tag-up 明確使用 catch-confirmation proxy，未假造 first-touch timestamp", caughtThirdRunner.tagUpLegality.timingAbstraction === "catchConfirmationProxyForFirstTouch" && !Object.hasOwn(caughtThirdRunner.tagUpLegality, "firstTouchTimestamp"));
verify("RNG. Fly catch 使用獨立 deterministic namespace", caughtThird.catchResult.executionEvidence.rngNamespace === "fly-ball-catch-execution-v1" && FlyBallDefense.resolveFlyBallCatchExecution(thirdBase).result === FlyBallDefense.resolveFlyBallCatchExecution(thirdBase).result);

const left = build({ direction: "leftSide" });
const shallow = build({ depth: "shallow" });
verify("Fallback. Left-side 與 shallow fly 不建立本次 supported catch opportunity", !left.supported && !shallow.supported && left.fallbackAuthority === "existingLegacyOutcomeAdapter" && shallow.fallbackAuthority === "existingLegacyOutcomeAdapter");
verify("Firewall. BBP-A truth 未被 catch／runner legality 回寫", JSON.stringify(thirdBase.physicalTruth) === JSON.stringify(truth()) && Object.isFrozen(thirdBase.physicalTruth));

console.log(`BBP-B2B1 Fly Ball Tag-Up Legality tests: ${passed}/${passed} passed`);
