const assert = require("assert");
const { makeContext } = require("./high-school-career-test-context");

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`PASS ${name}`); };
const env = makeContext();
env.run(`
  function tiebreakFixture() {
    careerFixture("二壘手", "starter", 82627);
    choose("critical_offseason", 1);
    const match = player.highSchoolMatch;
    match.inning = 7; match.half = "\\u4e0b"; match.outs = 3;
    match.offenseTeam = "home"; match.defenseTeam = "away";
    match.scores = { home: 1, away: 1 };
    match.lineScore = { home: [], away: [] };
    match.runners = [null, null, null];
    match.battingOrderIndex = { home: 0, away: 4 };
    match.currentBatter = getHighSchoolMatchLineupBatter(match, "home").id;
    match.gameRecord = null; match.simulationLog = [];
    match.tiebreakHalfInitialization = null;
    match.pendingGameSettlement = "";
    return match;
  }
  function settleTiebreakPA(result) {
    const match = player.highSchoolMatch;
    const batter = getHighSchoolMatchLineupBatter(match, match.offenseTeam);
    const before = { outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
    const facts = applyHighSchoolSimulatedPlateAppearance(match, result, batter.id, match.offenseTeam);
    const runsBattedIn = match.scores[match.offenseTeam] - before.scores[match.offenseTeam];
    recordHighSchoolMatchPlateAppearanceEvidence(match, batter.id, result, runsBattedIn);
    recordHighSchoolMatchSimulationEvent(match, {
      type: "plateAppearance", inning: match.inning, half: match.half,
      offenseTeam: match.offenseTeam, batterId: batter.id, result, runsBattedIn,
      runnerChanges: facts.runnerChanges, scoringRunnerIds: facts.scoringRunnerIds,
      thirdOutResolution: facts.thirdOutResolution, before,
      after: { outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() }
    });
    advanceHighSchoolMatchBattingOrder(match, match.offenseTeam);
    return { batterId: batter.id, runsBattedIn };
  }
`);
const state = () => env.json(`({ inning:player.highSchoolMatch.inning, half:player.highSchoolMatch.half,
  outs:player.highSchoolMatch.outs, runners:player.highSchoolMatch.runners,
  index:player.highSchoolMatch.battingOrderIndex, batter:player.highSchoolMatch.currentBatter,
  marker:player.highSchoolMatch.tiebreakHalfInitialization, cursor:player.highSchoolMatch.simulationCursor,
  scores:player.highSchoolMatch.scores, ruleSetId:player.highSchoolMatch.ruleSetId,
  events:player.highSchoolMatch.simulationLog, record:player.highSchoolMatch.gameRecord })`);
const totals = record => Object.values(record.playerLines).reduce((a, line) => {
  a.PA += line.batting.PA; a.BF += line.pitching.BF; a.H += line.batting.H;
  a.BB += line.batting.BB; a.E += line.defense.E;
  return a;
}, { PA: 0, BF: 0, H: 0, BB: 0, E: 0 });
const pitcherER = (record, side) => Object.values(record.playerLines)
  .filter(line => line.teamId === record[`${side}TeamId`])
  .reduce((sum, line) => sum + line.pitching.ER, 0);
const beginTop8 = () => { env.run("tiebreakFixture();endHighSchoolMatchHalfInning(player.highSchoolMatch)"); return state(); };

test("top 8 placement uses captured rule and previous live lineup slot", () => {
  const s = beginTop8();
  const match = env.json("player.highSchoolMatch");
  assert.strictEqual(s.ruleSetId, "highSchoolFullGameV1");
  assert.strictEqual(s.inning, 8); assert.strictEqual(s.half, "上"); assert.strictEqual(s.outs, 0);
  assert.strictEqual(s.runners[1], match.rosters.away.lineup[3].id);
  assert.strictEqual(s.batter, match.rosters.away.lineup[4].id);
  assert.strictEqual(s.index.away, 4);
  assert.strictEqual(s.marker.earnedRunTreatment, "deemedReachedOnError");
  assert.strictEqual(s.cursor, 0);
  assert.deepStrictEqual(totals(s.record), { PA: 0, BF: 0, H: 0, BB: 0, E: 0 });
  assert(!s.events.some(event => event.type === "plateAppearance" || event.type === "run"));
});

