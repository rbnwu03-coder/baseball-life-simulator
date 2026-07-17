let isTransitioning = false;
let selectedOrigin = "prove";

const goalByChapter = {
  "十歲暑假": ["完成今天的選擇", "確認自己想用什麼方式靠近棒球", "找到能留在棒球裡的位置"],
  "少棒入門": ["完成眼前的基本動作", "通過少棒入門評估", "成為球隊願意培養的新生"],
  "少棒第一季": ["完成教練交代的場上任務", "爭取下一次上場機會", "建立自己的主要守備位置"],
  "位置競爭": ["準備下一次守位測試", "進入先發候選名單", "成為球隊正式主力"],
  "青少棒": ["適應身體與技術差距", "守住球隊中的用途", "找到能延續到高中的位置"],
  "青少棒分化": ["處理主力、課業與身體負荷", "取得合適的高中入口", "把棒球延續到下一階段"],
  "青棒": ["完成目前的球隊任務", "爭取穩定出賽與曝光", "建立升學或選秀價值"],
  "青棒關鍵年": ["把握高中最後一年的機會", "取得明確的生涯出口", "讓棒球成為可持續的人生道路"],
  "生涯轉換期": ["適應新的球隊與生活", "建立組織願意保留的用途", "在成年棒球中站穩"],
  "發展期": ["提高近期可用價值", "取得下一份名單或測試機會", "建立能長期留在棒球裡的角色"]
};

const positionConfigs = {
  "內野手": {
    affinity: "infield",
    skills: ["catching", "throwing", "reaction", "range", "baseballIQ"],
    weights: { catching: 1.5, throwing: 1.5, reaction: 2, range: 1.5, baseballIQ: 1.5 },
    personality: { observe: 1, instinct: 0.5 },
    role: "短時間判斷彈跳、接傳銜接與守備範圍",
    scarcity: 1
  },
  "外野手": {
    affinity: "outfield",
    skills: ["catching", "throwing", "armStrength", "range", "reaction", "baseballIQ"],
    weights: { catching: 1.5, throwing: 1, armStrength: 2, range: 2, reaction: 1, baseballIQ: 0.5 },
    personality: { fitness: 1, observe: 0.5 },
    role: "飛球判斷、守備範圍與長距離回傳",
    scarcity: 0
  },
  "捕手": {
    affinity: "catcher",
    skills: ["catching", "throwing", "blocking", "gameCalling", "baseballIQ"],
    weights: { catching: 1.5, throwing: 1, blocking: 2, gameCalling: 2, baseballIQ: 2 },
    personality: { observe: 1, responsibility: 1 },
    role: "擋球、配球、指揮守備並穩定投手",
    scarcity: 2
  },
  "投手": {
    affinity: "pitcher",
    skills: ["throwing", "armStrength", "control", "pitchStamina", "baseballIQ"],
    weights: { throwing: 1, armStrength: 2, control: 2, pitchStamina: 2, baseballIQ: 1 },
    personality: { fitness: 1, discipline: 1, resilience: 0.5 },
    role: "控球、球威、局數負荷與比賽節奏",
    scarcity: 2
  }
};

function selectOrigin(origin) {
  selectedOrigin = origin;
  document.querySelectorAll(".origin-card").forEach(card => {
    card.classList.toggle("selected", card.dataset.origin === origin);
  });
}

function loadTestBookmark(bookmark) {
  const name = document.getElementById("nameInput").value.trim() || "測試球員";
  player = createInitialPlayer(name);
  Object.assign(player, {
    ballSense: 7,
    observe: 9,
    fitness: 6,
    confidence: 6,
    resilience: 7,
    instinct: 5,
    discipline: 4,
    responsibility: 4,
    familySupport: 5,
    coachAttention: 6,
    route: "觀察理解型",
    chapterOneEnding: "觀察型入隊",
    chapterOneEndingDetail: "測試書籤使用的代表性第一章結果。",
    chapter2Result: "理解型新生",
    chapter2ResultDetail: "測試書籤使用的代表性入門原型。",
    chapter2CoachComment: "山本教練認為你善於觀察，但需要增加實戰反應。",
    baseballSkills: { catching: 6, throwing: 4, batting: 1, baseRunning: 2, baseballIQ: 7 },
    relationships: { coachTrust: 6, teammateBond: 5, rivalRespect: 3, rivalCompetition: 5 },
    positionAffinity: { infield: 5, outfield: 1, catcher: 7, pitcher: 1 },
    seasonPosition: "捕手",
    seasonRole: "替補起步，開始獲得固定上場機會",
    seasonResult: "可靠的新輪替球員",
    competitionResult: "高橋承認你是正式競爭者",
    memories: ["你從場邊看懂了第一個守備站位。", "你接受教練修正，並在第一次比賽完成任務。"],
    flags: [
      "wants_team", "asked_good_question", "chapter2_watch_first", "chapter2_asked_correction",
      "chapter2_test_read", "joined_kids", "supported_from_bench", "asked_teammate_in_match",
      "accepted_position_competition", "studied_position_rival"
    ]
  });
  player.baseballSkills = Object.assign({}, createInitialPlayer().baseballSkills, player.baseballSkills || {});

  const bookmarks = {
    childhoodEnd() {
      Object.assign(player, { chapter: "十歲暑假", age: 10, day: 7, phase: "morning", ending: "", chapterOneEnding: "", chapter2Result: "" });
    },
    chapter2() {
      Object.assign(player, { chapter: "少棒入門", age: 10, chapter2Phase: "intro", chapter2Day: 1, chapter2Step: 0 });
    },
    firstMatch() {
      Object.assign(player, { chapter: "少棒第一季", age: 10, seasonStep: 4, seasonPerformance: 0, seasonErrors: 0 });
      player.matchState = Object.assign({}, createInitialPlayer().matchState, { runners: [true, false, false] });
    },
    matchInfield() { Object.assign(player, { chapter: "少棒第一季", age: 10, seasonStep: 4, seasonPosition: "內野手" }); },
    matchOutfield() { Object.assign(player, { chapter: "少棒第一季", age: 10, seasonStep: 4, seasonPosition: "外野手" }); },
    matchCatcher() { Object.assign(player, { chapter: "少棒第一季", age: 10, seasonStep: 4, seasonPosition: "捕手" }); },
    matchPitcher() { Object.assign(player, { chapter: "少棒第一季", age: 10, seasonStep: 4, seasonPosition: "投手" }); },
    competition() {
      Object.assign(player, { chapter: "位置競爭", age: 10, competitionStep: 0 });
      player.startingCompetition = Object.assign({}, createInitialPlayer().startingCompetition, calculateStartingCompetition(), { active: true });
      schedulePendingEvent({ id: "starter_selection", title: "教練的先發守位測試", remainingActions: 3, eventId: "starter_selection_test" });
    },
    junior() {
      Object.assign(player, { chapter: "青少棒", age: 13, juniorStep: 0 });
    },
    pain() {
      Object.assign(player, { chapter: "青少棒", age: 13, juniorStep: 9 });
      addFlags(["junior_accepted_gap", "junior_compensate_with_iq", "accepted_junior_position_change", "respected_azhe_exit"]);
      Object.assign(player.body, { fatigue: 3, injuryRisk: 1, pain: 1 });
    },
    juniorSeason() {
      Object.assign(player, { chapter: "青少棒分化", age: 15, juniorSeasonStep: 0, juniorResult: "為了上場而重新定義自己", juniorPath: "多位置工具人起點" });
      addFlags(["reported_first_pain", "accepted_junior_rehab", "accepted_junior_position_change", "respected_azhe_exit"]);
      Object.assign(player.body, { fatigue: 2, injuryRisk: 1, pain: 0 });
    },
    highSchool() {
      Object.assign(player, {
        chapter: "青棒", age: 16, highSchoolStep: 0,
        juniorResult: "為了上場而重新定義自己", juniorPath: "多位置工具人起點",
        juniorSeasonResult: "用短期機會換取較長的生涯", highSchoolRoute: "普通高中・穩定出賽"
      });
      addFlags(["reported_first_pain", "accepted_junior_rehab", "accepted_junior_position_change", "chose_playing_time_high_school"]);
      Object.assign(player.body, { fatigue: 2, injuryRisk: 1, pain: 0 });
    },
    criticalYear() {
      Object.assign(player, {
        chapter: "青棒關鍵年", age: 18, criticalYearStep: 0,
        juniorSeasonResult: "用短期機會換取較長的生涯", highSchoolRoute: "普通高中・穩定出賽",
        highSchoolTeamRole: "多位置工具人與後段輪替", highSchoolResult: "球探開始建立你的追蹤資料",
        exposure: 4, scoutEvaluation: 5, recentPerformance: 1, reputation: 2
      });
      addFlags(["managed_high_school_load", "accepted_high_school_utility_role", "showcase_baseball_iq", "high_school_commit_utility"]);
      Object.assign(player.body, { fatigue: 2, injuryRisk: 2, pain: 0 });
    },
    batPath() {
      Object.assign(player, {
        chapter: "青棒關鍵年", age: 18, criticalYearStep: 0,
        seasonPosition: "外野手", highSchoolTeamRole: "打擊入口與守備替補",
        highSchoolResult: "球探開始追蹤你的打擊工具",
        exposure: 4, scoutEvaluation: 4, recentPerformance: 2, reputation: 2,
        ballSense: 12, confidence: 10, discipline: 10
      });
      Object.assign(player.baseballSkills, { batting: 14, catching: 5, throwing: 4, range: 4, armStrength: 4, baseballIQ: 7 });
      addFlags(["developed_high_school_bat", "critical_invest_offense", "season_declared_bat_path"]);
    },
    transitionDraft() {
      Object.assign(player, { chapter: "生涯轉換期", age: 18, transitionStep: 0, careerExit: "高卒選秀・中後段指名候選", exposure: 6, scoutEvaluation: 7, reputation: 4 });
    },
    transitionCollege() {
      Object.assign(player, { chapter: "生涯轉換期", age: 18, transitionStep: 0, careerExit: "大學棒球", academics: 7, scoutEvaluation: 4 });
    },
    transitionAmateur() {
      Object.assign(player, { chapter: "生涯轉換期", age: 18, transitionStep: 0, careerExit: "業餘／社會人棒球", finances: 4, scoutEvaluation: 3 });
    },
    transitionRehab() {
      Object.assign(player, { chapter: "生涯轉換期", age: 18, transitionStep: 0, careerExit: "復健與生涯暫停", exposure: 2 });
      Object.assign(player.body, { pain: 4, injuryRisk: 7, recovery: 4 });
    },
    development() {
      Object.assign(player, { chapter: "發展期", age: 20, developmentStep: 0, careerExit: "大學棒球", organizationRole: "大學輪替競爭者", transitionResult: "你用大學延長了成長曲線", exposure: 4, scoutEvaluation: 5, recentPerformance: 3, reputation: 4 });
    },
    careerRoleLoss() {
      Object.assign(player, { chapter: "發展期", age: 20, developmentStep: 1, careerExit: "大學棒球", organizationRole: "大學輪替競爭者", transitionResult: "你用大學延長了成長曲線", exposure: 5, scoutEvaluation: 5, recentPerformance: 4, reputation: 5 });
      Object.assign(player.baseballSkills, { catching: 9, throwing: 8, reaction: 9, range: 8, baseballIQ: 8 });
      player.seasonPosition = "內野手";
      changeRoleIdentity("守備專家", "書籤：已建立守備角色");
      player.careerArc.stage = "established";
      updateCareerValue({ trend: "stable" });
    },
    careerInjuryTurn() {
      Object.assign(player, { chapter: "發展期", age: 21, developmentStep: 3, careerExit: "高卒選秀・中後段指名候選", organizationRole: "職業球團打擊養成／代打候選", exposure: 6, scoutEvaluation: 6, recentPerformance: 4, reputation: 4 });
      Object.assign(player.baseballSkills, { batting: 13, catching: 5, throwing: 5, baseballIQ: 7 });
      Object.assign(player.body, { fatigue: 10, injuryRisk: 9, pain: 4 });
      changeRoleIdentity("打擊型球員", "書籤：靠棒子建立角色");
      updateCareerValue({ trend: "rising" });
      invalidateCurrentRole("長打停滯與健康負荷讓打擊角色失效");
    },
    careerRebound() {
      Object.assign(player, { chapter: "發展期", age: 21, developmentStep: 4, careerExit: "大學棒球", organizationRole: "多位置重新測試球員", exposure: 4, scoutEvaluation: 4, recentPerformance: 2, reputation: 5 });
      Object.assign(player.baseballSkills, { catching: 8, throwing: 7, reaction: 7, range: 7, baseballIQ: 10, baseRunning: 7 });
      Object.assign(player.body, { fatigue: 5, injuryRisk: 5, pain: 1 });
      player.secondaryPosition = "外野手";
      changeRoleIdentity("守備專家", "書籤：原有守備角色");
      updateCareerValue({ trend: "rising" });
      invalidateCurrentRole("新生代守備者讓原角色失去稀缺性");
      addFlags(["development_expanded_role", "development_adjusted_role"]);
      player.careerArc.stage = "transition";
    },
    azheTrust() {
      Object.assign(player, { chapter: "位置競爭", age: 11, competitionStep: 3, pendingEvents: [], forcedEventId: "" });
      Object.assign(player.personality, { kind: 7, reliable: 7, thoughtful: 5 });
      Object.assign(player.impression.azhe, { trusts: 7, depends: 3, feelsDistance: 0 });
      Object.assign(player.relationships, { teammateBond: 8 });
      Object.assign(player.characterArc, { azhe: "confided" });
      addFlags(["azhe_hidden_error_seen", "azhe_error_reworked"]);
    },
    azheDistance() {
      Object.assign(player, { chapter: "青少棒", age: 13, juniorStep: 4, pendingEvents: [], forcedEventId: "" });
      Object.assign(player.personality, { ambitious: 8, selfish: 7 });
      Object.assign(player.impression.azhe, { trusts: 1, depends: 0, feelsDistance: 7 });
      Object.assign(player.relationships, { teammateBond: 1 });
      Object.assign(player.characterArc, { azhe: "distant" });
      addFlags(["azhe_hidden_error_seen", "chose_solo_over_teammate"]);
    },
    takahashiRespect() {
      Object.assign(player, { chapter: "青少棒", age: 13, juniorStep: 5, pendingEvents: [], forcedEventId: "" });
      Object.assign(player.personality, { brave: 7, thoughtful: 6, ambitious: 6 });
      Object.assign(player.impression.takahashi, { respect: 7, rivalry: 6, underestimate: 0 });
      Object.assign(player.relationships, { rivalRespect: 8, rivalCompetition: 7 });
      Object.assign(player.characterArc, { takahashi: "partner" });
      addFlags(["takahashi_first_challenge_done", "redesigned_rival_drill"]);
    },
    takahashiHostile() {
      Object.assign(player, { chapter: "青少棒", age: 13, juniorStep: 5, pendingEvents: [], forcedEventId: "" });
      Object.assign(player.personality, { ambitious: 9, emotional: 7, selfish: 5 });
      Object.assign(player.impression.takahashi, { respect: 1, rivalry: 8, underestimate: 6 });
      Object.assign(player.relationships, { rivalRespect: 1, rivalCompetition: 9 });
      Object.assign(player.characterArc, { takahashi: "rival" });
      addFlags(["takahashi_first_challenge_done", "starter_test_aggressive"]);
    },
    coachDependable() {
      Object.assign(player, { chapter: "位置競爭", age: 11, competitionStep: 2, pendingEvents: [], forcedEventId: "" });
      Object.assign(player.personality, { reliable: 8, brave: 7, kind: 5 });
      Object.assign(player.impression.coach, { dependable: 7, leader: 5, competitive: 2, immature: 0 });
      Object.assign(player.relationships, { coachTrust: 9 });
      Object.assign(player.characterArc, { yamamoto: "mentor" });
    },
    coachDisappointed() {
      Object.assign(player, { chapter: "青少棒", age: 13, juniorStep: 6, pendingEvents: [], forcedEventId: "" });
      Object.assign(player.personality, { emotional: 8, stubborn: 6, ambitious: 7 });
      Object.assign(player.impression.coach, { dependable: 1, leader: 0, competitive: 6, immature: 7 });
      Object.assign(player.relationships, { coachTrust: 2 });
      Object.assign(player.characterArc, { yamamoto: "disappointed" });
    },
    characterCrossroads() {
      Object.assign(player, { chapter: "位置競爭", age: 11, competitionStep: 2, pendingEvents: [], forcedEventId: "" });
      Object.assign(player.personality, { reliable: 8, brave: 7, kind: 6, ambitious: 6 });
      Object.assign(player.impression.coach, { dependable: 7, leader: 5 });
      Object.assign(player.impression.azhe, { trusts: 6, depends: 5 });
      Object.assign(player.impression.takahashi, { respect: 6, rivalry: 6 });
      Object.assign(player.relationships, { coachTrust: 8, teammateBond: 7, rivalRespect: 6, rivalCompetition: 6 });
    },
    coachRecommendation() {
      Object.assign(player, { chapter: "青少棒分化", age: 15, juniorSeasonStep: 8, pendingEvents: [], forcedEventId: "" });
      Object.assign(player.personality, { reliable: 8, thoughtful: 7, brave: 5, ambitious: 4 });
      Object.assign(player.impression.coach, { dependable: 7, leader: 4, competitive: 2, immature: 0 });
      Object.assign(player.impression.azhe, { trusts: 6, depends: 2 });
      Object.assign(player.impression.takahashi, { respect: 6, rivalry: 5 });
      Object.assign(player.characterArc, { azhe: "respected_equal", takahashi: "rival", yamamoto: "trusted" });
      addFlags(["reported_first_pain", "yamamoto_disagreement_done", "takahashi_school_question_done"]);
    }
  };

  if (!bookmarks[bookmark]) return showNotice("找不到這個測試書籤。", "error");
  bookmarks[bookmark]();
  player.completed = false;
  player.ending = "";
  document.getElementById("characterCreation").style.display = "none";
  document.getElementById("changeLog").innerHTML = "";
  showCurrentEvent();
  showNotice("已載入暫時測試書籤；正式存檔沒有被修改。", "warning");
}

function createPlayer() {
  const name = document.getElementById("nameInput").value.trim() || "無名小將";
  player = createInitialPlayer(name);
  player.replayMemories = loadReplayMemories();
  player.origin = selectedOrigin;
  const origins = {
    prove: { effects: { confidence: 1, pressure: 1 }, personality: { brave: 1, ambitious: 1 }, flag: "origin_wants_to_be_seen", memory: "在真正碰到棒球以前，你先承認自己希望有一天能被看見。" },
    understand: { effects: { observe: 2 }, personality: { thoughtful: 2 }, flag: "origin_wants_to_understand", memory: "你最初靠近棒球，是因為想知道每個動作背後的原因。" },
    belong: { effects: { familySupport: 1, resilience: 1 }, personality: { kind: 1, reliable: 1 }, flag: "origin_wants_to_belong", memory: "你希望棒球能讓自己成為某個團體的一員。" }
  };
  const origin = origins[selectedOrigin];
  applyEffects(origin.effects);
  addPersonalityEffects(origin.personality);
  addFlags([origin.flag]);
  updateImpression();
  player.memories.push(origin.memory);
  document.getElementById("characterCreation").style.display = "none";
  document.getElementById("changeLog").innerHTML = "";
  selectedOrigin = "prove";
  document.querySelectorAll?.(".origin-card").forEach(card => card.classList.toggle("selected", card.dataset.origin === "prove"));
  showCurrentEvent();
}

function resetGame() {
  player = createInitialPlayer();
  document.getElementById("characterCreation").style.display = "block";
  document.getElementById("nameInput").value = "";
  document.getElementById("story").innerHTML = "";
  document.getElementById("choices").innerHTML = "";
  document.getElementById("changeLog").innerHTML = "";
  updateStatus();
}

