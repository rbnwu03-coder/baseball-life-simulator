var EvaluationRegistry = (() => {
  const METADATA_FIELDS = Object.freeze([
    "evaluationId",
    "owner",
    "ownerType",
    "eventId",
    "responseId",
    "routeType"
  ]);
  const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
  const registry = new Map();
  const registrationOrder = [];

  function isRecord(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    const objectPrototype = Object.getPrototypeOf(value);
    return objectPrototype === Object.prototype || objectPrototype === null;
  }

  function hasUnsafeStructure(value, seen = new WeakSet()) {
    if (value === null || typeof value !== "object") return false;
    if (!isRecord(value) || seen.has(value)) return true;
    seen.add(value);

    return Reflect.ownKeys(value).some(key => {
      if (typeof key !== "string" || FORBIDDEN_KEYS.has(key)) return true;
      return hasUnsafeStructure(value[key], seen);
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function failure(error) {
    return { ok: false, error };
  }

  function validateMetadata(metadata) {
    if (!isRecord(metadata) || hasUnsafeStructure(metadata)) {
      return failure("Evaluation Registry Metadata 必須是安全的純物件。");
    }

    const keys = Reflect.ownKeys(metadata);
    const unknownKey = keys.find(
      key => typeof key !== "string" || !METADATA_FIELDS.includes(key)
    );
    if (unknownKey !== undefined) {
      return failure(
        `Evaluation Registry Metadata 含有未允許欄位：${String(unknownKey)}`
      );
    }

    const missingKey = METADATA_FIELDS.find(
      key => !Object.prototype.hasOwnProperty.call(metadata, key)
    );
    if (missingKey) {
      return failure(
        `Evaluation Registry Metadata 缺少必要欄位：${missingKey}`
      );
    }

    for (const field of METADATA_FIELDS) {
      if (typeof metadata[field] !== "string" || !metadata[field].trim()) {
        return failure(
          `Evaluation Registry Metadata.${field} 必須是非空白字串。`
        );
      }
    }

    return {
      ok: true,
      metadata: deepFreeze({
        evaluationId: metadata.evaluationId.trim(),
        owner: metadata.owner.trim(),
        ownerType: metadata.ownerType.trim(),
        eventId: metadata.eventId.trim(),
        responseId: metadata.responseId.trim(),
        routeType: metadata.routeType.trim()
      })
    };
  }

  function registerEvaluation(metadata) {
    const validation = validateMetadata(metadata);
    if (!validation.ok) return validation;

    const approved = validation.metadata;
    if (registry.has(approved.evaluationId)) {
      return failure(
        `Evaluation Registry 已登錄 evaluationId：${approved.evaluationId}`
      );
    }

    const stored = deepFreeze(clone(approved));
    registry.set(stored.evaluationId, stored);
    registrationOrder.push(stored.evaluationId);

    return deepFreeze({
      ok: true,
      evaluationId: stored.evaluationId
    });
  }

  function getEvaluationIds() {
    return deepFreeze(registrationOrder.slice());
  }

  function isSupportedEvaluation(evaluationId) {
    return (
      typeof evaluationId === "string" &&
      Boolean(evaluationId.trim()) &&
      registry.has(evaluationId)
    );
  }

  function findEvaluation(evaluationId) {
    if (!isSupportedEvaluation(evaluationId)) return null;
    return deepFreeze(clone(registry.get(evaluationId)));
  }

  function findByEvent(eventId) {
    if (typeof eventId !== "string" || !eventId.trim()) {
      return deepFreeze([]);
    }

    const matches = registrationOrder
      .map(evaluationId => registry.get(evaluationId))
      .filter(metadata => metadata.eventId === eventId)
      .map(clone);
    return deepFreeze(matches);
  }

  function getRegisteredCount() {
    return registry.size;
  }

  const api = Object.freeze({
    registerEvaluation,
    getEvaluationIds,
    isSupportedEvaluation,
    findEvaluation,
    findByEvent,
    getRegisteredCount
  });

  if (typeof window !== "undefined") {
    window.EvaluationRegistry = api;
  }

  return api;
})();
