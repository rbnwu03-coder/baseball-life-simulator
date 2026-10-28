'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const shared = path.resolve(root, '../match-ui-p1');
const read = file => fs.readFileSync(file, 'utf8');
const html = read(path.join(root, 'index.html'));
const css = read(path.join(root, 'manga.css'));
const mangaSource = read(path.join(root, 'manga.js'));
const baseHtml = read(path.join(shared, 'index.html'));
const manga = require('../manga.js');
const fixture = require('../../match-ui-p1/fixture.js');
const adapter = require('../../match-ui-p1/presentation-v02.generated.js');
const app = require('../../match-ui-p1/app.js');
const scene = require('../../match-ui-p1/presentation.js');
const views = adapter.connect(fixture);
const baseline = JSON.parse(read(path.resolve(root, '../../docs/match-ui-p2.3-decision-consequence-presentation-integration-v0.1-evidence.json')));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
// Immutable historical evidence anchors, recorded in the UI-P2.4A baseline.
// app.js evolves under explicit authorization; its compatibility is behavioral below.
const historicalEvidenceHashes = {
  'docs/match-ui-p2.3-decision-consequence-presentation-integration-v0.1-evidence.json': '605cfb8ce1a6cda7b3711ecd1e62d59ed479c66d1eee6698788c2d04a57566cf',
  'docs/manga-match-presentation-spike-v0.1-evidence.json': 'c317d133084d0ef618a3729809dff8a4b6a3fa8c31985289ca4235f8fe2ab1cf'
};

class Clock {
  now=0; id=0; tasks=new Map(); callbacks=[];
  schedule=(fn,delay)=>{const id=++this.id;this.tasks.set(id,{at:this.now+delay,fn});this.callbacks.push(fn);return id;};
  cancel=id=>this.tasks.delete(id);
  tick(ms){const end=this.now+ms;let guard=0;for(;;){const due=[...this.tasks].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;assert.ok(++guard<1000);this.now=due[1].at;this.tasks.delete(due[0]);due[1].fn();}this.now=end;}
}
// Scope: DOM/MutationObserver adapter; no CSS layout, native input or Browser claim.
class Element {
  constructor(document,tag='div'){
    this.ownerDocument=document;this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.listeners={};this._text='';this.hidden=false;this.disabled=false;
    this.dataset=new Proxy({}, {set:(obj,key,value)=>{obj[key]=String(value);document.notify('data-'+key.replace(/[A-Z]/g,x=>'-'+x.toLowerCase()));return true;}});
    this.classes=new Set();this.classList={toggle:(key,on)=>on?this.classes.add(key):this.classes.delete(key)};
  }
  set id(value){this._id=value;this.ownerDocument.nodes.set(value,this);} get id(){return this._id;}
  set textContent(value){this._text=String(value);this.children=[];}get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
  setAttribute(key,value){this.attributes[key]=String(value);this.ownerDocument.notify(key);}removeAttribute(key){delete this.attributes[key];}
  append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this._text='';this.children=[...nodes];}
  addEventListener(type,fn){(this.listeners[type] ||= []).push(fn);}dispatch(type){(this.listeners[type] || []).forEach(fn=>fn());}
  click(){if(!this.disabled)this.dispatch('click');}
  focus(){const previous=this.ownerDocument.activeElement;this.ownerDocument.activeElement=this;if(previous!==this){previous?.dispatch('blur');this.dispatch('focus');}}
  animate(frames,options){const a={frames,options,playState:'running',currentTime:0,cancel(){this.playState='idle';},pause(){this.playState='paused';},play(){this.playState='running';}};(this.animations ||= []).push(a);return a;}
}
class Document {
  constructor(source=html){
    this.nodes=new Map();this.observers=[];this.events=new Map();this.activeElement=null;this.readyState='loading';
    for(const m of source.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)){const el=new Element(this,m[1]);el.id=m[3];el.hidden=/\bhidden\b/.test(m[2]);}
    this.dots=Array.from({length:3},()=>new Element(this,'i'));
  }
  getElementById(id){return this.nodes.get(id);}createElement(tag){return new Element(this,tag);}querySelectorAll(s){assert.equal(s,'.out-dots i');return this.dots;}
  addEventListener(type,fn){(this.events.get(type)||this.events.set(type,[]).get(type)).push(fn);}
  ready(){this.readyState='interactive';(this.events.get('DOMContentLoaded')||[]).forEach(fn=>fn());}
  notify(name){for(const o of this.observers)if(o.active&&o.options.attributeFilter.includes(name))o.pending=true;}
  flush(){let guard=0;while(this.observers.some(o=>o.active&&o.pending)){assert.ok(++guard<20,'observer must not loop on its own writes');for(const o of this.observers)if(o.active&&o.pending){o.pending=false;o.callback([]);}}}
}
function environment(document,clock,reduced=false){
  const media={matches:reduced,listeners:new Set(),addEventListener(type,fn){this.listeners.add(fn);},removeEventListener(type,fn){this.listeners.delete(fn);}};
  return {document,performance:{now:()=>clock.now},setTimeout:clock.schedule,clearTimeout:clock.cancel,matchMedia:()=>media,media,
    events:{},addEventListener(type,fn){(this.events[type] ||= []).push(fn);},
    MutationObserver:class{constructor(callback){this.callback=callback;document.observers.push(this);}observe(target,options){this.target=target;this.options=options;this.active=true;}disconnect(){this.active=false;}}};
}
function mounted(reduced=false){const document=new Document(),clock=new Clock(),env=environment(document,clock,reduced);
  const demo=app.mount(document,fixture,env,{version:adapter.VERSION,adapter});const dispose=manga.attach(document,env);clock.tick(0);document.flush();
  return {document,clock,env,demo,dispose,el:id=>document.getElementById(id),flush:()=>document.flush()};}
