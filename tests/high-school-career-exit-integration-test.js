const assert=require("assert");
const {makeContext}=require("./high-school-career-test-context.js");
const {run,json,flushTransitions}=makeContext();
run("careerFixture();choose('critical_offseason',1);finishCareerMatch('strong',true);player.highSchoolMatch.eventSettlementApplied=true;player.highSchoolMatch.developmentPresentationCompleted=true;player.criticalYearStep=7;player.forcedEventId='';player.flags.push('family_declared_pro');ensureHighSchoolCareerOffers()");
const state=json("player.highSchoolCareerSettlement");
assert(state.offerSet.offers.length>0);
assert.strictEqual(json("player.careerExit"),"");
assert.strictEqual(run("selectHighSchoolCareerOffer('fake')"),false);
run("saveGame();loadGame();ensureHighSchoolCareerOffers()");
assert.deepStrictEqual(json("player.highSchoolCareerSettlement"),state);
const beforeSelection=json("player");
for(const offer of state.offerSet.offers){
 run(`player=normalizeSave(${JSON.stringify(beforeSelection)});pendingYouthSeasonOutcome=null;isTransitioning=false;selectHighSchoolCareerOffer(${JSON.stringify(offer.offerId)})`);
 assert.strictEqual(json("player.careerExit"),offer.careerExit);
 assert.strictEqual(json("player.chapter"),"青棒生涯出口");
 assert(json("getHighSchoolCareerSummaryText()").includes("高三"));
 run("saveGame();loadGame()");
 assert.strictEqual(json("player.careerExit"),offer.careerExit);
 assert.strictEqual(run("selectHighSchoolCareerOffer('fake')"),false);
 assert(json("enterCareerTransition().committed"));
 assert(json("CareerTransitionRuntimeResolver.resolveTransitionRuntime(player).resolved"));
 assert.strictEqual(json("player.highSchoolYearThreeMatchHistory.length"),1);
}
run("careerFixture('投手');choose('critical_offseason',2);finishCareerMatch('strong',false);player.highSchoolMatch.eventSettlementApplied=true;player.highSchoolMatch.developmentPresentationCompleted=true;player.criticalYearStep=7;player.flags.push('entered_high_school_draft');player.scoutEvaluation=20;ensureHighSchoolCareerOffers()");
assert(!json("player.highSchoolCareerSettlement.offerSet.offers.some(o=>o.route==='draft')"));
assert(json("getHighSchoolCareerSummaryText()").includes("投手正式投球證據尚未建立"));
assert.strictEqual(run("evaluateCriticalYear()"),false);
assert.strictEqual(json("player.careerExit"),"");
console.log("High School Career Exit Integration: passed.");

// Advance real event choices and the existing engine, without injecting Y3 performance.
for(const position of ["游擊手","投手","捕手"]){
 run(`careerFixture('${position}');choose('critical_offseason',1);playCareerMatchToEnd()`);
 const matchEvidence=json("player.highSchoolYearThreeMatchHistory");
 const evaluation=json("player.highSchoolCompetitionEvaluation");
 for(let step=2;step<7;step++){
  assert.strictEqual(json("player.criticalYearStep"),step);
  run("choose(getCurrentEventId(),0);if(pendingYouthSeasonOutcome)continueYouthSeasonOutcome()");
  flushTransitions();
 }
 assert.deepStrictEqual(json("player.highSchoolYearThreeMatchHistory"),matchEvidence,"contextual choices never manufacture match evidence");
 assert.deepStrictEqual(json("player.highSchoolCompetitionEvaluation"),evaluation);
 assert.strictEqual(json("player.careerExit"),"");
 if(position==="投手"){
  assert.strictEqual(json("player.highSchoolCareerSettlement.evidence.performanceProof.sampleCount"),0);
  assert(!json("player.highSchoolCareerSettlement.offerSet.offers.some(o=>o.route==='draft')"));
 }
 run("choose('critical_exit_choice',0)");
 assert.strictEqual(json("player.chapter"),"青棒生涯出口");
 assert(json("enterCareerTransition().committed"));
 assert(json("CareerTransitionRuntimeResolver.resolveTransitionRuntime(player).resolved"));
}

