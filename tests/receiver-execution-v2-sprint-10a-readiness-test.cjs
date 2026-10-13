'use strict';
// Sprint 10A observes existing LEGACY execution and source gaps only. No candidate
// input generation, Pure.execute, shadow comparison, or official admission.
const assert = require('assert/strict');
const fs = require('fs'), path = require('path'), Module = require('module');
const cp = require('child_process'), crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const baseline = '32ee5ec55e4791952a9ef5d68c126389ab1e1ff6';
const helperPath = 'tests/high-school-career-test-context.js';
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
const git = args => cp.execFileSync('git', args, {cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:30e6});
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const copy = value => JSON.parse(JSON.stringify(value));
const normalized = text => text.replace(/\r\n/g, '\n');
const ss = '\u6e38\u64ca\u624b';

function makeHarness(evidencePaths, observe = true) {
  const ordinaryRequire = Module.createRequire(path.join(root, helperPath));
  const safeFs = Object.create(fs);
  safeFs.readFileSync = function(file, options) {
    const relative = path.relative(root,path.resolve(String(file))).replace(/\\/g,'/');
    if(protectedPaths.has(relative)) throw Error('PROTECTED_CONTENT_READ: '+relative);
    evidencePaths.add(relative);
    return fs.readFileSync(file,options);
  };
  const helper = new Module(path.join(root,helperPath),module);
  helper.filename = path.join(root,helperPath);
  helper.paths = Module._nodeModulePaths(path.dirname(helper.filename));
  helper.require = id => id === 'fs' ? safeFs : ordinaryRequire(id);
  const helperSource = safeFs.readFileSync(helper.filename,'utf8');
  const fixtureSource = safeFs.readFileSync(path.join(root,fixturePath),'utf8');
  assert.equal(normalized(helperSource),normalized(git(['show',baseline+':'+helperPath])));
  assert.equal(normalized(fixtureSource),normalized(git(['show',baseline+':'+fixturePath])));
  helper._compile(helperSource,helper.filename);
  const c = helper.exports.makeContext();
  let definitions = 0;
  for(const match of fixtureSource.matchAll(/\brun\(\x60([\s\S]*?)\x60\);/g))
    if(match[1].includes('function firstBaseFixture')) {c.run(match[1]);definitions++;}
  assert.equal(definitions,1,'Only the original fixture definitions are loaded, not its tests/cohorts');
  c.run('var s10aObservation={matchRng:[],ownedSamples:[],publicSamples:[]};');
  if(observe)c.run(`
    var s10aOriginalRng=nextHighSchoolMatchSimulationRandom;
    nextHighSchoolMatchSimulationRandom=function(...args){var value=s10aOriginalRng(...args);s10aObservation.matchRng.push(value);return value;};
    var s10aOriginalPrepare=prepareHighSchoolDefensiveMomentFromSimulation;
    prepareHighSchoolDefensiveMomentFromSimulation=function(match,options){
      if(typeof options?.randomSource==='function'){
        var callback=options.randomSource;
        options={...options,randomSource:()=>{var value=callback();s10aObservation.ownedSamples.push({phase:match.activeSituation?.lifecycleState||null,value});return value;}};
      }
      return s10aOriginalPrepare(match,options);
    };
    var s10aOriginalChoice=chooseHighSchoolYearOneMatchMoment;
    chooseHighSchoolYearOneMatchMoment=function(...args){
      if(typeof args[2]==='function'){var callback=args[2];args[2]=()=>{var value=callback();s10aObservation.publicSamples.push(value);return value;};}
      return s10aOriginalChoice(...args);
    };
  `);
  c.run(`
    function s10aBeforeExecution(options){
      var original=beginAutomaticGroundBallSituationExecution;
      beginAutomaticGroundBallSituationExecution=()=>{throw Error('S10A_BEFORE_EXECUTION_BOUNDARY');};
      try {firstBaseFixture(options);throw Error('Expected original execution entry');}
      catch(error){if(error.message!=='S10A_BEFORE_EXECUTION_BOUNDARY')throw error;}
      finally {beginAutomaticGroundBallSituationExecution=original;}
      return player.highSchoolMatch;
    }
  `);
  return c;
}

