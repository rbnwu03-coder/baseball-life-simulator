const assert=require("assert");
const {makeContext}=require("./high-school-career-test-context.js");
const {run,json}=makeContext();
run("careerFixture()");
assert(json("player.schoolInvitationState.selectedSchoolYearRosterIdentity.identity").includes("hs-year-3-age-18"));
assert.strictEqual(json("player.highSchoolNextOpportunity"),null);
const samples=json("player.highSchoolCompetitionEvaluation.sampleCount");
run("choose('critical_offseason',1)");
assert.strictEqual(json("player.highSchoolNextOpportunity.highSchoolYear"),3);
assert.strictEqual(json("player.highSchoolCompetitionEvaluation.sampleCount"),samples);
assert(json("player.developmentState.history.length")>0);
assert.strictEqual(json("player.highSchoolMatch.id"),"hs-y3-final-competition-1");
assert.strictEqual(json("player.highSchoolMatch.rosters.home.lineup.length"),9);
assert.strictEqual(json("player.highSchoolMatch.rosters.away.lineup.length"),9);
assert.strictEqual(json("player.highSchoolMatch.rosters.home.teamRoster.yearIdentity"),"hs-year-3-age-18");
assert.deepStrictEqual(json("player.highSchoolMatch.rosters.home.teamStrengthProfile"),json("TeamStrengthModel.deriveTeamStrengthProfile(player.highSchoolMatch.rosters.home.teamRoster)"));
assert(json("player.highSchoolMatch.rosters.away.teamRoster.teamId").includes("hs-y3"));
assert.strictEqual(json("player.highSchoolNextOpportunity.debug.scoreBreakdown.healthReadiness"),-1);
const preparedDevelopment=json("player.developmentState");
assert.strictEqual(run("chooseHighSchoolYearThreePreparation(1)"),false);
assert.deepStrictEqual(json("player.developmentState"),preparedDevelopment);
const pending=json("player.highSchoolMatch.simulationSeed");
run("saveGame();loadGame()");
assert.strictEqual(json("player.highSchoolMatch.simulationSeed"),pending);
run("finishCareerMatch('strong',true)");
assert.strictEqual(json("player.highSchoolYearThreeMatchHistory.length"),1);
assert.strictEqual(json("player.highSchoolYearThreeMatchHistory[0].highSchoolYear"),3);
assert(json("player.highSchoolYearThreeMatchHistory[0].actualExposure.participated"));
assert(json("player.highSchoolCompetitionEvaluation.appliedMatchIdentities.includes('hs-y3-final-competition-1')"));
const settled=json("player.highSchoolCompetitionEvaluation");
run("applyHighSchoolCompetitionMatchSettlement(player.highSchoolMatch)");
assert.deepStrictEqual(json("player.highSchoolCompetitionEvaluation"),settled);
for(const position of ["投手","捕手"]){
 run(`careerFixture('${position}');choose('critical_offseason',2)`);
 assert.strictEqual(json("player.highSchoolMatch.highSchoolYear"),3);
 if(position==="投手")assert(json("player.highSchoolMatch.gameExposureState.pitcherExposureDeferred"));
 run(`finishCareerMatch('strong',${position!=="投手"})`);
 assert.strictEqual(json("player.highSchoolYearThreeMatchHistory[0].actualExposure.participated"),position!=="投手");
}
console.log("High School Year Three Competition Loop: passed.");
for(const role of ["starter","rotation","bench"]){
 run(`careerFixture('游擊手','${role}');choose('critical_offseason',1);playCareerMatchToEnd()`);
 assert(json("player.highSchoolMatch.completed"));
 assert(json("player.highSchoolMatch.eventSettlementApplied"));
 assert.strictEqual(json("player.criticalYearStep"),2);
 assert.strictEqual(json("player.highSchoolYearThreeMatchHistory.length"),1);
 assert(json("player.highSchoolMatch.simulationLog.filter(e=>e.type==='plateAppearance').length")>20);
 assert(json("player.highSchoolMatch.matchExperience.settled"));
 assert.strictEqual(json("player.highSchoolMatch.role"),role);
 if(role==="starter")assert.strictEqual(json("player.highSchoolMatch.gameExposureState.appearanceType"),"start");
 if(role==="bench"){
  assert.strictEqual(json("player.highSchoolMatch.gameExposureState.appearanceType"),"noAppearance");
  assert.strictEqual(json("player.highSchoolYearThreeMatchHistory[0].actualExposure.participated"),false);
 }
}
console.log("Y3 production playback / settlement: starter, rotation, bench PASS.");

run("careerFixture();choose('critical_offseason',1);advanceHighSchoolMatchPlaybackStep();saveGame();loadGame()");
const midMatch=json("player");
run("playCareerMatchToEnd()");
const first=json("({history:player.highSchoolYearThreeMatchHistory,evaluation:player.highSchoolCompetitionEvaluation,log:player.highSchoolMatch.simulationLog,development:player.developmentState})");
run(`stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;player=normalizeSave(${JSON.stringify(midMatch)});playCareerMatchToEnd()`);
assert.deepStrictEqual(json("({history:player.highSchoolYearThreeMatchHistory,evaluation:player.highSchoolCompetitionEvaluation,log:player.highSchoolMatch.simulationLog,development:player.developmentState})"),first);
run("saveGame();loadGame();applyHighSchoolCompetitionMatchSettlement(player.highSchoolMatch)");
assert.deepStrictEqual(json("player.highSchoolCompetitionEvaluation"),first.evaluation);

run("careerFixture('游擊手','starter');player.body.pain=15;player.body.injuryRisk=15;choose('critical_offseason',2);playCareerMatchToEnd()");
assert.strictEqual(json("player.highSchoolYearThreeMatchHistory[0].actualExposure.participated"),false);
assert.strictEqual(json("HighSchoolCareerEvaluation.derive(player).performanceProof.sampleCount"),0);
console.log("Y3 mid-match deterministic reload / exactly once / health unavailability: PASS.");
