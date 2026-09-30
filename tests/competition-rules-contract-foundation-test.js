const assert = require("assert");
const CompetitionRules = require("../competition-rules");
const { makeContext } = require("./high-school-career-test-context");

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`PASS ${name}`); };
const plain = value => JSON.parse(JSON.stringify(value));

test("official competition resolves to the high-school full-game ruleset", () => {
  const result = CompetitionRules.resolveMatchCompetitionRules({ matchOrigin: "officialCompetition" });
  assert.deepStrictEqual(plain(result), {
    ruleSetId: "highSchoolFullGameV1",
    rules: { version: 1, regulationInnings: 7, extraInningTiebreak: {
      enabled: true, startInning: 8, runnerBase: 2, runnerSource: "previousLineupSlot",
      earnedRunTreatment: "deemedReachedOnError"
    } },
    warning: ""
  });
});

test("exhibition and evaluation full-match origins resolve explicitly", () => {
  for (const matchOrigin of ["homeInvitationFriendly", "awayInvitationFriendly", "neutralFriendly", "developmentMatch"]) {
    const result = CompetitionRules.resolveMatchCompetitionRules({ matchOrigin });
    assert.strictEqual(result.ruleSetId, "highSchoolFullGameV1");
    assert.strictEqual(result.rules.extraInningTiebreak.enabled, true);
  }
});

test("training camp resolves to a tiebreak-disabled training ruleset", () => {
  const result = CompetitionRules.resolveMatchCompetitionRules({ matchOrigin: "trainingCamp" });
  assert.strictEqual(result.ruleSetId, "highSchoolTrainingGameV1");
  assert.strictEqual(result.rules.regulationInnings, 7);
  assert.strictEqual(result.rules.extraInningTiebreak.enabled, false);
});

test("unknown context uses an explicit behavior-preserving fallback", () => {
  const result = CompetitionRules.resolveMatchCompetitionRules({ matchOrigin: "unsupported" });
  assert.strictEqual(result.ruleSetId, "highSchoolLegacyFallbackV1");
  assert.strictEqual(result.warning, "RULESET_CONTEXT_FALLBACK");
  assert.strictEqual(result.rules.extraInningTiebreak.enabled, false);
});

test("resolution is pure, deterministic, immutable, and consumes no RNG", () => {
  const context = { matchOrigin: "developmentMatch", nested: { untouched: true } };
  const before = JSON.stringify(context);
  const originalRandom = Math.random;
  Math.random = () => { throw new Error("rules resolution consumed RNG"); };
  try {
    const first = CompetitionRules.resolveMatchCompetitionRules(context);
    const second = CompetitionRules.resolveMatchCompetitionRules(context);
    assert.deepStrictEqual(plain(first), plain(second));
    assert(Object.isFrozen(first));
    assert(Object.isFrozen(first.rules));
    assert(Object.isFrozen(first.rules.extraInningTiebreak));
  } finally {
    Math.random = originalRandom;
  }
  assert.strictEqual(JSON.stringify(context), before);
});

function prepareFixture(context, matchId, matchOrigin, matchType, seed = 82627) {
  const matchContextOption = matchOrigin ? `,matchContext:{matchOrigin:${JSON.stringify(matchOrigin)}}` : "";
  context.run(`
    player=createRepresentativeHighSchoolEntryFixture("ordinary",${seed});
    player.name="Competition rules fixture";
    applyCanonicalPositionProfile(player,"遊擊手",[]);
    player.schoolInvitationState=createDefaultSchoolInvitationState();
    var ruleInvitations=generateSchoolInvitationSet(player,{generationSeed:"rules-${seed}"});
    finalizeSchoolInvitationSelection(player,ruleInvitations.invitations[0].schoolId);
    materializeSelectedHighSchoolRoster(player,{rosterRole:"bench"});
    completeHighSchoolEntry({source:"competition-rules-test"});
    player.highSchoolStep=5;
    applyHighSchoolRoleState("bench");
    pendingHighSchoolMatchSimulationSeed=${seed};
    var rulesMatch=prepareHighSchoolYearOneMatch({
      matchId:${JSON.stringify(matchId)},
      matchType:${JSON.stringify(matchType)}
      ${matchContextOption}
    });
  `);
  return context.json("rulesMatch");
}

