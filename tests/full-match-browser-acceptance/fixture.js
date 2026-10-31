// Independent test page: this is the sole setup boundary. After setup it exposes
// only the production DOM; no fixture control advances or resolves a live match.
(() => {
  const params = new URLSearchParams(location.search);
  const section=document.createElement('section');
  section.id='acceptanceSetup';
  const button=document.createElement('button');button.textContent='建立已登記測試局面';
  section.append(button);document.body.prepend(section);
  button.addEventListener('click',()=>{
    const position=params.get('position')||'捕手', scenario=params.get('scenario')||'full';
    loadTestBookmark('highSchool');
    applyCanonicalPositionProfile(player,position,[]);
    player.highSchoolStep=5;
    applyHighSchoolRoleState(scenario==='substitution'?'rotation':'starter');
    if(scenario==='no-appearance') Object.assign(player.body,{fatigue:20,pain:20,injuryRisk:20});
    pendingHighSchoolMatchSimulationSeed=49186;
    let opportunity;
    if(scenario==='substitution') opportunity=PlayingTimeGameExposure.resolveStartingOpportunity({
      matchId:'hs-y1-autumn-exhibition',readinessSnapshot:createHighSchoolOpportunityReadinessSnapshot(position,player),
      opportunitySeed:'browser-substitution-v1',stableVariationSeed:'browser-substitution-v1',actualRole:'rotation',
      coachUsageStyle:'developmental',playingTimeEnvironment:'medium',competitionDepth:'medium',positionNeed:'medium',
      health:player.body,coachTrust:player.relationships.coachTrust,
      gameContext:{gameType:'highSchoolExhibition',importance:'regular',leverage:'normal',inning:0,scoreMargin:0}});
    const m=prepareHighSchoolYearOneMatch({confirmHealthReadiness:true,...(opportunity?{opportunityDecision:opportunity}:{})});
    if(scenario==='bunt') {
      // An independent defensive-entry boundary, not a fabricated completed PA.
      // The normal opener waits for the first offensive task before admitting
      // detailed defensive pitches; fixtures must enter that defensive owner.
      m.inning=2;m.simulationPhase='moment_1_resolved';m.currentDomain='flow';
      const pace=Number(params.get('pace')||0),placement=Number(params.get('placement')||0);
      // The original pitch owner produces the contact from registered inputs.
      // No catch, throw, retirement, PA settlement or event ref is supplied.
      prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:'surpriseBunt',buntPitchOptions:{
        actualPitch:{pitchLocationClass:'competitiveStrike',strike:true},
        recognition:{correct:true,perceivedPitchClass:'competitiveStrike'},
        rolls:{attempt:0,preparation:0,contact:.99,fairBallType:params.get('pop')==='1'?0:.9,
          pace:[.125,.375,.625,.875][pace],placement:[.125,.375,.625,.875][placement]}}});
    }
    window.acceptanceFixture={scenario,position,registeredSeed:49186,actualSeed:m.simulationSeed,
      opportunity:m.gameExposureState?.opportunitySnapshot,initial:JSON.parse(JSON.stringify(m))};
    section.remove();document.getElementById('characterCreation').hidden=true;
    document.body.classList.remove('creation-mode');
    showCurrentEvent();
    resumeHighSchoolMatchPlayback('browser-fixture-initialized',m);
  },{once:true});
})();