test("same-half re-entry cannot duplicate placement", () => {
  const before = beginTop8();
  assert.strictEqual(env.run("initializeHighSchoolExtraInningTiebreakHalf(player.highSchoolMatch)"), false);
  assert.deepStrictEqual(state().runners, before.runners);
  assert.deepStrictEqual(state().marker, before.marker);
});

test("wraparound chooses slot 9 without advancing scheduled slot 1", () => {
  env.run("tiebreakFixture();player.highSchoolMatch.battingOrderIndex.away=0;endHighSchoolMatchHalfInning(player.highSchoolMatch)");
  const s = state(), match = env.json("player.highSchoolMatch");
  assert.strictEqual(s.runners[1], match.rosters.away.lineup.at(-1).id);
  assert.strictEqual(s.batter, match.rosters.away.lineup[0].id);
  assert.strictEqual(s.index.away, 0);
});

test("disabled rule and pre-start inning keep bases empty", () => {
  env.run("tiebreakFixture();player.highSchoolMatch.rules=CompetitionRules.resolveMatchCompetitionRules({matchOrigin:'trainingCamp'}).rules;endHighSchoolMatchHalfInning(player.highSchoolMatch)");
  assert.deepStrictEqual(state().runners, [null, null, null]);
  env.run("tiebreakFixture();player.highSchoolMatch.inning=6;endHighSchoolMatchHalfInning(player.highSchoolMatch)");
  assert.strictEqual(state().inning, 7);
  assert.deepStrictEqual(state().runners, [null, null, null]);
});

test("top 8, bottom 8, top 9, bottom 9 each initialize once", () => {
  beginTop8();
  const seen = [state()];
  for (let i = 0; i < 3; i++) {
    env.run("player.highSchoolMatch.outs=3;endHighSchoolMatchHalfInning(player.highSchoolMatch)");
    seen.push(state());
  }
  assert.deepStrictEqual(seen.map(x => [x.inning, x.half]), [[8, "上"], [8, "下"], [9, "上"], [9, "下"]]);
  for (const s of seen) {
    const side = s.half === "上" ? "away" : "home";
    const match = env.json("player.highSchoolMatch");
    const lineup = match.rosters[side].lineup;
    assert.strictEqual(s.runners[1], lineup[(s.index[side] - 1 + lineup.length) % lineup.length].id);
    assert.strictEqual(s.marker.inning, s.inning);
    assert.strictEqual(s.marker.half, s.half);
  }
});

test("normal RBI double scores placed runner but not pitcher ER", () => {
  const initial = beginTop8();
  const pa = env.json("settleTiebreakPA('double')");
  const s = state();
  assert.strictEqual(s.scores.away, initial.scores.away + 1);
  assert.strictEqual(s.runners.includes(initial.marker.runnerId), false);
  assert.strictEqual(pitcherER(s.record, "home"), 0);
  assert.deepStrictEqual(totals(s.record), { PA: 1, BF: 1, H: 1, BB: 0, E: 0 });
  assert.strictEqual(s.record.playerLines[pa.batterId].batting.RBI, 1);
  const run = s.events.find(event => event.type === "run" && event.runnerId === initial.marker.runnerId);
  assert.strictEqual(run.source, "double");
  assert.strictEqual(run.runnerProvenance.origin, "extraInningTiebreak");
  assert.strictEqual(run.pitcherEarnedRunEligible, false);
});

test("mixed HR charges exactly one ER for ordinary batter-runner", () => {
  const initial = beginTop8();
  const pa = env.json("settleTiebreakPA('homeRun')");
  const s = state();
  assert.strictEqual(s.scores.away, initial.scores.away + 2);
  assert.strictEqual(pitcherER(s.record, "home"), 1);
  assert.strictEqual(s.record.playerLines[pa.batterId].batting.HR, 1);
  assert.strictEqual(s.record.playerLines[pa.batterId].batting.RBI, 2);
  const runs = s.events.filter(event => event.type === "run");
  assert.strictEqual(runs.length, 2);
  assert.strictEqual(runs.find(x => x.runnerId === initial.marker.runnerId).pitcherEarnedRunEligible, false);
  assert.strictEqual(runs.find(x => x.runnerId === pa.batterId).pitcherEarnedRunEligible, undefined);
});

