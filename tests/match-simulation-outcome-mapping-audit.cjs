/* Architecture audit only. Production modules and RNG implementations are loaded unchanged. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const Plate=require('../offensive-plate-approach.js'),Physical=require('../batted-ball-physical.js');
const Sequence=require('../pitch-sequencing.js'),Record=require('../match-game-record.js');
const Foundation=require('../high-school-competition-foundation.js'),Evidence=require('../high-school-competition-evidence.js');
const Core=require('./ability-performance-correlation-audit.cjs');
const root=path.resolve(__dirname,'..'),clone=x=>JSON.parse(JSON.stringify(x)),tiers=[8,10,12,14,16];
function source(file){return fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n?/g,'\n');}
function section(file,name){const s=source(file),start=s.indexOf(`function ${name}(`);assert(start>=0,`${file}:${name}`);const next=s.indexOf('\nfunction ',start+1);const nested=s.indexOf('\n  function ',start+1);const ends=[next,nested].filter(n=>n>start);return s.slice(start,ends.length?Math.min(...ends):s.length);}
function reference(file,name){const s=source(file),token=`function ${name}(`,offset=s.indexOf(token);assert(offset>=0,token);return {module:file,function:name,line:s.slice(0,offset).split('\n').length,sourceHash:crypto.createHash('sha256').update(section(file,name)).digest('hex')};}
function powerProof(expectedResolved=false){
  const state=Plate.createPlateAppearanceState({paIdentity:'mapping-power-fixed',approach:'balancedAttack',context:{outs:0,hasRunner:false}});
  const pitch={attackability:0.8,pitchLocationClass:'hitterPitch',strike:true},recognition={correct:true};
  const abilities={batting:12,power:12,ballSense:10};
  const options={physicalRolls:{contactQuality:0.8,ballType:0.8,pace:0.55,direction:0.5,depth:0.6},outcomeRoll:0.5};
  const before=JSON.stringify({state,pitch,recognition,abilities,options});
  const rows=tiers.map(power=>{const view={...abilities,power};const r=Plate.resolveFairContactBallInPlay(state,pitch,view,recognition,options);return {power,abilities:view,physical:r.physicalTruth,mapping:expectedResolved ? Plate.resolveLegacyBallInPlayOutcome(state,pitch,view,recognition,r.physicalTruth,options.outcomeRoll) : r.outcome,...(expectedResolved ? {currentMapping:r.outcome} : {})};});
  assert.equal(JSON.stringify({state,pitch,recognition,abilities,options}),before);
  assert(new Set(rows.map(r=>r.physical.pace+'|'+r.physical.depth)).size>1);
  assert.equal(new Set(rows.map(r=>r.physical.executionEvidence.continuousContactScore)).size,1);
  rows.forEach(r=>assert.deepEqual(r.mapping,rows[0].mapping));
  // Reverse control: exact same physical object, change only the mapper's explicit outcome roll.
  const fixed=rows[2].physical;
  const reverse=[0,1].map(roll=>({roll,...Plate.resolveLegacyBallInPlayOutcome(state,pitch,abilities,recognition,fixed,roll)}));
  assert.notEqual(reverse[0].result,reverse[1].result);
  const contactOnly=clone(fixed);contactOnly.executionEvidence.continuousContactScore=0.1;
  const scoreProbe=Plate.resolveLegacyBallInPlayOutcome(state,pitch,abilities,recognition,contactOnly,0.5);
  assert.notEqual(scoreProbe.result,rows[2].mapping.result);
  return {rows,reverse,scoreProbe,shared:{state,pitch,recognition,options},inputsUnchanged:true,
    interpretation:'Pure Power changes real pace/depth with constant contact score, identity and roll; entire terminal adapter object stays equal. Reverse roll test holds the complete physical object fixed. Score probe is a diagnostic counterfactual, not a newly admitted gameplay truth.'};
}
function interactiveProof(){
  let example=null;
  for(let seed=1;seed<=300&&!example;seed++){
    const rows=tiers.map(control=>{const runtime=Sequence.createPitcherRuntimeState({control});const state=Plate.createPlateAppearanceState({paIdentity:`mapping-control-${seed}`,pitcherRuntime:runtime});const before=JSON.stringify(state);const pitch=Plate.generatePitchOpportunity(state);assert.equal(JSON.stringify(state),before);return {control,pitch};});
    assert.equal(new Set(rows.map(r=>r.pitch.intendedPitchClass)).size,1);
    if(new Set(rows.map(r=>r.pitch.strike)).size>1)example={seed,rows};
  }
  assert(example,'Control must affect actual realization, not only a debug scalar');
  function countResult(pitchClass,count){let s=Plate.createPlateAppearanceState({paIdentity:`mapping-count-${pitchClass}`});for(let i=0;i<count;i++)s=Plate.resolveNextPitch(s,{batting:12,power:12},{pitch:{pitchLocationClass:pitchClass},decisionRoute:'take'}).state;return s;}
  const walk=countResult('clearBall',4),strikeout=countResult('competitiveStrike',3);
  assert.equal(walk.result,'walk');assert.equal(strikeout.result,'strikeout');
  return {control:example,walk:{result:walk.result,balls:walk.balls,pitches:walk.pitchHistory.map(p=>p.pitchResult)},strikeout:{result:strikeout.result,strikes:strikeout.strikes,pitches:strikeout.pitchHistory.map(p=>p.pitchResult)}};
}
function ordinaryProof(){
  const h=Core.createHarness('投手'),base=clone(h.base),ctx=h.ctx;
  const fn=section('script.js','resolveSimulatedHighSchoolPlateAppearance');
  const marker='  const before =',end=fn.indexOf(marker);assert(end>0);
  const prefix=fn.slice(0,end).replace('function resolveSimulatedHighSchoolPlateAppearance(','function mappingTrace(');
  // Evaluate the exact production prefix in a disposable VM. Never replace the real resolver.
  ctx.run(prefix+'return {capability,pitcherCapability,...outcome.trace,result};\n}');
  const moduleSource=source('ai-plate-appearance-outcome.js');
  assert(fn.includes('AIPlateAppearanceOutcome.resolveCompressedPlateAppearanceOutcome'));
  const outcomeLine=moduleSource.split('\n').find(l=>l.includes('const preStrikeoutResult ='));
  const outcomes=[...require('../ai-plate-appearance-outcome.js').RESULTS];
  const expressions={adapter:fn,module:moduleSource};
  function reset(control,seed){
    const fixture=clone(base);fixture.highSchoolMatch.simulationSeed=seed;
    const m=fixture.highSchoolMatch,p=m.rosters[m.defenseTeam].lineup.find(p=>p.defensivePosition==='P');assert(p);
    p.pitchingProfile={...p.pitchingProfile,control:control/2}; // Actual roster source used by interactive runtime (x2).
    ctx.context.mappingFixture=fixture;ctx.run('player=JSON.parse(JSON.stringify(mappingFixture));');return {fixture,pitcher:p};
  }
  const perTier=tiers.map(control=>{
    const rows=[];
    for(let seed=1;seed<=32;seed++){
      const {fixture,pitcher}=reset(control,seed),capBefore=JSON.stringify(fixture.baseballSkills);
      const trace=ctx.json('mappingTrace(player.highSchoolMatch)');assert(trace);
      const tracedCursor=ctx.json('player.highSchoolMatch.simulationCursor');
      reset(control,seed);
      const actual=ctx.json('resolveSimulatedHighSchoolPlateAppearance(player.highSchoolMatch)');
      assert.equal(actual.result,trace.result);assert.equal(ctx.json('player.highSchoolMatch.simulationCursor'),tracedCursor);
      assert.equal(JSON.stringify(ctx.json('player.baseballSkills')),capBefore);
      ctx.run('MatchGameRecord.assertIntegrity(player.highSchoolMatch.gameRecord)');
      rows.push({seed,...trace,cursor:tracedCursor});
      assert.equal(pitcher.pitchingProfile.control,control/2);
    }
    return {control,rosterControl:control/2,rows};
  });
  perTier.forEach(t=>t.rows.forEach((row,i)=>{const first=perTier[0].rows[i];assert.deepEqual(row.capability,first.capability);assert.deepEqual(row.pitcherCapability,first.pitcherCapability);assert.equal(row.adjusted,first.adjusted);assert.equal(row.strikeoutRoll,first.strikeoutRoll);assert.equal(row.pitcherControl,t.rosterControl);}));
  // Vary the existing aggregate pitching input, not Control, to prove the generic signal is connected.
  const quality=[];
  for(const pitching of [4,8]){reset(12,1);ctx.run(`getCurrentHighSchoolMatchDefender(player.highSchoolMatch,player.highSchoolMatch.defenseTeam,"投手").pitching=${pitching}`);quality.push({pitching,trace:ctx.json('mappingTrace(player.highSchoolMatch,()=>0.9)')});}
  assert(quality[1].trace.pitcherPressure>quality[0].trace.pitcherPressure);
  assert(quality[1].trace.adjusted<quality[0].trace.adjusted);
  assert.equal(JSON.stringify(h.base),JSON.stringify(base));
  return {outcomes,outcomeLine,expressions,tiers:perTier.map(t=>({control:t.control,rosterControl:t.rosterControl,comparedPA:t.rows.length,firstTrace:t.rows[0],resultCounts:t.rows.reduce((a,r)=>(a[r.result]=(a[r.result]||0)+1,a),{}),genericScoreIdentical:true})),quality,
    comparisonCount:160,nativeRngCursorParity:true,capabilityInputUnchanged:true,baseFixtureUnchanged:true,
    source:reference('script.js','resolveSimulatedHighSchoolPlateAppearance'),
    note:'Current adapter directly consumes canonical active NPC pitcher profile.control 4–8; tier labels 8–16 remain the historical interactive x2 comparison labels. No player P admission manufactured. Trace prefix and untouched full resolver start from separate identical VM copies, consume the same native RNG draw and agree. Match event mutations are expected only inside disposable VM copies.'};
}
function ledgerProof(){
  const rosters={home:{lineup:[{id:'batter',defensivePosition:'SS'}]},away:{lineup:[{id:'pitcher',defensivePosition:'P'}]}};
  const record=Record.createGameRecord({gameId:'mapping-ledger-contract',homeTeamId:'school-a',awayTeamId:'opponent',rosters});
  const results=['single','double','triple','homeRun','walk','strikeout'];
  results.forEach((result,i)=>Record.recordEvent(record,{eventId:`mapping-ledger-${i}`,sequence:i+1,type:'plateAppearance',inning:i+1,half:'下',offenseTeam:'home',batterId:'batter',result,before:{outs:0},after:{outs:result==='strikeout'?1:0}}, {rosters}));
  Record.assertIntegrity(record);Record.finalizeGameRecord(record,{inningsPlayed:7});Record.assertIntegrity(record);
  const b=record.playerLines.batter.batting,p=record.playerLines.pitcher.pitching;
  assert.deepEqual([b.PA,b.AB,b.H,b.doubles,b.triples,b.HR,b.BB,b.SO],[6,5,4,1,1,1,1,1]);
  assert.deepEqual([p.BF,p.H,p.HR,p.BB,p.SO],[6,4,1,1,1]);
  const projections=[];
  for(const [playerId,teamId,position] of [['batter','school-a','SS'],['pitcher','opponent','P']]){
    const player={age:17,schoolStage:'high_school',available:true,primaryPosition:position};
    Foundation.assignPrimarySchool(player,{teamId,organizationId:teamId,teamType:'school'});
    Foundation.registerDefinition(player,{competitionId:'mapping-series',competitionType:'school_tournament',entryUnit:'school',level:'high_school'});
    Foundation.registerEdition(player,{editionId:'mapping-2031',competitionId:'mapping-series',seasonYear:2031});
    const entry=Foundation.enterCompetition(player,{competitionEditionId:'mapping-2031',teamId});
    Foundation.recordParticipation(player,{playerId,competitionEditionId:entry.competitionEditionId,teamId,rosterStatus:'active_roster',participationStatus:'appeared'});
    Evidence.restorePlayer(player);
    const match={id:record.gameId,completed:true,gameRecord:record,position,role:'starter'};
    const before=JSON.stringify(record);
    const integrated=Evidence.integrateMatchEvidence(player,{playerId,competitionEntryId:entry.entryId,teamId,match,position,role:'starter'});
    assert.equal(JSON.stringify(record),before);
    const evidence=integrated.records.find(r=>r.evidenceLayer==='fullGameProduction'&&r.evidenceType===(position==='P'?'pitching':'offense'));
    assert(evidence);assert.deepEqual(evidence.performance.stats,position==='P'?p:b);Evidence.assertIntegrity(player);
    projections.push({playerId,type:evidence.evidenceType,sample:evidence.sample,stats:evidence.performance.stats});
  }
  return {results,batting:b,pitching:p,totalBases:b.H+b.doubles+2*b.triples+3*b.HR,evidence:projections,integrity:true,
    scope:'Synthetic event ingestion contract fixture, following existing full-game evidence test convention. Not a simulated completed match, not a player exposure claim; R/RBI and inning completion are outside this probe.'};
}
function architecture(r){
  const layer=(id,module,fn,input,output,authority,consumesSignal,informationLost)=>({id,...reference(module,fn),input,output,authority,consumesSignal,informationLost});
  r.canonicalLayerMap=[
    layer('capabilitySource','team-roster-foundation.js','createGeneratedPlayer','team prior, position, generation RNG','roster contact/power/pitching; pitchingProfile.effectiveness/control/stuff','CANONICAL_TRUTH',true,'Control and stuff share a generation prior with pitching, but are separately sampled, not components of pitching.'),
    layer('capabilityResolver','script.js','getHighSchoolOffensivePlateApproachAbilities','admitted player skills and getOffensiveSimulationCapability','batting, derived power, observe, ballSense, baseballIQ, bats','DERIVED_TRUTH',true,'Player power is rounded (batting + fitness + instinct)/3; not an independent raw player field.'),
    layer('tactical','pitch-sequencing.js','createPitchDecision','runtime control/process; count, frozen tactical distribution, identity','intended class, realized class, debug trace','DERIVED_TRUTH',true,'Pitch choice categories compress intent; debugTrace is a PROJECTION, not another outcome authority.'),
    layer('pitchPhysical','offensive-plate-approach.js','generatePitchOpportunity','sequencing decision / tactical call and pitch identity','class, strike, attackability, quality, type, velocity, movement, location, zone','CANONICAL_TRUTH',true,'Type/velocity/movement are identity-derived profile details; not proof that roster stuff is wired. Without runtime uses compatibility fallback.'),
    layer('contact','batted-ball-physical.js','resolveContactQuality','batting/20, attackability, recognition.correct, swingIntent, contactQuality roll','contactQuality and continuous score','DERIVED_TRUTH',false,'No Power input here; contact is intentionally separate from damage. Contact/no-contact happens earlier in PlateApproach.'),
    layer('battedBall','batted-ball-physical.js','resolveBattedBallPhysicalTruth','actual pitch, recognition, fair contact, batting, power, handedness, namespaced rolls','version, identity, contactQuality, ballType, pace, direction, depth, executionEvidence','CANONICAL_TRUTH',true,'Categorical ballType/pace/depth; no landing coordinates, launch angle, carry distance, fence-crossing or park geometry fields.'),
    layer('defense','defensive-opportunity-foundation.js','resolveDefensiveOpportunity','physicalTruth and activeRoster','primary defender and responsibility topology','DERIVED_TRUTH',true,'Responsibility feeds reach/secure/throw/runner settlement; does not by itself adjudicate hit value or HR.'),
    layer('statisticalMapping','offensive-plate-approach.js','resolveLegacyBallInPlayOutcome','continuousContactScore or fallback quality; swingIntent; outcome roll; runner/outs context','out/productiveOut/single/double/triple/homeRun','LEGACY_ADAPTER',false,'Drops ballType, pace, depth, direction, paceScore, depthScore, defense and park; reads contact score only from physical truth.'),
    layer('matchEvent','script.js','recordHighSchoolMatchSimulationEvent','settled event and active roster','simulationLog entry plus recordEvent call','CANONICAL_TRUTH',true,'Canonical settled gameplay event authority; presentationSnapshot is PROJECTION. Ingestion does not validate physics-to-outcome consistency.'),
    layer('gameRecord','match-game-record.js','recordPlateAppearance','terminal event.result, batter, active pitcher, outs delta','batting and pitching official counters','PROJECTION',true,'Canonical statistical ledger derived from events; cannot recover physical information missing upstream. TB is audit-derived, not a native counter.'),
    layer('competitionEvidence','high-school-competition-evidence.js','integrateFullGameProductionEvidence','final GameRecord, appeared participation and competition entry','fullGameProduction stats clone and performance value','PROJECTION',true,'Raw stats retained exactly; weighted value is a derived evaluation projection, not outcome production.')
  ];
  const byId=id=>r.canonicalLayerMap.find(l=>l.id===id);
  r.paths=[
    {id:'power',capability:'Power',expectedMetric:'HR / XBH / TB',severity:'P1',classification:'MAPPING_GAP',architectureFlag:'DUAL_TRUTH_CONFLICT',layers:['capabilitySource','capabilityResolver','contact','battedBall','statisticalMapping','matchEvent','gameRecord','competitionEvidence'].map(byId),firstBrokenBoundary:reference('offensive-plate-approach.js','resolveLegacyBallInPlayOutcome'),evidence:'power.rows + power.reverse + power.scoreProbe + ledger; physical object and terminal adapter are independently authoritative in their domains with no consistency reconciliation.',recommendedRepairBoundary:'Batted-ball outcome mapping after defense/context resolution; preserve physical truth and settle a single official result. No coefficient proposal.'},
    {id:'control',capability:'Pitch Control',expectedMetric:'ordinary AI BB/BF',severity:'P1',classification:'MISSING_INPUT_PATH',layers:[byId('capabilitySource'),layer('runtime','script.js','ensureHighSchoolPitcherRuntimeState','away active pitcher.pitchingProfile.control','runtime.control = clamp(rosterControl * 2, 1, 20), fallback 8','DERIVED_TRUTH',true,'Interactive branch only; ordinary AI does not call this runtime.'),byId('tactical'),byId('pitchPhysical'),layer('compressedAI','script.js','resolveSimulatedHighSchoolPlateAppearance','batter composite, pitcher.pitching, defender decision, runners/outs/score, RNG','one terminal result','LEGACY_ADAPTER',false,'Neither control/profile.control nor pitch execution enters adjusted score; no Control coefficient to calibrate.'),byId('matchEvent'),byId('gameRecord'),byId('competitionEvidence')],firstBrokenBoundary:reference('script.js','resolveSimulatedHighSchoolPlateAppearance'),evidence:'ordinary.tiers, exact production expressions, 160 direct resolver comparisons; interactive.control contrasts actual realization.',recommendedRepairBoundary:'Separate AI PA compressed execution/outcome contract consuming admitted Control; preserve native draw ownership and final BB accounting.'},
    {id:'strikeout',capability:'Pitch Quality / Stuff',expectedMetric:'ordinary AI SO/BF',severity:'P1',classification:'OUTCOME_SPACE_GAP',architectureFlag:'OUTCOME_SPACE_DIVERGENCE',layers:[byId('capabilitySource'),layer('ordinaryOutcomeSpace','script.js','resolveSimulatedHighSchoolPlateAppearance','pitching and defensive decision pressure against offense quality','seven results with no strikeout','LEGACY_ADAPTER',true,'Generic pitching affects matchup/run prevention. Separate roster stuff is not read; no per-pitch execution or SO producer.'),byId('matchEvent'),byId('gameRecord'),byId('competitionEvidence')],firstBrokenBoundary:reference('script.js','resolveSimulatedHighSchoolPlateAppearance'),evidence:'ordinary.outcomes from production source + interactive.strikeout + ledger pitcher/batter SO preservation; ordinary.quality shows existing aggregate pitching effect.',recommendedRepairBoundary:'AI PA outcome-space construction, distinct from batted-ball mapper. Distinguish aggregate pitching, Control and Stuff before wiring new outcomes.'}
  ];
  r.sharedOutcomeMatrix=[...['walk','strikeout','single','double','triple','homeRun','out','productiveOut'].map(outcome=>({outcome,interactive:true,ordinaryAI:r.ordinary.outcomes.includes(outcome),sharedDownstream:'applyHighSchoolSimulatedPlateAppearance → PA event → MatchGameRecord → FullGameProductionEvidence',semanticParity:outcome==='strikeout'?'NO: producer missing':'terminal token compatible; upstream resolution differs'})),
    {outcome:'battedBallPhysicalTruth',interactive:true,ordinaryAI:false,sharedDownstream:'Detailed defense has separate physical interfaces; generic AI skips them',semanticParity:'NO physical parity'},
    {outcome:'pitchPhysicalTruth',interactive:true,ordinaryAI:false,sharedDownstream:'No ordinary AI pitch-level object',semanticParity:'Different resolution; must not imply observed pitch facts'}];
  r.legacyAdapters=[reference('offensive-plate-approach.js','resolveLegacyBallInPlayOutcome'),reference('script.js','resolveHighSchoolLineDriveCatchOpportunity'),reference('script.js','resolveHighSchoolFlyBallCatchOpportunity'),reference('batted-ball-ground-defense.js','derivePACompatibilityResult')];
  r.compatibilityFallbacks=[{...reference('offensive-plate-approach.js','generatePitchOpportunity'),condition:'No pitcherRuntime / sequencing',result:'legacyCompatibilityFallback identity-generated pitch class/quality'},
    {...reference('offensive-plate-approach.js','resolveLegacyBallInPlayOutcome'),condition:'No finite continuousContactScore',result:'attackability + batting/ballSense proxy + swingIntent + recognition'},
    {...reference('script.js','ensureHighSchoolPitcherRuntimeState'),condition:'No finite roster profile control',result:'runtime Control 8'},
    {...reference('offensive-plate-approach.js','resolveNextPitch'),condition:'Absolute pitch safety cap',result:'forced fair contact through existing mapper; not ordinary AI SO construction'}];
  r.mapperConsumption={primary:['physicalTruth.executionEvidence.continuousContactScore','state.swingIntent','outcomeRoll OR deterministicUnit(paIdentity, bip-outcome|pitchNumber+1)','state.context.hasRunner/outs'],fallback:['pitch.attackability','abilities.batting','abilities.ballSense','recognition.correct','state.swingIntent'],contactScoreInputs:['abilities.batting / 20','actualPitch.attackability','recognition.correct','swingIntent','identity + contactQuality RNG roll'],notConsumed:['power directly','pace','depth','ballType','direction','paceScore','depthScore','defense','park']};
  r.controlComposite={ordinaryRosterDecision:'round((defense + contact)/2)',ordinaryPlayerDecision:'round((baseballIQ + observe + discipline)/3)',pitcherPressure:'(2 * (pitcher.pitching || 5) + decision) * .004',generation:'pitching/control/stuff sampled separately using common team prior; statistical covariance is not a causal Control input path',walkInterval:'0.58 <= adjusted < 0.69',probability:'Interval probability under native RNG after shift/clamp, not universally a fixed 11% walk rate. With uniform sample it is length of [0.58-offset,0.69-offset) intersect [0,1); native RNG has 997-state support.',teamStrength:'No direct scalar read in resolver; roster generation embeds team prior.',tactics:'Only runner occupancy, two outs and trailing score; no pitch/catcher tactical execution consumed.'};
  r.secondary=[{id:'steal',classification:'OUTCOME_SPACE_GAP',severity:'P1',scope:'classification only; ledger SB/CS ingestion exists, no production execution producer located'},
    {id:'arm',classification:'QUANTIZATION_PLATEAU',severity:'P2',scope:'continuous arm → strength quality → throwQuality → categorical timing delay; no threshold changes'},
    {id:'playerP',classification:'BLOCKED_BY_EXPOSURE',scope:'preserved; no change to playing-time-game-exposure.js, no credited BF'},
    {id:'catcher',classification:'NOT_OBSERVABLE',decisionClassification:'DECISION_ONLY_OBSERVABLE',scope:'no new catcher statistic producer'}];
  r.secondaryReferences=[reference('defensive-decision-throw-foundation.js','resolveThrow'),reference('defensive-runner-throw-settlement-foundation.js','resolveTiming'),reference('match-game-record.js','recordRunnerEvent')];
  r.blockers=[];
  r.recommendation={split:true,boundaries:['A. Batted-Ball Outcome Mapping: physical + defense + context → official BIP outcome','B. AI Plate Appearance Outcome Expansion: compressed execution inputs including Control; compatible BB/SO/BIP outcomes'],reason:'Different authority boundaries. Control and AI SO may share B if its compressed execution contract is explicit; do not merge B with physical/defensive BIP adjudication merely to reduce sprint count.',calibration:'Only after architecture repair; no calibration numbers proposed',started:false};
  return r;
}
function run(options={}){const r=architecture({baseline:'35ba350',power:powerProof(options.expectedResolved),interactive:interactiveProof(),ordinary:ordinaryProof(),ledger:ledgerProof()}); if(options.expectedResolved){assert(r.power.rows.every(row=>row.currentMapping.authority==='physicalOutcomeMappingV1'));r.mode='historicalRootCauseWithResolvedNormalRoute';r.paths[0].historicalClassification=r.paths[0].classification;r.paths[0].classification='CONNECTED';r.paths[0].firstBrokenBoundary=null; for(const path of r.paths.slice(1)){path.historicalClassification=path.classification;path.classification='CONNECTED';path.firstBrokenBoundary=null;}r.sharedOutcomeMatrix.find(row=>row.outcome==='strikeout').semanticParity='canonical terminal semantics; compressed provenance';r.currentAI={authority:require('../ai-plate-appearance-outcome.js').AUTHORITY,controlSource:'active pitcher.pitchingProfile.control (raw roster scalar)',strikeout:'plain out subclassification'};} return r;}
module.exports={source,section,reference,powerProof,interactiveProof,ordinaryProof,ledgerProof,architecture,run};
if(require.main===module){const result=run();fs.writeFileSync(path.join(root,'docs/match-simulation-outcome-mapping-audit-results.json'),JSON.stringify(result,null,2)+'\n');console.log('Mapping diagnostics PASS');}
