(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MatchContextFoundation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";
  const VERSION = "match-context-v1";
  const ORIGINS = Object.freeze(["officialCompetition", "homeInvitationFriendly", "awayInvitationFriendly", "trainingCamp", "neutralFriendly", "developmentMatch"]);
  const VENUES = Object.freeze(["homeGround", "awayGround", "neutralVenue", "trainingVenue"]);
  const check = (ok, message) => { if (!ok) throw new Error(`Match context: ${message}`); };
  const freeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  function hash(text) {
    let value = 2166136261;
    for (const char of text) { value ^= char.charCodeAt(0); value = Math.imul(value, 16777619); }
    return value >>> 0;
  }
  function createMatchContext(input = {}) {
    if (input.version) check(input.version === VERSION, "unsupported version");
    const matchId = String(input.matchId || "");
    const playerTeamId = String(input.playerTeamId || "");
    const opponentTeamId = String(input.opponentTeamId || "");
    check(matchId && playerTeamId && opponentTeamId && playerTeamId !== opponentTeamId, "match and distinct participant identities required");
    const matchOrigin = input.matchOrigin || "developmentMatch";
    check(ORIGINS.includes(matchOrigin), "unknown origin");
    const hostTeamId = input.hostContext?.hostTeamId || (matchOrigin === "homeInvitationFriendly" ? playerTeamId : matchOrigin === "awayInvitationFriendly" ? opponentTeamId : null);
    const venueType = input.venueContext?.type || (matchOrigin === "homeInvitationFriendly" ? "homeGround" : matchOrigin === "awayInvitationFriendly" ? "awayGround" : matchOrigin === "trainingCamp" ? "trainingVenue" : "neutralVenue");
    check(VENUES.includes(venueType), "unknown venue");
    const venueHost = input.venueContext?.hostTeamId || hostTeamId;
    if (venueType === "homeGround") check(venueHost === playerTeamId, "home ground must belong to player school");
    if (venueType === "awayGround") check(venueHost === opponentTeamId, "away ground must belong to opponent school");
    let homeTeamId = input.homeTeamId, awayTeamId = input.awayTeamId;
    let assignmentSource = input.assignmentSource, reasonCode = input.assignmentReason;
    if (homeTeamId || awayTeamId) {
      check(homeTeamId && awayTeamId, "explicit assignment requires both teams");
      assignmentSource = assignmentSource || "explicitAssignment";
      reasonCode = reasonCode || "providedHomeAway";
    } else if (input.legacyFallback === true) {
      homeTeamId = playerTeamId; awayTeamId = opponentTeamId;
      assignmentSource = "legacyFallback"; reasonCode = "historicalPlayerHome";
    } else if (["homeInvitationFriendly", "awayInvitationFriendly", "trainingCamp"].includes(matchOrigin)
      && (matchOrigin !== "trainingCamp" || venueType !== "neutralVenue") && [playerTeamId, opponentTeamId].includes(hostTeamId)) {
      homeTeamId = hostTeamId; awayTeamId = hostTeamId === playerTeamId ? opponentTeamId : playerTeamId;
      assignmentSource = "hostAssignment"; reasonCode = "hostDefaultsHome";
    } else {
      const key = JSON.stringify([VERSION, "assignment", matchId, input.seasonId || "", playerTeamId, opponentTeamId, input.assignmentSeed ?? 0]);
      homeTeamId = hash(key) % 2 === 0 ? playerTeamId : opponentTeamId;
      awayTeamId = homeTeamId === playerTeamId ? opponentTeamId : playerTeamId;
      assignmentSource = "fallback"; reasonCode = "deterministicIdentityAssignment";
    }
    check(homeTeamId !== awayTeamId, "home equals away");
    check([homeTeamId, awayTeamId].includes(playerTeamId), "player not in match");
    check((homeTeamId === playerTeamId ? awayTeamId : homeTeamId) === opponentTeamId, "opponent mismatch");
    const sourceDefaults = {officialCompetition:"competitionSchedule",homeInvitationFriendly:"matchInvitation",awayInvitationFriendly:"matchInvitation",trainingCamp:"trainingCampSchedule",neutralFriendly:"friendlySchedule",developmentMatch:"developmentFallback"};
    const provenance = JSON.parse(JSON.stringify(input.provenance || {}));
    provenance.source = provenance.source || (assignmentSource === "legacyFallback" ? "legacyFallback" : sourceDefaults[matchOrigin]);
    provenance.reasonCode = provenance.reasonCode || reasonCode;
    const result = {version:VERSION, matchId, matchOrigin, playerTeamId, opponentTeamId, homeTeamId, awayTeamId,
      hostContext: hostTeamId ? {hostTeamId} : {}, venueContext: {type:venueType, ...(venueHost ? {hostTeamId:venueHost} : {})},
      assignmentSource, assignmentReason:reasonCode, provenance};
    for (const key of ["seasonId", "assignmentSeed", "competitionEditionId", "scheduleEntryId", "campId"]) if (input[key] !== undefined) result[key] = input[key];
    return freeze(result);
  }
  function playerSide(context) { return context.playerTeamId === context.homeTeamId ? "home" : "away"; }
  function deriveBattingSide(context, half) {
    check(["上", "下"].includes(half), "invalid live half");
    const offenseTeam = half === "上" ? "away" : "home";
    return freeze({offenseTeam, defenseTeam:offenseTeam === "away" ? "home" : "away",
      battingTeamId:context[offenseTeam + "TeamId"], fieldingTeamId:context[(offenseTeam === "away" ? "home" : "away") + "TeamId"]});
  }
  return Object.freeze({VERSION, ORIGINS, VENUES, createMatchContext, normalizeMatchContext:createMatchContext,
    validateMatchContext(input) { try {createMatchContext(input); return {ok:true};} catch(error) {return {ok:false,reason:error.message};} },
    playerSide, isPlayerHome:context=>playerSide(context)==="home", isPlayerAway:context=>playerSide(context)==="away", deriveBattingSide});
});
