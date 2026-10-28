"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./ss-natural-defensive-moment-validation-v0.1-capture.cjs');
const H=require('../tests/helpers/canonical-match-contract-context.cjs');
const matchId='hs-y1-ss-natural-defense-validation-v0.1';
function getProgram(){
 const src=fs.readFileSync(path.join(C.root,'tests/helpers/canonical-match-contract-context.cjs'),'utf8');
 const begin=src.indexOf('  h.run(`')+'  h.run(`'.length,end=src.indexOf('    globalThis.contractSteps = []',begin);assert(begin>0&&end>begin);
 const originalPrefix=src.slice(begin,end);
 assert.equal(originalPrefix.split('    pendingHighSchoolMatchSimulationSeed = contractSeed;').length,2);
 assert.equal(originalPrefix.split('    globalThis.m = prepareHighSchoolYearOneMatch();').length,2);
 const prefix=originalPrefix.replace('    pendingHighSchoolMatchSimulationSeed = contractSeed;','    // No pending seed: supplied Opportunity identity owns the simulation seed.')
 .replace('    globalThis.m = prepareHighSchoolYearOneMatch();',`    globalThis.proofOpportunity = createHighSchoolPlayingTimeOpportunity({matchId:proofMatchId,actualRole:player.highSchoolRoleCode,requestedPosition:player.primaryPosition,opportunityIndex:1,opportunityPhase:'autumn-exhibition',highSchoolYear:1});
    globalThis.proofExpectedSeed = createHighSchoolMatchSimulationSeedFromIdentity(proofOpportunity.decisionId || proofOpportunity.matchId);
    globalThis.m = prepareHighSchoolYearOneMatch({matchId:proofMatchId,opportunityDecision:proofOpportunity});`);
 const loop=`
    function proofState(){const s=contractState();return {...s,defenseTeam:m.defenseTeam,
      target:m.simulationPhase==='full_match_flow'?'firstOffense':m.simulationPhase==='moment_1_resolved'?'defense':m.simulationPhase==='moment_2_resolved'?'finalOffense':'finish',
      activeDefense:TeamRosterFoundation.validateActiveDefense(m.rosters[m.defenseTeam]),
      defenseOuterGate:shouldReachHighSchoolDefensiveMoment(m)};}
    function proofPhysical(){return {ground:m.groundBallInPlayState||null,line:m.lineDriveCatchState||null,fly:m.flyBallCatchState||null,
      ordinaryPA:m.ordinaryDefensivePlateAppearanceState||null,situation:m.defensiveSituation||null,classification:m.playerEventClassification,
      gate:m.decisionGate||null,density:m.matchDecisionDensityState||null,active:m.activeSituation||null,closed:m.lastClosedSituationSummary||null};}
    globalThis.proofSteps=[];globalThis.proofDecisions=[];globalThis.proofPhysicalWitnesses=[];globalThis.proofDuplicates=[];
    globalThis.proofSafety=0;globalThis.proofError=null;let lastPhysical='';
    try {
      while(!m.completed&&proofSafety<1400){
        proofSafety++;const before=proofState(),logBefore=m.simulationLog.length,countBefore=m.completedMoments.length;
        const visible=isHighSchoolMatchDecisionVisible(m),row={tick:proofSafety,before,mode:visible?'decision':'playback'};
        if(visible){
          const legal=getHighSchoolYearOneMatchMomentChoices(m),choice=legal.find(c=>c.matchDecision==='secure'||c.matchDecision==='zone')||legal[0];
          if(!choice)throw Error('No legal choice under original policy');
          const d={tick:proofSafety,before:contractCopy(before),choices:contractCopy(legal),choice:contractCopy(choice),physicalBefore:contractCopy(proofPhysical()),sample:.72};
          d.returned=resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72);
          d.after=proofState();d.newEvents=contractCopy(m.simulationLog.slice(logBefore));d.newCompleted=contractCopy(m.completedMoments.slice(countBefore));d.physicalAfter=contractCopy(proofPhysical());proofDecisions.push(d);
          const prior=JSON.stringify(player),duplicate=resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72);
          proofDuplicates.push({momentId:choice.matchMomentId,returned:duplicate,fullPlayerUnchanged:prior===JSON.stringify(player)});
        }else row.returned=advanceHighSchoolMatchPlaybackStep(m);
        row.after=proofState();row.newEvents=contractCopy(m.simulationLog.slice(logBefore));proofSteps.push(row);
        const physical=proofPhysical(),key=JSON.stringify(physical);
        if(key!==lastPhysical&&(physical.ground||physical.line||physical.fly||physical.active)){
          proofPhysicalWitnesses.push({tick:proofSafety,before:contractCopy(before),after:contractCopy(row.after),physical:contractCopy(physical)});lastPhysical=key;
        }
      }
    }catch(error){proofError={message:error.message,stack:error.stack};}
    globalThis.proofFinal=contractCopy(player);globalThis.proofFinalState=proofState();
    globalThis.proofReadHash=JSON.stringify(player);
    globalThis.proofRepeats=m.completed?[settleHighSchoolYearOneMatch(m,'zone'),settleHighSchoolYearOneMatch(m,'zone'),finishHighSchoolMatchBySimulation(m)]:[];
    globalThis.proofRepeatUnchanged=proofReadHash===JSON.stringify(player);
    globalThis.proofRestored=normalizeSave(contractCopy(player));
    globalThis.proofRecordIntegrity=MatchGameRecord.assertIntegrity(m.gameRecord);
    globalThis.proofExposure=deriveHighSchoolMatchActualExposure(m);
    globalThis.proofReadsUnchanged=proofReadHash===JSON.stringify(player);
  `;
 return {program:prefix+loop,originalPrefix,prefixChanges:['Remove pending seed input','Produce immutable Opportunity via formal API and supply same identity to prepare'],programSha256:H.sha256(prefix+loop),originalPrefixSha256:H.sha256(originalPrefix)};
}
function run(label){
 assert(['first','replay'].includes(label));const spec=getProgram(),h=H.createContext();h.context.proofMatchId=matchId;h.run(spec.program);
 const f=h.json(`({matchId:proofMatchId,opportunity:proofOpportunity,expectedSeed:proofExpectedSeed,entry:contractEntry,fixture:contractFixture,initial:contractInitial,
  steps:proofSteps,decisions:proofDecisions,physicalWitnesses:proofPhysicalWitnesses,duplicates:proofDuplicates,safety:proofSafety,error:proofError,
  finalPlayer:proofFinal,finalMatch:m,finalState:proofFinalState,restored:proofRestored,recordIntegrity:proofRecordIntegrity,exposure:proofExposure,
  repeats:proofRepeats,repeatUnchanged:proofRepeatUnchanged,readsUnchanged:proofReadsUnchanged})`);
 f.programSha256=spec.programSha256;f.sources={files:h.files,hashes:h.sourceHashes};
 f.hashes={fixture:H.sha256(f.fixture),initial:H.sha256(f.initial),record:H.sha256(f.finalMatch.gameRecord),log:H.sha256(f.finalMatch.simulationLog),decisions:H.sha256(f.decisions)};
 const factsPath=C.prefix+'candidate-'+label+'-facts-evidence.json';
 fs.writeFileSync(path.join(C.root,factsPath),JSON.stringify(f,null,2)+'\n',{flag:'wx'});
 let passed=0;function check(name,fn){fn();passed++;console.log('PASS '+name);}
 const m=f.finalMatch,side=f.entry.initialState.playerSide,initial=f.initial,log=m.simulationLog;
 check('legal entry and original abilities',()=>{assert(f.entry.accepted&&f.entry.invitationValidation.ok&&f.entry.capabilityValidation.ok&&f.entry.abilitiesUnchanged);assert.equal(f.entry.age,16);assert.equal(f.entry.primaryPosition,'游擊手');assert.equal(f.entry.invitationIndex,0);});
 check('supplied formal Opportunity and seed authority',()=>{assert.equal(f.opportunity.exposureSource,'opportunity-resolver');assert.equal(f.opportunity.matchId,matchId);assert.equal(m.simulationSeed,f.expectedSeed);assert.equal(f.entry.pendingSeedAfterPrepare,0);assert.deepEqual(initial.gameExposureState.opportunitySnapshot,f.opportunity);assert.equal(f.opportunity.assignedPosition,'游擊手');});
 check('Opportunity and actual initial membership agree',()=>{const starts=f.opportunity.plannedUsage.appearanceType==='start',roster=initial.rosters[side];assert.equal(roster.lineup.some(x=>x.id==='player'),starts);assert.equal(roster.bench.some(x=>x.id==='player'),!starts);assert.equal(initial.playerEntryCompleted,starts);assert.equal(initial.playerLineupStatus,starts?'starter':'bench');assert(roster.teamRoster.players.some(x=>(x.id||x.playerId)==='player'));});
 check('every observed transition has lawful state and active defense',()=>{assert.equal(f.error,null);for(const row of f.steps)for(const s of [row.before,row.after]){assert.deepEqual(s.integrity,[]);assert.equal(s.activeDefense.ok,true);}});
 check('every player choice follows actual legal admission',()=>{for(const d of f.decisions){assert(d.before.entryCompleted&&d.before.playerInLineup);assert.equal(d.before.actualSS,'player');assert(d.choices.some(c=>c.matchDecision===d.choice.matchDecision&&c.matchMomentId===d.choice.matchMomentId));if(d.before.domain==='offense'){assert.equal(d.before.actualBatter,'player');assert.equal(d.before.offenseTeam,side);}else{assert.equal(d.before.defenseTeam,side);assert(d.before.outs<3);}}});
 check('established decisions complete once',()=>{for(const d of f.decisions){assert(d.returned);assert.equal(d.newCompleted.length,1);assert.equal(d.newCompleted[0].id,d.choice.matchMomentId);assert.equal(d.newEvents.filter(x=>x.type==='meaningfulMomentResolved').length,1);}assert.equal(m.completedMoments.length,f.decisions.length);assert.equal(new Set(m.completedMoments.map(x=>x.id)).size,m.completedMoments.length);});
 check('natural closure within safety1400',()=>{assert(m.completed&&m.settled);assert(f.safety<1400);assert.equal(m.half,'終');assert.equal(m.outs,3);assert.equal(log.filter(x=>x.type==='gameEnd').length,1);});
 check('defense conservation without nonzero-coverage inference',()=>{assert.equal(m.completedMoments.filter(x=>x.domain==='defense').length,m.matchDecisionDensityState.defensiveMeaningfulDecisionCount);});
 check('final Record score totals and event references',()=>{const r=m.gameRecord;assert.equal(r.status,'final');assert.equal(f.recordIntegrity,true);for(const team of ['home','away']){assert.equal(r.totals[team].runs,m.scores[team]);assert.equal(r.result.finalScore[team],m.scores[team]);}assert.equal(r.eventRefs.length,log.length);assert.equal(new Set(r.eventRefs.map(x=>x.eventId)).size,log.length);assert.deepEqual(r.eventRefs.map(e=>[e.sequence,e.type,e.inning,e.half]),log.map(e=>[e.sequence,e.type,e.inning,e.half]));});
 check('duplicate public operations have no effect',()=>{for(const d of f.duplicates){assert.equal(d.returned,false);assert(d.fullPlayerUnchanged);}assert.deepEqual(f.repeats,[false,false,false]);assert(f.repeatUnchanged&&f.readsUnchanged);});
 check('Save memory retains event snapshots and final facts',()=>{for(const key of ['completedMoments','gameRecord','simulationLog','gameExposureState','matchExperience','rosters'])assert.deepEqual(f.restored.highSchoolMatch[key],m[key]);assert.deepEqual(f.restored.highSchoolCompetitionEvaluation,f.finalPlayer.highSchoolCompetitionEvaluation);});
 check('Career exposure and match identity agree',()=>{const a=f.exposure,e=f.finalPlayer.highSchoolCompetitionEvaluation;assert.equal(a.plateAppearances,log.filter(x=>x.type==='plateAppearance'&&x.batterId==='player').length);assert.equal(a.started,initial.playerLineupStatus==='starter');assert.equal(e.sampleCount,1);assert.deepEqual(e.appliedMatchIdentities,[m.id]);assert.equal(f.finalPlayer.highSchoolYearOneMatchHistory.length,1);assert(m.matchExperience.settled);});
 check('resolution snapshots remain separate from final summary',()=>{for(const d of f.decisions){const moment=m.completedMoments.find(x=>x.id===d.choice.matchMomentId);assert.deepEqual(moment,d.newCompleted[0]);assert.equal(moment.inning,d.after.inning);assert.equal(moment.half,d.after.half);}});
 const defense=f.decisions.filter(d=>d.before.domain==='defense');
 if(defense.length)check('nonzero defense uses physical ownership and distinct legal routes',()=>{for(const d of defense){const g=d.physicalBefore.ground;assert(g&&g.supported);assert.equal(g.defensiveAccess.defenderId,'player');assert.equal(g.defensiveAccess.playerPosition,'游擊手');assert.equal(d.physicalBefore.classification,'playerMeaningfulDecision');assert(new Set(d.choices.map(c=>c.routeId||c.matchDecision)).size>=2);}});
 if(label==='replay')check('identical candidate replay record log and decision sequence',()=>{const first=C.json(C.prefix+'candidate-first-facts-evidence.json');assert.equal(first.programSha256,f.programSha256);assert.deepEqual(first.hashes,f.hashes);assert.deepEqual(first.decisions,f.decisions);});
 const summary={label,diagnostic:true,passed,matchId,seed:m.simulationSeed,plannedUsage:f.opportunity.plannedUsage,score:f.opportunity.debug.opportunityScore,status:m.playerLineupStatus,entry:log.find(x=>x.type==='playerEntry')||null,ticks:f.safety,finalScore:m.scores,createdDefense:m.matchDecisionDensityState.defensiveMeaningfulDecisionCount,completedDefense:defense.length,physicalWitnesses:f.physicalWitnesses.length,naturalEndToEnd:defense.length?'REQUIRES FACT REVIEW':'UNVERIFIED',hashes:f.hashes,facts:factsPath};
 console.log('SS_NATURAL_DEFENSE_SUMMARY='+JSON.stringify(summary));return summary;
}
module.exports={matchId,getProgram,run};
if(require.main===module)run('first');
