"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const env=JSON.parse(fs.readFileSync(process.env.HEALTH_OPPORTUNITY_ENV||path.join(__dirname,'environment.json'))),spec=JSON.parse(fs.readFileSync(path.join(__dirname,'spec.json')));
const output=process.argv[2];if(!output||!/^formal-[\w-]+\.json$/.test(output)||fs.existsSync(path.join(__dirname,output)))throw Error('New formal-*.json name required');
const rows=[],observations=[],sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
function test(name,fn){try{const detail=fn();rows.push({name,status:'PASS',...(detail?{detail}:{})});}catch(e){rows.push({name,status:'FAIL',error:e.stack});}console.log(name+': '+rows.at(-1).status);}
function context(label){const h=require(path.join(env[label],'tests/high-school-career-test-context.js')).makeContext();h.run(`
 var __hcSeed=1,__hcDraws=0;
 function __hcRandom(){__hcDraws++;__hcSeed=(Math.imul(__hcSeed,1664525)+1013904223)>>>0;return __hcSeed/4294967296;}
 Math.random=__hcRandom;
 function __hcSetup(seed,position="游擊手",direct=false,skill=8,traits=8,trust=8){
  stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;pendingTrainingOutcome=null;isTransitioning=false;
  __hcSeed=seed;__hcDraws=0;pendingHighSchoolMatchSimulationSeed=0;
  player=createRepresentativeHighSchoolEntryFixture("ordinary",seed);player.name="Health opportunity candidate";
  applyCanonicalPositionProfile(player,position,[]);player.schoolInvitationState=createDefaultSchoolInvitationState();
  const set=generateSchoolInvitationSet(player,{generationSeed:"health-opportunity-"+seed});finalizeSchoolInvitationSelection(player,set.invitations[0].schoolId);
  materializeSelectedHighSchoolRoster(player,{rosterRole:"bench",playerPosition:position});
  // The representative fixture is already at Y1 step 5. Re-enter through the
  // supported entry owner so this study actually visits the earlier choices.
  player.chapter="青少棒階段小結";player.age=15;completeHighSchoolEntry({source:"health-opportunity-review"});
  Object.keys(player.baseballSkills).forEach(k=>player.baseballSkills[k]=skill);
  ["ballSense","observe","fitness","instinct","discipline"].forEach(k=>player[k]=traits);player.relationships.coachTrust=trust;
  Object.assign(player.body,{fatigue:0,pain:0,injuryRisk:0});
  player.flags=player.flags.filter(f=>f!=="direct_start_history");if(direct)player.flags.push("direct_start_history");
 }
 function __hcStep(){const m=player.highSchoolMatch;
  if(pendingYouthSeasonOutcome){continueYouthSeasonOutcome();return;}
  if(isHighSchoolMatchDecisionVisible(m)){const cs=getHighSchoolYearOneMatchMomentChoices(m),c=cs.find(x=>x.matchDecision==="contactSwing")||cs.find(x=>x.matchDecision==="zone")||cs.find(x=>x.matchDecision==="secure")||cs[0];
   if(!c||!chooseHighSchoolYearOneMatchMoment(c.matchDecision,c.matchMomentId,__hcRandom))throw Error("Legal decision rejected");
  }else advanceHighSchoolMatchPlaybackStep(m);
 }
 `);return h;}
