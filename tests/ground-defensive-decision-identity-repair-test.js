const assert = require('assert/strict');
const cp = require('child_process');
const { trajectory, assertComplete } = require('./ground-defensive-decision-identity-test-context.cjs');
const { createHarness } = require('./match-authority-coverage-audit.cjs');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
const t = trajectory(22430002, { stale: true });
test('known seed completes entire game', () => assertComplete(t));
test('first defensive moment identity agrees with choices', () => assert(t.moments[0].choices.every(c => c.matchMomentId === t.moments[0].id)));
test('second defensive identity is dynamic and current', () => assert.equal(t.moments[1].id, 'hs_y1_match_defense_2'));
test('all displayed routes agree with lifecycle routes where present', () => t.moments.forEach(m => assert.deepEqual(m.choices, m.sourceRoutes)));
test('previous moment rejected without settlement mutation', () => { assert(t.stale.length); assert(t.stale.every(x => x.rejected && x.unchanged)); });
test('current moment accepted after stale rejection', () => assert(t.moments.every(m => m.accepted)));
test('duplicate choice cannot settle again', () => assert(t.duplicates.every(x => !x.accepted && x.unchanged)));
test('lifecycles close', () => assert(t.moments.every(m => m.lifecycleAfter === 'closed')));
test('no obsolete static identity on repeated moment', () => assert(t.moments.slice(1).every(m => m.choices.every(c => c.matchMomentId !== 'hs_y1_match_moment_2'))));
for (const route of ['secure', 'challenge', 'lead']) test(route + ' legal branch accepted and game completes', () => {
  const branch = trajectory(22430002, { route }); assertComplete(branch); assert.equal(branch.moments[1].selected, route);
});
test('pre/post candidate semantics labels and count identical', () => {
  const h = createHarness({ observe: false });
  const source = cp.execFileSync('git', ['show', '156218b:script.js'], { encoding: 'utf8', maxBuffer: 8e6 }).replace(/\r\n?/g, '\n');
  const start = source.indexOf('function getHighSchoolYearOneMomentId(');
  h.run(source.slice(start, source.indexOf('\nfunction ', start + 1)));
  const old = h.play(22430002);
  assert.equal(old.result.orphan, 1);
  const withoutIdentity = rows => rows.map(({ matchMomentId, ...row }) => row);
  const before = h.json('getHighSchoolDefensiveMomentChoices(player.highSchoolMatch)');
  assert(before.every(c => c.matchMomentId === 'hs_y1_match_moment_2'));
  assert.deepEqual(withoutIdentity(before), withoutIdentity(t.moments[1].choices));
});
test('static offense and dynamic offense contracts unchanged', () => {
  assert.equal(t.h.run('getHighSchoolYearOneMomentId({momentIndex:0,currentDomain:"offense"})'), 'hs_y1_match_moment_1');
  assert.equal(t.h.run('getHighSchoolYearOneMomentId({momentIndex:2,currentDomain:"offense",currentMomentId:"hs_y1_match_offense_3"})'), 'hs_y1_match_offense_3');
  assert.equal(t.h.run('getHighSchoolYearOneMomentId({completed:true,currentDomain:"defense",currentMomentId:"hs_y1_match_defense_2"})'), '');
});
test('presented defensive save reload preserves identity and settles once', () => {
  const h = t.h;
  h.context.r1Save = t.snapshots[1];
  h.run('player=normalizeSave(JSON.parse(r1Save));pendingYouthSeasonOutcome=null;isTransitioning=false;saveGame();loadGame();stopHighSchoolMatchPlayback();');
  const id = h.run('getHighSchoolYearOneMomentId(player.highSchoolMatch)');
  assert.equal(id, t.moments[1].id);
  assert.deepEqual(h.json('getHighSchoolDefensiveMomentChoices(player.highSchoolMatch)'), t.moments[1].choices);
  assert(h.run('r1Choose("secure",getHighSchoolYearOneMomentId(player.highSchoolMatch),()=>.82)'));
  const record = h.json('player.highSchoolMatch.gameRecord');
  assert.equal(h.run('r1Choose("secure","hs_y1_match_defense_2",()=>.82)'), false);
  assert.deepEqual(h.json('player.highSchoolMatch.gameRecord'), record);
  h.run('pendingYouthSeasonOutcome=null;isTransitioning=false;saveGame();loadGame();stopHighSchoolMatchPlayback();');
  assert.deepEqual(h.json('player.highSchoolMatch.gameRecord'), record);
  assert(h.run('MatchGameRecord.assertIntegrity(player.highSchoolMatch.gameRecord)'));
});
console.log(`${passed}/${passed} PASS`);
