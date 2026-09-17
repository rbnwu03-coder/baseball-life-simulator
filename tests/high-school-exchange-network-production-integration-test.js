const assert=require("assert"),{makeContext}=require("./high-school-career-test-context");
const {run,json,context,flushTransitions}=makeContext();context.flushExchangeTransitions=flushTransitions;let passed=0;const test=(name,fn)=>{fn();passed++;console.log("PASS "+name);};
run(`
  function playExchangeToEnd() {
    const match=player.highSchoolMatch;let ticks=0;
    while(!match.completed&&ticks++<2500) {
      flushExchangeTransitions();
      if(pendingYouthSeasonOutcome)continueYouthSeasonOutcome();
      if(isHighSchoolMatchDecisionVisible(match)) {
        const choice=getHighSchoolYearOneMatchMomentChoices(match)[0];
        if(!choice)throw new Error("No legal exchange decision");
        chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>.62);
      } else advanceHighSchoolMatchPlaybackStep(match);
    }
    if(!match.completed)throw new Error("Exchange match did not complete: "+JSON.stringify({phase:match.simulationPhase,event:getCurrentEventId(),transition:isTransitioning,pending:pendingYouthSeasonOutcome,situation:match.activeSituation,same:match===player.highSchoolMatch,inning:match.inning,half:match.half,outs:match.outs}));
    showHighSchoolCompletedMatchOutcome(match);continueYouthSeasonOutcome();
  }
  function exchangeFixture() {
    careerFixture("二壘手","starter");choose("critical_offseason",1);player.highSchoolMatch=null;
    var playingTime=JSON.parse(JSON.stringify(ensureHighSchoolYearThreeOpportunity()));
    playingTime.decisionId+="|exchange-fixture-start";playingTime.plannedUsage.appearanceType="start";
    return {matchId:playingTime.matchId,eventId:"critical_tournament",matchType:"final-competition",opportunityDecision:playingTime};
  }
  function exchangeStart(type) {
    var options=exchangeFixture();
    var opportunity=offerHighSchoolMatchOpportunity({opportunityType:type,sequence:2,opponentSchoolId:"hs-y3-final-regional-opponent",source:{type:"systemEligibility",sourceId:"explicit-exchange-test"}});
    HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,opportunity.opportunityId,"accepted");
    var entry=HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,opportunity.opportunityId,getHighSchoolScheduleExecutionContext());
    var match=launchHighSchoolScheduleEntry(entry.scheduleEntryId,options);
    var nextInput=getHighSchoolMatchOpportunityGenerationInput({sequence:3});
    return {opportunity,entry,match,nextInput};
  }
  function exchangeFinish(start) {
    playExchangeToEnd();
    start.nextInput.relationshipLedger=player.highSchoolExchangeNetwork;
    start.nextInput.schedule=player.highSchoolSchedule;
    start.nextInput.activeMatch={id:start.match.id,completed:true};
    return HighSchoolMatchOpportunityGeneration.deriveOpportunityCandidates(start.nextInput);
  }
  function connectCoach() {
    var input=getHighSchoolMatchOpportunityGenerationInput({sequence:2});
    var opponent=input.schoolRecords.find(s=>s.schoolId!==input.context.playerSchoolId&&s.sourceRef.startsWith("schoolInvitationState:"));
    return ingestHighSchoolCoachSchoolConnection({coachId:input.currentCoachId,schoolBId:opponent.schoolId,source:{type:"initiatedContact",sourceId:"explicit-coach-contact-1"}});
  }
`);
test("1 real outgoing completion records exchange/home/return",()=>{run('var started=exchangeStart("outgoingFriendlyInvitation");var next=exchangeFinish(started);var m=started.match;');assert.deepStrictEqual(json("player.highSchoolExchangeNetwork.evidence.map(e=>e.evidenceType).sort()"),["homeVisit","returnVisitEligible","schoolExchangeMatch"]);});
test("2 home assignment unchanged",()=>{assert.strictEqual(run("getHighSchoolPlayerTeamSide(m)"),"home");assert.strictEqual(run("m.matchContext.matchOrigin"),"homeInvitationFriendly");});
test("3 completed schedule and final record authority",()=>{assert.strictEqual(run("started.entry.status"),"completed");assert.strictEqual(run("m.gameRecord.status"),"final");assert(run("MatchGameRecord.assertIntegrity(m.gameRecord)"));});
test("4 prior home generates incoming real source",()=>{assert(run('next.eligible.some(c=>c.opponentSchoolId===m.matchContext.opponentTeamId&&c.opportunityType==="incomingFriendlyInvitation"&&c.source.type==="schoolRelationship")'));assert(!run('next.candidates.some(c=>c.source.type==="schoolRelationship"&&c.opportunityType==="outgoingFriendlyInvitation")'));});
test("5 real return supersedes matching fallback",()=>assert(run('next.rejected.some(c=>c.opponentSchoolId===m.matchContext.opponentTeamId&&c.opportunityType==="incomingFriendlyInvitation"&&c.sourceAuthority==="fallback"&&c.exclusionReasons.includes("supersededByCanonicalSource"))')));
test("6 completion replay keeps ledger and history unchanged",()=>{run("var beforeReplay=JSON.stringify(player);recordHighSchoolExchangeCompletion(m);recordHighSchoolExchangeCompletion(m);");assert.strictEqual(run("JSON.stringify(player)"),run("beforeReplay"));});
test("7 actual save reload preserves evidence exactly",()=>{const before=json("player.highSchoolExchangeNetwork");run("saveGame();loadGame();stopHighSchoolMatchPlayback();m=player.highSchoolMatch;recordHighSchoolExchangeCompletion(m);");assert.deepStrictEqual(json("player.highSchoolExchangeNetwork"),before);});
test("8 real incoming completion and reverse intent",()=>{run('started=exchangeStart("incomingFriendlyInvitation");next=exchangeFinish(started);m=started.match;');assert.strictEqual(run("getHighSchoolPlayerTeamSide(m)"),"away");assert(run('player.highSchoolExchangeNetwork.evidence.some(e=>e.evidenceType==="awayVisit"&&e.visitorSchoolId===m.matchContext.playerTeamId)'));assert(run('next.eligible.some(c=>c.source.type==="schoolRelationship"&&c.opportunityType==="outgoingFriendlyInvitation")'));});
test("9 actual neutral completion never invents visits",()=>{run('started=exchangeStart("neutralExchangeOpportunity");next=exchangeFinish(started);');assert.deepStrictEqual(json("player.highSchoolExchangeNetwork.evidence.map(e=>e.evidenceType)"),["schoolExchangeMatch"]);assert.strictEqual(run("player.highSchoolExchangeNetwork.evidence[0].direction"),"neutral");});
test("10 actual development completion records distinct evidence",()=>{run('started=exchangeStart("developmentMatchOpportunity");exchangeFinish(started);');assert.deepStrictEqual(json("player.highSchoolExchangeNetwork.evidence.map(e=>e.evidenceType)"),["developmentExchange"]);});
test("11 actual training completion records shared context",()=>{run('started=exchangeStart("trainingCampOpportunity");exchangeFinish(started);');assert.deepStrictEqual(json("player.highSchoolExchangeNetwork.evidence.map(e=>e.evidenceType)"),["sharedTrainingContext"]);});
test("12 coach identity by itself produces no network",()=>{run("var options=exchangeFixture();var input=getHighSchoolMatchOpportunityGenerationInput({sequence:2});");assert.strictEqual(run("player.highSchoolExchangeNetwork.evidence.length"),0);assert(!run('deriveHighSchoolMatchOpportunityCandidates({sequence:2}).candidates.some(c=>c.source.type==="coachNetwork")'));});
test("13 explicit existing coach source generates real candidates",()=>{run("var coachEvidence=connectCoach();var derived=deriveHighSchoolMatchOpportunityCandidates({sequence:2});");assert(run('derived.eligible.some(c=>c.source.type==="coachNetwork"&&c.provenance.networkEvidenceRef===coachEvidence.evidenceId)'));assert.strictEqual(run("coachEvidence.coachId"),run("input.currentCoachId"));});
test("14 repeat coach source deduplicates",()=>{run("connectCoach();");assert.strictEqual(run("player.highSchoolExchangeNetwork.evidence.length"),1);});
test("15 coach → candidate → opportunity → schedule → actual match",()=>{run(`var candidate=derived.eligible.find(c=>c.source.type==="coachNetwork"&&c.opportunityType==="outgoingFriendlyInvitation");
  var opportunity=materializeHighSchoolMatchOpportunityCandidate(candidate,{sequence:2});
  HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,opportunity.opportunityId,"accepted");
  var entry=HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,opportunity.opportunityId,getHighSchoolScheduleExecutionContext());
  m=launchHighSchoolScheduleEntry(entry.scheduleEntryId,options);`);
  assert.strictEqual(run("opportunity.provenance.networkEvidenceRef"),run("coachEvidence.evidenceId"));assert.strictEqual(run("m.matchContext.provenance.networkEvidenceRef"),run("coachEvidence.evidenceId"));assert.strictEqual(run("m.matchContext.scheduleEntryId"),run("entry.scheduleEntryId"));
});
test("16 provenance stores refs without evidence object copy",()=>{
  const provenance=json("m.matchContext.provenance"),evidenceId=run("coachEvidence.evidenceId");
  assert.strictEqual(typeof provenance.networkEvidenceRef,"string");
  assert.strictEqual(provenance.networkEvidenceRef,evidenceId);
  // Generator source/candidate refs, Schedule linkage, and MatchContext reasonCode.
  const allowedKeys=["invitationSourceId","producerType","evidenceRefs","reasonCode","sourceReason","networkEvidenceRef","evidenceCareerYear","supportingEvidenceRefs","candidateRef",
    "source","sourceId","opportunityId","scheduleEntryId","opportunitySource","competitionRefs"];
  assert(Object.keys(provenance).every(key=>allowedKeys.includes(key)),"unexpected provenance own key");
  const candidateKeys=["candidateId","sourceAuthority","sourceRefs","priorMatchRefs","networkEvidenceRef",
    "relationshipEvidenceRef","opponentStrengthRef","coachRef","eligibilityReasons","generationVersion"];
  assert(Object.keys(provenance.candidateRef).every(key=>candidateKeys.includes(key)),"unexpected candidate reference own key");
  assert.strictEqual(provenance.candidateRef.networkEvidenceRef,evidenceId);
  assert(provenance.supportingEvidenceRefs.every(ref=>typeof ref==="string"));
  // None of these evidence payload fields belong to this fixture's provenance contract,
  // including nested candidate/source objects. Reference string contents are not inspected.
  const forbiddenKeys=["evidence","relationshipEvidence","networkEvidence","coachSchoolConnection","evidenceObject",
    "evidenceType","schoolAId","schoolBId","coachId","completed","parentEvidenceId"];
  function assertNoEvidencePayload(value) {
    if(!value||typeof value!=="object")return;
    for(const key of forbiddenKeys)assert(!Object.prototype.hasOwnProperty.call(value,key),`copied evidence field: ${key}`);
    for(const child of Object.values(value))assertNoEvidencePayload(child);
  }
  assertNoEvidencePayload(provenance);
});
test("17 coach sourced real match settles without changing authority",()=>{run("playExchangeToEnd();");assert(run("MatchGameRecord.assertIntegrity(m.gameRecord)"));assert(run("player.highSchoolYearThreeMatchHistory.some(h=>h.matchId===m.id)"));assert.strictEqual(run("player.highSchoolExchangeNetwork.evidence.length"),4);});
test("18 preexisting fallback opportunity preserved after real contact",()=>{run(`options=exchangeFixture();input=getHighSchoolMatchOpportunityGenerationInput({sequence:2});
  var target=input.schoolRecords.find(s=>s.schoolId!==input.context.playerSchoolId&&s.sourceRef.startsWith("schoolInvitationState:"));
  var fallback=deriveHighSchoolMatchOpportunityCandidates({sequence:2}).eligible.find(c=>c.sourceAuthority==="fallback"&&c.opponentSchoolId===target.schoolId&&c.opportunityType==="outgoingFriendlyInvitation");
  var oldOpportunity=materializeHighSchoolMatchOpportunityCandidate(fallback,{sequence:2});var oldFacts=JSON.stringify(oldOpportunity);connectCoach();derived=deriveHighSchoolMatchOpportunityCandidates({sequence:2});`);
  assert(run('derived.rejected.some(c=>c.source.type==="coachNetwork"&&c.opportunityType==="outgoingFriendlyInvitation"&&c.exclusionReasons.includes("existingOpportunity"))'));assert.strictEqual(run("JSON.stringify(oldOpportunity)"),run("oldFacts"));assert.strictEqual(run("player.highSchoolSchedule.opportunities.length"),1);
});
test("19 selection competition and strength remain untouched by queries",()=>{run("var beforeQuery=JSON.stringify(player);deriveHighSchoolMatchOpportunityCandidates({sequence:2});HighSchoolExchangeNetwork.deriveRelationshipSummary(player.highSchoolExchangeNetwork,input.context.playerSchoolId,target.schoolId);");assert.strictEqual(run("JSON.stringify(player)"),run("beforeQuery"));});
test("20 legacy save normalizes empty ledger without backfill",()=>{run("var legacy=JSON.parse(JSON.stringify(player));delete legacy.highSchoolExchangeNetwork;var restored=normalizeSave(legacy);");assert.deepStrictEqual(json("restored.highSchoolExchangeNetwork"),{version:"high-school-exchange-network-v1",evidence:[]});});
test("21 canonical official completion produces encounter only",()=>{run(`options=exchangeFixture();var teamId=player.primaryTeamAssignment.teamId;
  HighSchoolCompetitionFoundation.registerDefinition(player,{competitionId:"exchange-series",competitionType:"school_tournament",entryUnit:"school",level:"high_school"});
  HighSchoolCompetitionFoundation.registerEdition(player,{editionId:"exchange-edition",competitionId:"exchange-series",seasonYear:2033});
  var competitionEntry=HighSchoolCompetitionFoundation.enterCompetition(player,{competitionEditionId:"exchange-edition",teamId});
  HighSchoolCompetitionFoundation.recordParticipation(player,{playerId:"player",competitionEditionId:"exchange-edition",teamId,rosterStatus:"active_roster",participationStatus:"appeared"});
  input=getHighSchoolMatchOpportunityGenerationInput({sequence:1});input.sources=input.sources.filter(s=>s.opportunityType==="officialCompetitionOpportunity").map(s=>({...s,competitionRefs:{competitionEntryId:competitionEntry.entryId,competitionEditionId:competitionEntry.competitionEditionId},plannedContext:{competitionEditionId:competitionEntry.competitionEditionId}}));
  candidate=HighSchoolMatchOpportunityGeneration.deriveOfficialCompetitionCandidates(input).find(c=>c.eligible);opportunity=HighSchoolMatchOpportunityGeneration.materializeOpportunityCandidate(player.highSchoolSchedule,candidate,input);
  HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,opportunity.opportunityId,"accepted");entry=HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,opportunity.opportunityId,getHighSchoolScheduleExecutionContext());
  m=launchHighSchoolScheduleEntry(entry.scheduleEntryId,options);playExchangeToEnd();`);
  assert.deepStrictEqual(json("player.highSchoolExchangeNetwork.evidence.map(e=>e.evidenceType)"),["competitionEncounter"]);assert(run("HighSchoolCompetitionEvidence.getEvidence(player).length>0"));assert(run("HighSchoolCompetitionEvidence.assertIntegrity(player)"));assert(run("MatchGameRecord.assertIntegrity(m.gameRecord)"));
});
test("22 completed source audit has no orphan/duplicate/unknown",()=>{const a=json("HighSchoolExchangeNetwork.auditRelationshipEvidence(player.highSchoolExchangeNetwork,player.highSchoolSchedule)");assert.strictEqual(a.orphanRefs+a.duplicateIds+a.selfSchoolFacts+a.unknownSourceRefs,0);});
test("23 real source ordering and instrumentation neutral",()=>{run("options=exchangeFixture();connectCoach();input=getHighSchoolMatchOpportunityGenerationInput({sequence:2});var deterministic=HighSchoolMatchOpportunityGeneration.deriveOpportunityCandidates(input);input.trace=true;input.schoolRecords.reverse();input.relationshipLedger.evidence.reverse();");assert.deepStrictEqual(json("HighSchoolMatchOpportunityGeneration.deriveOpportunityCandidates(input)"),json("deterministic"));});
test("24 source derivation consumes no RNG",()=>{run("var originalRandom=Math.random;Math.random=()=>{throw new Error('unexpected RNG');};try { deriveHighSchoolMatchOpportunityCandidates({sequence:2});connectCoach(); } finally { Math.random=originalRandom; }");});
console.log(`${passed}/${passed} PASS`);
