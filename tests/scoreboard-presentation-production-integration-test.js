const assert = require("assert");
const {makeScoreboardContext} = require("./scoreboard-presentation-integrity-test");
const {run, json} = makeScoreboardContext();
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const board = () => json("scoreboardView().scoreboard");
run("scoreboardReveal()");
test("1 real AI PA single immediately visible H", () => {
  assert.strictEqual(run("resolveSimulatedHighSchoolPlateAppearance(player.highSchoolMatch,()=>.7).result"), "single");
  assert.strictEqual(board().away.hits, 0);
  run("scoreboardReveal()"); assert.strictEqual(board().away.hits, 1);
});
test("2 real scoring PA hidden until presentation advance", () => {
  assert.strictEqual(run("resolveSimulatedHighSchoolPlateAppearance(player.highSchoolMatch,()=>.99).result"), "homeRun");
  assert.strictEqual(board().away.total, 0); assert.strictEqual(board().away.hits, 1);
  assert.strictEqual(run("player.highSchoolMatch.scores.away"), 2);
});
test("3 next step commits R/H/inning/bases/feed together", () => {
  run("scoreboardReveal()"); const b = board();
  assert.strictEqual(b.away.total, 2); assert.strictEqual(b.away.hits, 2); assert.strictEqual(b.away.cells[0], 2);
  assert.deepStrictEqual(json("scoreboardView().bases"), [false,false,false]);
  assert(run('scoreboardView().feed.at(-1).text.includes("全壘打")'));
  assert.strictEqual(run("scoreboardView().currentSituation.score.away"), 2);
});
test("4 half continues with numeric live cell", () => {
  assert.strictEqual(board().away.cellStates[0], "live"); assert.strictEqual(run("scoreboardView().currentSituation.outs"), 0);
});
test("5 actual save/load keeps mid-half boundary against future AI PA", () => {
  run("resolveSimulatedHighSchoolPlateAppearance(player.highSchoolMatch,()=>.9)");
  const expected = board(); run("saveGame(); loadGame(); stopHighSchoolMatchPlayback();");
  assert.deepStrictEqual(board(), expected); assert.strictEqual(board().away.hits, 2);
});
test("6 repeated DOM render preserves entire match including RNG and cursor", () => {
  const before = run("JSON.stringify(player.highSchoolMatch)");
  for (let i=0; i<8; i++) run("renderHighSchoolLineScore(scoreboardView())");
  assert.strictEqual(run("JSON.stringify(player.highSchoolMatch)"), before);
});
test("7 real half-inning completion keeps final numeric count", () => {
  run("scoreboardReveal(); for(let i=0;i<3;i++) resolveSimulatedHighSchoolPlateAppearance(player.highSchoolMatch,()=>.01); scoreboardCatchUp(); advanceHighSchoolMatchAfterHalfInning(player.highSchoolMatch); scoreboardReveal();");
  assert.strictEqual(board().away.cells[0], 2); assert.strictEqual(board().away.cellStates[0], "completed");
  assert.strictEqual(run("scoreboardView().currentSituation.outs"), 3);
});
test("8 real side change starts opposite half at zero", () => {
  run("scoreboardReveal()"); assert.strictEqual(board().home.cells[0], 0);
  assert.strictEqual(board().away.cells[0], 2); assert.strictEqual(run("scoreboardView().currentSituation.outs"), 0);
});

