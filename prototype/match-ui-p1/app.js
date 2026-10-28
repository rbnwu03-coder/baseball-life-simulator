/* Isolated, offline presentation only. This file imports no production code. */
(function (root, factory) {
  "use strict";
  const presentation = typeof module === "object" && module.exports ? require("./presentation.js") : root.MatchUIPresentation;
  const api = factory(presentation);
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    Object.defineProperty(root, "MatchUIP1", { value: api });
    const boot = () => {
      const policy = root.MATCH_UI_BOOTSTRAP;
      if (policy?.autoMount === false) return;
      return api.mount(root.document, root.MATCH_UI_P1_FIXTURE, root,
        { version: "match-ui-slice/0.2", adapter: root.MATCH_UI_P23_PRESENTATION }, policy);
    };
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", boot, { once: true });
    else boot();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (presentation) {
  "use strict";
  const ROUTES = Object.freeze(["secureFirstBaseOut", "forceSecond", "startDoublePlaySecond", "holdBall"]);
  const BEATS = Object.freeze(["ballInPlay", "approach", "control", "throw", "receive", "contest", "result"]);
  const PHASES = Object.freeze(["Loading", "Decision", "Submitting", "Playback", "Resolution", "Continue", "Unsupported", "DataError"]);
  const TITLES = Object.freeze({ Loading: "正在載入離線示範", Decision: "這一球，你會怎麼處理？", Submitting: "準備這一球的經過", Playback: "回到場上，看這一球的經過", Resolution: "這一球，完成了。", Continue: "示範結束", Unsupported: "這條路線尚未收錄", DataError: "無法顯示離線資料" });
  const BEAT_TITLES = Object.freeze({ ballInPlay: "來球", approach: "接近來球", control: "控制球", throw: "傳球", receive: "接傳", contest: "到壘時序", result: "本球結果" });
  const numeral = n => ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"][n] || String(n);
  const nonempty = v => typeof v === "string" && v.trim().length > 0;
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const exactKeys = (value, keys, label) => {
    assert(value && typeof value === "object" && !Array.isArray(value), label + " 必須是物件");
    assert(Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k)), label + " 欄位不完整或含未允許資料");
  };
  const headerKeys = ["schemaVersion", "presentationId", "matchId", "momentId", "presentationSequence", "inning", "half", "kind"];

  function validateFixture(data) {
    try {
      exactKeys(data, ["decision", "playback", "resolution"], "Fixture");
      const d = data.decision, r = data.resolution;
      exactKeys(d, [...headerKeys, "player", "state", "situationText", "observations", "choices"], "Decision");
      exactKeys(r, [...headerKeys, "status", "selectedRouteId", "actualRouteId", "resultCode", "batterResult", "state", "runnerChanges", "outcomeText", "feedbackText"], "Resolution");
      assert(d.kind === "decision" && r.kind === "resolution", "DTO kind 不相符");
      assert(Array.isArray(data.playback) && data.playback.length === BEATS.length, "需要七個原始 Playback beats");
      const headers = [d, ...data.playback, r];
      headers.forEach((dto, index) => {
        assert(dto.schemaVersion === "match-ui-slice/0.1", "不支援的 schemaVersion");
        ["presentationId", "matchId", "momentId"].forEach(key => assert(nonempty(dto[key]) && dto[key] === d[key], "DTO identity 不一致：" + key));
        assert(Number.isInteger(dto.inning) && dto.inning > 0 && dto.inning === d.inning, "局數不一致");
        assert(["top", "bottom"].includes(dto.half) && dto.half === d.half, "上下半局不一致");
        assert(dto.presentationSequence === index, "presentationSequence 順序不一致");
      });
      [d, r].forEach(dto => {
        exactKeys(dto.state, ["outs", "scores", "bases"], "State");
        assert(Number.isInteger(dto.state.outs) && dto.state.outs >= 0 && dto.state.outs <= (dto === d ? 2 : 3), "不合法的出局數");
        exactKeys(dto.state.scores, ["home", "away"], "Scores");
        Object.values(dto.state.scores).forEach(v => assert(Number.isInteger(v) && v >= 0, "比分必須是非負整數"));
        assert(Array.isArray(dto.state.bases) && dto.state.bases.length === 3 && dto.state.bases.every(v => typeof v === "boolean"), "壘況必須是三個 Boolean");
      });
      exactKeys(d.player, ["id", "position"], "Player");
      assert(d.player.id === "player" && d.player.position === "SS", "此原型僅收錄玩家 SS");
      assert(nonempty(d.situationText), "缺少原始情境文字");
      exactKeys(d.observations, ["directionText", "paceText", "runnerCue", "readCue"], "Observations");
      Object.values(d.observations).forEach(v => assert(v === null || nonempty(v), "觀察欄位需為字串或 null"));
      assert(Array.isArray(d.choices) && d.choices.length === ROUTES.length, "需要四個原生 legal choices");
      d.choices.forEach((choice, index) => {
        exactKeys(choice, ["routeId", "matchDecision", "matchMomentId", "label", "objectiveText", "risk", "routeLabel"], "Choice");
        assert(choice.routeId === ROUTES[index] && choice.matchMomentId === d.momentId, "選項順序或 Moment identity 不一致");
        ["matchDecision", "label", "objectiveText", "routeLabel"].forEach(k => assert(nonempty(choice[k]), "缺少選項文字／identity"));
        assert(["low", "medium", "high"].includes(choice.risk), "未知 risk");
      });
      assert(new Set(d.choices.map(c => c.matchDecision)).size === ROUTES.length, "重複的命令 identity");
      assert(r.status === "settled" && r.selectedRouteId === ROUTES[0] && r.actualRouteId === ROUTES[0], "只收錄既有6-3結果");
      assert(nonempty(r.outcomeText) && nonempty(r.batterResult) && (r.feedbackText === null || nonempty(r.feedbackText)), "結果文字不完整");
      assert(Array.isArray(r.runnerChanges), "缺少 runnerChanges");
      r.runnerChanges.forEach(change => {
        exactKeys(change, ["runnerId", "from", "to"], "RunnerChange");
        assert(nonempty(change.runnerId) && ["batter", 1, 2, 3].includes(change.from) && ["out", "home", 1, 2, 3].includes(change.to), "未知跑者資料形狀");
      });
      const seen = new Set();
      const payloadKeys = { ballInPlay: ["ballType", "direction", "pace", "depth"], approach: ["actorId", "status"], control: ["actorId", "status"], throw: ["actorId", "receiverId", "targetBase", "status"], receive: ["actorId", "targetBase", "status"], contest: ["runnerId", "targetBase", "comparison"], result: ["resultCode", "outsCreated", "error"] };
      data.playback.forEach((event, index) => {
        exactKeys(event, [...headerKeys, "eventId", "actualRouteId", "dependsOn", "type", "payload"], "Playback");
        assert(event.kind === "playback" && event.type === BEATS[index], "Playback type 順序不一致");
        assert(nonempty(event.eventId) && !seen.has(event.eventId) && event.actualRouteId === r.actualRouteId, "重複或錯誤的 event identity");
        assert(Array.isArray(event.dependsOn) && event.dependsOn.every(id => seen.has(id)), "Playback 依賴順序不合法");
        if (index > 0) assert(event.dependsOn.includes(data.playback[index - 1].eventId), "遺失前一段依賴");
        exactKeys(event.payload, payloadKeys[event.type], "Playback payload");
        const p = event.payload;
        if (event.type === "ballInPlay") assert(p.ballType === "groundBall" && ["leftSide", "middle", "rightSide"].includes(p.direction) && ["weak", "moderate", "firm", "hard"].includes(p.pace) && [null, "shallow", "medium", "deep"].includes(p.depth), "未知來球資料");
        if (["approach", "control", "throw", "receive"].includes(event.type)) {
          assert(nonempty(p.actorId), "缺少動作 actor");
          const statuses = event.type === "approach" ? ["completed", "late"] : event.type === "control" ? ["completed", "recovered", "failed"] : ["completed", "failed", "notAttempted"];
          assert(statuses.includes(p.status), "未知動作 status");
        }
        if (["throw", "receive", "contest"].includes(event.type)) assert(["first", "second", "third", "home"].includes(p.targetBase), "未知目標壘包");
        if (event.type === "throw") assert(nonempty(p.receiverId) || (p.receiverId === null && p.status === "notAttempted"), "傳球缺少 receiver");
        if (event.type === "contest") assert(nonempty(p.runnerId) && ["defenseClearlyAhead", "runnerClearlyAhead", "closePlay", "noContest"].includes(p.comparison), "未知時序比較");
        if (event.type === "result") assert(["oneOut", "twoOuts", "zeroOuts", "error"].includes(p.resultCode) && p.resultCode === r.resultCode && [0, 1, 2].includes(p.outsCreated) && typeof p.error === "boolean", "結果 beat 不一致");
        seen.add(event.eventId);
      });
      return Object.freeze({ ok: true, message: "" });
    } catch (error) { return Object.freeze({ ok: false, message: error.message }); }
  }

  function createDemo(fixture, options = {}) {
    const route = options.presentationRoute || { version: "match-ui-slice/0.1" };
    const continuous = options.presentationMode === "continuous", clockContract = options.clockContract;
    let clockPlan = null, playTime = 0, readElapsed = 0, clockAnchor = 0;
    let publicViews = fixture;
    const schedule = options.schedule || ((fn, delay) => setTimeout(fn, delay));
    const cancel = options.cancel || (id => clearTimeout(id));
    const now = options.now || (() => performance.now());
    const submissionMs = options.submissionMs ?? presentation.TIMING.submission;
    let timer = null, epoch = 0, disposed = false, deadline = 0, remainingMs = 0, fullDurationMs = 0;
    let readingPolicy = null, lastAdvanceAt = -Infinity;
    let state = { phase: "Loading", playbackStage: "idle", debugMode: false, decisionStage: "incomingBall", previewRouteId: "", textMode: options.textMode === true, reducedMotion: options.reducedMotion === true, beatIndex: -1, paused: options.reducedMotion === true || options.textMode === true, submitted: false, selectedRouteId: "", error: "", session: 1, submissionCount: 0, playbackRuns: 0, replayRuns: 0, continueCount: 0 };
    const listeners = new Set();
    function snapshot() { return Object.freeze({ ...state }); }
    function clearTimer() { epoch += 1; if (timer !== null) cancel(timer); timer = null; }
    function emit() { if (!disposed) listeners.forEach(fn => fn(getView())); }
    function arm(fn, delay) {
      clearTimer(); const token = epoch;
      timer = schedule(() => { if (disposed || token !== epoch) return; timer = null; fn(); }, delay);
    }
    function policyForCurrentBeat() {
      const event = fixture.playback[state.beatIndex];
      return presentation.readingFor(event.type, describeBeat(event), state);
    }
    function independentMotion() { return clockPlan?.independentMotion === true; }
    function motionLimit() { return independentMotion() ? (state.phase === "Resolution" ? clockPlan.exitEnd : clockPlan.motionEnd) : Math.min(clockPlan.motionEnd, clockPlan.intervals[state.beatIndex].end); }
    function motionBeatFor(t) { return fixture.playback[Math.min(5, Math.max(0, clockPlan.intervals.findIndex(i => t < i.end)))]; }
    function clockSample() {
      const active = !disposed && !state.paused && (state.phase === "Playback" && (independentMotion() || state.playbackStage !== "awaitingConfirmation") || independentMotion() && state.phase === "Resolution");
      const delta = active ? Math.max(0, now() - clockAnchor) : 0;
      return { playTime: clockPlan ? clockContract.integrate(playTime, delta, ["Playback", "Resolution"].includes(state.phase) ? motionLimit() : playTime) : 0,
        readElapsed: Math.min(readingPolicy?.holdMs || 0, readElapsed + delta) };
    }
    function syncClock() { const sample = clockSample(); playTime = sample.playTime; readElapsed = sample.readElapsed; clockAnchor = now(); }
    function clockView(sample = clockSample()) {
      const active = state.phase === "Playback";
      const complete = Boolean(clockPlan && sample.playTime >= clockPlan.motionEnd);
      return clockContract.snapshot({ presentationMode: "continuous", playbackRunId: state.playbackRuns, epoch,
        playTime: sample.playTime, motionComplete: complete, paused: state.paused,
        ...(independentMotion() ? { revealPolicy: clockPlan.revealPolicy, motionMilestone: active ? "motion:" + motionBeatFor(sample.playTime).type : null, rate: clockContract.rateAt(sample.playTime), exitComplete: sample.playTime >= clockPlan.exitEnd } : {}),
        currentSemanticBeat: active ? fixture.playback[state.beatIndex].type : null,
        readingState: { status: active ? state.playbackStage : "idle", elapsed: sample.readElapsed,
          remaining: active ? Math.max(0, (readingPolicy?.holdMs || 0) - sample.readElapsed) : 0 },
        waitingAtBoundary: !independentMotion() && active && !complete && sample.playTime >= motionLimit(),
        resultRevealAllowed: complete && (active && state.beatIndex === 6 || state.phase === "Resolution"),
        resolutionConfirmed: ["Resolution", "Continue"].includes(state.phase) });
    }
    function prepareBeat() {
      fullDurationMs = options.beatMs ?? presentation.durationFor(fixture.playback[state.beatIndex].type);
      readingPolicy = policyForCurrentBeat(); remainingMs = fullDurationMs;
      state = { ...state, playbackStage: "animation" };
      if (continuous) {
        if (!independentMotion() || state.beatIndex === 0) playTime = Math.min(clockPlan.motionEnd, clockPlan.intervals[state.beatIndex].start);
        if (independentMotion() && state.beatIndex === 6) playTime = clockPlan.motionEnd;
        readElapsed = 0; clockAnchor = now();
        state = { ...state, playbackStage: "readingHold" };
        if (state.reducedMotion || state.textMode) playTime = independentMotion() ? Math.max(playTime,Math.min(clockPlan.motionEnd,clockPlan.intervals[state.beatIndex].end)) : motionLimit();
      }
    }
    function autoNext() {
      if (state.phase !== "Playback" || state.paused || state.playbackStage === "awaitingConfirmation") return;
      if (continuous) {
        const sample = clockSample();
        const motionWait = independentMotion() ? (state.beatIndex === 5 ? clockContract.remainingWall(sample.playTime, clockPlan.motionEnd) : 0) : motionLimit() - sample.playTime;
        arm(completeStage, Math.max(motionWait, readingPolicy.holdMs - sample.readElapsed));
        return;
      }
      deadline = now() + remainingMs; arm(completeStage, remainingMs);
    }
    function advanceBeat() {
      if (continuous) syncClock();
      clearTimer(); lastAdvanceAt = now();
      if (state.beatIndex === fixture.playback.length - 1) { state = { ...state, phase: "Resolution", playbackStage: "idle" }; if (independentMotion()) { clockAnchor = now(); if (state.reducedMotion || state.textMode) playTime = clockPlan.exitEnd; } }
      else { state = { ...state, beatIndex: state.beatIndex + 1 }; prepareBeat(); }
      autoNext(); emit(); return true;
    }
    function completeStage() {
      if (state.phase !== "Playback" || state.paused) return;
      if (continuous) {
        syncClock();
        if (readingPolicy.requiresConfirmation) { clearTimer(); state = { ...state, playbackStage: "awaitingConfirmation" }; emit(); }
        else advanceBeat();
        return;
      }
      if (state.playbackStage === "animation") {
        state = { ...state, playbackStage: "readingHold" }; remainingMs = readingPolicy.holdMs;
        autoNext(); emit();
      } else if (state.playbackStage === "readingHold") {
        if (readingPolicy.requiresConfirmation) {
          state = { ...state, playbackStage: "awaitingConfirmation" }; remainingMs = 0; emit();
        } else advanceBeat();
      }
    }
    function beginDecisionPresentation() {
      clearTimer();
      state = { ...state, decisionStage: state.reducedMotion || state.textMode ? "fieldingFocus" : "incomingBall" };
      if (state.decisionStage === "incomingBall") arm(() => { if (state.phase !== "Decision") return; state = { ...state, decisionStage: "fieldingFocus" }; emit(); }, presentation.TIMING.incomingBall);
    }
    function getView() {
      const sample = continuous && clockPlan ? clockSample() : null;
      const valid = !["Loading", "DataError"].includes(state.phase);
      const resolved = ["Resolution", "Continue"].includes(state.phase);
      const stageRemainingMs = state.phase !== "Playback" || state.playbackStage === "awaitingConfirmation" ? 0 : continuous ? Math.max(0, readingPolicy.holdMs - sample.readElapsed) : state.paused ? remainingMs : Math.max(0, deadline - now());
      const beatRemainingMs = continuous && state.phase === "Playback" ? Math.max(0, clockPlan.intervals[state.beatIndex].end - sample.playTime) : state.playbackStage === "animation" ? stageRemainingMs : 0;
      return Object.freeze({ ...snapshot(), ...(independentMotion() && state.phase === "Playback" ? { motionBeat: motionBeatFor(sample.playTime), motionRevealedBeats: Object.freeze(fixture.playback.slice(0, motionBeatFor(sample.playTime).presentationSequence)) } : {}), presentationMode: continuous ? "continuous" : "legacy", presentationClock: continuous && clockPlan ? clockView(sample) : null, presentationVersion: route.version, beatDurationMs: fullDurationMs, beatRemainingMs, stageRemainingMs, readingDurationMs: readingPolicy?.holdMs || 0, requiresConfirmation: Boolean(readingPolicy?.requiresConfirmation), beatElapsedMs: state.phase === "Playback" ? continuous ? sample.playTime - clockPlan.intervals[state.beatIndex].start : Math.max(0, fullDurationMs - beatRemainingMs) : 0, title: TITLES[state.phase], decision: valid ? publicViews.decision : null, scoreState: valid ? (resolved ? publicViews.resolution.state : publicViews.decision.state) : null, currentBeat: state.phase === "Playback" ? fixture.playback[state.beatIndex] : null, revealedBeats: state.phase === "Playback" ? Object.freeze(fixture.playback.slice(0, state.beatIndex + 1)) : Object.freeze([]), resolution: state.phase === "Resolution" ? publicViews.resolution : null });
    }
    function start() {
      if (disposed || state.phase !== "Loading") return false;
      let validation = validateFixture(fixture);
      if (validation.ok) try {
        assert(options.presentationMode === undefined || ["legacy", "continuous"].includes(options.presentationMode), "Unknown presentation mode");
        if (continuous) {
          assert(route.version === "match-ui-slice/0.2" && clockContract?.VERSION === "presentation-clock/0.1", "Continuous mode requires v0.2 and clock contract");
          assert(["createPlan", "integrate", "snapshot"].every(key => typeof clockContract[key] === "function"), "Incomplete clock contract");
          clockPlan = clockContract.createPlan(fixture.playback, presentation.durationFor);
          if (clockPlan.independentMotion) assert(clockPlan.revealPolicy === "ss63-motion-milestones/0.1" && clockPlan.exitEnd === clockPlan.motionEnd + 900 && ["remainingWall", "rateAt"].every(k => typeof clockContract[k] === "function"), "Invalid motion publication contract");
        }
        if (route.version === "match-ui-slice/0.2") {
          assert(route.adapter?.VERSION === route.version, "缺少 v0.2 離線演出資料");
          publicViews = route.adapter.connect(fixture);
        } else assert(route.version === "match-ui-slice/0.1", "未知演出資料版本");
      } catch (error) { validation = { ok: false, message: error.message }; }
      state = { ...state, phase: validation.ok ? "Decision" : "DataError", error: validation.message };
      if (validation.ok) beginDecisionPresentation(); emit(); return validation.ok;
    }
    function submit(routeId) {
      if (disposed || state.phase !== "Decision" || state.submitted) return false;
      const choice = fixture.decision.choices.find(c => c.routeId === routeId);
      if (!choice) return false;
      clearTimer();
      state = { ...state, selectedRouteId: choice.routeId };
      if (routeId !== ROUTES[0]) { state = { ...state, phase: "Unsupported" }; emit(); return true; }
      state = { ...state, phase: "Submitting", submitted: true, submissionCount: state.submissionCount + 1 }; emit();
      arm(() => { state = { ...state, phase: "Playback", previewRouteId: "", beatIndex: 0, paused: state.reducedMotion || state.textMode, playbackRuns: state.playbackRuns + 1 }; prepareBeat(); autoNext(); emit(); }, submissionMs);
      return true;
    }
    function returnToDecision() {
      if (disposed || state.phase !== "Unsupported") return false;
      state = { ...state, phase: "Decision", decisionStage: "fieldingFocus", previewRouteId: state.selectedRouteId }; emit(); return true;
    }
    function next(expectedEventId) {
      if (disposed || state.phase !== "Playback" || now() - lastAdvanceAt < presentation.READING.nextGuardMs) return false;
      if (typeof expectedEventId === "string" && expectedEventId !== fixture.playback[state.beatIndex].eventId) return false;
      if (continuous) { syncClock(); playTime = independentMotion() ? Math.max(playTime, Math.min(clockPlan.motionEnd,clockPlan.intervals[state.beatIndex].end)) : motionLimit(); readElapsed = readingPolicy.holdMs; }
      return advanceBeat();
    }
    function pause() { if (disposed || !(state.phase === "Playback" || independentMotion() && state.phase === "Resolution") || state.paused) return false; if (continuous) { syncClock(); clearTimer(); state = { ...state, paused: true }; emit(); return true; } remainingMs = state.playbackStage === "awaitingConfirmation" ? 0 : Math.max(0, deadline - now()); clearTimer(); state = { ...state, paused: true }; emit(); return true; }
    function resume() { if (disposed || !(state.phase === "Playback" || independentMotion() && state.phase === "Resolution") || !state.paused) return false; if (continuous) clockAnchor = now(); state = { ...state, paused: false }; autoNext(); emit(); return true; }
    function skip() {
      if (disposed || state.phase !== "Playback") return false;
      if (route.version === "match-ui-slice/0.2") {
        if (state.playbackStage === "awaitingConfirmation") return false;
        clearTimer(); state = { ...state, beatIndex: fixture.playback.length - 1 };
        prepareBeat(); state = { ...state, playbackStage: "awaitingConfirmation" };
        remainingMs = 0; if (continuous) { playTime = clockPlan.motionEnd; readElapsed = readingPolicy.holdMs; } lastAdvanceAt = now(); emit(); return true;
      }
      clearTimer(); state = { ...state, phase: "Resolution", playbackStage: "idle" }; emit(); return true;
    }
    function replay() { if (disposed || state.phase !== "Resolution") return false; clearTimer(); lastAdvanceAt = -Infinity; state = { ...state, phase: "Playback", beatIndex: 0, paused: state.reducedMotion || state.textMode, playbackRuns: state.playbackRuns + 1, replayRuns: state.replayRuns + 1 }; prepareBeat(); autoNext(); emit(); return true; }
    function finish() { if (disposed || state.phase !== "Resolution") return false; if (independentMotion()) playTime = clockPlan.exitEnd; clearTimer(); state = { ...state, phase: "Continue", continueCount: state.continueCount + 1 }; emit(); return true; }
    function restart() {
      if (disposed || !["Continue", "DataError"].includes(state.phase)) return false;
      clearTimer(); lastAdvanceAt = -Infinity; readingPolicy = null; playTime = 0; readElapsed = 0; state = { ...state, phase: "Loading", playbackStage: "idle", beatIndex: -1, paused: state.reducedMotion || state.textMode, submitted: false, selectedRouteId: "", previewRouteId: "", error: "", session: state.session + 1 }; emit(); return start();
    }
    function preview(routeId) {
      if (disposed || state.phase !== "Decision" || !presentation.intentFor(routeId)) return false;
      clearTimer(); state = { ...state, previewRouteId: routeId, decisionStage: "fieldingFocus" }; emit(); return true;
    }
    function clearPreview() { if (disposed || state.phase !== "Decision" || !state.previewRouteId) return false; state = { ...state, previewRouteId: "" }; emit(); return true; }
    function setMode(key, enabled) {
      if (disposed || state[key] === Boolean(enabled)) return false;
      if (state.phase === "Playback" || independentMotion() && state.phase === "Resolution") pause();
      state = { ...state, [key]: Boolean(enabled) };
      if (state.phase === "Decision") { clearTimer(); state = { ...state, decisionStage: "fieldingFocus" }; }
      if (state.phase === "Playback") {
        const previousHoldMs = readingPolicy.holdMs; readingPolicy = policyForCurrentBeat();
        if (state.playbackStage === "readingHold") remainingMs = Math.max(remainingMs, readingPolicy.holdMs - previousHoldMs + remainingMs);
        if (continuous && (state.reducedMotion || state.textMode)) playTime = independentMotion() ? Math.max(playTime,Math.min(clockPlan.motionEnd,clockPlan.intervals[state.beatIndex].end)) : motionLimit();
        state = { ...state, paused: true };
      }
      if (independentMotion() && state.phase === "Resolution" && (state.reducedMotion || state.textMode)) playTime = clockPlan.exitEnd;
      emit(); return true;
    }
    function setDebugMode(enabled) { if (disposed || state.debugMode === Boolean(enabled)) return false; state = { ...state, debugMode: Boolean(enabled) }; emit(); return true; }
    return Object.freeze({ start, submit, returnToDecision, next, pause, resume, skip, replay, finish, restart, preview, clearPreview, setTextMode: enabled => setMode("textMode", enabled), setReducedMotion: enabled => setMode("reducedMotion", enabled), setDebugMode, getView, getState: snapshot, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }, destroy() { clearTimer(); disposed = true; listeners.clear(); } });
  }

  function occupancy(bases) { const labels = bases.map((occupied, i) => occupied ? ["一壘", "二壘", "三壘"][i] : null).filter(Boolean); return labels.length ? labels.join("、") + "有人" : "壘上無人"; }
  function describeBeat(event) {
    const p = event.payload;
    switch (event.type) {
      case "ballInPlay": return ({ leftSide: "滾地球進入球場左側的守備區域。", middle: "滾地球進入球場中間的守備區域。", rightSide: "滾地球進入球場右側的守備區域。" })[p.direction];
      case "approach": return p.status === "completed" ? "你迎向來球，進入處理位置。" : "你追向來球，腳步慢了一拍。";
      case "control": return p.status === "completed" ? "你控制住來球，準備傳球。" : p.status === "recovered" ? "你調整後重新控制來球。" : "你未能控制來球。";
      case "throw": return p.status === "notAttempted" ? "這一段沒有進行傳球。" : p.status === "failed" ? "傳球動作未能完成。" : "游擊手將球傳向" + ({ first: "一壘", second: "二壘", third: "三壘", home: "本壘" })[p.targetBase] + "。";
      case "receive": return p.status === "completed" ? "接球者接到傳球，守住目標壘包。" : p.status === "notAttempted" ? "這一段沒有接傳動作。" : "接球者未完成接傳。";
      case "contest": return p.comparison === "noContest" ? "這一球沒有形成到壘競爭。" : "傳球與跑者同時奔向一壘，等待判決。";
      case "result": return "本球完成 " + p.outsCreated + " 個出局；" + (p.error ? "有守備失誤。" : "沒有守備失誤。") + "確認後查看結算。";
      default: return "無法顯示這段事件。";
    }
  }

  function mount(document, fixture, environment = {}, presentationRoute, policy = {}) {
    const el = id => document.getElementById(id);
    const motionPreference = environment.matchMedia?.("(prefers-reduced-motion: reduce)");
    const reducedMotion = Boolean(motionPreference?.matches);
    const demo = createDemo(fixture, {
      presentationMode: policy.presentationMode, clockContract: policy.clockContract,
      presentationRoute,
      reducedMotion,
      schedule: environment.setTimeout ? (fn, delay) => environment.setTimeout(fn, delay) : undefined,
      cancel: environment.clearTimeout ? id => environment.clearTimeout(id) : undefined,
      now: environment.performance ? () => environment.performance.now() : undefined
    });
    const screens = { Loading: "loading-screen", Decision: "decision-screen", Submitting: "submitting-screen", Playback: "playback-screen", Resolution: "resolution-screen", Unsupported: "unsupported-screen", DataError: "error-screen", Continue: "continue-screen" };
    let previousPhase = "Loading", choiceButtons = [], choicesBuilt = false;
    let motionKey = "", visualAnimations = [];
    let motionFrame = null, renderEpoch = 0;
    const continuous = policy.presentationMode === "continuous";
    function stopMotionLoop() {
      renderEpoch += 1;
      if (motionFrame !== null) environment.cancelAnimationFrame?.(motionFrame);
      motionFrame = null;
    }
    function drawContinuous(view, scene) {
      // The app is the sole SVG writer. Projectors receive data, never DOM or Controller handles.
      const ids = ["actor-ss", "actor-receiver", "actor-original-runner", "actor-batter-runner"];
      let pose = { actors: scene.actors, ball: scene.ball };
      if (view.phase === "Playback" || view.phase === "Resolution" && view.presentationClock?.revealPolicy) {
        try {
          pose = policy.motionProjector?.(Object.freeze({ clock: view.presentationClock, phase: view.phase,
            currentBeat: view.motionBeat || view.currentBeat, reducedMotion: view.reducedMotion, textMode: view.textMode }));
          assert(pose && Array.isArray(pose.actors) && pose.actors.length === ids.length, "Incomplete motion pose");
          assert(new Set(pose.actors.map(a => a.elementId)).size === ids.length, "Duplicate actor pose");
          pose.actors.forEach(a => assert(ids.includes(a.elementId) && Number.isFinite(a.x) && Number.isFinite(a.y), "Invalid actor pose"));
          assert(Number.isFinite(pose.ball?.x) && Number.isFinite(pose.ball?.y), "Invalid ball pose");
        } catch (_) { pose = null; }
      }
      el("field").dataset.motionOwner = "controller-projector";
      el("field").dataset.trackStatus = pose ? "sampled" : "blocked";
      show("actors-layer", scene.active && Boolean(pose)); show("ball-marker", scene.ball.visible && Boolean(pose));
      show("focus-layer", scene.focus.visible && Boolean(pose));
      if (!pose) return; // Missing/unapproved tracks never fall back to legacy moving poses.
      for (const actor of pose.actors) el(actor.elementId).setAttribute("transform", "translate(" + actor.x + " " + actor.y + ")");
      el("ball-marker").setAttribute("transform", "translate(" + pose.ball.x + " " + pose.ball.y + ")");
    }
    function visualScene(view) { return presentation.project(view.motionBeat && view.currentBeat?.type !== "result" ? { ...view, currentBeat:view.motionBeat, revealedBeats:view.motionRevealedBeats } : view); }
    function queueMotionFrame(view) {
      stopMotionLoop();
      const exiting = view.phase === "Resolution" && view.presentationClock?.revealPolicy && !view.presentationClock.exitComplete;
      if (!(view.phase === "Playback" || exiting) || view.paused || view.textMode || view.reducedMotion || view.playbackStage === "awaitingConfirmation" || !environment.requestAnimationFrame) return;
      const token = renderEpoch, clockEpoch = view.presentationClock.epoch, run = view.playbackRuns;
      const refresh = () => {
        if (token !== renderEpoch) return;
        motionFrame = null;
        const current = demo.getView();
        if (current.presentationClock?.epoch !== clockEpoch || current.playbackRuns !== run || !(current.phase === "Playback" || current.phase === "Resolution" && current.presentationClock?.revealPolicy)) return;
        if (current.presentationClock?.revealPolicy) { renderScene(current); return; }
        drawContinuous(current, visualScene(current));
        if (current.phase === "Resolution" && current.presentationClock.exitComplete) return;
        motionFrame = environment.requestAnimationFrame(refresh); // Refresh only; time always comes from demo.getView().
      };
      motionFrame = environment.requestAnimationFrame(refresh);
    }
    function text(id, value) { el(id).textContent = value; }
    function button(id, handler) { el(id).addEventListener("click", handler); }
    function buildChoices(decision) {
      choiceButtons = decision.choices.map(choice => {
        const node = document.createElement("button"); node.type = "button"; node.className = "choice"; node.id = "choice-" + choice.routeId; node.dataset.routeId = choice.routeId;
        const label = document.createElement("span"); label.className = "choice-label"; label.textContent = choice.label;
        const objective = document.createElement("span"); objective.className = "choice-objective"; objective.textContent = choice.objectiveText;
        const meta = document.createElement("span"); meta.className = "choice-meta";
        const risk = document.createElement("span"); risk.className = "risk-tag"; risk.dataset.risk = choice.risk; risk.textContent = "風險 " + ({ low: "低", medium: "中", high: "高" })[choice.risk];
        const route = document.createElement("span"); route.className = "route-tag"; route.textContent = choice.routeLabel;
        meta.append(risk); node.append(route, objective, meta, label);
        node.addEventListener("pointerenter", () => demo.preview(choice.routeId));
        node.addEventListener("focus", () => demo.preview(choice.routeId));
        node.addEventListener("pointerleave", () => { if (document.activeElement !== node) demo.clearPreview(); });
        node.addEventListener("blur", demo.clearPreview);
        node.addEventListener("click", () => demo.submit(choice.routeId)); return node;
      });
      el("choices").replaceChildren(...choiceButtons); choicesBuilt = true;
    }
    function show(id, visible) {
      const node = el(id); node.hidden = !visible;
      if (visible) node.removeAttribute("hidden"); else node.setAttribute("hidden", "");
      node.setAttribute("aria-hidden", String(!visible));
    }
    function renderScene(view) {
      const scene = visualScene(view), field = el("field");
      el("demo").dataset.phase = view.phase; el("demo").dataset.textMode = String(view.textMode);
      field.dataset.stage = scene.stage; field.dataset.dim = String(scene.focus.dimField); field.dataset.control = scene.controlState;
      field.dataset.motion = scene.motionAllowed ? "on" : "off";
      show("field", scene.active && !scene.textMode);
      show("actors-layer", scene.active); show("ball-marker", scene.ball.visible);
      text("field-stage-label", scene.caption);
      text("field-scene-status", scene.caption); text("actor-position-notice", view.debugMode ? scene.actorNotice : "");
      text("field-desc", scene.caption + "。" + (scene.occupancy ? occupancy(scene.occupancy) + "。" : "") + scene.actors.map(actor => actor.label).join("、") + "。金色外環標示你的守備員；藍色守方，暖橘色攻方，另以位置、路線與動作辨識。");
      text("intent-caption", scene.preview ? scene.preview.label : "");
      show("intent-notice", Boolean(scene.preview)); show("intent-routes", Boolean(scene.preview));
      el("intent-route-first").setAttribute("d", scene.preview?.paths[0] || "");
      el("intent-route-second").setAttribute("d", scene.preview?.paths[1] || ""); show("hold-intent", Boolean(scene.preview?.hold));
      for (const [id, route] of [["incoming-route", scene.routes.incoming], ["executed-route", scene.routes.executed], ["competition-route", scene.routes.competition]]) el(id).setAttribute("d", route);
      for (const actor of scene.actors) {
        const node = el(actor.elementId); if (!continuous) node.setAttribute("transform", "translate(" + actor.x + " " + actor.y + ")");
        node.setAttribute("data-actor-key", actor.key); node.setAttribute("data-source-id", actor.sourceId || ""); node.setAttribute("aria-label", actor.label);
        node.setAttribute("data-team", actor.team); node.setAttribute("data-player", String(actor.isPlayer));
        node.setAttribute("data-retired", String(view.phase === "Resolution" && actor.label.includes("出局")));
      }
      if (!continuous) el("ball-marker").setAttribute("transform", "translate(" + scene.ball.x + " " + scene.ball.y + ")");
      show("focus-layer", scene.focus.visible);
      el("focus-layer").setAttribute("data-side", scene.focus.layout?.side || "");
      if (scene.focus.layout) for (const [id, coordinates] of [["player-focus-paper", scene.focus.layout.paper], ["player-focus-viewport", scene.focus.layout.viewport]]) {
        ["x", "y", "width", "height"].forEach((key, index) => el(id).setAttribute(key, String(coordinates[index])));
      }
      el("player-focus-viewport").setAttribute("viewBox", scene.focus.box.join(" "));
      show("svg-result-layer", Boolean(scene.result)); text("svg-result-text", scene.result?.text || "");
      text("toggle-text-mode", view.textMode ? "返回球場演出" : "使用文字模式"); el("toggle-text-mode").setAttribute("aria-pressed", String(view.textMode));
      text("display-mode-note", view.textMode ? "文字模式" : view.reducedMotion ? "減少動態" : "球場演出");
      show("debug-scene", view.debugMode); show("debug-beat", view.debugMode && Boolean(view.currentBeat)); show("debug-routes", view.debugMode && Boolean(view.resolution));
      text("toggle-debug", view.debugMode ? "關閉開發資訊" : "開發資訊"); el("toggle-debug").setAttribute("aria-pressed", String(view.debugMode));
      text("actor-debug-identities", view.debugMode ? scene.actors.map(actor => actor.symbol + " · " + actor.key + " · " + (actor.sourceId || "unbound")).join("\n") : "");
      choiceButtons.forEach(node => node.setAttribute("data-previewed", String(node.dataset.routeId === scene.preview?.routeId)));
      if (continuous) { drawContinuous(view, scene); queueMotionFrame(view); return; }
      const nextKey = scene.motionKey + ":" + scene.motionAllowed;
      if (nextKey !== motionKey) {
        visualAnimations.forEach(animation => animation.cancel()); visualAnimations = []; motionKey = nextKey;
        if (scene.motionAllowed) for (const movement of scene.movements) {
          const node = el(movement.key);
          if (typeof node.animate !== "function") continue;
          const frame = point => ({ transform: "translate(" + point[0] + "px," + point[1] + "px)" });
          const animation = node.animate([frame(movement.from), frame(movement.to)], { duration: scene.durationMs, easing: "ease-out", fill: "both" });
          animation.currentTime = Math.min(scene.elapsedMs, scene.durationMs);
          visualAnimations.push(animation);
        }
      }
      // Visual animations have no completion callbacks and cannot advance the Controller.
      visualAnimations.forEach(animation => {
        if (view.phase === "Playback" && view.playbackStage !== "animation") { animation.currentTime = scene.durationMs; animation.pause(); }
        else if (view.phase === "Playback" && view.paused) animation.pause();
        else if (animation.playState === "paused") animation.play();
      });
    }
    function render(view) {
      const changed = previousPhase !== view.phase;
      el("demo").dataset.presentationVersion = view.presentationVersion;
      PHASES.forEach(phase => { el(screens[phase]).hidden = phase !== view.phase; });
      text("screen-heading", view.title); text("phase-label", ({ Loading:"準備中", Decision:"判斷", Submitting:"已確認", Playback:"經過", Resolution:"結果", Continue:"結束", Unsupported:"尚未收錄", DataError:"資料錯誤" })[view.phase]);
      text("screen-kicker", "一球之間");
      el("demo").setAttribute("aria-busy", String(["Loading", "Submitting"].includes(view.phase)));
      ["decision", "playback", "resolution"].forEach(phase => {
        const active = phase === "decision" ? ["Decision", "Submitting", "Unsupported"].includes(view.phase) : phase === "playback" ? view.phase === "Playback" : ["Resolution", "Continue"].includes(view.phase);
        if (active) el("phase-" + phase).setAttribute("aria-current", "step"); else el("phase-" + phase).removeAttribute("aria-current");
      });
      el("match-overview").hidden = !view.scoreState;
      el("context-panel").hidden = !view.decision || !["Decision", "Submitting", "Unsupported"].includes(view.phase);
      if (view.decision) {
        if (!choicesBuilt) buildChoices(view.decision);
        text("situation-text", view.decision.situationText);
        const observations = [];
        const observationLabels = view.presentationVersion === "match-ui-slice/0.2"
          ? { ballDirectionText: "來球方向", ballTerritoryText: "守區", ballPaceCueText: "球況", runnerMovementText: "跑者觀察", pressureText: "局勢觀察", firstBasePressureText: "一壘窗口", secondBasePressureText: "二壘窗口" }
          : { directionText: "來球方向", paceText: "球況", runnerCue: "跑者觀察", readCue: "局勢觀察" };
        for (const [key, label] of Object.entries(observationLabels)) {
          const value = view.decision.observations[key];
          if (typeof value !== "string" || !value.trim()) continue;
          const dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = label; dd.textContent = value; observations.push(dt, dd);
        }
        el("observations").replaceChildren(...observations); el("observations").hidden = observations.length === 0;
      }
      choiceButtons.forEach(node => { node.disabled = view.phase !== "Decision"; });
      el("choices").setAttribute("aria-busy", String(view.phase === "Submitting"));
      if (view.scoreState) {
        const state = view.scoreState, decision = view.decision;
        text("inning-label", numeral(decision.inning) + "局" + (decision.half === "top" ? "上" : "下"));
        text("position-label", "你的守位 · 游擊");
        text("home-score", String(state.scores.home)); text("away-score", String(state.scores.away));
        text("outs-label", numeral(state.outs) + "出局"); text("bases-label", occupancy(state.bases)); text("field-occupancy", occupancy(state.bases));
        Array.from(document.querySelectorAll(".out-dots i")).forEach((node, i) => node.classList.toggle("filled", i < state.outs));
        ["first", "second", "third"].forEach((base, i) => el("base-" + base).classList.toggle("occupied", state.bases[i]));
      }
      if (view.currentBeat) {
        const event = view.currentBeat;
        text("beat-count", event.presentationSequence + " / 7"); text("beat-title", BEAT_TITLES[event.type]); text("beat-text", describeBeat(event));
        text("beat-event-id", view.debugMode ? event.eventId : ""); text("beat-sequence", view.debugMode ? String(event.presentationSequence) : ""); text("beat-type", view.debugMode ? event.type : "");
        el("beat-history").replaceChildren(...view.revealedBeats.map(item => { const li = document.createElement("li"); li.textContent = item.presentationSequence + " · " + BEAT_TITLES[item.type]; if (item.eventId === event.eventId) li.setAttribute("aria-current", "step"); return li; }));
        text("playback-mode", view.reducedMotion || view.textMode ? "預設暫停，可逐段閱讀或繼續播放。" : "");
        text("toggle-playback", view.paused ? "繼續播放" : "暫停"); text("next-beat", event.type === "result" ? "查看正式結算" : "下一段");
        el("toggle-playback").disabled = view.playbackStage === "awaitingConfirmation";
        if (el("toggle-playback").disabled && document.activeElement === el("toggle-playback")) el("next-beat").focus();
        const status = view.playbackStage === "awaitingConfirmation" ? "讀完後，請確認繼續。" : view.paused ? "已暫停" : view.playbackStage === "readingHold" ? "留一點時間，看清這一球。" : "演出中";
        text("playback-status", status);
        el("demo").dataset.playbackStage = view.playbackStage;
      } else {
        // Remove stale payload text as well as hiding the panel: a restart cannot retain an old result in the DOM.
        ["beat-count", "beat-title", "beat-text", "beat-event-id", "beat-sequence", "beat-type", "playback-status"].forEach(id => text(id, "")); el("beat-history").replaceChildren();
        el("demo").dataset.playbackStage = "idle";
      }
      const consequence = view.resolution?.schemaVersion === "match-ui-slice/0.2" ? view.resolution : null;
      show("consequence-summary", Boolean(consequence));
      show("resolution-details", Boolean(view.resolution));
      if (consequence) {
        const change = consequence.stateChange, achieved = consequence.achievedOutcome;
        text("outs-change", "出局數 " + change.before.outs + " → " + change.after.outs);
        const score = change.after.scores;
        text("score-change", "比分 主 " + score.home + " · 客 " + score.away + (change.scoreDelta.home === 0 && change.scoreDelta.away === 0 ? "（不變）" : ""));
        text("selected-objective", "原本目標：" + consequence.selectedObjective.objectiveText + "。");
        const batter = consequence.runnerChanges.find(item => item.from === "batter" && achieved.outRunnerIds.includes(item.runnerId));
        const runner = consequence.runnerChanges.find(item => item.from === 1 && item.to === 2 && achieved.advancedRunnerIds.includes(item.runnerId));
        text("achieved-outcome", "實際結果：" + [batter ? "打者出局" : "", runner ? "原一壘跑者推進二壘" : ""].filter(Boolean).join("，") + "。");
        text("verified-tradeoff-text", consequence.verifiedTradeoffText || "");
        el("verified-tradeoff-text").hidden = consequence.verifiedTradeoffText === null;
      } else {
        ["outs-change", "score-change", "selected-objective", "achieved-outcome", "verified-tradeoff-text"].forEach(id => text(id, ""));
      }
      if (!view.resolution) el("resolution-details").open = false;
      if (view.resolution) {
        text("outcome-text", view.resolution.outcomeText); text("feedback-text", view.resolution.feedbackText || ""); el("feedback-text").hidden = view.resolution.feedbackText === null;
        text("selected-route", view.debugMode ? view.resolution.selectedRouteId : ""); text("actual-route", view.debugMode ? view.resolution.actualRouteId : "");
      } else ["outcome-text", "feedback-text", "selected-route", "actual-route"].forEach(id => text(id, ""));
      if (view.phase === "Unsupported") { const choice = fixture.decision.choices.find(c => c.routeId === view.selectedRouteId); text("unsupported-text", "你選擇「" + choice.label + "」（" + choice.routeLabel + "）。此離線示範沒有這條路線的執行結果。"); } else text("unsupported-text", "");
      text("error-text", view.error);
      renderScene(view);
      if (changed) {
        const returnButton = previousPhase === "Unsupported" && view.phase === "Decision" ? el("choice-" + view.selectedRouteId) : null;
        (returnButton || el("screen-heading")).focus();
        text("result-announcement", view.phase === "Resolution" ? view.resolution.outcomeText : "");
      }
      previousPhase = view.phase;
    }
    button("toggle-playback", () => demo.getState().paused ? demo.resume() : demo.pause());
    button("next-beat", () => demo.next(demo.getView().currentBeat?.eventId)); button("skip-playback", demo.skip); button("replay-demo", demo.replay);
    button("continue-demo", demo.finish); button("back-to-decision", demo.returnToDecision); button("restart-demo", demo.restart); button("retry-data", demo.restart);
    button("toggle-text-mode", () => demo.setTextMode(!demo.getState().textMode));
    button("toggle-debug", () => demo.setDebugMode(!demo.getState().debugMode));
    const preferenceChanged = event => demo.setReducedMotion(event.matches);
    motionPreference?.addEventListener?.("change", preferenceChanged);
    const unsubscribe = demo.subscribe(render); render(demo.getView());
    // Leave an observable, keyboard-readable Loading phase before local validation.
    const bootTimer = (environment.setTimeout || setTimeout)(demo.start, 0);
    environment.addEventListener?.("pagehide", () => { stopMotionLoop(); (environment.clearTimeout || clearTimeout)(bootTimer); motionPreference?.removeEventListener?.("change", preferenceChanged); visualAnimations.forEach(animation => animation.cancel()); unsubscribe(); demo.destroy(); }, { once: true });
    return demo;
  }
  return Object.freeze({ PHASES, ROUTES, BEATS, validateFixture, createDemo, occupancy, describeBeat, mount });
});
