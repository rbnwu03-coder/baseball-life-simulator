let isTransitioning = false;
let pendingYouthSeasonOutcome = null;
let pendingBaseballGameplay = null;
let selectedOrigin = PlayerIdentityOptions.origins[0];
let selectedIdealSelf = "";

const youthSeasonOutcomeEventIds = new Set([
  "youth_season_intro",
  "youth_position_trial",
  "youth_teammate",
  "youth_bench",
  "youth_match_entry",
  "youth_match_grounder",
  "youth_match_outfield",
  "youth_match_catcher",
  "youth_match_pitcher",
  "youth_match_mistake",
  "youth_match_after"
]);

const idealSelfDescriptions = Object.freeze({
  [PlayerIdentityOptions.idealSelf[0]]: "我想成為任何情況都值得信賴的人。",
  [PlayerIdentityOptions.idealSelf[1]]: "我想把一件事反覆磨到最好。",
  [PlayerIdentityOptions.idealSelf[2]]: "我想相信自己的感覺與判斷。",
  [PlayerIdentityOptions.idealSelf[3]]: "我想在最重要的時候站出來。",
  [PlayerIdentityOptions.idealSelf[4]]: "我想讓身邊的人一起變得更好。"
});

const youthGrounderThrowChoices = Object.freeze([
  Object.freeze({
    code: "secure-first",
    text: "接穩後轉向一壘，先抓打者",
    flag: "youth_grounder_throw_first",
    skillEffects: Object.freeze({ throwing: 1 })
  }),
  Object.freeze({
    code: "force-lead-runner",
    text: "反手送二壘，先封殺前位跑者",
    flag: "youth_grounder_throw_force_second",
    skillEffects: Object.freeze({ throwing: 1 })
  }),
  Object.freeze({
    code: "turn-two",
    text: "餵給二壘後補位，挑戰雙殺",
    flag: "youth_grounder_turn_two",
    skillEffects: Object.freeze({ baseballIQ: 1 })
  })
]);

// Phase 14.5：核心 NPC 在不同人生階段的身分與職能。
// 這份資料只約束敘事權限，不參與能力、平衡或流程判定。
const npcRolePrinciples = {
  yamamoto: "山本代表你的過去，提醒你從哪裡開始。",
  takahashi: "高橋代表你的現在，告訴你這個層級真正需要什麼。",
  azhe: "阿哲代表你的未來，提醒你人生永遠不只有一條路。"
};

const npcRoleMap = {
  yamamoto: {
    youth: { identity: "少棒正式教練", distance: "球隊內的直接權威", resource: "守位安排、基本功訓練、比賽決策與球員評估", limitation: "權限只及於自己執教的少棒隊", narrativeFunction: "建立玩家的棒球原點" },
    junior: { identity: "少棒恩師", distance: "偶爾聯絡、回母隊或看比賽時碰面", resource: "回答問題、回顧基本功與提供過往觀察", limitation: "不能決定國中隊名單、守位或戰術", narrativeFunction: "讓玩家用原點理解新的分化" },
    highSchool: { identity: "長期導師", distance: "高中球隊體系之外的前教練", resource: "整理定位、提醒盲點與有條件推薦", limitation: "不能改變高中教練決策或替玩家取得先發", narrativeFunction: "替尚未成形的可能命名" },
    transition: { identity: "長期導師", distance: "離開現役組織但仍可聯絡", resource: "舊觀察、有限介紹與角色命名", limitation: "不能替新組織承諾名單或測試結果", narrativeFunction: "把過往經驗翻譯成新環境聽得懂的用途" },
    adult: { identity: "人生導師", distance: "象徵原點的長期關係", resource: "回顧成長、重新理解角色與有限介紹", limitation: "不能指揮成年球隊、決定工作或職涯", narrativeFunction: "提醒玩家從哪裡開始，也看見已經改變多少" }
  },
  takahashi: {
    youth: { identity: "同梯競爭者", distance: "同一球場的直接比較", resource: "可觀察的技術高度與正面挑戰", limitation: "不能決定玩家是否成功", narrativeFunction: "讓差距第一次變得具體" },
    junior: { identity: "同齡比較標準", distance: "可能同隊，也可能在不同組別", resource: "更高層級的標準與技術比較", limitation: "不負責教學或安慰玩家", narrativeFunction: "指出目前層級真正要求什麼" },
    highSchool: { identity: "走向不同方向的比較對象", distance: "不再必然同隊或爭同一位置", resource: "比賽結果、技術情報與下一個標準", limitation: "不再是人生唯一對手", narrativeFunction: "讓玩家看見不同環境下的高度" },
    transition: { identity: "同世代棒球同行者", distance: "可能在不同學校、組織或聯盟", resource: "測試情報、比較報告與具體挑戰", limitation: "不能降低標準或保證入口", narrativeFunction: "把玩家的工具放進更高層級比較" },
    adult: { identity: "更高層級資訊來源", distance: "可能成為球員、球探、教練或分析員", resource: "市場標準、對手資料與有限介紹", limitation: "不負責幫助玩家成功", narrativeFunction: "指出下一個可比較的高度" }
  },
  azhe: {
    youth: { identity: "最好的朋友", distance: "每天一起練習", resource: "共同經驗、坦白弱點與場上默契", limitation: "不能替玩家承擔競爭結果", narrativeFunction: "讓棒球首先是一段共享生活" },
    junior: { identity: "一起追夢的夥伴", distance: "仍同行但開始有各自問題", resource: "彼此見證、合作與不同選擇", limitation: "不是等待玩家照顧的對象", narrativeFunction: "讓同一夢想出現不同走法" },
    highSchool: { identity: "開始分流的舊友", distance: "可能不同隊、不同學校或退出正式球隊", resource: "球場外視角與熟悉玩家原貌的人", limitation: "不能一直在場邊陪伴或安慰", narrativeFunction: "證明離開同一路線仍能繼續生活" },
    transition: { identity: "走向另一種棒球人生的朋友", distance: "各自生活，關係決定是否仍聯絡", resource: "課業、工作、地方棒球與生活並行的視角", limitation: "不能替玩家決定下一站", narrativeFunction: "交換彼此最近正在追什麼" },
    adult: { identity: "另一種人生的見證者", distance: "可能從事一般工作、社會人或地方棒球並建立家庭", resource: "可持續生活的實例與平等觀點", limitation: "不負責安慰或拯救玩家", narrativeFunction: "提醒人生與棒球都不只有一種成功方式" }
  }
};

function getNpcLifeStage(chapter = player.chapter) {
  if (/青少棒/.test(chapter || "")) return "junior";
  if (/十歲|少棒|位置競爭/.test(chapter || "")) return "youth";
  if (/青棒|高中/.test(chapter || "")) return "highSchool";
  if (/生涯轉換/.test(chapter || "")) return "transition";
  return "adult";
}

function getNpcRole(npc, chapter = player.chapter) {
  return npcRoleMap[npc]?.[getNpcLifeStage(chapter)] || null;
}

function getNpcDisplayName(npc, chapter = player.chapter) {
  const stage = getNpcLifeStage(chapter);
  if (npc === "yamamoto") return stage === "youth" ? "山本教練" : stage === "junior" ? "少棒恩師山本" : "山本導師";
  return npc === "takahashi" ? "高橋" : npc === "azhe" ? "阿哲" : npc;
}

function auditNpcRoleConflicts() {
  const requiredFields = ["identity", "distance", "resource", "limitation", "narrativeFunction"];
  const stages = ["youth", "junior", "highSchool", "transition", "adult"];
  const roleMapIssues = [];
  Object.entries(npcRoleMap).forEach(([npc, map]) => stages.forEach(stage => {
    const missing = requiredFields.filter(field => !map[stage]?.[field]);
    if (missing.length) roleMapIssues.push({ npc, stage, missing });
  }));

  const eventChecks = [
    { eventId: "starter_selection_test", stage: "youth", authority: "yamamoto", expected: "少棒正式教練可決定少棒名單", conflict: false },
    { eventId: "junior_coach_disagreement", stage: "junior", authority: "current_junior_coach", expected: "國中隊現任教練決定名單；山本僅回應問題", conflict: false },
    { eventId: "yamamoto_recommendation", stage: "junior", authority: "yamamoto", expected: "少棒恩師提供有限推薦，不決定高中安排", conflict: false },
    { eventId: "high_school_role", stage: "highSchool", authority: "current_high_school_coach", expected: "高中現任教練安排角色", conflict: false },
    { eventId: "development_mentor", stage: "adult", authority: "yamamoto", expected: "人生導師命名角色並提供有限介紹，不指揮現任組織", conflict: false }
  ];
  return {
    principles: { ...npcRolePrinciples },
    matrix: Object.fromEntries(Object.entries(npcRoleMap).map(([npc, map]) => [npc, Object.fromEntries(stages.map(stage => [stage, map[stage].identity]))])),
    roleMapIssues,
    eventChecks,
    conflicts: eventChecks.filter(item => item.conflict)
  };
}

