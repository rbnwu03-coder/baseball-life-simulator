"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const app = require("../app.js");
const presentation = require("../presentation.js");
const fixture = require("../fixture.js");
const original = JSON.stringify(fixture);
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../style.css"), "utf8");

class Clock {
  now = 0; id = 0; tasks = new Map(); callbacks = [];
  schedule = (fn, ms) => { const id = ++this.id; this.tasks.set(id, { at: this.now + ms, fn }); this.callbacks.push(fn); return id; };
  cancel = id => this.tasks.delete(id);
  tick(ms) {
    const end = this.now + ms;
    for (let n = 0; n < 200; n++) {
      const due = [...this.tasks.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) { this.now = end; return; }
      this.now = due[1].at; this.tasks.delete(due[0]); due[1].fn();
    }
    throw Error("Timer loop");
  }
}
function playing(mode = {}) {
  const clock = new Clock();
  const demo = app.createDemo(fixture, { schedule: clock.schedule, cancel: clock.cancel, now: () => clock.now, ...mode });
  demo.start(); demo.submit("secureFirstBaseOut"); clock.tick(420);
  return { demo, clock };
}
function stageEnd({ demo, clock }) { clock.tick(demo.getView().stageRemainingMs); }

test("UI-P2.1 one defensive color, one offensive color, and an exclusive player ring", () => {
  const { demo } = playing(); const actors = presentation.project(demo.getView()).actors;
  assert.deepEqual(actors.map(a => a.team), ["defense", "defense", "offense", "offense"]);
  assert.deepEqual(actors.map(a => a.isPlayer), [true, false, false, false]);
  assert.equal((html.match(/class="player-ring"/g) || []).length, 1);
  assert.match(html, /id="actor-ss"[^>]+data-player="true"><circle class="player-ring"/);
  assert.match(css, /data-team="defense"[^}]+fill:#3d668d/);
  assert.match(css, /data-team="offense"[^}]+fill:#b87b4c/);
  assert.match(css, /\.player-ring[^}]+stroke:#b28b3c/);
  assert.match(css, /data-phase="Decision"[^}]+\.player-ring[^}]+stroke-width:2\.8/);
  assert.doesNotMatch(css, /actor-(?:original-runner|batter-runner)[^{]*\{[^}]*fill:/);
});

test("UI-P2.1 default SVG has no visible role codes or engineering legend", () => {
  const svg = html.slice(html.indexOf('<svg id="field"'), html.indexOf('<p id="field-scene-status"'));
  assert.ok(svg.length > 1000, "Inspect the complete field SVG");
  const actors = svg.slice(svg.indexOf('<g id="actors-layer"'), svg.indexOf('<g id="ball-marker"'));
  assert.doesNotMatch(actors, /<text\b/);
  assert.doesNotMatch(svg, />\s*(?:SS|1B|R1|BR|ballInPlay|approach|control)\s*</);
  assert.doesNotMatch(html, /class="actor-legend"|legend-original-runner|legend-batter-runner/);
  assert.match(html, /<details class="play-help">/);
  assert.match(html, /<desc id="field-desc">/);
  assert.match(html, /id="field-occupancy" class="sr-only"/);
  assert.match(html, /aria-labelledby="field-title field-desc"/);
});

test("UI-P2.1 identities and distinct runner motion objects survive every reading stage", () => {
  const ctx = playing(), { demo } = ctx; let keys;
  for (let index = 0; index < 7; index++) {
    const scene = presentation.project(demo.getView()); const currentKeys = scene.actors.map(a => a.key);
    if (keys) assert.deepEqual(currentKeys, keys); else keys = currentKeys;
    assert.equal(new Set(currentKeys).size, 4); assert.notEqual(scene.actors[2].elementId, scene.actors[3].elementId);
    assert.equal(scene.movements.filter(m => m.key.includes("runner")).length, 2);
    stageEnd(ctx); const held = presentation.project(demo.getView());
    assert.deepEqual(held.actors, scene.actors); assert.equal(demo.getState().playbackStage, "readingHold");
    stageEnd(ctx);
  }
  assert.equal(demo.getState().playbackStage, "awaitingConfirmation"); demo.next();
  const resolved = presentation.project(demo.getView());
  assert.deepEqual(resolved.actors.map(a => a.key), keys);
  assert.equal(resolved.actors[2].sourceId, fixture.resolution.runnerChanges.find(r => r.from === 1).runnerId);
  assert.equal(resolved.actors[3].sourceId, fixture.resolution.runnerChanges.find(r => r.from === "batter").runnerId);
  assert.notEqual(resolved.actors[2].sourceId, resolved.actors[3].sourceId);
});

