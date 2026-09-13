const assert=require("assert");
const {makeContext}=require("./high-school-career-test-context");
const {run,json}=makeContext();
run(`
  function contextFixture(origin="awayInvitationFriendly",started=true,extra={}) {
    careerFixture("二壘手","starter"); choose("critical_offseason",1);
    player.highSchoolMatch=null;
    const opportunity=JSON.parse(JSON.stringify(ensureHighSchoolYearThreeOpportunity()));
    if(started) {opportunity.decisionId+="|context-fixture-start"; opportunity.plannedUsage.appearanceType="start";}
    const options={matchId:opportunity.matchId,eventId:"critical_tournament",highSchoolYear:3,
      matchType:"final-competition",opportunityDecision:opportunity,opponentRosterId:"hs-y3-final-regional-opponent"};
    if(origin) options.matchContext={matchOrigin:origin,provenance:{source:"matchInvitation",sourceId:"context-fixture"},...extra};
    return prepareHighSchoolYearOneMatch(options);
  }
  function contextScoreboard() {return getHighSchoolMatchPresentation(player.highSchoolMatch);}
`);
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log("PASS "+name);};
test("1 real home creation retains player roster in home",()=>{
  run('var m=contextFixture("homeInvitationFriendly")');
  assert(run('m.rosters.home.lineup.some(p=>p.id==="player")'));
  assert.strictEqual(run('getHighSchoolPlayerTeamSide(m)'),"home");
  assert.strictEqual(run('m.matchContext.venueContext.type'),"homeGround");
});
const homeRosters=json("m.rosters"), homeSeed=run("m.simulationSeed");
test("2 real away creation preserves roster strength and RNG stream",()=>{
  run('m=contextFixture()');const rosters=json("m.rosters");
  assert.deepStrictEqual(rosters.away,homeRosters.home);assert.deepStrictEqual(rosters.home,homeRosters.away);
  assert.strictEqual(run("m.simulationSeed"),homeSeed);assert.strictEqual(run("m.simulationCursor"),0);
  assert.strictEqual(run("getHighSchoolPlayerTeamSide(m)"),"away");
});
test("3 player-away top batting decision enters real flow",()=>{
  run('for(let i=0;i<100&&!isHighSchoolMatchDecisionVisible(m);i++) advanceHighSchoolMatchPlaybackStep(m)');
  assert(run('isHighSchoolMatchDecisionVisible(m)'));
  assert.strictEqual(run('m.currentDomain'),"offense");assert.strictEqual(run('m.half'),"上");
  assert.strictEqual(run('contextScoreboard().currentSituation.battingTeamId'),run('m.matchContext.playerTeamId'));
});
test("4 player-away visible single and run update away R/H/inning only",()=>{
  // Canonical AI resolver with explicit sample, using the admitted player starter.
  run('m=contextFixture(); advanceHighSchoolPresentationCursor(m);');
  assert.strictEqual(run('getHighSchoolMatchLineupBatter(m,"away").id'),"player");
  const result=run('resolveSimulatedHighSchoolPlateAppearance(m,()=>.7,{allowPlayer:true}).result');
  assert.strictEqual(result,"single");
  assert.strictEqual(run('contextScoreboard().scoreboard.away.hits'),0);
  run('advanceHighSchoolPresentationCursor(m)');assert.strictEqual(run('contextScoreboard().scoreboard.away.hits'),1);
  run(`for(let i=0;i<3;i++) {
    const batter=getHighSchoolMatchLineupBatter(m,"away");
    const before={outs:m.outs,scores:{...m.scores},runners:m.runners.slice()};
    const facts=applyHighSchoolSimulatedPlateAppearance(m,"walk",batter.id,"away");
    recordHighSchoolMatchSimulationEvent(m,{type:"plateAppearance",result:"walk",batterId:batter.id,offenseTeam:"away",inning:m.inning,half:m.half,
      before,after:{outs:m.outs,scores:{...m.scores},runners:m.runners.slice()},scoringRunnerIds:facts.scoringRunnerIds,runnerChanges:facts.runnerChanges});
    advanceHighSchoolMatchBattingOrder(m,"away"); advanceHighSchoolPresentationCursor(m);
  }`);
  assert.strictEqual(run('contextScoreboard().scoreboard.away.cells[0]'),1);
  assert.strictEqual(run('contextScoreboard().scoreboard.away.visibleTotal'),1);
  assert.strictEqual(run('contextScoreboard().scoreboard.home.hits+contextScoreboard().scoreboard.home.visibleTotal'),0);
  assert.strictEqual(run('contextScoreboard().scoreboard.away.name'),"高中球隊");
});
test("5 GameRecord player line and away totals use actual team identity",()=>{
  assert.strictEqual(run('m.gameRecord.playerLines.player.teamId'),run('m.matchContext.awayTeamId'));
  assert.strictEqual(run('m.gameRecord.playerLines.player.batting.H'),1);
  assert.strictEqual(run('m.gameRecord.totals.away.runs'),1);
  assert.strictEqual(run('m.gameRecord.totals.home.runs'),0);
});
test("6 save/reload retains away context and cursor with future result",()=>{
  run('resolveSimulatedHighSchoolPlateAppearance(m,()=>.99,{allowPlayer:true})');
  const before=json('m.matchContext'),board=json('contextScoreboard().scoreboard'),cursor=run('m.presentedEventCursor');
  run('saveGame();loadGame();stopHighSchoolMatchPlayback();m=player.highSchoolMatch;');
  assert.deepStrictEqual(json('m.matchContext'),before);assert.deepStrictEqual(json('contextScoreboard().scoreboard'),board);
  assert.strictEqual(run('m.presentedEventCursor'),cursor);
});
test("7 real away full match includes bottom-half defensive decisions",()=>{
  run('m=contextFixture();playCareerMatchToEnd()');
  assert(run('m.completed'));
  assert(run('m.simulationLog.some(e=>e.type==="meaningfulMomentReached"&&e.domain==="defense"&&e.half==="下")'));
  assert(run('m.simulationLog.filter(e=>e.type==="meaningfulMomentReached"&&e.domain==="offense").every(e=>e.half==="上")'));
  const expected=run('new Set(m.simulationLog.filter(e=>e.type==="halfInningEnd"&&e.half==="下").map(e=>e.inning)).size');
  assert.strictEqual(run('deriveHighSchoolMatchActualExposure(m).defensiveInnings'),expected);
  assert(run('MatchGameRecord.assertIntegrity(m.gameRecord)'));
});
test("8 player-away winning result uses player team ID",()=>{
  // Controlled final scoreboard still goes through canonical PA and finalization.
  run('m=contextFixture();resolveSimulatedHighSchoolPlateAppearance(m,()=>.99,{allowPlayer:true});m.inning=7;m.half="下";m.offenseTeam="home";m.defenseTeam="away";m.outs=0;for(let i=0;i<3;i++)resolveSimulatedHighSchoolPlateAppearance(m,()=>.01);scoreboardBoundary=m.simulationLog.length;m.presentedEventCursor=scoreboardBoundary;for(let i=0;i<40&&!m.completed;i++)advanceHighSchoolMatchPlaybackStep(m);');
  assert(run('m.completed'));assert.strictEqual(run('m.gameRecord.result.winnerTeamId'),run('m.matchContext.playerTeamId'));
  assert(run('m.teamResult.includes("球隊勝利")'));
});
test("9 player-home loss winner belongs to opponent",()=>{
  run('m=contextFixture("homeInvitationFriendly");resolveSimulatedHighSchoolPlateAppearance(m,()=>.99);m.inning=7;m.half="下";m.offenseTeam="home";m.defenseTeam="away";m.outs=0;for(let i=0;i<3;i++)resolveSimulatedHighSchoolPlateAppearance(m,()=>.01,{allowPlayer:true});m.presentedEventCursor=m.simulationLog.length;for(let i=0;i<40&&!m.completed;i++)advanceHighSchoolMatchPlaybackStep(m);');
  assert(run('m.completed'));assert.strictEqual(run('m.gameRecord.result.winnerTeamId'),run('m.matchContext.opponentTeamId'));
  assert(run('m.teamResult.includes("球隊落敗")'));
});
test("10 explicit official assignment survives creation, reuse and reload",()=>{
  run('m=contextFixture("officialCompetition",true,{homeTeamId:"hs-y3-final-regional-opponent",awayTeamId:player.schoolInvitationState.selectedSchoolId,assignmentSource:"competitionSchedule",scheduleEntryId:"official-game-1",provenance:{source:"competitionSchedule",sourceId:"official-game-1"}})');
  const before=json('m.matchContext');run('prepareCurrentHighSchoolYearOneMatch();player=normalizeSave(JSON.parse(JSON.stringify(player)));m=player.highSchoolMatch;');
  assert.deepStrictEqual(json('m.matchContext'),before);assert.strictEqual(run('getHighSchoolPlayerTeamSide(m)'),"away");
});
test("11 legacy match without context normalizes to historical home",()=>{
  run('m=contextFixture(null);delete m.matchContext;player=normalizeSave(JSON.parse(JSON.stringify(player)));m=player.highSchoolMatch;');
  assert.strictEqual(run('getHighSchoolPlayerTeamSide(m)'),"home");assert.strictEqual(run('m.matchContext.assignmentSource'),"legacyFallback");
});
test("12 real away substitute admission uses away incumbent",()=>{
  run('m=contextFixture("awayInvitationFriendly",false);playCareerMatchToEnd()');
  assert(run('m.simulationLog.some(e=>e.type==="playerEntry"&&e.half==="上")'));
  assert(run('m.rosters.away.lineup.some(p=>p.id==="player")'));
  assert(run('m.completed&&MatchGameRecord.assertIntegrity(m.gameRecord)'));
});
test("13 home flow still completes and scoreboard equals canonical truth",()=>{
  run('m=contextFixture("homeInvitationFriendly");playCareerMatchToEnd()');
  assert(run('m.completed'));assert(run('m.simulationLog.some(e=>e.type==="meaningfulMomentReached"&&e.domain==="offense"&&e.half==="下")'));
  for(const side of ["home","away"])for(const stat of ["hits","errors"])assert.strictEqual(run(`contextScoreboard().scoreboard.${side}.${stat}`),run(`m.gameRecord.totals.${side}.${stat}`));
});
test("14 explicit saved team IDs survive missing-context migration",()=>{
  run('m=contextFixture();Object.assign(m,{homeTeamId:m.matchContext.homeTeamId,awayTeamId:m.matchContext.awayTeamId,playerTeamId:m.matchContext.playerTeamId,opponentTeamId:m.matchContext.opponentTeamId});delete m.matchContext;player=normalizeSave(JSON.parse(JSON.stringify(player)));m=player.highSchoolMatch;');
  assert.strictEqual(run('getHighSchoolPlayerTeamSide(m)'),"away");
  assert.strictEqual(run('m.matchContext.assignmentSource'),"explicitAssignment");
});
test("15 repeated creation cannot reassign an existing match or consume RNG",()=>{
  run('m=contextFixture()');const before=run('JSON.stringify(m)');
  run('prepareHighSchoolYearOneMatch({matchId:m.id,matchContext:m.matchContext})');
  assert.strictEqual(run('JSON.stringify(m)'),before);
  assert.throws(()=>run('prepareHighSchoolYearOneMatch({matchId:m.id,matchContext:{homeTeamId:m.matchContext.playerTeamId,awayTeamId:m.matchContext.opponentTeamId}})'));
  assert.strictEqual(run('JSON.stringify(m)'),before);
});
test("16 conflicting saved match identity is rejected",()=>{
  assert.throws(()=>run('var bad=JSON.parse(JSON.stringify(player));bad.highSchoolMatch.matchContext.matchId="another-game";normalizeSave(bad)'));
});
console.log(`Match context production integration: ${passed}/${passed} PASS`);
