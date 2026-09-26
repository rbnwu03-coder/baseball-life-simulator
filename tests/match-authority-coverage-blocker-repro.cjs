/* Existing production blocker diagnostic, not a passing regression test.
 * Run: node tests/match-authority-coverage-blocker-repro.cjs
 * Exit 1 means the displayed legal choices were rejected (M0 must stop).
 * No coverage observer, production monkey-patch, or synthetic match state.
 */
const assert = require('assert/strict');
const { makeContext } = require('./high-school-career-test-context');

function reproduce() {
  const h = makeContext();
  h.run(`
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome = null; isTransitioning = false;
    player = createInitialPlayer();
    document.getElementById('nameInput').value = '2.2.4.3 Opportunity Audit 球員';
    selectOrigin(PlayerIdentityOptions.origins[1]); selectIdealSelf('棒球理解型');
    pendingGenesisRoll = rollCharacterGenesis(() => .25);
    pendingGenesisAllocation = { ballSense: 1, observe: 1, fitness: 0, batting: 0, baseRunning: 0, baseballIQ: 1 };
    selectDevelopmentEntry('highSchoolFullMatch'); selectDevelopmentTestPosition('二壘手');
    pendingHighSchoolMatchSimulationSeed = 22430002;
    createPlayer();
  `);
  for (let step = 0; step < 500; step++) {
    h.flushTransitions();
    if (h.run('player.highSchoolMatch.completed')) return { reproduced: false, completed: true, steps: step };
    if (h.run('Boolean(pendingYouthSeasonOutcome)')) h.run('continueYouthSeasonOutcome()');
    else if (h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)')) {
      const choices = h.json('getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch)');
      assert(choices.length, 'production must expose a choice');
      const choose = c => h.run(`chooseHighSchoolYearOneMatchMoment(${JSON.stringify(c.matchDecision)}, ${JSON.stringify(c.matchMomentId)}, () => .82)`);
      if (!choose(choices[0])) {
        const retries = choices.map(c => ({ decision: c.matchDecision, momentId: c.matchMomentId, accepted: Boolean(choose(c)) }));
        const witness = h.json(`({
          matchId: player.highSchoolMatch.id, seed: player.highSchoolMatch.simulationSeed,
          actualRole: player.highSchoolMatch.playerLineupStatus,
          inning: player.highSchoolMatch.inning, half: player.highSchoolMatch.half, outs: player.highSchoolMatch.outs,
          currentMomentId: getHighSchoolYearOneMomentId(player.highSchoolMatch),
          phase: player.highSchoolMatch.simulationPhase,
          lifecycleType: player.highSchoolMatch.activeSituation?.type,
          lifecycleState: player.highSchoolMatch.activeSituation?.lifecycleState,
          sourcePhysicalStateRef: player.highSchoolMatch.activeSituation?.sourcePhysicalStateRef,
          completed: player.highSchoolMatch.completed,
          blockingOutcome: Boolean(pendingYouthSeasonOutcome), transitioning: isTransitioning,
          paEvents: player.highSchoolMatch.simulationLog.filter(e => e.type === 'plateAppearance').length,
          battingPA: Object.values(player.highSchoolMatch.gameRecord.playerLines).reduce((n,l) => n + l.batting.PA, 0),
          stateIssues: getHighSchoolMatchStateIntegrityIssues(player.highSchoolMatch),
          recordIssues: MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)
        })`);
        return { reproduced: true, steps: step, witness, retries };
      }
    } else h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)');
  }
  throw new Error('Reproducer exceeded bounded playback steps without a diagnosed rejection');
}

module.exports = { reproduce };
if (require.main === module) {
  const result = reproduce();
  console.log('M0_BLOCKER_JSON=' + JSON.stringify(result));
  if (result.reproduced) process.exitCode = 1;
}