const chapterGoalDefinitions = {
  "少棒入門": {
    current: { id: "intro_two_basics", title: "完成兩項基本動作", tier: "small", target: 2 },
    short: { id: "intro_form_type", title: "形成一種明確的新生類型", tier: "medium", target: 1 },
    chapter: { id: "intro_earn_training_place", title: "成為球隊願意培養的新生", tier: "major", target: 1 }
  },
  "少棒第一季": {
    current: { id: "youth_first_appearance", title: "獲得第一次正式上場機會", tier: "small", target: 1 },
    short: { id: "youth_field_assignment", title: "完成一項場上任務", tier: "small", target: 1 },
    chapter: { id: "youth_next_opportunity", title: "獲得下一次上場機會", tier: "medium", target: 1 }
  },
  "位置競爭": {
    current: { id: "competition_close_gap", title: "透過準備縮小與先發的差距", tier: "small", target: 6 },
    short: { id: "competition_rotation", title: "進入先發或固定輪替競爭", tier: "medium", target: 1 },
    chapter: { id: "competition_claim_role", title: "建立球隊願意使用的守位角色", tier: "major", target: 1 }
  },
  "青少棒": {
    current: { id: "junior_answer_growth_gap", title: "找到一種應對身體差距的方法", tier: "small", target: 1 },
    short: { id: "junior_keep_role", title: "保留穩定的上場用途", tier: "medium", target: 1 },
    chapter: { id: "junior_sustainable_path", title: "建立能延續到高中的位置", tier: "major", target: 1 }
  },
  "青少棒分化": {
    current: { id: "junior_manage_life", title: "主動管理一次身體、課業或訓練", tier: "small", target: 1 },
    short: { id: "junior_school_entry", title: "獲得適合自己的高中入口", tier: "medium", target: 1 },
    chapter: { id: "junior_enter_high_school", title: "帶著可持續方案進入高中", tier: "major", target: 1 }
  },
  "青棒": {
    current: { id: "high_school_clear_task", title: "在新環境取得一個明確任務", tier: "small", target: 1 },
    short: { id: "high_school_described_value", title: "建立能被教練描述的價值", tier: "medium", target: 1 },
    chapter: { id: "high_school_market_identity", title: "建立可延續的高中球員定位", tier: "major", target: 1 }
  }
};

function setGoal(slot, definition) {
  if (!definition || !["current", "short", "chapter"].includes(slot)) return null;
  player.goalState = player.goalState || createInitialPlayer().goalState;
  const existing = [player.goalState.current, player.goalState.short, player.goalState.chapter].find(goal => goal?.id === definition.id);
  if (existing) return existing;
  const goal = Object.assign({ current: 0, target: 1, status: "active", rewardClaimed: false }, definition);
  player.goalState[slot] = goal;
  return goal;
}

function findGoal(id) {
  return [player.goalState?.current, player.goalState?.short, player.goalState?.chapter].find(goal => goal?.id === id) || null;
}

function pushGoalProgress(goal, message, type = "progress") {
  if (!goal) return;
  player.goalState.recentProgress.push({ id: goal.id, message, type });
  player.goalState.recentProgress = player.goalState.recentProgress.slice(-5);
}

function advanceGoal(id, amount = 1, message = "") {
  const goal = findGoal(id);
  if (!goal || goal.status !== "active") return false;
  goal.current = Math.min(goal.target, goal.current + amount);
  pushGoalProgress(goal, message || `目標推進：${goal.title} ${goal.current}／${goal.target}`);
  if (goal.current >= goal.target) completeGoal(id);
  return true;
}

function completeGoal(id, message = "") {
  const goal = findGoal(id);
  if (!goal || goal.status === "completed") return false;
  goal.current = goal.target;
  goal.status = "completed";
  if (!player.goalState.completedGoals.includes(id)) player.goalState.completedGoals.push(id);
  if (!goal.rewardClaimed) {
    goal.rewardClaimed = true;
    player.memories.push(`你完成了目標：「${goal.title}」。`);
    player.memories = player.memories.slice(-20);
  }
  pushGoalProgress(goal, message || `目標完成：${goal.title}`, "complete");
  return true;
}

function resolveGoal(id, status, message = "") {
  const goal = findGoal(id);
  if (!goal || goal.status !== "active") return false;
  if (status === "completed") return completeGoal(id, message);
  goal.status = status;
  const label = status === "success" ? "成功" : status === "partial" ? "部分成功" : status === "failed" ? "未完成" : "目標更新";
  pushGoalProgress(goal, message || `${label}：${goal.title}`, status === "success" ? "success" : status === "partial" ? "partial" : status === "failed" ? "failed" : "progress");
  return true;
}

function hasCompletedGoal(id) { return Boolean(player.goalState?.completedGoals?.includes(id)); }

function getGoalProgressText(goal) {
  if (!goal) return "尚未設定";
  const labels = { active: `${goal.current}／${goal.target}`, completed: "完全成功", success: "成功", partial: "部分成功", failed: "未完成", expired: "已結束" };
  return labels[goal.status] || goal.status;
}

function ensureChapterGoals() {
  const key = Object.keys(chapterGoalDefinitions).find(chapter => player.chapter === chapter);
  if (!key) return;
  const definitions = chapterGoalDefinitions[key];
  const currentIds = [player.goalState?.current?.id, player.goalState?.short?.id, player.goalState?.chapter?.id];
  const desiredIds = Object.values(definitions).map(goal => goal.id);
  if (!currentIds.some(id => desiredIds.includes(id))) {
    player.goalState.current = null; player.goalState.short = null; player.goalState.chapter = null;
  }
  Object.entries(definitions).forEach(([slot, goal]) => setGoal(slot, goal));
}

function consumeGoalFeedback() {
  const feedback = player.goalState?.recentProgress || [];
  player.goalState.recentProgress = [];
  return feedback;
}

function updateGoals(eventId = "") {
  ensureChapterGoals();
  const chapterKey = Object.keys(goalByChapter).find(key => player.chapter === key || player.chapter.startsWith(key));
  const goals = goalByChapter[chapterKey] || ["完成眼前的選擇", "走到下一次階段評估", "找到能留在棒球裡的方式"];
  const pending = player.pendingEvents?.[0];
  player.currentGoal = pending
    ? `${pending.title}（剩餘 ${pending.remainingActions} 次行動）`
    : eventId.startsWith("youth_match_")
      ? "完成這一個比賽局面"
      : goals[0];
  player.shortGoal = goals[1];
  player.longGoal = goals[2];

  if (player.forcedEventId === "starter_selection_test") player.currentGoal = "完成先發守位測試";
  if (player.startingCompetition?.result) player.shortGoal = player.startingCompetition.result === "先發候選" ? "守住下一次先發機會" : "從第一替補追上先發名單";
}

function schedulePendingEvent(event) {
  if (!event?.id || player.pendingEvents.some(item => item.id === event.id)) return;
  player.pendingEvents.push({
    id: event.id,
    title: event.title || "尚未揭曉的事件",
    remainingActions: Math.max(1, Number(event.remainingActions) || 1),
    eventId: event.eventId || event.id
  });
}

function tickPendingEvents(sourceEventId = "") {
  if (!player.pendingEvents.length || sourceEventId === player.forcedEventId) return;
  player.pendingEvents.forEach(item => item.remainingActions = Math.max(0, item.remainingActions - 1));
  const ready = player.pendingEvents.find(item => item.remainingActions <= 0);
  if (!ready) return;
  player.pendingEvents = player.pendingEvents.filter(item => item.id !== ready.id);
  player.forcedEventId = ready.eventId;
}

function getRivalDisplayName() {
  return typeof rival !== "undefined" && rival?.name ? rival.name : "高橋";
}

function syncNpcRelationships() {
  if (typeof coach !== "undefined") coach.trust = player.relationships.coachTrust;
  if (typeof teammates !== "undefined" && teammates?.[0]) teammates[0].friendship = player.relationships.teammateBond;
  if (typeof rival !== "undefined") rival.relationship = player.relationships.rivalRespect - player.relationships.rivalCompetition;
}

function getCompetitionPreparationScore() {
  const preparationFlags = [
    "accepted_position_competition", "studied_position_rival", "shared_roster_with_teammate",
    "logged_competition_reps", "raised_drill_with_rival", "helped_teammate_drill",
    "focused_coach_extra", "proved_consistency_extra", "balanced_teammate_training",
    "accepted_rival_drill", "redesigned_rival_drill", "solo_structured_work"
  ];
  return Math.min(6, preparationFlags.filter(hasFlag).length * 2);
}

function getRoleValueBonus() {
  const positionValue = getPositionCareerValue();
  const offense = getOffensiveCareerValue();
  const teamValue = player.relationships.teammateBond >= 6 || player.personality?.reliable >= 6 ? 2 : 0;
  return Math.min(6, positionValue + offense + teamValue);
}

function getStartingCompetitionBreakdown() {
  const position = player.seasonPosition || calculatePositionRatings()[0].position;
  const positionRating = getPositionAssessment(position)?.rating || 0;
  const skillScore = positionRating * .40;
  const trustScore = player.relationships.coachTrust * 1.0;
  const performanceScore = player.seasonPerformance * 1.2;
  const preparationScore = getCompetitionPreparationScore();
  const roleScore = getRoleValueBonus();
  const historyScore = hasFlag("主動競爭") || hasFlag("accepted_position_competition") ? 2 : 0;
  const playerRating = Math.max(1, Math.min(99, Math.round(20 + skillScore + trustScore + performanceScore + preparationScore + roleScore + historyScore)));
  const baseRivalSkill = typeof rival !== "undefined" ? Number(rival.skill) || 60 : 60;
  const rivalSkillScaled = Math.max(0, (baseRivalSkill - 50) * .35);
  const rivalRating = Math.max(1, Math.min(99, Math.round(46 + rivalSkillScaled + player.relationships.rivalCompetition * .45 - player.relationships.rivalRespect * .35)));
  return { position, positionRating, skillScore, trustScore, performanceScore, preparationScore, roleScore, historyScore, playerRating, rivalRating, rivalName: getRivalDisplayName() };
}

function calculateStartingCompetition() {
  const details = getStartingCompetitionBreakdown();
  return { position: details.position, playerRating: details.playerRating, rivalRating: details.rivalRating, rivalName: details.rivalName };
}

function refreshStartingCompetition() {
  if (player.startingCompetition?.result || !player.startingCompetition?.active) return;
  const ratings = calculateStartingCompetition();
  Object.assign(player.startingCompetition, ratings);
}

function ensureIncrementalSystems() {
  player.pendingEvents = Array.isArray(player.pendingEvents) ? player.pendingEvents : [];
  player.startingCompetition = Object.assign({}, createInitialPlayer().startingCompetition, player.startingCompetition || {});
  if (player.chapter === "位置競爭" && !player.competitionResult && !player.startingCompetition.result && !player.startingCompetition.active) {
    Object.assign(player.startingCompetition, calculateStartingCompetition(), { active: true });
    schedulePendingEvent({
      id: "starter_selection",
      title: "教練的先發守位測試",
      remainingActions: Math.max(1, 3 - (Number(player.competitionStep) || 0)),
      eventId: "starter_selection_test"
    });
  }
}

function resolveStartingCompetition() {
  refreshStartingCompetition();
  const competition = player.startingCompetition;
  const flagBonus = hasFlag("starter_test_stable") ? 5 : hasFlag("starter_test_adaptive") ? 4 : 4;
  competition.playerRating = Math.min(99, competition.rivalRating + 10, competition.playerRating + flagBonus);
  const difference = competition.playerRating - competition.rivalRating;
  if (difference >= 4) {
    competition.result = "先發候選";
    competition.detail = `你以 ${competition.playerRating}：${competition.rivalRating} 進入下一場先發候選名單。這不是永久位置，而是一次必須守住的機會。`;
  } else if (difference >= -3) {
    competition.result = "並列競爭";
    competition.detail = `你以 ${competition.playerRating}：${competition.rivalRating} 緊追${competition.rivalName}。教練決定繼續觀察下一次實戰。`;
  } else if (difference >= -10) {
    competition.result = "第一替補";
    competition.detail = `你以 ${competition.playerRating}：${competition.rivalRating} 暫居後方，但已取得第一替補與隨時上場的任務。`;
  } else {
    competition.result = "後段替補";
    competition.detail = `你以 ${competition.playerRating}：${competition.rivalRating} 留在後段名單。教練仍保留一項明確追趕任務：先把基本處理與每日準備做成可預期的能力。`;
  }
  competition.active = false;
  if (competition.result === "先發候選") addTurningPoint("first_starting_chance", "第一次成為先發候選", "第一次取得能被失去的正式位置");
  if (difference >= -10) resolveGoal("competition_rotation", difference >= -3 ? "completed" : "partial", difference >= -3 ? `中目標完成：${competition.result}` : `部分成功：你暫居第一替補，但已取得固定輪替任務`);
  else resolveGoal("competition_rotation", "failed", "目前仍是後段替補；下一個入口是完成固定基本任務");
  player.shortGoal = competition.result === "先發候選" ? "守住下一次先發機會" : "追上先發名單";
}

function getPlayerSnapshot() {
  const snapshot = {};
  Object.keys(statLabels).forEach(key => snapshot[key] = player[key] || 0);
  Object.keys(skillLabels).forEach(key => snapshot[key] = player.baseballSkills?.[key] || 0);
  return snapshot;
}

function inferTrainingFocus(choice = {}) {
  if (choice.trainingFocus) return choice.trainingFocus;
  const skills = Object.keys(choice.skillEffects || {});
  if (skills.some(key => ["control", "pitchStamina", "armStrength"].includes(key))) return "pitching";
  if (skills.some(key => ["blocking", "gameCalling"].includes(key))) return "catching";
  if (skills.includes("batting")) return "batting";
  if (skills.includes("baseRunning")) return "running";
  if (skills.includes("baseballIQ")) return "baseballIQ";
  if (skills.some(key => ["reaction", "range", "catching", "throwing"].includes(key))) return "defense";
  if ((choice.bodyEffects?.fatigue || 0) < 0 || (choice.bodyEffects?.recovery || 0) > 0) return "recovery";
  if (choice.flags?.some(flag => /basic|fundamental|correction/.test(flag))) return "fundamentals";
  return "";
}

function updateTrainingFocus(focus) {
  if (!focus) return 0;
  player.trainingFocus = Object.assign({}, createInitialPlayer().trainingFocus, player.trainingFocus || {});
  if (player.trainingFocus.current === focus) player.trainingFocus.streak += 1;
  else { player.trainingFocus.current = focus; player.trainingFocus.streak = 1; }
  return player.trainingFocus.streak;
}

function getTrainingFocusBonus(focus) {
  if (!focus || player.trainingFocus?.current !== focus) return 0;
  return player.trainingFocus.streak === 2 ? 1 : 0;
}

function applyTrainingFocusBonus(choice) {
  const focus = inferTrainingFocus(choice);
  const streak = updateTrainingFocus(focus);
  if (!focus) return;
  if (streak === 2) {
    const preferred = { fundamentals: "catching", batting: "batting", defense: "reaction", running: "baseRunning", pitching: "control", catching: "blocking", baseballIQ: "baseballIQ", recovery: null }[focus];
    if (preferred) applySkillEffects({ [preferred]: 1 });
    pushGoalProgress(player.goalState?.current, `專注成長：連續兩次投入${focus}，相關能力額外提升`, "progress");
  } else if (streak >= 3) {
    const active = player.goalState?.current;
    if (active?.status === "active") advanceGoal(active.id, 1, `穩定累積：${focus}方向已形成連續性`);
  }
}

function updateGoalProgressForChoice(eventId, choice) {
  if (player.chapter === "少棒入門" && (choice.skillEffects || choice.flags?.some(flag => /correction|training|test/.test(flag)))) advanceGoal("intro_two_basics", 1);
  if (player.chapter === "少棒第一季") {
    if (eventId === "youth_match_entry") completeGoal("youth_first_appearance", "小目標完成：你獲得第一次正式上場機會");
    if (/youth_match_(grounder|outfield|catcher|pitcher|mistake)/.test(eventId) && ((choice.matchEffects?.outs || 0) > 0 || (choice.matchEffects?.performance || 0) >= 2 || (choice.relationshipEffects?.teammateBond || 0) > 0)) completeGoal("youth_field_assignment", "小目標完成：你完成了一項場上任務");
  }
  if (player.chapter === "位置競爭" && !eventId.startsWith("starter_selection")) {
    const preparation = choice.flags?.some(flag => /competition|coach_extra|rival_drill|teammate_training|structured_work|logged|raised_drill|helped_teammate/.test(flag));
    if (preparation) advanceGoal("competition_close_gap", 3, "小目標推進：這次準備讓競爭差距縮小");
  }
  if (player.chapter === "青少棒" && choice.flags?.some(flag => /compensate|build_body|position_change|bat_compensation|managed|monitored|accepted_junior/.test(flag))) completeGoal("junior_answer_growth_gap", "小目標完成：你找到一種應對身體差距的方法");
  if (player.chapter === "青少棒分化" && (choice.bodyEffects || choice.academicEffects || choice.flags?.some(flag => /managed|balanced|rehab|health/.test(flag)))) completeGoal("junior_manage_life", "小目標完成：你主動管理了一次身體、課業或訓練");
  if (player.chapter === "青棒" && choice.flags?.some(flag => /utility_role|focused_high_school_position|developed_high_school_bat|team_task|routine/.test(flag))) completeGoal("high_school_clear_task", "小目標完成：你在新環境取得明確任務");
}

function clampStats() {
  Object.keys(statLabels).forEach(key => {
    const max = key === "pressure" ? 12 : 20;
    player[key] = Math.max(0, Math.min(max, Number(player[key]) || 0));
  });
}

function applyEffects(effects = {}) {
  Object.entries(effects).forEach(([key, value]) => player[key] = (Number(player[key]) || 0) + value);
  clampStats();
}

function addPersonalityEffects(effects = {}) {
  player.personality = Object.assign({}, createInitialPlayer().personality, player.personality || {});
  Object.entries(effects).forEach(([key, value]) => {
    player.personality[key] = Math.max(0, Math.min(20, (Number(player.personality[key]) || 0) + value));
  });
}

function addImpressionEffects(effects = {}) {
  player.impression = player.impression || createInitialPlayer().impression;
  Object.entries(effects).forEach(([npc, changes]) => {
    if (!player.impression[npc]) player.impression[npc] = {};
    Object.entries(changes || {}).forEach(([key, value]) => {
      player.impression[npc][key] = Math.max(0, Math.min(20, (Number(player.impression[npc][key]) || 0) + value));
    });
  });
}

function applyCharacterArcEffects(effects = {}) {
  player.characterArc = Object.assign({}, createInitialPlayer().characterArc, player.characterArc || {});
  Object.entries(effects).forEach(([npc, state]) => { if (state) player.characterArc[npc] = state; });
}

function personalityTier(value) {
  return value >= 10 ? 5 : value >= 7 ? 3 : value >= 6 ? 2 : value >= 3 ? 1 : 0;
}

function updateImpression() {
  const p = player.personality || createInitialPlayer().personality;
  const i = player.impression || createInitialPlayer().impression;
  const ensure = (npc, key, value) => { i[npc][key] = Math.max(Number(i[npc][key]) || 0, value); };
  ensure("azhe", "trusts", personalityTier(p.kind));
  ensure("azhe", "depends", personalityTier(p.reliable));
  ensure("azhe", "feelsDistance", personalityTier(p.selfish));
  ensure("azhe", "admires", personalityTier(p.brave));
  ensure("coach", "dependable", personalityTier(p.reliable));
  ensure("coach", "leader", p.brave >= 10 ? 5 : p.brave >= 7 ? 3 : p.brave >= 4 ? 1 : 0);
  ensure("coach", "immature", personalityTier(p.emotional));
  ensure("coach", "competitive", personalityTier(p.ambitious));
  ensure("takahashi", "rivalry", personalityTier(p.ambitious));
  ensure("takahashi", "respect", personalityTier(p.brave));
  ensure("takahashi", "underestimate", personalityTier(p.emotional));
  ensure("family", "pride", personalityTier(p.reliable + p.kind >= 12 ? 7 : Math.max(p.reliable, p.kind)));
  ensure("family", "worry", personalityTier(Math.max(p.emotional, p.selfish)));
  player.impression = i;
  updateCharacterArcs();
}

function updateCharacterArcs() {
  const arc = player.characterArc || createInitialPlayer().characterArc;
  if (!["quit_baseball", "manager", "reunion", "confided", "dependent", "distant", "respected_equal"].includes(arc.azhe)) {
    arc.azhe = player.impression.azhe.feelsDistance >= 5 ? "distant" : player.impression.azhe.trusts >= 5 && player.impression.azhe.depends >= 5 ? "dependent" : player.impression.azhe.trusts >= 3 ? "confided" : "neutral";
  }
  if (!["same_school", "injured", "beat_you", "you_beat_him", "reunion"].includes(arc.takahashi)) {
    arc.takahashi = player.impression.takahashi.respect >= 5 && player.impression.takahashi.rivalry >= 5 ? "partner" : player.impression.takahashi.rivalry >= 3 ? "rival" : "neutral";
  }
  if (!["recommendation", "disappointed"].includes(arc.yamamoto)) {
    arc.yamamoto = player.impression.coach.immature >= 5 ? "disappointed" : player.impression.coach.dependable >= 5 && player.impression.coach.leader >= 3 ? "mentor" : player.impression.coach.dependable >= 3 ? "trusted" : player.impression.coach.competitive >= 3 ? "strict" : "neutral";
  }
  player.characterArc = arc;
}

