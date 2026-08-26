const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const PlayingTimeGameExposure = require(path.join(root, "playing-time-game-exposure.js"));
let passed = 0;

function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function createSubject(name, throws = "R") {
  return {
    name,
    age: 16,
    throws,
    primaryPosition: "二壘手",
    secondaryPositions: ["游擊手", "外野手"],
    capabilityState: { settlementVersion: "capability-settlement-v1" },
    baseballSkills: { catching: 999, throwing: -999 }
  };
}

function createReadiness(overrides = {}) {
  const values = {
    fielding: 6,
    reaction: 6,
    decision: 6,
    fit: 6,
    experience: 6,
    ...overrides
  };
  const subject = values.subject || createSubject(values.playerId || "boundary-player", values.throws || "R");
  return PlayingTimeGameExposure.createOpportunityReadinessSnapshot({
    subject,
    playerId: values.playerId || subject.name,
    position: values.position || "二壘手",
    capabilityProvider: (_player, position) => {
      if (values.byPosition) return values.byPosition[position];
      return { fielding: values.fielding, reaction: values.reaction, decision: values.decision };
    },
    positionAssessmentProvider: position => ({ rating: (values.fitByPosition?.[position] ?? values.fit) * 3 }),
    positionExperienceProvider: (_player, position) => values.experienceByPosition?.[position] ?? values.experience
  });
}

function resolveWithSnapshot(readinessSnapshot, overrides = {}) {
  return PlayingTimeGameExposure.resolveStartingOpportunity({
    matchId: "boundary-match",
    readinessSnapshot,
    actualRole: "rotation",
    projectedRole: "rotationCandidate",
    playingTimeEnvironment: "medium",
    competitionDepth: "medium",
    positionNeed: "medium",
    coachUsageStyle: "balanced",
    gameContext: { importance: "regular", leverage: "normal", scoreMargin: 0 },
    ...overrides
  });
}

const ROLE_BASE = { starter: 58, rotation: 48, bench: 37 };
const ENVIRONMENT_MODIFIER = { low: -5, medium: -1, mediumHigh: 3, high: 6 };
const COMPETITION_MODIFIER = { veryHigh: -6, high: -3, medium: 0, low: 4 };
const POSITION_NEED_MODIFIER = { low: -4, medium: 0, high: 5 };
const PROJECTED_ROLE_PRIOR = { coreCandidate: 3, starterCompetition: 2, rotationCandidate: 0, benchCandidate: -1, depthCandidate: -2 };

function oldCoachModifier(style, role, capability) {
  if (style === "conservative") return role === "starter" ? 2 : -3;
  if (style === "developmental") return role === "starter" ? -1 : 4;
  if (style === "performanceFirst") return capability >= 6 ? 3 : -4;
  return 0;
}

function oldContextModifier(context = {}) {
  const margin = Math.abs(Number(context.scoreMargin) || 0);
  let modifier = context.importance === "mustWin" ? -2 : context.importance === "development" ? 3 : 0;
  if (context.leverage === "low" || margin >= 4) modifier += 2;
  if (context.leverage === "high" && margin <= 1) modifier -= 1;
  return modifier;
}

function oldPlan(score, role, coachStyle, hash) {
  if (score >= 55) return { appearanceType: "start", entryInning: 1, entryHalf: "上" };
  if (score < 36) return { appearanceType: "noAppearance", entryInning: null, entryHalf: "" };
  const appearanceSelector = hash % 10;
  return {
    appearanceType: coachStyle === "developmental" || appearanceSelector <= 3
      ? "defensiveSubstitution" : appearanceSelector <= 6 ? "pinchHit" : "lateGameAppearance",
    entryInning: role === "rotation" ? 5 : 5 + (hash % 2),
    entryHalf: "下"
  };
}

