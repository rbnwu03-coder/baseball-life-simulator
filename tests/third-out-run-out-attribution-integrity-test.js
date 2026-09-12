const assert=require("assert");
const Game=require("../match-game-record.js");
const Force=require("../force-advancement.js");
const {run,json}=require("./high-school-career-test-context.js").makeContext();
let passed=0;function test(name,fn){fn();passed++;console.log(`PASS ${name}`);}
const resolve=args=>json(`resolveHighSchoolThirdOutIntegrity(${JSON.stringify(args)})`);
const tag={runnerId:"R2",targetBase:"third",outType:"nonForceTag",sequence:1,forceStateAtRetirement:{forceTargets:{}},isBatterRunner:false,beforeFirst:false,order:20};
const timed=order=>resolve({outsBefore:2,orderedRetirements:[tag],scoringAttempts:[{runnerId:"R3",...(order===undefined?{}:{order})}]});
const chain=Force.buildInitialLiveBallForceChain({runners:["R1","R2","R3"],batterRunnerId:"BR"});
const dp=Force.settleForceAdvancement({forceChain:chain,route:"doublePlay",resultCode:"twoOuts"});
const dpTruth=outsBefore=>resolve({outsBefore,orderedRetirements:dp.retirements,runnersBefore:chain.sourceBaseState,proposedRunnersAfter:dp.runnersAfter,scoringAttempts:[{runnerId:"R3"}]});
test("force third out rejects even earlier home touch",()=>{
  const r=resolve({outsBefore:2,orderedRetirements:[dp.retirements[0]],scoringAttempts:[{runnerId:"R3",timing:"beforeThirdOut"}]});
  assert.equal(r.thirdOutType,"force");assert.deepEqual(r.legalScoringRunnerIds,[]);
});
test("BR before first independently bars earlier run",()=>{
  const r=resolve({outsBefore:2,orderedRetirements:[{...dp.retirements[1],sequence:1}],scoringAttempts:[{runnerId:"R3",timing:"beforeThirdOut"}]});
  assert.equal(r.thirdOutType,"batterRunnerBeforeFirst");assert.deepEqual(r.invalidatedScoringRunnerIds,["R3"]);
});
test("non-force tag stays non-force",()=>assert.equal(timed(10).thirdOutType,"nonForceTag"));
test("known home-before-tag order counts",()=>assert.deepEqual(timed(10).legalScoringRunnerIds,["R3"]));
test("known tag-before-home order rejects",()=>assert.deepEqual(timed(30).invalidatedScoringRunnerIds,["R3"]));
test("unknown timing remains unresolved, not invalid or legal",()=>{
  const r=timed();assert.equal(r.timingStatus,"TIMING_PLAY_UNRESOLVED");assert.equal(r.settlementReady,false);
  assert.deepEqual(r.legalScoringRunnerIds,[]);assert.deepEqual(r.invalidatedScoringRunnerIds,[]);assert.deepEqual(r.unresolvedScoringRunnerIds,["R3"]);
});
test("0-out loaded DP still scores",()=>{assert.equal(dpTruth(0).outsAfter,2);assert.deepEqual(dpTruth(0).legalScoringRunnerIds,["R3"]);});
test("1-out loaded DP third out is BR before first",()=>{assert.equal(dpTruth(1).thirdOutType,"batterRunnerBeforeFirst");assert.deepEqual(dpTruth(1).legalScoringRunnerIds,[]);});
test("2-out planned DP records only first actual retirement",()=>{const r=dpTruth(2);assert.equal(r.thirdOutType,"force");assert.equal(r.orderedRetirements.length,1);assert.equal(r.outsAfter,3);});
test("removed force cannot be classified by base alone",()=>assert.throws(()=>resolve({outsBefore:2,orderedRetirements:[{...dp.retirements[0],forceStateAtRetirement:{forceTargets:{}}}]}),/Force absent/));
test("caught ball third out rejects home-before-catch",()=>assert.deepEqual(resolve({outsBefore:2,orderedRetirements:[{...tag,runnerId:"BR",targetBase:"caught",outType:"caughtBallOut",isBatterRunner:true}],scoringAttempts:[{runnerId:"R3",order:10}]}).legalScoringRunnerIds,[]));
const ctx={rosters:{home:{lineup:[{id:"P1",defensivePosition:"P"}],pitchingStaff:{starter:"OLD"}},away:{lineup:[{id:"B",defensivePosition:"SS"}]}}};
const fresh=()=>Game.createGameRecord({gameId:"outs",homeTeamId:"home",awayTeamId:"away",rosters:ctx.rosters});
const event=(type,before,after,extra={})=>({eventId:"event-1",type,inning:1,half:"上",offenseTeam:"away",before:{outs:before},after:{outs:after},runnerId:"R",batterId:"B",...extra});
const record=(e)=>{const g=fresh();Game.recordEvent(g,e,ctx);return g;};
test("runner-only out adds pitcher out",()=>assert.equal(record(event("runnerOut",1,2)).playerLines.P1.pitching.outsRecorded,1));
test("runner-only out adds no BF",()=>assert.equal(record(event("runnerOut",1,2)).playerLines.P1.pitching.BF,0));
test("independent out does not alter batter stats",()=>assert.deepEqual(record(event("runnerOut",1,2)).playerLines.B.batting,fresh().playerLines.B.batting));
test("DP PA owns two outs and one BF",()=>{const s=record(event("plateAppearance",0,2,{result:"out"})).playerLines.P1.pitching;assert.equal(s.outsRecorded,2);assert.equal(s.BF,1);});
test("decorative DP aggregate cannot double-count PA",()=>{const g=record(event("plateAppearance",0,2,{result:"out"}));Game.recordEvent(g,event("defensiveResolution",0,2,{eventId:"display",familyId:"infield",outsCreated:2}),ctx);assert.equal(g.playerLines.P1.pitching.outsRecorded,2);});
test("strikeout retains one out and SO",()=>{const s=record(event("plateAppearance",0,1,{result:"strikeout"})).playerLines.P1.pitching;assert.equal(s.outsRecorded,1);assert.equal(s.SO,1);});
test("caught fly PA retains one out",()=>assert.equal(record(event("plateAppearance",0,1,{result:"out",familyId:"flyBall"})).playerLines.P1.pitching.outsRecorded,1));
test("same event identity is idempotent after normalization",()=>{let g=record(event("runnerTagUpResolution",1,2));g=Game.normalizeGameRecord(g);const before=JSON.stringify(g);Game.recordEvent(g,event("runnerTagUpResolution",1,2),ctx);assert.equal(JSON.stringify(g),before);});
test("active pitcher comes from current lineup, never pitchingStaff starter",()=>{const g=record(event("runnerOut",1,2));assert.ok(!g.playerLines.OLD);assert.equal(g.eventRefs.at(-1).pitcherOuts.pitcherId,"P1");});
test("new active pitcher inherits runner out without BF",()=>{const g=fresh();const next={rosters:{...ctx.rosters,home:{lineup:[{id:"P2",defensivePosition:"P"}],pitchingStaff:{starter:"P1"}}}};Game.recordEvent(g,event("runnerOut",1,2),next);assert.equal(g.playerLines.P1.pitching.outsRecorded,0);assert.equal(g.playerLines.P2.pitching.outsRecorded,1);assert.equal(g.playerLines.P2.pitching.BF,0);assert.deepEqual(Game.getIntegrityIssues(g),[]);});
test("out delta stops at inning limit",()=>assert.equal(record(event("plateAppearance",2,4,{result:"out"})).playerLines.P1.pitching.outsRecorded,1));
test("FC runner retirement is attributed independently of hit token",()=>assert.equal(record(event("plateAppearance",0,1,{result:"single"})).playerLines.P1.pitching.outsRecorded,1));
test("unresolved adapter candidates are not stamped beforeThirdOut",()=>{
  const r=json(`finalizeHighSchoolDefensiveThirdOut({runners:[]},{outs:2,runners:[null,"R2","R3"]},{outsCreated:1,orderedRetirements:[${JSON.stringify(tag)}],scoringRunnerIds:["R3"],runnersAfter:[]})`);
  assert.equal(r.timingStatus,"TIMING_PLAY_UNRESOLVED");
});
test("unresolved timing cannot commit match mutation",()=>assert.throws(()=>run('applyHighSchoolDefensiveSettlementFacts({},{thirdOut:{settlementReady:false}})'),/TIMING_PLAY_UNRESOLVED/));
console.log(`Third-out run/out integrity: ${passed}/${passed} PASS`);