function applySkillEffects(effects = {}) {
  player.baseballSkills = Object.assign({}, createInitialPlayer().baseballSkills, player.baseballSkills || {});
  player.balanceDebug = Object.assign({}, createInitialPlayer().balanceDebug, player.balanceDebug || {});
  if (player.balanceDebug.chapter !== player.chapter) {
    player.balanceDebug.chapter = player.chapter;
    player.balanceDebug.chapterSkillPoints = 0;
  }
  Object.entries(effects).forEach(([key, value]) => {
    player.baseballSkills[key] = Math.max(0, Math.min(20, (Number(player.baseballSkills[key]) || 0) + value));
    if (value > 0) player.balanceDebug.chapterSkillPoints += value;
  });
}

function applyPositionSkillEffects(effectsByPosition = {}) {
  const effects = effectsByPosition[player.seasonPosition] || effectsByPosition.default;
  if (effects) applySkillEffects(effects);
}

function applySuggestedPositionChange() {
  const suggestions = { "內野手": "外野手", "外野手": "內野手", "捕手": "內野手", "投手": "外野手" };
  const affinities = { "內野手": "infield", "外野手": "outfield", "捕手": "catcher", "投手": "pitcher" };
  const nextPosition = suggestions[player.seasonPosition] || "內野手";
  player.secondaryPosition = nextPosition;
  const affinity = affinities[nextPosition];
  if (affinity) player.positionAffinity[affinity] = Math.min(20, (player.positionAffinity[affinity] || 0) + 2);
}

function addFlags(flags = []) {
  flags.forEach(flag => { if (!player.flags.includes(flag)) player.flags.push(flag); });
  registerCallbacksFromFlags(flags);
}

function hasFlag(flag) { return player.flags.includes(flag); }

function unlockCallback(data = {}) {
  if (!data.id) return null;
  player.callbacks = Array.isArray(player.callbacks) ? player.callbacks : [];
  const existing = player.callbacks.find(item => item.id === data.id);
  if (existing) return existing;
  const callback = Object.assign({ title: data.id, sourceFlag: "", chapter: player.chapter, resolved: false, impact: 0 }, data);
  player.callbacks.push(callback);
  return callback;
}

function resolveCallback(id, impact = 1) {
  const callback = (player.callbacks || []).find(item => item.id === id);
  if (!callback || callback.resolved) return false;
  callback.resolved = true;
  callback.impact = Math.max(Number(callback.impact) || 0, Number(impact) || 1);
  return true;
}

function hasCallback(id, resolved) {
  const callback = (player.callbacks || []).find(item => item.id === id);
  return Boolean(callback && (resolved === undefined || callback.resolved === resolved));
}

function addConsequence(data = {}) {
  if (!data.id) return null;
  player.consequences = Array.isArray(player.consequences) ? player.consequences : [];
  const existing = player.consequences.find(item => item.id === data.id);
  if (existing) {
    existing.active = data.active !== false;
    existing.severity = Math.max(existing.severity || 1, data.severity || 1);
    return existing;
  }
  const consequence = Object.assign({ title: data.id, active: true, severity: 1 }, data);
  player.consequences.push(consequence);
  return consequence;
}

function hasConsequence(id) { return Boolean((player.consequences || []).find(item => item.id === id && item.active)); }

function addLifeThemeEffects(effects = {}) {
  player.lifeThemes = Object.assign({}, createInitialPlayer().lifeThemes, player.lifeThemes || {});
  Object.entries(effects).forEach(([key, value]) => {
    player.lifeThemes[key] = Math.max(0, (Number(player.lifeThemes[key]) || 0) + value);
  });
}

const callbackByFlag = {
  ignored_laugh: { id: "fear_of_failure", title: "第一次把嘲笑留在心裡", chapter: "childhood", theme: { fear: 2 } },
  asked_family: { id: "family_safe_place", title: "第一次退回家人身邊", chapter: "childhood", theme: { fear: 1, trust: 1 } },
  azhe_error_reworked: { id: "azhe_hidden_grounder", title: "陪阿哲重做的滾地球", chapter: "youth", theme: { trust: 2, responsibility: 1 } },
  takahashi_first_challenge_done: { id: "takahashi_ten_ball", title: "高橋的十球挑戰", chapter: "competition", theme: { competition: 2 } },
  asked_demo: { id: "asked_for_another_demo", title: "第一次要求再示範", chapter: "childhood", theme: { responsibility: 1 } },
  wants_free_baseball: { id: "freedom_origin", title: "不願讓棒球只剩規矩", chapter: "childhood", theme: { freedom: 2 } }
};

function registerCallbacksFromFlags(flags = []) {
  flags.forEach(flag => {
    const data = callbackByFlag[flag];
    if (!data) return;
    const created = unlockCallback({ id: data.id, title: data.title, sourceFlag: flag, chapter: data.chapter });
    if (created && !created.themeCounted) {
      addLifeThemeEffects(data.theme);
      created.themeCounted = true;
    }
  });
  if (flags.includes("chose_solo_over_teammate")) addConsequence({ id: "trust_deficit", title: "習慣把競爭放在隊友之前", severity: 1 });
  if (flags.some(flag => ["proved_consistency_extra", "repeated_mistake_after_match", "solo_grind", "overtrained_high_school"].includes(flag))) addConsequence({ id: "overtraining_tendency", title: "用加練回答不安", severity: 1 });
  if (flags.includes("怕失誤") || flags.includes("ignored_laugh")) addConsequence({ id: "fear_of_mistake", title: "關鍵時刻害怕再次失誤", severity: 1 });
}

function resolveCallbacksForEvent(eventId) {
  const mapping = {
    youth_match_mistake: [["fear_of_failure", 1]],
    junior_azhe_cover: [["azhe_hidden_grounder", 2]],
    junior_takahashi_failure: [["takahashi_ten_ball", 2]],
    yamamoto_recommendation: [["asked_for_another_demo", 2]],
    transition_relationship: [["family_safe_place", 2]],
    development_decision: [["freedom_origin", 3]]
  };
  (mapping[eventId] || []).forEach(([id, impact]) => resolveCallback(id, impact));
}

function applyConsequenceAtEvent(eventId) {
  const keyMoment = /match|tournament|test|showcase|opportunity|competition/.test(eventId);
  if (keyMoment && hasConsequence("fear_of_mistake") && !hasFlag(`fear_consequence_${eventId}`)) {
    applyEffects({ pressure: 2 });
    addFlags([`fear_consequence_${eventId}`]);
  }
}

function auditCallbacks() {
  const callbacks = player.callbacks || [];
  const consequences = player.consequences || [];
  const resolved = callbacks.filter(item => item.resolved);
  return {
    created: callbacks.length,
    resolved: resolved.length,
    recoveryRate: callbacks.length ? Math.round(resolved.length / callbacks.length * 100) : 100,
    unresolved: callbacks.filter(item => !item.resolved).map(item => item.id),
    consequences: consequences.length,
    inactiveConsequences: consequences.filter(item => !item.active).map(item => item.id)
  };
}

function getLifeThemeSummary() {
  const labels = { fear: "如何面對害怕", trust: "把弱點交給別人", competition: "用競爭確認價值", responsibility: "承擔選擇後果", freedom: "保留自己的棒球方式" };
  const ranked = Object.entries(player.lifeThemes || {}).sort((a, b) => b[1] - a[1]).filter(([, value]) => value > 0).slice(0, 2);
  return ranked.length ? ranked.map(([key]) => labels[key]).join("，以及") : "仍在尋找棒球對人生的意義";
}

