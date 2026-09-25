const assert = require('assert/strict');
const { createHarness, inspectGame } = require('./match-authority-coverage-audit.cjs');

function trajectory(seed = 22430002, { observe = false, route = null, stale = false } = {}) {
  const h = createHarness({ observe });
  h.context.r1Route = route;
  h.context.r1Stale = stale;
  h.run(`
    var r1Moments = [], r1Snapshots = [], r1StaleResults = [], r1DuplicateResults = [];
    var r1Choose = chooseHighSchoolYearOneMatchMoment;
    chooseHighSchoolYearOneMatchMoment = function(decision, expected, random) {
      var m = player.highSchoolMatch;
      if (m.currentDomain !== 'defense' || m.simulationPhase !== 'moment_2_ready') return r1Choose.apply(this, arguments);
      var choices = getHighSchoolDefensiveMomentChoices(m);
      var current = getHighSchoolYearOneMomentId(m);
      var previous = r1Moments.at(-1);
      r1Snapshots.push(JSON.stringify(player));
      if (r1Stale && previous && previous.id !== current) {
        var beforeStale = JSON.stringify({record:m.gameRecord,scores:m.scores,outs:m.outs,runners:m.runners});
        var rejected = r1Choose(previous.choices[0].matchDecision,previous.id,random) === false;
        r1StaleResults.push({rejected,unchanged:beforeStale===JSON.stringify({record:m.gameRecord,scores:m.scores,outs:m.outs,runners:m.runners})});
      }
      var selected = r1Moments.length === 1 && r1Route ? choices.find(c=>c.matchDecision===r1Route) : choices.find(c=>c.matchDecision===decision);
      if (!selected) throw new Error('Requested route must be legal');
      var row = {id:current,choices,sourceRoutes:JSON.parse(JSON.stringify(m.activeSituation?.legalRoutes || choices)),
        lifecycleType:m.activeSituation?.type || null,situationId:m.activeSituation?.situationId || null,phase:m.simulationPhase,position:m.activeSituation?.actor.position || m.position,
        inning:m.inning,half:m.half,selected:selected.matchDecision};
      row.accepted = Boolean(r1Choose(selected.matchDecision,selected.matchMomentId,random));
      row.lifecycleAfter = m.lastClosedSituationSummary?.lifecycleState || m.activeSituation?.lifecycleState;
      var once = JSON.stringify({record:m.gameRecord,scores:m.scores,outs:m.outs,runners:m.runners});
      var duplicateAccepted = Boolean(r1Choose(selected.matchDecision,selected.matchMomentId,random));
      r1DuplicateResults.push({accepted:duplicateAccepted,unchanged:once===JSON.stringify({record:m.gameRecord,scores:m.scores,outs:m.outs,runners:m.runners})});
      r1Moments.push(row);
      return row.accepted;
    };
  `);
  const game = h.play(seed);
  return { h, game, check: inspectGame(game), moments: h.json('r1Moments'), snapshots: h.json('r1Snapshots'), stale: h.json('r1StaleResults'), duplicates: h.json('r1DuplicateResults') };
}

function assertComplete(t) {
  assert.deepEqual(t.check.failures, []);
  assert(t.game.match.completed);
  assert.equal(t.game.match.gameRecord.status, 'final');
  for (const row of t.moments) {
    assert(row.accepted);
    assert(row.choices.every(c => c.matchMomentId === row.id));
    assert.deepEqual(row.choices, row.sourceRoutes);
  }
  assert.equal(new Set(t.moments.map(m => m.id)).size, t.moments.length);
  assert(t.duplicates.every(x => !x.accepted && x.unchanged));
}
module.exports = { trajectory, assertComplete };
