const {makeContext}=require("./high-school-career-test-context");
module.exports=function makeSelectionTestContext(){
const {run,json,context,flushTransitions}=makeContext();context.flushProducerTransitions=flushTransitions;

run(`
  function finishProducerMatch() {
    const m=player.highSchoolMatch;let ticks=0;
    while(!m.completed&&ticks++<2500){flushProducerTransitions();if(pendingYouthSeasonOutcome)continueYouthSeasonOutcome();
      if(isHighSchoolMatchDecisionVisible(m)){const c=getHighSchoolYearOneMatchMomentChoices(m)[0];if(!c)throw Error("No legal choice");chooseHighSchoolYearOneMatchMoment(c.matchDecision,c.matchMomentId,()=>.62);}
      else advanceHighSchoolMatchPlaybackStep(m);
    }
    if(!m.completed)throw Error("Producer fixture match did not complete");showHighSchoolCompletedMatchOutcome(m);continueYouthSeasonOutcome();
  }
  function priorExchange(type="incomingFriendlyInvitation") {
    stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;
    player=createRepresentativeHighSchoolEntryFixture("ordinary",97001);player.name="Producer career";applyCanonicalPositionProfile(player,"游擊手",[]);
    player.schoolInvitationState=createDefaultSchoolInvitationState();const invitations=generateSchoolInvitationSet(player,{generationSeed:"producer-career-97001"});
    finalizeSchoolInvitationSelection(player,invitations.invitations[0].schoolId);materializeSelectedHighSchoolRoster(player,{rosterRole:"bench"});completeHighSchoolEntry({source:"producer-integration-test"});
    player.highSchoolStep=5;applyHighSchoolRoleState("bench");prepareHighSchoolYearOneMatch();finishProducerMatch();player.highSchoolStep=7;
    const playingTime=player.highSchoolNextOpportunity;
    const o=offerHighSchoolMatchOpportunity({opportunityType:type,sequence:2,opponentSchoolId:"regional-power-school",source:{type:type==="officialCompetitionOpportunity"?"competitionCalendar":"systemEligibility",sourceId:"producer-prior-context"}});
    HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,o.opportunityId,"accepted");
    const e=HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,o.opportunityId,getHighSchoolScheduleExecutionContext());
    const m=launchHighSchoolScheduleEntry(e.scheduleEntryId,{matchId:playingTime.matchId,eventId:"high_school_followup_evaluation",matchType:"evaluation-practice",opportunityIndex:2,opportunityPhase:"post-autumn-evaluation",opportunityDecision:playingTime});
    finishProducerMatch();const priorInput=getHighSchoolMatchOpportunityGenerationInput({sequence:3});priorInput.context.seasonPhase="post-autumn-evaluation";
    const priorSources=HighSchoolFriendlyInvitationSource.deriveFriendlyInvitationSources(priorInput);
    initializeHighSchoolYearTransition(2);player.chapter="青棒第二年";player.highSchoolYearTwoStep=2;
    return {match:m,priorSources};
  }
  function sourceInput(){return getHighSchoolMatchOpportunityGenerationInput({sequence:1});}
  function sourceResult(){return HighSchoolFriendlyInvitationSource.deriveFriendlyInvitationSources(sourceInput());}
  function launchFuture(candidate) {
    const o=materializeHighSchoolMatchOpportunityCandidate(candidate,{sequence:1});
    HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,o.opportunityId,"accepted");
    const e=HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,o.opportunityId,getHighSchoolScheduleExecutionContext());
    const playingTime=ensureHighSchoolYearTwoSpringOpportunity();
    const m=launchHighSchoolScheduleEntry(e.scheduleEntryId,{matchId:playingTime.matchId,eventId:"high_school_year_two_spring_game",matchType:"year-two-spring-evaluation",opportunityIndex:1,opportunityDecision:playingTime});
    return {opportunity:o,entry:e,match:m};
  }
  function realCoachContact(opponent) {
    const input=sourceInput();return ingestHighSchoolCoachSchoolConnection({coachId:input.currentCoachId,schoolBId:opponent||input.schoolRecords.find(s=>s.schoolId!==input.context.playerSchoolId).schoolId,source:{type:"initiatedContact",sourceId:"producer-explicit-contact"}});
  }
`);
run(`
  var selectionSources=[];
  function selectedInput(sequence=1){return getHighSchoolMatchOpportunityGenerationInput({sequence,sources:selectionSources});}
  function selectedResult(sequence=1){return deriveHighSchoolOpportunitySelection({sequence,sources:selectionSources});}
  function selectedMaterialize(result,sequence=1){return materializeHighSchoolSelectedOpportunities(result,{sequence,sources:selectionSources});}
  function startFrequencyCareer(){
    stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;
    player=createRepresentativeHighSchoolEntryFixture("ordinary",97001);player.name="Frequency career";applyCanonicalPositionProfile(player,"游擊手",[]);
    player.schoolInvitationState=createDefaultSchoolInvitationState();const invitations=generateSchoolInvitationSet(player,{generationSeed:"frequency-career-97001"});
    finalizeSchoolInvitationSelection(player,invitations.invitations[0].schoolId);materializeSelectedHighSchoolRoster(player,{rosterRole:"bench"});completeHighSchoolEntry({source:"selection-frequency-test"});
    player.highSchoolStep=5;applyHighSchoolRoleState("bench");
  }
  function frequencyRoute(){
    startFrequencyCareer();const facts=[];
    function play(prepare,year,phase,sequence){
      const before=(player.highSchoolSchedule?.opportunities||[]).length;
      const m=prepare();if(prepare()!==m)throw Error("Repeated entry created a second match");
      const scheduled=player.highSchoolSchedule?.entries||[];
      facts.push({year,phase,sequence,matchId:m.id,matchCount:1,newOpportunities:(player.highSchoolSchedule?.opportunities||[]).length-before,scheduledCount:scheduled.filter(e=>e.careerYear===year&&e.seasonPhase===phase&&e.sequence===sequence).length});
      finishProducerMatch();
    }
    play(()=>prepareHighSchoolYearOneMatch(),1,"autumn-exhibition",1);player.highSchoolStep=7;
    play(()=>prepareCurrentHighSchoolYearOneMatch(),1,"post-autumn-evaluation",2);
    initializeHighSchoolYearTransition(2);player.chapter="青棒第二年";player.highSchoolYearTwoStep=2;
    play(()=>prepareHighSchoolYearTwoEvaluationMatch(),2,"year-two-spring-evaluation",1);player.highSchoolYearTwoStep=6;
    play(()=>prepareHighSchoolYearTwoAutumnMatch(),2,"year-two-autumn-evaluation",2);
    initializeHighSchoolYearTransition(3);player.chapter="青棒關鍵年";player.criticalYearStep=0;choose("critical_offseason",1);
    play(()=>prepareHighSchoolYearThreeMatch(),3,"final-competition",1);
    return facts;
  }
`);
return {run,json,context,flushTransitions};
};
