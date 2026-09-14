const assert=require("assert");
const {makeContext}=require("./high-school-career-test-context");
const {run,json}=makeContext();
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log("PASS "+name);};
run(`
  function scheduleFixture(type="incomingFriendlyInvitation",sequence=2) {
    careerFixture("二壘手","starter"); choose("critical_offseason",1); player.highSchoolMatch=null;
    const playingTime=JSON.parse(JSON.stringify(ensureHighSchoolYearThreeOpportunity()));
    playingTime.decisionId+="|context-fixture-start";playingTime.plannedUsage.appearanceType="start";
    var offered=offerHighSchoolMatchOpportunity({opportunityType:type,sequence,opponentSchoolId:"hs-y3-final-regional-opponent",
      source:{type:type==="officialCompetitionOpportunity"?"competitionCalendar":"coachNetwork",sourceId:type==="officialCompetitionOpportunity"?playingTime.matchId:"fixture-coach-contact"}});
    return {offered,options:{matchId:playingTime.matchId,eventId:"critical_tournament",matchType:"final-competition",opportunityDecision:playingTime}};
  }
  function acceptAndSchedule(fixture) {
    HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,fixture.offered.opportunityId,"accepted");
    return HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,fixture.offered.opportunityId,getHighSchoolScheduleExecutionContext());
  }
  function startSchedule(type) {var f=scheduleFixture(type);var e=acceptAndSchedule(f);return launchHighSchoolScheduleEntry(e.scheduleEntryId,f.options);}
`);
test("1 real Y1 lifecycle creates and launches followup opportunity",()=>{
  run(`player=createRepresentativeHighSchoolEntryFixture("ordinary",97001); player.name="Schedule career";
    applyCanonicalPositionProfile(player,"游擊手",[]);player.schoolInvitationState=createDefaultSchoolInvitationState();
    var invitations=generateSchoolInvitationSet(player,{generationSeed:"schedule-career-97001"});
    finalizeSchoolInvitationSelection(player,invitations.invitations[0].schoolId);
    materializeSelectedHighSchoolRoster(player,{rosterRole:"bench"});completeHighSchoolEntry({source:"schedule-career-test"});
    player.highSchoolStep=5;applyHighSchoolRoleState("bench");prepareHighSchoolYearOneMatch();playCareerMatchToEnd();
    player.highSchoolStep=7;var m=prepareCurrentHighSchoolYearOneMatch();`);
  assert.strictEqual(run("m.id"),"hs-y1-followup-evaluation-2");
  assert.strictEqual(run("player.highSchoolSchedule.opportunities.length"),1);
  assert.strictEqual(run("player.highSchoolSchedule.entries[0].status"),"inProgress");
  assert.strictEqual(run("m.matchContext.provenance.source"),"developmentSchedule");
  run("playCareerMatchToEnd();var yearOneScheduleSave=JSON.parse(JSON.stringify(player));");
});
test("2 real offer remains offered until acceptance",()=>{run("var f=scheduleFixture()");assert.strictEqual(run("f.offered.status"),"offered");assert.strictEqual(run("player.highSchoolSchedule.entries.length"),0);});
test("3 accepted state survives normalization then schedules",()=>{
  run('HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,f.offered.opportunityId,"accepted");player=normalizeSave(JSON.parse(JSON.stringify(player)));');
  assert.strictEqual(run("player.highSchoolSchedule.opportunities[0].status"),"accepted");
  run("var e=acceptAndSchedule(f)");assert.strictEqual(run("e.status"),"scheduled");
});
test("4 scheduled save/reload retains entry and adapter",()=>{
  const before=json("player.highSchoolSchedule");run("player=normalizeSave(JSON.parse(JSON.stringify(player)))");assert.deepStrictEqual(json("player.highSchoolSchedule"),before);
  run("m=launchHighSchoolScheduleEntry(e.scheduleEntryId,f.options)");assert.strictEqual(run("m.matchContext.scheduleEntryId"),run("e.scheduleEntryId"));
});
test("5 real incoming invitation top offense",()=>{
  run('for(let i=0;i<100&&!isHighSchoolMatchDecisionVisible(m);i++) advanceHighSchoolMatchPlaybackStep(m)');
  assert.strictEqual(run("m.currentDomain"),"offense");assert.strictEqual(run("m.half"),"上");assert.strictEqual(run("getHighSchoolPlayerTeamSide(m)"),"away");
});
test("6 active match reload preserves links and resumes same object",()=>{
  const before=json("m.matchContext");run("saveGame();loadGame();stopHighSchoolMatchPlayback();m=player.highSchoolMatch;");
  assert.deepStrictEqual(json("m.matchContext"),before);
  assert(run("launchHighSchoolScheduleEntry(e.scheduleEntryId,f.options)===m"));
  assert.strictEqual(run("player.highSchoolSchedule.entries[0].status"),"inProgress");
});
test("7 reload does not regenerate opportunity or entry",()=>{
  run("HighSchoolScheduleOpportunity.offerOpportunity(player.highSchoolSchedule,f.offered);HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,f.offered.opportunityId,getHighSchoolScheduleExecutionContext());");
  assert.strictEqual(run("player.highSchoolSchedule.opportunities.length"),1);assert.strictEqual(run("player.highSchoolSchedule.entries.length"),1);
});
test("8 real completion links schedule to GameRecord and history",()=>{
  run("playCareerMatchToEnd()");assert(run("m.completed"));assert.strictEqual(run("player.highSchoolSchedule.entries[0].status"),"completed");
  assert.strictEqual(run("player.highSchoolSchedule.entries[0].gameRecordId"),run("m.gameRecord.gameId"));
  assert.strictEqual(run("player.highSchoolSchedule.entries[0].historyMatchId"),run("player.highSchoolYearThreeMatchHistory[0].matchId"));
  assert(run("MatchGameRecord.assertIntegrity(m.gameRecord)"));
});
test("9 completed reload cannot relaunch",()=>{
  run("player=normalizeSave(JSON.parse(JSON.stringify(player)))");assert.strictEqual(run("player.highSchoolSchedule.entries[0].status"),"completed");
  assert.throws(()=>run("launchHighSchoolScheduleEntry(e.scheduleEntryId,f.options)"),/cannot launch/);
});
test("10 real outgoing invitation bottom offense",()=>{
  run('m=startSchedule("outgoingFriendlyInvitation");for(let i=0;i<300&&!(isHighSchoolMatchDecisionVisible(m)&&m.currentDomain==="offense");i++){if(isHighSchoolMatchDecisionVisible(m)){var choice=getHighSchoolYearOneMatchMomentChoices(m)[0];chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>.62);}else advanceHighSchoolMatchPlaybackStep(m);}');
  assert.strictEqual(run("m.currentDomain"),"offense");assert.strictEqual(run("m.half"),"下");assert.strictEqual(run("getHighSchoolPlayerTeamSide(m)"),"home");
});
test("11 mandatory career stage rejects optional same slot",()=>{
  run('f=scheduleFixture("incomingFriendlyInvitation",1)');assert.throws(()=>run("acceptAndSchedule(f)"),/mandatory/);
  assert.strictEqual(run("player.highSchoolSchedule.entries.length"),0);
});
test("12 official canonical stage schedules and retains priority",()=>{
  run('f=scheduleFixture("officialCompetitionOpportunity",1);e=acceptAndSchedule(f);m=launchHighSchoolScheduleEntry(e.scheduleEntryId,f.options)');
  assert.strictEqual(run("m.matchContext.matchOrigin"),"officialCompetition");
  assert.strictEqual(run("m.matchContext.provenance.sourceId"),"hs-y3-final-competition-1");
});
test("13 legacy direct match still works with empty schedule",()=>{
  run('careerFixture();choose("critical_offseason",1);m=player.highSchoolMatch');
  assert(run("Boolean(m.id)"));assert.strictEqual(run("player.highSchoolSchedule.entries.length"),0);
  run("delete player.highSchoolSchedule;player=normalizeSave(JSON.parse(JSON.stringify(player)))");assert.strictEqual(run("player.highSchoolSchedule.entries.length"),0);
});
test("14 old year entry is retained and cannot launch in new year",()=>{
  run('player=normalizeSave(yearOneScheduleSave);var oldYear=JSON.parse(JSON.stringify(player.highSchoolSchedule));initializeHighSchoolYearTransition(2);player.chapter="青棒第二年";');
  assert.strictEqual(run("player.highSchoolYearTransitionState.currentHighSchoolYear"),2);
  assert(!run('HighSchoolScheduleOpportunity.isOpportunityEligible({...player.highSchoolSchedule.opportunities[0],status:"accepted"},getHighSchoolScheduleExecutionContext(),player.highSchoolSchedule).eligible'));
  assert.deepStrictEqual(json("player.highSchoolSchedule"),json("oldYear"));
});
test("15 scheduled official full game produces canonical CompetitionEvidence",()=>{
  run(`f=scheduleFixture("officialCompetitionOpportunity",1);player.highSchoolSchedule=HighSchoolScheduleOpportunity.emptyState();
    var teamId=player.primaryTeamAssignment.teamId;
    HighSchoolCompetitionFoundation.registerDefinition(player,{competitionId:"schedule-series",competitionType:"school_tournament",entryUnit:"school",level:"high_school"});
    HighSchoolCompetitionFoundation.registerEdition(player,{editionId:"schedule-edition",competitionId:"schedule-series",seasonYear:2033});
    var competitionEntry=HighSchoolCompetitionFoundation.enterCompetition(player,{competitionEditionId:"schedule-edition",teamId});
    HighSchoolCompetitionFoundation.recordParticipation(player,{playerId:"player",competitionEditionId:"schedule-edition",teamId,rosterStatus:"active_roster",participationStatus:"appeared"});
    f.offered=offerHighSchoolMatchOpportunity({...f.offered,competitionRefs:{competitionEntryId:competitionEntry.entryId,competitionEditionId:competitionEntry.competitionEditionId},plannedContext:{competitionEditionId:competitionEntry.competitionEditionId}});
    e=acceptAndSchedule(f);m=launchHighSchoolScheduleEntry(e.scheduleEntryId,f.options);playCareerMatchToEnd();`);
  const records=json("HighSchoolCompetitionEvidence.getEvidence(player)");assert(records.length>0);
  assert(records.every(item=>item.competitionEntryId===run("competitionEntry.entryId")&&item.context.matchId===run("m.id")));
  assert.strictEqual(run("m.gameRecord.competitionEntryId"),run("competitionEntry.entryId"));
  assert(run("HighSchoolCompetitionEvidence.assertIntegrity(player)"));
});
test("16 cancelled entry cannot launch",()=>{run('f=scheduleFixture();e=acceptAndSchedule(f);player.highSchoolSchedule.entries[0].status="cancelled"');assert.throws(()=>run("launchHighSchoolScheduleEntry(e.scheduleEntryId,f.options)"),/cannot launch/);});
test("17 deterministic context and schedule with no simulation cursor consumption",()=>{
  run("m=startSchedule('incomingFriendlyInvitation')");const first=json("({context:m.matchContext,seed:m.simulationSeed,cursor:m.simulationCursor,schedule:player.highSchoolSchedule})");
  run("m=startSchedule('incomingFriendlyInvitation')");assert.deepStrictEqual(json("({context:m.matchContext,seed:m.simulationSeed,cursor:m.simulationCursor,schedule:player.highSchoolSchedule})"),first);
  assert.strictEqual(first.cursor,0);
});
test("18 corrupted save cannot detach or alter active schedule context",()=>{
  assert.throws(()=>run('var corrupt=JSON.parse(JSON.stringify(player));corrupt.highSchoolMatch.id="other";normalizeSave(corrupt)'));
  assert.throws(()=>run('var corrupt=JSON.parse(JSON.stringify(player));corrupt.highSchoolMatch.matchContext.provenance.sourceId="rerolled";normalizeSave(corrupt)'),/intent mismatch/);
});
test("19 wrong competition references rejected before opportunity mutation",()=>{
  run("f=scheduleFixture();var countBefore=player.highSchoolSchedule.opportunities.length;");
  assert.throws(()=>run('offerHighSchoolMatchOpportunity({...f.offered,competitionRefs:{competitionEntryId:"missing",competitionEditionId:"missing"}})'),/canonical competition/);
  assert.strictEqual(run("player.highSchoolSchedule.opportunities.length"),run("countBefore"));
});
console.log(`${passed}/${passed} PASS`);
