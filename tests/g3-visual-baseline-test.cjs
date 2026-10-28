'use strict';
const assert = require('node:assert/strict');
const ui = require('../match-pitch-decision-ui.js');

// Runs on the real page in isolated Chrome, observing the original Match only.
function inspectVisual() {
  const rect = e => { const r = e.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; };
  const board = document.querySelector('#matchScoreboardHost .line-score-table');
  return {
    headers: [...(board?.querySelectorAll('thead th') || [])].map(e=>e.textContent.trim()),
    rows: [...(board?.querySelectorAll('tbody tr') || [])].map(e=>[...e.children].map(c=>c.textContent.trim())),
    boardCount: [...document.querySelectorAll('.line-score-table')].filter(e=>e.checkVisibility()).length,
    board: board ? rect(board) : null,
    participants: document.getElementById('matchPlayerInfo').innerText,
    sidebar: document.getElementById('matchSituationPanel').innerText,
    info: rect(document.getElementById('matchPlayerInfo')),
    infoBottom: Math.max(...[...document.getElementById('matchPlayerInfo').children].map(e=>rect(e).bottom)),
    stage: rect(document.querySelector('.match-scene')),
    mount: rect(document.getElementById('matchPhaserMount')),
    actors: [...document.querySelectorAll('.match-stage-actors > div img')].map(e=>({
      src:e.getAttribute('src'),rect:rect(e),naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,
      transform:getComputedStyle(e).transform,parentTransform:getComputedStyle(e.parentElement).transform,
      fit:getComputedStyle(e).objectFit,loaded:e.complete&&e.naturalWidth>0
    })),
    note: document.querySelector('.match-scene-note').innerText,
    result: document.querySelector('.match-result-visual').innerText,
    pageWidth: document.documentElement.scrollWidth,
    boardInsideStory: Boolean(document.querySelector('#story .line-score-table')),
    kZone: rect(document.querySelector('.match-k-zone'))
  };
}
function assertVisual(s, v) {
  assert(s.active); assert(!s.overflow); assert.equal(v.boardCount,1);
  for(const id of s.ids) assert.equal(id.count,1,id.id);
  assert.deepEqual(v.headers.slice(-3),['R','H','E']);
  assert(v.headers.length>=5); assert.equal(v.rows.length,2);
  assert(v.board.y>=0 && v.board.bottom<=s.frame.y);
  assert(s.frame.height>=300 && s.frame.bottom<=s.decision.y);
  assert(s.decision.bottom<=s.height && s.decision.y>=0);
  assert(v.infoBottom<=v.info.bottom+1,'player cards do not overlap decisions');
  assert.equal(v.mount.width,v.stage.width); assert.equal(v.mount.height,v.stage.height);
  for(const actor of v.actors) {
    assert(actor.loaded); assert.equal(actor.transform,'none'); assert.equal(actor.parentTransform,'none');
    assert.equal(actor.fit,'contain');
    assert(Math.abs(actor.rect.width/actor.rect.height-actor.naturalWidth/actor.naturalHeight)<.015,'native actor proportions');
  }
  const pitcher=v.actors[0].rect,batter=v.actors[1].rect;
  assert(batter.right<pitcher.x,'batter leaves pitcher visible');
  assert(batter.right<v.kZone.x,'batter leaves reading zone visible');
  assert.match(v.note,/中性佔位.*美術未完成/); assert.match(s.zone,/中性示意.*未提供位置資訊/);
  assert(v.rows[0][0].startsWith('客隊')); assert(v.rows[1][0].startsWith('主隊'));
  const board=s.public.snapshot.record.scoreboard.value;
  for(const [i,side] of ['away','home'].entries()) {
    const totals=v.rows[i].slice(-3).map(Number);
    assert.deepEqual(totals,[board.totals[side].runs,board.totals[side].hits,board.totals[side].errors]);
    for(let inning=1;inning<v.headers.length-3;inning++) {
      const cell=v.rows[i][inning];
      if(/^\d+$/.test(cell)) assert.equal(Number(cell),board.inningLines.find(l=>l.inning===inning)?.[side+'Runs']||0);
    }
  }
  if(s.routes.length) {
    assert.deepEqual(s.routes.map(b=>b.route),s.public.snapshot.decision.routes.value.map(r=>r.routeId));
    assert.equal(s.original.length,0);assert(s.originalPlateButtons.every(b=>b.disabled&&!b.visible));
  }
  for(const b of [...s.routes,...s.original]) assert(b.rect.y>=s.decision.y&&b.rect.bottom<=s.decision.bottom);
  assert.deepEqual(s.integrity.match,[]);assert.deepEqual(s.integrity.record,[]);
  assert.equal(s.integrity.eventRefs,s.integrity.uniqueRefs);
}
if(require.main===module) {
  let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
  const f=value=>({status:'available',value});
  test('Unknown names, players, count and bases stay unavailable rather than borrowing reference data',()=>{
    const v=ui.createVisualModel({snapshot:{game:{},participants:{pitcher:f({id:'anonymous'})}}});
    for(const key of ['eventName','awayName','homeName','pitcher','batter'])assert.equal(v[key],'unavailable');
    for(const key of ['bases','balls','strikes','outs'])assert.equal(v[key],null);
  });
  test('Only available participant fields and original presentation metadata supply labels',()=>{
    const v=ui.createVisualModel({snapshot:{game:{balls:{status:'pending',value:3},strikes:f(0)},participants:{pitcher:f({name:'原名單投手'}),batter:f({id:'player',name:'ignored'})}}},
      {eventName:'原賽事',awayName:'原客隊',homeName:'原主隊',innings:7});
    assert.equal(v.pitcher,'原名單投手');assert.equal(v.batter,'你');assert.equal(v.eventName,'原賽事');
    assert.equal(v.awayName,'原客隊');assert.equal(v.homeName,'原主隊');assert.equal(v.balls,null);assert.equal(v.strikes,0);
  });
  test('Visual projection is immutable, pure and consumes no RNG',()=>{
    const p={snapshot:{game:{bases:f([null,'runner',null]),outs:f(1)}}},before=JSON.stringify(p),random=Math.random;
    Math.random=()=>{throw Error('Visual RNG');};
    try{const v=ui.createVisualModel(p);assert(Object.isFrozen(v));assert(Object.isFrozen(v.bases));assert.deepEqual(v.bases,[false,true,false]);assert.equal(JSON.stringify(p),before);}finally{Math.random=random;}
  });
  console.log(JSON.stringify({suite:'g3-visual-baseline',status:'PASS',passed}));
}
module.exports={inspectVisual,assertVisual};
