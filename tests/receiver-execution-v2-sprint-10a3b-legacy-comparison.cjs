"use strict";
const assert = require("node:assert/strict"), crypto = require("node:crypto");
const { makeHarness, officialProjection, baseline } = require("./receiver-execution-v2-sprint-10a3b-harness.cjs");
const sha = o => crypto.createHash("sha256").update(JSON.stringify(o)).digest("hex");
function run() {
  const before = makeHarness("baseline"), after = makeHarness(), rows = [], phases = [];
  function pair(name, fn) {
    const a = fn(before), b = fn(after), aa = officialProjection(a), bb = officialProjection(b);
    assert.deepEqual(bb, aa, "Official projection changed: " + name);
    rows.push({ name, pass: true, baselineOfficialSha256: sha(aa), currentOfficialSha256: sha(bb), metadataExpectedDifferent: sha(a) !== sha(b),
      physicalIdentity: b.settled?.match.groundBallInPlayState?.physicalTruth?.identity || b.match?.groundBallInPlayState?.physicalTruth?.identity,
      callbacks: b.rng?.callbacks || b.settled?.rng.callbacks, matchRng: b.rng?.matchRng || b.settled?.rng.matchRng });
    return b;
  }
  for (const outs of [0, 1, 2]) {
    for (const [variant, options] of [["clean", {}], ["offline", { capabilities: { arm: 1, throwing: 1 } }], ["acquisition failed", { capabilities: { fielding: 1, catching: 1 } }], ["failed receiver", { weakReceiver: "1B" }], ["fast runner", { batterSpeed: 18 }]]) {
      pair("SS empty automatic " + variant + " outs" + outs, h => { h.fresh({ ...options, outs }, "automatic"); h.run("var s3bOnce=firstBaseFacts(m);var s3bNoRandom=Math.random;Math.random=()=>{throw Error('DUPLICATE_REROLL')};"); try { for (let i = 0; i < 3; i++) h.run("resumeResolvedHighSchoolGroundBallSettlement(m)"); assert.equal(h.run("firstBaseFacts(m)"), h.run("s3bOnce")); } finally { h.run("Math.random=s3bNoRandom"); } return h.snapshot(); });
    }
    pair("SS direct three-phase recovery outs" + outs, h => { h.fresh({ outs }, "beforeExecution"); const pending = h.snapshot(), pendingCold = h.cold("source pending"); h.run("beginAutomaticGroundBallSituationExecution(m);var s3bDirect=firstBaseExecute(m,'secure',.8);"); assert.equal(h.run("s3bDirect.rolls"), 1); const executed = h.snapshot(); h.run("var s3bNoRandom=Math.random;Math.random=()=>{throw Error('RECOVERY_REROLL')};"); try { const executedCold = h.cold("source executed"); h.run("resumeResolvedHighSchoolGroundBallSettlement(m)"); const settled = h.snapshot(), settledCold = h.cold("source settled"); for (let i = 0; i < 3; i++) h.run("resumeResolvedHighSchoolGroundBallSettlement(m)"); assert.deepEqual(h.snapshot(), settledCold); return { pending, pendingCold, executed, executedCold, settled, settledCold, duplicate: h.snapshot() }; } finally { h.run("Math.random=s3bNoRandom"); } });
    pair("SS hold original nullable delivery outs" + outs, h => { h.fresh({ outs }, "beforeExecution"); h.run("var s3bHeld=firstBaseExecute(m,'contain',.8);resumeResolvedHighSchoolGroundBallSettlement(m);"); assert.equal(h.run("s3bHeld.rolls"), 1); const settled = h.snapshot(); h.cold("held original"); return { settled, cold: h.snapshot() }; });
  }
  for (const [position, direction] of [["\u6e38\u64ca\u624b", .1], ["\u4e8c\u58d8\u624b", .9], ["\u4e09\u58d8\u624b", .005], ["\u4e00\u58d8\u624b", .995]]) {
    pair("meaningful public " + position, h => { h.fresh({ position, direction, occupied: 1 }, "automatic"); const pending = h.snapshot(); h.run("var s3bPublic=firstBasePublic(m,'secure',.8);var s3bNoRandom=Math.random;Math.random=()=>{throw Error('PUBLIC_DUPLICATE_REROLL')};"); try { for (let n = 0; n < 3; n++) assert.equal(h.run("chooseHighSchoolYearOneMatchMoment(s3bPublic.choice.matchDecision,s3bPublic.choice.matchMomentId,()=>{throw Error('DUPLICATE_SAMPLE')})"), false); h.cold("legacy meaningful"); return { pending, settled: h.snapshot() }; } finally { h.run("Math.random=s3bNoRandom"); } });
  }
  // Genuine pre-integration saved data is produced by baseline owners, not by deleting new tags.
  for (const phase of ["pending", "executed", "settled"]) {
    before.fresh({}, "beforeExecution"); if (phase !== "pending") before.run("beginAutomaticGroundBallSituationExecution(m);firstBaseExecute(m,'secure',.8)"); if (phase === "settled") before.run("resumeResolvedHighSchoolGroundBallSettlement(m)");
    const historical = before.json("player");
    for (const h of [before, after]) { h.context.s3bHistorical = JSON.parse(JSON.stringify(historical)); h.run("player=normalizeSave(s3bHistorical);m=player.highSchoolMatch;"); }
    assert.deepEqual(officialProjection(after.snapshot()), officialProjection(before.snapshot()), "Historical " + phase);
    assert.equal(after.run("m.groundBallInPlayState.receiverSourceSnapshot"), undefined);
    phases.push({ phase, rawGeneratedByBaselineOwner: true, currentNoSourceBackfill: true, officialProjectionEqual: true });
  }
  return { suite: "sprint10a3b-legacy-non-interference", baseline, summary: { total: rows.length, passed: rows.length, failed: 0 }, rows,
    historicalCompatibility: { total: phases.length, passed: phases.length, failed: 0, phases },
    projection: { removedOnly: ["receiverSourceFormatVersion", "receiverSourceAdmission", "receiverSourceSnapshot", "receiverSourcePin", "receiverSourceExecutionBinding", "receiverSourceSaveFormatVersion"],
      sourceEnvelopeVersion: "root player saveVersion16 projects to legacy15; physical/cache/statistical fields retained", wholePlayerAndMatchCompared: true },
    covered: ["original physical", "active rosters", "original sample/cache/action/route", "callback count/order/value", "Match RNG values", "outs/bases/runs", "simulationCursor", "GameRecord/E/A/H/FC", "player Evaluation/experience", "cold pending/executed/settled", "three duplicates", "genuine historical omission"],
    scope: "fixed legal original fixtures; metadata additions are explicit expected differences; no natural cohort or candidate comparison", readPaths: [...new Set([...before.readPaths, ...after.readPaths])], candidateExecutionCalls: 0, runtimeEnabled: false };
}
module.exports = { run };
if (require.main === module) { const r = run(); console.log(JSON.stringify({ ...r.summary, historical: r.historicalCompatibility.total, baseline, candidateExecutionCalls: 0 })); }
