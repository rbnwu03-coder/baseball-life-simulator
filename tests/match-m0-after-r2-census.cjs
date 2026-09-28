/* Read-only census of the frozen formal evidence; never invokes gameplay. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const readline = require('readline');
const assert = require('assert/strict');
const { aggregate } = require('./match-m0-after-r2-coverage.cjs');
const directory = path.join(os.tmpdir(), 'm0-after-r2-4b60ac3');
const inc = (o, key, n = 1) => { o[String(key)] = (o[String(key)] || 0) + n; };
async function census() {
  const formal = JSON.parse(fs.readFileSync(path.join(directory, 'formal-cohort.json')));
  const projections = [];
  const extra = { eventTypes: {}, lifecycleCalls: {}, successfulLifecycleCalls: {},
    admissionByRolePosition: {}, schools: {}, innings: {}, outcomes: {}, scores: {},
    pitchResults: {}, pitchActions: {}, pitchTypes: {}, pitchLocations: {},
    currentGroundDecisions: 0, rejectedGroundDecisions: 0, groundIdentityMismatches: 0,
    battingPA: 0, pitcherBF: 0, hits: 0, errors: 0, runs: 0, pitchObservations: 0,
    compressedNonBBP: {}, playerDetailedNonBBP: {}, simulations: [], failures: [],
    fallbackCensus: {},
    runnerCensus: { forceContexts: 0, forcedMovementSettlements: 0, multiRunnerContexts: 0,
      multiRunnerMovements: 0, walkForcedAdvancement: 0, thirdOutTypes: {}, independentThirdOutTypes: {} } };
  const input = readline.createInterface({ input: fs.createReadStream(path.join(directory, 'formal-games.jsonl.gz')).pipe(zlib.createGunzip()), crlfDelay: Infinity });
  for await (const line of input) {
    if (!line) continue;
    const g = JSON.parse(line), m = g.match;
    if (g.projection) projections.push(g.projection);
    for (const p of g.projection?.physical || []) {
      if (p.status !== 'FALLBACK') continue;
      const key = [p.type, p.fallbackReason, p.source, p.route].join('|');
      const row = extra.fallbackCensus[key] || (extra.fallbackCensus[key] = {
        type: p.type, observedReasonOrAuthority: p.fallbackReason,
        reason: p.fallbackReason === 'canonicalReachArrival' ? 'legacyPositionDecisionSelectedWithoutGroundLifecycle'
          : p.fallbackReason === 'supported2BVertical' ? 'supportedBuntHandoffNotConsumedByDetailedPASettlement'
          : p.fallbackReason,
        source: p.source, route: p.route === 'recordedPA' ? 'advanceHighSchoolYearOneAfterMomentTwo legacy branch (script.js:11576)' : p.route, count: 0,
        intentional: ['canonicalReachArrival', 'supported2BVertical'].includes(p.fallbackReason)
          ? 'existing compatibility dispatch observed; finer reason not persisted' : 'existing explicit compatibility fallback',
        canonicalSupport: p.type === 'popBunt' ? 'no detailed pop-bunt route' : 'conditional subset; see structural matrix',
        expansionCandidate: true });
      row.count++;
    }
    if (g.check.failures.length) extra.failures.push(g.check);
    extra.battingPA += g.check.battingPA || 0;
    extra.pitcherBF += g.check.pitcherBF || 0;
    inc(extra.admissionByRolePosition, g.admission.actualAdmittedRole + '|' + g.admission.position);
    inc(extra.schools, g.admission.school);
    inc(extra.innings, m.inning);
    inc(extra.outcomes, m.scores.home > m.scores.away ? 'homeWin' : m.scores.home < m.scores.away ? 'awayWin' : 'tie');
    inc(extra.scores, m.scores.home + '-' + m.scores.away);
    extra.simulations.push({ seed: g.admission.seed, simulationSeed: m.simulationSeed, role: g.admission.actualAdmittedRole });
    for (const side of ['home', 'away']) {
      extra.hits += m.gameRecord.totals[side].hits;
      extra.errors += m.gameRecord.totals[side].errors;
      extra.runs += m.gameRecord.totals[side].runs;
    }
    for (const e of m.simulationLog) {
      inc(extra.eventTypes, e.type);
      if (e.thirdOutResolution?.thirdOutType && e.thirdOutResolution.thirdOutType !== 'none')
        inc(e.type === 'plateAppearance' ? extra.runnerCensus.thirdOutTypes : extra.runnerCensus.independentThirdOutTypes, e.thirdOutResolution.thirdOutType);
      if (e.type === 'plateAppearance' && e.result === 'walk' && e.before?.runners?.[0]) extra.runnerCensus.walkForcedAdvancement++;
      if (e.type === 'plateAppearance' && ['walk', 'strikeout', 'hitByPitch'].includes(e.result)) {
        if (e.resolutionMode === 'compressedPlateAppearance') inc(extra.compressedNonBBP, e.result);
        else if (e.batterId === 'player') inc(extra.playerDetailedNonBBP, e.result);
      }
    }
    const pitchIds = new Set();
    for (const row of g.observed) {
      if (row.kind === 'settlement') {
        const s = row.data.settlement;
        const forced = new Set((s.forceStateBefore?.forcedRunners || []).map(r => r.runnerId));
        const movement = (s.runnerMovement || []).filter(r => typeof r.from === 'number' && r.from !== r.to);
        if (forced.size) extra.runnerCensus.forceContexts++;
        if (movement.some(r => forced.has(r.runnerId))) extra.runnerCensus.forcedMovementSettlements++;
        if ((s.before?.runners || []).filter(Boolean).length > 1) extra.runnerCensus.multiRunnerContexts++;
        if (movement.length > 1) extra.runnerCensus.multiRunnerMovements++;
      }
      if (row.kind === 'lifecycle') {
        inc(extra.lifecycleCalls, row.data.function);
        if (row.data.returned) inc(extra.successfulLifecycleCalls, row.data.function);
      }
      if (row.kind === 'decision') {
        extra.currentGroundDecisions++;
        if (!row.data.accepted) extra.rejectedGroundDecisions++;
        if (row.data.routeIds.some(id => id !== row.data.currentId)) extra.groundIdentityMismatches++;
      }
      if (row.kind !== 'event' || row.data.event.type !== 'plateAppearance'
        || row.data.event.batterId !== 'player' || row.data.event.resolutionMode) continue;
      for (const pitch of row.data.paState?.pitchHistory || []) {
        const id = row.data.event.sequence + '|' + (pitch.pitchId || pitch.pitchNumber || JSON.stringify(pitch));
        if (pitchIds.has(id)) continue;
        pitchIds.add(id); extra.pitchObservations++;
        inc(extra.pitchResults, pitch.pitchResult || pitch.result || 'not exposed');
        inc(extra.pitchActions, pitch.action || 'not exposed');
        inc(extra.pitchTypes, pitch.pitch?.pitchType || pitch.pitchType || 'not exposed');
        inc(extra.pitchLocations, pitch.pitch?.location || pitch.location || 'not exposed');
      }
    }
  }
  assert.equal(projections.length, formal.attempted);
  const coverage = aggregate(projections);
  assert.equal(coverage.pa, extra.battingPA);
  assert.equal(coverage.pa, extra.pitcherBF);
  assert.equal(extra.rejectedGroundDecisions, 0);
  assert.equal(extra.groundIdentityMismatches, 0);
  assert.equal(Object.values(extra.fallbackCensus).reduce((n, r) => n + r.count, 0), Object.values(coverage.bbp.fallbackReasons).reduce((a, b) => a + b, 0));
  const result = { formalStatus: formal.status, coverage, extra };
  fs.writeFileSync(path.join(directory, 'formal-census.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ games: coverage.games, pa: coverage.pa, bbp: coverage.bbp.byType, failures: extra.failures }));
  return result;
}
module.exports = { census };
if (require.main === module) census().catch(e => { console.error(e); process.exitCode = 1; });
