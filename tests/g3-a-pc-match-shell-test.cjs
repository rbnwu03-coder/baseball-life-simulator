'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const ui = require('../match-pitch-decision-ui.js');

// Executed against the original page by the isolated Chrome acceptance runner.
// Observation only: no fixture, simulated input, Match write or playback call.
function inspectShell() {
  const visible = e => e.checkVisibility() && !e.disabled;
  const rect = e => { const r = e.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}; };
  const shell = document.getElementById('matchShell');
  const routes = [...document.querySelectorAll('[data-match-route]')].filter(visible);
  const original = [...document.querySelectorAll('#choices button')].filter(visible);
  const p = LivePublicMatchBridge.readCurrent();
  const m = player.highSchoolMatch;
  return {
    active:shell.classList.contains('is-match'),
    ids:['matchShell','matchShellHeader','matchPresentationHost','matchDecisionFrame','story','choices'].map(id=>({id,count:document.querySelectorAll('#'+id).length})),
    shell:rect(shell),frame:rect(document.getElementById('matchPresentationHost')),decision:rect(document.getElementById('matchDecisionFrame')),
    width:innerWidth,height:innerHeight,scrollY,overflow:document.documentElement.scrollWidth>innerWidth,
    routes:routes.map(b=>({route:b.dataset.matchRoute,text:b.innerText,rect:rect(b)})),
    original:original.map(b=>({text:b.innerText,handler:b.getAttribute('onclick'),rect:rect(b)})),
    originalPlateButtons:[...document.querySelectorAll('#choices .match-player-decisions button')].map(b=>({disabled:b.disabled,visible:b.checkVisibility()})),
    scoreboardCount:document.querySelectorAll('#matchShellHeader').length + [...document.querySelectorAll('#story .match-mode-scoreboard, #story .match-mode-entry')].filter(e=>e.checkVisibility()).length,
    header:document.getElementById('matchShellHeader').innerText,
    feedback:document.querySelector('.match-pitch-feedback')?.innerText,
    zone:document.querySelector('.match-k-zone')?.getAttribute('aria-label'),
    focus:{id:document.activeElement?.id,route:document.activeElement?.dataset?.matchRoute},
    public:p, phase:m.simulationPhase, completed:m.completed,
    pa:m.offensivePlateAppearanceState ? {id:m.offensivePlateAppearanceState.paIdentity,result:m.offensivePlateAppearanceState.result,resultApplied:m.offensivePlateAppearanceState.resultApplied,pitchCount:m.offensivePlateAppearanceState.pitchNumber,history:m.offensivePlateAppearanceState.pitchHistory.map(p=>({pitchId:p.pitch.pitchId,action:p.action,result:p.pitchResult}))} : null,
    counters:window.g3Trace?.counts || {},playbackScheduled:isHighSchoolMatchPlaybackScheduled(),
    integrity:{match:getHighSchoolMatchStateIntegrityIssues(m),record:MatchGameRecord.getIntegrityIssues(m.gameRecord),eventRefs:m.gameRecord.eventRefs.length,uniqueRefs:new Set(m.gameRecord.eventRefs.map(e=>e.eventId)).size}
  };
}
function assertShell(s) {
  assert(s.active); assert(!s.overflow);
  for(const id of s.ids) assert.equal(id.count,1,id.id);
  assert.equal(s.scoreboardCount,1);
  assert.equal(s.frame.y,s.decision.y,'scene and current decision share a fixed row');
  assert(s.frame.y>=0 && s.frame.bottom<=s.height,'main frame fits viewport');
  assert(s.decision.y>=0 && s.decision.bottom<=s.height,'decision fits viewport');
  assert.match(s.zone,/中性示意.*未提供位置資訊/);
  if(s.routes.length){
    assert.deepEqual(s.routes.map(b=>b.route),s.public.snapshot.decision.routes.value.map(r=>r.routeId));
    assert.equal(s.original.length,0);
    assert(s.originalPlateButtons.every(b=>b.disabled&&!b.visible));
  }
  for(const b of [...s.routes,...s.original]) assert(b.rect.y>=0&&b.rect.bottom<=s.height,'current action visible');
  for(const key of ['awayScore','homeScore','inning','outs','balls','strikes']) {
    const f=s.public.snapshot.game[key];
    if(f.status==='available') assert(s.header.includes(String(f.value)),key);
  }
  assert.deepEqual(s.integrity.match,[]);assert.deepEqual(s.integrity.record,[]);
  assert.equal(s.integrity.eventRefs,s.integrity.uniqueRefs);
}

