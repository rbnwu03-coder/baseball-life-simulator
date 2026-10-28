"use strict";
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"../../.."),phase=process.argv[2];if(!/^[a-z0-9-]+$/.test(phase||""))throw Error("Provide new evidence phase");
const directory=path.join(__dirname,phase);fs.mkdirSync(directory,{recursive:true});
const hash=p=>crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"),rows=[];
for(const file of ["high-school-integration-1-1-test.js","high-school-year-two-competition-loop-test.js"]){
 const target=path.join(root,"tests",file),witnessFile=path.join(directory,file+".witness.json"),fd=fs.openSync(witnessFile,"wx"),sourceHash=hash(target);
 const config={nonce:phase+file,entryMode:"standalone",target,gitCompatibility:false,assertionRoots:[path.join(root,"tests")]};
 const coverageDirectory=process.argv.includes("--coverage")&&file==="high-school-integration-1-1-test.js"?path.join(directory,"v8-coverage"):null;
 if(coverageDirectory)fs.mkdirSync(coverageDirectory);
 const args=["--require",path.join(root,"tests/entry-safe-preload.cjs"),target],start=Date.now();
 const r=cp.spawnSync(process.execPath,args,{cwd:root,encoding:"utf8",windowsHide:true,timeout:60000,maxBuffer:16000000,env:{...process.env,ENTRY_SAFE_CONFIG:JSON.stringify(config),...(coverageDirectory?{NODE_V8_COVERAGE:coverageDirectory}:{})},stdio:["ignore","pipe","pipe",fd]});fs.closeSync(fd);
 let witness;try{witness=JSON.parse(fs.readFileSync(witnessFile,"utf8"));}catch{}
 const sourceStable=sourceHash===hash(target),entry=!!(witness?.entryStarted&&witness.standaloneMainMatches),checks=[...(r.stdout||"").matchAll(/✓ (\d+)\. ([^\r\n]+)/g)].map(m=>({number:Number(m[1]),label:m[2]}));
 let status=r.error||!entry||!sourceStable?"UNVERIFIED":r.status!==0?"FAIL":witness.assertions.passed>0?"PASS":"UNVERIFIED",coverage=null;
 if(coverageDirectory){
  const scripts=fs.readdirSync(coverageDirectory).filter(f=>f.endsWith(".json")).flatMap(f=>JSON.parse(fs.readFileSync(path.join(coverageDirectory,f))).result);
  const source=fs.readFileSync(path.join(root,"script.js"),"utf8"),script=scripts.find(s=>s.url==="script.js"||s.url.endsWith("/script.js"));
  const fn=script?.functions.find(f=>f.functionName==="resolveHighSchoolThirdStrikeCatch");
  const rangeFor=marker=>{const offset=source.indexOf(marker);return offset>=0?fn?.ranges.filter(r=>r.startOffset<=offset&&r.endOffset>offset).sort((a,b)=>(a.endOffset-a.startOffset)-(b.endOffset-b.startOffset))[0]||null:null;};
  const foundation=scripts.find(s=>s.url==="defensive-reach-secure-foundation.js"||s.url.endsWith("/defensive-reach-secure-foundation.js"))?.functions.find(f=>f.functionName==="resolveThirdStrikeCatch");
  coverage={sourceUrl:script?.url||null,adapterCalls:fn?.ranges[0]?.count||0,physicalSampleRange:rangeFor('sample: BattedBallPhysical.deterministicUnit("g1-c-third-strike-catch"'),catchExecutionRange:rangeFor("const execution = DefensiveReachSecureFoundation.resolveThirdStrikeCatch(input);"),officialCatchResolverCalls:foundation?.ranges[0]?.count||0};
  if(!coverage.physicalSampleRange?.count||!coverage.catchExecutionRange?.count||!coverage.officialCatchResolverCalls)status="UNVERIFIED";
 }
 const row={file,status,command:[process.execPath,...args],node:process.version,sourceHash,sourceStable,entry,elapsedMs:Date.now()-start,exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,checks,successfulAssertions:witness?.assertions?.passed||0,coverage,stdout:r.stdout,stderr:r.stderr};
 fs.writeFileSync(path.join(directory,file+".json"),JSON.stringify(row,null,2)+"\n",{flag:"wx"});rows.push(row);console.log({file,status,groups:checks.length,assertions:row.successfulAssertions,exitCode:r.status});
}
fs.writeFileSync(path.join(directory,"results.json"),JSON.stringify(rows,null,2)+"\n",{flag:"wx"});if(rows.some(r=>r.status!=="PASS"))process.exitCode=1;
