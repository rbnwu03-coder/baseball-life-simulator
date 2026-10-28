/* Stateless, prototype-only presentation. Coordinates and durations are illustrative. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else Object.defineProperty(root, "MatchUIPresentation", { value: api });
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  const TIMING = freeze({ incomingBall: 450, submission: 420, textMinimum: 1400, beats: { ballInPlay: 450, approach: 1100, control: 850, throw: 450, receive: 600, contest: 1100, result: 900 } });
  const READING = freeze({ holds: { ballInPlay: 850, approach: 650, control: 1400, throw: 850, receive: 850, contest: 1700, result: 1200 }, perCharacterMs: 40, longTextCharacters: 100, accessibleMinimum: 1400, nextGuardMs: 150 });
  const POINTS = freeze({ home: [170, 244], first: [268, 154], second: [170, 56], third: [72, 154], ss: [115, 101], fielding: [128, 123], incoming: [137, 132], receiver: [280, 141], originalRunner: [253, 137], batter: [182, 237] });
  const INTENTS = freeze({
    secureFirstBaseOut: { label: "傳向一壘", paths: ["M115 101 L268 154"], hold: false },
    forceSecond: { label: "傳向二壘", paths: ["M115 101 L170 56"], hold: false },
    startDoublePlaySecond: { label: "先傳二壘，再轉一壘", paths: ["M115 101 L170 56", "M170 56 L268 154"], hold: false },
    holdBall: { label: "控制球，不傳球", paths: [], hold: true }
  });
  const INTENT_NOTICE = "戰術意圖示意，非實際執行結果";
  // Placement only; a side rule does not add a supported gameplay position.
  const FOCUS_LAYOUT = freeze({
    SS: { side: "left", paper: [6, 5, 120, 114], viewport: [10, 9, 112, 106] },
    "2B": { side: "right", paper: [214, 5, 120, 114], viewport: [218, 9, 112, 106] }
  });
  function focusLayoutFor(position) { return Object.hasOwn(FOCUS_LAYOUT, position) ? FOCUS_LAYOUT[position] : null; }
  const CAPTIONS = freeze({ incomingBall: "來球進入游擊守區", fieldingFocus: "等待你的選擇", ballInPlay: "來球", approach: "接近來球", control: "接球瞬間", throw: "傳向一壘", receive: "接傳", contest: "等待判決", result: "本球結果", resolution: "守備完成" });
  function durationFor(type) { const duration = TIMING.beats[type]; if (!duration) throw new Error("Unknown presentation beat: " + type); return duration; }
  function readingFor(type, text, mode = {}) {
    if (!Object.hasOwn(READING.holds, type)) throw new Error("Unknown reading beat: " + type);
    const characters = Array.from(String(text || "")).length;
    return freeze({ holdMs: Math.max(READING.holds[type], characters * READING.perCharacterMs, mode.reducedMotion || mode.textMode ? READING.accessibleMinimum : 0), requiresConfirmation: type === "result" || characters > READING.longTextCharacters });
  }
  function intentFor(routeId) { return Object.hasOwn(INTENTS, routeId) ? INTENTS[routeId] : null; }
  const pathBetween = (a, b) => "M" + a.join(" ") + " L" + b.join(" ");

  function project(view) {
    const decision = view.decision;
    const phase = view.phase;
    const beat = phase === "Playback" ? view.currentBeat : null;
    const resolved = phase === "Resolution" && Boolean(view.resolution);
    const stage = phase === "Playback" && beat ? beat.type : resolved ? "resolution" : view.decisionStage || "fieldingFocus";
    const active = Boolean(decision) && !["Loading", "DataError", "Continue"].includes(phase);
    const knownIncoming = Boolean(decision && /游擊守區|游擊手/.test(decision.situationText));
    const previewId = phase === "Decision" ? view.previewRouteId : ["Submitting", "Unsupported"].includes(phase) ? view.selectedRouteId : "";
    const preview = intentFor(previewId);
    const actorKey = role => (decision?.presentationId || "unavailable") + ":actor:" + role;
    let ss = [...POINTS.ss], receiver = [...POINTS.receiver], firstRunner = [...POINTS.originalRunner], batter = [...POINTS.batter];
    let ball = [...POINTS.incoming], ballFrom = [...POINTS.home], ballVisible = active && knownIncoming;
    let incoming = active && knownIncoming && ["Decision", "Submitting", "Unsupported"].includes(phase);
    let executed = "", competition = "", result = null, controlState = "waiting";
    const focusBox = [91, 85, 78, 78];
    const focusLayout = focusLayoutFor(decision?.player.position);
    const playerFocus = active && Boolean(focusLayout) && phase === "Playback" && ["approach", "control"].includes(stage) && !view.textMode && !view.reducedMotion;
    const movements = [];
    let runnerSourceId = null, batterSourceId = null, receiverSourceId = null;
    let runnerLabel = "原一壘跑者", batterLabel = "打者跑者";
    const visibleBeats = phase === "Playback" ? view.revealedBeats || [] : [];
    const reveal = type => visibleBeats.find(item => item.type === type);
    if (phase === "Playback" && beat) {
      const index = beat.presentationSequence - 1;
      const runnerPositions = [[253,137],[244,129],[233,119],[222,109],[212,99],[202,91],[202,91]];
      const batterPositions = [[182,237],[193,224],[207,210],[227,191],[242,177],[255,164],[255,164]];
      firstRunner = runnerPositions[index]; batter = batterPositions[index];
      movements.push({ key: "actor-original-runner", from: index ? runnerPositions[index - 1] : POINTS.originalRunner, to: firstRunner });
      movements.push({ key: "actor-batter-runner", from: index ? batterPositions[index - 1] : POINTS.batter, to: batter });
      ss = index >= 1 ? [...POINTS.fielding] : [...POINTS.ss];
      ballVisible = true; incoming = index <= 1;
      ball = index >= 2 ? [...POINTS.fielding] : [...POINTS.incoming];
      if (index === 1) movements.push({ key: "actor-ss", from: POINTS.ss, to: ss });
      const control = reveal("control");
      if (control) { controlState = control.payload.status; if (controlState === "failed") ball = [149,146]; }
      const thrown = reveal("throw");
      if (thrown) {
        receiverSourceId = thrown.payload.receiverId;
        if (thrown.payload.status === "completed" && thrown.actualRouteId === "secureFirstBaseOut" && thrown.payload.targetBase === "first") {
          // One visual destination binds the receiver, throw path and arriving ball.
          receiver = [...POINTS.first];
          executed = pathBetween(POINTS.fielding, receiver); ball = [...receiver]; ballFrom = [...POINTS.fielding];
          if (beat.type === "throw") movements.push({ key: "actor-receiver", from: POINTS.receiver, to: receiver });
        } else { ball = controlState === "failed" ? [149,146] : [...POINTS.fielding]; ballFrom = ball; }
      }
      if (beat.type === "receive") receiverSourceId = beat.payload.actorId;
      if (index >= 5) { competition = pathBetween(POINTS.home, [258,164]); const contest = reveal("contest"); batterSourceId = contest?.payload.runnerId || null; }
      if (beat.type === "ballInPlay" && beat.payload.direction === "middle") ball = [170,135];
      if (beat.type === "ballInPlay" && beat.payload.direction === "rightSide") ball = [222,131];
      if (beat.type === "result") result = { code: beat.payload.resultCode, text: ({ oneOut: "本球 1 個出局", twoOuts: "本球 2 個出局", zeroOuts: "本球未新增出局", error: "本球守備失誤" })[beat.payload.resultCode] };
      if (["ballInPlay", "throw"].includes(beat.type) && (beat.type !== "throw" || executed)) movements.push({ key: "ball-marker", from: ballFrom, to: ball });
    } else if (resolved) {
      incoming = false; ss = [...POINTS.fielding];
      if (view.resolution.actualRouteId === "secureFirstBaseOut") receiver = [...POINTS.first];
      ball = [...receiver];
      for (const change of view.resolution.runnerChanges) {
        if (change.from === 1) { runnerSourceId = change.runnerId; const base = ({ 1: "first", 2: "second", 3: "third", home: "home" })[change.to]; if (base) firstRunner = [...POINTS[base]]; runnerLabel += change.to === 2 ? " · 二壘" : ""; }
        if (change.from === "batter") { batterSourceId = change.runnerId; if (change.to === "out") { batter = [294,215]; batterLabel += " · 出局"; } }
      }
      result = { code: view.resolution.resultCode, text: "正式結算 · " + view.resolution.state.outs + " 出局" };
    } else if (phase === "Decision") {
      if (stage === "incomingBall" && knownIncoming) movements.push({ key: "ball-marker", from: POINTS.home, to: POINTS.incoming });
    }
    const role = (key, label, point, symbol, sourceId = null) => ({ key: actorKey(key), elementId: "actor-" + key, label, x: point[0], y: point[1], symbol, sourceId, team: ["ss", "receiver"].includes(key) ? "defense" : "offense", isPlayer: key === "ss" });
    return freeze({ phase, stage, active, knownIncoming, textMode: view.textMode === true, motionAllowed: active && !view.reducedMotion && !view.textMode,
      motionKey: [view.session, view.playbackRuns, phase, stage].join(":"), paused: view.paused === true,
      durationMs: phase === "Playback" ? view.beatDurationMs : TIMING.incomingBall, elapsedMs: view.beatElapsedMs || 0,
      caption: !active ? "球場示意" : CAPTIONS[stage] || "觀察場上局勢",
      preview: preview ? { routeId: previewId, ...preview, notice: INTENT_NOTICE } : null,
      ball: { visible: ballVisible, x: ball[0], y: ball[1] },
      routes: { incoming: incoming ? pathBetween(POINTS.home, POINTS.incoming) : "", executed, competition },
      actors: [role("ss", "你的守備員", ss, "SS", decision?.player.id || null), role("receiver", "一壘守備員", receiver, "1B", receiverSourceId), role("original-runner", runnerLabel, firstRunner, "R1", runnerSourceId), role("batter-runner", batterLabel, batter, "BR", batterSourceId)],
      focus: { visible: playerFocus, box: focusBox, layout: focusLayout, inset: playerFocus, dimField: active && phase === "Playback" && !view.textMode && ["approach", "control"].includes(stage) },
      result: active ? result : null, movements, controlState,
      occupancy: view.scoreState ? [...view.scoreState.bases] : null,
      actorNotice: phase === "Playback" ? "跑者位置是移動示意；壘包圓點與記分板仍為決策時正式局勢。" : "位置皆為示意座標；球場不計算物理或判決。"
    });
  }
  return freeze({ TIMING, READING, POINTS, INTENTS, INTENT_NOTICE, FOCUS_LAYOUT, focusLayoutFor, durationFor, readingFor, intentFor, project });
});
