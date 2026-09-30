const assert = require("assert");
const fc = require("fast-check");
const { makeContext } = require("./high-school-career-test-context");
const CompetitionRules = require("../competition-rules");

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`PASS ${name}`); };
const env = makeContext();
const resolve = (length, index, enabled = true) => env.json(`resolveHighSchoolExtraInningTiebreakPlacement({
  inning: 8, half: "\\u4e0a", offenseTeam: "away", battingOrderIndex: { away: ${index} },
  rosters: { away: { lineup: Array.from({length:${length}}, (_, i) => ({id:"b"+i})) } },
  rules: { extraInningTiebreak: { enabled: ${enabled}, startInning: 8,
    runnerBase: 2, runnerSource: "previousLineupSlot", earnedRunTreatment: "deemedReachedOnError" } }
})`);

test("canonical full-game rule carries the ER treatment", () => {
  const rule = CompetitionRules.resolveMatchCompetitionRules({ matchOrigin: "developmentMatch" }).rules.extraInningTiebreak;
  assert.strictEqual(rule.earnedRunTreatment, "deemedReachedOnError");
  assert.strictEqual(CompetitionRules.resolveMatchCompetitionRules({ matchOrigin: "trainingCamp" }).rules.extraInningTiebreak.earnedRunTreatment, null);
});

test("previous live lineup slot wraps cyclically", () => {
  fc.assert(fc.property(fc.integer({ min: 2, max: 15 }), fc.nat(), (length, n) => {
    const index = n % length;
    const result = resolve(length, index);
    assert.strictEqual(result.lineupSlot, (index - 1 + length) % length);
    assert.strictEqual(result.runnerId, `b${result.lineupSlot}`);
  }), { seed: 82627, numRuns: 100 });
});

test("disabled rule never resolves a runner", () => {
  fc.assert(fc.property(fc.integer({ min: 2, max: 15 }), fc.nat(), (length, n) => {
    assert.strictEqual(resolve(length, n % length, false), null);
  }), { seed: 82628, numRuns: 100 });
});

test("initialization is idempotent and does not mutate accounting, order, or RNG", () => {
  fc.assert(fc.property(fc.integer({ min: 2, max: 15 }), fc.nat(), (length, n) => {
    const index = n % length;
    const result = env.json(`(() => {
      const match = { inning:8, half:"\\u4e0a", offenseTeam:"away", outs:0,
        runners:[null,null,null], battingOrderIndex:{away:${index}}, simulationCursor:19,
        gameRecord:{PA:3,BF:3,H:1,BB:0,E:0},
        rosters:{away:{lineup:Array.from({length:${length}},(_,i)=>({id:"b"+i}))}},
        rules:{extraInningTiebreak:{enabled:true,startInning:8,runnerBase:2,
          runnerSource:"previousLineupSlot",earnedRunTreatment:"deemedReachedOnError"}} };
      const first = initializeHighSchoolExtraInningTiebreakHalf(match);
      const once = JSON.stringify(match);
      const second = initializeHighSchoolExtraInningTiebreakHalf(match);
      return {first,second,same:once===JSON.stringify(match),match};
    })()`);
    assert.strictEqual(result.first, true);
    assert.strictEqual(result.second, false);
    assert.strictEqual(result.same, true);
    assert.strictEqual(result.match.battingOrderIndex.away, index);
    assert.strictEqual(result.match.simulationCursor, 19);
    assert.deepStrictEqual(result.match.gameRecord, { PA: 3, BF: 3, H: 1, BB: 0, E: 0 });
  }), { seed: 82629, numRuns: 100 });
});

test("unsupported active rule fails explicitly", () => {
  assert.throws(() => env.run(`resolveHighSchoolExtraInningTiebreakPlacement({
    inning:8, offenseTeam:"away", battingOrderIndex:{away:0},
    rosters:{away:{lineup:[{id:"a"},{id:"b"}]}},
    rules:{extraInningTiebreak:{enabled:true,startInning:8,runnerBase:3,
      runnerSource:"previousLineupSlot",earnedRunTreatment:"deemedReachedOnError"}}
  })`), /Unsupported extra-inning tiebreak rule/);
});

test("older captured v1 rules gain the authoritative ER clause", () => {
  const old = CompetitionRules.resolveMatchCompetitionRules({ matchOrigin: "developmentMatch" });
  const rules = JSON.parse(JSON.stringify(old.rules));
  delete rules.extraInningTiebreak.earnedRunTreatment;
  const normalized = CompetitionRules.normalizeMatchRulesSnapshot({ ruleSetId: old.ruleSetId, rules });
  assert.strictEqual(normalized.rules.extraInningTiebreak.earnedRunTreatment, "deemedReachedOnError");
  assert.strictEqual(rules.extraInningTiebreak.earnedRunTreatment, undefined);
});

console.log(`${passed}/${passed} PASS`);
