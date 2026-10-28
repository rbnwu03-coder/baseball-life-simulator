"use strict";
// Read-only source/list audit. No fixture or suite execution.
const R = require("./receiver-execution-v2-sprint-10a3b-r4-runner.cjs");
R.reserve("dependency-audit");
const b = R.json(R.prefix + "baseline-evidence.json"), sets = [];
for (const p of Object.keys(b.hashes).filter(p => /^tests\/.+\.(?:js|cjs)$/.test(p))) {
  const text = R.read(p).toString();
  for (const m of text.matchAll(/(?:const|let|var)\s+(runtimeFiles|files)\s*=\s*\[([\s\S]*?)\];/g)) {
    const files = [...m[2].matchAll(/["']([^"']+\.(?:js|cjs))["']/g)].map(x => x[1]);
    if (files.includes("script.js")) sets.push({ test: p, variable: m[1], files, sourcePresent: files.includes("receiver-source-snapshot.js"), rosterPresent: files.includes("team-roster-foundation.js"), opportunityPresent: files.includes("defensive-opportunity-foundation.js"), lifecyclePresent: files.includes("match-situation-lifecycle.js") });
  }
}
const script = R.read("script.js").toString(), block = script.slice(script.indexOf("function getHighSchoolReceiverSourceAdapter("), script.indexOf("function getHighSchoolGroundBallDefensiveSituationOverrides("));
const refs = [...block.matchAll(/\b(ReceiverSourceSnapshot|TeamRosterFoundation|MatchSituationLifecycle|BattedBallGroundDefense)\b/g)].map(m => ({ module: m[1], line: script.slice(0, script.indexOf(block) + m.index).split(/\r?\n/).length }));
R.capture("dependency-audit", { literalRuntimeSets: sets, literalRuntimeSetCount: sets.length, compactSetsWithoutRoster: sets.filter(x => !x.rosterPresent).map(x => x.test), reviewedSourceGlobals: refs,
  boundaryReview: [
    { site: "source admission", before: "TeamRoster global reads precede optional source eligibility", after: "validated source/roster availability gates roster reads; absent opportunity is checked with optional access" },
    { site: "shared source validation", before: "falsy format check only; roster global assumed", after: "own-field presence across match/handoff/lifecycle/archive requires adapter+roster, then original validation" },
    { site: "execution binding", before: "direct source/lifecycle/ground global calls", after: "adapter boundary plus required ground/lifecycle owner checks before binding writes" },
    { site: "pre-existing physical defense", contract: "DefensiveOpportunity/Reach and canonical actor/participant paths still require their original real roster owner. R4 does not make normal detailed SS runtime runnable by removing mandatory core modules." }
  ],
  sourceFactOwners: { physical: "original Match/PA/handoff", actors: "real TeamRosterFoundation.getCurrentDefender", throwerCapability: "original defensiveAccess.secureCapabilities", receiverCapability: "original roster defense/speed/arm/contact", sample: "existing Legacy execution only; never read for admission" },
  scopeLimit: "Complete scan of pre-R4 readable test bytes for literal runtimeFiles/files arrays containing script.js; computed/dynamic load sets are not exhaustively resolved. Normal index-derived browser collection reviewed separately.",
  scriptHash: R.hash(R.read("script.js")), receiverSourceHash: R.hash(R.read("receiver-source-snapshot.js")), protectedContentReadOrHashed: false });
console.log(JSON.stringify({ literalSets: sets.length, withoutRoster: sets.filter(x => !x.rosterPresent).length, sourceGlobals: refs.length }));