let completed;
test("9 interactive decision pending reveals no result; settled outcome is atomic", () => {
  run("scoreboardFixture()");
  const result = json(`(() => {
    const m=player.highSchoolMatch; let ticks=0, decisions=0, settled=0;
    while(!m.completed && ticks++<2500) {
      if(pendingYouthSeasonOutcome) continueYouthSeasonOutcome();
      if(isHighSchoolMatchDecisionVisible(m)) {
        decisions++;
        const before=JSON.stringify(m), visible=JSON.stringify(scoreboardView().scoreboard);
        renderHighSchoolLineScore(scoreboardView());
        if(before!==JSON.stringify(m)||visible!==JSON.stringify(scoreboardView().scoreboard)) throw new Error("pending decision render mutation");
        const choice=getHighSchoolYearOneMatchMomentChoices(m)[0];
        chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>.62);
        const view=scoreboardView(), prefix=m.simulationLog.slice(0,m.presentedEventCursor);
        const last=prefix.findLast(e=>e.type==='plateAppearance');
        if(last) {
          const official=MatchGameRecord.getScoreboardFromEvents({id:m.id},prefix);
          for(const side of ['home','away']) if(view.scoreboard[side].hits!==official.totals[side].hits||view.currentSituation.score[side]!==official.totals[side].runs) throw new Error('settled decision projection mismatch');
          settled++;
        }
      } else advanceHighSchoolMatchPlaybackStep(m);
    }
    return {ticks,decisions,settled,completed:m.completed,cursor:m.presentedEventCursor,length:m.simulationLog.length,
      visible:scoreboardView().scoreboard,canonical:MatchGameRecord.getScoreboard(m.gameRecord)};
  })()`);
  assert(result.completed); assert(result.decisions>0); assert(result.settled>0); completed=result;
});
test("10 real full match catch-up equals canonical R/H/E and inning lines", () => {
  assert.strictEqual(completed.cursor, completed.length); assert(completed.visible.completed);
  for(const side of ["home","away"]) {
    for(const stat of ["hits","errors"]) assert.strictEqual(completed.visible[side][stat],completed.canonical.totals[side][stat]);
    assert.strictEqual(completed.visible[side].total,completed.canonical.totals[side].runs);
    for(const line of completed.canonical.inningLines) assert.strictEqual(completed.visible[side].runs[line.inning-1],line[side+"Runs"]);
  }
});
test("11 completed match replay cannot reveal final score before final play", () => {
  const r=json(`(() => {const m=player.highSchoolMatch; const cursor=m.presentedEventCursor;
    m.presentedEventCursor=m.simulationLog.findIndex(e=>e.type==='plateAppearance');
    const v=scoreboardView(); m.presentedEventCursor=cursor;
    return {completed:v.completed,away:v.scoreboard.away,home:v.scoreboard.home};})()`);
  assert(!r.completed); assert.strictEqual(r.away.hits,0); assert.strictEqual(r.home.hits,0);
  assert.strictEqual(r.away.total+r.home.total,0);
});
test("12 instrumentation trace does not alter projection", () => {
  const expected=board(); run("player.highSchoolMatch.scoreboardDebugTrace=true");
  assert.deepStrictEqual(board(),expected);
  assert(run("MatchGameRecord.assertIntegrity(player.highSchoolMatch.gameRecord)"));
});
test("13 real walk-off lifecycle keeps the winning run behind PA reveal", () => {
  run(`scoreboardFixture();
    Object.assign(player.highSchoolMatch,{inning:7,half:"下",offenseTeam:"home",defenseTeam:"away",outs:0});
    recordHighSchoolMatchSimulationEvent(player.highSchoolMatch,{type:"sideChange",inning:7,half:"下",scores:player.highSchoolMatch.scores});
    scoreboardCatchUp();
    resolveSimulatedHighSchoolPlateAppearance(player.highSchoolMatch,()=>.99,{allowPlayer:true});`);
  assert.strictEqual(board().home.total,0);
  assert.strictEqual(run("isHighSchoolMatchWalkOff(player.highSchoolMatch)"),true);
  run("advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)");
  assert.strictEqual(board().home.total,1); assert.strictEqual(board().home.cells[6],1);
  run("for(let i=0;i<40&&!player.highSchoolMatch.completed;i++) advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)");
  assert(run("player.highSchoolMatch.completed"));
  assert.strictEqual(board().home.total,run("MatchGameRecord.getScoreboard(player.highSchoolMatch.gameRecord).totals.home.runs"));
  assert(board().completed);
});
test("14 final top half may end game without revealing an unplayed bottom half", () => {
  run(`scoreboardFixture();
    Object.assign(player.highSchoolMatch,{inning:6,half:"下",offenseTeam:"home",defenseTeam:"away"});
    resolveSimulatedHighSchoolPlateAppearance(player.highSchoolMatch,()=>.99,{allowPlayer:true});
    Object.assign(player.highSchoolMatch,{inning:7,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0});
    for(let i=0;i<3;i++) resolveSimulatedHighSchoolPlateAppearance(player.highSchoolMatch,()=>.01);
    scoreboardCatchUp();
    for(let i=0;i<40&&!player.highSchoolMatch.completed;i++) advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch);`);
  assert(run("player.highSchoolMatch.completed")); assert(board().completed);
  assert.strictEqual(board().home.cells[6],"…");
  assert.strictEqual(board().home.total,1);
  assert(run("MatchGameRecord.assertIntegrity(player.highSchoolMatch.gameRecord)"));
});
console.log(`Scoreboard production integration: ${passed}/${passed} PASS`);
