"use strict";
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),crypto=require("node:crypto");
const retry=process.argv.includes("--retry"),final=process.argv.includes("--final"),acceptance=process.argv.includes("--acceptance"),root=path.resolve(__dirname,"../../.."),output=path.join(__dirname,acceptance?"existing-tests-acceptance":final?"existing-tests-final":retry?"existing-tests-retry":"existing-tests");fs.mkdirSync(output,{recursive:true});
const suites=retry?["high-school-year-one-opportunity-two-integration-test.js","career-save-admission-test.js"]:["high-school-year-one-competition-loop-test.js","high-school-year-one-opportunity-two-integration-test.js","high-school-year-transition-continuity-test.js",
 "high-school-integration-1-1-test.js","high-school-integration-1-2-3-test.js","high-school-year-two-competition-loop-test.js","high-school-three-year-spine-test.js",
 "coach-response-expansion-test.js","match-experience-development-foundation-v1-test.js","playing-time-game-exposure-foundation-v1-test.js",
 "career-save-admission-test.js","g2-b2-playable-match-decision-test.cjs","g2-a-live-public-match-bridge-test.cjs"];
async function run(file){
 const target=path.join(root,"tests",file),witnessPath=path.join(output,file+".witness.json"),fd=fs.openSync(witnessPath,"wx");
 const config={nonce:file,target,entryMode:"standalone",gitCompatibility:false,assertionRoots:[path.join(root,"tests")]};
 if(["high-school-three-year-spine-test.js","career-save-admission-test.js"].includes(file)){
  const source=fs.readFileSync(target,"utf8"),start=source.indexOf("function verify("),end=source.indexOf("\n}",start)+2;
  config.customAssertion={functionName:"verify",functionFragment:source.slice(start,end),expectedCount:file==="career-save-admission-test.js"?45:54,sourceSha256:crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex")};
 }
 const start=Date.now(),r=await new Promise(resolve=>{
  const child=cp.spawn(process.execPath,["--require",path.join(root,"tests/entry-safe-preload.cjs"),target],{cwd:root,windowsHide:true,env:{...process.env,ENTRY_SAFE_CONFIG:JSON.stringify(config)},stdio:["ignore","pipe","pipe",fd]});
  let stdout="",stderr="",error=null,timedOut=false;const timer=setTimeout(()=>{timedOut=true;child.kill();},60000);
  child.stdout.on("data",b=>stdout+=b);child.stderr.on("data",b=>stderr+=b);child.on("error",e=>error=String(e));child.on("close",(exitCode,signal)=>{clearTimeout(timer);resolve({exitCode,signal,stdout,stderr,error,timedOut});});
 });fs.closeSync(fd);
 let witness;try{witness=JSON.parse(fs.readFileSync(witnessPath,"utf8"));}catch{}
 const count=witness?.assertions?.passed||0,custom=witness?.customAssertion,customOK=custom?.reviewedSourceMatches&&!custom.error&&custom.count===config.customAssertion?.expectedCount;
 const entry=!!(witness?.entryStarted&&witness.standaloneMainMatches),environment=/ENOBUFS|MODULE_NOT_FOUND|EACCES|ENOENT/.test(r.stderr);
 const status=r.error||r.timedOut||environment||!entry?"UNVERIFIED":r.exitCode!==0?"FAIL":count>0||customOK?"PASS":"UNVERIFIED";
 const row={file,status,nodeAssertions:count,customChecks:customOK?custom.count:null,entry,elapsedMs:Date.now()-start,command:[process.execPath,"--require","tests/entry-safe-preload.cjs","tests/"+file],...r};
 fs.writeFileSync(path.join(output,file+".json"),JSON.stringify(row,null,2)+"\n",{flag:"wx"});console.log({file,status,count,custom:row.customChecks});return row;
}
(async()=>{const rows=[];for(let i=0;i<suites.length;i+=2)rows.push(...await Promise.all(suites.slice(i,i+2).map(run)));
 fs.writeFileSync(path.join(__dirname,acceptance?"regressions-acceptance.json":final?"regressions-final.json":retry?"regressions-retry.json":"regressions.json"),JSON.stringify({node:process.version,gitCompatibility:false,rows},null,2)+"\n",{flag:"wx"});if(rows.some(r=>r.status!=="PASS"))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