function choose(h,event,index=0){assert.equal(h.run('getCurrentEventId()'),event);h.run(`choose(${JSON.stringify(event)},${index});`);h.flushTransitions();h.run('stopHighSchoolMatchPlayback();');}
function setup(label,seed,position='游擊手',direct=false,profile=null){const h=context(label);h.run(`__hcSetup(${seed},${JSON.stringify(position)},${direct}${profile?','+[profile.skill,profile.traits,profile.coachTrust].join(','):''});`);for(const e of ['high_school_intro','high_school_load','high_school_life','high_school_role'])choose(h,e);assert.equal(h.run('getCurrentEventId()'),'high_school_long_bench');return h;}
function body(h,b){h.run(`Object.assign(player.body,${JSON.stringify(b)});`);}
function snapshot(h){return h.json('({opportunity:player.highSchoolMatch.gameExposureState.opportunitySnapshot,simulationSeed:player.highSchoolMatch.simulationSeed,draws:__hcDraws,body:player.body,history:player.highSchoolOpportunityHistory})');}
function identity(s){const o=s.opportunity;return {matchId:o.matchId,decisionId:o.decisionId,opportunitySeed:o.opportunitySeed,stableVariationSeed:o.stableVariationSeed??null,variation:o.debug.scoreBreakdown.deterministicVariation,hash:o.debug.opportunityHash,simulationSeed:s.simulationSeed};}
function nonHealth(o){const x=JSON.parse(JSON.stringify(o));delete x.debug.scoreBreakdown.healthReadiness;delete x.debug.opportunityScore;for(const k of ['startingOpportunity','startingDecision','appearancePlan','substitutionOpportunity','plannedUsage'])delete x[k];return x;}
function withoutHealthMetadata(o){const x=JSON.parse(JSON.stringify(o));delete x.debug.scoreBreakdown.healthReadiness;return x;}
function healthCheck(h){const s=snapshot(h),b=s.body,expected=-Math.round(.45*b.fatigue+.8*b.pain+.35*b.injuryRisk)||0;assert.equal(s.opportunity.debug.scoreBreakdown.healthReadiness,expected);return {fatigue:b.fatigue,pain:b.pain,injuryRisk:b.injuryRisk,healthReadiness:expected};}
function finish(h){let ticks=0;while(!h.run('player.highSchoolMatch.completed')&&ticks++<3000)h.run('__hcStep();');assert(h.run('player.highSchoolMatch.completed'),'Full match timeout');h.run('MatchGameRecord.assertIntegrity(player.highSchoolMatch.gameRecord);assertHighSchoolMatchStateIntegrity(player.highSchoolMatch,"health-opportunity-review");');return h.json('({record:player.highSchoolMatch.gameRecord,exposure:player.highSchoolMatch.gameExposureState,simulationSeed:player.highSchoolMatch.simulationSeed})');}
function toCallHome(h){finish(h);h.run('showHighSchoolCompletedMatchOutcome(player.highSchoolMatch);continueYouthSeasonOutcome();stopHighSchoolMatchPlayback();');assert.equal(h.run('getCurrentEventId()'),'high_school_call_home');}
function saved(h){h.run('saveGame();');assert(h.storage.has('baseballLifeRpgSave'));return {storage:[...h.storage],rng:h.json('({seed:__hcSeed,draws:__hcDraws})')};}
function load(label,s){const h=context(label);for(const [k,v]of s.storage)h.storage.set(k,v);h.run('loadGame();stopHighSchoolMatchPlayback();');assert.match(h.nodes.get('changeLog')?.innerHTML||'',/讀取/);h.run(`__hcSeed=${s.rng.seed};__hcDraws=${s.rng.draws};`);return h;}
function lockedReads(h,event){const before=snapshot(h),beforeHistory=h.json('player.highSchoolOpportunityHistory');
 // Pure display text/model reads, then original prepare/read/render paths.
 const whole=h.run('JSON.stringify(player)');h.run('if(player.highSchoolNextOpportunity)getHighSchoolFollowupEvaluationPresentation();getHighSchoolYearOneMatchPresentation(player.highSchoolMatch);');assert.equal(h.run('JSON.stringify(player)'),whole,'Display getter mutated player');
 h.run('showCurrentEvent();showCurrentEvent();stopHighSchoolMatchPlayback();prepareCurrentHighSchoolYearOneMatch();');
 assert.deepEqual(snapshot(h).opportunity,before.opportunity);assert.deepEqual(identity(snapshot(h)),identity(before));assert.deepEqual(h.json('player.highSchoolOpportunityHistory'),beforeHistory);assert.equal(h.run('__hcDraws'),before.draws);
 const prior=h.run('JSON.stringify(player)');h.run(`choose(${JSON.stringify(event)},2);`);assert.equal(h.run('JSON.stringify(player)'),prior,'Duplicate old confirmation accepted');
 body(h,{fatigue:20,pain:20,injuryRisk:20});h.run('showCurrentEvent();stopHighSchoolMatchPlayback();prepareCurrentHighSchoolYearOneMatch();');assert.deepEqual(snapshot(h).opportunity,before.opportunity);assert.deepEqual(identity(snapshot(h)),identity(before));
 return {displayPlayerReadOnly:true,redrawNoRefresh:true,duplicateChoiceRejected:true,afterLockBodyChangeFrozen:true,randomDrawDelta:h.run('__hcDraws')-before.draws};
}
for(const seed of spec.seeds){
 test(`zero baseline parity ${seed}`,()=>{const b=setup('baseline',seed),c=setup('candidate',seed);choose(b,'high_school_long_bench',2);choose(c,'high_school_long_bench',2);const bs=snapshot(b),cs=snapshot(c);healthCheck(c);assert.deepEqual(identity(cs),identity(bs));assert.deepEqual(withoutHealthMetadata(cs.opportunity),bs.opportunity);assert.deepEqual(cs.opportunity.plannedUsage,bs.opportunity.plannedUsage);assert.equal(cs.draws,bs.draws);const br=finish(b),cr=finish(c);assert.deepEqual(cr.record,br.record);const entry={seed,identity:identity(cs),plan:cs.opportunity.plannedUsage,recordHash:sha(cr.record),healthMetadataOnly:true};observations.push({kind:'zero-first',...entry});
  toCallHome(b);toCallHome(c);assert.deepEqual(c.json('player.highSchoolNextOpportunity'),b.json('player.highSchoolNextOpportunity'));choose(b,'high_school_call_home');choose(c,'high_school_call_home');const bn=snapshot(b),cn=snapshot(c);assert.deepEqual(identity(cn),identity(bn));assert.deepEqual(withoutHealthMetadata(cn.opportunity),bn.opportunity);assert.deepEqual(cn.opportunity.plannedUsage,bn.opportunity.plannedUsage);assert.equal(cn.draws,bn.draws);const b2=finish(b),c2=finish(c);assert.deepEqual(c2.record,b2.record);observations.push({kind:'zero-followup',seed,identity:identity(cn),plan:cn.opportunity.plannedUsage,recordHash:sha(c2.record),healthMetadataOnly:true});return {firstRecordParity:true,followupRecordParity:true,identityAndRngParity:true};});
 test(`health-only paired first and followup ${seed}`,()=>{
  const zero=setup('candidate',seed);choose(zero,'high_school_long_bench',2);const zs=snapshot(zero);toCallHome(zero);const parent=saved(zero),preview=zero.json('player.highSchoolNextOpportunity');const pairs=[];
  for(const [name,b]of Object.entries(spec.normalBodies)){
   const first=setup('candidate',seed);body(first,b);choose(first,'high_school_long_bench',2);const s=snapshot(first),health=healthCheck(first);assert.deepEqual(identity(s),identity(zs));assert.deepEqual(nonHealth(s.opportunity),nonHealth(zs.opportunity));assert.equal(s.draws,zs.draws);const r=finish(first);
   const n=load('candidate',parent);body(n,b);choose(n,'high_school_call_home');const ns=snapshot(n),nh=healthCheck(n);assert.equal(ns.opportunity.decisionId,preview.decisionId);assert.equal(ns.opportunity.opportunitySeed,preview.opportunitySeed);assert.equal(ns.opportunity.debug.opportunityHash,preview.debug.opportunityHash);assert.deepEqual(nonHealth(ns.opportunity),nonHealth(preview));assert.equal(ns.simulationSeed,n.run('createHighSchoolMatchSimulationSeedFromIdentity(player.highSchoolNextOpportunity.decisionId)'));const nr=finish(n);
   pairs.push({name,first:{health,identity:identity(s),plan:s.opportunity.plannedUsage,recordHash:sha(r.record),PA:r.exposure.plateAppearances,defensiveInnings:r.exposure.defensiveInnings},followup:{health:nh,identity:identity(ns),plan:ns.opportunity.plannedUsage,recordHash:sha(nr.record),PA:nr.exposure.plateAppearances,defensiveInnings:nr.exposure.defensiveInnings}});
  }
  for(const stage of ['first','followup']){assert(pairs[1][stage].health.healthReadiness<=pairs[0][stage].health.healthReadiness);assert(pairs[2][stage].health.healthReadiness<=pairs[1][stage].health.healthReadiness);for(const p of pairs)assert.deepEqual(p[stage].identity,pairs[0][stage].identity);}
  observations.push({kind:'health-pairs',seed,pairs});return {pairedNonHealthInputsEqual:true,identityFrozen:true,healthDirection:true};
 });
}
for(const seed of spec.seeds)test(`lower readiness profile ${seed}`,()=>{
 const profile=spec.boundaryProfile,base=setup('baseline',seed,'游擊手',false,profile),zero=setup('candidate',seed,'游擊手',false,profile),limited=setup('candidate',seed,'游擊手',false,profile);
 body(limited,profile.body);for(const h of [base,zero,limited])choose(h,'high_school_long_bench',2);
 const bs=snapshot(base),zs=snapshot(zero),ls=snapshot(limited);assert.deepEqual(withoutHealthMetadata(zs.opportunity),bs.opportunity);assert.deepEqual(identity(ls),identity(zs));assert.deepEqual(nonHealth(ls.opportunity),nonHealth(zs.opportunity));assert.equal(ls.draws,zs.draws);healthCheck(limited);
 const br=finish(base),zr=finish(zero),lr=finish(limited);assert.deepEqual(zr.record,br.record);
 const reference=setup('candidate',seed,'游擊手',false,profile);choose(reference,'high_school_long_bench',2);toCallHome(reference);const parent=saved(reference),preview=reference.json('player.highSchoolNextOpportunity');const followups=[];
 for(const b of [spec.normalBodies.zero,profile.body]){const h=load('candidate',parent);body(h,b);choose(h,'high_school_call_home');const s=snapshot(h);assert.deepEqual(nonHealth(s.opportunity),nonHealth(preview));healthCheck(h);const r=finish(h);followups.push({identity:identity(s),score:s.opportunity.debug.opportunityScore,plan:s.opportunity.plannedUsage,PA:r.exposure.plateAppearances,defensiveInnings:r.exposure.defensiveInnings,recordHash:sha(r.record)});}
 assert.deepEqual(followups[0].identity,followups[1].identity);
 const detail={kind:'lower-readiness',seed,role:zs.opportunity.actualRole,first:[{score:zs.opportunity.debug.opportunityScore,plan:zs.opportunity.plannedUsage,PA:zr.exposure.plateAppearances,recordHash:sha(zr.record)},{score:ls.opportunity.debug.opportunityScore,plan:ls.opportunity.plannedUsage,PA:lr.exposure.plateAppearances,recordHash:sha(lr.record)}],followups};observations.push(detail);return {healthOnlyScoreDelta:ls.opportunity.debug.opportunityScore-zs.opportunity.debug.opportunityScore,usageChanged:JSON.stringify(ls.opportunity.plannedUsage)!==JSON.stringify(zs.opportunity.plannedUsage),followupUsageChanged:JSON.stringify(followups[0].plan)!==JSON.stringify(followups[1].plan)};
});
test('first recovery and confirmation Save/Load',()=>{
 const h=context('candidate');h.run(`__hcSetup(${spec.seeds[0]});`);choose(h,'high_school_intro');choose(h,'high_school_load');body(h,{fatigue:8,pain:0,injuryRisk:0});choose(h,'high_school_life',0);assert.equal(h.run('player.body.fatigue'),7);choose(h,'high_school_role');const pre=saved(h),restored=load('candidate',pre);choose(h,'high_school_long_bench',2);choose(restored,'high_school_long_bench',2);assert.equal(h.run('player.body.fatigue'),6);assert.deepEqual(snapshot(restored),snapshot(h));const health=healthCheck(h);const post=saved(h),postLoaded=load('candidate',post);assert.deepEqual(snapshot(postLoaded).opportunity,snapshot(h).opportunity);const lock=lockedReads(postLoaded,'high_school_long_bench');const a=finish(h),b=finish(restored);assert.deepEqual(b.record,a.record);const afterBody=finish(postLoaded);assert.deepEqual(afterBody.record,a.record,'Body after lock changed execution record');return {health,preAndPostLoadParity:true,...lock};
});
test('N+1 preview/read, changed body before confirmation, Save/Load and dedup',()=>{
 const h=setup('candidate',spec.seeds[0]);choose(h,'high_school_long_bench',2);toCallHome(h);const preview=h.json('player.highSchoolNextOpportunity'),before=h.run('JSON.stringify(player)');h.run('getHighSchoolCallHomePresentation();getHighSchoolFollowupEvaluationPresentation();');assert.equal(h.run('JSON.stringify(player)'),before);body(h,{fatigue:8,pain:0,injuryRisk:0});
 // No Y1 recovery choice exists between Match 1 and N+1. This controlled body
 // delta exercises timing only and is not reported as a player recovery action.
 body(h,{fatigue:6,pain:0,injuryRisk:0});const pre=saved(h),loaded=load('candidate',pre);choose(h,'high_school_call_home');choose(loaded,'high_school_call_home');assert.deepEqual(snapshot(loaded),snapshot(h));const health=healthCheck(h);assert.equal(health.fatigue,6);assert.equal(h.run('player.highSchoolNextOpportunity.decisionId'),preview.decisionId);const after=saved(h),reloaded=load('candidate',after);assert.deepEqual(snapshot(reloaded).opportunity,snapshot(h).opportunity);const lock=lockedReads(reloaded,'high_school_call_home');const a=finish(h),b=finish(loaded),c=finish(reloaded);assert.deepEqual(b.record,a.record);assert.deepEqual(c.record,a.record);const count=h.run('player.highSchoolCompetitionEvaluation.sampleCount');h.run('applyHighSchoolCompetitionMatchSettlement(player.highSchoolMatch);applyHighSchoolCompetitionMatchSettlement(player.highSchoolMatch);');assert.equal(h.run('player.highSchoolCompetitionEvaluation.sampleCount'),count);const history=h.json('player.highSchoolOpportunityHistory');assert.equal(new Set(history.map(x=>x.opportunityId)).size,history.length);return {previewPlayerReadOnly:true,health,preAndPostLoadParity:true,opportunityIdsUnique:true,evaluationIdempotent:true,...lock};
});
for(const [name,pos,direct] of [['Direct Start','游擊手',true],['pitcher deferred','投手',false],['Direct Start pitcher deferred','投手',true]])test(name+' separate baseline comparison',()=>{
 const records=[];for(const label of ['baseline','candidate']){const h=setup(label,spec.seeds[0],pos,direct);body(h,spec.normalBodies.burden);choose(h,'high_school_long_bench',2);const s=snapshot(h),r=finish(h);records.push({identity:identity(s),plan:s.opportunity.plannedUsage,source:s.opportunity.exposureSource,deferred:s.opportunity.pitcherExposureDeferred,record:r.record,PA:r.exposure.plateAppearances,defensiveInnings:r.exposure.defensiveInnings});}
 assert.deepEqual(records[1],records[0]);if(pos==='投手'){assert.equal(records[1].plan.appearanceType,'noAppearance');assert.equal(records[1].PA,0);assert.equal(records[1].defensiveInnings,0);}else{assert.equal(records[1].plan.appearanceType,'start');assert.equal(records[1].source,'direct-start-forced');}observations.push({kind:name,plan:records[1].plan,identity:records[1].identity,PA:records[1].PA,defensiveInnings:records[1].defensiveInnings,recordHash:sha(records[1].record)});return {baselineRecordParity:true,originalPolicy:true};
});
test('explicit Direct Start full-match bypass retains default prepare contract',()=>{
 const values=[];for(const label of ['baseline','candidate']){const h=setup(label,spec.seeds[0],'游擊手',true);body(h,spec.normalBodies.burden);h.run('player.highSchoolStep=5;prepareHighSchoolYearOneMatch();');const s=snapshot(h);assert(!Object.hasOwn(s.opportunity.debug.scoreBreakdown,'healthReadiness'));const r=finish(h);values.push({opportunity:s.opportunity,identity:identity(s),record:r.record});}assert.deepEqual(values[1],values[0]);return {explicitOptInBypass:true,baselineRecordParity:true};
});
const result={base:env.base,node:process.version,spec,entry:'Supported canonical high-school entry fixture; original choose/transition/prepare/playback/settlement and index.html modules. Not a childhood-to-entry run.',rng:'External deterministic test RNG state restored explicitly across fresh VM load; not a new production Save field.',rows,observations};
fs.writeFileSync(path.join(__dirname,output),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:rows.filter(x=>x.status==='PASS').length,failed:rows.filter(x=>x.status==='FAIL').map(x=>({name:x.name,error:x.error}))}));if(rows.some(x=>x.status==='FAIL'))process.exitCode=1;
