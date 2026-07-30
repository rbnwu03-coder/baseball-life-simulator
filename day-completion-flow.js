var DayCompletionFlow = (() => {
  const TARGET_EVENT_ID = "night";
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

  function validateDayCompletionContext(context) {
    if (!isRecord(context)) {
      return failure("Day Completion Context 必須是物件。");
    }

    if (hasForbiddenKey(context)) {
      return failure("Day Completion Context 含有禁止或循環的欄位。");
    }

    const keys = Object.keys(context);
    const unknownKey = keys.find(
      key => !["eventId", "choiceIndex"].includes(key)
    );
    if (unknownKey) {
      return failure(`Day Completion Context 含有未知欄位：${unknownKey}`);
    }

    if (typeof context.eventId !== "string" || context.eventId.trim() === "") {
      return failure("eventId 必須是非空字串。");
    }

    if (!Number.isInteger(context.choiceIndex) || context.choiceIndex < 0) {
      return failure("choiceIndex 必須是大於或等於 0 的整數。");
    }

    const normalizedContext = {
      eventId: context.eventId.trim(),
      choiceIndex: context.choiceIndex
    };

    if (
      normalizedContext.eventId !== TARGET_EVENT_ID ||
      normalizedContext.choiceIndex !== TARGET_CHOICE_INDEX
    ) {
      return failure(
        `Phase 5 只批准 ${TARGET_EVENT_ID}:${TARGET_CHOICE_INDEX} 的日結路徑。`
      );
    }

    const eventResolver = globalThis.getEvent;
    if (typeof eventResolver !== "function") {
      return failure("找不到事件查詢函式。");
    }

    const event = eventResolver(normalizedContext.eventId);
    if (!event || !Array.isArray(event.choices)) {
      return failure(`找不到夜晚事件：${normalizedContext.eventId}`);
    }

    const choice = event.choices[normalizedContext.choiceIndex];
    if (!choice) {
      return failure(`choiceIndex 超出事件選項範圍：${normalizedContext.choiceIndex}`);
    }

    if (choice.sleep !== true) {
      return failure("指定選項不是 sleep choice。");
    }

    if (!TimeBoundary.isNight()) {
      return failure("只有 night phase 可以完成一天。");
    }

    return { ok: true, context: normalizedContext };
  }

  function createDayCompletionContext(eventId, choiceIndex) {
    const validation = validateDayCompletionContext({ eventId, choiceIndex });
    if (!validation.ok) return validation;

    return {
      ok: true,
      context: Object.freeze(clone(validation.context))
    };
  }

  function createTimeAdvanceRequest(context) {
    const validation = validateDayCompletionContext(context);
    if (!validation.ok) return validation;

    return TimeBoundary.createNextDayRequest(
      `night-decision:${validation.context.eventId}:${validation.context.choiceIndex}`
    );
  }

  function createStableDayCompletionSnapshot() {
    return Object.freeze(clone(TimeBoundary.getSnapshot()));
  }

  function completeDay(context) {
    const requestResult = createTimeAdvanceRequest(context);
    if (!requestResult.ok) return requestResult;

    const applyResult = TimeBoundary.applyTimeAdvanceRequest(requestResult.request);
    if (!applyResult.ok) return applyResult;

    return {
      ok: true,
      state: applyResult.state,
      stableSnapshot: createStableDayCompletionSnapshot()
    };
  }

  const api = Object.freeze({
    createDayCompletionContext,
    validateDayCompletionContext,
    createTimeAdvanceRequest,
    createStableDayCompletionSnapshot,
    completeDay
  });

  if (typeof window !== "undefined") {
    window.DayCompletionFlow = api;
  }

  return api;
})();
