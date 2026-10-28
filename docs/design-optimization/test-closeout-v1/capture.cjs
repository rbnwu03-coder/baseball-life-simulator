"use strict";
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"../../.."),git=(...a)=>cp.execFileSync("git",a,{cwd:root,encoding:"utf8",windowsHide:true,maxBuffer:30000000}),hash=p=>crypto.createHash("sha256").update(fs.readFileSync(path.join(root,p))).digest("hex");
if(process.argv[2]==="before"){
 const paths=git("ls-files","-z","--cached","--others","--exclude-standard").split("\0").filter(p=>p&&!p.startsWith("docs/design-optimization/test-closeout-v1/"));
 const files=Object.fromEntries(paths.filter(p=>fs.existsSync(path.join(root,p))&&fs.statSync(path.join(root,p)).isFile()).map(p=>[p,hash(p)]));
 fs.writeFileSync(path.join(__dirname,"baseline.json"),JSON.stringify({time:new Date().toISOString(),branch:git("branch","--show-current").trim(),head:git("rev-parse","HEAD").trim(),status:git("status","--porcelain=v1","-uall"),files},null,2)+"\n",{flag:"wx"});
 for(const p of ["high-school-integration-1-1-test.js","high-school-year-two-competition-loop-test.js"])fs.writeFileSync(path.join(__dirname,p+".before.txt"),fs.readFileSync(path.join(root,"tests",p)),{flag:"wx"});console.log({captured:paths.length});
}else if(process.argv[2]==="after"){
 const b=JSON.parse(fs.readFileSync(path.join(__dirname,"baseline.json"))),changed=Object.entries(b.files).filter(([p,h])=>!fs.existsSync(path.join(root,p))||hash(p)!==h).map(([p])=>p);
 const result={headSame:b.head===git("rev-parse","HEAD").trim(),checked:Object.keys(b.files).length,changed,status:git("status","--porcelain=v1","-uall")};fs.writeFileSync(path.join(__dirname,"preservation.json"),JSON.stringify(result,null,2)+"\n");console.log({headSame:result.headSame,checked:result.checked,changed});
}else throw Error("Use before/after");
