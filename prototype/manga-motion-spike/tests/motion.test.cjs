'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const app=require('../../match-ui-p1/app.js'),fixture=require('../../match-ui-p1/fixture.js'),presentation=require('../../match-ui-p1/presentation.js'),adapter=require('../../match-ui-p1/presentation-v02.generated.js');
const clock=require('../clock-contract.js'),timing=require('../timing.js'),tracks=require('../tracks.js'),sampler=require('../sampler.js');
const manifest=tracks.createPlayableManifest(fixture,presentation),project=sampler.createProjector(manifest,tracks),root=path.resolve(__dirname,'../../..');
// Reuse the existing isolated DOM/clock adapter without executing or altering its tests.
const helperPath=path.join(__dirname,'foundation.test.cjs');
const helperSource=fs.readFileSync(helperPath,'utf8').split("test('legacy is default;")[0];
const localRequire=createRequire(helperPath);
const context={require:p=>p==='../clock-contract.js'?clock.withRemapping(timing):localRequire(p),__dirname};
vm.runInNewContext(helperSource+'\nglobalThis.helpers={Clock,mounted,Document};',context,{filename:helperPath});
const {Clock,mounted}=context.helpers;
function model(extra={},slow=true){const timer=new Clock();const demo=app.createDemo(fixture,{presentationMode:'continuous',clockContract:clock.withRemapping(timing,slow),presentationRoute:{version:adapter.VERSION,adapter},now:()=>timer.now,schedule:timer.schedule,cancel:timer.cancel,...extra});demo.start();return{timer,demo};}
function begin(extra,slow){const c=model(extra,slow);c.demo.submit('secureFirstBaseOut');c.timer.tick(420);return c;}
function frame(c){const v=c.demo.getView();return project({clock:v.presentationClock,phase:v.phase,currentBeat:v.motionBeat||v.currentBeat});}
const point=(f,id)=>id==='ball-marker'?f.ball:f.actors.find(a=>a.elementId===id);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function sample(t,phase='Playback'){let i=0;while(i<5&&t>=timing.boundaries[i+1])i++;return project({phase,clock:{playTime:t,revealPolicy:manifest.revealPolicy,motionMilestone:'motion:'+app.BEATS[i<0?5:i],resolutionConfirmed:phase==='Resolution'}});}
function next(c){c.timer.tick(151);return c.demo.next(c.demo.getView().currentBeat.eventId);}

