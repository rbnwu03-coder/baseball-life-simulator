'use strict';
const assert = require('assert/strict');
const { makeContext } = require('./high-school-career-test-context.js');
const Ground = require('../batted-ball-ground-defense');
const { run, json } = makeContext();
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };

// Explicit production fixtures: real roster actors and generated physical truth,
// with declared base states / capabilities / rolls. These are not natural witnesses.
run(`
  function ssFixture(options={}) {
    careerFixture(options.position||"游擊手","starter",77001);choose("critical_offseason",1);
    const m=player.highSchoolMatch;
    m.rosters=JSON.parse(JSON.stringify(m.rosters));
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:options.outs||0,
      runners:[null,null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",currentDomain:"defense",
      activeSituation:null,groundBallInPlayState:null,lineDriveCatchState:null,flyBallCatchState:null,defensiveSituation:{}});
    m.battingOrderIndex.away=3;m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id;
    for(let i=0;i<(options.occupied||0);i++) {
      const actor=m.rosters.away.lineup[i];actor.speed=options.runnerSpeed??1;actor.reaction=5;m.runners[i]=actor.id;
    }
    const batter=getHighSchoolMatchSimulationEntity(m,m.currentBatter);batter.speed=options.batterSpeed??1;batter.power=4;
    for(const position of ["2B","1B","3B","C"]) {
      const actor=TeamRosterFoundation.getCurrentDefender(m.rosters.home,position);actor.defense=10;actor.arm=10;
    }
    if(options.pivotWeak) Object.assign(TeamRosterFoundation.getCurrentDefender(m.rosters.home,"2B"),{defense:4,arm:1});
    if(options.firstBaseWeak) TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").defense=1;
    prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"standardAttack",
      situationOverrides:{playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10,...options.capabilities}},
      ordinaryPlateAppearance:{physicalRolls:{contactQuality:.65,ballType:.1,pace:.68,direction:options.direction??.05,depth:0},outcomeRoll:.5}});
    return m;
  }
  function ssFacts(m) {return JSON.stringify({outs:m.outs,bases:m.runners,scores:m.scores,order:m.battingOrderIndex,
    log:m.simulationLog,record:m.gameRecord,experience:m.matchExperience});}
  function ssExecute(m,decision="secure",sample=.8) {
    const choice=getHighSchoolDefensiveMomentChoices(m).find(c=>c.matchDecision===decision);
    if(!choice)throw Error("missing SS fixture choice: "+decision);
    beginGroundBallSituationDecision(m,decision);
    const resolution=resolveHighSchoolDefensivePlay(m,decision,()=>sample);
    recordGroundBallSituationResolution(m,resolution);
    return resolution;
  }
  function ssApply(m,decision="secure",sample=.8) {
    const r=ssExecute(m,decision,sample),raw=JSON.stringify(r);
    applyInfieldResolutionToHighSchoolMatch(m,decision,r);
    if(JSON.stringify(r)!==raw)throw Error("Final settlement changed raw execution facts");
    return r;
  }
`);

