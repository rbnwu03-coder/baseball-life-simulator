'use strict';
// Sprint 4: writes only this audit's JSON. No production/test writes or Git mutations.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const cp = require('child_process'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const output = path.join(__dirname, 'infield-baseball-logic-audit-evidence.json');
const baseline = 'f16a7f7b2263681788f3846c2e83fbb6f8b0bc53';
const protectedPaths = ['tests/fast-check-smoke-test.cjs', 'install.ps1'];
const labels = {SS:'游擊手', '2B':'二壘手', '3B':'三壘手', '1B':'一壘手'};
const seeds = Array.from({length:200}, (_,i)=>77001+i);
const sha = v => crypto.createHash('sha256').update(v).digest('hex');
const git = args => cp.execFileSync('git', args, {cwd:root,windowsHide:true,encoding:'utf8'}).trimEnd();
const read = file => { if(protectedPaths.includes(file)) throw Error('Protected path'); return fs.readFileSync(file,'utf8'); };
function save(e){fs.writeFileSync(output, JSON.stringify(e,null,2)+'\n');}
function hashSources(){return Object.fromEntries(git(['ls-files']).split(/\r?\n/).filter(f=>!protectedPaths.includes(f)&&(/\.(js|cjs)$/.test(f)||f==='index.html')).map(f=>[f,sha(fs.readFileSync(f))]));}
function context(fixtures=false){
  const c = require('../tests/high-school-career-test-context.js').makeContext();
  if(fixtures) {
    const source=read('tests/first-base-receive-active-ground-production-integration-test.js');
    for(const match of source.matchAll(/\brun\(\x60([\s\S]*?)\x60\);/g)) if(match[1].includes('function firstBaseFixture')||match[1].includes('function firstBaseIncomingBoundary'))c.run(match[1]);
  }
  return c;
}
const observerSource = String.raw`
  var auditObserverOn=false, auditStats;
  function resetAudit(on){auditObserverOn=on;auditStats={rng:0,publicSamples:0,truths:[],physical:{},activeInnings:{}};}
  var auditOriginalRandom=nextHighSchoolMatchSimulationRandom;
  nextHighSchoolMatchSimulationRandom=function(...args){auditStats.rng++;return auditOriginalRandom(...args);};
  var auditOriginalChoice=chooseHighSchoolYearOneMatchMoment;
  chooseHighSchoolYearOneMatchMoment=function(...args){if(typeof args[2]==='function'){const source=args[2];args[2]=function(){auditStats.publicSamples++;return source();};}return auditOriginalChoice(...args);};
  var auditOriginalHandoff=ensureHighSchoolOrdinaryGroundBallInPlayHandoff;
  ensureHighSchoolOrdinaryGroundBallInPlayHandoff=function(m,...args){
    const state=auditOriginalHandoff(m,...args),truth=m.ordinaryDefensivePlateAppearanceState?.battedBallPhysicalTruth;
    if(truth){
      auditStats.truths.push(JSON.parse(JSON.stringify(truth)));
      if(auditObserverOn&&!auditStats.physical[truth.identity]){
        const op=getHighSchoolDefensiveOpportunity(m,truth);
        const actor=m.rosters?.[m.defenseTeam]?.lineup.find(a=>a.id==='player');
        const assignment=actor?TeamRosterFoundation.normalizePosition(actor.position):null;
        auditStats.physical[truth.identity]={identity:truth.identity,inning:m.inning,half:m.half,ballType:truth.ballType,pace:truth.pace,direction:truth.direction,directionRoll:truth.executionEvidence?.rolls?.direction,
          nominalPrimary:op?.primaryPosition||null,primaryActor:op?.primaryDefenderId||null,activePlayerPosition:assignment,
          topology:op?.topologyVersion||null,supported:state?.supported===true,reach:state?.defensiveAccess?.reachResolution?.reached??null,
          reachMargin:state?.defensiveAccess?.reachResolution?.margin??null,incoming:state?.firstBaseContext?.entry==='incomingReceive'};
      }
    }
    return state;
  };
  var auditOriginalPlayback=advanceHighSchoolMatchPlaybackStep;
  advanceHighSchoolMatchPlaybackStep=function(m=player.highSchoolMatch,...args){
    if(auditObserverOn&&!m.completed&&m.half!=='終'&&m.defenseTeam===getHighSchoolPlayerTeamSide(m)&&isHighSchoolMatchPlayerActive(m)){
      const actor=m.rosters[m.defenseTeam]?.lineup.find(a=>a.id==='player');
      if(actor){const p=TeamRosterFoundation.normalizePosition(actor.position);auditStats.activeInnings[m.inning+'|'+m.half]=p;}
    }
    return auditOriginalPlayback(m,...args);
  };
`;
function game(c,position,seed,on){
  const {run,json}=c;
  run('resetAudit('+on+');careerFixture('+JSON.stringify(labels[position])+',"starter",'+seed+');choose("critical_offseason",1);var auditEntry=player.highSchoolMatch.playerLineupStatus;playCareerMatchToEnd();var auditFull=player.highSchoolMatch;');
  const match=json('auditFull'),stats=json('auditStats');
  assert.equal(match.completed,true);assert.equal(match.gameRecord.status,'final');
  assert.deepEqual(match.gameRecord.result.finalScore,match.scores);
  assert.deepEqual(json('getHighSchoolMatchStateIntegrityIssues(auditFull)'),[]);
  assert.deepEqual(json('MatchGameRecord.getIntegrityIssues(auditFull.gameRecord)'),[]);
  const expected=json('normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch');
  run('saveGame();player=createInitialPlayer("audit cold reload");loadGame();');
  const reloaded=json('player.highSchoolMatch');assert.deepEqual(reloaded,expected);
  const events=match.simulationLog,pa=events.filter(e=>e.type==='plateAppearance');
  const physical=Object.values(stats.physical),ground=physical.filter(t=>t.ballType==='groundBall');
  const defense=events.filter(e=>['defensiveResolution','playerRoutinePlay'].includes(e.type)&&e.actionFacts?.physicalIdentity);
  const unique=[...new Map(defense.map(e=>[e.actionFacts.playIdentity,e])).values()];
  const actions=unique.flatMap(e=>e.actionFacts.actions);
  const playerActions=actions.filter(a=>a.actorId==='player');
  const activeEvidence=(match.matchExperience?.evidence||[]).filter(e=>e.evidenceType==='active'&&/^(shortstop|secondBase|thirdBase|firstBase)/.test(e.situation?.playFamily||''));
  const item={position,seed,entryStatus:run('auditEntry'),finalPlayerPosition:match.rosters[getPlayerSide(match)]?.lineup.find(a=>a.id==='player')?.position||null,
    activeDefensiveInnings:Object.keys(stats.activeInnings).length,activePositions:stats.activeInnings,experienceExposure:match.matchExperience.exposure,
    PA:pa.length,resultCounts:count(pa,e=>e.result),bipLikePA:pa.filter(e=>!['walk','strikeout','hitByPitch'].includes(e.result)).length,
    visiblePhysicalBIP:physical.length,ground:ground.length,groundByNominalPrimary:count(ground,e=>e.nominalPrimary),
    legalPrimaryPlayer:ground.filter(t=>t.primaryActor==='player'&&t.nominalPrimary===t.activePlayerPosition).length,
    supportedGround:ground.filter(t=>t.supported).length,incoming:unique.filter(e=>e.firstBaseEvidence?.entry==='incomingReceive').length,
    routine:unique.filter(e=>e.type==='playerRoutinePlay').length,meaningful:unique.filter(e=>e.type==='defensiveResolution').length,
    ordinaryFallbackGround:ground.filter(t=>!t.supported).length,outs:unique.reduce((n,e)=>n+e.outsCreated,0),
    failedSecure:playerActions.filter(a=>a.type==='field'&&a.status==='failed').length,
    failedThrow:playerActions.filter(a=>a.type==='throw'&&a.status==='failed').length,
    failedReceive:playerActions.filter(a=>a.type==='receive'&&a.status==='failed').length,
    playerErrors:unique.filter(e=>e.error).length,teamActionErrors:actions.filter(a=>a.errorCharged).length,
    doublePlays:unique.filter(e=>e.outsCreated===2).length,partialDP:unique.filter(e=>['startDoublePlaySecond','initiate463','initiate543','initiate363'].includes(e.initialRoute||e.routeId)&&e.outsCreated===1).length,
    playerDefense:match.gameRecord.playerLines.player?.defense||null,activeEvaluation:activeEvidence.length,
    rngDraws:stats.rng,publicExecutionSamples:stats.publicSamples,cursor:match.simulationCursor,reloadEqual:true,
    physical,plays:unique.map(e=>({type:e.type,inning:e.inning,physicalIdentity:e.actionFacts.physicalIdentity,playIdentity:e.actionFacts.playIdentity,
      route:e.initialRoute||e.routeId,entry:e.firstBaseEvidence?.entry||'primary',outs:e.outsCreated,runs:e.runsAllowed,cause:e.primaryCause,responsibleActor:e.responsibleActor,
      actionStatuses:e.actionFacts.actions.map(a=>({actor:a.actorPosition,type:a.type,status:a.status,error:a.errorCharged===true})),attribution:e.defensiveAttribution}))};
  return {item,neutral:{rawPhysicalHash:sha(JSON.stringify(stats.truths)),finalMatchHash:sha(JSON.stringify(match)),gameRecordHash:sha(JSON.stringify(match.gameRecord)),
    rngDraws:stats.rng,publicSamples:stats.publicSamples,cursor:match.simulationCursor,reloadHash:sha(JSON.stringify(reloaded))}};
}
function getPlayerSide(match){return match.matchContext?.playerTeamSide||'home';}
function count(rows,key){return rows.reduce((a,row)=>(a[key(row)]=(a[key(row)]||0)+1,a),{});}
function aggregate(rows){
  const keys=['activeDefensiveInnings','PA','bipLikePA','visiblePhysicalBIP','ground','legalPrimaryPlayer','supportedGround','incoming','routine','meaningful','ordinaryFallbackGround','outs','failedSecure','failedThrow','failedReceive','playerErrors','teamActionErrors','doublePlays','partialDP','activeEvaluation'];
  const sums=Object.fromEntries(keys.map(k=>[k,rows.reduce((n,row)=>n+row[k],0)]));
  sums.games=rows.length;sums.groundByNominalPrimary=count(rows.flatMap(row=>row.physical.filter(t=>t.ballType==='groundBall')),t=>t.nominalPrimary);
  sums.entryStatus=count(rows,r=>r.entryStatus);sums.finalPositions=count(rows,r=>r.finalPlayerPosition);
  sums.groundDecisionsPerActiveInning=sums.activeDefensiveInnings?sums.meaningful/sums.activeDefensiveInnings:null;
  sums.groundPAWithoutVisiblePhysicalType=rows.reduce((n,r)=>n+r.bipLikePA-r.visiblePhysicalBIP,0);
  return sums;
}
function rawCase(c,options,route,sample=.8,apply=false){
  const {run,json}=c;
  run('var m=firstBaseIncomingBoundary('+JSON.stringify(options)+',"pending");');
  const choices=json('getHighSchoolDefensiveMomentChoices(m)');
  const chosen=choices.find(v=>v.routeId===route);
  if(!chosen)return {admitted:false,choices:choices.map(v=>v.routeId)};
  run('var auditRaw=resolveInfieldDecision(m.defensiveSituation,'+JSON.stringify(chosen.matchDecision)+',m,'+sample+');');
  const raw=json('auditRaw');
  if(apply){
    run('if(m.activeSituation?.lifecycleState==="presented")beginGroundBallSituationDecision(m,'+JSON.stringify(chosen.matchDecision)+');recordGroundBallSituationResolution(m,auditRaw);applyInfieldResolutionToHighSchoolMatch(m,'+JSON.stringify(chosen.matchDecision)+',auditRaw);');
  }
  return {admitted:true,physicalIdentity:run('m.groundBallInPlayState.physicalTruth.identity'),raw,
    final:apply?json('({outs:m.outs,scores:m.scores,runners:m.runners,record:m.gameRecord,legal:m.lastDefensiveResolution,evidence:MatchExperienceDevelopment.deriveMatchExperienceEvidence(m),matchIssues:getHighSchoolMatchStateIntegrityIssues(m),recordIssues:MatchGameRecord.getIntegrityIssues(m.gameRecord)})'):null};
}
function summarizeRaw(r){if(!r?.admitted)return r;return {admitted:true,physicalIdentity:r.physicalIdentity,route:r.raw.initialRoute||r.raw.routeId,
  result:r.raw.resultCode,outs:r.raw.outsCreated,runs:r.raw.runsAllowed,retirements:r.raw.runnerSettlement.retirements,runnersAfter:r.raw.runnersAfter,
  primaryCause:r.raw.primaryCause,responsibleActor:r.raw.responsibleActor,playerLeg:r.raw.playerLeg,teammateLeg:r.raw.teammateLeg,
  actions:r.raw.actionFacts?.actions,secure:r.raw.firstBaseEvidence?r.raw.firstBaseEvidence.playerLeg:r.raw.thirdBaseEvidence?.playerLeg,
  timing:r.raw.timingResolution,final:r.final?{outs:r.final.outs,scores:r.final.scores,runners:r.final.runners,attribution:r.final.legal.defensiveAttribution,
    legalRuns:r.final.legal.runsAllowed,matchIssues:r.final.matchIssues,recordIssues:r.final.recordIssues,
    playerDefense:r.final.record.playerLines.player?.defense,teamTotals:r.final.record.totals,
    evaluation:r.final.evidence.filter(e=>e.evidenceType==='active').map(e=>({skill:e.skillEvidence.targetSkill,quality:e.executionEvidence.quality,decision:e.decisionEvidence.quality,attribution:e.attribution}))}:null};}
