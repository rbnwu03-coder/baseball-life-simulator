const SAVE_VERSION = 15;

// Phase 2：創角 Identity 的唯一 runtime 合法值來源。
// UI 與創角流程可以呈現或使用這些值，但輸入是否合法由此契約判定。
var PlayerIdentityOptions = Object.freeze({
  origins: Object.freeze(["prove", "understand", "belong"]),
  idealSelf: Object.freeze(["全能型", "強打型", "技巧型", "守備型", "速度型", "棒球理解型"]),
  bats: Object.freeze(["R", "L", "S"]),
  throws: Object.freeze(["R", "L"])
});

const CHARACTER_GENESIS_ABILITY_KEYS = Object.freeze([
  "ballSense", "observe", "fitness", "batting", "baseRunning", "baseballIQ"
]);

const INITIAL_SKILL_FORMULA_VERSION = "initial-skills-v1";
const HS_ENTRY_CAPABILITY_SETTLEMENT_VERSION = "hs-entry-capability-v1";
const UNIVERSAL_BASEBALL_SKILL_KEYS = Object.freeze([
  "catching", "throwing", "batting", "baseRunning", "baseballIQ", "armStrength", "reaction", "range"
]);
const SPECIALIST_BASEBALL_SKILL_KEYS = Object.freeze([
  "blocking", "gameCalling", "control", "pitchStamina"
]);
const CAPABILITY_MUTATION_SOURCE_TYPES = Object.freeze({
  LEGACY_YOUTH: "legacy-youth-skill-effect",
  YOUTH_OUTCOME_V1: "youth-event-outcome-v1",
  SPECIALIST_ACTIVATION: "specialist-activation",
  DEVELOPMENT: "development-event",
  MIGRATION: "migration",
  LEGACY_NORMALIZATION: "legacy-normalization",
  DEBUG_BOOKMARK: "debug-bookmark-fixture"
});
const LEGACY_YOUTH_SOURCE_CONTRACT = "legacy-youth-narrative-v0";
const YOUTH_OUTCOME_V1_SOURCE_CONTRACT = "youth-event-outcome-v1";
const CAPABILITY_PROVENANCE_SOURCE_ORDER = Object.freeze([
  "initial-formula",
  CAPABILITY_MUTATION_SOURCE_TYPES.LEGACY_YOUTH,
  CAPABILITY_MUTATION_SOURCE_TYPES.YOUTH_OUTCOME_V1,
  CAPABILITY_MUTATION_SOURCE_TYPES.SPECIALIST_ACTIVATION,
  CAPABILITY_MUTATION_SOURCE_TYPES.DEVELOPMENT,
  CAPABILITY_MUTATION_SOURCE_TYPES.DEBUG_BOOKMARK,
  CAPABILITY_MUTATION_SOURCE_TYPES.MIGRATION,
  CAPABILITY_MUTATION_SOURCE_TYPES.LEGACY_NORMALIZATION
]);

const IDEAL_SELF_STARTING_BIASES = Object.freeze({
  "全能型": Object.freeze({ batting: 0.25, baseRunning: 0.25, baseballIQ: 0.25, catching: 0.25 }),
  "強打型": Object.freeze({ batting: 0.5, armStrength: 0.25 }),
  "技巧型": Object.freeze({ batting: 0.25, catching: 0.25, throwing: 0.25, baseballIQ: 0.25 }),
  "守備型": Object.freeze({ catching: 0.5, throwing: 0.5, reaction: 0.5, range: 0.5, armStrength: 0.25 }),
  "速度型": Object.freeze({ baseRunning: 0.5, range: 0.5, reaction: 0.25 }),
  "棒球理解型": Object.freeze({ baseballIQ: 0.5, throwing: 0.25, baseRunning: 0.25 })
});

const INITIAL_SKILL_FORMULAS = Object.freeze({
  catching: Object.freeze({ ballSense: 0.45, observe: 0.30, baseballIQ: 0.15 }),
  throwing: Object.freeze({ ballSense: 0.35, baseballIQ: 0.25, observe: 0.20, fitness: 0.10 }),
  batting: Object.freeze({ batting: 0.60, ballSense: 0.25, observe: 0.15 }),
  baseRunning: Object.freeze({ baseRunning: 0.55, fitness: 0.20, observe: 0.15, baseballIQ: 0.10 }),
  baseballIQ: Object.freeze({ baseballIQ: 0.60, observe: 0.25, ballSense: 0.15 }),
  armStrength: Object.freeze({ fitness: 0.50, ballSense: 0.20 }),
  reaction: Object.freeze({ ballSense: 0.40, observe: 0.35, fitness: 0.15 }),
  range: Object.freeze({ fitness: 0.35, observe: 0.25, ballSense: 0.20, baseballIQ: 0.10 })
});

const DEVELOPMENT_STATE_VERSION = "development-v1";
const DEVELOPMENT_RESULT_VERSION = "development-result-v1";
const DEVELOPMENT_PROGRESS_THRESHOLD = 100;
const DEVELOPMENT_HISTORY_LIMIT = 200;
const DEVELOPMENT_SKILL_KEYS = Object.freeze([
  ...UNIVERSAL_BASEBALL_SKILL_KEYS,
  ...SPECIALIST_BASEBALL_SKILL_KEYS
]);
const DEVELOPMENT_SOURCE_TYPES = Object.freeze([
  "training", "event", "gameExperience", "coachInstruction", "debug"
]);
const DEVELOPMENT_ACTIVITY_TYPES = Object.freeze([
  "technical", "physical", "recognition", "decision", "repetition", "specialist"
]);
const DEVELOPMENT_DIFFICULTIES = Object.freeze(["easy", "appropriate", "challenging", "overmatched"]);
const DEVELOPMENT_QUALITIES = Object.freeze(["limited", "standard", "good", "elite"]);

const DEVELOPMENT_ACTIVITY_TRAIT_WEIGHTS = Object.freeze({
  technical: Object.freeze({ ballSense: 0.45, observe: 0.30, baseballIQ: 0.25 }),
  physical: Object.freeze({ fitness: 0.55, ballSense: 0.25, baseRunning: 0.20 }),
  recognition: Object.freeze({ observe: 0.45, baseballIQ: 0.35, ballSense: 0.20 }),
  decision: Object.freeze({ baseballIQ: 0.55, observe: 0.35, ballSense: 0.10 }),
  repetition: Object.freeze({ fitness: 0.40, ballSense: 0.35, observe: 0.25 }),
  specialist: Object.freeze({ ballSense: 0.30, observe: 0.25, baseballIQ: 0.25, fitness: 0.20 })
});

const DEVELOPMENT_SKILL_LEARNING_PROFILES = Object.freeze({
  catching: Object.freeze({ technical: 0.60, recognition: 0.40 }),
  throwing: Object.freeze({ technical: 0.55, physical: 0.45 }),
  batting: Object.freeze({ technical: 0.55, recognition: 0.45 }),
  baseRunning: Object.freeze({ physical: 0.55, decision: 0.45 }),
  baseballIQ: Object.freeze({ decision: 0.60, recognition: 0.40 }),
  armStrength: Object.freeze({ physical: 0.80, repetition: 0.20 }),
  reaction: Object.freeze({ recognition: 0.60, physical: 0.40 }),
  range: Object.freeze({ physical: 0.55, recognition: 0.45 }),
  blocking: Object.freeze({ specialist: 0.55, technical: 0.25, recognition: 0.20 }),
  gameCalling: Object.freeze({ specialist: 0.45, decision: 0.35, recognition: 0.20 }),
  control: Object.freeze({ specialist: 0.45, technical: 0.30, repetition: 0.25 }),
  pitchStamina: Object.freeze({ specialist: 0.40, physical: 0.35, repetition: 0.25 })
});

const DEVELOPMENT_IDEAL_SELF_BIASES = Object.freeze({
  "全能型": Object.freeze(DEVELOPMENT_SKILL_KEYS.reduce((result, skill) => ({ ...result, [skill]: 0.04 }), {})),
  "強打型": Object.freeze({ batting: 0.09, armStrength: 0.09 }),
  "技巧型": Object.freeze({ batting: 0.09, catching: 0.09, throwing: 0.09, baseballIQ: 0.09 }),
  "守備型": Object.freeze({ catching: 0.09, throwing: 0.09, reaction: 0.09, range: 0.09, blocking: 0.06, gameCalling: 0.06 }),
  "速度型": Object.freeze({ baseRunning: 0.09, range: 0.09, reaction: 0.09 }),
  "棒球理解型": Object.freeze({ baseballIQ: 0.09, gameCalling: 0.07, control: 0.05 })
});

const DEVELOPMENT_QUALITY_MODIFIERS = Object.freeze({
  limited: 0.80,
  standard: 1,
  good: 1.12,
  elite: 1.24
});

function createDefaultDevelopmentState(options = {}) {
  return {
    version: DEVELOPMENT_STATE_VERSION,
    formulaVersion: DEVELOPMENT_RESULT_VERSION,
    initialized: true,
    skillProgress: Object.fromEntries(DEVELOPMENT_SKILL_KEYS.map(skill => [skill, 0])),
    history: [],
    appliedSettlementIds: [],
    migration: options.migration || null
  };
}

function cloneDevelopmentValue(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function freezeDevelopmentValue(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freezeDevelopmentValue);
  return Object.freeze(value);
}

function ensureDevelopmentStateShape(target, savedState = target?.developmentState, options = {}) {
  if (!target || typeof target !== "object") return null;
  const saved = savedState && typeof savedState === "object" ? savedState : null;
  const missing = !saved || saved.version !== DEVELOPMENT_STATE_VERSION;
  const defaults = createDefaultDevelopmentState();
  const state = Object.assign(defaults, saved || {});
  state.version = DEVELOPMENT_STATE_VERSION;
  state.formulaVersion = DEVELOPMENT_RESULT_VERSION;
  state.initialized = true;
  state.skillProgress = Object.fromEntries(DEVELOPMENT_SKILL_KEYS.map(skill => {
    const currentSkill = Number(target?.baseballSkills?.[skill]);
    const value = Number(saved?.skillProgress?.[skill]);
    const progress = currentSkill >= 20 ? 0 : Math.max(0, Math.min(99, Number.isFinite(value) ? Math.floor(value) : 0));
    return [skill, progress];
  }));
  state.history = Array.isArray(saved?.history)
    ? saved.history.slice(-DEVELOPMENT_HISTORY_LIMIT).map(item => cloneDevelopmentValue(item)) : [];
  state.appliedSettlementIds = Array.isArray(saved?.appliedSettlementIds)
    ? Array.from(new Set(saved.appliedSettlementIds.filter(id => typeof id === "string" && id))).slice(-DEVELOPMENT_HISTORY_LIMIT)
    : state.history.map(item => item.settlementId).filter(Boolean).slice(-DEVELOPMENT_HISTORY_LIMIT);
  state.migration = saved?.migration ? cloneDevelopmentValue(saved.migration)
    : options.migrateMissing && missing ? {
      from: "missing-development-state",
      to: DEVELOPMENT_STATE_VERSION,
      sourceSaveVersion: options.sourceSaveVersion ?? null,
      initializedProgress: 0,
      preservedBaseballSkills: true
    } : null;
  target.developmentState = state;
  return state;
}

function getDevelopmentTraitValue(target, traitKey) {
  if (["ballSense", "observe", "fitness"].includes(traitKey)) {
    const current = Number(target?.[traitKey]);
    if (Number.isFinite(current) && current > 0) return current;
  }
  const genesis = getFinalizedGenesisAbilities(target);
  const value = Number(genesis?.[traitKey]);
  return Number.isFinite(value) && value > 0 ? value : 3;
}

function getDevelopmentTraitWeights(targetSkill, activityType) {
  const combined = {};
  const addWeights = (weights, share) => Object.entries(weights || {}).forEach(([trait, weight]) => {
    combined[trait] = (combined[trait] || 0) + weight * share;
  });
  addWeights(DEVELOPMENT_ACTIVITY_TRAIT_WEIGHTS[activityType], 0.60);
  Object.entries(DEVELOPMENT_SKILL_LEARNING_PROFILES[targetSkill] || {}).forEach(([profileActivity, weight]) => {
    addWeights(DEVELOPMENT_ACTIVITY_TRAIT_WEIGHTS[profileActivity], weight * 0.40);
  });
  const total = Object.values(combined).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(Object.entries(combined).map(([trait, weight]) => [trait, weight / total]));
}

