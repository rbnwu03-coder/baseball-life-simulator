"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const fixture = require("../fixture.js");
const app = require("../app.js");
const presentation = require("../presentation.js");
const original = JSON.stringify(fixture);
class Clock {
  constructor() { this.now = 0; this.id = 0; this.tasks = new Map(); this.callbacks = []; }
  schedule = (fn, ms) => { const id = ++this.id; this.tasks.set(id, { fn, at: this.now + ms }); this.callbacks.push(fn); return id; };
  cancel = id => this.tasks.delete(id);
  tick(ms) { const end = this.now + ms; for (let n = 0; n < 100; n++) { const next = [...this.tasks.entries()].filter(([, t]) => t.at <= end).sort((a,b) => a[1].at - b[1].at)[0]; if (!next) { this.now = end; return; } this.now = next[1].at; this.tasks.delete(next[0]); next[1].fn(); } throw Error("Timer loop"); }
}
const demoClocks = new WeakMap();
function step(demo) { demoClocks.get(demo).tick(151); return demo.next(); }
function setup(options = {}) { const clock = new Clock(); const demo = app.createDemo(fixture, { schedule: clock.schedule, cancel: clock.cancel, now: () => clock.now, ...options }); demo.start(); demoClocks.set(demo,clock); return { clock, demo }; }
function playing(options = {}) { const context = setup(options); context.demo.submit("secureFirstBaseOut"); context.clock.tick(presentation.TIMING.submission); return context; }

