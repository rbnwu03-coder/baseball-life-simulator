"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "../..");
const policy = Object.freeze({ seeds: Object.freeze([88221, 88222]), sample: 0.72, safety: 1400, invitationIndex: 0, decisions: "secure/zone/first legal" });
const sha256 = value => crypto.createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");

// Current index order, browser globals, memory UI; the UI boot controller is
// excluded as in the career VM. No production owner is wrapped or replaced.
function createContext() {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const files = [...index.matchAll(/<script src="([^"]+)"/g)].map(row => row[1]).filter(file => file !== "application-controller.js");
  const nodes = new Map(), storage = new Map();
  const classList = () => ({ add() {}, remove() {}, toggle() {}, contains() { return false; } });
  const context = vm.createContext({
    console: { log() {}, warn() {}, error: console.error },
    document: {
      body: { classList: classList() },
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, { id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false,
          classList: classList(), focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; } });
        return nodes.get(id);
      },
      querySelector() { return null; }, querySelectorAll() { return []; }
    },
    localStorage: { setItem(k, v) { storage.set(k, v); }, getItem(k) { return storage.get(k) || null; }, removeItem(k) { storage.delete(k); } },
    window: { setTimeout() { return 1; }, clearTimeout() {} }
  });
  const sourceHashes = { "index.html": sha256(Buffer.from(index)) };
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file)); sourceHashes[file] = sha256(source);
    vm.runInContext(source.toString("utf8"), context, { filename: file });
  }
  const run = source => vm.runInContext(source, context);
  const json = source => JSON.parse(run(`JSON.stringify(${source})`));
  return { context, files, sourceHashes, run, json };
}

