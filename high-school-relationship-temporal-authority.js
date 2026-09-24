(function(root,factory) {
  const api=factory(typeof module==='object'&&module.exports?require('./high-school-exchange-network'):root.HighSchoolExchangeNetwork,
    typeof module==='object'&&module.exports?require('./high-school-opportunity-selection'):root.HighSchoolOpportunitySelection);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.HighSchoolRelationshipTemporalAuthority=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Network,Selection) {
  'use strict';
  const TEMPORAL_AUTHORITY_VERSION='high-school-relationship-temporal-authority-v1';
  const check=(ok,message)=>{if(!ok)throw new Error('Relationship temporal authority: '+message);};
  const compareIds=(a,b)=>a<b?-1:a>b?1:0;
  const sorted=values=>[...new Set(values)].sort(compareIds);
  // Selection owns lifecycle slots. Sequence in that contract orders its known phases;
  // evidence sequence is only compared after resolving phase, never across phases.
  function getKnownRelationshipPhases() {
    const phases=[];
    for(const year of [1,2,3]) {
      const slots=Object.values(Selection.LIFECYCLE_SLOTS).filter(s=>s.careerYear===year).sort((a,b)=>a.sequence-b.sequence);
      const seen=new Set();
      for(const slot of slots)if(!seen.has(slot.seasonPhase)) {
        check(!phases.some(p=>p.careerYear===year&&p.lifecycleSequence===slot.sequence),'ambiguous lifecycle phase order');
        phases.push({careerYear:year,seasonPhase:slot.seasonPhase,phaseOrder:seen.size,lifecycleSequence:slot.sequence});seen.add(slot.seasonPhase);
      }
    }
    return phases;
  }
  function position(input) {
    check(input&&[1,2,3].includes(input.careerYear),'invalid career year');
    check(Number.isInteger(input.sequence)&&input.sequence>0,'invalid sequence');
    check(typeof input.seasonPhase==='string'&&input.seasonPhase.trim(),'missing phase');
    const phase=getKnownRelationshipPhases().find(p=>p.careerYear===input.careerYear&&p.seasonPhase===input.seasonPhase);
    return {version:TEMPORAL_AUTHORITY_VERSION,careerYear:input.careerYear,seasonPhase:input.seasonPhase,
      phaseOrder:phase?phase.phaseOrder:null,sequence:input.sequence,status:phase?'KNOWN_PHASE':'UNKNOWN_PHASE',
      temporalConfidence:phase?'EXACT_SEMANTIC_POSITION':'YEAR_ONLY'};
  }
  function getRelationshipTemporalPosition(input,ledger) {
    if(!input?.evidenceType)return position(input);
    const evidence=Network.createRelationshipEvidence(input);
    if(evidence.evidenceType!=='returnVisitEligible')return position(evidence);
    // Normalization rejects orphan parents and ANY disagreement with their derived facts.
    const normalized=Network.normalizeState(ledger);
    const stored=normalized.evidence.find(e=>e.evidenceId===evidence.evidenceId);
    check(stored&&JSON.stringify(stored)===JSON.stringify(evidence),'return evidence not in canonical ledger');
    const parent=normalized.evidence.find(e=>e.evidenceId===evidence.parentEvidenceId);
    check(parent,'missing return parent');return position(parent);
  }
  function compareRelationshipTemporalPosition(a,b) {
    const x=position(a),y=position(b);
    if(x.careerYear!==y.careerYear)return x.careerYear<y.careerYear?'EARLIER':'LATER';
    if(x.status==='UNKNOWN_PHASE'||y.status==='UNKNOWN_PHASE')return 'UNKNOWN';
    if(x.phaseOrder!==y.phaseOrder)return x.phaseOrder<y.phaseOrder?'EARLIER':'LATER';
    return x.sequence===y.sequence?'SAME':x.sequence<y.sequence?'EARLIER':'LATER';
  }
  function classifyRelationshipEvidenceAge(evidence,current,ledger) {
    const e=getRelationshipTemporalPosition(evidence,ledger),now=position(current),order=compareRelationshipTemporalPosition(e,now);
    if(order==='UNKNOWN')return 'UNKNOWN';
    if(order==='LATER')return 'FUTURE';
    if(order==='SAME')return 'CURRENT_WINDOW';
    const years=now.careerYear-e.careerYear;
    if(years>1)return 'OLDER_THAN_ONE_YEAR';
    if(years===1)return 'PREVIOUS_YEAR';
    return e.seasonPhase===now.seasonPhase?'SAME_PHASE_EARLIER':'SAME_YEAR_EARLIER';
  }
  function classifyRelationshipEvidenceLifetime(value) {
    const type=typeof value==='string'?value:value?.evidenceType;
    const known=Network.TYPES.includes(type),durable=type==='coachSchoolConnection';
    return {lifetimeClass:!known?'UNKNOWN':durable?'DURABLE':'EPISODIC',
      expiryApplicability:!known?'UNDEFINED':durable?'CANNOT_EXPIRE_BY_TEMPORAL_POLICY':'CAN_EXPIRE_BY_TEMPORAL_POLICY',
      expiryPolicy:'NONE',autoExpires:false,
      recordedAtMeaning:!known?'UNDEFINED':durable?'RECORDED_CONTACT_NOT_INCEPTION_OR_LAST_CONTACT':type==='returnVisitEligible'?'PARENT_VISIT_POSITION':'COMPLETED_MATCH_POSITION'};
  }
  function filtered(ledger,filter) {
    check(Object.keys(filter).every(k=>['schoolId','schoolAId','schoolBId','coachId','evidenceType','sourceCategory','evidenceIds'].includes(k)),'unsupported resolver filter');
    if(filter.evidenceIds!==undefined)check(Array.isArray(filter.evidenceIds)&&filter.evidenceIds.every(x=>typeof x==='string'),'invalid evidence refs');
    const records=Network.normalizeState(ledger).evidence;
    if(filter.evidenceIds)for(const id of filter.evidenceIds)check(records.some(e=>e.evidenceId===id),'unresolved evidence reference');
    return records.filter(e=>(!filter.schoolId||[e.schoolAId,e.schoolBId].includes(filter.schoolId))
      &&(!filter.schoolAId||e.schoolAId===filter.schoolAId)&&(!filter.schoolBId||e.schoolBId===filter.schoolBId)
      &&(!filter.coachId||e.coachId===filter.coachId)&&(!filter.evidenceType||e.evidenceType===filter.evidenceType)
      &&(!filter.sourceCategory||e.source.type===filter.sourceCategory)&&(!filter.evidenceIds||filter.evidenceIds.includes(e.evidenceId)));
  }
  function resolveExtreme(ledger,filter={},latest=true) {
    const records=filtered(ledger,filter),ids=sorted(records.map(e=>e.evidenceId));
    if(!records.length)return {status:'EMPTY',temporalPosition:null,samePositionEvidenceIds:[],supportingEvidenceIds:ids};
    const rows=records.map(e=>({id:e.evidenceId,position:getRelationshipTemporalPosition(e,ledger)}));
    const winners=rows.filter(a=>rows.every(b=>{const c=compareRelationshipTemporalPosition(a.position,b.position);return c==='SAME'||c===(latest?'LATER':'EARLIER');}));
    if(!winners.length)return {status:'UNKNOWN',temporalPosition:null,samePositionEvidenceIds:[],supportingEvidenceIds:ids};
    return {status:'RESOLVED',temporalPosition:winners[0].position,samePositionEvidenceIds:sorted(winners.map(e=>e.id)),supportingEvidenceIds:ids};
  }
  const resolveMostRecentRelationshipEvidence=(ledger,filter={})=>resolveExtreme(ledger,filter,true);
  const resolveOldestRelationshipEvidence=(ledger,filter={})=>resolveExtreme(ledger,filter,false);
  function buildRelationshipTemporalSummary(ledger,source,current) {
    const now=position(current);
    check(source&&Array.isArray(source.evidenceRefs),'source must expose evidenceRefs');
    const records=filtered(ledger,{evidenceIds:source.evidenceRefs}),ids=sorted(records.map(e=>e.evidenceId));
    const latest=resolveMostRecentRelationshipEvidence(ledger,{evidenceIds:ids}),oldest=resolveOldestRelationshipEvidence(ledger,{evidenceIds:ids});
    const lifetimes=sorted(records.map(e=>classifyRelationshipEvidenceLifetime(e).lifetimeClass));
    const events=new Map();
    for(const e of records)if(e.matchId&&e.scheduleEntryId) {
      const key=JSON.stringify([e.careerId,e.careerYear,e.matchId,e.scheduleEntryId]);
      if(!events.has(key))events.set(key,[]);events.get(key).push(e.evidenceId);
    }
    const plan=!records.length&&source.sourceType==='explicitCampPlan';
    const status=plan?(compareRelationshipTemporalPosition(source,now)==='SAME'?'PLAN_CURRENT_CONTEXT':'PLAN_CONTEXT_UNRESOLVED')
      :!records.length?'NO_RELATIONSHIP_EVIDENCE':latest.status==='RESOLVED'?'RESOLVED':'UNKNOWN';
    return {version:TEMPORAL_AUTHORITY_VERSION,status,evidenceCount:ids.length,supportingEvidenceIds:ids,
      latestTemporalPosition:latest.temporalPosition,latestAgeClass:latest.temporalPosition?classifyRelationshipEvidenceAge(latest.temporalPosition,now):'UNKNOWN',
      oldestTemporalPosition:oldest.temporalPosition,oldestStatus:oldest.status,samePositionEvidenceIds:latest.samePositionEvidenceIds,
      lifetimeClass:lifetimes.length===1?lifetimes[0]:lifetimes.length?'MIXED':'NONE',
      temporalConfidence:latest.temporalPosition?.temporalConfidence||(records.length?'YEAR_ONLY':'UNKNOWN'),
      evidenceYearRange:records.length?{earliest:Math.min(...records.map(e=>e.careerYear)),latest:Math.max(...records.map(e=>e.careerYear))}:null,
      completedEventCount:events.size,completedEventGroups:[...events.entries()].sort(([a],[b])=>compareIds(a,b)).map(([eventIdentity,refs])=>({eventIdentity,evidenceIds:sorted(refs)})),
      nonMatchEvidenceCount:records.filter(e=>!e.matchId).length,contactCount:null,expiryPolicy:'NONE',autoExpires:false};
  }
  return Object.freeze({TEMPORAL_AUTHORITY_VERSION,getKnownRelationshipPhases,classifyRelationshipEvidenceLifetime,
    getRelationshipTemporalPosition,compareRelationshipTemporalPosition,classifyRelationshipEvidenceAge,
    resolveMostRecentRelationshipEvidence,resolveOldestRelationshipEvidence,buildRelationshipTemporalSummary});
});
