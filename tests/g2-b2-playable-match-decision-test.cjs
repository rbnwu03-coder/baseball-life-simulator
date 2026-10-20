'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { makeContext } = require('./high-school-career-test-context.js');
const delta = require('./g2-b2-source-delta.cjs');
const evidence = { suite: 'g2-b2-playable-match-decision', checks: [] };
function test(name, fn) { fn(); evidence.checks.push(name); console.log('PASS ' + name); }
const root = path.resolve(__dirname, '..'), read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n?/g, '\n');
test('Exact additive loaders reverse to G2-A and retain all original test assertions', () => {
  const index = read('index.html');
  assert(index.includes(delta.cssAdded) && index.includes(delta.jsAdded));
  delta.stripIndex(index); delta.stripScope(read('tests/pitch-production-source-scope.cjs'));
  delta.assertPriorBridgeTest(read('tests/g2-a-live-public-match-bridge-test.cjs'));
});
test('Loader ordering, duplicate, defer, stylesheet and unrelated mutations are rejected', () => {
  const index = read('index.html');
  const mutants = [index.replace(delta.jsAdded, delta.jsAdded + '\n  <script src="match-pitch-decision-ui.js"></script>'),
    index.replace('<script src="match-pitch-decision-ui.js">', '<script defer src="match-pitch-decision-ui.js">'),
    index.replace(delta.cssAdded, delta.cssAdded.replace('style.css', 'wrong.css')),
    index.replace(delta.jsAdded, delta.jsAdded.split('\n').reverse().join('\n')), index + '\n<!-- unreviewed -->'];
  for (const mutant of mutants) assert.throws(() => delta.stripIndex(mutant));
  assert.throws(() => delta.stripScope(read('tests/pitch-production-source-scope.cjs').replace(delta.scopeLine, '')));
  assert.throws(() => delta.assertPriorBridgeTest(read('tests/g2-a-live-public-match-bridge-test.cjs') + '\n// altered'));
  evidence.rejectedSourceMutations = mutants.length + 2;
});
const h = makeContext();
test('Original UI, pitch view, truly pending and unsupported presentation remain distinct', () => {
  const classify = require('../match-pitch-decision-ui.js').classifyView;
  assert.equal(classify({ decision: { status: 'available' } }, true), 'matchPitchView');
  assert.equal(classify({ decision: { status: 'unsupported' } }, true), 'originalUI');
  assert.equal(classify({ decision: { status: 'pending' } }, false), 'pending');
  assert.equal(classify({ decision: { status: 'unsupported' } }, false), 'unsupportedPresentationRoute');
});
h.run('careerFixture("二壘手","starter",77001);choose("critical_offseason",1);var m=player.highSchoolMatch;var originalCalls=0;');
const facts = () => h.json('({seed:m.simulationSeed,record:m.gameRecord,log:m.simulationLog,pa:m.offensivePlateAppearanceState})');
test('Unsupported original approach remains an original legal choice, never a pitch request', () => {
  let n = 0;
  while (!h.run('LivePublicMatchBridge.readCurrent().snapshot.decision.waiting')) {
    assert(++n < 500); h.run('advanceHighSchoolMatchPlaybackStep(m)');
  }
  assert.equal(h.run('LivePublicMatchBridge.readCurrent().snapshot.decision.status'), 'unsupported');
  assert(h.json('getHighSchoolYearOneMatchMomentChoices(m)').length);
});
test('Original natural Career reaches a genuinely admitted player pitch', () => {
  let n = 0;
  while (h.run('LivePublicMatchBridge.readCurrent().snapshot.decision.status') !== 'available') {
    assert(++n < 500);
    h.run('if(pendingYouthSeasonOutcome)continueYouthSeasonOutcome();if(isHighSchoolMatchDecisionVisible(m)){var c=getHighSchoolYearOneMatchMomentChoices(m)[0];chooseHighSchoolYearOneMatchMoment(c.matchDecision,c.matchMomentId,()=>.62);}else advanceHighSchoolMatchPlaybackStep(m);');
  }
  h.run('var reentrantResult=null;var ui=MatchPitchDecisionUI.createAdapter({choose:(d,id)=>{originalCalls++;reentrantResult=ui.submit(request);return chooseHighSchoolYearOneMatchMoment(d,id,()=>.62);}});ui.beginView();var request=ui.request("take");');
  assert(h.run('m.activeSituation.admission.admittedToPlayer'));
});
test('Public view and request creation do not mutate Match or consume RNG', () => {
  const before = facts();
  h.run('var savedRandom=Math.random;Math.random=()=>{throw Error("UI RNG");};try{ui.beginView();request=ui.request("take");}finally{Math.random=savedRandom;}');
  assert.deepEqual(facts(), before);
  const r = h.json('request');
  for (const key of ['matchId', 'paId', 'pitchId', 'situationId', 'routeId', 'expectedMomentId']) assert.equal(typeof r[key], 'string');
});
for (const field of ['matchId', 'paId', 'pitchId', 'situationId', 'expectedMomentId', 'routeId']) {
  test('Reject stale or illegal ' + field + ' without calling original authority', () => {
    const before = facts(), count = h.run('originalCalls');
    h.context.badField = field;
    assert.equal(h.run('ui.submit({...request,[badField]:"stale-or-illegal"}).ok'), false);
    assert.deepEqual(facts(), before); assert.equal(h.run('originalCalls'), count);
  });
}
test('Rerender expires old callback even when every authoritative identity is unchanged', () => {
  h.run('var old=request;ui.beginView();');
  const before = facts(); assert.equal(h.run('ui.submit(old).code'), 'STALE_VIEW');
  assert.deepEqual(facts(), before); h.run('request=ui.request("take");');
});
test('Admission denial and ambiguous route mapping fail before execution', () => {
  h.run('var deniedMatch={...m,activeSituation:{...m.activeSituation,admission:{admittedToPlayer:false}}};var denied=MatchPitchDecisionUI.createAdapter({current:()=>deniedMatch});denied.beginView();');
  assert.equal(h.run('denied.submit(denied.request("take")).code'), 'NOT_ADMITTED');
  h.run('var ambiguous=MatchPitchDecisionUI.createAdapter({choices:x=>{var c=getHighSchoolYearOneMatchMomentChoices(x);return c.concat(c);}});ambiguous.beginView();');
  assert.equal(h.run('ambiguous.submit(ambiguous.request("take")).code'), 'ROUTE_MAPPING_UNAVAILABLE');
});
test('Original rejection is reported as rejection, without invented count or events', () => {
  const before = facts();
  h.run('var rejecting=MatchPitchDecisionUI.createAdapter({choose:()=>false});rejecting.beginView();');
  assert.equal(h.run('rejecting.submit(rejecting.request("take")).code'), 'AUTHORITY_REJECTED');
  assert.deepEqual(facts(), before);
});
test('Take executes once through the original public Match owner', () => {
  const number = h.run('m.offensivePlateAppearanceState.pitchNumber');
  assert.equal(h.run('ui.submit(request).ok'), true);
  assert.equal(h.run('originalCalls'), 1);
  assert.equal(h.run('reentrantResult.code'), 'IN_FLIGHT');
  assert.equal(h.run('m.offensivePlateAppearanceState.pitchNumber'), number + 1);
  assert.equal(h.run('m.offensivePlateAppearanceState.pitchHistory.at(-1).action'), 'take');
});
test('Same-moment next pitch cannot be submitted by the previous pitch callback', () => {
  const before = facts(), count = h.run('originalCalls');
  assert.equal(h.run('ui.submit(request).ok'), false);
  assert.deepEqual(facts(), before); assert.equal(h.run('originalCalls'), count);
});
test('Save/Reload rebuilds a fresh boundary and rejects the old match-object callback', () => {
  h.run('ui.beginView();var beforeLoad=ui.request("contactSwing");');
  const before = facts();
  h.run('saveGame();loadGame();m=player.highSchoolMatch;');
  assert.deepEqual(facts(), before);
  assert.equal(h.run('ui.submit(beforeLoad).code'), 'STALE_VIEW');
  h.run('ui.beginView();request=ui.request("contactSwing");');
});
test('Legal swing and subsequent original pitches finish one official PA', () => {
  const paId = h.run('m.offensivePlateAppearanceState.paIdentity');
  assert.equal(h.run('ui.submit(request).ok'), true);
  assert.equal(h.run('m.offensivePlateAppearanceState.pitchHistory.at(-1).action'), 'swing');
  let n = 0;
  while (h.run('LivePublicMatchBridge.readCurrent().snapshot.decision.status') === 'available') {
    assert(++n < 30); h.run('ui.beginView();request=ui.request("take");');
    assert.equal(h.run('ui.submit(request).ok'), true);
  }
  assert(h.run('m.offensivePlateAppearanceState.resultApplied'));
  assert.deepEqual(h.json('getHighSchoolMatchStateIntegrityIssues(m)'), []);
  evidence.pa = h.json('({id:m.offensivePlateAppearanceState.paIdentity,result:m.offensivePlateAppearanceState.result,pitchCount:m.offensivePlateAppearanceState.pitchNumber,history:m.offensivePlateAppearanceState.pitchHistory.map(p=>({pitchId:p.pitch.pitchId,action:p.action,result:p.pitchResult}))})');
  assert.equal(evidence.pa.id, paId);
});
test('Record remains unique and stale submission after PA settlement is a no-op', () => {
  const before = facts();
  assert.equal(h.run('ui.submit(request).ok'), false); assert.deepEqual(facts(), before);
  const ids = h.json('m.gameRecord.eventRefs.map(e=>e.eventId)');
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(h.json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'), []);
});
test('Public Snapshot and Timeline repeat without execution or unrevealed intent', () => {
  const before = facts();
  const p = h.json('LivePublicMatchBridge.readCurrent()');
  assert.deepEqual(h.json('LivePublicMatchBridge.readCurrent()'), p);
  assert.doesNotMatch(JSON.stringify(p), /"(?:pendingPitch|intentRoll|realizationRoll|debugTrace)"/);
  assert.deepEqual(facts(), before);
});
evidence.status = 'PASS'; evidence.passed = evidence.checks.length;
if (process.env.G2_B2_EVIDENCE_OUTPUT) fs.writeFileSync(process.env.G2_B2_EVIDENCE_OUTPUT, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ suite: evidence.suite, status: evidence.status, passed: evidence.passed, pa: evidence.pa }));
