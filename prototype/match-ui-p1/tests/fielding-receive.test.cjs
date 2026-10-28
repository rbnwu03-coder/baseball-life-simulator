"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const fixture = require("../fixture.js");
const app = require("../app.js");
const presentation = require("../presentation.js");
const original = JSON.stringify(fixture);
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../style.css"), "utf8");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const position = actor => [actor.x, actor.y];
const receiver = scene => scene.actors.find(a => a.elementId === "actor-receiver");
const baseView = { decision:fixture.decision, scoreState:fixture.decision.state, phase:"Decision", decisionStage:"fieldingFocus", session:1, playbackRuns:1, beatDurationMs:450, beatElapsedMs:0, paused:true, textMode:false, reducedMotion:false };
function viewAt(index, overrides = {}) { return { ...baseView, phase:"Playback", currentBeat:fixture.playback[index], revealedBeats:fixture.playback.slice(0, index + 1), ...overrides }; }
function sceneAt(index, overrides) { return presentation.project(viewAt(index, overrides)); }

test("fielding correction removes black focus frame and gold speed lines from runtime", () => {
  assert.doesNotMatch(html + css + source, /focus-frame|speed-lines/);
  assert.match(css, /\.player-focus-paper\s*\{[^}]*stroke:none/);
  assert.match(css, /\.player-focus-context\s*\{[^}]*opacity:\.5/);
  assert.match(css, /#field\[data-dim="true"\] > #field-layer[^}]*opacity:\.65/);
});

test("player close-up contains only field context, the original player marker and original ball", () => {
  const camera = html.match(/<svg id="player-focus-viewport"[^>]*>([\s\S]*?)<\/svg>/);
  assert.ok(camera); assert.deepEqual([...camera[1].matchAll(/<use href="([^"]+)"/g)].map(m => m[1]), ["#field-layer", "#actor-ss", "#ball-marker"]);
  assert.doesNotMatch(camera[1], /actor-receiver|actors-layer|actor-original-runner|actor-batter-runner/);
  assert.match(html, /id="focus-layer"[^>]*aria-hidden="true"[^>]*hidden/);
  const box = sceneAt(1).focus.box; assert.ok(106 / box[3] > 1 && 106 / box[3] < 1.5, "Mild local magnification");
  for (const p of [presentation.POINTS.ss, presentation.POINTS.fielding, presentation.POINTS.incoming]) {
    assert.ok(p[0] >= box[0] && p[0] <= box[0]+box[2]); assert.ok(p[1] >= box[1] && p[1] <= box[1]+box[3]);
  }
});

test("close-up is gated to player approach/control, never Decision, Unsupported, throwing or results", () => {
  for (let index = 0; index < 7; index++) {
    const focus = sceneAt(index).focus;
    assert.equal(focus.visible, index === 1 || index === 2); assert.equal(focus.inset, focus.visible);
  }
  for (const phase of ["Loading", "Decision", "Submitting", "Unsupported", "Resolution", "Continue", "DataError"]) {
    const s = presentation.project({ ...baseView, phase, currentBeat:fixture.playback[1], resolution:fixture.resolution, revealedBeats:fixture.playback });
    assert.equal(s.focus.visible, false, phase); assert.equal(s.focus.inset, false, phase);
  }
});

test("Reduced Motion and text mode omit close-up without losing receive positioning", () => {
  for (const mode of ["reducedMotion", "textMode"]) {
    for (const index of [1, 2]) assert.equal(sceneAt(index, { [mode]:true }).focus.visible, false);
    const scene = sceneAt(4, { [mode]:true });
    assert.deepEqual(position(receiver(scene)), presentation.POINTS.first);
    assert.deepEqual([scene.ball.x, scene.ball.y], position(receiver(scene)));
  }
});

test("receiver stays in original stance until the committed throw and then moves onto first base", () => {
  assert.deepEqual(position(receiver(presentation.project(baseView))), presentation.POINTS.receiver);
  for (let index = 0; index < 3; index++) {
    const scene = sceneAt(index); assert.deepEqual(position(receiver(scene)), presentation.POINTS.receiver);
    assert.equal(scene.movements.some(m => m.key === "actor-receiver"), false);
  }
  const thrown = sceneAt(3); assert.deepEqual(position(receiver(thrown)), presentation.POINTS.first);
  const movement = thrown.movements.find(m => m.key === "actor-receiver");
  assert.deepEqual(movement, { key:"actor-receiver", from:presentation.POINTS.receiver, to:presentation.POINTS.first });
  assert.equal(receiver(thrown).sourceId, fixture.playback[3].payload.receiverId);
});

test("throw path, ball animation and receiver animation share one first-base destination", () => {
  const scene = sceneAt(3), actor = receiver(scene);
  const ball = scene.movements.find(m => m.key === "ball-marker"), fielder = scene.movements.find(m => m.key === "actor-receiver");
  assert.deepEqual(ball.to, fielder.to); assert.deepEqual(ball.to, position(actor));
  assert.deepEqual([scene.ball.x, scene.ball.y], position(actor));
  assert.equal(scene.routes.executed, "M128 123 L" + actor.x + " " + actor.y);
  assert.deepEqual(ball.from, presentation.POINTS.fielding);
});

test("receive/contest/result keep receiver on base, ball aligned, and runners independent", () => {
  let nativeId;
  for (const index of [3, 4, 5, 6]) {
    const scene = sceneAt(index), actor = receiver(scene);
    assert.deepEqual(position(actor), presentation.POINTS.first); assert.deepEqual([scene.ball.x, scene.ball.y], position(actor));
    if (nativeId) assert.equal(actor.sourceId, nativeId); nativeId = actor.sourceId;
    assert.equal(scene.focus.visible, false); assert.equal(scene.focus.inset, false);
    assert.equal(new Set(scene.actors.map(a => a.key)).size, 4);
    assert.equal(scene.movements.filter(m => m.key.includes("runner")).length, 2);
    assert.deepEqual(scene.occupancy, [true, false, false]); assert.equal(Boolean(scene.result), index === 6);
  }
  assert.equal(nativeId, fixture.playback[4].payload.actorId);
});

test("a notAttempted or failed throw does not fabricate receiver coverage or an executed route", () => {
  for (const status of ["notAttempted", "failed"]) {
    const view = structuredClone(viewAt(3)); view.currentBeat.payload.status = status; view.revealedBeats[3].payload.status = status;
    const scene = presentation.project(view); assert.deepEqual(position(receiver(scene)), presentation.POINTS.receiver);
    assert.equal(scene.routes.executed, ""); assert.equal(scene.movements.some(m => m.key === "actor-receiver"), false); assert.equal(scene.result, null);
  }
});

test("Unsupported previews never move the receiver or borrow a future throw", () => {
  for (const routeId of app.ROUTES.slice(1)) {
    const scene = presentation.project({ ...baseView, phase:"Unsupported", selectedRouteId:routeId, currentBeat:fixture.playback[3], revealedBeats:fixture.playback });
    assert.deepEqual(position(receiver(scene)), presentation.POINTS.receiver); assert.equal(scene.routes.executed, ""); assert.equal(scene.focus.visible, false); assert.equal(scene.result, null);
  }
});

test("Resolution keeps covered first base while only original formal runner and score facts settle", () => {
  const scene = presentation.project({ ...baseView, phase:"Resolution", resolution:fixture.resolution, scoreState:fixture.resolution.state });
  assert.deepEqual(position(receiver(scene)), presentation.POINTS.first); assert.deepEqual([scene.ball.x, scene.ball.y], position(receiver(scene)));
  assert.deepEqual(scene.occupancy, [false, true, false]); assert.equal(scene.focus.visible, false);
  assert.equal(JSON.stringify(fixture), original); assert.ok(Object.isFrozen(scene));
});
