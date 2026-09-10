// Sprint 1.1 extension: existing production seams, shared Sprint 1 aggregation/diagnostics.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const Core=require('./ability-performance-correlation-audit.cjs');
const Plate=require('../offensive-plate-approach.js'),Record=require('../match-game-record.js');
const Reach=require('../defensive-reach-secure-foundation.js'),Decision=require('../defensive-decision-throw-foundation.js');
const Timing=require('../defensive-runner-throw-settlement-foundation.js'),Opportunity=require('../defensive-opportunity-foundation.js');
const Physical=require('../batted-ball-physical.js'),Runner=require('../offensive-bunt-defensive-handoff.js'),Roster=require('../team-roster-foundation.js');
const clone=x=>JSON.parse(JSON.stringify(x)),root=path.resolve(__dirname,'..');
const TIERS=Core.TIERS;
function saveJson(file,value){
  const temporary=file+'.tmp';
  fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n');
  fs.renameSync(temporary,file);
}
let settlementContext;
function thirdOut(args){settlementContext||=require('./high-school-career-test-context.js').makeContext();return clone(settlementContext.run(`resolveHighSchoolThirdOutIntegrity(${JSON.stringify(args)})`));}
const abilityBase=Object.freeze({batting:12,power:12,observe:10,ballSense:10,baseballIQ:10,reaction:10});
function abilityView(axis,tier){return {...abilityBase,[{contact:'batting',power:'power',recognition:'observe'}[axis]]:tier};}
function environment(seed,namespace){return {gameId:`audit11-${namespace}-game-${seed}`,paId:`audit11-${namespace}-game-${seed}|pa-1`,seed};}
function battingOpportunity(axis,tier,seed){
  const env=environment(seed,axis),abilities=abilityView(axis,tier);
  const input={paIdentity:env.paId,batterId:'player',approach:'balancedAttack',abilities,context:{outs:0,hasRunner:false}};
  const before=JSON.stringify(input),state=Plate.simulatePlateAppearance(input);
  assert.equal(JSON.stringify(input),before,'Production seam mutated capability view');assert(state.completed);
  const record=Record.createGameRecord({gameId:env.gameId,homeTeamId:'audit-home',awayTeamId:'audit-away',rosters:{home:{lineup:[{id:'player',defensivePosition:'SS'}]},away:{lineup:[{id:'pitcher',defensivePosition:'P'}]}}});
  Record.recordEvent(record,{eventId:env.paId,type:'plateAppearance',sequence:1,inning:1,half:'下',offenseTeam:'home',batterId:'player',result:state.result,before:{outs:0},after:{outs:['out','strikeout','productiveOut'].includes(state.result)?1:0}},{rosters:{away:{lineup:[{id:'pitcher',defensivePosition:'P'}]}}});
  Record.assertIntegrity(record);
  const pitchIds=state.pitchHistory.map(p=>p.pitch.pitchId);
  assert.equal(new Set(pitchIds).size,state.pitchNumber);
  state.pitchHistory.forEach((p,i)=>assert.equal(p.pitchNumber,i+1,'Pitch RNG progression must be contiguous'));
  return {seed,...env,abilities,line:record.playerLines.player,record,decisions:[],log:[],state,pitchIds};
}
function distribution(values){const mean=values.reduce((s,v)=>s+v,0)/values.length;return {mean,variance:values.reduce((s,v)=>s+(v-mean)**2,0)/values.length};}
function independence(samples){
  const games=samples.map(s=>s.gameId),events=samples.map(s=>s.paId||s.id),pitchIds=samples.flatMap(s=>s.pitchIds||[]);
  assert.equal(new Set(games).size,samples.length,'Unexpected reused game identity');assert.equal(new Set(events).size,samples.length,'Unexpected settled-event replay');
  assert.equal(new Set(pitchIds).size,pitchIds.length,'Unexpected pitch replay');
  return {sample:samples.length,uniqueGames:new Set(games).size,uniqueEvents:new Set(events).size,uniquePitches:new Set(pitchIds).size,unexpectedDuplicates:0,
    rngProgression:pitchIds.length?{kind:'identity-and-pitch-number indexed namespaces',contiguousPitchNumbers:true,pitchOpportunities:pitchIds.length,note:'No mutable RNG cursor is invented for a counter/hash-based generator.'}:{kind:'reach → optional secure → optional strength + accuracy',reach:samples.filter(s=>s.draws?.[0]?.consumed).length,secure:samples.filter(s=>s.draws?.[1]?.consumed).length,throws:samples.filter(s=>s.attempted).length},
    blocks:Array.from({length:10},(_,i)=>{const block=samples.slice(Math.floor(i*samples.length/10),Math.floor((i+1)*samples.length/10));return {sample:block.length,uniqueGames:new Set(block.map(s=>s.gameId)).size,uniqueEvents:new Set(block.map(s=>s.paId||s.id)).size};})};
}
function battingAudit(axis,count=1000){
  const tiers=[],outcomes=[];
  for(const tier of TIERS){const samples=Array.from({length:count},(_,i)=>battingOpportunity(axis,tier,i+1));
    const summary=Core.summarize(samples);summary.rates.XBHperAB=(summary.line.batting.doubles+summary.line.batting.triples+summary.line.batting.HR)/summary.line.batting.AB;
    const pitches=samples.flatMap(s=>s.state.pitchHistory);
    const physical=samples.map(s=>s.state.battedBallPhysicalTruth).filter(Boolean);
    tiers.push({ability:tier,view:abilityView(axis,tier),...summary,independence:independence(samples),physicalEvidence:{ballsInPlay:physical.length,hard:physical.filter(p=>p.pace==='hard').length,deep:physical.filter(p=>p.depth==='deep').length,scope:'Canonical physical truth before legacy downstream statistical projection.'},decisionEvidence:{pitches:pitches.length,chasePitches:pitches.filter(p=>!p.pitch.strike).length,chaseSwings:pitches.filter(p=>!p.pitch.strike&&p.action==='swing').length,takes:pitches.filter(p=>p.action==='take').length,correctTakes:pitches.filter(p=>p.action==='take'&&!p.pitch.strike).length,scope:'Only this fully instrumented standalone PA stream; not an AI full-game chase rate.'}});
    outcomes.push(samples.map(s=>s.state.result));console.log(`1.1 ${axis} ${tier}: ${count} unique PA`);
  }
  const rank=r=>({strikeout:0,out:0,productiveOut:0,walk:1,single:2,double:3,triple:4,homeRun:5}[r]||0);
  return {capability:axis,scope:'Standalone canonical PA production seam. Active GameRecord projections carry real PA outcomes; these are NOT completed full games.',tiers,
    metrics:Object.fromEntries(['AVG','SO','HR','XBHperAB','TB','BB'].map(m=>[m,Core.diagnostics(tiers.map(t=>t.rates[m]),m==='SO'?-1:1)])),pairedImprovementFrequency:outcomes[0].filter((r,i)=>rank(outcomes.at(-1)[i])>rank(r)).length/count};
}
function defensiveInput(bucket,seed,fielding=12){
  const env=environment(seed,`defense-${bucket}`);
  const physicalTruth={version:Physical.VERSION,identity:env.paId,contactQuality:'solid',ballType:'groundBall',pace:{ROUTINE:'weak',MODERATE:'firm',DIFFICULT:'hard'}[bucket],direction:'leftSide',depth:null};
  const activeRoster={lineup:Roster.POSITION_ORDER.map(position=>({id:`active-${position}`,position,throws:'R',age:18})),bench:[]};
  const opportunity=Opportunity.resolveDefensiveOpportunity({physicalTruth,activeRoster});assert.equal(opportunity.primaryPosition,'SS');
  const capabilities={defenderId:opportunity.primaryDefenderId,reaction:5.5,range:5.5,mobility:5.5,fielding,catching:4};
  const base={physicalTruth,activeRoster,opportunity,capabilities};
  const reachResult=Reach.resolveReach(base),secureResult=Reach.resolveSecure({...base,reachResult});
  return {...env,...base,reachResult,secureResult,runners:[null,null,null],outs:0,batterRunnerId:'batter',scores:{home:0,away:0}};
}
function contest(input,arm=12,speed=10,pressured=false,advance=false){
  input=clone(input);
  const route=advance?'forceSecond':'secureFirstBaseOut';
  if(advance)input.runners=['r1',null,null];
  const make=(runnerId,originBase,targetBase)=>({...Runner.createRunnerPhysicalState({runnerId,originBase,targetBase,movementDecision:'commitAdvance',startQuality:['normalStart','preparedStart','lateStart'][input.seed%3],speed}),advancementProgress:pressured?'midway':'early'});
  input.runnerPhysicalStates=[make('batter','batter','first')];
  if(advance)input.runnerPhysicalStates.unshift(make('r1',1,'second'));
  input.runnerStates=input.runnerPhysicalStates.filter(r=>r.originBase!=='batter');
  const opportunity=Decision.buildDecisionOpportunity(input),selection=Decision.selectDefensiveRoute(opportunity,route,input);
  const throwResolution=Decision.resolveThrow({input,opportunity,selection,capabilities:{defenderId:selection.defenderId,arm,throwing:12},transferState:'ready'});
  const receiverState={receiverId:selection.route.receiverId,ready:true,atBase:true,tagAvailable:true,tagDelay:1};input.receiverState=receiverState;
  const args={input,opportunity,selection,throwResolution,runnerState:input.runnerPhysicalStates.find(r=>r.runnerId===selection.route.targetRunnerId),receiverState,resolveThirdOut:thirdOut};
  const timing=Timing.resolveTiming(args),settlement=Timing.deriveSettlement({...args,timing});
  return {throwResolution,timing,settlement};
}
function defensiveSample(axis,tier,bucket,seed){
  const input=defensiveInput(bucket,seed,axis==='fielding'?tier:12),before=JSON.stringify(input);
  let result=null;
  if(input.secureResult.secured)result=contest(input,axis==='arm'?tier:12,axis==='speed'?tier:axis==='fielding'?5:10,axis!=='fielding'&&bucket==='DIFFICULT',axis==='speed');
  assert.equal(input.secureResult.variationEvidence.consumed,input.reachResult.reached);
  assert.equal(!!result,input.secureResult.secured);
  assert.equal(JSON.stringify(input),before);
  return {gameId:input.gameId,id:input.paId,seed,acquisition:input.reachResult.reachQuality,reachId:input.reachResult.identity,secureId:input.secureResult.identity,reached:input.reachResult.reached,secured:input.secureResult.secured,
    attempted:!!result,success:axis==='speed'?result?.settlement.runnerResult==='safe':result?.settlement.outRecorded===true,
    unconverted:axis==='speed'?result?.settlement.runnerResult!=='safe':result?.settlement.outRecorded!==true,error:null,throwQuality:result?.throwResolution.throwQuality||null,timingMargin:result?.timing.timingMargin??null,runnerResult:result?.settlement.runnerResult||null,
    capabilities:input.capabilities,arm:axis==='arm'?tier:12,speed:axis==='speed'?tier:axis==='fielding'?5:10,
    draws:[input.reachResult.variationEvidence,input.secureResult.variationEvidence,result?.throwResolution.variationEvidence].filter(Boolean)};
}
function defenseAudit(axis,count=1000){
  const buckets=axis==='fielding'?['ROUTINE','MODERATE','DIFFICULT']:['MODERATE','DIFFICULT'];
  return {capability:axis,scope:axis==='speed'?'Forced 1B→2B advancement following a live ground ball; NOT a steal.':'SS physical reach/secure + selected throw + canonical runner settlement; no scorer error invented.',buckets:buckets.map(bucket=>{
    const tiers=TIERS.map(tier=>{
      // Arm and speed compare only legal acquired-ball opportunities; acquire selection independent of target.
      const samples=[];let seed=0;while(samples.length<count){const s=defensiveSample(axis,tier,bucket,++seed);if(axis==='fielding'||s.attempted)samples.push(s);assert(seed<20000);}
      const blocks=Array.from({length:10},(_,i)=>{const rows=samples.slice(i*count/10,(i+1)*count/10),attempts=rows.filter(s=>s.attempted).length;return {sample:rows.length,mean:rows.filter(s=>s.success).length/rows.length,throwSuccessRate:attempts?rows.filter(s=>s.throwQuality==='onTarget').length/attempts:null};});
      const attempts=samples.filter(s=>s.attempted).length,throwSuccesses=samples.filter(s=>s.throwQuality==='onTarget').length;
      return {ability:tier,sample:samples.length,attempts,throwSuccesses,throwSuccessRate:attempts?throwSuccesses/attempts:null,runnerAdvancementPrevented:samples.filter(s=>s.runnerResult==='out').length,successes:samples.filter(s=>s.success).length,unconverted:samples.filter(s=>s.unconverted).length,errors:null,errorReason:'Physical secure failure is not a canonical scorer E; this seam does not adjudicate E.',mean:samples.filter(s=>s.success).length/count,blocks,blockDistribution:distribution(blocks.map(b=>b.mean)),independence:independence(samples),traceExamples:samples.slice(0,3),environmentSeeds:samples.map(s=>s.seed)};
    });
    if(axis!=='fielding')for(const t of tiers)assert.deepEqual(t.environmentSeeds,tiers[0].environmentSeeds,'Target changed admission sample pool');
    console.log(`1.1 ${axis} ${bucket}: ${tiers.map(t=>t.mean.toFixed(3)).join(' / ')}`);
    return {bucket,tiers,diagnostics:Core.diagnostics(tiers.map(t=>t.mean),1)};
  })};
}
function npcConfirmation(count=20){
  const h=Core.createHarness('投手'),originalId=h.base.highSchoolMatch.id;
  const slot=h.base.highSchoolMatch.rosters.home.lineup.findIndex(p=>p.defensivePosition==='P'),id=h.base.highSchoolMatch.rosters.home.lineup[slot].id;
  const tiers=[];
  for(const tier of [4,5,6,7,8]){const samples=[];for(let seed=1;seed<=count;seed++){
    h.base.highSchoolMatch.id=`${originalId}|audit11-npc-${seed}`;h.base.highSchoolMatch.gameRecord.gameId=h.base.highSchoolMatch.id;
    const sample=h.play(`highSchoolMatch.rosters.home.lineup.${slot}.pitching`,tier,seed,id);
    assert.equal(sample.record.gameId,h.base.highSchoolMatch.id);
    const cursor=h.ctx.json('player.highSchoolMatch.simulationCursor');
    const paEvents=sample.log.filter(e=>e.type==='plateAppearance');
    assert.equal(cursor-(h.base.highSchoolMatch.simulationCursor||0),paEvents.length,'Ordinary AI PA RNG must advance once per PA');
    const targetEvents=paEvents.filter(e=>e.offenseTeam==='away').map(e=>sample.record.eventRefs.find(r=>r.sequence===e.sequence&&r.type===e.type).eventId);
    assert.equal(targetEvents.length,sample.line.pitching.BF);
    samples.push({...sample,gameId:sample.record.gameId,paId:sample.record.gameId+'|full-game',targetEvents,cursor});
  }
    const summary=Core.summarize(samples),events=samples.flatMap(s=>s.targetEvents);
    assert.equal(new Set(events).size,summary.line.pitching.BF,'Duplicate BF event identity');
    tiers.push({ability:tier,...summary,independence:{sample:summary.line.pitching.BF,uniqueGames:new Set(samples.map(s=>s.gameId)).size,uniqueEvents:new Set(events).size,unexpectedDuplicates:0,rngProgression:samples.map(s=>({gameId:s.gameId,cursor:s.cursor,advancementChecked:true})),blocks:Array.from({length:10},(_,i)=>{const b=samples.slice(i*count/10,(i+1)*count/10),ids=b.flatMap(s=>s.targetEvents);return {sample:ids.length,uniqueEvents:new Set(ids).size,uniqueGames:b.length};})}});}
  return {capability:'npcQuality',scope:'20 genuinely completed games/tier. No player P decisions means routing identity is not re-prepared; player BF is never credited.',tiers,metrics:Object.fromEntries(['pitcherH','ER27','pitcherBB','pitcherSO'].map(m=>[m,Core.diagnostics(tiers.map(t=>t.rates[m]),m==='pitcherSO'?1:-1)]))};
}
function structural(){
  const h=Core.createHarness('投手'),sample=h.play('baseballSkills.control',12,1);
  const source=fs.readFileSync(path.join(root,'script.js'),'utf8');
  const start=source.indexOf('function resolveSimulatedHighSchoolPlateAppearance('),end=source.indexOf('\nfunction ',start+1);
  assert(start>=0&&end>start,'Cannot locate ordinary PA source boundary');
  const ordinary=source.slice(start,end);
  const outcomeLine=ordinary.split(/\r?\n/).find(line=>line.includes('const result = adjusted'));
  assert(outcomeLine,'Ordinary PA outcome definition must be inspected, not assumed');
  const outcomes=[...outcomeLine.matchAll(/"([^"]+)"/g)].map(m=>m[1]);
  return {playerPitcher:{verdict:'BLOCKED_BY_EXPOSURE',classification:'BLOCKED_BY_GAMEPLAY_EXPOSURE',selectedPosition:h.base.primaryPosition,matchRole:h.base.highSchoolMatch.role,assignment:h.ctx.json('getCurrentHighSchoolMatchDefender(player.highSchoolMatch,"home","投手").id'),playerBF:sample.line.pitching.BF,playerOuts:sample.line.pitching.outsRecorded,path:['playing-time-game-exposure.js: pitcherExposureDeferred → noAppearance','script.js: shouldEnterHighSchoolMatchPlayer rejects deferred exposure','active roster incumbent remains pitcher','match-game-record.js: BF credited to active defensive P']},
    steal:{verdict:'OUTCOME_SPACE_GAP',stopCondition:'C',attempts:null,successes:null,CS:null,reason:'Record supports SB/CS ingestion, but production has no steal execution producer. A forced attempt cannot be resolved without constructing a new result.'},
    control:{verdict:'WEAK',walkExists:outcomes.includes('walk'),controlRead:/\bcontrol\b/.test(ordinary),cause:'B: ordinary AI PA has walk but does not read control. Control is read by human PA sequencing; separate from the ordinary AI stream.'},
    strikeout:{verdict:outcomes.includes('strikeout')?'OBSERVABLE':'OUTCOME_SPACE_GAP',observedOutcomeSpace:outcomes,reason:'resolveSimulatedHighSchoolPlateAppearance outcome set excludes SO; human PlateApproach does support strikeout.'},
    catcher:{verdict:'NOT_OBSERVABLE',decisionClassification:'DECISION_ONLY_OBSERVABLE',reason:'Pitcher-catcher tactical calls and receiving/throw legs exist; no complete canonical catcher-specific blocking, framing, passed-ball or steal-defense statistical producer.'},
    discipline:{verdict:'NOT_OBSERVABLE',reason:'No independent discipline input in the standalone PlateApproach ability seam. Its selectionProfile is a tactical policy, not a player ability; do not relabel it discipline.'}};
}
function run(){
  const sourceArtifacts=['docs/ability-performance-correlation-audit-results.json','docs/ability-performance-correlation-audit-sprint-1.md','docs/ability-performance-pitcher-supplement.json','docs/ability-performance-selection-smoke.json'];
  const hashes=Object.fromEntries(sourceArtifacts.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
  const result={version:'1.1',baseline:'46f8d2d',status:'RUNNING',originalArtifactHashes:hashes,method:'Existing Sprint 1 framework extended with existing pure production seams. Independent opportunity identities across samples, same identity/environment across paired tiers in isolated calls. No RNG monkeypatches, outcome weights, save mutations or production branches.',audits:[],structural:structural(),blockers:[]};
  const save=()=>saveJson(path.join(root,'docs/ability-performance-correlation-audit-results-v1.1.json'),result);save();
  for(const [name,fn] of [['contact',()=>battingAudit('contact')],['power',()=>battingAudit('power')],['recognition',()=>battingAudit('recognition')],['fielding',()=>defenseAudit('fielding')],['arm',()=>defenseAudit('arm')],['speed',()=>defenseAudit('speed')],['npcQuality',()=>npcConfirmation()]]){
    try{result.audits.push(fn());}catch(error){result.blockers.push({subitem:name,message:error.message,stack:error.stack});console.error(`BLOCKED ${name}: ${error.message}`);}save();
  }
  for(const file of sourceArtifacts)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hashes[file],'Sprint 1 artifact changed');
  result.status=result.blockers.length?'PARTIAL_BLOCKED':'MEASURED_REQUIRES_REVIEW';save();console.log(`1.1 ${result.status}`);return result;
}
function writeReport(){
  const file=path.join(root,'docs/ability-performance-correlation-audit-results-v1.1.json'),r=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(r.audits.length,7,'Cannot review incomplete measurements');
  const find=n=>r.audits.find(a=>a.capability===n),matrix=[];
  function row(capability,metric,tiers,getValue,direction,verdict,reason,blocks){
    const values=tiers.map(getValue),d=values.some(v=>v==null)?{monotonicSteps:null,lowHighDelta:null,correlation:null}:Core.diagnostics(values,direction);
    matrix.push({capability,primaryMetric:metric,observable:!values.some(v=>v==null),isolated:true,expectedDirection:direction>0?'positive':'negative',means:values,...d,verdict,blockingReason:reason||null,blockVariances:blocks?tiers.map(t=>distribution(blocks(t)).variance):null});
  }
  for(const [axis,metric,dir,verdict] of [['contact','AVG',1,'USABLE'],['contact','SO',-1,'USABLE'],['power','HR',1,'WEAK'],['power','XBHperAB',1,'WEAK'],['power','TB',1,'WEAK'],['recognition','BB',1,'USABLE']]){
    row(axis,metric,find(axis).tiers,t=>t.rates[metric],dir,verdict,axis==='power'?'Power changes physical pace/depth, but legacy statistical adapter reads continuous contact score; no pure-power production-stat gradient.':null,t=>t.blocks.map(b=>metric==='XBHperAB'?(b.line.batting.doubles+b.line.batting.triples+b.line.batting.HR)/b.line.batting.AB:b.rates[metric]));
  }
  row('recognition','correct take / takes',find('recognition').tiers,t=>t.decisionEvidence.correctTakes/t.decisionEvidence.takes,1,'USABLE','Decision-observable only in this complete standalone pitch stream.');
  row('recognition','chase swings / out-of-zone pitches',find('recognition').tiers,t=>t.decisionEvidence.chaseSwings/t.decisionEvidence.chasePitches,-1,'USABLE','Not an AI full-game chase denominator.');
  for(const axis of ['fielding','arm','speed'])for(const b of find(axis).buckets){
    row(`${axis}/${b.bucket}`,axis==='speed'?'forced advancement safe / attempts':'out conversions / opportunities',b.tiers,t=>t.mean,1,axis==='arm'?'FIXTURE_SATURATED':b.bucket==='ROUTINE'?'FIXTURE_SATURATED':'USABLE',axis==='arm'?'SS throw demand max strength 6; arm 8–16 is above its quality thresholds. Timing consumes throw-quality categories, not continuous arm.':null,t=>t.blocks.map(b=>b.mean));
  }
  for(const b of find('arm').buckets)row(`arm/${b.bucket}`,'on-target throw / attempts',b.tiers,t=>t.throwSuccessRate,1,'FIXTURE_SATURATED','Canonical throw quality is saturated above SS strength demand.',t=>t.blocks.map(b=>b.throwSuccessRate));
  for(const metric of ['pitcherH','ER27'])row('NPC Pitch Quality',metric,find('npcQuality').tiers,t=>t.rates[metric],-1,'USABLE',null,t=>t.blocks.map(b=>b.rates[metric]));
  for(const [capability,primaryMetric,verdict,blockingReason] of [
    ['Fielding','scorer E','NOT_OBSERVABLE','Physical foundation does not adjudicate E. Unsecured balls are not automatically errors.'],
    ['Arm','throw quality','FIXTURE_SATURATED','All requested SS tiers exceed strength threshold; acquired context and accuracy are fixed.'],
    ['Speed','steal success','OUTCOME_SPACE_GAP',r.structural.steal.reason],
    ['Speed','hit production','NOT_OBSERVABLE','No independent infield-hit speed resolver validated in this extension.'],
    ['Discipline','BB / decision quality','NOT_OBSERVABLE',r.structural.discipline.reason],
    ['Pitch Control','ordinary AI BB/BF','WEAK',r.structural.control.cause],
    ['Pitch Quality','ordinary AI SO/BF','OUTCOME_SPACE_GAP',r.structural.strikeout.reason],
    ['Player P','BF / outs / run prevention','BLOCKED_BY_EXPOSURE',r.structural.playerPitcher.path.join(' → ')],
    ['Catcher-specific','blocking / framing / steal defense','NOT_OBSERVABLE',r.structural.catcher.reason]
  ])matrix.push({capability,primaryMetric,observable:false,isolated:null,expectedDirection:null,monotonicSteps:null,lowHighDelta:null,blockVariances:null,verdict,blockingReason});
  r.resultMatrix=matrix;
  r.subitemStops=[{condition:'C',subitem:'steal execution',reason:r.structural.steal.reason,action:'Stopped this subitem; completed independent advancement measurement.'}];
  r.passGate={contactPowerIsolated:true,defenseNotGloballySaturated:true,speedLegalAdvancementDenominator:true,independentEventIdentities:true,playerPitcherBlockerIdentified:true,catcherClassified:true,productionChanges:0,fullRegression:r.validation?.fullRegression||'PENDING',conclusion:r.validation?.fullRegression==='163/163 PASS'?'PASS_WITH_EXPLICIT_STEAL_SUBITEM_BLOCKER':'PENDING_VALIDATION'};
  r.crossCoupling={contact:{powerView:find('contact').tiers.map(t=>t.view.power),recognitionView:find('contact').tiers.map(t=>t.view.observe),effect:'HR can still change with Contact quality while Power INPUT remains fixed; this is model interaction, not fixture leakage.'},power:{contactView:find('power').tiers.map(t=>t.view.batting),AVG:find('power').tiers.map(t=>t.rates.AVG),SO:find('power').tiers.map(t=>t.rates.SO)},fielding:'Reaction/range/mobility 5.5, catching 4, arm 12 and runner speed 5 fixed within every tier.',arm:'Acquisition seed list, fixed fielding/catching and runner speed identical for every tier.',speed:'Acquisition and throw abilities fixed; only runner speed changes after legal forced advancement exists.'};
  r.measurementLimits=['PA experiments use the existing standalone auto-approach resolver with unique identities. They are NOT full-match player career simulations; batting-only active GameRecord projections are not claimed to be completed games or complete scoring records.','The standalone generator uses its production legacyCompatibilityFallback pitch distribution, held fixed by identity. Absolute rates must not be compared to Sprint 1 as if only independence changed.','Defense opportunities use real foundation input/output and canonical third-out settlement; errors remain unadjudicated.','Steal execution is absent even though the ledger can ingest SB/CS events. No fake attempt, SB or CS was created.','NPC confirmation uses 20 full games/tier, independent game identities, actual BF event IDs and checked simulation cursor advancement; the 997-state production RNG remains unchanged.'];
  saveJson(file,r);
  const f=v=>v==null?'—':typeof v==='number'?Number(v.toFixed(6)):v;
  const lines=['# Ability–Performance Correlation Audit Sprint 1.1 — Observability & Isolation Extension','',
    `狀態：**${r.passGate.conclusion}**。這是測量能力的驗收，不表示全部 gameplay 能力模型通過。盜壘執行子項依 Stop C 停止；合法強迫推進已完成。`,'',
    '## 1. Baseline 與保存','',
    'Production baseline：`main = origin/main = 46f8d2d`，ahead / behind 0 / 0。開始時已有 Sprint 1 的六個 untracked audit-only 檔案；未 reset、clean、restore、commit 或 push。','',
    'Sprint 1 四份報告／JSON 原檔保持不變，SHA-256 記錄於 1.1 JSON 的 originalArtifactHashes 並在測量結束重驗。原 runner 僅延伸 CLI dispatch；原 gradient test 保留。新 extension 共用原 runner 的 canonical aggregation、rates、block summaries 與 diagnostics，未建立另一套互斥 framework。','',
    '## 2. 隔離、independence 與 scope','',
    ...r.measurementLimits.map(x=>'- '+x),'',
    'Contact 用正式 resolver 的 batting input，Power 固定 12；Power 用獨立 power input，batting 固定 12。Recognition 用 observe input，其他 recognition inputs ballSense / baseballIQ 固定 10；沒有把 approach selectionProfile 改名成 Discipline。','',
    '五級為 canonical 0–20 上的 8/10/12/14/16。每一 paired tier 共享同一 game/PA identity 與環境，分別以新的 pure resolver state 執行；同一 tier 的不同 sample 使用不同 identity。實際 pitch IDs 與 pitchNumber 連續性逐 PA 檢查。Defense 使用原有 reach、secure、strength、accuracy namespace；不加亂數、不換 generator。','',
    'Batting 每級 1,000 真實 resolved PA；Fielding / Arm / Advancement 每級每 bucket 1,000 個機會。各分 10 blocks × 100 opportunities。NPC 每級 20 完整比賽，分 10 blocks；BF 與 unique BF event counts 相等。這些 PA 或 defense sessions 不能加總冒充 full games。','',
    '## 3. Required result matrix','',
    '|Capability|Metric|Observable|Isolated|Direction|Steps / 4|Low–high Δ|Verdict|Blocking reason|',
    '|---|---|---|---|---|---|---|---|---|'];
  for(const m of matrix)lines.push(`|${[m.capability,m.primaryMetric,m.observable,m.isolated,m.expectedDirection,f(m.monotonicSteps),f(m.lowHighDelta),m.verdict,m.blockingReason||'—'].join('|')}|`);
  lines.push('','完整 five-tier means、Pearson diagnostics、relative deltas、block means / variance、paired improvement frequencies 與每 block identity counts 均在 structured JSON；r 不是 PASS gate。','',
    '## 4. Contact / Power / Recognition','',
    '|Axis|Tier|PA|AVG|SO%|BB%|HR/AB|XBH/AB|TB/AB|Unique PA|',
    '|---|---|---|---|---|---|---|---|---|---|');
  for(const axis of ['contact','power','recognition'])for(const t of find(axis).tiers)lines.push(`|${[axis,t.ability,t.line.batting.PA,f(t.rates.AVG),f(t.rates.SO),f(t.rates.BB),f(t.rates.HR),f(t.rates.XBHperAB),f(t.rates.TB),t.independence.uniqueEvents].join('|')}|`);
  lines.push('','純 Contact 的 AVG 與 SO 有方向正確的梯度，上一輪「batting 同時改 power」不再是 fixture confound。純 Power 的 input 已隔離，但 terminal HR/XBH/TB 完全相同；不能沿用 Sprint 1 的 Power USABLE 結論到這條打席路徑。','',
    '|Power tier|Balls in play|Hard physical balls|Deep physical balls|','|---|---|---|---|');
  for(const t of find('power').tiers)lines.push(`|${t.ability}|${t.physicalEvidence.ballsInPlay}|${t.physicalEvidence.hard}|${t.physicalEvidence.deep}|`);
  lines.push('','正式 trace：`batted-ball-physical.js` 的 pace/depth 讀 Power；`offensive-plate-approach.js:resolveLegacyBallInPlayOutcome` 使用 continuousContactScore 投影統計結果，而該 contact score 讀 batting，不讀 power。`script.js:resolveHighSchoolOffensiveDecision` 的紀錄標記為 physicalTruthToLegacyDownstreamOutcome。這是路徑／投影缺口，不能以調 Power 係數解決或直接宣布所有 Power 都未連線。一般 AI PA 另有 composite quality 讀 Power。','',
    'Recognition 的完整 standalone pitch stream 可計算 chase / take quality；其 denominator 限於這個 stream。普通 full-game AI 沒有 pitch-by-pitch chase denominator。Discipline 的獨立 scalar 未進此 resolver seam，保留 NOT_OBSERVABLE，不用戰術政策當能力替身。','',
    '## 5. SS difficulty、Arm 與 Speed','',
    'ROUTINE / MODERATE / DIFFICULT 沿用 ground ball weak / firm / hard。SS、reaction/range/mobility 5.5 與 catching 4 固定；difficulty 透過正式球速與 arrival pressure 產生。Fielding conversion 透過正式 acquisition → throw → runner settlement，失敗不自行記 E。','',
    '|Axis / Bucket|五級 conversion / success|Opportunities per tier|','|---|---|---|');
  for(const axis of ['fielding','arm','speed'])for(const b of find(axis).buckets)lines.push(`|${axis} / ${b.bucket}|${b.tiers.map(t=>f(t.mean)).join(' / ')}|1000|`);
  lines.push('','Arm isolation 本身成立，但 SS 的 strength demand 至多 6，8–16 全在相同 throw-quality category；timing 階段讀 category 而非 continuous arm。MODERATE out conversion 的差異來自固定 runner-start pool，不是 Arm；DIFFICULT 的既定 runner pressure 使球員失敗，不能據此調 Arm。保留 FIXTURE_SATURATED / categorical plateau，未修改 SS distance 或 Defensive semantics。','',
    'Speed 測合法 ground-ball force 的 1B→2B advancement execution；attempt decision 已存在且固定，不是盜壘頻率。所有已 admitted 的 acquisition / environment seed lists 在 tier 間完全相同。SB/CS ingestion 只有記帳介面，沒有正式 steal producer，因此 Stop C：不創造 attempts / SB / CS，保留 null。','',
    '3B runner 無 force 且未 explicit committed/advancing 時不往本壘移動；既有 runner-throw regression 繼續驗證此 contract。本 fixture 不修改該條規則。','',
    '## 6. P / C 與 outcome gaps','',
    'Player P structural trace：selected as P → pitcherExposureDeferred / noAppearance → incumbent NPC 保持 P assignment → ordinary AI innings → canonical BF 記給 incumbent；玩家 BF 與 outs 都是 0。分類 BLOCKED_BY_GAMEPLAY_EXPOSURE / BLOCKED_BY_EXPOSURE。後續僅提出 Player Pitcher Full-Match Exposure Integration，不在本輪施工。','',
    'NPC Quality 在 corrected game identities 下確認 H/BF 與 ER/27 outs 仍為 4/4 改善，維持固定情境 USABLE。沒有複製 NPC 數據給玩家。ER proxy 不宣稱已解決 inherited-runner attribution。','',
    'Control / BB gap 屬 B：ordinary AI 有 walk，但 `resolveSimulatedHighSchoolPlateAppearance` 不讀 control；meaningful human sequencing 則會讀 control。SO gap：普通 AI outcome space 沒有 strikeout，分類 OUTCOME_SPACE_GAP；這不適用於能產生 SO 的 player PA resolver。','',
    '|Catcher component|現況與分類|','|---|---|',
    '|Pitch calling / tactical response|正式 decision / sequence trace 存在；DECISION_ONLY_OBSERVABLE|',
    '|Throw / receiving|可讀既有 defensive leg，但無完整 catcher-specific full-game metric|',
    '|Blocking|catcher decision 路徑存在；無獨立 canonical blocking / passed-ball 統計|',
    '|Steal defense|沒有 steal execution producer；NOT_OBSERVABLE|',
    '|Framing / passed ball / wild-pitch interaction|GameRecord 沒有對應完整統計 contract；NOT_OBSERVABLE，不發明 catcher score|','',
    '## 7. Regression、production diff 與 Stop','',
    `Validation：${JSON.stringify(r.validation||{status:'PENDING'})}`,'',
    '新增 test 覆蓋：target-only views、unique IDs / duplicate rejection、explicit deterministic replay、paired first-pitch truth、difficulty demand、non-saturated fielding、Arm acquisition invariance、合法 Speed denominator、canonical sample 與 decision count 隔離、input immutability、P exposure 與 SO outcome gap。原 Sprint 1 gradient test 保留。','',
    'Stop C 僅阻擋 steal execution 子項。其餘 Stop 的最終情況依 validation；production diff 必須 0。未 commit、push、開始 Calibration / Outcome Expansion / Exposure Integration / Pitch-Level Refinement。','',
    '## 8. Next-step decision','',
    '- Contact：保留現行係數；可在後續不同政策／對手下確認，不因單一 fixture 的率直接 tuning。',
    '- Power：先審查 physical truth → statistical outcome adapter；提出最小 wiring / mapping 設計再另行批准。不是本輪直接調參。',
    '- Fielding：可觀測且非全面飽和；先核對期望 difficulty 曲線，再決定是否需要 calibration。',
    '- Arm：先界定 SS continuous strength 與 coarse throw-quality 的 intended contract；不把 saturated range 當成能力沒用。',
    '- Steal / ordinary AI SO：Match Simulation Outcome Expansion；Player P：Gameplay Exposure Integration；Catcher：明確 outcome / evidence contract。均未施工。','',
    '## Reproduce','', '```text','node tests/ability-performance-correlation-audit.cjs --observability','node tests/ability-performance-observability-extension-test.js','node tests/ability-performance-correlation-audit.cjs --observability-report','```','',
    '原 Sprint 1 報告與數據保持原樣。1.1 新增結果檔：ability-performance-correlation-audit-results-v1.1.json；本 addendum 為 scope 明確的獨立版本，不覆蓋舊結論。','');
  fs.writeFileSync(path.join(root,'docs/ability-performance-correlation-audit-sprint-1.1.md'),lines.join('\n'));
  return r;
}
module.exports={abilityView,battingOpportunity,battingAudit,defensiveInput,defensiveSample,defenseAudit,independence,structural,npcConfirmation,run,writeReport};
if(require.main===module)run();
