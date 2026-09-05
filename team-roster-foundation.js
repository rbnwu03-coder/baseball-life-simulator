(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TeamRosterFoundation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "team-roster-foundation-v1";
  const POSITION_ORDER = Object.freeze(["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"]);
  const POSITION_LABELS = Object.freeze({
    P: "投手", C: "捕手", "1B": "一壘手", "2B": "二壘手", "3B": "三壘手", SS: "游擊手",
    LF: "左外野手", CF: "中外野手", RF: "右外野手"
  });
  const LEGACY_TO_POSITION = Object.freeze(Object.fromEntries(Object.entries(POSITION_LABELS).map(([code, label]) => [label, code])));
  const LEFT_HANDED_RESTRICTED = Object.freeze(["C", "2B", "3B", "SS"]);
  const STANDARD_PRIORS = Object.freeze({
    powerhouse: Object.freeze({ center: 7.25, spread: 2.25, benchOffset: -0.55, pitchingDepth: 0.7 }),
    competitive: Object.freeze({ center: 6.35, spread: 2.35, benchOffset: -0.85, pitchingDepth: 0.25 }),
    standard: Object.freeze({ center: 5.45, spread: 2.5, benchOffset: -1.05, pitchingDepth: 0 }),
    development: Object.freeze({ center: 4.6, spread: 2.65, benchOffset: -1.25, pitchingDepth: -0.2 })
  });
  const SCHOOL_STANDARDS = Object.freeze(Object.keys(STANDARD_PRIORS));
  const DEFAULT_NAMES = Object.freeze([
    "青木", "石川", "上田", "遠藤", "大野", "加藤", "木村", "工藤", "小島",
    "齋藤", "佐々木", "高田", "田中", "中島", "西村", "長谷川", "藤田", "前田"
  ]);

  function clamp(value, minimum = 1, maximum = 10) {
    return Math.max(minimum, Math.min(maximum, Number(value) || minimum));
  }

  function hashText(value) {
    let hash = 2166136261;
    for (const character of String(value)) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createSeededRandom(seedIdentity) {
    let state = hashText(seedIdentity) || 1;
    return function next() {
      state = (state + 0x6D2B79F5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalizePosition(position) {
    const value = String(position || "").trim();
    if (POSITION_ORDER.includes(value)) return value;
    if (LEGACY_TO_POSITION[value]) return LEGACY_TO_POSITION[value];
    if (value === "內野手") return "2B";
    if (value === "外野手") return "LF";
    return "";
  }

  function isPositionEligible(player, position, options = {}) {
    const code = normalizePosition(position);
    if (!code) return false;
    if (!isHighSchoolPositionAssignmentLegal(player, code, options.age)) return false;
    const eligible = new Set([normalizePosition(player?.primaryPosition), ...(player?.secondaryPositions || []).map(normalizePosition)].filter(Boolean));
    return options.ignoreDeclaredPositions === true || eligible.has(code);
  }

  function isHighSchoolPositionAssignmentLegal(playerOrThrows, position, ageOverride) {
    const code = normalizePosition(position);
    if (!code) return false;
    const throws = typeof playerOrThrows === "string" ? playerOrThrows : playerOrThrows?.throws;
    const age = Math.max(0, Number(ageOverride ?? (typeof playerOrThrows === "object" ? playerOrThrows?.age : 16)) || 0);
    return !(String(throws || "R").toUpperCase() === "L" && age >= 10 && LEFT_HANDED_RESTRICTED.includes(code));
  }

  function getLegalHighSchoolPositions(playerOrThrows, ageOverride) {
    return Object.freeze(POSITION_ORDER.filter(position => isHighSchoolPositionAssignmentLegal(playerOrThrows, position, ageOverride)));
  }

  function sampleCapability(random, center, spread, modifier = 0) {
    const shaped = ((random() + random() + random()) / 3 - 0.5) * spread * 2;
    return Math.round(clamp(center + shaped + modifier));
  }

  function createGeneratedPlayer(input) {
    const { random, teamId, index, primaryPosition, standardPrior, bench, weakness } = input;
    const roleOffset = (bench ? standardPrior.benchOffset : 0) + (Number(input.talentModifier) || 0);
    const positionPenalty = Number(weakness) || 0;
    const center = standardPrior.center + roleOffset - positionPenalty;
    const throws = LEFT_HANDED_RESTRICTED.includes(primaryPosition) ? "R" : random() < 0.24 ? "L" : "R";
    const secondaryPool = POSITION_ORDER.filter(position => position !== primaryPosition
      && !(throws === "L" && LEFT_HANDED_RESTRICTED.includes(position)));
    const secondary = secondaryPool[Math.floor(random() * secondaryPool.length)];
    const positionModifiers = {
      P: { pitching: 1.4, arm: 0.8, power: -0.5 }, C: { defense: 0.8, arm: 0.8, speed: -0.7 },
      "1B": { power: 0.8, speed: -0.5 }, "2B": { contact: 0.5, speed: 0.4 }, "3B": { power: 0.5, arm: 0.6 },
      SS: { defense: 1, speed: 0.4 }, LF: { power: 0.5 }, CF: { defense: 0.8, speed: 0.8 }, RF: { arm: 0.8, power: 0.3 }
    }[primaryPosition] || {};
    const capability = {};
    ["contact", "power", "speed", "defense", "arm", "pitching"].forEach(key => {
      const nonPitcherPenalty = key === "pitching" && primaryPosition !== "P" ? -3.8 : 0;
      capability[key] = sampleCapability(random, center, standardPrior.spread, (positionModifiers[key] || 0) + nonPitcherPenalty);
    });
    const control = primaryPosition === "P" ? sampleCapability(random, center, standardPrior.spread, 0.6) : Math.max(1, capability.pitching - 1);
    const stuff = primaryPosition === "P" ? sampleCapability(random, center, standardPrior.spread, 0.8) : capability.pitching;
    return Object.freeze({
      playerId: `${teamId}-player-${String(index + 1).padStart(2, "0")}`,
      id: `${teamId}-player-${String(index + 1).padStart(2, "0")}`,
      name: DEFAULT_NAMES[index % DEFAULT_NAMES.length], age: 16 + (index % 3), year: 1 + (index % 3),
      primaryPosition, secondaryPositions: Object.freeze(secondary ? [secondary] : []),
      bats: random() < 0.28 ? "L" : "R", throws,
      ...capability,
      pitchingProfile: Object.freeze({ effectiveness: capability.pitching, control, stuff }),
      source: "team-roster-foundation"
    });
  }

  function createPlayerActor(playerActor, teamId) {
    const primaryPosition = normalizePosition(playerActor?.primaryPosition);
    const offense = playerActor?.simulationCapability?.offense || {};
    const defense = playerActor?.simulationCapability?.defense || {};
    return Object.freeze({
      playerId: playerActor?.playerId || playerActor?.id || "player", id: playerActor?.id || "player",
      name: playerActor?.name || "你", age: Number(playerActor?.age) || 15,
      year: Math.max(1, Math.min(3, Number(playerActor?.year) || ((Number(playerActor?.age) || 16) - 15))),
      primaryPosition, secondaryPositions: Object.freeze((playerActor?.secondaryPositions || []).map(normalizePosition).filter(Boolean)),
      bats: playerActor?.bats || "R", throws: playerActor?.throws || "R",
      contact: clamp(offense.contact ?? playerActor?.contact ?? 5), power: clamp(offense.power ?? playerActor?.power ?? 5),
      speed: clamp(offense.speed ?? playerActor?.speed ?? 5), defense: clamp(defense.fielding ?? playerActor?.defense ?? 5),
      arm: clamp(defense.arm ?? playerActor?.arm ?? 5), pitching: clamp(playerActor?.pitching ?? 1),
      pitchingProfile: Object.freeze({ effectiveness: clamp(playerActor?.pitching ?? 1), control: clamp(playerActor?.control ?? 1), stuff: clamp(playerActor?.stuff ?? 1) }),
      source: "canonical-player", rosterTeamId: teamId
    });
  }

  function orderLineup(starters, defensiveAssignments = {}) {
    const remaining = starters.slice();
    const takeBest = scorer => remaining.splice(remaining.reduce((best, player, index, list) => scorer(player) > scorer(list[best]) ? index : best, 0), 1)[0];
    const ordered = [];
    ordered.push(takeBest(player => player.contact * 0.55 + player.speed * 0.45));
    ordered.push(takeBest(player => player.contact * 0.65 + player.speed * 0.25 + player.power * 0.1));
    ordered.push(takeBest(player => player.contact * 0.55 + player.power * 0.45));
    ordered.push(takeBest(player => player.power * 0.75 + player.contact * 0.25));
    ordered.push(takeBest(player => player.power * 0.6 + player.contact * 0.4));
    remaining.sort((a, b) => (b.contact + b.power + b.speed * 0.4) - (a.contact + a.power + a.speed * 0.4));
    return Object.freeze([...ordered, ...remaining].map((player, index) => Object.freeze({
      battingOrder: index + 1,
      playerId: player.playerId,
      defensivePosition: defensiveAssignments[player.playerId] || player.primaryPosition
    })));
  }

  function getRosterSelectionScore(player, position) {
    if (position === "P") return Number(player?.pitchingProfile?.effectiveness ?? player?.pitching) || 0;
    const defense = Number(player?.defense) || 0;
    const arm = Number(player?.arm) || 0;
    const contact = Number(player?.contact) || 0;
    const power = Number(player?.power) || 0;
    const speed = Number(player?.speed) || 0;
    if (["C", "SS", "2B", "CF"].includes(position)) return defense * 0.55 + arm * 0.2 + speed * 0.15 + contact * 0.1;
    return defense * 0.4 + arm * 0.2 + contact * 0.2 + power * 0.15 + speed * 0.05;
  }

  function rebuildTeamRoster(options = {}) {
    const sourceRoster = options.sourceRoster || {};
    const players = (options.players || []).filter(player => player?.playerId && player.id !== "player");
    if (new Set(players.map(player => player.playerId)).size !== players.length) {
      throw new Error("TeamRoster rebuild requires unique actor identities.");
    }
    const used = new Set();
    const assignments = {};
    const starters = POSITION_ORDER.map(position => {
      const candidate = players
        .filter(player => !used.has(player.playerId) && isPositionEligible(player, position))
        .sort((left, right) => Number(right.primaryPosition === position) - Number(left.primaryPosition === position)
          || getRosterSelectionScore(right, position) - getRosterSelectionScore(left, position)
          || left.playerId.localeCompare(right.playerId))[0];
      if (!candidate) throw new Error(`TeamRoster rebuild cannot cover ${position}.`);
      used.add(candidate.playerId);
      assignments[candidate.playerId] = position;
      return candidate;
    });
    const benchPlayers = players.filter(player => !used.has(player.playerId));
    const battingOrder = orderLineup(starters, assignments);
    const startingPitcher = starters.find(player => assignments[player.playerId] === "P");
    const secondaryPitchers = players
      .filter(player => player.playerId !== startingPitcher?.playerId && isPositionEligible(player, "P"))
      .sort((left, right) => (Number(right.pitching) || 0) - (Number(left.pitching) || 0))
      .map(player => player.playerId);
    return Object.freeze({
      version: VERSION,
      teamId: String(options.teamId || sourceRoster.teamId || "generated-team"),
      schoolId: String(options.schoolId || sourceRoster.schoolId || options.teamId || sourceRoster.teamId || "generated-team"),
      schoolStandard: SCHOOL_STANDARDS.includes(options.schoolStandard) ? options.schoolStandard : sourceRoster.schoolStandard || "standard",
      yearIdentity: String(options.yearIdentity || sourceRoster.yearIdentity || "year-1"),
      generationSeed: String(options.generationSeed || sourceRoster.generationSeed || "rebuild"),
      composition: options.composition || sourceRoster.composition || "natural",
      players: Object.freeze(players.slice()),
      starters: Object.freeze(starters),
      benchPlayers: Object.freeze(benchPlayers),
      pitchingStaff: Object.freeze({ starter: startingPitcher?.playerId || "", secondaryPitchers: Object.freeze(secondaryPitchers) }),
      battingOrder
    });
  }

  function generateTeamRoster(options = {}) {
    const schoolStandard = STANDARD_PRIORS[options.schoolStandard] ? options.schoolStandard : "standard";
    const teamId = String(options.teamId || options.schoolId || "generated-team");
    const yearIdentity = String(options.yearIdentity ?? "year-1");
    const generationSeed = String(options.seed ?? `${teamId}|${yearIdentity}`);
    const random = createSeededRandom(`${teamId}|${yearIdentity}|${generationSeed}`);
    const prior = STANDARD_PRIORS[schoolStandard];
    const composition = ["topHeavy", "deep"].includes(options.composition) ? options.composition : "natural";
    const weaknesses = options.positionWeaknesses || {};
    const starters = POSITION_ORDER.map((position, index) => createGeneratedPlayer({
      random, teamId, index, primaryPosition: position, standardPrior: prior, bench: false,
      weakness: weaknesses[position] ?? weaknesses[POSITION_LABELS[position]] ?? 0,
      talentModifier: composition === "topHeavy" ? (index < 2 ? 2 : -0.85) : composition === "deep" ? 0.35 : 0
    }));
    const benchPositions = ["C", "1B", "2B", "SS", "LF", "CF"];
    const benchPlayers = benchPositions.map((position, offset) => createGeneratedPlayer({
      random, teamId, index: 9 + offset, primaryPosition: position, standardPrior: prior, bench: true,
      weakness: weaknesses[position] ?? weaknesses[POSITION_LABELS[position]] ?? 0,
      talentModifier: composition === "topHeavy" ? -1.15 : composition === "deep" ? 1.1 : 0
    }));
    const extraPitchers = [0, 1].map((_, offset) => createGeneratedPlayer({
      random, teamId, index: 15 + offset, primaryPosition: "P",
      standardPrior: { ...prior, center: prior.center + prior.pitchingDepth }, bench: true, weakness: weaknesses.P || 0,
      talentModifier: composition === "topHeavy" ? -0.8 : composition === "deep" ? 0.9 : 0
    }));
    let players = [...starters, ...benchPlayers, ...extraPitchers];
    let activeStarters = starters.slice();
    let activeBench = [...benchPlayers, ...extraPitchers];
    if (options.playerActor) {
      const actor = createPlayerActor(options.playerActor, teamId);
      players.push(actor);
      const requestedRole = options.playerRole === "starter" ? "starter" : "bench";
      const assignment = normalizePosition(options.playerPosition || actor.primaryPosition);
      if (requestedRole === "starter" && assignment && isPositionEligible(actor, assignment)) {
        const replacedIndex = activeStarters.findIndex(item => item.primaryPosition === assignment);
        if (replacedIndex >= 0) {
          activeBench.push(activeStarters[replacedIndex]);
          activeStarters[replacedIndex] = Object.freeze({ ...actor, primaryPosition: assignment });
        } else activeBench.push(actor);
      } else activeBench.push(actor);
    }
    const battingOrder = orderLineup(activeStarters);
    const startingPitcher = activeStarters.find(player => player.primaryPosition === "P");
    const pitcherCandidates = players.filter(player => player.primaryPosition === "P" && player.playerId !== startingPitcher?.playerId).sort((a, b) => b.pitching - a.pitching);
    const pitchingStaff = Object.freeze({
      starter: startingPitcher?.playerId || "",
      secondaryPitchers: Object.freeze(pitcherCandidates.map(player => player.playerId))
    });
    return Object.freeze({
      version: VERSION, teamId, schoolId: String(options.schoolId || teamId), schoolStandard, yearIdentity, generationSeed, composition,
      players: Object.freeze(players), starters: Object.freeze(activeStarters), benchPlayers: Object.freeze(activeBench),
      pitchingStaff, battingOrder
    });
  }

  function toMatchRoster(teamRoster, strengthProfile = null) {
    const byId = new Map(teamRoster.players.map(player => [player.playerId, player]));
    const lineup = teamRoster.battingOrder.map(slot => {
      const player = byId.get(slot.playerId);
      return Object.freeze({ ...player, id: player.id || player.playerId, position: POSITION_LABELS[slot.defensivePosition], defensivePosition: slot.defensivePosition, source: player.id === "player" ? "canonical-player" : "simulation-roster" });
    });
    const starterIds = new Set(lineup.map(player => player.playerId));
    const bench = teamRoster.benchPlayers.filter(player => !starterIds.has(player.playerId)).map(player => Object.freeze({ ...player, id: player.id || player.playerId, position: POSITION_LABELS[player.primaryPosition], source: player.id === "player" ? "canonical-player" : "simulation-roster" }));
    return { lineup, bench, pitchingStaff: teamRoster.pitchingStaff, teamRoster, teamStrengthProfile: strengthProfile, source: VERSION };
  }

  function validateRoster(roster) {
    const errors = [];
    if (roster?.version !== VERSION) errors.push("version-invalid");
    if (!Array.isArray(roster?.starters) || roster.starters.length !== 9) errors.push("starter-count-invalid");
    const assignments = (roster?.battingOrder || []).map(slot => slot.defensivePosition);
    if (assignments.length !== 9 || new Set(assignments).size !== 9 || POSITION_ORDER.some(position => !assignments.includes(position))) errors.push("position-coverage-invalid");
    const playerIds = (roster?.battingOrder || []).map(slot => slot.playerId);
    if (new Set(playerIds).size !== playerIds.length) errors.push("batting-order-duplicate");
    const byId = new Map((roster?.players || []).map(player => [player.playerId, player]));
    (roster?.battingOrder || []).forEach(slot => {
      const actor = byId.get(slot.playerId);
      if (!actor || !isPositionEligible(actor, slot.defensivePosition)) errors.push(`illegal-assignment:${slot.playerId}:${slot.defensivePosition}`);
    });
    if (!roster?.pitchingStaff?.starter || !(roster?.pitchingStaff?.secondaryPitchers || []).length) errors.push("pitching-staff-incomplete");
    return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
  }

  function getPositionCompetition(roster, position) {
    const code = normalizePosition(position);
    const starterSlot = (roster?.battingOrder || []).find(slot => slot.defensivePosition === code) || null;
    const starterId = starterSlot?.playerId || "";
    const benchCompetitors = (roster?.benchPlayers || []).filter(player => isPositionEligible(player, code));
    const competitorIds = [starterId, ...benchCompetitors.map(player => player.playerId)].filter(Boolean);
    return Object.freeze({
      position: code,
      starterId,
      competitorIds: Object.freeze(competitorIds),
      benchCompetitorIds: Object.freeze(benchCompetitors.map(player => player.playerId)),
      competitionCount: competitorIds.length
    });
  }

  function injectPlayerIntoRoster(baseRoster, playerActor, options = {}) {
    if (!validateRoster(baseRoster).ok) throw new Error("Player injection requires a valid base TeamRoster.");
    const actor = createPlayerActor(playerActor, baseRoster.teamId);
    const requestedPosition = normalizePosition(options.playerPosition || actor.primaryPosition);
    const starterRequested = options.playerRole === "starter";
    const starterAllowed = starterRequested && requestedPosition && isPositionEligible(actor, requestedPosition);
    const starters = baseRoster.starters.filter(player => player.id !== "player").slice();
    const benchPlayers = baseRoster.benchPlayers.filter(player => player.id !== "player").slice();
    let replacedPlayerId = "";
    if (starterAllowed) {
      const assignedStarterId = baseRoster.battingOrder?.find(slot => slot.defensivePosition === requestedPosition)?.playerId;
      const index = starters.findIndex(player => player.playerId === assignedStarterId);
      if (index >= 0) {
        const incumbent = starters[index];
        replacedPlayerId = incumbent.playerId;
        benchPlayers.push(incumbent);
        starters[index] = Object.freeze({ ...actor, primaryPosition: requestedPosition });
      } else benchPlayers.push(actor);
    } else benchPlayers.push(actor);
    const player = starters.find(item => item.id === "player") || benchPlayers.find(item => item.id === "player");
    const existingIds = new Set([...starters, ...benchPlayers].map(item => item.playerId));
    const players = [...baseRoster.players.filter(item => item.id !== "player" && existingIds.has(item.playerId)), player].filter(Boolean);
    const battingOrder = orderLineup(starters);
    const pitchingStaff = requestedPosition === "P" && starterAllowed && replacedPlayerId
      ? Object.freeze({ starter: player.playerId, secondaryPitchers: Object.freeze([replacedPlayerId, ...(baseRoster.pitchingStaff?.secondaryPitchers || []).filter(id => id !== replacedPlayerId)]) })
      : baseRoster.pitchingStaff;
    return Object.freeze({
      ...baseRoster,
      players: Object.freeze(players), starters: Object.freeze(starters), benchPlayers: Object.freeze(benchPlayers), battingOrder, pitchingStaff,
      playerInjection: Object.freeze({
        playerId: player?.playerId || "player", requestedPosition, assignedPosition: starterAllowed && replacedPlayerId ? requestedPosition : "",
        rosterRole: starterAllowed && replacedPlayerId ? "starter" : "bench", replacedPlayerId,
        legal: requestedPosition ? isHighSchoolPositionAssignmentLegal(actor, requestedPosition) : false
      })
    });
  }

  return Object.freeze({
    VERSION, POSITION_ORDER, POSITION_LABELS, LEFT_HANDED_RESTRICTED, STANDARD_PRIORS, SCHOOL_STANDARDS,
    normalizePosition, isPositionEligible, isHighSchoolPositionAssignmentLegal, getLegalHighSchoolPositions,
    createSeededRandom, generateTeamRoster, rebuildTeamRoster, toMatchRoster, validateRoster, getPositionCompetition, injectPlayerIntoRoster
  });
});
