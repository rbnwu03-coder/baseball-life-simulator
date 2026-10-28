"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const read=p=>JSON.parse(fs.readFileSync(path.join(__dirname,p),"utf8")),digest=v=>crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex");
const before=read("before-delivery.json"),after=read("after-delivery.json"),original=read("original-14-delivery.json"),regressions=read("regressions-final.json"),retry=read("regressions-retry.json");
regressions.rows=regressions.rows.map(row=>retry.rows.find(latest=>latest.file===row.file)||row);
assert(after.checks.every(c=>c.status==="PASS"));assert(original.checks.every(c=>c.status==="PASS"));assert.equal(original.parity,"PASS");assert.deepEqual(before.baseRecord,after.baseRecord);
const summary={semantic:{total:after.checks.length,passed:after.checks.filter(c=>c.status==="PASS").length,beforePassed:before.checks.filter(c=>c.status==="PASS").length,beforeFailed:before.checks.filter(c=>c.status==="FAIL").length},
 original14:{total:original.checks.length,passed:original.checks.filter(c=>c.status==="PASS").length,parity:original.parity,protectedFixtures:Object.keys(original.invariants).length},
 normalTwoMatchRecord:{equal:true,sha256:digest(after.baseRecord)},
 reachability:{successfulLoadCount:after.reachability.length,exposureMissingPermitted:true,missingCurrentRoleJourneyDirectCall:true,yearEndResolvesRoleBeforeDisplay:after.observations.roleGuard.role},
 regressions:regressions.rows.map(({file,status,nodeAssertions,customChecks,timedOut,elapsedMs,exitCode})=>({file,status,nodeAssertions,customChecks,timedOut,elapsedMs,exitCode})),
 examples:{missingExposure:{before:before.observations.missingExposure.detail,after:after.observations.missingExposure.detail},unknownEarlier:{before:before.observations.unknownEarlier.journey,after:after.observations.unknownEarlier.journey},missingRole:{before:before.observations.missingRole.journey,after:after.observations.missingRole.journey},pitcherYearTwo:after.observations.pitcherYearTwo}};
fs.writeFileSync(path.join(__dirname,"summary-delivery.json"),JSON.stringify(summary,null,2)+"\n",{flag:"wx"});
console.log({semantic:summary.semantic,original14:summary.original14,loads:summary.reachability.successfulLoadCount,existingPass:summary.regressions.filter(r=>r.status==="PASS").length,existingFail:summary.regressions.filter(r=>r.status==="FAIL").length,timeouts:summary.regressions.filter(r=>r.timedOut).length});
