"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./match-admission-moment-eligibility-contract-v0.1-capture.cjs');
const H=require('./critical-regression-repair-b1-canonical-match-fixture-contract-harness.cjs');
const fixtureFile=C.B1FixtureFile||'docs/critical-regression-repair-b1-canonical-match-fixture-contract-normal-entry-proof.cjs';
const prior=C.json('docs/test-infrastructure-sprint-0.1-repair-b1-canonical-fixture-normal-entry-proof-evidence.json');
assert.equal(C.fileHash(fixtureFile),prior.relevantSourceHashesAfter[fixtureFile]);
const fixtureSource=fs.readFileSync(path.join(C.root,fixtureFile),'utf8'),entryProgram=fixtureSource.match(/h\.run\(`([\s\S]*?)`\);/)[1];
const priorFacts=JSON.parse(prior.stdout.split('\n').find(l=>l.startsWith('B1_NORMAL_ENTRY_PROOF=')).slice('B1_NORMAL_ENTRY_PROOF='.length));
const h=H.makeContext();h.run(entryProgram);
assert.equal(h.run('player.age'),16);assert.equal(h.run('validateSchoolInvitationSet(player.schoolInvitationState).ok'),true);
assert.equal(h.run('m.simulationSeed'),88221);assert.equal(h.run('m.gameExposureState.plannedUsage.appearanceType'),'lateGameAppearance');
assert.equal(H.hash(h.json('b1Initial')),priorFacts.observed.initialMatchSha256);
h.run(`globalThis.auditSteps=[];globalThis.auditChoices=[];globalThis.auditDuplicates=[];globalThis.auditSafety=0;
function auditCore(){return JSON.stringify({match:m,player});}
while(!m.completed&&auditSafety++<1400){
 const side=getHighSchoolPlayerTeamSide(m),r=m.rosters[side],beforeMoments=m.completedMoments.length;
 const step={tick:auditSafety,inning:m.inning,half:m.half,outs:m.outs,phase:m.simulationPhase,domain:m.currentDomain,
  role:m.role,status:m.playerLineupStatus,entry:m.playerEntryCompleted,active:isHighSchoolMatchPlayerActive(m),
  offenseTeam:m.offenseTeam,currentBatter:m.currentBatter,actualBatter:getHighSchoolMatchLineupBatter(m,m.offenseTeam)?.id,
  playerInLineup:r.lineup.some(a=>a.id==='player'),ssDefender:TeamRosterFoundation.getCurrentDefender(r,'SS')?.id,
  logCount:m.simulationLog.length,momentCount:m.completedMoments.length,integrity:getHighSchoolMatchStateIntegrityIssues(m)};
 auditSteps.push(step);
 if(isHighSchoolMatchDecisionVisible(m)){
  const choices=getHighSchoolYearOneMatchMomentChoices(m),choice=choices.find(item=>item.matchDecision==='secure'||item.matchDecision==='zone')||choices[0];
  if(!choice)throw Error('No legal original-policy choice');
  const row={...step,choice:JSON.parse(JSON.stringify(choice)),legalChoices:choices.map(c=>({matchDecision:c.matchDecision,matchMomentId:c.matchMomentId,routeId:c.routeId})),sample:0.72};
  row.returned=resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72);auditChoices.push(row);
  if(m.completedMoments.length>beforeMoments){const before=auditCore(),logBefore=m.simulationLog.length,momentsBefore=m.completedMoments.length;
   const result=resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72);
   auditDuplicates.push({decision:choice.matchDecision,expectedMomentId:choice.matchMomentId,result,fullPlayerAndMatchUnchanged:before===auditCore(),logBefore,logAfter:m.simulationLog.length,momentsBefore,momentsAfter:m.completedMoments.length});}
 }else advanceHighSchoolMatchPlaybackStep(m);
}
globalThis.auditFinalPlayer=JSON.parse(JSON.stringify(player));
globalThis.auditBeforeRepeat=auditCore();
globalThis.auditRepeatReturns=[settleHighSchoolYearOneMatch(m,'zone'),settleHighSchoolYearOneMatch(m,'zone'),finishHighSchoolMatchBySimulation(m)];
globalThis.auditRepeatUnchanged=auditBeforeRepeat===auditCore();
globalThis.auditRecordReplay=MatchGameRecord.normalizeGameRecord(JSON.parse(JSON.stringify(m.gameRecord)));
globalThis.auditFinalRecordReplay=MatchGameRecord.recordEvent(auditRecordReplay,m.simulationLog.find(e=>e.type==='plateAppearance'&&e.batterId==='player'),{rosters:m.rosters});
globalThis.auditIsolatedRecord=MatchGameRecord.createGameRecord({gameId:m.id,homeTeamId:m.gameRecord.homeTeamId,awayTeamId:m.gameRecord.awayTeamId,inningsScheduled:m.regulationInnings,rosters:m.rosters});
globalThis.auditRealPA=m.simulationLog.find(e=>e.type==='plateAppearance'&&e.batterId==='player');
globalThis.auditRecordFirst=MatchGameRecord.recordEvent(auditIsolatedRecord,auditRealPA,{rosters:m.rosters,playerId:'player',playerTeam:getHighSchoolPlayerTeamSide(m),playerRole:m.playerLineupStatus,playerPosition:m.playerFieldingAssignment});
globalThis.auditRecordBeforeDuplicate=JSON.stringify(auditIsolatedRecord);
globalThis.auditRecordDuplicate=MatchGameRecord.recordEvent(auditIsolatedRecord,auditRealPA,{rosters:m.rosters});
globalThis.auditRecordDuplicateUnchanged=auditRecordBeforeDuplicate===JSON.stringify(auditIsolatedRecord);
globalThis.auditSaveResult=null;try{const restored=normalizeSave(JSON.parse(JSON.stringify(player)));auditSaveResult={status:'confirmed',record:restored.highSchoolMatch.gameRecord,completedMoments:restored.highSchoolMatch.completedMoments,recordIntegrity:MatchGameRecord.assertIntegrity(restored.highSchoolMatch.gameRecord),originalPlayerUnchanged:auditBeforeRepeat===auditCore()};}catch(error){auditSaveResult={status:'UNVERIFIED',name:error.name,message:error.message};}
`);
const facts=h.json(`({fixture: b1BeforePreparation,initialMatch:b1Initial,steps:auditSteps,decisions:auditChoices,duplicateResolve:auditDuplicates,safety:auditSafety,
 finalMatch:m,finalPlayer:auditFinalPlayer,duplicateSettlement:{returns:auditRepeatReturns,fullPlayerAndMatchUnchanged:auditRepeatUnchanged},
 recordReplay:{locked:auditFinalRecordReplay,first:auditRecordFirst,duplicate:auditRecordDuplicate,unchanged:auditRecordDuplicateUnchanged},
 saveRoundTrip:auditSaveResult,recordIntegrity:MatchGameRecord.assertIntegrity(m.gameRecord),actualExposure:deriveHighSchoolMatchActualExposure(m)})`);
