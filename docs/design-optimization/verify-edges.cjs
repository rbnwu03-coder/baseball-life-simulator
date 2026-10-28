"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {makeContext}=require("../../tests/high-school-career-test-context.js");
const h=makeContext(),out={checks:[],experiments:{}};
function check(name,fn){try{const evidence=fn();out.checks.push({name,status:"EXECUTED",evidence});console.log(name+" "+JSON.stringify(evidence));}catch(e){out.checks.push({name,status:"ERROR",error:e.stack});console.log(name+" ERROR "+e.message);}}
h.run(`
 function __edgeBase(position="游擊手"){
  stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;pendingTrainingOutcome=null;isTransitioning=false;
  player=createRepresentativeHighSchoolEntryFixture("ordinary",44001);player.name="Edge audit";
  applyCanonicalPositionProfile(player,position,[]);player.schoolInvitationState=createDefaultSchoolInvitationState();
  const s=generateSchoolInvitationSet(player,{generationSeed:"design-audit-edge"});finalizeSchoolInvitationSelection(player,s.invitations[0].schoolId);
  materializeSelectedHighSchoolRoster(player,{rosterRole:"bench",playerPosition:position});completeHighSchoolEntry({source:"design-audit-edge"});
  player.highSchoolStep=5;applyHighSchoolRoleState("starter");player.highSchoolYearOneStartingRole="starter";pendingHighSchoolMatchSimulationSeed=45011;
 }
`);
check("Y2 training tradeoff sweep through real Development owner",()=>{
 const rows=[];
 for(const skill of [2,8,14,18,20])for(const trait of [2,5,8])for(const code of ["power-hitting","contact-control","defensive-footwork","throwing-basics","recovery"]){
  h.run(`player=createRepresentativeHighSchoolEntryFixture("ordinary",44001);Object.keys(player.baseballSkills).forEach(k=>player.baseballSkills[k]=${skill});player.ballSense=${trait};player.observe=${trait};player.fitness=${trait};player.body.fatigue=6;player.developmentState=createDefaultDevelopmentState();`);
  rows.push(h.json(`(()=>{const code=${JSON.stringify(code)},r=BaseballTrainingResolver.resolveTraining(createTrainingPlayerSnapshot(),code);const a=applyResolvedTrainingResult(r,"high_school_year_two_training_a");return {skill:${skill},trait:${trait},code,ok:a.ok,progress:a.developmentApplication?.result?.progressGained||0,target:a.developmentApplication?.result?.targetSkill||null,levelUps:a.developmentApplication?.result?.levelUps||0,fatigue:player.body.fatigue,topLevel:r.topLevelDeltas,development:a.developmentApplication?.result?.diagnostics||null};})()`));
 }
 out.experiments.training=rows;assert(rows.every(r=>r.ok));
 return {cases:rows.length,battingPairs:rows.filter(r=>r.code==="power-hitting").map(p=>{const c=rows.find(c=>c.skill===p.skill&&c.trait===p.trait&&c.code==="contact-control");return {skill:p.skill,trait:p.trait,power:p.progress,contact:c.progress,powerFatigue:p.fatigue,contactFatigue:c.fatigue};})};
});
check("Pitcher actual no-appearance match and post-match claims",()=>{
 h.run('__edgeBase("投手");prepareHighSchoolYearOneMatch();');
 let ticks=0;while(!h.run('player.highSchoolMatch.completed')&&ticks++<3000){
  if(h.run('Boolean(pendingYouthSeasonOutcome)'))h.run('continueYouthSeasonOutcome()');
  else if(h.run('isHighSchoolMatchDecisionVisible(player.highSchoolMatch)'))throw Error("Unexpected pitcher manual moment");
  else h.run('advanceHighSchoolMatchPlaybackStep(player.highSchoolMatch)');
 }
 assert(ticks<3000);
 const r=h.json('({exposure:player.highSchoolMatch.gameExposureState,summary:player.highSchoolMatch.performanceSummary,coach:player.highSchoolMatch.coachReaction,feedback:player.highSchoolMatch.competitionFeedback,rival:prepareHighSchoolRivalPressure(),moments:player.highSchoolMatch.completedMoments,team:player.highSchoolMatch.teamResult,line:player.highSchoolMatch.gameRecord.playerLines.player||null})');
 out.experiments.noAppearance=r;assert.equal(r.exposure.appearanceType,"noAppearance");assert.equal(r.moments.length,0);
 return {appearance:r.exposure.appearanceType,pitcherDeferred:r.exposure.opportunitySnapshot.pitcherExposureDeferred,coach:r.coach,feedback:r.feedback,rival:r.rival.encounter};
});
check("Y1 post-choice fresh-runtime save reload state and reading boundary",()=>{
 h.run('__edgeBase();player.highSchoolStep=0;player.highSchoolMatch=createInitialPlayer().highSchoolMatch;choose("high_school_intro",0);saveGame();');
 const before=h.json('({step:player.highSchoolStep,pending:!!pendingYouthSeasonOutcome,flags:player.flags,body:player.body,memories:player.memories})'),raw=h.storage.get("baseballLifeRpgSave");
 const fresh=makeContext();fresh.storage.set("baseballLifeRpgSave",raw);fresh.run('loadGame();stopHighSchoolMatchPlayback();');
 const after=fresh.json('({step:player.highSchoolStep,pending:!!pendingYouthSeasonOutcome,flags:player.flags,body:player.body,memories:player.memories,event:getCurrentEventId()})');
 assert.deepEqual(after.flags,before.flags);assert.deepEqual(after.body,before.body);assert.deepEqual(after.memories,before.memories);assert.equal(after.step,before.step);
 out.experiments.y1OutcomeReload={before,after};return {beforePending:before.pending,afterPending:after.pending,restoredEvent:after.event,statePreserved:true};
});
check("Y2 training result save/reload and duplicate click",()=>{
 h.run('__edgeBase();player.chapter="青棒第二年";player.highSchoolYearTwoStep=1;player.forcedEventId="high_school_year_two_training_a";showCurrentEvent();');
 assert.equal(h.run('getCurrentEventId()'),"high_school_year_two_training_a");
 h.run('chooseHighSchoolTraining("high_school_year_two_training_a","contact-control");');
 const before=h.json('({fatigue:player.body.fatigue,development:player.developmentState,flags:player.flags,trust:player.relationships.coachTrust})');
 assert.equal(h.run('chooseHighSchoolTraining("high_school_year_two_training_a","contact-control")'),false);
 assert.deepEqual(h.json('({fatigue:player.body.fatigue,development:player.developmentState,flags:player.flags,trust:player.relationships.coachTrust})'),before);
 h.run('saveGame();loadGame();');
 const same=h.json('({pending:!!pendingTrainingOutcome,event:getCurrentEventId(),choose:choose(getCurrentEventId(),0)})');
 const fresh=makeContext();fresh.storage.set("baseballLifeRpgSave",h.storage.get("baseballLifeRpgSave"));fresh.run('loadGame();');
 const restored=fresh.json('({pending:!!pendingTrainingOutcome,event:getCurrentEventId(),fatigue:player.body.fatigue,development:player.developmentState,trust:player.relationships.coachTrust})');
 assert.deepEqual(restored.development,before.development);assert.equal(restored.trust,before.trust);
 out.experiments.y2TrainingReload={before,same,restored};return {duplicateNoEffect:true,sameRuntime:same,freshRuntime:{pending:restored.pending,event:restored.event},growthPreserved:true};
});
check("Azhe branch threshold and persistence plus role-only rival context",()=>{
 const rows=[];
 for(const [bond,shared] of [[0,false],[4,false],[8,true]]){
  h.run(`__edgeBase();player.impression.azhe.trusts=0;player.impression.azhe.feelsDistance=0;player.relationships.teammateBond=${bond};player.baseballSkills.baseballIQ=8;player.observe=8;if(${shared})addFlags(["azhe_error_reworked"]);`);
  const a=h.json('resolveHighSchoolAzheEcho()');h.run('saveGame();');const raw=h.storage.get("baseballLifeRpgSave");
  const f=makeContext();f.storage.set("baseballLifeRpgSave",raw);f.run('loadGame();');assert.deepEqual(f.json('player.highSchoolAzheEcho'),a);
  const prior=h.json('({flags:player.flags,echo:player.highSchoolAzheEcho})');h.run('resolveHighSchoolAzheEcho()');assert.deepEqual(h.json('({flags:player.flags,echo:player.highSchoolAzheEcho})'),prior);
  rows.push({bond,shared,variant:a.variant,evidence:a.evidence});
 }
 out.experiments.azhe=rows;return rows;
});
fs.writeFileSync(path.join(__dirname,"edge-results.json"),JSON.stringify(out,null,2)+"\n");
if(out.checks.some(c=>c.status==="ERROR"))process.exitCode=1;
