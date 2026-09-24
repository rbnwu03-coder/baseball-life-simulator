"use strict";
const assert=require('assert'),fs=require('fs'),cp=require('child_process');
const T=require('./high-school-relationship-recency-reputation-feasibility-audit.cjs');
const make=require('./high-school-opportunity-probability-calibration-career.cjs');
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
const settings={namespace:'temporal-feasibility',extended:true,validateEntry:true};
const audit=make(settings),{run,json}=audit.env;
run(`var temporalBoundaries=[];var originalTemporalTransition=initializeHighSchoolYearTransition;
 initializeHighSchoolYearTransition=function(year){
   const before=JSON.parse(JSON.stringify(player.highSchoolExchangeNetwork));
   const result=originalTemporalTransition(year);
   temporalBoundaries.push({year,before,after:JSON.parse(JSON.stringify(player.highSchoolExchangeNetwork))});return result;
 };`);
const careers=[],ledgers=[];
for(let i=1;i<=4;i++){careers.push(audit.runCareer(i));ledgers.push(json('player.highSchoolExchangeNetwork'));}
test('real admitted Y1 completed-match evidence',()=>assert(ledgers.every(l=>l.evidence.some(e=>e.careerYear===1&&e.completed&&e.matchId&&e.scheduleEntryId))));
test('Y1/Y2/Y3 frequency remains 2/2/1',()=>{for(const c of careers)assert.deepStrictEqual([1,2,3].map(y=>c.windows.filter(w=>w.year===y&&w.completed).length),[2,2,1]);});
test('year transitions preserve original evidence facts exactly',()=>{for(const b of json('temporalBoundaries'))assert.deepStrictEqual(b.after,b.before);assert.strictEqual(json('temporalBoundaries').length,8);});
test('real save/load at both boundaries preserves ledger and schedule',()=>{for(const c of careers){assert.strictEqual(c.checks.crossYearReloadSamples,2);assert.strictEqual(c.checks.crossYearReloadMismatch||0,0);}});
test('Y1 origin year survives Y3 with age 2',()=>{for(const l of ledgers)assert(T.inspectLedger(l,{careerYear:3}).filter(e=>e.year===1).every(e=>e.recordedYearDistance===2));});
test('anti-reroll declined expired cancelled unchanged',()=>{for(const c of careers){assert.strictEqual(c.checks.antiRerollFailures,0);assert.deepStrictEqual(c.checks.antiReroll,{declined:1,expired:1,cancelled:1});}});
test('mandatory budget and materialization integrity unchanged',()=>{for(const c of careers)for(const k of ['mandatoryProfiles','budgetViolation','duplicateWindowMaterialization','selectedWithoutOpportunity','unselectedMaterialized'])assert.strictEqual(c.checks[k],0);});
test('GameRecord all 20 matches valid',()=>assert(careers.every(c=>c.windows.every(w=>w.recordIntegrity))));
test('gameplay RNG and strength perturbation neutral',()=>assert(careers.every(c=>c.checks.gameplayRngMismatch===0&&c.checks.neutralityMismatch===0)));
const replay=make(settings).runCareer(1);
test('observation does not change match records or selection',()=>assert.deepStrictEqual(careers[0],replay));
const lineage=[];
// Real completion scenarios cover types that a four-career random selection need not select.
for(const type of ['incomingFriendlyInvitation','outgoingFriendlyInvitation','trainingCampOpportunity','developmentMatchOpportunity']){
 const env=require('./high-school-opportunity-selection-test-context.cjs')('enabled');
 env.run('var temporalPrior=priorExchange('+JSON.stringify(type)+');var temporalInput=sourceInput();');
 const ledger=env.json('player.highSchoolExchangeNetwork');
 const friendly=env.json('HighSchoolFriendlyInvitationSource.deriveFriendlyInvitationSources(temporalInput)');
 const camp=env.json('HighSchoolTrainingCampSource.deriveTrainingCampSources(temporalInput)');
 const before=env.json('player.highSchoolExchangeNetwork');
 env.run('saveGame();var temporalRenderer=showCurrentEvent;try{showCurrentEvent=()=>{};loadGame();}finally{showCurrentEvent=temporalRenderer;}');
 assert.deepStrictEqual(env.json('player.highSchoolExchangeNetwork'),before);
 lineage.push({type,ledger,friendly,camp});
}
test('return visit keeps temporal parent after real completion and reload',()=>{for(const x of lineage.slice(0,2)){const r=x.ledger.evidence.find(e=>e.evidenceType==='returnVisitEligible');assert(r);const p=x.ledger.evidence.find(e=>e.evidenceId===r.parentEvidenceId);for(const k of ['careerYear','seasonPhase','sequence','matchId','scheduleEntryId'])assert.deepStrictEqual(r[k],p[k]);}});
test('friendly producer resolves canonical evidence refs',()=>{for(const x of lineage){assert(x.friendly.sources.length);for(const s of x.friendly.sources)assert(T.inspectRefs(x.ledger,s.evidenceRefs,{careerYear:2}).evidenceCount>0);}});
test('shared training source traces to completed camp and candidate refs',()=>{const x=lineage[2],e=x.ledger.evidence.find(e=>e.evidenceType==='sharedTrainingContext');assert(e&&e.completed);assert(x.camp.sources.some(s=>s.sourceType==='sharedTrainingContextCamp'&&s.evidenceRefs.includes(e.evidenceId)));});
test('development exchange has its own completed event authority',()=>assert(lineage[3].ledger.evidence.some(e=>e.evidenceType==='developmentExchange'&&e.completed)));
test('camp source reference union resolves to ledger',()=>{for(const x of lineage)for(const s of x.camp.sources)assert(T.inspectRefs(x.ledger,s.evidenceRefs,{careerYear:2}).evidenceCount>0);});
test('coachNetwork candidate retains exact coach evidence ref',()=>{const windows=careers.flatMap(c=>c.windows);const refs=windows.flatMap(w=>w.candidates).filter(c=>c.provenance?.networkEvidenceRef).map(c=>c.provenance.networkEvidenceRef);assert(refs.length);assert(refs.every(id=>ledgers.some(l=>l.evidence.some(e=>e.evidenceId===id&&e.evidenceType==='coachSchoolConnection'))));});
test('competition encounters remain completed competition facts',()=>assert(ledgers.every(l=>l.evidence.some(e=>e.evidenceType==='competitionEncounter'&&e.matchOrigin==='officialCompetition'))));
test('source age is not producer current year',()=>{const x=lineage[0],s=x.friendly.sources.find(s=>s.producerType==='returnVisitProducer');assert.strictEqual(s.careerYear,2);assert.deepStrictEqual(s.provenance.originCareerYears,[1]);});
test('same-year positions come from the completed schedule',()=>{for(const c of careers)for(const w of c.windows){assert.strictEqual(w.schedule.careerYear,w.year);assert.strictEqual(w.schedule.seasonPhase,w.phase);assert.strictEqual(w.schedule.sequence,w.sequence);}});
test('player reputation is real persisted scalar, not school reputation',()=>{run('var priorReputation=player.reputation;applyCareerEffects({reputation:2});var reputationAfter=player.reputation;var reputationReload=normalizeSave(JSON.parse(JSON.stringify(player)));');assert.strictEqual(run('reputationAfter'),run('priorReputation')+2);assert.strictEqual(run('reputationReload.reputation'),run('reputationAfter'));});
test('audited existing production JS remains identical to baseline',()=>{
  // The completed audit protects its measured behavior, not a ban on later standalone modules.
  const files=cp.execFileSync('git',['ls-tree','--name-only','758e963'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>f.endsWith('.js'));
  for(const f of files)assert.strictEqual(fs.readFileSync(f,'utf8').replace(/\r\n?/g,'\n'),cp.execFileSync('git',['show','758e963:'+f],{encoding:'utf8'}).replace(/\r\n?/g,'\n'),f);
});
test('selection v2 probability v1 and 3/2/1 unchanged from baseline',()=>{for(const f of ['high-school-opportunity-selection.js','high-school-opportunity-probability.js','high-school-friendly-invitation-producer.js','high-school-training-camp-producer.js','save.js'])assert.strictEqual(fs.readFileSync(f,'utf8').replace(/\r\n?/g,'\n'),cp.execFileSync('git',['show','758e963:'+f],{encoding:'utf8'}).replace(/\r\n?/g,'\n'));});
const report={tests:passed,careers:4,matches:20,
 boundaries:json('temporalBoundaries').map(b=>({year:b.year,evidenceCount:b.before.evidence.length,beforeDigest:T.signature(b.before),afterDigest:T.signature(b.after)})),
 evidenceByType:Object.fromEntries(T.TYPES.map(type=>{const e=[...ledgers,...lineage.map(x=>x.ledger)].flatMap(l=>l.evidence).find(e=>e.evidenceType===type);return [type,e||null];})),
 lineage:lineage.map(x=>({type:x.type,evidenceTypes:[...new Set(x.ledger.evidence.map(e=>e.evidenceType))],friendlySourceTypes:[...new Set(x.friendly.sources.map(s=>s.producerType))],campSourceTypes:[...new Set(x.camp.sources.map(s=>s.sourceType))],reloadPreserved:true})),
 checks:careers.map(c=>c.checks),classifications:T.classifications};
console.log('FEASIBILITY_JSON='+JSON.stringify(report));
console.log(`${passed}/${passed} PASS`);