test("a later real error keeps placed-runner responsibility without a fake error", () => {
  const initial = beginTop8();
  env.run("settleTiebreakPA('single');scoreHighSchoolMatchRunner(player.highSchoolMatch,player.highSchoolMatch.runners[2],'away','error');player.highSchoolMatch.runners[2]=null;syncHighSchoolMatchPlayerRunnerLocation(player.highSchoolMatch)");
  const s = state();
  const run = s.events.find(event => event.type === "run" && event.runnerId === initial.marker.runnerId);
  assert.strictEqual(run.source, "error");
  assert.strictEqual(run.runnerProvenance.earnedRunTreatment, "deemedReachedOnError");
  assert.strictEqual(run.pitcherEarnedRunEligible, false);
  assert.strictEqual(s.scores.away, initial.scores.away + 1);
  assert.strictEqual(pitcherER(s.record, "home"), 0);
});

test("placed runner retains responsibility while advancing and never reappears after scoring", () => {
  const initial = beginTop8();
  env.run("settleTiebreakPA('single')");
  assert.strictEqual(state().runners[2], initial.marker.runnerId);
  assert.strictEqual(state().marker.runnerResponsibilityActive, true);
  env.run("saveGame();var tiebreakRenderer=showCurrentEvent;try{showCurrentEvent=()=>{};loadGame();}finally{showCurrentEvent=tiebreakRenderer;}");
  assert.strictEqual(state().runners[2], initial.marker.runnerId);
  env.run("settleTiebreakPA('double')");
  assert.strictEqual(pitcherER(state().record, "home"), 0);
  assert.strictEqual(state().marker.runnerResponsibilityActive, false);
  env.run("saveGame();var tiebreakRenderer=showCurrentEvent;try{showCurrentEvent=()=>{};loadGame();}finally{showCurrentEvent=tiebreakRenderer;}");
  const after = state();
  assert.strictEqual(env.run("initializeHighSchoolExtraInningTiebreakHalf(player.highSchoolMatch)"), false);
  assert.deepStrictEqual(state().runners, after.runners);
});

test("productive out advances the placed runner without scoring or losing provenance", () => {
  const initial = beginTop8();
  env.run("settleTiebreakPA('productiveOut')");
  const s = state();
  assert.strictEqual(s.outs, 1);
  assert.strictEqual(s.runners[2], initial.marker.runnerId);
  assert.strictEqual(s.scores.away, initial.scores.away);
  assert.strictEqual(s.marker.runnerResponsibilityActive, true);
  assert.deepStrictEqual(totals(s.record), { PA: 1, BF: 1, H: 0, BB: 0, E: 0 });
});

test("immediate placement save/load preserves identity and never draws RNG", () => {
  const before = beginTop8();
  env.run("saveGame();var tiebreakRenderer=showCurrentEvent;try{showCurrentEvent=()=>{};loadGame();}finally{showCurrentEvent=tiebreakRenderer;}");
  const after = state();
  for (const key of ["inning", "half", "outs", "runners", "index", "batter", "marker", "cursor"]) assert.deepStrictEqual(after[key], before[key]);
  assert.strictEqual(env.run("initializeHighSchoolExtraInningTiebreakHalf(player.highSchoolMatch)"), false);
});

test("a tied bottom-8 placed runner can score a normal walk-off", () => {
  beginTop8();
  env.run("player.highSchoolMatch.outs=3;endHighSchoolMatchHalfInning(player.highSchoolMatch)");
  const before = state();
  assert.strictEqual(before.half, "下");
  env.run("settleTiebreakPA('double')");
  assert.strictEqual(env.run("isHighSchoolMatchWalkOff(player.highSchoolMatch)"), true);
  assert.strictEqual(pitcherER(state().record, "away"), 0);
  env.run("for(let i=0;i<30&&!player.highSchoolMatch.pendingGameSettlement;i++)advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)");
  assert.strictEqual(env.run("player.highSchoolMatch.inning"), 8);
  assert.strictEqual(env.run("player.highSchoolMatch.pendingGameSettlement"), "walkOff");
});

test("completed top extra half does not initialize an unnecessary bottom half", () => {
  beginTop8();
  env.run("player.highSchoolMatch.scores.home=3;player.highSchoolMatch.outs=3;");
  env.run("for(let i=0;i<30&&!player.highSchoolMatch.pendingGameSettlement;i++)advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)");
  const s = state();
  assert.strictEqual(s.inning, 8);
  assert.strictEqual(s.half, "上");
  assert.strictEqual(env.run("player.highSchoolMatch.pendingGameSettlement"), "completedHalf");
  assert(!s.events.some(event => event.type === "sideChange" && event.inning === 8 && event.half === "下"));
});

console.log(`${passed}/${passed} PASS`);
