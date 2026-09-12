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
  function buildMovementIntents(forceChain, runnerContext = []) {
    if (!forceChain) return [];
    return deepFreeze([...forceChain.allRequiredMovements, ...forceChain.unforcedRunners].map(actor => {
      const context = runnerContext.find(item => item?.runnerId === actor.runnerId);
      const committed = actor.isForced === true || ["committed", "advancing"].includes(context?.movementProgress);
      return { runnerId: actor.runnerId, originBase: actor.originBase,
        targetBase: actor.isForced ? actor.targetBase : committed ? context.targetBase : BASE_NAMES[Number(actor.originBase) - 1],
        forced: actor.isForced === true, movementRequired: actor.isForced === true, committed };
    }));
  }
  function classifyContinuationTarget(forceChain, runnerId, targetBase) {
    const actor = getForcedMovement(forceChain, runnerId);
    const forceAvailable = Boolean(actor && actor.targetBase === targetBase);
    return deepFreeze({ runnerId, targetBase, forceAvailable, tagRequired: !forceAvailable,
      classification: forceAvailable ? "forceOutAvailable" : "noForceOut" });
  }
  function settleForceAdvancement({ forceChain, route = "", resultCode = "", movementIntents, retirements: suppliedRetirements } = {}) {
    if (!forceChain) return null;
    const batterId = forceChain.batterRunner.runnerId;
    const runnerAtFirst = forceChain.sourceBaseState[0];
    const intents = movementIntents || buildMovementIntents(forceChain);
    const actors = [...forceChain.allRequiredMovements, ...forceChain.unforcedRunners];
    if (intents.length !== actors.length || new Set(intents.map(actor => actor.runnerId)).size !== actors.length
      || intents.some(intent => !actors.some(actor => actor.runnerId === intent.runnerId && actor.originBase === intent.originBase)
        || !BASE_NAMES.includes(intent.targetBase))) throw new Error("Incomplete runner movement identities");
    const candidates = [];
    const retire = (runnerId, targetBase, outType) => { if (runnerId) candidates.push({ runnerId, targetBase, outType, sequence: candidates.length + 1 }); };
    if (suppliedRetirements) candidates.push(...clone(suppliedRetirements));
    else if (route === "doublePlay") {
      if (["oneOut", "twoOuts"].includes(resultCode)) retire(runnerAtFirst, "second", "force");
      if (resultCode === "twoOuts") retire(batterId, "first", "batterRunnerBeforeFirst");
    } else if (resultCode === "oneOut") {
      if (route === "secureFirst") retire(batterId, "first", "batterRunnerBeforeFirst");
      if (route === "forceSecond") retire(runnerAtFirst, "second", "force");
      if (route === "forceThird") retire(forceChain.sourceBaseState[1], "third", "force");
      if (route === "forceHome") retire(forceChain.sourceBaseState[2], "home", "force");
      if (route === "tagHome") retire(forceChain.sourceBaseState[2], "home", "nonForceTag");
    }
    const outRunnerIds = new Set();
    let liveForce = forceChain;
    const retirements = [], continuationClassifications = [];
    for (const candidate of candidates) {
      if (!intents.some(actor => actor.runnerId === candidate.runnerId) || outRunnerIds.has(candidate.runnerId)) throw new Error("Invalid retirement identity");
      if (candidate.sequence !== retirements.length + continuationClassifications.length + 1) throw new Error("Invalid retirement sequence");
      const legality = classifyContinuationTarget(liveForce, candidate.runnerId, candidate.targetBase);
      if (candidate.outType === "force" && !legality.forceAvailable) {
        continuationClassifications.push({ ...legality, sequence: candidate.sequence });
        continue;
      }
      if (!["force", "batterRunnerBeforeFirst", "nonForceTag"].includes(candidate.outType)
        || (candidate.outType === "batterRunnerBeforeFirst" && (candidate.runnerId !== batterId || candidate.targetBase !== "first"))) throw new Error("Invalid retirement type");
      outRunnerIds.add(candidate.runnerId);
      liveForce = deriveForceChainAfterRetirements(liveForce, [candidate.runnerId]);
      retirements.push({ ...candidate, forceTargetsAfter: clone(liveForce.forceTargets) });
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
        isForced: actor.forced === true,
        movementRequired: actor.movementRequired, committed: actor.committed,
        retired: resolvedTarget === "out", safe: resolvedTarget !== "out", scored: resolvedTarget === "home",
        forceReason: getForcedMovement(forceChain, actor.runnerId)?.forceReason || ""
      }));
    };
    // Initial committed movement survives removal of the force; retirement overrides it.
    intents.forEach(actor => addOutcome(actor, actor.targetBase));
    const runnersAfter = [null, null, null];
    const scoringRunnerIds = [];
    outcomes.forEach(outcome => {
      if (outcome.targetBase === "out") return;
      if (outcome.targetBase === "home") {
        scoringRunnerIds.push(outcome.runnerId);
        return;
      }
      const baseIndex = BASE_NAMES.indexOf(outcome.targetBase);
      if (baseIndex < 0 || baseIndex > 2 || runnersAfter[baseIndex]) throw new Error("Unresolved runner destination collision");
      runnersAfter[baseIndex] = outcome.runnerId;
    });
    return deepFreeze({
      version: "force-advancement-settlement-v1",
      authority: "actorOutcomesThenBaseOccupancyRebuild",
      runnersAfter,
      runnerChanges: outcomes,
      scoringRunnerIds,
      runsAllowed: scoringRunnerIds.length,
      outRunnerIds: [...outRunnerIds], outsCreated: outRunnerIds.size,
      initialForceChain: forceChain, movementIntents: clone(intents), retirements,
      forceChainAfterRetirements: liveForce, continuationClassifications,
      survivors: outcomes.filter(actor => !actor.retired)
    });
  }
  function normalizeForceChain(saved) { return saved && typeof saved === "object" ? deepFreeze(clone(saved)) : null; }

  function deriveForceChainAfterRetirements(forceChain, retiredRunnerIds = []) {
    if (!forceChain) return null;
    if (forceChain.version !== VERSION || !Array.isArray(forceChain.allRequiredMovements)) throw new Error("Invalid force chain continuation");
    const retired = new Set([...(forceChain.retiredRunnerIds || []), ...retiredRunnerIds]);
    const initial = forceChain.initialRequiredMovements || forceChain.allRequiredMovements;
    // Retiring a trailing forced actor removes the force on actors ahead of that actor.
    // Retiring a lead actor does not remove the batter-runner's requirement to reach first.
    const breakDepth = Math.min(Infinity, ...initial.filter(actor => retired.has(actor.runnerId)).map(actor => actor.chainDepth));
    const remaining = initial.filter(actor => !retired.has(actor.runnerId) && actor.chainDepth < breakDepth);
    return deepFreeze({ ...clone(forceChain), phase: "afterRetirement", authority: "canonicalForceChainRetirementProjection",
      initialRequiredMovements: clone(initial), retiredRunnerIds: [...retired],
      batterRunner: remaining.find(actor => actor.originBase === "batter") || null,
      forcedRunners: remaining.filter(actor => actor.originBase !== "batter"), allRequiredMovements: remaining,
      forceTargets: Object.fromEntries(remaining.map(actor => [actor.runnerId, actor.targetBase])),
      unforcedRunners: [...(forceChain.unforcedRunners || []).filter(actor => !retired.has(actor.runnerId)),
        ...initial.filter(actor => !retired.has(actor.runnerId) && actor.chainDepth >= breakDepth)
          .map(actor => ({ runnerId: actor.runnerId, originBase: actor.originBase, isForced: false, forcedMovementTarget: null }))]
        .filter((actor, index, all) => all.findIndex(other => other.runnerId === actor.runnerId) === index) });
  }

  return deepFreeze({
    VERSION, BASE_NAMES, buildInitialLiveBallForceChain, getForcedMovement,
    deriveCompatibilityForceState, settleForceAdvancement, normalizeForceChain, deriveForceChainAfterRetirements,
    buildMovementIntents, classifyContinuationTarget
  });
});
