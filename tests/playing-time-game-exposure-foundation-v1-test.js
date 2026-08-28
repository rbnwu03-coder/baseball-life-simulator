const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const PlayingTimeGameExposure = require(path.join(root, "playing-time-game-exposure.js"));
let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

const baseInput = Object.freeze({
  playerId: "player-fixture",
  actualRole: "rotation",
  projectedRole: "rotationCandidate",
  playingTimeEnvironment: "medium",
  competitionDepth: "medium",
  positionNeed: "medium",
  coachUsageStyle: "balanced",
  positionCapability: 5,
  positionFit: 6,
  positionExperience: 6,
  position: "二壘手",
  secondaryPositions: ["外野手"],
  throws: "R",
  age: 16,
  gameContext: { importance: "regular", leverage: "normal", scoreMargin: 0 }
});

function opportunity(index, overrides = {}) {
  const input = { ...baseInput, matchId: `fixture-${index}`, ...overrides };
  const subject = {
    name: input.playerId,
    primaryPosition: input.position,
    secondaryPositions: input.secondaryPositions,
    throws: input.throws,
    age: input.age,
    capabilityState: { settlementVersion: "focused-fixture-v1" },
    baseballSkills: input.rawBaseballSkills || {}
  };
  const readinessSnapshot = PlayingTimeGameExposure.createOpportunityReadinessSnapshot({
    subject,
    playerId: input.playerId,
    position: input.position,
    capabilityProvider: () => ({ fielding: input.positionCapability, reaction: input.positionCapability, decision: input.positionCapability }),
    positionAssessmentProvider: () => ({ rating: input.positionFit * 3 }),
    positionExperienceProvider: () => input.positionExperience
  });
  const consumerInput = { ...input, readinessSnapshot };
  ["playerId", "positionCapability", "positionFit", "positionExperience", "position", "secondaryPositions", "throws", "age", "rawBaseballSkills"].forEach(key => delete consumerInput[key]);
  return PlayingTimeGameExposure.resolveStartingOpportunity(consumerInput);
}

function actualize(decision, index = 0) {
  const selector = PlayingTimeGameExposure.stableHash(`${decision.decisionId}|actual|${index}`);
  const plan = decision.plannedUsage.appearanceType;
  let truth;
  if (plan === "noAppearance" || (plan !== "start" && selector % 7 === 0)) {
    truth = { matchId: decision.matchId, participated: false, defensiveInnings: 0, plateAppearances: 0 };
  } else if (plan === "start") {
    const innings = 4 + (selector % 4);
    truth = { matchId: decision.matchId, participated: true, started: true, entryInning: 1, exitInning: innings, defensiveInnings: innings, plateAppearances: 2 + (selector % 3) };
  } else if (plan === "pinchHit") {
    truth = { matchId: decision.matchId, participated: true, started: false, entryInning: decision.plannedUsage.entryInning, exitInning: decision.plannedUsage.entryInning, defensiveInnings: 0, plateAppearances: 1 };
  } else if (plan === "defensiveSubstitution") {
    truth = { matchId: decision.matchId, participated: true, started: false, entryInning: decision.plannedUsage.entryInning, exitInning: 7, defensiveInnings: 1 + (selector % 2), plateAppearances: selector % 2 };
  } else {
    truth = { matchId: decision.matchId, participated: true, started: false, entryInning: decision.plannedUsage.entryInning, exitInning: 7, defensiveInnings: 1, plateAppearances: 1 };
  }
  return PlayingTimeGameExposure.finalizeGameExposure(PlayingTimeGameExposure.createGameExposureState(decision), truth).state;
}

function summarize(samples) {
  const total = samples.length || 1;
  return {
    samples: samples.length,
    startRate: samples.filter(item => item.appearanceType === "start").length / total,
    appearanceRate: samples.filter(item => item.appearanceType !== "noAppearance").length / total,
    noAppearanceRate: samples.filter(item => item.appearanceType === "noAppearance").length / total,
    averageDefensiveInnings: samples.reduce((sum, item) => sum + item.defensiveInnings, 0) / total,
    averagePlateAppearances: samples.reduce((sum, item) => sum + item.plateAppearances, 0) / total
  };
}

