var BaseballOffensePrototype = ((utils) => {
  "use strict";

  if (!utils) return Object.freeze({ unavailable: true });

  const APPROACH_IDS = utils.deepFreeze(["pull", "opposite", "shorten", "sac-bunt"]);
  const BASE_STATE_IDS = utils.deepFreeze(["one-out-runner-on-first", "one-out-runner-on-second"]);
  const BASE_STATES = utils.deepFreeze({
    "one-out-runner-on-first": { outs: 1, runners: [true, false, false], leadRunnerBase: 1 },
    "one-out-runner-on-second": { outs: 1, runners: [false, true, false], leadRunnerBase: 2 }
  });
  const SCORE_STATES = ["behind-2-plus", "behind-1", "tied", "ahead"];
  const SPEEDS = ["slow", "average", "fast"];
  const PITCHER_TENDENCIES = ["inside", "outside", "breaking", "fatigued"];
  const DIFFICULTIES = ["easy", "normal", "difficult"];
  const SKILL_LEVELS = ["low", "average", "high", "elite"];
  const BODY_STATES = ["normal", "fatigued", "minor-injury"];
  const RELIABILITY = ["low", "medium", "high"];
  const DEFENSE_QUALITY = ["weak", "average", "strong"];
  const REQUIRED_ROLLS = ["execution", "battedBall", "defense", "result", "runnerAdvance"];

  const SCORE_WEIGHTS = {
    "behind-2-plus": { pull: 1, opposite: 0, shorten: 0, "sac-bunt": -2 },
    "behind-1": { pull: 0, opposite: 1, shorten: 0, "sac-bunt": 0 },
    tied: { pull: 0, opposite: 1, shorten: 0, "sac-bunt": 1 },
    ahead: { pull: 0, opposite: 1, shorten: 1, "sac-bunt": 0 }
  };
  const RUNNER_WEIGHTS_BY_BASE_STATE = {
    "one-out-runner-on-first": {
      slow: { pull: -1, opposite: 0, shorten: 0, "sac-bunt": -1 },
      average: { pull: 0, opposite: 0, shorten: 0, "sac-bunt": 0 },
      fast: { pull: 0, opposite: 1, shorten: 0, "sac-bunt": 1 }
    },
    "one-out-runner-on-second": {
      slow: { pull: 0, opposite: 0, shorten: 0, "sac-bunt": 0 },
      average: { pull: 0, opposite: 0, shorten: 0, "sac-bunt": 0 },
      fast: { pull: 0, opposite: 1, shorten: 0, "sac-bunt": 1 }
    }
  };
  const BASE_STATE_DECISION_WEIGHTS = {
    "one-out-runner-on-first": { pull: 0, opposite: 0, shorten: 0, "sac-bunt": 0 },
    "one-out-runner-on-second": { pull: 0, opposite: 1, shorten: 0, "sac-bunt": 0 }
  };
  const PITCHER_WEIGHTS = {
    outside: { pull: -1, opposite: 2, shorten: 0, "sac-bunt": 0 },
    inside: { pull: 1, opposite: -1, shorten: 0, "sac-bunt": 0 },
    breaking: { pull: -1, opposite: 0, shorten: 2, "sac-bunt": 0 },
    fatigued: { pull: 2, opposite: 0, shorten: -1, "sac-bunt": -1 }
  };
  const BODY_DECISION_WEIGHTS = {
    normal: { pull: 0, opposite: 0, shorten: 0, "sac-bunt": 0 },
    fatigued: { pull: -1, opposite: 0, shorten: 1, "sac-bunt": 0 },
    "minor-injury": { pull: -2, opposite: -1, shorten: 1, "sac-bunt": 0 }
  };
  const NEXT_BATTER_WEIGHTS = {
    high: { pull: -1, opposite: 1, shorten: 0, "sac-bunt": 1 },
    medium: { pull: 0, opposite: 0, shorten: 0, "sac-bunt": 0 },
    low: { pull: 1, opposite: 0, shorten: -1, "sac-bunt": -2 }
  };
  const SKILL_VALUES = { low: -1, average: 0, high: 1, elite: 2 };
  const DIFFICULTY_VALUES = { easy: 1, normal: 0, difficult: -1 };
  const BODY_EXECUTION_VALUES = { normal: 0, fatigued: -1, "minor-injury": -1 };
  const DEFENSE_VALUES = { weak: -1, average: 0, strong: 1 };
  const BALL_DEFENSE_VALUES = {
    "weak-grounder": 1,
    "ground-ball": 0,
    "line-drive": -1,
    "fly-ball": 0,
    "weak-pop-up": 1
  };

  const BATTED_BALL_BASE = {
    "poor-contact": { "weak-grounder": 40, "weak-pop-up": 30, "ground-ball": 20, "fly-ball": 5, "line-drive": 5 },
    "playable-contact": { "ground-ball": 35, "fly-ball": 25, "line-drive": 20, "weak-grounder": 10, "weak-pop-up": 10 },
    "solid-contact": { "line-drive": 40, "ground-ball": 25, "fly-ball": 25, "weak-grounder": 5, "weak-pop-up": 5 },
    "barreled-contact": { "line-drive": 45, "fly-ball": 40, "ground-ball": 10, "weak-grounder": 3, "weak-pop-up": 2 }
  };
  const BATTED_BALL_MODIFIERS = {
    pull: { "ground-ball": 10, "fly-ball": 5, "weak-pop-up": -5 },
    opposite: { "line-drive": 10, "ground-ball": 5, "fly-ball": -10 },
    shorten: { "ground-ball": 10, "line-drive": 10, "fly-ball": -10, "weak-pop-up": -5 }
  };
  const DEFENSE_TIERS = [
    "defense-advantage",
    "slight-defense-advantage",
    "contested",
    "slight-offense-advantage",
    "offense-advantage"
  ];
  const RESULT_TABLES = {
    "ground-ball": {
      outcomes: ["double-play", "fielders-choice", "groundout-runner-advance", "single"],
      rows: [[35, 30, 20, 15], [30, 28, 20, 22], [25, 25, 20, 30], [18, 20, 20, 42], [10, 15, 20, 55]]
    },
    "weak-grounder": {
      outcomes: ["double-play", "fielders-choice", "groundout-runner-advance", "infield-hit"],
      rows: [[50, 30, 15, 5], [42, 33, 18, 7], [35, 35, 20, 10], [25, 30, 20, 25], [15, 25, 20, 40]]
    },
    "line-drive": {
      outcomes: ["lineout", "single", "extra-base-hit"],
      rows: [[55, 35, 10], [45, 45, 10], [35, 50, 15], [25, 55, 20], [15, 55, 30]]
    },
    "fly-ball": {
      outcomes: ["flyout", "single", "extra-base-hit"],
      rows: [[80, 8, 12], [72, 8, 20], [65, 10, 25], [55, 10, 35], [45, 10, 45]]
    },
    "weak-pop-up": {
      outcomes: ["popout", "fielding-error"],
      rows: [[97, 3], [94, 6], [90, 10], [85, 15], [75, 25]]
    }
  };
  const RUNNER_SECOND_RESULT_TABLES = {
    "ground-ball": {
      outcomes: ["groundout", "single"],
      rows: [[70, 30], [62, 38], [55, 45], [45, 55], [35, 65]]
    },
    "weak-grounder": {
      outcomes: ["groundout", "infield-hit"],
      rows: [[85, 15], [80, 20], [70, 30], [55, 45], [45, 55]]
    }
  };
  const BUNT_TABLES = {
    "poor-bunt": { "lead-runner-out": 45, "batter-out-runner-second": 40, "all-safe": 15 },
    "playable-bunt": { "lead-runner-out": 25, "batter-out-runner-second": 60, "all-safe": 15 },
    "good-bunt": { "lead-runner-out": 10, "batter-out-runner-second": 75, "all-safe": 15 },
    "excellent-bunt": { "lead-runner-out": 5, "batter-out-runner-second": 70, "bunt-single": 25 }
  };
  const RUNNER_SECOND_BUNT_TABLES = {
    "poor-bunt": { "lead-runner-out-third": 40, "batter-out-runner-third": 40, "all-safe": 20 },
    "playable-bunt": { "lead-runner-out-third": 20, "batter-out-runner-third": 60, "all-safe": 20 },
    "good-bunt": { "lead-runner-out-third": 10, "batter-out-runner-third": 70, "all-safe": 20 },
    "excellent-bunt": { "lead-runner-out-third": 5, "batter-out-runner-third": 65, "bunt-single": 30 }
  };

  function validateInput(input) {
    if (!utils.isPlainObject(input) || !utils.isPlainObject(input.situation) || !utils.isPlainObject(input.player)) return "input-shape";
    if (!utils.isEnum(input.situation.baseState, BASE_STATE_IDS)) return "base-state";
    if (!utils.isEnum(input.situation.scoreState, SCORE_STATES)) return "score-state";
    if (!utils.isEnum(input.situation.runnerSpeed, SPEEDS)) return "runner-speed";
    if (!utils.isEnum(input.situation.pitcherTendency, PITCHER_TENDENCIES)) return "pitcher-tendency";
    if (!utils.isEnum(input.approach, APPROACH_IDS)) return "approach";
    if (!utils.isEnum(input.pitchDifficulty, DIFFICULTIES)) return "pitch-difficulty";
    if (!utils.isEnum(input.defenseQuality, DEFENSE_QUALITY)) return "defense-quality";
    if (![input.player.power, input.player.contact, input.player.bunt].every(value => utils.isEnum(value, SKILL_LEVELS))) return "skill";
    if (!utils.isEnum(input.player.body, BODY_STATES)) return "body";
    if (!utils.isEnum(input.player.nextBatterReliability, RELIABILITY)) return "next-batter";
    if (!utils.validateRolls(input.rolls, REQUIRED_ROLLS)) return "rolls";
    return null;
  }

  function skillDecisionModifier(input) {
    if (input.approach === "pull" && ["high", "elite"].includes(input.player.power)) return 2;
    if (["opposite", "shorten"].includes(input.approach) && ["high", "elite"].includes(input.player.contact)) return 1;
    if (input.approach === "sac-bunt" && ["high", "elite"].includes(input.player.bunt)) return 2;
    return 0;
  }

  function evaluateDecision(input) {
    const approach = input.approach;
    const modifiers = {
      scoreState: SCORE_WEIGHTS[input.situation.scoreState][approach],
      runnerSpeed: RUNNER_WEIGHTS_BY_BASE_STATE[input.situation.baseState][input.situation.runnerSpeed][approach],
      baseState: BASE_STATE_DECISION_WEIGHTS[input.situation.baseState][approach],
      pitcherTendency: PITCHER_WEIGHTS[input.situation.pitcherTendency][approach],
      skillFit: skillDecisionModifier(input),
      body: BODY_DECISION_WEIGHTS[input.player.body][approach],
      nextBatter: NEXT_BATTER_WEIGHTS[input.player.nextBatterReliability][approach],
      outCost: approach === "sac-bunt" ? -1 : 0
    };
    const rawScore = Object.values(modifiers).reduce((sum, value) => sum + value, 0);
    return { rawScore, quality: utils.qualityFromScore(rawScore), modifiers };
  }

  function relevantSkillFor(input) {
    return input.approach === "pull" ? "power" : input.approach === "sac-bunt" ? "bunt" : "contact";
  }

  function swingTier(score, skill, approach) {
    let tier;
    if (score <= -2) tier = "miss";
    else if (score === -1) tier = "poor-contact";
    else if (score === 0) tier = "playable-contact";
    else if (score <= 2) tier = "solid-contact";
    else tier = ["high", "elite"].includes(skill) ? "barreled-contact" : "solid-contact";
    if (approach === "shorten" && tier === "barreled-contact") return "solid-contact";
    return tier;
  }

  function buntTier(score, skill) {
    if (score <= -2) return "failed-bunt";
    if (score === -1) return "poor-bunt";
    if (score === 0) return "playable-bunt";
    if (score <= 2) return "good-bunt";
    return ["high", "elite"].includes(skill) ? "excellent-bunt" : "good-bunt";
  }

  function resolveExecution(input, decision) {
    const relevantSkill = relevantSkillFor(input);
    const skill = input.player[relevantSkill];
    const variance = utils.varianceFromRoll(input.rolls.execution);
    const components = {
      skill: SKILL_VALUES[skill],
      pitchDifficulty: DIFFICULTY_VALUES[input.pitchDifficulty],
      body: BODY_EXECUTION_VALUES[input.player.body],
      decisionQuality: utils.qualityModifier(decision.quality),
      variance
    };
    const score = Object.values(components).reduce((sum, value) => sum + value, 0);
    return {
      score,
      tier: input.approach === "sac-bunt" ? buntTier(score, skill) : swingTier(score, skill, input.approach),
      relevantSkill,
      relevantSkillLevel: skill,
      variance,
      components
    };
  }

  function resolveBattedBall(input, execution) {
    if (execution.tier === "miss" || input.approach === "sac-bunt") return null;
    const weights = Object.assign({}, BATTED_BALL_BASE[execution.tier]);
    Object.entries(BATTED_BALL_MODIFIERS[input.approach]).forEach(([key, value]) => {
      weights[key] = (weights[key] || 0) + value;
    });
    const distribution = utils.normalizeWeights(weights);
    return { distribution, profile: utils.sampleDistribution(distribution, input.rolls.battedBall) };
  }

  function defenseTier(score) {
    if (score >= 2) return "defense-advantage";
    if (score === 1) return "slight-defense-advantage";
    if (score === 0) return "contested";
    if (score === -1) return "slight-offense-advantage";
    return "offense-advantage";
  }

  function resolveDefense(input, battedBall) {
    if (!battedBall) return null;
    const variance = utils.varianceFromRoll(input.rolls.defense);
    const score = BALL_DEFENSE_VALUES[battedBall.profile] + DEFENSE_VALUES[input.defenseQuality] + variance;
    return { score, tier: defenseTier(score), variance };
  }

  function distributionFromRow(outcomes, row) {
    const weights = {};
    outcomes.forEach((outcome, index) => { weights[outcome] = row[index]; });
    return weights;
  }

  function applyRunnerModifier(profile, speed, weights) {
    if (!["ground-ball", "weak-grounder"].includes(profile) || speed === "average") return weights;
    const adjusted = Object.assign({}, weights);
    if (speed === "slow") {
      adjusted["double-play"] += 10;
      adjusted[profile === "ground-ball" ? "single" : "infield-hit"] -= 5;
      adjusted["fielders-choice"] -= 5;
    } else {
      adjusted["double-play"] -= 10;
      adjusted[profile === "ground-ball" ? "single" : "infield-hit"] += 10;
    }
    return adjusted;
  }

  function buntDistribution(baseStateId, executionTier, defenseQuality) {
    if (executionTier === "failed-bunt") return { strikeout: 100 };
    const runnerOnSecond = baseStateId === "one-out-runner-on-second";
    const tables = runnerOnSecond ? RUNNER_SECOND_BUNT_TABLES : BUNT_TABLES;
    const leadOutKey = runnerOnSecond ? "lead-runner-out-third" : "lead-runner-out";
    const weights = Object.assign({}, tables[executionTier]);
    const successKey = executionTier === "excellent-bunt" ? "bunt-single" : "all-safe";
    if (defenseQuality === "strong") {
      const moved = Math.min(10, weights[successKey]);
      weights[successKey] -= moved;
      weights[leadOutKey] += moved;
    } else if (defenseQuality === "weak") {
      const moved = Math.min(10, weights[leadOutKey]);
      weights[leadOutKey] -= moved;
      weights[successKey] = (weights[successKey] || 0) + moved;
    }
    return utils.normalizeWeights(weights);
  }

  function runnersAfter(batterBase, leadRunnerBase) {
    const runners = [false, false, false];
    if (batterBase >= 1 && batterBase <= 3) runners[batterBase - 1] = true;
    if (leadRunnerBase >= 1 && leadRunnerBase <= 3) runners[leadRunnerBase - 1] = true;
    return runners;
  }

  function runnerSecondGroundoutBase(approach, speed, roll) {
    const thresholds = {
      pull: { slow: 0.2, average: 0.3, fast: 0.4 },
      opposite: { slow: 0.55, average: 0.7, fast: 0.8 },
      shorten: { slow: 0.45, average: 0.6, fast: 0.7 }
    };
    return roll < thresholds[approach][speed] ? 3 : 2;
  }

  function runnerSecondSingleBase(speed, roll) {
    const thirdBaseThreshold = { slow: 0.7, average: 0.4, fast: 0.2 }[speed];
    return roll < thirdBaseThreshold ? 3 : 4;
  }

  function stateDeltaRunnerFirst(resultType, runnerSpeed, runnerRoll) {
    const simple = {
      strikeout: [1, 0, 1],
      "double-play": [2, 0, 0],
      "fielders-choice": [1, 1, 0],
      "groundout-runner-advance": [1, 0, 2],
      "infield-hit": [0, 1, 2],
      lineout: [1, 0, 1],
      flyout: [1, 0, 1],
      popout: [1, 0, 1],
      "fielding-error": [0, 1, 2],
      "lead-runner-out": [1, 1, 0],
      "batter-out-runner-second": [1, 0, 2],
      "all-safe": [0, 1, 2],
      "bunt-single": [0, 1, 2]
    };
    let outsAdded = 0;
    let batterBase = 0;
    let runnerFromFirstBase = 0;
    let runsScored = 0;
    if (resultType === "single") {
      batterBase = 1;
      runnerFromFirstBase = runnerSpeed === "slow" ? 2 : runnerSpeed === "average" ? (runnerRoll < 0.7 ? 2 : 3) : (runnerRoll < 0.4 ? 2 : 3);
    } else if (resultType === "extra-base-hit") {
      batterBase = 2;
      runnerFromFirstBase = runnerSpeed === "slow" ? 3 : runnerSpeed === "average" ? (runnerRoll < 0.5 ? 3 : 4) : (runnerRoll < 0.25 ? 3 : 4);
      runsScored = runnerFromFirstBase === 4 ? 1 : 0;
    } else {
      [outsAdded, batterBase, runnerFromFirstBase] = simple[resultType];
    }
    const leadRunner = { fromBase: 1, toBase: runnerFromFirstBase };
    return {
      resultType,
      outsAdded,
      runsScored,
      batterBase,
      leadRunner,
      runnersAfter: runnersAfter(batterBase, runnerFromFirstBase),
      runnerFromFirstBase,
      runnerFromSecondBase: null,
      inningEnded: 1 + outsAdded >= 3
    };
  }

  function stateDeltaRunnerSecond(resultType, approach, runnerSpeed, runnerRoll) {
    let outsAdded = 0;
    let runsScored = 0;
    let batterBase = 0;
    let runnerFromSecondBase = 2;

    if (resultType === "groundout") {
      outsAdded = 1;
      runnerFromSecondBase = runnerSecondGroundoutBase(approach, runnerSpeed, runnerRoll);
    } else if (resultType === "single") {
      batterBase = 1;
      runnerFromSecondBase = runnerSecondSingleBase(runnerSpeed, runnerRoll);
    } else if (resultType === "infield-hit") {
      batterBase = 1;
    } else if (resultType === "extra-base-hit") {
      batterBase = 2;
      runnerFromSecondBase = 4;
    } else if (resultType === "fielding-error") {
      batterBase = 1;
      runnerFromSecondBase = 3;
    } else if (["strikeout", "lineout", "flyout", "popout"].includes(resultType)) {
      outsAdded = 1;
    } else if (resultType === "lead-runner-out-third") {
      outsAdded = 1;
      batterBase = 1;
      runnerFromSecondBase = 0;
    } else if (resultType === "batter-out-runner-third") {
      outsAdded = 1;
      runnerFromSecondBase = 3;
    } else if (["all-safe", "bunt-single"].includes(resultType)) {
      batterBase = 1;
      runnerFromSecondBase = 3;
    }

    runsScored = runnerFromSecondBase === 4 ? 1 : 0;
    const leadRunner = { fromBase: 2, toBase: runnerFromSecondBase };
    return {
      resultType,
      outsAdded,
      runsScored,
      batterBase,
      leadRunner,
      runnersAfter: runnersAfter(batterBase, runnerFromSecondBase),
      runnerFromFirstBase: null,
      runnerFromSecondBase,
      inningEnded: 1 + outsAdded >= 3
    };
  }

  function stateDelta(input, resultType) {
    if (input.situation.baseState === "one-out-runner-on-second") {
      return stateDeltaRunnerSecond(resultType, input.approach, input.situation.runnerSpeed, input.rolls.runnerAdvance);
    }
    return stateDeltaRunnerFirst(resultType, input.situation.runnerSpeed, input.rolls.runnerAdvance);
  }

  function resolveResult(input, execution, battedBall, defense) {
    let distribution;
    if (input.approach === "sac-bunt") {
      distribution = buntDistribution(input.situation.baseState, execution.tier, input.defenseQuality);
    } else if (execution.tier === "miss") {
      distribution = { strikeout: 100 };
    } else {
      const table = input.situation.baseState === "one-out-runner-on-second"
        ? (RUNNER_SECOND_RESULT_TABLES[battedBall.profile] || RESULT_TABLES[battedBall.profile])
        : RESULT_TABLES[battedBall.profile];
      const row = table.rows[DEFENSE_TIERS.indexOf(defense.tier)];
      const baseWeights = distributionFromRow(table.outcomes, row);
      const weights = input.situation.baseState === "one-out-runner-on-first"
        ? applyRunnerModifier(battedBall.profile, input.situation.runnerSpeed, baseWeights)
        : baseWeights;
      distribution = utils.normalizeWeights(weights);
    }
    const resultType = utils.sampleDistribution(distribution, input.rolls.result);
    return { distribution, resultType, stateDelta: stateDelta(input, resultType) };
  }

  function resolveAtBat(input) {
    const invalid = validateInput(input);
    if (invalid) return utils.unresolved(input, invalid, "Offensive prototype input failed exact validation.");
    const decision = evaluateDecision(input);
    const execution = resolveExecution(input, decision);
    const battedBall = resolveBattedBall(input, execution);
    const defense = resolveDefense(input, battedBall);
    const result = resolveResult(input, execution, battedBall, defense);
    const trace = [
      { stage: "decision-quality", rawScore: decision.rawScore, quality: decision.quality, modifiers: utils.clone(decision.modifiers) },
      { stage: "execution", score: execution.score, tier: execution.tier, components: utils.clone(execution.components), roll: input.rolls.execution },
      { stage: "batted-ball", distribution: battedBall ? utils.clone(battedBall.distribution) : null, profile: battedBall ? battedBall.profile : null, roll: input.rolls.battedBall },
      { stage: "defense", score: defense ? defense.score : null, tier: defense ? defense.tier : null, roll: input.rolls.defense },
      { stage: "result", distribution: utils.clone(result.distribution), resultType: result.resultType, resultRoll: input.rolls.result, runnerAdvanceRoll: input.rolls.runnerAdvance, leadRunner: utils.clone(result.stateDelta.leadRunner), runnersAfter: utils.clone(result.stateDelta.runnersAfter) }
    ];
    const baseState = BASE_STATES[input.situation.baseState];
    return utils.deepFreeze({
      status: "resolved",
      input: utils.clone(input),
      baseState: { inning: 7, outs: baseState.outs, scoreFor: { "behind-2-plus": 0, "behind-1": 1, tied: 1, ahead: 2 }[input.situation.scoreState], scoreAgainst: { "behind-2-plus": 2, "behind-1": 2, tied: 1, ahead: 1 }[input.situation.scoreState], runners: utils.clone(baseState.runners) },
      decision,
      execution,
      battedBall,
      defense,
      result,
      trace
    });
  }

  return utils.deepFreeze({
    APPROACH_IDS,
    BASE_STATE_IDS,
    getSupportedBaseStates: () => BASE_STATE_IDS,
    resolveAtBat,
    evaluateDecision,
    resolveExecution,
    resolveBattedBall,
    resolveDefense
  });
})(typeof BaseballGameplayPrototypeUtils !== "undefined" ? BaseballGameplayPrototypeUtils : (typeof require === "function" ? require("./baseball-gameplay-prototype-utils.js") : null));

if (typeof module !== "undefined" && module.exports) {
  module.exports = BaseballOffensePrototype;
}