function originalFixture(c, options = {}, boundary = false) {
  c.run('s10aObservation={matchRng:[],ownedSamples:[],publicSamples:[]};');
  c.run('var m='+(boundary?'s10aBeforeExecution':'firstBaseFixture')+'('+JSON.stringify({position:ss,direction:.1,occupied:0,...options})+');');
}

function witness(c) {
  return c.json(`({
    physical:m.groundBallInPlayState.physicalTruth,
    groundIdentity:m.groundBallInPlayState.identity,
    opportunity:getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth),
    reach:m.groundBallInPlayState.defensiveAccess?.reachResolution,
    lifecycle:m.activeSituation,
    context:m.defensiveSituation,
    receiver:TeamRosterFoundation.getCurrentDefender(m.rosters[m.defenseTeam],'1B'),
    primary:TeamRosterFoundation.getCurrentDefender(m.rosters[m.defenseTeam],'SS'),
    receiverCapabilities:getDefensiveSimulationCapability(TeamRosterFoundation.getCurrentDefender(m.rosters[m.defenseTeam],'1B')),
    cache:m.groundBallInPlayState.shortstopExecution||null,
    timing:m.groundBallInPlayState.runnerThrowTiming||null,
    resolution:m.groundBallInPlayState.shortstopExecution?.resolution||m.lastDefensiveResolution||null,
    pendingSample:m.groundBallInPlayState.shortstopExecution?.sample??null,
    observed:s10aObservation,
    matchId:m.gameId||m.id,
    currentOuts:m.outs,runners:m.runners,scores:m.scores,cursor:m.simulationCursor
  })`);
}

// Test-local observation classifier, not a runtime adapter. It intentionally has
// no path which manufactures a full S8 input or starts a simulation.
function assess(w) {
  if(!w.physical?.identity || w.physical.version!=='batted-ball-physical-v1')
    return {status:'invalid',reason:'invalidPhysicalIdentity',simulationPerformed:false};
  if(w.primary?.id!=='player'||w.opportunity?.primaryDefenderId!=='player'||w.opportunity?.primaryPosition!=='SS')
    return {status:'invalid',reason:'invalidPrimaryHandoff',simulationPerformed:false};
  if(!w.receiver?.id||w.receiver.id==='player'||w.context?.teammates?.firstBaseReceiver?.id!==w.receiver.id)
    return {status:'invalid',reason:'invalidReceiverHandoff',simulationPerformed:false};
  const contract = JSON.parse(fs.readFileSync(path.join(root,'docs/receiver-execution-v2-sprint-10a-source-adapter-contract.json'),'utf8'));
  return {status:'blocked',reason:'insufficientIndependentReceiverSources',
    blockedReasons:contract.requiredMissingSources.slice(),runtimeEnabled:false,
    executionSourceBlockers:contract.requiredExecutionSources.slice(),
    scorerSourceBlockers:contract.scorerMissingSources.slice(),
    officialExecutionOwner:'existingLegacyOwner',simulationPerformed:false,
    candidateInput:null,candidateOutput:null,settlementAdmission:false,scoringAdmission:false,evaluationAdmission:false,
    sourceFacts:{physicalIdentity:{classification:'A',value:w.physical.identity},
      actorHandoff:{classification:'A',throwerId:w.primary.id,receiverId:w.receiver.id},
      legacyReceiverReadiness:{classification:w.timing?.receiverCompletion?'A':'C',scope:'legacy-combined-proxy-only',
        generationPhase:w.timing?.receiverCompletion?'legacyExecution':'notGeneratedBeforeExecution'},
      fixedPhysicalSlot:{classification:'C',proposal:'primaryThrow',productionPinned:false}},
    observedOwnedSample:w.cache?.sample??null};
}

