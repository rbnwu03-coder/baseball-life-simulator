'use strict';
const assert = require('node:assert/strict');
const { discover } = require('./match-m0-after-r2-admission-context.cjs');
const POLICY = Object.freeze({ seed: 440000, boundedSteps: 500, recognitionRoll: 0, timingRoll: 0, batToBallRoll: 0, foulRoll: 1,
  physicalRolls: Object.freeze({ quality: 0.5, ballType: 0, pace: 0.5, direction: 0.15, depth: 0.5 }),
  defenseSamples: Object.freeze({ reach: 0.5, secure: 0.5, strength: 0.5, accuracy: 0.5, receive: 0.5 }) });
function admitted() {
  const { h, row } = discover(POLICY.seed, { observe: false });
  assert(row.matchReached && !row.error, 'normal career admission');
  let steps = 0;
  while (!h.run('player.highSchoolMatch.pendingOffensiveOpportunity?.status === "pending"') && steps++ < POLICY.boundedSteps) {
    if (h.run('!!pendingYouthSeasonOutcome')) h.run('continueYouthSeasonOutcome()');
    else if (h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)')) break;
    else assert(h.run('__runNextTimer()'), 'pending normal playback');
  }
  h.run('stopHighSchoolMatchPlayback();');
  assert(h.run('player.highSchoolMatch.pendingOffensiveOpportunity?.status === "pending"'));
  return h;
}
function controlled(outs) {
  assert([0, 1, 2].includes(outs));
  const { h, row } = discover(POLICY.seed, { observe: false });
  assert(row.matchReached && !row.error);
  let transitionSteps = 0;
  while (h.run('isTransitioning') && transitionSteps++ < 50) assert(h.run('__runNextTimer()'), 'finish normal career UI transition before fixture');
  assert(!h.run('isTransitioning'));
  h.context.s1InitialOuts = outs;
  h.run(`
    stopHighSchoolMatchPlayback();
    var s1m=player.highSchoolMatch;
    if(s1m.simulationLog.some(e=>e.type==="plateAppearance"))throw Error("Fixture must precede generated PA events");
    var s1side=getHighSchoolPlayerTeamSide(s1m);
    s1m.rosters[s1side]=JSON.parse(JSON.stringify(s1m.rosters[s1side]));
    var s1lineup=s1m.rosters[s1side].lineup;
    var s1player=s1lineup.splice(s1lineup.findIndex(a=>a.id==="player"),1)[0];
    s1lineup.splice(s1InitialOuts,0,s1player);
    s1m.playerLineupSlot=s1InitialOuts;
    s1m.rosters[s1side].teamRoster.battingOrder=s1lineup.map((a,i)=>({battingOrder:i+1,playerId:a.id,defensivePosition:a.defensivePosition}));
    // Declared isolated bottom-half fixture. Prior ordinary outs are recorded
    // through existing owners before target PA admission or any pitch generation.
    s1m.inning=1;s1m.half=s1side==="home"?"下":"上";
    s1m.offenseTeam=s1side;s1m.defenseTeam=s1side==="home"?"away":"home";
    s1m.outs=0;s1m.runners=[null,null,null];s1m.battingOrderIndex[s1side]=0;
    for(var s1i=0;s1i<s1InitialOuts;s1i++){
      var s1b=getHighSchoolMatchLineupBatter(s1m,s1side);
      var s1before={inning:s1m.inning,half:s1m.half,outs:s1m.outs,runners:s1m.runners.slice(),scores:{...s1m.scores}};
      var s1facts=applyHighSchoolSimulatedPlateAppearance(s1m,"out",s1b.id,s1side);
      var s1after={inning:s1m.inning,half:s1m.half,outs:s1m.outs,runners:s1m.runners.slice(),scores:{...s1m.scores}};
      recordHighSchoolRoutinePlateAppearance(s1m,s1b.id,"out",s1before,s1after,0,s1facts);
      advanceHighSchoolMatchBattingOrder(s1m,s1side);
    }
    s1m.currentBatter=getHighSchoolMatchLineupBatter(s1m,s1side).id;
    syncHighSchoolMatchPlayerRunnerLocation(s1m);
  `);
  let steps = 0;
  while (!h.run('player.highSchoolMatch.pendingOffensiveOpportunity?.status === "pending"') && steps++ < POLICY.boundedSteps)
    assert(h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)'));
  assert(h.run('player.highSchoolMatch.pendingOffensiveOpportunity?.status === "pending"'));
  assert.equal(h.run('player.highSchoolMatch.outs'), outs);
  assert.deepEqual(h.json('player.highSchoolMatch.runners'), [null, null, null]);
  assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'), []);
  assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'), []);
  return h;
}
function prepare(h, { control } = {}) {
  h.context.s1Control = control;
  h.run(`
    player.highSchoolMatch.pendingOffensiveOpportunity.sameBallExecution={enabled:true,mode:"controlled"};
    player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]=JSON.parse(JSON.stringify(player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]));
    var s1Pitcher=getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,"P");
    if(s1Control!==undefined)s1Pitcher.pitchingProfile.control=s1Control;
    var s1Choice=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch)[0];
  `);
  assert(h.run('chooseHighSchoolYearOneMatchMoment(s1Choice.matchDecision,s1Choice.matchMomentId)'));
  return h.json('player.highSchoolMatch.offensivePlateAppearanceState');
}
function injectSamples(h, extra = {}) {
  h.context.s1DeclaredOptions = { recognitionRoll: POLICY.recognitionRoll, timingRoll: POLICY.timingRoll, batToBallRoll: POLICY.batToBallRoll,
    foulRoll: POLICY.foulRoll, physicalRolls: POLICY.physicalRolls, sameBallSamples: POLICY.defenseSamples, ...extra };
  h.run(`
    var s1OriginalPitchHandler=resolveHighSchoolPlateDecisionPitch;
    resolveHighSchoolPlateDecisionPitch=function(match,route,options={}){
      return s1OriginalPitchHandler(match,route,{...options,...s1DeclaredOptions});
    };
  `);
}
function hold(h) {
  h.context.s1HeldOptions = { ...POLICY, physicalRolls: POLICY.physicalRolls };
  h.run(`
    var s1HeldResult=PlateDecisionFoundation.resolve({situation:player.highSchoolMatch.activeSituation,
      plateAppearanceState:player.highSchoolMatch.offensivePlateAppearanceState,routeId:"contactSwing",
      recognition:player.highSchoolMatch.plateDecisionState.recognition,
      abilities:getHighSchoolOffensivePlateApproachAbilities(player),executionOptions:s1HeldOptions},
      createHighSchoolSameBallResolver(player.highSchoolMatch,player.highSchoolMatch.offensivePlateAppearanceState));
    player.highSchoolMatch.offensivePlateAppearanceState=JSON.parse(JSON.stringify(s1HeldResult.plateAppearanceState));
    player.highSchoolMatch.activeSituation=null;
  `);
}
function runStageB() {
  const h = controlled(0), initial = prepare(h);
  const before = h.json('({outs:player.highSchoolMatch.outs,runners:player.highSchoolMatch.runners,record:player.highSchoolMatch.gameRecord,PA:player.highSchoolMatch.simulationLog.filter(e=>e.type==="plateAppearance").length})');
  hold(h);
  const state = h.json('player.highSchoolMatch.offensivePlateAppearanceState');
  assert(state.awaitingDefense && !state.completed && !state.resultApplied);
  assert.equal(state.pitchNumber, 1);
  assert.equal(state.pendingPitch, null);
  assert.equal(state.pitchHistory[0].pitch.pitchId, initial.pendingPitch.pitchId);
  assert.equal(state.battedBallPhysicalTruth.identity, state.officialBallInPlayOutcome.physicalIdentity);
  assert.equal(state.officialBallInPlayOutcome.executionContext.pitchId, initial.pendingPitch.pitchId);
  assert.deepEqual(h.json('({outs:player.highSchoolMatch.outs,runners:player.highSchoolMatch.runners,record:player.highSchoolMatch.gameRecord,PA:player.highSchoolMatch.simulationLog.filter(e=>e.type==="plateAppearance").length})'), before);
  const stable = JSON.stringify(state);
  assert(h.run('OffensivePlateApproach.prepareNextPitch(player.highSchoolMatch.offensivePlateAppearanceState).awaitingDefense'));
  assert.equal(h.run('PlateDecisionFoundation.prepare({plateAppearanceState:player.highSchoolMatch.offensivePlateAppearanceState}).situation'), null);
  assert.equal(h.run('prepareHighSchoolPlateDecision(player.highSchoolMatch,s1Choice)'), null);
  assert.equal(JSON.stringify(h.json('player.highSchoolMatch.offensivePlateAppearanceState')), stable);
  assert(!JSON.stringify(state).includes('trustedPhysicalOutcomeResolver'));
  return { stage: 'S1-B', status: 'PASS', before, physicalIdentity: state.battedBallPhysicalTruth.identity,
    pitchId: initial.pendingPitch.pitchId, pendingState: state, prepareBarriers: 3, productionHandler: 'Final held-boundary test: original Production-created trusted resolver -> PlateDecision -> OPA; full public handler/owner commit is verified separately by stageDE. Historical intermediate public Pending witness remains in stageB evidence.' };
}
function runStageC() {
  const cases = [];
  for (const outs of [0, 1, 2]) {
    const h = controlled(outs);
    prepare(h);
    hold(h);
    h.context.s1DefenseSamples = POLICY.defenseSamples;
    const canonicalBefore = h.json('({outs:player.highSchoolMatch.outs,runners:player.highSchoolMatch.runners,record:player.highSchoolMatch.gameRecord})');
    h.run(`
      var s1held=player.highSchoolMatch.offensivePlateAppearanceState;
      var s1Candidate=MatchVNextSameBallExecutionAdapter.execute({
        context:s1held.officialBallInPlayOutcome.executionContext,physicalTruth:s1held.battedBallPhysicalTruth,
        samples:s1DefenseSamples,resolveThirdOut:resolveHighSchoolThirdOutIntegrity
      });
    `);
    const candidate = h.json('s1Candidate');
    assert(candidate.closed);
    assert.equal(candidate.settlement.outsAfter, outs + 1);
    assert.equal(candidate.force.outRunnerIds[0], 'player');
    assert.equal(candidate.received.receiverId, candidate.context.capabilities.actors.receiverId);
    assert(candidate.timing.timingMargin > 0);
    assert(candidate.scorerFacts.decisions.length === 0 && candidate.actionFacts.actions.every(a => a.status === 'completed'));
    assert.deepEqual(h.json('({outs:player.highSchoolMatch.outs,runners:player.highSchoolMatch.runners,record:player.highSchoolMatch.gameRecord})'), canonicalBefore);
    cases.push({ scenario: 'S1-NPC-SS-EMPTY-O' + outs, status: 'PURE_COMPOSITION_PASS_NOT_PA_COMMITTED', physicalIdentity: candidate.physicalId,
      shortstopId: candidate.reach.defenderId, receiverId: candidate.received.receiverId,
      reachMargin: candidate.reach.margin, secureMargin: candidate.secure.margin, strengthMargin: candidate.thrown.strengthMargin,
      accuracyMargin: candidate.thrown.accuracyMargin, receiveMargin: candidate.received.secureMargin,
      timingMargin: candidate.timing.timingMargin, thirdOut: candidate.settlement.thirdOut, candidate });
  }
  return { stage: 'S1-C', status: 'PASS', cases };
}
function runStageA() {
  const h = admitted();
  h.run('player.highSchoolMatch.pitcherRuntimeState=PitchSequencing.createPitcherRuntimeState({runtimeId:"old-pitcher",control:1,recentPitchClasses:["chasePitch"],mentalState:{arousal:99,confidence:1,cognitiveLoad:99,resultAttachment:99}})');
  const state = prepare(h), caps = state.context.sameBallExecution.capabilities, pitch = state.pendingPitch;
  assert.equal(state.context.pitcherId, caps.actors.pitcherId);
  assert.equal(pitch.pitcherId, caps.actors.pitcherId);
  assert.equal(state.pitcherRuntime.runtimeId, h.run('player.highSchoolMatch.id') + '|' + caps.actors.pitcherId);
  assert.equal(state.pitcherRuntime.control, caps.pitcher.consumed);
  assert.notEqual(state.pitcherRuntime.mentalState.arousal, 99);
  assert(!state.pitcherRuntime.recentPitchClasses.includes('chasePitch'));
  assert.equal(pitch.controlRealization.control, caps.pitcher.consumed);
  const low = prepare(admitted(), { control: 2 }), high = prepare(admitted(), { control: 8 });
  assert.equal(low.context.pitcherId, high.context.pitcherId);
  assert.equal(low.paIdentity, high.paIdentity);
  assert.equal(low.pendingPitch.controlRealization.control, 4);
  assert.equal(high.pendingPitch.controlRealization.control, 16);
  assert.notDeepEqual(low.pendingPitch.controlRealization, high.pendingPitch.controlRealization);
  const missing = admitted();
  missing.run('player.highSchoolMatch.pendingOffensiveOpportunity.sameBallExecution={enabled:true};player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]=JSON.parse(JSON.stringify(player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]));delete getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,"P").pitchingProfile.control;');
  assert.throws(() => missing.run('prepareHighSchoolPlateDecision(player.highSchoolMatch,getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch)[0])'), /MISSING_CAPABILITY/);
  return { stage: 'S1-A', status: 'PASS', identity: { pitcherId: caps.actors.pitcherId, runtimeId: state.pitcherRuntime.runtimeId, actualPitchId: pitch.pitchId, actualPitcherId: pitch.pitcherId },
    capabilityProvenance: caps, controlComparison: { low: low.pendingPitch.controlRealization, high: high.pendingPitch.controlRealization },
    qualification: 'Actual first pitch producer and control output; single-selector invocation count and final Game Record identity remain subsequent mandatory acceptance.' };
}
async function runSelectorWitness() {
  const inspector = require('node:inspector'), session = new inspector.Session();
  session.connect();
  const post = (method, params = {}) => new Promise((resolve, reject) => session.post(method, params, (error, value) => error ? reject(error) : resolve(value)));
  const h = admitted();
  await post('Profiler.enable');
  await post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
  const state = prepare(h);
  const coverage = await post('Profiler.takePreciseCoverage');
  await post('Profiler.stopPreciseCoverage');
  session.disconnect();
  const named = name => coverage.result.filter(s => /pitcher-catcher-tactical-integration.js$|pitch-sequencing.js$/.test(s.url))
    .flatMap(s => s.functions.filter(f => f.functionName === name).map(f => ({ file: s.url, name, calls: f.ranges[0].count })));
  const selector = named('createTacticalPitchDecision'), control = named('resolvePitchControl');
  assert.equal(selector.reduce((n, x) => n + x.calls, 0), 1);
  assert.equal(control.reduce((n, x) => n + x.calls, 0), 1);
  return { status: 'PASS', selector, control, pitchId: state.pendingPitch.pitchId, instrumentation: 'V8 precise coverage; no module/global/fs/assert monkey patch' };
}
const permanent = h => h.json('({skills:player.baseballSkills,experience:player.baseballExperience,capability:player.capabilityState,observe:player.observe,fitness:player.fitness,ballSense:player.ballSense})');
const matchSnapshot = h => h.json('({outs:player.highSchoolMatch.outs,runners:player.highSchoolMatch.runners,scores:player.highSchoolMatch.scores,order:player.highSchoolMatch.battingOrderIndex,log:player.highSchoolMatch.simulationLog,record:player.highSchoolMatch.gameRecord,moments:player.highSchoolMatch.completedMoments,experience:player.highSchoolMatch.matchExperience,rng:player.highSchoolMatch.simulationSeed,globalRng:m0DiscoveryRandom})');
function commit(h, route = 'contactSwing') {
  h.context.s1Route = route;
  assert(h.run('chooseHighSchoolYearOneMatchMoment(s1Route,getHighSchoolYearOneMomentId(player.highSchoolMatch))'));
  return h.json('player.highSchoolMatch.offensivePlateAppearanceState');
}
function reload(h) {
  h.run('saveGame();var s1RawSave=localStorage.getItem(SAVE_KEY);if(!s1RawSave)throw Error("save missing");player=normalizeSave(JSON.parse(s1RawSave));');
}
function nextEvent(h, beforePA) {
  let n = 0;
  while (h.run('player.highSchoolMatch.simulationLog.filter(e=>e.type==="plateAppearance").length') <= beforePA && n++ < POLICY.boundedSteps) {
    if (h.run('!!pendingYouthSeasonOutcome')) h.run('continueYouthSeasonOutcome()');
    else if (h.run('isTransitioning')) assert(h.run('__runNextTimer()'));
    else h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)');
  }
  assert(n <= POLICY.boundedSteps, 'next legal PA bound');
  return h.json('player.highSchoolMatch.simulationLog.filter(e=>e.type==="plateAppearance").at(-1)');
}
function runStageD() {
  const cases=[];
  for (const outs of [0,1,2]) {
    const h=controlled(outs), abilities=permanent(h), initial=prepare(h);
    injectSamples(h);
    const before=matchSnapshot(h), state=commit(h), after=matchSnapshot(h), candidate=state.officialBallInPlayOutcome.executionCandidate;
    const actors=candidate.context.capabilities.actors, b=before.record.playerLines, a=after.record.playerLines;
    assert(state.resultApplied && state.completed && !state.awaitingDefense);
    assert.equal(after.outs,outs+1); assert.deepEqual(after.runners,[null,null,null]);assert.deepEqual(after.scores,before.scores);
    assert.equal(after.order[candidate.context.offenseTeam],before.order[candidate.context.offenseTeam]+1);
    assert.equal(a.player.batting.PA-b.player.batting.PA,1);
    assert.equal(a[actors.pitcherId].pitching.BF-b[actors.pitcherId].pitching.BF,1);
    assert.equal(a[actors.pitcherId].pitching.outsRecorded-b[actors.pitcherId].pitching.outsRecorded,1);
    assert.equal(a[actors.shortstopId].defense.A-b[actors.shortstopId].defense.A,1);
    assert.equal(a[actors.receiverId].defense.PO-b[actors.receiverId].defense.PO,1);
    assert.deepEqual(a.player.defense,b.player.defense);
    assert.equal(Object.values(a).reduce((n,p)=>n+p.defense.E,0),Object.values(b).reduce((n,p)=>n+p.defense.E,0));
    assert.equal(after.log.filter(e=>e.type==='plateAppearance').length-before.log.filter(e=>e.type==='plateAppearance').length,1);
    assert.equal(after.log.filter(e=>e.type==='defensivePlay').length-before.log.filter(e=>e.type==='defensivePlay').length,1);
    assert.equal(state.pitchNumber,1);assert.equal(state.pitchHistory[0].pitch.pitchId,initial.pendingPitch.pitchId);
    assert.equal(candidate.physicalId,state.battedBallPhysicalTruth.identity);
    assert.equal(state.pitchHistory[0].contactQuality,state.battedBallPhysicalTruth.executionEvidence.continuousContactScore);
    assert.equal(state.swingExecutionSummary.hardContacts,state.pitchHistory.filter(e=>e.pitchResult==='ballInPlay'&&e.contactQuality>=0.72).length);
    assert.equal(state.pitchHistory[0].executionEvidence.contactQuality.realized,state.pitchHistory[0].contactQuality);
    assert(after.moments.at(-1).pitchHistory.length===1 && after.moments.at(-1).executionRefs.physicalId===candidate.physicalId);
    assert.deepEqual(permanent(h),abilities);
    assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'),[]);
    h.context.s1Committed=candidate;
    const receipt=h.json('getHighSchoolSameBallReceipt(player.highSchoolMatch,s1Committed)');
    assert(h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:s1Committed}).duplicate'));
    assert.deepEqual(matchSnapshot(h),after);assert.deepEqual(permanent(h),abilities);
    const next=nextEvent(h,after.log.filter(e=>e.type==='plateAppearance').length);
    if(outs<2){assert.equal(next.before.outs,after.outs);assert.deepEqual(next.before.runners,after.runners);assert.deepEqual(next.before.scores,after.scores);}
    else {assert(next.inning!==candidate.context.inning||next.half!==candidate.context.half);assert.equal(next.before.outs,0);}
    const stable=matchSnapshot(h);reload(h);
    assert.deepEqual(matchSnapshot(h),stable);
    assert.deepEqual(h.json('getHighSchoolSameBallReceipt(player.highSchoolMatch,s1Committed)'),receipt);
    assert(h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:s1Committed}).duplicate'));
    assert.deepEqual(matchSnapshot(h),stable);
    cases.push({scenario:'S1-NPC-SS-EMPTY-O'+outs,status:'PASS',before,after,receipt,next,capabilities:candidate.context.capabilities,candidate});
  }
  return {stage:'S1-D/E',status:'PASS',cases};
}
function completedUncommitted() {
  const h=controlled(0);prepare(h);injectSamples(h);
  h.run('var s1Resolved=resolveHighSchoolPlateDecisionPitch(player.highSchoolMatch,"contactSwing");var s1Candidate=player.highSchoolMatch.offensivePlateAppearanceState.officialBallInPlayOutcome.executionCandidate;');
  assert(!h.run('player.highSchoolMatch.offensivePlateAppearanceState.resultApplied'));
  return h;
}
function runRejections() {
  const rows=[];
  const mutations=[
    ['N01','physicalId','s1Bad.physicalId="other-ball"'],
    ['N02','PA','s1Bad.context.paId="other-pa"'],
    ['N03','batter','s1Bad.context.batterId="other-batter"'],
    ['N03','slot','s1Bad.context.battingSlot=(s1Bad.context.battingSlot+1)%9'],
    ['N04','pitch','s1Bad.context.pitchId="other-pitch"'],
    ['N04','pitcher','s1Bad.context.capabilities.actors.pitcherId="opponent-pitcher"'],
    ['N05','SS','s1Bad.reach.defenderId="player"'],
    ['N05','1B','s1Bad.received.receiverId="player"'],
    ['N06','assignment','s1Bad.context.capabilities.assignment.reverse()'],
    ['N13','post-entry nonSS','s1Bad.opportunity.primaryPosition="2B"'],
    ['N14','post-entry airborne truth','s1Bad.ground.physicalTruth.ballType="flyBall"'],
    ['N16','missing provenance','delete s1Bad.context.capabilities.pitcher.raw'],
    ['N16','fallback provenance','s1Bad.context.capabilities.pitcher.fallback=true'],
    ['N18','pending runner','s1Bad.firstLeg.continuation.pendingRunners=[{runnerId:"player"}]'],
    ['N18','live recovery','s1Bad.firstLeg.continuation.status="liveBallRecoveryRequired"'],
    ['N19','missing scorer','s1Bad.scorerFacts=null'],
    ['N19','incomplete action','s1Bad.actionFacts.actions[2].status="failed"'],
    ['N19','broken action dependency','s1Bad.actionFacts.actions[3].dependsOn=["other-action"]'],
    ['N01','candidate version','s1Bad.version="future-version"']
  ];
  for(const [id,name,mutate] of mutations) {
    const h=completedUncommitted();h.run('var s1Bad=JSON.parse(JSON.stringify(s1Candidate));'+mutate);
    const before=matchSnapshot(h),ability=permanent(h);
    assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,s1Resolved.selectedOffensiveChoice,null,{sameBallCandidate:s1Bad})'));
    assert.deepEqual(matchSnapshot(h),before);assert.deepEqual(permanent(h),ability);
    rows.push({id,name,status:'REJECTED_WITHOUT_WRITES'});
  }
  for(const mutate of [
    'player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam].lineup[1].defense+=1',
    'player.highSchoolMatch.outs=1',
    'player.highSchoolMatch.scores.home+=1',
    'player.highSchoolMatch.battingOrderIndex[player.highSchoolMatch.offenseTeam]=1'
  ]){
    const h=completedUncommitted();h.run(mutate);const before=matchSnapshot(h);
    assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,s1Resolved.selectedOffensiveChoice,null,{sameBallCandidate:s1Candidate})'));
    assert.deepEqual(matchSnapshot(h),before);rows.push({id:'N06/N21',name:mutate,status:'STALE_REJECTED'});
  }
  const h=controlled(0);prepare(h);injectSamples(h);const state=commit(h);h.context.s1Candidate=state.officialBallInPlayOutcome.executionCandidate;
  const stable=matchSnapshot(h);
  for(let n=0;n<3;n++)assert(h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:s1Candidate}).duplicate'));
  h.run('var s1Bad=JSON.parse(JSON.stringify(s1Candidate));s1Bad.samples.reach=0.4;');
  assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:s1Bad})'),/CONFLICTING/);
  assert.deepEqual(matchSnapshot(h),stable);
  rows.push({id:'N07/N08/N09/N12',status:'DUPLICATE_LOOKUP_ONLY_CONFLICT_REJECTED'});
  const p=completedUncommitted();reload(p);const pbefore=matchSnapshot(p);
  assert.throws(()=>p.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,s1Resolved.selectedOffensiveChoice,null)'),/UNTRUSTED_OR_RELOADED/);
  assert.throws(()=>p.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)'),/UNSAFE_CONTINUATION/);
  assert.deepEqual(matchSnapshot(p),pbefore);
  rows.push({id:'N21',status:'UNCOMMITTED_RELOAD_BLOCKED'});
  return {status:'PASS',rows};
}
function runSaveFailures() {
  const rows=[];
  const fresh=controlled(0);
  fresh.run('player.highSchoolMatch.pendingOffensiveOpportunity.sameBallExecution={enabled:true,mode:"controlled"};var s1Choice=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch)[0];ensureHighSchoolOffensivePlateAppearanceState(player.highSchoolMatch,s1Choice)');
  const fs=fresh.json('player.highSchoolMatch.offensivePlateAppearanceState');assert.equal(fs.pendingPitch,null);
  reload(fresh);assert.deepEqual(fresh.json('player.highSchoolMatch.offensivePlateAppearanceState'),fs);
  assert(fresh.run('chooseHighSchoolYearOneMatchMoment(s1Choice.matchDecision,s1Choice.matchMomentId)'));
  const pending=fresh.json('player.highSchoolMatch.offensivePlateAppearanceState'),stable=matchSnapshot(fresh);
  reload(fresh);assert.deepEqual(fresh.json('player.highSchoolMatch.offensivePlateAppearanceState'),pending);assert.deepEqual(matchSnapshot(fresh),stable);
  injectSamples(fresh);commit(fresh);const post=matchSnapshot(fresh),ability=permanent(fresh);reload(fresh);assert.deepEqual(matchSnapshot(fresh),post);assert.deepEqual(permanent(fresh),ability);
  rows.push({boundary:'fresh/pending-pitch/postcommit',status:'PASS',paId:pending.paIdentity,pitchId:pending.pendingPitch.pitchId});
  for(const corrupt of ['delete player.highSchoolMatch.offensivePlateAppearanceState.context.sameBallExecution',
    'player.highSchoolMatch.offensivePlateAppearanceState.context.pitcherId="other"',
    'player.highSchoolMatch.offensivePlateAppearanceState.pendingPitch.pitchId="other"',
    'player.highSchoolMatch.outs=1']) {
    const h=controlled(0);prepare(h);h.run(corrupt);reload(h);injectSamples(h);const before=matchSnapshot(h);
    assert.throws(()=>commit(h));assert.deepEqual(matchSnapshot(h),before);rows.push({boundary:'stale pending',corrupt,status:'BLOCKED'});
  }
  for(const fault of ['plateAppearance','defensivePlay','moment','defenseStats']) {
    const h=controlled(0);prepare(h);injectSamples(h);const ability=permanent(h);h.context.s1Fault=fault;
    h.run(`var s1RealRecord=recordHighSchoolMatchSimulationEvent;var s1RealMoment=recordHighSchoolYearOneMoment;
      recordHighSchoolMatchSimulationEvent=function(match,event){if(event.type===s1Fault)throw Error("INJECTED_LEDGER_FAILURE:"+s1Fault);return s1RealRecord.apply(this,arguments);};
      recordHighSchoolYearOneMoment=function(){if(s1Fault==="moment")throw Error("INJECTED_LEDGER_FAILURE:moment");return s1RealMoment.apply(this,arguments);};`);
    if(fault==='defenseStats')h.run('var s1ReceiverId=captureHighSchoolSameBallCapabilities(player.highSchoolMatch).actors.receiverId;Object.defineProperty(player.highSchoolMatch.gameRecord.playerLines[s1ReceiverId].defense,"PO",{enumerable:true,configurable:true,get(){return 0;},set(){throw Error("INJECTED_LEDGER_FAILURE:defenseStats");}})');
    assert.throws(()=>commit(h),/INJECTED_LEDGER_FAILURE/);assert.deepEqual(permanent(h),ability);
    const partial=matchSnapshot(h);reload(h);
    assert.throws(()=>h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)'),/SAME_BALL/);
    assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:player.highSchoolMatch.offensivePlateAppearanceState.officialBallInPlayOutcome.executionCandidate})'),/SAME_BALL/);
    assert.deepEqual(matchSnapshot(h),partial);assert.deepEqual(permanent(h),ability);
    rows.push({boundary:'partial write',fault,status:'BLOCKED_NO_REPAIR',after:partial});
  }
  for(const corrupt of ['player.highSchoolMatch.gameRecord.eventRefs=player.highSchoolMatch.gameRecord.eventRefs.filter(e=>!e.eventId.endsWith("|same-ball-pa"))',
    'player.highSchoolMatch.simulationLog=player.highSchoolMatch.simulationLog.filter(e=>e.type!=="defensivePlay")',
    'delete player.highSchoolMatch.completedMoments.at(-1).executionRefs']) {
    const h=controlled(0);prepare(h);injectSamples(h);commit(h);h.run(corrupt);reload(h);const before=matchSnapshot(h);
    assert.throws(()=>h.run('assertHighSchoolSameBallContinuable(player.highSchoolMatch)'),/SAME_BALL/);
    assert.deepEqual(matchSnapshot(h),before);rows.push({boundary:'partial refs',corrupt,status:'BLOCKED'});
  }
  const legacy=controlled(0);reload(legacy);assert(!legacy.run('player.highSchoolMatch.offensivePlateAppearanceState?.context?.sameBallExecution'));
  assert(legacy.run('chooseHighSchoolYearOneMatchMoment(getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch)[0].matchDecision,getHighSchoolYearOneMomentId(player.highSchoolMatch))'));
  rows.push({boundary:'legacy save no new metadata',status:'PASS'});
  for(const boundary of ['pending','commit','next']) {
    const h=controlled(0);prepare(h);injectSamples(h);
    if(boundary!=='pending')commit(h);
    if(boundary==='next')nextEvent(h,h.run('player.highSchoolMatch.simulationLog.filter(e=>e.type==="plateAppearance").length'));
    const before=matchSnapshot(h),ability=permanent(h),state=h.json('player.highSchoolMatch.offensivePlateAppearanceState');
    h.run('var s1PriorPlayer=player;saveGame();loadGame();');
    assert(h.run('player!==s1PriorPlayer'),'public load admitted a detached saved player');
    assert.deepEqual(matchSnapshot(h),before);assert.deepEqual(permanent(h),ability);
    assert.deepEqual(h.json('player.highSchoolMatch.offensivePlateAppearanceState'),state);
    rows.push({boundary:'public saveGame/loadGame '+boundary,status:'PASS'});
  }
  return {status:'PASS',rows};
}
function runRoutes() {
  const rows=[];
  for(const [name,route,extra,expected] of [
    ['take','take',{},'calledStrike'],['whiff','powerSwing',{timingRoll:1,batToBallRoll:1},'swingingStrike'],
    ['foul','contactSwing',{foulRoll:0},'foul'],['contact','contactSwing',{},'ballInPlay'],
    ['nonSS','contactSwing',{physicalRolls:{...POLICY.physicalRolls,direction:0.95}},'ballInPlay'],
    ['airborne','contactSwing',{physicalRolls:{...POLICY.physicalRolls,ballType:0.8}},'ballInPlay']]) {
    const h=controlled(0);prepare(h);injectSamples(h,extra);const ability=permanent(h),state=commit(h,route),event=state.pitchHistory[0];
    assert.equal(event.pitchResult,expected,name);assert.equal(event.plateDecision,route);
    assert.deepEqual(permanent(h),ability);
    if(['take','whiff','foul'].includes(name)){assert(!state.battedBallPhysicalTruth);assert(!state.resultApplied);assert.equal(state.strikes,1);}
    if(['nonSS','airborne'].includes(name)){assert(!state.officialBallInPlayOutcome.executionCandidate);assert(!h.run('player.highSchoolMatch.simulationLog.some(e=>e.executionRefs)'));}
    rows.push({name,route,pitchResult:event.pitchResult,balls:state.balls,strikes:state.strikes,physical:event.battedBallPhysicalTruth?.ballType,authority:state.officialBallInPlayOutcome?.authority,status:'PASS'});
  }
  return {status:'PASS',rows};
}
function runCapabilities() {
  const rows=[];
  // Fixed actor/PA/seed/sample policy. Each pair changes one real source field
  // before the PA is prepared; no produced pitch or execution fact is edited.
  for(const [name,low,high] of [['batting',5,6],['observe',5,6],['fitness',5,8]]) {
    const pair=[];
    for(const value of [low,high]){
      const h=controlled(0);h.context.s1Value=value;
      h.run(name==='batting'?'player.baseballSkills.batting=s1Value':name==='observe'?'player.observe=s1Value':'player.fitness=s1Value');
      const state=prepare(h),recognition=h.json('player.highSchoolMatch.plateDecisionState.recognition');injectSamples(h);
      const done=commit(h);pair.push({actor:state.batterId,paId:state.paIdentity,pitch:state.pendingPitch,
        raw:state.context.sameBallExecution.capabilities.batter.raw,consumed:state.context.sameBallExecution.capabilities.batter.consumed,
        recognition,execution:done.pitchHistory[0].executionEvidence});
    }
    assert.equal(pair[0].actor,pair[1].actor);assert.equal(pair[0].paId,pair[1].paId);assert.deepEqual(pair[0].pitch,pair[1].pitch);
    if(name==='observe')assert.notEqual(pair[0].recognition.score,pair[1].recognition.score);
    else if(name==='batting')assert.notEqual(pair[0].execution.batToBall.window,pair[1].execution.batToBall.window);
    else assert.notEqual(pair[0].execution.contactQuality.damageCeiling,pair[1].execution.contactQuality.damageCeiling);
    rows.push({name,sourceDelta:[low,high],pair,status:'PASS'});
  }
  for(const [position,field,metric] of [['SS','defense','secure'],['SS','arm','thrown'],['1B','defense','received']]) {
    const pair=[];
    for(const value of [6,7]){
      const h=controlled(0);h.context.s1Position=position;h.context.s1Field=field;h.context.s1Value=value;
      h.run('player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]=JSON.parse(JSON.stringify(player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]));getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,s1Position)[s1Field]=s1Value');
      prepare(h);injectSamples(h);const state=commit(h),candidate=state.officialBallInPlayOutcome.executionCandidate;
      pair.push({capabilities:candidate.context.capabilities,physical:state.battedBallPhysicalTruth,output:candidate[metric]});
    }
    assert.deepEqual(pair[0].physical,pair[1].physical);assert.notDeepEqual(pair[0].output,pair[1].output);
    rows.push({name:position+'.'+field,sourceDelta:[6,7],pair,status:'PASS'});
  }
  const unavailable=controlled(0);
  unavailable.run('player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]=JSON.parse(JSON.stringify(player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]));getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,"1B").defense=1');
  prepare(unavailable);injectSamples(unavailable,{sameBallSamples:{...POLICY.defenseSamples,receive:0.99}});
  const before=matchSnapshot(unavailable);
  assert.throws(()=>commit(unavailable),/SAME_BALL_BLOCKED:RECEIVER_RECOVERY_REQUIRED/);
  assert.deepEqual(matchSnapshot(unavailable),before);
  assert(unavailable.run('player.highSchoolMatch.offensivePlateAppearanceState.awaitingDefense'));
  assert.throws(()=>unavailable.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)'),/UNSAFE_CONTINUATION/);
  rows.push({name:'N17 actual failed receive',status:'BLOCKED_WITHOUT_FALLBACK'});
  const live=controlled(0);live.run('player.baseballSkills.baseRunning=20');prepare(live);injectSamples(live);
  const liveBefore=matchSnapshot(live);assert.throws(()=>commit(live),/SAME_BALL_BLOCKED:LIVE_BALL_CLOSURE_REQUIRED/);
  assert.deepEqual(matchSnapshot(live),liveBefore);assert(live.run('player.highSchoolMatch.offensivePlateAppearanceState.awaitingDefense'));
  rows.push({name:'N18 actual fast BR first-leg safe is not a supported closed play',status:'BLOCKED_WITHOUT_FALLBACK'});
  const missing=controlled(0);
  missing.run('player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]=JSON.parse(JSON.stringify(player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]));var s1MissingReceiver=getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,"1B");player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam].lineup=player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam].lineup.filter(a=>a.id!==s1MissingReceiver.id)');
  const noReceiverBefore=matchSnapshot(missing);assert.throws(()=>prepare(missing),/Active defense integrity/);assert.deepEqual(matchSnapshot(missing),noReceiverBefore);
  rows.push({name:'N05/N17 missing active receiver assignment',status:'REJECTED'});
  return {status:'PASS',rows};
}
async function runExecutionWitness() {
  const inspector=require('node:inspector'),session=new inspector.Session();session.connect();
  const post=(m,p={})=>new Promise((resolve,reject)=>session.post(m,p,(e,v)=>e?reject(e):resolve(v)));
  const h=controlled(0);await post('Profiler.enable');await post('Profiler.startPreciseCoverage',{callCount:true,detailed:true});
  prepare(h);injectSamples(h);const state=commit(h);h.context.s1Candidate=state.officialBallInPlayOutcome.executionCandidate;
  for(let i=0;i<3;i++)h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:s1Candidate})');
  const result=await post('Profiler.takePreciseCoverage');await post('Profiler.stopPreciseCoverage');session.disconnect();
  const targets=[['pitcher-catcher-tactical-integration.js','createTacticalPitchDecision',1],['pitch-sequencing.js','resolvePitchControl',1],
    ['batted-ball-physical.js','resolveBattedBallPhysicalTruth',1],['offensive-plate-approach.js','resolveFairContactBallInPlay',1],
    ['match-experience-development.js','settleMatchExperienceDevelopment',0]];
  const rows=targets.map(([file,name,expected])=>{
    const matches=result.result.filter(s=>s.url.endsWith(file)).flatMap(s=>s.functions.filter(f=>f.functionName===name));
    const actual=matches.reduce((n,f)=>n+f.ranges[0].count,0);assert.equal(actual,expected,file+'#'+name);
    return {file,name,expected,actual};
  });
  return {status:'PASS',instrumentation:'V8 preciseCoverage without producer replacement',rows};
}
function runMatchEnd() {
  const h=controlled(0);prepare(h);injectSamples(h);const start=permanent(h),momentId=h.run('getHighSchoolYearOneMomentId(player.highSchoolMatch)'),first=commit(h);
  assert.deepEqual(permanent(h),start);
  let steps=0;
  while(!h.run('player.highSchoolMatch.completed') && steps++<1400) {
    if(h.run('!!pendingYouthSeasonOutcome'))h.run('continueYouthSeasonOutcome()');
    else if(h.run('isTransitioning'))h.run('__runNextTimer()');
    else if(h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)'))assert(h.run('__chooseOpportunityDecision243(.82,"first",0)'));
    else if(!h.run('__runNextTimer()'))h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)');
  }
  assert(h.run('player.highSchoolMatch.completed'));
  const experience=h.json('player.highSchoolMatch.matchExperience'),history=h.json('player.developmentState.history');
  assert(experience.settled && experience.finalized && experience.developmentSettlementIds.length>0);
  assert.equal(new Set(experience.developmentSettlementIds).size,experience.developmentSettlementIds.length);
  assert(experience.evidence.some(e=>e.participationType==='batter' && e.sourceSnapshot?.momentId===momentId && e.activeType==='execution'));
  assert(!experience.evidence.some(e=>e.participationType==='primaryFielder'&&e.playId===first.battedBallPhysicalTruth.identity));
  const end=permanent(h);reload(h);
  assert.deepEqual(permanent(h),end);assert.deepEqual(h.json('player.developmentState.history'),history);
  assert.equal(h.run('MatchExperienceDevelopment.settleMatchExperienceDevelopment(player,player.highSchoolMatch).status'),'duplicate');
  assert.deepEqual(permanent(h),end);assert.deepEqual(h.json('player.developmentState.history'),history);
  return {status:'PASS',steps,qualification:'One controlled opt-in PA; remainder uses existing mode-off match loop',experience,history,permanentBefore:start,permanentAfter:end};
}
async function runSuite() {
  return {suite:'match-vnext-same-ball-production',status:'PASS',policy:POLICY,stageA:runStageA(),stageB:runStageB(),stageC:runStageC(),
    stageDE:runStageD(),rejections:runRejections(),save:runSaveFailures(),routes:runRoutes(),capabilities:runCapabilities(),
    executionCounts:await runExecutionWitness(),matchEnd:runMatchEnd(),s2:await runS2Suite(),recovery:runRecoveryProduction(),recoveryScorer:runRecoveryScorerProbe()};
}
if (require.main === module) (async () => {
  const result=process.argv.includes('--stage-d')?runStageD():process.argv.includes('--stage-c')?runStageC():process.argv.includes('--stage-b')?runStageB():await runSuite();
  console.log(JSON.stringify({suite:result.suite||result.stage,status:result.status,groups:Object.keys(result).filter(k=>result[k]?.status==='PASS')}));
})().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { POLICY, admitted, controlled, prepare, injectSamples, hold, commit, reload, permanent, matchSnapshot, nextEvent, completedUncommitted, runStageA, runSelectorWitness, runStageB, runStageC, runStageD, runRejections, runSaveFailures, runRoutes, runCapabilities, runExecutionWitness, runMatchEnd, runSuite };