test("UI-P2.1 debug information is opt-in, initially hidden and does not control playback", () => {
  const { demo, clock } = playing(); assert.equal(demo.getState().debugMode, false);
  for (const id of ["debug-scene", "debug-beat", "debug-routes"]) assert.match(html, new RegExp('id="' + id + '"[^>]*hidden'));
  const timer = [...clock.tasks.keys()]; demo.setDebugMode(true); assert.equal(demo.getState().debugMode, true);
  assert.deepEqual([...clock.tasks.keys()], timer); demo.setDebugMode(false); assert.equal(demo.getState().debugMode, false);
  assert.strictEqual(demo.getView().currentBeat, fixture.playback[0]);
});

test("UI-P2.1 animation and reading clocks are sequential and independent", () => {
  const ctx = playing(), { demo, clock } = ctx;
  assert.equal(demo.getView().beatDurationMs, 450); clock.tick(449);
  assert.equal(demo.getState().playbackStage, "animation"); clock.tick(1);
  assert.equal(demo.getState().playbackStage, "readingHold"); assert.equal(demo.getView().beatElapsedMs, 450);
  assert.equal(demo.getView().beatRemainingMs, 0); assert.equal(demo.getView().stageRemainingMs, demo.getView().readingDurationMs);
  clock.tick(demo.getView().readingDurationMs - 1); assert.equal(demo.getState().beatIndex, 0);
  clock.tick(1); assert.equal(demo.getState().beatIndex, 1); assert.equal(demo.getState().playbackStage, "animation");
});

test("UI-P2.1 normal actions remain automatic; key beats have longer holds", () => {
  const ctx = playing(), { demo } = ctx;
  for (let i = 0; i < 6; i++) {
    assert.equal(demo.getState().beatIndex, i); assert.equal(demo.getView().requiresConfirmation, false);
    stageEnd(ctx); stageEnd(ctx);
  }
  assert.equal(demo.getView().currentBeat.type, "result");
  assert.ok(presentation.READING.holds.control > presentation.READING.holds.approach);
  assert.ok(presentation.READING.holds.contest > presentation.READING.holds.receive);
  assert.ok(new Set(Object.values(presentation.READING.holds)).size > 1);
});

test("UI-P2.1 long text extends the reading hold and requires confirmation without truncation", () => {
  const longText = fixture.resolution.outcomeText.repeat(3);
  const policy = presentation.readingFor("control", longText);
  assert.equal(policy.requiresConfirmation, true);
  assert.ok(policy.holdMs >= Array.from(longText).length * presentation.READING.perCharacterMs);
  assert.ok(policy.holdMs > presentation.READING.holds.control);
  assert.equal(fixture.resolution.outcomeText.repeat(3), longText);
  assert.throws(() => presentation.readingFor("unknown", longText));
  assert.equal(presentation.readingFor("result", "短句").requiresConfirmation, true);
});

test("UI-P2.1 result remains indefinitely, with Decision scoreboard, until explicit confirmation", () => {
  const { demo, clock } = playing(); clock.tick(60000);
  assert.equal(demo.getState().phase, "Playback"); assert.equal(demo.getState().playbackStage, "awaitingConfirmation");
  assert.strictEqual(demo.getView().currentBeat, fixture.playback[6]); assert.strictEqual(demo.getView().scoreState, fixture.decision.state);
  assert.equal(demo.getView().resolution, null); assert.equal(clock.tasks.size, 0);
  demo.pause(); demo.resume(); clock.tick(60000);
  assert.equal(demo.getState().phase, "Playback"); assert.equal(clock.tasks.size, 0);
  demo.next(); assert.strictEqual(demo.getView().resolution, fixture.resolution);
  clock.tick(60000); assert.equal(demo.getState().phase, "Resolution");
});

for (const stage of ["animation", "readingHold"]) test("UI-P2.1 pause/resume preserves " + stage + " remaining time; stale timers cannot advance", () => {
  const ctx = playing(), { demo, clock } = ctx;
  if (stage === "readingHold") stageEnd(ctx);
  clock.tick(120); demo.pause(); const remaining = demo.getView().stageRemainingMs, stale = clock.callbacks.at(-1);
  clock.tick(10000); stale(); assert.equal(demo.getState().beatIndex, 0); assert.equal(demo.getState().playbackStage, stage);
  assert.equal(demo.getView().stageRemainingMs, remaining); assert.equal(clock.tasks.size, 0);
  demo.resume(); assert.equal(clock.tasks.size, 1); clock.tick(remaining - 1); assert.equal(demo.getState().playbackStage, stage);
  clock.tick(1); assert.equal(demo.getState().beatIndex, stage === "animation" ? 0 : 1);
});

