(function(root,factory) {
  const api=factory(typeof module==="object"&&module.exports?require("./match-context-foundation"):root.MatchContextFoundation);
  if(typeof module==="object"&&module.exports)module.exports=api;else root.HighSchoolExchangeNetwork=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(MatchContext) {
  "use strict";
  const VERSION="high-school-exchange-network-v1";
  const TYPES=Object.freeze(["coachSchoolConnection","schoolExchangeMatch","homeVisit","awayVisit","returnVisitEligible","sharedTrainingContext","competitionEncounter","developmentExchange"]);
  const CONTACT_SOURCES=Object.freeze(["previousAffiliation","knownCounterpart","initiatedContact","invitationCoachRef"]);
  const copy=value=>JSON.parse(JSON.stringify(value));
  const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==="object"?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
  const signature=value=>JSON.stringify(stable(value));
  const compare=(a,b)=>a<b?-1:a>b?1:0;
  const check=(ok,message)=>{if(!ok)throw new Error(`Exchange evidence: ${message}`);};
  const id=value=>{check(typeof value==="string"&&value.trim(),"missing identity");return value;};
  const order=(a,b)=>a.careerYear-b.careerYear||a.sequence-b.sequence||compare(a.evidenceType,b.evidenceType)||compare(a.evidenceId,b.evidenceId);
  const emptyState=()=>({version:VERSION,evidence:[]});
  function createRelationshipEvidence(input) {
    const allowed=["evidenceId","evidenceType","careerId","careerYear","seasonPhase","sequence","schoolAId","schoolBId","coachId","source","matchId","scheduleEntryId","matchOrigin","hostSchoolId","visitorSchoolId","direction","completed","parentEvidenceId","sourceReason","candidateIntent","provenance"];
    check(Object.keys(input).every(key=>allowed.includes(key)),"unsupported evidence field");
    check(TYPES.includes(input.evidenceType),"unknown evidence type");
    check([1,2,3].includes(input.careerYear),"invalid career year");
    check(Number.isInteger(input.sequence)&&input.sequence>0,"invalid sequence");
    const result={evidenceType:input.evidenceType,careerId:id(input.careerId),careerYear:input.careerYear,seasonPhase:id(input.seasonPhase),sequence:input.sequence,
      schoolAId:id(input.schoolAId),schoolBId:id(input.schoolBId),source:{type:id(input.source?.type),sourceId:id(input.source?.sourceId)},direction:input.direction,sourceReason:id(input.sourceReason),
      provenance:copy(input.provenance||{})};
    check(result.schoolAId!==result.schoolBId,"self relationship");
    check(Object.keys(result.provenance).every(key=>["opportunityId","gameRecordId","coachSourceRef","sourceAuthority"].includes(key)),"unsupported provenance field");
    check(Object.values(result.provenance).every(value=>typeof value==="string"),"provenance must contain references only");
    if(result.evidenceType==="coachSchoolConnection") {
      result.coachId=id(input.coachId);
      check(CONTACT_SOURCES.includes(result.source.type)&&result.direction==="connection","invalid coach connection source/direction");
      check(!input.matchId&&!input.parentEvidenceId&&!input.matchOrigin&&!input.completed&&!input.hostSchoolId&&!input.visitorSchoolId,"coach source mismatch");
      check(result.provenance.coachSourceRef===result.source.sourceId,"coach source reference mismatch");
    } else {
      result.matchId=id(input.matchId);result.scheduleEntryId=id(input.scheduleEntryId);result.matchOrigin=input.matchOrigin;
      check(MatchContext.ORIGINS.includes(result.matchOrigin),"invalid match origin");
      result.hostSchoolId=input.hostSchoolId||null;result.visitorSchoolId=input.visitorSchoolId||null;
      if(result.evidenceType==="returnVisitEligible") {
        result.parentEvidenceId=id(input.parentEvidenceId);result.candidateIntent=input.candidateIntent;
        check(result.source.type==="exchangeEvidence"&&result.source.sourceId===result.parentEvidenceId,"return source mismatch");
        check(["homeInvitationFriendly","awayInvitationFriendly"].includes(result.matchOrigin),"return visit requires friendly visit");
        check((result.direction==="potentialHostOpponent"&&result.hostSchoolId===result.schoolAId&&result.visitorSchoolId===result.schoolBId&&result.candidateIntent==="outgoingFriendlyInvitation")
          ||(result.direction==="potentialVisitOpponent"&&result.hostSchoolId===result.schoolBId&&result.visitorSchoolId===result.schoolAId&&result.candidateIntent==="incomingFriendlyInvitation"),"invalid return direction");
        check(input.completed===false,"return eligibility is not a completed visit");result.completed=false;
      } else {
        check(result.source.type==="completedMatch"&&result.source.sourceId===result.matchId,"match source mismatch");
        check(input.completed===true,"match not completed");result.completed=true;
        check(["hostedOpponent","visitedOpponent","neutral"].includes(result.direction),"invalid direction");
        if(result.direction==="hostedOpponent")check(result.hostSchoolId===result.schoolAId&&result.visitorSchoolId===result.schoolBId,"host direction mismatch");
        if(result.direction==="visitedOpponent")check(result.hostSchoolId===result.schoolBId&&result.visitorSchoolId===result.schoolAId,"visitor direction mismatch");
        if(result.direction==="neutral")check(!result.hostSchoolId&&!result.visitorSchoolId,"neutral cannot claim a visit");
        const originTypes={officialCompetition:["competitionEncounter"],developmentMatch:["developmentExchange"],trainingCamp:["sharedTrainingContext"],neutralFriendly:["schoolExchangeMatch"],homeInvitationFriendly:["schoolExchangeMatch","homeVisit","awayVisit"],awayInvitationFriendly:["schoolExchangeMatch","homeVisit","awayVisit"]};
        check(originTypes[result.matchOrigin].includes(result.evidenceType),"evidence type/origin mismatch");
        if(result.matchOrigin==="neutralFriendly"||result.matchOrigin==="officialCompetition")check(result.direction==="neutral","neutral/competition direction mismatch");
        if(result.evidenceType==="homeVisit")check(result.direction==="hostedOpponent","invalid home visit");
        if(result.evidenceType==="awayVisit")check(result.direction==="visitedOpponent","invalid away visit");
      }
    }
    result.evidenceId="hs-relationship-evidence:"+encodeURIComponent(signature([VERSION,result.evidenceType,result.careerId,result.careerYear,result.source.type,result.source.sourceId,result.schoolAId,result.schoolBId,result.coachId||null,result.matchId||null,result.scheduleEntryId||null]));
    check(!input.evidenceId||input.evidenceId===result.evidenceId,"evidence identity mismatch");return result;
  }
  function normalizeState(input) {
    if(input==null)return emptyState();
    check(input.version===VERSION&&Array.isArray(input.evidence),"invalid ledger");
    const state=emptyState(),ids=new Set();
    for(const raw of input.evidence){const item=createRelationshipEvidence(raw);check(!ids.has(item.evidenceId),"duplicate evidence ID");ids.add(item.evidenceId);state.evidence.push(item);}
    for(const item of state.evidence.filter(e=>e.evidenceType==="returnVisitEligible")) {
      const parent=state.evidence.find(e=>e.evidenceId===item.parentEvidenceId);
      check(parent&&["homeVisit","awayVisit"].includes(parent.evidenceType),"orphan return evidence");
      check(signature(deriveReturnVisitEvidence(parent))===signature(item),"return source facts mismatch");
    }
    state.evidence.sort(order);return state;
  }
  function appendEvidence(state,items) {
    const next=copy(state);
    for(const raw of items){const item=createRelationshipEvidence(raw),existing=next.evidence.find(e=>e.evidenceId===item.evidenceId);
      if(existing)check(signature(existing)===signature(item),"same evidence identity has conflicting facts");else next.evidence.push(item);}
    const normalized=normalizeState(next);state.version=normalized.version;state.evidence=normalized.evidence;return state;
  }
  function deriveReturnVisitEvidence(visit) {
    const parent=createRelationshipEvidence(visit);
    if(!["homeVisit","awayVisit"].includes(parent.evidenceType))return null;
    const hostNext=parent.evidenceType==="awayVisit";
    const {evidenceId,...facts}=parent;
    return createRelationshipEvidence({...facts,evidenceType:"returnVisitEligible",source:{type:"exchangeEvidence",sourceId:evidenceId},parentEvidenceId:evidenceId,
      completed:false,direction:hostNext?"potentialHostOpponent":"potentialVisitOpponent",hostSchoolId:parent.visitorSchoolId,visitorSchoolId:parent.hostSchoolId,
      candidateIntent:hostNext?"outgoingFriendlyInvitation":"incomingFriendlyInvitation",sourceReason:hostNext?"priorAwayVisit":"priorHomeVisit"});
  }
  function deriveExchangeEvidenceFromCompletedMatch(match,schedule) {
    const entry=schedule?.entries?.find(item=>item.scheduleEntryId===match?.matchContext?.scheduleEntryId);
    if(!entry)return []; // No retroactive inference for legacy or externally tagged matches.
    if(!match.completed||!match.settled||entry.status!=="completed")return [];
    check(match.gameRecord?.status==="final"&&match.gameRecord.gameId===match.id,"GameRecord must be finalized");
    const context=MatchContext.normalizeMatchContext(match.matchContext);
    const opportunity=schedule.opportunities.find(item=>item.opportunityId===entry.opportunityId);
    check(opportunity&&entry.matchId===match.id&&context.matchId===match.id&&entry.matchOrigin===context.matchOrigin
      &&opportunity.matchOrigin===context.matchOrigin&&opportunity.careerYear===entry.careerYear
      &&opportunity.playerSchoolId===context.playerTeamId&&opportunity.opponentSchoolId===context.opponentTeamId&&entry.opponentSchoolId===context.opponentTeamId
      &&context.provenance.opportunityId===opportunity.opportunityId,"match/schedule source mismatch");
    check(context.provenance.scheduleEntryId===entry.scheduleEntryId,"schedule provenance mismatch");
    let direction="neutral",hostSchoolId=null,visitorSchoolId=null;
    const venue=context.venueContext.type,host=context.hostContext.hostTeamId;
    if(!["neutralVenue"].includes(venue)&&context.matchOrigin!=="officialCompetition"&&context.matchOrigin!=="neutralFriendly") {
      if(host===context.playerTeamId){direction="hostedOpponent";hostSchoolId=host;visitorSchoolId=context.opponentTeamId;}
      if(host===context.opponentTeamId){direction="visitedOpponent";hostSchoolId=host;visitorSchoolId=context.playerTeamId;}
    }
    const type=context.matchOrigin==="officialCompetition"?"competitionEncounter":context.matchOrigin==="trainingCamp"?"sharedTrainingContext":context.matchOrigin==="developmentMatch"?"developmentExchange":"schoolExchangeMatch";
    const facts={careerId:opportunity.careerId,careerYear:entry.careerYear,seasonPhase:entry.seasonPhase,sequence:entry.sequence,schoolAId:context.playerTeamId,schoolBId:context.opponentTeamId,
      source:{type:"completedMatch",sourceId:match.id},matchId:match.id,scheduleEntryId:entry.scheduleEntryId,matchOrigin:context.matchOrigin,completed:true,direction,hostSchoolId,visitorSchoolId,
      provenance:{opportunityId:entry.opportunityId,gameRecordId:match.gameRecord.gameId,sourceAuthority:"completedScheduleMatch"}};
    const evidence=[createRelationshipEvidence({...facts,evidenceType:type,sourceReason:type})];
    if(type==="schoolExchangeMatch"&&direction!=="neutral") {
      const visit=createRelationshipEvidence({...facts,evidenceType:direction==="hostedOpponent"?"homeVisit":"awayVisit",sourceReason:direction==="hostedOpponent"?"priorHomeVisit":"priorAwayVisit"});
      evidence.push(visit,deriveReturnVisitEvidence(visit));
    }
    return evidence.sort(order);
  }
  function deriveCoachSchoolEvidence(fact,authority) {
    check(authority.schoolIds.includes(fact.schoolAId)&&authority.schoolIds.includes(fact.schoolBId),"unknown coach connection school");
    check(authority.coachIds.includes(fact.coachId),"unknown coach identity");
    return createRelationshipEvidence({...fact,evidenceType:"coachSchoolConnection",direction:"connection",sourceReason:"coachConnection",
      provenance:{coachSourceRef:fact.source?.sourceId,sourceAuthority:"explicitCoachSource"}});
  }
  function queryRelationshipEvidence(state,filter={}) {
    return normalizeState(state).evidence.filter(item=>(!filter.schoolAId||[item.schoolAId,item.schoolBId].includes(filter.schoolAId))
      &&(!filter.schoolBId||[item.schoolAId,item.schoolBId].includes(filter.schoolBId))&&(!filter.coachId||item.coachId===filter.coachId)
      &&(!filter.evidenceType||item.evidenceType===filter.evidenceType)&&(!filter.careerYear||item.careerYear===filter.careerYear));
  }
  function deriveRelationshipSummary(state,a,b) {
    const records=queryRelationshipEvidence(state,{schoolAId:a,schoolBId:b});
    return {exchangeCount:records.filter(e=>["schoolExchangeMatch","developmentExchange","sharedTrainingContext"].includes(e.evidenceType)).length,
      homeVisitCount:records.filter(e=>["homeVisit","awayVisit"].includes(e.evidenceType)&&e.hostSchoolId===a).length,
      awayVisitCount:records.filter(e=>["homeVisit","awayVisit"].includes(e.evidenceType)&&e.visitorSchoolId===a).length,
      competitionEncounterCount:records.filter(e=>e.evidenceType==="competitionEncounter").length,
      lastCareerYear:records.length?Math.max(...records.map(e=>e.careerYear)):null,
      hasReturnVisitEvidence:records.some(e=>e.evidenceType==="returnVisitEligible"),coachConnectionRefs:records.filter(e=>e.evidenceType==="coachSchoolConnection").map(e=>e.evidenceId)};
  }
  function auditRelationshipEvidence(state,schedule) {
    const typeCounts={},ids=new Set();let duplicates=0,selfSchoolFacts=0,orphanRefs=0,unknownSourceRefs=0;
    for(const e of state?.evidence||[]){typeCounts[e.evidenceType]=(typeCounts[e.evidenceType]||0)+1;if(ids.has(e.evidenceId))duplicates++;ids.add(e.evidenceId);
      if(e.schoolAId===e.schoolBId)selfSchoolFacts++;
      if(e.parentEvidenceId&&!(state.evidence||[]).some(p=>p.evidenceId===e.parentEvidenceId))orphanRefs++;
      if(e.matchId&&schedule&&!schedule.entries.some(s=>s.scheduleEntryId===e.scheduleEntryId&&s.matchId===e.matchId&&s.status==="completed"))orphanRefs++;
      if(!e.source?.sourceId||!(["completedMatch","exchangeEvidence",...CONTACT_SOURCES].includes(e.source?.type)))unknownSourceRefs++;
    }
    return {evidenceCount:(state?.evidence||[]).length,typeCounts:stable(typeCounts),duplicateIds:duplicates,selfSchoolFacts,orphanRefs,unknownSourceRefs};
  }
  return Object.freeze({VERSION,TYPES,CONTACT_SOURCES,emptyState,createRelationshipEvidence,normalizeRelationshipEvidence:createRelationshipEvidence,normalizeState,appendEvidence,
    deriveExchangeEvidenceFromCompletedMatch,deriveReturnVisitEvidence,deriveCoachSchoolEvidence,queryRelationshipEvidence,deriveRelationshipSummary,auditRelationshipEvidence,
    getEvidenceBetweenSchools:(state,a,b)=>queryRelationshipEvidence(state,{schoolAId:a,schoolBId:b}),
    getCoachSchoolEvidence:(state,coachId,schoolId)=>queryRelationshipEvidence(state,{coachId,schoolBId:schoolId,evidenceType:"coachSchoolConnection"}),
    getReturnVisitEvidence:(state,a,b)=>queryRelationshipEvidence(state,{schoolAId:a,schoolBId:b,evidenceType:"returnVisitEligible"})});
});
