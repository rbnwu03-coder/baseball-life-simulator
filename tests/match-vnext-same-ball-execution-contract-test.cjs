'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), cp = require('node:child_process');
const H = require('./pitch-production-source-scope.cjs');
const G1B = require('./g1-b-source-delta.cjs');
const norm = s => s.replace(/\r\n?/g, '\n');
const pins = ['ac53bf61964bde4b40501c77e15269bae99b55cc', '98bcd1db941f63d17bacd2cbf75d8c4b8e717ac7',
  '9b9546f94a7286afef474be634fd93c57eb455db', '2a4b44a034b714b8de3c8a6897507995ab0f8ccd', '674e49115a9ed7d67c69a3023b5a594d41fe584c'];
function pinned(pin, file) { return norm(cp.execFileSync('git', ['--no-optional-locks', 'show', pin + ':' + file], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })); }
function runSourceDeltaTests(planned = false) {
  let assertions = 0;
  const ok = (condition, message) => { assert(condition, message); assertions++; };
  const reject = (fn, message) => { assert.throws(fn, undefined, message); assertions++; };
  const receiver = fs.readFileSync('receiver-source-snapshot.js', 'utf8');
  for (const pin of pins) {
    for (const file of ['offensive-plate-approach.js', 'plate-decision-foundation.js', ...(pins.indexOf(pin) >= 3 ? ['index.html'] : [])]) {
      const original = pinned(pin, file);
      let current = norm(fs.readFileSync(file, 'utf8'));
      if (planned && file === 'offensive-plate-approach.js') current = current.replace(
        'if (!normalized || normalized.completed || normalized.pendingPitch)', 'if (!normalized || normalized.completed || normalized.awaitingDefense || normalized.pendingPitch)');
      if (planned && file === 'plate-decision-foundation.js') current = current
        .replace('if (!plateAppearanceState || plateAppearanceState.completed) return deepFreeze', 'if (!plateAppearanceState || plateAppearanceState.completed || plateAppearanceState.awaitingDefense) return deepFreeze')
        .replace('function resolve(input = {}) {', 'function resolve(input = {}, trustedPhysicalOutcomeResolver = null) {')
        .replace('      ...clone(input.executionOptions || {}),', '      ...clone(input.executionOptions || {}),\n      ...(typeof trustedPhysicalOutcomeResolver === "function" ? { physicalOutcomeResolver: trustedPhysicalOutcomeResolver } : {}),');
      if (planned && file === 'index.html') current = current.replace('  <script src="script.js"></script>',
        '  <script src="contracts/match-vnext-execution-v0.1.cjs"></script>\n  <script src="match-vnext-same-ball-execution-adapter.js"></script>\n  <script src="script.js"></script>');
      ok(H.assertMatchVNextSourceDelta(file, current, original, receiver).exact, pin + ' ' + file);
      reject(() => H.assertMatchVNextSourceDelta(file, current + '\n// unrelated source delta\n', original, receiver), 'extra source');
      reject(() => H.assertMatchVNextSourceDelta(file, current, original + '\n', receiver), 'changed original pin');
      reject(() => H.assertMatchVNextSourceDelta(file, current, original + original, receiver), 'duplicate original anchors');
      const brokenOriginal = file === 'index.html' ? original.replace('<script', '<script defer') : original.replace('function', 'changedFunction');
      assert.notEqual(brokenOriginal, original);
      reject(() => H.assertMatchVNextSourceDelta(file, current, brokenOriginal, receiver), 'missing original anchor/authority');
      if (file === 'offensive-plate-approach.js') {
        for (const [from, to] of [['contactRoll <= contactProbability', 'true'], ['options.physicalRolls', '{}'], ['PitchSequencing.createPitchDecision', 'OtherSelector.createPitchDecision']])
          reject(() => H.assertMatchVNextSourceDelta(file, current.replace(from, to), original, receiver), 'extra algorithm change');
      } else if (file === 'plate-decision-foundation.js') {
        reject(() => H.assertMatchVNextSourceDelta(file, current.replace('physicalOutcomeResolver: trustedPhysicalOutcomeResolver', 'physicalOutcomeResolver: input.physicalOutcomeResolver'), original, receiver), 'untrusted callback');
      } else {
        for (const changed of [current + '<script src="extra.js"></script>', current.replace('<script src="receiver-source-snapshot.js"></script>', ''),
          current.replace('<script src="player.js"></script>', '<script defer src="player.js"></script>'),
          current.replace('  <script src="script.js"></script>', '  <script src="script.js"></script>\n  <script src="script.js"></script>')])
          reject(() => H.assertMatchVNextSourceDelta(file, changed, original, receiver), 'unauthorized tags/receiver/attributes/order');
      }
    }
    const oldScript = pinned(pin, 'script.js'), current = norm(fs.readFileSync('script.js', 'utf8'));
    const old = H.readSource(oldScript).get('settleHighSchoolYearOneMatch'), now = H.readSource(current).get('settleHighSchoolYearOneMatch');
    reject(() => H.assertPitchProductionSourceScope(current.slice(0, now.start) + old.source + current.slice(now.end), oldScript), 'R0 terminal overwrite restored');
  }
  reject(() => H.assertMatchVNextSourceDelta('save.js', '', ''), 'unapproved file');
  return { suite: 'match-vnext-exact-source-delta', passed: assertions, failed: 0, planned, pins };
}
function runScriptLockTests() {
  const current=norm(fs.readFileSync('script.js','utf8')),baseline=pinned(pins[0],'script.js');
  let rejected=0;
  for(const changed of [
    current.replace('const highSchoolSameBallTickets = new WeakMap();','const highSchoolSameBallTickets = new Map();'),
    current.replace('mode.mode !== "controlled"','false'),
    current.replace('samples:options.sameBallSamples','samples:options.userDefenseSamples'),
    current.replace('getHighSchoolSameBallReceipt(match, sameBallCandidate);','void sameBallCandidate;'),
    current+'\nfunction validateHighSchoolSameBallState(){return true;}\n',
    current+'\ncreateHighSchoolSameBallResolver=function(){return null;};\n',
    current+'\nfunction otherMode(){return MatchVNextSameBallExecutionAdapter.execute({});}\n'
  ]) {
    assert.notEqual(changed,current);assert.throws(()=>H.assertPitchProductionSourceScope(changed,baseline));rejected++;
  }
  for(const pin of pins.slice(3)) {
    const current=norm(fs.readFileSync('index.html','utf8')),baseline=pinned(pin,'index.html'),receiver=fs.readFileSync('receiver-source-snapshot.js','utf8');
    const first='  <script src="contracts/match-vnext-execution-v0.1.cjs"></script>',second='  <script src="match-vnext-same-ball-execution-adapter.js"></script>';
    for(const changed of [current.replace(first+'\n'+second,second+'\n'+first),current.replace(first,first+'\n'+first),current.replace(second,'')]){
      assert.notEqual(changed,current);assert.throws(()=>H.assertMatchVNextSourceDelta('index.html',changed,baseline,receiver));rejected++;
    }
  }
  return {status:'PASS',rejected};
}
function runCandidateContractTests() {
  const t=require('./match-vnext-same-ball-production-integration-test.cjs'),C=require('../contracts/match-vnext-execution-v0.1.cjs');
  const h=t.completedUncommitted(),candidate=h.json('s1Candidate'),context=candidate.context,truth=candidate.ground.physicalTruth;
  const original=JSON.stringify(candidate);assert(C.validateCandidate(candidate,context,truth));assert.equal(JSON.stringify(candidate),original);
  let rejected=0;
  const bad=[c=>c.version='future',c=>c.physicalId='other',c=>c.context.paId='other',c=>c.closed=false,
    c=>c.reach.reached=false,c=>c.secure.secured=false,c=>c.thrown.throwQuality='offline',c=>c.received.ready=false,c=>c.received.secured=false,
    c=>c.timing.timingMargin=-1,c=>c.firstLeg.outRecorded=false,c=>c.firstLeg.continuation.pendingRunners=[{}],
    c=>c.force.retirements[0].outType='tagOut',c=>c.settlement.outsAfter=3,c=>c.settlement.baseChanges=['player',null,null],
    c=>c.scorerFacts=null,c=>c.actionFacts.actions[2].status='failed',c=>c.actionFacts.actions[3].dependsOn=['nonexistent'],
    c=>c.defensiveAttribution=null,c=>c.context.capabilities.pitcher.fallback=true,c=>delete c.context.capabilities.pitcher.raw,
    c=>c.context.capabilities.receiver.consumed.catching=null];
  for(const mutate of bad){const copy=structuredClone(candidate);mutate(copy);assert.throws(()=>C.validateCandidate(copy,context,truth));rejected++;}
  const actual={...context,before:context.before};
  for(const key of ['matchId','paId','batterId','battingSlot','offenseTeam','defenseTeam','inning','half','before','capabilities']){
    const changed=structuredClone(actual);changed[key]=null;assert.throws(()=>C.validateBefore(context,changed));rejected++;
  }
  return {status:'PASS',rejected,immutableInput:true};
}
function runSuite(){return {suite:'match-vnext-execution-contract',status:'PASS',source:runSourceDeltaTests(),scriptLock:runScriptLockTests(),candidate:runCandidateContractTests(),scorerS2:runS2ScorerContractTests(),recovery:{source:recoverySourceTests(),phases:[runRecoveryCorePhase('B'),runRecoveryCorePhase('C'),runRecoveryCorePhase('D')] }};}
if (require.main === module) console.log(JSON.stringify(process.argv.includes('--stage0-planned')?runSourceDeltaTests(true):runSuite()));
module.exports = { runSourceDeltaTests,runScriptLockTests,runCandidateContractTests,runSuite };