verify("1. Opportunity 與 Game Exposure 使用不同 version contract", PlayingTimeGameExposure.OPPORTUNITY_VERSION === "playing-time-opportunity-v1" && PlayingTimeGameExposure.EXPOSURE_VERSION === "game-exposure-v1");
verify("2. Starting resolver 是純資料輸出，不要求 Match mutation", typeof PlayingTimeGameExposure.resolveStartingOpportunity === "function");
const deterministicA = opportunity(1);
const deterministicB = opportunity(1);
verify("3. 相同 player／match／role／school／coach context 得到相同 decision", JSON.stringify(deterministicA) === JSON.stringify(deterministicB));
verify("4. 正式 output 含 identity、actual role、starting、appearance、substitution、reasons、version", ["matchId", "playerId", "actualRoleAtDecision", "startingOpportunity", "appearancePlan", "substitutionOpportunity", "opportunityReasons", "sourceVersion"].every(key => Object.hasOwn(deterministicA, key)));
verify("5. Debug snapshot 含環境、競爭、守位能力、教練與獨立 seed", deterministicA.schoolPlayingTimeEnvironment && deterministicA.positionCompetition && Number.isFinite(deterministicA.positionCapability) && deterministicA.coachUsageStyle && deterministicA.opportunitySeed);
verify("6. Projected Role 只保留 prior，Actual Role 仍是正式 decision truth", deterministicA.actualRoleAtDecision === "rotation" && deterministicA.projectedRolePrior === "rotationCandidate");
verify("7. Resolver source 不建立 overall rating 或 raw skill sum", !/overall\s*(rating|score)?|raw\s*skill\s*sum/i.test(fs.readFileSync(path.join(root, "playing-time-game-exposure.js"), "utf8")));
verify("8. Resolver 不使用 Math.random", !fs.readFileSync(path.join(root, "playing-time-game-exposure.js"), "utf8").includes("Math.random"));

const exposureState = PlayingTimeGameExposure.createGameExposureState(deterministicA);
verify("9. Exposure contract 分開保存 opportunity snapshot、planned 與 actual", exposureState.opportunitySnapshot.decisionId === deterministicA.decisionId && exposureState.plannedUsage && exposureState.actualUsage);
verify("10. 新 exposure 尚未 finalize，不能虛構 innings／PA", !exposureState.finalized && exposureState.defensiveInnings === 0 && exposureState.plateAppearances === 0);
const plannedActualDifference = PlayingTimeGameExposure.finalizeGameExposure(exposureState, { matchId: deterministicA.matchId, participated: false, defensiveInnings: 0, plateAppearances: 0 });
verify("11. planned appearance 可以因實際局勢變成 no appearance", deterministicA.plannedUsage.appearanceType !== "noAppearance" && plannedActualDifference.state.appearanceType === "noAppearance");
const duplicateFinalization = PlayingTimeGameExposure.finalizeGameExposure(plannedActualDifference.state, { matchId: deterministicA.matchId, participated: true, defensiveInnings: 7, plateAppearances: 4 });
verify("12. Actual Exposure exactly once，第二次 finalize 不重寫", duplicateFinalization.status === "duplicate" && JSON.stringify(duplicateFinalization.state) === JSON.stringify(plannedActualDifference.state));

const pinchDecision = opportunity(21, { actualRole: "bench" });
const pinchState = PlayingTimeGameExposure.finalizeGameExposure(PlayingTimeGameExposure.createGameExposureState(pinchDecision), { matchId: pinchDecision.matchId, participated: true, started: false, entryInning: 6, exitInning: 6, defensiveInnings: 0, plateAppearances: 1 });
verify("13. 代打 1 PA 不虛構守備局數", pinchState.state.appearanceType === "pinchHit" && pinchState.state.plateAppearances === 1 && pinchState.state.defensiveInnings === 0);
const defensiveState = PlayingTimeGameExposure.finalizeGameExposure(PlayingTimeGameExposure.createGameExposureState(pinchDecision), { matchId: pinchDecision.matchId, participated: true, started: false, entryInning: 6, exitInning: 7, defensiveInnings: 2, plateAppearances: 0 });
verify("14. 代守只保存真實入場後守備局數", defensiveState.state.appearanceType === "defensiveSubstitution" && defensiveState.state.entryInning === 6 && defensiveState.state.defensiveInnings === 2);
verify("15. No appearance 固定 0 innings／0 PA", plannedActualDifference.state.defensiveInnings === 0 && plannedActualDifference.state.plateAppearances === 0);

