const assert = require("assert");
const BBP = require("../batted-ball-physical.js");
const Plate = require("../offensive-plate-approach.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }
const base = {
  actualPitch: { pitchLocationClass: "competitiveStrike", attackability: 0.76 },
  recognition: { correct: true, perceivedPitchClass: "competitiveStrike" },
  action: "swing", contact: true, swingIntent: "normal", bats: "R",
  abilities: { batting: 12, power: 10 }
};
const truth = (identity, rolls, overrides = {}) => BBP.resolveBattedBallPhysicalTruth({ ...base, ...overrides, identity, rolls });

verify("1. canonical version 正式存在", BBP.VERSION === "batted-ball-physical-v1");
verify("2. 五個 physical RNG namespace 彼此分離", new Set(Object.values(BBP.RNG_NAMESPACES)).size === 5);
verify("3. Contact Quality taxonomy 完整", JSON.stringify(BBP.CONTACT_QUALITIES) === JSON.stringify(["poor", "usable", "solid", "barreled"]));
verify("4. Ball Type taxonomy 完整", JSON.stringify(BBP.BALL_TYPES) === JSON.stringify(["groundBall", "lineDrive", "flyBall"]));
verify("5. Pace taxonomy 完整", JSON.stringify(BBP.PACES) === JSON.stringify(["weak", "moderate", "firm", "hard"]));
verify("6. Direction 是 field-relative taxonomy", JSON.stringify(BBP.DIRECTIONS) === JSON.stringify(["leftSide", "middle", "rightSide"]));
verify("7. Depth taxonomy 完整", JSON.stringify(BBP.DEPTHS) === JSON.stringify(["shallow", "medium", "deep"]));

const fixtureA = truth("A", { contactQuality: .3, ballType: .1, pace: .4, direction: .9 });
verify("8. Fixture A：solid groundBall firm rightSide depth null", fixtureA.contactQuality === "solid" && fixtureA.ballType === "groundBall" && fixtureA.pace === "firm" && fixtureA.direction === "rightSide" && fixtureA.depth === null);
verify("9. Ground Ball 不消耗 depth RNG", fixtureA.executionEvidence.depthRollConsumed === false && fixtureA.executionEvidence.rolls.depth === null);
const fixtureB = truth("B", { contactQuality: .4, ballType: .1, pace: .1, direction: .5 }, { abilities: { batting: 1, power: 1 }, actualPitch: { pitchLocationClass: "clearBall", attackability: .08 }, recognition: { correct: false } });
verify("10. Fixture B：poor groundBall weak middle", fixtureB.contactQuality === "poor" && fixtureB.ballType === "groundBall" && fixtureB.pace === "weak" && fixtureB.direction === "middle");
verify("11. Fixture B physical truth 不含 automatic out", !Object.hasOwn(fixtureB, "isOut") && !Object.hasOwn(fixtureB, "result"));
const fixtureC = truth("C", { contactQuality: .3, ballType: .5, pace: .8, direction: .1, depth: .1 }, { abilities: { batting: 12, power: 20 } });
verify("12. Fixture C：solid lineDrive hard leftSide medium", fixtureC.contactQuality === "solid" && fixtureC.ballType === "lineDrive" && fixtureC.pace === "hard" && fixtureC.direction === "leftSide" && fixtureC.depth === "medium");
verify("13. Fixture C physical truth 不含 automatic hit", !Object.hasOwn(fixtureC, "isHit") && !Object.hasOwn(fixtureC, "hitType"));
const fixtureD = truth("D", { contactQuality: .5, ballType: .9, pace: 0, direction: .9, depth: .9 }, { abilities: { batting: 8, power: 15 }, actualPitch: { pitchLocationClass: "edgeStrike", attackability: .48 } });
verify("14. Fixture D：usable flyBall moderate rightSide deep", fixtureD.contactQuality === "usable" && fixtureD.ballType === "flyBall" && fixtureD.pace === "moderate" && fixtureD.direction === "rightSide" && fixtureD.depth === "deep");
verify("15. Fixture D 不含 automatic out／sac fly", !["isOut", "caught", "sacrificeFly", "runnerAdvance"].some(key => Object.hasOwn(fixtureD, key)));

const imperfectSolid = truth("E", { contactQuality: .3, ballType: .5, pace: .5, direction: .5, depth: .5 }, { abilities: { batting: 20, power: 10 }, actualPitch: { pitchLocationClass: "hitterPitch", attackability: .96 }, recognition: { correct: false, perceivedPitchClass: "competitiveStrike" } });
verify("16. Fixture E：imperfect recognition 仍可 solid", imperfectSolid.contactQuality === "solid" && imperfectSolid.executionEvidence.recognition.correct === false);
const correctPoor = truth("F", { contactQuality: 0, ballType: .1, pace: .1, direction: .5 }, { abilities: { batting: 1, power: 1 }, actualPitch: { pitchLocationClass: "clearBall", attackability: .08 }, recognition: { correct: true, perceivedPitchClass: "clearBall" } });
verify("17. Fixture F：correct recognition 仍可 poor", correctPoor.contactQuality === "poor" && correctPoor.executionEvidence.recognition.correct === true);
verify("18. Contact Quality 不重新讀 Observe／IQ／BallSense", JSON.stringify(truth("double-count", { contactQuality: .5, ballType: .5, pace: .5, direction: .5, depth: .5 }, { abilities: { batting: 10, power: 10, observe: 0, baseballIQ: 0, ballSense: 0 } })) === JSON.stringify(truth("double-count", { contactQuality: .5, ballType: .5, pace: .5, direction: .5, depth: .5 }, { abilities: { batting: 10, power: 10, observe: 20, baseballIQ: 20, ballSense: 20 } })));

const lowPowerHard = truth("low-power-hard", { contactQuality: 1, ballType: .5, pace: 1, direction: .5, depth: .5 }, { abilities: { batting: 20, power: 1 }, actualPitch: { attackability: .96 }, recognition: { correct: true } });
const highPowerModerate = truth("high-power-moderate", { contactQuality: .3, ballType: .5, pace: 0, direction: .5, depth: 0 }, { abilities: { batting: 12, power: 20 } });
verify("19. Power firewall：low power 仍可 hard pace", lowPowerHard.pace === "hard");
verify("20. Power firewall：high power 不保證 hard pace", ["moderate", "firm"].includes(highPowerModerate.pace));

const sameRight = { ...fixtureA, direction: "rightSide" };
verify("21. Fixture H：右打 rightSide 解讀為反方向", BBP.getHandednessDirectionInterpretation(sameRight.direction, "R") === "反方向");
verify("22. Fixture H：左打 rightSide 解讀為拉打", BBP.getHandednessDirectionInterpretation(sameRight.direction, "L") === "拉打方向");
verify("23. Handedness interpretation 不改 canonical direction", sameRight.direction === "rightSide");

const forbidden = ["isHit", "isOut", "hitType", "single", "double", "triple", "homeRun", "RBI", "doublePlay", "fielder", "runnerAdvance", "safe", "caught"];
verify("24. Canonical truth 完全不含 outcome fields", forbidden.every(key => !Object.hasOwn(fixtureC, key)));
verify("25. Canonical truth 不含 runner／defense authority", !JSON.stringify(fixtureC).match(/runnerMovementProgress|runnerTargets|defensiveRoute|primaryFielder|timingWindow/));
verify("26. 相同 identity + inputs 完全 deterministic", JSON.stringify(truth("repeat", null)) === JSON.stringify(truth("repeat", null)));
verify("27. Resolver 不呼叫 Math.random", (() => { const original = Math.random; let calls = 0; Math.random = () => { calls += 1; return .5; }; truth("no-global-rng", null); Math.random = original; return calls === 0; })());
verify("28. Save normalization 保留相同 physical truth", JSON.stringify(BBP.normalizeBattedBallPhysicalTruth(JSON.parse(JSON.stringify(fixtureC)))) === JSON.stringify(fixtureC));

function state(identity) { return Plate.createPlateAppearanceState({ paIdentity: identity, batterId: "player", approach: "balancedAttack" }); }
function plateBall(identity, physicalRolls, outcomeRoll, overrides = {}) {
  return Plate.resolveNextPitch(state(identity), { batting: overrides.batting || 12, ballSense: 10, power: overrides.power || 10, bats: "R" }, {
    pitch: { pitchLocationClass: overrides.pitchClass || "competitiveStrike", attackability: overrides.attackability ?? .76, strike: true },
    recognitionRoll: overrides.recognitionRoll ?? 0, decisionRoll: 0, contactRoll: 0, foulRoll: 1, physicalRolls, outcomeRoll
  });
}
const barredOut = plateBall("barreled-out", { contactQuality: 1, ballType: .5, pace: .9, direction: .5, depth: .5 }, 0, { batting: 20, power: 20, pitchClass: "hitterPitch", attackability: .96 });
verify("29. Outcome firewall：barreled lineDrive 可 downstream out", barredOut.event.battedBallPhysicalTruth.contactQuality === "barreled" && barredOut.event.battedBallPhysicalTruth.ballType === "lineDrive" && ["out", "productiveOut"].includes(barredOut.state.result));
const poorHit = plateBall("poor-hit", { contactQuality: 0, ballType: .1, pace: .1, direction: .5 }, 1, { batting: 1, power: 1, pitchClass: "clearBall", attackability: .08, recognitionRoll: 1 });
verify("30. Outcome firewall：poor groundBall 可 downstream safe hit", poorHit.event.battedBallPhysicalTruth.contactQuality === "poor" && poorHit.event.battedBallPhysicalTruth.ballType === "groundBall" && ["single", "double", "triple", "homeRun"].includes(poorHit.state.result));
verify("31. Legacy adapter 明確位於 physical truth 下游", Plate.resolveLegacyBallInPlayOutcome(state("adapter"), base.actualPitch, base.abilities, base.recognition, fixtureC, .5).adapterAuthority === "legacyDownstreamOutcomeAdapter");

const samples = Array.from({ length: 1200 }, (_, index) => index);
const audit = samples.map(index => truth(`audit-${index}`, null, { abilities: { batting: 2 + index % 18, power: 1 + (index * 7) % 20 }, bats: index % 2 ? "L" : "R" }));
verify("32. Semantic audit：全部 taxonomy state 可達", BBP.CONTACT_QUALITIES.every(value => audit.some(item => item.contactQuality === value)) && BBP.BALL_TYPES.every(value => audit.some(item => item.ballType === value)) && BBP.PACES.every(value => audit.some(item => item.pace === value)) && BBP.DIRECTIONS.every(value => audit.some(item => item.direction === value)) && BBP.DEPTHS.every(value => audit.some(item => item.depth === value)));
verify("33. Semantic audit：所有 groundBall depth 均為 null", audit.filter(item => item.ballType === "groundBall").every(item => item.depth === null));
const paceRank = { weak: 0, moderate: 1, firm: 2, hard: 3 };
const powerAudit = power => samples.map(index => truth(`power-${index}`, null, { abilities: { batting: 10, power } }));
const lowPower = powerAudit(2), highPower = powerAudit(18);
const meanPace = list => list.reduce((sum, item) => sum + paceRank[item.pace], 0) / list.length;
verify("34. Semantic audit：高 Power 提升 pace tendency 但非 100% hard", meanPace(highPower) > meanPace(lowPower) && highPower.some(item => item.pace !== "hard"));
verify("35. Semantic audit：高低 Power distribution 有 overlap", BBP.PACES.some(value => lowPower.some(item => item.pace === value) && highPower.some(item => item.pace === value)));
const depthRank = { shallow: 0, medium: 1, deep: 2 };
const lowPowerAir = lowPower.filter(item => item.depth !== null), highPowerAir = highPower.filter(item => item.depth !== null);
verify("36. Semantic audit：高 Power 提升 air-ball depth tendency 但非 100% deep", highPowerAir.reduce((sum, item) => sum + depthRank[item.depth], 0) / highPowerAir.length > lowPowerAir.reduce((sum, item) => sum + depthRank[item.depth], 0) / lowPowerAir.length && highPowerAir.some(item => item.depth !== "deep"));
verify("37. Ball Type firewall：solid 與 poor 都不被鎖死為單一球型", BBP.BALL_TYPES.every(value => audit.some(item => item.contactQuality === "solid" && item.ballType === value)) && BBP.BALL_TYPES.every(value => audit.some(item => item.contactQuality === "poor" && item.ballType === value)));
const contactRank = { poor: 0, usable: 1, solid: 2, barreled: 3 };
const poorEnvironment = samples.map(index => truth(`contact-tendency-${index}`, null, { abilities: { batting: 1, power: 10 }, actualPitch: { attackability: .48 }, recognition: { correct: false } }));
const strongEnvironment = samples.map(index => truth(`contact-tendency-${index}`, null, { abilities: { batting: 20, power: 10 }, actualPitch: { attackability: .48 }, recognition: { correct: false } }));
verify("38. Semantic audit：較佳 contact environment 提升 firm／hard tendency但不指定結果", meanPace(strongEnvironment) > meanPace(poorEnvironment) && strongEnvironment.every(item => !Object.hasOwn(item, "result")));
const misreadAudit = samples.map(index => truth(`recognition-${index}`, null, { abilities: { batting: 5, power: 10 }, actualPitch: { attackability: .3 }, recognition: { correct: false } }));
const correctAudit = samples.map(index => truth(`recognition-${index}`, null, { abilities: { batting: 5, power: 10 }, actualPitch: { attackability: .3 }, recognition: { correct: true } }));
const meanContact = list => list.reduce((sum, item) => sum + contactRank[item.contactQuality], 0) / list.length;
verify("39. Semantic audit：較佳 Recognition 改善 Contact Quality tendency 但 poor path 仍可達", meanContact(correctAudit) > meanContact(misreadAudit) && correctAudit.some(item => item.contactQuality === "poor"));

console.log(`Batted-Ball Physical Foundation focused tests: ${passed}/${passed} passed`);
