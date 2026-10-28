"use strict";
// Reuses existing V8 checker observation for three reviewed custom assertion functions.
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"../.."),rows=[];
for(const [file,name,expectedCount] of [["development-training-result-foundation-v1-test.js","verify",46],["high-school-three-year-spine-test.js","verify",54],["event-continuity-pass-test.js","test",10]]){
 const target=path.join(root,"tests",file),source=fs.readFileSync(target,"utf8"),start=source.indexOf("function "+name+"("),end=source.indexOf("\n}",start)+2;
 if(start<0||end<start)throw Error("Reviewed function missing");
 const functionFragment=source.slice(start,end),sourceSha256=crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex");
 const config={nonce:file,entryMode:"standalone",target,gitCompatibility:false,assertionRoots:[path.join(root,"tests")],customAssertion:{sourceSha256,functionName:name,functionFragment,expectedCount}};
 const witnessPath=path.join(__dirname,"existing-tests",file+".custom-witness.json"),fd=fs.openSync(witnessPath,"wx");
 const r=cp.spawnSync(process.execPath,["--require",path.join(root,"tests/entry-safe-preload.cjs"),target],{cwd:root,windowsHide:true,encoding:"utf8",timeout:60000,maxBuffer:16000000,env:{...process.env,ENTRY_SAFE_CONFIG:JSON.stringify(config)},stdio:["ignore","pipe","pipe",fd]});fs.closeSync(fd);
 let witness;try{witness=JSON.parse(fs.readFileSync(witnessPath,"utf8"));}catch{}
 const custom=witness?.customAssertion,status=r.status===0&&witness?.entryStarted&&witness?.standaloneMainMatches&&custom?.reviewedSourceMatches&&!custom.error&&custom.count===expectedCount?"PASS":"UNVERIFIED";
 rows.push({file,status,exitCode:r.status,expectedCount,custom,witnessPath:path.relative(root,witnessPath),stdout:r.stdout,stderr:r.stderr});console.log({file,status,count:custom?.count});
}
fs.writeFileSync(path.join(__dirname,"custom-test-results.json"),JSON.stringify({rows},null,2)+"\n",{flag:"wx"});
