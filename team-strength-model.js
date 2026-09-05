(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TeamStrengthModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "team-strength-model-v1";
  const DEFENSE_WEIGHTS = Object.freeze({ P: 0.07, C: 0.16, "1B": 0.07, "2B": 0.11, "3B": 0.1, SS: 0.17, LF: 0.08, CF: 0.16, RF: 0.08 });

  function average(values) {
    return values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;
  }

  function quality(value) {
    return Math.round(Math.max(0, Math.min(100, value * 10)));
  }

  function distribution(players, key) {
    const values = players.map(player => Number(player[key]) || 0).sort((a, b) => b - a);
    return Object.freeze({
      mean: quality(average(values)), topThird: quality(average(values.slice(0, 3))),
      bottomThird: quality(average(values.slice(-3))), peak: quality(values[0] || 0), spread: quality((values[0] || 0) - (values.at(-1) || 0))
    });
  }

  function deriveTeamStrengthProfile(roster) {
    const playersById = new Map((roster?.players || []).map(player => [player.playerId, player]));
    const lineup = (roster?.battingOrder || []).map(slot => playersById.get(slot.playerId)).filter(Boolean);
    const segments = [lineup.slice(0, 3), lineup.slice(3, 6), lineup.slice(6, 9)];
    const contactDistribution = distribution(lineup, "contact");
    const powerDistribution = distribution(lineup, "power");
    const speedDistribution = distribution(lineup, "speed");
    const lineupQuality = Object.freeze({
      contact: contactDistribution, power: powerDistribution, speed: speedDistribution,
      topOfOrderQuality: quality(average(segments[0].map(player => player.contact * 0.6 + player.speed * 0.4))),
      middleOrderThreat: quality(average(segments[1].map(player => player.power * 0.65 + player.contact * 0.35))),
      bottomOrderQuality: quality(average(segments[2].map(player => player.contact * 0.55 + player.power * 0.25 + player.speed * 0.2)))
    });
    const defenseQuality = Math.round(lineup.reduce((sum, player) => sum + quality(player.defense) * (DEFENSE_WEIGHTS[player.primaryPosition] || 0), 0));
    const armQuality = Math.round(lineup.reduce((sum, player) => sum + quality(player.arm) * (DEFENSE_WEIGHTS[player.primaryPosition] || 0), 0));
    const pitcherIds = [roster?.pitchingStaff?.starter, ...(roster?.pitchingStaff?.secondaryPitchers || [])].filter(Boolean);
    const pitchers = pitcherIds.map(id => playersById.get(id)).filter(Boolean);
    const starter = playersById.get(roster?.pitchingStaff?.starter);
    const bench = roster?.benchPlayers || [];
    const starterFloor = average(lineup.map(player => average([player.contact, player.power, player.speed, player.defense, player.arm])));
    const benchQuality = average(bench.map(player => average([player.contact, player.power, player.speed, player.defense, player.arm])));
    const starQuality = average([...lineup].sort((a, b) => (b.contact + b.power + b.defense + b.pitching) - (a.contact + a.power + a.defense + a.pitching)).slice(0, 2).map(player => average([player.contact, player.power, player.defense, player.pitching])));
    const rosterDepth = Object.freeze({
      starterFloor: quality(starterFloor), benchQuality: quality(benchQuality), starQuality: quality(starQuality),
      balance: quality(Math.max(0, starterFloor - Math.abs(starQuality - starterFloor) * 0.5)),
      topHeavyGap: quality(Math.max(0, starQuality - average([starterFloor, benchQuality])))
    });
    const startingPitchingQuality = quality(average([starter?.pitching || 0, starter?.pitchingProfile?.control || 0, starter?.pitchingProfile?.stuff || 0]));
    const pitchingDepth = quality(average(pitchers.slice(1).map(player => average([player.pitching, player.pitchingProfile?.control, player.pitchingProfile?.stuff]))));
    const baserunningQuality = speedDistribution.mean;
    const aggressiveRunnerCount = lineup.filter(player => Number(player.speed) >= 7).length;
    const overallSummary = Math.round(average([
      contactDistribution.mean, powerDistribution.mean, speedDistribution.mean, defenseQuality,
      startingPitchingQuality, pitchingDepth, rosterDepth.starterFloor, rosterDepth.benchQuality
    ]));
    return Object.freeze({
      version: VERSION, teamId: roster?.teamId || "", lineupQuality,
      powerThreat: powerDistribution, contactQuality: contactDistribution, speedQuality: speedDistribution,
      defenseQuality, armQuality, startingPitchingQuality, pitchingDepth, rosterDepth,
      baserunningQuality, aggressiveRunnerCount, overallSummary
    });
  }

  function explainComparison(first, second) {
    return Object.freeze([
      ["Lineup", average([first.lineupQuality.topOfOrderQuality, first.lineupQuality.middleOrderThreat, first.lineupQuality.bottomOrderQuality]), average([second.lineupQuality.topOfOrderQuality, second.lineupQuality.middleOrderThreat, second.lineupQuality.bottomOrderQuality])],
      ["Starting Pitching", first.startingPitchingQuality, second.startingPitchingQuality],
      ["Pitching Depth", first.pitchingDepth, second.pitchingDepth],
      ["Defense", first.defenseQuality, second.defenseQuality],
      ["Speed", first.speedQuality.mean, second.speedQuality.mean],
      ["Roster Depth", average([first.rosterDepth.starterFloor, first.rosterDepth.benchQuality]), average([second.rosterDepth.starterFloor, second.rosterDepth.benchQuality])]
    ].map(([area, firstValue, secondValue]) => Object.freeze({ area, first: Math.round(firstValue), second: Math.round(secondValue), advantage: Math.sign(firstValue - secondValue) })));
  }

  return Object.freeze({ VERSION, DEFENSE_WEIGHTS, deriveTeamStrengthProfile, explainComparison });
});
