var NarrativeConditionBoundary = (() => {
  const MIN_SCOUT_EVALUATION = 0;
  const MAX_SCOUT_EVALUATION = 20;
  const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
  const EVALUATION_SPECIFICATIONS = Object.freeze({
    "narrative-condition:high_school_scout_feedback": Object.freeze({
      eventId: "high_school_scout_feedback",
      sourceField: "scoutEvaluation",
      operator: ">=",
      threshold: 3,
      matchedCategory: "recognized",
      unmatchedCategory: "uncertain",
      responseId: "high_school_scout_feedback",
      routeType: "existing-narrative"
    })
  });
  const SUPPORTED_EVALUATIONS = Object.freeze(
    Object.keys(EVALUATION_SPECIFICATIONS)
  );

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

  function validateExactKeys(value, allowedKeys, label) {
    const keys = Reflect.ownKeys(value);
    const unknownKey = keys.find(
      key => typeof key !== "string" || !allowedKeys.includes(key)
    );
    if (unknownKey !== undefined) {
      return failure(`${label} 含有未允許欄位：${String(unknownKey)}`);
    }

    const missingKey = allowedKeys.find(
      key => !Object.prototype.hasOwnProperty.call(value, key)
    );
    if (missingKey) {
      return failure(`${label} 缺少必要欄位：${missingKey}`);
    }

    return { ok: true };
  }

  function getSupportedEvaluationIds() {
    return deepFreeze(clone(SUPPORTED_EVALUATIONS));
  }

  function isSupportedEvaluation(evaluationId) {
    return (
      typeof evaluationId === "string" &&
      Object.prototype.hasOwnProperty.call(
        EVALUATION_SPECIFICATIONS,
        evaluationId
      )
    );
  }

  function getEvaluationSpecification(evaluationId) {
    const specification = EVALUATION_SPECIFICATIONS[evaluationId];
    return specification ? deepFreeze(clone(specification)) : null;
  }

  function getFormalSourceValue(specification) {
    if (
      typeof PlayerDataBoundary !== "object" ||
      typeof PlayerDataBoundary.getSnapshot !== "function"
    ) {
      return undefined;
    }

    const snapshot = PlayerDataBoundary.getSnapshot();
    return snapshot?.[specification.sourceField];
  }

  function getInputSnapshot(evaluationId) {
    const specification = EVALUATION_SPECIFICATIONS[evaluationId];
    if (!specification) return null;

    const value = getFormalSourceValue(specification);
    return deepFreeze({
      [specification.sourceField]: value
    });
  }

  function validateNarrativeEvaluationRequest(request) {
    if (!isRecord(request) || hasUnsafeStructure(request)) {
      return failure("Narrative Evaluation Request 必須是安全的純物件。");
    }

    const requestKeys = validateExactKeys(
      request,
      ["source", "evaluationId", "context", "expected"],
      "Narrative Evaluation Request"
    );
    if (!requestKeys.ok) return requestKeys;

    if (typeof request.source !== "string" || !request.source.trim()) {
      return failure("source 必須是非空白字串。");
    }
    if (
      typeof request.evaluationId !== "string" ||
      !isSupportedEvaluation(request.evaluationId)
    ) {
      return failure(`不支援的 Narrative Evaluation：${request.evaluationId}`);
    }

    const specification =
      EVALUATION_SPECIFICATIONS[request.evaluationId];

    if (!isRecord(request.context)) {
      return failure("context 必須是安全的純物件。");
    }
    const contextKeys = validateExactKeys(
      request.context,
      ["eventId"],
      "context"
    );
    if (!contextKeys.ok) return contextKeys;
    if (
      typeof request.context.eventId !== "string" ||
      request.context.eventId !== specification.eventId
    ) {
      return failure("context.eventId 與 Evaluation Specification 不一致。");
    }
    if (request.source.trim() !== `event:${specification.eventId}`) {
      return failure("source 必須與 context.eventId 一致。");
    }

    if (!isRecord(request.expected)) {
      return failure("expected 必須是安全的純物件。");
    }
    const expectedKeys = validateExactKeys(
      request.expected,
      [specification.sourceField],
      "expected"
    );
    if (!expectedKeys.ok) return expectedKeys;

    const expectedValue = request.expected[specification.sourceField];
    if (typeof expectedValue !== "number" || !Number.isFinite(expectedValue)) {
      return failure(
        `expected.${specification.sourceField} 必須是有限數字。`
      );
    }
    if (
      expectedValue < MIN_SCOUT_EVALUATION ||
      expectedValue > MAX_SCOUT_EVALUATION
    ) {
      return failure(
        `expected.${specification.sourceField} 必須介於 ${MIN_SCOUT_EVALUATION} 到 ${MAX_SCOUT_EVALUATION}。`
      );
    }

    const currentValue = getFormalSourceValue(specification);
    if (
      typeof currentValue !== "number" ||
      !Number.isFinite(currentValue) ||
      currentValue < MIN_SCOUT_EVALUATION ||
      currentValue > MAX_SCOUT_EVALUATION
    ) {
      return failure(
        `PlayerDataBoundary 的 ${specification.sourceField} 不是合法正式值。`
      );
    }
    if (currentValue !== expectedValue) {
      return failure(
        `expected.${specification.sourceField} 與 PlayerDataBoundary 的正式值不一致。`
      );
    }

    return {
      ok: true,
      request: deepFreeze(clone({
        source: request.source.trim(),
        evaluationId: request.evaluationId,
        context: {
          eventId: request.context.eventId
        },
        expected: {
          [specification.sourceField]: expectedValue
        }
      }))
    };
  }

  function evaluateNarrativeCondition(request) {
    const validation = validateNarrativeEvaluationRequest(request);
    if (!validation.ok) return validation;

    const approved = validation.request;
    const specification =
      EVALUATION_SPECIFICATIONS[approved.evaluationId];
    const sourceValue =
      approved.expected[specification.sourceField];
    const matched = sourceValue >= specification.threshold;

    return deepFreeze({
      ok: true,
      response: {
        evaluationId: approved.evaluationId,
        category: matched
          ? specification.matchedCategory
          : specification.unmatchedCategory,
        responseId: specification.responseId,
        routeType: specification.routeType,
        matchedCondition: {
          field: specification.sourceField,
          operator: matched ? specification.operator : "<",
          value: specification.threshold
        }
      }
    });
  }

  const api = Object.freeze({
    getInputSnapshot,
    getSupportedEvaluationIds,
    isSupportedEvaluation,
    getEvaluationSpecification,
    validateNarrativeEvaluationRequest,
    evaluateNarrativeCondition
  });

  if (typeof window !== "undefined") {
    window.NarrativeConditionBoundary = api;
  }

  return api;
})();