const goalByChapter = {
  "十歲暑假": ["完成今天的選擇", "確認自己想用什麼方式靠近棒球", "找到能留在棒球裡的位置"],
  "少棒入門": ["完成眼前的基本動作", "通過少棒入門評估", "成為球隊願意培養的新生"],
  "少棒第一季": ["完成教練交代的場上任務", "爭取下一次上場機會", "建立自己的主要守備位置"],
  "位置競爭": ["準備下一次守位測試", "進入先發候選名單", "成為球隊正式主力"],
  "青少棒": ["適應身體與技術差距", "守住球隊中的用途", "找到能延續到高中的位置"],
  "青少棒分化": ["處理主力、課業與身體負荷", "取得合適的高中入口", "把棒球延續到下一階段"],
  "青棒": ["完成目前的球隊任務", "爭取穩定出賽與曝光", "建立升學或選秀價值"],
  "青棒第二年": ["完成重新排定的球隊任務", "讓角色通過春季與秋季驗證", "帶著可延續的角色進入高三"],
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

function selectIdealSelf(type) {
  selectedIdealSelf = idealSelfDescriptions[type] ? type : "";
  document.querySelectorAll?.(".ideal-self-button").forEach(button => {
    const isSelected = button.dataset.idealSelf === selectedIdealSelf;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  const description = document.getElementById("idealSelfDescription");
  if (description) {
    description.textContent = selectedIdealSelf
      ? idealSelfDescriptions[selectedIdealSelf]
      : "尚未選擇理想球員形象。";
  }

  if (selectedIdealSelf) {
    const feedback = document.getElementById("characterCreationFeedback");
    if (feedback) feedback.textContent = "";
  }
}

function setChoiceTransitionState(locked) {
  const choices = document.getElementById("choices");
  if (!choices) return;

  if (locked) choices.classList?.add?.("is-transitioning");
  else choices.classList?.remove?.("is-transitioning");

  choices.querySelectorAll?.("button").forEach(button => {
    button.disabled = Boolean(locked);
    if (locked) button.setAttribute?.("aria-disabled", "true");
    else button.removeAttribute?.("aria-disabled");
  });
}

function focusRenderedElement(selector) {
  const target = document.querySelector?.(selector);
  if (!target || typeof target.focus !== "function") return false;
  try {
    target.focus({ preventScroll: true });
  }
  catch (_) {
    target.focus();
  }
  return true;
}

function focusCurrentEventHeading() {
  return focusRenderedElement("#currentEventTitle");
}

function focusOutcomeHeading() {
  return focusRenderedElement("#outcomeTitle");
}

function setOutcomeContinueState(locked) {
  const button = document.querySelector?.("#choices .outcome-continue-button");
  if (!button) return;
  button.disabled = Boolean(locked);
  if (locked) button.setAttribute?.("aria-disabled", "true");
  else button.removeAttribute?.("aria-disabled");
}

function syncGameUiVisibility() {
  const hasCreatedPlayer = Boolean(player?.name);
  document.body?.classList?.toggle?.("creation-mode", !hasCreatedPlayer);
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
    highSchoolYearTwo() {
      Object.assign(player, {
        chapter: "青棒第二年", age: 17, highSchoolYearTwoStep: 0,
        juniorSeasonResult: "用短期機會換取較長的生涯", highSchoolRoute: "普通高中・穩定出賽",
        highSchoolTeamRole: "多位置工具人與後段輪替", highSchoolResult: "球探開始建立你的追蹤資料",
        highSchoolYearTwoResult: "", highSchoolYearTwoDetail: "",
        exposure: 4, scoutEvaluation: 5, recentPerformance: 1, reputation: 2
      });
      addFlags(["managed_high_school_load", "accepted_high_school_utility_role", "showcase_baseball_iq", "high_school_commit_utility"]);
      Object.assign(player.body, { fatigue: 2, injuryRisk: 2, pain: 0 });
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
  clearOutcomeFeedbackPresentation();
  showCurrentEvent();
  showNotice("已載入暫時測試書籤；正式存檔沒有被修改。", "warning");
}

function createPlayer() {
  const nameInput = document.getElementById("nameInput");
  const feedback = document.getElementById("characterCreationFeedback");
  const name = nameInput.value.trim();

  if (!name) {
    if (feedback) feedback.textContent = "請先輸入名字。";
    nameInput.focus?.();
    return;
  }

  if (!selectedIdealSelf) {
    if (feedback) feedback.textContent = "請先選擇你最憧憬的球員形象。";
    document.querySelector?.(".ideal-self-button")?.focus();
    return;
  }

  const identityInput = {
    name,
    origin: selectedOrigin,
    idealSelf: selectedIdealSelf
  };
  const identityValidation = PlayerDataBoundary.validateIdentityInput(identityInput);
  if (!identityValidation.ok) {
    if (feedback) feedback.textContent = identityValidation.error;
    return;
  }

  if (feedback) feedback.textContent = "";
  player = PlayerDataBoundary.createInitialSnapshot();
  player.replayMemories = loadReplayMemories();
  const identityResult = PlayerDataBoundary.initializeIdentity(identityInput);
  if (!identityResult.ok) {
    if (feedback) feedback.textContent = identityResult.error;
    return;
  }
  const origins = {
    [PlayerIdentityOptions.origins[0]]: { effects: { confidence: 1, pressure: 1 }, personality: { brave: 1, ambitious: 1 }, flag: "origin_wants_to_be_seen", memory: "在真正碰到棒球以前，你先承認自己希望有一天能被看見。" },
    [PlayerIdentityOptions.origins[1]]: { effects: { observe: 2 }, personality: { thoughtful: 2 }, flag: "origin_wants_to_understand", memory: "你最初靠近棒球，是因為想知道每個動作背後的原因。" },
    [PlayerIdentityOptions.origins[2]]: { effects: { familySupport: 1, resilience: 1 }, personality: { kind: 1, reliable: 1 }, flag: "origin_wants_to_belong", memory: "你希望棒球能讓自己成為某個團體的一員。" }
  };
  const origin = origins[selectedOrigin];
  applyEffects(origin.effects);
  addPersonalityEffects(origin.personality);
  addFlags([origin.flag]);
  updateImpression();
  player.memories.push(origin.memory);
  document.getElementById("characterCreation").style.display = "none";
  clearOutcomeFeedbackPresentation();
  selectedOrigin = PlayerIdentityOptions.origins[0];
  document.querySelectorAll?.(".origin-card").forEach(card => card.classList.toggle("selected", card.dataset.origin === PlayerIdentityOptions.origins[0]));
  selectIdealSelf("");
  showCurrentEvent();
}

function resetGame() {
  clearPendingBaseballGameplay();
  player = createInitialPlayer();
  document.getElementById("characterCreation").style.display = "block";
  document.getElementById("nameInput").value = "";
  document.getElementById("story").innerHTML = "";
  document.getElementById("choices").innerHTML = "";
  clearOutcomeFeedbackPresentation();
  const feedback = document.getElementById("characterCreationFeedback");
  if (feedback) feedback.textContent = "";
  selectIdealSelf("");
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
  },
  "青棒第二年": {
    current: { id: "high_school_year_two_reset", title: "完成重新排定的球隊任務", tier: "small", target: 1 },
    short: { id: "high_school_year_two_proof", title: "讓角色通過春季與秋季驗證", tier: "medium", target: 2 },
    chapter: { id: "high_school_year_two_plan", title: "確認高三前的投資方向", tier: "major", target: 1 }
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
  const label = status === "success" ? "成功" : status === "partial" ? "部分成功" : status === "failed" ? "尚未形成" : "目標更新";
  pushGoalProgress(goal, message || `${label}：${goal.title}`, status === "success" ? "success" : status === "partial" ? "partial" : status === "failed" ? "failed" : "progress");
  return true;
}

function hasCompletedGoal(id) { return Boolean(player.goalState?.completedGoals?.includes(id)); }

function getGoalProgressText(goal) {
  if (!goal) return "尚未設定";
  const labels = { active: `${goal.current}／${goal.target}`, completed: "完全成功", success: "成功", partial: "部分成功", failed: "尚未形成", expired: "已結束" };
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

function shouldQueueAzheAdultRecordEcho(eventId = "") {
  if (player.forcedEventId || eventId === "azhe_adult_record_echo" || hasFlag("azhe_adult_record_echo_done")) return false;
  if (!["transition_relationship", "development_mentor"].includes(eventId)) return false;
  const relationshipSource = player.characterArc.azhe === "respected_equal" || hasFlag("azhe_record_sheet") || hasFlag("respected_azhe_exit");
  const reinventionSource = player.chapter === "發展期" && ["declining", "transition", "reinvented"].includes(player.careerArc?.stage);
  const rehabSource = String(player.careerExit || "").includes("復健") || hasFlag("rehab_helped_youth") || hasFlag("development_adjusted_role");
  const identityDoubt = player.chapter === "發展期" && !player.roleIdentity?.primary;
  return relationshipSource || reinventionSource || rehabSource || identityDoubt;
}

function queueAzheAdultRecordEcho(eventId = "") {
  if (!shouldQueueAzheAdultRecordEcho(eventId)) return false;
  player.forcedEventId = "azhe_adult_record_echo";
  return true;
}

function shouldQueueTakahashiAdultRestartEcho(eventId = "") {
  if (player.forcedEventId || eventId === "takahashi_adult_restart_echo" || hasFlag("takahashi_adult_restart_echo_done")) return false;
  if (eventId !== "development_competition") return false;
  return hasFlag("takahashi_break_seen");
}

function queueTakahashiAdultRestartEcho(eventId = "") {
  if (!shouldQueueTakahashiAdultRestartEcho(eventId)) return false;
  player.forcedEventId = "takahashi_adult_restart_echo";
  return true;
}

function processTakahashiStoryboardFlow(eventId = "") {
  const flow = {
    junior_takahashi_failure: { advanceMain: true, next: "junior_takahashi_pressure" },
    junior_takahashi_pressure: { advanceMain: false, next: "junior_takahashi_break" },
    junior_takahashi_break: { advanceMain: false, next: "" }
  }[eventId];
  if (!flow) return false;
  if (flow.advanceMain) {
    advanceAfterAction();
    tickPendingEvents(eventId);
  }
  player.forcedEventId = flow.next;
  window.setTimeout(() => {
    isTransitioning = false;
    showCurrentEvent();
  }, 420);
  return true;
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
  if (player.chapter === "青棒第二年") {
    if (["high_school_year_two_roster_reset", "high_school_year_two_role_test"].includes(eventId)) completeGoal("high_school_year_two_reset", "小目標完成：你完成重新排定的球隊任務");
    if (["high_school_year_two_spring_game", "high_school_year_two_autumn_stage"].includes(eventId)) advanceGoal("high_school_year_two_proof", 1, "角色驗證推進：這次正式局面留下了可檢查的結果");
    if (eventId === "high_school_year_two_senior_plan") completeGoal("high_school_year_two_plan", "階段目標完成：高三前的投資方向已確認");
  }
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

function applyAzheCoverSignalOutcome(originalArc = "neutral") {
  if (["respected_equal", "confided"].includes(originalArc)) {
    addImpressionEffects({ azhe: { trusts: 2 } });
    applyCharacterArcEffects({ azhe: "respected_equal" });
    return;
  }
  if (originalArc === "dependent") {
    addImpressionEffects({ azhe: { trusts: 1, depends: -1 } });
    applyCharacterArcEffects({ azhe: "dependent" });
    return;
  }
  if (originalArc === "distant") {
    addImpressionEffects({ azhe: { feelsDistance: -1 } });
    applyCharacterArcEffects({ azhe: "distant" });
    return;
  }
  addImpressionEffects({ azhe: { trusts: 1 } });
  applyCharacterArcEffects({ azhe: "confided" });
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

function setOutcomeFeedbackPresentation(active) {
  const node = document.getElementById("changeLog");
  if (!node) return;
  node.classList?.toggle?.("outcome__feedback", Boolean(active));
  if (active) node.setAttribute?.("aria-label", "上一個選擇的系統回饋");
  else node.removeAttribute?.("aria-label");
}

function clearOutcomeFeedbackPresentation() {
  const node = document.getElementById("changeLog");
  if (!node) return;
  node.innerHTML = "";
  setOutcomeFeedbackPresentation(false);
}

function showStatChanges(before, after, memory = "", options = {}) {
  const changes = [];
  Object.entries({ ...statLabels, ...skillLabels }).forEach(([key, label]) => {
    if (after[key] !== before[key]) changes.push(formatChange(label, after[key] - before[key]));
  });
  const goalFeedback = consumeGoalFeedback();
  const goalHtml = goalFeedback.map(item => `<div class="${item.type === "complete" ? "goal-complete" : item.type === "success" ? "goal-success" : item.type === "partial" ? "goal-partial" : item.type === "failed" ? "goal-failed" : "goal-progress-change"}">${escapeHtml(item.message)}</div>`).join("");
  const payoffHtml = consumeRelationshipPayoffFeedback().map(message => `<div class="relationship-payoff-notice">${escapeHtml(message)}</div>`).join("");
  const feedbackHtml = `
    ${memory && options.includeMemory !== false ? `<div class="memory-line">${escapeHtml(memory)}</div>` : ""}
    <div>${changes.length ? changes.join("") : "<span class='neutral-change'>這個選擇留下了記憶，而不是數值。</span>"}</div>${goalHtml}${payoffHtml}`;
  document.getElementById("changeLog").innerHTML = `
    <div class="outcome-feedback__label">上一個選擇的系統回饋</div>
    <div class="outcome-feedback__content">${feedbackHtml}</div>`;
  setOutcomeFeedbackPresentation(true);
  return feedbackHtml;
}

function shouldShowYouthSeasonOutcome(eventId) {
  return player.chapter === "少棒第一季" && youthSeasonOutcomeEventIds.has(eventId);
}

function getYouthSeasonOutcomeHeading(eventId) {
  if (eventId === "youth_position_trial") return "這次輪測的結果";
  if (eventId === "youth_bench") return "這段紅白賽的結果";
  if (eventId === "youth_match_after") return "這場比賽留下的結果";
  if (eventId.startsWith("youth_match_")) return "這一球的結果";
  return "這次選擇的結果";
}

function getYouthSeasonOutcomeReaction(eventId) {
  if (eventId === "youth_position_trial") return "山本教練把三球的結果寫進分組表，下一段訓練會依這個安排開始。";
  if (eventId === "youth_teammate") return "器材室的門關上後，阿哲帶著這次互動離開球場；下一次合作時，他不會把它當作沒發生過。";
  if (eventId === "youth_bench") return "紅白賽收操後，山本教練把名單與你的板凳紀錄一起收回。";
  if (eventId === "youth_match_entry") return "教練確認你已進入守位，場上的隊友開始把下一球交給你。";
  if (["youth_match_grounder", "youth_match_outfield", "youth_match_catcher", "youth_match_pitcher"].includes(eventId)) {
    return "記錄員留下這一球的結果；隊友完成補位後，這場比賽繼續往下一局走。";
  }
  if (eventId === "youth_match_mistake") return "場上的喊聲沒有停；這次回應會和前一個守備一起進入賽後評估。";
  if (eventId === "youth_match_after") return "山本教練收下記分紙，這場比賽會和整個球季一起進入評估。";
  return "球隊照原本的節奏繼續運作，這次選擇則被留進你的球季紀錄。";
}

function isBaseballGameplayPending() {
  return Boolean(pendingBaseballGameplay);
}

function clearPendingBaseballGameplay() {
  pendingBaseballGameplay = null;
}

function createGameplayRolls() {
  return Object.freeze({
    fieldingExecution: Math.random(),
    fieldingResult: Math.random(),
    throwExecution: Math.random(),
    result: Math.random()
  });
}

function getYouthGrounderApproachChoice(approach) {
  return getEvent("youth_match_grounder")?.choices?.find(choice => choice.gameplayApproach === approach) || null;
}

function getYouthGrounderApproachFlag(approach) {
  return {
    secure: "youth_grounder_secure",
    attack: "youth_grounder_attack",
    dive: "youth_grounder_dive"
  }[approach] || "";
}

function mergeGameplaySkillEffects(...groups) {
  const merged = {};
  groups.forEach(group => Object.entries(group || {}).forEach(([key, value]) => {
    merged[key] = (merged[key] || 0) + value;
  }));
  return merged;
}

function createIntegratedYouthGrounderChoice(approach, throwDecision, result) {
  const approachChoice = getYouthGrounderApproachChoice(approach) || {};
  const throwChoice = youthGrounderThrowChoices.find(choice => choice.code === throwDecision) || null;
  const flags = [
    getYouthGrounderApproachFlag(approach),
    throwChoice?.flag || "",
    result.mutation?.resultFlag || ""
  ].filter(Boolean);
  return {
    text: [approachChoice.text, throwChoice?.text].filter(Boolean).join("；"),
    effects: Object.assign({}, approachChoice.effects || {}),
    skillEffects: mergeGameplaySkillEffects(approachChoice.skillEffects, throwChoice?.skillEffects),
    flags,
    memory: result.narrative,
    matchEffects: {
      performance: result.mutation?.performanceDelta || 0,
      errors: result.mutation?.errorDelta || 0,
      outs: result.mutation?.outsAdded || 0
    }
  };
}

function applyIntegratedBaseballPlayResult(result) {
  if (!result || result.status !== "resolved" || result.stage !== "complete" || !result.mutation) {
    return { ok: false, error: "invalid-integrated-result" };
  }
  const mutation = result.mutation;
  if (
    !Number.isInteger(mutation.outsAdded) ||
    !Array.isArray(mutation.runners) ||
    mutation.runners.length !== 3 ||
    typeof mutation.performanceDelta !== "number" ||
    typeof mutation.errorDelta !== "number" ||
    typeof mutation.resultFlag !== "string"
  ) {
    return { ok: false, error: "invalid-integrated-mutation" };
  }
  player.matchState.outs = Math.min(3, (Number(player.matchState.outs) || 0) + mutation.outsAdded);
  player.matchState.runners = mutation.runners.map(Boolean);
  player.seasonPerformance += mutation.performanceDelta;
  player.seasonErrors += mutation.errorDelta;
  return { ok: true };
}

function completeIntegratedYouthGrounder(result, approach, throwDecision = null) {
  if (!pendingBaseballGameplay || pendingBaseballGameplay.stage === "committing") return false;
  pendingBaseballGameplay.stage = "committing";
  isTransitioning = true;
  setChoiceTransitionState(true);
  const before = getPlayerSnapshot();
  const choice = createIntegratedYouthGrounderChoice(approach, throwDecision, result);
  const applied = applyIntegratedBaseballPlayResult(result);
  if (!applied.ok) {
    clearPendingBaseballGameplay();
    isTransitioning = false;
    setChoiceTransitionState(false);
    showNotice("這一球的結果無法安全套用，請重新整理後再試一次。", "error");
    return false;
  }

  applyConsequenceAtEvent("youth_match_grounder");
  applyEffects(choice.effects);
  applySkillEffects(choice.skillEffects);
  addFlags(choice.flags);
  updateGoalProgressForChoice("youth_match_grounder", choice);
  if (choice.memory) {
    player.memories.push(choice.memory);
    player.memories = player.memories.slice(-20);
  }
  updateRoute();
  updateImpression();
  processCareerArcEvent("youth_match_grounder", choice);
  processEmotionalEvent("youth_match_grounder", choice);
  processRelationshipPayoffs("youth_match_grounder");
  processAspirationEvent("youth_match_grounder", choice);
  recordContinuityOutcome(choice.continuityOutcome || createContinuityOutcome("youth_match_grounder", choice));
  advanceNarrativeThread("youth_match_grounder", choice);
  const statFeedbackHtml = showStatChanges(before, getPlayerSnapshot(), choice.memory, { includeMemory: false });

  advanceAfterAction(null, "youth_match_grounder");
  tickPendingEvents("youth_match_grounder");
  clearPendingBaseballGameplay();
  renderYouthSeasonOutcome("youth_match_grounder", choice, statFeedbackHtml);
  return true;
}

function chooseYouthGrounderFielding(approach) {
  if (isTransitioning || pendingBaseballGameplay || getCurrentEventId() !== "youth_match_grounder") return false;
  if (
    typeof BaseballGameplayIntegration !== "object" ||
    typeof BaseballGameplayIntegration.resolveYouthGrounderFielding !== "function" ||
    !BaseballGameplayIntegration.isFieldingApproachAvailable(approach)
  ) {
    showNotice("這個接球方式目前不能使用。", "warning");
    return false;
  }
  const rolls = createGameplayRolls();
  pendingBaseballGameplay = {
    eventId: "youth_match_grounder",
    stage: "resolving-fielding",
    fieldingApproach: approach,
    rolls,
    playerSnapshotKey: BaseballGameplayIntegration.getYouthGrounderSnapshotKey(player)
  };
  const result = BaseballGameplayIntegration.resolveYouthGrounderFielding(player, approach, rolls);
  if (result.status !== "resolved") {
    clearPendingBaseballGameplay();
    showNotice("這一球無法完成判定，請重新選擇。", "error");
    return false;
  }
  if (result.stage === "complete") {
    return completeIntegratedYouthGrounder(result, approach, null);
  }
  pendingBaseballGameplay.stage = "throw-decision";
  pendingBaseballGameplay.controlQuality = result.controlQuality;
  renderIntegratedYouthGrounder(getEvent("youth_match_grounder"));
  return true;
}

function chooseYouthGrounderThrow(throwDecision) {
  const pending = pendingBaseballGameplay;
  if (
    isTransitioning ||
    !pending ||
    pending.eventId !== "youth_match_grounder" ||
    pending.stage !== "throw-decision" ||
    getCurrentEventId() !== "youth_match_grounder" ||
    !youthGrounderThrowChoices.some(choice => choice.code === throwDecision)
  ) return false;
  if (BaseballGameplayIntegration.getYouthGrounderSnapshotKey(player) !== pending.playerSnapshotKey) {
    clearPendingBaseballGameplay();
    showNotice("場上狀態已改變，請重新處理這一球。", "warning");
    showCurrentEvent();
    return false;
  }
  pending.stage = "resolving-throw";
  const result = BaseballGameplayIntegration.resolveYouthGrounder(
    player,
    { fieldingApproach: pending.fieldingApproach, throwDecision },
    pending.rolls
  );
  if (result.status !== "resolved" || result.stage !== "complete") {
    clearPendingBaseballGameplay();
    showNotice("傳球結果無法安全判定，請重新處理這一球。", "error");
    showCurrentEvent();
    return false;
  }
  return completeIntegratedYouthGrounder(result, pending.fieldingApproach, throwDecision);
}

function renderIntegratedYouthGrounder(event, prepared = {}) {
  const text = prepared.text || (typeof event.text === "function" ? event.text() : event.text);
  const stage = pendingBaseballGameplay?.stage === "throw-decision" ? "throw" : "fielding";
  const controlText = pendingBaseballGameplay?.controlQuality === "clean"
    ? "球穩穩留在身前，腳步也已轉向傳球方向。"
    : pendingBaseballGameplay?.controlQuality === "delayed"
      ? "球留在手套裡，但你多用了一步才把身體轉回來。"
      : pendingBaseballGameplay?.controlQuality === "off-balance"
        ? "你勉強把球擋在身前，出手時身體仍偏向一側。"
        : "";
  const stagePrompt = stage === "throw"
    ? `${controlText}\n\n跑者仍往二壘衝，打者也已越過一半的壘間。現在要決定把球送到哪裡。`
    : text;
  const buttons = stage === "throw"
    ? youthGrounderThrowChoices.map(choice => `<button type="button" onclick="chooseYouthGrounderThrow('${choice.code}')">${escapeHtml(choice.text)}</button>`).join("")
    : event.choices
      .filter(choice => BaseballGameplayIntegration.isFieldingApproachAvailable(choice.gameplayApproach))
      .map(choice => `<button type="button" onclick="chooseYouthGrounderFielding('${choice.gameplayApproach}')">${escapeHtml(choice.text)}</button>`).join("");
  const sceneContextHtml = prepared.sceneContextHtml || renderSceneContext(getSceneContext("youth_match_grounder", event));
  const competitionFrame = prepared.competitionFrame || renderCompetitionPresentation("youth_match_grounder");
  const bridgeInHtml = prepared.bridgeInHtml || "";
  const bridgeOutHtml = stage === "fielding" ? (prepared.bridgeOutHtml || "") : "";
  document.getElementById("story").innerHTML = `<article class="event-card integrated-gameplay-card" aria-labelledby="currentEventTitle">${sceneContextHtml}${competitionFrame}${bridgeInHtml}<div class="event-kicker">${stage === "fielding" ? "接球判斷" : "傳球判斷"}</div><h2 id="currentEventTitle" tabindex="-1">${escapeHtml(event.title)}</h2><div class="event-text">${escapeHtml(stagePrompt)}</div>${bridgeOutHtml}</article>`;
  document.getElementById("choices").innerHTML = buttons;
}

function renderYouthSeasonOutcome(eventId, choice, statFeedbackHtml) {
  pendingYouthSeasonOutcome = { eventId };
  const competitionFrame = renderCompetitionPresentation(eventId);
  const choiceLabel = typeof choice?.text === "string" ? choice.text.trim() : "";
  const narrativeOutcome = typeof choice?.memory === "string" ? choice.memory.trim() : "";
  const reactionValue = getYouthSeasonOutcomeReaction(eventId);
  const worldReaction = typeof reactionValue === "string" ? reactionValue.trim() : "";
  const systemFeedback = typeof statFeedbackHtml === "string" ? statFeedbackHtml.trim() : "";
  const confirmationHtml = choiceLabel ? `
      <section class="outcome__confirmation choice-outcome-action" aria-label="你的選擇">
        <small>你選擇</small><strong>${escapeHtml(choiceLabel)}</strong>
      </section>` : "";
  const narrativeHtml = narrativeOutcome ? `
      <section class="outcome__narrative choice-outcome-result" aria-label="事件結果">
        <small>發生的結果</small><p>${escapeHtml(narrativeOutcome)}</p>
      </section>` : "";
  const reactionHtml = worldReaction ? `
      <section class="outcome__reaction choice-outcome-reaction" aria-label="人物或場上反應">
        <small>場上的回應</small><p>${escapeHtml(worldReaction)}</p>
      </section>` : "";
  const feedbackHtml = systemFeedback ? `
      <section class="outcome__feedback choice-outcome-feedback" aria-label="系統回饋">
        <small>狀態變化</small>${systemFeedback}
      </section>` : "";
  setChoiceTransitionState(false);
  document.getElementById("story").innerHTML = `
    <article class="event-card outcome choice-outcome-card" aria-labelledby="outcomeTitle">
      ${competitionFrame}
      <div class="event-kicker choice-outcome-kicker">行動結果</div>
      <h2 id="outcomeTitle" tabindex="-1">${escapeHtml(getYouthSeasonOutcomeHeading(eventId))}</h2>
      ${confirmationHtml}
      ${narrativeHtml}
      ${reactionHtml}
      ${feedbackHtml}
    </article>`;
  clearOutcomeFeedbackPresentation();
  document.getElementById("choices").innerHTML = `
    <div class="outcome__action" aria-label="前往下一幕">
      <button type="button" class="outcome-continue-button" onclick="continueYouthSeasonOutcome()">繼續</button>
    </div>`;
  updateStatus();
  focusOutcomeHeading();
}

function continueYouthSeasonOutcome() {
  if (!pendingYouthSeasonOutcome) return;
  setOutcomeContinueState(true);
  pendingYouthSeasonOutcome = null;
  isTransitioning = false;
  showCurrentEvent();
}

function showNotice(message, type = "neutral") {
  const node = document.getElementById("changeLog");
  if (!node) return;
  setOutcomeFeedbackPresentation(false);
  node.innerHTML = `<div class="notice ${type}">${escapeHtml(message)}</div>`;
}

function choose(eventId, index) {
  if (isTransitioning) return;
  if (player.chapter === "生涯轉換期" && getCurrentEventId() !== eventId) return;
  if (player.chapter === "發展期" && getCurrentEventId() !== eventId) return;
  const event = getEvent(eventId);
  const choice = event?.choices?.[index];
  if (!choice) return;
  if (eventId === "youth_match_grounder" && choice.gameplayApproach) {
    return chooseYouthGrounderFielding(choice.gameplayApproach);
  }
  let decisionContext = null;
  let relationshipContext = null;
  if (eventId === "chapter2_intro" && index === 0) {
    const contextResult = DecisionFlow.createDecisionContext(eventId, index);
    if (!contextResult.ok) throw new Error(contextResult.error);
    decisionContext = contextResult.context;
  }
  if (eventId === "youth_season_intro" && index === 0) {
    const contextResult = RelationshipFlow.createRelationshipContext(
      eventId,
      index
    );
    if (!contextResult.ok) throw new Error(contextResult.error);
    relationshipContext = contextResult.context;
  }

  if (choice.restart) return resetGame();
  if (choice.nextChapter === "chapter2") return enterChapterTwo();
  if (choice.nextChapter === "youthSeason") return enterYouthSeason();
  if (choice.nextChapter === "positionCompetition") return enterPositionCompetition();
  if (choice.nextChapter === "juniorBaseball") return enterJuniorBaseball();
  if (choice.nextChapter === "juniorSeason") return enterJuniorSeason();
  if (choice.nextChapter === "highSchool") return enterHighSchool();
  if (choice.nextChapter === "highSchoolYearTwo") return enterHighSchoolYearTwo();
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
    const timeSnapshot = TimeBoundary.getSnapshot();
    if (
      eventId === "night" &&
      index === 0 &&
      timeSnapshot.day === 1 &&
      timeSnapshot.phase === "night"
    ) {
      const contextResult = DayCompletionFlow.createDayCompletionContext(
        eventId,
        index
      );
      if (!contextResult.ok) throw new Error(contextResult.error);
      const completionResult = DayCompletionFlow.completeDay(
        contextResult.context
      );
      if (!completionResult.ok) throw new Error(completionResult.error);
    }
    else {
      advanceFromNight();
    }
    showCurrentEvent();
    return;
  }

  isTransitioning = true;
  setChoiceTransitionState(true);
  const before = getPlayerSnapshot();
  const originalAzheArc = player.characterArc?.azhe || "neutral";
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
  if (relationshipContext) {
    const result = RelationshipFlow.createRelationshipResult(
      relationshipContext,
      {
        targetId: "coachTrust",
        amount: choice.relationshipEffects.coachTrust,
        previousValue: RelationshipBoundary.getRelationship("coachTrust")
      }
    );
    if (!result.ok) throw new Error(result.error);
    const relationshipChange = RelationshipFlow.applyRelationshipResult(
      result.relationshipResult
    );
    if (!relationshipChange.ok) throw new Error(relationshipChange.error);
    syncNpcRelationships();
  }
  else {
    applyNestedEffects("relationships", choice.relationshipEffects);
  }
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
  if (choice.azheCoverSignalOutcome) applyAzheCoverSignalOutcome(originalAzheArc);
  if (choice.resolveStartingCompetition) resolveStartingCompetition();
  processCareerArcEvent(eventId, choice);
  processEmotionalEvent(eventId, choice);
  processRelationshipPayoffs(eventId);
  processAspirationEvent(eventId, choice);
  recordContinuityOutcome(choice.continuityOutcome || createContinuityOutcome(eventId, choice));
  advanceNarrativeThread(eventId, choice);
  const holdYouthSeasonOutcome = shouldShowYouthSeasonOutcome(eventId);
  const statFeedbackHtml = showStatChanges(
    before,
    getPlayerSnapshot(),
    choice.memory,
    { includeMemory: !holdYouthSeasonOutcome }
  );

  if (processTakahashiStoryboardFlow(eventId)) return;

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
  else advanceAfterAction(decisionContext, eventId);
  tickPendingEvents(eventId);

  if (holdYouthSeasonOutcome) {
    renderYouthSeasonOutcome(eventId, choice, statFeedbackHtml);
    return;
  }

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
  clearPendingBaseballGameplay();
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

function enterHighSchoolYearTwo() {
  applyChapterBreather();
  player.chapter = "青棒第二年";
  player.age = 17;
  player.highSchoolYearTwoStep = 0;
  player.highSchoolYearTwoResult = "";
  player.highSchoolYearTwoDetail = "";
  showNotice("高中第二年開始：原有順位與角色將重新接受驗證。", "success");
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
  const commitResult = CareerTransitionCommitBoundary.commitGraduationTransition(player);
  if (!commitResult.committed) return commitResult;

  const runtimeResult = CareerTransitionRuntimeResolver.resolveTransitionRuntime(player);
  if (!runtimeResult.resolved) return runtimeResult;

  applyChapterBreather();
  const routeKey = runtimeResult.routeKey;
  const routeThread = adultNarrativeChains[routeKey];
  startNarrativeThread({ ...routeThread, route: routeKey });
  if (!player.roleIdentity.primary) changeRoleIdentity(inferRoleIdentity(), "高中階段形成第一個可被市場描述的角色");
  player.careerArc.stage = player.roleIdentity.primary ? "established" : "emerging";
  updateCareerValue();
  showNotice(`你進入「${player.careerExit}」分流，事件鏈將不再相同。`, "success");
  showCurrentEvent();
  return commitResult;
}

function enterDevelopmentYears() {
  applyChapterBreather();
  player.chapter = "發展期";
  player.age = 20;
  player.developmentStep = 0;
  const routeKey = getAdultRouteKey();
  const developmentEventIds = getDevelopmentNarrativeEventIds();
  startNarrativeThread({
    id: `${routeKey}_role_revaluation`, route: routeKey,
    title: routeKey === "rehab" ? "用新方法回到比賽" : "下一種用途開始有形狀",
    question: routeKey === "draft" ? "名單調整前，你能讓哪一種用途變得不可忽略？" : routeKey === "college" ? "調整節奏後，你能用哪一場表現重新進入球探視野？" : routeKey === "amateur" ? "工作與棒球並行時，你願意為哪一次晚成機會保留時間？" : "改變打法後，哪一項新任務能讓你再次參與比賽？",
    totalBeats: developmentEventIds.length,
    tensions: ["下一次比較將看見你能提供的新用途"]
  });
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
  if (!Array.isArray(player.roleIdentity.previousArchetypes)) player.roleIdentity.previousArchetypes = [];
  const current = player.roleIdentity.primary;
  const currentArchetype = player.roleIdentity.archetype || "";
  const nextArchetype = inferPlayerArchetype(nextRole);
  if (current === nextRole) {
    if (currentArchetype && currentArchetype !== nextArchetype && !player.roleIdentity.previousArchetypes.includes(currentArchetype)) player.roleIdentity.previousArchetypes.push(currentArchetype);
    player.roleIdentity.archetype = nextArchetype;
    return currentArchetype !== nextArchetype;
  }
  if (current && !player.roleIdentity.previous.includes(current)) player.roleIdentity.previous.push(current);
  if (currentArchetype && !player.roleIdentity.previousArchetypes.includes(currentArchetype)) player.roleIdentity.previousArchetypes.push(currentArchetype);
  player.roleIdentity.primary = nextRole;
  player.roleIdentity.archetype = nextArchetype;
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

const playerArchetypeDescriptions = {
  "本壘板指揮官": "用配球、觀察與守備指揮掌握整場比賽。", "銅牆鐵壁": "讓穿越防區的球變少。",
  "雷射肩捕手": "以快速而有威脅的傳球壓制跑者。", "攻擊型捕手": "在捕手守位仍能提供穩定火力。",
  "火球派投手": "用球威迫使打者縮短反應時間。", "精密控球師": "靠控球與打者閱讀攻擊最難碰觸的位置。",
  "吃局機器": "用耐力、恢復與穩定性替球隊消化局數。", "短局拆彈手": "在有限局數裡承擔最高壓力的出局任務。",
  "內野指揮塔": "提早閱讀球路並協調內野站位與補位。", "強肩三游": "用傳球能力擴大三游防區。",
  "攻守兼備內野手": "守備能站住位置，棒子也能留在先發。", "穩定型內野手": "以確實完成與低失誤累積信任。",
  "外野獵犬": "依靠起步、反應與範圍追上原本會落地的球。", "雷射肩外野手": "長距離回傳足以改變跑者決策。",
  "強打外野手": "以進攻產出支撐外野守位價值。", "速度型中外野": "用速度影響守備範圍與壘間壓力。", "外野守護者": "穩定接住飛球並維持外野防線。",
  "超級工具人": "能在多個位置理解並完成不同任務。", "多功能拼圖": "依照名單缺口提供用途。",
  "靠棒子生存": "守位不是最大優勢，打席內容決定能否留下。", "攻擊突破口": "球隊需要得分時，棒子是最清楚的使用理由。",
  "板凳席王牌": "有限打席裡仍能準備好最重要的一次揮棒。", "壘間破壞者": "以速度、判斷和跑壘壓迫整條防線。",
  "板凳司令塔": "即使不固定先發，仍能讓隊伍準備得更完整。", "場上教練": "把理解轉成隊友能執行的提醒與安排。"
};

function inferPlayerArchetype(primaryRole = player.roleIdentity?.primary || inferRoleIdentity()) {
  const s = player.baseballSkills || {};
  const position = player.seasonPosition || "";
  if (primaryRole === "工具人") return player.secondaryPosition && (s.baseballIQ || 0) + (s.catching || 0) >= 16 ? "超級工具人" : "多功能拼圖";
  if (primaryRole === "代打") return "板凳席王牌";
  if (primaryRole === "速度型球員") return "壘間破壞者";
  if (primaryRole === "板凳領袖") return "板凳司令塔";
  if (primaryRole === "場上組織者") return "場上教練";
  if (primaryRole === "打擊型球員") return (s.batting || 0) >= 12 ? "靠棒子生存" : "攻擊突破口";
  if (position === "捕手") {
    if ((s.batting || 0) >= 10 && (s.batting || 0) >= Math.max(s.blocking || 0, s.gameCalling || 0)) return "攻擊型捕手";
    if ((s.gameCalling || 0) + (s.baseballIQ || 0) >= 18) return "本壘板指揮官";
    if ((s.blocking || 0) + (s.catching || 0) >= 18) return "銅牆鐵壁";
    if ((s.armStrength || 0) + (s.throwing || 0) >= 18) return "雷射肩捕手";
    return "本壘板指揮官";
  }
  if (position === "投手") {
    if ((s.control || 0) >= 10 && (s.baseballIQ || 0) >= 9) return "精密控球師";
    if ((s.armStrength || 0) >= 11 && (s.throwing || 0) >= 10) return "火球派投手";
    if ((s.pitchStamina || 0) >= 10 && (player.body?.recovery || 0) >= 7) return "吃局機器";
    return "短局拆彈手";
  }
  if (position === "外野手") {
    if ((s.range || 0) + (s.reaction || 0) >= 20) return "外野獵犬";
    if ((s.armStrength || 0) + (s.throwing || 0) >= 20) return "雷射肩外野手";
    if ((s.batting || 0) >= 10) return "強打外野手";
    if ((s.baseRunning || 0) >= 9) return "速度型中外野";
    return "外野守護者";
  }
  if ((s.catching || 0) + (s.reaction || 0) + (s.range || 0) >= 28) return "銅牆鐵壁";
  if ((s.baseballIQ || 0) + (s.reaction || 0) >= 19) return "內野指揮塔";
  if ((s.throwing || 0) + (s.armStrength || 0) >= 20) return "強肩三游";
  if ((s.batting || 0) >= 10) return "攻守兼備內野手";
  return "穩定型內野手";
}

function refreshPlayerArchetype() {
  if (!player.roleIdentity?.primary) return "尚未形成";
  if (!Array.isArray(player.roleIdentity.previousArchetypes)) player.roleIdentity.previousArchetypes = [];
  const next = inferPlayerArchetype(player.roleIdentity.primary);
  const current = player.roleIdentity.archetype || "";
  if (current && current !== next && !player.roleIdentity.previousArchetypes.includes(current)) player.roleIdentity.previousArchetypes.push(current);
  player.roleIdentity.archetype = next;
  return next;
}

function getPlayerArchetypeDescription() {
  const archetype = refreshPlayerArchetype();
  return playerArchetypeDescriptions[archetype] || "這種球員型態仍在形成。";
}

function invalidateCurrentRole(reason) {
  const role = player.roleIdentity.primary;
  if (!role || player.careerArc.stage === "declining") return;
  player.careerArc.stage = "declining";
  player.careerArc.valleys += 1;
  if (!player.roleIdentity.previous.includes(role)) player.roleIdentity.previous.push(role);
  const archetype = player.roleIdentity.archetype || "";
  if (archetype && !player.roleIdentity.previousArchetypes.includes(archetype)) player.roleIdentity.previousArchetypes.push(archetype);
  player.careerArc.lostRole = role;
  player.roleIdentity.primary = "";
  player.roleIdentity.archetype = "";
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
  if (eventId === "transition_checkpoint" || transitionRouteDecisionEvents.includes(eventId)) {
    let nextRole = inferRoleIdentity();
    if (hasFlag("pro_roster_utility")) nextRole = "工具人";
    if (hasFlag("pro_fought_for_bats") || hasFlag("amateur_showed_ceiling")) nextRole = "打擊型球員";
    if (hasFlag("pro_showed_primary_tool") || hasFlag("amateur_showed_floor")) nextRole = player.seasonPosition === "捕手" ? "捕手核心" : player.seasonPosition === "投手" ? "短局投手" : "守備後段專家";
    if (hasFlag("rehab_helped_youth")) nextRole = "場上組織者";
    changeRoleIdentity(nextRole, "路線專屬壓力把前三幕選擇整理成第一次有限任務");
    addTurningPoint(`transition_role_${getAdultRouteKey()}`, `第一次以「${nextRole}」接受新組織測試`, "前一回的選擇改變了本回的任務內容");
    updateCareerValue({ delta: 2, trend: "rising" });
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
    if (player.characterArc.azhe === "best_friend" || player.impression.azhe.trusts >= 4) return "阿哲說：『先別急著證明以前的你。你現在最想把哪一件事做好？我可以陪你試一次。』";
    if (player.relationships.rivalRespect >= 6) return "高橋說：『下一次測試，我會看你能不能把新的做法帶進比賽。』";
    return "山本教練說：『你讀球和補位的經驗還在。下一次先證明，你能不能把它變成另一個守位的答案。』";
  }
  if (player.careerArc.stage === "reinvented") return "山本教練看完新任務表，只說：『這不是退而求其次，是你重新證明自己能解決什麼。』";
  return "山本教練仍在觀察：一項能力要反覆轉成場上用途，才會成為真正的角色。";
}

function generateCareerSummary() {
  const roles = [...(player.roleIdentity.previous || []), player.roleIdentity.primary].filter(Boolean);
  const archetype = player.roleIdentity.primary ? refreshPlayerArchetype() : "尚未形成";
  const archetypeHistory = (player.roleIdentity.previousArchetypes || []).filter(item => item && item !== archetype);
  const lost = player.turningPoints.find(point => point.id.startsWith("role_lost_"));
  const needed = player.turningPoints.find(point => point.id === "needed_again");
  const opening = roles.length > 1 ? `你曾是${roles[0]}，後來轉型為${roles[roles.length - 1]}。` : roles.length ? `你逐漸成為${roles[0]}。` : "你的球員角色直到最後仍沒有完全定型。";
  const change = lost ? `${lost.title}之後，你不再只追著原本的定位，而開始試著把經驗帶去新的任務。` : "每次評估都讓你更清楚，自己想用哪一種方式參與比賽。";
  const possibility = needed ? `${needed.title}：${needed.impact}。` : `下一步仍很具體：${getCurrentAspiration().nextPossibility || "把現有工具轉成一次能被看見的場上任務"}。`;
  return `${opening}\n你目前形成的球員型態是「${archetype}」：${playerArchetypeDescriptions[archetype] || "仍在形成"}${archetypeHistory.length ? `\n過去曾被描述為：${archetypeHistory.join(" → ")}。` : ""}\n${change}\n${possibility}\n你曾經追求的不是一條直線，而是一連串可以實際嘗試的角色；目前的生涯走勢是${({ rising: "正在上升", stable: "穩定累積", declining: "等待下一次調整", rebound: "重新被看見" })[player.careerValue.trend] || "穩定累積"}。\n紀錄中的最高市場評估為 ${player.careerValue.peak}、最低為 ${player.careerValue.minimum}；它們是軌跡，不是人生結論。`;
}

const REPLAY_MEMORY_KEY = "baseballLifeReplayMemories";
const emotionLevelRank = { minor: 1, major: 2, legendary: 3 };

function getEmotionChapter(eventId = "") {
  const map = {
    ending: "十歲暑假", chapter2_result: "少棒入門", youth_season_result: "少棒第一季",
    competition_result: "位置競爭", junior_result: "青少棒分化", junior_season_result: "青少棒球季",
    high_school_result: "青棒第一年", high_school_year_two_result: "青棒第二年", critical_year_result: "高中關鍵年",
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
  if (npc === "azhe" && (rememberLifeEvent("azhe_goodbye") || rememberLifeEvent("azhe_stayed"))) return "阿哲說：『我最近也找到想做的事了。下次見面，我想看看我們各自走到了哪裡。』";
  if (npc === "takahashi" && rememberLifeEvent("first_starting_test")) return "高橋說：『下一次別只跟我比結果。把你現在最有把握的工具帶來。』";
  if (npc === "yamamoto" && rememberLifeEvent("first_appearance")) return `山本教練說：『我第一次看你上場時，就注意到你會${player.observe >= player.instinct ? "先看懂球怎麼走" : "在球到以前先動起來"}。那可能是你下一個角色的起點。』`;
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
  const aspiration = getCurrentAspiration();
  return `章末記憶：\n${memory ? `你會記得「${memory.title}」。` : "這一章仍留下了一個你說不清楚的感覺。"}\n\n人物回應：\n${reaction}\n\n這一階段追過的事：\n${aspiration.current || chapterAspirationGuide[chapter]?.current || "找到下一個能參與棒球的方法"}\n\n下一個可以期待的具體時刻：\n${getHopeHook(eventId).text}`;
}

function getReplayMemoryEcho() {
  const memory = player.replayMemories?.[0];
  return memory ? memory.type === "aspiration"
    ? `前一段人生的回聲：\n你曾經追過「${memory.title}」。那一世留下的不是答案，而是「${memory.nextPossibility}」。`
    : `前一段人生的回聲：\n你曾經也是這樣選擇。那一世，你記得的是「${memory.title}」。` : "";
}

function loadReplayMemories() {
  try { return JSON.parse(localStorage.getItem(REPLAY_MEMORY_KEY) || "[]"); } catch (_) { return []; }
}

function archiveReplayMemory() {
  const pursuits = [...(player.aspirationMoments || [])].sort((a, b) => (b.age || 0) - (a.age || 0)).slice(0, 3).map(item => ({ id: `aspiration_${item.id}`, type: "aspiration", title: item.desire || item.title, nextPossibility: item.possibility || "換一種方法再靠近一次", age: item.age, importance: 6 }));
  const life = [...player.lifeEvents].filter(item => item.remembered).sort((a, b) => b.importance - a.importance || a.age - b.age);
  const memories = [...pursuits, ...life].filter((item, index, all) => all.findIndex(other => other.id === item.id) === index).slice(0, 5);
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
  const pursuits = [...(player.aspirationMoments || [])].sort((a, b) => (a.age || 0) - (b.age || 0));
  const fulfilled = pursuits.filter(item => item.status === "fulfilled");
  const redirected = pursuits.filter(item => item.status === "redirected");
  const peak = [...player.emotionalPeaks].sort((a, b) => emotionLevelRank[b.level] - emotionLevelRank[a.level] || b.importance - a.importance)[0];
  const low = [...player.lowPoints].sort((a, b) => b.importance - a.importance)[0];
  const list = events.length ? events.map(item => `${item.age} 歲｜${item.title}`).join("\n") : "還沒有足以寫進人生傳記的事件。";
  const pursuitList = pursuits.length ? pursuits.slice(-5).map(item => `${item.age} 歲｜想要${item.desire}｜${getAspirationOutcome(item)}`).join("\n") : "你仍在替第一個具體追求命名。";
  const current = getCurrentAspiration();
  const payoff = [...(player.relationshipPayoffs || [])].reverse().find(item => item.resolved && !item.absence);
  return `你一路追過的事：\n${pursuitList}\n\n曾經做到的：${fulfilled.length ? fulfilled.map(item => item.desire).join("、") : "還在累積第一次明確完成"}\n改變方式後仍保留的：${redirected.length ? redirected.map(item => item.desire).join("、") : "目前沒有被迫放棄的追求"}\n最重要的人：${getMostImportantPerson()}\n人物關係實際改變生涯：${payoff ? `${payoff.title}，${payoff.impact || payoff.effect}` : "這一輪沒有任何舊關係直接打開入口，你靠當期組織提出的新條件繼續前進。"}\n\n現在仍想追的事：${current.current || "找到能長久參與棒球的位置"}\n下一個可以期待的具體時刻：${current.nextPossibility || "下一次有人把球交到你手裡"}\n\n你最重要的五件事：\n${list}\n\n情緒記錄索引：\n最大高峰：${peak?.title || "仍在等待"}\n最大低谷：${low?.title || "尚未留下"}`;
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
  junior_coach_disagreement: { id: "junior_coach_closed_notebook", title: "國中隊教練闔上的筆記本", category: "competition", chapter: "青少棒分化", location: "國中隊教練室門口", object: "現任教練的守位筆記本", characters: ["國中隊教練", "少棒恩師山本"], action: "現任教練闔上名單；山本在訊息中拒絕替你干預", emotion: "regret", silent: true, relationshipBeat: "conflict", relationshipMoments: { yamamoto: "conflict" }, memory: "你第一次明白，少棒恩師的理解不能取代現任教練的決定。", text: "國中隊教練聽完後沒有立刻回答。他把寫滿守位記號的筆記本慢慢闔上，指尖停在封面，才重新看向你。幾天後，少棒恩師山本拒絕替你干預，只透過訊息提醒你把不服氣整理成能被回答的問題。" },
  transition_relationship: { id: "three_people_reunion", title: "多年後同一顆球又回到手裡", category: "rebirth", chapter: "生涯轉換", location: "舊球場外側", object: "畫著歪斜記號的球", characters: ["阿哲", "高橋", "山本教練"], action: "那顆球在三人之間傳了一圈，最後回到你手裡", emotion: "gratitude", silent: true, relationshipBeat: "reunion", relationshipMoments: { azhe: "reunion", takahashi: "reunion", yamamoto: "reunion" }, memory: "大家都變了，接球的聲音卻和以前一樣。", text: "阿哲先把球拋給高橋，高橋再送到山本教練手裡。那顆畫著歪斜記號的球繞了一圈，最後落回你的掌心。大家都變了，接球的聲音卻和以前一樣。" },
  development_mentor: { id: "yamamoto_reunion_glance", title: "導師再一次看見現在的你", category: "rebirth", chapter: "發展期", location: "看臺最下排", object: "山本導師的舊筆記本", characters: ["山本導師"], action: "山本翻到多年前那頁，又安靜地闔上", emotion: "gratitude", silent: true, relationshipBeat: "reunion", memory: "那頁寫的是以前的你，山本看著的卻是現在。", text: "山本導師翻開舊筆記本，找到多年前寫著你名字的那頁。他沒有替現任組織做決定，只幫你把一路形成的用途說清楚。那頁記的是以前的你，他看著的卻是現在。" }
};

function recordSymbolObject(title, sceneId) {
  if (!title) return false;
  const id = title.replace(/\s+/g, "_");
  const existing = player.symbolObjects.find(item => item.id === id);
  if (existing) {
    if (!existing.scenes.includes(sceneId)) existing.scenes.push(sceneId);
    return false;
  }
  player.symbolObjects.push({ id, title, firstScene: sceneId, scenes: [sceneId], remembered: true, meaning: getSymbolObjectMeaning(title) });
  return true;
}

function getSymbolObjectMeaning(title = "") {
  if (title.includes("置物櫃")) return "下一段尚未發生的生活，已經替你留下可以寫上名字的位置。";
  if (title.includes("球衣")) return "不是證明你已經是球員，而是提醒你曾經想成為球員。";
  if (title.includes("手套")) return "不只記得受傷或失誤，也記得你仍想再接住一球。";
  if (title.includes("球棒")) return "不是逞強的證據，而是你曾相信下一次揮棒能改變角色。";
  if (title.includes("背號")) return "不只屬於過去，也提醒你下一次想用什麼身分穿上它。";
  if (title.includes("球")) return "這顆球記得你第一次靠近棒球，也把下一次傳回你手裡。";
  return "它保存的不是結束，而是一個仍能重新解讀的起點。";
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

const narrativeToneGuide = {
  coreTheme: "人生只要仍看得見下一個值得追的事，就仍然在向前",
  avoid: ["反覆強調被淘汰", "將失去位置描述為人格否定", "把傷病直接等同夢想破滅", "使用熱血雞湯式鼓勵", "讓每次轉型都像悲壯重生"],
  prefer: ["具體而可達成的下一個期待", "現實限制中的新可能", "人物對未來的清醒想像", "小機會帶來的前進感", "不完美結果中的下一個入口"]
};

const chapterAspirationGuide = {
  "十歲暑假": { current: "我也想碰到那顆球。", reason: "球場裡的聲音第一次讓棒球變得具體。", next: "下一次，我能不能真正走進球場？" },
  "少棒入門": { current: "我想知道自己能不能成為球隊的一員。", reason: "穿上球衣不等於已經屬於球隊。", next: "教練會在什麼時候第一次叫到我的名字？" },
  "少棒第一季": { current: "我想得到第一次正式上場的機會。", reason: "練習開始有了可以交付的任務。", next: "下一場比賽，球隊還會不會再把任務交給我？" },
  "位置競爭": { current: "我想知道自己離先發還有多遠。", reason: "高橋是一個可以測量高度的對手，不是唯一目標。", next: "我能不能把一次機會變成固定用途？" },
  "青少棒": { current: "我想知道身體和環境改變後，自己還能怎麼打球。", reason: "原本自然成立的動作開始需要重新理解。", next: "是否存在一個比原本守位更適合自己的入口？" },
  "青少棒分化": { current: "我想找到一個願意讓自己繼續成長的高中環境。", reason: "學校不是獎品，而是下一段生活的條件。", next: "離開熟悉的人之後，我會遇到怎樣的棒球？" },
  "青棒": { current: "我想在新的球隊裡找到第一個明確任務。", reason: "新環境還不知道該怎麼使用我。", next: "這個任務能不能成為別人記住自己的理由？" },
  "青棒第二年": { current: "我想確認高一建立的角色能不能維持一整年。", reason: "學長離開、新生加入，原有順位必須重新接受春秋兩段驗證。", next: "高三前，教練會把哪一個投資方向寫進主課表？" },
  "青棒關鍵年": { current: "我想讓某一項能力真正換到下一個入口。", reason: "畢業讓能力必須對應到一個具體去處。", next: "畢業之後，棒球會以什麼形式繼續？" },
  "生涯轉換期": { current: "我想知道新的環境願意怎麼使用我。", reason: "新的名單、課表、工作或復健安排都在重新描述球員用途。", next: "下一個環境會把什麼任務交到我手裡？" },
  "發展期": { current: "我想知道自己還能走到哪裡。", reason: "角色不是終點，而是下一次嘗試的起點。", next: "下一個開始，會在哪一個具體位置逐漸成形？" }
};

const chapterResultHopeHooks = {
  ending: { title: "下一個可以期待的事", text: "明天，球場邊還會有一顆球滾出界外。", source: "chapter_result" },
  chapter2_result: { title: "下一個可以期待的事", text: "下週，山本教練會第一次按名字分配傳接球組。", source: "chapter_result" },
  youth_season_result: { title: "下一個可以期待的事", text: "下一場比賽的任務表，仍有一格尚未寫上名字。", source: "chapter_result" },
  competition_result: { title: "下一個可以期待的事", text: "三天後，教練會安排一次不同守位的測試。", source: "chapter_result" },
  junior_result: { title: "下一個可以期待的事", text: "下個月的練習裡，有一組球會從新的守位開始。", source: "chapter_result" },
  junior_season_result: { title: "下一個可以期待的事", text: "高中報到日，新的球場會第一次叫到你的名字。", source: "chapter_result" },
  high_school_result: { title: "下一個可以期待的事", text: "下一次隊內賽，教練會把尚未固定的任務交給一名替補球員。", source: "chapter_result" },
  high_school_year_two_result: { title: "下一個可以期待的事", text: "高三第一張訓練表，會把你今年保住的角色換成最後一年的投資方向。", source: "chapter_result" },
  critical_year_result: { title: "下一個可以期待的事", text: "畢業前，你會收到一份寫著具體條件的下一站通知。", source: "chapter_result" },
  transition_result: { title: "下一個可以期待的事", text: "新置物櫃旁仍空著一個位置，下一次任務會決定名字寫在哪裡。", source: "chapter_result" },
  development_result: { title: "下一個可以期待的事", text: "二十二歲不是答案，而是下一個開始第一次有了形狀。", source: "chapter_result" }
};

function getCurrentAspiration() {
  const guide = chapterAspirationGuide[player.chapter] || {};
  return Object.assign({ current: guide.current || "我想知道下一次能把什麼任務做好。", reason: guide.reason || "", nextPossibility: guide.next || "下一次事件會讓方向更具體。", sourceEventId: "", status: "active", worldResponse: "" }, player.aspirationState || {});
}

function setNextAspiration(current, options = {}) {
  player.aspirationState = Object.assign({}, player.aspirationState || {}, {
    current: current || getCurrentAspiration().current, reason: options.reason || player.aspirationState?.reason || "",
    nextPossibility: options.nextPossibility || player.aspirationState?.nextPossibility || "",
    sourceEventId: options.sourceEventId || "", status: options.status || "active",
    worldResponse: options.worldResponse || player.aspirationState?.worldResponse || ""
  });
  return player.aspirationState;
}

function getAspirationOutcome(stateInput = null) {
  const state = stateInput || player.aspirationState || {};
  const statusText = { active: "這份期待仍在發展。", fulfilled: "原本期待的事情已開始成為現實。", redirected: "現實沒有照原本方向發展，但留下了另一個具體入口。", paused: "這份期待暫時停下，條件不足的部分已經變得清楚。" };
  return `${statusText[state.status] || statusText.active}${state.worldResponse ? ` ${state.worldResponse}` : ""}`;
}

function getHopeHook(eventId = "") {
  return chapterResultHopeHooks[eventId] || { title: "下一個可以期待的事", text: player.aspirationState?.nextPossibility || chapterAspirationGuide[player.chapter]?.next || "下一次事件會帶來一個更具體的問題。", source: player.aspirationState?.sourceEventId || eventId };
}

function recordAspirationMoment(data = {}) {
  if (!data.id || player.aspirationMoments.some(item => item.id === data.id)) return false;
  player.aspirationMoments.push({ id: data.id, title: data.title || data.id, age: Number(data.age ?? player.age) || 0, desire: data.desire || getCurrentAspiration().current, possibility: data.possibility || player.aspirationState?.nextPossibility || "", fulfilled: Boolean(data.fulfilled), status: data.status || "active", chapter: data.chapter || player.chapter });
  return true;
}

function resolveAspirationMoment(id, status = "fulfilled", possibility = "") {
  const moment = player.aspirationMoments.find(item => item.id === id);
  if (!moment) return false;
  moment.fulfilled = status === "fulfilled";
  moment.status = status;
  if (possibility) moment.possibility = possibility;
  return true;
}

function getNextAspirationMemory() {
  const moment = [...player.aspirationMoments].reverse().find(item => item.possibility || !item.fulfilled);
  return moment ? `${moment.title}：${moment.possibility || moment.desire}` : player.aspirationState?.nextPossibility || "下一個期待尚未成形。";
}

function ensureChapterAspiration(eventId = "") {
  const guide = chapterAspirationGuide[player.chapter];
  if (!guide) return;
  const chapterChanged = !player.aspirationState?.current || player.aspirationState.sourceEventId?.startsWith("chapter:") && player.aspirationState.sourceEventId !== `chapter:${player.chapter}`;
  if (chapterChanged) setNextAspiration(guide.current, { reason: guide.reason, nextPossibility: guide.next, sourceEventId: `chapter:${player.chapter}`, status: "active", worldResponse: "" });
  if (chapterResultHopeHooks[eventId]) player.aspirationState.nextPossibility = chapterResultHopeHooks[eventId].text;
}

function processAspirationEvent(eventId, choice = {}) {
  const memory = choice.memory || "世界給出了具體回應。";
  const moments = {
    day1_morning: ["first_touch_desire", "第一次想碰到那顆球", "真正走進球場"],
    chapter2_intro: ["first_team_desire", "第一次想成為球隊的一員", "教練第一次按名字分組"],
    youth_match_entry: ["first_game_desire", "第一次期待正式上場", "下一場再次得到任務"],
    competition_intro: ["starter_distance_desire", "第一次想知道自己離先發多遠", "把一次機會變成固定用途"],
    junior_position_change: ["new_position_desire", "第一次發現新守位可能更適合自己", "在新守位完成正式任務"],
    junior_friend_exit: ["azhe_next_life", "第一次和阿哲交換各自下一步", "彼此知道對方最近正在追什麼"],
    high_school_role: ["first_high_school_task", "第一次期待高中球隊交付任務", "讓一項任務成為可描述的價值"],
    high_school_long_bench: ["bench_open_task", "第一次注意替補名單仍有空著的用途", "下一次有限打席或後段守備"],
    high_school_year_two_roster_reset: ["year_two_role_reset", "第一次看見高中順位重新洗牌", "讓原有角色通過春季與秋季兩次驗證"],
    high_school_year_two_senior_plan: ["senior_year_investment", "第一次把高三前的訓練押在明確方向", "高三第一張完整訓練表"],
    critical_scout_interview: ["first_formal_invitation", "第一次收到帶有條件的正式詢問", "把一項工具換成畢業後入口"],
    transition_checkpoint: ["new_locker_name", "第一次看見新置物櫃仍空著名字", "讓新環境決定怎麼使用自己"],
    development_opportunity: ["asked_to_try_again", "第一次有人問願不願意用另一種方式再試一次", "讓新角色通過正式評估"]
  };
  if (moments[eventId]) {
    const [id, title, possibility] = moments[eventId];
    recordAspirationMoment({ id, title, possibility, fulfilled: ["youth_match_entry", "development_opportunity"].includes(eventId), status: ["junior_friend_exit", "high_school_long_bench"].includes(eventId) ? "redirected" : "active" });
  }
  if (eventId === "starter_selection_result") setNextAspiration("把一次被看見的機會變成球隊能反覆使用的任務。", { status: player.startingCompetition.result === "win" ? "fulfilled" : "redirected", worldResponse: memory, nextPossibility: "三天後的新守位測試", sourceEventId: eventId });
  if (eventId === "junior_pain" || eventId === "critical_injury") setNextAspiration("找出不依賴原本負荷的棒球方式。", { status: "redirected", worldResponse: "身體限制改變了可以採取的動作，也讓節奏、配球與準備變成新的研究對象。", nextPossibility: "復健師安排的第一次調整後測試", sourceEventId: eventId });
  if (eventId === "junior_friend_exit") setNextAspiration(getCurrentAspiration().current, { status: "redirected", worldResponse: "阿哲開始追求自己的課業、紀錄或球場外角色；你們仍會交換下一步。", nextPossibility: "阿哲答應來看的下一場比賽", sourceEventId: eventId });
  if (eventId === "high_school_long_bench") setNextAspiration("找出替補名單裡還沒有人固定承擔的任務。", { status: "redirected", worldResponse: "先發沒有成真，但代跑、外野後段與守備指揮仍沒有固定人選。", nextPossibility: "下一次有限打席與後段守備名單", sourceEventId: eventId });
  if (eventId === "development_competition") setNextAspiration("把過去經驗轉成另一種可使用的角色。", { status: "redirected", worldResponse: "原有用途不再完全適配，第二守位、指揮、代打或準備工作開始有了空位。", nextPossibility: "下一回的角色調整提案", sourceEventId: eventId });
  if (eventId === "development_opportunity") setNextAspiration("讓新的使用方式在正式任務裡成立。", { status: "fulfilled", worldResponse: memory, nextPossibility: "市場重新評估新角色的那一天", sourceEventId: eventId });
}

function getAspirationEventText(eventId) {
  const texts = {
    starter_selection_result: "這次名單回答的是目前距離，不是你和高橋一生的勝負。下一個問題，是球隊願不願意把哪一種固定任務交給你。",
    junior_friend_exit: "阿哲談起最近想做的事：也許是課業，也許是紀錄比賽。離開球員名單不是停在原地；你們約好，下次見面要交換彼此最近正在追什麼。",
    junior_pain: "疼痛讓原本的動作暫時停下，也讓你第一次開始注意節奏、準備和如何用較少負荷完成同一個任務。",
    high_school_long_bench: "背號沒有被念到，但你開始記錄教練何時使用代跑、後段守備與臨時補位。名單之外仍有幾項工作沒有固定人選。",
    critical_injury: "檢查結果改變了原本的出口，沒有替所有出口關門。復健師在表格最下面寫下第一次調整後測試的日期。",
    development_competition: "球隊對你的期待正在改變。過去的守備經驗可以移向第二守位、補位指揮；打擊經驗也可能改成代打、選球或推進跑者。",
    development_opportunity: "這不是悲壯的重生。只是有人把一個不同的任務放到你面前，問你願不願意照新的方式再試一次。",
    transition_checkpoint: "新環境沒有要求你回到以前。它正在觀察：哪一種任務，會讓置物櫃上的名字真正留下來。"
  };
  return texts[eventId] || "";
}

function auditNarrativeTone() {
  const negativePattern = /失敗|淘汰|失去|放棄|絕望|最後機會|重新證明|徹底|沒有未來|被需要|重生/g;
  const terminalPattern = /夢想破滅|沒有未來|一切結束|只能放棄|徹底失去|注定失敗/g;
  const sloganPattern = /只要努力|永不放棄|相信自己|奇蹟一定|熱血到底/g;
  const chapters = Object.entries(chapterAspirationGuide).map(([chapter, guide]) => {
    const resultEntry = Object.entries(chapterResultHopeHooks).find(([eventId]) => getEmotionChapter(eventId) === chapter);
    const hook = resultEntry?.[1]?.text || guide.next;
    const relatedText = chapter === "發展期" ? Object.values(getAspirationEventTextMap()).join(" ") : "";
    const sample = [guide.current, guide.reason, guide.next, hook, relatedText].join(" ");
    return {
      chapter,
      pursuit: guide.current,
      hopeHook: hook,
      negativePhrases: sample.match(negativePattern)?.length || 0,
      terminalPhrases: sample.match(terminalPattern)?.length || 0,
      sloganPhrases: sample.match(sloganPattern)?.length || 0,
      hasConcreteExpectation: /明天|下週|下一場|三天後|下個月|報到日|隊內賽|畢業|置物櫃|任務|測試|守位|球場|入口|角色|開始/.test(hook),
      nextEntranceCount: /入口|名單|任務|測試|守位|球場|置物櫃|比賽|開始/.test(hook) ? 1 : 0,
      onlyLossWithoutPossibility: Boolean(sample.match(terminalPattern)) && !/下一|入口|任務|測試|可能|開始/.test(sample),
      needsManualReview: !guide.current || !hook || Boolean(sample.match(terminalPattern)) || Boolean(sample.match(sloganPattern))
    };
  });
  return {
    guide: narrativeToneGuide,
    chapters,
    negativeTotal: chapters.reduce((sum, item) => sum + item.negativePhrases, 0),
    terminalTotal: chapters.reduce((sum, item) => sum + item.terminalPhrases, 0),
    sloganTotal: chapters.reduce((sum, item) => sum + item.sloganPhrases, 0),
    missingConcreteExpectation: chapters.filter(item => !item.hasConcreteExpectation).map(item => item.chapter),
    manualReview: chapters.filter(item => item.needsManualReview).map(item => item.chapter)
  };
}

function getAspirationEventTextMap() {
  return {
    longBench: getAspirationEventText("high_school_long_bench"), injury: getAspirationEventText("critical_injury"),
    roleChange: getAspirationEventText("development_competition"), newOpportunity: getAspirationEventText("development_opportunity")
  };
}

const adultNarrativeChains = {
  draft: {
    id: "professional_limited_role", title: "下一次名單上的用途", question: "進入新組織後，你能讓哪一項工具先換到第一次正式任務？",
    events: ["transition_draft_day", "transition_rookie_camp", "transition_pro_roster_window", "transition_relationship", "transition_cost_check"],
    tensions: ["報到後四次行動會決定第一次測試角色", "第一次證明將決定你被放在哪一組", "相鄰置物櫃的新人成為下一個比較對象", "名單調整前還有一次把新用途帶進比賽的機會", "球隊將公布下一個角色與任務"]
  },
  college: {
    id: "college_recompetition", title: "大學裡第一個可用角色", question: "課業與健康並行時，你想用哪一次主力機會重新進入球探視野？",
    events: ["transition_college_arrival", "transition_college_balance", "transition_college_eligibility", "transition_relationship", "transition_cost_check"],
    tensions: ["重新分組前有四次行動可以調整方向", "課業與健康將開始影響輪替順位", "下一次主力機會會檢查你的負荷", "調整後還有一次重新進入視野的機會", "球探將說明繼續追蹤需要看見的條件"]
  },
  amateur: {
    id: "amateur_double_life", title: "工作之外保留下來的棒球", question: "工作與訓練並行時，你想為哪一次晚成測試保留時間？",
    events: ["transition_amateur_job", "transition_amateur_test", "transition_amateur_company_conflict", "transition_relationship", "transition_cost_check"],
    tensions: ["測試前有四次行動可以調整生活與訓練", "工作排班將開始影響球隊任務", "球隊交付了任務，生活也提出新的安排問題", "晚成測試前還有一次具體準備", "你將決定要為哪一種棒球生活保留時間"]
  },
  rehab: {
    id: "rehab_new_identity", title: "調整後第一次參與比賽", question: "改變打法後，你想用哪一項新工具重新加入正式比賽？",
    events: ["transition_rehab_plateau", "transition_rehab_identity", "transition_rehab_reentry_deadline", "transition_relationship", "transition_cost_check"],
    tensions: ["第一次調整後測試前有四次準備", "下一次測試將比較新舊打法的負荷", "新的任務表上仍有一個可嘗試的位置", "還有一次把新角色帶進正式任務的機會", "組織將說明下一階段願意提供的參與方式"]
  }
};

const transitionRouteDecisionEvents = [
  "transition_pro_roster_window",
  "transition_college_eligibility",
  "transition_amateur_company_conflict",
  "transition_rehab_reentry_deadline"
];

function getDevelopmentNarrativeEventIds() {
  if (
    typeof CareerSpineContract !== "object" ||
    typeof CareerSpineContract.getCareerNetwork !== "function"
  ) return [];
  try {
    const eventIds = CareerSpineContract.getCareerNetwork()?.sharedDevelopment?.eventIds;
    return Array.isArray(eventIds) ? eventIds.slice() : [];
  } catch (_error) {
    return [];
  }
}

function getAdultRouteKey() {
  if (player.chapter === "生涯轉換期") {
    if (
      typeof CareerTransitionRuntimeResolver !== "object" ||
      typeof CareerTransitionRuntimeResolver.resolveTransitionRuntime !== "function"
    ) return null;
    const runtimeResult = CareerTransitionRuntimeResolver.resolveTransitionRuntime(player);
    return runtimeResult.resolved ? runtimeResult.routeKey : null;
  }
  if (player.chapter === "發展期") {
    if (
      typeof CareerDevelopmentRuntimeResolver !== "object" ||
      typeof CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime !== "function"
    ) return null;
    const runtimeResult = CareerDevelopmentRuntimeResolver.resolveDevelopmentRuntime(player);
    return runtimeResult.resolved ? runtimeResult.routeKey : null;
  }
  const exit = String(player.careerExit || "");
  if (exit.includes("大學")) return "college";
  if (exit.includes("業餘") || exit.includes("社會")) return "amateur";
  if (exit.includes("復健") || exit.includes("傷")) return "rehab";
  return "draft";
}

function startNarrativeThread(config = {}) {
  player.narrativeThread = Object.assign({}, createInitialPlayer().narrativeThread, {
    id: config.id || "", title: config.title || "", question: config.question || config.coreQuestion || "", coreQuestion: config.coreQuestion || config.question || "",
    currentBeat: 0, totalBeats: Number(config.totalBeats) || config.events?.length || 0, previousEventId: "", previousOutcome: "",
    lastOutcome: "", activeTension: config.tensions?.[0] || "", nextTension: config.tensions?.[0] || "", nextPossibility: config.nextPossibility || config.tensions?.[0] || "",
    supportingNpc: config.supportingNpc || ({ draft: "二軍教練", college: "大學總教練", amateur: "社會人隊長", rehab: "復健師" })[config.route || getAdultRouteKey()] || "",
    status: "active", route: config.route || getAdultRouteKey(), history: []
  });
  return player.narrativeThread;
}

function redirectNarrativeThread(config = {}) {
  const previous = player.narrativeThread || {};
  const thread = startNarrativeThread(config);
  thread.status = "redirected";
  thread.previousOutcome = config.previousOutcome || previous.lastOutcome || previous.previousOutcome || "";
  return thread;
}

function ensureNarrativeThreadForEvent(eventId) {
  const routeKey = getAdultRouteKey();
  const developmentEventIds = getDevelopmentNarrativeEventIds();
  if (!player.narrativeThread?.id && adultNarrativeChains[routeKey]?.events.includes(eventId)) startNarrativeThread({ ...adultNarrativeChains[routeKey], route: routeKey });
  if ((!player.narrativeThread?.id || !player.narrativeThread.id.includes("role_revaluation")) && (developmentEventIds.includes(eventId) || eventId === "development_result")) {
    startNarrativeThread({
      id: `${routeKey}_role_revaluation`, route: routeKey,
      title: routeKey === "rehab" ? "調整後第一次參與比賽" : "下一種用途開始有形狀",
      question: routeKey === "draft" ? "名單調整前，哪一項工具能成為固定任務？" : routeKey === "college" ? "調整節奏後，哪一次表現能重新進入球探視野？" : routeKey === "amateur" ? "工作與棒球並行時，哪一種參與方式可以持續？" : "改變打法後，哪一項新任務能帶你回到正式比賽？",
      totalBeats: developmentEventIds.length, tensions: ["下一種用途即將進入正式比較"]
    });
  }
}

function advanceNarrativeThread(eventId, choice = {}) {
  const thread = player.narrativeThread;
  if (!thread?.id) return false;
  const routeConfig = adultNarrativeChains[thread.route];
  const developmentEventIds = getDevelopmentNarrativeEventIds();
  const isDevelopmentEvent = developmentEventIds.includes(eventId);
  const events = isDevelopmentEvent ? developmentEventIds : routeConfig?.events || [];
  const index = events.indexOf(eventId);
  if (index < 0) return false;
  const outcome = choice.memory || choice.text || "你完成了這一幕，代價仍會跟到下一次機會。";
  thread.previousEventId = eventId;
  thread.previousOutcome = outcome;
  thread.currentBeat = Math.max(thread.currentBeat, index + 1);
  thread.lastOutcome = outcome;
  thread.nextTension = isDevelopmentEvent
    ? ["原本的角色即將被重新比較", "下一回合必須面對角色失效", "有人會指出你真正缺少的用途", "身體與角色只能優先處理一項", "下一次機會將決定能否重新被需要", "市場會重新計算你的用途", "你必須決定留下方式"][Math.min(index + 1, 6)]
    : routeConfig.tensions[Math.min(index + 1, routeConfig.tensions.length - 1)];
  thread.activeTension = thread.nextTension;
  thread.nextPossibility = getNarrativeBridge(eventId, "out").replace(/^本幕之後：/, "") || thread.nextTension;
  thread.status = thread.currentBeat >= thread.totalBeats ? "resolved" : "active";
  thread.history.push({ eventId, outcome, beat: thread.currentBeat, nextPossibility: thread.nextPossibility });
  thread.history = thread.history.slice(-12);
  return true;
}

function resolveNarrativeThread(outcome = "") {
  if (!player.narrativeThread?.id) return false;
  player.narrativeThread.lastOutcome = outcome || player.narrativeThread.lastOutcome;
  player.narrativeThread.currentBeat = player.narrativeThread.totalBeats;
  player.narrativeThread.nextTension = "這條主軸已得到結果，但結果會進入下一階段。";
  player.narrativeThread.activeTension = "";
  player.narrativeThread.nextPossibility = player.aspirationState?.nextPossibility || "下一段生活會回收這個結果。";
  player.narrativeThread.status = "resolved";
  return true;
}

function getNarrativeBridgeIn(eventId) { return getNarrativeBridge(eventId, "in"); }
function getNarrativeBridgeOut(eventId) { return getNarrativeBridge(eventId, "out"); }
function getNarrativeThreadSummary() {
  const thread = player.narrativeThread || {};
  if (!thread.id) return "目前沒有進行中的敘事主軸。";
  return `${thread.title}｜${thread.currentBeat}/${thread.totalBeats}\n上一回：${thread.previousOutcome || "尚未發生"}\n正在處理：${thread.activeTension || thread.coreQuestion}\n接下來：${thread.nextPossibility || thread.nextTension}`;
}

function createContinuityOutcome(eventId, choice = {}) {
  const isAdultEvent = Object.values(adultNarrativeChains).some(chain => chain.events.includes(eventId)) || getDevelopmentNarrativeEventIds().includes(eventId);
  if (!isAdultEvent) return null;
  const nextEffect = getNarrativeBridge(eventId, "out").replace(/^本幕之後：/, "") || player.narrativeThread?.nextTension || "下一幕會回收這次選擇。";
  return { id: `${eventId}_${player.narrativeThread?.currentBeat || 0}_${player.continuityOutcomes.length}`, eventId, summary: choice.memory || choice.text || "這一幕留下了具體結果。", nextEffect, routeTag: player.narrativeThread?.route || getAdultRouteKey() };
}

function recordContinuityOutcome(outcome) {
  if (!outcome?.id) return false;
  if (player.continuityOutcomes.some(item => item.id === outcome.id)) return false;
  player.continuityOutcomes.push({ ...outcome, age: player.age, chapter: player.chapter });
  player.continuityOutcomes = player.continuityOutcomes.slice(-30);
  return true;
}

function getPreviousContinuityOutcome(routeTag = "") {
  return [...(player.continuityOutcomes || [])].reverse().find(item => !routeTag || item.routeTag === routeTag) || null;
}

function hasContinuityOutcome(id) { return player.continuityOutcomes.some(item => item.id === id || item.id.startsWith(`${id}_`)); }

function getJointRelationshipScene() {
  const azheHigh = player.impression.azhe.trusts >= 5 && player.impression.azhe.feelsDistance < 5;
  const takaHigh = player.impression.takahashi.respect >= 5;
  const coachHigh = player.impression.coach.dependable >= 5 && player.relationships.coachTrust >= 6;
  const usableNow = Math.max(player.baseballSkills.batting || 0, player.baseballSkills.catching || 0, player.baseballSkills.baseballIQ || 0, player.baseballSkills.control || 0) >= 7 && player.body.injuryRisk <= 8;
  const parts = [];
  parts.push(azheHigh ? "阿哲真的到了。他帶來自己在工作、生活與地方棒球之間排出的行事曆，沒有安慰，也沒有替你決定，只問：『你下一段真正想保留的是哪一部分？』" : "阿哲的位置是空的。你只從舊球上的暗號，猜到他可能聽說了近況；疏遠讓另一種人生的答案沒有親自抵達。" );
  parts.push(takaHigh ? "高橋帶來對手的測試紀錄，直接圈出你已經無法在更高層級成立的那一項能力。" : "高橋沒有提供情報；競爭名單上只留下他的名字。" );
  parts.push(coachHigh && usableNow ? "山本導師把一張聯絡人的名片壓在手套下，但說明這只是一個入口，不是名單保證。" : coachHigh ? "山本導師到了，卻把名片留在口袋裡。關係讓他願意說實話，不能讓他替目前尚未成立的條件背書。" : "山本導師到場，卻沒有拿出推薦信。他不願用過去的信任掩蓋現在的條件。" );
  return `【十年關係的兌現】\n${parts.join("\n\n")}`;
}

function getNarrativeBridge(eventId, direction = "in") {
  const event = getEvent(eventId);
  if (event && typeof event[direction === "in" ? "bridgeIn" : "bridgeOut"] === "function") return event[direction === "in" ? "bridgeIn" : "bridgeOut"]();
  const thread = player.narrativeThread;
  if (!thread?.id) return "";
  if (eventId === "development_result") return direction === "in"
    ? `最後一幕留下的結果是：${thread.lastOutcome || "你已經做完最後一次去留選擇"}。現在必須把這段處境寫成生涯結果。`
    : "這條主軸會進入人生總結，連同曾幫助你或缺席的人一起被記住。";
  const routeEvents = adultNarrativeChains[thread.route]?.events || [];
  const developmentEventIds = getDevelopmentNarrativeEventIds();
  if (!routeEvents.includes(eventId) && !developmentEventIds.includes(eventId)) return "";
  if (direction === "in") {
    if (eventId === "transition_relationship") return `${thread.lastOutcome ? `上一幕的結果仍在：${thread.lastOutcome}` : thread.question}\n\n${getJointRelationshipScene()}`;
    if (thread.lastOutcome) return `承接上一幕：${thread.lastOutcome}\n這一幕仍在往前追問：${thread.question}`;
    return `這段故事正在追問：${thread.question}`;
  }
  const developmentIndex = developmentEventIds.indexOf(eventId);
  const routeIndex = routeEvents.indexOf(eventId);
  const developmentTensions = ["下一種用途即將進入正式比較", "下一回合會看見原角色之外的任務", "有人會指出最值得帶往下一層級的工具", "身體與角色調整需要先選一項開始", "下一次機會可以把新用途帶進比賽", "市場會重新看見你的用途", "你將決定下一段想用什麼方式參與"];
  const next = developmentIndex >= 0
    ? developmentTensions[Math.min(developmentIndex + 1, developmentTensions.length - 1)]
    : routeIndex >= 0 ? adultNarrativeChains[thread.route].tensions[Math.min(routeIndex + 1, adultNarrativeChains[thread.route].tensions.length - 1)] : thread.nextTension;
  return `本幕之後：${next || "下一次選擇會回收這一幕的結果。"}`;
}

function recordRelationshipPayoff(data = {}) {
  if (!data.id || player.relationshipPayoffs.some(item => item.id === data.id)) return false;
  player.relationshipPayoffs.push({
    id: data.id, npc: data.npc || "", type: data.type || "information", title: data.title || data.id,
    source: data.source || data.sourceState || "長期累積的關係", sourceState: data.sourceState || data.source || "長期累積的關係", resolved: data.resolved !== false,
    effect: data.effect || data.impact || "", impact: data.impact || data.effect || "", changesOption: Boolean(data.changesOption), changesOpportunity: Boolean(data.changesOpportunity),
    absence: Boolean(data.absence), age: player.age, chapter: player.chapter, announced: false
  });
  return true;
}

function hasRelationshipPayoff(id) {
  return player.relationshipPayoffs.some(item => item.id === id && item.resolved);
}

function getRelationshipPayoffCount(npc) { return player.relationshipPayoffs.filter(item => item.npc === npc && item.resolved).length; }
function getAvailableRelationshipPayoffs(npc) { return player.relationshipPayoffs.filter(item => item.npc === npc && !item.resolved); }

function getRelationshipPayoffSummary(npc = "") {
  const items = player.relationshipPayoffs.filter(item => !npc || item.npc === npc).slice(-3);
  return items.length ? items.map(item => `${item.resolved ? "已兌現" : "未兌現"}｜${item.title}`).join("\n") : "關係仍在累積，尚未轉化成具體行動。";
}

function consumeRelationshipPayoffFeedback() {
  const items = player.relationshipPayoffs.filter(item => item.resolved && !item.announced);
  items.forEach(item => { item.announced = true; });
  return items.map(item => item.absence ? `這次沒有人替你打開入口：${item.title}` : `多年累積的關係產生了回應：${item.title}`);
}

function getRelationshipStatusText(npc) {
  if (npc === "azhe") {
    if (player.impression.azhe.feelsDistance >= 5) return "阿哲已不再主動出現在你的低谷，只能從舊物或別人口中得知近況。";
    if (player.impression.azhe.trusts >= 5) return "阿哲會分享自己正在追的生活，也願意陪你把下一種選擇說清楚，但不替你決定。";
    return "阿哲仍在尋找自己的方向；你們下一次談話可能第一次不只談棒球。";
  }
  if (npc === "takahashi") {
    if (player.impression.takahashi.underestimate >= 5) return "高橋不願替你的用途背書，也不再主動提供對手情報。";
    if (player.impression.takahashi.respect >= 5) return "高橋願意告訴你下一個層級真正比較什麼，並保留一次正面測試的邀請。";
    return "高橋仍把你放在競爭名單裡，尚未把自己的情報交給你。";
  }
  if (player.impression.coach.immature >= 5) return "山本導師不願為你的成熟度背書；他能指出問題，不能替現在的組織改變判斷。";
  if (player.impression.coach.dependable >= 5) return `山本導師願意提供一次有條件的介紹，也正在觀察你能否成為「${inferRoleIdentity()}」。`;
  return `山本導師還不準備推薦你，但已指出「${inferRoleIdentity()}」可能是下一個具體方向。`;
}

function processRelationshipPayoffs(eventId) {
  const skills = player.baseballSkills || {};
  const usableSkill = Math.max(skills.batting || 0, skills.catching || 0, skills.baseballIQ || 0, skills.control || 0) >= 7;
  const healthyEnough = player.body.injuryRisk <= 8;
  const azheHigh = player.impression.azhe.trusts >= 5 && player.impression.azhe.feelsDistance < 5;
  const takaHigh = player.impression.takahashi.respect >= 5 && player.impression.takahashi.underestimate < 5;
  const coachHigh = player.impression.coach.dependable >= 5 && player.relationships.coachTrust >= 6 && player.impression.coach.immature < 5;

  if (eventId === "development_competition" && azheHigh) {
    if (recordRelationshipPayoff({ id: "azhe_low_point_practice", npc: "azhe", type: "protection", title: "阿哲用自己的另一種生活，幫你看清真正想保留的東西", source: "你們曾一起追夢，後來走向不同生活", effect: "避免低谷只剩單一路線，並推進轉型準備" })) {
      player.burnout = Math.max(0, player.burnout - 2); player.pressure = Math.max(0, player.pressure - 1); addFlags(["azhe_rebirth_practice"]);
    }
  }
  if (eventId === "development_mentor" && azheHigh && ["respected_equal", "confided", "best_friend"].includes(player.characterArc.azhe)) recordRelationshipPayoff({ id: "azhe_equal_information", npc: "azhe", type: "information", title: "阿哲指出你一直避開的轉型問題", source: "平等而不代替決定的關係", effect: "解鎖轉型資訊" }) && addFlags(["azhe_transition_information"]);
  if (eventId === "transition_relationship" && azheHigh) recordRelationshipPayoff({ id: "azhe_reunion_used", npc: "azhe", type: "reunion", title: "阿哲在生涯低谷時親自出現", source: "多年累積的信任", effect: "低谷時有人陪伴" });
  if (["transition_college_balance", "transition_amateur_job"].includes(eventId) && azheHigh) recordRelationshipPayoff({ id: "azhe_life_perspective", npc: "azhe", type: "perspective", title: "阿哲分享自己如何讓工作、課業與棒球同時存在", source: "彼此交換球場外追求的平等關係", effect: "解鎖可持續生活選項", changesOption: true }) && addFlags(["azhe_sustainable_option"]);
  if (eventId === "transition_relationship" && !azheHigh) recordRelationshipPayoff({ id: "azhe_absent_at_turning_point", npc: "azhe", type: "absence", title: "阿哲的位置這次是空的", source: "長期疏遠或尚未形成足夠信任", effect: "無法取得陪伴練習與重新整理追求的選項", absence: true });

  if (eventId === "development_competition" && takaHigh) recordRelationshipPayoff({ id: "takahashi_hard_truth", npc: "takahashi", type: "information", title: "高橋指出原有能力已無法在更高層級成立", source: "多年競爭形成的真實評價", effect: "取得一條轉型方向" }) && addFlags(["takahashi_role_truth"]);
  if (eventId === "development_opportunity" && player.impression.takahashi.rivalry >= 5 && usableSkill) {
    if (recordRelationshipPayoff({ id: "takahashi_open_challenge", npc: "takahashi", type: "challenge", title: "高橋替你創造一次正面測試", source: "長期競爭", effect: "增加一次曝光，同時提高失敗代價" })) { player.exposure += 1; player.pressure = Math.min(20, player.pressure + 1); }
  }
  if (eventId === "development_market" && takaHigh && usableSkill && healthyEnough) {
    if (recordRelationshipPayoff({ id: "takahashi_market_backing", npc: "takahashi", type: "recommendation", title: "高橋向新組織具體說明你的場上用途", source: "同行者的市場背書", effect: "市場評價與球探追蹤提高" })) { player.scoutEvaluation += 1; player.reputation += 1; }
  }
  if (eventId === "transition_relationship" && takaHigh && usableSkill) recordRelationshipPayoff({ id: "takahashi_test_introduction", npc: "takahashi", type: "introduction", title: "高橋把一份具名測試邀請交給你", source: "高尊重加上已成立的場上工具", effect: "取得特定角色測試入口", changesOpportunity: true }) && addFlags(["takahashi_introduced_test"]);
  if (eventId === "transition_relationship" && !takaHigh) recordRelationshipPayoff({ id: "takahashi_withheld_information", npc: "takahashi", type: "absence", title: "高橋只留下測試標準，沒有提供方法與對手資料", source: "尊重不足或長期低估", effect: "仍可接受挑戰，但沒有內部情報", absence: true });

  if ((eventId === "transition_checkpoint" || transitionRouteDecisionEvents.includes(eventId)) && coachHigh && usableSkill && healthyEnough) {
    const profile = player.impression.coach.leader >= 3 ? { title: "山本導師以過去觀察提供一個組織任務面談入口", effect: "取得領導與工具角色面談，而非直接任務", reputation: 1 }
      : player.impression.coach.competitive >= 5 ? { title: "山本導師以過去競爭評價介紹一次高壓測試", effect: "取得測試入口並承擔更高失敗代價", exposure: 1, pressure: 1 }
        : { title: "山本導師以可靠評價提供一次有條件的介紹", effect: "取得穩定角色入口而非保證", scout: 1 };
    if (recordRelationshipPayoff({ id: "yamamoto_recommendation_used", npc: "yamamoto", type: "recommendation", title: profile.title, source: "多年累積的可靠、領導、競爭與成熟印象", effect: profile.effect })) {
      player.scoutEvaluation += profile.scout || 0; player.reputation += profile.reputation || 0; player.exposure += profile.exposure || 0; player.pressure = Math.min(20, player.pressure + (profile.pressure || 0));
    }
  }
  if ((eventId === "transition_checkpoint" || transitionRouteDecisionEvents.includes(eventId)) && coachHigh) {
    const namedRole = inferRoleIdentity();
    if (recordRelationshipPayoff({ id: "yamamoto_role_naming", npc: "yamamoto", type: "information", title: `山本導師替「${namedRole}」這個可能取了名字`, source: "多年觀察形成的角色判讀", effect: "新組織測試項目與下一個追求變得明確", changesOption: true })) {
      addFlags(["yamamoto_named_role"]); setNextAspiration(`讓「${namedRole}」在正式任務中成立。`, { nextPossibility: `下一次${namedRole}測試`, sourceEventId: eventId });
    }
  }
  if (eventId === "development_mentor" && coachHigh) {
    if (recordRelationshipPayoff({ id: "yamamoto_open_task", npc: "yamamoto", type: "opportunity", title: "山本導師幫你整理一份沒有標準答案的角色提案", source: "可靠與領導印象", effect: "解鎖向現任組織提出責任任務的機會；是否採用仍由現任組織決定", changesOption: true })) addFlags(["yamamoto_open_ended_task"]);
  }
  if (eventId === "development_opportunity" && coachHigh && usableSkill && healthyEnough) {
    if (recordRelationshipPayoff({ id: "yamamoto_second_chance", npc: "yamamoto", type: "second_chance", title: "山本導師介紹一個重新測試的聯絡窗口", source: "過去信任加上目前仍成立的場上用途", effect: "新增一次申請測試的入口，結果仍由現任組織決定" })) player.exposure += 1;
  } else if (eventId === "development_opportunity" && coachHigh && (!usableSkill || !healthyEnough)) {
    addFlags(["yamamoto_refused_unqualified_backing"]);
    recordRelationshipPayoff({ id: "yamamoto_refused_backing", npc: "yamamoto", type: "absence", title: "山本導師拒絕立即背書，並列出仍未成立的兩項條件", source: "關係足夠但能力或健康尚未符合", effect: "失去立即入口，保留有條件的重新測試", absence: true, changesOpportunity: true });
  }
}

function ensureRelationshipPayoffChoices(eventId, event) {
  if (!event?.choices) return;
  if (eventId === "development_mentor" && hasFlag("azhe_rebirth_practice") && !event.choices.some(choice => choice.payoffChoiceId === "azhe_equal_view")) event.choices.push({ payoffChoiceId: "azhe_equal_view", text: "請阿哲不要替你決定，只說他看見哪個問題", effects: { pressure: -1 }, flags: ["accepted_azhe_equal_view"], memory: "阿哲沒有給答案，只指出你一直用努力掩蓋角色已經失效。", personalityEffects: { thoughtful: 1 }, lifeThemeEffects: { trust: 1 } });
  if (eventId === "development_mentor" && hasFlag("takahashi_role_truth") && !event.choices.some(choice => choice.payoffChoiceId === "takahashi_report")) event.choices.push({ payoffChoiceId: "takahashi_report", text: "照高橋圈出的更高層級標準調整下一次測試", effects: { observe: 1, pressure: 1 }, flags: ["used_takahashi_report"], memory: "你沒有直接得到技能，而是得到下一次測試會真正比較的條件。", changesOpportunity: true });
  if (eventId === "development_mentor" && hasFlag("yamamoto_named_role") && !event.choices.some(choice => choice.payoffChoiceId === "yamamoto_named_trial")) event.choices.push({ payoffChoiceId: "yamamoto_named_trial", text: `以山本命名的「${inferRoleIdentity()}」申請特定角色測試`, effects: { responsibility: 1 }, flags: ["used_yamamoto_role_name"], memory: "你用一個世界聽得懂的角色名稱，申請下一次測試。", changesOpportunity: true });
}

const importantEventThemes = {
  transition_draft_day: { keywords: ["有限角色", "名單"], action: "接受、詢問或延後職業入口", next: "新人營角色測試" },
  transition_rookie_camp: { keywords: ["第一次有限任務", "角色測試"], action: "選擇多守位、主工具或打擊任務", next: "組織公布第一次有限用途" },
  transition_college_arrival: { keywords: ["重新競爭", "位置重置"], action: "重新定位大學角色", next: "課業與健康負荷" },
  transition_college_balance: { keywords: ["課業", "輪替任務"], action: "安排課業、身體與主力競爭", next: "有限主力或遠征任務" },
  transition_amateur_job: { keywords: ["工作", "訓練衝突"], action: "安排工作與球隊時間", next: "晚成測試" },
  transition_amateur_test: { keywords: ["球隊任務", "晚成觀察"], action: "呈現穩定、上限或完整用途", next: "職業觀察條件" },
  transition_rehab_plateau: { keywords: ["恢復停滯", "改變打法"], action: "延長復健、改打法或提前測試", next: "舊角色是否失效" },
  transition_rehab_identity: { keywords: ["新使用方式", "低負荷測試"], action: "維持復健、協助基層或暫離球場", next: "第一次調整後正式測試" },
  transition_pro_roster_window: { keywords: ["升降窗口", "名單用途"], action: "選擇工具人、主守位比較或健康限制", next: "核心人物如何回應職業名單壓力" },
  transition_college_eligibility: { keywords: ["參賽資格", "主力競爭"], action: "在學籍、曝光與發展時間間取捨", next: "核心人物如何回應大學窗口" },
  transition_amateur_company_conflict: { keywords: ["工作責任", "名單測試"], action: "協商、留在公司或直接參加測試", next: "核心人物如何看待雙重生活" },
  transition_rehab_reentry_deadline: { keywords: ["復健期限", "重返風險"], action: "限制測試、延後或全力測試", next: "核心人物如何回應重返期限" },
  transition_relationship: { keywords: ["關係兌現", "資源差異"], action: "接收陪伴、情報、入口或真實缺席", next: "最後一次條件確認" },
  transition_cost_check: { keywords: ["現實代價", "下一步"], action: "確認健康、生活與角色是否可持續", next: "十八歲轉換結果" },
  development_competition: { keywords: ["失去位置", "被重新評價"], action: "專精、擴張角色或要求測試", next: "誰願意提供轉型情報" },
  development_body_choice: { keywords: ["健康", "角色取捨"], action: "在硬撐、休息與轉守位間選擇", next: "下一次名單機會" },
  development_opportunity: { keywords: ["再次被需要", "轉型"], action: "用新角色接受實際任務", next: "市場是否承認新用途" },
  development_market: { keywords: ["市場", "用途"], action: "向外界呈現工具、上限或健康", next: "最後去留決定" },
  development_result: { keywords: ["生涯結果", "留下方式"], action: "回收角色、關係與市場結果", next: "人生總結" }
};

function auditTitleContentAlignment() {
  const developmentEventIds = getDevelopmentNarrativeEventIds();
  return Object.entries(importantEventThemes).map(([eventId, meta]) => {
    const event = getEvent(eventId);
    const choices = event?.choices || [];
    const belongsToChain = eventId === "development_result" || developmentEventIds.includes(eventId) || Object.values(adultNarrativeChains).some(chain => chain.events.includes(eventId));
    return {
      eventId, title: event?.title || "缺少事件", expectedTheme: meta.keywords.join("／"),
      themeIntent: { coreConflict: meta.keywords.join("／"), concreteAction: meta.action, expectedChange: `產生「${meta.next}」的條件`, nextQuestion: meta.next },
      mainAction: meta.action, changesState: eventId.endsWith("_result") || choices.some(choice => Object.keys(choice).some(key => key.endsWith("Effects") || ["effects", "flags"].includes(key))),
      hasBridgeIn: belongsToChain || Boolean(getNarrativeBridge(eventId, "in")), hasNextTension: Boolean(meta.next || getNarrativeBridge(eventId, "out")),
      nextQuestion: meta.next, manualReview: !event || !meta.action || !meta.next
    };
  });
}

function auditNarrativeContinuity() {
  return Object.entries(adultNarrativeChains).map(([route, chain]) => {
    const breaks = [];
    const rows = chain.events.map((eventId, index) => {
      const hasPrior = index === 0 || Boolean(chain.events[index - 1]);
      const bridgeIn = index === 0 ? chain.question : `承接「${chain.tensions[index - 1]}」`;
      const bridgeOut = chain.tensions[index] || chain.tensions.at(-1);
      const event = getEvent(eventId);
      const changesStory = Boolean(event?.choices?.length) && chain.tensions[index] !== chain.tensions[index + 1];
      if (!event || !hasPrior || !bridgeOut || !changesStory) breaks.push(eventId);
      return { eventId, previousEventId: chain.events[index - 1] || "", previousOutcomeReferenced: hasPrior, bridgeIn, bridgeOut, repeatedIntroduction: index > 0 && /重新介紹|名單邊緣球員/.test(bridgeIn), missingForeshadowing: !bridgeOut, changesStoryState: changesStory };
    });
    return { route, chain: chain.title, length: rows.length, breaks, rows, continuityRate: Math.round(rows.filter(item => item.previousOutcomeReferenced && item.bridgeOut && item.changesStoryState).length / rows.length * 100) };
  });
}

function auditRelationshipPayoffs() {
  const thresholds = {
    azhe: `信任 ${player.impression.azhe.trusts}／距離 ${player.impression.azhe.feelsDistance}`,
    takahashi: `尊重 ${player.impression.takahashi.respect}／低估 ${player.impression.takahashi.underestimate}`,
    yamamoto: `可靠 ${player.impression.coach.dependable}／不成熟 ${player.impression.coach.immature}`
  };
  return ["azhe", "takahashi", "yamamoto"].map(npc => {
    const items = player.relationshipPayoffs.filter(item => item.npc === npc);
    return {
      npc, relationshipEvents: items.length, impressionThreshold: thresholds[npc], available: getAvailableRelationshipPayoffs(npc).length,
      resolved: items.filter(item => item.resolved).length, types: [...new Set(items.map(item => item.type))],
      textOnly: items.filter(item => !item.changesOption && !item.changesOpportunity && !item.absence).length,
      changesOptions: items.filter(item => item.changesOption).length,
      changesOpportunities: items.filter(item => item.changesOpportunity || ["opportunity", "recommendation", "introduction", "second_chance", "challenge"].includes(item.type)).length,
      absences: items.filter(item => item.absence || item.type === "absence").length
    };
  });
}

function applyFinanceEffects(effects = {}) {
  Object.entries(effects).forEach(([key, value]) => {
    player[key] = Math.max(0, Math.min(20, (Number(player[key]) || 0) + value));
  });
}

function advanceAfterAction(decisionContext = null, completedEventId = null) {
  if (player.chapter === "發展期") {
    const progressionResult = CareerDevelopmentProgression.advanceDevelopment(
      player,
      completedEventId
    );
    if (!progressionResult.advanced) return progressionResult;
    if (progressionResult.settlementRequired) evaluateDevelopmentYears();
    return progressionResult;
  }
  if (player.chapter === "生涯轉換期") {
    const progressionResult = CareerTransitionProgression.advanceTransition(
      player,
      completedEventId
    );
    if (!progressionResult.advanced) return progressionResult;
    if (progressionResult.settlementRequired) evaluateCareerTransition();
    return progressionResult;
  }
  if (player.chapter === "青棒關鍵年") {
    player.criticalYearStep += 1;
    if (player.criticalYearStep >= 8) evaluateCriticalYear();
    return;
  }
  if (player.chapter === "青棒第二年") {
    player.highSchoolYearTwoStep += 1;
    if (player.highSchoolYearTwoStep >= 8) evaluateHighSchoolYearTwo();
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
    const nextChapter2Step = (Number(player.chapter2Step) || 0) + 1;
    if (
      decisionContext?.eventId === "chapter2_intro" &&
      decisionContext.choiceIndex === 0
    ) {
      const decisionResult = DecisionFlow.createDecisionResult(
        decisionContext,
        { chapter2Step: nextChapter2Step }
      );
      if (!decisionResult.ok) throw new Error(decisionResult.error);
      const stateChangeResult = DecisionFlow.applyDecisionStateChange(
        decisionResult.decisionResult
      );
      if (!stateChangeResult.ok) throw new Error(stateChangeResult.error);
    }
    else {
      player.chapter2Step = nextChapter2Step;
    }
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

function evaluateHighSchoolYearTwo() {
  if (player.chapter !== "青棒第二年" || player.highSchoolYearTwoStep < 8) return false;

  if (hasFlag("year_two_plan_utility")) player.highSchoolTeamRole = "多位置輪替與比賽中段調度";
  else if (hasFlag("year_two_plan_position")) player.highSchoolTeamRole = `${player.seasonPosition || "主守位"}專職競爭者`;
  else if (hasFlag("year_two_plan_batting")) player.highSchoolTeamRole = "打擊入口與守備替補";
  else if (hasFlag("year_two_plan_health")) player.highSchoolTeamRole = "健康重整中的有限任務球員";

  const establishedRoleProof = (
    hasFlag("year_two_role_primary_proof") &&
    hasFlag("year_two_spring_push") &&
    hasFlag("year_two_autumn_secure_out") &&
    hasFlag("year_two_plan_position")
  ) || (
    hasFlag("year_two_role_utility_proof") &&
    hasFlag("year_two_spring_bunt_read") &&
    hasFlag("year_two_autumn_utility_hold") &&
    hasFlag("year_two_plan_utility")
  ) || (
    hasFlag("year_two_role_bat_proof") &&
    hasFlag("year_two_spring_first_pitch") &&
    hasFlag("year_two_autumn_run_creation") &&
    hasFlag("year_two_plan_batting")
  );

  if (player.body.injuryRisk >= 8 || player.body.pain >= 5) {
    player.highSchoolYearTwoResult = "角色仍在，身體負荷先成為高三問題";
    player.highSchoolYearTwoDetail = "你完成春秋兩段賽事，卻無法再把所有訓練與出賽視為免費成本。高三的第一項工作是確認能穩定完成多少任務。";
  } else if (establishedRoleProof) {
    player.highSchoolYearTwoResult = "你的球隊用途通過了一整年的第二次驗證";
    player.highSchoolYearTwoDetail = `春季的表現沒有停在單場。秋季盃賽再次證明「${player.highSchoolTeamRole || "目前角色"}」能在不同局面被使用，高三將要求它換成更明確的生涯價值。`;
  } else if (player.relationships.coachTrust >= 8) {
    player.highSchoolYearTwoResult = "教練願意繼續交付任務，但場上證明仍不完整";
    player.highSchoolYearTwoDetail = "可靠讓你保留在輪替裡，卻不能代替春秋兩段比賽都留下結果。高三前仍需要一次能被名單與紀錄共同確認的表現。";
  } else {
    player.highSchoolYearTwoResult = "高二結束時，角色仍在重新排列";
    player.highSchoolYearTwoDetail = "你沒有失去球隊位置，也還沒有把高一的用途固定成全年角色。最後一年必須在主守位、工具性、打擊或健康中押下一個可交付方向。";
  }

  player.chapter = "青棒第二年小結";
  return true;
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
  const marketScore = player.scoutEvaluation + player.recentPerformance + player.reputation + Math.floor(player.exposure / 2) + Math.max(getPositionCareerValue(), getOffensiveCareerValue()) - player.body.injuryRisk;
  if (
    typeof CareerAge22OutcomeResolver !== "object" ||
    typeof CareerAge22OutcomeResolver.resolve !== "function"
  ) return false;

  const outcome = CareerAge22OutcomeResolver.resolve({
    careerExit: player.careerExit,
    marketScore,
    injuryRisk: player.body.injuryRisk
  });
  if (!outcome || outcome.resolved !== true) return false;

  player.age = 22;
  player.age22OutcomeCode = outcome.outcomeCode;
  player.marketOutcome = outcome.marketOutcome;
  player.developmentResult = outcome.developmentResult;
  player.developmentDetail = outcome.developmentDetail;
  evaluateMarket();
  updateCareerValue();
  player.chapter = "二十二歲職涯小結";
  return true;
}

function showCurrentEvent() {
  pendingYouthSeasonOutcome = null;
  const eventId = getCurrentEventId();
  if (pendingBaseballGameplay && pendingBaseballGameplay.eventId !== eventId) {
    clearPendingBaseballGameplay();
  }
  isTransitioning = false;
  setChoiceTransitionState(false);
  showStory(eventId);
}

function getCompetitionPresentationContext(eventId) {
  const match = player.matchState || {};
  return {
    matchState: {
      inning: match.inning,
      half: match.half,
      outs: match.outs,
      runners: Array.isArray(match.runners) ? match.runners.slice(0, 3) : [],
      awayScore: match.awayScore,
      homeScore: match.homeScore
    },
    abilities: {
      pressure: player.pressure,
      observe: player.observe,
      baseballIQ: player.baseballSkills?.baseballIQ
    },
    seasonPosition: player.seasonPosition,
    seasonPerformance: player.seasonPerformance,
    seasonErrors: player.seasonErrors,
    previousPlayTransition: eventId === "youth_match_mistake" && typeof getYouthPreviousPlayEcho === "function"
      ? getYouthPreviousPlayEcho().summary
      : ""
  };
}

function getSceneContext(eventId, event) {
  let chapterLabel = typeof player.chapter === "string" ? player.chapter : "";
  let timeLabel = typeof getTimeLabel === "function" ? getTimeLabel() : "";
  let sceneLabel = typeof event?.scene === "string" && event.scene.trim()
    ? event.scene
    : "";
  let competitionModel = null;

  if (
    typeof CompetitionPresentation === "object" &&
    typeof CompetitionPresentation.createPresentation === "function"
  ) {
    competitionModel = CompetitionPresentation.createPresentation(
      eventId,
      getCompetitionPresentationContext(eventId)
    );
  }

  if (competitionModel) {
    chapterLabel = competitionModel.competitionTitle || chapterLabel;
    if (
      competitionModel.showScore &&
      competitionModel.matchState?.inning > 0
    ) {
      timeLabel = `${competitionModel.matchState.inning} 局${competitionModel.matchState.half || ""}`;
    }
    if (!sceneLabel) {
      sceneLabel = competitionModel.stageLabel || competitionModel.type?.label || "";
    }
  }

  return Object.freeze({
    chapterLabel,
    timeLabel,
    sceneLabel,
    isCompetition: Boolean(competitionModel)
  });
}

function renderSceneContext(context) {
  if (!context || typeof context !== "object") return "";
  const items = [
    ["chapter", "章節／階段", context.chapterLabel],
    ["time", "時間", context.timeLabel],
    ["location", "場景", context.sceneLabel]
  ].filter(([, , value]) => typeof value === "string" && value.trim());

  if (!items.length) return "";

  const content = items.map(([type, label, value]) => `
    <div class="scene-context__item scene-context__${type}">
      <small class="scene-context__label">${escapeHtml(label)}</small>
      <span class="scene-context__value">${escapeHtml(value)}</span>
    </div>`).join("");

  return `<section class="scene-context chapter-one-scene-context" aria-labelledby="sceneContextTitle">
    <h2 id="sceneContextTitle" class="visually-hidden">場景資訊</h2>${content}
  </section>`;
}

function showStory(eventId) {
  ensureIncrementalSystems();
  queueAzheAdultRecordEcho(eventId);
  queueTakahashiAdultRestartEcho(eventId);
  if (player.forcedEventId) eventId = player.forcedEventId;
  ensureChapterAspiration(eventId);
  const event = getEvent(eventId);
  if (!event) {
    document.getElementById("story").innerHTML = "<article class='event-card' aria-labelledby='currentEventTitle'><h2 id='currentEventTitle' tabindex='-1'>找不到下一個事件</h2><p>請讀取存檔或重新開始。</p></article>";
    document.getElementById("choices").innerHTML = "";
    updateStatus();
    focusCurrentEventHeading();
    return;
  }
  ensureRelationshipPayoffChoices(eventId, event);
  ensureNarrativeThreadForEvent(eventId);
  prepareMatchStateForEvent(eventId);
  updateGoals(eventId);
  refreshStartingCompetition();
  const currentStateResult = CurrentStateBoundary.applyStateChangeRequest({
    source: "showStory",
    changes: { lastEventTitle: event.title }
  });
  if (!currentStateResult.ok) {
    throw new Error(currentStateResult.error);
  }
  let text = typeof event.text === "function" ? event.text() : event.text;
  const bridgeIn = getNarrativeBridge(eventId, "in");
  const bridgeOut = getNarrativeBridge(eventId, "out");
  const chapterEnding = generateChapterEndingScene(eventId);
  const replayEcho = eventId === "day1_morning" ? getReplayMemoryEcho() : "";
  const signatureScene = getSignatureSceneText(eventId);
  const revisitScene = getRevisitSceneText(eventId);
  const aspirationText = getAspirationEventText(eventId);
  if (signatureScene) text += `\n\n${signatureScene}`;
  if (revisitScene) text += `\n\n【往日回聲】\n${revisitScene}`;
  if (aspirationText) text += `\n\n【看見的新可能】\n${aspirationText}`;
  if (chapterEnding) text += `\n\n${chapterEnding}`;
  if (replayEcho) text += `\n\n${replayEcho}`;
  const sceneContextHtml = renderSceneContext(getSceneContext(eventId, event));
  const competitionFrame = renderCompetitionPresentation(eventId);
  const bridgeInHtml = bridgeIn ? `<div class="story-bridge-in"><small>承接上一回</small>${escapeHtml(bridgeIn)}</div>` : "";
  const bridgeOutHtml = bridgeOut ? `<div class="story-bridge-out"><small>接下來</small>${escapeHtml(bridgeOut)}</div>` : "";
  if (eventId === "youth_match_grounder") {
    renderIntegratedYouthGrounder(event, { text, sceneContextHtml, competitionFrame, bridgeInHtml, bridgeOutHtml });
  } else {
    document.getElementById("story").innerHTML = `<article class="event-card" aria-labelledby="currentEventTitle">${sceneContextHtml}${competitionFrame}${bridgeInHtml}<h2 id="currentEventTitle" tabindex="-1">${escapeHtml(event.title)}</h2><div class="event-text">${escapeHtml(text)}</div>${bridgeOutHtml}</article>`;
    document.getElementById("choices").innerHTML = event.choices.map((choice, index) => `<button type="button" onclick="choose('${eventId}', ${index})">${escapeHtml(choice.text)}</button>`).join("");
  }
  updateStatus();
  if (player.goalState?.recentProgress?.length) {
    const feedback = consumeGoalFeedback();
    document.getElementById("changeLog").innerHTML += feedback.map(item => `<div class="${item.type === "complete" ? "goal-complete" : item.type === "success" ? "goal-success" : item.type === "partial" ? "goal-partial" : item.type === "failed" ? "goal-failed" : "goal-progress-change"}">${escapeHtml(item.message)}</div>`).join("");
  }
  focusCurrentEventHeading();
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

function renderCompetitionPresentation(eventId) {
  if (
    typeof CompetitionPresentation !== "object" ||
    typeof CompetitionPresentation.render !== "function"
  ) {
    return "";
  }
  return CompetitionPresentation.render(
    eventId,
    getCompetitionPresentationContext(eventId)
  );
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
  if (player.chapter === "青棒第二年") return `青棒第二年・第 ${player.highSchoolYearTwoStep + 1}／8 階段`;
  if (player.chapter === "青棒第二年小結") return "青棒・第二年評估";
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
  if (player.chapter === "青棒第二年") return 87 + Math.round((player.highSchoolYearTwoStep / 8) * 12);
  if (player.chapter === "青棒第二年小結") return 100;
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

function renderStatusSection(title, content, options = {}) {
  const safeContent = typeof content === "string" ? content.trim() : "";
  if (!safeContent) return "";
  const className = ["status-section", options.className || ""].filter(Boolean).join(" ");
  return `<details class="${className}"${options.open ? " open" : ""}>
    <summary>${escapeHtml(title)}</summary>
    <div class="status-section__content">${safeContent}</div>
  </details>`;
}

function renderCurrentGoalSummary() {
  const trackedGoal = player.goalState?.current;
  if (trackedGoal?.title) {
    return `<div class="status-summary__goal">
      <small>當前目標</small>
      <strong>${escapeHtml(trackedGoal.title)}</strong>
      <span>${escapeHtml(getGoalProgressText(trackedGoal))}</span>
    </div>`;
  }
  const fallbackGoal = typeof player.currentGoal === "string" ? player.currentGoal.trim() : "";
  return fallbackGoal ? `<div class="status-summary__goal"><small>當前目標</small><strong>${escapeHtml(fallbackGoal)}</strong></div>` : "";
}

function renderCurrentIdentitySummary() {
  const items = [
    `<span><small>年齡</small><strong>${Number(player.age) || 0} 歲</strong></span>`,
    player.chapter ? `<span><small>階段</small><strong>${escapeHtml(player.chapter)}</strong></span>` : "",
    player.seasonPosition ? `<span><small>守位</small><strong>${escapeHtml(player.seasonPosition)}</strong></span>` : "",
    player.roleIdentity?.primary ? `<span><small>角色</small><strong>${escapeHtml(player.roleIdentity.primary)}</strong></span>` : "",
    player.route && player.route !== "尚未定型" ? `<span><small>路線</small><strong>${escapeHtml(player.route)}</strong></span>` : ""
  ].filter(Boolean);
  return items.length ? `<div class="status-summary__identity">${items.join("")}</div>` : "";
}

function renderCurrentBodySummary() {
  if (!player.body || typeof player.body !== "object") return "";
  const items = [
    `<span><small>體力</small><strong>${Number(player.body.stamina) || 0}</strong></span>`,
    `<span><small>疲勞</small><strong>${Number(player.body.fatigue) || 0}</strong></span>`,
    Number(player.body.pain) > 0 ? `<span class="is-warning"><small>疼痛</small><strong>${Number(player.body.pain)}</strong></span>` : "",
    Number(player.body.injuryRisk) > 0 ? `<span class="is-warning"><small>傷病風險</small><strong>${Number(player.body.injuryRisk)}</strong></span>` : "",
    Number(player.burnout) > 0 ? `<span class="is-warning"><small>倦怠</small><strong>${Number(player.burnout)}</strong></span>` : ""
  ].filter(Boolean);
  return items.length ? `<div class="status-summary__body" aria-label="身體狀態">${items.join("")}</div>` : "";
}

function getCurrentStatusSummary(options = {}) {
  return {
    goal: renderCurrentGoalSummary(),
    identity: renderCurrentIdentitySummary(),
    body: renderCurrentBodySummary(),
    pending: typeof options.pendingHtml === "string" ? options.pendingHtml : "",
    competition: typeof options.competitionHtml === "string" ? options.competitionHtml : ""
  };
}

function renderCurrentStatusSummary(summary) {
  const content = [summary.goal, summary.identity, summary.body, summary.pending, summary.competition].filter(Boolean).join("");
  return `<section class="status-current-summary" aria-labelledby="currentStatusSummaryTitle">
    <h2 id="currentStatusSummaryTitle">當下摘要</h2>
    ${content}
  </section>`;
}

function renderStatusResult(label, result, detail = "") {
  const safeResult = typeof result === "string" ? result.trim() : "";
  if (!safeResult) return "";
  const safeDetail = typeof detail === "string" ? detail.trim() : "";
  return `<div class="result-badge"><small>${escapeHtml(label)}</small><strong>${escapeHtml(safeResult)}</strong>${safeDetail ? `<p>${escapeHtml(safeDetail)}</p>` : ""}</div>`;
}

function auditSkillGrowthSources() {
  const collections = [chapterOneEvents, chapterTwoEvents, youthSeasonEvents, positionCompetitionEvents, juniorBaseballEvents, juniorSeasonEvents, highSchoolEvents, highSchoolYearTwoEvents, criticalYearEvents, careerTransitionEvents, pacingEvents, developmentEvents];
  const chapters = ["童年", "少棒入門", "少棒第一季", "位置競爭", "青少棒", "青少棒分化", "青棒", "青棒第二年", "青棒關鍵年", "生涯轉換", "呼吸事件", "發展期"];
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
  syncGameUiVisibility();
  clampStats();
  updateImpression();
  const statusEventId = player.forcedEventId || getCurrentEventId();
  updateGoals(statusEventId);
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
  const currentArchetype = showCareerArc && player.roleIdentity.primary ? refreshPlayerArchetype() : "";
  if (showCareerArc) evaluateMarket();
  const careerTrendLabels = { rising: "上升", stable: "持平", declining: "下降", rebound: "回升" };
  const competitionHtml = competition?.active ? `<div class="competition-card"><strong>${escapeHtml(competition.position || player.seasonPosition)}先發競爭</strong><div class="competition-row"><span>${escapeHtml(competition.rivalName || getRivalDisplayName())}</span><b>教練評價 ${competition.rivalRating}</b></div><div class="competition-row you"><span>你</span><b>教練評價 ${competition.playerRating}</b></div><p class="competition-gap">${competition.result ? `${escapeHtml(competition.result)}：${escapeHtml(competition.detail)}` : `目前差距 ${Math.abs(competition.rivalRating - competition.playerRating)} 點，測試尚未公布。`}</p></div>` : "";
  const competitionModel = typeof CompetitionPresentation === "object" && typeof CompetitionPresentation.createPresentation === "function"
    ? CompetitionPresentation.createPresentation(statusEventId, getCompetitionPresentationContext(statusEventId))
    : null;
  const validationSummaryHtml = competitionModel ? `<div class="status-summary__competition"><small>${escapeHtml(competitionModel.type?.label || "驗證場合")}</small><strong>${escapeHtml(competitionModel.competitionTitle)}</strong><span>${escapeHtml(competitionModel.inningSummary)}</span>${competitionModel.showScore ? `<b>客隊 ${competitionModel.matchState.awayScore}：${competitionModel.matchState.homeScore} 少棒隊</b>` : ""}</div>` : "";
  const debugMode = Boolean(document.querySelector?.(".debug-bookmarks")?.open);
  const debug = debugMode ? getBalanceDebugSummary() : null;
  const debugHtml = debug ? `<div class="balance-debug"><strong>平衡測試</strong><small>目標 ${escapeHtml(debug.goalId)}｜${escapeHtml(debug.goalTier)}｜${escapeHtml(debug.goalProgress)}</small><small>預估 ${escapeHtml(debug.estimatedResult)}</small><small>競爭：技能 ${Math.round(debug.competition.skillScore)}／信任 ${Math.round(debug.competition.trustScore)}／表現 ${Math.round(debug.competition.performanceScore)}／準備 ${debug.competition.preparationScore}／角色 ${debug.competition.roleScore}</small><small>守位評分 ${debug.positionRating}｜本章技能 +${debug.chapterSkillPoints}</small><small>負荷：壓力 ${debug.load.pressure}／疲勞 ${debug.load.fatigue}／傷病 ${debug.load.injuryRisk}／倦怠 ${debug.load.burnout}</small></div>` : "";
  const aspiration = getCurrentAspiration();
  const summary = getCurrentStatusSummary({ pendingHtml, competitionHtml: competitionHtml || validationSummaryHtml });
  const detailedGoalHtml = player.goalState?.current
    ? [
        player.goalState.short?.title ? renderTrackedGoal("short", "短期") : "",
        player.goalState.chapter?.title ? renderTrackedGoal("chapter", "階段") : ""
      ].filter(Boolean).join("")
    : [
        player.shortGoal ? `<div class="goal-line"><small>短期</small><span>${escapeHtml(player.shortGoal)}</span></div>` : "",
        player.longGoal ? `<div class="goal-line"><small>階段</small><span>${escapeHtml(player.longGoal)}</span></div>` : ""
      ].filter(Boolean).join("");
  const abilityHtml = `
    <div class="status-subgroup"><h3>能力傾向</h3>${renderBar(player.ballSense, "球感")}${renderBar(player.observe, "觀察")}${renderBar(player.fitness, "體能")}</div>
    ${showSkills ? `<div class="status-subgroup"><h3>守位與能力連結</h3>${renderPositionPanel()}</div><div class="status-subgroup"><h3>棒球技能</h3>${Array.from(new Set(["catching", "throwing", "batting", "baseRunning", "baseballIQ", ...(getPositionAssessment(player.seasonPosition || calculatePositionRatings()[0].position)?.skills || [])])).map(key => renderBar(player.baseballSkills[key], skillLabels[key])).join("")}</div><div class="offense-card"><strong>進攻評價 ${offensiveRating}</strong><p>${offensiveValue ? `目前可提供 +${offensiveValue} 生涯評估修正；具備靠打擊換取名單機會的可能。` : "打擊仍是輔助能力，尚未形成足以改變名單的工具。"}</p></div>` : ""}
    ${showBody ? `<div class="status-subgroup"><h3>身體狀態</h3>${renderBar(player.body.stamina, "體力")}${renderBar(player.body.fatigue, "疲勞")}${renderBar(player.body.recovery, "恢復力")}${renderBar(player.body.injuryRisk, "傷病風險")}${renderBar(player.body.pain, "疼痛")}</div>` : ""}`;
  const relationshipHtml = `
    <div class="status-subgroup"><h3>支持與注意</h3>${renderBar(player.familySupport, "家庭支持")}${showSkills ? renderBar(player.coachAttention, "教練注意") : ""}</div>
    ${showSeason ? `<div class="reflection-card"><p>${escapeHtml(getRelationshipStatusText("azhe"))}</p><p>${escapeHtml(getRelationshipStatusText("takahashi"))}</p><p>${escapeHtml(getRelationshipStatusText("yamamoto"))}</p></div><div class="reflection-card"><strong>人物反應</strong><p>${escapeHtml(getNpcPerceptionSummary("azhe"))}</p><p>${escapeHtml(getNpcPerceptionSummary("takahashi"))}</p><p>${escapeHtml(getNpcPerceptionSummary("coach"))}</p></div>` : ""}
    ${player.relationshipPayoffs?.length ? `<div class="reflection-card"><strong>最近的關係回報</strong><p>${escapeHtml(getRelationshipPayoffSummary())}</p></div>` : ""}`;
  const growthHtml = `
    ${detailedGoalHtml ? `<div class="goal-card"><strong>後續目標</strong>${detailedGoalHtml}</div>` : ""}
    <div class="status-subgroup"><h3>人格</h3>${renderBar(player.confidence, "自信")}${renderBar(player.resilience, "韌性")}${renderBar(player.instinct, "野性")}${renderBar(player.discipline, "紀律")}${renderBar(player.responsibility, "責任感")}${renderBar(player.pressure, "壓力", 12)}</div>
    <div class="status-subgroup"><h3>目前輪廓</h3><p>${escapeHtml(getTraitSummary())}</p><p>${escapeHtml(player.route)}</p></div>
    <div class="goal-card"><strong>追求與敘事方向</strong><div class="goal-line aspiration-line"><small>現在想追的事</small><span>${escapeHtml(aspiration.current)}</span></div><div class="goal-line aspiration-line"><small>目前故事正在處理</small><span>${escapeHtml(player.narrativeThread?.activeTension || player.narrativeThread?.coreQuestion || "讓下一次選擇產生具體承接")}</span></div><div class="goal-line aspiration-line"><small>下一個可以期待的事</small><span>${escapeHtml(aspiration.nextPossibility)}</span></div></div>
    ${player.narrativeThread?.id ? `<div class="goal-card"><strong>本段故事：${escapeHtml(player.narrativeThread.title)}</strong><p>${escapeHtml(player.narrativeThread.question)}</p><small>${escapeHtml(player.narrativeThread.nextTension || "等待下一幕")}</small></div>` : ""}
    ${player.chapter.includes("青少棒") || player.juniorSeasonResult ? `<div class="status-subgroup"><h3>生活平衡</h3>${renderBar(player.academics, "課業")}${renderBar(player.motivation, "棒球動機")}${renderBar(player.burnout, "倦怠")}</div>` : ""}`;
  const evaluationHtml = [
    renderStatusResult("少棒入門評估", player.chapter2Result, player.chapter2ResultDetail),
    renderStatusResult("少棒第一季評估", player.seasonResult, player.seasonResultDetail),
    renderStatusResult("位置競爭評估", player.competitionResult, player.competitionDetail),
    renderStatusResult("青少棒評估", player.juniorResult, player.juniorDetail),
    renderStatusResult("青少棒分化評估", player.juniorSeasonResult, player.juniorSeasonDetail),
    renderStatusResult("青棒第一年評估", player.highSchoolResult, player.highSchoolDetail),
    renderStatusResult("青棒第二年評估", player.highSchoolYearTwoResult, player.highSchoolYearTwoDetail),
    renderStatusResult("青棒關鍵年評估", player.criticalYearResult, player.criticalYearDetail),
    renderStatusResult("生涯轉換評估", player.transitionResult, player.transitionDetail),
    renderStatusResult("發展期評估", player.developmentResult, player.developmentDetail)
  ].filter(Boolean).join("");
  const careerAssetsHtml = player.chapter.includes("青棒") || player.careerExit
    ? `<div class="status-subgroup"><h3>生涯資產</h3>${renderBar(player.exposure, "曝光")}${renderBar(player.scoutEvaluation, "球探評價")}${renderBar(player.recentPerformance, "近期表現")}${renderBar(player.reputation, "名聲／可信度")}</div>`
    : "";
  const careerArcHtml = showCareerArc
    ? `<div class="career-arc-card"><strong>球員型態：${escapeHtml(currentArchetype || "尚未形成")}</strong><p>${escapeHtml(playerArchetypeDescriptions[currentArchetype] || "仍在尋找可被球隊描述的用途。")}</p><small>系統角色：${escapeHtml(player.roleIdentity.primary || "尚未定型")}</small><p>價值 ${player.careerValue.current}／最高 ${player.careerValue.peak}　${careerTrendLabels[player.careerValue.trend] || "持平"}</p><p>階段：${escapeHtml(player.careerArc.stage)}　轉型 ${player.careerArc.reinventions} 次</p></div><div class="status-subgroup"><h3>市場重估</h3>${renderBar(player.marketEvaluation.offense, "進攻", 100)}${renderBar(player.marketEvaluation.defense, "守備", 100)}${renderBar(player.marketEvaluation.utility, "工具性", 100)}${renderBar(player.marketEvaluation.leadership, "領導", 100)}${renderBar(player.marketEvaluation.health, "健康", 100)}</div>`
    : "";
  const transitionHtml = player.chapter.includes("生涯轉換") || player.transitionResult ? `<div class="status-subgroup"><h3>轉換期</h3>${renderBar(player.finances, "經濟穩定")}</div>` : "";
  const careerHtml = `${careerAssetsHtml}${careerArcHtml}${transitionHtml}`;
  const debugRelationshipHtml = debug && showSeason ? `<div class="status-subgroup"><h3>原始關係數值</h3>${renderBar(player.relationships.coachTrust, "教練信任")}${renderBar(player.relationships.teammateBond, "阿哲羈絆")}${renderBar(player.relationships.rivalRespect, "宿敵敬意")}${renderBar(player.relationships.rivalCompetition, "競爭張力")}</div>` : "";
  document.getElementById("status").innerHTML = `
    ${renderCurrentStatusSummary(summary)}
    <div class="status-details" aria-label="完整詳細資料">
      ${renderStatusSection("能力與技能", abilityHtml, { open: true })}
      ${renderStatusSection("人物關係", relationshipHtml)}
      ${renderStatusSection("成長與身份", growthHtml)}
      ${renderStatusSection("章節評估", evaluationHtml)}
      ${renderStatusSection("生涯與市場", careerHtml)}
      ${debug ? renderStatusSection("系統／測試資訊", `${debugHtml}${debugRelationshipHtml}`, { className: "status-section--debug" }) : ""}
    </div>`;
  document.getElementById("player-info").innerHTML = `<strong>${escapeHtml(player.name || "尚未建立角色")}</strong><span>${player.age} 歲</span><span>${escapeHtml(player.chapter)}</span><span>${escapeHtml(player.route)}</span><span>理想球員：${escapeHtml(player.idealSelf || "尚未形成")}</span>`;
}

updateStatus();