function getCallbackNarrative() {
  const resolved = (player.callbacks || []).filter(item => item.resolved).sort((a, b) => b.impact - a.impact);
  if (!resolved.length) return "有些早年的選擇仍沒有等到回音。";
  return `世界仍記得「${resolved.slice(0, 2).map(item => item.title).join("」與「")}」。它們沒有停在當時，而是改變了後來的人如何看你。`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function formatChange(label, value) {
  const className = value >= 0 ? "positive-change" : "negative-change";
  return `<span class="${className}">${label} ${value >= 0 ? "+" : ""}${value}</span>`;
}

function showStatChanges(before, after, memory = "") {
  const changes = [];
  Object.entries({ ...statLabels, ...skillLabels }).forEach(([key, label]) => {
    if (after[key] !== before[key]) changes.push(formatChange(label, after[key] - before[key]));
  });
  const goalFeedback = consumeGoalFeedback();
  const goalHtml = goalFeedback.map(item => `<div class="${item.type === "complete" ? "goal-complete" : item.type === "success" ? "goal-success" : item.type === "partial" ? "goal-partial" : item.type === "failed" ? "goal-failed" : "goal-progress-change"}">${escapeHtml(item.message)}</div>`).join("");
  document.getElementById("changeLog").innerHTML = `
    ${memory ? `<div class="memory-line">${escapeHtml(memory)}</div>` : ""}
    <div>${changes.length ? changes.join("") : "<span class='neutral-change'>這個選擇留下了記憶，而不是數值。</span>"}</div>${goalHtml}`;
}

function showNotice(message, type = "neutral") {
  const node = document.getElementById("changeLog");
  if (!node) return;
  node.innerHTML = `<div class="notice ${type}">${escapeHtml(message)}</div>`;
}

function choose(eventId, index) {
  if (isTransitioning) return;
  const event = getEvent(eventId);
  const choice = event?.choices?.[index];
  if (!choice) return;

  if (choice.restart) return resetGame();
  if (choice.nextChapter === "chapter2") return enterChapterTwo();
  if (choice.nextChapter === "youthSeason") return enterYouthSeason();
  if (choice.nextChapter === "positionCompetition") return enterPositionCompetition();
  if (choice.nextChapter === "juniorBaseball") return enterJuniorBaseball();
  if (choice.nextChapter === "juniorSeason") return enterJuniorSeason();
  if (choice.nextChapter === "highSchool") return enterHighSchool();
  if (choice.nextChapter === "criticalYear") return enterCriticalYear();
  if (choice.nextChapter === "careerTransition") return enterCareerTransition();
  if (choice.nextChapter === "developmentYears") return enterDevelopmentYears();
  if (choice.completeSlice) {
    player.completed = true;
    archiveReplayMemory();
    player.chapter = "垂直切片完成";
    showCurrentEvent();
    return;
  }
  if (choice.sleep) {
    advanceFromNight();
    showCurrentEvent();
    return;
  }

  isTransitioning = true;
  const before = getPlayerSnapshot();
  applyConsequenceAtEvent(eventId);
  applyEffects(choice.effects);
  addPersonalityEffects(choice.personalityEffects);
  addImpressionEffects(choice.impressionEffects);
  applyCharacterArcEffects(choice.arcEffects);
  applySkillEffects(choice.skillEffects);
  if (choice.setPrimaryPosition) {
    player.seasonPosition = choice.setPrimaryPosition;
    addFlags([`primary_position_${positionConfigs[player.seasonPosition]?.affinity || "unknown"}`]);
  }
  if (choice.acceptSuggestedPosition) applySuggestedPositionChange();
  applyPositionSkillEffects(choice.positionSkillEffects);
  applyNestedEffects("relationships", choice.relationshipEffects);
  applyNestedEffects("positionAffinity", choice.positionEffects);
  applyBodyEffects(choice.bodyEffects);
  applyAcademicEffects(choice.academicEffects);
  applyHighSchoolEffects(choice.highSchoolEffects);
  applyCareerEffects(choice.careerEffects);
  applyFinanceEffects(choice.financeEffects);
  applyMatchEffects(choice.matchEffects);
  addFlags(choice.flags);
  (choice.callbackUnlocks || []).forEach(unlockCallback);
  (choice.callbackResolves || []).forEach(item => resolveCallback(typeof item === "string" ? item : item.id, typeof item === "string" ? 1 : item.impact));
  (choice.consequences || []).forEach(addConsequence);
  addLifeThemeEffects(choice.lifeThemeEffects);
  resolveCallbacksForEvent(eventId);
  applyTrainingFocusBonus(choice);
  updateGoalProgressForChoice(eventId, choice);
  if (choice.memory) {
    player.memories.push(choice.memory);
    player.memories = player.memories.slice(-20);
  }
  updateRoute();
  updateImpression();
  if (choice.resolveStartingCompetition) resolveStartingCompetition();
  processCareerArcEvent(eventId, choice);
  processEmotionalEvent(eventId, choice);
  showStatChanges(before, getPlayerSnapshot(), choice.memory);

  if (choice.resolveStartingCompetition) {
    player.forcedEventId = "starter_selection_result";
    window.setTimeout(() => {
      isTransitioning = false;
      showCurrentEvent();
    }, 420);
    return;
  }

  if (choice.resumeAfterPending) {
    player.forcedEventId = "";
    window.setTimeout(() => {
      isTransitioning = false;
      showCurrentEvent();
    }, 420);
    return;
  }

  if (choice.finishChapterOne) finishChapterOne();
  else advanceAfterAction();
  tickPendingEvents(eventId);

  window.setTimeout(() => {
    isTransitioning = false;
    showCurrentEvent();
  }, 420);
}

function enterChapterTwo() {
  applyChapterBreather();
  player.chapterOneEnding = player.ending;
  player.chapterOneEndingDetail = player.endingDetail;
  player.ending = "";
  player.endingDetail = "";
  player.chapter = "少棒入門";
  player.chapter2Phase = "intro";
  player.chapter2Day = 1;
  player.chapter2Step = 0;
  player.phase = "morning";
  showNotice("第二章開始：你正式走進少棒隊。", "success");
  showCurrentEvent();
}

function enterYouthSeason() {
  applyChapterBreather();
  player.chapter = "少棒第一季";
  player.seasonStep = 0;
  player.seasonPerformance = 0;
  player.seasonErrors = 0;
  player.matchState = Object.assign({}, createInitialPlayer().matchState, { runners: [true, false, false] });
  player.phase = "morning";
  showNotice(`${player.chapter2Result}正式進入少棒第一季。`, "success");
  showCurrentEvent();
}

function enterPositionCompetition() {
  applyChapterBreather();
  player.chapter = "位置競爭";
  player.competitionStep = 0;
  player.forcedEventId = "";
  player.pendingEvents = player.pendingEvents.filter(item => item.id !== "starter_selection");
  player.startingCompetition = Object.assign({}, createInitialPlayer().startingCompetition, calculateStartingCompetition(), { active: true });
  player.startingCompetition.initialGap = player.startingCompetition.playerRating - player.startingCompetition.rivalRating;
  schedulePendingEvent({ id: "starter_selection", title: "教練的先發守位測試", remainingActions: 3, eventId: "starter_selection_test" });
  addFlags(["主動競爭"]);
  updateGoals();
  showNotice(`你將以${player.seasonPosition}身分進入下一輪競爭。`, "success");
  showCurrentEvent();
}

function enterJuniorBaseball() {
  applyChapterBreather();
  player.chapter = "青少棒";
  player.age = 13;
  player.juniorStep = 0;
  showNotice("三年過去，身體差距與位置競爭開始改變棒球。", "success");
  showCurrentEvent();
}

function enterJuniorSeason() {
  applyChapterBreather();
  player.chapter = "青少棒分化";
  player.juniorSeasonStep = 0;
  showNotice("青少棒進入主力競爭、課業壓力與升學選擇。", "success");
  showCurrentEvent();
}

function enterHighSchool() {
  applyChapterBreather();
  player.chapter = "青棒";
  player.age = 16;
  player.highSchoolStep = 0;
  showNotice(`你進入${player.highSchoolRoute}，高中棒球正式開始。`, "success");
  showCurrentEvent();
}

function enterCriticalYear() {
  applyChapterBreather();
  player.chapter = "青棒關鍵年";
  player.age = 18;
  player.criticalYearStep = 0;
  showNotice("高中最後一年開始：每次選擇都可能改變生涯出口。", "success");
  showCurrentEvent();
}

function enterCareerTransition() {
  applyChapterBreather();
  player.chapter = "生涯轉換期";
  player.transitionStep = 0;
  if (!player.roleIdentity.primary) changeRoleIdentity(inferRoleIdentity(), "高中階段形成第一個可被市場描述的角色");
  player.careerArc.stage = player.roleIdentity.primary ? "established" : "emerging";
  updateCareerValue();
  showNotice(`你進入「${player.careerExit}」分流，事件鏈將不再相同。`, "success");
  showCurrentEvent();
}

function enterDevelopmentYears() {
  applyChapterBreather();
  player.chapter = "發展期";
  player.age = 20;
  player.developmentStep = 0;
  if (!player.roleIdentity.primary) changeRoleIdentity(inferRoleIdentity(), "進入二十歲發展期時建立初始組織角色");
  player.careerArc.stage = "established";
  updateCareerValue({ trend: "stable" });
  showNotice("二十至二十二歲發展期開始，七個回合將重新評估球員價值。", "success");
  showCurrentEvent();
}

function applyNestedEffects(targetKey, effects = {}) {
  if (!player[targetKey]) player[targetKey] = {};
  Object.entries(effects).forEach(([key, value]) => {
    if (targetKey === "relationships" && key === "teammateBond" && value > 0 && hasConsequence("trust_deficit") && value >= 2) value -= 1;
    player[targetKey][key] = Math.max(0, Math.min(20, (Number(player[targetKey][key]) || 0) + value));
  });
  if (targetKey === "relationships") syncNpcRelationships();
}

function applyMatchEffects(effects = {}) {
  player.seasonPerformance += effects.performance || 0;
  player.seasonErrors += effects.errors || 0;
  const match = player.matchState;
  match.outs = Math.min(3, match.outs + (effects.outs || 0));
  match.awayScore += effects.opponentRuns || 0;
  match.homeScore += effects.teamRuns || 0;
  if (effects.clearBases) match.runners = [false, false, false];
  if (effects.advanceRunners) match.runners = [false, true, false];
}

function applyBodyEffects(effects = {}) {
  const adjusted = Object.assign({}, effects);
  if (hasConsequence("overtraining_tendency") && adjusted.fatigue > 0) {
    const originalFatigue = adjusted.fatigue;
    adjusted.fatigue = Math.ceil(adjusted.fatigue * 1.2);
    if (originalFatigue >= 2) adjusted.injuryRisk = (adjusted.injuryRisk || 0) + 1;
  }
  Object.entries(adjusted).forEach(([key, value]) => {
    player.body[key] = Math.max(0, Math.min(20, (Number(player.body[key]) || 0) + value));
  });
}

function applyChapterBreather() {
  applyEffects({ pressure: -2 });
  applyBodyEffects({ fatigue: -1 });
  if (player.burnout > 0) applyAcademicEffects({ burnout: -1 });
}

function applyAcademicEffects(effects = {}) {
  Object.entries(effects).forEach(([key, value]) => {
    player[key] = Math.max(0, Math.min(20, (Number(player[key]) || 0) + value));
  });
}

function applyHighSchoolEffects(effects = {}) {
  Object.entries(effects).forEach(([key, value]) => {
    player[key] = Math.max(0, Math.min(20, (Number(player[key]) || 0) + value));
  });
}

function applyCareerEffects(effects = {}) {
  Object.entries(effects).forEach(([key, value]) => {
    player[key] = Math.max(0, Math.min(20, (Number(player[key]) || 0) + value));
  });
}

function evaluateMarket() {
  const skills = player.baseballSkills || {};
  const position = player.seasonPosition || "";
  const defenseKeys = position === "捕手" ? ["catching", "throwing", "blocking", "gameCalling"]
    : position === "投手" ? ["control", "pitchStamina", "armStrength", "baseballIQ"]
      : position === "外野手" ? ["range", "armStrength", "catching", "throwing"]
        : ["catching", "throwing", "reaction", "range"];
  const avg = keys => keys.reduce((sum, key) => sum + (Number(skills[key]) || 0), 0) / Math.max(1, keys.length);
  const role = player.roleIdentity?.primary || "";
  const healthPenalty = player.body.injuryRisk * 4 + player.body.pain * 5 + player.body.fatigue * 1.5;
  player.marketEvaluation = {
    offense: Math.round(Math.max(0, Math.min(100, (skills.batting || 0) * 7 + (skills.baseRunning || 0) * 2 + player.recentPerformance * 3))),
    defense: Math.round(Math.max(0, Math.min(100, avg(defenseKeys) * 7 + getPositionCareerValue() * 5))),
    utility: Math.round(Math.max(0, Math.min(100, (skills.baseballIQ || 0) * 6 + (skills.baseRunning || 0) * 3 + (player.secondaryPosition ? 18 : 0) + (role === "工具人" ? 12 : 0)))),
    leadership: Math.round(Math.max(0, Math.min(100, player.responsibility * 4 + player.personality.reliable * 4 + player.relationships.coachTrust * 2 + (role === "板凳領袖" ? 15 : 0)))),
    health: Math.round(Math.max(0, Math.min(100, 100 - healthPenalty + player.body.recovery * 3)))
  };
  return player.marketEvaluation;
}

function calculateCareerValue() {
  const market = evaluateMarket();
  const roleBonus = player.roleIdentity.primary ? 5 : 0;
  const roleFit = player.roleIdentity.primary === "工具人" ? market.utility : player.roleIdentity.primary === "打擊型球員" || player.roleIdentity.primary === "代打" ? market.offense : player.roleIdentity.primary === "板凳領袖" ? market.leadership : market.defense;
  const performance = player.recentPerformance * 3 + player.reputation * 1.5 + player.scoutEvaluation * 2 + player.exposure;
  return Math.round(Math.max(0, Math.min(100, 10 + roleBonus + roleFit * .22 + performance + market.health * .15)));
}

function updateCareerValue(options = {}) {
  if (!player.careerValue) player.careerValue = createInitialPlayer().careerValue;
  const previous = Number(player.careerValue.current) || 0;
  const calculated = calculateCareerValue();
  const next = Math.max(0, Math.min(100, Math.round(calculated + (options.delta || 0))));
  let trend = options.trend || (next >= previous + 5 ? "rising" : next <= previous - 5 ? "declining" : "stable");
  if ((player.careerArc?.stage === "transition" || player.careerArc?.stage === "reinvented") && next > previous) trend = "rebound";
  player.careerValue.current = next;
  player.careerValue.peak = Math.max(player.careerValue.peak || 0, next);
  player.careerValue.minimum = Math.min(player.careerValue.minimum ?? next, next);
  player.careerValue.trend = trend;
  player.careerValue.history = [...(player.careerValue.history || []), next].slice(-40);
  return next;
}

function changeRoleIdentity(nextRole, reason = "") {
  if (!nextRole) return false;
  if (!player.roleIdentity) player.roleIdentity = createInitialPlayer().roleIdentity;
  const current = player.roleIdentity.primary;
  if (current === nextRole) return false;
  if (current && !player.roleIdentity.previous.includes(current)) player.roleIdentity.previous.push(current);
  player.roleIdentity.primary = nextRole;
  const priorRole = current || player.careerArc.lostRole;
  if (priorRole) {
    player.careerArc.reinventions += 1;
    player.careerArc.stage = "reinvented";
    addTurningPoint(`role_change_${player.turningPoints.length + 1}`, `從${priorRole}轉型為${nextRole}`, reason || "舊角色失效後重新定義用途");
    player.careerArc.lostRole = "";
  }
  return true;
}

function addTurningPoint(id, title, impact) {
  if (!id || player.turningPoints.some(point => point.id === id)) return false;
  player.turningPoints.push({ id, title, age: player.age, impact });
  return true;
}

function inferRoleIdentity() {
  const skills = player.baseballSkills;
  if (player.seasonPosition === "捕手" && skills.blocking + skills.gameCalling >= 12) return "捕手核心";
  if (player.seasonPosition === "投手" && skills.control + skills.pitchStamina >= 12) return "中繼投手";
  if (skills.batting >= 9 && skills.batting >= Math.max(skills.catching, skills.range, skills.control) + 2) return player.organizationRole?.includes("代打") ? "代打" : "打擊型球員";
  if (player.secondaryPosition && skills.baseballIQ + skills.baseRunning >= 8) return "工具人";
  if (skills.baseRunning >= 8) return "速度型球員";
  if (player.responsibility + player.personality.reliable >= 13 && player.relationships.teammateBond >= 8) return "板凳領袖";
  return "守備專家";
}

function invalidateCurrentRole(reason) {
  const role = player.roleIdentity.primary;
  if (!role || player.careerArc.stage === "declining") return;
  player.careerArc.stage = "declining";
  player.careerArc.valleys += 1;
  if (!player.roleIdentity.previous.includes(role)) player.roleIdentity.previous.push(role);
  player.careerArc.lostRole = role;
  player.roleIdentity.primary = "";
  addTurningPoint(`role_lost_${player.turningPoints.length + 1}`, `原有角色「${role}」受到挑戰`, reason);
  updateCareerValue({ delta: -12, trend: "declining" });
}

function processCareerArcEvent(eventId, choice) {
  if (eventId === "high_school_showcase") {
    if (!player.roleIdentity.primary) changeRoleIdentity(inferRoleIdentity(), "第一次在球探面前留下可描述的用途");
    player.careerArc.stage = "breakthrough";
    player.careerArc.peaks += 1;
    addTurningPoint("first_market_notice", "第一次被球探正式記錄", "球員角色第一次升值");
    updateCareerValue({ delta: 7, trend: "rising" });
    return;
  }
  if (eventId === "development_competition") {
    const failures = { "守備專家": "隊伍補進更年輕、範圍更大的守備者", "工具人": "新教練要求每名球員證明一項專精", "打擊型球員": "長打與擊球品質停滯", "代打": "球隊需要能同時守備的板凳席", "捕手核心": "年輕捕手開始分走配球與先發局數", "中繼投手": "球速與恢復速度不再形成優勢", "速度型球員": "純代跑名額被壓縮", "板凳領袖": "領導力無法單獨保住球員名額" };
    invalidateCurrentRole(failures[player.roleIdentity.primary] || "新競爭者讓原有用途失去稀缺性");
    return;
  }
  if (eventId === "development_body_choice" && (hasFlag("development_requested_rest") || hasFlag("development_adjusted_role"))) {
    player.careerArc.stage = "transition";
    addTurningPoint("accepted_career_transition", "第一次接受縮小或改變使用方式", "停止只用原角色衡量自己");
    updateCareerValue({ delta: -3, trend: "declining" });
    return;
  }
  if (eventId === "development_body_choice" && hasFlag("development_played_tired")) {
    addTurningPoint("played_through_decline", "在角色下滑時選擇硬撐", "保住短期順位，放大健康代價");
    updateCareerValue({ delta: -8, trend: "declining" });
    return;
  }
  if (eventId === "development_opportunity") {
    let nextRole = inferRoleIdentity();
    if (hasFlag("development_specialized")) nextRole = player.seasonPosition === "捕手" ? "捕手核心" : player.seasonPosition === "投手" ? "中繼投手" : "守備專家";
    if (hasFlag("development_expanded_role") || hasFlag("development_adjusted_role")) nextRole = "工具人";
    if (hasFlag("development_bat_first")) nextRole = player.organizationRole?.includes("代打") ? "代打" : "打擊型球員";
    if (hasFlag("development_health_limited_opportunity") && player.responsibility + player.personality.reliable >= 12) nextRole = "板凳領袖";
    changeRoleIdentity(nextRole, "失去原有優勢後，用新的任務重新取得需求");
    player.careerArc.stage = "reinvented";
    player.careerArc.peaks += 1;
    addTurningPoint("needed_again", "以新的角色再次被球隊需要", `${nextRole}成為新的留隊理由`);
    updateCareerValue({ delta: 9, trend: "rebound" });
    return;
  }
  if (["critical_injury", "transition_rehab_plateau"].includes(eventId) && player.body.injuryRisk >= 7) {
    addTurningPoint("first_major_injury", "第一次因健康失去原有機會", "傷病讓市場重新評價球員用途");
  }
  if (["青棒關鍵年", "生涯轉換期", "發展期"].some(chapter => player.chapter === chapter)) updateCareerValue();
}

function getCareerArcNpcEcho() {
  if (player.careerArc.stage === "declining") {
    if (player.characterArc.azhe === "best_friend" || player.impression.azhe.trusts >= 4) return "阿哲說：『以前的你一定會硬撐，但現在你可以先想清楚要留下什麼。』";
    if (player.relationships.rivalRespect >= 6) return "高橋說：『每個人都有被追上的一天。下一次比的是你怎麼改。』";
    return "山本教練說：『不是每次失去位置，都代表你變差。有時只是球隊不再需要同一種答案。』";
  }
  if (player.careerArc.stage === "reinvented") return "山本教練看完新任務表，只說：『這不是退而求其次，是你重新證明自己能解決什麼。』";
  return "山本教練仍在觀察：一項能力要反覆轉成場上用途，才會成為真正的角色。";
}

function generateCareerSummary() {
  const roles = [...(player.roleIdentity.previous || []), player.roleIdentity.primary].filter(Boolean);
  const lost = player.turningPoints.find(point => point.id.startsWith("role_lost_"));
  const needed = player.turningPoints.find(point => point.id === "needed_again");
  const opening = roles.length > 1 ? `你曾是${roles[0]}，後來轉型為${roles[roles.length - 1]}。` : roles.length ? `你逐漸成為${roles[0]}。` : "你的球員角色直到最後仍沒有完全定型。";
  const fall = lost ? `${lost.title}，${lost.impact}。` : "你沒有遭遇劇烈的角色崩解，但每次評估都迫使你重新證明用途。";
  const rebound = needed ? `${needed.title}：${needed.impact}。` : "你仍在尋找下一種能讓球隊需要你的方法。";
  return `${opening}\n${fall}\n${rebound}\n生涯價值最高 ${player.careerValue.peak}、最低 ${player.careerValue.minimum}，最後趨勢為${({ rising: "上升", stable: "持平", declining: "下降", rebound: "回升" })[player.careerValue.trend] || "持平"}。`;
}

const REPLAY_MEMORY_KEY = "baseballLifeReplayMemories";
const emotionLevelRank = { minor: 1, major: 2, legendary: 3 };

function getEmotionChapter(eventId = "") {
  const map = {
    ending: "十歲暑假", chapter2_result: "少棒入門", youth_season_result: "少棒第一季",
    competition_result: "位置競爭", junior_result: "青少棒分化", junior_season_result: "青少棒球季",
    high_school_result: "青棒第一年", critical_year_result: "高中關鍵年",
    transition_result: "生涯轉換", development_result: "發展期"
  };
  return map[eventId] || player.chapter || "未分類";
}

function recordLifeEvent(data = {}) {
  if (!data.id || player.lifeEvents.some(item => item.id === data.id)) return false;
  player.lifeEvents.push({
    id: data.id,
    title: data.title || data.id,
    age: Number(data.age ?? player.age) || 0,
    importance: Math.max(1, Math.min(5, Number(data.importance) || 1)),
    emotion: data.emotion || "hope",
    remembered: data.remembered !== false,
    chapter: data.chapter || getEmotionChapter(data.eventId)
  });
  return true;
}

function recordEmotionalPeak(data = {}) {
  if (!data.id || player.emotionalPeaks.some(item => item.id === data.id)) return false;
  const level = emotionLevelRank[data.level] ? data.level : "minor";
  player.emotionalPeaks.push({ id: data.id, title: data.title || data.id, age: player.age, chapter: data.chapter || player.chapter, level, emotion: data.emotion || "pride", importance: Number(data.importance) || emotionLevelRank[level] + 2 });
  addFlags([`remembered_peak_${data.id}`]);
  recordLifeEvent({ ...data, importance: Number(data.importance) || emotionLevelRank[level] + 2 });
  return true;
}

function recordLowPoint(data = {}) {
  if (!data.id || player.lowPoints.some(item => item.id === data.id)) return false;
  player.lowPoints.push({ id: data.id, title: data.title || data.id, age: player.age, chapter: data.chapter || player.chapter, emotion: data.emotion || "loss", importance: Number(data.importance) || 3, impact: data.impact || "這件事改變了你看待棒球與自己的方式。" });
  addFlags([`carried_low_${data.id}`]);
  player.lifeThemes.fear = Math.min(20, (player.lifeThemes.fear || 0) + 1);
  recordLifeEvent({ ...data, emotion: data.emotion || "loss", importance: Number(data.importance) || 3 });
  return true;
}

function rememberLifeEvent(id) {
  return player.lifeEvents.find(item => item.id === id && item.remembered);
}

function recordNpcEmotionalCallback(npc, eventId, text, chapter = player.chapter) {
  const id = `${npc}_${eventId}`;
  if (player.npcEmotionalCallbacks.some(item => item.id === id)) return false;
  player.npcEmotionalCallbacks.push({ id, npc, eventId, text, age: player.age, chapter });
  return true;
}

function getNpcEmotionalCallback(npc) {
  if (npc === "azhe" && (rememberLifeEvent("azhe_goodbye") || rememberLifeEvent("azhe_stayed"))) return "阿哲低聲說：『那天如果不是你，我可能已經放棄棒球。』";
  if (npc === "takahashi" && rememberLifeEvent("first_starting_test")) return "高橋說：『我第一次覺得你是對手，就是那場測試。』";
  if (npc === "yamamoto" && rememberLifeEvent("first_appearance")) return "山本教練說：『我一直記得你第一次站上場時的樣子。』";
  return "";
}

function processEmotionalEvent(eventId, choice = {}) {
  const chapter = getEmotionChapter();
  if (eventId === "youth_match_entry") recordEmotionalPeak({ id: "first_appearance", title: "第一次正式上場", chapter, level: "minor", emotion: "joy", importance: 4 });
  if (eventId === "youth_match_mistake") recordLowPoint({ id: "first_failure", title: "第一次在場上失敗", chapter, emotion: "regret", importance: 4, impact: "你第一次知道，失誤會留在心裡，也會逼你決定下一球怎麼辦。" });
  if (eventId === "echo_coach") recordEmotionalPeak({ id: "first_praise", title: "第一次被教練單獨留下", chapter, level: "minor", emotion: "pride", importance: 4 });
  if (eventId === "starter_selection_test") recordLifeEvent({ id: "first_starting_test", title: "第一次爭取先發", chapter, emotion: "hope", importance: 4 });
  if (eventId === "starter_selection_result") {
    if (player.startingCompetition?.result === "win") recordEmotionalPeak({ id: "first_starting_role", title: "第一次贏得位置", chapter, level: "major", emotion: "pride", importance: 5 });
    else recordLowPoint({ id: "first_lost_position", title: "第一次失去位置", chapter, emotion: "loss", importance: 5, impact: "你必須重新回答：沒有先發身分時，自己還能替球隊做什麼。" });
  }
  if (eventId === "junior_friend_exit") {
    const stayed = hasFlag("azhe_stayed") || player.characterArc.azhe === "best_friend";
    if (stayed) recordEmotionalPeak({ id: "azhe_stayed", title: "阿哲選擇留下", chapter, level: "major", emotion: "gratitude", importance: 5 });
    else recordLowPoint({ id: "azhe_goodbye", title: "和阿哲的重要告別", chapter, emotion: "loss", importance: 5, impact: "好友的離開讓你明白，不是每個人都能用同一種方式留在棒球裡。" });
  }
  if (eventId === "junior_pain" || eventId === "critical_injury") recordLowPoint({ id: eventId === "critical_injury" ? "major_injury" : "first_injury", title: eventId === "critical_injury" ? "傷病改變了原本的路" : "第一次感到身體警訊", chapter, emotion: "fear", importance: eventId === "critical_injury" ? 5 : 4, impact: "身體迫使你改變目標、角色與依賴他人的方式。" });
  if (eventId === "high_school_showcase") recordEmotionalPeak({ id: "first_market_notice_emotion", title: "第一次真正被看見", chapter, level: "major", emotion: "pride", importance: 5 });
  if (eventId === "high_school_long_bench") recordLowPoint({ id: "long_bench_low", title: "長時間坐在板凳上", chapter, emotion: "regret", importance: 4, impact: "你開始懷疑，沒有上場的自己還算不算球員。" });
  if (eventId === "development_competition") recordLowPoint({ id: "role_became_invalid", title: "原本的角色失效", chapter, emotion: "loss", importance: 5, impact: "你失去熟悉的位置，被迫尋找另一種留下來的方法。" });
  if (eventId === "development_opportunity") {
    recordEmotionalPeak({ id: "needed_again_emotion", title: "再次被球隊需要", chapter, level: player.careerArc.reinventions > 0 ? "legendary" : "major", emotion: "hope", importance: 5 });
    if (player.careerArc.reinventions > 0 || rememberLifeEvent("major_injury")) recordEmotionalPeak({ id: "first_rebirth", title: "第一次重新成為球員", chapter, level: "legendary", emotion: "relief", importance: 5 });
  }
}

const chapterEmotionDefaults = {
  ending: ["第一次決定如何靠近棒球", "第一次害怕自己不夠好"],
  chapter2_result: ["第一次完成正式訓練", "第一次發現喜歡不等於做得到"],
  youth_season_result: ["第一次像球員一樣完成球季", "第一次承受場上失誤"],
  competition_result: ["第一次真正爭取位置", "第一次面對可能落選"],
  junior_result: ["找到可能適合自己的高中方向", "發現選擇開始受到現實限制"],
  junior_season_result: ["撐過青少棒的分化", "和熟悉的人走向不同方向"],
  high_school_result: ["第一次建立能被描述的價值", "第一次長時間等不到機會"],
  critical_year_result: ["第一次看見職涯出口", "第一次害怕夢想可能結束"],
  transition_result: ["在新組織裡重新找到任務", "離開熟悉舞台的失落"],
  development_result: ["再次被需要", "原本的角色不再有效"]
};

function ensureChapterEmotionCoverage(eventId) {
  const defaults = chapterEmotionDefaults[eventId];
  if (!defaults) return;
  const chapter = getEmotionChapter(eventId);
  if (!player.emotionalPeaks.some(item => item.chapter === chapter)) recordEmotionalPeak({ id: `${eventId}_peak`, title: defaults[0], chapter, level: "minor", emotion: "hope", importance: 3 });
  if (!player.lowPoints.some(item => item.chapter === chapter)) recordLowPoint({ id: `${eventId}_low`, title: defaults[1], chapter, emotion: "fear", importance: 3, impact: "這份不安成為下一章必須回答的問題。" });
  if (player.lifeEvents.filter(item => item.chapter === chapter).length < 2) recordLifeEvent({ id: `${eventId}_memory`, title: `${chapter}留下的記憶`, chapter, emotion: "gratitude", importance: 3 });
}

function generateChapterEndingScene(eventId) {
  if (!chapterEmotionDefaults[eventId]) return "";
  ensureChapterEmotionCoverage(eventId);
  const chapter = getEmotionChapter(eventId);
  const memories = player.lifeEvents.filter(item => item.chapter === chapter && item.remembered).sort((a, b) => b.importance - a.importance);
  const memory = memories[0];
  const npc = ["ending", "chapter2_result", "youth_season_result", "competition_result"].includes(eventId) ? "yamamoto" : ["junior_result", "junior_season_result", "high_school_result"].includes(eventId) ? "azhe" : "takahashi";
  let reaction = getNpcEmotionalCallback(npc);
  if (!reaction) reaction = npc === "azhe" ? "阿哲看了你一眼，像是想把這一章的你記住。" : npc === "takahashi" ? "高橋沒有安慰你，只說下次會再看你怎麼回答。" : "山本教練沒有只談結果，他提醒你別忘了自己是怎麼走到這裡。";
  recordNpcEmotionalCallback(npc, eventId, reaction, chapter);
  if (!player.chapterEndings.some(item => item.id === eventId)) player.chapterEndings.push({ id: eventId, chapter, memoryId: memory?.id || "", npc, age: player.age });
  return `章末記憶：\n${memory ? `你會記得「${memory.title}」。` : "這一章仍留下了一個你說不清楚的感覺。"}\n\n人物回應：\n${reaction}\n\n這一章留下的不只是評價，也留下了下一次必須回答的問題。`;
}

function getReplayMemoryEcho() {
  const memory = player.replayMemories?.[0];
  return memory ? `前一段人生的回聲：\n你曾經也是這樣選擇。那一世，你記得的是「${memory.title}」。` : "";
}

function loadReplayMemories() {
  try { return JSON.parse(localStorage.getItem(REPLAY_MEMORY_KEY) || "[]"); } catch (_) { return []; }
}

function archiveReplayMemory() {
  const memories = [...player.lifeEvents].filter(item => item.remembered).sort((a, b) => b.importance - a.importance || a.age - b.age).slice(0, 5);
  try { localStorage.setItem(REPLAY_MEMORY_KEY, JSON.stringify(memories)); } catch (_) {}
  return memories;
}

function getMostImportantPerson() {
  const scores = [
    ["阿哲", (player.impression.azhe.trusts || 0) + (player.relationships.teammateBond || 0)],
    ["高橋", (player.impression.takahashi.respect || 0) + (player.relationships.rivalRespect || 0)],
    ["山本教練", (player.impression.coach.dependable || 0) + (player.relationships.coachTrust || 0)]
  ];
  return scores.sort((a, b) => b[1] - a[1])[0][0];
}

function generateLifeStory() {
  const events = [...player.lifeEvents].filter(item => item.remembered).sort((a, b) => b.importance - a.importance || a.age - b.age).slice(0, 5);
  const peak = [...player.emotionalPeaks].sort((a, b) => emotionLevelRank[b.level] - emotionLevelRank[a.level] || b.importance - a.importance)[0];
  const low = [...player.lowPoints].sort((a, b) => b.importance - a.importance)[0];
  const turning = player.turningPoints.find(item => item.id === "needed_again") || player.turningPoints.find(item => item.id.startsWith("role_lost_")) || player.turningPoints[0];
  const list = events.length ? events.map(item => `${item.age} 歲｜${item.title}`).join("\n") : "還沒有足以寫進人生傳記的事件。";
  return `你最重要的五件事：\n${list}\n\n最大高峰：${peak?.title || "仍在等待"}\n最大低谷：${low?.title || "尚未留下"}\n最重要的人：${getMostImportantPerson()}\n改變人生的轉折：${turning?.title || "尚未發生"}\n\n${low ? `${low.age} 歲時，你經歷了「${low.title}」。\n${low.impact}` : ""}${peak ? `\n但你後來也記住了「${peak.title}」。` : ""}`;
}

function auditEmotion() {
  return Object.entries(chapterEmotionDefaults).map(([eventId]) => {
    const chapter = getEmotionChapter(eventId);
    const result = {
      chapter,
      peaks: player.emotionalPeaks.filter(item => item.chapter === chapter).length,
      lows: player.lowPoints.filter(item => item.chapter === chapter).length,
      lifeEvents: player.lifeEvents.filter(item => item.chapter === chapter).length,
      npcCallbacks: player.npcEmotionalCallbacks.filter(item => item.chapter === chapter).length
    };
    result.meetsTarget = result.peaks >= 1 && result.lows >= 1 && result.lifeEvents >= 2 && result.npcCallbacks >= 1;
    return result;
  });
}

const signatureSceneLibrary = {
  day1_morning: {
    id: "summer_first_ball", title: "夏天裡的第一顆球", category: "dream", chapter: "十歲暑假",
    location: "住家附近的球場外", object: "畫著歪斜記號的球", characters: ["家人"], action: "你隔著鐵網把手指貼在球縫的方向上", emotion: "hope", silent: true,
    memory: "鐵網被曬得發燙，球場傳來手套接球的悶響。家人沒有催你，只把腳步停在你身後。",
    text: "鐵網被太陽曬得發燙。場內一顆畫著歪斜記號的球滾過紅土，你隔著網子用手指追著它的球縫。家人沒有催你，只把腳步停在身後。"
  },
  chapter2_intro: {
    id: "oversized_first_uniform", title: "第一次穿上球衣", category: "dream", chapter: "少棒入門",
    location: "少棒隊器材室", object: "過大的第一件球衣", characters: ["山本教練"], action: "你反覆把過長的袖口往上折", emotion: "fear", silent: true,
    relationshipMoments: { yamamoto: "joy" }, memory: "球衣大得像借來的人生，手套又硬得闔不起來；器材室裡混著皮革、汗和紅土的味道。",
    text: "器材室裡混著皮革、汗和紅土的味道。球衣尺寸太大，你把袖口折了一次又一次；新手套硬得闔不起來。山本教練看見你戴反手套，沒有笑，只伸手替你轉正。"
  },
  youth_match_entry: {
    id: "first_game_sun", title: "第一次正式上場", category: "first_game", chapter: "少棒第一季",
    location: "午後的少棒球場", object: "磨出第一道摺痕的手套", characters: ["山本教練", "阿哲"], action: "你用鞋釘刮過紅土，才敢抬頭看向守備位置", emotion: "pride", silent: false,
    memory: "太陽壓在帽簷上，灰塵黏住喉嚨；觀眾聲音忽遠忽近，只剩心跳和手套拍擊聲。",
    text: "太陽壓在帽簷上，鞋釘揚起的灰塵黏住喉嚨。看臺的聲音忽遠忽近，你只聽見自己的心跳，以及阿哲拍了一下手套。那只手套終於磨出了第一道屬於你的摺痕。"
  },
  youth_match_mistake: {
    id: "first_error_silence", title: "失誤後沒有滾走的球", category: "loss", chapter: "少棒第一季",
    location: "一壘線旁的紅土", object: "沾著白線粉末的球", characters: ["阿哲"], action: "阿哲撿起球，先擦掉白粉才丟回來", emotion: "regret", silent: true,
    memory: "沒有人立刻責怪你；比責罵更清楚的是球被擦乾淨後落回手套的重量。",
    text: "球停在白線旁，沾了一圈粉末。阿哲沒有說話，只跑過去撿起來，用拇指擦掉白粉，再把球丟回你的手套。那一聲比任何責罵都清楚。"
  },
  starter_selection_test: {
    id: "takahashi_first_duel", title: "第一次和高橋對決", category: "competition", chapter: "位置競爭",
    location: "練習結束後的內野", object: "高橋丟回來的測試球", characters: ["高橋", "山本教練"], action: "高橋抬腿、轉肩，乾脆地把球送向你", emotion: "fear", silent: true,
    memory: "高橋沒有挑釁。球落進手套的啪聲，把兩人之間的沉默切成了競爭。",
    text: "高橋抬腿、轉肩，動作沒有多餘的停頓。球筆直鑽進你的手套——啪。沒有人說話，他只是攤開手掌，等你把同一顆球丟回去。"
  },
  junior_friend_exit: {
    id: "last_practice_with_azhe", title: "畢業前最後一次一起練球", category: "farewell", chapter: "青少棒分化",
    location: "夕陽下的空球場", object: "畫著兩人暗號的球", characters: ["阿哲"], action: "阿哲把最後一顆滾地球停在鞋邊，沒有立刻撿起", emotion: "loss", silent: true,
    relationshipMoments: { azhe: "farewell" }, memory: "夕陽把兩人的影子拉過二游之間；器材都收完了，球場第一次顯得那麼空。",
    text: "器材車已經推走，空球場只剩夕陽把影子拉過二游之間。阿哲把最後一顆滾地球停在鞋邊，沒有立刻撿起。球上還留著你們以前畫下的暗號。"
  },
  junior_pain: {
    id: "first_pain_under_lamp", title: "第一次不敢抬起手臂", category: "injury", chapter: "青少棒球季",
    location: "關燈前的休息區", object: "貼歪的舊護腕", characters: ["山本教練"], action: "你試著抬手，最後只把護腕重新拉緊", emotion: "fear", silent: true,
    memory: "燈一盞盞熄掉，教練看著你的肩膀，等你決定要不要說實話。",
    text: "球場的燈一盞盞熄掉。你試著抬起手臂，疼痛讓動作停在一半，只好把貼歪的護腕重新拉緊。山本教練站在出口，沒有催問。"
  },
  high_school_long_bench: {
    id: "old_number_on_bench", title: "背號在板凳上變舊", category: "loss", chapter: "青棒第一年",
    location: "高中球場的板凳末端", object: "逐漸褪色的舊背號", characters: ["高橋"], action: "你把掌心壓在膝上的背號，聽見先發名單被念完", emotion: "regret", silent: true,
    memory: "沒被叫到名字之後，高橋從場內看了你一眼，隨即把帽簷壓低。",
    text: "先發名單念完時，你的名字沒有出現。膝上的球衣背號已經洗得褪色，你用掌心把它壓平。高橋從場內看了你一眼，沒有揮手，只把帽簷壓低。"
  },
  critical_farewell: {
    id: "last_high_school_locker", title: "最後一次收拾高中置物櫃", category: "farewell", chapter: "高中關鍵年",
    location: "比賽後的更衣室", object: "裂開一小段的舊球棒", characters: ["阿哲", "高橋", "山本教練"], action: "你依序拿出球衣、球棒、手套和壓在最底下的獎狀", emotion: "loss", silent: true,
    relationshipMoments: { azhe: "farewell", takahashi: "farewell", yamamoto: "farewell" }, memory: "櫃子空了以後，比裝滿時更像一段人生；門關上的金屬聲沒有人接話。",
    text: "你從置物櫃依序拿出球衣、裂開一小段的球棒、磨損的手套，以及壓在最底下的獎狀。阿哲靠著門，高橋站在走廊，山本教練只把鑰匙放在長椅上。櫃門關上的金屬聲後，沒有人接話。"
  },
  transition_checkpoint: {
    id: "new_locker_old_glove", title: "把舊手套放進新的置物櫃", category: "dream", chapter: "生涯轉換",
    location: "新組織的陌生更衣室", object: "磨損的手套", characters: ["新隊友"], action: "你把舊手套放進空櫃，留下旁邊一大塊空位", emotion: "hope", silent: true,
    memory: "新的櫃子沒有名字，舊手套卻保留所有接過的球；你第一次知道離開也有重量。",
    text: "新置物櫃沒有名字，裡面只亮著冷白色的燈。你把磨損的手套放進去，旁邊仍空了一大塊。路過的新隊友看了一眼手套上的舊記號，沒有追問。"
  },
  development_opportunity: {
    id: "return_to_field", title: "重新走回被需要的位置", category: "rebirth", chapter: "發展期",
    location: "清晨尚未開放的球場", object: "洗到起毛的護腕", characters: ["高橋", "山本教練"], action: "你把護腕拉緊，踩過當年以為不會再碰到的白線", emotion: "relief", silent: true,
    memory: "草上的水氣沾上鞋尖；這次沒有掌聲，只有有人把球放進你手裡。",
    text: "清晨的球場還沒開放，草上的水氣沾上鞋尖。你把洗到起毛的護腕拉緊，踩過當年以為不會再碰到的白線。沒有人鼓掌；山本教練只是把球放進你手裡，高橋往自己的位置走去。"
  },
  echo_teammate: { id: "azhe_shared_laugh", title: "和阿哲把失誤練成笑話", category: "friendship", chapter: "位置競爭", location: "練習後的球場", object: "畫著暗號的球", characters: ["阿哲"], action: "阿哲模仿自己漏接的動作，終於先笑出聲", emotion: "joy", silent: false, relationshipBeat: "joy", relationshipMoments: { azhe: "joy" }, memory: "你們第一次能笑著談一顆曾經害怕的球。", text: "阿哲模仿自己漏接時僵住的動作，誇張得連帽子都掉了。你們第一次能笑著談那顆曾經害怕的球。" },
  azhe_bond_low: { id: "azhe_distance_line", title: "二游之間看不見的線", category: "friendship", chapter: "位置競爭", location: "二游防區", object: "沒有喊聲的練習球", characters: ["阿哲"], action: "阿哲把球撿起後直接交給教練", emotion: "regret", silent: true, relationshipBeat: "conflict", relationshipMoments: { azhe: "conflict" }, memory: "兩人的守備範圍重疊，眼神卻不再交會。", text: "一顆球停在你和阿哲中間。你們都走了一步，又同時停下；最後他撿起球，直接交給教練。" },
  echo_rival_respect: { id: "takahashi_quiet_respect", title: "高橋第一次留下等你", category: "competition", chapter: "位置競爭", location: "暮色裡的傳接球區", object: "高橋的練習球", characters: ["高橋"], action: "高橋把自己的球袋放回地面", emotion: "pride", silent: true, relationshipBeat: "joy", relationshipMoments: { takahashi: "joy" }, memory: "他沒有稱讚你，只多留了十球。", text: "其他人離開後，高橋原本已背起球袋，卻又把它放回地面。他沒有稱讚你，只抬起手套，示意再來十球。" },
  echo_rival: { id: "takahashi_conflict_throw", title: "高橋不肯放慢的那一球", category: "competition", chapter: "位置競爭", location: "傳接球線", object: "擦過手套邊緣的球", characters: ["高橋"], action: "高橋接回球後立刻加快下一次出手", emotion: "fear", silent: true, relationshipBeat: "conflict", relationshipMoments: { takahashi: "conflict" }, memory: "球擦過手套，高橋連一句道歉也沒有。", text: "球擦過你的手套邊緣，滾出傳接球線。高橋等你撿回來，接球後立刻用更快的動作丟出下一顆。" },
  junior_coach_disagreement: { id: "yamamoto_closed_notebook", title: "山本教練闔上的筆記本", category: "competition", chapter: "青少棒分化", location: "教練室門口", object: "山本教練的舊筆記本", characters: ["山本教練"], action: "教練聽完你的反對，把筆記本慢慢闔上", emotion: "regret", silent: true, relationshipBeat: "conflict", relationshipMoments: { yamamoto: "conflict" }, memory: "你第一次發現信任也容得下不同意。", text: "山本教練聽完後沒有立刻回答。他把寫滿守位記號的舊筆記本慢慢闔上，指尖停在封面，才重新看向你。" },
  transition_relationship: { id: "three_people_reunion", title: "多年後同一顆球又回到手裡", category: "rebirth", chapter: "生涯轉換", location: "舊球場外側", object: "畫著歪斜記號的球", characters: ["阿哲", "高橋", "山本教練"], action: "那顆球在三人之間傳了一圈，最後回到你手裡", emotion: "gratitude", silent: true, relationshipBeat: "reunion", relationshipMoments: { azhe: "reunion", takahashi: "reunion", yamamoto: "reunion" }, memory: "大家都變了，接球的聲音卻和以前一樣。", text: "阿哲先把球拋給高橋，高橋再送到山本教練手裡。那顆畫著歪斜記號的球繞了一圈，最後落回你的掌心。大家都變了，接球的聲音卻和以前一樣。" },
  development_mentor: { id: "yamamoto_reunion_glance", title: "教練再一次看見現在的你", category: "rebirth", chapter: "發展期", location: "看臺最下排", object: "山本教練的舊筆記本", characters: ["山本教練"], action: "教練翻到多年前那頁，又安靜地闔上", emotion: "gratitude", silent: true, relationshipBeat: "reunion", memory: "那頁寫的是以前的你，教練看著的卻是現在。", text: "山本教練翻開舊筆記本，找到多年前寫著你名字的那頁。他看了幾秒，又安靜地闔上。那頁記的是以前的你，他看著的卻是現在。" }
};

function recordSymbolObject(title, sceneId) {
  if (!title) return false;
  const id = title.replace(/\s+/g, "_");
  const existing = player.symbolObjects.find(item => item.id === id);
  if (existing) {
    if (!existing.scenes.includes(sceneId)) existing.scenes.push(sceneId);
    return false;
  }
  player.symbolObjects.push({ id, title, firstScene: sceneId, scenes: [sceneId], remembered: true });
  return true;
}

function recordSignatureScene(data = {}) {
  if (!data.id || player.signatureScenes.some(item => item.id === data.id)) return false;
  const scene = {
    id: data.id, title: data.title || data.id, age: Number(data.age ?? player.age) || 0,
    category: data.category || "dream", chapter: data.chapter || player.chapter,
    memory: data.memory || "", object: data.object || "", characters: data.characters || [],
    location: data.location || "", action: data.action || "", emotion: data.emotion || "hope",
    silent: Boolean(data.silent), relationshipBeat: data.relationshipBeat || "", relationshipMoments: data.relationshipMoments || {}, remembered: data.remembered !== false
  };
  player.signatureScenes.push(scene);
  recordSymbolObject(scene.object, scene.id);
  return true;
}

function getSignatureSceneText(eventId) {
  const scene = signatureSceneLibrary[eventId];
  if (!scene) return "";
  recordSignatureScene(scene);
  return `【記憶場景｜${scene.title}】\n${scene.text}`;
}

function hasLifeEvent(id) {
  return Boolean(rememberLifeEvent(id));
}

function getRevisitSceneText(eventId) {
  if (eventId === "transition_checkpoint" && hasLifeEvent("first_appearance")) return "你摸到手套第一道摺痕，想起第一次上場時，連手套都戴得不太自然。";
  if (eventId === "development_opportunity" && hasLifeEvent("first_lost_position")) return "白線就在腳下。你想起第一次失去先發時，曾以為離開位置就等於離開棒球。";
  if (eventId === "transition_relationship" && hasLifeEvent("azhe_goodbye")) return "你又看見那顆畫著暗號的球。阿哲離開那天，它也曾留在空球場上。";
  return "";
}

function auditSceneQuality() {
  const required = ["location", "characters", "action", "object", "emotion", "memory"];
  const missing = Object.fromEntries(required.map(key => [key, []]));
  player.signatureScenes.forEach(scene => required.forEach(key => {
    const value = scene[key];
    if (!value || (Array.isArray(value) && !value.length)) missing[key].push(scene.id);
  }));
  return {
    total: player.signatureScenes.length,
    missingObjects: missing.object,
    missingCharacters: missing.characters,
    missingActions: missing.action,
    missingMemoryPoints: missing.memory,
    missing
  };
}

function auditEmotionalDensity() {
  const chapters = [...new Set(Object.values(signatureSceneLibrary).map(scene => scene.chapter))];
  return chapters.map(chapter => {
    const scenes = player.signatureScenes.filter(scene => scene.chapter === chapter);
    const objectIds = new Set(scenes.map(scene => scene.object).filter(Boolean));
    const result = {
      chapter,
      signatureScenes: scenes.length,
      memorableScenes: scenes.filter(scene => scene.remembered && scene.memory).length,
      symbolObjects: objectIds.size,
      silentMoments: scenes.filter(scene => scene.silent).length,
      npcUniqueReactions: scenes.filter(scene => scene.characters.length && (scene.action || scene.relationshipBeat)).length
    };
    result.meetsTarget = result.signatureScenes >= 1 && result.memorableScenes >= 1 && result.symbolObjects >= 1 && result.silentMoments >= 1 && result.npcUniqueReactions >= 1;
    return result;
  });
}

function applyFinanceEffects(effects = {}) {
  Object.entries(effects).forEach(([key, value]) => {
    player[key] = Math.max(0, Math.min(20, (Number(player[key]) || 0) + value));
  });
}

function advanceAfterAction() {
  if (player.chapter === "發展期") {
    player.developmentStep += 1;
    if (player.developmentStep >= 7) evaluateDevelopmentYears();
    return;
  }
  if (player.chapter === "生涯轉換期") {
    player.transitionStep += 1;
    if (player.transitionStep >= 5) evaluateCareerTransition();
    return;
  }
  if (player.chapter === "青棒關鍵年") {
    player.criticalYearStep += 1;
    if (player.criticalYearStep >= 8) evaluateCriticalYear();
    return;
  }
  if (player.chapter === "青棒") {
    player.highSchoolStep += 1;
    if (player.highSchoolStep >= 8) evaluateHighSchoolYear();
    return;
  }
  if (player.chapter === "青少棒分化") {
    player.juniorSeasonStep += 1;
    if (player.juniorSeasonStep >= 10) evaluateJuniorSeason();
    return;
  }
  if (player.chapter === "青少棒") {
    player.juniorStep += 1;
    if (player.juniorStep >= 10) evaluateJuniorOpening();
    return;
  }
  if (player.chapter === "位置競爭") {
    player.competitionStep += 1;
    if (player.competitionStep >= 6) evaluatePositionCompetition();
    return;
  }
  if (player.chapter === "少棒第一季") {
    player.seasonStep += 1;
    if (player.seasonStep >= 8) evaluateYouthSeason();
    return;
  }
  if (player.chapter === "少棒入門") {
    player.chapter2Step = (Number(player.chapter2Step) || 0) + 1;
    player.chapter2Phase = player.chapter2Step ? "training" : "intro";
    player.chapter2Day = Math.min(3, Math.max(1, Math.ceil(player.chapter2Step / 2)));
    if (player.chapter2Step >= 6) evaluateChapter2Result();
    return;
  }
  if (player.phase === "morning") player.phase = "afternoon";
  else if (player.phase === "afternoon") player.phase = "night";
}

function advanceFromNight() {
  player.day += 1;
  player.phase = "morning";
}

function finishChapterOne() {
  determineEnding();
  player.phase = "ending";
}

function updateRoute() {
  if (player.instinct >= player.observe + 3 && player.instinct >= player.confidence) player.route = "自由直覺型";
  else if (player.observe >= player.confidence + 2 && player.observe >= player.ballSense) player.route = "觀察理解型";
  else if (player.confidence >= 6 && player.coachAttention >= 4) player.route = "主動爭取型";
  else if (player.pressure >= 6 && player.confidence <= 3) player.route = "慢熱防衛型";
  else player.route = "尚未定型";
}

function determineEnding() {
  updateRoute();
  if (player.confidence >= 8 && player.coachAttention >= 6 && hasFlag("wants_team")) {
    player.ending = "主動入隊";
    player.endingDetail = "你願意被看見，也願意親口爭取機會。教練看見的不是完成品，而是一個敢走進制度裡學習的孩子。";
  } else if (player.observe >= 9 && player.coachAttention >= 4 && hasFlag("wants_team")) {
    player.ending = "觀察型入隊";
    player.endingDetail = "你不是最快衝出去的人，卻總能看見細節。教練願意給這個慢熱、會思考的孩子一個位置。";
  } else if (player.instinct >= 8 && player.ballSense >= 6) {
    player.ending = "公園野球";
    player.endingDetail = "你暫時沒有走進球隊，但在公園裡找到屬於自己的節奏。自由不是逃避，而是你理解棒球的第一種語言。";
  } else if (player.observe >= 8 && player.confidence <= 4) {
    player.ending = "看球分析型";
    player.endingDetail = "你還沒有準備好站到所有人面前，卻已開始用眼睛和腦袋理解棒球。你的起跑點在場邊，而不是場外。";
  } else if (player.pressure >= 6 && player.confidence <= 3 && player.resilience <= 4) {
    player.ending = "暫時退開";
    player.endingDetail = "你暫時離開了球場。這不是失敗，只是現在的你需要安全感，才能重新回答自己是否還想靠近。";
  } else {
    player.ending = "還在尋找姿態";
    player.endingDetail = "你沒有急著替自己下定義。喜歡、害怕、好奇和不服輸仍混在一起，而答案會在下一次把球接住時繼續長出來。";
  }
}

function evaluateChapter2Result() {
  const s = player.baseballSkills;
  if (hasFlag("chapter2_asked_correction") && hasFlag("chapter2_test_read") && player.observe + s.baseballIQ >= 7) {
    setChapter2Result("理解型新生", "你一路在問、在看、在理解。你會把錯誤變成問題，再把問題變成下一次動作的線索。", "你不是反應最快的孩子，但你會看。只要身體跟上，進步會很快。");
  } else if (hasFlag("chapter2_accept_correction") && hasFlag("chapter2_test_safe") && s.catching >= 4) {
    setChapter2Result("基本功型新生", "你願意接受修正，也願意先把球確實接住。你是教練放心慢慢培養的孩子。", "願意重做基本動作很好。棒球不只有天分，願意被修正也很重要。");
  } else if (hasFlag("chapter2_prove_after_correction") && hasFlag("chapter2_test_fast") && s.throwing + player.instinct >= 6) {
    setChapter2Result("直覺型新生", "你被修正後沒有縮回去，而是想用下一球證明自己。動作有風險，也有少見的衝勁。", "你有膽子，也有反應。接下來要學的，是怎麼控制自己的身體。");
  } else if (player.pressure >= 8 && player.confidence <= 3) {
    setChapter2Result("緊張的新生", "你還不習慣每個動作都被看見。你需要更穩定、更可預期的練習節奏。", "先不用急著證明。下一次，只要完成一個動作就好。");
  } else if (s.batting >= 2 && (hasFlag("chapter2_contact_swing") || hasFlag("chapter2_power_swing") || hasFlag("chapter2_studied_pitches"))) {
    setChapter2Result("打擊入口型新生", "你的守備仍在形成，但第一次打擊已讓教練看見另一個上場入口。接下來必須證明揮棒不是偶爾碰到，而是能重複的工具。", "你在打擊區有自己的方法。守備別丟，棒子也繼續磨，名單不只一扇門。");
  } else if (s.catching + s.throwing + s.baseballIQ >= 8) {
    setChapter2Result("均衡型新生", "接球、傳球和理解都有累積。你像一張還沒定型的白紙，適合在下一階段由位置選擇來塑形。", "目前還看不出你最適合哪裡。先把每個基本動作都碰過。");
  } else {
    setChapter2Result("普通的新生", "你沒有特別驚人，也沒有真的掉隊。前三天只證明了一件事：你願意繼續來。", "前三天只是開始。每天比昨天多懂一點，就夠了。");
  }
  const clearTypes = ["理解型新生", "基本功型新生", "直覺型新生", "打擊入口型新生", "均衡型新生"];
  if (clearTypes.includes(player.chapter2Result)) {
    completeGoal("intro_form_type", `中目標完成：形成${player.chapter2Result}`);
    completeGoal("intro_earn_training_place", "教練已給你明確的培養方向");
  } else {
    resolveGoal("intro_form_type", "partial", player.chapter2Result === "緊張的新生" ? "部分成功：教練將以較低壓力方式培養你" : "部分成功：你願意繼續，但類型尚未穩定");
    resolveGoal("intro_earn_training_place", "partial", "你仍在培養名單，下一階段可繼續形成方向");
  }
  player.chapter = "少棒入門小結";
}

function setChapter2Result(result, detail, comment) {
  player.chapter2Result = result;
  player.chapter2ResultDetail = detail;
  player.chapter2CoachComment = `山本教練說：「${comment}」`;
}

function evaluateYouthSeason() {
  const positions = calculatePositionRatings();
  player.seasonPosition = player.seasonPosition || positions[0].position;
  player.secondaryPosition = positions.find(item => item.position !== player.seasonPosition)?.position || positions[1].position;

  const trust = player.relationships.coachTrust;
  const bond = player.relationships.teammateBond;
  const respect = player.relationships.rivalRespect;
  if (player.seasonPerformance >= 6 && trust >= 5) {
    player.seasonResult = "可靠的新輪替球員";
    player.seasonRole = "替補起步，開始獲得固定上場機會";
    player.seasonResultDetail = "你沒有立刻成為明星，但教練已願意在比賽中把任務交給你。你的價值來自完成動作，也來自失誤後仍能留在場上。";
  } else if (bond >= 5) {
    player.seasonResult = "被隊伍接納的新生";
    player.seasonRole = "板凳支援與團隊輪替";
    player.seasonResultDetail = "你的個人表現仍不穩定，但隊友開始主動和你傳球、提醒站位。你先得到歸屬，再慢慢爭取位置。";
  } else if (respect >= 3 || player.relationships.rivalCompetition >= 5) {
    player.seasonResult = "競爭中成長的新生";
    player.seasonRole = "位置競爭者";
    player.seasonResultDetail = "高橋的存在讓你看清差距，也逼你形成自己的方法。競爭可能讓你成長，也可能讓你過度證明自己。";
  } else if (player.seasonErrors >= 2 && player.resilience >= 7) {
    player.seasonResult = "失誤後留下來的人";
    player.seasonRole = "觀察名單與後段替補";
    player.seasonResultDetail = "你在第一次比賽留下失誤，卻沒有因此逃開。教練暫時不會給你大量機會，但已記住你面對失敗的方式。";
  } else {
    player.seasonResult = "仍在適應隊伍的新生";
    player.seasonRole = "板凳與多位置測試";
    player.seasonResultDetail = "第一季沒有替你決定長期位置。你仍在學習如何讓自己的能力，變成隊伍真正需要的東西。";
  }

  const commentByResult = {
    "可靠的新輪替球員": "我開始知道什麼時候可以把下一球交給你。接下來要證明的是穩定。",
    "被隊伍接納的新生": "棒球不是一個人打的。隊友願意和你一起完成動作，這也是能力。",
    "競爭中成長的新生": "想贏過別人沒有錯，但先分清楚你是在成長，還是在逞強。",
    "失誤後留下來的人": "失誤我看見了，你沒有躲開，我也看見了。",
    "仍在適應隊伍的新生": "還不用急著替自己找答案。先讓我知道你每天都能做到什麼。"
  };
  player.seasonCoachComment = `山本教練說：「${commentByResult[player.seasonResult]}」`;
  if (["可靠的新輪替球員", "被隊伍接納的新生", "競爭中成長的新生"].includes(player.seasonResult)) completeGoal("youth_next_opportunity", `中目標完成：${player.seasonRole}`);
  else resolveGoal("youth_next_opportunity", "partial", `部分成功：${player.seasonRole}；教練已給出下一個改善方向`);
  player.chapter = "少棒第一季小結";
}

function evaluatePositionCompetition() {
  const trust = player.relationships.coachTrust;
  const bond = player.relationships.teammateBond;
  const respect = player.relationships.rivalRespect;
  if (trust >= 8 && hasFlag("competition_safe_solution")) {
    player.competitionResult = "教練開始把你列入固定輪替";
    player.competitionDetail = "你靠穩定處理與長期累積的信任守住位置。這條路不一定最快被注意，卻最容易獲得下一次任務。";
  } else if (bond >= 7) {
    player.competitionResult = "隊友願意替你補上空隙";
    player.competitionDetail = "你的位置不只由個人能力構成。阿哲願意提醒、配合和等待，讓你在隊形裡發揮得比單獨測試更好。";
  } else if (respect >= 5) {
    player.competitionResult = "高橋承認你是正式競爭者";
    player.competitionDetail = "你還沒有完全贏得位置，但競爭已從單方面追趕變成彼此推動。高橋會讓你成長，也會放大你逞強的風險。";
  } else if (hasFlag("chose_recovery")) {
    player.competitionResult = "你選擇延長競爭，而不是耗盡自己";
    player.competitionDetail = "你沒有用一次過量加練換取短期印象。這讓上位速度變慢，卻替未來的身體系統留下更安全的起點。";
  } else {
    player.competitionResult = "你仍在名單的問號裡";
    player.competitionDetail = "這次測驗沒有替你鎖定位置，但你留下的紀律、理解或直覺，會繼續改變後續事件的權重。";
  }
  if (player.competitionResult === "你仍在名單的問號裡") resolveGoal("competition_claim_role", "partial", "部分成功：尚未固定守位，但已保留追趕入口");
  else completeGoal("competition_claim_role", `階段目標完成：${player.competitionResult}`);
  player.chapter = "位置競爭小結";
}

function evaluateJuniorOpening() {
  if (hasFlag("accepted_junior_position_change") && player.observe + player.discipline >= 8) {
    player.juniorResult = "為了上場而重新定義自己";
    player.juniorPath = "多位置工具人起點";
    player.juniorDetail = "你沒有把守位當成身份的全部。轉換帶來短期不適，卻讓教練開始用『球隊缺什麼』而不是『你原本是什麼』來安排你。";
  } else if (hasFlag("requested_final_position_chance") && player.relationships.rivalCompetition >= 6) {
    player.juniorResult = "留在原位繼續正面競爭";
    player.juniorPath = `${player.seasonPosition}競爭路線`;
    player.juniorDetail = "你替原本的位置爭取到期限。高橋仍在前面，而接下來每次測驗都會同時檢驗技術、身體與抗壓。";
  } else if (hasFlag("refused_junior_position_change")) {
    player.juniorResult = "堅持個人風格的代價開始出現";
    player.juniorPath = "低出賽、高自主性路線";
    player.juniorDetail = "你保住了想成為的球員樣子，也失去部分教練信任。未來必須用更突出的表現，換回同樣的上場機會。";
  } else {
    player.juniorResult = "身體與技術仍在等待彼此";
    player.juniorPath = "延後定型";
    player.juniorDetail = "你沒有在十三歲立刻分出高下。接下來的成長速度、恢復能力與選擇，會比現在的單次測驗更重要。";
  }
  if (hasFlag("hid_first_pain")) {
    player.juniorDetail += " 你隱瞞了第一次疼痛，這個旗標將提高未來傷病事件的權重。";
  } else if (hasFlag("reported_first_pain")) {
    player.juniorDetail += " 你及早回報疼痛，暫時失去測試時間，卻建立了更安全的身體管理習慣。";
  }
  if (player.juniorPath === "延後定型" || player.juniorPath === "低出賽、高自主性路線") resolveGoal("junior_keep_role", "partial", `部分成功：${player.juniorPath}；仍保留後續修正入口`);
  else completeGoal("junior_keep_role", `中目標完成：${player.juniorPath}`);
  if (player.juniorPath === "延後定型") resolveGoal("junior_sustainable_path", "partial", "方向尚未定型，但你仍留在球隊觀察名單");
  else completeGoal("junior_sustainable_path", "你建立了可延續到高中的用途");
  player.chapter = "青少棒開場小結";
}

function evaluateJuniorSeason() {
  if (hasFlag("chose_powerhouse_high_school")) {
    player.highSchoolRoute = "強豪高中・高競爭高曝光";
  } else if (hasFlag("chose_playing_time_high_school")) {
    player.highSchoolRoute = "普通高中・穩定出賽";
  } else {
    player.highSchoolRoute = "課業並行・保留多重道路";
  }
  const schoolFit = evaluateJuniorSchoolFit();
  player.juniorSchoolFit = schoolFit;
  const fitMessage = `${schoolFit.label}：${player.highSchoolRoute}。${schoolFit.reasons.join("；")}`;
  if (schoolFit.level === "complete") completeGoal("junior_school_entry", fitMessage);
  else resolveGoal("junior_school_entry", schoolFit.level, fitMessage);
  if (schoolFit.level === "complete") completeGoal("junior_enter_high_school", "這個入口符合你的球員狀態，也有可持續方案");
  else if (schoolFit.level === "success") resolveGoal("junior_enter_high_school", "success", `成功進入高中，但仍需處理：${schoolFit.reasons.join("、")}`);
  else if (schoolFit.level === "partial") resolveGoal("junior_enter_high_school", "partial", `只能接受帶有明顯風險的入口。修正方向：${schoolFit.recovery}`);
  else resolveGoal("junior_enter_high_school", "failed", `高中選擇大幅受限。修正方向：${schoolFit.recovery}`);

  if (player.body.injuryRisk >= 7 || hasFlag("continued_hiding_pain")) {
    player.juniorSeasonResult = "帶著未解決的身體風險升學";
    player.juniorSeasonDetail = "你沒有因疼痛立刻離場，卻讓代償動作與復發風險進入高中。下一階段的訓練強度可能放大這個選擇。";
  } else if (player.burnout >= 5) {
    player.juniorSeasonResult = "能力向前，動機開始磨損";
    player.juniorSeasonDetail = "你同時撐住訓練、比賽和課業，但棒球逐漸從期待變成不能失敗的責任。高中篇需要處理倦怠，而不只是能力成長。";
  } else if (hasFlag("junior_competed_leadership") && player.relationships.teammateBond >= 7) {
    player.juniorSeasonResult = "從位置競爭者變成場上組織者";
    player.juniorSeasonDetail = "你沒有只用個人成績競爭主力，而是讓整組守備變得更清楚。這條路會提高捕手、二壘與工具人價值。";
  } else if (hasFlag("withdrew_for_health") || hasFlag("accepted_junior_rehab")) {
    player.juniorSeasonResult = "用短期機會換取較長的生涯";
    player.juniorSeasonDetail = "你曾因身體退出競爭，卻沒有因此離開棒球。這會降低短期曝光，也建立日後面對傷病的管理習慣。";
  } else {
    player.juniorSeasonResult = "以未完成的球員身分進入高中";
    player.juniorSeasonDetail = "你在技術、身體、課業與關係之間取得暫時平衡。真正的分化將在高中訓練強度與曝光壓力下發生。";
  }
  player.chapter = "青少棒階段小結";
}

function evaluateJuniorSchoolFit() {
  const injury = player.body.injuryRisk;
  const pain = player.body.pain;
  const academics = player.academics;
  const burnout = player.burnout;
  const hiddenPain = hasFlag("continued_hiding_pain");
  const hasStableRole = !["延後定型", "低出賽、高自主性路線"].includes(player.juniorPath);
  const severe = injury >= 9 || pain >= 6 || burnout >= 8 || academics <= 1 || (hiddenPain && injury >= 7);
  const reasons = [];
  let fitScore = 0;

  if (hasFlag("chose_powerhouse_high_school")) {
    if (injury <= 4 && pain <= 1 && burnout <= 4 && player.motivation >= 8 && (hasStableRole || player.exposure >= 3)) fitScore = 3;
    else if (injury <= 6 && pain <= 3 && burnout <= 6 && player.motivation >= 6) fitScore = 2;
    else fitScore = 1;
    if (injury >= 6 || pain >= 3) reasons.push("高競爭環境會放大身體風險");
    if (!hasStableRole) reasons.push("尚未建立能穿過強豪競爭的場上用途");
  } else if (hasFlag("chose_playing_time_high_school")) {
    if (injury <= 6 && burnout <= 5 && hasStableRole) fitScore = 3;
    else if (injury <= 7 && burnout <= 6) fitScore = 2;
    else fitScore = 1;
    if (!hasStableRole) reasons.push("穩定出賽仍缺少明確守位用途");
    if (injury >= 7) reasons.push("即使有出賽承諾，健康仍可能限制上場");
  } else {
    if (academics >= 6 && burnout <= 4 && injury <= 6) fitScore = 3;
    else if (academics >= 4 && burnout <= 6) fitScore = 2;
    else fitScore = 1;
    if (academics < 4) reasons.push("課業資格不足以支撐並行方案");
    if (burnout >= 6) reasons.push("兩條道路同時維持的負荷過高");
  }

  if (severe) fitScore = 0;
  if (!reasons.length) reasons.push(fitScore === 3 ? "入口與目前的健康、角色及生活條件相符" : "已有入口，但仍需進校後重新驗證");
  const levels = ["failed", "partial", "success", "complete"];
  const labels = ["未完成", "部分成功", "成功", "完全成功"];
  const recovery = injury >= 7 || pain >= 4 ? "進高中前先完成復健與負荷重設" : academics < 4 ? "補足入學資格並建立固定讀書時段" : !hasStableRole ? "在高一前押注一項可上場工具" : "降低倦怠並重新確認升學動機";
  return { level: levels[fitScore], label: labels[fitScore], reasons, recovery };
}

function evaluateHighSchoolYear() {
  if (hasFlag("accepted_high_school_utility_role") || hasFlag("high_school_commit_utility")) {
    player.highSchoolTeamRole = "多位置工具人與後段輪替";
  } else if (hasFlag("focused_high_school_position")) {
    player.highSchoolTeamRole = `${player.seasonPosition}專職競爭者`;
  } else {
    player.highSchoolTeamRole = "打擊入口與守備替補";
  }
  if (player.body.injuryRisk >= 8 || player.body.pain >= 5) {
    player.highSchoolResult = "高中強度放大了舊有身體風險";
    player.highSchoolDetail = "你仍留在球隊，但訓練與出賽安排開始受傷病限制。下一階段必須在曝光、復健與轉型之間做出更昂貴的選擇。";
  } else if (player.scoutEvaluation >= 5 && player.exposure >= 3) {
    player.highSchoolResult = "球探開始建立你的追蹤資料";
    player.highSchoolDetail = "你還不是高順位候選人，但多位置、戰術理解或工具能力已讓市場願意再看一次。被追蹤也會帶來新的表現壓力。";
  } else if (player.burnout >= 6 || player.dormStress >= 5) {
    player.highSchoolResult = "你在球隊裡留下來，生活卻開始失衡";
    player.highSchoolDetail = "能力仍在成長，但寮生活、課業與競爭正在消耗動機。下一年最大的對手可能不是其他球員，而是你是否還想每天走進球場。";
  } else if (player.relationships.coachTrust >= 9) {
    player.highSchoolResult = "教練願意給你穩定的任務";
    player.highSchoolDetail = "你沒有靠單一亮點進入核心名單，而是靠可預期的執行與多重用途取得位置。這條道路接近長期工具人或守備型先發。";
  } else {
    player.highSchoolResult = "仍在曝光邊緣的高中球員";
    player.highSchoolDetail = "你完成第一年，卻尚未建立明確市場標籤。第二年需要在專精、全面性或身體上限中選擇真正的投資方向。";
  }
  completeGoal("high_school_clear_task", `小目標完成：${player.highSchoolTeamRole}`);
  const valueAssessment = evaluateHighSchoolValue();
  player.highSchoolValueAssessment = valueAssessment;
  const valueMessage = `${valueAssessment.label}：${valueAssessment.reasons.join("；")}`;
  if (valueAssessment.level === "complete") completeGoal("high_school_described_value", valueMessage);
  else resolveGoal("high_school_described_value", valueAssessment.level, valueMessage);
  if (valueAssessment.level === "complete" && player.body.injuryRisk <= 7 && player.burnout <= 5) completeGoal("high_school_market_identity", "你建立了可延續到關鍵年的球員定位");
  else if (["complete", "success"].includes(valueAssessment.level)) resolveGoal("high_school_market_identity", "success", `角色已成立，但延續前仍需處理：${valueAssessment.recovery}`);
  else if (valueAssessment.level === "partial") resolveGoal("high_school_market_identity", "partial", `定位仍不完整。下一階段修正入口：${valueAssessment.recovery}`);
  else resolveGoal("high_school_market_identity", "failed", `尚未建立固定角色。高三前必須：${valueAssessment.recovery}`);
  if (["complete", "success"].includes(valueAssessment.level)) {
    changeRoleIdentity(inferRoleIdentity(), "青棒第一年完成方向、能力與實戰證明");
    player.careerArc.stage = "emerging";
  }
  updateCareerValue();
  player.chapter = "青棒第一年小結";
}

function evaluateHighSchoolValue() {
  const positionRating = getPositionAssessment(player.seasonPosition)?.rating || 0;
  const utilityDirection = hasFlag("accepted_high_school_utility_role") || hasFlag("high_school_commit_utility");
  const positionDirection = hasFlag("focused_high_school_position");
  const battingDirection = hasFlag("developed_high_school_bat") || hasFlag("high_school_commit_upside");
  const proofReady = hasFlag("showcase_team_task") || hasFlag("showcase_tools") || hasFlag("showcase_baseball_iq");
  const direction = utilityDirection ? "工具人" : positionDirection ? `${player.seasonPosition}專職` : battingDirection ? "打擊入口" : "定位模糊";
  let skillReady = false;
  if (utilityDirection) skillReady = Boolean(player.secondaryPosition) && player.baseballSkills.baseballIQ + player.baseballSkills.baseRunning >= 8;
  else if (positionDirection) skillReady = positionRating >= 15;
  else if (battingDirection) skillReady = player.baseballSkills.batting >= 9;

  const healthy = player.body.injuryRisk < 8 && player.body.pain < 5;
  const stableLife = player.burnout < 7 && player.dormStress < 6;
  const opportunityOnly = player.relationships.coachTrust >= 9 && !skillReady;
  const criticalLoad = player.body.injuryRisk >= 13 || player.body.pain >= 9 || player.burnout >= 10 || player.dormStress >= 9;
  const rivalryTunnel = player.lifeThemes.competition >= 3 && player.relationships.coachTrust < 9 && player.relationships.teammateBond < 7;
  const successRiskLimit = battingDirection && player.baseballSkills.batting >= 12 ? 11 : 10;
  const severe = !healthy || !stableLife || (!skillReady && !proofReady && player.relationships.coachTrust < 7);
  let level = "failed";
  if (!criticalLoad && !opportunityOnly && skillReady && proofReady && healthy && stableLife) level = "complete";
  else if (!criticalLoad && !opportunityOnly && skillReady && proofReady && player.body.injuryRisk <= successRiskLimit && player.body.pain <= 6 && player.burnout <= 7 && player.dormStress <= 6) level = "success";
  else if (!criticalLoad && !opportunityOnly && skillReady && proofReady) level = "partial";
  else if (!criticalLoad && !opportunityOnly && (skillReady || proofReady) && !severe) level = "partial";
  if (rivalryTunnel && level === "complete") level = "success";
  else if (rivalryTunnel && level === "success") level = "partial";

  const reasons = [`方向：${direction}`, skillReady ? "相應能力已達可使用水準" : "相應能力尚未跟上選擇", proofReady ? "已在交流賽留下實際證明" : "仍缺少一次場上證明"];
  if (opportunityOnly) reasons.push("教練信任提供了機會，但不能替代場上用途");
  if (rivalryTunnel) reasons.push("你已成為值得尊敬的對手，卻仍需回答自己能替球隊提供什麼");
  if (!healthy) reasons.push("健康風險限制角色延續");
  if (!stableLife) reasons.push("生活負荷正在侵蝕穩定性");
  const recovery = !skillReady ? `集中補強${direction}所需能力` : !proofReady ? "在高三前完成一次可被記錄的任務" : !healthy ? "先重設訓練負荷與復健方案" : !stableLife ? "重建課業、寮生活與恢復節奏" : "把目前角色轉成更穩定的比賽紀錄";
  const labels = { complete: "完全成功", success: "成功", partial: "部分成功", failed: "未完成" };
  return { level, label: labels[level], direction, skillReady, proofReady, reasons, recovery };
}

function evaluateCriticalYear() {
  const positionValue = getPositionCareerValue();
  const offensiveValue = getOffensiveCareerValue();
  player.careerPrimaryTool = offensiveValue >= 2 && offensiveValue > positionValue ? "打擊" : positionValue > 0 ? player.seasonPosition : "綜合能力";
  if (hasFlag("entered_high_school_draft")) {
    if (player.scoutEvaluation + Math.max(positionValue, offensiveValue) >= 7 && player.body.injuryRisk <= 6) {
      player.careerExit = "高卒選秀・中後段指名候選";
      player.criticalYearResult = "球團願意為你的可用性下注";
      player.criticalYearDetail = "你不是最耀眼的高中生，但多位置、近期表現與誠信讓球團相信你可能在職業體系找到角色。順位不高，養成耐心也有限。";
    } else {
      player.careerExit = "高卒選秀・落選／培訓測試";
      player.criticalYearResult = "你把名字交給市場，卻沒有得到保證";
      player.criticalYearDetail = "曝光、能力或健康疑慮讓球團不願使用正式順位。你仍可能獲得測試邀請，但已必須準備另一條道路。";
    }
  } else if (hasFlag("chose_college_baseball")) {
    player.careerExit = "大學棒球";
    player.criticalYearResult = "你選擇用四年延長成長曲線";
    player.criticalYearDetail = "大學提供復健、技術與再次曝光的時間，也帶來新的主力競爭。晚熟可能成為優勢，停滯則可能讓市場徹底離開。";
  } else if (hasFlag("chose_amateur_baseball")) {
    player.careerExit = "業餘／社會人棒球";
    player.criticalYearResult = "你把棒球放進現實生活，而不是離開它";
    player.criticalYearDetail = "工作、經濟與訓練將同時存在。這條路曝光較少，卻保留晚成選秀與長期參與棒球的可能。";
  } else {
    player.careerExit = "復健與生涯暫停";
    player.criticalYearResult = "你拒絕讓高中期限決定身體";
    player.criticalYearDetail = "暫停競爭會失去曝光與既有名單位置，但也可能避免一場大傷把所有球員道路一起關閉。";
  }
  if (player.body.injuryRisk >= 8 || player.body.pain >= 5) addTurningPoint("first_major_injury", "第一次因健康失去原有機會", "傷病讓高中角色與市場評價同時下修");
  updateCareerValue();
  player.chapter = "青棒生涯出口";
}

function evaluateCareerTransition() {
  if (player.careerExit.startsWith("高卒")) {
    player.organizationRole = player.careerPrimaryTool === "打擊" ? "職業球團打擊養成／代打候選" : hasFlag("pro_accepted_utility_test") ? "職業球團育成工具人" : hasFlag("pro_showed_primary_tool") ? "單一工具養成球員" : "新人營守備競爭者";
    player.transitionResult = "你已踏進職業體系，但仍在名單邊緣";
    player.transitionDetail = "進職棒沒有結束競爭，只把競爭改成每天的工作。球團會根據用途、健康與養成成本決定願意等你多久。";
  } else if (player.careerExit === "大學棒球") {
    player.organizationRole = hasFlag("college_health_first") ? "復健與晚熟培養" : hasFlag("college_claimed_role") ? "大學輪替競爭者" : "多位置重新測試球員";
    player.transitionResult = "你用大學延長了成長曲線";
    player.transitionDetail = "四年是機會也是期限。課業資格、主力競爭與身體成熟將共同決定你能否再次進入選秀視野。";
  } else if (player.careerExit === "業餘／社會人棒球") {
    player.organizationRole = "工作與球員雙重身份";
    player.transitionResult = player.finances >= 6 ? "你先建立能長期打球的生活" : "棒球機會仍在，經濟壓力也開始追趕";
    player.transitionDetail = "業餘路線沒有把夢想取消，而是要求你同時管理收入、訓練和有限曝光。晚成機會依然存在。";
  } else {
    player.organizationRole = hasFlag("rehab_helped_youth") ? "復健球員與基層協助者" : hasFlag("rehab_changed_style") ? "傷後轉型測試者" : "無球隊復健球員";
    player.transitionResult = "你正在重新定義回到棒球的意思";
    player.transitionDetail = "復健不是等待舊身體回來，而是判斷還能成為哪一種球員，甚至是否用另一種角色留在棒球裡。";
  }
  const transitionRole = player.organizationRole.includes("工具人") || player.organizationRole.includes("多位置") ? "工具人"
    : player.organizationRole.includes("代打") || player.careerPrimaryTool === "打擊" ? "打擊型球員"
      : player.organizationRole.includes("基層") ? "板凳領袖" : inferRoleIdentity();
  changeRoleIdentity(transitionRole, "新的組織重新定義球員用途");
  addTurningPoint("entered_new_organization", "第一次進入新的球員評價體系", player.transitionResult);
  updateCareerValue();
  player.chapter = "生涯轉換期小結";
}

function evaluateDevelopmentYears() {
  player.age = 22;
  const marketScore = player.scoutEvaluation + player.recentPerformance + player.reputation + Math.floor(player.exposure / 2) + Math.max(getPositionCareerValue(), getOffensiveCareerValue()) - player.body.injuryRisk;
  if (player.careerExit.startsWith("高卒")) {
    if (marketScore >= 12) {
      player.marketOutcome = "一軍短期升格／正式名單競爭";
      player.developmentResult = "職業體系開始把你當成可用戰力";
      player.developmentDetail = "你仍不是穩定一軍球員，但角色、健康與近期表現已足以換到真正的升格機會。";
    } else {
      player.marketOutcome = "二軍續留邊緣／球團耐心下降";
      player.developmentResult = "職業名額開始計算你的替代成本";
      player.developmentDetail = "年紀與新秀加入讓球團不再只看潛力。下一次評估可能直接決定釋出或轉隊。";
    }
  } else if (player.careerExit === "大學棒球") {
    player.marketOutcome = marketScore >= 11 ? "大卒選秀追蹤名單" : "大學主力／落選風險並存";
    player.developmentResult = marketScore >= 11 ? "四年成長讓球探重新回來" : "大學延長了時間，尚未消除市場疑問";
    player.developmentDetail = "大學路線的價值取決於二十二歲時能否立即使用，而不再只是晚熟想像。";
  } else if (player.careerExit === "業餘／社會人棒球") {
    player.marketOutcome = marketScore >= 10 ? "晚成選秀／職業測試邀請" : "業餘主力與穩定工作";
    player.developmentResult = marketScore >= 10 ? "有限曝光終於形成職業入口" : "你建立了能長期留在棒球裡的生活";
    player.developmentDetail = "職業機會不一定出現，但經濟與棒球不再只能二選一。";
  } else {
    player.marketOutcome = player.body.injuryRisk <= 4 ? "復出測試／業餘隊邀請" : "持續復健／轉向第二角色";
    player.developmentResult = player.body.injuryRisk <= 4 ? "你重新取得以球員身分被評估的資格" : "回到原本球員樣貌不再是唯一答案";
    player.developmentDetail = "復健結果同時打開球員測試、基層協助與棒球第二職涯的可能。";
  }
  evaluateMarket();
  updateCareerValue();
  player.chapter = "二十二歲職涯小結";
}

function showCurrentEvent() { showStory(getCurrentEventId()); }

function showStory(eventId) {
  ensureIncrementalSystems();
  if (player.forcedEventId) eventId = player.forcedEventId;
  const event = getEvent(eventId);
  if (!event) {
    document.getElementById("story").innerHTML = "<div class='event-card'><h2>找不到下一個事件</h2><p>請讀取存檔或重新開始。</p></div>";
    document.getElementById("choices").innerHTML = "";
    updateStatus();
    return;
  }
  prepareMatchStateForEvent(eventId);
  updateGoals(eventId);
  refreshStartingCompetition();
  player.lastEventTitle = event.title;
  let text = typeof event.text === "function" ? event.text() : event.text;
  const chapterEnding = generateChapterEndingScene(eventId);
  const replayEcho = eventId === "day1_morning" ? getReplayMemoryEcho() : "";
  const signatureScene = getSignatureSceneText(eventId);
  const revisitScene = getRevisitSceneText(eventId);
  if (signatureScene) text += `\n\n${signatureScene}`;
  if (revisitScene) text += `\n\n【往日回聲】\n${revisitScene}`;
  if (chapterEnding) text += `\n\n${chapterEnding}`;
  if (replayEcho) text += `\n\n${replayEcho}`;
  const matchHud = eventId.startsWith("youth_match_") ? renderMatchHud() : "";
  document.getElementById("story").innerHTML = `<article class="event-card">${matchHud}<div class="event-kicker">${escapeHtml(getTimeLabel())}</div><h2>${escapeHtml(event.title)}</h2><div class="event-text">${escapeHtml(text)}</div></article>`;
  document.getElementById("choices").innerHTML = event.choices.map((choice, index) => `<button type="button" onclick="choose('${eventId}', ${index})">${escapeHtml(choice.text)}</button>`).join("");
  updateStatus();
  if (player.goalState?.recentProgress?.length) {
    const feedback = consumeGoalFeedback();
    document.getElementById("changeLog").innerHTML += feedback.map(item => `<div class="${item.type === "complete" ? "goal-complete" : item.type === "success" ? "goal-success" : item.type === "partial" ? "goal-partial" : item.type === "failed" ? "goal-failed" : "goal-progress-change"}">${escapeHtml(item.message)}</div>`).join("");
  }
}

function prepareMatchStateForEvent(eventId) {
  const match = player.matchState;
  if (eventId === "youth_match_entry" || eventId === "youth_match_grounder") {
    Object.assign(match, { inning: 4, half: "上", outs: 1, runners: [true, false, false] });
  } else if (eventId === "youth_match_mistake") {
    Object.assign(match, { inning: 5, half: "上", outs: 0, runners: [false, false, false] });
  } else if (eventId === "youth_match_after") {
    Object.assign(match, { inning: 6, half: "終", outs: 3, runners: [false, false, false] });
  }
}

function renderMatchHud() {
  const match = player.matchState;
  const bases = match.runners.map((occupied, index) => `<span class="base ${occupied ? "occupied" : ""}" title="${index + 1}壘"></span>`).join("");
  return `<section class="match-hud" aria-label="目前比賽局面">
    <div class="inning"><strong>${match.inning} 局${match.half}</strong><span>${match.outs} 出局</span></div>
    <div class="score"><span>客隊 <strong>${match.awayScore}</strong></span><span>少棒隊 <strong>${match.homeScore}</strong></span></div>
    <div class="diamond">${bases}</div>
  </section>`;
}

function getTimeLabel() {
  if (player.completed) return "測試完成";
  if (player.chapter === "少棒入門") return `少棒入門・第 ${player.chapter2Step + 1}／6 階段`;
  if (player.chapter === "少棒入門小結") return "少棒入門・階段評估";
  if (player.chapter === "少棒第一季") return `少棒第一季・第 ${player.seasonStep + 1} 階段`;
  if (player.chapter === "少棒第一季小結") return "少棒第一季・球季評估";
  if (player.chapter === "位置競爭") return `位置競爭・第 ${player.competitionStep + 1} 階段`;
  if (player.chapter === "位置競爭小結") return "位置競爭・回響評估";
  if (player.chapter === "青少棒") return `青少棒・第 ${player.juniorStep + 1} 階段`;
  if (player.chapter === "青少棒開場小結") return "青少棒・十三歲評估";
  if (player.chapter === "青少棒分化") return `青少棒分化・第 ${player.juniorSeasonStep + 1} 階段`;
  if (player.chapter === "青少棒階段小結") return "青少棒・升學評估";
  if (player.chapter === "青棒") return `青棒第一年・第 ${player.highSchoolStep + 1} 階段`;
  if (player.chapter === "青棒第一年小結") return "青棒・第一年評估";
  if (player.chapter === "青棒關鍵年") return `青棒關鍵年・第 ${player.criticalYearStep + 1} 階段`;
  if (player.chapter === "青棒生涯出口") return "青棒・畢業出口評估";
  if (player.chapter === "生涯轉換期") return `十八歲轉換期・第 ${player.transitionStep + 1} 階段`;
  if (player.chapter === "生涯轉換期小結") return "十八歲・分流評估";
  if (player.chapter === "發展期") return `二十至二十二歲・第 ${player.developmentStep + 1} 階段`;
  if (player.chapter === "二十二歲職涯小結") return "二十二歲・市場評估";
  return `${player.chapter}・第 ${player.day} 天・${phaseLabels[player.phase] || "小結"}`;
}

function progressPercent() {
  if (player.completed || player.chapter === "少棒第一季小結") return 100;
  if (player.chapter === "位置競爭小結") return 100;
  if (player.chapter === "位置競爭") return 80 + Math.round((player.competitionStep / 6) * 19);
  if (player.chapter === "青少棒") return 82 + Math.round((player.juniorStep / 10) * 17);
  if (player.chapter === "青少棒開場小結") return 100;
  if (player.chapter === "青少棒分化") return 84 + Math.round((player.juniorSeasonStep / 10) * 15);
  if (player.chapter === "青少棒階段小結") return 100;
  if (player.chapter === "青棒") return 86 + Math.round((player.highSchoolStep / 8) * 13);
  if (player.chapter === "青棒第一年小結") return 100;
  if (player.chapter === "青棒關鍵年") return 88 + Math.round((player.criticalYearStep / 8) * 11);
  if (player.chapter === "青棒生涯出口") return 100;
  if (player.chapter === "生涯轉換期") return 92 + Math.round((player.transitionStep / 5) * 7);
  if (player.chapter === "生涯轉換期小結") return 100;
  if (player.chapter === "少棒第一季") return 56 + Math.round((player.seasonStep / 8) * 43);
  if (player.chapter === "少棒入門小結") return 55;
  if (player.chapter === "少棒入門") {
    return 46 + Math.round((player.chapter2Step / 6) * 9);
  }
  if (player.ending) return 45;
  const phaseOffset = player.phase === "afternoon" ? 1 : player.phase === "night" ? 2 : 0;
  return Math.min(44, Math.round((((player.day - 1) * 3 + phaseOffset) / 21) * 45));
}

function renderBar(value, label, max = 20) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const safeMax = Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : 20;
  const normalizedValue = Math.max(0, Math.min(safeMax, safeValue));
  const percent = Math.max(0, Math.min(100, Math.round((normalizedValue / safeMax) * 100)));
  return `<div class="stat-row"><div class="stat-label"><span>${label || "未命名能力"}</span><strong>${normalizedValue}</strong></div><div class="stat-bar"><div class="stat-fill" style="width:${percent}%"></div></div></div>`;
}

