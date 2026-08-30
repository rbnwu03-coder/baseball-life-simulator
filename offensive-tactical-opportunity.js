(function (root, factory) {
  const api = factory();
  root.OffensiveTacticalOpportunity = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "offensive-tactical-opportunity-v1";
  const ACTIONS = Object.freeze(["standardAttack", "sacrificeBunt", "surpriseBunt", "squeeze", "hitAndRun"]);
  const PRODUCTION_ACTIVE_ACTIONS = Object.freeze(["standardAttack", "sacrificeBunt", "surpriseBunt"]);
  const STATUSES = Object.freeze({ available: "available", irrelevant: "irrelevant", unsupported: "unsupported" });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function createTacticalContext(input = {}) {
    const runners = Array.isArray(input.runners) ? input.runners.slice(0, 3) : [];
    while (runners.length < 3) runners.push(null);
    return deepFreeze({
      inning: Math.max(1, Math.floor(Number(input.inning) || 1)),
      regulationInnings: Math.max(1, Math.floor(Number(input.regulationInnings) || 7)),
      outs: Math.max(0, Math.min(3, Math.floor(Number(input.outs) || 0))),
      runners,
      livePA: input.livePA !== false,
      half: typeof input.half === "string" ? input.half : "",
      offenseTeam: typeof input.offenseTeam === "string" ? input.offenseTeam : "",
      defenseTeam: typeof input.defenseTeam === "string" ? input.defenseTeam : "",
      scoreDifference: Number.isFinite(Number(input.scoreDifference)) ? Number(input.scoreDifference) : 0,
      batterId: typeof input.batterId === "string" ? input.batterId : ""
    });
  }

  function entry(action, status, reasons, constraints = []) {
    return deepFreeze({ action, status, reasons: reasons.slice(), constraints: constraints.slice() });
  }

  function resolveTacticalOpportunity(input = {}) {
    const context = createTacticalContext(input);
    const [first, second, third] = context.runners.map(Boolean);
    const runnerExists = first || second || third;
    const fewerThanTwoOuts = context.outs < 2;
    const entries = [];

    entries.push(context.livePA
      ? entry("standardAttack", STATUSES.available, ["livePlateAppearance", "canonicalFallback"])
      : entry("standardAttack", STATUSES.irrelevant, ["plateAppearanceNotLive"]));

    if (!context.livePA) {
      entries.push(entry("sacrificeBunt", STATUSES.irrelevant, ["plateAppearanceNotLive"]));
    } else if (!runnerExists) {
      entries.push(entry("sacrificeBunt", STATUSES.irrelevant, ["noRunnerToAdvance"]));
    } else if (!fewerThanTwoOuts) {
      entries.push(entry("sacrificeBunt", STATUSES.irrelevant, ["twoOutSacrificeValueAbsent"]));
    } else if (third && !first && !second) {
      entries.push(entry("sacrificeBunt", STATUSES.irrelevant, ["thirdBaseOnlyBelongsToSqueezeFamily"]));
    } else {
      const constraints = [first && second ? "multiRunnerTopologyRequiresExecutionResolver" : ""].filter(Boolean);
      entries.push(entry("sacrificeBunt", STATUSES.available, ["runnerAdvanceAvailable", "fewerThanTwoOuts"], constraints));
    }

    entries.push(context.livePA
      ? entry("surpriseBunt", STATUSES.available, ["livePlateAppearance", runnerExists ? "pressureAvailableWithRunners" : "selfReachPressureAvailable"])
      : entry("surpriseBunt", STATUSES.irrelevant, ["plateAppearanceNotLive"]));

    if (context.livePA && third && fewerThanTwoOuts) {
      entries.push(entry("squeeze", STATUSES.unsupported, ["runnerOnThirdAvailable", "fewerThanTwoOuts", "productionExecutionDeferred"], ["runnerHomeCoordinationDeferred"]));
    } else {
      entries.push(entry("squeeze", STATUSES.irrelevant, [!third ? "runnerOnThirdAbsent" : !fewerThanTwoOuts ? "twoOutSqueezeValueAbsent" : "plateAppearanceNotLive"]));
    }

    if (context.livePA && first) {
      const multiRunner = second || third;
      entries.push(entry("hitAndRun", STATUSES.unsupported, ["runnerOnFirstAvailable", "productionExecutionDeferred"], multiRunner ? ["multiRunnerCoordinationDeferred"] : ["swingConstraintDeferred"]));
    } else {
      entries.push(entry("hitAndRun", STATUSES.irrelevant, [!first ? "runnerOnFirstAbsent" : "plateAppearanceNotLive"]));
    }

    const candidates = entries.filter(item => item.status === STATUSES.available && PRODUCTION_ACTIVE_ACTIONS.includes(item.action)).map(item => item.action);
    if (context.livePA && !candidates.includes("standardAttack")) candidates.unshift("standardAttack");
    return deepFreeze({ version: VERSION, context, entries, candidateActions: candidates });
  }

  return deepFreeze({ VERSION, ACTIONS, PRODUCTION_ACTIVE_ACTIONS, STATUSES, createTacticalContext, resolveTacticalOpportunity });
});