// S2 additions. Original S1 fixtures/assertions, including N18, remain intact.
function prepareS2(h, { baseRunning = 20 } = {}) {
  h.context.s2BaseRunning = baseRunning;
  h.run(`
    player.baseballSkills.baseRunning=s2BaseRunning;
    player.highSchoolMatch.pendingOffensiveOpportunity.sameBallExecution={enabled:true,mode:"controlled",coveragePolicy:"s2-safe-first-v1"};
    player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]=JSON.parse(JSON.stringify(player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]));
    var s1Choice=getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch)[0];
  `);
  assert(h.run('chooseHighSchoolYearOneMatchMoment(s1Choice.matchDecision,s1Choice.matchMomentId)'));
  return h.json('player.highSchoolMatch.offensivePlateAppearanceState');
}
function s2PureCandidate(outs = 0) {
  const h=controlled(outs);prepareS2(h);hold(h);h.context.s1DefenseSamples=POLICY.defenseSamples;
  h.run(`var s2Held=player.highSchoolMatch.offensivePlateAppearanceState;
    var s2Candidate=MatchVNextSameBallExecutionAdapter.execute({context:s2Held.officialBallInPlayOutcome.executionContext,
      physicalTruth:s2Held.battedBallPhysicalTruth,samples:s1DefenseSamples,resolveThirdOut:resolveHighSchoolThirdOutIntegrity});`);
  return {h,candidate:h.json('s2Candidate'),truth:h.json('s2Held.battedBallPhysicalTruth')};
}
function s2Uncommitted() {
  const h=controlled(0);prepareS2(h);injectSamples(h);
  h.run('var s2Resolved=resolveHighSchoolPlateDecisionPitch(player.highSchoolMatch,"contactSwing");var s2Candidate=player.highSchoolMatch.offensivePlateAppearanceState.officialBallInPlayOutcome.executionCandidate;');
  assert(!h.run('player.highSchoolMatch.offensivePlateAppearanceState.resultApplied'));
  return h;
}
Object.assign(module.exports,{prepareS2,s2PureCandidate,s2Uncommitted});

