const assert=require("assert");
const E=require("../high-school-career-evaluation.js"),O=require("../high-school-career-offers.js");
const p={name:"Offers",primaryPosition:"C",highSchoolRoleCode:"bench",baseballSkills:{batting:12,baseballIQ:12,catching:12,blocking:12,gameCalling:12,throwing:12},body:{},academics:6,scoutEvaluation:20,highSchoolCompetitionEvaluation:{accumulatedScore:2},highSchoolYearOneMatchHistory:[],highSchoolYearTwoMatchHistory:[]};
function offers(){return O.generate(E.derive(p,{intent:"draft"}));}
assert(!offers().offers.some(o=>o.route==="draft"),"scout scalar cannot manufacture proof");
assert(offers().offers.some(o=>o.route==="college"),"high capability low exposure development route");
for(let i=0;i<3;i++)p.highSchoolYearOneMatchHistory.push({matchId:"proof"+i,actualExposure:{plateAppearances:4,defensiveInnings:7},playerContribution:{strong:3,failure:0}});
assert(offers().offers.some(o=>o.offerType==="draft-interest"));
assert.deepStrictEqual(offers(),offers());
p.primaryPosition="P";
assert(!offers().offers.some(o=>o.route==="draft"),"pitcher zero pitching proof even with batting history");
assert(offers().offers.find(o=>o.route==="college").reasonCodes.includes("pitchingEvidenceUnavailable"));
p.primaryPosition="C";p.body.injuryRisk=15;p.academics=0;
assert.deepStrictEqual(offers().offers.map(o=>o.route),["rehab"]);
p.body={};p.academics=6;Object.keys(p.baseballSkills).forEach(k=>p.baseballSkills[k]=2);
assert(!offers().offers.some(o=>o.route==="draft"),"quantity cannot replace talent");
assert(offers().offers.length>0);
p.baseballSkills={batting:12,baseballIQ:12,catching:12,blocking:12,gameCalling:12,throwing:12};
const evidence=E.derive(p,{intent:"draft"}),set=O.generate(evidence);
Object.assign(p,{chapter:"青棒關鍵年",criticalYearStep:7,careerExit:"",highSchoolCareerSettlement:{settlementIdentity:set.offerSetIdentity+"|settlement",evidence,offerSet:set}});
assert(!O.commitHighSchoolCareerChoice(p,"invented").ok);
assert.strictEqual(p.careerExit,"");
const chosen=set.offers.find(o=>o.route==="college");
assert(O.commitHighSchoolCareerChoice(p,chosen.offerId).ok);
assert.strictEqual(p.careerExit,"大學棒球");
assert(!O.commitHighSchoolCareerChoice(p,set.offers.find(o=>o.route==="rehab").offerId).ok);
console.log("High School Career Offers: 14 assertions passed.");

const lateBloomer={...p,highSchoolRoleCode:"starter",highSchoolYearOneStartingRole:"bench",
 highSchoolYearTransitionState:{history:[{nextHighSchoolYear:2,priorRole:"bench",currentRole:"rotation"},{nextHighSchoolYear:3,priorRole:"rotation",currentRole:"starter"}]},
 highSchoolYearOneMatchHistory:[],highSchoolYearTwoMatchHistory:[{matchId:"y2",actualExposure:{plateAppearances:4,defensiveInnings:7},playerContribution:{strong:3}}],
 highSchoolYearThreeMatchHistory:[{matchId:"y3",actualExposure:{plateAppearances:4,defensiveInnings:7},playerContribution:{strong:3}}]};
const late=E.derive(lateBloomer,{intent:"draft"});
assert.deepStrictEqual(late.roleJourney.years.map(y=>y.startingRole),["bench","rotation","starter"]);
assert(O.generate(late).offers.some(o=>o.route==="draft"));
const zero=E.derive({...lateBloomer,highSchoolYearTwoMatchHistory:[],highSchoolYearThreeMatchHistory:[]},{intent:"draft"});
assert(!O.generate(zero).offers.some(o=>o.route==="draft"));
const plateau=E.derive({...lateBloomer,highSchoolRoleCode:"rotation",highSchoolYearOneStartingRole:"starter",
 highSchoolYearOneMatchHistory:[{matchId:"y1",actualExposure:{plateAppearances:4,defensiveInnings:7},playerContribution:{strong:3}}],
 highSchoolYearTransitionState:{history:[{nextHighSchoolYear:2,priorRole:"starter",currentRole:"starter"},{nextHighSchoolYear:3,priorRole:"starter",currentRole:"rotation"}]},
 highSchoolYearThreeMatchHistory:[{matchId:"y3",actualExposure:{plateAppearances:3,defensiveInnings:5},playerContribution:{failure:3}}]},{intent:"draft"});
assert(plateau.performanceProof.careerQuality>0);
assert.strictEqual(plateau.performanceProof.sampleCount,3);
assert(O.generate(plateau).offers.some(o=>o.route==="draft"),"late slump doesn't erase past proof");
const schoolA=E.derive({...lateBloomer,schoolInvitationState:{selectedSchoolId:"a",selectedPositionCompetitionContext:{competitionDensity:"veryHigh"}}},{intent:"draft"});
const schoolB=E.derive({...lateBloomer,schoolInvitationState:{selectedSchoolId:"b",selectedPositionCompetitionContext:{competitionDensity:"low"}}},{intent:"draft"});
assert.notStrictEqual(schoolA.evidenceIdentity,schoolB.evidenceIdentity);
assert.deepStrictEqual(O.generate(schoolA).offers.map(o=>[o.route,o.tier]),O.generate(schoolB).offers.map(o=>[o.route,o.tier]));
assert(O.generate(schoolA).offers[0].reasonCodes.includes("highCompetitionContext"));
assert(!O.generate(schoolB).offers[0].reasonCodes.includes("highCompetitionContext"));
assert.strictEqual(O.generate({...late,talent:{capability:999}}),null,"modified snapshot fails closed");
console.log("Late bloomer / plateau / school environment / evidence integrity: PASS.");
