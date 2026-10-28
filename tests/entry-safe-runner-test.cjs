"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),R=require("./entry-safe-runner.cjs"),A=require("../docs/test-infrastructure-sprint-0.1-capture.cjs");
function run(label){A.reserve(label+"-focused");const dir=fs.mkdtempSync(path.join(R.root,"docs/test-infrastructure-sprint-0.1-fixtures-")),relative=p=>path.relative(R.root,p).replace(/\\/g,"/");
 const sources={
  "main.cjs":"const a=require('node:assert/strict');if(require.main===module){a.equal(require.main,module);a.deepEqual({a:1},{a:1});}\n",
  "export.cjs":"const a=require('assert');module.exports={run(){a(true);a.strict.equal(2,2);return{summary:{total:2,passed:2,failed:0}};}};\n",
  "legacy.cjs":"require('./main.cjs');console.log('PASS-looking output; main skipped');\n",
  "failure.cjs":"require('assert/strict').equal(1,2,'Intentional ENOBUFS-labelled AssertionError');\n",
  "empty.cjs":"console.log('PASS 999 / 999');\n",
  "runtime.cjs":"throw Error('Intentional runtime failure');\n",
  "timeout.cjs":"require('assert').ok(true);setInterval(()=>{},50);\n",
  "git.cjs":"const cp=require('child_process'),a=require('assert/strict'),c=require('crypto');const b=cp.execFileSync('git',['show','"+R.formalBaseline+":script.js']);a.equal(b.length,1070296);a.equal(c.createHash('sha256').update(b).digest('hex'),'64ab3a2e05180e13ef42bc9f6a342ba28f0cc9a5c58217dc21cd3c640894db1b');\n",
  "explicit.cjs":"const cp=require('child_process'),a=require('assert/strict');a.throws(()=>cp.execFileSync('git',['show','"+R.formalBaseline+":script.js'],{maxBuffer:1024}),e=>e.code==='ENOBUFS');a.throws(()=>cp.execFileSync(process.execPath,['-e','process.stdout.write(\"x\".repeat(4096))'],{maxBuffer:1024}),e=>e.code==='ENOBUFS');\n",
  "zero.cjs":"module.exports={run(){require('assert').ok(true);return{summary:{total:0,passed:0,failed:0}};}};\n",
  "caught.cjs":"module.exports={run(){try{require('assert').equal(1,2);}catch{}return{summary:{total:1,passed:0,failed:1}};}};\n",
  "async.cjs":"const a=require('assert/strict');a.doesNotReject(async()=>{});\n",
  "mixed.cjs":"const a=require('assert/strict');a.ok(true);a.doesNotReject(async()=>{});\n",
  "custom.cjs":"function verify(condition){if(!condition)throw Error('Custom assertion');}\nverify(true);verify(2===2);\n",
  "custom-empty.cjs":"function verify(condition){if(!condition)throw Error('Custom assertion');}\nconsole.log('PASS 2/2');\n"
 };for(const[name,text]of Object.entries(sources))fs.writeFileSync(path.join(dir,name),text,{flag:"wx"});
 const cases=[],checks=[];
 function test(name,fn){try{fn();checks.push({name,status:"PASS"});}catch(e){checks.push({name,status:"FAIL",error:e.stack});}}
 function child(name,file,entryMode,expected,extra={}){const evidencePath=A.prefix+label+"-"+name+"-evidence.json",row=R.runSuite({suiteName:name,file:relative(path.join(dir,file)),entryMode,evidencePath,...extra});cases.push({name,expected,row,evidencePath});assert.equal(row.status,expected,name);return row;}
 test("Standalone enters main and observes synchronous assertions",()=>{const r=child("standalone","main.cjs","standalone","PASS");assert.equal(r.assertionEvidence.standaloneMainMatches,true);assert.equal(r.successfulAssertions,2);});
 test("Explicit exported run invokes callable/strict aliases",()=>{const r=child("exported","export.cjs","exported-run","PASS");assert.equal(r.assertionEvidence.exportCompleted,true);assert.equal(r.successfulAssertions,2);});
 test("Export-only loaded as standalone cannot pass",()=>child("export-not-called","export.cjs","standalone","UNVERIFIED"));
 test("Legacy require-only main skip with nonempty stdout is UNVERIFIED",()=>{const r=child("main-skipped","legacy.cjs","standalone","UNVERIFIED");assert(r.stdout.length);assert.equal(r.successfulAssertions,0);});
 test("Real AssertionError remains FAIL even with environment words in message",()=>{const r=child("assertion-failure","failure.cjs","standalone","FAIL");assert.equal(r.assertionEvidence.unhandledError.name,"AssertionError");});
 test("Exit0 plus fake PASS output cannot establish assertion execution",()=>child("empty","empty.cjs","standalone","UNVERIFIED"));
 test("Confirmed runtime exception is FAIL",()=>child("runtime","runtime.cjs","standalone","FAIL"));
 test("Implicit nested Git show compatibility preserves exact pinned bytes",()=>{const r=child("git-compatible","git.cjs","standalone","PASS");assert.equal(r.assertionEvidence.gitCompatibility.calls.length,1);});
 test("Without compatibility the same Git read remains ENOBUFS / UNVERIFIED",()=>{const r=child("git-original","git.cjs","standalone","UNVERIFIED",{policy:{gitCompatibility:false}});assert.equal(r.assertionEvidence.unhandledError.code,"ENOBUFS");});
 test("Explicit Git buffer and non-Git buffer are unchanged",()=>{const r=child("buffer-isolation","explicit.cjs","standalone","PASS");assert.equal(r.assertionEvidence.gitCompatibility.calls.length,0);});
 test("Timeout cannot be converted to PASS",()=>{const r=child("timeout","timeout.cjs","standalone","UNVERIFIED",{policy:{timeoutMs:500}});assert.equal(r.spawnError.code,"ETIMEDOUT");});
 test("Spawn failure retains actual command and cannot PASS",()=>{const r=child("spawn","main.cjs","standalone","UNVERIFIED",{nodeExecutable:path.join(dir,"missing-node.exe")});assert.equal(r.spawnError.code,"ENOENT");});
 test("Positive observed assertions do not legitimize empty exported summary",()=>child("zero-summary","zero.cjs","exported-run","UNVERIFIED"));
 test("Failed exported summary stays FAIL",()=>child("caught-failure","caught.cjs","exported-run","FAIL"));
 test("Unobserved asynchronous assert API is UNVERIFIED",()=>{const r=child("async-unsupported","async.cjs","standalone","UNVERIFIED");assert.equal(r.assertionEvidence.assertions.unsupportedAsync,1);});
 test("Partial synchronous evidence cannot hide an unsupported asynchronous check",()=>{const r=child("mixed-unsupported","mixed.cjs","standalone","UNVERIFIED");assert.equal(r.successfulAssertions,1);});
 const customSpec=name=>({sourceSha256:A.hash(fs.readFileSync(path.join(dir,name))),functionName:"verify",expectedCount:2,functionFragment:"function verify(condition){if(!condition)throw Error('Custom assertion');}\n"});
 test("Reviewed custom checker is witnessed through V8, with no source rewrite",()=>{const r=child("custom","custom.cjs","standalone","PASS",{customAssertion:customSpec("custom.cjs")});assert.equal(r.customCheckerInvocations,2);assert.equal(r.successfulAssertions,0);});
 test("Printed custom PASS without verify invocations is UNVERIFIED",()=>child("custom-empty","custom-empty.cjs","standalone","UNVERIFIED",{customAssertion:customSpec("custom-empty.cjs")}));
 test("Unreviewed custom source is UNVERIFIED",()=>child("custom-unreviewed","custom.cjs","standalone","UNVERIFIED",{customAssertion:{...customSpec("custom.cjs"),sourceSha256:"invalid"}}));
 test("No automatic export function guessing",()=>{assert.throws(()=>R.runSuite({file:relative(path.join(dir,"export.cjs")),evidencePath:A.prefix+label+"-invalid-mode.json"}),/entry mode/);});
 test("Existing evidence refuses execution before a second child starts",()=>{const c=cases[0];assert.throws(()=>R.runSuite({file:c.row.file,entryMode:"standalone",evidencePath:c.evidencePath}),/Existing evidence/);});
 test("Protected or escaping target is refused",()=>{assert.throws(()=>R.runSuite({file:"tests/fast-check-smoke-test.cjs",entryMode:"standalone",evidencePath:A.prefix+label+"-protected.json"}),/protected/);assert.throws(()=>R.runSuite({file:"../outside.cjs",entryMode:"standalone",evidencePath:A.prefix+label+"-outside.json"}),/Outside/);});
 test("NOT RUN carries no invented command/exit/assertions",()=>{const r=R.notRun({file:"never-started",entryMode:"standalone"});assert.equal(r.status,"NOT RUN");assert.equal(r.actualCommand,null);assert.equal(r.assertionEvidence,null);});
 test("Invalid witness / changed sources cannot PASS",()=>{const base=cases[0].row,w=base.assertionEvidence,result={status:0,error:null,signal:null,stdout:"PASS",stderr:""};assert.equal(R.classify(result,w,"wrong","standalone").status,"UNVERIFIED");assert.equal(R.classify(result,w,w.nonce,"standalone",false).status,"UNVERIFIED");});
 test("Per-suite limits preserve first-base exception without global inflation",()=>{assert.equal(R.policy("other").timeoutMs,120000);assert.equal(R.policy("tests/first-base-receive-active-ground-production-integration-test.js").timeoutMs,180000);assert.equal(R.policy("other").outputMaxBuffer,16000000);assert.equal(R.policy("other",{timeoutMs:500}).timeoutMs,500);});
 const summary={total:checks.length,passed:checks.filter(c=>c.status==="PASS").length,failed:checks.filter(c=>c.status==="FAIL").length};
 A.capture(label+"-focused",{summary,cases:cases.map(c=>({name:c.name,expected:c.expected,status:c.row.status,assertions:c.row.successfulAssertions,evidencePath:c.evidencePath})),checks,fixtureDirectory:relative(dir),fixtureHashes:Object.fromEntries(Object.keys(sources).map(n=>[relative(path.join(dir,n)),A.hash(fs.readFileSync(path.join(dir,n)))])),safety:A.integrity()});
 console.log(JSON.stringify({label,...summary,childProcesses:cases.length}));if(summary.failed)process.exitCode=1;return{summary,cases,checks};
}
module.exports={run};if(require.main===module)run(process.argv[2]||"development-1");
