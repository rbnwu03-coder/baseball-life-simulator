(function(root,factory){
  const api=factory(typeof module==="object"&&module.exports?require("./team-roster-foundation"):root.TeamRosterFoundation);
  if(typeof module==="object"&&module.exports)module.exports=api;else root.HighSchoolOpportunityProbability=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Roster){
  "use strict";
  const VERSION="high-school-opportunity-probability-v1",NAMESPACE="high-school-opportunity-probability";
  // Relative source credibility, NOT FINAL BALANCE. Type, strength and evidence count are neutral.
  const WEIGHTS=Object.freeze({explicitReturnVisit:3,explicitCampPlan:3,coachNetwork:2,schoolRelationship:2,sharedTrainingContext:2,foundationFallback:1,unknownSource:1});
  const copy=v=>JSON.parse(JSON.stringify(v)),compare=(a,b)=>a<b?-1:a>b?1:0;
  const identity=(prefix,tuple)=>prefix+":"+encodeURIComponent(JSON.stringify(tuple));
  function sourceClass(c){
    const p=c.sourceProvenance||{};
    if(p.campSourceId){const classes={eligibleExplicitPlan:"explicitCampPlan",eligibleSharedTrainingContext:"sharedTrainingContext",eligibleCoachNetwork:"coachNetwork",eligibleSchoolRelationship:"schoolRelationship"};return classes[p.reasonCode]||"unknownSource";}
    const classes={returnVisitProducer:"explicitReturnVisit",coachNetworkProducer:"coachNetwork",schoolRelationshipProducer:"schoolRelationship"};
    return classes[p.producerType]||(c.sourceAuthority==="fallback"?"foundationFallback":"unknownSource");
  }
  function deriveProbabilityProfile(candidate,context){
    if(candidate.priority==="mandatory"||candidate.eligible!==true||(candidate.exclusionReasons||[]).length)return null;
    const weightClass=sourceClass(candidate),baseWeight=WEIGHTS[weightClass];
    return {candidateId:candidate.candidateId,selectionWindowId:context.selectionWindowId,sourceType:candidate.source?.type||"unknown",producerType:candidate.sourceProvenance?.producerType||null,
      weightClass,baseWeight,weightFactors:[{name:"sourceAuthorityClass",value:weightClass}],finalWeight:baseWeight,probabilityVersion:VERSION,
      provenance:{sourceRef:candidate.source?.sourceId||null,campSourceId:candidate.sourceProvenance?.campSourceId||null},
      diagnostics:weightClass==="unknownSource"?["unknownSourceWeightFallback"]:[]};
  }
  function deriveCandidateWeights(candidates,context){
    const profiles=candidates.map(c=>deriveProbabilityProfile(c,context)).filter(Boolean).sort((a,b)=>compare(a.candidateId,b.candidateId));
    if(new Set(profiles.map(p=>p.candidateId)).size!==profiles.length)throw Error("Duplicate candidate IDs before probability");
    const groups=new Map();for(const p of profiles)if(p.provenance.campSourceId){const g=groups.get(p.provenance.campSourceId)||[];g.push(p);groups.set(p.provenance.campSourceId,g);}
    for(const group of groups.values()){const total=Math.max(...group.map(p=>p.baseWeight));for(const p of group){p.finalWeight=total/group.length;p.weightFactors.push({name:"campGroupNormalization",groupTotalWeight:total,divisor:group.length});}}
    const total=profiles.reduce((sum,p)=>sum+(p.finalWeight>0?p.finalWeight:0),0);
    return profiles.map(p=>({...p,normalizedProbability:total&&p.finalWeight>0?p.finalWeight/total:0}));
  }
  function deriveCandidatePoolIdentity(candidates){return identity("hs-opportunity-probability-pool",[...new Set(candidates.map(c=>c.candidateId))].sort(compare));}
  function drawWeightedCandidate({weights,context,candidatePoolIdentity=deriveCandidatePoolIdentity(weights),drawIndex=0}){
    if(!Number.isInteger(drawIndex)||drawIndex<0)throw Error("Invalid draw index");
    const diagnostics=weights.filter(w=>!Number.isFinite(w.finalWeight)||w.finalWeight<=0).map(w=>({candidateId:w.candidateId,reason:"excludedByZeroWeight"}));
    const eligible=weights.filter(w=>Number.isFinite(w.finalWeight)&&w.finalWeight>0).sort((a,b)=>compare(a.candidateId,b.candidateId));
    if(new Set(eligible.map(p=>p.candidateId)).size!==eligible.length)throw Error("Duplicate weighted candidate");
    const total=eligible.reduce((sum,w)=>sum+w.finalWeight,0);
    if(!eligible.length||!Number.isFinite(total))return {selectedCandidateId:null,drawValue:null,drawRange:0,drawIndex,drawRef:null,diagnostics};
    const tuple=[NAMESPACE,VERSION,context.careerId,context.careerYear,context.seasonPhase,context.selectionWindowId,candidatePoolIdentity,drawIndex];
    const drawValue=Roster.createSeededRandom(JSON.stringify(tuple))()*total;
    let cumulative=0,selected=eligible.at(-1);for(const p of eligible){cumulative+=p.finalWeight;if(drawValue<cumulative){selected=p;break;}}
    return {selectedCandidateId:selected.candidateId,drawValue,drawRange:total,drawIndex,drawRef:identity("hs-opportunity-draw",tuple),diagnostics};
  }
  function deriveProbabilityResult({candidates,context,budget=1,bypassReason=null}){
    if(!Number.isInteger(budget)||budget<0)throw Error("Invalid probability budget");
    const diagnostics=[];
    if(bypassReason||budget===0)return {selectionWindowId:context.selectionWindowId,candidatePoolIdentity:null,weights:[],selectedCandidateId:null,selectedCandidateIds:[],drawValue:null,drawRange:0,draws:[],probabilityVersion:VERSION,reason:bypassReason||"budgetNotAvailable",diagnostics:[]};
    const admissible=[];for(const c of candidates){if(c.priority==="mandatory"||c.eligible!==true||(c.exclusionReasons||[]).length)diagnostics.push({candidateId:c.candidateId,reason:c.priority==="mandatory"?"mandatoryBypassProbability":"blockedBeforeProbability"});else admissible.push(c);}
    const weights=deriveCandidateWeights(admissible,context),candidatePoolIdentity=deriveCandidatePoolIdentity(weights),draws=[];
    for(const p of weights){for(const reason of p.diagnostics)diagnostics.push({candidateId:p.candidateId,reason});if(p.finalWeight<=0)diagnostics.push({candidateId:p.candidateId,reason:"excludedByZeroWeight"});}
    let remaining=weights.filter(p=>p.finalWeight>0);
    for(let drawIndex=0;drawIndex<budget&&remaining.length;drawIndex++){const draw=drawWeightedCandidate({weights:remaining,context,candidatePoolIdentity,drawIndex});draws.push(draw);remaining=remaining.filter(p=>p.candidateId!==draw.selectedCandidateId);}
    const selectedCandidateIds=draws.map(d=>d.selectedCandidateId);
    return {selectionWindowId:context.selectionWindowId,candidatePoolIdentity,weights:weights.map(w=>({...w,selected:selectedCandidateIds.includes(w.candidateId),reason:selectedCandidateIds.includes(w.candidateId)?"selectedByWeightedDraw":w.finalWeight<=0?"excludedByZeroWeight":"notSelectedByWeightedDraw"})),
      selectedCandidateId:selectedCandidateIds[0]||null,selectedCandidateIds,drawValue:draws[0]?.drawValue??null,drawRange:draws[0]?.drawRange??0,draws,probabilityVersion:VERSION,reason:draws.length?"selectedByWeightedDraw":"blockedBeforeProbability",diagnostics};
  }
  function auditProbability(result){return {probabilityVersion:VERSION,eligibleOptionalCount:result.weights.length,totalWeight:result.weights.reduce((s,w)=>s+w.finalWeight,0),
    weightDistribution:result.weights.map(w=>({candidateId:w.candidateId,weightClass:w.weightClass,finalWeight:w.finalWeight,normalizedProbability:w.normalizedProbability})),
    selectedCandidateIds:copy(result.selectedCandidateIds),drawValue:result.drawValue,candidatePoolIdentity:result.candidatePoolIdentity,zeroWeightCount:result.weights.filter(w=>w.finalWeight<=0).length};}
  return Object.freeze({VERSION,NAMESPACE,WEIGHTS,deriveProbabilityProfile,deriveCandidateWeights,deriveCandidatePoolIdentity,drawWeightedCandidate,deriveProbabilityResult,auditProbability,auditOpportunityProbability:auditProbability});
});
