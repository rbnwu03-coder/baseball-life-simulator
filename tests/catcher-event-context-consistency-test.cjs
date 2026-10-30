"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createContext } = require("./helpers/canonical-match-contract-context.cjs");
const h = createContext();
h.run(`
  function catcherFixture(bases = []) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome = null; isTransitioning = false;
    player = createInitialPlayer("Catcher event regression");
    applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player, {originType:"test-fixture"});
    applyCanonicalPositionProfile(player, "捕手", []);
    player.chapter = "青棒"; player.highSchoolStep = 5;
    player.highSchoolRoleCode = "starter"; player.highSchoolTeamRole = "starter";
    pendingHighSchoolMatchSimulationSeed = 41001;
    const m = prepareHighSchoolYearOneMatch();
    Object.assign(m, {role:"rotation", position:"捕手", currentFieldingPosition:"捕手",
      playerFieldingAssignment:"捕手", positionDecisionFamily:"", defensiveSituation:{},
      inning:3, half:"上", outs:0, offenseTeam:"away", defenseTeam:"home",
      currentDomain:"flow", simulationPhase:"moment_1_resolved", momentIndex:0,
      currentMomentId:highSchoolYearOneMomentIds[0], playerEntryCompleted:true,
      playerLineupStatus:"starter", runners:[null,null,null]});
    bases.forEach((occupied, i) => { if (occupied) m.runners[i] = m.rosters.away.lineup[i+1].id; });
    m.currentBatter = getHighSchoolMatchLineupBatter(m, "away").id;
    return m;
  }
  function catcherWorld(m) {
    return JSON.stringify({id:m.id, inning:m.inning, half:m.half, outs:m.outs,
      runners:m.runners, scores:m.scores, batter:m.currentBatter,
      order:m.battingOrderIndex, seed:m.simulationSeed, cursor:m.simulationCursor});
  }
  function catcherSnapshot(m, event = null) {
    return {matchId:m.id, paIdentity:createHighSchoolOffensiveTacticalIdentity(m),
      inning:m.inning, half:m.half, outs:m.outs, runners:m.runners,
      position:m.position, role:m.role, phase:m.simulationPhase, domain:m.currentDomain,
      sourcePitch:m.offensiveBuntPAState?.pitchHistory.at(-1) || null,
      buntHandoff:m.buntBallInPlayState || null, activeSituation:m.activeSituation || null,
      ballContext:m.ballContext, currentAssignment:m.currentAssignment,
      task:getHighSchoolDefensiveSituationText(m), observation:getHighSchoolDefensiveObservation(m),
      choices:getHighSchoolDefensiveMomentChoices(m), event};
  }
  function catcherBunt(bases) {
    const m = catcherFixture(bases);
    const opts = {tacticalActionOverride:"surpriseBunt", buntPitchOptions:{
      actualPitch:{pitchLocationClass:"competitiveStrike", strike:true},
      recognition:{correct:true, perceivedPitchClass:"competitiveStrike"},
      rolls:{attempt:0, preparation:0, contact:.99, fairBallType:.9, pace:.99, placement:.51}}};
    const pitch = prepareHighSchoolDefensiveMomentFromSimulation(m, opts);
    m.presentedEventCursor = m.simulationLog.length;
    const before = catcherWorld(m);
    const event = prepareHighSchoolDefensiveMomentFromSimulation(m, opts);
    return {...catcherSnapshot(m, event), pitch, worldUnchanged:before === catcherWorld(m)};
  }
  function catcherBlocked(bases) {
    const m = catcherFixture(bases);
    m.currentDomain = "defense"; m.momentIndex = 1;
    m.currentMomentId = highSchoolYearOneMomentIds[1]; m.simulationPhase = "moment_2_ready";
    setHighSchoolDefensiveBallContext(m);
    m.currentAssignment = getHighSchoolDefensiveSituationText(m);
    return catcherSnapshot(m);
  }
`);
const evidence = h.json(`({kind:"controlled Node/VM reproduction; not live page evidence",
  buntEmpty:catcherBunt([]), buntOccupied:catcherBunt([true,false,false]),
  blockedEmpty:catcherBlocked([]), blockedOccupied:catcherBlocked([false,true,false])})`);
const output = process.argv.find(arg => arg.startsWith("--evidence="))?.slice("--evidence=".length);
if (output) fs.writeFileSync(output, JSON.stringify(evidence, null, 2) + "\n");
if (process.argv.includes("--capture-only")) {
  console.log("Captured controlled catcher event evidence");
  process.exit(0);
}
let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed++; console.log(`✓ ${name}`); }
for (const name of ["buntEmpty", "buntOccupied"]) {
  const x = evidence[name];
  verify(`${name}: same PA preserves fair second-base-side bunt truth`,
    x.sourcePitch.buntResolution.contactResult === "fairContact" &&
    x.sourcePitch.buntResolution.placement === "secondBaseSide" &&
    x.buntHandoff.identity.startsWith(x.paIdentity));
  verify(`${name}: catcher never admitted as second baseman`,
    x.buntHandoff.defensiveAccess.playerPosition === "捕手" && !x.buntHandoff.supported);
  verify(`${name}: existing unsupported fallback replaces false catcher decision`,
    x.event.type === "buntDefensiveFallback" && x.activeSituation === null &&
    x.event.assignment.includes("二壘手") && !x.event.assignment.includes("提前落地") &&
    x.choices.length === 0 && x.observation === null);
  verify(`${name}: source, task and observation retain bunt context`,
    x.ballContext.sourceFamily === "bunt" && x.task.includes("短打") &&
    !x.task.includes("變化球") && !x.task.includes("同時離壘") &&
    x.currentAssignment === x.event.assignment);
  verify(`${name}: official bases, count of outs, batter, order and RNG unchanged`, x.worldUnchanged);
}
for (const name of ["blockedEmpty", "blockedOccupied"]) {
  const x = evidence[name];
  verify(`${name}: task and observation describe the same blocked pitch`,
    x.ballContext.type === "blockedPitch" && x.observation.ballContext.type === "blockedPitch" &&
    x.task.includes("變化球提前落地") && !JSON.stringify(x.observation).includes("短打"));
  verify(`${name}: all offered routes are catcher pitch routes`,
    x.choices.length === 3 && x.choices.every(c => c.catcherIntent && c.routeId === c.catcherIntent));
}
verify("empty bases have no phantom runner or batter-runner cue",
  !/跑者|離壘/.test(evidence.blockedEmpty.task + JSON.stringify(evidence.blockedEmpty.observation.cues) +
    evidence.blockedEmpty.choices.map(c => c.text).join("")) &&
  evidence.blockedEmpty.choices.some(c => c.catcherIntent === "secureAndReset"));
