'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const fixture = require('../fixture.js');
const app = require('../app.js');
const presentation = require('../presentation.js');
const adapter = require('../presentation-v02.generated.js');
const generator = require('../generate-presentation-v02.cjs');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html'), css = read('style.css'), script = read('app.js'), asset = read('presentation-v02.generated.js');
const route = { version: 'match-ui-slice/0.2', adapter };
const views = adapter.connect(fixture);
const original = JSON.stringify(fixture);

class Clock {
  now = 0; id = 0; tasks = new Map(); callbacks = [];
  schedule = (fn, delay) => { const id = ++this.id; this.tasks.set(id, { at: this.now + delay, fn }); this.callbacks.push(fn); return id; };
  cancel = id => this.tasks.delete(id);
  tick(ms) { const end = this.now + ms; let guard = 0; for (;;) {
    const due = [...this.tasks.entries()].filter(([, task]) => task.at <= end).sort((a,b) => a[1].at-b[1].at)[0];
    if (!due) break; assert.ok(++guard < 1000); this.now = due[1].at; this.tasks.delete(due[0]); due[1].fn();
  } this.now = end; }
}
// DOM adapter only: no CSS layout, native key activation, zoom or Browser claim.
class Element {
  constructor(document, tag = 'div') { this.ownerDocument=document; this.tagName=tag.toUpperCase(); this.children=[]; this.attributes={}; this.dataset={}; this.listeners={}; this.hidden=false; this.disabled=false; this._text=''; this.classList={toggle(){}}; }
  set id(value) { this._id=value; this.ownerDocument.nodes.set(value,this); } get id() { return this._id; }
  set textContent(value) { this._text=String(value); this.children=[]; } get textContent() { return this._text+this.children.map(x=>x.textContent).join(''); }
  setAttribute(key,value) { this.attributes[key]=String(value); } removeAttribute(key) { delete this.attributes[key]; }
  append(...nodes) { this.children.push(...nodes); } replaceChildren(...nodes) { this._text=''; this.children=[...nodes]; }
  addEventListener(type,fn) { (this.listeners[type] ||= []).push(fn); }
  dispatch(type) { (this.listeners[type] || []).forEach(fn=>fn()); }
  click() { if (!this.disabled) this.dispatch('click'); }
  focus() { const previous=this.ownerDocument.activeElement; this.ownerDocument.activeElement=this; if(previous!==this) { previous?.dispatch('blur'); this.dispatch('focus'); } }
}
class Document {
  constructor() { this.nodes=new Map(); for (const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) {
    const el=new Element(this,m[1]); el.id=m[3]; el.hidden=/\bhidden\b/.test(m[2]);
  } this.dots=Array.from({length:3},()=>new Element(this,'i')); }
  getElementById(id) { return this.nodes.get(id); } createElement(tag) { return new Element(this,tag); }
  querySelectorAll(selector) { assert.equal(selector,'.out-dots i'); return this.dots; }
}
function model(options={}) { const clock=new Clock(); const demo=app.createDemo(fixture,{presentationRoute:route,schedule:clock.schedule,cancel:clock.cancel,now:()=>clock.now,...options}); demo.start(); return {demo,clock}; }
function rendered(reducedMotion=true) { const document=new Document(),clock=new Clock(); const demo=app.mount(document,fixture,{setTimeout:clock.schedule,clearTimeout:clock.cancel,performance:{now:()=>clock.now},matchMedia:()=>({matches:reducedMotion}),addEventListener(){}},route); clock.tick(0); return {demo,clock,document,el:id=>document.getElementById(id)}; }
function begin(ctx) { ctx.demo.submit('secureFirstBaseOut'); ctx.clock.tick(420); return ctx; }
function confirm(ctx) { ctx.clock.tick(151); return ctx.demo.next(ctx.demo.getView().currentBeat.eventId); }
const consequenceIds=['outs-change','score-change','selected-objective','achieved-outcome','verified-tradeoff-text','outcome-text','feedback-text'];
function noResult(ctx) { assert.equal(ctx.demo.getView().resolution,null); assert.equal(ctx.el('consequence-summary').hidden,true); consequenceIds.forEach(id=>assert.equal(ctx.el(id).textContent,'')); assert.equal(ctx.el('outs-label').textContent,'一出局'); assert.equal(ctx.el('bases-label').textContent,'一壘有人'); }

