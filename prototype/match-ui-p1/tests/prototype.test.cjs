"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const fixture = require("../fixture.js");
const app = require("../app.js");
const sourceFile = path.resolve(root, "../../docs/match-ui-slice-data-contract-v0.1-evidence.json");
const source = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
const original = JSON.stringify(fixture);
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const script = fs.readFileSync(path.join(root, "app.js"), "utf8");
const sceneScript = fs.readFileSync(path.join(root, "presentation.js"), "utf8");

class Clock {
  constructor() { this.now = 0; this.counter = 0; this.tasks = new Map(); this.allCallbacks = []; }
  schedule = (fn, delay) => { const id = ++this.counter; this.tasks.set(id, { at: this.now + delay, fn }); this.allCallbacks.push(fn); return id; };
  cancel = id => { this.tasks.delete(id); };
  tick(ms) { const end = this.now + ms; let guard = 0; while (true) { const due = [...this.tasks.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0]; if (!due) break; assert.ok(++guard < 1000, "timer loop"); this.now = due[1].at; this.tasks.delete(due[0]); due[1].fn(); } this.now = end; }
}
const demoClocks = new WeakMap();
function step(demo) { demoClocks.get(demo).tick(151); return demo.next(); }
function model(extra = {}, data = fixture) { const clock = new Clock(); const demo = app.createDemo(data, { schedule: clock.schedule, cancel: clock.cancel, now: () => clock.now, submissionMs: 20, beatMs: 100, ...extra }); demoClocks.set(demo, clock); return { demo, clock }; }
function begin(extra = {}) { const context = model(extra); context.demo.start(); context.demo.submit("secureFirstBaseOut"); context.clock.tick(20); return context; }

// A small renderer adapter tests focus requests, DOM masking and native element types.
// It does not implement a browser, CSS layout, key activation or assistive technology.
class Element {
  constructor(document, tag = "div") { this.ownerDocument = document; this.tagName = tag.toUpperCase(); this.children = []; this.attributes = {}; this.listeners = {}; this.dataset = {}; this.hidden = false; this.disabled = false; this._text = ""; this.classes = new Set(); this.classList = { toggle: (name, enabled) => { if (enabled) this.classes.add(name); else this.classes.delete(name); } }; }
  set id(value) { this._id = value; this.ownerDocument.nodes.set(value, this); }
  get id() { return this._id; }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(n => n.textContent).join(""); }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  removeAttribute(key) { delete this.attributes[key]; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this._text = ""; this.children = [...nodes]; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  dispatch(type) { (this.listeners[type] || []).forEach(fn => fn()); }
  animate(keyframes, options) { const animation = { keyframes, options, currentTime: 0, playState: "running", cancel() { this.playState = "idle"; }, pause() { this.playState = "paused"; }, play() { this.playState = "running"; } }; (this.animations ||= []).push(animation); return animation; }
  click() { if (!this.disabled) (this.listeners.click || []).forEach(fn => fn()); }
  focus() { const previous = this.ownerDocument.activeElement; this.ownerDocument.activeElement = this; if (previous !== this) { previous?.dispatch("blur"); this.dispatch("focus"); } }
}
class Document {
  constructor() {
    this.nodes = new Map(); this.activeElement = null;
    for (const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) { const el = new Element(this, match[1]); el.id = match[3]; el.hidden = /\bhidden\b/.test(match[2]); if (/tabindex="-1"/.test(match[2])) el.setAttribute("tabindex", "-1"); }
    this.dots = Array.from({ length: 3 }, () => new Element(this, "i"));
  }
  getElementById(id) { return this.nodes.get(id) || null; }
  createElement(tag) { return new Element(this, tag); }
  querySelectorAll(selector) { assert.equal(selector, ".out-dots i"); return this.dots; }
}
function rendered(data = fixture, reducedMotion = true) { const document = new Document(), clock = new Clock(); const demo = app.mount(document, data, { setTimeout: clock.schedule, clearTimeout: clock.cancel, performance: { now: () => clock.now }, matchMedia: () => ({ matches: reducedMotion }), addEventListener() {} }); clock.tick(0); demoClocks.set(demo, clock); return { document, clock, demo, el: id => document.getElementById(id) }; }