async function runS2Safe() {
  const cases=[];
  for(const outs of [0,1,2]) {
    const h=controlled(outs),ability=permanent(h),inspector=require('node:inspector'),session=new inspector.Session();session.connect();
    const post=(m,p={})=>new Promise((resolve,reject)=>session.post(m,p,(err,r)=>err?reject(err):resolve(r)));
    await post('Profiler.enable');await post('Profiler.startPreciseCoverage',{callCount:true,detailed:true});
    const initial=prepareS2(h),preparedAbilities=permanent(h);injectSamples(h);
    const before=matchSnapshot(h),state=commit(h),after=matchSnapshot(h),candidate=state.officialBallInPlayOutcome.executionCandidate;
    const actors=candidate.context.capabilities.actors,b=before.record.playerLines,a=after.record.playerLines;
    assert.equal(state.result,'single');assert(state.completed&&state.resultApplied&&!state.awaitingDefense);
    assert.equal(candidate.batterReachClassification.officialClassification,'infieldHit');assert(candidate.timing.timingMargin<0);
    assert(candidate.thrown.throwQuality==='onTarget'&&candidate.received.secured);
    assert.equal(after.outs,outs);assert.deepEqual(after.runners,['player',null,null]);assert.deepEqual(after.scores,before.scores);
    for(const key of ['PA','AB','H'])assert.equal(a.player.batting[key]-b.player.batting[key],1,key);
    assert.equal(a[actors.pitcherId].pitching.BF-b[actors.pitcherId].pitching.BF,1);
    assert.equal(a[actors.pitcherId].pitching.outsRecorded-b[actors.pitcherId].pitching.outsRecorded,0);
    for(const actor of Object.keys(a))for(const stat of ['PO','A','E'])assert.equal(a[actor].defense[stat],b[actor]?.defense[stat]||0,actor+stat);
    assert.equal(after.log.filter(e=>e.type==='plateAppearance').length-before.log.filter(e=>e.type==='plateAppearance').length,1);
    assert.equal(after.log.filter(e=>e.type==='defensivePlay').length-before.log.filter(e=>e.type==='defensivePlay').length,1);
    assert.equal(after.order[candidate.context.offenseTeam],(before.order[candidate.context.offenseTeam]+1)%9);
    assert.equal(candidate.physicalId,initial.pendingPitch.pitchId);assert.equal(state.pitchHistory[0].pitch.pitchId,initial.pendingPitch.pitchId);
    assert.deepEqual(permanent(h),preparedAbilities);assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'),[]);
    assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'),[]);
    assert(!(after.experience?.evidence||[]).some(e=>e.participationType==='primaryFielder'&&e.playId===candidate.physicalId));
    h.context.s2Committed=candidate;const receipt=h.json('getHighSchoolSameBallReceipt(player.highSchoolMatch,s2Committed)');
    for(let i=0;i<3;i++)assert(h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:s2Committed}).duplicate'));
    assert.deepEqual(matchSnapshot(h),after);
    h.run('var s2PriorPlayer=player;saveGame();loadGame();');assert(h.run('player!==s2PriorPlayer'));
    assert.deepEqual(matchSnapshot(h),after);assert.deepEqual(permanent(h),preparedAbilities);
    assert.deepEqual(h.json('getHighSchoolSameBallReceipt(player.highSchoolMatch,s2Committed)'),receipt);
    assert(h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:s2Committed}).duplicate'));
    assert.deepEqual(matchSnapshot(h),after);
    const coverage=await post('Profiler.takePreciseCoverage');await post('Profiler.stopPreciseCoverage');session.disconnect();
    const counts=[];for(const[file,name,expected]of[['pitcher-catcher-tactical-integration.js','createTacticalPitchDecision',1],['pitch-sequencing.js','resolvePitchControl',1],['batted-ball-physical.js','resolveBattedBallPhysicalTruth',1],['match-vnext-same-ball-execution-adapter.js','execute',1],['match-experience-development.js','settleMatchExperienceDevelopment',0]]){const actual=coverage.result.filter(s=>s.url.endsWith(file)).flatMap(s=>s.functions.filter(f=>f.functionName===name)).reduce((n,f)=>n+f.ranges[0].count,0);assert.equal(actual,expected,name);counts.push({file,name,expected,actual});}
    const next=nextEvent(h,after.log.filter(e=>e.type==='plateAppearance').length);
    assert.equal(next.before.outs,outs);assert.deepEqual(next.before.runners,['player',null,null]);
    const nextSnapshot=matchSnapshot(h);assert(h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:s2Committed}).duplicate'));
    assert.deepEqual(matchSnapshot(h),nextSnapshot);
    cases.push({id:'S2-SAFE-O'+outs,status:'PASS',fixture:{seed:POLICY.seed,samples:POLICY,sourceAbilityBeforeAdmission:{baseRunning:20},seedSearch:false},before,after,initial,state,candidate,receipt,next,counts,permanentBeforeFixture:ability,permanentAfterPrepared:preparedAbilities,publicSaveLoad:'PASS',staleReceiptAfterNextPA:'READ_ONLY'});
  }
  return{status:'PASS',cases};
}
function runS2Rejections() {
  const rows=[];
  const mutations=[['Physical','s2Bad.physicalId="other"'],['PA','s2Bad.context.paId="other"'],['pitch','s2Bad.context.pitchId="other"'],['batter','s2Bad.context.batterId="other"'],
    ['SS','s2Bad.reach.defenderId="other"'],['1B','s2Bad.received.receiverId="other"'],['BR','s2Bad.ground.runnerPhysicalStates[0].runnerId="other"'],
    ['capability','s2Bad.context.capabilities.receiver.consumed.fielding--'],['timing','s2Bad.timing.receiverCompletion.relativeCompletion++'],
    ['only safe','delete s2Bad.batterReachClassification'],['deferred','s2Bad.batterReachClassification={compatibleOffensiveResult:"single",officialScoring:"deferred"}'],
    ['scorer batter','s2Bad.batterReachClassification.responsibleBatterId="other"'],['scorer actor','s2Bad.actionFacts.actions[2].actorId="player"'],
    ['failed receive','s2Bad.received.secured=false'],['late receive','s2Bad.received.status="late"'],['offline','s2Bad.thrown.throwQuality="offline"'],['weak','s2Bad.thrown.throwQuality="lateWeakThrow"'],
    ['pending recovery','s2Bad.firstLeg.continuation.status="liveBallRecoveryRequired"'],['safe absent base','s2Bad.settlement.baseChanges=[null,null,null]'],
    ['extra out','s2Bad.settlement.outsAfter++'],['third out','s2Bad.settlement.thirdOut.thirdRetirement={runnerId:"player"}'],
    ['fabricated assist','s2Bad.defensiveAttribution.actors[0].A=1'],['policy','s2Bad.context.coveragePolicy="s1-out-only"']];
  for(const[name,mutation]of mutations){const h=s2Uncommitted();h.run('var s2Bad=JSON.parse(JSON.stringify(s2Candidate));'+mutation);const before=matchSnapshot(h),ability=permanent(h);assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,s2Resolved.selectedOffensiveChoice,null,{sameBallCandidate:s2Bad})'));assert.deepEqual(matchSnapshot(h),before);assert.deepEqual(permanent(h),ability);rows.push({name,status:'REJECTED_WITHOUT_WRITES'});}
  for(const mutation of ['player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam].lineup[1].defense--','player.baseballSkills.baseRunning--']){const h=s2Uncommitted();h.run(mutation);const before=matchSnapshot(h);assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,s2Resolved.selectedOffensiveChoice,null,{sameBallCandidate:s2Candidate})'));assert.deepEqual(matchSnapshot(h),before);rows.push({name:'stale live source '+mutation,status:'REJECTED_WITHOUT_WRITES'});}
  for(const mutation of ['player.highSchoolMatch.pendingOffensiveOpportunity.sameBallExecution.coveragePolicy="s1-out-only"',
    'player.highSchoolMatch.offensivePlateAppearanceState.context.sameBallExecution.coveragePolicy="s1-out-only"',
    'player.highSchoolMatch.pendingOffensiveOpportunity.sameBallExecution.coveragePolicy="s1-out-only";player.highSchoolMatch.offensivePlateAppearanceState.context.sameBallExecution.coveragePolicy="s1-out-only";player.highSchoolMatch.offensivePlateAppearanceState.context.sameBallExecution.admission.coveragePolicy="s1-out-only"']){const h=controlled(0);prepareS2(h);injectSamples(h);h.run(mutation);const before=matchSnapshot(h);assert.throws(()=>commit(h),/SAME_BALL/);assert.deepEqual(matchSnapshot(h),before);rows.push({name:'post admission policy switch',mutation,status:'REJECTED_BEFORE_CONTACT'});}
  const legacy=controlled(0);legacy.run('player.baseballSkills.baseRunning=20');prepare(legacy);injectSamples(legacy,{coveragePolicy:'s2-safe-first-v1'});const old=matchSnapshot(legacy);assert.throws(()=>commit(legacy),/SAME_BALL_BLOCKED:LIVE_BALL_CLOSURE_REQUIRED/);assert.deepEqual(matchSnapshot(legacy),old);rows.push({name:'executionOptions cannot switch original S1 policy',status:'REJECTED'});
  for(const corrupt of ['s2Bad.result="out"','s2Bad.batterReachClassification.officialClassification="error"','s2Bad.samples.receive=0.1']){const h=controlled(0);prepareS2(h);injectSamples(h);const done=commit(h);h.context.s2Committed=done.officialBallInPlayOutcome.executionCandidate;const before=matchSnapshot(h);h.run('var s2Bad=JSON.parse(JSON.stringify(s2Committed));'+corrupt);assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:s2Bad})'));assert.deepEqual(matchSnapshot(h),before);rows.push({name:'conflicting completed candidate',corrupt,status:'REJECTED_NO_DUPLICATE_STATS'});}
  for(const[fixture,extra]of[['nonSS',{physicalRolls:{...POLICY.physicalRolls,direction:.95}}],['airborne',{physicalRolls:{...POLICY.physicalRolls,ballType:.8}}]]){const h=controlled(0);prepareS2(h);injectSamples(h,extra);const state=commit(h);assert(!state.officialBallInPlayOutcome.executionCandidate);assert(!h.run('player.highSchoolMatch.simulationLog.some(e=>e.executionRefs)'));rows.push({name:fixture,status:'EXCLUDED_BEFORE_SAME_BALL_EXECUTION'});}
  return{status:'PASS',rows};
}
function runS2PartialFailures() {
  const rows=[];
  for(const fault of ['plateAppearance','defensivePlay','moment','hitStats']) {
    const h=controlled(0);prepareS2(h);injectSamples(h);const ability=permanent(h);h.context.s2Fault=fault;
    h.run(`var s2Record=recordHighSchoolMatchSimulationEvent,s2Moment=recordHighSchoolYearOneMoment;
      recordHighSchoolMatchSimulationEvent=function(match,event){if(event.type===s2Fault)throw Error("S2_PARTIAL:"+s2Fault);return s2Record.apply(this,arguments);};
      recordHighSchoolYearOneMoment=function(){if(s2Fault==="moment")throw Error("S2_PARTIAL:moment");return s2Moment.apply(this,arguments);};`);
    if(fault==='hitStats')h.run('Object.defineProperty(player.highSchoolMatch.gameRecord.playerLines.player.batting,"H",{enumerable:true,configurable:true,get(){return 0;},set(){throw Error("S2_PARTIAL:hitStats");}})');
    assert.throws(()=>commit(h),/S2_PARTIAL/);const partial=matchSnapshot(h);assert.deepEqual(permanent(h),ability);
    reload(h);assert.deepEqual(matchSnapshot(h),partial);
    assert.throws(()=>h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)'),/SAME_BALL/);
    assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:player.highSchoolMatch.offensivePlateAppearanceState.officialBallInPlayOutcome.executionCandidate})'),/SAME_BALL/);
    assert.deepEqual(matchSnapshot(h),partial);assert.deepEqual(permanent(h),ability);rows.push({fault,status:'FAIL_CLOSED_NO_REPAIR_OR_REPLAY',partial});
  }
  for(const boundary of ['held','completedUncommitted','prepared']) {
    const h=boundary==='completedUncommitted'?s2Uncommitted():controlled(0);
    if(boundary!=='completedUncommitted'){prepareS2(h);if(boundary==='held')hold(h);}
    const before=matchSnapshot(h);reload(h);assert.deepEqual(matchSnapshot(h),before);
    if(boundary==='prepared')assert.throws(()=>h.run('resolveHighSchoolPlateDecisionPitch(player.highSchoolMatch,"contactSwing")'),/SAME_BALL/);
    else assert.throws(()=>h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)'),/SAME_BALL/);
    assert.deepEqual(matchSnapshot(h),before);rows.push({boundary,status:'TRANSIENT_PROOF_NOT_RECONSTRUCTED_FROM_SAVE'});
  }
  return{status:'PASS',rows};
}
function runS2FailureBoundaries() {
  const rows=[];
  for(const name of ['unavailableReceive','receive','throw']) {
    const h=controlled(0);h.run('player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]=JSON.parse(JSON.stringify(player.highSchoolMatch.rosters[player.highSchoolMatch.defenseTeam]))');
    h.run(name==='unavailableReceive'?'getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,"1B").defense=1':name==='receive'
      ?'getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,"1B").defense=3;getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,"SS").arm=5'
      :'getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,"SS").arm=1');
    const samples={...POLICY.defenseSamples,...(name==='unavailableReceive'?{receive:.99}:name==='receive'?{accuracy:.75,receive:.6}:{accuracy:.99})};
    prepareS2(h);injectSamples(h,{sameBallSamples:samples});
    h.run('var s2Original=MatchVNextSameBallExecutionAdapter,s2Failure=null;MatchVNextSameBallExecutionAdapter=Object.freeze({...s2Original,execute:function(){var result=s2Original.execute.apply(s2Original,arguments);s2Failure=result;return result;}})');
    const before=matchSnapshot(h),ability=permanent(h);assert.throws(()=>commit(h),/SAME_BALL_BLOCKED:RECEIVER_RECOVERY_REQUIRED/);assert.deepEqual(matchSnapshot(h),before);assert.deepEqual(permanent(h),ability);
    const failure=h.json('s2Failure');assert(!failure.closed);assert(name==='receive'?failure.received.status==='failed':name==='unavailableReceive'?failure.received.status==='unavailable':failure.thrown.throwQuality==='offline');
    assert.throws(()=>h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)'),/SAME_BALL/);rows.push({id:'S2-'+name.toUpperCase()+'-FAILURE',status:'BLOCKED_NOT_CLASSIFIED_OR_SETTLED',samples,before,after:matchSnapshot(h),failure,permanentAbilitiesUnchanged:true});
  }
  return{status:'PASS',qualification:'Failure rejection verified; no new official error/recovery result',rows};
}
function runS2MatchEnd() {
  const h=controlled(0);prepareS2(h);injectSamples(h);const start=permanent(h),first=commit(h);assert.equal(first.result,'single');assert.deepEqual(permanent(h),start);
  let steps=0;while(!h.run('player.highSchoolMatch.completed')&&steps++<1400){if(h.run('!!pendingYouthSeasonOutcome'))h.run('continueYouthSeasonOutcome()');else if(h.run('isTransitioning'))h.run('__runNextTimer()');else if(h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)'))assert(h.run('__chooseOpportunityDecision243(.82,"first",0)'));else if(!h.run('__runNextTimer()'))h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)');}
  assert(h.run('player.highSchoolMatch.completed'));const experience=h.json('player.highSchoolMatch.matchExperience'),history=h.json('player.developmentState.history'),end=permanent(h);
  assert(experience.settled&&experience.finalized&&experience.developmentSettlementIds.length>0);assert.equal(new Set(experience.developmentSettlementIds).size,experience.developmentSettlementIds.length);
  assert(!experience.evidence.some(e=>e.participationType==='primaryFielder'&&e.playId===first.battedBallPhysicalTruth.identity));
  reload(h);assert.deepEqual(permanent(h),end);assert.deepEqual(h.json('player.developmentState.history'),history);
  assert.equal(h.run('MatchExperienceDevelopment.settleMatchExperienceDevelopment(player,player.highSchoolMatch).status'),'duplicate');assert.deepEqual(permanent(h),end);assert.deepEqual(h.json('player.developmentState.history'),history);
  return{status:'PASS',steps,experience,history,permanentBefore:start,permanentAfter:end};
}
async function runS2Suite(){return{status:'PASS',safe:await runS2Safe(),rejections:runS2Rejections(),partial:runS2PartialFailures(),failureBoundaries:runS2FailureBoundaries(),matchEnd:runS2MatchEnd()};}
Object.assign(module.exports,{runS2Safe,runS2Rejections,runS2PartialFailures,runS2FailureBoundaries,runS2MatchEnd,runS2Suite});

