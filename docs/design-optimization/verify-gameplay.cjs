"use strict";
// Calls unchanged production entry points through the repository's existing in-memory browser harness.
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const {makeContext}=require("../../tests/high-school-career-test-context.js");
const N=Number(process.env.DESIGN_AUDIT_SAMPLE||16);
const report={version:1,node:process.version,samples:N,scope:"Y1 engine fixtures + separately recorded natural event progression; no synthetic match outcomes",checks:[],experiments:{},limitations:[]};
const digest=v=>crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex");
function check(name,fn){try{const evidence=fn();report.checks.push({name,status:"PASS",evidence});console.log("PASS "+name);}catch(e){report.checks.push({name,status:"FAIL",error:e.stack});console.log("FAIL "+name+": "+e.message);}}
const h=makeContext();
h.run(`
  var __auditRandomState=1;
  function __auditRandom(){__auditRandomState=(Math.imul(__auditRandomState,1664525)+1013904223)>>>0;return __auditRandomState/4294967296;}
  Math.random=__auditRandom;
  function __auditReset(seed=44001,role="starter",skill=8,body={fatigue:0,pain:0,injuryRisk:0}){
    stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;pendingTrainingOutcome=null;isTransitioning=false;__auditRandomState=seed;
    player=createRepresentativeHighSchoolEntryFixture("ordinary",44001);player.name="Design audit";
    applyCanonicalPositionProfile(player,"游擊手",["二壘手"]);
    player.schoolInvitationState=createDefaultSchoolInvitationState();
    const invitations=generateSchoolInvitationSet(player,{generationSeed:"design-audit-44001"});
    finalizeSchoolInvitationSelection(player,invitations.invitations[0].schoolId);
    materializeSelectedHighSchoolRoster(player,{rosterRole:"bench",playerPosition:"游擊手"});
    completeHighSchoolEntry({source:"design-audit"});
    Object.keys(player.baseballSkills).forEach(k=>player.baseballSkills[k]=skill);
    ["ballSense","observe","fitness","instinct","discipline"].forEach(k=>player[k]=8);
    Object.assign(player.body,body);player.relationships.coachTrust=8;
    player.highSchoolStep=5;applyHighSchoolRoleState(role);player.highSchoolYearOneStartingRole=role;
    pendingHighSchoolMatchSimulationSeed=seed;__auditRandomState=seed;
    return prepareHighSchoolYearOneMatch();
  }
  function __auditPlay(policy="first",max=5000){
    const match=player.highSchoolMatch;let ticks=0,choices=0,seen={};
    while(!match.completed&&ticks++<max){
      if(pendingYouthSeasonOutcome){continueYouthSeasonOutcome();continue;}
      if(isHighSchoolMatchDecisionVisible(match)){
        const legal=getHighSchoolYearOneMatchMomentChoices(match);
        let c=legal[0];
        if(policy==="last")c=legal[legal.length-1];
        if(!c)throw Error("No legal choice "+match.currentMomentId);
        seen[c.matchDecision]=(seen[c.matchDecision]||0)+1;choices++;
        chooseHighSchoolYearOneMatchMoment(c.matchDecision,c.matchMomentId,__auditRandom);
      }else advanceHighSchoolMatchPlaybackStep(match);
    }
    if(!match.completed)throw Error("Liveness limit "+match.simulationPhase+" "+match.currentMomentId);
    MatchGameRecord.assertIntegrity(match.gameRecord);
    assertHighSchoolMatchStateIntegrity(match,"design-audit-end");
    return {ticks,choices,seen,record:match.gameRecord,contribution:match.playerContribution,completedMoments:match.completedMoments,
      teamResult:match.teamResult,coachReaction:match.coachReaction,consequence:match.consequence,
      exposure:match.gameExposureState,evaluation:player.highSchoolCompetitionEvaluation,next:player.highSchoolNextOpportunity,
      role:player.highSchoolRoleCode,body:player.body};
  }
`);
function reset(seed,role="starter",skill=8,body={fatigue:0,pain:0,injuryRisk:0}){h.run(`__auditReset(${seed},${JSON.stringify(role)},${skill},${JSON.stringify(body)})`);}
function play(policy="first"){return h.json(`__auditPlay(${JSON.stringify(policy)})`);}
function compact(r){const line=r.record.playerLines.player;return {recordDigest:digest(r.record),line,contribution:r.contribution,moments:r.completedMoments.map(m=>({decision:m.decision,decisionQuality:m.decisionQuality,executionQuality:m.executionQuality,tier:m.tier})),teamResult:r.teamResult,coachReaction:r.coachReaction,exposure:{appearanceType:r.exposure.appearanceType,plateAppearances:r.exposure.plateAppearances,defensiveInnings:r.exposure.defensiveInnings},evaluation:r.evaluation,next:r.next,role:r.role,body:r.body,choices:r.choices,seen:r.seen};}
check("Y1 complete actual match engine smoke",()=>{reset(44001);const r=play();report.experiments.smoke=compact(r);return {ticks:r.ticks,choices:r.choices};});
check("Y1 paired health and role opportunity inputs",()=>{
 const arms=[];
 for(const role of ["starter","rotation","bench"])for(const body of [{fatigue:0,pain:0,injuryRisk:0},{fatigue:16,pain:8,injuryRisk:12}]){
  reset(44002,role,8,body);
  arms.push(h.json(`({role:player.highSchoolRoleCode,body:player.body,opportunity:player.highSchoolMatch.gameExposureState.opportunitySnapshot,
    offense:getOffensiveSimulationCapability(player),defense:getDefensiveSimulationCapability(player),provisional:resolveHighSchoolProvisionalRole()})`));
 }
 report.experiments.healthOpportunity=arms;assert.equal(arms.length,6);return arms.map(a=>({role:a.role,body:a.body,planned:a.opportunity.plannedUsage,score:a.opportunity.scoreBreakdown,provisional:a.provisional.code}));
});
check("Paired full matches health / capability / role / policy",()=>{
 const rows=[];
 for(let i=0;i<N;i++){
  const seed=45000+i;
  for(const arm of ["healthy","loaded","strong-loaded","ordinary-healthy","rotation","bench","last-choice"]){
   const body=["loaded","strong-loaded"].includes(arm)?{fatigue:16,pain:8,injuryRisk:12}:{fatigue:0,pain:0,injuryRisk:0};
   reset(seed,arm==="rotation"?"rotation":arm==="bench"?"bench":"starter",arm==="strong-loaded"?16:arm==="ordinary-healthy"?6:8,body);
   rows.push({seed,arm,...compact(play(arm==="last-choice"?"last":"first"))});
  }
  if((i+1)%4===0)console.log(`samples ${i+1}/${N}`);
 }
 report.experiments.pairedMatches=rows;return {matches:rows.length,pairedHealthEqual:rows.filter(r=>r.arm==="healthy").filter(a=>a.recordDigest===rows.find(b=>b.seed===a.seed&&b.arm==="loaded").recordDigest).length};
});
check("Save/load before decision reproduces official record and settlement",()=>{
 reset(46001);
 let ticks=0;while(!h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)')&&ticks++<3000)h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)');
 assert(ticks<3000);h.run('stopHighSchoolMatchPlayback();saveGame();');
 const raw=h.storage.get("baseballLifeRpgSave"),state=h.run('__auditRandomState');assert(raw);
 const a=play();h.run('pendingYouthSeasonOutcome=null;pendingTrainingOutcome=null;isTransitioning=false;loadGame();stopHighSchoolMatchPlayback();');
 h.run(`__auditRandomState=${state}`);const b=play();
 assert.equal(digest(a.record),digest(b.record));assert.equal(digest(a.evaluation),digest(b.evaluation));assert.equal(digest(a.next),digest(b.next));
 const before=h.json('({evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,development:player.developmentState,skills:player.baseballSkills,next:player.highSchoolNextOpportunity})');
 const duplicate=h.json('({settle:settleHighSchoolYearOneMatch(player.highSchoolMatch,"zone"),evaluation:applyHighSchoolCompetitionMatchSettlement(player.highSchoolMatch)})');
 const after=h.json('({evaluation:player.highSchoolCompetitionEvaluation,history:player.highSchoolOpportunityHistory,development:player.developmentState,skills:player.baseballSkills,next:player.highSchoolNextOpportunity})');
 assert.deepEqual(after,before);assert.equal(duplicate.evaluation.status,"duplicate");
 return {recordDigest:digest(a.record),duplicate,seedStateRestoredForInjectedRandom:true};
});
check("Natural Y1 events through two real matches and year-end",()=>{
 reset(47001,"rotation",8);h.run('player.highSchoolMatch=createInitialPlayer().highSchoolMatch;player.highSchoolStep=0;player.highSchoolRoleCode="";player.highSchoolYearOneStartingRole="";player.highSchoolOpportunityHistory=[];player.highSchoolCompetitionEvaluation=null;showCurrentEvent();');
 const events=[],matches=[];let limit=0;
 while(h.run('player.chapter')!=="青棒第一年小結"&&limit++<60){
  if(h.run('Boolean(pendingYouthSeasonOutcome)')){h.run('continueYouthSeasonOutcome()');continue;}
  const id=h.run('getCurrentEventId()');events.push(id);
  if(["high_school_showcase","high_school_followup_evaluation"].includes(id)){
   matches.push(compact(play()));h.run('showHighSchoolCompletedMatchOutcome(player.highSchoolMatch);continueYouthSeasonOutcome();');
  }else {h.run(`choose(${JSON.stringify(id)},0)`);h.flushTransitions();}
 }
 const outcome=h.json('({chapter:player.chapter,history:player.highSchoolYearOneMatchHistory,complete:player.highSchoolYearOneComplete,azhe:player.highSchoolAzheEcho,rival:player.highSchoolRivalContext,event:getCurrentEventId()})');
 report.experiments.naturalLoop={events,matches,outcome};assert.equal(outcome.chapter,"青棒第一年小結");assert.equal(outcome.history.length,2);
 const staleBefore=h.json('({skills:player.baseballSkills,body:player.body,relationships:player.relationships,history:player.highSchoolYearOneMatchHistory})');
 h.run('choose("high_school_intro",0);continueYouthSeasonOutcome();');
 assert.deepEqual(h.json('({skills:player.baseballSkills,body:player.body,relationships:player.relationships,history:player.highSchoolYearOneMatchHistory})'),staleBefore);
 return {events,history:outcome.history.map(x=>({id:x.matchId,index:x.opportunityIndex})),chapter:outcome.chapter,staleChoiceNoEffect:true};
});
check("Y1 injury recovery then opportunity refresh boundary",()=>{
 reset(48001,"starter",8,{fatigue:16,pain:8,injuryRisk:12});
 const before=h.json('({health:player.body,planned:player.highSchoolMatch.gameExposureState.opportunitySnapshot,role:resolveHighSchoolProvisionalRole()})');
 h.run('applyBodyEffects({fatigue:-12,pain:-7,injuryRisk:-10});');
 const after=h.json('({health:player.body,existing:player.highSchoolMatch.gameExposureState.opportunitySnapshot,fresh:createHighSchoolPlayingTimeOpportunity({matchId:"recovery-comparison",actualRole:"starter",requestedPosition:"游擊手",includeDynamicReadiness:true}),role:resolveHighSchoolProvisionalRole()})');
 report.experiments.recoveryBoundary={before,after};assert.deepEqual(after.existing,before.planned);return {beforeRole:before.role.code,afterRole:after.role.code,existingPlanUnchanged:true};
});
check("No-appearance and win/loss independence in official evaluation owner",()=>{
 const R=require("../../high-school-competition-reassessment.js");
 const base={match:{id:"design-isolated-evidence",completedMoments:[{decisionQuality:"strong",executionQuality:"complete"}],playerContribution:{strong:1,failure:0}},exposure:{participated:true,plateAppearances:1,defensiveInnings:1},readiness:{positionReadiness:5,positionFit:5},coachTrust:6,health:{fatigue:0,pain:0,injuryRisk:0}};
 const variants=[];for(const tier of ["strong","poor","noAppearance"])for(const win of [true,false]){
  const x=JSON.parse(JSON.stringify(base));x.match.scores={home:win?4:1,away:win?1:4};x.match.teamResult=win?"球隊勝利":"球隊落敗";
  if(tier==="poor"){x.match.completedMoments=[{decisionQuality:"poor",executionQuality:"failed"}];x.match.playerContribution={failure:1};}
  if(tier==="noAppearance"){x.match.completedMoments=[];x.match.playerContribution={};x.exposure={participated:false,plateAppearances:0,defensiveInnings:0,appearanceType:"noAppearance"};}
  variants.push({tier,win,evidence:R.collectCompetitionEvidence(x)});
 }
 report.experiments.controlledEvidence=variants;
 for(const tier of ["strong","poor","noAppearance"])assert.deepEqual(variants.filter(x=>x.tier===tier).map(x=>x.evidence.sampleScore)[0],variants.filter(x=>x.tier===tier).map(x=>x.evidence.sampleScore)[1]);
 return variants.map(x=>({tier:x.tier,win:x.win,score:x.evidence.sampleScore}));
});
report.limitations.push("Fixture cohorts force canonical roles and capabilities to isolate factors; they are not a population frequency estimate or the normal creation distribution.","Fixed LCG injected through the existing choice randomSource and VM Math.random; match simulationSeed and deterministic PA identities remain production-owned. Reload comparison restores the external injected RNG state explicitly.","Controlled evaluation inputs exercise the official owner but are not naturally generated win/loss matches. Natural cohort results are recorded separately.","No browser visual/playability QA, no adult-career full traversal, no claims of equal policy win rates.");
fs.writeFileSync(path.join(__dirname,"gameplay-results.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report.checks.map(({name,status,error,evidence})=>({name,status,error,evidence})),null,2));
if(report.checks.some(c=>c.status!=="PASS"))process.exitCode=1;
