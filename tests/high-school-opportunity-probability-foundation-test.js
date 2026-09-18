const assert=require("assert"),Q=require("../high-school-opportunity-selection"),N=require("../high-school-exchange-network"),G=require("../high-school-match-opportunity-generation"),S=require("../high-school-schedule-opportunity");
let passed=0;const test=(name,fn)=>{fn();passed++;console.log("PASS "+name);},clone=v=>JSON.parse(JSON.stringify(v));
function fixture(){return {context:{careerId:"career",careerYear:2,seasonPhase:"year-two-spring-evaluation",sequence:1,playerSchoolId:"A",mandatorySlots:[]},currentCoachId:"coach-A",
  schoolRecords:["A","B"].map(schoolId=>({schoolId,teamType:"school",rosterValid:true,sourceRef:"registry:"+schoolId})),relationshipLedger:N.emptyState(),schedule:S.emptyState(),sources:[]};}
function evidence(type="awayVisit",extra={}) {
  const isHome=type==="homeVisit",neutral=["developmentExchange","sharedTrainingContext","competitionEncounter","schoolExchangeMatch"].includes(type);
  return N.createRelationshipEvidence({evidenceType:type,careerId:"career",careerYear:1,seasonPhase:"post-autumn-evaluation",sequence:2,schoolAId:"A",schoolBId:"B",
    source:{type:"completedMatch",sourceId:"match"},matchId:"match",scheduleEntryId:"entry",matchOrigin:type==="developmentExchange"?"developmentMatch":type==="sharedTrainingContext"?"trainingCamp":type==="competitionEncounter"?"officialCompetition":neutral?"neutralFriendly":isHome?"homeInvitationFriendly":"awayInvitationFriendly",
    completed:true,direction:neutral?"neutral":isHome?"hostedOpponent":"visitedOpponent",hostSchoolId:neutral?null:isHome?"A":"B",visitorSchoolId:neutral?null:isHome?"B":"A",sourceReason:type,...extra});
}
function add(i,type="awayVisit"){const e=evidence(type);N.appendEvidence(i.relationshipLedger,[e,...(["awayVisit","homeVisit"].includes(type)?[N.deriveReturnVisitEvidence(e)]:[])]);return i;}
function coach(i,sourceType="initiatedContact"){N.appendEvidence(i.relationshipLedger,[N.deriveCoachSchoolEvidence({careerId:"career",careerYear:1,seasonPhase:"post-autumn-evaluation",sequence:2,schoolAId:"A",schoolBId:"B",coachId:"coach-A",source:{type:sourceType,sourceId:"contact"}},{schoolIds:["A","B"],coachIds:["coach-A"]})]);return i;}
const P=require("../high-school-opportunity-probability");
const context=(career="career",year=2,phase="year-two-spring-evaluation")=>({careerId:career,careerYear:year,seasonPhase:phase,selectionWindowId:JSON.stringify([career,year,phase,1,"A"])});
const c=(id,producer="returnVisitProducer",extra={})=>({candidateId:id,priority:"optional",eligible:true,exclusionReasons:[],source:{type:"schoolRelationship",sourceId:"source:"+id},sourceProvenance:{producerType:producer},...extra});
const result=(candidates=[c("A"),c("B",null,{sourceAuthority:"fallback"})],ctx=context(),extra={})=>P.deriveProbabilityResult({candidates,context:ctx,...extra});
const select=i=>Q.selectOpportunityCandidates({...i,probabilityPolicy:"enabled"});
function camp(id,group="camp",reason="eligibleExplicitPlan"){return c(id,"trainingCampProducer",{source:{type:"trainingCampPlan",sourceId:id},sourceProvenance:{producerType:"trainingCampProducer",campSourceId:group,reasonCode:reason}});}
function plan(i){i.sources.push({opportunityType:"trainingCampOpportunity",opponentSchoolId:"B",source:{type:"trainingCampPlan",sourceId:"plan"},explicit:true});return i;}
function official(i){i.context.mandatorySlots=[{...i.context,sourceId:"official"}];i.sources.push({opportunityType:"officialCompetitionOpportunity",opponentSchoolId:"B",source:{type:"competitionCalendar",sourceId:"official"},sourceAuthority:"existing",matchId:"official"});return i;}
test("profile contract and version",()=>{const p=P.deriveProbabilityProfile(c("A"),context());for(const k of ["candidateId","selectionWindowId","sourceType","producerType","baseWeight","weightFactors","finalWeight","probabilityVersion","provenance"])assert(Object.hasOwn(p,k));assert.strictEqual(p.probabilityVersion,"high-school-opportunity-probability-v1");});
test("stable pool identity independent of insertion order",()=>assert.strictEqual(P.deriveCandidatePoolIdentity([c("A"),c("B")]),P.deriveCandidatePoolIdentity([c("B"),c("A")])));
test("stable weights",()=>assert.deepStrictEqual(result().weights,result().weights));
test("friendly source classes 3 2 2 1",()=>{const ps=P.deriveCandidateWeights([c("A"),c("B","coachNetworkProducer"),c("C","schoolRelationshipProducer"),c("D",null,{sourceAuthority:"fallback"})],context());assert.deepStrictEqual(ps.map(p=>p.baseWeight),[3,2,2,1]);});
test("camp source classes",()=>{for(const [reason,expected] of [["eligibleExplicitPlan",3],["eligibleSharedTrainingContext",2],["eligibleCoachNetwork",2],["eligibleSchoolRelationship",2]])assert.strictEqual(P.deriveProbabilityProfile(camp("A","camp",reason),context()).baseWeight,expected);});
test("mandatory never weighted",()=>assert.strictEqual(P.deriveProbabilityProfile(c("M",null,{priority:"mandatory"}),context()),null));
test("blocked candidate excluded",()=>assert.strictEqual(result([c("X",null,{eligible:false,exclusionReasons:["illegal"]})]).weights.length,0));
test("zero negative nonfinite weights excluded with diagnostics",()=>{const r=P.drawWeightedCandidate({weights:[{candidateId:"A",finalWeight:0},{candidateId:"B",finalWeight:-1},{candidateId:"C",finalWeight:NaN},{candidateId:"D",finalWeight:1}],context:context()});assert.strictEqual(r.selectedCandidateId,"D");assert.strictEqual(r.diagnostics.length,3);assert(r.diagnostics.every(d=>d.reason==="excludedByZeroWeight"));});
test("single candidate always selected",()=>assert.strictEqual(result([c("A")]).selectedCandidateId,"A"));
test("two weighted candidates valid range",()=>{const r=result();assert(["A","B"].includes(r.selectedCandidateId));assert(r.drawValue>=0&&r.drawValue<r.drawRange);assert.strictEqual(r.drawRange,4);});
test("same state same draw",()=>assert.deepStrictEqual(result(),result()));
test("changed career window seed distinct",()=>assert.notStrictEqual(result(undefined,context("other")).draws[0].drawRef,result().draws[0].drawRef));
test("cross year new draw namespace",()=>assert.notStrictEqual(result(undefined,context("career",3)).draws[0].drawRef,result().draws[0].drawRef));
test("cross phase new draw namespace",()=>assert.notStrictEqual(result(undefined,context("career",2,"year-two-autumn-evaluation")).draws[0].drawRef,result().draws[0].drawRef));
test("JSON roundtrip deterministic",()=>{const cs=[c("A"),c("B")];assert.deepStrictEqual(result(clone(cs),clone(context())),result(cs));});
test("no global RNG or clock used",()=>{const expected=result(),random=Math.random,now=Date.now;Math.random=()=>{throw Error("global RNG");};Date.now=()=>{throw Error("clock");};try{assert.deepStrictEqual(result(),expected);}finally{Math.random=random;Date.now=now;}});
test("existing seeded RNG instance untouched",()=>{const R=require("../team-roster-foundation"),a=R.createSeededRandom("game"),b=R.createSeededRandom("game");a();b();result();assert.deepStrictEqual([a(),a(),a()],[b(),b(),b()]);});
test("profiles and input remain pure",()=>{const cs=[camp("A"),camp("B")],before=clone(cs);result(cs);assert.deepStrictEqual(cs,before);});
test("normalized shares sum to one",()=>assert(Math.abs(result([camp("A"),camp("B"),c("C")]).weights.reduce((s,w)=>s+w.normalizedProbability,0)-1)<1e-12));
test("semantic duplicates removed before probability",()=>{const i=coach(add(fixture())),r=select(i);const ids=r.probabilityResult.weights.map(w=>w.candidateId);assert.strictEqual(new Set(ids).size,ids.length);assert(!r.probabilityResult.weights.some(w=>w.weightClass==="coachNetwork"));});
test("production budget remains one",()=>assert.strictEqual(select(fixture()).optionalSelections.length,1));
test("future sampling budget two without replacement",()=>{const r=result([c("A"),c("B"),c("C")],context(),{budget:2});assert.strictEqual(r.selectedCandidateIds.length,2);assert.strictEqual(new Set(r.selectedCandidateIds).size,2);assert.deepStrictEqual(r.draws.map(d=>d.drawIndex),[0,1]);});
test("overlarge standalone sample stops at pool size",()=>assert.strictEqual(result([c("A"),c("B")],context(),{budget:5}).selectedCandidateIds.length,2));
test("stable draw indices across replay",()=>assert.deepStrictEqual(result([c("A"),c("B")],context(),{budget:2}),result([c("A"),c("B")],context(),{budget:2})));
for(const status of ["declined","expired"])test(status+" window bypasses redraw",()=>{const i=fixture(),r=select(i),o=Q.materializeSelectedCandidates(i.schedule,r,{...i,probabilityPolicy:"enabled"}).materialized[0];S.setOpportunityStatus(i.schedule,o.opportunityId,status);const again=select(i);assert.strictEqual(again.probabilityResult.reason,"existingOpportunityBypass");assert.strictEqual(again.probabilityResult.draws.length,0);});
test("existing opportunity bypass",()=>{const i=fixture(),r=select(i);Q.materializeSelectedCandidates(i.schedule,r,{...i,probabilityPolicy:"enabled"});assert.strictEqual(select(i).probabilityResult.weights.length,0);});
test("mandatory conflict bypass before any weights",()=>{const r=select(official(plan(fixture())));assert.strictEqual(r.mandatorySelections.length,1);assert.strictEqual(r.probabilityResult.reason,"mandatoryBypassProbability");assert.strictEqual(r.probabilityResult.weights.length,0);});
test("budget zero before probability",()=>{const r=select({...fixture(),maxOptionalPerSelectionWindow:0});assert.strictEqual(r.probabilityResult.reason,"budgetNotAvailable");assert.strictEqual(r.probabilityResult.draws.length,0);});
test("type conflict remains deterministic before draw",()=>{const r=select(plan(fixture()));assert(r.probabilityResult.weights.every(w=>w.provenance.campSourceId));assert(r.rejectedCandidates.some(c=>c.reasons.includes("typeConflict")));});
test("unknown source safe minimal fallback",()=>{const p=result([c("unknown",null)]).weights[0];assert.strictEqual(p.finalWeight,1);assert(p.diagnostics.includes("unknownSourceWeightFallback"));});
test("source weight explainability",()=>{const p=result().weights[0];assert.strictEqual(p.weightFactors[0].name,"sourceAuthorityClass");assert.strictEqual(p.weightClass,"explicitReturnVisit");});
test("camp group size total invariant",()=>{for(const n of [1,3]){const r=result(Array.from({length:n},(_,i)=>camp("camp-"+i)).concat(c("fallback",null,{sourceAuthority:"fallback"})));assert.strictEqual(r.weights.filter(w=>w.provenance.campSourceId).reduce((s,w)=>s+w.finalWeight,0),3);assert.strictEqual(r.drawRange,4);}});
test("friendly source count cannot inflate probability",()=>{const i=add(fixture()),before=select(i).probabilityResult.weights;coach(i);assert.deepStrictEqual(select(i).probabilityResult.weights,before);});
test("strength performance recency counts do not affect weights",()=>{const a=c("A"),before=result([a]);a.teamStrength=100;a.schoolStandard="elite";a.performance=99;a.sourceProvenance.exchangeCount=100;a.sourceProvenance.originCareerYear=1;assert.deepStrictEqual(result([a]),before);});
test("instrumentation neutral",()=>{const ctx={...context(),trace:true};assert.deepStrictEqual(result(undefined,ctx),result());});
test("probability disabled retains old result shape",()=>{const r=Q.selectOpportunityCandidates({...fixture(),probabilityPolicy:"disabled"});assert(!Object.hasOwn(r,"probabilityResult"));assert.deepStrictEqual(r,Q.selectOpportunityCandidates(fixture()));});
test("draw audit is pure",()=>{const r=result(),before=clone(r),a=P.auditProbability(r);assert.strictEqual(a.totalWeight,4);assert.deepStrictEqual(r,before);});
const batch={identities:1200,weight3:0,weight1:0,equalA:0,campTwoSchool:0,campFourSchool:0};
for(let n=0;n<batch.identities;n++){const ctx=context("audit-career-"+n),r=result(undefined,ctx);batch[r.selectedCandidateId==="A"?"weight3":"weight1"]++;const equal=P.drawWeightedCandidate({weights:[{candidateId:"A",finalWeight:1},{candidateId:"B",finalWeight:1}],context:ctx});if(equal.selectedCandidateId==="A")batch.equalA++;
 for(const [size,key] of [[1,"campTwoSchool"],[3,"campFourSchool"]])if(result(Array.from({length:size},(_,i)=>camp("camp-"+i)).concat(c("fallback",null,{sourceAuthority:"fallback"})),ctx).selectedCandidateId!=="fallback")batch[key]++;}
test("statistical relative weight sanity",()=>{assert(batch.weight3>batch.weight1*1.8);assert(batch.weight3/batch.identities>.65&&batch.weight3/batch.identities<.85);});
test("monotonic weight sanity across same identities",()=>assert(batch.weight3>=batch.equalA));
test("camp multi-school statistical bias bounded",()=>assert(Math.abs(batch.campTwoSchool-batch.campFourSchool)/batch.identities<.10));
console.log("PROBABILITY_SANITY_JSON="+JSON.stringify(batch));
console.log(`${passed}/${passed} PASS`);
