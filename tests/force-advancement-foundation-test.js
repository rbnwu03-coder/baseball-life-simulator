const assert = require("assert");
const Force = require("../force-advancement.js");
const BuntHandoff = require("../offensive-bunt-defensive-handoff.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }
const chain = runners => Force.buildInitialLiveBallForceChain({ runners, batterRunnerId: "batter" });
const targets = value => Object.fromEntries(value.allRequiredMovements.map(item => [item.runnerId, item.targetBase]));

const empty = chain([null, null, null]);
verify("A. Empty：只有 batter-runner → 1B", JSON.stringify(targets(empty)) === JSON.stringify({ batter: "first" }) && empty.forcedRunners.length === 0);
const first = chain(["r1", null, null]);
verify("B. 1B only：runner1B → 2B", targets(first).r1 === "second" && first.forcedRunners.length === 1);
const second = chain([null, "r2", null]);
verify("C. 2B only：runner2B 不受迫前進", !targets(second).r2 && second.unforcedRunners.some(item => item.runnerId === "r2" && item.originBase === 2));
const third = chain([null, null, "r3"]);
verify("D. 3B only：runner3B 不受迫回本壘", !targets(third).r3 && third.unforcedRunners.some(item => item.runnerId === "r3" && item.originBase === 3));
const firstSecond = chain(["r1", "r2", null]);
verify("E. 1B+2B：force chain 連鎖到 runner2B → 3B", targets(firstSecond).r1 === "second" && targets(firstSecond).r2 === "third" && firstSecond.forcedRunners.find(item => item.runnerId === "r2").chainDepth === 2);
const firstThird = chain(["r1", null, "r3"]);
verify("F. 1B+3B：runner1B 受迫、runner3B 不受迫", targets(firstThird).r1 === "second" && !targets(firstThird).r3);
const secondThird = chain([null, "r2", "r3"]);
verify("G. 2B+3B：兩名既有跑者都不受迫", secondThird.forcedRunners.length === 0 && secondThird.unforcedRunners.length === 2);
const loaded = chain(["r1", "r2", "r3"]);
verify("H. Loaded：完整 propagation 到 Home", targets(loaded).r1 === "second" && targets(loaded).r2 === "third" && targets(loaded).r3 === "home");
verify("Force evidence. 每名 forced actor 保留 origin、target、reason 與 chain depth", loaded.forcedRunners.every(item => item.isForced && item.originBase && item.targetBase && item.forceReason && Number.isInteger(item.chainDepth)));
verify("Outcome firewall. Initial chain 不含 future safe/out", !/(safe|outcome|result)/i.test(JSON.stringify(Object.keys(loaded).concat(loaded.allRequiredMovements.flatMap(Object.keys)))));
verify("Outs firewall. 0 out 與 2 outs 建立相同 initial force chain", JSON.stringify(chain(["r1", "r2", "r3"])) === JSON.stringify(Force.buildInitialLiveBallForceChain({ runners: ["r1", "r2", "r3"], batterRunnerId: "batter", outs: 2 })));

const originalBug = Force.settleForceAdvancement({ forceChain: firstSecond, route: "doublePlay", resultCode: "twoOuts" });
verify("I/O. 1B+2B successful 4-6-3：只留下 original2B runner 於 3B", JSON.stringify(originalBug.runnersAfter) === JSON.stringify([null, null, "r2"]) && originalBug.runnerChanges.some(change => change.runnerId === "r2" && change.from === 2 && change.to === 3));
verify("I/O. Out runners 不殘留且 runner identity 無碰撞", originalBug.outRunnerIds.includes("r1") && originalBug.outRunnerIds.includes("batter") && new Set(originalBug.runnersAfter.filter(Boolean)).size === originalBug.runnersAfter.filter(Boolean).length);
const firstOnlyDP = Force.settleForceAdvancement({ forceChain: first, route: "doublePlay", resultCode: "twoOuts" });
verify("J. 1B only successful 4-6-3：bases empty", firstOnlyDP.runnersAfter.every(value => value === null));
const firstThirdDP = Force.settleForceAdvancement({ forceChain: firstThird, route: "doublePlay", resultCode: "twoOuts" });
verify("K. 1B+3B：原三壘跑者不被誤推回本壘", firstThirdDP.runnersAfter[2] === "r3" && firstThirdDP.scoringRunnerIds.length === 0);
verify("L. Loaded chain 保留 runner3B → Home target，即使防守 route 未支援本壘", loaded.forcedRunners.some(item => item.runnerId === "r3" && item.targetBase === "home"));
verify("M. 2B only compatibility force state 不誤判 forceAtThird", !Force.deriveCompatibilityForceState(second).forceAtThird);
verify("N. 2B+3B compatibility force state 不誤判第三壘或本壘 force", !Force.deriveCompatibilityForceState(secondThird).forceAtThird && !Force.deriveCompatibilityForceState(secondThird).forceAtHome);

const failedFirstLeg = Force.settleForceAdvancement({ forceChain: firstSecond, route: "doublePlay", resultCode: "zeroOuts" });
verify("P. First leg fails：original2B→3B、original1B→2B、batter→1B", JSON.stringify(failedFirstLeg.runnersAfter) === JSON.stringify(["batter", "r1", "r2"]));
const secureFirst = Force.settleForceAdvancement({ forceChain: firstSecond, route: "secureFirst", resultCode: "oneOut" });
verify("Q. Secure 1B first：其他 forced runners 仍完成 required movement", JSON.stringify(secureFirst.runnersAfter) === JSON.stringify([null, "r1", "r2"]) && secureFirst.outRunnerIds.join() === "batter");

const bunt = BuntHandoff.createHandoff({
  identity: "shared-force-bunt", physicalTruth: { contactResult: "fairContact", fairBallType: "groundBunt", pace: "controlled", placement: "secondBaseSide", preparationState: "set" },
  existingRunners: [{ runnerId: "r1", originBase: 1, speed: 5 }, { runnerId: "r2", originBase: 2, speed: 5 }],
  batterRunner: { runnerId: "batter", speed: 5 }, defenderContext: { playerPosition: "二壘手" }
});
verify("Bunt shared force. Bunt B2 讀同一 Force Foundation", bunt.forceChain.version === Force.VERSION && bunt.runnerReassessment.existingRunners.find(item => item.runnerId === "r2").targetBase === "third" && bunt.runnerReassessment.existingRunners.find(item => item.runnerId === "r2").isForced);
verify("Save/reload. Force chain normalization 保留 IDs、origins 與 targets", JSON.stringify(Force.normalizeForceChain(JSON.parse(JSON.stringify(loaded)))) === JSON.stringify(loaded));

console.log(`Force Advancement Foundation tests: ${passed}/${passed} passed`);
