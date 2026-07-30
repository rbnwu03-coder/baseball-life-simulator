var TimeBoundary = (() => {
  const OPERATION = "advance-to-next-day";
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

  function getSnapshot() {
    return clone({
      day: player.day,
      phase: player.phase
    });
  }

  function isNight() {
    return getSnapshot().phase === "night";
  }

  function canAdvanceToNextDay() {
    const snapshot = getSnapshot();
    return (
      Number.isInteger(snapshot.day) &&
      snapshot.day >= 1 &&
      snapshot.day < 36500 &&
      snapshot.phase === "night"
    );
  }

  function validateExactKeys(value, allowedKeys, label) {
    const keys = Object.keys(value);
    const unknownKey = keys.find(key => !allowedKeys.includes(key));
    if (unknownKey) {
      return failure(`${label} 含有未知欄位：${unknownKey}`);
    }

    const missingKey = allowedKeys.find(
      key => !Object.prototype.hasOwnProperty.call(value, key)
    );
    if (missingKey) {
      return failure(`${label} 缺少必要欄位：${missingKey}`);
    }

    return { ok: true };
  }

  function validateTimeAdvanceRequest(request) {
    if (!isRecord(request)) {
      return failure("Time Advance Request 必須是物件。");
    }

    if (hasForbiddenKey(request)) {
      return failure("Time Advance Request 含有禁止或循環的欄位。");
    }

    const requestKeys = validateExactKeys(
      request,
      ["source", "operation", "expected", "next"],
      "Time Advance Request"
    );
    if (!requestKeys.ok) return requestKeys;

    if (typeof request.source !== "string" || request.source.trim() === "") {
      return failure("source 必須是非空字串。");
    }

    if (request.operation !== OPERATION) {
      return failure(`operation 必須是 ${OPERATION}。`);
    }

    if (!isRecord(request.expected)) {
      return failure("expected 必須是物件。");
    }
    const expectedKeys = validateExactKeys(
      request.expected,
      ["day", "phase"],
      "expected"
    );
    if (!expectedKeys.ok) return expectedKeys;

    if (
      !Number.isInteger(request.expected.day) ||
      request.expected.day < 1 ||
      request.expected.day >= 36500
    ) {
      return failure("expected.day 必須是 1 到 36499 的整數。");
    }

    if (request.expected.phase !== "night") {
      return failure("expected.phase 必須是 night。");
    }

    if (!isRecord(request.next)) {
      return failure("next 必須是物件。");
    }
    const nextKeys = validateExactKeys(request.next, ["day", "phase"], "next");
    if (!nextKeys.ok) return nextKeys;

    if (request.next.day !== request.expected.day + 1) {
      return failure("next.day 必須等於 expected.day + 1。");
    }

    if (request.next.phase !== "morning") {
      return failure("next.phase 必須是 morning。");
    }

    const current = getSnapshot();
    if (
      current.day !== request.expected.day ||
      current.phase !== request.expected.phase
    ) {
      return failure("expected 與目前 Time State 不一致。");
    }

    return {
      ok: true,
      request: clone({
        source: request.source.trim(),
        operation: request.operation,
        expected: request.expected,
        next: request.next
      })
    };
  }

  function createNextDayRequest(source) {
    const snapshot = getSnapshot();
    const request = {
      source,
      operation: OPERATION,
      expected: {
        day: snapshot.day,
        phase: snapshot.phase
      },
      next: {
        day: snapshot.day + 1,
        phase: "morning"
      }
    };
    const validation = validateTimeAdvanceRequest(request);
    if (!validation.ok) return validation;
    return { ok: true, request: validation.request };
  }

  function applyTimeAdvanceRequest(request) {
    const validation = validateTimeAdvanceRequest(request);
    if (!validation.ok) return validation;

    return CurrentStateBoundary.applyStateChangeRequest({
      source: validation.request.source,
      changes: {
        day: validation.request.next.day,
        phase: validation.request.next.phase
      }
    });
  }

  const api = Object.freeze({
    getSnapshot,
    isNight,
    canAdvanceToNextDay,
    validateTimeAdvanceRequest,
    createNextDayRequest,
    applyTimeAdvanceRequest
  });

  if (typeof window !== "undefined") {
    window.TimeBoundary = api;
  }

  return api;
})();
