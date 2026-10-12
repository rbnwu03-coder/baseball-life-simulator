'use strict';
// Sprint 7 DESIGN ONLY. Proposed coefficients, no Production/cache/save writes.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const Module = require('module'), assert = require('assert/strict');
const Decision = require('../defensive-decision-throw-foundation.js');
const Force = require('../force-advancement.js');
const root = path.resolve(__dirname, '..');
const VERSION = 'receiver-execution-v2-proposal-0';
const SAMPLER = 'sha256-first-u32-v0';
const clone = value => JSON.parse(JSON.stringify(value));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function sampleHex(sample) { const b = Buffer.alloc(8); b.writeDoubleBE(sample); return b.toString('hex'); }
function variations(input, leg, scheme = 'B') {
  assert(['A', 'B'].includes(scheme));
  // Actor, route, skill and outcome are intentionally absent from the sample key.
  const key = { version: SAMPLER, model: VERSION, physicalIdentity: input.physicalIdentity,
    ...(scheme === 'A' ? { ownedSampleHex: sampleHex(input.ownedSample) } : {}) };
  return Object.fromEntries(['positioning', 'secure', 'touch'].map(stage => {
    const digest = crypto.createHash('sha256').update(canonical({ ...key, leg, stage })).digest();
    return [stage, (digest.readUInt32BE(0) + .5) / 4294967296];
  }));
}
function bind(input) {
  assert.equal(input.modelVersion, VERSION); assert(input.physicalIdentity && input.playIdentity);
  assert(Number.isFinite(input.ownedSample) && input.ownedSample >= 0 && input.ownedSample < 1);
  return { modelVersion: VERSION, samplerVersion: SAMPLER, inputDigest: sha(canonical(input)),
    physicalIdentity: input.physicalIdentity, runtimeEnabled: false };
}
function validateBinding(input, admission) {
  assert.equal(admission.modelVersion, VERSION, 'unknown or changed version');
  assert.equal(admission.samplerVersion, SAMPLER, 'unknown sampler version');
  assert.equal(input.modelVersion, admission.modelVersion, 'upgrade/downgrade rejected');
  assert.equal(admission.inputDigest, sha(canonical(input)), 'changed admission input');
  assert.equal(admission.physicalIdentity, input.physicalIdentity); assert.equal(admission.runtimeEnabled, false);
}
function position(caps, demand, ballArrival, u) {
  assert(['reaction', 'range', 'mobility'].every(k => Number.isFinite(caps[k]) && caps[k] >= 0 && caps[k] <= 20));
  assert(Number.isFinite(demand.movement) && demand.movement >= 0 && demand.movement <= 8);
  // Proposed Movement Demand Units / existing-family Coarse Relative Time Units.
  const movementSpeed = .5 + .06 * caps.mobility;
  const startDelay = Math.max(.1, 1.5 - .06 * caps.reaction + (u - .5) * .25);
  const completion = startDelay + demand.movement / movementSpeed;
  const reachable = demand.available && demand.movement <= 1 + .4 * caps.range;
  return { startingContext: demand.startingContext, movement: demand.movement,
    reachable, completion, ready: reachable && Number.isFinite(ballArrival) && completion <= ballArrival,
    units: 'coarseRelativeArrival (proposed positioning extension)', variation: u, sourceClass: 'C-proposed' };
}
function leg(input, index, startTime, permitted, scheme) {
  const item = input.legs[index], u = variations(input, index + 1, scheme);
  const q = item.delivery.quality;
  assert(['onTarget', 'challengingReceive', 'lateWeakThrow', 'offline', 'notAttempted'].includes(q));
  const distance = { short: 0, medium: 1, long: 2 }[item.delivery.distanceClass]; assert(Number.isFinite(distance));
  const qualityDelay = { onTarget: 0, challengingReceive: 1, lateWeakThrow: 3, offline: 0, notAttempted: 0 }[q];
  const launched = permitted && item.delivery.attempted;
  const delivered = launched && !['offline', 'notAttempted'].includes(q);
  const ballArrival = launched ? startTime + 4 + distance + qualityDelay + item.delivery.releaseDelay : null;
  // Each leg's cover can start at this leg's release in this bounded proposal.
  // Concurrent cover during the preceding leg is an unresolved relay extension.
  const localArrival = ballArrival === null ? null : ballArrival - startTime;
  const positioning = position(item.capabilities, item.positioning, delivered ? localArrival : null, u.positioning);
  positioning.completion += startTime;
  const attempt = delivered && positioning.ready;
  const secureDemand = 5 + (q === 'challengingReceive' ? 1.2 : 0) + item.environment.secureDemandAdjustment;
  const margin = .65 * item.capabilities.catching + .35 * item.capabilities.fielding + (u.secure - .5) * 4 - secureDemand;
  const secured = attempt && margin >= 0;
  const quality = !attempt ? 'notAttempted' : !secured ? 'failedHands' : margin < 1 ? 'bobbleButControlled' : 'cleanControl';
  const cleanSecureDelay = .15 + (q === 'challengingReceive' ? .3 : 0);
  const secureCompletion = secured ? ballArrival + cleanSecureDelay + (quality === 'bobbleButControlled' ? .6 : 0) : null;
  const touchDelay = (item.contest.kind === 'tag' ? item.contest.tagDelay : item.contest.baseTouchDelay) + (u.touch - .5) * .04;
  const touchCompletion = secured ? secureCompletion + touchDelay : null;
  const legal = item.contest.legal && item.contest.liveForce && item.contest.kind === 'baseTouch';
  const out = legal && secured && touchCompletion < item.runnerArrival;
  const cleanBallArrival = startTime + 4 + distance + (q === 'lateWeakThrow' ? 3 : q === 'challengingReceive' ? 1 : 0) + item.delivery.releaseDelay;
  // Change only failed hands, or offline accuracy, for the scorer counterfactual.
  // Preserve weak strength, release, runner inputs and proposed positioning.
  const cleanPosition = position(item.capabilities, item.positioning, cleanBallArrival - startTime, u.positioning);
  const cleanCompletion = launched && cleanPosition.ready ? cleanBallArrival + cleanSecureDelay + touchDelay : null;
  const referenceCaps = { reaction: 10, range: 10, mobility: 10 };
  const reference = position(referenceCaps, item.positioning, cleanBallArrival - startTime, .5);
  const effortEligible = reference.ready && 10 >= secureDemand;
  return { index: index + 1, delivery: { ...clone(item.delivery), launched, available: delivered, ballArrival,
      actualThrower: item.thrower, actualReceiver: item.receiver, originalActionIdentity: item.sourceThrowIdentity },
    positioning, secure: { attempt, secured, quality, margin, demand: secureDemand, completion: secureCompletion,
      capabilities: clone(item.capabilities), variation: u.secure, sourceClass: 'C-proposed' },
    contest: { kind: item.contest.kind, possession: secured, touchCompletion, runnerArrival: item.runnerArrival,
      liveForce: item.contest.liveForce, legal, proposedOut: out, tiesDoNotRetire: true },
    scorerCounterfactual: { cleanCompletion, potentialOut: cleanCompletion === null ? 'insufficient' : cleanCompletion < item.runnerArrival ? 'feasible' : 'alreadySafe',
      ordinaryEffort: effortEligible ? 'eligible' : 'ineligible',
      ordinaryEffortSource: 'ILLUSTRATIVE average-at-position=10; NOT approved league calibration',
      productionEffortStatusUntilCalibration: 'insufficient', attributableAdvancement: [] },
    samples: u, sourceClasses: clone(item.sourceClasses), runtimeEnabled: false };
}
function execute(input, admission = bind(input), scheme = 'B') {
  validateBinding(input, admission); const results = [];
  const first = leg(input, 0, 0, true, scheme); results.push(first);
  if (input.legs.length > 1) {
    // Never synthesize a pivot after the first force failed.
    const permitted = first.contest.proposedOut && input.legacyPivotCompleted;
    results.push(leg(input, 1, (first.contest.touchCompletion || 0) + input.pivotDelay, permitted, scheme));
  }
  const actions = clone(input.originalActionFacts.actions), retirement = [], contests = [];
  const throwIndices = actions.map((a, i) => a.type === 'throw' ? i : -1).filter(i => i >= 0);
  for (const [i, result] of results.entries()) {
    const item = input.legs[i], ti = throwIndices[i], ri = ti + 1, terminal = ri + 1;
    actions[ti].status = !result.delivery.launched ? 'notAttempted' : result.delivery.quality === 'offline' ? 'failed' : 'completed';
    actions[ri].status = !result.delivery.available ? 'notAttempted' : !result.positioning.ready ? 'unavailable' : result.secure.secured ? 'completed' : 'failed';
    actions[terminal].status = result.contest.proposedOut ? 'completed' : result.secure.secured ? 'late' : 'notAttempted';
    if (i === 0 && input.legs.length > 1) actions[terminal + 1].status = result.contest.proposedOut && input.legacyPivotCompleted ? 'completed' : 'notAttempted';
    if (result.contest.proposedOut) retirement.push({ runnerId: item.targetRunnerId, targetBase: item.targetBase, outType: item.outType, sequence: retirement.length + 1 });
    const failed = actions[ti].status === 'failed' ? actions[ti] : actions[ri].status === 'failed' ? actions[ri] : null;
    if (failed) contests.push({ failedActionId: failed.identity, runnerId: item.targetRunnerId, targetBase: item.targetBase,
      ordinaryEffort: { status: result.scorerCounterfactual.ordinaryEffort, source: result.scorerCounterfactual.ordinaryEffortSource },
      potentialOut: { status: result.scorerCounterfactual.potentialOut, source: 'PROPOSED same-input clean correction only',
        ...(result.scorerCounterfactual.cleanCompletion === null ? {} : { cleanCompletion: result.scorerCounterfactual.cleanCompletion, runnerArrival: item.runnerArrival }) },
      dpLeg: i + 1, firstRetirementId: retirement.find(r => r.outType === 'force')?.runnerId || null, attributableAdvancement: [] });
  }
  const facts = Decision.createActionFacts({ ...input.originalActionFacts, sourceAuthority: 'ISOLATED PROPOSAL; never Production cache', actions });
  // Reuse the current scorer, never implement a second E/A rule engine.
  const scorer = Decision.resolveScorerEligibility({ actionFacts: facts, retirements: retirement, contests });
  const attribution = Decision.projectDefensiveAttribution(facts, retirement, scorer);
  const conservativeScorer = Decision.resolveScorerEligibility({ actionFacts: facts, retirements: retirement,
    contests: contests.map(c => ({ ...c, ordinaryEffort: { status: 'insufficient', source: 'Proposed effort reference has no approved league calibration' } })) });
  const conservativeAttribution = Decision.projectDefensiveAttribution(facts, retirement, conservativeScorer);
  const forcePrevented = scorer.decisions.some(d => d.charged && d.potentialOut === 'feasible'
    && input.legs.some(l => l.targetRunnerId === d.runnerId && l.outType === 'force'));
  const actualForce = retirement.some(r => r.outType === 'force');
  const batterOut = retirement.some(r => r.runnerId === input.batterId);
  const possiblePA = { H: batterOut || actualForce || forcePrevented || scorer.batterReachedOnError ? 0 : 1,
    classification: batterOut ? 'out' : actualForce || forcePrevented ? 'fieldersChoice' : scorer.batterReachedOnError ? 'reachedOnError' : 'hitCandidate',
    owner: 'UNAPPLIED design consequence of current force/ROE rules; GameRecord never called' };
  return { version: VERSION, runtimeEnabled: false, results, proposedRetirements: retirement, actionFacts: facts,
    possibleScorer: scorer, possibleAttribution: attribution, possiblePA,
    conservativeUntilEffortCalibration: { scorer: conservativeScorer, attribution: conservativeAttribution,
      actualRetirementsUnchanged: true, note: 'Missing ordinary-effort authority does not grant E or would-be A' },
    proposedSettlement: Force.settleForceAdvancement({ forceChain: input.forceChain, movementIntents: input.movementIntents, retirements: retirement }),
    warning: 'Hypothetical execution migration, not Regression PASS or official statistics. Tag/third-out/extra-advancement not implemented.' };
}
function harness() {
  const p = path.join(root, 'tests/infield-scorer-recovery-integrity-repair-test.js'), s = fs.readFileSync(p, 'utf8');
  const boundary = s.indexOf("for(const position of ['SS','2B','3B'])test"); assert(boundary > 0);
  const m = new Module(p, module); m.filename = p; m.paths = Module._nodeModulePaths(path.dirname(p));
  m._compile(s.slice(0, boundary) + '\nmodule.exports={run,json,fixture,options};', p); return m.exports;
}
function deriveCandidate(v, source, sidecar) {
  const raw = v.raw, actions = raw.actionFacts.actions;
  const throws = actions.filter(a => a.type === 'throw');
  const legs = throws.map((a, i) => {
    const receive = actions.find(x => x.type === 'receive' && x.dependsOn.includes(a.identity));
    const terminal = actions.find(x => ['baseTouch', 'tag'].includes(x.type) && x.dependsOn.includes(receive.identity));
    const actor = source.actors[receive.actorPosition];
    const caps = clone(receive.provenance.capabilities);
    caps.catching = caps.catching ?? caps.fielding; caps.mobility = actor.speed;
    assert(Number.isFinite(caps.mobility), 'Original receiver speed is required; no default mobility');
    const thrown = i === 0 ? source.throwResolution : raw.timingResolution.secondLeg?.throw;
    const canonicalDelivery = thrown && !String(thrown.throwQuality).startsWith('legacy');
    const runnerState = source.runnerPhysicalStates.find(r => r.runnerId === terminal.runnerId);
    assert(runnerState, 'Original runner state required');
    const start = { preparedStart: -1, normalStart: 0, lateStart: 1, brokenStart: 2 }[runnerState.startQuality];
    const progress = { early: 0, midway: 1.5, late: 3, nearArrival: 4 }[runnerState.advancementProgress || 'early'];
    const runnerArrival = 10 - Math.max(0, Math.min(20, runnerState.speed)) * .45 + start - progress;
    const quality = canonicalDelivery ? thrown.throwQuality : a.status === 'notAttempted' ? 'notAttempted' : a.status === 'failed' ? 'offline' : 'onTarget';
    const distance = canonicalDelivery && thrown.throwDemand?.distanceClass || (i === 1 ? 'medium' : 'short');
    return { thrower: { id: a.actorId, position: a.actorPosition }, receiver: { id: receive.actorId, position: receive.actorPosition },
      sourceThrowIdentity: a.identity, targetRunnerId: terminal.runnerId, targetBase: terminal.targetBase,
      capabilities: caps, runnerState, runnerArrival,
      delivery: { attempted: a.status !== 'notAttempted', quality, distanceClass: distance,
        releaseDelay: thrown?.releaseQuality === 'delayedRelease' ? 1 : 0 },
      positioning: { available: true, startingContext: sidecar?.startingContext || 'PROPOSED covering target base',
        movement: i === 0 ? sidecar?.movement ?? .25 : .25 },
      environment: { secureDemandAdjustment: 0, source: 'PROPOSED neutral field/weather, not measured' },
      contest: { kind: terminal.type, legal: true, liveForce: source.forceChain.forceTargets[terminal.runnerId] === terminal.targetBase,
        baseTouchDelay: .1, tagDelay: 1 }, outType: terminal.runnerId === source.batterId ? 'batterRunnerBeforeFirst' : 'force',
      sourceClasses: { actors: 'A', originalSample: 'A', deliveryOutcome: 'A', qualityAndFlight: canonicalDelivery && thrown.throwDemand ? 'A/B' : 'C-PROPOSED delivery class/distance (NOT legacy truth)',
        runnerArrival: 'B original runner physical state using unchanged current formula',
        catching: 'B fielding alias if absent; not independent Career catching', mobility: 'A original roster speed; proposed stage mapping',
        positioning: 'C-PROPOSED new starting context/movement', secure: 'C-PROPOSED', touchDelay: 'C-PROPOSED', ordinaryEffort: 'C-PROPOSED uncalibrated average profile' } };
  });
  return { modelVersion: VERSION, playIdentity: raw.actionFacts.playIdentity, physicalIdentity: raw.actionFacts.physicalIdentity,
    route: source.route, topologyVersion: source.topologyVersion, ownedSample: raw.executionSample,
    batterId: source.batterId, forceChain: source.forceChain, movementIntents: source.movementIntents,
    originalActionFacts: raw.actionFacts, legacyPivotCompleted: actions.find(a => a.type === 'pivot')?.status === 'completed',
    pivotDelay: 1, legs, runtimeEnabled: false };
}
function pearson(a, b) {
  const mean = x => x.reduce((s, v) => s + v, 0) / x.length, ma = mean(a), mb = mean(b);
  const cov = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0);
  return cov / Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0) * b.reduce((s, v) => s + (v - mb) ** 2, 0));
}
function main() {
  const h = harness(), scenarios = [
    ['cleanShortThrow', 'SS', { occupied: 1 }, 'forceSecond'],
    ['cleanDirect63', 'SS', {}, 'secureFirstBaseOut'],
    ['longThrow53', '3B', {}, 'secureFirstBaseOut'],
    ['offlineThrow', 'SS', { sample: .5, capabilities: { throwing: 1, arm: 10 } }, 'secureFirstBaseOut'],
    ['lateReceiver', 'SS', {}, 'secureFirstBaseOut', { movement: 5, startingContext: 'PROPOSED distant cover, no existing coordinates' }],
    ['failedHands', 'SS', { weakReceiver: '1B' }, 'secureFirstBaseOut'],
    ['fastRunner', 'SS', { batterSpeed: 18 }, 'secureFirstBaseOut'],
    ['ordinaryReceiverMuff', '3B', { weakReceiver: '1B' }, 'secureFirstBaseOut'],
    ['firstForceThenRelayFails', '2B', { occupied: 1, npc: { SS: { arm: 1 } } }, 'initiate463'],
    ['firstForceFailsNoSecondLeg', 'SS', { occupied: 1, weakReceiver: '2B' }, 'startDoublePlaySecond'],
    ['partialDpFinalMuff', 'SS', { occupied: 1, weakReceiver: '1B' }, 'startDoublePlaySecond'],
    ['alreadySafeMuff', 'SS', { weakReceiver: '1B', batterSpeed: 18 }, 'secureFirstBaseOut']
  ];
  const cases = [], checks = [], recordCheck = (name, fn) => { fn(); checks.push({ name, pass: true }); };
  for (const [name, pos, extra, route, sidecar] of scenarios) {
    const v = h.fixture(h.options(pos, extra), route, 'meaningful');
    const source = h.json('({throwResolution:m.groundBallInPlayState.decisionThrowState.throwResolution,runnerPhysicalStates:m.groundBallInPlayState.runnerPhysicalStates,forceChain:m.defensiveSituation.forceChain,movementIntents:m.defensiveSituation.movementIntents,batterId:m.defensiveSituation.batterId,topologyVersion:getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth).topologyVersion,route:m.lastDefensiveResolution.initialRoute,actors:Object.fromEntries(["1B","2B","SS","3B","C","P"].map(p=>[p,TeamRosterFoundation.getCurrentDefender(m.rosters[m.defenseTeam],p)]))})');
    const input = deriveCandidate(v, source, sidecar), beforeInput = canonical(input);
    const before = h.run('JSON.stringify(m)'), originalRandom = Math.random;
    Math.random = () => { throw Error('PROTOTYPE_MUST_NOT_SAMPLE_RANDOM'); };
    let candidate;
    try { candidate = execute(input); } finally { Math.random = originalRandom; }
    recordCheck(name + ' isolation and deterministic repeat', () => {
      assert.equal(canonical(input), beforeInput); assert.equal(h.run('JSON.stringify(m)'), before);
      assert.equal(input.ownedSample, extra.sample ?? .8, 'same explicitly supplied original fixture sample');
      assert.deepEqual(execute(clone(input), clone(bind(input))), candidate);
      assert.deepEqual(execute(JSON.parse(JSON.stringify(input))), candidate);
    });
    cases.push({ name, fixtureInputs: h.options(pos, extra), declaredPositioningSidecar: sidecar || null,
      fixedInputs: input, physicalIdentity: input.physicalIdentity,
      legacy: { outs: v.outs, bases: v.runners, runs: v.scores, H: v.record.totals.away.hits, E: v.record.totals.home.errors,
        attribution: v.legal.defensiveAttribution.actors, actionFacts: v.raw.actionFacts, scorer: v.legal.scorerFacts },
      candidate, expectedMigrationDifference: { retirementCountChanged: v.outs !== candidate.proposedRetirements.length,
        scorerErrorChanged: v.record.totals.home.errors !== candidate.possibleAttribution.actors.reduce((s, a) => s + a.E, 0),
        hitClassificationChanged: v.record.totals.away.hits !== candidate.possiblePA.H,
        interpretation: 'Any difference is hypothetical MODEL MIGRATION, not Production regression or validated balance' },
      isolation: { inputUnchanged: true, legacyVmUnchanged: true, candidateMatchRngCallbacks: 0,
        originalSampleSuppliedOnce: true, legacyPublicSampleCallbackInvoked: false,
        callbackCountComparisonStatus: 'NOT MEASURED: fixture supplies sample directly; no public handler invoked', productionCacheWrites: 0 } });
  }
  const byName = Object.fromEntries(cases.map(c => [c.name, c]));
  recordCheck('nine required scenarios use distinct meaningful stage conditions', () => {
    assert.equal(byName.cleanShortThrow.fixedInputs.legs[0].delivery.distanceClass, 'short');
    assert.equal(byName.longThrow53.fixedInputs.legs[0].delivery.distanceClass, 'long');
    assert.equal(byName.offlineThrow.candidate.results[0].delivery.available, false);
    assert.equal(byName.lateReceiver.candidate.results[0].positioning.ready, false);
    assert.equal(byName.failedHands.candidate.results[0].positioning.ready, true);
    assert.equal(byName.failedHands.candidate.results[0].secure.secured, false);
    assert.equal(byName.fastRunner.candidate.results[0].secure.secured, true);
    assert.equal(byName.fastRunner.candidate.proposedRetirements.length, 0);
    assert.equal(byName.ordinaryReceiverMuff.candidate.possibleAttribution.actors.reduce((s, a) => s + a.E, 0), 1);
    assert.equal(byName.firstForceThenRelayFails.candidate.proposedRetirements.length, 1);
    assert.equal(byName.firstForceFailsNoSecondLeg.candidate.results[1].delivery.launched, false);
    assert.equal(byName.alreadySafeMuff.candidate.possibleAttribution.actors.reduce((s, a) => s + a.E, 0), 0);
  });
  const probe = clone(byName.cleanDirect63.fixedInputs), admission = bind(probe);
  const mutations = { actor: x => { x.legs[0].receiver.id = 'forged'; }, route: x => { x.route = 'forged'; },
    sample: x => { x.ownedSample = .01; }, ability: x => { x.legs[0].capabilities.fielding = 20; },
    version: x => { x.modelVersion = 'legacy'; }, actionCopy: x => { x.originalActionFacts.actions[2].dependsOn = []; } };
  for (const [name, mutate] of Object.entries(mutations)) recordCheck('pure admission binding rejects ' + name + ' (NOT normalizeSave test)', () => {
    const changed = clone(probe); mutate(changed); assert.throws(() => validateBinding(changed, admission));
  });
  recordCheck('actor/skill changes do not generate another stage sample', () => {
    const changed = clone(probe); changed.legs[0].receiver.id = 'newActor'; changed.legs[0].capabilities.catching = 20;
    assert.deepEqual(variations(changed, 1), variations(probe, 1));
  });
  recordCheck('both schemes freeze actor/route keys and B ignores the old sample', () => {
    const x = clone(probe); x.route = 'anotherRoute'; x.legs[0].receiver.id = 'otherActor';
    for (const scheme of ['A', 'B']) assert.deepEqual(variations(x, 1, scheme), variations(probe, 1, scheme));
    x.ownedSample = .123;
    assert.deepEqual(variations(x, 1, 'B'), variations(probe, 1, 'B'));
    assert.notDeepEqual(variations(x, 1, 'A'), variations(probe, 1, 'A'));
    assert.notDeepEqual(variations(probe, 1), variations(probe, 2));
  });
  recordCheck('unapproved ordinary-effort facts never automatically grant E or would-be A', () => {
    for (const c of cases) {
      const conservative = c.candidate.conservativeUntilEffortCalibration;
      assert.equal(conservative.attribution.actors.reduce((s, a) => s + a.E, 0), 0);
      assert.deepEqual(conservative.attribution.retirements, c.candidate.possibleAttribution.retirements);
      assert.equal(conservative.scorer.decisions.some(d => d.charged), false);
    }
  });
  const sensitivity = [];
  for (const ability of ['reaction', 'range', 'mobility', 'catching', 'fielding', 'arm', 'throwing', 'decision']) {
    let previous = null;
    for (const level of [1, 5, 10, 20]) {
      const x = clone(probe); x.legs[0].capabilities[ability] = level;
      const y = execute(x), l = y.results[0];
      const row = { ability, level, positioningCompletion: l.positioning.completion, reachability: l.positioning.reachable,
        secureMargin: l.secure.margin, samples: l.samples, proposedOut: l.contest.proposedOut };
      if (previous) {
        if (['reaction', 'mobility'].includes(ability)) assert(row.positioningCompletion <= previous.positioningCompletion);
        if (ability === 'range') assert(Number(row.reachability) >= Number(previous.reachability));
        if (['catching', 'fielding'].includes(ability)) assert(row.secureMargin >= previous.secureMargin);
        if (['arm', 'throwing', 'decision'].includes(ability)) assert.deepEqual({ ...row, level: 0 }, { ...previous, level: 0 });
        assert.deepEqual(row.samples, previous.samples);
      }
      sensitivity.push(row); previous = row;
    }
  }
  recordCheck('32 fixed-sample pure capability rows preserve stage ownership', () => assert.equal(sensitivity.length, 32));
  const correlation = {};
  for (const scheme of ['A', 'B']) {
    const rows = Array.from({ length: 4096 }, (_, i) => variations({ ...probe, physicalIdentity: 'DECLARED design-cohort-' + i, ownedSample: (i + .5) / 4096 }, 1, scheme));
    correlation[scheme] = { count: rows.length, positioningSecurePearson: pearson(rows.map(r => r.positioning), rows.map(r => r.secure)),
      secureTouchPearson: pearson(rows.map(r => r.secure), rows.map(r => r.touch)),
      min: Math.min(...rows.flatMap(r => Object.values(r))), max: Math.max(...rows.flatMap(r => Object.values(r))),
      warning: 'Synthetic namespace diagnostic, not natural Production distribution or statistical independence proof' };
  }
  const output = { createdAt: new Date().toISOString(), baseline: '37c0735dbe22e101b572f76b1847d47d9adca590', runtimeEnabled: false,
    modelVersion: VERSION, samplerVersion: SAMPLER, coefficientStatus: 'ILLUSTRATIVE, NOT calibrated or approved',
    productionSaveTestStatus: 'NOT IMPLEMENTED / NOT RUN',
    prototypeSourceSha256: sha(fs.readFileSync(__filename)), cases, checks, sensitivity, correlation,
    isolation: { allCasesUnchanged: true, candidateMatchRngCallbacks: 0, productionCacheWrites: 0, officialRecordWrites: 0,
      originalTestSourceModified: false, newVersionsPassedNormalizeSave: false } };
  const capture = process.argv.includes('--capture') || process.argv.includes('--capture-final');
  const file = path.join(__dirname, process.argv.includes('--capture-final')
    ? 'receiver-execution-v2-sprint-7-counterfactual-final-evidence.json' : 'receiver-execution-v2-sprint-7-counterfactual-evidence.json');
  if (capture) fs.writeFileSync(file, JSON.stringify(output, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ cases: cases.length, isolationChecks: checks.length, sensitivityRows: sensitivity.length,
    changedRetirementCounts: cases.filter(c => c.expectedMigrationDifference.retirementCountChanged).map(c => c.name),
    changedScorerErrors: cases.filter(c => c.expectedMigrationDifference.scorerErrorChanged).map(c => c.name), correlation, runtimeEnabled: false, captured: capture }));
  return output;
}
if (require.main === module) main();
module.exports = { VERSION, SAMPLER, variations, bind, validateBinding, position, execute, main };
