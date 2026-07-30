var EvaluationRegistryBootstrap = (() => {
  let initializationResult = null;

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function failure(error) {
    return deepFreeze({ ok: false, error });
  }

  function collectMetadata() {
    if (
      typeof CoachEvaluationBoundary !== "object" ||
      typeof CoachEvaluationBoundary.getRegistryMetadata !== "function"
    ) {
      return failure("CoachEvaluationBoundary Registry Metadata 無法使用。");
    }
    if (
      typeof NarrativeConditionBoundary !== "object" ||
      typeof NarrativeConditionBoundary.getRegistryMetadata !== "function"
    ) {
      return failure("NarrativeConditionBoundary Registry Metadata 無法使用。");
    }

    return deepFreeze({
      ok: true,
      metadata: [
        ...CoachEvaluationBoundary.getRegistryMetadata(),
        ...NarrativeConditionBoundary.getRegistryMetadata()
      ]
    });
  }

  function metadataMatches(left, right) {
    return (
      left &&
      right &&
      left.evaluationId === right.evaluationId &&
      left.owner === right.owner &&
      left.ownerType === right.ownerType &&
      left.eventId === right.eventId &&
      left.responseId === right.responseId &&
      left.routeType === right.routeType
    );
  }

  function initialize() {
    if (initializationResult?.ok) return initializationResult;
    if (
      typeof EvaluationRegistry !== "object" ||
      typeof EvaluationRegistry.registerEvaluation !== "function"
    ) {
      initializationResult = failure("EvaluationRegistry 無法使用。");
      return initializationResult;
    }

    const collected = collectMetadata();
    if (!collected.ok) {
      initializationResult = collected;
      return initializationResult;
    }

    const currentCount = EvaluationRegistry.getRegisteredCount();
    if (currentCount > 0) {
      const existingIds = EvaluationRegistry.getEvaluationIds();
      const compatible =
        currentCount === collected.metadata.length &&
        collected.metadata.every((metadata, index) => {
          return (
            existingIds[index] === metadata.evaluationId &&
            metadataMatches(
              EvaluationRegistry.findEvaluation(metadata.evaluationId),
              metadata
            )
          );
        });
      initializationResult = compatible
        ? deepFreeze({
            ok: true,
            count: currentCount,
            evaluationIds: EvaluationRegistry.getEvaluationIds()
          })
        : failure("EvaluationRegistry 已包含不相容的初始化資料。");
      return initializationResult;
    }

    for (const metadata of collected.metadata) {
      const registration = EvaluationRegistry.registerEvaluation(metadata);
      if (!registration.ok) {
        initializationResult = registration;
        return initializationResult;
      }
    }

    initializationResult = deepFreeze({
      ok: true,
      count: EvaluationRegistry.getRegisteredCount(),
      evaluationIds: EvaluationRegistry.getEvaluationIds()
    });
    return initializationResult;
  }

  function getInitializationResult() {
    return initializationResult;
  }

  const api = Object.freeze({
    initialize,
    getInitializationResult
  });

  const result = initialize();
  if (!result.ok) {
    throw new Error(result.error);
  }

  if (typeof window !== "undefined") {
    window.EvaluationRegistryBootstrap = api;
  }

  return api;
})();