function calculateDevelopmentTraitScore(target, targetSkill, activityType) {
  const weights = getDevelopmentTraitWeights(targetSkill, activityType);
  const contributions = Object.entries(weights).map(([trait, weight]) => ({
    trait,
    traitValue: getDevelopmentTraitValue(target, trait),
    weight,
    contribution: getDevelopmentTraitValue(target, trait) * weight
  }));
  const score = contributions.reduce((sum, item) => sum + item.contribution, 0);
  return { score, weights, contributions };
}

function getDevelopmentSkillDifficultyModifier(skill) {
  const value = Math.max(0, Math.min(20, Number(skill) || 0));
  if (value <= 4) return 1.20;
  if (value <= 8) return 1;
  if (value <= 12) return 0.80;
  if (value <= 16) return 0.60;
  if (value <= 19) return 0.40;
  return 0;
}

function getDevelopmentDifficultyFitModifier(difficulty, currentSkill, traitScore) {
  const readiness = Math.max(0, Math.min(1,
    (Math.max(0, Math.min(20, Number(currentSkill) || 0)) / 20) * 0.55
    + (Math.max(1, Math.min(5, traitScore)) - 1) / 4 * 0.45
  ));
  const modifier = difficulty === "easy" ? 0.72
    : difficulty === "appropriate" ? 1
      : difficulty === "challenging" ? 0.82 + readiness * 0.25
        : 0.35 + readiness * 0.30;
  return { modifier, readiness };
}

function getDevelopmentBiasModifier(target, targetSkill) {
  const bias = Number(DEVELOPMENT_IDEAL_SELF_BIASES[target?.idealSelf]?.[targetSkill]) || 0;
  return { modifier: 1 + bias, bias };
}

function getDevelopmentVariation(target, context, settlementId) {
  const characterSeed = target?.capabilityState?.characterSeed || createCapabilityCharacterSeed(target);
  const sample = stableCapabilityHash([
    characterSeed,
    DEVELOPMENT_RESULT_VERSION,
    settlementId,
    context.sourceId,
    context.playerChoice,
    context.targetSkill
  ].join("|")) / 4294967295;
  const amplitude = context.activityType === "repetition" ? 0.03 : 0.06;
  return { sample, modifier: 1 + (sample * 2 - 1) * amplitude };
}

function validateDevelopmentContext(target, context = {}) {
  const errors = [];
  if (!target || typeof target !== "object") errors.push("invalid-player");
  if (!DEVELOPMENT_SOURCE_TYPES.includes(context.sourceType)) errors.push("invalid-source-type");
  if (!context.sourceId || typeof context.sourceId !== "string") errors.push("missing-source-id");
  if (!DEVELOPMENT_SKILL_KEYS.includes(context.targetSkill)) errors.push("invalid-target-skill");
  if (!DEVELOPMENT_ACTIVITY_TYPES.includes(context.activityType)) errors.push("invalid-activity-type");
  if (!DEVELOPMENT_DIFFICULTIES.includes(context.difficulty)) errors.push("invalid-difficulty");
  if (!DEVELOPMENT_QUALITIES.includes(context.quality)) errors.push("invalid-quality");
  if (!context.playerChoice || typeof context.playerChoice !== "string") errors.push("missing-player-choice");
  const currentSkill = Number(target?.baseballSkills?.[context.targetSkill]);
  if (!Number.isFinite(currentSkill) || currentSkill < 0 || currentSkill > 20) errors.push("invalid-current-skill");
  if (SPECIALIST_BASEBALL_SKILL_KEYS.includes(context.targetSkill)) {
    const specialistType = ["blocking", "gameCalling"].includes(context.targetSkill) ? "catcher" : "pitcher";
    const experience = Number(target?.capabilityState?.specialistExperience?.[specialistType]) || 0;
    if (context.activityType !== "specialist" || context.metadata?.specialistEligible !== true || experience <= 0) {
      errors.push("specialist-activation-required");
    }
  }
  return { ok: errors.length === 0, errors };
}

function settleDevelopmentProgress(skillBefore, progressBefore, progressGained) {
  let skill = Math.max(0, Math.min(20, Math.floor(Number(skillBefore) || 0)));
  let progress = Math.max(0, Math.floor(Number(progressBefore) || 0));
  const gained = Math.max(0, Math.floor(Number(progressGained) || 0));
  if (skill >= 20) return { skillAfter: 20, progressAfter: 0, levelUps: 0, skillCapReached: true };
  progress += gained;
  let levelUps = 0;
  while (progress >= DEVELOPMENT_PROGRESS_THRESHOLD && skill < 20) {
    progress -= DEVELOPMENT_PROGRESS_THRESHOLD;
    skill += 1;
    levelUps += 1;
  }
  if (skill >= 20) progress = 0;
  return { skillAfter: skill, progressAfter: progress, levelUps, skillCapReached: skill >= 20 };
}

function getDevelopmentLearningQuality(progressGained) {
  if (progressGained >= 22) return "excellent";
  if (progressGained >= 17) return "good";
  if (progressGained >= 10) return "normal";
  return "limited";
}

function applyDevelopmentResult(target, context = {}) {
  const validation = validateDevelopmentContext(target, context);
  if (!validation.ok) return freezeDevelopmentValue({ ok: false, status: "rejected", errors: validation.errors.slice() });
  const state = ensureDevelopmentStateShape(target);
  const settlementId = String(context.settlementId || context.metadata?.settlementId
    || `${context.sourceType}|${context.sourceId}|${context.playerChoice}|${context.targetSkill}`);
  if (state.appliedSettlementIds.includes(settlementId)) {
    const existing = state.history.find(item => item.settlementId === settlementId) || null;
    return freezeDevelopmentValue({ ok: true, status: "duplicate", duplicate: true, settlementId, result: cloneDevelopmentValue(existing) });
  }

  const targetSkill = context.targetSkill;
  const skillBefore = Math.max(0, Math.min(20, Math.floor(Number(target.baseballSkills[targetSkill]) || 0)));
  const progressBefore = skillBefore >= 20 ? 0 : Math.max(0, Math.min(99, Math.floor(Number(state.skillProgress[targetSkill]) || 0)));
  const trait = calculateDevelopmentTraitScore(target, targetSkill, context.activityType);
  const traitModifier = Math.max(0.70, Math.min(1.35, 1 + (trait.score - 3) * 0.10));
  const skillDifficultyModifier = getDevelopmentSkillDifficultyModifier(skillBefore);
  const difficultyFit = getDevelopmentDifficultyFitModifier(context.difficulty, skillBefore, trait.score);
  const qualityModifier = DEVELOPMENT_QUALITY_MODIFIERS[context.quality];
  const bias = getDevelopmentBiasModifier(target, targetSkill);
  const variation = getDevelopmentVariation(target, context, settlementId);
  const calculatedGain = skillBefore >= 20 ? 0 : Math.max(1, Math.round(
    18 * traitModifier * skillDifficultyModifier * difficultyFit.modifier * qualityModifier * bias.modifier * variation.modifier
  ));
  const progressGained = context.sourceType === "debug" && Number.isFinite(Number(context.metadata?.progressOverride))
    ? Math.max(0, Math.floor(Number(context.metadata.progressOverride))) : calculatedGain;
  const settlement = settleDevelopmentProgress(skillBefore, progressBefore, progressGained);
  const reasons = [];
  if (skillBefore >= 20) reasons.push("skillCapReached");
  else {
    if (trait.score >= 3.6) reasons.push("strongTraitFit");
    else if (trait.score <= 2.4) reasons.push("limitedTraitFit");
    if (context.difficulty === "appropriate") reasons.push("appropriateDifficulty");
    else if (context.difficulty === "easy") reasons.push("lowChallenge");
    else if (context.difficulty === "challenging") reasons.push("challengingFit");
    else reasons.push("poorContextFit");
    if (bias.bias > 0) reasons.push("developmentBias");
    if (skillBefore >= 17) reasons.push("eliteRefinement");
    else if (skillBefore >= 9) reasons.push("highCurrentSkillDifficulty");
    if (["good", "elite"].includes(context.quality)) reasons.push("highContextQuality");
  }
  target.baseballSkills[targetSkill] = settlement.skillAfter;
  state.skillProgress[targetSkill] = settlement.progressAfter;
  const resolvedSeed = `${target?.capabilityState?.characterSeed || createCapabilityCharacterSeed(target)}|${settlementId}`;
  if (settlement.levelUps > 0) {
    recordCapabilitySkillChanges(target, { [targetSkill]: settlement.levelUps }, {
      sourceType: CAPABILITY_MUTATION_SOURCE_TYPES.DEVELOPMENT,
      sourceContract: DEVELOPMENT_RESULT_VERSION,
      eventId: context.sourceId,
      choiceId: context.playerChoice,
      provenance: "development-progress-threshold",
      resolvedSeed
    });
  }
  const record = {
    settlementId,
    developmentVersion: DEVELOPMENT_STATE_VERSION,
    formulaVersion: DEVELOPMENT_RESULT_VERSION,
    sourceId: context.sourceId,
    sourceType: context.sourceType,
    targetSkill,
    activityType: context.activityType,
    difficulty: context.difficulty,
    quality: context.quality,
    playerChoice: context.playerChoice,
    developmentBias: context.developmentBias || "ideal-self",
    skillBefore,
    skillAfter: settlement.skillAfter,
    progressBefore,
    progressGained,
    progressAfter: settlement.progressAfter,
    levelUps: settlement.levelUps,
    skillCapReached: settlement.skillCapReached,
    learningQuality: getDevelopmentLearningQuality(progressGained),
    reasons,
    resolvedSeed,
    diagnostics: {
      traitScore: trait.score,
      traitModifier,
      skillDifficultyModifier,
      difficultyFitModifier: difficultyFit.modifier,
      readiness: difficultyFit.readiness,
      qualityModifier,
      biasModifier: bias.modifier,
      variation: variation.modifier
    },
    metadata: cloneDevelopmentValue(context.metadata || {})
  };
  state.history.push(record);
  state.history = state.history.slice(-DEVELOPMENT_HISTORY_LIMIT);
  state.appliedSettlementIds.push(settlementId);
  state.appliedSettlementIds = Array.from(new Set(state.appliedSettlementIds)).slice(-DEVELOPMENT_HISTORY_LIMIT);
  return freezeDevelopmentValue({ ok: true, status: "applied", duplicate: false, settlementId, result: cloneDevelopmentValue(record) });
}

function validateDevelopmentState(target) {
  const state = target?.developmentState;
  const errors = [];
  if (!state || state.version !== DEVELOPMENT_STATE_VERSION || state.formulaVersion !== DEVELOPMENT_RESULT_VERSION || state.initialized !== true) {
    errors.push("development-state-contract-invalid");
  }
  DEVELOPMENT_SKILL_KEYS.forEach(skill => {
    const progress = Number(state?.skillProgress?.[skill]);
    if (!Number.isInteger(progress) || progress < 0 || progress > 99) errors.push(`development-progress-invalid:${skill}`);
    if (Number(target?.baseballSkills?.[skill]) >= 20 && progress !== 0) errors.push(`capped-progress-invalid:${skill}`);
  });
  if (!Array.isArray(state?.history) || !Array.isArray(state?.appliedSettlementIds)) errors.push("development-ledger-invalid");
  return { ok: errors.length === 0, errors };
}

function getDevelopmentDebugSnapshot(target) {
  const state = ensureDevelopmentStateShape(target);
  return freezeDevelopmentValue({
    version: state.version,
    formulaVersion: state.formulaVersion,
    initialized: state.initialized,
    skillProgress: cloneDevelopmentValue(state.skillProgress),
    history: cloneDevelopmentValue(state.history),
    migration: cloneDevelopmentValue(state.migration),
    lastResult: state.history.length ? cloneDevelopmentValue(state.history[state.history.length - 1]) : null
  });
}

function createDefaultCapabilityState() {
  return {
    initialized: false,
    settlementVersion: "",
    initialSkillFormulaVersion: "",
    characterSeed: "",
    initialBaseballSkills: {},
    youthOutcomes: [],
    positionExperience: {},
    specialistExperience: { catcher: 0, pitcher: 0 },
    developmentProfile: { originIdealSelf: "", biasTags: [] },
    provenance: { initialSkills: {}, capabilityLedger: [], normalizations: [], settlement: null },
    originType: "",
    migration: null
  };
}