const left2B = opportunity(30, { throws: "L", position: "二壘手", secondaryPositions: [] });
const leftSS = opportunity(31, { throws: "L", position: "游擊手", secondaryPositions: [] });
const left3B = opportunity(32, { throws: "L", position: "三壘手", secondaryPositions: [] });
const leftC = opportunity(33, { throws: "L", position: "捕手", secondaryPositions: [] });
verify("16. 國小後左投不會被正式配置到 2B／SS／3B／C", [left2B, leftSS, left3B, leftC].every(item => item.assignedPosition === "一壘手" && item.positionFallbackApplied));
verify("17. 左投 1B 與 P 仍合法", PlayingTimeGameExposure.isPositionLegalForThrowingHand("一壘手", "L", 16) && PlayingTimeGameExposure.isPositionLegalForThrowingHand("投手", "L", 16));
const pitcher = opportunity(34, { position: "投手" });
verify("18. Pitcher 明確 deferred，不硬套野手 usage", pitcher.pitcherExposureDeferred && pitcher.plannedUsage.appearanceType === "noAppearance" && pitcher.opportunityReasons.includes("pitcher-exposure-deferred"));
const direct = opportunity(35, { actualRole: "bench", positionCapability: 1, competitionDepth: "veryHigh", playingTimeEnvironment: "low", directStartForced: true });
verify("19. Direct Start 強制參賽並標示 source", direct.exposureSource === "direct-start-forced" && direct.plannedUsage.appearanceType === "start");

const environmentAudit = {};
for (const environment of ["low", "medium", "mediumHigh", "high"]) {
  const states = Array.from({ length: 500 }, (_, index) => actualize(opportunity(`environment-${environment}-${index}`, { playingTimeEnvironment: environment }), index));
  environmentAudit[environment] = summarize(states);
}
verify("20. School Environment fixture 每個層級各 500 deterministic samples", Object.values(environmentAudit).every(item => item.samples === 500));
verify("21. high environment 的 start／appearance 高於 low", environmentAudit.high.startRate > environmentAudit.low.startRate && environmentAudit.high.appearanceRate > environmentAudit.low.appearanceRate);
verify("22. high environment 的平均守備局數／PA 高於 low", environmentAudit.high.averageDefensiveInnings > environmentAudit.low.averageDefensiveInnings && environmentAudit.high.averagePlateAppearances > environmentAudit.low.averagePlateAppearances);
verify("23. high environment 不是保證先發", environmentAudit.high.startRate < 1);

const capabilityLow = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`cap-low-${index}`, { positionCapability: 2, positionFit: 3 }), index)));
const capabilityHigh = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`cap-high-${index}`, { positionCapability: 9, positionFit: 9 }), index)));
verify("24. 同環境高守位能力平均 Opportunity 高於低守位能力", capabilityHigh.startRate > capabilityLow.startRate && capabilityHigh.appearanceRate > capabilityLow.appearanceRate);
const competitionLow = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`competition-low-${index}`, { competitionDepth: "low" }), index)));
const competitionVeryHigh = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`competition-high-${index}`, { competitionDepth: "veryHigh" }), index)));
verify("25. 同球員低競爭平均 Opportunity 高於 veryHigh", competitionLow.startRate > competitionVeryHigh.startRate && competitionLow.averageDefensiveInnings > competitionVeryHigh.averageDefensiveInnings);
const strongPowerhouse = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`strong-powerhouse-${index}`, { actualRole: "rotation", positionCapability: 9, positionFit: 9, playingTimeEnvironment: "low", competitionDepth: "veryHigh" }), index)));
const weakDevelopment = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`weak-development-${index}`, { actualRole: "rotation", positionCapability: 2, positionFit: 3, playingTimeEnvironment: "high", competitionDepth: "low" }), index)));
verify("26. 強校優秀球員仍能取得先發", strongPowerhouse.startRate > 0);
verify("27. 高機會學校弱球員仍不保證先發", weakDevelopment.startRate < 1);

