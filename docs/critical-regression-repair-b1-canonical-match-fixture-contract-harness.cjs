"use strict";
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8'),indexFiles=[...index.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]).filter(p=>p!=='application-controller.js');
const originalSource=fs.readFileSync(path.join(root,'tests/baseball-match-foundation-2-2-2-test.js'),'utf8');
function makeContext(options={}){
 const nodes=new Map(),storage=new Map();
 const globals={console:{log(){},warn(){},error:console.error},document:{body:{classList:{add(){},remove(){},toggle(){},contains(){return false;}}},getElementById(id){if(!nodes.has(id))nodes.set(id,{id,innerHTML:'',textContent:'',value:'',style:{},dataset:{},disabled:false,classList:{add(){},remove(){},toggle(){},contains(){return false;}},focus(){},setAttribute(){},removeAttribute(){},querySelectorAll(){return [];}});return nodes.get(id);},querySelector(){return null;},querySelectorAll(){return [];}},localStorage:{setItem(k,v){storage.set(k,v);},getItem(k){return storage.get(k)||null;},removeItem(k){storage.delete(k);}},window:{setTimeout(){return 1;},clearTimeout(){}}};
 if(options.commonJS)globals.module={exports:{}};
 const context=vm.createContext(globals),loaded=[];const files=options.files||indexFiles;
 for(const file of files){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});loaded.push(file);}
 const run=text=>vm.runInContext(text,context),json=text=>JSON.parse(run('JSON.stringify('+text+')'));
 run(`
 function b1Abilities(p=player){return {baseballSkills:p.baseballSkills,ballSense:p.ballSense,observe:p.observe,fitness:p.fitness,instinct:p.instinct,discipline:p.discipline,pressure:p.pressure,body:p.body,baseballExperience:p.baseballExperience,capabilityState:p.capabilityState};}
 function b1RosterFacts(m){const side=getHighSchoolPlayerTeamSide(m),r=m.rosters[side],tr=r.teamRoster;return {age:player.age,primaryPosition:player.primaryPosition,side,playerLineupStatus:m.playerLineupStatus,playerEntryCompleted:m.playerEntryCompleted,playerLineupSlot:m.playerLineupSlot,playerFieldingAssignment:m.playerFieldingAssignment,developmentPositionOverride:m.developmentPositionOverride,developmentTestCapabilityOverride:m.developmentTestCapabilityOverride,rosterMembership:(tr?.players||r.lineup.concat(r.bench||[])).filter(a=>(a.playerId||a.id)==='player'),startingLineup:r.lineup.map((a,i)=>({slot:i+1,id:a.id,playerId:a.playerId,position:a.position,defensivePosition:a.defensivePosition})),canonicalBattingOrder:tr?.battingOrder,canonicalStarters:tr?.starters.map(a=>({id:a.id,playerId:a.playerId,primaryPosition:a.primaryPosition})),ssDefender:TeamRosterFoundation.getCurrentDefender(r,'SS'),currentBatter:m.currentBatter,actualCurrentBatter:getHighSchoolMatchLineupBatter(m,m.offenseTeam)?.id,battingOrderIndex:m.battingOrderIndex,opportunity:m.gameExposureState?.opportunitySnapshot,plannedUsage:m.gameExposureState?.plannedUsage};}
 globalThis.b1OwnerCalls=[];
 `);
 for(const name of ['materializeSelectedHighSchoolRoster','createHighSchoolMatchSimulationRoster','createHighSchoolPlayingTimeOpportunity','prepareHighSchoolYearOneMatch','enterHighSchoolMatchPlayer','settleHighSchoolYearOneMatch','finalizeHighSchoolGameRecord']){
  run(`{const original=${name};${name}=function(...args){const value=Reflect.apply(original,this,args);b1OwnerCalls.push({name:${JSON.stringify(name)},args:JSON.parse(JSON.stringify(args)),returned:value===null?'null':typeof value,matchId:player.highSchoolMatch?.id,completed:player.highSchoolMatch?.completed});return value;};}`);
 }
 return{context,run,json,loaded,storage};
}
function prepare(h){
 h.run(`stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;player=createInitialPlayer('2.2.2 測試球員');applyDebugBookmarkCharacterProfile(player);settleHighSchoolEntryCapability(player,{originType:'test-fixture'});applyCanonicalPositionProfile(player,'內野手',['外野手']);globalThis.b1OriginalPlayer=JSON.parse(JSON.stringify(player));globalThis.b1OriginalAbilities=JSON.stringify(b1Abilities());applyCanonicalPositionProfile(player,'游擊手',['外野手']);player.chapter='青棒';player.highSchoolStep=5;applyHighSchoolRoleState('starter');pendingHighSchoolMatchSimulationSeed=88221;globalThis.b1BeforePreparation=JSON.parse(JSON.stringify(player));globalThis.m=prepareHighSchoolYearOneMatch();globalThis.b1Initial=JSON.parse(JSON.stringify(m));globalThis.b1InitialFacts=b1RosterFacts(m);`);
 return{originalPlayer:h.json('b1OriginalPlayer'),beforePreparation:h.json('b1BeforePreparation'),initialMatch:h.json('b1Initial'),initialFacts:h.json('b1InitialFacts'),abilitiesUnchanged:h.run('b1OriginalAbilities===JSON.stringify(b1Abilities())')};
}
function execute(h){
 h.run(`globalThis.b1Decisions=[];globalThis.b1Steps=[];globalThis.b1Integrity=[];globalThis.b1Safety=0;
 while(!m.completed&&b1Safety++<1400){
  b1Steps.push({safety:b1Safety,inning:m.inning,half:m.half,outs:m.outs,phase:m.simulationPhase,currentBatter:m.currentBatter,actualBatter:getHighSchoolMatchLineupBatter(m,m.offenseTeam)?.id,order:{...m.battingOrderIndex},completedIds:m.completedMoments.map(x=>x.id)});
  const issues=getHighSchoolMatchStateIntegrityIssues(m);if(issues.length)b1Integrity.push({safety:b1Safety,issues});
  if(isHighSchoolMatchDecisionVisible(m)){const choices=getHighSchoolYearOneMatchMomentChoices(m);const choice=choices.find(item=>item.matchDecision==='secure'||item.matchDecision==='zone')||choices[0];if(!choice)throw Error('No legal original-policy choice');const before={inning:m.inning,half:m.half,outs:m.outs,currentMomentId:m.currentMomentId,domain:m.currentDomain,phase:m.simulationPhase,activeType:m.activeSituation?.type,currentBatter:m.currentBatter};const decision={...before,choice:JSON.parse(JSON.stringify(choice)),legalChoices:choices.map(c=>({matchDecision:c.matchDecision,matchMomentId:c.matchMomentId,routeId:c.routeId})),sample:0.72};b1Decisions.push(decision);decision.returned=resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.72);
  }else advanceHighSchoolMatchPlaybackStep(m);
 }
 globalThis.b1Ids=m.completedMoments.map(x=>x.id);globalThis.b1RecordIntegrity=null;try{b1RecordIntegrity={accepted:MatchGameRecord.assertIntegrity(m.gameRecord)};}catch(error){b1RecordIntegrity={accepted:false,name:error.name,message:error.message};}
 globalThis.b1Observed={seed:m.simulationSeed,safety:b1Safety,operands:{completed:m.completed,firstIdPresent:b1Ids.includes(highSchoolYearOneMomentIds[0]),finalIdPresent:b1Ids.includes(highSchoolYearOneMomentIds[2]),defenseCount:m.completedMoments.filter(x=>x.domain==='defense').length,defensiveMeaningfulDecisionCount:m.matchDecisionDensityState.defensiveMeaningfulDecisionCount,defenseCountsEqual:m.completedMoments.filter(x=>x.domain==='defense').length===m.matchDecisionDensityState.defensiveMeaningfulDecisionCount,safetyBelow1400:b1Safety<1400},expectedIds:highSchoolYearOneMomentIds,ids:b1Ids,offensiveMoments:m.completedMoments.filter(x=>x.domain==='offense'),finalFacts:b1RosterFacts(m),stateIntegrity:getHighSchoolMatchStateIntegrityIssues(m),perStepIntegrityIssues:b1Integrity,recordIntegrity:b1RecordIntegrity,match:m,record:m.gameRecord,decisions:b1Decisions,steps:b1Steps,ownerCalls:b1OwnerCalls,abilitiesUnchanged:b1OriginalAbilities===JSON.stringify(b1Abilities())};
 `);
 const out=h.json('b1Observed');out.fixtureSha256=hash(h.json('b1BeforePreparation'));out.initialMatchSha256=hash(h.json('b1Initial'));out.recordSha256=hash(out.record);out.logSha256=hash(out.match.simulationLog);out.decisionSequenceSha256=hash(out.decisions);return out;
}
module.exports={root,indexFiles,originalSource,hash,makeContext,prepare,execute};
