/* Pure projection of recorded production facts. No gameplay invocation or RNG. */
const assert=require('assert/strict');
const inc=(o,k,n=1)=>{o[String(k)]=(o[String(k)]||0)+n;};
function structuralMatrix(){return ['groundBall','lineDrive','flyBall'].flatMap(type=>['leftSide','middle','rightSide'].flatMap(direction=>(type==='groundBall'?[null]:['shallow','medium','deep']).map(depth=>({type,direction,depth,
  detailedPotential:type==='groundBall'?direction==='rightSide':type==='lineDrive'?direction==='rightSide'&&depth==='shallow':direction!=='leftSide'&&depth!=='shallow',
  condition:type==='groundBall'?'admitted active 2B + reach + legal ground handoff':type==='lineDrive'?'active 2B + access + unexpired catch window':'active CF/RF assignment + access + catch window',observed:0,canonical:0,fallback:0,unsupported:0}))));}
function projectGame(g){
  const m=g.match,log=m.simulationLog,events=log.filter(e=>e.type==='plateAppearance');
  const observerPA=new Map(g.observed.filter(r=>r.kind==='event'&&r.data.event.type==='plateAppearance').map(r=>[r.data.event.sequence,r.data]));
  assert.equal(observerPA.size,events.length,'Observer must include every PA');
  const classes={},results={player:{},npc:{}},physical=[],seen=new Set(),lifecycle={},runner={settlements:0,existingRunnerForce:0,multiRunner:0,doublePlay:0,tagUp:0,thirdOut:0,legalRuns:0,invalidatedRuns:0};
  const integrity=[];
  const byOrdinal=new Map();
  for(const item of g.observed.filter(r=>r.kind==='handoff')){const d=item.data,t=d.state?.battedBallPhysicalTruth;if(!t)continue;const key=d.paOrdinal+'|'+t.identity;if(seen.has(key))continue;seen.add(key);byOrdinal.set(d.paOrdinal,{...d,truth:t});}
  events.forEach((e,ordinal)=>{
    const o=observerPA.get(e.sequence),isPlayer=e.batterId==='player',stack=o.sourceStack;
    const handoff=byOrdinal.get(ordinal);
    const klass=e.resolutionMode==='compressedPlateAppearance'?(isPlayer?'playerCompressed':'npcCompressed')
      :isPlayer&&stack.includes('resolveHighSchoolOffensiveDecision')?'playerDetailedPitch'
      :stack.includes('applyHighSchoolBuntTerminalPlateAppearance')?'npcBuntCount'
      :handoff?'npcPhysicalDefense'
      :stack.some(n=>/applyInfieldResolution|applyRoutineDefensiveResolution/.test(n))?'npcBuntOrSyntheticDefense'
      :e.eventClassification==='playerMeaningfulDecision'?'npcPositionDecision':'otherRecordedPA';
    inc(classes,klass);inc(results[isPlayer?'player':'npc'],e.result);
    if(handoff){const t=handoff.truth;
      if(handoff.state.batterId!==e.batterId)integrity.push('OBSERVATION_PHYSICAL_BATTER_MISMATCH');
      const canonical=t.ballType==='groundBall'?handoff.ground?.supported&&stack.some(n=>/applyInfieldResolution|applyRoutineDefensiveResolution/.test(n))
        :t.ballType==='lineDrive'?stack.includes('applyHighSchoolLineDriveCatchResolution'):stack.includes('applyHighSchoolFlyBallCatchResolution');
      const state=t.ballType==='groundBall'?handoff.ground:t.ballType==='lineDrive'?handoff.line:handoff.fly;
      const reason=canonical?null:state?.defensiveAccess?.reason||state?.fallbackAuthority||handoff.ground?.fallbackAuthority||'existingSyntheticDefensiveContext';
      physical.push({identity:t.identity,paOrdinal:ordinal,type:t.ballType,direction:t.direction,depth:t.depth,strength:t.pace,
        status:canonical?'CANONICAL':'FALLBACK',fallbackReason:reason,source:'ordinaryDefensivePlateAppearanceState.battedBallPhysicalTruth',
        route:stack.join('>')||'recordedPA',result:e.result,runnerContext:e.before,attribution:canonical?(state?.defenderId||state?.defensiveAccess?.defenderId||(t.ballType==='flyBall'?'active-fly-defender':'player')):'compatibility-settlement; no physical fielder claim'});
    } else if(isPlayer&&klass==='playerDetailedPitch'&&o.paState?.battedBallPhysicalTruth){const t=o.paState.battedBallPhysicalTruth;physical.push({identity:t.identity,paOrdinal:ordinal,type:t.ballType,direction:t.direction,depth:t.depth,strength:t.pace,status:'FALLBACK',fallbackReason:'playerDetailedPAUsesGenericBBPMapper',source:'offensivePlateAppearanceState.battedBallPhysicalTruth',route:stack.join('>'),result:e.result,runnerContext:e.before,attribution:'generic-outcome-mapper; no physical fielder claim'});}
    const third=e.thirdOutResolution;
    if(third){if(third.thirdOutType!=='none')runner.thirdOut++;runner.legalRuns+=(third.legalScoringRunnerIds||[]).length;runner.invalidatedRuns+=(third.invalidatedScoringRunnerIds||[]).length;
      if(third.scoringAllowed===false&&(e.scoringRunnerIds||[]).length)integrity.push('RUN_AFTER_INVALID_THIRD_OUT');
      if(JSON.stringify(e.scoringRunnerIds||[])!==JSON.stringify(third.legalScoringRunnerIds||[]))integrity.push('RUN_LEGALITY_DIVERGENCE');
    }
    if((e.after?.outs||0)-(e.before?.outs||0)>=2)runner.doublePlay++;
    if(e.after?.outs>3||new Set((e.after?.runners||[]).filter(Boolean)).size!==(e.after?.runners||[]).filter(Boolean).length)integrity.push('IMPOSSIBLE_OUTS_OR_BASES');
  });
  if([...byOrdinal.keys()].some(i=>i>=events.length))integrity.push('UNSETTLED_PHYSICAL_TRUTH');
  for(const e of log){
    if(!Array.isArray(e.before?.runners)||!Array.isArray(e.after?.runners))continue;
    for(const id of e.before.runners.filter(Boolean)){
      const accounted=e.after.runners.includes(id)||(e.scoringRunnerIds||[]).includes(id)
        ||(e.runnerChanges||[]).some(r=>r.runnerId===id&&(r.to==='out'||r.to==='home'||r.to===4||r.retired||r.scored))
        ||(e.thirdOutResolution?.strandedRunnerIds||[]).includes(id);
      if(!accounted)integrity.push('LOST_RUNNER:'+e.sequence+':'+id);
    }
  }
  // Bunt physical facts use their own schema, never masquerade as ordinary fly/ground truth.
  let ordinal=0;
  for(const e of log){if(e.type==='plateAppearance'){ordinal++;continue;}if(e.type!=='buntPitchResolved'||e.pitchResult!=='ballInPlay')continue;
    const o=observerPA.get(events[ordinal]?.sequence),bunt=o?.bunt;
    const pitch=bunt?.pitchHistory?.find(p=>p.buntResolution?.currentPitchTacticalCommitment?.pitchIdentity===e.buntPitchIdentity);
    const truth=pitch?.buntResolution;
    if(!truth||truth.contactResult!=='fairContact'){integrity.push('OBSERVATION_BUNT_PHYSICAL_MISSING');continue;}
    const canonical=o.buntHandoff?.supported===true&&o.sourceStack.some(n=>/applyInfieldResolution|applyRoutineDefensiveResolution/.test(n));
    physical.push({identity:e.buntPitchIdentity,paOrdinal:ordinal,type:truth.fairBallType,direction:truth.placement,depth:null,strength:truth.pace,
      status:canonical?'CANONICAL':'FALLBACK',fallbackReason:canonical?null:o.buntHandoff?.ballContext?.downstreamSupport||'unsupportedBuntDefensiveFallback',
      source:'offensiveBuntPAState.pitchHistory.buntResolution',route:o.sourceStack.join('>'),result:events[ordinal]?.result,runnerContext:events[ordinal]?.before,
      attribution:canonical?'player (supported bunt defense)':'compatibility fallback; no physical fielder claim'});
  }
  const settlementIds=new Set();
  for(const row of g.observed.filter(r=>r.kind==='settlement')){const s=row.data.settlement;runner.settlements++;
    if(settlementIds.has(s.identity))integrity.push('DUPLICATE_RUNNER_SETTLEMENT_ID');settlementIds.add(s.identity);
    const existing=(s.runnerMovement||[]).filter(r=>typeof r.from==='number');
    if(existing.some(r=>r.isForced))runner.existingRunnerForce++;
    if(existing.length>1)runner.multiRunner++;
    if(s.outsAfter>3)integrity.push('FOURTH_OUT');
    if(existing.some(r=>r.from===3&&(r.to==='home'||r.to===4)&&!r.isForced&&!r.committed))integrity.push('UNCOMMITTED_THIRD_RUNNER_SCORE');
  }
  runner.tagUp=log.filter(e=>e.type==='runnerTagUpResolution').length;
  const states=new Set();
  for(const row of g.observed.filter(r=>r.kind==='lifecycle'))for(const side of ['before','after']){const fact=row.data[side],s=fact.situation;if(!s)continue;const key=s.situationId+'|'+s.lifecycleState+'|'+fact.groundApplied;if(states.has(key))continue;states.add(key);inc(lifecycle,s.type+'|'+s.lifecycleState+'|'+(fact.groundApplied?'groundApplied':'groundNotApplied'));if(s.type==='groundBallDefensiveDecision'&&s.lifecycleState==='admitted'&&!s.admission?.admittedToPlayer)inc(lifecycle,'automaticGroundAdmission');}
  const terminal=new Set(physical.map(p=>p.paOrdinal+'|'+p.identity));assert.equal(terminal.size,physical.length,'Duplicate physical observation');
  assert.equal(Object.values(classes).reduce((a,b)=>a+b,0),events.length);
  return {seed:g.admission.seed,role:g.admission.actualAdmittedRole,finalRole:m.playerLineupStatus,pa:events.length,classes,results,physical,lifecycle,runner,integrity,
    scores:m.scores,recordTotals:m.gameRecord.totals,position:g.admission.position,gameRecordRefs:m.gameRecord.eventRefs.length};
}
function aggregate(games){const out={games:0,pa:0,classes:{},roles:{},positions:{},finalRoles:{},results:{player:{},npc:{}},bbp:{total:0,byType:{},direction:{},depth:{},strength:{},fallbackReasons:{},routes:{},attribution:{}},structuralMatrix:structuralMatrix(),lifecycle:{},runner:{},integrity:[],witnesses:[]};
  for(const g of games){out.games++;out.pa+=g.pa;inc(out.roles,g.role);inc(out.positions,g.position);inc(out.finalRoles,g.finalRole);
    for(const key of ['classes','lifecycle','runner'])for(const [k,n]of Object.entries(g[key]))inc(out[key],k,n);
    for(const actor of ['player','npc'])for(const[k,n]of Object.entries(g.results[actor]))inc(out.results[actor],k,n);
    for(const p of g.physical){out.bbp.total++;const t=out.bbp.byType[p.type]||(out.bbp.byType[p.type]={total:0,CANONICAL:0,FALLBACK:0,UNSUPPORTED:0});t.total++;t[p.status]++;inc(out.bbp.direction,p.direction??'NOT_APPLICABLE');inc(out.bbp.depth,p.depth??'NOT_APPLICABLE');inc(out.bbp.strength,p.strength??'NOT_APPLICABLE');inc(out.bbp.routes,p.route);inc(out.bbp.attribution,p.attribution);if(p.status==='FALLBACK')inc(out.bbp.fallbackReasons,p.type+'|'+p.fallbackReason);
      const cell=out.structuralMatrix.find(c=>c.type===p.type&&c.direction===p.direction&&c.depth===p.depth);if(cell){cell.observed++;cell[p.status.toLowerCase()]++;}
      out.witnesses.push({seed:g.seed,...p});
    }
    if(g.integrity.length)out.integrity.push({seed:g.seed,issues:g.integrity});
  }
  out.witnesses.sort((a,b)=>a.seed-b.seed||a.paOrdinal-b.paOrdinal||a.identity.localeCompare(b.identity));out.witnesses=out.witnesses.slice(0,30);
  for(const type of ['groundBall','lineDrive','flyBall','groundBunt','popBunt'])out.bbp.byType[type]??={total:0,CANONICAL:0,FALLBACK:0,UNSUPPORTED:0};
  assert.equal(Object.values(out.bbp.byType).reduce((n,t)=>n+t.total,0),out.bbp.total);
  assert.equal(Object.values(out.bbp.fallbackReasons).reduce((a,b)=>a+b,0),Object.values(out.bbp.byType).reduce((n,t)=>n+t.FALLBACK,0));
  return out;
}
module.exports={projectGame,aggregate,structuralMatrix};
