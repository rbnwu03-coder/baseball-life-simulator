"use strict";
const make=require("./high-school-opportunity-selection-test-context.cjs");
function installCareerAudit(){
  function beginAuditCareer(index){
    stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;
    const auditId="audit-career-"+String(index).padStart(6,"0");
    player=createRepresentativeHighSchoolEntryFixture("ordinary",97001);player.name=auditId;applyCanonicalPositionProfile(player,"游擊手",[]);
    player.schoolInvitationState=createDefaultSchoolInvitationState();const set=generateSchoolInvitationSet(player,{generationSeed:auditId});
    finalizeSchoolInvitationSelection(player,set.invitations[0].schoolId);materializeSelectedHighSchoolRoster(player,{rosterRole:"bench"});completeHighSchoolEntry({source:"probability-calibration-audit"});
    player.highSchoolStep=5;applyHighSchoolRoleState("bench");return auditId;
  }
  globalThis.runAuditCareer=function(index,mode="enabled",trace=false){
    const careerAuditId=beginAuditCareer(index),windows=[],cohort=index%4;
    const initial=getHighSchoolMatchOpportunityGenerationInput({sequence:1});
    const opponents=[...new Set(initial.schoolRecords.filter(s=>s.rosterValid&&s.schoolId!==initial.context.playerSchoolId).map(s=>s.schoolId))].sort();
    if(cohort===1||cohort===2)ingestHighSchoolCoachSchoolConnection({coachId:initial.currentCoachId,schoolBId:opponents[0],source:{type:cohort===1?"initiatedContact":"knownCounterpart",sourceId:careerAuditId+":coach-contact"}});
    const sources=cohort===3?[{opportunityType:"trainingCampOpportunity",source:{type:"trainingCampPlan",sourceId:careerAuditId+":explicit-plan"},explicit:true,careerYear:1,seasonPhase:"autumn-exhibition",participantSchoolIds:[initial.context.playerSchoolId,...opponents.slice(0,3)]}]:[];
    const checks={reloadSamples:0,reloadMismatch:0,antiReroll:{declined:0,expired:0,cancelled:0},antiRerollFailures:0,duplicateWindowMaterialization:0,budgetViolation:0,mandatoryProfiles:0,selectedWithoutOpportunity:0,unselectedMaterialized:0,gameplayRngMismatch:0,neutralityMismatch:0};
    function play(sequence,options){
      const opts={sequence,sources,probabilityPolicy:mode};
      const input={...getHighSchoolMatchOpportunityGenerationInput(opts),probabilityPolicy:mode,trace};
      const evidenceBefore=input.relationshipLedger.evidence.length;
      const r=HighSchoolOpportunitySelection.selectOpportunityCandidates(input);
      if(trace)HighSchoolOpportunitySelection.auditSelection(r);
      const admitted=HighSchoolOpportunitySelection.resolveCandidateConflicts(r.context,true).optionalPool;
      const profiles=HighSchoolOpportunityProbability.deriveCandidateWeights(admitted,r.context);
      checks.budgetViolation+=Number(r.optionalSelections.length>r.budget.maxOptionalPerSelectionWindow);
      checks.mandatoryProfiles+=(r.probabilityResult?.weights||[]).filter(w=>r.mandatorySelections.includes(w.candidateId)).length;
      if(index<=100&&windows.length===0){
        saveGame();const renderer=showCurrentEvent;try{showCurrentEvent=()=>{};loadGame();}finally{showCurrentEvent=renderer;}
        checks.reloadSamples++;checks.reloadMismatch+=Number(JSON.stringify(deriveHighSchoolOpportunitySelection(opts))!==JSON.stringify(r));
        for(const status of ["declined","expired","cancelled"]){
          const trial=JSON.parse(JSON.stringify(input.schedule)),out=HighSchoolOpportunitySelection.materializeSelectedCandidates(trial,r,{...input,schedule:trial}),o=out.materialized[0];
          if(status==="cancelled"){HighSchoolScheduleOpportunity.setOpportunityStatus(trial,o.opportunityId,"accepted");HighSchoolScheduleOpportunity.scheduleOpportunity(trial,o.opportunityId,getHighSchoolScheduleExecutionContext()).status="cancelled";}
          else HighSchoolScheduleOpportunity.setOpportunityStatus(trial,o.opportunityId,status);
          const again=HighSchoolOpportunitySelection.selectOpportunityCandidates({...input,schedule:trial});
          const repeat=HighSchoolOpportunitySelection.materializeSelectedCandidates(trial,r,{...input,schedule:trial});
          checks.antiReroll[status]++;checks.antiRerollFailures+=Number(again.selectedCandidateIds.length>0||(again.probabilityResult?.draws.length||0)>0||repeat.materialized.length>0);
        }
        const neutral=JSON.parse(JSON.stringify(input));neutral.schoolRecords.forEach(s=>{s.teamStrength=999;s.schoolStandard="audit-strength-perturbation";});neutral.playerCapability={contact:999,power:999};neutral.playerPerformance={hits:999};
        const neutralResult=HighSchoolOpportunitySelection.selectOpportunityCandidates(neutral);
        checks.neutralityMismatch+=Number(JSON.stringify(neutralResult.probabilityResult)!==JSON.stringify(r.probabilityResult)||JSON.stringify(neutralResult.selectedCandidateIds)!==JSON.stringify(r.selectedCandidateIds));
      }
      const out=materializeHighSchoolSelectedOpportunities(r,opts);
      if(out.diagnostics.length||out.materialized.length!==1)throw Error("Audit materialization: "+JSON.stringify(out.diagnostics));
      const repeat=materializeHighSchoolSelectedOpportunities(r,opts);checks.duplicateWindowMaterialization+=repeat.materialized.length;
      checks.selectedWithoutOpportunity+=r.selectedCandidateIds.filter(id=>!out.materialized.some(o=>o.provenance.candidateRef.candidateId===id)).length;
      checks.unselectedMaterialized+=out.materialized.filter(o=>!r.selectedCandidateIds.includes(o.provenance.candidateRef.candidateId)).length;
      const o=out.materialized[0];HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,o.opportunityId,"accepted");
      const e=HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,o.opportunityId,getHighSchoolScheduleExecutionContext());
      // First Y1 game has no playing-time decision seed. Reuse the established audit seed hook.
      if(windows.length===0)pendingHighSchoolMatchSimulationSeed=createHighSchoolMatchSimulationSeedFromIdentity(careerAuditId+":y1-autumn-audit");
      const m=launchHighSchoolScheduleEntry(e.scheduleEntryId,options);
      const cursor=m.simulationCursor;HighSchoolOpportunitySelection.selectOpportunityCandidates(input);checks.gameplayRngMismatch+=Number(cursor!==m.simulationCursor);
      finishProducerMatch();if(!m.completed||!MatchGameRecord.assertIntegrity(m.gameRecord))throw Error("Audit game integrity");
      windows.push({year:r.context.careerYear,phase:r.context.seasonPhase,sequence,windowId:r.selectionWindowId,candidates:r.context.candidateSet,profiles,probability:r.probabilityResult,selected:r.selectedCandidates,mandatoryIds:r.mandatorySelections,rejections:r.rejectedCandidates,budget:r.budget,opportunity:o,schedule:e,completed:m.completed,evidenceBefore,evidenceCount:player.highSchoolExchangeNetwork.evidence.length,availableOpponents:[...new Set(input.schoolRecords.filter(s=>s.rosterValid&&s.schoolId!==input.context.playerSchoolId).map(s=>s.schoolId))],recordIntegrity:true,gameRecordSignature:auditHash(m.gameRecord)});
    }
    play(1,{matchId:"hs-y1-autumn-exhibition",eventId:"high_school_showcase",matchType:"autumn-exhibition",opportunityIndex:1});player.highSchoolStep=7;
    play(2,{matchId:"hs-y1-followup-evaluation-2",eventId:"high_school_followup_evaluation",matchType:"evaluation-practice",opportunityIndex:2,opportunityDecision:player.highSchoolNextOpportunity});
    initializeHighSchoolYearTransition(2);player.chapter="青棒第二年";player.highSchoolYearTwoStep=2;
    play(1,{matchId:"hs-y2-spring-evaluation-1",eventId:"high_school_year_two_spring_game",matchType:"year-two-spring-evaluation",opportunityIndex:1,opportunityDecision:ensureHighSchoolYearTwoSpringOpportunity()});player.highSchoolYearTwoStep=6;
    play(2,{matchId:"hs-y2-autumn-evaluation-2",eventId:"high_school_year_two_autumn_stage",matchType:"year-two-autumn-evaluation",opportunityIndex:2,opportunityDecision:ensureHighSchoolYearTwoAutumnOpportunity()});
    initializeHighSchoolYearTransition(3);player.chapter="青棒關鍵年";player.criticalYearStep=0;
    const render=showCurrentEvent;try{showCurrentEvent=()=>{};choose("critical_offseason",1);}finally{showCurrentEvent=render;}
    play(1,{matchId:"hs-y3-final-competition-1",eventId:"critical_tournament",matchType:"final-competition",opportunityIndex:1,opportunityDecision:ensureHighSchoolYearThreeOpportunity()});
    checks.evidenceOrphans=HighSchoolExchangeNetwork.auditRelationshipEvidence(player.highSchoolExchangeNetwork,player.highSchoolSchedule).orphanRefs;
    return {careerAuditId,cohort,mode,windows,checks};
  };
}
module.exports=function(){const env=make("enabled");env.context.auditHash=value=>require("crypto").createHash("sha256").update(JSON.stringify(value)).digest("hex");env.run("("+installCareerAudit.toString()+")()");return {runCareer:(index,mode="enabled",trace=false)=>env.json("runAuditCareer("+JSON.stringify(index)+","+JSON.stringify(mode)+","+trace+")"),env};};
