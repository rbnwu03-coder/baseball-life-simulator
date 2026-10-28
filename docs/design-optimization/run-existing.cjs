"use strict";
// Existing suites are main modules; the existing preload observes assertions without changing expectations.
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process");
const root=path.resolve(__dirname,"../.."),out=path.join(__dirname,"existing-tests");
const suites=[
 "development-training-result-foundation-v1-test.js","playing-time-game-exposure-foundation-v1-test.js",
 "match-experience-development-foundation-v1-test.js","high-school-year-one-competition-loop-test.js",
 "high-school-year-one-opportunity-two-integration-test.js","high-school-year-transition-continuity-test.js",
 "high-school-opportunity-exposure-bias-repair-production-integration-test.js",
 "high-school-relationship-recency-production-integration-test.js","high-school-relationship-temporal-authority-production-integration-test.js",
 "plate-decision-production-integration-test.js","pitcher-catcher-tactical-integration-test.js",
 "catcher-choice-outcome-integrity-v1-test.js","g2-b2-playable-match-decision-test.cjs",
 "g2-a-live-public-match-bridge-test.cjs","g2-b1-natural-mixed-match-continuity-test.cjs",
 "azhe-storyboard-test.js","takahashi-storyboard-test.js","coach-response-expansion-test.js",
 "event-continuity-pass-test.js","relationship-payoff-test.js","high-school-three-year-spine-test.js",
 "high-school-entry-roster-integration-test.js","high-school-position-code-normalization-test.js"
];
fs.mkdirSync(out,{recursive:true});
async function run(file){
 const target=path.join(root,"tests",file),witnessFile=path.join(out,file+".witness.json");
 const fd=fs.openSync(witnessFile,"wx"),config={nonce:file,entryMode:"standalone",target,gitCompatibility:false,assertionRoots:[path.join(root,"tests")]};
 const start=Date.now();
 const r=await new Promise(resolve=>{
  const child=cp.spawn(process.execPath,["--require",path.join(root,"tests/entry-safe-preload.cjs"),target],{cwd:root,windowsHide:true,env:{...process.env,ENTRY_SAFE_CONFIG:JSON.stringify(config)},stdio:["ignore","pipe","pipe",fd]});
  let stdout="",stderr="",error=null,timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;child.kill();},60000);
  child.stdout.on("data",b=>stdout+=b);child.stderr.on("data",b=>stderr+=b);child.on("error",e=>error=String(e));
  child.on("close",(exitCode,signal)=>{clearTimeout(timer);resolve({exitCode,signal,error,timedOut,stdout,stderr});});
 });
 fs.closeSync(fd);let witness=null;try{witness=JSON.parse(fs.readFileSync(witnessFile,"utf8"));}catch{}
 const entry=!!(witness?.entryStarted&&witness.standaloneMainMatches);
 const observed=witness?.assertions?.passed||0;
 const environmentFailure=/ENOBUFS|MODULE_NOT_FOUND|EACCES|ENOENT/.test(r.stderr);
 const status=r.timedOut||r.error||environmentFailure||!entry?"UNVERIFIED":r.exitCode!==0?"FAIL":observed>0?"PASS":"UNVERIFIED";
 const row={file,status,entryVerified:entry,observedAssertions:observed,elapsedMs:Date.now()-start,command:[process.execPath,"--require","tests/entry-safe-preload.cjs","tests/"+file],...r};
 fs.writeFileSync(path.join(out,file+".json"),JSON.stringify(row,null,2)+"\n",{flag:"wx"});
 console.log(`${status} ${file} assertions=${observed} ${row.elapsedMs}ms`);return row;
}
(async()=>{
 const rows=[];
 for(let i=0;i<suites.length;i+=2) rows.push(...await Promise.all(suites.slice(i,i+2).map(run)));
 const summary=rows.map(({file,status,entryVerified,observedAssertions,elapsedMs,exitCode,stderr})=>({file,status,entryVerified,observedAssertions,elapsedMs,exitCode,failure:stderr?stderr.slice(-2500):null}));
 fs.writeFileSync(path.join(__dirname,"existing-test-results.json"),JSON.stringify({node:process.version,gitCompatibility:false,rows:summary},null,2)+"\n",{flag:"wx"});
})().catch(e=>{console.error(e);process.exitCode=1;});
