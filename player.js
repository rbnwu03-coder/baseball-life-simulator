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
      performanceEvidence: {}, developmentFullMatchStart: false,
      playerRunnerLocation: -1,
      coachTacticalDirection: { domain: "", intent: "", riskPreference: "", priority: "", sourceCoachId: "", presentationStyle: "" },
      coachTacticalContextSignature: "",
      opponentTacticalTruth: { code: "", targetRunnerId: "" },
      ballContext: { type: "", family: "", pace: "", label: "", detail: "", timeWindow: "" },
      positionDecisionFamily: "", currentFieldingPosition: "", developmentPositionOverride: "", defensiveSituation: {},
      playerEventClassification: "ordinaryPlay", decisionTension: "none", decisionGate: null,
      lastDefensiveResolution: {},
      playerContribution: { strong: 0, mixed: 0, failure: 0, runsCreated: 0, runsScored: 0, hits: 0, walks: 0, outsCreated: 0, errors: 0 },
      previousMomentDecision: "", previousMomentOutcome: "", passage: "",
      opponentAdjustment: "", coachInstruction: "", decision: "", outcomeTier: "",
      outcome: "", consequence: "", coachReaction: "", teamReaction: "",
      performanceSummary: "", teamResult: "", settled: false, pendingGameSettlement: "", eventSettlementApplied: false, completed: false
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
