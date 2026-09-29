const assert=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
const {discover}=require('./match-m0-after-r2-admission-context.cjs');
const P=require('../offensive-plate-approach.js');
function play(seed,policy,observe=true,save=false){
 const d=discover(seed,{observe,...(seed===440201?{schoolIndex:1,choiceIndex:1,youthChoiceIndex:2}:{})}),h=d.h;assert(d.row.matchReached);let steps=0,saved=false;
 while(!h.run('player.highSchoolMatch.completed')&&steps++<5000){
  if(h.run('!!pendingYouthSeasonOutcome'))h.run('continueYouthSeasonOutcome()');
  else if(h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)')){
   if(save&&!saved&&h.run('player.highSchoolMatch.activeSituation?.type==="plateDecision"')){
    const signature='({pitch:player.highSchoolMatch.offensivePlateAppearanceState.pendingPitch,situation:player.highSchoolMatch.activeSituation,record:player.highSchoolMatch.gameRecord,random:m0DiscoveryRandom})';
    const before=h.json(signature);assert(before.pitch.targetIntent);h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();stopHighSchoolMatchPlayback();');assert.deepEqual(h.json(signature),before);
    h.run('prepareHighSchoolPlateDecision(player.highSchoolMatch,player.highSchoolMatch.plateDecisionState.selectedOffensiveChoice);');assert.deepEqual(h.json(signature),before);saved=true;
   }
   h.context.m1Policy=policy;
   assert(h.run('var choices=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch);var c=(m1Policy==="swing"?choices.find(x=>x.matchDecision==="contactSwing"):null)||choices[0];chooseHighSchoolYearOneMatchMoment(c.matchDecision,c.matchMomentId)'),'valid current choice');
  }else assert(h.run('__runNextTimer()'),'pending timer');
 }
 const m=h.json('player.highSchoolMatch');assert(m.completed);assert(!m.activeSituation);
 const pa=m.simulationLog.filter(e=>e.type==='plateAppearance'),lines=Object.values(m.gameRecord.playerLines),battingPA=lines.reduce((n,l)=>n+l.batting.PA,0),bf=lines.reduce((n,l)=>n+l.pitching.BF,0);
 assert.equal(pa.length,battingPA);assert.equal(pa.length,bf);assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'),[]);assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'),[]);
 const refs=m.gameRecord.eventRefs.filter(e=>e.type==='plateAppearance');assert.equal(refs.length,pa.length);assert.equal(new Set(refs.map(e=>e.sequence)).size,pa.length);
 for(const e of pa.filter(e=>e.resolutionMode==='compressedPlateAppearance'))for(const key of ['targetIntent','actualPitchLocation','pitchHistory','sequenceIntent'])assert(!Object.hasOwn(e,key),'no fake compressed '+key);
 const events=d.observed.filter(r=>r.kind==='event'&&r.data.event.type==='plateAppearance'&&r.data.event.batterId==='player'&&!r.data.event.resolutionMode).flatMap(r=>r.data.paState?.pitchHistory||[]);
 const ids=new Set();for(const e of events){assert(!ids.has(e.pitch.pitchId),'duplicate detailed pitch');ids.add(e.pitch.pitchId);assert(e.pitch.targetIntent);assert.equal(e.pitch.locationRealization.targetSource,'tacticalTarget');assert.deepEqual(e.tacticalFeedback.targetIntent,e.pitch.targetIntent);assert.equal(e.tacticalFeedback.actualLocation,e.pitch.location);}
 const fallback=new Map(d.observed.filter(r=>r.kind==='handoff').flatMap(r=>r.data.state?.pitchHistory||[]).map(e=>[e.pitch.pitchId,e]));
 for(const e of fallback.values()){assert.equal(e.pitch.targetIntent,null);assert.equal(e.pitch.locationRealization.targetSource,'legacyLocationFallback');assert.equal(e.pitch.locationRealization.fallbackReason,'targetAbsent');}
 if(save)assert(saved);
 return {match:m,events,summary:{seed,policy,actualRole:d.row.actualAdmittedRole,pa:pa.length,battingPA,pitcherBF:bf,pitches:events.length,fallbackPitches:fallback.size,saved}};
}
const summaries=[],counts={},traces={};let passed=0;const verify=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
if(process.argv.includes('--save')){
 const base=play(440000,'take'),reload=play(440000,'take',true,true);
 verify('reachable presented realized-pitch save preserves identity, target, location and RNG',()=>assert(reload.summary.saved));
 verify('save/reload continuation preserves canonical record and pitch sequence',()=>{assert.deepEqual(reload.match.gameRecord,base.match.gameRecord);assert.deepEqual(reload.events,base.events);assert.deepEqual(reload.match.scores,base.match.scores);});summaries.push(reload.summary);
}else{
 for(const seed of [440000,440201])for(const policy of ['take','swing']){
  const on=play(seed,policy),off=play(seed,policy,false),repeat=play(seed,policy);
  verify('real production completion/accounting '+seed+' '+policy,()=>assert(on.match.completed));
  verify('OFF/ON and repeat entire match '+seed+' '+policy,()=>{assert.deepEqual(on.match,off.match);assert.deepEqual(on.match,repeat.match);});
  for(const e of on.events){counts[e.pitchResult]=(counts[e.pitchResult]||0)+1;traces[e.pitchResult] ||= P.getPitchExecutionTrace(e);}summaries.push(on.summary);
 }
 verify('real production missing-target path retains explicit legacy fallback',()=>assert(summaries.some(s=>s.fallbackPitches>0)));
 verify('natural detailed takes, swings, strikes, balls and contact',()=>{assert(counts.calledStrike);assert(counts.ball);assert(counts.ballInPlay);assert(counts.swingingStrike||counts.foul);});
}
const report={passed,failed:0,summaries,counts,traces,saveBoundary:process.argv.includes('--save')?'after actual realization, before pitch result; target selection/realization synchronous, no separate supported save point':null};const dir=path.join(os.tmpdir(),'pitch-target-location-m1');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,process.argv.includes('--save')?'save.json':'integration.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
