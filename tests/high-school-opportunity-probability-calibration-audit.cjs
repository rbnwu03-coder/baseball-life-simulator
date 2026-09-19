"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto"),P=require("../high-school-opportunity-probability"),Q=require("../high-school-opportunity-selection");
const Flow=require("./high-school-opportunity-exposure-flow.cjs");
const VERSION=Flow.VERSION;
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const signature=v=>crypto.createHash("sha256").update(JSON.stringify(canonical(v))).digest("hex");
const inc=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const ratio=(a,b)=>b?a/b:0;
const ids=n=>Array.from({length:n},(_,i)=>"audit-career-"+String(i+1).padStart(6,"0"));
const type=t=>t.includes("FriendlyInvitation")?"friendly":({trainingCampOpportunity:"trainingCamp",developmentMatchOpportunity:"development",neutralExchangeOpportunity:"neutralExchange",officialCompetitionOpportunity:"officialCompetition"}[t]||t);
function sourceClass(c){if(c.priority==="mandatory"||c.source?.sourceId==="hs-y1-followup-evaluation-2")return "mandatory";return P.deriveProbabilityProfile({...c,eligible:true,exclusionReasons:[]},{selectionWindowId:"classification-only"}).weightClass;}
function compactCareer(r){
  const windows=r.windows.map(w=>{
    const profiles=new Map(w.profiles.map(p=>[p.candidateId,p])),selected=new Set(w.selected.map(c=>c.candidateId));
    const candidates=w.candidates.map(c=>{
      const p=profiles.get(c.candidateId),s=selected.has(c.candidateId),cls=sourceClass(c);
      const raw=w.flow.rows.find(row=>row.candidateId===c.candidateId);const flow={...raw,candidateId:signature(raw.candidateId),windowId:signature(raw.windowId),sourceRef:raw.sourceRef?signature(raw.sourceRef):null,semanticKey:raw.semanticKey?signature(raw.semanticKey):null,campSourceId:raw.campSourceId?signature(raw.campSourceId):null,returnVisitEvidence:raw.returnVisitEvidence.map(signature)};
      return {flow,id:signature(c.candidateId),sourceClass:cls,sourceFamily:type(c.opportunityType)+":"+(c.sourceProvenance?.reasonCode||c.sourceProvenance?.producerType||cls),type:type(c.opportunityType),opponent:c.opponentSchoolId,eligible:c.eligible,admitted:!!p,baseWeight:p?.baseWeight||0,finalWeight:p?.finalWeight||0,normalizedShare:p?.normalizedProbability||0,selected:s,materialized:s&&w.opportunity.provenance.candidateRef.candidateId===c.candidateId,completed:s&&w.completed,semantic:signature([c.careerId,c.careerYear,c.seasonPhase,c.sequence,c.playerSchoolId,c.opponentSchoolId,c.opportunityType]),campSourceId:c.sourceProvenance?.campSourceId?signature(c.sourceProvenance.campSourceId):null,reasons:w.rejections.find(x=>x.candidateId===c.candidateId)?.reasons||[]};
    });
    return {flow:{version:w.flow.version,producerCounts:w.flow.producerCounts,dedupGroups:w.flow.dedupGroups.map(g=>({...g,semanticKey:signature(g.semanticKey),winners:g.winners.map(signature),losers:g.losers.map(l=>({...l,candidateId:signature(l.candidateId)}))}))},year:w.year,phase:w.phase,sequence:w.sequence,window:signature(w.windowId),candidates,poolSize:w.profiles.length,availableOpponents:w.availableOpponents.length,selected:candidates.filter(c=>c.selected).map(c=>c.id),draw:w.probability?{value:w.probability.drawValue,range:w.probability.drawRange,pool:w.probability.candidatePoolIdentity?signature(w.probability.candidatePoolIdentity):null,reason:w.probability.reason}:null,budget:w.budget,opportunityId:signature(w.opportunity.opportunityId),opportunityStatus:w.opportunity.status,scheduleStatus:w.schedule.status,matchId:w.schedule.matchId,completed:w.completed,recordIntegrity:w.recordIntegrity,gameRecordSignature:w.gameRecordSignature,evidenceBefore:w.evidenceBefore,evidenceAfter:w.evidenceCount};
  });
  const counts=[1,2,3].map(y=>windows.filter(w=>w.year===y&&w.completed).length);
  return {careerAuditId:r.careerAuditId,cohort:r.cohort,mode:r.mode,windows,checks:{...r.checks,frequencyViolation:Number(JSON.stringify(counts)!=="[2,2,1]"),incompleteSchedules:windows.filter(w=>w.scheduleStatus!=="completed").length}};
}
function blank(){return {candidate:0,eligible:0,admitted:0,selected:0,optionalSelected:0,materialized:0,completed:0,expectedWeightedSelections:0,multiCandidateSelected:0};}
function accumulate(map,key,c,multi){const d=map[key]||(map[key]=blank());d.candidate++;d.eligible+=Number(c.eligible);d.admitted+=Number(c.admitted);d.selected+=Number(c.selected);d.optionalSelected+=Number(c.selected&&c.sourceClass!=="mandatory");d.materialized+=Number(c.materialized);d.completed+=Number(c.completed);d.expectedWeightedSelections+=c.normalizedShare;d.multiCandidateSelected+=Number(c.selected&&multi&&c.sourceClass!=="mandatory");}
function summarizeNumbers(values){const sum=values.reduce((a,b)=>a+b,0),distribution={};for(const v of values)inc(distribution,v);return {mean:ratio(sum,values.length),min:values.length?Math.min(...values):0,max:values.length?Math.max(...values):0,distribution};}
function aggregateExposure(records){
  records=[...records].sort((a,b)=>a.careerAuditId.localeCompare(b.careerAuditId));
  const sources={},families={},weights={},types={},years={},phases={},pools={},opponents={},checks={},transitions={},opponentTransitions={},careerMatches=[],unique=[],repeat=[],top=[],top3=[],hhi=[],available=[],newRepeat={};
  let windows=0,multi=0,single=0,optional=0,mandatory=0,duplicateFallback=0,friendlyInflation=0,priorRelationshipRepeat=0,newOpponent=0;
  for(const r of records){
    for(const [k,v] of Object.entries(r.checks)){if(typeof v==="number")inc(checks,k,v);else if(k==="antiReroll")for(const [s,n] of Object.entries(v))inc(checks,"antiReroll:"+s,n);}
    const seen=new Map(),yearSeen={},annualSources={},yearPrevious={};let total=0;
    for(const w of r.windows){windows++;multi+=Number(w.poolSize>=2);single+=Number(w.poolSize===1);available.push(w.availableOpponents);const poolBucket=w.poolSize>=4?"4+":String(w.poolSize);inc(pools,w.year+":"+w.phase+":"+poolBucket);
      const yd=years[w.year]||(years[w.year]={windows:0,optionalCandidates:0,selected:0,sourceMix:{},fallbackSelected:0,newOpponents:0,repeatOpponents:0}),pd=phases[w.phase]||(phases[w.phase]={windows:0,optionalCandidates:0,selected:0,sourceMix:{}});yd.windows++;pd.windows++;
      const groups=new Map();for(const c of w.candidates.filter(c=>c.admitted)){const g=groups.get(c.semantic)||[];g.push(c);groups.set(c.semantic,g);}
      for(const g of groups.values()){duplicateFallback+=Number(g.some(c=>c.sourceClass==="foundationFallback")&&g.some(c=>c.sourceClass!=="foundationFallback"));friendlyInflation+=Number(g[0].type==="friendly"&&g.length>1);}
      for(const c of w.candidates){
        accumulate(sources,c.sourceClass,c,w.poolSize>=2);accumulate(families,c.sourceFamily,c,w.poolSize>=2);accumulate(types,c.type,c,w.poolSize>=2);
        if(c.admitted)accumulate(weights,String(c.baseWeight),c,w.poolSize>=2);
        yd.optionalCandidates+=Number(c.eligible&&c.sourceClass!=="mandatory");pd.optionalCandidates+=Number(c.eligible&&c.sourceClass!=="mandatory");
        if(!c.selected)continue;
        total+=Number(w.completed);inc(opponents,c.opponent);inc(annualSources[w.year]||(annualSources[w.year]={}),c.sourceClass);
        if(c.sourceClass==="mandatory")mandatory++;else{optional++;yd.selected++;pd.selected++;inc(yd.sourceMix,c.sourceClass);inc(pd.sourceMix,c.sourceClass);yd.fallbackSelected+=Number(c.sourceClass==="foundationFallback");}
        const old=seen.has(c.opponent),sameYear=yearSeen[w.year]?.has(c.opponent)||false,crossYear=old&&[...seen.get(c.opponent)].some(y=>y!==w.year);
        const nr=newRepeat[w.year]||(newRepeat[w.year]={newOpponentCount:0,repeatOpponentCount:0,sameYearRepeat:0,crossYearRepeat:0});nr.newOpponentCount+=Number(!old);nr.repeatOpponentCount+=Number(old);nr.sameYearRepeat+=Number(sameYear);nr.crossYearRepeat+=Number(crossYear);yd.newOpponents+=Number(!old);yd.repeatOpponents+=Number(old);
        if(c.sourceClass!=="mandatory"){priorRelationshipRepeat+=Number(old);newOpponent+=Number(!old);}
        yearSeen[w.year]??=new Set();yearSeen[w.year].add(c.opponent);if(!seen.has(c.opponent))seen.set(c.opponent,new Set());seen.get(c.opponent).add(w.year);
        yearPrevious[w.year]??=[];yearPrevious[w.year].push(c.opponent);
      }
    }
    const selected=r.windows.flatMap(w=>w.candidates.filter(c=>c.selected)),counts={};for(const c of selected)inc(counts,c.opponent);const frequencies=Object.values(counts).sort((a,b)=>b-a);unique.push(frequencies.length);repeat.push(total-frequencies.length);top.push(ratio(frequencies[0]||0,total));top3.push(ratio(frequencies.slice(0,3).reduce((a,b)=>a+b,0),total));hhi.push(frequencies.reduce((s,n)=>s+ratio(n,total)**2,0));careerMatches.push(total);
    for(const y of [1,2]){inc(transitions,y+"->"+(y+1)+":"+Object.keys(annualSources[y]||{}).sort().join("+")+"->"+Object.keys(annualSources[y+1]||{}).sort().join("+"));for(const o of yearPrevious[y+1]||[])inc(opponentTransitions,y+"->"+(y+1)+":"+((yearPrevious[y]||[]).includes(o)?"repeat":"new"));}
  }
  const eligibleTotal=Object.entries(sources).filter(([k])=>k!=="mandatory").reduce((s,[,v])=>s+v.eligible,0),admittedTotal=Object.values(sources).reduce((s,v)=>s+v.admitted,0);
  for(const [k,d] of Object.entries(sources)){d.availabilityShare=k==="mandatory"?null:ratio(d.eligible,eligibleTotal);d.selectionShare=k==="mandatory"?null:ratio(d.selected,optional);d.admittedShare=ratio(d.admitted,admittedTotal);d.exposureRatio=d.availabilityShare?d.selectionShare/d.availabilityShare:null;d.selectionRate=ratio(d.selected,d.eligible);}
  for(const map of [families,weights])for(const d of Object.values(map)){d.selectionShare=ratio(d.optionalSelected,optional);d.selectionRate=ratio(d.selected,d.admitted);}
  return canonical({stage_flow:Flow.aggregateFlow(records),sample_size:records.length,windows,multiCandidateWindows:multi,singleCandidateWindows:single,optionalSelected:optional,mandatorySelected:mandatory,career_distribution:summarizeNumbers(careerMatches),year_distribution:years,phase_distribution:phases,source_distribution:sources,source_family_distribution:families,weight_distribution:weights,opportunity_type_distribution:types,candidate_pool_distribution:pools,opponent_diversity:{unique:summarizeNumbers(unique),repeat:summarizeNumbers(repeat),repeatShare:ratio(repeat.reduce((a,b)=>a+b,0),careerMatches.reduce((a,b)=>a+b,0)),meanTopOpponentShare:ratio(top.reduce((a,b)=>a+b,0),records.length),meanTop3OpponentShare:ratio(top3.reduce((a,b)=>a+b,0),records.length),meanHHI:ratio(hhi.reduce((a,b)=>a+b,0),records.length),available:summarizeNumbers(available),opponents,newRepeat,optionalRepeatAfterPriorMatch:priorRelationshipRepeat,optionalNewOpponent:newOpponent},source_transition_matrix:transitions,opponent_transition_matrix:opponentTransitions,integrity:{...checks,fallbackCoexistingWithRealSemanticDuplicate:duplicateFallback,friendlySourceCountInflation:friendlyInflation},careerDigest:signature(records.map(r=>[r.careerAuditId,signature(r)])),samples:records.slice(0,4)});
}
function aggregatePairwiseWeights(n=5000){
  const result={sampleCount:n,pairs:{},equalPositions:{},idPrefixes:{},careerBlocks:{},threeWay:{},campGroups:{},friendlyDedup:{tested:0,inflation:0}};
  const ctx=(i)=>({careerId:ids(n)[i],careerYear:2,seasonPhase:"year-two-spring-evaluation",selectionWindowId:"comparable-y2-spring"});
  const candidate=(id,producer,extra={})=>({candidateId:id,priority:"optional",eligible:true,exclusionReasons:[],source:{type:"schoolRelationship",sourceId:"synthetic-source:"+id},sourceProvenance:{producerType:producer},...extra});
  const contextIds=ids(n);
  for(let i=0;i<n;i++){
    const context={careerId:contextIds[i],careerYear:2,seasonPhase:"year-two-spring-evaluation",selectionWindowId:"comparable-y2-spring"};
    for(const [a,b] of [[3,2],[3,1],[2,1]]){const key=a+"vs"+b,d=result.pairs[key]||(result.pairs[key]={high:0,low:0});const r=P.drawWeightedCandidate({weights:[{candidateId:"A",finalWeight:a},{candidateId:"B",finalWeight:b}],context});d[r.selectedCandidateId==="A"?"high":"low"]++;}
    const weights=[1,2,3].map((w,k)=>({candidateId:String.fromCharCode(65+k),finalWeight:w}));inc(result.threeWay,P.drawWeightedCandidate({weights,context}).selectedCandidateId);
    for(const prefix of ["plain-","zeta-","000-"]){const r=P.drawWeightedCandidate({weights:[0,1,2,3].map(k=>({candidateId:prefix+k,finalWeight:1})),context}),position=Number(r.selectedCandidateId.at(-1));inc(result.idPrefixes[prefix]||(result.idPrefixes[prefix]={}),position);if(prefix==="plain-"){inc(result.equalPositions,position);inc(result.careerBlocks[Math.floor(i/500)]||(result.careerBlocks[Math.floor(i/500)]={}),position);}}
    for(const size of [2,3,4]){
      const camp=Array.from({length:size-1},(_,j)=>candidate("camp-"+j,"trainingCampProducer",{sourceProvenance:{producerType:"trainingCampProducer",campSourceId:"group",reasonCode:"eligibleExplicitPlan"}}));
      // Same opportunity type: a competing independent camp of base weight 2.
      const rival=candidate("rival","trainingCampProducer",{sourceProvenance:{producerType:"trainingCampProducer",campSourceId:"rival-group",reasonCode:"eligibleCoachNetwork"}});
      const r=P.deriveProbabilityResult({candidates:[...camp,rival],context}),d=result.campGroups[size]||(result.campGroups[size]={schools:size,candidateCount:size-1,selected:0,totalWeight:r.weights.filter(w=>w.provenance.campSourceId==="group").reduce((s,w)=>s+w.finalWeight,0),opponents:{}});
      if(r.selectedCandidateId!=="rival"){d.selected++;inc(d.opponents,r.selectedCandidateId);}
    }
    const base={careerId:context.careerId,careerYear:2,seasonPhase:context.seasonPhase,sequence:1,playerSchoolId:"P",opponentSchoolId:"B",opportunityType:"outgoingFriendlyInvitation",sourceAuthority:"canonicalRelationshipProducer"};
    const c1={...candidate("canonical","returnVisitProducer"),...base},c2={...candidate("duplicate","coachNetworkProducer"),...base},other={...candidate("other",null,{sourceAuthority:"fallback"}),...base,opponentSchoolId:"C"};
    const input={context:{...context,sequence:1,playerSchoolId:"P"},schedule:{opportunities:[],entries:[]},probabilityPolicy:"enabled",candidateSet:[c1,other]};
    const one=Q.selectOpportunityCandidates(input),many=Q.selectOpportunityCandidates({...input,candidateSet:[c1,c2,other]});result.friendlyDedup.tested++;result.friendlyDedup.inflation+=Number(signature(one.probabilityResult)!==signature(many.probabilityResult));
  }
  for(const d of Object.values(result.pairs)){d.highShare=d.high/n;d.lowShare=d.low/n;d.difference=d.highShare-d.lowShare;d.status=d.high>d.low?"PASS":"FAIL";}
  for(const d of Object.values(result.campGroups))d.aggregateSelectionShare=d.selected/n;
  result.campInflationRatio=Math.max(...Object.values(result.campGroups).map(d=>d.aggregateSelectionShare))/Math.min(...Object.values(result.campGroups).map(d=>d.aggregateSelectionShare));
  result.equalMaxDeviation=Math.max(...Object.values(result.equalPositions).map(k=>Math.abs(k/n-.25)));
  result.prefixMaxDeviation=Math.max(...Object.values(result.idPrefixes).flatMap(d=>Object.values(d).map(k=>Math.abs(k/n-.25))));
  return canonical(result);
}
function buildCalibrationReport(enabled,disabled,synthetic,{repeatEqual=true,traceEqual=true}={}){
  const failures=[],warnings=[];const fail=(condition,code)=>{if(condition)failures.push(code);};
  for(const [mode,s] of [["enabled",enabled],["disabled",disabled]])for(const [k,v] of Object.entries(s.integrity))if(!["reloadSamples","antiReroll:declined","antiReroll:expired","antiReroll:cancelled"].includes(k))fail(v!==0,mode+":"+k);
  fail(enabled.career_distribution.mean!==5||disabled.career_distribution.mean!==5,"frequencyDrift");fail(enabled.mandatorySelected!==disabled.mandatorySelected||enabled.optionalSelected!==disabled.optionalSelected,"modeFrequencyDrift");fail(!repeatEqual,"deterministicMismatch");fail(!traceEqual,"instrumentationMismatch");
  for(const [k,d] of Object.entries(synthetic.pairs))fail(d.status!=="PASS","pairwise:"+k);
  fail(synthetic.equalMaxDeviation>.08||synthetic.prefixMaxDeviation>.08,"structuralIdOrderingBias");fail(synthetic.campInflationRatio>1.5,"structuralCampGroupInflation");fail(synthetic.friendlyDedup.inflation>0,"friendlyDedupInflation");
  for(const [source,d] of Object.entries(enabled.source_distribution)){if(source==="mandatory")continue;if(d.multiCandidateSelected/Math.max(1,enabled.multiCandidateWindows)>.7)warnings.push({code:"SOURCE_DOMINANCE_WARN",source});if(d.eligible>0&&d.admitted===0)warnings.push({code:"UNREACHABLE_SOURCE_WARN",source,eligible:d.eligible,reachable:0});if(d.eligible>=100&&d.selected===0)warnings.push({code:"ZERO_EXPOSURE_WARN",source,eligible:d.eligible,admitted:d.admitted});}
  const fallback=enabled.source_distribution.foundationFallback;if(fallback&&fallback.selected>fallback.expectedWeightedSelections*1.2+30)warnings.push({code:"FALLBACK_OVERUSE_WARN",selected:fallback.selected,expected: fallback.expectedWeightedSelections});
  const diversity=enabled.opponent_diversity;if(diversity.optionalRepeatAfterPriorMatch>diversity.optionalNewOpponent)warnings.push({code:"RELATIONSHIP_FEEDBACK_WARN",repeat:diversity.optionalRepeatAfterPriorMatch,new:diversity.optionalNewOpponent});
  warnings.push({code:"CONTROLLED_SOURCE_AVAILABILITY",detail:"Four equally sampled initial-world cohorts; these are conditional exposure rates, not estimated live-player population proportions."});
  const shares=s=>({friendly:ratio(s.opportunity_type_distribution.friendly?.optionalSelected||0,s.optionalSelected),trainingCamp:ratio(s.opportunity_type_distribution.trainingCamp?.optionalSelected||0,s.optionalSelected),fallback:ratio(s.source_distribution.foundationFallback?.selected||0,s.optionalSelected),highAuthority:ratio((s.source_distribution.explicitCampPlan?.selected||0)+(s.source_distribution.explicitReturnVisit?.selected||0),s.optionalSelected)});
  const a=shares(enabled),b=shares(disabled);
  return canonical({metadata:{baseline:"e91fc49",auditVersion:VERSION,probabilityVersion:P.VERSION,selectionPolicyVersion:Q.POLICY_VERSION,sampleCount:enabled.sample_size,identityStrategy:"audit-career-000001..fixed sequential count",productionBehaviorChanges:1,cohorts:["no initial relationship","initiated coach contact","established coach counterpart","explicit 4-school Y1 camp plan"],fullGamesPerCareer:5,characterFixtureSeed:97001,characterFixturePolicy:"Fixed existing admitted ordinary fixture for every identity; career and school-generation identities still vary over all 5000 samples"},...enabled,pairwise_distribution:synthetic.pairs,synthetic,camp_group_bias:synthetic.campGroups,fallback_usage:enabled.source_distribution.foundationFallback,mandatory_integrity:{profiles:enabled.integrity.mandatoryProfiles,selected:enabled.mandatorySelected},budget_integrity:{violations:enabled.integrity.budgetViolation},anti_reroll_integrity:enabled.integrity,save_reload_integrity:{samples:enabled.integrity.reloadSamples,mismatches:enabled.integrity.reloadMismatch,renderSuppressed:true},probability_enabled_vs_disabled:{enabled:a,disabled:b,delta:Object.fromEntries(Object.keys(a).map(k=>[k,a[k]-b[k]])),frequencyEqual:enabled.career_distribution.mean===disabled.career_distribution.mean&&enabled.optionalSelected===disabled.optionalSelected&&enabled.mandatorySelected===disabled.mandatorySelected,disabledSummary:disabled},determinism:{repeatEqual,traceEqual,batchOrderIndependent:repeatEqual},warnings,failures,status:failures.length?"FAIL":warnings.length?"WARN":"PASS"});
}
module.exports={VERSION,canonical,signature,ids,compactCareer,aggregateExposure,aggregatePairwiseWeights,aggregateOpponentDiversity:records=>aggregateExposure(records).opponent_diversity,aggregateGroupBias:n=>aggregatePairwiseWeights(n).campGroups,compareProbabilityModes:buildCalibrationReport,buildCalibrationReport};