const roleAudit = {};
for (const role of ["starter", "rotation", "bench"]) {
  roleAudit[role] = summarize(Array.from({ length: 400 }, (_, index) => actualize(opportunity(`role-${role}-${index}`, { actualRole: role }), index)));
}
verify("28. Starter／Rotation／Bench 各完成 400 samples", Object.values(roleAudit).every(item => item.samples === 400));
verify("29. Actual Role 平均 start／exposure 呈 Starter > Rotation > Bench", roleAudit.starter.startRate > roleAudit.rotation.startRate && roleAudit.rotation.startRate > roleAudit.bench.startRate && roleAudit.starter.averageDefensiveInnings > roleAudit.rotation.averageDefensiveInnings && roleAudit.rotation.averageDefensiveInnings > roleAudit.bench.averageDefensiveInnings);
verify("30. Rotation 偶爾先發且 Bench 有非零 appearance", roleAudit.rotation.startRate > 0 && roleAudit.rotation.startRate < 1 && roleAudit.bench.appearanceRate > 0);
verify("31. Starter 不是固定 7 局", roleAudit.starter.averageDefensiveInnings > 0 && roleAudit.starter.averageDefensiveInnings < 7);
const coachConservative = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`coach-conservative-${index}`, { actualRole: "bench", coachUsageStyle: "conservative" }), index)));
const coachDevelopmental = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`coach-developmental-${index}`, { actualRole: "bench", coachUsageStyle: "developmental" }), index)));
verify("31a. Developmental coach 的 Bench appearance 稍高於 conservative", coachDevelopmental.appearanceRate > coachConservative.appearanceRate);
const needLow = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`need-low-${index}`, { positionNeed: "low" }), index)));
const needHigh = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`need-high-${index}`, { positionNeed: "high" }), index)));
verify("31b. Position Need 是有限 Opportunity prior", needHigh.startRate > needLow.startRate && needHigh.startRate < 1);
const mustWinContext = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`must-win-${index}`, { actualRole: "bench", gameContext: { gameType: "highSchoolExhibition", expectedGameImportance: "mustWin", importance: "mustWin", leverage: "high", scoreMargin: 1 } }), index)));
const developmentContext = summarize(Array.from({ length: 500 }, (_, index) => actualize(opportunity(`development-game-${index}`, { actualRole: "bench", gameContext: { gameType: "highSchoolExhibition", expectedGameImportance: "development", importance: "development", leverage: "low", scoreMargin: 5 } }), index)));
verify("31c. Game importance／inning context 只作有限 usage weighting", developmentContext.appearanceRate > mustWinContext.appearanceRate && mustWinContext.appearanceRate > 0);

const structuralStates = [];
const anomalies = { illegalPositionAssignment: 0, duplicateOpportunity: 0, reloadMismatch: 0, nan: 0 };
const environments = ["low", "medium", "mediumHigh", "high"];
const roles = ["starter", "rotation", "bench"];
const competitions = ["low", "medium", "high", "veryHigh"];
for (let index = 0; index < 1600; index += 1) {
  const decision = opportunity(`structural-${index}`, {
    actualRole: roles[index % roles.length],
    playingTimeEnvironment: environments[index % environments.length],
    competitionDepth: competitions[(index * 3) % competitions.length],
    positionCapability: 2 + (index % 8),
    positionFit: 3 + (index % 7),
    coachUsageStyle: ["conservative", "balanced", "developmental", "performanceFirst"][index % 4],
    throws: index % 9 === 0 ? "L" : "R",
    position: index % 9 === 0 ? ["二壘手", "游擊手", "三壘手", "捕手"][index % 4] : "二壘手",
    secondaryPositions: []
  });
  const repeated = opportunity(`structural-${index}`, {
    actualRole: roles[index % roles.length], playingTimeEnvironment: environments[index % environments.length],
    competitionDepth: competitions[(index * 3) % competitions.length], positionCapability: 2 + (index % 8), positionFit: 3 + (index % 7),
    coachUsageStyle: ["conservative", "balanced", "developmental", "performanceFirst"][index % 4], throws: index % 9 === 0 ? "L" : "R",
    position: index % 9 === 0 ? ["二壘手", "游擊手", "三壘手", "捕手"][index % 4] : "二壘手", secondaryPositions: []
  });
  if (decision.assignedPosition && !PlayingTimeGameExposure.isPositionLegalForThrowingHand(decision.assignedPosition, index % 9 === 0 ? "L" : "R", 16)) anomalies.illegalPositionAssignment += 1;
  if (JSON.stringify(decision) !== JSON.stringify(repeated)) anomalies.duplicateOpportunity += 1;
  const state = actualize(decision, index);
  const restored = PlayingTimeGameExposure.normalizeGameExposureState(JSON.parse(JSON.stringify(state)), state.matchId);
  if (JSON.stringify(state) !== JSON.stringify(restored)) anomalies.reloadMismatch += 1;
  if (![decision.positionCapability, decision.debug.opportunityScore, state.defensiveInnings, state.plateAppearances].every(Number.isFinite)) anomalies.nan += 1;
  structuralStates.push(state);
}
const structuralAudit = { samples: structuralStates.length, ...summarize(structuralStates), anomalies };
verify("32. Structural distribution audit 完成 1600 samples", structuralAudit.samples === 1600);
verify("33. Illegal assignment／duplicate opportunity／reload mismatch／NaN 全為 0", Object.values(anomalies).every(value => value === 0));

