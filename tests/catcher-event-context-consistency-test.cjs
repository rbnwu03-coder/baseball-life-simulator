"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createContext } = require("./helpers/canonical-match-contract-context.cjs");
const h = createContext();
h.run(`
  function catcherFixture(bases = [], outs = 0) {
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
      inning:3, half:"上", outs, offenseTeam:"away", defenseTeam:"home",
      currentDomain:"flow", simulationPhase:"moment_1_resolved", momentIndex:0,
      currentMomentId:highSchoolYearOneMomentIds[0], playerEntryCompleted:true,
      playerLineupStatus:"starter", runners:[null,null,null]});
    bases.forEach((occupied, i) => { if (occupied) m.runners[i] = m.rosters.away.lineup[8-i].id; });
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
  function catcherBunt(bases, rolls = {}, outs = 0) {
    const m = catcherFixture(bases, outs);
    const opts = {tacticalActionOverride:"surpriseBunt", buntPitchOptions:{
      actualPitch:{pitchLocationClass:"competitiveStrike", strike:true},
      recognition:{correct:true, perceivedPitchClass:"competitiveStrike"},
      rolls:{attempt:0, preparation:0, contact:.99, fairBallType:.9, pace:.99, placement:.51, ...rolls}}};
    const pitch = prepareHighSchoolDefensiveMomentFromSimulation(m, opts);
    for (let i = 0; getHighSchoolPresentedEventCursor(m) <= pitch.sequence; i++) {
      if (i >= 100) throw new Error("Bunt pitch playback did not finish");
      advanceHighSchoolMatchPlaybackStep(m);
    }
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
  function catcherReadyForNpc(bases = [], rolls = {}, outs = 0) {
    const fixture = catcherBunt(bases, rolls, outs), m = player.highSchoolMatch;
    for (let i = 0; getHighSchoolPresentedEventCursor(m) <= fixture.event.sequence; i++) {
      if (i >= 100) throw new Error("Fallback presentation stalled");
      advanceHighSchoolMatchPlaybackStep(m);
    }
    return m;
  }
  function catcherContinuation(bases, reload) {
    const fixture = catcherBunt(bases);
    let m = player.highSchoolMatch;
    const team = m.offenseTeam, batter = m.currentBatter, slot = m.battingOrderIndex[team];
    const nextBatter = getHighSchoolMatchNextLineupBatter(m, team).id;
    const source = JSON.stringify(m.offensiveBuntPAState);
    const handoff = JSON.stringify(m.buntBallInPlayState);
    const recordPA = () => m.gameRecord.playerLines[batter]?.batting.PA || 0;
    const beforePA = recordPA(), beforeRefs = m.gameRecord.eventRefs.length;
    const startLog = m.simulationLog.length;
    for (let i = 0; getHighSchoolPresentedEventCursor(m) <= fixture.event.sequence; i++) {
      if (i >= 100) throw new Error("Fallback playback did not finish");
      advanceHighSchoolMatchPlaybackStep(m);
    }
    const presented = getHighSchoolPresentedEventCursor(m) > fixture.event.sequence;
    let saveLoad = null;
    if (reload) {
      const world = catcherWorld(m);
      saveGame();
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) throw new Error("Fallback save was not admitted");
      player = createInitialPlayer();
      loadGame();
      m = player.highSchoolMatch;
      saveLoad = {restored:m.id === fixture.matchId, worldUnchanged:world === catcherWorld(m),
        sourceUnchanged:source === JSON.stringify(m.offensiveBuntPAState),
        handoffUnchanged:handoff === JSON.stringify(m.buntBallInPlayState)};
    }
    const beforeResume = {world:catcherWorld(m), source:JSON.stringify(m.offensiveBuntPAState),
      record:JSON.stringify(m.gameRecord)};
    const steps = [];
    for (let i = 0; i < 100 && m.battingOrderIndex[team] === slot; i++) {
      const cursor = m.simulationCursor, events = m.simulationLog.length;
      try {
        const result = advanceHighSchoolMatchPlaybackStep(m);
        steps.push({result, cursorBefore:cursor, cursorAfter:m.simulationCursor,
          events:m.simulationLog.slice(events), phase:m.simulationPhase, domain:m.currentDomain});
        if (result === false || result === "decision") break;
      } catch (error) {
        steps.push({error:error.message, cursorBefore:cursor, cursorAfter:m.simulationCursor,
          events:m.simulationLog.slice(events)});
        break;
      }
    }
    const events = m.simulationLog.slice(startLog);
    const paEvents = events.filter(e => e.type === "plateAppearance" && e.batterId === batter);
    const receipt = m.buntBallInPlayState.npcSettlement || null;
    const sourceHandoff = JSON.parse(JSON.stringify(m.buntBallInPlayState)); delete sourceHandoff.npcSettlement;
    return {bases, reload, presented, saveLoad, matchId:m.id, paIdentity:fixture.paIdentity,
      batter, nextBatter, slotBefore:slot, slotAfter:m.battingOrderIndex[team], currentBatter:m.currentBatter,
      sourcePitch:fixture.sourcePitch, sourcePreserved:source === JSON.stringify(m.offensiveBuntPAState),
      handoffPreserved:handoff === JSON.stringify(sourceHandoff), steps, paEvents, receipt,
      officialPAIncrement:recordPA() - beforePA,
      newRecordRefs:m.gameRecord.eventRefs.slice(beforeRefs),
      recordIntegrity:MatchGameRecord.assertIntegrity(m.gameRecord),
      noUnsafeMutation:beforeResume.world === catcherWorld(m) &&
        beforeResume.source === JSON.stringify(m.offensiveBuntPAState) &&
        beforeResume.record === JSON.stringify(m.gameRecord),
      completionPassed:paEvents.length === 1 && recordPA() - beforePA === 1 &&
        m.gameRecord.eventRefs.slice(beforeRefs).filter(e => e.type === "plateAppearance").length === 1 &&
        m.battingOrderIndex[team] === (slot + 1) % 9 && m.currentBatter === nextBatter &&
        paEvents[0].sourceAuthority === "offensiveBuntPAState.pitchHistory" &&
        paEvents[0].buntPAIdentity === fixture.paIdentity &&
        !paEvents[0].compressedOutcomeTrace && source === JSON.stringify(m.offensiveBuntPAState)};
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
let failed = 0;
function verify(name, condition) { assert.ok(condition, name); passed++; console.log(`✓ ${name}`); }
if (!process.argv.includes("--continuation-only")) {
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
  verify(`${name}: fallback uses known ball, placement and pending state only`,
    !/垂直切片|本階段|尚未納入|fallback|unsupported/i.test(x.currentAssignment + x.ballContext.detail) &&
    x.currentAssignment.includes("往二壘手一側滾動") && x.currentAssignment.includes("尚未完成"));
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
}
if (!process.argv.includes("--context-only")) {
  const continuation = h.json(`[
    catcherContinuation([],false), catcherContinuation([true,false,false],false),
    catcherContinuation([],true), catcherContinuation([true,false,false],true)
  ]`);
  const target = process.argv.find(arg => arg.startsWith("--continuation-evidence="))?.slice("--continuation-evidence=".length);
  if (target) fs.writeFileSync(target, JSON.stringify(continuation, null, 2) + "\n");
  for (const x of continuation) {
    const name = `fallback continuation: ${x.bases.some(Boolean) ? "occupied" : "empty"}, reload=${x.reload}`;
    if (process.argv.includes("--capture-continuation-only")) {
      console.log(JSON.stringify({name, completionPassed:x.completionPassed,
        observedResults:x.paEvents.map(e => ({result:e.result, authority:e.outcomeAuthority})),
        blocker:x.steps.at(-1)?.error || null, officialPAIncrement:x.officialPAIncrement, saveLoad:x.saveLoad}));
    } else {
      verify(`${name}: original ball, roster actors and once-only record retained`,
        x.presented && (!x.reload || Object.values(x.saveLoad).every(Boolean)) &&
        x.sourcePreserved && x.handoffPreserved && x.receipt?.status === "committed" &&
        x.receipt.execution.primaryId !== "player" && x.receipt.execution.receiverId !== "player" &&
        x.receipt.execution.rng.cursorAfter === x.receipt.execution.rng.cursorBefore + 1 &&
        x.newRecordRefs.filter(e => e.type === "defensivePlay").length === 1 &&
        x.paEvents[0]?.outcomeAuthority === "npc-ground-bunt-settlement-v1" && x.recordIntegrity);
      try { verify(name, x.presented && (!x.reload || Object.values(x.saveLoad).every(Boolean)) && x.completionPassed); }
      catch (error) { failed++; console.error(`FAIL ${name}: same bunt PA not completed by its settlement owner`); }
    }
  }
  if (failed) process.exitCode = 1;
}
if (!process.argv.includes("--capture-continuation-only")) {
verify("compressed PA entry also rejects an unsettled bunt before RNG and mutation", h.run(`(() => {
  catcherBunt([]); const m = player.highSchoolMatch;
  const before = JSON.stringify(m); let calls = 0, error = "";
  try { resolveSimulatedHighSchoolPlateAppearance(m, () => {calls++; return .5;}); }
  catch (e) { error = e.message; }
  return error === "BUNT_FALLBACK_SETTLEMENT_OWNER_MISSING" && calls === 0 && before === JSON.stringify(m);
})()`));
verify("unsupported placement and pop-bunt clues contain no development terminology", h.run(`(() => {
  const base = {contactResult:"fairContact", fairBallType:"groundBunt", pace:"hard"};
  return ["firstBaseSide", "thirdBaseSide", "pitcherArea"].every(placement => {
    const ball = OffensiveBuntDefensiveHandoff.buildDefensiveBallContext({...base, placement}, {playerPosition:"捕手"});
    return !/本階段|納入|切片/.test(ball.detail) && ball.detail.includes("滾動");
  }) && OffensiveBuntDefensiveHandoff.buildDefensiveBallContext({...base, fairBallType:"popBunt"},
    {playerPosition:"捕手"}).detail === "短打形成小飛球，接球結果尚未確定。";
})()`));
verify("NPC settlement and formal Save/Load are idempotent without consuming RNG", h.run(`(() => {
  let m = catcherReadyForNpc([true,false,false]);
  const contribution = JSON.stringify(m.playerContribution), moments = JSON.stringify(m.completedMoments);
  advanceHighSchoolMatchPlaybackStep(m);
  const receipt = JSON.stringify(getHighSchoolNpcGroundBuntReceipt(m)), before = JSON.stringify(m);
  if (settleHighSchoolNpcGroundBunt(m) !== null || settleHighSchoolNpcGroundBunt(m) !== null || before !== JSON.stringify(m)) return false;
  saveGame(); player = createInitialPlayer(); loadGame(); m = player.highSchoolMatch;
  const restored = JSON.stringify(m);
  return receipt === JSON.stringify(getHighSchoolNpcGroundBuntReceipt(m)) && settleHighSchoolNpcGroundBunt(m) === null &&
    restored === JSON.stringify(m) && contribution === JSON.stringify(m.playerContribution) && moments === JSON.stringify(m.completedMoments);
})()`));
verify("NPC roster fielding and receiver capabilities affect execution; catcher abilities do not", h.run(`(() => {
  function resolve(defense, arm, receiverDefense, playerStrength) {
    const m = catcherReadyForNpc([true,false,false]);
    // A shared deterministic execution input isolates capability differences.
    m.simulationSeed = 1; m.simulationCursor = 0;
    const primary = m.rosters.home.lineup.find(a => a.id === TeamRosterFoundation.getCurrentDefender(m.rosters.home, "2B").id);
    const receiver = TeamRosterFoundation.getCurrentDefender(m.rosters.home, "1B");
    m.rosters.home.lineup = m.rosters.home.lineup.map(a => a.id === primary.id ? {...a,defense,arm}
      : a.id === receiver.id ? {...a,defense:receiverDefense} : a);
    Object.keys(player.baseballSkills).forEach(k => player.baseballSkills[k] = playerStrength);
    player.ballSense = player.observe = player.fitness = playerStrength;
    const source = JSON.stringify(m.offensiveBuntPAState), roster = JSON.stringify(m.rosters), position = m.position;
    settleHighSchoolNpcGroundBunt(m);
    const r = getHighSchoolNpcGroundBuntReceipt(m);
    return {result:r.result, execution:r.execution, source:source === JSON.stringify(m.offensiveBuntPAState),
      unchanged:roster === JSON.stringify(m.rosters) && position === m.position && m.currentFieldingPosition === "捕手",
      actualActions:r.actionFacts.actions.every(a => a.actorId !== "player"),
      credit:m.gameRecord.playerLines[primary.id].defense.A};
  }
  const strong = resolve(10,10,10,1), sameNpc = resolve(10,10,10,99), weak = resolve(1,1,10,99), missed = resolve(10,10,1,99);
  return strong.result === "out" && strong.credit === 1 && weak.result === "single" && missed.result === "single" &&
    JSON.stringify(strong.execution) === JSON.stringify(sameNpc.execution) &&
    [strong,sameNpc,weak,missed].every(x => x.source && x.unchanged && x.actualActions);
})()`));
verify("all forced runners and third-out scoring use the canonical settlement", h.run(`(() => {
  return [0,2].every(outs => {
    const m = catcherReadyForNpc([true,true,true], {}, outs), original = m.runners.slice();
    const primary = TeamRosterFoundation.getCurrentDefender(m.rosters.home, "2B"), receiver = TeamRosterFoundation.getCurrentDefender(m.rosters.home, "1B");
    m.rosters.home.lineup = m.rosters.home.lineup.map(a => a.id === primary.id ? {...a,defense:10,arm:10}
      : a.id === receiver.id ? {...a,defense:10} : a);
    const score = m.scores.away; settleHighSchoolNpcGroundBunt(m);
    const receipt = getHighSchoolNpcGroundBuntReceipt(m), third = receipt.settlement.thirdOut;
    return receipt.result === "out" && (outs === 2
      ? m.outs === 3 && m.scores.away === score && m.runners.every(x => !x) && third.thirdOutType === "batterRunnerBeforeFirst"
      : m.outs === 1 && m.scores.away === score + 1 && m.runners[1] === original[0] && m.runners[2] === original[1]);
  });
})()`));
verify("unsupported bunt shapes retain their explicit pre-RNG continuation boundary", h.run(`(() => {
  return [{placement:.01}, {placement:.99}, {fairBallType:.01}, {pace:.01}].every(rolls => {
    const m = catcherReadyForNpc([], rolls), before = JSON.stringify(m); let error = "";
    try { advanceHighSchoolMatchPlaybackStep(m); } catch(e) { error = e.message; }
    return error === "BUNT_FALLBACK_SETTLEMENT_OWNER_MISSING" && before === JSON.stringify(m);
  });
})()`));
verify("pending situation and stale base or score reject before NPC execution or mutation", h.run(`(() => {
  const m = catcherReadyForNpc();
  const created = MatchSituationLifecycle.createSituation({gameId:m.id, inning:m.inning, half:m.half,
    paIdentity:createHighSchoolOffensiveTacticalIdentity(m), simulationPoint:"npc-guard", type:"groundBallDefensiveDecision",
    legalRoutes:[{routeId:"secureFirst",matchDecision:"secure"},{routeId:"controlledNoThrow",matchDecision:"hold"}]});
  m.activeSituation = MatchSituationLifecycle.presentSituation(MatchSituationLifecycle.admitSituation(created,{supported:true,playerOwnsDecision:true}));
  const before = JSON.stringify(m);
  if (advanceHighSchoolMatchPlaybackStep(m) !== "decision" || settleHighSchoolNpcGroundBunt(m) !== null || before !== JSON.stringify(m)) return false;
  return ["runners", "score"].every(kind => {
    const x = catcherReadyForNpc(); if(kind === "runners") x.runners[1] = x.rosters.away.lineup[2].id; else x.scores.away++;
    const initial = JSON.stringify(x); let error = "";
    try { settleHighSchoolNpcGroundBunt(x); } catch(e) {error = e.message;}
    return error === "BUNT_NPC_STALE_SOURCE_OR_ACTOR" && initial === JSON.stringify(x);
  });
})()`));
verify("missing or corrupt settlement receipt cannot produce a second official PA", h.run(`(() => {
  return ["missing", "corrupt"].every(kind => {
    const m = catcherReadyForNpc(); settleHighSchoolNpcGroundBunt(m);
    m.buntBallInPlayState = JSON.parse(JSON.stringify(m.buntBallInPlayState));
    if(kind === "missing") delete m.buntBallInPlayState.npcSettlement; else m.buntBallInPlayState.npcSettlement.paEventId = "wrong";
    const before = JSON.stringify(m); let error = "";
    try { settleHighSchoolNpcGroundBunt(m); } catch(e) {error = e.message;}
    return error === "BUNT_NPC_PARTIAL_OR_CORRUPT_RECEIPT" && before === JSON.stringify(m);
  });
})()`));
verify("NPC settlement is visible and its receipt survives next-PA handoff cleanup and Save/Load", h.run(`(() => {
  let m = catcherReadyForNpc(); const event = settleHighSchoolNpcGroundBunt(m);
  const receipt = JSON.stringify(event.settlementReceipt), id = event.eventId;
  const feed = formatMatchSimulationEvent(event, m);
  if (!feed.text.includes("二壘手") || !feed.text.includes("打席已結束，輪到下一棒") || feed.playerRelated) return false;
  prepareHighSchoolOffensiveTacticalAction(m, {tacticalActionOverride:"standardAttack"});
  if(m.buntBallInPlayState !== null) return false;
  saveGame(); player=createInitialPlayer(); loadGame(); m=player.highSchoolMatch;
  return receipt === JSON.stringify(m.simulationLog.find(e=>e.eventId===id).settlementReceipt) &&
    m.gameRecord.eventRefs.filter(e=>e.eventId===id).length===1 && MatchGameRecord.assertIntegrity(m.gameRecord);
})()`));
console.log(`Catcher event context consistency: ${passed} passed, ${failed} failed`);
}
