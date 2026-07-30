var CoachResponseFlow = (() => {
  const TARGET_EVENT_ID = "youth_match_entry";
  const TARGET_EVALUATION_ID = `coach-trust-response:${TARGET_EVENT_ID}`;
  const TARGET_RESPONSE_ID = TARGET_EVENT_ID;
  const ALLOWED_CATEGORIES = Object.freeze(["supportive", "standard"]);
  const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

  function isRecord(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    const objectPrototype = Object.getPrototypeOf(value);
    return objectPrototype === Object.prototype || objectPrototype === null;
  }

  function hasUnsafeStructure(value, seen = new WeakSet()) {
    if (!isRecord(value)) return false;
    if (seen.has(value)) return true;
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
    const keys = Object.keys(value);
    const unknownKey = keys.find(key => !allowedKeys.includes(key));
    if (unknownKey) {
      return failure(`${label} 含有未允許欄位：${unknownKey}`);
    }

    const missingKey = allowedKeys.find(
      key => !Object.prototype.hasOwnProperty.call(value, key)
    );
    if (missingKey) {
      return failure(`${label} 缺少必要欄位：${missingKey}`);
    }

    return { ok: true };
  }

  function validateCoachResponseContext(context) {
    if (!isRecord(context) || hasUnsafeStructure(context)) {
      return failure("Coach Response Context 必須是安全的純物件。");
    }

    const contextKeys = validateExactKeys(
      context,
      ["eventId", "choiceIndex"],
      "Coach Response Context"
    );
    if (!contextKeys.ok) return contextKeys;
    if (context.eventId !== TARGET_EVENT_ID) {
      return failure(`Phase 7 只接管 ${TARGET_EVENT_ID}。`);
    }
    if (context.choiceIndex !== null) {
      return failure("此 Coach Response 不是 choice 觸發，choiceIndex 必須是 null。");
    }

    const eventResolver = globalThis.getEvent;
    if (typeof eventResolver !== "function") {
      return failure("目前無法解析事件。");
    }
    const event = eventResolver(context.eventId);
    if (!event || typeof event.text !== "function") {
      return failure("Coach Response Context 對應的既有事件不存在。");
    }
    if (
      typeof CoachEvaluationBoundary !== "object" ||
      typeof CoachEvaluationBoundary.isSupportedEvaluation !== "function" ||
      !CoachEvaluationBoundary.isSupportedEvaluation(TARGET_EVALUATION_ID)
    ) {
      return failure("目標 Coach Evaluation 尚未獲得 Boundary 支援。");
    }

    return {
      ok: true,
      context: {
        eventId: context.eventId,
        choiceIndex: null
      }
    };
  }

  function createCoachResponseContext(eventId, choiceIndex = null) {
    const validation = validateCoachResponseContext({ eventId, choiceIndex });
    if (!validation.ok) return validation;
    return {
      ok: true,
      context: deepFreeze(clone(validation.context))
    };
  }

  function createCoachEvaluationRequest(context) {
    const validation = validateCoachResponseContext(context);
    if (!validation.ok) return validation;

    const input = CoachEvaluationBoundary.getInputSnapshot();
    const request = {
      source: `event:${validation.context.eventId}`,
      evaluationId: TARGET_EVALUATION_ID,
      context: clone(validation.context),
      expected: {
        coachTrust: input.relationships.coachTrust
      }
    };
    const requestValidation =
      CoachEvaluationBoundary.validateCoachEvaluationRequest(request);
    if (!requestValidation.ok) return requestValidation;

    return {
      ok: true,
      request: deepFreeze(clone(requestValidation.request))
    };
  }

  function resolveCoachResponse(context) {
    const requestResult = createCoachEvaluationRequest(context);
    if (!requestResult.ok) return requestResult;
    return CoachEvaluationBoundary.evaluateCoachResponse(requestResult.request);
  }

  function applyCoachResponse(result) {
    if (!isRecord(result) || hasUnsafeStructure(result)) {
      return failure("Coach Response Result 必須是安全的純物件。");
    }
    const resultKeys = validateExactKeys(result, ["ok", "response"], "Coach Response Result");
    if (!resultKeys.ok) return resultKeys;
    if (result.ok !== true || !isRecord(result.response)) {
      return failure("Coach Response Result 尚未成功解析。");
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
      "Coach Response"
    );
    if (!responseKeys.ok) return responseKeys;
    if (
      result.response.evaluationId !== TARGET_EVALUATION_ID ||
      result.response.responseId !== TARGET_RESPONSE_ID ||
      result.response.routeType !== "existing-narrative" ||
      !ALLOWED_CATEGORIES.includes(result.response.category)
    ) {
      return failure("Coach Response 不符合本次既有 narrative hook。");
    }
    if (!isRecord(result.response.matchedCondition)) {
      return failure("Coach Response 缺少既有門檻資訊。");
    }
    const conditionKeys = validateExactKeys(
      result.response.matchedCondition,
      ["field", "operator", "value"],
      "matchedCondition"
    );
    if (!conditionKeys.ok) return conditionKeys;
    const expectedOperator =
      result.response.category === "supportive" ? ">=" : "<";
    if (
      result.response.matchedCondition.field !== "coachTrust" ||
      result.response.matchedCondition.operator !== expectedOperator ||
      result.response.matchedCondition.value !== 3
    ) {
      return failure("Coach Response 沒有沿用既有 coachTrust 門檻。");
    }

    return deepFreeze({
      ok: true,
      responseId: result.response.responseId,
      category: result.response.category,
      routeType: result.response.routeType
    });
  }

  const api = Object.freeze({
    createCoachResponseContext,
    validateCoachResponseContext,
    createCoachEvaluationRequest,
    resolveCoachResponse,
    applyCoachResponse
  });

  if (typeof window !== "undefined") {
    window.CoachResponseFlow = api;
  }

  return api;
})();
