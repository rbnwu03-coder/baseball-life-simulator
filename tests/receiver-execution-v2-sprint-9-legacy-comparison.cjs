'use strict';
// Bounded LEGACY Production witnesses. No candidate v2 execution, full match
// cohort, disk captures, or source writes. The original fixture bodies are used
// unchanged; only their defining VM snippets are extracted from the old suite.
const assert = require('assert/strict');
const fs = require('fs'), path = require('path'), cp = require('child_process');
const Module = require('module'), crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const baseline = '00d0d61654a4fbe97413617dadfd70285a816c47';
const contextPath = 'tests/high-school-career-test-context.js';
const fixturePath = 'tests/first-base-receive-active-ground-production-integration-test.js';
const protectedPaths = new Set([
  'tests/fast-check-smoke-test.cjs', 'install.ps1',
  'docs/first-base-sprint-3-focused-development-evidence.json',
  'docs/infield-baseball-logic-audit-architecture-evidence.json',
  'docs/infield-baseball-logic-audit-evidence.json',
  'docs/infield-baseball-logic-audit-runner.cjs',
  'docs/infield-baseball-logic-validation-audit-v1.md',
  'docs/infield-scorer-recovery-sprint-5-green-evidence.json',
  'docs/infield-scorer-recovery-sprint-5-green-force-actual-only-evidence.json',
  'docs/infield-scorer-recovery-sprint-5-l03-red-evidence.json',
  'docs/infield-scorer-recovery-sprint-5-validation-force-actual-only.json',
  'docs/infield-scorer-recovery-sprint-5-validation.json'
]);
const labels = {SS:'\u6e38\u64ca\u624b', '2B':'\u4e8c\u58d8\u624b', '3B':'\u4e09\u58d8\u624b', '1B':'\u4e00\u58d8\u624b'};
const directions = {SS:.1, '2B':.9, '3B':.005, '1B':.995};
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const git = args => cp.execFileSync('git', args, {cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:30e6});
const textEqual = (a,b) => a.replace(/\r\n/g,'\n') === b.replace(/\r\n/g,'\n');

function loadSources() {
  const index = git(['show',baseline+':index.html']);
  const names = [...index.matchAll(/<script src="([^"]+)"/g)].map(match=>match[1]).filter(file=>file!=='application-controller.js');
  assert(names.every(file=>!protectedPaths.has(file)&&!file.includes('..')),'Invalid baseline load path');
  return { 'index.html':index, ...Object.fromEntries(names.map(file => [file,git(['show',baseline+':'+file])])) };
}

function makeHarness(sources, evidencePaths) {
  const originalRequire = Module.createRequire(path.join(root,contextPath));
  const safeFs = Object.create(fs);
  safeFs.readFileSync = function(file, options) {
    const absolute = path.resolve(String(file));
    const relative = path.relative(root,absolute).replace(/\\/g,'/');
    if(protectedPaths.has(relative)) throw Error('PROTECTED_READ: '+relative);
    evidencePaths.add(relative);
    if(Object.prototype.hasOwnProperty.call(sources,relative))
      return typeof options === 'string' || options?.encoding ? sources[relative] : Buffer.from(sources[relative]);
    return fs.readFileSync(file,options);
  };
  const helper = new Module(path.join(root,contextPath),module);
  helper.filename = path.join(root,contextPath);
  helper.paths = Module._nodeModulePaths(path.dirname(helper.filename));
  helper.require = id => id === 'fs' ? safeFs : originalRequire(id);
  const contextSource = fs.readFileSync(helper.filename,'utf8');
  const fixtureSource = fs.readFileSync(path.join(root,fixturePath),'utf8');
  evidencePaths.add(contextPath); evidencePaths.add(fixturePath);
  assert(textEqual(contextSource,git(['show',baseline+':'+contextPath])), 'Existing context helper changed');
  assert(textEqual(fixtureSource,git(['show',baseline+':'+fixturePath])), 'Existing fixture suite changed');
  helper._compile(contextSource,helper.filename);
  const context = helper.exports.makeContext();
  let fixtureDefinitions = 0;
  for(const match of fixtureSource.matchAll(/\brun\(\x60([\s\S]*?)\x60\);/g))
    if(match[1].includes('function firstBaseFixture') || match[1].includes('function firstBaseIncomingBoundary')) {
      context.run(match[1]); fixtureDefinitions++;
    }
  assert.equal(fixtureDefinitions,2);
  context.run(`
    var s9Observation={matchRng:[],publicSamples:[],executionSamples:[]};
    var s9OriginalRandom=nextHighSchoolMatchSimulationRandom;
    nextHighSchoolMatchSimulationRandom=function(...args){var value=s9OriginalRandom(...args);s9Observation.matchRng.push(value);return value;};
    var s9OriginalChoice=chooseHighSchoolYearOneMatchMoment;
    chooseHighSchoolYearOneMatchMoment=function(...args){
      if(typeof args[2]==='function'){var callback=args[2];args[2]=function(){var value=callback();s9Observation.publicSamples.push({decision:args[0],momentId:args[1],value});return value;};}
      return s9OriginalChoice(...args);
    };
    var s9OriginalExecute=resolveHighSchoolDefensivePlay;
    resolveHighSchoolDefensivePlay=function(...args){
      if(typeof args[2]==='function'){var callback=args[2];args[2]=function(){var value=callback();s9Observation.executionSamples.push({decision:args[1],value});return value;};}
      return s9OriginalExecute(...args);
    };
  `);
  return context;
}