verify("occupied bases retain actual runner and legal throw route",
  evidence.blockedOccupied.observation.runners.length === 1 &&
  evidence.blockedOccupied.observation.runners[0].base === 2 &&
  evidence.blockedOccupied.choices.some(c => c.catcherIntent === "attemptLeadRunnerOut") &&
  !evidence.blockedOccupied.choices.some(c => c.catcherIntent === "attemptHomeOut"));
verify("non-pitch ball rejects catcher block route before RNG or any state mutation", h.run(`(() => {
  const m = catcherFixture(); m.currentDomain = "defense";
  setHighSchoolDefensiveBallContext(m, "normalGrounder");
  const before = JSON.stringify(m); let samples = 0;
  const result = resolveHighSchoolCatcherDecision(m, "secureAndReset", () => {samples++; return .5;});
  return result === null && samples === 0 && before === JSON.stringify(m);
})()`));
verify("getters and save/load preserve same PA source, world state and choices", h.run(`(() => {
  const m = catcherFixture([false,true,false]); m.currentDomain = "defense";
  setHighSchoolDefensiveBallContext(m); m.currentAssignment = getHighSchoolDefensiveSituationText(m);
  const before = JSON.stringify(m), world = catcherWorld(m);
  getHighSchoolDefensiveSituationText(m); getHighSchoolDefensiveObservation(m); getHighSchoolDefensiveMomentChoices(m);
  if (before !== JSON.stringify(m)) return false;
  const restored = normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;
  return world === catcherWorld(restored) && restored.ballContext.type === "blockedPitch" &&
    JSON.stringify(getHighSchoolDefensiveMomentChoices(m)) === JSON.stringify(getHighSchoolDefensiveMomentChoices(restored));
})()`));
verify("same PA handoff keeps physical truth when correcting a cached wrong position", h.run(`(() => {
  catcherBunt([]);
  const active = player.highSchoolMatch;
  const truth = JSON.stringify(active.offensiveBuntPAState), world = catcherWorld(active);
  const wrong = JSON.parse(JSON.stringify(active.buntBallInPlayState));
  wrong.defensiveAccess.playerPosition = "二壘手";
  active.buntBallInPlayState = wrong;
  const corrected = ensureHighSchoolBuntBallInPlayHandoff(active);
  return corrected.identity === wrong.identity && corrected.defensiveAccess.playerPosition === "捕手" &&
    !corrected.supported && JSON.stringify(active.offensiveBuntPAState) === truth && world === catcherWorld(active);
})()`));
verify("legacy mismatched defense view retains bunt clues and rejects all pitch routes", h.run(`(() => {
  catcherBunt([]); const m = player.highSchoolMatch;
  m.currentDomain = "defense"; m.momentIndex = 1; m.simulationPhase = "moment_2_ready";
  m.currentAssignment = getHighSchoolDefensiveSituationText(m);
  const before = JSON.stringify(m), cues = getHighSchoolDefensiveObservation(m);
  return cues.ballContext.sourceFamily === "bunt" && cues.ballContext.detail.includes("二壘手") &&
    m.currentAssignment.includes("短打") && getHighSchoolDefensiveMomentChoices(m).length === 0 &&
    resolveHighSchoolCatcherDecision(m, "secureAndReset", () => {throw new Error("must reject before RNG");}) === null &&
    before === JSON.stringify(m);
})()`));
verify("pending activeSituation still blocks event preparation without mutation", h.run(`(() => {
  const m = catcherFixture();
  const created = MatchSituationLifecycle.createSituation({gameId:m.id, inning:m.inning, half:m.half,
    paIdentity:createHighSchoolOffensiveTacticalIdentity(m), simulationPoint:"catcher-guard",
    type:"groundBallDefensiveDecision", legalRoutes:[
      {routeId:"secureFirst", matchDecision:"secure"}, {routeId:"controlledNoThrow", matchDecision:"hold"}]});
  m.activeSituation = MatchSituationLifecycle.presentSituation(
    MatchSituationLifecycle.admitSituation(created, {supported:true, playerOwnsDecision:true}));
  const before = JSON.stringify(m);
  return prepareHighSchoolDefensiveMomentFromSimulation(m) === null && before === JSON.stringify(m);
})()`));
console.log(`Catcher event context consistency: ${passed}/${passed} passed`);