function calculatePositionRatings() {
  return Object.entries(positionConfigs).map(([position, config]) => {
    let skillPoints = 0;
    let skillWeights = 0;
    Object.entries(config.weights).forEach(([key, weight]) => {
      skillPoints += Math.min(20, player.baseballSkills[key] || 0) * weight;
      skillWeights += weight;
    });
    let personalityPoints = 0;
    let personalityWeights = 0;
    Object.entries(config.personality).forEach(([key, weight]) => {
      personalityPoints += Math.min(20, player[key] || 0) * weight;
      personalityWeights += weight;
    });
    const skillScore = skillWeights ? (skillPoints / (skillWeights * 20)) * 100 : 0;
    const affinityScore = (Math.min(20, player.positionAffinity[config.affinity] || 0) / 20) * 100;
    const personalityScore = personalityWeights ? (personalityPoints / (personalityWeights * 20)) * 100 : 0;
    const rating = skillScore * .68 + affinityScore * .20 + personalityScore * .12;
    return { position, rating: Math.max(0, Math.min(99, Math.round(rating))) };
  }).sort((a, b) => b.rating - a.rating);
}

function getPositionCareerValue() {
  const position = player.seasonPosition;
  const config = positionConfigs[position];
  const rating = calculatePositionRatings().find(item => item.position === position)?.rating || 0;
  if (!config || rating < 25) return 0;
  return config.scarcity + (rating >= 50 ? 1 : 0);
}