test('Foundation SS scope follows left/middle ground responsibility, preserves 2B and excludes other positions', () => {
  for (const direction of ['leftSide', 'middle', 'rightSide']) {
    const physicalTruth = { ballType: 'groundBall', direction, pace: 'firm' };
    for (const position of ['游擊手', '二壘手', '三壘手', '一壘手']) {
      const access = Ground.resolveGroundBallDefensiveAccess({ physicalTruth, defenderContext: { playerPosition: position, reaction: 10, range: 10 } });
      assert.equal(access.supported, position === '游擊手' ? direction !== 'rightSide' : position === '二壘手' && direction === 'rightSide');
    }
  }
});
test('SS-01 empty bases: first-base out enters official match, GameRecord and lifecycle', () => {
  run('var m=ssFixture();var batter=m.currentBatter;var r=ssApply(m);');
  assert.equal(run('r.outsCreated'), 1);
  assert.equal(run('m.outs'), 1);
  assert.deepEqual(json('m.runners'), [null, null, null]);
  assert.equal(run('m.groundBallInPlayState.playSettlement.settlementApplied'), true);
  assert.equal(run('m.lastClosedSituationSummary.lifecycleState'), 'closed');
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'), []);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.A'), 1);
});
test('SS-02 runner first: legal first / force second / 6-4-3 and explicit provenance', () => {
  run('var m=ssFixture({occupied:1});var options=getHighSchoolDefensiveMomentChoices(m);var r=ssApply(m,"forceSecond");');
  const routes = json('options').map(c => c.routeId);
  for (const route of ['secureFirstBaseOut', 'forceSecond', 'startDoublePlaySecond']) assert(routes.includes(route));
  assert.equal(run('m.groundBallInPlayState.decisionThrowState.selection.position'), 'SS');
  assert.equal(run('m.groundBallInPlayState.decisionThrowState.throwResolution.receiverPosition'), '2B');
  const event = json('m.simulationLog.find(e=>e.type==="defensiveResolution")');
  assert.equal(event.decisionProvenance.decidedBy, 'player');
  assert.equal(event.playerPosition, '游擊手');
  assert(event.decisionIdentity && event.contextSnapshot && event.availableOptions.length && event.physicalIdentity);
  assert(run('m.gameRecord.eventRefs.some(e=>e.sequence===m.simulationLog.find(e=>e.type==="defensiveResolution").sequence)'));
});
test('SS-03 runners first and second: force retires correct actor and rebuilds all bases', () => {
  for (const occupied of [2, 3]) {
    run(`var m=ssFixture({occupied:${occupied}});var before=m.runners.slice();var batter=m.currentBatter;var r=ssApply(m,"forceSecond");`);
    assert.equal(run('r.outsCreated'), 1);
    assert.deepEqual(json('m.runners'), [run('batter'), null, run('before[1]')]);
    assert.deepEqual(json('r.runnerSettlement.outRunnerIds'), [run('before[0]')]);
    assert.deepEqual(json('r.runnerSettlement.scoringRunnerIds'), occupied === 3 ? [run('before[2]')] : []);
    assert.deepEqual(json('m.scores'), { home: 1, away: occupied === 3 ? 2 : 1 });
    const legalRuns = occupied === 3 ? 1 : 0;
    assert.equal(run('m.lastDefensiveResolution.runsAllowed'), legalRuns);
    assert.equal(run('m.simulationLog.findLast(e=>e.type==="defensiveResolution").runsAllowed'), legalRuns);
    assert.equal(run('m.completedMoments.at(-1).runsAllowed'), legalRuns);
    assert.equal(run('m.gameRecord.totals.away.runs'), legalRuns);
    if (legalRuns) {
      assert.equal(run('m.lastDefensiveResolution.runnerChanges.find(c=>c.runnerId===before[2]).scored'), true);
      assert.equal(run('m.lastDefensiveResolution.runnerChanges.find(c=>c.runnerId===before[2]).to'), 'home');
    }
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'), []);
  }
});
test('SS-04 full double play records two ordered actual retirements and separate relay stages', () => {
  run('var m=ssFixture({occupied:1});var r=ssApply(m,"challenge");');
  assert.equal(run('r.outsCreated'), 2);
  assert.deepEqual(json('r.runnerSettlement.retirements.map(x=>x.targetBase)'), ['second', 'first']);
  assert.equal(run('r.timingResolution.firstLegSettlement.outsAfter'), 1);
  assert.equal(run('r.teammateLeg.secondBaseSecondThrow'), 'completed');
  assert.equal(run('m.outs'), 2);
  assert.deepEqual(json('m.runners'), [null, null, null]);
  assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.DP'), 1);
});
test('SS-05 weak pivot: first out retained, batter safe, no fictitious second out', () => {
  run('var m=ssFixture({occupied:1,batterSpeed:7,pivotWeak:true});var batter=m.currentBatter;var r=ssApply(m,"challenge",.5);');
  assert.equal(run('r.outsCreated'), 1);
  assert.equal(run('r.executionQuality'), 'partial');
  assert.equal(run('r.teammateLeg.secondBasePivot'), 'notCompleted');
  assert.equal(run('r.responsibleActor'), 'teammate');
  assert.equal(run('r.defensiveOutcomeExplanation.responsibleActor'), 'teammate');
  assert.deepEqual(json('m.runners'), [run('batter'), null, null]);
});
test('SS-06 weak throw / fast runner: safe first and safe second do not manufacture outs', () => {
  for (const decision of ['secure', 'forceSecond']) {
    run(`var m=ssFixture({occupied:1,batterSpeed:20,runnerSpeed:20,capabilities:{arm:1,throwing:10}});var r=ssApply(m,${JSON.stringify(decision)});`);
    assert.equal(run('r.outsCreated'), 0);
    assert.equal(run('m.groundBallInPlayState.runnerThrowTiming.timingClassification'), 'runnerClearlyAhead');
    assert.equal(run('r.error'), false);
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
  }
});
test('SS receiver failure retains teammate attribution for direct first throw and DP relay', () => {
  for (const decision of ['secure', 'challenge']) {
    run(`var m=ssFixture({occupied:1,firstBaseWeak:true});var r=ssApply(m,${JSON.stringify(decision)},.5);`);
    assert.equal(run('r.outsCreated'), decision === 'challenge' ? 1 : 0);
    assert.equal(run('r.primaryCause'), 'teammateFirstBaseReceive');
    assert.equal(run('r.responsibleActor'), 'teammate');
    assert.equal(run('r.defensiveOutcomeExplanation.responsibleActor'), 'teammate');
    assert.equal(run('r.playerLeg.firstThrow'), 'completed');
    assert.equal(run('r.error'), false);
  }
});
test('SS-07 fielding / throwing error: no fake out, correct error record and independent decision quality', () => {
  for (const capabilities of [{ fielding: 1, catching: 1 }, { throwing: 1 }]) {
    run(`var m=ssFixture({occupied:1,capabilities:${JSON.stringify(capabilities)}});var r=ssApply(m);`);
    assert.equal(run('r.outsCreated'), 0);
    assert.equal(run('r.error'), true);
    assert.equal(run('m.outs'), 0);
    assert.equal(run('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense.E'), 1);
    assert.equal(run('m.simulationLog.filter(e=>e.type==="plateAppearance").at(-1).result'), 'error');
    assert.notEqual(run('r.decisionQuality'), run('r.executionQuality'));
  }
});
test('SS-08 force third out: no runs, bases clear, normal authority ends half and advances inning', () => {
  run('var m=ssFixture({occupied:3,outs:2});var inning=m.inning;var r=ssApply(m,"forceSecond");');
  assert.equal(run('m.outs'), 3);
  assert.deepEqual(json('m.runners'), [null, null, null]);
  assert.equal(run('m.pendingHalfInningTermination.halfInningEnded'), true);
  assert.deepEqual(json('m.scores'), { home: 1, away: 1 });
  assert.equal(run('r.runsAllowed'), 1, 'raw movement still records the scoring attempt');
  assert.equal(run('r.runnerChanges.find(c=>c.from===3).scored'), true);
  assert.equal(run('m.lastDefensiveResolution.runsAllowed'), 0);
  assert.equal(run('m.lastDefensiveResolution.runnerChanges.find(c=>c.from===3).scored'), false);
  assert.equal(run('m.lastDefensiveResolution.runnerChanges.find(c=>c.from===3).targetBase'), 'home', 'attempted target is retained');
  assert.deepEqual(json('m.groundBallInPlayState.shortstopExecution.resolution'), json('r'));
  run('advanceHighSchoolMatchAfterHalfInning(m);');
  assert.equal(run('m.inning'), run('inning'));
  assert.equal(run('m.half'), '下');
  assert.equal(run('m.outs'), 0);
  // Explicit timing metadata fixtures: verify the existing non-force authority
  // and the shared final projection without inventing a new playable SS route.
  for (const timing of ['beforeThirdOut', 'afterThirdOut']) {
    run(`var timingCase=(()=>{
      const raw={outsCreated:1,runnersAfter:[null,null,null],scoringRunnerIds:["scorer"],runsAllowed:1,
        scoringAttempts:[{runnerId:"scorer",timing:${JSON.stringify(timing)}}],
        orderedRetirements:[{runnerId:"tagged",targetBase:"third",outType:"nonForceTag",sequence:1}],
        runnerChanges:[{runnerId:"scorer",from:3,to:"home",targetBase:"home",scored:true,committed:true},
          {runnerId:"tagged",from:2,to:"out",targetBase:"out",scored:false}]};
      const snapshot=JSON.stringify(raw),truth=finalizeHighSchoolDefensiveThirdOut({},
        {outs:2,runners:[null,"tagged","scorer"]},raw);
      return {truth,changes:normalizeHighSchoolTerminalRunnerChanges(raw,truth),rawUnchanged:JSON.stringify(raw)===snapshot};
    })();`);
    const result = json('timingCase'), awarded = timing === 'beforeThirdOut';
    assert.equal(result.truth.thirdOutType, 'nonForceTag');
    assert.deepEqual(result.truth.legalScoringRunnerIds, awarded ? ['scorer'] : []);
    assert.equal(result.changes[0].scored, awarded);
    assert.equal(result.changes[0].to, awarded ? 'home' : 'halfInningEnd');
    assert.equal(result.changes[0].targetBase, 'home');
    assert.equal(result.rawUnchanged, true);
  }
});
test('SS-09 repeated execution/submission/settlement cannot reroll or change match/record', () => {
  run('var m=ssFixture({occupied:1});var r=ssExecute(m,"forceSecond");var saved=ssFacts(m);');
  run('var again=resolveHighSchoolDefensivePlay(m,"forceSecond",()=>{throw Error("reroll");});');
  assert.deepEqual(json('again'), json('r'));
  assert.throws(() => run('resolveHighSchoolDefensivePlay(m,"secure",()=>{throw Error("reroll");})'), /Stale/);
  run('applyInfieldResolutionToHighSchoolMatch(m,"forceSecond",r);var once=ssFacts(m);applyInfieldResolutionToHighSchoolMatch(m,"forceSecond",r);applyHighSchoolDefensiveSettlementFacts(m,m.groundBallInPlayState.playSettlement);');
  assert.equal(run('ssFacts(m)'), run('once'));
});
test('SS-10 left throwing high school actor cannot enter active SS assignment', () => {
  // Supply handedness before the Opportunity owner decides the legal assignment.
  run('stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;player=createRepresentativeHighSchoolEntryFixture("ordinary",77001);applyCanonicalPositionProfile(player,"游擊手",[]);player.throws="L";player.age=16;player.chapter="青棒";player.highSchoolStep=5;applyHighSchoolRoleState("starter");player.flags.push("direct_start_history");pendingHighSchoolMatchPositionOverride="";prepareHighSchoolYearOneMatch();');
  assert.equal(run('player.highSchoolMatch.rosters.home.lineup.some(a=>a.id==="player"&&TeamRosterFoundation.normalizePosition(a.position)==="SS")'), false);
  assert.notEqual(run('player.highSchoolMatch.playerFieldingAssignment'), '游擊手');
  assert.equal(run('player.highSchoolMatch.gameExposureState.opportunitySnapshot.positionFallbackApplied'), true);
  assert.equal(run('player.primaryPosition'), '游擊手');
  run('playCareerMatchToEnd();');
  assert.equal(run('player.highSchoolMatch.completed'), true);
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch)'), []);
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'), []);
});
test('SS-11 non-SS and right-side physical ball never create SS execution', () => {
  run('var m=ssFixture({position:"二壘手",direction:.95});var r=ssApply(m);');
  assert.equal(run('m.groundBallInPlayState.shortstopExecution===undefined'), true);
  run('var m=ssFixture({direction:.95});');
  assert.equal(run('m.groundBallInPlayState.supported'), false);
  assert.equal(run('m.activeSituation===null'), true);
  assert.equal(run('m.simulationLog.filter(e=>e.type==="plateAppearance").length'), 1);
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
  // The same final scoring projection serves meaningful and density-suppressed
  // routine 2B plays. These are declared production fixtures using real actors.
  for (const routine of [false, true]) for (const outs of [0, 2]) {
    run(`var m=ssFixture({position:"二壘手",direction:.95,occupied:3,outs:${outs}});
      var beforeScoring=m.scores.away;var beforeRecord=m.gameRecord.totals.away.runs;
      var r=${routine ? 'resolveRoutineDefensivePlay(m,m.defensiveSituation,()=>.8,{densitySuppressed:true})' : 'ssExecute(m,"secure")'};
      var rawBefore=JSON.stringify(r);var executionBefore=JSON.stringify({stage:m.groundBallInPlayState.decisionThrowState,timing:m.groundBallInPlayState.runnerThrowTiming});
      ${routine ? 'applyRoutineDefensiveResolutionToHighSchoolMatch(m,r)' : 'applyInfieldResolutionToHighSchoolMatch(m,"secure",r)'};
      var finalEvent=m.simulationLog.findLast(e=>e.type===${JSON.stringify(routine ? 'playerRoutinePlay' : 'defensiveResolution')});
      var finalEvidence=MatchExperienceDevelopment.deriveMatchExperienceEvidence(m).filter(e=>e.evidenceType==="active"
        &&e.situation.playFamily===${JSON.stringify(routine ? 'secondBaseRoutine' : 'secondBaseMeaningful')});`);
    const legalRuns = outs === 0 ? 1 : 0, event = json('finalEvent');
    assert.equal(run('m.groundBallInPlayState.shortstopExecution===undefined'), true);
    assert.equal(run('m.scores.away-beforeScoring'), legalRuns);
    assert.equal(run('m.gameRecord.totals.away.runs-beforeRecord'), legalRuns);
    assert.equal(event.runsAllowed, legalRuns);
    assert.equal(run('m.lastDefensiveResolution.runsAllowed'), legalRuns);
    assert.deepEqual(event.scoringRunnerIds, json('m.lastDefensiveResolution.thirdOutResolution.legalScoringRunnerIds'));
    assert.deepEqual(event.runnerChanges, json('m.lastDefensiveResolution.runnerChanges'));
    assert.deepEqual(json('m.lastDefensiveResolution.runnersAfter'), json('m.runners'));
    assert.equal(event.runnerChanges.find(c => c.from === 3).scored, legalRuns === 1);
    assert.equal(event.runnerChanges.find(c => c.from === 3).targetBase, 'home');
    const evidence = json('finalEvidence'); assert(evidence.length);
    for (const e of evidence) assert.equal(e.outcomeEvidence.runsAllowed, legalRuns);
    assert.equal(run('JSON.stringify(r)'), run('rawBefore'));
    assert.equal(run('JSON.stringify({stage:m.groundBallInPlayState.decisionThrowState,timing:m.groundBallInPlayState.runnerThrowTiming})'), run('executionBefore'));
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'), []);
    const cached = json('m.lastDefensiveResolution');
    run('var settled=ssFacts(m);saveGame();player=createInitialPlayer("2B evidence reload");loadGame();m=player.highSchoolMatch;');
    assert.equal(run('ssFacts(m)'), run('settled'));
    assert.deepEqual(json('m.lastDefensiveResolution'), cached);
    run(routine ? 'applyRoutineDefensiveResolutionToHighSchoolMatch(m,r)' : 'applyInfieldResolutionToHighSchoolMatch(m,"secure",r)');
    assert.equal(run('ssFacts(m)'), run('settled'));
    console.log('NON_SS_SCORING_WITNESS ' + JSON.stringify({ routine, outsBefore: outs, legalRuns,
      eventRunsAllowed: event.runsAllowed, cacheRunsAllowed: run('m.lastDefensiveResolution.runsAllowed'),
      rawRunsAllowed: run('r.runsAllowed'), scored: event.runnerChanges.find(c => c.from === 3).scored,
      evaluationRecords: evidence.length, saveReloadEquivalent: true, duplicateSettlementNoMutation: true }));
  }
});
test('SS-12 live, executed, failed-control and settled reloads preserve identity; no replay after settlement', () => {
  for (const capabilities of [{}, { fielding: 1, catching: 1 }]) {
    run(`var m=ssFixture({occupied:1,capabilities:${JSON.stringify(capabilities)}});var before=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;`);
    assert.deepEqual(json('before.activeSituation'), json('m.activeSituation'));
    run('var r=ssExecute(m);saveGame();player=createInitialPlayer("Different reload context");loadGame();var restored=player.highSchoolMatch;');
    assert.deepEqual(json('restored.groundBallInPlayState.shortstopExecution'), json('m.groundBallInPlayState.shortstopExecution'));
    run('player.highSchoolMatch=restored;resumeResolvedHighSchoolGroundBallSettlement(restored);var once=ssFacts(restored);var settled=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;');
    assert.equal(run('ssFacts(settled)'), run('once'));
    run('player.highSchoolMatch=settled;saveGame();player=createInitialPlayer("Different settled reload context");loadGame();var settled=player.highSchoolMatch;applyInfieldResolutionToHighSchoolMatch(settled,"secure",r);');
    assert.equal(run('ssFacts(settled)'), run('once'));
  }
});
test('SS saved timing, route, receiver and source context tampering rejects before mutation', () => {
  for (const mutation of ['runnerThrowTiming.timingMargin=99', 'decisionThrowState.throwResolution.receiverId="bench"', 'shortstopExecution.sample=NaN']) {
    run('var m=ssFixture({occupied:1});ssExecute(m);var bad=JSON.parse(JSON.stringify(player));');
    run('bad.highSchoolMatch.groundBallInPlayState.' + mutation);
    assert.throws(() => run('normalizeSave(bad)'), /Stale|Invalid/);
  }
});
test('SS execution rebuild is deterministic, reads no RNG and mutates no source or match authority', () => {
  run('var m=ssFixture({occupied:1});var choice=getHighSchoolDefensiveMomentChoices(m).find(c=>c.matchDecision==="challenge");var source=JSON.stringify(player);var cursor=m.simulationCursor;var originalRandom=Math.random;Math.random=()=>{throw Error("unexpected SS rebuild RNG");};');
  try {
    run('var first=buildHighSchoolShortstopExecution(m,m.defensiveSituation,choice,.8);var second=buildHighSchoolShortstopExecution(m,m.defensiveSituation,choice,.8);');
    assert.deepEqual(json('second'), json('first'));
    assert.equal(run('JSON.stringify(player)'), run('source'));
    assert.equal(run('m.simulationCursor'), run('cursor'));
    assert.equal(run('m.outs'), 0);
    assert.equal(run('m.runners[0]!==null'), true);
  } finally { run('Math.random=originalRandom;'); }
});
test('SS mutex retains any open situation before creating another defense', () => {
  run('var m=ssFixture({occupied:1});var open=JSON.stringify(m.activeSituation);var before=ssFacts(m);prepareHighSchoolDefensiveMomentFromSimulation(m);');
  assert.equal(run('JSON.stringify(m.activeSituation)'), run('open'));
  assert.equal(run('ssFacts(m)'), run('before'));
  assert.equal(run('player.primaryPosition'), '游擊手');
  assert.equal(run('m.developmentPositionOverride||""'), '');
  run('m.activeSituation=MatchSituationLifecycle.createSituation({situationId:"ss-mutex-plate",type:MatchSituationLifecycle.TYPES.plateDecision,actor:{id:"player",position:"游擊手"}});var open=JSON.stringify(m.activeSituation);prepareHighSchoolDefensiveMomentFromSimulation(m);');
  assert.equal(run('JSON.stringify(m.activeSituation)'), run('open'));
});
test('one-match development SS override preserves career position and capability truth', () => {
  // The existing development entry owns the Year 1 direct-start override.
  // Year 3 consumes an already assigned Competition opportunity instead.
  run('stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;player=createRepresentativeHighSchoolEntryFixture("ordinary",77001);applyCanonicalPositionProfile(player,"二壘手",[]);player.age=16;player.chapter="青棒";player.highSchoolStep=5;applyHighSchoolRoleState("starter");player.flags.push("direct_start_history");var profile=player.primaryPosition;var skills=JSON.stringify(player.baseballSkills);pendingHighSchoolMatchPositionOverride="游擊手";pendingHighSchoolMatchSimulationSeed=77001;var override=prepareHighSchoolYearOneMatch();');
  assert.equal(run('override.developmentPositionOverride'), '游擊手');
  assert.equal(run('player.primaryPosition'), run('profile'));
  assert.equal(run('JSON.stringify(player.baseballSkills)'), run('skills'));
  assert.equal(run('TeamRosterFoundation.getCurrentDefender(override.rosters.home,"SS").id'), 'player');
});
test('SS evaluation separates decision, execution, outcome and stage evidence using existing owner', () => {
  run('var m=ssFixture({occupied:1,capabilities:{throwing:1}});ssApply(m);var evidence=MatchExperienceDevelopment.deriveMatchExperienceEvidence(m);');
  const active = json('evidence').filter(e => e.evidenceType === 'active' && e.situation.playFamily === 'shortstopMeaningful');
  assert(active.length >= 4);
  assert(active.some(e => e.skillEvidence.component === 'decision'));
  assert(active.some(e => e.skillEvidence.component === 'execution'));
  for (const e of active) assert(e.decisionEvidence && e.executionEvidence && e.outcomeEvidence);
});
test('complete production matches generate SS ground decisions, routine plays, finalized record and settled evaluation', () => {
  // Predeclared normal production route; no ball/capability/runner/result override
  // is supplied after the established career fixture creates its legal starter.
  run('careerFixture("游擊手","starter",77001);choose("critical_offseason",1);playCareerMatchToEnd();var full=player.highSchoolMatch;');
  assert.equal(run('full.completed'), true);
  assert.equal(run('full.regulationInnings'), 7);
  assert.equal(run('full.gameRecord.status'), 'final');
  assert.deepEqual(json('full.gameRecord.result.finalScore'), json('full.scores'));
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(full)'), []);
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(full.gameRecord)'), []);
  assert(run('full.simulationLog.some(e=>e.type==="defensiveResolution"&&e.playerPosition==="游擊手")'));
  assert(run('full.simulationLog.some(e=>e.type==="playerRoutinePlay"&&e.playerPosition==="游擊手")'));
  assert(run('full.matchExperience.evidence.some(e=>e.situation.playFamily==="shortstopMeaningful")'));
  assert(run('full.matchExperience.evidence.some(e=>e.situation.playFamily==="shortstopRoutine")'));
  const before = json('player.highSchoolMatch');
  run('saveGame();loadGame();');
  assert.deepEqual(json('player.highSchoolMatch'), before);
  for (const position of ['二壘手', '一壘手', '三壘手']) {
    run(`careerFixture(${JSON.stringify(position)},"starter",77001);choose("critical_offseason",1);playCareerMatchToEnd();var control=player.highSchoolMatch;`);
    assert.equal(run('control.completed'), true);
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(control)'), []);
    assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(control.gameRecord)'), []);
    assert.equal(run('control.simulationLog.some(e=>e.type==="defensiveResolution"&&e.playerPosition==="游擊手")'), false);
  }
});
console.log('SS_FULL_MATCH_WITNESS ' + JSON.stringify(json(`({
  matchId:full.id,completed:full.completed,regulationInnings:full.regulationInnings,
  recordStatus:full.gameRecord.status,scores:full.scores,recordScore:full.gameRecord.result.finalScore,
  meaningful:full.simulationLog.filter(e=>e.type==="defensiveResolution"&&e.playerPosition==="游擊手").length,
  routine:full.simulationLog.filter(e=>e.type==="playerRoutinePlay"&&e.playerPosition==="游擊手").length,
  evaluationFamilies:[...new Set(full.matchExperience.evidence.map(e=>e.situation.playFamily))],
  matchIssues:getHighSchoolMatchStateIntegrityIssues(full),recordIssues:MatchGameRecord.getIntegrityIssues(full.gameRecord)
})`)));