test('asset regenerates byte-for-byte through actual v0.2 constructors and source-aware validators',()=>{
  assert.equal(generator.generate(),asset);
  assert.equal(adapter.VERSION,'match-ui-slice/0.2');
  assert.deepEqual(adapter.provenance.validation,['createDecisionView','validateDecisionView','createResolutionView','validateResolutionView']);
  for(const [file,expected] of Object.entries(adapter.provenance.sourceHashes)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'../..',file))).digest('hex'),expected,file);
  const body=fs.readFileSync(path.join(root,'../../contracts/ss-decision-resolution-public-presentation-v0.2.cjs'),'utf8');
  assert.ok(asset.includes('(function (module) {\n'+body+'\n})(contractModule);'));
});
test('explicit v0.2 public route keeps v0.1 Playback separate and fails closed on missing or mismatched bridge',()=>{
  const {demo}=model(); assert.strictEqual(demo.getView().decision,views.decision); assert.equal(demo.getView().decision.schemaVersion,route.version);
  demo.destroy();
  for(const presentationRoute of [{version:route.version},{version:'unknown'},{version:route.version,adapter:{VERSION:'match-ui-slice/0.1'}}]) {
    const ctx=model({presentationRoute}); assert.equal(ctx.demo.getState().phase,'DataError'); assert.equal(ctx.demo.getView().decision,null);
  }
  const bad=structuredClone(fixture); bad.decision.matchId+='-other'; assert.throws(()=>adapter.connect(bad),/mismatch/);
  const ctx=begin(model({reducedMotion:true})); assert.strictEqual(ctx.demo.getView().currentBeat,fixture.playback[0]); assert.equal(ctx.demo.getView().currentBeat.schemaVersion,'match-ui-slice/0.1');
});
test('all-null observations preserve the exact public narrative in a single reading column',()=>{
  const ctx=rendered(); assert.ok(Object.values(views.decision.observations).every(x=>x===null));
  assert.equal(ctx.el('situation-text').textContent,views.decision.situationText); assert.equal(ctx.el('observations').hidden,true);
  assert.equal(ctx.el('observations').children.length,0);
  for(const cue of ['游擊守區','往你的左側','一壘跑者受迫往二壘','打者跑者正衝向一壘','二壘封殺窗口很緊','一壘出局窗口很緊']) assert.ok(ctx.el('situation-text').textContent.includes(cue));
  assert.ok(html.indexOf('id="match-overview"')<html.indexOf('id="context-panel"')); assert.ok(html.indexOf('id="context-panel"')<html.indexOf('id="choices"'));
  noResult(ctx);
});
test('four native choices show route, original objective and coarse risk without unsupported filtering',()=>{
  const ctx=rendered(); assert.equal(ctx.el('choices').children.length,4);
  views.decision.choices.forEach((choice,index)=>{
    const node=ctx.el('choices').children[index]; assert.equal(node.tagName,'BUTTON'); assert.equal(node.disabled,false);
    assert.equal(node.children[0].textContent,choice.routeLabel); assert.equal(node.children[1].textContent,choice.objectiveText);
    assert.equal(node.children[2].textContent,'風險 '+({low:'低',medium:'中',high:'高'})[choice.risk]);
    assert.equal(node.children[3].textContent,choice.label); node.focus(); noResult(ctx); assert.equal(ctx.el('executed-route').attributes.d,'');
  });
});
test('Decision adds no speed, success probability, best-answer or alternative-outcome claims',()=>{
  const ctx=rendered(); const text=ctx.el('situation-text').textContent+ctx.el('choices').textContent;
  assert.doesNotMatch(text,/km\/?h|成功率|最佳|完美|確定出局|本來可以|\d+%/i);
  assert.equal(views.decision.observations.ballPaceCueText,null); assert.equal(views.resolution.decisionFeedbackText,null); assert.equal(views.resolution.executionFeedbackText,null);
});
test('seven Playback beats reveal no v0.2 Resolution before the final confirmation',()=>{
  const ctx=begin(rendered()); for(let i=0;i<7;i++) { noResult(ctx); assert.equal(ctx.demo.getView().currentBeat.type,app.BEATS[i]);
    if(i<6) { assert.doesNotMatch(ctx.el('beat-text').textContent,/完成 1 個出局/); confirm(ctx); }
  }
  assert.equal(ctx.demo.getState().phase,'Playback'); noResult(ctx); confirm(ctx); assert.equal(ctx.demo.getState().phase,'Resolution');
});
test('autoplay retains readingHold and final awaitingConfirmation with exactly one timer',()=>{
  const ctx=begin(rendered(false)); assert.equal(ctx.clock.tasks.size,1); ctx.clock.tick(ctx.demo.getView().stageRemainingMs);
  assert.equal(ctx.demo.getState().playbackStage,'readingHold'); assert.equal(ctx.clock.tasks.size,1); noResult(ctx);
  ctx.clock.tick(60000); assert.equal(ctx.demo.getState().playbackStage,'awaitingConfirmation'); assert.equal(ctx.clock.tasks.size,0); noResult(ctx);
  confirm(ctx); assert.equal(ctx.demo.getState().phase,'Resolution'); assert.equal(ctx.clock.tasks.size,0);
});
test('Skip from animation or readingHold stops at the existing result confirmation and rejects rapid repeats',()=>{
  for(const hold of [false,true]) { const ctx=begin(rendered(false)); if(hold) ctx.clock.tick(ctx.demo.getView().stageRemainingMs);
    assert.equal(ctx.demo.skip(),true); assert.equal(ctx.demo.skip(),false); assert.equal(ctx.demo.next(),false); noResult(ctx);
    assert.equal(ctx.demo.getState().playbackStage,'awaitingConfirmation'); assert.equal(ctx.demo.getView().currentBeat.type,'result');
    assert.equal(ctx.clock.tasks.size,0); ctx.clock.tick(60000); noResult(ctx); assert.equal(confirm(ctx),true); assert.equal(ctx.demo.next(),false);
  }
});
test('Resolution shows 1 -> 2 outs, unchanged score, actual runner advance and original objective',()=>{
  const ctx=begin(rendered()); ctx.demo.skip(); confirm(ctx); const r=ctx.demo.getView().resolution;
  assert.strictEqual(r,views.resolution); assert.strictEqual(ctx.demo.getView().scoreState,r.state);
  assert.equal(ctx.el('consequence-summary').hidden,false); assert.equal(ctx.el('outs-change').textContent,'出局數 1 → 2');
  assert.equal(ctx.el('score-change').textContent,'比分 主 0 · 客 1（不變）');
  assert.equal(ctx.el('selected-objective').textContent,'原本目標：優先爭取打者出局。');
  assert.equal(ctx.el('achieved-outcome').textContent,'實際結果：打者出局，原一壘跑者推進二壘。');
  assert.equal(ctx.el('outs-label').textContent,'二出局'); assert.equal(ctx.el('bases-label').textContent,'二壘有人');
  assert.equal(ctx.el('home-score').textContent,'0'); assert.equal(ctx.el('away-score').textContent,'1');
});
test('batter retirement and original runner advancement retain separate identities and scene bindings',()=>{
  const ctx=begin(rendered()); ctx.demo.skip(); confirm(ctx); const r=views.resolution;
  const batter=r.runnerChanges.find(x=>x.from==='batter'), runner=r.runnerChanges.find(x=>x.from===1);
  assert.notEqual(batter.runnerId,runner.runnerId); assert.deepEqual(r.achievedOutcome.outRunnerIds,[batter.runnerId]); assert.deepEqual(r.achievedOutcome.advancedRunnerIds,[runner.runnerId]);
  assert.equal(ctx.el('actor-batter-runner').attributes['data-source-id'],batter.runnerId); assert.equal(ctx.el('actor-original-runner').attributes['data-source-id'],runner.runnerId);
  assert.equal(ctx.el('actor-original-runner').attributes.transform,'translate(170 56)');
});
test('original outcome, feedback and verified tradeoff survive in closed native details only after reveal',()=>{
  const ctx=begin(rendered()); ctx.demo.skip(); confirm(ctx);
  assert.equal(ctx.el('outcome-text').textContent,views.resolution.outcomeText); assert.equal(ctx.el('feedback-text').textContent,views.resolution.feedbackText);
  assert.equal(ctx.el('verified-tradeoff-text').textContent,views.resolution.verifiedTradeoffText); assert.equal(ctx.el('resolution-details').open,false);
  assert.match(html,/<details id="resolution-details"[^>]*hidden>/); assert.doesNotMatch(html,/<details id="resolution-details"[^>]*\bopen\b/);
});
for(const unsupported of app.ROUTES.slice(1)) test(unsupported+' remains selectable and yields no fake Playback or Resolution',()=>{
  const ctx=rendered(); ctx.el('choice-'+unsupported).click(); ctx.clock.tick(60000); assert.equal(ctx.demo.getState().phase,'Unsupported'); noResult(ctx);
  assert.equal(ctx.demo.getState().playbackRuns,0); assert.equal(ctx.demo.skip(),false); assert.equal(ctx.demo.replay(),false); ctx.el('back-to-decision').click(); assert.equal(ctx.document.activeElement.id,'choice-'+unsupported);
});
test('Pause / Resume retain remaining reading time; stale callbacks and fast clicks cannot double advance',()=>{
  const ctx=begin(rendered(false)); ctx.clock.tick(ctx.demo.getView().stageRemainingMs); ctx.clock.tick(80);
  const remaining=ctx.demo.getView().stageRemainingMs, stale=[...ctx.clock.callbacks]; ctx.demo.pause(); ctx.clock.tick(10000); stale.forEach(fn=>fn());
  assert.equal(ctx.demo.getView().stageRemainingMs,remaining); assert.equal(ctx.clock.tasks.size,0); ctx.demo.resume(); assert.equal(ctx.clock.tasks.size,1);
  const id=ctx.demo.getView().currentBeat.eventId; assert.equal(ctx.demo.next(id),true); assert.equal(ctx.demo.next(id),false); assert.equal(ctx.demo.getState().beatIndex,1);
  assert.equal(ctx.demo.submit('secureFirstBaseOut'),false); assert.equal(ctx.demo.getState().submissionCount,1); noResult(ctx);
});
test('Replay clears all consequence DOM, reuses frozen DTO references and never reconnects or settles',()=>{
  let connects=0; const ctx=model({reducedMotion:true,presentationRoute:{version:route.version,adapter:{VERSION:adapter.VERSION,connect(data){connects++; return adapter.connect(data);}}}});
  begin(ctx); ctx.demo.skip(); confirm(ctx); assert.equal(connects,1); assert.strictEqual(ctx.demo.getView().resolution,views.resolution);
  assert.equal(ctx.demo.replay(),true); assert.equal(ctx.demo.replay(),false); assert.equal(connects,1); assert.strictEqual(ctx.demo.getView().decision,views.decision);
  assert.strictEqual(ctx.demo.getView().currentBeat,fixture.playback[0]); assert.equal(ctx.demo.getView().resolution,null);
  ctx.demo.skip(); confirm(ctx); assert.strictEqual(ctx.demo.getView().resolution,views.resolution); assert.equal(connects,1);
  const dom=begin(rendered()); dom.demo.skip(); confirm(dom); dom.el('resolution-details').open=true; dom.demo.replay(); noResult(dom); assert.equal(dom.el('resolution-details').open,false); assert.equal(dom.el('result-announcement').textContent,'');
  function frozen(x){if(x&&typeof x==='object'){assert.ok(Object.isFrozen(x));Object.values(x).forEach(frozen);}} frozen(views);
});
test('legacy v0.1 consumers remain explicit and the original fixture and Production source hashes are unchanged',()=>{
  const ctx=model({presentationRoute:{version:'match-ui-slice/0.1'}}); assert.strictEqual(ctx.demo.getView().decision,fixture.decision); assert.equal(JSON.stringify(fixture),original);
  const foundation=JSON.parse(fs.readFileSync(path.join(root,'../../docs/ss-decision-resolution-public-presentation-contract-v0.2-evidence.json'),'utf8'));
  for(const x of [...foundation.sourceEvidence,...foundation.artifacts]) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'../..',x.file))).digest('hex'),x.sha256);
});
test('classic file-compatible scripts bootstrap with no network, require, confirmations or runtime projection calls',()=>{
  const document=new Document(),clock=new Clock(); document.readyState='complete';
  const context=vm.createContext({document,setTimeout:clock.schedule,clearTimeout:clock.cancel,matchMedia:()=>({matches:true}),addEventListener(){}});
  for(const name of [...html.matchAll(/<script[^>]+src="\.\/([^"]+)"/g)].map(x=>x[1])) { assert.ok(fs.existsSync(path.join(root,name))); vm.runInContext(read(name),context,{filename:name}); }
  clock.tick(0); assert.equal(document.getElementById('demo').dataset.presentationVersion,route.version); assert.equal(document.getElementById('demo').dataset.phase,'Decision');
  assert.equal(context.MATCH_UI_P23_PRESENTATION.VERSION,route.version); assert.equal(context.MATCH_UI_P23_PRESENTATION.createResolutionView,undefined);
  const browserTail=asset.split('})(contractModule);')[1]; assert.doesNotMatch(browserTail,/createDecisionView\s*\(|createResolutionView\s*\(|settlementApplied|beforeRunners|resultConfirmation/);
  assert.doesNotMatch(asset,/\brequire\s*\(|\b(?:fetch|XMLHttpRequest|WebSocket|importScripts)\s*\(|\beval\s*\(|new Function/);
  assert.doesNotMatch(html,/type="module"|https?:\/\/|<canvas/); assert.match(html,/connect-src 'none'/); assert.doesNotMatch(css,/@import|url\(/);
});
test('spatial and marker rules still use the unchanged scene renderer and native responsive controls',()=>{
  assert.equal(presentation.focusLayoutFor('SS').side,'left'); assert.equal(presentation.focusLayoutFor('2B').side,'right');
  assert.equal([...html.matchAll(/class="actor-body" r="8.5"/g)].length,4); assert.doesNotMatch(html.match(/<g id="base-first"[\s\S]*?<\/g>/)[0],/occupant|circle/);
  assert.match(css,/\.base\.occupied:not\(#base-first\) path/); assert.match(css,/@media\(max-width:650px\)/); assert.match(css,/:focus-visible/);
  const ctx=begin(rendered(false)); for(let i=0;i<3;i++) confirm(ctx); const scene=presentation.project(ctx.demo.getView());
  assert.equal(ctx.demo.getView().currentBeat.type,'throw'); assert.deepEqual(scene.movements.find(x=>x.key==='actor-receiver').to,presentation.POINTS.first); assert.equal(scene.focus.visible,false);
  assert.doesNotMatch(script,/addEventListener\(["']key(?:down|up|press)/);
});