function legacyDirectCapabilityPath(input) {
  const role = ["starter", "rotation", "bench"].includes(input.actualRole) ? input.actualRole : "bench";
  const coachStyle = PlayingTimeGameExposure.normalizeCoachUsageStyle(input.coachUsageStyle);
  const position = PlayingTimeGameExposure.resolveLegalPosition(input);
  const context = input.gameContext || {};
  const identity = [PlayingTimeGameExposure.OPPORTUNITY_VERSION, input.matchId, input.playerId, input.opportunitySeed || "", role,
    input.projectedRole || "", input.playingTimeEnvironment || "medium", input.competitionDepth || "medium",
    input.positionNeed || "medium", coachStyle, position.assigned, input.positionCapability, input.positionFit,
    input.positionExperience, context.gameType || "game", context.inning || 0, context.scoreMargin || 0,
    context.expectedGameImportance || context.importance || "regular", context.leverage || "normal"].join("|");
  const hash = PlayingTimeGameExposure.stableHash(identity);
  const breakdown = {
    actualRole: ROLE_BASE[role],
    positionCapability: Math.round((input.positionCapability - 5) * 4),
    positionFit: Math.round((input.positionFit - 5) * 2),
    positionExperience: Math.round((input.positionExperience - 5) * 1.5),
    schoolEnvironment: ENVIRONMENT_MODIFIER[input.playingTimeEnvironment] ?? ENVIRONMENT_MODIFIER.medium,
    competitionDepth: COMPETITION_MODIFIER[input.competitionDepth] ?? COMPETITION_MODIFIER.medium,
    positionNeed: POSITION_NEED_MODIFIER[input.positionNeed] ?? POSITION_NEED_MODIFIER.medium,
    projectedRolePrior: PROJECTED_ROLE_PRIOR[input.projectedRole] ?? 0,
    coachUsage: oldCoachModifier(coachStyle, role, input.positionCapability),
    gameContext: oldContextModifier(context),
    deterministicVariation: (hash % 31) - 15
  };
  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  let plannedUsage = oldPlan(score, role, coachStyle, hash);
  let exposureSource = "opportunity-resolver";
  if (input.directStartForced && !position.pitcherExposureDeferred) {
    plannedUsage = { appearanceType: "start", entryInning: 1, entryHalf: "上" };
    exposureSource = "direct-start-forced";
  }
  if (position.pitcherExposureDeferred || !position.legal) plannedUsage = { appearanceType: "noAppearance", entryInning: null, entryHalf: "" };
  return {
    matchId: input.matchId,
    decisionId: `${input.matchId}|${input.playerId}|${hash.toString(16).padStart(8, "0")}`,
    plannedUsage,
    assignedPosition: position.assigned,
    exposureSource,
    debug: { opportunityHash: hash, opportunityScore: score, scoreBreakdown: breakdown }
  };
}

function actualize(decision, index) {
  const selector = PlayingTimeGameExposure.stableHash(`${decision.decisionId}|actual|${index}`);
  const appearanceType = decision.plannedUsage.appearanceType;
  if (appearanceType === "noAppearance" || (appearanceType !== "start" && selector % 7 === 0)) {
    return { appearanceType: "noAppearance", defensiveInnings: 0, plateAppearances: 0 };
  }
  if (appearanceType === "start") return { appearanceType, defensiveInnings: 4 + (selector % 4), plateAppearances: 2 + (selector % 3) };
  if (appearanceType === "pinchHit") return { appearanceType, defensiveInnings: 0, plateAppearances: 1 };
  if (appearanceType === "defensiveSubstitution") return { appearanceType, defensiveInnings: 1 + (selector % 2), plateAppearances: selector % 2 };
  return { appearanceType, defensiveInnings: 1, plateAppearances: 1 };
}

function summarize(items) {
  const count = items.length || 1;
  return {
    samples: items.length,
    startRate: items.filter(item => item.appearanceType === "start").length / count,
    appearanceRate: items.filter(item => item.appearanceType !== "noAppearance").length / count,
    averageDefensiveInnings: items.reduce((sum, item) => sum + item.defensiveInnings, 0) / count,
    averagePlateAppearances: items.reduce((sum, item) => sum + item.plateAppearances, 0) / count
  };
}

function groupedSummary(records, key, side) {
  return Object.fromEntries([...new Set(records.map(record => record[key]))].map(value => [value,
    summarize(records.filter(record => record[key] === value).map(record => record[side]))]));
}

verify("1. Readiness 使用獨立 versioned contract", PlayingTimeGameExposure.READINESS_VERSION === "opportunity-readiness-v1");
const snapshot = createReadiness();
verify("2. Snapshot schema 含 source、components、confidence、reasons 與 provenance",
  ["version", "playerId", "position", "sourceType", "sourceVersion", "readinessBand", "positionFit", "fieldingReadiness",
    "reactionReadiness", "decisionReadiness", "experienceReadiness", "confidence", "reasons", "provenance"].every(key => Object.hasOwn(snapshot, key)));
verify("3. 現階段 Producer 明確標記 system-derived-provisional", snapshot.sourceType === "system-derived-provisional" && snapshot.confidence === "provisional");
verify("4. Snapshot compact frozen copy 不複製 raw skill truth 或 overall", Object.isFrozen(snapshot) && !/baseballSkills|catching|throwing|overall|playerRating/.test(JSON.stringify(snapshot)));
verify("5. 同一 provisional state 產生 deterministic Snapshot", JSON.stringify(snapshot) === JSON.stringify(createReadiness()));
verify("6. Match identity 不造成 readiness noise", JSON.stringify(createReadiness({ matchId: "a" })) === JSON.stringify(createReadiness({ matchId: "b" })));

