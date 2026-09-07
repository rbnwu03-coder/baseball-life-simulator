const assert = require("assert");
const fs = require("fs");
const Foundation = require("../defensive-opportunity-foundation.js");
const Roster = require("../team-roster-foundation.js");
const Physical = require("../batted-ball-physical.js");
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const clone = value => JSON.parse(JSON.stringify(value));
const truth = (ballType, direction, depth = null, pace = "firm") => ({
  version: Physical.VERSION, identity: `physical|${ballType}|${direction}|${depth}|${pace}`,
  contactQuality: "solid", ballType, direction, depth, pace
});
function activeRoster(playerPosition = "") {
  return {
    lineup: Roster.POSITION_ORDER.map(position => ({ id: position === playerPosition ? "player" : `active-${position}`,
      position, throws: "R", age: 18 })),
    bench: [{ id: "bench-SS", primaryPosition: "SS", position: "SS" },
      ...(playerPosition ? [] : [{ id: "player", position: "2B" }])]
  };
}
const resolve = (physicalTruth, roster = activeRoster(), extra = {}) =>
  Foundation.resolveDefensiveOpportunity({ physicalTruth, activeRoster: roster, ...extra });
const cases = [
  ["groundBall", null, ["SS", "SS", "2B"]],
  ["lineDrive", "shallow", ["SS", "SS", "2B"]],
  ["lineDrive", "medium", ["LF", "CF", "RF"]],
  ["lineDrive", "deep", ["LF", "CF", "RF"]],
  ["flyBall", "shallow", ["SS", "CF", "2B"]],
  ["flyBall", "medium", ["LF", "CF", "RF"]],
  ["flyBall", "deep", ["LF", "CF", "RF"]]
];
for (const [type, depth, expected] of cases) {
  ["leftSide", "middle", "rightSide"].forEach((direction, index) => test(`${type}/${depth}/${direction}`, () => {
    const result = resolve(truth(type, direction, depth));
    assert.equal(result.supported, true);
    assert.equal(result.primaryPosition, expected[index]);
    assert.equal(result.primaryDefenderId, `active-${expected[index]}`);
    assert.equal(result.bindingStatus, "bound");
    assert.equal(new Set([result.primaryPosition, ...result.secondaryPositions]).size, result.secondaryPositions.length + 1);
    assert.ok(result.secondaryDefenders.every(actor => actor.defenderId === `active-${actor.position}`));
  }));
}
test("overlap is explicit, never a probability", () => {
  const result = resolve(truth("groundBall", "leftSide"));
  assert.equal(result.responsibilityClassification, "coarseAmbiguity");
  assert.deepEqual(result.secondaryPositions, ["3B"]);
  assert.equal(resolve(truth("flyBall", "middle", "deep")).responsibilityClassification, "clear");
  assert.equal(resolve(truth("flyBall", "rightSide", "deep")).responsibilityClassification, "sharedEdge");
});
test("same physical truth is not attracted to player at any position or on bench", () => {
  for (const [type, depth] of cases) for (const direction of Physical.DIRECTIONS) {
    const ball = truth(type, direction, depth);
    const results = [...Roster.POSITION_ORDER, ""].map(position => resolve(ball, activeRoster(position)));
    assert.ok(results.every(result => result.primaryPosition === results[0].primaryPosition && result.identity === results[0].identity));
    assert.deepEqual(results[0].secondaryPositions, results[1].secondaryPositions);
  }
  const ball = truth("groundBall", "rightSide");
  assert.equal(resolve(ball, activeRoster("2B")).primaryDefenderId, "player");
  assert.equal(resolve(ball, activeRoster("SS")).primaryDefenderId, "active-2B");
  assert.equal(resolve(ball).primaryDefenderId, "active-2B");
});
test("all capabilities and evaluation inputs are irrelevant", () => {
  const low = activeRoster(), high = activeRoster();
  for (const roster of [low, high]) roster.lineup.forEach(actor => {
    for (const key of ["fielding", "reaction", "range", "speed", "catching", "arm", "coachTrust", "evaluation", "role"]) {
      Object.defineProperty(actor, key, { get() { throw new Error(`responsibility read ${key}`); } });
    }
  });
  for (const [type, depth] of cases) for (const direction of Physical.DIRECTIONS) {
    assert.deepEqual(resolve(truth(type, direction, depth), low), resolve(truth(type, direction, depth), high));
  }
});
test("SS versus 3B capability inversion does not move responsibility", () => {
  const a = activeRoster(), b = activeRoster();
  for (const key of ["fielding", "reaction", "range", "speed", "catching", "arm"]) {
    Object.assign(a.lineup[5], { [key]: 20 }); Object.assign(a.lineup[4], { [key]: 1 });
    Object.assign(b.lineup[5], { [key]: 1 }); Object.assign(b.lineup[4], { [key]: 20 });
  }
  assert.deepEqual(resolve(truth("groundBall", "leftSide"), a), resolve(truth("groundBall", "leftSide"), b));
});
test("bench and replaced actors cannot own current responsibility", () => {
  const roster = activeRoster(), ball = truth("groundBall", "leftSide");
  const before = resolve(ball, roster);
  const outgoing = roster.lineup[5];
  roster.lineup[5] = { id: "replacement-SS", position: "游擊手", throws: "R", age: 18 };
  roster.bench.push(outgoing);
  const after = resolve(ball, roster);
  assert.equal(after.primaryDefenderId, "replacement-SS");
  assert.equal(after.primaryPosition, before.primaryPosition);
  assert.equal(after.identity, before.identity);
});
test("missing / duplicate / alias collision fail closed without alternate defender", () => {
  for (const mutate of [r => r.lineup.splice(5, 1), r => { r.lineup[4].position = "游擊手"; }, r => { r.lineup[4].id = r.lineup[5].id; }]) {
    const roster = activeRoster(); mutate(roster);
    const result = resolve(truth("groundBall", "leftSide"), roster);
    assert.equal(result.supported, false);
    assert.equal(result.primaryPosition, "SS");
    assert.equal(result.primaryDefenderId, "");
    assert.deepEqual(result.secondaryDefenders, []);
    assert.equal(result.fallbackReason, "invalidActiveAssignment");
  }
});
test("Chinese aliases retain canonical responsibility", () => {
  const roster = activeRoster(); roster.lineup.forEach(actor => { actor.position = Roster.POSITION_LABELS[actor.position]; });
  assert.deepEqual(resolve(truth("groundBall", "leftSide"), roster), resolve(truth("groundBall", "leftSide")));
});
test("unsupported physical precision never invents positions or actors", () => {
  for (const ball of [truth("popup", "middle", "shallow"), truth("flyBall", "middle"), { ...truth("groundBall", "middle"), direction: "exactThirdBaseLine" }, { ...truth("groundBall", "middle"), identity: "" }]) {
    const result = resolve(ball);
    assert.equal(result.supported, false); assert.equal(result.primaryPosition, ""); assert.equal(result.primaryDefenderId, "");
    assert.equal(result.responsibilityClassification, "unsupported");
  }
  assert.equal(resolve(truth("groundBall", "middle"), activeRoster(), {topologyVersion:"shifted"}).fallbackReason, "unsupportedTopology");
});
test("stable physical identity, frozen output, no state mutation", () => {
  const ball = truth("flyBall", "rightSide", "deep"), roster = activeRoster();
  const before = JSON.stringify({ball, roster});
  const result = resolve(ball, roster);
  assert.ok(result.identity.includes(ball.identity)); assert.equal(result.physicalIdentity, ball.identity);
  assert.deepEqual(result, resolve(clone(ball), clone(roster)));
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.secondaryPositions));
  assert.equal(JSON.stringify({ball, roster}), before);
});
test("no RNG and no execution / evaluator fields", () => {
  const original = Math.random;
  try {
    Math.random = () => { throw new Error("RNG forbidden"); };
    const result = resolve(truth("lineDrive", "rightSide", "shallow"));
    assert.ok(!/successChance|catchChance|reachProbability|executionScore|evaluatorGrade/.test(JSON.stringify(result)));
  } finally { Math.random = original; }
  assert.ok(!/Math\.random|randomSource|deterministicUnit/.test(fs.readFileSync(require.resolve("../defensive-opportunity-foundation.js"), "utf8")));
});
test("pace and narrative cannot fabricate a more precise area", () => {
  const results = Physical.PACES.map(pace => resolve({ ...truth("groundBall", "middle", null, pace), narration:"球飛向右外野" }));
  assert.ok(results.every(result => result.primaryPosition === "SS" && result.responsibilityClassification === "coarseAmbiguity"));
});
console.log(`${passed}/${passed} PASS`);
