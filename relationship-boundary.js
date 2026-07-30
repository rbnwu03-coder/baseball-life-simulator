var RelationshipBoundary = (() => {
  const RELATIONSHIP_TARGETS = Object.freeze([
    "coachTrust",
    "teammateBond",
    "rivalRespect",
    "rivalCompetition"
  ]);
  const OPERATION = "add";
  const MIN_VALUE = 0;
  const MAX_VALUE = 20;
  const MIN_AMOUNT = -20;
  const MAX_AMOUNT = 20;
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

  function getStore() {
    return player && isRecord(player.relationships)
      ? player.relationships
      : null;
  }

  function hasRelationship(targetId) {
    const store = getStore();
    return (
      typeof targetId === "string" &&
      RELATIONSHIP_TARGETS.includes(targetId) &&
      store !== null &&
      Object.prototype.hasOwnProperty.call(store, targetId)
    );
  }

  function getSnapshot() {
    const store = getStore();
    return clone(store || {});
  }

  function getRelationship(targetId) {
    if (!hasRelationship(targetId)) return null;
    return Number(getStore()[targetId]);
  }

  function validateRelationshipChangeRequest(request) {
    if (!isRecord(request)) {
      return failure("Relationship Change Request 必須是純物件。");
    }
    if (hasForbiddenKey(request)) {
      return failure("Relationship Change Request 含有不安全欄位或循環參照。");
    }

    const requestKeys = validateExactKeys(
      request,
      ["source", "targetId", "operation", "amount", "expected"],
      "Relationship Change Request"
    );
    if (!requestKeys.ok) return requestKeys;

    if (typeof request.source !== "string" || request.source.trim() === "") {
      return failure("source 必須是非空白字串。");
    }
    if (typeof request.targetId !== "string" || request.targetId.trim() === "") {
      return failure("targetId 必須是非空白字串。");
    }

    const targetId = request.targetId.trim();
    if (!hasRelationship(targetId)) {
      return failure(`未知的 relationship target：${targetId}`);
    }
    if (request.operation !== OPERATION) {
      return failure(`operation 必須是 ${OPERATION}。`);
    }
    if (
      typeof request.amount !== "number" ||
      !Number.isFinite(request.amount) ||
      request.amount < MIN_AMOUNT ||
      request.amount > MAX_AMOUNT
    ) {
      return failure(`amount 必須是 ${MIN_AMOUNT} 到 ${MAX_AMOUNT} 的有限數字。`);
    }

    if (!isRecord(request.expected)) {
      return failure("expected 必須是純物件。");
    }
    const expectedKeys = validateExactKeys(
      request.expected,
      ["currentValue"],
      "expected"
    );
    if (!expectedKeys.ok) return expectedKeys;
    if (
      typeof request.expected.currentValue !== "number" ||
      !Number.isFinite(request.expected.currentValue)
    ) {
      return failure("expected.currentValue 必須是有限數字。");
    }

    const currentValue = getRelationship(targetId);
    if (currentValue !== request.expected.currentValue) {
      return failure("expected.currentValue 與目前 relationship value 不一致。");
    }

    return {
      ok: true,
      request: clone({
        source: request.source.trim(),
        targetId,
        operation: request.operation,
        amount: request.amount,
        expected: {
          currentValue: request.expected.currentValue
        }
      })
    };
  }

  function applyRelationshipChangeRequest(request) {
    const validation = validateRelationshipChangeRequest(request);
    if (!validation.ok) return validation;

    const approved = validation.request;
    const previousValue = approved.expected.currentValue;
    const nextValue = Math.max(
      MIN_VALUE,
      Math.min(MAX_VALUE, previousValue + approved.amount)
    );

    getStore()[approved.targetId] = nextValue;

    return {
      ok: true,
      change: {
        targetId: approved.targetId,
        previousValue,
        amount: approved.amount,
        nextValue
      }
    };
  }

  function validateSnapshot(snapshot) {
    if (!isRecord(snapshot) || hasForbiddenKey(snapshot)) {
      return failure("Relationship Snapshot 必須是安全的純物件。");
    }

    const snapshotKeys = validateExactKeys(
      snapshot,
      RELATIONSHIP_TARGETS,
      "Relationship Snapshot"
    );
    if (!snapshotKeys.ok) return snapshotKeys;

    for (const targetId of RELATIONSHIP_TARGETS) {
      const value = snapshot[targetId];
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < MIN_VALUE ||
        value > MAX_VALUE
      ) {
        return failure(`${targetId} 必須是 ${MIN_VALUE} 到 ${MAX_VALUE} 的有限數字。`);
      }
    }

    return { ok: true, snapshot: clone(snapshot) };
  }

  function restoreRelationshipSnapshot(snapshot) {
    const validation = validateSnapshot(snapshot);
    if (!validation.ok) return validation;

    const previous = getSnapshot();
    try {
      RELATIONSHIP_TARGETS.forEach(targetId => {
        getStore()[targetId] = validation.snapshot[targetId];
      });
    }
    catch (error) {
      RELATIONSHIP_TARGETS.forEach(targetId => {
        getStore()[targetId] = previous[targetId];
      });
      return failure("Relationship Snapshot 還原失敗。");
    }

    return { ok: true, snapshot: getSnapshot() };
  }

  const api = Object.freeze({
    getSnapshot,
    getRelationship,
    hasRelationship,
    validateRelationshipChangeRequest,
    applyRelationshipChangeRequest,
    restoreRelationshipSnapshot
  });

  if (typeof window !== "undefined") {
    window.RelationshipBoundary = api;
  }

  return api;
})();
