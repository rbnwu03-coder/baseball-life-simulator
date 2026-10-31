'use strict';
// Independent baseball checks: consumes captured browser evidence only. It never
// imports production integrity, outcome, lineup, or scorer implementations.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../docs/design-optimization/full-match-browser-2026-10-31');
const results=[];
const sum=values=>values.reduce((a,b)=>a+(Number(b)||0),0);
const equal=(a,b,label)=>assert.deepEqual(a,b,label);
function check(name,fn){try{results.push({name,status:'PASS',details:fn()});}catch(e){results.push({name,status:'FAIL',error:e.message});}}
function read(file){return JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));}
function world(m){return {id:m.id,seed:m.simulationSeed,cursor:m.simulationCursor,phase:m.simulationPhase,inning:m.inning,half:m.half,outs:m.outs,
  scores:m.scores,runners:m.runners,order:m.battingOrderIndex,exposure:m.gameExposureState,record:m.gameRecord,
  bunt:m.offensiveBuntPAState,handoff:m.buntBallInPlayState,log:m.simulationLog};}
function audit(m){
  const sides=['home','away'],actors=new Map();
  for(const side of sides){const r=m.rosters[side];assert.equal(r.lineup.length,9);assert.equal(new Set(r.lineup.map(a=>a.id)).size,9);
    assert.equal(new Set(r.lineup.map(a=>a.defensivePosition||a.position)).size,9);
    for(const a of [...r.lineup,...r.bench])actors.set(a.id,{...a,side});}
  const positionCodes={'投手':['P'],'捕手':['C'],'一壘手':['1B'],'二壘手':['2B'],'三壘手':['3B'],'游擊手':['SS'],
    '內野手':['1B','2B','3B','SS'],'外野手':['LF','CF','RF'],'左外野手':['LF'],'中外野手':['CF'],'右外野手':['RF']};
  if(m.playerEntryCompleted){const actor=actors.get('player');assert((positionCodes[m.playerFieldingAssignment]||[]).includes(actor.defensivePosition),'active actor position must match the match assignment');}
  const pas=m.simulationLog.filter(e=>e.type==='plateAppearance');
  // Reconstruct the lineup at each event; the final lineup cannot judge a PA
  // that happened before the substitute replaced the incumbent.
  const playerSide=m.gameRecord.homeTeamId===m.matchContext.playerTeamId?'home':'away';
  const lineups=Object.fromEntries(sides.map(s=>[s,m.rosters[s].lineup.map(a=>a.id)]));
  for(const e of m.simulationLog.filter(e=>e.type==='playerEntry').reverse())lineups[playerSide][e.lineupSlot]=e.replacedPlayerId;
  const orderAtPA=new Map();
  for(const e of m.simulationLog){
    if(e.type==='playerEntry'){assert.equal(lineups[playerSide][e.lineupSlot],e.replacedPlayerId);lineups[playerSide][e.lineupSlot]='player';}
    if(e.type==='plateAppearance')orderAtPA.set(e.sequence,lineups[e.offenseTeam].slice());
  }
  for(const side of sides)equal(lineups[side],m.rosters[side].lineup.map(a=>a.id),'entry/lineup history');
  for(const e of pas){
    const side=e.half==='上'?'away':'home';assert.equal(e.offenseTeam,side);
    assert.equal(actors.get(e.batterId)?.side,side,'batter belongs to batting team');
    const pitcherId=e.compressedOutcomeTrace?.identity?.split('|').at(-1)||e.thirdStrikeCatch?.input?.pitcherId;
    if(pitcherId)assert.equal(actors.get(pitcherId)?.side,side==='home'?'away':'home','pitcher belongs to fielding team');
    const before=e.before,after=e.after;
    if(!before||!after)continue;
    for(const state of [before,after]){assert(state.outs>=0&&state.outs<=3);const ids=state.runners.filter(Boolean);assert.equal(new Set(ids).size,ids.length);ids.forEach(id=>assert.equal(actors.get(id)?.side,side));}
    assert(after.outs>=before.outs,'outs cannot decrease within PA');
    const allowed=new Set([...before.runners.filter(Boolean),e.batterId]);after.runners.filter(Boolean).forEach(id=>assert(allowed.has(id),'runner has pre-play source'));
    const scored=e.scoringRunnerIds||[];assert.equal(new Set(scored).size,scored.length);scored.forEach(id=>{assert(allowed.has(id));assert(!after.runners.includes(id));});
    const other=side==='home'?'away':'home';assert.equal(after.scores[other],before.scores[other]);assert.equal(after.scores[side]-before.scores[side],scored.length);
    if(e.thirdOutResolution?.halfInningEnded&&['force','batterRunnerBeforeFirst'].includes(e.thirdOutResolution.thirdOutType))assert.equal(scored.length,0);
    if(e.currentBatterAfter){const lineup=orderAtPA.get(e.sequence),index=lineup.indexOf(e.batterId);assert(index>=0);assert.equal(e.currentBatterAfter,lineup[(index+1)%9]);}
  }
  const lines=Object.values(m.gameRecord.playerLines),refs=m.gameRecord.eventRefs;
  assert.equal(new Set(refs.map(r=>r.eventId)).size,refs.length,'official refs unique');
  assert.equal(sum(lines.map(l=>l.batting.PA)),pas.length,'only completed PA counted');
  assert.equal(sum(lines.map(l=>l.pitching.BF)),pas.length,'BF equals completed PA');
  assert.equal(sum(lines.map(l=>l.batting.SO)),pas.filter(e=>e.result==='strikeout').length);
  assert.equal(sum(lines.map(l=>l.pitching.SO)),pas.filter(e=>e.result==='strikeout').length);
  for(const side of sides){const id=m.gameRecord[side+'TeamId'],teamLines=lines.filter(l=>l.teamId===id),events=pas.filter(e=>e.offenseTeam===side);
    assert.equal(m.gameRecord.totals[side].runs,m.scores[side]);assert.equal(sum(m.lineScore[side]),m.scores[side]);
    assert.equal(sum(m.gameRecord.inningLines.map(l=>l[side+'Runs'])),m.scores[side]);
    assert.equal(m.gameRecord.totals[side].hits,events.filter(e=>['single','double','triple','homeRun'].includes(e.result)).length);
    assert.equal(sum(teamLines.map(l=>l.batting.H)),m.gameRecord.totals[side].hits);
    assert.equal(sum(teamLines.map(l=>l.batting.R)),m.scores[side]);}
  return {completed:m.completed,seed:m.simulationSeed,PA:pas.length,refs:refs.length,score:m.scores,
    observedOutTypes:[...new Set(pas.map(e=>e.thirdOutResolution?.thirdOutType).filter(Boolean))],
    limitation:'Checks retained facts only; does not certify absent catch/touch/scorer evidence or every rendered beat.'};
}
for(const name of ['pitcher-canonical-01-final','pitcher-canonical-02-final','catcher-final-version','outfield-lf-roster-fixed-final','substitution-ss-final']){
  if(fs.existsSync(path.join(root,name,'official-match.json')))check(name,()=>audit(read(name+'/official-match.json')));
}
check('earlier apparent outfield completion is rejected by actor-position contract',()=>{
  assert.throws(()=>audit(read('outfield-lf-after-render-fix-03/official-match.json')),/active actor position/);
  return {earlierVerdict:'FAIL',reason:'fielding assignment OF but active actor and official record 2B; excluded from outfield coverage'};
});
check('catcher final first-decision Save/Load identity and facts',()=>{
  const a=read('catcher-canonical-final/before-save.json').match,b=read('catcher-canonical-final/after-load.json').match;
  for(const key of ['id','seed','cursor','phase','inning','half','outs','scores','runners','order','bunt','handoff','log','record'])equal(a[key],b[key],key);
  // The initial compact observer used the wrong top-level path for exposure.
  // Compare retained real Save and subsequent official Match, never undefined
  // pairs. This spans the actual Load and subsequent play; instant world/cursor
  // equality is checked separately above.
  const stored=JSON.parse(read('catcher-canonical-final/save-confirmed.json').stored.baseballLifeRpgSave).highSchoolMatch.gameExposureState;
  const later=read('catcher-canonical-final/official-match.json').gameExposureState;
  assert(stored.opportunitySnapshot.decisionId);equal(stored.opportunitySnapshot,later.opportunitySnapshot,'locked opportunity across Load + later play');
  equal(stored.plannedUsage,later.plannedUsage,'planned usage across Load + later play');
});
check('final catcher blocked ball Save/Load does not reroll or resume',()=>{
  const x=read('catcher-final-version/blocked-save-load.json');assert(x.stable);assert(x.after.failure);
  assert(x.after.text.includes('比賽播放已停止'));assert(!x.after.text.includes('原比賽進行中'));
});
check('LF terminal Save/Load and passive wait preserve record and growth',()=>{
  const x=read('outfield-lf-roster-fixed-final/terminal-save-load.json');assert(x.growthStable);assert(x.passiveStable);
  equal(x.before.match.gameRecord,x.after.match.gameRecord);assert(x.after.match.completed);
  assert.equal(x.after.match.rosters.home.lineup.find(a=>a.id==='player').defensivePosition,'LF');
});
check('NPC ground bunt receipt survives actual browser Save/Load',()=>{
  const x=read('bunt-v2-3-2/post-settlement-save-load.json'),a=x.stored.highSchoolMatch,b=x.after.match;
  const receipts=m=>m.simulationLog.filter(e=>e.settlementReceipt).map(e=>e.settlementReceipt);
  equal(receipts(a),receipts(b),'receipt');equal(a.gameRecord,b.gameRecord,'record');equal(a.simulationSeed,b.simulationSeed,'seed');
  const r=receipts(b)[0];assert(r);assert.equal(r.before.battingSlot+1,r.battingSlotAfter);
  assert.equal(b.gameRecord.eventRefs.filter(e=>e.eventId===r.paEventId).length,1);assert.equal(b.gameRecord.eventRefs.filter(e=>e.eventId===r.defensiveEventId).length,1);
  return {identity:r.identity,result:r.result,actors:[r.execution.primaryId,r.execution.receiverId]};
});
check('all 17 registered bunt sources retained the original PA',()=>{
  const rows=[1,2,3,4].flatMap(n=>read('bunt-matrix/v2-group-0'+n+'.json'));
  assert.equal(rows.length,17);assert(rows.every(r=>r.sourceSame));assert.equal(rows.filter(r=>r.receipt).length,1);
  return {sources:17,settled:1,blocked:16,verdict:'BLOCKED for full coverage; source preservation PASS'};
});
check('N+1 Save/Load restarts from saved identity without new sampling',()=>{
  const a=read('pitcher-canonical-phone/n-plus-one-save-load.json').stored.highSchoolMatch;
  const x=read('n-plus-one-load-after-fix/resume-proof.json');equal(world(a),world(x.before.match),'saved facts');assert(x.before.playback.timerScheduled);
  assert(x.after.match.simulationCursor>x.before.match.simulationCursor);equal(a.simulationSeed,x.after.match.simulationSeed);
});
fs.writeFileSync(path.join(root,'independent-facts.json'),JSON.stringify({results},null,2));
for(const r of results)console.log(r.status+' '+r.name+(r.error?' '+r.error:''));
if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
