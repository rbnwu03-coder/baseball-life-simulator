"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const read=p=>JSON.parse(fs.readFileSync(path.join(__dirname,p),"utf8"));
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const digest=v=>crypto.createHash("sha256").update(JSON.stringify(canonical(v))).digest("hex");
const before=read("before-verified.json"),after=read("after-verified.json"),regressions=read("regressions-acceptance.json");
assert.deepEqual(after.invariants,before.invariants);assert(after.checks.every(x=>x.status==="PASS"));
const proof=Object.keys(after.invariants).map(k=>({fixture:k,gameId:after.invariants[k].record.gameId,recordSha256:digest(after.invariants[k].record),beforeSha256:digest(before.invariants[k]),afterSha256:digest(after.invariants[k]),equal:true}));
const summary={baseline:"accepted-gameplay-g2-b2-v0.1 @ 0d3ed173952b9b8e5d5842a73761f649b50be594",node:process.version,
 red:{total:before.checks.length,failed:before.checks.filter(x=>x.status==="FAIL").length},green:{total:after.checks.length,passed:after.checks.filter(x=>x.status==="PASS").length,parity:after.parity},
 invarianceProof:proof,regressions:regressions.rows.map(({file,status,nodeAssertions,customChecks,elapsedMs,timedOut,exitCode})=>({file,status,nodeAssertions,customChecks,elapsedMs,timedOut,exitCode})),
 knownFailure:{file:"high-school-integration-1-1-test.js",reason:"ReferenceError: BattedBallPhysical is not defined",preChangeReplay:"existing-baseline-failure.json"},
 examples:{noAppearance:{before:before.observations.noAppearance,after:after.observations.noAppearance},actualDecisions:{before:before.observations.played.texts.rival.encounter,after:after.observations.played.texts.rival.encounter},mixedJudgement:{before:before.observations.soundDecisions.texts.coach,after:after.observations.soundDecisions.texts.coach}}};
fs.writeFileSync(path.join(__dirname,"acceptance-summary.json"),JSON.stringify(summary,null,2)+"\n",{flag:"wx"});
console.log({red:summary.red,green:summary.green,protectedFixtures:proof.length,existingPass:summary.regressions.filter(x=>x.status==="PASS").length,existingFail:summary.regressions.filter(x=>x.status==="FAIL").length,timeouts:summary.regressions.filter(x=>x.timedOut).length});
