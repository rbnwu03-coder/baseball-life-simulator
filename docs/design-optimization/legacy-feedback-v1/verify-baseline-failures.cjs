"use strict";
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../../.."),rows=[];
for(const file of ["high-school-integration-1-1-test.js","high-school-year-two-competition-loop-test.js"]){
 const args=["--require",path.join(__dirname,"baseline-preload.cjs"),path.join(root,"tests",file)];
 const r=cp.spawnSync(process.execPath,args,{cwd:root,encoding:"utf8",windowsHide:true,timeout:60000,maxBuffer:16000000});
 rows.push({file,kind:"isolated-captured-source-replay",command:[process.execPath,...args],exitCode:r.status,stdout:r.stdout,stderr:r.stderr});
}
assert.equal(rows[0].exitCode,1);assert.match(rows[0].stderr,/BattedBallPhysical is not defined/);assert.equal(rows[1].exitCode,0);
fs.writeFileSync(path.join(__dirname,"baseline-failure-classification.json"),JSON.stringify(rows,null,2)+"\n",{flag:"wx"});console.log(rows.map(({file,exitCode})=>({file,exitCode})));
