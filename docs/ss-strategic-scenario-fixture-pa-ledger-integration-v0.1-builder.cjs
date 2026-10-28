"use strict";
// Test-only explicit setup facts. This never installs a Production route.
const builderProgram=String.raw`
globalThis.setupLedger={origin:'isolatedScenarioSetupFixture',rows:[],duplicates:[],checkpoint:null,window:null,complete:false};
const setupUsed=new Set();
function ledgerAssert(ok,message){if(!ok)throw Error('Fixture Contract Gap: '+message);}
function ledgerState(match){return {inning:match.inning,half:match.half,outs:match.outs,runners:match.runners.slice(),scores:{...match.scores}};}
function ledgerRng(match){return Object.fromEntries(Object.keys(match).filter(k=>/seed|cursor|random|rng/i.test(k)).map(k=>[k,copy(match[k])]));}
function ledgerPrefix(match){
 const log=match.simulationLog,refs=match.gameRecord.eventRefs,issues=[];
 if(refs.length!==log.length)issues.push('ref-log-length');
 const ids=new Set();let chain=null,paCount=0;
 for(let i=0;i<log.length;i++){
  const e=log[i],ref=refs[i];
  if(e.sequence!==i||!ref||ref.sequence!==i||ref.type!==e.type||ref.inning!==e.inning||ref.half!==e.half)issues.push('event-ref-'+i);
  if(ref){if(ids.has(ref.eventId))issues.push('duplicate-event-id-'+i);ids.add(ref.eventId);}
  if(e.type==='matchEntry')chain={inning:e.inning,half:e.half,outs:e.outs,runners:e.runners.slice(),scores:{...e.scores}};
  if(e.type==='plateAppearance'){
   paCount++;
   if(!e.before||!e.after)issues.push('pa-snapshots-'+i);
   else {
    const prior={inning:e.inning,half:e.half,outs:e.before.outs,runners:copy(e.before.runners),scores:copy(e.before.scores)};
    if(chain&&!same(chain,prior))issues.push('pa-prefix-before-'+i);
    chain={inning:e.inning,half:e.half,outs:e.after.outs,runners:copy(e.after.runners),scores:copy(e.after.scores)};
   }
  }
  if(e.type==='sideChange')chain={inning:e.inning,half:e.half,outs:0,runners:[null,null,null],scores:{...e.scores}};
 }
 if(chain&&!same(chain,ledgerState(match)))issues.push('prefix-terminal-state');
 const paTotal=Object.values(match.gameRecord.playerLines).reduce((n,line)=>n+line.batting.PA,0);
 if(paTotal!==paCount)issues.push('pa-total');
 for(const side of ['home','away'])if(match.gameRecord.totals[side].runs!==match.scores[side])issues.push('score-total-'+side);
 const native=getHighSchoolMatchStateIntegrityIssues(match),record=MatchGameRecord.getIntegrityIssues(match.gameRecord);
 issues.push(...native.map(x=>'native:'+x),...record.map(x=>'record:'+x));
 return {issues,paCount,recordPATotal:paTotal,uniqueRefs:ids.size,logLength:log.length,chain,recordTotals:copy(match.gameRecord.totals),native,record};
}
function ledgerWindow(match){
 if(!match||match.completed||player.highSchoolMatch!==match||getCurrentEventId()!==match.eventId)return false;
 if(match.offenseTeam!==getHighSchoolOpponentTeamSide(match)||match.defenseTeam!==getHighSchoolPlayerTeamSide(match))return false;
 if(match.outs!==0||match.runners.length!==3||match.runners.some(Boolean)||!match.playerEntryCompleted)return false;
 if(TeamRosterFoundation.getCurrentDefender(match.rosters[match.defenseTeam],'SS')?.id!=='player')return false;
 const phase=match.simulationPhase,target=phase==='moment_1_resolved'||['moment_2_resolved','moment_3_resolved'].includes(phase);
 if(!target||!shouldReachHighSchoolDefensiveMoment(match)||isHighSchoolMatchDecisionVisible(match))return false;
 if(getHighSchoolPresentedEventCursor(match)<match.simulationLog.length||needsHighSchoolScoreboardReveal(match))return false;
 if(match.pendingGameSettlement||match.pendingHalfInningTermination)return false;
 if(match.activeSituation&&!MatchSituationLifecycle.canResumeSimulation(match.activeSituation))return false;
 if(match.groundBallInPlayState?.supported&&!match.groundBallInPlayState.settlementApplied)return false;
 if(match.offensivePlateAppearanceState&&match.offensivePlateAppearanceState.completed===false)return false;
 return true;
}
function ledgerApply(match,ordinal){
 const identity='ss-strategic-pa-ledger-v0.1|'+match.id+'|setup-'+ordinal;
 if(setupUsed.has(identity))return {accepted:false,identity,reason:'duplicate-setup-identity'};
 ledgerAssert(ordinal===setupLedger.rows.length+1&&[1,2].includes(ordinal),'fixed setup order');
 ledgerAssert(player.highSchoolMatch===match&&getCurrentEventId()===match.eventId,'Current identity');
 ledgerAssert(match.outs===(ordinal===1?0:1)&&match.runners.every(x=>!x),'setup base/out precondition');
 ledgerAssert(!match.activeSituation||MatchSituationLifecycle.canResumeSimulation(match.activeSituation),'pending lifecycle');
 ledgerAssert(!isHighSchoolMatchDecisionVisible(match),'pending visible Moment');
 ledgerAssert(TeamRosterFoundation.validateActiveDefense(match.rosters[match.defenseTeam]).ok,'active roster');
 ledgerAssert(TeamRosterFoundation.getCurrentDefender(match.rosters[match.defenseTeam],'SS')?.id==='player','actual SS');
 ledgerAssert(match.offenseTeam===getHighSchoolOpponentTeamSide(match),'opponent offense');
 const prefixBefore=ledgerPrefix(match);ledgerAssert(!prefixBefore.issues.length,JSON.stringify(prefixBefore.issues));
 const batter=getHighSchoolMatchLineupBatter(match,match.offenseTeam),next=getHighSchoolMatchNextLineupBatter(match,match.offenseTeam);
 const pitcher=TeamRosterFoundation.getCurrentDefender(match.rosters[match.defenseTeam],'P');
 ledgerAssert(batter&&next&&batter.id!==next.id&&batter.id!=='player'&&pitcher,'lineup batter/pitcher');
 ledgerAssert(!setupLedger.rows.some(r=>r.batterId===batter.id),'distinct setup batters');
 const result=ordinal===1?'strikeout':'walk',before=ledgerState(match),beforeMatch=copy(match),beforePlayer=copy(player),rngBefore=ledgerRng(match);
 const statsBefore={batter:copy(match.gameRecord.playerLines[batter.id]),pitcher:copy(match.gameRecord.playerLines[pitcher.id]),evidence:copy(match.performanceEvidence[batter.id]||{})};
 const row={identity,ordinal,sourceAuthority:'isolatedScenarioSetupFixture',result,batterId:batter.id,pitcherId:pitcher.id,offenseTeam:match.offenseTeam,defenseTeam:match.defenseTeam,before,beforeMatch,beforePlayer,battingOrderBefore:copy(match.battingOrderIndex),lineup:copy(match.rosters[match.offenseTeam].lineup),statsBefore,rngBefore,prefixBefore,ownerCalls:[],accepted:false};
 setupLedger.rows.push(row);
 const facts=applyHighSchoolSimulatedPlateAppearance(match,result,batter.id,match.offenseTeam);
 row.ownerCalls.push({owner:'applyHighSchoolSimulatedPlateAppearance',input:{match:beforeMatch,result,batterId:batter.id,offenseTeam:row.offenseTeam},output:copy(facts)});
 const evidence=recordHighSchoolMatchPlateAppearanceEvidence(match,batter.id,result,0);
 row.ownerCalls.push({owner:'recordHighSchoolMatchPlateAppearanceEvidence',input:{matchId:match.id,batterId:batter.id,result,runsBattedIn:0},output:copy(evidence)});
 const after=ledgerState(match),eventInput={type:'plateAppearance',presentationImportance:'hidden',eventClassification:'ordinaryPlay',outcomeAuthority:'isolatedScenarioSetupFixture',resolutionMode:'declaredSetupFixture',setupIdentity:identity,paIdentity:identity,inning:match.inning,half:match.half,offenseTeam:row.offenseTeam,defenseTeam:row.defenseTeam,batterId:batter.id,result,runsBattedIn:0,currentBatterAfter:next.id,runnerChanges:copy(facts.runnerChanges),scoringRunnerIds:copy(facts.scoringRunnerIds),thirdOutResolution:copy(facts.thirdOutResolution),before:copy(before),after:copy(after)};
 // Match/Record use their established PA snapshot shape; full inning/half remain in the row.
 eventInput.before={outs:before.outs,scores:copy(before.scores),runners:copy(before.runners)};
 eventInput.after={outs:after.outs,scores:copy(after.scores),runners:copy(after.runners)};
 const event=recordHighSchoolMatchSimulationEvent(match,eventInput);
 row.ownerCalls.push({owner:'recordHighSchoolMatchSimulationEvent',input:copy(eventInput),output:copy(event)});
 advanceHighSchoolMatchBattingOrder(match,match.offenseTeam);
 row.ownerCalls.push({owner:'advanceHighSchoolMatchBattingOrder',input:{matchId:match.id,team:row.offenseTeam},output:{witnessType:'undefined'}});
 row.after=ledgerState(match);row.afterMatch=copy(match);row.rngAfter=ledgerRng(match);row.battingOrderAfter=copy(match.battingOrderIndex);row.nextBatterId=match.currentBatter;
 row.event=copy(event);row.eventRef=copy(match.gameRecord.eventRefs.at(-1));row.evidence=copy(evidence);
 row.statsAfter={batter:copy(match.gameRecord.playerLines[batter.id]),pitcher:copy(match.gameRecord.playerLines[pitcher.id])};
 ledgerAssert(same(row.rngBefore,row.rngAfter),'setup consumed RNG');
 ledgerAssert(after.inning===before.inning&&after.half===before.half&&same(after.scores,before.scores),'inning/half/score changed');
 ledgerAssert(after.outs===1&&same(after.runners,ordinal===1?[null,null,null]:[batter.id,null,null]),'native out/base result');
 ledgerAssert(match.currentBatter===next.id&&match.currentBatter!==batter.id,'order progression');
 ledgerAssert(match.battingOrderIndex[row.offenseTeam]===(row.battingOrderBefore[row.offenseTeam]+1)%9,'order index');
 const b0=statsBefore.batter.batting,b1=row.statsAfter.batter.batting,p0=statsBefore.pitcher.pitching,p1=row.statsAfter.pitcher.pitching;
 ledgerAssert(b1.PA===b0.PA+1&&b1.AB===b0.AB+(ordinal===1?1:0)&&b1.SO===b0.SO+(ordinal===1?1:0)&&b1.BB===b0.BB+(ordinal===2?1:0),'batter PA/K/BB');
 ledgerAssert(p1.BF===p0.BF+1&&p1.SO===p0.SO+(ordinal===1?1:0)&&p1.BB===p0.BB+(ordinal===2?1:0)&&p1.outsRecorded===p0.outsRecorded+(ordinal===1?1:0),'pitcher BF/K/BB/outs');
 ledgerAssert(match.simulationLog.length===beforeMatch.simulationLog.length+1&&row.event.sequence===beforeMatch.simulationLog.length,'one event sequence');
 ledgerAssert(row.eventRef.sequence===row.event.sequence&&row.eventRef.type==='plateAppearance','record ref');
 ledgerAssert(ordinal!==1||row.eventRef.pitcherOuts?.pitcherId===pitcher.id&&row.eventRef.pitcherOuts.outs===1,'pitcher out ref');
 ledgerAssert(ordinal!==2||!row.eventRef.pitcherOuts,'walk has no phantom out');
 ledgerAssert(evidence.plateAppearances===(statsBefore.evidence.plateAppearances||0)+1,'PA evidence once');
 ledgerAssert(ordinal!==2||match.rosters[match.offenseTeam].lineup.some(a=>a.id===match.runners[0]),'runner lineup membership');
 row.prefixAfter=ledgerPrefix(match);ledgerAssert(!row.prefixAfter.issues.length,JSON.stringify(row.prefixAfter.issues));
 setupUsed.add(identity);row.accepted=true;return {accepted:true,identity};
}
function ledgerBuild(match){
 ledgerAssert(ledgerWindow(match),'setup window');
 setupLedger.window={state:ledgerState(match),fullPlayer:copy(player),phase:match.simulationPhase,currentId:match.id,event:getCurrentEventId(),prefix:ledgerPrefix(match),actualSS:TeamRosterFoundation.getCurrentDefender(match.rosters[match.defenseTeam],'SS').id};
 for(const ordinal of [1,2]){
  ledgerApply(match,ordinal);const before=JSON.stringify(player),log=JSON.stringify(match.simulationLog),result=ledgerApply(match,ordinal);
  const duplicate={ordinal,result,fullPlayerUnchanged:before===JSON.stringify(player),logUnchanged:log===JSON.stringify(match.simulationLog),currentReferenceUnchanged:player.highSchoolMatch===match};
  setupLedger.duplicates.push(duplicate);ledgerAssert(!result.accepted&&duplicate.fullPlayerUnchanged&&duplicate.logUnchanged&&duplicate.currentReferenceUnchanged,'setup duplicate mutated');
 }
 const snapshot=copy(player),serialized=JSON.stringify(player),restored=normalizeSave(copy(snapshot));
 const keys=['id','inning','half','outs','runners','scores','battingOrderIndex','currentBatter','simulationLog','gameRecord','rosters','completedMoments','gameExposureState','simulationSeed','simulationCursor','simulationPhase'];
 for(const key of keys)ledgerAssert(same(snapshot.highSchoolMatch[key],restored.highSchoolMatch[key]),'checkpoint changed '+key);
 ledgerAssert(same(abilities(snapshot),abilities(restored)),'checkpoint changed capabilities');
 ledgerAssert(JSON.stringify(player)===serialized,'normalize mutated original player');
 ledgerAssert(restored.chapter===snapshot.chapter&&restored.highSchoolStep===snapshot.highSchoolStep&&restored.forcedEventId===snapshot.forcedEventId,'checkpoint changed Event inputs');
 setupLedger.checkpoint={snapshot,restored,keys,originalPlayerUnchanged:true,currentEvent:getCurrentEventId(),sameId:restored.highSchoolMatch.id===match.id,prefix:ledgerPrefix(restored.highSchoolMatch),rng:ledgerRng(restored.highSchoolMatch),memoryCopyOnly:true};
 ledgerAssert(!setupLedger.checkpoint.prefix.issues.length,'restored prefix');
 ledgerAssert(TeamRosterFoundation.getCurrentDefender(restored.highSchoolMatch.rosters[restored.highSchoolMatch.defenseTeam],'SS')?.id==='player','restored SS');
 ledgerAssert(!restored.highSchoolMatch.activeSituation||MatchSituationLifecycle.canResumeSimulation(restored.highSchoolMatch.activeSituation),'restored pending lifecycle');
 ledgerAssert(player.highSchoolMatch===match&&prepareCurrentHighSchoolYearOneMatch()===match&&getCurrentEventId()===setupLedger.window.event,'checkpoint Current identity');
 ledgerAssert(JSON.stringify(player)===serialized,'checkpoint selector mutated player');
 setupLedger.complete=true;return setupLedger;
}
`;
module.exports={builderProgram};