test("UI-P2.1 double Next and a delayed previous-event action advance only once", () => {
  const { demo, clock } = playing(); const first = demo.getView().currentBeat.eventId;
  assert.equal(demo.next(first), true); assert.equal(demo.next(), false); assert.equal(demo.getState().beatIndex, 1);
  clock.tick(151); assert.equal(demo.next(first), false); assert.equal(demo.getState().beatIndex, 1);
  assert.equal(demo.next(demo.getView().currentBeat.eventId), true); assert.equal(demo.getState().beatIndex, 2);
});

test("UI-P2.1 Next at an automatic boundary cannot skip another beat", () => {
  const ctx = playing(), { demo, clock } = ctx; stageEnd(ctx); stageEnd(ctx);
  assert.equal(demo.getState().beatIndex, 1); assert.equal(demo.next(), false);
  clock.tick(151); assert.equal(demo.next(), true); assert.equal(demo.getState().beatIndex, 2);
});

for (const stage of ["animation", "readingHold", "awaitingConfirmation"]) test("UI-P2.1 Skip and Replay clear " + stage + " callbacks and reading state", () => {
  const ctx = playing(), { demo, clock } = ctx;
  if (stage === "readingHold") stageEnd(ctx);
  if (stage === "awaitingConfirmation") clock.tick(60000);
  const stale = [...clock.callbacks]; assert.equal(demo.getState().playbackStage, stage);
  assert.equal(demo.skip(), true); assert.equal(demo.skip(), false); assert.equal(clock.tasks.size, 0);
  demo.replay(); demo.pause(); assert.equal(demo.getState().playbackStage, "animation"); assert.equal(demo.getState().beatIndex, 0);
  assert.equal(demo.getView().stageRemainingMs, 450); stale.forEach(fn => fn()); clock.tick(60000);
  assert.equal(demo.getState().beatIndex, 0); assert.equal(demo.getState().playbackRuns, 2); assert.equal(demo.getState().submissionCount, 1);
  demo.skip(); demo.finish(); assert.equal(demo.finish(), false); stale.forEach(fn => fn()); assert.equal(demo.getState().phase, "Continue");
});

for (const mode of ["reducedMotion", "textMode"]) test("UI-P2.1 " + mode + " remains operable through reading and confirmation", () => {
  const ctx = playing({ [mode]: true }), { demo, clock } = ctx;
  assert.equal(demo.getState().paused, true); assert.equal(clock.tasks.size, 0);
  assert.equal(presentation.project(demo.getView()).motionAllowed, false);
  assert.equal(demo.getView().beatDurationMs, 450); assert.ok(demo.getView().readingDurationMs >= 1400);
  demo.resume(); clock.tick(60000); assert.equal(demo.getState().playbackStage, "awaitingConfirmation");
  assert.equal(demo.getState().phase, "Playback"); demo.next(); assert.equal(demo.getState().phase, "Resolution");
});

test("UI-P2.1 changing modes during a hold preserves text and remaining read time", () => {
  const ctx = playing(), { demo, clock } = ctx; stageEnd(ctx); clock.tick(100);
  const before = demo.getView(), text = app.describeBeat(before.currentBeat);
  demo.setTextMode(true); assert.equal(demo.getState().paused, true); assert.equal(clock.tasks.size, 0);
  assert.equal(demo.getState().playbackStage, "readingHold"); assert.ok(demo.getView().stageRemainingMs >= before.stageRemainingMs);
  assert.equal(app.describeBeat(demo.getView().currentBeat), text); assert.equal(demo.getView().beatElapsedMs, 450);
  demo.resume(); stageEnd(ctx); assert.equal(demo.getState().beatIndex, 1);
});

test("UI-P2.1 no fixture mutation or new module import accompanies reading policies", () => {
  const { demo, clock } = playing(); clock.tick(60000); demo.next(); demo.replay(); demo.skip(); demo.finish(); demo.restart();
  assert.equal(JSON.stringify(fixture), original);
  assert.ok(Object.isFrozen(presentation.READING)); assert.ok(Object.isFrozen(presentation.READING.holds));
  const runtime = ["app.js", "presentation.js"].map(p => fs.readFileSync(path.join(__dirname, "..", p), "utf8")).join("\n");
  assert.deepEqual([...runtime.matchAll(/require\("([^"]+)"\)/g)].map(m => m[1]), ["./presentation.js"]);
  assert.doesNotMatch(runtime, /resolveHighSchoolYearOneMatch\s*\(|Phaser\.|Math\.random\s*\(|fetch\s*\(/);
  assert.doesNotMatch(html, /https?:\/\/|<canvas/);
});
