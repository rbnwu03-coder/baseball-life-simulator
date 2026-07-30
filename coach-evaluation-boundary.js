var CoachEvaluationBoundary = (() => {
  const TARGET_EVENT_ID = "youth_match_entry";
  const TARGET_EVALUATION_ID = `coach-trust-response:${TARGET_EVENT_ID}`;
  const TARGET_RESPONSE_ID = TARGET_EVENT_ID;
  const TRUST_THRESHOLD = 3;
  const MIN_TRUST = 0;
  const MAX_TRUST = 20;
  const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
  const SUPPORTED_EVALUATIONS = Object.freeze([TARGET_EVALUATION_ID]);

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

  function getCoachTrust() {
    if (
      typeof RelationshipBoundary !== "object" ||
      typeof RelationshipBoundary.getRelationship !== "function"
    ) {
      return null;
    }
    return RelationshipBoundary.getRelationship("coachTrust");
  }

  function getInputSnapshot() {
    return deepFreeze({
      relationships: {
        coachTrust: getCoachTrust()
      }
    });
  }

  function getSupportedEvaluationIds() {
    return SUPPORTED_EVALUATIONS.slice();
  }

  function isSupportedEvaluation(evaluationId) {
    return SUPPORTED_EVALUATIONS.includes(evaluationId);
  }

  function validateCoachEvaluationRequest(request) {
    if (!isRecord(request) || hasUnsafeStructure(request)) {
      return failure("Coach Evaluation Request 必須是安全的純物件。");
    }

    const requestKeys = validateExactKeys(
      request,
      ["source", "evaluationId", "context", "expected"],
      "Coach Evaluation Request"
    );
    if (!requestKeys.ok) return requestKeys;

    if (typeof request.source !== "string" || request.source.trim() === "") {
      return failure("source 必須是非空白字串。");
    }
    if (
      typeof request.evaluationId !== "string" ||
      request.evaluationId.trim() === ""
    ) {
      return failure("evaluationId 必須是非空白字串。");
    }

    const evaluationId = request.evaluationId.trim();
    if (!isSupportedEvaluation(evaluationId)) {
      return failure(`不支援的 Coach Evaluation：${evaluationId}`);
    }

    if (!isRecord(request.context)) {
      return failure("context 必須是純物件。");
    }
    const contextKeys = validateExactKeys(
      request.context,
      ["eventId", "choiceIndex"],
      "context"
    );
    if (!contextKeys.ok) return contextKeys;
    if (request.context.eventId !== TARGET_EVENT_ID) {
      return failure(`eventId 必須是 ${TARGET_EVENT_ID}。`);
    }
    if (request.context.choiceIndex !== null) {
      return failure("此 Coach Response 不是 choice 觸發，choiceIndex 必須是 null。");
    }

    if (!isRecord(request.expected)) {
      return failure("expected 必須是純物件。");
    }
    const expectedKeys = validateExactKeys(
      request.expected,
      ["coachTrust"],
      "expected"
    );
    if (!expectedKeys.ok) return expectedKeys;

    const expectedTrust = request.expected.coachTrust;
    if (typeof expectedTrust !== "number" || !Number.isFinite(expectedTrust)) {
      return failure("expected.coachTrust 必須是有限數字。");
    }
    if (expectedTrust < MIN_TRUST || expectedTrust > MAX_TRUST) {
      return failure(
        `expected.coachTrust 必須介於 ${MIN_TRUST} 到 ${MAX_TRUST}。`
      );
    }

    const currentTrust = getCoachTrust();
    if (
      typeof currentTrust !== "number" ||
      !Number.isFinite(currentTrust) ||
      currentTrust < MIN_TRUST ||
      currentTrust > MAX_TRUST
    ) {
      return failure("RelationshipBoundary 的 coachTrust 不是合法正式值。");
    }
    if (currentTrust !== expectedTrust) {
      return failure(
        "expected.coachTrust 與 RelationshipBoundary 的正式值不一致。"
      );
    }

    return {
      ok: true,
      request: deepFreeze(clone({
        source: request.source.trim(),
        evaluationId,
        context: {
          eventId: request.context.eventId,
          choiceIndex: null
        },
        expected: {
          coachTrust: expectedTrust
        }
      }))
    };
  }

  function evaluateCoachResponse(request) {
    const validation = validateCoachEvaluationRequest(request);
    if (!validation.ok) return validation;

    const approved = validation.request;
    const coachTrust = approved.expected.coachTrust;
    const isSupportive = coachTrust >= TRUST_THRESHOLD;

    return deepFreeze({
      ok: true,
      response: {
        evaluationId: approved.evaluationId,
        category: isSupportive ? "supportive" : "standard",
        responseId: TARGET_RESPONSE_ID,
        routeType: "existing-narrative",
        matchedCondition: {
          field: "coachTrust",
          operator: isSupportive ? ">=" : "<",
          value: TRUST_THRESHOLD
        }
      }
    });
  }

  const api = Object.freeze({
    getInputSnapshot,
    validateCoachEvaluationRequest,
    evaluateCoachResponse,
    getSupportedEvaluationIds,
    getCoachTrust,
    isSupportedEvaluation
  });

  if (typeof window !== "undefined") {
    window.CoachEvaluationBoundary = api;
  }

  return api;
})();
