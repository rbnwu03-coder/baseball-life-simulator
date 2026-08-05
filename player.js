const SAVE_VERSION = 13;

// Phase 2：創角 Identity 的唯一 runtime 合法值來源。
// UI 與創角流程可以呈現或使用這些值，但輸入是否合法由此契約判定。
var PlayerIdentityOptions = Object.freeze({
  origins: Object.freeze(["prove", "understand", "belong"]),
  idealSelf: Object.freeze(["全能型", "技術鑽研型", "直覺天賦型", "關鍵時刻型", "團隊核心型"])
});

function createInitialPlayer(name = "") {
  return {
    saveVersion: SAVE_VERSION,
    name,
    origin: PlayerIdentityOptions.origins[0],
    idealSelf: "",
    age: 10,
    chapter: "十歲暑假",
    day: 1,
    phase: "morning",
    route: "尚未定型",
    currentGoal: "走近球場，完成今天的選擇",
    shortGoal: "確認自己想用什麼方式靠近棒球",
    longGoal: "找到能留在棒球裡的位置",
    pendingEvents: [],
    callbacks: [],
    consequences: [],
    lifeThemes: { fear: 0, trust: 0, competition: 0, responsibility: 0, freedom: 0 },
    goalState: { current: null, short: null, chapter: null, completedGoals: [], recentProgress: [] },
    trainingFocus: { current: "", streak: 0 },
    balanceDebug: { chapter: "", chapterSkillPoints: 0 },
    juniorSchoolFit: { level: "", reasons: [], recovery: "" },
    highSchoolValueAssessment: { level: "", direction: "", skillReady: false, proofReady: false, reasons: [], recovery: "" },
    careerValue: { current: 50, peak: 50, minimum: 50, trend: "stable", history: [50] },
    roleIdentity: { primary: "", previous: [], archetype: "", previousArchetypes: [] },
    careerArc: { stage: "emerging", peaks: 0, valleys: 0, reinventions: 0, lostRole: "" },
    turningPoints: [],
    marketEvaluation: { offense: 0, defense: 0, utility: 0, leadership: 0, health: 0 },
    lifeEvents: [],
    emotionalPeaks: [],
    lowPoints: [],
    npcEmotionalCallbacks: [],
    chapterEndings: [],
    replayMemories: [],
    signatureScenes: [],
    symbolObjects: [],
    narrativeThread: { id: "", route: "", title: "", question: "", coreQuestion: "", currentBeat: 0, totalBeats: 0, previousEventId: "", previousOutcome: "", lastOutcome: "", activeTension: "", nextTension: "", nextPossibility: "", supportingNpc: "", status: "inactive", history: [] },
    continuityOutcomes: [],
    relationshipPayoffs: [],
    aspirationState: { current: "", reason: "", nextPossibility: "", sourceEventId: "", status: "active", worldResponse: "" },
    aspirationMoments: [],
    forcedEventId: "",
    startingCompetition: {
      active: false,
      position: "",
      rivalName: "",
      playerRating: 0,
      rivalRating: 0,
      result: "",
      detail: "",
      initialGap: null
    },
    ballSense: 0,
    observe: 0,
    fitness: 0,
    confidence: 0,
    resilience: 0,
    instinct: 0,
    discipline: 0,
    responsibility: 0,
    familySupport: 0,
    coachAttention: 0,
    pressure: 0,
    personality: {
      brave: 0,
      thoughtful: 0,
      stubborn: 0,
      kind: 0,
      ambitious: 0,
      reliable: 0,
      selfish: 0,
      emotional: 0
    },
    impression: {
      coach: { dependable: 0, competitive: 0, immature: 0, leader: 0 },
      azhe: { trusts: 0, depends: 0, feelsDistance: 0, admires: 0 },
      takahashi: { respect: 0, rivalry: 0, underestimate: 0 },
      family: { pride: 0, worry: 0 }
    },
    characterArc: {
      azhe: "neutral",
      takahashi: "neutral",
      yamamoto: "neutral"
    },
    baseballSkills: {
      catching: 0,
      throwing: 0,
      batting: 0,
      baseRunning: 0,
      baseballIQ: 0,
      armStrength: 0,
      reaction: 0,
      range: 0,
      blocking: 0,
      gameCalling: 0,
      control: 0,
      pitchStamina: 0
    },
    flags: [],
    memories: [],
    ending: "",
    endingDetail: "",
    chapterOneEnding: "",
    chapterOneEndingDetail: "",
    chapter2Phase: "intro",
    chapter2Day: 1,
    chapter2Step: 0,
    chapter2Result: "",
    chapter2ResultDetail: "",
    chapter2CoachComment: "",
    relationships: {
      coachTrust: 0,
      teammateBond: 0,
      rivalRespect: 0,
      rivalCompetition: 0
    },
    positionAffinity: {
      infield: 0,
      outfield: 0,
      catcher: 0,
      pitcher: 0
    },
    seasonStep: 0,
    seasonPerformance: 0,
    seasonErrors: 0,
    seasonResult: "",
    seasonResultDetail: "",
    seasonPosition: "",
    secondaryPosition: "",
    seasonRole: "",
    seasonCoachComment: "",
    careerPrimaryTool: "尚未形成",
    competitionStep: 0,
    competitionResult: "",
    competitionDetail: "",
    body: {
      stamina: 10,
      fatigue: 0,
      recovery: 5,
      maturity: 0,
      injuryRisk: 0,
      pain: 0
    },
    juniorStep: 0,
    juniorResult: "",
    juniorDetail: "",
    juniorPath: "",
    academics: 5,
    motivation: 8,
    burnout: 0,
    juniorSeasonStep: 0,
    juniorSeasonResult: "",
    juniorSeasonDetail: "",
    highSchoolRoute: "",
    highSchoolStep: 0,
    highSchoolTeamRole: "",
    highSchoolResult: "",
    highSchoolDetail: "",
    highSchoolYearTwoStep: 0,
    highSchoolYearTwoResult: "",
    highSchoolYearTwoDetail: "",
    exposure: 0,
    scoutEvaluation: 0,
    dormStress: 0,
    criticalYearStep: 0,
    recentPerformance: 0,
    reputation: 0,
    careerExit: "",
    criticalYearResult: "",
    criticalYearDetail: "",
    transitionStep: 0,
    transitionResult: "",
    transitionDetail: "",
    organizationRole: "",
    finances: 5,
    developmentStep: 0,
    developmentResult: "",
    developmentDetail: "",
    marketOutcome: "",
    matchState: {
      inning: 4,
      half: "上",
      homeScore: 1,
      awayScore: 2,
      outs: 1,
      runners: [true, false, false]
    },
    completed: false,
    lastEventTitle: ""
  };
}

