const assert=require("assert");
const {makeContext}=require("./high-school-career-test-context.js");
const {run,json}=makeContext();
let passed=0;function test(name,fn){fn();passed++;console.log(`PASS ${name}`);}
run(`
  function decisionMatch() {
    careerFixture("二壘手","starter");choose("critical_offseason",1);const m=player.highSchoolMatch;player.throws="R";
    const base=m.rosters.home.teamRoster;
    const roster=base.starters.some(a=>a.id==="player")?base:TeamRosterFoundation.injectPlayerIntoRoster(base,
      createHighSchoolRosterPlayerActor(player,"二壘手"),{playerRole:"starter",playerPosition:"二壘手"});
    m.rosters.home=TeamRosterFoundation.toMatchRoster(roster,TeamStrengthModel.deriveTeamStrengthProfile(roster));
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:[m.rosters.away.lineup[1].id,null,null],
      scores:{home:1,away:1},simulationPhase:"moment_1_resolved",currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",
      playerFieldingAssignment:"二壘手",developmentPositionOverride:"二壘手",position:"二壘手",defensiveSituation:{},activeSituation:null,
      groundBallInPlayState:null,lineDriveCatchState:null,flyBallCatchState:null});
    m.playerLineupSlot=m.rosters.home.lineup.findIndex(a=>a.id==="player");m.battingOrderIndex.away=2;m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id;
    getHighSchoolMatchSimulationEntity(m,m.currentBatter).power=4;
    prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"standardAttack",
      situationOverrides:{playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10}},
      ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,
        physicalRolls:{contactQuality:.65,ballType:.1,pace:.68,direction:.95,depth:0},outcomeRoll:.5}});
    return m;
  }
  function facts(m){return JSON.stringify({outs:m.outs,runners:m.runners,scores:m.scores,order:m.battingOrderIndex,logs:m.simulationLog});}
  function executeDecision(m,route="secureFirstBaseOut") {
    const choice=getHighSchoolDefensiveMomentChoices(m).find(c=>c.routeId===route);if(!choice)throw Error("missing fixture choice "+route);
    let samples=0;const resolution=resolveHighSchoolDefensivePlay(m,choice.matchDecision,()=>{samples++;return .8;});
    const before=facts(m);beginGroundBallSituationDecision(m,choice.matchDecision);recordGroundBallSituationResolution(m,resolution);
    return {choice,resolution,before,samples};
  }
`);
test("pre-control pause preserves intent only, not invented controlled possession",()=>{
  run("var m=decisionMatch();var paused=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;");
  assert.equal(run("getHighSchoolControlledDefensiveRoutes(m)"),null);
  assert.equal(run("m.groundBallInPlayState.decisionThrowState===undefined"),true);
  assert.deepEqual(json("paused.activeSituation.legalRoutes"),json("m.activeSituation.legalRoutes"));
});
test("production first throw links controlled decision and active receiver without second RNG",()=>{
  run("var execution=executeDecision(m);var stage=m.groundBallInPlayState.decisionThrowState;");
  assert.equal(run("execution.samples"),1);assert.equal(run("stage.selection.route.routeId"),"secureFirstBaseOut");
  assert.equal(run("stage.throwResolution.receiverId"),run('TeamRosterFoundation.getCurrentDefender(m.rosters.home,"1B").id'));
  assert.equal(run("stage.throwResolution.variationEvidence.consumed"),false);
  assert.equal(run("stage.throwResolution.inputs.firstThrow"),run("execution.resolution.playerLeg.firstThrow"));
  assert.equal(run("facts(m)===execution.before"),true);
});
test("production post-control surface exposes canonical hold, first, force and DP",()=>{
  const ids=json("getHighSchoolControlledDefensiveRoutes(m).availableRoutes.map(r=>r.routeId)");
  for(const id of ["holdBall","secureFirstBaseOut","forceSecond","initiate463"])assert.ok(ids.includes(id));
});
test("unsettled result reload preserves selection and throw with no reroll",()=>{
  run("var stored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;var beforeStored=JSON.stringify(stored.groundBallInPlayState.decisionThrowState);recordGroundBallSituationResolution(stored,execution.resolution);");
  assert.equal(run("JSON.stringify(stored.groundBallInPlayState.decisionThrowState)===beforeStored"),true);
  assert.deepEqual(json("stored.groundBallInPlayState.decisionThrowState"),json("stage"));
});
test("saved decision rejects changed runners, movement and receiver identity",()=>{
  run("var bad=JSON.parse(JSON.stringify(player));bad.highSchoolMatch.runners[0]=null;");
  assert.throws(()=>run("normalizeSave(bad)"),/stale|runner|force chain/);
  run('bad=JSON.parse(JSON.stringify(player));bad.highSchoolMatch.groundBallInPlayState.decisionThrowState.throwResolution.receiverId="bench";');
  assert.throws(()=>run("normalizeSave(bad)"),/stale throw/);
  run('bad=JSON.parse(JSON.stringify(player));bad.highSchoolMatch.groundBallInPlayState.decisionThrowState.opportunity.context.outs=2;');
  assert.throws(()=>run("normalizeSave(bad)"),/stale opportunity/);
});
test("existing downstream settlement remains exactly once",()=>{
  run("applyInfieldResolutionToHighSchoolMatch(m,execution.choice.matchDecision,execution.resolution);var once=JSON.stringify(m);applyInfieldResolutionToHighSchoolMatch(m,execution.choice.matchDecision,execution.resolution);");
  assert.equal(run("JSON.stringify(m)===once"),true);assert.equal(run("m.groundBallInPlayState.settlementApplied"),true);
  assert.equal(run("getHighSchoolControlledDefensiveRoutes(m)"),null);
});
test("4-6-3 first throw projection retains continuation boundary and teammate result",()=>{
  run('var dp=decisionMatch();var dpExecution=executeDecision(dp,"initiate463");var dpStage=dp.groundBallInPlayState.decisionThrowState;');
  assert.equal(run("dpStage.selection.route.continuation.status"),"pendingExistingOrFutureSecondLeg");
  assert.equal(run("dpStage.throwResolution.receiverPosition"),"SS");
  assert.equal(run("dpStage.throwResolution.inputs.firstThrow"),run("dpExecution.resolution.playerLeg.firstThrow"));
  assert.equal(run("dpStage.throwResolution.accuracyMargin"),null);
});
test("bobble reassessment retains original selection and actual first-throw route",()=>{
  run('var bobble=decisionMatch();bobble.defensiveSituation.executionChange="bobble";var b=executeDecision(bobble,"initiate463");var bs=bobble.groundBallInPlayState.decisionThrowState;');
  assert.equal(run("bs.selection.route.routeId"),"initiate463");
  assert.equal(run("bs.activeSelection.route.routeId"),run("b.resolution.activeRoute"));
  assert.equal(run("bs.throwResolution.routeId"),run("b.resolution.activeRoute"));
  assert.equal(run("bs.throwResolution.inputs.sourceLeg"),"fallbackRelease");
  assert.equal(run("bs.throwResolution.inputs.fallbackRelease"),run("b.resolution.playerLeg.fallbackRelease"));
  assert.equal(run("bs.throwResolution.throwAttempted"),true);
});
test("failed control never fabricates a controlled throw despite pre-control intent",()=>{
  run('var failed=decisionMatch();failed.defensiveSituation.windows={...failed.defensiveSituation.windows,fielding:-20};var f=executeDecision(failed);var fs=failed.groundBallInPlayState.decisionThrowState;');
  assert.equal(run("fs.opportunity.status"),"noControlledDecision");assert.equal(run("fs.selection"),null);assert.equal(run("fs.throwResolution"),null);
});
for(const position of ["游擊手","三壘手","二壘手"])test(`${position}: actual legacy surface fixes held-third home route at two outs`,()=>{
  run(`var legacy=decisionMatch();legacy.runners=[null,null,legacy.rosters.away.lineup[2].id];legacy.outs=2;
    setHighSchoolDefensiveBallContext(legacy,"normalGrounder");
    function homeOptions(progress){buildInfieldMeaningfulMoment(legacy,player,{playerPosition:${JSON.stringify(position)},primaryFielderPosition:${JSON.stringify(position)},
      ballDepth:"normal",ballDirection:"straightAtPlayer",runnerMovementProgress:{2:progress},runnerTargets:{2:"home"},
      playerCapabilities:{fielding:10,reaction:10,range:10,arm:10,throwing:10,decision:10},routeWindowOverrides:{homeOutWindow:"normal"}});
      return generateInfieldLegalChoices(legacy.defensiveSituation,legacy).some(c=>c.infieldRoute==="tagHome");}`);
  assert.equal(run('homeOptions("holding")'),false);assert.equal(run('homeOptions("committed")'),true);
});
console.log(`${passed}/${passed} PASS`);
