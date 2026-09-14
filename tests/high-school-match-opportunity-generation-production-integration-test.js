const assert=require("assert"),{makeContext}=require("./high-school-career-test-context");
const {run,json}=makeContext();let passed=0;const test=(name,fn)=>{fn();passed++;console.log("PASS "+name);};
run(`
  function generationFixture(sequence=2) {
    careerFixture("二壘手","starter");choose("critical_offseason",1);player.highSchoolMatch=null;
    var playingTime=JSON.parse(JSON.stringify(ensureHighSchoolYearThreeOpportunity()));
    playingTime.decisionId+="|context-fixture-start";playingTime.plannedUsage.appearanceType="start";
    return {sequence,options:{matchId:playingTime.matchId,eventId:"critical_tournament",matchType:"final-competition",opportunityDecision:playingTime}};
  }
  function generatedStart(type="incomingFriendlyInvitation") {
    var f=generationFixture(),derived=deriveHighSchoolMatchOpportunityCandidates({sequence:2});
    var candidate=derived.eligible.find(c=>c.opportunityType===type&&c.opponentSchoolId==="hs-y3-final-regional-opponent");
    var opportunity=materializeHighSchoolMatchOpportunityCandidate(candidate,{sequence:2});
    HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,opportunity.opportunityId,"accepted");
    var entry=HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,opportunity.opportunityId,getHighSchoolScheduleExecutionContext());
    return {f,candidate,opportunity,entry,match:launchHighSchoolScheduleEntry(entry.scheduleEntryId,f.options)};
  }
`);
test("1 real career derives candidates without state mutation",()=>{run("var f=generationFixture();var beforeGeneration=JSON.stringify(player);var result=deriveHighSchoolMatchOpportunityCandidates({sequence:2});");assert.strictEqual(run("JSON.stringify(player)"),run("beforeGeneration"));assert(run("result.eligible.length>0"));});
test("2 real school invitation roster source consumed",()=>{
  assert(run('result.pool.opponents.some(p=>p.sourceRefs.some(ref=>ref.startsWith("schoolInvitationState:")))'));
  assert(run('result.candidates.some(c=>c.opponentStrengthRef&&c.coachRef)'));
  assert(run('result.pool.opponents.every(p=>p.schoolId!==player.schoolInvitationState.selectedSchoolId)'));
});
test("3 canonical mandatory stage projected without creating competition",()=>{
  const before=json("player.competitionFoundation");run("var official=deriveHighSchoolMatchOpportunityCandidates({sequence:1})");
  assert(run('official.eligible.some(c=>c.priority==="mandatory"&&c.source.sourceId==="hs-y3-final-competition-1")'));
  assert.deepStrictEqual(json("player.competitionFoundation"),before);
});
test("4 real development lifecycle generates candidate then launches",()=>{
  run(`player=createRepresentativeHighSchoolEntryFixture("ordinary",97001);player.name="Generated career";
    applyCanonicalPositionProfile(player,"游擊手",[]);player.schoolInvitationState=createDefaultSchoolInvitationState();
    var schools=generateSchoolInvitationSet(player,{generationSeed:"generated-career-97001"});finalizeSchoolInvitationSelection(player,schools.invitations[0].schoolId);
    materializeSelectedHighSchoolRoster(player,{rosterRole:"bench"});completeHighSchoolEntry({source:"candidate-production-test"});
    player.highSchoolStep=5;applyHighSchoolRoleState("bench");prepareHighSchoolYearOneMatch();playCareerMatchToEnd();player.highSchoolStep=7;
    var development=deriveHighSchoolMatchOpportunityCandidates().eligible.find(c=>c.opportunityType==="developmentMatchOpportunity");
    var m=prepareCurrentHighSchoolYearOneMatch();`);
  assert(run("Boolean(development)"));assert.strictEqual(run("player.highSchoolSchedule.opportunities[0].provenance.candidateRef.candidateId"),run("development.candidateId"));
  assert.strictEqual(run("player.highSchoolSchedule.opportunities[0].provenance.foundationSelection"),"existingDevelopmentStage");
  run("playCareerMatchToEnd();var y1Save=JSON.parse(JSON.stringify(player));");
});
test("5 incoming generated candidate reaches away context",()=>{run("var started=generatedStart();m=started.match;");assert.strictEqual(run("getHighSchoolPlayerTeamSide(m)"),"away");assert.strictEqual(run("m.matchContext.matchOrigin"),"awayInvitationFriendly");});
test("6 outgoing generated candidate reaches home context",()=>{run('started=generatedStart("outgoingFriendlyInvitation");m=started.match;');assert.strictEqual(run("getHighSchoolPlayerTeamSide(m)"),"home");assert.strictEqual(run("m.matchContext.matchOrigin"),"homeInvitationFriendly");});
test("7 candidate → offered opportunity → explicit acceptance → schedule",()=>{
  run('f=generationFixture();var candidate=deriveHighSchoolMatchOpportunityCandidates({sequence:2}).eligible.find(c=>c.opportunityType==="incomingFriendlyInvitation");var opportunity=materializeHighSchoolMatchOpportunityCandidate(candidate,{sequence:2});');
  assert.strictEqual(run("opportunity.status"),"offered");assert.strictEqual(run("player.highSchoolSchedule.entries.length"),0);
  run('HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,opportunity.opportunityId,"accepted");var entry=HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,opportunity.opportunityId,getHighSchoolScheduleExecutionContext());');
  assert.strictEqual(run("entry.status"),"scheduled");
});
test("8 schedule adapter preserves generated provenance",()=>{run("m=launchHighSchoolScheduleEntry(entry.scheduleEntryId,f.options)");assert.strictEqual(run("m.matchContext.provenance.candidateRef.candidateId"),run("candidate.candidateId"));});
test("9 actual away top-half offensive decision",()=>{run('started=generatedStart();m=started.match;for(let i=0;i<100&&!isHighSchoolMatchDecisionVisible(m);i++)advanceHighSchoolMatchPlaybackStep(m);');assert.strictEqual(run("m.currentDomain"),"offense");assert.strictEqual(run("m.half"),"上");});
test("10 actual home bottom-half offensive decision",()=>{
  run('started=generatedStart("outgoingFriendlyInvitation");m=started.match;for(let i=0;i<300&&!(isHighSchoolMatchDecisionVisible(m)&&m.currentDomain==="offense");i++){if(isHighSchoolMatchDecisionVisible(m)){var choice=getHighSchoolYearOneMatchMomentChoices(m)[0];chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>.62);}else advanceHighSchoolMatchPlaybackStep(m);}');
  assert.strictEqual(run("m.currentDomain"),"offense");assert.strictEqual(run("m.half"),"下");
});
test("11 real save/load derives identical pool",()=>{
  const before=json("deriveHighSchoolMatchOpportunityCandidates({sequence:2})");run("saveGame();loadGame();stopHighSchoolMatchPlayback();m=player.highSchoolMatch;");
  assert.deepStrictEqual(json("deriveHighSchoolMatchOpportunityCandidates({sequence:2})"),before);
  assert(!run('Object.keys(player).some(key=>/candidatePool|opportunityCandidates/i.test(key))'));
});
test("12 reload materialization retains one opportunity",()=>{run("materializeHighSchoolMatchOpportunityCandidate(started.candidate,{sequence:2})");assert.strictEqual(run("player.highSchoolSchedule.opportunities.length"),1);});
test("13 official collision rejects all optional candidates",()=>{run("f=generationFixture();result=deriveHighSchoolMatchOpportunityCandidates({sequence:1})");assert(run('result.rejected.filter(c=>c.priority==="optional").every(c=>c.exclusionReasons.includes("blockedByMandatoryCompetition"))'));assert.strictEqual(run('result.eligible.filter(c=>c.priority==="optional").length'),0);});
test("14 completed source does not return as eligible candidate",()=>{run("started=generatedStart();m=started.match;var afterInput=getHighSchoolMatchOpportunityGenerationInput({sequence:2});playCareerMatchToEnd();");
  // The career has advanced beyond match phase. Inspect the same saved phase's pure derivation to verify history suppression.
  run('afterInput.schedule=player.highSchoolSchedule;afterInput.activeMatch={id:m.id,completed:m.completed};afterInput.history=player.highSchoolYearThreeMatchHistory.map(h=>({matchId:h.matchId,careerYear:h.highSchoolYear}));');
  assert(!run('HighSchoolMatchOpportunityGeneration.deriveOpportunityCandidates(afterInput).eligible.some(c=>c.candidateId===started.candidate.candidateId)'));
  assert.strictEqual(run('player.highSchoolSchedule.entries[0].status'),"completed");
});
test("15 actual Y1→Y2 rejects stale candidate, allows new year pool",()=>{
  run('player=normalizeSave(y1Save);initializeHighSchoolYearTransition(2);player.chapter="青棒第二年";player.highSchoolYearTwoStep=2;var newYear=deriveHighSchoolMatchOpportunityCandidates();');
  assert(run("newYear.eligible.length>0"));assert(run("newYear.candidates.every(c=>c.careerYear===2)"));assert.throws(()=>run("materializeHighSchoolMatchOpportunityCandidate(development)"),/stale/);
});
test("16 official entry and GameRecord produce unchanged evidence semantics",()=>{
  run(`f=generationFixture();var teamId=player.primaryTeamAssignment.teamId;
    HighSchoolCompetitionFoundation.registerDefinition(player,{competitionId:"generator-series",competitionType:"school_tournament",entryUnit:"school",level:"high_school"});
    HighSchoolCompetitionFoundation.registerEdition(player,{editionId:"generator-edition",competitionId:"generator-series",seasonYear:2033});
    var competitionEntry=HighSchoolCompetitionFoundation.enterCompetition(player,{competitionEditionId:"generator-edition",teamId});
    HighSchoolCompetitionFoundation.recordParticipation(player,{playerId:"player",competitionEditionId:"generator-edition",teamId,rosterStatus:"active_roster",participationStatus:"appeared"});
    var input=getHighSchoolMatchOpportunityGenerationInput({sequence:1});
    input.sources=input.sources.filter(s=>s.opportunityType==="officialCompetitionOpportunity").map(s=>({...s,competitionRefs:{competitionEntryId:competitionEntry.entryId,competitionEditionId:competitionEntry.competitionEditionId},plannedContext:{competitionEditionId:competitionEntry.competitionEditionId}}));
    candidate=HighSchoolMatchOpportunityGeneration.deriveOfficialCompetitionCandidates(input).find(c=>c.eligible);
    opportunity=HighSchoolMatchOpportunityGeneration.materializeOpportunityCandidate(player.highSchoolSchedule,candidate,input);
    HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,opportunity.opportunityId,"accepted");
    entry=HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,opportunity.opportunityId,getHighSchoolScheduleExecutionContext());
    m=launchHighSchoolScheduleEntry(entry.scheduleEntryId,f.options);playCareerMatchToEnd();`);
  assert(run("HighSchoolCompetitionEvidence.getEvidence(player).length>0"));assert(run("HighSchoolCompetitionEvidence.assertIntegrity(player)"));
  assert.strictEqual(run("m.gameRecord.competitionEntryId"),run("competitionEntry.entryId"));
});
test("17 candidate derivation leaves selection authorities untouched",()=>{
  run("f=generationFixture();var selectionBefore=JSON.stringify({county:player.countySelectionState,national:player.nationalSelectionState,competition:player.competitionFoundation,evidence:player.competitionEvidenceState});deriveHighSchoolMatchOpportunityCandidates({sequence:2});");
  assert.strictEqual(run("JSON.stringify({county:player.countySelectionState,national:player.nationalSelectionState,competition:player.competitionFoundation,evidence:player.competitionEvidenceState})"),run("selectionBefore"));
});
test("18 generated route preserves GameRecord integrity",()=>{run("started=generatedStart();m=started.match;playCareerMatchToEnd();");assert(run("MatchGameRecord.assertIntegrity(m.gameRecord)"));assert.strictEqual(run("player.highSchoolSchedule.entries[0].gameRecordId"),run("m.gameRecord.gameId"));});
test("19 input order and trace do not affect production output",()=>{run("f=generationFixture();input=getHighSchoolMatchOpportunityGenerationInput({sequence:2});var stableResult=HighSchoolMatchOpportunityGeneration.deriveOpportunityCandidates(input);input.schoolRecords.reverse();input.sources.reverse();input.trace=true;");assert.deepStrictEqual(json("HighSchoolMatchOpportunityGeneration.deriveOpportunityCandidates(input)"),json("stableResult"));});
test("20 corrupt source roster is rejected without regeneration",()=>{run('input=getHighSchoolMatchOpportunityGenerationInput({sequence:2});var target=input.schoolRecords.find(s=>s.schoolId!==input.context.playerSchoolId&&s.sourceRef.startsWith("schoolInvitationState:"));input.schoolRecords=input.schoolRecords.filter(s=>s.schoolId!==target.schoolId);input.schoolRecords.push({...target,rosterValid:false});');assert(!run("HighSchoolMatchOpportunityGeneration.deriveOpportunityCandidates(input).pool.opponents.some(p=>p.schoolId===target.schoolId)"));});
test("21 real preparation phase yields diagnostics instead of inventing matches",()=>{run('careerFixture("二壘手","starter");var preparationCandidates=deriveHighSchoolMatchOpportunityCandidates();');assert.strictEqual(run("preparationCandidates.eligible.length"),0);assert(run('preparationCandidates.rejected.every(c=>c.exclusionReasons.includes("phaseNotMatchEligible"))'));});
console.log(`${passed}/${passed} PASS`);
