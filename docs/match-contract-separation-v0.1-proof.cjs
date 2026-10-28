"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./match-contract-separation-v0.1-capture.cjs'),H=require('./critical-regression-repair-b1-canonical-match-fixture-contract-harness.cjs');
const fixtureFile='docs/critical-regression-repair-b1-canonical-match-fixture-contract-normal-entry-proof.cjs';
const originalEvidence=C.json('docs/test-infrastructure-sprint-0.1-repair-b1-canonical-fixture-normal-entry-proof-evidence.json');
assert.equal(C.fileHash(fixtureFile),originalEvidence.relevantSourceHashesAfter[fixtureFile]);
const entryProgram=fs.readFileSync(path.join(C.root,fixtureFile),'utf8').match(/h\.run\(`([\s\S]*?)`\);/)[1];
const original=JSON.parse(originalEvidence.stdout.split(/\r?\n/).find(l=>l.startsWith('B1_NORMAL_ENTRY_PROOF=')).slice('B1_NORMAL_ENTRY_PROOF='.length));
const h=H.makeContext();h.run(entryProgram);
assert.equal(h.run('player.age'),16);assert.equal(h.run('validateSchoolInvitationSet(player.schoolInvitationState).ok'),true);
assert.equal(H.hash(h.json('b1BeforePreparation')),original.observed.fixtureSha256);assert.equal(H.hash(h.json('b1Initial')),original.observed.initialMatchSha256);
h.run(`
globalThis.sepSteps=[];globalThis.sepDecisions=[];globalThis.sepDuplicates=[];globalThis.sepSafety=0;globalThis.sepPreCompletion=null;
function sepCopy(value){return JSON.parse(JSON.stringify(value));}
function sepCore(){return JSON.stringify(player);}
function sepState(){const side=getHighSchoolPlayerTeamSide(m),r=m.rosters[side],batter=getHighSchoolMatchLineupBatter(m,m.offenseTeam);
 return {inning:m.inning,half:m.half,outs:m.outs,scores:{...m.scores},runners:m.runners.slice(),phase:m.simulationPhase,domain:m.currentDomain,
  currentMomentId:m.currentMomentId,momentIndex:m.momentIndex,status:m.playerLineupStatus,entryCompleted:m.playerEntryCompleted,active:isHighSchoolMatchPlayerActive(m),
  role:m.role,playerSide:side,offenseTeam:m.offenseTeam,currentBatter:m.currentBatter,actualBatter:batter?.id||'',
  playerInLineup:r.lineup.some(a=>a.id==='player'),playerOnBench:r.bench.some(a=>a.id==='player'),actualSS:TeamRosterFoundation.getCurrentDefender(r,'SS')?.id,
  firstGate:shouldCreateHighSchoolFirstOffensiveMoment(m),finalGate:shouldReachHighSchoolFinalOffensiveMoment(m),finalTargetInning:Math.max(5,(Number(m.playerEntryWindowInning)||1)+1),
  playbackTarget:m.simulationPhase==='full_match_flow'?'firstOffense':m.simulationPhase==='moment_1_resolved'?'defense':m.simulationPhase==='moment_2_resolved'?'finalOffense':'finish',
  logCount:m.simulationLog.length,completedMoments:sepCopy(m.completedMoments),integrity:getHighSchoolMatchStateIntegrityIssues(m)};
}
while(!m.completed&&sepSafety++<1400){
 const before=sepState(),logBefore=m.simulationLog.length,decisionVisible=isHighSchoolMatchDecisionVisible(m);
 const row={tick:sepSafety,mode:decisionVisible?'decision':'playback',before};
 if(decisionVisible){
  const choices=getHighSchoolYearOneMatchMomentChoices(m),choice=choices.find(item=>item.matchDecision==='secure'||item.matchDecision==='zone')||choices[0];
  if(!choice)throw Error('Original policy has no legal choice');
  const d={tick:sepSafety,before,legalChoices:sepCopy(choices),choice:sepCopy(choice),pendingOpportunity:sepCopy(m.pendingOffensiveOpportunity),sample:0.72};
  d.returned=resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72);
  d.after=sepState();d.newEvents=sepCopy(m.simulationLog.slice(logBefore));d.completedMoment=sepCopy(m.completedMoments.at(-1));sepDecisions.push(d);
  const beforeDuplicate=sepCore(),duplicate=resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72);
  sepDuplicates.push({decision:choice.matchDecision,expectedMomentId:choice.matchMomentId,returned:duplicate,fullPlayerUnchanged:beforeDuplicate===sepCore()});
 }else row.returned=advanceHighSchoolMatchPlaybackStep(m);
 row.after=sepState();if(m.completed)sepPreCompletion=before;sepSteps.push(row);
}
globalThis.sepFinalPlayer=sepCopy(player);globalThis.sepAfterRunCore=sepCore();
globalThis.sepRepeat=[settleHighSchoolYearOneMatch(m,'zone'),settleHighSchoolYearOneMatch(m,'zone'),finishHighSchoolMatchBySimulation(m)];
globalThis.sepRepeatUnchanged=sepAfterRunCore===sepCore();
globalThis.sepSaved=normalizeSave(sepCopy(player));
globalThis.sepSaveIntegrity=MatchGameRecord.assertIntegrity(sepSaved.highSchoolMatch.gameRecord);
globalThis.sepSnapshotConsumers={callHomePresentation:getHighSchoolCallHomePresentation(),activeExperienceEvidence:sepCopy((m.matchExperience?.evidence||[]).filter(e=>e.evidenceType==='active')),evaluation:sepCopy(player.highSchoolCompetitionEvaluation),history:sepCopy(player.highSchoolYearOneMatchHistory)};
globalThis.sepSeedBoundary={noSupplied:true,actualSimulationSeed:m.simulationSeed,pendingAfterPreparation:pendingHighSchoolMatchSimulationSeed,
 suppliedOpportunityIdentity:m.gameExposureState.opportunitySnapshot.decisionId,sameOpportunityDerivedSeed:createHighSchoolMatchSimulationSeedFromIdentity(m.gameExposureState.opportunitySnapshot.decisionId||m.gameExposureState.opportunitySnapshot.matchId),
 identityUnchanged:JSON.stringify(m.gameExposureState.opportunitySnapshot)===JSON.stringify(b1Initial.gameExposureState.opportunitySnapshot),matchNotRepreparedWithSuppliedOpportunity:true};
globalThis.sepReadsUnchanged=sepAfterRunCore===sepCore();
`);
const f=h.json(`({fixture:b1BeforePreparation,initialMatch:b1Initial,steps:sepSteps,decisions:sepDecisions,duplicates:sepDuplicates,safety:sepSafety,
 beforeCompletion:sepPreCompletion,finalMatch:m,finalPlayer:sepFinalPlayer,repeatedSettlement:{returns:sepRepeat,fullPlayerUnchanged:sepRepeatUnchanged},
 restored:sepSaved,saveRecordIntegrity:sepSaveIntegrity,snapshotConsumers:sepSnapshotConsumers,seedBoundary:sepSeedBoundary,readersDidNotMutatePlayer:sepReadsUnchanged,ownerCalls:b1OwnerCalls})`);