function stableCapabilityHash(value) {
  const text = String(value ?? "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getFinalizedGenesisAbilities(target) {
  const savedFinal = target?.characterGenesis?.finalAbilities || {};
  return Object.fromEntries(CHARACTER_GENESIS_ABILITY_KEYS.map(key => {
    const savedValue = Number(savedFinal[key]);
    if (Number.isFinite(savedValue) && savedValue >= 1) return [key, savedValue];
    const base = Number(target?.characterGenesis?.baseRoll?.[key]);
    const allocation = Number(target?.characterGenesis?.allocation?.[key]);
    if (Number.isFinite(base) && base >= 1) return [key, base + (Number.isFinite(allocation) ? allocation : 0)];
    const current = ["batting", "baseRunning", "baseballIQ"].includes(key)
      ? Number(target?.baseballSkills?.[key]) : Number(target?.[key]);
    return [key, Number.isFinite(current) && current >= 1 ? Math.min(5, current) : 3];
  }));
}

function createCapabilityCharacterSeed(target, genesisAbilities = getFinalizedGenesisAbilities(target)) {
  const basis = [
    target?.name || "anonymous",
    target?.bats || "R",
    target?.throws || "R",
    ...CHARACTER_GENESIS_ABILITY_KEYS.map(key => genesisAbilities[key])
  ].join("|");
  return `cap-${stableCapabilityHash(basis).toString(16).padStart(8, "0")}`;
}

function getDeterministicSkillVariation(characterSeed, skillKey) {
  const sample = stableCapabilityHash(`${characterSeed}|${skillKey}|${INITIAL_SKILL_FORMULA_VERSION}`) / 4294967295;
  return sample - 0.5;
}

function generateInitialBaseballSkills(target) {
  if (!target?.characterGenesis?.completed) {
    return { ok: false, error: "Character Genesis 尚未完成，不能產生初始棒球技能。" };
  }
  if (!PlayerIdentityOptions.idealSelf.includes(target.idealSelf)) {
    return { ok: false, error: "Ideal Self 不合法，不能產生初始棒球技能。" };
  }
  const genesis = getFinalizedGenesisAbilities(target);
  const characterSeed = target.capabilityState?.characterSeed || createCapabilityCharacterSeed(target, genesis);
  const biases = IDEAL_SELF_STARTING_BIASES[target.idealSelf] || {};
  const skills = {};
  const trace = {};
  UNIVERSAL_BASEBALL_SKILL_KEYS.forEach(skillKey => {
    const contributions = Object.entries(INITIAL_SKILL_FORMULAS[skillKey] || {}).map(([traitKey, weight]) => ({
      trait: traitKey,
      traitValue: genesis[traitKey],
      delta: genesis[traitKey] - 3,
      weight,
      contribution: (genesis[traitKey] - 3) * weight
    }));
    const bias = Number(biases[skillKey]) || 0;
    const variation = getDeterministicSkillVariation(characterSeed, skillKey);
    const raw = 3 + contributions.reduce((sum, item) => sum + item.contribution, 0) + bias + variation;
    const result = Math.max(1, Math.min(7, Math.round(raw)));
    skills[skillKey] = result;
    trace[skillKey] = { baseline: 3, contributions, idealSelfBias: bias, variation, raw, result };
  });
  SPECIALIST_BASEBALL_SKILL_KEYS.forEach(skillKey => { skills[skillKey] = 0; });
  return { ok: true, skills, trace, genesis, characterSeed };
}

function initializePlayerCapabilityFromGenesis(target) {
  const generated = generateInitialBaseballSkills(target);
  if (!generated.ok) return generated;
  target.capabilityState = createDefaultCapabilityState();
  target.capabilityState.initialSkillFormulaVersion = INITIAL_SKILL_FORMULA_VERSION;
  target.capabilityState.characterSeed = generated.characterSeed;
  target.capabilityState.initialBaseballSkills = { ...generated.skills };
  target.capabilityState.developmentProfile = {
    originIdealSelf: target.idealSelf,
    biasTags: Object.keys(IDEAL_SELF_STARTING_BIASES[target.idealSelf] || {})
  };
  target.capabilityState.provenance.initialSkills = generated.trace;
  target.baseballSkills = { ...generated.skills };
  return { ok: true, skills: target.baseballSkills, capabilityState: target.capabilityState };
}

function ensureCapabilityStateShape(target) {
  const defaults = createDefaultCapabilityState();
  const saved = target?.capabilityState || {};
  target.capabilityState = Object.assign(defaults, saved);
  target.capabilityState.initialBaseballSkills = Object.assign({}, saved.initialBaseballSkills || {});
  target.capabilityState.youthOutcomes = Array.isArray(saved.youthOutcomes) ? saved.youthOutcomes.map(item => JSON.parse(JSON.stringify(item))) : [];
  target.capabilityState.positionExperience = Object.assign({}, saved.positionExperience || {});
  target.capabilityState.specialistExperience = Object.assign({}, defaults.specialistExperience, saved.specialistExperience || {});
  target.capabilityState.developmentProfile = Object.assign({}, defaults.developmentProfile, saved.developmentProfile || {});
  target.capabilityState.developmentProfile.biasTags = Array.isArray(saved.developmentProfile?.biasTags) ? saved.developmentProfile.biasTags.slice() : [];
  target.capabilityState.provenance = Object.assign({}, defaults.provenance, saved.provenance || {});
  target.capabilityState.provenance.initialSkills = Object.assign({}, saved.provenance?.initialSkills || {});
  target.capabilityState.provenance.capabilityLedger = Array.isArray(saved.provenance?.capabilityLedger)
    ? saved.provenance.capabilityLedger.map(item => Object.assign({}, item)) : [];
  target.capabilityState.provenance.normalizations = Array.isArray(saved.provenance?.normalizations)
    ? saved.provenance.normalizations.map(item => Object.assign({}, item, {
      skills: Array.isArray(item.skills) ? item.skills.slice() : []
    })) : [];
  return target.capabilityState;
}

function isYouthOrPreHighSchoolCapabilityPhase(target) {
  const chapter = String(target?.chapter || "");
  if (/青棒|高中|生涯轉換|發展期|職涯/.test(chapter)) return false;
  return Number(target?.age) < 16 || /十歲|少棒|位置競爭|青少棒/.test(chapter);
}

function assertCapabilityMutationSource(target, source = {}) {
  const sourceType = source.sourceType;
  const knownSources = Object.values(CAPABILITY_MUTATION_SOURCE_TYPES);
  if (!sourceType) {
    if (isYouthOrPreHighSchoolCapabilityPhase(target)) {
      throw new Error("Youth/pre-HS capability mutation 缺少明確 source contract；unknown 不得默認為 legacy。");
    }
    return CAPABILITY_MUTATION_SOURCE_TYPES.DEVELOPMENT;
  }
  if (!knownSources.includes(sourceType)) {
    throw new Error(`Unknown capability mutation sourceType: ${sourceType}`);
  }
  if (sourceType === CAPABILITY_MUTATION_SOURCE_TYPES.LEGACY_YOUTH && source.sourceContract !== LEGACY_YOUTH_SOURCE_CONTRACT) {
    throw new Error("Legacy youth capability mutation 必須明確提供 legacy source contract。");
  }
  if (sourceType === CAPABILITY_MUTATION_SOURCE_TYPES.YOUTH_OUTCOME_V1 && (
    source.sourceContract !== YOUTH_OUTCOME_V1_SOURCE_CONTRACT || source.entryPoint !== "applyYouthEventOutcome"
  )) {
    throw new Error("Youth v1 capability mutation 只能由 applyYouthEventOutcome entry point 寫入。");
  }
  return sourceType;
}

function recordCapabilitySkillChanges(target, effects = {}, source = {}) {
  if (!target?.characterGenesis?.completed) return [];
  const state = ensureCapabilityStateShape(target);
  const relevantEffects = Object.entries(effects || {}).filter(([skill, delta]) =>
    [...UNIVERSAL_BASEBALL_SKILL_KEYS, ...SPECIALIST_BASEBALL_SKILL_KEYS].includes(skill)
    && Number.isFinite(Number(delta)) && Number(delta) !== 0
  );
  if (!relevantEffects.length) return [];
  const sourceType = assertCapabilityMutationSource(target, source);
  const entries = [];
  relevantEffects.forEach(([skill, delta]) => {
    const entry = {
      skill,
      delta: Number(delta),
      sourceType,
      sourceContract: source.sourceContract || null,
      eventId: source.eventId || "runtime-event",
      choiceId: source.choiceId === undefined ? "runtime-choice" : String(source.choiceId),
      provenance: source.provenance || "choice-resolution",
      resolvedSeed: source.resolvedSeed ?? null
    };
    state.provenance.capabilityLedger.push(entry);
    entries.push(entry);
  });
  return entries;
}

function recordLegacySpecialistNormalization(target, type, skills) {
  const state = target?.capabilityState;
  if (!state?.provenance?.normalizations) return null;
  const field = `specialistExperience.${type}`;
  if (state.provenance.normalizations.some(item => item.field === field && item.sourceType === CAPABILITY_MUTATION_SOURCE_TYPES.LEGACY_NORMALIZATION)) return null;
  const entry = {
    sourceType: CAPABILITY_MUTATION_SOURCE_TYPES.LEGACY_NORMALIZATION,
    field,
    from: 0,
    to: 1,
    skills: skills.slice(),
    reason: "legacy-specialist-skill-without-explicit-experience"
  };
  state.provenance.normalizations.push(entry);
  return entry;
}

function establishSpecialistExperience(target, experience = {}) {
  const type = experience.type;
  const map = { catcher: ["blocking", "gameCalling"], pitcher: ["control", "pitchStamina"] };
  if (!map[type]) return { ok: false, error: "不支援的專項經驗類型。" };
  const state = ensureCapabilityStateShape(target);
  const amount = Math.max(1, Math.floor(Number(experience.amount) || 1));
  state.specialistExperience[type] = Math.min(20, (Number(state.specialistExperience[type]) || 0) + amount);
  target.baseballSkills = Object.assign({}, createInitialPlayer().baseballSkills, target.baseballSkills || {});
  map[type].forEach(skill => {
    if ((Number(target.baseballSkills[skill]) || 0) === 0) {
      target.baseballSkills[skill] = 1;
      recordCapabilitySkillChanges(target, { [skill]: 1 }, {
        sourceType: CAPABILITY_MUTATION_SOURCE_TYPES.SPECIALIST_ACTIVATION,
        eventId: experience.eventId || `${type}-experience-established`,
        choiceId: experience.choiceId || "activation",
        provenance: experience.provenance || "specialist-activation",
        resolvedSeed: experience.resolvedSeed
      });
    }
  });
  return { ok: true, type, experience: state.specialistExperience[type] };
}

function validateYouthEventOutcome(target, outcome = {}) {
  if (!target?.characterGenesis?.completed) return { ok: false, error: "Youth outcome 需要 completed Character Genesis。" };
  if (!outcome.eventId || !outcome.choiceId) return { ok: false, error: "Youth outcome 缺少 eventId 或 choiceId。" };
  const invalidSkillDelta = Object.entries(outcome.skillDeltas || {}).some(([skill, delta]) =>
    ![...UNIVERSAL_BASEBALL_SKILL_KEYS, ...SPECIALIST_BASEBALL_SKILL_KEYS].includes(skill)
    || !Number.isFinite(Number(delta)) || Number(delta) < 0 || Number(delta) > 1
  );
  if (invalidSkillDelta) return { ok: false, error: "Youth outcome skill delta 必須是合法技能的 0 或 +1。" };
  const requestedSpecialistSkills = Object.keys(outcome.skillDeltas || {}).filter(skill => SPECIALIST_BASEBALL_SKILL_KEYS.includes(skill) && Number(outcome.skillDeltas[skill]) > 0);
  if (requestedSpecialistSkills.length) return { ok: false, error: "Specialist skill 必須由 specialistExperienceDeltas activation 建立。" };
  const validKeys = [...UNIVERSAL_BASEBALL_SKILL_KEYS];
  const skillDeltas = Object.fromEntries(Object.entries(outcome.skillDeltas || {}).filter(([skill, delta]) =>
    validKeys.includes(skill) && Number.isFinite(Number(delta)) && Number(delta) >= 0
  ).map(([skill, delta]) => [skill, Number(delta)]));
  const skillEntries = Object.entries(skillDeltas).filter(([, delta]) => delta > 0);
  const maxSkillEffects = outcome.milestone === true ? 2 : 1;
  if (skillEntries.length > maxSkillEffects) return { ok: false, error: "Youth outcome 超出 v1 skill effect budget。" };
  const invalidPositionExperience = Object.entries(outcome.positionExperienceDeltas || {}).some(([position, delta]) =>
    !position || !Number.isFinite(Number(delta)) || Number(delta) <= 0
  );
  if (invalidPositionExperience) return { ok: false, error: "Youth outcome position experience 必須是明確守位的正數。" };
  const invalidSpecialistExperience = Object.entries(outcome.specialistExperienceDeltas || {}).some(([type, delta]) =>
    !["catcher", "pitcher"].includes(type) || !Number.isFinite(Number(delta)) || Number(delta) <= 0
  );
  if (invalidSpecialistExperience) return { ok: false, error: "Youth outcome specialist experience 必須是 catcher／pitcher 的正數。" };
  return { ok: true, skillDeltas, skillEntries };
}

// 正式 Youth v1 capability mutation 的唯一 entry point。Generic applySkillEffects 不擁有此 contract。
function applyYouthEventOutcome(target, outcome = {}) {
  const validation = validateYouthEventOutcome(target, outcome);
  if (!validation.ok) return validation;
  const state = ensureCapabilityStateShape(target);
  const signature = `${outcome.eventId}|${outcome.choiceId}|${outcome.resolvedSeed ?? "deterministic"}`;
  const existing = state.youthOutcomes.find(item => item.signature === signature);
  if (existing) return { ok: true, duplicate: true, outcome: existing };
  const { skillDeltas, skillEntries } = validation;
  target.baseballSkills = Object.assign({}, createInitialPlayer().baseballSkills, target.baseballSkills || {});
  skillEntries.forEach(([skill, delta]) => {
    target.baseballSkills[skill] = Math.max(0, Math.min(20, Number(target.baseballSkills[skill]) + delta));
  });
  Object.entries(outcome.positionExperienceDeltas || {}).forEach(([position, delta]) => {
    if (Number.isFinite(Number(delta)) && Number(delta) > 0) state.positionExperience[position] = Math.min(20, (Number(state.positionExperience[position]) || 0) + Number(delta));
  });
  Object.entries(outcome.specialistExperienceDeltas || {}).forEach(([type, delta]) => {
    if (Number(delta) > 0) establishSpecialistExperience(target, { type, amount: delta, eventId: outcome.eventId, choiceId: outcome.choiceId, resolvedSeed: outcome.resolvedSeed });
  });
  const outcomeState = ensureCapabilityStateShape(target);
  const normalized = {
    signature,
    eventId: outcome.eventId,
    choiceId: outcome.choiceId,
    skillDeltas,
    positionExperienceDeltas: { ...(outcome.positionExperienceDeltas || {}) },
    specialistExperienceDeltas: { ...(outcome.specialistExperienceDeltas || {}) },
    identitySeeds: Array.isArray(outcome.identitySeeds) ? outcome.identitySeeds.slice() : [],
    relationshipDeltas: { ...(outcome.relationshipDeltas || {}) },
    provenance: outcome.provenance || "youth-event-outcome-v1",
    sourceType: CAPABILITY_MUTATION_SOURCE_TYPES.YOUTH_OUTCOME_V1,
    sourceContract: YOUTH_OUTCOME_V1_SOURCE_CONTRACT,
    entryPoint: "applyYouthEventOutcome",
    resolvedSeed: outcome.resolvedSeed ?? null,
    milestone: outcome.milestone === true
  };
  outcomeState.youthOutcomes.push(normalized);
  recordCapabilitySkillChanges(target, skillDeltas, normalized);
  return { ok: true, duplicate: false, outcome: normalized };
}

function applySyntheticYouthOrigin(target) {
  const seed = ensureCapabilityStateShape(target).characterSeed || createCapabilityCharacterSeed(target);
  const outcomes = [
    { eventId: "synthetic-youth-basic-catch", choiceId: "repeat-basic-reps", skillDeltas: { catching: 1 }, positionExperienceDeltas: { "內野手": 1 } },
    { eventId: "synthetic-youth-basic-throw", choiceId: "finish-throwing-form", skillDeltas: { throwing: 1 }, positionExperienceDeltas: { "內野手": 1 } },
    { eventId: "synthetic-junior-first-step", choiceId: "clean-footwork", skillDeltas: { reaction: 1 }, positionExperienceDeltas: { "內野手": 1 } },
    { eventId: "synthetic-junior-game-study", choiceId: "review-assignment", skillDeltas: { baseballIQ: 1 }, identitySeeds: ["observational-infielder"] }
  ];
  outcomes.forEach((outcome, index) => applyYouthEventOutcome(target, {
    ...outcome,
    provenance: "deterministic-synthetic-youth-origin-v1",
    resolvedSeed: `${seed}-${index + 1}`
  }));
  const state = ensureCapabilityStateShape(target);
  state.originType = "synthetic-youth-origin-v1";
  return outcomes;
}

function validateHighSchoolEntryCapability(target) {
  const errors = [];
  if (target?.characterGenesis?.completed !== true) errors.push("character-genesis-incomplete");
  CHARACTER_GENESIS_ABILITY_KEYS.forEach(key => {
    const value = target?.characterGenesis?.finalAbilities?.[key];
    if (!Number.isFinite(value) || value < 1 || value > 5) errors.push(`finalized-genesis-invalid:${key}`);
  });
  if (!PlayerIdentityOptions.idealSelf.includes(target?.idealSelf)) errors.push("ideal-self-invalid");
  if (!PlayerIdentityOptions.bats.includes(target?.bats) || !PlayerIdentityOptions.throws.includes(target?.throws)) errors.push("handedness-invalid");
  if (target?.capabilityState?.initialized !== true) errors.push("capability-not-settled");
  if (target?.capabilityState?.initialSkillFormulaVersion !== INITIAL_SKILL_FORMULA_VERSION) errors.push("initial-formula-version-invalid");
  if (target?.capabilityState?.settlementVersion !== HS_ENTRY_CAPABILITY_SETTLEMENT_VERSION) errors.push("settlement-version-invalid");
  UNIVERSAL_BASEBALL_SKILL_KEYS.forEach(skill => {
    const value = target?.baseballSkills?.[skill];
    if (!Number.isFinite(value) || value < 1 || value > 20) errors.push(`universal-skill-invalid:${skill}`);
  });
  SPECIALIST_BASEBALL_SKILL_KEYS.forEach(skill => {
    const value = target?.baseballSkills?.[skill];
    if (!Number.isFinite(value) || value < 0 || value > 20) errors.push(`specialist-skill-invalid:${skill}`);
  });
  return { ok: errors.length === 0, errors };
}

function settleHighSchoolEntryCapability(target, options = {}) {
  const state = ensureCapabilityStateShape(target);
  if (state.initialized && state.settlementVersion === HS_ENTRY_CAPABILITY_SETTLEMENT_VERSION) {
    const validation = validateHighSchoolEntryCapability(target);
    return validation.ok ? { ok: true, existing: true, capabilityState: state } : { ok: false, error: "既有高中能力結算不合法。", validation };
  }
  if (!target?.characterGenesis?.completed) return { ok: false, error: "Character Genesis 未完成，不能進行高中能力結算。" };
  if (!Object.keys(state.initialBaseballSkills || {}).length) {
    const initialized = initializePlayerCapabilityFromGenesis(target);
    if (!initialized.ok) return initialized;
  }
  const activeState = ensureCapabilityStateShape(target);
  target.baseballSkills = Object.assign({}, createInitialPlayer().baseballSkills, target.baseballSkills || {});
  UNIVERSAL_BASEBALL_SKILL_KEYS.forEach(skill => {
    const current = Number(target.baseballSkills[skill]);
    const initial = Number(activeState.initialBaseballSkills[skill]);
    target.baseballSkills[skill] = Math.max(1, Math.min(20, Number.isFinite(current) && current > 0 ? current : initial));
  });
  SPECIALIST_BASEBALL_SKILL_KEYS.forEach(skill => {
    const current = Number(target.baseballSkills[skill]);
    target.baseballSkills[skill] = Math.max(0, Math.min(20, Number.isFinite(current) ? current : 0));
  });
  const affinityExperienceMap = { infield: "內野手", outfield: "外野手", catcher: "捕手", pitcher: "投手" };
  Object.entries(affinityExperienceMap).forEach(([affinity, position]) => {
    const value = Number(target.positionAffinity?.[affinity]);
    if (Number.isFinite(value) && value > 0 && !Number.isFinite(Number(activeState.positionExperience[position]))) {
      activeState.positionExperience[position] = Math.min(20, value);
    }
  });
  if (target.baseballSkills.blocking > 0 || target.baseballSkills.gameCalling > 0) {
    const missingCatcherExperience = !(Number(activeState.specialistExperience.catcher) > 0);
    activeState.specialistExperience.catcher = Math.max(1, Number(activeState.specialistExperience.catcher) || 0);
    if (missingCatcherExperience) recordLegacySpecialistNormalization(target, "catcher", ["blocking", "gameCalling"].filter(skill => target.baseballSkills[skill] > 0));
  }
  if (target.baseballSkills.control > 0 || target.baseballSkills.pitchStamina > 0) {
    const missingPitcherExperience = !(Number(activeState.specialistExperience.pitcher) > 0);
    activeState.specialistExperience.pitcher = Math.max(1, Number(activeState.specialistExperience.pitcher) || 0);
    if (missingPitcherExperience) recordLegacySpecialistNormalization(target, "pitcher", ["control", "pitchStamina"].filter(skill => target.baseballSkills[skill] > 0));
  }
  activeState.initialized = true;
  activeState.initialSkillFormulaVersion = INITIAL_SKILL_FORMULA_VERSION;
  activeState.settlementVersion = HS_ENTRY_CAPABILITY_SETTLEMENT_VERSION;
  activeState.originType = options.originType || activeState.originType || "normal-youth-outcomes";
  activeState.developmentProfile = {
    originIdealSelf: target.idealSelf,
    biasTags: Object.keys(IDEAL_SELF_STARTING_BIASES[target.idealSelf] || {})
  };
  activeState.provenance.settlement = {
    version: HS_ENTRY_CAPABILITY_SETTLEMENT_VERSION,
    formulaVersion: INITIAL_SKILL_FORMULA_VERSION,
    originType: activeState.originType,
    youthOutcomeCount: activeState.youthOutcomes.length,
    ledgerEntryCount: activeState.provenance.capabilityLedger.length,
    universalMinimum: 1,
    specialistZeroAllowed: true
  };
  const validation = validateHighSchoolEntryCapability(target);
  if (!validation.ok) {
    activeState.initialized = false;
    return { ok: false, error: "高中能力結算 validation failed。", validation };
  }
  return { ok: true, existing: false, capabilityState: activeState };
}

function migrateLegacyPlayerCapability(target, options = {}) {
  const state = ensureCapabilityStateShape(target);
  if (state.initialized && validateHighSchoolEntryCapability(target).ok) return { ok: true, migrated: false, capabilityState: state };
  if (!PlayerIdentityOptions.idealSelf.includes(target.idealSelf)) target.idealSelf = "全能型";
  target.bats = PlayerIdentityOptions.bats.includes(target.bats) ? target.bats : "R";
  target.throws = PlayerIdentityOptions.throws.includes(target.throws) ? target.throws : "R";
  target.characterGenesis = Object.assign({}, createInitialPlayer().characterGenesis, target.characterGenesis || {});
  target.characterGenesis.completed = true;
  target.characterGenesis.archetype = target.characterGenesis.archetype || target.idealSelf;
  target.characterGenesis.initialAspiration = target.characterGenesis.initialAspiration || target.origin || PlayerIdentityOptions.origins[0];
  target.characterGenesis.finalAbilities = getFinalizedGenesisAbilities(target);
  const generated = generateInitialBaseballSkills(target);
  if (!generated.ok) return generated;
  state.characterSeed = state.characterSeed || generated.characterSeed;
  state.initialSkillFormulaVersion = INITIAL_SKILL_FORMULA_VERSION;
  state.initialBaseballSkills = Object.keys(state.initialBaseballSkills).length ? state.initialBaseballSkills : { ...generated.skills };
  state.provenance.initialSkills = Object.keys(state.provenance.initialSkills).length ? state.provenance.initialSkills : generated.trace;
  state.developmentProfile = { originIdealSelf: target.idealSelf, biasTags: Object.keys(IDEAL_SELF_STARTING_BIASES[target.idealSelf] || {}) };
  target.baseballSkills = Object.assign({}, createInitialPlayer().baseballSkills, target.baseballSkills || {});
  UNIVERSAL_BASEBALL_SKILL_KEYS.forEach(skill => {
    const saved = Number(target.baseballSkills[skill]);
    target.baseballSkills[skill] = Number.isFinite(saved) && saved > 0 ? Math.min(20, saved) : generated.skills[skill];
  });
  SPECIALIST_BASEBALL_SKILL_KEYS.forEach(skill => {
    const saved = Number(target.baseballSkills[skill]);
    target.baseballSkills[skill] = Number.isFinite(saved) && saved >= 0 ? Math.min(20, saved) : 0;
  });
  state.migration = {
    sourceSaveVersion: options.sourceSaveVersion ?? null,
    migrationVersion: HS_ENTRY_CAPABILITY_SETTLEMENT_VERSION,
    deterministicDefault: "genesis-or-neutral-three",
    preservedExistingPositiveSkills: true
  };
  state.originType = "legacy-save-migration";
  const reachedHighSchool = Number(target.age) >= 16 || String(target.chapter || "").includes("青棒") || Number(target.highSchoolStep) > 0;
  if (reachedHighSchool) return { ...settleHighSchoolEntryCapability(target, { originType: "legacy-save-migration" }), migrated: true };
  return { ok: true, migrated: true, capabilityState: state };
}

function buildCapabilitySkillProvenance(target, state, provenance) {
  const sourceRank = new Map(CAPABILITY_PROVENANCE_SOURCE_ORDER.map((sourceType, index) => [sourceType, index]));
  const ledger = Array.isArray(provenance.capabilityLedger) ? provenance.capabilityLedger : [];
  const normalizations = Array.isArray(provenance.normalizations) ? provenance.normalizations : [];
  return Object.fromEntries([...UNIVERSAL_BASEBALL_SKILL_KEYS, ...SPECIALIST_BASEBALL_SKILL_KEYS].map(skill => {
    const sources = [];
    const initialValue = Number(state.initialBaseballSkills?.[skill]);
    if (Number.isFinite(initialValue)) {
      sources.push({
        sourceType: "initial-formula",
        formulaVersion: state.initialSkillFormulaVersion || INITIAL_SKILL_FORMULA_VERSION,
        value: initialValue
      });
    }
    ledger.filter(item => item.skill === skill).forEach(item => sources.push({ ...item }));
    if (state.migration) {
      sources.push({
        sourceType: CAPABILITY_MUTATION_SOURCE_TYPES.MIGRATION,
        migrationVersion: state.migration.migrationVersion || "",
        preservedValue: Number(target?.baseballSkills?.[skill]) || 0
      });
    }
    normalizations.filter(item => item.skills?.includes(skill)).forEach(item => sources.push({ ...item, skills: Object.freeze(item.skills.slice()) }));
    sources.sort((left, right) => (sourceRank.get(left.sourceType) ?? 999) - (sourceRank.get(right.sourceType) ?? 999));
    return [skill, Object.freeze({
      finalValue: Number(target?.baseballSkills?.[skill]) || 0,
      sources: Object.freeze(sources.map(item => Object.freeze(item)))
    })];
  }));
}

function getDebugCapabilitySnapshot(target) {
  const state = target?.capabilityState || createDefaultCapabilityState();
  const youthOutcomes = Array.isArray(state.youthOutcomes) ? state.youthOutcomes : [];
  const provenance = state.provenance || createDefaultCapabilityState().provenance;
  const developmentProfile = state.developmentProfile || createDefaultCapabilityState().developmentProfile;
  const youthDeltas = Object.fromEntries([...UNIVERSAL_BASEBALL_SKILL_KEYS, ...SPECIALIST_BASEBALL_SKILL_KEYS].map(skill => [
    skill,
    youthOutcomes.reduce((sum, outcome) => sum + (Number(outcome.skillDeltas?.[skill]) || 0), 0)
  ]));
  const skillProvenance = buildCapabilitySkillProvenance(target, state, provenance);
  return Object.freeze({
    genesis: Object.freeze(getFinalizedGenesisAbilities(target)),
    idealSelf: target.idealSelf,
    initialSkills: Object.freeze({ ...state.initialBaseballSkills }),
    youthDeltas: Object.freeze(youthDeltas),
    youthOutcomes: Object.freeze(youthOutcomes.map(item => Object.freeze(JSON.parse(JSON.stringify(item))))),
    finalHighSchoolEntrySkills: Object.freeze({ ...(target.baseballSkills || {}) }),
    positionExperience: Object.freeze({ ...state.positionExperience }),
    specialistExperience: Object.freeze({ ...state.specialistExperience }),
    developmentProfile: Object.freeze({ ...developmentProfile, biasTags: Object.freeze((developmentProfile.biasTags || []).slice()) }),
    initialSkillFormulaVersion: state.initialSkillFormulaVersion,
    settlementVersion: state.settlementVersion,
    initialized: state.initialized === true,
    skillProvenance: Object.freeze(skillProvenance),
    provenanceSummary: Object.freeze({
      initialSkills: Object.freeze({ ...(provenance.initialSkills || {}) }),
      capabilityLedger: Object.freeze((provenance.capabilityLedger || []).map(item => Object.freeze({ ...item }))),
      normalizations: Object.freeze((provenance.normalizations || []).map(item => Object.freeze({ ...item, skills: Object.freeze((item.skills || []).slice()) }))),
      settlement: provenance.settlement ? Object.freeze({ ...provenance.settlement }) : null,
      migration: state.migration ? Object.freeze({ ...state.migration }) : null
    })
  });
}

const SCHOOL_INVITATION_VERSION = "school-invitation-v1";
const SCHOOL_INVITATION_GENERATION_NAMESPACE = "high-school-entry-recruiting-cycle-v1";
const SCHOOL_CHOICE_VERSION = "school-choice-v1";
const SCHOOL_INVITATION_TIERS = Object.freeze(["powerhouse", "competitive", "standard", "development"]);
const SCHOOL_RECRUITING_PREFERENCES = Object.freeze(["balanced", "defenseFirst", "offenseFirst", "athletic", "baseballIQ"]);
const SCHOOL_PROJECTED_ROLES = Object.freeze(["depthCandidate", "benchCandidate", "rotationCandidate", "starterCompetition", "coreCandidate"]);
const SCHOOL_POSITION_IDS = Object.freeze(["P", "C", "1B", "2B", "3B", "SS", "OF"]);
const SCHOOL_POSITION_NEED_LEVELS = Object.freeze(["low", "medium", "high"]);

const SCHOOL_TIER_PROFILES = Object.freeze({
  powerhouse: Object.freeze({
    teamStrength: "elite", trainingQuality: "elite", competitionDepth: "veryHigh",
    matchCompetitionLevel: "high", playingTimeOpportunity: "low", recruitingStandard: 5.5
  }),
  competitive: Object.freeze({
    teamStrength: "strong", trainingQuality: "strong", competitionDepth: "high",
    matchCompetitionLevel: "mediumHigh", playingTimeOpportunity: "medium", recruitingStandard: 4.8
  }),
  standard: Object.freeze({
    teamStrength: "standard", trainingQuality: "standard", competitionDepth: "medium",
    matchCompetitionLevel: "medium", playingTimeOpportunity: "mediumHigh", recruitingStandard: 4
  }),
  development: Object.freeze({
    teamStrength: "emerging", trainingQuality: "limited", competitionDepth: "low",
    matchCompetitionLevel: "lowMedium", playingTimeOpportunity: "high", recruitingStandard: 3.2
  })
});

const SCHOOL_NAME_POOLS = Object.freeze({
  powerhouse: Object.freeze(["蒼岳學園", "北辰學院", "海陵高中", "赤城學園", "白峰高中", "東雲學院"]),
  competitive: Object.freeze(["景川高中", "明稜學園", "青嶺高中", "瑞原學院", "南星高中", "松濤學園"]),
  standard: Object.freeze(["河岸高中", "新田學園", "光丘高中", "港南學院", "朝野高中", "楓林學園"]),
  development: Object.freeze(["春浦高中", "森原學園", "石橋高中", "潮見學院", "綠谷高中", "平川學園"])
});

const SCHOOL_POSITION_SKILL_WEIGHTS = Object.freeze({
  P: Object.freeze({ throwing: 1.5, armStrength: 2, control: 2, pitchStamina: 1.5, baseballIQ: 1 }),
  C: Object.freeze({ catching: 2, throwing: 1.5, blocking: 2, gameCalling: 2, baseballIQ: 1.5 }),
  "1B": Object.freeze({ catching: 1.5, reaction: 1, armStrength: 1, batting: 1.2, baseballIQ: 0.8 }),
  "2B": Object.freeze({ catching: 1.5, throwing: 1.2, reaction: 2, range: 1.7, baseballIQ: 1.5 }),
  "3B": Object.freeze({ catching: 1.2, throwing: 1.5, reaction: 1.5, armStrength: 1.5, batting: 0.8 }),
  SS: Object.freeze({ catching: 1.5, throwing: 1.5, reaction: 2, range: 2, baseballIQ: 1.5 }),
  OF: Object.freeze({ catching: 1.5, throwing: 1, armStrength: 1.7, range: 2, reaction: 1.2 })
});

const SCHOOL_PREFERENCE_SKILL_WEIGHTS = Object.freeze({
  balanced: Object.freeze({ catching: 1, throwing: 1, batting: 1, baseRunning: 1, baseballIQ: 1, armStrength: 1, reaction: 1, range: 1 }),
  defenseFirst: Object.freeze({ catching: 1.5, throwing: 1.3, baseballIQ: 1.2, reaction: 1.6, range: 1.6 }),
  offenseFirst: Object.freeze({ batting: 2, baseRunning: 1.2, baseballIQ: 0.8, armStrength: 0.5 }),
  athletic: Object.freeze({ baseRunning: 1.5, armStrength: 1.2, reaction: 1.5, range: 1.8 }),
  baseballIQ: Object.freeze({ baseballIQ: 2, catching: 0.8, throwing: 0.8, reaction: 1, baseRunning: 0.6 })
});

const SCHOOL_SKILL_REASON_CODES = Object.freeze({
  catching: "defensiveReliability", throwing: "throwingReliability", batting: "battingUpside",
  baseRunning: "speed", baseballIQ: "baseballUnderstanding", armStrength: "armStrength",
  reaction: "defensiveReaction", range: "defensiveRange", blocking: "catcherBlocking",
  gameCalling: "gameCalling", control: "pitchCommand", pitchStamina: "pitchingDurability"
});

function createDefaultSchoolInvitationState() {
  return {
    completed: false,
    bypassed: false,
    version: SCHOOL_INVITATION_VERSION,
    generationSeed: "",
    generatedAtCapabilityVersion: "",
    compatibilityMode: "",
    legacyExistingSchool: null,
    selectedSchoolId: "",
    selectionFinalized: false,
    selectionVersion: "",
    selectionFinalizedAtCapabilityVersion: "",
    invitations: []
  };
}

function cloneSchoolInvitationValue(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function restoreSchoolInvitationState(savedState = {}) {
  const defaults = createDefaultSchoolInvitationState();
  if (!savedState || typeof savedState !== "object") return defaults;
  const restored = Object.assign(defaults, cloneSchoolInvitationValue(savedState));
  restored.invitations = Array.isArray(savedState.invitations) ? cloneSchoolInvitationValue(savedState.invitations) : [];
  restored.legacyExistingSchool = savedState.legacyExistingSchool ? cloneSchoolInvitationValue(savedState.legacyExistingSchool) : null;
  restored.selectedSchoolId = typeof savedState.selectedSchoolId === "string" ? savedState.selectedSchoolId : "";
  restored.selectionFinalized = savedState.selectionFinalized === true;
  restored.selectionVersion = typeof savedState.selectionVersion === "string" ? savedState.selectionVersion : "";
  restored.selectionFinalizedAtCapabilityVersion = typeof savedState.selectionFinalizedAtCapabilityVersion === "string"
    ? savedState.selectionFinalizedAtCapabilityVersion : "";
  return restored;
}

function markLegacySchoolInvitationCompatibility(target, source = "legacy-existing-school") {
  const existing = restoreSchoolInvitationState(target?.schoolInvitationState);
  if (validateSchoolInvitationSet(existing).ok) {
    target.schoolInvitationState = existing;
    return existing;
  }
  existing.completed = false;
  existing.bypassed = true;
  existing.version = SCHOOL_INVITATION_VERSION;
  existing.compatibilityMode = source;
  existing.selectedSchoolId = "";
  existing.selectionFinalized = false;
  existing.selectionVersion = "";
  existing.selectionFinalizedAtCapabilityVersion = "";
  existing.legacyExistingSchool = {
    schoolId: "legacy-existing-school",
    schoolName: target?.highSchoolRoute || "既有高中路線",
    source
  };
  existing.invitations = [];
  target.schoolInvitationState = existing;
  return existing;
}

function stableSchoolInvitationHash(value) {
  return stableCapabilityHash(`school-invitation|${String(value ?? "")}`);
}

function stableSchoolInvitationUnit(value) {
  return stableSchoolInvitationHash(value) / 4294967295;
}

function weightedSchoolSkillScore(skills = {}, weights = {}) {
  const entries = Object.entries(weights).filter(([, weight]) => Number(weight) > 0);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + Number(weight), 0);
  if (!totalWeight) return 0;
  return entries.reduce((sum, [skill, weight]) => sum + (Number(skills[skill]) || 0) * Number(weight), 0) / totalWeight;
}

function getSchoolRecruitingLegalPositions(target) {
  return target?.throws === "L"
    ? Object.freeze(["P", "C", "1B", "OF"])
    : Object.freeze(SCHOOL_POSITION_IDS.slice());
}

function mapCanonicalPositionToSchoolCandidates(position, throws = "R") {
  const direct = {
    "投手": ["P"], "捕手": ["C"], "一壘手": ["1B"], "二壘手": ["2B"],
    "三壘手": ["3B"], "游擊手": ["SS"], "外野手": ["OF"]
  };
  if (direct[position]) return direct[position].filter(id => throws !== "L" || !["2B", "3B", "SS"].includes(id));
  if (position === "內野手") return throws === "L" ? ["1B", "P"] : ["2B", "SS", "3B", "1B"];
  return [];
}

function getSchoolRecruitingPositionProfile(target) {
  const legalPositions = getSchoolRecruitingLegalPositions(target);
  const candidates = [];
  const add = position => {
    mapCanonicalPositionToSchoolCandidates(position, target?.throws).forEach(id => {
      if (legalPositions.includes(id) && !candidates.includes(id)) candidates.push(id);
    });
  };
  add(target?.primaryPosition || "");
  (target?.secondaryPositions || []).forEach(add);
  const experience = target?.capabilityState?.positionExperience || {};
  Object.keys(experience).sort((left, right) => (Number(experience[right]) || 0) - (Number(experience[left]) || 0)).forEach(add);
  if (!candidates.length) {
    const ranked = legalPositions.slice().sort((left, right) =>
      weightedSchoolSkillScore(target?.baseballSkills, SCHOOL_POSITION_SKILL_WEIGHTS[right])
      - weightedSchoolSkillScore(target?.baseballSkills, SCHOOL_POSITION_SKILL_WEIGHTS[left])
      || left.localeCompare(right)
    );
    candidates.push(...ranked.slice(0, 2));
  }
  return Object.freeze({
    primaryCandidate: candidates[0] || legalPositions[0],
    secondaryCandidates: Object.freeze(candidates.slice(1)),
    candidatePositions: Object.freeze(candidates),
    legalPositions,
    positionExperience: Object.freeze({ ...experience })
  });
}

function createSchoolPositionNeeds(schoolSeed) {
  const needs = Object.fromEntries(SCHOOL_POSITION_IDS.map(position => {
    const index = stableSchoolInvitationHash(`${schoolSeed}|need|${position}`) % SCHOOL_POSITION_NEED_LEVELS.length;
    return [position, SCHOOL_POSITION_NEED_LEVELS[index]];
  }));
  if (!Object.values(needs).includes("high")) needs[SCHOOL_POSITION_IDS[stableSchoolInvitationHash(`${schoolSeed}|forced-high`) % SCHOOL_POSITION_IDS.length]] = "high";
  if (!Object.values(needs).includes("low")) needs[SCHOOL_POSITION_IDS[stableSchoolInvitationHash(`${schoolSeed}|forced-low`) % SCHOOL_POSITION_IDS.length]] = "low";
  return needs;
}

function createSchoolProfile(generationSeed, tier, slot) {
  if (!SCHOOL_INVITATION_TIERS.includes(tier)) throw new Error(`不合法的 School Tier：${tier}`);
  const tierProfile = SCHOOL_TIER_PROFILES[tier];
  const pool = SCHOOL_NAME_POOLS[tier];
  const rotation = stableSchoolInvitationHash(`${generationSeed}|${tier}|name-rotation`) % pool.length;
  const nameIndex = (rotation + slot) % pool.length;
  const schoolSeed = `${generationSeed}|${tier}|${slot}|${nameIndex}`;
  const preference = SCHOOL_RECRUITING_PREFERENCES[stableSchoolInvitationHash(`${schoolSeed}|preference`) % SCHOOL_RECRUITING_PREFERENCES.length];
  const coachStyles = ["fundamentals", "competition", "development", "analysis"];
  return {
    schoolId: `school-${tier}-${stableSchoolInvitationHash(schoolSeed).toString(16).padStart(8, "0")}`,
    schoolName: pool[nameIndex],
    schoolSeed,
    schoolTier: tier,
    teamStrength: tierProfile.teamStrength,
    trainingQuality: tierProfile.trainingQuality,
    competitionDepth: tierProfile.competitionDepth,
    matchCompetitionLevel: tierProfile.matchCompetitionLevel,
    playingTimeOpportunity: tierProfile.playingTimeOpportunity,
    recruitingStandard: tierProfile.recruitingStandard,
    positionNeeds: createSchoolPositionNeeds(schoolSeed),
    recruitingPreference: preference,
    coachProfile: { coachId: `coach-${stableSchoolInvitationHash(`${schoolSeed}|coach`).toString(16).padStart(8, "0")}`, coachStyle: coachStyles[stableSchoolInvitationHash(`${schoolSeed}|coach-style`) % coachStyles.length] }
  };
}

function validateSchoolProfile(school) {
  const errors = [];
  if (!school || typeof school !== "object") return { ok: false, errors: ["school-profile-missing"] };
  if (typeof school.schoolId !== "string" || !school.schoolId) errors.push("school-id-invalid");
  if (typeof school.schoolName !== "string" || !school.schoolName) errors.push("school-name-invalid");
  if (typeof school.schoolSeed !== "string" || !school.schoolSeed) errors.push("school-seed-invalid");
  if (!SCHOOL_INVITATION_TIERS.includes(school.schoolTier)) errors.push("school-tier-invalid");
  if (!SCHOOL_RECRUITING_PREFERENCES.includes(school.recruitingPreference)) errors.push("recruiting-preference-invalid");
  if (!SCHOOL_TIER_PROFILES[school.schoolTier]) errors.push("tier-profile-missing");
  else {
    const tier = SCHOOL_TIER_PROFILES[school.schoolTier];
    ["teamStrength", "trainingQuality", "competitionDepth", "matchCompetitionLevel", "playingTimeOpportunity"].forEach(field => {
      if (school[field] !== tier[field]) errors.push(`${field}-invalid`);
    });
    if (Number(school.recruitingStandard) !== tier.recruitingStandard) errors.push("recruiting-standard-invalid");
  }
  SCHOOL_POSITION_IDS.forEach(position => {
    if (!SCHOOL_POSITION_NEED_LEVELS.includes(school.positionNeeds?.[position])) errors.push(`position-need-invalid:${position}`);
  });
  if (typeof school.coachProfile?.coachId !== "string" || typeof school.coachProfile?.coachStyle !== "string") errors.push("coach-profile-invalid");
  return { ok: errors.length === 0, errors };
}

function calculateSchoolCapabilityMatch(target, school) {
  const validation = validateHighSchoolEntryCapability(target);
  if (!validation.ok) throw new Error(`School Invitation 拒絕未完成 Capability Settlement 的球員：${validation.errors.join(",")}`);
  const positionProfile = getSchoolRecruitingPositionProfile(target);
  const needValues = { low: 0, medium: 1, high: 2 };
  const positionScores = positionProfile.candidatePositions.map(position => ({
    position,
    score: weightedSchoolSkillScore(target.baseballSkills, SCHOOL_POSITION_SKILL_WEIGHTS[position]),
    need: school.positionNeeds[position],
    needValue: needValues[school.positionNeeds[position]] || 0
  })).sort((left, right) => (right.score + right.needValue * 0.2) - (left.score + left.needValue * 0.2) || left.position.localeCompare(right.position));
  const selected = positionScores[0];
  const weights = SCHOOL_POSITION_SKILL_WEIGHTS[selected.position];
  const contributors = Object.entries(weights).map(([skill, weight]) => ({
    skill, weight, value: Number(target.baseballSkills[skill]) || 0,
    contribution: (Number(target.baseballSkills[skill]) || 0) * Number(weight)
  })).sort((left, right) => right.contribution - left.contribution || left.skill.localeCompare(right.skill));
  return Object.freeze({
    score: Number(selected.score.toFixed(4)),
    candidatePosition: selected.position,
    positionNeed: selected.need,
    contributors: Object.freeze(contributors.map(item => Object.freeze(item))),
    positionProfile
  });
}

function deriveSchoolInterest(target, school) {
  const capability = calculateSchoolCapabilityMatch(target, school);
  const preferenceFit = weightedSchoolSkillScore(target.baseballSkills, SCHOOL_PREFERENCE_SKILL_WEIGHTS[school.recruitingPreference]);
  const needValue = { low: 0, medium: 1, high: 2 }[capability.positionNeed] || 0;
  const standardFit = capability.score - Number(school.recruitingStandard);
  const variation = stableSchoolInvitationUnit(`${school.schoolSeed}|${target.capabilityState.characterSeed}|interest`) * 4 - 2;
  const rawScore = 25 + capability.score * 5 + preferenceFit * 1.5 + needValue * 8 + standardFit * 6 + variation;
  const score = Number(Math.max(0, Math.min(100, rawScore)).toFixed(2));
  const category = score >= 70 ? "veryHigh" : score >= 56 ? "high" : score >= 42 ? "moderate" : "limited";
  const topContributor = capability.contributors[0];
  const specializedInterest = capability.positionNeed === "high" && Number(topContributor?.value) >= 6
    && preferenceFit >= capability.score - 0.25;
  const interestReasons = Array.from(new Set([
    ...capability.contributors.slice(0, 2).map(item => SCHOOL_SKILL_REASON_CODES[item.skill] || item.skill),
    capability.positionNeed === "high" ? "positionNeedHigh" : capability.positionNeed === "medium" ? "positionNeedMedium" : "",
    `preference:${school.recruitingPreference}`,
    specializedInterest ? "specializedProfileFit" : ""
  ].filter(Boolean)));
  const riskSignals = [];
  if (["veryHigh", "high"].includes(school.competitionDepth)) riskSignals.push("highInternalCompetition");
  if (capability.positionNeed === "low") riskSignals.push("crowdedPositionRoom");
  if (school.playingTimeOpportunity === "low") riskSignals.push("limitedImmediatePlayingTime");
  if (school.trainingQuality === "limited") riskSignals.push("lowerTrainingEnvironment");
  if (school.matchCompetitionLevel === "lowMedium") riskSignals.push("weakerCompetitionSchedule");
  return Object.freeze({
    score, category, capabilityMatch: capability.score, preferenceFit: Number(preferenceFit.toFixed(4)),
    recruitingStandardFit: Number(standardFit.toFixed(4)), positionNeed: capability.positionNeed,
    candidatePosition: capability.candidatePosition, deterministicVariation: Number(variation.toFixed(4)),
    specializedInterest, interestReasons: Object.freeze(interestReasons), riskSignals: Object.freeze(riskSignals)
  });
}

function deriveSchoolProjectedRole(school, interest) {
  const need = { low: 0, medium: 1, high: 2 }[interest.positionNeed] || 0;
  const depthPenalty = { veryHigh: 2, high: 1.25, medium: 0.5, low: 0 }[school.competitionDepth] || 0;
  const roleScore = interest.recruitingStandardFit + need - depthPenalty;
  let projectedRole = roleScore >= 3 ? "coreCandidate"
    : roleScore >= 1.6 ? "starterCompetition"
      : roleScore >= 0.3 ? "rotationCandidate"
        : roleScore >= -1 ? "benchCandidate" : "depthCandidate";
  if (projectedRole === "coreCandidate" && ["veryHigh", "high"].includes(school.competitionDepth)) {
    projectedRole = "starterCompetition";
  }
  if (projectedRole === "coreCandidate" && school.competitionDepth === "medium" && interest.positionNeed !== "high") {
    projectedRole = "starterCompetition";
  }
  return projectedRole;
}

function createSchoolInvitation(target, school) {
  const interest = deriveSchoolInterest(target, school);
  return {
    ...cloneSchoolInvitationValue(school),
    schoolInterest: cloneSchoolInvitationValue(interest),
    projectedRole: deriveSchoolProjectedRole(school, interest),
    interestReasons: interest.interestReasons.slice(),
    riskSignals: interest.riskSignals.slice(),
    specializedInterest: interest.specializedInterest
  };
}

function getSchoolInvitationDiversity(invitations = []) {
  const unique = key => new Set(invitations.map(item => item?.[key]).filter(Boolean)).size;
  const signatures = new Set(invitations.map(item => [
    item.schoolTier, item.projectedRole, item.schoolInterest?.positionNeed,
    item.trainingQuality, item.competitionDepth, item.recruitingPreference
  ].join("|")));
  return Object.freeze({
    roleCategories: unique("projectedRole"),
    competitionDepthCategories: unique("competitionDepth"),
    trainingQualityCategories: unique("trainingQuality"),
    tierCategories: unique("schoolTier"),
    mechanicalSignatures: signatures.size,
    roleDiversity: unique("projectedRole") >= 2,
    competitionDiversity: unique("competitionDepth") >= 2,
    environmentDiversity: unique("trainingQuality") >= 2,
    tierDiversity: unique("schoolTier") >= 2,
    noDominantDuplicate: signatures.size >= 2
  });
}

function validateSchoolInvitationSet(stateOrInvitations) {
  const state = Array.isArray(stateOrInvitations) ? null : stateOrInvitations;
  const invitations = Array.isArray(stateOrInvitations) ? stateOrInvitations : stateOrInvitations?.invitations;
  const errors = [];
  if (!Array.isArray(invitations) || invitations.length !== 4) errors.push("invitation-count-invalid");
  const safeInvitations = Array.isArray(invitations) ? invitations : [];
  safeInvitations.forEach((invitation, index) => {
    validateSchoolProfile(invitation).errors.forEach(error => errors.push(`invitation-${index}:${error}`));
    if (!SCHOOL_PROJECTED_ROLES.includes(invitation?.projectedRole)) errors.push(`invitation-${index}:projected-role-invalid`);
    if (!Number.isFinite(Number(invitation?.schoolInterest?.score))) errors.push(`invitation-${index}:interest-invalid`);
    if (!Array.isArray(invitation?.interestReasons) || !Array.isArray(invitation?.riskSignals)) errors.push(`invitation-${index}:explanation-invalid`);
  });
  if (new Set(safeInvitations.map(item => item.schoolId)).size !== safeInvitations.length) errors.push("duplicate-school-id");
  if (new Set(safeInvitations.map(item => item.schoolName)).size !== safeInvitations.length) errors.push("duplicate-school-name");
  if (new Set(safeInvitations).size !== safeInvitations.length) errors.push("duplicate-object-identity");
  const diversity = getSchoolInvitationDiversity(safeInvitations);
  ["roleDiversity", "competitionDiversity", "environmentDiversity", "tierDiversity", "noDominantDuplicate"].forEach(key => {
    if (!diversity[key]) errors.push(`diversity-invalid:${key}`);
  });
  if (state && state.version !== SCHOOL_INVITATION_VERSION) errors.push("invitation-version-invalid");
  if (state && state.completed !== true) errors.push("invitation-state-incomplete");
  if (state?.selectionFinalized === true) {
    if (!state.selectedSchoolId || !safeInvitations.some(invitation => invitation.schoolId === state.selectedSchoolId)) {
      errors.push("selected-school-invalid");
    }
    if (state.selectionVersion !== SCHOOL_CHOICE_VERSION) errors.push("school-choice-version-invalid");
  }
  else if (state?.selectedSchoolId) errors.push("unfinalized-school-selection-invalid");
  return { ok: errors.length === 0, errors, diversity };
}

function getSelectedSchoolInvitation(target) {
  const state = target?.schoolInvitationState;
  if (!state?.selectionFinalized || !state.selectedSchoolId) return null;
  return Array.isArray(state.invitations)
    ? state.invitations.find(invitation => invitation.schoolId === state.selectedSchoolId) || null
    : null;
}

function getSelectedHighSchoolContext(target) {
  const selected = getSelectedSchoolInvitation(target);
  if (!selected) return null;
  return deepFreezeSchoolInvitationValue({
    schoolId: selected.schoolId,
    schoolName: selected.schoolName,
    schoolTier: selected.schoolTier,
    trainingQuality: selected.trainingQuality,
    competitionDepth: selected.competitionDepth,
    matchCompetitionLevel: selected.matchCompetitionLevel,
    playingTimeOpportunity: selected.playingTimeOpportunity,
    recruitingPreference: selected.recruitingPreference,
    coachProfile: cloneSchoolInvitationValue(selected.coachProfile),
    projectedRole: selected.projectedRole
  });
}

function isSchoolInvitationChoicePending(target) {
  const state = target?.schoolInvitationState;
  return validateSchoolInvitationSet(state).ok
    && state.compatibilityMode === "generation-only"
    && state.selectionFinalized !== true;
}

function finalizeSchoolInvitationSelection(target, schoolId) {
  const state = target?.schoolInvitationState;
  const validation = validateSchoolInvitationSet(state);
  if (!validation.ok) return { ok: false, error: `School Invitation Set 不合法：${validation.errors.join(",")}` };
  if (state.compatibilityMode !== "generation-only") return { ok: false, error: "Compatibility route 不接受正式選校。" };
  if (state.selectionFinalized === true) {
    const selected = getSelectedSchoolInvitation(target);
    return selected?.schoolId === schoolId
      ? { ok: true, existing: true, selectedSchoolId: selected.schoolId, context: getSelectedHighSchoolContext(target) }
      : { ok: false, error: "School Choice 已完成，不能改選。" };
  }
  const selected = state.invitations.find(invitation => invitation.schoolId === schoolId);
  if (!selected) return { ok: false, error: "選擇的學校不在既有 Invitation Set。" };
  state.selectedSchoolId = selected.schoolId;
  state.selectionFinalized = true;
  state.selectionVersion = SCHOOL_CHOICE_VERSION;
  state.selectionFinalizedAtCapabilityVersion = target?.capabilityState?.settlementVersion || "";
  target.schoolInvitationState = state;
  return { ok: true, existing: false, selectedSchoolId: selected.schoolId, context: getSelectedHighSchoolContext(target) };
}

function getSchoolInvitationMinimumScore(tier) {
  return { powerhouse: 45, competitive: 40, standard: 34, development: 0 }[tier] ?? 0;
}

function selectSchoolInvitationCandidates(candidates, generationSeed) {
  const tierBonus = { powerhouse: 8, competitive: 5, standard: 2, development: 0 };
  const ranked = candidates.map(candidate => ({
    ...candidate,
    selectionPriority: candidate.schoolInterest.score + tierBonus[candidate.schoolTier]
      + Math.max(-6, Math.min(6, candidate.schoolInterest.recruitingStandardFit * 4))
  })).sort((left, right) => right.selectionPriority - left.selectionPriority || left.schoolId.localeCompare(right.schoolId));
  const eligible = ranked.filter(candidate => candidate.schoolInterest.score >= getSchoolInvitationMinimumScore(candidate.schoolTier) || candidate.specializedInterest);
  const source = eligible.length >= 4 ? eligible : ranked;
  const selected = [];
  for (const candidate of source) {
    if (selected.length >= 4) break;
    if (selected.filter(item => item.schoolTier === candidate.schoolTier).length >= 3) continue;
    selected.push(candidate);
  }
  for (const candidate of ranked) {
    if (selected.length >= 4) break;
    if (!selected.some(item => item.schoolId === candidate.schoolId)) selected.push(candidate);
  }
  const replaceFor = predicate => {
    if (predicate(selected)) return;
    const replacement = ranked.find(candidate => !selected.some(item => item.schoolId === candidate.schoolId)
      && predicate([...selected.slice(0, 3), candidate]));
    if (replacement) selected.splice(3, 1, replacement);
  };
  replaceFor(items => new Set(items.map(item => item.schoolTier)).size >= 2);
  replaceFor(items => {
    const diversity = getSchoolInvitationDiversity(items);
    return diversity.tierDiversity && diversity.roleDiversity && diversity.noDominantDuplicate;
  });
  const order = selected.slice(0, 4).sort((left, right) =>
    stableSchoolInvitationHash(`${generationSeed}|display-order|${left.schoolId}`)
    - stableSchoolInvitationHash(`${generationSeed}|display-order|${right.schoolId}`)
    || left.schoolId.localeCompare(right.schoolId)
  );
  return order.map(({ selectionPriority, ...candidate }) => candidate);
}

function deriveSchoolInvitationGenerationSeed(target, explicitSeed) {
  if (explicitSeed !== undefined && explicitSeed !== null && String(explicitSeed)) return String(explicitSeed);
  const positionProfile = getSchoolRecruitingPositionProfile(target);
  const positionExperience = Object.entries(positionProfile.positionExperience)
    .filter(([, value]) => Number.isFinite(Number(value)) && Number(value) > 0)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([position, value]) => `${position}:${Number(value)}`);
  const basis = [
    target?.capabilityState?.characterSeed || "no-capability-seed",
    SCHOOL_INVITATION_GENERATION_NAMESPACE,
    target?.bats || "R", target?.throws || "R",
    `primary:${positionProfile.primaryCandidate}`,
    `secondary:${positionProfile.secondaryCandidates.join(",")}`,
    `legal:${positionProfile.legalPositions.join(",")}`,
    `experience:${positionExperience.join(",")}`
  ].join("|");
  return `school-${stableSchoolInvitationHash(basis).toString(16).padStart(8, "0")}`;
}