const context = vm.createContext({
  console,
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    getElementById() { return { innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; } }; },
    querySelector() { return null; }, querySelectorAll() { return []; }
  },
  localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "offensive-plate-approach.js", "baseball-gameplay-integration.js",
  "baseball-training-resolver.js", "playing-time-game-exposure.js", "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js",
  "career-development-progression.js", "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
evaluate(`
  function __playingTimePlayer(name, role, directStart=false) {
    stopHighSchoolMatchPlayback();
    player=createRepresentativeHighSchoolEntryFixture("ordinary", 92001 + name.length);
    player.name=name;
    applyCanonicalPositionProfile(player,"二壘手",["外野手"]);
    player.chapter="青棒"; player.age=16; player.highSchoolStep=5; player.highSchoolRoleCode=role; player.highSchoolTeamRole=role;
    player.highSchoolRoute="普通高中・穩定出賽";
    player.flags=(player.flags||[]).filter(flag=>flag!=="direct_start_history");
    if(directStart) player.flags.push("direct_start_history");
    pendingHighSchoolMatchSimulationSeed=42001;
    return player;
  }
`);
const normalIntegration = parse(`(() => {__playingTimePlayer("Normal Route", "rotation", false);const development=JSON.stringify(player.developmentState);const match=prepareHighSchoolYearOneMatch();return {state:match.gameExposureState,developmentUnchanged:development===JSON.stringify(player.developmentState),cursor:match.simulationCursor,assignment:match.assignment};})()`);
verify("34. Normal Route 正式建立 Opportunity 與 Game Exposure side state", normalIntegration.state?.version === "game-exposure-v1" && normalIntegration.state.opportunitySnapshot.sourceVersion === "playing-time-opportunity-v1");
verify("35. Opportunity plan 不 mutation Development，也不消耗 Match RNG cursor", normalIntegration.developmentUnchanged && normalIntegration.cursor === 0);
verify("36. 比賽入口只顯示自然安排文字，不顯示 raw score／百分比", normalIntegration.assignment.length > 0 && !/opportunity|score|%|機率/i.test(normalIntegration.assignment));
const directIntegration = parse(`(() => {__playingTimePlayer("Direct Start", "bench", true);const match=prepareHighSchoolYearOneMatch();return {source:match.gameExposureState.exposureSource,plan:match.gameExposureState.plannedUsage.appearanceType,status:match.playerLineupStatus,entered:match.playerEntryCompleted};})()`);
verify("37. High School Direct Start 維持 forced participation", directIntegration.source === "direct-start-forced" && directIntegration.plan === "start" && directIntegration.status === "starter" && directIntegration.entered);
const reloadIntegration = parse(`(() => {__playingTimePlayer("Reload", "rotation", false);const match=prepareHighSchoolYearOneMatch();const before=JSON.stringify(match.gameExposureState);const restored=normalizeSave(JSON.parse(JSON.stringify(player)));return {same:before===JSON.stringify(restored.highSchoolMatch.gameExposureState),plan:restored.highSchoolMatch.gameExposureState.plannedUsage};})()`);
verify("38. 賽前 Save／Reload 保存同一 plan，不 reroll", reloadIntegration.same && reloadIntegration.plan);
verify("39. 已完成且沒有新 state 的舊 Match 不被 retroactively rewrite", evaluate(`(() => {const p=__playingTimePlayer("Legacy Completed", "starter", false);p.highSchoolMatch.completed=true;p.highSchoolMatch.id="legacy-completed";delete p.highSchoolMatch.gameExposureState;return normalizeSave(JSON.parse(JSON.stringify(p))).highSchoolMatch.gameExposureState===null;})()`));