function calculateOffensiveRating() {
  const s = player.baseballSkills || {};
  const points = (s.batting || 0) * .65 + player.ballSense * .15 + player.discipline * .05 + player.confidence * .05 + (s.baseballIQ || 0) * .05 + player.instinct * .05;
  const commitmentFlags = ["season_declared_bat_path", "youth_bat_work", "bench_studied_pitching", "postgame_batting_work", "declared_bat_first_role", "junior_bat_compensation", "developed_high_school_bat", "critical_invest_offense", "development_bat_first"];
  const commitmentBonus = Math.min(10, commitmentFlags.filter(hasFlag).length * 2);
  return Math.max(0, Math.min(99, Math.round((points / 20) * 100) + commitmentBonus));
}

function getOffensiveCareerValue() {
  const rating = calculateOffensiveRating();
  if ((player.baseballSkills?.batting || 0) < 6) return 0;
  let value = rating >= 60 ? 3 : rating >= 45 ? 2 : rating >= 30 ? 1 : 0;
  if (value && (hasFlag("developed_high_school_bat") || hasFlag("critical_invest_offense") || hasFlag("development_bat_first"))) value += 1;
  return Math.min(4, value);
}

function getPositionAssessment(position) {
  const config = positionConfigs[position];
  if (!config) return null;
  const ranked = config.skills.map(key => ({ key, label: skillLabels[key], value: player.baseballSkills[key] || 0 })).sort((a, b) => b.value - a.value);
  const rating = calculatePositionRatings().find(item => item.position === position)?.rating || 0;
  return {
    rating,
    strengths: ranked.slice(0, 2).map(item => item.label).join("、"),
    gaps: ranked.slice(-2).map(item => item.label).join("、"),
    skills: config.skills,
    role: config.role,
    careerValue: getPositionCareerValue()
  };
}