async function main(){
  const phase=process.argv[2]||'init';
  if(phase==='init'){
    if(fs.existsSync(output))throw Error('Audit evidence already exists; use a phase without init');
    assert.equal(git(['branch','--show-current']),'main');assert.equal(git(['rev-parse','HEAD']),baseline);assert.equal(git(['rev-parse','origin/main']),baseline);assert.equal(git(['diff','--cached','--name-only']),'');
    save({baseline,startedAt:new Date().toISOString(),node:process.version,initialStatus:git(['status','--short']),sourceHashes:hashSources(),
      predeclared:{positions:Object.keys(labels),seeds,pilotSeeds:seeds.slice(0,2),gamesPerPosition:200,initialBaseballSkills:12,choiceSample:.62,
        methodology:'Existing careerFixture and canonical playback. No in-match overrides, no forced starter, no extra PA. Physical stream is sampled only where the existing engine exposes it.'}});console.log('INIT audit baseline / cohort declaration saved');return;
  }
  const e=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(git(['rev-parse','HEAD']),baseline);
  assert.deepEqual(hashSources(),e.sourceHashes);
  if(phase==='pilot'){
    e.pilot=[];
    for(const position of Object.keys(labels)){
      const c=context();c.run(observerSource);
      for(const seed of seeds.slice(0,2)){
        const off=game(c,position,seed,false),on=game(c,position,seed,true);
        const equal=JSON.stringify(off.neutral)===JSON.stringify(on.neutral);
        e.pilot.push({position,seed,equal,off:off.neutral,on:on.neutral,observation:on.item});
        console.log('PILOT '+position+' '+seed+' observer neutrality '+equal);
      }
    }
    e.observerNeutral=e.pilot.every(v=>v.equal);save(e);assert.equal(e.observerNeutral,true);return;
  }
  if(phase==='cohort'){
    assert.equal(e.observerNeutral,true);e.cohort={};
    for(const position of Object.keys(labels)){
      const c=context();c.run(observerSource);const rows=[];
      for(const seed of seeds){rows.push(game(c,position,seed,true).item);if(rows.length%25===0)console.log('COHORT '+position+' '+rows.length+'/200');}
      e.cohort[position]={rows,summary:aggregate(rows)};save(e);console.log('COHORT_SUMMARY '+position+' '+JSON.stringify(e.cohort[position].summary));
    }
    e.cohortFinishedAt=new Date().toISOString();save(e);return;
  }
  if(phase==='observer_unwrapped'){
    e.unwrappedObserverBaseline=[];
    for(const row of e.pilot){
      const c=context();c.run('careerFixture('+JSON.stringify(labels[row.position])+',"starter",'+row.seed+');choose("critical_offseason",1);playCareerMatchToEnd();');
      const match=c.json('player.highSchoolMatch');const expected=c.json('normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch');
      c.run('saveGame();player=createInitialPlayer("audit unwrapped cold");loadGame();');
      const reloaded=c.json('player.highSchoolMatch');assert.deepEqual(reloaded,expected);
      const measured={finalMatchHash:sha(JSON.stringify(match)),gameRecordHash:sha(JSON.stringify(match.gameRecord)),cursor:match.simulationCursor,reloadHash:sha(JSON.stringify(reloaded))};
      const allEqual=Object.entries(measured).every(([k,v])=>row.on[k]===v);assert.equal(allEqual,true);
      e.unwrappedObserverBaseline.push({position:row.position,seed:row.seed,allEqual,...measured});
    }
    console.log('UNWRAPPED '+JSON.stringify({games:e.unwrappedObserverBaseline.length,allEqual:e.unwrappedObserverBaseline.every(r=>r.allEqual)}));save(e);return;
  }
  if(phase==='probes'){
    const c=context(true),{run,json}=c;
    e.ruleMatrix=[];e.probeErrors=[];
    const configs={SS:{direction:.1,routes:['secureFirstBaseOut','startDoublePlaySecond','forceSecond','preventRunHome','homeForceOut']},
      '2B':{direction:.9,routes:['secureFirstBaseOut','initiate463','attackLeadRunnerThird','preventRunHome','homeForceOut']},
      '3B':{direction:.005,routes:['secureFirstBaseOut','stepThird','initiate543','preventRunHome','homeForceOut']},
      '1B':{direction:.995,routes:['selfCoverFirst','pitcherCoverFirst','initiate363','forceSecond','homeForceOut']}};
    for(const [position,config]of Object.entries(configs))for(let outs=0;outs<=2;outs++)for(let mask=0;mask<8;mask++)for(const route of config.routes){
      const options={position:labels[position],direction:config.direction,outs,occupiedBases:[0,1,2].filter(i=>mask&(1<<i))};
      try{
        const r=rawCase(c,options,route,.8,true);
        if(!r.admitted){e.ruleMatrix.push({position,outs,mask,route,admitted:false});continue;}
        const checks={outsCapped:r.final.outs<=3,distinctRetirements:new Set(r.raw.runnerSettlement.outRunnerIds).size===r.raw.outsCreated,
          legalBases:new Set(r.final.runners.filter(Boolean)).size===r.final.runners.filter(Boolean).length,
          forceCorrect:r.raw.runnerSettlement.retirements.every(t=>t.outType!=='force'||t.forceStateAtRetirement.forceTargets[t.runnerId]===t.targetBase),
          closedBases:r.final.outs<3||r.final.runners.every(v=>v===null),
          thirdOutRuns:r.final.outs<3||!['force','batterRunnerBeforeFirst'].includes(r.final.legal.thirdOutResolution.thirdOutType)||r.final.legal.runsAllowed===0,
          integrity:r.final.matchIssues.length===0&&r.final.recordIssues.length===0};
        e.ruleMatrix.push({position,outs,mask,route,admitted:true,checks,...summarizeRaw(r)});
      }catch(error){e.probeErrors.push({position,outs,mask,route,error:error.stack});}
    }
    e.ruleMatrixSummary={attempted:480,admitted:e.ruleMatrix.filter(v=>v.admitted).length,notOffered:e.ruleMatrix.filter(v=>!v.admitted).length,errors:e.probeErrors.length,
      violations:e.ruleMatrix.filter(v=>v.admitted&&Object.values(v.checks).some(v=>!v)).map(v=>({position:v.position,outs:v.outs,mask:v.mask,route:v.route,checks:v.checks}))};
    console.log('MATRIX '+JSON.stringify(e.ruleMatrixSummary));save(e);return;
  }
  if(phase==='targeted'){
    const c=context(true),{run,json}=c;e.targeted=[];e.thirdOutCases=[];
    const configs=[['SS',.1,'secureFirstBaseOut'],['2B',.9,'secureFirstBaseOut'],['3B',.005,'secureFirstBaseOut'],['1B',.995,'selfCoverFirst']];
    for(const [position,direction,route]of configs){
      for(const [name,extra]of [['clean',{}],['failedSecure',{capabilities:{fielding:1,catching:1}}],['fastRunner',{batterSpeed:18}],['weakReceiver',{weakReceiver:'1B'}]]){
        if(position==='1B'&&name==='weakReceiver')continue;
        const r=rawCase(c,{position:labels[position],direction,occupied:0,...extra},route,.8,true);
        e.targeted.push({position,name,...summarizeRaw(r)});
      }
    }
    for(const outs of [0,1,2])for(let mask=0;mask<8;mask++){
      const r=rawCase(c,{position:labels['1B'],direction:.995,pace:0,contactQuality:.1,outs,occupiedBases:[0,1,2].filter(i=>mask&(1<<i))},'pitcherCoverFirst',.8,true);
      e.targeted.push({position:'1B',name:'3-1-matrix',outs,mask,...summarizeRaw(r)});
    }
    for(const [name,extra]of [['clean',{}],['receiverFailure',{capabilities:{fielding:1,catching:1}}],['fastClean',{batterSpeed:18}],['fastReceiverFailure',{batterSpeed:18,capabilities:{fielding:1,catching:1}}],['unavailable',{capabilities:{reaction:1,range:1}}],['upstreamFailure',{npc:{SS:{arm:1}}}]]){
      const r=rawCase(c,{position:labels['1B'],direction:.1,occupied:0,...extra},'secureFirstBaseOut',.8,true);
      e.targeted.push({position:'1B',name:'incoming-'+name,...summarizeRaw(r)});
    }
    for(const [position,direction,route,pivot]of [['SS',.1,'startDoublePlaySecond','2B'],['2B',.9,'initiate463','SS'],['3B',.005,'initiate543','2B'],['1B',.995,'initiate363','SS']]){
      for(const [name,extra]of [['fullDP',{}],['failedFirstThrow',{capabilities:{arm:1,throwing:1}}],['weakLastReceive',{weakReceiver:'1B'}],['weakRelay',{npc:{[pivot]:{arm:1}}}],['fastBatter',{batterSpeed:18}]]){
        if(position==='1B'&&name==='weakLastReceive')continue;
        const r=rawCase(c,{position:labels[position],direction,occupied:1,...extra},route,.8,true);
        e.targeted.push({position,name,...summarizeRaw(r)});
      }
    }
    for(const type of ['force','batterRunnerBeforeFirst','nonForceTag'])for(const timing of ['beforeThirdOut','afterThirdOut','unknown']){
      const args={outsBefore:2,runnersBefore:['r1',null,'r3'],proposedRunnersAfter:['b',null,null],orderedRetirements:[{runnerId:type==='batterRunnerBeforeFirst'?'b':'r1',targetBase:type==='batterRunnerBeforeFirst'?'first':'second',outType:type,sequence:1,order:2,
        ...(type==='force'?{forceStateAtRetirement:{forceTargets:{r1:'second'}}}:type==='batterRunnerBeforeFirst'?{isBatterRunner:true,beforeFirst:true}:{})}],scoringAttempts:[{runnerId:'r3',...(timing==='unknown'?{}:{timing})}]};
      const result=json('resolveHighSchoolThirdOutIntegrity('+JSON.stringify(args)+')');
      e.thirdOutCases.push({type,timing,result});
    }
    const F=require('../force-advancement.js');const chain=F.buildInitialLiveBallForceChain({runners:['r1','r2','r3'],batterRunnerId:'b'});
    e.forceRemoval={initial:chain.forceTargets,afterLead:F.deriveForceChainAfterRetirements(chain,['r3']).forceTargets,
      afterTrailing:F.deriveForceChainAfterRetirements(chain,['r1']).forceTargets,
      afterBatter:F.deriveForceChainAfterRetirements(chain,['b']).forceTargets,
      impossibleForce:F.settleForceAdvancement({forceChain:chain,retirements:[{runnerId:'b',targetBase:'first',outType:'batterRunnerBeforeFirst',sequence:1},{runnerId:'r1',targetBase:'second',outType:'force',sequence:2}]})};
    e.targetedSummary={cases:e.targeted.length,admitted:e.targeted.filter(t=>t.admitted).length,unoffered:e.targeted.filter(t=>!t.admitted).length,thirdOutCases:e.thirdOutCases.length};
    console.log('TARGETED '+JSON.stringify(e.targetedSummary));save(e);return;
  }
  if(phase==='evaluation_measurement'){
    e.observerMeasurementCorrection={reason:'SS / 2B active evidence uses a route snapshot without a physicalIdentity field; the initial observer undercounted those records. Recount defensive families, replay only these two positions, and compare every other saved cohort field.',results:[]};
    for(const position of ['SS','2B']){
      const c=context();c.run(observerSource);let total=0;
      for(const old of e.cohort[position].rows){const fresh=game(c,position,old.seed,true).item;
        const before={...old},after={...fresh};delete before.activeEvaluation;delete after.activeEvaluation;delete before.partialDP;delete after.partialDP;assert.deepEqual(after,before);
        total+=fresh.activeEvaluation;old.activeEvaluation=fresh.activeEvaluation;
      }
      e.cohort[position].summary=aggregate(e.cohort[position].rows);
      e.observerMeasurementCorrection.results.push({position,games:200,allOtherMeasurementsEqual:true,activeEvaluation:total});
      console.log('EVALUATION_RECOUNT '+position+' '+total);
    }
    for(const row of e.pilot){const c=context();c.run(observerSource);const fresh=game(c,row.position,row.seed,true);assert.deepEqual(fresh.neutral,row.on);row.observation.activeEvaluation=fresh.item.activeEvaluation;}
    for(const position of Object.keys(labels))for(const row of e.cohort[position].rows)row.partialDP=row.plays.filter(p=>['startDoublePlaySecond','initiate463','initiate543','initiate363'].includes(p.route)&&p.outs===1).length;
    for(const position of Object.keys(labels))e.cohort[position].summary=aggregate(e.cohort[position].rows);
    e.observerMeasurementCorrection.partialDP='Recount from persisted actual initialRoute + outs=1. Routine events do not preserve detailedResult / the generic route property.';
    save(e);return;
  }
  if(phase==='ability'){
    const P=require('../batted-ball-physical.js'),O=require('../defensive-opportunity-foundation.js'),R=require('../defensive-reach-secure-foundation.js'),D=require('../defensive-decision-throw-foundation.js'),T=require('../defensive-runner-throw-settlement-foundation.js'),F=require('../force-advancement.js'),Team=require('../team-roster-foundation.js');
    const roster={lineup:Team.POSITION_ORDER.map(p=>({id:'audit-'+p,position:p,age:18,throws:'R'})),bench:[]};
    e.ability=[];
    for(const position of Object.keys(labels))for(const mode of position==='3B'?['throw','touch']:position==='1B'?['touch']:['throw'])for(const skill of ['reaction','range','mobility','fielding','catching','arm','throwing','decision'])for(const sample of [.1,.3,.5,.7,.9])for(const value of [1,5,10,20]){
      const direction={SS:.1,'2B':.9,'3B':.005,'1B':.995}[position];
      const truth=P.resolveBattedBallPhysicalTruth({identity:'audit-sensitivity-'+position,abilities:{batting:8,power:8},rolls:{contactQuality:.65,ballType:.1,pace:.68,direction,depth:0}});
      const opportunity=O.resolveDefensiveOpportunity({physicalTruth:truth,activeRoster:roster,topologyVersion:position==='3B'?O.GROUND_TOPOLOGY_VERSION:position==='1B'?O.FIRST_BASE_GROUND_TOPOLOGY_VERSION:O.TOPOLOGY_VERSION});
      const caps={defenderId:opportunity.primaryDefenderId,reaction:7,range:7,mobility:7,fielding:7,catching:7,arm:7,throwing:7,decision:7,[skill]:value};
      const input={physicalTruth:truth,activeRoster:roster,opportunity,capabilities:caps,roll:sample,runners:['r1','r2',null],outs:0,batterRunnerId:'b',scores:{home:0,away:0},
        runnerPhysicalStates:[{runnerId:'b',originBase:'batter',targetBase:'first',speed:5,startQuality:'normalStart',advancementProgress:'early',movementDecision:'commitAdvance'},
          {runnerId:'r1',originBase:1,targetBase:'second',speed:5,startQuality:'normalStart',advancementProgress:'early',movementDecision:'commitAdvance'},
          {runnerId:'r2',originBase:2,targetBase:'third',speed:5,startQuality:'normalStart',advancementProgress:'early',movementDecision:'commitAdvance'}]};
      input.runnerStates=input.runnerPhysicalStates.filter(v=>v.originBase!=='batter');
      const reach=R.resolveReach(input);input.reachResult=reach;const secure=R.resolveSecure(input);input.secureResult=secure;
      const decision=D.buildDecisionOpportunity(input);let thrown=null,touch=null,timing=null,retirement=null;
      if(decision.status==='controlledDecision'){
        const selection=D.selectDefensiveRoute(decision,mode==='touch'?position==='1B'?'selfCoverFirst':'stepThird':'secureFirstBaseOut',input);
        const runner=input.runnerPhysicalStates.find(v=>v.runnerId===selection.route.targetRunnerId);
        if(mode==='touch'){touch=D.resolveBaseTouch({input,opportunity:decision,selection});timing=T.resolveBaseTouchTiming({input,opportunity:decision,selection,baseTouchResolution:touch,runnerState:runner});retirement=timing.contestAvailable&&timing.timingMargin>0;}
        else {thrown=D.resolveThrow({input,opportunity:decision,selection,capabilities:caps,rolls:{strength:sample,accuracy:sample},transferState:'ready'});
          input.receiverState={receiverId:selection.route.receiverId,ready:true,atBase:true,tagAvailable:false};
          timing=T.resolveTiming({input,opportunity:decision,selection,throwResolution:thrown,runnerState:runner,receiverState:input.receiverState});retirement=timing.contestAvailable&&timing.timingMargin>0;}
      }
      e.ability.push({position,mode,skill,sample,value,physicalIdentity:truth.identity,reachMargin:reach.margin,secureMargin:secure.margin??null,secureQuality:secure.secureQuality,
        strengthMargin:thrown?.strengthMargin??null,accuracyMargin:thrown?.accuracyMargin??null,throwQuality:thrown?.throwQuality??null,baseTouchCompletion:touch?.relativeCompletion??null,timingMargin:timing?.timingMargin??null,retirement});
    }
    e.receiveSensitivity=[];
    for(const quality of ['onTarget','challengingReceive'])for(const skill of ['reaction','range','fielding','catching','arm','throwing','mobility','decision'])for(const value of [1,5,10,20]){
      const receive=D.resolveIncomingReceive({playIdentity:'audit-receive',physicalIdentity:'audit-ball',throwResolution:{identity:'audit-throw',throwerId:'npc',receiverId:'player',receiverPosition:'1B',targetRunnerId:'b',targetBase:'first',throwAttempted:true,throwQuality:quality},receiver:{id:'player',position:'1B'},capabilities:{reaction:5,range:5,fielding:5,catching:5,arm:5,throwing:5,mobility:5,decision:5,[skill]:value},sample:.5});
      e.receiveSensitivity.push({quality,skill,value,status:receive.status,readinessMargin:receive.readinessMargin,secureMargin:receive.secureMargin});
    }
    const c=context(true);e.productionSensitivity=[];
    for(const [position,direction,route]of [['SS',.1,'secureFirstBaseOut'],['2B',.9,'secureFirstBaseOut'],['3B',.005,'secureFirstBaseOut'],['1B',.995,'selfCoverFirst']])for(const skill of ['reaction','range','fielding','catching','arm','throwing','decision'])for(const value of [1,5,10,20]){
      try{const r=rawCase(c,{position:labels[position],direction,occupied:0,capabilities:{[skill]:value}},route,.5,true);
        const state=c.json('m.groundBallInPlayState');e.productionSensitivity.push({position,skill,value,admitted:r.admitted,physicalIdentity:r.physicalIdentity,physicalHash:sha(JSON.stringify(state.physicalTruth)),reachMargin:state.defensiveAccess.reachResolution?.margin,
          secureMargin:state.secureResolution?.margin??null,secureInputs:state.secureResolution?.inputs||null,throwMargins:state.decisionThrowState?.throwResolution?{strength:state.decisionThrowState.throwResolution.strengthMargin,accuracy:state.decisionThrowState.throwResolution.accuracyMargin}:null,
          outs:r.raw?.outsCreated??null,playerLeg:r.raw?.playerLeg,evaluation:summarizeRaw(r).final?.evaluation});
      }catch(error){e.productionSensitivity.push({position,skill,value,error:error.message});}
    }
    const violations=[];
    for(const position of Object.keys(labels))for(const skill of ['reaction','range','mobility','fielding','catching','arm','throwing','decision'])for(const mode of ['throw','touch'])for(const sample of [.1,.3,.5,.7,.9]){
      const rows=e.ability.filter(r=>r.position===position&&r.skill===skill&&r.mode===mode&&r.sample===sample);
      const key=['reaction','range','mobility'].includes(skill)?'reachMargin':['fielding','catching'].includes(skill)?'secureMargin':skill==='arm'?'strengthMargin':skill==='throwing'?'accuracyMargin':null;
      if(key){const values=rows.map(r=>r[key]).filter(Number.isFinite);if(values.some((v,i)=>i&&v<values[i-1]))violations.push({position,mode,skill,sample,key});}
    }
    e.abilitySummary={foundationRows:e.ability.length,receiveRows:e.receiveSensitivity.length,productionRows:e.productionSensitivity.length,monotonicViolations:violations,productionErrors:e.productionSensitivity.filter(v=>v.error).length};
    console.log('ABILITY '+JSON.stringify(e.abilitySummary));save(e);return;
  }
  if(phase==='physical'){
    const P=require('../batted-ball-physical.js'),O=require('../defensive-opportunity-foundation.js'),Team=require('../team-roster-foundation.js');
    const roster={lineup:Team.POSITION_ORDER.map(p=>({id:'audit-'+p,position:p,age:18,throws:'R'})),bench:[]};
    e.physicalBoundaries=[];
    for(const bats of ['L','R'])for(const direction of [.024999,.025,.33,.5,.67,.99,.990001])for(const version of [O.TOPOLOGY_VERSION,O.GROUND_TOPOLOGY_VERSION,O.FIRST_BASE_GROUND_TOPOLOGY_VERSION]){
      const truth=P.resolveBattedBallPhysicalTruth({identity:'audit-boundary-'+bats+'-'+direction,abilities:{batting:8,power:8},bats,rolls:{contactQuality:.65,ballType:.1,pace:.68,direction,depth:0}});
      const npc=O.resolveDefensiveOpportunity({physicalTruth:truth,activeRoster:roster,topologyVersion:version});
      const playerRoster=JSON.parse(JSON.stringify(roster));playerRoster.lineup.find(a=>a.position===npc.primaryPosition).id='player';
      const owned=O.resolveDefensiveOpportunity({physicalTruth:truth,activeRoster:playerRoster,topologyVersion:version});
      const expected=version===O.TOPOLOGY_VERSION?(truth.direction==='rightSide'?'2B':'SS')
        :truth.direction==='leftSide'&&direction<.025?'3B':version===O.FIRST_BASE_GROUND_TOPOLOGY_VERSION&&truth.direction==='rightSide'&&direction>.99?'1B':truth.direction==='rightSide'?'2B':'SS';
      assert.equal(npc.primaryPosition,expected);assert.equal(owned.primaryPosition,expected);assert.equal(owned.primaryDefenderId,'player');
      assert.equal(npc.physicalIdentity,truth.identity);assert.equal(owned.physicalIdentity,truth.identity);
      e.physicalBoundaries.push({bats,direction,coarseDirection:truth.direction,version,expected,primary:npc.primaryPosition,secondary:npc.secondaryPositions,npcActor:npc.primaryDefenderId,playerActor:owned.primaryDefenderId,physicalIdentity:truth.identity});
    }
    const c=context(true),{run,json}=c;e.historicalTopology=[];e.fallbackFixtures=[];
    for(const [position,direction,version]of [['SS',.005,O.TOPOLOGY_VERSION],['2B',.995,O.TOPOLOGY_VERSION],['3B',.005,O.GROUND_TOPOLOGY_VERSION],['1B',.995,O.FIRST_BASE_GROUND_TOPOLOGY_VERSION]]){
      run('var oldRouter=getHighSchoolDefensiveOpportunity;getHighSchoolDefensiveOpportunity=(m,t)=>DefensiveOpportunityFoundation.resolveDefensiveOpportunity({physicalTruth:t,activeRoster:m.rosters[m.defenseTeam],topologyVersion:'+JSON.stringify(version)+'});');
      try{run('var m=firstBaseFixture('+JSON.stringify({position:labels[position],direction,occupied:1})+');');}finally{run('getHighSchoolDefensiveOpportunity=oldRouter;');}
      const identity=run('m.groundBallInPlayState.physicalTruth.identity');
      run('saveGame();player=createInitialPlayer("audit historical pending");loadGame();m=player.highSchoolMatch;var hx=firstBaseExecute(m);saveGame();player=createInitialPlayer("audit historical executed");loadGame();m=player.highSchoolMatch;resumeResolvedHighSchoolGroundBallSettlement(m);');
      const row={position,direction,version,storedVersion:run('getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth).topologyVersion'),versionStorage:run('m.groundBallInPlayState.defensiveOpportunity?"explicitTopology":"historicalV1ReachInference"'),identityEqual:run('m.groundBallInPlayState.physicalTruth.identity')===identity,matchIssues:json('getHighSchoolMatchStateIntegrityIssues(m)'),recordIssues:json('MatchGameRecord.getIntegrityIssues(m.gameRecord)')};
      assert.equal(row.storedVersion,version);assert.equal(row.identityEqual,true);assert.deepEqual(row.matchIssues,[]);assert.deepEqual(row.recordIssues,[]);e.historicalTopology.push(row);
    }
    for(const [position,options]of [['SS',{direction:.9}],['2B',{direction:.1}],['3B',{direction:.1}],['1B',{ballType:.95}]]){
      run('var m=firstBaseFixture('+JSON.stringify({position:labels[position],occupied:0,...options})+');');
      const row=json('({supported:m.groundBallInPlayState?.supported===true,physical:m.ordinaryDefensivePlateAppearanceState?.battedBallPhysicalTruth,ground:m.groundBallInPlayState,openGround:m.activeSituation?.type===MatchSituationLifecycle.TYPES.groundBallDefensiveDecision,events:m.simulationLog.filter(v=>v.inning===5)})');
      assert.equal(row.supported,false);assert.equal(row.openGround,false);e.fallbackFixtures.push({position,...row});
    }
    console.log('PHYSICAL '+JSON.stringify({boundaries:e.physicalBoundaries.length,historical:e.historicalTopology.length,fallback:e.fallbackFixtures.length}));save(e);return;
  }
  if(phase==='measurement_finalize'){
    for(const position of Object.keys(labels)){
      for(const row of e.cohort[position].rows)row.partialDP=row.plays.filter(p=>['startDoublePlaySecond','initiate463','initiate543','initiate363'].includes(p.route)&&p.outs===1).length;
      e.cohort[position].summary=aggregate(e.cohort[position].rows);
    }
    e.observerMeasurementCorrection.partialDP='Recount from persisted actual initialRoute + outs=1; no new game execution or Production change. Routine events do not preserve detailedResult / the generic route property.';
    console.log('FINAL_MEASUREMENTS '+JSON.stringify(Object.fromEntries(Object.entries(e.cohort).map(([p,v])=>[p,{partialDP:v.summary.partialDP,activeEvaluation:v.summary.activeEvaluation}]))));save(e);return;
  }
  if(phase==='evaluation_cases'){
    const c=context(true);e.evaluationCases=[];
    for(const [name,options,route]of [
      ['good-player-throw-teammate-error',{position:labels['3B'],direction:.005,occupied:0,weakReceiver:'1B'},'secureFirstBaseOut'],
      ['good-receive-runner-safe',{position:labels['1B'],direction:.1,occupied:0,batterSpeed:18},'secureFirstBaseOut'],
      ['routine-receive-no-decision',{position:labels['1B'],direction:.1,occupied:0},'secureFirstBaseOut'],
      ['bobble-controlled-success',{position:labels['3B'],direction:.005,occupied:0,capabilities:{fielding:5.5}},'secureFirstBaseOut']]){
      const r=rawCase(c,options,route,.8,true);e.evaluationCases.push({name,...summarizeRaw(r),groundSecure:c.json('m.groundBallInPlayState.secureResolution||null'),firstBaseCache:c.json('m.groundBallInPlayState.firstBaseExecution?.received||null')});
    }
    e.challengingReceiveCandidates=[];
    for(const defense of [5,5.5,6])for(const arm of [5,6,7]){
      const r=rawCase(c,{position:labels['1B'],direction:.1,occupied:0,npc:{SS:{defense,arm}}},'secureFirstBaseOut',.8,true);
      const quality=c.json('m.groundBallInPlayState.decisionThrowState?.throwResolution?.throwQuality||null');
      const row={defense,arm,quality,...summarizeRaw(r)};e.challengingReceiveCandidates.push(row);
      if(quality==='challengingReceive'&&r.raw.playerLeg.receive==='completed'&&!e.evaluationCases.some(v=>v.name==='challenging-throw-rescued'))e.evaluationCases.push({name:'challenging-throw-rescued',...row});
    }
    console.log('EVALUATION '+JSON.stringify(e.evaluationCases.map(r=>({name:r.name,outs:r.outs,secure:r.groundSecure?.secureQuality,receive:r.playerLeg?.receive,qualities:r.final.evaluation.map(v=>({skill:v.skill,quality:v.quality,decision:v.decision}))}))));save(e);return;
  }
  if(phase==='save_focused'){
    const c=context(true),{run,json}=c;e.saveProbes=[];
    for(const [position,direction]of [['SS',.1],['2B',.9],['3B',.005],['1B',.995]])for(const [scenario,extra]of [['clean',{}],['failedThrow',{capabilities:{arm:1,throwing:1}}],['failedHands',{capabilities:{fielding:1,catching:1}}]]){
      run('var m=firstBaseIncomingBoundary('+JSON.stringify({position:labels[position],direction,occupied:1,...extra})+',"pending");var savePending=JSON.stringify(m.groundBallInPlayState);saveGame();player=createInitialPlayer("audit pending cold");loadGame();m=player.highSchoolMatch;');
      const pendingEqual=run('JSON.stringify(m.groundBallInPlayState)===savePending');
      run('var sx=firstBaseExecute(m,"challenge",.8);var saveExecution=JSON.stringify(m.groundBallInPlayState);var saveCursor=m.simulationCursor;saveGame();player=createInitialPlayer("audit executed cold");loadGame();m=player.highSchoolMatch;');
      const executionEqual=run('JSON.stringify(m.groundBallInPlayState)===saveExecution'),cursorEqual=run('m.simulationCursor===saveCursor');
      run('var originalMathRandom=Math.random;Math.random=()=>{throw Error("audit replay RNG");};');
      let duplicateEqual;
      try {run('resumeResolvedHighSchoolGroundBallSettlement(m);var settledFacts=firstBaseFacts(m);resumeResolvedHighSchoolGroundBallSettlement(m);');duplicateEqual=run('firstBaseFacts(m)===settledFacts');}
      finally {run('Math.random=originalMathRandom;');}
      run('saveGame();player=createInitialPlayer("audit settled cold");loadGame();m=player.highSchoolMatch;');
      const settledEqual=run('firstBaseFacts(m)===settledFacts');
      e.saveProbes.push({position,scenario,pendingEqual,executionEqual,cursorEqual,duplicateEqual,settledEqual,
        initialExecutionSampleCalls:run('sx.rolls'),
        matchIssues:json('getHighSchoolMatchStateIntegrityIssues(m)'),recordIssues:json('MatchGameRecord.getIntegrityIssues(m.gameRecord)')});
    }
    console.log('SAVE '+JSON.stringify({cases:e.saveProbes.length,allEqual:e.saveProbes.every(v=>v.pendingEqual&&v.executionEqual&&v.cursorEqual&&v.duplicateEqual&&v.settledEqual&&!v.matchIssues.length&&!v.recordIssues.length)}));save(e);return;
  }
  if(phase==='regression'){
    e.focusedExistingRegression=[];
    for(const file of ['tests/force-advancement-foundation-test.js','tests/defensive-runner-throw-settlement-foundation-test.js','tests/match-full-game-record-test.js']){
      const start=Date.now(),r=cp.spawnSync(process.execPath,[file],{cwd:root,windowsHide:true,encoding:'utf8',timeout:600000,maxBuffer:10e6});
      e.focusedExistingRegression.push({file,sourceHash:sha(read(file)),exitCode:r.status,stdout:r.stdout,stderr:r.stderr,durationMs:Date.now()-start});
      console.log('REGRESSION '+file+' exit='+r.status+' '+r.stdout.trim().split(/\r?\n/).at(-1));
    }
    assert.deepEqual(hashSources(),e.sourceHashes);save(e);return;
  }
  if(phase==='proofs'){
    const c=context(true),{run,json}=c;e.tamperProbes=[];
    for(const [position,direction]of [['SS',.1],['2B',.9],['3B',.005],['1B',.995]])for(const [name,mutation]of [
      ['physicalIdentity','bad.highSchoolMatch.groundBallInPlayState.physicalTruth.identity="forged"'],
      ['selectedRoute','bad.highSchoolMatch.activeSituation.executionState.selectedRoute="forged"'],
      ['livePlayerActor','bad.highSchoolMatch.rosters.home.lineup.find(a=>a.id==="player").id="stale-player"'],
      ['timing','bad.highSchoolMatch.groundBallInPlayState.runnerThrowTiming.timingMargin=99']]){
      run('var m=firstBaseIncomingBoundary('+JSON.stringify({position:labels[position],direction,occupied:1})+',"pending");firstBaseExecute(m,"challenge",.8);var bad=JSON.parse(JSON.stringify(player));');run(mutation);
      const before=json('bad');let rejected=false,message='',normalizedRoutes=null;try{run('var auditNormalized=normalizeSave(bad);');normalizedRoutes=json('({decision:auditNormalized.highSchoolMatch.activeSituation.decision.selectedRoute,execution:auditNormalized.highSchoolMatch.activeSituation.executionState.selectedRoute})');}catch(error){rejected=true;message=error.message;}
      const inputUnchanged=JSON.stringify(json('bad'))===JSON.stringify(before);e.tamperProbes.push({position,name,rejected,inputUnchanged,message,normalizedRoutes});
      if(!rejected||!inputUnchanged)console.log('TAMPER_OBSERVATION '+JSON.stringify(e.tamperProbes.at(-1)));
    }
    e.twoOutsOrderedTruncation=json('resolveHighSchoolThirdOutIntegrity({outsBefore:2,runnersBefore:["r1",null,"r3"],proposedRunnersAfter:[null,null,null],orderedRetirements:[{runnerId:"r1",targetBase:"second",outType:"force",sequence:1,forceStateAtRetirement:{forceTargets:{r1:"second"}}},{runnerId:"b",targetBase:"first",outType:"batterRunnerBeforeFirst",sequence:2,isBatterRunner:true,beforeFirst:true}],scoringAttempts:[{runnerId:"r3",timing:"beforeThirdOut"}]})');
    assert.equal(e.twoOutsOrderedTruncation.outsAfter,3);assert.equal(e.twoOutsOrderedTruncation.orderedRetirements.length,1);assert.deepEqual(e.twoOutsOrderedTruncation.legalScoringRunnerIds,[]);
    const cases=[...e.ruleMatrix,...e.targeted,...e.exactBaselineReproduction].filter(v=>v.admitted);
    const incompleteDependencies=cases.flatMap(v=>(v.actions||[]).filter(a=>a.status==='completed'&&a.dependsOn.some(id=>v.actions.find(b=>b.identity===id)?.status!=='completed')).map(a=>({position:v.position,name:v.name,type:a.type})));
    const physicalGroups={};for(const row of e.productionSensitivity){const key=row.position+'|'+row.skill;(physicalGroups[key]||=new Set()).add(row.physicalHash);}
    const touchArmGroups={};for(const row of e.ability.filter(r=>r.mode==='touch'&&['arm','throwing'].includes(r.skill))){const key=[row.position,row.skill,row.sample].join('|');(touchArmGroups[key]||=[]).push(row);}
    e.proofSummary={dependencyCases:cases.length,incompleteDependencies,observedActionTypes:[...new Set(cases.flatMap(v=>(v.actions||[]).map(a=>a.type)))],
      productionCounterfactualPhysicalUnchanged:Object.values(physicalGroups).every(v=>v.size===1),
      baseTouchIndependentOfArmAndThrowing:Object.values(touchArmGroups).every(rows=>new Set(rows.map(r=>JSON.stringify([r.baseTouchCompletion,r.timingMargin,r.retirement]))).size===1),
      tamperRejected:e.tamperProbes.every(r=>r.rejected&&r.inputUnchanged)};
    console.log('PROOFS '+JSON.stringify(e.proofSummary));save(e);return;
  }
  if(phase==='exact_replay'){
    const sourcePaths=git(['ls-tree','--name-only',baseline]).split(/\r?\n/).filter(v=>v.endsWith('.js'));
    const sources=Object.fromEntries(sourcePaths.map(file=>[path.join(root,file),cp.execFileSync('git',['show',baseline+':'+file],{encoding:'utf8',windowsHide:true,maxBuffer:20e6})]));
    const originalRead=fs.readFileSync,Module=require('module'),originalLoader=Module._extensions['.js'];
    fs.readFileSync=function(file,options){const source=sources[path.resolve(String(file))];if(source!==undefined)return typeof options==='string'||options?.encoding?source:Buffer.from(source);return originalRead.apply(this,arguments);};
    Module._extensions['.js']=function(module,file){if(sources[file]!==undefined)return module._compile(sources[file],file);return originalLoader(module,file);};
    const c=context(true);e.exactBaselineReproduction=[];
    for(const [name,options,route]of [
      ['DP-543-wild-relay',{position:labels['3B'],direction:.005,occupied:1,npc:{'2B':{arm:1}}},'initiate543'],
      ['DP-363-wild-relay',{position:labels['1B'],direction:.995,occupied:1,npc:{SS:{arm:1}}},'initiate363'],
      ['already-safe-clean',{position:labels['1B'],direction:.1,occupied:0,batterSpeed:18},'secureFirstBaseOut'],
      ['already-safe-receiver-error',{position:labels['1B'],direction:.1,occupied:0,batterSpeed:18,capabilities:{fielding:1,catching:1}},'secureFirstBaseOut'],
      ['lost-out-53-receiver-error',{position:labels['3B'],direction:.005,occupied:0,weakReceiver:'1B'},'secureFirstBaseOut'],
      ['lost-out-543-receiver-error',{position:labels['3B'],direction:.005,occupied:1,weakReceiver:'1B'},'initiate543'],
      ['legacy-63-receiver-failure',{position:labels.SS,direction:.1,occupied:0,weakReceiver:'1B'},'secureFirstBaseOut'],
      ['legacy-43-receiver-failure',{position:labels['2B'],direction:.9,occupied:0,weakReceiver:'1B'},'secureFirstBaseOut']]){
      const r=rawCase(c,options,route,.8,true);e.exactBaselineReproduction.push({name,baseline,sourceMode:'git show exact root source + in-memory module / VM compilation; same unmodified fixture',...summarizeRaw(r),
        rawBefore:r.raw.runnerSettlement.initialForceChain.sourceBaseState,throwQuality:c.json('m.groundBallInPlayState.decisionThrowState?.throwResolution?.throwQuality||null')});
    }
    e.exactBaselineRouteCopy=[];
    for(const [position,direction]of [['SS',.1],['2B',.9],['3B',.005],['1B',.995]]){
      c.run('var m=firstBaseIncomingBoundary('+JSON.stringify({position:labels[position],direction,occupied:1})+',"pending");var ex=firstBaseExecute(m,"challenge",.8);var routeCopyBad=JSON.parse(JSON.stringify(player));routeCopyBad.highSchoolMatch.activeSituation.executionState.selectedRoute="forged";');
      let rejected=false,message='',routes=null,recovered=null;
      try{c.run('var routeCopyNormalized=normalizeSave(routeCopyBad);');routes=c.json('({decision:routeCopyNormalized.highSchoolMatch.activeSituation.decision.selectedRoute,execution:routeCopyNormalized.highSchoolMatch.activeSituation.executionState.selectedRoute})');
        c.run('player=routeCopyNormalized;m=player.highSchoolMatch;resumeResolvedHighSchoolGroundBallSettlement(m);');recovered=c.json('({outs:m.outs,initialRoute:m.lastDefensiveResolution.initialRoute,routeId:m.lastDefensiveResolution.routeId,issues:getHighSchoolMatchStateIntegrityIssues(m)})');
      }catch(error){rejected=true;message=error.message;}
      e.exactBaselineRouteCopy.push({position,baseline,rejected,message,routes,recovered});
    }
    fs.readFileSync=originalRead;Module._extensions['.js']=originalLoader;
    console.log('EXACT_BASELINE '+JSON.stringify(e.exactBaselineReproduction.map(r=>({name:r.name,out:r.outs,actors:r.final.attribution.actors.map(a=>({position:a.actorPosition,A:a.A,E:a.E}))}))));save(e);return;
  }
  if(phase==='finalize'){
    assert.deepEqual(hashSources(),e.sourceHashes);
    assert.equal(git(['branch','--show-current']),'main');assert.equal(git(['rev-parse','origin/main']),baseline);assert.equal(git(['diff','--cached','--name-only']),'');
    const auditFiles=['docs/infield-baseball-logic-validation-audit-v1.md','docs/infield-baseball-logic-audit-evidence.json','docs/infield-baseball-logic-audit-architecture-evidence.json','docs/infield-baseball-logic-audit-runner.cjs'];
    const unexpectedStatus=git(['status','--short']).split(/\r?\n/).filter(line=>!auditFiles.includes(line.slice(3))&&!e.initialStatus.split(/\r?\n/).includes(line));assert.deepEqual(unexpectedStatus,[]);
    const whitespace=[];for(const file of auditFiles)read(file).split(/\r?\n/).forEach((line,i)=>{if(/[ \t]+$/.test(line))whitespace.push({file,line:i+1});});assert.deepEqual(whitespace,[]);
    cp.execFileSync('git',['diff','--check','--','.',':(exclude)tests/fast-check-smoke-test.cjs'],{cwd:root,windowsHide:true,encoding:'utf8'});
    const record=(name,position,stat)=>e.exactBaselineReproduction.find(r=>r.name===name).final.attribution.actors.find(a=>a.actorPosition===position)[stat];
    const errors=[['L01','DP-543-wild-relay','2B','E',0],['L01','DP-363-wild-relay','SS','E',0],['L01','already-safe-receiver-error','1B','E',0],['L02','lost-out-53-receiver-error','3B','A',1],['L02','lost-out-543-receiver-error','2B','A',1]];
    e.scorerAuditAssertions=errors.map(([issue,name,position,stat,expected])=>({issue,name,baseline,position,stat,expected,actual:record(name,position,stat),pass:record(name,position,stat)===expected}));
    e.ruleBenchmark={source:'https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf',sections:['5.08(a)','5.09(b)(6)','9.10(a)(1)','9.12(a)(1)','9.12(d)(3)'],qualification:'Explicit official-baseball benchmark, not verification of every Taiwan high-school competition amendment.'};
    e.finalVerification={at:new Date().toISOString(),branch:git(['branch','--show-current']),HEAD:git(['rev-parse','HEAD']),originMain:git(['rev-parse','origin/main']),
      originalTrackedSourceAndTestHashesEqual:true,hashedFiles:Object.keys(e.sourceHashes).length,indexEmpty:true,status:git(['status','--short']),runnerHash:sha(read('docs/infield-baseball-logic-audit-runner.cjs'))};
    e.finalVerification.auditFiles=auditFiles;e.finalVerification.noUnexpectedStatus=true;e.finalVerification.newFilesTrailingWhitespace=whitespace;e.finalVerification.diffCheck={exitCode:0,scope:'All tracked paths except protected smoke; new audit files checked separately'};
    e.finalVerification.reportHash=sha(read(auditFiles[0]));e.finalVerification.architectureEvidenceHash=sha(read(auditFiles[2]));
    e.finalVerification.exposureDenominatorConsistent=Object.values(e.cohort).flatMap(v=>v.rows).every(r=>r.activeDefensiveInnings===r.experienceExposure.defensiveInnings);
    const allProjectionRows=[...e.ruleMatrix,...e.targeted,...e.exactBaselineReproduction,...e.evaluationCases,...e.challengingReceiveCandidates];
    for(const row of allProjectionRows)for(const action of row.actions||[]){
      if(action.provenance?.timing&&JSON.stringify(action.provenance.timing)===JSON.stringify(row.timing)){
        delete action.provenance.timing;action.provenance.timingReference='row.timing';
      }
    }
    e.artifactFormat={kind:'Read-only diagnostic projections, not persisted executable caches',encoding:'Compact UTF-8 JSON',deduplication:'Repeated action provenance timing identical to its parent row timing is represented by timingReference=row.timing. Original owners and reproducible fixture inputs remain unchanged.'};
    fs.writeFileSync(output,JSON.stringify(e)+'\n');
    console.log('FINAL '+JSON.stringify({...e.finalVerification,evidenceBytes:fs.statSync(output).size}));return;
  }
  throw Error('Unknown audit phase '+phase);
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
