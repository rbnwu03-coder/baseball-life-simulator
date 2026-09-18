(function(root,factory) {
  const api=factory(typeof module==="object"&&module.exports?require("./high-school-match-opportunity-generation"):root.HighSchoolMatchOpportunityGeneration,
    typeof module==="object"&&module.exports?require("./high-school-friendly-invitation-producer"):root.HighSchoolFriendlyInvitationSource,
    typeof module==="object"&&module.exports?require("./high-school-schedule-opportunity"):root.HighSchoolScheduleOpportunity,
    typeof module==="object"&&module.exports?require("./high-school-opportunity-probability"):root.HighSchoolOpportunityProbability);
  if(typeof module==="object"&&module.exports)module.exports=api;else root.HighSchoolOpportunitySelection=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Generation,Friendly,Schedule,Probability) {
  "use strict";
  const POLICY_VERSION="high-school-opportunity-selection-v1";
  const TYPE_ORDER=Object.freeze(["officialCompetitionOpportunity","trainingCampOpportunity","incomingFriendlyInvitation","outgoingFriendlyInvitation","developmentMatchOpportunity","neutralExchangeOpportunity"]);
  const LIFECYCLE_SLOTS=Object.freeze({
    "hs-y1-autumn-exhibition":{careerYear:1,seasonPhase:"autumn-exhibition",sequence:1},
    "hs-y1-followup-evaluation-2":{careerYear:1,seasonPhase:"post-autumn-evaluation",sequence:2},
    "hs-y2-spring-evaluation-1":{careerYear:2,seasonPhase:"year-two-spring-evaluation",sequence:1},
    "hs-y2-autumn-evaluation-2":{careerYear:2,seasonPhase:"year-two-autumn-evaluation",sequence:2},
    "hs-y3-final-competition-1":{careerYear:3,seasonPhase:"final-competition",sequence:1}
  });
  const copy=v=>JSON.parse(JSON.stringify(v));
  const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
  const sig=v=>JSON.stringify(stable(v)),compare=(a,b)=>a<b?-1:a>b?1:0;
  const id=v=>typeof v==="string"&&v.trim().length>0;
  const sameSlot=(a,b)=>a.careerYear===b.careerYear&&a.seasonPhase===b.seasonPhase&&a.sequence===b.sequence;
  const windowId=c=>"hs-opportunity-selection-window:"+encodeURIComponent(sig([POLICY_VERSION,c.careerId,c.careerYear,c.seasonPhase,c.sequence,c.playerSchoolId]));
  const protectedDevelopment=c=>c.opportunityType==="developmentMatchOpportunity"&&c.sourceAuthority==="existing"&&c.source?.type==="developmentSchedule"
    &&c.source.sourceId==="hs-y1-followup-evaluation-2"&&sameSlot(c,LIFECYCLE_SLOTS["hs-y1-followup-evaluation-2"])
    &&c.sourceProvenance?.foundationSelection==="existingDevelopmentStage";
  const mandatory=c=>c.opportunityType==="officialCompetitionOpportunity"||protectedDevelopment(c);
  const semantic=c=>sig([c.careerId,c.careerYear,c.seasonPhase,c.sequence,c.playerSchoolId,c.opponentSchoolId,c.opportunityType,Schedule.ORIGIN_MAP[c.opportunityType]]);
  function sourceOrder(c) {
    const p=Friendly.PRECEDENCE.indexOf(c.sourceProvenance?.producerType);
    return p>=0?p:c.sourceAuthority==="fallback"?Friendly.PRECEDENCE.length+1:Friendly.PRECEDENCE.length;
  }
  const typeOrder=c=>["incomingFriendlyInvitation","outgoingFriendlyInvitation"].includes(c.opportunityType)?2:TYPE_ORDER.indexOf(c.opportunityType);
  const order=(a,b)=>Number(mandatory(b))-Number(mandatory(a))||typeOrder(a)-typeOrder(b)||sourceOrder(a)-sourceOrder(b)||compare(a.opponentSchoolId,b.opponentSchoolId)||compare(a.candidateId,b.candidateId)||compare(sig(a),sig(b));
  function deriveSelectionContext(input) {
    const raw=input.context||{},context={careerId:raw.careerId,careerYear:raw.careerYear,seasonPhase:raw.seasonPhase,sequence:raw.sequence??1,playerSchoolId:raw.playerSchoolId};
    if(!id(context.careerId)||!id(context.playerSchoolId)||![1,2,3].includes(context.careerYear)||!id(context.seasonPhase)||!Number.isInteger(context.sequence)||context.sequence<1)throw Error("Invalid selection context");
    const limit=input.maxOptionalPerSelectionWindow??1;
    // A window is one existing match slot. Larger budgets would change lifecycle frequency.
    if(![0,1].includes(limit))throw Error("Selection policy v1 supports optional budget 0 or 1 per existing slot");
    const generated=input.candidateSet===undefined?Generation.deriveOpportunityCandidates(input).candidates:input.candidateSet;
    if(!Array.isArray(generated))throw Error("Invalid candidate set");
    const state=input.schedule||Schedule.emptyState();
    const existingOpportunities=state.opportunities.filter(o=>o.careerId===context.careerId&&o.playerSchoolId===context.playerSchoolId&&sameSlot(o,context)).map(copy).sort((a,b)=>compare(a.opportunityId,b.opportunityId));
    const existingScheduleEntries=state.entries.filter(e=>sameSlot(e,context)).map(copy).sort((a,b)=>compare(a.scheduleEntryId,b.scheduleEntryId));
    const lifecycle=[];
    for(const h of input.history||[])if(LIFECYCLE_SLOTS[h.matchId]&&sameSlot(LIFECYCLE_SLOTS[h.matchId],context)&&h.careerYear===context.careerYear)lifecycle.push({matchId:h.matchId,status:"completed"});
    const active=input.activeMatch;
    if(active?.id&&LIFECYCLE_SLOTS[active.id]&&sameSlot(LIFECYCLE_SLOTS[active.id],context))lifecycle.push({matchId:active.id,status:active.completed?"completed":"inProgress"});
    const existingLifecycleMatches=[...new Map(lifecycle.map(m=>[m.matchId,m])).values()].sort((a,b)=>compare(a.matchId,b.matchId));
    const contextResult={...context,selectionWindowId:windowId(context),selectionPolicyVersion:POLICY_VERSION,
      existingOpportunities,existingScheduleEntries,existingLifecycleMatches,
      mandatoryReservations:copy((raw.mandatorySlots||[]).filter(s=>sameSlot(s,context))).sort((a,b)=>compare(sig(a),sig(b))),
      candidateSet:copy(generated).sort((a,b)=>compare(sig(a),sig(b))),maxOptionalPerSelectionWindow:limit};
    return contextResult;
  }
  function applyOpportunityBudget(context) {
    const optional=context.existingOpportunities.filter(o=>o.opportunityType!=="officialCompetitionOpportunity"&&!(o.source?.type==="developmentSchedule"&&o.source.sourceId==="hs-y1-followup-evaluation-2"&&sameSlot(o,LIFECYCLE_SLOTS["hs-y1-followup-evaluation-2"])));
    const orphanEntries=context.existingScheduleEntries.filter(e=>e.matchOrigin!=="officialCompetition"&&!context.existingOpportunities.some(o=>o.opportunityId===e.opportunityId));
    const used=optional.length+orphanEntries.length;
    return {maxOptionalPerSelectionWindow:context.maxOptionalPerSelectionWindow,existingUsed:used,remaining:Math.max(0,context.maxOptionalPerSelectionWindow-used),selectedUsed:0};
  }
  function resolveCandidateConflicts(context, deferOptionalChoice=false) {
    const optionalPool=[];
    const budget=applyOpportunityBudget(context),outcomes=[],selected=[],seenIds=new Set(),seenSemantic=new Set();
    const valid=c=>c&&id(c.candidateId)&&id(c.opponentSchoolId)&&c.opponentSchoolId!==c.playerSchoolId&&Object.hasOwn(Schedule.ORIGIN_MAP,c.opportunityType)
      &&c.eligible===true&&Array.isArray(c.exclusionReasons)&&c.exclusionReasons.length===0;
    const candidates=context.candidateSet.filter(c=>c&&typeof c==="object").sort(order);
    const mandatoryClaim=context.mandatoryReservations.length>0||candidates.some(c=>valid(c)&&mandatory(c)&&sameSlot(c,context));
    for(const c of candidates) {
      const reasons=[],isMandatory=mandatory(c),sameWindow=sameSlot(c,context)&&c.careerId===context.careerId&&c.playerSchoolId===context.playerSchoolId;
      if(!sameWindow)reasons.push("outsideSelectionWindow");
      if(!valid(c))reasons.push("invalidCandidate");
      if((c.exclusionReasons||[]).some(r=>["supersededByHigherPriorityProducer","supersededByCanonicalSource","duplicateMatchSource"].includes(r)))reasons.push("supersededByHigherPrecedenceSource");
      if(sameWindow) {
        const entries=context.existingScheduleEntries;
        if(entries.length)reasons.push(entries.some(e=>e.status==="completed")?"alreadyCompleted":"blockedByExistingSchedule");
        if(context.existingLifecycleMatches.length)reasons.push(context.existingLifecycleMatches.some(m=>m.status==="completed")?"alreadyCompleted":"blockedByExistingSchedule");
        if(context.existingOpportunities.length)reasons.push("blockedByExistingOpportunity");
        if(!isMandatory&&mandatoryClaim)reasons.push("blockedByMandatorySelection");
        if(seenIds.has(c.candidateId)||seenSemantic.has(semantic(c)))reasons.push("semanticDuplicate");
      }
      if(deferOptionalChoice&&!isMandatory&&!reasons.length) {
        if(optionalPool.length&&typeOrder(c)!==typeOrder(optionalPool[0]))reasons.push("typeConflict");
        if(budget.remaining<=0)reasons.push("budgetExceeded");
        if(!reasons.length){
          optionalPool.push(c);seenSemantic.add(semantic(c));seenIds.add(c.candidateId);
          outcomes.push({candidateId:c.candidateId,selected:false,classification:"optional",reasons:["eligibleForProbability"],upstreamReasons:[],semanticKey:semantic(c),campSourceId:c.sourceProvenance?.campSourceId||null});
          continue;
        }
      }
      if(!reasons.length) {
        if(selected.length) {
          if(typeOrder(c)!==typeOrder(selected[0]))reasons.push("typeConflict");
          else if(!isMandatory)reasons.push("budgetExceededAfterStableOrder");
          else reasons.push("mandatorySlotConflict");
          if(!isMandatory&&selected.some(s=>s.opponentSchoolId===c.opponentSchoolId))reasons.push("sameOpponentOptional");
        }
        if(!isMandatory&&budget.remaining<=0)reasons.push("budgetExceeded");
      }
      if(!reasons.length) {
        selected.push(c);seenSemantic.add(semantic(c));
        if(!isMandatory){budget.selectedUsed++;budget.remaining--;}
      }
      seenIds.add(c.candidateId);
      const selectedNow=reasons.length===0;
      outcomes.push({candidateId:c.candidateId,selected:selectedNow,classification:isMandatory?"mandatory":"optional",
        reasons:selectedNow?[isMandatory?"selectedMandatory":"selectedOptional",...(protectedDevelopment(c)?["protectedExistingLifecycle"]:[])]:[...new Set(reasons)].sort(compare),
        upstreamReasons:copy(c.exclusionReasons||[]),semanticKey:semantic(c),campSourceId:c.sourceProvenance?.campSourceId||null});
    }
    for(const c of context.candidateSet.filter(c=>!c||typeof c!=="object"))outcomes.push({candidateId:null,selected:false,classification:"optional",reasons:["invalidCandidate"],upstreamReasons:[],semanticKey:null,campSourceId:null});
    return {selected,outcomes,budget,...(deferOptionalChoice?{optionalPool}:{})};
  }
  function selectOpportunityCandidates(input) {
    const enabled=input.probabilityPolicy==="enabled",context=deriveSelectionContext(input),resolved=resolveCandidateConflicts(context,enabled);
    let probabilityResult;
    if(enabled){
      const bypass=context.existingOpportunities.length?"existingOpportunityBypass":context.existingScheduleEntries.length||context.existingLifecycleMatches.length?"blockedBeforeProbability":resolved.selected.some(mandatory)||context.mandatoryReservations.length?"mandatoryBypassProbability":null;
      probabilityResult=Probability.deriveProbabilityResult({candidates:resolved.optionalPool,context,budget:resolved.budget.remaining,bypassReason:bypass});
      const chosen=new Set(probabilityResult.selectedCandidateIds);
      for(const c of resolved.optionalPool){const outcome=resolved.outcomes.find(o=>o.candidateId===c.candidateId);outcome.selected=chosen.has(c.candidateId);outcome.reasons=[outcome.selected?"selectedByWeightedDraw":"notSelectedByWeightedDraw"];if(outcome.selected){resolved.selected.push(c);resolved.budget.selectedUsed++;resolved.budget.remaining--;}}
    }
    return {policyVersion:POLICY_VERSION,selectionWindowId:context.selectionWindowId,context,
      selectedCandidateIds:resolved.selected.map(c=>c.candidateId),selectedCandidates:copy(resolved.selected),
      mandatorySelections:resolved.selected.filter(mandatory).map(c=>c.candidateId),optionalSelections:resolved.selected.filter(c=>!mandatory(c)).map(c=>c.candidateId),
      mandatoryFacts:context.candidateSet.filter(c=>c&&mandatory(c)&&sameSlot(c,context)).map(c=>c.candidateId),
      ...(enabled?{probabilityPolicy:"enabled",probabilityResult}:{}),
      selectionReasons:resolved.outcomes,rejectedCandidates:resolved.outcomes.filter(o=>!o.selected),diagnostics:resolved.outcomes.filter(o=>!o.selected),budget:resolved.budget};
  }
  function materializeSelectedCandidates(state,result,input) {
    const output={policyVersion:POLICY_VERSION,selectionWindowId:result?.selectionWindowId,materialized:[],existing:[],diagnostics:[]};
    let current;
    try{current=selectOpportunityCandidates({...input,schedule:state,candidateSet:undefined});}catch(error){output.diagnostics.push({reason:"staleAtMaterialization",detail:error.message});return output;}
    if(result?.policyVersion!==POLICY_VERSION||result.selectionWindowId!==current.selectionWindowId||!Array.isArray(result.selectedCandidateIds)) {
      output.diagnostics.push({reason:"staleAtMaterialization"});return output;
    }
    const pending=[];
    for(const candidateId of [...new Set(result.selectedCandidateIds)]) {
      const existing=state.opportunities.find(o=>o.provenance?.candidateRef?.candidateId===candidateId);
      if(existing){output.existing.push(existing);continue;}
      const candidate=current.selectedCandidates.find(c=>c.candidateId===candidateId),prior=result.selectedCandidates?.find(c=>c.candidateId===candidateId);
      if(!candidate||!prior||sig(candidate)!==sig(prior))output.diagnostics.push({candidateId,reason:"staleAtMaterialization"});
      else pending.push(candidate);
    }
    if(output.diagnostics.length)return output;
    // Preflight the whole batch through the existing materializer before any real mutation.
    const trial=copy(state);
    try{for(const c of pending)Generation.materializeOpportunityCandidate(trial,c,{...input,schedule:trial});}
    catch(error){output.diagnostics.push({reason:"staleAtMaterialization",detail:error.message});return output;}
    for(const c of pending) {
      const o=Generation.materializeOpportunityCandidate(state,c,{...input,schedule:state});
      // Only freshly created Opportunities receive selection refs; old provenance is immutable.
      o.provenance.selectionPolicyVersion=POLICY_VERSION;o.provenance.selectionWindowId=current.selectionWindowId;
      o.provenance.selectionReason=mandatory(c)?"selectedMandatory":"selectedOptional";
      if(current.probabilityResult?.selectedCandidateIds.includes(c.candidateId)){
        const probability=current.probabilityResult,profile=probability.weights.find(w=>w.candidateId===c.candidateId);
        o.provenance.probabilityVersion=probability.probabilityVersion;o.provenance.candidatePoolIdentity=probability.candidatePoolIdentity;
        o.provenance.selectedWeightClass=profile.weightClass;o.provenance.drawRef=probability.draws.find(d=>d.selectedCandidateId===c.candidateId).drawRef;
      }
      output.materialized.push(o);
    }
    return output;
  }
  function auditSelection(result) {
    const reasons={};for(const o of result.selectionReasons)for(const r of o.reasons)reasons[r]=(reasons[r]||0)+1;
    return {candidateCount:result.selectionReasons.length,mandatoryCount:result.selectionReasons.filter(o=>o.classification==="mandatory").length,
      optionalCount:result.selectionReasons.filter(o=>o.classification==="optional").length,selectedCount:result.selectedCandidateIds.length,rejectedCount:result.rejectedCandidates.length,
      reasonHistogram:stable(reasons),budget:copy(result.budget),duplicateSemanticGroups:reasons.semanticDuplicate||0,
      existingOpportunityBlocks:reasons.blockedByExistingOpportunity||0,scheduleConflicts:reasons.blockedByExistingSchedule||0};
  }
  return Object.freeze({POLICY_VERSION,TYPE_ORDER,LIFECYCLE_SLOTS,deriveSelectionContext,selectOpportunityCandidates,resolveCandidateConflicts,applyOpportunityBudget,
    materializeSelectedCandidates,auditSelection,auditOpportunitySelection:auditSelection});
});
