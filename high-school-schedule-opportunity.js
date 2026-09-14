(function(root, factory) {
  const api = factory(typeof module === "object" && module.exports ? require("./match-context-foundation") : root.MatchContextFoundation);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HighSchoolScheduleOpportunity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(MatchContext) {
  "use strict";
  const VERSION = "high-school-schedule-v1";
  const ORIGIN_MAP = Object.freeze({officialCompetitionOpportunity:"officialCompetition", incomingFriendlyInvitation:"awayInvitationFriendly",
    outgoingFriendlyInvitation:"homeInvitationFriendly", trainingCampOpportunity:"trainingCamp", developmentMatchOpportunity:"developmentMatch", neutralExchangeOpportunity:"neutralFriendly"});
  const SOURCES = Object.freeze(["competitionCalendar", "coachNetwork", "schoolRelationship", "trainingCampPlan", "developmentSchedule", "legacyFallback", "systemEligibility"]);
  const OPPORTUNITY_STATUSES = Object.freeze(["offered", "accepted", "declined", "scheduled", "expired"]);
  const ENTRY_STATUSES = Object.freeze(["scheduled", "inProgress", "completed", "cancelled"]);
  const copy = value => JSON.parse(JSON.stringify(value));
  const check = (ok, message) => { if (!ok) throw new Error(`High school schedule: ${message}`); };
  const id = value => { check(typeof value === "string" && value.trim().length > 0, "identity required"); return value; };
  const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
  const same = (a,b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
  // Encoded tuples avoid hash collisions and never consume simulation randomness.
  const identity = (prefix, facts) => prefix + ":" + encodeURIComponent(JSON.stringify(stable(facts)));
  function createOpportunity(input) {
    const careerYear = input.careerYear;
    check([1,2,3].includes(careerYear), "invalid career year");
    const opportunityType = input.opportunityType;
    check(Object.hasOwn(ORIGIN_MAP, opportunityType), "unknown opportunity type");
    const source = copy(input.source || {});
    check(SOURCES.includes(source.type), "unknown source"); id(source.sourceId);
    const playerSchoolId = id(input.playerSchoolId), opponentSchoolId = id(input.opponentSchoolId);
    check(playerSchoolId !== opponentSchoolId, "self opponent");
    const careerId = id(input.careerId), seasonPhase = id(input.seasonPhase);
    const sequence = input.sequence ?? 1;
    check(Number.isInteger(sequence) && sequence > 0, "invalid sequence");
    const status = input.status || "offered";
    check(OPPORTUNITY_STATUSES.includes(status), "invalid opportunity status");
    const opportunityId = identity("hs-match-opportunity", [careerId, careerYear, seasonPhase, sequence, opportunityType, source.type, source.sourceId, playerSchoolId, opponentSchoolId]);
    check(!input.opportunityId || input.opportunityId === opportunityId, "opportunity identity mismatch");
    const matchOrigin = ORIGIN_MAP[opportunityType];
    check(!input.matchOrigin || input.matchOrigin === matchOrigin, "origin mapping mismatch");
    const plannedContext = copy(input.plannedContext || {});
    const allowed = ["hostContext", "venueContext", "homeTeamId", "awayTeamId", "assignmentSeed", "assignmentSource", "assignmentReason", "competitionEditionId", "campId"];
    check(Object.keys(plannedContext).every(key => allowed.includes(key)), "unsupported context intent");
    // Validation and default home/away assignment remain exclusively in MatchContext.
    const intent = MatchContext.createMatchContext({...plannedContext, matchId:opportunityId, matchOrigin, playerTeamId:playerSchoolId, opponentTeamId:opponentSchoolId});
    plannedContext.hostContext = copy(intent.hostContext);
    plannedContext.venueContext = copy(intent.venueContext);
    return {opportunityId, careerId, careerYear, seasonPhase, sequence, opportunityType, source, playerSchoolId, opponentSchoolId,
      matchOrigin, plannedContext, status, provenance:copy(input.provenance || {}), competitionRefs:copy(input.competitionRefs || {})};
  }
  const emptyState = () => ({version:VERSION, opportunities:[], entries:[]});
  function offerOpportunity(state, input) {
    const offered = createOpportunity(input), existing = state.opportunities.find(item => item.opportunityId === offered.opportunityId);
    if (existing) {
      check(same({...existing,status:"offered"}, {...offered,status:"offered"}), "opportunity facts cannot change");
      return existing;
    }
    check(["offered", "accepted"].includes(offered.status), "new opportunity must be offered or accepted");
    state.opportunities.push(offered); return offered;
  }
  function setOpportunityStatus(state, opportunityId, status) {
    const opportunity = state.opportunities.find(item => item.opportunityId === opportunityId);
    check(opportunity, "unknown opportunity");
    if (opportunity.status === status) return opportunity;
    check((opportunity.status === "offered" && ["accepted","declined","expired"].includes(status))
      || (opportunity.status === "accepted" && ["declined","expired"].includes(status)), "invalid opportunity transition");
    opportunity.status = status; return opportunity;
  }
  const sameSlot = (a,b) => a.careerYear === b.careerYear && a.seasonPhase === b.seasonPhase && a.sequence === b.sequence;
  function isOpportunityEligible(opportunity, context, state = emptyState()) {
    const reasons = [];
    try { createOpportunity(opportunity); } catch(error) { reasons.push(error.message); }
    if (opportunity.careerId !== context.careerId || opportunity.careerYear !== context.careerYear) reasons.push("wrong-career-year");
    if (opportunity.seasonPhase !== context.seasonPhase) reasons.push("incompatible-phase");
    if (opportunity.playerSchoolId !== context.playerSchoolId || !Array.isArray(context.schoolIds)
      || !context.schoolIds.includes(opportunity.playerSchoolId) || !context.schoolIds.includes(opportunity.opponentSchoolId)) reasons.push("unknown-school");
    if (opportunity.status !== "accepted") reasons.push("not-accepted");
    if (state.entries.some(entry => entry.status !== "cancelled" && sameSlot(entry, opportunity) && entry.opportunityId !== opportunity.opportunityId)) reasons.push("occupied-slot");
    if ((context.mandatorySlots || []).some(slot => sameSlot(slot,opportunity)
      && !(opportunity.matchOrigin === "officialCompetition" && opportunity.source.sourceId === slot.sourceId))) reasons.push("mandatory-competition-conflict");
    return {eligible:reasons.length === 0, reasons};
  }
  function scheduleOpportunity(state, opportunityId, context) {
    const opportunity = state.opportunities.find(item => item.opportunityId === opportunityId);
    check(opportunity, "unknown opportunity");
    const existing = state.entries.find(item => item.opportunityId === opportunityId);
    if (existing) return existing; // Returns the original status; never reschedules cancelled/completed entries.
    const eligibility = isOpportunityEligible(opportunity,context,state);
    check(eligibility.eligible, eligibility.reasons.join(","));
    const entry = {scheduleEntryId:identity("hs-schedule-entry",[opportunityId]), opportunityId,
      careerYear:opportunity.careerYear, seasonPhase:opportunity.seasonPhase, sequence:opportunity.sequence,
      opponentSchoolId:opportunity.opponentSchoolId, matchOrigin:opportunity.matchOrigin,
      plannedContext:copy(opportunity.plannedContext), status:"scheduled", matchId:null};
    state.entries.push(entry); opportunity.status = "scheduled"; return entry;
  }
  function deriveMatchContextInput(state, scheduleEntryId, matchId) {
    const entry = state.entries.find(item => item.scheduleEntryId === scheduleEntryId);
    check(entry, "unknown entry");
    const opportunity = state.opportunities.find(item => item.opportunityId === entry.opportunityId);
    check(opportunity, "orphan entry"); id(matchId);
    check(!entry.matchId || entry.matchId === matchId, "entry already linked to another match");
    return {...copy(entry.plannedContext), matchId, matchOrigin:entry.matchOrigin,
      playerTeamId:opportunity.playerSchoolId, opponentTeamId:entry.opponentSchoolId,
      seasonId:identity("hs-season",[opportunity.careerId,entry.careerYear]), scheduleEntryId,
      provenance:{...copy(opportunity.provenance), source:opportunity.source.type, sourceId:opportunity.source.sourceId,
        opportunityId:opportunity.opportunityId, scheduleEntryId, opportunitySource:copy(opportunity.source), competitionRefs:copy(opportunity.competitionRefs)}};
  }
  function assertCanLaunch(state, scheduleEntryId, context, activeMatch) {
    const entry = state.entries.find(item => item.scheduleEntryId === scheduleEntryId);
    check(entry && ["scheduled","inProgress"].includes(entry.status), "entry cannot launch");
    const opportunity = state.opportunities.find(item => item.opportunityId === entry.opportunityId);
    const eligibility = isOpportunityEligible({...opportunity,status:"accepted"}, context, state);
    check(eligibility.eligible, eligibility.reasons.join(","));
    if (entry.status === "inProgress") check(activeMatch?.id === entry.matchId && activeMatch.matchContext?.scheduleEntryId === scheduleEntryId && !activeMatch.completed, "in-progress match link missing");
    else check(!activeMatch?.id || activeMatch.completed, "another match is active");
    return entry;
  }
  function markScheduleStarted(state, scheduleEntryId, match) {
    const entry = state.entries.find(item => item.scheduleEntryId === scheduleEntryId);
    check(entry && entry.status === "scheduled" && match.matchContext?.scheduleEntryId === scheduleEntryId, "invalid start link");
    check(!state.entries.some(item => item.matchId === match.id), "match already linked");
    entry.matchId = id(match.id); entry.status = "inProgress"; return entry;
  }
  function markScheduleCompleted(state, match) {
    const scheduleEntryId = match.matchContext?.scheduleEntryId;
    if (!scheduleEntryId) return null;
    const entry = state.entries.find(item => item.scheduleEntryId === scheduleEntryId);
    // External/legacy MatchContext provenance is not a managed schedule entry.
    if (!entry) return null;
    check(entry.matchId === match.id && match.completed && match.settled && ["inProgress","completed"].includes(entry.status), "invalid completion link");
    entry.status = "completed";
    entry.historyMatchId = match.id;
    if (match.gameRecord?.gameId) entry.gameRecordId = match.gameRecord.gameId;
    return entry;
  }
  function normalizeState(input) {
    if (input == null) return emptyState();
    check(input.version === VERSION && Array.isArray(input.opportunities) && Array.isArray(input.entries), "invalid saved schedule");
    const state = emptyState();
    for (const raw of input.opportunities) {
      const opportunity = createOpportunity(raw);
      check(!state.opportunities.some(item => item.opportunityId === opportunity.opportunityId), "duplicate opportunity");
      state.opportunities.push(opportunity);
    }
    for (const raw of input.entries) {
      const opportunity = state.opportunities.find(item => item.opportunityId === raw.opportunityId);
      check(opportunity && opportunity.status === "scheduled", "entry requires scheduled opportunity");
      check(raw.scheduleEntryId === identity("hs-schedule-entry",[raw.opportunityId]) && ENTRY_STATUSES.includes(raw.status), "invalid saved entry");
      check(!state.entries.some(item => item.scheduleEntryId === raw.scheduleEntryId || (raw.matchId && item.matchId === raw.matchId)
        || (raw.status !== "cancelled" && item.status !== "cancelled" && sameSlot(raw,item))), "duplicate entry or slot");
      for (const key of ["careerYear","seasonPhase","sequence","opponentSchoolId","matchOrigin","plannedContext"]) check(same(raw[key],opportunity[key]), "entry facts mismatch");
      check(["inProgress","completed"].includes(raw.status) ? typeof raw.matchId === "string" && raw.matchId.length > 0 : !raw.matchId, "invalid match link");
      const entry = Object.fromEntries(["scheduleEntryId","opportunityId","careerYear","seasonPhase","sequence","opponentSchoolId","matchOrigin","plannedContext","status","matchId","historyMatchId","gameRecordId"]
        .filter(key => raw[key] !== undefined).map(key => [key,copy(raw[key])]));
      state.entries.push(entry);
    }
    check(state.opportunities.every(item => item.status !== "scheduled" || state.entries.some(entry => entry.opportunityId === item.opportunityId)), "scheduled opportunity missing entry");
    return state;
  }
  function assertActiveMatchLink(state, match) {
    for (const entry of state.entries.filter(item => item.status === "inProgress")) {
      check(match?.id === entry.matchId && match.matchContext?.scheduleEntryId === entry.scheduleEntryId && !match.completed, "saved active match link missing");
      const expected = MatchContext.createMatchContext(deriveMatchContextInput(state,entry.scheduleEntryId,entry.matchId));
      check(same(expected,match.matchContext), "saved match intent mismatch");
    }
    return true;
  }
  return Object.freeze({VERSION,ORIGIN_MAP,SOURCES,OPPORTUNITY_STATUSES,ENTRY_STATUSES,emptyState,createOpportunity,normalizeOpportunity:createOpportunity,
    offerOpportunity,setOpportunityStatus,isOpportunityEligible,scheduleOpportunity,deriveMatchContextInput,assertCanLaunch,markScheduleStarted,markScheduleCompleted,normalizeState,assertActiveMatchLink});
});