function click(ctx,id,delay=0){ctx.el(id).click();ctx.clock.tick(delay);ctx.flush();}
function next(ctx){ctx.clock.tick(151);click(ctx,'next-beat');}
function assertUnrevealed(ctx){for(const id of ['outcome-text','feedback-text','selected-objective','achieved-outcome','outs-change','score-change','verified-tradeoff-text'])assert.equal(ctx.el(id).textContent,'',id);assert.equal(ctx.el('consequence-summary').hidden,true);assert.equal(ctx.el('outs-label').textContent,'一出局');assert.equal(ctx.el('bases-label').textContent,'一壘有人');}
const unit=ctx=>ctx.el('demo').dataset.mangaUnit;
function svg(source){return source.slice(source.indexOf('<svg id="field"'),source.indexOf('<p id="field-scene-status"'));}

test('five units map only legal current phases/beats; Decision and Unsupported ignore future stage input',()=>{
  assert.equal(Object.keys(manga.units).length,5);
  assert.deepEqual(Object.keys(manga.beatUnits),app.BEATS);
  assert.deepEqual(app.BEATS.map(b=>manga.frameFor('Playback',b).unit),['wide','fielding','fielding','action','action','action','impact']);
  for(const p of ['Decision','Submitting','Unsupported'])for(const s of [...app.BEATS,'resolution'])assert.equal(manga.frameFor(p,s).unit,'wide');
  assert.equal(manga.frameFor('Resolution','resolution').unit,'consequence');
  for(const p of ['Loading','DataError','Continue','unknown'])assert.equal(manga.frameFor(p,'resolution'),null);
  assert.equal(manga.frameFor('Playback','resolution'),null);assert.equal(manga.frameFor('Resolution','result'),null);assert.equal(manga.frameFor('Playback','toString'),null);
  assert.ok(Object.isFrozen(manga.units));assert.ok(Object.isFrozen(manga.frameFor('Decision','result')));
});
test('independent classic-script entry loads actual shared assets offline with the same public DTOs',()=>{
  for(const entry of [baseHtml,html])assert.doesNotMatch(entry,/MATCH_UI_BOOTSTRAP|clock-contract|presentationMode|continuous/);
  const document=new Document(),clock=new Clock(),env=environment(document,clock,true),context=vm.createContext(env);
  const sources=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(sources,['../match-ui-p1/fixture.js','../match-ui-p1/presentation-v02.generated.js','../match-ui-p1/presentation.js','../match-ui-p1/app.js','./manga.js']);
  for(const source of sources){const file=path.resolve(root,source);assert.ok(fs.existsSync(file));vm.runInContext(read(file),context,{filename:source});}
  document.ready();clock.tick(0);document.flush();
  assert.equal(document.getElementById('demo').dataset.phase,'Decision');assert.equal(document.getElementById('demo').dataset.presentationVersion,'match-ui-slice/0.2');assert.equal(document.getElementById('demo').dataset.mangaUnit,'wide');
  const pair=context.MATCH_UI_P23_PRESENTATION.connect(context.MATCH_UI_P1_FIXTURE);
  assert.equal(JSON.stringify(pair),JSON.stringify(views));assert.equal(JSON.stringify(context.MATCH_UI_P1_FIXTURE),JSON.stringify(fixture));
  assert.equal(document.getElementById('choices').children.length,4);assert.equal(document.observers.length,1);assert.equal(clock.tasks.size,0);
  assert.match(html,/connect-src 'none'/);assert.doesNotMatch(html,/https?:\/\/|type="module"|<iframe|<canvas/);assert.doesNotMatch(css,/@import|url\(/);
  assert.doesNotMatch(mangaSource,/\b(?:setTimeout|setInterval|requestAnimationFrame|fetch|require|eval)\s*\(|createDemo\s*\(|\.mount\s*\(|\.connect\s*\(/);
  env.events.pagehide.forEach(fn=>fn());assert.equal(document.observers[0].active,false);
});
test('actual shared Controller drives all five units; controls retain focus and every result gate remains intact',()=>{
  const ctx=mounted(true);assert.strictEqual(ctx.demo.getView().decision,views.decision);assert.equal(unit(ctx),'wide');
  assert.equal(ctx.demo.getView().presentationMode,'legacy');assert.equal(ctx.demo.getView().presentationClock,null);
  assert.equal(ctx.el('situation-text').textContent,views.decision.situationText);assert.equal(ctx.el('observations').hidden,true);assertUnrevealed(ctx);
  views.decision.choices.forEach((c,i)=>{const button=ctx.el('choices').children[i];assert.equal(button.tagName,'BUTTON');assert.equal(button.children[0].textContent,c.routeLabel);assert.equal(button.children[1].textContent,c.objectiveText);assert.equal(button.disabled,false);});
  click(ctx,'choice-secureFirstBaseOut',420);ctx.el('next-beat').focus();const control=ctx.el('next-beat');
  const expected=['wide','fielding','fielding','action','action','action','impact'];
  for(let i=0;i<7;i++){
    assert.equal(ctx.demo.getView().presentationMode,'legacy');assert.equal(ctx.demo.getView().presentationClock,null);
    assert.equal(unit(ctx),expected[i]);assert.strictEqual(ctx.demo.getView().currentBeat,fixture.playback[i]);assert.strictEqual(ctx.demo.getView().scoreState,views.decision.state);assertUnrevealed(ctx);
    assert.strictEqual(ctx.el('next-beat'),control);assert.strictEqual(ctx.document.activeElement,control);
    if(i<6)next(ctx);
  }
  ctx.clock.tick(60000);ctx.flush();assert.equal(unit(ctx),'impact');assertUnrevealed(ctx);next(ctx);
  assert.equal(unit(ctx),'consequence');assert.strictEqual(ctx.demo.getView().resolution,views.resolution);
  assert.equal(ctx.el('outs-change').textContent,'出局數 1 → 2');assert.equal(ctx.el('score-change').textContent,'比分 主 0 · 客 1（不變）');assert.equal(ctx.el('achieved-outcome').textContent,'實際結果：打者出局，原一壘跑者推進二壘。');
  assert.equal(ctx.el('actor-batter-runner').attributes['data-source-id'],views.resolution.achievedOutcome.outRunnerIds[0]);assert.equal(ctx.el('actor-original-runner').attributes['data-source-id'],views.resolution.achievedOutcome.advancedRunnerIds[0]);
});
test('Skip, reading holds, Pause and Replay use shared timing and cached results without another submission',()=>{
  const ctx=mounted();click(ctx,'choice-secureFirstBaseOut',420);assert.equal(ctx.clock.tasks.size,1);
  assert.equal(ctx.demo.getView().presentationMode,'legacy');assert.equal(ctx.demo.getView().presentationClock,null);
  assert.equal(ctx.demo.getState().playbackStage,'animation');
  ctx.clock.tick(ctx.demo.getView().stageRemainingMs);ctx.flush();assert.equal(ctx.demo.getState().playbackStage,'readingHold');
  assert.equal(ctx.demo.getView().beatRemainingMs,0);assert.equal(ctx.demo.getView().beatElapsedMs,ctx.demo.getView().beatDurationMs);
  ctx.clock.tick(75);click(ctx,'toggle-playback');const left=ctx.demo.getView().stageRemainingMs;assert.equal(ctx.clock.tasks.size,0);ctx.clock.tick(10000);ctx.flush();assert.equal(ctx.demo.getView().stageRemainingMs,left);
  click(ctx,'toggle-playback');assert.equal(ctx.clock.tasks.size,1);click(ctx,'skip-playback');assert.equal(unit(ctx),'impact');assert.equal(ctx.demo.getState().playbackStage,'awaitingConfirmation');assert.equal(ctx.clock.tasks.size,0);assertUnrevealed(ctx);
  click(ctx,'skip-playback');click(ctx,'next-beat');assertUnrevealed(ctx);next(ctx);assert.equal(unit(ctx),'consequence');const result=ctx.demo.getView().resolution;
  click(ctx,'replay-demo');assert.equal(unit(ctx),'wide');assertUnrevealed(ctx);assert.strictEqual(ctx.demo.getView().currentBeat,fixture.playback[0]);
  click(ctx,'skip-playback');next(ctx);assert.strictEqual(ctx.demo.getView().resolution,result);assert.equal(ctx.demo.getState().submissionCount,1);assert.equal(ctx.demo.getState().replayRuns,1);
});
test('all three Unsupported choices retain intent only; stale cosmetic updates cannot fabricate an outcome',()=>{
  for(const route of app.ROUTES.slice(1)){
    const ctx=mounted(true);click(ctx,'choice-'+route,60000);assert.equal(ctx.demo.getState().phase,'Unsupported');assert.equal(unit(ctx),'wide');assertUnrevealed(ctx);
    assert.equal(ctx.demo.getState().playbackRuns,0);assert.equal(ctx.demo.getView().currentBeat,null);assert.equal(ctx.demo.skip(),false);assert.equal(ctx.demo.replay(),false);
    ctx.el('field').dataset.stage='result';ctx.flush();assert.equal(unit(ctx),'wide');assertUnrevealed(ctx);
    click(ctx,'back-to-decision');assert.equal(ctx.document.activeElement.id,'choice-'+route);assert.equal(ctx.el('choices').children.length,4);
  }
});
test('Reduced Motion and text mode have full text/controls, no close-up requirement and safe mode changes',()=>{
  for(const mode of ['reduced','text']){
    const ctx=mounted(mode==='reduced');if(mode==='text')click(ctx,'toggle-text-mode');click(ctx,'choice-secureFirstBaseOut',420);
    assert.equal(ctx.demo.getState().paused,true);assert.equal(ctx.clock.tasks.size,0);next(ctx);
    assert.equal(unit(ctx),'fielding');assert.equal(ctx.el('focus-layer').hidden,true);assert.match(ctx.el('manga-guide').textContent,/逐段閱讀/);assert.ok(ctx.el('beat-text').textContent);
    click(ctx,'skip-playback');assertUnrevealed(ctx);next(ctx);assert.equal(unit(ctx),'consequence');assert.equal(ctx.el('feedback-text').textContent,views.resolution.feedbackText);
  }
  const ctx=mounted();click(ctx,'choice-secureFirstBaseOut',420);next(ctx);ctx.env.media.matches=true;ctx.env.media.listeners.forEach(fn=>fn({matches:true}));ctx.flush();assert.match(ctx.el('manga-guide').textContent,/逐段閱讀/);assert.equal(ctx.demo.getState().paused,true);
  ctx.dispose();ctx.el('demo').dataset.phase='Resolution';ctx.el('field').dataset.stage='resolution';ctx.flush();assert.equal(unit(ctx),'fielding');
});
test('purposeful outer frames preserve full SVG, same markers, left SS focus and receiver/runner choreography',()=>{
  assert.equal(svg(html),svg(baseHtml));assert.equal(scene.focusLayoutFor('SS').side,'left');assert.equal(scene.focusLayoutFor('2B').side,'right');
  assert.doesNotMatch(css,/position\s*:\s*(?:absolute|fixed)|clip-path|overflow\s*:\s*hidden|\.actor|#base-first|player-focus|#focus-layer|@keyframes|animation\s*:|transition\s*:/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);assert.match(css,/max-width:700px/);assert.match(css,/prefers-reduced-motion:reduce/);
  const ctx=mounted();click(ctx,'choice-secureFirstBaseOut',420);next(ctx);assert.equal(ctx.el('focus-layer').attributes['data-side'],'left');assert.equal(ctx.el('focus-layer').hidden,false);next(ctx);next(ctx);
  assert.equal(ctx.demo.getView().currentBeat.type,'throw');const movement=ctx.el('actor-receiver').animations.at(-1);assert.deepEqual(movement.frames.at(-1),{transform:'translate(268px,154px)'});
  assert.equal(ctx.el('actor-receiver').attributes.transform,'translate(268 154)');assert.equal(ctx.el('focus-layer').hidden,true);
  assert.notEqual(ctx.el('actor-original-runner').attributes['data-actor-key'],ctx.el('actor-batter-runner').attributes['data-actor-key']);
});
test('immutable UI-P2.3 sources and historical evidence retain fixed bytes; app compatibility uses Legacy behavior guards',()=>{
  // UI-P2.4A authorized app.js changes. Keep every other artifact byte guard;
  // default Legacy, seven beats, reading, reveal and interactions are checked above,
  // with explicit Continuous opt-in independently covered by Foundation tests.
  const appPath='prototype/match-ui-p1/app.js';
  assert.equal(baseline.artifacts.find(x=>x.file===appPath).sha256,'2e5f09ae4a590aab996f0e8ecba60c5bf2b4fe2f8fe9b9f5ecc97f8dae504246');
  const paths=new Map(baseline.artifacts.filter(x=>x.file!==appPath).map(x=>[x.file,x.sha256]));
  for(const [file,sha] of Object.entries(historicalEvidenceHashes))paths.set(file,sha);
  for(const name of ['fixture.js','presentation.js'])paths.set('prototype/match-ui-p1/'+name,baseline.integrity.afterExistingReadableHashes['prototype/match-ui-p1/'+name]);
  paths.set('contracts/ss-decision-resolution-public-presentation-v0.2.cjs',baseline.integrity.afterExistingReadableHashes['contracts/ss-decision-resolution-public-presentation-v0.2.cjs']);
  for(const [file,sha] of paths)assert.equal(hash(path.resolve(root,'../..',file)),sha,file);
  assert.match(baseHtml,/<title>棒球人生 · Match UI-P2.3/);assert.doesNotMatch(baseHtml,/manga-match-spike|manga\.js|manga\.css/);
});
