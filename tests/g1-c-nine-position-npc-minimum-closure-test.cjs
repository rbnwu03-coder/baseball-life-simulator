'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),Module=require('node:module');
const S=require('./match-vnext-same-ball-production-integration-test.cjs');
const {makeContext}=require('./high-school-career-test-context.js');
const Guard=require('./g1-c-source-delta.cjs'),Record=require('../match-game-record.js'),Reach=require('../defensive-reach-secure-foundation.js');
const evidence={suite:'g1-c-nine-position-npc-minimum-closure',catcher:[],infield:[],firstBase:[],negative:[],persistence:[],capabilities:[],normalGame:null};
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function setupK(outs=0,type='called',weak=false){
 const h=S.controlled(outs);
 h.run('var m=player.highSchoolMatch;var kChoice=getHighSchoolYearOneMatchMomentChoices(m)[0];');
 if(weak)h.run('m.rosters[m.defenseTeam]=JSON.parse(JSON.stringify(m.rosters[m.defenseTeam]));getCurrentHighSchoolMatchDefender(m,m.defenseTeam,"C").defense=0;');
 h.run('var kOptions='+JSON.stringify({plateAppearance:{pitchSequence:Array.from({length:3},()=>({pitchLocationClass:'competitiveStrike'})),pitchOptions:Array.from({length:3},()=>type==='called'?{decisionRoute:'take'}:{decisionRoute:'powerSwing',timingRoll:.999999,batToBallRoll:.999999})}})+';');
 return h;
}
const facts='({outs:m.outs,runners:m.runners,scores:m.scores,order:m.battingOrderIndex,record:m.gameRecord,pa:m.simulationLog.filter(e=>e.type==="plateAppearance").length,contribution:m.playerContribution,skills:player.baseballSkills})';
function recordContext(h){return h.json('({rosters:m.rosters,playerTeam:"home",playerRole:m.playerLineupStatus,playerPosition:m.playerFieldingAssignment})');}
let reference;
for(const type of ['called','swinging'])for(const outs of [0,1,2])test(type+' strike three O'+outs+' actual NPC C PO and original PA once',()=>{
 const h=setupK(outs,type),before=h.json(facts),context=recordContext(h);
 h.run('var result=resolveHighSchoolOffensiveDecision(m,kChoice,"mixed",kOptions);');
 const after=h.json(facts),pa=h.json('m.simulationLog.filter(e=>e.type==="plateAppearance").at(-1)'),proof=pa.thirdStrikeCatch;
 assert.equal(after.outs,outs+1);assert.equal(after.pa-before.pa,1);assert(proof.execution.caught);
 assert.equal(proof.execution.strikeType,type==='called'?'calledStrike':'swingingStrike');
 const cid=proof.execution.catcherId,pid=proof.execution.pitcherId,bid=pa.batterId;
 assert.notEqual(cid,'player');assert.notEqual(pid,cid);
 for(const [id,line]of Object.entries(after.record.playerLines)){
  const old=before.record.playerLines[id];
  assert.equal(line.defense.PO-(old?.defense.PO||0),id===cid?1:0);
  assert.equal(line.defense.chances-(old?.defense.chances||0),id===cid?1:0);
  assert.equal(line.defense.A-(old?.defense.A||0),0);assert.equal(line.defense.E-(old?.defense.E||0),0);
 }
 for(const key of ['PA','AB','SO'])assert.equal(after.record.playerLines[bid].batting[key]-before.record.playerLines[bid].batting[key],1);
 assert.equal(after.record.playerLines[pid].pitching.BF-before.record.playerLines[pid].pitching.BF,1);
 assert.equal(after.record.playerLines[pid].pitching.SO-before.record.playerLines[pid].pitching.SO,1);
 assert.equal(after.record.playerLines[pid].defense.PO-before.record.playerLines[pid].defense.PO,0);
 assert.deepEqual(after.skills,before.skills);
 assert.deepEqual(h.json('MatchExperienceDevelopment.deriveMatchExperienceEvidence(m).filter(e=>e.playerId==="player"&&e.evidenceType==="active"&&e.participationType!=="batter")'),[]);
 assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
 h.run('var stable=JSON.stringify('+facts+');resolveHighSchoolOffensiveDecision(m,kChoice,"mixed",kOptions);');
 assert(h.run('stable===JSON.stringify('+facts+')'));
 const duplicate=structuredClone(pa);duplicate.sequence+=100;duplicate.eventId='another-callback';
 const frozen=JSON.stringify(after.record);assert.equal(Record.recordEvent(after.record,duplicate,context).status,'duplicate');assert.equal(JSON.stringify(after.record),frozen);
 if(outs===2){h.run('advanceHighSchoolMatchAfterHalfInning(m)');assert.equal(h.json('m.outs'),0);assert.notEqual(h.json('m.half'),pa.half);}
 else {h.run('resolveSimulatedHighSchoolPlateAppearance(m,()=>.62,{allowPlayer:true})');assert.equal(h.json(facts).pa,after.pa+1);}
 evidence.catcher.push({type,outs,proof,pa,before:{outs:before.outs,record:before.record},after:{outs:after.outs,record:after.record},continuation:h.json('({outs:m.outs,inning:m.inning,half:m.half,batter:m.currentBatter})')});
 if(!reference)reference={before:before.record,pa,context};
});
test('new exact source guard preserves prior core and rejects unauthorized deltas',()=>{evidence.sourceGuard=Guard.runSourceTests();assert.equal(evidence.sourceGuard.rejectedMutations,9);});
const corruption=[
 ['wrong active catcher',p=>p.thirdStrikeCatch.input.catcher.id='wrong'],
 ['invalid catcher position',p=>p.thirdStrikeCatch.input.catcher.position='P'],
 ['stale batter',p=>p.batterId='stale'],
 ['stale PA',p=>p.paIdentity+='stale'],
 ['wrong pitcher',p=>p.thirdStrikeCatch.input.pitcherId='wrong'],
 ['uncaught third strike',p=>p.thirdStrikeCatch.input.pitchEvent.thirdStrikeUncaught=true],
 ['bounced third strike',p=>p.thirdStrikeCatch.input.pitchEvent.pitch.bounced=true],
 ['no possession',p=>p.thirdStrikeCatch.execution.possession.holderId=null],
 ['forged success',p=>{p.thirdStrikeCatch.input.catcher.raw.defense=0;p.thirdStrikeCatch.input.catcher.capabilities={fielding:0,catching:0,reaction:0};}],
 ['fabricated throw',p=>p.actionFacts={actions:[{type:'throw',status:'completed'}]}],
 ['illegal third out',p=>p.after.outs=4],
 ['invalid retirement',p=>p.thirdOutResolution.orderedRetirements[0].outType='force'],
 ['wrong retirement actor',p=>p.thirdOutResolution.orderedRetirements[0].runnerId='other'],
 ['first-base safe contradictory terminal',p=>p.after.runners=[p.batterId,null,null]],
 ['fake receiving time/type',p=>p.thirdStrikeCatch.execution.throwAttempted=true],
 ['pitch identity missing',p=>delete p.thirdStrikeCatch.input.pitchEvent.pitch.pitchId]
];
for(const [name,mutate]of corruption)test('reject '+name+' before official Record mutation',()=>{
 const record=structuredClone(reference.before),event=structuredClone(reference.pa);mutate(event);
 const stable=JSON.stringify(record);let message;assert.throws(()=>Record.recordEvent(record,event,reference.context),e=>{message=e.message;return true;});assert.equal(JSON.stringify(record),stable);
 evidence.negative.push({name,message,recordUnchanged:true});
});
test('compressed/historical strikeout without catch evidence cannot infer catcher PO',()=>{
 const record=structuredClone(reference.before),event=structuredClone(reference.pa);delete event.thirdStrikeCatch;delete event.paIdentity;
 Record.recordEvent(record,event,reference.context);
 const catcher=reference.pa.thirdStrikeCatch.execution.catcherId;assert.equal(record.playerLines[catcher].defense.PO,reference.before.playerLines[catcher].defense.PO);
});
test('failed actual catcher execution blocks PA/out and compressed skip with stable sample',()=>{
 const h=setupK(0,'called',true),before=h.json(facts);
 assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(m,kChoice,"mixed",kOptions)'),/THIRD_STRIKE/);
 assert.deepEqual(h.json(facts),before);h.run('var failed=JSON.stringify(m.offensivePlateAppearanceState)');
 assert.throws(()=>h.run('resolveSimulatedHighSchoolPlateAppearance(m,()=>.62,{allowPlayer:true})'),/THIRD_STRIKE_PENDING/);
 assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(m,kChoice,"mixed",kOptions)'),/THIRD_STRIKE/);
 assert(h.run('failed===JSON.stringify(m.offensivePlateAppearanceState)'));assert.deepEqual(h.json(facts),before);
 evidence.negative.push({name:'failed catcher stays unclosed',state:h.json('m.offensivePlateAppearanceState'),unchanged:true});
});
test('catch ability changes execution; no catch is inferred from strikeout alone',()=>{
 const base=reference.pa.thirdStrikeCatch.input,rows=[];
 for(const defense of [0,2,6]){const input=structuredClone(base);input.catcher.raw.defense=defense;input.catcher.capabilities={fielding:defense,catching:defense,reaction:defense};input.sample=.5;const stable=JSON.stringify(input);const execution=Reach.resolveThirdStrikeCatch(input);assert.equal(JSON.stringify(input),stable);rows.push({defense,execution});}
 assert.equal(rows[0].execution.caught,false);assert.equal(rows[1].execution.caught,false);assert.equal(rows[2].execution.caught,true);evidence.capabilities=rows;
});
for(const stage of ['prepared','executed','settled'])test('real Save/Load '+stage+' preserves one PA BF SO and catcher PO',()=>{
 const h=setupK(2,'swinging');const before=h.json(facts);
 if(stage==='prepared')h.run('ensureHighSchoolOffensivePlateAppearanceState(m,kChoice)');
 if(stage==='executed')h.run('resolveHighSchoolOffensivePlateAppearance(m,kChoice,kOptions.plateAppearance)');
 if(stage==='settled')h.run('resolveHighSchoolOffensiveDecision(m,kChoice,"mixed",kOptions)');
 h.run('saveGame();loadGame();m=player.highSchoolMatch;resolveHighSchoolOffensiveDecision(m,kChoice,"mixed",kOptions);');
 const after=h.json(facts),pa=h.json('m.simulationLog.filter(e=>e.type==="plateAppearance").at(-1)');
 assert.equal(after.pa-before.pa,1);assert.equal(after.outs,3);assert.equal(after.record.playerLines[pa.thirdStrikeCatch.execution.catcherId].defense.PO,1);
 assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
 h.run('var stable=JSON.stringify('+facts+');resolveHighSchoolOffensiveDecision(m,kChoice,"mixed",kOptions);');
 assert(h.run('stable===JSON.stringify('+facts+')'));evidence.persistence.push({stage,proof:pa.thirdStrikeCatch,after:{outs:after.outs,record:after.record}});
});
// Reuse the original declared infield setup only; do not run its 400-game cohort.
const source=path.join(__dirname,'first-base-receive-active-ground-production-integration-test.js'),text=fs.readFileSync(source,'utf8');
const prefix=text.slice(0,text.indexOf("test('physical first-base")),ctx=vm.createContext({require:Module.createRequire(source),console,__dirname,process});
vm.runInContext(prefix,ctx);const irun=t=>vm.runInContext('run('+JSON.stringify(t)+')',ctx),ijson=t=>vm.runInContext('json('+JSON.stringify(t)+')',ctx);
for(const [position,opts,decision]of [['SS',{direction:.1,occupied:0}],['2B',{direction:.9,occupied:0}],['3B',{direction:.005,occupied:0}],['P',{pace:0,contactQuality:.1,occupied:0},'cover']])for(const outs of [0,1,2])test(position+' original NPC fielding O'+outs+' official attribution and continuation',()=>{
 irun('var m=firstBaseFixture('+JSON.stringify({...opts,outs})+');');
 if(decision)irun('var x=firstBaseExecute(m,"cover",.8);applyInfieldResolutionToHighSchoolMatch(m,"cover",x.r);');
 const row=ijson('({resolution:m.lastDefensiveResolution,record:m.gameRecord,outs:m.outs,issues:getHighSchoolMatchStateIntegrityIssues(m),recordIssues:MatchGameRecord.getIntegrityIssues(m.gameRecord),roster:m.rosters.home.lineup})');
 const actor=row.roster.find(x=>(x.defensivePosition||x.position)===position),attribution=row.resolution.defensiveAttribution;
 assert(actor&&actor.id!=='player');assert.equal(row.outs,outs+1);assert.deepEqual(row.issues,[]);assert.deepEqual(row.recordIssues,[]);
 const stats=row.record.playerLines[actor.id].defense;assert.equal(position==='P'?stats.PO:stats.A,1);
 assert(attribution.actors.some(x=>x.actorId===actor.id));assert(row.resolution.actionFacts.actions.some(x=>x.actorId===actor.id&&x.status==='completed'));
 irun('var stable=firstBaseFacts(m);applyRoutineDefensiveResolutionToHighSchoolMatch(m,m.lastDefensiveResolution)');assert(irun('stable===firstBaseFacts(m)'));
 if(outs===2){irun('advanceHighSchoolMatchAfterHalfInning(m)');assert.equal(ijson('m.outs'),0);}else{irun('resolveSimulatedHighSchoolPlateAppearance(m,()=>.62,{allowPlayer:true})');}
 evidence.infield.push({position,outs,actor,actions:row.resolution.actionFacts,retirements:row.resolution.runnerSettlement.retirements,attribution,recordLine:row.record.playerLines[actor.id],terminalOuts:row.outs});
});
for(const outs of [0,1,2])test('NPC first baseman original same-ball receive/base touch O'+outs,()=>{
 const h=S.controlled(outs);S.prepare(h);S.injectSamples(h);const before=h.json('player.highSchoolMatch.gameRecord');const state=S.commit(h),candidate=state.officialBallInPlayOutcome.executionCandidate,after=h.json('player.highSchoolMatch.gameRecord');
 const id=candidate.received.receiverId;assert.notEqual(id,'player');assert.equal(after.playerLines[id].defense.PO-before.playerLines[id].defense.PO,1);
 assert.equal(after.playerLines[id].defense.A-before.playerLines[id].defense.A,0);assert(candidate.actionFacts.actions.some(x=>x.actorId===id&&x.type==='baseTouch'&&x.status==='completed'));
 assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'),[]);
 evidence.firstBase.push({outs,actor:candidate.context.capabilities.receiver,actions:candidate.actionFacts,retirements:candidate.settlement.thirdOut.orderedRetirements,before:before.playerLines[id],after:after.playerLines[id]});
});
test('normal public Career match completes with actual catcher responsibility, reload and unique development',()=>{
 const h=makeContext();h.run('careerFixture("二壘手","starter",77001);choose("critical_offseason",1);var m=player.highSchoolMatch;var ticks=0;var reloaded=false;');
 h.run('while(!m.completed&&ticks++<2500){if(pendingYouthSeasonOutcome)continueYouthSeasonOutcome();if(isHighSchoolMatchDecisionVisible(m)){var choices=getHighSchoolYearOneMatchMomentChoices(m);var choice=choices.find(c=>c.matchDecision==="take")||choices[0];if(!choice)throw Error("no public choice");chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>.62);}else advanceHighSchoolMatchPlaybackStep(m);if(ticks===50){saveGame();loadGame();m=player.highSchoolMatch;reloaded=true;}}if(!m.completed)throw Error("normal match incomplete");');
 const row=h.json('({ticks,reloaded,completed:m.completed,scores:m.scores,record:m.gameRecord,experience:m.matchExperience,log:m.simulationLog,rosters:m.rosters,issues:getHighSchoolMatchStateIntegrityIssues(m),recordIssues:MatchGameRecord.getIntegrityIssues(m.gameRecord),g1bNatural:m.simulationLog.some(e=>e.type==="outfieldSingleResolution")})');
 assert(row.completed&&row.reloaded);assert.deepEqual(row.scores,row.record.result.finalScore);assert.equal(row.record.status,'final');assert(row.experience.settled);
 assert.deepEqual(row.issues,[]);assert.deepEqual(row.recordIssues,[]);assert.equal(row.g1bNatural,false);
 const rosterValidation=Object.fromEntries(['home','away'].map(side=>[side,h.json('TeamRosterFoundation.validateActiveDefense(m.rosters.'+side+')')]));
 for(const side of ['home','away']){assert(rosterValidation[side].ok);assert.equal(row.rosters[side].lineup.length,9);assert.equal(new Set(row.rosters[side].lineup.map(a=>a.id)).size,9);}
 const halfEnds=row.log.filter(e=>e.type==='halfInningEnd');assert(halfEnds.length>0);
 for(const e of halfEnds){assert.equal(e.outs,3);assert.deepEqual(e.basesAfter,[null,null,null]);}
 const terminalEvents=row.log.filter(e=>e.before&&e.after);
 for(const e of terminalEvents){assert(e.before.outs>=0&&e.before.outs<3);assert(e.after.outs>=0&&e.after.outs<=3);const runners=e.after.runners.filter(Boolean);assert.equal(new Set(runners).size,runners.length);}
 row.validation={rosterValidation,halfInningsClosed:halfEnds.length,terminalEventsChecked:terminalEvents.length,legalThirdOuts:true,uniqueBaseOccupancy:true};
 const caught=row.log.filter(e=>e.thirdStrikeCatch);assert(caught.length>0,'normal public take choices produce actual caught third strikes');
 for(const e of caught){const id=e.thirdStrikeCatch.execution.catcherId;assert(row.record.playerLines[id].defense.PO>=1);}
 h.run('var stable=JSON.stringify({record:m.gameRecord,experience:m.matchExperience,skills:player.baseballSkills});saveGame();loadGame();m=player.highSchoolMatch;settleHighSchoolYearOneMatch(m,"secure");');
 assert(h.run('stable===JSON.stringify({record:m.gameRecord,experience:m.matchExperience,skills:player.baseballSkills})'));
 evidence.normalGame={...row,caughtThirdStrikes:caught.length,uniqueDevelopment:true};
});
for(const [name,edit]of [
 ['changed active catcher','getCurrentHighSchoolMatchDefender(m,m.defenseTeam,"C").id="replacement"'],
 ['invalid active C position','getCurrentHighSchoolMatchDefender(m,m.defenseTeam,"C").defensivePosition="RF"'],
 ['stale batter at commit','m.currentBatter="stale-batter"'],
 ['stale actual pitch PA','m.offensivePlateAppearanceState.pitchHistory.at(-1).pitch.paIdentity="stale-pa"'],
 ['capability changed after pitch','getCurrentHighSchoolMatchDefender(m,m.defenseTeam,"C").defense+=1'],
 ['actual pitch uncaught','m.offensivePlateAppearanceState.pitchHistory.at(-1).pitch.uncaught=true']
])test('pending Match rejects '+name+' without PA/out/Record write',()=>{
 const h=setupK();h.run('resolveHighSchoolOffensivePlateAppearance(m,kChoice,kOptions.plateAppearance);m.rosters[m.defenseTeam]=JSON.parse(JSON.stringify(m.rosters[m.defenseTeam]));'+edit+';');
 const before=h.json(facts);assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(m,kChoice,"mixed",kOptions)'));assert.deepEqual(h.json(facts),before);
 evidence.negative.push({name,matchCommitRejected:true,recordUnchanged:true});
});
for(const name of ['duplicate catcher position','catcher simultaneously benched'])test('Record rejects '+name,()=>{
 const record=structuredClone(reference.before),event=structuredClone(reference.pa),ctx=structuredClone(reference.context);
 const side=event.offenseTeam==='home'?'away':'home',roster=ctx.rosters[side],actor=roster.lineup.find(x=>x.id===event.thirdStrikeCatch.execution.catcherId);
 if(name==='duplicate catcher position'){const other=roster.lineup.find(x=>x.id!==actor.id&&x.defensivePosition!=='P');other.defensivePosition='C';}
 else roster.bench.push(structuredClone(actor));
 const before=JSON.stringify(record);assert.throws(()=>Record.recordEvent(record,event,ctx));assert.equal(JSON.stringify(record),before);
 evidence.negative.push({name,recordUnchanged:true});
});
test('Record rejects changing the locked third-strike sample',()=>{
 const record=structuredClone(reference.before),event=structuredClone(reference.pa);event.thirdStrikeCatch.input.sample=0;
 event.thirdStrikeCatch.execution=Reach.resolveThirdStrikeCatch(event.thirdStrikeCatch.input);
 const before=JSON.stringify(record);assert.throws(()=>Record.recordEvent(record,event,reference.context));assert.equal(JSON.stringify(record),before);
 evidence.negative.push({name:'post-pitch sample changed',recordUnchanged:true});
});
test('existing NPC pitcher unavailable cover cannot manufacture P putout',()=>{
 irun('var m=firstBaseFixture({pace:0,contactQuality:.1,npc:{P:{defense:1,speed:1}}});var x=firstBaseExecute(m,"cover",.8);applyInfieldResolutionToHighSchoolMatch(m,"cover",x.r);');
 const row=ijson('({resolution:x.r,pitcher:TeamRosterFoundation.getCurrentDefender(m.rosters.home,"P"),record:m.gameRecord,issues:MatchGameRecord.getIntegrityIssues(m.gameRecord)})');
 assert.equal(row.resolution.outsCreated,0);assert.equal(row.record.playerLines[row.pitcher.id].defense.PO,0);assert.deepEqual(row.issues,[]);
 evidence.negative.push({name:'actual P unavailable cover',actor:row.pitcher,resolution:row.resolution,recordUnchangedOuts:true});
});
console.log(JSON.stringify({...evidence,status:'PASS',passed}));
