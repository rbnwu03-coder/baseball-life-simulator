"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {context}=require("./high-school-match-feedback-factuality-test.cjs");
const root=path.resolve(__dirname,".."),dir=path.join(root,"docs/design-optimization/legacy-feedback-v1");
function makeYearOne(source,story){
 const h=context(source,story);h.run('__feedbackFixture("游擊手","starter",45000);__feedbackPlay();showHighSchoolCompletedMatchOutcome(player.highSchoolMatch);continueYouthSeasonOutcome();choose("high_school_call_home",0);');
 h.flushTransitions();if(h.run('Boolean(pendingYouthSeasonOutcome)'))h.run('continueYouthSeasonOutcome()');
 assert.equal(h.run('getCurrentEventId()'),"high_school_followup_evaluation");
 const followup=h.json('player');
 h.run('__feedbackPlay();showHighSchoolCompletedMatchOutcome(player.highSchoolMatch);continueYouthSeasonOutcome();stopHighSchoolMatchPlayback();');
 assert.equal(h.run('getCurrentEventId()'),"high_school_role_reassessment_feedback");assert.equal(h.run('player.highSchoolYearOneMatchHistory.length'),2);
 return {reassessment:h.json('player'),followup};
}
function run(source,story){
 const fixtures=makeYearOne(source,story),base=fixtures.reassessment,checks=[],reachability=[],observations={};
 const test=(name,fn)=>{try{fn();checks.push({name,status:"PASS"});}catch(e){checks.push({name,status:"FAIL",message:e.message});}};
 function load(change="",expectedEvent="high_school_role_reassessment_feedback",fixture=base){
  const h=context(source,story);h.context.legacyFixture=JSON.parse(JSON.stringify(fixture));h.run('player=JSON.parse(JSON.stringify(legacyFixture));'+change+'saveGame();');
  const raw=h.storage.get("baseballLifeRpgSave");assert(raw);const fresh=context(source,story);fresh.storage.set("baseballLifeRpgSave",raw);fresh.run('loadGame();stopHighSchoolMatchPlayback();');
  assert.equal(fresh.run('player.name'),base.name);assert.equal(fresh.run('getCurrentEventId()'),expectedEvent);
  assert.match(fresh.nodes.get("changeLog").innerHTML,/進度讀取完成/);
  reachability.push({event:fresh.run('getCurrentEventId()'),notice:fresh.nodes.get("changeLog").innerHTML,history:fresh.json('player.highSchoolYearOneMatchHistory.map(m=>({matchId:m.matchId,actualExposure:m.actualExposure,role:m.evaluationConsequence}))')});
  return fresh;
 }
 function views(h){return h.json('({detail:getHighSchoolRoleReassessmentFeedbackText(),journey:getHighSchoolYearOneRoleJourneyText(),html:document.getElementById("story").innerHTML})');}
 const missing=load('delete player.highSchoolYearOneMatchHistory.at(-1).actualExposure;');observations.missingExposure=views(missing);
 test("Save/Load permits missing actualExposure; matching official record recovers participation",()=>{
  assert(!missing.json('Object.hasOwn(player.highSchoolYearOneMatchHistory.at(-1),"actualExposure")'));
  assert(base.highSchoolMatch.gameRecord.playerLines.player.batting.PA>0);
  assert(!/本次沒有實際上場/.test(observations.missingExposure.html));assert.match(observations.missingExposure.html,/打席|出賽/);
 });
 const unknown=load('const first=player.highSchoolYearOneMatchHistory[0];delete first.actualExposure;delete first.gameRecordSummary;delete first.gameRecordId;for(const o of player.highSchoolOpportunityHistory)if(o.matchId===first.matchId)delete o.actualExposure;');observations.unknownEarlier=views(unknown);
 test("Earlier history without evidence stays unknown, never borrows the current match",()=>{
  assert.notEqual(unknown.run('player.highSchoolYearOneMatchHistory[0].matchId'),unknown.run('player.highSchoolMatch.id'));
  assert.match(observations.unknownEarlier.journey,/機會 1：[^；]*(整理|不完整|待確認|尚待)/);
  assert(!/機會 1：沒有實際上場/.test(observations.unknownEarlier.journey));
 });
 test("Unknown earlier history reaches the real year-end screen through normal choices",()=>{
  unknown.run('choose("high_school_role_reassessment_feedback",0);');unknown.flushTransitions();
  if(unknown.run('Boolean(pendingYouthSeasonOutcome)'))unknown.run('continueYouthSeasonOutcome()');
  assert.equal(unknown.run('getCurrentEventId()'),"high_school_scout_feedback");
  unknown.run('choose("high_school_scout_feedback",2);');unknown.flushTransitions();if(unknown.run('Boolean(pendingYouthSeasonOutcome)'))unknown.run('continueYouthSeasonOutcome()');
  assert.equal(unknown.run('player.chapter'),"青棒第一年小結");const html=unknown.nodes.get("story").innerHTML;observations.yearEndUnknown=html;
  assert.match(html,/實戰機會 1[^；]*；[^；]*(整理|不完整|待確認|尚待)/);assert(!/機會 1[^；]*；沒有實際上場/.test(html));
 });
 const roleMissing=load('delete player.highSchoolRoleCode;delete player.highSchoolRoleContext.code;delete player.highSchoolYearOneMatchHistory.at(-1).evaluationConsequence.currentRole;');observations.missingRole=views(roleMissing);
 test("Missing current role never falls back to starting role in the journey helper",()=>{
  assert.equal(roleMissing.run('player.highSchoolRoleCode'),"");assert(roleMissing.run('Boolean(player.highSchoolYearOneStartingRole)'));
  assert(!/角色維持|角色由.*升為|角色由.*降為/.test(observations.missingRole.journey));assert.match(observations.missingRole.journey,/目前角色.*確認/);
 });
 test("Formal year-end route resolves missing canonical role before rendering journey",()=>{
  roleMissing.run('choose("high_school_role_reassessment_feedback",0);');roleMissing.flushTransitions();if(roleMissing.run('Boolean(pendingYouthSeasonOutcome)'))roleMissing.run('continueYouthSeasonOutcome()');
  roleMissing.run('choose("high_school_scout_feedback",2);');roleMissing.flushTransitions();if(roleMissing.run('Boolean(pendingYouthSeasonOutcome)'))roleMissing.run('continueYouthSeasonOutcome()');
  assert.equal(roleMissing.run('player.chapter'),"青棒第一年小結");assert(["starter","rotation","bench"].includes(roleMissing.run('player.highSchoolRoleCode')));
  observations.roleGuard={role:roleMissing.run('player.highSchoolRoleCode'),html:roleMissing.nodes.get("story").innerHTML};
 });
 const partial=load('player.highSchoolYearOneMatchHistory.at(-1).actualExposure={participated:true};delete player.highSchoolYearOneMatchHistory.at(-1).gameRecordSummary;delete player.highSchoolYearOneMatchHistory.at(-1).matchId;');observations.partialCounts=views(partial);
 test("Participation without counts does not manufacture zero plate appearances or innings",()=>{
  assert(!/本次實際留下 0 個打席、0 局守備/.test(observations.partialCounts.detail));assert.match(observations.partialCounts.detail,/出賽/);
 });
 const noIdentity=load('const last=player.highSchoolYearOneMatchHistory.at(-1);delete last.actualExposure;delete last.matchId;delete last.gameRecordSummary;delete last.gameRecordId;');observations.noIdentity=views(noIdentity);
 test("History without matchId cannot use the current ledger as a fallback",()=>{
  assert.match(observations.noIdentity.detail,/(整理|不完整|待確認|尚待)/);assert(!/本次沒有實際上場|本次實際留下/.test(observations.noIdentity.detail));
 });
 const negative=load('const last=player.highSchoolYearOneMatchHistory.at(-1);last.actualExposure={participated:false};delete last.matchId;delete last.gameRecordSummary;delete last.gameRecordId;');observations.explicitAbsence=views(negative);
 test("Explicit absence remains distinct from missing exposure",()=>{
  assert.match(observations.explicitAbsence.detail,/本次[^。\n]*沒有實際上場/);assert(!/本次：出賽紀錄還在整理/.test(observations.explicitAbsence.detail));
 });
 const authority=load('delete player.highSchoolRoleCode;player.highSchoolYearOneStartingRole="bench";');observations.verifiedAuthority=views(authority);
 test("Missing canonical role can use matching applied evaluation and role context",()=>{
  assert.equal(authority.run('player.highSchoolRoleCode'),"");assert.match(observations.verifiedAuthority.journey,/角色由.*升為/);assert(!/角色維持.*板凳/.test(observations.verifiedAuthority.journey));
 });
 const foreign=load('const first=player.highSchoolYearOneMatchHistory[0];delete first.actualExposure;first.gameRecordId=player.highSchoolMatch.id;first.gameRecordSummary={playerLine:player.highSchoolMatch.gameRecord.playerLines.player};for(const o of player.highSchoolOpportunityHistory)if(o.matchId===first.matchId)delete o.actualExposure;');observations.foreignSummary=views(foreign);
 test("A summary for another game is not a substitute for missing historical exposure",()=>{assert.match(observations.foreignSummary.journey,/機會 1：出賽紀錄還在整理/);});
 const follow=load('delete player.highSchoolOpportunityHistory.find(o=>o.opportunityIndex===1).actualExposure;delete player.highSchoolYearOneMatchHistory[0].actualExposure;delete player.highSchoolYearOneMatchHistory[0].gameRecordSummary;delete player.highSchoolYearOneMatchHistory[0].gameRecordId;',"high_school_followup_evaluation",fixtures.followup);
 test("Follow-up presentation treats unavailable prior exposure as unknown",()=>{
  const text=follow.run('getHighSchoolFollowupEvaluationPresentation()');observations.followup=text;assert.match(text,/上一場：出賽紀錄還在整理/);assert(!/上一場沒有實際上場/.test(text));
 });
 const unrelated=load('const first=player.highSchoolOpportunityHistory.find(o=>o.opportunityIndex===1);first.matchId="another-history";first.actualExposure={participated:true,plateAppearances:2,defensiveInnings:1};delete player.highSchoolYearOneMatchHistory[0].actualExposure;delete player.highSchoolYearOneMatchHistory[0].gameRecordSummary;delete player.highSchoolYearOneMatchHistory[0].gameRecordId;',"high_school_followup_evaluation",fixtures.followup);
 test("Follow-up uses previousMatchId, not an unrelated opportunity with the same index",()=>{
  const text=unrelated.run('getHighSchoolFollowupEvaluationPresentation()');observations.unrelatedOpportunity=text;assert.match(text,/上一場：出賽紀錄還在整理/);assert(!/2 打席、1 局守備/.test(text));
 });
 const yearTwo=load('player.chapter="青棒第二年";player.age=17;player.highSchoolYearTwoStep=7;delete player.highSchoolRoleCode;player.highSchoolYearTransitionState.history=[{nextHighSchoolYear:2,currentRole:"starter"}];player.highSchoolYearTwoMatchHistory=[{matchId:"legacy-y2-spring",opportunityIndex:1},{matchId:"legacy-y2-autumn",opportunityIndex:2}];',"high_school_year_two_senior_plan");
 test("Adjacent year-two summary uses unknown exposure and cannot carry a prior-year role forward",()=>{
  const before=yearTwo.run('JSON.stringify(player)');const journey=yearTwo.json('getHighSchoolYearTwoJourneySnapshot()');assert.equal(yearTwo.run('JSON.stringify(player)'),before);
  assert(journey.exposureText.every(t=>t.includes("出賽紀錄還在整理")));assert.equal(journey.endingRole,"");
  yearTwo.run('choose("high_school_year_two_senior_plan",2);');yearTwo.flushTransitions();if(yearTwo.run('Boolean(pendingYouthSeasonOutcome)'))yearTwo.run('continueYouthSeasonOutcome()');
  assert.equal(yearTwo.run('player.chapter'),"青棒第二年小結");observations.yearTwo=yearTwo.nodes.get("story").innerHTML;
  assert.match(observations.yearTwo,/目前角色仍待確認/);assert(!/正式角色維持/.test(observations.yearTwo));
 });
 const pitcher=load('player.chapter="青棒第二年";player.age=17;player.highSchoolYearTwoStep=7;applyCanonicalPositionProfile(player,"投手",[]);player.highSchoolYearTwoMatchHistory=[{matchId:"legacy-y2-pitcher",opportunityIndex:1,actualExposure:{participated:false,plateAppearances:0,defensiveInnings:0}}];',"high_school_year_two_senior_plan");
 test("Pitcher summary keeps deferred usage while removing validation wording",()=>{
  const record=pitcher.json('player.highSchoolMatch.gameRecord');pitcher.run('choose("high_school_year_two_senior_plan",2);');pitcher.flushTransitions();if(pitcher.run('Boolean(pendingYouthSeasonOutcome)'))pitcher.run('continueYouthSeasonOutcome()');
  assert.equal(pitcher.run('player.chapter'),"青棒第二年小結");const text=pitcher.run('player.highSchoolYearTwoDetail');observations.pitcherYearTwo=text;
  assert.match(text,/投手使用仍延後處理/);assert(!/沒有虛構|不補上打席|暫不補上|完成.*投球局數|完成.*投球表現/.test(text));assert.deepEqual(pitcher.json('player.highSchoolMatch.gameRecord'),record);
 });
 test("Player-facing feedback drops validation and implementation language",()=>{
  const played=load(),absent=load('player.highSchoolYearOneMatchHistory.at(-1).actualExposure={participated:false,plateAppearances:0,defensiveInnings:0};');
  const texts=[played.run('getHighSchoolCallHomePresentation()'),absent.run('getHighSchoolRoleReassessmentFeedbackText()'),played.run('getHighSchoolMatchPerformanceFeedback(player.highSchoolMatch)')];
  const p=context(source,story);p.run('__feedbackFixture("投手","starter",45011);__feedbackPlay();');texts.push(p.run('getHighSchoolCallHomePresentation()'),p.run('getHighSchoolMatchPerformanceFeedback(player.highSchoolMatch)'));
  observations.playerWords=texts;assert(!/沒有虛構|不補上打席|暫不補上|沒有把球探內部評語當成已知事實/.test(texts.join("\n")));
 });
 return {checks,reachability,observations,baseRecord:base.highSchoolMatch.gameRecord};
}
if(require.main===module){
 const before=process.argv.includes("--baseline"),source=fs.readFileSync(before?path.join(dir,"script.js.before.txt"):path.join(root,"script.js"),"utf8"),story=fs.readFileSync(before?path.join(dir,"story.js.before.txt"):path.join(root,"story.js"),"utf8");
 const result=run(source,story),i=process.argv.indexOf("--out");if(i>=0)fs.writeFileSync(path.resolve(process.argv[i+1]),JSON.stringify(result,null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify(result.checks,null,2));if(result.checks.some(c=>c.status!=="PASS"))process.exitCode=1;
}
module.exports={run,makeYearOne};
