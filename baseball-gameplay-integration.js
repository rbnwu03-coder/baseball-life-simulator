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
      mode: "readiness-only",
      gameplayFamily: "offense",
      baseState: "one-out-runner-on-second"
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

  function evaluateOffensiveEventReadiness(eventId, facts) {
    const registration = getIntegrationEvent(eventId);
    if (!registration || registration.gameplayFamily !== "offense") {
      return utils.deepFreeze({ compatible: false, reason: "event-not-registered" });
    }
    const requiredBaseState = facts?.baseState || registration.baseState;
    if (requiredBaseState !== "one-out-runner-on-first") {
      return utils.deepFreeze({
        compatible: false,
        reason: "runner-state-unsupported",
        requiredBaseState,
        currentCoreBaseState: "one-out-runner-on-first"
      });
    }
    return utils.deepFreeze({ compatible: true, reason: "compatible-base-state" });
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
    createYouthGrounderInput,
    isFieldingApproachAvailable,
    resolveYouthGrounderFielding,
    resolveYouthGrounder
  });
})(
  typeof BaseballGameplayPrototypeUtils !== "undefined" ? BaseballGameplayPrototypeUtils : (typeof require === "function" ? require("./baseball-gameplay-prototype-utils.js") : null),
  typeof BaseballDefensePrototype !== "undefined" ? BaseballDefensePrototype : (typeof require === "function" ? require("./baseball-defense-prototype.js") : null),
  typeof BaseballOffensePrototype !== "undefined" ? BaseballOffensePrototype : (typeof require === "function" ? require("./baseball-offense-prototype.js") : null)
);

if (typeof module !== "undefined" && module.exports) {
  module.exports = BaseballGameplayIntegration;
}
