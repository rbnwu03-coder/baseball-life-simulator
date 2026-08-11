var BaseballGameplayIntegration = ((utils, defense, offense) => {
  "use strict";

  if (!utils || !defense || !offense) {
    return Object.freeze({ unavailable: true });
  }

  const GAMEPLAY_INTEGRATION_EVENTS = utils.deepFreeze({
    youth_match_grounder: {
      eventId: "youth_match_grounder",
      mode: "live",
      gameplayFamily: "defense",
      baseState: "one-out-runner-on-first"
    },
    high_school_year_two_spring_game: {
      eventId: "high_school_year_two_spring_game",
      mode: "live",
      gameplayFamily: "offense",
      baseState: "one-out-runner-on-second",
      runnerSpeed: "average",
      pitcherTendency: "outside",
      pitchDifficulty: "normal",
      nextBatterReliability: "medium",
      defenseQuality: "average"
    }
  });

  const YOUTH_GROUNDER_FACTS = utils.deepFreeze({
    ballType: "routine",
    ballDifficulty: "normal",
    batterSpeed: "average",
    runnerSpeed: "average"
  });

  const RESULT_PRESENTATION = utils.deepFreeze({
    "double-play": {
      performanceDelta: 3,
      errorDelta: 0,
      resultFlag: "youth_grounder_double_play",
      narrative: "你把球控制在身前，先送到二壘，再由隊友轉傳一壘。兩個出局手勢接連舉起，這次攻勢被雙殺收掉。"
    },
    "force-out-second": {
      performanceDelta: 2,
      errorDelta: 0,
      resultFlag: "youth_grounder_force_second",
      narrative: "傳球先抵達二壘，前位跑者被封殺；打者趁回傳前踩上一壘，場上換成一壘有人。"
    },
    "batter-out-runner-second": {
      performanceDelta: 2,
      errorDelta: 0,
      resultFlag: "youth_grounder_batter_out",
      narrative: "你先把球送往一壘，打者在踩壘前出局；原本的一壘跑者趁這段時間進到二壘。"
    },
    "all-safe": {
      performanceDelta: 0,
      errorDelta: 0,
      resultFlag: "youth_grounder_all_safe",
      narrative: "接傳慢了半拍，二壘與一壘都沒有形成出局。兩名跑者分別留在一、二壘。"
    },
    "fielding-error": {
      performanceDelta: 0,
      errorDelta: 1,
      resultFlag: "youth_grounder_fielding_error",
      narrative: "球碰到手套邊緣後留在紅土上。你重新撿起時，打者已上一壘，原跑者也進到二壘。"
    },
    "throwing-error": {
      performanceDelta: 0,
      errorDelta: 1,
      resultFlag: "youth_grounder_throwing_error",
      narrative: "傳球偏離接球點，補位的隊友追到球時，打者已到二壘，原跑者也推進到三壘。"
    },
    "ball-through": {
      performanceDelta: 0,
      errorDelta: 0,
      resultFlag: "youth_grounder_ball_through",
      narrative: "球從你身側穿過，外野手把球攔回來時，打者留在一壘，原跑者已進到三壘。"
    }
  });

  const OFFENSIVE_RESULT_PRESENTATION = utils.deepFreeze({
    strikeout: {
      performanceDelta: 0,
      resultFlag: "hs_y2_spring_strikeout",
      narrative: "最後一球沒有碰到球，打者出局，二壘跑者仍留在原位。"
    },
    "groundout-hold": {
      performanceDelta: 0,
      resultFlag: "hs_y2_spring_groundout_hold",
      narrative: "內野滾地形成出局，二壘跑者判斷無法前進，仍停在二壘。"
    },
    "groundout-advance": {
      performanceDelta: 1,
      resultFlag: "hs_y2_spring_groundout_advance",
      narrative: "打者在一壘前出局，二壘跑者趁守備處理移到三壘。"
    },
    "single-runner-third": {
      performanceDelta: 2,
      resultFlag: "hs_y2_spring_single_runner_third",
      narrative: "球穿過守備空檔，你站上一壘，二壘跑者停在三壘。"
    },
    "single-rbi": {
      performanceDelta: 3,
      resultFlag: "hs_y2_spring_single_rbi",
      narrative: "安打落地後，二壘跑者直接回到本壘，你留在一壘。"
    },
    "extra-base-rbi": {
      performanceDelta: 3,
      resultFlag: "hs_y2_spring_extra_base_rbi",
      narrative: "球越過外野手的處理範圍，二壘跑者得分，你站上二壘。"
    },
    "infield-hit": {
      performanceDelta: 2,
      resultFlag: "hs_y2_spring_infield_hit",
      narrative: "守備來不及完成傳球，你先踩上一壘，二壘跑者仍留在原位。"
    },
    "fielding-error": {
      performanceDelta: 1,
      resultFlag: "hs_y2_spring_fielding_error",
      narrative: "守備沒能把球收穩，你到達一壘，二壘跑者推進到三壘。"
    },
    lineout: {
      performanceDelta: 0,
      resultFlag: "hs_y2_spring_lineout",
      narrative: "擊球直接飛進守備手套，打者出局，二壘跑者沒有移動。"
    },
    flyout: {
      performanceDelta: 0,
      resultFlag: "hs_y2_spring_flyout",
      narrative: "外野手完成接殺，打者出局，二壘跑者留在原位。"
    },
    popout: {
      performanceDelta: 0,
      resultFlag: "hs_y2_spring_popout",
      narrative: "內野手接住高飛球，打者出局，二壘跑者留在原位。"
    },
    "bunt-lead-runner-out": {
      performanceDelta: -1,
      resultFlag: "hs_y2_spring_bunt_lead_runner_out",
      narrative: "守備直接把球送往三壘，前位跑者被封殺，你停在一壘。"
    },
    "bunt-advance": {
      performanceDelta: 2,
      resultFlag: "hs_y2_spring_bunt_advance",
      narrative: "觸擊把球點進守備空檔，打者出局，二壘跑者推進到三壘。"
    },
    "bunt-all-safe": {
      performanceDelta: 2,
      resultFlag: "hs_y2_spring_bunt_all_safe",
      narrative: "守備沒有取得出局，你站上一壘，原本的二壘跑者也到達三壘。"
    },
    "bunt-single": {
      performanceDelta: 3,
      resultFlag: "hs_y2_spring_bunt_single",
      narrative: "觸擊落在無人能及時處理的位置，你站上一壘，二壘跑者推進到三壘。"
    }
  });

  function unresolved(code, message, details = {}) {
    return utils.deepFreeze({
      status: "unresolved",
      issues: [{ code, message }],
      details: utils.clone(details)
    });
  }

  function getIntegrationRegistry() {
    return GAMEPLAY_INTEGRATION_EVENTS;
  }

  function getIntegrationEvent(eventId) {
    return GAMEPLAY_INTEGRATION_EVENTS[eventId] || null;
  }

  function mapNumericSkillTier(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
    if (value <= 3) return "low";
    if (value <= 7) return "average";
    if (value <= 11) return "high";
    return "elite";
  }

  function deriveFieldingScore(baseballSkills) {
    if (!utils.isPlainObject(baseballSkills)) return null;
    const values = ["catching", "reaction", "range"].map(key => baseballSkills[key]);
    if (values.some(value => typeof value !== "number" || !Number.isFinite(value) || value < 0)) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  function deriveBodyState(body) {
    if (!utils.isPlainObject(body)) return null;
    const values = ["fatigue", "pain", "injuryRisk"].map(key => body[key]);
    if (values.some(value => typeof value !== "number" || !Number.isFinite(value) || value < 0)) return null;
    if (body.pain >= 3 || body.injuryRisk >= 6) return "minor-injury";
    if (body.fatigue >= 6) return "fatigued";
    return "normal";
  }

  function getScoreStateFromMatchState(matchState) {
    if (!utils.isPlainObject(matchState)) return null;
    const awayScore = matchState.awayScore;
    const homeScore = matchState.homeScore;
    if (![awayScore, homeScore].every(value => typeof value === "number" && Number.isFinite(value))) return null;
    const difference = homeScore - awayScore;
    if (difference <= -2) return "behind-2-plus";
    if (difference === -1) return "behind-1";
    if (difference === 0) return "tied";
    return "ahead";
  }

  function toCoreScoreState(scoreState) {
    if (scoreState === "behind-2-plus") return "behind-1";
    if (scoreState === "ahead") return "ahead-1";
    return scoreState;
  }

  function getYouthGrounderSnapshotKey(playerState) {
    if (!utils.isPlainObject(playerState)) return "";
    return JSON.stringify({
      chapter: playerState.chapter,
      seasonStep: playerState.seasonStep,
      seasonPosition: playerState.seasonPosition,
      skills: {
        catching: playerState.baseballSkills?.catching,
        reaction: playerState.baseballSkills?.reaction,
        range: playerState.baseballSkills?.range,
        throwing: playerState.baseballSkills?.throwing
      },
      body: {
        fatigue: playerState.body?.fatigue,
        pain: playerState.body?.pain,
        injuryRisk: playerState.body?.injuryRisk
      },
      matchState: {
        inning: playerState.matchState?.inning,
        half: playerState.matchState?.half,
        outs: playerState.matchState?.outs,
        runners: Array.isArray(playerState.matchState?.runners) ? playerState.matchState.runners.slice(0, 3) : null,
        awayScore: playerState.matchState?.awayScore,
        homeScore: playerState.matchState?.homeScore
      }
    });
  }

  function createYouthGrounderInput(playerState, decisions, rolls) {
    if (!utils.isPlainObject(playerState) || !utils.isPlainObject(decisions)) {
      return unresolved("player-shape", "Youth grounder integration requires plain Player facts and decisions.");
    }
    const skills = playerState.baseballSkills;
    const fieldingScore = deriveFieldingScore(skills);
    const fielding = mapNumericSkillTier(fieldingScore);
    const throwing = mapNumericSkillTier(skills?.throwing);
    const body = deriveBodyState(playerState.body);
    const visibleScoreState = getScoreStateFromMatchState(playerState.matchState);
    const runners = playerState.matchState?.runners;
    const compatibleBaseState = playerState.matchState?.outs === 1 &&
      Array.isArray(runners) &&
      runners.length >= 3 &&
      runners[0] === true &&
      runners[1] === false &&
      runners[2] === false;
    if (!fielding || !throwing || !body || !visibleScoreState) {
      return unresolved("player-facts", "Player facts could not be adapted to the defensive core.");
    }
    if (!compatibleBaseState) {
      return unresolved("base-state", "The pilot requires one out with a runner on first.");
    }
    if (!utils.validateRolls(rolls, ["fieldingExecution", "fieldingResult", "throwExecution", "result"])) {
      return unresolved("rolls", "All defensive rolls must be supplied before resolution.");
    }
    const input = {
      situation: Object.assign({}, YOUTH_GROUNDER_FACTS, {
        scoreState: toCoreScoreState(visibleScoreState)
      }),
      player: { fielding, throwing, body },
      fieldingApproach: decisions.fieldingApproach,
      throwDecision: decisions.throwDecision == null ? null : decisions.throwDecision,
      rolls: utils.clone(rolls)
    };
    return utils.deepFreeze({
      status: "ready",
      input,
      adaptedFacts: { fieldingScore, fielding, throwing, body, visibleScoreState }
    });
  }

  function isFieldingApproachAvailable(approach) {
    if (approach === "secure" || approach === "attack") return true;
    if (approach !== "dive") return false;
    return defense.isDiveAvailable(YOUTH_GROUNDER_FACTS.ballType, YOUTH_GROUNDER_FACTS.ballDifficulty);
  }

  function resolveYouthGrounderFielding(playerState, fieldingApproach, rolls) {
    const prepared = createYouthGrounderInput(playerState, { fieldingApproach, throwDecision: null }, rolls);
    if (prepared.status !== "ready") return prepared;
    if (!isFieldingApproachAvailable(fieldingApproach)) {
      return unresolved("fielding-approach-unavailable", "This fielding approach is unavailable for the pilot situation.");
    }
    const decision = defense.resolveFieldingDecision({
      ballType: prepared.input.situation.ballType,
      ballDifficulty: prepared.input.situation.ballDifficulty,
      batterSpeed: prepared.input.situation.batterSpeed,
      fielding: prepared.input.player.fielding,
      body: prepared.input.player.body,
      fieldingApproach
    });
    const execution = defense.resolveFieldingExecution({
      ballDifficulty: prepared.input.situation.ballDifficulty,
      fielding: prepared.input.player.fielding,
      body: prepared.input.player.body,
      decisionQuality: decision.quality,
      executionRoll: rolls.fieldingExecution
    });
    if (decision.status !== "resolved" || execution.status !== "resolved") {
      return unresolved("fielding-resolution", "The defensive core did not resolve Stage A.");
    }
    if (execution.controlQuality === "failed") {
      return adaptResolvedYouthGrounder(
        defense.resolveDefensivePlay(prepared.input),
        prepared.adaptedFacts
      );
    }
    return utils.deepFreeze({
      status: "resolved",
      stage: "fielding",
      requiresThrow: true,
      fieldingApproach,
      controlQuality: execution.controlQuality,
      fielding: { decision, execution },
      adaptedFacts: prepared.adaptedFacts,
      snapshotKey: getYouthGrounderSnapshotKey(playerState)
    });
  }

  function runnersFromStateDelta(stateDelta) {
    const runners = [false, false, false];
    [stateDelta.batterBase, stateDelta.runnerFromFirstBase].forEach(base => {
      if (Number.isInteger(base) && base >= 1 && base <= 3) runners[base - 1] = true;
    });
    return runners;
  }

  function adaptResolvedYouthGrounder(coreResult, adaptedFacts) {
    if (!coreResult || coreResult.status !== "resolved") {
      return unresolved("core-result", "The defensive core did not return a resolved play.");
    }
    const presentation = RESULT_PRESENTATION[coreResult.result?.resultType];
    if (!presentation || !coreResult.stateDelta) {
      return unresolved("result-type", "The defensive result cannot be mapped to the production match state.");
    }
    return utils.deepFreeze({
      status: "resolved",
      stage: "complete",
      requiresThrow: false,
      resultType: coreResult.result.resultType,
      controlQuality: coreResult.control?.quality || "failed",
      stateDelta: utils.clone(coreResult.stateDelta),
      mutation: {
        outsAdded: coreResult.stateDelta.outsAdded,
        runners: runnersFromStateDelta(coreResult.stateDelta),
        performanceDelta: presentation.performanceDelta,
        errorDelta: presentation.errorDelta,
        resultFlag: presentation.resultFlag
      },
      narrative: presentation.narrative,
      adaptedFacts: utils.clone(adaptedFacts),
      coreResult
    });
  }

  function resolveYouthGrounder(playerState, decisions, rolls) {
    const prepared = createYouthGrounderInput(playerState, decisions, rolls);
    if (prepared.status !== "ready") return prepared;
    if (!isFieldingApproachAvailable(decisions.fieldingApproach)) {
      return unresolved("fielding-approach-unavailable", "This fielding approach is unavailable for the pilot situation.");
    }
    return adaptResolvedYouthGrounder(
      defense.resolveDefensivePlay(prepared.input),
      prepared.adaptedFacts
    );
  }

  function averageExistingValues(values) {
    if (values.some(value => typeof value !== "number" || !Number.isFinite(value) || value < 0)) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  function deriveOffensiveSkillScores(playerState) {
    if (!utils.isPlainObject(playerState) || !utils.isPlainObject(playerState.baseballSkills)) return null;
    const skills = playerState.baseballSkills;
    const powerScore = averageExistingValues([skills.batting]);
    const contactScore = averageExistingValues([skills.batting, playerState.ballSense, playerState.discipline]);
    const buntScore = averageExistingValues([skills.baseballIQ, skills.baseRunning, playerState.discipline]);
    if ([powerScore, contactScore, buntScore].some(value => value == null)) return null;
    return { powerScore, contactScore, buntScore };
  }

  function getHighSchoolYearTwoSpringSnapshotKey(playerState) {
    if (!utils.isPlainObject(playerState)) return "";
    return JSON.stringify({
      chapter: playerState.chapter,
      highSchoolYearTwoStep: playerState.highSchoolYearTwoStep,
      offensiveFacts: {
        batting: playerState.baseballSkills?.batting,
        baseballIQ: playerState.baseballSkills?.baseballIQ,
        baseRunning: playerState.baseballSkills?.baseRunning,
        ballSense: playerState.ballSense,
        discipline: playerState.discipline
      },
      body: {
        fatigue: playerState.body?.fatigue,
        pain: playerState.body?.pain,
        injuryRisk: playerState.body?.injuryRisk
      },
      matchState: {
        inning: playerState.matchState?.inning,
        half: playerState.matchState?.half,
        outs: playerState.matchState?.outs,
        runners: Array.isArray(playerState.matchState?.runners) ? playerState.matchState.runners.slice(0, 3) : null,
        awayScore: playerState.matchState?.awayScore,
        homeScore: playerState.matchState?.homeScore
      }
    });
  }

  function createHighSchoolYearTwoSpringInput(playerState, approach, rolls) {
    if (!utils.isPlainObject(playerState)) {
      return unresolved("player-shape", "High-school spring integration requires plain Player facts.");
    }
    const registration = getIntegrationEvent("high_school_year_two_spring_game");
    const scores = deriveOffensiveSkillScores(playerState);
    const body = deriveBodyState(playerState.body);
    const scoreState = getScoreStateFromMatchState(playerState.matchState);
    const runners = playerState.matchState?.runners;
    const compatibleBaseState = playerState.matchState?.outs === 1 &&
      Array.isArray(runners) &&
      runners.length >= 3 &&
      runners[0] === false &&
      runners[1] === true &&
      runners[2] === false;
    if (!registration || registration.mode !== "live" || !scores || !body || !scoreState) {
      return unresolved("player-facts", "Player facts could not be adapted to the offensive core.");
    }
    if (!compatibleBaseState || scoreState !== "tied") {
      return unresolved("base-state", "The pilot requires a tied game with one out and a runner on second.");
    }
    if (!utils.validateRolls(rolls, ["execution", "battedBall", "defense", "result", "runnerAdvance"])) {
      return unresolved("rolls", "All offensive rolls must be supplied before resolution.");
    }
    const power = mapNumericSkillTier(scores.powerScore);
    const contact = mapNumericSkillTier(scores.contactScore);
    const bunt = mapNumericSkillTier(scores.buntScore);
    if (!power || !contact || !bunt) {
      return unresolved("player-skills", "Offensive skill tiers could not be derived.");
    }
    return utils.deepFreeze({
      status: "ready",
      input: {
        situation: {
          baseState: registration.baseState,
          scoreState,
          runnerSpeed: registration.runnerSpeed,
          pitcherTendency: registration.pitcherTendency
        },
        player: {
          power,
          contact,
          bunt,
          body,
          nextBatterReliability: registration.nextBatterReliability
        },
        pitchDifficulty: registration.pitchDifficulty,
        defenseQuality: registration.defenseQuality,
        approach,
        rolls: utils.clone(rolls)
      },
      adaptedFacts: Object.assign({}, scores, {
        power,
        contact,
        bunt,
        body,
        scoreState,
        runnerSpeed: registration.runnerSpeed,
        pitcherTendency: registration.pitcherTendency,
        pitchDifficulty: registration.pitchDifficulty,
        nextBatterReliability: registration.nextBatterReliability,
        defenseQuality: registration.defenseQuality
      })
    });
  }

  function getOffensivePresentationKey(resultType, stateDelta) {
    if (resultType === "groundout") return stateDelta.leadRunner?.toBase === 3 ? "groundout-advance" : "groundout-hold";
    if (resultType === "single") return stateDelta.runsScored > 0 ? "single-rbi" : "single-runner-third";
    if (resultType === "extra-base-hit") return "extra-base-rbi";
    if (resultType === "lead-runner-out-third") return "bunt-lead-runner-out";
    if (resultType === "batter-out-runner-third") return "bunt-advance";
    if (resultType === "all-safe") return "bunt-all-safe";
    return resultType;
  }

  function adaptResolvedHighSchoolYearTwoSpring(coreResult, adaptedFacts) {
    if (!coreResult || coreResult.status !== "resolved" || !coreResult.result?.stateDelta) {
      return unresolved("core-result", "The offensive core did not return a resolved at-bat.");
    }
    const stateDelta = coreResult.result.stateDelta;
    const presentationKey = getOffensivePresentationKey(coreResult.result.resultType, stateDelta);
    const presentation = OFFENSIVE_RESULT_PRESENTATION[presentationKey];
    if (
      !presentation ||
      !Number.isInteger(stateDelta.outsAdded) ||
      !Number.isInteger(stateDelta.runsScored) ||
      !Array.isArray(stateDelta.runnersAfter) ||
      stateDelta.runnersAfter.length !== 3 ||
      !stateDelta.runnersAfter.every(value => typeof value === "boolean")
    ) {
      return unresolved("result-type", "The offensive result cannot be mapped to the production match state.");
    }
    return utils.deepFreeze({
      status: "resolved",
      stage: "complete",
      resultType: coreResult.result.resultType,
      stateDelta: utils.clone(stateDelta),
      mutation: {
        outsAdded: stateDelta.outsAdded,
        runsScored: stateDelta.runsScored,
        runners: utils.clone(stateDelta.runnersAfter),
        performanceDelta: presentation.performanceDelta,
        resultFlag: presentation.resultFlag
      },
      narrative: presentation.narrative,
      adaptedFacts: utils.clone(adaptedFacts),
      coreResult
    });
  }

  function resolveHighSchoolYearTwoSpringAtBat(playerState, approach, rolls) {
    const prepared = createHighSchoolYearTwoSpringInput(playerState, approach, rolls);
    if (prepared.status !== "ready") return prepared;
    return adaptResolvedHighSchoolYearTwoSpring(
      offense.resolveAtBat(prepared.input),
      prepared.adaptedFacts
    );
  }

  function evaluateOffensiveEventReadiness(eventId, facts) {
    const registration = getIntegrationEvent(eventId);
    if (!registration || registration.gameplayFamily !== "offense") {
      return utils.deepFreeze({ compatible: false, reason: "event-not-registered" });
    }
    const requiredBaseState = facts?.baseState || registration.baseState;
    const supportedBaseStates = typeof offense.getSupportedBaseStates === "function"
      ? offense.getSupportedBaseStates()
      : [];
    if (!supportedBaseStates.includes(requiredBaseState)) {
      return utils.deepFreeze({
        compatible: false,
        reason: "runner-state-unsupported",
        requiredBaseState,
        supportedBaseStates: utils.clone(supportedBaseStates)
      });
    }
    return utils.deepFreeze({
      compatible: true,
      reason: "compatible-base-state",
      requiredBaseState,
      supportedBaseStates: utils.clone(supportedBaseStates)
    });
  }

  return utils.deepFreeze({
    getIntegrationRegistry,
    getIntegrationEvent,
    evaluateOffensiveEventReadiness,
    mapNumericSkillTier,
    deriveFieldingScore,
    deriveBodyState,
    getScoreStateFromMatchState,
    getYouthGrounderSnapshotKey,
    getHighSchoolYearTwoSpringSnapshotKey,
    createYouthGrounderInput,
    createHighSchoolYearTwoSpringInput,
    isFieldingApproachAvailable,
    resolveYouthGrounderFielding,
    resolveYouthGrounder,
    resolveHighSchoolYearTwoSpringAtBat
  });
})(
  typeof BaseballGameplayPrototypeUtils !== "undefined" ? BaseballGameplayPrototypeUtils : (typeof require === "function" ? require("./baseball-gameplay-prototype-utils.js") : null),
  typeof BaseballDefensePrototype !== "undefined" ? BaseballDefensePrototype : (typeof require === "function" ? require("./baseball-defense-prototype.js") : null),
  typeof BaseballOffensePrototype !== "undefined" ? BaseballOffensePrototype : (typeof require === "function" ? require("./baseball-offense-prototype.js") : null)
);

if (typeof module !== "undefined" && module.exports) {
  module.exports = BaseballGameplayIntegration;
}
