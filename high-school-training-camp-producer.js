(function(root,factory) {
  const api=factory(typeof module==="object"&&module.exports?require("./high-school-exchange-network"):root.HighSchoolExchangeNetwork,
    typeof module==="object"&&module.exports?require("./high-school-friendly-invitation-producer"):root.HighSchoolFriendlyInvitationSource);
  if(typeof module==="object"&&module.exports)module.exports=api;else root.HighSchoolTrainingCampSource=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Network,Friendly) {
  "use strict";
  const VERSION="high-school-training-camp-source-v1";
  const PRECEDENCE=Object.freeze(["explicitCampPlan","sharedTrainingContextCamp","coachNetworkCamp","schoolRelationshipCamp"]);
  const copy=v=>JSON.parse(JSON.stringify(v));
  const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
  const sig=v=>JSON.stringify(stable(v)),compare=(a,b)=>a<b?-1:a>b?1:0;
  const id=v=>typeof v==="string"&&v.trim().length>0;
  const unique=values=>[...new Set(values)].sort(compare);
  const identity=(prefix,values)=>prefix+":"+encodeURIComponent(sig(values));
  const slot=(a,b)=>a.careerYear===b.careerYear&&a.seasonPhase===b.seasonPhase&&a.sequence===b.sequence;
  const isExplicitPlan=s=>s.opportunityType==="trainingCampOpportunity"&&s.source?.type==="trainingCampPlan"&&(s.explicit===true||s.sourceAuthority==="existing");
  function consumption(match,input) {
    const state=input.schedule||{opportunities:[],entries:[]};
    const same=o=>slot(o,match)&&o.opponentSchoolId===match.opponentSchoolId;
    const entry=state.entries.find(e=>same(e)&&e.matchOrigin==="trainingCamp");
    if(entry)return entry.status==="completed"?"alreadyCompleted":"alreadyScheduled";
    if(state.opportunities.some(o=>same(o)&&o.careerId===match.careerId&&o.playerSchoolId===match.playerSchoolId&&o.opportunityType==="trainingCampOpportunity"))return "existingOpportunityPreserved";
    return null;
  }
  function deriveTrainingCampSources(input) {
    const c=input.context||{},diagnostics=[],raw=[];
    const reject=(reason,refs={})=>diagnostics.push({reason,...refs});
    const schools=unique((input.schoolRecords||[]).filter(s=>id(s.schoolId)&&s.teamType==="school"&&s.rosterValid===true&&id(s.sourceRef)).map(s=>s.schoolId));
    let ledger;
    try{ledger=Network.normalizeState(input.relationshipLedger).evidence;}
    catch(error){reject("invalidEvidenceLedger",{detail:error.message});ledger=[];}
    const globalReasons=[];
    if(!id(c.careerId)||!schools.includes(c.playerSchoolId))globalReasons.push("invalidPlayerSchool");
    if(![1,2,3].includes(c.careerYear))globalReasons.push("invalidCareerYear");
    if(c.graduated)globalReasons.push("graduated");
    if(!Friendly.MATCH_PHASES.includes(c.seasonPhase))globalReasons.push("phaseNotEligible");
    for(const reason of globalReasons)reject(reason);
    function add(type,participants,host,refs,reason,extra={}) {
      const sequence=extra.sequence??c.sequence??1;
      const ref={sourceType:type,evidenceRefs:refs};
      if(!Array.isArray(participants)){reject("missingParticipant",ref);return;}
      if(participants.some(p=>!id(p)||!schools.includes(p))){reject("orphanSchoolReference",ref);return;}
      const members=unique(participants);
      if(members.length!==participants.length)reject("duplicateParticipant",ref);
      if(!members.includes(c.playerSchoolId)||members.length<2){reject("missingParticipant",ref);return;}
      if(host&&!members.includes(host)){reject("invalidHostParticipant",ref);return;}
      if(!Number.isInteger(sequence)||sequence<1){reject("invalidSequence",ref);return;}
      if(globalReasons.length)return;
      const planned=copy(extra.plannedContext||{});
      const source={version:VERSION,careerId:c.careerId,careerYear:c.careerYear,seasonPhase:c.seasonPhase,sequence,playerSchoolId:c.playerSchoolId,
        hostSchoolId:host||null,hostContext:host?{hostTeamId:host}:{},sourceType:type,sourceAuthority:"canonicalTrainingCampProducer",
        evidenceRefs:unique(refs),participantSchoolIds:members,venueIntent:copy(planned.venueContext||{type:"trainingVenue"}),reasonCode:reason,
        provenance:{sourceRefs:unique(extra.sourceRefs||[]),originCareerYears:unique(extra.originCareerYears||[])},plannedContext:planned};
      // An explicit campId identifies a distinct plan; unlabelled sources share the same scoped camp.
      source.semanticCampKey=identity("hs-camp-scope",[VERSION,c.careerId,c.careerYear,c.seasonPhase,sequence,c.playerSchoolId,host||null,members,planned.campId||null]);
      raw.push(source);
    }
    for(const plan of (input.sources||[]).filter(isExplicitPlan)) {
      if(!id(plan.source.sourceId)){reject("invalidExplicitPlan");continue;}
      if((plan.careerYear!==undefined&&plan.careerYear!==c.careerYear)||(plan.seasonPhase!==undefined&&plan.seasonPhase!==c.seasonPhase)){reject("staleExplicitPlan");continue;}
      if(plan.opponentSchoolId===c.playerSchoolId){reject("selfOpponent");continue;}
      const members=plan.participantSchoolIds||(plan.opponentSchoolId?[c.playerSchoolId,plan.opponentSchoolId]:schools);
      add("explicitCampPlan",members,plan.hostSchoolId||plan.plannedContext?.hostContext?.hostTeamId||null,[],"eligibleExplicitPlan",
        {sequence:plan.sequence,plannedContext:plan.plannedContext,sourceRefs:[plan.source.sourceId]});
    }
    for(const e of ledger) {
      if(e.careerId!==c.careerId||e.schoolAId!==c.playerSchoolId){reject("evidenceAffiliationMismatch",{evidenceRef:e.evidenceId});continue;}
      if(e.careerYear>c.careerYear){reject("futureEvidence",{evidenceRef:e.evidenceId});continue;}
      let type,reason;
      if(e.evidenceType==="competitionEncounter"){reject("competitionEncounterNotCampRelationship",{evidenceRef:e.evidenceId});continue;}
      if(e.evidenceType==="returnVisitEligible"){reject("returnVisitAloneNotCampRelationship",{evidenceRef:e.evidenceId});continue;}
      if(e.evidenceType==="sharedTrainingContext"){type="sharedTrainingContextCamp";reason="eligibleSharedTrainingContext";}
      else if(e.evidenceType==="coachSchoolConnection") {
        if(!id(input.currentCoachId)||e.coachId!==input.currentCoachId){reject("coachAffiliationMismatch",{evidenceRef:e.evidenceId});continue;}
        // Explicit, established inter-school contacts are camp-compatible; metadata-only
        // invitationCoachRef and unreciprocated initiatedContact are insufficient for a camp.
        if(!["knownCounterpart","previousAffiliation"].includes(e.source.type)){reject("coachContactNotCampCompatible",{evidenceRef:e.evidenceId});continue;}
        type="coachNetworkCamp";reason="eligibleCoachNetwork";
      } else if(["schoolExchangeMatch","developmentExchange"].includes(e.evidenceType)){type="schoolRelationshipCamp";reason="eligibleSchoolRelationship";}
      else continue;
      // Past hosting does not promise future hosting. Evidence-derived camps have neutral
      // host intent; explicit plans alone can name a future host school.
      add(type,[c.playerSchoolId,e.schoolBId],null,[e.evidenceId],reason,{sourceRefs:[e.source.sourceId],originCareerYears:[e.careerYear]});
    }
    const groups=new Map();
    for(const s of raw){const g=groups.get(s.semanticCampKey)||[];g.push(s);groups.set(s.semanticCampKey,g);}
    const sources=[];
    for(const group of groups.values()) {
      group.sort((a,b)=>PRECEDENCE.indexOf(a.sourceType)-PRECEDENCE.indexOf(b.sourceType)||compare(sig(a),sig(b)));
      const s=copy(group[0]);
      s.evidenceRefs=unique(group.flatMap(x=>x.evidenceRefs));
      s.provenance={sourceRefs:unique(group.flatMap(x=>x.provenance.sourceRefs)),originCareerYears:unique(group.flatMap(x=>x.provenance.originCareerYears))};
      s.campSourceId=identity("hs-camp-source",[s.semanticCampKey,s.sourceType,s.evidenceRefs,s.provenance.sourceRefs]);
      s.eligibilityState="eligible";
      for(let n=1;n<group.length;n++)reject("duplicateCampSource",{campSourceId:s.campSourceId,supersededSourceType:group[n].sourceType});
      sources.push(s);
    }
    sources.sort((a,b)=>compare(a.campSourceId,b.campSourceId));
    const participants=sources.flatMap(s=>s.participantSchoolIds.map(schoolId=>({participantRef:identity("hs-camp-participant",[s.campSourceId,schoolId]),campSourceId:s.campSourceId,schoolId,
      role:s.hostSchoolId?(schoolId===s.hostSchoolId?"host":"guest"):"neutralParticipant",hostStatus:s.hostSchoolId?(schoolId===s.hostSchoolId?"host":"nonHost"):"neutral",sourceEvidenceRefs:copy(s.evidenceRefs)})));
    const matchSources=[];
    for(const s of sources)for(const opponentSchoolId of s.participantSchoolIds.filter(p=>p!==c.playerSchoolId)) {
      const m={version:VERSION,campSourceId:s.campSourceId,careerId:s.careerId,careerYear:s.careerYear,seasonPhase:s.seasonPhase,sequence:s.sequence,
        playerSchoolId:s.playerSchoolId,opponentSchoolId,hostContext:copy(s.hostContext),venueIntent:copy(s.venueIntent),evidenceRefs:copy(s.evidenceRefs),
        producerType:"trainingCampProducer",sourceType:s.sourceType,reasonCode:s.reasonCode,participantRefs:participants.filter(p=>p.campSourceId===s.campSourceId).map(p=>p.participantRef),
        provenance:copy(s.provenance),plannedContext:{...copy(s.plannedContext),hostContext:copy(s.hostContext),venueContext:copy(s.venueIntent),campId:s.plannedContext.campId||s.campSourceId}};
      m.campMatchSourceId=identity("hs-camp-match-source",[s.campSourceId,opponentSchoolId,s.sequence]);
      const consumed=consumption(m,input);m.exclusionReasons=consumed?[consumed]:[];m.eligible=!consumed;
      matchSources.push(m);
    }
    // Distinct camps may offer the same opponent/slot; one canonical candidate wins.
    const winners=new Map();
    for(const m of [...matchSources].sort((a,b)=>PRECEDENCE.indexOf(a.sourceType)-PRECEDENCE.indexOf(b.sourceType)||compare(a.campMatchSourceId,b.campMatchSourceId))) {
      const key=sig([m.sequence,m.opponentSchoolId]);
      if(winners.has(key)){m.exclusionReasons.push("duplicateMatchSource");m.eligible=false;}else winners.set(key,m);
      for(const reason of m.exclusionReasons)reject(reason,{campMatchSourceId:m.campMatchSourceId});
    }
    matchSources.sort((a,b)=>compare(a.opponentSchoolId,b.opponentSchoolId)||compare(a.campMatchSourceId,b.campMatchSourceId));
    diagnostics.sort((a,b)=>compare(sig(a),sig(b)));
    return {version:VERSION,sources,participants,matchSources,eligible:matchSources.filter(m=>m.eligible),diagnostics};
  }
  function validateCampSource(source,input) {
    const current=deriveTrainingCampSources(input).sources.find(s=>s.campSourceId===source?.campSourceId);
    if(!current||sig(current)!==sig(source))throw Error("Invalid or stale camp source");return true;
  }
  function validateCampParticipant(participant,input) {
    const current=deriveTrainingCampSources(input).participants.find(p=>p.participantRef===participant?.participantRef);
    if(!current||sig(current)!==sig(participant))throw Error("Invalid or stale camp participant");return true;
  }
  function adaptCampMatchSourceToCandidateInput(match,input) {
    const current=deriveTrainingCampSources(input).matchSources.find(m=>m.campMatchSourceId===match?.campMatchSourceId);
    if(!current||sig(current)!==sig(match))throw Error("Invalid or stale camp match source");
    return {opportunityType:"trainingCampOpportunity",opponentSchoolId:match.opponentSchoolId,sequence:match.sequence,
      source:{type:"trainingCampPlan",sourceId:match.campMatchSourceId},sourceAuthority:"canonicalTrainingCampProducer",producerExclusionReasons:copy(match.exclusionReasons),
      plannedContext:copy(match.plannedContext),provenance:{campSourceId:match.campSourceId,campMatchSourceId:match.campMatchSourceId,
        participantRefs:copy(match.participantRefs),evidenceRefs:copy(match.evidenceRefs),producerType:match.producerType,reasonCode:match.reasonCode,sourceRefs:copy(match.provenance.sourceRefs)}};
  }
  function auditCampSources(result) {
    const rejectedByReason={};for(const d of result.diagnostics)rejectedByReason[d.reason]=(rejectedByReason[d.reason]||0)+1;
    return {sourceCount:result.sources.length,participantCount:result.participants.length,matchSourceCount:result.matchSources.length,eligibleCount:result.eligible.length,
      duplicateSourceIds:result.sources.length-new Set(result.sources.map(s=>s.campSourceId)).size,
      duplicateMatchSourceIds:result.matchSources.length-new Set(result.matchSources.map(m=>m.campMatchSourceId)).size,
      orphanSchoolRefs:rejectedByReason.orphanSchoolReference||0,selfOpponentFacts:result.matchSources.filter(m=>m.playerSchoolId===m.opponentSchoolId).length,rejectedByReason:stable(rejectedByReason)};
  }
  return Object.freeze({VERSION,PRECEDENCE,isExplicitPlan,deriveTrainingCampSources,deriveCampParticipants:input=>deriveTrainingCampSources(input).participants,
    deriveCampMatchSources:input=>deriveTrainingCampSources(input).matchSources,validateCampSource,validateCampParticipant,auditCampSources,auditTrainingCampSources:auditCampSources,adaptCampMatchSourceToCandidateInput});
});