// Earlier canonical histories unlock both bounded draft profiles; each uses the existing adult boundary.
for(const awareness of [0,20]){
 run(`careerFixture('捕手');player.highSchoolYearOneMatchHistory=[1,2,3].map(i=>({matchId:'prior-'+i,actualExposure:{plateAppearances:4,defensiveInnings:7},playerContribution:{strong:3}}));choose('critical_offseason',2);finishCareerMatch('strong',true);player.highSchoolMatch.eventSettlementApplied=true;player.highSchoolMatch.developmentPresentationCompleted=true;player.criticalYearStep=7;player.flags.push('family_declared_pro');player.scoutEvaluation=${awareness};ensureHighSchoolCareerOffers()`);
 const draft=json("player.highSchoolCareerSettlement.offerSet.offers.find(o=>o.route==='draft')");
 assert.strictEqual(draft.offerType,awareness?"draft-interest":"draft-tryout");
 run(`selectHighSchoolCareerOffer(${JSON.stringify(draft.offerId)})`);
 assert(json("enterCareerTransition().committed"));
 assert(json("CareerTransitionRuntimeResolver.resolveTransitionRuntime(player).resolved"));
 assert(!json("getEvent('transition_draft_day').text").includes("你的名字終於被念到"));
}

run(`player=normalizeSave(${JSON.stringify(beforeSelection)})`);
const forged=json("player");
forged.highSchoolCareerSettlement.evidence.talent.capability=999;
assert.throws(()=>run(`normalizeSave(${JSON.stringify(forged)})`),/邀請資料不一致/);
const modifiedOffer=json("player");
modifiedOffer.highSchoolCareerSettlement.offerSet.offers[0].careerExit="職棒";
assert.throws(()=>run(`normalizeSave(${JSON.stringify(modifiedOffer)})`),/邀請資料不一致/);

run("careerFixture();choose('critical_offseason',1);playCareerMatchToEnd()");
for(let step=2;step<6;step++){
 run("choose(getCurrentEventId(),0);if(pendingYouthSeasonOutcome)continueYouthSeasonOutcome()");
 flushTransitions();
}
assert.strictEqual(json("player.highSchoolCareerSettlement"),null);
run("saveGame();loadGame()");
const beforeOffers=json("player");
run("choose('critical_farewell',0)");flushTransitions();
const generated=json("player.highSchoolCareerSettlement");
run(`player=normalizeSave(${JSON.stringify(beforeOffers)});pendingYouthSeasonOutcome=null;isTransitioning=false;choose('critical_farewell',0)`);flushTransitions();
assert.deepStrictEqual(json("player.highSchoolCareerSettlement"),generated);
run("player.scoutEvaluation=20;ensureHighSchoolCareerOffers()");
assert.deepStrictEqual(json("player.highSchoolCareerSettlement"),generated,"generated offers cannot reroll after visibility changes");
const legalTexts=json("getEvent('critical_exit_choice').choices.map(c=>c.text).join(' ')");
assert(!/draft-interest|college-development|high-school-career|undefined|NaN/.test(legalTexts));
run("choose('critical_exit_choice',0)");
assert(json("getHighSchoolCareerSummaryText()").includes("出場安排紀錄"));
const selectedState=json("player.highSchoolCareerSettlement");
assert(json("HighSchoolCareerOffers.commitHighSchoolCareerChoice(player,player.highSchoolCareerSettlement.selectedOffer.offerId).ok"));
assert.deepStrictEqual(json("player.highSchoolCareerSettlement"),selectedState);
console.log("Y3 full event / P / C / draft interest / draft tryout / corrupted save boundaries: PASS.");
