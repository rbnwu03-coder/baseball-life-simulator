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
module.exports={trajectory};
