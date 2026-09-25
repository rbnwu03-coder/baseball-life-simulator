(function(root,factory) {
  const api=factory(typeof module==='object'&&module.exports?require('./high-school-exchange-network'):root.HighSchoolExchangeNetwork,
    typeof module==='object'&&module.exports?require('./high-school-relationship-temporal-authority'):root.HighSchoolRelationshipTemporalAuthority);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.HighSchoolRelationshipRecency=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Network,Temporal) {
  'use strict';
  const RELATIONSHIP_RECENCY_VERSION='high-school-relationship-recency-v1';
  const TEMPORAL_AUTHORITY_VERSION='high-school-relationship-temporal-authority-v1';
  const check=(ok,message)=>{if(!ok)throw new Error('Relationship recency: '+message);};
  check(Temporal?.TEMPORAL_AUTHORITY_VERSION===TEMPORAL_AUTHORITY_VERSION,'unsupported temporal authority version');
  const RECENCY_CLASSES=Object.freeze({CURRENT_WINDOW:'CURRENT',SAME_PHASE_EARLIER:'RECENT',SAME_YEAR_EARLIER:'RECENT',
    PREVIOUS_YEAR:'PRIOR_YEAR',OLDER_THAN_ONE_YEAR:'OLD',UNKNOWN:'UNKNOWN'});
  const sorted=xs=>[...new Set(xs)].sort((a,b)=>a<b?-1:a>b?1:0);
  function resolveLatestEpisodicRelationshipEvidence(ledger,source,current) {
    check(Temporal.TEMPORAL_AUTHORITY_VERSION===TEMPORAL_AUTHORITY_VERSION,'unsupported temporal authority version');
    check(!current?.version||current.version===TEMPORAL_AUTHORITY_VERSION,'unsupported temporal position version');
    check(source&&Array.isArray(source.evidenceRefs)&&source.evidenceRefs.every(id=>typeof id==='string'&&id.length),'canonical evidenceRefs required');
    const normalized=Network.normalizeState(ledger),now=Temporal.getRelationshipTemporalPosition(current);
    const supportingEvidenceIds=sorted(source.evidenceRefs);
    const records=supportingEvidenceIds.map(id=>{const e=normalized.evidence.find(e=>e.evidenceId===id);check(e,'unresolved evidence ref');return e;});
    const eligible=records.filter(e=>Temporal.classifyRelationshipEvidenceLifetime(e).lifetimeClass==='EPISODIC');
    const excluded=records.filter(e=>Temporal.classifyRelationshipEvidenceLifetime(e).lifetimeClass!=='EPISODIC');
    const eligibleEvidenceIds=eligible.map(e=>e.evidenceId),excludedEvidenceIds=excluded.map(e=>e.evidenceId);
    const temporalSummary=Temporal.buildRelationshipTemporalSummary(normalized,{evidenceRefs:eligibleEvidenceIds},now);
    return {supportingEvidenceIds,eligibleEvidenceIds,excludedEvidenceIds,
      exclusions:excluded.map(e=>({evidenceId:e.evidenceId,reason:'DURABLE_RECORDED_CONTACT_NOT_EPISODIC'})),
      latest:Temporal.resolveMostRecentRelationshipEvidence(normalized,{evidenceIds:eligibleEvidenceIds}),
      temporalSummary:{version:temporalSummary.version,latestAgeClass:temporalSummary.latestAgeClass,
        evidenceYearRange:temporalSummary.evidenceYearRange,temporalConfidence:temporalSummary.temporalConfidence},
      evidenceAges:eligible.map(e=>({evidenceId:e.evidenceId,careerYear:e.careerYear,ageClass:Temporal.classifyRelationshipEvidenceAge(e,now,normalized)}))};
  }
  function buildRelationshipRecencySummary(ledger,source,current) {
    const resolved=resolveLatestEpisodicRelationshipEvidence(ledger,source,current);
    const {temporalSummary,latest,evidenceAges}=resolved;
    let temporalAgeClass='UNKNOWN',recencyClass='UNKNOWN',status='UNKNOWN',applicability='UNKNOWN',reason='UNRESOLVED_EPISODIC_CHRONOLOGY';
    let unresolvedLatestEvidenceIds=[];
    const futureEvidenceIds=evidenceAges.filter(e=>e.ageClass==='FUTURE').map(e=>e.evidenceId);
    if(!resolved.eligibleEvidenceIds.length) {
      status=resolved.supportingEvidenceIds.length?'NOT_APPLICABLE':'NO_RELATIONSHIP_EVIDENCE';
      recencyClass='NOT_APPLICABLE';applicability='NOT_APPLICABLE';
      reason=resolved.supportingEvidenceIds.length?'DURABLE_ONLY':source.sourceType==='explicitCampPlan'?'PLAN_WITHOUT_RELATIONSHIP_EVIDENCE':'NO_RELATIONSHIP_EVIDENCE';
    } else if(futureEvidenceIds.length) {
      status='FUTURE_EVIDENCE';temporalAgeClass='FUTURE';recencyClass='NOT_APPLICABLE';applicability='NOT_APPLICABLE';reason='FUTURE_EPISODIC_EVIDENCE';
    } else {
      temporalAgeClass=temporalSummary.latestAgeClass;
      if(latest.status==='UNKNOWN') {
        // Temporal authority supplies the coarse year range and each evidence age.
        // A cross-year category can be certain while the exact latest/tie cannot.
        const sameLatestYear=evidenceAges.filter(e=>e.careerYear===temporalSummary.evidenceYearRange.latest);
        const ages=sorted(sameLatestYear.map(e=>e.ageClass));
        unresolvedLatestEvidenceIds=sameLatestYear.map(e=>e.evidenceId);
        if(ages.length===1&&['PREVIOUS_YEAR','OLDER_THAN_ONE_YEAR'].includes(ages[0])) {
          temporalAgeClass=ages[0];reason='YEAR_ONLY_CATEGORY_EXACT_LATEST_UNRESOLVED';
        }
      }
      check(Object.hasOwn(RECENCY_CLASSES,temporalAgeClass),'unsupported temporal age class');
      recencyClass=RECENCY_CLASSES[temporalAgeClass];
      if(recencyClass!=='UNKNOWN') {status='CLASSIFIED';applicability='APPLICABLE';if(latest.status==='RESOLVED')reason='LATEST_EPISODIC_POSITION';}
    }
    return {version:RELATIONSHIP_RECENCY_VERSION,temporalAuthorityVersion:TEMPORAL_AUTHORITY_VERSION,scope:'EPISODIC_RELATIONSHIP_EVIDENCE',
      status,applicability,temporalAgeClass,recencyClass,reason,
      lifetimeClass:resolved.eligibleEvidenceIds.length?'EPISODIC':resolved.excludedEvidenceIds.length?'DURABLE':'NONE',
      latestTemporalPosition:latest.temporalPosition,latestEvidenceIds:latest.samePositionEvidenceIds,
      eligibleEvidenceIds:resolved.eligibleEvidenceIds,excludedEvidenceIds:resolved.excludedEvidenceIds,
      supportingEvidenceIds:resolved.supportingEvidenceIds,exclusions:resolved.exclusions,
      unresolvedLatestEvidenceIds,futureEvidenceIds,temporalConfidence:temporalSummary.temporalConfidence};
  }
  const classifyRelationshipRecency=(ledger,evidenceId,current)=>buildRelationshipRecencySummary(ledger,{evidenceRefs:[evidenceId]},current);
  return Object.freeze({RELATIONSHIP_RECENCY_VERSION,TEMPORAL_AUTHORITY_VERSION,RECENCY_CLASSES,
    classifyRelationshipRecency,buildRelationshipRecencySummary,resolveLatestEpisodicRelationshipEvidence});
});
