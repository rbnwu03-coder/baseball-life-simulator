const SAVE_KEY = "baseballLifeRpgSave";

function saveGame() {
  if (!player.name) return showNotice("請先建立角色。", "warning");
  if (typeof isBaseballGameplayPending === "function" && isBaseballGameplayPending()) {
    return showNotice("目前場上處理尚未完成，請完成後再儲存。", "warning");
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(player));
  showNotice("進度已儲存。", "success");
}

function normalizeSave(saved) {
  const sourceSaveVersion = saved.saveVersion;
  const fresh = createInitialPlayer(saved.name || "");
  Object.assign(fresh, saved);
  const savedPrimaryPosition = saved.primaryPosition !== undefined ? saved.primaryPosition : saved.seasonPosition;
  const savedSecondaryPositions = Array.isArray(saved.secondaryPositions)
    ? saved.secondaryPositions
    : saved.secondaryPosition ? [saved.secondaryPosition] : [];
  applyCanonicalPositionProfile(fresh, savedPrimaryPosition || "", savedSecondaryPositions);
  fresh.bats = PlayerIdentityOptions.bats.includes(saved.bats) ? saved.bats : "R";
  fresh.throws = PlayerIdentityOptions.throws.includes(saved.throws) ? saved.throws : "R";
  const legacyIdealSelfMap = {
    "技術鑽研型": "技巧型",
    "直覺天賦型": "全能型",
    "關鍵時刻型": "強打型",
    "團隊核心型": "棒球理解型"
  };
  if (sourceSaveVersion < 15 && legacyIdealSelfMap[fresh.idealSelf]) fresh.idealSelf = legacyIdealSelfMap[fresh.idealSelf];
  const defaultGenesis = createInitialPlayer().characterGenesis;
  fresh.characterGenesis = Object.assign({}, defaultGenesis, saved.characterGenesis || {});
  fresh.characterGenesis.baseRoll = Object.assign({}, defaultGenesis.baseRoll, saved.characterGenesis?.baseRoll || {});
  fresh.characterGenesis.allocation = Object.assign({}, defaultGenesis.allocation, saved.characterGenesis?.allocation || {});
  fresh.characterGenesis.finalAbilities = Object.assign({}, defaultGenesis.finalAbilities, saved.characterGenesis?.finalAbilities || {});
  if (sourceSaveVersion < 15 && fresh.name && !saved.characterGenesis) {
    fresh.characterGenesis.completed = true;
    fresh.characterGenesis.shape = "舊存檔沿用既有成長";
    fresh.characterGenesis.archetype = fresh.idealSelf || "全能型";
    fresh.characterGenesis.initialAspiration = fresh.origin || PlayerIdentityOptions.origins[0];
  }
  if (saved.highSchoolYearTwoStep === undefined) fresh.highSchoolYearTwoStep = 0;
  if (saved.highSchoolYearTwoResult === undefined) fresh.highSchoolYearTwoResult = "";
  if (saved.highSchoolYearTwoDetail === undefined) fresh.highSchoolYearTwoDetail = "";
  fresh.baseballSkills = Object.assign({}, createInitialPlayer().baseballSkills, saved.baseballSkills || {});
  const capabilityState = ensureCapabilityStateShape(fresh);
  const hasVersionedInitialCapability = capabilityState.initialSkillFormulaVersion === INITIAL_SKILL_FORMULA_VERSION
    && UNIVERSAL_BASEBALL_SKILL_KEYS.every(skill => Number.isFinite(Number(capabilityState.initialBaseballSkills?.[skill])) && Number(capabilityState.initialBaseballSkills[skill]) >= 1);
  if (!hasVersionedInitialCapability) {
    const migration = migrateLegacyPlayerCapability(fresh, { sourceSaveVersion });
    if (!migration.ok) throw new Error(`舊存檔 Capability migration 失敗：${migration.error}`);
  }
  else {
    const reachedHighSchool = Number(fresh.age) >= 16 || String(fresh.chapter || "").includes("青棒") || Number(fresh.highSchoolStep) > 0;
    if (reachedHighSchool && capabilityState.initialized !== true) {
      const settlement = settleHighSchoolEntryCapability(fresh, { originType: capabilityState.originType || "save-reload-settlement" });
      if (!settlement.ok) throw new Error(`存檔 Capability settlement 失敗：${settlement.error}`);
    }
  }
  fresh.developmentState = ensureDevelopmentStateShape(fresh, saved.developmentState || null, {
    migrateMissing: true,
    sourceSaveVersion
  });
  fresh.schoolInvitationState = restoreSchoolInvitationState(saved.schoolInvitationState);
  if (typeof ensureSchoolInvitationRosterContexts === "function" && fresh.schoolInvitationState.invitations.length === 4) {
    ensureSchoolInvitationRosterContexts(fresh);
  }
  const reachedHighSchoolStory = Number(fresh.age) >= 16 || /青棒|高中/.test(String(fresh.chapter || "")) || Number(fresh.highSchoolStep) > 0;
  if (reachedHighSchoolStory && !validateSchoolInvitationSet(fresh.schoolInvitationState).ok) {
    markLegacySchoolInvitationCompatibility(fresh, "legacy-existing-school");
  }
  fresh.relationships = Object.assign({}, createInitialPlayer().relationships, saved.relationships || {});
  fresh.positionAffinity = Object.assign({}, createInitialPlayer().positionAffinity, saved.positionAffinity || {});
  fresh.matchState = Object.assign({}, createInitialPlayer().matchState, saved.matchState || {});
  fresh.body = Object.assign({}, createInitialPlayer().body, saved.body || {});
  fresh.personality = Object.assign({}, createInitialPlayer().personality, saved.personality || {});
  fresh.impression = {
    coach: Object.assign({}, createInitialPlayer().impression.coach, saved.impression?.coach || {}),
    azhe: Object.assign({}, createInitialPlayer().impression.azhe, saved.impression?.azhe || {}),
    takahashi: Object.assign({}, createInitialPlayer().impression.takahashi, saved.impression?.takahashi || {}),
    family: Object.assign({}, createInitialPlayer().impression.family, saved.impression?.family || {})
  };
  fresh.characterArc = Object.assign({}, createInitialPlayer().characterArc, saved.characterArc || {});
  fresh.startingCompetition = Object.assign({}, createInitialPlayer().startingCompetition, saved.startingCompetition || {});
  fresh.flags = Array.isArray(saved.flags) ? saved.flags : [];
  fresh.memories = Array.isArray(saved.memories) ? saved.memories : [];
  fresh.pendingEvents = Array.isArray(saved.pendingEvents) ? saved.pendingEvents : [];
  fresh.callbacks = Array.isArray(saved.callbacks) ? saved.callbacks.map(item => Object.assign({ id: "", title: "", sourceFlag: "", chapter: "", resolved: false, impact: 0 }, item)) : [];
  fresh.consequences = Array.isArray(saved.consequences) ? saved.consequences.map(item => Object.assign({ id: "", title: "", active: true, severity: 1 }, item)) : [];
  fresh.lifeThemes = Object.assign({}, createInitialPlayer().lifeThemes, saved.lifeThemes || {});
  const defaultGoals = createInitialPlayer().goalState;
  fresh.goalState = {
    current: saved.goalState?.current ? Object.assign({}, saved.goalState.current) : null,
    short: saved.goalState?.short ? Object.assign({}, saved.goalState.short) : null,
    chapter: saved.goalState?.chapter ? Object.assign({}, saved.goalState.chapter) : null,
    completedGoals: Array.isArray(saved.goalState?.completedGoals) ? saved.goalState.completedGoals : defaultGoals.completedGoals,
    recentProgress: Array.isArray(saved.goalState?.recentProgress) ? saved.goalState.recentProgress : defaultGoals.recentProgress
  };
  fresh.trainingFocus = Object.assign({}, createInitialPlayer().trainingFocus, saved.trainingFocus || {});
  fresh.balanceDebug = Object.assign({}, createInitialPlayer().balanceDebug, saved.balanceDebug || {});
  fresh.juniorSchoolFit = Object.assign({}, createInitialPlayer().juniorSchoolFit, saved.juniorSchoolFit || {});
  fresh.juniorSchoolFit.reasons = Array.isArray(saved.juniorSchoolFit?.reasons) ? saved.juniorSchoolFit.reasons : [];
  fresh.highSchoolValueAssessment = Object.assign({}, createInitialPlayer().highSchoolValueAssessment, saved.highSchoolValueAssessment || {});
  fresh.highSchoolValueAssessment.reasons = Array.isArray(saved.highSchoolValueAssessment?.reasons) ? saved.highSchoolValueAssessment.reasons : [];
  const highSchoolDefaults = createInitialPlayer();
  fresh.highSchoolCoachEvaluation = Object.assign({}, highSchoolDefaults.highSchoolCoachEvaluation, saved.highSchoolCoachEvaluation || {});
  fresh.highSchoolCoachEvaluation.secondaryPositions = Array.isArray(saved.highSchoolCoachEvaluation?.secondaryPositions) ? saved.highSchoolCoachEvaluation.secondaryPositions.slice(0, 1) : [];
  fresh.highSchoolRoleContext = Object.assign({}, highSchoolDefaults.highSchoolRoleContext, saved.highSchoolRoleContext || {});
  fresh.highSchoolRoleContext.evidence = Array.isArray(saved.highSchoolRoleContext?.evidence) ? saved.highSchoolRoleContext.evidence : [];
  fresh.highSchoolCompetitionEvaluation = saved.highSchoolCompetitionEvaluation
    ? (typeof HighSchoolCompetitionReassessment !== "undefined"
      ? HighSchoolCompetitionReassessment.normalizeEvaluationState(saved.highSchoolCompetitionEvaluation)
      : JSON.parse(JSON.stringify(saved.highSchoolCompetitionEvaluation)))
    : null;
  fresh.highSchoolOpportunityHistory = typeof HighSchoolCompetitionReassessment !== "undefined"
    ? HighSchoolCompetitionReassessment.normalizeOpportunityHistory(saved.highSchoolOpportunityHistory)
    : Array.isArray(saved.highSchoolOpportunityHistory) ? saved.highSchoolOpportunityHistory.slice(-5) : [];
  fresh.highSchoolNextOpportunity = saved.highSchoolNextOpportunity
    ? JSON.parse(JSON.stringify(saved.highSchoolNextOpportunity)) : null;
  fresh.highSchoolYearOneStartingRole = typeof saved.highSchoolYearOneStartingRole === "string"
    ? saved.highSchoolYearOneStartingRole : "";
  fresh.highSchoolYearOneMatchHistory = Array.isArray(saved.highSchoolYearOneMatchHistory)
    ? saved.highSchoolYearOneMatchHistory.slice(-2).map(item => JSON.parse(JSON.stringify(item))) : [];
  fresh.highSchoolMatch = Object.assign({}, highSchoolDefaults.highSchoolMatch, saved.highSchoolMatch || {});
  fresh.highSchoolMatch.scores = Object.assign({}, highSchoolDefaults.highSchoolMatch.scores, saved.highSchoolMatch?.scores || {});
  fresh.highSchoolMatch.runners = Array.isArray(saved.highSchoolMatch?.runners) ? saved.highSchoolMatch.runners : [];
  fresh.highSchoolMatch.completedMoments = Array.isArray(saved.highSchoolMatch?.completedMoments)
    ? saved.highSchoolMatch.completedMoments.map(moment => Object.assign({}, moment, {
      scores: Object.assign({}, moment.scores || {}),
      runners: Array.isArray(moment.runners) ? moment.runners.slice(0, 3) : [],
      runnerChanges: Array.isArray(moment.runnerChanges) ? moment.runnerChanges.map(change => Object.assign({}, change)) : [],
      scoringRunnerIds: Array.isArray(moment.scoringRunnerIds) ? moment.scoringRunnerIds.slice() : []
    }))
    : [];
  fresh.highSchoolMatch.playerContribution = Object.assign(
    {},
    highSchoolDefaults.highSchoolMatch.playerContribution,
    saved.highSchoolMatch?.playerContribution || {}
  );
  fresh.highSchoolMatch.performanceEvidence = Object.fromEntries(
    Object.entries(saved.highSchoolMatch?.performanceEvidence || {}).map(([actorId, evidence]) => [
      actorId,
      Object.assign({}, evidence)
    ])
  );
  fresh.highSchoolMatch.battingOrderIndex = Object.assign(
    {},
    highSchoolDefaults.highSchoolMatch.battingOrderIndex,
    saved.highSchoolMatch?.battingOrderIndex || {}
  );
  let previousHighSchoolPresentationSnapshot = null;
  fresh.highSchoolMatch.simulationLog = Array.isArray(saved.highSchoolMatch?.simulationLog)
    ? saved.highSchoolMatch.simulationLog.map((item, index) => {
      const scores = item.scores ? Object.assign({}, item.scores) : item.scores;
      const before = item.before ? Object.assign({}, item.before, {
        scores: Object.assign({}, item.before.scores || {}),
        runners: Array.isArray(item.before.runners) ? item.before.runners.slice(0, 3) : []
      }) : item.before;
      const after = item.after ? Object.assign({}, item.after, {
        scores: Object.assign({}, item.after.scores || {}),
        runners: Array.isArray(item.after.runners) ? item.after.runners.slice(0, 3) : []
      }) : item.after;
      const eventFacts = {};
      if (Array.isArray(item.runnerChanges)) eventFacts.runnerChanges = item.runnerChanges.map(change => Object.assign({}, change));
      if (Array.isArray(item.scoringRunnerIds)) eventFacts.scoringRunnerIds = item.scoringRunnerIds.slice();
      const sourceSnapshot = item.presentationSnapshot || item.after || item;
      const fallbackSnapshot = previousHighSchoolPresentationSnapshot || {
        inning: 1, half: "上", outs: 0, runners: [], scores: { home: 0, away: 0 },
        lineScoreRevealHalfIndex: 0, assignment: "", position: "", currentBatter: "", battingOrderSlot: 0
      };
      const snapshotScores = sourceSnapshot.scores || scores || fallbackSnapshot.scores;
      const snapshotRunners = Array.isArray(sourceSnapshot.runners) ? sourceSnapshot.runners : fallbackSnapshot.runners;
      const presentationSnapshot = Object.freeze({
        inning: Math.max(1, Math.floor(Number(sourceSnapshot.inning ?? fallbackSnapshot.inning) || 1)),
        half: ["上", "下", "終"].includes(sourceSnapshot.half) ? sourceSnapshot.half : fallbackSnapshot.half,
        outs: Math.max(0, Math.min(3, Math.floor(Number(sourceSnapshot.outs ?? fallbackSnapshot.outs) || 0))),
        runners: Object.freeze(snapshotRunners.slice(0, 3)),
        scores: Object.freeze({ home: Number(snapshotScores.home) || 0, away: Number(snapshotScores.away) || 0 }),
        lineScoreRevealHalfIndex: Math.max(0, Math.floor(Number(sourceSnapshot.lineScoreRevealHalfIndex ?? fallbackSnapshot.lineScoreRevealHalfIndex) || 0)),
        assignment: typeof sourceSnapshot.assignment === "string" ? sourceSnapshot.assignment : fallbackSnapshot.assignment,
        position: typeof sourceSnapshot.position === "string" ? sourceSnapshot.position : fallbackSnapshot.position,
        currentBatter: typeof sourceSnapshot.currentBatter === "string" ? sourceSnapshot.currentBatter : fallbackSnapshot.currentBatter,
        battingOrderSlot: Math.max(0, Math.floor(Number(sourceSnapshot.battingOrderSlot ?? fallbackSnapshot.battingOrderSlot) || 0))
      });
      previousHighSchoolPresentationSnapshot = presentationSnapshot;
      return Object.assign({ sequence: index }, item, {
        presentationImportance: item.presentationImportance || (item.type === "matchEntry" ? "hidden" : "visible"),
        scores, before, after, ...eventFacts, presentationSnapshot
      });
    })
    : [];
  fresh.highSchoolMatch.lastDefensiveResolution = saved.highSchoolMatch?.lastDefensiveResolution
    ? Object.assign(JSON.parse(JSON.stringify(saved.highSchoolMatch.lastDefensiveResolution)), {
      runnerChanges: Array.isArray(saved.highSchoolMatch.lastDefensiveResolution.runnerChanges)
        ? saved.highSchoolMatch.lastDefensiveResolution.runnerChanges.map(change => Object.assign({}, change)) : [],
      scoringRunnerIds: Array.isArray(saved.highSchoolMatch.lastDefensiveResolution.scoringRunnerIds)
        ? saved.highSchoolMatch.lastDefensiveResolution.scoringRunnerIds.slice() : [],
      runnersAfter: Array.isArray(saved.highSchoolMatch.lastDefensiveResolution.runnersAfter)
        ? saved.highSchoolMatch.lastDefensiveResolution.runnersAfter.slice(0, 3) : []
    })
    : null;
  fresh.highSchoolMatch.regulationInnings = Number(saved.highSchoolMatch?.regulationInnings) > 0
    ? Number(saved.highSchoolMatch.regulationInnings)
    : highSchoolDefaults.highSchoolMatch.regulationInnings;
  fresh.highSchoolMatch.lineScore = {
    home: Array.isArray(saved.highSchoolMatch?.lineScore?.home) ? saved.highSchoolMatch.lineScore.home.map(run => run === null ? null : Math.max(0, Number(run) || 0)) : [],
    away: Array.isArray(saved.highSchoolMatch?.lineScore?.away) ? saved.highSchoolMatch.lineScore.away.map(run => run === null ? null : Math.max(0, Number(run) || 0)) : []
  };
  // Migration boundary: clamp the exclusive "next unseen event" cursor to the restored log.
  fresh.highSchoolMatch.presentedEventCursor = Math.min(
    fresh.highSchoolMatch.simulationLog.length,
    Math.max(0, Number(saved.highSchoolMatch?.presentedEventCursor) || 0)
  );
  const readyHighSchoolMoment = ["moment_1_ready", "moment_2_ready", "moment_3_ready"].includes(fresh.highSchoolMatch.simulationPhase);
  const readyHighSchoolAgency = fresh.highSchoolMatch.simulationPhase === "offensive_agency_ready"
    && fresh.highSchoolMatch.offensivePlayerAgencyState?.status === "pending";
  const hasReadyHighSchoolMomentEvent = fresh.highSchoolMatch.simulationLog.some(item =>
    (readyHighSchoolAgency ? item.type === "playerAgencyOpportunityReached"
      && item.agencyIdentity === fresh.highSchoolMatch.offensivePlayerAgencyState?.agencyIdentity
      : item.type === "meaningfulMomentReached" && (!item.momentId || item.momentId === fresh.highSchoolMatch.currentMomentId))
  );
  if ((readyHighSchoolMoment || readyHighSchoolAgency) && !hasReadyHighSchoolMomentEvent) {
    const scores = Object.freeze({
      home: Number(fresh.highSchoolMatch.scores?.home) || 0,
      away: Number(fresh.highSchoolMatch.scores?.away) || 0
    });
    const runners = Object.freeze((Array.isArray(fresh.highSchoolMatch.runners) ? fresh.highSchoolMatch.runners : []).slice(0, 3));
    fresh.highSchoolMatch.simulationLog.push({
      sequence: fresh.highSchoolMatch.simulationLog.length,
      type: readyHighSchoolAgency ? "playerAgencyOpportunityReached" : "meaningfulMomentReached",
      agencyIdentity: readyHighSchoolAgency ? fresh.highSchoolMatch.offensivePlayerAgencyState.agencyIdentity : undefined,
      agencyReason: readyHighSchoolAgency ? fresh.highSchoolMatch.offensivePlayerAgencyState.agencyReason : undefined,
      momentId: fresh.highSchoolMatch.currentMomentId || "",
      domain: fresh.highSchoolMatch.currentDomain || "",
      inning: Math.max(1, Number(fresh.highSchoolMatch.inning) || 1),
      half: fresh.highSchoolMatch.half || "上",
      outs: Math.max(0, Math.min(3, Number(fresh.highSchoolMatch.outs) || 0)),
      scores,
      runners,
      assignment: fresh.highSchoolMatch.currentAssignment || fresh.highSchoolMatch.assignment || "",
      presentationImportance: "attention",
      presentationSnapshot: Object.freeze({
        inning: Math.max(1, Number(fresh.highSchoolMatch.inning) || 1),
        half: fresh.highSchoolMatch.half || "上",
        outs: Math.max(0, Math.min(3, Number(fresh.highSchoolMatch.outs) || 0)),
        runners,
        scores,
        lineScoreRevealHalfIndex: Math.max(0, Number(fresh.highSchoolMatch.scoreboardRevealHalfIndex) || 0),
        assignment: fresh.highSchoolMatch.currentAssignment || fresh.highSchoolMatch.assignment || "",
        position: fresh.highSchoolMatch.currentFieldingPosition || fresh.highSchoolMatch.playerFieldingAssignment || fresh.highSchoolMatch.position || "",
        currentBatter: fresh.highSchoolMatch.currentBatter || "",
        battingOrderSlot: Math.max(0, Number(fresh.highSchoolMatch.battingOrderIndex?.[fresh.highSchoolMatch.offenseTeam]) || 0)
      })
    });
    fresh.highSchoolMatch.presentedEventCursor = fresh.highSchoolMatch.simulationLog.length;
  }
  fresh.highSchoolMatch.scoreboardRevealHalfIndex = Math.max(
    0,
    Math.floor(Number(saved.highSchoolMatch?.scoreboardRevealHalfIndex) || 0)
  );
  fresh.highSchoolMatch.playerLineupStatus = ["starter", "bench", "substitute"].includes(saved.highSchoolMatch?.playerLineupStatus)
    ? saved.highSchoolMatch.playerLineupStatus : highSchoolDefaults.highSchoolMatch.playerLineupStatus;
  fresh.highSchoolMatch.playerLineupSlot = Number.isInteger(saved.highSchoolMatch?.playerLineupSlot)
    ? saved.highSchoolMatch.playerLineupSlot : highSchoolDefaults.highSchoolMatch.playerLineupSlot;
  fresh.highSchoolMatch.playerFieldingAssignment = typeof saved.highSchoolMatch?.playerFieldingAssignment === "string"
    ? saved.highSchoolMatch.playerFieldingAssignment : "";
  fresh.highSchoolMatch.playerEntryWindowInning = Math.max(1, Number(saved.highSchoolMatch?.playerEntryWindowInning) || highSchoolDefaults.highSchoolMatch.playerEntryWindowInning);
  fresh.highSchoolMatch.playerEntryCompleted = saved.highSchoolMatch?.playerEntryCompleted === true;
  fresh.highSchoolMatch.developmentFullMatchStart = saved.highSchoolMatch?.developmentFullMatchStart === true;
  fresh.highSchoolMatch.gameExposureState = saved.highSchoolMatch?.gameExposureState
    ? (typeof PlayingTimeGameExposure !== "undefined"
      ? PlayingTimeGameExposure.normalizeGameExposureState(saved.highSchoolMatch.gameExposureState, fresh.highSchoolMatch.id)
      : JSON.parse(JSON.stringify(saved.highSchoolMatch.gameExposureState)))
    : null;
  fresh.highSchoolMatch.developmentPositionOverride = typeof saved.highSchoolMatch?.developmentPositionOverride === "string"
    ? saved.highSchoolMatch.developmentPositionOverride : "";
  if (Object.prototype.hasOwnProperty.call(saved.highSchoolMatch || {}, "developmentTestCapabilityOverride")) {
    fresh.highSchoolMatch.developmentTestCapabilityOverride = saved.highSchoolMatch.developmentTestCapabilityOverride
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.developmentTestCapabilityOverride)) : null;
  } else {
    delete fresh.highSchoolMatch.developmentTestCapabilityOverride;
  }
  fresh.highSchoolMatch.coachTacticalDirection = Object.assign(
    {},
    highSchoolDefaults.highSchoolMatch.coachTacticalDirection,
    saved.highSchoolMatch?.coachTacticalDirection || {}
  );
  fresh.highSchoolMatch.coachTacticalContextSignature = typeof saved.highSchoolMatch?.coachTacticalContextSignature === "string"
    ? saved.highSchoolMatch.coachTacticalContextSignature : "";
  fresh.highSchoolMatch.opponentTacticalTruth = Object.assign(
    {},
    highSchoolDefaults.highSchoolMatch.opponentTacticalTruth,
    saved.highSchoolMatch?.opponentTacticalTruth || {}
  );
  fresh.highSchoolMatch.ballContext = Object.assign(
    {},
    highSchoolDefaults.highSchoolMatch.ballContext,
    saved.highSchoolMatch?.ballContext || {}
  );
  fresh.highSchoolMatch.positionDecisionFamily = typeof saved.highSchoolMatch?.positionDecisionFamily === "string"
    ? saved.highSchoolMatch.positionDecisionFamily : "";
  fresh.highSchoolMatch.currentFieldingPosition = typeof saved.highSchoolMatch?.currentFieldingPosition === "string"
    ? saved.highSchoolMatch.currentFieldingPosition : "";
  fresh.highSchoolMatch.defensiveSituation = saved.highSchoolMatch?.defensiveSituation
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.defensiveSituation))
    : {};
  fresh.highSchoolMatch.pendingHalfInningTermination = saved.highSchoolMatch?.pendingHalfInningTermination
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.pendingHalfInningTermination)) : null;
  fresh.highSchoolMatch.catcherDecisionState = saved.highSchoolMatch?.catcherDecisionState
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.catcherDecisionState)) : null;
  fresh.highSchoolMatch.catcherReassessmentTrigger = saved.highSchoolMatch?.catcherReassessmentTrigger
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.catcherReassessmentTrigger)) : null;
  fresh.highSchoolMatch.playerEventClassification = ["ordinaryPlay", "playerRoutinePlay", "playerMeaningfulDecision"].includes(saved.highSchoolMatch?.playerEventClassification)
    ? saved.highSchoolMatch.playerEventClassification : "ordinaryPlay";
  fresh.highSchoolMatch.decisionTension = ["none", "low", "meaningful", "high"].includes(saved.highSchoolMatch?.decisionTension)
    ? saved.highSchoolMatch.decisionTension : "none";
  fresh.highSchoolMatch.decisionGate = saved.highSchoolMatch?.decisionGate
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.decisionGate)) : null;
  fresh.highSchoolMatch.matchDecisionDensityState = typeof normalizeHighSchoolMatchDecisionDensityState === "function"
    ? normalizeHighSchoolMatchDecisionDensityState(saved.highSchoolMatch?.matchDecisionDensityState)
    : Object.assign({}, highSchoolDefaults.highSchoolMatch.matchDecisionDensityState, saved.highSchoolMatch?.matchDecisionDensityState || {}, {
      recentSituationFamilies: Array.isArray(saved.highSchoolMatch?.matchDecisionDensityState?.recentSituationFamilies)
        ? saved.highSchoolMatch.matchDecisionDensityState.recentSituationFamilies.slice(-6) : [],
      recentRouteFamilies: Array.isArray(saved.highSchoolMatch?.matchDecisionDensityState?.recentRouteFamilies)
        ? saved.highSchoolMatch.matchDecisionDensityState.recentRouteFamilies.slice(-6) : []
    });
  fresh.highSchoolMatch.pendingDefensiveResumeState = saved.highSchoolMatch?.pendingDefensiveResumeState
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.pendingDefensiveResumeState)) : null;
  fresh.highSchoolMatch.pitcherRuntimeState = typeof PitchSequencing !== "undefined"
    ? PitchSequencing.normalizePitcherRuntimeState(saved.highSchoolMatch?.pitcherRuntimeState, {
      runtimeId: `${fresh.highSchoolMatch.id || "match"}|opponent-pitcher`,
      responseProfile: typeof PitcherMentalState !== "undefined" ? PitcherMentalState.RESPONSE_PROFILE_FIXTURES.simplifyReset : undefined,
      control: 8
    })
    : saved.highSchoolMatch?.pitcherRuntimeState
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.pitcherRuntimeState)) : null;
  fresh.highSchoolMatch.pitcherSequencingDebugTrace = Array.isArray(saved.highSchoolMatch?.pitcherSequencingDebugTrace)
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.pitcherSequencingDebugTrace.slice(-40))) : [];
  fresh.highSchoolMatch.pitcherObservableHistory = Array.isArray(saved.highSchoolMatch?.pitcherObservableHistory)
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.pitcherObservableHistory.slice(-16))) : [];
  fresh.highSchoolMatch.pitcherTacticalSequenceHistory = typeof PitcherCatcherTacticalIntegration !== "undefined"
    ? JSON.parse(JSON.stringify(PitcherCatcherTacticalIntegration.normalizeSequenceHistory(saved.highSchoolMatch?.pitcherTacticalSequenceHistory)))
    : Array.isArray(saved.highSchoolMatch?.pitcherTacticalSequenceHistory)
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.pitcherTacticalSequenceHistory.slice(-6))) : [];
  fresh.highSchoolMatch.pitcherTacticalDebugTrace = Array.isArray(saved.highSchoolMatch?.pitcherTacticalDebugTrace)
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.pitcherTacticalDebugTrace.slice(-40))) : [];
  fresh.highSchoolMatch.batterAnticipationState = saved.highSchoolMatch?.batterAnticipationState
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.batterAnticipationState)) : null;
  fresh.highSchoolMatch.prePitchPlanningState = saved.highSchoolMatch?.prePitchPlanningState
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.prePitchPlanningState)) : null;
  fresh.highSchoolMatch.offensivePlateAppearanceState = typeof OffensivePlateApproach !== "undefined"
    ? OffensivePlateApproach.normalizePlateAppearanceState(saved.highSchoolMatch?.offensivePlateAppearanceState)
    : saved.highSchoolMatch?.offensivePlateAppearanceState
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.offensivePlateAppearanceState)) : null;
  fresh.highSchoolMatch.plateDecisionState = saved.highSchoolMatch?.plateDecisionState
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.plateDecisionState)) : null;
  fresh.highSchoolMatch.pendingOffensiveOpportunity = saved.highSchoolMatch?.pendingOffensiveOpportunity
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.pendingOffensiveOpportunity)) : null;
  fresh.highSchoolMatch.offensivePlayerAgencyState = saved.highSchoolMatch?.offensivePlayerAgencyState
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.offensivePlayerAgencyState)) : null;
  fresh.highSchoolMatch.offensiveTacticalActionState = typeof OffensiveTacticalAction !== "undefined"
    ? OffensiveTacticalAction.normalizeTacticalActionState(saved.highSchoolMatch?.offensiveTacticalActionState)
    : saved.highSchoolMatch?.offensiveTacticalActionState
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.offensiveTacticalActionState)) : null;
  fresh.highSchoolMatch.offensiveBuntPAState = typeof OffensiveBuntExecution !== "undefined"
    ? OffensiveBuntExecution.normalizePATacticalPlan(saved.highSchoolMatch?.offensiveBuntPAState)
    : saved.highSchoolMatch?.offensiveBuntPAState
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.offensiveBuntPAState)) : null;
  fresh.highSchoolMatch.buntBallInPlayState = typeof OffensiveBuntDefensiveHandoff !== "undefined"
    ? OffensiveBuntDefensiveHandoff.normalizeHandoff(saved.highSchoolMatch?.buntBallInPlayState)
    : saved.highSchoolMatch?.buntBallInPlayState
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.buntBallInPlayState)) : null;
  fresh.highSchoolMatch.ordinaryDefensivePlateAppearanceState = typeof OffensivePlateApproach !== "undefined"
    ? OffensivePlateApproach.normalizePlateAppearanceState(saved.highSchoolMatch?.ordinaryDefensivePlateAppearanceState)
    : saved.highSchoolMatch?.ordinaryDefensivePlateAppearanceState
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.ordinaryDefensivePlateAppearanceState)) : null;
  fresh.highSchoolMatch.groundBallInPlayState = typeof BattedBallGroundDefense !== "undefined"
    ? BattedBallGroundDefense.normalizeHandoff(saved.highSchoolMatch?.groundBallInPlayState)
    : saved.highSchoolMatch?.groundBallInPlayState
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.groundBallInPlayState)) : null;
  fresh.highSchoolMatch.lineDriveCatchState = typeof BattedBallLineDriveDefense !== "undefined"
    ? BattedBallLineDriveDefense.normalizeCatchState(saved.highSchoolMatch?.lineDriveCatchState)
    : saved.highSchoolMatch?.lineDriveCatchState
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.lineDriveCatchState)) : null;
  fresh.highSchoolMatch.flyBallCatchState = typeof BattedBallFlyBallDefense !== "undefined"
    ? BattedBallFlyBallDefense.normalizeFlyBallCatchState(saved.highSchoolMatch?.flyBallCatchState)
    : saved.highSchoolMatch?.flyBallCatchState
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.flyBallCatchState)) : null;
  fresh.highSchoolMatch.activeSituation = typeof MatchSituationLifecycle !== "undefined"
    ? MatchSituationLifecycle.normalizeSituation(saved.highSchoolMatch?.activeSituation)
    : saved.highSchoolMatch?.activeSituation
      ? JSON.parse(JSON.stringify(saved.highSchoolMatch.activeSituation)) : null;
  fresh.highSchoolMatch.lastClosedSituationSummary = saved.highSchoolMatch?.lastClosedSituationSummary
    ? JSON.parse(JSON.stringify(saved.highSchoolMatch.lastClosedSituationSummary)) : null;
  fresh.highSchoolMatch.lastDefensiveResolution = Object.assign(
    {},
    highSchoolDefaults.highSchoolMatch.lastDefensiveResolution,
    saved.highSchoolMatch?.lastDefensiveResolution ? JSON.parse(JSON.stringify(saved.highSchoolMatch.lastDefensiveResolution)) : {}
  );
  fresh.highSchoolMatch.eventSettlementApplied = saved.highSchoolMatch?.eventSettlementApplied === true;
  const hasDevelopmentPresentationFlag = Object.prototype.hasOwnProperty.call(saved.highSchoolMatch || {}, "developmentPresentationCompleted");
  fresh.highSchoolMatch.developmentPresentationCompleted = hasDevelopmentPresentationFlag
    ? saved.highSchoolMatch.developmentPresentationCompleted === true
    : Boolean(saved.highSchoolMatch?.eventSettlementApplied && saved.highSchoolMatch?.matchExperience?.settled !== true);
  fresh.highSchoolMatch.matchExperience = typeof MatchExperienceDevelopment !== "undefined"
    ? MatchExperienceDevelopment.normalizeMatchExperienceState(saved.highSchoolMatch?.matchExperience, fresh.highSchoolMatch)
    : saved.highSchoolMatch?.matchExperience ? JSON.parse(JSON.stringify(saved.highSchoolMatch.matchExperience)) : null;
  fresh.highSchoolMatch.rosters = saved.highSchoolMatch?.rosters
    ? {
      home: saved.highSchoolMatch.rosters.home ? Object.assign({}, JSON.parse(JSON.stringify(saved.highSchoolMatch.rosters.home)), {
        lineup: Array.isArray(saved.highSchoolMatch.rosters.home.lineup) ? saved.highSchoolMatch.rosters.home.lineup.map(item => Object.assign({}, item)) : [],
        bench: Array.isArray(saved.highSchoolMatch.rosters.home.bench) ? saved.highSchoolMatch.rosters.home.bench.map(item => Object.assign({}, item)) : []
      }) : null,
      away: saved.highSchoolMatch.rosters.away ? Object.assign({}, JSON.parse(JSON.stringify(saved.highSchoolMatch.rosters.away)), {
        lineup: Array.isArray(saved.highSchoolMatch.rosters.away.lineup) ? saved.highSchoolMatch.rosters.away.lineup.map(item => Object.assign({}, item)) : [],
        bench: Array.isArray(saved.highSchoolMatch.rosters.away.bench) ? saved.highSchoolMatch.rosters.away.bench.map(item => Object.assign({}, item)) : []
      }) : null
    }
    : { home: null, away: null };
  if (
    saved.highSchoolMatch?.id === "hs-y1-autumn-exhibition" &&
    (
      saved.highSchoolMatch?.momentIndex === undefined ||
      typeof saved.highSchoolMatch?.simulationPhase !== "string" ||
      !Array.isArray(saved.highSchoolMatch?.rosters?.home?.lineup) ||
      !Array.isArray(saved.highSchoolMatch?.rosters?.away?.lineup) ||
      !Array.isArray(saved.highSchoolMatch?.lineScore?.home) ||
      !Array.isArray(saved.highSchoolMatch?.lineScore?.away)
    ) &&
    saved.highSchoolMatch?.completed !== true
  ) {
    fresh.highSchoolMatch = Object.assign({}, highSchoolDefaults.highSchoolMatch);
    fresh.highSchoolMatch.scores = Object.assign({}, highSchoolDefaults.highSchoolMatch.scores);
    fresh.highSchoolMatch.runners = [];
    fresh.highSchoolMatch.completedMoments = [];
    fresh.highSchoolMatch.playerContribution = Object.assign({}, highSchoolDefaults.highSchoolMatch.playerContribution);
    fresh.highSchoolMatch.battingOrderIndex = Object.assign({}, highSchoolDefaults.highSchoolMatch.battingOrderIndex);
    fresh.highSchoolMatch.lineScore = { home: [], away: [] };
    fresh.highSchoolMatch.simulationLog = [];
    fresh.highSchoolMatch.coachTacticalDirection = Object.assign({}, highSchoolDefaults.highSchoolMatch.coachTacticalDirection);
    fresh.highSchoolMatch.coachTacticalContextSignature = "";
    fresh.highSchoolMatch.ballContext = Object.assign({}, highSchoolDefaults.highSchoolMatch.ballContext);
    fresh.highSchoolMatch.positionDecisionFamily = "";
    fresh.highSchoolMatch.currentFieldingPosition = "";
    fresh.highSchoolMatch.defensiveSituation = {};
    fresh.highSchoolMatch.lastDefensiveResolution = Object.assign({}, highSchoolDefaults.highSchoolMatch.lastDefensiveResolution);
    fresh.highSchoolMatch.rosters = { home: null, away: null };
  }
  fresh.highSchoolAzheEcho = Object.assign({}, highSchoolDefaults.highSchoolAzheEcho, saved.highSchoolAzheEcho || {});
  fresh.highSchoolAzheEcho.evidence = Array.isArray(saved.highSchoolAzheEcho?.evidence) ? saved.highSchoolAzheEcho.evidence : [];
  fresh.highSchoolRivalContext = Object.assign({}, highSchoolDefaults.highSchoolRivalContext, saved.highSchoolRivalContext || {});
  const legacyCompletedYearOne = sourceSaveVersion < 15 && (
    fresh.chapter === "青棒第一年小結" ||
    fresh.chapter === "青棒第二年" ||
    fresh.chapter === "青棒第二年小結" ||
    fresh.chapter === "青棒關鍵年" ||
    fresh.age > 18
  );
  if (legacyCompletedYearOne) {
    fresh.highSchoolYearOneComplete = true;
    if (fresh.chapter === "青棒第一年小結" && fresh.highSchoolStep < 8) fresh.highSchoolStep = 8;
    if (!fresh.highSchoolMatch.completed) {
      fresh.highSchoolMatch = Object.assign({}, fresh.highSchoolMatch, {
        id: "legacy-high-school-year-one",
        opponent: "舊存檔既有對手",
        role: fresh.highSchoolRoleCode || "legacy",
        position: fresh.primaryPosition,
        assignment: "舊版高中第一年比賽紀錄",
        outcome: fresh.highSchoolResult || "已完成",
        consequence: fresh.highSchoolDetail || "由舊存檔承接",
        completed: true
      });
    }
  }
  fresh.careerValue = Object.assign({}, createInitialPlayer().careerValue, saved.careerValue || {});
  fresh.careerValue.history = Array.isArray(saved.careerValue?.history) ? saved.careerValue.history : [fresh.careerValue.current];
  fresh.roleIdentity = Object.assign({}, createInitialPlayer().roleIdentity, saved.roleIdentity || {});
  fresh.roleIdentity.previous = Array.isArray(saved.roleIdentity?.previous) ? saved.roleIdentity.previous : [];
  fresh.roleIdentity.previousArchetypes = Array.isArray(saved.roleIdentity?.previousArchetypes) ? saved.roleIdentity.previousArchetypes : [];
  fresh.careerArc = Object.assign({}, createInitialPlayer().careerArc, saved.careerArc || {});
  fresh.turningPoints = Array.isArray(saved.turningPoints) ? saved.turningPoints : [];
  fresh.marketEvaluation = Object.assign({}, createInitialPlayer().marketEvaluation, saved.marketEvaluation || {});
  fresh.lifeEvents = Array.isArray(saved.lifeEvents) ? saved.lifeEvents : [];
  fresh.emotionalPeaks = Array.isArray(saved.emotionalPeaks) ? saved.emotionalPeaks : [];
  fresh.lowPoints = Array.isArray(saved.lowPoints) ? saved.lowPoints : [];
  fresh.npcEmotionalCallbacks = Array.isArray(saved.npcEmotionalCallbacks) ? saved.npcEmotionalCallbacks : [];
  fresh.chapterEndings = Array.isArray(saved.chapterEndings) ? saved.chapterEndings : [];
  fresh.replayMemories = Array.isArray(saved.replayMemories) ? saved.replayMemories : [];
  fresh.signatureScenes = Array.isArray(saved.signatureScenes) ? saved.signatureScenes : [];
  fresh.symbolObjects = Array.isArray(saved.symbolObjects) ? saved.symbolObjects : [];
  fresh.narrativeThread = Object.assign({}, createInitialPlayer().narrativeThread, saved.narrativeThread || {});
  fresh.narrativeThread.history = Array.isArray(saved.narrativeThread?.history) ? saved.narrativeThread.history : [];
  fresh.continuityOutcomes = Array.isArray(saved.continuityOutcomes) ? saved.continuityOutcomes : [];
  fresh.relationshipPayoffs = Array.isArray(saved.relationshipPayoffs) ? saved.relationshipPayoffs : [];
  fresh.aspirationState = Object.assign({}, createInitialPlayer().aspirationState, saved.aspirationState || {});
  fresh.aspirationMoments = Array.isArray(saved.aspirationMoments) ? saved.aspirationMoments : [];
  if (saved.chapter2Step === undefined && fresh.chapter === "少棒入門") {
    fresh.chapter2Step = fresh.chapter2Phase === "intro" ? 0 : fresh.chapter2Day === 1 ? 1 : fresh.chapter2Day === 2 ? 3 : 5;
  }
  if (
    sourceSaveVersion === 13 &&
    saved.age22OutcomeCode === undefined &&
    ["二十二歲職涯小結", "垂直切片完成"].includes(fresh.chapter) &&
    typeof CareerAge22OutcomeResolver === "object" &&
    typeof CareerAge22OutcomeResolver.resolveLegacyOutcome === "function"
  ) {
    const migratedOutcome = CareerAge22OutcomeResolver.resolveLegacyOutcome({
      careerExit: fresh.careerExit,
      marketOutcome: fresh.marketOutcome
    });
    if (migratedOutcome?.resolved) {
      fresh.age22OutcomeCode = migratedOutcome.outcomeCode;
    }
  }
  fresh.saveVersion = SAVE_VERSION;
  return fresh;
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return showNotice("目前沒有可讀取的存檔。", "warning");
  try {
    const candidate = normalizeSave(JSON.parse(raw));
    if (
      typeof AdultCareerSaveAdmission !== "object" ||
      typeof AdultCareerSaveAdmission.evaluate !== "function"
    ) {
      showNotice("存檔驗證模組無法使用，無法讀取。", "error");
      return;
    }

    const admission = AdultCareerSaveAdmission.evaluate(candidate);
    if (!admission || admission.admitted !== true) {
      showNotice("存檔生涯狀態不一致，無法讀取。", "error");
      return;
    }

    if (typeof stopHighSchoolMatchPlayback === "function") stopHighSchoolMatchPlayback();
    if (typeof clearPendingBaseballGameplay === "function") clearPendingBaseballGameplay();
    if (typeof clearTransientYouthSeasonOutcome === "function") clearTransientYouthSeasonOutcome();
    if (typeof clearPendingSchoolInvitationSelection === "function") clearPendingSchoolInvitationSelection();
    player = candidate;
    if (typeof recordHighSchoolMatchOpportunityCheckpoint === "function" && player.highSchoolMatch?.opportunityDebugTrace) {
      recordHighSchoolMatchOpportunityCheckpoint("save-reload-restored", player.highSchoolMatch);
    }
    document.getElementById("characterCreation").style.display = "none";
    showCurrentEvent();
    if (typeof ensureMatchPlaybackLiveness === "function" && getCurrentEventId() === "high_school_showcase") {
      ensureMatchPlaybackLiveness("active-match-reload", player.highSchoolMatch);
    }
    showNotice("進度讀取完成。", "success");
  } catch (error) {
    console.error(error);
    showNotice("存檔損壞，無法讀取。", "error");
  }
}

function deleteSave() {
  if (typeof stopHighSchoolMatchPlayback === "function") stopHighSchoolMatchPlayback();
  localStorage.removeItem(SAVE_KEY);
  if (typeof clearPendingBaseballGameplay === "function") clearPendingBaseballGameplay();
  if (typeof clearPendingSchoolInvitationSelection === "function") clearPendingSchoolInvitationSelection();
  player = createInitialPlayer();
  document.getElementById("characterCreation").style.display = "block";
  document.getElementById("story").innerHTML = "";
  document.getElementById("choices").innerHTML = "";
  showNotice("存檔已刪除，可以開始新人生。", "success");
  updateStatus();
}
