const assert=require("assert"),{makeContext}=require("./high-school-career-test-context");
function fixture(origin="awayInvitationFriendly",trace=false) {
  const h=makeContext();h.context.flushBlockerTransitions=h.flushTransitions;
  h.run(`
    careerFixture("二壘手","starter");choose("critical_offseason",1);player.highSchoolMatch=null;
    var playingTime=JSON.parse(JSON.stringify(ensureHighSchoolYearThreeOpportunity()));
    // Preserve the original reproducer's decision identity and therefore seed 495886132.
    playingTime.decisionId+="|exchange-fixture-start";playingTime.plannedUsage.appearanceType="start";
    var m=prepareHighSchoolYearOneMatch({matchId:playingTime.matchId,eventId:"critical_tournament",highSchoolYear:3,
      matchType:"final-competition",opportunityDecision:playingTime,opponentRosterId:"hs-y3-final-regional-opponent",
      matchContext:{matchOrigin:${JSON.stringify(origin)},provenance:{source:"matchInvitation",sourceId:"blocker-regression"}}});
    var boundaries=[],originalRecord=recordGroundBallSituationResolution;
    recordGroundBallSituationResolution=function(match,resolution) {
      var before=match.activeSituation?.lifecycleState;
      var result=originalRecord(match,resolution);
      if(before==="executing"&&result?.lifecycleState==="resolved"&&result.resolution?.executionEvidence)
        boundaries.push(JSON.stringify(player));
      return result;
    };
    function blockerStep() {
      flushBlockerTransitions();
      if(pendingYouthSeasonOutcome)continueYouthSeasonOutcome();
      if(isHighSchoolMatchDecisionVisible(m)) {
        var c=getHighSchoolYearOneMatchMomentChoices(m)[0];
        if(!c)throw new Error("No legal decision");
        chooseHighSchoolYearOneMatchMoment(c.matchDecision,c.matchMomentId,()=>.62);
      } else advanceHighSchoolMatchPlaybackStep(m);
    }
    function blockerFinish(){var steps=0;while(!m.completed&&steps++<2500)blockerStep();return steps;}
  `);
  h.run(`setHighSchoolMatchOpportunityDebugEnabled(${trace});`);
  return h;
}
let passed=0;const test=(name,fn)=>{fn();passed++;console.log("PASS "+name);};
const away=fixture();away.run('var steps=blockerFinish();');
test("known seed unchanged",()=>assert.strictEqual(away.run("m.simulationSeed"),495886132));
test("known away path completes within original bound",()=>assert(away.run("m.completed&&steps<=2500"),JSON.stringify(away.json('({inning:m.inning,half:m.half,outs:m.outs,phase:m.simulationPhase,lifecycle:m.activeSituation?.lifecycleState,settlement:m.activeSituation?.settlement})'))));
test("known away record integrity",()=>assert(away.run("MatchGameRecord.assertIntegrity(m.gameRecord)")));
test("resolved execution boundary captured before canonical mutation",()=>{assert(away.run("boundaries.length>0"));const b=JSON.parse(away.run("boundaries[0]")).highSchoolMatch;assert.strictEqual(b.activeSituation.lifecycleState,"resolved");assert(b.activeSituation.resolution.executionEvidence);assert.deepStrictEqual(b.activeSituation.settlement,{applied:false,identity:""});});
function restoreBoundary(h,text) {h.context.blockerBoundary=text;h.run('player=normalizeSave(JSON.parse(blockerBoundary));m=player.highSchoolMatch;pendingYouthSeasonOutcome=null;isTransitioning=false;');}
const recovery=fixture(),snapshot=away.run("boundaries[0]");restoreBoundary(recovery,snapshot);
recovery.run('var execution=m.activeSituation.resolution.executionEvidence;var previousId=m.activeSituation.situationId;var before=JSON.parse(JSON.stringify(m));advanceHighSchoolMatchPlaybackStep(m);');
test("playback delivers pending routine settlement and closes",()=>{assert.strictEqual(recovery.run("m.activeSituation"),null);assert.strictEqual(recovery.run("m.lastClosedSituationSummary.lifecycleState"),"closed");assert(recovery.run('m.lastClosedSituationSummary.settlementIdentity.startsWith(previousId+"|")'));});
test("outs bases runs match canonical third-out authority",()=>{assert.strictEqual(recovery.run("m.outs"),recovery.run("m.lastDefensiveResolution.thirdOutResolution.outsAfter"));assert.deepStrictEqual(recovery.json("m.runners"),recovery.json("m.lastDefensiveResolution.thirdOutResolution.basesAfter"));assert.strictEqual(recovery.run("m.scores[m.offenseTeam]-before.scores[before.offenseTeam]"),recovery.run("m.lastDefensiveResolution.thirdOutResolution.legalScoringRunnerIds.length"));});
test("applied play settlement has stable identity",()=>{assert(recovery.run("m.groundBallInPlayState.playSettlement.settlementApplied"));assert(recovery.run('typeof m.groundBallInPlayState.playSettlement.identity==="string"&&m.groundBallInPlayState.playSettlement.identity.length>0'));});
test("exactly once repeat apply and recovery",()=>{recovery.run("var once=JSON.stringify(m);applyRoutineDefensiveResolutionToHighSchoolMatch(m,execution);resumeResolvedHighSchoolGroundBallSettlement(m);");assert.strictEqual(recovery.run("JSON.stringify(m)"),recovery.run("once"));});
test("pitcher outs and GameRecord are actually delivered",()=>{const before=recovery.json("before.gameRecord"),after=recovery.json("m.gameRecord");const sum=x=>{if(!x||typeof x!=="object")return 0;return (typeof x.outsRecorded==="number"?x.outsRecorded:0)+Object.values(x).reduce((n,v)=>n+sum(v),0);};assert.strictEqual(sum(after)-sum(before),recovery.run("m.outs-before.outs"));assert(recovery.run("MatchGameRecord.assertIntegrity(m.gameRecord)"));});
test("save reload pending execution settles once without RNG",()=>{restoreBoundary(recovery,snapshot);recovery.run("saveGame();loadGame();stopHighSchoolMatchPlayback();m=player.highSchoolMatch;var savedExecution=m.activeSituation.resolution.executionEvidence;var randomBefore=Math.random;Math.random=()=>{throw new Error('unexpected RNG');};try {advanceHighSchoolMatchPlaybackStep(m);} finally {Math.random=randomBefore;}var settled=JSON.stringify(m);applyRoutineDefensiveResolutionToHighSchoolMatch(m,savedExecution);");assert.strictEqual(recovery.run("JSON.stringify(m)"),recovery.run("settled"));assert.strictEqual(recovery.run("m.activeSituation"),null);});
test("reload after settlement cannot duplicate record",()=>{const record=recovery.json("m.gameRecord");recovery.run("saveGame();loadGame();stopHighSchoolMatchPlayback();m=player.highSchoolMatch;applyRoutineDefensiveResolutionToHighSchoolMatch(m,savedExecution);getHighSchoolMatchPresentation(m);");assert.deepStrictEqual(recovery.json("m.gameRecord"),record);});
test("recovered game resumes and completes",()=>{recovery.run("steps=blockerFinish();");assert(recovery.run("m.completed&&steps<=2500"));assert(recovery.run("MatchGameRecord.assertIntegrity(m.gameRecord)"));});
for(const [label,change] of [["situation","m.activeSituation.situationId+='stale'"],["inning","m.inning++"],["half",'m.half="上"'],["batter",'m.currentBatter="other-batter"'],["bases",'m.runners[0]="other-runner"'],["score","m.scores.home++"],["physical identity",'m.activeSituation.sourcePhysicalStateRef="old-physical"']]) {
  test("reject stale "+label+" before mutation",()=>{restoreBoundary(recovery,snapshot);recovery.run('m.activeSituation=JSON.parse(JSON.stringify(m.activeSituation));'+change+';var staleBefore=JSON.stringify(m);');assert.throws(()=>recovery.run("advanceHighSchoolMatchPlaybackStep(m)"),/Stale|stale/);assert.strictEqual(recovery.run("JSON.stringify(m)"),recovery.run("staleBefore"));});
}
const home=fixture("homeInvitationFriendly");home.run("var steps=blockerFinish();");
test("player-home also completes unchanged seed",()=>{assert.strictEqual(home.run("m.simulationSeed"),495886132);assert(home.run("m.completed&&steps<=2500"));assert(home.run("MatchGameRecord.assertIntegrity(m.gameRecord)"));});
test("completed home and away matches leave no active orphan",()=>{assert.strictEqual(home.run("m.activeSituation"),null);assert.strictEqual(away.run("m.activeSituation"),null);});
test("only current ground-ball handoffs create execution boundaries",()=>{for(const text of [...away.json("boundaries"),...home.json("boundaries")]){const m=JSON.parse(text).highSchoolMatch;assert.strictEqual(m.activeSituation.sourcePhysicalStateRef,m.defensiveSituation.groundBallDefensiveContext.identity);assert.strictEqual(m.groundBallInPlayState.settlementApplied,false);assert.strictEqual(m.activeSituation.createdAt.inning,m.inning);}});
const manual=fixture("homeInvitationFriendly");
manual.run(`
  Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:[m.rosters.away.lineup[1].id,null,null],
    scores:{home:1,away:1},simulationPhase:"moment_1_resolved",currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",
    playerFieldingAssignment:"二壘手",developmentPositionOverride:"二壘手",position:"二壘手",defensiveSituation:{},activeSituation:null,
    groundBallInPlayState:null,lineDriveCatchState:null,flyBallCatchState:null});
  m.battingOrderIndex.away=2;m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id;getHighSchoolMatchSimulationEntity(m,m.currentBatter).power=4;
  prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"standardAttack",
    situationOverrides:{playerCapabilities:{fielding:10,catching:10,reaction:10,range:10,arm:10,throwing:10,decision:10}},
    ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,decisionRoll:0,contactRoll:0,foulRoll:1,
      physicalRolls:{contactQuality:.65,ballType:.1,pace:.68,direction:.95,depth:0},outcomeRoll:.5}});
  var choice=getHighSchoolDefensiveMomentChoices(m).find(c=>c.routeId==="secureFirstBaseOut");
  var resolution=resolveHighSchoolDefensivePlay(m,choice.matchDecision,()=>.8);
  beginGroundBallSituationDecision(m,choice.matchDecision);recordGroundBallSituationResolution(m,resolution);
`);
test("manual resolved state is a legal pre-apply boundary",()=>{assert.strictEqual(manual.run("m.activeSituation.lifecycleState"),"resolved");assert(manual.run("m.activeSituation.resolution.executionEvidence!==null"));assert.strictEqual(manual.run("m.simulationPhase"),"moment_2_ready");});
test("manual reload playback delivers canonical apply and remains idempotent",()=>{manual.run("saveGame();loadGame();stopHighSchoolMatchPlayback();m=player.highSchoolMatch;advanceHighSchoolMatchPlaybackStep(m);var manualOnce=JSON.stringify(m);applyInfieldResolutionToHighSchoolMatch(m,choice.matchDecision,resolution);");assert.strictEqual(manual.run("m.activeSituation"),null);assert.strictEqual(manual.run("JSON.stringify(m)"),manual.run("manualOnce"));assert(manual.run("m.groundBallInPlayState.settlementApplied"));assert(manual.run("MatchGameRecord.assertIntegrity(m.gameRecord)"));});
const replay=fixture(),traced=fixture("awayInvitationFriendly",true);replay.run("blockerFinish();");traced.run("blockerFinish();");
const signature="({scores:m.scores,runners:m.runners,outs:m.outs,gameRecord:m.gameRecord,simulationCursor:m.simulationCursor,completed:m.completed})";
test("same seed deterministic full outcome",()=>assert.deepStrictEqual(replay.json(signature),away.json(signature)));
test("instrumentation does not alter settlement or final result",()=>assert.deepStrictEqual(traced.json(signature),away.json(signature)));
console.log(`${passed}/${passed} PASS`);