function snapshot(c) {
  const value = c.json(`({
    physical:m.groundBallInPlayState?.physicalTruth,
    opportunity:m.groundBallInPlayState?.defensiveOpportunity,
    roster:m.rosters,
    route:{decision:m.activeSituation?.decision,executionState:m.activeSituation?.executionState},
    ground:m.groundBallInPlayState,
    resolution:m.lastDefensiveResolution,
    actions:m.lastDefensiveResolution?.actionFacts,
    outs:m.outs,runners:m.runners,scores:m.scores,cursor:m.simulationCursor,
    record:m.gameRecord,experience:m.matchExperience,
    evaluation:player.highSchoolCompetitionEvaluation,
    log:m.simulationLog,fullMatch:m,
    observation:s9Observation
  })`);
  assert.deepEqual(c.json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);
  assert.deepEqual(c.json('MatchGameRecord.getIntegrityIssues(m.gameRecord)'),[]);
  return value;
}

function cold(c, label) {
  const expected = c.json('normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch');
  c.run('saveGame();player=createInitialPlayer('+JSON.stringify(label)+');loadGame();m=player.highSchoolMatch;');
  assert.deepEqual(c.json('m'),expected);
  return snapshot(c);
}

function oneFixture(c, position, name, extra = {}, historical = false) {
  const {run} = c;
  const options = {position:labels[position],direction:directions[position],occupied:1,...extra};
  run('s9Observation={matchRng:[],publicSamples:[],executionSamples:[]};');
  if(historical) {
    const key = position === '3B' ? 'GROUND_TOPOLOGY_VERSION' : position === '1B' ? 'FIRST_BASE_GROUND_TOPOLOGY_VERSION' : 'TOPOLOGY_VERSION';
    run('var s9OriginalRouter=getHighSchoolDefensiveOpportunity;var s9HistoricalVersion=DefensiveOpportunityFoundation.'+key+';getHighSchoolDefensiveOpportunity=(m,t)=>DefensiveOpportunityFoundation.resolveDefensiveOpportunity({physicalTruth:t,activeRoster:m.rosters[m.defenseTeam],topologyVersion:s9HistoricalVersion});');
  }
  try {run('var m=firstBaseIncomingBoundary('+JSON.stringify(options)+',"pending");');}
  finally {if(historical)run('getHighSchoolDefensiveOpportunity=s9OriginalRouter;');}
  const pending = snapshot(c);
  const pendingReload = cold(c,'S9 legacy pending');
  assert.equal(pendingReload.physical.identity,pending.physical.identity);
  if(historical)assert.equal(run('getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth).topologyVersion'),run('s9HistoricalVersion'));
  run('var s9Execution=firstBaseExecute(m,"challenge",.8);');
  assert.equal(run('s9Execution.rolls'),1);
  const executed = snapshot(c);
  run('var s9ForbiddenRandom=Math.random;Math.random=()=>{throw Error("S9_LEGACY_RECOVERY_REROLL");};');
  let executedReload, settled, duplicate, settledReload;
  try {
    executedReload = cold(c,'S9 legacy executed');
    run('resumeResolvedHighSchoolGroundBallSettlement(m);var s9Once=firstBaseFacts(m);');
    settled = snapshot(c);
    for(let i=0;i<3;i++)run('resumeResolvedHighSchoolGroundBallSettlement(m);');
    assert.equal(run('firstBaseFacts(m)'),run('s9Once'));
    duplicate = snapshot(c);
    assert.deepEqual(duplicate,settled);
    settledReload = cold(c,'S9 legacy settled');
    assert.equal(run('firstBaseFacts(m)'),run('s9Once'));
  } finally {run('Math.random=s9ForbiddenRandom;');}
  return {position,name,historical,phases:{pending,pendingReload,executed,executedReload,settled,duplicate,settledReload},
    recovery:{pending:true,executed:true,settled:true,duplicateRetries:3,rerollForbidden:true},
    sampleObservation:'original family resolver callback, not public choice callback'};
}

