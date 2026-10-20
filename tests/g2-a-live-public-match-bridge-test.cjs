'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const Bridge = require('../live-public-match-bridge.js');
const S = require('./match-vnext-same-ball-production-integration-test.cjs');
const { makeContext } = require('./high-school-career-test-context.js');
const evidence = { suite: 'g2-a-live-public-match-bridge', cases: {}, safety: [], persistence: [], normalGame: null };
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
const projection = h => h.json('LivePublicMatchBridge.readCurrent()');
const readMatch = h => h.json('player.highSchoolMatch');
const facts = h => h.json('({record:player.highSchoolMatch.gameRecord,outs:player.highSchoolMatch.outs,runners:player.highSchoolMatch.runners,scores:player.highSchoolMatch.scores,seed:player.highSchoolMatch.simulationSeed,skills:player.baseballSkills})');
function reveal(h) {
  h.run('while(player.highSchoolMatch.presentedEventCursor<player.highSchoolMatch.simulationLog.length)advanceHighSchoolPresentationCursor(player.highSchoolMatch)');
}
function assertFrozen(value) {
  if (!value || typeof value !== 'object') return;
  assert(Object.isFrozen(value));
  Object.values(value).forEach(assertFrozen);
}
function noPrivate(value) {
  assert.doesNotMatch(JSON.stringify(value), /"(?:pendingPitch|intendedPitchClass|intentRoll|realizationRoll|rolls|samples|pitchTacticalState|pitchIntent|targetIntent|mentalState|capabilities|frozenDistribution|debugTrace)"/);
}
function pureRead(h, label) {
  h.run('var bridgeBefore=JSON.stringify(player);var bridgeSourceFrozen=Object.isFrozen(player.highSchoolMatch);var bridgeRandom=Math.random;Math.random=()=>{throw Error("BRIDGE_RNG_CONSUMED")};');
  let first;
  try {
    first = projection(h);
    for (let i = 0; i < 3; i++) assert.deepEqual(projection(h), first);
    h.run('var bridgeConsumer=LivePublicMatchBridge.createConsumer();bridgeConsumer.read();while(bridgeConsumer.advancePresentation()){}');
  } finally { h.run('Math.random=bridgeRandom'); }
  assert(h.run('bridgeBefore===JSON.stringify(player)'));
  assert(h.run('bridgeSourceFrozen===Object.isFrozen(player.highSchoolMatch)'));
  noPrivate(first);
  const ids = first.timeline.events.map(e => e.eventId);
  assert.equal(new Set(ids).size, ids.length);
  const order = first.timeline.events.map(e => [e.order.sourceSequence, e.order.evidenceOrder]);
  assert.deepEqual(order, order.slice().sort((a,b) => a[0]-b[0] || a[1]-b[1]));
  evidence.safety.push({ label, repeatedReads: 4, noRng: true, noMutation: true, uniqueEventIds: ids.length });
  return first;
}
function outfieldFixture(kind) {
  const filename = path.join(__dirname, kind === 'B' ? 'g1-a-outfield-flyout-attribution-lf-coverage-test.cjs' : 'g1-b-outfield-single-grounded-continuation-test.cjs');
  const source = fs.readFileSync(filename, 'utf8');
  const boundary = kind === 'B' ? 'for (const [position' : 'const positions=';
  const end = source.indexOf(boundary);
  assert(end > 0, 'exact original fixture prefix');
  // Original accepted fixture/setup definitions; no source replacements and no old cohort execution.
  const context = vm.createContext({ require: Module.createRequire(filename), __dirname, process, console });
  vm.runInContext(source.slice(0, end), context, { filename });
  const h = { run: s => vm.runInContext('run(' + JSON.stringify(s) + ')', context),
    json: s => vm.runInContext('json(' + JSON.stringify(s) + ')', context) };
  h.run('var x=' + (kind === 'B' ? 'g1Fixture(.05,0)' : 'g1bFixture(.5,0)') + ',m=x.m;');
  return { h, fixture: { filename: path.basename(filename), prefixSha256: crypto.createHash('sha256').update(source.slice(0,end)).digest('hex') } };
}
function nextOrdinary(h) {
  h.run('resolveSimulatedHighSchoolPlateAppearance(player.highSchoolMatch,()=>.62,{allowPlayer:true})');
  reveal(h);
  return projection(h);
}
function reload(h, label) {
  const before = projection(h), original = facts(h);
  h.run('saveGame();loadGame();');
  const after = projection(h);
  assert.deepEqual(after, before, label + ' exact public projection retained');
  assert.deepEqual(facts(h), original, label + ' gameplay not settled again');
  evidence.persistence.push({ label, snapshot: after.snapshot, eventIds: after.timeline.events.map(e => e.eventId), sameProjection: true, gameplayUnchanged: true });
}

