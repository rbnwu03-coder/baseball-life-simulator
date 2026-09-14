const assert = require("assert");
const S = require("../high-school-schedule-opportunity");
const M = require("../match-context-foundation");
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log("PASS " + name); };
const input = (extra = {}) => ({careerId:"career-seed-1",careerYear:1,seasonPhase:"spring",sequence:1,
  playerSchoolId:"school-A",opponentSchoolId:"school-B",opportunityType:"incomingFriendlyInvitation",
  source:{type:"coachNetwork",sourceId:"coach-contact-1"},...extra});
const context = (extra = {}) => ({careerId:"career-seed-1",careerYear:1,seasonPhase:"spring",playerSchoolId:"school-A",schoolIds:["school-A","school-B"],...extra});
function scheduled(extra = {}, ctx = context()) {
  const state = S.emptyState(), opportunity = S.offerOpportunity(state,input({status:"accepted",...extra}));
  const entry = S.scheduleOpportunity(state,opportunity.opportunityId,ctx);
  return {state,opportunity,entry};
}
for (const [type,origin] of Object.entries(S.ORIGIN_MAP)) test("create " + type, () => {
  const opportunity = S.createOpportunity(input({opportunityType:type}));
  assert.strictEqual(opportunity.matchOrigin,origin); assert.strictEqual(opportunity.status,"offered");
});
test("reject self",()=>assert.throws(()=>S.createOpportunity(input({opponentSchoolId:"school-A"})),/self/));
test("reject invalid year",()=>[0,4,1.5,"1"].forEach(careerYear=>assert.throws(()=>S.createOpportunity(input({careerYear})),/year/)));
for (const status of ["declined","expired"]) test(status + " blocked",()=>{
  const state=S.emptyState(),o=S.offerOpportunity(state,input());S.setOpportunityStatus(state,o.opportunityId,status);
  assert.throws(()=>S.scheduleOpportunity(state,o.opportunityId,context()),/not-accepted/);
});
test("offered requires acceptance",()=>assert(!S.isOpportunityEligible(S.createOpportunity(input()),context()).eligible));
test("accepted schedules",()=>{const {entry,opportunity}=scheduled();assert.strictEqual(entry.status,"scheduled");assert.strictEqual(opportunity.status,"scheduled");});
test("duplicate scheduling idempotent",()=>{const {state,opportunity,entry}=scheduled();assert.strictEqual(S.scheduleOpportunity(state,opportunity.opportunityId,context()),entry);assert.strictEqual(state.entries.length,1);});
test("official entry retains slot against optional",()=>{
  const {state,entry}=scheduled({opportunityType:"officialCompetitionOpportunity",source:{type:"competitionCalendar",sourceId:"official-1"}});
  const friendly=S.offerOpportunity(state,input({status:"accepted"}));
  assert.throws(()=>S.scheduleOpportunity(state,friendly.opportunityId,context()),/occupied-slot/);
  assert.strictEqual(state.entries[0],entry);assert.strictEqual(state.entries.length,1);
});
test("external mandatory stage blocks optional before entry exists",()=>{
  assert.throws(()=>scheduled({},context({mandatorySlots:[{careerYear:1,seasonPhase:"spring",sequence:1,sourceId:"official-1"}]})),/mandatory/);
});
test("stable opportunity identity independent of display and source field ordering",()=>{
  assert.strictEqual(S.createOpportunity(input()).opportunityId,S.createOpportunity(input({displayName:"renamed",source:{sourceId:"coach-contact-1",type:"coachNetwork"}})).opportunityId);
});
test("stable entry identity",()=>assert.strictEqual(scheduled().entry.scheduleEntryId,scheduled().entry.scheduleEntryId));
for (const [type,origin] of Object.entries(S.ORIGIN_MAP)) test("adapter mapping " + type,()=>{
  const {state,entry}=scheduled({opportunityType:type});const c=M.createMatchContext(S.deriveMatchContextInput(state,entry.scheduleEntryId,"match-1"));
  assert.strictEqual(c.matchOrigin,origin);
  if(type==="incomingFriendlyInvitation") {assert(M.isPlayerAway(c));assert.strictEqual(c.venueContext.type,"awayGround");}
  if(type==="outgoingFriendlyInvitation") {assert(M.isPlayerHome(c));assert.strictEqual(c.venueContext.type,"homeGround");}
  if(type==="trainingCampOpportunity") assert.strictEqual(c.venueContext.type,"trainingVenue");
});
test("provenance chain",()=>{const {state,entry,opportunity}=scheduled();const c=M.createMatchContext(S.deriveMatchContextInput(state,entry.scheduleEntryId,"match-1"));assert.strictEqual(c.provenance.opportunityId,opportunity.opportunityId);assert.strictEqual(c.scheduleEntryId,entry.scheduleEntryId);assert.strictEqual(c.provenance.sourceId,"coach-contact-1");});
test("normalization idempotent",()=>{const {state}=scheduled();assert.deepStrictEqual(S.normalizeState(S.normalizeState(state)),state);});
test("legacy empty normalization",()=>assert.deepStrictEqual(S.normalizeState(undefined),S.emptyState()));
test("year/phase/school eligibility",()=>{
  const o=S.createOpportunity(input({status:"accepted"}));
  for(const ctx of [context({careerYear:2}),context({seasonPhase:"autumn-exhibition"}),context({schoolIds:["school-A"]}),context({careerId:"different"})]) assert(!S.isOpportunityEligible(o,ctx).eligible);
  assert(S.isOpportunityEligible(o,context()).eligible);
});
test("cancelled cannot launch",()=>{const {state,entry}=scheduled();entry.status="cancelled";assert.throws(()=>S.assertCanLaunch(state,entry.scheduleEntryId,context(),null),/cannot launch/);});
test("completed cannot relaunch and carries only result references",()=>{
  const {state,entry}=scheduled();const match={id:"match-1",matchContext:M.createMatchContext(S.deriveMatchContextInput(state,entry.scheduleEntryId,"match-1"))};
  S.markScheduleStarted(state,entry.scheduleEntryId,match);Object.assign(match,{completed:true,settled:true,gameRecord:{gameId:"match-1"}});
  S.markScheduleCompleted(state,match);S.markScheduleCompleted(state,match);
  assert.strictEqual(entry.historyMatchId,"match-1");assert.strictEqual(entry.gameRecordId,"match-1");assert(!("scores" in entry));
  assert.throws(()=>S.assertCanLaunch(state,entry.scheduleEntryId,context(),match),/cannot launch/);
});
test("cannot change offered opponent or origin facts on reload",()=>{
  const {state,opportunity}=scheduled();assert.throws(()=>S.offerOpportunity(state,{...opportunity,plannedContext:{homeTeamId:"school-B",awayTeamId:"school-A",assignmentSource:"changed"}}),/facts/);
});
test("save rejects duplicates and orphan references",()=>{
  const {state}=scheduled();const clone=JSON.parse(JSON.stringify(state));clone.entries.push(clone.entries[0]);assert.throws(()=>S.normalizeState(clone),/duplicate/);
  state.opportunities=[];assert.throws(()=>S.normalizeState(state),/requires/);
});
test("active match prevents second launch",()=>{const {state,entry}=scheduled();assert.throws(()=>S.assertCanLaunch(state,entry.scheduleEntryId,context(),{id:"other"}),/active/);});
test("camp ID independent of match identity",()=>{const {state,entry}=scheduled({opportunityType:"trainingCampOpportunity",plannedContext:{campId:"camp-1"}});const c=S.deriveMatchContextInput(state,entry.scheduleEntryId,"game-1");assert.strictEqual(c.campId,"camp-1");assert.notStrictEqual(c.matchId,c.campId);});
console.log(`${passed}/${passed} PASS`);
