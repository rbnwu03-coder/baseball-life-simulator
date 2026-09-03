const assert = require("assert");
const LineDriveDefense = require("../batted-ball-line-drive-defense.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }
const truth = (direction = "rightSide", depth = "shallow", pace = "hard") => Object.freeze({
  version: "batted-ball-physical-v1",
  identity: `bbp-b2a-${direction}-${depth}-${pace}`,
  contactQuality: "solid",
  ballType: "lineDrive",
  pace,
  direction,
  depth,
  executionEvidence: { continuousContactScore: 0.64 }
});
const build = ({ direction = "rightSide", depth = "shallow", pace = "hard", movementState = "stationary" } = {}) =>
  LineDriveDefense.buildCatchOpportunity({
    identity: `bbp-b2a-opportunity-${direction}-${depth}-${movementState}`,
    physicalTruth: truth(direction, depth, pace),
    runners: ["runner-1", null, null],
    outs: 0,
    runnerEntities: [{ runnerId: "runner-1", originBase: 1, speed: 8, reaction: 7, baseballIQ: 9 }],
    preContactRunnerStates: { "runner-1": { movementState } },
    defenderContext: { playerPosition: "二壘手", catching: 10, reaction: 10, range: 10 }
  });

const opportunity = build();
verify("A1. BBP-A lineDrive truth 建立不含 outcome 的 airborne context", opportunity.airborneContext.sourceAuthority === "BattedBallPhysicalTruth" && opportunity.airborneContext.physicalIdentity === opportunity.physicalTruth.identity && !Object.hasOwn(opportunity.airborneContext, "caught") && !Object.hasOwn(opportunity.airborneContext, "hit") && !Object.hasOwn(opportunity.airborneContext, "out"));
verify("A2. 一壘 stationary runner 在接球結果前建立 freeze-biased read", opportunity.runnerInitialReadStates[0].readAction === "freezeRead" && opportunity.runnerInitialReadStates[0].movementState === "holding" && opportunity.runnerInitialReadStates[0].finalBaseOutcome === "unresolved");
verify("A3. shallow right-side 2B 使用 canonical access 與 catch window", opportunity.supported && ["favored", "possible", "poor"].includes(opportunity.defensiveAccess.level) && ["wide", "normal", "narrow"].includes(opportunity.catchWindow.state));
verify("A4. Catch Opportunity 與 Catch Result 分離", opportunity.catchResult === null && !Object.hasOwn(opportunity.defensiveAccess, "result"));

const caught = LineDriveDefense.resolveCatchExecution(opportunity, { catching: 10, reaction: 10, range: 10 }, { executionRoll: 0 });
verify("B1. Catch success 只形成 caught 與 batter-runner out", caught.result === "caught" && caught.batterRunner.result === "out" && caught.officialScoring === "deferred");
verify("B2. stationary runner 有合法 retouch requirement，但不產生假 double-off", caught.retouchRequirements[0].required && caught.retouchRequirements[0].targetBase === "first" && caught.retouchRequirements[0].satisfiedAtCatch && caught.retouchRequirements[0].runnerOut === false);

const notCaught = LineDriveDefense.resolveCatchExecution(opportunity, { catching: 10, reaction: 10, range: 10 }, { executionRoll: 0.999 });
verify("C1. Catch failure 保持 ball live 與 batter-runner active", notCaught.result === "notCaught" && notCaught.ballState === "liveAfterGroundContact" && notCaught.batterRunner.result === "active");
verify("C2. Catch failure 不自動宣告 hit 或 safe1B", notCaught.liveBallContinuation.required && notCaught.liveBallContinuation.ballRemainsLive && notCaught.liveBallContinuation.automaticHit === false && notCaught.liveBallContinuation.batterAutomaticallySafe === false);

const left = build({ direction: "leftSide" });
verify("D. Left-side firewall 不把球吸給玩家二壘手", !left.supported && !left.defensiveAccess.supported && left.defensiveAccess.reason === "leftSideNoPlayerBallMagnet");
const medium = build({ depth: "medium" });
const deep = build({ depth: "deep" });
verify("E. Medium/deep lineDrive 保留 truth 並進 fallback", !medium.supported && !deep.supported && medium.physicalTruth.depth === "medium" && deep.physicalTruth.depth === "deep" && medium.fallbackAuthority === "existingLegacyOutcomeAdapter");

const advancing = build({ movementState: "advancing" });
verify("F1. 同一顆球的 pre-contact movement 只改 runner read，不改 catch context", JSON.stringify(opportunity.physicalTruth) === JSON.stringify(advancing.physicalTruth) && JSON.stringify(opportunity.airborneContext) === JSON.stringify(advancing.airborneContext) && opportunity.runnerInitialReadStates[0].readAction !== advancing.runnerInitialReadStates[0].readAction);
verify("F2. advancing runner 先 brake/retreat，不瞬間 reset 到原壘", advancing.runnerInitialReadStates[0].readAction === "brakeAndRetreat" && advancing.runnerInitialReadStates[0].movementState === "retreating" && advancing.runnerInitialReadStates[0].finalBaseOutcome === "unresolved");

const advanceCaught = LineDriveDefense.resolveCatchExecution(advancing, { catching: 10, reaction: 10, range: 10 }, { executionRoll: 0 });
const advanceMissed = LineDriveDefense.resolveCatchExecution(advancing, { catching: 10, reaction: 10, range: 10 }, { executionRoll: 0.999 });
const caughtState = LineDriveDefense.applyCatchResult(advancing, advanceCaught);
const missedState = LineDriveDefense.applyCatchResult(advancing, advanceMissed);
verify("G. 相同 pre-contact setup 的 initial runner read 不受未來 catch result 改寫", JSON.stringify(caughtState.runnerInitialReadStates) === JSON.stringify(missedState.runnerInitialReadStates) && advanceCaught.result !== advanceMissed.result);
verify("H. 離壘跑者接殺後需回一壘，但不自動出局", advanceCaught.retouchRequirements[0].targetBase === "first" && !advanceCaught.retouchRequirements[0].satisfiedAtCatch && advanceCaught.retouchRequirements[0].runnerOut === false);
verify("RNG. Catch execution 使用獨立 deterministic namespace 且未呼叫 Math.random", caught.executionEvidence.rngNamespace === "line-drive-catch-execution-v1" && LineDriveDefense.resolveCatchExecution(opportunity, { catching: 10, reaction: 10, range: 10 }).result === LineDriveDefense.resolveCatchExecution(opportunity, { catching: 10, reaction: 10, range: 10 }).result);
verify("Firewall. Catch result 不回寫 BBP-A physical truth", JSON.stringify(opportunity.physicalTruth) === JSON.stringify(truth()) && Object.isFrozen(opportunity.physicalTruth));

console.log(`BBP-B2A Line Drive Read & Catch tests: ${passed}/${passed} passed`);