function generateSchoolInvitationSet(target, options = {}) {
  if (validateSchoolInvitationSet(target?.schoolInvitationState).ok) return target.schoolInvitationState;
  const restored = restoreSchoolInvitationState(target?.schoolInvitationState);
  if (validateSchoolInvitationSet(restored).ok) {
    target.schoolInvitationState = restored;
    return restored;
  }
  const capability = validateHighSchoolEntryCapability(target);
  if (!capability.ok) throw new Error(`School Invitation 生成前置條件失敗：${capability.errors.join(",")}`);
  const generationSeed = deriveSchoolInvitationGenerationSeed(target, options.generationSeed);
  const candidatePool = SCHOOL_INVITATION_TIERS.flatMap(tier =>
    Array.from({ length: SCHOOL_NAME_POOLS[tier].length }, (_, slot) => createSchoolInvitation(target, createSchoolProfile(generationSeed, tier, slot)))
  );
  const invitations = selectSchoolInvitationCandidates(candidatePool, generationSeed);
  const state = {
    completed: true,
    bypassed: options.compatibilityMode === "direct-start-bypass",
    version: SCHOOL_INVITATION_VERSION,
    generationSeed,
    generatedAtCapabilityVersion: target.capabilityState.settlementVersion,
    compatibilityMode: options.compatibilityMode || "generation-only",
    legacyExistingSchool: options.compatibilityMode === "direct-start-bypass" ? {
      schoolId: "direct-start-existing-school",
      schoolName: target.highSchoolRoute || "Direct Start 測試高中",
      source: "direct-start-bypass"
    } : null,
    selectedSchoolId: "",
    selectionFinalized: false,
    selectionVersion: "",
    selectionFinalizedAtCapabilityVersion: "",
    invitations
  };
  const validation = validateSchoolInvitationSet(state);
  if (!validation.ok) throw new Error(`School Invitation Set validation failed：${validation.errors.join(",")}`);
  target.schoolInvitationState = state;
  return state;
}

