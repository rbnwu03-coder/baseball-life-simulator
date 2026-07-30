const SAVE_KEY = "baseballLifeRpgSave";

function saveGame() {
  if (!player.name) return showNotice("請先建立角色。", "warning");
  localStorage.setItem(SAVE_KEY, JSON.stringify(player));
  showNotice("進度已儲存。", "success");
}

function normalizeSave(saved) {
  const fresh = createInitialPlayer(saved.name || "");
  Object.assign(fresh, saved);
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
  fresh.saveVersion = SAVE_VERSION;
  return fresh;
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return showNotice("目前沒有可讀取的存檔。", "warning");
  try {
    player = normalizeSave(JSON.parse(raw));
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
  player = createInitialPlayer();
  document.getElementById("characterCreation").style.display = "block";
  document.getElementById("story").innerHTML = "";
  document.getElementById("choices").innerHTML = "";
  showNotice("存檔已刪除，可以開始新人生。", "success");
  updateStatus();
}
