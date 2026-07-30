var CurrentStateBoundary = (() => {
  const CURRENT_STATE_FIELDS = [
    "chapter",
    "day",
    "phase",
    "completed",
    "lastEventTitle"
  ];
  const APPROVED_PROGRESS_FIELDS = ["chapter2Step"];
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

  function getProgressPosition() {
    return {
      chapter2Step: Number.isInteger(player.chapter2Step)
        ? player.chapter2Step
        : 0
    };
  }

  function getCurrentEventIdFromRuntime() {
    const resolver = globalThis.getCurrentEventId;
    return typeof resolver === "function" ? resolver() : null;
  }

  function getSnapshot() {
    return clone({
      chapter: player.chapter,
      day: player.day,
      phase: player.phase,
      completed: player.completed,
      lastEventTitle: player.lastEventTitle,
      progressPosition: getProgressPosition(),
      currentEventId: getCurrentEventIdFromRuntime()
    });
  }

  function failure(error) {
    return { ok: false, error };
  }

  function validateProgressPosition(progressPosition) {
    if (!isRecord(progressPosition)) {
      return failure("progressPosition 必須是物件。");
    }

    if (hasForbiddenKey(progressPosition)) {
      return failure("progressPosition 含有禁止的欄位名稱。");
    }

    const keys = Object.keys(progressPosition);
    if (keys.length === 0) {
      return failure("progressPosition 至少需要一個變更欄位。");
    }

    const invalidKey = keys.find(key => !APPROVED_PROGRESS_FIELDS.includes(key));
    if (invalidKey) {
      return failure(`不允許更新進度欄位：${invalidKey}`);
    }

    if (
      Object.prototype.hasOwnProperty.call(progressPosition, "chapter2Step") &&
      (
        !Number.isInteger(progressPosition.chapter2Step) ||
        progressPosition.chapter2Step < 0 ||
        progressPosition.chapter2Step > 10000
      )
    ) {
      return failure("chapter2Step 必須是 0 到 10000 的整數。");
    }

    return { ok: true, value: clone(progressPosition) };
  }

  function validateStateChangeRequest(request) {
    if (!isRecord(request)) {
      return failure("State Change Request 必須是物件。");
    }

    if (hasForbiddenKey(request)) {
      return failure("State Change Request 含有禁止的欄位名稱。");
    }

    const requestKeys = Object.keys(request);
    const invalidRequestKey = requestKeys.find(
      key => !["source", "changes"].includes(key)
    );
    if (invalidRequestKey) {
      return failure(`State Change Request 含有未知欄位：${invalidRequestKey}`);
    }

    if (typeof request.source !== "string" || request.source.trim() === "") {
      return failure("source 必須是非空字串。");
    }

    if (!isRecord(request.changes)) {
      return failure("changes 必須是物件。");
    }

    const changeKeys = Object.keys(request.changes);
    if (changeKeys.length === 0) {
      return failure("changes 至少需要一個變更欄位。");
    }

    const allowedChangeFields = [...CURRENT_STATE_FIELDS, "progressPosition"];
    const invalidKey = changeKeys.find(key => !allowedChangeFields.includes(key));
    if (invalidKey) {
      return failure(`不允許更新 Current State 欄位：${invalidKey}`);
    }

    const changes = request.changes;

    if (
      Object.prototype.hasOwnProperty.call(changes, "chapter") &&
      (typeof changes.chapter !== "string" || changes.chapter.trim() === "")
    ) {
      return failure("chapter 必須是非空字串。");
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "day") &&
      (!Number.isInteger(changes.day) || changes.day < 1 || changes.day > 36500)
    ) {
      return failure("day 必須是 1 到 36500 的整數。");
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "phase") &&
      (typeof changes.phase !== "string" || changes.phase.trim() === "")
    ) {
      return failure("phase 必須是非空字串。");
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "completed") &&
      typeof changes.completed !== "boolean"
    ) {
      return failure("completed 必須是 boolean。");
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "lastEventTitle") &&
      typeof changes.lastEventTitle !== "string"
    ) {
      return failure("lastEventTitle 必須是字串。");
    }

    if (Object.prototype.hasOwnProperty.call(changes, "progressPosition")) {
      const progressResult = validateProgressPosition(changes.progressPosition);
      if (!progressResult.ok) return progressResult;
    }

    return {
      ok: true,
      request: {
        source: request.source.trim(),
        changes: clone(changes)
      }
    };
  }

  function applyStateChangeRequest(request) {
    const validation = validateStateChangeRequest(request);
    if (!validation.ok) return validation;

    const changes = validation.request.changes;
    const nextValues = {};

    CURRENT_STATE_FIELDS.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        nextValues[key] = changes[key];
      }
    });

    const nextProgress = Object.prototype.hasOwnProperty.call(changes, "progressPosition")
      ? changes.progressPosition
      : null;

    Object.keys(nextValues).forEach(key => {
      player[key] = nextValues[key];
    });

    if (nextProgress) {
      APPROVED_PROGRESS_FIELDS.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(nextProgress, key)) {
          player[key] = nextProgress[key];
        }
      });
    }

    return { ok: true, state: getSnapshot() };
  }

  function restoreCurrentState(snapshot) {
    if (!isRecord(snapshot) || hasForbiddenKey(snapshot)) {
      return failure("Current State Snapshot 無效。");
    }

    const allowedSnapshotFields = [
      ...CURRENT_STATE_FIELDS,
      "progressPosition",
      "currentEventId"
    ];
    const invalidKey = Object.keys(snapshot).find(
      key => !allowedSnapshotFields.includes(key)
    );
    if (invalidKey) {
      return failure(`Snapshot 含有非 Current State 欄位：${invalidKey}`);
    }

    const changes = {};
    CURRENT_STATE_FIELDS.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
        changes[key] = snapshot[key];
      }
    });
    if (Object.prototype.hasOwnProperty.call(snapshot, "progressPosition")) {
      changes.progressPosition = snapshot.progressPosition;
    }

    return applyStateChangeRequest({
      source: "restoreCurrentState",
      changes
    });
  }

  function isCompleted() {
    return player.completed === true;
  }

  const api = Object.freeze({
    getSnapshot,
    getProgressPosition,
    getCurrentEventId: getCurrentEventIdFromRuntime,
    isCompleted,
    validateStateChangeRequest,
    applyStateChangeRequest,
    restoreCurrentState
  });

  if (typeof window !== "undefined") {
    window.CurrentStateBoundary = api;
  }

  return api;
})();