function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function detachedPacket(w,a) {
  return freeze({kind:'readOnlyReceiverShadowDiagnostic',authority:'none',rawPhysicalIdentity:w.physical.identity,
    sourceSnapshotDigest:sha(JSON.stringify(w)),sourceReadiness:a.status,blockedReasons:a.blockedReasons,
    candidateOutputOrNull:null,runtimeEnabled:false,simulationPerformed:false,
    settlementAdmission:false,scoringAdmission:false,evaluationAdmission:false});
}
function checkDetachedPacket(packet) {
  const keys = ['kind','authority','rawPhysicalIdentity','sourceSnapshotDigest','sourceReadiness','blockedReasons',
    'candidateOutputOrNull','runtimeEnabled','simulationPerformed','settlementAdmission','scoringAdmission','evaluationAdmission'];
  assert(Object.keys(packet).every(key=>keys.includes(key)),'Official evidence fields cannot enter the diagnostic');
  assert.equal(packet.kind,'readOnlyReceiverShadowDiagnostic');assert.equal(packet.authority,'none');
  for(const field of ['runtimeEnabled','simulationPerformed','settlementAdmission','scoringAdmission','evaluationAdmission'])assert.equal(packet[field],false);
  assert.equal(packet.candidateOutputOrNull,null);
}
function detachedStoreProof() {
  const entries=new Map();
  return {put(key,packet){
    checkDetachedPacket(packet);
    if(entries.has(key)){
      const saved=entries.get(key);
      if(saved.sourceSnapshotDigest!==packet.sourceSnapshotDigest)throw Error('changed source under same physical/version/slot key');
      assert.deepEqual(saved,packet);return saved;
    }
    entries.set(key,freeze(copy(packet)));return entries.get(key);
  },clear(){entries.clear();}};
}

