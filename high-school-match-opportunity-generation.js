(function(root,factory) {
  const api=factory(typeof module==="object"&&module.exports?require("./high-school-schedule-opportunity"):root.HighSchoolScheduleOpportunity,
    typeof module==="object"&&module.exports?require("./high-school-friendly-invitation-producer"):root.HighSchoolFriendlyInvitationSource,
    typeof module==="object"&&module.exports?require("./high-school-training-camp-producer"):root.HighSchoolTrainingCampSource);
  if(typeof module==="object"&&module.exports) module.exports=api;
  else root.HighSchoolMatchOpportunityGeneration=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Schedule,Producer,Camp) {
  "use strict";
  const VERSION="high-school-opportunity-generation-v1";
  const copy=value=>JSON.parse(JSON.stringify(value));
  const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==="object"?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
  const signature=value=>JSON.stringify(stable(value));
  const compare=(a,b)=>a<b?-1:a>b?1:0;
  const check=(value,message)=>{if(!value)throw new Error(`Opportunity generation: ${message}`);};
  const validId=value=>typeof value==="string"&&value.trim().length>0;
  const slotEqual=(a,b)=>a.careerYear===b.careerYear&&a.seasonPhase===b.seasonPhase&&a.sequence===b.sequence;
  const MATCH_PHASES=Object.freeze(["autumn-exhibition","post-autumn-evaluation","year-two-spring-evaluation","year-two-autumn-evaluation","final-competition"]);
  function deriveEligibilityContext(input) {
    return {careerId:input.careerId,careerYear:input.careerYear,seasonPhase:input.seasonPhase,sequence:input.sequence??1,
      playerSchoolId:input.playerSchoolId,graduated:input.graduated===true,mandatorySlots:copy(input.mandatorySlots||[])};
  }
  function isOpportunityTypeAllowedInSeasonPhase(type,context,source={}) {
    const reasons=[];
    if(!Object.hasOwn(Schedule.ORIGIN_MAP,type)) reasons.push("unknownOpportunityType");
    if(![1,2,3].includes(context.careerYear)) reasons.push("invalidYear");
    if(context.graduated) reasons.push("graduated");
    if(!MATCH_PHASES.includes(context.seasonPhase)) reasons.push("phaseNotMatchEligible");
    if(type==="officialCompetitionOpportunity"&&source.source?.type!=="competitionCalendar") reasons.push("missingCompetitionAuthority");
    if(type==="trainingCampOpportunity"&&!(source.source?.type==="trainingCampPlan"&&(source.sourceAuthority==="existing"||source.explicit===true||source.sourceAuthority==="canonicalTrainingCampProducer"))) reasons.push("missingTrainingCampPlan");
    if(type==="neutralExchangeOpportunity"&&source.explicit!==true) reasons.push("missingNeutralSource");
    return {allowed:reasons.length===0,reasons,eligibleReasons:reasons.length?[]:["seasonPhaseAllowed","phaseAllowsMatchWithoutCalendarAssumption"]};
  }
  function deriveOpponentCandidatePool(records,playerSchoolId) {
    const grouped=new Map(),rejected=[],opponents=[];
    for(const record of records||[]) {
      if(!validId(record?.schoolId)) {rejected.push({schoolId:null,reason:"invalidSchoolIdentity"});continue;}
      if(record.schoolId===playerSchoolId) {rejected.push({schoolId:record.schoolId,reason:"selfOpponent"});continue;}
      if(record.teamType!=="school"||record.rosterValid!==true||!validId(record.sourceRef)) {rejected.push({schoolId:record.schoolId,reason:"invalidSchoolRecord"});continue;}
      const group=grouped.get(record.schoolId)||[];group.push(record);grouped.set(record.schoolId,group);
    }
    for(const [schoolId,group] of grouped) {
      group.sort((a,b)=>compare(signature(a),signature(b)));
      const first=group[0];
      opponents.push({schoolId,sourceRefs:[...new Set(group.map(item=>item.sourceRef))].sort(compare),
        ...(first.strengthRef?{strengthRef:copy(first.strengthRef)}:{}),...(first.schoolStandard?{schoolStandard:first.schoolStandard}:{}),
        ...(first.coachRef?{coachRef:copy(first.coachRef)}:{}),...(first.rivalRef?{rivalRef:copy(first.rivalRef)}:{})});
      for(let index=1;index<group.length;index++) rejected.push({schoolId,reason:"duplicateSchoolIdentity"});
    }
    opponents.sort((a,b)=>compare(a.schoolId,b.schoolId));rejected.sort((a,b)=>compare(signature(a),signature(b)));
    return {inputSchoolCount:(records||[]).length,opponents,rejected};
  }
  function opportunityInput(candidate) {
    return {careerId:candidate.careerId,careerYear:candidate.careerYear,seasonPhase:candidate.seasonPhase,sequence:candidate.sequence,
      playerSchoolId:candidate.playerSchoolId,opponentSchoolId:candidate.opponentSchoolId,opportunityType:candidate.opportunityType,
      source:copy(candidate.source),plannedContext:copy(candidate.plannedContext),competitionRefs:copy(candidate.competitionRefs),status:"offered",
      provenance:{...copy(candidate.sourceProvenance),candidateRef:{candidateId:candidate.candidateId,sourceAuthority:candidate.sourceAuthority,
        sourceRefs:copy(candidate.provenance.opponentSourceRefs),priorMatchRefs:copy(candidate.provenance.priorMatchRefs),
        ...(candidate.provenance.networkEvidenceRef?{networkEvidenceRef:copy(candidate.provenance.networkEvidenceRef)}:{}),
        ...(candidate.provenance.relationshipEvidenceRef?{relationshipEvidenceRef:copy(candidate.provenance.relationshipEvidenceRef)}:{}),
        ...(candidate.opponentStrengthRef?{opponentStrengthRef:copy(candidate.opponentStrengthRef)}:{}),
        ...(candidate.coachRef?{coachRef:copy(candidate.coachRef)}:{}),eligibilityReasons:copy(candidate.eligibilityReasons),generationVersion:VERSION}}};
  }
  function deriveOpportunityCandidates(input) {
    const context=deriveEligibilityContext(input.context),pool=deriveOpponentCandidatePool(input.schoolRecords,context.playerSchoolId);
    const schedule=input.schedule||Schedule.emptyState(),producerResult=Producer?Producer.deriveFriendlyInvitationSources(input):{sources:[],diagnostics:[]};
    const relationshipSources=producerResult.sources.map(s=>Producer.materializeInvitationSourceToCandidateInput(s,input));
    const campResult=Camp?Camp.deriveTrainingCampSources(input):{matchSources:[],diagnostics:[]};
    const campSources=campResult.matchSources.map(s=>Camp.adaptCampMatchSourceToCandidateInput(s,input));
    const sources=[...copy((input.sources||[]).filter(s=>!Camp||!Camp.isExplicitPlan(s))),...relationshipSources,...campSources],diagnostics=[...pool.rejected.map(copy),...producerResult.diagnostics.map(copy),...campResult.diagnostics.map(copy)];
    const winners=new Map();
    for(const source of relationshipSources) {
      if(source.producerExclusionReasons.some(reason=>reason!=="existingOpportunityPreserved"))continue;
      const key=signature([source.opportunityType,source.opponentSchoolId,source.sequence]);
      const current=winners.get(key);
      if(!current||Producer.compareSourcePrecedence({producerType:source.producerType,sourceId:source.source.sourceId},{producerType:current.producerType,sourceId:current.source.sourceId})<0)winners.set(key,source);
    }
    if(input.includeFoundationFallback!==false) for(const opportunityType of ["incomingFriendlyInvitation","outgoingFriendlyInvitation"])
      sources.push({opportunityType,source:{type:"systemEligibility",sourceId:"foundation-eligibility"},sourceAuthority:"fallback"});
    const candidates=[],seen=new Set();
    for(const source of sources.sort((a,b)=>compare(signature(a),signature(b)))) {
      const targets=source.opponentSchoolId?pool.opponents.filter(item=>item.schoolId===source.opponentSchoolId):pool.opponents;
      if(!targets.length&&source.opponentSchoolId) diagnostics.push({schoolId:source.opponentSchoolId,reason:source.opponentSchoolId===context.playerSchoolId?"selfOpponent":"unknownSourceOpponent"});
      for(const opponent of targets) {
        const candidate={careerId:context.careerId,careerYear:context.careerYear,seasonPhase:context.seasonPhase,
          sequence:source.sequence??context.sequence,opportunityType:source.opportunityType,playerSchoolId:context.playerSchoolId,
          opponentSchoolId:opponent.schoolId,source:copy(source.source||{}),sourceAuthority:source.sourceAuthority,
          priority:source.opportunityType==="officialCompetitionOpportunity"?"mandatory":"optional",
          plannedContext:copy(source.plannedContext||{}),competitionRefs:copy(source.competitionRefs||{}),sourceProvenance:copy(source.provenance||{}),
          provenance:{opponentSourceRefs:copy(opponent.sourceRefs),priorMatchRefs:[...new Set((input.history||[]).filter(item=>item.opponentSchoolId===opponent.schoolId).map(item=>item.matchId).filter(validId))].sort(compare),
            ...(source.networkEvidenceRef?{networkEvidenceRef:copy(source.networkEvidenceRef)}:{}),
            ...(source.relationshipEvidenceRef?{relationshipEvidenceRef:copy(source.relationshipEvidenceRef)}:{})},
          ...(opponent.strengthRef?{opponentStrengthRef:copy(opponent.strengthRef)}:{}),...(opponent.schoolStandard?{schoolStandard:opponent.schoolStandard}:{}),
          ...(opponent.coachRef?{coachRef:copy(opponent.coachRef)}:{}),...(opponent.rivalRef?{rivalRef:copy(opponent.rivalRef)}:{}),
          relationshipEvidence:source.relationshipEvidenceRef||null};
        candidate.candidateId="hs-opportunity-candidate:"+encodeURIComponent(signature([VERSION,candidate.careerId,candidate.careerYear,candidate.seasonPhase,candidate.sequence,candidate.opportunityType,candidate.source.type,candidate.source.sourceId,candidate.playerSchoolId,candidate.opponentSchoolId]));
        if(seen.has(candidate.candidateId)) {diagnostics.push({candidateId:candidate.candidateId,reason:"duplicateCandidate"});continue;}seen.add(candidate.candidateId);
        const phase=isOpportunityTypeAllowedInSeasonPhase(candidate.opportunityType,context,source),reasons=[...phase.reasons,...(source.producerExclusionReasons||[])];
        const winner=winners.get(signature([candidate.opportunityType,candidate.opponentSchoolId,candidate.sequence]));
        if(source.canonicalEvidence&&winner&&winner.source.sourceId!==source.source.sourceId)reasons.push("supersededByHigherPriorityProducer");
        if(!validId(context.careerId)||!validId(context.playerSchoolId))reasons.push("invalidCareerIdentity");
        if(!["existing","fallback","fixture","canonicalRelationshipProducer","canonicalTrainingCampProducer"].includes(source.sourceAuthority))reasons.push("missingSourceAuthority");
        if((candidate.source.type==="coachNetwork"&&!source.networkEvidenceRef)||(candidate.source.type==="schoolRelationship"&&!source.relationshipEvidenceRef))reasons.push("missingRelationshipAuthority");
        if(source.careerYear!==undefined&&source.careerYear!==context.careerYear)reasons.push("staleSourceYear");
        if(source.seasonPhase!==undefined&&source.seasonPhase!==context.seasonPhase)reasons.push("staleSourcePhase");
        const reservation=context.mandatorySlots.find(slot=>slotEqual(slot,candidate)&&slot.sourceId===candidate.source.sourceId);
        if(candidate.priority==="mandatory") {
          const refs=candidate.competitionRefs;
          const entry=(input.competition?.entries||[]).find(item=>item.entryId===refs.competitionEntryId&&item.competitionEditionId===refs.competitionEditionId&&item.teamId===context.playerSchoolId&&item.entryStatus==="entered");
          const edition=(input.competition?.editions||[]).find(item=>item.editionId===refs.competitionEditionId);
          if(source.sourceAuthority!=="existing"&&source.sourceAuthority!=="fixture")reasons.push("missingCompetitionAuthority");
          if(!(entry&&edition)&&!reservation)reasons.push("missingCompetitionAuthority");
          if(!validId(source.matchId))reasons.push("missingCompetitionMatchReference");
          if((refs.competitionEntryId||refs.competitionEditionId)&&!(entry&&edition))reasons.push("invalidCompetitionReferences");
        }
        candidate.eligibilityReasons=[...phase.eligibleReasons,"opponentValid"];
        if(source.sourceAuthority==="fallback")candidate.eligibilityReasons.push("foundationEligibilityOnly");
        let canonical;
        try {canonical=Schedule.createOpportunity(opportunityInput(candidate));candidate.plannedContext=copy(canonical.plannedContext);
          candidate.originIntent=canonical.matchOrigin;candidate.venueIntent=copy(canonical.plannedContext.venueContext);candidate.hostIntent=copy(canonical.plannedContext.hostContext);
          const eligibility=Schedule.isOpportunityEligible({...canonical,status:"accepted"},{...context,schoolIds:[context.playerSchoolId,...pool.opponents.map(item=>item.schoolId)]},schedule);
          const map={"mandatory-competition-conflict":"blockedByMandatoryCompetition","occupied-slot":"scheduleSlotOccupied","wrong-career-year":"invalidYear","incompatible-phase":"phaseNotMatchEligible"};
          reasons.push(...eligibility.reasons.map(reason=>map[reason]||reason));
          if(candidate.priority==="optional"&&schedule.entries.some(item=>item.status!=="cancelled"&&item.matchOrigin==="officialCompetition"&&slotEqual(item,candidate)))reasons.push("blockedByMandatoryCompetition");
          const existing=schedule.opportunities.find(item=>item.opportunityId===canonical.opportunityId||item.provenance?.candidateRef?.candidateId===candidate.candidateId);
          if(existing)reasons.push("existingOpportunity");
          if(["incomingFriendlyInvitation","outgoingFriendlyInvitation"].includes(candidate.opportunityType)&&schedule.opportunities.some(item=>item.careerId===candidate.careerId&&slotEqual(item,candidate)
            &&item.opportunityType===candidate.opportunityType&&item.opponentSchoolId===candidate.opponentSchoolId))reasons.push("existingOpportunity");
          if(source.sourceAuthority==="fallback"&&winner)reasons.push("supersededByCanonicalSource");
          if((input.history||[]).some(item=>item.careerYear===candidate.careerYear&&item.matchId===source.matchId))reasons.push("completedSourceMatch");
          if(input.activeMatch?.id&&input.activeMatch.id===source.matchId&&!input.activeMatch.completed)reasons.push("activeSourceMatch");
        }catch(error){reasons.push("invalidOpportunityFacts");}
        candidate.exclusionReasons=[...new Set(reasons)].sort(compare);candidate.eligible=candidate.exclusionReasons.length===0;
        if(candidate.eligible)candidate.eligibilityReasons.push("slotAvailable");
        candidate.eligibilityReasons.sort(compare);candidates.push(candidate);
      }
    }
    candidates.sort((a,b)=>compare(a.priority==="mandatory"?0:1,b.priority==="mandatory"?0:1)||compare(a.opportunityType,b.opportunityType)||compare(a.opponentSchoolId,b.opponentSchoolId)||compare(a.candidateId,b.candidateId));
    diagnostics.sort((a,b)=>compare(signature(a),signature(b)));
    return {version:VERSION,context,pool,candidates,eligible:candidates.filter(item=>item.eligible),rejected:candidates.filter(item=>!item.eligible),diagnostics};
  }
  function materializeOpportunityCandidate(state,candidate,input) {
    check(candidate&&validId(candidate.candidateId),"candidate required");
    // Re-derive against current authorities; a caller cannot flip eligibility or reuse a stale snapshot.
    const current=deriveOpportunityCandidates({...input,schedule:state}).candidates.find(item=>item.candidateId===candidate.candidateId);
    check(current,"stale candidate");
    const existing=state.opportunities.find(item=>item.provenance?.candidateRef?.candidateId===candidate.candidateId);
    if(existing) {
      const normalized=Schedule.createOpportunity(opportunityInput(current));
      check(existing.opportunityId===normalized.opportunityId&&signature(existing.source)===signature(normalized.source)
        &&signature(existing.plannedContext)===signature(normalized.plannedContext)&&signature(existing.competitionRefs)===signature(normalized.competitionRefs),"candidate facts changed");
      return existing;
    }
    check(current.eligible,"candidate excluded: "+current.exclusionReasons.join(","));
    return Schedule.offerOpportunity(state,Schedule.createOpportunity(opportunityInput(current)));
  }
  function auditCandidates(result) {
    const rejectedByReason={};
    for(const reason of [...result.diagnostics.map(item=>item.reason),...result.rejected.flatMap(item=>item.exclusionReasons)])rejectedByReason[reason]=(rejectedByReason[reason]||0)+1;
    return {inputSchoolCount:result.pool.inputSchoolCount,validOpponentCount:result.pool.opponents.length,eligibleCandidateCount:result.eligible.length,
      rejectedCandidateCount:result.rejected.length,rejectedByReason:stable(rejectedByReason)};
  }
  return Object.freeze({VERSION,MATCH_PHASES,deriveEligibilityContext,isOpportunityTypeAllowedInSeasonPhase,deriveOpponentCandidatePool,
    deriveOpportunityCandidates,deriveOfficialCompetitionCandidates:input=>deriveOpportunityCandidates(input).candidates.filter(item=>item.priority==="mandatory"),materializeOpportunityCandidate,auditCandidates});
});
