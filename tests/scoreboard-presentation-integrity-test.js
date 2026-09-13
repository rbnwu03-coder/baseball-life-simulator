const assert = require("assert");
const { makeContext } = require("./high-school-career-test-context");

function makeScoreboardContext() {
  const ctx = makeContext();
  ctx.run(`
    function scoreboardFixture() {
      careerFixture("二壘手", "starter"); choose("critical_offseason", 1);
      return player.highSchoolMatch;
    }
    function scoreboardPA(result) {
      const m = player.highSchoolMatch, side = m.offenseTeam;
      const batter = getHighSchoolMatchLineupBatter(m, side);
      const before = { outs: m.outs, runners: m.runners.slice(), scores: {...m.scores} };
      const facts = applyHighSchoolSimulatedPlateAppearance(m, result, batter.id, side);
      recordHighSchoolMatchSimulationEvent(m, {
        type: "plateAppearance", inning: m.inning, half: m.half, offenseTeam: side,
        batterId: batter.id, result, before,
        runnerChanges: facts.runnerChanges, scoringRunnerIds: facts.scoringRunnerIds,
        thirdOutResolution: facts.thirdOutResolution,
        after: { outs: m.outs, runners: m.runners.slice(), scores: {...m.scores} }
      });
      advanceHighSchoolMatchBattingOrder(m, side);
      return m.simulationLog.length;
    }
    function scoreboardView() { return getHighSchoolMatchPresentation(player.highSchoolMatch); }
    function scoreboardReveal() { return advanceHighSchoolPresentationCursor(player.highSchoolMatch); }
    function scoreboardCatchUp() { player.highSchoolMatch.presentedEventCursor = player.highSchoolMatch.simulationLog.length; }
    scoreboardFixture();
  `);
  return ctx;
}