test("UI-P2 timing profile is centralized, nonuniform and matches all seven types", () => {
  assert.deepEqual(presentation.TIMING.beats, { ballInPlay:450, approach:1100, control:850, throw:450, receive:600, contest:1100, result:900 });
  assert.ok(new Set(Object.values(presentation.TIMING.beats)).size > 1); assert.ok(Object.isFrozen(presentation.TIMING.beats));
  assert.throws(() => presentation.durationFor("unknown"));
});
test("UI-P2 Decision Incoming Ball transitions once to Fielding Focus in the same phase", () => {
  const { demo, clock } = setup(); assert.equal(demo.getState().phase, "Decision"); assert.equal(demo.getState().decisionStage, "incomingBall");
  const incoming = presentation.project(demo.getView()); assert.ok(incoming.knownIncoming); assert.ok(incoming.movements.some(m => m.key === "ball-marker"));
  clock.tick(449); assert.equal(demo.getState().decisionStage, "incomingBall"); clock.tick(1); assert.equal(demo.getState().phase, "Decision"); assert.equal(demo.getState().decisionStage, "fieldingFocus"); assert.equal(clock.tasks.size, 0); assert.equal(demo.getState().submissionCount, 0);
});
test("UI-P2 Decision projection never reads a future beat, resolution or playback history", () => {
  const { demo } = setup(); const view = { ...demo.getView(), previewRouteId:"startDoublePlaySecond" };
  for (const key of ["currentBeat", "resolution", "revealedBeats"]) Object.defineProperty(view,key,{get(){ throw Error("Unrevealed data read: " + key); }});
  const scene = presentation.project(view); assert.equal(scene.result,null); assert.equal(scene.controlState,"waiting"); assert.equal(scene.preview.paths.length,2); assert.equal(scene.routes.executed, ""); assert.deepEqual(scene.occupancy,[true,false,false]);
});
test("UI-P2 route previews use routeId mappings only and remain intentions", () => {
  assert.deepEqual(Object.keys(presentation.INTENTS),app.ROUTES);
  assert.equal(presentation.intentFor("secureFirstBaseOut").paths.length,1); assert.equal(presentation.intentFor("forceSecond").paths.length,1); assert.equal(presentation.intentFor("startDoublePlaySecond").paths.length,2); assert.equal(presentation.intentFor("holdBall").paths.length,0); assert.equal(presentation.intentFor("holdBall").hold,true);
  assert.equal(presentation.intentFor("6-3"),null); assert.equal(presentation.intentFor("toString"),null);
  const { demo } = setup(); for(const routeId of app.ROUTES){ demo.preview(routeId); const scene=presentation.project(demo.getView()); assert.equal(scene.preview.routeId,routeId); assert.equal(scene.preview.notice,"戰術意圖示意，非實際執行結果"); assert.equal(scene.result,null); assert.equal(scene.routes.executed,""); }
});
test("UI-P2 preview interrupts only Decision prelude; no execution or result is created", () => {
  const { demo,clock }=setup(); const stale=[...clock.callbacks]; demo.preview("forceSecond"); assert.equal(clock.tasks.size,0); assert.equal(demo.getState().decisionStage,"fieldingFocus"); stale.forEach(fn=>fn()); assert.equal(demo.getState().phase,"Decision");
  demo.submit("forceSecond"); assert.equal(demo.getState().phase,"Unsupported"); assert.equal(demo.getState().playbackRuns,0); assert.equal(presentation.project(demo.getView()).result,null); demo.returnToDecision(); assert.equal(demo.getState().previewRouteId,"forceSecond");
});
test("UI-P2 all seven SVG projections change focus, ball, route or actor staging without changing official occupancy", () => {
  const { demo }=playing({reducedMotion:true}); const scenes=[];
  for(let i=0;i<7;i++){ const view=demo.getView(),scene=presentation.project(view); scenes.push(scene); assert.equal(scene.stage,app.BEATS[i]); assert.deepEqual(scene.occupancy,[true,false,false]); assert.equal(view.scoreState.outs,1); assert.deepEqual(view.scoreState.scores,{home:0,away:1}); assert.equal(Boolean(scene.result),i===6); step(demo); }
  assert.ok(scenes[0].routes.incoming); assert.ok(scenes[1].focus.dimField); assert.notDeepEqual(scenes[0].actors[0],scenes[1].actors[0]); assert.equal(scenes[2].controlState,"completed"); assert.equal(scenes[3].routes.executed,"M128 123 L268 154"); assert.deepEqual(scenes[4].ball,{visible:true,x:268,y:154}); assert.ok(scenes[5].routes.competition); assert.equal(scenes[5].result,null); assert.equal(scenes[6].result.code,"oneOut");
});
test("UI-P2 control and throw projection respects failed/notAttempted DTO status", () => {
  const { demo }=playing({reducedMotion:true}); step(demo); step(demo); const control=structuredClone(demo.getView()); control.currentBeat.payload.status="failed"; control.revealedBeats[2].payload.status="failed";
  const failed=presentation.project(control); assert.equal(failed.controlState,"failed"); assert.notDeepEqual([failed.ball.x,failed.ball.y],presentation.POINTS.fielding); assert.equal(failed.result,null);
  step(demo); const thrown=structuredClone(demo.getView()); thrown.currentBeat.payload.status="notAttempted"; thrown.revealedBeats[3].payload.status="notAttempted"; assert.equal(presentation.project(thrown).routes.executed,"");
});
test("UI-P2 player-only close-up is retained while receive and accessible display modes omit it", () => {
  const {demo}=playing(); demo.pause(); step(demo); let scene=presentation.project(demo.getView()); assert.equal(scene.focus.inset,true); assert.equal(scene.focus.visible,true); assert.deepEqual(scene.focus.box,[91,85,78,78]);
  step(demo); step(demo); step(demo); scene=presentation.project(demo.getView()); assert.equal(scene.stage,"receive"); assert.equal(scene.focus.visible,false); assert.equal(scene.focus.inset,false); assert.equal(scene.focus.dimField,false);
  demo.setReducedMotion(true); assert.equal(presentation.project(demo.getView()).focus.inset,false); demo.setReducedMotion(false); demo.setTextMode(true); assert.equal(presentation.project(demo.getView()).focus.inset,false);
});
test("UI-P2 actor aliases, internal role symbols and native runner bindings never merge identities", () => {
  const { demo }=playing({reducedMotion:true}); let expectedKeys;
  for(let i=0;i<7;i++){ const s=presentation.project(demo.getView()),keys=s.actors.map(a=>a.key); assert.equal(new Set(keys).size,4); if(expectedKeys)assert.deepEqual(keys,expectedKeys); expectedKeys=keys; assert.notEqual(s.actors[2].symbol,s.actors[3].symbol); assert.ok(s.actors[2].label.includes("原一壘跑者")); assert.ok(s.actors[3].label.includes("打者跑者")); step(demo); }
  const resolved=presentation.project(demo.getView()); assert.deepEqual(resolved.actors.map(a=>a.key),expectedKeys); assert.equal(resolved.actors[2].sourceId,fixture.resolution.runnerChanges.find(r=>r.from===1).runnerId); assert.equal(resolved.actors[3].sourceId,fixture.resolution.runnerChanges.find(r=>r.from==="batter").runnerId); assert.notEqual(resolved.actors[2].sourceId,resolved.actors[3].sourceId); assert.deepEqual(resolved.occupancy,[false,true,false]); assert.deepEqual([resolved.actors[2].x,resolved.actors[2].y],presentation.POINTS.second);
});
test("UI-P2 result is gated by current phase, not old or supplied future result data", () => {
  const { demo }=setup(); const view={...demo.getView(),resolution:fixture.resolution,currentBeat:fixture.playback[6],revealedBeats:fixture.playback}; assert.equal(presentation.project(view).result,null);
  demo.submit("holdBall"); assert.equal(presentation.project({...demo.getView(),resolution:fixture.resolution}).result,null);
});
test("UI-P2 animation durations remain unchanged before separate reading holds", () => {
  const { demo,clock }=playing();
  for(const [index,type] of app.BEATS.entries()){
    const duration=presentation.TIMING.beats[type]; assert.equal(demo.getView().beatDurationMs,duration); assert.equal(clock.tasks.size,1);
    clock.tick(duration-1); assert.equal(demo.getState().beatIndex,index); assert.equal(demo.getState().playbackStage,"animation");
    clock.tick(1); assert.equal(demo.getState().playbackStage,"readingHold"); assert.equal(demo.getState().beatIndex,index);
    clock.tick(demo.getView().readingDurationMs);
  }
  assert.equal(demo.getState().phase,"Playback"); assert.equal(demo.getState().playbackStage,"awaitingConfirmation"); assert.equal(clock.tasks.size,0);
  step(demo); assert.equal(demo.getState().phase,"Resolution"); assert.equal(clock.tasks.size,0);
});

