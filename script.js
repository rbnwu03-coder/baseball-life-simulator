let isTransitioning = false;
let pendingYouthSeasonOutcome = null;
let pendingBaseballGameplay = null;
let pendingTrainingOutcome = null;
let selectedOrigin = PlayerIdentityOptions.origins[0];
let selectedIdealSelf = "";
let selectedDevelopmentEntry = "full";
let selectedDevelopmentTestPosition = "";
let pendingHighSchoolMatchPositionOverride = "";
let pendingHighSchoolFullMatchTest = false;
let pendingHighSchoolMatchSimulationSeed = 0;
let pendingGenesisRoll = null;
let pendingGenesisAllocation = Object.fromEntries(CHARACTER_GENESIS_ABILITY_KEYS.map(key => [key, 0]));
let pendingSchoolInvitationSelectionId = "";
const statusPanelDisclosureState = Object.create(null);
const statusPanelDisclosureBoundRoots = new WeakSet();

const MATCH_FLOW_BEAT_MS = 1000;
const MATCH_ATTENTION_BEAT_MS = 1700;
const MATCH_MAJOR_TRANSITION_MS = 1850;
const BASEBALL_MATCH_BUILD_SIGNATURE = "bmf-2.2.4.4-opportunity-parity-v1";
let highSchoolMatchPlaybackTimer = null;
let highSchoolMatchPlaybackScheduled = false;
let highSchoolMatchPlaybackGeneration = 0;
let highSchoolMatchPlaybackTimerGeneration = 0;
let highSchoolMatchPlaybackDebugEnabled = false;
let highSchoolMatchPlaybackDebugStep = 0;
let highSchoolMatchPlaybackTrace = [];
let highSchoolMatchPlaybackLastScheduledReason = "";
let highSchoolMatchPlaybackLastTimerClearReason = "";
let highSchoolMatchPlaybackLastCallbackReason = "";
let highSchoolMatchPlaybackLastCallbackResult = "";
let highSchoolMatchOpportunityDebugEnabled = false;

if (typeof window !== "undefined") window.BASEBALL_MATCH_BUILD_SIGNATURE = BASEBALL_MATCH_BUILD_SIGNATURE;

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
  [PlayerIdentityOptions.idealSelf[1]]: "我想用最有威脅的擊球改變比賽。",
  [PlayerIdentityOptions.idealSelf[2]]: "我想靠細膩動作與球感解決問題。",
  [PlayerIdentityOptions.idealSelf[3]]: "我想成為讓全隊放心的守備者。",
  [PlayerIdentityOptions.idealSelf[4]]: "我想用速度擴大每一次機會。",
  [PlayerIdentityOptions.idealSelf[5]]: "我想比別人更早看懂下一球。"
});

const genesisAbilityLabels = Object.freeze({
  ballSense: "球感", observe: "觀察", fitness: "體能",
  batting: "打擊", baseRunning: "跑壘", baseballIQ: "棒球理解"
});

function formatCharacterGenesisShape(shape = "") {
  return shape.split("＋").map(key => genesisAbilityLabels[key] || key).filter(Boolean).join("＋");
}

const handednessLabels = Object.freeze({
  bats: Object.freeze({ R: "右打", L: "左打", S: "左右開弓" }),
  throws: Object.freeze({ R: "右投", L: "左投" })
});

function formatHandedness(bats = "R", throws = "R") {
  return `${handednessLabels.bats[bats] || "右打"}／${handednessLabels.throws[throws] || "右投"}`;
}

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

function renderCharacterGenesis() {
  const allocationElement = document.getElementById("genesisAllocation");
  const shapeElement = document.getElementById("genesisShape");
  const budgetElement = document.getElementById("genesisBudget");
  const rollButton = document.getElementById("genesisRollButton");
  const spent = Object.values(pendingGenesisAllocation).reduce((sum, value) => sum + value, 0);
  if (shapeElement) shapeElement.textContent = pendingGenesisRoll
    ? `能力總量 12｜突出形狀：${formatCharacterGenesisShape(pendingGenesisRoll.shape)}`
    : "尚未揭示。";
  if (budgetElement) budgetElement.textContent = `剩餘配置點數：${3 - spent}`;
  if (rollButton) rollButton.disabled = Boolean(pendingGenesisRoll);
  if (!allocationElement) return;
  allocationElement.innerHTML = pendingGenesisRoll ? CHARACTER_GENESIS_ABILITY_KEYS.map(key => {
    const base = pendingGenesisRoll.baseRoll[key];
    const allocated = pendingGenesisAllocation[key];
    return `<div class="genesis-ability"><strong>${genesisAbilityLabels[key]}</strong><span>${base}${allocated ? `＋${allocated}` : ""}</span><button type="button" aria-label="減少${genesisAbilityLabels[key]}配置" onclick="ApplicationController.adjustGenesisAbility('${key}', -1)">−</button><button type="button" aria-label="增加${genesisAbilityLabels[key]}配置" onclick="ApplicationController.adjustGenesisAbility('${key}', 1)">＋</button></div>`;
  }).join("") : "";
}

function generateGenesisProfile(random = Math.random) {
  if (pendingGenesisRoll) return pendingGenesisRoll;
  pendingGenesisRoll = rollCharacterGenesis(random);
  renderCharacterGenesis();
  return pendingGenesisRoll;
}

function adjustGenesisAbility(key, delta) {
  if (!pendingGenesisRoll || !CHARACTER_GENESIS_ABILITY_KEYS.includes(key) || ![-1, 1].includes(delta)) return false;
  const spent = Object.values(pendingGenesisAllocation).reduce((sum, value) => sum + value, 0);
  const current = pendingGenesisAllocation[key];
  if ((delta > 0 && (spent >= 3 || current >= 2)) || (delta < 0 && current <= 0)) return false;
  pendingGenesisAllocation[key] += delta;
  renderCharacterGenesis();
  return true;
}

function resetCharacterGenesisSelection() {
  pendingGenesisRoll = null;
  pendingGenesisAllocation = Object.fromEntries(CHARACTER_GENESIS_ABILITY_KEYS.map(key => [key, 0]));
  const batsSelect = document.getElementById("batsSelect");
  const throwsSelect = document.getElementById("throwsSelect");
  if (batsSelect) batsSelect.value = "R";
  if (throwsSelect) throwsSelect.value = "R";
  updateDevelopmentTestPositionLegality();
  renderCharacterGenesis();
}

function selectDevelopmentEntry(entry) {
  if (!["full", "highSchool", "highSchoolFullMatch"].includes(entry)) return false;
  selectedDevelopmentEntry = entry;
  document.querySelectorAll?.("[data-development-entry]").forEach(button => {
    const selected = button.dataset.developmentEntry === entry;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const direct = ["highSchool", "highSchoolFullMatch"].includes(entry);
  const fullMatchTest = entry === "highSchoolFullMatch";
  const startButton = document.getElementById("careerStartButton");
  const description = document.getElementById("developmentEntryDescription");
  if (startButton) startButton.textContent = direct ? "完成創角，進入高中第一年" : "走進十歲的夏天";
  if (description) description.textContent = fullMatchTest
    ? "完成創角後直接進入高一交流賽；正式從一局上、0：0、0 出局、壘上無人開始。"
    : direct
    ? "創角、憧憬球員、能力揭示、有限加點與投打選擇照常完成；之後直接進入高中第一年。"
    : "目前會從十歲的夏天開始完整人生。";
  return true;
}

const developmentTestPositions = Object.freeze(["", "一壘手", "二壘手", "游擊手", "三壘手"]);
const DEVELOPMENT_MATCH_POSITION_TEST_FALLBACK_VERSION = "development-match-position-test-fallback-v1";
const DEVELOPMENT_MATCH_POSITION_TEST_BENCHMARK_VERSION = "development-playable-position-v2";
const developmentMatchPositionTestBenchmark = Object.freeze({
  source: "effective-match-behavior-calibration",
  fixtureSource: "createRepresentativeHighSchoolEntryFixture",
  sampleSize: 1000,
  profiles: Object.freeze(["ordinary", "defense", "batting", "low"]),
  means: Object.freeze({ catching: 3.856, throwing: 3.934, armStrength: 2.67, reaction: 3.62, range: 2.613, baseballIQ: 4.154 }),
  floorRule: "minimum-sufficient-deep-chain-reachability",
  targetPlayerBasicExecutionBand: Object.freeze([0.65, 0.75]),
  floors: Object.freeze({ catching: 9, throwing: 9, armStrength: 9, reaction: 8, range: 8, baseballIQ: 9 })
});
const developmentMatchPositionTestSkillMap = Object.freeze({
  "一壘手": Object.freeze([...positionConfigs["內野手"].skills]),
  "二壘手": Object.freeze([...positionConfigs["內野手"].skills]),
  "游擊手": Object.freeze([...positionConfigs["內野手"].skills, "armStrength"]),
  "三壘手": Object.freeze([...positionConfigs["內野手"].skills.filter(skill => skill !== "range"), "armStrength"])
});

function isDevelopmentTestPositionLegalForThrowingHand(position = "", throws = "R", age = 16) {
  if (!position) return true;
  if (!developmentTestPositions.includes(position)) return false;
  if (typeof PlayingTimeGameExposure !== "undefined") {
    return PlayingTimeGameExposure.isPositionLegalForThrowingHand(position, throws, age);
  }
  return throws !== "L" || Number(age) <= 12 || position === "一壘手";
}

function getDevelopmentTestPositionLegalityMessage(position = "", throws = "R") {
  if (isDevelopmentTestPositionLegalForThrowingHand(position, throws, 16)) return "";
  return `左投於高中階段不可指定為${position}。`;
}

function updateDevelopmentTestPositionLegality() {
  const throws = document.getElementById("throwsSelect")?.value || "R";
  let selectionRejected = false;
  document.querySelectorAll?.("[data-development-position]").forEach(button => {
    const position = button.dataset.developmentPosition || "";
    const legal = isDevelopmentTestPositionLegalForThrowingHand(position, throws, 16);
    button.disabled = !legal;
    button.setAttribute("aria-disabled", String(!legal));
    if (!legal && selectedDevelopmentTestPosition === position) selectionRejected = true;
  });
  if (selectionRejected) selectedDevelopmentTestPosition = "";
  document.querySelectorAll?.("[data-development-position]").forEach(button => {
    const selected = button.dataset.developmentPosition === selectedDevelopmentTestPosition;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const description = document.getElementById("developmentPositionDescription");
  if (description && selectionRejected) description.textContent = "左投於高中階段不可指定為二壘手、游擊手或三壘手；已改回不指定。";
  return !selectionRejected;
}

function selectDevelopmentTestPosition(position = "") {
  if (!developmentTestPositions.includes(position)) return false;
  const throws = document.getElementById("throwsSelect")?.value || "R";
  const legalityMessage = getDevelopmentTestPositionLegalityMessage(position, throws);
  if (legalityMessage) {
    const description = document.getElementById("developmentPositionDescription");
    if (description) description.textContent = legalityMessage;
    return false;
  }
  selectedDevelopmentTestPosition = position;
  document.querySelectorAll?.("[data-development-position]").forEach(button => {
    const selected = button.dataset.developmentPosition === position;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const description = document.getElementById("developmentPositionDescription");
  if (description) description.textContent = position
    ? `高中篇測試開始後，本場守備關鍵球固定由你擔任${position}；本場測試能力保護已啟用，相關守備能力使用開發測試基準，不會改寫生涯能力或主守位。`
    : "不指定本場守位，沿用角色與教練安排。";
  return true;
}

function createDevelopmentMatchPositionTestCapabilityOverride(position = "", subject = player) {
  if (!developmentMatchPositionTestSkillMap[position]) return null;
  if (!isDevelopmentTestPositionLegalForThrowingHand(position, subject?.throws || "R", Number(subject?.age) || 16)) return null;
  const skillFloors = Object.fromEntries(developmentMatchPositionTestSkillMap[position]
    .map(skill => [skill, developmentMatchPositionTestBenchmark.floors[skill]]));
  return Object.freeze({
    version: DEVELOPMENT_MATCH_POSITION_TEST_FALLBACK_VERSION,
    active: true,
    position,
    source: "development-position-test",
    reason: "minimum-sufficient-deep-chain-reachability",
    benchmarkVersion: DEVELOPMENT_MATCH_POSITION_TEST_BENCHMARK_VERSION,
    skillFloors: Object.freeze(skillFloors)
  });
}

function getDevelopmentMatchPositionTestCapabilityAudit(subject = player, match = subject?.highSchoolMatch) {
  const override = match?.developmentTestCapabilityOverride;
  if (!override?.active || override.version !== DEVELOPMENT_MATCH_POSITION_TEST_FALLBACK_VERSION) {
    return Object.freeze({ active: false, source: "canonical-player", position: match?.playerFieldingAssignment || match?.position || "", skills: Object.freeze({}) });
  }
  const skills = Object.fromEntries(Object.entries(override.skillFloors || {}).map(([skill, floor]) => {
    const raw = Number(subject?.baseballSkills?.[skill]) || 0;
    const normalizedFloor = Number(floor) || 0;
    const effective = Math.max(raw, normalizedFloor);
    return [skill, Object.freeze({
      raw,
      floor: normalizedFloor,
      effective,
      overrideApplied: effective > raw,
      source: override.source,
      benchmarkVersion: override.benchmarkVersion
    })];
  }));
  return Object.freeze({ active: true, version: override.version, benchmarkVersion: override.benchmarkVersion, source: override.source, position: override.position, skills: Object.freeze(skills) });
}

function createHighSchoolDirectStartHistory() {
  return {
    route: "觀察理解型",
    chapterOneEnding: "願意先看懂場上的責任",
    chapter2Result: "以基本動作留在球隊",
    seasonRole: "內野替補與短局守備",
    seasonResult: "能完成有限任務的輪替球員",
    competitionResult: "在競爭中保留下一次機會",
    juniorResult: "用觀察與基本動作跟上身體差距",
    juniorPath: "內野守備與替補起步",
    juniorSeasonResult: "用有限出場確認自己仍想留在棒球裡",
    highSchoolRoute: "普通高中・穩定出賽",
    primaryPosition: "內野手",
    secondaryPositions: [],
    relationships: { coachTrust: 3, teammateBond: 4, rivalRespect: 2, rivalCompetition: 2 },
    impression: {
      coach: { dependable: 2, leader: 0, competitive: 1, immature: 0 },
      azhe: { trusts: 4, depends: 1, feelsDistance: 0 },
      takahashi: { respect: 2, rivalry: 2, underestimate: 0 }
    },
    characterArc: { azhe: "shared_grounder", takahashi: "rival", yamamoto: "trusted" },
    flags: ["direct_start_history", "azhe_hidden_error_seen", "accepted_junior_position_change", "chose_playing_time_high_school"],
    memory: "少棒時，你和阿哲把一顆沒被注意到的滾地球重新做完；國中階段，你以內野替補身分留下有限出場紀錄。"
  };
}

function applyHighSchoolDirectStartHistory(target) {
  const history = createHighSchoolDirectStartHistory();
  Object.assign(target, {
    route: history.route,
    chapterOneEnding: history.chapterOneEnding,
    chapter2Result: history.chapter2Result,
    seasonRole: history.seasonRole,
    seasonResult: history.seasonResult,
    competitionResult: history.competitionResult,
    juniorResult: history.juniorResult,
    juniorPath: history.juniorPath,
    juniorSeasonResult: history.juniorSeasonResult,
    highSchoolRoute: history.highSchoolRoute
  });
  applyCanonicalPositionProfile(target, history.primaryPosition, history.secondaryPositions);
  Object.assign(target.relationships, history.relationships);
  Object.assign(target.impression.coach, history.impression.coach);
  Object.assign(target.impression.azhe, history.impression.azhe);
  Object.assign(target.impression.takahashi, history.impression.takahashi);
  Object.assign(target.characterArc, history.characterArc);
  target.flags = Array.from(new Set([...(target.flags || []), ...history.flags]));
  target.memories.push(history.memory);
  applySyntheticYouthOrigin(target);
  return target;
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

const SCHOOL_INVITATION_PRESENTATION_LABELS = Object.freeze({
  tier: Object.freeze({ powerhouse: "全國強權", competitive: "中上競爭校", standard: "一般競爭校", development: "發展型球隊" }),
  training: Object.freeze({ elite: "頂尖", strong: "良好", standard: "一般", limited: "有限" }),
  competition: Object.freeze({ veryHigh: "非常激烈", high: "激烈", medium: "普通", low: "較低" }),
  playingTime: Object.freeze({ low: "不容易，需要長期競爭", medium: "需要競爭", mediumHigh: "有機會", high: "很有機會，但仍需爭取" }),
  projectedRole: Object.freeze({
    depthCandidate: "預期從競爭名單開始",
    benchCandidate: "預期有機會進入替補名單",
    rotationCandidate: "預期有望進入輪替",
    starterCompetition: "預期有機會直接競爭先發",
    coreCandidate: "校方預期把你視為這屆重要戰力候選"
  }),
  reason: Object.freeze({
    defensiveReliability: "教練注意到你的守備穩定度。",
    throwingReliability: "你的傳球可靠度讓教練留下印象。",
    battingUpside: "校方看見你的打擊發展空間。",
    speed: "你的速度能替球隊擴大進攻選擇。",
    baseballUnderstanding: "你的棒球理解讓教練留下印象。",
    armStrength: "你的臂力符合球隊目前的需求。",
    defensiveReaction: "教練注意到你的守備反應。",
    defensiveRange: "你的守備範圍是校方看中的工具。",
    catcherBlocking: "你的捕手擋球能力符合球隊規劃。",
    gameCalling: "教練看見你協助組織比賽的能力。",
    pitchCommand: "你的投球控制力符合校方尋找的方向。",
    pitchingDurability: "校方看中你承擔投球工作的潛力。",
    positionNeedHigh: "球隊目前很需要你能負責的守位。",
    positionNeedMedium: "球隊在你的候選守位仍有補強空間。",
    specializedProfileFit: "你的突出工具正好回應球隊的特定缺口。"
  }),
  risk: Object.freeze({
    highInternalCompetition: "隊內競爭非常激烈。",
    crowdedPositionRoom: "同守位人選較多，需要爭取排序。",
    limitedImmediatePlayingTime: "短期內上場機會有限。",
    lowerTrainingEnvironment: "訓練資源不如競爭層級更高的球隊。",
    weakerCompetitionSchedule: "平時面對的對手強度相對有限。"
  })
});

function getSchoolInvitationReasonText(reason) {
  if (SCHOOL_INVITATION_PRESENTATION_LABELS.reason[reason]) return SCHOOL_INVITATION_PRESENTATION_LABELS.reason[reason];
  if (String(reason || "").startsWith("preference:")) return "你的能力組合符合教練團目前的招生方向。";
  return "校方認為你的現有工具能回應球隊規劃。";
}

function getSchoolInvitationRiskText(risk) {
  return SCHOOL_INVITATION_PRESENTATION_LABELS.risk[risk]
    || "入學後的實際安排仍要由競爭與表現決定。";
}

function getSchoolInvitationIdentityEcho(target, invitation) {
  const flags = new Set(target?.flags || []);
  const powerhouse = invitation?.schoolTier === "powerhouse";
  const playingTime = invitation?.playingTimeOpportunity;
  if (flags.has("challengePower") && powerhouse) return "這個名字，你以前想的是有一天站到他們對面。";
  if (flags.has("aspireToPower") && powerhouse) return "曾經只能仰望的名字，現在出現在邀請裡。";
  if (flags.has("proveMyself")) return "這封邀請不是答案，而是一次證明自己能不能留下的入口。";
  if ((flags.has("playingTimePriority") || flags.has("chose_playing_time_high_school")) && playingTime === "low") {
    return "你很清楚，進去之後可能要等很久。";
  }
  if ((flags.has("playingTimePriority") || flags.has("chose_playing_time_high_school")) && ["mediumHigh", "high"].includes(playingTime)) {
    return "這裡或許能更早讓你真正站上場。";
  }
  if (flags.has("chose_powerhouse_high_school") && powerhouse) return "你曾主動把目光放向更擁擠的舞台，現在它真的回望你。";
  return "";
}

function createSchoolInvitationPresentationModel(target) {
  const state = target?.schoolInvitationState;
  if (!validateSchoolInvitationSet(state).ok) return null;
  return Object.freeze({
    title: "高中邀請",
    context: "少年階段結束後，你陸續收到四間高中的邀請。每一間看中的工具、競爭環境與可用機會都不相同。",
    cards: Object.freeze(state.invitations.map(invitation => Object.freeze({
      schoolId: invitation.schoolId,
      schoolName: invitation.schoolName,
      tier: SCHOOL_INVITATION_PRESENTATION_LABELS.tier[invitation.schoolTier] || "高中棒球校隊",
      training: SCHOOL_INVITATION_PRESENTATION_LABELS.training[invitation.trainingQuality] || "待了解",
      competition: SCHOOL_INVITATION_PRESENTATION_LABELS.competition[invitation.competitionDepth] || "待了解",
      playingTime: SCHOOL_INVITATION_PRESENTATION_LABELS.playingTime[invitation.playingTimeOpportunity] || "需要入學後競爭",
      projectedRole: SCHOOL_INVITATION_PRESENTATION_LABELS.projectedRole[invitation.projectedRole] || "預期角色仍待入學後確認",
      reasons: Object.freeze((invitation.interestReasons || []).slice(0, 2).map(getSchoolInvitationReasonText)),
      risks: Object.freeze((invitation.riskSignals || []).slice(0, 2).map(getSchoolInvitationRiskText)),
      identityEcho: getSchoolInvitationIdentityEcho(target, invitation)
    })))
  });
}

function renderSchoolInvitationList(items, emptyText) {
  const values = items.length ? items : [emptyText];
  return `<ul>${values.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderSchoolInvitationPresentation() {
  const model = createSchoolInvitationPresentationModel(player);
  if (!model || !isSchoolInvitationChoicePending(player)) return false;
  document.getElementById("story").innerHTML = `<article class="event-card school-invitation-screen" aria-labelledby="currentEventTitle">
    <div class="event-kicker">高中升學</div>
    <h2 id="currentEventTitle" tabindex="-1">${escapeHtml(model.title)}</h2>
    <p class="school-invitation-context">${escapeHtml(model.context)}</p>
    <p class="school-invitation-guidance">訓練、競爭與出賽機會沒有單一答案；請比較你願意承擔的取捨。</p>
  </article>`;
  document.getElementById("choices").innerHTML = `<section class="school-invitation-grid" aria-label="四間高中邀請">
    ${model.cards.map((card, index) => `<article class="school-invitation-card" aria-labelledby="schoolInvitationName${index}">
      <header><small>${escapeHtml(card.tier)}</small><h3 id="schoolInvitationName${index}">${escapeHtml(card.schoolName)}</h3></header>
      ${card.identityEcho ? `<p class="school-invitation-echo">${escapeHtml(card.identityEcho)}</p>` : ""}
      <dl class="school-invitation-comparison">
        <div><dt>訓練環境</dt><dd>${escapeHtml(card.training)}</dd></div>
        <div><dt>隊內競爭</dt><dd>${escapeHtml(card.competition)}</dd></div>
        <div><dt>出賽機會</dt><dd>${escapeHtml(card.playingTime)}</dd></div>
        <div><dt>校方預期</dt><dd>${escapeHtml(card.projectedRole)}</dd></div>
      </dl>
      <section aria-label="校方看中你的原因"><h4>為什麼邀請你</h4>${renderSchoolInvitationList(card.reasons, "校方認為你的能力能回應目前規劃。")}</section>
      <section aria-label="需要考量的取捨"><h4>需要考量</h4>${renderSchoolInvitationList(card.risks, "目前沒有特別突出的短期風險，但實際角色仍要靠入學後競爭。")}</section>
      <button type="button" onclick="beginSchoolInvitationConfirmationAt(${index})" aria-label="選擇${escapeHtml(card.schoolName)}">選擇這間學校</button>
    </article>`).join("")}
  </section>`;
  focusCurrentEventHeading();
  return true;
}

function renderSchoolInvitationConfirmation() {
  if (!isSchoolInvitationChoicePending(player)) return false;
  const model = createSchoolInvitationPresentationModel(player);
  const card = model?.cards.find(item => item.schoolId === pendingSchoolInvitationSelectionId);
  if (!card) return renderSchoolInvitationPresentation();
  document.getElementById("story").innerHTML = `<article class="event-card school-invitation-confirmation" aria-labelledby="currentEventTitle">
    <div class="event-kicker">確認高中選擇</div>
    <h2 id="currentEventTitle" tabindex="-1">你決定加入「${escapeHtml(card.schoolName)}」？</h2>
    <p>這是入學前的校方預期，不保證實際先發或固定角色。</p>
    <dl class="school-invitation-confirmation__summary">
      <div><dt>訓練環境</dt><dd>${escapeHtml(card.training)}</dd></div>
      <div><dt>隊內競爭</dt><dd>${escapeHtml(card.competition)}</dd></div>
      <div><dt>校方預期</dt><dd>${escapeHtml(card.projectedRole)}</dd></div>
    </dl>
  </article>`;
  document.getElementById("choices").innerHTML = `<button type="button" class="school-choice-confirm" onclick="confirmSchoolInvitationSelection()">確認加入${escapeHtml(card.schoolName)}</button>
    <button type="button" onclick="cancelSchoolInvitationConfirmation()">返回比較</button>`;
  focusCurrentEventHeading();
  return true;
}

function beginSchoolInvitationConfirmation(schoolId) {
  if (isTransitioning || !isSchoolInvitationChoicePending(player)) return false;
  if (!player.schoolInvitationState.invitations.some(invitation => invitation.schoolId === schoolId)) return false;
  pendingSchoolInvitationSelectionId = schoolId;
  return renderSchoolInvitationConfirmation();
}

function beginSchoolInvitationConfirmationAt(index) {
  const model = createSchoolInvitationPresentationModel(player);
  const card = model?.cards[index];
  if (!card) return false;
  return beginSchoolInvitationConfirmation(card.schoolId);
}

function cancelSchoolInvitationConfirmation() {
  if (isTransitioning || !isSchoolInvitationChoicePending(player)) return false;
  pendingSchoolInvitationSelectionId = "";
  return renderSchoolInvitationPresentation();
}

function clearPendingSchoolInvitationSelection() {
  pendingSchoolInvitationSelectionId = "";
}

function confirmSchoolInvitationSelection() {
  if (isTransitioning || !pendingSchoolInvitationSelectionId || !isSchoolInvitationChoicePending(player)) return false;
  isTransitioning = true;
  setChoiceTransitionState(true);
  const result = finalizeSchoolInvitationSelection(player, pendingSchoolInvitationSelectionId);
  if (!result.ok || result.existing) {
    isTransitioning = false;
    setChoiceTransitionState(false);
    showNotice(result.error || "這次選校已經完成。", result.ok ? "warning" : "error");
    return false;
  }
  pendingSchoolInvitationSelectionId = "";
  if (typeof saveGame === "function") saveGame();
  return completeHighSchoolEntry({ source: "school-choice-confirmation" });
}

function applyDebugBookmarkCharacterProfile(target) {
  const existingSkills = { ...(target.baseballSkills || {}) };
  const existingTraits = Object.fromEntries(["ballSense", "observe", "fitness"].map(key => [key, Number(target[key]) || 0]));
  const roll = rollCharacterGenesis(() => 0.25);
  const allocation = {
    ballSense: 1,
    observe: 1,
    fitness: 0,
    batting: 0,
    baseRunning: 0,
    baseballIQ: 1
  };
  const idealSelf = "棒球理解型";
  target.idealSelf = idealSelf;
  const genesis = applyCharacterGenesis(target, {
    baseRoll: roll.baseRoll,
    allocation,
    shape: formatCharacterGenesisShape(roll.shape),
    bats: "R",
    throws: "R"
  });
  if (!genesis.ok) throw new Error(genesis.error);
  Object.entries(existingSkills).forEach(([skill, value]) => {
    if (Number.isFinite(Number(value)) && Number(value) > Number(target.baseballSkills[skill] || 0)) {
      const delta = Number(value) - Number(target.baseballSkills[skill] || 0);
      target.baseballSkills[skill] = Number(value);
      recordCapabilitySkillChanges(target, { [skill]: delta }, {
        sourceType: "debug-bookmark-fixture",
        eventId: "debug-bookmark-profile-compatibility",
        choiceId: "preserve-existing-development",
        provenance: "debug-only-legacy-fixture"
      });
    }
  });
  Object.entries(existingTraits).forEach(([trait, value]) => {
    if (value > Number(target[trait] || 0)) target[trait] = value;
  });
  const primary = target.primaryPosition || "捕手";
  const secondaries = Array.isArray(target.secondaryPositions) ? target.secondaryPositions : [];
  applyCanonicalPositionProfile(target, primary, secondaries);
  if (Number(target.age) >= 16 || String(target.chapter || "").includes("青棒")) {
    const settlement = settleHighSchoolEntryCapability(target, { originType: "debug-bookmark-fixture" });
    if (!settlement.ok) throw new Error(settlement.error);
    generateSchoolInvitationSet(target, { compatibilityMode: "debug-bookmark-bypass" });
  }
  return target;
}

function loadTestBookmark(bookmark) {
  clearPendingSchoolInvitationSelection();
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
  applyDebugBookmarkCharacterProfile(player);
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

  const allocationValidation = validateCharacterGenesisAllocation(pendingGenesisAllocation);
  if (!pendingGenesisRoll || !allocationValidation.ok) {
    if (feedback) feedback.textContent = !pendingGenesisRoll
      ? "請先揭示初始能力形狀。"
      : `請配置完 3 點初始能力（目前已配置 ${allocationValidation.spent} 點）。`;
    document.getElementById("genesisRollButton")?.focus?.();
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
  resetStatusPanelDisclosureState();
  player = PlayerDataBoundary.createInitialSnapshot();
  player.replayMemories = loadReplayMemories();
  const identityResult = PlayerDataBoundary.initializeIdentity(identityInput);
  if (!identityResult.ok) {
    if (feedback) feedback.textContent = identityResult.error;
    return;
  }
  const genesisResult = applyCharacterGenesis(player, {
    baseRoll: pendingGenesisRoll.baseRoll,
    allocation: pendingGenesisAllocation,
    shape: formatCharacterGenesisShape(pendingGenesisRoll.shape),
    bats: document.getElementById("batsSelect")?.value || "R",
    throws: document.getElementById("throwsSelect")?.value || "R"
  });
  if (!genesisResult.ok) {
    if (feedback) feedback.textContent = genesisResult.error;
    return;
  }
  const directStart = ["highSchool", "highSchoolFullMatch"].includes(selectedDevelopmentEntry);
  const fullMatchTest = selectedDevelopmentEntry === "highSchoolFullMatch";
  const developmentPositionOverride = directStart ? selectedDevelopmentTestPosition : "";
  const developmentPositionError = getDevelopmentTestPositionLegalityMessage(developmentPositionOverride, player.throws);
  if (developmentPositionError) {
    if (feedback) feedback.textContent = developmentPositionError;
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
  if (directStart) applyHighSchoolDirectStartHistory(player);
  pendingHighSchoolMatchPositionOverride = developmentPositionOverride;
  pendingHighSchoolFullMatchTest = fullMatchTest;
  document.getElementById("characterCreation").style.display = "none";
  clearOutcomeFeedbackPresentation();
  selectedOrigin = PlayerIdentityOptions.origins[0];
  document.querySelectorAll?.(".origin-card").forEach(card => card.classList.toggle("selected", card.dataset.origin === PlayerIdentityOptions.origins[0]));
  selectIdealSelf("");
  resetCharacterGenesisSelection();
  selectDevelopmentEntry("full");
  selectDevelopmentTestPosition("");
  if (directStart) {
    enterHighSchool();
    if (fullMatchTest) {
      player.highSchoolStep = 5;
      if (!player.highSchoolRoleCode) resolveHighSchoolProvisionalRole();
      prepareHighSchoolYearOneMatch();
      showCurrentEvent();
      resumeHighSchoolMatchPlayback("direct-full-match-start", player.highSchoolMatch);
    }
  }
  else showCurrentEvent();
}

function resetGame() {
  clearPendingBaseballGameplay();
  clearPendingSchoolInvitationSelection();
  pendingTrainingOutcome = null;
  resetStatusPanelDisclosureState();
  player = createInitialPlayer();
  document.getElementById("characterCreation").style.display = "block";
  document.getElementById("nameInput").value = "";
  document.getElementById("story").innerHTML = "";
  document.getElementById("choices").innerHTML = "";
  clearOutcomeFeedbackPresentation();
  const feedback = document.getElementById("characterCreationFeedback");
  if (feedback) feedback.textContent = "";
  selectIdealSelf("");
  resetCharacterGenesisSelection();
  selectDevelopmentEntry("full");
  selectDevelopmentTestPosition("");
  pendingHighSchoolMatchPositionOverride = "";
  pendingHighSchoolFullMatchTest = false;
  pendingHighSchoolMatchSimulationSeed = 0;
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

function applyTrainingFocusBonus(choice, provenance = {}) {
  const focus = inferTrainingFocus(choice);
  const streak = updateTrainingFocus(focus);
  if (!focus) return;
  if (streak === 2) {
    const preferred = { fundamentals: "catching", batting: "batting", defense: "reaction", running: "baseRunning", pitching: "control", catching: "blocking", baseballIQ: "baseballIQ", recovery: null }[focus];
    if (preferred) applySkillEffects({ [preferred]: 1 }, provenance);
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

function applySkillEffects(effects = {}, provenance = {}) {
  const hasCapabilityMutation = Object.entries(effects || {}).some(([skill, delta]) =>
    [...UNIVERSAL_BASEBALL_SKILL_KEYS, ...SPECIALIST_BASEBALL_SKILL_KEYS].includes(skill)
    && Number.isFinite(Number(delta)) && Number(delta) !== 0
  );
  if (hasCapabilityMutation && provenance.sourceType === CAPABILITY_MUTATION_SOURCE_TYPES.YOUTH_OUTCOME_V1) {
    throw new Error("正式 Youth v1 capability mutation 不得使用 generic applySkillEffects；請改走 applyYouthEventOutcome。 ");
  }
  const sourceType = hasCapabilityMutation ? assertCapabilityMutationSource(player, provenance) : provenance.sourceType;
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
  recordCapabilitySkillChanges(player, effects, {
    sourceType,
    sourceContract: provenance.sourceContract,
    eventId: provenance.eventId || (typeof getCurrentEventId === "function" ? getCurrentEventId() : "runtime-event"),
    choiceId: provenance.choiceId,
    provenance: provenance.provenance || "choice-resolution",
    resolvedSeed: provenance.resolvedSeed
  });
}

function getNarrativeCapabilityMutationSource(eventId, choiceId) {
  if (isYouthOrPreHighSchoolCapabilityPhase(player)) {
    return {
      sourceType: CAPABILITY_MUTATION_SOURCE_TYPES.LEGACY_YOUTH,
      sourceContract: LEGACY_YOUTH_SOURCE_CONTRACT,
      eventId,
      choiceId,
      provenance: "legacy-story-skill-effects"
    };
  }
  return {
    sourceType: CAPABILITY_MUTATION_SOURCE_TYPES.DEVELOPMENT,
    sourceContract: "development-runtime-v1",
    eventId,
    choiceId,
    provenance: "choice-resolution"
  };
}

function applyPositionSkillEffects(effectsByPosition = {}, provenance = {}) {
  const effects = effectsByPosition[player.seasonPosition] || effectsByPosition.default;
  if (effects) applySkillEffects(effects, provenance);
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
  if (active) node.setAttribute?.("aria-label", "上一個選擇帶來的回應");
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
    <div class="outcome-feedback__label">上一個選擇帶來的回應</div>
    <div class="outcome-feedback__content">${feedbackHtml}</div>`;
  setOutcomeFeedbackPresentation(true);
  return feedbackHtml;
}

function shouldShowYouthSeasonOutcome(eventId) {
  return eventId === "high_school_showcase" || (player.chapter === "少棒第一季" && youthSeasonOutcomeEventIds.has(eventId));
}

function getYouthSeasonOutcomeHeading(eventId) {
  if (eventId === "high_school_showcase") {
    const count = player.highSchoolMatch?.completedMoments?.length || 1;
    return player.highSchoolMatch?.completed ? "秋季交流賽完整結果" : `秋季交流賽・關鍵時刻 ${count} 的結果`;
  }
  if (eventId === "high_school_year_two_spring_game") return "春季聯賽打席結果";
  if (eventId === "youth_position_trial") return "這次輪測的結果";
  if (eventId === "youth_bench") return "這段紅白賽的結果";
  if (eventId === "youth_match_after") return "這場比賽留下的結果";
  if (eventId.startsWith("youth_match_")) return "這一球的結果";
  return "這次選擇的結果";
}

function getYouthSeasonOutcomeReaction(eventId) {
  if (eventId === "high_school_showcase") return `${player.highSchoolMatch.coachReaction || "高中現任教練記下這次處理。"}${player.highSchoolMatch.teamReaction ? ` ${player.highSchoolMatch.teamReaction}` : ""}`;
  if (eventId === "high_school_year_two_spring_game") return "記錄員把這個打席寫進春季聯賽成績；高中現任教練沒有改動深度表，只讓下一棒走進打擊區。";
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

const highSchoolTrainingEventIds = Object.freeze({
  a: "high_school_year_two_training_a",
  b: "high_school_year_two_training_b"
});

const trainingChangeLabels = Object.freeze({
  batting: "打擊",
  ballSense: "球感",
  discipline: "紀律",
  reaction: "反應",
  range: "守備範圍",
  throwing: "傳球",
  fatigue: "疲勞"
});

function isHighSchoolTrainingEvent(eventId) {
  return Object.values(highSchoolTrainingEventIds).includes(eventId);
}

function hasCompletedHighSchoolTrainingSlot(slot) {
  const prefix = `hs_y2_training_${slot}_`;
  return player.flags.some(flag => typeof flag === "string" && flag.startsWith(prefix));
}

function queueHighSchoolTrainingAfter(eventId) {
  if (player.chapter !== "青棒第二年" || player.forcedEventId) return false;
  if (eventId === "high_school_year_two_roster_reset" && !hasCompletedHighSchoolTrainingSlot("a")) {
    player.forcedEventId = highSchoolTrainingEventIds.a;
    return true;
  }
  if (eventId === "high_school_year_two_role_test" && !hasCompletedHighSchoolTrainingSlot("b")) {
    player.forcedEventId = highSchoolTrainingEventIds.b;
    return true;
  }
  return false;
}

function createTrainingPlayerSnapshot() {
  return {
    ballSense: player.ballSense,
    discipline: player.discipline,
    body: { fatigue: player.body?.fatigue }
  };
}

function applyResolvedTrainingResult(result, eventId) {
  if (!result || result.status !== "resolved" || !player.body || typeof player.body !== "object") {
    return { ok: false, error: "invalid-training-result" };
  }
  let developmentApplication = null;
  if (result.developmentContext) {
    developmentApplication = applyDevelopmentResult(player, {
      ...result.developmentContext,
      sourceId: eventId,
      sourceType: "training",
      playerChoice: result.code,
      metadata: {
        settlementId: `${eventId}|${result.code}`,
        trainingCode: result.code,
        schoolTrainingQualityBridge: "future-only-not-applied",
        playingTimeExperienceBridge: "future-only-not-applied"
      }
    });
    if (!developmentApplication.ok || developmentApplication.status !== "applied") {
      return { ok: false, error: developmentApplication.errors?.join(",") || developmentApplication.status };
    }
  }
  applyEffects(result.topLevelDeltas);
  Object.entries(result.bodyDeltas).forEach(([key, value]) => {
    player.body[key] = Math.max(0, Math.min(20, (Number(player.body[key]) || 0) + value));
  });
  return { ok: true, developmentApplication };
}

function applyTrainingRelationshipHook(trainingCode) {
  if (trainingCode !== "contact-control" || hasFlag("hs_y2_training_contact_coach_echo")) return "";
  applyNestedEffects("relationships", { coachTrust: 1 });
  addFlags(["hs_y2_training_contact_coach_echo"]);
  return "高中現任教練看完你把三個落點依序打完，只在訓練表上圈起『能重複』三個字。";
}

function getTrainingChoice(eventId, trainingCode) {
  return getEvent(eventId)?.choices?.find(choice => choice.trainingCode === trainingCode) || null;
}

function getTrainingChoiceFlag(slot, trainingCode) {
  return `hs_y2_training_${slot}_${trainingCode.replace(/-/g, "_")}`;
}

function renderHighSchoolTraining(eventId, event, prepared = {}) {
  const text = prepared.text || (typeof event.text === "function" ? event.text() : event.text);
  const buttons = event.choices.map(choice => `<button type="button" onclick="chooseHighSchoolTraining('${eventId}', '${choice.trainingCode}')">${escapeHtml(choice.text)}</button>`).join("");
  const sceneContextHtml = prepared.sceneContextHtml || renderSceneContext(getSceneContext(eventId, event));
  const bridgeInHtml = prepared.bridgeInHtml || "";
  const bridgeOutHtml = prepared.bridgeOutHtml || "";
  document.getElementById("story").innerHTML = `<article class="event-card" aria-labelledby="currentEventTitle">${sceneContextHtml}${bridgeInHtml}<div class="event-kicker">自主訓練</div><h2 id="currentEventTitle" tabindex="-1">${escapeHtml(event.title)}</h2><div class="event-text">${escapeHtml(text)}</div>${bridgeOutHtml}</article>`;
  document.getElementById("choices").innerHTML = buttons;
}

function renderTrainingOutcome() {
  const pending = pendingTrainingOutcome;
  if (!pending) return;
  const changes = pending.result.changes
    .filter(change => change.delta !== 0)
    .map(change => {
      const sign = change.delta > 0 ? "+" : "";
      return `<li><span>${escapeHtml(trainingChangeLabels[change.key] || change.key)}</span><strong>${escapeHtml(`${sign}${change.delta}`)}</strong><small>${escapeHtml(`${change.before} → ${change.after}`)}</small></li>`;
    })
    .join("") || "<li><span>狀態</span><strong>無變化</strong><small>已達上下限</small></li>";
  const reaction = pending.relationshipEcho
    ? `<section class="outcome__reaction choice-outcome-reaction" aria-label="教練回應"><small>教練回應</small><p>${escapeHtml(pending.relationshipEcho)}</p></section>`
    : "";
  const development = pending.developmentResult;
  const developmentHtml = development ? `<section class="outcome__development choice-outcome-result" aria-label="技術學習結果"><small>技術學習</small><p>${escapeHtml(getTrainingDevelopmentResultText(development))}</p></section>` : "";
  setChoiceTransitionState(false);
  document.getElementById("story").innerHTML = `<article class="event-card outcome choice-outcome-card" aria-labelledby="outcomeTitle"><div class="event-kicker choice-outcome-kicker">訓練結果</div><h2 id="outcomeTitle" tabindex="-1">${escapeHtml(pending.title)}</h2><section class="outcome__confirmation choice-outcome-action" aria-label="你的選擇"><small>你選擇</small><strong>${escapeHtml(pending.choiceText)}</strong></section>${developmentHtml}${reaction}<section class="outcome__feedback choice-outcome-feedback" aria-label="狀態變化"><small>其他狀態變化</small><ul class="training-outcome-list">${changes}</ul></section></article>`;
  clearOutcomeFeedbackPresentation();
  document.getElementById("choices").innerHTML = `<div class="outcome__action" aria-label="前往下一幕"><button type="button" class="outcome-continue-button" onclick="continueTrainingOutcome()">繼續</button></div>`;
  focusOutcomeHeading();
}

function getTrainingDevelopmentResultText(result) {
  const skill = skillLabels[result.targetSkill] || trainingChangeLabels[result.targetSkill] || "這項技術";
  if (result.skillCapReached && result.skillBefore >= 20) return `${skill}已達目前能力上限，這次練習改以維持動作品質為主。`;
  if (result.levelUps > 0) return `反覆修正後，先前累積的練習開始真正固定下來。${skill}能力有所提升。`;
  if (result.learningQuality === "limited") return `你仍留下了一些可用的修正線索，但這次吸收有限，還沒有形成穩定的技術改變。`;
  return `你逐漸抓到${skill}的練習節奏，這次累積了實際進展，但還沒有形成永久的能力提升。`;
}

function chooseHighSchoolTraining(eventId, trainingCode) {
  if (
    isTransitioning ||
    pendingTrainingOutcome ||
    getCurrentEventId() !== eventId ||
    !isHighSchoolTrainingEvent(eventId)
  ) return false;
  const event = getEvent(eventId);
  const choice = getTrainingChoice(eventId, trainingCode);
  if (
    !event ||
    !choice ||
    typeof BaseballTrainingResolver !== "object" ||
    typeof BaseballTrainingResolver.resolveTraining !== "function"
  ) {
    showNotice("這個訓練目前不能執行。", "warning");
    return false;
  }

  isTransitioning = true;
  setChoiceTransitionState(true);
  const result = BaseballTrainingResolver.resolveTraining(createTrainingPlayerSnapshot(), trainingCode);
  const application = result.status === "resolved" ? applyResolvedTrainingResult(result, eventId) : { ok: false };
  if (result.status !== "resolved" || !application.ok) {
    isTransitioning = false;
    setChoiceTransitionState(false);
    showNotice("訓練狀態無法安全結算，請重新選擇。", "error");
    return false;
  }

  const slot = event.trainingSlot;
  addFlags([getTrainingChoiceFlag(slot, trainingCode)]);
  const relationshipEcho = applyTrainingRelationshipHook(trainingCode);
  player.forcedEventId = "";
  pendingTrainingOutcome = {
    eventId,
    trainingCode,
    title: event.title,
    choiceText: choice.text,
    relationshipEcho,
    result,
    developmentResult: application.developmentApplication?.result || null
  };
  updateImpression();
  renderTrainingOutcome();
  return true;
}

function continueTrainingOutcome() {
  if (!pendingTrainingOutcome) return false;
  setOutcomeContinueState(true);
  pendingTrainingOutcome = null;
  isTransitioning = false;
  showCurrentEvent();
  return true;
}

function createGameplayRolls() {
  return Object.freeze({
    fieldingExecution: Math.random(),
    fieldingResult: Math.random(),
    throwExecution: Math.random(),
    result: Math.random()
  });
}

function createOffensiveGameplayRolls() {
  return Object.freeze({
    execution: Math.random(),
    battedBall: Math.random(),
    defense: Math.random(),
    result: Math.random(),
    runnerAdvance: Math.random()
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
  applySkillEffects(choice.skillEffects, getNarrativeCapabilityMutationSource("youth_match_grounder", `${approach}:${throwDecision || "fielding"}`));
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

function getHighSchoolSpringApproachChoice(approach) {
  return getEvent("high_school_year_two_spring_game")?.choices?.find(choice => choice.gameplayApproach === approach) || null;
}

function applyIntegratedOffensivePlayResult(result) {
  if (!result || result.status !== "resolved" || result.stage !== "complete" || !result.mutation) {
    return { ok: false, error: "invalid-integrated-offensive-result" };
  }
  const mutation = result.mutation;
  if (
    !Number.isInteger(mutation.outsAdded) ||
    !Number.isInteger(mutation.runsScored) ||
    !Array.isArray(mutation.runners) ||
    mutation.runners.length !== 3 ||
    !mutation.runners.every(value => typeof value === "boolean") ||
    typeof mutation.performanceDelta !== "number" ||
    typeof mutation.resultFlag !== "string" ||
    !mutation.resultFlag
  ) {
    return { ok: false, error: "invalid-integrated-offensive-mutation" };
  }
  player.matchState.outs = Math.min(3, (Number(player.matchState.outs) || 0) + mutation.outsAdded);
  player.matchState.runners = mutation.runners.slice();
  player.matchState.homeScore = (Number(player.matchState.homeScore) || 0) + mutation.runsScored;
  player.seasonPerformance += mutation.performanceDelta;
  return { ok: true };
}

function createIntegratedHighSchoolSpringChoice(approach, result) {
  const approachChoice = getHighSchoolSpringApproachChoice(approach) || {};
  return Object.assign({}, approachChoice, {
    text: approachChoice.text || approach,
    flags: [...(approachChoice.flags || []), result.mutation.resultFlag],
    memory: result.narrative
  });
}

function completeIntegratedHighSchoolSpringAtBat(result, approach) {
  const pending = pendingBaseballGameplay;
  if (
    !pending ||
    pending.eventId !== "high_school_year_two_spring_game" ||
    pending.gameplayFamily !== "offense" ||
    pending.stage !== "resolving-at-bat"
  ) return false;
  if (
    typeof BaseballGameplayIntegration !== "object" ||
    BaseballGameplayIntegration.getHighSchoolYearTwoSpringSnapshotKey(player) !== pending.playerSnapshotKey
  ) {
    clearPendingBaseballGameplay();
    isTransitioning = false;
    setChoiceTransitionState(false);
    showNotice("場上狀態已改變，請重新處理這個打席。", "warning");
    showCurrentEvent();
    return false;
  }

  pending.stage = "committing";
  pending.resolvedPlay = result;
  const before = getPlayerSnapshot();
  const choice = createIntegratedHighSchoolSpringChoice(approach, result);
  const applied = applyIntegratedOffensivePlayResult(result);
  if (!applied.ok) {
    clearPendingBaseballGameplay();
    isTransitioning = false;
    setChoiceTransitionState(false);
    showNotice("本次場上處理無法完成，請重新選擇。", "error");
    showCurrentEvent();
    return false;
  }

  applyConsequenceAtEvent("high_school_year_two_spring_game");
  applyEffects(choice.effects);
  addPersonalityEffects(choice.personalityEffects);
  addImpressionEffects(choice.impressionEffects);
  applyCharacterArcEffects(choice.arcEffects);
  const capabilityMutationSource = getNarrativeCapabilityMutationSource("high_school_year_two_spring_game", approach);
  applySkillEffects(choice.skillEffects, capabilityMutationSource);
  applyNestedEffects("relationships", choice.relationshipEffects);
  applyNestedEffects("positionAffinity", choice.positionEffects);
  applyBodyEffects(choice.bodyEffects);
  applyAcademicEffects(choice.academicEffects);
  applyHighSchoolEffects(choice.highSchoolEffects);
  applyCareerEffects(choice.careerEffects);
  applyFinanceEffects(choice.financeEffects);
  addFlags(choice.flags);
  (choice.callbackUnlocks || []).forEach(unlockCallback);
  (choice.callbackResolves || []).forEach(item => resolveCallback(typeof item === "string" ? item : item.id, typeof item === "string" ? 1 : item.impact));
  (choice.consequences || []).forEach(addConsequence);
  addLifeThemeEffects(choice.lifeThemeEffects);
  resolveCallbacksForEvent("high_school_year_two_spring_game");
  applyTrainingFocusBonus(choice, capabilityMutationSource);
  updateGoalProgressForChoice("high_school_year_two_spring_game", choice);
  if (choice.memory) {
    player.memories.push(choice.memory);
    player.memories = player.memories.slice(-20);
  }
  updateRoute();
  updateImpression();
  processCareerArcEvent("high_school_year_two_spring_game", choice);
  processEmotionalEvent("high_school_year_two_spring_game", choice);
  processRelationshipPayoffs("high_school_year_two_spring_game");
  processAspirationEvent("high_school_year_two_spring_game", choice);
  recordContinuityOutcome(choice.continuityOutcome || createContinuityOutcome("high_school_year_two_spring_game", choice));
  advanceNarrativeThread("high_school_year_two_spring_game", choice);
  const statFeedbackHtml = showStatChanges(before, getPlayerSnapshot(), choice.memory, { includeMemory: false });

  advanceAfterAction(null, "high_school_year_two_spring_game");
  tickPendingEvents("high_school_year_two_spring_game");
  clearPendingBaseballGameplay();
  renderYouthSeasonOutcome("high_school_year_two_spring_game", choice, statFeedbackHtml);
  return true;
}

function chooseHighSchoolSpringApproach(approach) {
  if (
    isTransitioning ||
    pendingBaseballGameplay ||
    getCurrentEventId() !== "high_school_year_two_spring_game"
  ) return false;
  const choice = getHighSchoolSpringApproachChoice(approach);
  if (
    !choice ||
    typeof BaseballGameplayIntegration !== "object" ||
    typeof BaseballGameplayIntegration.resolveHighSchoolYearTwoSpringAtBat !== "function"
  ) {
    showNotice("這個打席策略目前不能使用。", "warning");
    return false;
  }

  isTransitioning = true;
  setChoiceTransitionState(true);
  const rolls = createOffensiveGameplayRolls();
  pendingBaseballGameplay = {
    eventId: "high_school_year_two_spring_game",
    gameplayFamily: "offense",
    stage: "resolving-at-bat",
    approach,
    rolls,
    resolvedPlay: null,
    playerSnapshotKey: BaseballGameplayIntegration.getHighSchoolYearTwoSpringSnapshotKey(player)
  };
  const result = BaseballGameplayIntegration.resolveHighSchoolYearTwoSpringAtBat(player, approach, rolls);
  if (!result || result.status !== "resolved" || result.stage !== "complete") {
    clearPendingBaseballGameplay();
    isTransitioning = false;
    setChoiceTransitionState(false);
    showNotice("本次場上處理無法完成，請重新選擇。", "error");
    showCurrentEvent();
    return false;
  }
  return completeIntegratedHighSchoolSpringAtBat(result, approach);
}

function renderIntegratedHighSchoolSpringAtBat(event, prepared = {}) {
  const text = prepared.text || (typeof event.text === "function" ? event.text() : event.text);
  const buttons = event.choices
    .filter(choice => choice.gameplayApproach)
    .map(choice => `<button type="button" onclick="chooseHighSchoolSpringApproach('${choice.gameplayApproach}')">${escapeHtml(choice.text)}</button>`)
    .join("");
  const sceneContextHtml = prepared.sceneContextHtml || renderSceneContext(getSceneContext("high_school_year_two_spring_game", event));
  const competitionFrame = prepared.competitionFrame || renderCompetitionPresentation("high_school_year_two_spring_game");
  const scoreFrame = renderHighSchoolSpringScore();
  const bridgeInHtml = prepared.bridgeInHtml || "";
  const bridgeOutHtml = prepared.bridgeOutHtml || "";
  document.getElementById("story").innerHTML = `<article class="event-card integrated-gameplay-card" aria-labelledby="currentEventTitle">${sceneContextHtml}${competitionFrame}${scoreFrame}${bridgeInHtml}<div class="event-kicker">打席策略</div><h2 id="currentEventTitle" tabindex="-1">${escapeHtml(event.title)}</h2><div class="event-text">${escapeHtml(text)}</div>${bridgeOutHtml}</article>`;
  document.getElementById("choices").innerHTML = buttons;
}

function renderHighSchoolSpringScore() {
  const match = player.matchState || {};
  const runners = Array.isArray(match.runners) ? match.runners.slice(0, 3) : [false, false, false];
  const bases = runners.map((occupied, index) => `<span class="base ${occupied ? "occupied" : ""}" title="${index + 1}壘"></span>`).join("");
  return `<div class="competition-score" aria-label="目前比分與壘況">
    <span class="score-line">客隊 <strong>${Number(match.awayScore) || 0}</strong><i>：</i><strong>${Number(match.homeScore) || 0}</strong> 高中球隊</span>
    <div class="diamond">${bases}</div>
  </div>`;
}

function formatHighSchoolMatchRunners(runners = []) {
  const occupied = ["一壘", "二壘", "三壘"].filter((_, index) => Boolean(runners[index]));
  return occupied.length ? `${occupied.join("、")}有人` : "壘上無人";
}

function getHighSchoolHalfInningIndex(inning, half) {
  const normalizedInning = Math.max(1, Math.floor(Number(inning) || 1));
  return ((normalizedInning - 1) * 2) + (half === "下" ? 1 : 0);
}

function getHighSchoolHalfInningFromIndex(index) {
  const normalizedIndex = Math.max(0, Math.floor(Number(index) || 0));
  return Object.freeze({ inning: Math.floor(normalizedIndex / 2) + 1, half: normalizedIndex % 2 ? "下" : "上" });
}

function getHighSchoolScoreboardRevealHalfIndex(match) {
  return Math.max(0, Math.floor(Number(match?.scoreboardRevealHalfIndex) || 0));
}

function needsHighSchoolScoreboardReveal(match) {
  if (!match || match.completed || !["上", "下"].includes(match.half)) return false;
  return getHighSchoolScoreboardRevealHalfIndex(match) < getHighSchoolHalfInningIndex(match.inning, match.half);
}

function getHighSchoolScoreboardRevealFeed(match) {
  const revealIndex = getHighSchoolScoreboardRevealHalfIndex(match);
  const current = getHighSchoolHalfInningFromIndex(revealIndex);
  const feed = [];
  if (revealIndex > 0) {
    const previous = getHighSchoolHalfInningFromIndex(revealIndex - 1);
    const team = previous.half === "上" ? "away" : "home";
    const runs = Number(match.lineScore?.[team]?.[previous.inning - 1]) || 0;
    feed.push({
      type: "halfInningEnd",
      priority: 4,
      text: `${previous.inning}局${previous.half}結束，${team === "home" ? "我方" : "對手"}${runs ? `攻下 ${runs} 分` : "沒有得分"}。`
    });
  }
  feed.push({ type: "scoreboardReveal", priority: 2, text: `${current.inning}局${current.half}正在進行。` });
  return feed;
}

function renderHighSchoolLineScore(model) {
  const headings = model.scoreboard.innings.map(inning => `<th scope="col">${inning}</th>`).join("");
  const renderTeam = team => `<tr><th scope="row">${escapeHtml(team.name)}</th>${team.cells.map(run => `<td${run === "…" ? ' class="line-score-in-progress" aria-label="本半局進行中"' : ""}>${run === null ? "—" : run}</td>`).join("")}<td class="line-score-total">${team.visibleTotal}</td></tr>`;
  return `<section class="match-scoreboard" aria-labelledby="matchScoreboardTitle">
    <div class="match-section-heading"><span id="matchScoreboardTitle">7 局記分板</span><small>${model.scoreboard.innings.length > model.regulationInnings ? "延長賽" : "秋季交流賽"}</small></div>
    <div class="line-score-wrap" tabindex="0">
      <table class="line-score-table">
        <thead><tr><th scope="col">球隊</th>${headings}<th scope="col">R</th></tr></thead>
        <tbody>${renderTeam(model.scoreboard.away)}${renderTeam(model.scoreboard.home)}</tbody>
      </table>
    </div>
  </section>`;
}

function renderHighSchoolLiveSituation(model) {
  const bases = model.bases.map((occupied, index) => `<span class="base ${occupied ? "occupied" : ""}" title="${index + 1}壘" aria-label="${index + 1}壘${occupied ? "有人" : "無人"}"></span>`).join("");
  const outs = model.outs.map((active, index) => `<span class="out-light ${active ? "is-on" : ""}" aria-label="第 ${index + 1} 個出局${active ? "已記錄" : "未記錄"}"></span>`).join("");
  const situation = model.completed ? "終場" : `${model.currentSituation.inning} 局${escapeHtml(model.currentSituation.half)}`;
  return `<section class="match-live-situation" aria-labelledby="matchSituationTitle">
    <div class="match-section-heading"><span id="matchSituationTitle">目前局勢</span><small>${situation}</small></div>
    <div class="match-situation-body">
      <div class="diamond" aria-label="${escapeHtml(formatHighSchoolMatchRunners(model.currentSituation.runners))}">${bases}</div>
      <div class="match-outs"><span>${model.currentSituation.outs} OUT</span><span class="out-lights">${outs}</span></div>
      <p><strong>${model.currentSituation.score.away}：${model.currentSituation.score.home}</strong>｜${escapeHtml(formatHighSchoolMatchRunners(model.currentSituation.runners))}</p>
      <small>你的守位：${escapeHtml(model.currentSituation.position)}</small>
    </div>
  </section>`;
}

function renderHighSchoolLiveFeed(model) {
  const items = model.feed.length
    ? model.feed.map(item => `<li class="match-feed-${escapeHtml(item.type)}">${escapeHtml(item.text)}</li>`).join("")
    : `<li class="match-feed-waiting">${model.completed ? "終場紀錄已確認。" : "等待下一段比賽推進。"}</li>`;
  return `<section class="match-live-feed" aria-labelledby="matchFeedTitle">
    <div class="match-section-heading"><span id="matchFeedTitle">場上紀錄</span><small>最近進展</small></div>
    <ol>${items}</ol>
  </section>`;
}

function renderHighSchoolCurrentBatter(model) {
  const batter = model.currentSituation.currentBatter;
  if (!batter) return "";
  return `<section class="match-current-batter" aria-labelledby="matchCurrentBatterTitle">
    <small id="matchCurrentBatterTitle">目前打者</small>
    <strong>第${batter.battingOrderNumber}棒｜${escapeHtml(batter.name)}</strong>
    <span>${escapeHtml(batter.handedness)}</span>
  </section>`;
}

function renderHighSchoolCoachDirection(model) {
  const domainLabel = model.coachDirection.domain === "defense" ? "守備" : model.completed ? "賽後" : "進攻";
  return `<section class="coach-tactical-box" aria-labelledby="coachTacticalTitle">
    <div class="match-section-heading"><span id="coachTacticalTitle">教練席</span><small>${domainLabel}指示</small></div>
    <p>${escapeHtml(model.coachLine)}</p>
    <small class="coach-priority">戰術期待：${escapeHtml(model.coachDirection.priority || "完成目前任務")}</small>
  </section>`;
}

function renderHighSchoolOpponentInformation(model) {
  const observation = model.defensiveObservation;
  if (!observation) return "";
  const runners = observation.runners.length
    ? observation.runners.map(runner => `<li><strong>${escapeHtml(runner.label)}</strong>：腳程${escapeHtml(runner.speed)}</li>`).join("")
    : "";
  const runnerList = runners ? `<ul class="match-speed-list">${runners}</ul>` : "";
  const cues = observation.cues.filter(Boolean).map(cue => `<li>${escapeHtml(cue)}</li>`).join("");
  return `<section class="match-observable-information" aria-labelledby="matchObservationTitle">
    <div class="match-section-heading"><span id="matchObservationTitle">球來之前的局面</span><small>只顯示場上可見線索</small></div>
    <div class="match-ball-context"><strong>球況：${escapeHtml(observation.ballContext.label)}</strong><span>${escapeHtml(observation.infield ? `${observation.infield.direction}；${observation.infield.depth}。` : observation.ballContext.detail)}</span></div>
    <div class="match-observation-grid">
      <div><strong>打者：${escapeHtml(observation.batter.name)}</strong><span>${escapeHtml(observation.batter.handedness)}｜腳程${escapeHtml(observation.batter.speed)}</span></div>
      ${runnerList}
    </div>
    <ul class="match-cue-list">${cues}</ul>
  </section>`;
}

function isHighSchoolMatchPlaybackPhase(match = player.highSchoolMatch) {
  if (!match || match.completed) return false;
  if (["moment_1_ready", "moment_2_ready", "moment_3_ready", "offensive_agency_ready"].includes(match.simulationPhase)) {
    return !isHighSchoolMatchDecisionVisible(match);
  }
  const resolvedPhase = ["moment_1_resolved", "moment_2_resolved", "moment_3_resolved"].includes(match.simulationPhase);
  return Boolean(match.pendingGameSettlement)
    || needsHighSchoolScoreboardReveal(match)
    || resolvedPhase
    || match.simulationPhase === "full_match_flow";
}

function renderHighSchoolYearOneScore(layout = "full", suppliedModel = null) {
  const model = suppliedModel || getHighSchoolMatchPresentation();
  const header = `<header class="match-information">
      <span>秋季交流賽</span>
      <strong>${escapeHtml(model.scoreboard.away.name)} vs ${escapeHtml(model.scoreboard.home.name)}</strong>
      <small>${escapeHtml(model.playerRole)}・${escapeHtml(model.entryHistory)}</small>
    </header>
    ${renderHighSchoolLineScore(model)}`;
  if (layout === "header") return `<div class="high-school-match-screen match-mode-scoreboard" aria-label="秋季交流賽即時記分板">${header}</div>`;
  return `<div class="high-school-match-screen match-mode-entry" aria-label="秋季交流賽即時比賽畫面">
    ${header}
    <div class="match-live-grid">${renderHighSchoolLiveSituation(model)}${renderHighSchoolLiveFeed(model)}</div>
  </div>`;
}

function getHighSchoolFirstOffensiveMomentRolePresentation(match) {
  const actualLineupStatus = match?.playerLineupStatus || "";
  const playerEntered = match?.playerEntryCompleted === true;
  if (actualLineupStatus === "starter" && playerEntered) {
    return "你在先發計畫裡迎來前段打席。";
  }
  if (actualLineupStatus === "substitute" && playerEntered) {
    const entryEvent = (match.simulationLog || []).find(event => event.type === "playerEntry");
    const appearanceType = entryEvent?.plannedAppearanceType || match.gameExposureState?.plannedUsage?.appearanceType || "lateGameAppearance";
    if (appearanceType === "pinchHit") return "教練叫到你的名字，你準備代打，迎來進入本場後的第一個打席。";
    return "你替補進入本場打序後，迎來上場後的第一個打席。";
  }
  return "你仍在板凳等待正式進場，目前不會生成玩家打席。";
}

function getHighSchoolYearOneMatchPresentation() {
  const match = prepareHighSchoolYearOneMatch();
  const visibleState = getHighSchoolMatchPresentation(match).currentSituation;
  const context = match.simulationPhase === "full_match_flow"
    ? match.playerLineupStatus === "bench"
      ? `${visibleState.inning}局${visibleState.half}持續進行，你仍在板凳讀取打者與教練指示；尚未被叫進打序或守備位置。`
      : `${visibleState.inning}局${visibleState.half}持續進行，你已在先發打序與守備配置中，等待比賽自然輪到你的任務。`
    : match.momentIndex === 0
    ? getHighSchoolFirstOffensiveMomentRolePresentation(match)
    : match.momentIndex === 1
      ? getHighSchoolDefensiveSituationText(match)
      : `${formatHighSchoolMatchRunners(match.runners)}；這個打席代表${getHighSchoolOffensiveObjectiveContext(match)}。\n投手目前的處理：${match.opponentAdjustment}`;
  const previous = match.previousMomentOutcome && match.currentDomain !== "defense" ? `\n前一個結果：${match.previousMomentOutcome}` : "";
  const currentPosition = match.playerLineupStatus === "bench"
    ? "板凳待命"
    : match.playerFieldingAssignment || match.currentFieldingPosition || match.position;
    return `目前守位：${currentPosition}\n投打：${formatHandedness(player.bats, player.throws)}${previous}\n\n${context}\n\n你要靠自己的反應、接球、傳球與打擊能力完成眼前任務。`;
}

function renderHighSchoolYearOneMatch(event, prepared = {}) {
  const match = prepareHighSchoolYearOneMatch();
  const decisionActive = isHighSchoolMatchDecisionVisible(match);
  const agencyActive = decisionActive && match.simulationPhase === "offensive_agency_ready";
  if (decisionActive && !agencyActive) markHighSchoolMatchDecisionLifecycle("presented", match);
  const playbackActive = !decisionActive;
  const uiMode = decisionActive ? "match-decision-mode" : "match-flow-mode";
  const choices = decisionActive ? getHighSchoolYearOneMatchMomentChoices(match) : [];
  const buttons = choices.map(choice => {
    const readiness = choice.successChanceHint || choice.readiness?.level
      ? `<span class="match-choice-readiness"><strong>${choice.successChanceHint ? "成功機會" : "執行把握"}：${escapeHtml(choice.successChanceHint || { high: "高", medium: "中", low: "低" }[choice.readiness.level] || "中")}</strong>${choice.readiness?.reasons?.[0] ? `<small>${escapeHtml(choice.readiness.reasons[0])}</small>` : ""}${choice.strategicTradeoff ? `<small>取捨：${escapeHtml(choice.strategicTradeoff)}</small>` : ""}</span>`
      : "";
    const handler = choice.agencyDecision
      ? `chooseHighSchoolOffensiveAgency('${choice.agencyDecision}', '${choice.matchMomentId}')`
      : `chooseHighSchoolYearOneMatchMoment('${choice.matchDecision}', '${choice.matchMomentId}')`;
    return `<button type="button" onclick="${handler}"><span>${escapeHtml(choice.text)}</span>${readiness}</button>`;
  }).join("");
  const text = prepared.text || getHighSchoolYearOneMatchPresentation();
  const sceneContextHtml = prepared.sceneContextHtml || renderSceneContext(getSceneContext("high_school_showcase", event));
  const bridgeInHtml = prepared.bridgeInHtml || "";
  const bridgeOutHtml = prepared.bridgeOutHtml || "";
  const model = getHighSchoolMatchPresentation(match);
  const kicker = playbackActive ? "同一場交流賽・場上進行中"
    : agencyActive ? "同一場交流賽・打席參與方式" : `同一場交流賽・第 ${match.completedMoments.length + 1} 個關鍵時刻`;
  const decisionContext = decisionActive
    ? `${agencyActive ? renderHighSchoolOffensiveAgencyContext(match) : match.currentDomain === "offense" ? `${renderHighSchoolPlateAppearanceContext(match)}${renderHighSchoolBatterAnticipationPanel(match)}` : ""}${agencyActive ? "" : `${renderHighSchoolOpponentInformation(model)}${renderHighSchoolCoachDirection(model)}`}`
    : "";
  document.getElementById("story").innerHTML = `<article class="event-card high-school-match-card match-mode ${uiMode}" aria-labelledby="currentEventTitle">${sceneContextHtml}${renderHighSchoolYearOneScore("header", model)}${bridgeInHtml}<div class="match-mode-lower-grid"><div class="match-mode-context-column">${renderHighSchoolLiveSituation(model)}${renderHighSchoolLiveFeed(model)}${bridgeOutHtml ? `<div class="match-mode-recall">${bridgeOutHtml}</div>` : ""}</div><div class="match-mode-decision-column"><div class="event-kicker">${kicker}</div><h2 id="currentEventTitle" tabindex="-1">${escapeHtml(event.title)}</h2>${renderHighSchoolCurrentBatter(model)}<section class="match-current-assignment" aria-labelledby="matchAssignmentTitle"><small id="matchAssignmentTitle">${playbackActive ? "目前賽況" : "目前任務"}</small><strong>${escapeHtml(model.currentSituation.assignment)}</strong></section><section class="match-recent-context" aria-label="最近賽況"><small>最近賽況</small><div class="event-text">${escapeHtml(text)}</div></section>${decisionContext}</div></div></article>`;
  document.getElementById("choices").innerHTML = playbackActive
    ? `<div class="match-playback-status" role="status"><strong>場上正在進行下一個打席</strong><span>輪到你的關鍵判斷時，比賽會停下來。</span></div>`
    : `<section class="match-player-decisions" aria-labelledby="matchDecisionTitle"><small id="matchDecisionTitle">${agencyActive ? "這個打席要怎麼進行？" : "你的決定"}</small><div class="match-decision-buttons">${buttons}</div></section>`;
  document.getElementById("choices").innerHTML += renderHighSchoolMatchOpportunityDebugControls();
}

function setHighSchoolMatchPlaybackDebugEnabled(enabled = true) {
  highSchoolMatchPlaybackDebugEnabled = Boolean(enabled);
  return highSchoolMatchPlaybackDebugEnabled;
}

function clearHighSchoolMatchPlaybackTrace() {
  highSchoolMatchPlaybackTrace = [];
  highSchoolMatchPlaybackDebugStep = 0;
}

function getHighSchoolMatchPlaybackTrace() {
  return Object.freeze(highSchoolMatchPlaybackTrace.map(entry => Object.freeze({ ...entry })));
}

function recordHighSchoolMatchPlaybackTrace(action, reason = "", match = player.highSchoolMatch, details = {}) {
  if (!highSchoolMatchPlaybackDebugEnabled) return null;
  const log = Array.isArray(match?.simulationLog) ? match.simulationLog : [];
  const cursor = getHighSchoolPresentedEventCursor(match);
  const presentedEvent = getHighSchoolPresentedEvent(match);
  const entry = {
    timestampOrStep: ++highSchoolMatchPlaybackDebugStep,
    action,
    reason,
    cursor,
    logLength: log.length,
    phase: typeof match?.simulationPhase === "string" ? match.simulationPhase : "",
    eventType: details.eventType || presentedEvent?.type || "",
    matchCompleted: Boolean(match?.completed),
    decisionActive: isHighSchoolMatchDecisionVisible(match),
    blockingOutcome: hasBlockingHighSchoolMatchOutcome(),
    timerHandlePresent: highSchoolMatchPlaybackTimer !== null,
    timerScheduledFlag: highSchoolMatchPlaybackScheduled,
    timerGeneration: highSchoolMatchPlaybackTimerGeneration,
    activeGeneration: highSchoolMatchPlaybackGeneration,
    callbackStarted: Boolean(details.callbackStarted),
    callbackCompleted: Boolean(details.callbackCompleted),
    callbackStatus: details.callbackStatus || "",
    result: details.result || ""
  };
  highSchoolMatchPlaybackTrace.push(entry);
  if (highSchoolMatchPlaybackTrace.length > 1200) highSchoolMatchPlaybackTrace.shift();
  return entry;
}

function isHighSchoolMatchOpportunityDebugMode() {
  if (highSchoolMatchOpportunityDebugEnabled) return true;
  if (typeof window === "undefined" || typeof window.location?.search !== "string") return false;
  return new URLSearchParams(window.location.search).get("matchDebug") === "1";
}

function setHighSchoolMatchOpportunityDebugEnabled(enabled = true) {
  highSchoolMatchOpportunityDebugEnabled = Boolean(enabled);
  if (highSchoolMatchOpportunityDebugEnabled && player.highSchoolMatch?.id === "hs-y1-autumn-exhibition") {
    ensureHighSchoolMatchOpportunityTrace(player.highSchoolMatch);
  }
  return highSchoolMatchOpportunityDebugEnabled;
}

function cloneHighSchoolMatchOpportunityDebugValue(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

const MATCH_DECISION_DENSITY_VERSION = "match-decision-density-v1";
const MATCH_DECISION_ABSOLUTE_SAFETY_CAP = 6;
const MATCH_DECISION_REPEAT_SPACING = 8;
const MATCH_DECISION_MAX_CONSECUTIVE = 2;

function createHighSchoolMatchDecisionDensityState() {
  return {
    version: MATCH_DECISION_DENSITY_VERSION,
    defensiveMeaningfulDecisionCount: 0,
    lastDecisionPlayIndex: -1,
    lastNoveltyKey: "",
    recentSituationFamilies: [],
    recentRouteFamilies: [],
    repeatedOpportunityCount: 0,
    suppressedOpportunityCount: 0,
    currentConsecutiveMeaningfulDecisions: 0,
    maxConsecutiveMeaningfulDecisions: 0,
    lastDecisionInning: 0,
    lastDecisionHalf: "",
    lastSelectedRoute: "",
    lastFinalRoute: "",
    offensiveDecisionCount: 0,
    lastOffensiveDecisionPA: 0,
    lastOffensiveDecisionPlayIndex: -1,
    lastOffensiveNoveltyKey: "",
    recentOffensiveSituationFamilies: [],
    offensiveSuppressedCount: 0,
    offensiveRepeatSuppressedCount: 0,
    lastOffensiveDecisionInning: 0,
    lastOffensiveDecisionHalf: ""
  };
}

function normalizeHighSchoolMatchDecisionDensityState(saved = {}) {
  const state = Object.assign(createHighSchoolMatchDecisionDensityState(), saved || {});
  state.version = MATCH_DECISION_DENSITY_VERSION;
  state.defensiveMeaningfulDecisionCount = Math.max(0, Math.floor(Number(saved?.defensiveMeaningfulDecisionCount) || 0));
  state.lastDecisionPlayIndex = Number.isFinite(Number(saved?.lastDecisionPlayIndex)) ? Math.floor(Number(saved.lastDecisionPlayIndex)) : -1;
  state.lastNoveltyKey = typeof saved?.lastNoveltyKey === "string" ? saved.lastNoveltyKey : "";
  state.recentSituationFamilies = Array.isArray(saved?.recentSituationFamilies) ? saved.recentSituationFamilies.filter(value => typeof value === "string").slice(-6) : [];
  state.recentRouteFamilies = Array.isArray(saved?.recentRouteFamilies) ? saved.recentRouteFamilies.filter(value => typeof value === "string").slice(-6) : [];
  state.repeatedOpportunityCount = Math.max(0, Math.floor(Number(saved?.repeatedOpportunityCount) || 0));
  state.suppressedOpportunityCount = Math.max(0, Math.floor(Number(saved?.suppressedOpportunityCount) || 0));
  state.currentConsecutiveMeaningfulDecisions = Math.max(0, Math.floor(Number(saved?.currentConsecutiveMeaningfulDecisions) || 0));
  state.maxConsecutiveMeaningfulDecisions = Math.max(state.currentConsecutiveMeaningfulDecisions, Math.floor(Number(saved?.maxConsecutiveMeaningfulDecisions) || 0));
  state.lastDecisionInning = Math.max(0, Math.floor(Number(saved?.lastDecisionInning) || 0));
  state.lastDecisionHalf = typeof saved?.lastDecisionHalf === "string" ? saved.lastDecisionHalf : "";
  state.lastSelectedRoute = typeof saved?.lastSelectedRoute === "string" ? saved.lastSelectedRoute : "";
  state.lastFinalRoute = typeof saved?.lastFinalRoute === "string" ? saved.lastFinalRoute : "";
  state.offensiveDecisionCount = Math.max(0, Math.floor(Number(saved?.offensiveDecisionCount) || 0));
  state.lastOffensiveDecisionPA = Math.max(0, Math.floor(Number(saved?.lastOffensiveDecisionPA) || 0));
  state.lastOffensiveDecisionPlayIndex = Number.isFinite(Number(saved?.lastOffensiveDecisionPlayIndex)) ? Math.floor(Number(saved.lastOffensiveDecisionPlayIndex)) : -1;
  state.lastOffensiveNoveltyKey = typeof saved?.lastOffensiveNoveltyKey === "string" ? saved.lastOffensiveNoveltyKey : "";
  state.recentOffensiveSituationFamilies = Array.isArray(saved?.recentOffensiveSituationFamilies)
    ? saved.recentOffensiveSituationFamilies.filter(value => typeof value === "string").slice(-6) : [];
  state.offensiveSuppressedCount = Math.max(0, Math.floor(Number(saved?.offensiveSuppressedCount) || 0));
  state.offensiveRepeatSuppressedCount = Math.max(0, Math.floor(Number(saved?.offensiveRepeatSuppressedCount) || 0));
  state.lastOffensiveDecisionInning = Math.max(0, Math.floor(Number(saved?.lastOffensiveDecisionInning) || 0));
  state.lastOffensiveDecisionHalf = typeof saved?.lastOffensiveDecisionHalf === "string" ? saved.lastOffensiveDecisionHalf : "";
  return state;
}

function ensureHighSchoolMatchDecisionDensityState(match = player.highSchoolMatch) {
  if (!match) return null;
  match.matchDecisionDensityState = normalizeHighSchoolMatchDecisionDensityState(match.matchDecisionDensityState);
  return match.matchDecisionDensityState;
}

function getHighSchoolDefensiveRunnerTopology(runners = []) {
  return runners.slice(0, 3).map(Boolean).map(Number).join("");
}

function getHighSchoolDefensiveRouteFamily(choices = []) {
  return [...new Set(choices.filter(choice => choice && choice.executionOnly !== true && choice.legal !== false && choice.viable !== false)
    .map(choice => choice.routeId || choice.infieldRoute || choice.route || "").filter(Boolean))].sort().join("+");
}

function createHighSchoolDefensiveNoveltyDescriptor(situation, legalChoices = []) {
  const routeFamily = getHighSchoolDefensiveRouteFamily(legalChoices);
  const topology = getHighSchoolDefensiveRunnerTopology(situation?.runners || []);
  const leverage = situation?.scoreContext?.runPriority || "balanced";
  const situationFamily = [situation?.scenarioFamily || "infield", topology, Number(situation?.outs) || 0,
    situation?.responsibility?.playerRole || "", situation?.ballContext?.type || "", situation?.ballDirection || "", leverage].join("|");
  return Object.freeze({
    situationFamily,
    routeFamily,
    noveltyKey: `${situationFamily}|${routeFamily}`,
    topology,
    leverage
  });
}

function evaluateHighSchoolMatchDefensiveDecisionDensity(match, situation, legalChoices = [], classification = null) {
  const state = ensureHighSchoolMatchDecisionDensityState(match);
  const descriptor = createHighSchoolDefensiveNoveltyDescriptor(situation, legalChoices);
  const playIndex = Array.isArray(match?.simulationLog) ? match.simulationLog.length : 0;
  const spacing = state?.lastDecisionPlayIndex >= 0 ? playIndex - state.lastDecisionPlayIndex : Number.POSITIVE_INFINITY;
  const meaningfulCandidate = classification?.eventClassification === "playerMeaningfulDecision";
  const repeated = meaningfulCandidate && descriptor.noveltyKey === state?.lastNoveltyKey;
  const situationNovel = meaningfulCandidate && !state?.recentSituationFamilies.includes(descriptor.situationFamily);
  const routeNovel = meaningfulCandidate && !state?.recentRouteFamilies.includes(descriptor.routeFamily);
  let allowed = meaningfulCandidate;
  let suppressionReason = "";
  if (!meaningfulCandidate) {
    allowed = false;
    suppressionReason = "not-meaningful";
  } else if ((state?.defensiveMeaningfulDecisionCount || 0) >= 4 && !routeNovel) {
    allowed = false;
    suppressionReason = "route-family-density";
  } else if (repeated && spacing < MATCH_DECISION_REPEAT_SPACING) {
    allowed = false;
    suppressionReason = "repeated-situation-spacing";
  } else if ((state?.currentConsecutiveMeaningfulDecisions || 0) >= MATCH_DECISION_MAX_CONSECUTIVE && spacing <= 1) {
    allowed = false;
    suppressionReason = "decision-density-spacing";
  } else if ((state?.defensiveMeaningfulDecisionCount || 0) >= MATCH_DECISION_ABSOLUTE_SAFETY_CAP) {
    allowed = false;
    suppressionReason = "absolute-safety-cap";
  }
  return Object.freeze({
    version: MATCH_DECISION_DENSITY_VERSION,
    allowed,
    meaningfulCandidate,
    suppressionReason,
    playIndex,
    spacing: Number.isFinite(spacing) ? spacing : null,
    repeated,
    situationNovel,
    routeNovel,
    highNovelty: situationNovel || routeNovel,
    absoluteSafetyCap: MATCH_DECISION_ABSOLUTE_SAFETY_CAP,
    maxConsecutiveMeaningfulDecisions: MATCH_DECISION_MAX_CONSECUTIVE,
    ...descriptor
  });
}

function applyHighSchoolMatchDefensiveDecisionDensity(match, density, created) {
  const state = ensureHighSchoolMatchDecisionDensityState(match);
  if (!state || !density?.meaningfulCandidate) return state;
  if (!created) {
    state.suppressedOpportunityCount += 1;
    if (density.repeated) state.repeatedOpportunityCount += 1;
    state.currentConsecutiveMeaningfulDecisions = 0;
    return state;
  }
  state.defensiveMeaningfulDecisionCount += 1;
  state.lastDecisionPlayIndex = density.playIndex;
  state.lastNoveltyKey = density.noveltyKey;
  state.lastDecisionInning = Math.max(0, Math.floor(Number(match?.inning) || 0));
  state.lastDecisionHalf = typeof match?.half === "string" ? match.half : "";
  state.recentSituationFamilies = [...state.recentSituationFamilies, density.situationFamily].slice(-6);
  state.recentRouteFamilies = [...state.recentRouteFamilies, density.routeFamily].slice(-6);
  state.currentConsecutiveMeaningfulDecisions = density.spacing !== null && density.spacing <= 1
    ? state.currentConsecutiveMeaningfulDecisions + 1 : 1;
  state.maxConsecutiveMeaningfulDecisions = Math.max(state.maxConsecutiveMeaningfulDecisions, state.currentConsecutiveMeaningfulDecisions);
  state.lastDecisionInning = Math.max(1, Number(match?.inning) || 1);
  state.lastDecisionHalf = match?.half || "";
  return state;
}

function getHighSchoolMatchOpportunityOneShotState(match = player.highSchoolMatch) {
  const completed = Array.isArray(match?.completedMoments) ? match.completedMoments : [];
  const firstMomentId = highSchoolYearOneMomentIds[0];
  const defensiveMomentId = highSchoolYearOneMomentIds[1];
  const finalMomentId = highSchoolYearOneMomentIds[2];
  const firstOffensiveMomentUsed = completed.some(moment => moment.momentId === firstMomentId || (moment.domain === "offense" && completed.indexOf(moment) === 0));
  const defensiveDecisionAlreadyUsed = completed.some(moment => moment.momentId === defensiveMomentId || moment.domain === "defense");
  const emergentOffensiveMomentUsed = completed.some(moment => moment.momentId === finalMomentId)
    || completed.filter(moment => moment.domain === "offense").length > 1;
  return Object.freeze({
    momentIndex: Math.max(0, Number(match?.momentIndex) || 0),
    simulationPhase: typeof match?.simulationPhase === "string" ? match.simulationPhase : "",
    completedMomentCount: completed.length,
    firstOffensiveMomentUsed,
    defensiveDecisionAlreadyUsed,
    emergentOffensiveMomentUsed,
    defensiveDecisionWindowAvailable: match?.simulationPhase === "moment_1_resolved" && !defensiveDecisionAlreadyUsed,
    offensiveDecisionWindowAvailable: ["full_match_flow", "moment_2_resolved"].includes(match?.simulationPhase)
  });
}

function getHighSchoolMatchOpportunityAbilitySignature(subject = player) {
  return Object.freeze({
    ballSense: Number(subject?.ballSense) || 0,
    observe: Number(subject?.observe) || 0,
    fitness: Number(subject?.fitness) || 0,
    instinct: Number(subject?.instinct) || 0,
    discipline: Number(subject?.discipline) || 0,
    responsibility: Number(subject?.responsibility) || 0,
    baseballSkills: Object.freeze({ ...(subject?.baseballSkills || {}) })
  });
}

function getHighSchoolMatchOpportunityLineupSignature(match) {
  const signature = team => (match?.rosters?.[team]?.lineup || []).map(entity => [entity.id, entity.position, entity.bats || ""].join(":"));
  return Object.freeze({ home: Object.freeze(signature("home")), away: Object.freeze(signature("away")) });
}

function createHighSchoolMatchOpportunityHeader(match) {
  return Object.freeze({
    matchId: match?.id || "",
    seed: Number(match?.simulationSeed) || 0,
    rngStateAtStart: Object.freeze({ seed: Number(match?.simulationSeed) || 0, cursor: 0 }),
    directStartMode: match?.developmentFullMatchStart ? "highSchoolFullMatch" : "normalNarrative",
    role: match?.role || "",
    primaryPosition: player.primaryPosition || match?.position || "",
    secondaryPosition: player.secondaryPositions?.[0] || player.secondaryPosition || "",
    playerAbilities: getHighSchoolMatchOpportunityAbilitySignature(player),
    opponentId: match?.opponent || "",
    lineupSignature: getHighSchoolMatchOpportunityLineupSignature(match),
    entryRule: Object.freeze({
      lineupStatus: match?.playerLineupStatus || "",
      entryInning: Number(match?.playerEntryWindowInning) || 1,
      entryHalf: match?.playerLineupStatus === "starter" ? "上" : "下",
      requiresHomeOffense: match?.playerLineupStatus !== "starter"
    }),
    entryInning: match?.playerLineupStatus === "starter" ? 1 : Number(match?.playerEntryWindowInning) || 1,
    entryHalf: match?.playerLineupStatus === "starter" ? "上" : "下",
    buildVersionOrRuntimeSignature: BASEBALL_MATCH_BUILD_SIGNATURE
  });
}

function ensureHighSchoolMatchOpportunityTrace(match = player.highSchoolMatch) {
  if (!match || match.id !== "hs-y1-autumn-exhibition") return null;
  ensureHighSchoolMatchDecisionDensityState(match);
  if (!match.opportunityDebugTrace || match.opportunityDebugTrace.schemaVersion !== "2.2.4.4") {
    match.opportunityDebugTrace = {
      schemaVersion: "2.2.4.4",
      header: createHighSchoolMatchOpportunityHeader(match),
      opportunities: [],
      lifecycle: [],
      checkpoints: [{ stage: "match-initialized", oneShot: { ...getHighSchoolMatchOpportunityOneShotState(match) }, density: cloneHighSchoolMatchOpportunityDebugValue(match.matchDecisionDensityState), simulationCursor: Number(match.simulationCursor) || 0 }]
    };
  }
  return match.opportunityDebugTrace;
}

function getHighSchoolMatchOpportunityTrace(match = player.highSchoolMatch) {
  const trace = match?.opportunityDebugTrace || (isHighSchoolMatchOpportunityDebugMode() ? ensureHighSchoolMatchOpportunityTrace(match) : null);
  return trace ? cloneHighSchoolMatchOpportunityDebugValue(trace) : null;
}

function recordHighSchoolMatchOpportunityCheckpoint(stage, match = player.highSchoolMatch, details = {}) {
  const trace = match?.opportunityDebugTrace || (isHighSchoolMatchOpportunityDebugMode() ? ensureHighSchoolMatchOpportunityTrace(match) : null);
  if (!trace) return null;
  const checkpoint = {
    stage,
    inning: Number(match.inning) || 0,
    half: match.half || "",
    oneShot: { ...getHighSchoolMatchOpportunityOneShotState(match) },
    density: cloneHighSchoolMatchOpportunityDebugValue(ensureHighSchoolMatchDecisionDensityState(match)),
    simulationCursor: Number(match.simulationCursor) || 0,
    ...cloneHighSchoolMatchOpportunityDebugValue(details)
  };
  trace.checkpoints.push(checkpoint);
  return checkpoint;
}

function recordHighSchoolMatchOpportunityLifecycle(match, opportunity, stage, details = {}) {
  const trace = match?.opportunityDebugTrace;
  if (!trace || !opportunity?.decisionId) return null;
  if (trace.lifecycle.some(entry => entry.decisionId === opportunity.decisionId && entry.stage === stage)) return null;
  const entry = {
    decisionId: opportunity.decisionId,
    opportunityId: opportunity.opportunityId,
    domain: opportunity.domain,
    stage,
    inning: Number(match.inning) || 0,
    half: match.half || "",
    simulationLogIndex: Math.max(-1, (match.simulationLog?.length || 0) - 1),
    ...cloneHighSchoolMatchOpportunityDebugValue(details)
  };
  trace.lifecycle.push(entry);
  return entry;
}

function getHighSchoolMatchOpportunityRejectionReason({ decisionWindowAvailable, responsibilityCheck, legalRoutes = [], viableRoutes = [], gate = null, playerRole = "", density = null } = {}) {
  if (!decisionWindowAvailable) return "window-expired";
  if (!responsibilityCheck) return "no-player-responsibility";
  if (legalRoutes.length <= 1) return "only-one-legal-route";
  if (viableRoutes.length <= 1) return "only-one-viable-route";
  if ((gate?.meaningfulChoiceCount || 0) < 2) return ["cover", "coverPivot"].includes(playerRole) ? "routine-coverage" : "execution-only";
  if ((gate?.commitments || []).length < 2) return "duplicate-commitment";
  if ((gate?.tradeoffs || []).length < 2) return "no-real-tradeoff";
  if (density?.meaningfulCandidate && !density.allowed) return density.suppressionReason || "density-suppressed";
  return "not-created";
}

function beginHighSchoolMatchDefensiveOpportunity(match, batter, target) {
  const trace = match?.opportunityDebugTrace;
  if (!trace || !isHighSchoolMatchPlayerActive(match) || match.offenseTeam !== "away") return null;
  const oneShot = getHighSchoolMatchOpportunityOneShotState(match);
  const opportunity = {
    opportunityId: `${match.id}:defense:${trace.opportunities.filter(item => item.domain === "defense").length + 1}`,
    decisionId: "",
    domain: "defense",
    inning: match.inning,
    half: match.half,
    outsBefore: match.outs,
    basesBefore: match.runners.slice(0, 3),
    scoreBefore: { ...match.scores },
    batterId: batter?.id || match.currentBatter || "",
    playerEnteredGame: isHighSchoolMatchPlayerActive(match),
    playerCurrentPosition: match.playerFieldingAssignment || match.currentFieldingPosition || match.developmentPositionOverride || match.position || "",
    ballInPlay: false,
    ballContext: null,
    responsibilityCheck: false,
    primaryFielder: null,
    playerRole: "",
    playerRoles: [],
    legalRoutes: [],
    viableRoutes: [],
    candidateRoutes: [],
    routeWindows: {},
    density: null,
    densitySuppressionReason: "",
    noveltyKey: "",
    decisionWindowAvailable: target !== "firstOffense",
    defensiveDecisionAlreadyUsed: oneShot.defensiveDecisionAlreadyUsed,
    meaningfulDecisionCandidate: false,
    meaningfulDecisionCreated: false,
    defensiveDecisionCreated: false,
    defensiveDecisionPresented: false,
    defensiveDecisionResolved: false,
    rejectionReason: "",
    eventId: getCurrentEventId(),
    simulationLogIndex: match.simulationLog?.length || 0
  };
  trace.opportunities.push(opportunity);
  return opportunity;
}

function findHighSchoolMatchOpportunity(match, opportunityId) {
  return match?.opportunityDebugTrace?.opportunities?.find(item => item.opportunityId === opportunityId) || null;
}

function updateHighSchoolMatchDefensiveOpportunityFromSituation(match, opportunity, situation, legalChoices, classification) {
  if (!opportunity || !situation) return opportunity;
  const routeStatuses = Object.values(SECOND_BASE_ROUTE_DEFINITIONS).map(route => ({
    id: route.id,
    ...evaluateDefensiveRouteAvailability(situation, route),
    readiness: evaluateExecutionReadiness({ route, situation })
  }));
  const legalRoutes = routeStatuses.filter(route => route.legal).map(route => route.id);
  const viableRoutes = routeStatuses.filter(route => route.viable).map(route => route.id);
  const gate = classification?.gate || evaluatePositionDecisionMoment(situation, legalChoices);
  Object.assign(opportunity, {
    ballInPlay: true,
    ballContext: cloneHighSchoolMatchOpportunityDebugValue(situation.ballContext),
    responsibilityCheck: true,
    primaryFielder: cloneHighSchoolMatchOpportunityDebugValue(situation.responsibility?.primaryFielder || null),
    playerRole: situation.responsibility?.playerRole || "",
    playerRoles: (situation.responsibility?.playerRoles || []).slice(),
    legalRoutes,
    viableRoutes,
    candidateRoutes: cloneHighSchoolMatchOpportunityDebugValue(routeStatuses),
    routeWindows: cloneHighSchoolMatchOpportunityDebugValue(situation.routeWindows || {}),
    density: cloneHighSchoolMatchOpportunityDebugValue(classification?.density || null),
    densitySuppressionReason: classification?.density?.suppressionReason || "",
    noveltyKey: classification?.density?.noveltyKey || "",
    meaningfulDecisionCandidate: viableRoutes.length >= 2 && (gate.meaningfulChoiceCount || 0) >= 2 && (gate.commitments || []).length >= 2,
    meaningfulDecisionCreated: classification?.eventClassification === "playerMeaningfulDecision",
    defensiveDecisionCreated: classification?.eventClassification === "playerMeaningfulDecision"
  });
  if (opportunity.defensiveDecisionCreated) {
    opportunity.decisionId = `${opportunity.opportunityId}:decision`;
    opportunity.rejectionReason = "";
    recordHighSchoolMatchOpportunityLifecycle(match, opportunity, "created");
  } else {
    opportunity.rejectionReason = getHighSchoolMatchOpportunityRejectionReason({
      decisionWindowAvailable: opportunity.decisionWindowAvailable,
      responsibilityCheck: opportunity.responsibilityCheck,
      legalRoutes,
      viableRoutes,
      gate,
      playerRole: opportunity.playerRole,
      density: classification?.density
    });
  }
  return opportunity;
}

function finalizeHighSchoolMatchDefensiveOpportunity(match, opportunity, event = null, result = "") {
  if (!opportunity) return null;
  opportunity.ballInPlay = event?.result ? !["walk", "strikeout"].includes(event.result) : opportunity.ballInPlay;
  opportunity.result = result || event?.result || event?.type || "";
  opportunity.simulationLogIndex = Number.isFinite(Number(event?.sequence)) ? Number(event.sequence) : Math.max(0, (match.simulationLog?.length || 1) - 1);
  if (!opportunity.defensiveDecisionCreated && !opportunity.rejectionReason) {
    opportunity.rejectionReason = getHighSchoolMatchOpportunityRejectionReason({
      decisionWindowAvailable: opportunity.decisionWindowAvailable,
      responsibilityCheck: opportunity.responsibilityCheck,
      legalRoutes: opportunity.legalRoutes,
      viableRoutes: opportunity.viableRoutes,
      density: opportunity.density
    });
  }
  return opportunity;
}

function recordHighSchoolMatchOffensiveOpportunity(match, kind, choices = [], classification = null, density = null) {
  const trace = match?.opportunityDebugTrace;
  if (!trace) return null;
  const decisionCreated = ["scripted", "emergent", "classified"].includes(kind);
  const opportunity = {
    opportunityId: `${match.id}:offense:${trace.opportunities.filter(item => item.domain === "offense").length + 1}`,
    decisionId: "",
    domain: "offense",
    inning: match.inning,
    half: match.half,
    outs: match.outs,
    bases: match.runners.slice(0, 3),
    score: { ...match.scores },
    playerPANumber: classification?.playerPANumber || getHighSchoolOffensivePlayerPANumber(match),
    firstOffensiveMomentUsed: getHighSchoolMatchOpportunityOneShotState(match).firstOffensiveMomentUsed,
    availableObjectives: [...new Set(choices.map(choice => choice.objective).filter(Boolean))],
    availableApproaches: [...new Set(choices.map(choice => choice.approach).filter(Boolean))],
    scriptedDecisionCandidate: kind === "scripted",
    emergentDecisionCandidate: kind === "emergent",
    agencyOpportunityCandidate: kind === "agency",
    decisionCreated,
    decisionPresented: false,
    decisionResolved: false,
    leverageClass: classification?.leverageClass || (kind === "scripted" ? "scripted" : "routine"),
    opportunityClassification: classification ? cloneHighSchoolMatchOpportunityDebugValue(classification) : null,
    density: density ? cloneHighSchoolMatchOpportunityDebugValue(density) : null,
    noveltyKey: classification?.noveltyKey || "",
    rejectionReason: kind === "routine" ? (density?.suppressionReason || "routine-opportunity") : "",
    eventId: getCurrentEventId(),
    simulationLogIndex: match.simulationLog?.length || 0
  };
  if (opportunity.decisionCreated) opportunity.decisionId = `${opportunity.opportunityId}:decision`;
  trace.opportunities.push(opportunity);
  if (opportunity.decisionCreated) recordHighSchoolMatchOpportunityLifecycle(match, opportunity, "created");
  return opportunity;
}

function findActiveHighSchoolMatchDecisionOpportunity(match, domain = match?.currentDomain) {
  return [...(match?.opportunityDebugTrace?.opportunities || [])].reverse().find(item => item.domain === domain && item.decisionCreated !== false
    && (item.defensiveDecisionCreated || item.decisionCreated) && !(item.defensiveDecisionResolved || item.decisionResolved)) || null;
}

function markHighSchoolMatchDecisionLifecycle(stage, match = player.highSchoolMatch, details = {}) {
  const decisions = [...(match?.opportunityDebugTrace?.opportunities || [])].reverse().filter(item => item.defensiveDecisionCreated || item.decisionCreated);
  const opportunity = ["outcomePresented", "continue"].includes(stage)
    ? decisions.find(item => stage === "outcomePresented" ? !item.outcomePresented : item.outcomePresented && !item.continued)
    : findActiveHighSchoolMatchDecisionOpportunity(match, details.domain || match?.currentDomain);
  if (!opportunity) return null;
  if (stage === "presented") {
    opportunity.decisionPresented = true;
    if (opportunity.domain === "defense") opportunity.defensiveDecisionPresented = true;
  }
  if (stage === "choiceReceived") {
    opportunity.choiceReceived = true;
    opportunity.selectedDecision = details.decision || "";
  }
  if (stage === "resolved") {
    opportunity.decisionResolved = true;
    if (opportunity.domain === "defense") opportunity.defensiveDecisionResolved = true;
    opportunity.selectedRoute = details.selectedRoute || opportunity.selectedRoute || "";
    opportunity.finalRoute = details.finalRoute || opportunity.finalRoute || "";
  }
  if (stage === "outcomePresented") opportunity.outcomePresented = true;
  if (stage === "continue") opportunity.continued = true;
  recordHighSchoolMatchOpportunityLifecycle(match, opportunity, stage, details);
  return opportunity;
}

function getHighSchoolMatchOpportunitySummary(traceOrMatch = player.highSchoolMatch) {
  const trace = traceOrMatch?.opportunities ? traceOrMatch : traceOrMatch?.opportunityDebugTrace;
  const opportunities = trace?.opportunities || [];
  const offensive = opportunities.filter(item => item.domain === "offense");
  const defensive = opportunities.filter(item => item.domain === "defense");
  const rejections = defensive.reduce((counts, item) => {
    if (item.rejectionReason) counts[item.rejectionReason] = (counts[item.rejectionReason] || 0) + 1;
    return counts;
  }, {});
  const entryEvent = (traceOrMatch?.simulationLog || player.highSchoolMatch?.simulationLog || []).find(event => event.type === "playerEntry") || null;
  return Object.freeze({
    seed: Number(trace?.header?.seed) || 0,
    entryTiming: entryEvent ? Object.freeze({ inning: entryEvent.inning, half: entryEvent.half, outs: entryEvent.outs, bases: Object.freeze((entryEvent.runners || []).slice(0, 3)), lineupSlot: entryEvent.lineupSlot })
      : trace?.header?.role === "starter" ? Object.freeze({ inning: 1, half: "上", outs: 0, bases: Object.freeze([null, null, null]), lineupSlot: 5 }) : null,
    playerPACount: offensive.length,
    scriptedOffensiveDecisions: offensive.filter(item => item.scriptedDecisionCandidate && item.decisionCreated).length,
    emergentOffensiveDecisions: offensive.filter(item => item.emergentDecisionCandidate && item.decisionCreated).length,
    offensiveDecisionCount: offensive.filter(item => item.decisionCreated).length,
    offensiveRoutineSuppressed: offensive.filter(item => !item.decisionCreated && item.rejectionReason === "routine-opportunity").length,
    offensiveRepeatSuppressed: offensive.filter(item => !item.decisionCreated && item.rejectionReason === "repeated-routine-structure").length,
    offensiveAgencyOpportunities: offensive.filter(item => item.agencyOpportunityCandidate).length,
    offensiveAgencyManual: offensive.filter(item => item.agencySelection === "manual").length,
    offensiveAgencySimulated: offensive.filter(item => item.agencySelection === "simulate").length,
    lateMeaningfulCandidates: offensive.filter(item => item.opportunityClassification?.lateGame && item.opportunityClassification?.meaningfulCandidate).length,
    lateMeaningfulAdmitted: offensive.filter(item => item.opportunityClassification?.lateGame && item.opportunityClassification?.meaningfulCandidate && item.decisionCreated).length,
    criticalCandidates: offensive.filter(item => item.leverageClass === "critical").length,
    criticalAdmitted: offensive.filter(item => item.leverageClass === "critical" && item.decisionCreated).length,
    defensiveResponsibilityCount: defensive.filter(item => item.responsibilityCheck).length,
    defensiveViableRouteCount: defensive.filter(item => item.viableRoutes.length > 0).length,
    defensiveMultiRouteCount: defensive.filter(item => item.viableRoutes.length >= 2).length,
    defensiveMeaningfulDecisions: defensive.filter(item => item.defensiveDecisionCreated).length,
    defensiveDecisionPresented: defensive.filter(item => item.defensiveDecisionPresented).length,
    defensiveDecisionResolved: defensive.filter(item => item.defensiveDecisionResolved).length,
    defensiveDecisionDensity: Object.freeze({ ...(traceOrMatch?.matchDecisionDensityState || player.highSchoolMatch?.matchDecisionDensityState || {}) }),
    defensiveRejectionReasons: Object.freeze(rejections)
  });
}

function getHighSchoolMatchCanonicalOpportunitySignature(traceOrMatch = player.highSchoolMatch) {
  const trace = traceOrMatch?.opportunities ? traceOrMatch : traceOrMatch?.opportunityDebugTrace;
  return (trace?.opportunities || []).map(item => [
    `${item.inning}-${item.half}`,
    item.outsBefore ?? item.outs,
    (item.basesBefore || item.bases || []).map(Boolean).map(Number).join(""),
    item.ballContext?.type || "",
    item.responsibilityCheck ? "responsible" : "none",
    item.playerRole || "",
    (item.legalRoutes || []).join(","),
    (item.viableRoutes || []).join(","),
    item.noveltyKey || "",
    item.densitySuppressionReason || "",
    item.decisionWindowAvailable ? "open" : "closed",
    item.defensiveDecisionCreated || item.decisionCreated ? "created" : "rejected",
    item.rejectionReason || ""
  ].join("|")).join("\n");
}

function compareHighSchoolMatchOpportunityTraces(left, right) {
  const leftTrace = typeof left === "string" ? JSON.parse(left) : left;
  const rightTrace = typeof right === "string" ? JSON.parse(right) : right;
  const headerFields = ["seed", "role", "primaryPosition", "secondaryPosition", "opponentId", "buildVersionOrRuntimeSignature"];
  const divergences = [];
  headerFields.forEach(field => {
    if (JSON.stringify(leftTrace?.header?.[field]) !== JSON.stringify(rightTrace?.header?.[field])) divergences.push({ section: "header", field, left: leftTrace?.header?.[field], right: rightTrace?.header?.[field] });
  });
  ["playerAbilities", "lineupSignature"].forEach(field => {
    if (JSON.stringify(leftTrace?.header?.[field]) !== JSON.stringify(rightTrace?.header?.[field])) divergences.push({ section: "header", field });
  });
  const leftSignatures = leftTrace?.canonicalOpportunitySignatures || getHighSchoolMatchCanonicalOpportunitySignature(leftTrace).split("\n").filter(Boolean);
  const rightSignatures = rightTrace?.canonicalOpportunitySignatures || getHighSchoolMatchCanonicalOpportunitySignature(rightTrace).split("\n").filter(Boolean);
  const length = Math.max(leftSignatures.length, rightSignatures.length);
  for (let index = 0; index < length; index += 1) {
    if (leftSignatures[index] !== rightSignatures[index]) {
      divergences.push({ section: "opportunities", index, left: leftSignatures[index] || null, right: rightSignatures[index] || null });
      break;
    }
  }
  if (JSON.stringify(leftTrace?.finalMatchTruth || null) !== JSON.stringify(rightTrace?.finalMatchTruth || null)) divergences.push({ section: "finalMatchTruth" });
  return Object.freeze({ equal: divergences.length === 0, divergences: Object.freeze(divergences), firstDivergence: divergences[0] || null });
}

function exportHighSchoolMatchOpportunityDebug(match = player.highSchoolMatch) {
  const trace = getHighSchoolMatchOpportunityTrace(match);
  if (!trace) return "";
  const payload = {
    ...trace,
    summary: getHighSchoolMatchOpportunitySummary({ ...trace, simulationLog: match.simulationLog }),
    canonicalOpportunitySignatures: getHighSchoolMatchCanonicalOpportunitySignature(trace).split("\n").filter(Boolean),
    finalMatchTruth: {
      inning: match.inning,
      half: match.half,
      outs: match.outs,
      scores: { ...match.scores },
      completed: Boolean(match.completed),
      simulationCursor: Number(match.simulationCursor) || 0,
      completedMoments: (match.completedMoments || []).map(moment => ({ momentId: moment.momentId || "", domain: moment.domain || "", decision: moment.decision || "", tier: moment.tier || "" }))
    },
    matchExperience: typeof MatchExperienceDevelopment !== "undefined"
      ? MatchExperienceDevelopment.getDebugSnapshot(match) : null,
    matchDevelopmentPresentation: {
      completed: match.developmentPresentationCompleted === true,
      model: typeof MatchDevelopmentSettlementPresentation !== "undefined"
        ? MatchDevelopmentSettlementPresentation.createViewModel(match, { skillLabels }) : null
    }
  };
  return JSON.stringify(payload, null, 2);
}

async function copyHighSchoolMatchOpportunityDebug() {
  const text = exportHighSchoolMatchOpportunityDebug();
  const status = document.getElementById("matchOpportunityDebugStatus");
  if (!text) {
    if (status) status.textContent = "目前沒有可匯出的比賽追蹤。";
    return false;
  }
  if (typeof window !== "undefined") window.__lastHighSchoolMatchOpportunityDebugExport = text;
  let copied = false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      copied = true;
    } else if (typeof document?.createElement === "function") {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      copied = document.execCommand?.("copy") === true;
      area.remove();
    }
  } catch (error) {
    copied = false;
  }
  if (status) status.textContent = copied ? "追蹤已複製，可直接貼回任務。" : "追蹤已準備，但瀏覽器阻擋剪貼簿；請重新按一次。";
  return copied;
}

function renderHighSchoolMatchOpportunityDebugControls() {
  if (!isHighSchoolMatchOpportunityDebugMode()) return "";
  ensureHighSchoolMatchOpportunityTrace(player.highSchoolMatch);
  return `<aside class="match-opportunity-debug" aria-label="比賽機會追蹤（Debug）"><button type="button" onclick="copyHighSchoolMatchOpportunityDebug()">複製比賽追蹤</button><small id="matchOpportunityDebugStatus" role="status">僅在 matchDebug=1 顯示；不影響比賽結果。</small></aside>`;
}

function stopHighSchoolMatchPlayback(reason = "stop-request") {
  const hadHandle = highSchoolMatchPlaybackTimer !== null;
  const hadFlag = highSchoolMatchPlaybackScheduled;
  if (hadHandle && typeof window !== "undefined" && typeof window.clearTimeout === "function") {
    window.clearTimeout(highSchoolMatchPlaybackTimer);
  }
  highSchoolMatchPlaybackTimer = null;
  highSchoolMatchPlaybackScheduled = false;
  highSchoolMatchPlaybackTimerGeneration = 0;
  highSchoolMatchPlaybackLastTimerClearReason = reason;
  if (hadHandle || hadFlag) recordHighSchoolMatchPlaybackTrace("timer-cleared", reason, player.highSchoolMatch);
  highSchoolMatchPlaybackGeneration += 1;
  recordHighSchoolMatchPlaybackTrace("generation-invalidated", reason, player.highSchoolMatch);
}

function isHighSchoolMatchPlaybackScheduled() {
  return highSchoolMatchPlaybackScheduled && highSchoolMatchPlaybackTimer !== null
    && highSchoolMatchPlaybackTimerGeneration === highSchoolMatchPlaybackGeneration;
}

function hasBlockingHighSchoolMatchOutcome() {
  return pendingYouthSeasonOutcome?.eventId === "high_school_showcase";
}

function clearTransientYouthSeasonOutcome() {
  pendingYouthSeasonOutcome = null;
}

function getHighSchoolMatchPlayerParticipationState(match = player.highSchoolMatch) {
  const log = Array.isArray(match?.simulationLog) ? match.simulationLog : [];
  const playerPlateAppearances = log.filter(event => event.type === "plateAppearance" && event.batterId === "player");
  const defensiveEvents = log.filter(event => ["playerRoutinePlay", "defensiveResolution", "meaningfulMomentResolved"].includes(event.type)
    && (event.playerRelated === true || event.type !== "meaningfulMomentResolved" || event.domain === "defense"));
  const entered = Boolean(match?.playerEntryCompleted && ["starter", "substitute"].includes(match?.playerLineupStatus));
  const entryEvent = log.find(event => event.type === "playerEntry") || null;
  const hadPlateAppearanceThisHalf = playerPlateAppearances.some(event => event.inning === match?.inning && event.half === match?.half);
  return Object.freeze({
    playerEnteredGame: entered,
    playerEntryInning: entryEvent?.inning || (match?.role === "starter" ? 1 : 0),
    playerEntryHalf: entryEvent?.half || (match?.role === "starter" ? "上" : ""),
    playerCurrentlyInLineup: Boolean(entered && match?.rosters?.home?.lineup?.some(entity => entity.id === "player")),
    playerHadPlateAppearance: playerPlateAppearances.length > 0,
    playerHadPlateAppearanceThisHalf: hadPlateAppearanceThisHalf,
    playerHasDefensiveAppearance: defensiveEvents.length > 0,
    state: !entered ? "not-entered" : hadPlateAppearanceThisHalf ? "active-pa-this-half" : playerPlateAppearances.length ? "active-after-pa" : "active-before-pa"
  });
}

function getHighSchoolMatchPlaybackDebugState(match = player.highSchoolMatch) {
  const log = Array.isArray(match?.simulationLog) ? match.simulationLog : [];
  const cursor = getHighSchoolPresentedEventCursor(match);
  const nextRawEvent = log[cursor] || null;
  const nextVisibleEvent = log.slice(cursor).find(isHighSchoolMatchPresentationEventVisible) || null;
  const participation = getHighSchoolMatchPlayerParticipationState(match);
  const matchCompleted = Boolean(match?.completed);
  const playbackPhase = typeof match?.simulationPhase === "string" ? match.simulationPhase : "";
  const timerHandlePresent = highSchoolMatchPlaybackTimer !== null;
  const timerScheduledFlag = highSchoolMatchPlaybackScheduled;
  return Object.freeze({
    matchActive: Boolean(player.highSchoolMatch === match && match?.id === "hs-y1-autumn-exhibition" && getCurrentEventId() === "high_school_showcase"),
    matchCompleted,
    completed: matchCompleted,
    inning: Math.max(0, Number(match?.inning) || 0),
    half: typeof match?.half === "string" ? match.half : "",
    outs: Math.max(0, Number(match?.outs) || 0),
    score: Object.freeze({ home: Number(match?.scores?.home) || 0, away: Number(match?.scores?.away) || 0 }),
    presentedEventCursor: cursor,
    cursor,
    simulationLogLength: log.length,
    logLength: log.length,
    nextRawEventType: nextRawEvent?.type || "",
    nextVisibleEventType: nextVisibleEvent?.type || "",
    playbackPhase,
    phase: playbackPhase,
    decisionActive: isHighSchoolMatchDecisionVisible(match),
    pendingDecisionType: isHighSchoolMatchDecisionVisible(match) ? (match?.currentDomain || "decision") : "",
    blockingOutcome: hasBlockingHighSchoolMatchOutcome(),
    pendingOutcomeType: hasBlockingHighSchoolMatchOutcome() ? (pendingYouthSeasonOutcome?.eventId || "outcome") : "",
    timerHandlePresent,
    timerScheduledFlag,
    timerScheduled: isHighSchoolMatchPlaybackScheduled(),
    timerGeneration: highSchoolMatchPlaybackTimerGeneration,
    activeTimerGeneration: highSchoolMatchPlaybackGeneration,
    lastScheduledReason: highSchoolMatchPlaybackLastScheduledReason,
    lastTimerClearReason: highSchoolMatchPlaybackLastTimerClearReason,
    lastCallbackReason: highSchoolMatchPlaybackLastCallbackReason,
    lastCallbackResult: highSchoolMatchPlaybackLastCallbackResult,
    playerEnteredGame: participation.playerEnteredGame,
    playerParticipationState: participation.state,
    playerHadPlateAppearanceThisHalf: participation.playerHadPlateAppearanceThisHalf,
    currentEventId: getCurrentEventId(),
    matchEventId: match?.id || ""
  });
}

function getHighSchoolMatchPlaybackSkipReason(match, state = getHighSchoolMatchPlaybackDebugState(match)) {
  if (!match || player.highSchoolMatch !== match || !state.matchActive) return "invalid-presentation-state";
  if (state.matchCompleted) return "match-complete";
  if (state.decisionActive) return "decision-active";
  if (state.blockingOutcome) return "blocking-outcome";
  if (!isHighSchoolMatchPlaybackPhase(match)) return "not-playback-phase";
  if (isHighSchoolMatchPlaybackScheduled()) return "timer-already-valid";
  if (highSchoolMatchPlaybackScheduled !== (highSchoolMatchPlaybackTimer !== null)) return "timer-flag-stale";
  return "";
}

function ensureMatchPlaybackLiveness(reason = "unspecified", match = player.highSchoolMatch) {
  recordHighSchoolMatchPlaybackTrace("resume-request", reason, match);
  const state = getHighSchoolMatchPlaybackDebugState(match);
  const skipReason = getHighSchoolMatchPlaybackSkipReason(match, state);
  if (skipReason && skipReason !== "timer-flag-stale") {
    recordHighSchoolMatchPlaybackTrace("schedule-skipped", skipReason, match);
    if (skipReason !== "timer-already-valid" && (highSchoolMatchPlaybackScheduled || highSchoolMatchPlaybackTimer !== null)) {
      stopHighSchoolMatchPlayback(`resume-${skipReason}`);
    }
    return skipReason === "timer-already-valid";
  }
  if (skipReason === "timer-flag-stale") {
    recordHighSchoolMatchPlaybackTrace("schedule-skipped", skipReason, match);
    stopHighSchoolMatchPlayback(skipReason);
  }
  return scheduleHighSchoolMatchPlayback(match, reason);
}

function resumeHighSchoolMatchPlayback(reason = "unspecified", match = player.highSchoolMatch) {
  return ensureMatchPlaybackLiveness(reason, match);
}

function applyHighSchoolShowcaseEventSettlement(match, outcomeChoice) {
  if (match.eventSettlementApplied) return false;
  match.eventSettlementApplied = true;
  applyConsequenceAtEvent("high_school_showcase");
  updateGoalProgressForChoice("high_school_showcase", outcomeChoice);
  updateRoute();
  updateImpression();
  processCareerArcEvent("high_school_showcase", outcomeChoice);
  processEmotionalEvent("high_school_showcase", outcomeChoice);
  processRelationshipPayoffs("high_school_showcase");
  processAspirationEvent("high_school_showcase", outcomeChoice);
  recordContinuityOutcome(createContinuityOutcome("high_school_showcase", outcomeChoice));
  advanceNarrativeThread("high_school_showcase", outcomeChoice);
  advanceAfterAction(null, "high_school_showcase");
  tickPendingEvents("high_school_showcase");
  return true;
}

function showHighSchoolCompletedMatchOutcome(match, choiceText = "比賽依正式局數結束", statFeedbackHtml = "", executionText = "", pitchFeed = [], coachFeedback = "", offensiveExplainability = null) {
  stopHighSchoolMatchPlayback();
  const outcomeChoice = { text: choiceText, memory: match.performanceSummary, executionText, pitchFeed, coachFeedback, offensiveExplainability };
  applyHighSchoolShowcaseEventSettlement(match, outcomeChoice);
  renderYouthSeasonOutcome("high_school_showcase", outcomeChoice, statFeedbackHtml);
}

function scheduleHighSchoolMatchPlayback(match = player.highSchoolMatch, reason = "scheduler") {
  recordHighSchoolMatchPlaybackTrace("schedule-request", reason, match);
  const skipReason = getHighSchoolMatchPlaybackSkipReason(match);
  if (skipReason) {
    recordHighSchoolMatchPlaybackTrace("schedule-skipped", skipReason, match);
    return false;
  }
  const generation = ++highSchoolMatchPlaybackGeneration;
  highSchoolMatchPlaybackScheduled = true;
  highSchoolMatchPlaybackTimerGeneration = generation;
  highSchoolMatchPlaybackLastScheduledReason = reason;
  const playbackDelay = getHighSchoolMatchPlaybackDelay(match);
  const timerHandle = window.setTimeout(() => {
    recordHighSchoolMatchPlaybackTrace("callback-fired", reason, match, { callbackStarted: true, callbackStatus: "fired" });
    if (generation !== highSchoolMatchPlaybackGeneration) {
      highSchoolMatchPlaybackLastCallbackReason = reason;
      highSchoolMatchPlaybackLastCallbackResult = "aborted-stale-generation";
      recordHighSchoolMatchPlaybackTrace("callback-aborted", "stale-generation", match, { callbackStarted: true, callbackCompleted: true, callbackStatus: "aborted" });
      return;
    }
    highSchoolMatchPlaybackScheduled = false;
    highSchoolMatchPlaybackTimer = null;
    highSchoolMatchPlaybackTimerGeneration = 0;
    const callbackAbortReason = player.highSchoolMatch !== match ? "invalid-presentation-state"
      : match.completed ? "match-completed"
        : hasBlockingHighSchoolMatchOutcome() ? "outcome-entered"
          : isHighSchoolMatchDecisionVisible(match) ? "decision-entered"
            : !isHighSchoolMatchPlaybackPhase(match) ? "phase-changed" : "";
    if (callbackAbortReason) {
      highSchoolMatchPlaybackLastCallbackReason = reason;
      highSchoolMatchPlaybackLastCallbackResult = `aborted-${callbackAbortReason}`;
      recordHighSchoolMatchPlaybackTrace("callback-aborted", callbackAbortReason, match, { callbackStarted: true, callbackCompleted: true, callbackStatus: "aborted" });
      return;
    }
    const before = getHighSchoolMatchPlaybackDebugState(match);
    recordHighSchoolMatchPlaybackTrace("step-start", reason, match, { callbackStarted: true });
    const stepResult = advanceHighSchoolMatchPlaybackStep(match);
    const after = getHighSchoolMatchPlaybackDebugState(match);
    const progressed = before.presentedEventCursor !== after.presentedEventCursor
      || before.simulationLogLength !== after.simulationLogLength
      || before.playbackPhase !== after.playbackPhase
      || before.decisionActive !== after.decisionActive
      || before.blockingOutcome !== after.blockingOutcome
      || before.matchCompleted !== after.matchCompleted
      || before.inning !== after.inning || before.half !== after.half || before.outs !== after.outs
      || before.score.home !== after.score.home || before.score.away !== after.score.away;
    highSchoolMatchPlaybackLastCallbackReason = reason;
    highSchoolMatchPlaybackLastCallbackResult = progressed ? String(stepResult || "state-progress") : "no-progress";
    recordHighSchoolMatchPlaybackTrace("step-end", reason, match, { callbackStarted: true, callbackCompleted: true, result: highSchoolMatchPlaybackLastCallbackResult });
    if (after.decisionActive && !before.decisionActive) recordHighSchoolMatchPlaybackTrace("decision-enter", String(stepResult || "step"), match);
    if (match.completed) {
      showHighSchoolCompletedMatchOutcome(match);
      return;
    }
    showCurrentEvent();
    resumeHighSchoolMatchPlayback(`step-end:${stepResult || "no-progress"}`, match);
    recordHighSchoolMatchPlaybackTrace("callback-fired", reason, match, { callbackStarted: true, callbackCompleted: true, callbackStatus: "completed", result: highSchoolMatchPlaybackLastCallbackResult });
  }, playbackDelay);
  if (highSchoolMatchPlaybackScheduled && generation === highSchoolMatchPlaybackGeneration) {
    highSchoolMatchPlaybackTimer = timerHandle;
  }
  recordHighSchoolMatchPlaybackTrace("schedule-created", reason, match, { result: String(playbackDelay) });
  return true;
}

function getHighSchoolMatchPlaybackDelay(match) {
  const presentedEvent = getHighSchoolPresentedEvent(match);
  const majorTransitionTypes = new Set(["halfInningEnd", "sideChange", "walkOff", "gameEnd"]);
  if (needsHighSchoolScoreboardReveal(match) || majorTransitionTypes.has(presentedEvent?.type)) return MATCH_MAJOR_TRANSITION_MS;
  return presentedEvent?.presentationImportance === "attention"
    ? MATCH_ATTENTION_BEAT_MS
    : MATCH_FLOW_BEAT_MS;
}

function getHighSchoolDecisionExecutionText(match, decision) {
  if (match.currentDomain === "defense" && match.defensiveSituation?.familyId === "infield") {
    return infieldDecisionFamily.present(match.defensiveSituation, null, decision).execution;
  }
  if (match.currentDomain !== "defense") {
    const offensiveChoice = buildOffensiveDecisionChoices(match).find(choice => choice.matchDecision === decision);
    if (offensiveChoice && isOffensiveDecisionChoiceLegal(offensiveChoice, match)) return offensiveChoice.executionText;
  }
  if (match.currentDomain === "defense" && match.position === "捕手") {
    const catcherChoice = getHighSchoolDefensiveMomentChoices(match).find(choice => choice.catcherIntent === decision);
    if (catcherChoice) return catcherChoice.executionText;
  }
  const executions = match.currentDomain === "defense" ? {
    secure: "你先穩住接球腳步，瞄準最短、最確定的出局點。",
    challenge: "你接球後加快轉傳節奏，嘗試把一次守備擴成更多出局。",
    lead: "你把第一個傳球目標放在最前位跑者的合法壘包。",
    home: "你接球後直接朝本壘處理，阻止三壘跑者得分。",
    contain: "你先壓住跑者的啟動，再把球送向正確補位。"
  } : {};
  return executions[decision] || "你依照剛才的判斷完成這次場上動作。";
}

function chooseHighSchoolOffensiveAgency(selection, expectedMomentId) {
  if (isTransitioning || pendingYouthSeasonOutcome || getCurrentEventId() !== "high_school_showcase") return false;
  const match = prepareHighSchoolYearOneMatch();
  const state = match.offensivePlayerAgencyState;
  if (!isHighSchoolMatchDecisionVisible(match) || match.simulationPhase !== "offensive_agency_ready"
    || state?.status !== "pending" || state.momentId !== expectedMomentId || !["manual", "simulate"].includes(selection)) return false;
  stopHighSchoolMatchPlayback("agency-selected");
  state.selection = selection;
  state.status = selection === "manual" ? "manualSelected" : "simulating";
  state.selectedAtCursor = getHighSchoolPresentedEventCursor(match);
  const traceAgency = [...(match.opportunityDebugTrace?.opportunities || [])].reverse().find(item => item.agencyOpportunityCandidate
    && item.playerPANumber === state.playerPANumber && !item.agencySelection);
  if (traceAgency) traceAgency.agencySelection = selection;
  if (selection === "manual") {
    const classification = state.classification;
    const density = state.density;
    if (state.routeTarget === "firstOffense") {
      prepareHighSchoolFirstOffensiveMomentFromSimulation(match);
    } else if (state.routeTarget === "finalOffense") {
      prepareHighSchoolFinalOffensiveMomentFromSimulation(match);
    } else {
      if (density?.allowed) applyHighSchoolOffensiveDecisionDensity(match, classification, density, true);
      prepareHighSchoolMeaningfulOffensiveMomentFromSimulation(match, classification, density, { resumePhase: state.resumePhase });
    }
    state.status = "manualReady";
    const pending = advanceHighSchoolPresentationCursor(match);
    if (pending?.type !== "meaningfulMomentReached") return false;
    showCurrentEvent();
    return true;
  }
  const flow = state.priorFlow || {};
  const beforePA = (match.simulationLog || []).filter(event => event.type === "plateAppearance" && event.batterId === "player").length;
  const result = resolveSimulatedHighSchoolPlateAppearance(match, null, { allowPlayer: true });
  if (!result || result.batterId !== "player") {
    state.status = "pending";
    state.selection = "";
    return false;
  }
  const afterPA = (match.simulationLog || []).filter(event => event.type === "plateAppearance" && event.batterId === "player").length;
  if (afterPA !== beforePA + 1) throw new Error("Agency simulation must consume exactly one canonical player PA");
  state.status = "resolved";
  state.result = result.result;
  state.resultApplied = true;
  if (traceAgency) {
    traceAgency.agencyResolved = true;
    traceAgency.result = result.result;
  }
  state.resolvedAtCursor = getHighSchoolPresentedEventCursor(match);
  match.simulationPhase = state.resumePhase;
  match.momentIndex = Number.isFinite(Number(flow.momentIndex)) ? Number(flow.momentIndex) : match.momentIndex;
  match.currentMomentId = flow.currentMomentId || state.momentId;
  match.currentDomain = flow.currentDomain || "flow";
  match.currentAssignment = flow.currentAssignment || "比賽依目前局面繼續進行。";
  if (isHighSchoolMatchWalkOff(match)) {
    recordHighSchoolMatchSimulationEvent(match, { type: "walkOff", inning: match.inning, half: match.half, scores: match.scores });
    match.pendingGameSettlement = "walkOff";
  }
  assertHighSchoolMatchStateIntegrity(match, "agency-auto-player-pa");
  showCurrentEvent();
  resumeHighSchoolMatchPlayback("agency-simulated", match);
  return true;
}

function chooseHighSchoolYearOneMatchMoment(decision, expectedMomentId, randomSource = Math.random) {
  if (isTransitioning || pendingYouthSeasonOutcome || getCurrentEventId() !== "high_school_showcase") return false;
  const match = prepareHighSchoolYearOneMatch();
  if (match.simulationPhase === "offensive_agency_ready") {
    const agencySelection = decision === "agencyManual" ? "manual" : decision === "agencySimulate" ? "simulate" : "";
    return agencySelection ? chooseHighSchoolOffensiveAgency(agencySelection, expectedMomentId) : false;
  }
  if (!isHighSchoolMatchDecisionVisible(match)) return false;
  recordHighSchoolMatchPlaybackTrace("decision-exit", decision, match);
  stopHighSchoolMatchPlayback("decision-selected");
  const currentMomentId = getHighSchoolYearOneMomentId(match);
  const choice = getHighSchoolYearOneMatchMomentChoices(match).find(item => item.matchDecision === decision && item.matchMomentId === expectedMomentId);
  if (!choice || !currentMomentId || expectedMomentId !== currentMomentId) return false;
  markHighSchoolMatchDecisionLifecycle("choiceReceived", match, { decision, expectedMomentId });
  const decisionDomain = match.currentDomain;

  isTransitioning = true;
  setChoiceTransitionState(true);
  const before = getPlayerSnapshot();
  const narrative = resolveHighSchoolYearOneMatch(decision, expectedMomentId, randomSource);
  if (!narrative) {
    isTransitioning = false;
    setChoiceTransitionState(false);
    return false;
  }
  const resolvedMoment = match.completedMoments.at(-1);
  const executionText = resolvedMoment.executionText || getHighSchoolDecisionExecutionText(match, decision);
  const defensiveResolution = decisionDomain === "defense" ? match.lastDefensiveResolution || {} : {};
  markHighSchoolMatchDecisionLifecycle("resolved", match, {
    decision, expectedMomentId, resolvedPhase: match.simulationPhase, domain: decisionDomain,
    selectedRoute: defensiveResolution.initialRoute || defensiveResolution.routeId || "",
    finalRoute: defensiveResolution.activeRoute || defensiveResolution.routeId || defensiveResolution.route || ""
  });
  recordHighSchoolMatchOpportunityCheckpoint(`decision-resolved:${decisionDomain}`, match, { decision, expectedMomentId });
  resolvedMoment.execution = executionText;
  advanceHighSchoolPresentationCursor(match);
  const outcomeChoice = {
    text: choice.text,
    memory: narrative,
    judgmentText: decisionDomain === "defense" ? resolvedMoment.defensiveOutcomeExplanation?.judgment || "" : "",
    executionText: decisionDomain === "defense" ? resolvedMoment.defensiveOutcomeExplanation?.executionSummary || executionText : executionText,
    causeText: decisionDomain === "defense" ? resolvedMoment.defensiveOutcomeExplanation?.causeText || resolvedMoment.causeExplanation || "" : resolvedMoment.causeExplanation || "",
    pitchFeed: decisionDomain === "offense" ? formatHighSchoolOffensivePitchFeed(resolvedMoment.pitchHistory) : [],
    coachFeedback: resolvedMoment.coachFeedback || "",
    offensiveExplainability: decisionDomain === "offense" ? createHighSchoolOffensiveExplainabilityModel(resolvedMoment) : null
  };
  player.memories.push(narrative);
  player.memories = player.memories.slice(-20);

  const statFeedbackHtml = showStatChanges(before, getPlayerSnapshot(), narrative, { includeMemory: false });
  if (match.completed) {
    showHighSchoolCompletedMatchOutcome(match, choice.text, statFeedbackHtml, executionText, outcomeChoice.pitchFeed, outcomeChoice.coachFeedback, outcomeChoice.offensiveExplainability);
  } else {
    outcomeChoice.memory = resolvedMoment.causeExplanation ? resolvedMoment.outcome : `${resolvedMoment.outcome}。${resolvedMoment.consequence}`;
    renderYouthSeasonOutcome("high_school_showcase", outcomeChoice, statFeedbackHtml);
  }
  return true;
}

function renderHighSchoolPostMatchOutcome(choice, statFeedbackHtml) {
  const match = player.highSchoolMatch;
  const choiceLabel = typeof choice?.text === "string" ? choice.text.trim() : "";
  const executionText = typeof choice?.executionText === "string" ? choice.executionText.trim() : "";
  const pitchFeed = Array.isArray(choice?.pitchFeed) ? choice.pitchFeed.filter(item => typeof item === "string" && item.trim()) : [];
  const confirmationHtml = choiceLabel ? `<section class="outcome__confirmation choice-outcome-action" aria-label="你的選擇"><small>你選擇</small><strong>${escapeHtml(choiceLabel)}</strong></section>` : "";
  const offensiveExplainabilityHtml = renderHighSchoolOffensiveExplainability(choice?.offensiveExplainability);
  const executionHtml = !offensiveExplainabilityHtml && executionText ? `<section class="outcome__execution choice-outcome-execution" aria-label="你的執行"><small>你的執行</small><p>${escapeHtml(executionText)}</p></section>` : "";
  const pitchFeedHtml = pitchFeed.length
    ? `<section class="post-match-section plate-approach-feed" aria-label="這個打席的逐球紀錄"><small>逐球紀錄</small><ol>${pitchFeed.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ol></section>` : "";
  const performances = match.completedMoments.map((moment, index) => `<li><strong>第${["一", "二", "三"][index] || index + 1}次關鍵回合</strong>${moment.execution ? `<span class="post-match-execution">你的執行：${escapeHtml(moment.execution)}</span>` : ""}<span>${escapeHtml(moment.outcome)}。${escapeHtml(moment.consequence)}</span>${moment.causeExplanation ? `<span class="post-match-cause">原因：${escapeHtml(moment.causeExplanation)}</span>` : ""}</li>`).join("");
  const feedbackHtml = typeof statFeedbackHtml === "string" && statFeedbackHtml.trim()
    ? `<section class="outcome__feedback choice-outcome-feedback" aria-label="狀態變化"><small>狀態變化</small>${statFeedbackHtml}</section>` : "";
  const developmentPresentationModel = typeof MatchDevelopmentSettlementPresentation !== "undefined"
    ? MatchDevelopmentSettlementPresentation.createViewModel(match, { skillLabels }) : null;
  const experienceHtml = developmentPresentationModel
    ? MatchDevelopmentSettlementPresentation.render(developmentPresentationModel)
    : `<section class="post-match-section match-development-settlement" aria-labelledby="matchDevelopmentTitle"><h3 id="matchDevelopmentTitle">本場實戰成長</h3><p>本場未產生可結算的實戰成長資料。</p></section>`;
  setChoiceTransitionState(false);
  document.getElementById("story").innerHTML = `<article class="event-card outcome choice-outcome-card high-school-post-match" aria-labelledby="outcomeTitle">
    ${renderHighSchoolYearOneScore()}
    <div class="event-kicker choice-outcome-kicker">秋季交流賽・終場</div>
    <h2 id="outcomeTitle" tabindex="-1">${escapeHtml(match.teamResult)}</h2>
    ${confirmationHtml}${offensiveExplainabilityHtml}${executionHtml}${pitchFeedHtml}
    <section class="post-match-section" aria-labelledby="postMatchPerformance"><small id="postMatchPerformance">你的關鍵表現</small><ol>${performances || "<li>你依照目前角色完成了這場比賽。</li>"}</ol></section>
    <section class="post-match-section post-match-coach" aria-labelledby="postMatchCoach"><small id="postMatchCoach">教練評語</small><p>${escapeHtml(choice?.coachFeedback || match.coachReaction)}</p></section>
    <section class="post-match-section post-match-impact" aria-labelledby="postMatchImpact"><small id="postMatchImpact">接下來的影響</small><p>${escapeHtml(match.consequence)}</p></section>
    ${experienceHtml}
    ${feedbackHtml}
  </article>`;
  clearOutcomeFeedbackPresentation();
  document.getElementById("choices").innerHTML = `<div class="outcome__action" aria-label="前往下一幕"><button type="button" class="outcome-continue-button" onclick="continueYouthSeasonOutcome()">繼續</button></div>`;
  markHighSchoolMatchDecisionLifecycle("outcomePresented", match, { completed: true });
}

function renderYouthSeasonOutcome(eventId, choice, statFeedbackHtml) {
  if (eventId === "high_school_showcase") {
    stopHighSchoolMatchPlayback("outcome-entered");
    recordHighSchoolMatchPlaybackTrace("outcome-enter", eventId, player.highSchoolMatch);
  }
  pendingYouthSeasonOutcome = { eventId };
  if (eventId === "high_school_showcase" && player.highSchoolMatch?.completed) {
    renderHighSchoolPostMatchOutcome(choice, statFeedbackHtml);
  } else {
    const competitionFrame = renderCompetitionPresentation(eventId);
  const integratedScoreFrame = eventId === "high_school_year_two_spring_game"
    ? renderHighSchoolSpringScore()
    : eventId === "high_school_showcase" ? renderHighSchoolYearOneScore(true) : "";
  const choiceLabel = typeof choice?.text === "string" ? choice.text.trim() : "";
  const judgmentText = typeof choice?.judgmentText === "string" ? choice.judgmentText.trim() : "";
  const executionText = typeof choice?.executionText === "string" ? choice.executionText.trim() : "";
  const offensiveExplainabilityHtml = eventId === "high_school_showcase" ? renderHighSchoolOffensiveExplainability(choice?.offensiveExplainability) : "";
  const narrativeOutcome = typeof choice?.memory === "string" ? choice.memory.trim() : "";
  const pitchFeed = Array.isArray(choice?.pitchFeed) ? choice.pitchFeed.filter(item => typeof item === "string" && item.trim()) : [];
  const causeText = typeof choice?.causeText === "string" ? choice.causeText.trim() : "";
  const reactionValue = eventId === "high_school_showcase" && typeof choice?.coachFeedback === "string" && choice.coachFeedback.trim()
    ? `${choice.coachFeedback.trim()}${player.highSchoolMatch?.teamReaction ? ` ${player.highSchoolMatch.teamReaction}` : ""}`
    : getYouthSeasonOutcomeReaction(eventId);
  const worldReaction = typeof reactionValue === "string" ? reactionValue.trim() : "";
  const systemFeedback = typeof statFeedbackHtml === "string" ? statFeedbackHtml.trim() : "";
  const confirmationHtml = choiceLabel ? `
      <section class="outcome__confirmation choice-outcome-action" aria-label="你的選擇">
        <small>你選擇</small><strong>${escapeHtml(choiceLabel)}</strong>
      </section>` : "";
  const judgmentHtml = judgmentText ? `
      <section class="outcome__judgment choice-outcome-judgment" aria-label="你的判斷">
        <small>你的判斷</small><p>${escapeHtml(judgmentText)}</p>
      </section>` : "";
  const executionHtml = !offensiveExplainabilityHtml && executionText ? `
      <section class="outcome__execution choice-outcome-execution" aria-label="你的執行">
        <small>你的執行</small><p>${escapeHtml(executionText)}</p>
      </section>` : "";
  const pitchFeedHtml = pitchFeed.length ? `
      <section class="outcome__pitch-feed plate-approach-feed" aria-label="這個打席的逐球紀錄">
        <small>逐球紀錄</small><ol>${pitchFeed.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      </section>` : "";
  const narrativeHtml = narrativeOutcome ? `
      <section class="outcome__narrative choice-outcome-result" aria-label="事件結果">
        <small>發生的結果</small><p>${escapeHtml(narrativeOutcome)}</p>
      </section>` : "";
  const causeHtml = causeText ? `
      <section class="outcome__cause choice-outcome-cause" aria-label="結果原因">
        <small>為什麼會這樣</small><p>${escapeHtml(causeText)}</p>
      </section>` : "";
  const reactionHtml = worldReaction ? `
      <section class="outcome__reaction choice-outcome-reaction" aria-label="人物或場上反應">
        <small>場上的回應</small><p>${escapeHtml(worldReaction)}</p>
      </section>` : "";
  const feedbackHtml = systemFeedback ? `
      <section class="outcome__feedback choice-outcome-feedback" aria-label="場上回應">
        <small>狀態變化</small>${systemFeedback}
      </section>` : "";
  setChoiceTransitionState(false);
  document.getElementById("story").innerHTML = `
    <article class="event-card outcome choice-outcome-card" aria-labelledby="outcomeTitle">
      ${competitionFrame}${integratedScoreFrame}
      <div class="event-kicker choice-outcome-kicker">行動結果</div>
      <h2 id="outcomeTitle" tabindex="-1">${escapeHtml(getYouthSeasonOutcomeHeading(eventId))}</h2>
      ${confirmationHtml}
      ${judgmentHtml}
      ${offensiveExplainabilityHtml}
      ${executionHtml}
      ${pitchFeedHtml}
      ${narrativeHtml}
      ${causeHtml}
      ${reactionHtml}
      ${feedbackHtml}
    </article>`;
  clearOutcomeFeedbackPresentation();
  document.getElementById("choices").innerHTML = `
    <div class="outcome__action" aria-label="前往下一幕">
      <button type="button" class="outcome-continue-button" onclick="continueYouthSeasonOutcome()">繼續</button>
    </div>`;
  }
  if (eventId === "high_school_showcase") {
    markHighSchoolMatchDecisionLifecycle("outcomePresented", player.highSchoolMatch, { completed: Boolean(player.highSchoolMatch?.completed) });
    document.getElementById("choices").innerHTML += renderHighSchoolMatchOpportunityDebugControls();
  }
  updateStatus();
  focusOutcomeHeading();
}

function continueYouthSeasonOutcome() {
  if (!pendingYouthSeasonOutcome) return false;
  const completedEventId = pendingYouthSeasonOutcome.eventId;
  if (completedEventId === "high_school_showcase") {
    recordHighSchoolMatchPlaybackTrace("outcome-exit", completedEventId, player.highSchoolMatch);
    markHighSchoolMatchDecisionLifecycle("continue", player.highSchoolMatch);
  }
  setOutcomeContinueState(true);
  if (completedEventId === "high_school_showcase" && player.highSchoolMatch?.completed) {
    player.highSchoolMatch.developmentPresentationCompleted = true;
  }
  pendingYouthSeasonOutcome = null;
  isTransitioning = false;
  showCurrentEvent();
  if (completedEventId === "high_school_showcase" && !player.highSchoolMatch?.completed) {
    resumeHighSchoolMatchPlayback("outcome-continue", player.highSchoolMatch);
  }
  return true;
}

function showNotice(message, type = "neutral") {
  const node = document.getElementById("changeLog");
  if (!node) return;
  setOutcomeFeedbackPresentation(false);
  node.innerHTML = `<div class="notice ${type}">${escapeHtml(message)}</div>`;
}

function choose(eventId, index) {
  if (isTransitioning) return;
  if (pendingTrainingOutcome) return;
  if (getCurrentEventId() !== eventId) return false;
  if (isHighSchoolTrainingEvent(player.forcedEventId) && player.forcedEventId !== eventId) return;
  if (player.chapter === "生涯轉換期" && getCurrentEventId() !== eventId) return false;
  if (player.chapter === "發展期" && getCurrentEventId() !== eventId) return false;
  const event = getEvent(eventId);
  let choice = event?.choices?.[index];
  if (!choice) return;
  if (eventId === "youth_match_grounder" && choice.gameplayApproach) {
    return chooseYouthGrounderFielding(choice.gameplayApproach);
  }
  if (eventId === "high_school_year_two_spring_game" && choice.gameplayApproach) {
    return chooseHighSchoolSpringApproach(choice.gameplayApproach);
  }
  if (eventId === "high_school_showcase" && choice.matchDecision) {
    return chooseHighSchoolYearOneMatchMoment(choice.matchDecision, choice.matchMomentId);
  }
  if (isHighSchoolTrainingEvent(eventId) && choice.trainingCode) {
    return chooseHighSchoolTraining(eventId, choice.trainingCode);
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
  const capabilityMutationSource = getNarrativeCapabilityMutationSource(eventId, choice.id || index);
  applySkillEffects(choice.skillEffects, capabilityMutationSource);
  if (choice.setPrimaryPosition) {
    player.seasonPosition = choice.setPrimaryPosition;
    addFlags([`primary_position_${positionConfigs[player.seasonPosition]?.affinity || "unknown"}`]);
  }
  if (choice.acceptSuggestedPosition) applySuggestedPositionChange();
  applyPositionSkillEffects(choice.positionSkillEffects, capabilityMutationSource);
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
  applyTrainingFocusBonus(choice, capabilityMutationSource);
  const highSchoolNarrative = processHighSchoolYearOneChoice(eventId, choice);
  if (highSchoolNarrative) choice = { ...choice, memory: highSchoolNarrative };
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
    resumeHighSchoolMatchPlayback("event-transition", player.highSchoolMatch);
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

function getHighSchoolIdealAlignment(formation) {
  const skills = player.baseballSkills || {};
  const values = {
    "強打型": (skills.batting || 0) * 2 + (player.ballSense || 0),
    "技巧型": (player.ballSense || 0) + (skills.catching || 0) + (skills.throwing || 0),
    "守備型": (formation.rating || 0) + (skills.reaction || 0),
    "速度型": (skills.baseRunning || 0) * 2 + (player.fitness || 0),
    "棒球理解型": (skills.baseballIQ || 0) * 2 + (player.observe || 0)
  };
  const ranked = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const coachIdentity = ranked[0]?.[0] || "全能型";
  let idealAlignment = "衝突";
  if (player.idealSelf === "全能型") {
    const scores = Object.values(values);
    const spread = Math.max(...scores) - Math.min(...scores);
    idealAlignment = spread <= 4 ? "一致" : spread <= 9 ? "部分一致" : "衝突";
  } else if (coachIdentity === player.idealSelf) idealAlignment = "一致";
  else if ((values[player.idealSelf] || 0) >= (ranked[0]?.[1] || 0) - 5) idealAlignment = "部分一致";
  return { idealAlignment, coachIdentity, values };
}

function resolveHighSchoolPositionFormation() {
  const previousPrimary = player.highSchoolPositionPreference || player.primaryPosition || "";
  const previousSecondaries = Array.isArray(player.secondaryPositions) ? [...player.secondaryPositions] : [];
  const teamNeeds = player.highSchoolRoute.startsWith("強豪")
    ? { "捕手": 5, "投手": 4, "內野手": 1, "外野手": 0 }
    : player.highSchoolRoute.startsWith("普通")
      ? { "內野手": 5, "外野手": 4, "捕手": 2, "投手": 1 }
      : { "外野手": 4, "內野手": 3, "捕手": 2, "投手": 1 };
  const openEvaluation = hasFlag("hs_position_open_evaluation");
  const acceptNeed = hasFlag("hs_position_team_need");
  const ratings = calculatePositionRatings().map(item => ({
    ...item,
    formationScore: item.rating
      + (item.position === previousPrimary ? 5 : previousSecondaries.includes(item.position) ? 2 : 0)
      + (hasFlag("hs_position_hold_history") && item.position === previousPrimary ? 4 : 0)
      + (acceptNeed ? teamNeeds[item.position] || 0 : Math.min(2, teamNeeds[item.position] || 0))
      + (openEvaluation ? Math.round(item.rating * 0.08) : 0)
  })).sort((a, b) => b.formationScore - a.formationScore || b.rating - a.rating);
  const primary = ratings[0]?.position || previousPrimary || "內野手";
  const secondaryCandidate = ratings.find(item => item.position !== primary);
  const allowSecondary = Boolean(secondaryCandidate) && (
    previousSecondaries.includes(secondaryCandidate.position) || openEvaluation || acceptNeed
  ) && secondaryCandidate.formationScore >= ratings[0].formationScore - 8;
  const secondaries = allowSecondary ? [secondaryCandidate.position] : [];
  applyCanonicalPositionProfile(player, primary, secondaries);
  const alignment = getHighSchoolIdealAlignment({ rating: ratings[0]?.rating || 0 });
  const historyText = previousPrimary ? `國中主守${previousPrimary}` : "沒有固定的國中主守位";
  const assessment = getPositionAssessment(primary);
  const teamNeedText = (teamNeeds[primary] || 0) >= 4 ? "球隊在這個守位有明確缺口" : "球隊需求只作為次要參考";
  const identityContext = alignment.idealAlignment === "一致"
    ? `你原本憧憬「${player.idealSelf}」，教練目前也最先看見「${alignment.coachIdentity}」的能力方向。`
    : alignment.idealAlignment === "部分一致"
      ? `你原本憧憬「${player.idealSelf}」，教練先看見「${alignment.coachIdentity}」；兩者仍有可共同發展的能力，只是眼前任務不同。`
      : `你原本憧憬「${player.idealSelf}」，教練目前更相信「${alignment.coachIdentity}」；這是依現階段能力與隊伍缺口做的暫定安排，不是永久改寫你的方向。`;
  const context = `${historyText}；測試中較能支撐${primary}的是${assessment?.strengths || "基本動作與判讀"}；${teamNeedText}。${identityContext}`;
  player.highSchoolCoachEvaluation = {
    primaryPosition: primary,
    secondaryPositions: [...secondaries],
    rating: ratings[0]?.rating || 0,
    rationale: `${historyText}；${assessment?.strengths || "基本動作與判讀"}；${teamNeedText}`,
    idealAlignment: alignment.idealAlignment,
    coachIdentity: alignment.coachIdentity,
    context
  };
  addFlags([`hs_ideal_${alignment.idealAlignment === "一致" ? "aligned" : alignment.idealAlignment === "部分一致" ? "partial" : "conflict"}`]);
  return player.highSchoolCoachEvaluation;
}

function resolveHighSchoolProvisionalRole() {
  const positionRating = getPositionAssessment(player.primaryPosition)?.rating || player.highSchoolCoachEvaluation.rating || 0;
  const skills = player.baseballSkills || {};
  const healthy = player.body.injuryRisk < 8 && player.body.pain < 5;
  const positionReady = positionRating >= 18;
  const coachReady = player.relationships.coachTrust >= 6;
  const priorProof = player.seasonPerformance >= 2 || player.recentPerformance >= 2 || player.impression.coach.dependable >= 3;
  const roleToolReady = hasFlag("hs_role_expand_utility")
    ? Boolean(player.secondaryPosition) && (skills.baseballIQ || 0) + (skills.baseRunning || 0) >= 7
    : hasFlag("hs_role_bat_entry")
      ? (skills.batting || 0) + (player.ballSense || 0) >= 8
      : positionRating >= 20;
  const rotationEvidence = [positionReady, coachReady, roleToolReady, Boolean(player.secondaryPosition), priorProof].filter(Boolean).length;
  let code = "bench";
  if (healthy && positionReady && coachReady && roleToolReady && priorProof) code = "starter";
  else if (healthy && rotationEvidence >= 2) code = "rotation";
  const labels = {
    starter: "先發／關鍵任務",
    rotation: "輪替／替補任務",
    bench: "發展／板凳任務"
  };
  const opportunities = {
    starter: "交流賽先發並在關鍵局續留",
    rotation: "同一場交流賽的中段代打與守備接替",
    bench: "同一場交流賽的指定代打與短局守備"
  };
  player.highSchoolRoleCode = code;
  player.highSchoolTeamRole = labels[code];
  player.highSchoolRoleContext = {
    code,
    label: labels[code],
    evidence: [
      `守位適配 ${positionRating}`,
      coachReady ? "現任教練已有基本信任" : "現任教練仍需更多可預期執行",
      roleToolReady ? "所選發展工具已達可測試門檻" : "所選發展工具仍在形成",
      healthy ? "身體可承擔正式任務" : "健康限制正式任務"
    ],
    opportunity: opportunities[code],
    assignment: ""
  };
  return player.highSchoolRoleContext;
}

const highSchoolYearOneMomentIds = Object.freeze([
  "hs_y1_match_moment_1",
  "hs_y1_match_moment_2",
  "hs_y1_match_moment_3"
]);

function getHighSchoolYearOneMomentId(match = player.highSchoolMatch) {
  if (match?.completed) return "";
  if (match?.currentDomain === "offense" && /^hs_y1_match_offense_\d+$/.test(match?.currentMomentId || "")) return match.currentMomentId;
  if (match?.simulationPhase === "moment_2_ready" && match?.currentDomain === "defense"
    && /^hs_y1_match_defense_\d+$/.test(match?.currentMomentId || "")) return match.currentMomentId;
  return highSchoolYearOneMomentIds[Math.max(0, Math.min(2, Number(match?.momentIndex) || 0))];
}

function createHighSchoolMatchSimulationSeed(randomSource = Math.random) {
  if (Number(pendingHighSchoolMatchSimulationSeed) > 0) {
    const injectedSeed = Math.max(1, Math.floor(Number(pendingHighSchoolMatchSimulationSeed)));
    pendingHighSchoolMatchSimulationSeed = 0;
    return injectedSeed;
  }
  const sample = Number(randomSource());
  return Math.max(1, Math.floor((Number.isFinite(sample) ? sample : 0.5) * 999983));
}

function getHighSchoolMatchEventPresentationImportance(event = {}) {
  if (event.presentationImportance) return event.presentationImportance;
  if (event.type === "matchEntry") return "hidden";
  if (["run", "halfInningEnd", "sideChange", "meaningfulMomentReached", "meaningfulMomentResolved", "playerRoutinePlay", "playerEntry", "buntPitchResolved", "buntDefensiveFallback", "walkOff", "gameEnd"].includes(event.type)) return "attention";
  if (event.type === "plateAppearance" && (["double", "triple", "homeRun"].includes(event.result) || Number(event.runsBattedIn) > 0 || Number(event.after?.outs) >= 3)) return "attention";
  return "flow";
}

function ensureHighSchoolMatchLineScoreInning(match, team, inning = match.inning) {
  if (!match.lineScore || typeof match.lineScore !== "object") match.lineScore = { home: [], away: [] };
  if (!Array.isArray(match.lineScore[team])) match.lineScore[team] = [];
  while (match.lineScore[team].length < inning) match.lineScore[team].push(null);
  if (match.lineScore[team][inning - 1] === null || match.lineScore[team][inning - 1] === undefined) {
    match.lineScore[team][inning - 1] = 0;
  }
  return match.lineScore[team][inning - 1];
}

function recordHighSchoolMatchSimulationEvent(match, event) {
  if (!Array.isArray(match.simulationLog)) match.simulationLog = [];
  const defaultImportance = getHighSchoolMatchEventPresentationImportance(event);
  const record = Object.assign({ sequence: match.simulationLog.length, presentationImportance: defaultImportance }, event);
  if (record.scores) record.scores = { ...record.scores };
  if (record.runners) record.runners = record.runners.slice(0, 3);
  if (Array.isArray(record.runnerChanges)) record.runnerChanges = record.runnerChanges.map(change => ({ ...change }));
  if (Array.isArray(record.scoringRunnerIds)) record.scoringRunnerIds = record.scoringRunnerIds.slice();
  record.presentationSnapshot = createHighSchoolMatchPresentationSnapshot(match, record);
  match.simulationLog.push(record);
  return record;
}

function createHighSchoolMatchPresentationSnapshot(match, event = {}) {
  const after = event.after || {};
  const inning = Math.max(1, Math.floor(Number(event.inning ?? match.inning) || 1));
  const half = ["上", "下", "終"].includes(event.half) ? event.half : match.half;
  const scores = after.scores || event.scores || match.scores || { home: 0, away: 0 };
  const runners = after.runners || event.runners || match.runners || [];
  const revealHalfIndex = Number.isFinite(Number(event.lineScoreRevealHalfIndex))
    ? Number(event.lineScoreRevealHalfIndex)
    : event.type === "sideChange"
      ? getHighSchoolHalfInningIndex(inning, half)
      : getHighSchoolScoreboardRevealHalfIndex(match);
  const offenseTeam = event.offenseTeam || (half === "上" ? "away" : "home");
  const currentBatter = event.currentBatterAfter || event.currentBatter || match.currentBatter || event.batterId || "";
  const lineup = match.rosters?.[offenseTeam]?.lineup || [];
  const battingOrderSlot = Math.max(0, lineup.findIndex(entity => entity.id === currentBatter));
  return Object.freeze({
    inning,
    half,
    outs: Math.max(0, Math.min(3, Math.floor(Number(after.outs ?? event.outs ?? match.outs) || 0))),
    runners: Object.freeze(runners.slice(0, 3)),
    scores: Object.freeze({ home: Number(scores.home) || 0, away: Number(scores.away) || 0 }),
    lineScoreRevealHalfIndex: Math.max(0, Math.floor(revealHalfIndex)),
    assignment: typeof event.assignment === "string" ? event.assignment : (match.currentAssignment || ""),
    position: match.playerFieldingAssignment || match.currentFieldingPosition || (match.playerLineupStatus === "bench" ? "板凳待命" : match.position) || "",
    currentBatter,
    battingOrderSlot
  });
}

function getHighSchoolPresentedEventCursor(match) {
  // Exclusive cursor: this is the index of the next unseen simulation event.
  return Math.min(match?.simulationLog?.length || 0, Math.max(0, Math.floor(Number(match?.presentedEventCursor) || 0)));
}

function getHighSchoolPresentedEvent(match) {
  const cursor = getHighSchoolPresentedEventCursor(match);
  return cursor > 0 ? match.simulationLog[cursor - 1] || null : null;
}

function getHighSchoolPresentationSnapshot(match) {
  const log = Array.isArray(match?.simulationLog) ? match.simulationLog : [];
  for (let index = getHighSchoolPresentedEventCursor(match) - 1; index >= 0; index -= 1) {
    if (log[index]?.presentationSnapshot) return log[index].presentationSnapshot;
  }
  return log.find(event => event?.presentationImportance === "hidden" && event.presentationSnapshot)?.presentationSnapshot || null;
}

function isHighSchoolMatchPresentationEventVisible(event) {
  return Boolean(event) && event.presentationImportance !== "hidden";
}

function isHighSchoolMatchDecisionVisible(match) {
  if (!match || match.completed) return false;
  if (match.simulationPhase === "offensive_agency_ready") {
    const presentedAgencyEvent = getHighSchoolPresentedEvent(match);
    return presentedAgencyEvent?.type === "playerAgencyOpportunityReached"
      && presentedAgencyEvent.agencyIdentity === match.offensivePlayerAgencyState?.agencyIdentity
      && match.offensivePlayerAgencyState?.status === "pending";
  }
  if (!["moment_1_ready", "moment_2_ready", "moment_3_ready"].includes(match.simulationPhase)) return false;
  const presentedEvent = getHighSchoolPresentedEvent(match);
  return presentedEvent?.type === "meaningfulMomentReached"
    && (!presentedEvent.momentId || presentedEvent.momentId === match.currentMomentId);
}

function advanceHighSchoolPresentationCursor(match) {
  // Sole gameplay owner of cursor writes: skip metadata, commit at most one visible beat.
  const log = Array.isArray(match?.simulationLog) ? match.simulationLog : [];
  let cursor = getHighSchoolPresentedEventCursor(match);
  while (cursor < log.length) {
    const event = log[cursor];
    cursor += 1;
    match.presentedEventCursor = cursor;
    if (!isHighSchoolMatchPresentationEventVisible(event)) continue;
    if (event.type === "sideChange") {
      match.scoreboardRevealHalfIndex = Math.max(
        getHighSchoolScoreboardRevealHalfIndex(match),
        Number(event.presentationSnapshot?.lineScoreRevealHalfIndex) || 0
      );
    }
    return event;
  }
  return null;
}

function getHighSchoolPlaybackResultForPresentedEvent(event) {
  if (!event) return false;
  if (event.type === "playerEntry") return "playerEntry";
  if (event.type === "halfInningEnd") return "halfInningEnd";
  if (event.type === "sideChange") return "sideChange";
  if (event.type === "meaningfulMomentReached") return "decision";
  if (event.type === "playerAgencyOpportunityReached") return "decision";
  if (event.type === "playerRoutinePlay") return "playerRoutinePlay";
  if (event.type === "walkOff") return "walkOff";
  if (event.type === "gameEnd") return "gameEnd";
  if (event.type === "run") return "score";
  if (event.type === "plateAppearance") {
    if (event.after?.outs >= 3) return "thirdOut";
    if ((Number(event.after?.outs) || 0) > (Number(event.before?.outs) || 0)) return "outState";
    return "baseState";
  }
  return "stateBeat";
}

function getHighSchoolMatchSimulationEntityName(match, actorId) {
  if (actorId === "player") return "你";
  return getHighSchoolMatchSimulationEntity(match, actorId)?.name || (String(actorId || "").startsWith("away-") ? "對方打者" : "下一棒");
}

function getHighSchoolMatchSimulationEntity(match, actorId) {
  if (actorId === "player") return { id: "player", name: player.name || "你", speed: getOffensiveSimulationCapability(player).speed, bats: player.bats, source: "canonical-player" };
  const entities = [
    ...(match.rosters?.home?.lineup || []), ...(match.rosters?.home?.bench || []),
    ...(match.rosters?.away?.lineup || []), ...(match.rosters?.away?.bench || [])
  ];
  return entities.find(item => item.id === actorId) || null;
}

function getHighSchoolCurrentBatterPresentation(match, presentationState) {
  const team = presentationState.half === "上" ? "away" : "home";
  const lineup = match.rosters?.[team]?.lineup || [];
  const batterId = presentationState.currentBatter || match.currentBatter || getHighSchoolMatchLineupBatter(match, team)?.id || "";
  const batter = getHighSchoolMatchSimulationEntity(match, batterId);
  const resolvedSlot = lineup.findIndex(entity => entity.id === batterId);
  const battingOrderSlot = Number.isInteger(presentationState.battingOrderSlot) && presentationState.battingOrderSlot >= 0
    ? presentationState.battingOrderSlot
    : Math.max(0, resolvedSlot);
  return Object.freeze({
    id: batterId,
    name: batter?.name || (team === "away" ? "對方打者" : "下一棒"),
    battingOrderNumber: battingOrderSlot + 1,
    handedness: formatHighSchoolBatterHandedness(batter?.bats)
  });
}

function formatHighSchoolMatchSpeed(speed) {
  const rating = Number(speed) || 0;
  if (rating >= 8) return "很快";
  if (rating >= 6) return "快";
  if (rating >= 4) return "普通";
  return "慢";
}

const highSchoolBallContexts = Object.freeze({
  hardGrounder: Object.freeze({ type: "hardGrounder", family: "groundBall", pace: "hard", label: "強勁正面滾地球", detail: "球快速進入守區，接穩後仍保有完整轉傳窗口。", timeWindow: "wide" }),
  normalGrounder: Object.freeze({ type: "normalGrounder", family: "groundBall", pace: "normal", label: "普通速度滾地球", detail: "球速與距離都在一般守備節奏內。", timeWindow: "balanced" }),
  slowGrounder: Object.freeze({ type: "slowGrounder", family: "groundBall", pace: "slow", label: "慢速滾地球", detail: "需要往前衝接，能留給第二段傳球的時間較少。", timeWindow: "narrow" }),
  deepGrounder: Object.freeze({ type: "deepGrounder", family: "groundBall", pace: "normal", label: "深處滾地球", detail: "接球位置較深，傳球距離與臂力負擔都增加。", timeWindow: "longThrow" }),
  highChop: Object.freeze({ type: "highChop", family: "groundBall", pace: "normal", label: "高彈跳球", detail: "必須先等彈跳落下，再縮短接球到出手的動作。", timeWindow: "lateArrival" }),
  shallowFly: Object.freeze({ type: "shallowFly", family: "flyBall", label: "淺飛球", detail: "球落在內外野交界，需要先確認接球責任。", timeWindow: "balanced" }),
  normalFly: Object.freeze({ type: "normalFly", family: "flyBall", label: "一般飛球", detail: "有時間移動到落點並確認跑者。", timeWindow: "balanced" }),
  deepFly: Object.freeze({ type: "deepFly", family: "flyBall", label: "深遠飛球", detail: "接球後的回傳距離較長。", timeWindow: "longThrow" }),
  lineDrive: Object.freeze({ type: "lineDrive", family: "flyBall", label: "平飛球", detail: "反應時間短，第一步判斷最重要。", timeWindow: "reaction" })
});

function getHighSchoolBallContext(match) {
  if (match?.ballContext && typeof match.ballContext === "object" && ["bunt", "ordinaryBattedBall"].includes(match.ballContext.sourceFamily)) {
    return Object.freeze({ ...match.ballContext });
  }
  const type = typeof match?.ballContext === "string" ? match.ballContext : match?.ballContext?.type;
  return highSchoolBallContexts[type] || highSchoolBallContexts.normalGrounder;
}

function deriveHighSchoolDefensiveBallContext(match) {
  const testContext = {
    "一壘手": "hardGrounder",
    "二壘手": "normalGrounder",
    "游擊手": "deepGrounder",
    "三壘手": "slowGrounder"
  }[match.developmentPositionOverride];
  const type = testContext || (match.position === "外野手" ? "lineDrive"
    : match.position === "捕手" ? "highChop"
      : match.position === "投手" ? "slowGrounder"
        : match.role === "starter" ? "hardGrounder" : match.role === "bench" ? "slowGrounder" : "deepGrounder");
  return Object.freeze({ ...highSchoolBallContexts[type] });
}

function setHighSchoolDefensiveBallContext(match, type = "") {
  const context = highSchoolBallContexts[type] || deriveHighSchoolDefensiveBallContext(match);
  match.ballContext = { ...context };
  return match.ballContext;
}

function getHighSchoolDefensiveTimeWindow(match) {
  const context = getHighSchoolBallContext(match);
  const modifiers = {
    hardGrounder: { fielding: 2, transfer: 2 },
    normalGrounder: { fielding: 0, transfer: 0 },
    slowGrounder: { fielding: 0, transfer: -3 },
    deepGrounder: { fielding: 1, transfer: -2 },
    highChop: { fielding: -1, transfer: -2 }
  }[context.type] || { fielding: 0, transfer: 0 };
  return Object.freeze({ type: context.timeWindow, fieldingModifier: modifiers.fielding, transferModifier: modifiers.transfer });
}

function formatHighSchoolBatterHandedness(bats) {
  return bats === "L" ? "左打" : bats === "S" ? "左右開弓" : "右打";
}

let highSchoolOffensiveTacticalDebugTrace = null;
let highSchoolOffensiveBuntDebugTrace = null;

function getHighSchoolOffensiveTacticalDebugTrace() {
  return highSchoolOffensiveTacticalDebugTrace
    ? Object.freeze(JSON.parse(JSON.stringify(highSchoolOffensiveTacticalDebugTrace))) : null;
}

function getHighSchoolOffensiveBuntDebugTrace() {
  return highSchoolOffensiveBuntDebugTrace
    ? Object.freeze(JSON.parse(JSON.stringify(highSchoolOffensiveBuntDebugTrace))) : null;
}

function createHighSchoolOffensiveTacticalIdentity(match) {
  return [
    match?.id || "match",
    match?.inning || 0,
    match?.half || "",
    match?.offenseTeam || "",
    match?.currentBatter || "",
    Number(match?.battingOrderIndex?.[match?.offenseTeam]) || 0,
    Number(match?.outs) || 0,
    (match?.runners || []).map(Boolean).join("")
  ].join("|");
}

function getHighSchoolProvisionalOffensiveTacticalProfile(match) {
  const trailing = (Number(match?.scores?.[match?.offenseTeam]) || 0) < (Number(match?.scores?.[match?.defenseTeam]) || 0);
  return Object.freeze({
    outPreservation: trailing ? 0.66 : 0.54,
    pressureCreation: (match?.runners || []).some(Boolean) ? 0.62 : 0.5,
    variancePreference: trailing && Number(match?.inning) >= Number(match?.regulationInnings) - 1 ? 0.6 : 0.42,
    coordinationTrust: 0.52,
    informationExploitation: 0.55
  });
}

function getHighSchoolProvisionalOffensiveTacticalCapabilities(match) {
  const batter = getHighSchoolMatchSimulationEntity(match, match?.currentBatter);
  const offense = batter ? getOffensiveSimulationCapability(batter) : {};
  return Object.freeze({
    batting: Number(offense.contact) || Number(batter?.batting) || 5,
    baseRunning: Number(offense.speed) || Number(batter?.speed) || 5,
    baseballIQ: Number(offense.discipline) || Number(batter?.decision) || 5,
    ballSense: Number(batter?.ballSense) || Number(offense.contact) || 5
  });
}

function prepareHighSchoolOffensiveTacticalAction(match, options = {}) {
  if (!match || typeof OffensiveTacticalOpportunity === "undefined" || typeof OffensiveTacticalDecision === "undefined" || typeof OffensiveTacticalAction === "undefined") return null;
  const identity = createHighSchoolOffensiveTacticalIdentity(match);
  const existing = OffensiveTacticalAction.normalizeTacticalActionState(match.offensiveTacticalActionState);
  if (existing?.identity === identity) {
    match.offensiveTacticalActionState = existing;
    ensureHighSchoolOffensiveBuntPATacticalPlan(match);
    match.opponentTacticalTruth = { code: existing.selectedTacticalAction, targetRunnerId: match.runners?.[1] || match.runners?.[0] || match.runners?.[2] || "" };
    return existing;
  }
  const scoreDifference = (Number(match.scores?.[match.offenseTeam]) || 0) - (Number(match.scores?.[match.defenseTeam]) || 0);
  const opportunity = OffensiveTacticalOpportunity.resolveTacticalOpportunity({
    inning: match.inning,
    regulationInnings: match.regulationInnings,
    outs: match.outs,
    runners: match.runners,
    livePA: !match.completed && match.outs < 3,
    half: match.half,
    offenseTeam: match.offenseTeam,
    defenseTeam: match.defenseTeam,
    scoreDifference,
    batterId: match.currentBatter
  });
  let decision = OffensiveTacticalDecision.resolveTacticalDecision({
    opportunity,
    identity,
    seed: match.simulationSeed,
    tacticalProfile: getHighSchoolProvisionalOffensiveTacticalProfile(match),
    playerCapabilities: getHighSchoolProvisionalOffensiveTacticalCapabilities(match),
    recentObservableEvidence: Array.isArray(match.recentObservableTacticalEvidence) ? match.recentObservableTacticalEvidence : []
  });
  const fixtureOverride = options.tacticalActionOverride;
  if (fixtureOverride && opportunity.candidateActions.includes(fixtureOverride)) {
    decision = Object.freeze({ ...decision, selectedAction: fixtureOverride, debugTrace: Object.freeze({ ...decision.debugTrace, selectedTacticalAction: fixtureOverride, fixtureOverride: true }) });
  }
  const actionState = OffensiveTacticalAction.createTacticalActionState(decision);
  match.offensiveTacticalActionState = actionState;
  ensureHighSchoolOffensiveBuntPATacticalPlan(match);
  highSchoolOffensiveTacticalDebugTrace = {
    ...JSON.parse(JSON.stringify(decision.debugTrace)),
    identity: actionState.identity,
    commitment: { batter: actionState.batterCommitment, runner: actionState.runnerCommitment },
    revealTiming: actionState.revealTiming,
    observableEvents: JSON.parse(JSON.stringify(actionState.observableEvents)),
    executionDeferred: true,
    rngNamespace: decision.rngNamespace
  };
  match.opponentTacticalTruth = { code: actionState.selectedTacticalAction, targetRunnerId: match.runners?.[1] || match.runners?.[0] || match.runners?.[2] || "" };
  return actionState;
}

function ensureHighSchoolOffensiveBuntPATacticalPlan(match) {
  if (!match || typeof OffensiveBuntExecution === "undefined") return null;
  const actionState = typeof OffensiveTacticalAction !== "undefined"
    ? OffensiveTacticalAction.normalizeTacticalActionState(match.offensiveTacticalActionState) : match.offensiveTacticalActionState;
  const isBuntPlan = OffensiveBuntExecution.BUNT_ACTIONS.includes(actionState?.selectedTacticalAction);
  if (!actionState || !isBuntPlan) {
    match.offensiveBuntPAState = null;
    match.buntBallInPlayState = null;
    return null;
  }
  const existing = OffensiveBuntExecution.normalizePATacticalPlan(match.offensiveBuntPAState);
  if (existing?.identity === actionState.identity) {
    match.offensiveBuntPAState = existing;
    return existing;
  }
  match.offensiveBuntPAState = OffensiveBuntExecution.createPATacticalPlan({
    actionState,
    count: { balls: 0, strikes: 0 }
  });
  match.buntBallInPlayState = null;
  return match.offensiveBuntPAState;
}

function getHighSchoolProvisionalBuntExecutionCapabilities(match) {
  const batter = getHighSchoolMatchSimulationEntity(match, match?.currentBatter);
  const offense = batter ? getOffensiveSimulationCapability(batter) : {};
  return Object.freeze({
    batting: Number(offense.contact) || Number(batter?.batting) || 5,
    reaction: Number(batter?.baseballSkills?.reaction) || Number(batter?.reaction) || Number(batter?.defense) || 5,
    baseballIQ: Number(offense.discipline) || Number(batter?.baseballSkills?.baseballIQ) || Number(batter?.decision) || 5,
    ballSense: Number(batter?.ballSense) || Number(offense.contact) || 5
  });
}

function createHighSchoolBuntActualPitch(match, plan, options = {}) {
  if (options.actualPitch) return OffensiveBuntExecution.normalizeActualPitch(options.actualPitch);
  if (typeof OffensivePlateApproach === "undefined") return OffensiveBuntExecution.normalizeActualPitch({});
  const pitcherRuntime = ensureHighSchoolPitcherRuntimeState(match);
  const state = OffensivePlateApproach.createPlateAppearanceState({
    paIdentity: plan.identity,
    batterId: match.currentBatter || "batter",
    balls: plan.count.balls,
    strikes: plan.count.strikes,
    pitchNumber: plan.pitchNumber,
    pitcherRuntime,
    context: {
      scoringPosition: Boolean(match.runners?.[1] || match.runners?.[2]),
      highLeverage: Number(match.inning) >= Number(match.regulationInnings || 7) - 1
    }
  });
  const pitch = OffensivePlateApproach.generatePitchOpportunity(state);
  return OffensiveBuntExecution.normalizeActualPitch(pitch);
}

function getHighSchoolBuntPitchRecognition(match, plan, actualPitch, capabilities, options = {}) {
  if (options.recognition) return OffensiveBuntExecution.normalizeRecognition(options.recognition, actualPitch);
  if (typeof OffensivePlateApproach === "undefined") return OffensiveBuntExecution.normalizeRecognition({}, actualPitch);
  const profile = OffensivePlateApproach.PITCH_CLASS_PROFILES[actualPitch.pitchLocationClass];
  const recognitionPitch = {
    ...actualPitch,
    recognitionDifficulty: profile?.recognitionDifficulty ?? 0.5
  };
  const recognitionState = OffensivePlateApproach.createPlateAppearanceState({
    paIdentity: plan.identity,
    balls: plan.count.balls,
    strikes: plan.count.strikes,
    pitchNumber: plan.pitchNumber
  });
  const recognition = OffensivePlateApproach.getRecognitionResult(recognitionState, recognitionPitch, {
    observe: capabilities.reaction,
    baseballIQ: capabilities.baseballIQ,
    ballSense: capabilities.ballSense
  }, options.recognitionRoll);
  return OffensiveBuntExecution.normalizeRecognition(recognition, actualPitch);
}

function resolveHighSchoolOffensiveBuntPitch(match, options = {}) {
  if (!match || typeof OffensiveBuntExecution === "undefined") return null;
  const plan = ensureHighSchoolOffensiveBuntPATacticalPlan(match);
  if (!plan || plan.status !== "active" || plan.completed || plan.cancelled) return null;
  const actionState = match.offensiveTacticalActionState;
  const pitchCommitment = OffensiveBuntExecution.createCurrentPitchTacticalCommitment(plan, {
    revealTiming: actionState?.revealTiming
  });
  const actualPitch = createHighSchoolBuntActualPitch(match, plan, options);
  const capabilities = getHighSchoolProvisionalBuntExecutionCapabilities(match);
  const recognition = getHighSchoolBuntPitchRecognition(match, plan, actualPitch, capabilities, options);
  const provisionalBuntFit = OffensiveBuntExecution.createProvisionalBuntExecutionFit(capabilities);
  const result = OffensiveBuntExecution.resolveAndAdvanceBuntPitch({
    plan,
    pitchCommitment,
    actualPitch,
    recognition,
    provisionalBuntFit,
    rolls: options.rolls
  });
  match.offensiveBuntPAState = result.plan;
  highSchoolOffensiveBuntDebugTrace = result.debugTrace ? JSON.parse(JSON.stringify(result.debugTrace)) : null;
  return result;
}

function getHighSchoolLatestBuntPitchRecord(plan) {
  const history = Array.isArray(plan?.pitchHistory) ? plan.pitchHistory : [];
  return history.length ? history[history.length - 1] : null;
}

function findPendingHighSchoolBuntPitchPresentation(match, plan) {
  const latest = getHighSchoolLatestBuntPitchRecord(plan);
  const pitchIdentity = latest?.buntResolution?.currentPitchTacticalCommitment?.pitchIdentity || "";
  if (!pitchIdentity) return null;
  const cursor = getHighSchoolPresentedEventCursor(match);
  return (match.simulationLog || []).find(event => event.type === "buntPitchResolved"
    && event.buntPitchIdentity === pitchIdentity && Number(event.sequence) >= cursor) || null;
}

function applyHighSchoolBuntTerminalPlateAppearance(match, result) {
  if (!match || !["walk", "strikeout"].includes(result)) return null;
  const batterId = match.currentBatter;
  const offenseTeam = match.offenseTeam;
  const before = { outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const runnerFacts = applyHighSchoolSimulatedPlateAppearance(match, result, batterId, offenseTeam);
  const runsBattedIn = Math.max(0, match.scores[offenseTeam] - before.scores[offenseTeam]);
  recordHighSchoolMatchPlateAppearanceEvidence(match, batterId, result, runsBattedIn);
  const plateAppearanceEvent = recordHighSchoolMatchSimulationEvent(match, {
    type: "plateAppearance", presentationImportance: "hidden", inning: match.inning, half: match.half,
    eventClassification: "ordinaryPlay", offenseTeam, batterId, result, runsBattedIn,
    currentBatterAfter: getHighSchoolMatchNextLineupBatter(match, offenseTeam)?.id || "",
    runnerChanges: runnerFacts.runnerChanges, scoringRunnerIds: runnerFacts.scoringRunnerIds,
    thirdOutResolution: runnerFacts.thirdOutResolution, before,
    after: { outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() },
    resultAuthority: "offensiveBuntPAState.countResult"
  });
  advanceHighSchoolMatchBattingOrder(match, offenseTeam);
  assertHighSchoolMatchStateIntegrity(match, "bunt-terminal-plate-appearance");
  return plateAppearanceEvent;
}

function recordHighSchoolProductionBuntPitchEvent(match, result, batterId = match.currentBatter) {
  const resolution = result.resolution;
  const countResult = result.countResult;
  const presentation = formatHighSchoolBuntPhysicalTruth(resolution);
  return recordHighSchoolMatchSimulationEvent(match, {
    type: "buntPitchResolved",
    inning: match.inning,
    half: match.half,
    offenseTeam: match.offenseTeam,
    batterId,
    buntPAIdentity: resolution.paTacticalPlan.identity,
    buntPitchIdentity: resolution.currentPitchTacticalCommitment.pitchIdentity,
    buntPitchNumber: resolution.currentPitchTacticalCommitment.pitchNumber,
    sourceAuthority: "offensiveBuntPAState.pitchHistory",
    presentation,
    assignment: `${presentation} 球數 ${countResult.countAfter.balls}-${countResult.countAfter.strikes}。`,
    countBefore: countResult.countBefore,
    countAfter: countResult.countAfter,
    pitchResult: countResult.pitchResult,
    paResult: countResult.paResult,
    paContinues: !countResult.paEnded,
    paEnds: countResult.paEnded,
    outs: match.outs,
    scores: match.scores,
    runners: match.runners
  });
}

function resolveHighSchoolProductionBuntPitch(match, options = {}) {
  if (!match || typeof OffensiveBuntExecution === "undefined") return null;
  let plan = ensureHighSchoolOffensiveBuntPATacticalPlan(match);
  if (!plan) return null;
  if (options.initialCount && plan.pitchNumber === 0 && plan.pitchHistory.length === 0) {
    plan = OffensiveBuntExecution.createPATacticalPlan({
      ...JSON.parse(JSON.stringify(plan)),
      count: options.initialCount
    });
    match.offensiveBuntPAState = plan;
  }
  const pendingEvent = findPendingHighSchoolBuntPitchPresentation(match, plan);
  if (pendingEvent) return Object.freeze({ status: "pendingPresentation", event: pendingEvent, shouldBuildDefense: false });
  if (plan.completed || plan.cancelled) {
    return Object.freeze({
      status: plan.paResult === "ballInPlayPendingDefense" ? "fairBallReady" : "completed",
      event: null,
      shouldBuildDefense: plan.paResult === "ballInPlayPendingDefense"
    });
  }
  const result = resolveHighSchoolOffensiveBuntPitch(match, options);
  if (!result?.resolution || !result?.countResult) return null;
  const batterId = match.currentBatter;
  if (result.countResult.paEnded && ["walk", "strikeout"].includes(result.countResult.paResult)) {
    applyHighSchoolBuntTerminalPlateAppearance(match, result.countResult.paResult);
  }
  const event = recordHighSchoolProductionBuntPitchEvent(match, result, batterId);
  return Object.freeze({
    status: result.countResult.paEnded
      ? result.countResult.paResult === "ballInPlayPendingDefense" ? "fairBallResolved" : "paEnded"
      : "paContinues",
    event,
    shouldBuildDefense: false
  });
}

function getHighSchoolCompletedBuntPhysicalTruth(match) {
  const history = match?.offensiveBuntPAState?.pitchHistory;
  const resolution = Array.isArray(history) ? history.at(-1)?.buntResolution : null;
  return resolution?.contactResult === "fairContact" ? resolution : null;
}

function ensureHighSchoolBuntBallInPlayHandoff(match) {
  if (!match || typeof OffensiveBuntDefensiveHandoff === "undefined") return null;
  const physicalTruth = getHighSchoolCompletedBuntPhysicalTruth(match);
  if (!physicalTruth) return null;
  const identity = `${match.offensiveBuntPAState.identity}|defensive-handoff`;
  const existing = OffensiveBuntDefensiveHandoff.normalizeHandoff(match.buntBallInPlayState);
  if (existing?.identity === identity) {
    match.buntBallInPlayState = existing;
    return existing;
  }
  const forceState = getHighSchoolDefensiveForceState(match);
  const existingRunners = (match.runners || []).map((runnerId, index) => {
    if (!runnerId) return null;
    const entity = getHighSchoolMatchSimulationEntity(match, runnerId);
    return {
      runnerId,
      originBase: index + 1,
      speed: Number(entity?.speed) || 5,
      reaction: Number(entity?.reaction) || Number(entity?.defense) || 5
    };
  }).filter(Boolean);
  const batter = getHighSchoolMatchSimulationEntity(match, match.currentBatter);
  match.buntBallInPlayState = OffensiveBuntDefensiveHandoff.createHandoff({
    identity,
    physicalTruth,
    existingRunners,
    batterRunner: { runnerId: match.currentBatter, speed: Number(batter?.speed) || 5 },
    forceState,
    priorRunnerCommitment: match.offensiveTacticalActionState?.runnerCommitment || "",
    defenderContext: { playerPosition: match.developmentPositionOverride || getHighSchoolInfieldAssignmentPosition(match, player) }
  });
  return match.buntBallInPlayState;
}

function getHighSchoolBuntDefensiveSituationOverrides(handoff) {
  if (!handoff?.supported || typeof OffensiveBuntDefensiveHandoff === "undefined") return null;
  const projection = OffensiveBuntDefensiveHandoff.projectCanonicalRunnerMovement(handoff.runnerReassessment);
  return Object.freeze({
    playerPosition: "二壘手",
    primaryFielderPosition: "二壘手",
    ballContext: handoff.ballContext,
    ballDirection: handoff.ballContext.ballDirection,
    ballDepth: handoff.ballContext.ballDepth,
    runnerMovementProgress: projection.runnerMovementProgress,
    runnerTargets: projection.runnerTargets,
    forceChain: handoff.forceChain,
    forceState: handoff.forceState,
    routeWindowOverrides: {
      firstBaseOutWindow: handoff.timingWindows.batterRunnerFirstBaseWindow.state,
      doublePlayWindow: handoff.timingWindows.leadRunnerForceWindow.state
    },
    buntDefensiveContext: handoff
  });
}

function getHighSchoolFlyBallDefenderCatchContext(match, physicalTruth, options = {}) {
  if (options.flyBallDefenderContext) return Object.freeze({ ...options.flyBallDefenderContext });
  const expectedPosition = physicalTruth?.direction === "rightSide" ? "右外野手"
    : physicalTruth?.direction === "middle" ? "中外野手" : "";
  const roster = match?.rosters?.[match.defenseTeam] || {};
  const defender = [...(roster.lineup || []), ...(roster.bench || [])]
    .find(entity => entity?.id !== "player" && entity.position === expectedPosition);
  if (!defender) return Object.freeze({ defenderId: "", name: "", position: expectedPosition, assignmentAuthority: "unavailable" });
  const capability = getDefensiveSimulationCapability(defender, "外野手", match);
  return Object.freeze({
    defenderId: defender.id,
    name: defender.name || expectedPosition,
    position: expectedPosition,
    catching: Number(capability.fielding) || 5,
    reaction: Number(capability.reaction) || 5,
    range: Number(capability.range) || 5,
    assignmentAuthority: "existingRosterFieldTopology"
  });
}

function ensureHighSchoolOrdinaryGroundBallInPlayHandoff(match, options = {}) {
  if (!match || typeof BattedBallGroundDefense === "undefined" || typeof OffensivePlateApproach === "undefined") return null;
  if (match.offensiveTacticalActionState?.selectedTacticalAction !== "standardAttack") return null;
  const playerPosition = match.developmentPositionOverride || getHighSchoolInfieldAssignmentPosition(match, player);
  const batter = getHighSchoolMatchSimulationEntity(match, match.currentBatter);
  const paIdentity = `${createHighSchoolOffensiveTacticalIdentity(match)}|ordinary-contact`;
  const existing = BattedBallGroundDefense.normalizeHandoff(match.groundBallInPlayState);
  const existingLineDrive = typeof BattedBallLineDriveDefense !== "undefined"
    ? BattedBallLineDriveDefense.normalizeCatchState(match.lineDriveCatchState) : null;
  const existingFlyBall = typeof BattedBallFlyBallDefense !== "undefined"
    ? BattedBallFlyBallDefense.normalizeFlyBallCatchState(match.flyBallCatchState) : null;
  if (existing?.identity === `${paIdentity}|ground-defense`) {
    match.groundBallInPlayState = existing;
    return existing;
  }
  if (existingLineDrive?.identity === `${paIdentity}|line-drive-catch`) {
    match.lineDriveCatchState = existingLineDrive;
    return null;
  }
  if (existingFlyBall?.identity === `${paIdentity}|fly-ball-catch`) {
    match.flyBallCatchState = existingFlyBall;
    return null;
  }
  const defender = {
    ...getDefensiveSimulationCapability(player, "內野手"),
    ...(options.situationOverrides?.playerCapabilities || {})
  };
  const offense = getHighSchoolProvisionalOffensiveTacticalCapabilities(match);
  const initial = OffensivePlateApproach.createPlateAppearanceState({
    paIdentity,
    batterId: match.currentBatter,
    approach: "balancedAttack",
    context: { outs: match.outs, runners: match.runners.slice(), hasRunner: match.runners.some(Boolean) }
  });
  const fixture = options.ordinaryPlateAppearance || {};
  const pitch = fixture.pitch || { pitchLocationClass: "hitterPitch" };
  const pitchOptions = {
    recognitionRoll: fixture.recognitionRoll ?? 0,
    decisionRoll: fixture.decisionRoll ?? 0,
    contactRoll: fixture.contactRoll ?? 0,
    foulRoll: fixture.foulRoll ?? 1,
    physicalRolls: fixture.physicalRolls,
    outcomeRoll: fixture.outcomeRoll,
    physicalOutcomeResolver({ physicalTruth }) {
      const access = BattedBallGroundDefense.resolveGroundBallDefensiveAccess({
        physicalTruth,
        defenderContext: { playerPosition, reaction: defender.reaction, range: defender.range }
      });
      if (access.supported) return {
        result: "groundBallDefensePending",
        authority: "bbpB1PhysicalDefensePending",
        contactQuality: Number(physicalTruth.executionEvidence?.continuousContactScore) || 0,
        resolvedContact: null
      };
      if (typeof BattedBallLineDriveDefense !== "undefined") {
        const airborneContext = BattedBallLineDriveDefense.buildAirborneBallContext(physicalTruth);
        const catchAccess = airborneContext ? BattedBallLineDriveDefense.resolveCatchAccess({
          airborneContext,
          defenderContext: { playerPosition, catching: defender.fielding, reaction: defender.reaction, range: defender.range }
        }) : null;
        const catchWindow = catchAccess ? BattedBallLineDriveDefense.buildCatchTimingWindow({ airborneContext, defensiveAccess: catchAccess }) : null;
        if (catchAccess?.supported && catchWindow?.state !== "expired") return {
          result: "lineDriveCatchPending",
          authority: "bbpB2APhysicalCatchPending",
          contactQuality: Number(physicalTruth.executionEvidence?.continuousContactScore) || 0,
          resolvedContact: null
        };
      }
      if (typeof BattedBallFlyBallDefense !== "undefined") {
        const flyBallDefender = getHighSchoolFlyBallDefenderCatchContext(match, physicalTruth, options);
        const flyBallOpportunity = BattedBallFlyBallDefense.buildFlyBallCatchOpportunity({
          identity: `${paIdentity}|fly-ball-catch`, physicalTruth, runners: [], outs: match.outs,
          runnerEntities: [], defenderContext: flyBallDefender
        });
        if (flyBallOpportunity?.supported) return {
          result: "flyBallCatchPending",
          authority: "bbpB2B1PhysicalCatchPending",
          contactQuality: Number(physicalTruth.executionEvidence?.continuousContactScore) || 0,
          resolvedContact: null
        };
      }
      return null;
    }
  };
  const plateAppearanceState = OffensivePlateApproach.simulatePlateAppearance({
    state: initial,
    abilities: {
      observe: Number(offense.baseballIQ) || 5,
      baseballIQ: Number(offense.baseballIQ) || 5,
      ballSense: Number(offense.ballSense) || 5,
      batting: Number(offense.batting) || 5,
      power: Number(batter?.power) || Number(offense.batting) || 5,
      bats: batter?.bats || "R"
    },
    pitchSequence: [pitch],
    pitchOptions: [pitchOptions]
  });
  match.ordinaryDefensivePlateAppearanceState = JSON.parse(JSON.stringify(plateAppearanceState));
  const physicalTruth = plateAppearanceState.battedBallPhysicalTruth;
  const runnerEntities = match.runners.map((runnerId, index) => {
    if (!runnerId) return null;
    const entity = getHighSchoolMatchSimulationEntity(match, runnerId);
    return {
      runnerId,
      originBase: index + 1,
      speed: Number(entity?.speed) || 5,
      reaction: Number(entity?.reaction) || Number(entity?.defense) || 5,
      baseballIQ: Number(entity?.baseballIQ) || Number(entity?.decision) || 5
    };
  }).filter(Boolean);
  if (plateAppearanceState.result === "lineDriveCatchPending" && physicalTruth && typeof BattedBallLineDriveDefense !== "undefined") {
    match.groundBallInPlayState = null;
    match.flyBallCatchState = null;
    match.lineDriveCatchState = BattedBallLineDriveDefense.buildCatchOpportunity({
      identity: `${paIdentity}|line-drive-catch`,
      physicalTruth,
      runners: match.runners,
      outs: match.outs,
      runnerEntities,
      preContactRunnerStates: options.preContactRunnerStates || {},
      defenderContext: { playerPosition, catching: defender.fielding, reaction: defender.reaction, range: defender.range }
    });
    return null;
  }
  if (plateAppearanceState.result === "flyBallCatchPending" && physicalTruth && typeof BattedBallFlyBallDefense !== "undefined") {
    match.groundBallInPlayState = null;
    match.lineDriveCatchState = null;
    match.flyBallCatchState = BattedBallFlyBallDefense.buildFlyBallCatchOpportunity({
      identity: `${paIdentity}|fly-ball-catch`,
      physicalTruth,
      runners: match.runners,
      outs: match.outs,
      runnerEntities,
      preContactRunnerStates: options.preContactRunnerStates || {},
      defenderContext: getHighSchoolFlyBallDefenderCatchContext(match, physicalTruth, options)
    });
    return null;
  }
  if (plateAppearanceState.result !== "groundBallDefensePending" || !physicalTruth) {
    match.groundBallInPlayState = BattedBallGroundDefense.normalizeHandoff({
      version: BattedBallGroundDefense.VERSION,
      identity: `${paIdentity}|ground-defense`,
      sourceAuthority: "unsupportedOrdinaryContactLegacyFallback",
      physicalTruth: physicalTruth ? JSON.parse(JSON.stringify(physicalTruth)) : null,
      supported: false,
      fallbackAuthority: "existingSyntheticDefensiveContext",
      legacyFallbackResult: plateAppearanceState.result || ""
    });
    match.lineDriveCatchState = physicalTruth?.ballType === "lineDrive" && typeof BattedBallLineDriveDefense !== "undefined"
      ? BattedBallLineDriveDefense.buildCatchOpportunity({
        identity: `${paIdentity}|line-drive-catch`, physicalTruth, runners: match.runners, outs: match.outs,
        runnerEntities, preContactRunnerStates: options.preContactRunnerStates || {},
        defenderContext: { playerPosition, catching: defender.fielding, reaction: defender.reaction, range: defender.range }
      }) : null;
    match.flyBallCatchState = physicalTruth?.ballType === "flyBall" && typeof BattedBallFlyBallDefense !== "undefined"
      ? BattedBallFlyBallDefense.buildFlyBallCatchOpportunity({
        identity: `${paIdentity}|fly-ball-catch`, physicalTruth, runners: match.runners, outs: match.outs,
        runnerEntities, preContactRunnerStates: options.preContactRunnerStates || {},
        defenderContext: getHighSchoolFlyBallDefenderCatchContext(match, physicalTruth, options)
      }) : null;
    return match.groundBallInPlayState;
  }
  const forceState = BattedBallGroundDefense.deriveForceState({ runners: match.runners, outs: match.outs });
  match.lineDriveCatchState = null;
  match.flyBallCatchState = null;
  match.groundBallInPlayState = BattedBallGroundDefense.buildGroundBallDefensiveOpportunity({
    identity: `${paIdentity}|ground-defense`,
    physicalTruth,
    runners: match.runners,
    outs: match.outs,
    forceState,
    runnerEntities,
    batterRunner: { runnerId: match.currentBatter, speed: Number(batter?.speed) || 5 },
    preContactRunnerStates: options.preContactRunnerStates || {},
    defenderContext: { playerPosition, reaction: defender.reaction, range: defender.range }
  });
  return match.groundBallInPlayState;
}

function getHighSchoolGroundBallDefensiveSituationOverrides(handoff) {
  if (!handoff?.supported || typeof BattedBallGroundDefense === "undefined") return null;
  const projection = BattedBallGroundDefense.projectCanonicalRunnerMovement(handoff);
  return Object.freeze({
    playerPosition: "二壘手",
    primaryFielderPosition: "二壘手",
    ballContext: handoff.ballContext,
    ballDirection: handoff.physicalTruth.direction,
    ballDepth: "normal",
    runnerMovementProgress: projection.runnerMovementProgress,
    runnerTargets: projection.runnerTargets,
    forceChain: handoff.forceChain,
    forceState: handoff.forceState,
    routeWindowOverrides: {
      firstBaseOutWindow: handoff.timingWindows.batterRunnerFirstBaseWindow.state,
      doublePlayWindow: handoff.timingWindows.leadRunnerForceWindow.state,
      homeOutWindow: handoff.timingWindows.homeOutWindow?.state || "expired"
    },
    groundBallDefensiveContext: handoff
  });
}

function getHighSchoolLineDriveCatchDefenderContext(match, options = {}) {
  const capability = {
    ...getDefensiveSimulationCapability(player, "內野手"),
    ...(options.situationOverrides?.playerCapabilities || {})
  };
  return Object.freeze({
    playerPosition: match.developmentPositionOverride || getHighSchoolInfieldAssignmentPosition(match, player),
    catching: Number(capability.catching ?? capability.fielding) || 5,
    reaction: Number(capability.reaction) || 5,
    range: Number(capability.range) || 5
  });
}

function resolveHighSchoolLineDriveCatchOpportunity(match, options = {}) {
  if (!match || typeof BattedBallLineDriveDefense === "undefined") return null;
  const state = BattedBallLineDriveDefense.normalizeCatchState(match.lineDriveCatchState);
  if (!state?.supported || state.catchResult) return state;
  const catchResult = BattedBallLineDriveDefense.resolveCatchExecution(
    state,
    getHighSchoolLineDriveCatchDefenderContext(match, options),
    { executionRoll: options.lineDriveCatchExecutionRoll }
  );
  if (!catchResult) return state;
  let paCompatibilityResult = {
    result: "out",
    authority: "physicalCatchResultToPACompatibility",
    officialScoring: "deferred"
  };
  if (!catchResult.caught) {
    const paState = OffensivePlateApproach.normalizePlateAppearanceState(match.ordinaryDefensivePlateAppearanceState);
    const lastPitch = paState?.pitchHistory?.at(-1) || {};
    const offense = getHighSchoolProvisionalOffensiveTacticalCapabilities(match);
    const batter = getHighSchoolMatchSimulationEntity(match, match.currentBatter);
    const legacyContinuation = OffensivePlateApproach.resolveLegacyBallInPlayOutcome(
      paState,
      lastPitch.pitch || { attackability: 0.5 },
      {
        batting: Number(offense.batting) || 5,
        ballSense: Number(offense.ballSense) || 5,
        power: Number(batter?.power) || Number(offense.batting) || 5,
        bats: batter?.bats || "R"
      },
      lastPitch.recognition || { correct: true },
      state.physicalTruth,
      options.ordinaryPlateAppearance?.outcomeRoll
    );
    paCompatibilityResult = {
      ...JSON.parse(JSON.stringify(legacyContinuation)),
      authority: "catchFailureToTransitionalLegacyContinuation",
      upstreamCatchResult: "notCaught",
      officialScoring: "deferred"
    };
  }
  match.lineDriveCatchState = BattedBallLineDriveDefense.applyCatchResult(state, catchResult, { paCompatibilityResult });
  return match.lineDriveCatchState;
}

function applyHighSchoolLineDriveCatchResolution(match) {
  if (!match || typeof BattedBallLineDriveDefense === "undefined") return null;
  const state = BattedBallLineDriveDefense.normalizeCatchState(match.lineDriveCatchState);
  if (!state?.supported || !state.catchResult || !state.paCompatibilityResult) return null;
  if (state.settlementApplied) return state.settlementFacts?.event || null;
  const batterId = match.currentBatter;
  const offenseTeam = match.offenseTeam;
  const before = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const paResult = state.paCompatibilityResult.result || "out";
  const runnerFacts = applyHighSchoolSimulatedPlateAppearance(match, paResult, batterId, offenseTeam);
  const after = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const runsBattedIn = Math.max(0, after.scores[offenseTeam] - before.scores[offenseTeam]);
  recordHighSchoolRoutinePlateAppearance(match, batterId, paResult, before, after, runsBattedIn, runnerFacts);
  const playerEvidence = getHighSchoolMatchPerformanceEvidence(match, "player");
  if (playerEvidence) playerEvidence.defensiveInvolvements += 1;
  if (state.catchResult.caught) match.playerContribution.outsCreated += 1;
  if (match.ordinaryDefensivePlateAppearanceState && typeof OffensivePlateApproach !== "undefined") {
    match.ordinaryDefensivePlateAppearanceState = OffensivePlateApproach.createPlateAppearanceState({
      ...JSON.parse(JSON.stringify(match.ordinaryDefensivePlateAppearanceState)),
      result: paResult,
      completed: true,
      resultApplied: true
    });
  }
  const resolution = {
    familyId: "lineDriveCatch",
    resultCode: state.catchResult.caught ? "caught" : "liveBallContinuation",
    catchResult: JSON.parse(JSON.stringify(state.catchResult)),
    airborneContext: JSON.parse(JSON.stringify(state.airborneContext)),
    runnerInitialReadStates: JSON.parse(JSON.stringify(state.runnerInitialReadStates)),
    retouchRequirements: JSON.parse(JSON.stringify(state.retouchRequirements)),
    paCompatibilityResult: JSON.parse(JSON.stringify(state.paCompatibilityResult)),
    outsCreated: runnerFacts.thirdOutResolution.outsAfter - runnerFacts.thirdOutResolution.outsBefore,
    runnerChanges: JSON.parse(JSON.stringify(runnerFacts.runnerChanges)),
    scoringRunnerIds: JSON.parse(JSON.stringify(runnerFacts.scoringRunnerIds)),
    thirdOutResolution: JSON.parse(JSON.stringify(runnerFacts.thirdOutResolution))
  };
  match.lastDefensiveResolution = JSON.parse(JSON.stringify(resolution));
  advanceHighSchoolMatchBattingOrder(match, offenseTeam);
  const presentation = state.catchResult.caught
    ? state.retouchRequirements.some(requirement => !requirement.satisfiedAtCatch)
      ? "球在落地前進入手套；離壘跑者必須回到原壘完成觸壘。"
      : "球在落地前進入手套；壘上跑者留在原壘。"
    : "接球未完成，球落地後仍是活球，後續壘位依實際推進結算。";
  match.currentDomain = "flow";
  match.currentAssignment = formatHighSchoolMatchWorldState(match, presentation);
  const event = recordHighSchoolMatchSimulationEvent(match, {
    type: "playerRoutinePlay",
    eventClassification: "playerRoutinePlay",
    decisionTension: "routine",
    presentationImportance: "attention",
    inning: match.inning,
    half: match.half,
    offenseTeam,
    batterId,
    currentBatterAfter: match.currentBatter,
    playerPosition: state.defensiveAccess.playerPosition,
    familyId: "lineDriveCatch",
    resultCode: resolution.resultCode,
    airborneContext: state.airborneContext,
    runnerInitialReadStates: state.runnerInitialReadStates,
    defensiveAccess: state.defensiveAccess,
    catchWindow: state.catchWindow,
    catchResult: state.catchResult,
    retouchRequirements: state.retouchRequirements,
    liveBallContinuation: state.liveBallContinuation,
    paCompatibilityResult: state.paCompatibilityResult,
    outsCreated: resolution.outsCreated,
    runnerChanges: runnerFacts.runnerChanges,
    scoringRunnerIds: runnerFacts.scoringRunnerIds,
    thirdOutResolution: runnerFacts.thirdOutResolution,
    before,
    after,
    outs: match.outs,
    scores: match.scores,
    runners: match.runners,
    presentation,
    assignment: match.currentAssignment
  });
  const settlementFacts = { before, after, runnerFacts: JSON.parse(JSON.stringify(runnerFacts)), event: JSON.parse(JSON.stringify(event)) };
  match.lineDriveCatchState = BattedBallLineDriveDefense.applyCatchResult(state, state.catchResult, {
    paCompatibilityResult: state.paCompatibilityResult,
    settlementFacts,
    settlementApplied: true
  });
  assertHighSchoolMatchStateIntegrity(match, "line-drive-catch-resolution");
  return event;
}

function resolveHighSchoolFlyBallCatchOpportunity(match, options = {}) {
  if (!match || typeof BattedBallFlyBallDefense === "undefined") return null;
  const state = BattedBallFlyBallDefense.normalizeFlyBallCatchState(match.flyBallCatchState);
  if (!state?.supported || state.catchResult) return state;
  const catchResult = BattedBallFlyBallDefense.resolveFlyBallCatchExecution(state, {
    executionRoll: options.flyBallCatchExecutionRoll
  });
  if (!catchResult) return state;
  let paCompatibilityResult = {
    result: "out",
    authority: "physicalFlyBallCatchToPACompatibility",
    officialScoring: "deferred"
  };
  if (!catchResult.caught) {
    const paState = OffensivePlateApproach.normalizePlateAppearanceState(match.ordinaryDefensivePlateAppearanceState);
    const lastPitch = paState?.pitchHistory?.at(-1) || {};
    const offense = getHighSchoolProvisionalOffensiveTacticalCapabilities(match);
    const batter = getHighSchoolMatchSimulationEntity(match, match.currentBatter);
    const legacyContinuation = OffensivePlateApproach.resolveLegacyBallInPlayOutcome(
      paState,
      lastPitch.pitch || { attackability: 0.5 },
      {
        batting: Number(offense.batting) || 5,
        ballSense: Number(offense.ballSense) || 5,
        power: Number(batter?.power) || Number(offense.batting) || 5,
        bats: batter?.bats || "R"
      },
      lastPitch.recognition || { correct: true },
      state.physicalTruth,
      options.ordinaryPlateAppearance?.outcomeRoll
    );
    paCompatibilityResult = {
      ...JSON.parse(JSON.stringify(legacyContinuation)),
      authority: "flyBallCatchFailureToTransitionalLegacyContinuation",
      upstreamCatchResult: "notCaught",
      officialScoring: "deferred"
    };
  }
  match.flyBallCatchState = BattedBallFlyBallDefense.applyFlyBallCatchResult(state, catchResult, { paCompatibilityResult });
  return match.flyBallCatchState;
}

function applyHighSchoolFlyBallCatchResolution(match) {
  if (!match || typeof BattedBallFlyBallDefense === "undefined") return null;
  const state = BattedBallFlyBallDefense.normalizeFlyBallCatchState(match.flyBallCatchState);
  if (!state?.supported || !state.catchResult || !state.paCompatibilityResult) return null;
  if (state.settlementApplied) return state.settlementFacts?.event || null;
  const batterId = match.currentBatter;
  const offenseTeam = match.offenseTeam;
  const before = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const paResult = state.paCompatibilityResult.result || "out";
  const runnerFacts = applyHighSchoolSimulatedPlateAppearance(match, paResult, batterId, offenseTeam);
  const after = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const runsBattedIn = Math.max(0, after.scores[offenseTeam] - before.scores[offenseTeam]);
  recordHighSchoolRoutinePlateAppearance(match, batterId, paResult, before, after, runsBattedIn, runnerFacts);
  if (match.ordinaryDefensivePlateAppearanceState && typeof OffensivePlateApproach !== "undefined") {
    match.ordinaryDefensivePlateAppearanceState = OffensivePlateApproach.createPlateAppearanceState({
      ...JSON.parse(JSON.stringify(match.ordinaryDefensivePlateAppearanceState)),
      result: paResult,
      completed: true,
      resultApplied: true
    });
  }
  const resolution = {
    familyId: "flyBallCatch",
    resultCode: state.catchResult.caught ? "caught" : "liveBallContinuation",
    defenderContext: JSON.parse(JSON.stringify(state.defenderContext)),
    catchResult: JSON.parse(JSON.stringify(state.catchResult)),
    airborneContext: JSON.parse(JSON.stringify(state.airborneContext)),
    runnerInitialReadStates: JSON.parse(JSON.stringify(state.runnerInitialReadStates)),
    postCatchRunnerStates: JSON.parse(JSON.stringify(state.postCatchRunnerStates)),
    pendingTagUpHandoff: JSON.parse(JSON.stringify(state.pendingTagUpHandoff)),
    paCompatibilityResult: JSON.parse(JSON.stringify(state.paCompatibilityResult)),
    outsCreated: runnerFacts.thirdOutResolution.outsAfter - runnerFacts.thirdOutResolution.outsBefore,
    runnerChanges: JSON.parse(JSON.stringify(runnerFacts.runnerChanges)),
    scoringRunnerIds: JSON.parse(JSON.stringify(runnerFacts.scoringRunnerIds)),
    thirdOutResolution: JSON.parse(JSON.stringify(runnerFacts.thirdOutResolution))
  };
  match.lastDefensiveResolution = JSON.parse(JSON.stringify(resolution));
  advanceHighSchoolMatchBattingOrder(match, offenseTeam);
  const legalHomeTag = state.postCatchRunnerStates.find(runner => runner.tagUpLegality?.advancementLegal && runner.tagUpLegality.targetBase === "home");
  const presentation = !state.catchResult.caught
    ? "球沒有被接住，仍是活球。"
    : state.outsAfterCatch >= 3
      ? "球被守備員接住，打者出局；第三個出局成立，半局結束。"
      : legalHomeTag
        ? "球被守備員接住，打者出局。三壘跑者已在原壘建立合法起點，現在具備起跑資格。"
        : "球被守備員接住，打者出局；壘上跑者仍需依回壘狀態確認合法起點。";
  match.currentDomain = "flow";
  match.currentAssignment = formatHighSchoolMatchWorldState(match, presentation);
  const event = recordHighSchoolMatchSimulationEvent(match, {
    type: "flyBallCatchResolution",
    eventClassification: "ordinaryPlay",
    presentationImportance: "attention",
    inning: match.inning,
    half: match.half,
    offenseTeam,
    batterId,
    currentBatterAfter: match.currentBatter,
    familyId: "flyBallCatch",
    resultCode: resolution.resultCode,
    defenderContext: state.defenderContext,
    airborneContext: state.airborneContext,
    runnerInitialReadStates: state.runnerInitialReadStates,
    defensiveAccess: state.defensiveAccess,
    catchWindow: state.catchWindow,
    catchResult: state.catchResult,
    outsAfterCatch: state.outsAfterCatch,
    postCatchRunnerStates: state.postCatchRunnerStates,
    pendingTagUpHandoff: state.pendingTagUpHandoff,
    liveBallContinuation: state.liveBallContinuation,
    paCompatibilityResult: state.paCompatibilityResult,
    outsCreated: resolution.outsCreated,
    runnerChanges: runnerFacts.runnerChanges,
    scoringRunnerIds: runnerFacts.scoringRunnerIds,
    thirdOutResolution: runnerFacts.thirdOutResolution,
    before,
    after,
    outs: match.outs,
    scores: match.scores,
    runners: match.runners,
    presentation,
    assignment: match.currentAssignment
  });
  const settlementFacts = { before, after, runnerFacts: JSON.parse(JSON.stringify(runnerFacts)), event: JSON.parse(JSON.stringify(event)) };
  match.flyBallCatchState = BattedBallFlyBallDefense.applyFlyBallCatchResult(state, state.catchResult, {
    paCompatibilityResult: state.paCompatibilityResult,
    settlementFacts,
    settlementApplied: true
  });
  assertHighSchoolMatchStateIntegrity(match, "fly-ball-catch-resolution");
  return event;
}

function cancelHighSchoolOffensiveBuntPATacticalPlan(match, reason = "explicitCancellation") {
  if (!match?.offensiveBuntPAState || typeof OffensiveBuntExecution === "undefined") return null;
  match.offensiveBuntPAState = OffensiveBuntExecution.cancelPATacticalPlan(match.offensiveBuntPAState, reason);
  return match.offensiveBuntPAState;
}

function formatHighSchoolBuntPhysicalTruth(resolution) {
  return typeof OffensiveBuntExecution === "undefined" ? "" : OffensiveBuntExecution.formatBuntPhysicalTruth(resolution);
}

function advanceHighSchoolOffensiveTacticalReveal(match, phase = "lateReveal") {
  if (!match?.offensiveTacticalActionState || typeof OffensiveTacticalAction === "undefined") return null;
  match.offensiveTacticalActionState = OffensiveTacticalAction.advanceTacticalReveal(match.offensiveTacticalActionState, phase);
  if (highSchoolOffensiveTacticalDebugTrace?.identity === match.offensiveTacticalActionState.identity) {
    highSchoolOffensiveTacticalDebugTrace.observableEvents = JSON.parse(JSON.stringify(match.offensiveTacticalActionState.observableEvents));
  }
  return match.offensiveTacticalActionState;
}

function getHighSchoolOpponentObservableCues(match) {
  const tacticalCues = typeof OffensiveTacticalAction !== "undefined"
    ? OffensiveTacticalAction.formatObservableTacticalInformation(
      OffensiveTacticalAction.getObservableTacticalEvents(match?.offensiveTacticalActionState)
    ) : [];
  if (!(match.runners || []).some(Boolean)) {
    return Object.freeze([
      ...tacticalCues,
      "打者已完成起跑準備，接球後要盡快把球送往一壘。",
      "先讀球的速度與落點，再決定接球腳步與傳球節奏。"
    ]);
  }
  return Object.freeze([
    ...tacticalCues,
    "壘上跑者隨投球準備啟動。",
    "先讀球的速度與落點，再確認最短的出局目標。"
  ]);
}

function getHighSchoolDefensiveObservation(match) {
  if (match.currentDomain !== "defense") return null;
  const batterId = match.currentBatter || getHighSchoolMatchLineupBatter(match, match.offenseTeam)?.id || "";
  const batter = getHighSchoolMatchSimulationEntity(match, batterId);
  const runners = match.runners.map((runnerId, index) => {
    if (!runnerId) return null;
    const entity = getHighSchoolMatchSimulationEntity(match, runnerId);
    return Object.freeze({
      base: index + 1,
      label: `${["一壘", "二壘", "三壘"][index]}跑者`,
      name: entity?.name || "對方跑者",
      speed: formatHighSchoolMatchSpeed(entity?.speed || 5)
    });
  }).filter(Boolean);
  const infieldInformation = match.defensiveSituation?.familyId === "infield"
    ? infieldDecisionFamily.adaptInformation(match.defensiveSituation, player) : null;
  return Object.freeze({
    batter: Object.freeze({ name: batter?.name || "對方打者", handedness: formatHighSchoolBatterHandedness(batter?.bats), speed: formatHighSchoolMatchSpeed(batter?.speed || 5) }),
    runners: Object.freeze(runners),
    ballContext: Object.freeze({ ...getHighSchoolBallContext(match) }),
    infield: infieldInformation,
    cues: Object.freeze([...(infieldInformation ? [infieldInformation.readCue] : []), ...getHighSchoolOpponentObservableCues(match)])
  });
}

function deriveHighSchoolCoachTacticalDirection(match) {
  const domain = match.currentDomain === "defense" ? "defense" : "offense";
  const scoreDifference = (Number(match.scores?.home) || 0) - (Number(match.scores?.away) || 0);
  const force = getHighSchoolDefensiveForceState(match);
  const offensiveContext = analyzeHighSchoolOffensiveDecisionContext(match);
  const previousTier = match.completedMoments?.at(-1)?.tier || "";
  let intent = "patientApproach";
  let priority = "讓投手把球帶進可處理的區域";
  if (domain === "defense") {
    const infieldScoreContext = match.defensiveSituation?.familyId === "infield"
      ? match.defensiveSituation.scoreContext : deriveInfieldScoreContext(match);
    const infieldSituation = match.defensiveSituation?.familyId === "infield" ? match.defensiveSituation : null;
    const homeRouteDefinition = force.forceAtHome ? SECOND_BASE_ROUTE_DEFINITIONS.homeForceOut : SECOND_BASE_ROUTE_DEFINITIONS.preventRunHome;
    const homeRouteAvailability = infieldSituation?.playerPosition === "二壘手"
      ? evaluateDefensiveRouteAvailability(infieldSituation, homeRouteDefinition) : null;
    if (match.outs >= 2) {
      intent = "secureOut";
      priority = "完成最短的第三個出局";
    } else if (force.third && infieldScoreContext.runPriority === "exchangeRunForOut") {
      intent = "secureOut";
      priority = "比分允許用一分換取最穩定的出局，先避免形成大局。";
    } else if (force.third && homeRouteAvailability?.viable) {
      intent = "preventRun";
      priority = "先阻止三壘跑者直接改寫比分";
    } else if (force.third && homeRouteAvailability?.legal && !homeRouteAvailability.viable) {
      intent = "secureOut";
      priority = "本壘已經來不及，先換一個出局數。";
    } else if (force.third && (!infieldSituation || infieldSituation.playerPosition !== "二壘手")) {
      intent = "preventRun";
      priority = "先讀三壘跑者是否啟動，再決定是否守住本壘";
    } else if (force.forceAtThird) {
      intent = "aggressiveOuts";
      priority = "先確認封殺點，再判斷能否增加出局數";
    } else if (force.first || force.second) {
      intent = "attackLeadRunner";
      priority = "控制最前位跑者且保留確定出局";
    } else {
      intent = "secureOut";
      priority = "把正面球轉成確定出局";
    }
  } else if (scoreDifference < 0) {
    intent = offensiveContext.hasRunner ? "secureAdvance" : "controlledAttack";
    priority = offensiveContext.hasRunner
      ? offensiveContext.twoOuts ? "兩出局後以延續打席與送回現有跑者為優先，不把犧牲推進當成可用路線" : "避免無效出局並把追分跑者往前送"
      : "先建立上壘者，讓追分局面延續";
  } else if (offensiveContext.scoringPosition) {
    intent = "secureAdvance";
    priority = offensiveContext.twoOuts ? "兩出局後用能延續攻勢的擊球送回得分位置跑者"
      : scoreDifference === 0 ? "讓得分位置上的跑者有超前機會" : "用有效擊球增加保險分";
  } else if (!offensiveContext.hasRunner) {
    intent = "createPressure";
    priority = "先形成上壘與後續壓力";
  }
  return Object.freeze({
    domain,
    intent,
    riskPreference: previousTier === "strong" ? "trusted" : previousTier === "failure" ? "controlled" : match.role === "starter" ? "balanced" : "measured",
    priority,
    sourceCoachId: "high-school-head-coach",
    presentationStyle: "detail-oriented"
  });
}

function getHighSchoolCoachTacticalContextSignature(match) {
  return JSON.stringify({
    momentId: match.currentMomentId || "",
    domain: match.currentDomain || "",
    inning: Number(match.inning) || 0,
    half: match.half || "",
    home: Number(match.scores?.home) || 0,
    away: Number(match.scores?.away) || 0,
    outs: Number(match.outs) || 0,
    runners: (match.runners || []).slice(0, 3).map(runner => runner || ""),
    ballContext: getHighSchoolBallContext(match).type,
    role: match.role || "",
    assignment: match.currentAssignment || ""
  });
}

function getHighSchoolCurrentCoachTacticalDirection(match) {
  const signature = getHighSchoolCoachTacticalContextSignature(match);
  const saved = match.coachTacticalDirection || {};
  const expectedDomain = match.currentDomain === "defense" ? "defense" : "offense";
  return match.coachTacticalContextSignature === signature && saved.intent && saved.domain === expectedDomain
    ? saved : deriveHighSchoolCoachTacticalDirection(match);
}

function formatHighSchoolCoachTacticalDirection(direction, match) {
  if (!direction?.intent) return "先讀清楚目前局勢，再決定如何完成你的任務。";
  if (direction.priority === "本壘已經來不及，先換一個出局數。") return direction.priority;
  const lines = {
    createPressure: "先把這個打席延續下來，讓後面的棒次有施壓空間。",
    secureAdvance: match.outs >= 2 ? "兩出局後不能拿出局交換推進；用能延續攻勢的擊球處理真實壘況。" : "先看最前方跑者與出局數，讓有效擊球真正改變得分位置。",
    controlledAttack: "我們需要追分，但不要用無效出局換一次勉強的揮棒。",
    patientApproach: "把好球帶守住，有能處理的球再把攻勢接起來。",
    secureOut: match.outs >= 2 ? "現在只需要一個確定出局，先把這個半局收乾淨。" : "先確認接球點，把最短的出局穩定拿下來。",
    preventRun: "三壘跑者會直接改寫比分；先守住得分，再處理後續出局。",
    attackLeadRunner: "先看最前位跑者，但不要為了追人放掉原本能拿的出局。",
    aggressiveOuts: "封殺點已經形成；先拿確定出局，有條件才增加第二個出局數。"
  };
  const trust = direction.riskPreference === "trusted" ? "前一段已經建立信任，這次由你讀完整局面。"
    : direction.riskPreference === "controlled" ? "上一段先留在身後，這次只按現在的壘況處理。" : "";
  return `${lines[direction.intent] || direction.priority}${trust ? ` ${trust}` : ""}`;
}

function setHighSchoolCoachTacticalDirection(match) {
  const direction = deriveHighSchoolCoachTacticalDirection(match);
  match.coachTacticalDirection = { ...direction };
  match.coachTacticalContextSignature = getHighSchoolCoachTacticalContextSignature(match);
  match.coachInstruction = formatHighSchoolCoachTacticalDirection(direction, match);
  return match.coachTacticalDirection;
}

function getHighSchoolPlateAppearanceResultText(event) {
  const direction = typeof event.hitDirectionLabel === "string" && event.hitDirectionLabel.trim()
    ? `${event.hitDirectionLabel.trim()}方向` : "";
  const hits = {
    single: `${direction}一壘安打`,
    double: `${direction}二壘安打`,
    triple: `${direction}三壘安打`,
    homeRun: `${direction}全壘打`
  };
  if (hits[event.result]) return `擊出${hits[event.result]}`;
  if (event.result === "walk") return "獲得保送";
  if (event.result === "productiveOut") {
    const actualAdvance = getHighSchoolCommentaryRunnerChanges(event).some(change => change.from !== "batter"
      && (change.to === "home" || (Number.isFinite(Number(change.to)) && Number(change.to) > Number(change.from))));
    return actualAdvance ? "以出局換取跑者推進" : "形成出局";
  }
  if (event.result === "out") return "形成出局";
  return "完成打席";
}

function getHighSchoolCommentaryRunnerChanges(event) {
  if (Array.isArray(event.runnerChanges)) return event.runnerChanges;
  const before = Array.isArray(event.before?.runners) ? event.before.runners : [];
  const after = Array.isArray(event.after?.runners) ? event.after.runners : [];
  const scoring = Array.isArray(event.scoringRunnerIds) ? event.scoringRunnerIds : [];
  return before.map((runnerId, index) => {
    if (!runnerId) return null;
    const nextIndex = after.indexOf(runnerId);
    if (nextIndex >= 0) return { runnerId, from: index + 1, to: nextIndex + 1 };
    if (scoring.includes(runnerId)) return { runnerId, from: index + 1, to: "home" };
    return null;
  }).filter(Boolean);
}

function formatHighSchoolScoringContext(event) {
  const runs = Math.max(0, Number(event.runsBattedIn) || (event.scoringRunnerIds || []).length);
  if (!runs || !event.after?.scores) return "";
  const team = event.offenseTeam === "home" ? "高中球隊" : "對手";
  return `${team}攻下${runs}分，目前比分 ${event.after.scores.away}：${event.after.scores.home}`;
}

function formatHighSchoolPlateAppearanceCommentary(event, match) {
  const batterName = getHighSchoolMatchSimulationEntityName(match, event.batterId);
  const thirdOut = event.thirdOutResolution?.halfInningEnded === true || Number(event.after?.outs) >= 3;
  const movements = getHighSchoolCommentaryRunnerChanges(event)
    .filter(change => !thirdOut && change.from !== "batter" && change.to !== change.from && change.to !== "halfInningEnd")
    .map(change => formatDefensiveRunnerChange(change, match))
    .filter(Boolean);
  const scoring = formatHighSchoolScoringContext(event);
  const clauses = [`${batterName}${getHighSchoolPlateAppearanceResultText(event)}`, ...movements];
  if (scoring) clauses.push(scoring);
  if (thirdOut) clauses.push("形成第三個出局，半局結束");
  return `${event.after?.outs ?? 0} 出局｜${clauses.join("，")}。`;
}

function formatHighSchoolDefensiveResolutionCommentary(event, match) {
  if (!event.error) return event.outcome || "這次守備完成，場上局面依實際結果更新。";
  const changes = (event.runnerChanges || []).map(change => formatDefensiveRunnerChange(change, match)).filter(Boolean);
  const hadRunner = (event.runnerChanges || []).some(change => Number.isFinite(Number(change.from)));
  return `${hadRunner ? "球沒有控制住" : "球從手套邊緣彈開"}${changes.length ? `，${changes.join("，")}` : ""}。`;
}

function formatHighSchoolRoutineDefensiveCommentary(event, match) {
  const batterName = getHighSchoolMatchSimulationEntityName(match, event.batterId);
  const ball = highSchoolBallContexts[event.ballContext] || highSchoolBallContexts.normalGrounder;
  const ballDescription = event.playerPosition === "一壘手" && event.ballDirection === "straightAtPlayer"
    ? `一壘方向的${ball.label.replace("正面", "")}`
    : ball.label;
  let result = "你完成基本守備，場上局面依實際結果更新";
  if (event.initialRoute === "coverSecondFor643" && event.fallbackRoute) {
    result = event.fallbackRoute === "secureFirstBaseOut"
      ? "你補進二壘的時間太晚；游擊手沒有傳向無人接應的壘包，改傳一壘完成打者出局"
      : `原本的 6-4-3 路線失效，守備重新讀取壘況後改走${event.fallbackRouteLabel || "仍然開放的出局路線"}`;
  } else if (event.initialRoute === "coverSecondFor643" && event.outsCreated >= 2) {
    result = "游擊手收球後把第一傳送到二壘；你補位接球、踩壘並轉傳一壘完成雙殺";
  } else if (event.initialRoute === "coverSecondFor643" && event.outsCreated === 1) {
    result = event.upstreamThrowQuality && event.upstreamThrowQuality !== "clean"
      ? "游擊手第一傳稍微偏離，你調整腳步後完成二壘封殺，但回傳一壘窗口已關閉"
      : "你補位接球完成二壘封殺，但回傳一壘時打者已先到壘";
  } else if (event.error) {
    const runnerMovement = (event.runnerChanges || [])
      .filter(change => change.from !== "batter")
      .map(change => formatDefensiveRunnerChange(change, match)).filter(Boolean);
    result = `球從手套邊緣彈開，${batterName}安全上一壘${runnerMovement.length ? `，${runnerMovement.join("，")}` : ""}`;
  } else if (event.outsCreated > 0 && event.executionRoute === "selfCoverFirst") {
    result = "你正面把球收住，踩上一壘完成出局";
  } else if (event.outsCreated > 0 && event.executionRoute === "pitcherCoverFirst") {
    result = "你收住球後傳給補位投手，完成一壘出局";
  } else if (event.outsCreated > 0) {
    result = "你把球收穩後傳往一壘，完成出局";
  } else {
    result = `你控制住球時封殺窗口已關閉，${batterName}安全上一壘`;
  }
  return `${event.after?.outs ?? event.outs ?? match.outs} 出局｜${ballDescription}，${result}。`;
}

function formatMatchSimulationEvent(event, match) {
  if (!event?.type) return null;
  const halfLabel = `${event.inning || match.inning}局${event.half || match.half}`;
  if (event.type === "matchEntry") {
    return { type: event.type, priority: 2, text: `${event.outs ?? 0} 出局｜比賽已進行到${halfLabel}，目前 ${event.scores.away}：${event.scores.home}；${event.assignment}` };
  }
  if (event.type === "playerEntry") {
    return { type: event.type, priority: 5, playerRelated: true, text: `${event.outs ?? 0} 出局｜教練叫到你：${event.assignment}` };
  }
  if (event.type === "run") {
    const playerRun = event.runnerId === "player";
    return { type: event.type, priority: playerRun ? 5 : 4, playerRelated: playerRun, text: playerRun
      ? `${event.outs ?? match.outs} 出局｜你回本壘得分，高中球隊攻下一分。`
      : `${event.outs ?? match.outs} 出局｜${getHighSchoolMatchSimulationEntityName(match, event.runnerId)}回本壘得分，${event.team === "home" ? "高中球隊" : "對手"}攻下一分。` };
  }
  if (event.type === "plateAppearance") {
    const beforePlayer = event.before?.runners?.indexOf("player") ?? -1;
    const afterPlayer = event.after?.runners?.indexOf("player") ?? -1;
    const playerMoved = beforePlayer >= 0 && afterPlayer >= 0 && beforePlayer !== afterPlayer;
    const terminalThirdOut = event.thirdOutResolution?.halfInningEnded === true;
    const playerOut = beforePlayer >= 0 && afterPlayer < 0 && !terminalThirdOut && !match.simulationLog.some(item => item.type === "run" && item.sequence >= event.sequence - 4 && item.sequence < event.sequence && item.runnerId === "player");
    const thirdOut = event.after?.outs >= 3;
    const outIncreased = (Number(event.after?.outs) || 0) > (Number(event.before?.outs) || 0);
    return { type: event.type, priority: playerMoved || playerOut || Number(event.runsBattedIn) > 0 ? 5 : outIncreased ? 4 : 1, playerRelated: playerMoved || playerOut, thirdOut, outIncreased, text: formatHighSchoolPlateAppearanceCommentary(event, match) };
  }
  if (event.type === "halfInningEnd") {
    const stranded = event.playerStranded ? " 你留在壘上，這個半局未能回到本壘。" : "";
    return { type: event.type, priority: event.playerStranded ? 5 : 4, playerRelated: Boolean(event.playerStranded), text: `3 出局｜${halfLabel}結束，${event.offenseTeam === "home" ? "我方" : "對手"}${event.runsScored ? `攻下 ${event.runsScored} 分` : "沒有得分"}。${stranded}` };
  }
  if (event.type === "sideChange") {
    return { type: event.type, priority: 4, text: `0 出局｜攻守交換，進入${halfLabel}；目前比分 ${event.scores.away}：${event.scores.home}。` };
  }
  if (event.type === "meaningfulMomentReached") {
    return { type: event.type, priority: 5, text: `${event.outs ?? match.outs} 出局｜${event.assignment}` };
  }
  if (event.type === "meaningfulMomentResolved") {
    const result = event.domain === "defense" ? formatHighSchoolDefensiveResolutionCommentary(event, match) : event.outcome || `場上局面更新為${formatHighSchoolMatchRunners(event.runners)}`;
    return { type: event.type, priority: 5, playerRelated: true, text: `${event.outs ?? match.outs} 出局｜${result}` };
  }
  if (event.type === "playerRoutinePlay") {
    return { type: event.type, priority: 5, playerRelated: true, text: formatHighSchoolRoutineDefensiveCommentary(event, match) };
  }
  if (event.type === "buntPitchResolved") {
    const continuation = event.paEnds
      ? event.paResult === "strikeout" ? "這個打席以三振結束。"
        : event.paResult === "walk" ? "這個打席形成保送。" : "球已進入場內，等待後續守備處理。"
      : `球數來到 ${event.countAfter?.balls || 0}-${event.countAfter?.strikes || 0}，打席繼續。`;
    return { type: event.type, priority: 4, text: `${event.outs ?? match.outs} 出局｜${event.presentation} ${continuation}` };
  }
  if (event.type === "buntDefensiveFallback") {
    return { type: event.type, priority: 4, text: `${event.outs ?? match.outs} 出局｜${event.presentation || event.assignment}` };
  }
  if (event.type === "defensiveResolution") {
    const result = event.outsCreated >= 2 ? "完成雙殺" : event.outsCreated === 1 ? "取得一個出局" : event.error ? "守備失誤讓跑者推進" : "沒有取得出局";
    return { type: event.type, priority: 5, playerRelated: true, text: `${event.outs ?? match.outs} 出局｜這次守備${result}；目前${formatHighSchoolMatchRunners(event.runners)}。` };
  }
  if (event.type === "walkOff") return { type: event.type, priority: 5, text: `${halfLabel}，我方超前，這場比賽就此結束。` };
  if (event.type === "gameEnd") return { type: event.type, priority: 5, text: `比賽結束，終場 ${event.scores.away}：${event.scores.home}。` };
  return null;
}

function getHighSchoolMatchLiveFeed(match, startIndex = Math.max(0, getHighSchoolPresentedEventCursor(match) - 6), endIndex = null) {
  const explicitRange = arguments.length >= 2;
  const end = endIndex === null
    ? explicitRange ? (match.simulationLog || []).length : getHighSchoolPresentedEventCursor(match)
    : Math.min((match.simulationLog || []).length, Math.max(0, Number(endIndex) || 0));
  const formatted = (match.simulationLog || []).slice(Math.max(0, startIndex), end)
    .filter(isHighSchoolMatchPresentationEventVisible)
    .map(event => formatMatchSimulationEvent(event, match)).filter(Boolean);
  if (formatted.length <= 4) return formatted;
  const selected = [];
  const playerEvent = formatted.slice().reverse().find(item => item.playerRelated);
  if (playerEvent) selected.push(playerEvent);
  for (let index = formatted.length - 1; index >= 0 && selected.length < 4; index -= 1) {
    const item = formatted[index];
    if (item.priority >= 4 && !selected.includes(item)) selected.push(item);
  }
  if (!selected.length) selected.push({ type: "summary", priority: 1, text: `中間 ${formatted.length} 個打席完成，比分與壘況持續推進。` });
  return selected.sort((a, b) => formatted.indexOf(a) - formatted.indexOf(b)).slice(-4);
}

function getHighSchoolMatchPresentation(match = prepareHighSchoolYearOneMatch()) {
  const regulationInnings = Math.max(1, Number(match.regulationInnings) || 7);
  const cursor = getHighSchoolPresentedEventCursor(match);
  const snapshot = getHighSchoolPresentationSnapshot(match);
  const timelineStarted = Array.isArray(match.simulationLog) && match.simulationLog.length > 0;
  const presentationState = snapshot || (timelineStarted ? {
    inning: 1,
    half: "上",
    outs: 0,
    runners: [null, null, null],
    scores: { home: 0, away: 0 },
    assignment: "比賽尚未播放。",
    position: match.position || "",
    currentBatter: match.currentBatter || "",
    battingOrderSlot: Math.max(0, Number(match.battingOrderIndex?.away) || 0)
  } : {
    inning: match.inning,
    half: match.half,
    outs: match.outs,
    runners: match.runners,
    scores: match.scores,
    assignment: match.currentAssignment,
    position: match.currentFieldingPosition || match.position,
    currentBatter: match.currentBatter || "",
    battingOrderSlot: Math.max(0, Number(match.battingOrderIndex?.[match.offenseTeam]) || 0)
  });
  const authoritativeHalfIndex = getHighSchoolHalfInningIndex(presentationState.inning, presentationState.half);
  const revealHalfIndex = match.completed
    ? authoritativeHalfIndex + 1
    : Math.min(authoritativeHalfIndex, getHighSchoolScoreboardRevealHalfIndex(match));
  const visibleHalf = getHighSchoolHalfInningFromIndex(revealHalfIndex);
  const innings = match.completed
    ? Math.max(regulationInnings, match.inning || 1, match.lineScore?.home?.length || 0, match.lineScore?.away?.length || 0)
    : Math.max(regulationInnings, visibleHalf.inning);
  const inningNumbers = Array.from({ length: innings }, (_, index) => index + 1);
  const normalizeRuns = team => inningNumbers.map((_, index) => Number.isFinite(Number(match.lineScore?.[team]?.[index])) && match.lineScore[team][index] !== null ? Number(match.lineScore[team][index]) : null);
  const createTeamPresentation = (team, name) => {
    const runs = normalizeRuns(team);
    const halfOffset = team === "home" ? 1 : 0;
    const cells = runs.map((run, index) => {
      if (match.completed) return run;
      const halfIndex = index * 2 + halfOffset;
      if (halfIndex < revealHalfIndex) return run;
      return halfIndex === revealHalfIndex ? "…" : null;
    });
    const historicalTotal = runs.reduce((total, run, index) => {
      const halfIndex = index * 2 + halfOffset;
      return total + (halfIndex < revealHalfIndex && run !== null ? run : 0);
    }, 0);
    const visibleTotal = match.completed
      ? Number(match.scores?.[team]) || 0
      : revealHalfIndex < authoritativeHalfIndex
        ? historicalTotal
        : Number(presentationState.scores?.[team]) || 0;
    return Object.freeze({ name, runs: Object.freeze(runs), cells: Object.freeze(cells), total: Number(match.scores?.[team]) || 0, visibleTotal });
  };
  const awayPresentation = createTeamPresentation("away", match.opponent);
  const homePresentation = createTeamPresentation("home", "高中球隊");
  const revealingHistory = !match.completed && revealHalfIndex < authoritativeHalfIndex;
  const visibleScore = revealingHistory
    ? { home: homePresentation.visibleTotal, away: awayPresentation.visibleTotal }
    : { ...presentationState.scores };
  const visibleRunners = revealingHistory ? [null, null, null] : presentationState.runners.slice(0, 3);
  const visibleOuts = revealingHistory ? 0 : presentationState.outs;
  const currentBatter = getHighSchoolCurrentBatterPresentation(match, presentationState);
  const coachDirection = getHighSchoolCurrentCoachTacticalDirection(match);
  return Object.freeze({
    matchId: match.id,
    opponent: match.opponent,
    regulationInnings,
    scoreboard: Object.freeze({
      innings: inningNumbers,
      revealHalfIndex,
      currentHalf: visibleHalf,
      away: awayPresentation,
      home: homePresentation
    }),
    currentSituation: Object.freeze({
      inning: revealingHistory ? visibleHalf.inning : presentationState.inning,
      half: revealingHistory ? visibleHalf.half : presentationState.half,
      outs: visibleOuts,
      score: Object.freeze(visibleScore),
      runners: Object.freeze(visibleRunners),
      position: presentationState.position || match.position,
      assignment: revealingHistory ? `${visibleHalf.inning}局${visibleHalf.half}正在進行。` : presentationState.assignment,
      currentBatter
    }),
    bases: Object.freeze(visibleRunners.map(Boolean)),
    outs: Object.freeze([0, 1, 2].map(index => index < Math.min(3, Number(visibleOuts) || 0))),
    feed: Object.freeze((revealingHistory ? getHighSchoolScoreboardRevealFeed(match) : getHighSchoolMatchLiveFeed(match, Math.max(0, cursor - 6), cursor)).map(item => Object.freeze({ ...item }))),
    coachDirection: Object.freeze({ ...coachDirection }),
    coachLine: formatHighSchoolCoachTacticalDirection(coachDirection, match),
    defensiveObservation: getHighSchoolDefensiveObservation(match),
    playerRole: player.highSchoolTeamRole || match.role,
    entryHistory: match.matchEntryHistory,
    completed: Boolean(match.completed)
  });
}

function createHighSchoolMatchSimulationRoster(role, playerPosition) {
  const positions = ["投手", "捕手", "一壘手", "二壘手", "三壘手", "游擊手", "左外野手", "中外野手", "右外野手"];
  const homeNames = ["佐藤", "森", "小林", "中村", "伊藤", "渡邊", "山田", "吉田", "松本"];
  const awayNames = ["高橋", "石井", "清水", "林", "山口", "阿部", "池田", "橋本", "山崎"];
  const createEntity = (team, index, name) => ({
    id: `${team}-sim-${index + 1}`,
    name,
    position: positions[index],
    contact: 4 + ((index * 2 + (team === "away" ? 1 : 0)) % 5),
    power: 3 + ((index * 3 + (team === "away" ? 2 : 0)) % 5),
    speed: 3 + ((index * 4 + 1) % 5),
    defense: 4 + ((index * 5 + 2) % 5),
    arm: 4 + ((index * 3 + 3) % 5),
    bats: (index + (team === "away" ? 1 : 0)) % 4 === 0 ? "L" : "R",
    pitching: index === 0 ? 7 : 1,
    source: "simulation-roster"
  });
  const home = homeNames.map((name, index) => createEntity("home", index, name));
  const away = awayNames.map((name, index) => createEntity("away", index, name));
  const playerEntity = { id: "player", name: player.name || "你", position: playerPosition, bats: player.bats, source: "canonical-player" };
  if (role === "starter") home[5] = playerEntity;
  return {
    home: { lineup: home, bench: role === "starter" ? [] : [playerEntity] },
    away: { lineup: away, bench: [] }
  };
}

function insertPlayerIntoHighSchoolMatchLineup(match) {
  const lineup = match.rosters?.home?.lineup;
  const bench = match.rosters?.home?.bench;
  if (!Array.isArray(lineup)) return false;
  const existingSlot = lineup.findIndex(item => item.id === "player");
  if (existingSlot >= 0) {
    match.playerLineupSlot = existingSlot;
    return false;
  }
  const slot = Math.max(0, Math.min(8, Number(match.battingOrderIndex?.home) || 0));
  const replaced = lineup[slot];
  const assignedPosition = match.gameExposureState?.opportunitySnapshot?.assignedPosition
    || match.developmentPositionOverride || match.playerFieldingAssignment || match.position;
  lineup[slot] = { id: "player", name: player.name || "你", position: assignedPosition, bats: player.bats, source: "canonical-player" };
  match.rosters.home.bench = (Array.isArray(bench) ? bench : []).filter(item => item.id !== "player");
  if (replaced) match.rosters.home.bench.push(replaced);
  match.playerLineupSlot = slot;
  return { slot, replaced };
}

function shouldEnterHighSchoolMatchPlayer(match) {
  const exposureState = match?.gameExposureState;
  if (exposureState) {
    if (exposureState.pitcherExposureDeferred || exposureState.plannedUsage?.appearanceType === "noAppearance") return false;
    const opportunity = exposureState.opportunitySnapshot || {};
    const margin = Math.abs((Number(match.scores?.home) || 0) - (Number(match.scores?.away) || 0));
    const coachStyle = opportunity.coachUsageStyle || "balanced";
    const actualRole = opportunity.actualRole || match.role || "bench";
    const contextAllowsEntry = coachStyle === "developmental"
      || actualRole === "starter"
      || (coachStyle === "conservative" ? margin >= 3 : coachStyle === "performanceFirst" ? actualRole === "rotation" || margin <= 2 : actualRole === "rotation" || margin >= 2);
    if (!contextAllowsEntry || match.inning < 5) return false;
  }
  return Boolean(match && !match.playerEntryCompleted && match.playerLineupStatus === "bench"
    && match.offenseTeam === "home" && match.half === "下"
    && match.inning >= Math.max(1, Number(match.playerEntryWindowInning) || 1)
    && match.outs < 3);
}

function enterHighSchoolMatchPlayer(match) {
  assertHighSchoolMatchCapabilityAdmission(player);
  if (!shouldEnterHighSchoolMatchPlayer(match)) return false;
  const entryTruth = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const insertion = insertPlayerIntoHighSchoolMatchLineup(match);
  if (!insertion) return false;
  match.playerLineupStatus = "substitute";
  match.playerEntryCompleted = true;
  match.playerFieldingAssignment = match.gameExposureState?.opportunitySnapshot?.assignedPosition || match.developmentPositionOverride || match.position;
  match.currentFieldingPosition = match.playerFieldingAssignment;
  match.currentBatter = "player";
  const plannedAppearance = match.gameExposureState?.plannedUsage?.appearanceType || "lateGameAppearance";
  const entryLabel = !match.gameExposureState ? "叫你代打"
    : plannedAppearance === "defensiveSubstitution" ? "準備接替守備，並先從這個打席進入比賽"
    : plannedAppearance === "pinchHit" ? "叫你代打" : "叫你進入比賽";
  match.matchEntryHistory = `${match.inning}局${match.half}${match.outs}出局時，教練${entryLabel}；進場比分與壘況沿用當下比賽。`;
  match.currentAssignment = `${formatHighSchoolMatchRunners(match.runners)}、${match.outs} 出局；你從板凳進入第 ${insertion.slot + 1} 棒。`;
  setHighSchoolCoachTacticalDirection(match);
  const event = recordHighSchoolMatchSimulationEvent(match, {
    type: "playerEntry", inning: entryTruth.inning, half: entryTruth.half,
    lineupSlot: insertion.slot, replacedPlayerId: insertion.replaced?.id || "", plannedAppearanceType: plannedAppearance,
    assignment: match.currentAssignment, outs: entryTruth.outs, scores: entryTruth.scores, runners: entryTruth.runners
  });
  recordHighSchoolMatchOpportunityCheckpoint("player-entry", match, {
    lineupSlot: insertion.slot,
    entry: { inning: entryTruth.inning, half: entryTruth.half, outs: entryTruth.outs, scores: entryTruth.scores, runners: entryTruth.runners }
  });
  return event;
}

function getOffensiveSimulationCapability(subject = player) {
  if (subject?.id === "player") subject = player;
  if (subject?.source === "simulation-roster") {
    return Object.freeze({ contact: subject.contact, power: subject.power, speed: subject.speed, discipline: Math.round((subject.contact + subject.speed) / 2) });
  }
  const skills = subject.baseballSkills || {};
  return Object.freeze({
    contact: Math.round(((Number(skills.batting) || 0) * 2 + (Number(subject.ballSense) || 0) + (Number(subject.observe) || 0)) / 4),
    power: Math.round(((Number(skills.batting) || 0) + (Number(subject.fitness) || 0) + (Number(subject.instinct) || 0)) / 3),
    speed: Math.round(((Number(skills.baseRunning) || 0) * 2 + (Number(subject.fitness) || 0)) / 3),
    discipline: Math.round(((Number(skills.baseballIQ) || 0) + (Number(subject.observe) || 0) + (Number(subject.discipline) || 0)) / 3)
  });
}

function getDefensiveSimulationCapability(subject = player, position = player.primaryPosition, matchContext = subject?.highSchoolMatch) {
  if (subject?.source === "simulation-roster") {
    return Object.freeze({ fielding: subject.defense, reaction: subject.defense, range: subject.defense, arm: subject.arm, throwing: subject.arm, decision: Math.round((subject.defense + subject.contact) / 2) });
  }
  const rawSkills = subject.baseballSkills || {};
  const activeMatch = matchContext || (subject === player ? player.highSchoolMatch : null);
  const audit = getDevelopmentMatchPositionTestCapabilityAudit(subject, activeMatch);
  const skills = audit.active && !activeMatch?.completed
    ? Object.fromEntries(Object.keys(rawSkills).map(skill => [skill, audit.skills[skill]?.effective ?? rawSkills[skill]]))
    : rawSkills;
  const effectivePosition = audit.active ? audit.position : position;
  const positionTools = {
    "內野手": ["catching", "reaction", "throwing"],
    "外野手": ["catching", "range", "armStrength"],
    "捕手": ["blocking", "gameCalling", "throwing"],
    "投手": ["control", "reaction", "throwing"]
  }[position] || ["catching", "reaction", "throwing"];
  const values = positionTools.map(key => Number(skills[key]) || 0);
  const reactionSkill = Number(skills.reaction) || values[1] || 0;
  const throwingSkill = values[2] || 0;
  const armSkill = ["游擊手", "三壘手"].includes(effectivePosition) ? Number(skills.armStrength) || throwingSkill : throwingSkill;
  return Object.freeze({
    fielding: Math.round((values[0] * 2 + values[1] + (Number(subject.ballSense) || 0)) / 4),
    reaction: Math.round((reactionSkill * 2 + (Number(subject.ballSense) || 0)) / 3),
    range: Math.round(((Number(skills.range) || reactionSkill) * 2 + (Number(subject.fitness) || 0)) / 3),
    arm: Math.round((armSkill * 2 + (Number(subject.fitness) || 0)) / 3),
    throwing: Math.round((throwingSkill * 2 + (Number(subject.observe) || 0)) / 3),
    decision: Math.round(((Number(skills.baseballIQ) || 0) + (Number(subject.observe) || 0) + (Number(subject.discipline) || 0)) / 3)
  });
}

function assertHighSchoolMatchCapabilityAdmission(subject = player) {
  const validation = validateHighSchoolEntryCapability(subject);
  if (!validation.ok) {
    throw new Error(`正式高中比賽拒絕未完成 Capability Settlement 的球員：${validation.errors.join(",")}`);
  }
  return true;
}

function getPlayerCapabilitySnapshotForMatch(subject = player, match = subject?.highSchoolMatch) {
  const skills = subject?.baseballSkills || {};
  const position = match?.developmentPositionOverride || match?.playerFieldingAssignment || match?.currentFieldingPosition
    || subject?.primaryPosition || match?.position || "";
  const genesis = Object.fromEntries(CHARACTER_GENESIS_ABILITY_KEYS.map(key => {
    const base = Number(subject?.characterGenesis?.baseRoll?.[key]);
    const allocation = Number(subject?.characterGenesis?.allocation?.[key]);
    const current = ["batting", "baseRunning", "baseballIQ"].includes(key) ? skills[key] : subject?.[key];
    return [key, Number.isFinite(base) && base > 0 ? base + (Number.isFinite(allocation) ? allocation : 0) : Number(current) || 0];
  }));
  const baseballSkills = Object.fromEntries(Object.keys(createInitialPlayer().baseballSkills).map(key => [key, Number.isFinite(Number(skills[key])) ? Number(skills[key]) : null]));
  const foundation = getDebugCapabilitySnapshot(subject);
  return Object.freeze({
    route: match?.developmentFullMatchStart ? "highSchoolFullMatch" : subject?.chapter === "青棒" ? "normalHighSchoolNarrative" : subject?.route || "",
    role: match?.role || subject?.highSchoolRoleCode || "",
    position,
    idealSelf: subject?.idealSelf || "",
    genesis: Object.freeze(genesis),
    baseballSkills: Object.freeze(baseballSkills),
    capabilityFoundation: foundation,
    derivedMatchCapabilities: Object.freeze({
      offense: getOffensiveSimulationCapability(subject),
      defense: getDefensiveSimulationCapability(subject, position)
    }),
    developmentState: Object.freeze({
      age: Number(subject?.age) || 0,
      chapter: subject?.chapter || "",
      highSchoolStep: Number(subject?.highSchoolStep) || 0,
      characterGenesisCompleted: subject?.characterGenesis?.completed === true,
      characterGenesisArchetype: subject?.characterGenesis?.archetype || "",
      directStartHistory: Array.isArray(subject?.flags) && subject.flags.includes("direct_start_history"),
      primaryPosition: subject?.primaryPosition || "",
      secondaryPositions: Object.freeze((subject?.secondaryPositions || []).slice()),
      highSchoolRoleCode: subject?.highSchoolRoleCode || "",
      skillPointLedger: Number(subject?.balanceDebug?.chapterSkillPoints) || 0
    })
  });
}

function nextHighSchoolMatchSimulationRandom(match) {
  const cursor = Math.max(0, Number(match.simulationCursor) || 0);
  const seed = (Math.max(1, Number(match.simulationSeed) || 1) + cursor * 73) % 997;
  match.simulationCursor = cursor + 1;
  return ((seed * 37 + 17) % 997) / 997;
}

function getHighSchoolMatchLineupBatter(match, team) {
  const lineup = match.rosters?.[team]?.lineup || [];
  const index = Math.max(0, Number(match.battingOrderIndex?.[team]) || 0) % Math.max(1, lineup.length);
  return lineup[index] || null;
}

function getHighSchoolMatchNextLineupBatter(match, team) {
  const lineup = match.rosters?.[team]?.lineup || [];
  if (!lineup.length) return null;
  const index = ((Number(match.battingOrderIndex?.[team]) || 0) + 1) % lineup.length;
  return lineup[index] || null;
}

function advanceHighSchoolMatchBattingOrder(match, team) {
  const lineupLength = Math.max(1, match.rosters?.[team]?.lineup?.length || 9);
  match.battingOrderIndex[team] = ((Number(match.battingOrderIndex?.[team]) || 0) + 1) % lineupLength;
  match.currentBatter = getHighSchoolMatchLineupBatter(match, team)?.id || "";
}

function getHighSchoolMatchStateIntegrityIssues(match) {
  const issues = [];
  const outs = Number(match?.outs);
  if (!Number.isInteger(outs) || outs < 0 || outs > 3) issues.push("outs-out-of-range");
  const runners = Array.isArray(match?.runners) ? match.runners.slice(0, 3).filter(Boolean) : [];
  if (new Set(runners).size !== runners.length) issues.push("duplicate-runner-identity");
  if (!match?.completed && ["上", "下"].includes(match?.half)) {
    const expectedOffense = match.half === "上" ? "away" : "home";
    const expectedDefense = expectedOffense === "away" ? "home" : "away";
    if (match.offenseTeam !== expectedOffense) issues.push("offense-half-mismatch");
    if (match.defenseTeam !== expectedDefense) issues.push("defense-half-mismatch");
    if (match.offenseTeam === match.defenseTeam) issues.push("team-role-collision");
    const expectedBatter = getHighSchoolMatchLineupBatter(match, match.offenseTeam)?.id || "";
    if (expectedBatter && match.currentBatter !== expectedBatter) issues.push("current-batter-mismatch");
  }
  ["home", "away"].forEach(team => {
    const index = Number(match?.battingOrderIndex?.[team]);
    const length = match?.rosters?.[team]?.lineup?.length || 0;
    if (!Number.isInteger(index) || index < 0 || (length && index >= length)) issues.push(`${team}-batting-order-index-invalid`);
    const score = Number(match?.scores?.[team]);
    if (!Number.isFinite(score) || score < 0) issues.push(`${team}-score-invalid`);
  });
  return Object.freeze(issues);
}

function assertHighSchoolMatchStateIntegrity(match, boundary = "match") {
  const issues = getHighSchoolMatchStateIntegrityIssues(match);
  if (issues.length) throw new Error(`High school match integrity failed at ${boundary}: ${issues.join(",")}`);
  return true;
}

function syncHighSchoolMatchPlayerRunnerLocation(match) {
  match.playerRunnerLocation = match.runners.findIndex(runnerId => runnerId === "player");
  return match.playerRunnerLocation;
}

function getHighSchoolMatchPerformanceEvidence(match, actorId) {
  if (!actorId) return null;
  if (!match.performanceEvidence || typeof match.performanceEvidence !== "object") match.performanceEvidence = {};
  if (!match.performanceEvidence[actorId]) {
    match.performanceEvidence[actorId] = { plateAppearances: 0, hits: 0, walks: 0, runsScored: 0, runsBattedIn: 0, defensiveInvolvements: 0 };
  }
  return match.performanceEvidence[actorId];
}

function recordHighSchoolMatchPlateAppearanceEvidence(match, batterId, result, runsBattedIn = 0) {
  const evidence = getHighSchoolMatchPerformanceEvidence(match, batterId);
  if (!evidence) return null;
  evidence.plateAppearances += 1;
  if (["single", "double", "triple", "homeRun"].includes(result)) evidence.hits += 1;
  if (result === "walk") evidence.walks += 1;
  evidence.runsBattedIn += Math.max(0, Number(runsBattedIn) || 0);
  return evidence;
}

function recordHighSchoolMeaningfulPlateAppearance(match, batterId, result, before, after, runsBattedIn = 0, runnerFacts = {}) {
  recordHighSchoolMatchPlateAppearanceEvidence(match, batterId, result, runsBattedIn);
  return recordHighSchoolMatchSimulationEvent(match, {
    type: "plateAppearance",
    presentationImportance: "hidden",
    meaningful: true,
    eventClassification: "playerMeaningfulDecision",
    inning: after.inning,
    half: after.half,
    offenseTeam: after.half === "上" ? "away" : "home",
    batterId,
    result,
    runsBattedIn,
    runnerChanges: Array.isArray(runnerFacts.runnerChanges) ? runnerFacts.runnerChanges : [],
    scoringRunnerIds: Array.isArray(runnerFacts.scoringRunnerIds) ? runnerFacts.scoringRunnerIds : [],
    thirdOutResolution: runnerFacts.thirdOutResolution || null,
    before: { outs: before.outs, scores: { ...before.scores }, runners: before.runners.slice() },
    after: { outs: after.outs, scores: { ...after.scores }, runners: after.runners.slice() }
  });
}

function recordHighSchoolRoutinePlateAppearance(match, batterId, result, before, after, runsBattedIn = 0, runnerFacts = {}) {
  recordHighSchoolMatchPlateAppearanceEvidence(match, batterId, result, runsBattedIn);
  return recordHighSchoolMatchSimulationEvent(match, {
    type: "plateAppearance",
    presentationImportance: "hidden",
    meaningful: false,
    eventClassification: "playerRoutinePlay",
    inning: after.inning,
    half: after.half,
    offenseTeam: after.half === "上" ? "away" : "home",
    batterId,
    result,
    runsBattedIn,
    runnerChanges: Array.isArray(runnerFacts.runnerChanges) ? runnerFacts.runnerChanges : [],
    scoringRunnerIds: Array.isArray(runnerFacts.scoringRunnerIds) ? runnerFacts.scoringRunnerIds : [],
    thirdOutResolution: runnerFacts.thirdOutResolution || null,
    before: { outs: before.outs, scores: { ...before.scores }, runners: before.runners.slice() },
    after: { outs: after.outs, scores: { ...after.scores }, runners: after.runners.slice() }
  });
}

function recordHighSchoolDefensiveInterceptionEvidence(match, batterId) {
  const batterEvidence = getHighSchoolMatchPerformanceEvidence(match, batterId);
  if (batterEvidence) batterEvidence.plateAppearances += 1;
  const playerEvidence = getHighSchoolMatchPerformanceEvidence(match, "player");
  if (playerEvidence) playerEvidence.defensiveInvolvements += 1;
}

function scoreHighSchoolMatchRunner(match, runnerId, offenseTeam, source, options = {}) {
  if (!runnerId) return null;
  ensureHighSchoolMatchLineScoreInning(match, offenseTeam);
  match.scores[offenseTeam] += 1;
  match.lineScore[offenseTeam][match.inning - 1] += 1;
  if (runnerId === "player") match.playerContribution.runsScored += 1;
  const runnerEvidence = getHighSchoolMatchPerformanceEvidence(match, runnerId);
  if (runnerEvidence) runnerEvidence.runsScored += 1;
  const event = {
    type: "run", inning: match.inning, half: match.half, team: offenseTeam,
    runnerId, source,
    outs: Number.isFinite(Number(options.outsOverride)) ? Number(options.outsOverride) : match.outs,
    scores: { ...match.scores }
  };
  if (options.presentationImportance) event.presentationImportance = options.presentationImportance;
  return options.deferEvent ? event : recordHighSchoolMatchSimulationEvent(match, event);
}

const HIGH_SCHOOL_THIRD_OUT_TYPES = Object.freeze({
  force: "force",
  batterRunnerBeforeFirst: "batterRunnerBeforeFirst",
  nonForceTag: "nonForceTag",
  none: "none"
});

function resolveHighSchoolThirdOutIntegrity({
  outsBefore = 0,
  outsCreated = 0,
  runnersBefore = [],
  proposedRunnersAfter = [],
  scoringAttempts = [],
  thirdOutType = HIGH_SCHOOL_THIRD_OUT_TYPES.none
} = {}) {
  const normalizedBefore = runnersBefore.slice(0, 3);
  const normalizedAfter = proposedRunnersAfter.slice(0, 3);
  while (normalizedBefore.length < 3) normalizedBefore.push(null);
  while (normalizedAfter.length < 3) normalizedAfter.push(null);
  const outsAfter = Math.min(3, Math.max(0, Number(outsBefore) || 0) + Math.max(0, Number(outsCreated) || 0));
  const halfInningEnded = outsAfter >= 3;
  const resolvedType = halfInningEnded
    ? Object.values(HIGH_SCHOOL_THIRD_OUT_TYPES).includes(thirdOutType) && thirdOutType !== HIGH_SCHOOL_THIRD_OUT_TYPES.none
      ? thirdOutType : HIGH_SCHOOL_THIRD_OUT_TYPES.batterRunnerBeforeFirst
    : HIGH_SCHOOL_THIRD_OUT_TYPES.none;
  const attempts = (Array.isArray(scoringAttempts) ? scoringAttempts : []).filter(attempt => attempt?.runnerId);
  const scoringBarredByOutType = halfInningEnded && [HIGH_SCHOOL_THIRD_OUT_TYPES.force, HIGH_SCHOOL_THIRD_OUT_TYPES.batterRunnerBeforeFirst].includes(resolvedType);
  const legalScoringAttempts = attempts.filter(attempt => {
    if (scoringBarredByOutType) return false;
    if (halfInningEnded && resolvedType === HIGH_SCHOOL_THIRD_OUT_TYPES.nonForceTag) return attempt.timing === "beforeThirdOut";
    return true;
  });
  const legalScoringRunnerIds = legalScoringAttempts.map(attempt => attempt.runnerId);
  const invalidatedScoringRunnerIds = attempts.filter(attempt => !legalScoringRunnerIds.includes(attempt.runnerId)).map(attempt => attempt.runnerId);
  const basesAfter = halfInningEnded ? [null, null, null] : normalizedAfter;
  const strandedRunnerIds = halfInningEnded
    ? normalizedAfter.filter(runnerId => runnerId && !legalScoringRunnerIds.includes(runnerId))
    : [];
  return Object.freeze({
    outsBefore: Math.max(0, Number(outsBefore) || 0),
    outsAfter,
    thirdOutType: resolvedType,
    halfInningEnded,
    scoringAllowed: !scoringBarredByOutType,
    legalScoringRunnerIds: Object.freeze(legalScoringRunnerIds),
    invalidatedScoringRunnerIds: Object.freeze(invalidatedScoringRunnerIds),
    basesBefore: Object.freeze(normalizedBefore),
    basesAfter: Object.freeze(basesAfter),
    strandedRunnerIds: Object.freeze(strandedRunnerIds),
    halfInningTransition: halfInningEnded ? "pending" : "none"
  });
}

function applyHighSchoolSimulatedPlateAppearance(match, result, batterId, offenseTeam) {
  const runnersBefore = match.runners.slice(0, 3);
  const [first, second, third] = runnersBefore;
  let proposedRunnersAfter = runnersBefore.slice(0, 3);
  const scoringAttempts = [];
  const attemptScore = (runnerId, timing = "beforeThirdOut") => {
    if (runnerId) scoringAttempts.push({ runnerId, timing });
  };
  let outsCreated = 0;
  if (["out", "strikeout"].includes(result)) {
    outsCreated = 1;
  } else if (result === "productiveOut") {
    outsCreated = 1;
    if (match.outs + outsCreated < 3) {
      if (third) attemptScore(third);
      proposedRunnersAfter = [null, first, second];
    }
  } else if (result === "walk") {
    let nextSecond = second;
    let nextThird = third;
    if (first) {
      if (second) {
        if (third) attemptScore(third);
        nextThird = second;
      }
      nextSecond = first;
    }
    proposedRunnersAfter = [batterId, nextSecond, nextThird];
  } else if (result === "single") {
    if (third) attemptScore(third);
    proposedRunnersAfter = [batterId, first, second];
  } else if (result === "double") {
    if (third) attemptScore(third);
    if (second) attemptScore(second);
    proposedRunnersAfter = [null, batterId, first];
  } else if (result === "triple") {
    [first, second, third].forEach(runnerId => attemptScore(runnerId));
    proposedRunnersAfter = [null, null, batterId];
  } else if (result === "homeRun") {
    [first, second, third, batterId].forEach(runnerId => attemptScore(runnerId));
    proposedRunnersAfter = [null, null, null];
  }
  const thirdOutResolution = resolveHighSchoolThirdOutIntegrity({
    outsBefore: match.outs,
    outsCreated,
    runnersBefore,
    proposedRunnersAfter,
    scoringAttempts,
    thirdOutType: outsCreated > 0 ? HIGH_SCHOOL_THIRD_OUT_TYPES.batterRunnerBeforeFirst : HIGH_SCHOOL_THIRD_OUT_TYPES.none
  });
  match.outs = thirdOutResolution.outsAfter;
  const scoringEvents = thirdOutResolution.legalScoringRunnerIds.map(runnerId =>
    scoreHighSchoolMatchRunner(match, runnerId, offenseTeam, result, { deferEvent: true })
  ).filter(Boolean);
  match.runners = thirdOutResolution.basesAfter.slice();
  if (thirdOutResolution.halfInningEnded) {
    match.pendingHalfInningTermination = JSON.parse(JSON.stringify(thirdOutResolution));
  }
  syncHighSchoolMatchPlayerRunnerLocation(match);
  const scoringRunnerIds = scoringEvents.map(event => event.runnerId);
  const runnerChanges = runnersBefore.map((runnerId, index) => {
    if (!runnerId) return null;
    const nextIndex = match.runners.indexOf(runnerId);
    return {
      runnerId,
      from: index + 1,
      to: scoringRunnerIds.includes(runnerId) ? "home"
        : nextIndex >= 0 ? nextIndex + 1
          : thirdOutResolution.halfInningEnded ? "halfInningEnd" : "out"
    };
  }).filter(Boolean);
  const batterIndex = match.runners.indexOf(batterId);
  runnerChanges.push({ runnerId: batterId, from: "batter", to: batterIndex >= 0 ? batterIndex + 1 : result === "homeRun" ? "home" : "out" });
  scoringEvents.forEach(event => recordHighSchoolMatchSimulationEvent(match, { ...event, presentationImportance: "hidden" }));
  return Object.freeze({
    runnersBefore: Object.freeze(runnersBefore),
    runnersAfter: Object.freeze(match.runners.slice(0, 3)),
    runnerChanges: Object.freeze(runnerChanges.map(change => Object.freeze(change))),
    scoringRunnerIds: Object.freeze(scoringRunnerIds),
    thirdOutResolution
  });
}

function resolveSimulatedHighSchoolPlateAppearance(match, randomSource = null, options = {}) {
  if (match.completed || match.outs >= 3 || !["home", "away"].includes(match.offenseTeam)) return false;
  const batter = getHighSchoolMatchLineupBatter(match, match.offenseTeam);
  if (!batter || (batter.id === "player" && options.allowPlayer !== true)) return false;
  const capability = getOffensiveSimulationCapability(batter);
  const pitcher = (match.rosters?.[match.defenseTeam]?.lineup || []).find(item => item.position === "投手");
  const pitcherCapability = pitcher ? getDefensiveSimulationCapability(pitcher, "投手") : { fielding: 5, arm: 5, decision: 5 };
  const rawSample = typeof randomSource === "function" ? Number(randomSource()) : nextHighSchoolMatchSimulationRandom(match);
  const sample = Math.max(0, Math.min(0.999999, Number.isFinite(rawSample) ? rawSample : 0.5));
  const quality = capability.contact * 0.025 + capability.power * 0.012 + capability.discipline * 0.008;
  const pitcherPressure = ((Number(pitcher?.pitching) || 5) * 2 + pitcherCapability.decision) * 0.004;
  const runnerPressure = match.runners.some(Boolean) ? 0.01 : 0;
  const twoOutPenalty = match.outs === 2 ? 0.015 : 0;
  const trailingUrgency = match.scores[match.offenseTeam] < match.scores[match.defenseTeam] ? 0.005 : 0;
  const adjusted = Math.max(0, Math.min(0.999999, sample + quality + runnerPressure + trailingUrgency - pitcherPressure - twoOutPenalty - 0.18));
  const result = adjusted < 0.46 ? "out" : adjusted < 0.58 ? "productiveOut" : adjusted < 0.69 ? "walk" : adjusted < 0.88 ? "single" : adjusted < 0.955 ? "double" : adjusted < 0.985 ? "triple" : "homeRun";
  const before = { outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const runnerFacts = applyHighSchoolSimulatedPlateAppearance(match, result, batter.id, match.offenseTeam);
  const runsBattedIn = Math.max(0, match.scores[match.offenseTeam] - before.scores[match.offenseTeam]);
  recordHighSchoolMatchPlateAppearanceEvidence(match, batter.id, result, runsBattedIn);
  recordHighSchoolMatchSimulationEvent(match, {
    type: "plateAppearance", inning: match.inning, half: match.half,
    eventClassification: "ordinaryPlay",
    offenseTeam: match.offenseTeam, batterId: batter.id, result, runsBattedIn,
    currentBatterAfter: getHighSchoolMatchNextLineupBatter(match, match.offenseTeam)?.id || "",
    runnerChanges: runnerFacts.runnerChanges, scoringRunnerIds: runnerFacts.scoringRunnerIds,
    thirdOutResolution: runnerFacts.thirdOutResolution, before,
    after: { outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() }
  });
  advanceHighSchoolMatchBattingOrder(match, match.offenseTeam);
  assertHighSchoolMatchStateIntegrity(match, "plate-appearance");
  return { batterId: batter.id, result };
}

function advanceHighSchoolMatchAfterHalfInning(match) {
  if (match.outs < 3) return false;
  const completedInning = match.inning;
  const completedHalf = match.half;
  const completedOffenseTeam = match.offenseTeam;
  const completedRuns = ensureHighSchoolMatchLineScoreInning(match, completedOffenseTeam, completedInning);
  const terminalState = match.pendingHalfInningTermination || null;
  const playerStranded = Array.isArray(terminalState?.strandedRunnerIds)
    ? terminalState.strandedRunnerIds.includes("player") : match.runners.includes("player");
  recordHighSchoolMatchSimulationEvent(match, {
    type: "halfInningEnd", inning: completedInning, half: completedHalf,
    offenseTeam: completedOffenseTeam, runsScored: completedRuns,
    outs: 3, playerStranded, scores: match.scores,
    thirdOutType: terminalState?.thirdOutType || HIGH_SCHOOL_THIRD_OUT_TYPES.none,
    scoringAllowed: terminalState?.scoringAllowed !== false,
    basesBefore: terminalState?.basesBefore || match.runners,
    basesAfter: [null, null, null],
    halfInningTransition: "completed",
    assignment: `${completedInning}局${completedHalf}三出局，半局結束。`
  });
  const nextHalf = completedHalf === "上" ? "下" : "上";
  const nextInning = completedHalf === "上" ? completedInning : completedInning + 1;
  const nextOffenseTeam = nextHalf === "上" ? "away" : "home";
  const nextDefenseTeam = nextOffenseTeam === "away" ? "home" : "away";
  const nextBatter = getHighSchoolMatchLineupBatter(match, nextOffenseTeam)?.id || "";
  Object.assign(match, {
    inning: nextInning,
    half: nextHalf,
    outs: 0,
    runners: [null, null, null],
    offenseTeam: nextOffenseTeam,
    defenseTeam: nextDefenseTeam,
    currentBatter: nextBatter,
    halfInningResolved: false
  });
  match.pendingHalfInningTermination = null;
  syncHighSchoolMatchPlayerRunnerLocation(match);
  recordHighSchoolMatchSimulationEvent(match, {
    type: "sideChange", inning: match.inning, half: match.half,
    offenseTeam: match.offenseTeam, outs: 0, scores: match.scores,
    assignment: `攻守交換，進入${match.inning}局${match.half}。`
  });
  assertHighSchoolMatchStateIntegrity(match, "side-change");
  return true;
}

function endHighSchoolMatchHalfInning(match) {
  return advanceHighSchoolMatchAfterHalfInning(match);
}

function simulateHighSchoolMatchUntilSideChange(match, randomSource = null) {
  const startingInning = match.inning;
  const startingHalf = match.half;
  let plateAppearances = 0;
  while (match.inning === startingInning && match.half === startingHalf && plateAppearances < 18) {
    if (match.outs >= 3) break;
    const result = resolveSimulatedHighSchoolPlateAppearance(match, randomSource);
    if (!result) break;
    plateAppearances += 1;
  }
  if (match.outs < 3) match.outs = 3;
  endHighSchoolMatchHalfInning(match);
  return plateAppearances;
}

function summarizeHighSchoolSimulationSegment(match, startIndex, previousScores, playerStartedOnBase) {
  const events = match.simulationLog.slice(startIndex);
  const plateAppearances = events.filter(item => item.type === "plateAppearance");
  const runs = (match.scores.home - previousScores.home) + (match.scores.away - previousScores.away);
  const playerScored = events.some(item => item.type === "run" && item.runnerId === "player");
  const actions = plateAppearances.slice(0, 3).map(item => {
    const batter = getHighSchoolMatchSimulationEntityName(match, item.batterId);
    const result = item.result === "walk" ? "選到保送" : getHighSchoolPlateAppearanceResultText(item);
    return batter && result ? `${batter}${result}` : "";
  }).filter(Boolean);
  const facts = [];
  if (playerStartedOnBase && playerScored) facts.push("後續打席把你送回本壘得分");
  else if (playerStartedOnBase && events.some(item => item.type === "halfInningEnd")) facts.push("半局結束時你留在壘上");
  facts.push(...actions);
  if (runs > 0) facts.push(`這段攻勢產生 ${runs} 分`);
  if (events.some(item => item.type === "halfInningEnd")) facts.push("第三個出局，半局結束");
  return facts.length ? `${facts.join("；")}。` : "";
}

function getHighSchoolDefenseContext(position = player.primaryPosition) {
  const contexts = {
    "內野手": {
      situation: "一、二壘有人，正面滾地球朝你的守區過來。",
      secure: "踩最近的壘包，先拿最穩定的封殺出局數",
      challenge: "接球後轉二壘，挑戰一次雙殺",
      contain: "看三壘跑者起跑，準備壓本壘再補一壘",
      tools: ["catching", "reaction", "throwing"]
    },
    "外野手": {
      situation: "一、二壘有人，平飛安打落在你前方，二壘跑者繞過三壘。",
      secure: "走 cutoff，把球交給內野封住後續壘包",
      challenge: "直接長傳本壘，挑戰正在回來的跑者",
      contain: "先壓住一壘跑者，不讓打者趁傳上二壘",
      tools: ["catching", "range", "armStrength"]
    },
    "捕手": {
      situation: "一、二壘有人，投手的變化球提前落地，跑者同時離壘。",
      secure: "先擋住球，守住所有跑者原本的壘包",
      challenge: "接起彈球後傳二壘，挑戰離壘過遠的跑者",
      contain: "先看三壘方向，再把球交回投手控制節奏",
      tools: ["blocking", "gameCalling", "throwing"]
    },
    "投手": {
      situation: "一、二壘有人，短打落在投手丘右側，兩名跑者都已啟動。",
      secure: "撿球傳一壘，先拿最穩定的出局數",
      challenge: "轉身傳三壘，挑戰最前方跑者",
      contain: "先看本壘再傳一壘，避免跑者不停壘",
      tools: ["control", "reaction", "throwing"]
    }
  };
  return contexts[position] || contexts["內野手"];
}

function getHighSchoolDefensiveForceState(match) {
  if (typeof ForceAdvancement !== "undefined") {
    const forceChain = ForceAdvancement.buildInitialLiveBallForceChain({
      runners: match.runners,
      batterRunnerId: match.currentBatter || "batter-runner"
    });
    return ForceAdvancement.deriveCompatibilityForceState(forceChain, { outs: match.outs });
  }
  const occupied = match.runners.map(Boolean);
  return Object.freeze({
    first: occupied[0],
    second: occupied[1],
    third: occupied[2],
    forceAtSecond: occupied[0],
    forceAtThird: occupied[0] && occupied[1],
    forceAtHome: occupied[0] && occupied[1] && occupied[2],
    doublePlayEligible: occupied[0] && match.outs < 2
  });
}

const positionDecisionFamilyRegistry = new Map();

function registerPositionDecisionFamily(family) {
  const requiredAdapters = ["buildSituation", "adaptInformation", "generateLegalChoices", "resolve", "analyzeCauses", "present"];
  if (!family?.id || requiredAdapters.some(adapter => typeof family[adapter] !== "function")) return false;
  positionDecisionFamilyRegistry.set(family.id, Object.freeze({ ...family }));
  return true;
}

function getPositionDecisionFamily(familyId) {
  return positionDecisionFamilyRegistry.get(familyId) || null;
}

const infieldPositions = Object.freeze(["一壘手", "二壘手", "游擊手", "三壘手"]);

function isInfieldDecisionFamilyPosition(position) {
  return position === "內野手" || infieldPositions.includes(position);
}

function getHighSchoolInfieldAssignmentPosition(match, playerContext = player) {
  if (infieldPositions.includes(match?.currentFieldingPosition)) return match.currentFieldingPosition;
  if (infieldPositions.includes(match?.position)) return match.position;
  if (infieldPositions.includes(playerContext?.primaryPosition)) return playerContext.primaryPosition;
  const secondary = (playerContext?.secondaryPositions || []).find(position => infieldPositions.includes(position));
  if (secondary && match?.position === secondary) return secondary;
  return { starter: "游擊手", rotation: "二壘手", bench: "三壘手" }[match?.role] || "游擊手";
}

function deriveInfieldBallDirection(position, ballContext, match) {
  const testDirection = {
    "一壘手": "straightAtPlayer",
    "二壘手": "upTheMiddle",
    "游擊手": "towardHole",
    "三壘手": "lineSide"
  }[match?.developmentPositionOverride];
  if (testDirection) return testDirection;
  if (ballContext.type === "deepGrounder") return position === "游擊手" ? "towardHole" : position === "二壘手" ? "upTheMiddle" : "lineSide";
  if (ballContext.type === "slowGrounder") return position === "三壘手" || position === "一壘手" ? "lineSide" : "rightSide";
  if (ballContext.type === "hardGrounder") return position === "三壘手" ? "leftSide" : "straightAtPlayer";
  const directions = position === "二壘手" ? ["rightSide", "upTheMiddle", "straightAtPlayer", "leftSide"]
    : position === "游擊手" ? ["leftSide", "towardHole", "upTheMiddle"]
      : ["straightAtPlayer", "lineSide", "leftSide"];
  return directions[(Number(match?.simulationCursor) || 0) % directions.length];
}

function deriveInfieldBallDepth(ballContext) {
  if (ballContext.type === "slowGrounder") return "shallow";
  if (ballContext.type === "deepGrounder") return "deep";
  return "normal";
}

function deriveInfieldScoreContext(match) {
  const home = Number(match?.scores?.home) || 0;
  const away = Number(match?.scores?.away) || 0;
  const differential = home - away;
  const regulationInnings = Number(match?.regulationInnings) || 7;
  const late = Number(match?.inning) >= Math.max(1, regulationInnings - 1);
  return Object.freeze({
    differential,
    phase: late ? "late" : Number(match?.inning) <= 3 ? "early" : "middle",
    runPriority: late && Math.abs(differential) <= 1 ? "critical" : differential >= 4 ? "exchangeRunForOut" : "balanced"
  });
}

function getInfieldTeammateForPosition(match, position) {
  const entities = [...(match?.rosters?.home?.lineup || []), ...(match?.rosters?.home?.bench || [])];
  return entities.find(entity => entity.id !== "player" && entity.position === position) || null;
}

function buildInfieldTeammateContext(match, playerPosition) {
  const pivotPosition = playerPosition === "二壘手" ? "游擊手" : playerPosition === "一壘手" ? "游擊手" : "二壘手";
  const firstBasePosition = playerPosition === "一壘手" ? "投手" : "一壘手";
  const pivot = getInfieldTeammateForPosition(match, pivotPosition);
  const firstBase = getInfieldTeammateForPosition(match, firstBasePosition);
  const adapt = (entity, fallbackPosition) => {
    const capability = entity ? getDefensiveSimulationCapability(entity, entity.position) : { fielding: 5, reaction: 5, range: 5, arm: 5, throwing: 5, decision: 5 };
    return Object.freeze({
      id: entity?.id || `fallback-${fallbackPosition}`,
      name: entity?.name || fallbackPosition,
      position: entity?.position || fallbackPosition,
      receivingAvailable: Boolean(entity),
      capabilities: Object.freeze({ ...capability })
    });
  };
  return Object.freeze({
    receivingFielder: adapt(pivot, pivotPosition),
    pivotFielder: adapt(pivot, pivotPosition),
    firstBaseReceiver: adapt(firstBase, firstBasePosition),
    shortstop: adapt(getInfieldTeammateForPosition(match, "游擊手"), "游擊手"),
    secondBaseman: adapt(getInfieldTeammateForPosition(match, "二壘手"), "二壘手"),
    thirdBaseReceiver: adapt(getInfieldTeammateForPosition(match, "三壘手"), "三壘手"),
    catcher: adapt(getInfieldTeammateForPosition(match, "捕手"), "捕手")
  });
}

const SECOND_BASE_ROUTE_DEFINITIONS = Object.freeze({
  secureFirstBaseOut: Object.freeze({ id: "secureFirstBaseOut", objective: "secureOut", action: "throwFirst", targetBase: "first", route: "4-3", playerRole: "primaryFielder", teammateChain: Object.freeze(["1B"]), requirements: Object.freeze(["fieldBall"]), executionOnly: false, infieldRoute: "secureFirst" }),
  initiate463: Object.freeze({ id: "initiate463", objective: "attemptDoublePlay", action: "throwSecond", targetBase: "secondThenFirst", route: "4-6-3", playerRole: "initiator", teammateChain: Object.freeze(["SS", "1B"]), requirements: Object.freeze(["runnerOnFirst", "fewerThanTwoOuts", "forceAtSecond"]), executionOnly: false, infieldRoute: "doublePlay" }),
  coverSecondFor643: Object.freeze({ id: "coverSecondFor643", objective: "executeCoverage", action: "coverAndPivot", targetBase: "secondThenFirst", route: "6-4-3", playerRole: "coverPivot", teammateChain: Object.freeze(["SS", "1B"]), requirements: Object.freeze(["runnerOnFirst", "fewerThanTwoOuts", "forceAtSecond"]), executionOnly: true, infieldRoute: "doublePlay" }),
  attackLeadRunnerThird: Object.freeze({ id: "attackLeadRunnerThird", objective: "attackLeadRunner", action: "throwThird", targetBase: "third", route: "4-5", playerRole: "initiator", teammateChain: Object.freeze(["3B"]), requirements: Object.freeze(["runnerOnSecond", "thirdBaseOutWindow"]), executionOnly: false, infieldRoute: "forceThird" }),
  preventRunHome: Object.freeze({ id: "preventRunHome", objective: "preventRun", action: "throwHomeForTag", targetBase: "home", route: "4-2-tag", playerRole: "initiator", teammateChain: Object.freeze(["C"]), requirements: Object.freeze(["runnerAttemptingHome", "tagAtHome"]), executionOnly: false, infieldRoute: "tagHome" }),
  homeForceOut: Object.freeze({ id: "homeForceOut", objective: "preventRun", action: "throwHomeForForce", targetBase: "home", route: "4-2-force", playerRole: "initiator", teammateChain: Object.freeze(["C"]), requirements: Object.freeze(["forceAtHome"]), executionOnly: false, infieldRoute: "forceHome" })
});

function deriveDefensiveRunnerContext(runners = [], runnerSpeeds = [], overrides = {}) {
  const targets = ["second", "third", "home"];
  const movement = overrides.runnerMovementProgress || {};
  return Object.freeze(runners.slice(0, 3).map((runnerId, index) => runnerId ? Object.freeze({
    runnerId,
    currentBase: index + 1,
    targetBase: overrides.runnerTargets?.[index] || targets[index],
    speedDescriptor: formatHighSchoolMatchSpeed(Number(runnerSpeeds[index]) || 5),
    speed: Number(runnerSpeeds[index]) || 5,
    movementProgress: movement[index] || (overrides.activeRunnerBase === index + 1 ? "advancing" : "holding")
  }) : null));
}

function deriveDefensiveForceStateFromRunners(runners = [], outs = 0) {
  const [first, second, third] = runners.slice(0, 3);
  return Object.freeze({
    first: Boolean(first), second: Boolean(second), third: Boolean(third),
    forceAtSecond: Boolean(first),
    forceAtThird: Boolean(first && second),
    forceAtHome: Boolean(first && second && third),
    doublePlayEligible: Boolean(first && Number(outs) < 2)
  });
}

function resolveDefensivePlayResponsibility({ situation, primaryFielderPosition = "" } = {}) {
  const playerPosition = situation?.playerPosition || "";
  const primaryPosition = primaryFielderPosition || situation?.primaryFielderPosition || playerPosition;
  const playerIsPrimary = primaryPosition === playerPosition;
  const isSecondBasePivot = playerPosition === "二壘手" && primaryPosition === "游擊手";
  const primaryFielder = playerIsPrimary
    ? Object.freeze({ id: "player", name: "你", position: playerPosition, actor: "player" })
    : Object.freeze({ ...(situation?.teammates?.shortstop || { id: "fallback-游擊手", name: "游擊手", position: "游擊手" }), actor: "teammate" });
  const playerRole = isSecondBasePivot ? "coverPivot"
    : playerIsPrimary && situation?.forceState?.doublePlayEligible ? "initiator"
      : playerIsPrimary ? "primaryFielder" : "cover";
  const relevantTeammates = isSecondBasePivot
    ? [situation?.teammates?.shortstop, situation?.teammates?.firstBaseReceiver]
    : playerPosition === "二壘手"
      ? [situation?.teammates?.shortstop, situation?.teammates?.firstBaseReceiver, situation?.teammates?.thirdBaseReceiver, situation?.teammates?.catcher]
      : [situation?.teammates?.pivotFielder, situation?.teammates?.firstBaseReceiver];
  return Object.freeze({
    primaryFielder,
    playerRole,
    playerRoles: Object.freeze(isSecondBasePivot ? ["cover", "pivot"] : [playerRole]),
    coverageAssignments: Object.freeze(isSecondBasePivot
      ? [{ actor: "player", base: "second", role: "cover" }]
      : playerPosition === "二壘手" ? [{ actor: "SS", base: "second", role: "cover" }] : []),
    relevantTeammates: Object.freeze(relevantTeammates.filter(Boolean))
  });
}

function deriveInfieldDemandModel(situation) {
  const reach = Math.min(10, situation.firstStepDemand);
  const control = Math.min(10, 2.5 + (situation.ballContext.pace === "hard" ? 3 : situation.ballContext.pace === "slow" ? 2 : 1.5) + (situation.ballDepth === "deep" ? 1 : 0));
  const release = Math.min(10, 2.5 + (situation.ballDepth === "deep" ? 3 : situation.ballDepth === "shallow" ? 2 : 1) + (["leftSide", "rightSide", "towardHole", "lineSide"].includes(situation.ballDirection) ? 1.5 : 0));
  return Object.freeze({ reach: Number(reach.toFixed(2)), control: Number(control.toFixed(2)), release: Number(release.toFixed(2)) });
}

function classifyDefensiveExecutionWindow(value) {
  if (!Number.isFinite(value) || value < 1.75) return "expired";
  if (value < 3.5) return "narrow";
  if (value < 5.5) return "normal";
  return "wide";
}

function deriveSecondBaseExecutionWindows(situation, overrides = {}) {
  const firstRunnerSpeed = Number(situation.runnerSpeeds?.[0]) || 5;
  const secondRunnerSpeed = Number(situation.runnerSpeeds?.[1]) || 5;
  const thirdRunnerSpeed = Number(situation.runnerSpeeds?.[2]) || 5;
  // Availability is canonical geometry/timing. Player and teammate ability belong to Readiness/Execution.
  const chargePenalty = situation.ballContext.pace === "slow" ? 2 : 0;
  const depthPenalty = situation.ballDepth === "deep" ? 1.2 : situation.ballDepth === "shallow" ? 0.45 : 0;
  const orientationPenalty = ["rightSide", "leftSide", "towardHole", "lineSide"].includes(situation.ballDirection) ? 1.2 : 0;
  const numeric = {
    firstBaseOutWindow: 7 - chargePenalty - depthPenalty - Math.max(0, situation.batterSpeed - 6) * 0.3,
    secondBaseForceWindow: 7.2 - firstRunnerSpeed * 0.32 - chargePenalty - depthPenalty - orientationPenalty,
    doublePlayWindow: Math.min(7.2 - firstRunnerSpeed * 0.32 - chargePenalty - depthPenalty - orientationPenalty, 7.4 - situation.batterSpeed * 0.42 - chargePenalty - depthPenalty),
    leadRunnerThirdWindow: 7.2 - secondRunnerSpeed * 0.48 - chargePenalty - depthPenalty - orientationPenalty,
    homeOutWindow: 7 - thirdRunnerSpeed * 0.5 - chargePenalty - depthPenalty - orientationPenalty
      - (situation.runnerContext?.[2]?.movementProgress === "committed" ? 1.4 : 0)
  };
  Object.entries(overrides || {}).forEach(([key, value]) => {
    if (Object.hasOwn(numeric, key)) numeric[key] = typeof value === "string"
      ? ({ wide: 7, normal: 4.5, narrow: 2.5, expired: 0.5 }[value] ?? numeric[key])
      : Number(value);
  });
  return Object.freeze(Object.fromEntries(Object.entries(numeric).map(([key, value]) => [key, Object.freeze({ value: Number(value.toFixed(2)), state: classifyDefensiveExecutionWindow(value) })])));
}

function getSecondBaseRouteWindow(routeId, routeWindows = {}) {
  const key = {
    secureFirstBaseOut: "firstBaseOutWindow", initiate463: "doublePlayWindow", coverSecondFor643: "doublePlayWindow",
    attackLeadRunnerThird: "leadRunnerThirdWindow", preventRunHome: "homeOutWindow", homeForceOut: "homeOutWindow"
  }[routeId];
  return routeWindows[key] || Object.freeze({ value: 0, state: "expired" });
}

function evaluateDefensiveRouteAvailability(situation, routeDefinition) {
  const routeId = routeDefinition?.id || "";
  const runnerAtSecond = situation.runnerContext?.[1];
  const runnerAtThird = situation.runnerContext?.[2];
  const force = situation.forceState || {};
  const playerControlsBall = !situation.groundBallDefensiveContext
    || situation.groundBallDefensiveContext.supported === true;
  const catcherAvailable = situation.teammates?.catcher?.receivingAvailable !== false;
  const legalByRoute = {
    secureFirstBaseOut: true,
    initiate463: Boolean(force.doublePlayEligible && force.forceAtSecond),
    coverSecondFor643: Boolean(force.doublePlayEligible && force.forceAtSecond && situation.responsibility?.playerRole === "coverPivot"),
    attackLeadRunnerThird: Boolean(runnerAtSecond && runnerAtSecond.targetBase === "third"
      && (force.forceAtThird || ["advancing", "committed"].includes(runnerAtSecond.movementProgress))),
    preventRunHome: Boolean(runnerAtThird && runnerAtThird.targetBase === "home" && ["advancing", "committed"].includes(runnerAtThird.movementProgress) && !force.forceAtHome && situation.outs < 2 && playerControlsBall && catcherAvailable),
    homeForceOut: Boolean(force.forceAtHome && playerControlsBall && catcherAvailable)
  };
  const window = getSecondBaseRouteWindow(routeId, situation.routeWindows);
  const legal = legalByRoute[routeId] === true;
  const viable = legal && window.state !== "expired";
  const unavailableReasons = {
    secureFirstBaseOut: "firstBaseRouteUnavailable",
    initiate463: "doublePlayForceUnavailable",
    coverSecondFor643: "coverPivotRoleUnavailable",
    attackLeadRunnerThird: "thirdBaseOutOpportunityUnavailable",
    preventRunHome: "runnerNotBreakingHome",
    homeForceOut: "homeForceUnavailable"
  };
  const expiredReasons = {
    secureFirstBaseOut: "firstBaseWindowExpired",
    initiate463: "doublePlayWindowExpired",
    coverSecondFor643: "doublePlayWindowExpired",
    attackLeadRunnerThird: "thirdBaseWindowExpired",
    preventRunHome: "homeTagWindowExpired",
    homeForceOut: "homeForceWindowExpired"
  };
  const unavailableReason = !legal ? unavailableReasons[routeId] || "routeTopologyUnavailable"
    : !viable ? expiredReasons[routeId] || "routeWindowExpired" : "";
  const reasons = [];
  if (!legal) reasons.push("目前跑者與封殺關係不支援這條處理路線。");
  else if (!viable) reasons.push("這條路線的出局窗口已經關閉。");
  else if (window.state === "narrow") reasons.push("這條路線仍合法，但出手窗口很窄。");
  else reasons.push("這條路線仍在可執行窗口內。");
  return Object.freeze({ legal, viable, windowState: window.state, unavailableReason, reasons: Object.freeze(reasons) });
}

function evaluateExecutionReadiness({ route, situation, teammates = situation?.teammates } = {}) {
  const availability = evaluateDefensiveRouteAvailability(situation, route);
  const capabilities = situation.playerCapabilities || {};
  const demand = situation.demands || { reach: 5, control: 5, release: 5 };
  const playerLeg = ((Number(capabilities.reaction) || 5) + (Number(capabilities.range) || 5) + (Number(capabilities.fielding) || 5) + (Number(capabilities.throwing) || 5)) / 4
    - (demand.reach + demand.control + demand.release) / 12;
  const teammateDependent = (route.teammateChain || []).length > 1;
  const pivot = teammates?.shortstop?.capabilities || teammates?.pivotFielder?.capabilities || {};
  const teammateLeg = teammateDependent ? ((Number(pivot.fielding) || 5) + (Number(pivot.throwing) || 5)) / 2 : 6;
  const windowAdjustment = { wide: 2, normal: 0.6, narrow: -2, expired: -6 }[availability.windowState] || -1;
  const speedPenalty = ["initiate463", "coverSecondFor643"].includes(route.id) && situation.batterSpeed >= 8 ? 1 : 0;
  const score = playerLeg + windowAdjustment - speedPenalty;
  const level = score >= 6.3 ? "high" : score < 3.2 || availability.windowState === "narrow" ? "low" : "medium";
  const reasons = [];
  if (availability.windowState === "wide") reasons.push("你的動作方向穩定，這條處理窗口充足。");
  else if (availability.windowState === "narrow") reasons.push("你需要快速轉身出手，封殺窗口偏窄。");
  else if (situation.ballDepth === "deep") reasons.push("你必須先完成較長移動，再調整身體方向出手。");
  else reasons.push("你的接球與出手條件落在一般可執行範圍。");
  if (teammateDependent && teammateLeg < 5) reasons.push("第二段仍依賴隊友接球與轉傳，並非你的能力不足。");
  return Object.freeze({ level, reasons: Object.freeze(reasons) });
}

function deriveInfieldFirstStepDemand(position, direction, depth, pace) {
  const directionDemand = { straightAtPlayer: 2, leftSide: 4, rightSide: 4, towardHole: 6, upTheMiddle: 5, lineSide: 5 }[direction] || 4;
  const depthDemand = depth === "deep" ? 2 : depth === "shallow" ? 1.5 : 0;
  const paceDemand = pace === "hard" ? 1.5 : pace === "slow" ? 1 : 0;
  const positionAdjustment = position === "三壘手" && pace === "hard" ? 1
    : position === "游擊手" && direction === "towardHole" ? 1
      : position === "二壘手" && direction === "upTheMiddle" ? 0.5 : 0;
  return Number(Math.min(10, directionDemand + depthDemand + paceDemand + positionAdjustment).toFixed(2));
}

function deriveInfieldExecutionWindows(situation) {
  const capability = situation.playerCapabilities;
  const pace = situation.ballContext.pace;
  const position = situation.playerPosition;
  const fieldingWindow = (capability.reaction * 0.4) + (capability.fielding * 0.35) + (capability.range * 0.25)
    - (situation.firstStepDemand * 0.45) + (pace === "slow" ? 0.7 : 0);
  const transferWindow = (capability.fielding * 0.25) + (capability.reaction * 0.2) + (capability.throwing * 0.2) + (capability.decision * 0.35)
    + (pace === "hard" ? 1.2 : pace === "slow" ? -1.7 : 0) + (situation.ballDepth === "deep" ? -0.8 : 0);
  const distanceModifier = { "一壘手": 1.1, "二壘手": 1.6, "游擊手": -0.4, "三壘手": -1.2 }[position] || 0;
  const throwWindow = (capability.arm * 0.48) + (capability.throwing * 0.42) + (capability.reaction * 0.1)
    + distanceModifier + (situation.ballDepth === "deep" ? -1.5 : situation.ballDepth === "shallow" ? -0.5 : 0)
    - (situation.batterSpeed * 0.28);
  return Object.freeze({
    fielding: Number(fieldingWindow.toFixed(2)),
    transfer: Number(transferWindow.toFixed(2)),
    throw: Number(throwWindow.toFixed(2))
  });
}

function getInfieldScenarioFamily(situation) {
  if (situation.forceState.forceAtHome || situation.forceState.third) return "leadRunnerPressure";
  if (situation.ballDepth === "deep") return "deepGroundBall";
  if (situation.ballContext.pace === "slow" || situation.ballDepth === "shallow") return "slowRoller";
  return "routineGroundBall";
}

function buildInfieldMeaningfulMoment(matchState, playerContext = player, overrides = {}) {
  if (!matchState || !isInfieldDecisionFamilyPosition(matchState.position)) return null;
  if (!Object.keys(overrides).length && matchState.defensiveSituation?.familyId === "infield") return matchState.defensiveSituation;
  const ballContext = Object.freeze({ ...getHighSchoolBallContext(matchState), ...(overrides.ballContext || {}) });
  const playerPosition = overrides.playerPosition || getHighSchoolInfieldAssignmentPosition(matchState, playerContext);
  const batter = getHighSchoolMatchSimulationEntity(matchState, matchState.currentBatter);
  const runnerSpeeds = (matchState.runners || []).map(runnerId => runnerId ? Number(getHighSchoolMatchSimulationEntity(matchState, runnerId)?.speed) || 5 : null);
  const capabilities = Object.freeze({ ...getDefensiveSimulationCapability(playerContext, "內野手"), ...(overrides.playerCapabilities || {}) });
  const situation = {
    id: `${matchState.id || "match"}:infield:${matchState.currentMomentId || matchState.momentIndex || 0}`,
    familyId: "infield",
    playerPosition,
    primaryFielderPosition: overrides.primaryFielderPosition || (playerPosition === "二壘手" && (overrides.ballDirection || deriveInfieldBallDirection(playerPosition, ballContext, matchState)) === "leftSide" ? "游擊手" : playerPosition),
    ballContext,
    ballDirection: overrides.ballDirection || deriveInfieldBallDirection(playerPosition, ballContext, matchState),
    ballDepth: overrides.ballDepth || deriveInfieldBallDepth(ballContext),
    ballDifficulty: overrides.ballDifficulty || (ballContext.pace === "hard" ? "demanding" : ballContext.pace === "slow" ? "charge" : "standard"),
    outs: Number(matchState.outs) || 0,
    runners: (matchState.runners || []).slice(0, 3),
    forceChain: overrides.forceChain ? JSON.parse(JSON.stringify(overrides.forceChain)) : null,
    forceState: Object.freeze({ ...(overrides.forceState || getHighSchoolDefensiveForceState(matchState)) }),
    batterId: matchState.currentBatter || "",
    batterSpeed: Number(overrides.batterSpeed ?? batter?.speed) || 5,
    runnerSpeeds: Object.freeze((overrides.runnerSpeeds || runnerSpeeds).slice(0, 3)),
    scoreContext: Object.freeze({ ...deriveInfieldScoreContext(matchState), ...(overrides.scoreContext || {}) }),
    playerCapabilities: capabilities,
    teammates: overrides.teammates || buildInfieldTeammateContext(matchState, playerPosition),
    generatedSimulationCursor: Number(matchState.simulationCursor) || 0,
    inning: Number(matchState.inning) || 1,
    half: matchState.half || "上",
    scores: Object.freeze({ home: Number(matchState.scores?.home) || 0, away: Number(matchState.scores?.away) || 0 }),
    upstreamThrowQuality: overrides.upstreamThrowQuality || "",
    coverageQuality: overrides.coverageQuality || "",
    executionChange: overrides.executionChange || "",
    routeWindowOverrides: Object.freeze({ ...(overrides.routeWindowOverrides || {}) }),
    buntDefensiveContext: overrides.buntDefensiveContext ? JSON.parse(JSON.stringify(overrides.buntDefensiveContext)) : null,
    groundBallDefensiveContext: overrides.groundBallDefensiveContext ? JSON.parse(JSON.stringify(overrides.groundBallDefensiveContext)) : null
  };
  situation.firstStepDemand = deriveInfieldFirstStepDemand(playerPosition, situation.ballDirection, situation.ballDepth, ballContext.pace);
  situation.windows = deriveInfieldExecutionWindows(situation);
  const inferredRunnerMovement = { ...(overrides.runnerMovementProgress || {}) };
  const inferredRunnerTargets = { ...(overrides.runnerTargets || {}) };
  if (situation.forceState.forceAtThird && situation.runners[1]) {
    inferredRunnerMovement[1] = inferredRunnerMovement[1] || "committed";
    inferredRunnerTargets[1] = "third";
  }
  if (situation.forceState.forceAtHome && situation.runners[2]) {
    inferredRunnerMovement[2] = inferredRunnerMovement[2] || "committed";
    inferredRunnerTargets[2] = "home";
  }
  // Sprint A tactical intent is non-physical while execution is deferred.
  // Actual runner movement must come from canonical force or execution state.
  situation.runnerContext = deriveDefensiveRunnerContext(situation.runners, situation.runnerSpeeds, {
    ...overrides,
    runnerMovementProgress: inferredRunnerMovement,
    runnerTargets: inferredRunnerTargets
  });
  situation.responsibility = resolveDefensivePlayResponsibility({ situation, primaryFielderPosition: situation.primaryFielderPosition });
  situation.demands = deriveInfieldDemandModel(situation);
  situation.routeWindows = deriveSecondBaseExecutionWindows(situation, overrides.routeWindowOverrides || {});
  if (playerPosition === "二壘手") {
    const homeRoute = situation.forceState.forceAtHome
      ? SECOND_BASE_ROUTE_DEFINITIONS.homeForceOut : SECOND_BASE_ROUTE_DEFINITIONS.preventRunHome;
    situation.homeRouteEvaluation = evaluateDefensiveRouteAvailability(situation, homeRoute);
  }
  situation.scenarioFamily = getInfieldScenarioFamily(situation);
  situation.legalChoices = generateInfieldLegalChoices(situation, matchState).map(choice => ({ ...choice }));
  matchState.positionDecisionFamily = "infield";
  matchState.currentFieldingPosition = playerPosition;
  matchState.defensiveSituation = JSON.parse(JSON.stringify(situation));
  const rosterPlayer = [...(matchState.rosters?.home?.lineup || []), ...(matchState.rosters?.home?.bench || [])].find(entity => entity.id === "player");
  if (rosterPlayer) rosterPlayer.position = playerPosition;
  return matchState.defensiveSituation;
}

function getInfieldChoiceAdvisability(situation, route) {
  if (route === "forceHome") return situation.scoreContext.runPriority === "critical" ? "strong" : "reasonable";
  if (route === "doublePlay") return situation.ballContext.pace === "slow" || situation.ballDepth === "deep" ? "aggressive" : "strong";
  if (route === "secureFirst" && situation.scoreContext.runPriority === "exchangeRunForOut") return "strong";
  if (route === "controlledNoThrow") return situation.windows.fielding < 2.5 || situation.windows.throw < 2 ? "reasonable" : "conservative";
  return "reasonable";
}

function getInfieldChoiceTradeoff(situation, route) {
  const hasRunner = situation.runners.some(Boolean);
  const controlledHoldHasBaseballValue = hasRunner
    && situation.ballDepth === "deep";
  const tradeoffs = {
    secureFirst: { objective: "secureOut", risk: "low", baseballValue: "convertBatterOut", executionOnly: false },
    doublePlay: { objective: "attemptDoublePlay", risk: "high", baseballValue: "createMultipleOuts", executionOnly: false },
    forceHome: { objective: "preventRun", risk: "medium", baseballValue: "stopForcedRun", executionOnly: false },
    tagHome: { objective: "preventRun", risk: "high", baseballValue: "challengeScoringRunner", executionOnly: false },
    forceThird: { objective: "attackLeadRunner", risk: "medium", baseballValue: "removeLeadRunner", executionOnly: false },
    forceSecond: { objective: "attackLeadRunner", risk: "medium", baseballValue: "removeForcedRunner", executionOnly: false },
    controlledNoThrow: controlledHoldHasBaseballValue
      ? { objective: "controlBall", risk: "low", baseballValue: "preserveRunnerState", executionOnly: false }
      : { objective: "controlBall", risk: "low", baseballValue: "executionOnly", executionOnly: true }
  };
  return Object.freeze({ ...(tradeoffs[route] || { objective: "controlBall", risk: "low", baseballValue: "executionOnly", executionOnly: true }) });
}

function getInfieldChoiceCommitment(situation, route) {
  const position = situation.playerPosition;
  if (position === "二壘手") {
    const routeId = { secureFirst: "secureFirstBaseOut", doublePlay: "initiate463", forceThird: "attackLeadRunnerThird", tagHome: "preventRunHome", forceHome: "homeForceOut" }[route];
    if (routeId) return SECOND_BASE_ROUTE_DEFINITIONS[routeId];
  }
  const routeByPosition = {
    doublePlay: { "一壘手": "3-6-3", "二壘手": "4-6-3", "游擊手": "6-4-3", "三壘手": "5-4-3" },
    forceThird: { "二壘手": "4-5", "游擊手": "6-5", "三壘手": "5U" }
  };
  const commitments = {
    secureFirst: position === "一壘手" && situation.ballDepth !== "deep"
      ? { action: "selfCoverFirst", route: "selfCoverFirst", targetBase: "first", requirements: ["fieldBall"] }
      : { action: "throwFirst", route: `${position || "infielder"}-3`, targetBase: "first", requirements: ["fieldBall"] },
    doublePlay: { action: "throwSecond", route: routeByPosition.doublePlay[position] || "infield-double-play", targetBase: "secondThenFirst", requirements: ["runnerOnFirst", "fewerThanTwoOuts", "forceAtSecond"] },
    forceHome: { action: "throwHome", route: `${position || "infielder"}-2`, targetBase: "home", requirements: ["forceAtHome"] },
    tagHome: { action: "throwHome", route: `${position || "infielder"}-2-tag`, targetBase: "home", requirements: ["runnerOnThird"] },
    forceThird: { action: position === "三壘手" ? "stepThird" : "throwThird", route: routeByPosition.forceThird[position] || "infield-to-third", targetBase: "third", requirements: ["forceAtThird"] },
    forceSecond: position === "一壘手"
      ? { action: "throwSecond", route: "3-6-3", targetBase: "secondThenFirst", requirements: ["runnerOnFirst", "forceAtSecond"] }
      : { action: "coverSecond", route: `${position || "infielder"}-second-cover`, targetBase: "second", requirements: ["forceAtSecond"] },
    controlledNoThrow: { action: "holdBall", route: "controlledHold", targetBase: "none", requirements: ["fieldBall"] }
  };
  return Object.freeze({ ...(commitments[route] || commitments.controlledNoThrow) });
}

function getPositionChoiceCommitmentKey(choice) {
  if (!choice) return "";
  const responsibilityChain = choice.responsibilityChain || choice.teammateChain || [];
  return [choice.action || "", choice.route || choice.infieldRoute || "", choice.targetBase || "", Array.isArray(responsibilityChain) ? responsibilityChain.join(">") : responsibilityChain, choice.riskProfile || choice.risk || ""].join("|");
}

function areChoicesBehaviorallyDistinct(firstChoice, secondChoice) {
  return Boolean(firstChoice && secondChoice && getPositionChoiceCommitmentKey(firstChoice) !== getPositionChoiceCommitmentKey(secondChoice));
}

function dedupePositionDecisionChoices(choices = []) {
  const seen = new Set();
  return choices.filter(choice => {
    const key = getPositionChoiceCommitmentKey(choice);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateInfieldLegalChoices(situation, matchState = null) {
  if (!situation?.playerPosition || !infieldPositions.includes(situation.playerPosition)) return [];
  const momentId = matchState ? getHighSchoolYearOneMomentId(matchState) : "";
  const position = situation.playerPosition;
  const make = (text, matchDecision, route) => {
    const commitment = getInfieldChoiceCommitment(situation, route);
    const definition = position === "二壘手" && commitment.id ? commitment : null;
    const availability = definition ? evaluateDefensiveRouteAvailability(situation, definition) : Object.freeze({ legal: true, viable: true, windowState: "normal", reasons: Object.freeze([]) });
    const physicalContext = situation.groundBallDefensiveContext || situation.buntDefensiveContext;
    const choice = {
      text: physicalContext && commitment.id === "secureFirstBaseOut" ? "先處理一壘的打者跑者"
        : situation.groundBallDefensiveContext && commitment.id === "initiate463" ? "先傳二壘封殺前位跑者"
          : situation.buntDefensiveContext && commitment.id === "initiate463" ? "傳二壘封殺前位跑者" : text,
      matchDecision,
      infieldRoute: route,
      advisable: getInfieldChoiceAdvisability(situation, route),
      ...getInfieldChoiceTradeoff(situation, route),
      ...commitment,
      routeId: commitment.id || "",
      responsibilityChain: Object.freeze(["player", ...(commitment.teammateChain || [])]),
      availability,
      legal: availability.legal,
      viable: availability.viable,
      riskProfile: position === "一壘手" && route === "forceSecond" ? "high" : getInfieldChoiceTradeoff(situation, route).risk,
      matchMomentId: momentId
    };
    if (physicalContext && commitment.id === "initiate463") {
      const lead = physicalContext.timingWindows?.leadRunnerForceWindow?.state;
      const first = physicalContext.timingWindows?.batterRunnerFirstBaseWindow?.state;
      if (["narrow", "expired"].includes(lead) && ["wide", "normal"].includes(first)) choice.advisable = "aggressive";
    }
    choice.readiness = definition ? evaluateExecutionReadiness({ route: definition, situation }) : null;
    if (definition) {
      const homeRoute = ["preventRunHome", "homeForceOut"].includes(commitment.id);
      choice.successChanceHint = homeRoute ? ({ wide: "高", normal: "中", narrow: "低" }[availability.windowState] || "") : "";
      choice.successChanceBasis = homeRoute ? "roughOpportunityWindowNotProbability" : "";
      choice.strategicTradeoff = {
        preventRunHome: "若未完成觸殺，其他跑者仍會推進。",
        homeForceOut: "優先阻止失分，但後方跑者仍會推進。",
        initiate463: "挑戰前位跑者與後續轉傳，三壘跑者可能得分。",
        secureFirstBaseOut: "優先換取打者出局，三壘跑者可能得分。"
      }[commitment.id] || "";
    }
    return choice;
  };
  const force = situation.forceState;
  if (position === "二壘手" && situation.responsibility?.playerRole === "coverPivot") {
    const route = SECOND_BASE_ROUTE_DEFINITIONS.coverSecondFor643;
    const availability = evaluateDefensiveRouteAvailability(situation, route);
    return availability.legal && availability.viable ? [{
      text: "補進二壘接游擊手第一傳，踩壘後轉傳一壘",
      matchDecision: "coverPivot",
      infieldRoute: route.infieldRoute,
      ...route,
      routeId: route.id,
      responsibilityChain: Object.freeze(["SS", "player", "1B"]),
      advisable: "strong",
      baseballValue: "executeCoverage",
      risk: "medium",
      riskProfile: "medium",
      availability,
      legal: availability.legal,
      viable: availability.viable,
      readiness: evaluateExecutionReadiness({ route, situation }),
      matchMomentId: momentId
    }] : [];
  }
  const choices = [];
  const secureText = position === "一壘手" && situation.ballDepth !== "deep" ? "控制來球後自己踩上一壘，先完成打者出局"
    : position === "二壘手" && situation.ballDepth !== "deep" ? "穩穩傳一壘，先拿打者。"
    : situation.ballDepth === "deep" ? "站穩後長傳一壘，挑戰打者跑壘時間" : situation.ballContext.pace === "slow" ? "前衝收球後直接傳一壘" : "傳一壘，先拿最穩定的出局數";
  choices.push(make(secureText, "secure", "secureFirst"));
  if (force.forceAtHome) {
    const homeText = position === "一壘手" ? "收球後傳本壘完成封殺，再由捕手控制後方跑者"
      : position === "三壘手" ? "向前收球後傳本壘，完成最短的得分封殺"
        : "接球後直接傳本壘完成封殺，阻止三壘跑者得分";
    choices.push(make(homeText, "home", "forceHome"));
  } else if (force.third && ["游擊手", "三壘手", "二壘手"].includes(position) && situation.ballDepth !== "deep"
    && (position !== "二壘手" || ["advancing", "committed"].includes(situation.runnerContext?.[2]?.movementProgress))) {
    choices.push(make("接球後傳本壘，挑戰正要得分的三壘跑者", "home", "tagHome"));
  }
  if (force.doublePlayEligible) {
    const dpReachable = situation.ballDirection !== "lineSide" || ["一壘手", "三壘手"].includes(position) || situation.ballDepth !== "deep";
    if (dpReachable) {
      const dpText = position === "游擊手" ? "轉傳二壘，再由二壘手轉一壘挑戰雙殺"
        : position === "二壘手" ? "傳二壘封殺跑者，嘗試完成雙殺。"
          : position === "三壘手" ? "傳二壘封殺前位跑者，再由二壘手轉一壘"
            : "傳游擊手封殺一壘跑者，再回傳一壘挑戰雙殺";
      choices.push(make(dpText, "challenge", "doublePlay"));
    }
  }
  if (force.forceAtThird && position === "三壘手") choices.push(make("踩三壘完成封殺，再觀察一壘傳球", "lead", "forceThird"));
  else if ((force.forceAtThird || (position === "二壘手" && situation.runnerContext?.[1]?.targetBase === "third" && ["advancing", "committed"].includes(situation.runnerContext[1].movementProgress))) && ["游擊手", "二壘手"].includes(position)) choices.push(make(position === "二壘手" ? "直接傳三壘，先封殺領先跑者。" : "傳三壘封殺正往前推進的二壘跑者", "lead", "forceThird"));
  else if (force.forceAtSecond && position === "一壘手") choices.push(make("傳二壘封殺起跑跑者，由游擊手接球", "lead", "forceSecond"));
  const hasRunner = situation.runners.some(Boolean);
  if (position !== "二壘手" || situation.ballDepth === "deep") {
    choices.push(make(situation.ballDepth === "deep"
      ? "控制住球，不勉強做失去準頭的長傳"
      : hasRunner ? "先控制球與最前方跑者，不勉強擴大失誤" : "先把球控制在手中，不勉強做失去準頭的傳球", "contain", "controlledNoThrow"));
  }
  return dedupePositionDecisionChoices(choices).filter(choice => choice.legal !== false && choice.viable !== false);
}

function evaluatePositionDecisionMoment(situation, legalChoices = []) {
  const choices = dedupePositionDecisionChoices(legalChoices.filter(choice => choice && choice.legal !== false && choice.viable !== false && choice.availability?.viable !== false));
  const meaningfulChoices = choices.filter(choice => !choice.executionOnly
    && choice.baseballValue && choice.baseballValue !== "executionOnly");
  const objectives = [...new Set(meaningfulChoices.map(choice => choice.objective).filter(Boolean))];
  const commitments = [...new Set(meaningfulChoices.map(getPositionChoiceCommitmentKey).filter(Boolean))];
  const tradeoffs = [...new Set(meaningfulChoices.map(choice => [choice.baseballValue || "", choice.riskProfile || choice.risk || "", choice.availability?.windowState || ""].join("|")).filter(Boolean))];
  const force = situation?.forceState || {};
  const criticalRun = situation?.scoreContext?.runPriority === "critical" && Boolean(force.third);
  const multipleOutOpportunity = Boolean(force.doublePlayEligible);
  const decision = choices.length >= 2 && meaningfulChoices.length >= 2 && commitments.length >= 2 && tradeoffs.length >= 2;
  const decisionTension = decision
    ? (criticalRun || (multipleOutOpportunity && meaningfulChoices.some(choice => choice.objective === "attemptDoublePlay")) ? "high" : "meaningful")
    : choices.length >= 2 ? "low" : "none";
  return Object.freeze({
    playerPosition: situation?.playerPosition || "",
    ballContext: situation?.ballContext?.type || "",
    outs: Number(situation?.outs) || 0,
    runners: Object.freeze((situation?.runners || []).slice(0, 3)),
    forceState: Object.freeze({ ...force }),
    scoreContext: Object.freeze({ ...(situation?.scoreContext || {}) }),
    inningPhase: situation?.scoreContext?.phase || "",
    legalChoiceCount: choices.length,
    meaningfulChoiceCount: meaningfulChoices.length,
    objectives: Object.freeze(objectives),
    commitments: Object.freeze(commitments),
    tradeoffs: Object.freeze(tradeoffs),
    decisionTension,
    shouldCreateDecision: decision
  });
}

function shouldCreatePlayerDecisionMoment(situation, legalChoices = []) {
  return evaluatePositionDecisionMoment(situation, legalChoices).shouldCreateDecision;
}

function classifyPositionFamilyPlay(situation, legalChoices = [], playerInvolved = true) {
  if (!playerInvolved) return Object.freeze({ eventClassification: "ordinaryPlay", decisionTension: "none" });
  const gate = evaluatePositionDecisionMoment(situation, legalChoices);
  return Object.freeze({
    eventClassification: gate.shouldCreateDecision ? "playerMeaningfulDecision" : "playerRoutinePlay",
    decisionTension: gate.decisionTension,
    gate
  });
}

function classifyHighSchoolMatchDefensiveOpportunity(match, situation, legalChoices = [], playerInvolved = true) {
  const classification = classifyPositionFamilyPlay(situation, legalChoices, playerInvolved);
  const density = evaluateHighSchoolMatchDefensiveDecisionDensity(match, situation, legalChoices, classification);
  if (classification.eventClassification !== "playerMeaningfulDecision" || density.allowed) {
    return Object.freeze({ ...classification, density });
  }
  return Object.freeze({
    eventClassification: "playerRoutinePlay",
    decisionTension: "low",
    gate: classification.gate,
    density
  });
}

function getInfieldDecisionChoice(situation, match, decision) {
  const choices = generateInfieldLegalChoices(situation, match);
  return choices.find(choice => choice.matchDecision === decision) || null;
}

function analyzeInfieldResolutionCauses(situation, choice, facts) {
  let primaryCause = "balancedExecution";
  let secondaryCause = "";
  let playerResponsibility = facts.error ? "major" : facts.outsCreated ? "handled" : "partial";
  let teammateResponsibility = facts.teammateFailed ? "major" : facts.teammateInvolved ? "shared" : "none";
  if (facts.teammateFailed) {
    primaryCause = "teammateIssue";
    playerResponsibility = "limited";
  } else if (!facts.fieldControlled) {
    primaryCause = situation.ballContext.pace === "slow" ? "slowGrounder" : situation.playerCapabilities.reaction < situation.playerCapabilities.fielding ? "poorReaction" : "fieldingIssue";
    secondaryCause = situation.ballContext.pace === "slow" && situation.batterSpeed >= 7 ? "fastBatter" : "";
  } else if (!facts.throwCompleted && situation.ballDepth === "deep" && situation.playerCapabilities.arm <= 5) {
    primaryCause = "weakArm";
    secondaryCause = "deepGrounder";
  } else if (!facts.throwCompleted && situation.batterSpeed >= 7) {
    primaryCause = "fastBatter";
    secondaryCause = situation.ballContext.pace === "slow" ? "slowGrounder" : "transferWindow";
  } else if (!facts.firstOutCompleted && Math.max(...situation.runnerSpeeds.filter(Number.isFinite), 0) >= 7) {
    primaryCause = "fastLeadRunner";
  } else if (!facts.throwCompleted && situation.playerCapabilities.throwing <= 5) {
    primaryCause = "throwingIssue";
  } else if (situation.ballDepth === "deep") {
    primaryCause = "deepGrounder";
  } else if (situation.ballContext.pace === "slow") {
    primaryCause = "slowGrounder";
    secondaryCause = situation.batterSpeed >= 7 ? "fastBatter" : "";
  } else if (choice.infieldRoute === "doublePlay" && facts.outsCreated === 1) {
    primaryCause = "transferWindow";
    secondaryCause = situation.batterSpeed >= 7 ? "fastBatter" : "";
  }
  return Object.freeze({ primaryCause, secondaryCause, playerResponsibility, teammateResponsibility });
}

function getInfieldCauseExplanation(cause, secondaryCause = "") {
  const lines = {
    balancedExecution: "你在球進入守區後完成接球、轉身與出手，整段動作都留在可用窗口內。",
    fastBatter: "打者腳程快，壓縮了最後一段傳球窗口。",
    fastLeadRunner: "前位跑者提前啟動，第一個封殺窗口比表面上更短。",
    slowGrounder: "你必須往前衝接慢滾球，接到球時可用的傳球時間已經縮短。",
    deepGrounder: "你在內野深處控制住球，接球與長傳是兩個分開的難題。",
    poorReaction: "第一步啟動稍慢，讓後續接球與出手都少了一段時間。",
    fieldingIssue: "接球時沒有一次把球控制好，重新握球吃掉了處理窗口。",
    weakArm: "球已經接到，但深處長傳的球速不足，打者先一步到壘。",
    throwingIssue: "接球已完成，傳球出手點卻沒有完全對準接球者。",
    teammateIssue: "你的傳球已送到可接位置，但接球隊友沒能完成後續控制。",
    transferWindow: "第一個封殺成立後，剩下的轉傳窗口不足以再抓到打者。"
  };
  const primary = lines[cause] || lines.balancedExecution;
  const secondary = lines[secondaryCause];
  return secondary && secondary !== primary ? `${primary} ${secondary}` : primary;
}

function applyDefensiveRunnerOutcome({ runnersBefore = [], batterId = "", route = "", resultCode = "" } = {}) {
  const seenBefore = new Set();
  const normalizedBefore = runnersBefore.slice(0, 3).map(runnerId => {
    if (!runnerId || seenBefore.has(runnerId)) return null;
    seenBefore.add(runnerId);
    return runnerId;
  });
  while (normalizedBefore.length < 3) normalizedBefore.push(null);
  const [first, second, third] = normalizedBefore;
  const batter = batterId || "away-batter-moment";
  const forceBatterSafe = () => {
    if (!first) return { runnersAfter: [batter, second, third], scoringRunnerIds: [] };
    if (!second) return { runnersAfter: [batter, first, third], scoringRunnerIds: [] };
    return { runnersAfter: [batter, first, second], scoringRunnerIds: third ? [third] : [] };
  };
  let outcome = { runnersAfter: normalizedBefore.slice(), scoringRunnerIds: [] };
  if (route === "doublePlay") {
    outcome = resultCode === "twoOuts"
      ? { runnersAfter: [null, second, third], scoringRunnerIds: [] }
      : resultCode === "oneOut"
        ? { runnersAfter: [batter, second, third], scoringRunnerIds: [] }
        : forceBatterSafe();
  } else if (route === "forceHome" && resultCode === "oneOut") {
    outcome = { runnersAfter: [batter, first, second], scoringRunnerIds: [] };
  } else if (route === "forceThird" && resultCode === "oneOut") {
    outcome = { runnersAfter: [batter, first, third], scoringRunnerIds: [] };
  } else if (route === "forceSecond" && resultCode === "oneOut") {
    outcome = { runnersAfter: [batter, second, third], scoringRunnerIds: [] };
  } else if (route === "tagHome") {
    const safe = forceBatterSafe();
    outcome = {
      runnersAfter: [safe.runnersAfter[0], safe.runnersAfter[1], null],
      scoringRunnerIds: resultCode === "oneOut" || !third ? [] : [third]
    };
  } else if (route === "secureFirst" && resultCode === "oneOut") {
    if (first) {
      outcome = second
        ? { runnersAfter: [null, first, second], scoringRunnerIds: third ? [third] : [] }
        : { runnersAfter: [null, first, third], scoringRunnerIds: [] };
    } else outcome = { runnersAfter: normalizedBefore.slice(), scoringRunnerIds: [] };
  } else if (route === "controlledNoThrow" || ["zeroOuts", "error"].includes(resultCode)) {
    outcome = forceBatterSafe();
  }
  const allowed = new Set([...normalizedBefore.filter(Boolean), batter]);
  const scoringRunnerIds = [];
  const scored = new Set();
  outcome.scoringRunnerIds.forEach(runnerId => {
    if (runnerId && allowed.has(runnerId) && !scored.has(runnerId)) {
      scored.add(runnerId);
      scoringRunnerIds.push(runnerId);
    }
  });
  const occupied = new Set();
  const runnersAfter = outcome.runnersAfter.slice(0, 3).map(runnerId => {
    if (!runnerId || !allowed.has(runnerId) || scored.has(runnerId) || occupied.has(runnerId)) return null;
    occupied.add(runnerId);
    return runnerId;
  });
  while (runnersAfter.length < 3) runnersAfter.push(null);
  const runnerChanges = normalizedBefore.map((runnerId, index) => {
    if (!runnerId) return null;
    const nextIndex = runnersAfter.indexOf(runnerId);
    return { runnerId, from: index + 1, to: nextIndex >= 0 ? nextIndex + 1 : scored.has(runnerId) ? "home" : "out" };
  }).filter(Boolean);
  const batterIndex = runnersAfter.indexOf(batter);
  runnerChanges.push({ runnerId: batter, from: "batter", to: batterIndex >= 0 ? batterIndex + 1 : "out" });
  return Object.freeze({
    runnersAfter: Object.freeze(runnersAfter),
    runnerChanges: Object.freeze(runnerChanges.map(change => Object.freeze(change))),
    scoringRunnerIds: Object.freeze(scoringRunnerIds),
    runsAllowed: scoringRunnerIds.length
  });
}

function buildInfieldRunnerFacts(situation, choice, resultCode) {
  const forceChain = situation.groundBallDefensiveContext?.forceChain || situation.buntDefensiveContext?.forceChain || situation.forceChain;
  if (forceChain && typeof ForceAdvancement !== "undefined" && ["doublePlay", "secureFirst"].includes(choice.infieldRoute)) {
    return ForceAdvancement.settleForceAdvancement({ forceChain, route: choice.infieldRoute, resultCode });
  }
  return applyDefensiveRunnerOutcome({
    runnersBefore: situation.runners,
    batterId: situation.batterId || "away-batter-moment",
    route: choice.infieldRoute,
    resultCode
  });
}

function reassessDefensiveRoutesAfterExecutionChange(situation, changes = {}) {
  const live = JSON.parse(JSON.stringify(situation));
  live.runners = (changes.runners || situation.runners || []).slice(0, 3);
  live.outs = Number(changes.outs ?? situation.outs) || 0;
  live.forceState = deriveDefensiveForceStateFromRunners(live.runners, live.outs);
  live.runnerContext = deriveDefensiveRunnerContext(live.runners, live.runnerSpeeds || [], {
    runnerTargets: changes.runnerTargets || {},
    runnerMovementProgress: changes.runnerMovementProgress || {},
    activeRunnerBase: changes.activeRunnerBase
  });
  live.routeWindows = deriveSecondBaseExecutionWindows(live, {
    ...(situation.routeWindowOverrides || {}),
    ...(changes.routeWindowOverrides || {})
  });
  const excluded = new Set(changes.expiredRouteIds || []);
  const routeDefinitions = Object.values(SECOND_BASE_ROUTE_DEFINITIONS).filter(route => {
    if (excluded.has(route.id)) return false;
    if (route.id === "coverSecondFor643") return live.responsibility?.playerRole === "coverPivot";
    if (route.id === "initiate463" && live.responsibility?.playerRole === "coverPivot") return false;
    return true;
  });
  const availableRoutes = routeDefinitions.map(route => ({
    ...route,
    availability: evaluateDefensiveRouteAvailability(live, route),
    readiness: evaluateExecutionReadiness({ route, situation: live })
  })).filter(route => route.availability.legal && route.availability.viable);
  const windowWeight = { wide: 4, normal: 3, narrow: 1, expired: -10 };
  const threatWeight = route => route.id === "homeForceOut" || route.id === "preventRunHome" ? (live.runners[2] ? 5 : 0)
    : route.id === "attackLeadRunnerThird" ? (live.runners[1] ? 4 : 0)
      : route.id === "secureFirstBaseOut" ? 3
        : route.id === "initiate463" ? 2 : 1;
  const fallbackRoute = availableRoutes.slice().sort((a, b) => {
    const aScore = threatWeight(a) + (windowWeight[a.availability.windowState] || 0);
    const bScore = threatWeight(b) + (windowWeight[b.availability.windowState] || 0);
    return bScore - aScore || a.id.localeCompare(b.id);
  })[0] || null;
  return Object.freeze({
    liveSituation: Object.freeze(live),
    forceState: Object.freeze({ ...live.forceState }),
    availableRoutes: Object.freeze(availableRoutes.map(route => Object.freeze(route))),
    fallbackRoute: fallbackRoute ? Object.freeze(fallbackRoute) : null,
    reason: changes.reason || "executionStateChanged"
  });
}

function getSecondBaseCauseExplanation(primaryCause, secondaryCause = "", fallbackRoute = null) {
  const lines = {
    playerFieldingControl: "你沒有在第一下把球控制乾淨，原本的處理窗口因重新握球而縮短。",
    playerFirstThrow: "你已完成接球，但第一傳沒有進入隊友能直接轉身處理的位置。",
    playerCoverage: "你到達二壘補位點時已經太晚，游擊手沒有把球傳向無人接應的壘包。",
    playerPivot: "你接到第一傳後需要重新調整腳步，轉傳窗口因此關閉。",
    playerSecondThrow: "你完成二壘封殺，但回傳一壘的出手沒有到達可接位置。",
    teammateUpstreamThrow: "游擊手的第一傳偏離理想接球點，迫使你先重新調整腳步。",
    teammatePivot: "你的第一傳已送到可接位置，但游擊手的轉身與第二傳慢了一拍。",
    teammateFirstBaseReceive: "前兩段傳球已完成，但一壘接球沒有穩定收下。",
    teammateHomeReceive: "傳球已送往本壘，但捕手沒有先把球控制住。",
    homeTagTiming: "捕手已接住傳球並形成觸殺機會，但跑者先一步碰到本壘。",
    timingWindow: "守備動作已進入處理窗口，但跑者先一步到達目標壘包。",
    balancedExecution: "每一段守備動作都留在有效窗口內。"
  };
  let text = lines[primaryCause] || lines.balancedExecution;
  if (secondaryCause && lines[secondaryCause] && lines[secondaryCause] !== text) text += ` ${lines[secondaryCause]}`;
  if (fallbackRoute) {
    const target = fallbackRoute.id === "homeForceOut" ? "改傳本壘完成封殺"
      : fallbackRoute.id === "secureFirstBaseOut" ? "改抓一壘的打者出局"
        : fallbackRoute.id === "attackLeadRunnerThird" ? "改抓三壘前位跑者" : "改走仍然開放的出局路線";
    text += ` 原路線失效後，守備依目前壘況${target}。`;
  }
  return text;
}

const DEFENSIVE_EXPLAINABILITY_VERSION = "defensive-outcome-explainability-v1";

function getDefensiveExplainabilityCauseCategory(sourceCause = "", resolution = {}) {
  const categories = {
    playerFieldingControl: "fieldingControl",
    playerFirstThrow: "throwAccuracy",
    playerCoverage: "releaseTiming",
    playerPivot: "transfer",
    playerSecondThrow: "throwAccuracy",
    teammateUpstreamThrow: "throwAccuracy",
    teammatePivot: "receiverExecution",
    teammateFirstBaseReceive: "receiverExecution",
    teammateHomeReceive: "receiverExecution",
    homeTagTiming: "runnerTiming",
    timingWindow: resolution.routeAvailability?.windowState === "expired" ? "windowExpired" : "runnerTiming",
    balancedExecution: (resolution.playerRole === "coverPivot" || Object.keys(resolution.teammateLeg || {}).length) ? "sharedExecution" : "fieldingControl"
  };
  return categories[sourceCause] || "unknown";
}

function getDefensiveExplainabilityActor(resolution = {}) {
  if (resolution.responsibleActor === "timingWindow") return "systemTiming";
  if (resolution.primaryCause === "balancedExecution" && Object.keys(resolution.teammateLeg || {}).length) return "shared";
  if (["player", "teammate", "runner", "systemTiming", "shared", "unknown"].includes(resolution.responsibleActor)) return resolution.responsibleActor;
  return "unknown";
}

function getDefensiveDecisionExplanation(choice = {}, resolution = {}) {
  const qualityLabels = {
    strong: "判斷穩健",
    reasonable: "判斷合理",
    aggressive: "判斷積極、風險較高",
    conservative: "判斷保守但合理",
    routine: "例行責任"
  };
  const routeId = resolution.initialRoute || choice.routeId || "";
  const routeText = {
    secureFirstBaseOut: "你選擇先抓一壘的確定出局。",
    initiate463: "你選擇啟動 4-6-3 雙殺，承擔第二段轉傳的時間風險。",
    coverSecondFor643: "這球由游擊手啟動，你進入二壘補位，負責接球、踩壘與轉傳。",
    attackLeadRunnerThird: "你選擇直接挑戰三壘領先跑者，承擔較窄的傳球窗口。",
    preventRunHome: "你選擇傳本壘挑戰得分跑者，這是一條需要捕手觸殺的高壓路線。",
    homeForceOut: "你選擇利用滿壘封殺關係傳本壘，優先阻止失分。"
  }[routeId] || "你依照當下壘況承擔這次守備責任。";
  const quality = resolution.decisionQuality || choice.advisable || "reasonable";
  return Object.freeze({ quality, label: qualityLabels[quality] || "判斷已有正式記錄", text: `${routeText}${qualityLabels[quality] ? ` ${qualityLabels[quality]}。` : ""}` });
}

function getDefensiveExecutionExplanation(resolution = {}) {
  const sourceCause = resolution.primaryCause || "";
  const byCause = {
    playerFieldingControl: "第一下控球不完整，重新握球壓縮了後續處理時間。",
    playerFirstThrow: "接球與轉傳動作已開始，但第一傳沒有進入接球者能直接處理的位置。",
    playerCoverage: "你未能在傳球窗口內到達二壘補位點。",
    playerPivot: "你接到第一傳後重新調整腳步，轉傳窗口因此關閉。",
    playerSecondThrow: "你完成二壘封殺，但回傳一壘沒有送到可接位置。",
    teammateUpstreamThrow: "你已進入補位位置，但游擊手第一傳偏離理想接球點。",
    teammatePivot: "你的第一傳已送到可接範圍，後續接球與轉傳沒有完整完成。",
    teammateFirstBaseReceive: "前兩段傳球已完成，但一壘端沒有穩定收下來球。",
    teammateHomeReceive: "球已送往本壘，但捕手沒有先把傳球控制住。",
    homeTagTiming: "捕手已接球並形成觸殺機會，但跑者先一步碰到本壘。",
    timingWindow: "接球、轉傳與接球端處理沒有明顯失誤，但跑者先一步抵達壘包。"
  };
  if (resolution.reassessed) {
    const fallback = resolution.fallbackRoute === "homeForceOut" ? "改傳本壘完成封殺"
      : resolution.fallbackRoute === "secureFirstBaseOut" ? "改抓一壘的確定出局"
        : resolution.fallbackRoute === "attackLeadRunnerThird" ? "改抓三壘領先跑者" : "改走仍有效的出局路線";
    return `原路線的窗口消失後，你重新讀取壘況並${fallback}。`;
  }
  if (byCause[sourceCause]) return byCause[sourceCause];
  if (resolution.resultCode === "twoOuts") return resolution.playerRole === "coverPivot"
    ? "你完成二壘補位、接球、踩壘與轉傳，隊友也完成一壘接球。"
    : "你完成接球與第一傳，隊友接續完成轉傳與一壘接球。";
  if (resolution.resultCode === "oneOut") return "接球與出手都在有效窗口內，接球端完成這個出局。";
  return "現有執行紀錄不足以把未完成的環節歸到單一動作。";
}

function getDefensiveCausePresentation(primaryCause, actor, resolution = {}) {
  const textByCause = {
    fieldingControl: "主要原因：第一下控球沒有完成。",
    transfer: "主要原因：接球後的轉傳調整耗掉了窗口。",
    throwAccuracy: actor === "teammate" ? "主要原因：隊友的傳球偏離理想接球點。" : "主要原因：傳球偏離接球點。",
    releaseTiming: "主要原因：到位或出手時間慢了一拍。",
    receiverExecution: "主要原因：接球端沒有完成後續處理。",
    runnerTiming: "主要原因：跑者先一步抵達，出局窗口不足。",
    windowExpired: "主要原因：原本的出局窗口已經關閉。",
    routeTradeoff: "主要原因：這條合法路線本來就承擔較高風險。",
    forceState: "主要原因：當下的封殺關係決定了出局方式。",
    sharedExecution: "主要原因：各段守備都在有效窗口內完成。",
    unknown: "這次出局沒有完成，現有紀錄不足以把原因歸到單一環節。"
  };
  if (resolution.reassessed && resolution.outsCreated > 0) return "主要原因：原路線窗口消失後的即時重判，保住了仍可完成的出局。";
  return textByCause[primaryCause] || textByCause.unknown;
}

function getDefensiveCoachFeedback(explanation = {}, resolution = {}) {
  const actor = explanation.responsibleActor;
  const cause = explanation.primaryCause;
  const quality = explanation.decisionQuality;
  if (actor === "teammate") return "你的責任環節已經做到位，這次是後續隊友執行沒有完成。";
  if (actor === "systemTiming" || actor === "runner") return "處理本身沒有明顯問題，這個出局窗口本來就很窄。";
  if (resolution.reassessed && resolution.outsCreated > 0) return "原路線消失後能立即改抓仍有效的出局，這次重判是合理處理。";
  if (quality === "aggressive" && resolution.outsCreated > 0) return "這球抓到了，但你選的是高風險處理；下次仍要先確認跑者與出局窗口。";
  if (quality === "aggressive") return "你挑戰的是較窄的出局窗口；下次仍要先確認跑者速度與壘包距離。";
  if (cause === "throwAccuracy") return "這個判斷沒有問題，問題在傳球位置；下次先把球送到接球點。";
  if (["fieldingControl", "transfer", "releaseTiming"].includes(cause)) return "路線判斷可以成立；下次把第一下控球與出手節奏處理乾淨。";
  if (cause === "unknown") return "先保留這次判斷；現有紀錄不足以把責任歸到單一環節。";
  return "你先選定出局目標再完成處理；下一球繼續先看跑者與壘包。";
}

function createDefensiveOutcomeExplanation(situation, choice, resolution) {
  if (!situation || !choice || !resolution || situation.playerPosition !== "二壘手" || !choice.routeId) return null;
  const presentation = presentInfieldDecision(situation, resolution, choice.matchDecision || "");
  const responsibleActor = getDefensiveExplainabilityActor(resolution);
  const primaryCause = getDefensiveExplainabilityCauseCategory(resolution.primaryCause, resolution);
  const secondaryCause = resolution.secondaryCause ? getDefensiveExplainabilityCauseCategory(resolution.secondaryCause, resolution) : null;
  const judgment = getDefensiveDecisionExplanation(choice, resolution);
  const executionSummary = getDefensiveExecutionExplanation(resolution);
  const causeText = getDefensiveCausePresentation(primaryCause, responsibleActor, resolution);
  const sourceEvidenceIds = [
    "choice.advisable", "choice.availability", "choice.readiness", "resolution.resultCode",
    "resolution.detailedResult", "resolution.primaryCause", "resolution.responsibleActor"
  ];
  if (Object.keys(resolution.playerLeg || {}).length) sourceEvidenceIds.push("resolution.playerLeg");
  if (Object.keys(resolution.teammateLeg || {}).length) sourceEvidenceIds.push("resolution.teammateLeg");
  if (Object.keys(resolution.timingResolution || {}).length) sourceEvidenceIds.push("resolution.timingResolution");
  if (resolution.reassessment) sourceEvidenceIds.push("resolution.reassessment");
  const explanation = {
    version: DEFENSIVE_EXPLAINABILITY_VERSION,
    routeId: resolution.initialRoute || choice.routeId,
    finalRouteId: resolution.activeRoute || resolution.routeId || choice.routeId,
    role: resolution.playerRole || choice.playerRole || situation.responsibility?.playerRole || "",
    decisionQuality: judgment.quality,
    readiness: choice.readiness ? JSON.parse(JSON.stringify(choice.readiness)) : null,
    judgment: judgment.text,
    executionSummary,
    outcome: formatDefensiveOutcomeAttribution(situation, resolution, presentation.outcome),
    primaryCause,
    secondaryCause: secondaryCause && secondaryCause !== primaryCause ? secondaryCause : null,
    responsibleActor,
    causeText,
    reassessmentSummary: resolution.reassessed ? executionSummary : "",
    sourcePrimaryCause: resolution.primaryCause || "",
    sourceSecondaryCause: resolution.secondaryCause || "",
    sourceEvidenceIds: Object.freeze(sourceEvidenceIds)
  };
  explanation.coachFeedback = getDefensiveCoachFeedback(explanation, resolution);
  return Object.freeze(explanation);
}

function attachDefensiveOutcomeExplanation(situation, choice, resolution) {
  if (!resolution) return null;
  const defensiveOutcomeExplanation = createDefensiveOutcomeExplanation(situation, choice, resolution);
  return Object.freeze({ ...resolution, defensiveOutcomeExplanation });
}

function resolveSecondBaseInitiatedRoute(situation, choice, sample) {
  const swing = (sample - 0.5) * 4;
  const windows = situation.windows;
  const physicalContext = situation.groundBallDefensiveContext || situation.buntDefensiveContext;
  const routeWindow = getSecondBaseRouteWindow(choice.routeId, situation.routeWindows);
  const fieldControlled = situation.executionChange === "bobble" ? true : windows.fielding + swing >= 2.8;
  const transferCompleted = fieldControlled && situation.executionChange !== "bobble" && windows.transfer + swing >= 3.8;
  const firstThrowCompleted = transferCompleted && windows.throw + swing >= 2.8;
  let reassessment = null;
  let actualChoice = choice;
  if (choice.routeId === "initiate463" && (situation.executionChange === "bobble" || routeWindow.state === "expired")) {
    reassessment = reassessDefensiveRoutesAfterExecutionChange(situation, {
      reason: situation.executionChange || "routeWindowExpired",
      expiredRouteIds: ["initiate463", "coverSecondFor643"],
      routeWindowOverrides: { ...(situation.routeWindowOverrides || {}), doublePlayWindow: "expired" }
    });
    if (reassessment.fallbackRoute) {
      actualChoice = {
        ...getInfieldChoiceTradeoff(situation, reassessment.fallbackRoute.infieldRoute),
        ...reassessment.fallbackRoute,
        routeId: reassessment.fallbackRoute.id,
        infieldRoute: reassessment.fallbackRoute.infieldRoute,
        advisable: "reasonable"
      };
    }
  }
  let resultCode = "zeroOuts";
  let detailedResult = "lateThrow";
  let playerStages = {
    reach: windows.fielding + swing >= 2.2 ? "completed" : "late",
    control: fieldControlled ? (situation.executionChange === "bobble" ? "recovered" : "completed") : "failed",
    transfer: transferCompleted ? "completed" : situation.executionChange === "bobble" ? "delayed" : "failed",
    firstThrow: firstThrowCompleted ? "completed" : "notCompleted"
  };
  let teammateStages = {};
  let homeTagLeg = null;
  let primaryCause = "balancedExecution";
  let secondaryCause = "";
  let responsibleActor = "player";
  if (reassessment?.fallbackRoute) {
    const fallbackWindow = getSecondBaseRouteWindow(actualChoice.routeId, reassessment.liveSituation.routeWindows);
    const fallbackCompleted = fieldControlled && fallbackWindow.state !== "expired";
    resultCode = fallbackCompleted ? "oneOut" : "zeroOuts";
    detailedResult = fallbackCompleted ? "fallbackOut" : "fallbackLate";
    playerStages = { ...playerStages, reassessment: "completed", fallbackRelease: fallbackCompleted ? "completed" : "late" };
    teammateStages = { receiver: fallbackCompleted ? "completed" : "notReached" };
    primaryCause = "playerFieldingControl";
    secondaryCause = fallbackCompleted ? "" : "timingWindow";
  } else if (!fieldControlled) {
    resultCode = windows.fielding + swing < 1 ? "error" : "zeroOuts";
    detailedResult = resultCode === "error" ? "fieldingError" : "lateFielding";
    primaryCause = "playerFieldingControl";
  } else if (choice.routeId === "initiate463") {
    const ss = situation.teammates?.shortstop?.capabilities || situation.teammates?.pivotFielder?.capabilities || {};
    const ssReceive = firstThrowCompleted && (Number(ss.fielding) || 5) + swing >= 3.2;
    const ssPivot = ssReceive && (Number(ss.reaction) || 5) + (Number(ss.throwing) || 5) * 0.35 + swing - situation.batterSpeed * 0.25 >= 4.2;
    const firstBaseReceive = ssPivot && (Number(situation.teammates?.firstBaseReceiver?.capabilities?.fielding) || 5) + swing >= 2.8;
    const firstOutCompleted = firstThrowCompleted && routeWindow.state !== "expired" && ssReceive;
    const continuationWindow = physicalContext?.timingWindows?.relayToFirstWindow?.state || routeWindow.state;
    const secondOutCompleted = firstOutCompleted && ssPivot && firstBaseReceive && !["narrow", "expired"].includes(continuationWindow);
    resultCode = secondOutCompleted ? "twoOuts" : firstOutCompleted ? "oneOut" : "zeroOuts";
    detailedResult = secondOutCompleted ? "completedDoublePlay" : firstOutCompleted ? "secondStageExpired" : "lateForce";
    teammateStages = { shortstopReceive: ssReceive ? "completed" : "failed", shortstopPivot: ssPivot ? "completed" : "late", shortstopSecondThrow: ssPivot ? "completed" : "notCompleted", firstBaseReceive: firstBaseReceive ? "completed" : "notCompleted" };
    if (!firstThrowCompleted) primaryCause = "playerFirstThrow";
    else if (!ssReceive) { primaryCause = "teammatePivot"; responsibleActor = "teammate"; }
    else if (!ssPivot && (situation.batterSpeed >= 8 || continuationWindow === "narrow")) { primaryCause = "timingWindow"; secondaryCause = "teammatePivot"; responsibleActor = "timingWindow"; }
    else if (!ssPivot) { primaryCause = "teammatePivot"; responsibleActor = "teammate"; }
    else if (!firstBaseReceive) { primaryCause = "teammateFirstBaseReceive"; responsibleActor = "teammate"; }
    else if (!secondOutCompleted) { primaryCause = "timingWindow"; responsibleActor = "timingWindow"; secondaryCause = situation.batterSpeed >= 8 ? "timingWindow" : ""; }
  } else if (actualChoice.routeId === "preventRunHome") {
    const catcher = situation.teammates?.catcher || {};
    const catcherCapabilities = catcher.capabilities || {};
    const runnerAtThird = situation.runnerContext?.[2] || {};
    const catcherReceive = firstThrowCompleted && catcher.receivingAvailable !== false
      && (Number(catcherCapabilities.fielding) || 5) + (Number(catcherCapabilities.reaction) || 5) * 0.25 + swing >= 3.2;
    const tagOpportunity = catcherReceive && routeWindow.state !== "expired";
    const tagScore = (Number(catcherCapabilities.reaction) || 5) * 0.55
      + (Number(catcherCapabilities.fielding) || 5) * 0.25 + swing
      - (Number(runnerAtThird.speed) || 5) * 0.35;
    const tagCompleted = tagOpportunity && tagScore >= 2.4;
    resultCode = tagCompleted ? "oneOut" : "zeroOuts";
    detailedResult = tagCompleted ? "tagOutHome" : catcherReceive ? "homeTagMiss" : "homeReceiveFailure";
    teammateStages = {
      catcherReceive: catcherReceive ? "completed" : "failed",
      catcherTag: tagCompleted ? "completed" : tagOpportunity ? "runnerBeatTag" : "notReached"
    };
    homeTagLeg = Object.freeze({
      routeType: "nonForceHomeTag",
      runnerId: runnerAtThird.runnerId || "",
      catcherId: catcher.id || "",
      possession: catcherReceive ? "secured" : "notSecured",
      tagRequired: true,
      tagOpportunity: tagOpportunity ? "formed" : "notFormed",
      arrivalComparison: tagCompleted ? "tagBeforeRunnerTouch" : tagOpportunity ? "runnerTouchBeforeTag" : "unresolved",
      result: tagCompleted ? "out" : "safe"
    });
    if (!firstThrowCompleted) primaryCause = fieldControlled ? "playerFirstThrow" : "playerFieldingControl";
    else if (!catcherReceive) { primaryCause = "teammateHomeReceive"; responsibleActor = "teammate"; }
    else if (!tagCompleted) { primaryCause = "timingWindow"; responsibleActor = "timingWindow"; }
  } else {
    const completed = firstThrowCompleted && routeWindow.state !== "expired";
    resultCode = completed ? "oneOut" : "zeroOuts";
    detailedResult = completed ? (actualChoice.routeId === "preventRunHome" ? "tagOutHome" : actualChoice.routeId === "homeForceOut" ? "forceOutHome" : actualChoice.routeId === "attackLeadRunnerThird" ? "leadRunnerOut" : "cleanOut") : "lateThrow";
    teammateStages = { receiver: completed ? "completed" : "notReached" };
    if (!firstThrowCompleted) primaryCause = fieldControlled ? "playerFirstThrow" : "playerFieldingControl";
    else if (!completed) { primaryCause = "timingWindow"; responsibleActor = "timingWindow"; }
  }
  const runnerFacts = buildInfieldRunnerFacts(situation, actualChoice, resultCode);
  const outsCreated = resultCode === "twoOuts" ? 2 : resultCode === "oneOut" ? 1 : 0;
  const executionQuality = resultCode === "twoOuts" ? "complete" : resultCode === "oneOut" && choice.routeId === "initiate463" ? "partial" : resultCode === "oneOut" ? "complete" : resultCode === "error" ? "misplay" : "late";
  return Object.freeze({
    familyId: "infield", route: actualChoice.infieldRoute, routeId: actualChoice.routeId, initialRoute: choice.routeId,
    activeRoute: actualChoice.routeId, fallbackRoute: reassessment?.fallbackRoute?.id || "", reassessed: Boolean(reassessment),
    playerRole: situation.responsibility?.playerRole || choice.playerRole, responsibility: situation.responsibility,
    resultCode, detailedResult, tier: outsCreated >= 2 ? "strong" : outsCreated === 1 ? "mixed" : resultCode === "error" ? "failure" : "failure",
    decisionQuality: choice.advisable === "aggressive" ? "aggressive" : choice.advisable === "strong" ? "strong" : "reasonable",
    executionQuality, outsCreated, runnerChanges: runnerFacts.runnerChanges, runnersAfter: runnerFacts.runnersAfter,
    scoringRunnerIds: runnerFacts.scoringRunnerIds, runsAllowed: runnerFacts.runsAllowed, error: resultCode === "error",
    primaryCause, secondaryCause, responsibleActor,
    playerResponsibility: responsibleActor === "player" ? (resultCode === "error" ? "major" : "handled") : "limited",
    teammateResponsibility: responsibleActor === "teammate" ? "major" : choice.teammateChain?.length ? "shared" : "none",
    causeExplanation: getSecondBaseCauseExplanation(primaryCause, secondaryCause, reassessment?.fallbackRoute),
    playerLeg: Object.freeze(playerStages), teammateLeg: Object.freeze(teammateStages), timingResolution: Object.freeze({
      routeWindow: routeWindow.state,
      homeOutWindow: actualChoice.routeId === "preventRunHome" ? routeWindow.state : null,
      leadRunnerForceWindow: physicalContext?.timingWindows?.leadRunnerForceWindow?.state || routeWindow.state,
      relayToFirstWindow: physicalContext?.timingWindows?.relayToFirstWindow?.state || routeWindow.state,
      batterSpeed: situation.batterSpeed
    }),
    firstLegState: choice.routeId === "initiate463" ? Object.freeze({ status: resultCode === "zeroOuts" ? "failed" : "completed", targetBase: "second" })
      : choice.routeId === "preventRunHome" ? Object.freeze({ status: resultCode === "oneOut" ? "completed" : "failed", targetBase: "home", playType: "tag" }) : null,
    continuationState: choice.routeId === "initiate463" ? Object.freeze({
      status: resultCode === "twoOuts" ? "completed" : resultCode === "oneOut" ? "windowClosed" : "notReached",
      window: physicalContext?.timingWindows?.relayToFirstWindow?.state || routeWindow.state,
      targetBase: "first"
    }) : choice.routeId === "preventRunHome" ? Object.freeze({ status: "settledByActorOutcomes", window: routeWindow.state, targetBase: "firstAndSecond" }) : null,
    homeTagLeg,
    executionStage: detailedResult, routeAvailability: choice.availability, readiness: choice.readiness,
    ballContext: situation.ballContext.type, ballDirection: situation.ballDirection, ballDepth: situation.ballDepth,
    batterSpeed: situation.batterSpeed, runnerSpeed: Math.max(...situation.runnerSpeeds.filter(Number.isFinite), 0),
    fielding: situation.playerCapabilities.fielding, reaction: situation.playerCapabilities.reaction, arm: situation.playerCapabilities.arm, throwing: situation.playerCapabilities.throwing,
    firstStage: Number((windows.fielding + swing).toFixed(2)), secondStage: Number((windows.throw + swing).toFixed(2)), returnTiming: 0,
    windows: Object.freeze({ ...windows }), routeWindows: situation.routeWindows,
    reassessment: reassessment ? Object.freeze({ reason: reassessment.reason, forceState: reassessment.forceState, availableRouteIds: Object.freeze(reassessment.availableRoutes.map(route => route.id)), fallbackRoute: reassessment.fallbackRoute?.id || "" }) : null
  });
}

function resolveSecondBaseCoverage643(situation, choice, sample) {
  const swing = (sample - 0.5) * 4;
  const ss = situation.teammates?.shortstop?.capabilities || {};
  const upstreamThrowQuality = situation.upstreamThrowQuality || (sample >= 0.72 ? "clean" : sample >= 0.45 ? "slightlyOffLine" : sample >= 0.22 ? "late" : "difficultReceive");
  const coverageScore = (Number(situation.playerCapabilities.reaction) || 5) * 0.45 + (Number(situation.playerCapabilities.range) || 5) * 0.35 + (Number(situation.playerCapabilities.decision) || 5) * 0.2 + swing - situation.firstStepDemand * 0.25;
  const coverageQuality = situation.coverageQuality || (coverageScore >= 3.8 ? "good" : coverageScore >= 2.2 ? "late" : "failed");
  const ssFielded = (Number(ss.fielding) || 5) + swing >= 2.5;
  let reassessment = null;
  if (!ssFielded || coverageQuality === "failed") {
    reassessment = reassessDefensiveRoutesAfterExecutionChange(situation, {
      reason: !ssFielded ? "upstreamFieldingChanged" : "coverageFailure",
      expiredRouteIds: ["coverSecondFor643", "initiate463"],
      routeWindowOverrides: { ...(situation.routeWindowOverrides || {}), doublePlayWindow: "expired" }
    });
    const fallback = reassessment.fallbackRoute;
    const completed = Boolean(ssFielded && fallback && getSecondBaseRouteWindow(fallback.id, reassessment.liveSituation.routeWindows).state !== "expired");
    const fallbackChoice = fallback ? { ...fallback, infieldRoute: fallback.infieldRoute } : { infieldRoute: "controlledNoThrow", id: "" };
    const resultCode = completed ? "oneOut" : "zeroOuts";
    const runnerFacts = buildInfieldRunnerFacts(situation, fallbackChoice, resultCode);
    const primaryCause = coverageQuality === "failed" ? "playerCoverage" : "teammateUpstreamThrow";
    return Object.freeze({
      familyId: "infield", route: fallbackChoice.infieldRoute, routeId: fallback?.id || "", initialRoute: choice.id, activeRoute: fallback?.id || "", fallbackRoute: fallback?.id || "", reassessed: true,
      playerRole: "coverPivot", responsibility: situation.responsibility, coverageQuality, upstreamThrowQuality,
      resultCode, detailedResult: completed ? "coverageFallbackOut" : "coverageFailure", tier: completed ? "mixed" : "failure", decisionQuality: "routine", executionQuality: completed ? "adjusted" : "failed",
      outsCreated: completed ? 1 : 0, runnerChanges: runnerFacts.runnerChanges, runnersAfter: runnerFacts.runnersAfter, scoringRunnerIds: runnerFacts.scoringRunnerIds, runsAllowed: runnerFacts.runsAllowed, error: false,
      primaryCause, secondaryCause: coverageQuality === "failed" ? "timingWindow" : "", responsibleActor: coverageQuality === "failed" ? "player" : "teammate",
      playerResponsibility: coverageQuality === "failed" ? "major" : "limited", teammateResponsibility: coverageQuality === "failed" ? "limited" : "major",
      causeExplanation: getSecondBaseCauseExplanation(primaryCause, coverageQuality === "failed" ? "timingWindow" : "", fallback),
      playerLeg: Object.freeze({ coverage: coverageQuality, receive: "notAttempted", pivot: "notAttempted", secondThrow: "notAttempted" }),
      teammateLeg: Object.freeze({ shortstopFielding: ssFielded ? "completed" : "failed", shortstopFirstThrow: coverageQuality === "failed" ? "heldForReassessment" : upstreamThrowQuality, firstBaseReceive: completed ? "completed" : "notReached" }),
      timingResolution: Object.freeze({ secondBaseForceWindow: "expired", batterSpeed: situation.batterSpeed }), executionStage: "reassessment", routeAvailability: choice.availability, readiness: choice.readiness,
      ballContext: situation.ballContext.type, ballDirection: situation.ballDirection, ballDepth: situation.ballDepth, batterSpeed: situation.batterSpeed, runnerSpeed: Number(situation.runnerSpeeds[0]) || 5,
      fielding: situation.playerCapabilities.fielding, reaction: situation.playerCapabilities.reaction, arm: situation.playerCapabilities.arm, throwing: situation.playerCapabilities.throwing,
      firstStage: Number(coverageScore.toFixed(2)), secondStage: 0, returnTiming: 0, windows: Object.freeze({ ...situation.windows }), routeWindows: situation.routeWindows,
      reassessment: Object.freeze({ reason: reassessment.reason, forceState: reassessment.forceState, availableRouteIds: Object.freeze(reassessment.availableRoutes.map(route => route.id)), fallbackRoute: fallback?.id || "" })
    });
  }
  const receivePenalty = { clean: 0, slightlyOffLine: 1, late: 1.6, difficultReceive: 2.5 }[upstreamThrowQuality] || 0;
  const receiveCompleted = (Number(situation.playerCapabilities.fielding) || 5) + swing - receivePenalty >= 2.8;
  const forceCompleted = receiveCompleted && coverageQuality !== "failed";
  const pivotCompleted = forceCompleted && (Number(situation.playerCapabilities.reaction) || 5) + (Number(situation.playerCapabilities.decision) || 5) * 0.35 + swing - receivePenalty >= 4;
  const secondThrowCompleted = pivotCompleted && (Number(situation.playerCapabilities.throwing) || 5) + (Number(situation.playerCapabilities.arm) || 5) * 0.3 + swing >= 4;
  const firstBaseReceive = secondThrowCompleted && (Number(situation.teammates?.firstBaseReceiver?.capabilities?.fielding) || 5) + swing >= 2.8;
  const secondOutCompleted = firstBaseReceive && getSecondBaseRouteWindow(choice.id, situation.routeWindows).state !== "narrow";
  const resultCode = secondOutCompleted ? "twoOuts" : forceCompleted ? "oneOut" : "zeroOuts";
  const runnerFacts = buildInfieldRunnerFacts(situation, choice, resultCode);
  let primaryCause = "balancedExecution";
  let responsibleActor = "player";
  if (!receiveCompleted && upstreamThrowQuality !== "clean") { primaryCause = "teammateUpstreamThrow"; responsibleActor = "teammate"; }
  else if (!pivotCompleted) primaryCause = "playerPivot";
  else if (!secondThrowCompleted) primaryCause = "playerSecondThrow";
  else if (!firstBaseReceive) { primaryCause = "teammateFirstBaseReceive"; responsibleActor = "teammate"; }
  else if (!secondOutCompleted) { primaryCause = "timingWindow"; responsibleActor = "timingWindow"; }
  return Object.freeze({
    familyId: "infield", route: "doublePlay", routeId: choice.id, initialRoute: choice.id, activeRoute: choice.id, fallbackRoute: "", reassessed: false,
    playerRole: "coverPivot", responsibility: situation.responsibility, coverageQuality, upstreamThrowQuality,
    resultCode, detailedResult: secondOutCompleted ? "completedDoublePlay" : forceCompleted ? "pivotPartial" : "receiveFailure", tier: secondOutCompleted ? "strong" : forceCompleted ? "mixed" : "failure",
    decisionQuality: "routine", executionQuality: secondOutCompleted ? "complete" : forceCompleted ? "partial" : "failed", outsCreated: resultCode === "twoOuts" ? 2 : resultCode === "oneOut" ? 1 : 0,
    runnerChanges: runnerFacts.runnerChanges, runnersAfter: runnerFacts.runnersAfter, scoringRunnerIds: runnerFacts.scoringRunnerIds, runsAllowed: runnerFacts.runsAllowed, error: false,
    primaryCause, secondaryCause: upstreamThrowQuality !== "clean" && primaryCause !== "teammateUpstreamThrow" ? "teammateUpstreamThrow" : "", responsibleActor,
    playerResponsibility: responsibleActor === "player" ? "handled" : "limited", teammateResponsibility: responsibleActor === "teammate" ? "major" : "shared",
    causeExplanation: getSecondBaseCauseExplanation(primaryCause, upstreamThrowQuality !== "clean" && primaryCause !== "teammateUpstreamThrow" ? "teammateUpstreamThrow" : ""),
    playerLeg: Object.freeze({ coverage: coverageQuality, receive: receiveCompleted ? "completed" : "failed", force: forceCompleted ? "completed" : "notCompleted", pivot: pivotCompleted ? "completed" : "late", secondThrow: secondThrowCompleted ? "completed" : "notCompleted" }),
    teammateLeg: Object.freeze({ shortstopFielding: "completed", shortstopFirstThrow: upstreamThrowQuality, firstBaseReceive: firstBaseReceive ? "completed" : "notCompleted" }),
    timingResolution: Object.freeze({ secondBaseForceWindow: getSecondBaseRouteWindow(choice.id, situation.routeWindows).state, batterSpeed: situation.batterSpeed }), executionStage: secondOutCompleted ? "complete" : "partial", routeAvailability: choice.availability, readiness: choice.readiness,
    ballContext: situation.ballContext.type, ballDirection: situation.ballDirection, ballDepth: situation.ballDepth, batterSpeed: situation.batterSpeed, runnerSpeed: Number(situation.runnerSpeeds[0]) || 5,
    fielding: situation.playerCapabilities.fielding, reaction: situation.playerCapabilities.reaction, arm: situation.playerCapabilities.arm, throwing: situation.playerCapabilities.throwing,
    firstStage: Number(coverageScore.toFixed(2)), secondStage: Number(((Number(situation.playerCapabilities.throwing) || 5) + swing).toFixed(2)), returnTiming: 0,
    windows: Object.freeze({ ...situation.windows }), routeWindows: situation.routeWindows, reassessment: null
  });
}

function resolveInfieldDecision(situation, decision, matchState, randomSource = Math.random) {
  const choice = getInfieldDecisionChoice(situation, matchState, decision);
  if (!choice) return null;
  const rawSample = typeof randomSource === "function" ? Number(randomSource()) : Number(randomSource);
  const sample = Number.isFinite(rawSample) ? Math.max(0, Math.min(0.999999, rawSample)) : 0.5;
  if (situation.playerPosition === "二壘手" && choice.routeId === "coverSecondFor643") return attachDefensiveOutcomeExplanation(situation, choice, resolveSecondBaseCoverage643(situation, choice, sample));
  if (situation.playerPosition === "二壘手" && choice.routeId) return attachDefensiveOutcomeExplanation(situation, choice, resolveSecondBaseInitiatedRoute(situation, choice, sample));
  const swing = (sample - 0.5) * 4;
  const windows = situation.windows;
  const fieldControlled = windows.fielding + swing >= 2.8;
  const transferCompleted = fieldControlled && windows.transfer + swing >= 3.8;
  const throwCompleted = transferCompleted && windows.throw + swing >= 2.8;
  const relevantRunnerIndex = ["forceHome", "tagHome"].includes(choice.infieldRoute) ? 2
    : choice.infieldRoute === "forceThird" ? 1 : 0;
  const leadSpeed = Number(situation.runnerSpeeds[relevantRunnerIndex]) || Math.max(...situation.runnerSpeeds.filter(Number.isFinite), 5);
  const firstOutThreshold = choice.infieldRoute === "doublePlay" ? 2.5 : 2.7;
  const firstOutCompleted = fieldControlled && (windows.transfer + swing - leadSpeed * 0.35 >= firstOutThreshold);
  const pivot = situation.teammates?.pivotFielder?.capabilities || { fielding: 5, throwing: 5, reaction: 5 };
  const pivotWindow = (Number(pivot.fielding) || 5) * 0.35 + (Number(pivot.throwing) || 5) * 0.4 + (Number(pivot.reaction) || 5) * 0.25;
  const teammateInvolved = choice.infieldRoute === "doublePlay";
  const playerFeedCompleted = firstOutCompleted && transferCompleted;
  const teammateTurnCompleted = playerFeedCompleted && pivotWindow + swing >= 3.7;
  const firstBaseRecoveryWindow = situation.playerPosition === "一壘手"
    ? situation.playerCapabilities.reaction * 0.35 + situation.playerCapabilities.fielding * 0.35 + situation.playerCapabilities.range * 0.3
      - (situation.ballDepth === "deep" ? 1.5 : situation.ballDepth === "shallow" ? 0.8 : 0.35)
    : 10;
  const returnReceptionCompleted = situation.playerPosition !== "一壘手" || firstBaseRecoveryWindow + swing - situation.batterSpeed * 0.18 >= 3.2;
  const secondOutWindow = situation.playerPosition === "一壘手" ? firstBaseRecoveryWindow : windows.throw;
  const secondOutCompleted = teammateTurnCompleted && returnReceptionCompleted
    && secondOutWindow + pivotWindow * 0.35 + swing - situation.batterSpeed * 0.3 >= 3.6;
  let resultCode = "zeroOuts";
  let detailedResult = "lateThrow";
  if (choice.infieldRoute === "controlledNoThrow") {
    detailedResult = "controlledNoThrow";
  } else if (!fieldControlled) {
    resultCode = windows.fielding + swing < 1 ? "error" : "zeroOuts";
    detailedResult = resultCode === "error" ? "fieldingError" : "lateFielding";
  } else if (choice.infieldRoute === "doublePlay") {
    if (secondOutCompleted) {
      resultCode = "twoOuts";
      detailedResult = "completedDoublePlay";
    } else if (firstOutCompleted) {
      resultCode = "oneOut";
      detailedResult = teammateTurnCompleted ? "closeSafe" : playerFeedCompleted ? "teammateMiss" : "lateTransfer";
    } else {
      detailedResult = "lateForce";
    }
  } else if (firstOutCompleted && throwCompleted) {
    resultCode = "oneOut";
    detailedResult = situation.ballDepth === "deep" ? "cleanLongThrowOut" : "cleanOut";
  } else if (fieldControlled && situation.ballDepth === "deep") {
    detailedResult = situation.playerCapabilities.throwing <= 4 ? "inaccurateThrow" : windows.throw + swing >= 1.8 ? "closeSafe" : "lateThrow";
    if (detailedResult === "inaccurateThrow" && windows.throw + swing < 0.8) resultCode = "error";
  }
  const facts = {
    fieldControlled, transferCompleted, throwCompleted, firstOutCompleted,
    teammateInvolved, teammateFailed: teammateInvolved && playerFeedCompleted && !teammateTurnCompleted,
    returnReceptionCompleted,
    outsCreated: resultCode === "twoOuts" ? 2 : resultCode === "oneOut" ? 1 : 0,
    error: resultCode === "error"
  };
  const causes = analyzeInfieldResolutionCauses(situation, choice, facts);
  const runnerFacts = buildInfieldRunnerFacts(situation, choice, resultCode);
  const decisionQuality = choice.advisable === "strong" ? "strong" : choice.advisable === "aggressive" ? "aggressive" : choice.advisable === "conservative" ? "conservative" : "reasonable";
  const executionQuality = resultCode === "twoOuts" ? "complete" : resultCode === "oneOut" && choice.infieldRoute === "doublePlay" ? "partial" : resultCode === "oneOut" ? "complete" : resultCode === "error" ? "misplay" : choice.infieldRoute === "controlledNoThrow" ? "controlled" : "late";
  const tier = facts.outsCreated >= 2 ? "strong"
    : facts.outsCreated === 1 && choice.infieldRoute !== "doublePlay" && windows.fielding + swing >= 7 ? "strong"
      : facts.outsCreated === 1 ? "mixed"
        : facts.error ? "failure" : choice.infieldRoute === "controlledNoThrow" ? "mixed" : "failure";
  return Object.freeze({
    familyId: "infield", route: choice.infieldRoute, resultCode, detailedResult, tier, decisionQuality, executionQuality,
    outsCreated: facts.outsCreated, runnerChanges: runnerFacts.runnerChanges, runnersAfter: runnerFacts.runnersAfter,
    scoringRunnerIds: runnerFacts.scoringRunnerIds, runsAllowed: runnerFacts.runsAllowed, error: facts.error,
    primaryCause: causes.primaryCause, secondaryCause: causes.secondaryCause,
    responsibleActor: causes.primaryCause === "teammateIssue" ? "teammate"
      : ["fastBatter", "fastLeadRunner"].includes(causes.primaryCause) ? "runner"
        : ["slowGrounder", "deepGrounder"].includes(causes.primaryCause) ? "ballContext"
          : causes.primaryCause === "transferWindow" ? "timingWindow" : "player",
    playerResponsibility: causes.playerResponsibility, teammateResponsibility: causes.teammateResponsibility,
    causeExplanation: getInfieldCauseExplanation(causes.primaryCause, causes.secondaryCause),
    ballContext: situation.ballContext.type, ballDirection: situation.ballDirection, ballDepth: situation.ballDepth,
    batterSpeed: situation.batterSpeed, runnerSpeed: leadSpeed,
    fielding: situation.playerCapabilities.fielding, reaction: situation.playerCapabilities.reaction,
    arm: situation.playerCapabilities.arm, throwing: situation.playerCapabilities.throwing,
    firstStage: Number((windows.fielding + swing).toFixed(2)), secondStage: Number((windows.throw + swing).toFixed(2)),
    returnTiming: Number((firstBaseRecoveryWindow + swing - situation.batterSpeed * 0.18).toFixed(2)),
    windows: Object.freeze({ ...windows })
  });
}

function adaptInfieldInformation(situation, playerContext = player) {
  const directionLabels = { straightAtPlayer: "正面進入你的守區", leftSide: "往你的左側移動", rightSide: "往你的右側移動", towardHole: "穿向三遊深處", upTheMiddle: "穿向二壘後方", lineSide: "沿邊線方向滾動" };
  const depthLabels = { shallow: "落點很淺，需要往前衝", normal: "落點在一般守備深度", deep: "落點很深，接球後仍要長傳" };
  const clarity = (Number(playerContext?.baseballSkills?.baseballIQ) || 0) + (Number(playerContext?.observe) || 0) >= 12;
  const importantRunner = situation.runnerSpeeds.map((speed, index) => Number.isFinite(speed) ? { base: index + 1, speed } : null).filter(Boolean).sort((a, b) => b.base - a.base)[0];
  const groundBall = situation.groundBallDefensiveContext;
  if (groundBall) {
    const leadState = groundBall.timingWindows?.leadRunnerForceWindow?.state;
    const firstState = groundBall.timingWindows?.batterRunnerFirstBaseWindow?.state;
    const windowText = state => ({ wide: "窗口充足", normal: "仍有合理窗口", narrow: "窗口很緊", expired: "窗口已關閉" }[state] || "仍需判斷");
    const existingRunner = groundBall.runnerRealization?.existingRunners?.find(state => state.originBase === 1);
    const homeRunner = groundBall.runnerRealization?.existingRunners?.find(state => state.originBase === 3
      && state.targetBase === "home" && ["advancing", "committed"].includes(state.movementState));
    const homeState = groundBall.timingWindows?.homeOutWindow?.state;
    return Object.freeze({
      position: situation.playerPosition,
      direction: groundBall.physicalTruth?.direction === "rightSide" ? "往二壘手一側滾動" : directionLabels[situation.ballDirection] || "進入內野",
      depth: groundBall.ballContext?.detail || "球進入二壘手的處理範圍",
      pace: groundBall.ballContext?.label || "內野滾地球",
      batterSpeed: formatHighSchoolMatchSpeed(situation.batterSpeed),
      runnerCue: `${homeRunner ? "三壘跑者已啟動攻本壘；" : ""}${existingRunner?.movementState === "advancing" ? "一壘跑者受迫往二壘，打者跑者正衝向一壘" : "打者跑者正往一壘推進"}`,
      readCue: `這是一般擊球形成的滾地守備：二壘封殺${windowText(leadState)}，打者的一壘出局${windowText(firstState)}${homeRunner ? `，本壘觸殺${windowText(homeState)}` : ""}。`
    });
  }
  const bunt = situation.buntDefensiveContext;
  if (bunt) {
    const leadState = bunt.timingWindows?.leadRunnerForceWindow?.state;
    const firstState = bunt.timingWindows?.batterRunnerFirstBaseWindow?.state;
    const windowText = state => ({ wide: "窗口充足", normal: "仍有合理窗口", narrow: "窗口很緊", expired: "窗口已關閉" }[state] || "仍需判斷");
    const existingRunner = bunt.runnerReassessment?.existingRunners?.find(state => state.originBase === 1);
    return Object.freeze({
      position: situation.playerPosition,
      direction: bunt.ballContext?.physicalTruth?.placement === "secondBaseSide" ? "往二壘手一側滾動" : directionLabels[situation.ballDirection] || "進入內野",
      depth: "短打落點很淺，需要往前處理",
      pace: bunt.ballContext?.label || "短打",
      batterSpeed: formatHighSchoolMatchSpeed(situation.batterSpeed),
      runnerCue: existingRunner?.movementState === "advancing" ? "一壘跑者已啟動往二壘，打者跑者也正衝向一壘" : "壘上跑者仍在讀球，打者跑者正往一壘",
      readCue: `這是短打形成的守備：二壘封殺${windowText(leadState)}，打者的一壘出局${windowText(firstState)}。`
    });
  }
  return Object.freeze({
    position: situation.playerPosition,
    direction: directionLabels[situation.ballDirection] || "進入你的守區",
    depth: depthLabels[situation.ballDepth] || depthLabels.normal,
    pace: situation.ballContext.label,
    batterSpeed: formatHighSchoolMatchSpeed(situation.batterSpeed),
    runnerCue: importantRunner ? `${["一", "二", "三"][importantRunner.base - 1]}壘跑者腳程${formatHighSchoolMatchSpeed(importantRunner.speed)}` : "",
    readCue: clarity && importantRunner ? `${["一", "二", "三"][importantRunner.base - 1]}壘跑者已提早啟動，會主動壓縮你的封殺窗口。` : importantRunner ? "壘上跑者正準備隨擊球啟動。" : "先完成接球，再讀打者跑壘。"
  });
}

function formatDefensiveRunnerChange(change, match = null) {
  if (!change || change.from === "batter") {
    return change?.to === 1 ? "打者趁機安全上一壘" : change?.to === "out" ? "打者出局" : "";
  }
  const from = ["", "一壘", "二壘", "三壘"][Number(change.from)] || "原壘包";
  const runnerName = match ? getHighSchoolMatchSimulationEntityName(match, change.runnerId) : "";
  const subject = runnerName && !["對方打者", "下一棒"].includes(runnerName) ? runnerName : `${from}跑者`;
  if (change.to === "home") return `${subject}回本壘得分`;
  if (change.to === "out") return `${subject}在推進途中出局`;
  const to = ["", "一壘", "二壘", "三壘"][Number(change.to)] || "下一個壘包";
  return Number(change.to) === Number(change.from) ? "" : `${subject}從${from}推進到${to}`;
}

function formatDefensiveOutcomeAttribution(situation, resolution = {}, fallback = "") {
  const routeId = resolution.activeRoute || resolution.routeId || resolution.route || "";
  const outsCreated = Math.max(0, Number(resolution.outsCreated) || 0);
  const successfulRoutes = {
    secureFirstBaseOut: "你把球傳向一壘，球趕在打者跑者之前到達，一壘完成打者出局。",
    secureFirst: "你把球傳向一壘，球趕在打者跑者之前到達，一壘完成打者出局。",
    initiate463: outsCreated >= 2
      ? "你先傳二壘封殺原一壘跑者，隊友再轉傳一壘讓打者出局，完成雙殺。"
      : "你把球傳向二壘，原一壘跑者在二壘被封殺；打者安全上一壘。",
    doublePlay: outsCreated >= 2
      ? "你先傳二壘封殺原一壘跑者，隊友再轉傳一壘讓打者出局，完成雙殺。"
      : "你把球傳向二壘，原一壘跑者在二壘被封殺；打者安全上一壘。",
    coverSecondFor643: outsCreated >= 2
      ? "你補進二壘接球踩壘，先封殺原一壘跑者，再轉傳一壘讓打者出局。"
      : "你補進二壘接球踩壘，原一壘跑者在二壘被封殺；打者安全上一壘。",
    attackLeadRunnerThird: "你把球傳向三壘，三壘手踩壘封殺原二壘跑者。",
    forceThird: "你把球傳向三壘，三壘手踩壘封殺原二壘跑者。",
    preventRunHome: "你把球傳向本壘，捕手接球後觸殺原三壘跑者。",
    tagHome: "你把球傳向本壘，捕手接球後觸殺原三壘跑者。",
    homeForceOut: "你把球傳向本壘，捕手踩住本壘封殺原三壘跑者。",
    forceHome: "你把球傳向本壘，捕手踩住本壘封殺原三壘跑者。",
    forceSecond: "你把球傳向二壘，原一壘跑者在二壘被封殺。"
  };
  const opening = outsCreated > 0 ? successfulRoutes[routeId] || fallback : fallback;
  const movements = (resolution.runnerChanges || [])
    .filter(change => change?.to !== "out")
    .map(change => formatDefensiveRunnerChange(change))
    .filter(Boolean);
  const runnersAfter = Array.isArray(resolution.runnersAfter) ? resolution.runnersAfter : situation?.runners || [];
  const outsAfter = Math.min(3, Math.max(0, (Number(situation?.outs) || 0) + outsCreated));
  const movementText = movements.length ? ` ${movements.join("；")}。` : "";
  const stateText = outsAfter >= 3 ? " 現在三個出局，半局結束。" : ` 現在 ${outsAfter} 出局、${formatHighSchoolMatchRunners(runnersAfter)}。`;
  return `${opening || "這次守備已經完成。"}${movementText}${stateText}`;
}

function formatHighSchoolMatchWorldState(match, prefix = "") {
  if (!match) return prefix.trim();
  const lead = prefix ? `${prefix} ` : "";
  return Number(match.outs) >= 3
    ? `${lead}第三個出局完成，半局結束。`
    : `${lead}現在 ${Number(match.outs) || 0} 出局、${formatHighSchoolMatchRunners(match.runners || [])}。`;
}

function formatInfieldDefensiveErrorOutcome(situation, resolution) {
  const movements = (resolution?.runnerChanges || []).map(change => formatDefensiveRunnerChange(change)).filter(Boolean);
  const hasExistingRunner = (situation?.runners || []).some(Boolean);
  const opening = hasExistingRunner ? "球沒有控制住" : "球從手套邊緣彈開";
  return `${opening}${movements.length ? `，${movements.join("，")}` : ""}。`;
}

function presentInfieldDecision(situation, resolution = null, decision = "") {
  const information = adaptInfieldInformation(situation);
  const choice = decision ? getInfieldDecisionChoice(situation, null, decision) : null;
  const executions = {
    secureFirst: situation.playerPosition === "一壘手" && situation.ballDepth !== "deep" ? "你控制住來球，自己踩上一壘完成打者出局。" : situation.ballDepth === "deep" ? "你在深處收球，站穩後把長傳送往一壘。" : situation.ballDepth === "shallow" ? "你向前衝進球路，收球後直接朝一壘出手。" : "你正面控制住球，把傳球送往一壘。",
    doublePlay: situation.playerPosition === "一壘手" ? "你把球送往二壘封殺跑者，隨即回到一壘接游擊手的回傳球。"
      : situation.playerPosition === "二壘手" && situation.responsibility?.playerRole === "coverPivot" ? "游擊手處理來球；你補進二壘接第一傳，踩壘後轉傳一壘。"
        : situation.playerPosition === "二壘手" ? "你乾淨收球後把球送給補位游擊手，由他踩二壘再轉傳一壘。" : "你收球轉身，把第一個傳球送向二壘，再由隊友轉傳一壘。",
    forceHome: "你收球後把傳球直接送向本壘，處理最前位跑者。",
    tagHome: "你收球後朝本壘出手，挑戰正要得分的跑者。",
    forceThird: "你把球送向三壘，處理最前位的封殺路徑。",
    forceSecond: "你把第一個出局目標放在二壘，處理被迫推進的跑者。",
    controlledNoThrow: "你先把球完整控制在手中，不勉強做失去準頭的傳球。"
  };
  const outcomes = resolution ? resolution.error ? formatInfieldDefensiveErrorOutcome(situation, resolution) : {
    completedDoublePlay: "二壘封殺成立，隊友轉傳一壘也趕在打者之前，完成雙殺。",
    teammateMiss: "二壘封殺成功，你的傳球已到接球範圍，但隊友沒能控制住後續轉傳，只拿到一個出局。",
    closeSafe: resolution.outsCreated ? "二壘封殺成功，但轉傳一壘時打者已早一步踩壘，只拿到一個出局。" : "球傳到壘包前，打者已先一步踩壘，場上沒有新增出局。",
    cleanLongThrowOut: "你在深處完成接球，長傳仍趕在打者之前抵達一壘。",
    inaccurateThrow: "你已在深處接到球，但長傳偏離接球者，打者安全上壘。",
    lateThrow: resolution.routeId === "attackLeadRunnerThird"
      ? "你把球傳向三壘，但球到壘包前，領先跑者已經安全。"
      : ["preventRunHome", "homeForceOut"].includes(resolution.routeId)
        ? "你把球傳向本壘，但球到達前，三壘跑者已經得分。"
        : situation.ballDepth === "deep"
          ? "你接到球後再完成長傳，球到一壘時打者已經安全。"
          : "你把球傳向一壘，但球到壘包前，打者已經安全。",
    controlledNoThrow: "你保住球權，沒有為了勉強傳球擴大成失誤；打者安全上一壘。",
    cleanOut: "傳球在跑者之前到壘，完成一個出局。",
    fieldingError: "球沒有在第一下被控制住。",
    lateFielding: "你把球控制下來時，原本的封殺窗口已經關閉。",
    lateForce: "你完成接球與傳球，但前位跑者先一步到達封殺壘包。",
    lateTransfer: "二壘封殺成功後，轉傳動作沒有趕上打者，只拿到一個出局。"
    ,secondStageExpired: "你把第一傳送到二壘完成封殺；游擊手轉傳時，打者已先踩上一壘。"
    ,pivotPartial: resolution.upstreamThrowQuality && resolution.upstreamThrowQuality !== "clean" ? "游擊手第一傳稍微偏離，你調整腳步後仍完成二壘封殺，但已沒有回傳一壘的窗口。" : "你補位接球並完成二壘封殺，但回傳一壘的窗口已經關閉。"
    ,receiveFailure: "游擊手的第一傳使你必須重新調整，二壘封殺沒有在窗口內完成。"
    ,fallbackOut: resolution.fallbackRoute === "homeForceOut" ? "你原本準備啟動雙殺；重新握球後二壘窗口消失，改傳本壘完成封殺。" : "原處理窗口消失後，你改走仍然成立的出局路線。"
    ,fallbackLate: "原處理窗口消失後，你重新讀取壘況，但剩餘路線也已來不及完成出局。"
    ,coverageFallbackOut: "你未能及時補到二壘；游擊手沒有朝無人壘包傳球，而是改傳一壘完成打者出局。"
    ,coverageFailure: "你未能及時補到二壘；游擊手保留球權，沒有朝無人接應的壘包傳球。"
    ,tagOutHome: "捕手接球後完成觸殺，阻止三壘跑者得分。"
    ,homeTagMiss: "捕手接住傳球並完成觸殺動作，但三壘跑者先一步碰到本壘得分。"
    ,homeReceiveFailure: "傳球已送往本壘，但捕手沒能先控制住球，三壘跑者安全得分。"
    ,forceOutHome: "傳球先到本壘，捕手踩住壘包完成封殺。"
    ,leadRunnerOut: "三壘手踩住壘包完成封殺，領先跑者在三壘前出局。"
  }[resolution.detailedResult] : "";
  return Object.freeze({
    situation: `${situation.outs} 出局，${formatHighSchoolMatchRunners(situation.runners)}。${information.pace}${information.direction}；${information.depth}。${information.runnerCue ? `${information.runnerCue}。` : ""}${information.readCue}`,
    decision: choice?.text || "",
    execution: choice ? executions[choice.infieldRoute] || "你依照局面完成這次守備動作。" : "",
    outcome: outcomes || "",
    why: resolution?.causeExplanation || ""
  });
}

const infieldDecisionFamily = Object.freeze({
  id: "infield",
  buildSituation: buildInfieldMeaningfulMoment,
  adaptInformation: adaptInfieldInformation,
  generateLegalChoices: generateInfieldLegalChoices,
  classify: classifyPositionFamilyPlay,
  resolveResponsibility: resolveDefensivePlayResponsibility,
  evaluateAvailability: evaluateDefensiveRouteAvailability,
  evaluateReadiness: evaluateExecutionReadiness,
  reassess: reassessDefensiveRoutesAfterExecutionChange,
  resolve: resolveInfieldDecision,
  analyzeCauses: analyzeInfieldResolutionCauses,
  present: presentInfieldDecision
});

registerPositionDecisionFamily(infieldDecisionFamily);

function getHighSchoolDefensiveSituationText(match) {
  const baseText = formatHighSchoolMatchRunners(match.runners);
  const position = match.position;
  if (position === "外野手") return `${baseText}，一記平飛球落在你前方，跑者正在判斷是否多推進一個壘包。`;
  if (position === "捕手") return `${baseText}，投手的變化球提前落地，跑者同時離壘。`;
  if (position === "投手") return `${baseText}，短打落在投手丘右側，打者已離開打擊區。`;
  if (match.defensiveSituation?.familyId === "infield") return infieldDecisionFamily.present(match.defensiveSituation).situation;
  const ball = getHighSchoolBallContext(match);
  return `${baseText}，${ball.label}進入你的守區；${ball.detail}`;
}

const HIGH_SCHOOL_CATCHER_ROUTE_DEFINITIONS = Object.freeze({
  secureAndHold: Object.freeze({ id: "secureAndHold", action: "blockAndHold", target: "none", objective: "secureBall", releaseDecision: "holdBall", executionText: "你先用身體把彈球擋在身前，控制住球後確認所有跑者仍留在原壘。" }),
  secureAndReset: Object.freeze({ id: "secureAndReset", action: "returnToPitcher", target: "pitcher", objective: "resetPitchSequence", releaseDecision: "returnToPitcher", executionText: "你把彈球壓在身前，確認沒有跑者啟動後立刻交回投手，重新準備下一球。" }),
  holdRunnerAndReset: Object.freeze({ id: "holdRunnerAndReset", action: "holdAndReturn", target: "pitcher", objective: "holdRunners", releaseDecision: "returnToPitcher", executionText: "你先讀最前方跑者，球始終留在控制中；確認他停住後再交回投手。" }),
  blockAndControl: Object.freeze({ id: "blockAndControl", action: "blockOnly", target: "none", objective: "preventLooseBall", releaseDecision: "retainControl", executionText: "你用身體封住彈球路線，把球控制在本壘區內，沒有進行傳壘。" }),
  attemptLeadRunnerOut: Object.freeze({ id: "attemptLeadRunnerOut", action: "throwToLeadBase", target: "leadBase", objective: "recordRunnerOut", releaseDecision: "throwToBase", executionText: "你接起彈球、讀到最前方跑者離壘過遠，完成轉傳並把球送往目標壘包。" }),
  attemptHomeOut: Object.freeze({ id: "attemptHomeOut", action: "protectHome", target: "home", objective: "preventRun", releaseDecision: "playAtHome", executionText: "你控制彈球後守住本壘路線，準備在三壘跑者啟動時完成觸殺。" })
});

function makeHighSchoolCatcherChoice(text, catcherIntent, momentId) {
  const route = HIGH_SCHOOL_CATCHER_ROUTE_DEFINITIONS[catcherIntent];
  if (!route) return null;
  return Object.freeze({
    text,
    matchDecision: catcherIntent,
    catcherIntent,
    routeId: route.id,
    executionText: route.executionText,
    matchMomentId: momentId
  });
}

function getHighSchoolCatcherReassessment(match, selectedRoute) {
  const trigger = match?.catcherReassessmentTrigger;
  if (!trigger?.active || !["secureAndHold", "secureAndReset", "holdRunnerAndReset", "blockAndControl"].includes(selectedRoute)) return null;
  const targetRunnerBase = Number(trigger.runnerBase) || (match.runners?.[2] ? 3 : match.runners?.[1] ? 2 : match.runners?.[0] ? 1 : 0);
  if (!targetRunnerBase || !match.runners?.[targetRunnerBase - 1]) return null;
  const finalRoute = targetRunnerBase === 3 ? "attemptHomeOut" : "attemptLeadRunnerOut";
  return Object.freeze({
    explicit: true,
    reason: trigger.reason || "runnerBreakAfterBlock",
    selectedRoute,
    finalRoute,
    runnerId: match.runners[targetRunnerBase - 1],
    runnerBase: targetRunnerBase,
    presentation: targetRunnerBase === 3
      ? "你原本準備控制球並重設下一球，但三壘跑者在你撿球時突然啟動；你明確改往本壘處理。"
      : `你原本準備控制球並重設下一球，但${targetRunnerBase === 2 ? "二壘" : "一壘"}跑者突然啟動；你明確改向最前方壘包處理。`
  });
}

function getHighSchoolDefensiveMomentChoices(match) {
  const momentId = getHighSchoolYearOneMomentId(match);
  const force = getHighSchoolDefensiveForceState(match);
  const position = match.position;
  const choices = [];
  if (match.positionDecisionFamily === "infield" && match.defensiveSituation?.familyId === "infield") {
    return infieldDecisionFamily.generateLegalChoices(match.defensiveSituation, match);
  }
  if (position === "外野手") {
    choices.push({ text: "走 cutoff，把球交給內野封住後續壘包", matchDecision: "secure", matchMomentId: momentId });
    if (force.third) choices.push({ text: "直接長傳本壘，挑戰正在回來的三壘跑者", matchDecision: "home", matchMomentId: momentId });
    else choices.push({ text: "直接傳最前方壘包，挑戰正在推進的跑者", matchDecision: "lead", matchMomentId: momentId });
    choices.push({ text: force.first || force.second ? "壓住後方跑者，不讓打者趁傳多進一壘" : "把球快速送回內野，限制打者停在一壘", matchDecision: "contain", matchMomentId: momentId });
    return choices;
  }
  if (position === "捕手") {
    choices.push(makeHighSchoolCatcherChoice("先擋住球，守住目前壘包", "secureAndHold", momentId));
    if (force.third) choices.push(makeHighSchoolCatcherChoice("接起彈球後守住本壘，挑戰三壘跑者", "attemptHomeOut", momentId));
    else if (force.first || force.second) choices.push(makeHighSchoolCatcherChoice("接起彈球後傳最前方壘包，挑戰離壘跑者", "attemptLeadRunnerOut", momentId));
    else choices.push(makeHighSchoolCatcherChoice("接穩彈球後立刻交回投手，重設下一球", "secureAndReset", momentId));
    choices.push(makeHighSchoolCatcherChoice(
      force.first || force.second || force.third ? "先確認最前方跑者，再把球交回投手控制節奏" : "用身體擋在球後方，避免彈球滾離本壘區",
      force.first || force.second || force.third ? "holdRunnerAndReset" : "blockAndControl",
      momentId
    ));
    return choices;
  }
  choices.push({ text: "傳一壘，先拿最穩定的出局數", matchDecision: "secure", matchMomentId: momentId });
  if (!force.first && !force.second && !force.third) {
    choices.push({ text: "向前壓縮接球距離，站穩後傳一壘", matchDecision: "lead", matchMomentId: momentId });
    choices.push({ text: "正面接穩後傳一壘，不製造額外風險", matchDecision: "contain", matchMomentId: momentId });
    return choices;
  }
  if (force.forceAtHome) {
    choices.push({ text: "傳本壘完成封殺，阻止三壘跑者得分", matchDecision: "home", matchMomentId: momentId });
    choices.push({ text: match.outs < 2 ? "先傳二壘再轉一壘，挑戰雙殺" : "先看三壘跑者，再完成最短距離傳球", matchDecision: match.outs < 2 ? "challenge" : "contain", matchMomentId: momentId });
    return choices;
  }
  if (force.doublePlayEligible) {
    choices.push({ text: "先傳二壘再轉一壘，挑戰雙殺", matchDecision: "challenge", matchMomentId: momentId });
    if (force.forceAtThird) choices.push({ text: "傳三壘封殺最前位跑者", matchDecision: "lead", matchMomentId: momentId });
    else choices.push({ text: "先看最前方跑者，再完成最短距離傳球", matchDecision: "contain", matchMomentId: momentId });
    return choices;
  }
  if (force.forceAtThird) choices.push({ text: "傳三壘封殺最前位跑者", matchDecision: "lead", matchMomentId: momentId });
  else if (force.third) choices.push({ text: "傳本壘，挑戰正在回來的三壘跑者", matchDecision: "home", matchMomentId: momentId });
  else choices.push({ text: "傳最前方合法壘包，壓住跑者推進", matchDecision: "lead", matchMomentId: momentId });
  choices.push({ text: "先看最前方跑者，再完成最短距離傳球", matchDecision: "contain", matchMomentId: momentId });
  return choices;
}

function analyzeHighSchoolOffensiveDecisionContext(match) {
  const runners = (match?.runners || []).slice(0, 3);
  while (runners.length < 3) runners.push(null);
  const [first, second, third] = runners;
  const outs = Math.max(0, Math.min(2, Number(match?.outs) || 0));
  return Object.freeze({
    runners: Object.freeze(runners),
    first: Boolean(first),
    second: Boolean(second),
    third: Boolean(third),
    hasRunner: runners.some(Boolean),
    scoringPosition: Boolean(second || third),
    twoOuts: outs === 2,
    outs,
    scoreDifference: (Number(match?.scores?.home) || 0) - (Number(match?.scores?.away) || 0)
  });
}

function getHighSchoolOffensiveObjectiveContext(match) {
  const context = analyzeHighSchoolOffensiveDecisionContext(match);
  if (context.scoreDifference === -1) return "追平機會";
  if (context.scoreDifference < -1) return "縮小差距的機會";
  if (context.scoreDifference === 0) return "超前機會";
  return context.hasRunner ? "擴大領先並送回跑者的機會" : "上壘延續攻勢、擴大領先的機會";
}

function getHighSchoolOffensivePlayerPANumber(match) {
  return (match?.simulationLog || []).filter(event => event.type === "plateAppearance" && event.batterId === "player").length + 1;
}

function classifyHighSchoolOffensiveOpportunity(match, choices = buildOffensiveDecisionChoices(match)) {
  const inning = Math.max(1, Math.floor(Number(match?.inning) || 1));
  const regulationInnings = Math.max(1, Math.floor(Number(match?.regulationInnings) || 7));
  const half = match?.half === "上" ? "上" : "下";
  const outs = Math.max(0, Math.min(2, Math.floor(Number(match?.outs) || 0)));
  const runners = (match?.runners || []).slice(0, 3);
  while (runners.length < 3) runners.push(null);
  const runnerCount = runners.filter(Boolean).length;
  const scoringPosition = Boolean(runners[1] || runners[2]);
  const scoreDifference = (Number(match?.scores?.home) || 0) - (Number(match?.scores?.away) || 0);
  const deficit = Math.max(0, -scoreDifference);
  const finalInningBottom = inning >= regulationInnings && half === "下";
  const lateGame = inning >= Math.max(5, regulationInnings - 1);
  const gameLive = !match?.completed && !match?.pendingGameSettlement && outs < 3;
  const canTieOrLead = deficit > 0 && deficit <= runnerCount + 1;
  const approachCommitments = [...new Set((choices || []).map(choice => `${choice.selectionProfile || ""}|${choice.swingIntent || ""}`).filter(value => value !== "|"))];
  const strategicObjectives = [...new Set((choices || []).map(choice => choice.objective).filter(Boolean))];
  const distinctTradeoffs = approachCommitments.length >= 2 && strategicObjectives.length >= 2;
  let leverageClass = "routine";
  let reason = "routine-game-state";
  if (gameLive && finalInningBottom && canTieOrLead && (scoringPosition || outs === 2)) {
    leverageClass = "critical";
    reason = "final-inning-tying-or-go-ahead-run";
  } else if (gameLive && finalInningBottom && deficit > 0 && deficit <= 3) {
    leverageClass = "highLeverage";
    reason = scoringPosition ? "late-run-scoring-pressure" : "late-game-on-base-relevance";
  } else if (gameLive && lateGame && Math.abs(scoreDifference) <= 2 && (scoreDifference <= 0 || scoringPosition || runnerCount > 0)) {
    leverageClass = "meaningful";
    reason = "close-late-game-context";
  } else if (gameLive && scoringPosition && Math.abs(scoreDifference) <= 3) {
    leverageClass = "meaningful";
    reason = "run-scoring-opportunity";
  }
  const scoreBand = scoreDifference <= -4 ? "large-deficit" : scoreDifference < 0 ? "trailing-close"
    : scoreDifference === 0 ? "tied" : scoreDifference >= 4 ? "large-lead" : "leading-close";
  const topology = runners.map(Boolean).map(Number).join("");
  const situationFamily = `${lateGame ? "late" : "early"}|${scoreBand}|${outs}|${topology}|${leverageClass}`;
  return Object.freeze({
    version: "offensive-opportunity-v1",
    leverageClass,
    reason,
    meaningfulCandidate: gameLive && leverageClass !== "routine" && distinctTradeoffs,
    gameLive,
    inning,
    half,
    outs,
    runners: Object.freeze(runners),
    runnerCount,
    scoringPosition,
    scoreDifference,
    deficit,
    finalInningBottom,
    lateGame,
    canTieOrLead,
    distinctTradeoffs,
    approachCommitments: Object.freeze(approachCommitments),
    strategicObjectives: Object.freeze(strategicObjectives),
    situationFamily,
    noveltyKey: situationFamily,
    playerPANumber: getHighSchoolOffensivePlayerPANumber(match)
  });
}

function evaluateHighSchoolOffensiveDecisionDensity(match, classification, options = {}) {
  const state = ensureHighSchoolMatchDecisionDensityState(match);
  const playIndex = Array.isArray(match?.simulationLog) ? match.simulationLog.length : 0;
  const repeated = classification?.noveltyKey === state?.lastOffensiveNoveltyKey
    && classification?.playerPANumber === (state?.lastOffensiveDecisionPA || 0) + 1;
  const highLeverageOverride = ["critical", "highLeverage"].includes(classification?.leverageClass);
  let allowed = Boolean(classification?.meaningfulCandidate);
  let suppressionReason = "";
  if (options.forceScripted === true && classification?.gameLive && classification?.distinctTradeoffs) {
    allowed = true;
  } else if (!classification?.meaningfulCandidate) {
    allowed = false;
    suppressionReason = classification?.distinctTradeoffs ? "routine-opportunity" : "no-strategic-tradeoff";
  } else if (repeated && !highLeverageOverride) {
    allowed = false;
    suppressionReason = "repeated-routine-structure";
  }
  return Object.freeze({
    version: "offensive-decision-density-v1",
    allowed,
    suppressionReason,
    repeated,
    highLeverageOverride,
    forcedScripted: options.forceScripted === true,
    playIndex,
    playerPANumber: classification?.playerPANumber || 0,
    noveltyKey: classification?.noveltyKey || ""
  });
}

function applyHighSchoolOffensiveDecisionDensity(match, classification, density, created) {
  const state = ensureHighSchoolMatchDecisionDensityState(match);
  if (!state || !classification) return state;
  if (!created) {
    if (classification.meaningfulCandidate || classification.leverageClass === "routine") state.offensiveSuppressedCount += 1;
    if (density?.repeated) state.offensiveRepeatSuppressedCount += 1;
    return state;
  }
  state.offensiveDecisionCount += 1;
  state.lastOffensiveDecisionPA = classification.playerPANumber;
  state.lastOffensiveDecisionPlayIndex = density.playIndex;
  state.lastOffensiveNoveltyKey = classification.noveltyKey;
  state.recentOffensiveSituationFamilies = [...state.recentOffensiveSituationFamilies, classification.situationFamily].slice(-6);
  state.lastOffensiveDecisionInning = classification.inning;
  state.lastOffensiveDecisionHalf = classification.half;
  return state;
}

function evaluateHighSchoolOffensivePlayerAgency(match, classification = null) {
  const regulationInnings = Math.max(1, Math.floor(Number(match?.regulationInnings) || 7));
  const inning = Math.max(1, Math.floor(Number(match?.inning) || 1));
  const batter = getHighSchoolMatchLineupBatter(match, match?.offenseTeam);
  const playerActive = isHighSchoolMatchPlayerActive(match);
  const playerBatting = match?.offenseTeam === "home" && batter?.id === "player";
  const gameLive = !match?.completed && !match?.pendingGameSettlement && Number(match?.outs) < 3 && !isHighSchoolMatchWalkOff(match);
  const playerPANumber = classification?.playerPANumber || getHighSchoolOffensivePlayerPANumber(match);
  const candidateIdentity = [match?.id || "match", "agency", inning, match?.half || "", playerPANumber, "player"].join("|");
  const priorAgency = match?.offensivePlayerAgencyState;
  const alreadyResolved = priorAgency?.agencyIdentity === candidateIdentity && (priorAgency.resultApplied === true || priorAgency.status === "resolved");
  const lateGamePlayerAgency = Boolean(gameLive && playerActive && playerBatting && inning >= regulationInnings && !alreadyResolved);
  return Object.freeze({
    version: "offensive-player-agency-v1",
    agencyReason: lateGamePlayerAgency ? "late-game-canonical-player-pa" : alreadyResolved ? "canonical-pa-already-resolved" : "agency-not-required",
    lateGamePlayerAgency,
    gameLive,
    playerActive,
    playerBatting,
    inning,
    half: match?.half || "",
    regulationInnings,
    playerPANumber,
    leverageClass: classification?.leverageClass || "routine"
  });
}

function createHighSchoolOffensiveAgencyIdentity(match, agency) {
  return [match?.id || "match", "agency", agency?.inning || 0, agency?.half || "", agency?.playerPANumber || 0, "player"].join("|");
}

function prepareHighSchoolOffensiveAgencyChoice(match, classification, density, options = {}) {
  const agency = evaluateHighSchoolOffensivePlayerAgency(match, classification);
  if (!agency.lateGamePlayerAgency) return null;
  const existing = match.offensivePlayerAgencyState;
  const agencyIdentity = createHighSchoolOffensiveAgencyIdentity(match, agency);
  if (existing?.agencyIdentity === agencyIdentity && existing.status !== "resolved") return existing;
  const routeTarget = options.routeTarget || "classified";
  const resumePhase = routeTarget === "firstOffense" ? "moment_1_resolved"
    : routeTarget === "finalOffense" ? "moment_3_resolved" : (match.simulationPhase || "full_match_flow");
  const priorFlow = {
    simulationPhase: match.simulationPhase,
    momentIndex: match.momentIndex,
    currentMomentId: match.currentMomentId,
    currentDomain: match.currentDomain,
    currentAssignment: match.currentAssignment
  };
  const momentId = routeTarget === "firstOffense" ? highSchoolYearOneMomentIds[0]
    : routeTarget === "finalOffense" ? highSchoolYearOneMomentIds[2]
      : `hs_y1_match_offense_${agency.playerPANumber}`;
  const paIdentity = OffensivePlateApproach.createPlateAppearanceIdentity({
    matchId: match.id, paId: momentId, batterId: "player", inning: match.inning, half: match.half
  });
  match.currentBatter = "player";
  match.currentMomentId = momentId;
  match.currentDomain = "offenseAgency";
  match.simulationPhase = "offensive_agency_ready";
  match.currentAssignment = "這個打席已經輪到你；選擇要自己操作，或交給既有比賽模擬完成。";
  match.offensivePlayerAgencyState = {
    version: "offensive-player-agency-v1",
    agencyIdentity,
    agencyReason: agency.agencyReason,
    status: "pending",
    selection: "",
    canonicalPAIdentity: paIdentity,
    inning: agency.inning,
    half: agency.half,
    playerPANumber: agency.playerPANumber,
    resumePhase,
    routeTarget,
    momentId,
    leverageClass: classification?.leverageClass || "routine",
    lateGamePlayerAgency: true,
    classification: JSON.parse(JSON.stringify(classification)),
    density: JSON.parse(JSON.stringify(density)),
    priorFlow,
    resultApplied: false,
    result: ""
  };
  recordHighSchoolMatchOffensiveOpportunity(match, "agency", buildOffensiveDecisionChoices(match), classification, density);
  recordHighSchoolMatchSimulationEvent(match, {
    type: "playerAgencyOpportunityReached", eventClassification: "playerAgencyOpportunity",
    agencyIdentity, agencyReason: agency.agencyReason, leverageClass: classification?.leverageClass || "routine",
    inning: match.inning, half: match.half, momentId, domain: "offenseAgency", assignment: match.currentAssignment,
    outs: match.outs, scores: match.scores, runners: match.runners
  });
  return match.offensivePlayerAgencyState;
}

function getHighSchoolOffensiveAgencyChoices(match) {
  const state = match?.offensivePlayerAgencyState;
  if (!state || state.status !== "pending" || match?.simulationPhase !== "offensive_agency_ready") return [];
  return [
    Object.freeze({ text: "自己打", agencyDecision: "manual", matchDecision: "agencyManual", matchMomentId: state.momentId }),
    Object.freeze({ text: "快速帶過這次打席", agencyDecision: "simulate", matchDecision: "agencySimulate", matchMomentId: state.momentId })
  ];
}

function renderHighSchoolOffensiveAgencyContext(match) {
  const state = match?.offensivePlayerAgencyState;
  if (!state) return "";
  return `<section class="match-current-assignment offensive-agency-choice" aria-labelledby="offensiveAgencyTitle"><small id="offensiveAgencyTitle">打席參與方式</small><strong>這個打席要不要自己操作？</strong><p>想逐球判斷就自己打；想快轉到結果就快速帶過。</p></section>`;
}

function renderHighSchoolPlateAppearanceContext(match) {
  const state = match?.offensivePlateAppearanceState;
  const sameMoment = state?.paIdentity?.includes(getHighSchoolYearOneMomentId(match) || "__none__");
  const balls = sameMoment ? Number(state.balls) || 0 : 0;
  const strikes = sameMoment ? Number(state.strikes) || 0 : 0;
  const lastPitch = sameMoment && Array.isArray(state.pitchHistory) ? state.pitchHistory.at(-1) : null;
  const lastPitchText = lastPitch
    ? `<small>上一球：${escapeHtml(lastPitch.pitch?.impression || "投手完成上一球")}；${escapeHtml(lastPitch.action === "swing" ? "出棒" : "放掉")}，${escapeHtml({ ball: "壞球", calledStrike: "主審判好球", swingingStrike: "揮棒落空", foul: "界外球", ballInPlay: "球進入場內" }[lastPitch.pitchResult] || lastPitch.pitchResult)}</small>`
    : "<small>打席從 0-0 開始；選定打法後，你會依每顆實際來球完成這個打席。</small>";
  return `<section class="match-current-assignment plate-approach-count" aria-label="目前打席球數"><small>球數 B-S</small><strong>${balls}-${strikes}</strong>${lastPitchText}</section>`;
}

function renderHighSchoolBatterAnticipationPanel(match) {
  if (typeof BatterAnticipation === "undefined" || !match?.batterAnticipationState) return "";
  const presentation = BatterAnticipation.createPrePAPresentation(match.batterAnticipationState);
  const observationHtml = presentation.observationLines.map(line => `<p>${escapeHtml(line)}</p>`).join("");
  return `<section class="match-batter-read" aria-labelledby="batterReadTitle">
    <small id="batterReadTitle">打席判讀</small>
    <div class="match-batter-read__item"><strong>觀察</strong>${observationHtml}</div>
    <div class="match-batter-read__item"><strong>你的預判</strong><p>${escapeHtml(presentation.anticipationText)}</p></div>
    <div class="match-batter-read__confidence"><strong>判斷把握</strong><span>${escapeHtml(presentation.confidenceText)}</span></div>
  </section>`;
}

function buildOffensiveDecisionChoices(match) {
  const context = analyzeHighSchoolOffensiveDecisionContext(match);
  const momentId = getHighSchoolYearOneMomentId(match);
  if (!momentId || match?.currentDomain === "defense") return [];
  const make = ({ text, matchDecision, objective, approach, route, riskProfile, requirements = [], executionText }) => Object.freeze({
    ...OffensivePlateApproach.normalizeApproachPackage(approach),
    text,
    matchDecision,
    matchMomentId: momentId,
    objective,
    approach,
    action: approach,
    route,
    riskProfile,
    risk: riskProfile,
    requirements: Object.freeze(requirements.slice()),
    executionOnly: false,
    executionText
  });
  const attackTask = context.scoreDifference === -1 ? "直接挑戰追平機會"
    : context.scoreDifference < -1 ? "嘗試長打縮小差距"
      : context.scoreDifference === 0 ? "直接挑戰超前機會"
        : context.hasRunner ? "挑戰外野空檔增加保險分" : "挑戰外野空檔擴大領先";
  const choices = [
    make({
      text: `搶第一顆可攻擊球，${attackTask}`,
      matchDecision: "attack",
      objective: "createExtraBaseHit",
      approach: "aggressiveEarlySwing",
      route: "attackPitchToGap",
      riskProfile: "high",
      executionText: "你提早備妥揮棒，鎖定第一顆進入可攻擊區域的球。"
    }),
    make({
      text: "縮小攻擊區，盡量放掉邊角球，只積極處理真正進入甜蜜區的球",
      matchDecision: "zone",
      objective: "reachBase",
      approach: "patientSelection",
      route: "selectivePlateAppearance",
      riskProfile: "low",
      executionText: "你收窄攻擊區，但仍準備攻擊真正進入甜蜜點的球。"
    })
  ];
  if (!context.hasRunner) {
    choices.push(make({
      text: "縮短揮棒，提高把球確實打進場內的機會",
      matchDecision: "advance",
      objective: "putBallInPlay",
      approach: "compactContact",
      route: "contactFirst",
      riskProfile: "medium",
      executionText: "你縮短揮棒軌跡，把重點放在確實擊中來球。"
    }));
  } else if (context.twoOuts && context.scoringPosition) {
    choices.push(make({
      text: "縮短揮棒，爭取用安打送回得分位置上的跑者",
      matchDecision: "advance",
      objective: "scoreRunner",
      approach: "compactLineDrive",
      route: "contactForRun",
      riskProfile: "medium",
      requirements: ["runnerInScoringPosition"],
      executionText: "兩出局後不能用出局交換推進；你縮短揮棒，尋找能穿過守備的擊球。"
    }));
  } else if (context.twoOuts) {
    choices.push(make({
      text: "縮短揮棒，先把攻勢延續到下一棒",
      matchDecision: "advance",
      objective: "reachBase",
      approach: "compactContact",
      route: "extendInning",
      riskProfile: "medium",
      executionText: "兩出局後你不以犧牲推進為目標，而是縮短揮棒爭取上壘。"
    }));
  } else if (context.third) {
    choices.push(make({
      text: "縮短揮棒，讓三壘跑者有回本壘的機會",
      matchDecision: "advance",
      objective: "scoreRunner",
      approach: "compactContact",
      route: "contactForRun",
      riskProfile: "medium",
      requirements: ["runnerOnThird", "fewerThanTwoOuts"],
      executionText: "你縮短揮棒，嘗試用有效擊球送回三壘跑者。"
    }));
  } else {
    choices.push(make({
      text: context.second ? "縮短揮棒，把二壘跑者向下一個壘包推進" : "縮短揮棒，爭取把一壘跑者送進得分位置",
      matchDecision: "advance",
      objective: "advanceRunner",
      approach: "compactContact",
      route: "advanceExistingRunner",
      riskProfile: "medium",
      requirements: context.second ? ["runnerOnSecond", "fewerThanTwoOuts"] : ["runnerOnFirst", "fewerThanTwoOuts"],
      executionText: "你縮短揮棒軌跡，讓擊球方向服務眼前真實存在的跑者。"
    }));
  }
  return choices;
}

function isOffensiveDecisionChoiceLegal(choice, match) {
  if (!choice || choice.executionOnly || match?.currentDomain === "defense") return false;
  const context = analyzeHighSchoolOffensiveDecisionContext(match);
  const runnerObjectives = new Set(["advanceRunner", "scoreRunner", "avoidDoublePlay"]);
  if (!context.hasRunner && runnerObjectives.has(choice.objective)) return false;
  if (context.twoOuts && ["sacrificeAdvance", "sacrificeFly"].includes(choice.objective)) return false;
  if (context.twoOuts && ["sacrificeAdvance", "sacrificeFly"].includes(choice.route)) return false;
  const checks = {
    runnerOnFirst: context.first,
    runnerOnSecond: context.second,
    runnerOnThird: context.third,
    runnerInScoringPosition: context.scoringPosition,
    anyRunner: context.hasRunner,
    fewerThanTwoOuts: !context.twoOuts,
    doublePlayPossible: context.first && !context.twoOuts
  };
  return (choice.requirements || []).every(requirement => checks[requirement] === true);
}

function getHighSchoolYearOneMatchMomentChoices(match = prepareHighSchoolYearOneMatch()) {
  if (match?.simulationPhase === "offensive_agency_ready") return getHighSchoolOffensiveAgencyChoices(match);
  const momentId = getHighSchoolYearOneMomentId(match);
  if (!momentId) return [];
  if (match.momentIndex === 1) {
    return getHighSchoolDefensiveMomentChoices(match);
  }
  ensureHighSchoolBatterAnticipationState(match);
  return buildOffensiveDecisionChoices(match).filter(choice => isOffensiveDecisionChoiceLegal(choice, match));
}

function getHighSchoolPlayingTimeSchoolContext(subject = player) {
  const invitation = typeof getSelectedSchoolInvitation === "function" ? getSelectedSchoolInvitation(subject) : null;
  if (invitation) {
    return Object.freeze({
      schoolId: invitation.schoolId || "",
      playingTimeEnvironment: invitation.playingTimeOpportunity || "medium",
      competitionDepth: invitation.competitionDepth || "medium",
      positionNeed: invitation.schoolInterest?.positionNeed || "medium",
      projectedRole: invitation.projectedRole || "",
      coachStyle: invitation.coachProfile?.coachStyle || "balanced"
    });
  }
  const route = String(subject?.highSchoolRoute || "");
  if (route.startsWith("強豪")) {
    return Object.freeze({ schoolId: "legacy-powerhouse", playingTimeEnvironment: "low", competitionDepth: "veryHigh", positionNeed: "medium", projectedRole: "", coachStyle: "competition" });
  }
  if (route.startsWith("普通")) {
    return Object.freeze({ schoolId: "legacy-standard", playingTimeEnvironment: "mediumHigh", competitionDepth: "medium", positionNeed: "medium", projectedRole: "", coachStyle: "development" });
  }
  return Object.freeze({ schoolId: "school-context-unavailable", playingTimeEnvironment: "medium", competitionDepth: "medium", positionNeed: "medium", projectedRole: "", coachStyle: "analysis" });
}

function createHighSchoolPlayingTimeOpportunity(options = {}) {
  if (typeof PlayingTimeGameExposure === "undefined") return null;
  const requestedPosition = options.requestedPosition || player.primaryPosition || "內野手";
  const school = getHighSchoolPlayingTimeSchoolContext(player);
  const readinessSnapshot = PlayingTimeGameExposure.createOpportunityReadinessSnapshot({
    subject: player,
    playerId: [player.name || "player", player.characterGenesis?.shape || "", school.schoolId].join("|"),
    position: requestedPosition,
    capabilityProvider: getDefensiveSimulationCapability,
    positionAssessmentProvider: getPositionAssessment
  });
  return PlayingTimeGameExposure.resolveStartingOpportunity({
    matchId: options.matchId,
    readinessSnapshot,
    opportunitySeed: `${player.capabilityState?.settlementId || player.capabilityState?.version || "capability"}|${options.matchId || "match"}`,
    actualRole: options.actualRole,
    projectedRole: school.projectedRole,
    playingTimeEnvironment: school.playingTimeEnvironment,
    competitionDepth: school.competitionDepth,
    positionNeed: school.positionNeed,
    coachUsageStyle: school.coachStyle,
    directStartForced: options.directStartForced === true,
    gameContext: { gameType: "highSchoolExhibition", inning: 0, expectedGameImportance: "regular", importance: "regular", leverage: "normal", scoreMargin: 0 }
  });
}

function getHighSchoolPlayingTimeAssignmentText(decision) {
  if (decision?.pitcherExposureDeferred) return "本場投手使用仍由既有比賽流程處理，不套用野手出賽安排";
  if (decision?.plannedUsage?.appearanceType === "start") {
    return decision.exposureSource === "direct-start-forced"
      ? `本次直接開局把你排進${decision.assignedPosition || "守備"}先發，從開賽起進入守備與打序`
      : `教練把你排進本場${decision.assignedPosition || "守備"}先發，實際任務仍由場上局面決定`;
  }
  if (decision?.plannedUsage?.appearanceType === "noAppearance") return "本場先從板凳觀察；是否獲得實際上場機會仍由比賽局勢決定";
  return `本場先從板凳待命，教練預計在${decision.plannedUsage.entryInning || 5}局後依比分與守位需求決定是否換你上場`;
}

function prepareHighSchoolYearOneMatch() {
  assertHighSchoolMatchCapabilityAdmission(player);
  if (player.highSchoolMatch?.id === "hs-y1-autumn-exhibition") {
    const match = player.highSchoolMatch;
    if (match.completed || (typeof match.simulationPhase === "string" && match.rosters?.home?.lineup?.length === 9 && match.rosters?.away?.lineup?.length === 9)) {
      match.currentMomentId = getHighSchoolYearOneMomentId(match);
      if (!match.completed && match.currentDomain === "defense" && isInfieldDecisionFamilyPosition(match.developmentPositionOverride || match.position) && match.defensiveSituation?.familyId !== "infield") {
        buildInfieldMeaningfulMoment(match, player);
        match.currentAssignment = getHighSchoolDefensiveSituationText(match);
        setHighSchoolCoachTacticalDirection(match);
      }
      return match;
    }
  }
  const code = ["starter", "rotation", "bench"].includes(player.highSchoolRoleCode) ? player.highSchoolRoleCode : "bench";
  const roleAssignments = {
    starter: { lineupStatus: "starter", entryWindowInning: 1, history: `以${player.primaryPosition || "守備"}先發，從開賽起進入守備與打序` },
    rotation: { lineupStatus: "bench", entryWindowInning: 4, history: `本場先從板凳待命，預計在中段代打並接替${player.primaryPosition || "守備"}` },
    bench: { lineupStatus: "bench", entryWindowInning: 5, history: `本場先從板凳觀察，等待中後段代打與短局守備機會` }
  };
  const position = player.primaryPosition || "內野手";
  const requestedDevelopmentPosition = infieldPositions.includes(pendingHighSchoolMatchPositionOverride)
    ? pendingHighSchoolMatchPositionOverride : "";
  if (requestedDevelopmentPosition && !isDevelopmentTestPositionLegalForThrowingHand(requestedDevelopmentPosition, player.throws, player.age)) {
    throw new Error(getDevelopmentTestPositionLegalityMessage(requestedDevelopmentPosition, player.throws));
  }
  const developmentPositionOverride = requestedDevelopmentPosition;
  const simulationSeed = createHighSchoolMatchSimulationSeed();
  const directStartForced = Array.isArray(player.flags) && player.flags.includes("direct_start_history");
  const opportunityDecision = createHighSchoolPlayingTimeOpportunity({
    matchId: "hs-y1-autumn-exhibition",
    actualRole: code,
    requestedPosition: developmentPositionOverride || position,
    directStartForced
  });
  const plannedAppearance = opportunityDecision?.plannedUsage?.appearanceType || (code === "starter" ? "start" : "lateGameAppearance");
  const starts = plannedAppearance === "start";
  const roleAssignment = opportunityDecision
    ? {
      lineupStatus: starts ? "starter" : "bench",
      entryWindowInning: starts ? 1 : Math.max(5, Number(opportunityDecision.plannedUsage.entryInning) || 5),
      history: getHighSchoolPlayingTimeAssignmentText(opportunityDecision)
    }
    : roleAssignments[code];
  const assignedPosition = opportunityDecision?.assignedPosition || developmentPositionOverride || position;
  const developmentTestCapabilityOverride = developmentPositionOverride
    ? createDevelopmentMatchPositionTestCapabilityOverride(developmentPositionOverride, player) : null;
  const rosters = createHighSchoolMatchSimulationRoster(starts ? "starter" : code === "starter" ? "bench" : code, assignedPosition);
  const playerLineupSlot = rosters.home.lineup.findIndex(item => item.id === "player");
  player.highSchoolMatch = {
    id: "hs-y1-autumn-exhibition",
    opponent: "高橋所屬的地區強校",
    inning: 1,
    half: "上",
    outs: 0,
    scores: { home: 0, away: 0 },
    runners: [null, null, null],
    role: code,
    position,
    assignment: roleAssignment.history,
    matchEntryHistory: `${roleAssignment.history}；${formatHandedness(player.bats, player.throws)}`,
    currentAssignment: starts ? "比賽從一局上開始；先完成守備，再等待打序輪到你。" : "比賽從一局上開始；你在板凳觀察，但場上每個打席都會完整進行。",
    offenseTeam: "away",
    defenseTeam: "home",
    currentBatter: rosters.away.lineup[0]?.id || "",
    battingOrderIndex: { home: 0, away: 0 },
    halfInningResolved: false,
    simulationPhase: "full_match_flow",
    simulationCursor: 0,
    simulationSeed,
    simulationLog: [],
    presentedEventCursor: 0,
    scoreboardRevealHalfIndex: 0,
    regulationInnings: 7,
    lineScore: { home: [], away: [] },
    rosters,
    playerLineupStatus: roleAssignment.lineupStatus,
    playerLineupSlot,
    playerFieldingAssignment: starts ? assignedPosition : "",
    playerEntryWindowInning: roleAssignment.entryWindowInning,
    playerEntryCompleted: starts,
    performanceEvidence: {},
    matchExperience: null,
    gameExposureState: opportunityDecision && typeof PlayingTimeGameExposure !== "undefined"
      ? PlayingTimeGameExposure.createGameExposureState(opportunityDecision) : null,
    developmentFullMatchStart: pendingHighSchoolFullMatchTest,
    playerRunnerLocation: -1,
    momentIndex: 0,
    currentMomentId: highSchoolYearOneMomentIds[0],
    currentDomain: "flow",
    coachTacticalDirection: { domain: "", intent: "", riskPreference: "", priority: "", sourceCoachId: "", presentationStyle: "" },
    coachTacticalContextSignature: "",
    opponentTacticalTruth: { code: "", targetRunnerId: "" },
    ballContext: { type: "", family: "", pace: "", label: "", detail: "", timeWindow: "" },
    positionDecisionFamily: "", currentFieldingPosition: starts && (developmentPositionOverride || opportunityDecision?.positionFallbackApplied) ? assignedPosition : "", developmentPositionOverride,
    developmentTestCapabilityOverride, defensiveSituation: {},
    matchDecisionDensityState: createHighSchoolMatchDecisionDensityState(),
    pitcherRuntimeState: null,
    pitcherSequencingDebugTrace: [],
    pitcherObservableHistory: [],
    batterAnticipationState: null,
    prePitchPlanningState: null,
    offensivePlateAppearanceState: null,
    pendingOffensiveOpportunity: null,
    offensivePlayerAgencyState: null,
    offensiveTacticalActionState: null,
    offensiveBuntPAState: null,
    buntBallInPlayState: null,
    pendingDefensiveResumeState: null,
    lastDefensiveResolution: { resultCode: "", tier: "", decisionQuality: "", executionQuality: "", primaryCause: "", secondaryCause: "", causeExplanation: "" },
    pendingHalfInningTermination: null,
    catcherDecisionState: null,
    catcherReassessmentTrigger: null,
    completedMoments: [],
    playerContribution: { strong: 0, mixed: 0, failure: 0, runsCreated: 0, runsScored: 0, hits: 0, walks: 0, outsCreated: 0, errors: 0 },
    previousMomentDecision: "",
    previousMomentOutcome: "",
    passage: "",
    opponentAdjustment: "",
    coachInstruction: starts ? "先跟著比賽完成每個守備與打席。" : "先讀完整比賽流；被叫到時直接接進當下局面。",
    decision: "",
    outcomeTier: "",
    outcome: "",
    consequence: "",
    coachReaction: "現任教練確認你的第一個場上任務。",
    teamReaction: "休息區把下一段比賽交到你手上。",
    performanceSummary: "",
    teamResult: "",
    settled: false,
    pendingGameSettlement: "",
    eventSettlementApplied: false,
    developmentPresentationCompleted: false,
    completed: false
  };
  ensureHighSchoolPitcherRuntimeState(player.highSchoolMatch);
  if (isHighSchoolMatchOpportunityDebugMode()) ensureHighSchoolMatchOpportunityTrace(player.highSchoolMatch);
  setHighSchoolCoachTacticalDirection(player.highSchoolMatch);
  recordHighSchoolMatchSimulationEvent(player.highSchoolMatch, {
    type: "matchEntry", inning: 1, half: "上",
    outs: 0, runners: player.highSchoolMatch.runners,
    scores: player.highSchoolMatch.scores,
    assignment: player.highSchoolMatch.matchEntryHistory
  });
  pendingHighSchoolMatchPositionOverride = "";
  pendingHighSchoolFullMatchTest = false;
  player.highSchoolRoleContext.assignment = roleAssignment.history;
  return player.highSchoolMatch;
}

function getHighSchoolYearOneMomentAbilityScore(match, decision) {
  const skills = player.baseballSkills || {};
  if (match.momentIndex === 1) {
    const defense = getHighSchoolDefenseContext(match.position);
    const toolScore = defense.tools.reduce((sum, key) => sum + (Number(skills[key]) || 0), 0);
    const instructionFit = match.coachInstruction.includes("穩定") && decision === "secure" ? 4
      : match.coachInstruction.includes("主動") && decision === "challenge" ? 4
        : decision === "contain" ? 2 : 0;
    return toolScore + (Number(player.observe) || 0) + instructionFit + getHighSchoolDefensiveDecisionContextModifier(match, decision) + (player.throws === "L" ? 1 : 0);
  }
  const batting = Number(skills.batting) || 0;
  const iq = Number(skills.baseballIQ) || 0;
  const scores = {
    attack: batting * 2 + (Number(player.ballSense) || 0) + (Number(player.instinct) || 0),
    zone: batting + iq + (Number(player.observe) || 0) + (Number(player.discipline) || 0),
    advance: batting + iq * 2 + (Number(player.ballSense) || 0)
  };
  let contextFit = player.bats === "S" ? 1 : 0;
  if (match.momentIndex === 2) {
    if (match.coachInstruction.includes("推進") && decision === "advance") contextFit += 4;
    if (match.opponentAdjustment.includes("內角") && decision === "zone") contextFit += 3;
    if (match.opponentAdjustment.includes("慢球") && decision === "attack") contextFit -= 2;
  }
  return (scores[decision] || 0) + contextFit;
}

function getHighSchoolDefensiveDecisionContextModifier(match, decision) {
  const batter = getHighSchoolMatchSimulationEntity(match, match.currentBatter);
  const runnerEntities = match.runners.map(runnerId => getHighSchoolMatchSimulationEntity(match, runnerId)).filter(Boolean);
  const batterSpeed = Number(batter?.speed) || 5;
  const leadRunnerSpeed = Number(runnerEntities.at(-1)?.speed) || 5;
  const defense = getDefensiveSimulationCapability(player, match.position);
  const timeWindow = getHighSchoolDefensiveTimeWindow(match);
  if (decision === "secure") return Math.round((defense.fielding - batterSpeed) / 2) + 2;
  if (decision === "challenge") return Math.round((defense.arm + defense.throwing + defense.reaction - batterSpeed - leadRunnerSpeed) / 3) + timeWindow.transferModifier;
  if (["lead", "home"].includes(decision)) return Math.round((defense.arm + defense.throwing - leadRunnerSpeed) / 3) + timeWindow.fieldingModifier;
  if (decision === "contain") return Math.round((defense.decision - leadRunnerSpeed) / 2) + 1;
  return 0;
}

function getHighSchoolDefensiveCauseExplanation(resolution) {
  const explanations = {
    hardGrounder: "強勁正面球讓你接穩後仍保有完整的轉傳時間。",
    slowGrounder: resolution?.resultCode === "oneOut"
      ? "你必須往前衝接，第一個封殺完成時，雙殺窗口已經縮短。"
      : "你必須往前衝接，第一段處理時間被壓縮，原本的封殺窗口也跟著縮短。",
    deepGrounder: "球進到內野深處，較長的傳球距離壓縮了第二段處理時間。",
    batterSpeed: "打者起跑很快，轉傳一壘時只差了半步。",
    runnerSpeed: "最前位跑者提前啟動，第一個封殺窗口比表面上更短。",
    fielding: "第一下接球沒有完全進入手套，重新控制球花掉了處理時間。",
    reaction: "你讀對了方向，但第一步啟動稍慢，後續傳球窗口因此縮小。",
    armStrength: "第一個封殺完成，但第二段傳球速度不足，打者先一步踩壘。",
    throwing: "第一個出局已經成立，第二段轉傳的出手點沒有完全對上壘包。",
    transferWindow: "第一個出局完成後，剩下的轉傳窗口不足以再抓到打者。",
    decisionRisk: "這個選擇有合法封殺點，但需要兩段動作都在短時間內完成。",
    balancedExecution: "球況、跑者與你的動作落在同一個可完成的守備節奏裡。"
  };
  const primary = explanations[resolution?.primaryCause] || explanations.balancedExecution;
  const secondary = explanations[resolution?.secondaryCause];
  return secondary && secondary !== primary ? `${primary} ${secondary}` : primary;
}

function resolveHighSchoolCatcherDecision(match, selectedRoute, randomSource = Math.random) {
  const selectedDefinition = HIGH_SCHOOL_CATCHER_ROUTE_DEFINITIONS[selectedRoute];
  if (!match || match.position !== "捕手" || !selectedDefinition) return null;
  const availableRoutes = getHighSchoolDefensiveMomentChoices(match).map(choice => choice.catcherIntent);
  const legalChoice = getHighSchoolDefensiveMomentChoices(match).find(choice => choice.catcherIntent === selectedRoute);
  if (!legalChoice) return null;
  const rawSample = typeof randomSource === "function" ? Number(randomSource()) : Number(randomSource);
  const sample = Number.isFinite(rawSample) ? Math.max(0, Math.min(0.999999, rawSample)) : 0.5;
  const reassessment = getHighSchoolCatcherReassessment(match, selectedRoute);
  const finalRoute = reassessment?.finalRoute || selectedRoute;
  const finalDefinition = HIGH_SCHOOL_CATCHER_ROUTE_DEFINITIONS[finalRoute];
  const defense = getDefensiveSimulationCapability(player, "捕手");
  const runnersBefore = match.runners.slice(0, 3);
  while (runnersBefore.length < 3) runnersBefore.push(null);
  const runnersAfter = runnersBefore.slice();
  const runnerChanges = [];
  const scoringAttempts = [];
  const chanceSwing = (sample - 0.5) * 4;
  const controlScore = defense.fielding * 0.8 + defense.reaction * 0.6 + defense.decision * 0.35 + chanceSwing;
  const isThrowRoute = ["attemptLeadRunnerOut", "attemptHomeOut"].includes(finalRoute);
  let targetBase = 0;
  if (finalRoute === "attemptHomeOut") targetBase = 3;
  else if (finalRoute === "attemptLeadRunnerOut") targetBase = runnersBefore[2] ? 3 : runnersBefore[1] ? 2 : runnersBefore[0] ? 1 : 0;
  const targetRunnerId = targetBase ? runnersBefore[targetBase - 1] : null;
  const targetRunner = getHighSchoolMatchSimulationEntity(match, targetRunnerId);
  const throwScore = defense.throwing * 0.7 + defense.reaction * 0.4 + defense.decision * 0.25 + chanceSwing - (Number(targetRunner?.speed) || 5) * 0.35;
  let resultCode = "controlledReset";
  let outsCreated = 0;
  let error = false;
  if (isThrowRoute && targetRunnerId) {
    if (controlScore >= 4.5 && throwScore >= 4.5) {
      resultCode = "runnerOut";
      outsCreated = 1;
      runnersAfter[targetBase - 1] = null;
    } else if (controlScore < 2.5 || throwScore < 1.5) {
      resultCode = "throwingError";
      error = true;
      runnersAfter[targetBase - 1] = null;
      if (targetBase === 3) scoringAttempts.push({ runnerId: targetRunnerId, timing: "beforeThirdOut" });
      else runnersAfter[targetBase] = targetRunnerId;
    } else {
      resultCode = "runnerSafe";
    }
  } else if (finalRoute === "secureAndHold" || finalRoute === "holdRunnerAndReset") {
    resultCode = "runnersHeld";
  } else if (finalRoute === "blockAndControl") {
    resultCode = "ballControlled";
  }
  const thirdOutResolution = resolveHighSchoolThirdOutIntegrity({
    outsBefore: match.outs,
    outsCreated,
    runnersBefore,
    proposedRunnersAfter: runnersAfter,
    scoringAttempts,
    thirdOutType: outsCreated ? HIGH_SCHOOL_THIRD_OUT_TYPES.nonForceTag : HIGH_SCHOOL_THIRD_OUT_TYPES.none
  });
  const finalRunners = thirdOutResolution.basesAfter.slice();
  runnersBefore.forEach((runnerId, index) => {
    if (!runnerId) return;
    const nextIndex = finalRunners.indexOf(runnerId);
    const scored = thirdOutResolution.legalScoringRunnerIds.includes(runnerId);
    runnerChanges.push({
      runnerId,
      from: index + 1,
      to: scored ? "home" : nextIndex >= 0 ? nextIndex + 1
        : thirdOutResolution.halfInningEnded && runnerId !== targetRunnerId ? "halfInningEnd" : "out"
    });
  });
  const tier = resultCode === "runnerOut" || ["controlledReset", "runnersHeld", "ballControlled"].includes(resultCode) && controlScore >= 5
    ? "strong" : resultCode === "throwingError" ? "failure" : "mixed";
  const outcomes = {
    controlledReset: ["你把彈球控制在身前並交回投手", "跑者沒有啟動，比賽重新進入下一球。"],
    runnersHeld: ["你控制住彈球與跑者的起步", finalDefinition.releaseDecision === "returnToPitcher" ? "跑者留在原壘，球回到投手手中重新準備下一球。" : "跑者留在原壘，你沒有進行不必要的傳壘。"],
    ballControlled: ["你用身體把彈球封在本壘區內", "球沒有滾離控制範圍，也沒有出現虛構的傳壘或出局。"],
    runnerOut: [finalRoute === "attemptHomeOut" ? "你在本壘前完成觸殺" : "你的傳球趕上離壘過遠的跑者", "這次出局來自玩家選擇的抓跑者路線。"],
    runnerSafe: [finalRoute === "attemptHomeOut" ? "跑者先一步回到本壘" : "跑者搶先回到目標壘包", "你確實依選擇完成傳壘，但出手時機沒有形成出局。"],
    throwingError: [finalRoute === "attemptHomeOut" ? "本壘處理偏離接球點，跑者得分" : "傳球偏離目標，跑者多推進一個壘包", "額外推進只發生在明確選擇或重新評估後的傳壘路線。"]
  };
  const [outcome, consequence] = outcomes[resultCode];
  const executionStages = Object.freeze({
    secure: controlScore >= 2.5 ? "completed" : "recovered",
    control: controlScore >= 4.5 ? "completed" : "delayed",
    runnerRead: isThrowRoute ? "targetIdentified" : "runnersChecked",
    releaseDecision: finalDefinition.releaseDecision,
    throw: isThrowRoute ? (resultCode === "throwingError" ? "offTarget" : "completed") : "notAttempted",
    reset: finalDefinition.releaseDecision === "returnToPitcher" ? "completed" : "notRequired"
  });
  const executionText = reassessment
    ? `${reassessment.presentation} ${finalDefinition.executionText}`
    : selectedDefinition.executionText;
  return Object.freeze({
    familyId: "catcher",
    availableRoutes: Object.freeze(availableRoutes),
    selectedRoute,
    finalRoute,
    reassessment,
    executionStages,
    executionText,
    resultCode,
    tier,
    decisionQuality: "intentPreserved",
    executionQuality: tier === "strong" ? "complete" : tier === "mixed" ? "controlled" : "misplay",
    outsCreated,
    runsAllowed: thirdOutResolution.legalScoringRunnerIds.length,
    runnerChanges: Object.freeze(runnerChanges.map(change => Object.freeze(change))),
    scoringRunnerIds: thirdOutResolution.legalScoringRunnerIds,
    runnersAfter: Object.freeze(finalRunners),
    thirdOutResolution,
    error,
    outcome,
    consequence,
    primaryCause: error ? "catcherThrow" : reassessment ? "explicitReassessment" : "selectedCatcherIntent",
    secondaryCause: reassessment ? reassessment.reason : "",
    responsibleActor: "player",
    playerResponsibility: error ? "throwExecution" : "completedSelectedRoute",
    teammateResponsibility: "none",
    causeExplanation: reassessment ? reassessment.presentation : "實際執行與玩家選定的捕手路線一致。"
  });
}

function resolveLegacyHighSchoolDefensivePlay(match, decision, randomSource = Math.random) {
  const context = getHighSchoolBallContext(match);
  const timeWindow = getHighSchoolDefensiveTimeWindow(match);
  const batter = getHighSchoolMatchSimulationEntity(match, match.currentBatter);
  const forcedRunner = getHighSchoolMatchSimulationEntity(match, match.runners?.[0]);
  const batterSpeed = Number(batter?.speed) || 5;
  const runnerSpeed = Number(forcedRunner?.speed) || 5;
  const defense = getDefensiveSimulationCapability(player, match.position);
  const rawSample = typeof randomSource === "function" ? Number(randomSource()) : Number(randomSource);
  const sample = Number.isFinite(rawSample) ? Math.max(0, Math.min(0.999999, rawSample)) : 0.5;
  const chanceSwing = (sample - 0.5) * 4;
  const firstStage = (defense.fielding * 0.8) + (defense.reaction * 0.7) + (defense.decision * 0.15)
    + timeWindow.fieldingModifier + chanceSwing - (runnerSpeed * 0.35);
  const secondStage = (defense.arm * 0.75) + (defense.throwing * 0.65) + (defense.reaction * 0.15)
    + timeWindow.transferModifier + chanceSwing - (batterSpeed * 0.55);
  const force = getHighSchoolDefensiveForceState(match);
  const decisionQuality = decision === "challenge"
    ? force.first && match.outs < 2 ? "reasonableRisk" : "poorFit"
    : decision === "secure" ? "conservative" : "contextual";
  let resultCode = "zeroOuts";
  if (decision === "challenge") {
    if (firstStage >= 5.5 && secondStage >= 6) resultCode = "twoOuts";
    else if (firstStage >= 5.5) resultCode = "oneOut";
    else if (firstStage < 2.5) resultCode = "error";
  } else if (["secure", "lead", "home"].includes(decision)) {
    if (firstStage >= 5) resultCode = "oneOut";
    else if (firstStage < 2.5) resultCode = "error";
  } else if (decision === "contain") {
    const containScore = defense.decision + defense.reaction + chanceSwing - runnerSpeed;
    if (containScore >= 6) resultCode = "oneOut";
    else if (containScore < 0) resultCode = "error";
  }
  const tier = decision === "challenge"
    ? resultCode === "twoOuts" ? "strong" : resultCode === "oneOut" ? "mixed" : "failure"
    : resultCode === "oneOut" && firstStage >= 7.5 ? "strong" : resultCode === "oneOut" ? "mixed" : "failure";
  let primaryCause = "balancedExecution";
  let secondaryCause = "";
  if (resultCode === "twoOuts" || (decision !== "challenge" && resultCode === "oneOut" && tier === "strong")) {
    primaryCause = context.type === "hardGrounder" ? "hardGrounder" : defense.reaction >= defense.fielding ? "reaction" : "fielding";
  } else if (decisionQuality === "poorFit") {
    primaryCause = "decisionRisk";
  } else if (firstStage < 5.5) {
    primaryCause = runnerSpeed >= 7 ? "runnerSpeed" : defense.fielding <= defense.reaction ? "fielding" : "reaction";
    secondaryCause = context.type === "slowGrounder" ? "slowGrounder" : "";
  } else if (context.type === "slowGrounder") {
    primaryCause = "slowGrounder";
    secondaryCause = batterSpeed >= 7 ? "batterSpeed" : "transferWindow";
  } else if (context.type === "deepGrounder" && defense.arm <= 5) {
    primaryCause = "armStrength";
    secondaryCause = "deepGrounder";
  } else if (batterSpeed >= 7) {
    primaryCause = "batterSpeed";
    secondaryCause = context.type === "deepGrounder" ? "deepGrounder" : "transferWindow";
  } else if (defense.arm <= 4) {
    primaryCause = "armStrength";
  } else if (defense.throwing <= 4) {
    primaryCause = "throwing";
  } else if (context.type === "deepGrounder") {
    primaryCause = "deepGrounder";
  } else {
    primaryCause = "transferWindow";
  }
  const executionQuality = resultCode === "twoOuts" || (decision !== "challenge" && resultCode === "oneOut") ? "complete" : resultCode === "oneOut" ? "partial" : resultCode === "error" ? "misplay" : "late";
  const resolution = {
    resultCode, tier, decisionQuality, executionQuality, primaryCause, secondaryCause,
    causeExplanation: "", ballContext: context.type, batterSpeed, runnerSpeed,
    fielding: defense.fielding, reaction: defense.reaction, arm: defense.arm, throwing: defense.throwing,
    firstStage: Number(firstStage.toFixed(2)), secondStage: Number(secondStage.toFixed(2))
  };
  resolution.causeExplanation = getHighSchoolDefensiveCauseExplanation(resolution);
  return Object.freeze(resolution);
}

function resolveHighSchoolDefensivePlay(match, decision, randomSource = Math.random) {
  if (match?.positionDecisionFamily === "infield" && match.defensiveSituation?.familyId === "infield") {
    return infieldDecisionFamily.resolve(match.defensiveSituation, decision, match, randomSource);
  }
  if (match?.position === "捕手") return resolveHighSchoolCatcherDecision(match, decision, randomSource);
  return resolveLegacyHighSchoolDefensivePlay(match, decision, randomSource);
}

function getInfieldRoutineExecutionRoute(situation) {
  if (situation?.responsibility?.playerRole === "coverPivot") return "coverSecondFor643";
  if (situation?.playerPosition !== "一壘手") return "throwFirst";
  const canSelfCover = situation.ballDirection === "straightAtPlayer"
    && situation.ballDepth !== "deep"
    && situation.ballContext?.type !== "slowGrounder";
  return canSelfCover ? "selfCoverFirst" : "pitcherCoverFirst";
}

function resolveRoutineDefensivePlay(match, situation = match?.defensiveSituation, randomSource = null, options = {}) {
  if (!match || situation?.familyId !== "infield") return null;
  const legalChoices = infieldDecisionFamily.generateLegalChoices(situation, match);
  const classification = classifyPositionFamilyPlay(situation, legalChoices, true);
  if (classification.eventClassification !== "playerRoutinePlay" && options.densitySuppressed !== true) return null;
  const source = randomSource === null ? () => nextHighSchoolMatchSimulationRandom(match) : randomSource;
  const routineChoice = legalChoices.find(choice => choice.routeId === "coverSecondFor643") || legalChoices.find(choice => choice.matchDecision === "secure") || legalChoices[0];
  const resolution = routineChoice ? infieldDecisionFamily.resolve(situation, routineChoice.matchDecision, match, source) : null;
  if (!resolution) return null;
  return Object.freeze({
    ...resolution,
    eventClassification: classification.eventClassification,
    decisionTension: classification.decisionTension,
    executionRoute: getInfieldRoutineExecutionRoute(situation)
  });
}

function getHighSchoolYearOneOutcomeTier(score, randomSource = Math.random) {
  const rawSample = typeof randomSource === "function" ? Number(randomSource()) : Number(randomSource);
  const sample = Number.isFinite(rawSample) ? Math.max(0, Math.min(0.999999, rawSample)) : 0.5;
  const evaluated = score + Math.round((sample - 0.5) * 16);
  return evaluated >= 26 ? "strong" : evaluated >= 14 ? "mixed" : "failure";
}

function recordHighSchoolYearOneMoment(match, decision, tier, outcome, consequence, situationAfter, eventFacts = {}) {
  const momentId = match.currentMomentId;
  match.playerContribution[tier] += 1;
  match.decision = decision;
  match.outcomeTier = tier;
  match.outcome = outcome;
  match.consequence = consequence;
  match.previousMomentDecision = decision;
  match.previousMomentOutcome = outcome;
  match.completedMoments.push({
    id: momentId,
    domain: match.currentDomain,
    decision,
    tier,
    outcome,
    consequence,
    inning: situationAfter.inning,
    half: situationAfter.half,
    outs: situationAfter.outs,
    scores: { ...situationAfter.scores },
    runners: situationAfter.runners.slice()
  });
  recordHighSchoolMatchSimulationEvent(match, {
    type: "meaningfulMomentResolved",
    eventClassification: "playerMeaningfulDecision",
    inning: situationAfter.inning,
    half: situationAfter.half,
    domain: match.currentDomain,
    decision,
    tier,
    outcome,
    outs: situationAfter.outs,
    scores: situationAfter.scores,
    runners: situationAfter.runners,
    runnerChanges: Array.isArray(eventFacts.runnerChanges) ? eventFacts.runnerChanges.map(change => ({ ...change })) : [],
    scoringRunnerIds: Array.isArray(eventFacts.scoringRunnerIds) ? eventFacts.scoringRunnerIds.slice() : [],
    thirdOutResolution: eventFacts.thirdOutResolution || null,
    resultCode: eventFacts.resultCode || "",
    error: Boolean(eventFacts.error)
  });
}

function getHighSchoolOffensivePlateApproachAbilities(subject = player) {
  const offense = getOffensiveSimulationCapability(subject);
  return Object.freeze({
    observe: Number(subject?.observe) || 0,
    ballSense: Number(subject?.ballSense) || 0,
    baseballIQ: Number(subject?.baseballSkills?.baseballIQ) || 0,
    batting: Number(subject?.baseballSkills?.batting) || Number(subject?.batting) || 0,
    power: Number(offense?.power) || 0,
    bats: subject?.bats || "R"
  });
}

function ensureHighSchoolPitcherRuntimeState(match) {
  if (!match || typeof PitchSequencing === "undefined") return null;
  const fallback = {
    runtimeId: `${match.id || "match"}|opponent-pitcher`,
    responseProfile: PitcherMentalState.RESPONSE_PROFILE_FIXTURES.simplifyReset,
    mentalState: { arousal: 50, confidence: 50, cognitiveLoad: 40, resultAttachment: 35 },
    control: 8
  };
  match.pitcherRuntimeState = PitchSequencing.normalizePitcherRuntimeState(match.pitcherRuntimeState, fallback);
  if (!Array.isArray(match.pitcherSequencingDebugTrace)) match.pitcherSequencingDebugTrace = [];
  return match.pitcherRuntimeState;
}

function ensureHighSchoolBatterAnticipationState(match) {
  if (!match || typeof PitchSequencing === "undefined" || typeof BatterAnticipation === "undefined") return null;
  const paIdentity = createHighSchoolOffensivePlateAppearanceIdentity(match, { matchMomentId: getHighSchoolYearOneMomentId(match) });
  if (match.batterAnticipationState?.identity === paIdentity && match.prePitchPlanningState?.paIdentity === paIdentity) {
    return match.batterAnticipationState;
  }
  const pitcherRuntime = ensureHighSchoolPitcherRuntimeState(match);
  const context = analyzeHighSchoolOffensiveDecisionContext(match);
  const strategicPlan = PitchSequencing.buildStrategicPitchDistribution({
    balls: 0,
    strikes: 0,
    recentPitchClasses: pitcherRuntime.recentPitchClasses,
    previousPAResult: pitcherRuntime.previousPAResult,
    scoringPosition: context.scoringPosition,
    highLeverage: match.inning >= 6 && Math.abs(context.scoreDifference) <= 2
  }, pitcherRuntime.processState);
  const frozenDistribution = PitchSequencing.freezePitchDistribution(strategicPlan);
  const observableEvidence = PitchSequencing.buildObservablePitcherEvidence({ observableHistory: match.pitcherObservableHistory });
  const publicContext = BatterAnticipation.createPublicContext({
    balls: 0,
    strikes: 0,
    outs: context.outs,
    runners: context.runners.map(Boolean),
    scoreDifference: context.scoreDifference,
    inning: match.inning,
    highLeverage: match.inning >= 6 && Math.abs(context.scoreDifference) <= 2,
    previousPitchResult: observableEvidence.previousPitchResult,
    previousPAResult: pitcherRuntime.previousPAResult
  });
  const anticipation = BatterAnticipation.prepareBatterAnticipation({
    identity: paIdentity,
    publicContext,
    observableEvidence,
    batterCapabilities: getHighSchoolOffensivePlateApproachAbilities(player)
  });
  const debugEvaluation = BatterAnticipation.evaluateAnticipationDebug(anticipation, frozenDistribution.finalFrozenDistribution);
  match.prePitchPlanningState = {
    paIdentity,
    frozenDistribution: JSON.parse(JSON.stringify(frozenDistribution))
  };
  match.batterAnticipationState = {
    ...JSON.parse(JSON.stringify(anticipation)),
    chosenApproach: "",
    readiness: null,
    prePitchReadiness: null,
    debug: {
      ...JSON.parse(JSON.stringify(debugEvaluation)),
      frozenTrueDistribution: JSON.parse(JSON.stringify(frozenDistribution.finalFrozenDistribution))
    },
    debugTrace: {
      publicContext: JSON.parse(JSON.stringify(anticipation.publicContext)),
      observableEvidenceRaw: JSON.parse(JSON.stringify(anticipation.observableEvidenceRaw)),
      observationResult: JSON.parse(JSON.stringify(anticipation.observationResult)),
      interpretationResult: JSON.parse(JSON.stringify(anticipation.interpretationResult)),
      subjectivePitchDistribution: JSON.parse(JSON.stringify(anticipation.subjectivePitchDistribution)),
      anticipationConfidence: anticipation.anticipationConfidence,
      directionAccuracy: debugEvaluation.directionAccuracy,
      confidenceCalibration: debugEvaluation.confidenceCalibration,
      chosenApproach: "",
      prePitchReadiness: null,
      frozenTrueDistribution: JSON.parse(JSON.stringify(frozenDistribution.finalFrozenDistribution))
    }
  };
  return match.batterAnticipationState;
}

function deriveHighSchoolPitcherMentalStimulus(result, runtimeState) {
  if (result === "walk") return runtimeState?.previousPAResult === "walk" ? "consecutiveWalk" : "walk";
  if (result === "single") return "hit";
  if (["double", "triple", "homeRun"].includes(result)) return "extraBaseHit";
  if (result === "strikeout") return "strikeout";
  return "";
}

function settleHighSchoolPitcherRuntimeAfterPlateAppearance(match, plateAppearanceState) {
  if (!match || !plateAppearanceState?.completed || typeof PitchSequencing === "undefined") return null;
  const current = ensureHighSchoolPitcherRuntimeState(match);
  const recentPitchClasses = (plateAppearanceState.pitchHistory || [])
    .map(item => item.pitch?.pitchLocationClass)
    .filter(item => PitchSequencing.PITCH_CLASSES.includes(item))
    .slice(-6);
  const traces = (plateAppearanceState.pitchHistory || [])
    .map(item => item.pitch?.pitcherSequencingTrace)
    .filter(Boolean);
  match.pitcherSequencingDebugTrace = [...match.pitcherSequencingDebugTrace, ...JSON.parse(JSON.stringify(traces))].slice(-40);
  if (!Array.isArray(match.pitcherObservableHistory)) match.pitcherObservableHistory = [];
  const observableRecords = (plateAppearanceState.pitchHistory || []).map(item => PitchSequencing.createObservablePitchRecord({
    pitch: item.pitch,
    pitchResult: item.pitchResult,
    ballsAfter: item.countAfter?.balls,
    strikesAfter: item.countAfter?.strikes
  }));
  match.pitcherObservableHistory = [...match.pitcherObservableHistory, ...JSON.parse(JSON.stringify(observableRecords))].slice(-16);
  const stimulus = deriveHighSchoolPitcherMentalStimulus(plateAppearanceState.result, current);
  match.pitcherRuntimeState = stimulus
    ? PitchSequencing.advancePitcherRuntimeState(current, stimulus, {
      paResult: plateAppearanceState.result,
      recentPitchClasses,
      highLeverage: Boolean(plateAppearanceState.context?.highLeverage),
      twoStrikeCount: Number(plateAppearanceState.strikes) >= 2
    })
    : PitchSequencing.createPitcherRuntimeState({ ...JSON.parse(JSON.stringify(current)), previousPAResult: plateAppearanceState.result, recentPitchClasses });
  return match.pitcherRuntimeState;
}

function createHighSchoolOffensivePlateAppearanceIdentity(match, choice) {
  return OffensivePlateApproach.createPlateAppearanceIdentity({
    matchId: match?.id,
    paId: choice?.matchMomentId || getHighSchoolYearOneMomentId(match),
    batterId: "player",
    inning: match?.inning,
    half: match?.half
  });
}

function ensureHighSchoolOffensivePlateAppearanceState(match, choice) {
  const paIdentity = createHighSchoolOffensivePlateAppearanceIdentity(match, choice);
  const existing = OffensivePlateApproach.normalizePlateAppearanceState(match?.offensivePlateAppearanceState);
  if (existing?.paIdentity === paIdentity && existing.approach === choice.approach) return existing;
  const context = analyzeHighSchoolOffensiveDecisionContext(match);
  const pitcherRuntime = ensureHighSchoolPitcherRuntimeState(match);
  const anticipation = ensureHighSchoolBatterAnticipationState(match);
  const readiness = typeof BatterAnticipation !== "undefined" && anticipation
    ? BatterAnticipation.derivePrePitchReadiness(anticipation, choice.approach) : null;
  if (anticipation) {
    match.batterAnticipationState = {
      ...JSON.parse(JSON.stringify(anticipation)),
      chosenApproach: choice.approach,
      readiness: readiness ? JSON.parse(JSON.stringify(readiness)) : null,
      prePitchReadiness: readiness ? JSON.parse(JSON.stringify(readiness)) : null,
      debugTrace: anticipation.debugTrace ? {
        ...JSON.parse(JSON.stringify(anticipation.debugTrace)),
        chosenApproach: choice.approach,
        prePitchReadiness: readiness ? JSON.parse(JSON.stringify(readiness)) : null
      } : null
    };
  }
  const state = OffensivePlateApproach.createPlateAppearanceState({
    paIdentity,
    batterId: "player",
    approach: choice.approach,
    pitcherRuntime,
    batterAnticipation: match.batterAnticipationState,
    prePitchFrozenDistribution: match.prePitchPlanningState?.paIdentity === paIdentity
      ? match.prePitchPlanningState.frozenDistribution : null,
    context: {
      inning: match.inning,
      half: match.half,
      outs: match.outs,
      hasRunner: context.hasRunner,
      scoringPosition: context.scoringPosition,
      highLeverage: context.lateGame && Math.abs(context.scoreDiff) <= 2,
      runners: match.runners.slice(),
      scores: { ...match.scores }
    }
  });
  match.offensivePlateAppearanceState = JSON.parse(JSON.stringify(state));
  if (match.pendingOffensiveOpportunity?.status === "pending") {
    match.pendingOffensiveOpportunity.paIdentity = state.paIdentity;
    match.pendingOffensiveOpportunity.selectedApproach = choice.approach;
    match.pendingOffensiveOpportunity.selectionProfile = choice.selectionProfile;
    match.pendingOffensiveOpportunity.swingIntent = choice.swingIntent;
  }
  return state;
}

function resolveHighSchoolOffensivePlateAppearance(match, choice, options = {}) {
  const current = ensureHighSchoolOffensivePlateAppearanceState(match, choice);
  if (current.resultApplied) return false;
  const state = current.completed ? current : OffensivePlateApproach.simulatePlateAppearance({
    state: current,
    abilities: getHighSchoolOffensivePlateApproachAbilities(player),
    pitchSequence: options.pitchSequence,
    pitchOptions: options.pitchOptions
  });
  match.offensivePlateAppearanceState = JSON.parse(JSON.stringify(state));
  return state;
}

function formatHighSchoolOffensivePitchSequence(state) {
  const history = Array.isArray(state?.pitchHistory) ? state.pitchHistory : [];
  const takes = history.filter(item => item.action === "take");
  const swings = history.filter(item => item.action === "swing");
  const protected = history.filter(item => item.protectAdjusted);
  if (state?.result === "walk") return `你連續放掉 ${takes.length} 顆沒有進入攻擊區的球，球數累積到四壞後取得保送。`;
  if (state?.result === "strikeout" && state.selectionProfile === "selective") {
    const last = history.at(-1);
    return last?.pitchResult === "calledStrike"
      ? "你把攻擊區收得太窄，兩好球後仍放掉邊角好球，主審判定第三好球。"
      : "你辨認到必須保護的球，但最後一次揮棒沒有完成接觸。";
  }
  if (["single", "double", "triple", "homeRun"].includes(state?.result) && state.selectionProfile === "selective") {
    return "你先放掉不在攻擊區內的球，直到投手把球留進真正可攻擊的位置才出棒。";
  }
  if (state?.swingIntent === "contact" && protected.length) return `兩好球後你縮短揮棒，透過 ${Math.max(1, state.swingExecutionSummary?.fouls || 0)} 次界外接觸延長打席。`;
  if (state?.selectionProfile === "aggressive" && swings.length) return "你提早準備攻擊，對進入攻擊區的球立即出棒。";
  return `這個打席經過 ${history.length} 球，最後由球數與實際接觸共同決定結果。`;
}

function createHighSchoolOffensiveExplainabilityModel(resolvedMoment) {
  if (typeof BatterAnticipation === "undefined" || !resolvedMoment?.batterAnticipation) return null;
  const pitchHistory = Array.isArray(resolvedMoment.pitchHistory) ? resolvedMoment.pitchHistory : [];
  const openingPitch = pitchHistory[0] || null;
  const finalPitch = pitchHistory.at(-1) || null;
  return BatterAnticipation.createPostPAExplainability({
    anticipation: resolvedMoment.batterAnticipation,
    openingPitchEvent: openingPitch,
    finalPitchEvent: finalPitch,
    singlePitch: pitchHistory.length === 1,
    outcomeText: resolvedMoment.outcome
  });
}

function renderHighSchoolOffensiveExplainability(model) {
  if (!model) return "";
  const actualPitchLabel = model.singlePitch ? "實際來球" : "實際第一球";
  const recognitionLabel = model.singlePitch ? "你的辨認" : "第一球辨認";
  const executionLabel = model.singlePitch ? "你的處理" : "最後一次處理";
  return `<section class="offensive-explainability" aria-labelledby="offensiveExplainabilityTitle">
    <small id="offensiveExplainabilityTitle">這個打席怎麼發生</small>
    <div><strong>你的預判</strong><p>${escapeHtml(model.anticipationText)} 判斷把握：${escapeHtml(model.confidenceText)}。</p></div>
    <div><strong>${actualPitchLabel}</strong><p>${escapeHtml(model.actualPitchText)}</p></div>
    <div><strong>${recognitionLabel}</strong><p>${escapeHtml(model.recognitionText)}</p></div>
    <div class="choice-outcome-execution"><strong>${executionLabel}</strong><p>${escapeHtml(model.executionText)}</p></div>
    <div><strong>因果整理</strong><p>${escapeHtml(model.causalityText)}</p></div>
    <div><strong>最後結果</strong><p>${escapeHtml(model.outcomeText)}</p></div>
  </section>`;
}

function formatHighSchoolOffensiveExecutionText(choice, state) {
  const history = Array.isArray(state?.pitchHistory) ? state.pitchHistory : [];
  const finalPitch = history.at(-1) || null;
  const swings = Number(state?.swingExecutionSummary?.swings) || 0;
  const takes = Number(state?.swingExecutionSummary?.takes) || 0;
  const fouls = Number(state?.swingExecutionSummary?.fouls) || 0;
  const correctOutsideTakes = history.filter(item => item.action === "take" && item.pitch?.strike === false && item.recognition?.correct).length;
  if (choice?.approach === "aggressiveEarlySwing" && finalPitch?.action === "swing"
    && ["chasePitch", "clearBall"].includes(finalPitch?.pitch?.pitchLocationClass)
    && ["hitterPitch", "competitiveStrike"].includes(finalPitch?.recognition?.perceivedPitchClass)) {
    return "你原本準備搶第一顆可攻擊球，但把這顆離開攻擊區的球判成了可攻擊球。";
  }
  if (choice?.selectionProfile === "selective" && finalPitch?.action === "take"
    && finalPitch?.recognition?.correct && finalPitch?.recognition?.perceivedPitchClass === "edgeStrike") {
    return "你看出球壓在邊緣，但這不是你設定要積極攻擊的位置。";
  }
  if (state?.result === "walk" && swings === 0 && takes > 0 && correctOutsideTakes === takes) {
    return "你收窄攻擊區，連續放掉沒有進入攻擊區的球。";
  }
  if (state?.result === "strikeout" && finalPitch?.pitchResult === "calledStrike") {
    return "兩好球後你仍放掉邊角好球，主審判定第三好球。";
  }
  if (state?.result === "strikeout" && finalPitch?.pitchResult === "swingingStrike") {
    return "你判斷最後一球可以攻擊並出棒，但沒有碰到球。";
  }
  if (choice?.swingIntent === "contact" && fouls > 0) {
    return `兩好球後你縮短揮棒，以 ${fouls} 次界外接觸延長打席，再完成最後一次處理。`;
  }
  if (choice?.approach === "aggressiveEarlySwing" && history.length === 1 && finalPitch?.action === "swing") {
    return "你提早準備攻擊，第一顆可打球進來就出棒。";
  }
  if (choice?.selectionProfile === "selective" && (Number(state?.recognitionSummary?.hitterPitchRecognized) || 0) > 0 && swings > 0) {
    return "你先守住攻擊區，等球真正進入可攻擊位置後才出棒。";
  }
  return formatHighSchoolOffensivePitchSequence(state);
}

function formatHighSchoolOffensiveCoachFeedback(choice, state) {
  const history = Array.isArray(state?.pitchHistory) ? state.pitchHistory : [];
  const finalPitch = history.at(-1) || null;
  const summary = state?.swingExecutionSummary || {};
  const recognition = state?.recognitionSummary || {};
  const swings = Number(summary.swings) || 0;
  const takes = Number(summary.takes) || 0;
  const contacts = (Number(summary.fouls) || 0) + (Number(summary.ballsInPlay) || 0);
  const correctOutsideTakes = history.filter(item => item.action === "take" && item.pitch?.strike === false && item.recognition?.correct).length;
  const chasedPitch = history.some(item => item.action === "swing" && ["chasePitch", "clearBall"].includes(item.pitch?.pitchLocationClass));
  const isHit = ["single", "double", "triple", "homeRun"].includes(state?.result);
  const decisionWasSound = ["strong", "acceptable"].includes(state?.decisionQuality);

  if (state?.result === "walk" && swings === 0 && takes > 0 && correctOutsideTakes === takes) {
    return "現任教練記下這次進攻：攻擊區守得很清楚，沒有被壞球帶走。";
  }
  if (state?.result === "strikeout" && finalPitch?.pitchResult === "calledStrike") {
    return "現任教練記下這次進攻：兩好球後的保護範圍還需要調整。";
  }
  if (state?.result === "strikeout" && finalPitch?.pitchResult === "swingingStrike") {
    return decisionWasSound
      ? "現任教練記下這次進攻：判斷方向合理，但最後一次揮棒沒有跟上。"
      : "現任教練記下這次進攻：最後一次出棒沒有形成接觸，攻擊球選擇仍要持續確認。";
  }
  if (isHit && chasedPitch && (Number(recognition.misread) || 0) > 0) {
    return "現任教練記下這次進攻：結果雖然上壘，但這顆球不是理想的攻擊選擇。";
  }
  if (["out", "productiveOut"].includes(state?.result) && decisionWasSound && contacts > 0) {
    return "現任教練記下這次進攻：攻擊選擇合理，但擊球結果沒有形成安打。";
  }
  if (isHit && choice?.approach === "aggressiveEarlySwing" && history.length === 1
    && finalPitch?.action === "swing" && ["hitterPitch", "competitiveStrike"].includes(finalPitch.pitch?.pitchLocationClass)) {
    return "現任教練記下這次進攻：你提早準備，抓住第一顆可攻擊球。";
  }
  if (choice?.swingIntent === "contact" && contacts > 0) {
    return (Number(summary.fouls) || 0) > 0
      ? "現任教練記下這次進攻：縮短揮棒與界外接觸延長了打席。"
      : "現任教練記下這次進攻：你依照接觸意圖縮短揮棒並把球打進場內。";
  }
  if (isHit && choice?.selectionProfile === "selective" && (Number(recognition.hitterPitchRecognized) || 0) > 0) {
    return "現任教練記下這次進攻：你耐心等到可攻擊球，並把握住出棒機會。";
  }
  return "教練記下這次進攻打席的選擇與結果，後續仍會持續觀察。";
}

function formatHighSchoolOffensivePitchFeed(history = []) {
  const resultLabels = { ball: "壞球", calledStrike: "主審判好球", swingingStrike: "揮棒落空", foul: "界外球", ballInPlay: "球進入場內" };
  return (Array.isArray(history) ? history : []).map(item => {
    const before = `${Number(item.countBefore?.balls) || 0}-${Number(item.countBefore?.strikes) || 0}`;
    const after = `${Number(item.countAfter?.balls) || 0}-${Number(item.countAfter?.strikes) || 0}`;
    const adjustment = item.protectAdjusted ? "兩好球保護區擴大；" : "";
    const action = item.action === "swing" ? "出棒" : "放掉";
    return `第 ${item.pitchNumber} 球（${before}）：${item.pitch?.impression || "投手完成投球"}；${adjustment}${action}，${resultLabels[item.pitchResult] || item.pitchResult}，球數 ${after}。`;
  });
}

function deriveHighSchoolOffensiveBaseballMeaning({ before = {}, after = {}, paResult = "", runnerChanges = [], scoringRunnerIds = [] } = {}) {
  const normalizedChanges = Array.isArray(runnerChanges) ? runnerChanges : [];
  const existingRunnerChanges = normalizedChanges.filter(change => change.from !== "batter");
  const batterChange = normalizedChanges.find(change => change.from === "batter") || null;
  const runnersHeld = existingRunnerChanges.filter(change => Number(change.from) === Number(change.to));
  const runnersAdvanced = existingRunnerChanges.filter(change => Number.isFinite(Number(change.to)) && Number(change.to) > Number(change.from));
  const scoredIds = new Set(Array.isArray(scoringRunnerIds) ? scoringRunnerIds : []);
  const runnersScored = normalizedChanges.filter(change => change.to === "home" || scoredIds.has(change.runnerId));
  const batterOut = batterChange?.to === "out" || (["out", "productiveOut", "strikeout"].includes(paResult) && batterChange?.to !== "home");
  const halfInningEnded = Number(after.outs) >= 3;
  return Object.freeze({
    batterOut,
    batterSafe: Boolean(batterChange && !["out", "home"].includes(batterChange.to)),
    runnersHeld: Object.freeze(runnersHeld.map(change => Object.freeze({ ...change }))),
    runnersAdvanced: Object.freeze(runnersAdvanced.map(change => Object.freeze({ ...change }))),
    runnersScored: Object.freeze(runnersScored.map(change => Object.freeze({ ...change }))),
    basesEmptyBefore: !(before.runners || []).some(Boolean),
    basesEmptyAfter: !(after.runners || []).some(Boolean),
    halfInningEnded,
    outsAdded: Math.max(0, (Number(after.outs) || 0) - (Number(before.outs) || 0)),
    runsScored: Math.max(0,
      (Number(after.scores?.home) || 0) + (Number(after.scores?.away) || 0)
      - (Number(before.scores?.home) || 0) - (Number(before.scores?.away) || 0)
    )
  });
}

function formatHighSchoolOffensivePlayerFacingResult(choice, result, meaning, plateAppearanceState = null) {
  const finalPitch = Array.isArray(plateAppearanceState?.pitchHistory) ? plateAppearanceState.pitchHistory.at(-1) : null;
  const labels = {
    single: "這個打席形成一壘安打",
    double: "這個打席形成二壘安打",
    triple: "這個打席形成三壘安打",
    homeRun: "這個打席形成全壘打",
    walk: "球數走到四壞，你取得四壞保送",
    strikeout: finalPitch?.pitchResult === "calledStrike"
      ? "你選擇放掉這顆球，但主審判定第三好球，三振出局"
      : "你出棒但揮擊落空，第三個好球形成三振",
    out: "這個打席形成打者出局",
    productiveOut: "這個打席形成具推進效果的打者出局"
  };
  let outcome = labels[result] || "這個打席依實際擊球結果結束";
  if (plateAppearanceState?.battedBallPhysicalTruth && typeof BattedBallPhysical !== "undefined") {
    outcome = `${BattedBallPhysical.formatBattedBallPhysicalTruth(plateAppearanceState.battedBallPhysicalTruth, { bats: player.bats })} ${outcome}`;
  }
  const baseLabels = { 1: "一壘", 2: "二壘", 3: "三壘" };
  const clauses = [];
  meaning.runnersScored.forEach(change => clauses.push(change.from === "batter"
    ? "打者回到本壘得分"
    : `${baseLabels[change.from] || "壘上"}跑者回到本壘得分`));
  if (!meaning.halfInningEnded) {
    meaning.runnersAdvanced.forEach(change => clauses.push(`${baseLabels[change.from] || "壘上"}跑者推進到${baseLabels[change.to] || "下一個壘包"}`));
    meaning.runnersHeld.forEach(change => clauses.push(`${baseLabels[change.from] || "壘上"}跑者留在原壘`));
  }
  if (meaning.batterSafe) clauses.unshift("你安全上壘");
  if (meaning.batterOut) clauses.unshift("打者出局");
  if (meaning.halfInningEnded) clauses.push("形成第三個出局，半局結束");
  else if (meaning.batterOut && meaning.basesEmptyAfter && clauses.length === 1) clauses.push("壘上無人");
  const consequence = clauses.length ? `${clauses.join("；")}。` : "壘況與出局數依這次打席的實際結果更新。";
  return Object.freeze({ outcome, consequence });
}

function didHighSchoolOffensiveObjectiveSucceed(choice, result, meaning) {
  const objectiveSucceeded = choice.objective === "createExtraBaseHit" ? ["double", "triple", "homeRun"].includes(result)
    : choice.objective === "reachBase" ? meaning.batterSafe
      : choice.objective === "putBallInPlay" ? ["productiveOut", "single", "double", "triple", "homeRun"].includes(result)
        : choice.objective === "advanceRunner" ? meaning.runnersAdvanced.length > 0 || meaning.runnersScored.length > 0
          : choice.objective === "scoreRunner" ? meaning.runnersScored.length > 0
            : false;
  return Boolean(objectiveSucceeded);
}

function resolveHighSchoolOffensiveDecision(match, choice, tier, options = {}) {
  if (!choice || choice.matchMomentId !== getHighSchoolYearOneMomentId(match) || !isOffensiveDecisionChoiceLegal(choice, match)) return false;
  const plateAppearanceState = resolveHighSchoolOffensivePlateAppearance(match, choice, options.plateAppearance || {});
  if (!plateAppearanceState?.completed || !plateAppearanceState.result || plateAppearanceState.resultApplied) return false;
  const result = plateAppearanceState.result;
  settleHighSchoolPitcherRuntimeAfterPlateAppearance(match, plateAppearanceState);
  const resolvedTier = plateAppearanceState.executionQuality === "strong" ? "strong"
    : plateAppearanceState.executionQuality === "weak" ? "failure" : "mixed";
  const situationBefore = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const scoresBefore = { ...match.scores };
  const runnerFacts = applyHighSchoolSimulatedPlateAppearance(match, result, "player", "home");
  advanceHighSchoolMatchBattingOrder(match, "home");
  match.playerContribution.runsCreated += match.scores.home - scoresBefore.home;
  if (["single", "double", "triple", "homeRun"].includes(result)) match.playerContribution.hits += 1;
  if (result === "walk") match.playerContribution.walks += 1;
  const situationAfter = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const baseballMeaning = deriveHighSchoolOffensiveBaseballMeaning({
    before: situationBefore,
    after: situationAfter,
    paResult: result,
    runnerChanges: runnerFacts.runnerChanges,
    scoringRunnerIds: runnerFacts.scoringRunnerIds
  });
  const playerFacingResult = formatHighSchoolOffensivePlayerFacingResult(choice, result, baseballMeaning, plateAppearanceState);
  const executionText = formatHighSchoolOffensiveExecutionText(choice, plateAppearanceState);
  const coachFeedback = formatHighSchoolOffensiveCoachFeedback(choice, plateAppearanceState);
  const objectiveSucceeded = didHighSchoolOffensiveObjectiveSucceed(choice, result, baseballMeaning);
  const plateAppearanceEvent = recordHighSchoolMeaningfulPlateAppearance(match, "player", result, situationBefore, situationAfter, match.scores.home - scoresBefore.home, runnerFacts);
  Object.assign(plateAppearanceEvent, {
    objective: choice.objective,
    approach: choice.approach,
    selectionProfile: choice.selectionProfile,
    swingIntent: choice.swingIntent,
    route: choice.route,
    riskProfile: choice.riskProfile,
    objectiveSucceeded,
    decisionQuality: plateAppearanceState.decisionQuality,
    executionQuality: plateAppearanceState.executionQuality,
    recognitionSummary: JSON.parse(JSON.stringify(plateAppearanceState.recognitionSummary)),
    swingExecutionSummary: JSON.parse(JSON.stringify(plateAppearanceState.swingExecutionSummary)),
    pitchCount: plateAppearanceState.pitchNumber,
    battedBallPhysicalTruth: plateAppearanceState.battedBallPhysicalTruth ? JSON.parse(JSON.stringify(plateAppearanceState.battedBallPhysicalTruth)) : null,
    physicalOutcomeFlow: plateAppearanceState.battedBallPhysicalTruth ? "physicalTruthToLegacyDownstreamOutcome" : "notBallInPlay",
    coachFeedback,
    primaryCause: result === "walk" ? "countAccumulation" : result === "strikeout" ? "strikeAccumulation" : "contactExecution",
    secondaryCause: "",
    responsibleActor: "player"
  });
  recordHighSchoolYearOneMoment(match, choice.matchDecision, resolvedTier, playerFacingResult.outcome, playerFacingResult.consequence, situationAfter, {
    runnerChanges: runnerFacts.runnerChanges,
    scoringRunnerIds: runnerFacts.scoringRunnerIds,
    thirdOutResolution: runnerFacts.thirdOutResolution,
    resultCode: result
  });
  const completedMoment = match.completedMoments.at(-1);
  Object.assign(completedMoment, {
    objective: choice.objective,
    approach: choice.approach,
    selectionProfile: choice.selectionProfile,
    swingIntent: choice.swingIntent,
    action: choice.action,
    route: choice.route,
    riskProfile: choice.riskProfile,
    requirements: choice.requirements.slice(),
    executionOnly: choice.executionOnly,
    resultCode: result,
    objectiveSucceeded,
    runnerChanges: runnerFacts.runnerChanges.map(change => ({ ...change })),
    scoringRunnerIds: runnerFacts.scoringRunnerIds.slice(),
    baseballMeaning,
    decisionQuality: plateAppearanceState.decisionQuality,
    executionQuality: plateAppearanceState.executionQuality,
    recognitionSummary: JSON.parse(JSON.stringify(plateAppearanceState.recognitionSummary)),
    swingExecutionSummary: JSON.parse(JSON.stringify(plateAppearanceState.swingExecutionSummary)),
    pitchCount: plateAppearanceState.pitchNumber,
    pitchHistory: JSON.parse(JSON.stringify(plateAppearanceState.pitchHistory)),
    battedBallPhysicalTruth: plateAppearanceState.battedBallPhysicalTruth ? JSON.parse(JSON.stringify(plateAppearanceState.battedBallPhysicalTruth)) : null,
    batterAnticipation: plateAppearanceState.batterAnticipation ? JSON.parse(JSON.stringify(plateAppearanceState.batterAnticipation)) : null,
    executionText,
    coachFeedback,
    primaryCause: result === "walk" ? "countAccumulation" : result === "strikeout" ? "strikeAccumulation" : "contactExecution",
    secondaryCause: "",
    responsibleActor: "player"
  });
  match.lastOffensiveResolution = {
    objective: choice.objective,
    approach: choice.approach,
    selectionProfile: choice.selectionProfile,
    swingIntent: choice.swingIntent,
    route: choice.route,
    resultCode: result,
    objectiveSucceeded,
    baseballMeaning,
    before: situationBefore,
    after: situationAfter,
    balls: plateAppearanceState.balls,
    strikes: plateAppearanceState.strikes,
    pitchNumber: plateAppearanceState.pitchNumber,
    pitchHistory: JSON.parse(JSON.stringify(plateAppearanceState.pitchHistory)),
    battedBallPhysicalTruth: plateAppearanceState.battedBallPhysicalTruth ? JSON.parse(JSON.stringify(plateAppearanceState.battedBallPhysicalTruth)) : null,
    physicalOutcomeFlow: plateAppearanceState.battedBallPhysicalTruth ? "physicalTruthToLegacyDownstreamOutcome" : "notBallInPlay",
    batterAnticipation: plateAppearanceState.batterAnticipation ? JSON.parse(JSON.stringify(plateAppearanceState.batterAnticipation)) : null,
    recognitionSummary: JSON.parse(JSON.stringify(plateAppearanceState.recognitionSummary)),
    swingExecutionSummary: JSON.parse(JSON.stringify(plateAppearanceState.swingExecutionSummary)),
    decisionQuality: plateAppearanceState.decisionQuality,
    executionQuality: plateAppearanceState.executionQuality,
    coachFeedback
  };
  match.offensivePlateAppearanceState = JSON.parse(JSON.stringify(OffensivePlateApproach.markResultApplied(plateAppearanceState)));
  if (match.pendingOffensiveOpportunity) {
    match.pendingOffensiveOpportunity.status = "resolved";
    match.pendingOffensiveOpportunity.result = result;
    match.pendingOffensiveOpportunity.resultApplied = true;
  }
  if (match.offensivePlayerAgencyState?.selection === "manual"
    && match.offensivePlayerAgencyState.canonicalPAIdentity === plateAppearanceState.paIdentity) {
    match.offensivePlayerAgencyState.status = "resolved";
    match.offensivePlayerAgencyState.result = result;
    match.offensivePlayerAgencyState.resultApplied = true;
    const traceAgency = [...(match.opportunityDebugTrace?.opportunities || [])].reverse().find(item => item.agencyOpportunityCandidate
      && item.playerPANumber === match.offensivePlayerAgencyState.playerPANumber && item.agencySelection === "manual");
    if (traceAgency) {
      traceAgency.agencyResolved = true;
      traceAgency.result = result;
    }
  }
  assertHighSchoolMatchStateIntegrity(match, options.integrityLabel || "player-offense-decision");
  match.simulationPhase = options.resolvedPhase || "moment_1_resolved";
  match.currentAssignment = options.assignment || "等待隊友完成這個半局。";
  match.coachReaction = coachFeedback;
  match.teamReaction = match.playerRunnerLocation >= 0 ? "你留在壘上，後續棒次開始接手。" : "後續棒次走進打擊區，比賽沒有因你的結果停止。";
  return completedMoment;
}

function advanceHighSchoolYearOneAfterMomentOne(match, decisionOrChoice, tier) {
  const choice = typeof decisionOrChoice === "object" ? decisionOrChoice
    : buildOffensiveDecisionChoices(match).find(item => item.matchDecision === decisionOrChoice);
  return resolveHighSchoolOffensiveDecision(match, choice, tier);
}

function getHighSchoolDefensiveThirdOutType(resolution = {}) {
  const route = resolution.activeRoute || resolution.route || resolution.routeId || "";
  if (["tagHome", "preventRunHome"].includes(route)) return HIGH_SCHOOL_THIRD_OUT_TYPES.nonForceTag;
  if (["doublePlay", "forceHome", "forceThird", "forceSecond", "initiate463", "coverSecondFor643", "homeForceOut", "attackLeadRunnerThird"].includes(route)) {
    return HIGH_SCHOOL_THIRD_OUT_TYPES.force;
  }
  return HIGH_SCHOOL_THIRD_OUT_TYPES.batterRunnerBeforeFirst;
}

function finalizeHighSchoolDefensiveThirdOut(match, situationBefore, resolution) {
  const scoringAttempts = (resolution.scoringRunnerIds || []).map(runnerId => ({ runnerId, timing: "beforeThirdOut" }));
  return resolveHighSchoolThirdOutIntegrity({
    outsBefore: situationBefore.outs,
    outsCreated: resolution.outsCreated,
    runnersBefore: situationBefore.runners,
    proposedRunnersAfter: resolution.runnersAfter || match.runners,
    scoringAttempts,
    thirdOutType: getHighSchoolDefensiveThirdOutType(resolution)
  });
}

function normalizeHighSchoolTerminalRunnerChanges(resolution, thirdOutResolution) {
  if (!thirdOutResolution.halfInningEnded) return (resolution.runnerChanges || []).map(change => ({ ...change }));
  const scored = new Set(thirdOutResolution.legalScoringRunnerIds);
  return (resolution.runnerChanges || []).map(change => ({
    ...change,
    to: scored.has(change.runnerId) ? "home" : change.to === "out" ? "out" : "halfInningEnd"
  }));
}

function restoreHighSchoolMatchAfterDefensiveDecision(match, fallbackPhase = "moment_2_resolved") {
  const resume = match?.pendingDefensiveResumeState;
  if (resume) {
    match.simulationPhase = resume.simulationPhase || fallbackPhase;
    match.momentIndex = Math.max(0, Math.min(2, Number(resume.momentIndex) || 0));
    match.currentMomentId = resume.currentMomentId || match.currentMomentId;
    match.currentDomain = resume.currentDomain || "flow";
  } else {
    match.simulationPhase = fallbackPhase;
  }
  match.pendingDefensiveResumeState = null;
  return match.simulationPhase;
}

function applyInfieldResolutionToHighSchoolMatch(match, decision, resolution) {
  const situation = match.defensiveSituation;
  const groundBallContext = situation?.groundBallDefensiveContext;
  if (groundBallContext && match.groundBallInPlayState?.settlementApplied) return match.completedMoments.at(-1) || null;
  const situationBefore = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const presentation = infieldDecisionFamily.present(situation, resolution, decision);
  const explanation = resolution.defensiveOutcomeExplanation || createDefensiveOutcomeExplanation(situation, getInfieldDecisionChoice(situation, match, decision), resolution);
  const thirdOutResolution = finalizeHighSchoolDefensiveThirdOut(match, situationBefore, resolution);
  const runnerChanges = normalizeHighSchoolTerminalRunnerChanges(resolution, thirdOutResolution);
  match.outs = thirdOutResolution.outsAfter;
  thirdOutResolution.legalScoringRunnerIds.forEach(runnerId => {
    scoreHighSchoolMatchRunner(match, runnerId, "away", "infield-decision-family", {
      presentationImportance: "hidden",
      outsOverride: thirdOutResolution.halfInningEnded && thirdOutResolution.thirdOutType === HIGH_SCHOOL_THIRD_OUT_TYPES.nonForceTag
        ? situationBefore.outs : match.outs
    });
  });
  match.runners = thirdOutResolution.basesAfter.slice();
  if (thirdOutResolution.halfInningEnded) match.pendingHalfInningTermination = JSON.parse(JSON.stringify(thirdOutResolution));
  if (resolution.error) match.playerContribution.errors += 1;
  match.playerContribution.outsCreated += resolution.outsCreated;
  syncHighSchoolMatchPlayerRunnerLocation(match);
  const situationAfter = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const consequence = resolution.route === "doublePlay" && resolution.outsCreated === 1
    ? `${resolution.causeExplanation} 合理的雙殺判斷只完成一半。` : resolution.causeExplanation;
  const provisionalResolution = {
    ...resolution,
    runnerChanges,
    runnersAfter: thirdOutResolution.basesAfter,
    scoringRunnerIds: thirdOutResolution.legalScoringRunnerIds,
    thirdOutResolution
  };
  const groundBallPhysicalOutcome = groundBallContext && typeof BattedBallGroundDefense !== "undefined"
    ? BattedBallGroundDefense.settleGroundBallPhysicalOutcome(groundBallContext, provisionalResolution) : null;
  const paCompatibilityResult = groundBallPhysicalOutcome && typeof BattedBallGroundDefense !== "undefined"
    ? BattedBallGroundDefense.derivePACompatibilityResult(groundBallPhysicalOutcome) : null;
  const batterResult = paCompatibilityResult?.result || (resolution.outsCreated > 0 ? "out" : "single");
  const appliedResolution = {
    ...provisionalResolution,
    groundBallPhysicalOutcome,
    paCompatibilityResult
  };
  recordHighSchoolMeaningfulPlateAppearance(match, situation.batterId, batterResult, situationBefore, situationAfter, thirdOutResolution.legalScoringRunnerIds.length, appliedResolution);
  getHighSchoolMatchPerformanceEvidence(match, "player").defensiveInvolvements += 1;
  recordHighSchoolYearOneMoment(match, decision, resolution.tier, explanation?.outcome || presentation.outcome, consequence, situationAfter, {
    runnerChanges,
    scoringRunnerIds: thirdOutResolution.legalScoringRunnerIds,
    thirdOutResolution,
    resultCode: resolution.resultCode,
    error: resolution.error
  });
  match.lastDefensiveResolution = JSON.parse(JSON.stringify(appliedResolution));
  if (match.buntBallInPlayState && situation.buntDefensiveContext) {
    match.buntBallInPlayState = Object.freeze({
      ...JSON.parse(JSON.stringify(match.buntBallInPlayState)),
      firstLegState: resolution.firstLegState ? JSON.parse(JSON.stringify(resolution.firstLegState)) : { status: "notSelected", targetBase: "" },
      continuationState: resolution.continuationState ? JSON.parse(JSON.stringify(resolution.continuationState)) : { status: "notApplicable", window: "", targetBase: "" }
    });
  }
  if (groundBallPhysicalOutcome && groundBallContext) {
    match.groundBallInPlayState = BattedBallGroundDefense.normalizeHandoff({
      ...JSON.parse(JSON.stringify(match.groundBallInPlayState || groundBallContext)),
      firstLegState: JSON.parse(JSON.stringify(groundBallPhysicalOutcome.firstLegState)),
      continuationState: JSON.parse(JSON.stringify(groundBallPhysicalOutcome.continuationState)),
      chosenRoute: resolution.initialRoute || resolution.routeId || decision || "",
      finalRoute: resolution.activeRoute || resolution.routeId || resolution.route || "",
      physicalOutcome: JSON.parse(JSON.stringify(groundBallPhysicalOutcome)),
      paCompatibilityResult: JSON.parse(JSON.stringify(paCompatibilityResult)),
      settlementApplied: true
    });
    if (match.ordinaryDefensivePlateAppearanceState && typeof OffensivePlateApproach !== "undefined") {
      match.ordinaryDefensivePlateAppearanceState = OffensivePlateApproach.markResultApplied(match.ordinaryDefensivePlateAppearanceState);
    }
  }
  const densityState = ensureHighSchoolMatchDecisionDensityState(match);
  densityState.lastSelectedRoute = resolution.initialRoute || resolution.routeId || decision || "";
  densityState.lastFinalRoute = resolution.activeRoute || resolution.routeId || resolution.route || "";
  Object.assign(match.completedMoments.at(-1), {
    positionDecisionFamily: "infield",
    playerPosition: situation.playerPosition,
    route: resolution.route,
    resultCode: resolution.resultCode,
    detailedResult: resolution.detailedResult,
    decisionQuality: resolution.decisionQuality,
    executionQuality: resolution.executionQuality,
    outsCreated: resolution.outsCreated,
    runnerChanges: runnerChanges.map(change => ({ ...change })),
    scoringRunnerIds: thirdOutResolution.legalScoringRunnerIds.slice(),
    runsAllowed: thirdOutResolution.legalScoringRunnerIds.length,
    thirdOutResolution: JSON.parse(JSON.stringify(thirdOutResolution)),
    error: resolution.error,
    primaryCause: resolution.primaryCause,
    secondaryCause: resolution.secondaryCause,
    responsibleActor: resolution.responsibleActor || "",
    playerRole: resolution.playerRole || situation.responsibility?.playerRole || "",
    initialRoute: resolution.initialRoute || resolution.routeId || "",
    activeRoute: resolution.activeRoute || resolution.routeId || "",
    fallbackRoute: resolution.fallbackRoute || "",
    executionStage: resolution.executionStage || "",
    playerResponsibility: resolution.playerResponsibility,
    teammateResponsibility: resolution.teammateResponsibility,
    playerLeg: resolution.playerLeg ? JSON.parse(JSON.stringify(resolution.playerLeg)) : {},
    teammateLeg: resolution.teammateLeg ? JSON.parse(JSON.stringify(resolution.teammateLeg)) : {},
    timingResolution: resolution.timingResolution ? JSON.parse(JSON.stringify(resolution.timingResolution)) : {},
    defensiveOutcomeExplanation: explanation ? JSON.parse(JSON.stringify(explanation)) : null,
    executionText: explanation?.executionSummary || presentation.execution,
    causeExplanation: explanation?.causeText || resolution.causeExplanation,
    coachFeedback: explanation?.coachFeedback || "",
    ballContext: resolution.ballContext,
    ballDirection: resolution.ballDirection,
    ballDepth: resolution.ballDepth,
    groundBallPhysicalOutcome: groundBallPhysicalOutcome ? JSON.parse(JSON.stringify(groundBallPhysicalOutcome)) : null,
    paCompatibilityResult: paCompatibilityResult ? JSON.parse(JSON.stringify(paCompatibilityResult)) : null
  });
  recordHighSchoolMatchSimulationEvent(match, {
    type: "defensiveResolution", presentationImportance: "hidden", inning: match.inning, half: match.half,
    familyId: "infield", route: resolution.route, routeId: resolution.routeId || "", initialRoute: resolution.initialRoute || "", activeRoute: resolution.activeRoute || "", fallbackRoute: resolution.fallbackRoute || "", resultCode: resolution.resultCode,
    playerRole: resolution.playerRole || situation.responsibility?.playerRole || "", primaryCause: resolution.primaryCause, responsibleActor: resolution.responsibleActor || "",
    decisionQuality: resolution.decisionQuality, executionQuality: resolution.executionQuality,
    secondaryCause: resolution.secondaryCause || "", playerResponsibility: resolution.playerResponsibility || "", teammateResponsibility: resolution.teammateResponsibility || "",
    playerLeg: resolution.playerLeg || {}, teammateLeg: resolution.teammateLeg || {}, timingResolution: resolution.timingResolution || {},
    outsCreated: resolution.outsCreated, runsAllowed: resolution.runsAllowed,
    runnerChanges, scoringRunnerIds: thirdOutResolution.legalScoringRunnerIds, thirdOutResolution,
    groundBallPhysicalOutcome, paCompatibilityResult,
    outs: match.outs, scores: match.scores, runners: match.runners
  });
  advanceHighSchoolMatchBattingOrder(match, "away");
  assertHighSchoolMatchStateIntegrity(match, "player-defense-decision");
  restoreHighSchoolMatchAfterDefensiveDecision(match);
  match.currentAssignment = "等待球隊完成這個守備半局。";
  match.coachReaction = explanation?.coachFeedback || "現任教練提醒你先確認跑者，再決定最短的出局路線。";
  match.teamReaction = resolution.teammateResponsibility === "major"
    ? formatHighSchoolMatchWorldState(match, "接球隊友舉手示意這一球由他負責。")
    : formatHighSchoolMatchWorldState(match);
  return match.completedMoments.at(-1);
}

function applyRoutineDefensiveResolutionToHighSchoolMatch(match, resolution) {
  if (!match || !resolution || resolution.eventClassification !== "playerRoutinePlay") return null;
  const situation = match.defensiveSituation;
  const situationBefore = {
    inning: match.inning,
    half: match.half,
    outs: match.outs,
    scores: { ...match.scores },
    runners: match.runners.slice()
  };
  const thirdOutResolution = finalizeHighSchoolDefensiveThirdOut(match, situationBefore, resolution);
  const runnerChanges = normalizeHighSchoolTerminalRunnerChanges(resolution, thirdOutResolution);
  match.outs = thirdOutResolution.outsAfter;
  thirdOutResolution.legalScoringRunnerIds.forEach(runnerId => {
    scoreHighSchoolMatchRunner(match, runnerId, "away", "player-routine-play", {
      presentationImportance: "hidden",
      outsOverride: thirdOutResolution.halfInningEnded && thirdOutResolution.thirdOutType === HIGH_SCHOOL_THIRD_OUT_TYPES.nonForceTag
        ? situationBefore.outs : match.outs
    });
  });
  match.runners = thirdOutResolution.basesAfter.slice();
  if (thirdOutResolution.halfInningEnded) match.pendingHalfInningTermination = JSON.parse(JSON.stringify(thirdOutResolution));
  if (resolution.error) match.playerContribution.errors += 1;
  match.playerContribution.outsCreated += resolution.outsCreated;
  syncHighSchoolMatchPlayerRunnerLocation(match);
  const situationAfter = {
    inning: match.inning,
    half: match.half,
    outs: match.outs,
    scores: { ...match.scores },
    runners: match.runners.slice()
  };
  const batterResult = resolution.error ? "error" : resolution.outsCreated > 0 ? "out" : "single";
  recordHighSchoolRoutinePlateAppearance(
    match,
    situation.batterId,
    batterResult,
    situationBefore,
    situationAfter,
    thirdOutResolution.legalScoringRunnerIds.length,
    { ...resolution, runnerChanges, scoringRunnerIds: thirdOutResolution.legalScoringRunnerIds, thirdOutResolution }
  );
  getHighSchoolMatchPerformanceEvidence(match, "player").defensiveInvolvements += 1;
  match.lastDefensiveResolution = JSON.parse(JSON.stringify({ ...resolution, runnerChanges, scoringRunnerIds: thirdOutResolution.legalScoringRunnerIds, thirdOutResolution }));
  advanceHighSchoolMatchBattingOrder(match, "away");
  match.currentDomain = "flow";
  match.currentAssignment = resolution.error
    ? formatHighSchoolMatchWorldState(match, "這次例行守備形成失誤。")
    : resolution.outsCreated > 0
      ? formatHighSchoolMatchWorldState(match, "你完成例行守備出局；下一棒走進打擊區。")
      : formatHighSchoolMatchWorldState(match, "你完成例行處理。" );
  const event = recordHighSchoolMatchSimulationEvent(match, {
    type: "playerRoutinePlay",
    eventClassification: "playerRoutinePlay",
    decisionTension: resolution.decisionTension,
    presentationImportance: "attention",
    inning: match.inning,
    half: match.half,
    offenseTeam: "away",
    batterId: situation.batterId,
    currentBatterAfter: match.currentBatter,
    playerPosition: situation.playerPosition,
    ballContext: resolution.ballContext,
    ballDirection: resolution.ballDirection,
    ballDepth: resolution.ballDepth,
    executionRoute: resolution.executionRoute,
    initialRoute: resolution.initialRoute || resolution.routeId || "",
    activeRoute: resolution.activeRoute || resolution.routeId || "",
    fallbackRoute: resolution.fallbackRoute || "",
    playerRole: resolution.playerRole || situation.responsibility?.playerRole || "",
    coverageQuality: resolution.coverageQuality || "",
    upstreamThrowQuality: resolution.upstreamThrowQuality || "",
    decisionQuality: resolution.decisionQuality || "routine",
    executionQuality: resolution.executionQuality || "notApplicable",
    primaryCause: resolution.primaryCause || "",
    secondaryCause: resolution.secondaryCause || "",
    responsibleActor: resolution.responsibleActor || "",
    playerResponsibility: resolution.playerResponsibility || "",
    teammateResponsibility: resolution.teammateResponsibility || "",
    playerLeg: resolution.playerLeg || {},
    teammateLeg: resolution.teammateLeg || {},
    timingResolution: resolution.timingResolution || {},
    resultCode: resolution.resultCode,
    outsCreated: resolution.outsCreated,
    error: resolution.error,
    runnerChanges,
    scoringRunnerIds: thirdOutResolution.legalScoringRunnerIds,
    thirdOutResolution,
    before: situationBefore,
    after: situationAfter,
    outs: match.outs,
    scores: match.scores,
    runners: match.runners,
    assignment: match.currentAssignment
  });
  assertHighSchoolMatchStateIntegrity(match, "player-routine-defense");
  return event;
}

function applyCatcherResolutionToHighSchoolMatch(match, decision, resolution) {
  if (!match || resolution?.familyId !== "catcher") return null;
  const situationBefore = {
    inning: match.inning,
    half: match.half,
    outs: match.outs,
    scores: { ...match.scores },
    runners: match.runners.slice()
  };
  match.outs = resolution.thirdOutResolution.outsAfter;
  (resolution.scoringRunnerIds || []).forEach(runnerId => {
    scoreHighSchoolMatchRunner(match, runnerId, "away", "catcher-decision", {
      presentationImportance: "hidden",
      outsOverride: resolution.thirdOutResolution.halfInningEnded ? situationBefore.outs : match.outs
    });
  });
  match.runners = resolution.runnersAfter.slice(0, 3);
  if (resolution.thirdOutResolution.halfInningEnded) {
    match.pendingHalfInningTermination = JSON.parse(JSON.stringify(resolution.thirdOutResolution));
  }
  if (resolution.error) match.playerContribution.errors += 1;
  match.playerContribution.outsCreated += resolution.outsCreated;
  syncHighSchoolMatchPlayerRunnerLocation(match);
  const situationAfter = {
    inning: match.inning,
    half: match.half,
    outs: match.outs,
    scores: { ...match.scores },
    runners: match.runners.slice()
  };
  getHighSchoolMatchPerformanceEvidence(match, "player").defensiveInvolvements += 1;
  recordHighSchoolYearOneMoment(match, decision, resolution.tier, resolution.outcome, resolution.consequence, situationAfter, {
    runnerChanges: resolution.runnerChanges,
    scoringRunnerIds: resolution.scoringRunnerIds,
    thirdOutResolution: resolution.thirdOutResolution,
    resultCode: resolution.resultCode,
    error: resolution.error
  });
  const completedMoment = match.completedMoments.at(-1);
  Object.assign(completedMoment, {
    positionDecisionFamily: "catcher",
    catcherIntent: resolution.selectedRoute,
    selectedRoute: resolution.selectedRoute,
    finalRoute: resolution.finalRoute,
    reassessment: resolution.reassessment ? JSON.parse(JSON.stringify(resolution.reassessment)) : null,
    executionStages: JSON.parse(JSON.stringify(resolution.executionStages)),
    executionText: resolution.executionText,
    resultCode: resolution.resultCode,
    decisionQuality: resolution.decisionQuality,
    executionQuality: resolution.executionQuality,
    outsCreated: resolution.outsCreated,
    runnerChanges: resolution.runnerChanges.map(change => ({ ...change })),
    scoringRunnerIds: resolution.scoringRunnerIds.slice(),
    runsAllowed: resolution.runsAllowed,
    error: resolution.error,
    primaryCause: resolution.primaryCause,
    secondaryCause: resolution.secondaryCause,
    responsibleActor: resolution.responsibleActor,
    playerResponsibility: resolution.playerResponsibility,
    teammateResponsibility: resolution.teammateResponsibility,
    causeExplanation: resolution.causeExplanation,
    thirdOutResolution: JSON.parse(JSON.stringify(resolution.thirdOutResolution))
  });
  match.lastDefensiveResolution = JSON.parse(JSON.stringify(resolution));
  match.catcherDecisionState = {
    availableRoutes: resolution.availableRoutes.slice(),
    selectedRoute: resolution.selectedRoute,
    reassessment: resolution.reassessment ? JSON.parse(JSON.stringify(resolution.reassessment)) : null,
    finalRoute: resolution.finalRoute,
    executionStages: JSON.parse(JSON.stringify(resolution.executionStages)),
    attribution: {
      responsibleActor: resolution.responsibleActor,
      primaryCause: resolution.primaryCause,
      secondaryCause: resolution.secondaryCause
    }
  };
  const resolvedEvent = match.simulationLog.at(-1);
  if (resolvedEvent?.type === "meaningfulMomentResolved") {
    Object.assign(resolvedEvent, {
      familyId: "catcher",
      selectedRoute: resolution.selectedRoute,
      finalRoute: resolution.finalRoute,
      reassessment: resolution.reassessment,
      executionStages: resolution.executionStages,
      responsibleActor: resolution.responsibleActor,
      primaryCause: resolution.primaryCause,
      secondaryCause: resolution.secondaryCause,
      thirdOutResolution: resolution.thirdOutResolution
    });
  }
  recordHighSchoolMatchSimulationEvent(match, {
    type: "defensiveResolution",
    presentationImportance: "hidden",
    eventClassification: "playerMeaningfulDecision",
    familyId: "catcher",
    inning: match.inning,
    half: match.half,
    selectedRoute: resolution.selectedRoute,
    finalRoute: resolution.finalRoute,
    reassessment: resolution.reassessment,
    executionStages: resolution.executionStages,
    resultCode: resolution.resultCode,
    decisionQuality: resolution.decisionQuality,
    executionQuality: resolution.executionQuality,
    outsCreated: resolution.outsCreated,
    runsAllowed: resolution.runsAllowed,
    runnerChanges: resolution.runnerChanges,
    scoringRunnerIds: resolution.scoringRunnerIds,
    responsibleActor: resolution.responsibleActor,
    primaryCause: resolution.primaryCause,
    secondaryCause: resolution.secondaryCause,
    playerResponsibility: resolution.playerResponsibility,
    teammateResponsibility: resolution.teammateResponsibility,
    thirdOutResolution: resolution.thirdOutResolution,
    before: situationBefore,
    after: situationAfter,
    outs: match.outs,
    scores: match.scores,
    runners: match.runners
  });
  restoreHighSchoolMatchAfterDefensiveDecision(match);
  match.currentAssignment = resolution.thirdOutResolution.halfInningEnded
    ? "第三個出局已完成，等待攻守交換。"
    : "捕手處理完成，原打席依目前球數繼續。";
  match.coachReaction = resolution.error
    ? "現任教練把這次失誤記在實際傳球執行，不改寫你原本的選擇。"
    : resolution.reassessment ? "現任教練確認局勢改變已被明確記錄，重新處理不是偷偷改寫選擇。" : "現任教練確認你的執行沿著選定路線完成。";
  match.teamReaction = resolution.consequence;
  assertHighSchoolMatchStateIntegrity(match, "catcher-decision");
  return completedMoment;
}

function advanceHighSchoolYearOneAfterMomentTwo(match, decision, tier, defensiveResolution = null) {
  if (defensiveResolution?.familyId === "infield") {
    return applyInfieldResolutionToHighSchoolMatch(match, decision, defensiveResolution);
  }
  if (defensiveResolution?.familyId === "catcher") {
    return applyCatcherResolutionToHighSchoolMatch(match, decision, defensiveResolution);
  }
  const situationBefore = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const position = match.position;
  const force = getHighSchoolDefensiveForceState(match);
  const derivedResolution = resolveHighSchoolDefensivePlay(match, decision, 0.5);
  const resolution = defensiveResolution || Object.freeze({
    ...derivedResolution,
    resultCode: tier === "strong" ? decision === "challenge" ? "twoOuts" : "oneOut" : tier === "mixed" ? "oneOut" : derivedResolution.resultCode === "error" ? "error" : "zeroOuts",
    tier
  });
  const ball = getHighSchoolBallContext(match);
  const outcomes = {
    secure: {
      strong: [`你把${position}最穩定的出局點處理乾淨`, "出局成立，原本跑者沒有得到額外壘包。", 1, 0],
      mixed: ["你取得一個出局，跑者各自推進", "基本責任完成，壘上壓力仍在。", 1, 0],
      failure: ["接傳之間慢了一拍，打者安全上壘", "最穩定的選擇仍需要足夠執行品質。", 0, 0]
    },
    challenge: {
      strong: [`你用${position}的傳球完成高風險出局，並阻斷下一個壘包`, "主動挑戰成立，對手的攻勢被切成兩段。", 2, 0],
      mixed: ["第一個出局成立，第二個出局沒有趕上", "高回報選擇只完成一半，壘上壓力仍在。", 1, 0],
      failure: ["轉傳偏離接球點，場上局面依實際壘況延續", "風險沒有被臂力與腳步支撐。", 0, force.third ? 1 : 0]
    },
    lead: {
      strong: ["你把球送到最前方合法壘包完成封殺", "最危險的跑者被移除，打者留在一壘。", 1, 0],
      mixed: ["最前方跑者出局，打者趁傳站上一壘", "你完成主要出局，局面仍未完全解除。", 1, 0],
      failure: ["傳球沒有趕上最前方跑者", "所有跑者安全，下一棒繼續施壓。", 0, force.third ? 1 : 0]
    },
    home: {
      strong: ["你在本壘前完成觸殺或封殺", "三壘跑者被擋在得分線前。", 1, 0],
      mixed: ["本壘沒有出局，但你阻止其他跑者多推進", "分數壓力仍在，後方壘包沒有失控。", 0, 0],
      failure: ["本壘處理慢了一拍，三壘跑者得分", "本壘選擇合法，但執行沒有趕上跑者。", 0, 1]
    },
    contain: {
      strong: ["你壓住最前方跑者，再把球送到正確補位", "跑者被留在原地，球隊保住下一球的選擇權。", 1, 0],
      mixed: ["你守住前方跑者，但打者趁傳多進一壘", "最危險的分數被擋住，局面仍沒有完全解除。", 0, 0],
      failure: ["視線在兩名跑者間猶豫，最前方跑者趁隙得分", "判斷責任正確，決斷速度不足。", 0, 1]
    }
  };
  let [outcome, consequence, outsCreated, runsAllowed] = outcomes[decision]?.[tier] || outcomes.secure.failure;
  if (decision === "challenge") {
    if (resolution.resultCode === "twoOuts") {
      outcome = `你接住${ball.label}，二壘封殺後再轉一壘完成雙殺`;
      consequence = `${resolution.causeExplanation} 判斷與兩段執行都在窗口內完成。`;
      outsCreated = 2;
      runsAllowed = 0;
    } else if (resolution.resultCode === "oneOut") {
      outcome = "二壘封殺成功，但轉傳一壘沒有趕上打者";
      consequence = `${resolution.causeExplanation} 這是合理雙殺判斷下只完成一半，不是沒有拿到結果。`;
      outsCreated = 1;
      runsAllowed = 0;
    } else if (resolution.resultCode === "error") {
      outcome = "你沒有在第一個封殺前控制住球，場上局面依實際壘況延續";
      consequence = `${resolution.causeExplanation} 這次是接球執行失誤，不代表雙殺判斷本身必然錯誤。`;
      outsCreated = 0;
      runsAllowed = force.third ? 1 : 0;
    } else {
      outcome = "第一個封殺沒有趕上，跑者與打者都安全";
      consequence = `${resolution.causeExplanation} 選擇有合法路徑，但實際時間窗不足。`;
      outsCreated = 0;
      runsAllowed = force.third ? 1 : 0;
    }
  } else if (tier !== "strong") {
    consequence = `${consequence} ${resolution.causeExplanation}`;
  }
  match.outs = Math.min(3, match.outs + outsCreated);
  if (runsAllowed && match.runners[2]) {
    scoreHighSchoolMatchRunner(match, match.runners[2], "away", "player-defense");
    match.runners[2] = null;
  }
  if (decision === "challenge") {
    const [first, second, third] = match.runners;
    if (resolution.resultCode === "twoOuts") {
      match.runners = [null, null, second || third || null];
    } else if (resolution.resultCode === "oneOut") {
      match.runners = ["away-batter-moment", null, second || third || null];
    } else {
      match.runners = ["away-batter-moment", first, second || third || null];
      if (resolution.resultCode === "error") match.playerContribution.errors += 1;
    }
  } else if (tier === "failure") {
    const [first, second, third] = match.runners;
    if (third && !runsAllowed) scoreHighSchoolMatchRunner(match, third, "away", "player-defense");
    match.runners = ["away-batter-moment", first, second];
    if (resolution.resultCode === "error") match.playerContribution.errors += 1;
  } else if (decision === "lead") {
    if (match.runners[1]) match.runners[1] = null;
    else if (match.runners[0]) match.runners[0] = null;
  } else if (decision === "home" && tier === "strong") {
    match.runners[2] = null;
  }
  const legacyThirdOutResolution = resolveHighSchoolThirdOutIntegrity({
    outsBefore: situationBefore.outs,
    outsCreated,
    runnersBefore: situationBefore.runners,
    proposedRunnersAfter: match.runners,
    scoringAttempts: [],
    thirdOutType: decision === "challenge" ? HIGH_SCHOOL_THIRD_OUT_TYPES.force
      : decision === "home" ? HIGH_SCHOOL_THIRD_OUT_TYPES.nonForceTag
        : HIGH_SCHOOL_THIRD_OUT_TYPES.batterRunnerBeforeFirst
  });
  if (legacyThirdOutResolution.halfInningEnded) {
    match.runners = legacyThirdOutResolution.basesAfter.slice();
    match.pendingHalfInningTermination = JSON.parse(JSON.stringify(legacyThirdOutResolution));
    outcome = `${outcome}，形成第三個出局`;
    consequence = "第三個出局完成，半局立即結束；不存在可延續到下一棒的留壘或推進狀態。";
  }
  match.playerContribution.outsCreated += outsCreated;
  const situationAfter = { inning: match.inning, half: match.half, outs: match.outs, scores: { ...match.scores }, runners: match.runners.slice() };
  const batterResult = outsCreated > 0 ? "out" : "single";
  recordHighSchoolMeaningfulPlateAppearance(match, match.currentBatter, batterResult, situationBefore, situationAfter, runsAllowed, { thirdOutResolution: legacyThirdOutResolution });
  getHighSchoolMatchPerformanceEvidence(match, "player").defensiveInvolvements += 1;
  recordHighSchoolYearOneMoment(match, decision, tier, outcome, consequence, situationAfter, { thirdOutResolution: legacyThirdOutResolution });
  match.lastDefensiveResolution = { ...resolution, thirdOutResolution: legacyThirdOutResolution };
  Object.assign(match.completedMoments.at(-1), {
    resultCode: resolution.resultCode,
    decisionQuality: resolution.decisionQuality,
    executionQuality: resolution.executionQuality,
    primaryCause: resolution.primaryCause,
    secondaryCause: resolution.secondaryCause,
    causeExplanation: resolution.causeExplanation,
    ballContext: resolution.ballContext
  });
  advanceHighSchoolMatchBattingOrder(match, "away");
  restoreHighSchoolMatchAfterDefensiveDecision(match);
  match.currentAssignment = "等待球隊完成這個守備半局。";
  match.coachReaction = tier === "failure" ? "現任教練立刻重申補位與最短出局責任。" : "現任教練點頭示意，提醒內野準備下一球。";
  match.teamReaction = formatHighSchoolMatchWorldState(match);
}

function resolveHighSchoolYearOneFinalMoment(match, decisionOrChoice, tier) {
  const choice = typeof decisionOrChoice === "object" ? decisionOrChoice
    : buildOffensiveDecisionChoices(match).find(item => item.matchDecision === decisionOrChoice);
  const completedMoment = resolveHighSchoolOffensiveDecision(match, choice, tier, {
    integrityLabel: "player-final-offense-decision",
    resolvedPhase: match.pendingOffensiveOpportunity?.resumePhase || "moment_3_resolved",
    assignment: "等待這個半局走到終場。"
  });
  if (!completedMoment) return false;
  match.coachReaction = completedMoment.coachFeedback;
  match.teamReaction = match.playerRunnerLocation >= 0
    ? "休息區跟著後續棒次準備，你仍留在壘上等待攻勢延續。"
    : formatHighSchoolMatchWorldState(match, "後續棒次接著走進打擊區。" );
  return `${completedMoment.outcome}。${completedMoment.consequence}`;
}

function deriveHighSchoolMatchActualExposure(match) {
  const log = Array.isArray(match?.simulationLog) ? match.simulationLog : [];
  const entryEvent = log.find(event => event.type === "playerEntry") || null;
  const started = match?.playerLineupStatus === "starter";
  const participated = started || (match?.playerLineupStatus === "substitute" && (match.playerEntryCompleted || entryEvent));
  if (!participated) {
    return Object.freeze({ matchId: match?.id || "", participated: false, started: false, appearanceType: "noAppearance", entryInning: null, exitInning: null, defensiveInnings: 0, plateAppearances: 0, role: match?.role || "bench" });
  }
  const entrySequence = started ? -1 : Number(entryEvent?.sequence) || 0;
  const defensiveInnings = new Set(log.filter(event => event.type === "halfInningEnd" && event.half === "上"
    && Number(event.sequence) >= entrySequence).map(event => Number(event.inning) || 0).filter(Boolean)).size;
  const plateAppearances = log.filter(event => event.type === "plateAppearance" && event.batterId === "player"
    && Number(event.sequence) >= entrySequence).length;
  return Object.freeze({
    matchId: match?.id || "",
    participated: true,
    started,
    appearanceType: started ? "start" : match?.gameExposureState?.plannedUsage?.appearanceType || "lateGameAppearance",
    entryInning: started ? 1 : Number(entryEvent?.inning) || Number(match?.inning) || 1,
    exitInning: Number(match?.inning) || null,
    defensiveInnings,
    plateAppearances,
    role: match?.role || match?.playerLineupStatus || "bench"
  });
}

function finalizeHighSchoolGameExposure(match) {
  if (!match?.gameExposureState || typeof PlayingTimeGameExposure === "undefined") return null;
  const finalization = PlayingTimeGameExposure.finalizeGameExposure(match.gameExposureState, deriveHighSchoolMatchActualExposure(match));
  if (finalization.ok) match.gameExposureState = finalization.state;
  return finalization;
}

function settleHighSchoolYearOneMatch(match, finalDecision) {
  if (match.settled || match.completed) return false;
  const contribution = match.playerContribution;
  const finalMoment = match.completedMoments.at(-1);
  if (finalMoment) {
    finalMoment.scores = { ...match.scores };
    finalMoment.runners = [null, null, null];
    finalMoment.outs = 3;
    finalMoment.half = "終";
  }
  const resultLabel = match.scores.home > match.scores.away ? "球隊勝利" : match.scores.home < match.scores.away ? "球隊落敗" : "球隊和局";
  match.teamResult = `${resultLabel}，終場 ${match.scores.home}：${match.scores.away}`;
  const momentCount = match.completedMoments.length;
  const participationTruth = deriveHighSchoolMatchActualExposure(match);
  const overallTier = contribution.strong > contribution.failure ? "strong" : contribution.failure > contribution.strong ? "failure" : "mixed";
  const countLabel = momentCount === 1 ? "一個" : momentCount === 2 ? "兩個" : momentCount === 3 ? "三個" : `${momentCount} 個`;
  const performanceLines = match.completedMoments.map((moment, index) => `第${["一", "二", "三"][index] || index + 1}次：${moment.outcome}。`).join(" ");
  match.performanceSummary = participationTruth.participated
    ? `本場${countLabel}關鍵時刻：${performanceLines || "你依照角色完成了這場比賽。"}`
    : "本場比賽完整結束，但教練沒有把你換上場；沒有虛構守備局數、打席或比賽成長。";
  match.outcome = `${match.teamResult}。${match.performanceSummary}`;
  match.coachReaction = overallTier === "strong"
    ? "「今天幾次輪到你，你都把眼前的球處理清楚。下一場繼續照這個節奏準備。」"
    : overallTier === "mixed"
      ? "「有幾球你看對了，也有一步慢了。下一輪把判斷後的第一個動作做得更乾淨。」"
      : "「你不是沒看懂，動作只是慢了一步。下一輪先把接球到出手的節奏修掉。」";
  match.consequence = overallTier === "strong"
    ? "下一場實戰名單仍會保留你的名字。"
    : overallTier === "mixed"
      ? "接下來的訓練會更重視判斷後的第一步動作。"
      : "下一輪訓練會先練接球、轉身與出手之間的銜接。";
  match.teamReaction = match.teamResult;
  match.passage = "終場哨響，記分板停在這場比賽真正結束的局數。";
  match.momentIndex = momentCount;
  match.currentMomentId = "";
  match.currentDomain = "complete";
  match.simulationPhase = "complete";
  match.currentAssignment = "比賽已結束。";
  match.completed = true;
  match.settled = true;
  setHighSchoolCoachTacticalDirection(match);
  recordHighSchoolMatchSimulationEvent(match, {
    type: "gameEnd", inning: match.inning, half: "終", scores: match.scores
  });
  finalizeHighSchoolGameExposure(match);
  if (typeof MatchExperienceDevelopment !== "undefined") {
    const finalizedExposure = match.gameExposureState?.finalized
      ? {
        defensiveInnings: match.gameExposureState.defensiveInnings,
        plateAppearances: match.gameExposureState.plateAppearances,
        role: match.role || match.playerLineupStatus || "bench"
      }
      : undefined;
    MatchExperienceDevelopment.settleMatchExperienceDevelopment(player, match, finalizedExposure ? { exposure: finalizedExposure } : {});
  }

  if (participationTruth.participated) {
    player.seasonPerformance += Math.max(0, contribution.strong * 2 + contribution.mixed);
    player.recentPerformance += overallTier === "strong" ? 2 : overallTier === "mixed" ? 1 : -1;
    player.exposure += overallTier === "strong" ? 2 : 1;
    player.scoutEvaluation += overallTier === "strong" ? 2 : overallTier === "mixed" ? 1 : 0;
    const proofFlag = finalDecision === "attack" ? "showcase_tools" : finalDecision === "advance" ? "showcase_baseball_iq" : "showcase_team_task";
    addFlags(["hs_y1_match_completed", `hs_y1_match_${overallTier}`, proofFlag]);
  } else {
    addFlags(["hs_y1_match_completed", "hs_y1_match_no_appearance"]);
  }
  return match.performanceSummary;
}

function isHighSchoolMatchPlayerActive(match) {
  return Boolean(match?.playerEntryCompleted && ["starter", "substitute"].includes(match.playerLineupStatus));
}

function shouldCreateHighSchoolFirstOffensiveMoment(match) {
  return match?.momentIndex === 0 && match.currentMomentId === highSchoolYearOneMomentIds[0]
    && isHighSchoolMatchPlayerActive(match)
    && match.offenseTeam === "home" && getHighSchoolMatchLineupBatter(match, "home")?.id === "player";
}

function prepareHighSchoolFirstOffensiveMomentFromSimulation(match) {
  match.currentBatter = "player";
  match.momentIndex = 0;
  match.currentMomentId = highSchoolYearOneMomentIds[0];
  match.currentDomain = "offense";
  match.simulationPhase = "moment_1_ready";
  match.currentAssignment = `${match.inning}局${match.half}、${match.outs} 出局、${formatHighSchoolMatchRunners(match.runners)}；完成你進入本場後的第一個關鍵打席。`;
  match.opponentAdjustment = "投手依當下比分與壘況進入這個打席，沒有預先指定結果。";
  setHighSchoolCoachTacticalDirection(match);
  const choices = buildOffensiveDecisionChoices(match).filter(choice => isOffensiveDecisionChoiceLegal(choice, match));
  const classification = classifyHighSchoolOffensiveOpportunity(match, choices);
  const density = evaluateHighSchoolOffensiveDecisionDensity(match, classification, { forceScripted: true });
  applyHighSchoolOffensiveDecisionDensity(match, classification, density, true);
  match.pendingOffensiveOpportunity = {
    version: "offensive-opportunity-v1", status: "pending", kind: "scripted", momentId: match.currentMomentId,
    paIdentity: "", classification: JSON.parse(JSON.stringify(classification)), density: JSON.parse(JSON.stringify(density)),
    resumePhase: "moment_1_resolved", playerPANumber: classification.playerPANumber
  };
  const opportunity = recordHighSchoolMatchOffensiveOpportunity(match, "scripted", choices, classification, density);
  const event = recordHighSchoolMatchSimulationEvent(match, {
    type: "meaningfulMomentReached", eventClassification: "playerMeaningfulDecision", inning: match.inning, half: match.half,
    momentId: match.currentMomentId, domain: match.currentDomain, assignment: match.currentAssignment,
    outs: match.outs, scores: match.scores, runners: match.runners
  });
  if (opportunity) opportunity.simulationLogIndex = event.sequence;
  return event;
}

function prepareHighSchoolMeaningfulOffensiveMomentFromSimulation(match, classification, density, options = {}) {
  const legacyFinal = options.legacyFinal === true;
  const resumePhase = options.resumePhase || (legacyFinal ? "moment_3_resolved" : (match.simulationPhase || "full_match_flow"));
  const playerPANumber = classification?.playerPANumber || getHighSchoolOffensivePlayerPANumber(match);
  match.currentBatter = "player";
  ensureHighSchoolMatchLineScoreInning(match, "home", match.inning);
  match.momentIndex = 2;
  match.currentMomentId = legacyFinal ? highSchoolYearOneMomentIds[2] : `hs_y1_match_offense_${playerPANumber}`;
  match.currentDomain = "offense";
  match.simulationPhase = "moment_3_ready";
  match.currentAssignment = `${match.inning}局${match.half}、${match.outs} 出局、${formatHighSchoolMatchRunners(match.runners)}；處理${getHighSchoolOffensiveObjectiveContext(match)}。`;
  match.coachInstruction = classification?.leverageClass === "critical"
    ? "這個打席直接關係追平或延續比賽；先讀球數，再選擇真正願意承擔的攻擊方式。"
    : classification?.leverageClass === "highLeverage"
      ? "終盤比分仍在一個打席可影響的範圍；依壘況選擇攻擊區與揮棒意圖。"
      : "依目前比分、出局數與壘況，選擇這次打席的攻擊方式。";
  match.opponentAdjustment = "投手依當下比分、壘況與球數投球；玩家策略不會改寫來球位置。";
  setHighSchoolCoachTacticalDirection(match);
  const choices = buildOffensiveDecisionChoices(match).filter(choice => isOffensiveDecisionChoiceLegal(choice, match));
  match.pendingOffensiveOpportunity = {
    version: "offensive-opportunity-v1", status: "pending", kind: legacyFinal ? "legacyFinal" : "classified",
    momentId: match.currentMomentId, paIdentity: "", classification: JSON.parse(JSON.stringify(classification)),
    density: JSON.parse(JSON.stringify(density)), resumePhase, playerPANumber
  };
  const opportunity = recordHighSchoolMatchOffensiveOpportunity(match, legacyFinal ? "emergent" : "classified", choices, classification, density);
  const event = recordHighSchoolMatchSimulationEvent(match, {
    type: "meaningfulMomentReached", eventClassification: "playerMeaningfulDecision", inning: match.inning, half: match.half,
    momentId: match.currentMomentId, domain: match.currentDomain, assignment: match.currentAssignment,
    leverageClass: classification?.leverageClass || "meaningful", opportunityClassification: classification,
    outs: match.outs, scores: match.scores, runners: match.runners
  });
  if (opportunity) opportunity.simulationLogIndex = event.sequence;
  return event;
}

function prepareHighSchoolDefensiveMomentFromSimulation(match, options = {}) {
  const opportunity = findHighSchoolMatchOpportunity(match, options.opportunityTraceId);
  const densityState = ensureHighSchoolMatchDecisionDensityState(match);
  const flowState = {
    momentIndex: match.momentIndex,
    currentMomentId: match.currentMomentId,
    simulationPhase: match.simulationPhase,
    currentDomain: match.currentDomain,
    currentAssignment: match.currentAssignment
  };
  const primaryDefensiveDecision = flowState.simulationPhase === "moment_1_resolved"
    && (densityState?.defensiveMeaningfulDecisionCount || 0) === 0;
  match.pendingDefensiveResumeState = {
    simulationPhase: primaryDefensiveDecision ? "moment_2_resolved" : flowState.simulationPhase,
    momentIndex: primaryDefensiveDecision ? 1 : flowState.momentIndex,
    currentMomentId: primaryDefensiveDecision ? highSchoolYearOneMomentIds[1] : flowState.currentMomentId,
    currentDomain: "flow",
    currentAssignment: flowState.currentAssignment
  };
  match.currentBatter = getHighSchoolMatchLineupBatter(match, match.offenseTeam)?.id || "";
  match.momentIndex = 1;
  match.currentMomentId = primaryDefensiveDecision ? highSchoolYearOneMomentIds[1]
    : `hs_y1_match_defense_${(densityState?.defensiveMeaningfulDecisionCount || 0) + 1}`;
  match.currentDomain = "defense";
  const offensiveTacticalState = prepareHighSchoolOffensiveTacticalAction(match, options);
  if (offensiveTacticalState) {
    advanceHighSchoolOffensiveTacticalReveal(match, options.tacticalRevealPhase || "lateReveal");
  } else {
    match.opponentTacticalTruth = {
      code: match.previousMomentDecision === "zone" ? "hitAndRun" : match.previousMomentDecision === "attack" ? "earlyBreak" : "shortSwing",
      targetRunnerId: match.runners[1] || match.runners[0] || match.runners[2] || ""
    };
  }
  const productionBunt = offensiveTacticalState && typeof OffensiveBuntExecution !== "undefined"
    ? resolveHighSchoolProductionBuntPitch(match, {
      ...(options.buntPitchOptions || {}),
      initialCount: options.buntInitialCount
    }) : null;
  if (productionBunt?.event) {
    match.momentIndex = flowState.momentIndex;
    match.currentMomentId = flowState.currentMomentId;
    match.simulationPhase = flowState.simulationPhase;
    match.currentDomain = flowState.currentDomain;
    match.currentAssignment = flowState.currentAssignment;
    match.pendingDefensiveResumeState = null;
    setHighSchoolCoachTacticalDirection(match);
    finalizeHighSchoolMatchDefensiveOpportunity(match, opportunity, productionBunt.event, productionBunt.status);
    return productionBunt.event;
  }
  const buntHandoff = productionBunt?.shouldBuildDefense ? ensureHighSchoolBuntBallInPlayHandoff(match) : null;
  const groundBallHandoff = !productionBunt && offensiveTacticalState?.selectedTacticalAction === "standardAttack"
    ? ensureHighSchoolOrdinaryGroundBallInPlayHandoff(match, options) : null;
  if (buntHandoff && !buntHandoff.supported) {
    if (buntHandoff.fallbackPresented !== true) {
      const fallbackText = buntHandoff.ballContext.downstreamSupport === "unsupportedPopBuntFallback"
        ? "短打形成小飛球，壘上跑者回頭確認球是否落地；本階段不預判接殺或離壘出局。"
        : `短打落在${buntHandoff.ballContext.physicalTruth.placement === "thirdBaseSide" ? "三壘側" : buntHandoff.ballContext.physicalTruth.placement === "firstBaseSide" ? "一壘側" : "投手附近"}；此守備位置尚未納入二壘手垂直切片。`;
      match.buntBallInPlayState = Object.freeze({ ...JSON.parse(JSON.stringify(buntHandoff)), fallbackPresented: true });
      const fallbackEvent = recordHighSchoolMatchSimulationEvent(match, {
        type: "buntDefensiveFallback", presentationImportance: "attention", inning: match.inning, half: match.half,
        assignment: fallbackText, presentation: fallbackText, outs: match.outs, scores: match.scores, runners: match.runners
      });
      match.momentIndex = flowState.momentIndex;
      match.currentMomentId = flowState.currentMomentId;
      match.simulationPhase = flowState.simulationPhase;
      match.currentDomain = flowState.currentDomain;
      match.currentAssignment = flowState.currentAssignment;
      match.pendingDefensiveResumeState = null;
      finalizeHighSchoolMatchDefensiveOpportunity(match, opportunity, fallbackEvent, "unsupported-bunt-defense");
      return fallbackEvent;
    }
    return null;
  }
  const lineDriveCatchOpportunity = typeof BattedBallLineDriveDefense !== "undefined"
    ? BattedBallLineDriveDefense.normalizeCatchState(match.lineDriveCatchState) : null;
  if (!productionBunt && lineDriveCatchOpportunity?.supported) {
    resolveHighSchoolLineDriveCatchOpportunity(match, options);
    const catchEvent = applyHighSchoolLineDriveCatchResolution(match);
    restoreHighSchoolMatchAfterDefensiveDecision(match, flowState.simulationPhase);
    match.currentDomain = "flow";
    setHighSchoolCoachTacticalDirection(match);
    finalizeHighSchoolMatchDefensiveOpportunity(match, opportunity, catchEvent, "routine-line-drive-catch");
    return catchEvent;
  }
  const flyBallCatchOpportunity = typeof BattedBallFlyBallDefense !== "undefined"
    ? BattedBallFlyBallDefense.normalizeFlyBallCatchState(match.flyBallCatchState) : null;
  if (!productionBunt && flyBallCatchOpportunity?.supported) {
    resolveHighSchoolFlyBallCatchOpportunity(match, options);
    const catchEvent = applyHighSchoolFlyBallCatchResolution(match);
    restoreHighSchoolMatchAfterDefensiveDecision(match, flowState.simulationPhase);
    match.currentDomain = "flow";
    setHighSchoolCoachTacticalDirection(match);
    finalizeHighSchoolMatchDefensiveOpportunity(match, opportunity, catchEvent, "routine-fly-ball-catch");
    return catchEvent;
  }
  if (buntHandoff) match.ballContext = JSON.parse(JSON.stringify(buntHandoff.ballContext));
  else if (groundBallHandoff?.supported) match.ballContext = JSON.parse(JSON.stringify(groundBallHandoff.ballContext));
  else setHighSchoolDefensiveBallContext(match, options.ballContextType || "");
  match.currentAssignment = getHighSchoolDefensiveSituationText(match);
  const priorTier = match.completedMoments[0]?.tier;
  match.coachInstruction = priorTier === "strong"
    ? "前一段執行已建立信任；現在先讀出局數，再決定是否挑戰額外出局。"
    : priorTier === "mixed"
      ? "先把最穩定的守備出局處理乾淨，不讓壘況繼續擴大。"
      : "前一段結果不影響你的守備資格；這一球只看補位與最短合法出局。";
  if (isInfieldDecisionFamilyPosition(match.developmentPositionOverride || match.position)) {
    match.defensiveSituation = {};
    const buntOverrides = getHighSchoolBuntDefensiveSituationOverrides(buntHandoff);
    const groundBallOverrides = getHighSchoolGroundBallDefensiveSituationOverrides(groundBallHandoff);
    const physicalOverrides = buntOverrides || groundBallOverrides;
    buildInfieldMeaningfulMoment(match, player, physicalOverrides
      ? { ...(options.situationOverrides || {}), ...physicalOverrides }
      : options.situationOverrides || {});
    match.currentAssignment = getHighSchoolDefensiveSituationText(match);
  } else {
    match.positionDecisionFamily = "";
    match.currentFieldingPosition = "";
    match.defensiveSituation = {};
  }
  match.opponentAdjustment = "跑者與打者的準備動作出現變化；只呈現你在場上能看見的線索。";
  const legalChoices = getHighSchoolDefensiveMomentChoices(match);
  const classification = match.defensiveSituation?.familyId === "infield"
    ? classifyHighSchoolMatchDefensiveOpportunity(match, match.defensiveSituation, legalChoices, true)
    : Object.freeze({ eventClassification: "playerMeaningfulDecision", decisionTension: "meaningful", gate: null });
  match.playerEventClassification = classification.eventClassification;
  match.decisionTension = classification.decisionTension;
  match.decisionGate = classification.gate ? JSON.parse(JSON.stringify(classification.gate)) : null;
  applyHighSchoolMatchDefensiveDecisionDensity(match, classification.density, classification.eventClassification === "playerMeaningfulDecision");
  updateHighSchoolMatchDefensiveOpportunityFromSituation(match, opportunity, match.defensiveSituation, legalChoices, classification);
  if (classification.eventClassification === "playerRoutinePlay") {
    const resolution = resolveRoutineDefensivePlay(match, match.defensiveSituation, options.randomSource ?? null, {
      densitySuppressed: classification.density?.meaningfulCandidate === true && classification.density?.allowed === false
    });
    if (!resolution) {
      match.momentIndex = flowState.momentIndex;
      match.currentMomentId = flowState.currentMomentId;
      match.simulationPhase = flowState.simulationPhase;
      match.currentDomain = flowState.currentDomain;
      match.currentAssignment = flowState.currentAssignment;
      match.pendingDefensiveResumeState = null;
      setHighSchoolCoachTacticalDirection(match);
      finalizeHighSchoolMatchDefensiveOpportunity(match, opportunity, null, "no-routine-resolution");
      return null;
    }
    const event = applyRoutineDefensiveResolutionToHighSchoolMatch(match, resolution);
    restoreHighSchoolMatchAfterDefensiveDecision(match, flowState.simulationPhase);
    match.currentDomain = "flow";
    setHighSchoolCoachTacticalDirection(match);
    finalizeHighSchoolMatchDefensiveOpportunity(match, opportunity, event, "routine");
    return event;
  }
  match.simulationPhase = "moment_2_ready";
  setHighSchoolCoachTacticalDirection(match);
  const event = recordHighSchoolMatchSimulationEvent(match, {
    type: "meaningfulMomentReached", eventClassification: "playerMeaningfulDecision", decisionTension: classification.decisionTension, inning: match.inning, half: match.half,
    momentId: match.currentMomentId, domain: match.currentDomain, assignment: match.currentAssignment,
    outs: match.outs, scores: match.scores, runners: match.runners
  });
  finalizeHighSchoolMatchDefensiveOpportunity(match, opportunity, event, "decision-created");
  return event;
}

function prepareHighSchoolFinalOffensiveMomentFromSimulation(match) {
  match.currentDomain = "offense";
  const choices = buildOffensiveDecisionChoices(match).filter(choice => isOffensiveDecisionChoiceLegal(choice, match));
  const classification = classifyHighSchoolOffensiveOpportunity(match, choices);
  const density = evaluateHighSchoolOffensiveDecisionDensity(match, classification, { forceScripted: true });
  applyHighSchoolOffensiveDecisionDensity(match, classification, density, true);
  return prepareHighSchoolMeaningfulOffensiveMomentFromSimulation(match, classification, density, { legacyFinal: true });
}

function finishHighSchoolMatchBySimulation(match) {
  if (match.completed) return false;
  match.runners = [null, null, null];
  if (match.pendingGameSettlement !== "walkOff") match.outs = 3;
  match.half = "終";
  match.pendingGameSettlement = "";
  syncHighSchoolMatchPlayerRunnerLocation(match);
  return settleHighSchoolYearOneMatch(match, match.completedMoments.at(-1)?.decision || "zone");
}

function isHighSchoolMatchWalkOff(match) {
  return match.inning >= (Number(match.regulationInnings) || 7) && match.half === "下" && match.scores.home > match.scores.away;
}

function shouldEndHighSchoolMatchAfterHalf(match, inning, half) {
  const regulationInnings = Number(match.regulationInnings) || 7;
  if (inning < regulationInnings) return false;
  if (half === "上") return match.scores.home > match.scores.away;
  return match.scores.home !== match.scores.away;
}

function finishHighSchoolMatchAtCompletedHalf(match, inning, half) {
  const offenseTeam = half === "上" ? "away" : "home";
  const runsScored = ensureHighSchoolMatchLineScoreInning(match, offenseTeam, inning);
  if (half === "上") {
    while (match.lineScore.home.length < inning) match.lineScore.home.push(null);
  }
  recordHighSchoolMatchSimulationEvent(match, {
    type: "halfInningEnd", inning, half, offenseTeam, runsScored,
    playerStranded: Array.isArray(match.pendingHalfInningTermination?.strandedRunnerIds)
      ? match.pendingHalfInningTermination.strandedRunnerIds.includes("player") : match.runners.includes("player"),
    thirdOutType: match.pendingHalfInningTermination?.thirdOutType || HIGH_SCHOOL_THIRD_OUT_TYPES.none,
    scoringAllowed: match.pendingHalfInningTermination?.scoringAllowed !== false,
    basesBefore: match.pendingHalfInningTermination?.basesBefore || match.runners,
    basesAfter: [null, null, null], halfInningTransition: "completed", scores: match.scores
  });
  match.runners = [null, null, null];
  match.pendingHalfInningTermination = null;
  syncHighSchoolMatchPlayerRunnerLocation(match);
  match.pendingGameSettlement = "completedHalf";
  return true;
}

function shouldReachHighSchoolDefensiveMoment(match) {
  if (!isHighSchoolMatchPlayerActive(match) || match.offenseTeam !== "away" || match.outs >= 3) return false;
  const force = getHighSchoolDefensiveForceState(match);
  const scoreDifference = Math.abs((Number(match.scores?.home) || 0) - (Number(match.scores?.away) || 0));
  const naturalPressure = match.outs < 2 && (force.doublePlayEligible || (force.third && scoreDifference <= 1));
  const fallbackInning = Math.max(2, (Number(match.playerEntryWindowInning) || 1) + 1);
  const routineAlreadyShownThisHalf = (match.simulationLog || []).some(event => event.type === "playerRoutinePlay"
    && event.inning === match.inning && event.half === match.half);
  return naturalPressure || (match.inning >= fallbackInning && !routineAlreadyShownThisHalf);
}

function shouldReachHighSchoolFinalOffensiveMoment(match) {
  const batter = getHighSchoolMatchLineupBatter(match, match.offenseTeam);
  const targetInning = Math.max(5, (Number(match.playerEntryWindowInning) || 1) + 1);
  return isHighSchoolMatchPlayerActive(match) && match.inning >= targetInning
    && match.half === "下" && match.offenseTeam === "home" && batter?.id === "player";
}

function advanceHighSchoolMatchPlaybackStep(match = player.highSchoolMatch) {
  if (!match || match.completed || !isHighSchoolMatchPlaybackPhase(match)) return false;
  const pendingEvent = advanceHighSchoolPresentationCursor(match);
  if (pendingEvent) return getHighSchoolPlaybackResultForPresentedEvent(pendingEvent);
  if (match.pendingGameSettlement) {
    finishHighSchoolMatchBySimulation(match);
    return getHighSchoolPlaybackResultForPresentedEvent(advanceHighSchoolPresentationCursor(match)) || "gameEnd";
  }
  if (needsHighSchoolScoreboardReveal(match)) {
    match.scoreboardRevealHalfIndex = getHighSchoolScoreboardRevealHalfIndex(match) + 1;
    const visibleHalf = getHighSchoolHalfInningFromIndex(match.scoreboardRevealHalfIndex);
    match.passage = `${visibleHalf.inning}局${visibleHalf.half}已在記分板上展開；比分只顯示目前播放到的進度。`;
    return "scoreboardReveal";
  }
  const target = match.simulationPhase === "full_match_flow" ? "firstOffense"
    : match.simulationPhase === "moment_1_resolved" ? "defense"
    : match.simulationPhase === "moment_2_resolved" ? "finalOffense" : "finish";
  const startIndex = getHighSchoolPresentedEventCursor(match);
  const scoresBefore = { ...match.scores };
  const playerStartedOnBase = match.playerRunnerLocation >= 0;
  const startingInning = match.inning;
  const startingHalf = match.half;

  if (isHighSchoolMatchWalkOff(match)) {
    recordHighSchoolMatchSimulationEvent(match, {
      type: "walkOff", inning: match.inning, half: match.half, scores: match.scores
    });
    match.pendingGameSettlement = "walkOff";
    advanceHighSchoolPresentationCursor(match);
    return "walkOff";
  }

  if (match.outs >= 3 && shouldEndHighSchoolMatchAfterHalf(match, startingInning, startingHalf)) {
    finishHighSchoolMatchAtCompletedHalf(match, startingInning, startingHalf);
    match.passage = summarizeHighSchoolSimulationSegment(match, startIndex, scoresBefore, playerStartedOnBase);
    return getHighSchoolPlaybackResultForPresentedEvent(advanceHighSchoolPresentationCursor(match));
  }
  if (match.outs >= 3) {
    endHighSchoolMatchHalfInning(match);
    const runs = (match.scores.home - scoresBefore.home) + (match.scores.away - scoresBefore.away);
    match.currentAssignment = `${startingInning}局${startingHalf}已結束；接著進入${match.inning}局${match.half}。`;
    match.passage = `${startingInning}局${startingHalf}完成，這個半局產生 ${runs} 分。記分板保留先前所有局數，下一個半局接著開始。`;
    return getHighSchoolPlaybackResultForPresentedEvent(advanceHighSchoolPresentationCursor(match));
  }

  if (shouldEnterHighSchoolMatchPlayer(match)) {
    enterHighSchoolMatchPlayer(match);
    match.passage = summarizeHighSchoolSimulationSegment(match, startIndex, scoresBefore, playerStartedOnBase);
    return getHighSchoolPlaybackResultForPresentedEvent(advanceHighSchoolPresentationCursor(match));
  }

  const batter = getHighSchoolMatchLineupBatter(match, match.offenseTeam);
  if (batter?.id === "player") {
    const agencyChoices = buildOffensiveDecisionChoices(match).filter(choice => isOffensiveDecisionChoiceLegal(choice, match));
    const agencyClassification = classifyHighSchoolOffensiveOpportunity(match, agencyChoices);
    const agencyDensity = evaluateHighSchoolOffensiveDecisionDensity(match, agencyClassification);
    const agency = evaluateHighSchoolOffensivePlayerAgency(match, agencyClassification);
    if (agency.lateGamePlayerAgency) {
      const routeTarget = target === "firstOffense" && shouldCreateHighSchoolFirstOffensiveMoment(match) ? "firstOffense"
        : target === "finalOffense" && shouldReachHighSchoolFinalOffensiveMoment(match) ? "finalOffense" : "classified";
      prepareHighSchoolOffensiveAgencyChoice(match, agencyClassification, agencyDensity, { routeTarget });
      match.passage = summarizeHighSchoolSimulationSegment(match, startIndex, scoresBefore, playerStartedOnBase);
      return getHighSchoolPlaybackResultForPresentedEvent(advanceHighSchoolPresentationCursor(match));
    }
  }
  const defensiveOpportunity = beginHighSchoolMatchDefensiveOpportunity(match, batter, target);
  if (target === "firstOffense" && shouldCreateHighSchoolFirstOffensiveMoment(match)) {
    prepareHighSchoolFirstOffensiveMomentFromSimulation(match);
    match.passage = summarizeHighSchoolSimulationSegment(match, startIndex, scoresBefore, playerStartedOnBase);
    return getHighSchoolPlaybackResultForPresentedEvent(advanceHighSchoolPresentationCursor(match));
  }
  const activeFieldingPosition = match.developmentPositionOverride || match.playerFieldingAssignment || match.currentFieldingPosition || match.position;
  const defensiveOpportunityPhase = target === "defense"
    || (activeFieldingPosition === "二壘手" && ["finalOffense", "finish"].includes(target));
  const defensiveResponsibilityReached = defensiveOpportunityPhase && shouldReachHighSchoolDefensiveMoment(match);
  if (defensiveOpportunity) defensiveOpportunity.responsibilityCheck = defensiveResponsibilityReached;
  if (defensiveResponsibilityReached) {
    const defensiveEvent = prepareHighSchoolDefensiveMomentFromSimulation(match, { opportunityTraceId: defensiveOpportunity?.opportunityId || "" });
    if (defensiveEvent) {
      match.passage = summarizeHighSchoolSimulationSegment(match, startIndex, scoresBefore, playerStartedOnBase);
      return getHighSchoolPlaybackResultForPresentedEvent(advanceHighSchoolPresentationCursor(match));
    }
  }
  if (target === "finalOffense" && shouldReachHighSchoolFinalOffensiveMoment(match)) {
    prepareHighSchoolFinalOffensiveMomentFromSimulation(match);
    match.passage = summarizeHighSchoolSimulationSegment(match, startIndex, scoresBefore, playerStartedOnBase);
    return getHighSchoolPlaybackResultForPresentedEvent(advanceHighSchoolPresentationCursor(match));
  }
  let offensiveRoutineOpportunity = null;
  if (batter?.id === "player") {
    const choices = buildOffensiveDecisionChoices(match).filter(choice => isOffensiveDecisionChoiceLegal(choice, match));
    const classification = classifyHighSchoolOffensiveOpportunity(match, choices);
    const density = evaluateHighSchoolOffensiveDecisionDensity(match, classification);
    if (density.allowed) {
      applyHighSchoolOffensiveDecisionDensity(match, classification, density, true);
      prepareHighSchoolMeaningfulOffensiveMomentFromSimulation(match, classification, density);
      match.passage = summarizeHighSchoolSimulationSegment(match, startIndex, scoresBefore, playerStartedOnBase);
      return getHighSchoolPlaybackResultForPresentedEvent(advanceHighSchoolPresentationCursor(match));
    }
    applyHighSchoolOffensiveDecisionDensity(match, classification, density, false);
    offensiveRoutineOpportunity = recordHighSchoolMatchOffensiveOpportunity(match, "routine", choices, classification, density);
  }
  const simulationLogLengthBeforePA = match.simulationLog.length;
  const result = batter ? resolveSimulatedHighSchoolPlateAppearance(match, null, { allowPlayer: batter.id === "player" }) : false;
  if (!result) return false;
  const plateAppearanceEvent = match.simulationLog.slice(simulationLogLengthBeforePA).find(event => event.type === "plateAppearance") || null;
  finalizeHighSchoolMatchDefensiveOpportunity(match, defensiveOpportunity, plateAppearanceEvent, plateAppearanceEvent?.result || "ordinary-pa");
  if (offensiveRoutineOpportunity) {
    offensiveRoutineOpportunity.result = plateAppearanceEvent?.result || "";
    offensiveRoutineOpportunity.simulationLogIndex = Number.isFinite(Number(plateAppearanceEvent?.sequence)) ? Number(plateAppearanceEvent.sequence) : match.simulationLog.length - 1;
  }
  if (isHighSchoolMatchWalkOff(match)) {
    recordHighSchoolMatchSimulationEvent(match, {
      type: "walkOff", inning: match.inning, half: match.half, scores: match.scores
    });
    match.pendingGameSettlement = "walkOff";
  }
  const event = advanceHighSchoolPresentationCursor(match);
  match.passage = summarizeHighSchoolSimulationSegment(match, startIndex, scoresBefore, playerStartedOnBase);
  return getHighSchoolPlaybackResultForPresentedEvent(event);
}

function advanceHighSchoolMatchSimulation(match = player.highSchoolMatch) {
  if (!match || match.completed || !["full_match_flow", "moment_1_resolved", "moment_2_resolved", "moment_3_resolved"].includes(match.simulationPhase)) return false;
  const originalPhase = match.simulationPhase;
  const startIndex = match.simulationLog.length;
  const scoresBefore = { ...match.scores };
  const playerStartedOnBase = match.playerRunnerLocation >= 0;
  let result = false;
  let safety = 0;
  while (isHighSchoolMatchPlaybackPhase(match) && !match.completed && safety < 600) {
    result = advanceHighSchoolMatchPlaybackStep(match);
    if (result === "decision" || result === "gameEnd") break;
    safety += 1;
  }
  if (originalPhase === "moment_1_resolved") {
    match.passage = summarizeHighSchoolSimulationSegment(match, startIndex, scoresBefore, playerStartedOnBase);
  } else if (originalPhase === "moment_2_resolved") {
    const events = match.simulationLog.slice(startIndex).filter(item => item.type === "plateAppearance").length;
    const runs = (match.scores.home - scoresBefore.home) + (match.scores.away - scoresBefore.away);
    match.passage = `你的守備回合完成後，比賽又推進 ${events} 個非玩家打席、產生 ${runs} 分；所有逐局比分都留在記分板上。`;
  }
  return Boolean(result);
}

function resolveHighSchoolYearOneMatch(decision, expectedMomentId = "", randomSource = Math.random) {
  const match = prepareHighSchoolYearOneMatch();
  if (match.simulationPhase === "offensive_agency_ready") {
    const agencySelection = decision === "agencyManual" ? "manual" : decision === "agencySimulate" ? "simulate" : "";
    return agencySelection ? chooseHighSchoolOffensiveAgency(agencySelection, expectedMomentId || match.offensivePlayerAgencyState?.momentId) : false;
  }
  const currentMomentId = getHighSchoolYearOneMomentId(match);
  const legalChoices = getHighSchoolYearOneMatchMomentChoices(match);
  const legalChoice = legalChoices.find(choice => choice.matchDecision === decision);
  const expectedPhase = `moment_${match.momentIndex + 1}_ready`;
  if (match.completed || match.simulationPhase !== expectedPhase || !currentMomentId || (expectedMomentId && expectedMomentId !== currentMomentId) || !legalChoice) return false;
  if (match.completedMoments.some(moment => moment.id === currentMomentId)) return false;
  if (match.momentIndex === 0) {
    if (!advanceHighSchoolYearOneAfterMomentOne(match, legalChoice, null)) return false;
    return `${match.completedMoments.at(-1).outcome}。${match.completedMoments.at(-1).consequence}`;
  }
  if (match.momentIndex === 1) {
    const defensiveResolution = resolveHighSchoolDefensivePlay(match, decision, randomSource);
    const tier = defensiveResolution?.tier || "failure";
    advanceHighSchoolYearOneAfterMomentTwo(match, decision, tier, defensiveResolution);
    return `${match.completedMoments.at(-1).outcome}。${match.completedMoments.at(-1).consequence}`;
  }
  return resolveHighSchoolYearOneFinalMoment(match, legalChoice, null);
}

function resolveHighSchoolAzheEcho() {
  const azhe = player.impression.azhe || {};
  const relationshipEvidence = (azhe.trusts || 0) + (player.relationships.teammateBond || 0) - (azhe.feelsDistance || 0);
  const sharedProof = ["azhe_error_reworked", "azhe_grounder_object", "azhe_hidden_error_seen"].filter(hasFlag);
  const capability = (player.baseballSkills.baseballIQ || 0) + (player.observe || 0) + (player.idealSelf === "棒球理解型" ? 3 : 0);
  let variant = "azhe-guides";
  let influenceDirection = "阿哲影響玩家";
  let cause = "你說完交流賽的打席後，阿哲沒有先問結果，只問你下一次還能替球隊完成什麼。";
  let change = "你把他的問題寫進高二準備表，第一次把失敗後的下一個任務列在成績前面。";
  let recall = "掛電話前，阿哲提醒你：那顆一起重做的滾地球，也不是靠一次結果決定價值。";
  if (relationshipEvidence >= 8 && capability >= 13 && sharedProof.length) {
    variant = "player-guides";
    influenceDirection = "玩家影響阿哲";
    cause = "你把交流賽拆成出局數、跑者與下一棒任務，也提起你們少棒時反覆重做的那顆滾地球。";
    change = "下一個週末，阿哲在地方球隊先畫好補位線，再請隊友各自說出下一球的責任；他沒有再把一次失誤當成誰不適合上場。";
    recall = "練習後他傳來沾著紅土的守備紙，只寫：『這次我先把下一個任務說清楚了。』";
  } else if (relationshipEvidence >= 4 || sharedProof.length) {
    variant = "co-discovery";
    influenceDirection = "彼此共同發現";
    cause = "你和阿哲把交流賽的打席，和少棒時一起重做的滾地球放在同一張紙上。";
    change = "你們各寫下一個仍能完成的任務；幾天後，阿哲把自己的那一條帶進地方球隊的守備練習。";
    recall = "他傳來練習照片時，紙角還留著你寫的那句：『角色不是先發名稱。』";
  }
  const summary = `${cause} ${change} ${recall}`;
  const persistentFlag = `hs_y1_azhe_${variant.replaceAll("-", "_")}`;
  player.highSchoolAzheEcho = {
    variant,
    influenceDirection,
    evidence: [`關係證據 ${relationshipEvidence}`, `能力證據 ${capability}`, ...sharedProof],
    cause,
    change,
    recall,
    summary,
    persistentFlag
  };
  addFlags([persistentFlag]);
  return player.highSchoolAzheEcho;
}

function prepareHighSchoolRivalPressure() {
  const role = player.highSchoolRoleCode || "bench";
  const entry = role === "starter"
    ? ["direct", "賽後高橋直接走到休息區，指出你在第七局做出的選擇"]
    : role === "rotation"
      ? ["limited", "你只在球員通道和高橋短暫交換了那個打席的判讀"]
      : ["observed", "你沒有和高橋正面交談，但拿到他在同場比賽的打席與守備紀錄"];
  player.highSchoolRivalContext = {
    rivalId: "takahashi",
    rivalName: "高橋",
    entryType: entry[0],
    encounter: entry[1],
    yearTwoPressure: "高二必須用第二次正式任務證明：這不是單場偶然，而是可重複的球員用途。"
  };
  addFlags([`hs_y1_takahashi_${entry[0]}`, "hs_y2_external_pressure_set"]);
  return player.highSchoolRivalContext;
}

function processHighSchoolYearOneChoice(eventId, choice) {
  if (player.chapter !== "青棒") return "";
  if (eventId === "high_school_load") {
    const formation = resolveHighSchoolPositionFormation();
    return `${choice.memory} 現任教練把你排為${formation.primaryPosition}${formation.secondaryPositions.length ? `，並保留${formation.secondaryPositions[0]}作為第二守位` : "，暫不設第二守位"}。${formation.context}`;
  }
  if (eventId === "high_school_role") {
    const role = resolveHighSchoolProvisionalRole();
    return `${choice.memory} 綜合守位、能力、信任、健康與準備後，你的暫定角色是「${role.label}」；正式交流賽任務仍保留。`;
  }
  if (eventId === "high_school_long_bench") {
    const match = prepareHighSchoolYearOneMatch();
    return `${choice.memory} 名單確認你將在${match.opponent}的同一場交流賽執行：${match.assignment}。`;
  }
  if (eventId === "high_school_showcase") return resolveHighSchoolYearOneMatch(choice.matchDecision);
  if (eventId === "high_school_call_home") {
    const echo = resolveHighSchoolAzheEcho();
    prepareHighSchoolRivalPressure();
    return `${choice.memory} ${echo.summary}`;
  }
  return "";
}

function completeHighSchoolEntry(options = {}) {
  const state = player?.schoolInvitationState;
  const invitationValidation = validateSchoolInvitationSet(state);
  if (!invitationValidation.ok) {
    showNotice("高中邀請資料不完整，暫時不能進入高中主篇。", "error");
    return false;
  }
  const directStartBypass = state.compatibilityMode === "direct-start-bypass";
  if (!directStartBypass && state.selectionFinalized !== true) {
    showNotice("請先確認一間高中，再進入高中主篇。", "warning");
    return false;
  }
  if (player.chapter === "青棒" && Number(player.age) === 16) return true;
  const schoolContext = getSelectedHighSchoolContext(player);
  applyChapterBreather();
  player.chapter = "青棒";
  player.age = 16;
  player.highSchoolStep = 0;
  player.highSchoolPositionPreference = player.primaryPosition || "";
  player.highSchoolRoleCode = "";
  player.highSchoolYearOneComplete = false;
  player.highSchoolMatch = createInitialPlayer().highSchoolMatch;
  player.highSchoolAzheEcho = createInitialPlayer().highSchoolAzheEcho;
  player.highSchoolRivalContext = createInitialPlayer().highSchoolRivalContext;
  const schoolName = schoolContext?.schoolName || state.legacyExistingSchool?.schoolName || player.highSchoolRoute;
  showNotice(`你進入${schoolName}，高中棒球正式開始。`, "success");
  showCurrentEvent();
  return true;
}

function enterHighSchool() {
  const originType = player.flags?.includes("direct_start_history") ? "synthetic-youth-origin-v1" : "normal-youth-outcomes";
  const settlement = settleHighSchoolEntryCapability(player, { originType });
  if (!settlement.ok) {
    throw new Error(`高中入口能力結算失敗：${settlement.error}${settlement.validation ? ` (${settlement.validation.errors.join(",")})` : ""}`);
  }
  const invitationState = generateSchoolInvitationSet(player, {
    compatibilityMode: originType === "synthetic-youth-origin-v1" ? "direct-start-bypass" : "generation-only"
  });
  if (invitationState.compatibilityMode === "direct-start-bypass" || invitationState.selectionFinalized === true) {
    return completeHighSchoolEntry({ source: invitationState.compatibilityMode });
  }
  clearPendingSchoolInvitationSelection();
  showNotice("你收到四間高中的邀請，請先比較再做決定。", "success");
  showCurrentEvent();
  return true;
}

function enterHighSchoolYearTwo() {
  if (
    player.chapter !== "青棒第一年小結" ||
    player.highSchoolStep < 8 ||
    player.highSchoolYearOneComplete !== true ||
    player.highSchoolMatch?.completed !== true
  ) {
    showNotice("高中第一年尚未完成合法結算，不能提前進入第二年。", "warning");
    return false;
  }
  applyChapterBreather();
  player.chapter = "青棒第二年";
  player.age = 17;
  player.highSchoolYearTwoStep = 0;
  player.highSchoolYearTwoResult = "";
  player.highSchoolYearTwoDetail = "";
  showNotice("高中第二年開始：原有順位與角色將重新接受驗證。", "success");
  showCurrentEvent();
  return true;
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
  junior_season_result: { title: "下一個可以期待的事", text: "高中的邀請即將陸續送到，你很快就得比較條件並決定下一站。", source: "chapter_result" },
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
    queueHighSchoolTrainingAfter(completedEventId);
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
    if (completedEventId === "yamamoto_recommendation") {
      // Normal Route 的正式選校責任已移交 Four-School Invitation；index 9 僅留給明確載入的 legacy state。
      player.juniorSeasonStep = 10;
      evaluateJuniorSeason();
      return;
    }
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

function hasLegacyJuniorSchoolChoice(target = player) {
  const flags = new Set(target?.flags || []);
  return ["chose_powerhouse_high_school", "chose_playing_time_high_school", "chose_balanced_high_school"]
    .some(flag => flags.has(flag));
}

function evaluateJuniorSeason() {
  const legacySchoolChoice = hasLegacyJuniorSchoolChoice(player);
  if (hasFlag("chose_powerhouse_high_school")) {
    player.highSchoolRoute = "強豪高中・高競爭高曝光";
  } else if (hasFlag("chose_playing_time_high_school")) {
    player.highSchoolRoute = "普通高中・穩定出賽";
  } else if (hasFlag("chose_balanced_high_school")) {
    player.highSchoolRoute = "課業並行・保留多重道路";
  } else {
    player.highSchoolRoute = "";
  }
  const schoolFit = evaluateJuniorSchoolFit();
  player.juniorSchoolFit = schoolFit;
  const fitMessage = legacySchoolChoice
    ? `${schoolFit.label}：${player.highSchoolRoute}。${schoolFit.reasons.join("；")}`
    : `${schoolFit.label}：高中招生前條件已結算。${schoolFit.reasons.join("；")}`;
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
  } else if (hasFlag("chose_balanced_high_school")) {
    if (academics >= 6 && burnout <= 4 && injury <= 6) fitScore = 3;
    else if (academics >= 4 && burnout <= 6) fitScore = 2;
    else fitScore = 1;
    if (academics < 4) reasons.push("課業資格不足以支撐並行方案");
    if (burnout >= 6) reasons.push("兩條道路同時維持的負荷過高");
  } else {
    if (academics >= 6 && burnout <= 4 && injury <= 6) fitScore = 3;
    else if (academics >= 4 && burnout <= 6) fitScore = 2;
    else fitScore = 1;
    if (academics < 4) reasons.push("升學準備仍受課業條件限制");
    if (burnout >= 6) reasons.push("目前負荷可能限制接下來的選校空間");
  }

  if (severe) fitScore = 0;
  if (!reasons.length) reasons.push(fitScore === 3 ? "入口與目前的健康、角色及生活條件相符" : "已有入口，但仍需進校後重新驗證");
  const levels = ["failed", "partial", "success", "complete"];
  const labels = ["未完成", "部分成功", "成功", "完全成功"];
  const recovery = injury >= 7 || pain >= 4 ? "進高中前先完成復健與負荷重設" : academics < 4 ? "補足入學資格並建立固定讀書時段" : !hasStableRole ? "在高一前押注一項可上場工具" : "降低倦怠並重新確認升學動機";
  return { level: levels[fitScore], label: labels[fitScore], reasons, recovery };
}

function evaluateHighSchoolYear() {
  if (player.chapter !== "青棒" || player.highSchoolStep < 8 || player.highSchoolMatch?.completed !== true) return false;
  if (!player.highSchoolRoleCode) resolveHighSchoolProvisionalRole();
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
  const formation = player.highSchoolCoachEvaluation || {};
  const role = player.highSchoolRoleContext || {};
  const match = player.highSchoolMatch || {};
  const azhe = player.highSchoolAzheEcho || {};
  const rivalPressure = player.highSchoolRivalContext || {};
  player.highSchoolDetail += `\n\n守位形成：${player.primaryPosition || "未定"}${player.secondaryPosition ? `／${player.secondaryPosition}` : ""}；理想自我與教練評估${formation.idealAlignment || "待確認"}。`;
  player.highSchoolDetail += `\n暫定角色：${role.label || player.highSchoolTeamRole}；機會：${role.opportunity || "正式比賽任務"}。`;
  player.highSchoolDetail += `\n交流賽：${match.opponent}，${match.outcome}；${match.consequence}`;
  player.highSchoolDetail += `\n阿哲回聲：${azhe.influenceDirection || "尚未形成"}；${azhe.summary || "未留下持續證據"}`;
  player.highSchoolDetail += `\n外部壓力：${rivalPressure.rivalName || "高橋"}（${rivalPressure.entryType || "observed"}）；${rivalPressure.yearTwoPressure || "高二需再次驗證角色"}`;
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
  player.highSchoolYearOneComplete = true;
  player.chapter = "青棒第一年小結";
  return true;
}

function evaluateHighSchoolValue() {
  const positionRating = getPositionAssessment(player.seasonPosition)?.rating || 0;
  const utilityDirection = hasFlag("accepted_high_school_utility_role") || hasFlag("high_school_commit_utility");
  const positionDirection = hasFlag("focused_high_school_position");
  const battingDirection = hasFlag("developed_high_school_bat") || hasFlag("high_school_commit_upside");
  const proofReady = player.highSchoolMatch?.completed === true && (hasFlag("showcase_team_task") || hasFlag("showcase_tools") || hasFlag("showcase_baseball_iq"));
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

  const springProductiveResult = [
    "hs_y2_spring_groundout_advance",
    "hs_y2_spring_single_runner_third",
    "hs_y2_spring_single_rbi",
    "hs_y2_spring_extra_base_rbi",
    "hs_y2_spring_infield_hit",
    "hs_y2_spring_bunt_advance",
    "hs_y2_spring_bunt_all_safe",
    "hs_y2_spring_bunt_single"
  ].some(hasFlag);
  const springUtilityResult = [
    "hs_y2_spring_bunt_advance",
    "hs_y2_spring_bunt_all_safe",
    "hs_y2_spring_bunt_single"
  ].some(hasFlag);
  const springBattingResult = [
    "hs_y2_spring_single_runner_third",
    "hs_y2_spring_single_rbi",
    "hs_y2_spring_extra_base_rbi",
    "hs_y2_spring_infield_hit"
  ].some(hasFlag);
  const establishedRoleProof = (
    hasFlag("year_two_role_primary_proof") &&
    (springProductiveResult || hasFlag("year_two_spring_push")) &&
    hasFlag("year_two_autumn_secure_out") &&
    hasFlag("year_two_plan_position")
  ) || (
    hasFlag("year_two_role_utility_proof") &&
    (springUtilityResult || hasFlag("year_two_spring_bunt_read")) &&
    hasFlag("year_two_autumn_utility_hold") &&
    hasFlag("year_two_plan_utility")
  ) || (
    hasFlag("year_two_role_bat_proof") &&
    (springBattingResult || hasFlag("year_two_spring_first_pitch")) &&
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
  pendingTrainingOutcome = null;
  const invitationState = player?.schoolInvitationState;
  if (
    invitationState?.selectionFinalized === true
    && invitationState.compatibilityMode === "generation-only"
    && Number(player.age) < 16
    && !String(player.chapter || "").includes("青棒")
  ) {
    completeHighSchoolEntry({ source: "finalized-choice-resume" });
    return;
  }
  if (isSchoolInvitationChoicePending(player)) {
    isTransitioning = false;
    setChoiceTransitionState(false);
    if (pendingSchoolInvitationSelectionId) renderSchoolInvitationConfirmation();
    else renderSchoolInvitationPresentation();
    return;
  }
  clearPendingSchoolInvitationSelection();
  if (
    player.highSchoolMatch?.completed
    && player.highSchoolMatch.matchExperience?.settled === true
    && player.highSchoolMatch.developmentPresentationCompleted !== true
  ) {
    showHighSchoolCompletedMatchOutcome(player.highSchoolMatch);
    return;
  }
  const eventId = getCurrentEventId();
  if (pendingBaseballGameplay && pendingBaseballGameplay.eventId !== eventId) {
    clearPendingBaseballGameplay();
  }
  if (eventId === "high_school_showcase" && player.highSchoolMatch?.completed && !player.highSchoolMatch.eventSettlementApplied) {
    showHighSchoolCompletedMatchOutcome(player.highSchoolMatch);
    return;
  }
  isTransitioning = false;
  setChoiceTransitionState(false);
  showStory(eventId);
  recordHighSchoolMatchPlaybackTrace("render", eventId, player.highSchoolMatch);
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
  if (eventId === "high_school_showcase") {
    renderHighSchoolYearOneMatch(event, { text, sceneContextHtml, bridgeInHtml, bridgeOutHtml });
  } else if (eventId === "youth_match_grounder") {
    renderIntegratedYouthGrounder(event, { text, sceneContextHtml, competitionFrame, bridgeInHtml, bridgeOutHtml });
  } else if (eventId === "high_school_year_two_spring_game") {
    renderIntegratedHighSchoolSpringAtBat(event, { text, sceneContextHtml, competitionFrame, bridgeInHtml, bridgeOutHtml });
  } else if (isHighSchoolTrainingEvent(eventId)) {
    renderHighSchoolTraining(eventId, event, { text, sceneContextHtml, bridgeInHtml, bridgeOutHtml });
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
  } else if (eventId === "high_school_year_two_spring_game") {
    Object.assign(match, { inning: 5, half: "下", outs: 1, runners: [false, true, false], awayScore: 1, homeScore: 1 });
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

function getDevelopmentTestEffectiveCapabilityDisplay(subject = player, match = subject?.highSchoolMatch) {
  const audit = getDevelopmentMatchPositionTestCapabilityAudit(subject, match);
  if (!audit.active || match?.completed) {
    return Object.freeze({ active: false, source: "canonical-player", position: match?.playerFieldingAssignment || match?.position || "", skills: Object.freeze({}) });
  }
  return Object.freeze({
    active: true,
    source: audit.source,
    position: audit.position,
    benchmarkVersion: audit.benchmarkVersion,
    skills: audit.skills
  });
}

function renderDevelopmentTestCapabilityBar(skill, label, display) {
  const raw = Number(player?.baseballSkills?.[skill]) || 0;
  const skillDisplay = display?.active ? display.skills?.[skill] : null;
  if (!skillDisplay?.overrideApplied) return renderBar(raw, label);
  const effective = Math.max(0, Math.min(20, Number(skillDisplay.effective) || 0));
  const percent = Math.max(0, Math.min(100, Math.round((effective / 20) * 100)));
  return `<div class="stat-row development-test-capability-row" data-development-effective-skill="${escapeHtml(skill)}" data-effective-value="${effective}" data-raw-value="${raw}"><div class="stat-label"><span>${escapeHtml(label || "未命名能力")} <small class="development-test-capability-badge">開發測試</small></span><strong class="development-test-capability-value">${effective}<small>（原始 ${raw}）</small></strong></div><div class="stat-bar"><div class="stat-fill" style="width:${percent}%"></div></div></div>`;
}

function renderDevelopmentTestCapabilityNotice(display) {
  if (!display?.active || !Object.values(display.skills || {}).some(skill => skill.overrideApplied)) return "";
  return `<div class="development-test-capability-notice" role="note"><strong>開發測試能力覆蓋中</strong><span>本場顯示值為比賽實際使用能力；原始球員能力不受影響。</span></div>`;
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
  const primary = player.primaryPosition || ratings[0].position;
  const assessment = getPositionAssessment(primary);
  return `<div class="position-card">
    <div class="position-heading"><span>主要守位</span><strong>${escapeHtml(primary)}</strong><b>${assessment.rating}</b></div>
    <p>第二守位：${escapeHtml(player.secondaryPositions?.[0] || "尚未設定")}</p>
    <p>投打：${escapeHtml(formatHandedness(player.bats, player.throws))}</p>
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
  const development = getDevelopmentDebugSnapshot(player);
  return {
    goalId: goal?.id || "none",
    goalProgress: goal ? getGoalProgressText(goal) : "none",
    goalTier: goal?.tier || "none",
    estimatedResult: player.startingCompetition?.result || (competition.playerRating - competition.rivalRating >= 4 ? "先發候選" : competition.playerRating - competition.rivalRating >= -3 ? "並列競爭" : competition.playerRating - competition.rivalRating >= -10 ? "第一替補" : "後段替補"),
    competition,
    positionRating: position?.rating || 0,
    positionStrengths: position?.strengths || "尚未形成",
    chapterSkillPoints: player.balanceDebug?.chapterSkillPoints || 0,
    load: { pressure: player.pressure, fatigue: player.body.fatigue, injuryRisk: player.body.injuryRisk, pain: player.body.pain, burnout: player.burnout },
    development
  };
}

function resetStatusPanelDisclosureState() {
  Object.keys(statusPanelDisclosureState).forEach(key => delete statusPanelDisclosureState[key]);
  const statusRoot = document?.getElementById?.("status");
  if (statusRoot) statusRoot.innerHTML = "";
}

function getStatusPanelDisclosureKey(details) {
  return details?.dataset?.statusDisclosure || details?.getAttribute?.("data-status-disclosure") || "";
}

function rememberStatusPanelDisclosure(details) {
  const key = getStatusPanelDisclosureKey(details);
  if (!key) return false;
  statusPanelDisclosureState[key] = Boolean(details.open);
  return true;
}

function captureStatusPanelDisclosureState(statusRoot) {
  statusRoot?.querySelectorAll?.("details.status-section[data-status-disclosure]").forEach(rememberStatusPanelDisclosure);
}

function ensureStatusPanelDisclosureTracking(statusRoot) {
  if (!statusRoot?.addEventListener || statusPanelDisclosureBoundRoots.has(statusRoot)) return false;
  statusRoot.addEventListener("toggle", event => {
    const details = event.target;
    if (!details?.classList?.contains?.("status-section")) return;
    rememberStatusPanelDisclosure(details);
  }, true);
  statusPanelDisclosureBoundRoots.add(statusRoot);
  return true;
}

function getRememberedStatusPanelDisclosure(disclosureKey, defaultOpen = false) {
  return Object.prototype.hasOwnProperty.call(statusPanelDisclosureState, disclosureKey)
    ? statusPanelDisclosureState[disclosureKey]
    : Boolean(defaultOpen);
}

function renderStatusSection(title, content, options = {}) {
  const safeContent = typeof content === "string" ? content.trim() : "";
  if (!safeContent) return "";
  const className = ["status-section", options.className || ""].filter(Boolean).join(" ");
  const disclosureKey = options.disclosureKey || "";
  const open = disclosureKey ? getRememberedStatusPanelDisclosure(disclosureKey, options.open) : Boolean(options.open);
  return `<details class="${className}"${disclosureKey ? ` data-status-disclosure="${escapeHtml(disclosureKey)}"` : ""}${open ? " open" : ""}>
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
  const selectedSchool = getSelectedHighSchoolContext(player);
  const items = [
    `<span><small>年齡</small><strong>${Number(player.age) || 0} 歲</strong></span>`,
    player.chapter ? `<span><small>階段</small><strong>${escapeHtml(player.chapter)}</strong></span>` : "",
    player.seasonPosition ? `<span><small>守位</small><strong>${escapeHtml(player.seasonPosition)}</strong></span>` : "",
    player.roleIdentity?.primary ? `<span><small>角色</small><strong>${escapeHtml(player.roleIdentity.primary)}</strong></span>` : "",
    selectedSchool?.schoolName ? `<span><small>高中</small><strong>${escapeHtml(selectedSchool.schoolName)}</strong></span>` : "",
    player.route && player.route !== "尚未定型" ? `<span><small>路線</small><strong>${escapeHtml(player.route)}</strong></span>` : ""
  ].filter(Boolean);
  return items.length ? `<div class="status-summary__identity">${items.join("")}</div>` : "";
}

function getReadableAbilityProfile() {
  if (!player.characterGenesis?.completed) return null;
  const currentValues = {
    ballSense: Number(player.ballSense) || 0,
    observe: Number(player.observe) || 0,
    fitness: Number(player.fitness) || 0,
    batting: Number(player.baseballSkills?.batting) || 0,
    baseRunning: Number(player.baseballSkills?.baseRunning) || 0,
    baseballIQ: Number(player.baseballSkills?.baseballIQ) || 0
  };
  const ranked = Object.entries(currentValues).sort((a, b) => b[1] - a[1] || CHARACTER_GENESIS_ABILITY_KEYS.indexOf(a[0]) - CHARACTER_GENESIS_ABILITY_KEYS.indexOf(b[0]));
  const strongest = ranked.slice(0, 2).map(([key]) => genesisAbilityLabels[key]);
  const weakest = ranked.slice(-2).reverse().map(([key]) => genesisAbilityLabels[key]);
  const allocated = CHARACTER_GENESIS_ABILITY_KEYS
    .filter(key => Number(player.characterGenesis.allocation?.[key]) > 0)
    .map(key => genesisAbilityLabels[key]);
  const tendencyDescriptions = {
    ballSense: "以球感調整動作",
    observe: "先觀察再判斷",
    fitness: "靠身體條件承擔任務",
    batting: "以打擊創造入口",
    baseRunning: "用跑壘擴大機會",
    baseballIQ: "提早讀懂比賽局面"
  };
  return {
    tendency: tendencyDescriptions[ranked[0]?.[0]] || "仍在形成",
    strongest: strongest.join("、"),
    weakest: weakest.join("、"),
    rolledShape: formatCharacterGenesisShape(player.characterGenesis.shape) || "舊存檔承接",
    allocated: allocated.length ? allocated.join("、") : "舊存檔承接",
    idealSelf: player.idealSelf || "尚未形成",
    primaryPosition: player.primaryPosition || "尚未固定",
    handedness: formatHandedness(player.bats, player.throws)
  };
}

function renderReadableAbilityProfile() {
  const profile = getReadableAbilityProfile();
  if (!profile) return "";
  return `<section class="ability-profile-summary" aria-labelledby="abilityProfileSummaryTitle">
    <h3 id="abilityProfileSummaryTitle">球員概況</h3>
    <p><small>目前傾向</small><strong>${escapeHtml(profile.tendency)}</strong></p>
    <div class="ability-profile-summary__shape"><span><small>創角擲到</small><strong>${escapeHtml(profile.rolledShape)}</strong></span><span><small>加點後著重</small><strong>${escapeHtml(profile.allocated)}</strong></span></div>
    <p>明顯優勢：${escapeHtml(profile.strongest)}　｜　仍待磨練：${escapeHtml(profile.weakest)}</p>
    <div class="ability-profile-summary__identity"><span><small>憧憬球員</small><strong>${escapeHtml(profile.idealSelf)}</strong></span><span><small>目前主守</small><strong>${escapeHtml(profile.primaryPosition)}</strong></span><span><small>投打</small><strong>${escapeHtml(profile.handedness)}</strong></span></div>
  </section>`;
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
    ability: renderReadableAbilityProfile(),
    body: renderCurrentBodySummary(),
    pending: typeof options.pendingHtml === "string" ? options.pendingHtml : "",
    competition: typeof options.competitionHtml === "string" ? options.competitionHtml : ""
  };
}

function renderCurrentStatusSummary(summary) {
  const content = [summary.goal, summary.identity, summary.ability, summary.body, summary.pending, summary.competition].filter(Boolean).join("");
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
  const statusRoot = document.getElementById("status");
  ensureStatusPanelDisclosureTracking(statusRoot);
  captureStatusPanelDisclosureState(statusRoot);
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
  const developmentCapabilityDisplay = getDevelopmentTestEffectiveCapabilityDisplay(player, player.highSchoolMatch);
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
  const developmentDebug = debug?.development;
  const lastDevelopment = developmentDebug?.lastResult;
  const progressDebug = developmentDebug
    ? Object.entries(developmentDebug.skillProgress).filter(([, value]) => value > 0).map(([skill, value]) => `${skill}:${value}`).join("／") || "尚無累積"
    : "";
  const debugHtml = debug ? `<div class="balance-debug"><strong>平衡測試</strong><small>目標 ${escapeHtml(debug.goalId)}｜${escapeHtml(debug.goalTier)}｜${escapeHtml(debug.goalProgress)}</small><small>預估 ${escapeHtml(debug.estimatedResult)}</small><small>競爭：技能 ${Math.round(debug.competition.skillScore)}／信任 ${Math.round(debug.competition.trustScore)}／表現 ${Math.round(debug.competition.performanceScore)}／準備 ${debug.competition.preparationScore}／角色 ${debug.competition.roleScore}</small><small>守位評分 ${debug.positionRating}｜本章技能 +${debug.chapterSkillPoints}</small><small>負荷：壓力 ${debug.load.pressure}／疲勞 ${debug.load.fatigue}／傷病 ${debug.load.injuryRisk}／倦怠 ${debug.load.burnout}</small><small>Development：${escapeHtml(progressDebug)}</small>${lastDevelopment ? `<small>最近：${escapeHtml(lastDevelopment.sourceId)}／${escapeHtml(lastDevelopment.targetSkill)} +${lastDevelopment.progressGained}｜trait ${lastDevelopment.diagnostics.traitScore.toFixed(2)}／difficulty ${lastDevelopment.diagnostics.skillDifficultyModifier.toFixed(2)}／bias ${lastDevelopment.diagnostics.biasModifier.toFixed(2)}／variation ${lastDevelopment.diagnostics.variation.toFixed(3)}</small>` : ""}</div>` : "";
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
    ${showSkills ? `<div class="status-subgroup"><h3>守位與能力連結</h3>${renderPositionPanel()}</div><div class="status-subgroup"><h3>棒球技能</h3>${renderDevelopmentTestCapabilityNotice(developmentCapabilityDisplay)}${Array.from(new Set(["catching", "throwing", "batting", "baseRunning", "baseballIQ", ...(getPositionAssessment(player.seasonPosition || calculatePositionRatings()[0].position)?.skills || [])])).map(key => renderDevelopmentTestCapabilityBar(key, skillLabels[key], developmentCapabilityDisplay)).join("")}</div><div class="offense-card"><strong>進攻評價 ${offensiveRating}</strong><p>${offensiveValue ? `目前可提供 +${offensiveValue} 生涯評估修正；具備靠打擊換取名單機會的可能。` : "打擊仍是輔助能力，尚未形成足以改變名單的工具。"}</p></div>` : ""}
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
  statusRoot.innerHTML = `
    ${renderCurrentStatusSummary(summary)}
    <div class="status-details" aria-label="完整詳細資料">
      ${renderStatusSection("能力與技能", abilityHtml, { disclosureKey: "abilities", open: true })}
      ${renderStatusSection("人物關係", relationshipHtml, { disclosureKey: "relationships" })}
      ${renderStatusSection("成長與身份", growthHtml, { disclosureKey: "growth" })}
      ${renderStatusSection("章節評估", evaluationHtml, { disclosureKey: "evaluations" })}
      ${renderStatusSection("生涯與市場", careerHtml, { disclosureKey: "career" })}
      ${debug ? renderStatusSection("系統／測試資訊", `${debugHtml}${debugRelationshipHtml}`, { className: "status-section--debug", disclosureKey: "debug" }) : ""}
    </div>`;
  const selectedSchool = getSelectedHighSchoolContext(player);
  document.getElementById("player-info").innerHTML = `<strong>${escapeHtml(player.name || "尚未建立角色")}</strong><span>${player.age} 歲</span><span>${escapeHtml(player.chapter)}</span><span>${escapeHtml(player.route)}</span>${selectedSchool?.schoolName ? `<span>高中：${escapeHtml(selectedSchool.schoolName)}</span>` : ""}<span>${escapeHtml(formatHandedness(player.bats, player.throws))}</span><span>理想球員：${escapeHtml(player.idealSelf || "尚未形成")}</span>`;
}

updateStatus();
