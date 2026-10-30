"use strict";
const http = require("node:http"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const {execFileSync} = require("node:child_process");
const [base, commit, output] = process.argv.slice(2);
const root = path.resolve(__dirname,"../../..");
const get = route => new Promise((resolve,reject)=>http.get(new URL(route,base),res=>{
  const chunks=[];res.on("data",chunk=>chunks.push(chunk));res.on("end",()=>resolve({status:res.statusCode,
    commit:res.headers["x-test-commit"],body:Buffer.concat(chunks)}));
}).on("error",reject));
const hash = bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
(async()=>{
  const files=["index.html","script.js","offensive-bunt-defensive-handoff.js"];
  const checks=await Promise.all(files.map(async file=>{
    const response=await get("/"+file);
    const expected=execFileSync("git",["-c",`safe.directory=${root.replaceAll("\\","/")}`,"show",`${commit}:${file}`],{cwd:root,maxBuffer:16000000});
    return {file,status:response.status,commit:response.commit,sha256:hash(response.body),
      matchesCommit:response.status===200 && response.commit===commit && hash(response.body)===hash(expected)};
  }));
  const response=await get("/__version"), version=JSON.parse(response.body);
  const result={url:new URL("/index.html",base).href,version,checks,
    httpVersionVerified:version.commit===commit && checks.every(row=>row.matchesCommit),
    browserAcceptancePerformed:false};
  if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+"\n");
  console.log(JSON.stringify(result));
  if(!result.httpVersionVerified)process.exitCode=1;
})().catch(error=>{console.error(error.message);process.exitCode=1;});
