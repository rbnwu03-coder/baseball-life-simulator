'use strict';
// Sprint 6 strategy C: exercise real legacy facts and the migration boundary.
// No Production writes, no new receiver authority, and no evidence overwrites.
const assert = require('assert/strict');
const fs = require('fs'), path = require('path'), Module = require('module');
const cp = require('child_process'), crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const baseline = 'c4121ce1fa0a2a3fac808226cf610706976fcc24';
const red = process.argv.includes('--red');
const exactBaseline = process.argv.includes('--baseline');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
if (exactBaseline) {
  const git = args => cp.execFileSync('git', args, { cwd: root, maxBuffer: 30e6, windowsHide: true, encoding: 'utf8' });
  const sources = Object.fromEntries(git(['ls-tree', '--name-only', baseline]).trim().split(/\r?\n/)
    .filter(p => p.endsWith('.js') || p === 'index.html')
    .map(p => [path.join(root, p), git(['show', baseline + ':' + p])]));
  const originalRead = fs.readFileSync, originalLoader = Module._extensions['.js'];
  fs.readFileSync = function (file, options) {
    const source = sources[path.resolve(String(file))];
    return source === undefined ? originalRead.apply(this, arguments)
      : typeof options === 'string' || options?.encoding ? source : Buffer.from(source);
  };
  Module._extensions['.js'] = function (module, file) {
    return sources[file] === undefined ? originalLoader(module, file) : module._compile(sources[file], file);
  };
}
const originalPath = path.join(__dirname, 'infield-scorer-recovery-integrity-repair-test.js');
const original = fs.readFileSync(originalPath, 'utf8');
const boundary = original.indexOf("for(const position of ['SS','2B','3B'])test");
assert(boundary > 0, 'Established fixture boundary must still exist');
const harness = new Module(originalPath, module);
harness.filename = originalPath; harness.paths = Module._nodeModulePaths(__dirname);
harness._compile(original.slice(0, boundary) + '\nmodule.exports={run,json,fixture,actor,options};', originalPath);
const { run, json, fixture, actor, options } = harness.exports;
const results = [], cases = [], gaps = [], migrationWitnesses = [], compatibility = [];
function test(name, fn) {
  try { fn(); results.push({ name, pass: true }); console.log('PASS ' + name); }
  catch (error) { results.push({ name, pass: false, error: error.message, stack: error.stack }); console.error('FAIL ' + name + '\n' + error.stack); }
}
function state() { return json('({outs:m.outs,bases:m.runners,runs:m.scores,cursor:m.simulationCursor,record:m.gameRecord,evaluation:m.matchExperience})'); }
function saveCase(name, pos, extra = {}, route = 'secureFirstBaseOut', mode = 'meaningful') {
  const input = options(pos, extra), v = fixture(input, route, mode);
  const receives = v.legal.actionFacts.actions.filter(a => a.type === 'receive');
  const sources = json('m.lastDefensiveResolution.actionFacts.actions.filter(a=>a.type==="receive").map(a=>getHighSchoolLegacyReceiverScorerSource(m,m.defensiveSituation,m.lastDefensiveResolution,a))');
  const row = { name, input, route, mode, physicalIdentity: v.physicalIdentity,
    physicalHash: sha(JSON.stringify(json('m.groundBallInPlayState.physicalTruth'))),
    initialSituation: json('({batterId:m.defensiveSituation.batterId,runners:m.defensiveSituation.runners,capabilities:m.defensiveSituation.playerCapabilities})'),
    ownedSample: v.raw.executionSample, rawExecutionHash: sha(JSON.stringify(v.raw)),
    actions: v.legal.actionFacts, retirement: v.legal.runnerSettlement.retirements,
    receiverResolution: v.raw.receiverResolution || null, timing: v.raw.timingResolution,
    sourceRows: sources, outs: v.outs, bases: v.runners, runs: v.scores, cursor: v.cursor,
    E: v.record.totals.home.errors, H: v.record.totals.away.hits,
    FC: v.legal.batterScoring?.classification || null,
    actorStatistics: v.legal.defensiveAttribution.actors.map(({ actorId, actorPosition, A, PO, E, DP }) => ({ actorId, actorPosition, A, PO, E, DP })),
    scorerFacts: v.legal.scorerFacts, recordHash: sha(JSON.stringify(v.record)),
    evaluationHash: sha(JSON.stringify(json('m.matchExperience'))) };
  cases.push(row); return { v, row, receives, sources };
}
function checkResult(v, pos, expected) {
  assert.equal(v.outs, expected.outs); assert.deepEqual(v.scores, { home: 1, away: 1 });
  assert.deepEqual(v.runners, v.legal.runnerSettlement.runnersAfter);
  assert.equal(v.legal.defensiveAttribution.retirements.length, v.outs);
  assert.equal(v.record.totals.home.errors, expected.E); assert.equal(v.record.totals.away.hits, expected.H);
  assert.equal(actor(v, pos).A, expected.A); assert.equal(actor(v, '1B').PO, expected.PO);
  assert.equal(v.legal.batterScoring?.classification || null, expected.FC || null);
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'), []);
}
function recordGap(name, source, fields) {
  const missing = fields.filter(field => source.fields[field].classification === 'C');
  // This records the requested independent-source gate. Its failure is retained;
  // green safety checks below do not make this gate pass.
  gaps.push({ name, pass: missing.length === 0, missing,
    physicalIdentity: source.physicalIdentity, receiverId: source.receiverId,
    fields: Object.fromEntries(fields.map(field => [field, source.fields[field]])),
    classification: 'SOURCE GAP, not fabricated ordinary-effort execution' });
}
if (red) {
  for (const pos of ['SS', '2B']) {
    const direct = saveCase(pos + ' direct source red', pos, { weakReceiver: '1B' });
    recordGap(pos + ' independent readiness and hands', direct.sources[0], ['independentReadiness', 'independentHands']);
    recordGap(pos + ' ordinary-effort source', direct.sources[0], ['ordinaryEffort']);
    const relay = saveCase(pos + ' relay source red', pos, { occupied: 1, weakReceiver: '1B' }, pos === 'SS' ? 'startDoublePlaySecond' : 'initiate463');
    recordGap(pos + ' final relay stages and exact arrival', relay.sources[1], ['independentReadiness', 'independentHands', 'runnerArrival']);
  }
  const twoB = saveCase('2B delivery location red', '2B', { weakReceiver: '1B' });
  recordGap('2B composite delivery has no independent location', twoB.sources[0], ['incomingLocation']);
  const receive = saveCase('SS extra advancement source red', 'SS', { weakReceiver: '1B' });
  recordGap('misplay-specific advancement unavailable', receive.sources[0], ['errorSpecificAdvancement']);
  // No new version exists; do not fabricate pending/executed/settled caches.
  compatibility.push({ newReceiverVersion: 'notImplemented', historicalMigration: 'notEnabled', legacyVersionPreserved: true });
} else {
  for (const pos of ['SS', '2B']) for (const mode of ['meaningful', 'routine']) {
    for (const [name, extra, route, expected] of [
      ['clean', {}, 'secureFirstBaseOut', { outs: 1, E: 0, H: 0, A: 1, PO: 1 }],
      ['combined failure', { weakReceiver: '1B' }, 'secureFirstBaseOut', { outs: 0, E: 0, H: 1, A: 0, PO: 0 }],
      ['fast safe failure', { weakReceiver: '1B', batterSpeed: 18 }, 'secureFirstBaseOut', { outs: 0, E: 0, H: 1, A: 0, PO: 0 }],
      ['partial DP receiver', { occupied: 1, weakReceiver: '1B' }, pos === 'SS' ? 'startDoublePlaySecond' : 'initiate463', { outs: 1, E: 0, H: 0, A: 1, PO: 0, FC: 'fieldersChoice' }]
    ]) test(pos + ' ' + mode + ' ' + name + ' source, scorer and actual state', () => {
      const { v, sources, receives } = saveCase(pos + ' ' + mode + ' ' + name, pos, extra, route, mode);
      checkResult(v, pos, expected);
      const before = state();
      for (const [i, source] of sources.entries()) {
        assert.equal(source.receiverId, receives[i].actorId); assert.equal(source.receiverActionId, receives[i].identity);
        assert.equal(source.fields.ownedSample.value, receives[i].provenance.sample);
        assert.deepEqual(source.fields.capabilities.value, receives[i].provenance.capabilities);
        for (const field of ['independentReadiness', 'independentHands', 'ordinaryEffort', 'errorSpecificAdvancement']) assert.equal(source.fields[field].classification, 'C');
        assert.equal(source.consumedRng, false);
      }
      assert.deepEqual(state(), before);
      if (extra.weakReceiver) assert(v.legal.scorerFacts.decisions.some(d => d.reason === 'insufficientScorerFacts'));
    });
  }
  test('SS offline delivery cannot become a completed receive or receiver E', () => {
    const { v, sources } = saveCase('SS offline', 'SS', { sample: .5, capabilities: { throwing: 1, arm: 10 } });
    checkResult(v, 'SS', { outs: 0, E: 1, H: 0, A: 0, PO: 0 });
    assert.equal(sources[0].fields.incomingLocation.value, 'offline');
    assert.equal(v.legal.actionFacts.actions.find(a => a.type === 'receive').status, 'notAttempted'); assert.equal(actor(v, '1B').E, 0);
  });
  test('2B authoritative unavailable flag is distinct from unavailable independent arrival', () => {
    run('var s6Boundary=firstBaseIncomingBoundary;firstBaseIncomingBoundary=function(input,phase){var result=s6Boundary(input,phase);result.defensiveSituation.teammates.firstBaseReceiver.receivingAvailable=false;return result;};');
    try {
      const { v, sources } = saveCase('2B unavailable', '2B');
      checkResult(v, '2B', { outs: 0, E: 0, H: 1, A: 0, PO: 0 });
      assert.equal(sources[0].fields.receiverReadiness.value.available, false);
      assert.equal(sources[0].fields.independentReadiness.classification, 'C');
    } finally { run('firstBaseIncomingBoundary=s6Boundary;'); }
  });
  test('SS legacy receivingAvailable flag is not an independent receiver authority', () => {
    const ordinary = saveCase('SS available control', 'SS');
    run('var s6Boundary=firstBaseIncomingBoundary;firstBaseIncomingBoundary=function(input,phase){var result=s6Boundary(input,phase);result.defensiveSituation.teammates.firstBaseReceiver.receivingAvailable=false;return result;};');
    try {
      const unavailableFlag = saveCase('SS ignored legacy flag', 'SS');
      checkResult(unavailableFlag.v, 'SS', { outs: 1, E: 0, H: 0, A: 1, PO: 1 });
      assert.equal(unavailableFlag.row.rawExecutionHash, ordinary.row.rawExecutionHash);
      assert.equal(unavailableFlag.sources[0].fields.independentReadiness.classification, 'C');
    } finally { run('firstBaseIncomingBoundary=s6Boundary;'); }
  });
  test('SS direct incoming replacement changes secure outcome for identical saved inputs', () => {
    const { v, row, receives } = saveCase('SS migration challenging', 'SS', { sample: .5, capabilities: { throwing: 4 }, npc: { '1B': { defense: 4 } } });
    checkResult(v, 'SS', { outs: 1, E: 0, H: 0, A: 1, PO: 1 });
    const before = state();
    run('var s6Candidate=DefensiveDecisionThrowFoundation.resolveIncomingReceive({playIdentity:m.defensiveSituation.runnerSettlementIdentity,physicalIdentity:m.groundBallInPlayState.physicalTruth.identity,throwResolution:m.groundBallInPlayState.shortstopExecution.decisionThrowState.throwResolution,receiver:{id:' + JSON.stringify(receives[0].actorId) + ',position:"1B"},capabilities:' + JSON.stringify(receives[0].provenance.capabilities) + ',sample:.5});');
    const candidate = json('s6Candidate');
    assert.equal(candidate.throwQuality, 'challengingReceive'); assert.equal(candidate.ready, true); assert.equal(candidate.secured, false);
    assert.equal(v.raw.teammateLeg.receiver, 'completed'); assert.deepEqual(state(), before);
    migrationWitnesses.push({ case: row.name, physicalIdentity: row.physicalIdentity, originalSample: .5,
      oldActualOuts: 1, oldReceiver: v.raw.teammateLeg.receiver, candidate,
      classification: 'Isolated candidate resolver only; not applied to Match State or scorer', enabled: false });
  });
  test('2B usable delivery cannot masquerade as canonical incoming location', () => {
    const { v } = saveCase('2B migration delivery', '2B', { sample: .5, npc: { '1B': { defense: 3 } } });
    checkResult(v, '2B', { outs: 1, E: 0, H: 0, A: 1, PO: 1 });
    const before = state();
    assert.equal(json('m.groundBallInPlayState.decisionThrowState.throwResolution.throwQuality'), 'legacyUsableDelivery');
    assert.throws(() => run('DefensiveDecisionThrowFoundation.resolveIncomingReceive({playIdentity:m.defensiveSituation.runnerSettlementIdentity,physicalIdentity:m.groundBallInPlayState.physicalTruth.identity,throwResolution:m.groundBallInPlayState.decisionThrowState.throwResolution,receiver:{id:m.groundBallInPlayState.decisionThrowState.throwResolution.receiverId,position:"1B"},capabilities:m.lastDefensiveResolution.actionFacts.actions.find(a=>a.type==="receive").provenance.capabilities,sample:.5});'), /invalid incoming throw continuation/);
    assert.deepEqual(state(), before);
    migrationWitnesses.push({ case: '2B migration delivery', oldReady: v.raw.receiverResolution.ready,
      actualProvenance: v.raw.receiverResolution.provenance, missing: 'canonical delivery location; independent positioning', enabled: false });
  });
  test('SS clean completed receive cannot retire an already-arrived batter', () => {
    const { v } = saveCase('SS clean fast safe', 'SS', { batterSpeed: 18 });
    checkResult(v, 'SS', { outs: 0, E: 0, H: 1, A: 0, PO: 0 });
    assert.equal(v.legal.actionFacts.actions.find(a => a.type === 'receive').status, 'completed');
    assert.equal(v.raw.timingResolution.firstLeg.runnerArrival.runnerId, v.raw.runnerSettlement.batterId || json('m.defensiveSituation.batterId'));
  });
  for (const [pos, extra] of [['SS', { occupied: 1, sample: .5, npc: { '2B': { defense: 4, arm: 1 } } }], ['2B', { occupied: 1, npc: { SS: { arm: 1 } } }]]) test(pos + ' incomplete relay delivery preserves only the first force and FC', () => {
    const { v, sources } = saveCase(pos + ' relay delivery failure', pos, extra, pos === 'SS' ? 'startDoublePlaySecond' : 'initiate463');
    checkResult(v, pos, { outs: 1, E: 0, H: 0, A: 1, PO: 0, FC: 'fieldersChoice' });
    assert.equal(sources[1].fields.incomingLocation.classification, 'C');
    assert(v.legal.defensiveAttribution.actors.every(a => a.DP === 0));
    assert.equal(v.legal.actionFacts.actions.filter(a => a.type === 'receive')[1].status, 'notAttempted');
  });
  test('Player 2B coverSecondFor643 is a declared legacy route, not a new physical admission', () => {
    run('var m=firstBaseIncomingBoundary(' + JSON.stringify(options('2B', { occupied: 1 })) + ',"pending");m.activeSituation=null;m.groundBallInPlayState=null;setHighSchoolDefensiveBallContext(m,"normalGrounder");buildInfieldMeaningfulMoment(m,player,{playerPosition:m.position,primaryFielderPosition:' + JSON.stringify(options('SS').position) + ',ballDirection:"leftSide",batterSpeed:3,runnerSpeeds:[1,1,1],playerCapabilities:{fielding:10,reaction:10,range:10,arm:10,throwing:10,decision:10},routeWindowOverrides:{doublePlayWindow:"wide"},coverageQuality:"good",upstreamThrowQuality:"clean"});var s6CoverageChoice=getHighSchoolDefensiveMomentChoices(m).find(x=>x.routeId==="coverSecondFor643");');
    assert(run('Boolean(s6CoverageChoice)'), 'Existing legacy coverage route must be reachable in its declared slice');
    run('var coverageRolls=0;var s6Coverage=resolveInfieldDecision(m.defensiveSituation,s6CoverageChoice.matchDecision,m,()=>{coverageRolls++;return .8;});var s6CoverageSource=getHighSchoolLegacyReceiverScorerSource(m,m.defensiveSituation,s6Coverage,s6Coverage.actionFacts.actions.find(a=>a.type==="receive"));');
    assert.equal(run('coverageRolls'), 1); assert.equal(run('s6Coverage.playerRole'), 'coverPivot');
    assert.equal(run('s6Coverage.actionFacts.physicalIdentity'), null);
    assert.equal(run('s6CoverageSource.receiverId'), 'player'); assert.equal(run('s6CoverageSource.fields.independentReadiness.classification'), 'C');
    compatibility.push({ route: 'coverSecondFor643', sourceMode: 'declaredLegacyInfieldScenario', normalPhysicalAdmissionWitness: false,
      actionFacts: json('s6Coverage.actionFacts'), source: json('s6CoverageSource'), sampleCount: 1 });
  });
  for (const [pos, route, occupied, receiver] of [['SS', 'forceSecond', 1, '2B'], ['SS', 'homeForceOut', 3, 'C'], ['2B', 'attackLeadRunnerThird', 2, '3B'], ['2B', 'homeForceOut', 3, 'C']]) test(pos + ' ' + route + ' keeps the actual legal force actor and record', () => {
    const { v, sources } = saveCase(pos + ' ' + route, pos, { occupied }, route);
    assert.equal(v.outs, 1); assert.equal(v.record.totals.home.errors, 0); assert.equal(v.record.totals.away.hits, 0);
    assert.equal(actor(v, pos).A, 1); assert.equal(actor(v, receiver).PO, 1);
    assert.deepEqual(v.runners, v.legal.runnerSettlement.runnersAfter); assert.deepEqual(v.scores, { home: 1, away: 1 });
    assert.equal(sources[0].receiverId, actor(v, receiver).actorId);
  });
  for (const pos of ['SS', '2B']) test(pos + ' first force failure cannot start a second throw', () => {
    const { v } = saveCase(pos + ' first force failure', pos, { occupied: 1, weakReceiver: pos === 'SS' ? '2B' : 'SS' }, pos === 'SS' ? 'startDoublePlaySecond' : 'initiate463');
    checkResult(v, pos, { outs: 0, E: 0, H: 1, A: 0, PO: 0 });
    assert.equal(v.legal.actionFacts.actions.filter(a => a.type === 'throw')[1].status, 'notAttempted');
    assert(v.legal.defensiveAttribution.actors.every(a => a.PO === 0 && a.DP === 0));
  });
  test('1B canonical reference has independent readiness and secure failure with lawful E/A', () => {
    const { v } = saveCase('1B canonical ready muff', '1B', { direction: .1, capabilities: { fielding: 1, catching: 1, reaction: 10, range: 10 } });
    assert.equal(v.outs, 0); assert.equal(actor(v, '1B').E, 1); assert.equal(actor(v, 'SS').A, 1);
    assert.equal(actor(v, '1B').PO, 0); assert.equal(v.record.totals.home.errors, 1); assert.equal(v.record.totals.away.hits, 0);
    assert.equal(v.legal.firstBaseEvidence.incoming.ready, true); assert.equal(v.legal.firstBaseEvidence.incoming.secured, false);
    assert.deepEqual(v.runners, v.legal.runnerSettlement.runnersAfter); assert.deepEqual(v.scores, { home: 1, away: 1 });
  });
  test('1B late readiness reference does not manufacture E/A or a receive', () => {
    const { v } = saveCase('1B canonical not ready', '1B', { direction: .1, capabilities: { fielding: 10, catching: 10, reaction: 1, range: 1 } });
    assert.equal(v.outs, 0); assert.equal(v.legal.firstBaseEvidence.incoming.ready, false);
    assert.equal(actor(v, '1B').E, 0); assert.equal(actor(v, 'SS').A, 0); assert.equal(actor(v, '1B').PO, 0);
    assert.equal(v.record.totals.home.errors, 0); assert.equal(v.record.totals.away.hits, 1);
    assert.deepEqual(v.runners, v.legal.runnerSettlement.runnersAfter); assert.deepEqual(v.scores, { home: 1, away: 1 });
  });
  test('3B bounded ordinary muff reference preserves L01/L02 without upgrading its proxy', () => {
    const { v } = saveCase('3B reference muff', '3B', { weakReceiver: '1B' });
    checkResult(v, '3B', { outs: 0, E: 1, H: 0, A: 1, PO: 0 }); assert.equal(actor(v, '1B').E, 1);
    assert.equal(v.raw.timingResolution.firstLeg.receiverCompletion.atBase, true);
    assert.equal(v.raw.timingResolution.firstLeg.receiverCompletion.readinessMargin, undefined);
  });
  for (const pos of ['SS', '2B']) for (const preContract of [false, true]) test(pos + ' ' + (preContract ? 'pre-action-contract' : 'baseline') + ' pending/executed/settled recovery and duplicate use one sample', () => {
    run('var m=firstBaseIncomingBoundary(' + JSON.stringify(options(pos)) + ',"pending");var s6Pending=JSON.stringify(m.groundBallInPlayState);saveGame();player=createInitialPlayer("S6 cold pending");loadGame();m=player.highSchoolMatch;');
    assert.equal(run('JSON.stringify(m.groundBallInPlayState)'), run('s6Pending'));
    run('var s6Execution=firstBaseExecute(m,"secure",.8);var s6Cursor=m.simulationCursor;'); assert.equal(run('s6Execution.rolls'), 1);
    if (preContract) run('delete m.activeSituation.resolution.executionEvidence.actionFacts;delete m.activeSituation.resolution.executionEvidence.executionSample;if(m.groundBallInPlayState.shortstopExecution){delete m.groundBallInPlayState.shortstopExecution.resolution.actionFacts;delete m.groundBallInPlayState.shortstopExecution.resolution.executionSample;}');
    run('var s6Owned=JSON.stringify(m.groundBallInPlayState);var s6Random=Math.random;Math.random=()=>{throw Error("S6_FORBIDDEN_REROLL");};');
    try {
      run('saveGame();player=createInitialPlayer("S6 cold executed");loadGame();m=player.highSchoolMatch;'); assert.equal(run('JSON.stringify(m.groundBallInPlayState)'), run('s6Owned'));
      run('resumeResolvedHighSchoolGroundBallSettlement(m);var s6Once=firstBaseFacts(m);resumeResolvedHighSchoolGroundBallSettlement(m);'); assert.equal(run('firstBaseFacts(m)'), run('s6Once'));
      run('saveGame();player=createInitialPlayer("S6 cold settled");loadGame();m=player.highSchoolMatch;'); assert.equal(run('firstBaseFacts(m)'), run('s6Once'));
    } finally { run('Math.random=s6Random;'); }
    assert.equal(run('m.simulationCursor'), run('s6Cursor')); assert.equal(run('m.outs'), 1);
    assert.equal(run('m.gameRecord.totals.home.errors'), 0); assert.equal(run('m.gameRecord.totals.away.hits'), 0);
    assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(m)'), []); assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'), []);
    compatibility.push({ pos, preContract, sampleCount: 1, phases: ['pending', 'executed', 'settled'], noReroll: true, noRecordRewriteOnSettledReload: true });
  });
  for (const pos of ['SS', '2B']) for (const [name, mutation] of [
    ['receiver identity', 'probe.highSchoolMatch.activeSituation.resolution.executionEvidence.actionFacts.actions.find(a=>a.type==="receive").actorId="forged";'],
    ['action dependency', 'probe.highSchoolMatch.activeSituation.resolution.executionEvidence.actionFacts.actions.find(a=>a.type==="receive").dependsOn=[];'],
    ['original sample', 'probe.highSchoolMatch.activeSituation.resolution.executionEvidence.executionSample=.01;'],
    ['route copy', 'probe.highSchoolMatch.activeSituation.executionState.selectedRoute="forged";'],
    ['capability snapshot', 'probe.highSchoolMatch.activeSituation.resolution.executionEvidence.actionFacts.actions.find(a=>a.type==="receive").provenance.capabilities.fielding=100;']
  ]) test(pos + ' save rejects ' + name + ' tamper without mutation', () => {
    run('var m=firstBaseIncomingBoundary(' + JSON.stringify(options(pos)) + ',"pending");firstBaseExecute(m,"secure",.8);var s6Live=JSON.stringify(player);var probe=JSON.parse(s6Live);' + mutation + 'var s6Probe=JSON.stringify(probe);');
    assert.throws(() => run('normalizeSave(probe);'));
    assert.equal(run('JSON.stringify(probe)'), run('s6Probe')); assert.equal(run('JSON.stringify(player)'), run('s6Live'));
  });
  for (const [name, mutation] of [
    ['receiver identity', 'probe.highSchoolMatch.groundBallInPlayState.shortstopExecution.resolution.actionFacts.actions.find(a=>a.type==="receive").actorId="forged";'],
    ['action dependency', 'probe.highSchoolMatch.groundBallInPlayState.shortstopExecution.resolution.actionFacts.actions.find(a=>a.type==="receive").dependsOn=[];'],
    ['sample', 'probe.highSchoolMatch.groundBallInPlayState.shortstopExecution.sample=.01;'],
    ['receiver capability', 'probe.highSchoolMatch.groundBallInPlayState.shortstopExecution.resolution.actionFacts.actions.find(a=>a.type==="receive").provenance.capabilities.fielding=100;']
  ]) test('SS authoritative cache rejects ' + name + ' tamper', () => {
    run('var m=firstBaseIncomingBoundary(' + JSON.stringify(options('SS')) + ',"pending");firstBaseExecute(m,"secure",.8);var s6Live=JSON.stringify(player);var probe=JSON.parse(s6Live);' + mutation + 'var s6Probe=JSON.stringify(probe);');
    assert.throws(() => run('normalizeSave(probe);')); assert.equal(run('JSON.stringify(probe)'), run('s6Probe'));
    assert.equal(run('JSON.stringify(player)'), run('s6Live'));
  });
}
const summary = { passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, total: results.length };
const gapSummary = { passed: gaps.filter(r => r.pass).length, failed: gaps.filter(r => !r.pass).length, total: gaps.length };
console.log('S6_RECEIVER_SUMMARY ' + JSON.stringify({ red, summary, gapSummary, strategy: 'C', newAuthorityEnabled: false }));
if (process.argv.includes('--json')) console.log('S6_JSON=' + JSON.stringify({ baseline, exactBaseline, red, summary, gapSummary, results, cases, gaps, migrationWitnesses, compatibility, oldFocusedTestSha256: sha(original) }));
if (red ? gapSummary.failed : summary.failed) process.exitCode = 1;
module.exports = { summary, gapSummary, results, cases, gaps, migrationWitnesses, compatibility };
