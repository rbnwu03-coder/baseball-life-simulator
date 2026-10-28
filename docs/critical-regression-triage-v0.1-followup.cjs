"use strict";
const C=require('./critical-regression-triage-v0.1-capture.cjs'),{derive}=require('./critical-regression-triage-v0.1-isolation.cjs');
if(process.argv[2]==='build') {
 const rows=[];
 rows.push(derive('opportunity-dependencies','tests/high-school-year-one-opportunity-two-integration-test.js',[
  {before:'"batted-ball-outcome-mapping.js", "offensive-plate-approach.js"',after:'"batted-ball-outcome-mapping.js", "defensive-opportunity-foundation.js", "defensive-reach-secure-foundation.js", "offensive-plate-approach.js"'},
  {before:'"force-advancement.js", "offensive-bunt-defensive-handoff.js"',after:'"force-advancement.js", "defensive-decision-throw-foundation.js", "offensive-bunt-defensive-handoff.js"'},
  {before:'verify("38.',after:'console.log("TRIAGE_OPPORTUNITY="+JSON.stringify(liveEngine));\nverify("38.'}
 ]));
 rows.push(derive('gradient-compact','tests/ability-performance-gradient-test.js',[
  {before:"require('./ability-performance-correlation-audit.cjs')",after:"require('../tests/ability-performance-correlation-audit.cjs')"},
  {before:'assert(audit.summarize(low).multiHitFraction>0',after:'const compact=g=>({seed:g.seed,line:g.line,capabilities:g.capabilities,gameId:g.record.gameId,decisions:g.decisions.map(d=>({id:d.id,domain:d.domain,decision:d.decision,tier:d.tier})),playerEvents:g.log.filter(e=>e.batterId==="player"||e.domain==="offense").map(e=>({type:e.type,inning:e.inning,half:e.half,batterId:e.batterId,result:e.result,momentId:e.momentId,offensivePlateAppearance:e.offensivePlateAppearance,compressedOutcomeTrace:e.compressedOutcomeTrace,pitchTrace:e.pitchTrace})),recordSha256:require("node:crypto").createHash("sha256").update(JSON.stringify(g.record)).digest("hex"),logSha256:require("node:crypto").createHash("sha256").update(JSON.stringify(g.log)).digest("hex")});\nconsole.log("TRIAGE_GRADIENT="+JSON.stringify({base:h.base,tiers:audit.TIERS,field:"baseballSkills.batting",seeds:Array.from({length:20},(_,i)=>i+1),lowSummary:audit.summarize(low),highSummary:audit.summarize(high),low:low.map(compact),high:high.map(compact)}));\nassert(audit.summarize(low).multiHitFraction>0'}
 ]));
 C.capture('followup-isolation-contract',{rows,reasons:{opportunity:'Single-module diagnostic exposed missing Reach/Secure prerequisite; load its real Opportunity prerequisite too, in index dependency order',gradient:'Prior full-record stdout exceeded original 16MB policy; retain truncated capture UNVERIFIED and compact observational payload without changing games or limits'},assertionsSeedsFixturesDecisionsUnchanged:true});
 console.log(JSON.stringify(rows.map(r=>({file:r.file,exactReverse:r.exactReverse}))));
} else if(process.argv[2]==='run') {
 for(const label of ['opportunity-dependencies','gradient-compact'])C.run(label+'-isolated',C.prefix+label+'-isolated.cjs',[C.prefix+'followup.cjs']);
} else throw Error('Explicit build/run required');