// S2-RECOVERY-001 controlled interface; all fixtures are set before PA admission.
function prepareRecovery(h, { kind='R1', values={}, defense, outs=0, baseRunning=20 }={}) {
  h.context.recoveryFixture={kind,defense,baseRunning,descriptor:{version:'s2-recovery-samples-v1',authority:'preAdmissionControlledRecoverySamples',
    order:['direction','displacement','contact','approach','acquire'],values:{direction:.25,displacement:.5,contact:.75,approach:.5,acquire:.99,...values}}};
  h.run(`player.baseballSkills.baseRunning=recoveryFixture.baseRunning;
    var rm=player.highSchoolMatch;
    rm.rosters[rm.defenseTeam]=JSON.parse(JSON.stringify(rm.rosters[rm.defenseTeam]));
    var rb=getCurrentHighSchoolMatchDefender(rm,rm.defenseTeam,'1B'),rs=getCurrentHighSchoolMatchDefender(rm,rm.defenseTeam,'SS');
    if(recoveryFixture.kind==='R1')rb.defense=1;
    if(recoveryFixture.kind==='R2'){rb.defense=3;rs.arm=5;}
    if(recoveryFixture.kind==='R3')rs.arm=1;
    if(recoveryFixture.defense!==undefined)rb.defense=recoveryFixture.defense;
    rm.pendingOffensiveOpportunity.sameBallExecution={enabled:true,mode:'controlled',coveragePolicy:'s2-recovery-facts-v1',recoverySamples:recoveryFixture.descriptor};
    var rchoice=getHighSchoolYearOneMatchMomentChoices(rm)[0];`);
  assert(h.run('chooseHighSchoolYearOneMatchMoment(rchoice.matchDecision,rchoice.matchMomentId)'));
  injectSamples(h,{sameBallSamples:{...POLICY.defenseSamples,...(kind==='R1'?{receive:.99}:kind==='R2'?{accuracy:.75,receive:.6}:{accuracy:.99})}});
  h.run(`var recoveryOriginalAdapter=MatchVNextSameBallExecutionAdapter,recoveryFacts=null,recoveryExecutionCount=0;
    MatchVNextSameBallExecutionAdapter=Object.freeze({...recoveryOriginalAdapter,execute:function(){recoveryExecutionCount++;var f=recoveryOriginalAdapter.execute.apply(recoveryOriginalAdapter,arguments);recoveryFacts=f;return f;}});`);
}
function recoveryCase(options={}) {
  const h=controlled(options.outs||0);prepareRecovery(h,options);
  const before=matchSnapshot(h),ability=permanent(h);
  assert.throws(()=>commit(h),/SAME_BALL_BLOCKED:/);
  assert.deepEqual(matchSnapshot(h),before);assert.deepEqual(permanent(h),ability);
  return {h,facts:h.json('recoveryFacts'),before,ability};
}
function runRecoveryProduction() {
  const rows=[];
  for(const options of [{kind:'R1'},{kind:'R2'},{kind:'R3'},{kind:'R1',outs:1},{kind:'R1',outs:2},{kind:'R1',values:{acquire:.1}},{kind:'R3',defense:1},{kind:'R2',values:{contact:.25}},{kind:'R1',baseRunning:1}]){
    const {h,facts,before,ability}=recoveryCase(options);
    assert.equal(facts.ballState.status,'supported',JSON.stringify(facts));
    assert(['completed','failed'].includes(facts.recoveryAction.status),JSON.stringify(facts));
    assert(['closed','pending'].includes(facts.runnerContinuation.status),JSON.stringify(facts));
    assert.equal(facts.closed,false);assert.equal(facts.result,undefined);
    assert(h.run('MatchVNextExecutionContract.validateRecoveryFacts(recoveryFacts,recoveryFacts.ballInput.context,recoveryFacts.ballInput.physicalTruth,resolveHighSchoolThirdOutIntegrity)'));
    if(options.kind!=='R3'&&options.baseRunning!==1&&options.values?.acquire!==.1){assert.equal(facts.runnerContinuation.closed,true);assert.equal(facts.reason,'RECOVERY_SCORER_CLASSIFICATION_REQUIRED');}
    else assert.equal(facts.runnerContinuation.closed,false);
    const stale=h.run('getHighSchoolYearOneMomentId(player.highSchoolMatch)');
    assert.equal(h.run("chooseHighSchoolYearOneMatchMoment('contactSwing',getHighSchoolYearOneMomentId(player.highSchoolMatch))"),false);
    assert.throws(()=>h.run('resolveHighSchoolOffensiveDecision(player.highSchoolMatch,null,null,{sameBallCandidate:recoveryFacts})'),/SAME_BALL/);
    assert.throws(()=>h.run('OffensivePlateApproach.completeHeldBallInPlay(player.highSchoolMatch.offensivePlateAppearanceState,recoveryFacts)'),/SAME_BALL/);
    assert.equal(h.run('recoveryExecutionCount'),1);assert.deepEqual(matchSnapshot(h),before);
    h.run('var recoveryPriorPlayer=player;saveGame();loadGame();');assert(h.run('player!==recoveryPriorPlayer'));
    assert.throws(()=>h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)'),/SAME_BALL/);
    assert.equal(h.run('recoveryExecutionCount'),1);assert.deepEqual(matchSnapshot(h),before);assert.deepEqual(permanent(h),ability);
    rows.push({options,status:'PASS',facts,executions:1,staleId:stale,uncommitted:true,reloadRejected:true,npcLearningUnchanged:true});
  }
  assert.equal(rows[2].facts.recoveryAction.status,'completed');assert.equal(rows[6].facts.recoveryAction.status,'failed');
  assert.equal(rows[2].facts.runnerContinuation.decision.type,'attemptSecond');
  assert.equal(rows[7].facts.ballState.contact,'gloveDeflection');
  assert.equal(rows[8].facts.runnerContinuation.reason,'FIRST_CONTEST_REQUIRES_TERMINAL_EXECUTION');
  assert.equal(rows[8].facts.runnerContinuation.decision.status,'notReached');
  assert.equal(rows[8].facts.runnerContinuation.decision.type,null);
  assert(rows[8].facts.runnerContinuation.progression.completionFraction<1);
  assert.equal(rows[8].facts.runnerContinuation.attainedBases.length,0);
  const rejected=[];
  for(const mutation of ["player.highSchoolMatch.pendingOffensiveOpportunity.sameBallExecution.recoverySamples.values.acquire=.2",
    "player.highSchoolMatch.offensivePlateAppearanceState.context.sameBallExecution.admission.recoverySamples.values.acquire=.2",
    "getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,'1B').defense=20",
    "player.highSchoolMatch.pendingOffensiveOpportunity.sameBallExecution.coveragePolicy='s2-safe-first-v1'"]){
    const h=controlled(0);prepareRecovery(h);h.run(mutation);const before=matchSnapshot(h);assert.throws(()=>commit(h),/SAME_BALL/);
    assert.equal(h.run('recoveryExecutionCount'),0);assert.deepEqual(matchSnapshot(h),before);rejected.push({mutation,status:'REJECTED_BEFORE_ACTION'});
  }
  return {status:'PASS',rows,rejected};
}
Object.assign(module.exports,{prepareRecovery,recoveryCase,runRecoveryProduction});

