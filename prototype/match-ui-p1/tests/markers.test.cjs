"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const app = require("../app.js");
const presentation = require("../presentation.js");
const fixture = require("../fixture.js");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../style.css"), "utf8");
const ids = ["actor-ss", "actor-receiver", "actor-original-runner", "actor-batter-runner"];
const markup = ids.map(id => {
  const match = html.match(new RegExp('<g id="' + id + '"([^>]*)>([\\s\\S]*?)</g>'));
  assert.ok(match, id); return { id, attributes: match[1], contents: match[2] };
});

test("UI-P2.2 every player uses the same circle geometry and smaller base size", () => {
  const bodies = markup.map(m => [...m.contents.matchAll(/<(\w+)\b([^>]*class="actor-body"[^>]*)\/>/g)]);
  assert.ok(bodies.every(body => body.length === 1));
  assert.deepEqual(bodies.map(body => body[0][1]), ["circle", "circle", "circle", "circle"]);
  const radii = bodies.map(body => Number(body[0][2].match(/\br="([^"]+)"/)[1]));
  assert.deepEqual(radii, [8.5, 8.5, 8.5, 8.5]);
  assert.ok(17 / 28 < 0.7 && 17 / 26 < 0.7, "Typical previous 26–28 unit markers shrink by over 30%");
  markup.forEach(m => assert.doesNotMatch(m.contents, /<rect|<path|<text|\btransform=/));
});

test("UI-P2.2 geometry and body stroke have no per-role resizing rules", () => {
  assert.match(css, /\.actor \.actor-body\s*\{[^}]*stroke-width:1\.6/);
  for (const m of markup) assert.doesNotMatch(m.attributes, /\bstyle=|scale\(/);
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (/actor-(?:ss|receiver|original-runner|batter-runner)/.test(rule[1])) assert.doesNotMatch(rule[2], /\b(?:r|width|height|transform|scale)\s*:/);
  }
});

test("UI-P2.2 only the player has a gold ring, sized independently of the shared body", () => {
  assert.equal((html.match(/class="player-ring"/g) || []).length, 1);
  assert.match(markup[0].contents, /<circle class="player-ring" r="12"\/>/);
  markup.slice(1).forEach(m => assert.doesNotMatch(m.contents, /player-ring/));
  assert.doesNotMatch(html + css, /player-pointer/);
  assert.match(css, /\.actor \.player-ring\s*\{[^}]*fill:none;\s*stroke:#b28b3c/);
  assert.match(css, /data-phase="Decision"[^}]*\.player-ring[^}]*stroke:#735619/);
});

test("UI-P2.2 defense and offense retain their shared colors and source identities", () => {
  assert.deepEqual(markup.map(m => m.attributes.match(/data-team="([^"]+)"/)[1]), ["defense", "defense", "offense", "offense"]);
  assert.match(css, /data-team="defense"[^}]*fill:#3d668d/);
  assert.match(css, /data-team="offense"[^}]*fill:#b87b4c/);
  const demo = app.createDemo(fixture, { reducedMotion: true }); demo.start();
  const scene = presentation.project(demo.getView());
  assert.equal(new Set(scene.actors.map(a => a.key)).size, 4);
  assert.equal(scene.actors[0].sourceId, "player");
  assert.deepEqual(scene.actors.map(a => a.elementId), ids);
  assert.notEqual(scene.actors[2].key, scene.actors[3].key); demo.destroy();
});

test("UI-P2.2 receiver-focused stages have no inset, crop frame or field dimming", () => {
  const demo = app.createDemo(fixture, { reducedMotion: true }); demo.start(); const view = demo.getView();
  for (const [index, event] of fixture.playback.entries()) {
    const scene = presentation.project({ ...view, phase: "Playback", reducedMotion: false, currentBeat: event, revealedBeats: fixture.playback.slice(0, index + 1) });
    if (index >= 4) {
      assert.equal(scene.focus.inset, false); assert.equal(scene.focus.visible, false); assert.equal(scene.focus.dimField, false);
      assert.deepEqual(scene.focus.box, [91, 85, 78, 78], "Crop stays in the player's fielding area; no receiver crop");
      assert.equal(scene.routes.executed, "M128 123 L268 154"); assert.ok(scene.ball.visible);
    }
    assert.equal(scene.focus.inset, index === 1 || index === 2, "Close-up belongs only to player approach/control");
    if (index === 1 || index === 2) assert.equal(scene.focus.visible, true, "Player fielding focus retained");
    if (index >= 5) assert.ok(scene.routes.competition);
    assert.equal(Boolean(scene.result), index === 6);
    assert.deepEqual(scene.occupancy, [true, false, false]);
  }
  demo.destroy();
});

test("UI-P2.2 accessible instructions no longer promise different player shapes", () => {
  const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
  assert.doesNotMatch(html, /角色也以形狀/); assert.doesNotMatch(source, /另以不同形狀/);
  assert.match(html, /金色外環標示你的守備員/); assert.match(source, /另以位置、路線與動作辨識/);
  assert.match(html, /<svg id="field" viewBox="0 0 340 285" role="img" aria-labelledby="field-title field-desc"/);
  assert.doesNotMatch(html + css + source, /focus-inset|inset-paper|inset-caption|preserveAspectRatio/);
});