const low = createReadiness({ fielding: 2, reaction: 3, decision: 2, fit: 3, experience: 3 });
const high = createReadiness({ fielding: 8, reaction: 9, decision: 8, fit: 8, experience: 8 });
verify("7. Producer 保有 Capability → Snapshot sensitivity", high.positionReadiness > low.positionReadiness && high.readinessBand === "strong" && low.readinessBand === "low");
const twoBase = createReadiness({ position: "二壘手", byPosition: { 二壘手: { fielding: 8, reaction: 8, decision: 8 }, 游擊手: { fielding: 4, reaction: 4, decision: 4 } }, fitByPosition: { 二壘手: 8, 游擊手: 4 }, experienceByPosition: { 二壘手: 8, 游擊手: 4 } });
const shortstop = createReadiness({ position: "游擊手", byPosition: { 二壘手: { fielding: 8, reaction: 8, decision: 8 }, 游擊手: { fielding: 4, reaction: 4, decision: 4 } }, fitByPosition: { 二壘手: 8, 游擊手: 4 }, experienceByPosition: { 二壘手: 8, 游擊手: 4 } });
verify("8. Snapshot 是 player + position specific", twoBase.positionReadiness > shortstop.positionReadiness && twoBase.position !== shortstop.position);
const illegalLeft = createReadiness({ subject: { ...createSubject("left-player", "L"), secondaryPositions: [] }, playerId: "left-player", position: "二壘手" });
verify("9. Producer 保留左投國小後守位合法性 guard", illegalLeft.position === "一壘手" && illegalLeft.positionFallbackApplied && illegalLeft.positionLegal);

assert.throws(() => PlayingTimeGameExposure.resolveStartingOpportunity({ actualRole: "starter" }), /Readiness Snapshot/);
verify("10. Resolver 拒絕缺少合法 Readiness Snapshot 的輸入", true);
const rawHigh = { baseballSkills: Object.fromEntries(["catching", "throwing", "reaction", "decision"].map(key => [key, 999])) };
const rawLow = { baseballSkills: Object.fromEntries(["catching", "throwing", "reaction", "decision"].map(key => [key, -999])) };
const sameSnapshotHighTruth = resolveWithSnapshot(snapshot, { player: rawHigh });
const sameSnapshotLowTruth = resolveWithSnapshot(snapshot, { player: rawLow });
verify("11. Same Snapshot + Different Raw Truth → Same Opportunity", JSON.stringify(sameSnapshotHighTruth) === JSON.stringify(sameSnapshotLowTruth));
verify("12. 同 Snapshot 與同 context 保持同 Opportunity", JSON.stringify(resolveWithSnapshot(snapshot)) === JSON.stringify(resolveWithSnapshot(snapshot)));
verify("13. Snapshot → Opportunity 仍保有 readiness sensitivity", resolveWithSnapshot(high).debug.opportunityScore > resolveWithSnapshot(low).debug.opportunityScore);
const highNotGuaranteed = Array.from({ length: 200 }, (_, index) => resolveWithSnapshot(high, { matchId: `high-not-guaranteed-${index}`, actualRole: "bench", playingTimeEnvironment: "low", competitionDepth: "veryHigh", positionNeed: "low", coachUsageStyle: "conservative" }));
verify("14. High readiness 不等於推薦或保證先發", highNotGuaranteed.some(item => item.plannedUsage.appearanceType !== "start"));

const source = fs.readFileSync(path.join(root, "playing-time-game-exposure.js"), "utf8");
const resolverSource = source.slice(source.indexOf("function resolveStartingOpportunity"), source.indexOf("function createGameExposureState"));
verify("15. Resolver scope 不讀 raw player skills／Simulation Capability／Position helper", !/player\.baseballSkills|getDefensiveSimulationCapability|getPositionAssessment|input\.positionCapability|input\.positionFit|input\.positionExperience|input\.throws|input\.age/.test(resolverSource));
verify("16. Producer 與 Resolver 都不使用 Match RNG 或 Math.random", !source.includes("Math.random") && !source.includes("simulationCursor"));

const forced = resolveWithSnapshot(low, { directStartForced: true, actualRole: "bench" });
verify("17. Direct Start bypass 仍強制 start 並保留 source", forced.exposureSource === "direct-start-forced" && forced.plannedUsage.appearanceType === "start");
const savedState = PlayingTimeGameExposure.createGameExposureState(resolveWithSnapshot(snapshot));
const reloadedState = PlayingTimeGameExposure.normalizeGameExposureState(JSON.parse(JSON.stringify(savedState)), savedState.matchId);
verify("18. Save／Reload 延續原 Opportunity 與 Readiness compact copy，不 reroll", JSON.stringify(savedState) === JSON.stringify(reloadedState) && reloadedState.opportunitySnapshot.readinessSnapshot.version === PlayingTimeGameExposure.READINESS_VERSION);