function deepFreezeSchoolInvitationValue(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreezeSchoolInvitationValue);
  return Object.freeze(value);
}

function getSchoolInvitationDebugSnapshot(target) {
  const state = restoreSchoolInvitationState(target?.schoolInvitationState);
  const positionProfile = getSchoolRecruitingPositionProfile(target);
  const snapshot = {
    invitationVersion: state.version,
    generationCompleted: state.completed,
    generationSeed: state.generationSeed,
    compatibilityMode: state.compatibilityMode,
    playerCapabilitySummary: {
      initialSkillFormulaVersion: target?.capabilityState?.initialSkillFormulaVersion || "",
      settlementVersion: target?.capabilityState?.settlementVersion || "",
      bats: target?.bats || "",
      throws: target?.throws || "",
      baseballSkills: { ...(target?.baseballSkills || {}) }
    },
    narrativeIdentity: {
      idealSelf: target?.idealSelf || "",
      recruitingUsage: "future-presentation-only-not-used-in-recruiting-generation"
    },
    recruitingPositionProfile: cloneSchoolInvitationValue(positionProfile),
    schools: state.invitations.map(invitation => ({
      id: invitation.schoolId, name: invitation.schoolName, schoolSeed: invitation.schoolSeed,
      tier: invitation.schoolTier, recruitingPreference: invitation.recruitingPreference,
      candidatePosition: invitation.schoolInterest.candidatePosition,
      positionNeed: invitation.schoolInterest.positionNeed,
      capabilityMatch: invitation.schoolInterest.capabilityMatch,
      recruitingStandard: invitation.recruitingStandard,
      recruitingStandardFit: invitation.schoolInterest.recruitingStandardFit,
      interestScore: invitation.schoolInterest.score,
      interestCategory: invitation.schoolInterest.category,
      projectedRole: invitation.projectedRole,
      trainingQuality: invitation.trainingQuality,
      competitionDepth: invitation.competitionDepth,
      matchCompetitionLevel: invitation.matchCompetitionLevel,
      playingTimeOpportunity: invitation.playingTimeOpportunity,
      specializedInterest: invitation.specializedInterest,
      reasons: invitation.interestReasons.slice(), riskSignals: invitation.riskSignals.slice()
    })),
    diversityValidation: cloneSchoolInvitationValue(validateSchoolInvitationSet(state).diversity)
  };
  return deepFreezeSchoolInvitationValue(snapshot);
}