test("production Match creation captures official, evaluation, and training snapshots", () => {
  const fixture = makeContext();
  const official = prepareFixture(fixture, "rules-official", "officialCompetition", "final-competition");
  assert.strictEqual(official.ruleSetId, "highSchoolFullGameV1");
  assert.strictEqual(official.regulationInnings, official.rules.regulationInnings);
  const evaluation = prepareFixture(fixture, "rules-evaluation", "developmentMatch", "evaluation-practice");
  assert.strictEqual(evaluation.ruleSetId, "highSchoolFullGameV1");
  const training = prepareFixture(fixture, "rules-training", "trainingCamp", "training-practice");
  assert.strictEqual(training.ruleSetId, "highSchoolTrainingGameV1");
  assert.strictEqual(training.rules.extraInningTiebreak.enabled, false);
});

test("historical seed 82627 exhibition captures full-game rules without activating behavior", () => {
  const fixture = makeContext();
  const match = prepareFixture(fixture, "hs-y1-autumn-exhibition", null, "autumn-exhibition", 82627);
  assert.strictEqual(match.simulationSeed, 82627);
  assert.strictEqual(match.ruleSetId, "highSchoolFullGameV1");
  assert.strictEqual(match.rules.extraInningTiebreak.enabled, true);
  assert.deepStrictEqual(match.runners, [null, null, null]);
  assert.strictEqual(match.inning, 1);
});

test("save normalization preserves captured rules and safely migrates context-limited legacy matches", () => {
  const fixture = makeContext();
  prepareFixture(fixture, "rules-save", "developmentMatch", "evaluation-practice");
  const before = fixture.json("({ruleSetId:rulesMatch.ruleSetId,rules:rulesMatch.rules,warning:rulesMatch.ruleSetWarning})");
  fixture.run("player=normalizeSave(JSON.parse(JSON.stringify(player)));rulesMatch=player.highSchoolMatch;");
  assert.deepStrictEqual(fixture.json("({ruleSetId:rulesMatch.ruleSetId,rules:rulesMatch.rules,warning:rulesMatch.ruleSetWarning})"), before);
  fixture.run(`
    var legacy=JSON.parse(JSON.stringify(player));
    delete legacy.highSchoolMatch.ruleSetId;
    delete legacy.highSchoolMatch.rules;
    delete legacy.highSchoolMatch.ruleSetWarning;
    delete legacy.highSchoolMatch.matchContext;
    legacy.highSchoolMatch.regulationInnings=6;
    player=normalizeSave(legacy);
  `);
  assert.strictEqual(fixture.run("player.highSchoolMatch.ruleSetId"), "highSchoolLegacyFallbackV1");
  assert.strictEqual(fixture.run("player.highSchoolMatch.ruleSetWarning"), "LEGACY_RULESET_CONTEXT_LIMITED");
  assert.strictEqual(fixture.run("player.highSchoolMatch.regulationInnings"), 6);
  assert.strictEqual(fixture.run("player.highSchoolMatch.rules.extraInningTiebreak.enabled"), false);
});

function runGameplayWitness(excludeRules) {
  const fixture = makeContext(excludeRules ? { excludeFiles: ["competition-rules.js"] } : {});
  fixture.run(`
    careerFixture("遊擊手","starter",77001);
    choose("critical_offseason",1);
    var rulesMatch=player.highSchoolMatch;
    playCareerMatchToEnd();
  `);
  return fixture.json(`({
    simulationSeed:rulesMatch.simulationSeed,
    simulationCursor:rulesMatch.simulationCursor,
    scores:rulesMatch.scores,
    lineScore:rulesMatch.lineScore,
    inning:rulesMatch.inning,
    half:rulesMatch.half,
    completed:rulesMatch.completed,
    teamResult:rulesMatch.teamResult,
    simulationLog:rulesMatch.simulationLog,
    gameRecord:rulesMatch.gameRecord
  })`);
}

test("rules metadata leaves representative gameplay and PA/BF accounting unchanged", () => {
  const before = runGameplayWitness(true);
  const after = runGameplayWitness(false);
  assert.deepStrictEqual(after, before);
  const battingPA = Object.values(after.gameRecord.playerLines).reduce((sum, line) => sum + (line.batting?.plateAppearances || 0), 0);
  const pitcherBF = Object.values(after.gameRecord.playerLines).reduce((sum, line) => sum + (line.pitching?.battersFaced || 0), 0);
  assert.strictEqual(battingPA, pitcherBF);
});

console.log(`${passed}/${passed} PASS`);
