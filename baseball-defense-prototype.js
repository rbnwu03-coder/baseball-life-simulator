var BaseballDefensePrototype = ((utils) => {
  "use strict";

  if (!utils) return Object.freeze({ unavailable: true });

  const FIELDING_APPROACH_IDS = utils.deepFreeze(["secure", "attack", "dive"]);
  const THROW_DECISION_IDS = utils.deepFreeze(["secure-first", "force-lead-runner", "turn-two"]);
  const BALL_TYPES = ["routine", "slow-roller", "deep-grounder", "range-ball"];
  const DIFFICULTIES = ["easy", "normal", "difficult"];
  const SPEEDS = ["slow", "average", "fast"];
  const SKILL_LEVELS = ["low", "average", "high", "elite"];
  const BODY_STATES = ["normal", "fatigued", "minor-injury"];
  const SCORE_STATES = ["behind-1", "tied", "ahead-1"];
  const CONTROL_QUALITIES = ["clean", "delayed", "off-balance"];

  const SKILL_VALUES = { low: -1, average: 0, high: 1, elite: 2 };
  const DIFFICULTY_VALUES = { easy: 1, normal: 0, difficult: -1 };
  const BODY_VALUES = { normal: 0, fatigued: -1, "minor-injury": -1 };
  const CONTROL_VALUES = { clean: 1, delayed: 0, "off-balance": -1 };
  const EXECUTION_TIERS = { failed: -2, poor: -1, playable: 0, good: 1, excellent: 3 };

  function isDiveAvailable(ballType, ballDifficulty) {
    return ballType === "range-ball" || (ballType === "deep-grounder" && ballDifficulty === "difficult");
  }

  function decisionTier(score) {
    return utils.qualityFromScore(score);
  }

  function executionTier(score, skill) {
    if (score <= -2) return "failed";
    if (score === -1) return "poor";
    if (score === 0) return "playable";
    if (score <= 2) return "good";
    return ["high", "elite"].includes(skill) ? "excellent" : "good";
  }

  function validateFieldingDecisionInput(input) {
    if (!utils.isPlainObject(input)) return "input-shape";
    if (!utils.isEnum(input.ballType, BALL_TYPES)) return "ball-type";
    if (!utils.isEnum(input.ballDifficulty, DIFFICULTIES)) return "ball-difficulty";
    if (!utils.isEnum(input.batterSpeed, SPEEDS)) return "batter-speed";
    if (!utils.isEnum(input.fielding, SKILL_LEVELS)) return "fielding";
    if (!utils.isEnum(input.body, BODY_STATES)) return "body";
    if (!utils.isEnum(input.fieldingApproach, FIELDING_APPROACH_IDS)) return "fielding-approach";
    if (input.fieldingApproach === "dive" && !isDiveAvailable(input.ballType, input.ballDifficulty)) return "dive-unavailable";
    return null;
  }

  function fieldingDecisionModifiers(input) {
    const base = {
      routine: { secure: 2, attack: 0, dive: -3 },
      "slow-roller": { secure: 0, attack: 1, dive: -3 },
      "deep-grounder": { secure: 1, attack: -2, dive: 0 },
      "range-ball": { secure: -1, attack: -2, dive: 2 }
    }[input.ballType][input.fieldingApproach];
    let batter = 0;
    let skillFit = 0;
    let body = 0;
    if (input.ballType === "slow-roller" && input.fieldingApproach === "attack" && input.batterSpeed === "fast") batter = 2;
    if (input.ballType === "deep-grounder" && input.fieldingApproach === "secure" && input.batterSpeed === "slow") batter = 1;
    if (input.fieldingApproach === "dive" && ["high", "elite"].includes(input.fielding)) skillFit = 1;
    if (input.fieldingApproach === "attack" && input.body === "fatigued") body = -2;
    if (input.fieldingApproach === "attack" && input.body === "minor-injury") body = -2;
    if (input.fieldingApproach === "dive" && input.body === "fatigued") body = -1;
    if (input.fieldingApproach === "dive" && input.body === "minor-injury") body = -3;
    return { ballFit: base, batterWindow: batter, skillFit, bodyFit: body };
  }

  function resolveFieldingDecision(input) {
    const invalid = validateFieldingDecisionInput(input);
    if (invalid) return utils.unresolved(input, invalid, "Fielding decision input failed exact validation.");
    const modifiers = fieldingDecisionModifiers(input);
    const rawScore = Object.values(modifiers).reduce((sum, value) => sum + value, 0);
    return utils.deepFreeze({
      status: "resolved",
      input: utils.clone(input),
      rawScore,
      quality: decisionTier(rawScore),
      modifiers,
      available: true,
      trace: [{ stage: "fielding-decision", rawScore, quality: decisionTier(rawScore), modifiers: utils.clone(modifiers) }]
    });
  }

  function validateFieldingExecutionInput(input) {
    if (!utils.isPlainObject(input)) return "input-shape";
    if (!utils.isEnum(input.ballDifficulty, DIFFICULTIES)) return "ball-difficulty";
    if (!utils.isEnum(input.fielding, SKILL_LEVELS)) return "fielding";
    if (!utils.isEnum(input.body, BODY_STATES)) return "body";
    if (!utils.isEnum(input.decisionQuality, ["excellent", "good", "neutral", "poor", "bad"])) return "decision-quality";
    if (!utils.isRoll(input.executionRoll)) return "execution-roll";
    return null;
  }

  function resolveFieldingExecution(input) {
    const invalid = validateFieldingExecutionInput(input);
    if (invalid) return utils.unresolved(input, invalid, "Fielding execution input failed exact validation.");
    const variance = utils.varianceFromRoll(input.executionRoll);
    const components = {
      skill: SKILL_VALUES[input.fielding],
      ballDifficulty: DIFFICULTY_VALUES[input.ballDifficulty],
      body: BODY_VALUES[input.body],
      decisionQuality: utils.qualityModifier(input.decisionQuality),
      variance
    };
    const score = Object.values(components).reduce((sum, value) => sum + value, 0);
    const tier = executionTier(score, input.fielding);
    const controlQuality = { failed: "failed", poor: "off-balance", playable: "delayed", good: "clean", excellent: "clean" }[tier];
    return utils.deepFreeze({
      status: "resolved",
      input: utils.clone(input),
      score,
      tier,
      controlQuality,
      variance,
      components,
      trace: [{ stage: "fielding-execution", score, tier, controlQuality, components: utils.clone(components), roll: input.executionRoll }]
    });
  }

  function validateThrowDecisionInput(input) {
    if (!utils.isPlainObject(input)) return "input-shape";
    if (!utils.isEnum(input.scoreState, SCORE_STATES)) return "score-state";
    if (!utils.isEnum(input.runnerSpeed, SPEEDS)) return "runner-speed";
    if (!utils.isEnum(input.batterSpeed, SPEEDS)) return "batter-speed";
    if (!utils.isEnum(input.controlQuality, CONTROL_QUALITIES)) return "control-quality";
    if (!utils.isEnum(input.throwDecision, THROW_DECISION_IDS)) return "throw-decision";
    return null;
  }

  function throwDecisionModifiers(input) {
    const control = {
      clean: { "secure-first": 1, "force-lead-runner": 0, "turn-two": 2 },
      delayed: { "secure-first": 1, "force-lead-runner": 0, "turn-two": -2 },
      "off-balance": { "secure-first": 2, "force-lead-runner": -1, "turn-two": -3 }
    }[input.controlQuality][input.throwDecision];
    const runner = {
      slow: { "secure-first": 0, "force-lead-runner": -1, "turn-two": 1 },
      average: { "secure-first": 0, "force-lead-runner": 0, "turn-two": 0 },
      fast: { "secure-first": -1, "force-lead-runner": 2, "turn-two": -1 }
    }[input.runnerSpeed][input.throwDecision];
    const batter = {
      slow: { "secure-first": 1, "force-lead-runner": 1, "turn-two": 1 },
      average: { "secure-first": 0, "force-lead-runner": 0, "turn-two": 0 },
      fast: { "secure-first": 1, "force-lead-runner": -1, "turn-two": -1 }
    }[input.batterSpeed][input.throwDecision];
    return { controlWindow: control, runnerReplacement: runner, batterWindow: batter, scoreState: 0 };
  }

  function resolveThrowDecision(input) {
    const invalid = validateThrowDecisionInput(input);
    if (invalid) return utils.unresolved(input, invalid, "Throw decision input failed exact validation.");
    const modifiers = throwDecisionModifiers(input);
    const rawScore = Object.values(modifiers).reduce((sum, value) => sum + value, 0);
    return utils.deepFreeze({
      status: "resolved",
      input: utils.clone(input),
      rawScore,
      quality: decisionTier(rawScore),
      modifiers,
      trace: [{ stage: "throw-decision", rawScore, quality: decisionTier(rawScore), modifiers: utils.clone(modifiers) }]
    });
  }

  function validateThrowExecutionInput(input) {
    if (!utils.isPlainObject(input)) return "input-shape";
    if (!utils.isEnum(input.throwing, SKILL_LEVELS)) return "throwing";
    if (!utils.isEnum(input.controlQuality, CONTROL_QUALITIES)) return "control-quality";
    if (!utils.isEnum(input.body, BODY_STATES)) return "body";
    if (!utils.isEnum(input.decisionQuality, ["excellent", "good", "neutral", "poor", "bad"])) return "decision-quality";
    if (!utils.isRoll(input.executionRoll)) return "execution-roll";
    return null;
  }

  function resolveThrowExecution(input) {
    const invalid = validateThrowExecutionInput(input);
    if (invalid) return utils.unresolved(input, invalid, "Throw execution input failed exact validation.");
    const variance = utils.varianceFromRoll(input.executionRoll);
    const components = {
      skill: SKILL_VALUES[input.throwing],
      control: CONTROL_VALUES[input.controlQuality],
      body: BODY_VALUES[input.body],
      decisionQuality: utils.qualityModifier(input.decisionQuality),
      variance
    };
    const score = Object.values(components).reduce((sum, value) => sum + value, 0);
    const tier = executionTier(score, input.throwing);
    return utils.deepFreeze({
      status: "resolved",
      input: utils.clone(input),
      score,
      tier,
      variance,
      components,
      trace: [{ stage: "throw-execution", score, tier, components: utils.clone(components), roll: input.executionRoll }]
    });
  }

  function moveWeight(weights, from, to, amount) {
    const moved = Math.min(amount, weights[from] || 0);
    weights[from] = (weights[from] || 0) - moved;
    weights[to] = (weights[to] || 0) + moved;
  }

  function throwResultDistribution(input, executionTierName) {
    const tierIndex = { failed: 0, poor: 1, playable: 2, good: 3, excellent: 4 }[executionTierName];
    let weights;
    if (input.throwDecision === "secure-first") {
      const rows = [[5, 35, 60], [25, 45, 30], [60, 30, 10], [85, 12, 3], [95, 4, 1]];
      const row = rows[tierIndex];
      weights = { "batter-out-runner-second": row[0], "all-safe": row[1], "throwing-error": row[2] };
      if (input.batterSpeed === "fast") moveWeight(weights, "batter-out-runner-second", "all-safe", 15);
      if (input.batterSpeed === "slow") moveWeight(weights, "all-safe", "batter-out-runner-second", 5);
    } else if (input.throwDecision === "force-lead-runner") {
      const rows = [[5, 35, 60], [25, 45, 30], [60, 30, 10], [85, 12, 3], [95, 4, 1]];
      const row = rows[tierIndex];
      weights = { "force-out-second": row[0], "all-safe": row[1], "throwing-error": row[2] };
      if (input.runnerSpeed === "fast") moveWeight(weights, "force-out-second", "all-safe", 10);
      if (input.runnerSpeed === "slow") moveWeight(weights, "all-safe", "force-out-second", 10);
    } else {
      const rows = [[2, 10, 35, 53], [5, 25, 45, 25], [20, 45, 30, 5], [50, 35, 12, 3], [75, 20, 4, 1]];
      const row = rows[tierIndex];
      weights = { "double-play": row[0], "force-out-second": row[1], "all-safe": row[2], "throwing-error": row[3] };
      const speedPenalty = (input.runnerSpeed === "fast" ? 15 : 0) + (input.batterSpeed === "fast" ? 15 : 0);
      const controlPenalty = input.controlQuality === "delayed" ? 20 : input.controlQuality === "off-balance" ? 30 : 0;
      moveWeight(weights, "double-play", "force-out-second", speedPenalty + controlPenalty);
    }
    return utils.normalizeWeights(weights);
  }

  function defensiveStateDelta(resultType) {
    const values = {
      "batter-out-runner-second": [1, 0, 2],
      "force-out-second": [1, 1, 0],
      "double-play": [2, 0, 0],
      "all-safe": [0, 1, 2],
      "throwing-error": [0, 2, 3],
      "ball-through": [0, 1, 3],
      "fielding-error": [0, 1, 2]
    }[resultType];
    return {
      resultType,
      outsAdded: values[0],
      runsAllowed: 0,
      batterBase: values[1],
      runnerFromFirstBase: values[2],
      inningEnded: 1 + values[0] >= 3
    };
  }

  function validatePlayInput(input) {
    if (!utils.isPlainObject(input) || !utils.isPlainObject(input.situation) || !utils.isPlainObject(input.player)) return "input-shape";
    if (!utils.isEnum(input.situation.ballType, BALL_TYPES)) return "ball-type";
    if (!utils.isEnum(input.situation.ballDifficulty, DIFFICULTIES)) return "ball-difficulty";
    if (!utils.isEnum(input.situation.batterSpeed, SPEEDS)) return "batter-speed";
    if (!utils.isEnum(input.situation.runnerSpeed, SPEEDS)) return "runner-speed";
    if (!utils.isEnum(input.situation.scoreState, SCORE_STATES)) return "score-state";
    if (!utils.isEnum(input.player.fielding, SKILL_LEVELS)) return "fielding";
    if (!utils.isEnum(input.player.throwing, SKILL_LEVELS)) return "throwing";
    if (!utils.isEnum(input.player.body, BODY_STATES)) return "body";
    if (!utils.isEnum(input.fieldingApproach, FIELDING_APPROACH_IDS)) return "fielding-approach";
    if (input.fieldingApproach === "dive" && !isDiveAvailable(input.situation.ballType, input.situation.ballDifficulty)) return "dive-unavailable";
    if (input.throwDecision !== null && input.throwDecision !== undefined && !utils.isEnum(input.throwDecision, THROW_DECISION_IDS)) return "throw-decision";
    if (!utils.validateRolls(input.rolls, ["fieldingExecution", "fieldingResult", "throwExecution", "result"])) return "rolls";
    return null;
  }

  function resolveDefensivePlay(input) {
    const invalid = validatePlayInput(input);
    if (invalid) return utils.unresolved(input, invalid, "Defensive prototype input failed exact validation.");
    const fieldingDecision = resolveFieldingDecision({
      ballType: input.situation.ballType,
      ballDifficulty: input.situation.ballDifficulty,
      batterSpeed: input.situation.batterSpeed,
      fielding: input.player.fielding,
      body: input.player.body,
      fieldingApproach: input.fieldingApproach
    });
    const fieldingExecution = resolveFieldingExecution({
      ballDifficulty: input.situation.ballDifficulty,
      fielding: input.player.fielding,
      body: input.player.body,
      decisionQuality: fieldingDecision.quality,
      executionRoll: input.rolls.fieldingExecution
    });
    const trace = fieldingDecision.trace.concat(fieldingExecution.trace);
    if (fieldingExecution.controlQuality === "failed") {
      const resultType = input.rolls.fieldingResult < 0.5 ? "ball-through" : "fielding-error";
      const stateDelta = defensiveStateDelta(resultType);
      trace.push({ stage: "fielding-result", resultType, roll: input.rolls.fieldingResult });
      return utils.deepFreeze({
        status: "resolved",
        input: utils.clone(input),
        baseState: { inning: 7, outs: 1, runnerOnFirst: true },
        fielding: { decision: fieldingDecision, execution: fieldingExecution },
        control: { quality: "failed" },
        throwDecision: { status: "unavailable", reason: "fielding-failed" },
        throwExecution: null,
        result: { distribution: { "ball-through": 50, "fielding-error": 50 }, resultType },
        stateDelta,
        trace
      });
    }
    if (!input.throwDecision) return utils.unresolved(input, "throw-decision", "A throw decision is required after ball control.");
    const throwDecision = resolveThrowDecision({
      scoreState: input.situation.scoreState,
      runnerSpeed: input.situation.runnerSpeed,
      batterSpeed: input.situation.batterSpeed,
      controlQuality: fieldingExecution.controlQuality,
      throwDecision: input.throwDecision
    });
    const throwExecution = resolveThrowExecution({
      throwing: input.player.throwing,
      controlQuality: fieldingExecution.controlQuality,
      body: input.player.body,
      decisionQuality: throwDecision.quality,
      executionRoll: input.rolls.throwExecution
    });
    const distribution = throwResultDistribution({
      throwDecision: input.throwDecision,
      runnerSpeed: input.situation.runnerSpeed,
      batterSpeed: input.situation.batterSpeed,
      controlQuality: fieldingExecution.controlQuality
    }, throwExecution.tier);
    const resultType = utils.sampleDistribution(distribution, input.rolls.result);
    const stateDelta = defensiveStateDelta(resultType);
    trace.push(...throwDecision.trace, ...throwExecution.trace, { stage: "throw-result", distribution: utils.clone(distribution), resultType, roll: input.rolls.result });
    return utils.deepFreeze({
      status: "resolved",
      input: utils.clone(input),
      baseState: { inning: 7, outs: 1, runnerOnFirst: true },
      fielding: { decision: fieldingDecision, execution: fieldingExecution },
      control: { quality: fieldingExecution.controlQuality },
      throwDecision,
      throwExecution,
      result: { distribution, resultType },
      stateDelta,
      trace
    });
  }

  return utils.deepFreeze({
    FIELDING_APPROACH_IDS,
    THROW_DECISION_IDS,
    isDiveAvailable,
    resolveFieldingDecision,
    resolveFieldingExecution,
    resolveThrowDecision,
    resolveThrowExecution,
    resolveDefensivePlay,
    throwResultDistribution
  });
})(typeof BaseballGameplayPrototypeUtils !== "undefined" ? BaseballGameplayPrototypeUtils : (typeof require === "function" ? require("./baseball-gameplay-prototype-utils.js") : null));

if (typeof module !== "undefined" && module.exports) {
  module.exports = BaseballDefensePrototype;
}
