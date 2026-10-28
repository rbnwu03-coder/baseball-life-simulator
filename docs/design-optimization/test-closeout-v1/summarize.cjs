"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"../../.."),read=p=>fs.readFileSync(p,"utf8").replace(/\r\n?/g,"\n"),json=p=>JSON.parse(read(path.join(__dirname,p))),hash=p=>crypto.createHash("sha256").update(fs.readFileSync(path.join(root,p))).digest("hex");
const before=json("before/results.json"),after=json("final/results.json"),baseline=json("baseline.json"),preservation=json("preservation.json");
const index=[...read(path.join(root,"index.html")).matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
const stripManifest=s=>s.replace(/const (?:files|runtimeFiles) = \[[\s\S]*?\];/,"MANIFEST");
const manifests=[],protectedFiles=["script.js","story.js","index.html","tests/high-school-match-feedback-factuality-test.cjs","tests/high-school-legacy-feedback-boundary-test.cjs","tests/high-school-career-test-context.js","tests/entry-safe-preload.cjs"];
for(const [file,groups] of [["high-school-integration-1-1-test.js",16],["high-school-year-two-competition-loop-test.js",37]]){
 const old=read(path.join(__dirname,file+".before.txt")),current=read(path.join(root,"tests",file)),a=after.find(r=>r.file===file);
 assert.equal(a.status,"PASS");assert.deepEqual(a.checks.map(c=>c.number),Array.from({length:groups},(_,i)=>i+1));
 const names=s=>[...s.match(/const (?:files|runtimeFiles) = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);
 const oldNames=names(old),newNames=names(current),added=newNames.filter(p=>!oldNames.includes(p));assert.deepEqual(newNames.filter(p=>!added.includes(p)),oldNames);
 const stripPitcher=s=>s.replace(/evaluate\((?:"|`)\s*__y2LoopFixture\(130008[\s\S]*?(?=evaluate\("__y2LoopFixture\(130009)/,"PITCHER_CASE\n");
 if(groups===16){assert.equal(stripManifest(old),stripManifest(current));assert(a.coverage.physicalSampleRange.count>0&&a.coverage.catchExecutionRange.count>0&&a.coverage.officialCatchResolverCalls>0);}
 else{assert.equal(stripPitcher(stripManifest(old)),stripPitcher(stripManifest(current)));assert.equal(old.split("\n").find(s=>s.startsWith('verify("35.')),current.split("\n").find(s=>s.startsWith('verify("35.')));}
 manifests.push({file,added:added.map(module=>({module,formalIndexOrder:index.indexOf(module)+1,testOrder:newNames.indexOf(module)+1})),allOtherChecksPreserved:true});
}
for(const p of protectedFiles)assert.equal(hash(p),baseline.files[p],p+" changed");
assert.deepEqual(preservation.changed,["tests/high-school-integration-1-1-test.js","tests/high-school-year-two-competition-loop-test.js"]);assert(preservation.headSame);
const summary={branch:baseline.branch,head:baseline.head,before:before.map(({file,status,checks,successfulAssertions})=>({file,status,groups:checks.length,successfulAssertions})),after:after.map(({file,status,checks,successfulAssertions,coverage})=>({file,status,groups:checks.length,successfulAssertions,coverage})),manifests,preserved:protectedFiles.map(file=>({file,sha256:hash(file),unchanged:true})),preservation:{checked:preservation.checked,changed:preservation.changed,headSame:preservation.headSame},limits:"Only two full suites ran. No shared loader changed; original 14 and legacy 15 are preserved, not rerun this round."};
fs.writeFileSync(path.join(__dirname,"summary.json"),JSON.stringify(summary,null,2)+"\n",{flag:"wx"});console.log(summary.after.map(({file,status,groups,successfulAssertions})=>({file,status,groups,successfulAssertions})));
