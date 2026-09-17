(function(root,factory) {
  const api=factory(typeof module==="object"&&module.exports?require("./high-school-exchange-network"):root.HighSchoolExchangeNetwork);
  if(typeof module==="object"&&module.exports)module.exports=api;else root.HighSchoolFriendlyInvitationSource=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Network) {
  "use strict";
  const VERSION="high-school-friendly-invitation-source-v1";
  const MATCH_PHASES=Object.freeze(["autumn-exhibition","post-autumn-evaluation","year-two-spring-evaluation","year-two-autumn-evaluation","final-competition"]);
  const PRECEDENCE=Object.freeze(["returnVisitProducer","coachNetworkProducer","schoolRelationshipProducer"]);
  const copy=v=>JSON.parse(JSON.stringify(v));
  const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
  const signature=v=>JSON.stringify(stable(v));
  const compare=(a,b)=>a<b?-1:a>b?1:0;
  const validId=v=>typeof v==="string"&&v.trim().length>0;
  const slot=(a,b)=>a.careerYear===b.careerYear&&a.seasonPhase===b.seasonPhase&&a.sequence===b.sequence;
  const typeForDirection=d=>d==="opponentVisitsPlayer"?"outgoingFriendlyInvitation":"incomingFriendlyInvitation";
  function compareSourcePrecedence(a,b) {
    return PRECEDENCE.indexOf(a.producerType)-PRECEDENCE.indexOf(b.producerType)||compare(a.sourceId,b.sourceId);
  }
  function isSourceAlreadyConsumed(source,input) {
    const state=input.schedule||{opportunities:[],entries:[]};
    if(state.opportunities.some(o=>o.careerId===source.careerId&&o.playerSchoolId===source.playerSchoolId&&slot(o,source)
      &&o.opponentSchoolId===source.opponentSchoolId&&o.opportunityType===source.opportunityType))return true;
    // Entry history is also a consumption boundary; collision decisions remain in Schedule.
    const origin=source.direction==="opponentVisitsPlayer"?"homeInvitationFriendly":"awayInvitationFriendly";
    return state.entries.some(e=>slot(e,source)&&e.opponentSchoolId===source.opponentSchoolId&&e.matchOrigin===origin);
  }
  function deriveFriendlyInvitationSources(input) {
    const context=input.context||{},sources=[],diagnostics=[];
    let evidence;
    try {evidence=Network.normalizeState(input.relationshipLedger).evidence;}
    catch(error){return {version:VERSION,sources:[],eligible:[],rejected:[],diagnostics:[{reason:"invalidEvidenceLedger",detail:error.message}]};}
    const schools=new Set((input.schoolRecords||[]).filter(s=>s.teamType==="school"&&s.rosterValid===true&&validId(s.sourceRef)).map(s=>s.schoolId));
    const reject=(e,reason)=>diagnostics.push({evidenceRef:e.evidenceId,opponentSchoolId:e.schoolBId,reason});
    for(const e of evidence) {
      if(e.careerId!==context.careerId||e.schoolAId!==context.playerSchoolId){reject(e,"evidenceAffiliationMismatch");continue;}
      if(e.evidenceType==="competitionEncounter"){reject(e,"competitionEncounterNotFriendlyRelationship");continue;}
      let producerType,sourceType,reasonCode,directions;
      const reverseVisit=e.direction==="hostedOpponent"?"playerVisitsOpponent":e.direction==="visitedOpponent"?"opponentVisitsPlayer":null;
      if(e.evidenceType==="returnVisitEligible") {
        producerType="returnVisitProducer";sourceType="returnVisit";
        directions=[e.direction==="potentialHostOpponent"?"opponentVisitsPlayer":"playerVisitsOpponent"];
        reasonCode=e.direction==="potentialHostOpponent"?"returnVisitFromPriorAwayVisit":"returnVisitFromPriorHomeVisit";
      } else if(e.evidenceType==="coachSchoolConnection") {
        if(!validId(input.currentCoachId)||e.coachId!==input.currentCoachId){reject(e,"coachAffiliationMismatch");continue;}
        producerType="coachNetworkProducer";sourceType="coachConnection";reasonCode="coachConnectionToOpponentSchool";
        // An initiated contact is player-side outreach. Other recorded contacts establish
        // bilateral eligibility, without claiming that either party has accepted an invitation.
        directions=e.source.type==="initiatedContact"?["opponentVisitsPlayer"]:["opponentVisitsPlayer","playerVisitsOpponent"];
      } else {
        producerType="schoolRelationshipProducer";
        const mapping={schoolExchangeMatch:["priorExchange",reverseVisit==="opponentVisitsPlayer"?"priorAwayVisit":reverseVisit?"priorHomeVisit":"priorExchange"],
          homeVisit:["priorExchange","priorHomeVisit"],awayVisit:["priorExchange","priorAwayVisit"],
          developmentExchange:["developmentExchange","priorDevelopmentExchange"],sharedTrainingContext:["sharedTrainingContact","sharedTrainingContact"]};
        if(!mapping[e.evidenceType]){reject(e,"unsupportedRelationshipEvidence");continue;}
        [sourceType,reasonCode]=mapping[e.evidenceType];
        directions=["schoolExchangeMatch","homeVisit","awayVisit"].includes(e.evidenceType)&&reverseVisit?[reverseVisit]:["opponentVisitsPlayer","playerVisitsOpponent"];
      }
      for(const direction of directions) {
        const source={version:VERSION,producerType,sourceType,careerId:context.careerId,careerYear:context.careerYear,
          seasonPhase:context.seasonPhase,sequence:context.sequence??1,playerSchoolId:context.playerSchoolId,opponentSchoolId:e.schoolBId,
          direction,opportunityType:typeForDirection(direction),evidenceRefs:[e.evidenceId],reasonCode,
          provenance:{originCareerYears:[e.careerYear],evidenceSourceRefs:[e.source.sourceId]}};
        source.sourceId="hs-friendly-invitation-source:"+encodeURIComponent(signature([VERSION,producerType,source.careerId,source.careerYear,
          source.seasonPhase,source.sequence,source.playerSchoolId,source.opponentSchoolId,direction,source.evidenceRefs]));
        const reasons=[];
        if(!validId(context.careerId)||!validId(context.playerSchoolId))reasons.push("invalidCareerIdentity");
        if(![1,2,3].includes(context.careerYear))reasons.push("invalidCareerYear");
        if(context.graduated)reasons.push("graduated");
        if(!MATCH_PHASES.includes(context.seasonPhase))reasons.push("phaseNotMatchEligible");
        if(!Number.isInteger(source.sequence)||source.sequence<1)reasons.push("invalidSequence");
        if(e.careerYear>context.careerYear)reasons.push("futureEvidence");
        if(e.schoolBId===context.playerSchoolId)reasons.push("selfSchool");
        if(!schools.has(context.playerSchoolId))reasons.push("invalidPlayerSchool");
        if(!schools.has(e.schoolBId))reasons.push("unknownOpponentSchool");
        if(isSourceAlreadyConsumed(source,input))reasons.push("existingOpportunityPreserved");
        source.exclusionReasons=reasons.sort(compare);
        source.eligibilityState=reasons.length?(reasons.includes("existingOpportunityPreserved")?"consumed":"ineligible"):"eligible";
        sources.push(source);
      }
    }
    const unique=[...new Map(sources.map(s=>[s.sourceId,s])).values()].sort((a,b)=>compare(a.opponentSchoolId,b.opponentSchoolId)||compare(a.direction,b.direction)||compareSourcePrecedence(a,b));
    for(const s of unique)for(const reason of s.exclusionReasons)diagnostics.push({sourceId:s.sourceId,evidenceRefs:s.evidenceRefs,reason});
    diagnostics.sort((a,b)=>compare(signature(a),signature(b)));
    return {version:VERSION,sources:unique,eligible:unique.filter(s=>s.eligibilityState==="eligible"),rejected:unique.filter(s=>s.eligibilityState!=="eligible"),diagnostics};
  }
  function validateInvitationSource(source,input) {
    const current=deriveFriendlyInvitationSources(input).sources.find(s=>s.sourceId===source?.sourceId);
    if(!current||signature(current)!==signature(source))throw new Error("Invalid or stale invitation source / evidence reference");
    return true;
  }
  function materializeInvitationSourceToCandidateInput(source,input) {
    validateInvitationSource(source,input);
    const coach=source.producerType==="coachNetworkProducer",ref=source.evidenceRefs[0];
    return {opportunityType:source.opportunityType,opponentSchoolId:source.opponentSchoolId,sequence:source.sequence,
      source:{type:coach?"coachNetwork":"schoolRelationship",sourceId:source.sourceId},sourceAuthority:"canonicalRelationshipProducer",
      canonicalEvidence:true,producerType:source.producerType,producerExclusionReasons:copy(source.exclusionReasons),
      ...(coach?{networkEvidenceRef:ref}:{relationshipEvidenceRef:ref}),
      provenance:{invitationSourceId:source.sourceId,producerType:source.producerType,evidenceRefs:copy(source.evidenceRefs),reasonCode:source.reasonCode,
        sourceReason:source.reasonCode,...(coach?{networkEvidenceRef:ref}:{relationshipEvidenceRef:ref}),
        evidenceCareerYear:source.provenance.originCareerYears[0],supportingEvidenceRefs:copy(source.evidenceRefs)}};
  }
  function auditInvitationSources(result) {
    const byProducer={},byReason={};
    for(const s of result.sources)byProducer[s.producerType]=(byProducer[s.producerType]||0)+1;
    for(const d of result.diagnostics)byReason[d.reason]=(byReason[d.reason]||0)+1;
    return {sourceCount:result.sources.length,eligibleCount:result.eligible.length,rejectedCount:result.rejected.length,
      duplicateSourceIds:result.sources.length-new Set(result.sources.map(s=>s.sourceId)).size,byProducer:stable(byProducer),byReason:stable(byReason)};
  }
  const forProducer=(input,type)=>deriveFriendlyInvitationSources(input).sources.filter(s=>s.producerType===type);
  return Object.freeze({VERSION,MATCH_PHASES,PRECEDENCE,deriveFriendlyInvitationSources,deriveAllFriendlyInvitationSources:deriveFriendlyInvitationSources,
    deriveReturnVisitSources:input=>forProducer(input,"returnVisitProducer"),deriveCoachNetworkSources:input=>forProducer(input,"coachNetworkProducer"),
    deriveSchoolRelationshipSources:input=>forProducer(input,"schoolRelationshipProducer"),
    deriveInvitationSourcesForOpponent:(input,id)=>deriveFriendlyInvitationSources(input).sources.filter(s=>s.opponentSchoolId===id),
    getInvitationSourceDiagnostics:input=>deriveFriendlyInvitationSources(input).diagnostics,
    validateInvitationSource,materializeInvitationSourceToCandidateInput,isSourceAlreadyConsumed,compareSourcePrecedence,auditInvitationSources});
});
