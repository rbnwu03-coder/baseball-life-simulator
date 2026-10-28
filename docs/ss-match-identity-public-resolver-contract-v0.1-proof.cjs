"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./ss-match-identity-public-resolver-contract-v0.1-capture.cjs');
const H=require('../tests/helpers/canonical-match-contract-context.cjs');
const program=String.raw`
  function copy(x){return JSON.parse(JSON.stringify(x));}
  function stable(x){return Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;}
  function same(a,b){return JSON.stringify(stable(a))===JSON.stringify(stable(b));}
  function abilities(p){return {baseballSkills:p.baseballSkills,ballSense:p.ballSense,observe:p.observe,fitness:p.fitness,instinct:p.instinct,discipline:p.discipline,pressure:p.pressure,body:p.body,baseballExperience:p.baseballExperience,capabilityState:p.capabilityState};}
  globalThis.saved=JSON.parse(checkpointJSON);
  stopHighSchoolMatchPlayback();
  player=normalizeSave(copy(saved));
  globalThis.proof={checkpoint:{beforeAbilities:copy(abilities(saved)),afterRestoreAbilities:copy(abilities(player)),sameAbilities:same(abilities(saved),abilities(player)),eventBefore:getCurrentEventId(),stepBefore:saved.highSchoolStep,stepAfter:player.highSchoolStep,position:player.primaryPosition,schoolId:player.schoolInvitationState.selectedSchoolId,invitation:validateSchoolInvitationSet(player.schoolInvitationState),capability:validateHighSchoolEntryCapability(player)},gateA:null,stop:null,steps:[],decisions:[],physicalWitnesses:[],duplicates:[],ticks:0};
  globalThis.m=null;
  if(!proof.checkpoint.sameAbilities||saved.highSchoolStep!==player.highSchoolStep||getCurrentEventId()!=='high_school_showcase'||player.primaryPosition!=='游擊手'||!proof.checkpoint.invitation.ok||!proof.checkpoint.capability.ok){
    proof.stop={gate:'PRECONDITION',reason:'Original checkpoint/ability/event contract not preserved; no gameplay'};
  }else{
    pendingHighSchoolMatchSimulationSeed=inputSeed;
    m=prepareCurrentHighSchoolYearOneMatch();
    const initial=copy(m),selectionBefore=JSON.stringify(player),selected=prepareCurrentHighSchoolYearOneMatch();
    const side=getHighSchoolPlayerTeamSide(m),roster=m.rosters[side],op=m.gameExposureState.opportunitySnapshot,starts=op.plannedUsage.appearanceType==='start';
    const issues=[];
    if(selected!==m||player.highSchoolMatch!==m)issues.push('current-reference-mismatch');
    if(selectionBefore!==JSON.stringify(player))issues.push('current-selector-changed-existing-state');
    if(m.id!==op.matchId||m.eventId!==getCurrentEventId())issues.push('event-match-opportunity-mismatch');
    if(m.simulationSeed!==inputSeed||pendingHighSchoolMatchSimulationSeed!==0)issues.push('seed-source-mismatch');
    if(!same(abilities(saved),abilities(player)))issues.push('capability-mutated-before-gameplay');
    if(roster.lineup.some(a=>a.id==='player')!==starts||m.playerEntryCompleted!==starts||roster.bench.some(a=>a.id==='player')===starts)issues.push('initial-membership-mismatch');
    if(!roster.teamRoster.players.some(a=>(a.id||a.playerId)==='player'))issues.push('canonical-player-missing');
    if(getHighSchoolYearOneMatchEventId(m)!==getCurrentEventId())issues.push('public-event-route-mismatch');
    proof.initial=initial;proof.opportunity=copy(op);proof.gateA={issues,currentMatchId:m.id,actualSeed:m.simulationSeed,source:'prepareCurrentHighSchoolYearOneMatch() no identity arguments',eventId:getCurrentEventId(),sameReference:selected===m&&player.highSchoolMatch===m,selectorNoMutation:selectionBefore===JSON.stringify(player),pendingSeedAfter:pendingHighSchoolMatchSimulationSeed,sourceSeed:inputSeed,side};
    if(issues.length)proof.stop={gate:'A',reason:issues.join(',')};
  }
  function state(){const side=getHighSchoolPlayerTeamSide(m),r=m.rosters[side];return {matchId:m.id,currentMatchId:player.highSchoolMatch.id,sameCurrentReference:player.highSchoolMatch===m,eventId:getCurrentEventId(),matchEventId:getHighSchoolYearOneMatchEventId(m),inning:m.inning,half:m.half,outs:m.outs,scores:{...m.scores},runners:m.runners.slice(),phase:m.simulationPhase,domain:m.currentDomain,currentMomentId:m.currentMomentId,playerSide:side,offenseTeam:m.offenseTeam,defenseTeam:m.defenseTeam,currentBatter:m.currentBatter,actualBatter:getHighSchoolMatchLineupBatter(m,m.offenseTeam)?.id,status:m.playerLineupStatus,entryCompleted:m.playerEntryCompleted,slot:m.playerLineupSlot,playerInLineup:r.lineup.some(a=>a.id==='player'),playerOnBench:r.bench.some(a=>a.id==='player'),actualSS:TeamRosterFoundation.getCurrentDefender(r,'SS')?.id,activeDefense:TeamRosterFoundation.validateActiveDefense(m.rosters[m.defenseTeam]),integrity:getHighSchoolMatchStateIntegrityIssues(m),completedIds:m.completedMoments.map(x=>x.id),logCount:m.simulationLog.length,defenseOuterGate:shouldReachHighSchoolDefensiveMoment(m)};}
  function physical(){return {ground:m.groundBallInPlayState||null,line:m.lineDriveCatchState||null,fly:m.flyBallCatchState||null,ordinaryPA:m.ordinaryDefensivePlateAppearanceState||null,situation:m.defensiveSituation||null,classification:m.playerEventClassification,gate:m.decisionGate||null,density:m.matchDecisionDensityState||null,active:m.activeSituation||null,closed:m.lastClosedSituationSummary||null};}
  let lastPhysical='';
  try{
    while(m&&!proof.stop&&!m.completed&&proof.ticks<1400){
      proof.ticks++;const before=state(),row={tick:proof.ticks,before},logBefore=m.simulationLog.length,countBefore=m.completedMoments.length,entireBefore=JSON.stringify(m);
      if(!before.sameCurrentReference||before.matchId!==before.currentMatchId||before.eventId!==before.matchEventId){proof.stop={gate:'A',reason:'Identity/event changed before next action',tick:proof.ticks};break;}
      if(isHighSchoolMatchDecisionVisible(m)){
        row.mode='decision';const choices=getHighSchoolYearOneMatchMomentChoices(m),choice=choices.find(c=>c.matchDecision==='secure'||c.matchDecision==='zone')||choices[0];
        if(!choice){proof.stop={gate:'B',reason:'No legal choices',tick:proof.ticks};break;}
        const d={tick:proof.ticks,before:copy(before),choices:copy(choices),choice:copy(choice),physicalBefore:copy(physical()),sample:.72};
        if(!before.entryCompleted||!before.playerInLineup||before.actualSS!=='player'||before.domain==='offense'&&before.actualBatter!=='player'){proof.stop={gate:'B',reason:'Illegal player participation at decision',tick:proof.ticks};break;}
        d.returned=resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72);
        d.after=state();d.newEvents=copy(m.simulationLog.slice(logBefore));d.newCompleted=copy(m.completedMoments.slice(countBefore));d.physicalAfter=copy(physical());proof.decisions.push(d);
        if(!d.returned||player.highSchoolMatch!==m||d.after.currentMatchId!==before.matchId){proof.stop={gate:'B',reason:!d.returned?'Public resolver rejected legal decision':'Public resolver switched current Match',tick:proof.ticks,returned:d.returned,currentMatchId:player.highSchoolMatch.id};row.after=d.after;proof.steps.push(row);break;}
        const prior=JSON.stringify(player),duplicate=resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72),unchanged=prior===JSON.stringify(player);
        proof.duplicates.push({tick:proof.ticks,momentId:choice.matchMomentId,returned:duplicate,fullPlayerUnchanged:unchanged,sameCurrentReference:player.highSchoolMatch===m});
        if(duplicate!==false||!unchanged||player.highSchoolMatch!==m)proof.stop={gate:'B',reason:'Duplicate public decision changed state',tick:proof.ticks};
      }else{
        row.mode='playback';row.returned=advanceHighSchoolMatchPlaybackStep(m);
        if(row.returned===false&&!m.completed&&entireBefore===JSON.stringify(m))proof.stop={gate:'C',reason:'Playback cannot advance',tick:proof.ticks};
      }
      row.after=state();row.newEvents=copy(m.simulationLog.slice(logBefore));proof.steps.push(row);
      if(player.highSchoolMatch!==m)proof.stop={gate:'A',reason:'Playback changed current Match',tick:proof.ticks};
      const p=physical(),key=JSON.stringify(p);if(key!==lastPhysical&&(p.ground||p.line||p.fly||p.active)){proof.physicalWitnesses.push({tick:proof.ticks,before:copy(before),after:copy(row.after),physical:copy(p)});lastPhysical=key;}
    }
  }catch(error){proof.stop={gate:'RUNTIME',reason:error.message,stack:error.stack,tick:proof.ticks};}
  if(m&&!m.completed&&!proof.stop)proof.stop={gate:'C',reason:'safety1400 reached',tick:proof.ticks};
  proof.finalPlayer=copy(player);proof.finalMatch=m?copy(m):null;proof.finalState=m?state():null;
  const core=JSON.stringify(player);
  proof.repeats=m?.completed?[settleHighSchoolYearOneMatch(m,'zone'),settleHighSchoolYearOneMatch(m,'zone'),finishHighSchoolMatchBySimulation(m)]:[];
  proof.repeatUnchanged=core===JSON.stringify(player);proof.restored=normalizeSave(copy(player));
  proof.recordIntegrity=m?MatchGameRecord.assertIntegrity(m.gameRecord):null;
  proof.exposure=m?deriveHighSchoolMatchActualExposure(m):null;
  proof.readsUnchanged=core===JSON.stringify(player);
`;
function run(label){assert(['first','replay'].includes(label));C.runtimeWhitelist();const input=C.json(C.prefix+'fixture-input-evidence.json');const h=H.createContext();h.context.checkpointJSON=JSON.stringify(input.fixture);h.context.inputSeed=input.actualSeed;
 h.run(program);const f=h.json('proof');f.programHash=H.sha256(program);f.inputHash=H.sha256(input.fixture);f.inputSeed=input.actualSeed;f.sources={files:h.files,hashes:h.sourceHashes};
 if(f.finalMatch)f.hashes={initial:H.sha256(f.initial),record:H.sha256(f.finalMatch.gameRecord),log:H.sha256(f.finalMatch.simulationLog),decisions:H.sha256(f.decisions),finalPlayer:H.sha256(f.finalPlayer)};
 const factsPath=C.prefix+'candidate-'+label+'-facts-evidence.json';fs.writeFileSync(path.join(C.root,factsPath),JSON.stringify(f,null,2)+'\n',{flag:'wx'});
 let passed=0;function check(name,fn){fn();passed++;console.log('PASS '+name);}
 check('unchanged admitted checkpoint restored through Save owner',()=>{assert(f.checkpoint.sameAbilities);assert.equal(f.checkpoint.stepBefore,f.checkpoint.stepAfter);assert(f.checkpoint.invitation.ok&&f.checkpoint.capability.ok);assert.equal(f.checkpoint.eventBefore,'high_school_showcase');});
 check('Gate A current owner identity and initial admission parity',()=>{assert(f.gateA);assert.deepEqual(f.gateA.issues,[]);assert(f.gateA.sameReference&&f.gateA.selectorNoMutation);assert.equal(f.gateA.actualSeed,input.actualSeed);});
 check('first failure would stop immediately; candidate has no rejected decision',()=>{assert.equal(f.stop,null);for(const d of f.decisions){assert(d.returned);assert(d.after.sameCurrentReference);assert.equal(d.before.matchId,d.after.currentMatchId);}assert(f.decisions.length>0);});
 check('Gate B legal public choices complete exactly once',()=>{const m=f.finalMatch;for(const d of f.decisions){assert(d.choices.some(c=>c.matchDecision===d.choice.matchDecision&&c.matchMomentId===d.choice.matchMomentId));if(d.before.phase!=='offensive_agency_ready'){assert.equal(d.newCompleted.length,1);assert.equal(d.newCompleted[0].id,d.choice.matchMomentId);assert.equal(d.newEvents.filter(e=>e.type==='meaningfulMomentResolved').length,1);}}for(const d of f.duplicates){assert.equal(d.returned,false);assert(d.fullPlayerUnchanged&&d.sameCurrentReference);}assert.equal(new Set(m.completedMoments.map(x=>x.id)).size,m.completedMoments.length);});
 check('playback state and actual current authority remain valid',()=>{for(const row of f.steps)for(const s of [row.before,row.after]){assert(s.sameCurrentReference);assert.equal(s.matchId,s.currentMatchId);assert.equal(s.eventId,s.matchEventId);assert.deepEqual(s.integrity,[]);assert.equal(s.activeDefense.ok,true);}});
 check('natural complete Match and final Record',()=>{const m=f.finalMatch;assert(m.completed&&m.settled);assert(f.ticks<1400);assert.equal(m.gameRecord.status,'final');assert.equal(f.recordIntegrity,true);for(const team of ['home','away']){assert.equal(m.gameRecord.totals[team].runs,m.scores[team]);assert.equal(m.gameRecord.result.finalScore[team],m.scores[team]);}assert.equal(m.gameRecord.eventRefs.length,m.simulationLog.length);assert.equal(new Set(m.gameRecord.eventRefs.map(e=>e.eventId)).size,m.simulationLog.length);assert.deepEqual(m.gameRecord.eventRefs.map(e=>[e.sequence,e.type,e.inning,e.half]),m.simulationLog.map(e=>[e.sequence,e.type,e.inning,e.half]));});
 check('created defense count equals completions without nonzero inference',()=>{assert.equal(f.finalMatch.matchDecisionDensityState.defensiveMeaningfulDecisionCount,f.finalMatch.completedMoments.filter(m=>m.domain==='defense').length);});
 check('resolution snapshots retained after finalization',()=>{for(const d of f.decisions)for(const x of d.newCompleted){assert.deepEqual(f.finalMatch.completedMoments.find(m=>m.id===x.id),x);assert.equal(x.inning,d.after.inning);assert.equal(x.half,d.after.half);}});
 check('Save memory retains Match and Career; public final duplicates no-op',()=>{for(const key of ['id','completed','settled','scores','gameRecord','simulationLog','completedMoments','gameExposureState','matchExperience','rosters'])assert.deepEqual(f.restored.highSchoolMatch[key],f.finalMatch[key]);assert.deepEqual(f.restored.highSchoolCompetitionEvaluation,f.finalPlayer.highSchoolCompetitionEvaluation);assert.deepEqual(f.repeats,[false,false,false]);assert(f.repeatUnchanged&&f.readsUnchanged);});
 check('actual exposure and Career identity belong to this Match',()=>{const m=f.finalMatch,e=f.finalPlayer.highSchoolCompetitionEvaluation;assert.equal(f.exposure.matchId,m.id);assert.equal(f.exposure.plateAppearances,m.simulationLog.filter(x=>x.type==='plateAppearance'&&x.batterId==='player').length);assert.equal(e.sampleCount,1);assert.deepEqual(e.appliedMatchIdentities,[m.id]);assert.equal(f.finalPlayer.highSchoolYearOneMatchHistory.length,1);assert.equal(f.finalPlayer.highSchoolYearOneMatchHistory[0].matchId,m.id);assert(m.matchExperience.settled);});
 if(label==='replay')check('identical legal entry replay has identical Record Log decisions and player',()=>{const first=C.json(C.prefix+'candidate-first-facts-evidence.json');assert.equal(first.programHash,f.programHash);assert.equal(first.inputHash,f.inputHash);assert.deepEqual(first.hashes,f.hashes);assert.deepEqual(first.decisions,f.decisions);});
 const m=f.finalMatch,summary={label,diagnostic:true,passed,gateA:'CONFIRMED',gateB:'CONFIRMED',matchId:m.id,eventId:f.gateA.eventId,actualSeed:m.simulationSeed,seedSource:'same prior actual seed through existing pending test hook; owner consumes it',plannedUsage:f.opportunity.plannedUsage,score:f.opportunity.debug.opportunityScore,entry:m.simulationLog.find(e=>e.type==='playerEntry')||null,ticks:f.ticks,finalScore:m.scores,completed:m.completed,defenseCreated:m.matchDecisionDensityState.defensiveMeaningfulDecisionCount,defenseCompleted:m.completedMoments.filter(x=>x.domain==='defense').length,physicalWitnesses:f.physicalWitnesses.length,hashes:f.hashes,facts:factsPath};
 console.log('SS_IDENTITY_CONTRACT_SUMMARY='+JSON.stringify(summary));return summary;
}
module.exports={program,run};if(require.main===module)run('first');
