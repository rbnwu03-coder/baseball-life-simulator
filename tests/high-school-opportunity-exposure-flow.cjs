"use strict";
// Audit-only projection of observed producer/generator/selector facts. No draws or writes.
const Q=require("../high-school-opportunity-selection"),F=require("../high-school-friendly-invitation-producer"),C=require("../high-school-training-camp-producer");
const VERSION="exposure-bias-repair-audit-v1";
const STAGES=["producerOutput","generated","eligibility","semanticDedup","conflict","existingOpportunity","budget","probabilityPool","draw","materialization"];
function classify(reason){
  if(/semanticDuplicate|duplicateMatchSource/.test(reason))return [3,"semanticDuplicate"];
  if(/superseded/i.test(reason))return [3,"sourceSuperseded"];
  if(/typeConflict/.test(reason))return [4,"typeConflict"];
  if(/sameOpponent/.test(reason))return [4,"sameOpponentConflict"];
  if(/existingOpportunity/i.test(reason))return [5,"existingOpportunity"];
  if(/schedule|alreadyCompleted|completedSourceMatch|activeSourceMatch|Mandatory|outsideSelectionWindow/i.test(reason))return [4,"scheduleConflict"];
  if(/budget/i.test(reason))return [6,"budget"];
  if(/notSelectedByWeightedDraw/.test(reason))return [8,"notSelected"];
  return [2,"other"];
}
function traceFlow(input,result,materializedIds=[]){
  const friendly=F.deriveFriendlyInvitationSources(input),camp=C.deriveTrainingCampSources(input);
  const reachable=new Set((result.probabilityResult?.weights||[]).map(p=>p.candidateId)),chosen=new Set(result.selectedCandidateIds),made=new Set(materializedIds);
  const rows=result.context.candidateSet.map(c=>{
    const outcome=result.selectionReasons.find(o=>o.candidateId===c.candidateId),up=c.exclusionReasons||[];
    // invalidCandidate is a wrapper; retain the concrete upstream rejection instead.
    const reasons=[...new Set([...up,...(outcome?.reasons||[]).filter(r=>!(r==="invalidCandidate"&&up.length)&&!/^selected|eligibleForProbability|protectedExistingLifecycle/.test(r))])];
    const losses=reasons.map(reason=>({reason,...Object.fromEntries([['index',classify(reason)[0]],['code',classify(reason)[1]]])})).sort((a,b)=>a.index-b.index);
    const loss=chosen.has(c.candidateId)?null:losses[0]||{index:7,code:"other",reason:"notInProbabilityPool"};
    const statuses=Object.fromEntries(STAGES.map((stage,index)=>[stage,loss?(index<loss.index?"pass":index===loss.index?"rejected":"notReached"):index===9&&!made.has(c.candidateId)?"pending":"pass"]));
    if(result.mandatorySelections.includes(c.candidateId)){statuses.budget="bypassMandatory";statuses.probabilityPool="bypassMandatory";}
    return {candidateId:c.candidateId,sourceType:c.source?.type||null,producerType:c.sourceProvenance?.producerType||null,opponentSchoolId:c.opponentSchoolId,careerYear:c.careerYear,phase:c.seasonPhase,sequence:c.sequence,windowId:result.selectionWindowId,opportunityType:c.opportunityType,campSourceId:c.sourceProvenance?.campSourceId||null,returnVisitEvidence:c.sourceProvenance?.producerType==="returnVisitProducer"?(c.sourceProvenance.evidenceRefs||[c.provenance?.relationshipEvidenceRef].filter(Boolean)):[],sourceRef:c.source?.sourceId||null,semanticKey:outcome?.semanticKey||null,generatorEligible:c.eligible===true,reachable:reachable.has(c.candidateId),selected:chosen.has(c.candidateId),materialized:made.has(c.candidateId),statusAtEachStage:statuses,firstLossStage:loss?STAGES[loss.index]:null,rejectionStage:loss?STAGES[loss.index]:null,rejectionReason:loss?.reason||null,firstLossCode:loss?.code||null,allReasons:reasons};
  });
  const groups=new Map();for(const row of rows){if(!row.semanticKey)continue;const group=groups.get(row.semanticKey)||[];group.push(row);groups.set(row.semanticKey,group);}
  const dedupGroups=[...groups].filter(([,g])=>g.length>1).map(([semanticKey,g])=>({semanticKey,before:g.length,after:g.filter(r=>r.statusAtEachStage.semanticDedup==="pass").length,winners:g.filter(r=>r.statusAtEachStage.semanticDedup==="pass").map(r=>r.candidateId),losers:g.filter(r=>r.firstLossStage==="semanticDedup").map(r=>({candidateId:r.candidateId,reason:r.rejectionReason,producerType:r.producerType})),precedence:F.PRECEDENCE}));
  return {version:VERSION,stageOrder:STAGES,interpretation:"Logical first-loss projection; generator eligibility already includes upstream dedup and schedule checks. generatorEligible preserves that observed flag. Later stages are notReached, never inferred passes after rejection.",producerCounts:{friendly:friendly.sources.length,camp:camp.sources.length,campMatchSources:camp.matchSources.length},rows,dedupGroups};
}
function aggregateFlow(records){
  const histograms={sourceClass:{},type:{},year:{},opponentHistory:{}},firstLoss={},producerCounts={friendly:0,camp:0,campMatchSources:0},diagnostics={returnVisit:{},camp:{},friendly:{},y2New:{},y2Repeat:{}};
  const add=(d,c)=>{const s=c.flow.statusAtEachStage;for(const [k,v] of Object.entries({generated:true,eligible:c.eligible,postEligibility:s.eligibility==="pass",postDedup:s.semanticDedup==="pass",postConflict:s.conflict==="pass",postExistingBlock:s.existingOpportunity==="pass",budgetPool:s.budget==="pass",probabilityReachable:c.flow.reachable,selected:c.selected,materialized:c.materialized})){d[k]=(d[k]||0)+Number(v);}};
  for(const r of records){const seen=new Set();for(const w of r.windows){if(!w.flow)continue;for(const k of Object.keys(producerCounts))producerCounts[k]+=w.flow.producerCounts[k];for(const c of w.candidates){const history=seen.has(c.opponent)?"repeat":"new";for(const [key,value] of [["sourceClass",c.sourceClass],["type",c.type],["year",w.year],["opponentHistory",history]])add(histograms[key][value]??={},c);if(c.flow.firstLossCode)firstLoss[c.flow.firstLossCode]=(firstLoss[c.flow.firstLossCode]||0)+1;if(c.sourceClass==="explicitReturnVisit")add(diagnostics.returnVisit,c);if(c.type==="trainingCamp")add(diagnostics.camp,c);if(c.type==="friendly")add(diagnostics.friendly,c);if(w.year===2)add(diagnostics[history==="new"?"y2New":"y2Repeat"],c);}for(const c of w.candidates.filter(c=>c.selected&&c.completed))seen.add(c.opponent);}}
  return {version:VERSION,histograms,firstLoss,producerCounts,diagnostics};
}
module.exports={VERSION,STAGES,classify,traceFlow,aggregateFlow};
