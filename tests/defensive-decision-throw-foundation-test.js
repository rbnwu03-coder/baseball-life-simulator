const assert = require("assert");
const fs = require("fs");
const D = require("../defensive-decision-throw-foundation.js");
const R = require("../defensive-reach-secure-foundation.js");
const O = require("../defensive-opportunity-foundation.js");
const F = require("../force-advancement.js");
const P = require("../batted-ball-physical.js");
const Team = require("../team-roster-foundation.js");
const clone = value => JSON.parse(JSON.stringify(value));
let passed=0; function test(name,fn){fn();passed++;console.log(`PASS ${name}`);}
function fixture(runners=[null,null,null],outs=0,position="2B",airborne=false) {
  const physicalTruth={version:P.VERSION,identity:"decision-physical",contactQuality:"solid",ballType:airborne?"flyBall":"groundBall",
    pace:"firm",direction:position==="2B"?"rightSide":"leftSide",depth:airborne?"medium":null};
  const activeRoster={lineup:Team.POSITION_ORDER.map(position=>({id:`active-${position}`,position,age:18,throws:"R"})),
    bench:[{id:"bench-1B",position:"1B"}]};
  const opportunity=O.resolveDefensiveOpportunity({physicalTruth,activeRoster});
  const capabilities={defenderId:opportunity.primaryDefenderId,reaction:10,range:10,mobility:10,fielding:10,catching:10};
  const base={physicalTruth,activeRoster,opportunity,capabilities,roll:.5};
  const reachResult=R.resolveReach(base),secureResult=R.resolveSecure({...base,reachResult});
  return {...base,reachResult,secureResult,runners,outs,batterRunnerId:airborne?null:"batter",
    runnerStates:runners.map((runnerId,i)=>runnerId?{runnerId,originBase:i+1,targetBase:["second","third","home"][i],movementState:"holding"}:null).filter(Boolean)};
}
const routes=i=>D.buildDecisionOpportunity(i).availableRoutes.map(r=>r.routeId);
const select=(i,id)=>{const opportunity=D.buildDecisionOpportunity(i);return {input:i,opportunity,selection:D.selectDefensiveRoute(opportunity,id,i)};};
const throwing=(args,arm=10,throwing=10)=>D.resolveThrow({...args,capabilities:{defenderId:args.selection.defenderId,arm,throwing},rolls:{strength:.5,accuracy:.5},transferState:"ready"});
test("empty bases have hold and first only with actual batter runner",()=>{
  const i=fixture();assert.deepEqual(routes(i),["holdBall","secureFirstBaseOut"]);i.batterRunnerId=null;assert.deepEqual(routes(i),["holdBall"]);
});
for(const outs of [0,1,2]) test(`runner first / ${outs} outs: canonical force and DP threshold`,()=>{
  const i=fixture(["r1",null,null],outs),op=D.buildDecisionOpportunity(i);
  assert.ok(routes(i).includes("forceSecond"));assert.equal(routes(i).includes("initiate463"),outs<2);
  assert.equal(op.availableRoutes.find(r=>r.routeId==="forceSecond").targetRunnerId,"r1");
  assert.deepEqual(op.context.forceChain,F.buildInitialLiveBallForceChain({runners:i.runners,batterRunnerId:"batter"}));
});
test("second only has no force third; contiguous first+second creates both forces",()=>{
  assert.ok(!routes(fixture([null,"r2",null])).includes("attackLeadRunnerThird"));
  const i=fixture(["r1","r2",null]);assert.ok(routes(i).includes("attackLeadRunnerThird"));assert.ok(routes(i).includes("forceSecond"));
});
test("loaded bases force home even at two outs",()=>{
  const op=D.buildDecisionOpportunity(fixture(["r1","r2","r3"],2));
  const home=op.availableRoutes.find(r=>r.routeId==="homeForceOut");assert.equal(home.targetRunnerId,"r3");assert.equal(home.forceType,"force");
});
for(const pos of ["SS","2B"]) for(const outs of [0,2]) test(`${pos}/${outs}: held runner is not a home play, committed runner is`,()=>{
  const i=fixture([null,null,"r3"],outs,pos);assert.ok(!routes(i).includes("preventRunHome"));
  i.runnerStates[0].movementState="committed";assert.ok(routes(i).includes("preventRunHome"));
});
test("poor viability does not erase inspectable baseball legality",()=>{
  const i=fixture([null,null,"r3"]);i.runnerStates[0].movementState="advancing";i.routeWindows={preventRunHome:"expired"};
  const op=D.buildDecisionOpportunity(i),r=op.availableRoutes.find(r=>r.routeId==="preventRunHome");
  assert.equal(r.legality,"legal");assert.equal(r.contextualAvailability,true);assert.equal(r.viability,"poor");
  assert.equal(D.selectDefensiveRoute(op,r.routeId,i).route.routeId,r.routeId);
});
test("hold consumes no throw capability or roll and has no receiver",()=>{
  const result=D.resolveThrow({...select(fixture(),"holdBall"),rolls:{get strength(){throw Error("RNG consumed");}},capabilities:{get arm(){throw Error("arm read");}}});
  assert.equal(result.throwAttempted,false);assert.equal(result.receiverId,null);assert.equal(result.variationEvidence.consumed,false);
});
test("no possession gives no controlled decision or selected throw",()=>{
  const i=fixture();i.capabilities={...i.capabilities,fielding:0,catching:0};i.secureResult=R.resolveSecure(i);
  const op=D.buildDecisionOpportunity(i);assert.equal(op.status,"noControlledDecision");assert.deepEqual(op.availableRoutes,[]);
  assert.throws(()=>D.selectDefensiveRoute(op,"secureFirstBaseOut",i),/contextless/);
});
test("notReached prevents all controlled decisions",()=>{
  const i=fixture();i.capabilities={...i.capabilities,reaction:0,range:0,mobility:0};i.reachResult=R.resolveReach(i);i.secureResult=R.resolveSecure(i);
  assert.equal(D.buildDecisionOpportunity(i).status,"noControlledDecision");
});
test("same selected route, strong arm poor accuracy vs weak arm accurate",()=>{
  const a=select(fixture(),"secureFirstBaseOut"),before=JSON.stringify(a);
  const inaccurate=throwing(a,15,0),weak=throwing(a,0,15),excellent=throwing(a,15,15);
  assert.ok(inaccurate.strengthMargin>0&&inaccurate.accuracyMargin<0);assert.equal(inaccurate.throwQuality,"offline");
  assert.ok(weak.strengthMargin<0&&weak.accuracyMargin>0);assert.equal(weak.throwQuality,"lateWeakThrow");
  assert.equal(excellent.throwQuality,"onTarget");assert.equal(inaccurate.decisionIdentity,excellent.decisionIdentity);
  assert.equal(JSON.stringify(a),before);
  for(const result of [inaccurate,weak,excellent]) for(const key of ["out","safe","error","runs","runnerChanges","grade","decisionQuality"]) assert.ok(!(key in result));
});
test("challenging throw and different route distance are distinguishable",()=>{
  const i=fixture(["r1",null,null],0,"SS");
  const first=select(i,"secureFirstBaseOut"),second=select(i,"forceSecond");
  assert.ok(throwing(first).throwDemand.strength>throwing(second).throwDemand.strength);
  assert.equal(throwing(first,10,4.5).throwQuality,"challengingReceive");
  assert.equal(D.throwDemand({position:"3B",route:{targetBase:"first"}},i.secureResult).distanceClass,"long");
});
test("questionable but contextual home choice stays chosen after excellent execution",()=>{
  const i=fixture([null,null,"r3"]);i.runnerStates[0].movementState="committed";i.routeWindows={preventRunHome:"narrow"};
  const a=select(i,"preventRunHome"),result=throwing(a,20,20);
  assert.equal(result.routeId,"preventRunHome");assert.equal(result.throwQuality,"onTarget");assert.ok(a.opportunity.availableRoutes.some(r=>r.routeId==="secureFirstBaseOut"));
});
test("active receiver only, replacement rejects prior decision, invalid assignment fails",()=>{
  const i=fixture(),a=select(i,"secureFirstBaseOut");assert.equal(a.selection.route.receiverId,"active-1B");
  const changed=clone(i);changed.activeRoster.lineup.find(a=>a.position==="1B").id="replacement";
  assert.throws(()=>D.selectDefensiveRoute(a.opportunity,"secureFirstBaseOut",changed),/stale/);
  changed.opportunity=O.resolveDefensiveOpportunity(changed);changed.reachResult=R.resolveReach(changed);changed.secureResult=R.resolveSecure(changed);
  assert.equal(select(changed,"secureFirstBaseOut").selection.route.receiverId,"replacement");
  const invalid=clone(i);invalid.activeRoster.lineup.pop();assert.throws(()=>D.buildDecisionOpportunity(invalid),/integrity/i);
});
test("runner movement, outs, force identity and selected target staleness reject",()=>{
  const i=fixture([null,null,"r3"]);i.runnerStates[0].movementState="committed";const a=select(i,"preventRunHome");
  const changed=clone(i);changed.runnerStates[0].movementState="holding";
  assert.throws(()=>D.selectDefensiveRoute(a.opportunity,"preventRunHome",changed),/stale/);
  assert.throws(()=>throwing({...a,input:{...i,outs:2}}),/stale/);
  assert.throws(()=>throwing({...a,selection:{...a.selection,route:{...a.selection.route,targetRunnerId:"other"}}}),/stale/);
  assert.throws(()=>D.selectDefensiveRoute(a.opportunity,"fictional",i),/contextless/);
  const chain=F.buildInitialLiveBallForceChain({runners:["r1","r2",null],batterRunnerId:"batter"});
  assert.throws(()=>D.buildDecisionOpportunity({...fixture([null,"r2",null]),forceChain:chain}),/force chain/);
  assert.deepEqual(routes({...fixture([null,"r2",null]),batterRunnerId:null}),["holdBall"]);
});
test("deterministic independent throw namespaces and frozen evidence",()=>{
  const a=select(fixture(),"secureFirstBaseOut");assert.deepEqual(throwing(a),throwing(a));
  const options={...a,capabilities:{defenderId:a.selection.defenderId,arm:7,throwing:7},transferState:"ready"};
  assert.deepEqual(D.resolveThrow(options),D.resolveThrow(options));
  const result=throwing(a);assert.notEqual(result.variationEvidence.strength.namespace,result.variationEvidence.accuracy.namespace);
  assert.ok(Object.isFrozen(result.inputs));assert.ok(!fs.readFileSync(require.resolve("../defensive-decision-throw-foundation.js"),"utf8").includes("Math.random"));
});
test("transfer readiness is explicit and failed transfer does not roll",()=>{
  const a=select(fixture(),"secureFirstBaseOut");assert.throws(()=>D.resolveThrow(a),/readiness/);
  const result=D.resolveThrow({...a,transferState:"failed",rolls:{get accuracy(){throw Error("RNG consumed");}}});
  assert.equal(result.throwAttempted,false);assert.equal(result.releaseQuality,"transferUnavailable");
});
test("airborne hold and tag-up context never inherit ground forces",()=>{
  const i=fixture(["r1","r2","r3"],1,"SS",true);assert.deepEqual(routes(i),["holdBall"]);
  i.runnerStates[2].movementState="committed";const op=D.buildDecisionOpportunity(i);
  assert.ok(routes(i).includes("preventRunHome"));assert.equal(op.context.forceChain,null);assert.ok(!routes(i).includes("homeForceOut"));
  i.outs=3;assert.deepEqual(routes(i),[]);
});
test("line-drive retouch challenge remains deferred instead of fabricated force",()=>{
  const i=fixture(["r1",null,null],1,"SS",true);
  i.physicalTruth={...i.physicalTruth,ballType:"lineDrive",depth:"shallow"};i.opportunity=O.resolveDefensiveOpportunity(i);
  i.capabilities.defenderId=i.opportunity.primaryDefenderId;i.reachResult=R.resolveReach(i);i.secureResult=R.resolveSecure(i);
  i.runnerStates[0]={...i.runnerStates[0],movementState:"retreating",targetBase:"first"};
  assert.deepEqual(routes(i),["holdBall"]);
});
test("existing 2B first-throw projection never invents separate accuracy evidence",()=>{
  const a=select(fixture(["r1",null,null]),"initiate463");
  const result=D.projectExistingThrow({...a,playerLeg:{transfer:"completed",firstThrow:"completed"},evidence:{sample:.8}});
  assert.equal(result.throwQuality,"legacyUsableDelivery");assert.equal(result.strengthMargin,null);assert.equal(result.accuracyMargin,null);
  assert.equal(result.variationEvidence.consumed,false);assert.equal(a.selection.route.continuation.status,"pendingExistingOrFutureSecondLeg");
});
console.log(`${passed}/${passed} PASS`);