function runS2ScorerContractTests() {
  const T=require('./match-vnext-same-ball-production-integration-test.cjs'),D=require('../defensive-decision-throw-foundation.js'),C=require('../contracts/match-vnext-execution-v0.1.cjs');
  const {candidate,truth}=T.s2PureCandidate();assert(candidate.closed);
  const proof={...structuredClone(candidate),physicalTruth:structuredClone(truth)},snapshot=JSON.stringify(proof);
  delete proof.batterReachClassification;delete proof.result;delete proof.closed;
  const immutable=JSON.stringify(proof),classification=D.resolveBatterReachClassification(proof);
  assert.equal(classification.status,'supported');assert.equal(classification.officialClassification,'infieldHit');
  assert.equal(classification.compatibleOffensiveResult,'single');assert.equal(classification.responsibleBatterId,'player');
  assert.equal(classification.physicalIdentity,truth.identity);assert(classification.explanation.length>0);
  assert(Object.isFrozen(classification)&&Object.isFrozen(classification.sourceReferences.capabilities));
  assert.deepEqual(D.resolveBatterReachClassification(proof),classification);assert.equal(JSON.stringify(proof),immutable);
  const negatives=[
    ['physical',p=>p.physicalTruth.identity='wrong'],['match',p=>p.context.matchId='wrong'],['PA',p=>p.context.paId='wrong'],
    ['pitch',p=>p.context.pitchId='wrong'],['batter',p=>p.context.batterId='other'],['SS',p=>p.reach.defenderId='player'],
    ['1B',p=>p.received.receiverId='other'],['BR',p=>p.ground.runnerPhysicalStates[0].runnerId='other'],
    ['roster',p=>p.context.activeRoster.lineup.find(a=>a.id===p.context.capabilities.actors.shortstopId).defense--],
    ['capability',p=>p.context.capabilities.receiver.consumed.fielding--],['fallback',p=>p.context.capabilities.batter.fallback=true],
    ['missing source',p=>delete p.context.capabilities.shortstop.source],['late policy',p=>p.context.admission.lockedAt='afterContact'],
    ['batter raw admission mismatch',p=>p.context.capabilities.batter.raw.baseRunning--],
    ['invented NPC source',p=>{p.context.capabilities.receiver.source='invented';p.context.admission.capabilities.receiver.source='invented';}],
    ['invented batter source',p=>{p.context.capabilities.batter.source='invented';p.context.admission.capabilities.batter.source='invented';}],
    ['policy',p=>p.context.coveragePolicy='s1-out-only'],['missing admission',p=>delete p.context.admission],
    ['not ground',p=>p.physicalTruth.ballType='flyBall'],['not SS',p=>p.opportunity.primaryPosition='2B'],
    ['lead runner',p=>p.context.before.runners[1]='runner'],['wrong outs',p=>p.context.before.outs=3],
    ['not reached',p=>p.reach.reached=false],['bobble',p=>p.secure.secureQuality='bobbleButControlled'],['unsecured',p=>p.secure.secured=false],
    ['offline',p=>p.thrown.throwQuality='offline'],['weak',p=>p.thrown.throwQuality='lateWeakThrow'],
    ['challenging',p=>p.thrown.throwQuality='challengingReceive'],['late release',p=>p.thrown.releaseQuality='delayedRelease'],
    ['failed receive',p=>{p.received.secured=false;p.received.status='failed';}],['late receive',p=>p.received.status='late'],
    ['unavailable receive',p=>p.received.ready=false],['receive sample',p=>delete p.received.provenance.sample],
    ['receiver error candidate',p=>p.received.errorCharged=true],['no timing',p=>delete p.timing],
    ['timing contradiction',p=>p.timing.receiverCompletion.relativeCompletion=100],['margin contradiction',p=>p.timing.timingMargin=1],
    ['runner speed',p=>p.ground.runnerPhysicalStates[0].speed--],['pending recovery',p=>p.firstLeg.continuation.status='liveBallRecoveryRequired'],
    ['invented progress',p=>p.ground.runnerPhysicalStates[0].advancementProgress='nearArrival'],['first leg identity',p=>p.firstLeg.identity='other'],
    ['third out unresolved timing',p=>p.firstLeg.thirdOut.timingStatus='unresolved'],['undeclared next target',p=>p.firstLeg.continuation.targetBase='second'],
    ['pending runner',p=>p.firstLeg.continuation.pendingRunners=[{runnerId:'player'}]],['in transit',p=>p.firstLeg.continuation.inTransitRunners=[{}]],
    ['wrong first base',p=>p.firstLeg.baseChanges=[null,null,null]],['extra out',p=>p.firstLeg.outsAfter++],
    ['retirement',p=>p.firstLeg.orderedRetirements=[{runnerId:'player'}]],['third out',p=>p.firstLeg.thirdOut.thirdOutType='batterRunnerBeforeFirst'],
    ['third runner',p=>p.firstLeg.thirdOut.thirdRetirement={runnerId:'player'}],['half end',p=>p.firstLeg.thirdOut.halfInningEnded=true],
    ['action',p=>p.actionFacts.actions[2].status='failed'],['wrong scorer actor',p=>p.actionFacts.actions[2].actorId='player'],
    ['dependency',p=>p.actionFacts.actions[3].dependsOn=[]],['action source',p=>p.actionFacts.actions[0].provenance.secureId='other'],
    ['no scorer',p=>delete p.scorerFacts],['contrary scorer',p=>p.scorerFacts.batterReachedOnError=true],
    ['unresolved scorer contest',p=>p.scorerFacts.contests=[{}]],['only safe',p=>{for(const k of Object.keys(p))delete p[k];p.runnerResult='safe';}],
    ['only deferred single',p=>{for(const k of Object.keys(p))delete p[k];p.result='single';p.officialScoring='deferred';}],
    ['only zero errors',p=>{for(const k of Object.keys(p))delete p[k];p.scorerFacts={decisions:[],batterReachedOnError:false};}]
  ];
  const rows=[];for(const [name,mutate]of negatives){const p=structuredClone(proof);mutate(p);const prior=JSON.stringify(p),r=D.resolveBatterReachClassification(p);assert(['insufficient','unsupported'].includes(r.status),name);assert(r.reason&&!r.compatibleOffensiveResult,name);assert.equal(JSON.stringify(p),prior);rows.push({name,status:r.status,reason:r.reason});}
  for(const mutate of [c=>delete c.batterReachClassification,c=>c.batterReachClassification.responsibleBatterId='other',c=>c.force.outsCreated=1,c=>c.settlement.baseChanges=[null,null,null],c=>c.settlement.outsAfter++,c=>c.defensiveAttribution.actors[0].A=1]){const c=structuredClone(candidate);mutate(c);assert.throws(()=>C.validateCandidate(c,c.context,truth));}
  const pin='ab3117653945de0b7013636187c446276a96e634',old=pinned(pin,'defensive-decision-throw-foundation.js'),now=G1B.readCore('defensive-decision-throw-foundation.js');
  function originalScorer(source){source=stripRecoveryAPI(source,'resolvePostDeliveryBallState');const start=source.indexOf('  // S2-SCORER-001:'),end=source.indexOf('  return freeze({ VERSION, RNG_NAMESPACES, isAdvancingTo',start);assert(start>0&&end>start);assert.equal(source.split('function resolveBatterReachClassification(').length,2);return(source.slice(0,start)+source.slice(end)).replace('projectDefensiveAttribution, resolveBatterReachClassification });','projectDefensiveAttribution });');}
  assert.equal(originalScorer(now),old,'only additive API/export; all existing scorer behavior frozen');
  assert.notEqual(originalScorer(now.replace('charged && !actualOut','false && !actualOut')),old,'old scorer mutation remains visible');
  const current=norm(fs.readFileSync('script.js','utf8')),opa=norm(fs.readFileSync('offensive-plate-approach.js','utf8')),base=pinned(pin,'script.js');
  for(const changed of [current.replace('new WeakMap();\n\nfunction getHighSchoolSameBallReceipt','new Map();\n\nfunction getHighSchoolSameBallReceipt'),current+'\nhighSchoolSameBallAdmissions.set({},{});',current.replace('candidate.force.outsCreated)','1)'),current.replace('highSchoolSameBallAdmissions.set(match,admission);','highSchoolSameBallAdmissions.set(match,null);')]){assert.notEqual(changed,current);assert.throws(()=>H.assertPitchProductionSourceScope(changed,base));}
  assert.throws(()=>H.assertMatchVNextSourceDelta('offensive-plate-approach.js',opa.replace('globalThis.MatchVNextExecutionContract.validateCandidate(candidate, context, state.battedBallPhysicalTruth);',''),pinned(pin,'offensive-plate-approach.js')));
  assert(snapshot.length>immutable.length);return{status:'PASS',classification,negative:rows,candidateRejections:6,oldScorerSource:'EXACT_ADDITIVE_ONLY',newSourceGuardRejections:5,immutableInput:true};
}
Object.assign(module.exports,{runS2ScorerContractTests});