// Closeout gap: each declared scenario must cross the same public choice handler
// as gameplay. Fixture inputs remain explicit; they are not natural witnesses.
const publicScenarios = [
  { name: 'first-base out with runner on first', options: { occupied: 1 }, decision: 'secure', sample: .8, outsCreated: 1 },
  { name: 'force second', options: { occupied: 1 }, decision: 'forceSecond', sample: .8, outsCreated: 1 },
  { name: '6-4-3 double play', options: { occupied: 1 }, decision: 'challenge', sample: .8, outsCreated: 2 },
  { name: 'partial double play', options: { occupied: 1, batterSpeed: 7, pivotWeak: true }, decision: 'challenge', sample: .5, outsCreated: 1, partial: true },
  { name: 'throwing failure', options: { occupied: 1, capabilities: { throwing: 1 } }, decision: 'secure', sample: .8, outsCreated: 0, error: true },
  { name: 'force third out cancels attempted run', options: { occupied: 3, outs: 2 }, decision: 'forceSecond', sample: .8, outsCreated: 1, thirdOut: true }
];
for (const scenario of publicScenarios) test('public production handler: ' + scenario.name, () => {
  run(`var m=ssFixture(${JSON.stringify(scenario.options)});var beforeOuts=m.outs;var beforeScores={...m.scores};
    var beforeRecordRuns={home:m.gameRecord.totals.home.runs,away:m.gameRecord.totals.away.runs};var scoringAttemptRunner=m.runners[2];
    for(var beat=0;beat<m.simulationLog.length&&!isHighSchoolMatchDecisionVisible(m);beat++) advanceHighSchoolPresentationCursor(m);
    var publicChoice=getHighSchoolYearOneMatchMomentChoices(m).find(c=>c.matchDecision===${JSON.stringify(scenario.decision)});`);
  assert.equal(run('getCurrentEventId()'), 'critical_tournament');
  assert.equal(run('m.id'), 'hs-y3-final-competition-1');
  assert.equal(run('isHighSchoolMatchDecisionVisible(m)'), true);
  assert(run('!!publicChoice'), 'public legal choice exists');
  if (scenario === publicScenarios[0]) {
    const pendingState = '({active:m.activeSituation,ground:m.groundBallInPlayState,defense:m.defensiveSituation,facts:ssFacts(m),cursor:m.simulationCursor})';
    const pending = json(pendingState), choice = json('publicChoice');
    run('saveGame();player=createInitialPlayer("Public SS pending reload");loadGame();m=player.highSchoolMatch;');
    assert.deepEqual(json(pendingState), pending);
    assert.equal(run('isHighSchoolMatchDecisionVisible(m)'), true);
    run(`publicChoice=getHighSchoolYearOneMatchMomentChoices(m).find(c=>c.matchDecision===${JSON.stringify(scenario.decision)});`);
    assert.deepEqual(json('publicChoice'), choice);
  }
  assert.equal(run(`chooseHighSchoolYearOneMatchMoment(publicChoice.matchDecision,publicChoice.matchMomentId,()=>${scenario.sample})`), true);
  run(`var settledMoment=m.completedMoments.at(-1);var settledEvent=m.simulationLog.findLast(e=>e.type==="defensiveResolution"&&e.playerPosition==="游擊手");
    var settledEvidence=MatchExperienceDevelopment.deriveMatchExperienceEvidence(m).filter(e=>e.evidenceType==="active"
      &&e.situation.playFamily==="shortstopMeaningful"&&e.sourceSnapshot.momentId===settledMoment.id);`);
  const moment = json('settledMoment'), event = json('settledEvent'), evidence = json('settledEvidence');
  const rawExecution = json('m.groundBallInPlayState.shortstopExecution');
  const finalCache = json('m.lastDefensiveResolution');
  assert.equal(run('m.outs'), run('beforeOuts') + scenario.outsCreated);
  assert.equal(moment.outsCreated, scenario.outsCreated);
  assert.equal(event.outsCreated, scenario.outsCreated);
  assert.equal(moment.error, scenario.error === true);
  assert.equal(run('m.groundBallInPlayState.playSettlement.settlementApplied'), true);
  assert.equal(run('m.lastClosedSituationSummary.lifecycleState'), 'closed');
  assert.equal(event.decisionProvenance.decidedBy, 'player');
  assert(event.decisionIdentity && event.physicalIdentity && event.availableOptions.length);
  assert.deepEqual(event.scoringRunnerIds, moment.scoringRunnerIds);
  assert.deepEqual(finalCache.scoringRunnerIds, event.scoringRunnerIds);
  assert.deepEqual(json('m.lastDefensiveResolution.runnerChanges'), event.runnerChanges);
  assert.deepEqual(moment.runnerChanges, event.runnerChanges);
  assert.deepEqual(json('m.lastDefensiveResolution.runnersAfter'), json('m.runners'));
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'), []);
  assert(run('m.gameRecord.eventRefs.some(e=>e.sequence===settledEvent.sequence)'));
  for (const side of ['home', 'away']) assert.equal(run(`m.gameRecord.totals.${side}.runs-beforeRecordRuns.${side}`),
    run(`m.scores.${side}-beforeScores.${side}`), 'GameRecord run delta must match Match State');
  const defense = json('MatchGameRecord.getPlayerGameLine(m.gameRecord,"player").defense');
  assert.equal(defense.A, scenario.outsCreated > 0 ? 1 : 0);
  assert.equal(defense.DP, scenario.outsCreated === 2 ? 1 : 0);
  assert.equal(defense.E, scenario.error === true ? 1 : 0);
  assert(evidence.length >= 4);
  assert(evidence.some(e => e.skillEvidence.component === 'decision'));
  assert(evidence.some(e => e.skillEvidence.component === 'execution'));
  for (const e of evidence) {
    assert(e.decisionEvidence && e.executionEvidence && e.outcomeEvidence);
    assert.equal(e.outcomeEvidence.outsCreated, moment.outsCreated);
    assert.equal(e.outcomeEvidence.error, moment.error);
    assert.equal(e.outcomeEvidence.runsAllowed, moment.runsAllowed);
  }
  if (scenario.partial) {
    assert.equal(moment.executionQuality, 'partial');
    assert.equal(moment.responsibleActor, 'teammate');
    assert.equal(run('m.runners[0]!==null'), true);
  }
  if (scenario.thirdOut) {
    assert.deepEqual(json('m.scores'), json('beforeScores'));
    assert.deepEqual(json('m.runners'), [null, null, null]);
    assert.equal(moment.runsAllowed, 0);
    assert.deepEqual(moment.thirdOutResolution.legalScoringRunnerIds, []);
  }
  run('var settledFacts=ssFacts(m);');
  assert.equal(run('chooseHighSchoolYearOneMatchMoment(publicChoice.matchDecision,publicChoice.matchMomentId,()=>{throw Error("public repeat reroll");})'), false);
  assert.equal(run('ssFacts(m)'), run('settledFacts'));
  assert.deepEqual(json('m.groundBallInPlayState.shortstopExecution'), rawExecution, 'repeat submission preserves raw Execution/Timing facts');
  // Publicly settled state must survive the real save/load path without replay.
  run('saveGame();player=createInitialPlayer("Public SS settled reload");loadGame();m=player.highSchoolMatch;');
  assert.equal(run('ssFacts(m)'), run('settledFacts'));
  assert.deepEqual(json('m.lastDefensiveResolution'), finalCache, 'save/load preserves final cached scoring facts');
  assert.deepEqual(json('m.groundBallInPlayState.shortstopExecution'), rawExecution, 'save/load preserves raw Execution/Timing facts');
  assert.equal(run('chooseHighSchoolYearOneMatchMoment(publicChoice.matchDecision,publicChoice.matchMomentId,()=>{throw Error("reloaded public repeat reroll");})'), false);
  assert.equal(run('ssFacts(m)'), run('settledFacts'));
  console.log('SS_PUBLIC_WITNESS ' + JSON.stringify({ scenario: scenario.name, evidenceOrigin: 'EXPLICIT_PRODUCTION_FIXTURE_PUBLIC_HANDLER',
    matchId: run('m.id'), outs: run('m.outs'), scores: json('m.scores'),
    gameRecordRunDelta: json('({home:m.gameRecord.totals.home.runs-beforeRecordRuns.home,away:m.gameRecord.totals.away.runs-beforeRecordRuns.away})'),
    defense, evidenceRecords: evidence.length,
    momentRunsAllowed: moment.runsAllowed, eventRunsAllowed: event.runsAllowed,
    resolutionRunsAllowed: run('m.lastDefensiveResolution.runsAllowed'), scoringRunnerIds: event.scoringRunnerIds,
    attemptedScorer: scenario.thirdOut ? event.runnerChanges.find(c => c.runnerId === run('scoringAttemptRunner')) : null,
    pendingColdReloadValidated: scenario === publicScenarios[0], saveReloadEquivalent: true, duplicateSubmissionNoMutation: true }));
  // Final settled evidence must agree with the third-out authority, including a
  // scoring attempt canceled by a force third out. Keep this regression visible.
  assert.equal(event.runsAllowed, moment.runsAllowed, 'defensive event runsAllowed must match legal settled runs');
  assert.equal(run('m.lastDefensiveResolution.runsAllowed'), moment.runsAllowed, 'cached resolution must match legal settled runs');
  if (scenario.thirdOut) assert.equal(event.runnerChanges.find(c => c.runnerId === run('scoringAttemptRunner')).scored, false,
    'a canceled scoring attempt is not a scored runner');
});
console.log(JSON.stringify({ suite: 'ss-defensive-production-integration', passed, failed: 0, evidenceOrigin: 'EXPLICIT_PRODUCTION_FIXTURES' }));
