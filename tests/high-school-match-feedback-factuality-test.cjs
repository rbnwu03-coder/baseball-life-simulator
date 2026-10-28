"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {makeContext}=require("./high-school-career-test-context.js");
const root=path.resolve(__dirname,".."),dir=path.join(root,"docs/design-optimization/feedback-repair-v1");
function context(source,storySource=fs.readFileSync(path.join(root,"story.js"),"utf8")){
 const h=makeContext({excludeFiles:["script.js","story.js","match-pitch-decision-ui.js"]});
 vm.runInContext(storySource,h.context,{filename:"story.js"});
 vm.runInContext(source,h.context,{filename:"script.js"});
 h.run(`
  var __feedbackSeed=1;
  function __feedbackRandom(){__feedbackSeed=(Math.imul(__feedbackSeed,1664525)+1013904223)>>>0;return __feedbackSeed/4294967296;}
  Math.random=__feedbackRandom;
  function __feedbackFixture(position="游擊手",role="starter",seed=45000,skill=8){
   stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;pendingTrainingOutcome=null;isTransitioning=false;__feedbackSeed=seed;
   player=createRepresentativeHighSchoolEntryFixture("ordinary",44001);player.name="Feedback repair";
   applyCanonicalPositionProfile(player,position,[]);player.schoolInvitationState=createDefaultSchoolInvitationState();
   const s=generateSchoolInvitationSet(player,{generationSeed:"feedback-repair-44001"});finalizeSchoolInvitationSelection(player,s.invitations[0].schoolId);
   materializeSelectedHighSchoolRoster(player,{rosterRole:"bench",playerPosition:position});completeHighSchoolEntry({source:"feedback-repair"});
   Object.keys(player.baseballSkills).forEach(k=>player.baseballSkills[k]=skill);
   ["ballSense","observe","fitness","instinct","discipline"].forEach(k=>player[k]=8);
   player.relationships.coachTrust=8;player.highSchoolStep=5;applyHighSchoolRoleState(role);player.highSchoolYearOneStartingRole=role;
   pendingHighSchoolMatchSimulationSeed=seed;__feedbackSeed=seed;return prepareHighSchoolYearOneMatch();
  }
  function __feedbackPlay(stopBeforeSeven=false,approach="zone"){
   let ticks=0;const m=player.highSchoolMatch;
   while(!m.completed&&ticks++<5000){
    if(stopBeforeSeven&&m.inning>=6&&m.completedMoments.length)return ticks;
    if(pendingYouthSeasonOutcome){continueYouthSeasonOutcome();continue;}
    if(isHighSchoolMatchDecisionVisible(m)){
     const cs=getHighSchoolYearOneMatchMomentChoices(m),c=cs.find(c=>c.matchDecision==="contactSwing")||cs.find(c=>c.matchDecision===approach)||cs.find(c=>c.matchDecision==="secure")||cs[0];
     if(!c)throw Error("No legal decision");chooseHighSchoolYearOneMatchMoment(c.matchDecision,c.matchMomentId,__feedbackRandom);
    }else advanceHighSchoolMatchPlaybackStep(m);
   }
   if(!m.completed)throw Error("Match liveness limit");
   MatchGameRecord.assertIntegrity(m.gameRecord);assertHighSchoolMatchStateIntegrity(m,"feedback-regression");return ticks;
  }
  function __feedbackTexts(){const m=player.highSchoolMatch;return {coach:typeof getHighSchoolPostMatchCoachFeedback==="function"?getHighSchoolPostMatchCoachFeedback(m):m.coachReaction,
   rival:prepareHighSchoolRivalPressure(),call:getHighSchoolCallHomePresentation(),azhe:resolveHighSchoolAzheEcho(),role:m.competitionFeedback,roleDetail:getHighSchoolRoleReassessmentFeedbackText(),journey:getHighSchoolYearOneRoleJourneyText()};}
  function __feedbackProtected(){return {record:player.highSchoolMatch.gameRecord,log:player.highSchoolMatch.simulationLog,skills:player.baseballSkills,body:player.body,
   traits:{ballSense:player.ballSense,observe:player.observe,fitness:player.fitness,instinct:player.instinct,discipline:player.discipline,pressure:player.pressure,responsibility:player.responsibility,resilience:player.resilience,confidence:player.confidence},
   evaluation:player.highSchoolCompetitionEvaluation,development:player.developmentState,relationships:player.relationships,impression:player.impression,role:player.highSchoolRoleCode,
   opportunityHistory:player.highSchoolOpportunityHistory,next:player.highSchoolNextOpportunity,roster:player.schoolInvitationState,
   performance:{season:player.seasonPerformance,recent:player.recentPerformance,exposure:player.exposure,scout:player.scoutEvaluation},
   flags:player.flags,rivalEntryType:player.highSchoolRivalContext.entryType,azheVariant:player.highSchoolAzheEcho.variant,contribution:player.highSchoolMatch.playerContribution};}
 `);return h;
}
function run(source,storySource=fs.readFileSync(path.join(root,"story.js"),"utf8")){
 const h=context(source,storySource),checks=[],observations={},invariants={};
 const test=(name,fn)=>{try{fn();checks.push({name,status:"PASS"});}catch(e){checks.push({name,status:"FAIL",message:e.message});}};
 h.run('__feedbackFixture("投手","starter",45011);__feedbackPlay();');
 const no=h.json('__feedbackTexts()');observations.noAppearance=no;invariants.noAppearance=h.json('__feedbackProtected()');
 test("No appearance: coach and rival do not invent player decisions",()=>{
  assert.equal(h.run('player.highSchoolMatch.gameExposureState.appearanceType'),"noAppearance");
  assert(!/看對|動作只是慢|輪到你，你都|第七局做出|第7局.*選擇/.test(no.coach+no.rival.encounter));
  assert.match(no.coach,/沒有.*上場|沒有.*出賽|未出賽/);
  assert(!/交流賽的打席/.test(no.azhe.cause));
 });
 test("Starter unchanged: settlement never describes starter-to-starter",()=>{assert.match(no.role,/正式角色維持/);assert(!/由.*調整為/.test(no.role));});
 test("Foreign finalized exposure cannot invent participation",()=>{
  h.run('var __feedbackForeign=JSON.stringify(player);player=JSON.parse(__feedbackForeign);player.highSchoolMatch.gameExposureState.matchId="another-game";player.highSchoolMatch.gameExposureState.plateAppearances=2;player.highSchoolMatch.gameExposureState.appearanceType="start";');
  assert.equal(h.run('player.highSchoolMatch.gameExposureState.matchId'),"another-game");
  const texts=h.json('__feedbackTexts()');assert.match(texts.call,/沒有真的輪到你上場/);assert(!/有正式出賽紀錄/.test(texts.coach));
  h.run('player=JSON.parse(__feedbackForeign)');
 });
 test("Legacy finalized no-appearance is safe without official ledger",()=>{
  h.run('var __feedbackLegacy=JSON.stringify(player);delete player.highSchoolMatch.gameRecord;');
  const texts=h.json('__feedbackTexts()');assert.match(texts.call,/沒有真的輪到你上場/);assert(!/看對|第七局|第7局/.test(texts.coach+texts.rival.encounter));
  h.run('player=JSON.parse(__feedbackLegacy)');
 });
 test("Saved stale text is not reused by existing post-match text selectors",()=>{
  h.run('var __feedbackLegacyText=JSON.stringify(player);player.highSchoolMatch.coachReaction="第七局看對了幾球";player.highSchoolMatch.consequence="由先發調整為先發";player.highSchoolRivalContext.encounter="第七局做出的選擇";saveGame();');
  const fresh=context(source,storySource);fresh.storage.set("baseballLifeRpgSave",h.storage.get("baseballLifeRpgSave"));fresh.run('loadGame();stopHighSchoolMatchPlayback();');
  fresh.run('renderHighSchoolPostMatchOutcome({coachFeedback:"第七局看對了幾球"},"");');
  const html=fresh.nodes.get("story").innerHTML;assert(!/第七局看對|由先發調整為先發|你依照目前角色完成/.test(html));
  const rivalText=fresh.run('getEvent("high_school_scout_feedback").text()');assert(!/第七局做出的選擇/.test(rivalText));
  h.run('player=JSON.parse(__feedbackLegacyText)');
 });
 h.run('__feedbackFixture("游擊手","starter",45000);__feedbackPlay(true);');
 const early=h.json('({moments:player.highSchoolMatch.completedMoments,texts:__feedbackTexts(),inning:player.highSchoolMatch.inning})');observations.beforeSeven=early;
 test("Actual participation before seventh: no unrecorded seventh-inning claim",()=>{
  assert(early.moments.length>0);assert(early.inning<7);assert(early.moments.every(m=>m.inning<7));
  assert(!/第七局|第7局/.test(early.texts.rival.encounter));
 });
 h.run('__feedbackPlay();');
 const played=h.json('({moments:player.highSchoolMatch.completedMoments,texts:__feedbackTexts()})');observations.played=played;invariants.played=h.json('__feedbackProtected()');
 test("Real linked decisions still receive specific feedback",()=>{
  const last=played.moments.at(-1),refs=h.json('player.highSchoolMatch.gameRecord.eventRefs');
  assert(last&&refs.some(r=>r.type==="meaningfulMomentResolved"&&r.inning===last.inning&&r.half===last.half));
  assert(played.texts.rival.encounter.includes(`第${last.inning}局`));assert.match(played.texts.coach,/判斷|決策|執行/);
 });
 test("Full match with no seventh-inning decision never invents one",()=>{
  assert(h.run('player.highSchoolMatch.completed'));assert(played.moments.every(m=>m.inning!==7));
  assert(!/第七局|第7局/.test(played.texts.rival.encounter));
 });
 test("Legacy missing decision details uses neutral feedback despite actual appearance",()=>{
  const before=h.json('__feedbackProtected()');h.run('var __feedbackSaved=JSON.stringify(player);delete player.highSchoolMatch.completedMoments;');
  const texts=h.json('__feedbackTexts()');assert(!/第七局|第7局|看對/.test(texts.rival.encounter+texts.coach));
  assert.match(texts.coach,/紀錄|記錄/);h.run('player=JSON.parse(__feedbackSaved)');assert.deepEqual(h.json('__feedbackProtected()'),before);
 });
 test("Cross-match and unlinked legacy moments cannot supply specific details",()=>{
  h.run('var __feedbackSaved2=JSON.stringify(player);player.highSchoolMatch.gameRecord.gameId="another-game";');
  const texts=h.json('__feedbackTexts()');assert(!/第\d+局|第七局|看對/.test(texts.rival.encounter+texts.coach));
  h.run('player=JSON.parse(__feedbackSaved2);player.highSchoolMatch.simulationLog=[];');
  const unlinked=h.json('__feedbackTexts()');assert(!/第\d+局|第七局|看對/.test(unlinked.rival.encounter+unlinked.coach));h.run('player=JSON.parse(__feedbackSaved2)');
 });
 test("Role text compares values, ignores stale change label, and handles missing prior role",()=>{
  for(const role of ["starter","rotation"]){
   h.run(`player.highSchoolRoleCode=${JSON.stringify(role)};player.highSchoolYearOneMatchHistory=[{evaluationConsequence:{previousRole:${JSON.stringify(role)},currentRole:${JSON.stringify(role)},change:"promotion"}}];`);
   const text=h.run('getHighSchoolRoleReassessmentFeedbackText()');assert.match(text,/角色維持/);assert(!/升為|降為|角色由/.test(text));
  }
  for(const [from,to,word] of [["bench","rotation","升為"],["starter","rotation","降為"]]){
   h.run(`player.highSchoolRoleCode=${JSON.stringify(to)};player.highSchoolYearOneMatchHistory=[{evaluationConsequence:{previousRole:${JSON.stringify(from)},currentRole:${JSON.stringify(to)},change:"same",reasons:["limitedSample"]}}];`);
   const text=h.run('getHighSchoolRoleReassessmentFeedbackText()');assert(text.includes(word));assert.match(text,/樣本/);
  }
  h.run('player.highSchoolYearOneMatchHistory=[{evaluationConsequence:{currentRole:"rotation",change:"promotion"}}];');
  const legacy=h.run('getHighSchoolRoleReassessmentFeedbackText()');assert(!/角色由|升為|降為|前次角色/.test(legacy));assert.match(legacy,/目前角色/);
 });
 h.run('__feedbackFixture("游擊手","bench",45002);__feedbackPlay();');
 const bench=h.json('__feedbackTexts()');observations.bench=bench;invariants.bench=h.json('__feedbackProtected()');
 test("Bench unchanged: actual settlement describes maintaining role",()=>{assert.match(bench.role,/正式角色維持/);assert(!/角色由/.test(bench.role));});
 test("Existing save/load preserves facts and feedback with missing legacy role fields",()=>{
  h.run('delete player.highSchoolYearOneMatchHistory.at(-1).evaluationConsequence.previousRole;delete player.highSchoolYearOneStartingRole;saveGame();');
  const raw=h.storage.get("baseballLifeRpgSave"),fresh=context(source,storySource);fresh.storage.set("baseballLifeRpgSave",raw);fresh.run('loadGame();stopHighSchoolMatchPlayback();');
  assert.deepEqual(fresh.json('player.highSchoolMatch.gameRecord'),h.json('player.highSchoolMatch.gameRecord'));
  const texts=fresh.json('__feedbackTexts()');assert(!/角色由|升為|降為/.test(texts.roleDetail+texts.journey));assert(!/第七局做出/.test(texts.rival.encounter));
  observations.reloaded=texts;
 });
 h.run('__feedbackFixture("游擊手","starter",45000,16);__feedbackPlay();');
 const sound=h.json('({moments:player.highSchoolMatch.completedMoments,texts:__feedbackTexts()})');observations.soundDecisions=sound;invariants.soundDecisions=h.json('__feedbackProtected()');
 test("Two recorded sound decisions preserve praise without erasing questionable judgement",()=>{
  assert(sound.moments.filter(m=>["strong","acceptable","reasonable","routine"].includes(m.decisionQuality)).length>=2);
  assert(sound.moments.some(m=>m.decisionQuality==="questionable"));assert.match(sound.texts.coach,/有幾球你看對了/);assert.match(sound.texts.coach,/判斷需要再檢查/);
 });
 return {checks,observations,invariants};
}
if(require.main===module){
 const before=process.argv.includes("--baseline"),file=before?path.join(dir,"script-before.js.txt"):path.join(root,"script.js");
 const result=run(fs.readFileSync(file,"utf8"),fs.readFileSync(before?path.join(dir,"story-before.js.txt"):path.join(root,"story.js"),"utf8"));
 if(process.argv.includes("--compare")||process.argv.includes("--compare-to")){
  const baselineFile=process.argv.includes("--compare-to")?path.resolve(process.argv[process.argv.indexOf("--compare-to")+1]):path.join(dir,"before.json");
  const baseline=JSON.parse(fs.readFileSync(baselineFile,"utf8"));
  assert.deepEqual(result.invariants,baseline.invariants,"Official records, capabilities, evaluation, relationships and opportunity outcomes must remain unchanged");
  result.parity="PASS";
 }
 const output=process.argv[process.argv.indexOf("--out")+1];if(process.argv.includes("--out"))fs.writeFileSync(path.resolve(output),JSON.stringify(result,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({checks:result.checks,parity:result.parity},null,2));if(result.checks.some(c=>c.status!=="PASS"))process.exitCode=1;
}
module.exports={run,context};