test('three offline entries isolate opt-in and share identical original SVG',()=>{
 const old=['match-ui-p1','manga-match-spike'].map(p=>fs.readFileSync(path.join(root,'prototype',p,'index.html'),'utf8'));const html=fs.readFileSync(path.join(root,'prototype/manga-motion-spike/index.html'),'utf8');
 old.forEach(h=>assert.doesNotMatch(h,/presentationMode|clock-contract|continuous/));const svg=h=>h.match(/<svg id="field"[\s\S]*?<\/svg>\s*<p id="field-scene-status"/)[0];old.forEach(h=>assert.equal(svg(h),svg(html)));
 assert.match(html,/\.\/motion.js/);assert.doesNotMatch(html,/https?:|fetch\(|phaser/i);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'prototype/manga-motion-spike/motion.js'),'utf8'),/requestAnimationFrame|setTimeout|\.animate\(/);
});
test('smooth remapping is monotonic, invertible and preserves every endpoint in both profiles',()=>{
 for(const slow of [false,true])for(let t=0;t<=5450;t+=7.3)assert.ok(Math.abs(timing.toPlay(timing.toWall(t,slow),slow)-t)<1e-8);
 for(const b of timing.boundaries.slice(1,-1))assert.ok(Math.abs(timing.rateAt(b-1e-4)-timing.rateAt(b+1e-4))<1e-5);
 assert.ok(timing.slowWallEnd>4550);assert.equal(timing.rateAt(1000),.65);assert.equal(timing.rateAt(2000),.5);
 for(const t of timing.boundaries){const a=sample(t),b=sample(timing.toPlay(timing.toWall(t)));for(const p of a.actors)assert.ok(distance(p,point(b,p.elementId))<1e-8);}
});
test('manifest 0.2 retains the unapproved historical inventory and validates actual continuity/source/reveal',()=>{
 assert.equal(tracks.validatePlayable(manifest),true);assert.equal(manifest.legacyInventory.version,'ss63-bounded-tracks/0.1');assert.ok(manifest.legacyInventory.gaps.every(g=>!g.authorized));assert.equal(manifest.gapPolicies.length,3);
 for(const t of manifest.tracks){for(const s of t.segments){assert.ok(s.sources.length);assert.match(s.authorization,/UI-P2.4B/);}assert.equal(t.exit.reveal,'Resolution-confirmed');}
 for(const bad of [JSON.parse(JSON.stringify(manifest)),{...manifest,tracks:[]},{...manifest,authority:'authorized=true'}])assert.throws(()=>tracks.validatePlayable(bad));
 for(const route of app.ROUTES.slice(1))assert.throws(()=>tracks.requirePlayable(manifest,route));
 const changed=JSON.parse(JSON.stringify(fixture));changed.resolution.runnerChanges.find(c=>c.from===1).to=3;assert.throws(()=>tracks.createPlayableManifest(changed,presentation));
});
test('all five positions are continuous at every motion boundary and confirmation boundary',()=>{
 for(const t of [...timing.boundaries.slice(1),5450]){const a=sample(Math.max(0,t-1e-5),t>4550?'Resolution':'Playback');const b=sample(t,t>=4550?'Resolution':'Playback');for(const p of [...a.actors,a.ball])assert.ok(distance(p,point(b,p.elementId))<1e-4,p.elementId+' at '+t);}
});
test('ball gap A joins incoming to fielding continuously; no fabricated bounce or quality',()=>{
 assert.deepEqual([sample(450).ball.x,sample(450).ball.y],[137,132]);assert.deepEqual([sample(1550).ball.x,sample(1550).ball.y],[128,123]);assert.deepEqual([sample(2850).ball.x,sample(2850).ball.y],[268,154]);
 assert.doesNotMatch(JSON.stringify(manifest),/metersPerSecond|raceMarginMs|successProbability/);
});
test('R1 and BR continue across reading boundaries while a single Controller timer owns time',()=>{
 const c=begin();const a=frame(c);c.timer.tick(500);const v=c.demo.getView();assert.equal(v.currentBeat.type,'ballInPlay');assert.equal(v.playbackStage,'readingHold');assert.equal(v.presentationClock.waitingAtBoundary,false);assert.ok(v.presentationClock.playTime>450);assert.equal(c.timer.tasks.size,1);
 const b=frame(c);for(const id of ['actor-original-runner','actor-batter-runner'])assert.ok(distance(point(a,id),point(b,id))>0);
 const snapshots=[];for(let i=0;i<60;i++){c.timer.tick(100);const v=c.demo.getView();if(v.phase==='Playback'){snapshots.push(v);assert.equal(v.resolution,null);assert.equal(v.scoreState.outs,1);assert.equal(c.timer.tasks.size,1);}}
 assert.ok(snapshots.some(v=>v.motionBeat.type!==v.currentBeat.type));assert.ok(snapshots.every(v=>v.motionRevealedBeats.every(e=>e.type!=='result')));
});
test('slow motion changes only shared clock speed; fixed time sampling and normal comparison are deterministic',()=>{
 const fast=begin({},false),slow=begin({},true);fast.timer.tick(2000);slow.timer.tick(2000);assert.ok(fast.demo.getView().presentationClock.playTime>slow.demo.getView().presentationClock.playTime);
 const v=slow.demo.getView(),input={clock:v.presentationClock,phase:v.phase,currentBeat:v.motionBeat};assert.deepEqual(project(input),project(input));assert.equal(frame(slow).playTime,v.presentationClock.playTime);
});
test('Pause Resume freezes every actor and both coordinates without catch-up',()=>{
 const c=begin();c.timer.tick(1234);c.demo.pause();const a=frame(c),read=c.demo.getView().presentationClock.readingState.elapsed;c.timer.tick(10000);assert.deepEqual(frame(c),a);assert.equal(c.demo.getView().presentationClock.readingState.elapsed,read);assert.equal(c.timer.tasks.size,0);c.demo.resume();assert.deepEqual(frame(c),a);c.timer.tick(70);assert.ok(frame(c).playTime>a.playTime);assert.equal(c.timer.tasks.size,1);
});
test('Next never rewinds an ahead motion cursor or crosses result confirmation',()=>{
 const c=begin();c.timer.tick(500);const p=frame(c).playTime;assert.equal(c.demo.next('stale'),false);assert.equal(c.demo.next(c.demo.getView().currentBeat.eventId),true);assert.ok(frame(c).playTime>=p);assert.equal(c.demo.next(),false);while(c.demo.getView().currentBeat.type!=='result')next(c);assert.equal(c.demo.getView().resolution,null);assert.equal(c.demo.getView().scoreState.outs,1);
});
test('gap B arrival and gap C retirement require confirmation, with unchanged official occupancy until Resolution',()=>{
 const before=sample(4550);assert.notDeepEqual([point(before,'actor-original-runner').x,point(before,'actor-original-runner').y],[170,56]);assert.notDeepEqual([point(before,'actor-batter-runner').x,point(before,'actor-batter-runner').y],[294,215]);
 assert.throws(()=>project({phase:'Decision',clock:{playTime:5000}}));assert.throws(()=>project({phase:'Resolution',clock:{playTime:5000,revealPolicy:manifest.revealPolicy,resolutionConfirmed:false}}));
 const c=begin();c.timer.tick(20000);assert.equal(c.demo.getView().currentBeat.type,'result');assert.equal(c.demo.getState().playbackStage,'awaitingConfirmation');assert.equal(c.demo.getView().resolution,null);assert.equal(c.demo.getView().scoreState.outs,1);const a=frame(c);next(c);const b=frame(c);assert.deepEqual(b.actors,a.actors);assert.strictEqual(c.demo.getView().resolution,adapter.connect(fixture).resolution);assert.equal(c.demo.getView().scoreState.outs,2);c.timer.tick(900);const end=frame(c);assert.deepEqual([point(end,'actor-original-runner').x,point(end,'actor-original-runner').y],[170,56]);assert.deepEqual([point(end,'actor-batter-runner').x,point(end,'actor-batter-runner').y],[294,215]);
});
test('Skip Replay and stale Controller callbacks cannot reveal or submit again',()=>{
 const c=begin();c.timer.tick(1000);const old=c.timer.callbacks.at(-1);c.demo.skip();assert.equal(c.demo.skip(),false);assert.equal(c.demo.getState().playbackStage,'awaitingConfirmation');old();assert.equal(c.demo.getView().resolution,null);next(c);const result=c.demo.getView().resolution;c.demo.replay();assert.equal(frame(c).playTime,0);old();assert.equal(c.demo.getView().currentBeat.type,'ballInPlay');c.demo.skip();next(c);assert.strictEqual(c.demo.getView().resolution,result);assert.equal(c.demo.getState().submissionCount,1);
});
test('renderer uses one pose writer and RAF; close-up reuses identical main-field SS and ball',()=>{
 const c=mounted(project);c.demo.submit('secureFirstBaseOut');c.clock.tick(420);c.clock.tick(700);let cb=[...c.raf.values()][0];c.raf.clear();cb();assert.equal(c.raf.size,1);assert.equal(c.el('field').dataset.trackStatus,'sampled');assert.equal(c.el('focus-layer').hidden,false);assert.equal(c.el('focus-layer').attributes['data-side'],'left');
 const html=fs.readFileSync(path.join(root,'prototype/manga-motion-spike/index.html'),'utf8');assert.match(html,/<use href="#actor-ss"\/><use href="#ball-marker"\/>/);
 const p=project({phase:'Playback',clock:c.demo.getView().presentationClock});for(const a of p.actors)assert.equal(c.el(a.elementId).attributes.transform,'translate('+a.x+' '+a.y+')');
});
test('stale render callbacks cancel across Next Pause Skip Replay and pagehide',()=>{
 const c=mounted(project);c.demo.submit('secureFirstBaseOut');c.clock.tick(420);const old=c.all.at(-1);c.demo.next();const n=c.el('ball-marker').writes.length;old();assert.equal(c.el('ball-marker').writes.length,n);assert.equal(c.raf.size,1);c.demo.pause();assert.equal(c.raf.size,0);c.demo.resume();c.demo.skip();assert.equal(c.raf.size,0);c.clock.tick(151);c.demo.next();c.demo.replay();assert.equal(c.raf.size,1);const stale=c.all.at(-1);c.events.pagehide.forEach(f=>f());const end=c.el('ball-marker').writes.length;stale();assert.equal(c.el('ball-marker').writes.length,end);assert.equal(c.raf.size,0);
});
test('Reduced Motion and Text Mode retain complete legal text and confirmation without motion loop',()=>{
 for(const mode of ['reducedMotion','textMode']){const c=begin({[mode]:true});assert.equal(c.demo.getState().paused,true);assert.equal(c.timer.tasks.size,0);for(let i=0;i<6;i++)next(c);assert.equal(c.demo.getView().currentBeat.type,'result');assert.equal(c.demo.getView().resolution,null);next(c);assert.ok(c.demo.getView().resolution);assert.equal(frame(c).playTime,5450);}
 const c=begin();c.timer.tick(400);c.demo.setTextMode(true);assert.equal(c.demo.getState().paused,true);assert.equal(c.timer.tasks.size,0);c.demo.skip();next(c);assert.ok(c.demo.getView().resolution);
});
test('Unsupported never activates tracks, motion publications or future results',()=>{
 for(const route of app.ROUTES.slice(1)){const c=model();assert.equal(c.demo.getView().motionBeat,undefined);c.demo.submit(route);c.timer.tick(20000);assert.equal(c.demo.getState().phase,'Unsupported');assert.equal(c.demo.getView().motionBeat,undefined);assert.equal(c.demo.getView().resolution,null);assert.equal(c.demo.getView().presentationClock.playTime,0);assert.equal(c.demo.getState().submissionCount,0);}
});
test('pure modules contain no timer, DOM, import, physical settlement or completion authority',()=>{
 for(const file of ['timing.js','sampler.js'])assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),/setTimeout|requestAnimationFrame|Date\.now|performance\.now|document\.|\.animate\(/);
 assert.ok(Object.isFrozen(fixture));assert.equal(manifest.units,'illustrative-presentation-ms');
});