test("UI-P2 Pause/Resume preserves remaining beat time instead of restarting a full beat", () => {
  const {demo,clock}=playing(); clock.tick(200); demo.pause(); assert.equal(demo.getView().beatRemainingMs,250); assert.equal(demo.getView().beatElapsedMs,200); clock.tick(5000); assert.equal(demo.getState().beatIndex,0); demo.resume(); assert.equal(clock.tasks.size,1); clock.tick(249); assert.equal(demo.getState().beatIndex,0); clock.tick(1); assert.equal(demo.getState().playbackStage,"readingHold"); assert.equal(demo.getState().beatIndex,0); clock.tick(demo.getView().readingDurationMs); assert.equal(demo.getState().beatIndex,1); assert.equal(demo.getView().beatDurationMs,1100);
});
test("UI-P2 Next resets only the current presentation timer, Skip resolves once, stale callbacks are inert", () => {
  const { demo,clock }=playing(); let resolutions=0; demo.subscribe(v=>{if(v.phase==="Resolution")resolutions++;}); clock.tick(100); const stale=[...clock.callbacks]; step(demo); assert.equal(clock.tasks.size,1); assert.equal(demo.getView().beatDurationMs,1100); demo.pause(); step(demo); assert.equal(demo.getState().beatIndex,2); assert.equal(clock.tasks.size,0); demo.skip(); demo.skip(); stale.forEach(fn=>fn()); clock.tick(10000); assert.equal(resolutions,1); assert.equal(demo.getState().submissionCount,1); assert.equal(demo.getState().phase,"Resolution");
});
test("UI-P2 Replay removes result projection and reuses DTOs/profile without another submission", () => {
  const {demo,clock}=playing(); demo.skip(); demo.replay(); assert.equal(presentation.project(demo.getView()).result,null); assert.strictEqual(demo.getView().currentBeat,fixture.playback[0]); assert.equal(demo.getView().beatDurationMs,450); assert.equal(clock.tasks.size,1); assert.equal(demo.submit("secureFirstBaseOut"),false); demo.skip(); assert.equal(demo.getState().submissionCount,1); assert.equal(JSON.stringify(fixture),original);
});
test("UI-P2 Reduced Motion skips incoming motion and defaults to static with a separate accessible reading hold", () => {
  const {demo,clock}=setup({reducedMotion:true}); assert.equal(demo.getState().decisionStage,"fieldingFocus"); assert.equal(clock.tasks.size,0); assert.equal(presentation.project(demo.getView()).motionAllowed,false); demo.submit("secureFirstBaseOut"); clock.tick(420); assert.equal(demo.getState().paused,true); assert.equal(demo.getView().beatDurationMs,450); assert.ok(demo.getView().readingDurationMs>=1400); demo.resume(); clock.tick(450 + demo.getView().readingDurationMs - 1); assert.equal(demo.getState().beatIndex,0); clock.tick(1); assert.equal(demo.getState().beatIndex,1);
});
test("UI-P2 Text Mode and live motion preference changes pause safely with no extra timer", () => {
  const {demo,clock}=playing(); clock.tick(200); demo.setTextMode(true); assert.equal(demo.getState().paused,true); assert.equal(clock.tasks.size,0); assert.equal(presentation.project(demo.getView()).motionAllowed,false); assert.equal(demo.getView().beatDurationMs,450); assert.equal(demo.getView().beatElapsedMs,200); step(demo); assert.equal(demo.getView().beatDurationMs,1100); demo.setTextMode(false); assert.equal(demo.getState().paused,true); demo.resume(); assert.equal(clock.tasks.size,1); demo.setReducedMotion(true); assert.equal(clock.tasks.size,0); assert.equal(demo.getState().paused,true); assert.equal(presentation.project(demo.getView()).motionAllowed,false);
});
test("UI-P2 projections and timing interactions preserve frozen DTOs and original fixture bytes", () => {
  const old=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../../../docs/match-ui-p1-offline-prototype-v0.1-evidence.json"),"utf8")); const expected=old.artifacts.find(a=>a.file==="prototype/match-ui-p1/fixture.js").sha256;
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.resolve(__dirname,"../fixture.js"))).digest("hex"),expected);
  const {demo}=playing({textMode:true}); for(let i=0;i<7;i++){const scene=presentation.project(demo.getView());assert.ok(Object.isFrozen(scene));assert.ok(Object.isFrozen(scene.actors));step(demo);} demo.replay(); demo.skip(); demo.finish(); demo.restart(); assert.equal(JSON.stringify(fixture),original);
});
test("UI-P2 presentation module has no imports, timers, simulation calls or animation completion callbacks", () => {
  const moduleSource=fs.readFileSync(path.resolve(__dirname,"../presentation.js"),"utf8"),appSource=fs.readFileSync(path.resolve(__dirname,"../app.js"),"utf8"),html=fs.readFileSync(path.resolve(__dirname,"../index.html"),"utf8"),css=fs.readFileSync(path.resolve(__dirname,"../style.css"),"utf8");
  assert.doesNotMatch(moduleSource,/\b(?:require|fetch|setTimeout|setInterval|resolveHighSchoolYearOneMatch|resolveReach|resolveSecure|resolveThrow|resolveTiming)\s*\(/); assert.doesNotMatch(appSource,/\.onfinish\s*=|addEventListener\(["'](?:finish|animationend)/);
  for(const layer of ["field-layer","actors-layer","ball-route-layer","focus-layer","svg-result-layer"])assert.ok(html.includes('id="'+layer+'"'));
  assert.match(css,/data-team="defense".*fill:#3d668d/);assert.match(css,/data-team="offense".*fill:#b87b4c/);assert.match(css,/data-phase="Playback"/);assert.match(css,/prefers-reduced-motion/);
});