const settlementIntegration = parse(`(() => {
  __playingTimePlayer("Actual Exposure", "starter", true);const match=prepareHighSchoolYearOneMatch();
  match.simulationLog=[{sequence:0,type:"matchEntry",inning:1,half:"上"},
    {sequence:1,type:"halfInningEnd",inning:1,half:"上"},{sequence:2,type:"plateAppearance",inning:1,half:"下",batterId:"player"},
    {sequence:3,type:"halfInningEnd",inning:2,half:"上"},{sequence:4,type:"plateAppearance",inning:2,half:"下",batterId:"player"},
    {sequence:5,type:"halfInningEnd",inning:3,half:"上"}];
  match.inning=7;match.half="終";match.settled=false;match.completed=false;match.completedMoments=[];
  const beforeSkills=JSON.stringify(player.baseballSkills);settleHighSchoolYearOneMatch(match,"zone");
  const first=JSON.stringify(match.gameExposureState);const duplicate=finalizeHighSchoolGameExposure(match);
  return {exposure:match.gameExposureState,matchExperience:match.matchExperience,beforeSkills,afterSkills:JSON.stringify(player.baseballSkills),duplicate:duplicate.status,unchanged:first===JSON.stringify(match.gameExposureState)};
})()`);
verify("40. Match End 從 canonical log finalize 真實 3 守備局／2 PA", settlementIntegration.exposure.finalized && settlementIntegration.exposure.defensiveInnings === 3 && settlementIntegration.exposure.plateAppearances === 2);
verify("41. Match Experience 明確讀到 finalized actual innings／PA", settlementIntegration.matchExperience.exposure.defensiveInnings === 3 && settlementIntegration.matchExperience.exposure.plateAppearances === 2);
verify("42. Exposure finalization exactly once，不重複 Development", settlementIntegration.duplicate === "duplicate" && settlementIntegration.unchanged);

const noAppearanceIntegration = parse(`(() => {
  __playingTimePlayer("No Appearance", "bench", false);const match=prepareHighSchoolYearOneMatch();
  const readiness=PlayingTimeGameExposure.createOpportunityReadinessSnapshot({subject:player,playerId:"no-appearance",position:"二壘手",capabilityProvider:()=>({fielding:0,reaction:0,decision:0}),positionAssessmentProvider:()=>({rating:0}),positionExperienceProvider:()=>0});
  const noPlan=PlayingTimeGameExposure.resolveStartingOpportunity({matchId:match.id,readinessSnapshot:readiness,actualRole:"bench",playingTimeEnvironment:"low",competitionDepth:"veryHigh",positionNeed:"low",coachUsageStyle:"conservative"});
  match.gameExposureState=PlayingTimeGameExposure.createGameExposureState(noPlan);match.playerLineupStatus="bench";match.playerEntryCompleted=false;match.simulationLog=[];match.inning=7;match.half="終";match.settled=false;match.completed=false;match.completedMoments=[];
  const skills=JSON.stringify(player.baseballSkills),development=JSON.stringify(player.developmentState);settleHighSchoolYearOneMatch(match,"zone");
  return {exposure:match.gameExposureState,contexts:match.matchExperience.selectedContexts.length,skillsUnchanged:skills===JSON.stringify(player.baseballSkills),developmentUnchanged:development===JSON.stringify(player.developmentState)};
})()`);
verify("43. No appearance 實際為 0 innings／0 PA／0 Development Context", noAppearanceIntegration.exposure.appearanceType === "noAppearance" && noAppearanceIntegration.exposure.defensiveInnings === 0 && noAppearanceIntegration.exposure.plateAppearances === 0 && noAppearanceIntegration.contexts === 0);
verify("44. No appearance 不產生 fake skill 或 Development mutation", noAppearanceIntegration.skillsUnchanged && noAppearanceIntegration.developmentUnchanged);
const actualNoAppearanceFlow = parse(`(() => {
  __playingTimePlayer("Actual No Appearance Flow", "bench", false);const match=prepareHighSchoolYearOneMatch();
  const readiness=PlayingTimeGameExposure.createOpportunityReadinessSnapshot({subject:player,playerId:"actual-no-appearance",position:"二壘手",capabilityProvider:()=>({fielding:0,reaction:0,decision:0}),positionAssessmentProvider:()=>({rating:0}),positionExperienceProvider:()=>0});
  const noPlan=PlayingTimeGameExposure.resolveStartingOpportunity({matchId:match.id,readinessSnapshot:readiness,actualRole:"bench",playingTimeEnvironment:"low",competitionDepth:"veryHigh",positionNeed:"low",coachUsageStyle:"conservative"});
  match.gameExposureState=PlayingTimeGameExposure.createGameExposureState(noPlan);match.rosters=createHighSchoolMatchSimulationRoster("bench","二壘手");match.playerLineupStatus="bench";match.playerLineupSlot=-1;match.playerEntryCompleted=false;match.currentBatter=match.rosters.away.lineup[0].id;match.presentedEventCursor=match.simulationLog.length;
  let steps=0;while(!match.completed&&steps<5000){advanceHighSchoolMatchPlaybackStep(match);steps++;}
  return {completed:match.completed,steps,appearance:match.gameExposureState.appearanceType,innings:match.gameExposureState.defensiveInnings,pa:match.gameExposureState.plateAppearances,contexts:match.matchExperience?.selectedContexts?.length};
})()`);
verify("44a. 正式 continuous Match flow 可自然完成 no appearance", actualNoAppearanceFlow.completed && actualNoAppearanceFlow.steps < 5000 && actualNoAppearanceFlow.appearance === "noAppearance" && actualNoAppearanceFlow.innings === 0 && actualNoAppearanceFlow.pa === 0 && actualNoAppearanceFlow.contexts === 0);