const roles = ["starter", "rotation", "bench"];
const environments = ["low", "medium", "mediumHigh", "high"];
const competitions = ["veryHigh", "high", "medium", "low"];
const capabilities = [2.5, 4.5, 6.5, 8.5];
const records = [];
let mismatch = 0;
for (let index = 0; index < 1600; index += 1) {
  const raw = {
    matchId: `parity-${index}`,
    playerId: `parity-player-${index}`,
    actualRole: roles[index % roles.length],
    projectedRole: ["coreCandidate", "rotationCandidate", "benchCandidate"][index % 3],
    playingTimeEnvironment: environments[index % environments.length],
    competitionDepth: competitions[Math.floor(index / 4) % competitions.length],
    positionNeed: ["low", "medium", "high"][Math.floor(index / 16) % 3],
    coachUsageStyle: ["conservative", "balanced", "developmental", "performanceFirst"][Math.floor(index / 48) % 4],
    positionCapability: capabilities[Math.floor(index / 3) % capabilities.length],
    positionFit: [4, 6, 8][Math.floor(index / 5) % 3],
    positionExperience: [3, 5, 7][Math.floor(index / 7) % 3],
    position: "二壘手",
    secondaryPositions: ["外野手"],
    throws: "R",
    age: 16,
    gameContext: { importance: index % 13 === 0 ? "mustWin" : index % 17 === 0 ? "development" : "regular", leverage: index % 11 === 0 ? "high" : "normal", scoreMargin: index % 9 === 0 ? 4 : 0 }
  };
  const readinessSnapshot = createReadiness({ playerId: raw.playerId, fielding: raw.positionCapability, reaction: raw.positionCapability, decision: raw.positionCapability, fit: raw.positionFit, experience: raw.positionExperience });
  const modern = PlayingTimeGameExposure.resolveStartingOpportunity({ ...raw, readinessSnapshot });
  const legacy = legacyDirectCapabilityPath(raw);
  const same = JSON.stringify(modern.plannedUsage) === JSON.stringify(legacy.plannedUsage)
    && modern.assignedPosition === legacy.assignedPosition
    && modern.debug.opportunityHash === legacy.debug.opportunityHash
    && modern.debug.opportunityScore === legacy.debug.opportunityScore
    && JSON.stringify(modern.debug.scoreBreakdown) === JSON.stringify(legacy.debug.scoreBreakdown);
  if (!same) mismatch += 1;
  records.push({ role: raw.actualRole, environment: raw.playingTimeEnvironment, competition: raw.competitionDepth, modern: actualize(modern, index), legacy: actualize(legacy, index) });
}

const parityAudit = {
  samples: records.length,
  decisionMismatch: mismatch,
  before: {
    overall: summarize(records.map(record => record.legacy)),
    role: groupedSummary(records, "role", "legacy"),
    environment: groupedSummary(records, "environment", "legacy"),
    competition: groupedSummary(records, "competition", "legacy")
  },
  after: {
    overall: summarize(records.map(record => record.modern)),
    role: groupedSummary(records, "role", "modern"),
    environment: groupedSummary(records, "environment", "modern"),
    competition: groupedSummary(records, "competition", "modern")
  }
};
verify("19. 1600 組 old direct path vs new snapshot path decision mismatch = 0", parityAudit.samples === 1600 && parityAudit.decisionMismatch === 0);
verify("20. start／appearance／innings／PA 舊新分布完全一致", JSON.stringify(parityAudit.before.overall) === JSON.stringify(parityAudit.after.overall));
verify("21. Actual Role 分布舊新完全一致", JSON.stringify(parityAudit.before.role) === JSON.stringify(parityAudit.after.role));
verify("22. School Environment 分布舊新完全一致", JSON.stringify(parityAudit.before.environment) === JSON.stringify(parityAudit.after.environment));
verify("23. Competition 分布舊新完全一致", JSON.stringify(parityAudit.before.competition) === JSON.stringify(parityAudit.after.competition));
verify("24. Environment 方向仍為 low < medium < mediumHigh < high", ["low", "medium", "mediumHigh", "high"].every((key, index, array) => index === 0 || parityAudit.after.environment[array[index - 1]].averageDefensiveInnings < parityAudit.after.environment[key].averageDefensiveInnings));
verify("25. Role 平均 exposure 仍為 Starter > Rotation > Bench", parityAudit.after.role.starter.averageDefensiveInnings > parityAudit.after.role.rotation.averageDefensiveInnings && parityAudit.after.role.rotation.averageDefensiveInnings > parityAudit.after.role.bench.averageDefensiveInnings);

console.log(`\nOpportunity Evaluation Boundary Fix v1.0.1：${passed}/${passed} 通過`);
console.log(`OPPORTUNITY_EVALUATION_BOUNDARY_PARITY_JSON=${JSON.stringify(parityAudit)}`);