function publicFixture(c, position) {
  c.run('s9Observation={matchRng:[],publicSamples:[],executionSamples:[]};var m=firstBaseFixture('+JSON.stringify({position:labels[position],direction:directions[position],occupied:1})+');');
  const pending = snapshot(c);
  c.run('var s9Public=firstBasePublic(m,"secure",.8);');
  assert.equal(c.run('s9Public.rolls'),1);
  const settled = snapshot(c);
  c.run('var s9ForbiddenRandom=Math.random;Math.random=()=>{throw Error("S9_PUBLIC_DUPLICATE_REROLL");};');
  try {
    for(let i=0;i<3;i++)assert.equal(c.run('chooseHighSchoolYearOneMatchMoment(s9Public.choice.matchDecision,s9Public.choice.matchMomentId,()=>{throw Error("S9_DUPLICATE_CALLBACK");})'),false);
    assert.deepEqual(snapshot(c),settled);
  } finally {c.run('Math.random=s9ForbiddenRandom;');}
  const settledReload = cold(c,'S9 legacy public settled');
  return {position,name:'public secure',phases:{pending,settled,duplicate:settled,settledReload},
    publicCallbackCount:c.run('s9Public.rolls'),duplicateRetries:3};
}

function run() {
  const evidencePaths = new Set();
  const baselineSources = loadSources();
  const before = makeHarness(baselineSources,evidencePaths), after = makeHarness({},evidencePaths);
  const rows = [], variants = [['clean',{}],['low hands',{capabilities:{fielding:1,catching:1}}],['low throwing',{capabilities:{arm:1,throwing:1}}]];
  function compare(a,b) {
    assert.deepEqual(b,a, a.position+' '+a.name+' legacy comparison changed');
    const phases = Object.keys(a.phases);
    const final = a.phases.settled;
    rows.push({position:a.position,name:a.name,historical:a.historical||false,pass:true,
      baselineSha256:sha(JSON.stringify(a)),currentSha256:sha(JSON.stringify(b)),
      phases:phases.map(phase=>({phase,baselineSha256:sha(JSON.stringify(a.phases[phase])),currentSha256:sha(JSON.stringify(b.phases[phase]))})),
      physicalIdentity:final.physical.identity,
      topologyVersion:final.opportunity?.topologyVersion,
      actualOuts:final.outs,scores:final.scores,runners:final.runners,
      actorDefense:final.record.playerLines.player?.defense,
      recordTotals:final.record.totals,
      matchRngValues:final.observation.matchRng,
      publicSamples:final.observation.publicSamples,
      executionSamples:final.observation.executionSamples,
      recovery:a.recovery||{settled:true,duplicateRetries:3,rerollForbidden:true},
      sampleObservation:a.sampleObservation||'actual public choice callback'});
  }
  for(const position of Object.keys(labels)) {
    compare(publicFixture(before,position),publicFixture(after,position));
    for(const [name,extra] of variants)compare(oneFixture(before,position,name,extra),oneFixture(after,position,name,extra));
    compare(oneFixture(before,position,'historical topology',{},true),oneFixture(after,position,'historical topology',{},true));
  }
  return {suite:'receiver-execution-v2-sprint-9-legacy-comparison',baseline,runtimeModel:'LEGACY_ONLY',
    summary:{passed:rows.length,failed:0,total:rows.length,publicHandlerPairs:4,recoveryPairs:16},
    sourceBoundary:{existingFixtureBodiesUnchanged:true,rootBaselineLoader:'git show; maxBuffer30MB',protectedContentReads:0,
      evidencePaths:[...evidencePaths].sort()},
    measurements:['physical identity / opportunity','roster','route / cached owned sample','original RNG values / callback count / order',
      'raw action / retirement stages','outs / bases / scores / cursor','E / A / H / FC record / PA','GameRecord / Evaluation / experience',
      'pending / executed / settled cold reload','three duplicate submissions / forbidden recovery RNG'],
    limits:['Declared legal Production fixture inputs, not natural career frequencies.','No full match cohort or v2 shadow simulation.',
      'Executed recovery uses the original family resolver sample callback; four public cases measure the public handler callback.',
      'No v2 formal Save admission or candidate executed / settled lifecycle validation.'],rows};
}
module.exports={run,baseline};
if(require.main===module) {
  const value=run();
  console.log(JSON.stringify({suite:value.suite,baseline:value.baseline,...value.summary,productionDelta:0}));
}
