var CareerTransitionCommitBoundary = ((graduationTransitionResolver) => {
  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function rejected(code, message, resolution) {
    return deepFreeze({
      status: "rejected",
      committed: false,
      source: resolution?.source ? clone(resolution.source) : null,
      target: null,
      appliedPatch: null,
      issues: [{ code, message }],
      resolution: resolution ? clone(resolution) : null
    });
  }

  function canSafelyWriteProperty(target, key) {
    try {
      const ownDescriptor = Object.getOwnPropertyDescriptor(target, key);
      if (ownDescriptor) {
        return Object.prototype.hasOwnProperty.call(ownDescriptor, "value")
          && ownDescriptor.writable === true;
      }

      if (!Object.isExtensible(target)) return false;

      let prototype = Object.getPrototypeOf(target);
      while (prototype) {
        const inheritedDescriptor = Object.getOwnPropertyDescriptor(prototype, key);
        if (inheritedDescriptor) {
          return Object.prototype.hasOwnProperty.call(inheritedDescriptor, "value")
            && inheritedDescriptor.writable === true;
        }
        prototype = Object.getPrototypeOf(prototype);
      }

      return true;
    } catch (_error) {
      return false;
    }
  }

  function commitGraduationTransition(playerState) {
    if (!playerState || typeof playerState !== "object" || Array.isArray(playerState)) {
      return rejected(
        "graduation-player-state-missing",
        "Graduation Transition Commit Boundary 需要可寫入的 Player 狀態物件。"
      );
    }

    if (
      !graduationTransitionResolver ||
      typeof graduationTransitionResolver.resolveGraduationTransition !== "function"
    ) {
      return rejected(
        "graduation-transition-resolver-unavailable",
        "無法取得 Architecture Sprint 4.4 的高中畢業轉換解析器。"
      );
    }

    let resolution;
    try {
      resolution = graduationTransitionResolver.resolveGraduationTransition(playerState);
    } catch (_error) {
      return rejected(
        "graduation-transition-resolution-failed",
        "高中畢業轉換解析失敗，Player 狀態未被修改。"
      );
    }

    if (
      !resolution ||
      resolution.status !== "resolved" ||
      resolution.resolved !== true ||
      !resolution.target
    ) {
      return rejected(
        "graduation-transition-unresolved",
        "目前 Player 狀態尚未形成可提交的高中畢業轉換。",
        resolution
      );
    }

    const targetChapter = typeof resolution.target.chapter === "string"
      ? resolution.target.chapter
      : "";
    if (!targetChapter.trim()) {
      return rejected(
        "graduation-transition-target-invalid",
        "解析結果沒有合法的成年入口 chapter。",
        resolution
      );
    }

    const appliedPatch = {
      chapter: targetChapter,
      transitionStep: 0
    };

    const unsafeFields = Object.keys(appliedPatch).filter(key =>
      !canSafelyWriteProperty(playerState, key)
    );
    if (unsafeFields.length > 0) {
      return rejected(
        "graduation-transition-player-not-writable",
        `Player 的成年轉換欄位不可安全寫入：${unsafeFields.join("、")}。`,
        resolution
      );
    }

    try {
      Object.assign(playerState, appliedPatch);
    } catch (_error) {
      return rejected(
        "graduation-transition-commit-failed",
        "成年轉換提交失敗，Player 狀態未完成提交。",
        resolution
      );
    }

    return deepFreeze({
      status: "committed",
      committed: true,
      source: clone(resolution.source),
      target: clone(resolution.target),
      appliedPatch: clone(appliedPatch),
      issues: []
    });
  }

  const api = Object.freeze({ commitGraduationTransition });
  if (typeof window !== "undefined") window.CareerTransitionCommitBoundary = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})(
  typeof GraduationTransitionResolver !== "undefined"
    ? GraduationTransitionResolver
    : typeof require === "function"
      ? require("./career-transition-resolver.js")
      : null
);