// Player 仍是完整且唯一的相容 Snapshot；此 Boundary 只建立正式讀取入口，
// 並收回創角時 name、origin、idealSelf 三個欄位的原子寫入。
var PlayerDataBoundary = (() => {
  const deepClone = value => JSON.parse(JSON.stringify(value));

  function createInitialSnapshot() {
    return createInitialPlayer();
  }

  function getSnapshot() {
    return deepClone(player);
  }

  function getIdentity() {
    return {
      name: player.name,
      origin: player.origin,
      idealSelf: player.idealSelf
    };
  }

  function validateIdentityInput(identityInput) {
    if (!identityInput || typeof identityInput !== "object" || Array.isArray(identityInput)) {
      return { ok: false, error: "角色身分資料格式不正確。" };
    }

    const name = typeof identityInput.name === "string" ? identityInput.name.trim() : "";
    if (!name) {
      return { ok: false, error: "請先輸入名字。" };
    }

    if (!PlayerIdentityOptions.origins.includes(identityInput.origin)) {
      return { ok: false, error: "角色起點不是目前允許的選項。" };
    }

    if (!PlayerIdentityOptions.idealSelf.includes(identityInput.idealSelf)) {
      return { ok: false, error: "請先選擇你最憧憬的球員形象。" };
    }

    return {
      ok: true,
      identity: {
        name,
        origin: identityInput.origin,
        idealSelf: identityInput.idealSelf
      }
    };
  }

  function initializeIdentity(identityInput) {
    const validation = validateIdentityInput(identityInput);
    if (!validation.ok) return validation;

    const identity = validation.identity;
    player.name = identity.name;
    player.origin = identity.origin;
    player.idealSelf = identity.idealSelf;

    return {
      ok: true,
      identity: getIdentity()
    };
  }

  function restoreSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return { ok: false, error: "Player Snapshot 格式不正確。" };
    }

    try {
      player = deepClone(snapshot);
      return { ok: true, snapshot: getSnapshot() };
    } catch (error) {
      return { ok: false, error: "Player Snapshot 無法還原。" };
    }
  }

  function isIdentityInitialized() {
    return validateIdentityInput(getIdentity()).ok;
  }

  return Object.freeze({
    createInitialSnapshot,
    getSnapshot,
    getIdentity,
    initializeIdentity,
    restoreSnapshot,
    isIdentityInitialized,
    validateIdentityInput
  });
})();

if (typeof window !== "undefined") {
  window.PlayerIdentityOptions = PlayerIdentityOptions;
  window.PlayerDataBoundary = PlayerDataBoundary;
}

let player = createInitialPlayer();

// 保留 classic-script 的全域 player 相容入口，並讓外部替換仍同步到唯一 Snapshot。
if (typeof window !== "undefined" && !Object.getOwnPropertyDescriptor(window, "player")) {
  Object.defineProperty(window, "player", {
    configurable: true,
    get: () => player,
    set: value => {
      player = value;
    }
  });
}

const statLabels = {
  ballSense: "球感",
  observe: "觀察",
  fitness: "體能",
  confidence: "自信",
  resilience: "韌性",
  instinct: "野性",
  discipline: "紀律",
  responsibility: "責任感",
  familySupport: "家庭支持",
  coachAttention: "教練注意",
  pressure: "壓力"
};

const skillLabels = {
  catching: "接球",
  throwing: "傳球",
  batting: "打擊",
  baseRunning: "跑壘",
  baseballIQ: "棒球理解"
  ,armStrength: "臂力"
  ,reaction: "反應"
  ,range: "守備範圍"
  ,blocking: "擋球"
  ,gameCalling: "配球／指揮"
  ,control: "控球"
  ,pitchStamina: "投球體力"
};

const phaseLabels = { morning: "上午", afternoon: "下午", night: "晚上", ending: "小結" };
