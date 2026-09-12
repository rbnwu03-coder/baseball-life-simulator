(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MatchGameRecord = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "match-game-record-v1";
  const FINAL_STATUSES = new Set(["final", "completed"]);
  const HIT_RESULTS = new Set(["single", "double", "triple", "homeRun"]);
  const NO_AT_BAT_RESULTS = new Set(["walk", "hitByPitch", "HBP", "sacrificeHit", "sacrificeFly", "SH", "SF"]);
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const integer = value => Math.max(0, Math.floor(Number(value) || 0));
  const check = (condition, message) => { if (!condition) throw new Error(message); };

  function emptyBattingLine() {
    return { PA: 0, AB: 0, R: 0, H: 0, doubles: 0, triples: 0, HR: 0, RBI: 0, BB: 0, HBP: 0, SO: 0, SB: 0, CS: 0, SH: 0, SF: 0 };
  }

  function emptyPitchingLine() {
    return { outsRecorded: 0, BF: 0, H: 0, R: 0, ER: 0, BB: 0, HBP: 0, SO: 0, HR: 0, pitches: null, strikes: null };
  }

  function emptyDefensiveLine() {
    return { chances: 0, PO: 0, A: 0, E: 0, DP: 0 };
  }

  function emptyBaserunningLine() {
    return { R: 0, SB: 0, CS: 0 };
  }

  function createPlayerLine(input = {}) {
    return {
      playerId: String(input.playerId || input.id || ""),
      teamId: String(input.teamId || ""),
      role: String(input.role || "participant"),
      position: String(input.position || ""),
      positionAppearances: [],
      batting: emptyBattingLine(),
      pitching: emptyPitchingLine(),
      defense: emptyDefensiveLine(),
      baserunning: emptyBaserunningLine()
    };
  }

  function normalizePlayerLine(saved = {}, fallback = {}) {
    const line = createPlayerLine({ ...fallback, ...saved });
    Object.keys(line.batting).forEach(key => { line.batting[key] = integer(saved.batting?.[key]); });
    Object.keys(line.pitching).forEach(key => {
      if (["pitches", "strikes"].includes(key)) line.pitching[key] = saved.pitching?.[key] == null ? null : integer(saved.pitching[key]);
      else line.pitching[key] = integer(saved.pitching?.[key]);
    });
    Object.keys(line.defense).forEach(key => { line.defense[key] = integer(saved.defense?.[key]); });
    Object.keys(line.baserunning).forEach(key => { line.baserunning[key] = integer(saved.baserunning?.[key]); });
    line.positionAppearances = Array.isArray(saved.positionAppearances)
      ? saved.positionAppearances.map(item => ({ position: String(item?.position || ""), role: String(item?.role || line.role), eventId: String(item?.eventId || "") })).filter(item => item.position)
      : [];
    return line;
  }

  function resolveTeamId(config, side) {
    return String(config?.[`${side}TeamId`] || config?.rosters?.[side]?.teamRoster?.teamId || config?.rosters?.[side]?.teamId || side);
  }

  function createGameRecord(config = {}) {
    const record = {
      version: VERSION,
      gameId: String(config.gameId || config.id || "game"),
      competitionEditionId: config.competitionEditionId ? String(config.competitionEditionId) : null,
      competitionEntryId: config.competitionEntryId ? String(config.competitionEntryId) : null,
      homeTeamId: resolveTeamId(config, "home"),
      awayTeamId: resolveTeamId(config, "away"),
      status: "active",
      inningsScheduled: Math.max(1, integer(config.inningsScheduled || config.regulationInnings || 7)),
      inningsPlayed: 0,
      inningLines: [],
      totals: { away: { runs: 0, hits: 0, errors: 0 }, home: { runs: 0, hits: 0, errors: 0 } },
      result: null,
      playerLines: {},
      eventRefs: [],
      integrity: { checked: false, issues: [] },
      finalizedAtEventId: null
    };
    seedRosterPlayers(record, config.rosters);
    return record;
  }

  function seedRosterPlayers(record, rosters = {}) {
    ["home", "away"].forEach(side => {
      const teamId = side === "home" ? record.homeTeamId : record.awayTeamId;
      (rosters?.[side]?.lineup || []).forEach(actor => {
        const playerId = String(actor?.playerId || actor?.id || "");
        if (!playerId) return;
        const line = ensurePlayerLine(record, playerId, { teamId, role: "starter", position: actor.defensivePosition || actor.position });
        addPositionAppearance(line, actor.defensivePosition || actor.position, "starter", `${record.gameId}|lineup|${side}|${playerId}`);
      });
      (rosters?.[side]?.bench || []).forEach(actor => {
        const playerId = String(actor?.playerId || actor?.id || "");
        if (playerId) ensurePlayerLine(record, playerId, { teamId, role: "bench", position: actor.defensivePosition || actor.position });
      });
    });
  }

  function ensureInningLine(record, inning) {
    const number = Math.max(1, integer(inning) || 1);
    let line = record.inningLines.find(item => item.inning === number);
    if (!line) {
      line = { inning: number, awayRuns: 0, homeRuns: 0 };
      record.inningLines.push(line);
      record.inningLines.sort((a, b) => a.inning - b.inning);
    }
    record.inningsPlayed = Math.max(record.inningsPlayed, number);
    return line;
  }

  function ensurePlayerLine(record, playerId, input = {}) {
    const id = String(playerId || "");
    if (!id) return null;
    if (!record.playerLines[id]) record.playerLines[id] = createPlayerLine({ playerId: id, ...input });
    const line = record.playerLines[id];
    if (!line.teamId && input.teamId) line.teamId = String(input.teamId);
    if ((!line.position || line.position === "") && input.position) line.position = String(input.position);
    if ((!line.role || line.role === "participant") && input.role) line.role = String(input.role);
    return line;
  }

  function addPositionAppearance(line, position, role, eventId) {
    const normalized = String(position || "");
    if (!line || !normalized) return;
    if (!line.positionAppearances.some(item => item.position === normalized && item.eventId === String(eventId || ""))) {
      line.positionAppearances.push({ position: normalized, role: String(role || line.role || "participant"), eventId: String(eventId || "") });
    }
    line.position = normalized;
  }

  function getEventId(record, event = {}) {
    if (event.eventId) return String(event.eventId);
    return [record.gameId, Math.max(1, integer(event.inning) || 1), String(event.half || ""), integer(event.sequence)].join("|");
  }

  function sideForTeamId(record, teamId) {
    return String(teamId) === record.homeTeamId ? "home" : String(teamId) === record.awayTeamId ? "away" : "";
  }

  function sideForEvent(record, event, context = {}) {
    if (["home", "away"].includes(event.offenseTeam)) return event.offenseTeam;
    const teamId = event.teamId || context.teamId;
    const byId = sideForTeamId(record, teamId);
    if (byId) return byId;
    return event.half === "下" ? "home" : "away";
  }

  function getActivePitcher(record, defenseSide, context = {}) {
    const roster = context.rosters?.[defenseSide];
    const actor = (roster?.lineup || []).find(item => ["P", "投手"].includes(String(item?.defensivePosition || item?.position || "")));
    const playerId = actor?.playerId || actor?.id;
    return playerId ? ensurePlayerLine(record, playerId, {
      teamId: defenseSide === "home" ? record.homeTeamId : record.awayTeamId,
      role: "starter",
      position: actor?.defensivePosition || actor?.position || "P"
    }) : null;
  }

  function recordPlateAppearance(record, event, context, eventId) {
    const offenseSide = sideForEvent(record, event, context);
    const defenseSide = offenseSide === "home" ? "away" : "home";
    const batter = ensurePlayerLine(record, event.batterId, {
      teamId: offenseSide === "home" ? record.homeTeamId : record.awayTeamId,
      role: event.batterRole || "participant",
      position: event.batterPosition || ""
    });
    const result = String(event.result || "out");
    if (batter) {
      const stats = batter.batting;
      stats.PA += 1;
      if (!NO_AT_BAT_RESULTS.has(result)) stats.AB += 1;
      if (HIT_RESULTS.has(result)) stats.H += 1;
      if (result === "double") stats.doubles += 1;
      if (result === "triple") stats.triples += 1;
      if (result === "homeRun") stats.HR += 1;
      if (result === "walk") stats.BB += 1;
      if (["hitByPitch", "HBP"].includes(result)) stats.HBP += 1;
      if (result === "strikeout") stats.SO += 1;
      if (["sacrificeHit", "SH"].includes(result)) stats.SH += 1;
      if (["sacrificeFly", "SF"].includes(result)) stats.SF += 1;
      stats.RBI += integer(event.runsBattedIn);
    }
    if (HIT_RESULTS.has(result)) record.totals[offenseSide].hits += 1;
    if (result === "error") record.totals[defenseSide].errors += 1;
    const pitcher = getActivePitcher(record, defenseSide, context);
    if (pitcher) {
      const stats = pitcher.pitching;
      stats.BF += 1;
      if (HIT_RESULTS.has(result)) stats.H += 1;
      if (result === "walk") stats.BB += 1;
      if (["hitByPitch", "HBP"].includes(result)) stats.HBP += 1;
      if (result === "strikeout") stats.SO += 1;
      if (result === "homeRun") stats.HR += 1;
    }
  }

  function recordRun(record, event, context) {
    const offenseSide = ["home", "away"].includes(event.team) ? event.team : sideForEvent(record, event, context);
    const inningLine = ensureInningLine(record, event.inning);
    inningLine[offenseSide === "home" ? "homeRuns" : "awayRuns"] += 1;
    record.totals[offenseSide].runs += 1;
    const runner = ensurePlayerLine(record, event.runnerId, {
      teamId: offenseSide === "home" ? record.homeTeamId : record.awayTeamId,
      role: "participant"
    });
    if (runner) {
      runner.batting.R += 1;
      runner.baserunning.R += 1;
    }
    const defenseSide = offenseSide === "home" ? "away" : "home";
    const pitcher = getActivePitcher(record, defenseSide, context);
    if (pitcher) {
      pitcher.pitching.R += 1;
      if (String(event.source || "") !== "error") pitcher.pitching.ER += 1;
    }
  }

  function recordDefensivePlay(record, event, context, eventId) {
    const defenseSide = sideForEvent(record, event, context) === "home" ? "away" : "home";
    const playerId = String(event.fielderId || event.playerId || context.playerId || (event.type === "playerRoutinePlay" || event.domain === "defense" ? "player" : ""));
    if (!playerId) return;
    const position = event.playerPosition || event.position || context.playerPosition || "";
    const line = ensurePlayerLine(record, playerId, {
      teamId: defenseSide === "home" ? record.homeTeamId : record.awayTeamId,
      role: event.playerRole || context.playerRole || "participant",
      position
    });
    line.defense.chances += 1;
    const outsCreated = integer(event.outsCreated ?? event.thirdOutResolution?.outsAfter - event.thirdOutResolution?.outsBefore);
    const catchOut = event.catchResult?.caught === true || /catch|fly|lineDrive/i.test(String(event.familyId || ""));
    if (outsCreated > 0) {
      if (catchOut || ["1B", "一壘手"].includes(position)) line.defense.PO += Math.min(1, outsCreated);
      else line.defense.A += 1;
      if (outsCreated >= 2) line.defense.DP += 1;
    }
    if (event.error === true || event.resultCode === "error") line.defense.E += 1;
    addPositionAppearance(line, position, event.playerRole || context.playerRole, eventId);
  }

  function recordRunnerEvent(record, event, context) {
    const side = sideForEvent(record, event, context);
    const line = ensurePlayerLine(record, event.runnerId || event.playerId, {
      teamId: side === "home" ? record.homeTeamId : record.awayTeamId,
      role: "participant"
    });
    if (!line) return;
    if (["stolenBase", "stealSuccess"].includes(event.type)) {
      line.batting.SB += 1;
      line.baserunning.SB += 1;
    }
    if (["caughtStealing", "stealCaught"].includes(event.type)) {
      line.batting.CS += 1;
      line.baserunning.CS += 1;
    }
  }

  function attributePitcherOuts(record, event, context) {
    // A PA owns its entire settled out delta, including DP / FC runner outs.
    // Independent runner events own only their subsequent, non-PA delta.
    const independent = ["runnerTagUpResolution", "runnerOut", "caughtStealing", "stealCaught"].includes(event.type)
      || (event.type === "defensiveResolution" && event.familyId === "catcher");
    if (event.type !== "plateAppearance" && !independent) return null;
    const delta = Math.max(0, Math.min(3, integer(event.after?.outs)) - Math.min(3, integer(event.before?.outs)));
    if (!delta) return null;
    const defenseSide = sideForEvent(record, event, context) === "home" ? "away" : "home";
    const pitcher = getActivePitcher(record, defenseSide, context);
    if (!pitcher) {
      check(!independent, "Independent out requires active defensive pitcher");
      return null; // Historical isolated PA records may omit roster context.
    }
    pitcher.pitching.outsRecorded += delta;
    return { pitcherId: pitcher.playerId, outs: delta };
  }

  function recordEvent(record, event = {}, context = {}) {
    check(record?.version === VERSION, "Game record schema is required");
    if (FINAL_STATUSES.has(record.status)) return Object.freeze({ status: "locked", eventId: getEventId(record, event) });
    const eventId = getEventId(record, event);
    if (record.eventRefs.some(ref => ref.eventId === eventId)) return Object.freeze({ status: "duplicate", eventId });
    ensureInningLine(record, event.inning || 1);
    if (event.type === "plateAppearance") recordPlateAppearance(record, event, context, eventId);
    if (event.type === "run") recordRun(record, event, context);
    if (event.type === "playerRoutinePlay" || (event.type === "meaningfulMomentResolved" && event.domain === "defense") || event.type === "defensivePlay") {
      recordDefensivePlay(record, event, context, eventId);
    }
    if (event.type === "playerEntry" || event.type === "positionChange") {
      const side = event.team || context.playerTeam || "home";
      const line = ensurePlayerLine(record, event.playerId || context.playerId || "player", {
        teamId: side === "away" ? record.awayTeamId : record.homeTeamId,
        role: event.role || context.playerRole || "substitute",
        position: event.playerPosition || context.playerPosition
      });
      if (line) {
        line.role = String(event.role || context.playerRole || "substitute");
        addPositionAppearance(line, event.playerPosition || context.playerPosition, line.role, eventId);
      }
    }
    recordRunnerEvent(record, event, context);
    const pitcherOuts = attributePitcherOuts(record, event, context);
    record.eventRefs.push({ eventId, type: String(event.type || "event"), sequence: integer(event.sequence), inning: Math.max(1, integer(event.inning) || 1), half: String(event.half || ""), ...(pitcherOuts ? { pitcherOuts } : {}) });
    return Object.freeze({ status: "applied", eventId });
  }

  function getIntegrityIssues(record) {
    const issues = [];
    const inningAway = record.inningLines.reduce((sum, line) => sum + integer(line.awayRuns), 0);
    const inningHome = record.inningLines.reduce((sum, line) => sum + integer(line.homeRuns), 0);
    if (inningAway !== integer(record.totals.away.runs)) issues.push("away-inning-runs-mismatch");
    if (inningHome !== integer(record.totals.home.runs)) issues.push("home-inning-runs-mismatch");
    const battingHits = { home: 0, away: 0 };
    const battingRuns = { home: 0, away: 0 };
    const fieldingErrors = { home: 0, away: 0 };
    Object.values(record.playerLines).forEach(line => {
      const side = sideForTeamId(record, line.teamId);
      if (side) {
        battingHits[side] += integer(line.batting.H);
        battingRuns[side] += integer(line.batting.R);
        fieldingErrors[side] += integer(line.defense.E);
      }
      const batting = line.batting;
      if (batting.PA < batting.AB) issues.push(`player-pa-ab:${line.playerId}`);
      if (batting.H > batting.AB) issues.push(`player-h-ab:${line.playerId}`);
      if (batting.HR > batting.H || batting.doubles + batting.triples + batting.HR > batting.H) issues.push(`player-extra-base-hits:${line.playerId}`);
      if (line.pitching.ER > line.pitching.R) issues.push(`pitcher-er-r:${line.playerId}`);
      // A reliever can retire an inherited runner before facing a completed PA.
      const attributedOuts = record.eventRefs.reduce((sum, ref) => sum + (ref.pitcherOuts?.pitcherId === line.playerId ? integer(ref.pitcherOuts.outs) : 0), 0);
      if (line.pitching.outsRecorded < attributedOuts) issues.push(`pitcher-event-outs:${line.playerId}`);
    });
    if (battingHits.away !== integer(record.totals.away.hits)) issues.push("away-player-hits-mismatch");
    if (battingHits.home !== integer(record.totals.home.hits)) issues.push("home-player-hits-mismatch");
    if (fieldingErrors.away !== integer(record.totals.away.errors)) issues.push("away-player-errors-mismatch");
    if (fieldingErrors.home !== integer(record.totals.home.errors)) issues.push("home-player-errors-mismatch");
    if (battingRuns.away > integer(record.totals.away.runs)) issues.push("away-player-runs-exceed-total");
    if (battingRuns.home > integer(record.totals.home.runs)) issues.push("home-player-runs-exceed-total");
    if (new Set(record.eventRefs.map(ref => ref.eventId)).size !== record.eventRefs.length) issues.push("duplicate-event-identity");
    return issues;
  }

  function finalizeGameRecord(record, input = {}) {
    check(record?.version === VERSION, "Game record schema is required");
    if (FINAL_STATUSES.has(record.status)) return Object.freeze({ status: "duplicate", record: clone(record) });
    if (input.competitionEditionId) record.competitionEditionId = String(input.competitionEditionId);
    if (input.competitionEntryId) record.competitionEntryId = String(input.competitionEntryId);
    record.inningsPlayed = Math.max(record.inningsPlayed, integer(input.inningsPlayed));
    for (let inning = 1; inning <= record.inningsPlayed; inning += 1) ensureInningLine(record, inning);
    const awayRuns = integer(record.totals.away.runs);
    const homeRuns = integer(record.totals.home.runs);
    record.result = {
      winnerTeamId: homeRuns === awayRuns ? null : homeRuns > awayRuns ? record.homeTeamId : record.awayTeamId,
      loserTeamId: homeRuns === awayRuns ? null : homeRuns > awayRuns ? record.awayTeamId : record.homeTeamId,
      finalScore: { away: awayRuns, home: homeRuns },
      tie: homeRuns === awayRuns
    };
    const issues = getIntegrityIssues(record);
    record.integrity = { checked: true, issues };
    check(issues.length === 0, `Game record integrity failed: ${issues.join(",")}`);
    record.status = "final";
    record.finalizedAtEventId = record.eventRefs.at(-1)?.eventId || null;
    return Object.freeze({ status: "finalized", record: clone(record) });
  }

  function normalizeGameRecord(saved, config = {}) {
    if (!saved) return createGameRecord(config);
    check(saved.version === VERSION, "Unsupported game record schema");
    const record = createGameRecord({
      ...config,
      gameId: saved.gameId,
      competitionEditionId: saved.competitionEditionId,
      competitionEntryId: saved.competitionEntryId,
      homeTeamId: saved.homeTeamId,
      awayTeamId: saved.awayTeamId,
      inningsScheduled: saved.inningsScheduled
    });
    record.status = FINAL_STATUSES.has(saved.status) ? "final" : "active";
    record.inningsPlayed = integer(saved.inningsPlayed);
    record.inningLines = (saved.inningLines || []).map(line => ({ inning: Math.max(1, integer(line.inning) || 1), awayRuns: integer(line.awayRuns), homeRuns: integer(line.homeRuns) }));
    record.totals = {
      away: { runs: integer(saved.totals?.away?.runs), hits: integer(saved.totals?.away?.hits), errors: integer(saved.totals?.away?.errors) },
      home: { runs: integer(saved.totals?.home?.runs), hits: integer(saved.totals?.home?.hits), errors: integer(saved.totals?.home?.errors) }
    };
    record.result = saved.result ? clone(saved.result) : null;
    record.playerLines = Object.fromEntries(Object.entries(saved.playerLines || {}).map(([id, line]) => [id, normalizePlayerLine(line, { playerId: id })]));
    record.eventRefs = (saved.eventRefs || []).map(ref => ({ eventId: String(ref.eventId), type: String(ref.type || "event"), sequence: integer(ref.sequence), inning: Math.max(1, integer(ref.inning) || 1), half: String(ref.half || ""), ...(ref.pitcherOuts ? { pitcherOuts: { pitcherId: String(ref.pitcherOuts.pitcherId), outs: integer(ref.pitcherOuts.outs) } } : {}) }));
    record.integrity = { checked: saved.integrity?.checked === true, issues: Array.isArray(saved.integrity?.issues) ? saved.integrity.issues.map(String) : [] };
    record.finalizedAtEventId = saved.finalizedAtEventId ? String(saved.finalizedAtEventId) : null;
    const issues = getIntegrityIssues(record);
    check(issues.length === 0, `Restored game record integrity failed: ${issues.join(",")}`);
    return record;
  }

  function getScoreboard(record) {
    const normalized = normalizeGameRecord(record);
    return Object.freeze({
      gameId: normalized.gameId,
      inningsScheduled: normalized.inningsScheduled,
      inningsPlayed: normalized.inningsPlayed,
      inningLines: Object.freeze(clone(normalized.inningLines)),
      totals: Object.freeze(clone(normalized.totals)),
      result: normalized.result ? Object.freeze(clone(normalized.result)) : null,
      status: normalized.status
    });
  }

  function getPlayerGameLine(record, playerId) {
    const line = record?.playerLines?.[String(playerId || "")];
    return line ? Object.freeze(clone(line)) : null;
  }

  function aggregatePlayerGameLines(records = [], playerId) {
    const aggregate = createPlayerLine({ playerId });
    let games = 0;
    records.forEach(record => {
      const line = getPlayerGameLine(record, playerId);
      if (!line) return;
      games += 1;
      if (!aggregate.teamId) aggregate.teamId = line.teamId;
      if (aggregate.role === "participant") aggregate.role = line.role;
      Object.keys(aggregate.batting).forEach(key => { aggregate.batting[key] += integer(line.batting[key]); });
      Object.keys(aggregate.pitching).forEach(key => {
        if (["pitches", "strikes"].includes(key)) aggregate.pitching[key] = line.pitching[key] == null ? aggregate.pitching[key] : integer(aggregate.pitching[key]) + integer(line.pitching[key]);
        else aggregate.pitching[key] += integer(line.pitching[key]);
      });
      Object.keys(aggregate.defense).forEach(key => { aggregate.defense[key] += integer(line.defense[key]); });
      Object.keys(aggregate.baserunning).forEach(key => { aggregate.baserunning[key] += integer(line.baserunning[key]); });
      line.positionAppearances.forEach(item => {
        if (!aggregate.positionAppearances.some(existing => existing.eventId === item.eventId)) aggregate.positionAppearances.push(clone(item));
      });
    });
    return Object.freeze({ games, playerLine: Object.freeze(clone(aggregate)) });
  }

  return Object.freeze({
    VERSION,
    createGameRecord,
    normalizeGameRecord,
    recordEvent,
    finalizeGameRecord,
    getScoreboard,
    getPlayerGameLine,
    aggregatePlayerGameLines,
    getIntegrityIssues,
    assertIntegrity(record) {
      const issues = getIntegrityIssues(record);
      check(issues.length === 0, `Game record integrity failed: ${issues.join(",")}`);
      return true;
    }
  });
});