function stripRecoveryAPI(source,name) {
  const start=source.indexOf('  // S2-RECOVERY-001 additive API'),marker='  // End S2-RECOVERY-001 additive API.\n',end=source.indexOf(marker,start);
  assert(start>0&&end>start);assert.equal(source.split('function '+name+'(').length,2);
  return (source.slice(0,start)+source.slice(end+marker.length)).replace(', '+name+' });',' });').replace(','+name+'});','});');
}

function recoverySourceTests() {
  const crypto=require('node:crypto'),sha=s=>crypto.createHash('sha256').update(s).digest('hex'),rows=[];
  for(const [file,name] of [['defensive-decision-throw-foundation.js','resolvePostDeliveryBallState'],['defensive-reach-secure-foundation.js','resolveRecoveryAction'],['defensive-runner-throw-settlement-foundation.js','resolveRecoveryContinuation']]) {
    const now=G1B.readCore(file),stripped=stripRecoveryAPI(now,name),old=pinned('ab3117653945de0b7013636187c446276a96e634',file);
    if(file.includes('decision-throw')){
      const a=stripped.indexOf('  // S2-SCORER-001:'),b=stripped.indexOf('  return freeze({ VERSION, RNG_NAMESPACES, isAdvancingTo',a);
      assert.equal(sha(stripped.slice(a,b)),'4e3cb8de69c64d963e457e21cc92dfc977de23dd38d9be61bf28b99688b17981','S2-A classifier remains byte exact');
      assert.equal((stripped.slice(0,a)+stripped.slice(b)).replace('projectDefensiveAttribution, resolveBatterReachClassification });','projectDefensiveAttribution });'),old);
    }else assert.equal(stripped,old,'existing core formulas unchanged');
    assert.notEqual(stripRecoveryAPI(now+'\n// outside approved API\n',name),stripped);
    assert.throws(()=>stripRecoveryAPI(now+'\nfunction '+name+'(){}\n',name));
    const start=now.indexOf('  // S2-RECOVERY-001 additive API');
    const oldMutation=now.slice(0,start).replace('"use strict";','"use strict"; void 1;')+now.slice(start);
    assert.notEqual(stripRecoveryAPI(oldMutation,name),stripped);
    rows.push({file,api:name,status:'EXACT_ADDITIVE_API_EXPORT_ONLY',oldBodyMutationRejected:true,duplicateRejected:true,outsideDeltaRejected:true});
  }
  const current=norm(fs.readFileSync('script.js','utf8')),base=pinned(pins[0],'script.js');
  assert(H.assertPitchProductionSourceScope(current,base));
  for(const changed of [current.replace('MatchVNextExecutionContract.validateRecoverySampling(match.pendingOffensiveOpportunity.sameBallExecution.recoverySamples)','true'),current+'\nMatchVNextExecutionContract.RECOVERY_POLICY;\n',current.replace('mode.admission?.recoverySamples,match.pendingOffensiveOpportunity.sameBallExecution.recoverySamples','mode.admission?.recoverySamples,mode.admission?.recoverySamples')]){
    assert.notEqual(changed,current);assert.throws(()=>H.assertPitchProductionSourceScope(changed,base));
  }
  return {status:'PASS',rows,negativeGuards:12,s2ClassifierBodyFrozen:true};
}
function runRecoveryCorePhase(phase) {
  const T=require('./match-vnext-same-ball-production-integration-test.cjs'),D=require('../defensive-decision-throw-foundation.js'),R=require('../defensive-reach-secure-foundation.js'),N=require('../defensive-runner-throw-settlement-foundation.js'),C=require('../contracts/match-vnext-execution-v0.1.cjs');
  const source=['R1','R2','R3'].map(kind=>T.recoveryCase({kind})),rows=[],negative=[];
  const frozen=x=>{if(x&&typeof x==='object'){assert(Object.isFrozen(x));Object.values(x).forEach(frozen);}};
  for(const {h,facts:f} of source){
    const sourceSnapshot=JSON.stringify(f);
    if(phase==='B'){
      const result=D.resolvePostDeliveryBallState(f.ballInput);assert.deepEqual(result,f.ballState);assert.equal(result.possession.holderId,null);assert(result.location.distanceMeters>0);frozen(result);rows.push({quality:f.ballInput.thrown.throwQuality,result});
    }else if(phase==='C'){
      const result=R.resolveRecoveryAction(f.recoveryInput);assert.deepEqual(result,f.recoveryAction);assert.equal(result.status,'completed');assert.equal(result.actorId,f.ballInput.context.capabilities.actors.receiverId);frozen(result);rows.push({quality:f.ballInput.thrown.throwQuality,result});
    }else{
      // Use exact declared input shape, not candidate fields.
      const actual=N.resolveRecoveryContinuation({ballInput:f.ballInput,ballState:f.ballState,recoveryInput:f.recoveryInput,recoveryAction:f.recoveryAction,timingArgs:f.timingArgs,timing:f.timing,resolveThirdOut:args=>h.context.resolveHighSchoolThirdOutIntegrity(args)});
      assert.equal(JSON.stringify(actual),JSON.stringify(f.runnerContinuation));frozen(actual);assert(actual.progression.completionFraction>=0&&actual.progression.completionFraction<=1);if(actual.closed)assert.equal(actual.progression.completionFraction,1);assert.equal(actual.outsCreated,0);assert.equal(actual.orderedRetirements.length,0);rows.push({quality:f.ballInput.thrown.throwQuality,result:actual});
    }
    assert.equal(JSON.stringify(f),sourceSnapshot);
  }
  const f=source[0].facts;
  if(phase==='B'){
    for(const [name,change]of [['wrong holder source',x=>x.received.secured=true],['prior secure',x=>x.received=x.input.secureResult],['bad sample',x=>x.context.admission.recoverySamples.values.direction=1],['wrong sample owner',x=>x.context.admission.recoverySamples.authority='fixture-location'],['desired final',x=>x.finalBase='first'],['wrong match',x=>x.context.matchId='stale'],['wrong PA',x=>x.context.paId='stale'],['wrong pitch',x=>x.context.pitchId='stale'],['wrong physical',x=>x.physicalTruth.identity='stale'],['wrong NPC caps',x=>x.context.capabilities.receiver.consumed.mobility=20],['wrong original movement',x=>x.input.runnerPhysicalStates[0].advancementProgress='nearArrival'],['wrong clock',x=>x.timeBase.origin='firstArrival']]){
      const input=structuredClone(f.ballInput);change(input);const before=JSON.stringify(input),r=D.resolvePostDeliveryBallState(input);assert.equal(r.status,'unsupported',name);assert.equal(JSON.stringify(input),before);negative.push({name,reason:r.reason});
    }
  }else if(phase==='C'){
    for(const [name,change]of [['fabricated holder',x=>x.ballState.possession.holderId='fake'],['prior possession',x=>x.ballState.possession={status:'controlled',holderId:x.ballInput.context.capabilities.actors.shortstopId}],['no location',x=>delete x.ballState.location],['out of region',x=>x.ballState.location.distanceMeters=99],['bad actor',x=>x.access.actorId='player'],['bad position',x=>x.access.position='SS'],['wrong capability',x=>x.capabilities.fielding=20],['wrong start',x=>x.startAt=0],['wrong origin',x=>x.timeBase.origin='receiverCatch']]){
      const input=structuredClone(f.recoveryInput);change(input);const before=JSON.stringify(input),r=R.resolveRecoveryAction(input);assert.equal(r.status,'unsupported',name);assert.equal(JSON.stringify(input),before);negative.push({name,reason:r.reason});
    }
    const failed=T.recoveryCase({kind:'R1',values:{acquire:.1}}).facts,weak=T.recoveryCase({kind:'R3',defense:1}).facts;
    for(const x of [failed,weak]){assert.equal(R.resolveRecoveryAction(x.recoveryInput).status,'failed');assert.equal(x.recoveryAction.afterPossession.holderId,null);rows.push({case:'failed',result:x.recoveryAction});}
    assert(source[2].facts.recoveryAction.approach.reached);assert(!weak.recoveryAction.approach.reached);
  }else{
    const h=source[0].h,canonical=args=>h.context.resolveHighSchoolThirdOutIntegrity(args);
    for(const [name,change]of [['bad start',x=>x.recoveryAction.startAt--],['completion before start',x=>x.recoveryAction.completedAt=0],['failed claims control',x=>x.recoveryAction.status='failed'],['wrong clock',x=>x.recoveryAction.timeBase.origin='other'],['runner arrival contradiction',x=>x.timing.runnerArrival.relativeArrival++],['unproved second',x=>x.runnerContinuation.finalBase='second'],['unproved out',x=>x.runnerContinuation.outsCreated=1],['unclosed PA',x=>x.closed=true],['forced H',x=>x.result='single'],['forced E',x=>x.scorerFacts={errorCharged:true}],['unproved desired base',x=>x.timingArgs.finalBase='first']]){
      const input=structuredClone(f);change(input);assert.throws(()=>C.validateRecoveryFacts(input,input.ballInput.context,input.ballInput.physicalTruth,canonical),undefined,name);negative.push({name,status:'REJECTED'});
    }
    assert.equal(rows[2].result.status,'pending');assert.equal(rows[2].result.finalBase,null);assert.equal(rows[2].result.decision.type,'attemptSecond');
  }
  return {status:'PASS',phase,rows,negative,immutableInput:true};
}
Object.assign(module.exports,{runRecoveryCorePhase,recoverySourceTests});