test("fixture is an exact copy of the only authorized evidence.examples", () => {
  assert.deepEqual(fixture, source.examples);
  assert.deepEqual(fixture.decision.choices.map(c => [c.routeId, c.matchDecision, c.matchMomentId]), source.examples.decision.choices.map(c => [c.routeId, c.matchDecision, c.matchMomentId]));
  assert.deepEqual(fixture.playback.map(e => [e.type, e.eventId, e.presentationSequence]), source.examples.playback.map(e => [e.type, e.eventId, e.presentationSequence]));
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync(sourceFile)).digest("hex"), fs.readFileSync(path.join(root, "fixture.js"), "utf8").match(/Source SHA-256: ([a-f0-9]+)/)[1]);
});
test("fixture is recursively frozen and rejects attempted mutation", () => {
  function visit(value) { if (value && typeof value === "object") { assert.ok(Object.isFrozen(value)); Object.values(value).forEach(visit); } }
  visit(fixture); assert.throws(() => { fixture.resolution.state.outs = 0; }, TypeError); assert.throws(() => fixture.playback.reverse(), TypeError); assert.equal(JSON.stringify(fixture), original);
});
test("Decision has no result, quality, physics internals or RNG fields", () => {
  const forbidden = /^(resultCode|outcomeText|feedbackText|secured|reached|decisionQuality|executionQuality|margin|timingMargin|rolls|sample|capabilities|physicalTruth|executionEvidence)$/;
  function visit(value) { if (value && typeof value === "object") for (const [key, next] of Object.entries(value)) { assert.ok(!forbidden.test(key), key); visit(next); } }
  visit(fixture.decision); assert.equal(app.validateFixture(fixture).ok, true);
});
test("Loading validates into Decision without a Resolution view", () => {
  const { demo } = model(); assert.equal(demo.getState().phase, "Loading"); assert.equal(demo.getView().resolution, null); demo.start(); assert.equal(demo.getState().phase, "Decision"); assert.strictEqual(demo.getView().scoreState, fixture.decision.state); assert.equal(demo.getView().currentBeat, null); assert.equal(demo.getView().resolution, null);
});
for (const route of app.ROUTES.slice(1)) test(route + " enters Unsupported, never creates 6-3 playback or result", () => {
  const { demo, clock } = model(); demo.start(); assert.equal(demo.submit(route), true); clock.tick(10000); assert.equal(demo.getState().phase, "Unsupported"); assert.equal(demo.getState().playbackRuns, 0); assert.equal(demo.getView().resolution, null); assert.equal(demo.skip(), false); assert.equal(demo.replay(), false); assert.equal(demo.finish(), false); assert.equal(demo.returnToDecision(), true); assert.equal(demo.getState().phase, "Decision"); assert.equal(demo.getState().submitted, false);
});
test("synchronous submission lock and repeated clicks create only one Playback", () => {
  const { demo, clock } = model(); demo.start(); assert.equal(demo.submit("secureFirstBaseOut"), true); assert.equal(demo.getState().phase, "Submitting"); for (let i = 0; i < 20; i++) assert.equal(demo.submit("secureFirstBaseOut"), false); clock.tick(20); assert.equal(demo.getState().phase, "Playback"); assert.equal(demo.getState().playbackRuns, 1); assert.equal(demo.getState().submissionCount, 1);
});
test("all seven beats preserve DTO identity; first six reveal no result", () => {
  const { demo } = begin({ reducedMotion: true });
  for (let index = 0; index < 7; index++) { const view = demo.getView(); assert.strictEqual(view.currentBeat, fixture.playback[index]); assert.equal(view.resolution, null); assert.strictEqual(view.scoreState, fixture.decision.state); assert.equal(view.revealedBeats.length, index + 1); if (index < 6) { assert.ok(!view.revealedBeats.some(e => e.type === "result")); assert.ok(!Object.hasOwn(view.currentBeat.payload, "resultCode")); } else assert.equal(view.currentBeat.payload.resultCode, "oneOut"); step(demo); }
  assert.equal(demo.getState().phase, "Resolution"); assert.strictEqual(demo.getView().resolution, fixture.resolution);
});
test("pause, resume and next have exactly one scheduled timer", () => {
  const { demo, clock } = begin(); assert.equal(clock.tasks.size, 1); demo.pause(); assert.equal(clock.tasks.size, 0); clock.tick(1000); assert.equal(demo.getState().beatIndex, 0); assert.equal(demo.pause(), false); step(demo); assert.equal(demo.getState().beatIndex, 1); assert.equal(clock.tasks.size, 0); demo.resume(); assert.equal(demo.resume(), false); assert.equal(clock.tasks.size, 1); clock.tick(100 + demo.getView().readingDurationMs); assert.equal(demo.getState().beatIndex, 2); assert.equal(clock.tasks.size, 1);
});
test("autoplay reaches result, waits for confirmation, then Resolution with no timer", () => {
  const { demo, clock } = begin(); clock.tick(30000); assert.equal(demo.getState().phase, "Playback"); assert.equal(demo.getView().currentBeat.type, "result"); assert.strictEqual(demo.getView().scoreState, fixture.decision.state); assert.equal(demo.getState().playbackStage, "awaitingConfirmation"); step(demo); assert.equal(demo.getState().phase, "Resolution"); assert.equal(clock.tasks.size, 0);
});
test("Resolution alone updates outs and base occupancy; final score is absent", () => {
  const { demo } = begin(); demo.skip(); const view = demo.getView(); assert.deepEqual(view.scoreState, { outs: 2, scores: { home: 0, away: 1 }, bases: [false, true, false] }); assert.equal(view.resolution.outcomeText, source.examples.resolution.outcomeText); assert.equal(view.resolution.feedbackText, source.examples.resolution.feedbackText); assert.equal(view.resolution.selectedRouteId, "secureFirstBaseOut"); assert.equal(view.resolution.actualRouteId, "secureFirstBaseOut"); assert.ok(!Object.hasOwn(view.resolution, "finalSummary"));
});
test("Skip and Continue are idempotent, and never create another submission", () => {
  const { demo, clock } = begin(); assert.equal(demo.skip(), true); assert.equal(demo.skip(), false); clock.tick(5000); assert.equal(demo.getState().phase, "Resolution"); assert.equal(demo.finish(), true); assert.equal(demo.finish(), false); assert.equal(demo.replay(), false); assert.equal(step(demo), false); assert.equal(demo.getState().phase, "Continue"); assert.equal(demo.getState().continueCount, 1); assert.equal(demo.getState().submissionCount, 1); assert.equal(demo.getState().playbackRuns, 1);
});
test("Replay reuses original DTOs and resets displayed scoreboard until Resolution", () => {
  const { demo } = begin({ reducedMotion: true }); demo.skip(); assert.equal(demo.replay(), true); assert.equal(demo.replay(), false); assert.strictEqual(demo.getView().currentBeat, fixture.playback[0]); assert.strictEqual(demo.getView().scoreState, fixture.decision.state); assert.equal(demo.getView().resolution, null); demo.skip(); assert.strictEqual(demo.getView().resolution, fixture.resolution); assert.equal(demo.getState().submissionCount, 1); assert.equal(demo.getState().replayRuns, 1); assert.equal(JSON.stringify(fixture), original);
});
test("stale callbacks cannot advance a finished or restarted demonstration", () => {
  const { demo, clock } = begin(); const stale = [...clock.allCallbacks]; demo.skip(); demo.finish(); demo.restart(); assert.equal(demo.getState().phase, "Decision"); stale.forEach(fn => fn()); assert.equal(demo.getState().phase, "Decision"); assert.equal(demo.getState().session, 2); assert.equal(demo.getState().submitted, false); demo.submit("secureFirstBaseOut"); clock.tick(20); assert.equal(demo.getState().submissionCount, 2);
});
test("reduced motion starts each playback paused and still allows explicit autoplay", () => {
  const { demo, clock } = begin({ reducedMotion: true }); assert.equal(demo.getState().paused, true); assert.equal(clock.tasks.size, 0); clock.tick(10000); assert.equal(demo.getState().beatIndex, 0); demo.resume(); clock.tick(100 + demo.getView().readingDurationMs); assert.equal(demo.getState().beatIndex, 1);
});
test("invalid, incomplete or mistimed fixture enters readable DataError", () => {
  const cases = [undefined, {}, structuredClone(fixture), structuredClone(fixture), structuredClone(fixture), structuredClone(fixture)]; cases[2].playback[1].momentId = "stale"; cases[3].decision.resultCode = "oneOut"; cases[4].playback[3].payload.receiverId = null; cases[5].playback[1].dependsOn = [];
  // Pass undefined through to the real validator; the model helper's default argument would replace it with the valid fixture.
  for (const data of cases) { const demo = app.createDemo(data); assert.equal(demo.start(), false); assert.equal(demo.getState().phase, "DataError"); assert.ok(demo.getState().error); assert.equal(demo.getView().scoreState, null); assert.equal(demo.getView().resolution, null); assert.equal(demo.submit("secureFirstBaseOut"), false); }
});
test("renderer preserves original text, four native buttons and hides null observations", () => {
  const { document, el } = rendered(); assert.equal(el("situation-text").textContent, fixture.decision.situationText); assert.equal(el("observations").hidden, true); assert.equal(el("observations").children.length, 0); assert.equal(el("choices").children.length, 4); assert.equal(document.activeElement.id, "screen-heading");
  fixture.decision.choices.forEach((choice, index) => { const button = el("choices").children[index]; assert.equal(button.tagName, "BUTTON"); assert.equal(button.type, "button"); assert.equal(button.dataset.routeId, choice.routeId); for (const text of [choice.label, choice.objectiveText, "風險 " + ({low:"低",medium:"中",high:"高"})[choice.risk], choice.routeLabel]) assert.ok(button.textContent.includes(text)); });
});
test("renderer locks buttons during Submitting and focuses every new screen", () => {
  const { document, el, clock, demo } = rendered(); el("choice-secureFirstBaseOut").click(); assert.equal(demo.getState().phase, "Submitting"); assert.ok(el("choices").children.every(b => b.disabled)); assert.equal(el("demo").attributes["aria-busy"], "true"); assert.equal(document.activeElement.id, "screen-heading"); clock.tick(420); assert.equal(demo.getState().phase, "Playback"); assert.equal(document.activeElement.id, "screen-heading"); assert.equal(el("demo").attributes["aria-busy"], "false");
});
test("renderer leaves result DTO text empty until Resolution and no seventh-stage spoiler", () => {
  const { el, demo, clock } = rendered(); el("choice-secureFirstBaseOut").click(); clock.tick(420);
  for (let index = 0; index < 7; index++) { assert.equal(el("outcome-text").textContent, ""); assert.equal(el("feedback-text").textContent, ""); assert.equal(el("selected-route").textContent, ""); assert.equal(el("outs-label").textContent, "一出局"); assert.equal(el("bases-label").textContent, "一壘有人"); assert.equal(el("home-score").textContent, "0"); assert.equal(el("away-score").textContent, "1"); if (index < 6) { assert.ok(!el("beat-text").textContent.includes("完成 1 個出局")); assert.ok(!el("beat-history").textContent.includes("本球結果")); } else assert.ok(el("beat-text").textContent.includes("完成 1 個出局")); clock.tick(151); el("next-beat").click(); }
  assert.equal(demo.getState().phase, "Resolution"); assert.equal(el("outs-label").textContent, "二出局"); assert.equal(el("bases-label").textContent, "二壘有人"); assert.equal(el("outcome-text").textContent, fixture.resolution.outcomeText); assert.equal(el("result-announcement").textContent, fixture.resolution.outcomeText);
});
test("renderer keeps playback control focus stable between beats; result heading receives focus", () => {
  const { document, el, clock, demo } = rendered(); el("choice-secureFirstBaseOut").click(); clock.tick(420); el("next-beat").focus(); el("next-beat").click(); assert.equal(document.activeElement.id, "next-beat"); el("skip-playback").click(); assert.equal(demo.getState().phase, "Resolution"); assert.equal(document.activeElement.id, "screen-heading"); assert.equal(el("screen-heading").textContent, "這一球，完成了。");
});
test("Unsupported return restores choice focus and never writes outcome DOM", () => {
  const { document, el, demo } = rendered(); el("choice-forceSecond").click(); assert.equal(demo.getState().phase, "Unsupported"); assert.equal(el("outcome-text").textContent, ""); assert.equal(el("resolution-screen").hidden, true); el("back-to-decision").click(); assert.equal(document.activeElement.id, "choice-forceSecond"); assert.equal(demo.getState().phase, "Decision");
});
test("Replay and restart clear previously rendered outcome and live announcement", () => {
  const { el, clock, demo } = rendered(); el("choice-secureFirstBaseOut").click(); clock.tick(420); el("skip-playback").click(); el("replay-demo").click(); assert.equal(el("outcome-text").textContent, ""); assert.equal(el("result-announcement").textContent, ""); assert.equal(el("beat-type").textContent, ""); assert.equal(demo.getView().currentBeat.type, "ballInPlay"); el("skip-playback").click(); el("continue-demo").click(); assert.equal(demo.getState().phase, "Continue"); el("restart-demo").click(); assert.equal(demo.getState().phase, "Decision"); assert.equal(el("beat-text").textContent, ""); assert.equal(el("outcome-text").textContent, ""); assert.equal(el("outs-label").textContent, "一出局"); assert.equal(el("bases-label").textContent, "一壘有人");
});
test("Loading and DataError have readable DOM, a focus target and recovery control", () => {
  const { el, document, demo } = rendered({}); assert.equal(demo.getState().phase, "DataError"); assert.equal(el("error-screen").hidden, false); assert.ok(el("error-text").textContent); assert.equal(document.activeElement.id, "screen-heading"); assert.equal(el("retry-data").tagName, "BUTTON");
  assert.ok(html.includes("正在檢查本地固定資料"));
});
test("static keyboard/accessibility hooks exist without custom key trapping", () => {
  for (const id of ["toggle-playback", "next-beat", "skip-playback", "continue-demo", "replay-demo", "back-to-decision", "restart-demo", "retry-data"]) assert.match(html, new RegExp('<button[^>]+id="' + id + '"[^>]+type="button"'));
  assert.match(html, /id="screen-heading" tabindex="-1"/); assert.match(html, /aria-live="polite"/); assert.match(html, /<html lang="zh-Hant">/); assert.match(html, /<noscript>/); assert.match(css, /:focus-visible/); assert.match(css, /prefers-reduced-motion:reduce/); assert.match(script, /\.focus\(\)/); assert.doesNotMatch(script, /addEventListener\(["']key(?:down|up|press)/);
});
test("classic script bootstrap runs with deferred DOM readiness (VM adapter, not browser)", () => {
  const document = new Document(), clock = new Clock(), events = new Map();
  document.readyState = "loading";
  document.addEventListener = (type, callback) => events.set(type, callback);
  const context = vm.createContext({ document, setTimeout: clock.schedule, clearTimeout: clock.cancel, performance: { now: () => clock.now }, matchMedia: () => ({ matches: true }), addEventListener() {} });
  vm.runInContext(fs.readFileSync(path.join(root, "fixture.js"), "utf8"), context, { filename: "fixture.js" });
  vm.runInContext(fs.readFileSync(path.join(root, "presentation-v02.generated.js"), "utf8"), context, { filename: "presentation-v02.generated.js" });
  vm.runInContext(sceneScript, context, { filename: "presentation.js" });
  vm.runInContext(script, context, { filename: "app.js" });
  assert.ok(context.MATCH_UI_P1_FIXTURE); assert.ok(context.MatchUIP1); assert.ok(events.has("DOMContentLoaded"));
  events.get("DOMContentLoaded")(); clock.tick(0);
  assert.equal(document.getElementById("demo").dataset.phase, "Decision");
  document.getElementById("choice-secureFirstBaseOut").click(); clock.tick(420);
  assert.equal(document.getElementById("demo").dataset.phase, "Playback");
  document.getElementById("skip-playback").click();
  assert.equal(document.getElementById("demo").dataset.phase, "Playback");
  assert.equal(document.getElementById("outcome-text").textContent, "");
  clock.tick(151); document.getElementById("next-beat").click();
  assert.equal(document.getElementById("demo").dataset.phase, "Resolution");
  assert.equal(document.getElementById("outcome-text").textContent, fixture.resolution.outcomeText);
  assert.equal(JSON.stringify(context.MATCH_UI_P1_FIXTURE), original);
});
test("runtime assets are strictly local, no fetch/import/production/Phaser/CDN calls", () => {
  assert.deepEqual([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]), ["./fixture.js", "./presentation-v02.generated.js", "./presentation.js", "./app.js"]);
  assert.deepEqual([...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => m[1]), ["./style.css"]);
  for (const runtime of [html, css, script, sceneScript, fs.readFileSync(path.join(root, "fixture.js"), "utf8")]) { assert.doesNotMatch(runtime, /https?:\/\/|(?:src|href)=["']\/\//); assert.doesNotMatch(runtime, /\b(?:fetch|XMLHttpRequest|WebSocket|importScripts|resolveHighSchoolYearOneMatch|Math\.random)\s*\(/); assert.doesNotMatch(runtime, /\bimport\s*(?:\(|["'{*])/); assert.doesNotMatch(runtime.replace(/\brequire\(["']\.\/presentation\.js["']\)/g, ""), /\brequire\s*\(/); assert.doesNotMatch(runtime, /\bnew\s+Phaser|Phaser\./); }
  assert.match(html, /connect-src 'none'/); assert.ok(html.includes("OFFLINE DEMO — NOT CONNECTED TO MATCH SIMULATION")); assert.doesNotMatch(css, /@import|url\(/);
});
test("all model and renderer interactions leave the entire fixture byte-equivalent", () => { assert.equal(JSON.stringify(fixture), original); });

test("UI-P2 hover and keyboard focus use identical routeId intention previews", () => {
  const { el, demo } = rendered();
  const expected = { secureFirstBaseOut: ["M115 101 L268 154", ""], forceSecond: ["M115 101 L170 56", ""], startDoublePlaySecond: ["M115 101 L170 56", "M170 56 L268 154"], holdBall: ["", ""] };
  for (const [routeId, paths] of Object.entries(expected)) {
    const node = el("choice-" + routeId); node.dispatch("pointerenter");
    assert.equal(demo.getState().previewRouteId, routeId); const hovered = el("intent-caption").textContent;
    assert.deepEqual([el("intent-route-first").attributes.d, el("intent-route-second").attributes.d], paths);
    assert.equal(el("intent-notice").hidden, false); assert.equal(el("hold-intent").hidden, routeId !== "holdBall");
    node.focus(); assert.equal(el("intent-caption").textContent, hovered); node.dispatch("pointerleave");
    assert.equal(demo.getState().previewRouteId, routeId); assert.equal(el("svg-result-layer").hidden, true); assert.equal(el("svg-result-text").textContent, ""); assert.equal(el("outcome-text").textContent, "");
  }
});
test("UI-P2 actual SVG result layer appears only on result beat or Resolution", () => {
  const { el, demo, clock } = rendered(); el("choice-secureFirstBaseOut").click(); clock.tick(420);
  for (let index = 0; index < 7; index++) {
    assert.equal(el("svg-result-layer").hidden, index < 6); assert.equal(el("outs-label").textContent, "一出局"); assert.equal(el("bases-label").textContent, "一壘有人");
    assert.equal(el("field").dataset.stage, app.BEATS[index]);
    if (index < 6) assert.equal(el("svg-result-text").textContent, ""); step(demo);
  }
  assert.equal(el("outs-label").textContent, "二出局"); assert.equal(el("base-second").classes.has("occupied"), true);
  demo.replay(); assert.equal(el("svg-result-layer").hidden, true); assert.equal(el("svg-result-text").textContent, ""); assert.equal(el("bases-label").textContent, "一壘有人");
});
test("UI-P2 text mode is user-controlled, readable, and pauses current playback", () => {
  const { el, demo, clock } = rendered(fixture, false); el("choice-secureFirstBaseOut").click(); clock.tick(420); el("toggle-text-mode").click();
  assert.equal(demo.getState().textMode, true); assert.equal(demo.getState().paused, true); assert.equal(el("field").hidden, true); assert.equal(el("toggle-text-mode").attributes["aria-pressed"], "true");
  assert.ok(el("beat-text").textContent); clock.tick(5000); assert.equal(demo.getState().beatIndex, 0); step(demo); assert.equal(demo.getState().beatIndex, 1); el("toggle-text-mode").click(); assert.equal(el("field").hidden, false); assert.equal(demo.getState().paused, true);
});
test("UI-P2 visual animations follow pause/resume, have no completion authority, and cancel on Skip", () => {
  const { el, demo, clock } = rendered(fixture, false); el("choice-secureFirstBaseOut").click(); clock.tick(420);
  const animation = el("ball-marker").animations.at(-1); assert.equal(animation.options.duration, 450); assert.equal(animation.onfinish, undefined);
  demo.pause(); assert.equal(animation.playState, "paused"); demo.resume(); assert.equal(animation.playState, "running");
  demo.skip(); assert.equal(animation.playState, "idle"); const submissions = demo.getState().submissionCount;
  clock.tick(10000); assert.equal(demo.getState().phase, "Resolution"); assert.equal(demo.getState().submissionCount, submissions);
});

test("UI-P2.1 renderer hides debug fields by default and clears them when disabled", () => {
  const { el, demo, clock } = rendered();
  assert.equal(el("debug-scene").hidden, true); assert.equal(el("actor-debug-identities").textContent, "");
  assert.equal(el("debug-beat").hidden, true); assert.equal(el("debug-routes").hidden, true);
  el("toggle-debug").click(); assert.equal(el("debug-scene").hidden, false); assert.ok(el("actor-debug-identities").textContent.includes(":actor:ss"));
  assert.equal(el("debug-beat").hidden, true); assert.equal(el("beat-event-id").textContent, ""); assert.equal(el("selected-route").textContent, "");
  el("choice-secureFirstBaseOut").click(); clock.tick(420);
  assert.equal(el("debug-beat").hidden, false); assert.equal(el("beat-event-id").textContent, fixture.playback[0].eventId);
  demo.skip(); assert.equal(el("debug-routes").hidden, false); assert.equal(el("selected-route").textContent, fixture.resolution.selectedRouteId);
  el("toggle-debug").click();
  for (const id of ["beat-event-id", "beat-sequence", "beat-type", "selected-route", "actual-route", "actor-position-notice", "actor-debug-identities"]) assert.equal(el(id).textContent, "");
  for (const id of ["debug-beat", "debug-routes", "debug-scene"]) assert.equal(el(id).hidden, true);
});

test("UI-P2.1 renderer keeps player and runner identities while accessible labels use natural roles", () => {
  const { el, demo, clock } = rendered();
  const ids = ["actor-ss", "actor-receiver", "actor-original-runner", "actor-batter-runner"];
  const keys = ids.map(id => el(id).attributes["data-actor-key"]);
  assert.equal(new Set(keys).size, 4); assert.equal(el("actor-ss").attributes["data-source-id"], "player");
  assert.deepEqual(ids.map(id => el(id).attributes["data-team"]), ["defense", "defense", "offense", "offense"]);
  assert.deepEqual(ids.map(id => el(id).attributes["data-player"]), ["true", "false", "false", "false"]);
  assert.match(el("field-desc").textContent, /金色外環.*藍色守方.*暖橘色攻方/);
  assert.doesNotMatch(el("field-desc").textContent + el("position-label").textContent, /SS|R1|BR|actor:/);
  el("choice-secureFirstBaseOut").click(); clock.tick(420); demo.skip();
  assert.deepEqual(ids.map(id => el(id).attributes["data-actor-key"]), keys);
  assert.equal(el("actor-original-runner").attributes["data-source-id"], fixture.resolution.runnerChanges[1].runnerId);
  assert.equal(el("actor-batter-runner").attributes["data-source-id"], fixture.resolution.runnerChanges[0].runnerId);
  assert.match(el("actor-original-runner").attributes["aria-label"], /原一壘跑者.*二壘/);
  assert.match(el("actor-batter-runner").attributes["aria-label"], /打者跑者.*出局/);
});

test("UI-P2.1 rendered animations finish before reading holds and do not restart on Resume", () => {
  const { el, demo, clock } = rendered(fixture, false); el("choice-secureFirstBaseOut").click(); clock.tick(420);
  const animation = el("ball-marker").animations.at(-1); const description = el("beat-text").textContent;
  clock.tick(450); assert.equal(demo.getState().playbackStage, "readingHold");
  assert.equal(animation.currentTime, 450); assert.equal(animation.playState, "paused");
  assert.equal(el("beat-text").textContent, description); demo.pause(); clock.tick(5000); demo.resume();
  assert.equal(animation.currentTime, 450); assert.equal(animation.playState, "paused");
  assert.strictEqual(el("ball-marker").animations.at(-1), animation);
  clock.tick(demo.getView().stageRemainingMs); assert.equal(demo.getState().beatIndex, 1); assert.equal(animation.playState, "idle");
});

test("UI-P2.1 result hold keeps text and score visible, then moves disabled control focus to confirmation", () => {
  const { document, el, demo, clock } = rendered(fixture, false); el("choice-secureFirstBaseOut").click(); clock.tick(420);
  el("toggle-playback").focus(); clock.tick(60000);
  assert.equal(demo.getState().playbackStage, "awaitingConfirmation"); assert.equal(el("toggle-playback").disabled, true);
  assert.equal(document.activeElement.id, "next-beat"); assert.match(el("beat-text").textContent, /完成 1 個出局/);
  assert.equal(el("outs-label").textContent, "一出局"); assert.equal(el("bases-label").textContent, "一壘有人");
  assert.equal(el("outcome-text").textContent, ""); assert.equal(el("context-panel").hidden, true);
  clock.tick(60000); assert.equal(demo.getState().phase, "Playback"); el("next-beat").click();
  assert.equal(document.activeElement.id, "screen-heading"); assert.equal(el("outcome-text").textContent, fixture.resolution.outcomeText);
  assert.equal(el("feedback-text").textContent, fixture.resolution.feedbackText); clock.tick(60000);
  assert.equal(el("outcome-text").textContent, fixture.resolution.outcomeText); assert.equal(demo.getState().phase, "Resolution");
});

test("UI-P2.1 repeated Next activation is ignored without stealing keyboard focus", () => {
  const { document, el, demo, clock } = rendered(); el("choice-secureFirstBaseOut").focus(); el("choice-secureFirstBaseOut").click(); clock.tick(420);
  el("next-beat").focus(); el("next-beat").click(); el("next-beat").click();
  assert.equal(demo.getState().beatIndex, 1); assert.equal(document.activeElement.id, "next-beat");
  clock.tick(151); el("next-beat").click(); assert.equal(demo.getState().beatIndex, 2);
  el("skip-playback").focus(); el("skip-playback").click(); assert.equal(document.activeElement.id, "screen-heading");
  el("replay-demo").focus(); el("replay-demo").click(); assert.equal(document.activeElement.id, "screen-heading");
  assert.equal(demo.getState().beatIndex, 0); assert.equal(demo.getState().playbackStage, "animation");
});

test("UI-P2.1 help/history are expandable and formal result text has no truncation styling", () => {
  assert.match(html, /<details class="play-help">/); assert.match(html, /<details class="play-history">/);
  assert.doesNotMatch(html, /<details[^>]+open/); assert.doesNotMatch(css, /line-clamp|text-overflow/);
  assert.match(html, /id="toggle-debug" type="button" aria-pressed="false"/);
  assert.match(html, /id="toggle-text-mode" type="button" aria-pressed="false"/);
});

test("UI-P2.2 receiving uses the main field with no receiver inset or focus frame in any reading stage", () => {
  const { el, demo, clock } = rendered(fixture, false); el("choice-secureFirstBaseOut").click(); clock.tick(420);
  for (let index = 0; index < 7; index++) {
    for (const stage of ["animation", "readingHold"]) {
      assert.equal(demo.getState().playbackStage, stage); assert.equal(el("field").hidden, false);
      if (index >= 4) {
        assert.equal(el("focus-inset-panel"), null); assert.equal(el("focus-layer").hidden, true);
        assert.equal(el("field").dataset.dim, "false"); assert.ok(el("executed-route").attributes.d);
        assert.ok(el("actor-receiver").attributes.transform); assert.equal(el("actor-receiver").attributes["data-team"], "defense");
      }
      assert.equal(el("focus-inset-panel"), null); assert.equal(el("focus-inset"), null);
      assert.equal(el("outs-label").textContent, "一出局"); assert.equal(el("bases-label").textContent, "一壘有人");
      assert.equal(el("svg-result-layer").hidden, index < 6);
      clock.tick(demo.getView().stageRemainingMs);
    }
  }
  assert.equal(demo.getState().playbackStage, "awaitingConfirmation"); assert.equal(el("focus-inset-panel"), null);
  el("next-beat").click(); assert.equal(el("bases-label").textContent, "二壘有人"); assert.equal(el("outs-label").textContent, "二出局");
  assert.equal(el("outcome-text").textContent, fixture.resolution.outcomeText); assert.equal(el("focus-inset-panel"), null);
});

test("fielding correction renders player-only close-up and synchronizes ball and receiver Web Animations", () => {
  const { el, demo, clock } = rendered(fixture, false);
  assert.equal(el("focus-frame"), null); assert.equal(el("focus-layer").hidden, true);
  assert.equal(el("actor-receiver").attributes.transform, "translate(280 141)");
  el("choice-secureFirstBaseOut").click(); clock.tick(420); demo.pause();
  step(demo); assert.equal(el("focus-layer").hidden, false); assert.equal(el("player-focus-viewport").attributes.viewBox, "91 85 78 78");
  step(demo); assert.equal(el("focus-layer").hidden, false);
  step(demo); assert.equal(demo.getView().currentBeat.type, "throw"); assert.equal(el("focus-layer").hidden, true);
  const receiverAnimation = el("actor-receiver").animations.at(-1), ballAnimation = el("ball-marker").animations.at(-1);
  assert.equal(el("actor-receiver").attributes.transform, "translate(268 154)");
  assert.equal(receiverAnimation.keyframes[0].transform, "translate(280px,141px)");
  assert.equal(receiverAnimation.keyframes[1].transform, ballAnimation.keyframes[1].transform);
  assert.equal(receiverAnimation.keyframes[1].transform, "translate(268px,154px)");
  assert.equal(receiverAnimation.options.duration, 450); assert.deepEqual(receiverAnimation.options, ballAnimation.options);
  assert.equal(receiverAnimation.playState, "paused"); demo.resume(); assert.equal(receiverAnimation.playState, "running");
  clock.tick(450); assert.equal(demo.getState().playbackStage, "readingHold");
  for (const animation of [receiverAnimation, ballAnimation]) { assert.equal(animation.currentTime, 450); assert.equal(animation.playState, "paused"); }
  clock.tick(demo.getView().stageRemainingMs); assert.equal(demo.getView().currentBeat.type, "receive"); assert.equal(receiverAnimation.playState, "idle");
  assert.equal(el("actor-receiver").attributes.transform, el("ball-marker").attributes.transform);
  assert.equal(el("focus-layer").hidden, true); assert.equal(el("field").dataset.dim, "false");
  demo.pause(); step(demo); assert.equal(demo.getView().currentBeat.type, "contest");
  assert.equal(el("actor-receiver").attributes.transform, "translate(268 154)");
  assert.equal(el("outs-label").textContent, "一出局"); assert.equal(el("bases-label").textContent, "一壘有人");
  demo.skip(); assert.equal(el("actor-receiver").attributes.transform, "translate(268 154)");
  demo.replay(); assert.equal(el("actor-receiver").attributes.transform, "translate(280 141)"); assert.equal(el("focus-layer").hidden, true);
});

test("fielding correction close-up respects text/reduced modes and receiver animation cancels on Skip", () => {
  const { el, demo, clock } = rendered(fixture, false); el("choice-secureFirstBaseOut").click(); clock.tick(420); demo.pause(); step(demo);
  assert.equal(el("focus-layer").hidden, false); demo.setTextMode(true); assert.equal(el("focus-layer").hidden, true);
  demo.setTextMode(false); assert.equal(el("focus-layer").hidden, false); demo.setReducedMotion(true); assert.equal(el("focus-layer").hidden, true);
  demo.setReducedMotion(false); assert.equal(el("focus-layer").hidden, false); step(demo); step(demo);
  const animation = el("actor-receiver").animations.at(-1); assert.equal(animation.onfinish, undefined);
  demo.skip(); assert.equal(animation.playState, "idle"); clock.tick(60000);
  assert.equal(demo.getState().phase, "Resolution"); assert.equal(demo.getState().submissionCount, 1);
  assert.equal(el("focus-layer").hidden, true); assert.equal(el("outs-label").textContent, "二出局");
});

test("spatial pass renders SS focus at the left edge while retaining occupancy text and receiver staging", () => {
  const { el, demo, clock } = rendered(fixture, false);
  assert.equal(el("bases-label").textContent, "一壘有人"); assert.equal(el("base-first").classes.has("occupied"), true);
  el("choice-secureFirstBaseOut").click(); clock.tick(420); demo.pause(); step(demo);
  assert.equal(el("focus-layer").hidden, false); assert.equal(el("focus-layer").attributes["data-side"], "left");
  for (const [id, expected] of [["player-focus-paper", ["6", "5", "120", "114"]], ["player-focus-viewport", ["10", "9", "112", "106"]]]) {
    assert.deepEqual(["x", "y", "width", "height"].map(k => el(id).attributes[k]), expected);
  }
  step(demo); assert.equal(el("focus-layer").hidden, false); assert.equal(el("player-focus-viewport").attributes.x, "10");
  step(demo); step(demo); assert.equal(demo.getView().currentBeat.type, "receive");
  assert.equal(el("focus-layer").hidden, true); assert.equal(el("actor-receiver").attributes.transform, "translate(268 154)");
  assert.equal(el("ball-marker").attributes.transform, "translate(268 154)"); assert.equal(el("bases-label").textContent, "一壘有人");
  demo.skip(); assert.equal(el("bases-label").textContent, "二壘有人"); assert.equal(el("outs-label").textContent, "二出局");
  demo.replay(); demo.pause(); step(demo); assert.equal(el("focus-layer").hidden, false);
  assert.equal(el("focus-layer").attributes["data-side"], "left"); assert.equal(el("player-focus-paper").attributes.x, "6");
});