function runRecoveryScorerProbe() {
  const D=require('../defensive-decision-throw-foundation.js'),rows=[];
  for(const kind of ['R1','R2','R3']) {
    const {facts:f}=recoveryCase({kind}),c=f.ballInput.context,id=f.physicalId,actionId=n=>id+'|action|'+n;
    const actionFacts=D.createActionFacts({playIdentity:id,physicalIdentity:id,sourceAuthority:'sameBallActualNPCRecoveryExecution',actions:[
      {type:'field',actorId:c.capabilities.actors.shortstopId,actorPosition:'SS',status:'completed',runnerId:'player',targetBase:'first',provenance:{secureId:f.ballInput.input.secureResult.identity}},
      {type:'throw',actorId:c.capabilities.actors.shortstopId,actorPosition:'SS',receiverId:c.capabilities.actors.receiverId,status:kind==='R3'?'failed':'completed',runnerId:'player',targetBase:'first',dependsOn:[actionId(1)],provenance:{throwId:f.ballInput.thrown.identity}},
      {type:'receive',actorId:c.capabilities.actors.receiverId,actorPosition:'1B',status:kind==='R2'?'failed':'unavailable',runnerId:'player',targetBase:'first',dependsOn:[actionId(2)],provenance:{receiveId:f.ballInput.received.identity}},
      {type:'field',actorId:f.recoveryAction.actorId,actorPosition:'1B',status:f.recoveryAction.status,runnerId:'player',targetBase:'first',dependsOn:[actionId(3)],provenance:{recoveryId:f.recoveryAction.identity,ballId:f.ballState.identity}}
    ]});
    const eligibility=D.resolveScorerEligibility({actionFacts,retirements:[],contests:[]});assert.equal(eligibility.decisions.length,0);assert.equal(eligibility.batterReachedOnError,false);
    let rejection='';try{D.resolveScorerEligibility({actionFacts,retirements:[],contests:[{failedActionId:actionId(kind==='R3'?2:3),runnerId:'player',targetBase:'first',
      ordinaryEffort:{status:'insufficient',source:'newRecoveryModelDoesNotProveOrdinaryEffort'},potentialOut:{status:'insufficient',source:'noIndependentCleanCounterfactual'},attributableAdvancement:[]}]});}catch(error){rejection=error.message;}
    assert.match(rejection,/invalid scorer contest identity/);
    rows.push({kind,actionFacts,runnerContinuation:f.runnerContinuation,eligibility,rejection,status:'UNCLASSIFIED_NO_DEFENSIVE_TERMINAL_OR_COUNTERFACTUAL',qualification:'Empty contests prove neither a hit nor absence of an error; no synthetic baseTouch/tag added.'});
  }
  return {status:'PASS',rows,officialClassification:null,paCommit:false};
}
Object.assign(module.exports,{runRecoveryScorerProbe});

