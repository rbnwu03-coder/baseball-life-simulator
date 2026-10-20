(function (root, factory) {
  const record = root.MatchGameRecord || (typeof module === "object" && module.exports
    ? require("./match-game-record.js") : null);
  // Reading the existing lexical player never initializes or prepares a Match.
  const current = () => typeof player === "undefined" ? null : player?.highSchoolMatch;
  const api = factory(record, current);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LivePublicMatchBridge = api;
})(typeof globalThis === "undefined" ? this : globalThis, function (Record, current) {
  "use strict";

  const VERSION = "g2-a-live-public-match-v1";
  const AUTHORITY = "originalMatch+originalGameRecord/presentedEventCursor";
  const text = value => typeof value === "string" && value.length > 0;
  const number = value => typeof value === "number" && Number.isFinite(value);
  const list = value => Array.isArray(value) ? value : [];
  const copy = value => JSON.parse(JSON.stringify(value));
  function freeze(value) {
    if (value && typeof value === "object") {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  function select(source, keys) {
    return Object.fromEntries(keys.filter(key => ["string", "boolean"].includes(typeof source?.[key])
      || number(source?.[key]) || source?.[key] === null).map(key => [key, source[key]]));
  }
  function field(value, source, status = "unavailable", reason = "SOURCE_NOT_RETAINED") {
    return value === undefined || value === null
      ? { status, value: null, reason, source }
      : { status: "available", value, source };
  }
  function stateFacts(state) {
    if (!state) return null;
    const result = select(state, ["inning", "half", "outs"]);
    if (number(state.scores?.home) && number(state.scores?.away)) result.scores = select(state.scores, ["home", "away"]);
    if (Array.isArray(state.runners) && state.runners.length === 3
      && state.runners.every(id => id === null || text(id))) result.bases = state.runners.slice();
    return result;
  }
  function actor(match, id) {
    if (!text(id)) return null;
    for (const side of ["home", "away"]) {
      const found = list(match.rosters?.[side]?.lineup).find(item => item.id === id);
      if (found) return { id, team: side, ...select(found, ["name", "defensivePosition"]) };
    }
    return { id };
  }
  function physicalFacts(ball) {
    return ball && text(ball.identity)
      ? select(ball, ["version", "identity", "contactQuality", "ballType", "pace", "direction", "depth"]) : null;
  }
  function pitchFacts(event) {
    const pitch = event?.pitch;
    if (!text(pitch?.pitchId) || !text(event.pitchResult)) return null;
    return {
      pitchId: pitch.pitchId,
      ...select(event, ["pitchNumber", "pitchResult", "action", "contact"]),
      countBefore: select(event.countBefore, ["balls", "strikes"]),
      countAfter: select(event.countAfter, ["balls", "strikes"]),
      // Completed observations only. No pendingPitch, intent, target or samples.
      observed: select(pitch, ["pitchType", "velocity", "movement", "location", "zone", "strike"])
    };
  }
  function routes(situation) {
    return list(situation.legalRoutes).map(route => select(route,
      ["routeId", "id", "matchDecision", "text", "tradeoff", "action"]));
  }
  function hash(value) {
    let result = 2166136261;
    for (const char of JSON.stringify(value)) { result ^= char.charCodeAt(0); result = Math.imul(result, 16777619); }
    return (result >>> 0).toString(16).padStart(8, "0");
  }
  function unavailable(reason, status = "unavailable") {
    return freeze({
      snapshot: { version: VERSION, status, reason, sourceAuthority: AUTHORITY,
        identity: { matchId: field(null, "player.highSchoolMatch.id", status, reason) } },
      timeline: { version: VERSION, status, reason, events: [], coverage: { source: status } }
    });
  }

  function project(match, expected = {}) {
    if (!match || !text(match.id)) return unavailable("NO_ACTIVE_MATCH");
    if (!Record || match.gameRecord?.version !== Record.VERSION) return unavailable("MATCH_RECORD_UNSUPPORTED", "unsupported");
    if (match.gameRecord.gameId !== match.id || (match.matchContext?.matchId && match.matchContext.matchId !== match.id)) {
      throw new Error("LIVE_PUBLIC_MATCH_ID_MISMATCH");
    }
    if (expected.matchId !== undefined && expected.matchId !== match.id) throw new Error("LIVE_PUBLIC_STALE_MATCH");
    if (!Array.isArray(match.simulationLog) || !Number.isInteger(match.presentedEventCursor)
      || match.presentedEventCursor < 0 || match.presentedEventCursor > match.simulationLog.length) {
      return unavailable("INVALID_PRESENTATION_BOUNDARY", "unsupported");
    }
    const cursor = match.presentedEventCursor;
    const prefix = match.simulationLog.slice(0, cursor);
    const record = match.gameRecord;
    const refFor = event => list(record.eventRefs).find(ref => ref.sequence === event.sequence && ref.type === event.type);
    const visible = [];
    const seenSources = new Map();
    let lastSequence = -1;
    for (const event of prefix) {
      const ref = refFor(event);
      if (!ref || !text(ref.eventId) || !Number.isInteger(event.sequence)) throw new Error("LIVE_PUBLIC_EVENT_PROVENANCE_MISSING");
      if ((event.eventId && event.eventId !== ref.eventId) || (event.executionRefs?.matchId && event.executionRefs.matchId !== match.id)
        || (event.thirdStrikeCatch?.gameId && event.thirdStrikeCatch.gameId !== match.id)) throw new Error("LIVE_PUBLIC_EVENT_ID_MISMATCH");
      if (seenSources.has(ref.eventId)) {
        if (seenSources.get(ref.eventId) !== JSON.stringify(event)) throw new Error("LIVE_PUBLIC_CONFLICTING_EVENT");
        continue;
      }
      if (event.sequence <= lastSequence) throw new Error("LIVE_PUBLIC_SOURCE_ORDER_MISMATCH");
      lastSequence = event.sequence;
      seenSources.set(ref.eventId, JSON.stringify(event));
      visible.push({ event, ref });
    }
    const latestState = visible.map(row => row.event.presentationSnapshot).filter(Boolean).at(-1);
    const board = Record.getScoreboardFromEvents({ id: match.id, regulationInnings: match.regulationInnings,
      homeTeamId: record.homeTeamId, awayTeamId: record.awayTeamId }, visible.map(row => row.event));
    const fullRecordVisible = cursor === match.simulationLog.length;
    if (fullRecordVisible && ["home", "away"].some(side =>
      ["runs", "hits", "errors"].some(key => board.totals[side][key] !== record.totals?.[side]?.[key]))) {
      throw new Error("LIVE_PUBLIC_SCOREBOARD_RECORD_MISMATCH");
    }
    const paStates = [match.offensivePlateAppearanceState, match.ordinaryDefensivePlateAppearanceState].filter(Boolean);
    const active = match.activeSituation;
    const live = active?.version === "match-situation-lifecycle-v1" && active.type === "plateDecision"
      && active.lifecycleState === "presented" && active.admission?.admittedToPlayer === true;
    const livePA = live ? paStates.find(pa => pa.paIdentity === active.contextSnapshot?.paIdentity) : null;
    if (live && (!livePA || livePA.resultApplied || livePA.batterId !== match.currentBatter
      || active.actor?.id !== livePA.batterId || active.contextSnapshot.batterId !== livePA.batterId
      || livePA.context?.inning !== match.inning || livePA.context?.half !== match.half
      || active.sourcePhysicalStateRef !== livePA.pendingPitch?.pitchId
      || !active.contextSnapshot.paIdentity.startsWith(match.id + "|"))) throw new Error("LIVE_PUBLIC_STALE_PA");
    const currentPA = livePA?.paIdentity || null;
    if (expected.paId !== undefined && expected.paId !== currentPA) throw new Error("LIVE_PUBLIC_STALE_PA");

    const events = [], eventIds = new Map();
    function emit(type, identity, facts, row, detail = 0, sourcePath = "simulationLog") {
      if (!text(identity)) return;
      const eventId = JSON.stringify([VERSION, match.id, type, identity]);
      const signature = JSON.stringify({ paId: row.paId || null, facts });
      if (eventIds.has(eventId)) {
        if (eventIds.get(eventId) !== signature) throw new Error("LIVE_PUBLIC_CONFLICTING_FACT");
        return;
      }
      eventIds.set(eventId, signature);
      events.push({ eventId, type, matchId: match.id, paId: row.paId || null,
        source: { owner: sourcePath, identity, eventId: row.ref?.eventId || null },
        order: { sourceSequence: row.event?.sequence ?? cursor, evidenceOrder: detail,
          basis: row.event ? "originalSimulationLog" : "originalSituationLifecycle" }, facts });
    }
    const histories = [];
    for (const [index, pa] of paStates.entries()) {
      if (text(pa.paIdentity)) histories.push({ paId: pa.paIdentity, pitches: list(pa.pitchHistory),
        path: index === 0 && pa === match.offensivePlateAppearanceState ? "offensivePlateAppearanceState.pitchHistory" : "ordinaryDefensivePlateAppearanceState.pitchHistory" });
    }
    list(match.completedMoments).forEach((moment, index) => {
      const pitches = list(moment.pitchHistory);
      const paId = pitches[0]?.pitch?.paIdentity;
      if (text(paId)) histories.push({ paId, pitches, path: "completedMoments[" + index + "].pitchHistory" });
    });
    const paByPhysical = new Map();
    for (const { event } of visible) {
      const id = event.executionRefs?.physicalId || event.physicalIdentity || event.officialBallInPlayOutcome?.physicalIdentity;
      const pa = event.executionRefs?.paId || event.paIdentity;
      if (id && pa) paByPhysical.set(id, pa);
    }
    const publishedPAs = new Set(), observedPAs = new Set(), missingPitches = [];
    function emitPitches(history, row) {
      if (!history) return;
      history.pitches.forEach(pitch => {
        if (pitch.pitch?.paIdentity !== history.paId || !history.paId.startsWith(match.id + "|")) throw new Error("LIVE_PUBLIC_PITCH_PA_MISMATCH");
        const facts = pitchFacts(pitch);
        if (facts) emit("PITCH_RESOLVED", facts.pitchId, facts, row, pitch.pitchNumber * 10 + 2, history.path);
      });
      if (history.pitches.some(pitchFacts)) observedPAs.add(history.paId);
    }
    function emitActions(actions, row, offset, sourcePath) {
      list(actions?.actions).forEach((action, index) => {
        if (action.status !== "completed") return;
        emit("DEFENSIVE_ACTION", action.identity,
          select(action, ["type", "actorId", "actorPosition", "receiverId", "runnerId", "targetBase", "status", "physicalIdentity"]),
          row, offset + index, sourcePath);
      });
    }
    for (const row of visible) {
      const { event, ref } = row;
      const physicalId = event.executionRefs?.physicalId || event.physicalIdentity || event.officialBallInPlayOutcome?.physicalIdentity;
      const history = histories.find(item => item.paId === (event.executionRefs?.paId || event.paIdentity)
        || (physicalId && item.pitches.some(pitch => pitch.battedBallPhysicalTruth?.identity === physicalId)));
      row.paId = event.executionRefs?.paId || event.paIdentity || paByPhysical.get(physicalId) || history?.paId || null;
      if (row.paId && !row.paId.startsWith(match.id + "|")) throw new Error("LIVE_PUBLIC_EVENT_PA_MISMATCH");
      if (event.type === "plateAppearance") {
        if (publishedPAs.has(ref.eventId)) continue;
        publishedPAs.add(ref.eventId);
        emitPitches(history, row);
        if (!history?.pitches.some(pitchFacts)) missingPitches.push(ref.eventId);
      }
      const ball = physicalFacts(event.battedBallPhysicalTruth || event.physicalTruth);
      if (ball) emit("BALL_IN_PLAY", ball.identity, ball, row, 100000,
        event.battedBallPhysicalTruth ? "simulationLog.battedBallPhysicalTruth" : "simulationLog.physicalTruth");
      const candidate = event.officialBallInPlayOutcome?.executionCandidate;
      emitActions(event.actionFacts || (candidate?.closed ? candidate.actionFacts : null), row, 110000,
        event.actionFacts ? "simulationLog.actionFacts" : "simulationLog.officialBallInPlayOutcome.executionCandidate.actionFacts");
      const caught = event.thirdStrikeCatch?.execution;
      if (caught?.status === "completed" && caught.caught === true) {
        emit("DEFENSIVE_ACTION", caught.identity,
          { type: "thirdStrikeCatch", ...select(caught, ["catcherId", "pitcherId", "batterId", "pitchIdentity", "caught", "status", "catchBeforeGround"]),
            possession: select(caught.possession, ["status", "holderId"]) }, row, 120000, "simulationLog.thirdStrikeCatch.execution");
      }
      if (event.flyBallCatchCredit?.completedCatch === true && event.catchResult?.caught === true) {
        emit("DEFENSIVE_ACTION", event.flyBallCatchCredit.catchSource,
          { type: "flyBallCatch", ...select(event.flyBallCatchCredit, ["actorId", "actorPosition", "physicalIdentity", "completedCatch"]),
            ballState: event.catchResult.ballState }, row, 120000, "simulationLog.flyBallCatchCredit");
      }
      const retrieval = event.outfieldSingleFacts?.retrieval;
      if (retrieval?.status === "completed" && retrieval.pickup?.secured === true) {
        emit("DEFENSIVE_ACTION", retrieval.identity,
          { type: "outfieldPickup", ...select(retrieval, ["actorId", "position", "physicalIdentity", "status", "throwAttempted"]),
            possession: select(retrieval.afterPossession, ["status", "holderId"]) }, row, 120000, "simulationLog.outfieldSingleFacts.retrieval");
      }
      const settlementId = event.executionRefs?.settlementId || event.flyBallCatchCredit?.playIdentity
        || event.outfieldSingleFacts?.classification?.identity || caught?.identity;
      const terminal = { result: event.result || event.resultCode || event.outfieldSingleFacts?.classification?.compatibleOffensiveResult || null,
        before: stateFacts(event.before), after: stateFacts(event.after),
        runnerChanges: list(event.runnerChanges).map(change => select(change, ["runnerId", "from", "to", "targetBase", "retired", "safe", "scored"])),
        retirements: list(event.thirdOutResolution?.orderedRetirements).map(item => select(item, ["runnerId", "targetBase", "outType", "sequence", "isBatterRunner", "beforeFirst"])),
        physicalId: physicalId || null, settlementId: settlementId || null,
        attribution: list((event.defensiveAttribution || candidate?.defensiveAttribution)?.actors).map(item => select(item, ["actorId", "actorPosition", "PO", "A", "E", "DP"])) };
      if (event.outfieldSingleFacts?.runnerContinuation?.closed === true) {
        terminal.runnerTerminal = select(event.outfieldSingleFacts.runnerContinuation, ["runnerId", "finalBase", "status", "closed"]);
      }
      if (settlementId && event.after && terminal.result !== null && !/Pending$/.test(terminal.result)) {
        emit("PLAY_SETTLED", settlementId, terminal, row, 130000, "simulationLog/MatchGameRecord.eventRefs");
      }
      if (event.type === "plateAppearance" && event.after && !/Pending$/.test(event.result || "")) {
        emit("PA_SETTLED", ref.eventId, { batterId: event.batterId, ...terminal }, row, 140000, "simulationLog.plateAppearance/MatchGameRecord.eventRefs");
      }
      if (event.type === "sideChange") emit("HALF_INNING_CHANGED", ref.eventId, stateFacts(event.presentationSnapshot), row, 150000);
      if (event.type === "gameEnd") emit("MATCH_FINAL", ref.eventId, stateFacts(event.presentationSnapshot), row, 150000);
      if (event.presentationSnapshot) emit("MATCH_STATE", ref.eventId, stateFacts(event.presentationSnapshot), row, 160000);
    }

    const closed = match.plateDecisionState?.closedSituation;
    const closedPA = match.plateDecisionState?.paIdentity;
    if (closed?.type === "plateDecision" && closed?.lifecycleState === "closed" && closed.settlement?.applied === true
      && text(closedPA) && closedPA.startsWith(match.id + "|")) {
      const row = visible.find(row => row.event.type === "plateAppearance" && row.paId === closedPA) || { paId: closedPA };
      const pitchOrder = closed.contextSnapshot?.pitchIndex * 10;
      if (list(closed.transitionHistory).some(step => step.state === "presented")) {
        emit("DECISION_PRESENTED", closed.situationId,
          { situationId: closed.situationId, type: closed.type, routes: routes(closed), actorId: closed.actor?.id || null }, row,
          pitchOrder, "plateDecisionState.closedSituation");
      }
      emit("DECISION_ACCEPTED", closed.situationId, { submitted: true, selectedRoute: closed.decision?.selectedRoute || null,
        situationId: closed.situationId }, row, pitchOrder + 1, "plateDecisionState.closedSituation");
    }
    if (live) {
      const row = { paId: currentPA };
      emitPitches(histories.find(item => item.paId === currentPA), row);
      emit("DECISION_PRESENTED", active.situationId,
        { situationId: active.situationId, type: active.type, routes: routes(active), actorId: active.actor?.id || null }, row, active.contextSnapshot.pitchIndex * 10,
        "activeSituation");
    }
    events.sort((a, b) => a.order.sourceSequence - b.order.sourceSequence || a.order.evidenceOrder - b.order.evidenceOrder);
    const latest = events.filter(event => ["PLAY_SETTLED", "PA_SETTLED", "MATCH_FINAL"].includes(event.type)).at(-1);
    const game = stateFacts(latestState);
    const half = game?.half;
    const offense = half === "上" ? "away" : half === "下" ? "home" : null;
    const defense = offense ? offense === "home" ? "away" : "home" : null;
    const batterId = live ? livePA.batterId : latestState?.currentBatter;
    const pitcher = defense ? list(match.rosters?.[defense]?.lineup).find(item => ["P", "投手"].includes(item.defensivePosition)) : null;
    const completed = visible.some(row => row.event.type === "gameEnd");
    const presented = prefix.at(-1);
    const otherDecisionWaiting = !match.completed && !live && (
      (active?.type === "runnerTagUpDecision" && active.lifecycleState === "presented" && match.simulationPhase === "moment_2_ready")
      || (match.simulationPhase === "offensive_agency_ready" && presented?.type === "playerAgencyOpportunityReached"
        && presented.agencyIdentity === match.offensivePlayerAgencyState?.agencyIdentity && match.offensivePlayerAgencyState?.status === "pending")
      || (["moment_1_ready", "moment_2_ready", "moment_3_ready"].includes(match.simulationPhase)
        && presented?.type === "meaningfulMomentReached" && (!presented.momentId || presented.momentId === match.currentMomentId)));
    // G1-B can retain the original held PA alongside its completed, recorded
    // outfield resolution. The official event supersedes that transient flag;
    // normalizeSave legitimately removes it without changing the play.
    const pending = cursor < match.simulationLog.length || paStates.some(pa => pa.awaitingDefense === true
      && !visible.some(row => row.paId === pa.paIdentity && row.event.after
        && ["plateAppearance", "outfieldSingleResolution", "flyBallCatchResolution"].includes(row.event.type)));
    const playerLines = fullRecordVisible ? Object.fromEntries(Object.entries(record.playerLines || {}).map(([id, line]) => [id, {
      playerId: id, ...select(line, ["teamId", "position", "role"]),
      batting: select(line.batting, ["PA", "AB", "R", "H", "RBI", "BB", "SO"]),
      pitching: select(line.pitching, ["BF", "SO", "outsRecorded", "H", "R", "ER", "BB"]),
      defense: select(line.defense, ["PO", "A", "E", "DP", "chances"])
    }])) : null;
    const snapshot = {
      version: VERSION, status: cursor ? "available" : "pending", sourceAuthority: AUTHORITY,
      identity: {
        matchId: field(match.id, "player.highSchoolMatch.id"),
        paId: field(currentPA, "activeSituation.contextSnapshot.paIdentity", "unavailable", "CURRENT_PA_ID_NOT_CREATED_OR_NOT_PRESENTED"),
        pitchId: field(live ? active.sourcePhysicalStateRef : null, "activeSituation.sourcePhysicalStateRef"),
        situationId: field(live ? active.situationId : null, "activeSituation.situationId")
      },
      game: {
        inning: field(game?.inning, "visible.presentationSnapshot.inning", "pending", "NO_VISIBLE_STATE"),
        half: field(half, "visible.presentationSnapshot.half", "pending", "NO_VISIBLE_STATE"),
        homeScore: field(cursor ? board.totals.home.runs : null, "MatchGameRecord.getScoreboardFromEvents", "pending", "NO_VISIBLE_STATE"),
        awayScore: field(cursor ? board.totals.away.runs : null, "MatchGameRecord.getScoreboardFromEvents", "pending", "NO_VISIBLE_STATE"),
        outs: field(game?.outs, "visible.presentationSnapshot.outs", "pending", "NO_VISIBLE_STATE"),
        balls: field(live ? livePA.balls : null, "offensivePlateAppearanceState.balls"),
        strikes: field(live ? livePA.strikes : null, "offensivePlateAppearanceState.strikes"),
        bases: field(game?.bases, "visible.presentationSnapshot.runners", "pending", "NO_VISIBLE_STATE"),
        offenseTeam: field(offense ? { side: offense, teamId: record[offense + "TeamId"] } : null, "visible.half/MatchGameRecord.teamId"),
        defenseTeam: field(defense ? { side: defense, teamId: record[defense + "TeamId"] } : null, "visible.half/MatchGameRecord.teamId"),
        gameStatus: field(cursor ? completed ? "final" : "inProgress" : null, "visible.matchEntry/gameEnd", "pending", "NO_VISIBLE_STATE")
      },
      participants: {
        batter: field(actor(match, batterId), "visible.currentBatter/activeSituation.actor"),
        pitcher: field(actor(match, pitcher?.id), "activeDefenseRoster.P"),
        player: field({ id: "player", ...select(match, ["playerLineupStatus", "playerFieldingAssignment"]) }, "originalMatch.playerParticipation"),
        legalActor: field(live ? select(active.actor, ["id", "role"]) : null, "activeSituation.actor")
      },
      decision: {
        status: live ? "available" : otherDecisionWaiting ? "unsupported" : pending ? "pending" : "unsupported", waiting: live || otherDecisionWaiting,
        identity: field(live ? active.situationId : otherDecisionWaiting ? match.currentMomentId : closed?.situationId,
          otherDecisionWaiting ? "originalMatch.currentMomentId" : "originalSituation.situationId"),
        type: field(live ? active.type : null, "activeSituation.type", "unsupported", "OTHER_DECISION_CONTRACT_NOT_ADAPTED"),
        routes: field(live ? routes(active) : null, "activeSituation.legalRoutes", "unsupported", "NO_PRESENTED_PLATE_ROUTES"),
        submitted: field(live ? false : otherDecisionWaiting ? null : closed?.settlement?.applied === true ? true : null, "originalSituation.lifecycle"),
        submissionAuthority: "chooseHighSchoolYearOneMatchMoment",
        expectedMomentId: field(live ? match.currentMomentId : null, "originalMatch.currentMomentId")
      },
      lastResolution: field(latest || null, "visible.originalEvents", pending ? "pending" : "unavailable", "NO_VISIBLE_SETTLEMENT"),
      continuation: { authority: "originalMatchPlayback", status: live || otherDecisionWaiting || pending ? "pending" : "available",
        reason: live ? "PLAYER_DECISION_REQUIRED" : otherDecisionWaiting ? "DECISION_REQUIRES_ORIGINAL_UI" : pending ? "ORIGINAL_EXECUTION_OR_REVEAL_PENDING" : "READ_ONLY_NO_ADVANCE" },
      record: { scoreboard: field(cursor ? copy(board) : null, "MatchGameRecord.getScoreboardFromEvents", "pending", "NO_VISIBLE_STATE"),
        playerLines: field(playerLines, "originalGameRecord.playerLines", "pending", "UNREVEALED_CANONICAL_EVENTS") }
    };
    const timeline = { version: VERSION, status: cursor || live ? "available" : "pending", events,
      coverage: { ordering: "sourceSequenceThenEvidenceOrder", elapsedMilliseconds: "unsupported",
        pitchHistory: { availablePaIds: [...observedPAs], unavailablePaEventIds: missingPitches },
        instantaneousHistory: "Only retained original histories are projected; missing historical observations cannot be reconstructed." } };
    snapshot.revision = VERSION + ":" + hash({ snapshot, timeline });
    return freeze({ snapshot, timeline });
  }

  function createConsumer(readSource = current) {
    if (typeof readSource !== "function") throw new TypeError("A read-only source provider is required");
    // Playback bookkeeping contains event identities only, never Match state.
    const played = new Set();
    let matchId = null;
    return freeze({
      read(expected) { return project(readSource(), expected); },
      advancePresentation() {
        const projection = project(readSource());
        const id = projection.snapshot.identity.matchId.value;
        if (id !== matchId) { played.clear(); matchId = id; }
        const next = projection.timeline.events.find(event => !played.has(event.eventId));
        if (!next) return null;
        played.add(next.eventId);
        return next;
      }
    });
  }
  return freeze({ VERSION, project, projectSnapshot(source, expected) { return project(source, expected).snapshot; },
    projectTimeline(source, expected) { return project(source, expected).timeline; },
    readCurrent(expected) { return project(current(), expected); }, createConsumer });
});