function playCanonicalMatch(seed) {
  if (!policy.seeds.includes(seed)) throw new Error("Only the two reviewed regression seeds are supported");
  const h = createContext(); h.context.contractSeed = seed;
  h.run(`
    function contractCopy(value) { return JSON.parse(JSON.stringify(value)); }
    function contractAbilities(p = player) {
      return {baseballSkills:p.baseballSkills,ballSense:p.ballSense,observe:p.observe,fitness:p.fitness,
        instinct:p.instinct,discipline:p.discipline,pressure:p.pressure,body:p.body,
        baseballExperience:p.baseballExperience,capabilityState:p.capabilityState};
    }
    function contractState() {
      const side = getHighSchoolPlayerTeamSide(m), roster = m.rosters[side];
      return {inning:m.inning,half:m.half,outs:m.outs,scores:{...m.scores},runners:m.runners.slice(),
        phase:m.simulationPhase,domain:m.currentDomain,currentMomentId:m.currentMomentId,
        playerSide:side,offenseTeam:m.offenseTeam,currentBatter:m.currentBatter,
        actualBatter:getHighSchoolMatchLineupBatter(m,m.offenseTeam)?.id,
        status:m.playerLineupStatus,entryCompleted:m.playerEntryCompleted,slot:m.playerLineupSlot,
        assignment:m.playerFieldingAssignment,playerInLineup:roster.lineup.some(a=>a.id==='player'),
        playerOnBench:roster.bench.some(a=>a.id==='player'),actualSS:TeamRosterFoundation.getCurrentDefender(roster,'SS')?.id,
        completedIds:m.completedMoments.map(x=>x.id),logCount:m.simulationLog.length,
        integrity:getHighSchoolMatchStateIntegrityIssues(m)};
    }
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome = null; isTransitioning = false;
    player = createInitialPlayer('2.2.2 測試球員');
    applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player, {originType:'test-fixture'});
    applyCanonicalPositionProfile(player, '內野手', ['外野手']);
    globalThis.contractOriginalAbilities = JSON.stringify(contractAbilities());
    applyCanonicalPositionProfile(player, '游擊手', ['外野手']);
    globalThis.contractInvitations = generateSchoolInvitationSet(player);
    globalThis.contractSchool = contractInvitations.invitations[0];
    globalThis.contractSelection = finalizeSchoolInvitationSelection(player, contractSchool.schoolId);
    globalThis.contractEntered = completeHighSchoolEntry({source:'b1-normal-entry-proof'});
    player.highSchoolStep = 5; applyHighSchoolRoleState('starter');
    pendingHighSchoolMatchSimulationSeed = contractSeed;
    globalThis.contractFixture = contractCopy(player);
    globalThis.m = prepareHighSchoolYearOneMatch();
    globalThis.contractInitial = contractCopy(m);
    globalThis.contractEntry = {accepted:contractEntered,selection:contractSelection,schoolId:contractSchool.schoolId,
      invitationIndex:0,age:player.age,primaryPosition:player.primaryPosition,
      invitationValidation:validateSchoolInvitationSet(player.schoolInvitationState),
      capabilityValidation:validateHighSchoolEntryCapability(player),
      abilitiesUnchanged:contractOriginalAbilities===JSON.stringify(contractAbilities()),
      pendingSeedAfterPrepare:pendingHighSchoolMatchSimulationSeed,
      globals:{playingTime:typeof PlayingTimeGameExposure,roster:typeof TeamRosterFoundation,
        entryRoster:typeof HighSchoolEntryRosterContext,record:typeof MatchGameRecord},initialState:contractState()};
    globalThis.contractSteps = []; globalThis.contractDecisions = []; globalThis.contractDuplicates = [];
    globalThis.contractSafety = 0;
    while (!m.completed && contractSafety < 1400) {
      contractSafety += 1;
      const before = contractState(), logBefore = m.simulationLog.length, countBefore = m.completedMoments.length;
      const visible = isHighSchoolMatchDecisionVisible(m), row = {tick:contractSafety,mode:visible?'decision':'playback',before};
      if (visible) {
        const choices = getHighSchoolYearOneMatchMomentChoices(m);
        const choice = choices.find(c=>c.matchDecision==='secure'||c.matchDecision==='zone') || choices[0];
        if (!choice) throw new Error('No legal choice under reviewed policy');
        const d = {tick:contractSafety,before:contractCopy(before),legalChoices:contractCopy(choices),choice:contractCopy(choice),sample:0.72};
        d.returned = resolveHighSchoolYearOneMatch(choice.matchDecision, choice.matchMomentId, ()=>0.72);
        d.after = contractState(); d.newEvents = contractCopy(m.simulationLog.slice(logBefore));
        d.newCompleted = contractCopy(m.completedMoments.slice(countBefore)); contractDecisions.push(d);
        const unchanged = JSON.stringify(player);
        const duplicate = resolveHighSchoolYearOneMatch(choice.matchDecision, choice.matchMomentId, ()=>0.72);
        contractDuplicates.push({momentId:choice.matchMomentId,decision:choice.matchDecision,returned:duplicate,fullPlayerUnchanged:unchanged===JSON.stringify(player)});
      } else advanceHighSchoolMatchPlaybackStep(m);
      row.after = contractState(); row.newEvents = contractCopy(m.simulationLog.slice(logBefore)); contractSteps.push(row);
    }
    globalThis.contractFinalPlayer = contractCopy(player); globalThis.contractFinalState = contractState();
    globalThis.contractCore = JSON.stringify(player);
    globalThis.contractRepeats = [settleHighSchoolYearOneMatch(m,'zone'),settleHighSchoolYearOneMatch(m,'zone'),finishHighSchoolMatchBySimulation(m)];
    globalThis.contractRepeatUnchanged = contractCore===JSON.stringify(player);
    globalThis.contractRestored = normalizeSave(contractCopy(player));
    globalThis.contractRecordIntegrity = MatchGameRecord.assertIntegrity(m.gameRecord);
    globalThis.contractSaveRecordIntegrity = MatchGameRecord.assertIntegrity(contractRestored.highSchoolMatch.gameRecord);
    globalThis.contractActualExposure = deriveHighSchoolMatchActualExposure(m);
    globalThis.contractCallHome = getHighSchoolCallHomePresentation();
    // Consumer-only negative copies, never installed into the real Match.
    globalThis.contractPressureFallbacks = ['missing','stale'].map(kind => {
      const moments = m.completedMoments.map(moment => ({...moment,batterAnticipation:kind==='missing'?null:
        {...moment.batterAnticipation,identity:'different-pa'}}));
      return {kind,evidence:MatchExperienceDevelopment.deriveMatchExperienceEvidence({...m,completedMoments:moments})
        .filter(item=>item.evidenceType==='active'&&item.role==='batter')};
    });
    globalThis.contractReadUnchanged = contractCore===JSON.stringify(player);
  `);
  const facts = h.json(`({seed:contractSeed,entry:contractEntry,fixture:contractFixture,initialMatch:contractInitial,
    steps:contractSteps,decisions:contractDecisions,duplicates:contractDuplicates,safety:contractSafety,
    finalState:contractFinalState,finalMatch:m,finalPlayer:contractFinalPlayer,restored:contractRestored,
    recordIntegrity:contractRecordIntegrity,saveRecordIntegrity:contractSaveRecordIntegrity,
    actualExposure:contractActualExposure,repeatedSettlement:{returns:contractRepeats,fullPlayerUnchanged:contractRepeatUnchanged},
    callHome:contractCallHome,pressureFallbacks:contractPressureFallbacks,
    readsUnchanged:contractReadUnchanged,browserGlobals:typeof module==='undefined'&&typeof require==='undefined'})`);
  facts.hashes = { fixture: sha256(facts.fixture), initialMatch: sha256(facts.initialMatch), record: sha256(facts.finalMatch.gameRecord),
    log: sha256(facts.finalMatch.simulationLog), decisionSequence: sha256(facts.decisions) };
  facts.sources = { files: h.files, hashes: h.sourceHashes };
  // Read-only copies distinguish decision time, result time and final summary.
  facts.snapshots = { status: "RESOLUTION SNAPSHOT CONTRACT", decisions: facts.decisions.map(d=>({
    id:d.choice.matchMomentId,decisionBefore:d.before,resultAfter:d.after,resolutionMoments:d.newCompleted,
    finalCompletedMoment:facts.finalMatch.completedMoments.find(x=>x.id===d.choice.matchMomentId)
  })), finalSummary: { inning:facts.finalMatch.inning,half:facts.finalMatch.half,outs:facts.finalMatch.outs,
    scores:facts.finalMatch.scores,runners:facts.finalMatch.runners,recordResult:facts.finalMatch.gameRecord.result } };
  return facts;
}
module.exports = { root, policy, sha256, createContext, playCanonicalMatch };