assert.equal(facts.finalMatch.completed,true);assert(facts.safety<1400);assert(facts.steps.every(s=>s.integrity.length===0));
assert(facts.steps.some(s=>s.role==='starter'&&!s.entry));
assert(facts.steps.filter(s=>!s.entry).every(s=>s.momentCount===0&&!s.playerInLineup));
assert(facts.decisions.every(s=>s.entry&&s.playerInLineup&&s.actualBatter==='player'&&s.currentBatter==='player'));
assert.equal(facts.decisions.length,1);assert.equal(facts.duplicateResolve.length,1);
assert(facts.duplicateResolve.every(r=>r.result===false&&r.fullPlayerAndMatchUnchanged));
assert(facts.duplicateSettlement.returns.every(r=>r===false));assert(facts.duplicateSettlement.fullPlayerAndMatchUnchanged);
assert.equal(facts.recordReplay.locked.status,'locked');assert.equal(facts.recordReplay.first.status,'applied');assert.equal(facts.recordReplay.duplicate.status,'duplicate');assert(facts.recordReplay.unchanged);
assert.equal(new Set(facts.finalMatch.gameRecord.eventRefs.map(e=>e.eventId)).size,facts.finalMatch.gameRecord.eventRefs.length);
const parity={fixture:H.hash(facts.fixture)===priorFacts.observed.fixtureSha256,initialMatch:H.hash(facts.initialMatch)===priorFacts.observed.initialMatchSha256,record:H.hash(facts.finalMatch.gameRecord)===priorFacts.observed.recordSha256,log:H.hash(facts.finalMatch.simulationLog)===priorFacts.observed.logSha256};
assert(Object.values(parity).every(Boolean));
if(facts.saveRoundTrip.status==='confirmed'){assert.deepEqual(facts.saveRoundTrip.record,facts.finalMatch.gameRecord);assert.deepEqual(facts.saveRoundTrip.completedMoments,facts.finalMatch.completedMoments);assert(facts.saveRoundTrip.originalPlayerUnchanged);}
console.log('ADMISSION_MOMENT_AUDIT='+JSON.stringify({policy:{fixtureFile,fixtureSha256:C.fileHash(fixtureFile),entryProgram,schoolInvitationIndex:0,simulationSeed:88221,decisionPolicy:'secure/zone/first legal',sample:0.72,safetyLimit:1400,gameplayStateMutation:false,existingOwnerWrappers:'Unchanged B1 harness; per-step reads and duplicate public calls added. No new owner wrappers or RNG calls. Observer-free control remains unverified.'},parity,facts}));
console.log('ADMISSION_MOMENT_SUMMARY='+JSON.stringify({diagnosticOnly:true,fullMatchExecutions:1,seed:88221,safety:facts.safety,decisions:facts.decisions.length,momentIds:facts.finalMatch.completedMoments.map(m=>m.id),roleStarterDidNotAdmitPlayer:true,duplicateResolveNoOp:true,duplicateSettlementNoOp:true,recordIdentityDedup:true,saveRoundTrip:facts.saveRoundTrip.status,parity,recordSha256:H.hash(facts.finalMatch.gameRecord)}));