if(require.main===module){
  let passed=0;
  const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
  test('G2-B2 identity, admission, mapping and submit authority are byte-for-byte retained',()=>{
    const root=path.resolve(__dirname,'..');
    const source=fs.readFileSync(path.join(root,'match-pitch-decision-ui.js'),'utf8');
    const original=cp.execFileSync('git',['--no-optional-locks','show','0d3ed173952b9b8e5d5842a73761f649b50be594:match-pitch-decision-ui.js'],{cwd:root,encoding:'utf8'});
    assert.equal(source.slice(0,source.indexOf('  let adapter')),original.slice(0,original.indexOf('  let adapter')));
  });
  const field=value=>({status:'available',value});
  const projection={snapshot:{identity:{matchId:field('match'),paId:field('new-pa')},game:{gameStatus:field('inProgress'),offenseTeam:field({side:'away',teamId:'away-id'}),defenseTeam:field({side:'home',teamId:'home-id'})},decision:{status:'available',waiting:true}},timeline:{events:[{type:'PITCH_RESOLVED',paId:'old-pa',facts:{pitchResult:'ball'}},{type:'PA_SETTLED',paId:'old-pa',facts:{result:'single'}}]}};
  test('A new PA never inherits a previous PA pitch or settlement in the decision area',()=>{
    const model=ui.createShellModel(projection);assert(!model.latest);assert.equal(model.currentSettlement,null);assert.equal(model.settlement.paId,'old-pa');
  });
  test('Public shell projection is pure, frozen and reads no RNG',()=>{
    const before=JSON.stringify(projection),random=Math.random;Math.random=()=>{throw Error('UI consumed RNG');};
    try{const m=ui.createShellModel(projection);assert(Object.isFrozen(m));assert.equal(m.homeTeam,'home-id');assert.equal(m.awayTeam,'away-id');assert.equal(JSON.stringify(projection),before);}finally{Math.random=random;}
  });
  test('Unavailable teams and identifiers remain unavailable',()=>{
    const m=ui.createShellModel({snapshot:{identity:{},decision:{waiting:true},game:{}},timeline:{events:[]}});
    assert.equal(m.matchId,null);assert.equal(m.homeTeam,null);assert.equal(m.awayTeam,null);assert(!m.latest);
  });
  test('Only published current PA pitches appear as live feedback',()=>{
    const p=structuredClone(projection);p.timeline.events.push({type:'PITCH_RESOLVED',paId:'new-pa',facts:{pitchResult:'foul'}});
    assert.equal(ui.createShellModel(p).latest.facts.pitchResult,'foul');
    p.snapshot.decision.waiting=false;assert(!ui.createShellModel(p).currentSettlement);
    p.timeline.events.push({type:'DECISION_ACCEPTED',paId:'new-pa',facts:{}},{type:'PA_SETTLED',paId:'new-pa',facts:{result:'out'}});
    assert.equal(ui.createShellModel(p).currentSettlement.paId,'new-pa');
  });
  test('Tradeoff copy comes only from original choice metadata',()=>{
    assert.equal(ui.describeChoice({tradeoff:'Original tradeoff',riskProfile:'high'}),'Original tradeoff');
    assert.equal(ui.describeChoice({riskProfile:'low'}),'原策略風險：低');assert.equal(ui.describeChoice({}), '');
  });
  test('A submitted PA awaiting public reveal never borrows another PA settlement',()=>{
    const p=structuredClone(projection);p.snapshot.identity.paId={status:'unavailable',value:null};p.snapshot.decision.waiting=false;
    p.timeline.events.push({type:'DECISION_ACCEPTED',paId:'new-pa',facts:{}});
    const model=ui.createShellModel(p);assert.equal(model.paId,'new-pa');assert(model.pendingResolution);assert(!model.latest);assert(!model.currentSettlement);
  });
  console.log(JSON.stringify({suite:'g3-a-pc-match-shell',status:'PASS',passed,browserAssertions:'inspectShell + assertShell; executed by isolated Chrome acceptance runner'}));
}
module.exports={inspectShell,assertShell};