test('actual new classic-script entry boots exactly one shared Continuous Controller offline',()=>{
 const html=fs.readFileSync(path.join(root,'prototype/manga-motion-spike/index.html'),'utf8'),timer=new Clock(),document=new context.helpers.Document(html),events={};
 const env={document,location:{search:''},URLSearchParams,performance:{now:()=>timer.now},setTimeout:timer.schedule,clearTimeout:timer.cancel,matchMedia:()=>({matches:false}),requestAnimationFrame:()=>1,cancelAnimationFrame(){},addEventListener(k,f){(events[k]||=[]).push(f)},MutationObserver:class{observe(){}disconnect(){}}};
 const ctx=vm.createContext(env);
 for(const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)){const file=path.resolve(root,'prototype/manga-motion-spike',m[1]);vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});}
 document.ready();timer.tick(0);assert.equal(env.SS63MotionDemo.getView().presentationMode,'continuous');assert.equal(env.SS63MotionDemo.getView().phase,'Decision');assert.equal(document.getElementById('choices').children.length,4);assert.equal(timer.tasks.size,1);
 document.getElementById('choice-secureFirstBaseOut').click();timer.tick(420);assert.equal(env.SS63MotionDemo.getView().currentBeat.type,'ballInPlay');assert.equal(document.getElementById('field').dataset.trackStatus,'sampled');assert.equal(env.SS63MotionDemo.getState().submissionCount,1);events.pagehide.forEach(f=>f());assert.equal(timer.tasks.size,0);
});
test('invalid source statuses and mismatched timing cannot activate the new full track plan',()=>{
 for(const [i,key,value] of [[0,'direction','rightSide'],[2,'status','failed'],[3,'targetBase','second']]){const f=JSON.parse(JSON.stringify(fixture));f.playback[i].payload[key]=value;assert.throws(()=>tracks.createPlayableManifest(f,presentation));}
 assert.throws(()=>clock.withRemapping({version:timing.version}));assert.throws(()=>clock.withRemapping(timing).createPlan(fixture.playback,()=>100));
});

test('confirmed consequence uses the same pause clock and accessible static alternative',()=>{
 const c=begin();c.demo.skip();next(c);c.timer.tick(150);c.demo.pause();const a=frame(c);c.timer.tick(4000);assert.deepEqual(frame(c),a);c.demo.resume();assert.deepEqual(frame(c),a);c.timer.tick(100);assert.ok(frame(c).playTime>a.playTime);c.demo.setTextMode(true);assert.equal(c.demo.getState().paused,true);assert.equal(frame(c).playTime,5450);
});
