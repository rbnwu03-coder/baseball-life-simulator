"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const fixture = require("../fixture.js");
const app = require("../app.js");
const presentation = require("../presentation.js");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../style.css"), "utf8");
const original = JSON.stringify(fixture);
const baseView = { phase:"Playback", decision:fixture.decision, scoreState:fixture.decision.state, session:1, playbackRuns:1, beatDurationMs:1100, beatElapsedMs:0, paused:true, textMode:false, reducedMotion:false };

test("spatial pass removes first-base green dot without adding replacement symbols", () => {
  const first = html.match(/<g id="base-first"[^>]*>([\s\S]*?)<\/g>/);
  assert.ok(first); assert.deepEqual([...first[1].matchAll(/<(\w+)\b/g)].map(m => m[1]), ["path", "text"]);
  assert.match(first[1], /d="M268 146 L276 154 L268 162 L260 154 Z"/);
  assert.match(first[1], />一壘<\/text>/); assert.doesNotMatch(first[1], /occupant|circle|use|symbol|#[a-f\d]{3,8}|fill=|stroke=/i);
});

test("spatial pass keeps first base neutral even when occupied; other bases retain existing cues", () => {
  assert.match(css, /\.base path,\.home-plate\{fill:#fffdf4;stroke:#7b7664;stroke-width:1\.4\}/);
  assert.match(css, /\.base\.occupied:not\(#base-first\) path\{stroke:#375744/);
  assert.doesNotMatch(css, /\.base\.occupied path\{/);
  for (const id of ["second", "third"]) assert.match(html, new RegExp('<g id="base-' + id + '"[^>]*>[\\s\\S]*?<circle class="occupant"'));
});

test("spatial pass fixes SS left and 2B right using presentation-only placement rules", () => {
  const ss = presentation.focusLayoutFor("SS"), second = presentation.focusLayoutFor("2B");
  assert.equal(ss.side, "left"); assert.equal(second.side, "right");
  assert.deepEqual(ss.paper, [6, 5, 120, 114]); assert.deepEqual(ss.viewport, [10, 9, 112, 106]);
  assert.deepEqual(second.paper, [214, 5, 120, 114]); assert.deepEqual(second.viewport, [218, 9, 112, 106]);
  assert.ok(ss.paper[0]+ss.paper[2] < 170); assert.ok(second.paper[0] > 170);
  assert.equal(presentation.focusLayoutFor("unknown"), null); assert.equal(presentation.focusLayoutFor("toString"), null);
});

test("spatial placements preserve camera size, crop scale, padding and immutability", () => {
  for (const layout of Object.values(presentation.FOCUS_LAYOUT)) {
    assert.ok(Object.isFrozen(layout)); assert.ok(Object.isFrozen(layout.paper)); assert.ok(Object.isFrozen(layout.viewport));
    assert.deepEqual(layout.paper.slice(1), [5, 120, 114]); assert.deepEqual(layout.viewport.slice(1), [9, 112, 106]);
    assert.equal(layout.viewport[0]-layout.paper[0], 4);
    assert.ok(layout.viewport[0]+layout.viewport[2] <= layout.paper[0]+layout.paper[2]);
  }
  assert.ok(Object.isFrozen(presentation.FOCUS_LAYOUT));
  assert.throws(() => { presentation.FOCUS_LAYOUT.SS.side = "right"; }, TypeError);
});

test("SS camera stays on its own side through player focus, never follows first-base receiver", () => {
  for (const [index, currentBeat] of fixture.playback.entries()) {
    const scene = presentation.project({ ...baseView, currentBeat, revealedBeats:fixture.playback.slice(0,index+1) });
    assert.strictEqual(scene.focus.layout, presentation.FOCUS_LAYOUT.SS);
    assert.equal(scene.focus.visible, index === 1 || index === 2);
    assert.deepEqual(scene.focus.box, [91, 85, 78, 78]);
    if (index >= 3) {
      const actor = scene.actors.find(a => a.elementId === "actor-receiver");
      assert.deepEqual([actor.x, actor.y], presentation.POINTS.first); assert.deepEqual([scene.ball.x, scene.ball.y], presentation.POINTS.first);
    }
    assert.deepEqual(scene.occupancy, [true, false, false]); assert.equal(Boolean(scene.result), index === 6);
  }
});

test("spatial rules add no technical labels, fixture positions or new gameplay choices", () => {
  assert.equal(fixture.decision.player.position, "SS"); assert.equal(app.validateFixture(fixture).ok, true);
  assert.equal(fixture.decision.choices.length, 4); assert.equal(fixture.playback.length, 7); assert.equal(JSON.stringify(fixture), original);
  const camera = html.match(/<svg id="player-focus-viewport"[^>]*>([\s\S]*?)<\/svg>/)[1];
  assert.doesNotMatch(camera, /<text|actor-receiver|actors-layer/); assert.match(html, /id="player-focus-paper"[^>]+x="6"/);
  assert.match(html, /id="player-focus-viewport"[^>]+x="10"/);
});