const m=f.finalMatch,initial=f.initialMatch,entry=m.simulationLog.find(e=>e.type==='playerEntry'),reached=m.simulationLog.filter(e=>e.type==='meaningfulMomentReached'),resolved=m.simulationLog.filter(e=>e.type==='meaningfulMomentResolved');
assert.equal(m.simulationSeed,88221);assert.equal(m.completed,true);assert.equal(m.settled,true);assert(f.safety<1400);
assert.equal(initial.gameExposureState.plannedUsage.appearanceType,'lateGameAppearance');assert.equal(initial.gameExposureState.plannedUsage.entryInning,6);
assert.equal(initial.playerLineupStatus,'bench');assert.equal(initial.playerEntryCompleted,false);assert.equal(initial.playerLineupSlot,-1);
assert.equal(initial.rosters.home.lineup.some(a=>a.id==='player'),false);assert.equal(initial.rosters.home.bench.some(a=>a.id==='player'),true);
assert.equal(entry.inning,6);assert.equal(entry.lineupSlot,7);assert.equal(m.playerLineupStatus,'substitute');assert.equal(m.rosters.home.lineup[7].id,'player');
assert(f.steps.flatMap(s=>[s.before,s.after]).every(s=>s.integrity.length===0));
assert(f.steps.filter(s=>!s.before.entryCompleted).every(s=>s.before.completedMoments.length===0&&!s.before.playerInLineup&&!s.before.firstGate&&!s.before.finalGate));
assert.equal(f.decisions.length,1);assert.equal(reached.length,1);assert.equal(resolved.length,1);assert(entry.sequence<reached[0].sequence);
for(const d of f.decisions){assert(d.before.entryCompleted&&d.before.playerInLineup&&d.before.actualSS==='player');assert.equal(d.before.actualBatter,'player');assert.equal(d.before.currentBatter,'player');assert(d.legalChoices.some(c=>c.matchDecision===d.choice.matchDecision&&c.matchMomentId===d.choice.matchMomentId));assert.equal(d.before.phase,'moment_1_ready');assert.equal(d.pendingOpportunity.kind,'scripted');assert.equal(d.after.completedMoments.length,d.before.completedMoments.length+1);assert.equal(d.newEvents.filter(e=>e.type==='plateAppearance'&&e.batterId==='player').length,1);assert.equal(d.newEvents.filter(e=>e.type==='meaningfulMomentResolved').length,1);assert.equal(d.after.phase,'moment_1_resolved');assert.equal(d.completedMoment.id,'hs_y1_match_moment_1');assert(d.returned);}
assert(f.duplicates.every(d=>d.returned===false&&d.fullPlayerUnchanged));assert(f.repeatedSettlement.returns.every(x=>x===false));assert(f.repeatedSettlement.fullPlayerUnchanged);
assert.equal(m.gameRecord.status,'final');assert.equal(h.run('MatchGameRecord.assertIntegrity(m.gameRecord)'),true);
assert.equal(m.gameRecord.totals.home.runs,m.scores.home);assert.equal(m.gameRecord.totals.away.runs,m.scores.away);
assert.equal(m.gameRecord.eventRefs.length,m.simulationLog.length);assert.equal(new Set(m.gameRecord.eventRefs.map(e=>e.eventId)).size,m.gameRecord.eventRefs.length);
assert.equal(m.simulationLog.filter(e=>e.type==='gameEnd').length,1);assert.equal(m.completedMoments.filter(e=>e.domain==='defense').length,m.matchDecisionDensityState.defensiveMeaningfulDecisionCount);
assert.deepEqual(f.restored.highSchoolMatch.gameRecord,m.gameRecord);assert.deepEqual(f.restored.highSchoolMatch.completedMoments,m.completedMoments);assert.equal(f.saveRecordIntegrity,true);
for(const key of ['id','completed','settled','simulationSeed','scores','inning','half','outs','playerLineupStatus','playerEntryCompleted'])assert.deepEqual(f.restored.highSchoolMatch[key],m[key],key);
assert.deepEqual(f.restored.highSchoolCompetitionEvaluation,f.finalPlayer.highSchoolCompetitionEvaluation);assert.deepEqual(f.restored.highSchoolMatch.matchExperience,m.matchExperience);
assert.equal(f.finalPlayer.highSchoolCompetitionEvaluation.sampleCount,1);assert.deepEqual(f.finalPlayer.highSchoolCompetitionEvaluation.appliedMatchIdentities,[m.id]);assert.equal(m.matchExperience.settled,true);assert.equal(f.finalPlayer.highSchoolYearOneMatchHistory.length,1);
assert(f.readersDidNotMutatePlayer);assert(f.seedBoundary.identityUnchanged);assert.equal(f.seedBoundary.pendingAfterPreparation,0);
const parity={fixture:H.hash(f.fixture)===original.observed.fixtureSha256,initialMatch:H.hash(initial)===original.observed.initialMatchSha256,record:H.hash(m.gameRecord)===original.observed.recordSha256,log:H.hash(m.simulationLog)===original.observed.logSha256};assert(Object.values(parity).every(Boolean));
const ids=m.completedMoments.map(e=>e.id),synthetic={Moment1:{status:'CONFIRMED bounded isolated source-flow proof',created:reached[0],decisionBefore:f.decisions[0].before,completedBeforeSettlement:f.decisions[0].completedMoment},Moment3:{status:'UNVERIFIED',reason:'No fixed Moment3 reached in the single predeclared legal substitution fixture; no phase/lineup/Moment mutation or direct producer call used.',finalGateTrueTicks:f.steps.filter(s=>s.before.finalGate).length,finalOffensePlaybackTicks:f.steps.filter(s=>s.mode==='playback'&&s.before.playbackTarget==='finalOffense').length,phaseSequence:[...new Set(f.steps.flatMap(s=>[s.before.phase,s.after.phase]))]}};
const snapshots={decisionBefore:f.decisions[0].before,resultAppliedMoment:f.decisions[0].completedMoment,beforeFinalSettlement:f.beforeCompletion.completedMoments.at(-1),afterFinalSettlement:m.completedMoments.at(-1)};
assert.equal(snapshots.resultAppliedMoment.half,'下');assert.equal(snapshots.afterFinalSettlement.half,'終');assert.equal(snapshots.afterFinalSettlement.outs,3);
const summary={diagnosticOnly:true,newChildExecutions:1,newFullMatchExecutions:1,seed:88221,safety:f.safety,syntheticMoment1:'CONFIRMED',syntheticMoment3:'UNVERIFIED',canonicalSubstitution:'CONFIRMED bounded',original36Boolean:m.completed&&ids.includes('hs_y1_match_moment_1')&&ids.includes('hs_y1_match_moment_3')&&m.completedMoments.filter(x=>x.domain==='defense').length===m.matchDecisionDensityState.defensiveMeaningfulDecisionCount&&f.safety<1400,seed88222:'NOT RUN / UNVERIFIED',original38:'NOT RUN / UNVERIFIED',parity,recordSha256:H.hash(m.gameRecord),recordRefs:m.gameRecord.eventRefs.length};
console.log('MATCH_CONTRACT_SEPARATION_PROOF='+JSON.stringify({policy:{fixtureFile,fixtureSha256:C.fileHash(fixtureFile),entryProgram,schoolIndex:0,seed:88221,sample:0.72,safety:1400,decisionPolicy:'secure/zone/first legal',fakeCompletedMoments:false,manualMatchStateOrPhaseOrLineupEdits:false,newObserverWrappers:false,existingB1OwnerWrappers:true,observerFreeNeutrality:'UNVERIFIED'},synthetic,snapshots,summary,facts:f}));
console.log('MATCH_CONTRACT_SEPARATION_SUMMARY='+JSON.stringify(summary));
