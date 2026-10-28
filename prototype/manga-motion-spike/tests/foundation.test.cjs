'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const app = require('../../match-ui-p1/app.js'), scene = require('../../match-ui-p1/presentation.js');
const fixture = require('../../match-ui-p1/fixture.js'), adapter = require('../../match-ui-p1/presentation-v02.generated.js');
const contract = require('../clock-contract.js'), tracks = require('../tracks.js');
const root = path.resolve(__dirname, '../..'), pair = adapter.connect(fixture);
class Clock {
  now = 0; id = 0; tasks = new Map(); callbacks = [];
  schedule = (fn, delay) => { const id = ++this.id; this.tasks.set(id, { at: this.now + delay, fn }); this.callbacks.push(fn); return id; };
  cancel = id => this.tasks.delete(id);
  tick(ms) { const end = this.now + ms; let guard = 0; for (;;) { const due = [...this.tasks].filter(([, v]) => v.at <= end).sort((a,b) => a[1].at-b[1].at)[0]; if (!due) break; assert.ok(++guard < 1000); this.now = due[1].at; this.tasks.delete(due[0]); due[1].fn(); } this.now = end; }
}
function model(extra = {}) { const clock = new Clock(), demo = app.createDemo(fixture, { presentationMode: 'continuous', clockContract: contract, presentationRoute: { version: adapter.VERSION, adapter }, now: () => clock.now, schedule: clock.schedule, cancel: clock.cancel, ...extra }); demo.start(); return { clock, demo }; }
function begin(extra) { const c = model(extra); c.demo.submit('secureFirstBaseOut'); c.clock.tick(420); return c; }
function next(c) { c.clock.tick(151); return c.demo.next(c.demo.getView().currentBeat.eventId); }
class Element {
  constructor(doc, tag = 'div') { this.ownerDocument = doc; this.tagName = tag.toUpperCase(); this.children=[]; this.attributes={}; this.dataset={}; this.listeners={}; this.hidden=false; this.disabled=false; this.writes=[]; this.classList={ toggle() {} }; }
  set id(v) { this._id=v; this.ownerDocument.nodes.set(v,this); } get id() { return this._id; }
  set textContent(v) { this._text=String(v); this.children=[]; } get textContent() { return (this._text||'')+this.children.map(c=>c.textContent).join(''); }
  setAttribute(k,v) { this.attributes[k]=String(v); this.writes.push([k,String(v)]); } removeAttribute(k) { delete this.attributes[k]; }
  append(...n) { this.children.push(...n); } replaceChildren(...n) { this.children=[...n]; }
  addEventListener(k,fn) { (this.listeners[k] ||= []).push(fn); } dispatch(k) { (this.listeners[k]||[]).forEach(f=>f()); }
  click() { if(!this.disabled)this.dispatch('click'); } focus() { const p=this.ownerDocument.activeElement;this.ownerDocument.activeElement=this;if(p!==this){p?.dispatch('blur');this.dispatch('focus');} }
  animate() { throw Error('Legacy WA must never run in continuous mode'); }
}
class Document {
  constructor(html) { this.nodes=new Map();this.readyState='loading';this.events={};this.activeElement=null;for(const m of html.matchAll(/<([a-z][\w-]*)\b[^>]*\bid="([^"]+)"/gi)){const e=new Element(this,m[1]);e.id=m[2];}this.dots=[0,1,2].map(()=>new Element(this)); }
  getElementById(id) { return this.nodes.get(id); } createElement(t) { return new Element(this,t); } querySelectorAll() { return this.dots; }
  addEventListener(k,fn) { (this.events[k] ||= []).push(fn); } ready() { this.readyState='interactive';(this.events.DOMContentLoaded||[]).forEach(f=>f()); }
}
function mounted(projector) {
  const clock=new Clock(),document=new Document(fs.readFileSync(path.join(root,'match-ui-p1/index.html'),'utf8'));
  const raf=new Map(),all=[],events={};let id=0;
  const env={performance:{now:()=>clock.now},setTimeout:clock.schedule,clearTimeout:clock.cancel,matchMedia:()=>({matches:false}),addEventListener(k,f){(events[k] ||= []).push(f);},requestAnimationFrame(f){all.push(f);raf.set(++id,f);return id;},cancelAnimationFrame(id){raf.delete(id);}};
  const demo=app.mount(document,fixture,env,{version:adapter.VERSION,adapter},{presentationMode:'continuous',clockContract:contract,motionProjector:projector});clock.tick(0);
  return {clock,document,demo,env,raf,all,events,el:id=>document.getElementById(id)};
}
// Synthetic projector tests only interface ownership; it is not a gameplay track or usable UI.
const projector = input => ({ actors:['ss','receiver','original-runner','batter-runner'].map(id=>({elementId:'actor-'+id,x:input.clock.playTime,y:0})),ball:{x:input.clock.playTime,y:0} });

test('legacy is default; continuous requires explicit mode, v0.2 route and contract',()=>{
  const c=model({presentationMode:undefined,clockContract:undefined});assert.equal(c.demo.getView().presentationMode,'legacy');assert.equal(c.demo.getView().presentationClock,null);
  for(const extra of [{clockContract:null},{clockContract:{VERSION:contract.VERSION}},{presentationMode:'typo'},{presentationRoute:{version:'match-ui-slice/0.1'}}])assert.equal(model(extra).demo.getState().phase,'DataError');
  assert.equal(contract.integrate(10,20,100),30);assert.equal(contract.integrate(10,200,100),100);assert.throws(()=>contract.integrate(0,-1,100));
  const plan=contract.createPlan(fixture.playback,scene.durationFor);assert.equal(plan.motionEnd,4550);assert.ok(Object.isFrozen(plan.intervals));
});
test('existing entry markup does not opt in; manual bootstrap prevents a second automatic mount',()=>{
  for(const name of ['match-ui-p1','manga-match-spike']){const html=fs.readFileSync(path.join(root,name,'index.html'),'utf8');assert.doesNotMatch(html,/MATCH_UI_BOOTSTRAP|clock-contract|presentationMode|continuous/);}
  const document=new Document(''),clock=new Clock(),ctx=vm.createContext({document,MATCH_UI_BOOTSTRAP:{autoMount:false},setTimeout:clock.schedule});
  for(const name of ['presentation.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,'match-ui-p1',name),'utf8'),ctx);
  document.ready();assert.equal(clock.tasks.size,0);assert.ok(ctx.MatchUIP1.mount);
});
test('readingHold progresses concurrently with motion, with a safe unpublished boundary',()=>{
  const c=begin();assert.equal(c.clock.tasks.size,1);const first=c.demo.getView().presentationClock;
  assert.equal(first.readingState.status,'readingHold');assert.equal(first.playTime,0);c.clock.tick(200);
  const a=c.demo.getView().presentationClock;assert.equal(a.playTime,200);assert.equal(a.readingState.elapsed,200);assert.ok(Object.isFrozen(a.readingState));
  assert.deepEqual(c.demo.getView().presentationClock,a);c.clock.tick(300);
  const b=c.demo.getView().presentationClock;assert.equal(b.playTime,450);assert.equal(b.waitingAtBoundary,true);assert.equal(b.currentSemanticBeat,'ballInPlay');assert.equal(b.readingState.elapsed,500);
  c.clock.tick(350);assert.equal(c.demo.getView().currentBeat.type,'approach');assert.equal(c.demo.getView().presentationClock.playTime,450);
  c.clock.tick(800);assert.equal(c.demo.getView().presentationClock.playTime,1250);assert.equal(c.demo.getView().presentationClock.readingState.remaining,0);assert.equal(c.demo.getView().currentBeat.type,'approach');
});
test('Pause and Resume preserve both coordinates without catch-up or another timer',()=>{
  const c=begin();c.clock.tick(100);c.demo.pause();const a=c.demo.getView().presentationClock;assert.equal(c.clock.tasks.size,0);c.clock.tick(5000);
  assert.equal(c.demo.getView().presentationClock.playTime,a.playTime);assert.deepEqual(c.demo.getView().presentationClock.readingState,a.readingState);
  c.demo.resume();assert.equal(c.clock.tasks.size,1);c.clock.tick(100);const b=c.demo.getView().presentationClock;assert.equal(b.playTime,a.playTime+100);assert.equal(b.readingState.elapsed,a.readingState.elapsed+100);
});
test('Next seeks all samplers to one legal boundary, guards rapid and stale events',()=>{
  const c=begin();const event=c.demo.getView().currentBeat.eventId,old=c.clock.callbacks.at(-1),epoch=c.demo.getView().presentationClock.epoch;
  assert.equal(c.demo.next('future'),false);assert.equal(c.demo.next(event),true);const v=c.demo.getView();assert.equal(v.currentBeat.type,'approach');assert.equal(v.presentationClock.playTime,450);assert.ok(v.presentationClock.epoch>epoch);
  old();assert.equal(c.demo.getView().currentBeat.type,'approach');assert.equal(c.demo.next(),false);assert.equal(c.demo.next(event),false);
});
test('motionComplete, resultRevealAllowed and resolutionConfirmed are distinct milestones',()=>{
  const c=begin();for(let i=0;i<5;i++)next(c);assert.equal(c.demo.getView().currentBeat.type,'contest');c.clock.tick(1100);
  const a=c.demo.getView();assert.equal(a.presentationClock.motionComplete,true);assert.equal(a.presentationClock.resultRevealAllowed,false);assert.equal(a.resolution,null);assert.strictEqual(a.scoreState,pair.decision.state);
  c.clock.tick(600);assert.equal(c.demo.getView().currentBeat.type,'result');assert.equal(c.demo.getView().presentationClock.resultRevealAllowed,true);assert.equal(c.demo.getView().presentationClock.resolutionConfirmed,false);
  c.clock.tick(1200);assert.equal(c.demo.getState().playbackStage,'awaitingConfirmation');assert.equal(c.clock.tasks.size,0);assert.equal(c.demo.getView().resolution,null);next(c);assert.strictEqual(c.demo.getView().resolution,pair.resolution);assert.equal(c.demo.getView().presentationClock.resolutionConfirmed,true);
});
test('Skip invalidates epoch; Replay reuses frozen DTOs, resets cursor and ignores old callbacks',()=>{
  const c=begin();c.clock.tick(100);const old=c.clock.callbacks.at(-1),epoch=c.demo.getView().presentationClock.epoch;
  assert.equal(c.demo.skip(),true);assert.equal(c.demo.skip(),false);assert.equal(c.demo.next(),false);assert.equal(c.demo.getState().playbackStage,'awaitingConfirmation');assert.ok(c.demo.getView().presentationClock.epoch>epoch);old();assert.equal(c.demo.getView().resolution,null);next(c);
  const result=c.demo.getView().resolution;assert.equal(c.demo.replay(),true);assert.equal(c.demo.getView().presentationClock.playTime,0);assert.equal(c.demo.getView().presentationClock.playbackRunId,2);assert.strictEqual(c.demo.getView().decision,pair.decision);old();assert.equal(c.demo.getView().currentBeat.type,'ballInPlay');
  c.demo.skip();next(c);assert.strictEqual(c.demo.getView().resolution,result);assert.equal(c.demo.getState().submissionCount,1);
});
test('accessible modes use paused static nodes and complete readable flow',()=>{
  for(const mode of ['reducedMotion','textMode']){const c=begin({[mode]:true});assert.equal(c.demo.getState().paused,true);assert.equal(c.clock.tasks.size,0);assert.equal(c.demo.getView().presentationClock.playTime,450);next(c);assert.equal(c.demo.getView().currentBeat.type,'approach');c.demo.skip();next(c);assert.ok(c.demo.getView().resolution);}
  const c=begin();c.clock.tick(100);c.demo.setTextMode(true);assert.equal(c.demo.getState().paused,true);assert.equal(c.clock.tasks.size,0);assert.equal(c.demo.getView().presentationClock.readingState.elapsed,100);c.clock.tick(5000);assert.equal(c.demo.getView().presentationClock.playTime,450);
});
test('Unsupported and Decision never expose motion tracks, future events or Resolution',()=>{
  for(const route of app.ROUTES.slice(1)){const c=model();assert.equal(c.demo.getView().presentationClock.currentSemanticBeat,null);assert.equal(c.demo.getView().currentBeat,null);c.demo.submit(route);c.clock.tick(60000);assert.equal(c.demo.getView().presentationClock.playTime,0);assert.equal(c.demo.getView().presentationClock.resultRevealAllowed,false);assert.equal(c.demo.getView().resolution,null);assert.equal(c.demo.getState().playbackRuns,0);}
});
test('one SVG writer, no legacy WA; projector receives only frozen legal data and same time for all actors',()=>{
  const inputs=[];const c=mounted(input=>{inputs.push(input);return projector(input);});c.demo.submit('secureFirstBaseOut');c.clock.tick(420);assert.equal(c.raf.size,1);c.clock.tick(100);const cb=[...c.raf.values()][0];c.raf.clear();cb();
  assert.ok(inputs.length>=2);assert.equal(inputs.at(-1).clock.playTime,100);assert.equal(inputs.at(-1).resolution,undefined);assert.equal(inputs.at(-1).decision,undefined);assert.ok(Object.isFrozen(inputs.at(-1)));
  for(const id of ['actor-ss','actor-receiver','actor-original-runner','actor-batter-runner','ball-marker'])assert.equal(c.el(id).attributes.transform,'translate(100 0)');
  assert.equal(c.el('field').dataset.motionOwner,'controller-projector');assert.equal(c.clock.tasks.size,1);
});
test('render callbacks cancel and fail epoch checks across Next, Skip, Replay, Restart and pagehide',()=>{
  const c=mounted(projector);c.demo.submit('secureFirstBaseOut');c.clock.tick(420);const old=c.all.at(-1);next(c);const mark=c.el('ball-marker').writes.length;old();assert.equal(c.el('ball-marker').writes.length,mark);assert.equal(c.raf.size,1);
  const beforeSkip=c.all.at(-1);c.demo.skip();assert.equal(c.raf.size,0);const writes=c.el('ball-marker').writes.length;beforeSkip();assert.equal(c.el('ball-marker').writes.length,writes);next(c);c.demo.replay();
  const oldRun=c.all.at(-1);c.demo.skip();next(c);c.demo.finish();c.demo.restart();const restarted=c.el('ball-marker').writes.length;oldRun();assert.equal(c.el('ball-marker').writes.length,restarted);assert.equal(c.demo.getView().presentationClock.playTime,0);assert.equal(c.raf.size,0);
  c.demo.submit('secureFirstBaseOut');c.clock.tick(420);const current=c.all.at(-1);c.events.pagehide.forEach(f=>f());assert.equal(c.raf.size,0);const ended=c.el('ball-marker').writes.length;current();assert.equal(c.el('ball-marker').writes.length,ended);
});
test('missing and invalid projectors fail closed before any actor position is written',()=>{
  for(const project of [undefined,()=>({actors:[],ball:{x:0,y:0}}),()=>({actors:[{elementId:'outs-label',x:0,y:0}],ball:{x:0,y:0}})]){
    const c=mounted(project);const before=c.el('actor-ss').writes.filter(([k])=>k==='transform').length;c.demo.submit('secureFirstBaseOut');c.clock.tick(420);assert.equal(c.el('field').dataset.trackStatus,'blocked');assert.equal(c.el('actors-layer').hidden,true);assert.equal(c.el('actor-ss').writes.filter(([k])=>k==='transform').length,before+1); // Submitting static pose only.
  }
});
test('manifest derives existing geometry and bindings; all three unresolved gaps remain unapproved',()=>{
  const m=tracks.createManifest(fixture,scene);assert.equal(tracks.validateManifest(m),true);assert.ok(Object.isFrozen(m.tracks[0].segments));assert.equal(m.readyForEndToEnd,false);
  assert.deepEqual(m.gaps.map(g=>[g.from,g.to]),[[[137,132],[128,123]],[[202,91],[170,56]],[[255,164],[294,215]]]);
  assert.deepEqual(m.tracks.slice(2).map(t=>t.sourceId),['school-development-29d536a2-player-03','regional-power-school-player-04','regional-power-school-player-09']);
  for(const t of m.tracks)for(const s of t.segments){assert.equal(s.newPresentationInterpolation,false);assert.ok(s.sources.length);assert.equal(s.involvesUnpublishedInformation,true);}
});
test('missing or falsely authorized gaps and every end-to-end/other-route activation fail closed',()=>{
  const m=tracks.createManifest(fixture,scene);assert.throws(()=>tracks.assertPlayable(m,'secureFirstBaseOut'),/Unapproved/);for(const r of app.ROUTES.slice(1))assert.throws(()=>tracks.assertPlayable(m,r),/Unsupported/);
  const bad=JSON.parse(JSON.stringify(m));bad.gaps.pop();assert.throws(()=>tracks.validateManifest(bad));const fake=JSON.parse(JSON.stringify(m));fake.gaps[0].authorized=true;assert.throws(()=>tracks.validateManifest(fake));
  assert.doesNotMatch(JSON.stringify(m),/metersPerSecond|raceMarginMs|successProbability/);assert.equal(contract.createPlan(fixture.playback,scene.durationFor).units,'illustrative-presentation-ms');
});
test('fixture, contract, entry/style, historical evidence and protected Production/Save source hashes unchanged',()=>{
  const e=JSON.parse(fs.readFileSync(path.join(root,'../docs/manga-motion-timing-spike-v0.1-evidence.json'),'utf8'));
  for(const file of ['prototype/match-ui-p1/fixture.js','prototype/match-ui-p1/presentation.js','prototype/match-ui-p1/index.html','prototype/match-ui-p1/style.css','prototype/manga-match-spike/index.html','prototype/manga-match-spike/manga.js','contracts/ss-decision-resolution-public-presentation-v0.2.cjs','save.js','match-situation-lifecycle.js']){
    const actual=crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,'..',file))).digest('hex');assert.equal(actual,e.integrity.baselineReadableHashes[file],file);
  }
});
