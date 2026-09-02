const assert = require("assert");
const Handoff = require("../offensive-bunt-defensive-handoff.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }
const truth = (overrides = {}) => ({ contactResult: "fairContact", fairBallType: "groundBunt", pace: "controlled", placement: "thirdBaseSide", preparationState: "set", ...overrides });
const create = (overrides = {}) => Handoff.createHandoff({
  identity: overrides.identity || "b2-runner",
  physicalTruth: overrides.physicalTruth || truth(),
  existingRunners: overrides.existingRunners || [{ runnerId: "r1", originBase: 1, speed: 5, reaction: 7 }],
  batterRunner: overrides.batterRunner || { runnerId: "b1", speed: 5 },
  forceState: overrides.forceState || { forceAtSecond: true },
  priorRunnerCommitment: overrides.priorRunnerCommitment || "conditionalAdvance",
  defenderContext: overrides.defenderContext || { playerPosition: "二壘手" }
});

const controlled = create();
verify("1. Runner Reassessment 有正式 authority", controlled.runnerReassessment.authority === "physicalBallAndRunnerReassessment");
verify("2. 原一壘跑者與打者跑者是兩個 actor", controlled.runnerPhysicalStates.length === 2 && controlled.runnerPhysicalStates[0].runnerId !== controlled.runnerPhysicalStates[1].runnerId);
verify("3. fair ground bunt 的強迫跑者 commitAdvance", controlled.runnerPhysicalStates[0].movementDecision === "commitAdvance");
verify("4. 原一壘跑者實體目標為二壘", controlled.runnerPhysicalStates[0].originBase === 1 && controlled.runnerPhysicalStates[0].targetBase === "second");
verify("5. 打者跑者由 batter 前進一壘", controlled.runnerPhysicalStates[1].originBase === "batter" && controlled.runnerPhysicalStates[1].targetBase === "first");
verify("6. movement decision 與 start quality 分離", controlled.runnerPhysicalStates.every(state => state.movementDecision && state.startQuality));
verify("7. conditionalAdvance 只改善 prepared start，不直接宣告 safe", controlled.runnerPhysicalStates[0].startQuality === "preparedStart" && !Object.hasOwn(controlled.runnerPhysicalStates[0], "safe"));
verify("8. canonical projection 寫入既有 runnerMovementProgress", Handoff.projectCanonicalRunnerMovement(controlled.runnerReassessment).runnerMovementProgress[0] === "advancing");
verify("9. canonical projection 寫入既有 runnerTargets", Handoff.projectCanonicalRunnerMovement(controlled.runnerReassessment).runnerTargets[0] === "second");

const noForce = create({ existingRunners: [{ runnerId: "r2", originBase: 2, speed: 5, reaction: 7 }], forceState: {} });
verify("10. 二壘單獨有人時 prior commitment 不會直接生成自願推進", noForce.runnerPhysicalStates[0].movementDecision === "holdBase" && noForce.runnerPhysicalStates[0].movementState === "holding" && noForce.runnerPhysicalStates[0].isForced === false);
const hold = create({ physicalTruth: { contactResult: null, fairBallType: null }, forceState: { forceAtSecond: true } });
verify("11. Hold／未擊成界內球沒有實體推進", hold.runnerReassessment.status === "noPhysicalAdvance" && hold.runnerPhysicalStates.every(state => state.movementState === "holding"));
const foul = create({ physicalTruth: { contactResult: "foulContact", fairBallType: null }, forceState: { forceAtSecond: true } });
verify("12. Foul dead-ball reset 沒有持續推進", foul.runnerReassessment.status === "noPhysicalAdvance" && foul.runnerPhysicalStates[0].movementState === "holding");
const miss = create({ physicalTruth: { contactResult: "miss", fairBallType: null }, forceState: { forceAtSecond: true } });
verify("13. Miss 沒有實體推進", miss.runnerPhysicalStates[0].movementState === "holding");
const pop = create({ physicalTruth: truth({ fairBallType: "popBunt", pace: null, placement: null }) });
verify("14. Pop bunt 跑者重估為 retreat", pop.runnerPhysicalStates[0].movementDecision === "retreat" && pop.runnerPhysicalStates[0].movementState === "retreating");
verify("15. Pop bunt 不自動宣告出局或雙殺", pop.runnerReassessment.downstreamSupport === "unsupportedPopBuntDefense" && !Object.hasOwn(pop, "outsCreated"));

const slow = create({ identity: "slow", physicalTruth: truth({ pace: "hard", placement: "secondBaseSide" }), existingRunners: [{ runnerId: "r1", originBase: 1, speed: 2, reaction: 7 }], batterRunner: { runnerId: "b1", speed: 2 } });
const fast = create({ identity: "fast", physicalTruth: truth({ pace: "hard", placement: "secondBaseSide" }), existingRunners: [{ runnerId: "r1", originBase: 1, speed: 2, reaction: 7 }], batterRunner: { runnerId: "b1", speed: 9 } });
verify("16. Speed 只落在 arrival timing profile", slow.runnerPhysicalStates[1].timingProfile !== fast.runnerPhysicalStates[1].timingProfile);
verify("17. Speed 不直接產生 safe probability", [...slow.runnerPhysicalStates, ...fast.runnerPhysicalStates].every(state => !Object.hasOwn(state, "safeProbability") && !Object.hasOwn(state, "outProbability")));
verify("18. slow batter 的 relay window 保持 open equivalent", slow.timingWindows.relayToFirstWindow.state === "normal");
verify("19. fast batter 可關閉 relay window", fast.timingWindows.relayToFirstWindow.state === "expired");
verify("20. 相同 input 完全 deterministic", JSON.stringify(create({ identity: "repeat" })) === JSON.stringify(create({ identity: "repeat" })));
verify("21. normalizeHandoff JSON round-trip 保留 physical state", JSON.stringify(Handoff.normalizeHandoff(JSON.parse(JSON.stringify(slow)))) === JSON.stringify(slow));
verify("22. Runner resolver 不使用 tactical targetRunnerId", !JSON.stringify(controlled).includes("targetRunnerId"));

console.log(`Offensive Tactical Action Sprint B2 Runner Realization tests: ${passed}/${passed} passed`);
