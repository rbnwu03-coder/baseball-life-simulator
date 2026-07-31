var CompetitionPresentation = (() => {
  const COMPETITION_TYPES = deepFreeze({
    intrasquad_scrimmage: {
      id: "intrasquad_scrimmage",
      label: "隊內紅白賽",
      purpose: "觀察與嘗試",
      description: "在同一支球隊內分組，讓教練觀察球員如何把練習帶進局面。"
    },
    exchange_game: {
      id: "exchange_game",
      label: "交流賽",
      purpose: "適應陌生球隊",
      description: "面對不熟悉的節奏、球路與場地，驗證臨場調整能力。"
    },
    official_league: {
      id: "official_league",
      label: "正式聯賽",
      purpose: "累積戰績與名單評價",
      description: "結果會進入球季紀錄，也會影響教練後續如何分配任務。"
    },
    tournament: {
      id: "tournament",
      label: "錦標賽",
      purpose: "晉級與淘汰",
      description: "每一場都直接改變能否繼續前進，壓力集中且容錯較低。"
    },
    coach_test: {
      id: "coach_test",
      label: "教練測驗",
      purpose: "確認目前可交付的任務",
      description: "以守位輪測、基本動作或臨時指令觀察球員當下的可用性。"
    },
    fielding_drill: {
      id: "fielding_drill",
      label: "守備演練",
      purpose: "驗證站位與處理選擇",
      description: "不以勝負為主，而是觀察球員能否完成守位責任。"
    },
    batting_test: {
      id: "batting_test",
      label: "打擊測驗",
      purpose: "驗證攻擊策略",
      description: "觀察擊球、選球與面對特定球路時的處理方式。"
    },
    game_calling_drill: {
      id: "game_calling_drill",
      label: "配球練習",
      purpose: "驗證局勢閱讀與指揮",
      description: "讓捕手、投手與守備共同確認暗號、配球和場上溝通。"
    },
    teammate_challenge: {
      id: "teammate_challenge",
      label: "隊友合作挑戰",
      purpose: "驗證合作與責任分配",
      description: "用共同任務觀察球員是否能讓隊形與隊友一起運作。"
    }
  });

  const COMPETITION_RULES = deepFreeze({
    youth: {
      id: "youth",
      label: "少棒",
      innings: 6,
      commonEvents: ["隊內紅白賽", "交流賽", "正式聯賽", "錦標賽"],
      seasonRhythm: "校隊日常與基本功之間穿插短局數驗證，再以聯賽或盃賽集中回收。",
      note: "常見正式賽採六局；實際提前結束與延長規定依各賽事規程。"
    },
    junior: {
      id: "junior",
      label: "青少棒",
      innings: 7,
      commonEvents: ["隊內對抗", "交流賽", "學生聯賽", "全國錦標賽"],
      seasonRhythm: "訓練與盃賽密度提高，位置競爭和升學觀察開始與正式成績連動。",
      note: "常見正式賽採七局；實際賽制依學生聯賽或盃賽規程。"
    },
    highSchool: {
      id: "highSchool",
      label: "青棒",
      innings: 7,
      commonEvents: ["校內紅白賽", "交流賽", "高中聯賽", "盃賽／邀請賽"],
      seasonRhythm: "秋冬賽事、聯賽與邀請賽交錯，球員角色、曝光與身體負荷同時累積。",
      note: "國內高中賽事常見七局制，但部分賽事或階段可能採不同規定。"
    },
    college: {
      id: "college",
      label: "大學",
      innings: 9,
      commonEvents: ["隊內賽", "熱身交流賽", "大專聯賽", "邀請賽"],
      seasonRhythm: "學期、訓練與聯賽分段推進，公開組與一般組的賽制及競爭密度不同。",
      note: "公開一級等高層級賽事常見九局；實際仍依級組與當屆規程。"
    },
    amateur: {
      id: "amateur",
      label: "成棒",
      innings: 9,
      commonEvents: ["熱身賽", "甲組春季聯賽", "爆米花聯盟", "全國性盃賽"],
      seasonRhythm: "聯賽與盃賽形成主要曝光，工作、訓練與跨隊競爭共同影響可用性。",
      note: "正式賽通常依成人棒球九局架構，細節依各項賽事規程。"
    },
    professional: {
      id: "professional",
      label: "職棒",
      innings: 9,
      commonEvents: ["熱身賽", "例行賽", "季後賽", "總冠軍賽"],
      seasonRhythm: "長期例行賽累積排名，再由季後賽集中決定年度結果。",
      note: "正式比賽採九局；延長、和局與特殊規則依聯盟當季辦法。"
    }
  });

  const YOUTH_SEASON_FLOW = deepFreeze([
    {
      id: "season_arrival",
      label: "球季報到",
      kind: "story",
      eventIds: ["youth_season_intro"]
    },
    {
      id: "position_validation",
      label: "守位輪測",
      kind: "validation",
      eventIds: ["youth_position_trial"]
    },
    {
      id: "relationship_breath",
      label: "收操後",
      kind: "story",
      eventIds: ["youth_teammate"]
    },
    {
      id: "intrasquad_validation",
      label: "隊內紅白賽",
      kind: "validation",
      eventIds: ["youth_bench"]
    },
    {
      id: "league_validation",
      label: "正式聯賽",
      kind: "validation",
      eventIds: [
        "youth_match_entry",
        "youth_match_grounder",
        "youth_match_outfield",
        "youth_match_catcher",
        "youth_match_pitcher",
        "youth_match_mistake",
        "youth_match_after"
      ]
    }
  ]);

  const VALIDATION_EVENTS = deepFreeze({
    youth_position_trial: validation({
      typeId: "coach_test",
      competitionId: "youth_position_rotation",
      competitionTitle: "少棒第一季・守位輪測",
      stageLabel: "第一個驗證點",
      transition: "球季報到後，山本先用十二顆球確認每個人的起點。",
      inningSummary: "第 2 輪｜每個位置剩 3 球",
      connector: "四項輪測都已完成；從四個收尾任務選一項，山本會用最後三球決定你的初始分組。",
      abilityFocus: "observe",
      tone: "test",
      showScore: false
    }),
    youth_bench: validation({
      typeId: "intrasquad_scrimmage",
      competitionId: "youth_first_intrasquad",
      competitionTitle: "少棒第一季・第一次紅白賽",
      stageLabel: "第二個驗證點",
      transition: "收操後的練習累積成第一張紅白賽名單，你暫時留在候補欄。",
      inningSummary: "三局下｜候補名單",
      connector: "這場紅白賽仍在進行；決定你如何留在板凳上，直到最後半局與收操結束。",
      abilityFocus: "observe",
      tone: "scrimmage",
      showScore: false
    }),
    youth_match_entry: officialValidation("第一次上場", "紅白賽已經結束；幾次練習後，正式聯賽名單把你留在候補欄，直到比賽中段教練叫到名字。", "接下教練指定的守位，先確認第一個出局點。", "pressure"),
    youth_match_grounder: officialValidation("第一個守備", "你已站進守區；同一個比分、出局數與跑者都沒有重來。", "一壘跑者已起跑：決定要穩拿一個出局，或挑戰前位跑者。", "baseballIQ"),
    youth_match_outfield: officialValidation("第一個守備", "你已站進右外野；同一個比分、出局數與跑者都沒有重來。", "判斷落點與回傳方向，別讓深遠飛球越過身後。", "observe"),
    youth_match_catcher: officialValidation("第一次指揮", "你已蹲到本壘後方；同一個比分、出局數與跑者都沒有重來。", "替投手選下一球，並把跑者與整組守備一起算進去。", "baseballIQ"),
    youth_match_pitcher: officialValidation("第一個打者", "你已踩上投手板；同一個比分、出局數與跑者都沒有重來。", "在打者與跑者同時施壓前，決定第一個對決策略。", "observe"),
    youth_match_mistake: officialValidation("下一次回應", "攻守交換後，你回到同一場比賽；上一個處理仍留在記錄裡。", "先確認基本站位，再決定這一球要靠自己、隊友或更冒險的動作。", "pressure"),
    youth_match_after: officialValidation("終場整理", "最後一個出局數已經完成，整場的選擇一起進入賽後評估。", "比賽結束了；決定你先和誰一起理解這場球。", "baseballIQ")
  });

  function validation(definition) {
    return Object.assign({
      category: "validation-event",
      levelId: "youth"
    }, definition);
  }

  function officialValidation(stageLabel, transition, connector, abilityFocus) {
    return validation({
      typeId: "official_league",
      competitionId: "youth_first_league_game",
      competitionTitle: "少棒第一季・第一場正式聯賽",
      stageLabel,
      transition,
      inningSummary: "依目前局面延續",
      connector,
      abilityFocus,
      tone: "official",
      showScore: true
    });
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCompetitionTypes() {
    return deepFreeze(clone(COMPETITION_TYPES));
  }

  function getCompetitionRules() {
    return deepFreeze(clone(COMPETITION_RULES));
  }

  function getCompetitionRule(levelId) {
    return COMPETITION_RULES[levelId]
      ? deepFreeze(clone(COMPETITION_RULES[levelId]))
      : null;
  }

  function getValidationEvent(eventId) {
    return VALIDATION_EVENTS[eventId]
      ? deepFreeze(clone(VALIDATION_EVENTS[eventId]))
      : null;
  }

  function isValidationEvent(eventId) {
    return typeof eventId === "string" && Boolean(VALIDATION_EVENTS[eventId]);
  }

  function getYouthSeasonFlow() {
    return deepFreeze(clone(YOUTH_SEASON_FLOW));
  }

  function getFlowIndex(eventId) {
    return YOUTH_SEASON_FLOW.findIndex(item => item.eventIds.includes(eventId));
  }

  function describePressure(value) {
    if (value >= 8) return "你把手套握得太緊，直到裁判催促才重新鬆開。";
    if (value >= 4) return "場邊聲音靠得很近，你仍能先確認跑者和隊友的位置。";
    return "你聽得見隊友的喊聲，也能照順序確認眼前任務。";
  }

  function describeObservation(value) {
    if (value >= 8) return "你先看見站位和對手的第一步，才把目光移回球。";
    if (value >= 4) return "你注意到一個可用線索，仍要等球進場才能確認。";
    return "你的目光先跟著球移動，還沒來得及看完整個隊形。";
  }

  function describeBaseballIQ(value) {
    if (value >= 8) return "出局數、跑者和下一個傳球點，已經連成同一個處理順序。";
    if (value >= 4) return "你知道接到球不是結束，還要先找下一個出局點。";
    return "教練的站位指示仍要多想一下，你先守住最基本的任務。";
  }

  function createAbilityCues(abilities = {}, focus = "observe") {
    const pressure = finite(abilities.pressure);
    const observe = finite(abilities.observe);
    const baseballIQ = finite(abilities.baseballIQ);
    const cues = {
      pressure: { id: "pressure", label: "此刻的節奏", value: pressure, description: describePressure(pressure) },
      observe: { id: "observe", label: "你先注意到", value: observe, description: describeObservation(observe) },
      baseballIQ: { id: "baseballIQ", label: "局面連起來", value: baseballIQ, description: describeBaseballIQ(baseballIQ) }
    };
    return deepFreeze([cues[focus] || cues.observe]);
  }

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
  }

  function normalizeMatchState(matchState = {}) {
    const runners = Array.isArray(matchState.runners)
      ? [0, 1, 2].map(index => Boolean(matchState.runners[index]))
      : [false, false, false];
    return {
      inning: Math.max(0, Math.floor(finite(matchState.inning))),
      half: typeof matchState.half === "string" ? matchState.half : "",
      outs: Math.min(3, Math.floor(finite(matchState.outs))),
      awayScore: Math.floor(finite(matchState.awayScore)),
      homeScore: Math.floor(finite(matchState.homeScore)),
      runners
    };
  }

  function getRunnerLabel(runners) {
    const baseLabels = ["一壘", "二壘", "三壘"];
    const occupied = runners.reduce((labels, value, index) => value ? labels.concat(baseLabels[index]) : labels, []);
    return occupied.length ? `${occupied.join("、")}有人` : "無人在壘";
  }

  function resolveTransition(eventId, definition, context) {
    if (eventId === "youth_match_mistake") {
      if (typeof context.previousPlayTransition === "string" && context.previousPlayTransition.trim()) {
        return `${context.previousPlayTransition} 一局過去，五局上的新守備把你叫回同一場比賽。`;
      }
      return finite(context.seasonErrors) > 0
        ? "攻守交換後，你回到同一場比賽；上一個瑕疵仍留在記分板旁的紀錄裡。"
        : "攻守交換後，你回到同一場比賽；第一個任務完成了，比分仍沒有拉開。";
    }
    if (eventId === "youth_match_after") {
      return finite(context.seasonErrors) > 0
        ? "六局結束，完成的任務與留下的瑕疵一起進入賽後評估。"
        : "六局結束，你完成的每個任務一起進入賽後評估。";
    }
    return definition.transition;
  }

  function resolveTask(eventId, definition, context) {
    if (eventId !== "youth_match_mistake") return definition.connector;
    const positionTasks = {
      "內野手": "回到基本站位，先選定這一球最穩定的出局點。",
      "外野手": "先守住身後，再決定接球後要把球送回哪裡。",
      "捕手": "先把球留在本壘前，再喊出跑者與下一個傳球點。",
      "投手": "先把下一球送進捕手手套，再重新建立對決節奏。"
    };
    return positionTasks[context.seasonPosition] || definition.connector;
  }

  function createTimeline(eventId) {
    const currentIndex = getFlowIndex(eventId);
    return YOUTH_SEASON_FLOW.map((item, index) => ({
      id: item.id,
      label: item.label,
      kind: item.kind,
      status: currentIndex < 0 ? "upcoming" : index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming"
    }));
  }

  function createPresentation(eventId, context = {}) {
    const definition = VALIDATION_EVENTS[eventId];
    if (!definition) return null;
    const type = COMPETITION_TYPES[definition.typeId];
    const matchState = normalizeMatchState(context.matchState);
    return deepFreeze({
      eventId,
      category: definition.category,
      type: clone(type),
      level: clone(COMPETITION_RULES[definition.levelId]),
      competitionId: definition.competitionId,
      competitionTitle: definition.competitionTitle,
      stageLabel: definition.stageLabel,
      tone: definition.tone || "test",
      isContinuation: definition.showScore && eventId !== "youth_match_entry",
      transition: resolveTransition(eventId, definition, context),
      inningSummary: definition.showScore
        ? `${matchState.inning} 局${matchState.half}｜${matchState.outs} 出局`
        : definition.inningSummary,
      connector: resolveTask(eventId, definition, context),
      showScore: definition.showScore,
      matchState,
      runnerLabel: getRunnerLabel(matchState.runners),
      abilityCues: createAbilityCues(context.abilities, definition.abilityFocus),
      timeline: createTimeline(eventId)
    });
  }

  function render(eventId, context = {}) {
    const model = createPresentation(eventId, context);
    if (!model) return "";
    const score = model.showScore ? renderScore(model.matchState) : "";
    const abilityCues = model.abilityCues.map(cue => `
      <div class="validation-ability-cue" data-ability="${escapeHtml(cue.id)}" data-value="${cue.value}">
        <span>${escapeHtml(cue.label)}</span>
        <small>${escapeHtml(cue.description)}</small>
      </div>`).join("");
    const timeline = model.timeline.map(item => `
      <li class="competition-timeline-item ${escapeHtml(item.status)} ${escapeHtml(item.kind)}">
        <span aria-hidden="true"></span><strong>${escapeHtml(item.label)}</strong>
      </li>`).join("");
    return `<section class="competition-frame tone-${escapeHtml(model.tone)} ${model.isContinuation ? "continuation" : "opening"}" aria-label="Competition Flow">
      <header class="competition-header">
        <div><span class="validation-event-label">驗證場合</span><span class="competition-type">${escapeHtml(model.type.label)}</span><span class="competition-stage">${escapeHtml(model.stageLabel)}</span></div>
        <h3>${escapeHtml(model.competitionTitle)}</h3>
        <p>${escapeHtml(model.type.purpose)}</p>
      </header>
      <div class="competition-transition"><small>從上一幕</small><span>${escapeHtml(model.transition)}</span></div>
      <div class="competition-situation">
        <div class="inning-summary"><small>現在</small><strong>${escapeHtml(model.inningSummary)}</strong>${model.showScore ? `<span>${escapeHtml(model.runnerLabel)}</span>` : ""}</div>
        ${score}
      </div>
      <div class="validation-ability-panel" aria-label="你從局面中取得的線索">${abilityCues}</div>
      <div class="competition-connector"><small>這一幕要處理</small><strong>${escapeHtml(model.connector)}</strong></div>
      <ol class="competition-timeline" aria-label="少棒第一季進度">${timeline}</ol>
    </section>`;
  }

  function renderScore(matchState) {
    const bases = matchState.runners.map((occupied, index) => `<span class="base ${occupied ? "occupied" : ""}" title="${index + 1}壘"></span>`).join("");
    return `<div class="competition-score" aria-label="目前比分與壘況">
      <span class="score-line">客隊 <strong>${matchState.awayScore}</strong><i>：</i><strong>${matchState.homeScore}</strong> 少棒隊</span>
      <div class="diamond">${bases}</div>
    </div>`;
  }

  const api = Object.freeze({
    getCompetitionTypes,
    getCompetitionRules,
    getCompetitionRule,
    getValidationEvent,
    isValidationEvent,
    getYouthSeasonFlow,
    createPresentation,
    render
  });

  if (typeof window !== "undefined") window.CompetitionPresentation = api;
  return api;
})();
