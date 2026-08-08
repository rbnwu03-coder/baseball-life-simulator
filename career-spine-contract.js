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

  const CAREER_NETWORK_METADATA = {
    "high-school-career-exit": {
      careerStage: "high-school-exit",
      networkRole: "initial-exit-record",
      currentContentEndpoint: false,
      transitionGap: false
    },
    "career-transition": {
      careerStage: "adult-transition",
      networkRole: "initial-route-and-shared-transition",
      currentContentEndpoint: false,
      transitionGap: false
    },
    "career-transition-result": {
      careerStage: "adult-transition-result",
      networkRole: "shared-transition-result",
      currentContentEndpoint: false,
      transitionGap: false
    },
    "development-years": {
      careerStage: "adult-development",
      networkRole: "shared-development",
      currentContentEndpoint: false,
      transitionGap: true
    },
    "age-22-career-result": {
      careerStage: "age-22-result",
      networkRole: "current-content-gate",
      currentContentEndpoint: true,
      transitionGap: true
    },
    "vertical-slice-complete": {
      careerStage: "prototype-complete",
      networkRole: "current-terminal",
      currentContentEndpoint: true,
      transitionGap: true
    }
  };

  const CANDIDATE_TRANSITIONS = [
    candidate("college-to-professional", "college", "professional"),
    candidate("college-to-amateur", "college", "amateur"),
    candidate("amateur-to-professional", "amateur", "professional"),
    candidate("professional-to-amateur", "professional", "amateur"),
    candidate("professional-to-baseball-industry", "professional", "baseball-industry"),
    candidate("college-to-baseball-industry", "college", "baseball-industry"),
    candidate("amateur-to-baseball-industry", "amateur", "baseball-industry"),
    candidate("rehab-to-player-reentry", "rehab", "player-competition")
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

  function candidate(id, sourceRoute, targetRoute) {
    return {
      id,
      sourceRoute,
      targetRoute,
      implemented: false,
      eventIds: [],
      contractStatus: "candidate-only"
    };
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
  deepFreeze(CAREER_NETWORK_METADATA);
  deepFreeze(CANDIDATE_TRANSITIONS);

  const NODE_BY_CHAPTER = new Map(NODES.map(item => [item.chapter, item]));
  const NODE_BY_ID = new Map(NODES.map(item => [item.id, item]));

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

  function getActualEdges() {
    const edges = [];
    NODES.forEach(sourceNode => {
      sourceNode.nextChapters.forEach(nextChapter => {
        const targetNode = NODE_BY_CHAPTER.get(nextChapter);
        edges.push({
          id: `${sourceNode.id}->${targetNode?.id || `missing:${nextChapter}`}`,
          fromNodeId: sourceNode.id,
          toNodeId: targetNode?.id || null,
          toChapter: nextChapter,
          implemented: true,
          source: "nextChapters"
        });
      });
    });
    return deepFreeze(clone(edges));
  }

  function getCandidateTransitions() {
    return deepFreeze(clone(CANDIDATE_TRANSITIONS));
  }

  function getDeclaredActualEventIds() {
    const eventIds = [];
    NODES.forEach(contractNode => {
      if (contractNode.entry?.eventId) eventIds.push(contractNode.entry.eventId);
      (contractNode.settlement?.eventIds || []).forEach(eventId => eventIds.push(eventId));
      if (contractNode.route?.kind === "fixed" && contractNode.route.eventId) {
        eventIds.push(contractNode.route.eventId);
      }
      if (contractNode.route?.kind === "steps") {
        contractNode.route.events.forEach(stepEvents => stepEvents.forEach(eventId => eventIds.push(eventId)));
      }
      if (contractNode.route?.kind === "route-steps") {
        Object.values(contractNode.route.routes).forEach(routeEvents => routeEvents.forEach(eventId => eventIds.push(eventId)));
      }
    });
    return [...new Set(eventIds)];
  }

  function getSharedRouteSuffix(routes) {
    const routeLists = Object.values(routes);
    if (!routeLists.length) return [];
    const shortestLength = Math.min(...routeLists.map(routeEvents => routeEvents.length));
    const shared = [];
    for (let offset = 1; offset <= shortestLength; offset += 1) {
      const candidateEventId = routeLists[0][routeLists[0].length - offset];
      if (!routeLists.every(routeEvents => routeEvents[routeEvents.length - offset] === candidateEventId)) break;
      shared.unshift(candidateEventId);
    }
    return shared;
  }

  function getCareerNetwork() {
    const transitionNode = NODE_BY_ID.get("career-transition");
    const routes = transitionNode.route.routes;
    const sharedTransitionEventIds = getSharedRouteSuffix(routes);
    const sharedStartStep = routes.draft.length - sharedTransitionEventIds.length;
    const initialRoutes = Object.entries(routes).map(([routeKey, eventIds]) => ({
      routeKey,
      careerExits: VALID_CAREER_EXITS.filter(value => getAdultRouteKey({ careerExit: value }) === routeKey),
      exclusiveEventIds: eventIds.slice(0, sharedStartStep),
      sharedEventIds: eventIds.slice(sharedStartStep),
      rejoinStep: sharedStartStep
    }));
    const adultNodes = Object.entries(CAREER_NETWORK_METADATA).map(([nodeId, metadata]) => {
      const contractNode = NODE_BY_ID.get(nodeId);
      return Object.assign({
        nodeId,
        chapter: contractNode.chapter,
        age: clone(contractNode.age),
        progress: clone(contractNode.progress),
        settlement: clone(contractNode.settlement),
        actualNextNodeIds: getActualEdges()
          .filter(edge => edge.fromNodeId === nodeId)
          .map(edge => edge.toNodeId)
      }, clone(metadata));
    });
    return deepFreeze({
      adultNodes,
      initialRoutes,
      sharedTransition: {
        nodeId: transitionNode.id,
        startsAtStep: sharedStartStep,
        eventIds: sharedTransitionEventIds
      },
      sharedDevelopment: {
        nodeId: "development-years",
        eventIds: NODE_BY_ID.get("development-years").route.events.map(stepEvents => stepEvents[0])
      },
      currentEndpoint: {
        resultNodeId: "age-22-career-result",
        terminalNodeId: "vertical-slice-complete",
        playableAfterTerminal: false
      },
      actualEdges: getActualEdges(),
      candidateTransitions: getCandidateTransitions()
    });
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

  function hasText(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function getCareerNetworkSegment(contractNode, state, networkMetadata) {
    if (!networkMetadata) return "pre-adult-spine";
    if (contractNode.id === "career-transition") {
      const sharedStartStep = getCareerNetwork().sharedTransition.startsAtStep;
      return Number.isInteger(state.transitionStep) && state.transitionStep >= sharedStartStep
        ? "shared-transition"
        : "route-exclusive-transition";
    }
    return networkMetadata.networkRole;
  }

  function validateAdultState(state, contractNode) {
    const issues = [];
    const adultNode = Boolean(CAREER_NETWORK_METADATA[contractNode.id]);
    if (!adultNode) return issues;

    if (!VALID_CAREER_EXITS.includes(state.careerExit)) {
      issues.push(issue(
        "career-exit-out-of-contract",
        `成年 Career Network 的 careerExit 不是現行合法值：${String(state.careerExit || "（空白）")}。Gameplay 仍會依既有規則 fallback 到復健路線。`
      ));
    }

    if (contractNode.id === "high-school-career-exit") {
      if (state.criticalYearStep !== 8) {
        issues.push(issue("critical-year-result-step-mismatch", `青棒生涯出口必須由 criticalYearStep=8 進入，目前為 ${String(state.criticalYearStep)}。`));
      }
      if (!hasText(state.criticalYearResult) || !hasText(state.criticalYearDetail)) {
        issues.push(issue("critical-year-result-missing", "青棒生涯出口必須保有 criticalYearResult 與 criticalYearDetail。"));
      }
    }

    if (contractNode.id === "career-transition" && (hasText(state.transitionResult) || hasText(state.transitionDetail))) {
      issues.push(issue("transition-result-state-mismatch", "生涯轉換期尚未結算，不應已有 transitionResult 或 transitionDetail。"));
    }
    if (contractNode.id === "career-transition-result") {
      if (state.transitionStep !== 5) {
        issues.push(issue("transition-result-step-mismatch", `生涯轉換期小結必須由 transitionStep=5 進入，目前為 ${String(state.transitionStep)}。`));
      }
      if (!hasText(state.transitionResult) || !hasText(state.transitionDetail)) {
        issues.push(issue("transition-result-missing", "生涯轉換期小結必須保有 transitionResult 與 transitionDetail。"));
      }
    }

    if (contractNode.id === "development-years" && (
      hasText(state.developmentResult) || hasText(state.developmentDetail) || hasText(state.marketOutcome)
    )) {
      issues.push(issue("development-result-state-mismatch", "發展期尚未結算，不應已有 developmentResult、developmentDetail 或 marketOutcome。"));
    }
    if (["age-22-career-result", "vertical-slice-complete"].includes(contractNode.id)) {
      if (state.developmentStep !== 7) {
        issues.push(issue("development-result-step-mismatch", `二十二歲結果必須由 developmentStep=7 進入，目前為 ${String(state.developmentStep)}。`));
      }
      if (!hasText(state.developmentResult) || !hasText(state.developmentDetail) || !hasText(state.marketOutcome)) {
        issues.push(issue("development-result-missing", "二十二歲結果必須保有 developmentResult、developmentDetail 與 marketOutcome。"));
      }
    }
    return issues;
  }

  function getCareerNetworkSnapshot(state) {
    const spineSnapshot = getCareerSpineSnapshot(state);
    const contractNode = spineSnapshot.nodeId ? NODE_BY_ID.get(spineSnapshot.nodeId) : null;
    const networkMetadata = contractNode ? CAREER_NETWORK_METADATA[contractNode.id] || null : null;
    const network = getCareerNetwork();
    const actualNextNodeIds = contractNode
      ? network.actualEdges.filter(edge => edge.fromNodeId === contractNode.id).map(edge => edge.toNodeId)
      : [];
    const adultIssues = contractNode ? validateAdultState(state || {}, contractNode) : [];
    const issues = clone(spineSnapshot.issues).concat(adultIssues);
    const status = spineSnapshot.status === "unknown"
      ? "unknown"
      : issues.length
        ? "inconsistent"
        : spineSnapshot.status;

    return deepFreeze(Object.assign({}, clone(spineSnapshot), {
      status,
      careerStage: networkMetadata?.careerStage || "pre-adult",
      networkSegment: contractNode ? getCareerNetworkSegment(contractNode, state || {}, networkMetadata) : "unknown",
      adultRouteKey: networkMetadata ? getAdultRouteKey(state || {}) : null,
      careerExit: typeof state?.careerExit === "string" ? state.careerExit : "",
      actualNextNodeIds,
      rejoinsOtherRoutes: contractNode?.id === "career-transition"
        && Number.isInteger(state?.transitionStep)
        && state.transitionStep >= network.sharedTransition.startsAtStep,
      currentContentEndpoint: networkMetadata?.currentContentEndpoint === true,
      transitionGap: networkMetadata?.transitionGap === true,
      candidateTransitionIds: [],
      issues
    }));
  }

  function auditCareerNetwork(eventResolver, state) {
    const issues = [];
    const actualEdges = getActualEdges();
    const candidateTransitions = getCandidateTransitions();
    const nodeIds = NODES.map(contractNode => contractNode.id);
    const duplicateNodeIds = nodeIds.filter((nodeId, index) => nodeIds.indexOf(nodeId) !== index);
    duplicateNodeIds.forEach(nodeId => issues.push(issue("duplicate-node-id", `Contract node ID 重複：${nodeId}。`)));

    actualEdges.forEach(edge => {
      if (!NODE_BY_ID.has(edge.fromNodeId) || !edge.toNodeId || !NODE_BY_ID.has(edge.toNodeId)) {
        issues.push(issue("actual-edge-node-missing", `Actual edge 無法解析：${edge.id}。`));
      }
    });

    const reachable = new Set(NODES.length ? [NODES[0].id] : []);
    let changed = true;
    while (changed) {
      changed = false;
      actualEdges.forEach(edge => {
        if (reachable.has(edge.fromNodeId) && edge.toNodeId && !reachable.has(edge.toNodeId)) {
          reachable.add(edge.toNodeId);
          changed = true;
        }
      });
    }
    NODES.forEach(contractNode => {
      if (!reachable.has(contractNode.id)) {
        issues.push(issue("unreachable-actual-node", `正式 Contract node 沒有可達 actual edge：${contractNode.id}。`));
      }
    });

    const actualEdgeIds = new Set(actualEdges.map(edge => edge.id));
    candidateTransitions.forEach(candidateTransition => {
      if (candidateTransition.implemented || candidateTransition.eventIds.length) {
        issues.push(issue("candidate-marked-implemented", `Candidate transition 被標記為已實作：${candidateTransition.id}。`));
      }
      if (actualEdgeIds.has(candidateTransition.id)) {
        issues.push(issue("candidate-mixed-with-actual-edge", `Candidate transition 混入 actual edge：${candidateTransition.id}。`));
      }
    });

    if (typeof eventResolver === "function") {
      getDeclaredActualEventIds().forEach(eventId => {
        if (!eventResolver(eventId)) issues.push(issue("actual-event-missing", `Registry 宣告的事件不存在：${eventId}。`));
      });
      if (state && typeof state === "object") {
        const snapshot = getCareerNetworkSnapshot(state);
        [...snapshot.underlyingEventIds, ...snapshot.effectiveEventIds].forEach(eventId => {
          if (eventId && !eventResolver(eventId)) issues.push(issue("runtime-event-missing", `目前狀態指向不存在的事件：${eventId}。`));
        });
      }
    }

    return deepFreeze({
      status: issues.length ? "error" : "valid",
      nodeCount: NODES.length,
      actualEdgeCount: actualEdges.length,
      candidateTransitionCount: candidateTransitions.length,
      declaredActualEventCount: getDeclaredActualEventIds().length,
      issues
    });
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
    getActualEdges,
    getCandidateTransitions,
    getCareerNetwork,
    getRuntimeEventExpectation,
    getCareerSpineSnapshot,
    getCareerNetworkSnapshot,
    auditCareerNetwork
  });

  if (typeof window !== "undefined") window.CareerSpineContract = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})();
