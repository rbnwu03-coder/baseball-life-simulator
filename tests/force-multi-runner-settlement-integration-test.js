const assert = require("assert");
const Force = require("../force-advancement.js");
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const chain = runners => Force.buildInitialLiveBallForceChain({ runners, batterRunnerId:"BR" });
const settle = (runners, route="doublePlay", resultCode="twoOuts", extra={}) => Force.settleForceAdvancement({forceChain:chain(runners),route,resultCode,...extra});
const cases = [
  ["R1", ["R1",null,null], {BR:"first",R1:"second"}],
  ["R1+R2", ["R1","R2",null], {BR:"first",R1:"second",R2:"third"}],
  ["loaded", ["R1","R2","R3"], {BR:"first",R1:"second",R2:"third",R3:"home"}],
  ["R2", [null,"R2",null], {BR:"first"}],
  ["R3", [null,null,"R3"], {BR:"first"}],
  ["R1+R3", ["R1",null,"R3"], {BR:"first",R1:"second"}]
];
for (const [name,bases,targets] of cases) test(`${name}: initial force and actor obligations`, () => {
  const initial=chain(bases), intents=Force.buildMovementIntents(initial);
  assert.deepEqual(initial.forceTargets,targets);
  assert.equal(intents.length,bases.filter(Boolean).length+1);
  assert.ok(intents.every(a=>a.runnerId && a.originBase && a.targetBase && typeof a.committed === "boolean"));
  assert.ok(!intents.some(a=>"safe" in a || "retired" in a));
});
test("R1 DP empties bases",()=>assert.deepEqual(settle(["R1",null,null]).runnersAfter,[null,null,null]));
test("R1+R2 DP settles surviving R2 at third",()=>assert.deepEqual(settle(["R1","R2",null]).runnersAfter,[null,null,"R2"]));
const loaded=settle(["R1","R2","R3"]);
test("loaded DP scores R3 and keeps R2",()=>{
  assert.deepEqual(loaded.runnersAfter,[null,null,"R2"]);assert.deepEqual(loaded.scoringRunnerIds,["R3"]);
});
test("two outs are backed by ordered actor retirement facts",()=>{
  assert.equal(loaded.outsCreated,2);
  assert.deepEqual(loaded.retirements.map(({runnerId,targetBase,outType,sequence})=>({runnerId,targetBase,outType,sequence})),[
    {runnerId:"R1",targetBase:"second",outType:"force",sequence:1},
    {runnerId:"BR",targetBase:"first",outType:"batterRunnerBeforeFirst",sequence:2}]);
  assert.deepEqual(loaded.retirements[0].forceTargetsAfter,{BR:"first"});
  assert.deepEqual(loaded.retirements[1].forceTargetsAfter,{});
});
test("all actors conserved exactly once including scored survivor",()=>{
  assert.deepEqual(loaded.runnerChanges.map(a=>a.runnerId).sort(),["BR","R1","R2","R3"]);
  assert.deepEqual(loaded.survivors.map(a=>a.runnerId),["R2","R3"]);
  assert.equal(new Set([...loaded.outRunnerIds,...loaded.scoringRunnerIds,...loaded.runnersAfter.filter(Boolean)]).size,4);
});
test("BR-first retirement removes force on R1",()=>{
  const result=settle(["R1",null,null],"secureFirst","oneOut");
  assert.deepEqual(result.forceChainAfterRetirements.forceTargets,{});
  assert.deepEqual(result.runnersAfter,[null,"R1",null]);
});
test("subsequent base touch after BR out creates no force out",()=>{
  const result=settle(["R1",null,null],"", "", {retirements:[
    {runnerId:"BR",targetBase:"first",outType:"batterRunnerBeforeFirst",sequence:1},
    {runnerId:"R1",targetBase:"second",outType:"force",sequence:2}]});
  assert.equal(result.outsCreated,1); assert.deepEqual(result.outRunnerIds,["BR"]);
  assert.equal(result.continuationClassifications[0].tagRequired,true);
  assert.equal(result.continuationClassifications[0].classification,"noForceOut");
});
test("non-contiguous third runner never auto-scores",()=>{
  assert.deepEqual(settle(["R1",null,"R3"]).runnersAfter,[null,null,"R3"]);
  assert.equal(settle([null,null,"R3"],"secureFirst","oneOut").runsAllowed,0);
});
test("explicit committed unforced third runner can reach home",()=>{
  const initial=chain([null,null,"R3"]);
  const movementIntents=Force.buildMovementIntents(initial,[{runnerId:"R3",movementProgress:"committed",targetBase:"home"}]);
  assert.deepEqual(settle([null,null,"R3"],"secureFirst","oneOut",{movementIntents}).scoringRunnerIds,["R3"]);
});
test("failed DP retires nobody and settles forced survivors",()=>{
  const result=settle(["R1","R2","R3"],"doublePlay","zeroOuts");
  assert.equal(result.outsCreated,0);assert.deepEqual(result.runnersAfter,["BR","R1","R2"]);
  assert.deepEqual(result.scoringRunnerIds,["R3"]);
});
test("same immutable inputs replay deterministically without mutation",()=>{
  const initial=chain(["R1","R2","R3"]), before=JSON.stringify(initial);
  assert.deepEqual(Force.settleForceAdvancement({forceChain:initial,route:"doublePlay",resultCode:"twoOuts"}),loaded);
  assert.equal(JSON.stringify(initial),before); assert.ok(Object.isFrozen(loaded.retirements[0]));
});
test("retiring lead forced runner keeps trailing force obligations",()=>{
  const result=settle(["R1","R2","R3"],"forceHome","oneOut");
  assert.deepEqual(result.forceChainAfterRetirements.forceTargets,{BR:"first",R1:"second",R2:"third"});
  assert.deepEqual(result.runnersAfter,["BR","R1","R2"]);assert.equal(result.runsAllowed,0);
});
test("identity and ordering errors reject rather than discard actors",()=>{
  assert.throws(()=>settle(["R1",null,null],"","",{retirements:[{runnerId:"missing",targetBase:"second",outType:"force",sequence:1}]}),/identity/);
  assert.throws(()=>settle(["R1",null,null],"","",{retirements:[{runnerId:"R1",targetBase:"second",outType:"force",sequence:2}]}),/sequence/);
});
console.log(`Force multi-runner integration: ${passed}/${passed} PASS`);
