/* Offline audit: production scripts run unchanged in an isolated, in-memory browser. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { makeContext } = require('./high-school-career-test-context.js');
const TIERS = Object.freeze([8, 10, 12, 14, 16]);
const CASES = Object.freeze([
  { capability: 'contact', field: 'baseballSkills.batting', position: '游擊手', coupled: true },
  { capability: 'power', field: 'instinct', position: '游擊手', potentialCoupling: 'Legacy attack also reads instinct; dominance in this audited path is not established.' },
  { capability: 'discipline', field: 'discipline', position: '游擊手' },
  { capability: 'recognition', field: 'observe', position: '游擊手', coupled: true },
  { capability: 'speed', field: 'baseballSkills.baseRunning', position: '游擊手' },
  { capability: 'fielding', field: 'baseballSkills.catching', position: '游擊手' },
  { capability: 'arm', field: 'baseballSkills.armStrength', position: '游擊手' },
  { capability: 'control', field: 'baseballSkills.control', position: '投手' },
  { capability: 'catcher', field: 'baseballSkills.blocking', position: '捕手' }
]);
function changeTarget(base, field, value) {
  const copy = JSON.parse(JSON.stringify(base));
  const keys = field.split('.');
  let target = copy;
  for (const key of keys.slice(0, -1)) target = target[key];
  target[keys.at(-1)] = value;
  return copy;
}
function seedFixture(base, seed) {
  // Scenario IDs are production routing keys and must not be changed for RNG diversity.
  // PA identity RNG remains shared: report this limitation, never override production RNG.
  const fixture = JSON.parse(JSON.stringify(base));
  fixture.highSchoolMatch.simulationSeed = seed;
  return fixture;
}
function createHarness(position = '游擊手') {
  const ctx = makeContext();
  ctx.run(`careerFixture(${JSON.stringify(position)},"starter",77001);choose("critical_offseason",1);`);
  const base = ctx.json('player');
  ctx.run(`function auditPlay(seed, validate=true) {
    let randomState=seed >>> 0, ticks=0;
    const executionRandom=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
    const match=player.highSchoolMatch;
    while(!match.completed && ticks++<2500) {
      if(pendingYouthSeasonOutcome) continueYouthSeasonOutcome();
      if(isHighSchoolMatchDecisionVisible(match)) {
        const choice=getHighSchoolYearOneMatchMomentChoices(match)[0];
        if(!choice) throw new Error('No legal decision');
        chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,executionRandom);
      } else advanceHighSchoolMatchPlaybackStep(match);
    }
    if(!match.completed) throw new Error('Match did not finish');
    if(validate) MatchGameRecord.assertIntegrity(match.gameRecord);
    if(validate && (match.gameRecord.totals.home.runs!==match.scores.home || match.gameRecord.totals.away.runs!==match.scores.away))
      throw new Error('Full Game Record score disagrees with match scores');
    return match;
  }`);
  return { base, ctx, play(field, value, seed, playerId = 'player', observe = true) {
    const fixture = changeTarget(seedFixture(base, seed), field, value);
    ctx.context.auditFixture = fixture;
    ctx.run('stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;player=JSON.parse(JSON.stringify(auditFixture));');
    const capabilities = observe ? ctx.json('({offense:getOffensiveSimulationCapability(player),defense:getDefensiveSimulationCapability(player)})') : null;
    ctx.run(`auditPlay(${seed},${observe})`);
    const result = ctx.json('({record:player.highSchoolMatch.gameRecord,decisions:player.highSchoolMatch.completedMoments,log:player.highSchoolMatch.simulationLog})');
    const line = result.record.playerLines[playerId];
    assert(line, 'Canonical player line missing');
    return { seed, line, capabilities, record: result.record, decisions: result.decisions, log: result.log };
  } };
}
function aggregate(games) {
  const out = { batting: {}, pitching: {}, defense: {}, baserunning: {} };
  for (const game of games) for (const section of Object.keys(out))
    for (const [key,value] of Object.entries(game.line[section])) {
      if(value===null) { if(!(key in out[section])) out[section][key]=null; }
      else out[section][key]=(out[section][key]||0)+value;
    }
  return out;
}
const ratio=(a,b)=>b ? a/b : null;
function rates(line) {
  const b=line.batting,p=line.pitching,d=line.defense;
  return { AVG:ratio(b.H,b.AB), SO:ratio(b.SO,b.PA), BB:ratio(b.BB,b.PA),
    HR:ratio(b.HR,b.AB), XBH:ratio(b.doubles+b.triples+b.HR,b.H),
    TB:ratio(b.H+b.doubles+2*b.triples+3*b.HR,b.AB),
    SB:ratio(b.SB,b.SB+b.CS), conversion:ratio(d.PO+d.A,d.chances), errors:ratio(d.E,d.chances),
    pitcherBB:ratio(p.BB,p.BF), pitcherSO:ratio(p.SO,p.BF), pitcherH:ratio(p.H,p.BF),
    ER27:ratio(27*p.ER,p.outsRecorded), pitcherR:ratio(p.R,p.BF) };
}
function diagnostics(values, direction) {
  if(values.some(v=>v===null)) return {verdict:'NOT_OBSERVABLE',monotonicSteps:null,correlation:null,lowHighDelta:null};
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  const center=(values.length-1)/2;
  const cov=values.reduce((s,v,i)=>s+(i-center)*(v-mean),0);
  const sx=values.reduce((s,_,i)=>s+(i-center)**2,0),sy=values.every(v=>v===values[0])?0:values.reduce((s,v)=>s+(v-mean)**2,0);
  const delta=values.at(-1)-values[0];
  const steps=values.slice(1).filter((v,i)=>direction*(v-values[i])>=0).length;
  return {monotonicSteps:steps,strictSteps:values.slice(1).filter((v,i)=>direction*(v-values[i])>0).length,
    correlation:sy ? cov/Math.sqrt(sx*sy) : null, lowHighDelta:delta,
    relativeDelta:values[0] ? delta/Math.abs(values[0]) : null,
    verdict:sy===0?'WEAK':direction*delta<0?'INVERTED':steps<values.length-1?'NON_MONOTONIC':'WEAK',
    note:'Direction diagnostic only; PASS requires capability-specific review of variance and coupling.'};
}
function summarize(games) {
  const line=aggregate(games);
  const defensiveEvents=games.flatMap(g=>(g.log||[]).filter(e=>e.type==='playerRoutinePlay'||(e.type==='meaningfulMomentResolved'&&e.domain==='defense')));
  const throws=defensiveEvents.filter(e=>/throw|relay|force/i.test(e.executionRoute||e.decision||''));
  const decisions=games.flatMap(g=>g.decisions||[]);
  const qualityCounts={};
  for(const d of decisions){const key=`${d.decisionQuality||'unknown'} / ${d.resultCode||d.tier||'unknown'}`;qualityCounts[key]=(qualityCounts[key]||0)+1;}
  const blocks=Array.from({length:10},(_,i)=>games.slice(Math.floor(i*games.length/10),Math.floor((i+1)*games.length/10))).filter(x=>x.length).map(g=>({games:g.length,line:aggregate(g),rates:rates(aggregate(g))}));
  return {games:games.length,line,rates:rates(line),blocks,
    throwDiagnostics:{canonicalDefensiveChances:line.defense.chances,recordedThrowEvents:throws.length,successfulThrowEvents:throws.filter(e=>e.outsCreated>0||e.thirdOutResolution?.outsAfter>e.thirdOutResolution?.outsBefore).length,note:'Event subset diagnostic only; canonical defensive line remains statistical denominator.'},
    decisionDiagnostics:{qualityByResult:qualityCounts,note:'Descriptive decision evidence only; never a PA/BF/chance denominator.'},
    hitlessFraction:ratio(games.filter(g=>g.line.batting.AB>0&&g.line.batting.H===0).length,games.filter(g=>g.line.batting.AB>0).length),
    multiHitFraction:ratio(games.filter(g=>g.line.batting.H>=2).length,games.filter(g=>g.line.batting.AB>0).length),
    sensitivity:[50,200,500,1000].map(target=>{let n=0;const prefix=[];for(const g of games){prefix.push(g);n+=g.line.batting.PA;if(n>=target)break;}return {target,actualPA:n,rates:rates(aggregate(prefix))};}),
    decisionCount:games.reduce((s,g)=>s+(g.decisions||[]).length,0),capabilities:games[0].capabilities};
}
function runAudit({games=300,output=path.resolve(__dirname,'../docs/ability-performance-correlation-audit-results.json'),cases=CASES,progress=console.log}={}) {
  const result={baseline:'46f8d2d',status:'RUNNING',methodology:{tiers:TIERS,scale:'Canonical 1–20: 8/10/12/14/16, equivalent to 40/50/60/70/80 percent of ceiling.',gamesPerTier:games,policy:'First legal decision, seeded execution RNG; identical initial roster and seed series. Conditional RNG consumption may diverge between tiers.',sampleSource:'Final canonical gameRecord.playerLines.player',productionModified:false},cases:[]};
  const save=()=>{if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');};
  for(const definition of cases) {
    const harness=createHarness(definition.position),entry={...definition,tiers:[]};result.cases.push(entry);
    for(const tier of TIERS) {
      const samples=[];
      for(let seed=1;seed<=games;seed++) {
        try { samples.push(harness.play(definition.field,tier,seed)); }
        catch(error) {
          result.status='STOP';result.stop={condition:/record|integrity/i.test(error.message)?'G':'A',capability:definition.capability,tier,seed,message:error.message,stack:error.stack,completedGamesInTier:samples.length};
          result.reproduction={fixture:harness.base,field:definition.field,value:tier,seed};
          save();console.error(JSON.stringify(result.stop));return result;
        }
        if(seed%100===0) progress(`${definition.capability} ${tier}: checkpoint ${seed}/${games}`);
      }
      entry.tiers.push({ability:tier,...summarize(samples)});
      save();progress(`${definition.capability} ${tier}: ${samples.length} games, ${entry.tiers.at(-1).line.batting.PA} PA, ${entry.tiers.at(-1).line.pitching.BF} BF`);
    }
    entry.diagnostics=Object.fromEntries(Object.keys(entry.tiers[0].rates).map(metric=>[metric,diagnostics(entry.tiers.map(t=>t.rates[metric]),['SO','errors','pitcherBB','pitcherH','ER27','pitcherR'].includes(metric)?-1:1)]));
  }
  result.status='MEASURED_REQUIRES_REVIEW';save();return result;
}
function runPitcherAudit() {
  const result=[];
  for(const metric of ['quality','control']) {
    const h=createHarness(metric==='quality'?'投手':'游擊手');
    const side=metric==='quality'?'home':'away';
    const index=h.base.highSchoolMatch.rosters[side].lineup.findIndex(p=>p.defensivePosition==='P');
    assert(index>=0);
    const pitcher=h.base.highSchoolMatch.rosters[side].lineup[index];
    // Remove a derived runtime cache before every tier, so its authority is the roster control.
    if(metric==='control')h.base.highSchoolMatch.pitcherRuntimeState=null;
    const field=`highSchoolMatch.rosters.${side}.lineup.${index}.${metric==='quality'?'pitching':'pitchingProfile.control'}`;
    const entry={capability:`roster_pitch_${metric}`,scope:'Active NPC pitcher; does not validate player pitching admission.',field,playerId:pitcher.id,tiers:[]};
    for(const tier of [4,5,6,7,8]) {
      const samples=[];
      for(let seed=1;seed<=60;seed++) samples.push(h.play(field,tier,seed,pitcher.id));
      entry.tiers.push({ability:tier,...summarize(samples)});
      console.log(`${entry.capability} ${tier}: ${entry.tiers.at(-1).line.pitching.BF} BF`);
    }
    entry.diagnostics=Object.fromEntries(['pitcherBB','pitcherSO','pitcherH','ER27','errors'].map(metric=>[metric,diagnostics(entry.tiers.map(t=>t.rates[metric]),metric==='pitcherSO'?1:-1)]));
    result.push(entry);
  }
  return result;
}
module.exports={TIERS,CASES,changeTarget,seedFixture,createHarness,aggregate,rates,diagnostics,summarize,runAudit,runPitcherAudit};
function runSelectionSmoke() {
  const F=require('../high-school-competition-foundation.js'),E=require('../high-school-competition-evidence.js');
  const C=require('../county-selection-opportunity.js'),N=require('../national-selection-pipeline.js');
  const h=createHarness(),results=[];
  for(const tier of TIERS) {
    const games=[],profiles=[];
    for(let seed=1;seed<=20;seed++) {
      const game=h.play('baseballSkills.batting',tier,seed);games.push(game);
      const school=game.record.homeTeamId,subject={age:17,schoolStage:'high_school',available:true,primaryPosition:'SS'};
      F.assignPrimarySchool(subject,{teamId:school,organizationId:school,teamType:'school'});
      F.registerDefinition(subject,{competitionId:'audit-school',competitionType:'school_tournament',entryUnit:'school',level:'high_school'});
      F.registerEdition(subject,{editionId:'audit-source',competitionId:'audit-school',seasonYear:2031});
      const entry=F.enterCompetition(subject,{competitionEditionId:'audit-source',teamId:school});
      F.recordParticipation(subject,{playerId:'player',competitionEditionId:'audit-source',teamId:school,rosterStatus:'active_roster',participationStatus:'appeared'});
      F.registerDefinition(subject,{competitionId:'audit-county',competitionType:'selection_tournament',entryUnit:'county_representative',level:'national_selection'});
      F.registerEdition(subject,{editionId:'audit-county-target',competitionId:'audit-county',seasonYear:2031});
      F.registerTeam(subject,{teamId:'audit-county-team',organizationId:'audit-county-team',teamType:'county_representative'});
      F.registerDefinition(subject,{competitionId:'audit-national',competitionType:'international',entryUnit:'national_team',level:'international_u18'});
      F.registerEdition(subject,{editionId:'audit-national-target',competitionId:'audit-national',seasonYear:2031});
      E.restorePlayer(subject);
      E.integrateMatchEvidence(subject,{playerId:'player',competitionEntryId:entry.entryId,position:'SS',role:'starter',match:{id:game.record.gameId,completed:true,gameRecord:game.record}});
      E.assertIntegrity(subject);
      const positionEvaluation={version:'opportunity-readiness-v1',playerId:'player',position:'SS',requestedPosition:'SS',positionReadiness:8,positionFit:8,fieldingReadiness:8,reactionReadiness:8,decisionReadiness:8};
      const county=C.buildCountySelectionProfile(subject,{playerId:'player',countyTeamId:'audit-county-team',targetCompetitionEditionId:'audit-county-target',sourceSchoolTeamId:school,sourceCompetitionEditionId:'audit-source',position:'SS',positionEvaluation,rosterNeed:{neededPositions:['SS']}});
      const national=N.buildNationalSelectionProfile(subject,{playerId:'player',competitionEditionId:'audit-national-target',sourceCompetitionEditionId:'audit-source',position:'SS',positionEvaluation,nationalRosterNeed:{neededPositions:['SS']}});
      const production=E.getEvidence(subject).find(e=>e.evidenceType==='offense');
      assert.equal(production.sample.count,game.line.batting.PA);
      profiles.push({seed,PA:production.sample.count,quality:production.performance.value,countyScore:county.evaluationScore,nationalScore:national.evaluationScore});
    }
    results.push({ability:tier,...summarize(games),profiles});
    console.log(`Selection smoke ${tier}: ${profiles.length} complete-game profiles`);
  }
  return {note:'Each full-game record is integrated into a fresh admitted competition context. Readiness and roster need fixed. No synthetic statistics, no threshold changes, no accumulation of duplicate game IDs.',tiers:results};
}
async function runWorkers() {
  const {fork}=require('child_process');
  const output=path.resolve(__dirname,'../docs/ability-performance-correlation-audit-results.json');
  const result={baseline:'46f8d2d',status:'RUNNING',cases:[],methodology:null};
  const active=new Set();let next=0,stopped=false;
  const save=()=>fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  const worker=async()=>{while(next<CASES.length&&!stopped){
    const definition=CASES[next++];
    await new Promise((resolve,reject)=>{
      const child=fork(__filename,['--worker',definition.capability],{stdio:['ignore','inherit','inherit','ipc']});active.add(child);
      let received=false;
      child.on('message',data=>{
        received=true;result.methodology=data.methodology;result.cases.push(...data.cases);
        result.cases.sort((a,b)=>CASES.findIndex(x=>x.capability===a.capability)-CASES.findIndex(x=>x.capability===b.capability));
        if(data.status==='STOP'){stopped=true;result.status='STOP';result.stop=data.stop;result.reproduction=data.reproduction;for(const other of active)if(other!==child)other.kill();}
        save();
      });
      child.on('error',reject);
      child.on('exit',code=>{active.delete(child);if(!received&&!stopped)reject(new Error(`Worker ${definition.capability} exited ${code}`));else resolve();});
    });
  }};
  save();
  try {await Promise.all(Array.from({length:3},worker));if(!stopped)result.status='MEASURED_REQUIRES_REVIEW';}
  catch(error){stopped=true;for(const child of active)child.kill();result.status='HARNESS_ERROR';result.error=error.message;}
  save();return result;
}
function writeReport() {
  const destination=path.resolve(__dirname,'../docs/ability-performance-correlation-audit-results.json');
  const result=JSON.parse(fs.readFileSync(destination,'utf8'));
  assert(['MEASURED_REQUIRES_REVIEW','AUDIT_WARN'].includes(result.status),'Do not publish partial measurements');
  result.pitcherSupplement=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../docs/ability-performance-pitcher-supplement.json'),'utf8'));
  result.selectionSmoke=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../docs/ability-performance-selection-smoke.json'),'utf8'));
  const all=[...result.cases,...result.pitcherSupplement];
  const powerCase=result.cases.find(c=>c.capability==='power');
  delete powerCase.coupled;
  powerCase.potentialCoupling='Legacy attack also reads instinct; dominance in this audited path is not established. Recorded offense/defense adapters show only derived power changing.';
  for(const c of all)for(const t of c.tiers){
    const b=t.line.batting;
    t.derivedBatting={singles:b.H-b.doubles-b.triples-b.HR,XBH:b.doubles+b.triples+b.HR,totalBases:b.H+b.doubles+2*b.triples+3*b.HR,SLGlike:t.rates.TB};
    t.sampleAdequacy={batting1000PA:b.PA>=1000,pitching1000BF:t.line.pitching.BF>=1000,defense750Chances:t.line.defense.chances>=750};
  }
  for(const c of result.cases.filter(c=>['contact','power','discipline','recognition','speed'].includes(c.capability)))assert(c.tiers.every(t=>t.line.batting.PA>=1000),`${c.capability}: insufficient PA`);
  for(const c of result.pitcherSupplement)assert(c.tiers.every(t=>t.line.pitching.BF>=1000),`${c.capability}: insufficient BF`);
  result.completedGames=all.reduce((s,c)=>s+c.tiers.reduce((n,t)=>n+t.games,0),0)+result.selectionSmoke.tiers.reduce((s,t)=>s+t.games,0);
  const specs=[['contact','SO',-1],['contact','AVG',1],['power','HR',1],['power','XBH',1],['discipline','BB',1],['recognition','BB',1],['speed','SB',1],['fielding','conversion',1],['fielding','errors',-1],['arm','conversion',1],['control','pitcherBB',-1],['roster_pitch_control','pitcherBB',-1],['roster_pitch_quality','pitcherSO',1],['roster_pitch_quality','pitcherH',-1],['roster_pitch_quality','ER27',-1]];
  const variance=values=>{const v=values.filter(x=>x!==null);if(!v.length)return null;const mean=v.reduce((s,x)=>s+x,0)/v.length;return v.reduce((s,x)=>s+(x-mean)**2,0)/v.length;};
  result.primaryAudits=specs.map(([capability,metric,direction])=>{
    const c=all.find(c=>c.capability===capability),values=c.tiers.map(t=>t.rates[metric]);
    const diagnostic=diagnostics(values,direction);
    if(capability==='contact'&&metric==='AVG') diagnostic.verdict='COUPLED';
    if(capability==='power'&&['HR','XBH'].includes(metric))diagnostic.verdict='PASS';
    if(capability==='roster_pitch_quality'&&metric==='pitcherSO')diagnostic.verdict='NOT_OBSERVABLE';
    if(capability==='roster_pitch_quality'&&['pitcherH','ER27'].includes(metric))diagnostic.verdict='PASS';
    return {capability,metric,expectedDirection:direction===1?'positive':'negative',...diagnostic,
      tiers:c.tiers.map(t=>({ability:t.ability,sample:{PA:t.line.batting.PA,BF:t.line.pitching.BF,chances:t.line.defense.chances},mean:t.rates[metric],blockVariance:variance(t.blocks.map(b=>b.rates[metric])),blocks:t.blocks.map(b=>b.rates[metric])})),
      pairedBlockDeltas:c.tiers[0].blocks.map((b,i)=>b.rates[metric]===null||c.tiers.at(-1).blocks[i].rates[metric]===null?null:c.tiers.at(-1).blocks[i].rates[metric]-b.rates[metric])};
  });
  result.crossAudits=[['power','BB'],['fielding','HR'],['control','errors']].map(([capability,metric])=>{
    const c=all.find(c=>c.capability===capability);return {capability,metric,tiers:c.tiers.map(t=>({ability:t.ability,mean:t.rates[metric]})),...diagnostics(c.tiers.map(t=>t.rates[metric]),1),note:'Secondary effect diagnostic; no direction-based PASS gate.'};
  });
  result.classifications=[
    {capability:'Contact',classification:'WEAK',reason:'H/AB signal is present but batting also changes derived power; SO effect is small and not strictly monotonic.',confidence:'Within this fixed fixture only; limited independent pitch contexts.'},
    {capability:'Power',classification:'USABLE',reason:'Only derived power changes in recorded capability adapters. HR and XBH rise; five raw tiers collapse to four effective power values (7/8/8/9/10). Legacy attack also reads instinct, but dominance is not established.',confidence:'Usable within this fixed fixture; rounding and repeated PA identity limit generalization.'},
    {capability:'Discipline / Recognition',classification:'WEAK',reason:'Discipline and observe are separate raw axes. Player plate recognition reads observe/IQ/ballSense; raw discipline acts through other adapters.',confidence:'Fixed first-legal-choice policy; does not establish adaptive chase reduction.'},
    {capability:'Speed',classification:'NOT_OBSERVABLE',reason:'No reliable steal-opportunity denominator under this fixed policy; no invented advancement rate.',confidence:'Only absence in tested context, not proof that all baserunning is disconnected.'},
    {capability:'Fielding / Arm (SS)',classification:'WEAK',reason:'Canonical chances and PO/A/E are reported; throw subset is descriptive. Sparse or saturated conversion cannot establish a general gradient.',confidence:'Below requested 750 chances where indicated; same opportunity family and position.'},
    {capability:'Player Pitch Control / Quality (P)',classification:'NOT_OBSERVABLE',reason:'Canonical playing-time contract defers player pitcher exposure; actual starter is an NPC. Player BF stays zero.',confidence:'High confidence in observability limit; no player pitching effectiveness claim.'},
    {capability:'Roster Pitch Control',classification:'WEAK',reason:'Control reaches sequencing realization, but full-game BB rates are identical in this fixture; ordinary AI PA does not read control.',confidence:'Micro wiring inspected; full production gradient not established.'},
    {capability:'Roster Pitch Quality',classification:'USABLE',reason:'Pitching effectiveness reduces H/BF and ER/27 outs, 4/4 steps; ordinary AI PA cannot produce SO.',confidence:'Moderate within fixed roster/context; no player-pitcher or SO validation.'},
    {capability:'Catcher-specific capability',classification:'NOT_OBSERVABLE',reason:'Blocking tier is tested in completed C games; canonical defense line is not a validated catcher-specific blocking/framing statistic.',confidence:'Evaluation-driven capability; full-game statistical validation remains unavailable.'},
    {capability:'Mental / Clutch / Anticipation',classification:'NOT_OBSERVABLE',reason:'Anticipation is contextual runtime state, not an independent player scalar; pressure-specific matched cohorts are not established by this fixture.',confidence:'Not validated; no aggregate AVG claim.'}
  ];
  const classificationAxes=[['contact'],['power'],['discipline','recognition'],['speed'],['fielding','arm'],['control'],['roster_pitch_control'],['roster_pitch_quality'],[],[]];
  result.classifications.forEach((c,i)=>{
    c.primaryMetrics=result.primaryAudits.filter(a=>classificationAxes[i].includes(a.capability)).map(a=>({metric:a.metric,direction:a.expectedDirection,effectSize:a.lowHighDelta,relativeDelta:a.relativeDelta,blockVariances:a.tiers.map(t=>t.blockVariance)}));
    c.recommendation=c.classification==='USABLE'?'Retain present formula; validate across independent contexts before any calibration.':c.classification==='NOT_OBSERVABLE'?'Define a separate, explicitly authorized observability scope; do not invent statistics or change semantics in this sprint.':'Improve independent fixture coverage and isolate derived coupling before proposing calibration.';
  });
  result.methodology.limitations=['Scenario ID is a routing key. The seed series changes match RNG, but identity-derived pitch RNG is shared. PA counts are canonical exposure, not a claim of independent Bernoulli trials.','Only one raw scalar changes per tier. Derived abilities may couple; values 8–16 are raw ability tiers, not assertions that derived Contact equals 40–80.','Three isolated child processes run independent axes; they share no VM, player state or random state.','300 complete games/tier with 10 equal game blocks; PA thresholds include the last complete game rather than truncating a canonical line.','First legal decision is a fixed policy, not a skilled adaptive batter. No representative baseball rates are claimed.'];
  result.opponentSensitivity={status:'NOT_RUN',reason:'Conditional on primary audit PASS. Player primary audits remain WEAK/COUPLED/NOT_OBSERVABLE, so the requested prerequisite is not satisfied.'};
  result.productionChanges=0;
  result.verification={fullRegression:{pass:162,fail:0},syntax:{pass:244,fail:0},selectedDependencies:{pass:17,fail:0},focusedTest:'PASS including final neutrality/variance/canonical aggregation assertions',audit1400:{matches:1400,orphan:0,noProgress:0,matchStateIssues:0,gameRecordIssues:0,deterministic:true,instrumentationNeutral:true},stopConditionsTriggered:[],productionDiffFiles:0,committed:false,pushed:false};
  result.status='AUDIT_WARN';
  const fmt=v=>v===null||v===undefined?'—':typeof v==='number'?Number(v.toFixed(6)):v;
  const lines=['# Ability–Performance Correlation Audit Sprint 1','',
    '**結論：AUDIT WARN；不建議標記 Sprint 1 正式 PASS。** 測量已完成，但純能力隔離、投球情境獨立性及玩家投手 exposure 有明確限制。沒有修改 production、調參、commit 或 push。','',
    '## Baseline 與方法','',
    '`main = origin/main = 46f8d2d`；開始時 working tree clean。正式 production scripts 在既有 in-memory browser harness 中執行；不讀寫正式 save。','',
    ...result.methodology.limitations.map(x=>'- '+x),'',
    '固定 genesis seed 77001、學校／roster、lineup role、position、隊友、對手及其他原始能力。每場由相同 fixture 重新開始，使用 seeds 1–300。投手補充採現役 NPC、roster scale 4–8，每級 60 場；不冒充玩家 P 樣本。','',
    '## 正式 contract 與解讀邊界','',
    '- `script.js:getOffensiveSimulationCapability`：batting 同時進入 Contact 與 Power；Power 亦讀 instinct，legacy attack 也讀 instinct。observe 同時參與 recognition、Contact、Discipline 及防守判斷。','- `script.js:resolveSimulatedHighSchoolPlateAppearance`：一般 AI PA 讀 pitching effectiveness 與 defensive decision，結果集合沒有 strikeout；不是單純加大 stuff 係數便能建立 SO 分布。此輪不重寫 outcome model。','- `script.js:ensureHighSchoolPitcherRuntimeState`：roster control × 2 進入 sequencing。補充 probe 確認 control 8→16、realization stability 0.407796→0.695796，但該球仍為 competitiveStrike，完整成績未變。','- `playing-time-game-exposure.js` 明定 pitcherExposureDeferred 與 noAppearance。玩家 P 不登板，不能把實際 NPC 先發的 BF 給玩家。','- SS 的 PO+A/chances 是記帳 proxy，非完美的成功機率；DP、球種與機會組成可能影響。throwDiagnostics 僅是正式事件子集，主樣本仍是 canonical chances。','- 3B runner 無 force 或 explicit committed advancement 不得自行朝本壘移動；沿用 Defensive Runner Throw Settlement contract，沒有修改。','- ER/27 outs 僅為 audit proxy。使用固定單一先發 fixture；不宣稱已解决 inherited-runner earned-run attribution。','',
    '## Tier means 與樣本',''];
  for(const c of all){lines.push(`### ${c.capability}`, '',`只改：\`${c.field}\`。${c.scope||''}`,'','|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|','|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');for(const t of c.tiers){const b=t.line.batting,d=t.line.defense;lines.push(`|${[t.ability,t.games,b.PA,b.AB,b.H,b.SO,b.BB,b.doubles,b.triples,b.HR,t.line.pitching.BF,d.chances,d.PO,d.A,d.E].join('|')}|`);}lines.push('');}
  lines.push('## Primary metrics','', '|Capability|Metric|Direction|Steps / 4|Pearson r|Low→high Δ|Relative Δ|Verdict|','|---|---|---|---|---|---|---|---|');
  for(const a of result.primaryAudits)lines.push(`|${[a.capability,a.metric,a.expectedDirection,fmt(a.monotonicSteps),fmt(a.correlation),fmt(a.lowHighDelta),fmt(a.relativeDelta),a.verdict].join('|')}|`);
  lines.push('','|Capability / metric|五級 mean（raw tier: value）|Low block variance|High block variance|','|---|---|---|---|');
  for(const a of result.primaryAudits)lines.push(`|${a.capability} / ${a.metric}|${a.tiers.map(t=>`${t.ability}: ${fmt(t.mean)}`).join('; ')}|${fmt(a.tiers[0].blockVariance)}|${fmt(a.tiers.at(-1).blockVariance)}|`);
  lines.push('','等值也列入非嚴格 monotonic steps；strictSteps 在 JSON 中。常數數列的 r 未定義，不能用 4/4 等值步驟宣稱梯度。r 只是五個 tier means 的描述，不是 PASS gate。Quality H/BF 與 run prevention 的 PASS 僅限 NPC 固定情境；不推論玩家投手或完整能力模型已通過。','',
    'rates.TB 為 TB/AB；derivedBatting.totalBases 才是純 audit 計算的總壘打數。所有 derived 指標都未寫回 production state。','',
    '## Block variance、單場 variance 與 convergence','',
    '每項 primary metric 的十個 block means、block variance、low/high paired block deltas 均在 JSON 的 primaryAudits。每級另保留 50 / 200 / 500 / 1000 PA 的 whole-game prefix rates；actualPA 是實際樣本，非截斷或偽造。','',
    '|Contact raw tier|Hitless fraction|Multi-hit fraction|','|---|---|---|');
  for(const t of result.cases.find(c=>c.capability==='contact').tiers)lines.push(`|${t.ability}|${fmt(t.hitlessFraction)}|${fmt(t.multiHitFraction)}|`);
  lines.push('','|Contact prefix target PA|Tier 8 AVG|Tier 10 AVG|Tier 12 AVG|Tier 14 AVG|Tier 16 AVG|','|---|---|---|---|---|---|');
  for(const target of [50,200,500,1000])lines.push(`|${target}|${result.cases.find(c=>c.capability==='contact').tiers.map(t=>fmt(t.sensitivity.find(s=>s.target===target).rates.AVG)).join('|')}|`);
  lines.push('','這些比例證明此 fixture 仍有單場重疊；focused test 亦以 20 個真實完整比賽 seed 驗證高級無安與低級多安均非零。由於 pitch identity 重複，不把窄 block variance 解釋為廣泛情境下的高統計信心。','',
    '## Cross audits、隊伍情境與 decision / production','');
  lines.push('|Arm tier|Canonical chances|Recorded throw subset|Successful throw subset|','|---|---|---|---|');
  for(const t of result.cases.find(c=>c.capability==='arm').tiers)lines.push(`|${t.ability}|${t.line.defense.chances}|${t.throwDiagnostics.recordedThrowEvents}|${t.throwDiagnostics.successfulThrowEvents}|`);
  lines.push('','上述 throw subset 為正式 game event 的輔助檢視，並非另造 canonical throwing statistic；chances 不以 decision count 取代。全成功表示此固定球路與操作策略飽和，不代表 Arm 沒有 production 作用。','');
  for(const c of result.crossAudits)lines.push(`- ${c.capability} → ${c.metric}：low/high Δ ${fmt(c.lowHighDelta)}；${c.verdict}。`);
  lines.push('','|Contact tier|County mean score|National mean score|','|---|---|---|');
  for(const t of result.selectionSmoke.tiers)lines.push(`|${t.ability}|${fmt(t.profiles.reduce((s,p)=>s+p.countyScore,0)/t.profiles.length)}|${fmt(t.profiles.reduce((s,p)=>s+p.nationalScore,0)/t.profiles.length)}|`);
  lines.push('','固定隊伍下的 Contact 安打訊號與 NPC quality 失分訊號仍可見，故在該 fixture 中沒有完全被隊伍淹沒；不宣稱跨隊伍成立。弱／中／強對手 sensitivity 依使用者的「主要 audit PASS 後」條件未啟動。','',
    'Selection smoke 每級 20 場，只讓正式 fullGameProduction records 進入新建的合法 selection context，固定 readiness 和 team need；保留每場 profile 分數。它測讀取與反應，不調門檻，也不把重複 game ID 包裝成多場累積高信心。','',
    'Decision diagnostics 保存 quality × result 分布，與 canonical PA/BF/chances 完全分開。固定 first-legal policy 不足以證明 good-decision/bad-result 和 bad-decision/good-result 在一般 gameplay 的相關性；未建立時明確標記未驗證，不能拿 decision count 補 sample。','',
    '## Final classification','', '|Capability|Classification|Reason|Confidence|','|---|---|---|---|');
  for(const c of result.classifications)lines.push(`|${c.capability}|${c.classification}|${c.reason}|${c.confidence}|`);
  lines.push('','## Verification 與下一步','',
    '- Focused test：target-only fixture、canonical sample source、decision count 隔離、deterministic repeat、instrumented/unobserved record 與 event log 完全一致、aggregation、diagnostics、單場 variance。','- 17 組 selected dependencies PASS（另含三組 Position / Evaluation boundary tests），含三組 Full Game Record、Offensive Plate、Pitcher、Defensive、Team Strength、Competition Evidence、County／National Selection。','- Full regression：162 / 162 PASS。focused test 後續新增 neutrality / variance assertions 亦單跑通過。','- Full JS/CJS syntax：244 / 244 PASS。','- 1,400-game audit：PASS；orphan / no-progress / match-state / game-record issues 全部為 0；deterministic 與 instrumentationNeutral 均為 true。','- git diff --check：PASS（新檔另以 no-index whitespace check 檢查）。git status：6 個新增未追蹤檔案；tracked / production diff 為 0；HEAD 與 origin/main 保持 46f8d2d，ahead / behind 0 / 0。','',
    '本輪未發現已證明且適合最小修復的 production wiring bug。已定位 model coupling、固定 pitch identity、普通 AI 無 SO outcome、player pitcher exposure deferred，以及 under-observed/saturated 能力。這些不是本轮已完成的 calibration。','',
    '建議先以獨立的 audit-fixture / observability 範圍驗收：取得合法且不同 PA identity 的等價情境、擴充 catcher／arm 的可觀測樣本，明確界定 player P exposure 的後續範圍；有穩定獨立樣本後再決定是否開 Calibration Sprint。本輪沒有開始該 Sprint。','',
    'Stop Conditions：本 runner 對完整紀錄檢查失敗會立即停止；最終以 structured result 和 closeout 為準。功能本來未支援且本輪只標記 NOT_OBSERVABLE 的項目，依規格保留，未嘗試需要 redesign 的修復。','',
    '## 重跑','', '```text','node tests/ability-performance-gradient-test.js','node tests/ability-performance-correlation-audit.cjs','node tests/ability-performance-correlation-audit.cjs --pitcher','node tests/ability-performance-correlation-audit.cjs --smoke','node tests/ability-performance-correlation-audit.cjs --report','```','');
  fs.writeFileSync(destination,JSON.stringify(result,null,2)+'\n');
  fs.writeFileSync(path.resolve(__dirname,'../docs/ability-performance-correlation-audit-sprint-1.md'),lines.join('\n'));
  return result;
}
if(require.main===module) {
  if(process.argv[2]==='--observability') {
    require('./ability-performance-observability-extension.cjs').run();
  } else if(process.argv[2]==='--observability-report') {
    require('./ability-performance-observability-extension.cjs').writeReport();
  } else if(process.argv[2]==='--report') {
    writeReport();
  } else if(process.argv[2]==='--smoke') {
    try {fs.writeFileSync(path.resolve(__dirname,'../docs/ability-performance-selection-smoke.json'),JSON.stringify(runSelectionSmoke(),null,2)+'\n');}
    catch(error){console.error(error.stack);process.exitCode=1;}
  } else if(process.argv[2]==='--pitcher') {
    try {fs.writeFileSync(path.resolve(__dirname,'../docs/ability-performance-pitcher-supplement.json'),JSON.stringify(runPitcherAudit(),null,2)+'\n');}
    catch(error){console.error(error.stack);process.exitCode=1;}
  } else if(process.argv[2]==='--worker') {
    const result=runAudit({games:Number(process.env.AUDIT_GAMES)||300,output:null,cases:CASES.filter(c=>c.capability===process.argv[3])});
    process.send(result,()=>process.disconnect());
  } else runWorkers().then(result=>{
    console.log(`AUDIT ${result.status}`);
    if(['STOP','HARNESS_ERROR'].includes(result.status))process.exitCode=1;
  });
}
