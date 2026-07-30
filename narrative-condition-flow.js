var NarrativeConditionFlow = (() => {
  const EVENT_EVALUATION_IDS = Object.freeze({
    high_school_scout_feedback:
      "narrative-condition:high_school_scout_feedback"
  });
  const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

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

  function validateNarrativeContext(context) {
    if (!isRecord(context) || hasUnsafeStructure(context)) {
      return failure("Narrative Context 必須是安全的純物件。");
    }

    const contextKeys = validateExactKeys(
      context,
      ["eventId"],
      "Narrative Context"
    );
    if (!contextKeys.ok) return contextKeys;
    if (typeof context.eventId !== "string" || !context.eventId.trim()) {
      return failure("Narrative Context eventId 必須是非空白字串。");
    }

    const evaluationId = EVENT_EVALUATION_IDS[context.eventId];
    if (!evaluationId) {
      return failure(`尚未支援此 Narrative Condition event：${context.eventId}`);
    }

    const eventResolver = globalThis.getEvent;
    if (typeof eventResolver !== "function") {
      return failure("目前無法解析事件。");
    }
    const event = eventResolver(context.eventId);
    if (!event || typeof event.text !== "function") {
      return failure("Narrative Context 對應的既有事件不存在。");
    }

    if (
      typeof NarrativeConditionBoundary !== "object" ||
      typeof NarrativeConditionBoundary.isSupportedEvaluation !== "function" ||
      typeof NarrativeConditionBoundary.getEvaluationSpecification !==
        "function" ||
      !NarrativeConditionBoundary.isSupportedEvaluation(evaluationId)
    ) {
      return failure("目標 Narrative Evaluation 尚未獲得 Boundary 支援。");
    }
    const specification =
      NarrativeConditionBoundary.getEvaluationSpecification(evaluationId);
    if (
      !specification ||
      specification.eventId !== context.eventId ||
      specification.routeType !== "existing-narrative"
    ) {
      return failure("Narrative event 與 evaluation mapping 不一致。");
    }

    return {
      ok: true,
      context: {
        eventId: context.eventId
      }
    };
  }

  function createNarrativeContext(eventId) {
    const validation = validateNarrativeContext({ eventId });
    if (!validation.ok) return validation;
    return {
      ok: true,
      context: deepFreeze(clone(validation.context))
    };
  }

  function createNarrativeEvaluationRequest(context) {
    const validation = validateNarrativeContext(context);
    if (!validation.ok) return validation;

    const evaluationId =
      EVENT_EVALUATION_IDS[validation.context.eventId];
    const specification =
      NarrativeConditionBoundary.getEvaluationSpecification(evaluationId);
    const input =
      NarrativeConditionBoundary.getInputSnapshot(evaluationId);
    if (!specification || !input) {
      return failure("Narrative Evaluation Input 無法使用。");
    }

    const request = {
      source: `event:${validation.context.eventId}`,
      evaluationId,
      context: clone(validation.context),
      expected: {
        [specification.sourceField]: input[specification.sourceField]
      }
    };
    const requestValidation =
      NarrativeConditionBoundary.validateNarrativeEvaluationRequest(request);
    if (!requestValidation.ok) return requestValidation;

    return {
      ok: true,
      request: deepFreeze(clone(requestValidation.request))
    };
  }

  function resolveNarrativeCondition(context) {
    const requestResult = createNarrativeEvaluationRequest(context);
    if (!requestResult.ok) return requestResult;
    return NarrativeConditionBoundary.evaluateNarrativeCondition(
      requestResult.request
    );
  }

  function applyNarrativeCondition(result) {
    if (!isRecord(result) || hasUnsafeStructure(result)) {
      return failure("Narrative Condition Result 必須是安全的純物件。");
    }
    const resultKeys = validateExactKeys(
      result,
      ["ok", "response"],
      "Narrative Condition Result"
    );
    if (!resultKeys.ok) return resultKeys;
    if (result.ok !== true || !isRecord(result.response)) {
      return failure("Narrative Condition Result 尚未成功解析。");
    }

    const responseKeys = validateExactKeys(
      result.response,
      [
        "evaluationId",
        "category",
        "responseId",
        "routeType",
        "matchedCondition"
      ],
      "Narrative Condition Response"
    );
    if (!responseKeys.ok) return responseKeys;

    const specification =
      NarrativeConditionBoundary.getEvaluationSpecification(
        result.response.evaluationId
      );
    if (
      !specification ||
      result.response.responseId !== specification.responseId ||
      result.response.routeType !== specification.routeType
    ) {
      return failure("Narrative Condition 不符合既有 narrative hook。");
    }
    if (!isRecord(result.response.matchedCondition)) {
      return failure("Narrative Condition 缺少既有門檻資訊。");
    }
    const conditionKeys = validateExactKeys(
      result.response.matchedCondition,
      ["field", "operator", "value"],
      "matchedCondition"
    );
    if (!conditionKeys.ok) return conditionKeys;

    const matched =
      result.response.category === specification.matchedCategory;
    const unmatched =
      result.response.category === specification.unmatchedCategory;
    if (!matched && !unmatched) {
      return failure(
        "Narrative Condition category 不符合 evaluation specification。"
      );
    }
    if (
      result.response.matchedCondition.field !== specification.sourceField ||
      result.response.matchedCondition.operator !==
        (matched ? specification.operator : "<") ||
      result.response.matchedCondition.value !== specification.threshold
    ) {
      return failure("Narrative Condition 沒有沿用既有門檻。");
    }

    return deepFreeze({
      ok: true,
      responseId: result.response.responseId,
      category: result.response.category,
      routeType: result.response.routeType
    });
  }

  function getSupportedEventMap() {
    return deepFreeze(clone(EVENT_EVALUATION_IDS));
  }

  const api = Object.freeze({
    createNarrativeContext,
    validateNarrativeContext,
    createNarrativeEvaluationRequest,
    resolveNarrativeCondition,
    applyNarrativeCondition,
    getSupportedEventMap
  });

  if (typeof window !== "undefined") {
    window.NarrativeConditionFlow = api;
  }

  return api;
})();
