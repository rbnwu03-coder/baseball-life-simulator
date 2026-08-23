(function exposeApplicationController(globalScope) {
  "use strict";

  function failure(method, message, cause) {
    const result = {
      ok: false,
      error: `ApplicationController.${method}: ${message}`
    };
    if (cause) result.cause = cause;
    return result;
  }

  function invokeLegacy(method, dependencyName, args = []) {
    const dependency = globalScope?.[dependencyName];
    if (typeof dependency !== "function") {
      return failure(method, `找不到必要的既有函式 ${dependencyName}()。`);
    }

    try {
      const value = dependency(...args);
      return value === undefined ? { ok: true } : { ok: true, value };
    } catch (error) {
      if (globalScope?.console?.error) {
        globalScope.console.error(`[ApplicationController.${method}]`, error);
      }
      return failure(method, error?.message || `${dependencyName}() 執行失敗。`, error);
    }
  }

  function requireText(method, label, value) {
    if (typeof value !== "string" || !value.trim()) {
      return failure(method, `${label}必須是非空白字串。`);
    }
    return null;
  }

  const controller = {
    startGame() {
      return invokeLegacy("startGame", "createPlayer");
    },

    submitDecision(eventId, choiceIndex) {
      const eventError = requireText("submitDecision", "eventId", eventId);
      if (eventError) return eventError;
      if (!Number.isInteger(choiceIndex) || choiceIndex < 0) {
        return failure("submitDecision", "choiceIndex 必須是大於或等於 0 的整數。");
      }
      return invokeLegacy("submitDecision", "choose", [eventId, choiceIndex]);
    },

    presentCurrentScene() {
      return invokeLegacy("presentCurrentScene", "showCurrentEvent");
    },

    saveSession() {
      return invokeLegacy("saveSession", "saveGame");
    },

    resumeSession() {
      return invokeLegacy("resumeSession", "loadGame");
    },

    deleteSession() {
      return invokeLegacy("deleteSession", "deleteSave");
    },

    selectOrigin(origin) {
      const validationError = requireText("selectOrigin", "origin", origin);
      if (validationError) return validationError;
      return invokeLegacy("selectOrigin", "selectOrigin", [origin]);
    },

    selectIdealSelf(idealSelf) {
      const validationError = requireText("selectIdealSelf", "idealSelf", idealSelf);
      if (validationError) return validationError;
      return invokeLegacy("selectIdealSelf", "selectIdealSelf", [idealSelf]);
    },

    generateGenesisProfile() {
      return invokeLegacy("generateGenesisProfile", "generateGenesisProfile");
    },

    adjustGenesisAbility(ability, delta) {
      const validationError = requireText("adjustGenesisAbility", "ability", ability);
      if (validationError) return validationError;
      if (!Number.isInteger(delta) || ![-1, 1].includes(delta)) {
        return failure("adjustGenesisAbility", "delta 必須是 -1 或 1。");
      }
      return invokeLegacy("adjustGenesisAbility", "adjustGenesisAbility", [ability, delta]);
    },

    selectDevelopmentEntry(entry) {
      const validationError = requireText("selectDevelopmentEntry", "entry", entry);
      if (validationError) return validationError;
      return invokeLegacy("selectDevelopmentEntry", "selectDevelopmentEntry", [entry]);
    },

    selectDevelopmentTestPosition(position) {
      if (typeof position !== "string") {
        return failure("selectDevelopmentTestPosition", "position 必須是字串。");
      }
      return invokeLegacy("selectDevelopmentTestPosition", "selectDevelopmentTestPosition", [position]);
    },

    loadTestBookmark(bookmark) {
      const validationError = requireText("loadTestBookmark", "bookmark", bookmark);
      if (validationError) return validationError;
      return invokeLegacy("loadTestBookmark", "loadTestBookmark", [bookmark]);
    }
  };

  globalScope.ApplicationController = Object.freeze(controller);
})(typeof globalThis !== "undefined" ? globalThis : this);