const rngIsolation = parse(`(() => {__playingTimePlayer("RNG Isolation", "starter", false);const a={simulationSeed:77331,simulationCursor:0},b={simulationSeed:77331,simulationCursor:0};const a1=nextHighSchoolMatchSimulationRandom(a),a2=nextHighSchoolMatchSimulationRandom(a);const b1=nextHighSchoolMatchSimulationRandom(b);createHighSchoolPlayingTimeOpportunity({matchId:"rng-isolation",actualRole:"starter",requestedPosition:"二壘手",directStartForced:false});const b2=nextHighSchoolMatchSimulationRandom(b);return {same:a1===b1&&a2===b2,cursors:[a.simulationCursor,b.simulationCursor]};})()`);
verify("45. Opportunity diagnostics 不改 Match RNG stream", rngIsolation.same && rngIsolation.cursors[0] === rngIsolation.cursors[1]);

const actualExposureValues = parse(`(() => {const total=(match,exposure)=>MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.deriveMatchExperienceEvidence(match,{exposure})).reduce((sum,item)=>sum+item.totalValue,0);return {
  low:total({id:"low-actual",simulationLog:[],completedMoments:[]},{defensiveInnings:1,plateAppearances:1,role:"substitute"}),
  high:total({id:"high-actual",simulationLog:[],completedMoments:[]},{defensiveInnings:6,plateAppearances:4,role:"starter"})
};})()`);
verify("46. 更多 Actual Exposure 平均提供更多 Match Experience opportunity", actualExposureValues.high > actualExposureValues.low);
verify("47. Playing-Time module 不呼叫 Development processor 或修改 skills", !/applyDevelopmentResult|applySkillEffects|baseballSkills\s*\[.*\]\s*=/.test(fs.readFileSync(path.join(root, "playing-time-game-exposure.js"), "utf8")));
verify("48. School trainingQuality 未接入 Opportunity resolver", !fs.readFileSync(path.join(root, "playing-time-game-exposure.js"), "utf8").includes("trainingQuality"));
verify("49. Production index 在 Match Experience 與 script 前載入 Playing-Time module", (() => { const html = fs.readFileSync(path.join(root, "index.html"), "utf8"); return html.indexOf("playing-time-game-exposure.js") < html.indexOf("match-experience-development.js") && html.indexOf("playing-time-game-exposure.js") < html.indexOf("script.js"); })());

console.log(`\nPlaying Time / Game Exposure Foundation v1：${passed}/${passed} 通過`);
console.log(`PLAYING_TIME_ENVIRONMENT_AUDIT_JSON=${JSON.stringify(environmentAudit)}`);
console.log(`PLAYING_TIME_CAPABILITY_COMPETITION_AUDIT_JSON=${JSON.stringify({ capabilityLow, capabilityHigh, competitionLow, competitionVeryHigh, strongPowerhouse, weakDevelopment, coachConservative, coachDevelopmental, needLow, needHigh, mustWinContext, developmentContext })}`);
console.log(`PLAYING_TIME_ROLE_AUDIT_JSON=${JSON.stringify(roleAudit)}`);
console.log(`PLAYING_TIME_STRUCTURAL_AUDIT_JSON=${JSON.stringify(structuralAudit)}`);
console.log("This is structural validation, not population balance.");
