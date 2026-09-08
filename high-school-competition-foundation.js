(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HighSchoolCompetitionFoundation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const VERSION = 1;
  const TEAM_TYPES = ["school", "county_representative", "national_training", "national_team"];
  const copy = value => JSON.parse(JSON.stringify(value));
  function check(condition, message) { if (!condition) throw new Error(message); }
  function id(value) { check(typeof value === "string" && value.trim().length > 0, "Invalid identity"); return value; }
  function one(value, values) { check(values.includes(value), `Invalid value: ${value}`); return value; }
  function key(...parts) { return JSON.stringify(parts); }
  function emptyState() {
    return { version: VERSION, definitions: [], editions: [], teams: [], entries: [], representativeRosters: [], participations: [] };
  }
  function createTeamContext(input) {
    const teamType = one(input.teamType, TEAM_TYPES);
    return { teamType, teamId: id(input.teamId), organizationId: id(input.organizationId), temporary: teamType !== "school" };
  }
  function createCompetitionDefinition(input) {
    return { competitionId: id(input.competitionId),
      competitionType: one(input.competitionType, ["school_league", "school_tournament", "selection_tournament", "international"]),
      entryUnit: one(input.entryUnit, ["school", "county_representative", "national_team"]),
      level: one(input.level, ["high_school", "national_selection", "international_u18"]),
      selectionRelevance: copy(input.selectionRelevance ?? null) };
  }
  function createCompetitionEdition(input) {
    check(Number.isInteger(input.seasonYear) && input.seasonYear > 0, "Invalid season year");
    const eligibility = copy(input.eligibility || {});
    const rule = eligibility.ageRule;
    if (rule) {
      one(rule.type, ["age", "birth_year"]);
      check((rule.min === undefined || Number.isInteger(rule.min)) && (rule.max === undefined || Number.isInteger(rule.max)), "Invalid age window");
      check(rule.min === undefined || rule.max === undefined || rule.min <= rule.max, "Reversed age window");
    }
    if (eligibility.schoolStages) check(Array.isArray(eligibility.schoolStages) && eligibility.schoolStages.every(stage => typeof stage === "string"), "Invalid school stages");
    if (eligibility.requireAvailable !== undefined) check(typeof eligibility.requireAvailable === "boolean", "Invalid availability rule");
    return { editionId: id(input.editionId), competitionId: id(input.competitionId), seasonYear: input.seasonYear,
      status: one(input.status || "planned", ["planned", "active", "completed", "cancelled"]),
      eligibility, rosterRules: copy(input.rosterRules || {}), selectionConfig: copy(input.selectionConfig || {}) };
  }
  // age is a canonical current-age adapter. A birth-year rule requires explicit birthYear;
  // schoolYear is deliberately never used as an age or U18 proxy.
  function evaluateCompetitionEligibility(player, edition) {
    const { eligibility } = createCompetitionEdition(edition);
    const reasons = [];
    const rule = eligibility.ageRule;
    if (rule) {
      const value = rule.type === "birth_year" ? player.birthYear : player.age;
      if (!Number.isInteger(value)) reasons.push("age-information-missing");
      else if ((rule.min !== undefined && value < rule.min) || (rule.max !== undefined && value > rule.max)) reasons.push("outside-age-window");
    }
    if (eligibility.schoolStages && !eligibility.schoolStages.includes(player.schoolStage)) reasons.push("school-stage-ineligible");
    if (eligibility.requireAvailable && player.available !== true) reasons.push("availability-not-confirmed");
    return { eligible: reasons.length === 0, reasons };
  }
  function put(list, field, value, identity = item => item[field]) {
    const existing = list.find(item => identity(item) === identity(value));
    if (existing) {
      check(JSON.stringify(existing) === JSON.stringify(value), `Conflicting identity: ${identity(value)}`);
      return existing;
    }
    list.push(value); return value;
  }
  function find(list, field, value) {
    const result = list.find(item => item[field] === value);
    check(result, `Unknown ${field}: ${value}`); return result;
  }
  function initializePlayer(player) {
    if (!player.competitionFoundation) player.competitionFoundation = emptyState();
    if (!player.temporaryTeamAssignments) player.temporaryTeamAssignments = [];
    if (player.primaryTeamAssignment === undefined) player.primaryTeamAssignment = null;
    return player.competitionFoundation;
  }
  function registerDefinition(player, input) {
    return put(initializePlayer(player).definitions, "competitionId", createCompetitionDefinition(input));
  }
  function registerTeam(player, input) {
    return put(initializePlayer(player).teams, "teamId", createTeamContext(input));
  }
  function registerEdition(player, input) {
    const state = initializePlayer(player), edition = createCompetitionEdition(input);
    find(state.definitions, "competitionId", edition.competitionId);
    return put(state.editions, "editionId", edition);
  }
  function assignPrimarySchool(player, input) {
    const team = createTeamContext(input);
    check(team.teamType === "school", "Primary team must be a school");
    const selected = player.schoolInvitationState?.selectedSchoolId;
    check(!selected || selected === team.teamId, "Primary school conflicts with selected school");
    check(!player.primaryTeamAssignment || JSON.stringify(player.primaryTeamAssignment) === JSON.stringify(team), "Primary school identity is immutable");
    registerTeam(player, team);
    player.primaryTeamAssignment = team;
    return team;
  }
  function enterCompetition(player, input) {
    const state = initializePlayer(player);
    const edition = find(state.editions, "editionId", input.competitionEditionId);
    const definition = find(state.definitions, "competitionId", edition.competitionId);
    const team = find(state.teams, "teamId", input.teamId);
    check(team.teamType === definition.entryUnit, "Team type does not match entry unit");
    if (input.teamType !== undefined) check(input.teamType === team.teamType, "Entry team type mismatch");
    const entry = { entryId: id(input.entryId || key(edition.editionId, team.teamId)), competitionEditionId: edition.editionId,
      teamId: team.teamId, teamType: team.teamType, entryStatus: one(input.entryStatus || "entered", ["entered", "completed", "withdrawn"]) };
    const pair = item => key(item.competitionEditionId, item.teamId);
    check(!state.entries.some(item => item.entryId === entry.entryId && pair(item) !== pair(entry)), "Entry ID collision");
    return put(state.entries, "entryId", entry, pair);
  }
  function recordParticipation(player, input) {
    const state = initializePlayer(player);
    check(state.entries.some(item => item.teamId === input.teamId && item.competitionEditionId === input.competitionEditionId), "Participation requires team entry");
    const participation = { playerId: id(input.playerId), competitionEditionId: id(input.competitionEditionId), teamId: id(input.teamId),
      rosterStatus: one(input.rosterStatus, ["active_roster", "reserve", "inactive"]),
      participationStatus: one(input.participationStatus, ["none", "appeared"]) };
    return put(state.participations, "playerId", participation, item => key(item.playerId, item.competitionEditionId, item.teamId));
  }
  // Canonical source rosters are read only. Store identity references, never capabilities.
  function addRepresentativeRosterEntry(player, input, sourceRoster) {
    const state = initializePlayer(player), team = find(state.teams, "teamId", input.teamId);
    check(team.temporary, "Representative roster requires temporary team");
    find(state.editions, "editionId", input.competitionEditionId);
    check(sourceRoster?.teamId === input.sourceTeamId && sourceRoster.players?.some(actor => actor.playerId === input.playerId), "Canonical source player not found");
    const rosterId = id(input.rosterId || key(input.competitionEditionId, input.teamId));
    const pair = item => key(item.competitionEditionId, item.teamId);
    const existing = state.representativeRosters.find(item => pair(item) === pair(input));
    check(!existing || existing.rosterId === rosterId, "Roster identity conflict");
    check(!state.representativeRosters.some(item => item.rosterId === rosterId && pair(item) !== pair(input)), "Roster ID collision");
    const roster = existing || { rosterId, teamId: team.teamId, competitionEditionId: input.competitionEditionId, entries: [] };
    put(roster.entries, "playerId", { playerId: id(input.playerId), sourceTeamId: id(input.sourceTeamId),
      rosterRole: id(input.rosterRole || "reserve"), status: one(input.status || "active", ["active", "completed", "withdrawn"]) });
    if (!existing) state.representativeRosters.push(roster);
    return roster;
  }
  function startTemporaryAssignment(player, input) {
    const state = initializePlayer(player), team = find(state.teams, "teamId", input.teamId);
    check(player.primaryTeamAssignment?.teamType === "school", "Primary school required");
    check(team.temporary, "Temporary assignment requires representative team");
    const edition = find(state.editions, "editionId", input.competitionEditionId);
    const assignmentId = id(input.assignmentId || key(edition.editionId, team.teamId));
    const existing = player.temporaryTeamAssignments.find(item => item.assignmentId === assignmentId || (item.teamId === team.teamId && item.competitionEditionId === edition.editionId));
    if (existing) {
      check(existing.assignmentId === assignmentId && existing.teamId === team.teamId && existing.competitionEditionId === edition.editionId, "Assignment identity conflict");
      return existing; // Replayed selection must never reactivate completed history.
    }
    check(!["completed", "cancelled"].includes(edition.status), "Edition has ended");
    const assignment = { assignmentId, teamId: team.teamId, teamType: team.teamType, competitionEditionId: edition.editionId,
      status: "active", startContext: copy(input.startContext || {}), endContext: null };
    player.temporaryTeamAssignments.push(assignment); return assignment;
  }
  function endTemporaryAssignment(player, assignmentId, status = "completed", endContext = {}) {
    one(status, ["completed", "withdrawn"]);
    const assignment = find(player.temporaryTeamAssignments || [], "assignmentId", assignmentId);
    if (assignment.status !== "active") { check(assignment.status === status, "Assignment already ended"); return assignment; }
    assignment.status = status; assignment.endContext = copy(endContext); return assignment;
  }
  function completeEdition(player, editionId, endContext = {}) {
    const state = initializePlayer(player), edition = find(state.editions, "editionId", editionId);
    check(edition.status !== "cancelled", "Edition cancelled");
    edition.status = "completed";
    player.temporaryTeamAssignments.filter(item => item.competitionEditionId === editionId && item.status === "active")
      .forEach(item => endTemporaryAssignment(player, item.assignmentId, "completed", endContext));
  }
  const getActiveAssignments = player => copy((player.temporaryTeamAssignments || []).filter(item => item.status === "active"));
  const getHistoricalAssignments = player => copy((player.temporaryTeamAssignments || []).filter(item => item.status !== "active"));
  function assertIntegrity(player) {
    const state = player.competitionFoundation;
    check(state?.version === VERSION, "Unsupported competition schema");
    const rebuilt = { primaryTeamAssignment: null, temporaryTeamAssignments: [], competitionFoundation: emptyState(), schoolInvitationState: player.schoolInvitationState };
    for (const name of ["definitions", "editions", "teams", "entries", "representativeRosters", "participations"]) check(Array.isArray(state[name]), `Invalid ${name}`);
    state.definitions.forEach(item => registerDefinition(rebuilt, item));
    state.teams.forEach(item => { check(item.temporary === (item.teamType !== "school"), "Invalid temporary flag"); registerTeam(rebuilt, item); });
    state.editions.forEach(item => registerEdition(rebuilt, item));
    if (player.primaryTeamAssignment) {
      check(player.primaryTeamAssignment.temporary === false, "Primary school cannot be temporary");
      check(state.teams.some(team => team.teamId === player.primaryTeamAssignment.teamId), "Primary school is unregistered");
      assignPrimarySchool(rebuilt, player.primaryTeamAssignment);
    }
    state.entries.forEach(item => enterCompetition(rebuilt, item));
    state.participations.forEach(item => recordParticipation(rebuilt, item));
    for (const name of ["definitions", "editions", "teams", "entries", "participations"]) check(rebuilt.competitionFoundation[name].length === state[name].length, `Duplicate ${name}`);
    check(Array.isArray(player.temporaryTeamAssignments), "Invalid assignments");
    const assignments = new Set(), pairs = new Set();
    player.temporaryTeamAssignments.forEach(item => {
      check(player.primaryTeamAssignment, "Assignment without school");
      const team = find(state.teams, "teamId", item.teamId), edition = find(state.editions, "editionId", item.competitionEditionId);
      check(team.temporary && team.teamType === item.teamType, "Assignment team mismatch");
      one(item.status, ["active", "completed", "withdrawn"]);
      check(item.startContext && typeof item.startContext === "object" && !Array.isArray(item.startContext), "Invalid assignment start context");
      check(item.status === "active" ? item.endContext === null : item.endContext && typeof item.endContext === "object" && !Array.isArray(item.endContext), "Invalid assignment end context");
      check(item.status !== "active" || !["completed", "cancelled"].includes(edition.status), "Ended edition has active assignment");
      const pair = key(item.teamId, item.competitionEditionId);
      check(!assignments.has(id(item.assignmentId)) && !pairs.has(pair), "Duplicate assignment");
      assignments.add(item.assignmentId); pairs.add(pair);
    });
    const rosters = new Set(), rosterPairs = new Set();
    state.representativeRosters.forEach(roster => {
      check(find(state.teams, "teamId", roster.teamId).temporary, "Non-representative roster");
      find(state.editions, "editionId", roster.competitionEditionId);
      const pair = key(roster.teamId, roster.competitionEditionId);
      check(!rosters.has(id(roster.rosterId)) && !rosterPairs.has(pair), "Duplicate roster");
      rosters.add(roster.rosterId); rosterPairs.add(pair);
      check(Array.isArray(roster.entries), "Invalid roster entries");
      const ids = new Set();
      roster.entries.forEach(entry => {
        check(Object.keys(entry).sort().join() === "playerId,rosterRole,sourceTeamId,status", "Roster must contain identity references only");
        check(!ids.has(id(entry.playerId)), "Duplicate roster player"); ids.add(entry.playerId);
        id(entry.sourceTeamId); id(entry.rosterRole); one(entry.status, ["active", "completed", "withdrawn"]);
      });
    });
    return true;
  }
  function restorePlayer(player) {
    initializePlayer(player);
    // Existing saves derive identity only from the authoritative selected school ID.
    const schoolId = player.schoolInvitationState?.selectedSchoolId;
    if (!player.primaryTeamAssignment && schoolId) assignPrimarySchool(player, { teamId: schoolId, organizationId: schoolId, teamType: "school" });
    assertIntegrity(player);
    player.competitionFoundation = copy(player.competitionFoundation);
    player.temporaryTeamAssignments = copy(player.temporaryTeamAssignments);
    player.primaryTeamAssignment = copy(player.primaryTeamAssignment);
    return player;
  }
  return Object.freeze({ VERSION, emptyState, createTeamContext, createCompetitionDefinition, createCompetitionEdition,
    evaluateCompetitionEligibility, registerDefinition, registerEdition, registerTeam, assignPrimarySchool, enterCompetition,
    recordParticipation, addRepresentativeRosterEntry, startTemporaryAssignment, endTemporaryAssignment, completeEdition,
    getActiveAssignments, getHistoricalAssignments, assertIntegrity, restorePlayer });
});
