"use strict";
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../../.."),test="tests/high-school-integration-1-1-test.js";
const args=["--require",path.join(__dirname,"baseline-preload.cjs"),path.join(root,test)];
const r=cp.spawnSync(process.execPath,args,{cwd:root,windowsHide:true,encoding:"utf8",timeout:60000,maxBuffer:16000000});
assert.equal(r.status,1);assert.match(r.stderr,/ReferenceError: BattedBallPhysical is not defined/);
const result={kind:"isolated-exact-pre-change-source-replay",test,sourceFiles:["script-before.js.txt","story-before.js.txt"],command:[process.execPath,...args],exitCode:r.status,stdout:r.stdout,stderr:r.stderr,conclusion:"Same missing dependency failure occurs using captured pre-change sources; no expectations or resolver changed."};
fs.writeFileSync(path.join(__dirname,"existing-baseline-failure.json"),JSON.stringify(result,null,2)+"\n",{flag:"wx"});console.log(result.conclusion);
