(function (root, factory) {
  const api = factory();
  root.ForceAdvancement = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "force-advancement-foundation-v1";
  const BASE_NAMES = Object.freeze(["first", "second", "third", "home"]);

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  function normalizeBases(runners = []) {
    const seen = new Set();
    const bases = runners.slice(0, 3).map(runnerId => {
      const id = runnerId ? String(runnerId) : "";
      if (!id || seen.has(id)) return null;
      seen.add(id);
      return id;
    });
    while (bases.length < 3) bases.push(null);
    return bases;
  }
  function movement(runnerId, originBase, targetBase, chainDepth, forceReason) {
    return deepFreeze({
      runnerId: String(runnerId || ""), actor: originBase === "batter" ? "batterRunner" : "existingRunner",
      originBase, targetBase, isForced: true, forcedMovementTarget: targetBase,
      forceReason, chainDepth
    });
  }
  function buildInitialLiveBallForceChain({ runners = [], batterRunnerId = "batter-runner" } = {}) {
    const sourceBases = normalizeBases(runners);
    const batterRunner = movement(batterRunnerId, "batter", "first", 0, "batterRunnerRequiredToFirst");
    const forcedRunners = [];
    let chainContinues = true;
    for (let index = 0; index < sourceBases.length; index += 1) {
      const runnerId = sourceBases[index];
      if (!chainContinues || !runnerId) {
        chainContinues = false;
        continue;
      }
      forcedRunners.push(movement(
        runnerId,
        index + 1,
        BASE_NAMES[index + 1],
        index + 1,
        index === 0 ? "batterRunnerRequiresFirstBase" : "precedingForcedRunnerRequiresOccupiedBase"
      ));
    }
    const forcedIds = new Set(forcedRunners.map(item => item.runnerId));
    const unforcedRunners = sourceBases.map((runnerId, index) => runnerId && !forcedIds.has(runnerId)
      ? deepFreeze({ runnerId, actor: "existingRunner", originBase: index + 1, isForced: false, forcedMovementTarget: null }) : null).filter(Boolean);
    const allRequiredMovements = [batterRunner, ...forcedRunners];
    return deepFreeze({
      version: VERSION,
      authority: "baseOccupancy+batterRunnerCreation",
      phase: "initialLiveBall",
      sourceBaseState: sourceBases,
      batterRunner,
      forcedRunners,
      unforcedRunners,
      allRequiredMovements,
      forceTargets: Object.fromEntries(allRequiredMovements.map(item => [item.runnerId, item.targetBase])),
      dynamicReassessmentRequired: true
    });
  }
  function getForcedMovement(forceChain, runnerId) {
    return (forceChain?.allRequiredMovements || []).find(item => item.runnerId === runnerId) || null;
  }
  function deriveCompatibilityForceState(forceChain, { outs = 0 } = {}) {
    const sources = forceChain?.sourceBaseState || [null, null, null];
    const forcedOrigins = new Set((forceChain?.forcedRunners || []).map(item => Number(item.originBase)));
    return deepFreeze({
      first: Boolean(sources[0]), second: Boolean(sources[1]), third: Boolean(sources[2]),
      forceAtSecond: forcedOrigins.has(1),
      forceAtThird: forcedOrigins.has(2),
      forceAtHome: forcedOrigins.has(3),
      doublePlayEligible: forcedOrigins.has(1) && Number(outs) < 2,
      forceChainVersion: forceChain?.version || VERSION,
      authority: "initialLiveBallForceChainProjection"
    });
  }
  function settleForceAdvancement({ forceChain, route = "", resultCode = "" } = {}) {
    if (!forceChain) return null;
    const batterId = forceChain.batterRunner.runnerId;
    const runnerAtFirst = forceChain.sourceBaseState[0];
    const outRunnerIds = new Set();
    if (route === "doublePlay") {
      if (["oneOut", "twoOuts"].includes(resultCode) && runnerAtFirst) outRunnerIds.add(runnerAtFirst);
      if (resultCode === "twoOuts") outRunnerIds.add(batterId);
    } else if (route === "secureFirst" && resultCode === "oneOut") {
      outRunnerIds.add(batterId);
    }
    const outcomes = [];
    const addOutcome = (actor, targetBase) => {
      const resolvedTarget = outRunnerIds.has(actor.runnerId) ? "out" : targetBase;
      const numericTarget = BASE_NAMES.indexOf(resolvedTarget);
      outcomes.push(deepFreeze({
        runnerId: actor.runnerId,
        from: actor.originBase,
        to: numericTarget >= 0 && numericTarget < 3 ? numericTarget + 1 : resolvedTarget,
        targetBase: resolvedTarget,
        isForced: actor.isForced === true,
        forceReason: actor.forceReason || ""
      }));
    };
    addOutcome(forceChain.batterRunner, "first");
    forceChain.forcedRunners.forEach(actor => addOutcome(actor, actor.targetBase));
    forceChain.unforcedRunners.forEach(actor => addOutcome(actor, BASE_NAMES[Number(actor.originBase) - 1]));
    const runnersAfter = [null, null, null];
    const scoringRunnerIds = [];
    outcomes.forEach(outcome => {
      if (outcome.targetBase === "out") return;
      if (outcome.targetBase === "home") {
        scoringRunnerIds.push(outcome.runnerId);
        return;
      }
      const baseIndex = BASE_NAMES.indexOf(outcome.targetBase);
      if (baseIndex >= 0 && baseIndex < 3 && !runnersAfter[baseIndex]) runnersAfter[baseIndex] = outcome.runnerId;
    });
    return deepFreeze({
      version: "force-advancement-settlement-v1",
      authority: "actorOutcomesThenBaseOccupancyRebuild",
      runnersAfter,
      runnerChanges: outcomes,
      scoringRunnerIds,
      runsAllowed: scoringRunnerIds.length,
      outRunnerIds: [...outRunnerIds]
    });
  }
  function normalizeForceChain(saved) { return saved && typeof saved === "object" ? deepFreeze(clone(saved)) : null; }

  return deepFreeze({
    VERSION, BASE_NAMES, buildInitialLiveBallForceChain, getForcedMovement,
    deriveCompatibilityForceState, settleForceAdvancement, normalizeForceChain
  });
});