function createRepresentativeHighSchoolEntryFixture(profile = "ordinary", seed = 1) {
  const profiles = {
    ordinary: { idealSelf: "全能型", allocation: { ballSense: 1, observe: 1, fitness: 0, batting: 0, baseRunning: 0, baseballIQ: 1 } },
    defense: { idealSelf: "守備型", allocation: { ballSense: 1, observe: 1, fitness: 1, batting: 0, baseRunning: 0, baseballIQ: 0 } },
    batting: { idealSelf: "強打型", allocation: { ballSense: 1, observe: 0, fitness: 0, batting: 2, baseRunning: 0, baseballIQ: 0 } },
    low: { idealSelf: "棒球理解型", allocation: { ballSense: 0, observe: 0, fitness: 0, batting: 0, baseRunning: 1, baseballIQ: 2 } }
  };
  const config = profiles[profile] || profiles.ordinary;
  let randomState = Math.max(1, Number(seed) >>> 0);
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  const target = createInitialPlayer(`代表性高中球員-${profile}-${seed}`);
  target.origin = "understand";
  target.idealSelf = config.idealSelf;
  const roll = rollCharacterGenesis(random);
  const genesis = applyCharacterGenesis(target, { baseRoll: roll.baseRoll, allocation: config.allocation, shape: roll.shape, bats: "R", throws: "R" });
  if (!genesis.ok) throw new Error(genesis.error);
  applyCanonicalPositionProfile(target, "內野手", []);
  applySyntheticYouthOrigin(target);
  const settlement = settleHighSchoolEntryCapability(target, { originType: `representative-${profile}` });
  if (!settlement.ok) throw new Error(settlement.error);
  target.chapter = "青棒";
  target.age = 16;
  target.highSchoolStep = 5;
  target.highSchoolRoleCode = profile === "low" ? "bench" : "rotation";
  return target;
}

