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
  fresh.highSchoolMatch = Object.assign({}, highSchoolDefaults.highSchoolMatch, saved.highSchoolMatch || {});
  fresh.highSchoolMatch.scores = Object.assign({}, highSchoolDefaults.highSchoolMatch.scores, saved.highSchoolMatch?.scores || {});
  fresh.highSchoolMatch.runners = Array.isArray(saved.highSchoolMatch?.runners) ? saved.highSchoolMatch.runners : [];
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

    if (typeof clearPendingBaseballGameplay === "function") clearPendingBaseballGameplay();
    player = candidate;
    document.getElementById("characterCreation").style.display = "none";
    showCurrentEvent();
    showNotice("進度讀取完成。", "success");
  } catch (error) {
    console.error(error);
    showNotice("存檔損壞，無法讀取。", "error");
  }
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  if (typeof clearPendingBaseballGameplay === "function") clearPendingBaseballGameplay();
  player = createInitialPlayer();
  document.getElementById("characterCreation").style.display = "block";
  document.getElementById("story").innerHTML = "";
  document.getElementById("choices").innerHTML = "";
  showNotice("存檔已刪除，可以開始新人生。", "success");
  updateStatus();
}
