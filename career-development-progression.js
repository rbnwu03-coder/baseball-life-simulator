var CareerDevelopmentProgression = ((runtimeResolver, careerSpineContract) => {
  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function rejected(code, message, completedEventId) {
    return deepFreeze({
      status: "rejected",
      advanced: false,
      routeKey: null,
      completedEventId: clone(completedEventId),
      previousStep: null,
      nextStep: null,
      settlementRequired: false,
      issues: [{ code, message }]
    });
  }

  function canSafelyWriteOwnDataProperty(target, key) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(target, key);
      return !!descriptor
        && Object.prototype.hasOwnProperty.call(descriptor, "value")
        && descriptor.writable === true;
    } catch (_error) {
      return false;
    }
  }

  function getDevelopmentContract(runtimeResult) {
    if (!careerSpineContract || typeof careerSpineContract.getCareerNetwork !== "function") {
      return null;
    }

    let network;
    try {
      network = careerSpineContract.getCareerNetwork();
    } catch (_error) {
      return null;
    }

    const matchingNodes = Array.isArray(network?.adultNodes)
      ? network.adultNodes.filter(node => node.networkRole === "shared-development")
      : [];
    const developmentNode = matchingNodes.length === 1 ? matchingNodes[0] : null;
    const progress = developmentNode?.progress;
    const sharedDevelopment = network?.sharedDevelopment;
    const eventIds = Array.isArray(sharedDevelopment?.eventIds)
      ? sharedDevelopment.eventIds
      : [];

    if (
      !developmentNode || developmentNode.nodeId !== runtimeResult.nodeId ||
      sharedDevelopment?.nodeId !== developmentNode.nodeId ||
      !progress || progress.field !== "developmentStep" ||
      !Number.isInteger(progress.min) || !Number.isInteger(progress.max) ||
      progress.max < progress.min ||
      eventIds.length !== progress.max - progress.min + 1 ||
      eventIds.some(eventId => typeof eventId !== "string" || !eventId.trim())
    ) return null;

    return {
      min: progress.min,
      max: progress.max,
      eventCount: eventIds.length
    };
  }

  function advanceDevelopment(playerState, completedEventId) {
    if (!playerState || typeof playerState !== "object" || Array.isArray(playerState)) {
      return rejected(
        "development-progression-state-missing",
        "Development Years Progression requires a Player state object.",
        completedEventId
      );
    }

    if (playerState.forcedEventId) {
      return rejected(
        "development-progression-forced-event-active",
        "A forced event cannot advance the underlying Development Years event.",
        completedEventId
      );
    }

    if (!runtimeResolver || typeof runtimeResolver.resolveDevelopmentRuntime !== "function") {
      return rejected(
        "development-runtime-resolver-unavailable",
        "Architecture Sprint 4.8 Development Runtime Resolver is unavailable.",
        completedEventId
      );
    }

    let runtimeResult;
    try {
      runtimeResult = runtimeResolver.resolveDevelopmentRuntime(playerState);
    } catch (_error) {
      return rejected(
        "development-runtime-resolution-failed",
        "The current Development Years event could not be resolved.",
        completedEventId
      );
    }

    if (!runtimeResult || runtimeResult.resolved !== true || runtimeResult.status !== "resolved") {
      return rejected(
        "development-runtime-unresolved",
        "The Player state is not eligible for Development Years progression.",
        completedEventId
      );
    }

    if (typeof completedEventId !== "string" || !completedEventId.trim()) {
      return rejected(
        "development-completed-event-missing",
        "A completed Development Years event ID is required.",
        completedEventId
      );
    }

    if (completedEventId !== runtimeResult.eventId) {
      return rejected(
        "development-completed-event-mismatch",
        "The completed event does not match the currently resolved Development Years event.",
        completedEventId
      );
    }

    const contract = getDevelopmentContract(runtimeResult);
    if (!contract) {
      return rejected(
        "development-progression-contract-inconsistent",
        "The Development Years progress range and shared event topology are inconsistent.",
        completedEventId
      );
    }

    const previousStep = runtimeResult.developmentStep;
    if (
      !Number.isInteger(previousStep) ||
      previousStep < contract.min ||
      previousStep > contract.max
    ) {
      return rejected(
        "development-step-outside-contract",
        "The resolved Development Years step is outside the Contract range.",
        completedEventId
      );
    }

    if (!canSafelyWriteOwnDataProperty(playerState, "developmentStep")) {
      return rejected(
        "development-step-not-writable",
        "developmentStep is not a writable own data property.",
        completedEventId
      );
    }

    const nextStep = previousStep + 1;
    const settlementStep = contract.min + contract.eventCount;
    const settlementRequired = nextStep === settlementStep;
    if (nextStep > settlementStep) {
      return rejected(
        "development-next-step-outside-contract",
        "The next Development Years step would exceed the Contract.",
        completedEventId
      );
    }

    try {
      const written = Reflect.set(playerState, "developmentStep", nextStep, playerState);
      if (!written || playerState.developmentStep !== nextStep) {
        return rejected(
          "development-step-write-failed",
          "developmentStep could not be advanced.",
          completedEventId
        );
      }
    } catch (_error) {
      return rejected(
        "development-step-write-failed",
        "developmentStep could not be advanced.",
        completedEventId
      );
    }

    return deepFreeze({
      status: "advanced",
      advanced: true,
      routeKey: runtimeResult.routeKey,
      completedEventId,
      previousStep,
      nextStep,
      settlementRequired,
      issues: []
    });
  }

  const api = Object.freeze({ advanceDevelopment });
  if (typeof window !== "undefined") window.CareerDevelopmentProgression = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})(
  typeof CareerDevelopmentRuntimeResolver !== "undefined"
    ? CareerDevelopmentRuntimeResolver
    : typeof require === "function"
      ? require("./career-development-runtime-resolver.js")
      : null,
  typeof CareerSpineContract !== "undefined"
    ? CareerSpineContract
    : typeof require === "function"
      ? require("./career-spine-contract.js")
      : null
);
