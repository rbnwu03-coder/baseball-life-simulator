/* Admission discovery through normal UI choices; no role/capability/roster writes. */
const {createHarness}=require('./match-authority-coverage-audit.cjs');
function discover(seed, {schoolIndex=0, choiceIndex=0, youthChoiceIndex=0, observe=false}={}) {
  const h=createHarness({observe});
  const observed=[];
  if(observe)h.context.__m0Observe=(kind,data)=>observed.push({kind,data:JSON.parse(JSON.stringify(data))});
  if(observe)h.run(`for(const name of ['prepareHighSchoolPlateDecision','resolveHighSchoolPlateDecisionPitch',
    'createGroundBallMatchSituation','beginGroundBallSituationDecision','beginAutomaticGroundBallSituationExecution',
    'recordGroundBallSituationResolution','settleAndCloseGroundBallSituation','createHighSchoolRunnerTagUpSituation',
    'beginHighSchoolRunnerTagUpDecision','settleAndCloseHighSchoolRunnerTagUpSituation']) {
    const original=globalThis[name];
    if(typeof original!=='function')throw Error('Missing lifecycle route '+name);
    globalThis[name]=function(...args){
      const m=args[0];
      const state=()=>({situation:m.activeSituation||null,groundApplied:m.groundBallInPlayState?.settlementApplied===true,
        paOrdinal:m.simulationLog.filter(e=>e.type==='plateAppearance').length});
      const before=JSON.parse(JSON.stringify(state()));
      const result=original.apply(this,args);
      __m0Observe('lifecycle',{function:name,matchId:m.id,inning:m.inning,half:m.half,before,after:state(),returned:!!result});
      return result;
    };
  }`);
  h.run(`var m0DiscoveryRandom=${seed}>>>0;
    Math.random=()=>{m0DiscoveryRandom=(Math.imul(m0DiscoveryRandom,1664525)+1013904223)>>>0;return m0DiscoveryRandom/4294967296;};
    document.getElementById('nameInput').value='M0-admission-${seed}';
    selectOrigin(PlayerIdentityOptions.origins[1]);selectIdealSelf('棒球理解型');
    pendingGenesisRoll=rollCharacterGenesis();
    pendingGenesisAllocation={ballSense:1,observe:1,fitness:0,batting:0,baseRunning:0,baseballIQ:1};
    selectDevelopmentEntry('full');createPlayer();`);
  const steps=[];let reason=null,error=null;
  for(let i=0;i<600;i++){
    const state=h.json(`({event:getCurrentEventId(),chapter:player.chapter,matchId:player.highSchoolMatch?.id,
      transition:isTransitioning,training:!!pendingTrainingOutcome,outcome:!!pendingYouthSeasonOutcome,
      gameplay:pendingBaseballGameplay?.stage,school:isSchoolInvitationChoicePending(player)})`);
    if(state.matchId)break;
    let action;
    if(state.school)action=`beginSchoolInvitationConfirmationAt(${schoolIndex});confirmSchoolInvitationSelection();`;
    else if(state.training)action='continueTrainingOutcome()';
    else if(state.outcome)action='continueYouthSeasonOutcome()';
    else if(state.transition)action='__runNextTimer()';
    else if(state.gameplay==='throw-decision')action='chooseYouthGrounderThrow(youthGrounderThrowChoices[0].code)';
    else {
      const choices=h.json('getEvent(getCurrentEventId()).choices');
      const navigation=choices.findIndex(c=>c.nextChapter||c.sleep);
      const index=navigation>=0?navigation:Math.min(state.chapter==='青棒'?choiceIndex:youthChoiceIndex,choices.length-1);
      action=`choose(getCurrentEventId(),${index})`;
    }
    steps.push({index:i,event:state.event,action});
    try{h.run(action);}catch(e){error=e.stack;reason='exception';break;}
    if(i>=8&&steps.slice(-8).every(s=>s.event===state.event&&s.action===action)){reason='unchanged UI action for 8 attempts';break;}
    if(i===599)reason='600-step discovery bound';
  }
  const player=h.json('player');const m=player.highSchoolMatch;
  const row={seed,requestedSetup:{entry:'full',schoolIndex,choiceIndex,youthChoiceIndex,origin:'understand',ideal:'棒球理解型',rng:'LCG1664525/1013904223 seeded at creation; no observer draws'},
    matchReached:!!m?.id,matchId:m?.id,actualAdmittedRole:m?.id?m.playerLineupStatus:null,
    school:player.schoolInvitationState?.selectedSchoolId,position:player.primaryPosition,
    capability:player.capabilityState,skills:player.baseballSkills,coachEvaluation:player.highSchoolCoachEvaluation,
    provisionalRole:player.highSchoolRoleCode,roleContext:player.highSchoolRoleContext,
    opportunity:m?.playingTimeOpportunity||player.highSchoolOpportunityHistory,
    rosterContext:player.schoolInvitationState?.selectedPositionCompetitionContext,
    directStartHistory:player.flags?.includes('direct_start_history'),reason,error,steps};
  return {h,row,observed};
}
function playAdmitted(seed,options={}) {
  const d=discover(seed,options),{h,row}=d;
  if(row.error||!row.matchReached)return {...d,error:row.error||row.reason||'match not reached'};
  let steps=0,error=null;
  try {
    while(!h.run('player.highSchoolMatch.completed')&&steps++<5000){
      if(h.run('!!pendingYouthSeasonOutcome'))h.run('continueYouthSeasonOutcome()');
      else if(h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)')) {
        const accepted=h.run('var pilotChoice=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch)[0];pilotChoice&&chooseHighSchoolYearOneMatchMoment(pilotChoice.matchDecision,pilotChoice.matchMomentId)');
        if(!accepted)throw Error('Current legal match choice rejected');
      } else if(!h.run('__runNextTimer()'))throw Error('Match has no pending playback timer');
    }
    if(!h.run('player.highSchoolMatch.completed'))throw Error('5000-step pilot bound');
  }catch(e){error=e.stack;}
  const match=h.json('player.highSchoolMatch');
  const pa=match.simulationLog.filter(e=>e.type==='plateAppearance').length;
  const lines=Object.values(match.gameRecord.playerLines);
  const battingPA=lines.reduce((n,l)=>n+l.batting.PA,0),pitcherBF=lines.reduce((n,l)=>n+l.pitching.BF,0);
  const failures=[];
  if(error)failures.push({code:'PRODUCTION_EXCEPTION',error});
  if(pa!==battingPA||pa!==pitcherBF)failures.push({code:'PA_ACCOUNTING',pa,battingPA,pitcherBF});
  for(const side of ['home','away'])if(match.scores[side]!==match.gameRecord.totals[side].runs)failures.push({code:'SCORE_ACCOUNTING',side});
  if(match.completed&&match.activeSituation)failures.push({code:'UNCONSUMED_LIFECYCLE'});
  const recordIssues=h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)');
  const stateIssues=h.json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)');
  if(recordIssues.length||stateIssues.length)failures.push({code:'PRODUCTION_INTEGRITY',recordIssues,stateIssues});
  const refs=match.gameRecord.eventRefs.filter(r=>r.type==='plateAppearance');
  const paEvents=match.simulationLog.filter(e=>e.type==='plateAppearance');
  if(refs.length!==pa||new Set(refs.map(r=>r.sequence)).size!==pa||paEvents.some(e=>!refs.some(r=>r.sequence===e.sequence)))failures.push({code:'PA_REFERENCE_ACCOUNTING'});
  return {...d,match,check:{seed,actualAdmittedRole:row.actualAdmittedRole,finalRole:match.playerLineupStatus,completed:match.completed,steps,pa,battingPA,pitcherBF,failures}};
}
module.exports={discover,playAdmitted};
if(require.main===module){const {row}=discover(Number(process.argv[2]||440000));console.log(JSON.stringify(row,null,2));}