function run() {
  const sourcePaths = new Set(['docs/receiver-execution-v2-sprint-10a-source-adapter-contract.json',
    'docs/receiver-execution-v2-sprint-10a-shadow-storage-contract.json']);
  const checks = [], observations = [], c = makeHarness(sourcePaths), unwrapped=makeHarness(sourcePaths,false);
  function test(name,fn){try {fn();checks.push({name,pass:true});}catch(error){checks.push({name,pass:false,error:error.stack});}}
  function unchanged(w,fn){const old=copy(w),before=c.run('JSON.stringify(player)'),rng=copy(c.json('s10aObservation'));const result=fn();assert.deepEqual(w,old);assert.equal(c.run('JSON.stringify(player)'),before);assert.deepEqual(c.json('s10aObservation'),rng);return result;}
  function record(name,w,assessment) {
    const actions=w.resolution?.actionFacts?.actions||[];
    observations.push({name,classification:'DECLARED_LEGACY_PRODUCTION_FIXTURE_NOT_NATURAL_COHORT',
      rawPhysicalIdentity:w.physical.identity,physicalVersion:w.physical.version,
      primary:w.opportunity.primaryPosition,throwerId:w.primary.id,receiverId:w.receiver.id,
      initialOuts:w.cache?.before?.outs??w.context.outs,routeId:w.cache?.choice?.routeId??null,
      lifecycle:w.lifecycle?.lifecycleState??null,ownedSample:w.cache?.sample??null,
      sampleObservation:w.observed,throw:w.cache?.decisionThrowState?.throwResolution??null,
      actions:actions.map(action=>({identity:action.identity,physicalIdentity:action.physicalIdentity,type:action.type,status:action.status,actorId:action.actorId,receiverId:action.receiverId,targetBase:action.targetBase})),
      legacyTiming:w.timing,readiness:assessment,currentOuts:w.currentOuts,runners:w.runners,scores:w.scores,
      fullShadowPerformed:false});
  }

  for(const outs of [0,1,2]) {
    let pending,actual;
    test('outs '+outs+': actual SS primary / empty bases / NPC1B handoff before execution',()=>{
      originalFixture(c,{outs},true);pending=witness(c);
      assert.equal(pending.context.outs,outs);assert.deepEqual(pending.context.runners,[null,null,null]);
      assert.equal(pending.opportunity.primaryPosition,'SS');assert.equal(pending.opportunity.primaryDefenderId,'player');
      assert.equal(pending.primary.id,'player');assert.notEqual(pending.receiver.id,'player');
      assert.equal(pending.context.teammates.firstBaseReceiver.id,pending.receiver.id);
      assert.equal(pending.reach.physicalIdentity,pending.physical.identity);
    });
    test('outs '+outs+': pending has no owned execution sample or callback pre-extraction',()=>{
      assert.equal(pending.cache,null);assert.equal(pending.pendingSample,null);assert.equal(pending.observed.ownedSamples.length,0);
      assert.notEqual(pending.lifecycle?.lifecycleState,'executing');
    });
    test('outs '+outs+': real missing sources remain BLOCKED without mutation',()=>{
      const a=unchanged(pending,()=>assess(pending));assert.equal(a.status,'blocked');assert.equal(a.candidateInput,null);
      assert.equal(a.candidateOutput,null);assert.equal(a.simulationPerformed,false);assert(a.blockedReasons.includes('secureDemand'));
      assert.equal(a.sourceFacts.legacyReceiverReadiness.classification,'C');
      record('before execution outs '+outs,pending,a);
    });
    test('outs '+outs+': ordinary legacy 6-3 uses one original sample after execution begins',()=>{
      originalFixture(c,{outs});actual=witness(c);
      assert.equal(actual.cache.choice.routeId,'secureFirstBaseOut');assert.equal(actual.cache.sample,.8);
      assert.equal(actual.observed.ownedSamples.length,1);assert.equal(actual.observed.ownedSamples[0].phase,'executing');
      assert.equal(actual.currentOuts,outs+1);
      assert.equal(actual.cache.decisionThrowState.throwResolution.receiverId,actual.receiver.id);
      assert.equal(actual.cache.decisionThrowState.throwResolution.targetBase,'first');
    });
    test('outs '+outs+': read-only source observation preserves legacy Match / record / Evaluation / RNG',()=>{
      const a=unchanged(actual,()=>assess(actual));assert.equal(a.status,'blocked');
      originalFixture(unwrapped,{outs});assert.deepEqual(c.json('player'),unwrapped.json('player'));
      record('routine direct outs '+outs,actual,a);
    });
  }

  for(const [name,options,expectedThrow,expectedReceive] of [
    ['offline',{capabilities:{arm:1,throwing:1}},'failed','notAttempted'],
    ['initial acquisition failure',{capabilities:{fielding:1,catching:1}},'notAttempted','notAttempted'],
    ['legacy combined receiver failure',{weakReceiver:'1B'},'completed','failed'],
    ['fast runner already safe',{batterSpeed:18},'completed','completed']
  ]) {
    let actual;
    test(name+': actual original branch and physical action identity are retained',()=>{
      originalFixture(c,options);actual=witness(c);
      const actions=actual.resolution.actionFacts.actions,throwAction=actions.find(action=>action.type==='throw');
      const receiveAction=actions.find(action=>action.type==='receive');
      assert.equal(throwAction.status,expectedThrow);assert.equal(receiveAction.status,expectedReceive);
      assert(actions.every(action=>action.physicalIdentity===actual.physical.identity));
      assert.equal(actual.cache.choice.routeId,'secureFirstBaseOut');assert.equal(actual.currentOuts,0);
    });
    test(name+': failure or already-safe result does not fill missing new receiver sources',()=>{
      const a=unchanged(actual,()=>assess(actual));assert.equal(a.status,'blocked');assert.equal(a.officialExecutionOwner,'existingLegacyOwner');
      assert(a.blockedReasons.includes('calibratedOrdinaryEffort'));assert.equal(a.scoringAdmission,false);
      record(name,actual,a);
    });
  }

  test('hold branch uses actual legal no-delivery action; physical slot remains unpinned',()=>{
    originalFixture(c,{},true);const before=witness(c);
    c.run('var s10aHold=firstBaseExecute(m,"contain",.8);resumeResolvedHighSchoolGroundBallSettlement(m);');
    const w=witness(c),actions=w.resolution.actionFacts.actions;
    assert.equal(w.cache.choice.routeId,'holdBall');assert.equal(w.cache.decisionThrowState.throwResolution.throwAttempted,false);
    assert(!actions.some(action=>action.type==='throw'&&action.status==='completed'));
    assert.equal(w.physical.identity,before.physical.identity);const a=assess(w);
    assert.equal(a.sourceFacts.fixedPhysicalSlot.classification,'C');record('explicit legal hold / legacy resolver',w,a);
  });

  test('NPC adapter aliases are observed; independent catching / mobility are missing',()=>{
    originalFixture(c);const w=witness(c),cap=w.receiverCapabilities;
    assert.equal(cap.reaction,w.receiver.defense);assert.equal(cap.range,w.receiver.defense);assert.equal(cap.fielding,w.receiver.defense);
    assert.equal(cap.arm,w.receiver.arm);assert.equal(cap.throwing,w.receiver.arm);
    assert.equal(Object.prototype.hasOwnProperty.call(cap,'mobility'),false);assert.equal(Object.prototype.hasOwnProperty.call(cap,'catching'),false);
    assert.equal(typeof w.receiver.speed,'number');assert.equal(assess(w).status,'blocked');
  });
  test('canonical throw quality is available but receiver demand / touch CRT are not inferred',()=>{
    const w=witness(c),throwFact=w.cache.decisionThrowState.throwResolution;
    assert.equal(throwFact.throwQuality,'onTarget');assert.equal(throwFact.throwDemand.distanceClass,'medium');
    assert.equal(w.timing.version,'defensive-runner-throw-settlement-v1');
    const a=assess(w);for(const field of ['secureDemand','secureDuration','touchDuration','originVersionMapping'])assert(a.blockedReasons.includes(field));
  });
  test('atBase and combined ready are legacy facts, not independent positioning completion',()=>{
    const w=witness(c);assert.equal(w.timing.receiverCompletion.atBase,true);assert.equal(w.timing.receiverCompletion.ready,true);
    for(const field of ['positioningStartContext','requiredMovement','positioningStart','positioningCompletion'])assert(assess(w).blockedReasons.includes(field));
  });

  test('detached missing physical identity is invalid without fallback or content mutation',()=>{
    const w=witness(c),bad=copy(w);delete bad.physical.identity;assert.equal(unchanged(bad,()=>assess(bad)).reason,'invalidPhysicalIdentity');
  });
  test('detached unsupported physical version is invalid',()=>{const bad=witness(c);bad.physical.version='legacySynthetic';assert.equal(assess(bad).status,'invalid');});
  test('detached incorrect player primary handoff is invalid',()=>{const bad=witness(c);bad.opportunity.primaryDefenderId='other';assert.equal(assess(bad).reason,'invalidPrimaryHandoff');});
  test('detached player1B receiver cannot masquerade as NPC1B',()=>{const bad=witness(c);bad.receiver.id='player';assert.equal(assess(bad).reason,'invalidReceiverHandoff');});
  test('detached receiver context / roster mismatch is invalid',()=>{const bad=witness(c);bad.context.teammates.firstBaseReceiver.id='wrong';assert.equal(assess(bad).reason,'invalidReceiverHandoff');});
  test('success boolean / fake coordinates / fixture times cannot unblock this source audit',()=>{
    const bad=witness(c);bad.legacyReceiverSuccess=true;bad.fakePosition={x:0,y:0};bad.fakeTime=0;
    const a=assess(bad);assert.equal(a.status,'blocked');assert.equal(a.candidateInput,null);assert.equal(a.simulationPerformed,false);
  });
  test('uncalibrated average=10 is not an effort authority or a receiver source',()=>{
    const bad=witness(c);bad.averageReference={average:10,calibrated:true};
    const a=assess(bad);assert.equal(a.status,'blocked');assert(a.blockedReasons.includes('calibratedOrdinaryEffort'));
    assert.equal(a.scoringAdmission,false);assert.equal(a.candidateOutput,null);
    assert(a.scorerSourceBlockers.includes('calibratedOrdinaryEffort'));assert(!a.executionSourceBlockers.includes('calibratedOrdinaryEffort'));
  });
  test('detached unavailable receiver flag cannot fabricate positioning or a hands result',()=>{
    const bad=witness(c);bad.context.teammates.firstBaseReceiver.receivingAvailable=false;
    const a=assess(bad);assert.equal(a.status,'blocked');assert.equal(a.candidateOutput,null);
    assert(a.blockedReasons.includes('positioningStartContext'));
  });

  let lifecycleObservation;
  test('actual beginExecution replaces executionState and loses arbitrary pin metadata',()=>{
    c.run(`var s10aLifecycle=MatchSituationLifecycle.admitSituation(MatchSituationLifecycle.createSituation({
      situationId:'S10A-isolated-metadata-probe',actor:{id:'player',position:'SS'},
      contextSnapshot:{probePin:'isolated sentinel, not official v2 admission'},legalRoutes:[{routeId:'secureFirstBaseOut'}]
    }),{supported:true,playerOwnsDecision:false});
    var s10aWithPin={...JSON.parse(JSON.stringify(s10aLifecycle)),executionState:{probePin:'lost on replacement'}};
    var s10aBegan=MatchSituationLifecycle.beginExecution(s10aWithPin,{selectedRoute:'secureFirstBaseOut'});`);
    assert.equal(c.run('s10aBegan.executionState.probePin'),undefined);
    assert.equal(c.run('s10aBegan.contextSnapshot.probePin'),'isolated sentinel, not official v2 admission');
    lifecycleObservation={executionStateReplaced:true,arbitraryExecutionPinLost:true,contextMetadataRetained:true,
      officialPinImplemented:false,formalSaveGuardImplemented:false};
  });

  let recoveryObservation;
  test('legacy empty-base pending / executed / settled cold recovery and three duplicates remain original-owner only',()=>{
    originalFixture(c,{},true);const raw=witness(c).physical.identity;
    const reload=label=>{const expected=c.json('normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch');c.run('saveGame();player=createInitialPlayer('+JSON.stringify(label)+');loadGame();m=player.highSchoolMatch;');assert.deepEqual(c.json('m'),expected);};
    reload('S10A existing pending');assert.equal(witness(c).physical.identity,raw);
    c.run('var s10aExecute=firstBaseExecute(m,"secure",.8);');assert.equal(c.run('s10aExecute.rolls'),1);
    const sample=c.run('m.groundBallInPlayState.shortstopExecution.sample');
    c.run('var s10aRandom=Math.random;Math.random=()=>{throw Error("S10A_FORBIDDEN_LEGACY_RECOVERY_RNG");};');
    try {
      reload('S10A existing executed');assert.equal(c.run('m.groundBallInPlayState.shortstopExecution.sample'),sample);
      c.run('resumeResolvedHighSchoolGroundBallSettlement(m);var s10aOnce=JSON.stringify(player);');
      for(let retry=0;retry<3;retry++)c.run('resumeResolvedHighSchoolGroundBallSettlement(m);');
      assert.equal(c.run('JSON.stringify(player)'),c.run('s10aOnce'));reload('S10A existing settled');
    }finally{c.run('Math.random=s10aRandom;');}
    recoveryObservation={model:'LEGACY_ONLY',pending:true,executed:true,settled:true,duplicateRetries:3,originalSample:sample,recoveryRandomForbidden:true};
  });

  test('actual public SS handler compatibility reference is outside empty-base slice and remains exactly once',()=>{
    originalFixture(c,{occupied:1});c.run('var s10aPublic=firstBasePublic(m,"secure",.8);var s10aPublicOnce=JSON.stringify(player);');
    assert.equal(c.run('s10aPublic.rolls'),1);assert.equal(c.json('s10aObservation.publicSamples').length,1);
    for(let retry=0;retry<3;retry++)assert.equal(c.run('chooseHighSchoolYearOneMatchMoment(s10aPublic.choice.matchDecision,s10aPublic.choice.matchMomentId,()=>{throw Error("S10A_DUPLICATE_SAMPLE");})'),false);
    assert.equal(c.run('JSON.stringify(player)'),c.run('s10aPublicOnce'));
    observations.push({name:'SS public compatibility reference',scope:'OUTSIDE_SLICE_OCCUPIED_FIRST_BASE',sampleCallbacks:1,duplicateRetries:3,fullShadowPerformed:false});
  });

  test('historical v1 topology / original pending-executed-settled recovery keeps source ownership',()=>{
    c.run('var s10aRouter=getHighSchoolDefensiveOpportunity;getHighSchoolDefensiveOpportunity=(m,t)=>DefensiveOpportunityFoundation.resolveDefensiveOpportunity({physicalTruth:t,activeRoster:m.rosters[m.defenseTeam],topologyVersion:"regulation-coarse-zones-v1"});');
    try {originalFixture(c,{},true);}finally {c.run('getHighSchoolDefensiveOpportunity=s10aRouter;');}
    const old=witness(c),identity=old.physical.identity;
    c.run('saveGame();player=createInitialPlayer("S10A historical pending");loadGame();m=player.highSchoolMatch;var s10aHistorical=firstBaseExecute(m,"secure",.8);saveGame();player=createInitialPlayer("S10A historical executed");loadGame();m=player.highSchoolMatch;resumeResolvedHighSchoolGroundBallSettlement(m);');
    assert.equal(witness(c).physical.identity,identity);assert.equal(c.run('m.groundBallInPlayState.shortstopExecution.sample'),.8);
    assert.deepEqual(c.json('getHighSchoolMatchStateIntegrityIssues(m)'),[]);
    const settled=c.json('normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch');
    c.run('saveGame();player=createInitialPlayer("S10A historical settled");loadGame();m=player.highSchoolMatch;');
    assert.deepEqual(c.json('m'),settled);assert.equal(witness(c).physical.identity,identity);
  });
  test('legacy settled Save entry has no receiver-v2 discriminator guard (copy-only unknown metadata probe)',()=>{
    const before=c.run('JSON.stringify(player)');
    c.run('var s10aGuardProbe=JSON.parse(JSON.stringify(player));s10aGuardProbe.highSchoolMatch.groundBallInPlayState.receiverModelAdmission={probeOnly:true,executionVersion:"S10A_UNKNOWN_NOT_AN_ADMISSION"};var s10aGuardNormalized=normalizeSave(s10aGuardProbe);');
    assert.equal(c.run('JSON.stringify(player)'),before);
    assert.equal(c.run('s10aGuardNormalized.highSchoolMatch.groundBallInPlayState.receiverModelAdmission.executionVersion'),'S10A_UNKNOWN_NOT_AN_ADMISSION');
  });

  let storageObservation;
  test('detached diagnostic sidecar proof stores BLOCKED null output outside live Match / Save',()=>{
    const w=witness(c),a=assess(w),before=c.run('JSON.stringify(player)'),rng=copy(c.json('s10aObservation'));
    const packet=detachedPacket(w,a);checkDetachedPacket(packet);const sidecar=new Map([[w.physical.identity,packet]]);
    assert.equal(sidecar.get(w.physical.identity),packet);assert(Object.isFrozen(packet));assert(Object.isFrozen(packet.blockedReasons));
    assert.equal(c.run('JSON.stringify(player)'),before);assert.deepEqual(c.json('s10aObservation'),rng);
    const normalizedSave=c.json('normalizeSave(JSON.parse(JSON.stringify(player)))');
    assert.equal(JSON.stringify(normalizedSave).includes('readOnlyReceiverShadowDiagnostic'),false);
    sidecar.clear();assert.equal(c.run('JSON.stringify(player)'),before);
    storageObservation={scope:'TEST_LOCAL_DETACHED_MAP_PROOF_NOT_LIVE_STORE',immutable:true,output:null,
      matchMutation:false,saveConsumer:false,settlementConsumer:false,recordMutation:false,cleanupMatchMutation:false};
  });
  test('detached diagnostic duplicate returns original immutable artifact, not a retry-generated result',()=>{
    const w=witness(c),packet=detachedPacket(w,assess(w)),store=detachedStoreProof();
    const key=JSON.stringify([w.physical.identity,'DRAFT_versions_not_production_pins','primaryThrow_proposal']);
    const original=store.put(key,packet);assert.equal(store.put(key,copy(packet)),original);assert(Object.isFrozen(original));
  });
  test('detached diagnostic same physical/version/slot key rejects changed actor/route/source digest',()=>{
    const w=witness(c),packet=detachedPacket(w,assess(w)),store=detachedStoreProof();
    const key=JSON.stringify([w.physical.identity,'DRAFT_versions_not_production_pins','primaryThrow_proposal']);store.put(key,packet);
    for(const mutation of [changed=>changed.receiver.id='other',changed=>changed.cache.choice.routeId='holdBall',changed=>changed.physical.pace='changed']){
      const changed=copy(w);mutation(changed);
      const altered={...copy(packet),sourceSnapshotDigest:sha(JSON.stringify(changed))};
      assert.throws(()=>store.put(key,altered),/changed source/);
    }
  });
  for(const field of ['resolution','actionFacts','outRecorded','retirements','baseChanges','runChanges'])
    test('diagnostic local packet rejects official authority field '+field,()=>{
      const packet=copy(detachedPacket(witness(c),assess(witness(c))));packet[field]={forged:true};assert.throws(()=>checkDetachedPacket(packet));
    });
  test('diagnostic local packet rejects activation / candidate outcome / scoring admission',()=>{
    const original=detachedPacket(witness(c),assess(witness(c)));
    for(const [field,value] of [['runtimeEnabled',true],['candidateOutputOrNull',{}],['settlementAdmission',true],['scoringAdmission',true],['evaluationAdmission',true]])
      assert.throws(()=>checkDetachedPacket({...copy(original),[field]:value}));
  });
  test('source contract and storage draft keep required C gaps and forbid candidate simulation',()=>{
    const contract=JSON.parse(fs.readFileSync(path.join(root,'docs/receiver-execution-v2-sprint-10a-source-adapter-contract.json'),'utf8'));
    const store=JSON.parse(fs.readFileSync(path.join(root,'docs/receiver-execution-v2-sprint-10a-shadow-storage-contract.json'),'utf8'));
    assert.equal(contract.runtimeEnabled,false);assert.equal(contract.decision,'BLOCKED_FOR_FULL_SHADOW');
    assert.equal(store.missingSource.callCandidateExecute,false);assert.equal(store.missingSource.candidateOutputOrNull,null);
  });

  const failed=checks.filter(check=>!check.pass);
  return {suite:'receiver-execution-v2-sprint-10a-readiness',baseline,
    summary:{total:checks.length,passed:checks.length-failed.length,failed:failed.length},checks,observations,
    lifecycleObservation,recoveryObservation,storageObservation,
    sourceBoundary:{sourcePaths:[...sourcePaths].sort(),originalFixtureDefinitionsOnly:true,
      declaredSeed:77001,protectedContentReads:0,candidateExecutionCalls:0,fullShadowComparison:false,
      capturesWritten:false,existingSourcesUnmodifiedByTests:true},
    limits:['Readiness assertions prove BLOCKED classifications, not a receiver-v2 integration PASS.',
      'Legacy witnesses are declared existing legal Production fixtures, not a natural cohort.',
      'Empty-base SS witnessed automatic handling; meaningful chooser / version pin is not connected.',
      'Detached Map tests demonstrate a proposed separation boundary, not a live Shadow or Save implementation.',
      'No ordinary-effort authority, formal v2 Save, or authoritative timing seam is supplied.']};
}
module.exports={run,baseline,protectedPaths};
if(require.main===module){const value=run();console.log(JSON.stringify({suite:value.suite,...value.summary,fullShadowComparison:false}));for(const check of value.checks)if(!check.pass)console.error('FAIL '+check.name+'\n'+check.error);if(value.summary.failed)process.exitCode=1;}
