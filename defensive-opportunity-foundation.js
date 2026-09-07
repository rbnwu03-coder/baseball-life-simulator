(function (root, factory) {
  const physical = root.BattedBallPhysical
    || (typeof module === "object" && module.exports && typeof require === "function" ? require("./batted-ball-physical.js") : null);
  const roster = root.TeamRosterFoundation
    || (typeof module === "object" && module.exports && typeof require === "function" ? require("./team-roster-foundation.js") : null);
  const api = factory(physical, roster);
  root.DefensiveOpportunityFoundation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Physical, Roster) {
  "use strict";

  const VERSION = "defensive-opportunity-v1";
  const TOPOLOGY_VERSION = "regulation-coarse-zones-v1";
  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze);
    return Object.freeze(value);
  }
  function zone(primaryPosition, secondaryPositions, responsibilityClassification, responsibilityBasis) {
    return { primaryPosition, secondaryPositions, responsibilityClassification, responsibilityBasis };
  }
  // Nominal responsibility, not geometric precision or an execution advantage.
  // Secondary positions are spatial overlap only, never a throw/relay assignment.
  const infieldLine = {
    leftSide: zone("SS", ["3B", "LF"], "coarseAmbiguity", "shallow-left-infield-outfield-overlap"),
    middle: zone("SS", ["2B", "P", "CF"], "coarseAmbiguity", "shallow-middle-infield-outfield-overlap"),
    rightSide: zone("2B", ["1B", "RF"], "coarseAmbiguity", "shallow-right-infield-outfield-overlap")
  };
  const outfield = {
    leftSide: zone("LF", ["CF"], "sharedEdge", "left-outfield-with-center-overlap"),
    middle: zone("CF", ["LF", "RF"], "clear", "center-outfield-primary-with-adjacent-support"),
    rightSide: zone("RF", ["CF"], "sharedEdge", "right-outfield-with-center-overlap")
  };
  const RESPONSIBILITY_TABLE = freeze({
    groundBall: {
      ground: {
        leftSide: zone("SS", ["3B"], "coarseAmbiguity", "left-infield-shortstop-third-overlap"),
        middle: zone("SS", ["2B", "P"], "coarseAmbiguity", "middle-infield-overlap-no-exact-trajectory"),
        rightSide: zone("2B", ["1B"], "coarseAmbiguity", "right-infield-second-first-overlap")
      }
    },
    lineDrive: { shallow: infieldLine, medium: outfield, deep: outfield },
    flyBall: {
      shallow: {
        leftSide: zone("SS", ["3B", "LF"], "coarseAmbiguity", "shallow-left-infield-outfield-overlap"),
        middle: zone("CF", ["SS", "2B"], "coarseAmbiguity", "shallow-center-outfield-infield-overlap"),
        rightSide: zone("2B", ["1B", "RF"], "coarseAmbiguity", "shallow-right-infield-outfield-overlap")
      },
      medium: outfield, deep: outfield
    }
  });

  function deriveDefensiveOpportunity(physicalTruth, topologyVersion = TOPOLOGY_VERSION) {
    const physicalIdentity = typeof physicalTruth?.identity === "string" ? physicalTruth.identity : "";
    const base = {
      version: VERSION,
      identity: `${physicalIdentity}|${VERSION}|${topologyVersion}`,
      physicalIdentity,
      topologyVersion,
      sourceAuthority: "BattedBallPhysicalTruth+canonicalActiveDefense",
      ballContext: null,
      opportunityFamily: "",
      primaryPosition: "", secondaryPositions: [],
      primaryDefenderId: "", secondaryDefenders: [],
      responsibilityClassification: "unsupported", responsibilityBasis: "",
      bindingStatus: "unbound", supported: false, fallbackReason: ""
    };
    if (!Physical || !Roster) return freeze({ ...base, fallbackReason: "authorityUnavailable" });
    if (topologyVersion !== TOPOLOGY_VERSION) return freeze({ ...base, fallbackReason: "unsupportedTopology" });
    const truth = Physical.normalizeBattedBallPhysicalTruth(physicalTruth);
    if (!truth || truth.version !== Physical.VERSION || !physicalIdentity.trim()) {
      return freeze({ ...base, fallbackReason: "invalidPhysicalTruth" });
    }
    const depth = truth.ballType === "groundBall" ? "ground" : truth.depth;
    const rule = RESPONSIBILITY_TABLE[truth.ballType]?.[depth]?.[truth.direction];
    if (!rule) return freeze({ ...base, fallbackReason: "unsupportedPhysicalBin" });
    return freeze({
      ...base,
      ballContext: { ballType: truth.ballType, pace: truth.pace, direction: truth.direction, depth: truth.depth },
      opportunityFamily: `${truth.ballType}SpatialResponsibility`,
      primaryPosition: Roster.normalizePosition(rule.primaryPosition),
      secondaryPositions: rule.secondaryPositions.map(Roster.normalizePosition),
      responsibilityClassification: rule.responsibilityClassification,
      responsibilityBasis: `${TOPOLOGY_VERSION}:${rule.responsibilityBasis}`,
      supported: true
    });
  }

  // Derive afresh against the current lineup. Never cache an actor as position truth.
  function resolveDefensiveOpportunity({ physicalTruth, activeRoster, topologyVersion = TOPOLOGY_VERSION } = {}) {
    const opportunity = deriveDefensiveOpportunity(physicalTruth, topologyVersion);
    if (!opportunity.supported) return opportunity;
    const assignment = Roster.validateActiveDefense(activeRoster);
    if (!assignment.ok) return freeze({ ...opportunity, supported: false, bindingStatus: "invalid",
      fallbackReason: "invalidActiveAssignment", assignmentIssues: assignment.issues.slice() });
    const primary = Roster.getCurrentDefender(activeRoster, opportunity.primaryPosition);
    const secondaryDefenders = opportunity.secondaryPositions.map(position => ({
      position, defenderId: Roster.getCurrentDefender(activeRoster, position)?.id || ""
    }));
    if (!primary || secondaryDefenders.some(actor => !actor.defenderId)) {
      return freeze({ ...opportunity, supported: false, bindingStatus: "invalid", fallbackReason: "activeDefenderUnavailable" });
    }
    return freeze({ ...opportunity, primaryDefenderId: primary.id, secondaryDefenders, bindingStatus: "bound" });
  }

  return freeze({ VERSION, TOPOLOGY_VERSION, RESPONSIBILITY_TABLE, deriveDefensiveOpportunity, resolveDefensiveOpportunity });
});
