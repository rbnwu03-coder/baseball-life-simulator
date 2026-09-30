const { createHarness, inspectGame } = require('./match-authority-coverage-audit.cjs');
function trajectory(seed, { baseline = false } = {}) {
  const h = createHarness();
  if (baseline) {
    const source = require('child_process').execFileSync('git', ['show', 'f1cc66b:script.js'], { encoding: 'utf8', maxBuffer: 8e6 }).replace(/\r\n?/g, '\n');
    for (const name of ['resolveRoutineDefensivePlay', 'resolveSimulatedHighSchoolPlateAppearance']) {
      const start = source.indexOf('function ' + name + '(');
      h.run(source.slice(start, source.indexOf('\nfunction ', start + 1)));
    }
  }
  h.run(`var r2Rows = [], r2Boundaries = [], r2RoutineInputs = [], r2Stack = [];
    for (const name of ['ensureHighSchoolOrdinaryGroundBallInPlayHandoff', 'createGroundBallMatchSituation',
      'resolveRoutineDefensivePlay', 'recordGroundBallSituationResolution', 'applyRoutineDefensiveResolutionToHighSchoolMatch',
      'applyInfieldResolutionToHighSchoolMatch', 'applyHighSchoolDefensiveSettlementFacts', 'advanceHighSchoolMatchBattingOrder',
      'prepareHighSchoolDefensiveMomentFromSimulation', 'resolveSimulatedHighSchoolPlateAppearance',
      'resumeResolvedHighSchoolGroundBallSettlement', 'settleAndCloseGroundBallSituation']) {
      const original = globalThis[name];
      globalThis[name] = function(...args) {
        const m = args[0];
        if(name==='resolveRoutineDefensivePlay' && args[3]?.densitySuppressed) r2RoutineInputs.push(JSON.stringify(player));
        const snapshot = () => ({outs:m.outs,batter:m.currentBatter,runners:m.runners,scores:m.scores,
          order:m.battingOrderIndex,pa:m.simulationLog.filter(e=>e.type==='plateAppearance').length,
          active:m.activeSituation?.situationId,state:m.activeSituation?.lifecycleState,
          applied:m.groundBallInPlayState?.settlementApplied,classification:m.playerEventClassification});
        const row = {name,inning:m.inning,half:m.half,stack:r2Stack.slice(),before:JSON.parse(JSON.stringify(snapshot())),
          resolution:args[1]?.eventClassification, densitySuppressed:args[3]?.densitySuppressed};
        r2Rows.push(row); r2Stack.push(name);
        try {
          const result = original.apply(this,args);
          row.resultClassification=result?.eventClassification;
          row.returned=!!result;
          row.after=JSON.parse(JSON.stringify(snapshot()));
          if(name==='recordGroundBallSituationResolution' && m.activeSituation?.lifecycleState==='resolved'
            && m.groundBallInPlayState?.runnerThrowTiming && !m.groundBallInPlayState.settlementApplied) {
            r2Boundaries.push(JSON.stringify(player));
          }
          return result;
        } catch(e) {row.error=e.message; throw e;} finally {r2Stack.pop();}
      };
    }`);
  let game, error;
  try { game = h.play(seed); } catch(e) { error=e.message; }
  return {h,game,error,check:game?inspectGame(game):null,rows:h.json('r2Rows'),boundaries:h.json('r2Boundaries'),routineInputs:h.json('r2RoutineInputs')};
}
// A regulation-inning Match with a genuine first-base force and ordinary
// right-side ground ball. The probe obtains the route descriptor from the
// production classifier; only prior density observations are replayed through
// the production accounting API. No classification or settlement is mocked.
function densityWitness() {
  const setup = `var m=__setupOpportunityAudit243(22430361,"starter",false);
    m.inning=6;m.half=String.fromCharCode(0x4e0a);m.outs=1;
    m.offenseTeam="away";m.defenseTeam="home";
    m.battingOrderIndex.away=1;m.currentBatter=m.rosters.away.lineup[1].id;
    m.runners=[m.rosters.away.lineup[0].id,null,null];m.simulationCursor=2;
    syncHighSchoolMatchPlayerRunnerLocation(m);
    var r2Options={tacticalActionOverride:"standardAttack",
      ordinaryPlateAppearance:{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0,
        decisionRoll:0,contactRoll:0,foulRoll:1,
        physicalRolls:{contactQuality:.65,ballType:.1,pace:.68,direction:.95,depth:0},outcomeRoll:.5}};`;
  const probe=createHarness({observe:false});
  probe.run(setup+`var originalClassify=classifyHighSchoolMatchDefensiveOpportunity;
    var r2ProbeDensity=null;
    classifyHighSchoolMatchDefensiveOpportunity=function(...args){
      const result=originalClassify.apply(this,args);r2ProbeDensity=result.density;return result;
    };
    prepareHighSchoolDefensiveMomentFromSimulation(m,r2Options);`);
  const density=probe.json('r2ProbeDensity');
  const h=createHarness({observe:false});
  h.run(setup+`var r2Classification=null,r2Routine=null,r2RoutineInput=null,r2Boundary=null,r2Applications=0,r2Settlements=0,r2Advances=0,r2Closures=0;
    var originalClassify=classifyHighSchoolMatchDefensiveOpportunity;
    classifyHighSchoolMatchDefensiveOpportunity=function(...args){
      const result=originalClassify.apply(this,args);r2Classification=result;return result;
    };
    var originalRoutine=resolveRoutineDefensivePlay;
    resolveRoutineDefensivePlay=function(...args){
      r2RoutineInput=JSON.stringify(player);
      const result=originalRoutine.apply(this,args);
      r2Routine={densitySuppressed:args[3]?.densitySuppressed,result};return result;
    };
    var originalRecord=recordGroundBallSituationResolution;
    recordGroundBallSituationResolution=function(...args){
      const result=originalRecord.apply(this,args);
      if(m.activeSituation?.lifecycleState==="resolved"&&!m.groundBallInPlayState?.settlementApplied)
        r2Boundary=JSON.stringify(player);
      return result;
    };
    var originalApply=applyRoutineDefensiveResolutionToHighSchoolMatch;
    applyRoutineDefensiveResolutionToHighSchoolMatch=function(...args){r2Applications++;return originalApply.apply(this,args);};
    var originalSettlement=applyHighSchoolDefensiveSettlementFacts;
    applyHighSchoolDefensiveSettlementFacts=function(...args){r2Settlements++;return originalSettlement.apply(this,args);};
    var originalAdvance=advanceHighSchoolMatchBattingOrder;
    advanceHighSchoolMatchBattingOrder=function(...args){r2Advances++;return originalAdvance.apply(this,args);};
    var originalClose=settleAndCloseGroundBallSituation;
    settleAndCloseGroundBallSituation=function(...args){r2Closures++;return originalClose.apply(this,args);};`);
  h.run(`for(let i=0;i<4;i++)applyHighSchoolMatchDefensiveDecisionDensity(m,${JSON.stringify(density)},true);
    var r2Before=JSON.parse(JSON.stringify(m));
    var r2Event=prepareHighSchoolDefensiveMomentFromSimulation(m,r2Options);
    var r2After=JSON.parse(JSON.stringify(m));`);
  return {h,density,classification:h.json('r2Classification'),routine:h.json('r2Routine'),
    routineInput:h.json('r2RoutineInput'),boundary:h.json('r2Boundary'),
    before:h.json('r2Before'),after:h.json('r2After'),
    event:h.json('r2Event'),applications:h.run('r2Applications'),settlements:h.run('r2Settlements'),
    advances:h.run('r2Advances'),closures:h.run('r2Closures')};
}
module.exports={trajectory,densityWitness};