function rollCharacterGenesis(random = Math.random) {
  const values = [3, 3, 2, 2, 1, 1];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const sample = Number(random());
    const safeSample = Number.isFinite(sample) ? Math.max(0, Math.min(0.999999, sample)) : 0;
    const swapIndex = Math.floor(safeSample * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  const baseRoll = Object.fromEntries(CHARACTER_GENESIS_ABILITY_KEYS.map((key, index) => [key, values[index]]));
  return Object.freeze({
    baseRoll: Object.freeze(baseRoll),
    total: values.reduce((sum, value) => sum + value, 0),
    shape: CHARACTER_GENESIS_ABILITY_KEYS.filter(key => baseRoll[key] === 3).join("＋")
  });
}

function validateCharacterGenesisAllocation(allocation) {
  const normalized = Object.fromEntries(CHARACTER_GENESIS_ABILITY_KEYS.map(key => [key, Math.max(0, Math.min(2, Number(allocation?.[key]) || 0))]));
  const spent = Object.values(normalized).reduce((sum, value) => sum + value, 0);
  return { ok: spent === 3, allocation: normalized, spent, budget: 3 };
}

function applyCharacterGenesis(target, genesisInput = {}) {
  const rolled = genesisInput.baseRoll || {};
  const rollValues = CHARACTER_GENESIS_ABILITY_KEYS.map(key => Number(rolled[key]));
  const allocation = validateCharacterGenesisAllocation(genesisInput.allocation);
  const validRoll = rollValues.every(value => Number.isInteger(value) && value >= 1 && value <= 3)
    && rollValues.reduce((sum, value) => sum + value, 0) === 12;
  if (!validRoll || !allocation.ok) return { ok: false, error: "初始能力形狀或配置點數不合法。" };
  if (!PlayerIdentityOptions.bats.includes(genesisInput.bats) || !PlayerIdentityOptions.throws.includes(genesisInput.throws)) {
    return { ok: false, error: "投打慣用側不合法。" };
  }

  CHARACTER_GENESIS_ABILITY_KEYS.forEach(key => {
    const value = rolled[key] + allocation.allocation[key];
    if (["batting", "baseRunning", "baseballIQ"].includes(key)) target.baseballSkills[key] = value;
    else target[key] = value;
  });
  target.bats = genesisInput.bats;
  target.throws = genesisInput.throws;
  target.characterGenesis = {
    completed: true,
    baseRoll: { ...rolled },
    allocation: { ...allocation.allocation },
    allocationBudget: allocation.budget,
    allocationSpent: allocation.spent,
    total: 15,
    shape: genesisInput.shape || CHARACTER_GENESIS_ABILITY_KEYS.filter(key => rolled[key] === 3).join("＋"),
    archetype: target.idealSelf,
    initialAspiration: target.origin,
    finalAbilities: Object.fromEntries(CHARACTER_GENESIS_ABILITY_KEYS.map(key => [key, rolled[key] + allocation.allocation[key]]))
  };
  const capability = initializePlayerCapabilityFromGenesis(target);
  if (!capability.ok) return capability;
  return { ok: true, genesis: target.characterGenesis, initialSkills: { ...target.baseballSkills } };
}

function applyCanonicalPositionProfile(target, primaryPosition = "", secondaryPositions = []) {
  target.primaryPosition = typeof primaryPosition === "string" ? primaryPosition : "";
  target.secondaryPositions = Array.from(new Set((Array.isArray(secondaryPositions) ? secondaryPositions : [])
    .filter(position => typeof position === "string" && position && position !== target.primaryPosition))).slice(0, 1);
  return target;
}

function attachLegacyPositionCompatibility(target) {
  if (Object.getOwnPropertyDescriptor(target, "seasonPosition")?.get) return target;
  Object.defineProperties(target, {
    seasonPosition: {
      configurable: true,
      enumerable: true,
      get() { return this.primaryPosition || ""; },
      set(value) { this.primaryPosition = typeof value === "string" ? value : ""; }
    },
    secondaryPosition: {
      configurable: true,
      enumerable: true,
      get() { return this.secondaryPositions?.[0] || ""; },
      set(value) { this.secondaryPositions = typeof value === "string" && value && value !== this.primaryPosition ? [value] : []; }
    }
  });
  return target;
}

function restorePlayerSnapshotShape(snapshot = {}) {
  const restored = createInitialPlayer(snapshot.name || "");
  Object.assign(restored, snapshot);
  const primary = snapshot.primaryPosition !== undefined ? snapshot.primaryPosition : snapshot.seasonPosition;
  const secondaries = Array.isArray(snapshot.secondaryPositions)
    ? snapshot.secondaryPositions
    : snapshot.secondaryPosition ? [snapshot.secondaryPosition] : [];
  return applyCanonicalPositionProfile(restored, primary || "", secondaries);
}

function createInitialPlayer(name = "") {
  const state = {
    saveVersion: SAVE_VERSION,
    name,
    origin: PlayerIdentityOptions.origins[0],
    idealSelf: "",
    bats: "R",
    throws: "R",
    characterGenesis: {
      completed: false,
      baseRoll: Object.fromEntries(CHARACTER_GENESIS_ABILITY_KEYS.map(key => [key, 0])),
      allocation: Object.fromEntries(CHARACTER_GENESIS_ABILITY_KEYS.map(key => [key, 0])),
      allocationBudget: 3,
      allocationSpent: 0,
      total: 0,
      shape: "",
      archetype: "",
      initialAspiration: "",
      finalAbilities: Object.fromEntries(CHARACTER_GENESIS_ABILITY_KEYS.map(key => [key, 0]))
    },
    capabilityState: createDefaultCapabilityState(),
    developmentState: createDefaultDevelopmentState(),
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
    primaryPosition: "",
    secondaryPositions: [],
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
    schoolInvitationState: createDefaultSchoolInvitationState(),
    highSchoolStep: 0,
    highSchoolTeamRole: "",
    highSchoolRoleCode: "",
    highSchoolPositionPreference: "",
    highSchoolCoachEvaluation: { primaryPosition: "", secondaryPositions: [], rating: 0, rationale: "", idealAlignment: "", coachIdentity: "", context: "" },
    highSchoolRoleContext: { code: "", label: "", evidence: [], opportunity: "", assignment: "" },
    highSchoolMatch: {
      id: "", opponent: "", inning: 0, half: "", outs: 0,
      scores: { home: 0, away: 0 }, runners: [], role: "", position: "", assignment: "",
      momentIndex: 0, currentMomentId: "", currentDomain: "", completedMoments: [],
      offenseTeam: "", defenseTeam: "", currentBatter: "", currentAssignment: "", matchEntryHistory: "",
      battingOrderIndex: { home: 0, away: 0 }, halfInningResolved: false,
      regulationInnings: 7, lineScore: { home: [], away: [] },
      simulationPhase: "idle", simulationCursor: 0, simulationSeed: 0, simulationLog: [], presentedEventCursor: 0, scoreboardRevealHalfIndex: 0, rosters: { home: null, away: null },
      playerLineupStatus: "", playerLineupSlot: -1, playerFieldingAssignment: "", playerEntryWindowInning: 1, playerEntryCompleted: false,
      performanceEvidence: {}, developmentFullMatchStart: false, gameExposureState: null,
      playerRunnerLocation: -1,
      coachTacticalDirection: { domain: "", intent: "", riskPreference: "", priority: "", sourceCoachId: "", presentationStyle: "" },
      coachTacticalContextSignature: "",
      opponentTacticalTruth: { code: "", targetRunnerId: "" },
      ballContext: { type: "", family: "", pace: "", label: "", detail: "", timeWindow: "" },
      positionDecisionFamily: "", currentFieldingPosition: "", developmentPositionOverride: "", defensiveSituation: {},
      playerEventClassification: "ordinaryPlay", decisionTension: "none", decisionGate: null,
      lastDefensiveResolution: {},
      pendingHalfInningTermination: null,
      catcherDecisionState: null,
      catcherReassessmentTrigger: null,
      playerContribution: { strong: 0, mixed: 0, failure: 0, runsCreated: 0, runsScored: 0, hits: 0, walks: 0, outsCreated: 0, errors: 0 },
      previousMomentDecision: "", previousMomentOutcome: "", passage: "",
      opponentAdjustment: "", coachInstruction: "", decision: "", outcomeTier: "",
      outcome: "", consequence: "", coachReaction: "", teamReaction: "",
      performanceSummary: "", teamResult: "", settled: false, pendingGameSettlement: "", eventSettlementApplied: false, completed: false,
      developmentPresentationCompleted: false,
      matchExperience: null
    },
    highSchoolAzheEcho: { variant: "", influenceDirection: "", evidence: [], cause: "", change: "", recall: "", summary: "", persistentFlag: "" },
    highSchoolRivalContext: { rivalId: "takahashi", rivalName: "高橋", entryType: "", encounter: "", yearTwoPressure: "" },
    highSchoolYearOneComplete: false,
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
    age22OutcomeCode: "",
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
  return attachLegacyPositionCompatibility(state);
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
      player = restorePlayerSnapshotShape(deepClone(snapshot));
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
