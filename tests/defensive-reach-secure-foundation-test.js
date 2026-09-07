const assert = require("assert");
const fs = require("fs");
const Foundation = require("../defensive-reach-secure-foundation.js");
const Opportunity = require("../defensive-opportunity-foundation.js");
const Physical = require("../batted-ball-physical.js");
const Roster = require("../team-roster-foundation.js");
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const clone = value => JSON.parse(JSON.stringify(value));
function fixture(type = "groundBall", depth = null, pace = "firm", direction = "rightSide") {
  const activeRoster = { lineup: Roster.POSITION_ORDER.map(position => ({ id: `active-${position}`, position, throws: "R", age: 18 })),
    bench: [{ id: "player", position: "2B" }] };
  const physicalTruth = { version: Physical.VERSION, identity: `${type}|${depth}|${pace}|${direction}`,
    contactQuality: "solid", ballType: type, depth, pace, direction };
  const opportunity = Opportunity.resolveDefensiveOpportunity({ physicalTruth, activeRoster });
  return { physicalTruth, activeRoster, opportunity, capabilities: { defenderId: opportunity.primaryDefenderId,
    reaction: 10, range: 10, mobility: 10, fielding: 10, catching: 10 }, roll: 0.5 };
}
for (const type of ["groundBall", "lineDrive", "flyBall"]) {
  for (const depth of type === "groundBall" ? [null] : ["shallow", "medium", "deep"]) {
    for (const pace of ["weak", "moderate", "firm", "hard"]) {
      test(`${type}/${depth}/${pace}: generic responsibility, reach and secure`, () => {
        for (const direction of ["leftSide", "middle", "rightSide"]) {
          const input = fixture(type, depth, pace, direction);
          const before = JSON.stringify(input);
          const reach = Foundation.resolveReach(input);
          const secure = Foundation.resolveSecure({ ...input, reachResult: reach });
          assert.equal(reach.position, input.opportunity.primaryPosition);
          assert.equal(reach.defenderId, input.opportunity.primaryDefenderId);
          assert.equal(reach.reached, true); assert.equal(secure.secured, true);
          assert.equal(secure.reachIdentity, reach.identity);
          assert.equal(JSON.stringify(input), before);
          assert.ok(Object.isFrozen(reach.inputs)); assert.ok(Object.isFrozen(secure));
        }
      });
    }
  }
}
test("mobility success is independent of poor hands; good hands cannot rescue no reach", () => {
  const input = fixture("flyBall", "deep");
  input.capabilities.fielding = input.capabilities.catching = 0;
  const reach = Foundation.resolveReach(input);
  const secure = Foundation.resolveSecure({ ...input, reachResult: reach });
  assert.equal(reach.reached, true); assert.equal(secure.secured, false);
  assert.equal(secure.ballState, "groundContactLive");
  input.capabilities = { ...input.capabilities, reaction: 0, range: 0, mobility: 0, fielding: 20, catching: 20 };
  const missed = Foundation.resolveReach(input);
  const secureInput = { ...input, reachResult: missed };
  Object.defineProperty(secureInput, "roll", { get() { throw new Error("no secure roll for a missed ball"); } });
  Object.defineProperty(secureInput.capabilities, "catching", { get() { throw new Error("no hands read for a missed ball"); } });
  const unavailable = Foundation.resolveSecure(secureInput);
  assert.equal(missed.reached, false); assert.equal(unavailable.secureQuality, "notAttempted");
  assert.equal(unavailable.ballState, "notReached"); assert.equal(unavailable.variationEvidence.consumed, false);
});
test("arrival changes secure demand and physical outcome with identical hands", () => {
  const input = fixture();
  input.capabilities.fielding = input.capabilities.catching = 5;
  const clean = Foundation.resolveReach(input);
  const stretchedInput = { ...input, capabilities: { ...input.capabilities, reaction: 4.5, range: 4.5, mobility: 4.5 } };
  const stretched = Foundation.resolveReach(stretchedInput);
  assert.equal(stretched.reachQuality, "stretchedArrival");
  const a = Foundation.resolveSecure({ ...input, reachResult: clean });
  const b = Foundation.resolveSecure({ ...stretchedInput, reachResult: stretched });
  assert.equal(a.secured, true); assert.equal(b.secured, false);
  assert.ok(b.secureDemand > a.secureDemand);
});
test("ground control distinguishes clean, delayed and loose without scoring", () => {
  const input = fixture(); const reachResult = Foundation.resolveReach(input);
  const results = [10, 5, 0].map(hands => Foundation.resolveSecure({ ...input, reachResult,
    capabilities: { ...input.capabilities, fielding: hands, catching: hands } }));
  assert.deepEqual(results.map(result => result.secureQuality), ["cleanControl", "bobbleButControlled", "notControlled"]);
  assert.deepEqual(results.map(result => result.ballState), ["secured", "secured", "looseLiveBall"]);
  for (const result of results) for (const key of ["out", "error", "hit", "outs", "runs", "bases", "runnerChanges", "score", "throwRoute"]) assert.ok(!(key in result));
});
test("hard line drive has greater reaction and control pressure than ordinary fly", () => {
  const line = fixture("lineDrive", "shallow", "hard"); const fly = fixture("flyBall", "medium", "moderate");
  const a = Foundation.resolveReach(line), b = Foundation.resolveReach(fly);
  assert.ok(a.reactionDemand > b.reactionDemand);
  assert.ok(Foundation.resolveSecure({ ...line, reachResult: a }).secureDemand > Foundation.resolveSecure({ ...fly, reachResult: b }).secureDemand);
});
test("weak ground requires charging; deep fly requires range; ambiguity remains demand only", () => {
  const weak = Foundation.resolveReach(fixture("groundBall", null, "weak"));
  const hard = Foundation.resolveReach(fixture("groundBall", null, "hard"));
  assert.ok(weak.movementDemand > hard.movementDemand); assert.ok(hard.reactionDemand > weak.reactionDemand);
  const middle = Foundation.resolveReach(fixture("flyBall", "deep", "firm", "middle"));
  const edge = Foundation.resolveReach(fixture("flyBall", "deep", "firm", "rightSide"));
  assert.ok(edge.movementDemand > middle.movementDemand);
  assert.ok(middle.movementDemand > Foundation.resolveReach(fixture("flyBall", "shallow", "firm", "middle")).movementDemand);
});
test("higher reaction and range improve reach without changing responsibility", () => {
  for (const type of ["groundBall", "lineDrive", "flyBall"]) {
    const input = fixture(type, type === "groundBall" ? null : "deep", "hard");
    const high = Foundation.resolveReach(input);
    const low = Foundation.resolveReach({ ...input, capabilities: { ...input.capabilities, reaction: 0, range: 0, mobility: 0 } });
    assert.equal(high.position, low.position); assert.equal(high.opportunityIdentity, low.opportunityIdentity);
    assert.ok(high.margin > low.margin); assert.ok(high.reached && !low.reached);
  }
});
test("deterministic default and injected rolls; namespaces separated; reach ignores hands and evaluation", () => {
  const input = fixture(); delete input.roll;
  for (const key of ["fielding", "catching", "coachGrade", "scoutGrade", "role", "fame", "evaluation"]) {
    Object.defineProperty(input.capabilities, key, { get() { throw new Error(`reach read ${key}`); } });
  }
  assert.deepEqual(Foundation.resolveReach(input), Foundation.resolveReach(input));
  const regular = fixture(); const reachResult = Foundation.resolveReach(regular);
  assert.deepEqual(reachResult, Foundation.resolveReach(regular));
  const secure = Foundation.resolveSecure({ ...regular, reachResult });
  assert.deepEqual(secure, Foundation.resolveSecure({ ...regular, reachResult }));
  assert.deepEqual(Foundation.resolveSecure({ ...regular, roll: undefined, reachResult }),
    Foundation.resolveSecure({ ...regular, roll: undefined, reachResult }));
  assert.notEqual(secure.variationEvidence.namespace, reachResult.variationEvidence.namespace);
  assert.ok(!fs.readFileSync(require.resolve("../defensive-reach-secure-foundation.js"), "utf8").includes("Math.random"));
});
test("invalid roster, stale actor, wrong physical link and forged responsibility fail closed", () => {
  const input = fixture(); const reachResult = Foundation.resolveReach(input);
  const invalid = clone(input); invalid.activeRoster.lineup.pop();
  assert.throws(() => Foundation.resolveReach(invalid), /integrity failed/);
  const replaced = clone(input); replaced.activeRoster.lineup.find(a => a.position === "2B").id = "replacement";
  assert.throws(() => Foundation.resolveReach(replaced), /stale/);
  replaced.opportunity = Opportunity.resolveDefensiveOpportunity(replaced); replaced.capabilities.defenderId = "replacement";
  assert.equal(Foundation.resolveReach(replaced).defenderId, "replacement");
  assert.throws(() => Foundation.resolveSecure({ ...replaced, reachResult }), /incompatible/);
  const forged = clone(input); forged.opportunity.primaryPosition = "SS";
  assert.throws(() => Foundation.resolveReach(forged), /stale/);
});
test("legacy 2B control adapter is a physical fact projection, not a second RNG", () => {
  const reach = Foundation.resolveReach(fixture());
  for (const control of ["completed", "recovered", "failed"]) {
    const result = Foundation.projectGroundControl(reach, control);
    assert.equal(result.secured, control !== "failed"); assert.equal(result.variationEvidence.consumed, false);
  }
  assert.throws(() => Foundation.projectGroundControl(reach, "out"), /unavailable/);
});
console.log(`${passed}/${passed} PASS`);
