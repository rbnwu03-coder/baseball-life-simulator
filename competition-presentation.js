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
      transition: "球季報到後，教練先用輪測確認每個人的起點。",
      inningSummary: "無局數｜四項守位依序輪測",
      connector: "測驗結束後，真正留下來的是收操後沒被記錄的那一球。",
      showScore: false
    }),
    youth_bench: validation({
      typeId: "intrasquad_scrimmage",
      competitionId: "youth_first_intrasquad",
      competitionTitle: "少棒第一季・第一次紅白賽",
      stageLabel: "第二個驗證點",
      transition: "幾次收操之後，隊內紅白賽把練習分組變成第一張名單。",
      inningSummary: "短局數｜隊內分組觀察",
      connector: "紅白賽的板凳紀錄，會成為正式聯賽名單的前一頁。",
      showScore: false
    }),
    youth_match_entry: officialValidation("報到｜四局上", "紅白賽的板凳觀察，換來正式聯賽的一次臨時任務。", "這場球還沒結束；下一個打者會把球打向你的守區。"),
    youth_match_grounder: officialValidation("第一個守備｜四局上", "你已走進同一場聯賽，比分、出局數與壘上跑者都延續著。", "完成第一球不代表安全，下一個局面會測試你如何回應。"),
    youth_match_outfield: officialValidation("第一個守備｜四局上", "你已走進同一場聯賽，比分、出局數與壘上跑者都延續著。", "完成第一球不代表安全，下一個局面會測試你如何回應。"),
    youth_match_catcher: officialValidation("第一個守備｜四局上", "你已走進同一場聯賽，比分、出局數與壘上跑者都延續著。", "完成第一球不代表安全，下一個局面會測試你如何回應。"),
    youth_match_pitcher: officialValidation("第一個打者｜四局上", "你已走進同一場聯賽，比分、出局數與壘上跑者都延續著。", "完成第一個打者不代表安全，下一個局面會測試你如何回應。"),
    youth_match_mistake: officialValidation("回應｜五局上", "上一個處理仍留在記分板上，第五局沒有讓任何人重新開始。", "終場後，教練會把整場而不是單一球寫進評估。"),
    youth_match_after: officialValidation("終場｜六局", "六局比賽已經結束，之前每一球的結果一起進入賽後評估。", "球季還沒結束；下一張名單將決定你是否再被需要。")
  });

  function validation(definition) {
    return Object.assign({
      category: "validation-event",
      levelId: "youth"
    }, definition);
  }

  function officialValidation(stageLabel, transition, connector) {
    return validation({
      typeId: "official_league",
      competitionId: "youth_first_league_game",
      competitionTitle: "少棒第一季・第一場正式聯賽",
      stageLabel,
      transition,
      inningSummary: "依目前局面延續",
      connector,
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
    if (value >= 8) return "壓力收窄了注意力，基本動作需要刻意確認";
    if (value >= 4) return "壓力已進入動作，但呼吸仍能找回節奏";
    return "壓力尚未遮住場上的聲音與指令";
  }

  function describeObservation(value) {
    if (value >= 8) return "你能提早察覺站位、彈跳與對手節奏";
    if (value >= 4) return "你開始看見球以外的細節";
    return "目前多半跟著球移動，尚未看完整個局面";
  }

  function describeBaseballIQ(value) {
    if (value >= 8) return "你能把出局數、跑者與下一個傳球點連在一起";
    if (value >= 4) return "你開始理解每個動作之後還有下一個選擇";
    return "你正在逐球反應，整體局勢仍需要經驗拼起來";
  }

  function createAbilityCues(abilities = {}) {
    const pressure = finite(abilities.pressure);
    const observe = finite(abilities.observe);
    const baseballIQ = finite(abilities.baseballIQ);
    return deepFreeze([
      { id: "pressure", label: "壓力", value: pressure, description: describePressure(pressure) },
      { id: "observe", label: "觀察", value: observe, description: describeObservation(observe) },
      { id: "baseballIQ", label: "棒球理解", value: baseballIQ, description: describeBaseballIQ(baseballIQ) }
    ]);
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
      transition: definition.transition,
      inningSummary: definition.showScore
        ? `${matchState.inning} 局${matchState.half}｜${matchState.outs} 出局`
        : definition.inningSummary,
      connector: definition.connector,
      showScore: definition.showScore,
      matchState,
      abilityCues: createAbilityCues(context.abilities),
      timeline: createTimeline(eventId)
    });
  }

  function render(eventId, context = {}) {
    const model = createPresentation(eventId, context);
    if (!model) return "";
    const score = model.showScore ? renderScore(model.matchState) : "";
    const abilityCues = model.abilityCues.map(cue => `
      <div class="validation-ability-cue" data-ability="${escapeHtml(cue.id)}">
        <span>${escapeHtml(cue.label)} ${cue.value}</span>
        <small>${escapeHtml(cue.description)}</small>
      </div>`).join("");
    const timeline = model.timeline.map(item => `
      <li class="competition-timeline-item ${escapeHtml(item.status)} ${escapeHtml(item.kind)}">
        <span aria-hidden="true"></span><strong>${escapeHtml(item.label)}</strong>
      </li>`).join("");
    return `<section class="competition-frame" aria-label="Competition Flow">
      <header class="competition-header">
        <div><span class="validation-event-label">Validation Event</span><span class="competition-type">${escapeHtml(model.type.label)}</span></div>
        <h3>${escapeHtml(model.competitionTitle)}</h3>
        <p>${escapeHtml(model.type.purpose)}・${escapeHtml(model.stageLabel)}</p>
      </header>
      <div class="competition-transition"><small>承接</small>${escapeHtml(model.transition)}</div>
      <div class="competition-situation">
        <div class="inning-summary"><small>局面</small><strong>${escapeHtml(model.inningSummary)}</strong></div>
        ${score}
      </div>
      <div class="validation-ability-panel" aria-label="本次驗證中的能力存在感">${abilityCues}</div>
      <div class="competition-connector"><small>這場驗證之後</small>${escapeHtml(model.connector)}</div>
      <ol class="competition-timeline" aria-label="少棒第一季進度">${timeline}</ol>
    </section>`;
  }

  function renderScore(matchState) {
    const bases = matchState.runners.map((occupied, index) => `<span class="base ${occupied ? "occupied" : ""}" title="${index + 1}壘"></span>`).join("");
    return `<div class="competition-score" aria-label="目前比分">
      <span>客隊 <strong>${matchState.awayScore}</strong></span>
      <span>少棒隊 <strong>${matchState.homeScore}</strong></span>
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