test('CommonJS API and unavailable source have explicit statuses', () => {
  assert.equal(Bridge.VERSION, 'g2-a-live-public-match-v1');
  assert.equal(Bridge.project(null).snapshot.status, 'unavailable');
  assert.equal(Bridge.project({ id:'unsupported' }).snapshot.status, 'unsupported');
  assert.equal(Bridge.project(null).snapshot.identity.matchId.value, null);
  assertFrozen(Bridge.project(null));
  assert.equal(Bridge.submitDecision, undefined);
});
test('Exact additive loader and guard migration preserve all original source validation', () => {
  const base='9c829c32663c808686b187ce15807b297663ed4f',norm=s=>s.replace(/\r\n?/g,'\n');
  const original=file=>norm(cp.execFileSync('git',['--no-optional-locks','show',base+':'+file],{encoding:'utf8',maxBuffer:4*1024*1024}));
  const prior='  <script src="script.js"></script>\n  <script src="application-controller.js"></script>';
  const bridge='  <script src="script.js"></script>\n  <script src="live-public-match-bridge.js"></script>\n  <script src="application-controller.js"></script>';
  const index=require('./g2-b2-source-delta.cjs').stripIndex(norm(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8')));
  assert.equal(index.split(bridge).length,2);
  assert.equal(index,original('index.html').replace(prior,bridge));
  const scope=require('./g2-b2-source-delta.cjs').stripScope(norm(fs.readFileSync(path.join(__dirname,'pitch-production-source-scope.cjs'),'utf8')));
  const start=scope.indexOf('  // G2-A exact loader reversal;'),end=scope.indexOf("  const crypto = require('node:crypto');",start);
  assert(start>0&&end>start);
  assert.equal(scope.slice(0,start)+scope.slice(end),original('tests/pitch-production-source-scope.cjs'));
  const H=require('./pitch-production-source-scope.cjs'),receiver=fs.readFileSync(path.join(__dirname,'../receiver-source-snapshot.js'),'utf8');
  const pinned=cp.execFileSync('git',['--no-optional-locks','show','674e49115a9ed7d67c69a3023b5a594d41fe584c:index.html'],{encoding:'utf8'});
  const accept=s=>H.assertMatchVNextSourceDelta('index.html',s,pinned,receiver);
  assert(accept(index).exact);
  const mutants=[index.replace(bridge,prior+'\n  <script src="live-public-match-bridge.js"></script>'),
    index.replace(bridge,bridge+'\n  <script src="live-public-match-bridge.js"></script>'),
    index.replace('<script src="live-public-match-bridge.js">','<script defer src="live-public-match-bridge.js">'),
    index.replace('src="script.js"','src="changed.js"'),index+'\n<!-- unreviewed delta -->'];
  for(const changed of mutants)assert.throws(()=>accept(changed));
  evidence.sourceGuard={baseline:base,exactIndex:true,originalScopeRestoredExactly:true,rejectedMutations:mutants.length,originalPinsRetained:true};
});

const a = S.controlled(0);
test('Case A before original decision has no fabricated PA or count', () => {
  const p = pureRead(a, 'A before approach');
  assert.equal(p.snapshot.identity.paId.status, 'unavailable');
  assert.equal(p.snapshot.game.balls.value, null);
  assert.equal(p.snapshot.decision.routes.status, 'unsupported');
  assert.equal(p.snapshot.decision.waiting, true);
  assert.equal(p.snapshot.decision.status, 'unsupported');
  assert.equal(p.snapshot.continuation.status, 'pending');
  evidence.cases.A = { beforeApproach: p };
});
S.prepare(a);
test('Case A actual pitch decision identity/routes and immutable public schema', () => {
  const source = readMatch(a), p = pureRead(a, 'A presented');
  const direct = Bridge.project(source);
  assert.deepEqual(direct, p);
  assertFrozen(direct);
  assert.throws(() => { direct.snapshot.game.outs.value = 99; }, TypeError);
  assert.equal(p.snapshot.identity.matchId.value, source.id);
  assert.equal(p.snapshot.identity.paId.value, source.offensivePlateAppearanceState.paIdentity);
  assert.equal(p.snapshot.identity.pitchId.value, source.activeSituation.sourcePhysicalStateRef);
  assert.equal(p.snapshot.identity.situationId.value, source.activeSituation.situationId);
  assert.equal(p.snapshot.decision.waiting, true);
  assert.deepEqual(p.snapshot.decision.routes.value.map(r => r.routeId), source.activeSituation.legalRoutes.map(r => r.routeId));
  assert.equal(p.snapshot.participants.legalActor.value.id, 'player');
  assert(p.timeline.events.some(e => e.type === 'DECISION_PRESENTED'));
  assert(!p.timeline.events.some(e => e.type === 'PITCH_RESOLVED'));
  noPrivate(p);
  evidence.cases.A.presented = p;
});
test('Illegal route cannot bypass the original decision entry', () => {
  const before = facts(a);
  assert.equal(a.run('chooseHighSchoolYearOneMatchMoment("illegal-route",getHighSchoolYearOneMomentId(player.highSchoolMatch))'), false);
  assert.deepEqual(facts(a), before);
  assert.equal(a.run('typeof LivePublicMatchBridge.createConsumer().submitDecision'), 'undefined');
});
test('Stale Match/PA/Pitch identity rejects without changing source', () => {
  const source = readMatch(a), stable = JSON.stringify(source);
  assert.throws(() => Bridge.project(source, { matchId: 'old-match' }), /STALE_MATCH/);
  assert.throws(() => Bridge.project(source, { paId: 'old-pa' }), /STALE_PA/);
  for (const mutate of [s => s.activeSituation.contextSnapshot.paIdentity = 'old-pa',
    s => s.activeSituation.sourcePhysicalStateRef = 'old-pitch', s => s.gameRecord.gameId = 'old-match']) {
    const bad = structuredClone(source); mutate(bad);
    assert.throws(() => Bridge.project(bad), /STALE_PA|ID_MISMATCH/);
  }
  assert.equal(JSON.stringify(source), stable);
});
test('Unexecuted pending pitch and private AI intent never enter public output', () => {
  const source = readMatch(a);
  source.offensivePlateAppearanceState.pendingPitch.pitchType = 'SECRET_FUTURE_TYPE';
  source.offensivePlateAppearanceState.pendingPitch.velocity = 123456;
  source.offensivePlateAppearanceState.prePitchFrozenDistribution = { secret: 'SECRET_AI_DISTRIBUTION' };
  const p = Bridge.project(source);
  assert.doesNotMatch(JSON.stringify(p), /SECRET_|123456/);
  assert.equal(p.timeline.events.filter(e=>e.type==='PITCH_RESOLVED').length, 0);
});
S.injectSamples(a); S.commit(a);
test('Case A submitted decision respects original reveal boundary', () => {
  const p = pureRead(a, 'A submitted before reveal');
  assert.equal(p.snapshot.decision.submitted.value, true);
  assert.equal(p.snapshot.decision.waiting, false);
  assert.equal(p.snapshot.game.outs.value, 0);
  assert.equal(p.snapshot.record.playerLines.status, 'pending');
  assert(p.timeline.events.some(e => e.type === 'DECISION_ACCEPTED'));
  assert(!p.timeline.events.some(e => ['PA_SETTLED','PLAY_SETTLED','BALL_IN_PLAY'].includes(e.type)));
  evidence.cases.A.submittedBeforeReveal = p;
});
test('Future scoreboard/physical facts cannot leak across cursor', () => {
  const source = readMatch(a), before = Bridge.project(source);
  source.scores.home = 987654; source.gameRecord.totals.home.runs = 987654;
  source.offensivePlateAppearanceState.battedBallPhysicalTruth.pace = 'SECRET_FUTURE_PACE';
  assert.deepEqual(Bridge.project(source), before);
});
reveal(a);
test('Case A original SS to 1B execution, legal out, PO/A, PA and Record project together', () => {
  const p = pureRead(a, 'A settled'), source = readMatch(a);
  const pa = source.simulationLog.find(e => e.executionRefs && e.type === 'plateAppearance');
  const candidate = pa.officialBallInPlayOutcome.executionCandidate;
  assert.equal(p.snapshot.game.outs.value, 1);
  assert.deepEqual(p.snapshot.game.bases.value, [null,null,null]);
  const types = p.timeline.events.map(e=>e.type);
  for (const t of ['PITCH_RESOLVED','BALL_IN_PLAY','DEFENSIVE_ACTION','PLAY_SETTLED','PA_SETTLED']) assert(types.includes(t), t);
  const actions = p.timeline.events.filter(e=>e.type==='DEFENSIVE_ACTION');
  assert.deepEqual(actions.map(e=>e.facts.type), ['field','throw','receive','baseTouch']);
  assert.equal(p.snapshot.record.playerLines.value[candidate.received.receiverId].defense.PO, 1);
  assert.equal(p.snapshot.record.playerLines.value[candidate.reach.defenderId].defense.A, 1);
  assert.equal(p.snapshot.record.playerLines.value.player.batting.PA, 1);
  assert.equal(p.snapshot.record.playerLines.value[candidate.context.capabilities.actors.pitcherId].pitching.outsRecorded, 1);
  assert.deepEqual(p.snapshot.record.scoreboard.value.totals, source.gameRecord.totals);
  const resolved = p.timeline.events.find(e=>e.type==='PITCH_RESOLVED');
  assert.equal(resolved.facts.pitchId, source.offensivePlateAppearanceState.pitchHistory[0].pitch.pitchId);
  assert.equal(resolved.facts.observed.velocity, source.offensivePlateAppearanceState.pitchHistory[0].pitch.velocity);
  assert.equal(p.timeline.events.find(e=>e.type==='BALL_IN_PLAY').facts.identity, candidate.physicalId);
  evidence.cases.A.settled = p;
  evidence.cases.A.ownerProof = { paEventId: pa.eventId, refs: pa.executionRefs, actions: candidate.actionFacts.actions.map(a=>({identity:a.identity,actorId:a.actorId,type:a.type})), recordIssues: a.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)') };
});
test('Already completed decision cannot settle a second time', () => {
  const before = facts(a);
  assert.equal(a.run('chooseHighSchoolYearOneMatchMoment("contactSwing",getHighSchoolYearOneMomentId(player.highSchoolMatch))'), false);
  assert.deepEqual(facts(a), before);
});
test('Repeated source event identities deduplicate; conflicting evidence rejects', () => {
  const source = readMatch(a), original = Bridge.project(source);
  source.simulationLog.push(structuredClone(source.simulationLog.at(-1)));
  source.presentedEventCursor++;
  const p = Bridge.project(source);
  assert.deepEqual(p.timeline.events.map(e=>e.eventId), original.timeline.events.map(e=>e.eventId));
  source.simulationLog.at(-1).resultCode = 'conflict';
  assert.throws(() => Bridge.project(source), /CONFLICTING_EVENT/);
});
test('Executed but unobserved pitch fields stay absent', () => {
  const source = readMatch(a);
  delete source.offensivePlateAppearanceState.pitchHistory[0].pitch.velocity;
  delete source.offensivePlateAppearanceState.pitchHistory[0].pitch.pitchType;
  source.completedMoments.forEach(m => (m.pitchHistory||[]).forEach(p=>{ delete p.pitch.velocity; delete p.pitch.pitchType; }));
  const p = Bridge.project(source).timeline.events.find(e=>e.type==='PITCH_RESOLVED');
  assert(!Object.hasOwn(p.facts.observed,'velocity'));
  assert(!Object.hasOwn(p.facts.observed,'pitchType'));
});
test('Decision lifecycle order survives settlement with stable original identities', () => {
  const p=projection(a),presented=evidence.cases.A.presented.timeline.events.find(e=>e.type==='DECISION_PRESENTED');
  const current=p.timeline.events.find(e=>e.type==='DECISION_PRESENTED');
  assert.equal(current.eventId,presented.eventId);
  const types=p.timeline.events.map(e=>e.type);
  assert(types.indexOf('DECISION_PRESENTED')<types.indexOf('DECISION_ACCEPTED'));
  assert(types.indexOf('DECISION_ACCEPTED')<types.indexOf('PITCH_RESOLVED'));
  assert(types.indexOf('PITCH_RESOLVED')<types.indexOf('BALL_IN_PLAY'));
  assert(types.indexOf('BALL_IN_PLAY')<types.indexOf('PLAY_SETTLED'));
  assert(types.indexOf('PLAY_SETTLED')<types.indexOf('PA_SETTLED'));
});
test('Reordered source journal and conflicting completed actions reject', () => {
  const source=readMatch(a),bad=structuredClone(source);
  [bad.simulationLog[0],bad.simulationLog[1]]=[bad.simulationLog[1],bad.simulationLog[0]];
  assert.throws(()=>Bridge.project(bad),/SOURCE_ORDER_MISMATCH/);
  const inconsistent=structuredClone(source),defense=inconsistent.simulationLog.find(e=>e.type==='defensivePlay');
  defense.actionFacts.actions[0].actorId='wrong-actor';
  assert.throws(()=>Bridge.project(inconsistent),/CONFLICTING_FACT/);
});
test('Case A real save/load retains projection without settlement replay', () => reload(a, 'A settled'));
test('Case A next legal PA changes batter without reusing stale current PA identity', () => {
  const old = evidence.cases.A.settled.snapshot.participants.batter.value.id;
  S.nextEvent(a, 1); reveal(a);
  const p = pureRead(a, 'A next PA');
  assert.equal(p.snapshot.participants.batter.value.id, a.run('player.highSchoolMatch.currentBatter'));
  assert.equal(p.snapshot.identity.paId.value, null);
  assert.notEqual(p.snapshot.participants.batter.value.id, old);
  assert.throws(()=>Bridge.project(readMatch(a),{paId:evidence.cases.A.presented.snapshot.identity.paId.value}),/STALE_PA/);
  evidence.cases.A.next = p;
});

const held = S.controlled(0); S.prepare(held); S.hold(held);
test('Pending same-ball execution never appears as official settlement', () => {
  const before=facts(held),p=pureRead(held,'held defense pending');
  assert.equal(p.snapshot.continuation.status,'pending');
  assert.equal(p.snapshot.record.playerLines.value.player.batting.PA,0);
  assert(!p.timeline.events.some(e=>['PLAY_SETTLED','PA_SETTLED'].includes(e.type)));
  assert.deepEqual(facts(held),before);
});
test('Missing visible outs/base facts remain unavailable without plausible defaults', () => {
  const source=readMatch(held),state=source.simulationLog[source.presentedEventCursor-1].presentationSnapshot;
  delete state.outs;delete state.runners;
  const p=Bridge.project(source);
  assert.equal(p.snapshot.game.outs.status,'pending');
  assert.equal(p.snapshot.game.outs.value,null);
  assert.equal(p.snapshot.game.bases.value,null);
});

for (const kind of ['B','C']) {
  const {h,fixture}=outfieldFixture(kind);
  test('Case '+kind+' original outfield fixture before execution has no public result',()=>{
    const p=pureRead(h,kind+' before');
    assert.equal(p.snapshot.status,'pending');
    assert.equal(p.snapshot.game.outs.value,null);
    assert.equal(p.timeline.events.length,0);
    evidence.cases[kind]={fixture,before:p};
  });
  h.run('var originalResult=prepareHighSchoolDefensiveMomentFromSimulation(player.highSchoolMatch,x.opts);');
  reveal(h);
  test('Case '+kind+' projects actual G1 owner result and canonical record',()=>{
    const p=pureRead(h,kind+' settled'),source=readMatch(h),event=h.json('originalResult');
    const action=p.timeline.events.find(e=>e.type==='DEFENSIVE_ACTION');
    assert(action);
    assert.equal(p.snapshot.game.outs.value,kind==='B'?1:0);
    assert.deepEqual(p.snapshot.game.bases.value,kind==='B'?[null,null,null]:['player',null,null]);
    assert(p.timeline.events.some(e=>e.type==='BALL_IN_PLAY'));
    assert(p.timeline.events.some(e=>e.type==='PA_SETTLED'));
    assert(p.timeline.events.some(e=>e.type==='PLAY_SETTLED'));
    if(kind==='B'){
      assert.equal(action.facts.actorId,event.flyBallCatchCredit.actorId);
      assert.equal(action.facts.completedCatch,true);
      assert.equal(p.snapshot.record.playerLines.value[action.facts.actorId].defense.PO,1);
    }else{
      assert.equal(action.facts.actorId,event.outfieldSingleFacts.retrieval.actorId);
      assert.equal(action.facts.possession.holderId,action.facts.actorId);
      assert.equal(action.facts.possession.status,'controlled');
      assert.equal(p.snapshot.record.playerLines.value.player.batting.H,1);
      assert.equal(p.timeline.events.find(e=>e.type==='PLAY_SETTLED').facts.runnerTerminal.finalBase,'first');
    }
    assert.deepEqual(p.snapshot.record.scoreboard.value.totals,source.gameRecord.totals);
    assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(player.highSchoolMatch.gameRecord)'),[]);
    evidence.cases[kind].settled=p;
    evidence.cases[kind].ownerProof={type:event.type,paId:event.paIdentity,physicalId:event.physicalIdentity,actorId:action.facts.actorId,recordEventRefs:source.gameRecord.eventRefs};
  });
  test('Case '+kind+' duplicate original callback and real Save/Load preserve result',()=>{
    const before=facts(h);
    h.run(kind==='B'?'applyHighSchoolFlyBallCatchResolution(player.highSchoolMatch)':'applyHighSchoolOutfieldSingle(player.highSchoolMatch)');
    assert.deepEqual(facts(h),before);
    reload(h,kind+' settled');
  });
  test('Case '+kind+' legal next PA projects original batting-order continuation',()=>{
    const source=readMatch(h),beforePA=source.simulationLog.filter(e=>e.type==='plateAppearance').length;
    const p=nextOrdinary(h);
    assert.equal(readMatch(h).simulationLog.filter(e=>e.type==='plateAppearance').length,beforePA+1);
    assert.equal(p.snapshot.participants.batter.value.id,h.run('player.highSchoolMatch.currentBatter'));
    assert.equal(p.snapshot.identity.paId.value,null);
    evidence.cases[kind].next=p;
  });
}

const d=S.controlled(0); S.prepare(d);
S.injectSamples(d,{nextPitch:{pitch:{pitchLocationClass:'competitiveStrike'},recognitionRoll:0}});
test('Case D nonterminal original pitch updates public count and survives real reload',()=>{
  S.commit(d,'take');
  const p=pureRead(d,'D first strike');
  assert.equal(p.snapshot.game.strikes.value,1);
  assert(p.snapshot.decision.waiting);
  assert.equal(p.timeline.events.filter(e=>e.type==='PITCH_RESOLVED').length,1);
  reload(d,'D nonterminal pitch');
  evidence.cases.D={nonterminal:p};
});
S.commit(d,'take'); S.commit(d,'take'); reveal(d);
test('Case D original third-strike catch, catcher PO, pitcher SO and original PA',()=>{
  const p=pureRead(d,'D settled'),source=readMatch(d),pa=source.simulationLog.find(e=>e.thirdStrikeCatch),caught=pa.thirdStrikeCatch.execution;
  const action=p.timeline.events.find(e=>e.type==='DEFENSIVE_ACTION'&&e.facts.type==='thirdStrikeCatch');
  assert.equal(action.facts.catcherId,caught.catcherId);
  assert.equal(action.facts.caught,true);
  assert.equal(action.facts.possession.holderId,caught.catcherId);
  assert.equal(p.snapshot.record.playerLines.value[caught.catcherId].defense.PO,1);
  assert.equal(p.snapshot.record.playerLines.value[caught.pitcherId].pitching.SO,1);
  assert.equal(p.snapshot.record.playerLines.value.player.batting.SO,1);
  assert.equal(p.snapshot.game.outs.value,1);
  assert.equal(p.timeline.events.filter(e=>e.type==='PITCH_RESOLVED').length,3);
  evidence.cases.D.settled=p;evidence.cases.D.ownerProof={paId:pa.paIdentity,catchIdentity:caught.identity,pitchId:caught.pitchIdentity,catcherId:caught.catcherId,pitcherId:caught.pitcherId};
});
test('Case D real Save/Load and next PA never replay catcher or pitcher credit',()=>{
  reload(d,'D settled');
  const original=readMatch(d),catcher=evidence.cases.D.ownerProof.catcherId,pitcher=evidence.cases.D.ownerProof.pitcherId;
  const p=nextOrdinary(d);
  assert.equal(p.snapshot.record.playerLines.value[catcher].defense.PO,original.gameRecord.playerLines[catcher].defense.PO);
  assert.equal(p.snapshot.record.playerLines.value[pitcher].pitching.SO,original.gameRecord.playerLines[pitcher].pitching.SO);
  evidence.cases.D.next=p;
});
test('Lost retained pitch evidence is unavailable, never reconstructed from the PA result',()=>{
  const source=readMatch(d);
  for(const key of ['offensivePlateAppearanceState','ordinaryDefensivePlateAppearanceState'])if(source[key])source[key].pitchHistory=[];
  source.completedMoments.forEach(m=>{m.pitchHistory=[];});
  const p=Bridge.project(source);
  assert.equal(p.timeline.events.filter(e=>e.type==='PITCH_RESOLVED').length,0);
  assert(p.timeline.coverage.pitchHistory.unavailablePaEventIds.length>0);
  assert.equal(p.timeline.coverage.elapsedMilliseconds,'unsupported');
});
test('Scoreboard/Record mismatch and missing provenance fail closed',()=>{
  const source=readMatch(d),bad=structuredClone(source);bad.gameRecord.totals.home.runs++;
  assert.throws(()=>Bridge.project(bad),/SCOREBOARD_RECORD_MISMATCH/);
  const orphan=structuredClone(source);orphan.gameRecord.eventRefs=[];
  assert.throws(()=>Bridge.project(orphan),/PROVENANCE_MISSING/);
});
test('Consumer presentation advance never submits or repeats gameplay',()=>{
  const source=readMatch(d),before=JSON.stringify(source),consumer=Bridge.createConsumer(()=>source);
  const ids=[];let event;while((event=consumer.advancePresentation()))ids.push(event.eventId);
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(consumer.advancePresentation(),null);
  assert.equal(consumer.submitDecision,undefined);
  assert.equal(JSON.stringify(source),before);
  const nextSource=structuredClone(source);nextSource.id='other-match';nextSource.gameRecord.gameId='other-match';
  assert.throws(()=>Bridge.project(nextSource),/ID_MISMATCH|PA_MISMATCH/);
});

test('Normal public Career match supports bridge reads, half changes, final Record, reload and unique settlement',()=>{
  const h=makeContext();
  h.run('careerFixture("二壘手","starter",77001);choose("critical_offseason",1);var m=player.highSchoolMatch;var ticks=0;var bridgeSamples=0;');
  h.run('while(!m.completed&&ticks++<2500){if(pendingYouthSeasonOutcome)continueYouthSeasonOutcome();if(isHighSchoolMatchDecisionVisible(m)){var choices=getHighSchoolYearOneMatchMomentChoices(m);var choice=choices.find(c=>c.matchDecision==="take")||choices[0];if(!choice)throw Error("no public choice");var beforeBridge=JSON.stringify(m);LivePublicMatchBridge.readCurrent();if(beforeBridge!==JSON.stringify(m))throw Error("bridge mutation");bridgeSamples++;chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>.62);}else advanceHighSchoolMatchPlaybackStep(m);if(ticks===50){saveGame();loadGame();m=player.highSchoolMatch;}}if(!m.completed)throw Error("normal match incomplete");');
  reveal(h);
  const p=pureRead(h,'normal final'),source=readMatch(h);
  assert.equal(p.snapshot.game.gameStatus.value,'final');
  assert.equal(p.snapshot.game.homeScore.value,source.gameRecord.result.finalScore.home);
  assert.equal(p.snapshot.game.awayScore.value,source.gameRecord.result.finalScore.away);
  assert.deepEqual(p.snapshot.record.scoreboard.value.totals,source.gameRecord.totals);
  assert(p.timeline.events.some(e=>e.type==='HALF_INNING_CHANGED'));
  assert(p.timeline.events.some(e=>e.type==='MATCH_FINAL'));
  assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
  assert(source.matchExperience.settled);
  const before=facts(h);
  h.run('settleHighSchoolYearOneMatch(m,"secure")');assert.deepEqual(facts(h),before);
  reload(h,'normal final');
  evidence.normalGame={ticks:h.run('ticks'),sampledDecisionReads:h.run('bridgeSamples'),snapshot:p.snapshot,events:p.timeline.events.map(e=>({eventId:e.eventId,type:e.type,order:e.order})),careerSettlementUnique:true};
});

evidence.status='PASS';evidence.passed=passed;
if(process.env.G2_A_EVIDENCE_OUTPUT)fs.writeFileSync(process.env.G2_A_EVIDENCE_OUTPUT,JSON.stringify(evidence,null,2));
console.log(JSON.stringify({suite:evidence.suite,status:evidence.status,passed,cases:Object.keys(evidence.cases),normalGame:!!evidence.normalGame}));
