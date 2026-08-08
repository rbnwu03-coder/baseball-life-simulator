var CareerTransitionProgression = ((runtimeResolver, careerSpineContract) => {
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

  function getRouteLength(routeKey) {
    if (!careerSpineContract || typeof careerSpineContract.getCareerNetwork !== "function") {
      return null;
    }

    let network;
    try {
      network = careerSpineContract.getCareerNetwork();
    } catch (_error) {
      return null;
    }

    const matchingRoutes = Array.isArray(network?.initialRoutes)
      ? network.initialRoutes.filter(route => route.routeKey === routeKey)
      : [];
    if (matchingRoutes.length !== 1) return null;

    const route = matchingRoutes[0];
    const routeLength = (Array.isArray(route.exclusiveEventIds) ? route.exclusiveEventIds.length : 0)
      + (Array.isArray(route.sharedEventIds) ? route.sharedEventIds.length : 0);
    return routeLength > 0 ? routeLength : null;
  }

  function advanceTransition(playerState, completedEventId) {
    if (!playerState || typeof playerState !== "object" || Array.isArray(playerState)) {
      return rejected(
        "transition-progression-state-missing",
        "Adult Transition Progression requires a Player state object.",
        completedEventId
      );
    }

    if (playerState.forcedEventId) {
      return rejected(
        "transition-progression-forced-event-active",
        "A forced event cannot advance the underlying adult transition.",
        completedEventId
      );
    }

    if (!runtimeResolver || typeof runtimeResolver.resolveTransitionRuntime !== "function") {
      return rejected(
        "transition-runtime-resolver-unavailable",
        "Architecture Sprint 4.6 Runtime Resolver is unavailable.",
        completedEventId
      );
    }

    let runtimeResult;
    try {
      runtimeResult = runtimeResolver.resolveTransitionRuntime(playerState);
    } catch (_error) {
      return rejected(
        "transition-runtime-resolution-failed",
        "The current adult transition event could not be resolved.",
        completedEventId
      );
    }

    if (!runtimeResult || runtimeResult.resolved !== true || runtimeResult.status !== "resolved") {
      return rejected(
        "transition-runtime-unresolved",
        "The Player state is not eligible for adult transition progression.",
        completedEventId
      );
    }

    if (typeof completedEventId !== "string" || !completedEventId.trim()) {
      return rejected(
        "transition-completed-event-missing",
        "A completed transition event ID is required.",
        completedEventId
      );
    }

    if (completedEventId !== runtimeResult.eventId) {
      return rejected(
        "transition-completed-event-mismatch",
        "The completed event does not match the currently resolved transition event.",
        completedEventId
      );
    }

    const routeLength = getRouteLength(runtimeResult.routeKey);
    if (!Number.isInteger(routeLength)) {
      return rejected(
        "transition-route-contract-unavailable",
        "The resolved transition route has no unique Contract length.",
        completedEventId
      );
    }

    const previousStep = runtimeResult.transitionStep;
    if (!Number.isInteger(previousStep) || previousStep < 0 || previousStep >= routeLength) {
      return rejected(
        "transition-step-outside-contract",
        "The resolved transition step is outside the Contract route.",
        completedEventId
      );
    }

    if (!canSafelyWriteOwnDataProperty(playerState, "transitionStep")) {
      return rejected(
        "transition-step-not-writable",
        "transitionStep is not a writable own data property.",
        completedEventId
      );
    }

    const nextStep = previousStep + 1;
    const settlementRequired = nextStep === routeLength;
    try {
      playerState.transitionStep = nextStep;
    } catch (_error) {
      return rejected(
        "transition-step-write-failed",
        "transitionStep could not be advanced.",
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

  const api = Object.freeze({ advanceTransition });
  if (typeof window !== "undefined") window.CareerTransitionProgression = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})(
  typeof CareerTransitionRuntimeResolver !== "undefined"
    ? CareerTransitionRuntimeResolver
    : typeof require === "function"
      ? require("./career-transition-runtime-resolver.js")
      : null,
  typeof CareerSpineContract !== "undefined"
    ? CareerSpineContract
    : typeof require === "function"
      ? require("./career-spine-contract.js")
      : null
);