function main() {
  const {run, json} = makeScoreboardContext();
  let passed = 0;
  function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
  const board = () => json("scoreboardView().scoreboard");
  test("1 notStarted uses ellipsis; cursor zero leaks no hidden snapshot", () => {
    assert(board().away.cells.every(x => x === "…"));
    assert.strictEqual(run("getHighSchoolPresentationSnapshot(player.highSchoolMatch)"), null);
  });
  test("2 entered half starts at zero", () => {
    run("scoreboardReveal()"); assert.strictEqual(board().away.cells[0], 0);
    assert.strictEqual(board().away.cellStates[0], "live");
  });
  run('var e1 = scoreboardPA("single"), e2 = scoreboardPA("homeRun"), e3 = scoreboardPA("out"), e4 = scoreboardPA("double");');
  test("3 BUG-SCOREBOARD-FUTURE-LEAK-001 hidden same-half H/R excluded", () => {
    assert.strictEqual(board().away.hits, 0); assert.strictEqual(board().away.total, 0);
    assert.strictEqual(run("player.highSchoolMatch.gameRecord.totals.away.hits"), 3);
  });
  test("4 BUG-SCOREBOARD-H-DELAY-001 E1 visible single immediately H+1", () => {
    run("scoreboardReveal()"); assert.strictEqual(board().away.hits, 1);
    assert.strictEqual(board().visibleEventCount, run("e1"));
    assert.strictEqual(board().away.cells[0], 0);
  });
  test("5 E1 cannot reveal E2 HR or E4 double", () => {
    assert.strictEqual(board().away.total, 0); assert.strictEqual(board().away.hits, 1);
    assert(!run('scoreboardView().feed.some(e => e.text.includes("全壘打") || e.text.includes("二壘安打"))'));
  });
  test("6 BUG-SCOREBOARD-INNING-RUN-DELAY-001 E2 atomically updates R/inning/H", () => {
    run("scoreboardReveal()"); const b = board();
    assert.strictEqual(b.visibleEventCount, run("e2"));
    assert.strictEqual(b.away.total, 2); assert.strictEqual(b.away.cells[0], 2);
    assert.strictEqual(b.away.hits, 2); assert.strictEqual(b.away.cellStates[0], "live");
    assert.deepStrictEqual(json("scoreboardView().bases"), [false, false, false]);
    assert.strictEqual(run("scoreboardView().currentSituation.score.away"), 2);
  });
  test("7 official non-hit out changes outs without H", () => {
    run("scoreboardReveal()"); assert.strictEqual(board().away.hits, 2);
    assert.strictEqual(run("scoreboardView().currentSituation.outs"), 1);
  });
  test("8 second boundary reveals double exactly once", () => {
    run("scoreboardReveal()"); assert.strictEqual(board().away.hits, 3);
    assert.strictEqual(board().away.total, 2);
    assert.strictEqual(board().visibleEventCount, run("e4"));
  });
  test("9 projection frozen including totals, cells and trace", () => {
    assert(run("(() => {const p=scoreboardView().scoreboard;return Object.isFrozen(p)&&Object.isFrozen(p.away)&&Object.isFrozen(p.away.runs)&&Object.isFrozen(p.away.cellStates)&&Object.isFrozen(p.innings)&&p.visibleThroughEventId.endsWith('|'+(e4-1));})()"));
  });
  test("10 render rerun is pure and deterministic without RNG", () => {
    const before = run("JSON.stringify(player.highSchoolMatch)");
    const expected = board();
    run("var originalRandom = Math.random; Math.random = () => {throw new Error('projection RNG');};");
    try { for (let i = 0; i < 5; i++) { run("renderHighSchoolLineScore(scoreboardView())"); assert.deepStrictEqual(board(), expected); } }
    finally { run("Math.random = originalRandom"); }
    assert.strictEqual(run("JSON.stringify(player.highSchoolMatch)"), before);
  });
  test("11 half completion retains visible final runs", () => {
    run('scoreboardPA("out"); scoreboardPA("out"); scoreboardCatchUp(); advanceHighSchoolMatchAfterHalfInning(player.highSchoolMatch); scoreboardReveal();');
    assert.strictEqual(board().away.cells[0], 2);
    assert.strictEqual(board().away.cellStates[0], "completed");
  });
  test("12 new half starts at zero; future inning stays ellipsis", () => {
    run("scoreboardReveal()"); assert.strictEqual(board().home.cells[0], 0);
    assert.strictEqual(board().away.cells[0], 2);
    assert.strictEqual(board().away.cells[1], "…");
  });
  test("13 bottom hit/run attribution", () => {
    run('scoreboardPA("homeRun"); scoreboardReveal();');
    assert.strictEqual(board().home.hits, 1); assert.strictEqual(board().home.cells[0], 1);
    assert.strictEqual(board().away.total, 2);
  });
  test("14 save/reload keeps revealed prefix with future PA", () => {
    run('scoreboardPA("double")'); const expected = board();
    run("player = normalizeSave(JSON.parse(JSON.stringify(player)))");
    assert.deepStrictEqual(board(), expected);
    assert(run("player.highSchoolMatch.presentedEventCursor < player.highSchoolMatch.simulationLog.length"));
  });
  test("15 fully revealed R/H/inning totals equal official GameRecord", () => {
    run("scoreboardCatchUp()"); const b = board(), canonical = json("MatchGameRecord.getScoreboard(player.highSchoolMatch.gameRecord)");
    for (const side of ["away", "home"]) {
      assert.strictEqual(b[side].total, canonical.totals[side].runs);
      assert.strictEqual(b[side].hits, canonical.totals[side].hits);
      for (const line of canonical.inningLines) assert.strictEqual(b[side].runs[line.inning - 1], line[side + "Runs"]);
    }
  });
  test("16 completed simulation cannot expose future results or extra innings", () => {
    const before = board();
    run('var boundary = player.highSchoolMatch.presentedEventCursor; scoreboardPA("homeRun"); player.highSchoolMatch.completed = true; player.highSchoolMatch.inning = 10;');
    assert.deepStrictEqual(board(), before); assert.strictEqual(run("scoreboardView().completed"), false);
  });
  test("17 extra innings appear only at visible transition", () => {
    run('player.highSchoolMatch.completed=false; recordHighSchoolMatchSimulationEvent(player.highSchoolMatch,{type:"sideChange",inning:10,half:"上",outs:0,runners:[null,null,null],scores:player.highSchoolMatch.scores}); scoreboardCatchUp();');
    assert.strictEqual(board().innings.length, 10); assert.strictEqual(board().away.cells[9], 0);
    assert.strictEqual(board().home.cells[9], "…");
  });
  test("18 old reveal bookkeeping is not another visibility authority", () => {
    const expected = board(); run("player.highSchoolMatch.scoreboardRevealHalfIndex=999"); assert.deepStrictEqual(board(), expected);
  });
  test("19 official hit/error classification reused, no scoring reinterpretation", () => {
    const GameRecord = require("../match-game-record");
    for (const result of ["single", "double", "triple", "homeRun", "walk", "error", "fieldersChoice", "strikeout"]) {
      const e = {type: "plateAppearance", result, sequence: 0, inning: 1, half: "上"};
      const r = GameRecord.createGameRecord({id: "classification"}); GameRecord.recordEvent(r, e);
      assert.deepStrictEqual(GameRecord.getScoreboardFromEvents({id: "classification"}, [e]).totals, r.totals);
    }
  });
  test("20 stable identity deduplicates official events", () => {
    const R = require("../match-game-record"), e = {type: "plateAppearance", result: "single", sequence: 4, inning: 1, half: "上"};
    assert.strictEqual(R.getScoreboardFromEvents({id: "dup"}, [e, e]).totals.away.hits, 1);
  });
  test("21 DOM live H and numeric inning cells; ellipsis only notStarted", () => {
    run('scoreboardFixture(); scoreboardReveal(); scoreboardPA("homeRun"); scoreboardReveal();');
    const html = run("renderHighSchoolLineScore(scoreboardView())");
    assert(html.includes('<td>1</td>')); assert(html.includes('line-score-total">1</td><td>1</td><td>0</td>'));
    assert(html.includes('aria-label="本半局尚未播放"')); assert(!html.includes('aria-label="本半局進行中"'));
  });
  test("22 canonical 3:1 / H7 remains visible 1:0 / H3 at saved prefix", () => {
    // Isolated ledger fixture: projection consumes official events, not scores.
    run(`scoreboardFixture();
      var m = player.highSchoolMatch;
      function ledgerHit() { recordHighSchoolMatchSimulationEvent(m,{type:"plateAppearance",result:"single",inning:1,half:"上",batterId:m.rosters.away.lineup[0].id}); }
      for(let i=0;i<3;i++) ledgerHit();
      scoreHighSchoolMatchRunner(m,m.rosters.away.lineup[0].id,"away","single");
      scoreboardCatchUp(); var savedBoundary=m.presentedEventCursor;
      for(let i=0;i<4;i++) ledgerHit();
      for(let i=0;i<2;i++) scoreHighSchoolMatchRunner(m,m.rosters.away.lineup[0].id,"away","single");
      m.half="下";
      scoreHighSchoolMatchRunner(m,m.rosters.home.lineup[0].id,"home","single");`);
    assert.strictEqual(run("m.gameRecord.totals.away.hits"),7);
    assert.deepStrictEqual(json("m.scores"),{home:1,away:3});
    assert.strictEqual(board().away.hits,3); assert.strictEqual(board().away.total,1);
    assert.strictEqual(board().home.total,0); assert.strictEqual(board().home.cells[0],"…");
    assert.strictEqual(board().visibleEventCount,run("savedBoundary"));
  });
  console.log(`Scoreboard presentation integrity: ${passed}/${passed} PASS`);
}
if (require.main === module) main();
module.exports = {makeScoreboardContext};
