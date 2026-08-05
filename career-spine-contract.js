var CareerSpineContract = (() => {
  const KNOWN_GAPS = [
    {
      id: "junior-split-age-mismatch",
      severity: "known-gap",
      message: "青少棒分化由主線以 13 歲進入，但 Debug 書籤以 15 歲建立。"
    },
    {
      id: "adult-routes-share-development",
      severity: "known-gap",
      message: "成年四條分流在 20 歲後共用同一組 development 路由。"
    },
    {
      id: "post-age-22-not-playable",
      severity: "known-gap",
      message: "二十二歲職涯小結後只有垂直切片完成狀態，沒有正式可玩節點。"
    }
  ];

  const VALID_CAREER_EXITS = [
    "高卒選秀・中後段指名候選",
    "高卒選秀・落選／培訓測試",
    "大學棒球",
    "業餘／社會人棒球",
    "復健與生涯暫停"
  ];

  const NODES = [
    node({
      id: "childhood-summer",
      chapter: "十歲暑假",
      age: [10, 10],
      progress: { field: "day", min: 1, max: 7, companion: { field: "phase", allowed: ["morning", "afternoon", "night", "ending"] } },
      entry: { handler: "createInitialPlayer", eventId: "day1_morning" },
      settlement: { eventIds: ["ending"], handler: "finishChapterOne" },
      nextChapters: ["少棒入門"],
      route: { kind: "day-phase" }
    }),
    node({
      id: "youth-intro",
      chapter: "少棒入門",
      age: [10, 10],
      progress: { field: "chapter2Step", min: 0, max: 5 },
      entry: { handler: "enterChapterTwo", eventId: "chapter2_intro" },
      settlement: { eventIds: ["chapter2_result"], handler: "evaluateChapter2Result" },
      nextChapters: ["少棒入門小結"],
      route: steps([
        "chapter2_intro", "chapter2_day1_training", "chapter2_team_breath",
        "chapter2_day2_correction", "chapter2_batting_intro", "chapter2_day3_test"
      ])
    }),
    resultNode("youth-intro-result", "少棒入門小結", [10, 10], "chapter2_result", ["少棒第一季"]),
    node({
      id: "youth-first-season",
      chapter: "少棒第一季",
      age: [10, 10],
      progress: { field: "seasonStep", min: 0, max: 7 },
      entry: { handler: "enterYouthSeason", eventId: "youth_season_intro" },
      settlement: { eventIds: ["youth_season_result"], handler: "evaluateYouthSeason" },
      nextChapters: ["少棒第一季小結"],
      route: steps([
        "youth_season_intro", "youth_position_trial", "youth_teammate", "youth_bench",
        "youth_match_entry",
        ["youth_match_grounder", "youth_match_outfield", "youth_match_catcher", "youth_match_pitcher"],
        "youth_match_mistake", "youth_match_after"
      ])
    }),
    resultNode("youth-first-season-result", "少棒第一季小結", [10, 10], "youth_season_result", ["位置競爭"]),
    node({
      id: "position-competition",
      chapter: "位置競爭",
      age: [10, 11],
      progress: { field: "competitionStep", min: 0, max: 5 },
      entry: { handler: "enterPositionCompetition", eventId: "competition_intro" },
      settlement: { eventIds: ["competition_result"], handler: "evaluatePositionCompetition" },
      nextChapters: ["位置競爭小結"],
      knownIssues: [{ id: "position-competition-age-window", severity: "note", message: "主線沿用 10 歲；部分 Debug 狀態以 11 歲測試人物關係。" }],
      route: steps([
        "competition_intro", "competition_training_week",
        ["echo_coach_immature", "echo_coach_leadership", "echo_rival_respect", "echo_coach", "echo_teammate", "echo_rival", "echo_solo"],
        ["azhe_bond_low", "azhe_bond_high", "azhe_bond_mid"],
        "competition_role_talk", ["competition_catcher_test", "competition_position_test"]
      ])
    }),
    resultNode("position-competition-result", "位置競爭小結", [10, 11], "competition_result", ["青少棒"]),
    node({
      id: "junior-opening",
      chapter: "青少棒",
      age: [13, 13],
      progress: { field: "juniorStep", min: 0, max: 9 },
      entry: { handler: "enterJuniorBaseball", eventId: "junior_intro" },
      settlement: { eventIds: ["junior_result"], handler: "evaluateJuniorOpening" },
      nextChapters: ["青少棒開場小結"],
      route: steps([
        "junior_intro", "junior_repetition", "junior_growth_test", "junior_position_change",
        "junior_azhe_cover", "junior_takahashi_failure", "junior_coach_disagreement",
        "junior_home_night", "junior_friend_exit", "junior_pain"
      ])
    }),
    resultNode("junior-opening-result", "青少棒開場小結", [13, 13], "junior_result", ["青少棒分化"]),
    node({
      id: "junior-split",
      chapter: "青少棒分化",
      age: [13, 15],
      progress: { field: "juniorSeasonStep", min: 0, max: 9 },
      entry: { handler: "enterJuniorSeason", eventId: "junior_consequence" },
      settlement: { eventIds: ["junior_season_result"], handler: "evaluateJuniorSeason" },
      nextChapters: ["青少棒階段小結"],
      knownIssues: [KNOWN_GAPS[0]],
      route: steps([
        "junior_consequence", "junior_coach_preference", "junior_senior", "junior_starting_job",
        "junior_academics", "junior_tournament", "junior_after_loss", "takahashi_school_question",
        "yamamoto_recommendation", "junior_school_choice"
      ])
    }),
    resultNode("junior-split-result", "青少棒階段小結", [13, 15], "junior_season_result", ["青棒"], [KNOWN_GAPS[0]]),
    node({
      id: "high-school-year-one",
      chapter: "青棒",
      age: [16, 16],
      progress: { field: "highSchoolStep", min: 0, max: 7 },
      entry: { handler: "enterHighSchool", eventId: "high_school_intro" },
      settlement: { eventIds: ["high_school_result"], handler: "evaluateHighSchoolYear" },
      nextChapters: ["青棒第一年小結"],
      route: steps([
        "high_school_intro", "high_school_load", "high_school_life", "high_school_call_home",
        "high_school_role", "high_school_long_bench", "high_school_showcase", "high_school_scout_feedback"
      ])
    }),
    resultNode("high-school-year-one-result", "青棒第一年小結", [16, 16], "high_school_result", ["青棒第二年"]),
    node({
      id: "high-school-year-two",
      chapter: "青棒第二年",
      age: [17, 17],
      progress: { field: "highSchoolYearTwoStep", min: 0, max: 7 },
      entry: { handler: "enterHighSchoolYearTwo", eventId: "high_school_year_two_roster_reset" },
      settlement: { eventIds: ["high_school_year_two_result"], handler: "evaluateHighSchoolYearTwo" },
      nextChapters: ["青棒第二年小結"],
      route: steps([
        "high_school_year_two_roster_reset", "high_school_year_two_role_test",
        "high_school_year_two_spring_game", "high_school_year_two_depth_chart",
        "high_school_year_two_body_load", "high_school_year_two_team_responsibility",
        "high_school_year_two_autumn_stage", "high_school_year_two_senior_plan"
      ])
    }),
    resultNode("high-school-year-two-result", "青棒第二年小結", [17, 17], "high_school_year_two_result", ["青棒關鍵年"]),
    node({
      id: "high-school-critical-year",
      chapter: "青棒關鍵年",
      age: [18, 18],
      progress: { field: "criticalYearStep", min: 0, max: 7 },
      entry: { handler: "enterCriticalYear", eventId: "critical_offseason" },
      settlement: { eventIds: ["critical_year_result"], handler: "evaluateCriticalYear" },
      nextChapters: ["青棒生涯出口"],
      route: steps([
        "critical_offseason", "critical_tournament", "critical_public_attention", "critical_injury",
        "critical_scout_interview", "critical_family", "critical_farewell", "critical_exit_choice"
      ])
    }),
    resultNode("high-school-career-exit", "青棒生涯出口", [18, 18], "critical_year_result", ["生涯轉換期"]),
    node({
      id: "career-transition",
      chapter: "生涯轉換期",
      age: [18, 18],
      progress: { field: "transitionStep", min: 0, max: 4 },
      entry: { handler: "enterCareerTransition", eventId: null },
      settlement: { eventIds: ["transition_result"], handler: "evaluateCareerTransition" },
      nextChapters: ["生涯轉換期小結"],
      route: {
        kind: "route-steps",
        routes: {
          draft: ["transition_draft_day", "transition_rookie_camp", "transition_pro_roster_window", "transition_relationship", "transition_cost_check"],
          college: ["transition_college_arrival", "transition_college_balance", "transition_college_eligibility", "transition_relationship", "transition_cost_check"],
          amateur: ["transition_amateur_job", "transition_amateur_test", "transition_amateur_company_conflict", "transition_relationship", "transition_cost_check"],
          rehab: ["transition_rehab_plateau", "transition_rehab_identity", "transition_rehab_reentry_deadline", "transition_relationship", "transition_cost_check"]
        }
      }
    }),
    resultNode("career-transition-result", "生涯轉換期小結", [18, 18], "transition_result", ["發展期"]),
    node({
      id: "development-years",
      chapter: "發展期",
      age: [20, 21],
      progress: { field: "developmentStep", min: 0, max: 6 },
      entry: { handler: "enterDevelopmentYears", eventId: "development_daily_life" },
      settlement: { eventIds: ["development_result"], handler: "evaluateDevelopmentYears" },
      nextChapters: ["二十二歲職涯小結"],
      knownIssues: [KNOWN_GAPS[1]],
      route: steps([
        "development_daily_life", "development_competition", "development_mentor",
        "development_body_choice", "development_opportunity", "development_market", "development_decision"
      ])
    }),
    resultNode("age-22-career-result", "二十二歲職涯小結", [22, 22], "development_result", ["垂直切片完成"], [KNOWN_GAPS[2]]),
    node({
      id: "vertical-slice-complete",
      chapter: "垂直切片完成",
      age: [22, 22],
      progress: null,
      entry: { handler: "completeSlice", eventId: "slice_complete" },
      settlement: { eventIds: ["slice_complete"], handler: null },
      nextChapters: [],
      terminal: true,
      knownIssues: [KNOWN_GAPS[2]],
      route: { kind: "fixed", eventId: "slice_complete" }
    })
  ];

  function node(definition) {
    return Object.assign({
      terminal: false,
      knownIssues: []
    }, definition);
  }

  function resultNode(id, chapter, age, eventId, nextChapters, knownIssues = []) {
    return node({
      id,
      chapter,
      age,
      progress: null,
      entry: { handler: null, eventId },
      settlement: { eventIds: [eventId], handler: null },
      nextChapters,
      knownIssues,
      route: { kind: "fixed", eventId }
    });
  }

  function steps(eventIds) {
    return {
      kind: "steps",
      events: eventIds.map(value => Array.isArray(value) ? value.slice() : [value])
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  deepFreeze(KNOWN_GAPS);
  deepFreeze(NODES);

  const NODE_BY_CHAPTER = new Map(NODES.map(item => [item.chapter, item]));

  function getNodes() {
    return deepFreeze(clone(NODES));
  }

  function getKnownGaps() {
    return deepFreeze(clone(KNOWN_GAPS));
  }

  function getNodeByChapter(chapter) {
    const found = NODE_BY_CHAPTER.get(chapter);
    return found ? deepFreeze(clone(found)) : null;
  }

  function getAdultRouteKey(state) {
    const exit = String(state?.careerExit || "");
    if (exit.startsWith("高卒")) return "draft";
    if (exit === "大學棒球") return "college";
    if (exit === "業餘／社會人棒球") return "amateur";
    return "rehab";
  }

  function getUnderlyingEventIds(state, contractNode) {
    if (!contractNode) return [];
    const route = contractNode.route;
    if (route.kind === "fixed") return [route.eventId];
    if (route.kind === "day-phase") {
      if (state.ending) return ["ending"];
      if (state.phase === "night") return ["night"];
      return [`day${state.day}_${state.phase}`];
    }
    const progressValue = state[contractNode.progress.field];
    if (route.kind === "steps") return clone(route.events[progressValue] || []);
    if (route.kind === "route-steps") {
      const routeKey = getAdultRouteKey(state);
      const events = route.routes[routeKey] || [];
      return events[progressValue] ? [events[progressValue]] : [];
    }
    return [];
  }

  function getRuntimeEventExpectation(state) {
    const contractNode = state && typeof state === "object"
      ? NODE_BY_CHAPTER.get(state.chapter)
      : null;
    const underlyingEventIds = getUnderlyingEventIds(state || {}, contractNode);
    const forcedEventId = typeof state?.forcedEventId === "string"
      ? state.forcedEventId
      : "";
    const completed = state?.completed === true;
    return deepFreeze({
      underlyingEventIds,
      effectiveEventIds: completed
        ? ["slice_complete"]
        : forcedEventId
          ? [forcedEventId]
          : underlyingEventIds.slice(),
      forcedEventId
    });
  }

  function issue(code, message) {
    return { code, severity: "error", message };
  }

  function getCareerSpineSnapshot(state) {
    const chapter = typeof state?.chapter === "string" ? state.chapter : "";
    const age = state?.age;
    const completed = state?.completed === true;
    const forcedEventId = typeof state?.forcedEventId === "string" ? state.forcedEventId : "";
    const contractNode = NODE_BY_CHAPTER.get(chapter) || null;

    if (!contractNode) {
      const eventExpectation = getRuntimeEventExpectation(state || {});
      return deepFreeze({
        status: "unknown",
        nodeId: null,
        chapter,
        age,
        progressField: null,
        progressValue: null,
        completed,
        terminal: false,
        forcedEventId,
        underlyingEventIds: eventExpectation.underlyingEventIds,
        effectiveEventIds: eventExpectation.effectiveEventIds,
        issues: [issue("unknown-chapter", `Career Spine 無法辨識 chapter：${chapter || "（空白）"}`)],
        knownIssues: []
      });
    }

    const issues = [];
    const [minimumAge, maximumAge] = contractNode.age;
    if (!Number.isInteger(age) || age < minimumAge || age > maximumAge) {
      issues.push(issue("age-out-of-contract", `${chapter} 合法年齡為 ${minimumAge}–${maximumAge}，目前為 ${String(age)}。`));
    }

    let progressField = null;
    let progressValue = null;
    if (contractNode.progress) {
      progressField = contractNode.progress.field;
      progressValue = state[progressField];
      if (
        !Number.isInteger(progressValue) ||
        progressValue < contractNode.progress.min ||
        progressValue > contractNode.progress.max
      ) {
        issues.push(issue(
          "progress-out-of-contract",
          `${chapter}.${progressField} 合法範圍為 ${contractNode.progress.min}–${contractNode.progress.max}，目前為 ${String(progressValue)}。`
        ));
      }
      const companion = contractNode.progress.companion;
      if (companion && !companion.allowed.includes(state[companion.field])) {
        issues.push(issue(
          "companion-progress-out-of-contract",
          `${chapter}.${companion.field} 不在合法值 ${companion.allowed.join("／")} 之中。`
        ));
      }
    }

    if (chapter === "十歲暑假") {
      const hasEnding = typeof state.ending === "string" && state.ending.trim() !== "";
      const isFormalEndingState = state.day === 7 && state.phase === "ending";
      if (state.phase === "ending" && !hasEnding) {
        issues.push(issue("ending-value-missing", "十歲暑假 phase=ending 時必須已有正式 ending。"));
      }
      if (hasEnding && !isFormalEndingState) {
        issues.push(issue("ending-state-mismatch", "十歲暑假的 ending 只能存在於 day=7 且 phase=ending 的正式結算狀態。"));
      }
    }

    if (chapter === "青棒第二年") {
      const hasResult = typeof state.highSchoolYearTwoResult === "string"
        && state.highSchoolYearTwoResult.trim() !== "";
      const hasDetail = typeof state.highSchoolYearTwoDetail === "string"
        && state.highSchoolYearTwoDetail.trim() !== "";
      if (hasResult || hasDetail) {
        issues.push(issue(
          "high-school-year-two-result-state-mismatch",
          "青棒第二年的正式結果只能存在於青棒第二年小結。"
        ));
      }
    }

    if (chapter === "青棒第二年小結") {
      const hasResult = typeof state.highSchoolYearTwoResult === "string"
        && state.highSchoolYearTwoResult.trim() !== "";
      const hasDetail = typeof state.highSchoolYearTwoDetail === "string"
        && state.highSchoolYearTwoDetail.trim() !== "";
      if (!hasResult || !hasDetail) {
        issues.push(issue(
          "high-school-year-two-result-missing",
          "青棒第二年小結必須同時保有 result 與 detail。"
        ));
      }
      if (state.highSchoolYearTwoStep !== 8) {
        issues.push(issue(
          "high-school-year-two-result-step-mismatch",
          `青棒第二年小結必須由 step=8 進入，目前為 ${String(state.highSchoolYearTwoStep)}。`
        ));
      }
    }

    if (chapter === "生涯轉換期" && !VALID_CAREER_EXITS.includes(state.careerExit)) {
      issues.push(issue(
        "career-exit-out-of-contract",
        `生涯轉換期的 careerExit 不是現行合法值：${String(state.careerExit || "（空白）")}。Gameplay 仍會依既有規則 fallback 到復健路線。`
      ));
    }

    if (completed && !contractNode.terminal) {
      issues.push(issue("completed-on-nonterminal-node", "completed=true，但目前 chapter 不是終止節點。"));
    }
    if (contractNode.terminal && !completed) {
      issues.push(issue("terminal-node-not-completed", "目前位於終止 chapter，但 completed 並非 true。"));
    }

    const eventExpectation = getRuntimeEventExpectation(state);
    const status = issues.length
      ? "inconsistent"
      : contractNode.terminal && completed
        ? "completed"
        : "recognized";

    return deepFreeze({
      status,
      nodeId: contractNode.id,
      chapter,
      age,
      progressField,
      progressValue,
      completed,
      terminal: contractNode.terminal,
      forcedEventId,
      underlyingEventIds: eventExpectation.underlyingEventIds,
      effectiveEventIds: eventExpectation.effectiveEventIds,
      issues,
      knownIssues: clone(contractNode.knownIssues)
    });
  }

  const api = Object.freeze({
    getNodes,
    getKnownGaps,
    getNodeByChapter,
    getRuntimeEventExpectation,
    getCareerSpineSnapshot
  });

  if (typeof window !== "undefined") window.CareerSpineContract = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})();