function renderPositionPanel() {
  const ratings = calculatePositionRatings();
  const primary = player.seasonPosition || ratings[0].position;
  const assessment = getPositionAssessment(primary);
  return `<div class="position-card">
    <div class="position-heading"><span>主要守位</span><strong>${escapeHtml(primary)}</strong><b>${assessment.rating}</b></div>
    <p>第二守位：${escapeHtml(player.secondaryPosition || ratings[1].position)}</p>
    <p><em>目前優勢</em>${escapeHtml(assessment.strengths)}</p>
    <p><em>需要補強</em>${escapeHtml(assessment.gaps)}</p>
    <p><em>守位任務</em>${escapeHtml(assessment.role)}</p>
    <p><em>生涯加值</em>${assessment.careerValue > 0 ? `+${assessment.careerValue} 評估修正` : "尚未形成"}</p>
    <div class="position-rankings">${ratings.map(item => `<span>${item.position} ${item.rating}</span>`).join("")}</div>
  </div>`;
}

function getTraitSummary() {
  const traits = [];
  if (player.confidence >= 6) traits.push("敢於表現");
  if (player.observe >= 6) traits.push("善於觀察");
  if (player.resilience >= 5) traits.push("願意重來");
  if (player.instinct >= 6) traits.push("相信直覺");
  if (player.pressure >= 6) traits.push("容易緊張");
  if (player.responsibility >= 3) traits.push("重視責任");
  return traits.length ? traits.join("、") : "性格仍在形成";
}

