var DecisionFlow = (() => {
  const TARGET_EVENT_ID = "chapter2_intro";
  const TARGET_CHOICE_INDEX = 0;
  const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

  function isRecord(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function hasForbiddenKey(value, seen = new WeakSet()) {
    if (!isRecord(value)) return false;
    if (seen.has(value)) return true;
    seen.add(value);

    return Reflect.ownKeys(value).some(key => {
      if (typeof key !== "string") return true;
      if (FORBIDDEN_KEYS.has(key)) return true;
      return hasForbiddenKey(value[key], seen);
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function failure(error) {
    return { ok: false, error };
  }

  function validateDecisionContext(context) {
    if (!isRecord(context)) {
      return failure("Decision Context 必須是物件。");
    }

    if (hasForbiddenKey(context)) {
      return failure("Decision Context 含有禁止或循環的欄位。");
    }

    const invalidKey = Object.keys(context).find(
      key => !["eventId", "choiceIndex"].includes(key)
    );
    if (invalidKey) {
      return failure(`Decision Context 含有未知欄位：${invalidKey}`);
    }

    if (typeof context.eventId !== "string" || context.eventId.trim() === "") {
      return failure("eventId 必須是非空字串。");
    }

    if (!Number.isInteger(context.choiceIndex) || context.choiceIndex < 0) {
      return failure("choiceIndex 必須是大於或等於 0 的整數。");
    }

    const eventResolver = globalThis.getEvent;
    if (typeof eventResolver !== "function") {
      return failure("找不到事件查詢函式。");
    }

    const event = eventResolver(context.eventId.trim());
    if (!event) {
      return failure(`找不到事件：${context.eventId.trim()}`);
    }

    if (!Array.isArray(event.choices)) {
      return failure(`事件沒有可用選項：${context.eventId.trim()}`);
    }

    if (context.choiceIndex >= event.choices.length || !event.choices[context.choiceIndex]) {
      return failure(`choiceIndex 超出事件選項範圍：${context.choiceIndex}`);
    }

    return {
      ok: true,
      context: {
        eventId: context.eventId.trim(),
        choiceIndex: context.choiceIndex
      }
    };
  }

  function createDecisionContext(eventId, choiceIndex) {
    const validation = validateDecisionContext({ eventId, choiceIndex });
    if (!validation.ok) return validation;

    return {
      ok: true,
      context: Object.freeze(clone(validation.context))
    };
  }

  function validateLegacyOutcome(context, legacyOutcome) {
    if (
      context.eventId !== TARGET_EVENT_ID ||
      context.choiceIndex !== TARGET_CHOICE_INDEX
    ) {
      return failure(
        `Phase 4 只批准 ${TARGET_EVENT_ID}:${TARGET_CHOICE_INDEX} 的 Decision Result。`
      );
    }

    if (!isRecord(legacyOutcome) || hasForbiddenKey(legacyOutcome)) {
      return failure("legacyOutcome 必須是安全物件。");
    }

    const keys = Object.keys(legacyOutcome);
    if (
      keys.length !== 1 ||
      keys[0] !== "chapter2Step"
    ) {
      return failure("legacyOutcome 只能包含 chapter2Step。");
    }

    if (
      !Number.isInteger(legacyOutcome.chapter2Step) ||
      legacyOutcome.chapter2Step < 0 ||
      legacyOutcome.chapter2Step > 10000
    ) {
      return failure("chapter2Step 必須是 0 到 10000 的整數。");
    }

    return { ok: true };
  }

  function createDecisionResult(context, legacyOutcome) {
    const contextValidation = validateDecisionContext(context);
    if (!contextValidation.ok) return contextValidation;

    const outcomeValidation = validateLegacyOutcome(
      contextValidation.context,
      legacyOutcome
    );
    if (!outcomeValidation.ok) return outcomeValidation;

    return {
      ok: true,
      decisionResult: {
        source: {
          type: "decision",
          eventId: contextValidation.context.eventId,
          choiceIndex: contextValidation.context.choiceIndex
        },
        currentStateEffects: {
          progressPosition: {
            chapter2Step: legacyOutcome.chapter2Step
          }
        }
      }
    };
  }

  function validateDecisionResult(decisionResult) {
    if (!isRecord(decisionResult) || hasForbiddenKey(decisionResult)) {
      return failure("Decision Result 必須是安全物件。");
    }

    const resultKeys = Object.keys(decisionResult);
    if (
      resultKeys.length !== 2 ||
      !resultKeys.includes("source") ||
      !resultKeys.includes("currentStateEffects")
    ) {
      return failure("Decision Result 只能包含 source 與 currentStateEffects。");
    }

    if (!isRecord(decisionResult.source)) {
      return failure("Decision Result source 格式不正確。");
    }

    const sourceKeys = Object.keys(decisionResult.source);
    if (
      sourceKeys.length !== 3 ||
      !sourceKeys.includes("type") ||
      !sourceKeys.includes("eventId") ||
      !sourceKeys.includes("choiceIndex")
    ) {
      return failure("Decision Result source 欄位不正確。");
    }

    if (decisionResult.source.type !== "decision") {
      return failure("Decision Result source.type 必須是 decision。");
    }

    const contextValidation = validateDecisionContext({
      eventId: decisionResult.source.eventId,
      choiceIndex: decisionResult.source.choiceIndex
    });
    if (!contextValidation.ok) return contextValidation;

    if (
      !isRecord(decisionResult.currentStateEffects) ||
      Object.keys(decisionResult.currentStateEffects).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(
        decisionResult.currentStateEffects,
        "progressPosition"
      )
    ) {
      return failure("Decision Result 只允許 progressPosition effect。");
    }

    const progressPosition = decisionResult.currentStateEffects.progressPosition;
    if (
      !isRecord(progressPosition) ||
      Object.keys(progressPosition).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(progressPosition, "chapter2Step")
    ) {
      return failure("Decision Result 只允許 chapter2Step progress。");
    }

    const outcomeValidation = validateLegacyOutcome(
      contextValidation.context,
      { chapter2Step: progressPosition.chapter2Step }
    );
    if (!outcomeValidation.ok) return outcomeValidation;

    return { ok: true, decisionResult: clone(decisionResult) };
  }

  function createStateChangeRequest(decisionResult) {
    const validation = validateDecisionResult(decisionResult);
    if (!validation.ok) return validation;

    const source = validation.decisionResult.source;
    return {
      ok: true,
      request: {
        source: `decision:${source.eventId}:${source.choiceIndex}`,
        changes: clone(validation.decisionResult.currentStateEffects)
      }
    };
  }

  function applyDecisionStateChange(decisionResult) {
    const requestResult = createStateChangeRequest(decisionResult);
    if (!requestResult.ok) return requestResult;

    return CurrentStateBoundary.applyStateChangeRequest(requestResult.request);
  }

  const api = Object.freeze({
    createDecisionContext,
    validateDecisionContext,
    createDecisionResult,
    createStateChangeRequest,
    applyDecisionStateChange
  });

  if (typeof window !== "undefined") {
    window.DecisionFlow = api;
  }

  return api;
})();
