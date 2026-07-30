var RelationshipFlow = (() => {
  const TARGET_EVENT_ID = "youth_season_intro";
  const TARGET_CHOICE_INDEX = 0;
  const TARGET_RELATIONSHIP = "coachTrust";
  const TARGET_AMOUNT = 1;
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

  function validateRelationshipContext(context) {
    if (!isRecord(context) || hasForbiddenKey(context)) {
      return failure("Relationship Context 必須是安全的純物件。");
    }
    const contextKeys = validateExactKeys(
      context,
      ["eventId", "choiceIndex"],
      "Relationship Context"
    );
    if (!contextKeys.ok) return contextKeys;

    if (
      context.eventId !== TARGET_EVENT_ID ||
      context.choiceIndex !== TARGET_CHOICE_INDEX
    ) {
      return failure(
        `Phase 6 只接管 ${TARGET_EVENT_ID}:${TARGET_CHOICE_INDEX}。`
      );
    }

    const eventResolver = globalThis.getEvent;
    if (typeof eventResolver !== "function") {
      return failure("目前無法解析事件。");
    }
    const event = eventResolver(context.eventId);
    const choice = event?.choices?.[context.choiceIndex];
    if (!choice) {
      return failure("Relationship Context 對應的事件選項不存在。");
    }
    if (
      !isRecord(choice.relationshipEffects) ||
      hasForbiddenKey(choice.relationshipEffects)
    ) {
      return failure("目標選項沒有安全的 relationship effect。");
    }

    const effectKeys = Object.keys(choice.relationshipEffects);
    if (
      effectKeys.length !== 1 ||
      effectKeys[0] !== TARGET_RELATIONSHIP ||
      choice.relationshipEffects[TARGET_RELATIONSHIP] !== TARGET_AMOUNT
    ) {
      return failure("目標選項必須只有一項固定的教練信任變化。");
    }

    return {
      ok: true,
      context: {
        eventId: context.eventId,
        choiceIndex: context.choiceIndex
      }
    };
  }

  function createRelationshipContext(eventId, choiceIndex) {
    const validation = validateRelationshipContext({ eventId, choiceIndex });
    if (!validation.ok) return validation;
    return {
      ok: true,
      context: deepFreeze(clone(validation.context))
    };
  }

  function validateLegacyOutcome(context, legacyOutcome) {
    const contextValidation = validateRelationshipContext(context);
    if (!contextValidation.ok) return contextValidation;
    if (!isRecord(legacyOutcome) || hasForbiddenKey(legacyOutcome)) {
      return failure("legacyOutcome 必須是安全的純物件。");
    }

    const outcomeKeys = validateExactKeys(
      legacyOutcome,
      ["targetId", "amount", "previousValue"],
      "legacyOutcome"
    );
    if (!outcomeKeys.ok) return outcomeKeys;
    if (
      legacyOutcome.targetId !== TARGET_RELATIONSHIP ||
      legacyOutcome.amount !== TARGET_AMOUNT
    ) {
      return failure("legacyOutcome 與目標選項的固定關係效果不一致。");
    }
    if (
      typeof legacyOutcome.previousValue !== "number" ||
      !Number.isFinite(legacyOutcome.previousValue) ||
      legacyOutcome.previousValue !==
        RelationshipBoundary.getRelationship(TARGET_RELATIONSHIP)
    ) {
      return failure("legacyOutcome.previousValue 與目前關係值不一致。");
    }

    return { ok: true };
  }

  function createRelationshipResult(context, legacyOutcome) {
    const contextValidation = validateRelationshipContext(context);
    if (!contextValidation.ok) return contextValidation;
    const outcomeValidation = validateLegacyOutcome(
      contextValidation.context,
      legacyOutcome
    );
    if (!outcomeValidation.ok) return outcomeValidation;

    const relationshipResult = {
      source: {
        type: "decision",
        eventId: contextValidation.context.eventId,
        choiceIndex: contextValidation.context.choiceIndex
      },
      relationshipChanges: [
        {
          targetId: legacyOutcome.targetId,
          operation: "add",
          amount: legacyOutcome.amount
        }
      ]
    };

    return {
      ok: true,
      relationshipResult: deepFreeze(clone(relationshipResult))
    };
  }

  function validateRelationshipResult(result) {
    if (!isRecord(result) || hasForbiddenKey(result)) {
      return failure("Relationship Result 必須是安全的純物件。");
    }
    const resultKeys = validateExactKeys(
      result,
      ["source", "relationshipChanges"],
      "Relationship Result"
    );
    if (!resultKeys.ok) return resultKeys;

    if (!isRecord(result.source)) {
      return failure("Relationship Result source 必須是純物件。");
    }
    const sourceKeys = validateExactKeys(
      result.source,
      ["type", "eventId", "choiceIndex"],
      "Relationship Result source"
    );
    if (!sourceKeys.ok) return sourceKeys;
    if (result.source.type !== "decision") {
      return failure("Relationship Result source.type 必須是 decision。");
    }

    const contextValidation = validateRelationshipContext({
      eventId: result.source.eventId,
      choiceIndex: result.source.choiceIndex
    });
    if (!contextValidation.ok) return contextValidation;

    if (
      !Array.isArray(result.relationshipChanges) ||
      result.relationshipChanges.length !== 1
    ) {
      return failure("Relationship Result 必須剛好包含一項關係變化。");
    }
    const change = result.relationshipChanges[0];
    if (!isRecord(change) || hasForbiddenKey(change)) {
      return failure("Relationship Result change 必須是安全的純物件。");
    }
    const changeKeys = validateExactKeys(
      change,
      ["targetId", "operation", "amount"],
      "Relationship Result change"
    );
    if (!changeKeys.ok) return changeKeys;
    if (
      change.targetId !== TARGET_RELATIONSHIP ||
      change.operation !== "add" ||
      change.amount !== TARGET_AMOUNT
    ) {
      return failure("Relationship Result 與固定選項效果不一致。");
    }

    return { ok: true, relationshipResult: clone(result) };
  }

  function createRelationshipChangeRequest(result) {
    const validation = validateRelationshipResult(result);
    if (!validation.ok) return validation;

    const approved = validation.relationshipResult;
    const source = approved.source;
    const change = approved.relationshipChanges[0];
    return {
      ok: true,
      request: {
        source: `decision:${source.eventId}:${source.choiceIndex}`,
        targetId: change.targetId,
        operation: change.operation,
        amount: change.amount,
        expected: {
          currentValue: RelationshipBoundary.getRelationship(change.targetId)
        }
      }
    };
  }

  function applyRelationshipResult(result) {
    const requestResult = createRelationshipChangeRequest(result);
    if (!requestResult.ok) return requestResult;
    return RelationshipBoundary.applyRelationshipChangeRequest(
      requestResult.request
    );
  }

  const api = Object.freeze({
    createRelationshipContext,
    validateRelationshipContext,
    createRelationshipResult,
    createRelationshipChangeRequest,
    applyRelationshipResult
  });

  if (typeof window !== "undefined") {
    window.RelationshipFlow = api;
  }

  return api;
})();