const personalityLabels = {
  brave: "勇敢", thoughtful: "深思", stubborn: "固執", kind: "體貼",
  ambitious: "企圖心", reliable: "可靠", selfish: "自我優先", emotional: "情緒化"
};

function getPersonalitySummary() {
  const ranked = Object.entries(player.personality || {}).sort((a, b) => b[1] - a[1]);
  const strong = ranked.filter(([, value]) => value >= 3).slice(0, 3).map(([key]) => personalityLabels[key]);
  return strong.length ? strong.join("、") : "人格仍在他人的回應中形成";
}

function getNpcReflection(npc = "all") {
  const i = player.impression;
  if ((npc === "coach" || npc === "all") && i.coach.immature >= 5) return "你有能力，但太容易讓情緒替自己做決定。";
  if ((npc === "coach" || npc === "all") && i.coach.dependable >= 5 && i.coach.leader >= 3) return "你是能讓隊伍放心的人，只是別把所有事都扛在自己身上。";
  if (npc === "coach") return i.coach.competitive >= 3 ? "你很想贏，我還在看你能不能讓隊友也變好。" : "我還在從你的每一次選擇認識你。";
  if ((npc === "azhe" || npc === "all") && i.azhe.feelsDistance >= 5) return "你總把自己的競爭放在別人前面，我已經不太知道該怎麼找你。";
  if ((npc === "azhe" || npc === "all") && i.azhe.trusts >= 5) return "你是那種會留下來聽我說完的人。";
  if (npc === "azhe") return "我們一起打過球，但我還不確定你會不會把我放進你的人生裡。";
  if ((npc === "takahashi" || npc === "all") && i.takahashi.respect >= 5) return "你從來不會逃開真正的競爭。";
  if (npc === "takahashi") return i.takahashi.underestimate >= 3 ? "你一急就會露出破綻。" : "我還沒決定你是不是值得一直追的對手。";
  return "隊友與教練仍在從你的選擇認識你。";
}

function getNpcPerceptionSummary(npcId) {
  const i = player.impression || createInitialPlayer().impression;
  const p = player.personality || createInitialPlayer().personality;
  if (npcId === "azhe") {
    if (i.azhe.feelsDistance >= 5) return i.azhe.admires >= 3 ? "阿哲佩服你對競爭的投入，但已不太願意把弱點交給你。" : "阿哲和你仍是隊友，卻開始把真正擔心的事留給自己。";
    if (i.azhe.depends >= 5) return "阿哲遇到場上問題時會先看向你，也可能已經太習慣等你的答案。";
    if (i.azhe.trusts >= 5) return "阿哲把你當成可以坦白弱點的人，但仍希望自己的選擇由自己決定。";
    return "阿哲會和你完成場上任務，但還在確認你是否真的在意他的想法。";
  }
  if (npcId === "takahashi") {
    if (i.takahashi.underestimate >= 5) return "高橋認為你一旦被結果刺激就容易失去穩定，正等著你再次露出破綻。";
    if (i.takahashi.respect >= 5 && i.takahashi.rivalry >= 5) return "高橋認為你值得正面競爭，也開始擔心有一天自己會追不上你。";
    if (i.takahashi.respect >= 5) return "高橋已不再把你當成普通替補，但仍要確認你的表現能否重複。";
    return "高橋知道你在追趕，卻還沒有把每一次比較都當成真正勝負。";
  }
  if (npcId === "coach") {
    if (i.coach.immature >= 5) return "山本教練看得見你的能力，也擔心情緒會讓隊友無法預測你的下一步。";
    if (i.coach.dependable >= 5 && i.coach.leader >= 3) return "山本教練開始把沒有標準答案的任務交給你，但也擔心你替所有人承擔。";
    if (i.coach.competitive >= 5) return "山本教練知道你很想贏，仍在觀察你能否看見勝負以外的人。";
    if (p.thoughtful >= 5) return "山本教練知道你會先理解再行動，有時也懷疑你的沉默是不是沒有意見。";
    return "山本教練仍以具體任務觀察你，尚未把重要工作完全交出來。";
  }
  return "對方仍在從你的選擇理解你。";
}

function generateCoachRecommendation() {
  const i = player.impression.coach;
  const p = player.personality;
  const lines = [];
  if (i.dependable >= 5 && i.leader >= 3) lines.push("他不是最快成熟的孩子，但交出去的工作通常會完成。需要注意的是，他有時會把領導誤解成替所有人做完。");
  else if (i.dependable >= 5) lines.push("他在被指出錯誤時不一定立刻回答，不過第二天通常已經修正。可以把需要持續完成的工作交給他。");
  else if (i.competitive >= 5) lines.push("他很想贏，競爭會讓他進步得更快；同一股力量也可能使他暫時看不見身邊的人。");
  else if (i.immature >= 5) lines.push("他的能力已足以參與競爭，但失誤後的反應仍會影響下一球和身邊隊友。");
  else if (p.thoughtful >= 5) lines.push("他理解動作的速度比表現自己更快。若給他清楚問題，他通常能找到可執行的修正。");
  else lines.push("他還沒有定型，但願意在球場上尋找自己能完成的任務。");
  if (hasFlag("reported_first_pain")) lines.push("他曾在重要測試前主動回報疼痛，知道長期生涯有時需要放棄眼前一次機會。");
  else if (hasFlag("hid_first_pain")) lines.push("他曾隱瞞疼痛完成測試，企圖心很強，也需要更明確的健康界線。");
  if (player.characterArc.azhe === "respected_equal") lines.push("他能照顧隊友，同時允許對方替自己作決定。");
  else if (player.characterArc.azhe === "dependent") lines.push("隊友信任他，但他還需要學習幫助不等於替別人決定。");
  if ((player.lifeThemes?.competition || 0) >= 4 && lines.length < 3) lines.push("競爭是他最熟悉的語言；下一個環境需要確認，他能否在沒有明確對手時仍維持方向。");
  else if ((player.lifeThemes?.trust || 0) >= 3 && lines.length < 3) lines.push("他做過的選擇顯示，隊友的弱點交到他手上時通常不會被拿來交換位置。");
  return lines.slice(0, 3).join("\n");
}

function getAzheBondState() {
  const value = Number(player.relationships?.teammateBond) || 0;
  if (value >= 7) return { label: "深厚羈絆", detail: "阿哲願意向你坦白不安，場上也會主動補位與提醒。" };
  if (value <= 2) return { label: "關係疏遠", detail: "溝通不足已可能影響場上補位，後續事件會出現修復或決裂選擇。" };
  return { label: "普通隊友", detail: "你們能一起完成任務，但尚未真正走進彼此的生活。" };
}

function renderTrackedGoal(slot, label) {
  const goal = player.goalState?.[slot];
  if (!goal) return `<div class="goal-line"><small>${label}</small><span>尚未設定</span></div>`;
  return `<div class="goal-line"><small>${label}・${goal.tier}</small><span>${escapeHtml(goal.title)}</span><b>${escapeHtml(getGoalProgressText(goal))}</b></div>`;
}

function getBalanceDebugSummary() {
  const goal = player.goalState?.current;
  const competition = getStartingCompetitionBreakdown();
  const position = getPositionAssessment(player.seasonPosition || competition.position);
  return {
    goalId: goal?.id || "none",
    goalProgress: goal ? getGoalProgressText(goal) : "none",
    goalTier: goal?.tier || "none",
    estimatedResult: player.startingCompetition?.result || (competition.playerRating - competition.rivalRating >= 4 ? "先發候選" : competition.playerRating - competition.rivalRating >= -3 ? "並列競爭" : competition.playerRating - competition.rivalRating >= -10 ? "第一替補" : "後段替補"),
    competition,
    positionRating: position?.rating || 0,
    positionStrengths: position?.strengths || "尚未形成",
    chapterSkillPoints: player.balanceDebug?.chapterSkillPoints || 0,
    load: { pressure: player.pressure, fatigue: player.body.fatigue, injuryRisk: player.body.injuryRisk, pain: player.body.pain, burnout: player.burnout }
  };
}

function auditSkillGrowthSources() {
  const collections = [chapterOneEvents, chapterTwoEvents, youthSeasonEvents, positionCompetitionEvents, juniorBaseballEvents, juniorSeasonEvents, highSchoolEvents, criticalYearEvents, careerTransitionEvents, pacingEvents, developmentEvents];
  const chapters = ["童年", "少棒入門", "少棒第一季", "位置競爭", "青少棒", "青少棒分化", "青棒", "青棒關鍵年", "生涯轉換", "呼吸事件", "發展期"];
  const report = {};
  Object.keys(skillLabels).forEach(key => report[key] = { events: 0, totalPoints: 0, firstChapter: "", lastChapter: "", positions: [] });
  collections.forEach((collection, index) => Object.entries(collection).forEach(([eventId, event]) => {
    const seen = new Set();
    (event.choices || []).forEach(choice => {
      const direct = choice.skillEffects || {};
      Object.entries(direct).forEach(([key, value]) => {
        if (!report[key] || value <= 0) return;
        report[key].totalPoints += value;
        seen.add(key);
      });
      Object.entries(choice.positionSkillEffects || {}).forEach(([position, effects]) => Object.entries(effects || {}).forEach(([key, value]) => {
        if (!report[key] || value <= 0) return;
        report[key].totalPoints += value;
        seen.add(key);
        if (position !== "default" && !report[key].positions.includes(position)) report[key].positions.push(position);
      }));
    });
    seen.forEach(key => {
      report[key].events += 1;
      report[key].firstChapter ||= chapters[index];
      report[key].lastChapter = chapters[index];
    });
  }));
  return report;
}

function updateStatus() {
  clampStats();
  updateImpression();
  updateGoals(player.forcedEventId || getCurrentEventId());
  refreshStartingCompetition();
  document.getElementById("time").innerHTML = `<h2>${escapeHtml(player.chapter)}</h2><p>${escapeHtml(getTimeLabel())}</p><div class="progress-track"><div class="progress-fill" style="width:${progressPercent()}%"></div></div>`;
  const showSkills = Boolean(player.chapter2Result) || player.completed;
  const showSeason = player.chapter.includes("第一季") || player.seasonResult;
  const showBody = player.chapter.includes("青少棒") || player.juniorResult;
  const pendingHtml = player.pendingEvents?.length ? `<div class="pending-card"><strong>即將發生</strong>${player.pendingEvents.map(item => `<div class="pending-item"><span>${escapeHtml(item.title)}</span><b>${item.remainingActions} 次行動</b></div>`).join("")}</div>` : "";
  const competition = player.startingCompetition;
  const azheBond = getAzheBondState();
  const offensiveRating = calculateOffensiveRating();
  const offensiveValue = getOffensiveCareerValue();
  const showCareerArc = player.chapter.includes("青棒關鍵年") || player.chapter.includes("生涯轉換") || player.chapter === "發展期" || player.chapter === "二十二歲職涯小結";
  if (showCareerArc) evaluateMarket();
  const careerTrendLabels = { rising: "上升", stable: "持平", declining: "下降", rebound: "回升" };
  const competitionHtml = competition?.active ? `<div class="competition-card"><strong>${escapeHtml(competition.position || player.seasonPosition)}先發競爭</strong><div class="competition-row"><span>${escapeHtml(competition.rivalName || getRivalDisplayName())}</span><b>教練評價 ${competition.rivalRating}</b></div><div class="competition-row you"><span>你</span><b>教練評價 ${competition.playerRating}</b></div><p class="competition-gap">${competition.result ? `${escapeHtml(competition.result)}：${escapeHtml(competition.detail)}` : `目前差距 ${Math.abs(competition.rivalRating - competition.playerRating)} 點，測試尚未公布。`}</p></div>` : "";
  const debugMode = Boolean(document.querySelector?.(".debug-bookmarks")?.open);
  const debug = debugMode ? getBalanceDebugSummary() : null;
  const debugHtml = debug ? `<div class="balance-debug"><strong>平衡測試</strong><small>目標 ${escapeHtml(debug.goalId)}｜${escapeHtml(debug.goalTier)}｜${escapeHtml(debug.goalProgress)}</small><small>預估 ${escapeHtml(debug.estimatedResult)}</small><small>競爭：技能 ${Math.round(debug.competition.skillScore)}／信任 ${Math.round(debug.competition.trustScore)}／表現 ${Math.round(debug.competition.performanceScore)}／準備 ${debug.competition.preparationScore}／角色 ${debug.competition.roleScore}</small><small>守位評分 ${debug.positionRating}｜本章技能 +${debug.chapterSkillPoints}</small><small>負荷：壓力 ${debug.load.pressure}／疲勞 ${debug.load.fatigue}／傷病 ${debug.load.injuryRisk}／倦怠 ${debug.load.burnout}</small></div>` : "";
  document.getElementById("status").innerHTML = `
    <div class="goal-card"><strong>目前目標</strong>${player.goalState?.current ? `${renderTrackedGoal("current", "當下")}${renderTrackedGoal("short", "短期")}${renderTrackedGoal("chapter", "階段")}` : `<div class="goal-line"><small>當下</small><span>${escapeHtml(player.currentGoal)}</span></div><div class="goal-line"><small>短期</small><span>${escapeHtml(player.shortGoal)}</span></div><div class="goal-line"><small>階段</small><span>${escapeHtml(player.longGoal)}</span></div>`}</div>
    ${debugHtml}${pendingHtml}${competitionHtml}
    <h2>能力傾向</h2>${renderBar(player.ballSense, "球感")}${renderBar(player.observe, "觀察")}${renderBar(player.fitness, "體能")}
    <h2>人格</h2>${renderBar(player.confidence, "自信")}${renderBar(player.resilience, "韌性")}${renderBar(player.instinct, "野性")}${renderBar(player.discipline, "紀律")}${renderBar(player.responsibility, "責任感")}${renderBar(player.pressure, "壓力", 12)}
    <h2>關係</h2>${renderBar(player.familySupport, "家庭支持")}${renderBar(player.coachAttention, "教練注意")}
    ${showSkills ? `<h2>守位與能力連結</h2>${renderPositionPanel()}<h2>棒球技能</h2>${Array.from(new Set(["catching", "throwing", "batting", "baseRunning", "baseballIQ", ...(getPositionAssessment(player.seasonPosition || calculatePositionRatings()[0].position)?.skills || [])])).map(key => renderBar(player.baseballSkills[key], skillLabels[key])).join("")}` : ""}
    ${showSkills ? `<div class="offense-card"><strong>進攻評價 ${offensiveRating}</strong><p>${offensiveValue ? `目前可提供 +${offensiveValue} 生涯評估修正；具備靠打擊換取名單機會的可能。` : "打擊仍是輔助能力，尚未形成足以改變名單的工具。"}</p></div>` : ""}
    ${showSeason ? `<h2>隊內關係</h2>${renderBar(player.relationships.coachTrust, "教練信任")}${renderBar(player.relationships.teammateBond, "阿哲羈絆")}${renderBar(player.relationships.rivalRespect, "宿敵敬意")}${renderBar(player.relationships.rivalCompetition, "競爭張力")}<div class="bond-card"><strong>阿哲：${escapeHtml(azheBond.label)}</strong><p>${escapeHtml(azheBond.detail)}</p></div>` : ""}
    ${showBody ? `<h2>身體狀態</h2>${renderBar(player.body.stamina, "體力")}${renderBar(player.body.fatigue, "疲勞")}${renderBar(player.body.recovery, "恢復力")}${renderBar(player.body.injuryRisk, "傷病風險")}${renderBar(player.body.pain, "疼痛")}` : ""}
    ${player.chapter.includes("青少棒") || player.juniorSeasonResult ? `<h2>生活平衡</h2>${renderBar(player.academics, "課業")}${renderBar(player.motivation, "棒球動機")}${renderBar(player.burnout, "倦怠")}` : ""}
    ${player.chapter.includes("青棒") || player.careerExit ? `<h2>生涯資產</h2>${renderBar(player.exposure, "曝光")}${renderBar(player.scoutEvaluation, "球探評價")}${renderBar(player.recentPerformance, "近期表現")}${renderBar(player.reputation, "名聲／可信度")}` : ""}
    ${showCareerArc ? `<div class="career-arc-card"><strong>生涯軌跡：${escapeHtml(player.roleIdentity.primary || "尚未定型")}</strong><p>價值 ${player.careerValue.current}／最高 ${player.careerValue.peak}　${careerTrendLabels[player.careerValue.trend] || "持平"}</p><p>階段：${escapeHtml(player.careerArc.stage)}　轉型 ${player.careerArc.reinventions} 次</p></div><h2>市場重估</h2>${renderBar(player.marketEvaluation.offense, "進攻", 100)}${renderBar(player.marketEvaluation.defense, "守備", 100)}${renderBar(player.marketEvaluation.utility, "工具性", 100)}${renderBar(player.marketEvaluation.leadership, "領導", 100)}${renderBar(player.marketEvaluation.health, "健康", 100)}` : ""}
    ${player.chapter.includes("生涯轉換") || player.transitionResult ? `<h2>轉換期</h2>${renderBar(player.finances, "經濟穩定")}` : ""}
    <h2>目前輪廓</h2><p>${escapeHtml(getTraitSummary())}</p>
    ${showSeason ? `<div class="reflection-card"><strong>人物反應</strong><p>${escapeHtml(getNpcPerceptionSummary("azhe"))}</p><p>${escapeHtml(getNpcPerceptionSummary("takahashi"))}</p><p>${escapeHtml(getNpcPerceptionSummary("coach"))}</p></div>` : ""}
    <h2>路線傾向</h2><p>${escapeHtml(player.route)}</p>
    ${player.chapter2Result ? `<div class="result-badge"><small>少棒入門評估</small><strong>${escapeHtml(player.chapter2Result)}</strong></div>` : ""}`;
  document.getElementById("player-info").innerHTML = `<strong>${escapeHtml(player.name || "尚未建立角色")}</strong><span>${player.age} 歲</span><span>${escapeHtml(player.chapter)}</span><span>${escapeHtml(player.route)}</span>`;
}

updateStatus();
