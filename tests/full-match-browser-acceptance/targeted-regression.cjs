'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createContext}=require('../helpers/canonical-match-contract-context.cjs');
const ui=require('../../match-pitch-decision-ui.js');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/design-optimization/full-match-browser-2026-10-31');
const rows=[];
function test(name,fn){try{rows.push({name,status:'PASS',detail:fn()});}catch(e){rows.push({name,status:'FAIL',error:e.stack});}console.log(rows.at(-1).status+' '+name);}
const field=value=>({status:'available',value});
test('outfield opportunity keeps the active actor in its requested position',()=>{
  for(const [position,code] of [['外野手','LF'],['左外野手','LF'],['中外野手','CF'],['右外野手','RF']]){
    const h=createContext();h.run(`loadTestBookmark('highSchool');applyCanonicalPositionProfile(player,${JSON.stringify(position)},[]);
      player.highSchoolStep=5;applyHighSchoolRoleState('starter');pendingHighSchoolMatchSimulationSeed=49186;
      var m=prepareHighSchoolYearOneMatch({confirmHealthReadiness:true});`);
    const m=h.json('m'),actor=m.rosters.home.lineup.find(a=>a.id==='player');
    assert.equal(actor.defensivePosition,code);assert.equal(m.gameRecord.playerLines.player.position,code);
    assert.equal(m.rosters.home.lineup.filter(a=>a.defensivePosition===code).length,1);
    assert.equal(h.run('getHighSchoolRequestedRosterPosition("內野手","RF")'),'2B');
    assert.equal(h.run('getHighSchoolRequestedRosterPosition("外野手","2B")'),'LF');
  }
});
test('specific-position status panel uses existing family display without Player mutation',()=>{
  const h=createContext();h.run("loadTestBookmark('highSchool');");
  for(const position of ['一壘手','二壘手','游擊手','三壘手','左外野手','中外野手','右外野手']){
    h.run(`applyCanonicalPositionProfile(player,${JSON.stringify(position)},[]);`);
    const before=h.run('JSON.stringify(player)'),html=h.run('renderPositionPanel()');
    assert(html.includes(position));assert(html.includes('共通項目'));assert.equal(h.run('JSON.stringify(player)'),before);
  }
});
test('new public beat cannot display the retained previous PA pitch or settlement',()=>{
  const p={snapshot:{identity:{matchId:field('m'),paId:{status:'unavailable'}},game:{},decision:{waiting:false}},timeline:{events:[
    {type:'DECISION_ACCEPTED',paId:'old',order:{sourceSequence:3}},
    {type:'PITCH_RESOLVED',paId:'old',order:{sourceSequence:3},facts:{pitchResult:'calledStrike'}},
    {type:'PA_SETTLED',paId:'old',order:{sourceSequence:3},facts:{result:'strikeout'}},
    {type:'MATCH_STATE',order:{sourceSequence:4},facts:{inning:2,half:'上'}}]}};
  const before=JSON.stringify(p),m=ui.createShellModel(p);
  assert.equal(m.paId,null);assert.equal(m.latest,null);assert.equal(m.currentSettlement,null);assert.equal(m.pendingResolution,false);assert.equal(JSON.stringify(p),before);
  p.snapshot.identity.paId=field('current');p.snapshot.decision.waiting=true;
  p.timeline.events.push({type:'PITCH_RESOLVED',paId:'current',order:{sourceSequence:5},facts:{pitchResult:'foul'}});
  assert.equal(ui.createShellModel(p).latest.paId,'current');
});
test('official highSchool bookmark admits ordinary school without Direct Start',()=>{
  const h=createContext();h.run("loadTestBookmark('highSchool');");
  const s=h.json('({school:player.schoolInvitationState,direct:player.flags.includes("direct_start_history"),step:player.highSchoolStep})');
  assert(s.school.selectionFinalized);assert.equal(s.school.compatibilityMode,'generation-only');
  assert.equal(s.school.invitations.find(x=>x.schoolId===s.school.selectedSchoolId).schoolTier,'standard');assert(!s.direct);assert.equal(s.step,0);
  return {schoolId:s.school.selectedSchoolId,generationSeed:s.school.generationSeed};
});
test('first confirmation refreshes health and keeps opportunity identity/variation',()=>{
  const source=fs.readFileSync(path.join(root,'docs/design-optimization/health-opportunity-candidate-v1/formal-verification.cjs'),'utf8');
  const start=source.indexOf('function context(label)'),end=source.indexOf('for(const seed of spec.seeds)');
  const api=new Function('require','path','env','spec','assert','sha',source.slice(start,end)+';return {setup,choose,body,healthCheck,identity};')(require,path,{candidate:root},{},assert,v=>JSON.stringify(v));
  const h=api.setup('candidate',77881,'捕手');
  api.body(h,{fatigue:9,pain:2,injuryRisk:3});
  const old=h.json('createHighSchoolPlayingTimeOpportunity({matchId:"hs-y1-autumn-exhibition",actualRole:player.highSchoolRoleCode})');
  api.choose(h,'high_school_long_bench',2);
  const health=api.healthCheck(h),m=h.json('player.highSchoolMatch');
  assert(m.gameExposureState.opportunitySnapshot.debug.scoreBreakdown.healthReadiness<0);
  const frozen=JSON.stringify(m.gameExposureState.opportunitySnapshot);
  h.run('player.body.fatigue=0;prepareHighSchoolYearOneMatch();');
  assert.equal(JSON.stringify(h.json('player.highSchoolMatch.gameExposureState.opportunitySnapshot')),frozen);
  return {health,oldDecisionId:old.decisionId,lockedDecisionId:m.gameExposureState.opportunitySnapshot.decisionId,seed:m.simulationSeed};
});
test('phone retry rolls back full Player and succeeds once on admitted zero-appearance match',()=>{
  const h=createContext();
  h.run(`loadTestBookmark('highSchool');applyCanonicalPositionProfile(player,'投手',[]);player.highSchoolStep=5;applyHighSchoolRoleState('starter');
    pendingHighSchoolMatchSimulationSeed=49186;var m=prepareHighSchoolYearOneMatch({confirmHealthReadiness:true});
    var safety=0;while(!m.completed&&safety++<2000)advanceHighSchoolMatchPlaybackStep(m);
    if(!m.completed)throw Error('no-appearance match timeout');showHighSchoolCompletedMatchOutcome(m);continueYouthSeasonOutcome();`);
  assert.equal(h.run('getCurrentEventId()'),'high_school_call_home');
  const before=h.json('player');
  h.run('var originalPrepare=prepareHighSchoolFollowupEvaluationMatch;prepareHighSchoolFollowupEvaluationMatch=function(){originalPrepare();throw Error("registered post-build retry fault");};');
  for(let n=0;n<2;n++){
    assert.throws(()=>h.run('choose("high_school_call_home",2);'),/registered post-build/);
    assert.deepEqual(h.json('player'),before);assert.equal(h.run('isTransitioning'),false);
  }
  h.run('prepareHighSchoolFollowupEvaluationMatch=originalPrepare;choose("high_school_call_home",2);');
  assert.equal(h.run('player.highSchoolMatch.id'),'hs-y1-followup-evaluation-2');
  assert.equal(h.run('player.highSchoolStep'),7);
  const after=h.json('player');
  h.run('choose("high_school_call_home",2);');assert.deepEqual(h.json('player'),after);
  h.run('stopHighSchoolMatchPlayback();saveGame();loadGame();');
  assert.equal(h.run('getCurrentEventId()'),'high_school_followup_evaluation');
  assert.equal(h.run('isHighSchoolMatchPlaybackScheduled()'),true);
  assert.equal(h.run('player.highSchoolMatch.simulationSeed'),after.highSchoolMatch.simulationSeed);
  assert.equal(h.run('player.highSchoolMatch.simulationCursor'),after.highSchoolMatch.simulationCursor);
  return h.json('({seed:player.highSchoolMatch.simulationSeed,planned:player.highSchoolMatch.gameExposureState.plannedUsage})');
});
fs.writeFileSync(path.join(out,'targeted-regression.json'),JSON.stringify({rows},null,2));
if(rows.some(r=>r.status==='FAIL'))process.exitCode=1;
