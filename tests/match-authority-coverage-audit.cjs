/* M0 test-only observer. No gameplay state, RNG, or persistence additions. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const VERSION = 'match-authority-coverage-m0-v2';
const clone = x => JSON.parse(JSON.stringify(x));

// Reuse the existing seed, creation, decision and timer policy verbatim. Only
// its test loader is adapted to the browser's current production script list.
function createHarness({ legacy = false, observe = true } = {}) {
  const filename = path.join(__dirname, 'baseball-match-foundation-2-2-4-3-audit.js');
  const source = fs.readFileSync(filename, 'utf8').replace(/\r\n?/g, '\n');
  const boundary = source.indexOf('const context = makeContext();');
  assert(boundary > 0);
  let prefix = source.slice(0, boundary);
  if (!legacy) {
    assert(prefix.includes('module: { exports: {} },'));
    prefix = prefix.replace(/const files = \[[\s\S]*?\];/, `const files = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(x => x[1]).filter(x => x !== 'application-controller.js');`)
      .replace('module: { exports: {} },', '')
      // Modern pitch decisions legitimately progress without a completed PA.
      .replaceAll('Boolean(pendingYouthSeasonOutcome)].join', 'Boolean(pendingYouthSeasonOutcome), match.offensivePlateAppearanceState?.pitchNumber, match.activeSituation?.situationId, match.activeSituation?.lifecycleState].join');
  }
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(__dirname);
  compiled._compile(prefix + '\nmodule.exports = { makeContext, summarize };', filename);
  const context = compiled.exports.makeContext();
  const run = expression => vm.runInContext(expression, context);
  const json = expression => JSON.parse(run(`JSON.stringify(${expression})`));
  let events = [], handoffs = [], calls = {}, settlements = [], decisions = [];
  context.__m0Observe = (kind, data) => {
    const row = clone(data);
    if (kind === 'event') events.push(row);
    else if (kind === 'handoff') handoffs.push(row);
    else if (kind === 'settlement') settlements.push(row);
    else if (kind === 'decision') decisions.push(row);
    else calls[kind] = (calls[kind] || 0) + 1;
  };
  if (observe) run(`
    (function() {
      const stack = [];
      for (const name of ['resolveSimulatedHighSchoolPlateAppearance', 'resolveHighSchoolOffensiveDecision',
        'applyInfieldResolutionToHighSchoolMatch', 'applyRoutineDefensiveResolutionToHighSchoolMatch',
        'applyHighSchoolLineDriveCatchResolution', 'applyHighSchoolFlyBallCatchResolution',
        'applyHighSchoolBuntTerminalPlateAppearance', 'settleAndCloseHighSchoolRunnerTagUpSituation']) {
        const original = globalThis[name];
        if (typeof original !== 'function') throw new Error('Missing production route: ' + name);
        globalThis[name] = function() {
          stack.push(name);
          try { return original.apply(this, arguments); } finally { stack.pop(); }
        };
      }
      const originalRecord = recordHighSchoolMatchSimulationEvent;
      recordHighSchoolMatchSimulationEvent = function(match, event) {
        const result = originalRecord.apply(this, arguments);
        if (event.type === 'plateAppearance' || event.type === 'runnerTagUpResolution') {
          const playerPA = event.batterId === 'player' && !event.resolutionMode;
          const state = playerPA ? match.offensivePlateAppearanceState : match.ordinaryDefensivePlateAppearanceState;
          __m0Observe('event', {event: result, matchId: match.id, sourceStack: stack.slice(),
            paOrdinal: match.simulationLog.filter(e => e.type === 'plateAppearance').length - (event.type === 'plateAppearance' ? 1 : 0),
            paState: state || null,
            bunt: match.offensiveBuntPAState || null, buntHandoff: match.buntBallInPlayState || null,
            ground: match.groundBallInPlayState || null,
            line: match.lineDriveCatchState || null, fly: match.flyBallCatchState || null,
            recordRef: match.gameRecord?.eventRefs.find(ref => ref.sequence === result.sequence && ref.type === result.type) || null,
            activeSituation: match.activeSituation || null});
        }
        return result;
      };
      const originalHandoff = ensureHighSchoolOrdinaryGroundBallInPlayHandoff;
      ensureHighSchoolOrdinaryGroundBallInPlayHandoff = function(match) {
        const result = originalHandoff.apply(this, arguments);
        const state = match.ordinaryDefensivePlateAppearanceState;
        if (state?.battedBallPhysicalTruth) __m0Observe('handoff', {
          matchId: match.id, inning: match.inning, half: match.half,
          paOrdinal: match.simulationLog.filter(e => e.type === 'plateAppearance').length,
          state, ground: match.groundBallInPlayState, line: match.lineDriveCatchState, fly: match.flyBallCatchState
        });
        return result;
      };
      const originalSettlement = applyHighSchoolDefensiveSettlementFacts;
      applyHighSchoolDefensiveSettlementFacts = function(match, settlement) {
        const alreadyApplied = settlement.settlementApplied === true;
        const result = originalSettlement.apply(this, arguments);
        if (!alreadyApplied) __m0Observe('settlement', {matchId:match.id,inning:match.inning,half:match.half,
          paOrdinal:match.simulationLog.filter(e=>e.type==='plateAppearance').length,
          sourceStack:stack.slice(),settlement:result});
        return result;
      };
      const originalChoose = chooseHighSchoolYearOneMatchMoment;
      chooseHighSchoolYearOneMatchMoment = function() {
        const m = player.highSchoolMatch, s = m?.activeSituation;
        const row = s?.type === 'groundBallDefensiveDecision' && s.lifecycleState === 'presented'
          ? {matchId:m.id,situationId:s.situationId,currentId:getHighSchoolYearOneMomentId(m),
             routeIds:s.legalRoutes.map(r=>r.matchMomentId),selected:arguments[0],expected:arguments[1]} : null;
        const result = originalChoose.apply(this, arguments);
        if (row) __m0Observe('decision', {...row,accepted:Boolean(result)});
        return result;
      };
    })();
  `);
  return { context, run, json, summarize: compiled.exports.summarize,
    play(seed, role = 'bench') {
      events = []; handoffs = []; calls = {}; settlements = []; decisions = [];
      const result = json(`__runOpportunityMatch243(${Number(seed)}, ${JSON.stringify(role)}, false)`);
      const match = json('player.highSchoolMatch');
      return { seed, role, result, match, events: clone(events), handoffs: clone(handoffs), calls: clone(calls),
        settlements:clone(settlements),decisions:clone(decisions) };
    }
  };
}

function inspectGame(game) {
  const { match, seed, role } = game;
  const pa = match.simulationLog.filter(e => e.type === 'plateAppearance');
  const record = match.gameRecord;
  const totalPA = Object.values(record.playerLines).reduce((n, l) => n + l.batting.PA, 0);
  const totalBF = Object.values(record.playerLines).reduce((n, l) => n + l.pitching.BF, 0);
  const failures = [];
  if (pa.length !== totalPA || pa.length !== totalBF) failures.push({ code: 'PA_ACCOUNTING_FAILURE', events: pa.length, battingPA: totalPA, pitcherBF: totalBF });
  for (const side of ['home', 'away']) if (match.scores[side] !== record.totals[side].runs) failures.push({ code: 'GAME_RECORD_SETTLEMENT_FAILURE', side, score: match.scores[side], recorded: record.totals[side].runs });
  if (!game.result.completed || game.result.orphan || game.result.noProgress || game.result.integrityIssues.length || game.result.gameRecordIntegrityIssues.length) failures.push({ code: 'GAME_AUDIT_FAILURE', result: game.result });
  for (const d of game.decisions || []) {
    if (d.routeIds.some(id=>id!==d.currentId)) failures.push({code:'DEFENSIVE_IDENTITY_MISMATCH',decision:d});
    if (!d.accepted) failures.push({code:'CURRENT_CHOICE_REJECTED',decision:d});
  }
  return { seed, role, pa: pa.length, battingPA: totalPA, pitcherBF: totalBF, failures };
}

module.exports = { VERSION, createHarness, inspectGame };
if (require.main === module) {
  const h = createHarness();
  const count = Number(process.argv[2] || 10);
  for (let i = 0; i < count; i++) {
    const g = h.play(22430000 + i);
    const check = inspectGame(g);
    console.log(JSON.stringify(check));
    if (check.failures.length) { process.exitCode = 1; break; }
  }
}
